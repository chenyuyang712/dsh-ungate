// Self-check must answer "is this layer really in place?" without a live desktop,
// so the pure parts (runtime inject / profile policy / layer roll-up) are testable.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { selfCheck, rollupLayers, BYPASS_LAYERS } from "../lib/selfcheck.js";
import { OBSERVATION_POLICY_PATCH } from "./fixtures/observation-policy-patch.mjs";
import { ALL_PATCHES, patchStatus } from "../lib/core.js";

function fakeHome() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-selfcheck-"));
  const profile = path.join(home, "profiles", "desktop");
  fs.mkdirSync(profile, { recursive: true });
  fs.writeFileSync(path.join(profile, "package.json"), JSON.stringify({ name: "p" }));
  return { home, profile, close: () => fs.rmSync(home, { recursive: true, force: true }) };
}

test("an empty home reports the layers as missing instead of pretending they are live", async () => {
  const f = fakeHome();
  const prevProfile = process.env.DSH_PROFILE;
  const prevSurface = process.env.DSH_SURFACE;
  process.env.DSH_PROFILE = "desktop";
  process.env.DSH_SURFACE = "desktop";
  try {
    const report = await selfCheck(path.join(f.home, "no-host"), f.home);
    assert.equal(report.ok, false);
    assert.equal(report.host_version, "unknown");
    assert.equal(report.layers.filter(l => l.title !== "其他必需目标文件").length, BYPASS_LAYERS.length + 5); // + hook / override / runtime / config / layout
    const runtime = report.layers.find((l) => l.kind === "runtime");
    assert.equal(runtime.ok, false, "empty inject must not pass");
    const config = report.layers.find((l) => l.kind === "config");
    assert.equal(config.ok, false, "default profile policy must not pass");
    assert(report.hints.length > 0);
  } finally {
    process.env.DSH_PROFILE = prevProfile ?? "";
    if (prevProfile === undefined) delete process.env.DSH_PROFILE;
    if (prevSurface === undefined) delete process.env.DSH_SURFACE;
    else process.env.DSH_SURFACE = prevSurface;
    f.close();
  }
});

test("runtime inject and profile policy are detected from the real files", async () => {
  const f = fakeHome();
  const prevProfile = process.env.DSH_PROFILE;
  const prevSurface = process.env.DSH_SURFACE;
  process.env.DSH_PROFILE = "desktop";
  process.env.DSH_SURFACE = "desktop";
  try {
    fs.writeFileSync(path.join(f.home, "prompt-inject.md"), "<|im_start|>system:\nMODE: TEST\n");
    fs.writeFileSync(
      path.join(f.profile, "cordis.patch.yml"),
      [
        "- id: permission-presets",
        "  config:",
        "    presets:",
        "      danger-full-access:",
        "        sandbox: danger-full-access",
        "        approval: never",
        "    defaultPreset: danger-full-access",
        "",
      ].join("\n"),
    );
    const report = await selfCheck(path.join(f.home, "no-host"), f.home);
    const runtime = report.layers.find((l) => l.kind === "runtime");
    assert.equal(runtime.ok, true);
    assert(runtime.detail.bytes > 0);
    const config = report.layers.find((l) => l.kind === "config");
    assert.equal(config.ok, true);
    assert.equal(config.detail.preset, "danger-full-access");
    assert.equal(config.detail.approval, "never");
  } finally {
    process.env.DSH_PROFILE = prevProfile ?? "";
    if (prevProfile === undefined) delete process.env.DSH_PROFILE;
    if (prevSurface === undefined) delete process.env.DSH_SURFACE;
    else process.env.DSH_SURFACE = prevSurface;
    f.close();
  }
});

test("pending patches are not reported as broken layers", () => {
  // 61 待应用、25 已应用 → 这一层是 pending，不是 broken
  const pending = rollupLayers({ 61: "pending", 25: "applied" }, true);
  const layer = pending.find((l) => l.ids.includes(61));
  assert.equal(layer.state, "pending");
  assert.equal(layer.ok, false, "still not green, but not a failure");
  assert.deepEqual(layer.pending, [61]);
  assert.deepEqual(layer.broken, []);

  // 锚点对不上才是真的坏
  const broken = rollupLayers({ 61: "pattern_not_found", 25: "applied" }, true);
  const bad = broken.find((l) => l.ids.includes(61));
  assert.equal(bad.state, "broken");
  assert.equal(bad.broken[0].id, 61);

  // 目标插件没装 → 不适用，不算坏
  const absent = rollupLayers({ 61: "na", 25: "na" }, true);
  const na = absent.find((l) => l.ids.includes(61));
  assert.equal(na.state, "ok");
  assert(na.note.includes("不适用"));
});


test("missing host information is unknown, never a red patch failure or an all-green report", () => {
  const layers = rollupLayers({}, false);
  assert(layers.every(l => l.state === "unknown" && !l.ok && l.broken.length === 0));
});

