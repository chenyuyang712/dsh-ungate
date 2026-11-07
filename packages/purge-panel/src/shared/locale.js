// UI derived from YuJunZhiXue/dsh-purge 1.1.71 (MIT). See LICENSE.

export const NS = "settings.dsh-purge-panel";

export let translate = (key) => key;

export function setTranslate(t) {
  translate = t;
}

export function useT() {
  return translate;
}

export const zh = {
  nav: "规则设定",

  "compat.host":
    "dsh-purge Community {version} · 宿主 DSH {host} · 兼容级别：{level}",
  "compat.loading": "正在读取宿主版本…",
  "compat.unavailable": "读不到宿主兼容信息：{error}",
  "compat.level.qualified": "已回归验证",
  "compat.level.unverified": "未验证版本",
  "compat.level.mixed": "组件版本不一致",
  "compat.level.no-host": "未定位宿主",
  "compat.level.unknown": "未知",

  "purge.title": "补丁",
  "override.title": "提示词",
  "own.title": "自己的服务器",
  "own.hint":
    "每行一个 IP 或完整主机名。可以写成 账号@主机，账号只用来认出这种写法。主机名会连同它当时解析出的地址一起放行。不要写密钥、密码、网段。",
  "own.save": "保存名单",
  "saved.own": "已保存自己的服务器",
  "saved.own.dropped": "已保存。有 {n} 行不是单个 IP 或主机名，已丢掉",

  "metric.pendingShort": "待处理 {n}",
  "metric.unmatchedShort": "没对上 {n}",
  "metric.partialShort": "部分命中 {n}",
  "metric.driftedShort": "锚点漂移 {n}",
  "metric.disabledShort": "可选关闭 {n}",
  "metric.skipShort": "跳过 {n}",

  "table.patch": "项目",
  "table.status": "状态",
  "status.applied": "已应用",

  "status.pending": "待应用",
  "status.unmatched": "没对上",
  "status.partial": "部分命中",
  "status.partialDetail": "（{done}/{total} 目标）",
  "status.drifted": "锚点漂移",
  "status.disabled": "可选关闭",
  "status.skipped": "跳过",
  "apply.hint":
    "点应用会打补丁并把当前默认提示词挂上，框里仍是插件旧默认时自动刷到加密槽，不必再点保存。只有你另写的稿才会按框落盘。待应用=原文还在。跳过=当前版本不需要或组件未安装。",
  "warn.noRoot":
    "未定位到当前宿主的 @deepseek-ai，清洗不会生效。请完全退出后再打开本宿主，在本页点「应用」。桌面端安装目录可以是任意盘符；目录名带 DeepseekHarness / DeepSeek Harness 均可。",

  "restart.fullQuit": "正在重启，客户端会自己重新打开。",
  "warn.noInject":
    "官方始终用默认提示词。红队开了规则集就只用规则集；没开时用去掉 CTF 的默认提示词，再接红队操作。两边都空会提示必须添加。",
  "need.prompt":
    "提示词和规则集都是空的，必须先添加提示词，或启用一条有内容的规则集。",
  "btn.restoreInject": "恢复默认",
  "saved.restoreInject": "已恢复默认提示词",
  skip: "跳过",
  unknown: "未知",
  delete: "删除",
  "btn.apply": "应用",
  "btn.apply.busy": "处理中…",
  "btn.revert": "还原",
  "btn.revert.tip": "还原只撤宿主补丁；提示词注入与本插件运行时不受影响。",
  "inject.on": "注入",
  "inject.off": "注入正文为空",
  "btn.uninstall": "卸载",
  "btn.uninstall.busy": "卸载中…",
  "uninstall.title": "卸载插件",
  "uninstall.body":
    "是否卸载？卸载将还原回原版，并清除本插件的全部文件与补丁。",
  "uninstall.confirm": "确认卸载",
  "uninstall.cancel": "取消",
  "uninstall.applying": "正在卸载并还原…",
  "uninstall.done": "已卸载并还原，正在重启…",

  "uninstall.fail": "卸载失败: {error}",

  "restart.official.title": "需要重启",
  "restart.official.body": "补丁已写入。点重启后客户端会自己重新打开。",

  "update.tip": "最新",
  "update.current": "当前",


  "action.apply": "应用",
  "action.revert": "还原",

  "ok.done": "已完成",
  "err.action": "失败: {error}",
  "err.status": "读取失败: {error}",
  "err.override": "读取失败: {error}",

  "err.save": "保存失败: {error}",
  "btn.saveInject": "保存",
  "saved.override": "已保存",





  restarting: "重启中…",

  "restart.timeout": "超时，请刷新",
  "restart.fail": "失败: {error}",
  "restart.notStarted": "重启没有开始，客户端还在。不会自动再试。",
  "restart.already": "这一次重启已经开始，不会再重启一次。",
  "restart.confirm": "清洗已完成，重启后生效。",
  "restart.confirm.desktop": "清洗已完成，重启桌面应用后生效。",
  "restart.ask.title": "要现在重启吗",
  "restart.ask.body": "已经写入。重启后才会在当前客户端里生效。",
  "restart.now": "现在重启",
  "restart.notNow": "稍后",
  "restart.asarSwap":
    "补丁已写入磁盘。正在结束桌面进程并挪开 app.asar，完成后会自动重新打开；若仍无效，请先完全退出 Harness（托盘也关），再点一次应用。",
  "surface.web": "Web",
  "surface.desktop": "桌面端",
  "surface.gui": "GUI",
  "surface.tui": "TUI",
  "restart.incomplete": "应用未完成。{detail}",
  "restart.incomplete.patches":
    "有 {failed} 项处理失败（#{ids}），请查看补丁明细",
  "restart.incomplete.flash": "终端窗口抑制检查未通过（{entry}）",
  "restart.incomplete.host":
    "未确认目标宿主写入完成，请核对客户端、宿主版本和目标路径",
  "restart.incomplete.restore": "配置恢复未完成，请查看诊断记录",
  "restart.incomplete.runtime": "CLI 运行时检查或修复失败，请查看诊断记录",
  "restart.incomplete.unknown":
    "当前后端未返回具体原因，请查看宿主版本、补丁明细和诊断结果",
  "restart.later": "以后",
  "group.prompt": "提示词",
  "group.code": "代码",
  "group.engine": "引擎",
  "group.tools": "工具",
  "group.compat": "完整模式兜底",
  "group.dsh20": "0.2.0",
  "patch.1": "全局免责 → 强指令",
  "patch.2": "替换式免责 → 强指令",
  "patch.3": "作用域免责 → 强指令",
  "patch.4": "persona 会话强指令",
  "patch.5": "审批提示句 → 全权限",
  "patch.6": "沙箱 deny → allow 写",
  "patch.7": "沙箱默认全权限",
  "patch.8": "审批默认 never",
  "patch.9": "审批门自动放行",
  "patch.10": "审批配置默认 never",
  "patch.11": "never 提示句 → 自动放行",
  "patch.12": "ask 提示句 → 自动放行",
  "patch.13": "豁免升级阶梯",
  "patch.14": "升级无条件授信",
  "patch.15": "沙箱 confine 直通",
  "patch.16": "文件系统围栏取消",
  "patch.17": "观察策略读写放行",
  "patch.18": "重复调用守卫禁用",
  "patch.19": "工具结果修剪禁用",
  "patch.21": "恢复插件延长的 bash 等待",
  "patch.22": "read 上限放宽",
  "patch.23": "子代理深度 3 → 10",
  "patch.24": "preset fetch 启用",
  "patch.25": "去掉官方默认身份（功能提示词不动）",
  "patch.26": "minimal：去掉默认身份并打开 inject",
  "patch.28": "dsh-liangshen（梁神）：phase-1 保留 dsh-purge / dshpg 段",
  "patch.70": "极简模式终端不再禁止网络",
  "patch.71": "梁神去掉官方身份句",
  "patch.29": "dsh-tool-web：外部 untrusted 拦截→可执行",
  "patch.30": "dsh-hooks-claude-code：deny→allow",
  "patch.31": "dsh-hooks-codex：deny→allow",
  "patch.32": "Web 表面身份中性化",
  "patch.33": "Shell 拒绝提示 → 可执行",
  "patch.34": "沙箱提示中性化",
  "patch.35": "升级 never 不拒",
  "patch.36": "文件系统升级 schema 放行",
  "patch.37": "子代理 scope lock 中性化",
  "patch.38": "persona text→prefix（0.1.2 预设）",
  "patch.39": "会话 v0 plugin summary（mnemon）",
  "patch.40": "complete 预设仍保留注入",
  "patch.42": "设置页旧接口",
  "patch.43": "网页预设去掉默认身份",
  "patch.45": "官方桌面更新交接",
  "patch.46": "官方更新脚本只用英文",
  "patch.47": "OAuth 不再插入 Claude 身份",
  "patch.48": "shell 去掉删除前的额外确认",
  "patch.49": "OAuth 不再伪装 claude-cli",
  "patch.50": "跨会话引用不再标不可信",
  "patch.51": "新会话保持完全权限",
  "patch.52": "会话日志默认不上传",
  "patch.53": "网页提示去掉禁止另开服务器",
  "patch.54": "交付物提示去掉多余禁止",
  "patch.55": "每一步替换第一条系统提示",
  "patch.56": "回退只藏被撤掉的那一轮",
  "patch.57": "developer role 仅限 openai/azure，第三方代理回退 system",
  "patch.58": "回退空标记不进模型请求",
  "patch.59": "官方 Auto Review 不再拦工具",
  "patch.60": "官方 run_code 去掉审批教学",
  "patch.61": "官方沙箱策略不再教拒绝",
  "patch.62": "无审批通道时放行（用户拒绝仍有效）",
  "patch.63": "计划模式不再软拦执行",
  "patch.64": "Stop hook 不再注入假用户话",
  "patch.65": "UserPromptSubmit deny 不再整轮 reject",
  "patch.66": "空的系统段不再把这一轮打成内部错误",
  "patch.67": "缺 messages 时这一轮不中断",
  "patch.68": "回退后缺 content 不中断",
  "patch.69": "deepseek-flash 保持官方 in-history",
  "patch.72": "Messages 的 system 用当前系统提示",
  "patch.73": "极简 bash 去掉误留的镜像说明",
  "patch.74": "首发前先挂默认提示词",
  "patch.75": "回退把已完成任务收回成未开始",
  "patch.76": "unrestricted 预设去掉身份句",
  "patch.77": "回退标记到达时丢弃已发送消息",
  "patch.78": "补丁文件缺失时从 .bak 恢复",
  "patch.80": "恢复官方极简工具表",
  "patch.82": "主进程兜底 DSH_PROFILE=desktop",
  "patch.83": "host 信号杀时不报错不弹对话框",
  "patch.84": "host code=0 正常退出不报错 (消除 stopped 对话框)",
  "status.unlocated": "未定位",
  "status.na": "本端不需要",

  "rewind.label": "回退",
  "rewind.aria": "回退",
  "rewind.busy": "回退中…",

  "rewind.fail": "回退失败: {error}",
  "rewind.once": "回退一次",
  "rewind.once.hint": "把这一轮发出去的那句放回输入框，并清掉这一轮",
  "rewind.round": "回退上一轮",
  "rewind.round.hint": "把这一轮发出去的那句放回输入框；子代理也只撤这一轮",

};

