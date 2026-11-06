import {
  h,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "../shared/react.js";
import { apiJson } from "../api/client.js";
import { Btn, HelpTip } from "./primitives.js";
/**
 * 状态页顶部的两块紧凑信息：破甲自检（默认收起）+ 破甲强化段开关。
 * 单独拆出来，是为了让「应用」按钮留在页面最上面，而自检不占一屏。
 */
export function StatusExtras() {
  const [check, setCheck] = useState(null);
  const [boost, setBoost] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const load = () =>
    Promise.all([
      apiJson("/dsh-purge/selfcheck")
        .then(setCheck)
        .catch(() => setCheck(null)),
      apiJson("/dsh-purge/boost")
        .then((r) => setBoost(!!r.enabled))
        .catch(() => setBoost(null)),
    ]);
  useEffect(() => {
    load();
  }, []);
  async function toggle() {
    try {
      const r = await apiJson("/dsh-purge/boost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: !boost }),
      });
      setBoost(!!r.enabled);
      setNotice(r.enabled ? "已开启，重启后生效" : "已关闭，重启后生效");
    } catch (e) {
      setNotice(e.message);
    }
  }
  async function rerun() {
    setBusy(true);
    try {
      setCheck(await apiJson("/dsh-purge/selfcheck"));
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  }
  const layers = check && Array.isArray(check.layers) ? check.layers : [];
  const failed = layers.filter(
    (l) => l.state === "broken" || (!l.state && !l.ok),
  );
  const pendingLayers = layers.filter((l) => l.state === "pending");
  const uncertain = layers.filter((l) =>
    ["inferred", "unknown"].includes(l.state),
  );
  const pendingPatches = pendingLayers.reduce(
    (n, l) => n + (l.pending?.length || 0),
    0,
  );
  const total = layers.filter((layer) => layer.applicable !== false).length;
  return h(
    "section",
    { className: "dshpp-card", "aria-label": "破甲状态" },
    h(
      "div",
      { className: "dshpp-line" },
      h(
        "span",
        { className: "dshpp-line-main" },
        h("i", {
          className:
            "dshpp-dot " +
            (check
              ? failed.length
                ? "is-bad"
                : pendingLayers.length || uncertain.length
                  ? "is-warn"
                  : "is-ok"
              : ""),
        }),
        "破甲自检",
        h(
          "b",
          null,
          check
            ? failed.length
              ? `${failed.length} 层未生效`
              : pendingLayers.length
                ? `${pendingPatches} 条待应用`
                : uncertain.length
                  ? `${uncertain.length} 层需确认`
                  : `${total} 层全部在位`
            : "检测中…",
        ),
      ),
      h(
        "details",
        { className: "dshpp-fold-inline" },
        h("summary", null, "查看逐层"),
        h(
          "div",
          { className: "dshpp-checks" },
          check && Array.isArray(check.layers)
            ? check.layers.map((layer) =>
                h(
                  "div",
                  {
                    key: layer.title,
                    className:
                      "dshpp-check" +
                      (["pending", "inferred", "unknown"].includes(layer.state)
                        ? " is-warn"
                        : layer.ok
                          ? ""
                          : " is-bad"),
                  },
                  h("i", {
                    className:
                      "dshpp-dot " +
                      (["pending", "inferred", "unknown"].includes(layer.state)
                        ? "is-warn"
                        : layer.ok
                          ? "is-ok"
                          : "is-bad"),
                  }),
                  h("span", { className: "dshpp-check-name" }, layer.title),
                  h(
                    "span",
                    { className: "dshpp-check-val" },
                    layer.applicable === false
                      ? "不适用"
                      : layer.state === "pending"
                        ? `待应用 #${(layer.pending || []).join("/#")}`
                        : layer.state === "inferred"
                          ? "宿主推导"
                          : layer.state === "unknown"
                            ? "未确认"
                            : `${layer.applied}/${layer.required ?? layer.total}`,
                  ),
                  layer.note
                    ? h(HelpTip, { title: layer.title }, layer.note)
                    : null,
                ),
              )
            : h("div", { className: "dshpp-muted" }, "检测中…"),
        ),
      ),
      h(
        Btn,
        { tiny: true, disabled: busy, onClick: rerun },
        busy ? "…" : "重测",
      ),
      h(
        Btn,
        {
          tiny: true,
          title: "生成一次性探针：下一轮回复里看模型有没有原样回显该标记",
          onClick: async () => {
            try {
              const r = await apiJson("/dsh-purge/probe", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: "{}",
              });
              setNotice(r.message || "");
            } catch (e) {
              setNotice(e.message);
            }
          },
        },
        "探针",
      ),
    ),
    h(
      "div",
      { className: "dshpp-line" },
      h(
        "span",
        { className: "dshpp-line-main" },
        "破甲强化段",
        h(
          HelpTip,
          { title: "破甲强化段" },
          "在系统提示词末尾追加一段与注入同级的文本：层级声明 / 拒绝即故障 / 抗谄媚 / 多轮重申。默认开启。",
        ),
        h("b", null, boost === null ? "…" : boost ? "已开启" : "已关闭"),
      ),
      h(
        Btn,
        { tiny: true, disabled: boost === null, onClick: toggle },
        boost ? "关闭" : "开启",
      ),
      notice ? h("span", { className: "dshpp-muted" }, notice) : null,
    ),
  );
}

