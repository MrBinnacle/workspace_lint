# Tooling: what is installed, and when to fire it

Read this before building an instrument, and before asserting a fact about a library, an SDK or a
vendor API. Two failures this repository has actually paid for are both failures of *tool awareness*,
not of reasoning:

- A session hand-mutated single lines and scored them by hand, for a whole sprint, while a mutation
  testing plugin targeting **TypeScript** sat installed and unopened.
- Facts about the Notion SDK were about to be answered from memory when the SDK's published type
  reference was one tool call away.

Neither was a hard problem. Both were *not knowing what was in the room.*

## ⛔ The inventory is RE-DERIVED, never re-quoted

A hand-kept list of installed plugins is a mirror, and this repository has been burned by a mirror
six times (G-010: keep a pointer, never a mirror). Plugins update, versions multiply, and a list
written today is wrong by the third `/plugin` install — while still reading as authoritative.

**Run this. Do not trust a list, including any list further down this page.**

```sh
# Every installed plugin, at the depth the skills actually live (they are NESTED
# under a version directory — a shallow find reports nothing and that is not an absence)
cd ~/.claude/plugins/cache && find . -maxdepth 4 -type d -name skills \
  | sed 's|^\./||' | while read d; do
      echo "$(echo $d | cut -d/ -f1-3): $(ls $d | tr '\n' ' ')"
    done | sort
```

```sh
# User-level skills, and the quarantine staging area
ls ~/.claude/skills/ ~/.claude/skills/_quarantine/
```

```sh
# Project-local skills (these fit this repo specifically and win on tie)
ls .claude/skills/
```

⚠ **A skill's presence is not its reachability.** A skill carrying `disable-model-invocation: true`
is refused by the Skill tool and never enters the session listing — it can only be fired by the
operator typing `/name`. Check before concluding a skill is missing:

```sh
grep -c 'disable-model-invocation: true' <path>/SKILL.md
```

## When to fire Context7 — this is not optional and it is not a fallback

**Fire it BEFORE writing the claim, not after being challenged.** The trigger is the *topic*, not
your confidence:

| Fire Context7 when… | Example from this project |
|---|---|
| naming any method, type or field of a third-party SDK | does `dataSources.query` exist, and what does it return? |
| stating what an endpoint requires or returns | does a database response carry `last_edited_time`? |
| deciding whether a capability exists at all | can a read-only integration query rows? |
| writing a cause string that blames a vendor boundary | is the missing thing the call, or the grant? |

⛔ **A negative claim about a vendor needs that vendor's own page.** "We looked and found no way" is
negation as failure, and `slice/negation.ts` fails the gate on an untyped vendor-negative sentence.
Context7 is a *library* source; for a vendor API fact the ladder is `docs/vendor/` first (fetched,
dated, in-repo), then the endpoint's own reference page. See `docs/agents/domain.md` → "The source
ladder".

⚠ **`docs/vendor/` is a cassette.** A stored quote passes forever unless re-fetched and diffed.
Check the fetch date before leaning on one.

## What we carry that this project should actually be using

The names and versions above are authoritative. This table is the *judgement* half — what each is
for **here** — and it is worth revisiting, not re-deriving.

| Plugin / skill | Why it is relevant to a Notion linter |
|---|---|
| `trailofbits/property-based-testing` | This product's entire subject is **invariants**. A rule that tests one invariant is the textbook PBT target, and the four v0.1 rules have only example-based fixtures. |
| `trailofbits/mutation-testing` (`mewt`) | Targets TypeScript. This repo hand-mutates one line at a time; a campaign runner also filters invalid mutants, which is a failure mode we hit manually. `mewt` v4.0.0 exists (verified 2026-08-22) and is **not installed** — `mewt` is not on PATH. |
| `trailofbits/supply-chain-risk-auditor` | `#8` is an npm-name dispute and `slice/` takes a vendor SDK dependency. Adding a dependency is ASK FIRST here; auditing the ones we have is not. |
| `trailofbits/agentic-actions-auditor` | Relevant if CI mode ships — CI integration is a settled post-local-core decision. |
| `claude-plugins-official/superpowers` | Carries `verification-before-completion`, `systematic-debugging`, `using-git-worktrees`, `subagent-driven-development`, and both code-review halves. Directly overlaps disciplines this repo enforces by hand. |
| `mattpocock-skills` | The flow this project already runs: `/implement` per ticket, `/clear` between. **20 of 35 were operator-only** until 2026-08-22; a plugin update restores that flag. |
| `context7` | See the trigger table above. |

⚠ **`role-council` silently no-ops here** — it needs `.claude/role-council/config.md`, which this repo
does not have, and treats the absence as opt-out with no signal.

## The rule this page exists to make mechanical

> **Before building an instrument — a script, a miner, a harness, a metric, a lint, a mutation run —
> check whether one is already installed.** The operating rules call this the Bannister check's hard
> trigger, and it fires *before* the build, not after.

The check is the command at the top of this page. It costs one call.

## ⛔ Where this discipline is enforced — and where it may NOT live

This page is loaded because `CLAUDE.md` points at it. That makes it always-loaded context rather than
a skill that must be retrieved: weaker than a hook, stronger than a habit.

**A `UserPromptSubmit` hook for this was built in `.claude/` and then removed, and the reason is the
one thing this page most needs to say.**

⛔ **AGENT CONFIGURATION IS NOT PART OF THE PRODUCT, AND IT DOES NOT GO IN THIS TREE.** The product is
`slice/`. A hook that changes how the agent behaves is not a component of a Notion linter, and
committing one here collapses *the product* with *the tooling that builds the product* — the same
class of collapse `CONTEXT.md` enforces eight distinctions to prevent.

⚠ **The sharper reason: `.claude/hooks/` and `.claude/settings.json` are NOT in the
`guard-canonical-doc-edit.py` guarded set.** That guard covers `CLAUDE.md`, `CONTEXT.md`,
`PRODUCT.md`, `docs/adr/**` and `docs/spec/**`, and it exists so the agent cannot rewrite its own
always-loaded instructions without an approved plan. A hook committed to `.claude/` is an
instruction channel that fires on every prompt and passes through **no plan gate and no claim
check** — written in the same session that correctly ran the plan gate for a five-line pointer in
`CLAUDE.md`. The absence is claim-gated in `CLAUDE.md` now, so a reappearance turns the gate red.

**The correct home for an agent-behaviour nudge is the user or plugin layer** — portable across every
project, which is also where the failure it addresses actually occurs. `~/.claude/hooks/` is
write-denied to the agent and `~/.claude/settings.json` is gitignored, so **an operator must wire it**;
an agent cannot, and that restriction is a feature rather than an obstacle to route around.
