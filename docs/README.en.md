# dsh-purge-minimal

Current version 0.1.2. Verified on DSH Desktop 0.2.1-rc.1, 0.2.1-rc.2, 0.2.1-rc.3 and 0.2.1-rc.5 (web and desktop surfaces share the same patch table).

`dsh-purge-minimal` removes what blocks an agent inside DSH: approval prompts, sandbox fences, write-intent interception, plan-mode hard stops, tool-result trimming, and the model's own refusal reflex. Install the plugin, press **Apply**, fully quit and reopen DSH, then confirm with `selfcheck`.

- Patches are written into the host's **unpacked source copy**; every write is backed up first.
- User content — prompt injection text, rules, other plugin config — is never overwritten by Apply or Revert.
- No network scope gate, no content gate: the operator declares the target.

## Five layers

| Layer | Provided by | Takes effect | Inspect with |
| --- | --- | --- | --- |
| Host patches (27 definitions) | this plugin writes host source | Apply → **full restart** | `purge selfcheck` |
| Runtime prompt injection | plugin runtime | immediately | panel → Status, `purge probe new` |
| Boost section | plugin runtime (tail) | immediately | `purge boost` |
| Permission config | profile `cordis.patch.yml` | on reload | selfcheck permission layer |
| Agent preset `unrestricted` | `presets/unrestricted` | picked per session | preset dropdown |

On a web profile the self-check reports 21 patches applied and 6 not applicable (the desktop re-seal / window-close group). See [STATE.md](STATE.md).

## Install

```sh
dsh plugin --profile web add https://github.com/youki258/dsh-purge-minimal/releases/download/v0.1.2/dsh-purge-minimal-0.1.2.tgz
```

Desktop users replace `web` with `desktop` (use your real profile name). Bootstrap installers for Linux/macOS (`scripts/install.sh`) and Windows (`scripts/install.ps1`) download the release, verify SHA256, call the official CLI and migrate old package references. None of them apply patches or restart DSH automatically.

After install: press **Apply** in the panel → quit DSH completely → reopen → `purge selfcheck --json` and check `layers[].state`.

## Panel and CLI

The Purge sidebar has Status, Prompt, Rules, Skills and More (diagnostics, preset install, backups, recent actions, release history). The panel does **not** check for updates online: upgrades go through the plugin market, the panel only takes local snapshots and rolls back.

`purge` is the CLI entry (`bin/community.js`). Commands: `status`, `selfcheck`, `apply`, `revert`, `host-status`, `diagnose`, `reanchor`, `probe`, `audit`, `boost`, `preset`, `backup`, `rollback`, `usage`, `prune`, `patches`, `uninstall`.

## Proof that injection reached the model

```sh
purge probe new
```

Send any message afterwards; the model echoing the nonce verbatim means the runtime section reached it. Echoed but still refusing → persona/boost problem, not a patch problem. No echo → injection did not arrive.

## Compatibility

Verified: 0.2.1-rc.1, 0.2.1-rc.2, 0.2.1-rc.3, 0.2.1-rc.5. Unknown: 0.2.1-rc.4, 0.2.2-alpha.2 — no measurement, selfcheck labels them unverified. Host upgrades re-seal the archive and invalidate every patch: press Apply again and restart. Anchor drift is diagnosed with `purge diagnose` and repaired with `purge reanchor`.

## Tests

```sh
pnpm test          # 532 tests
pnpm run smoke     # pack, unpack, dependency-free bootstrap, imports, preset parse
pnpm run check:docs
pnpm run test:ui
pnpm run build:client
```

## Provenance

1. Original project [YuJunZhiXue/dsh-purge](https://github.com/YuJunZhiXue/dsh-purge) (MIT, author 小杨 / YuJunZhiXue).
2. Community branch [kingcharleslzy-ai/dsh-purge](https://github.com/kingcharleslzy-ai/dsh-purge) — this repository's code comes from its minimal cut: host patches, self-check, installers and panel.
3. This repository [youki258/dsh-purge-minimal](https://github.com/youki258/dsh-purge-minimal) only subtracts and consolidates: no penetration tooling, no rehearsal console, no online self-update, 27 patch definitions.

Upstream README, release notes and maintenance docs are archived verbatim under [upstream](upstream). Third-party notices: [NOTICE.md](../NOTICE.md). Not affiliated with, nor endorsed by, the upstream author.
