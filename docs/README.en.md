<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="banner-dark.svg">
    <img src="banner.svg" alt="dsh-ungate" width="640">
  </picture>
</p>

<h1 align="center">dsh-ungate</h1>

<p align="center"><strong>Removes DeepSeek Harness's approval prompts, sandbox denials and the "run it yourself" hedging — and puts your own prompt text into the system prompt on every turn.</strong> 27 host patches + runtime injection + the <code>unrestricted</code> preset; <code>selfcheck</code> and the probe make every step checkable.</p>

<p align="center">
  <a href="https://github.com/youki258/dsh-ungate/releases"><img src="https://img.shields.io/github/v/release/youki258/dsh-ungate?label=release" alt="Release"></a>
  <a href="https://github.com/youki258/dsh-ungate/stargazers"><img src="https://img.shields.io/github/stars/youki258/dsh-ungate?logo=github&label=Stars" alt="Stars"></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat" alt="MIT"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=fff" alt="Node.js"></a>
  <img src="https://img.shields.io/badge/DSH-0.2.1--rc.x%20%2F%200.2.2--rc.1--web-blue" alt="DSH compatible">
</p>

<p align="center">
  <a href="../README.zh-CN.md">中文</a> | <a href="README.en.md">English</a>
</p>

## What it changes

Install, press Apply once, fully quit and reopen DSH — then these behaviours change:

| Today | After |
| --- | --- |
| Every tool call pops an approval prompt you must click through | Approved automatically; execution is no longer interrupted |
| The sandbox refuses to write files or run commands | Runs under the profile's permission config (default `danger-full-access`) |
| The model answers "run it yourself" or "I need you to confirm first" | Executes directly and returns the result |
| The official identity sentence and caution paragraphs in the system prompt | Replaced by your `$DSH_HOME/prompt-inject.md` body |
| Your own rules never reach the system prompt | The injection body is re-attached every step and is not crowded out during assembly |
| New sessions use the standard persona | Switch to the `unrestricted` preset: execution first, less preamble, no multi-turn drift |

Of the 27, 9 are behavioural (prompt-wording neutralisation for tools, sandbox and identity), 12 keep the injection alive through assembly, and 6 only cover desktop-shell repack/close. No filler entries; the per-patch table is in [STATE](STATE.md).

Changes land only on the host source copy (backed up before every apply; `purge revert` undoes them). Your prompt text, rule sets and other plugin configs are untouched. No content review and no public-target gate — scope is declared by the operator.

## Layers

| Layer | Content | Takes effect |
| --- | --- | --- |
| Host patches | 27 definitions; 21 apply on the web surface, 6 are desktop-shell only | press Apply → **fully quit DSH and reopen** |
| Runtime prompt | injection text re-attached every step (`$DSH_HOME/prompt-inject.md`) | immediately |
| Boost section | trailing section, on by default | immediately |
| Permission config | `danger-full-access` + `approval: ask` | after reload |
| agent preset | `unrestricted`, a superset of standard that only changes persona | pick it in new sessions |

A successful disk write is not proof of load: host modules are imported once at startup, so conclusions always come from a post-restart `selfcheck` and a probe.

## Install

Pick any one entry point; the activation steps afterwards are identical (apply → fully quit and reopen → verify).

**Option 1: official CLI + pinned-version tgz (recommended)**

```sh
dsh plugin --profile web add https://github.com/youki258/dsh-ungate/releases/download/v0.2.3/dsh-ungate-0.2.3.tgz
```

**Option 2: npm package**

```sh
dsh plugin --profile web add dsh-ungate@0.2.3
```

**Option 3: community bootstrap installer** (backup migration; review with `--dry-run` first)

```sh
sh scripts/install.sh --dry-run    # Linux/macOS
pwsh scripts/install.ps1 -DryRun   # Windows
```

**Activate (same for all options)**

```sh
node bin/community.js apply     # same as pressing Apply in the panel; writes a host source copy and keeps backups
# Fully quit DSH (tray exit / ⌘Q, not just closing the window), reopen, then verify:
node bin/community.js selfcheck --json   # state=ok, broken empty
node bin/community.js probe new          # send any message; the model should echo the nonce verbatim
```

