import { apiUrl } from "../api/client.js";
// UI derived from YuJunZhiXue/dsh-purge 1.1.71 (MIT). See LICENSE.
import { incompleteApplyDetail } from "../shared/apply-result.js";
import { runtimeRepairDetails } from "../shared/runtime-error.js";
import {
  h,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "../shared/react.js";
import { useT } from "../shared/locale.js";
import {
  clientGuessSurface,
  hostSurfaceOf,
  hostText,
  apiJson,
  unavailableStatus,
  promptBoxEmpty,
  responseNeedsPrompt,
  bothInjectEmpty,
} from "../api/client.js";
import {
  shimKind,
  patchRowsOf,
  tallyPatches,
  PatchGroups,
} from "./patch-status.js";
import { noticeNode, Btn } from "./primitives.js";
import { RestartAsk, restartDsh, detectHostTheme } from "./restart.js";

export function PurgifySection({ page = "status", onStatus } = {}) {
  const t = useT();
  const tRef = useRef(t);
  tRef.current = t;
  const [state, setState] = useState(null);
  useEffect(() => {
    if (onStatus) onStatus(state);
  }, [state, onStatus]);
  const [override, setOverride] = useState("");
  const [defaultOverride, setDefaultOverride] = useState("");
  const [overrideLoaded, setOverrideLoaded] = useState(false);
  const [ownServers, setOwnServers] = useState("");
  const [ownLoaded, setOwnLoaded] = useState(false);
  const [ownBusy, setOwnBusy] = useState(false);
  const ownPending = useRef(false);
  const promptPending = useRef(false);
  const ownRef = useRef("");
  ownRef.current = ownServers;
  const [patchBusy, setPatchBusy] = useState(false);
  const [askRestart, setAskRestart] = useState(false);
  const suppressRestartAsk = useRef(false);
  const [askUninstall, setAskUninstall] = useState(false);
  const [uninstallBusy, setUninstallBusy] = useState(false);
  const [notice, setNotice] = useState({ kind: "idle", text: "" });
  const actionTicket = useRef(0);
  const overrideRef = useRef("");
  const defaultOverrideRef = useRef("");
  const promptSeededRef = useRef(false);
  const ownSeededRef = useRef(false);
  const promptAreaRef = useRef(null);
  overrideRef.current = override;
  defaultOverrideRef.current = defaultOverride;

  const readPromptBox = () => {
    const node = promptAreaRef.current;
    const live =
      node && typeof node.value === "string" ? node.value : overrideRef.current;
    overrideRef.current = live || "";
    return overrideRef.current;
  };


  const loadAll = useCallback(() => {
    const tr = tRef.current;
    apiJson("/dsh-purge/status")
      .then((d) => {
        if (d && d.ok) {
          setState(d);
          setNotice((previous) =>
            previous?.source === "status"
              ? { kind: "idle", text: "" }
              : previous,
          );
          if (d.boot_full_quit && !suppressRestartAsk.current)
            setAskRestart(true);
        } else {
          setState(unavailableStatus(d?.error || "bad response"));
          setNotice({
            kind: "error",
            source: "status",
            text: tr("err.status", { error: (d && d.error) || "bad response" }),
          });
        }
      })
      .catch((e) => {
        setState(unavailableStatus(e));
        setNotice({
          kind: "error",
          source: "status",
          text: tr("err.status", { error: e.message }),
        });
      });
    apiJson("/dsh-purge/override")
      .then((d) => {
        if (d && d.ok) {
          const packed =
            typeof d.defaultContent === "string" ? d.defaultContent : "";
          const shown = typeof d.content === "string" ? d.content : packed;
          if (packed) setDefaultOverride(packed);
          if (!promptSeededRef.current) {
            promptSeededRef.current = true;
            setOverride(shown || packed);
          }
          setOverrideLoaded(true);
        } else
          setNotice({
            kind: "error",
            text: tr("err.override", { error: (d && d.error) || "" }),
          });
      })
      .catch((e) =>
        setNotice({
          kind: "error",
          text: tr("err.override", { error: e.message }),
        }),
      );
    apiJson("/dsh-purge/own-servers")
      .then((d) => {
        if (d && d.ok) {
          if (!ownSeededRef.current) {
            ownSeededRef.current = true;
            setOwnServers(typeof d.content === "string" ? d.content : "");
          }
          setOwnLoaded(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadAll();
    // Load once. Re-reading editable fields after five seconds overwrote unsaved input.
  }, [loadAll]);

  const rejectNeedPrompt = useCallback((tr) => {
    setAskRestart(false);
    setNotice({ kind: "error", text: tr("need.prompt") });
    setTimeout(() => window.alert(tr("need.prompt")), 0);
  }, []);

  const doAction = useCallback(
    (action, actionKey) => {
      const tr = tRef.current;
      const label = tr(actionKey);
      const ticket = ++actionTicket.current;
      const run = () => {
        setPatchBusy(true);
        setAskRestart(false);
        setNotice({ kind: "idle", text: "" });
        const applyContent = action === "apply" ? readPromptBox() : "";
        fetch(apiUrl("/dsh-purge/" + action), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            action === "apply" ? { content: applyContent } : {},
          ),
        })
          .then((r) => r.json())
          .then((d) => {
            if (ticket !== actionTicket.current) return;
            if (responseNeedsPrompt(d)) {
              rejectNeedPrompt(tr);
              return;
            }
            if (!d.ok) {
              setNotice({
                kind: "error",
                text: tr("err.action", {
                  action: label,
                  error: [
                    d.error || "",
                    ...runtimeRepairDetails(d.cli_repair),
                  ].join("\n"),
                }),
              });
              return;
            }
            if (action === "apply") {
              if (typeof d.defaultContent === "string")
                setDefaultOverride(d.defaultContent);
              if (typeof d.override_content === "string") {
                setOverride(d.override_content);
                setOverrideLoaded(true);
              }
            }
            if (action === "apply" && d.complete === false) {
              setNotice({
                kind: "error",
                text: tr("restart.incomplete", {
                  detail: incompleteApplyDetail(d, tr),
                }),
              });
              loadAll();
              if (d.restarting || d.needs_full_quit) {
                suppressRestartAsk.current = false;
                setAskRestart(true);
              }
              return;
            }
            if (action === "apply") {
              if (d.manualQuit) {
                setNotice({
                  kind: "ok",
                  text: "补丁已写入磁盘，当前进程尚未加载。换包助手等待你完整退出（macOS 用 ⌘Q，Windows 从系统托盘退出）。确认换包完成后再手动打开 DSH，不会自动重启。",
                });
                setAskRestart(false);
                loadAll();
                return;
              }
              setNotice({ kind: "ok", text: tr("ok.done") });
              loadAll();
              if (d.restarting || d.needs_full_quit) {
                suppressRestartAsk.current = false;
                setAskRestart(true);
              } else {
                setAskRestart(false);
              }
              return;
            }
            setNotice({ kind: "ok", text: tr("ok.done") });
            loadAll();
          })
          .catch((e) => {
            if (ticket !== actionTicket.current) return;
            setNotice({
              kind: "error",
              text: tr("err.action", { action: label, error: e.message }),
            });
          })
          .finally(() => {
            if (ticket === actionTicket.current) setPatchBusy(false);
          });
      };
      run();
    },
    [loadAll, rejectNeedPrompt, state],
  );

  const saveOverride = useCallback(async () => {
    if (promptPending.current) return;
    promptPending.current = true;
    const ticket = ++actionTicket.current;
    const content = readPromptBox();
    setPatchBusy(true);
    setNotice({ kind: "idle", text: "" });
    try {
      if (await bothInjectEmpty(content, defaultOverrideRef.current)) {
        rejectNeedPrompt(t);
        return;
      }
      const d = await apiJson("/dsh-purge/override", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (ticket !== actionTicket.current) return;
      if (responseNeedsPrompt(d)) {
        rejectNeedPrompt(t);
        return;
      }
      if (!d || !d.ok) throw new Error((d && d.error) || "保存失败");
      const unchanged = readPromptBox() === content;
      if (unchanged && typeof d.content === "string") {
        overrideRef.current = d.content;
        setOverride(d.content);
      }
      setNotice({
        kind: "ok",
        text: unchanged
          ? t("saved.override")
          : "已保存提交的版本；当前修改尚未保存。",
      });
    } catch (e) {
      if (ticket === actionTicket.current)
        setNotice({ kind: "error", text: t("err.save", { error: e.message }) });
    } finally {
      promptPending.current = false;
      if (ticket === actionTicket.current) setPatchBusy(false);
    }
  }, [t, rejectNeedPrompt]);

  const saveOwnServers = async () => {
    if (ownPending.current || !ownLoaded) return;
    ownPending.current = true;
    setOwnBusy(true);
    const content = ownRef.current;
    try {
      const d = await apiJson("/dsh-purge/own-servers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!d || !d.ok) throw new Error((d && d.error) || "保存失败");
      const unchanged = ownRef.current === content;
      if (unchanged && typeof d.content === "string") {
        ownRef.current = d.content;
        setOwnServers(d.content);
      }
      setNotice({
        kind: "ok",
        text: !unchanged
          ? "已保存提交的版本；当前修改尚未保存。"
          : d.dropped > 0
            ? t("saved.own.dropped", { n: d.dropped })
            : t("saved.own"),
      });
    } catch (e) {
      setNotice({ kind: "error", text: t("err.save", { error: e.message }) });
    } finally {
      ownPending.current = false;
      setOwnBusy(false);
    }
  };

  const restoreOverride = useCallback(() => {
    if (!defaultOverride) return;
    const tr = t;
    const ticket = ++actionTicket.current;
    overrideRef.current = defaultOverride;
    setOverride(defaultOverride);
    setPatchBusy(true);
    setNotice({ kind: "idle", text: "" });
    apiJson("/dsh-purge/override", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: defaultOverride }),
    })
      .then((d) => {
        if (ticket !== actionTicket.current) return;
        if (!d || !d.ok) {
          setNotice({
            kind: "error",
            text: tr("err.save", { error: (d && d.error) || "" }),
          });
          return;
        }
        const unchanged = readPromptBox() === defaultOverride;
        if (typeof d.content === "string" && unchanged) {
          overrideRef.current = d.content;
          setOverride(d.content);
        }
        setNotice({
          kind: "ok",
          text: unchanged
            ? tr("saved.restoreInject")
            : "已恢复默认值；当前修改尚未保存。",
        });
      })
      .catch((e) => {
        if (ticket !== actionTicket.current) return;
        setNotice({
          kind: "error",
          text: tr("err.save", { error: e.message }),
        });
      })
      .finally(() => {
        if (ticket === actionTicket.current) setPatchBusy(false);
      });
  }, [defaultOverride, t]);

  const waitHostAfterUninstall = useCallback((tr) => {
    const started = Date.now();
    const ping = () => {
      fetch(apiUrl("/"), { cache: "no-store", credentials: "same-origin" })
        .then((r) => {
          if (r.ok) {
            try {
              window.localStorage.removeItem("dshpp-theme");
              window.localStorage.removeItem("dshpp-theme-mode");
            } catch {
              /* ignore */
            }
            window.location.reload();
            return;
          }
          retry();
        })
        .catch(retry);
    };
    const retry = () => {
      if (Date.now() - started > 90000) {
        setNotice({ kind: "error", text: tr("restart.timeout") });
        setUninstallBusy(false);
        return;
      }
      setTimeout(ping, 500);
    };
    setTimeout(ping, 800);
  }, []);

  const doUninstall = useCallback(() => {
    setUninstallBusy(true);
    setAskUninstall(false);
    setAskRestart(false);
    const tr = tRef.current;
    setNotice({ kind: "ok", text: tr("uninstall.applying") });
    apiJson("/dsh-purge/uninstall", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    })
      .then((d) => {
        if (!d || !d.ok) throw new Error((d && d.error) || "uninstall failed");
        setNotice({
          kind: "ok",
          text:
            (d && d.note) ||
            hostText(tr, "uninstall.done", d.surface || hostSurfaceOf(state)),
        });
        if (
          (d && d.surface) === "desktop" ||
          (d && d.fullApp) ||
          hostSurfaceOf(state) === "desktop"
        )
          return;
        waitHostAfterUninstall(tr);
      })
      .catch((e) => {
        const msg = String((e && e.message) || e || "");
        if (/failed to fetch|networkerror|load failed/i.test(msg)) {
          setNotice({
            kind: "ok",
            text: hostText(tr, "uninstall.done", hostSurfaceOf(state)),
          });
          if (
            hostSurfaceOf(state) === "desktop" ||
            clientGuessSurface() === "desktop"
          )
            return;
          waitHostAfterUninstall(tr);
          return;
        }
        setNotice({
          kind: "error",
          text: tr("uninstall.fail", { error: msg }),
        });
        setUninstallBusy(false);
      });
  }, [state, waitHostAfterUninstall]);

  const s = state;
  const located = !!(s && s.ai_base);
  const hostSurface = hostSurfaceOf(s);
  const desktopLikely =
    hostSurface === "desktop" || clientGuessSurface() === "desktop";
  const sealedReady =
    !located &&
    desktopLikely &&
    !!(s && (s.asar_still_sealed || s.desktop_exe || s.desktop_install));
  const patchesLost = !located && !!(s && s.patches_lost);
  const tally = located
    ? tallyPatches(patchRowsOf(s))
    : { applied: 0, pending: 0, unmatched: 0, skipped: 0, total: 0 };
  const total = tally.total;
  const applied = tally.applied;
  const pct = located && total ? Math.round((applied / total) * 100) : 0;
  const metricNotes = [];
  if (tally.pending)
    metricNotes.push(t("metric.pendingShort", { n: tally.pending }));
  if (tally.unmatched)
    metricNotes.push(t("metric.unmatchedShort", { n: tally.unmatched }));
  if (tally.partial)
    metricNotes.push(t("metric.partialShort", { n: tally.partial }));
  if (tally.drifted)
    metricNotes.push(t("metric.driftedShort", { n: tally.drifted }));
  if (tally.disabled)
    metricNotes.push(t("metric.disabledShort", { n: tally.disabled }));
  if (tally.skipped)
    metricNotes.push(t("metric.skipShort", { n: tally.skipped }));

  return h(
    "section",
    { className: "dshpp-panel", "aria-label": t("purge.title") },
    h(
      "div",
      { hidden: page !== "status" },
      h(
        "div",
        { className: "dshpp-hero" },
        h(
          "div",
          { className: "dshpp-hero-state" },
          h("i", {
            className:
              "dshpp-dot " +
              (!located
                ? "is-warn"
                : patchBusy
                  ? ""
                  : s?.ok === false || s?.asar_still_sealed
                    ? "is-warn"
                    : "is-ok"),
          }),
          h(
            "b",
            null,
            !s
              ? "正在读取宿主状态…"
              : s.ok === false
                ? "状态读取失败，宿主与补丁状态未知"
                : !located
                  ? sealedReady
                    ? "宿主还没解开：点「应用」"
                    : "未定位到宿主：点「应用」重试"
                  : s?.asar_still_sealed
                    ? `${applied}/${total} 条磁盘补丁（退出重开后加载）`
                    : tally.pending
                      ? `补丁已还原 ${applied}/${total} · 点「应用」重新挂上`
                      : applied === total
                        ? `全部就绪：补丁 ${applied}/${total} 生效`
                        : `${applied}/${total} 条补丁已生效`,
          ),
          h(
            "span",
            { className: "dshpp-hero-sub" },
            [
              t("surface." + hostSurface),
              s && s.inject
                ? s.inject.chars > 0
                  ? `${t("inject.on")} ${(s.inject.chars / 1000).toFixed(1)}K 字`
                  : t("inject.off")
                : "",
            ]
              .filter(Boolean)
              .join(" · "),
          ),
        ),
        h(
          "div",
          { className: "dshpp-hero-actions" },
          h(
            Btn,
            {
              kind: "primary",
              className: "dshpp-btn-lead",
              disabled: patchBusy || uninstallBusy || !overrideLoaded,
              onClick: () => doAction("apply", "action.apply"),
            },
            patchBusy ? t("btn.apply.busy") : t("btn.apply"),
          ),
          h(
            Btn,
            {
              kind: "danger",
              title: t("btn.revert.tip"),
              disabled: patchBusy || uninstallBusy,
              onClick: () => doAction("revert", "action.revert"),
            },
            t("btn.revert"),
          ),
          h(
            Btn,
            {
              kind: "solid-danger",
              disabled: patchBusy || uninstallBusy,
              onClick: () => setAskUninstall(true),
            },
            uninstallBusy ? t("btn.uninstall.busy") : t("btn.uninstall"),
          ),
          h(
            Btn,
            {
              tiny: true,
              onClick: loadAll,
              disabled: patchBusy || uninstallBusy,
            },
            "刷新",
          ),
        ),
        h(
          "p",
          { className: "dshpp-hero-hint" },
          "装好插件、更新过 DSH、或发现模型又开始推脱时：点一次「应用」，然后退出并重开 DSH，就会恢复。",
        ),
        noticeNode(notice),
      ),
      h(
        "details",
        { className: "dshpp-fold" },
        h(
          "summary",
          null,
          "补丁明细 ",
          h(
            "b",
            null,
            !s
              ? "读取中"
              : s.ok === false
                ? "状态未知"
                : s.ai_base
                  ? `${applied}/${total} 已应用`
                  : "未定位宿主",
          ),
        ),
        h(PatchGroups, { state: s }),
      ),
      askUninstall
        ? h(
            "div",
            {
              className: "dshpp-modal-bg",
              role: "dialog",
              "aria-modal": "true",
              "aria-labelledby": "dshpp-uninstall-title",
              onClick: (e) => {
                if (e.target === e.currentTarget && !uninstallBusy)
                  setAskUninstall(false);
              },
            },
            h(
              "div",
              { className: "dshpp-modal" },
              h("h4", { id: "dshpp-uninstall-title" }, t("uninstall.title")),
              h("p", null, t("uninstall.body")),
              h(
                "div",
                { className: "dshpp-modal-ops" },
                h(
                  Btn,
                  {
                    disabled: uninstallBusy,
                    onClick: () => setAskUninstall(false),
                  },
                  t("uninstall.cancel"),
                ),
                h(
                  Btn,
                  {
                    kind: "solid-danger",
                    disabled: uninstallBusy,
                    onClick: doUninstall,
                  },
                  t("uninstall.confirm"),
                ),
              ),
            ),
          )
        : null,
      h(
        "p",
        {
          className: "dshpp-hint",
          style: {
            margin: "8px 0 0",
            color: "var(--dshpp-mute)",
            fontSize: 12,
          },
        },
        t("apply.hint"),
      ),
      s?.ok === true && !s.ai_base
        ? h(
            "p",
            {
              className: "dshpp-hint",
              style: {
                margin: "8px 0 0",
                color: "var(--dshpp-danger, #c44)",
                fontSize: 12,
              },
            },
            hostText(t, "warn.noRoot", hostSurface),
          )
        : null,
      s && s.ai_base && s.override_status === "missing"
        ? h(
            "p",
            {
              className: "dshpp-hint",
              style: {
                margin: "8px 0 0",
                color: "var(--dshpp-mute)",
                fontSize: 12,
              },
            },
            t("warn.noInject"),
          )
        : null,
      askRestart
        ? h(RestartAsk, {
            t: t,
            theme: detectHostTheme(),
            onLater: () => {
              suppressRestartAsk.current = true;
              setAskRestart(false);
            },
            onRestart: () => {
              suppressRestartAsk.current = true;
              setAskRestart(false);
              restartDsh(setNotice, function () {}, t, hostSurface);
            },
          })
        : null,
    ),
    h(
      "div",
      { hidden: page !== "prompt" },
      h(
        "div",
        { className: "dshpp-sub" },
        h("h4", null, t("override.title")),
        h(
          "div",
          { className: "dshpp-row", style: { margin: 0 } },
          h(
            Btn,
            {
              kind: "primary",
              tiny: true,
              disabled: patchBusy || !overrideLoaded,
              onClick: saveOverride,
            },
            t("btn.saveInject"),
          ),
          h(
            Btn,
            {
              tiny: true,
              disabled: patchBusy || !overrideLoaded || !defaultOverride,
              onClick: restoreOverride,
            },
            t("btn.restoreInject"),
          ),
        ),
      ),
      h("textarea", {
        className: "dshpp-area",
        ref: promptAreaRef,
        "aria-label": "提示词内容",
        disabled: !overrideLoaded,
        value: override,
        onChange: (e) => {
          overrideRef.current = e.target.value;
          setOverride(e.target.value);
        },
        spellCheck: false,
        placeholder: "",
      }),
      noticeNode(notice),
      promptBoxEmpty(override)
        ? h(
            "p",
            {
              className: "dshpp-hint",
              style: {
                margin: "8px 0 0",
                color: "var(--dshpp-danger, #c44)",
                fontSize: 12,
              },
            },
            t("need.prompt"),
          )
        : null,
    ),
    h(
      "div",
      { hidden: page !== "more" },
      h(
        "div",
        { className: "dshpp-sub" },
        h("h4", null, t("own.title")),
        h(
          "div",
          { className: "dshpp-row", style: { margin: 0 } },
          h(
            Btn,
            {
              kind: "primary",
              tiny: true,
              disabled: !ownLoaded || ownBusy,
              onClick: saveOwnServers,
            },
            t("own.save"),
          ),
        ),
      ),
      h("textarea", {
        className: "dshpp-area",
        "aria-label": "服务器名单",
        disabled: !ownLoaded,
        value: ownServers,
        onChange: (e) => {
          ownRef.current = e.target.value;
          setOwnServers(e.target.value);
        },
        spellCheck: false,
        rows: 4,
        style: { minHeight: 96 },
      }),
      h(
        "p",
        {
          className: "dshpp-hint",
          style: {
            margin: "8px 0 0",
            color: "var(--dshpp-mute)",
            fontSize: 12,
          },
        },
        t("own.hint"),
      ),
      noticeNode(notice),
    ),
  );
}
