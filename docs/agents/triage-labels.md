# Triage Labels

The skills speak in terms of five canonical triage roles. This file is the single source of truth for
what each one means here.

## ⭐ The state role answers ONE question: WHO ACTS NEXT

Ruled 2026-08-19. **Read every state role as the answer to "whose move is it?"** — not as a
description of the issue's quality, its difficulty, or how far along it is.

| State role | Whose move | Select it when |
| --- | --- | --- |
| `needs-triage` | **nobody yet** | The issue has **not been evaluated**. This is the only thing it means. |
| `needs-info` | the reporter | Evaluated, and the next act is someone supplying a fact the issue lacks. |
| `ready-for-agent` | an agent | Evaluated, and the next act is one an AFK agent can perform end to end. |
| `ready-for-human` | a human | Evaluated, and the next act needs a person — a scope call, a UI step, a judgement. |
| `wontfix` | nobody, ever | Evaluated and declined. |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the label string from
this table. Every string is identical to its canonical role — deliberate, not an unedited scaffold:
this tracker was created after the roles were adopted, so there was no vocabulary to map onto.

**Why this ruling was needed, and it is a documentation defect rather than a hard call.** Until
2026-08-19 the table glossed `needs-triage` as *"Maintainer needs to evaluate this issue"* and said
nothing about what the five roles have in common. So nine `deferred` issues expressed one state
**four different ways**, and `gh issue list --label needs-triage` returned issues that had been
evaluated six times over — the query stopped meaning anything. A flat list of five glosses is not a
vocabulary; the question they all answer is what makes it one.

⛔ **A label named `needs-triage` on an evaluated issue is the failure this ruling exists to stop.**
Evaluated-and-parked is `deferred` plus the role that will apply at revival — see below.

*Revisit if:* a state arises where the next act belongs to someone outside these five — an external
vendor, a scheduled job. That is a sixth role, not a re-reading of `needs-triage`.

## Category roles

`/triage` requires **exactly one category role and one state role** per issue, and offers two
categories:

| Canonical | Our tracker | Meaning |
| --- | --- | --- |
| `bug` | `bug` | Something is broken |
| `enhancement` | `enhancement` | New feature or improvement |

## `decision` — a local addition, and it is not a third category

**`decision` is supplementary. It never replaces `bug` or `enhancement`**, so the skill's
one-category invariant still holds on every issue. An issue labelled `decision` also carries
`enhancement`.

It exists for one reason. **The standing rule adopted 2026-08-18 — *no new decision ticket opens
until four rules ship, unless it blocks a rule* — was unenforceable, because nothing on the tracker
distinguished a decision ticket from a build ticket.** A rule stated over a set nobody can count is a
rule that cannot be checked. `gh issue list --label decision --state open` is now the check.

⭐ **THAT RULE WAS AMENDED ON 2026-08-18, AND THE AMENDMENT IS BELOW.** It limited the wrong
variable. See "The standing rule, as amended".

Apply it when the **deliverable is a decision** — an ADR, a spec, a declared negative — rather than
code or a document that records work already decided. The reliable signal is the issue's own title: a
question, or the words *decide* / *declare* / *whether*.

Seeded 2026-08-18 across `#8 #25 #27 #29 #69 #70 #78 #82`. Two open issues were left unlabelled as
genuinely ambiguous rather than guessed at: **#84** (mapping the owner's entropy invariants onto the
catalogue) and **#74** (counting broken references in the boot-up document). Both could produce a
decision or a report. ~~Neither claim is made.~~

⚠ **HALF OF THAT ABSTENTION LAPSED AND THE SENTENCE WENT ON ASSERTING IT.** **`#74` gained
`decision` and `deferred` on 2026-08-18**, so the claim *was* made for one of the two and this
paragraph said otherwise until a board audit on 2026-08-19 dereferenced it. **`#84` is still
unlabelled and that is still correct** — its body states *"Not a commitment to build any of them.
The deliverable is a mapping … Whether any gap becomes a rule is a separate scope decision"*, which
is the "document that records work already decided" this section excludes.

The durable part is not the correction. **A recorded abstention is a claim about the tracker, and
the tracker moves.** An abstention that names specific issue numbers rots the moment either one is
relabelled, and nothing dereferences it, because it reads as a settled note rather than as a live
assertion. Prefer stating the *test* that produced the abstention over listing the issues it applied
to; where issue numbers are unavoidable, treat the sentence as a claim due re-checking, not as
history.

## `deferred` — recorded, not scheduled

**`deferred` is supplementary, exactly as `decision` is.** It never replaces a state role, so
`/triage`'s one-category-and-one-state invariant holds unchanged. An issue labelled `deferred` still
carries `enhancement` or `bug`, and still carries one of the five state roles.

It means: **this question is recorded and is not being worked on.** It is the aviation
deferred-defect entry, not a silence.

⛔ **A `deferred` issue MUST name what would make it active** — the `Revisit if:` shape the ADRs
already use. A deferral with no trigger is a drop wearing a label, and it is the shape this
repository loses things in.

### How `deferred` combines with the state role

