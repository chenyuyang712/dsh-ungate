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
                : uncertain.length
                  ? "is-warn"
                  : "is-ok" // 还原后的 pending 是主动状态，不算故障，不给警示色
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
                ? `补丁 ${pendingPatches} 条未挂（还原后属正常）`
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
                      (layer.state === "pending"
                        ? ""
                        : ["inferred", "unknown"].includes(layer.state)
                          ? " is-warn"
                          : layer.ok
                            ? ""
                            : " is-bad"),
                  },
                  h("i", {
                    className:
                      "dshpp-dot " +
                      (layer.state === "pending"
                        ? "" // 还原后的待挂是主动状态
                        : ["inferred", "unknown"].includes(layer.state)
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
