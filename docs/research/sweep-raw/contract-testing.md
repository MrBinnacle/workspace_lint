# Prior art: keeping a written model of an external system from drifting away from it

Sweep date: 2026-08-19. All URLs fetched on 2026-08-19 unless stated.
Instrument: WebFetch (confirmed present before starting). WebSearch not used.
Scope: survey only. No implementation recommendation is made here.

Binding constraint applied to every mechanism below: **does it work when the
provider publishes prose reference pages and no machine-readable schema you
trust?**

---

## 0. The headline finding

The dominant prior art — consumer-driven contract testing — is built for a
provider you can execute against and coordinate with. Pact's own FAQ rules out
the case in this project. It names the alternative by name, and the alternative
is record-and-replay:

> "Testing APIs where the number of consumers is so great that direct
> relationships cannot be maintained between the consumer teams and the
> provider team." … "if you use Pact to test a public API, the only way to set
> up the right provider state is to use the very API that you're actually
> testing, which will make the tests slower and more brittle." … "If this is
> still a better situation for you than integration testing, or using another
> tool like VCR, then go for it!"
> — https://docs.pact.io/faq (fetched 2026-08-19)

So the field has an answer for "consumer and provider are both yours." For
"provider is a third party who publishes prose," the field's answer is thinner
and lives in a different family: recorded observation (VCR), schema-conformance
probing (Schemathesis), and executable documentation (doctest). Section 5.

---

## 1. Consumer-driven contract testing (Pact, Spring Cloud Contract)

### Mechanism

The consumer's assumption becomes an executable artifact by being *executed*.
The consumer writes a test against a Pact mock server, registering an expected
request and an expected response. Pact serialises those interactions to a pact
file.

> "The contract is generated during the execution of the automated consumer
> tests." … "Pact is, in effect, 'contract by example'."
> — https://docs.pact.io/ (fetched 2026-08-19)

Verification happens on the provider side. The pact file's requests are
replayed against the running provider, and the provider's actual response must
*contain at least* what the consumer test described. Preconditions are handled
by "provider states" — named setup hooks the provider implements.
— https://docs.pact.io/getting_started/how_pact_works (fetched 2026-08-19)

Two properties matter for our problem:

1. The verification runs against the **real provider**, not against a document.
2. Only what a consumer actually uses is tested: "only parts of the
   communication that are actually used by the consumer(s) get tested"
   (docs.pact.io). Unused provider behaviour is free to change.

### The can-I-deploy / broker model

The Pact Broker stores a matrix: consumer version × provider version ×
verification result. `can-i-deploy` answers "is it safe to deploy this version
into this environment without breaking an integration," by checking that the
version being deployed has a passing verification against every version
currently deployed in that environment.
— https://docs.pact.io/pact_broker/can_i_deploy (fetched 2026-08-19)

Documented caveats on that page:

- **Race conditions.** Using `--latest` rather than explicit versions can give
  an inaccurate answer.
- **Tags are superseded** by deployment/release tracking; "new features may not
  include support for tags."
- **It cannot verify what was not tested.** The matrix only contains pairings
  that were actually exercised.

### Cost to the consumer

A consumer test per assumption; a mock server in the consumer's test run; a
provider willing to run verification in *its* CI; a provider willing to
implement provider states; and a broker to hold the matrix. The provider-side
obligations are the expensive half, and they are the half a third-party vendor
will not perform.

### Prose-only provider: NO

Fails on two independent grounds. (a) Verification requires executing the
provider in a controlled state; the FAQ says the only way to set provider state
on a public API is through the API itself, making tests "slower and more
brittle." (b) The broker/can-i-deploy half requires a provider version
identifier and a provider CI job. Neither exists for a vendor SaaS.

### Academic status

Thin, and this is itself a finding. arXiv returns effectively nothing (§7). The
one substantial peer-reviewed treatment found:

