# Scout report — direct prior art

**VERBATIM, citations NOT yet verified.** Scout `scout-priorart`, 2026-08-16. Delivered after one idle-without-transmit nudge. Self-reported method: web tools loaded, 8 searches, 2 direct fetches.

---

Web tools loaded. 8 searches, 2 direct fetches completed.

## Findings

**1 · Semgrep already emits the machine-readable coverage manifest, including a permissions skip reason — but never binds the verdict to it.**
SOURCE: `semgrep_output_v1.jsonschema` / Semgrep / fetched 2026-08-16 / https://raw.githubusercontent.com/semgrep/semgrep-interfaces/main/semgrep_output_v1.jsonschema
FETCHED DIRECTLY. Schema defines `scanned_and_skipped` — required `scanned: [fpath]`, optional `skipped: [skipped_target]`. Each `skipped_target` requires `path` + `reason`, optional `details`, `rule_id`. `skip_reason` enum includes `insufficient_permissions`, `analysis_failed_parser_or_internal_error`, `exceeded_size_limit`, `too_many_matches`, `nonexistent_file`, `too_big`, `binary`, `wrong_language`.
RELEVANCE: This is your manifest half, shipped and versioned. Gap: `skipped` populates only under `--verbose`, it is advisory, and exit code derives from findings alone.
VERDICT: ADAPT

**2 · pip-audit `--strict` is the refuse-clean behavior, in a mainstream PyPA tool.**
SOURCE: pip-audit README / PyPA / fetched 2026-08-16 / https://raw.githubusercontent.com/pypa/pip-audit/main/README.md
FETCHED DIRECTLY. `-S/--strict` = "fail the entire audit if dependency collection fails on any dependency." README states the design intent: fully resolve all dependencies and *either* audit each *or* explicitly state which were skipped and why.
RELEVANCE: Proves the behavior ships. Gap: opt-in, default off, no manifest artifact, scoped to one failure class rather than a declared resource set.
VERDICT: ADAPT

**3 · XCCDF/SCAP has a nine-valued result vocabulary separating "could not check" from pass and fail.**
SOURCE: OpenSCAP User Manual + oscap(8) / OpenSCAP / https://static.open-scap.org/openscap-1.3/oscap_user_manual.html · https://linux.die.net/man/8/oscap
Values: pass, fail, fixed, notchecked, notapplicable, notselected, informational, unknown, error. `notchecked` specifically = the rule needed a check engine OpenSCAP does not support.
RELEVANCE: Richer than axe-core's four and predates it. Per-rule only; no scoring model treats a notchecked population as invalidating the run.
VERDICT: ADOPT (the vocabulary)

**4 · The academic framing exists and is named: soundiness.**
SOURCE: Livshits et al., "In Defense of Soundiness: A Manifesto" / CACM / 2015 / https://cacm.acm.org/opinion/in-defense-of-soundiness/ (PDF: https://yanniss.github.io/Soundiness-CACM.pdf)
Core claim: a sound tool reports the assumptions it makes so they can be checked by other means; a soundy tool declares its deliberate under-approximations. It is a call to disclose, not a mechanism enforcing disclosure.
RELEVANCE: workspace_lint is this manifesto turned into an exit code. Cite it for standing.
VERDICT: CONTEXT-ONLY

**5 · Financial audit already governs this, with three states rather than two.**
SOURCE: ISA 705 (Revised) / IAASB / https://www.irba.co.za/upload/ISA-705-Revised.pdf
Inability to obtain sufficient appropriate evidence — a "scope limitation" — forces a qualified opinion; where effects are material *and* pervasive, a disclaimer of opinion. The basis section must state why evidence could not be obtained. Management-imposed limits escalate.
RELEVANCE: The material/pervasive split is the design decision your two-state exit code cannot express.
VERDICT: ADAPT

