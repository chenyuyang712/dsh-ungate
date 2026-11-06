# 当前状态（0.1.2）

> 当前版本 **0.1.2** · 最后更新：2026-11-06
> 本文件记录"现在是什么"，不记录"以前是什么"。历史在 [release-notes.md](../release-notes.md) 与 [upstream](upstream/)。

## 这是什么

`dsh-purge-minimal`：给 DSH 解除审批、沙箱与拒绝倾向拦截的附加组件。宿主补丁 + 运行时注入 + 强化段 + 权限配置 + `unrestricted` 预设，五层叠加。安装、应用、加载是三个不同阶段，任何"已生效"的结论都必须来自重开后的 `selfcheck` 与探针。

## 补丁表（27 条定义）

web 面（`--profile web`）实测：**21 条已应用**、**6 条不适用**（`optional` 且目标文件在 web 宿主里不存在）。桌面换包/关窗那组只在 Desktop 宿主上有目标。

| id | 名称 | 层 | web 面 |
| --- | --- | --- | --- |
| 25 | HARNESS_IDENTITY_STRIP | 提示词 | 应用 |
| 29 | TOOL_WEB_UNTRUSTED_NEUTRAL | 工具 | 应用 |
| 33 | TOOL_SHELL_DENIAL_PROMPT | 提示词 | 应用 |
| 36 | TOOL_FS_ESCALATION_SCHEMA | 提示词 | 应用 |
| 37 | SUBAGENT_SCOPE_LOCK_NEUTRAL | 提示词 | 应用 |
| 40 | COMPLETE_PROMPT_KEEP_INJECT | 兼容 | 应用 |
| 42 | SETTINGS_LEGACY_API | 代码 | 应用 |
| 45 | OFFICIAL_DESKTOP_UPDATE_HANDOFF | 代码 | 不适用 |
| 46 | OFFICIAL_DESKTOP_UPDATE_ASCII | 代码 | 不适用 |
| 48 | TOOL_SHELL_DELETE_MOVE_NEUTRAL | 工具 | 应用 |
| 55 | SYSTEM_PROMPT_REPLACE_HEAD | 代码 | 应用 |
| 57 | DEEPSEEK_SYSTEM_ROLE | 代码 | 应用 |
| 61 | OFFICIAL_SANDBOX_POLICY_NEUTRAL | 提示词 | 应用 |
| 66 | SYSTEM_PROMPT_RENDER_GUARD | 代码 | 应用 |
| 67 | AGENT_LOOP_MESSAGES_GUARD | 代码 | 应用 |
| 68 | SYSTEM_NODES_CONTENT_GUARD | 代码 | 应用 |
| 69 | MODEL_STREAM_RELEASE | 代码 | 应用 |
| 72 | MESSAGES_SYSTEM_CURRENT | 代码 | 应用 |
| 74 | ASSEMBLE_BEFORE_PRESTEP | 代码 | 应用 |
| 82 | DESKTOP_SHELL_PROFILE_FALLBACK | 代码 | 不适用 |
| 83 | DESKTOP_HOST_CLOSE_NO_FATAL | 代码 | 不适用 |
| 84 | DESKTOP_HOST_CLOSE_CODE0_NO_FAIL | 代码 | 不适用 |
| 90 | RESTORE_NATIVE_STEERING | 代码 | 应用 |
| 91 | BROWSER_COOKIE_NAME_IGNORE_PORT | 代码 | 应用 |
| 92 | HOST_MAX_HTTP_HEADER_SIZE | 代码 | 不适用（仅桌面壳） |
| 93 | SANDBOX_POLICY_BRAND_NEUTRAL | 提示词 | 应用 |
| 94 | SKILL_BADGE_DESCRIPTION_NEUTRAL | 提示词 | 应用 |

- 定义在 `lib/core.js` 的 `ALL_PATCHES`；`optional: true` 表示目标缺席时记"不适用"而不是失败。
- 默认关闭的可选补丁：**无**。`test/opt-in.mjs` 与 `purge patches list` 都返回空清单。
- 逐条锚点与真机回归在 `test/patch-anchors.test.mjs`；宿主升级后的漂移用 `purge diagnose` 定位、`purge reanchor` 修复。

## 自检：20 层

`purge selfcheck` 报告 20 层，未指定实例时大部分是 `unknown`——这是设计，不是故障。web 面实际适用的 19 层（宿主磁盘布局层在 web 面不适用）。语义：