- Schwarz, G., Quast, F., & Riehle, D. (2025). "Ensuring Syntactic
  Interoperability Using Consumer-Driven Contract Testing." *Software Testing,
  Verification and Reliability*, 35(5). DOI 10.1002/stvr.70006.
  A systematic literature review plus an action-research study. Its scope is
  explicit and it is **syntactic**: "a testing technique that ensures syntactic
  compatibility between microservices through isolated test execution," aimed
  at the problem that "today's compilers cannot ensure syntactic
  interoperability of web APIs. Without further help, invalid calls surface
  only at runtime." It notes it contributes "rare empirical data to the field."

  Read that last phrase carefully. In 2025 a journal SLR describes empirical
  data on CDCT as rare. The technique is industrially popular and academically
  under-measured.

  Note the ceiling: CDCT is scoped to *syntactic* interoperability. Roughly
  half of the ~180 assertions in a project like ours are semantic ("this
  endpoint cannot filter on X"), not syntactic. CDCT literature does not claim
  that ground.

### Spring Cloud Contract

NOT CHECKED. Route not taken: `docs.spring.io/spring-cloud-contract/reference/`.
I spent the call budget on the prose-only question instead. From the Pact
material the architectural difference is known to be that Spring Cloud Contract
is provider-first (the provider authors the contract, stubs are generated for
consumers), which if anything makes it *worse* for our case — it presumes the
provider participates. That last sentence is UNVERIFIED — answered from model
memory.

---

## 2. API drift / schema diff detection

### oasdiff

> "Command-line tool to compare and detect breaking changes in OpenAPI specs."
> — https://github.com/oasdiff/oasdiff (fetched 2026-08-19)

Granularity: endpoint, parameter, schema, and documentation level. Two
commands separate the concerns — `breaking` surfaces only changes that "break
existing API clients"; `changelog` shows all changes "that can affect API
consumers, breaking or not, in human-readable form." Classification is by
customisable rules. Input: two OpenAPI specs (files, URLs, or git revisions).

**Prose-only provider: NO.** It is a spec-to-spec differ. Its entire input is
two machine-readable documents. With no maintained vendor OpenAPI spec there is
nothing to diff. (A derived spec you write yourself would only diff against
your own past beliefs — that detects *your* edits, not the vendor's changes.
That is a different instrument with a different meaning.)

### Optic

Optic did the closest thing to what we want: generate an OpenAPI spec **from
observed traffic**, then diff it. "Generate OpenAPI from test traffic," "Keep
OpenAPI spec accurate with automatic schema testing," and catch breaking
changes.
— https://github.com/opticdev/optic (fetched 2026-08-19)

**Status: dead.** The repository banner reads "This repository was archived by
the owner on Jan 12, 2026. It is now read-only," and "Optic Labs is now part of
Atlassian." Acquired, not failed.

**Prose-only provider: PARTIALLY YES — and this is the most interesting
mechanism found.** Optic's traffic-capture mode does not need the provider to
publish anything. It derives the spec from what the wire actually did. The
derived spec is then the diffable artifact. The limit is that observation only
covers behaviour you exercised; an unexercised capability is invisible, and
absence-of-capability claims ("cannot filter on X") are not observable at all
without an explicit negative probe.

### Confluent Schema Registry

Compatibility modes, from
https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html
(fetched 2026-08-19):

| Mode | Permits | Upgrade order |
|---|---|---|
| BACKWARD (default) | add optional fields, delete fields | consumers first |
| FORWARD | add fields, delete optional fields | producers first |
| FULL | optional add/delete only | either order |
| *_TRANSITIVE | as above, checked against **all** prior versions, not just the previous one | as above |
| NONE | anything | manual coordination |

Enforcement is **at registration time**: the registry validates a new schema
against the configured rule before accepting it, and rejects it otherwise.
Each version gets an ID and an incremented version number.

The transferable idea is not the tool, it is the shape: a **gate on the write
path** plus an **explicit, named compatibility policy** plus **transitive
checking against all prior versions rather than only the last**. The failure
mode transitivity exists to prevent is exactly a slow drift that is
pairwise-legal at every step and illegal end-to-end.

**Prose-only provider: NO.** Requires Avro/Protobuf/JSON-Schema and a registry
the producer writes through. The vendor is not writing through your registry.

---

## 3. Provider-side deprecation signalling

Both standards exist. They are in-band HTTP response headers.

### RFC 8594 — the Sunset header (2019)

Defines a response header carrying a single HTTP-date:

```
Sunset: Sat, 31 Dec 2018 23:59:59 GMT
```

- §3: the header "allows a server to communicate the fact that a resource is
  expected to become unresponsive at a specific point in time."
- §3: "Clients SHOULD treat Sunset timestamps as hints: it is not guaranteed
  that the resource will, in fact, be available until that time."
- §4: "The Sunset header field is not concerned with resource state at all" —
  it says nothing about how content may change before the sunset.
- §1.4: it is **not** the right signal for deprecation-while-still-working.
- §6: a `sunset` link relation type carries the human-readable policy.
- §8: intermediaries may insert or alter the header; independent availability
  testing remains necessary.
— https://datatracker.ietf.org/doc/html/rfc8594 (fetched 2026-08-19)

### RFC 9745 — the Deprecation header (March 2025, Proposed Standard)

Fills the gap RFC 8594 §1.4 left open.

- §2.1: "an Item Structured Header Field; its value MUST be a Date" per RFC
  9651. Example: `Deprecation: @1688169599`.
- §4.2: "The timestamp given in the `Sunset` HTTP header field MUST NOT be
  earlier than the one given in the `Deprecation` header field."
- §5: "The act of deprecation does not change any behavior of the resource."
— https://datatracker.ietf.org/doc/html/rfc9745 (fetched 2026-08-19)

### The gap between "a standard exists" and "your provider uses it"

Both RFCs describe an **announcement of retirement**. Neither describes an
announcement of a **capability change** — a filter that starts working, a limit
that changes, a field that begins returning null. RFC 8594 §4 is explicit that
Sunset says nothing about resource state. Our four reversed assumptions were
all capability claims. No in-band standard covers them.

Empirical uptake, closest study found:

- Yasmin, J., Tian, Y., & Yang, J. (2020). "A First Look at the Deprecation of
  RESTful APIs: An Empirical Study." arXiv:2008.12808 (28 Aug 2020). Built
  RADA, ran it over 2,224 OpenAPI specifications covering 1,368 RESTful APIs
  from APIs.guru. Abstract states "The results of our study reveal several
  severe deprecation-related problems in existing RESTful APIs."
  **The abstract does not give the percentage.** I could not extract the
  headline rate — the arXiv abstract page carries no numbers, and I did not
  spend a call on the PDF. Route not taken: fetch
  `https://arxiv.org/pdf/2008.12808` and read §4.

**Prose-only provider: NO, in practice.** The mechanism costs the *consumer*
almost nothing (read two response headers) but requires the *provider* to emit
them. It is unilateral in the wrong direction. Cheap to check for; not
something you can cause.

---

## 4. Documentation/code drift

### doctest — the canonical executable-documentation mechanism

Verbatim, from https://docs.python.org/3/library/doctest.html (fetched
2026-08-19):

