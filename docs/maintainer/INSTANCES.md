# 本机参考实例

维护者自用部署，不随包发布。

| 实例 | 地址 | DSH_HOME | 宿主版本 | 用途 |
| --- | --- | --- | --- | --- |
| 主实例 | 127.0.0.1:3080 | `/home/kali/.dsh` | 0.2.2-rc.1（宿主 `/usr/lib/node_modules/@deepseek-ai/dsh`，旧版备份 `dsh.bak-0.2.1-rc.3`） | 日常使用与验收 |
| 隔离实例 | 127.0.0.1:3081 | `/home/kali/.dsh-iso` | 0.2.2-rc.1（宿主 `/home/kali/.dsh-iso/host-0.2.2-rc.1`，旧副本 `host` 保留） | 改宿主/换包类改动先在它上面跑 |
