# ADR-0015: The declared-roots requirement rests on non-guarantee, not on non-enumeration

- **Status:** Accepted
- **Date:** 2026-08-19
- **Closes:** issue #123.
- **Supersedes:** **ADR-0002 finding 1 only.** ADR-0002's five numbered decisions, its findings 2 and
  3, and every consequence drawn from them stand unchanged. This ADR replaces one premise and leaves
  the conclusion where it was, because the conclusion never depended on the premise being retracted.
- **Corrects:** nothing in `docs/research/`. `docs/vendor/access-enumeration.md` is the evidence and
  postdates ADR-0002 by three days.
- **Evidence:** `https://developers.notion.com/reference/post-search`, fetched and re-verified
  2026-08-19; `https://developers.notion.com/reference/search-optimizations-and-limitations`, fetched
  2026-08-19; `https://developers.notion.com/llms.txt`, fetched 2026-08-19;
  `docs/vendor/access-enumeration.md`; `docs/research/vendor-assumption-drift-prior-art.md` §4;
  issues #123, #124, #125

## Context

ADR-0002 established that coverage is measured against declared roots. It rested that decision on
three findings. **Finding 1 is wrong.** It reads:

> "**No endpoint enumerates a connection's grant.** Search, `/v1/users`, `/v1/users/me`,
> `/v1/oauth/introspect`, and the complete public endpoint index were checked. Nothing returns the
> set of objects an integration may read."
<!-- nmf -->

⬆ **Typed `nmf` deliberately, and it is the point of the ADR.** That sentence is **negation as
failure** — *"it is not currently believed that"* — written in the grammar of strong negation. It is
quoted here rather than asserted, and it is now the first sentence in this repository to carry the
type that would have prevented four sessions of treating it as settled.

`POST /v1/search`, opening sentence, verbatim:

> "Searches all parent or child pages and data_sources that have been shared with a connection."

That is the set of objects the integration may read, returned by an endpoint, and the endpoint was
named in finding 1's own list of things checked.

This was found by the `notion-sme` agent added in PR #126 and then **re-fetched and matched
byte-for-byte before being acted on**, because the sweep behind that agent measured the model
judgement layer at roughly 80% and only the mechanical layer — does the URL resolve, does the quote
match — as carrying no error rate.

**It is the fifth entry in a pattern this repository has now measured.** Issue #125 records four
assumptions checked against the vendor and four reversals, every one toward *"cannot"*. Issue #124
records ~180 assertions about Notion across these ADRs and nine followable locators. Finding 1 had
none.

## Decision

### 1. Finding 1 is retracted and replaced with the narrower claim the evidence supports

**Search enumerates the shared set. Nothing guarantees the enumeration is complete.**

The vendor is explicit about the second half, and ADR-0002 finding 2 already quotes it:

> "Search is not guaranteed to return everything, and the index may change as your connection
> iterates through pages and databases."

⚠ **The Optimizations half of that page is NOT a new discovery, and an earlier draft of this ADR said
it was.** The agent reported *"we had read half a page"*, citing *"any pages or databases that are
directly shared with a connection are guaranteed to be returned"* as new. ADR-0002 finding 2 already
carries the same substance — *"Only **directly shared** objects are guaranteed returned. Inherited
access is not."* **The page was read. Only its URL was missing.** The overstatement is recorded here
rather than quietly dropped, because a correction pass that overshoots is the failure mode this ADR
exists to document.

***Revisit if:*** a vendor sentence appears asserting that no endpoint enumerates the grant. Finding 1
would then be correct as originally written and this decision wrong. It has been looked for across
`llms.txt` and not found — **which is not the same as its absence**, and decision 4 says why.

### 2. The declared-roots decision stands, unamended, on finding 2

**Non-guarantee is the load-bearing fact, and it always was.** A tool that cannot be told its
enumeration is complete cannot report a census, whether or not an endpoint hands it a list. Finding 1
was doing no work that finding 2 was not already doing better.
<!-- claim: vendor url="https://developers.notion.com/reference/search-optimizations-and-limitations" fetched="2026-08-19" quote="Search is not guaranteed to return everything, and the index may change as your connection iterates through pages and databases." -->

⬆ **Typed `vendor` — this one IS strong negation.** The vendor asserts the non-guarantee in its own
words, so the claim is not *"we looked and found no guarantee"* but *"the vendor states there is
none"*. That is the distinction the whole ADR turns on, and decision 2 is the only load-bearing claim
here that earns it.

All five of ADR-0002's numbered decisions stand. Principle 1 stands. The coverage manifest, the
declared-root requirement, and exit `2` on an unreachable declared root are untouched.

**This is deliberate restraint rather than caution.** Retracting more of ADR-0002 than the evidence
requires is **culprit selection**, which is under-determined by construction — a contradiction
identifies an inconsistent support set, not a culprit (DOI `10.1609/aimag.v11i4.866`). This session
already overshot once, reversing its own reversal on issue #125's R1, and
`docs/research/vendor-assumption-drift-prior-art.md` §4.1 records why that is a known hard problem
rather than a lapse.

***Revisit if:*** the search Optimizations guarantee turns out to be scoped to a plan tier or a
connection type. It is quoted without a qualifier because the page carries none, and a qualifier
would narrow this decision's foundation. ***Or if:*** a reviewer holding less context than this ADR
concludes that finding 2 alone does not carry declared roots — that is a live disagreement, not a
settled call, and the decision is offered as a proposal a better-informed reading may overturn.