> "The `doctest` module searches for pieces of text that look like interactive
> Python sessions, and then executes those sessions to verify that they work
> exactly as shown. There are several common ways to use doctest:
> - To check that a module's docstrings are up-to-date by verifying that all
>   interactive examples still work as documented.
> - To perform regression testing by verifying that interactive examples from a
>   test file or a test object work as expected.
> - To write tutorial documentation for a package, liberally illustrated with
>   input-output examples. Depending on whether the examples or the expository
>   text are emphasized, this has the flavor of 'literate testing' or
>   'executable documentation'."

The first bullet is our problem restated, one level in: a claim written in prose
is re-executed, and the document fails when the world moves. doctest's
limitation is that the executed subject is *local code*. Pointing the same
mechanism at a remote third party changes the cost model completely — every
check becomes a network call, needs credentials, and can fail for reasons
unrelated to drift.

**Prose-only provider: YES in principle.** doctest does not need a schema. It
needs the claim to be written in an executable form and something to execute it
against. This is the one family in this survey whose input is prose plus an
executable example.

### Measured staleness rates

I could not find a measured rate for "documentation about an *external
dependency* going stale." What exists is adjacent:

- **Comment-code inconsistency causes bugs.** "Investigating the Impact of Code
  Comment Inconsistency on Bug Introducing," arXiv:2409.10781 (2024-09-16):
  inconsistent changes are "around 1.5 times more likely to lead to a
  bug-introducing commit."
- **Stale references are findable at scale.** "We Must Have Missed This Comment:
  Detecting and Repairing Stale Function References in Linux Kernel Comments,"
  arXiv:2608.03734 (2026-08-04): 869 stale references detected in the Linux
  kernel; 89.0% of automated repairs judged useful. This is the nearest analogue
  to "a written reference to a thing that no longer exists" — our dead-reference
  case, one repo over.