test("standalone JSON and text distinguish uncertainty from a confirmed policy mismatch in exit codes", () => {
  const f = fakeHome();
  const env = {...process.env,DSH_HOME:f.home,DSH_PROFILE:"desktop"};
  delete env.DSH_BASE;delete env.PURGE_DSH_CLI;delete env.PURGE_PROFILE_DIR;
  fs.writeFileSync(path.join(f.home,"prompt-inject.md"),"fixture");
  try {
    for (const format of ["--json","--text"]) {
      const unknown=spawnSync(process.execPath,["bin/community.js","selfcheck",format],{env,encoding:"utf8"});
      assert.equal(unknown.status,0,unknown.stderr);
      assert(!unknown.stdout.includes("所有层都在位"));
      if(format==="--json")assert.equal(JSON.parse(unknown.stdout).state,"unknown");
    }
    fs.writeFileSync(path.join(f.profile,"cordis.patch.yml"),"- id: permission\n  config:\n    defaultPreset: workspace-write\n    presets:\n      workspace-write:\n        sandbox: workspace-write\n        approval: ask\n");
    for (const format of ["--json","--text"]) {
      const mismatch=spawnSync(process.execPath,["bin/community.js","selfcheck",format],{env,encoding:"utf8"});
      assert.equal(mismatch.status,1,mismatch.stderr);
    }
  } finally {f.close();}
});

test("real selfCheck tally keeps missing required files visible and excludes only proven exceptions",async()=>{
  const f=fakeHome();
  const {ALL_PATCHES}=await import("../lib/core.js");
  try {
    const states=Object.fromEntries(ALL_PATCHES.map(p=>[p.id,"applied"]));
    const selected=ALL_PATCHES.find(p=>p.settleWhenAbsent);
    const required=ALL_PATCHES.filter(p=>!p.optional&&!p.settleWhenAbsent);
    const spare=required.filter(p=>p.id!==selected.id).slice(0,2);
    states[spare[0].id]="missing_file";
    states[spare[1].id]="pending";
    states[selected.id]="skipped";
    const report=await selfCheck(path.join(f.home,"host"),f.home,{env:{},argv:[],coreModule:{ALL_PATCHES,patchStatus:async()=>states}});
    assert.equal(report.patch.missing_file,1);
    assert.equal(report.patch.total,ALL_PATCHES.length-1);
    assert.equal(report.patch.applied,ALL_PATCHES.length-3);
    assert.equal(report.patch.not_applicable,1);
    assert.equal(report.state,"broken");
    assert(report.layers.some(l=>l.pending.includes(spare[1].id)));
    assert(!report.layers.some(l=>l.broken.some(b=>b.id===selected.id)));
    const na=Object.fromEntries(ALL_PATCHES.map(p=>[p.id,"na"]));
    const empty=await selfCheck(path.join(f.home,"host"),f.home,{env:{},argv:[],coreModule:{ALL_PATCHES,patchStatus:async()=>na}});
    assert.equal(empty.patch.total,0);
    assert.equal(empty.patch.not_applicable,ALL_PATCHES.length);
  } finally {f.close();}
});

test("absent optional targets, disabled checks and unknown states retain distinct counts", async()=>{
  const {tallyPatchStatus}=await import("../lib/selfcheck.js");
  const patches=[{id:1},{id:2,optional:true},{id:3},{id:4},{id:5,settleWhenAbsent:true}];
  assert.deepEqual(tallyPatchStatus({1:"missing_file",2:"missing_file",3:"off",5:"skipped",4:"disabled"},patches),
    {applied:0,total:1,all:5,na:0,skipped:1,missing_file:2,off:1,disabled:1,not_applicable:4,partial:0});
});

test("observation policy requires every active method in each host layout", async () => {
  const { patchApplied } = await import("../lib/core/shared.mjs");
  const patch = OBSERVATION_POLICY_PATCH;
  const [write, check] = patch.replacements;
  const edit = "\teditIntent(target, actor) {\n\t\t// [dsh-purge] observation bypass: edits are unconditional (no read-first gate).\n\t\treturn void 0;\n\t}";
  const delegations = ["edit", "delete"].map(verb => '\t' + verb + 'Intent(target, actor) {\n\t\treturn this.requirePresent(target, actor, "' + verb + '");\n\t}');
  const policy = (...methods) => ["var ObservedStateGate = class {", ...methods, "};"].join("\n");
  const old = policy(write.replace, edit);
  const modern = policy(write.replace, ...delegations, check.replace);
  for (const full of [old, modern]) {
    assert.equal(patchApplied(full, patch), true);
    assert.equal(patchApplied(full.replaceAll("\n", "\r\n"), patch), true);
  }
  for (const partial of [
    policy(write.pattern, edit), policy(write.replace), policy(write.replace, "/*"+edit+"*/"),
    policy(write.replace, ...delegations, check.pattern), policy(write.pattern, ...delegations, check.replace),
    policy(write.replace, delegations[0], check.replace), policy(write.replace, edit, check.replace),
    old.replace("return void 0;", "return this.get(actor, target);"), modern + "\n" + modern,
    policy(write.replace, edit, "\teditIntent(other) { throw Error(); }"),
  ]) assert.equal(patchApplied(partial, patch), false);
});

