<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="banner-dark.svg">
    <img src="banner.svg" alt="dsh-ungate" width="640">
  </picture>
</p>

<h1 align="center">dsh-ungate</h1>

<p align="center"><strong>A host-patch distribution for DeepSeek Harness</strong>: 27 patches cover approvals, sandbox, plan mode and the prompt layer; runtime injection and the <code>unrestricted</code> preset cover the persona configuration; <code>selfcheck</code> and the probe prove every step.</p>

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

## Provenance

- Upstream: [YuJunZhiXue/dsh-purge](https://github.com/YuJunZhiXue/dsh-purge) (YuJunZhiXue, MIT).
- The code comes from the minimal cut of [kingcharleslzy-ai/dsh-purge](https://github.com/kingcharleslzy-ai/dsh-purge); [youki258/dsh-ungate](https://github.com/youki258/dsh-ungate) subtracts and rewrites on top: no tool surface, no legacy debug entry points, no in-plugin self-update, 27 patches, one source of truth for docs. Not an official release by the upstream author.

## What it changes

| Layer | Content | Takes effect |
| --- | --- | --- |
| Host patches | 27 definitions; 21 apply on the web surface, 6 are desktop-shell only | press Apply → **fully quit DSH and reopen** |
| Runtime prompt | injection text re-attached every step (`$DSH_HOME/prompt-inject.md`) | immediately |
| Boost section | trailing section, on by default | immediately |
| Permission config | `danger-full-access` + `approval: ask` | after reload |
| agent preset | `unrestricted`, a superset of standard that only changes persona | pick it in new sessions |

It does not touch prompt text, rule sets or other plugin configs, and it does not judge who owns a target. Disk writes are not proof of load: conclusions come from a post-restart `selfcheck` and a probe.

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

## Updating

Upgrades go through the host; the plugin never self-updates.

- **Market installs**: upgrade via the DSH plugin market or `dsh plugin --profile <n> update`, then press Apply once and restart.
- **Tarball installs**: re-run `plugin add` with the new tgz — re-adding is the upgrade (`not-updatable` by design); configs and prompt text are untouched.
- **After a host upgrade**: the asar reseals and all patches are gone — press Apply once, quit and reopen.

## Docs

[AGENTS.md](../AGENTS.md) · [INSTALLATION](../docs/INSTALLATION.md) · [STATE](../docs/STATE.md) · [VERIFY](../docs/VERIFY.md) · [RUNBOOK](../docs/RUNBOOK.md).

MIT — see [LICENSE](../LICENSE); provenance and contributor attribution: [NOTICE.md](../NOTICE.md), [CONTRIBUTORS.md](../CONTRIBUTORS.md).
