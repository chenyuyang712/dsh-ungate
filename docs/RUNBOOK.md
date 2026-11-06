# 运维手册（dsh-purge-minimal 0.1.2）

> 当前版本 **0.1.2**。面向在本机维护插件的人：体检、改宿主、重启、隔离验证、出事怎么收。
> 前提：`DSH_HOME` 与 `DSH_PROFILE` 指向**你要操作的那个实例**，不是"这台机器上恰好跑着的那个"。

## 0. 一分钟体检

```sh
export DSH_HOME=/home/kali/.dsh DSH_PROFILE=web
export PURGE_DSH_CLI="$(command -v dsh)"
node /path/to/dsh-purge-minimal/bin/community.js status
node /path/to/dsh-purge-minimal/bin/community.js selfcheck --json | jq '{ok, state, patch, broken}'
node /path/to/dsh-purge-minimal/bin/community.js audit --limit 20
```

判断顺序：`state` → `broken[]` → `patch.applied/total` → 最近审计里有没有 `refusal_retry`。

## 1. 日常动作

| 场景 | 动作 |
| --- | --- |
| DSH 官方升级后 | 面板「应用」→ 完整退出 → 重开 → `selfcheck`；有漂移先 `diagnose` |
| 插件升级后 | 同上（新补丁要重新写） |
| 模型开始推脱 | `purge probe new` → 发一句话看回显 → 回显则调人设/强化段，不回显则查注入层 |
| 想临时关强化段 | `purge boost off` → 重开；`boost on` 恢复 |
| 工具被追问审批 | `selfcheck` 看审批/沙箱层；绿则属工具自身限制，红则重新应用 |
| 要撤掉所有补丁 | 面板「还原」/ `purge revert`，再重开 |
| 要回到旧插件版本 | `purge rollback <id>` |

## 2. 重启 DSH 的安全做法

**不要在会话自己的 cgroup 里 `systemctl stop dsh-web`**——停掉的就是当前会话的宿主，之后没人能把服务拉回来（本项目历史上因此出现过 6 小时 27 分钟的中断）。

用 transient unit 把重启动作放到会话之外：

```sh
sudo systemd-run --unit=dsh-web-restart --collect \
  /bin/sh -c 'systemctl restart dsh-web'
```

隔离实例同理，把 unit 名换成 `dsh-web-iso`。Desktop 用户不需要这条：手动完整退出再打开即可。

## 3. 改宿主类改动的流程

1. 先在**隔离实例**上做（独立 `DSH_HOME`、独立端口、独立 unit），绝不先动主实例。
2. 隔离实例里跑完整链路：装插件 → 应用 → 重启 → `selfcheck` → 探针。
3. 证据齐了再动主实例；主实例改完同样走「应用 → 退出 → 重开 → 自检」。
4. 每一步都留输出（`status`/`selfcheck --json`/`audit`），别只留一句"好了"。

## 4. 隔离实例速查

```sh
# 起
sudo systemd-run --unit=dsh-web-iso --collect \
  env DSH_HOME=/home/kali/.dsh-iso /usr/bin/node <host>/lib/bin.js \
  --profile web --port 3081 --no-open --trusted-host 127.0.0.1 --trusted-host 127.0.0.1:3081
# 看
systemctl status dsh-web-iso --no-pager
journalctl -u dsh-web-iso -n 50 --no-pager
```

token 从该实例的启动日志里取，不要复用主实例的。

## 5. 出事怎么收

| 现象 | 先做 | 再决定 |
| --- | --- | --- |
| 应用后启动报错 | 读 `selfcheck` 的 `broken` 与 `apply` 的 `failed`；看宿主源码是否被写坏 | 面板「还原」或 `purge revert`，重开验证 |
| 换包后起不来 | 看 `resources/app.asar.purge-handoff.json` / `.log`，`asar_handoff.phase` | 用 `app.asar.purge-<token>.bak` 恢复归档，再重新应用 |
| 面板报错但 CLI 正常 | 前端 bundle 与后端版本不一致 | 重装插件（同一个 tgz），刷新页面 |
| 审计里连续 `refusal_retry` | 注入到了但模型仍在拒 | 调强化段/人设/`injectPosition`，别改补丁 |
| 插件目录被删/依赖坏了 | `purge usage` 看快照，`purge rollback <id>` | 仍不行就卸干净重装，保留用户内容 |

收集信息时给：插件版本、宿主版本、surface（web/desktop）、`selfcheck` 的 `broken`、脱敏后的错误行。**不要**贴 token、提示词正文、完整 profile 配置。

## 6. 备份与清理

- 快照由「应用」「备份」自动创建；`purge usage` 看占用，`purge prune` 清理并 GC。
- 审计 1MB 轮转、保留 2 份；需要长期保留就自己归档 `audit.jsonl`。
- 卸载（`purge uninstall`）只清插件目录与链接；`$DSH_HOME/dsh-purge*` 里的状态要手动删。

## 7. 验证边界

组件测试、打包 smoke、面板契约测试都不能替代真机验收。写结论时分开写：哪一层验证过、哪一层只是"测试覆盖"。宿主升级后尤其如此——磁盘写成功不代表当前进程加载了。
