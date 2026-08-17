# Domain Docs

How the engineering skills should consume this repo's domain documentation.

This file was a generic template until 2026-08-17. Its reading list named the decision layer and
omitted the evidence layer, which is the mechanism behind four separate incidents — see
"Why this file is specific" at the bottom. It is now specific to this repo. Keep it that way.

## Before exploring, read these

Read in this order. The order is the point: **evidence outranks assertion**, and an ADR is an
assertion.

1. **`CONTEXT.md`** at the repo root — the glossary and the settled defaults. Canonical.
2. **`PRODUCT.md`** at the repo root — the user, the job, the gates, the kill criteria. Canonical.
3. **`docs/adr/`** — read the ADRs touching the area you are about to work in. Accepted decisions,
   **never edited in place**; a superseding ADR is the only instrument.
4. **`docs/spec/`** — behavioural specs. Two kinds: **per-rule** (`REF001-link-recognition.md`) and
   **per-slice** (`v0.1-scan-slice.md`, the executable cut of decisions already made). Read the spec
   for any rule or slice you are about to implement or change. Edited in place.
5. **`docs/research/`** — the evidence the ADRs were built from. **Read before asserting any factual
   claim, not after.** **Start at `docs/research/INDEX.md`**, which gives one line per file: the
   question it answers and what it refutes. Twelve files; the index is what makes "read the research"
   an action rather than a directory listing.
6. **`docs/proof/`** — what the API actually did when asked. Outranks everything above it on any
   question of fact.
7. **`docs/inputs/`** — external artifacts, **none canonical**. Read them; never cite one as
   authority. Read `docs/inputs/decay-causal-synthesis-2026-08-16.md` **before** making any claim
   about demand, the buyer, the segment, or Gate 1. It is the owner's own market research, derived
   from Reddit discussion no agent in this project can reach, and it carries the objection the
   product must answer.

**Not canonical is not the same as not read, and conflating the two is a live defect in this repo.**
The decay synthesis has now been skipped three times: the Shape C incident below, a second session
that reasoned about the buyer without opening it, and 2026-08-17, when a session built an entire
issue-#40 plan and a literature sweep without opening `docs/inputs/` once. The mechanism each time
was this reading list, which named the directory only in a paragraph telling the reader it had no
authority. That paragraph is now step 7 instead.

The files carry differing evidentiary weight and say so in their own headers. Where a
`docs/inputs/` file and a `docs/research/` sweep disagree on a **fact**, the sweep wins. On a
**mechanism**, the input may be the better account — the decay synthesis explains the sweeps'
negative results more completely than the sweeps did.

If a file does not exist, proceed silently. Don't flag its absence or propose creating it upfront.

## Evidence class is encoded in the directory

This is the repo's most useful convention and it was undeclared until now.

| Directory | Class | Authority on a question of fact |
| --- | --- | --- |
| `docs/proof/` | **observed** — a real response from the real API | Highest. Beats documentation. |
| `docs/research/` | **documented** — what a primary source states | Beats an ADR's assertion. |
| `docs/adr/` | **decided** — what this project concluded | Binding on behaviour, not on fact. |
| `docs/spec/` | **decided** — how one rule, or one slice, must behave | Binding on behaviour, not on fact. |
| `docs/inputs/` | **external** — seeded this project, not governed by it | None. |

`docs/spec/` holds behavioural specifications. It sits at the same evidence class as `docs/adr/` and
differs in scope, not in authority: an ADR decides something cross-cutting, a spec decides how one
rule behaves or how one shippable slice composes decisions already made. **A spec is not an ADR and
never supersedes one** — where a spec and an ADR disagree, the ADR wins and the spec is the defect.
Unlike an ADR, a spec **is** edited in place; it describes current intended behaviour rather than a
dated decision.

A **slice spec** decides nothing new. If writing one surfaces a decision that does not yet exist,
that is an ADR, and the slice spec waits for it. `v0.1-scan-slice.md` names the ADR decision behind
every one of its acceptance criteria for exactly this reason — the mapping is what makes the "decides
nothing new" claim checkable rather than asserted.

The project already separates *documented* from *observed* in prose — ADR-0007 decision 1 labels its
own table "documented, not observed". The directories carry the same split. Use it.

## Three rules that exist because they were each learned the expensive way

**1. Grep `docs/research/` before asserting a factual table in an ADR.**
ADR-0007 decision 4 rule 3. Two ADRs asserted facts the research had already recorded correctly, and
in one case the grep would have returned two files either of which refutes the claim. One command.

**2. A negative about an endpoint requires that endpoint's own reference page.**
ADR-0007 decision 4 rules 1 and 2. A shared envelope or overview page is not evidence about an
endpoint it does not name. **Absence of a field from a documentation page is not absence of the
field** — it is *not checked* until the endpoint's own page is opened, and *not observed* until a
response shows it.

