# dsh-purge-panel

`dsh-ungate` 的面板前端：注册左侧栏页面，读写宿主插件暴露的 `/dsh-purge/*` 接口。它不改宿主文件、不装会话钩子、不复制后端逻辑。

- 源码在 `src/`，React + 自研 `dshpp-` 样式前缀，独立 locale 命名空间。
- 产物是两份 bundle：`client.js`（仓库根，随 npm 包发布）与 `packages/purge-panel/client.js`（本包自用），都由 `scripts/build.mjs` 生成，不要手改。
- 构建：`node packages/purge-panel/scripts/build.mjs`（加 `--community` 写仓库根那份）；校验：`pnpm run check:client`。
- 版本：1.1.2。
