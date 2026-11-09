// 文档跟着版本走：版本号、发行说明首行、英文 README、AGENTS 与 docs/*.md 必须指向同一个 0.1.2 事实。
// 另外拦住三类历史漂移：上游 1.6.x 残留、已删除功能（红队/演练台/hooks 否决旁路）的死引用、
// 以及没有实测支撑的兼容性声明。CI 与本地 `pnpm run check:docs` 都跑它。
import fs from "node:fs";
import { checkInstallExamples } from "./lib/check-install-examples.mjs";

const read = (file) => fs.readFileSync(file, "utf8");
const pkg = JSON.parse(read("package.json"));
const version = pkg.version;
const notesFirst = read("release-notes.md").split("\n")[0].trim();
const readme = read("README.md");
const readmeZh = read("README.zh-CN.md");
const readmeEn = read("docs/README.en.md");
const agents = read("AGENTS.md");
const problems = [];

// 1) 中文 README 与主 README 完全一致：避免两份事实各自漂移。
if (readmeZh !== readme) problems.push("README.zh-CN.md 必须与 README.md 保持一致");

// 2) 版本号的首行锚点。
if (notesFirst !== `# ${version}`) problems.push(`release-notes.md 首行应为 "# ${version}"，实际是 "${notesFirst}"`);
if (!new RegExp(`当前版本[：:]\\s*\\*\\*${version.replaceAll(".", "\\.")}\\*\\*`).test(agents))
  problems.push(`AGENTS.md 缺少 "当前版本：**${version}**"`);
if (!agents.includes(`\`dsh-ungate\` ${version}`))
  problems.push(`AGENTS.md 版本表未同步到 ${version}`);

// 3) 当前事实文档：都写着同一个版本，且不再引用上游 1.6.x 或已删除功能。
const currentDocs = [
  "README.md", "README.zh-CN.md", "AGENTS.md", "release-notes.md", "NOTICE.md", "CONTRIBUTORS.md",
  "docs/INSTALLATION.md", "docs/MAINTENANCE.md", "docs/RUNBOOK.md", "docs/STATE.md",
  "docs/README.en.md", "docs/CLI.md", "docs/preset-test.md", "docs/DESKTOP-TEST.md",
];
for (const file of ["docs/INSTALLATION.md", "docs/MAINTENANCE.md", "docs/RUNBOOK.md", "docs/STATE.md"]) {
  if (!read(file).includes(`当前版本 **${version}**`)) problems.push(`${file} 当前版本未同步到 ${version}`);
}

