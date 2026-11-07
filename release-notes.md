# 0.2.2

> 2026-11-07 · `dsh-ungate` 0.2.2

修一个**注入几乎全丢**的严重缺陷：0.2.1 及更早版本会把 `prompt-inject.md` 里被 `<!-- redteam-only:begin -->` / `<!-- redteam-only:end -->` 包住的正文整段删除，而绝大多数用户的正文正是这么写的——实测主实例 32479 字节的注入正文，最终只发出 **922 字节**。

## 变更

- **后端 update 链整体退役**：`lib/update*.js`（更新控制器/下载/镜像/代理/密钥）、`/dsh-purge/update` 路由与 11 个 update 测试套件删除；status 不再有 `update` 字段，升级只走插件市场或手动安装，快照与回滚只走 CLI（`purge backup` / `purge rollback <id>`）。
- `modePromptText()` 不再删段：改为**去标记、留正文**（`unwrapRedteamOnlySections`）。本 fork 没有红队模式可判，所以正文应当全部到模型。
- `withoutRedteamOnlySections()` 保留导出但不再用于注入路径，注释写明它是旧语义、调用它会吃掉用户正文。
- 探针语义不变：`purge probe new` 仍是证明"注入到达模型"的手段；这次修的正是它此前查不出的那一类。

## 验证

- 主实例（home `/home/kali/.dsh`）：`[inject.read]` 由 `rawBytes=32448 outBytes=922` 变为 **`outBytes=32371`**。
- 模型侧取证（`DSH_HOME=/home/kali/.dsh-iso`，`dsh --profile headless` 真调用）：要求复述正文第 20000 字节处的英文原句，模型逐字返回 `Progress status lines are body text rendered in the UI in real time; …`。
- `node --test`（449 项）与 `pnpm run check:docs` 通过；`pnpm run test:ui` 与面板 bundle 校验通过。

# 0.2.1

> 2026-11-07 · `dsh-ungate` 0.2.1（原 `dsh-purge-minimal`）

这是一次**身份变更**，功能仍然是那 27 条补丁与 20 层自检。改名的原因：`purge` 读起来像批量删宿主代码，`minimal` 读起来像某个分支的变体，两者都不适合作为独立发行版的发行身份。

## 变更

- 包名 `dsh-purge-minimal` → `dsh-ungate`；仓库更名为 `youki258/dsh-ungate`（GitHub 旧链会自动跳转）。
- 插件在 `cordis.patch.yml` 里的 id 仍是 `dsh-purge`：已装用户的配置、提示词、规则、`$DSH_HOME/dsh-purge/*` 全部不动。
- 数据目录保持 `$DSH_HOME/dsh-purge-minimal/`：包名变了但目录名不变，**不做任何自动迁移**——项目不写用户 home 的目录结构。
- 兼容读取：`dsh-purge-minimal` 仍被安装识别、回滚依赖名与卸载清理逻辑接受，方便旧安装平滑升级。
- **撤回 0.2.0**：那一版曾内置数据目录自动改名（`$DSH_HOME/dsh-ungate/`），已删除并从发行页撤下——用户的 home 目录结构不属于发行版该动的东西。
- 面板标题从 `Purge` 改为 `Ungate`；命令行 `purge` 不变。
- 发行包排除 `docs/upstream/`（实测 1.1M / 170 文件，上游归档命中 0）。

## 验证

- `pnpm test`：533 项，0 失败（509 通过 / 24 跳过）。
- `pnpm run check:docs`：通过。
- 面板 bundle 校验、打包内容断言（`.github/workflows/ci.yml` 同款）。

## 升级路径

桌面/Web 面板里装旧版 → 换新 tgz 或 npm 包 → 点「应用」→ 退出重开 → `selfcheck`。数据目录（`$DSH_HOME/dsh-purge-minimal/`）原地沿用，不会移动或改名。

# 0.1.3

> 2026-11-07 · `dsh-ungate` 0.1.3 · 已实测宿主不变：DSH Desktop 0.2.1-rc.1 / rc.2 / rc.3 / rc.5，0.2.2-rc.1 仅 web / npm CLI 面

这一版对齐 DSH 官方插件规范，并把 README 重写成本发行版自己的叙事。

## 变更

- `package.json` 补官方字段：`engines.dsh`（宿主安装与启动时的版本门禁）、`dsh.manifestVersion: 1`、`dsh.bundle.listedByDefault: true`。此前只有 `@deepseek-ai/cordis` peer，而宿主不计入该 peer，等于没有版本约束。
- `engines.dsh` 取值 `>=0.2.1-rc.1 <0.3.0 || >=0.2.2-rc.1 <0.3.0`：第二段是为了让 0.2.2 的预发布版本参与匹配（SemVer 预发布按三元组对齐）；未验证版本仍可用宿主的 `allow-version --accept-risk` 豁免。
- README 重写：首屏来源声明、五层模型、30 秒上手、兼容矩阵、更新策略（交给宿主）、文档地图。`README.zh-CN.md` 与英文 README 同步。
- 新增 `docs/VERIFY.md`：0.2.2-rc.1 web 面的逐环节证据与边界说明。
- 发行包链接从 `/releases/latest/download/` 固定文件名改为 `/releases/download/v0.1.3/` 版本化路径。

## 验证

- `pnpm test`：533 项，0 失败（509 通过 / 24 跳过）。
- `pnpm run check:docs`：通过（版本、兼容声明、补丁条数、残留引用、安装示例）。
- `node packages/purge-panel/scripts/build.mjs --community --check`：bundle 与源码一致。

## 已知限制

- 桌面壳 0.2.2-rc.1 的换包流程未验证；web 面已跑通安装→应用→重启→自检。
- tgz 手工安装的副本在插件管理器中不可自动更新，升级需换新 tgz。

# 0.1.2

> 2026-11-06 · 主干：`dsh-ungate` 0.1.2 · 已实测 DSH Desktop 0.2.1-rc.1 / rc.2 / rc.3 / rc.5

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

- `pnpm test`：533 项，508 通过 / 24 跳过 / 0 失败（干净环境；从 DSH 会话里直接跑也不再受 profile 泄漏影响）。
- `pnpm run smoke`：打包 → 解包 → 无依赖启动 CLI → 导入 → 预设解析 → status，全部通过。
- `pnpm run check:docs`：通过。
- 面板 `node packages/purge-panel/scripts/build.mjs --community --check`：bundle 与源码一致。
- 本机实例（DSH 0.2.1-rc.3，web 面）：21/21 应用、6 不适用、`broken` 为空。

## 已知问题

- 0.2.2-rc.1 的实测结论尚未写进兼容表（见 [docs/STATE.md](docs/STATE.md#已知限制)）；在补齐前不要对外声称支持。
- 桌面换包（密封归档 → 解包）的真机验收只在 Linux 侧做过，Windows/macOS 交接受测试覆盖但与具体 Electron 版本强相关。

---

# 0.1.1

- 仓库迁到 [youki258/dsh-ungate](https://github.com/youki258/dsh-ungate)，插件身份与安装链接随之更新。
- 补丁表从社区版的 48 条压到 27 条：去掉渗透工具面、演练台与在线自更新相关的全部补丁与运行时。

# 0.1.0

- 从 [kingcharleslzy-ai/dsh-purge](https://github.com/kingcharleslzy-ai/dsh-purge) 的 minimal 分支切出首个独立发行版（原始项目：[YuJunZhiXue/dsh-purge](https://github.com/YuJunZhiXue/dsh-purge)）。
