# AGENTS.md — 给 AI agent 的 Purge Minimal 使用说明书

> 写给**在 DSH 里干活的 agent**，不是营销文档。
> 当前版本：**0.1.2** · 已实测宿主：DSH Desktop 0.2.1-rc.1、0.2.1-rc.2、0.2.1-rc.3、0.2.1-rc.5；DSH Desktop 0.2.2-rc.1 仅 web / npm CLI 面（桌面换包组未验）
> 版本号与兼容声明由 `pnpm run check:docs` 对照 `package.json` 校验。

---

## 0. 30 秒版本

- 这个插件（`dsh-purge-minimal`）拆掉 DSH 里**拦你**的东西：审批弹窗、沙箱拒绝、写意图拦截、计划模式硬拦、工具结果修剪、以及模型自己的拒绝倾向。
- 入口只有两个：**面板（左侧栏 Purge）** 和 **CLI（`purge`）**。不要手改宿主目录里的文件——下一次「应用」会覆盖。
- 安装 ≠ 应用 ≠ 加载：装完要点「应用」，然后**完全退出 DSH 再打开**，最后用 `selfcheck` + 探针证明。

## 1. 心智模型：五层

| 层 | 由谁提供 | 生效方式 | 怎么查 |
| --- | --- | --- | --- |
| 宿主补丁（27 条定义） | 本插件写进宿主源码副本 | 应用 → 退出重开 | `purge selfcheck` |
| 运行时提示词注入 | 插件运行时，每步重贴 | 立即 | 面板状态 / `purge probe` |
| 破甲强化段 | 运行时尾部 section | 立即 | `purge boost` |
| 权限配置 | profile 的 `cordis.patch.yml` | 重载后 | selfcheck 权限层 |
| agent 预设 | `presets/unrestricted` | 新会话选择 | 预设下拉 |

web 面实测：21 条已应用 + 6 条不适用（桌面换包/关窗那组没有 web 目标）。补丁表见 [STATE](STATE.md)。

## 2. 生命周期

```
安装插件 → 点「应用」（备份 + 写宿主）→ 退出并重开 DSH → selfcheck 全绿 → 开工
```

什么时候要再点一次「应用」：DSH 官方更新后、插件升级后、新装了带工具面的插件、或发现模型又开始推脱。「应用」是幂等的，不确定就点它。

**不要**把"磁盘写成功"当成"当前进程已加载"：宿主模块只在启动时 import 一次。

## 3. CLI 参考

`purge` 是 `bin/community.js` 的别名；没进 PATH 时用 `node <插件目录>/bin/community.js`。裸 CLI 缺少实例信息时先显式指定 `DSH_HOME` 与 `PURGE_DSH_CLI`，否则自检只会报告 `unknown`。

| 命令 | 作用 | 备注 |
| --- | --- | --- |
| `purge status` | 宿主路径、补丁计数、surface | 0 |
| `purge selfcheck [--json]` | 20 层逐层证据 | `broken` → 退出码 1 |
| `purge apply` / `revert` | 写补丁 / 撤补丁 | 交互式；都先备份 |
| `purge host-status` | 只读磁盘布局与运行入口 | 0，须读 `state` |
| `purge diagnose [--json]` | 锚点漂移诊断（行号 + 候选片段） | 0 |
| `purge reanchor list\|show\|apply <id> [--index n] [--lines a-b] [--yes]\|clear <id>` | 半自动重锚 | 覆盖存本地 |
| `purge probe [new]` | 生成/查看注入探针 | 30 分钟 TTL |
| `purge audit [--limit n]` | 最近动作 | 含 `refusal_retry` |
| `purge boost [on\|off]` | 强化段开关 | 写 tuning |
| `purge inject head\|tail\|both` | 注入位置 | 下一轮生效 |
| `purge preset [status\|install]` | 落盘 `unrestricted` | 只放文件不会出现在下拉里 |
| `purge backup` / `rollback <id>` / `usage` / `prune` | 快照 / 回滚 / 占用 / 清理 | 回滚走 tgz 安装 |
| `purge retry [on\|off]` | 拒绝检测 + 单次重试 | 默认 off |
| `purge patches [list]` | 可选补丁清单 | 当前发行版没有 opt-in 补丁 |
| `purge uninstall` | 卸载并清理本 home 内的插件目录与链接 | 不动外部源码 |

