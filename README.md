<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/banner-dark.svg">
    <img src="docs/banner.svg" alt="dsh-ungate" width="640">
  </picture>
</p>

<h1 align="center">dsh-ungate</h1>

<p align="center"><strong>DeepSeek Harness 的破甲发行版</strong>：27 条宿主补丁拆掉审批弹窗、沙箱拒绝、fs 围栏、计划模式硬拦与模型拒绝倾向；运行时提示词注入与 <code>unrestricted</code> 预设补齐人格层；<code>selfcheck</code> 与探针自证每一步。</p>

<p align="center">
  <a href="https://github.com/youki258/dsh-ungate/releases"><img src="https://img.shields.io/github/v/release/youki258/dsh-ungate?label=release" alt="Release"></a>
  <a href="https://github.com/youki258/dsh-ungate/stargazers"><img src="https://img.shields.io/github/stars/youki258/dsh-ungate?logo=github&label=Stars" alt="Stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat" alt="MIT"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=fff" alt="Node.js"></a>
  <img src="https://img.shields.io/badge/DSH-0.2.1--rc.x%20%2F%200.2.2--rc.1--web-blue" alt="DSH compatible">
</p>

<p align="center">
  <a href="README.zh-CN.md">中文</a> | <a href="docs/README.en.md">English</a>
</p>

## 来源

