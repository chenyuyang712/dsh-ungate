# 验收记录（VERIFY）

> 当前版本 **0.2.1** · 只记录**实际跑过**的组合与可复查输出。没有记录的组合就是未验证，不推测。

## 0.2.2-rc.1 · web / npm CLI 面

环境：pnpm hoisted 安装树 `/tmp/dsh022/node_modules/@deepseek-ai`（`@deepseek-ai/dsh` 0.2.2-rc.1），全新 `DSH_HOME=/home/kali/.dsh-rc1`，`--profile web --port 3082`。

| 环节 | 命令 | 结果 |
| --- | --- | --- |
| 安装 | `pnpm add /tmp/dsh-purge-minimal-0.1.2.tgz` | profile 内版本 0.1.2（当时包名还是 `dsh-purge-minimal`），bundle 已启用 |
| 应用前 | `GET /dsh-purge/status` | applied=1（#90 判据是"宿主已是原生插话行为"，pristine 宿主天然命中）、pending=20、na=6、total=21/all=27 |
| 应用 | `POST /dsh-purge/apply` | HTTP 200：applied=20、already=1、failed=0、complete=true、host_written=true；27 条 report 无 `pattern_not_found` / `hitMismatch` / `partial` |
| 幂等 | 再跑一次 apply | applied=0、already=21、failed=0 |
| 自检 | `GET /dsh-purge/selfcheck` | state=ok、broken=[]、uncertain=[]、patch 21/21（all 27、na 6）；20 层 = ok 19 + na 1（宿主磁盘布局层在 web 面不适用） |
| CLI 交叉 | `DSH_HOME=… PURGE_DSH_CLI=… node bin/community.js selfcheck --json` | exit 0、patch 21/21、broken=0；state=unknown 属预期（CLI 看不到运行时 hook 层） |
| 漂移 | `diagnose --json` | checked=21、drifted=[]、optionalDrift=[]、missing=[]、desktop_entry=not_desktop |
| 服务可用 | `GET /` | 200，`<title>DeepSeek Harness</title>` |

备份：`$DSH_HOME/dsh-purge-minimal/backups/2026-11-06T14-27-53-198Z-49b705e5`（complete=true），宿主文件旁 60 个 `*.dshpurge.bak`。

**边界**：只覆盖 web / npm CLI 面。桌面壳的换包与关窗组（#45/#46/#82/#83/#84/#92）本轮全为不适用，**桌面流程未验证**；未跑 `probe` 与真实会话，所以不声称"放行链已实测生效"。

## 0.2.1（dsh-ungate）· DSH 0.2.2-rc.1 · web 面 · 隔离实例 3081

环境：`DSH_HOME=/home/kali/.dsh-iso`，宿主 `/home/kali/.dsh-iso/host-0.2.2-rc.1`（hoisted，0.2.2-rc.1），`dsh-web-iso.service --profile web --port 3081`。

- **验证对象**：GitHub Release 资产 `dsh-ungate-0.2.1.tgz`，下载后实核 sha256 `38ab7de84aa6c0da463034fb3f960170db59b4e5a8a7d8c3aca8dc9ebe77a5e3`。
- **宿主先还原 pristine**：63 个 `*.dshpurge.bak` 回拷；`grep -rl '\[dsh-purge\]' node_modules/@deepseek-ai` 命中 0。
- **换装**：`dsh plugin --profile web remove dsh-purge-minimal` → `dsh plugin --profile web add <tgz>`；`dsh.profile.bundles = [@deepseek-ai/dsh-base, @deepseek-ai/dsh-web-app, dsh-ungate]`。数据目录 `$DSH_HOME/dsh-purge-minimal/` 原地沿用、审计续写（无任何迁移动作）。

| 环节 | 命令 | 结果 |
| --- | --- | --- |
| 应用前 | `GET /dsh-purge/status` | `plugin_version 0.2.1`、applied=1（#90 原生判据）、pending=20、na=6、`update=null`（在线更新已移除）、host_family `npm-cli`、qualified |
| 应用 | `POST /dsh-purge/apply` | HTTP 200：applied=20、already=1、failed=0、complete=true、host_written=true、unpacked_asar=true |
| 重启 | `systemd-run --on-active=40 systemctl restart dsh-web-iso` | active；服务正常起来 |
| 自检 | `GET /dsh-purge/selfcheck` | state=ok、needsApply=false、patch 21/21（all 27、na 6、partial 0、missing_file 0）；20 层 = ok 19 + na 1（布局层 web 面不适用） |
| 幂等 | 再跑一次 apply | applied=0、already=21、failed=0、complete=true |
| 漂移 | `diagnose --json` | checked=21、drifted=0、missing=0、optionalDrift=0、desktop_entry=not_desktop |
| 探针 | `node bin/community.js probe new` | nonce `purge-7805615a` 生成成功（见下方边界） |

**边界**：模型回显（nonce 在真实会话里被原样输出）仍未做——隔离实例没有登录会话，注入链的最后一跳待主实例升级后闭环；桌面面 6 条（#45/#46/#82/#83/#84/#92）未验。

## 开发回路（链接安装，非实例验收）

- `DSH_HOME=/tmp/dev-home dsh plugin --profile dev add <checkout>`：pnpm link 成功，bundle 进入 `dsh.profile.bundles`。
- `dsh --profile dev --dump-config`：7 处 `# … patched by dsh-ungate` 层头 + `== dsh-ungate` 段，exit 0。
- `dsh --profile dev` 真启动：运行 40 秒无配置/模块/预设错误（timeout 124 终止，属正常运行中被杀）。
- 插件 CLI 从链接目录运行：`bin/community.js status` 输出 name=Ungate、package=dsh-ungate。

## 0.2.1-rc.1 / rc.2 / rc.3 / rc.5

历史验收（锚点命中、apply、selfcheck 全绿）在 0.1.x 早期版本完成，未逐版本重跑 0.2.1 的完整 apply；当前 27 条补丁定义与这些宿主上的一致，锚点回归由 `test/patch-anchors.test.mjs` 覆盖。