自检状态语义：`ok`（已确认）、`pending`（待应用）、`inferred`（宿主推导，黄）、`unknown`（证据不足，黄）、`broken`（确认故障）。**pending 不是故障**，点一次「应用」即可。

## 4. 探针：证明注入真的到了模型

```sh
purge probe new
# → {"nonce":"purge-1a2b3c4d","message":"请原样输出下面这行…[purge-1a2b3c4d]"}
```

发一句话让模型回显：回显 = 链路通；回显但仍在推脱 = 人设/强化段问题；不回显 = 注入没到（看注入层、`boost` 是否被关、`injectPosition`）。

## 5. 症状 → 动作

| 症状 | 先跑 | 判读 | 动作 |
| --- | --- | --- | --- |
| 补丁数不是 21/27（web 面） | `selfcheck --json` | 看 `layers[].state` | pending → 应用；broken → `diagnose` |
| 全部 `missing_file` | `status` | `ai_base` 为空 | 宿主未解包：点应用 → 重开 |
| 模型开始推脱 | `probe new` | 是否回显 | 回显→调人设/强化段；不回显→查注入层 |
| 工具被拒绝执行 | `selfcheck` | 审批/沙箱层是否绿 | 绿 → 属工具自身限制；红 → 点应用 |
| DSH 刚更新过 | `status` | `asar_still_sealed` | 点应用 → 重开 → selfcheck |
| 面板版本与磁盘不一致 | 面板黄条 | 界面与后端版本不同 | 核对磁盘与运行版本，按 INSTALLATION 重装 |
| 想撤销一切 | — | — | `revert`（只撤补丁）/ `rollback <id>`（回滚插件） |

## 6. 状态与文件

| 路径 | 内容 |
| --- | --- |
| `$DSH_HOME/prompt-inject.md` | **用户的注入正文**，插件只读，除非用户点保存 |
| `$DSH_HOME/dsh-purge/tuning.json` | `{boost, injectPosition, askNoBlock, refusalRetry, extraPatches}` |
| `$DSH_HOME/dsh-purge/probe.json` | 探针 nonce（30 分钟 TTL） |
| `$DSH_HOME/dsh-purge/anchor-overrides.json` | 本地重锚覆盖（删掉即恢复出厂锚点） |
| `$DSH_HOME/dsh-purge-minimal/audit.jsonl` | 动作审计（1MB 轮转，保留 2 份） |
| `$DSH_HOME/dsh-purge/applied.json` · `installed-rev` | 上次应用的插件版本 |
| `$DSH_HOME/dsh-purge-minimal/backups/<id>/` | 快照（`manifest.json` + 小文件，大文件在 `objects/`） |
| `$DSH_HOME/.agent-presets/unrestricted/` | 无限制模式预设 |

**不变量**：`prompt-inject.md`、规则集、其他插件配置，任何时候都不该被「应用」或「回滚」覆盖。

## 7. 补丁表：27 条

- 定义在 `lib/core.js` 的 `ALL_PATCHES`；每条 = `{id, name, layer, file, replacements:[{pattern, replace}], markers, optional?}`。
- `pattern` 是对宿主源码的精确片段（允许为多个宿主版本准备多条候选），`markers` 判断"已应用"。
- 新增一条的规矩：在 `targetFiles()` 登记文件键 → `replace` 留 `[dsh-purge]` 标记并写进 `markers` → 在 `test/patch-anchors.test.mjs` 钉真实片段 → 第三方目标用 `optional: true`。
- 宿主升级后锚点漂移：`diagnose` 给出文件、行号、旧锚点首行与候选落点；确认后 `reanchor apply <id> --lines A-B`（先看 dry-run），加 `--yes` 写入。