- Desktop users: replace `--profile web` with the actual profile name (the desktop shell defaults to `desktop`).
- **Upgrading**: this package is `not-updatable` in the plugin manager; just `plugin add` the new version again — configs and prompt text are untouched. After every host upgrade the `asar` reseals: press Apply once, then quit and reopen.
- **Uninstall**: `node bin/community.js uninstall` (cleans only this home's plugin directory and links; never touches prompt text, rule sets or other plugin configs).
- Details and failure triage: [INSTALLATION](INSTALLATION.md); desktop-shell acceptance: [DESKTOP-TEST](DESKTOP-TEST.md).

## Compatibility matrix

| Host | Surface | Result | Evidence |
| --- | --- | --- | --- |
| DSH Desktop 0.2.1-rc.1, rc.2, rc.3, rc.5 | desktop + web | Verified | anchors hit, apply, selfcheck green |
| DSH Desktop 0.2.2-rc.1 | web / npm CLI | Verified (apply 20 + selfcheck 19/19 applicable layers) | isolated instance, see [VERIFY](VERIFY.md) |
| DSH Desktop 0.2.2-rc.1 | desktop shell | Untested: the 6 desktop-only patches are n/a here | — |
| DSH Desktop 0.2.1-rc.4, 0.2.2-alpha.2 | any | Untested; selfcheck reports it | — |

`engines.dsh` in `package.json` is enforced by the host on install and boot; it blocks 0.3.x and 0.2.1-rc.0. To force an unverified version, use `dsh plugin --profile <n> allow-version <pkg@ver> --accept-risk` (the exemption does not survive upgrades).

## Panel and CLI

Left sidebar **Purge**: status (version / host / patch counters / per-layer evidence, expandable), prompt text, and More (server roster, diagnostics and re-anchoring, preset install). Backups and rollback are CLI-only: `purge backup` / `purge rollback <id>`.

`purge` is an alias of `bin/community.js`:

| Command | Purpose |
| --- | --- |
| `purge status` / `selfcheck [--json]` | host and patch overview / 20 per-layer evidence rows (`broken` → exit 1) |
| `purge apply` / `revert` | write patches / undo them (both back up first, both idempotent) |
| `purge diagnose` / `reanchor …` | anchor-drift diagnosis / semi-automatic re-anchoring |
| `purge probe [new]` | runtime injection probe (30-minute TTL) |
| `purge backup` / `rollback <id>` / `usage` / `prune` | snapshot / rollback / footprint / cleanup |

Full table: [AGENTS.md §3](../AGENTS.md).

## Updating

Upgrades go through the host; the plugin never self-updates.

- **Market installs**: upgrade via the DSH plugin market or `dsh plugin --profile <n> update`, then press Apply once and restart.
- **Tarball installs**: re-run `plugin add` with the new tgz — re-adding is the upgrade (`not-updatable` by design); configs and prompt text are untouched.
- **After a host upgrade**: the asar reseals and all patches are gone — press Apply once, quit and reopen.

## Proof it took effect

```sh
purge probe new
# → {"nonce":"purge-1a2b3c4d","message":"Echo the following line verbatim…[purge-1a2b3c4d]"}
```

The model echoing the nonce verbatim means the injection chain works; echoing it but still deflecting means a persona/boost problem; no echo means the injection never arrived (check the injection layer, `boost`, `injectPosition`).

## Development and tests

```sh
pnpm install --frozen-lockfile --allow-build=esbuild   # the panel build needs esbuild's binary
pnpm test              # 449 tests: patch anchors, selfcheck, installer, HTTP, panel contracts, regressions
pnpm run smoke         # after packing: dependency-free start, module imports, preset parse, status
pnpm run check:docs    # version / compatibility claims / stale references consistency
pnpm run test:ui       # panel client bundle contract
pnpm run build:client  # rebuild the bundle after editing panel sources
```

Tests run in a clean environment: `scripts/bootstrap-install.mjs` inherits `DSH_PROFILE` only when no explicit home is given. Real-machine acceptance (Electron, repack) runs on an isolated instance.

CI lives in `.github/workflows/ci.yml` (Node 22/24 matrix: `check:docs` → panel bundle check → panel contract → 449 tests → pack and assert the tarball excludes `docs/upstream/`); `release.yml` repeats the same checks on `v*.*.*` tags, packs and creates the release.

## Docs

[AGENTS.md](../AGENTS.md) · [INSTALLATION](INSTALLATION.md) · [STATE](STATE.md) · [VERIFY](VERIFY.md) · [RUNBOOK](RUNBOOK.md).

## Provenance and license

MIT — see [LICENSE](../LICENSE).

- Upstream: [YuJunZhiXue/dsh-purge](https://github.com/YuJunZhiXue/dsh-purge) (YuJunZhiXue).
- The code comes from the minimal cut of [kingcharleslzy-ai/dsh-purge](https://github.com/kingcharleslzy-ai/dsh-purge); [youki258/dsh-ungate](https://github.com/youki258/dsh-ungate) subtracts and rewrites on top: no tool surface, no legacy debug entry points, no in-plugin self-update, 27 patches, one source of truth for docs. Not an official release by the upstream author.
- Full attribution: [NOTICE.md](../NOTICE.md) and [CONTRIBUTORS.md](../CONTRIBUTORS.md).