### 3. ⭐ ADR-0014 is placed OUT pending re-justification, and is NOT reversed

ADR-0014's Evidence line begins:

> "ADR-0002 findings 1–3 and its decision"

**ADR-0014 — the decision that removed `POST /v1/search` from the v0.1 scan — cites the refuted
finding as a support.** Under the Truth Maintenance reading adopted below, a derived belief whose
support is withdrawn goes **OUT until re-justified**. It does not go false.

**This ADR does not reverse ADR-0014 and must not be read as doing so.** `POST /v1/search` remains
out of the v0.1 scan today. What is recorded is that one of its three ADR-level supports no longer
holds, and that the decision needs a support that survives. ADR-0014's own reasoning rests
substantially on ADR-0007 and ADR-0013, neither of which is touched here; whether that is sufficient
on its own is the re-justification, and it is **not performed in this ADR**.

**Nothing surfaced this before because nobody traversed the edges.** The support graph shipped in this
same change (`slice/support.ts`) exists so that the next retraction propagates mechanically instead of
being noticed.

***Revisit if:*** ADR-0014's re-justification fails — that is, ADR-0007 and ADR-0013 turn out not to
carry the decision without ADR-0002 finding 1. Search would then be an open question again and
ADR-0014 would need **superseding** rather than re-justifying. ***Or if:*** a reviewer judges that
citing a finding in an Evidence line is too weak an edge to place a decision OUT. That is a judgement
about how literally the support graph should be read, and this ADR takes the strict reading
deliberately — a weaker one restores the silent propagation that produced #124.

### 4. No endpoint enumerates the grant *completely* — and that is negation as failure, not a negative
<!-- nmf -->

`https://developers.notion.com/llms.txt` is the complete endpoint index and was read: **300+ entries,
no route enumerating a connection's accessible objects other than `POST /v1/search`.** Nine
keyword-matching endpoints were checked and eliminated, three of them organisation-scoped admin
routes rather than connection-scoped.

⛔ **That is recorded as `UNLOCATABLE` — negation as failure — and NOT as a settled negative.**
Absence from an index is absence of evidence. The honest form is *"no other enumeration route is
currently believed to exist"*. PactFlow states the general rule about its own product: *"implementing
a spec is not the same as being compatible with a spec. Most tools only tell you that what you're
doing is **not incompatible** with the spec."* **A source silent about X never contradicts "X is
impossible."**

`slice/negation.ts`, shipped in PR #126, now enforces this at the gate for exactly this sentence class.

***Revisit if:*** `llms.txt` is found to be incomplete. It is treated here as *the* endpoint index
because `reference/intro` renders none — that is an inference about the vendor's own documentation
practice, not a vendor statement, and a less-informed reviewer is entitled to reject it.

### 5. ADR-0002 finding 3 is untouched and still has no vendor locator

The `~11,200` search ceiling is attributed to a third-party issue tracker. **No vendor page states
it.** It is not retracted here — it is flagged as carrying the same defect finding 1 carried, and it
is issue #124's territory.

⚠ Separately: the `10,000` cap **does** now have a locator, on two independent vendor pages
(`docs/vendor/data-source-endpoints.md`). It is stated **per query**, which is not what a workspace
ceiling would mean. Do not conflate the two numbers.

***Revisit if:*** a vendor page states a search result ceiling. `~11,200` would then be either
confirmed or replaced, and ADR-0002 finding 3 would move from unlocatable to settled.

## How to read the five decisions above

**They are informed proposals, not settled fact.** Each rests on pages fetched on one day by one
session, and decisions 3 and 4 rest additionally on readings — of an Evidence line, and of what
`llms.txt` is — that a reviewer holding less of this session's context could reasonably reject. The
Revisit-if attached to each names the condition that would overturn it. **A later reader who
disagrees is not re-litigating a closed question; they are doing the thing these clauses exist to
invite.**

What is *not* open to that treatment is the evidence itself: the quoted vendor sentences were fetched
and matched byte-for-byte, and disagreement about them is settled by re-fetching, not by argument.

## Consequences

- **No code changes.** No rule, no port method, no exit byte, no manifest stage moves. This ADR
  changes what the repository may assert, not what the scan does.
- **`docs/adr/0002` is NOT edited.** Superseded by reference, as every ADR here is. A reader who finds
  finding 1 standing in ADR-0002 has found the record working, not a bug.
- **Two entries in `slice/negation-baseline.json` carry dispositions** — `d66eb982f3fc` REFUTED and
  `70da8ea84cbe` CONTESTED — so the gate renders these two sentences differently from the twenty
  nobody has checked.
- **`ADR-0014` needs a re-justification pass** and now has a ticket-visible reason to get one.
- **The claim "the complete public endpoint index was checked" is CONTESTED, not refuted.**
  `llms.txt` is the index; `reference/intro` renders none. Whether the 2026-08-16 check reached an
  index at all is not established either way, and this ADR does not guess.

## Revisit if

**Each decision carries its own, attached to the decision itself** — see decisions 1 through 5 above
and the note that follows them. A single trailing list stood here in the first draft and was removed:
it made five differently-conditioned calls look like one, which is the collapse this ADR spends its
length arguing against.