## 8. 预设 `unrestricted`

- 是 standard 的超集，工具面一致，只改人设：执行优先、不重复声明边界、多轮不退化。
- 由 `lib/presets-plugin.js` 注册到 `agentPresets`（**只放文件不会出现在下拉里**）。
- 安装：`purge preset install`；回归卡：`docs/preset-test.md`。
- 它不是"额外破甲"：破甲靠宿主补丁与注入，预设只改人格。

## 9. 版本与兼容

| 组件 | 值 |
| --- | --- |
| 插件 | `dsh-purge-minimal` 0.1.2 |
| 已验证宿主 | DSH Desktop 0.2.1-rc.1、0.2.1-rc.2、0.2.1-rc.3、0.2.1-rc.5 |
| 已验证宿主（限定 web / npm CLI 面） | DSH Desktop 0.2.2-rc.1：apply 20 + selfcheck 19/19 适用层；桌面换包/关窗组不适用 |
| 未验证 | 0.2.1-rc.4、0.2.2-alpha.2（selfcheck 标未验证，不猜） |
| 其它宿主 | 允许应用，先看 `diagnose`；漂移不等于"应该没问题" |
| Node | ≥18 |

宿主的 app.asar 必须用 `diskFs()` 读取；普通 Node 自检通过不等同于 Electron 运行时通过。

## 10. 面板接口（给排查用）

| 接口 | 用途 |
| --- | --- |
| `GET /dsh-purge/status` | 版本、宿主、补丁计数、`update` 段（本版固定 `disabled`） |
| `GET /dsh-purge/selfcheck` | 20 层证据 |
| `GET /dsh-purge/community` | 快照列表、最近动作、发行记录 |
| `POST /dsh-purge/apply` / `revert` / `boost` / `tuning` | 写操作（带 token） |
| `POST /dsh-purge/maintenance` | backup / rollback / prune |

token 在服务启动日志里（`sudo grep -aoE "token=[A-Za-z0-9_-]+" <log> | tail -1`）。不要把 token、提示词、profile 配置贴进公开 issue。

## 11. 安装失败排查（精简）

1. 确认入口：DSH 官方插件界面/市场，或该实例的 `dsh plugin --profile <名称> add <固定版本 tgz>`；不要 `npm i -g`，也不要在没初始化 profile 的 home 上装。
2. `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` 先看是否同时报 `version not present in registry manifest`；是则比较镜像与 npm 官方元数据，只对明确的公开镜像做一次 scoped registry 重试。
3. `fetch failed` 不等于发行包没上传：按 metadata / archive / checksum 三段定位，瞬时 408/429/5xx 最多两次。
4. 失败时保留日志与快照，用 `rollback <id>` 恢复；不要把失败说成成功，不要自动重启。
5. 版本核对以 `package.json` 与 `release-notes.md` 为准。

安装器测试与完整桌面/宿主验收分开记录，不混为"全部功能已验证"。

## 12. 测试入口

```sh
pnpm test            # 532 项
pnpm run smoke       # 打包后验证（pnpm 环境自动回退）
pnpm run check:docs  # 版本/兼容/残留引用一致性
pnpm run test:ui
```

`scripts/bootstrap-install.mjs` 只在**没有显式 home** 时继承 `DSH_PROFILE`：这样从任何 DSH 会话里跑测试都不会把当前 profile 泄漏进 fixture。真机验收（Electron、Windows 换包）另用隔离实例，不能拿组件测试冒充。

## 13. 文档维护规则

- 发版必须同步：本文件首部版本行、§9 表格、`package.json` 的 `version` / `dshReleases` / `dshTarget`、`release-notes.md` 首行。
- `check:docs` 还会拦截：上游 1.6.x 残留、已删除功能（渗透工具面、历史调试入口、hooks 拦截旁路）的死引用、没有实测支撑的 `DSH Desktop x.y.z` 声明、发行包链接版本不一致。
- 上游历史资料只在 `docs/upstream/`；当前文档以本文件为准，与 README 冲突时先改 README 再改这里。