- **Tutorials about an external API do rot, and the rot is detectable.**
  "Automatically identifying valid API versions for software development
  tutorials on the Web," DOI 10.1002/smr.2227: "Once written, tutorials are
  rarely actively curated and can become dated over time. Tutorials often
  reference APIs that change rapidly, and deprecated classes, methods, and
  fields can render tutorials inapplicable to newer releases of the API." The
  paper "empirically stud[ies] the tutorial versioning problem, confirming its
  presence in popular tutorials on the Web." Its detection technique reaches
  precision 61–89%, recall 42–84%. Note what it requires: "given access to the
  official API documentation they reference" — i.e. it maps prose mentions to a
  documented API surface. It never executes anything.
- **Technical lag** — a formal metric for exactly the quantity we lack.
  "A formal framework for measuring technical lag in component repositories —
  and its application to npm," DOI 10.1002/spe.2215: "we formalise a generic
  model of *technical lag*, a concept that quantifies to which extent a deployed
  collection of components is outdated, with respect to the *ideal* deployment."
  Operationalised over 500K+ npm packages, ~4M releases, seven years.

  This is a better conceptual fit than its title suggests. Technical lag is the
  distance between what you have recorded and what is currently true. Our
  ~180 assertions have an unmeasured lag and no expiry. The npm work shows the
  quantity can be defined formally and measured longitudinally.

### Other families found

- **Schemathesis** — property-based testing that "tests OpenAPI and GraphQL
  APIs by generating inputs from your schema," and reports "schema violations
  where your API returns different data than documented." It checks a *running*
  API against a *document*, which is the right direction of comparison for us.
  — https://github.com/schemathesis/schemathesis (fetched 2026-08-19)
  **Prose-only provider: NO.** It requires a schema URL as its input.
- **VCR** — "Record your test suite's HTTP interactions and replay them during
  future test runs for fast, deterministic, accurate tests." Cassettes are
  serialised YAML/JSON on disk. It "optionally re-records cassettes on a
  configurable regular interval to keep them fresh and current."
  — https://github.com/vcr/vcr (fetched 2026-08-19)
  **Prose-only provider: YES, with a sharp caveat.** VCR needs no schema and no
  provider cooperation. But its default behaviour *hides* drift — a replayed
  cassette passes forever regardless of what the real service now does. It only
  detects drift when re-recording is scheduled and the new recording is
  compared to the old. The README documents the re-record interval; it does not
  document a diff-on-re-record step. Pact's FAQ nonetheless names VCR as the
  tool to use when the provider is public.

---

## 5. Better matches than the four requested, stated explicitly

Two, and they are the same shape.

**(a) Recorded-observation drift detection: VCR's cassette + Optic's
traffic-derived spec + oasdiff's differ.** No single maintained tool composes
these. Optic came closest and was archived on 2026-01-12. The composite
mechanism — probe the live provider, serialise the observation, diff today's
observation against the stored one, fail on difference — is the only family in
this survey that survives the prose-only constraint end to end. It needs
nothing from the provider except that it answer requests.

**(b) doctest's contract, pointed outward.** The claim is written in an
executable form beside the prose; the suite executes it; the document goes red
when the world moves. This is what a `<!-- claim: ... -->` annotation already
is in this repo, one target further away.

The gap neither covers: **negative claims**. "The API cannot do X" is not
observable by recording traffic, is not expressible as a schema diff, and is
not announced by any RFC. It can only be tested by a probe that asserts a
specific failure — and a probe asserting a 400 will keep passing when the
vendor changes the reason for the 400. Every one of the four reversed
assumptions was a negative claim. No prior art in this sweep addresses negative
capability claims about a third-party API. If that holds up, it is the
project's contribution rather than its borrowing.

---

## 6. Summary table

| Mechanism | Needs from provider | Consumer cost | Works with prose-only docs? |
|---|---|---|---|
| Pact CDCT + broker | verification CI job, provider states, version IDs | high | **No** (FAQ rules it out) |
| Spring Cloud Contract | provider authors the contract | high | **No** (unverified) |
| oasdiff | maintained OpenAPI spec, two versions | low | **No** |
| Optic (archived) | nothing — derives spec from traffic | medium | **Partly** |
| Schema Registry | producer writes through the registry | medium | **No** |
| RFC 8594 / 9745 headers | provider emits the headers | ~zero | **No** (unilateral, wrong direction) |
| doctest pattern | nothing | medium | **Yes** |
| VCR record/replay | nothing | low | **Yes**, but hides drift by default |