**3. A claim about a model requires that model's own reference.**
Added 2026-08-17, generalising rule 2. ADR-0009 asserted a fact about Notion's capability model
without opening the capabilities reference. **Rule 1 would not have caught it** — the fact was not in
this repository at all, so grep returns nothing and nothing feels wrong. Rule 1 catches
contradictions; this rule catches absences, and they fail differently.

## Citations are receipts

Operator ruling, 2026-08-17. Every factual claim carries a locator a third party can follow: a URL
with its fetch date, a file with its section, a commit SHA, a clause number. *"Paraphrase without
pointer, 'as we discussed,' 'Notion's docs say,' 'the ADR covers this' — is commentary, not
evidence."*

Cite by **section heading**, not by line number. A line number written as `§596` sends a reader
looking for a section that does not exist; that exact defect shipped into an accepted ADR on
2026-08-17 and had been quoted forward three times before anyone followed it.

**Citation hazard:** ISO 19011:2018 and ISA 705 were read from unauthorised copies. Cite by clause or
paragraph; **publish no URL for either.** Full list in `.claude/state/store.json` → `citation_hazards`.

## File structure

```
/
├── CONTEXT.md              ← glossary + settled defaults (canonical)
├── PRODUCT.md              ← user, job, gates, kill criteria (canonical)
└── docs/
    ├── adr/                ← accepted decisions, never edited
    ├── spec/               ← behavioural specs, per-rule and per-slice, edited in place
    ├── research/           ← documented evidence (12 files; start at INDEX.md)
    ├── proof/              ← observed evidence, outranks documentation
    ├── inputs/             ← external artifacts, none canonical
    ├── demand-test/        ← outbound instruments
    └── agents/             ← this file and its siblings
```

There is no `src/` yet. The repo is pre-build.

## Use the glossary's vocabulary

When your output names a domain concept — an issue title, a rule name, a test name, a proposal — use
the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary avoids.

If the concept isn't in the glossary, that's a signal: either you're inventing language the project
doesn't use (reconsider), or there's a real gap. `Operator` was used 35 times before anyone noticed it
had no definition, including inside other glossary entries.

**A value is distinct when its remedy is distinct.** That rule decided three separate splits in this
project and works as a deletion test too — a value whose remedy duplicates another's is not a value.
See ADR-0009 decision 6.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it rather than silently overriding:

> _Contradicts ADR-00NN (its one-line title) — but worth reopening because…_

**Do not edit the ADR.** A refuted claim standing in an accepted ADR is a dated record and is correct
as a record. `CONTEXT.md` and `PRODUCT.md` are living documents and *are* corrected in place. That
carve-out is the whole rule; without it the constraint reads as "never correct anything."

## Why this file is specific

Four incidents in **three distinct shapes**, and the shapes matter because rule 1 only catches the
first:

**Shape A — the evidence was in the repo and the ADR contradicted it.** Grep-catchable.
**Issue #25 is the record of the count: two ADRs, as of 2026-08-17.** The instance with a full
write-up is ADR-0006's search row, whose correct value sat in `notion-api-practice.md` §4.5 and
`competitive-landscape.md` §4 for three hours before the ADR was committed — ancestry confirmed with
`git merge-base --is-ancestor`. ADR-0007 is the *correction*, not an offender.

**Shape B — the evidence was not in the repo, so nothing felt wrong.** Grep-blind, and rule 3 exists
for it. **ADR-0009** asserted a capability-model fact without opening the capabilities reference;
grep returns nothing and silence reads as agreement.

**Shape C — the evidence was in the repo, indexed, and simply not read.** On 2026-08-17 the session's
largest product finding sat unopened in `docs/research/notion-user-pain.md` and
`docs/inputs/decay-causal-synthesis-2026-08-16.md` for an entire session. **Neither directory was in
this file's reading list.** That is the incident this rewrite addresses, and no rule catches it — only
the reading order above does.

*Revisit if:* the grep in rule 1 is installed as a PreToolUse hook (issue #25). Rule 1 then moves to
the enforcement layer and this file should point at the hook rather than restate the discipline — per
the standing layer-placement rule, a discipline that must fire cannot depend on being remembered.

*Revisit if:* `src/` appears. The file-structure block and the "no `src/` yet" line both go stale the
day the first code lands, and a stale structure diagram is the kind of claim that calcifies because
nobody follows it.

**That gap is now closed.** `docs/research/INDEX.md` gives one line per file — the question it answers
and what it refutes — and step 5 above points at it. Issue #54.

**The count in this file was stale when the index was written, which is the failure the index is
supposed to end.** This paragraph said ten files; there were eleven, and twelve once the ADR-0013
sweep landed. Issue #54 said eleven and was also wrong. A hand-maintained count drifts silently
in exactly the way a hand-maintained list does — see issue #55 for the same shape in
`slice/tsconfig.json`, and `INDEX.md`'s own *Revisit if*, which pre-registers the fix: at the second
drift the index becomes generated or checked, not hand-kept.