test("apply refuses a partial observation rewrite and keeps the original bytes", async t => {
  const {applyPatches, patchStatusDetail} = await import("../lib/core.js");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "observation-transaction-"));
  const home = path.join(root, "home");
  const host = path.join(root, "node_modules/@deepseek-ai");
  const file = path.join(host, "dsh-fs-observation-policy/lib/index.js");
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.mkdirSync(home);
  t.mock.method(process, "cwd", () => root);
  const previous = process.env.DSH_HOME;
  process.env.DSH_HOME = home;
  t.after(() => {
    if(previous === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = previous;
    fs.rmSync(root, {recursive:true, force:true});
  });
  const patch = OBSERVATION_POLICY_PATCH;
  for (const write of [patch.replacements[0].pattern, patch.replacements[0].replace]) {
    const original = "var ObservedStateGate = class {\n" + write + "\n\teditIntent(target, actor) { throw Error(); }\n};";
    fs.writeFileSync(file, original);
    const [result] = await applyPatches(host, [patch]);
    assert.match(result.status, /incomplete_observation_policy|pattern_not_found/);
    const report = await patchStatusDetail(host, [patch], {dshHome:home,surface:"desktop"});
    assert.match(report.status[17], /pending|drifted/);
    assert.equal(fs.readFileSync(file, "utf8"), original);
  }
});

test("two applies compose branding and read-only changes on a clean or upgraded policy", async t => {
  const { applyPatches, patchStatusDetail, applyReplacementsToText } = await import("../lib/core.js");
  const root = fakeHome();
  t.after(() => root.close());
  const previous = process.env.DSH_HOME;
  process.env.DSH_HOME = root.home;
  t.after(() => { if (previous === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = previous; });
  const host = path.join(root.home, "node_modules/@deepseek-ai");
  const file = path.join(host, "dsh-sandbox-policy/lib/index.js");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const native = fs.readFileSync(new URL("./fixtures/sandbox-policy-rc5.js.txt", import.meta.url), "utf8");
  const patches = ALL_PATCHES.filter(p => [61,93].includes(p.id));
  const brand = patches.find(p => p.id === 93);
  const approval = patches.find(p => p.id === 61);
  const brandedOnly = applyReplacementsToText(native, brand, file).text;
  const approvalOnly = applyReplacementsToText(native, approval, file).text;
  assert.notEqual(brandedOnly, native);
  assert.notEqual(approvalOnly, native);
  for (const start of [native, brandedOnly, approvalOnly]) {
    fs.writeFileSync(file, start);
    for (let i = 0; i < 2; i++) {
      const rows = await applyPatches(host, patches);
      assert.ok(rows.every(r => ["already","applied"].includes(r.status)), JSON.stringify(rows));
      if (i) assert.ok(rows.every(r => r.status === "already"));
      const disk = await patchStatusDetail(host, patches, {dshHome:root.home,surface:"desktop"});
      assert.deepEqual(disk.status, {61:"applied",93:"applied"});
    }
  }
  const complete = fs.readFileSync(file,"utf8");
  for (const [partial,id] of [
    [complete.replace("Current file policy: workspace-write", "Current DSH file policy: workspace-write"),93],
    [complete.replace("approval is auto-granted", "unknown phrase"),61],
    [native + "\n/*\n" + complete + "\n*/",61],
  ]) {
    fs.writeFileSync(file,partial);
    assert.notEqual((await patchStatusDetail(host,patches,{dshHome:root.home,surface:"desktop"})).status[id],"applied");
  }
});

test("a clean rc.5 observation policy and either previously migrated half converge on two applies", async () => {
  const {applyReplacementsToText} = await import("../lib/core.js");
  const {patchApplied} = await import("../lib/core/shared.mjs");
  const p = OBSERVATION_POLICY_PATCH;
  const native = fs.readFileSync(new URL("./fixtures/observed-state-rc5.js.txt", import.meta.url), "utf8");
  const [write,,edit] = p.replacements;
  for (const start of [native, native.replace(write.pattern,write.replace), native.replace(edit.pattern,edit.replace)]) {
    assert.equal(patchApplied(start,p),false);
    const first = applyReplacementsToText(start,p);
    assert.equal(first.changed,true);
    assert.equal(patchApplied(first.text,p),true);
    const second = applyReplacementsToText(first.text,p);
    assert.equal(second.changed,false);
    assert.equal(second.text,first.text);
  }
});