- `ok` 已确认 / `pending` 待应用 / `inferred`、`unknown` 证据不足（黄）/ `broken` 确认故障（退出码 1）。
- 面板写「19 层全部在位」是因为它在 web 面显示适用层数；命令行报告原始 20 层。两个数字都对，粒度不同。

## 已知限制

- **0.2.2-rc.1 只在 web / npm CLI 宿主上验证**：2026-11-06 在隔离实例（`DSH_HOME=/home/kali/.dsh-rc1`、端口 3082、宿主 `/tmp/dsh022`）跑通 apply（20 应用 + #90 已原生 + 6 不适用，零 failed）→ 重启 → selfcheck 20 层 19 ok + 1 不适用、21/21 补丁、零漂移。桌面壳（换包/关窗组 #45/#46/#82/#83/#84/#92）在该宿主上本来就 `surfaces:["desktop"]`，仍属未验证；`host_family` 报 `npm-cli`，不冒充 Desktop 家族。
- **没有在线更新**：本 fork 不发布可供 `PURGE_UPDATE_REPO` 使用的发行索引，`applyUpdate` 会直接抛"无在线更新源"。因此面板与后台的检查更新已移除，升级只走插件市场或手动安装。`GET /dsh-purge/status` 的 `update` 段固定为 `disabled`。
- **`purge selfcheck` 裸跑没有意义**：没有 `DSH_HOME` / `PURGE_DSH_CLI` 时宿主为空，会报 `unknown` 与 17 层不确定。先指定实例，再读结果。
- **桌面换包真机覆盖有限**：Linux 侧走过完整流程；Windows/macOS 依赖 Electron 版本，交接受单测覆盖但不等于实机验收。
- **rc.4 / 0.2.2-alpha.2 未验证**：允许应用，`selfcheck` 会标未验证；不要据此对外声称兼容。

## 已删除的功能（不要再加回来）

| 功能 | 删除理由 | 残留检查 |
| --- | --- | --- |
| hooks 拦截旁路（四条旧补丁 id 及其接口、面板区块、状态字段） | 与"恢复官方 hook 语义"的声明冲突，且一键就能把 deny/ask 翻成放行 | lib/ 与面板源码里应无该模块与接口 |
| 历史调试台（调试授权路由、模块、状态、欢迎语） | 只服务已删除的工具面 | lib/ 与面板源码里应无该模块与路由 |
| 面板/后台在线更新 | 没有可安装的在线源，按钮必然失败 | 面板维护页里应只有本机备份与回滚 |
| 上下文化可选补丁的两个开关 | 对应注入面已缩减，补丁不再存在 | `purge patches list` 返回空清单 |
| 渗透工具面与历史调试入口 | 本 fork 只保留宿主解闸能力 | `presets/` 只有 `unrestricted` |

## 状态落在哪

| 路径 | 内容 |
| --- | --- |
| `$DSH_HOME/prompt-inject.md` | 用户的注入正文（插件只读） |
| `$DSH_HOME/dsh-purge/tuning.json` | boost、injectPosition、askNoBlock、refusalRetry、extraPatches |
| `$DSH_HOME/dsh-purge/probe.json` | 运行时探针（30 分钟 TTL） |
| `$DSH_HOME/dsh-purge/anchor-overrides.json` | 本机重锚覆盖 |
| `$DSH_HOME/dsh-purge/applied.json` · `installed-rev` | 上次应用的插件版本 |
| `$DSH_HOME/dsh-purge-minimal/audit.jsonl` | 动作审计（1MB 轮转，保留 2 份） |
| `$DSH_HOME/dsh-purge-minimal/backups/` | 快照与对象（`manifest.json` + `objects/`） |
| `$DSH_HOME/.agent-presets/unrestricted/` | 无限制模式预设 |

## 本机参考实例

| 实例 | 地址 | DSH_HOME | 宿主版本 | 用途 |
| --- | --- | --- | --- | --- |
| 主实例 | 127.0.0.1:3080 | `/home/kali/.dsh` | 0.2.1-rc.3 | 日常使用与验收 |
| 隔离实例 | 127.0.0.1:3081 | `/home/kali/.dsh-iso` | 0.2.1-rc.3 | 改宿主/换包类改动先在它上面跑 |
