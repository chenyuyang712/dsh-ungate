# 图标 / 横幅绘制提示词

给画图 AI 的提示词。产出两件东西：市场横幅 `docs/banner.svg`（或 PNG）与插件图标 `docs/icon.png`。

## 1. 横幅 banner（仓库 README 顶部 + 市场展示）

- 规格：1280×400（导出 PNG）或等比 SVG；深色背景 #0d1117（GitHub 暗色友好）。
- 主体文字：`dsh-ungate`（大号，等宽字体如 JetBrains Mono / Space Grotesk），下方小字 `只做减法的 DSH 破甲发行版 · Subtraction-only jailbreak distribution`。
- 视觉意象：一把**开着的挂锁 / 断开的锁链 / 被拆掉一格的闸门**，象征"拆闸"而不是"加锁"；避免骷髅、匕首等攻击性符号（会被平台压热度）。
- 点缀：几条发光的青色 (#22d3ee) / 琥珀色 (#f59e0b) 线路沿字面流动，代表"20 层自检全绿"。
- 中文提示词：
  > 横幅设计，1280×400，深色 GitHub 风格背景 #0d1117，中央大号等宽字标题「dsh-ungate」，副标题「只做减法的 DSH 破甲发行版」，左侧一把打开的发光挂锁图标，青色与琥珀色霓虹细线从锁孔延伸到标题字面，极简、扁平、工程感，无骷髅无武器，留白充足，矢量插画风
- 英文提示词：
  > wide banner 1280x400, dark GitHub-style background #0d1117, big monospace title "dsh-ungate", subtitle "subtraction-only jailbreak distribution", an open glowing padlock icon on the left, cyan and amber neon wires flowing from the keyhole into the letters, minimal flat engineering aesthetic, no skull no weapons, generous whitespace, vector illustration

## 2. 插件图标 icon（市场条目 / 面板角标）

- 规格：512×512 PNG（导出一份 128×128）。
- 主体：一把**开锁状态的挂锁** + 内部一个通电的「√」或流向箭头；底色深色圆角方块，锁体描边青色。
- 中文提示词：
  > 应用图标 512x512，深色圆角方块底，中央一把打开的挂锁，锁梁弹开呈青色霓虹描边，锁孔内一个绿色对勾，极简扁平图标风格，边缘留白，暗色背景下高对比，无文字
- 英文提示词：
  > app icon 512x512, dark rounded-square background, an open padlock in the center, shackle popped open with cyan neon outline, a green checkmark inside the keyhole, minimal flat icon style, generous padding, high contrast on dark background, no text

## 3. 放置

- banner → `docs/banner.svg`（SVG 直接画，或 PNG 转 SVG 外壳）；README 三份（README.md / README.zh-CN.md / docs/README.en.md）已经引用 `docs/banner.svg`，替换文件即可，无需改文档。
- icon → `docs/icon.png`；若市场索引日后支持 icon 字段，把 128×128 的绝对 URL（raw.githubusercontent）填进 `market/index.json` 的条目。
