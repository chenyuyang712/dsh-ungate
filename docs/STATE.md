# 当前状态（0.1.1）

> 最后更新：2026-11-06 · 由 `node scripts/check-docs.mjs` 与全量测试验证

## 这是什么

Purge Minimal：以 dsh-purge 社区分支 1.6.82 为基线的精简发行版。保留"解锁类"宿主补丁与红队模式全套，剥离会改变原生行为的 11 条补丁（hooks 否决、rewind 改写、悬挂锚点自愈、`ask_user` 超时）。

## 关键数字

| 项 | 值 |
| --- | --- |
| 版本 | `0.1.1` |
| 宿主补丁 | 75 条（基线 86 条，剥离 11 条） |
| 自检层 | 23 层（web 宿主会额外标 1 层 na） |
| 已验证宿主 | DSH Desktop 0.2.2-rc.1 / 0.2.1-rc.1 / rc.2 / rc.3 / rc.5 |
| 测试 | 569 tests / 545 pass / 0 fail / 24 skip |
| CLI | `purge <op>`（`bin/community.js`，文件名不变） |
| 包名 | `dsh-purge-minimal` |

## 剥离清单（11 条，勿误加回）

| 补丁 | 原能力 | 影响 |
| --- | --- | --- |
| #30 / #31 / #64 / #65 | hooks 否决旁路 | 恢复官方 hooks 语义；`cordis.patch.yml` 的 `hooksDenyBypass` 已改回 `false` |
| #56 / #58 / #75 / #77 | 回退（rewind）改写 | 恢复原生回退路径 |
| #87 / #88 | 悬挂锚点自愈 | 不再静默改写宿主文件；改用 `diagnose` + `reanchor` 显式处理 |
| #89 | `ask_user` 超时上限 | 恢复原生等待语义 |

## 保留的关键补丁

`#55` 系统提示头替换、`#67` 消息兜底、`#68` 系统节点 content 兜底、`#69` 模型流释放、`#72` 当前系统消息、`#74` assemble 前置钩子、`#90` 原生 steering 恢复，以及全部解锁类（审批/沙箱/fs 围栏/结果修剪/计划模式）补丁。

## 已知限制

- 在线更新默认关闭：`PURGE_UPDATE_REPO` 未设置时 `applyUpdate` 直接抛错，防止被上游 release 覆盖。需要更新时手动下载新 tgz 走 `purge migrate <tgz>`。
- 宿主补丁必须重启宿主才加载；`purge toggle` 只改宿主补丁面，不动全局 shim。
- web 宿主没有 `cordis.patch.yml` 时，自检的「当前 profile 的权限选择」层会显示 `unknown`（不是缺陷）。
- 红队工具依赖 Node ≥ 22.5 的 `node:sqlite`。

## 验证入口

```sh
node scripts/check-docs.mjs       # 文档与版本一致
pnpm test                         # 全量测试
node packages/purge-panel/scripts/build.mjs --community --check   # 面板 bundle 与源码一致
purge selfcheck --json            # 逐层证据
```