- 上游：[YuJunZhiXue/dsh-purge](https://github.com/YuJunZhiXue/dsh-purge)（小杨 / YuJunZhiXue，MIT）。
- 代码来自社区分支 [kingcharleslzy-ai/dsh-purge](https://github.com/kingcharleslzy-ai/dsh-purge) 的 minimal 裁剪；本仓库 [youki258/dsh-ungate](https://github.com/youki258/dsh-ungate) 在其上做减法与重写：去掉工具面与历史调试入口、去掉在线自更新、补丁表压到 27 条、文档收敛为单一事实。不是上游作者的官方发布。

---

## 它做什么

| 层 | 内容 | 生效方式 |
| --- | --- | --- |
| 宿主补丁 | 27 条定义，web 面 21 条落地、6 条仅桌面壳适用 | 点「应用」→ **完全退出 DSH 再打开** |
| 运行时提示词 | 每步重贴的注入正文（`$DSH_HOME/prompt-inject.md`） | 立即 |
| 强化段 | 尾部 section，默认开启 | 立即 |
| 权限配置 | `danger-full-access` + `approval: ask`（由你决定是否改） | 重载后 |
| agent 预设 | `unrestricted`，standard 的超集，只改人格 | 新会话下拉选择 |

不改动提示词正文、规则集与其他插件配置；不做内容审核与公网门禁，范围由操作者自己声明。

"应用"只写宿主源码副本并留备份；磁盘写成功 ≠ 当前进程已加载，结论以重开后的 `selfcheck` 与探针为准。

## 安装

三种入口任选其一，装完的生效步骤相同（应用 → 完全退出重开 → 自证）。

**方式一：官方 CLI + 固定版本 tgz（推荐）**

```sh
dsh plugin --profile web add https://github.com/youki258/dsh-ungate/releases/download/v0.2.3/dsh-ungate-0.2.3.tgz
```

**方式二：npm 包**

```sh
dsh plugin --profile web add dsh-ungate@0.2.3
```

**方式三：社区引导安装器**（备份迁移、旧包换装；先 `--dry-run` 审阅再执行）

```sh
sh scripts/install.sh --dry-run    # Linux/macOS
pwsh scripts/install.ps1 -DryRun   # Windows
```

**装完生效（三种方式相同）**

```sh
node bin/community.js apply     # 面板点「应用」等价；写宿主源码副本并留备份
# 完全退出 DSH（托盘退出 / ⌘Q，不是关窗口）再打开，然后自证：
node bin/community.js selfcheck --json   # state=ok、broken 为空
node bin/community.js probe new          # 发一句话看模型是否原样回显 nonce
```

- Desktop 用户把 `--profile web` 换成实际 profile 名（桌面壳默认 `desktop`）。
- **升级**：本包在插件管理器里属 `not-updatable`，换新版本重新 `plugin add` 一次即可，配置与提示词不受影响；每次宿主升级后 `asar` 重新封住，点一次「应用」再退出重开。
- **卸载**：`node bin/community.js uninstall`（只清理本 home 内插件目录与链接，不动提示词、规则集、其他插件配置）。
- 细节与失败排查见 [安装指南](docs/INSTALLATION.md)；桌面壳验收见 [桌面测试卡](docs/DESKTOP-TEST.md)。

## 兼容矩阵

| 宿主 | 面 | 结果 | 证据 |
| --- | --- | --- | --- |
| DSH Desktop 0.2.1-rc.1 / rc.2 / rc.3 / rc.5 | Desktop + Web | 已验证 | 锚点命中、apply、selfcheck 全绿 |
| DSH Desktop 0.2.2-rc.1 | Web / npm CLI | 已验证（apply 20 条 + 自检 19/19 适用层） | 隔离实例，见 [VERIFY](docs/VERIFY.md) |
| DSH Desktop 0.2.2-rc.1 | Desktop 壳 | 未验证：换包/关窗组 6 条为不适用，桌面流程未跑 | — |
| DSH Desktop 0.2.1-rc.4 / 0.2.2-alpha.2 | 任意 | 未验证，selfcheck 会标未验证 | — |
| 其它 0.2.x | 任意 | 允许应用，但先跑 `purge diagnose` 看漂移 | — |

`package.json` 的 `engines.dsh` 与宿主启动检查会拦下 0.3.x 及更早的 0.2.1-rc.0；未验证版本想强装，用宿主的 `dsh plugin --profile <n> allow-version <pkg@ver> --accept-risk`（豁免不随升级继承）。

## 面板与 CLI

左侧栏 **Purge**：状态（版本/宿主/补丁计数/逐层证据，按需展开）、提示词正文、更多（服务器名单、诊断与重锚、预设安装）。备份与回滚只走 CLI：`purge backup` / `purge rollback <id>`。

`purge` 是 `bin/community.js` 的别名，常用命令：

| 命令 | 作用 |
| --- | --- |
| `purge status` / `selfcheck [--json]` | 宿主与补丁概况 / 20 层逐层证据（broken → 退出码 1） |
| `purge apply` / `revert` | 写补丁 / 撤补丁（都先备份，幂等） |
| `purge diagnose` / `reanchor …` | 锚点漂移诊断 / 半自动重锚 |
| `purge probe [new]` | 运行时注入探针（30 分钟 TTL） |
| `purge backup` / `rollback <id>` / `usage` / `prune` | 快照 / 回滚 / 占用 / 清理 |

完整表见 [AGENTS.md §3](AGENTS.md)。

## 更新策略

升级走宿主，插件不自更新：

- **市场安装的**：DSH 插件市场或 `dsh plugin --profile <n> update` 升级，升级后点一次「应用」并重启。
- **tgz 手动装的**：新版 tgz 重新 `plugin add` 即完成升级（本包 `not-updatable`，重装就是升级方式），配置与提示词不受影响。
- **宿主升级后**：`asar` 重新封住、旧补丁全部失效——点一次「应用」，退出重开。

## 生效证明

```sh
purge probe new
# → {"nonce":"purge-1a2b3c4d","message":"请原样输出下面这行…[purge-1a2b3c4d]"}
```

模型原样回显 nonce = 注入链路通；回显了但仍在推脱 = 人设/强化段问题；不回显 = 注入没到（查注入层、`boost`、`injectPosition`）。

## 开发与测试

```sh
pnpm install --frozen-lockfile --allow-build=esbuild   # 面板构建需要 esbuild 的二进制
pnpm test              # 449 项：补丁锚点、自检、安装器、HTTP、面板契约、回归
pnpm run smoke         # 打包后：无依赖启动、模块导入、预设解析、status
pnpm run check:docs    # 版本/兼容声明/残留引用一致性
pnpm run test:ui       # 面板客户端 bundle 契约
pnpm run build:client  # 改面板源码后重建 bundle
```

测试在干净环境跑：`scripts/bootstrap-install.mjs` 只在没有显式 home 时才继承 `DSH_PROFILE`；真机验收（Electron、换包）用隔离实例单独跑。

CI 在 `.github/workflows/ci.yml`（Node 22/24 矩阵：`check:docs` → 面板 bundle 校验 → 面板契约 → 449 项测试 → 打包并断言包里不含 `docs/upstream/`）；`release.yml` 在 `v*.*.*` tag 上重复同一套检查、打包并建 release，带 fork 保险丝。

## 文档地图

| 文件 | 给谁看 |
| --- | --- |
| [AGENTS.md](AGENTS.md) | 在 DSH 里干活的 agent：CLI、症状树、补丁表、维护规则 |
| [docs/INSTALLATION.md](docs/INSTALLATION.md) | 安装、升级、回滚、故障定位 |
| [docs/STATE.md](docs/STATE.md) | 27 条补丁明细、20 层自检语义、已知限制 |
| [docs/VERIFY.md](docs/VERIFY.md) | 逐宿主验收证据（可复查的命令与输出） |
| [docs/RUNBOOK.md](docs/RUNBOOK.md) | 运维：重启、体检、恢复决策 |

## 许可与免责

MIT，见 [LICENSE](LICENSE)；第三方归属见 [NOTICE.md](NOTICE.md)；贡献者见 [CONTRIBUTORS.md](CONTRIBUTORS.md)。宿主补丁会修改 DSH 安装目录下的源码副本并替换归档；回滚用 `purge rollback <id>`，快照位置见 AGENTS.md §6。
