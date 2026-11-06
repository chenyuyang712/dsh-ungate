# 与上游的关系与合流口径

> 本发行版不是上游的 fork 分支（GitHub 上没有 fork 关系），是独立维护的精简发行版。

## 血缘

| 阶段 | 来源 | 说明 |
| --- | --- | --- |
| 原始 | [YuJunZhiXue/dsh-purge](https://github.com/YuJunZhiXue/dsh-purge) | 原作者 小杨，MIT © 2026 |
| 社区分支 | `kingcharleslzy-ai/dsh-purge` | 1.6.x 系列，最终基线 1.6.82 |
| 本发行版 | `youki258/dsh-purge-minimal` | 0.1.0 起，纯 semver 独立版本线 |

NOTICE.md 与 LICENSE 保留上游署名与许可证全文，不随改名删除。

## 合流原则

1. **只合并补丁表与实现修复，不合并版本号与品牌**：上游 1.6.x 的补丁实现可以择优移植，版本线仍走 0.1.x/0.2.x。
2. **剥离清单不再加回**：hooks 否决、rewind 改写、悬挂锚点自愈、`ask_user` 超时这四类共 11 条补丁，即使上游修复了也默认不引入；需要时由使用者用 `purge patches enable <id>` 显式打开。
3. **行为改变必须有开关**：任何新增的宿主改写，必须能在 `purge toggle` 或 `patches disable` 下回退，否则不合入。
4. **不做静默自愈**：宿主文件被外部改动时只报告，不自动改写（`diagnose` + `reanchor` 显式路径）。
5. **不引入在线自动更新**：`PURGE_UPDATE_REPO` 未设置时 `applyUpdate` 拒绝执行，避免被上游 release 覆盖本发行版。

## 合流流程

```sh
# 1. 取上游源码（不 clone 历史，只取 tag 快照）
curl -fL https://codeload.github.com/kingcharleslzy-ai/dsh-purge/tar.gz/refs/tags/v1.6.82 -o /tmp/upstream.tgz

# 2. 只比对实现目录
tar -xzf /tmp/upstream.tgz -C /tmp
diff -ru /tmp/dsh-purge-*/lib/patches lib/patches | head -200
diff -ru /tmp/dsh-purge-*/lib/ lib/ | grep -v "^Only in" | head -200

# 3. 逐个补丁判断是否违反"合流原则 2/3/4"，再决定移植
```

## 版本对照

| 本发行版 | 上游基线 | 补丁数 | 主要变化 |
| --- | --- | --- | --- |
| 0.1.0 | 1.6.82 | 75 | 剥离 11 条行为类补丁；CLI 改名 `purge`；中性化界面；关闭在线更新 |
| 0.1.1 | 1.6.82 | 27 | 48 条补丁改为 cordis 配置覆盖 / 运行时 hook 或直接删除；移除红队演练台；出厂提示词缩减为 2009 字节 |

## 上游能力的取舍记录

| 上游能力 | 本发行版 | 原因 |
| --- | --- | --- |
| hooks 否决旁路 | 剥离 | 改变原生钩子语义 |
| rewind 改写 | 剥离 | 覆盖原生回退路径 |
| 悬挂锚点自愈 | 剥离 | 静默改写宿主文件 |
| `ask_user` 超时上限 | 剥离 | 改动原生等待语义 |
| 红队演练台 | 移除 | 与「无限制」目标无关，且要 1.1MB 代码 + 599MB 工具链；SOP 抽成 `skills/pentest-sop.md` |
| 解锁类宿主补丁 | 保留 | 本项目核心价值 |
| 在线自动更新 | 关闭（可显式开启） | 防止被上游 release 覆盖 |