**6 · DO-178C forbids claiming coverage over code it could not exercise.**
SOURCE: LDRA "DO-178C & Structural Coverage Analysis" / https://ldra.com/ldra-blog/do-178c-structural-coverage-analysis/ · AdaCore booklet ch.4 / https://learn.adacore.com/booklets/adacore-technologies-for-airborne-software/chapters/analysis.html
Uncovered code requires case-by-case resolution: new tests, requirement change, dead-code removal, or documented deactivated-code justification. Unexplained non-coverage blocks the certification claim.
RELEVANCE: Precedent that unexamined items get individually dispositioned, never aggregated into a percentage.
VERDICT: CONTEXT-ONLY

**7 · GSN gives an unsupported claim its own symbol.**
SOURCE: GSN Community Standard / SCSC Assurance Case Working Group / https://scsc.uk/gsn?page=gsn+3nutshell · https://en.wikipedia.org/wiki/Goal_structuring_notation
A Goal or Strategy may be marked *undeveloped*: asserted, no evidence attached. The gap is drawn, not omitted.
RELEVANCE: Rule-level analog — a declared rule you could not evaluate should render as undeveloped, not absent.
VERDICT: ADAPT

**8 · No coverage-manifest spec, RFC, or schema exists.**
SOURCE: searched "coverage manifest", "scan scope manifest", assurance manifest schema/RFC. Returns were RPKI manifests (RFC 6486/9286) and Kubernetes manifest scanning. Unrelated.
RELEVANCE: Nothing to conform to. Semgrep's `scanned_and_skipped` is the only shipped schema found.
VERDICT: NEGATIVE

## Does it already exist?

**Partially.** Both halves ship separately today. Semgrep has the machine-readable coverage manifest. pip-audit has the refuse-clean exit. Neither has both, and nothing found makes coverage the *bound on the verdict* rather than a sidecar.

Exact gap left open: no tool takes a user-declared resource set, computes what it actually reached, and makes verdict validity a function of that delta by default. Semgrep's manifest is descriptive and verbose-gated. pip-audit's strictness has no manifest and no declared scope. The novelty is real but narrow — a composition plus a default-flip, not an invention.

## Softest claims

- **Finding 7 (GSN).** Search summary plus Wikipedia. I did not fetch the SCSC standard PDF. That "undeveloped" is a notation element is well attested; my reading of its semantics is secondhand. UNVERIFIED at source.
- **Finding 6 (DO-178C).** Vendor pages only (LDRA, AdaCore); RTCA DO-178C is paywalled. Tool vendors have an interest in describing coverage obligations expansively. UNVERIFIED at source.
- Finding 3 rests on search snippets from three independent OpenSCAP pages, not a direct fetch. Solid, not fetched.

## What the dispatching session got wrong or missed

1. **You read SARIF's silence as evidence about the field. It is evidence about SARIF.** Semgrep routes coverage through its *native* JSON schema, not SARIF, because SARIF cannot carry it. Tool authors hit that wall and walked around it. Operational consequence: if workspace_lint ever exports SARIF, the manifest is lost in the export. Decide that now, not at integration time.

2. **You specified coverage as a scan property. The stronger prior art treats it as an evidence-sufficiency property.** ISA 705's material/pervasive split and DO-178C's per-item resolution both reject your binary. A two-state exit cannot distinguish "94% seen, the missing 6% touches no declared rule" from "94% seen, and the gap sits exactly where the rules point." Those are different verdicts. Your current framing collapses them into one.

3. **Marking axe-core "known" cost you coverage.** XCCDF's nine-valued result set is a strict superset of axe-core's four and predates it. Excluding axe-core implied the outcome-taxonomy question was settled. It was not.

4. **The data-quality angle is NOT searched — do not record it as a negative.** Two searches on Great Expectations / Soda / dbt returned only comparison blogs, zero primary docs. I did not fetch their schemas. If it matters, dispatch one pass at the Great Expectations `ValidationResult` schema and dbt's `run_results.json` (which I believe carries a per-test `skipped` status — unverified, one fetch would settle it).

5. **You dispatched this at the wrong reference class.** Every strong result came from an assurance domain, not the static-analysis ecosystem. Searching linters harder will keep returning nothing. The instrument you are building is a compliance argument that happens to have a CLI.

Next action: decide the two-state vs three-state verdict question (finding 5) before the 72-hour API proof, because it determines what the proof has to measure.
