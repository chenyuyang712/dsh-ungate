# 运维手册（Purge Minimal 0.1.0）

> 面向在本机维护本插件的操作者。所有命令都假设已在目标实例的 profile 上下文里（`DSH_HOME` / `DSH_PROFILE` 正确）。

## 0. 铁律：不要在自己的 cgroup 里停服务

在本会话/本进程里执行 `systemctl stop dsh-web` 会连带杀掉发起命令的 shell（历史上停服 6h27m）。改动宿主或用例重启时必须跳出 cgroup：

```sh
sudo systemd-run --unit=dsh-restart-$$ --collect --wait \
  /bin/bash /tmp/dsh-restart-helper.sh
```

辅助脚本内容最少是：`systemctl stop dsh-web; sleep 2; systemctl start dsh-web`，并把结果写进 `/tmp/dsh-restart-result.log`。

## 1. 日常检查

```sh
purge selfcheck --json     # 逐层证据；broken>0 才算失败
purge status               # 宿主路径与补丁计数
purge audit --limit 20     # 最近动作
```

判读口径：`applied/required` 全等才算该层 ok；`na` 是明确不适用，不是失败；`unknown` 必须人工确认，不能当成功。

## 2. 一键开关（宿主补丁面）

```sh
purge toggle
```

- 宿主补丁在位 → 执行 `--revert --no-shim`，还原原生宿主；
- 宿主补丁不在位 → 执行 `--apply`；
- 返回 `{action, host, before:{on,off,counts}, exit}`，`exit=0` 才算成功；
- **改动重启后生效**，不重启等于没发生。

全局 shim 不随 toggle 变化，需要显式 `purge revert`。

## 3. 重新应用与回滚

```sh
purge apply                # 重新写宿主补丁（宿主升级后必做）
purge backup               # 手动快照
purge rollback <备份ID>     # 回到某个快照
purge migrate <tgz>        # 迁移到新版本包
```

`apply` 前会自动快照。宿主目录只读（Linux 系统宿主属 root）时必须 `sudo -E env DSH_HOME=... DSH_BASE=... node bin/dsh-purge.js --apply`，否则会报 `Host backup failed; patch writes cancelled`。

## 4. 诊断锚点漂移

宿主升级会让补丁锚点失效，表现为 `selfcheck` 某层 `pending` 或 `diagnose` 报 drifted。

```sh
purge diagnose                    # 文件、行号、候选落点
purge reanchor list               # 已钉的本地覆盖
purge reanchor apply <id> --index n   # 把候选钉成本地覆盖
purge reanchor clear <id>         # 撤销
```

钉住的是本地覆盖，不修改上游补丁表；下一次宿主升级后要重新核对。

## 5. 面板不渲染

按顺序排查：

1. 看浏览器 console 是否有 `Found module … but plugin … was not registered` —— 说明 client bundle 的注册 id 与 profile 里的插件名不一致，重建 bundle（`node packages/purge-panel/scripts/build.mjs --community`）后强刷；
2. 看 `/plugins/…/client.js?rev=` 返回的 bundle 里是否含正确 id：`grep -o 'id:"[^"]*"' client.js`；
3. 宿主按内容算 rev，改完 bundle 不需要重启宿主，但浏览器要 Ctrl+F5；
4. 仍然空白就看宿主日志：`sudo grep -a "dsh web:" /var/log/dsh-web.log | tail -3` 取 token，直接访问带 token 的 URL。

## 6. 版本一致性与打包

```sh
node scripts/check-docs.mjs
node packages/purge-panel/scripts/build.mjs --community --check
pnpm test
bash scripts/pack-tgz.sh          # 产物在 pkgs/
```

打包必须排除 `node_modules/ .git/ backups/ objects/ test/ pkgs/`，否则会把本机状态和私密快照打进发行包。

## 7. 升级到新上游版本

1. 取上游 tag 的 source tarball，比对 `lib/patches/` 与 `lib/` 差异；
2. 只在 `lib/patches/index.mjs` 的 `ALL_PATCHES` 里增删条目，不用改宿主；
3. 剥离清单见 [STATE.md](STATE.md)，新增补丁先判断是否改变原生行为；
4. 跑全量测试 + 双实例回归，再打 tgz。

## 8. 出问题时的最小恢复

```sh
purge revert               # 还原宿主（含 shim）
# 或
purge rollback <最近备份ID>
```

回滚后必须重启宿主；只刷新浏览器不会重载后端。
