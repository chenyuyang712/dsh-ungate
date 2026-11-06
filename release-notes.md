# 0.1.2

> 2026-11-06 · 主干：`dsh-purge-minimal` 0.1.2 · 已实测 DSH Desktop 0.2.1-rc.1 / rc.2 / rc.3 / rc.5

这一版只做减法与收敛：把上一轮 fork 留下的半成品删干净，让代码、面板、文档说的是同一件事。

## 移除

- **hooks 否决旁路整条线**：`lib/hooks-deny.js`、`/dsh-purge/hooks-deny` 接口、面板「高级选项」区块、`hooks_deny_bypass` 状态字段、`tuning` 里的开关、以及状态里那 4 个幽灵补丁 id（30/31/64/65）。此前 `STATE.md` 声称这四条已恢复官方语义，代码里却仍可一键翻回——现在两边一致：不存在。
- **演练台（drill）残留**：`lib/drill-grant.js`、`/dsh-purge/drill-grant` 路由、卸载流程里的清理分支、面板欢迎语里的"演练台"、预览截图与 `screenshots.json` 条目。
- **面板与后台的在线更新**：`检查更新` / `自动检查` / 更新通道对话框 / 定时检查全部移除。面板「维护」只剩本机快照、回滚、最近动作与发行记录，并明确写清"升级走插件市场"。原因见 [docs/STATE.md](docs/STATE.md#已知限制)：本 fork 没有可安装的在线源，保留一个永远失败的按钮只会让状态页常年见红。
- **上游历史资料出仓面**：`docs/releases/1.6.x`、上游维护说明与 DSH Store 文档归档到 `docs/upstream/`，不再混在当前文档里。
- 仓库根目录的 `audit.jsonl`、`backups/`、`objects/`、`pkgs/` 历史产物（D15 迁移前遗留，且已被 gitignore）。

## 变更

- `PATCH_DISPLAY_GROUPS` 只保留仍存在的死分组：`desktop_update [45,46]`、`desktop_close [83,84]`；状态里的补丁总数重新对得上（27 条定义，web 面 21 应用 + 6 不适用）。
- `scripts/bootstrap-install.mjs`：只有**没有显式 home** 时才继承 `DSH_PROFILE`。此前从任意 DSH 会话里跑测试，当前 profile 会泄漏进 fixture，导致 3 项误报 `Profile is not initialized`。
- `scripts/smoke.mjs`：npm 缺席时回退 pnpm；`cordis.patch.yml` 的校验不再要求已删除的条目。
- `package.json`：`description` 改成本发行版真实定位；`install.tarball` 指向固定版本 `releases/download/v0.1.2/...`（原先钉在 `/latest/` 下的固定文件名，永远解析不到新包）；去掉 `cordis.patch.yml` 里已失效的 `hooksDenyBypass`。
- 预设 `unrestricted`：去掉对补丁 `#76` / `#24` 的引用（这两条早已不存在），改为描述当前由 profile `system-prompt` 配置承担的语义。
- 文档收敛：README / AGENTS / INSTALLATION / MAINTENANCE / RUNBOOK / STATE / 英文 README 全部重写为 0.1.2 单一真相。`check-docs` 同时校验版本、兼容声明、发行包链接，并拦截上游 1.6.x 与已删除功能的死引用。

## 验证

- `pnpm test`：532 项，508 通过 / 24 跳过 / 0 失败（干净环境；从 DSH 会话里直接跑也不再受 profile 泄漏影响）。
- `pnpm run smoke`：打包 → 解包 → 无依赖启动 CLI → 导入 → 预设解析 → status，全部通过。
- `pnpm run check:docs`：通过。
- 面板 `node packages/purge-panel/scripts/build.mjs --community --check`：bundle 与源码一致。
- 本机实例（DSH 0.2.1-rc.3，web 面）：21/21 应用、6 不适用、`broken` 为空。

## 已知问题

- 0.2.2-rc.1 的实测结论尚未写进兼容表（见 [docs/STATE.md](docs/STATE.md#已知限制)）；在补齐前不要对外声称支持。
- 桌面换包（密封归档 → 解包）的真机验收只在 Linux 侧做过，Windows/macOS 交接受测试覆盖但与具体 Electron 版本强相关。

---

# 0.1.1

- 仓库迁到 [youki258/dsh-purge-minimal](https://github.com/youki258/dsh-purge-minimal)，插件身份与安装链接随之更新。
- 补丁表从社区版的 48 条压到 27 条：去掉渗透工具面、演练台与在线自更新相关的全部补丁与运行时。

# 0.1.0

- 从 [kingcharleslzy-ai/dsh-purge](https://github.com/kingcharleslzy-ai/dsh-purge) 的 minimal 分支切出首个独立发行版（原始项目：[YuJunZhiXue/dsh-purge](https://github.com/YuJunZhiXue/dsh-purge)）。
