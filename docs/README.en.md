# dsh-purge-minimal

**Current version 0.1.3** — a subtractive DSH distribution: it removes approval prompts, sandbox fences, write-intent interception and the model's own refusal habits, and keeps only what can prove itself.

> **Provenance**
> - Original upstream: [YuJunZhiXue/dsh-purge](https://github.com/YuJunZhiXue/dsh-purge) (author YuJunZhiXue, MIT).
> - The code in this repository comes from the minimal cut of the community branch [kingcharleslzy-ai/dsh-purge](https://github.com/kingcharleslzy-ai/dsh-purge); host patches, selfcheck, installers and the panel originate there.
> - [youki258/dsh-purge-minimal](https://github.com/youki258/dsh-purge-minimal) only subtracts and rewrites: no tool surface, no legacy debug entry points, no in-plugin self-update, 27 patches, one source of truth for docs. It is **not** an official release by the upstream author.

## What it changes

| Layer | Content | Takes effect |
| --- | --- | --- |
| Host patches | 27 definitions; 21 apply on the web surface, 6 are desktop-shell only | press Apply → **fully quit DSH and reopen** |
| Runtime prompt | injection text re-attached every step (`$DSH_HOME/prompt-inject.md`) | immediately |
| Boost section | trailing section, on by default | immediately |
| Permission config | `danger-full-access` + `approval: ask` | after reload |
| agent preset | `unrestricted`, a superset of standard that only changes persona | pick it in new sessions |

It does **not** touch your prompt text, rule sets or other plugin configs, and it does not judge who owns a target. Disk writes are not proof of load: every "in effect" claim below is backed by a post-restart `selfcheck` and a probe.

## Quick start

```sh
dsh plugin --profile web add https://github.com/youki258/dsh-purge-minimal/releases/download/v0.1.3/dsh-purge-minimal-0.1.3.tgz
node bin/community.js apply
# fully quit DSH, reopen, then:
node bin/community.js selfcheck --json
node bin/community.js probe new
```

## Compatibility matrix

| Host | Surface | Result | Evidence |
| --- | --- | --- | --- |
| DSH Desktop 0.2.1-rc.1, rc.2, rc.3, rc.5 | desktop + web | Verified | anchors hit, apply, selfcheck green |
| DSH Desktop 0.2.2-rc.1 | web / npm CLI | Verified (apply 20 + selfcheck 19/19 applicable layers) | isolated instance, see [VERIFY](VERIFY.md) |
| DSH Desktop 0.2.2-rc.1 | desktop shell | Untested: the 6 desktop-only patches are n/a here | — |
| DSH Desktop 0.2.1-rc.4, 0.2.2-alpha.2 | any | Untested; selfcheck reports it | — |

`engines.dsh` in `package.json` is enforced by the host on install and boot.

## Updating

Upgrading is the host's job, not the plugin's: the panel does not check for versions and does not swap packages. Market-installed copies upgrade through the DSH plugin market or `dsh plugin --profile <n> update`; tarball installs are replaced by the next tarball (they are `not-updatable` in the plugin manager by design). After any host upgrade, press Apply once and restart.

## Docs

[AGENTS.md](../AGENTS.md) · [INSTALLATION](../docs/INSTALLATION.md) · [STATE](../docs/STATE.md) · [VERIFY](../docs/VERIFY.md) · [RUNBOOK](../docs/RUNBOOK.md).

MIT — see [LICENSE](../LICENSE), [NOTICE.md](../NOTICE.md), [CONTRIBUTORS.md](../CONTRIBUTORS.md).
