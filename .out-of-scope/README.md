# `.out-of-scope/` — rejected proposals, recorded rather than filed

A refusal that leaves no artifact gets re-proposed. A refusal that leaves an **open ticket** gets
re-litigated. This directory is the third option: a record that is findable without being open.

One file per **concept**, not per issue, in kebab-case. `/triage` reads every file here during
step 1 and surfaces a match by concept similarity before the maintainer re-decides something already
decided.

## Why this directory exists here, and what it changes

On 2026-08-18 this project evaluated an external adoption proposal, refused it in full, and then
recorded in its own checkpoint:

> *"Deliberately no ticket filed — an open ticket is a standing invitation to relitigate a question
> the ADRs answered before it was asked. Full analysis is in the session transcript only; it is not
> a repository artifact and was not made one."*

The first half of that is correct and stands. The second half was an avoidable loss: the only record
format under consideration was a ticket, so declining the ticket meant declining the record. The
analysis left the repository with the session.

**The rule this directory encodes: a refusal is written down here, and a ticket is not opened.** The
two are independent choices and this project previously treated them as one.

## Local conventions, where they differ from the skill's

- **An entry does not require a prior issue.** The upstream format lists "Prior requests" as issue
  numbers. Several refusals in this project arrive as external prompts and never reach the tracker at
  all. Those entries say **`Prior requests: none`** and name where the proposal came from. An entry
  with no issue behind it is the normal case here, not a malformed one.
- **Cite like anything else in this repository.** A locator a third party can follow: an ADR by
  decision number, a file by section heading, an issue number. *"The ADRs cover this"* is commentary.
- **Record the refusal, not the mood.** *"We are busy"* is a deferral. A deferral does not belong
  here; it belongs on the tracker or nowhere.
- **A reversal deletes the file.** It does not annotate it. Git holds the history, and a file that
  argues with itself is worse than no file — the same reason `docs/adr/` is never edited in place and
  `CONTEXT.md` always is.

## What does not go here

- **Anything already implemented.** That is a built feature closed as `wontfix`, and recording it
  poisons the dedup check with a false rejection. Point at where it lives instead.
- **A rejected bug report.** Bugs get a polite close. This directory is for rejected *proposals*.
- **A decision that belongs in an ADR.** If the refusal decides how the product behaves, it is an
  ADR and this directory points at it. An entry here records that a proposal was declined and why;
  it does not carry product behaviour.
