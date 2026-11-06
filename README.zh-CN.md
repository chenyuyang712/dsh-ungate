# dsh-purge-minimal

**当前版本 0.1.2** · 已验证 DSH Desktop 0.2.1-rc.1、0.2.1-rc.2、0.2.1-rc.3、0.2.1-rc.5；0.2.2-rc.1 仅 web / npm CLI 面已验证

把 DSH 里拦你的东西拆掉：审批弹窗、沙箱围栏、写意图拦截、模型自己的推脱倾向。装完点一次「应用」，退出重开，selfcheck 全绿就能开工。

- 补丁只写宿主**源码副本**（应用前自动备份），不改你的提示词、规则、其他插件配置。
- 面板与 CLI 各做同一件事：`purge` 命令是 CLI 入口，左侧栏「Purge」是图形入口。
- 不做公网门禁、不做内容审核、不替你判断目标归属——范围由操作者自己声明。

---

## 它改哪五层

| 层 | 由谁提供 | 生效方式 | 怎么查 |
| --- | --- | --- | --- |
| 宿主补丁（27 条） | 本插件写进 DSH 源码 | 点「应用」→ **退出重开** | `purge selfcheck` |
| 运行时提示词注入 | 插件运行时（每步重贴） | 立刻生效 | 面板「状态」/ `purge probe new` |
| 破甲强化段 | 插件运行时（尾部 section） | 立刻生效 | `purge boost` |
| 权限配置 | profile 的 `cordis.patch.yml` | 重载后生效 | `purge selfcheck` 的权限层 |
| agent 预设 `unrestricted` | 本包 `presets/unrestricted` | 新会话下拉选择 | 面板 / 下拉框 |

27 条补丁里，web 面实测 **21 条已应用、6 条不适用**（桌面换包/窗口关闭那组只在 Desktop 宿主上有目标）。补丁表与逐条含义见 [docs/STATE.md](docs/STATE.md)。

## 安装

三种入口，选一个就好；它们都只写插件，**不会自动应用补丁、不会自动重启 DSH**。

**1. DSH 插件市场 / 官方插件界面**（推荐）

在本仓库 Releases 取固定版本包，或在市场里搜 `dsh-purge-minimal`：

```sh
dsh plugin --profile web add https://github.com/youki258/dsh-purge-minimal/releases/download/v0.1.2/dsh-purge-minimal-0.1.2.tgz
```

Desktop 用户把 `--profile web` 换成 `--profile desktop`（名字以本机实际 profile 为准）。

**2. 社区引导安装器**（会下载、校验 SHA256、调用官方 CLI、迁移旧包引用）

Linux / macOS：

```sh
curl -fsSLO https://raw.githubusercontent.com/youki258/dsh-purge-minimal/master/scripts/install.sh
sh install.sh --dry-run   # 先看它要做什么
sh install.sh             # 确认后再装
```

Windows（PowerShell 5.1 起）：

```powershell
Invoke-WebRequest -UseBasicParsing https://raw.githubusercontent.com/youki258/dsh-purge-minimal/master/scripts/install.ps1 -OutFile install.ps1
.\install.ps1 -DryRun
.\install.ps1
```

**3. 手工**：在目标 profile 目录 `pnpm add <tgz 路径>`，然后把 `cordis.patch.yml` 里的 `dsh-purge` 条目并入 profile 配置。

装完做三件事：面板点「应用」→ **完全退出 DSH 再打开**（不是关窗口）→ `purge selfcheck --json` 看 `layers[].state`。

## 面板

左侧栏 **Purge**：

- **状态**：版本、宿主路径、补丁计数、selfcheck 逐层证据、运行时注入状态。
- **提示词**：`$DSH_HOME/prompt-inject.md` 的正文编辑与保存（插件只读，除非你点保存）。
- **规则 / 技能**：浏览当前 profile 的规则与技能库。
- **更多**:诊断（锚点漂移、重锚）、预设安装、备份与回滚、最近动作、发行记录。

