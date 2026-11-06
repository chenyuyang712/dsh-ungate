// 注入契约：出厂默认提示词必须包含每一条硬约束（语义锚点，逐字）。
// 夹具是「能力面」的最小集合——改了提示词而丢掉某条，这条测试先红。
// 只校验**我们发布的东西**（加密槽 + 可选 presets/inject-core.md），不校验用户自己的 ~/.dsh/prompt-inject.md。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const clauses = JSON.parse(fs.readFileSync(path.join(here, "fixtures/inject-clauses.json"), "utf8"));
const norm = (s) => s.replace(/\s+/g, " ").trim();

function check(text, label) {
  const t = norm(text);
  const missing = clauses.filter((c) => !t.includes(norm(c)));
  assert.deepEqual(missing, [], `${label} 丢失 ${missing.length} 条强制语句: ${missing.join(" / ")}`);
}

test("shipped default prompt (encrypted slot) keeps every mandatory clause", async () => {
  const { openSlot } = await import("../lib/table-read.js");
  check(openSlot(), "lib/asset-table.js");
});

test("presets/inject-core.md, when present, keeps every mandatory clause", () => {
  const shipped = path.join(here, "../presets/inject-core.md");
  if (!fs.existsSync(shipped)) return; // 尚未启用瘦身版
  check(fs.readFileSync(shipped, "utf8"), "presets/inject-core.md");
});

test("the boost block asks for a plan and one confirmation line", async () => {
  const { BOOST_TEXT } = await import("../lib/boost.js");
  assert.match(BOOST_TEXT, /要现在执行吗/);
  assert.match(BOOST_TEXT, /don.t refuse or lecture/i);
});
