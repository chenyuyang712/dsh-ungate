# 验收记录（VERIFY）

> 当前版本 **0.2.1** · 只记录**实际跑过**的组合与可复查输出。没有记录的组合就是未验证，不推测。

## 0.2.2-rc.1 · web / npm CLI 面

环境：pnpm hoisted 安装树 `/tmp/dsh022/node_modules/@deepseek-ai`（`@deepseek-ai/dsh` 0.2.2-rc.1），全新 `DSH_HOME=/home/kali/.dsh-rc1`，`--profile web --port 3082`。

| 环节 | 命令 | 结果 |
| --- | --- | --- |
| 安装 | `pnpm add /tmp/dsh-ungate-0.1.2.tgz` | profile 内 `node_modules/dsh-ungate` 版本 0.1.2，bundle 已启用 |
| 应用前 | `GET /dsh-purge/status` | applied=1（#90 判据是"宿主已是原生插话行为"，pristine 宿主天然命中）、pending=20、na=6、total=21/all=27 |
| 应用 | `POST /dsh-purge/apply` | HTTP 200：applied=20、already=1、failed=0、complete=true、host_written=true；27 条 report 无 `pattern_not_found` / `hitMismatch` / `partial` |
| 幂等 | 再跑一次 apply | applied=0、already=21、failed=0 |
| 自检 | `GET /dsh-purge/selfcheck` | state=ok、broken=[]、uncertain=[]、patch 21/21（all 27、na 6）；20 层 = ok 19 + na 1（宿主磁盘布局层在 web 面不适用） |
| CLI 交叉 | `DSH_HOME=… PURGE_DSH_CLI=… node bin/community.js selfcheck --json` | exit 0、patch 21/21、broken=0；state=unknown 属预期（CLI 看不到运行时 hook 层） |
| 漂移 | `diagnose --json` | checked=21、drifted=[]、optionalDrift=[]、missing=[]、desktop_entry=not_desktop |
| 服务可用 | `GET /` | 200，`<title>DeepSeek Harness</title>` |

备份：`$DSH_HOME/dsh-purge-minimal/backups/2026-11-06T14-27-53-198Z-49b705e5`（complete=true），宿主文件旁 60 个 `*.dshpurge.bak`。

**边界**：只覆盖 web / npm CLI 面。桌面壳的换包与关窗组（#45/#46/#82/#83/#84/#92）本轮全为不适用，**桌面流程未验证**；未跑 `probe` 与真实会话，所以不声称"放行链已实测生效"。

## 0.2.1-rc.1 / rc.2 / rc.3 / rc.5

历史验收（锚点命中、apply、selfcheck 全绿）在 0.1.x 早期版本完成，未逐版本重跑 0.2.1 的完整 apply；当前 27 条补丁定义与这些宿主上的一致，锚点回归由 `test/patch-anchors.test.mjs` 覆盖。