---

## 7. What I tried to check and could not

Named, with the reason.

1. **arXiv phrase queries for contract testing returned zero.**
   `all:"consumer-driven contract testing"` (%20-encoded) → HTTP 200,
   `<opensearch:totalResults>0</opensearch:totalResults>`.
   `all:"contract testing" AND all:"microservices"` (+-encoded) → HTTP 200,
   totalResults 0. Switching to unquoted term-AND (`abs:contract AND abs:testing
   AND abs:microservice`) returned only 2 entries, neither about contract
   testing as such. Conclusion, held tentatively: arXiv's `all:` field does not
   match quoted multiword phrases the way assumed, **and** the CDCT literature
   is genuinely near-absent from arXiv. The Wiley SLR (10.1002/stvr.70006)
   calling its own empirical data "rare" supports the second reading.

2. **Bi-directional contract testing — NOT COVERED.** This is the significant
   gap in this survey, because it is the Pact variant closest to our constraint
   (the provider supplies a spec instead of running verification).
   - `https://docs.pact.io/bi-directional-contract-testing` → **HTTP 404**
   - `https://docs.pactflow.io/docs/bi-directional-contract-testing` → **HTTP 404**
   Routes not taken: fetch `https://docs.pactflow.io/` and follow its nav; or
   `https://pactflow.io/bi-directional-contract-testing/`. I did not spend the
   calls. Treat bi-directional CDCT as unassessed, not as absent.

3. **Optic's documentation site is gone.** `https://www.useoptic.com/docs` →
   DNS failure, `getaddrinfo ENOTFOUND www.useoptic.com`. Only the archived
   GitHub README was reachable. The mechanism detail (how the traffic-derived
   spec is diffed, what it does about unexercised endpoints) is therefore
   thinner than it should be. Route not taken: the Wayback Machine, or the
   archived repo's `docs/` directory.

4. **The deprecation-uptake percentage.** arXiv:2008.12808's abstract states
   "several severe deprecation-related problems" without a number. Route not
   taken: `https://arxiv.org/pdf/2008.12808`, §4.

5. **Scholar Gateway's corpus is Wiley-only.** Every DOI returned was
   `10.1002/*` or `10.1111/*`/`10.1155/*`. The ACM/IEEE empirical web-API
   evolution literature (MSR/ICSE-venue work on how API changes break clients)
   was not reachable through it, and WebSearch was reported exhausted. I have
   candidate titles in memory and am **not** citing them, per the task's own
   rule. Route not taken: a DOI-resolver fetch or an OpenAlex/Crossref API
   query — `https://api.crossref.org/works?query=...` is keyless and would have
   reached them.

6. **Spring Cloud Contract** — not fetched at all. See §1.

## 8. Provenance note on the two Wiley papers

The Scholar Gateway tool returned 87K and 82K characters, over the token limit;
the payload was written to disk and I extracted from it with grep and Python. I
read the **citation metadata and abstracts** for the four papers cited above.
I did **not** read their full passage text. Every quotation attributed to them
is from the abstract as returned by the tool.

---

# Follow-up sweep

Date: 2026-08-19. WebFetch only; WebSearch not used. Thirteen fetches.
Three routes named as untaken in §7 were taken. All three now have answers.

## F1. Bi-directional contract testing — ANSWERED

The question was: does BDCT remove the provider-CI requirement, and can the
provider side be satisfied by a published spec or by recorded observations?

**Answer: it removes the provider-CI requirement and replaces it with a
provider-published OpenAPI specification. Not recorded observations. It does
not help us.**

Mechanism, from https://pactflow.io/bi-directional-contract-testing/ (fetched
2026-08-19):

- The provider does not write Pact tests. The provider documents its API with
  an **OpenAPI Specification**, and verifies its own implementation against
  that OAS using whatever tool it already has — the page names code-generated
  docs, RestAssured, Dredd and Postman.
- PactFlow then does the cross-comparison: consumer pact file against provider
  OAS. The comparison happens **between two documents**, on PactFlow's servers.