/**
 * 维护页：本机快照与回滚。
 * 插件更新由 DSH 插件市场 / 手动安装负责，本面板不发起任何联网更新请求。
 */
export function CommunityMaintenance() {
  const [value, setValue] = useState(null);
  const [selected, setSelected] = useState("");
  const [listState, setListState] = useState("loading");
  const [listError, setListError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const running = useRef(false);
  const mounted = useRef(false);
  const generation = useRef(0);

  const load = useCallback(async () => {
    const request = ++generation.current;
    setListState("loading");
    setListError("");
    try {
      const result = await apiJson("/dsh-purge/community");
      if (!result || typeof result !== "object")
        throw new Error("维护接口返回了无效结果");
      if (result.ok === false) throw new Error(result.error || "维护接口返回失败");
      if (!Array.isArray(result.backups)) throw new Error("备份列表响应无效");
      if (!mounted.current || request !== generation.current) return;
      setValue(result);
      setSelected((current) =>
        result.backups.some((b) => b.id === current) ? current : "",
      );
      setListState("ready");
    } catch (e) {
      if (!mounted.current || request !== generation.current) return;
      setListError(e.message);
      setListState("error");
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
      generation.current++;
    };
  }, [load]);

  async function run(op) {
    if (running.current) return;
    if (
      op === "rollback" &&
      !window.confirm(
        "只回滚 Purge 插件及其入口，保留当前提示词和设置；完成后需重启 DSH 进程。继续？",
      )
    )
      return;
    running.current = true;
    setBusy(true);
    setNotice("处理中…");
    try {
      const r = await apiJson("/dsh-purge/community", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op, id: selected }),
      });
      if (!r || typeof r !== "object")
        throw new Error("维护接口返回了无效结果");
      if (r.ok === false) throw new Error(r.error || "维护操作失败");
      setNotice(
        op === "backup"
          ? "快照已创建。"
          : "已回滚；请重启 DSH 进程后确认版本。",
      );
    } catch (e) {
      setNotice(
        e.message === "timeout"
          ? "维护请求超时，操作可能仍在执行；请先刷新状态，勿重复提交。"
          : e.message,
      );
    } finally {
      if (mounted.current) await load();
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function showAudit() {
    try {
      const r = await apiJson("/dsh-purge/audit?limit=10");
      const lines = (r.entries || []).map(
        (x) =>
          `${new Date(x.at).toLocaleString()}  ${x.event}  ${JSON.stringify(
            Object.fromEntries(
              Object.entries(x).filter(
                ([k]) => !["at", "event", "pid"].includes(k),
              ),
            ),
          )}`,
      );
      setNotice(lines.length ? lines.join("\n") : "还没有动作记录");
    } catch (e) {
      setNotice(e.message);
    }
  }

  return h(
    "section",
    { className: "dshpp-panel", "aria-label": "维护" },
    h("h3", null, "维护：本机备份"),
    h(
      "p",
      { className: "dshpp-hint" },
      "插件更新不由本面板发起：请通过 DSH 插件市场或手动安装升级。这里只做本机快照与回滚，不联网检查版本。",
    ),
    h(
      "div",
      { className: "dshpp-row" },
      h(
        Btn,
        { disabled: busy || listState === "loading", onClick: load },
        "刷新备份列表",
      ),
      h(Btn, { disabled: busy, onClick: () => run("backup") }, "立即备份"),
      h(Btn, { disabled: busy, onClick: showAudit }, "最近动作"),
      h(
        "a",
        {
          href: "https://github.com/youki258/dsh-purge-minimal/releases",
          target: "_blank",
          rel: "noreferrer",
        },
        "发行记录",
      ),
    ),
    listState === "loading"
      ? h("p", { role: "status" }, "正在读取备份…")
      : null,
    listState === "error"
      ? h("p", { role: "alert" }, `读取备份失败：${listError}`)
      : null,
    listState === "ready" && !value?.backups?.length
      ? h("p", { role: "status" }, "暂无备份")
      : null,
    h(
      "div",
      { className: "dshpp-row" },
      h(
        "select",
        {
          "aria-label": "选择回滚备份",
          value: selected,
          onChange: (e) => setSelected(e.target.value),
          disabled: busy || listState !== "ready",
        },
        h("option", { value: "" }, "选择备份"),
        ...(value?.backups || []).map((b) =>
          h(
            "option",
            { key: b.id, value: b.id },
            `${new Date(b.created_at).toLocaleString()} · ${b.plugins.map((p) => p.version).join(" / ")}`,
          ),
        ),
      ),
      h(
        Btn,
        {
          disabled: busy || !selected || listState !== "ready",
          onClick: () => run("rollback"),
        },
        "回滚插件",
      ),
      h(
        HelpTip,
        { title: "回滚范围" },
        "只回滚 Purge 插件目录与入口，保留提示词、规则与其他插件设置。",
      ),
    ),
    h(
      "p",
      { className: "dshpp-hint" },
      "备份只保存在本机。回滚后需要重启 DSH 进程；仅刷新浏览器不会加载新版后端。",
    ),
    notice ? h("p", { role: "status" }, notice) : null,
  );
}
