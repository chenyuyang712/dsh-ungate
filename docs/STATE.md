# 当前状态（0.1.2）

> 最后更新：2026-11-06 · 由 `node scripts/check-docs.mjs` 与全量测试验证

## 这是什么

Purge Minimal：以 dsh-purge 社区分支 1.6.82 为基线的精简发行版。目标是把**对 DSH 宿主源码的改写面**压到最小，同时保留「所有操作都无限制」的能力。内置红队演练台已移除。

## 关键数字

| 项 | 值 |
| --- | --- |
| 版本 | `0.1.2` |
| 宿主补丁 | **27 条**（基线 86 条；其余能力走 cordis 配置覆盖与运行时 hook） |
| 宿主 `.js` 被改文件 | 约 15 个（0.1.0 时为 41 个） |
| 自检层 | 20 层（15 补丁层 + hook + override + runtime + config + layout） |
| 已验证宿主 | DSH Desktop 0.2.2-rc.1 / 0.2.1-rc.1 / rc.2 / rc.3 / rc.5 |
| 测试 | 514 tests / 491 pass / 0 fail / 23 skip |
| CLI | `purge <op>`（`bin/community.js`，文件名不变） |
| 包名 | `dsh-purge-minimal` |

## 三条实现路径（0.1.2 的架构）

| 路径 | 内容 | 位置 | 热生效 |
| --- | --- | --- | --- |
| 配置覆盖 | sandbox-policy / approval / permission / bash-sandbox / tool-fs / subagent / session-log-deepseek / system-prompt | 本包 `cordis.patch.yml`（同 id 覆盖宿主行） | 是（profile patch 层由 HMR 监听） |
| 运行时 hook | `approval/request → allowed-once`、`fs/write-intent` / `fs/edit-intent → undefined`、`tools/pre-execute → next()` | `lib/exec-hooks.js` | 是（插件重载即生效） |
| 源码补丁 | 27 条，见 `docs/STATE.md#保留的补丁` / `purge patches` | `lib/patches/` | 否（需重启宿主） |

## 保留的 27 条补丁

`25` 系统提示身份剥离、`29` 外部网页内容去 untrusted、`33` shell 拒绝话术、`36` fs 升级字段、`37` 子代理权限锁、`40` complete 预设保留注入、`42` 设置旧 API、`45/46` 桌面升级接管、`48` shell 删除/移动话术、`55` 系统提示头替换、`57` developer role 白名单、`61` 沙箱只读策略不拦任务、`66` 渲染兜底、`67` 决策消息兜底、`68` 系统节点兜底、`69` 模型流释放、`72` 当前系统消息、`74` assemble 前置钩子、`82/83/84` 桌面启动兜底、`90` 原生 steering 恢复、`91` cookie 名忽略端口、`92` 请求头上限、`93` 沙箱策略去品牌、`94` 技能徽章去品牌。

## 已删除的补丁（勿误加回）

| 补丁 | 原能力 | 现替代 |
| --- | --- | --- |
| #30 / #31 / #64 / #65 | hooks 否决旁路 | 无（恢复官方语义） |
| #56 / #58 / #75 / #77 | 回退（rewind）改写 | 无（恢复原生路径） |
| #87 / #88 | 悬挂锚点自愈 | `diagnose` + `reanchor` 显式处理 |
| #89 | `ask_user` 超时上限 | 无（恢复原生等待） |
| #5 / #9 / #10 / #11 / #12 | 审批自动放行（源码补丁） | `lib/exec-hooks.js` 的 `approval/request` hook + `approval.policy: ask` |
| #17 | fs 观察策略放行 | `fs/write-intent` / `fs/edit-intent` hook |
| #59 | auto-review 软拦直通 | `tools/pre-execute` hook |
| #7 / #8 / #21 / #22 / #23 / #43 / #51 / #52 / #63 / #70 / #73 / #76 / #80 / #24 / #26 / #4 | 纯配置类（补丁改宿主 .yml） | 本包 `cordis.patch.yml` 同 id 覆盖 |
| #6 / #13 / #14 / #15 / #16 / #34 / #35 | 沙箱围栏/升级链 | danger-full-access 模式下宿主原生即无围栏 |
| #1 / #2 / #3 / #28 / #32 / #38 / #39 / #47 / #49 / #50 / #53 / #54 / #60 / #62 / #71 / #18 / #19 | 提示词话术、第三方兼容、可选上下文开关 | 删除（部分由 `lib/identity.js` 的运行时正则中和兜底） |

## 已知限制

- 在线更新默认关闭：`PURGE_UPDATE_REPO` 未设置时 `applyUpdate` 直接抛错，防止被上游 release 覆盖。需要更新时手动下载新 tgz 走 `purge migrate <tgz>`。
- 源码补丁必须重启宿主才加载；`purge toggle` 只改补丁面，不动全局 shim。
- web profile 目录没有 `cordis.patch.yml` 是正常环境（只读 web profile 本来就不写这一层）：此层以运行时 `permissionPresets` 报出的值为准，读取错误只作为 `error` 字段保留，不改变结论。
- hook 与配置失效是静默的：自检的 `hook` / `override` 两层就是用来把静默失败变成红灯的。
- 手动把权限切成 workspace-write 会恢复官方沙箱围栏（这是设计选择，不是缺陷）。

## 验证入口

```sh
node scripts/check-docs.mjs       # 文档与版本一致
pnpm test                         # 全量测试
node packages/purge-panel/scripts/build.mjs --community --check   # 面板 bundle 与源码一致
purge selfcheck --json            # 逐层证据
```
