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

Apply it when the **deliverable is a decision** — an ADR, a spec, a declared negative — rather than
code or a document that records work already decided. The reliable signal is the issue's own title: a
question, or the words *decide* / *declare* / *whether*.

Seeded 2026-08-18 across `#8 #25 #27 #29 #69 #70 #78 #82`. Two open issues were left unlabelled as
genuinely ambiguous rather than guessed at: **#84** (mapping the owner's entropy invariants onto the
catalogue) and **#74** (counting broken references in the boot-up document). Both could produce a
decision or a report. Neither claim is made.

*Revisit if:* `/triage` rejects an unrecognised label rather than ignoring one it was not told about.
The skill reads its role mapping from this file and defines the category set itself, so a
supplementary label should pass through untouched — that is the reasoning behind making `decision`
supplementary rather than a third category, and it has not been observed under a real `/triage` run.
