# 隔离测试台

主实例（3080）装着 23 个 bundle，任何异常都可能是别的插件冲突。隔离台用**独立宿主副本 + 独立 `DSH_HOME` + 独立端口**，只装本插件需要的最小 bundle 集，用来判断问题是不是本插件引入的。

## 拓扑

| 项 | 主实例 | 隔离台 |
| --- | --- | --- |
| 服务名 | `dsh-web` | `dsh-web-iso` |
| 端口 | 3080 | 3081 |
| `DSH_HOME` | `/home/kali/.dsh` | `/home/kali/.dsh-iso` |
| 宿主 | `/usr/lib/node_modules/@deepseek-ai/dsh`（root 所有，写入需 `sudo -E`） | `/home/kali/.dsh-iso/host`（kali 所有，可直接写，**无需 sudo**） |
| 宿主版本 | 0.2.1-rc.3 | 0.2.1-rc.3（独立副本） |
| bundles | 23 个 | 3 个：`@deepseek-ai/dsh-base`、`@deepseek-ai/dsh-web-app`、`dsh-purge-minimal` |
| 启动命令 | `/usr/local/bin/dsh-web-start.sh` → `dsh --profile web` | `/usr/bin/node /home/kali/.dsh-iso/host/lib/bin.js --profile web --port 3081` |

`dsh-web-iso.service` 定义见 `/etc/systemd/system/dsh-web-iso.service`：`User=kali`、`Environment=DSH_HOME=/home/kali/.dsh-iso`、`Restart=always`。

## 铁律

1. **不要在本会话的 cgroup 里 stop/restart `dsh-web`**：2026-11-06 02:54 执行 `systemctl stop dsh-web` 时整条 `&&` 链连同会话一起被杀，服务停机 6h27m。任何主实例重启都必须走：
   ```sh
   sudo systemd-run --unit=dsh-restart-$(date +%s) --collect --wait /bin/bash /tmp/dsh-restart-helper.sh
   ```
   `/tmp/dsh-restart-helper.sh` 在 transient unit（独立 cgroup）里 stop → start → 等 12 秒 → 记录 `active` 与 HTTP 码 → 抓 journal 里的 import 报错，结果写 `/tmp/dsh-restart-result.log`。
2. **隔离台重启安全**：`sudo systemctl restart dsh-web-iso` 不影响本会话（它在另一个 cgroup）。
3. **两边的插件目录必须同时更新**，否则「主实例绿、隔离台红」会浪费一整轮排障。

## 如何把新构建灌进隔离台

```sh
# 1) 打包（仓库根）
rsync -a --exclude node_modules --exclude .git --exclude backups --exclude objects \
  --exclude test --exclude pkgs --exclude audit.jsonl --exclude '*.log' \
  --exclude 'lib/default-prompt-inject.md' ./ /tmp/pkg-stage/
tar -czf pkgs/dsh-purge-minimal-<ver>.tgz -C /tmp/pkg-stage .

# 2) 铺到两边 profile（--delete 保证旧文件不残留）
for d in /home/kali/.dsh/profiles/web/node_modules/dsh-purge-minimal \
         /home/kali/.dsh-iso/profiles/web/node_modules/dsh-purge-minimal; do
  rsync -a --delete --exclude node_modules --exclude .git --exclude backups \
    --exclude objects --exclude audit.jsonl --exclude '*.log' --exclude pkgs ./ "$d"/
done

# 3) 隔离台重启
sudo systemctl restart dsh-web-iso
```

隔离台的 profile `package.json` 里 `dsh-purge-minimal` 依赖写成 `file:` 指向本机 tgz；**升级版本号后这个 file 路径也要跟着改**，否则 `dsh plugin` 解析会用旧资产。

## 取 token

```sh
# 主实例
sudo grep -aoE "token=[A-Za-z0-9_-]+" /var/log/dsh-web.log | tail -1
# 隔离台
sudo journalctl -u dsh-web-iso --since "-5 min" --no-pager | grep -aoE "token=[A-Za-z0-9_-]+" | tail -1
```
未带 token 访问 3080/3081 均返回 401，属正常。

## 验证清单

```sh
# 1) 逐层自检（两边都应 ALL GREEN）
curl -s "http://127.0.0.1:3080/dsh-purge/selfcheck?token=<tok>" | node -e '...'
curl -s "http://127.0.0.1:3081/dsh-purge/selfcheck?token=<tok>" | node -e '...'
# 期望：host 15/15、runtime 1/1、config 1/1、hook 1/1、override 1/1、broken 0、uncertain 0

# 2) 面板渲染（无头 Chromium + CDP）
node /tmp/verify3.mjs <token> <port>
# 期望：hasFailed=false、errors=[]、面板显示「Purge <ver> / DSH <host> / 已回归验证 / N/M · K 条本机不适用」

# 3) CLI 侧（隔离台 profile 没有 yaml 依赖，必须用仓库的 bin）
cd /home/kali/dsh-projects/dsh-purge-minimal
DSH_HOME=/home/kali/.dsh-iso \
DSH_BASE=/home/kali/.dsh-iso/host/node_modules/@deepseek-ai \
node bin/community.js selfcheck --json
```

## 已知环境差异（不是缺陷）

- 隔离台 profile 目录没有 `yaml` 包，直接跑 `profiles/web/node_modules/dsh-purge-minimal/bin/community.js` 会报 `Cannot find package 'yaml'`。用仓库的 `bin/community.js` 代替。
- 主实例的 web profile 没有 `cordis.patch.yml`（只读 web profile 不写这一层），隔离台同样没有。自检的「当前 profile 的权限选择」层以运行时 `permissionPresets` 报出的值为准。
- 隔离台是 web 宿主，`宿主磁盘布局` 层固定为 `na`（桌面 `app.asar` 检查不适用）。