- **The feature is proprietary.** The page states it is "exclusive to
  PactFlow"; the open-source Pact Broker does not implement it.
- Supported contract formats today are Pact and OAS only; SOAP/XSD, Protobuf,
  GraphQL and Postman Collections are listed as future.

The provider-side worked example makes the shape concrete. From
https://github.com/pactflow/example-bi-directional-provider-dredd (fetched
2026-08-19):

> "What is uploaded to PactFlow is an OpenAPI specification that represents
> what you actually tested with Dredd, to give us confidence it is compatible
> with a Pact consumer."

And the limitation, verbatim from the same README — this is the sharpest
sentence found in the entire sweep:

> "_implementing_ a spec is not the same as being _compatible_ with a spec.
> Most tools only tell you that what you're doing is _not incompatible_ with
> the spec."

That is the substitutable-control problem stated by the vendor about its own
product. A passing BDCT run means "no detected contradiction," not "verified
compatible." Our negative capability claims sit exactly in that gap: a claim of
the form "the API cannot do X" is never contradicted by a spec that is silent
about X.

**Prose-only provider: NO.** BDCT needs the provider to publish and maintain an
OpenAPI spec, and needs a PactFlow account. Notion supplies the first only
partially and we do not trust it. The one genuinely useful transfer is the Dredd
step — the provider proves the spec by running it against the live service
before publishing it, rather than asserting it. That inversion (prove the
document against the system, then publish the document) is available to a
consumer too.

**Routes taken and their results:**
- `https://docs.pactflow.io/docs/` → **HTTP 404**
- `https://pactflow.io/blog/bi-directional-contract-testing/` → **HTTP 404**
- `https://pactflow.io/docs/` → **HTTP 404**
- `https://docs.pactflow.io/` → **HTTP 200**, but it is now a relocation notice.
  Four quick links only (Getting Started, PactFlow University, Examples, User
  Guide); no bi-directional entry. The docs moved and the new host is not named
  on the page.
- `http://archive.org/wayback/available?url=docs.pactflow.io/docs/bi-directional-contract-testing`
  → **HTTP 200**, body `{"url": "...", "archived_snapshots": {}}` — no snapshot.
  Same empty result for `pactflow.io/blog/bi-directional-contract-testing`.
- `http://web.archive.org/cdx/search/cdx?...` → **blocked at the tool layer**,
  not by the server: "Claude Code is unable to fetch from web.archive.org".
  The `archive.org/wayback/available` endpoint is reachable; the `web.archive.org`
  host is not. Worth knowing for future sweeps.
- `https://github.com/pactflow/example-bi-directional-provider-dredd` →
  **HTTP 200**. This is the route that worked.

**Route not taken:** the current PactFlow docs host, whatever it now is. The
relocation notice did not name it and I did not spend a call guessing further.
The mechanism question is answered from the marketing page plus the example
repo, so the gap is detail, not substance.

## F2. Crossref — the ACM/IEEE literature, now reached

Crossref is keyless and works. Two queries, 40 records. Precision is poor —
`query.bibliographic` returns CRAN package descriptions and, memorably,
"Climate Change Is Breaking Earth's Beat" (10.1016/j.tree.2019.07.014) — but
the relevant records are there.

**This closes the ACM/IEEE gap recorded as NOT CHECKED in
`docs/research/documented-claim-drift-prior-art.md`. Flagging as instructed.**
IAEA is still not checked; I did not go near it.

### The single most on-point paper found in either sweep

- **Zhou, J., & Walker, R. J. (2016). "API deprecation: a retrospective
  analysis and detection method for code examples on the web." FSE'16, 24th
  ACM SIGSOFT International Symposium on the Foundations of Software
  Engineering, Seattle.** DOI 10.1145/2950290.2950298. 68 citations
  (Semantic Scholar, fetched 2026-08-19).

  Read the title against our problem statement. Ours is: written documents on
  the web that make claims about a third-party API, which go stale when the API
  moves, plus a method for detecting it. Theirs is the same sentence with "code
  examples" where we have "assertions." A retrospective analysis *and* a
  detection method — both halves of what we are about to build.

  **I could not get the abstract.** Crossref returns no abstract for this DOI.
  Semantic Scholar returns `"abstract": null` with the publisher disclaimer
  "the following paper fields have been elided by the publisher: {'abstract'}".
  Route not taken: `https://api.unpaywall.org/v2/10.1145/2950290.2950298?email=...`
  (needs an email parameter, which I did not want to supply on your behalf), or
  `https://dl.acm.org/doi/10.1145/2950290.2950298` (expected 403 behind ACM's
  bot wall). **Recommend someone reads this paper before the instrument is
  designed.** It is the closest prior art in the sweep and it is 68-citations
  established.

