# 决策记录

本文件记录**为什么**这个仓库长成现在这样。每条包含：日期、决策、被否掉的备选、理由、证据位置。
新增决策请追加到表尾，不要改写历史条目；被推翻的条目保留并标注「已废弃」。

| # | 日期 | 决策 | 否掉的备选 | 理由 | 证据 |
| --- | --- | --- | --- | --- | --- |
| D1 | 2026-11-06 | 以 1.6.82 为基线剥离成独立发行版，不跟随上游继续改名 | 直接升级社区版 1.6.82 后原样使用 | 上游 86 条补丁里有 hooks 否决旁路、rewind 改写、悬挂锚点自愈等改变宿主原生语义的部分 | `docs/STATE.md#已删除的补丁` |
| D2 | 2026-11-06 | 分发身份独立：仓库 `youki258/dsh-purge-minimal`，包名 `dsh-purge-minimal`，CLI `purge`，版本从 `0.1.0` 起 | 建 GitHub fork 关系；沿用 `dsh-purge-community` 包名 | fork 会被上游 release 覆盖，且在线更新逻辑会指向社区版资产 | `lib/update.js:1186` 的 `PURGE_UPDATE_REPO` 门 |
| D3 | 2026-11-06 | 在线更新默认关闭，`applyUpdate()` 直接抛错 | 保留自动更新通道 | 自动更新会把社区版 release 覆盖到本发行版上 | `lib/update.js` `applyUpdate` 首行 |
| D4 | 2026-11-06 | 出厂默认提示词不为用户定制：只放 2009 字节通用版 | 把操作者本机人格设定封进出厂槽 | 槽密钥在仓库里公开可读，只是混淆不是加密；私人内容一旦进仓即等于公开 | `release-notes.md` 0.1.1 段 |
| D5 | 2026-11-06 | 0.1.0 的泄漏用「删库重建」处理，不强推 | 强推覆盖历史 | 实测 GitHub 仍允许按 SHA 拉取已不可达的 commit/object，强推清不掉 | `docs/STATE.md`、release-notes 0.1.1 段 |
| D6 | 2026-11-06 | 移除内置红队演练台（`lib/redteam/`、`presets/redteam/`、`skills/redteam/`、面板 drill 共约 11000 行） | 保留但默认关闭 | 与「所有操作无限制」这条主线无关，却带来 1.1MB 代码与 599MB 工具链依赖 | `skills/pentest-sop.md`（抽出的唯一保留物） |
| D7 | 2026-11-06 | `$DSH_HOME/redteam/` 数据目录原样保留 | 一并删除 | 里面有真实演练记录与 599MB 工具链，删除不可逆且与本插件无关 | 本机 `/home/kali/.dsh/redteam` |
| D8 | 2026-11-06 | 宿主源码改写 75 → 27 条：能走 cordis 配置覆盖的走配置，能走 hook 的走 hook | 继续维护 75 条源码补丁 | 源码补丁必须重启才生效、宿主升版就大面积 missing，且改动面越大越难验证 | `cordis.patch.yml`、`lib/exec-hooks.js`、`lib/patches/` |
| D9 | 2026-11-06 | 审批策略用 `policy: ask` + `approval/request` hook 放行，而不是 `policy: never` | 保留 `never`（宿主在瀑布前就 rejected，hook 收不到） | `never` 下 hook 根本不被调用；`ask` + hook 才能在 hook 失效时退回「问一次」而不是静默拒绝 | `dsh-user-approval/lib/index.js` 原版 `decide()` |
| D10 | 2026-11-06 | 手动切到 workspace-write 时接受被官方围栏拦住 | 保留 #15/#16 把围栏整体拆掉 | 全权限模式宿主本来就短路围栏，这两条补丁只在低权限模式才有额外效果 | `dsh-bash-sandbox/lib/index.js:65-74` |
| D11 | 2026-11-06 | 不自动 apply 宿主补丁：`autoApplyOnStart: false` | 启动即写宿主 | 写宿主是不可逆副作用；启动阶段静默改宿主会让升级排障变困难 | `cordis.patch.yml` 的 `dsh-purge` config |
| D12 | 2026-11-06 | 自检层接受三种合法全权限形态：`never`、`ask`+hook、bundle 显式固定默认预设 | 只认 `approval === "never"` | 改成 hook 方案后，只认 `never` 会把正常状态误报成 broken | `lib/permission-state.js` `full()` / `bundlePin` |
| D13 | 2026-11-06 | 文档口径由 `scripts/check-docs.mjs` 强制（README 双份逐字节相同、版本号跨文件一致） | 靠人工维护 | 版本号散落在 README/AGENTS/INSTALL/MAINTENANCE/release-notes 六处，人工必漏 | `scripts/check-docs.mjs` |
| D14 | 2026-11-06 | 隔离验证用「独立宿主副本 + 独立 `DSH_HOME` + 独立端口 3081」 | 只在本机主实例上验 | 主实例装着 23 个 bundle，无法区分是本插件的问题还是别的插件冲突 | `docs/ISOLATION.md` |