The two axes answer different questions and neither substitutes for the other:

- **`deferred` answers *when*** — not now, and here is the trigger.
- **The state role answers *who acts at revival*** — the move that becomes available the moment the
  trigger fires.

So a `deferred` issue carries the role that will apply **when it wakes up**, not `needs-triage`.
Deferring is an act of evaluation; an issue cannot be both evaluated-and-parked and un-evaluated.

**Applied 2026-08-19 to the four issues carrying `needs-triage` + `deferred`.** The ruling
discriminates rather than bulk-relabels, which is the evidence it is doing work: **#69** (needs an
ADR) → `ready-for-human`; **#74** (needs a human to connect the integration to real content) →
`ready-for-human`; **#78** (needs the API checked rather than reasoned about) → **`ready-for-agent`**;
**#97** (needs a decision rather than a patch) → `ready-for-human`.

Per the abstention lesson above, treat that sentence as a claim about the tracker that is due
re-checking, not as history. The durable part is the test, not the four numbers.

## The standing rule, as amended

**Original, adopted S025 (2026-08-18):** *no new decision ticket opens until four rules ship, unless
it blocks a rule.*

**Amended the same day, on the operator's instruction to scrutinise it:**

> **Record always. Schedule never.** Every decision question is FILED, with `decision`. At most
> **one** decision ticket may be active — that is, `decision` and not `deferred` — while any v0.1
> rule is unbuilt. *Unless it blocks a rule*, which is unchanged and now correctly gates
> **scheduling** rather than **recording**.

### ⭐ THE WIP LIMIT LAPSED ON 2026-08-19, BY ITS OWN TERMS

The clause reads **"while any v0.1 rule is unbuilt."** `UNQ001` shipped in PR #108 on 2026-08-19,
completing the catalog: `SYS001`, `REF001`, `REQ001`, `UNQ001` all exist in `slice/`. **The condition
the limit was written against is no longer true, so the limit is no longer in force.**

This is recorded because a lapsed constraint is more dangerous than an active one. It went unnoticed
for the whole session in which the triggering rule shipped, and the failure mode is a later session
reading the sentence, applying it, and refusing to schedule a decision on the authority of a
condition that expired.

**What is still in force, and it is the important half:** *record always.* Every decision question is
filed, with `decision`. That was never conditional on the build state and does not lapse.

⚠ **Do not read the lapse as "the queue is now open."** The limit existed because the queue was
growing faster than the build. The build has caught up **on the v0.1 catalog only**; the first
real-workspace run then established a new ceiling — half a live hub unreadable
(`docs/proof/results-first-real-workspace.md` §6). **A decision ticket scheduled now should still
name why it does not wait behind #51.** The right successor test is that question, not a count.

*Revisit if:* a v0.2 catalog is declared with unbuilt rules in it. The clause's condition would
become true again on its own wording, and this note should be struck rather than deleted — the
record of it having lapsed once is what stops the next session applying it blind.

**Why the original was wrong, stated so a later session does not restore it by instinct.** Its
purpose was that *the queue was growing faster than the build* — a SCHEDULING problem. It solved that
by suppressing RECORDING. Three consequences, and the third is fatal:

1. **The questions did not go away; the record did.** A decision refused a ticket still exists, as
   prose in a state file. This repository has lost or rotted a prose-only claim six times and built
   `CHECK-claims.ts` because of it. The rule pushed decisions into the one medium the project has
   proven it cannot trust.
2. **It gated on urgency where the harm is loss.** *Blocks a rule* is the right test for what to work
   on now. It is the wrong test for what to write down, because writing down costs nothing and not
   writing down is the loss.
3. ⭐ **It made accurate labelling expensive, which corrupts the label the rule depends on.** Under
   the original rule the way to file a decision was to call it a bug. A rule that pays its users to
   mislabel destroys its own instrument, and `gh issue list --label decision` WAS the instrument.

**Prior art, and it is unanimous across three domains** — the rule was written from inside the
problem, and the problem is old. **Kanban and theory of constraints** put WIP limits on work in
progress and never on the backlog: an invisible backlog is unmeasured, not limited. **Aviation's
Minimum Equipment List** permits deferring a defect only by logging it with a category and a
deadline. **Ordinary defect triage** answers backlog pressure with severity plus an explicit deferred
resolution, never with a refusal to file.

**The checks.**

- Active decisions: `gh issue list --label decision --state open --json number,labels --jq '[.[] | select([.labels[].name] | index("deferred") | not)] | length'` — must be ≤ 1 while a v0.1 rule is unbuilt.
- Deferrals without a trigger: read each `deferred` issue for a `Revisit if:`. Not mechanised, and
  that is a known weakness rather than a claim.

*Revisit if:* the active-decision count sits at its limit while a decision that genuinely blocks a
rule is waiting — the exception should be firing and would not be.

*Revisit if:* `/triage` rejects an unrecognised label rather than ignoring one it was not told about.
The skill reads its role mapping from this file and defines the category set itself, so a
supplementary label should pass through untouched — that is the reasoning behind making `decision`
supplementary rather than a third category, and it has not been observed under a real `/triage` run.