// 当前文档里出现旧版本号或已删除的机制名，通常意味着整段没重写。
const forbidden = [
  [/1\.6\.\d+/, "上游 1.6.x 版本号"],
  [/全量 84|73\/76/, "旧的补丁总数说法"],
  [/红队|演练台|redteam/i, "已删除的红队/演练台"],
  [/drill/i, "已删除的 drill-grant"],
  [/hooks[- ]?deny|hooksDeny|否决旁路/i, "已删除的 hooks 否决旁路"],
  [/#76|#24\b|#18\/#19|enable 18,19/, "已不存在的补丁编号"],
  [/补丁 30 \/ 31 \/ 64 \/ 65/, "已删除的补丁编号组"],
];
// release-notes.md 天生要记录"删掉了什么"，所以只对现状文档做残留扫描。
for (const file of currentDocs.filter((f) => !["release-notes.md", "NOTICE.md"].includes(f))) {
  const doc = read(file);
  for (const [pattern, label] of forbidden) {
    const hit = doc.match(pattern);
    if (hit) problems.push(`${file} 仍有历史残留（${label}）：${hit[0]}`);
  }
}

// 4) 兼容性声明必须与 package.json 的 dshReleases 对得上，不能只写在 README 里。
const declared = pkg.dsh?.compatibility?.dshReleases || {};
const claimed = new Set();
for (const doc of [readme, readmeEn, agents]) {
  for (const line of doc.split("\n")) {
    // 只有"已验证/适配"这类断言才算声明；"未验证 0.2.1-rc.4"是在免责，不是在声称兼容。
    if (!/已验证|适配|Verified|verified/.test(line)) continue;
    for (const m of line.matchAll(/DSH Desktop ([0-9][0-9a-z.\-]*)/gi)) claimed.add(m[1]);
  }
}
for (const v of claimed) {
  if (!(v in declared)) problems.push(`文档声称验证过 DSH Desktop ${v}，但 package.json dshReleases 没有这一项`);
  else if (declared[v] !== "compatible") problems.push(`文档把 DSH Desktop ${v} 写成已验证，但 dshReleases 是 ${declared[v]}`);
}
if (!Object.values(declared).includes("compatible")) problems.push("dshReleases 里至少要有一条 compatible 实测");
if (!pkg.dshTarget) problems.push("package.json 缺少 dshTarget（当前主验证宿主）");
const targetRelease = String(pkg.dshTarget).split(/[\s(]/)[0];
if (targetRelease && !(targetRelease in declared)) problems.push(`dshTarget ${targetRelease} 不在 dshReleases 里`);

// 4b) 宿主门禁只认 engines.dsh；写了 compatible 的版本必须真的被它放行。
const dshRange = pkg.engines?.dsh || "";
if (!dshRange) problems.push("package.json 缺少 engines.dsh：宿主不会对插件做版本门禁");
else {
  let semver = null;
  try {
    semver = (await import("semver")).default ?? (await import("semver"));
  } catch {
    problems.push("缺少 semver（devDependency），无法核对 engines.dsh 与 dshReleases 的一致性");
  }
  if (semver)
    for (const [v, state] of Object.entries(declared))
      if (state === "compatible" && !semver.satisfies(v, dshRange))
        problems.push(`dshReleases 把 ${v} 标为 compatible，但 engines.dsh（${dshRange}）不放行它`);
}

// 5) 安装包链接必须指向当前版本，且 install.tarball 同源。
const tarball = pkg.dsh?.install?.tarball || "";
if (!tarball.includes(`/releases/download/v${version}/dsh-ungate-${version}.tgz`))
  problems.push(`package.json install.tarball 应指向 v${version} 的发行包，实际是 ${tarball || "(空)"}`);
for (const [file, doc] of [["README.md", readme], ["docs/README.en.md", readmeEn]]) {
  const links = [...doc.matchAll(/releases\/download\/v([0-9.]+)\/dsh-ungate-([0-9.]+)\.tgz/g)];
  if (!links.length) problems.push(`${file} 缺少固定版本的发行包链接`);
  for (const [, tag, archive] of links)
    if (tag !== version || archive !== version) problems.push(`${file} 发行包链接版本必须为 ${version}`);
}

// 6) 来源与致谢：README 必须写明本仓库来自 kingcharleslzy-ai/dsh-purge，NOTICE 保留上游归属。
if (!readme.includes("kingcharleslzy-ai/dsh-purge")) problems.push("README.md 缺少来源说明：kingcharleslzy-ai/dsh-purge");
if (!readme.includes("YuJunZhiXue/dsh-purge")) problems.push("README.md 缺少上游作者归属：YuJunZhiXue/dsh-purge");
// 7) 补丁条数是可核对的事实，不是形容词。
let patchCount = 0;
try {
  const core = await import("../lib/core.js");
  patchCount = core.ALL_PATCHES.length;
} catch (error) {
  console.warn(`! 跳过补丁条数核对：${error.message}`);
}
if (patchCount && !agents.includes(`${patchCount} 条`)) problems.push(`AGENTS.md 未写明当前补丁条数（${patchCount} 条）`);
if (patchCount && !readme.includes(`${patchCount} 条`)) problems.push(`README.md 未写明当前补丁条数（${patchCount} 条）`);

// 8) 可复制的安装示例：当前文档必须能被解析器读懂。
for (const file of currentDocs.filter((f) => f.endsWith(".md")))
  for (const problem of checkInstallExamples(read(file))) problems.push(`${file}: ${problem}`);

// 9) 中英 README 不能各自漂移：逐块比结构（标题层级、表格行数、代码块行数、列表项数）。
//    文字是翻译，形状必须一样——少一节、多一行表格都会失败。
const shape = (md) => {
  const lines = md.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      let n = 0; i++;
      while (i < lines.length && !/^```/.test(lines[i])) { n++; i++; }
      i++; blocks.push(`code${n}`); continue;
    }
    if (/^\|/.test(line)) {
      let n = 0;
      while (i < lines.length && /^\|/.test(lines[i])) { n++; i++; }
      blocks.push(`table${n}`); continue;
    }
    if (/^#{1,4}\s/.test(line)) {
      blocks.push(`h${line.match(/^#+/)[0].length}`); i++; continue;
    }
    if (/^\s*[-*]\s/.test(line)) {
      let n = 0;
      while (i < lines.length && /^\s*[-*]\s/.test(lines[i])) { n++; i++; }
      blocks.push(`ul${n}`); continue;
    }
    i++;
  }
  return blocks;
};
const zhShape = shape(readme);
const enShape = shape(readmeEn);
if (zhShape.join(",") !== enShape.join(",")) {
  const at = zhShape.findIndex((b, i) => b !== enShape[i]);
  problems.push(
    `README.md 与 docs/README.en.md 结构不一致（第 ${at + 1} 块：中文 ${zhShape[at] ?? "(结束)"} / 英文 ${enShape[at] ?? "(结束)"}）`
  );
}

if (problems.length) {
  console.error(`✗ 文档与 ${version} 的版本事实不一致：`);
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}
console.log(`✓ 文档一致：${version} · 补丁 ${patchCount || "?"} 条 · 已验证宿主 ${Object.entries(declared).filter(([, v]) => v === "compatible").map(([k]) => k).join(" / ")}`);
