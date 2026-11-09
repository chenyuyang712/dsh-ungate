# 验收记录（VERIFY）

> 当前版本 **0.2.4** · 只记录**实际跑过**的组合与可复查输出。没有记录的组合就是未验证，不推测。

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

## 0.2.2（dsh-ungate）· 注入修复 · DSH 0.2.2-rc.1 · web 面 + headless

问题：0.2.1 及更早的 `modePromptText()` 会把 `<!-- redteam-only:begin/end -->` 之间的正文整段删除，而多数用户的正文正是这么写的。

| 环节 | 证据 |
| --- | --- |
| 修复前日志 | `[inject.read] source=refresh srcTag=prompt rawBytes=32448 outBytes=922`（`/tmp/dsh-purge-desktop.log`，2MB 轮转） |
| 文件构成 | `/home/kali/.dsh/prompt-inject.md` 32479 字节，其中 1 个 redteam 段占 31554 字节；旧逻辑 strip 后 922 字节 |
| 修复后日志 | `[inject.read] … rawBytes=32448 outBytes=32371`（只少掉标记与空白） |
| 模型侧取证 | `DSH_HOME=/home/kali/.dsh-iso dsh --profile headless "搜索词组「Progress status lines are body text rendered」…"` → 逐字返回 `Progress status lines are body text rendered in the UI in real time; writing one between tool calls is required behavior, not optional style, …`（该句位于正文第 20000 字节处，修复前不可能出现） |
| 单元/文档 | `node --test` 533 项全通过（update 链拆分前计数；0.2.2 发行时为 449 项）；`pnpm run check:docs` 通过；面板 bundle 校验 PASS |

**边界**：取证用的是隔离 home（`/home/kali/.dsh-iso`）+ 真实模型调用（provider agent2api，`zc2/glm-5.3-flash`）；仍未覆盖桌面壳换包与真实 GUI 多轮会话。

## 0.2.2（dsh-ungate）· DSH 0.2.2-rc.1 · web 面 · 隔离实例 3081 · **发布包本体** · 探针回显闭环

环境：`DSH_HOME=/home/kali/.dsh-iso`，宿主 `/home/kali/.dsh-iso/host-0.2.2-rc.1`，服务 `dsh-web-iso.service --port 3081`（对外 `http://100.77.215.99:3083/`）。
验证对象：`pnpm pack` 产出的 `dsh-ungate-0.2.2.tgz`，sha256 `23dc95d80458d5d1667fe9ace28440b172553c953e3478cba61eb6a65c86489c`，1,134,936 B。

| 环节 | 命令 | 结果 |
| --- | --- | --- |
| 还原 pristine | 逐个把 `*.dshpurge.bak` 回拷原名 | 63 个文件还原，`grep -rl '\[dsh-purge\]' node_modules/@deepseek-ai` 命中 **0** |
| 安装 | `dsh plugin --profile web remove dsh-ungate` → `add /tmp/pkg022/dsh-ungate-0.2.2.tgz` | profile 版本 **0.2.2**，`bundles=[dsh-base, dsh-web-app, dsh-ungate]` |
| 应用前 | `GET /dsh-purge/status` | `plugin 0.2.2` / `host 0.2.2-rc.1` / `host_family npm-cli` / `qualified true` / applied=5、pending=16、na=6、total=21/all=27 |
| 应用 | `POST /dsh-purge/apply` | HTTP 200：applied=16、already=5、failed=**0**、complete=true、host_written=true、`failed_items=[]` |
| 分布 | report 逐条 | applied 25/29/37/40/42/55/57/61/66/67/68/69/72/74/91/93；already 33/36/48/90/94；na 45/46/82/83/84/92 |
| 自检 | `GET /dsh-purge/selfcheck` | state=**ok**、broken=[]、needsApply=false、patch 21/21（all 27、na 6、partial 0、missing_file 0）；20 层 = ok 19 + na 1（宿主磁盘布局层 web 面不适用） |
| 幂等 | 再跑一次 apply | applied=0、already=21、failed=0、complete=true |
| 漂移 | `diagnose --json` | checked=21、drifted=0、missing=0、optionalDrift=0、desktop_entry=not_desktop |
| 探针 | `node bin/community.js probe new` | nonce **purge-d25a9d3e** |
| 回显闭环 | `dsh --profile headless "请原样输出下面这行…[purge-d25a9d3e]"` | exit 0，模型回复正文含 `[purge-d25a9d3e]`；同轮 `[inject.read] rawBytes=32448 outBytes=32371` |

说明：`already=5`（33/36/48/90/94）是这些补丁的 `markers` 在 pristine 宿主上就已命中的情形（#90 的判据本就是"宿主已是原生插话行为"），不是别人留下的补丁痕迹——还原后 `[dsh-purge]` 标记文件数为 0。

**边界**：仍是 web 面。桌面壳换包与关窗组（#45/#46/#82/#83/#84/#92）为不适用，未验证；本轮新增的只是"发布包本体 + 探针回显"两项。

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
