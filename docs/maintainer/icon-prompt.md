# 图标与横幅

源文件就是 SVG，改视觉直接改这三份。

## 资产

| 文件 | 规格 | 用途 |
| --- | --- | --- |
| `docs/icon.svg` | 512×512 | 插件 icon：深色圆角底 + 蓝紫渐变挂锁，锁梁逆时针抬起呈开锁态；市场索引日后支持 icon 字段时填 raw.githubusercontent 绝对 URL |
| `docs/banner.svg` | 1280×400 | 浅色主题横幅：左 icon + `dsh-ungate` 大标题 + 副题「宿主补丁发行版 · 27 条补丁 · 20 层自检」+ 等宽小字 `apply → reopen → selfcheck → probe` |
| `docs/banner-dark.svg` | 1280×400 | 深色主题横幅，同一构图深色配色 |

## 接线

README 两份（`README.md` / `docs/README.en.md`）头部用 `<picture>` + `prefers-color-scheme` 在 banner.svg 与 banner-dark.svg 间自动切换；换图只替换 SVG 文件，无需改文档。

## 设计参数（供后续改版）

- 底色：dark `#0b0e1a→#141031`，light `#f5f7fb→#e8ecf6`；icon 底 `#0e1220→#1c1440` 圆角 rx=112。
- 锁体渐变 `#5b8cff→#6f7bff→#9a5cff`，锁梁 `#7fd0ff→#5b8cff`；light 版锁体 `#4d6bfe→#8b4dff`。
- 开锁几何：锁梁 path `M176 262 V168 a80 80 0 0 1 160 0 V262`（stroke 34，round cap），整组 `rotate(-16 176 262)`——逆时针抬起右臂，端点悬在锁体顶面上方；顺时针会插回锁体变成闭合锁。
- 字体：标题 ui-sans-serif/system-ui 700，等宽行 ui-monospace；无骷髅、无武器符号。
