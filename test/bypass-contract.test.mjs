// 破甲契约：源码补丁只剩「必须改宿主 JS 才生效」的那几条，其余能力已改走
// cordis 官方扩展点（bundle patch 配置覆盖 + 运行时 hook，见 cordis.patch.yml 与
// lib/exec-hooks.js）。这里锁定留下来的补丁指纹：任何人改动它们，CI 直接红——
// 要动必须先说明理由并更新指纹。
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { ALL_PATCHES, patchEnabled } from "../lib/core.js";

const GATE_FINGERPRINTS = {
  // 系统提示词必须是「每步用当前整段替换第一条」，否则模型读到的是首轮快照。
  55: "a55a1c0da3a71c67",
  // agent loop 的两个兜底：messages / systemNodes 字段缺失时不许抛错中断回合。
  67: "1cb9cbbaf23fb2d8",
  68: "2590e742617f1242",
  // 每模式首发送前挂默认提示词。
  74: "2e5edb8467b40230",
  // deepseek-flash 恢复官方 in-history / Messages 的 system 用当前提示词。
  69: "a6205b41daad7962",
  72: "1dd090df0b8ac9fa",
  // 沙箱策略与技能徽章去品牌（只改文案，不改放行语义）。
  61: "c175ed1d70acf41d",
  93: "fc28a7f5b75204ca",
};

function fingerprint(patch) {
  const shape = JSON.stringify({
    name: patch.name,
    replacements: (patch.replacements || []).map((r) => ({
      p: String(r.pattern).slice(0, 400),
      r: String(r.replace).slice(0, 400),
    })),
  });
  return crypto.createHash("sha256").update(shape).digest("hex").slice(0, 16);
}

test("surviving source patches exist with unchanged semantics", async () => {
  const byId = new Map(ALL_PATCHES.map((p) => [p.id, p]));
  const problems = [];
  for (const id of Object.keys(GATE_FINGERPRINTS).map(Number)) {
    const patch = byId.get(id);
    if (!patch) problems.push(`#${id} missing`);
  }
  assert.deepEqual(problems, [], problems.join("; "));
});

test("no source patch removes the approval, fs or sandbox gate any more", async () => {
  // 这几条曾直接改写宿主门禁函数体；0.1.2 起改用 approval/request 与
  // fs/write-intent hook + bundle patch 配置覆盖，源码里不该再出现它们。
  for (const id of [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 34, 35, 59, 60, 63]) {
    assert.equal(
      ALL_PATCHES.find((p) => p.id === id),
      undefined,
      `#${id} must not come back as a source patch — use a hook or a config override`,
    );
  }
});

test("quality-reducing patches are not shipped back as opt-ins", () => {
  // #18/#19 关闭的是上下文保护（重复调用提醒、工具结果修剪），不是门禁。
  // 0.1.2 起它们不再随包分发；这条测试防止有人顺手恢复。
  for (const id of [18, 19]) {
    const patch = ALL_PATCHES.find((p) => p.id === id);
    assert.equal(patch, undefined, `#${id} must not ship: it disables context protection`);
  }
  assert.equal(typeof patchEnabled, "function");
});