### Other Crossref records worth naming

Breaking-change detection, source-based, all with locators:

- ROSEAU: "Fast, Accurate, Source-Based API Breaking Change Analysis in Java."
  DOI 10.1109/icsme64153.2025.00053, ICSME 2025.
- APIDiff: "Detecting API breaking changes." DOI 10.1109/saner.2018.8330249,
  SANER 2018.
- "Historical and impact analysis of API breaking changes: A large-scale study."
  DOI 10.1109/saner.2017.7884616, SANER 2017.
- "Web API Change-Proneness Prediction." DOI 10.1109/saner60148.2024.00050,
  SANER 2024. Title implies per-endpoint risk scoring — i.e. *which* claims are
  most likely to rot. If a re-check budget must be rationed, this is the
  literature that rations it.
- "Reducing the Impact of Breaking Changes to Web Service Clients During Web API
  Evolution." DOI 10.1109/mobilsoft59058.2023.00008, MOBILESoft 2023.

Deprecation practice, empirical:

- "API Deprecation: A Systematic Mapping Study." DOI 10.1109/seaa56994.2022.00076,
  SEAA 2022. The entry point to this literature.
- "Towards cost-effective API deprecation: A win–win strategy for API developers
  and API users." DOI 10.1016/j.infsof.2021.106746, *Information and Software
  Technology* 142 (2022). Kao, Chang, Jiau. Crossref returns no abstract.
- "Assessing JavaScript API Deprecation." DOI 10.5753/cbsoft_estendido.2020.14616.
  Carries a measured number in its Crossref abstract: "Deprecation utility and
  code comments are the most common practices," with **"67% of deprecation
  occurrences have replacement messages."** Read the complement: a third of
  deprecations tell you a thing is going away and not what to use instead.
- "Exploring API Deprecation Evolution in JavaScript."
  DOI 10.1109/saner53432.2022.00031, SANER 2022.
- "JavaScript API Deprecation Landscape: A Mining Study."
  DOI 10.1109/iccr56254.2022.9995957, ICCR 2022.

**Does a measured result exist that we are missing?** Yes — probably two. The
Zhou & Walker retrospective almost certainly reports a staleness rate for web
code examples, and the deprecation mapping study almost certainly aggregates
signalling rates. Neither number is in my hands. I am not guessing at either.

## F3. Spring Cloud Contract — one line, as requested

**No.** It is built for a producer you control. From
https://docs.spring.io/spring-cloud-contract/reference/ (fetched 2026-08-19):
the two supported patterns are producer-authored contracts and consumer-driven
contracts where the contract still lives with the producer. There is a
documented "Consumer Driven Contracts with Contracts in an External Repository"
pattern (`using/cdc-external-repo.html`) that stores contracts outside both
codebases, which is the nearest thing to a third-party workflow.

The reason it does not rescue us is structural, not a missing feature. For a
third party you write the contract yourself; Spring Cloud Contract then
generates a WireMock stub *from your own contract* and your consumer tests run
against that stub. Nothing in that loop ever touches the real provider. The
test passes because your stub agrees with your contract, which it will always
do. That is a self-consistency check wearing a contract test's clothes — it is
green on day one and stays green through every vendor change. Moving on.

## F4. What changed in the picture

The follow-up did not overturn the first sweep; it hardened one edge and moved
one item.

- BDCT is now **assessed and excluded**, on the record, with the vendor's own
  sentence about "not incompatible" as the reason.
- The ACM/IEEE literature is **reached**, and it contains a 2016 FSE paper whose
  title is our problem statement. That is the one open item worth a human's
  reading time before design starts.
- The negative-capability-claim gap **survives contact with the new sources**.
  Nothing in the breaking-change literature, the deprecation literature, or
  BDCT detects "the vendor still cannot do X" or its reversal. Every mechanism
  found compares two descriptions or two observations of what a system *does*.
  None of them probe for what it *refuses*.
