# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Every string is identical to its canonical role. That is deliberate, not an unedited scaffold: this
tracker was created after the roles were adopted, so there was no existing vocabulary to map onto.

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
decision or a report. Neither claim is made.

## `deferred` — recorded, not scheduled

**`deferred` is supplementary, exactly as `decision` is.** It never replaces a state role, so
`/triage`'s one-category-and-one-state invariant holds unchanged. An issue labelled `deferred` still
carries `enhancement` or `bug`, and still carries one of the five state roles.

It means: **this question is recorded and is not being worked on.** It is the aviation
deferred-defect entry, not a silence.

⛔ **A `deferred` issue MUST name what would make it active** — the `Revisit if:` shape the ADRs
already use. A deferral with no trigger is a drop wearing a label, and it is the shape this
repository loses things in.

## The standing rule, as amended

**Original, adopted S025 (2026-08-18):** *no new decision ticket opens until four rules ship, unless
it blocks a rule.*

**Amended the same day, on the operator's instruction to scrutinise it:**

> **Record always. Schedule never.** Every decision question is FILED, with `decision`. At most
> **one** decision ticket may be active — that is, `decision` and not `deferred` — while any v0.1
> rule is unbuilt. *Unless it blocks a rule*, which is unchanged and now correctly gates
> **scheduling** rather than **recording**.

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