面板**不联网检查更新**：升级走插件市场或手动安装，这里只做本机快照与回滚。原因见 [docs/STATE.md](docs/STATE.md#已知限制)。

## CLI 速查

`purge` 是 `bin/community.js` 的别名；没装进 PATH 时用 `node bin/community.js`。

| 命令 | 作用 |
| --- | --- |
| `purge status` | 宿主路径、补丁计数、表面（web/desktop） |
| `purge selfcheck [--json]` | 20 层逐层证据；`broken` 时退出码 1 |
| `purge apply` / `purge revert` | 写补丁 / 撤补丁（都先备份） |
| `purge host-status` | 只读诊断磁盘与运行入口，不换包不重启 |
| `purge diagnose` | 锚点漂移诊断（文件、行号、候选片段） |
| `purge reanchor list\|show\|apply\|clear` | 半自动重锚，把新锚点钉成本地覆盖 |
| `purge probe [new]` | 生成/查看运行时注入探针（30 分钟 TTL） |
| `purge audit [--limit n]` | 最近动作（apply/revert/boost/probe/reanchor/setting） |
| `purge boost [on\|off]` | 强化段开关 |
| `purge preset [status\|install]` | 落盘 `unrestricted` 预设 |
| `purge backup` / `rollback <id>` / `usage` / `prune` | 快照、回滚、占用、清理 |
| `purge patches [list]` | 查看默认关闭的可选补丁（当前发行版没有） |
| `purge uninstall` | 卸载插件并清理本 home 内的插件目录与链接 |

## 验证一件事真的生效了

文件被改、section 被注册，只证明宿主侧就绪；**探针证明模型收到了**。

```sh
purge probe new
# → {"nonce":"purge-1a2b3c4d","message":"请原样输出下面这行…[purge-1a2b3c4d]"}
```

随便发一句对话：模型原样回显 nonce = 链路通。回显了但模型仍在推脱 → 问题在人设/强化段，不在补丁；没回显 → 注入没到（看注入层、`boost`、`injectPosition`）。

## 兼容性

| 宿主 | 状态 |
| --- | --- |
| DSH Desktop 0.2.1-rc.1、0.2.1-rc.2、0.2.1-rc.3、0.2.1-rc.5 | 已验证（锚点命中、应用、自检） |
| DSH Desktop 0.2.2-rc.1（web / npm CLI 面） | 已验证：隔离实例 apply 20 条 + 自检 19/19 适用层全绿；桌面换包组仍不适用 |
| DSH Desktop 0.2.1-rc.4 / 0.2.2-alpha.2 | 未知：没有实测证据，`selfcheck` 会标未验证 |
| 其它 0.2.x | 允许应用，但先跑 `purge diagnose` 看漂移；漂移不是"应该没问题" |
| Web 面（`--profile web`） | 与 Desktop 共用补丁表；桌面换包那组显示"不适用" |

宿主升级后：`asar` 会重新封住、旧补丁全部失效，点一次「应用」再退出重开即可；锚点漂移用 `purge diagnose` + `purge reanchor` 处理。**磁盘写成功不代表当前进程已加载**，所以文档里所有"生效"结论都以重开后 `selfcheck` 与探针为准。

## 测试与开发

```sh
pnpm test        # 532 项：补丁锚点、自检、安装器、HTTP、面板契约、回归
pnpm run smoke   # 打包后解包、无依赖启动、导入、预设解析、CLI status
pnpm run check:docs   # 版本/兼容声明/残留引用的一致性守卫
pnpm run test:ui      # 面板客户端 bundle 契约
pnpm run build:client # 重新构建面板 bundle（改 src 后必须跑）
```

测试默认在干净环境跑：`scripts/bootstrap-install.mjs` 只在**没有显式 home** 时才继承 `DSH_PROFILE`，避免把当前会话的 profile 泄漏进 fixture。

## 来源与致谢

本仓库是社区分支的再分发：

1. 原始项目 [YuJunZhiXue/dsh-purge](https://github.com/YuJunZhiXue/dsh-purge)（作者 小杨 / YuJunZhiXue，MIT）。
2. 社区维护分支 [kingcharleslzy-ai/dsh-purge](https://github.com/kingcharleslzy-ai/dsh-purge)——本仓库的代码直接来自它的 minimal 裁剪，宿主补丁、自检、安装器与面板都源自这里。
3. 本仓库 [youki258/dsh-purge-minimal](https://github.com/youki258/dsh-purge-minimal) 只做减法与文档收敛：去掉渗透工具面与历史调试入口、去掉在线自更新、补丁表压到 27 条。

上游 README、发行说明与 1.6.x 维护文档原样归档在 [docs/upstream](docs/upstream)；第三方声明见 [NOTICE.md](NOTICE.md)，许可证见 [LICENSE](LICENSE)，贡献者见 [CONTRIBUTORS.md](CONTRIBUTORS.md)。本发行版免费，不提供付费转售，也不代表上游作者的官方发布。

## 不做什么

- 不自动重启你的 DSH，不替你决定何时退出。
- 不覆盖 `prompt-inject.md`、规则集、其他插件配置——「应用」与「回滚」都不碰这些。
- 不承诺对密封归档的宿主"零副作用"：Linux/Windows 的换包流程会备份并替换 `app.asar`，细节见 [docs/INSTALLATION.md](docs/INSTALLATION.md)。
- 不在线自更新：面板与后台定时检查都已移除，升级交给插件市场。