export const en = {
  nav: "Rules",

  "compat.host":
    "dsh-purge Community {version} · host DSH {host} · compatibility: {level}",
  "compat.loading": "Reading the host version…",
  "compat.unavailable": "Host compatibility is unavailable: {error}",
  "compat.level.qualified": "regression verified",
  "compat.level.unverified": "unverified version",
  "compat.level.mixed": "mixed component versions",
  "compat.level.no-host": "host not located",
  "compat.level.unknown": "unknown",

  "purge.title": "Patches",
  "override.title": "Prompt",
  "own.title": "Own servers",
  "own.hint":
    "One IP or exact hostname per line. account@host is accepted; the account only identifies that host. A hostname also allows the addresses it resolves to. Do not enter a key, a password, or a range.",
  "own.save": "Save list",
  "saved.own": "Own servers saved",
  "saved.own.dropped":
    "Saved. {n} lines were not a single IP or hostname and were dropped",

  "metric.pendingShort": "Pending {n}",
  "metric.unmatchedShort": "No match {n}",
  "metric.partialShort": "Partial {n}",
  "metric.driftedShort": "Drifted {n}",
  "metric.disabledShort": "Opt-in off {n}",
  "metric.skipShort": "Skipped {n}",

  "table.patch": "Item",
  "table.status": "Status",
  "status.applied": "Applied",

  "status.pending": "Pending",
  "status.unmatched": "No match",
  "status.partial": "Partial",
  "status.partialDetail": " ({done}/{total} targets)",
  "status.drifted": "Drifted",
  "status.disabled": "Opt-in off",
  "status.skipped": "Skipped",
  "apply.hint":
    "Apply writes patches and hangs the current default prompt. A stale plugin default in the box is refreshed from the sealed slot; a separate save is unnecessary. Only a prompt you wrote yourself is kept from the box. Pending = original text still present. Skipped = not needed for this version or the component is not installed.",
  "warn.noRoot":
    "Could not find this host’s @deepseek-ai tree, so Apply will not patch anything. Fully quit and reopen this host, then Apply here. Desktop may live on any drive; folder names like DeepseekHarnessDesktop or DeepSeek Harness are fine.",

  "restart.fullQuit": "Restarting. The client will open again by itself.",
  "warn.noInject":
    "Official mode always uses the default prompt. Red team uses only the active rule set; otherwise it uses the default prompt without the CTF section, then the red team steps. If both are empty you will be asked to add a prompt.",
  "need.prompt":
    "Both the prompt and the rule set are empty. Add a prompt, or enable a rule that has content.",
  "btn.restoreInject": "Reset default",
  "saved.restoreInject": "Default prompt restored",
  skip: "Skipped",
  unknown: "Unknown",
  delete: "Delete",
  "btn.apply": "Apply",
  "btn.apply.busy": "Working…",
  "btn.revert": "Restore",
  "btn.revert.tip": "Revert only removes host patches; prompt injection and this plugin's runtime are untouched.",
  "inject.on": "inject",
  "inject.off": "inject body empty",
  "btn.uninstall": "Uninstall",
  "btn.uninstall.busy": "Uninstalling…",
  "uninstall.title": "Uninstall dsh-purge",
  "uninstall.body":
    "Uninstall? This restores the original Harness and removes this plugin completely.",
  "uninstall.confirm": "Uninstall",
  "uninstall.cancel": "Cancel",
  "uninstall.applying": "Uninstalling and restoring…",
  "uninstall.done": "Uninstalled and restored. Restarting…",

  "uninstall.fail": "Uninstall failed: {error}",

  "restart.official.title": "Restart required",
  "restart.official.body":
    "Patches are written. Click Restart and the client opens again by itself.",

  "update.tip": "latest",
  "update.current": "current",


  "action.apply": "Apply",
  "action.revert": "Restore",

  "ok.done": "Done",
  "err.action": "Failed: {error}",
  "err.status": "Read failed: {error}",
  "err.override": "Read failed: {error}",

  "err.save": "Save failed: {error}",
  "btn.saveInject": "Save",
  "saved.override": "Saved",





  restarting: "Restarting…",

  "restart.timeout": "Timed out; refresh",
  "restart.fail": "Failed: {error}",
  "restart.notStarted":
    "Restart did not start. This client is still open, and it will not try again by itself.",
  "restart.already": "This restart already started. It will not restart again.",
  "restart.confirm": "Apply finished. Restart to take effect.",
  "restart.confirm.desktop":
    "Apply finished. Restart the desktop app to take effect.",
  "restart.ask.title": "Restart now?",
  "restart.ask.body":
    "It is written. It takes effect in this client after a restart.",
  "restart.now": "Restart now",
  "restart.notNow": "Later",
  "restart.asarSwap":
    "Patches are on disk. Quitting the desktop app and moving app.asar aside; it will reopen when done. If behavior is unchanged, fully quit Harness (including tray) and Apply again.",
  "surface.web": "Web",
  "surface.desktop": "Desktop",
  "surface.gui": "GUI",
  "surface.tui": "TUI",
  "restart.incomplete": "Apply did not complete. {detail}",
  "restart.incomplete.patches":
    "{failed} item(s) failed (#{ids}); inspect the item details",
  "restart.incomplete.flash":
    "Console-window suppression check failed ({entry})",
  "restart.incomplete.host":
    "Target host writes are not confirmed; check the client, host version and target path",
  "restart.incomplete.restore":
    "Configuration restoration did not complete; inspect diagnostics",
  "restart.incomplete.runtime":
    "CLI runtime check or repair failed; inspect diagnostics",
  "restart.incomplete.unknown":
    "The backend did not provide a specific cause; inspect the host version, item details and diagnostics",
  "restart.later": "Later",
  "group.prompt": "Prompt",
  "group.code": "Code",
  "group.engine": "Engine",
  "group.tools": "Tools",
  "group.compat": "complete-mode fallback",
  "group.dsh20": "0.2.0",
  "patch.1": "Global disclaimer → mandate",
  "patch.2": "Replacement disclaimer → mandate",
  "patch.3": "Scope disclaimer → mandate",
  "patch.4": "Persona session mandate",
  "patch.5": "Approval copy → full access",
  "patch.6": "Sandbox deny → allow write",
  "patch.7": "Sandbox default full access",
  "patch.8": "Approval default never",
  "patch.9": "Approval gate auto-grant",
  "patch.10": "Approval config default never",
  "patch.11": "never copy → auto-grant",
  "patch.12": "ask copy → auto-grant",
  "patch.13": "Escalation ladder exempt",
  "patch.14": "Escalation unconditional grant",
  "patch.15": "Sandbox confine passthrough",
  "patch.16": "Filesystem fence off",
  "patch.17": "Observation policy allow R/W",
  "patch.18": "Repeat-call guard off",
  "patch.19": "Tool-result pruner off",
  "patch.21": "Restore plugin-raised bash wait",
  "patch.22": "read cap raised",
  "patch.23": "subagent depth 3 → 10",
  "patch.24": "preset fetch on",
  "patch.25": "Strip official default identity (keep feature prompts)",
  "patch.26": "minimal: strip identity, open inject",
  "patch.28": "dsh-liangshen: keep dsh-purge / dshpg in phase-1",
  "patch.70": "Minimal shell drops the no-network line",
  "patch.71": "Liangshen drops the stock identity line",
  "patch.29": "dsh-tool-web: untrusted framing → usable data",
  "patch.30": "dsh-hooks-claude-code: deny→allow",
  "patch.31": "dsh-hooks-codex: deny→allow",
  "patch.32": "Web surface identity neutral",
  "patch.33": "Shell denial prompt → executable",
  "patch.34": "Sandbox hint neutralized",
  "patch.35": "Escalation never-reject",
  "patch.36": "FS escalation schema opened",
  "patch.37": "Subagent scope lock neutralized",
  "patch.38": "persona text→prefix (0.1.2 presets)",
  "patch.39": "session v0 plugin summary (mnemon)",
  "patch.40": "Keep inject when a complete prompt is set",
  "patch.42": "Settings legacy API",
  "patch.43": "Strip identity from web presets",
  "patch.45": "Official desktop update handoff",
  "patch.46": "Official update script stays ASCII",
  "patch.47": "OAuth no longer inserts Claude identity",
  "patch.48": "Shell drops extra delete caution",
  "patch.49": "OAuth no longer mimics claude-cli",
  "patch.50": "Session references are not marked untrusted",
  "patch.51": "Fresh session stays on full access",
  "patch.52": "Session log upload off by default",
  "patch.53": "Web prompt drops do-not-start",
  "patch.54": "Deliverable prompt drops extra prohibition",
  "patch.55": "Replace the first system prompt every step",
  "patch.56": "Rewind hides only the cut range",
  "patch.57":
    "developer role for openai/azure only, third-party gateways use system",
  "patch.58": "Rewind markers stay off the model request",
  "patch.59": "Official Auto Review no longer denies tools",
  "patch.60": "Official run_code drops approval teaching",
  "patch.61": "Official sandbox policy no longer teaches refusal",
  "patch.62": "Fail-open without approval channel (user reject kept)",
  "patch.63": "Plan mode no longer soft-blocks execution",
  "patch.64": "Stop hook no longer steers fake user text",
  "patch.65": "UserPromptSubmit deny no longer rejects turn",
  "patch.66":
    "Empty system section no longer ends the turn as an internal error",
  "patch.67": "A missing messages list no longer ends the turn",
  "patch.68": "Missing content after rewind no longer ends the turn",
  "patch.69": "deepseek-flash keeps the official in-history flag",
  "patch.72": "Messages system field uses the current system prompt",
  "patch.73": "Minimal preset drops stray mirror sentence",
  "patch.74": "Hang default prompt before first assemble",
  "patch.75": "Rewind resets completed todos to pending",
  "patch.76": "Unrestricted preset: strip identity sentence",
  "patch.77": "Rewind marker drops already-sent messages",
  "patch.78": "Restore missing overlay from .bak backup",
  "patch.80": "Restore official minimal tool plugins",
  "patch.82": "Fallback DSH_PROFILE=desktop in main process",
  "patch.83": "Don't fail on signal kill (no crash dialog)",
  "patch.84": "Don't fail on code=0 clean exit (no stopped dialog)",
  "status.na": "Not for this host",

  "status.unlocated": "Not located",

  "rewind.label": "Undo",
  "rewind.aria": "Undo",
  "rewind.busy": "Undoing…",

  "rewind.fail": "Undo failed: {error}",
  "rewind.once": "Undo once",
  "rewind.once.hint":
    "Put this round's message back in the box and drop only this round",
  "rewind.round": "Undo last round",
  "rewind.round.hint":
    "Put this round's message back in the box; subagents drop only this round",

};
