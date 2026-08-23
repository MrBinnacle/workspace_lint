/* The red test for T4 — reports, issue #45, spec §2 criterion 5 and 6.
 *
 *   npx tsx CHECK-report.ts
 *
 * No network, no .env, no token. The clock is injected and the Notion surface is
 * the shared fake in CHECK-fakes.ts.
 *
 * FOUR OF THESE TESTS ARE MUTATION CHECKS AND THEY ARE THE POINT OF THE FILE.
 * A control that passes with its mechanism bypassed tested nothing.
 *
 *   TEST 2  — build the JSON from the RAW verdict instead of the document; the
 *             disclaimed-withholding assertions must go red. This is #45's own
 *             stated hazard, executed rather than trusted.
 *   TEST 3  — feed two objects whose keys were INSERTED in different orders; the
 *             canonical bytes must be equal. Without a differing insertion order
 *             a sort test proves nothing, because one input order is already
 *             sorted by accident half the time.
 *   TEST 4  — include the volatile block; the two-run byte-identity assertion
 *             must go red.
 *   TEST 6  — render the raw url instead of the redacted one; the title-leak
 *             assertion must go red.
 *
 * REDACTION IS ASSERTED OVER EVERY LINE OF EVERY FORMAT, never over one
 * section. A redaction control with a hole in it is worse than no control: #42
 * printed a page title four lines under a report claiming titles were redacted,
 * and the reader cannot tell which claim is the true one.
 */

import { createHarness } from './CHECK-harness.js';
import { scan } from './scan.js';
import { buildReportDocument, renderJson, renderMarkdown, renderReport, SOURCE_NOT_APPLICABLE } from './report.js';
import { idForm } from './ref001.js';
import { classifyHref, extractReferences } from './references.js';
import { canonicalize, NORMALIZATION_VERSION, VOLATILE_FIELDS } from './normalize.js';
import { hyphenate } from './ids.js';
import {
  ROOT, PAGE_A, DATASET, UNQ_1, TITLED_URL, TITLE_IN_URL,
  cfg, cfgUnq, clock, fakePort, page, childPage, childDb, titleProp,
  THREE_CHILDREN, MIDSTREAM, DEAD_LINK, OBSERVED_LINK,
} from './CHECK-fakes.js';

const { check, head, finish } = createHarness();

/* The standard fixture, plus a url on the root carrying a title in its path. */
const TITLED: Record<string, typeof THREE_CHILDREN[string]> = {
  ...THREE_CHILDREN,
  [ROOT]: { ...THREE_CHILDREN[ROOT]!, url: TITLED_URL(ROOT) },
  [PAGE_A]: { ...THREE_CHILDREN[PAGE_A]!, url: TITLED_URL(PAGE_A) },
};

/* =========================================================================
 * TEST 1 — the document carries the normaliser, and names what it removed
 * ========================================================================= */

head('TEST 1 — ADR-0004: a named, versioned normaliser, and the excluded set is published');

const r1 = await scan({ config: cfg(), port: fakePort(TITLED), now: clock() });
const doc1 = buildReportDocument(r1, { deterministic: true });

check('the document names the normaliser version', doc1.normalization.version, NORMALIZATION_VERSION);
check('  and it is not the empty string', doc1.normalization.version.length > 0, true);
check('the excluded set is published, not left to be inferred from absence', doc1.normalization.excluded.length, VOLATILE_FIELDS.length);
check('  and every entry says WHY it is volatile, not just which field', doc1.normalization.excluded.every(e => e.includes(' — ')), true);
check('under --deterministic the volatile block is ABSENT, not emptied', doc1.volatile, undefined);

const doc1v = buildReportDocument(r1, {});
check('without the flag it is present', doc1v.volatile !== undefined, true);
check('  and carries the call log', (doc1v.volatile?.calls.length ?? 0) > 0, true);

/* =========================================================================
 * TEST 2 — the four suppressions survive serialisation
 * =========================================================================
 * #45: "A JSON exporter that serialises the raw `verdict` object rather than
 * the rendered decisions WILL reintroduce every one of them."
 */

head('TEST 2 — a disclaimed report publishes no summary verdict, in JSON as well as on screen');

const rMid = await scan({ config: cfg(), port: fakePort(MIDSTREAM), now: clock() });
const docMid = buildReportDocument(rMid, { deterministic: true });
const jsonMid = renderJson(docMid);

check('the run is disclaimed', rMid.verdict.disposition, 'disclaimed');
check('the headline is NOT published', docMid.headline.published, false);
check('  and the reason is machine-readable, not only prose', docMid.headline.published ? '' : docMid.headline.because, 'withheld-disclaimed');
check('the conformity ratio is NOT published', docMid.conformityRatio.published, false);

/* THE STRUCTURAL PART. `value` does not exist on the unpublished branch, so a
 * serialiser cannot emit a withheld figure even by accident. This asserts the
 * JSON bytes, because the type argument is invisible at runtime. */
check('the JSON carries no headline value', /"headline":\{"because"/.test(jsonMid), true);
check('  and no conformity value', /"conformityRatio":\{"because"/.test(jsonMid), true);
check('  the withheld marker is present and false', /"published":false/.test(jsonMid), true);

/* THE VECTOR STILL PRINTS — it is per-rule evidence, not a summary
 * (ADR-0005 decision 3). Withholding it too would be the opposite defect. */
check('the coverage VECTOR still publishes — evidence, not a summary', docMid.coverageVector.length > 0, true);
check('  and it reaches the JSON', /"coverageVector":\[\{/.test(jsonMid), true);

head('TEST 2b — MUTATION: serialise the raw verdict and the suppression vanishes');

/* This is the exporter #45 warns against, written out so the warning is
 * executed. `rMid.verdict` carries `disposition`, `coverage` and the scalars
 * with no notion of withholding. */
const naive = canonicalize({ disposition: rMid.verdict.disposition, coverage: rMid.verdict.coverage, applicable: rMid.verdict.applicable });
check('the naive exporter publishes a coverage figure over a disclaimed run', /"coverage":/.test(naive), true);
check('  which the document refuses to', docMid.headline.published, false);
check('  the two disagree, and that disagreement is the defect', /"coverage":/.test(naive) !== /"headline":\{"published":true/.test(jsonMid), true);

head('TEST 2c — a scan that did not run has no disposition');

const rAuth = await scan({ config: cfg(), port: fakePort(THREE_CHILDREN, true), now: clock() });
const docAuth = buildReportDocument(rAuth, { deterministic: true });
check('the byte is 4', rAuth.verdict.exit, 4);
check('deriveVerdict still returns a disposition', rAuth.verdict.disposition, 'unqualified');
check('  but the document does NOT publish it', docAuth.disposition.published, false);
check('  because the scan did not run', docAuth.disposition.published ? '' : docAuth.disposition.because, 'absent-did-not-run');
check('  and `unqualified` appears nowhere in the JSON', /unqualified/.test(renderJson(docAuth)), false);

head('TEST 2d — the byte basis travels with the byte (ADR-0012 decision 2)');

const jsonD = renderJson(doc1);
check('the exit byte is published', /"byte":3/.test(jsonD), true);
check('  and never without the figure it compared', /"basis":\{/.test(jsonD), true);
check('  which carries its own unit', /"unit":"resources"/.test(jsonD), true);
check('  and the funnel is labelled as NOT the comparison', /"funnelNotCompared"/.test(jsonD), true);

/* =========================================================================
 * TEST 3 — RFC 8785, and the one clause the platform does not supply
 * ========================================================================= */

head('TEST 3 — canonicalize() is JCS: key order does not depend on insertion order');

/* TWO INSERTION ORDERS. This is what makes the sort observable — a single
 * object cannot show that sorting happened, because half of all objects are
 * already in sorted order. */
const a = { zebra: 1, alpha: 2, Mango: 3, mango: 4 };
const b = { mango: 4, Mango: 3, alpha: 2, zebra: 1 };
check('two insertion orders, one canonical form', canonicalize(a), canonicalize(b));
check('  and the order is UTF-16 code unit, uppercase first', canonicalize(a), '{"Mango":3,"alpha":2,"mango":4,"zebra":1}');
check('  nested objects sort too', canonicalize({ b: { z: 1, a: 2 } }), '{"b":{"a":2,"z":1}}');
check('ARRAY order is preserved, never sorted — the producer owns it', canonicalize([3, 1, 2]), '[3,1,2]');

check('numbers use ECMAScript Number::toString, per JCS', canonicalize({ n: 1e21 }), '{"n":1e+21}');
check('  including the awkward ones', canonicalize(0.1 + 0.2), '0.30000000000000004');
check('undefined properties are dropped, matching JSON.stringify', canonicalize({ a: 1, b: undefined }), '{"a":1}');

head('TEST 3b — the clause JavaScript does NOT give free');

/* RFC 8785 makes a lone surrogate an error. JSON.stringify escapes it and
 * carries on, which silently changes the string. This is the only line of
 * canonicalize() that is not a citation to a platform behaviour. */
check('JSON.stringify would have emitted it', JSON.stringify('\ud800'), '"\\ud800"');
let threw = '';
try { canonicalize({ s: '\ud800' }); } catch (e) { threw = (e as Error).message; }
check('canonicalize throws instead', threw.includes('lone surrogate'), true);
check('  and names the path', threw.includes('$.s'), true);

let threwNaN = '';
try { canonicalize({ n: NaN }); } catch (e) { threwNaN = (e as Error).message; }
check('NaN throws rather than becoming null', threwNaN.includes('not representable'), true);

/* =========================================================================
 * TEST 4 — criterion 5: byte-identical across two runs
 * ========================================================================= */

head('TEST 4 — two runs over an unchanged workspace produce identical bytes');

/* DIFFERENT CLOCKS. Same workspace, different wall time — which is exactly the
 * difference Normalization exists to remove. */
const runA = await scan({ config: cfg(), port: fakePort(TITLED), now: clock() });
const runB = await scan({ config: cfg(), port: fakePort(TITLED), now: (() => { let t = 999_000; return () => (t += 313); })() });

check('the two runs really did differ in wall time', runA.wallMs !== runB.wallMs, true);

const jsonA = renderJson(buildReportDocument(runA, { deterministic: true }));
const jsonB = renderJson(buildReportDocument(runB, { deterministic: true }));
check('and their normalized JSON is byte-identical', jsonA, jsonB);
check('  which is a real document, not an empty one', jsonA.length > 500, true);

head('TEST 4b — MUTATION: keep the volatile block and byte-identity dies');

const volA = renderJson(buildReportDocument(runA, {}));
const volB = renderJson(buildReportDocument(runB, {}));
check('with volatile fields included the two runs DIFFER', volA === volB, false);
check('  and the difference is the wall clock', volA.includes(`"wallMs":${runA.wallMs}`), true);
console.log('  ^ this is why --deterministic exists. The default report is for a human');
console.log('    reading one run; the deterministic one is for diffing two.');

/* =========================================================================
 * TEST 5 — the vector, the headline and the unit reach both formats
 * ========================================================================= */

head('TEST 5 — no figure without its unit, and the headline is the MINIMUM');

const mdOut = renderMarkdown(doc1);
check('the Markdown publishes the vector as a table with a unit column', /\| Rule \| Evaluated \| Applicable \| Coverage \| Unit \|/.test(mdOut), true);
check('  SYS001 counts resources', /\| `SYS001` \| 3 \| 4 \| 75\.0% \| resources \|/.test(mdOut), true);
check('  and the headline names it as the MINIMUM', /\*\*Headline:\*\*.*the \*\*minimum\*\* of the vector/.test(mdOut), true);
check('the JSON vector rows each carry a unit', doc1.coverageVector.every(r => r.unit.length > 0), true);
check('  and the headline is the minimum row', doc1.headline.published ? doc1.headline.value.ratio : -1, Math.min(...doc1.coverageVector.map(r => r.ratio)));

/* ADR-0005 decision 4: never one ratio alone. */
check('the Markdown publishes the conformity ratio alongside coverage', /\*\*Conformity ratio:\*\*/.test(mdOut), true);
check('  and the funnel is labelled as NOT a rule figure', /this is the resource funnel and it is \*\*not\*\* a rule's coverage figure/i.test(mdOut), true);

/* =========================================================================
 * TEST 6 — redaction, over EVERY line of EVERY format
 * ========================================================================= */

head('TEST 6 — the page title never reaches any artifact, in any format');

/* The fixture's url is `https://www.notion.so/My-Private-Roadmap-<id>` — the
 * title is INSIDE THE PATH, which is how Notion serves it. */
check('the fixture really does carry a title in its url', TITLED_URL(ROOT).includes(TITLE_IN_URL), true);

const termOut = renderReport(r1, {}).join('\n');
check('the TERMINAL report leaks no title, on any line', termOut.includes(TITLE_IN_URL), false);
check('the MARKDOWN report leaks no title, on any line', mdOut.includes(TITLE_IN_URL), false);
check('the JSON report leaks no title, on any line', jsonD.includes(TITLE_IN_URL), false);
check('  and the volatile-included JSON does not either', volA.includes(TITLE_IN_URL), false);

/* THE LINK IS PRESENT, not merely absent. A redaction test that passes because
 * nothing was emitted is the substitutable control again.
 *
 * IT TAKES A DIFFERENT FIXTURE, and finding that out was the point. Only the
 * DECLARED ROOT is retrieved with GET /v1/pages — a child is staged from its
 * parent's block listing and never fetched — so the root is the only resource
 * that can carry a captured url. In the standard fixture the root is evaluated,
 * so it produces no SYS001 finding and there is nothing to hang a link on. This
 * fixture resolves the root (url captured) and then loses its child list, so the
 * root itself goes unevaluated and the finding is the root's. */
const rRootGap = await scan({
  config: cfg(),
  port: fakePort({ [ROOT]: { steps: [], url: TITLED_URL(ROOT) } }),
  now: clock(),
});
const docRootGap = buildReportDocument(rRootGap, { deterministic: true });
const rootFinding = docRootGap.findings.find(f => f.resource === hyphenate(ROOT));

check('a SYS001 finding is present on the declared root', rootFinding !== undefined, true);
check('the link IS captured now — it is not null-by-omission', rootFinding?.link !== null, true);
check('  and the captured form keeps the origin', (rootFinding?.link ?? '').startsWith('https://www.notion.so/'), true);
check('  with the title-bearing path replaced by the ID', (rootFinding?.link ?? '').includes('…'), true);
check('  and the title is gone from it', (rootFinding?.link ?? '').includes(TITLE_IN_URL), false);
check('the raw url reached the port and WAS title-bearing', TITLED_URL(ROOT).includes(TITLE_IN_URL), true);

const jsonRootGap = renderJson(docRootGap);
const mdRootGap = renderMarkdown(docRootGap);
check('no format leaks it — JSON', jsonRootGap.includes(TITLE_IN_URL), false);
check('no format leaks it — Markdown', mdRootGap.includes(TITLE_IN_URL), false);
check('no format leaks it — terminal', renderReport(rRootGap, {}).join('\n').includes(TITLE_IN_URL), false);

head('TEST 6b — MUTATION: emit the raw url and the leak assertion fires');

const leaked = canonicalize({ link: TITLED_URL(ROOT) });
check('the raw url DOES contain the title', leaked.includes(TITLE_IN_URL), true);
check('  so the assertions above are testing a real hazard, not an empty string', leaked.includes(TITLE_IN_URL) && !jsonD.includes(TITLE_IN_URL), true);

head('TEST 6c — a resource the scan never retrieved still says why its link is absent');

/* The data source stalls at `enumerated`; no page call was made for it, so
 * there is no url. "No link" and "we did not look" are different facts. */
const dsFinding = doc1.findings.find(f => f.resource === hyphenate(DATASET));
check('the data source produced a finding', dsFinding !== undefined, true);
check('  its link is null', dsFinding!.link, null);
/* The reason must describe THIS build, not the one before it. Until #45 the
 * string read "this slice does not read the object's url field", which the port
 * widening made false — a stale reason printed under a true value. */
check('  and the REASON travels with the null', (dsFinding?.linkAbsentReason ?? '').includes('GET /v1/pages runs for the declared root'), true);
check('  the reason does NOT still claim the slice never reads a url', (dsFinding?.linkAbsentReason ?? '').includes('does not read'), false);

/* =========================================================================
 * TEST 7 — no baseline state, in any format
 * ========================================================================= */

head('TEST 7 — this slice computes no baseline state and prints none');

check('the JSON has no baselineState field', /baselineState|"state":"new"/.test(jsonD), false);
check('the Markdown says so explicitly rather than staying silent', /this slice computes none \(spec §1\.2\)/.test(mdOut), true);
check('the terminal report says so too', /this slice computes none/.test(termOut), true);

/* =========================================================================
 * TEST 8 — both disclosures from spec §3 reach the Markdown
 * ========================================================================= */

head('TEST 8 — the blind-endpoint and positive-only disclosures survive the format change');

check('blind endpoint, named', /carries NO truncation signal/.test(mdOut), true);
check('  with the reason a reader can act on', /both return has_more: false/.test(mdOut), true);
check('positive-only truncation test', /tested positively only/.test(mdOut), true);
check('the residue path is named as the mechanism, not the host list', /NOT by an allow-list/.test(mdOut), true);
check('#51 is disclosed as open rather than left to look covered', /issue #51 and it is open/.test(mdOut), true);

/* =========================================================================
 * TEST 9 — the empty vector reaches the report as absent, not as zero
 * ========================================================================= */

head('TEST 9 — an empty applicable set publishes no coverage figure');

const rEmpty = await scan({
  config: cfg(),
  port: fakePort({ [ROOT]: { steps: [page([])], url: TITLED_URL(ROOT) } }),
  now: clock(),
});
const docEmpty = buildReportDocument(rEmpty, { deterministic: true });
check('the root alone was evaluated, so REF001 has no subject', docEmpty.coverageVector.some(r => r.rule === 'REF001'), false);
check('SYS001 still has one', docEmpty.coverageVector.some(r => r.rule === 'SYS001'), true);
check('  a rule with an empty applicable set LEAVES the vector, not scores zero', docEmpty.coverageVector.every(r => r.applicable > 0), true);
const mdEmpty = renderMarkdown(docEmpty);
check('  and the Markdown never prints a 0% row for it', /\| `REF001` \| 0 \| 0 \|/.test(mdEmpty), false);

/* =========================================================================
 * TEST 10 — the three renderings agree, because there is only one document
 * =========================================================================
 * This exists because the claim was briefly FALSE. The terminal renderer read
 * r.manifest, r.gaps and r.findings directly while Markdown and JSON read the
 * document, so the three could disagree about row order, about which name a gap
 * prints, and about which reason travels with a null link. Found by reviewing
 * the change against its own header, not by a failing check — so here is the
 * check.
 */

head('TEST 10 — terminal, Markdown and JSON render the same document');

const termAll = renderReport(r1, {}).join('\n');
const docAll = buildReportDocument(r1, {});

/* Manifest ROW ORDER is the property that silently drifted. The document sorts;
 * insertion order is call order, which is a fact about the traversal and the
 * network rather than about the workspace. */
const termManifestOrder = docAll.manifest.map(e => termAll.indexOf(e.resource));
check('the terminal prints manifest rows in the document\'s order', termManifestOrder.every((v, i, a) => v >= 0 && (i === 0 || v > a[i - 1]!)), true);

const mdAll = renderMarkdown(docAll);
const mdManifestOrder = docAll.manifest.map(e => mdAll.indexOf(e.resource));
check('  and so does the Markdown', mdManifestOrder.every((v, i, a) => v >= 0 && (i === 0 || v > a[i - 1]!)), true);

/* Every finding reaches every format, by resource. A format that silently drops
 * one is the coverage defect this product detects, in its own output. */
for (const f of docAll.findings) {
  check(`finding ${f.rule} reaches the terminal`, termAll.includes(f.resource), true);
  check(`  and the Markdown`, mdAll.includes(f.resource), true);
  check(`  and the JSON`, renderJson(docAll).includes(f.resource), true);
}

/* The link-absent REASON is one string, not one per renderer. */
const dsAll = docAll.findings.find(f => f.link === null);
if (dsAll) check('the terminal prints the document\'s own link-absent reason', termAll.includes(dsAll.linkAbsentReason ?? '#'), true);

/* ⚠ THE MANIFEST'S UNIT COLUMN IS MEASURED, NOT GUESSED — #59.
 *
 * It was `padEnd(20)`, which held only while every member of the CoverageUnit
 * union was shorter than 20 characters. `resource pairs in a uniqueness scope`
 * is 36, so UNQ001's rows padded to nothing and the loss text ran into the unit
 * with no separator. Observed in #59's live run, not by any assertion — which is
 * why this one exists.
 *
 * ASSERTED OVER THE LONGEST UNIT PRESENT, so a future unit longer still fails
 * here rather than in a report someone is reading. */
/* A run carrying BOTH the shortest unit and the longest one, with a loss on the
 * longest. `docAll` holds one unit, so the assertion below would have passed
 * vacuously over it — the empty-set hole, in the test written to close a
 * different hole. */
const rUnits = await scan({
  config: cfgUnq(ROOT, 'Title'),
  port: fakePort({
    [ROOT]: { steps: [page([childPage(UNQ_1, 'a child'), childDb(DATASET, 'wl-dataset')])], properties: { Title: titleProp('root title') } },
    [UNQ_1]: { steps: [page([])], properties: { Title: titleProp('alpha') } },
    [DATASET]: { steps: [page([])] },
  }),
  now: clock(),
});
const termUnits = renderReport(rUnits, {}).join('\n');
const docUnits = buildReportDocument(rUnits, {});
const unitsInDoc = [...new Set(docUnits.manifest.map(e => e.unit))];

check('the manifest carries more than one unit, so the column is exercised', unitsInDoc.length > 1, true);
check('  and one of them is the longest in the union', unitsInDoc.includes('resource pairs in a uniqueness scope'), true);
const lossy = docUnits.manifest.filter(e => e.loss);
check('  and at least one row has a loss to abut', lossy.length > 0, true);
for (const e of lossy) {
  const row = termUnits.split('\n').find(l => l.includes(e.resource) && l.includes(e.unit) && l.includes(e.loss!));
  check(`  a loss never abuts its unit — ${e.unit}`, row === undefined ? 'row not found' : row.includes(`${e.unit} `), true);
}

/* =========================================================================
 * TEST 11 — #100: the finding's SOURCE reaches all three formats
 * =========================================================================
 * A format that silently drops a field is this product's own defect class
 * appearing in its own output, which is why TEST 10 above asserts every finding
 * reaches every renderer. `source` is a new field and gets the same treatment
 * rather than being trusted to the two emitters that were edited to carry it.
 */

head('TEST 11 — the source reaches the terminal, the Markdown AND the JSON');

const rSrc = await scan({ config: cfg(ROOT, 1.0), port: fakePort(DEAD_LINK), now: clock() });
const docSrc = buildReportDocument(rSrc, { deterministic: true });
const srcFinding = docSrc.findings.find(f => f.source !== null);

check('the fixture produced a finding carrying a source', srcFinding !== undefined, true);
check('  and its page is a hyphenated ID', /^[0-9a-f-]{36}$/.test(srcFinding?.source?.page ?? ''), true);

const termSrc = renderReport(rSrc, {}).join('\n');
const mdSrc = renderMarkdown(docSrc);
const jsonSrc = renderJson(docSrc);

check('the TERMINAL carries the source page', termSrc.includes(srcFinding!.source!.page), true);
check('  and the source block', termSrc.includes(srcFinding!.source!.block), true);
check('the MARKDOWN carries the source page', mdSrc.includes(srcFinding!.source!.page), true);
check('  and labels it, rather than dropping it into the evidence line', /- Source: page/.test(mdSrc), true);
check('the JSON carries the source page', jsonSrc.includes(srcFinding!.source!.page), true);
check('  as STRUCTURE, not as a rendered sentence', jsonSrc.includes('"source":'), true);

/* The three must agree, which is the whole point of the single document. A
 * per-renderer lookup would let them diverge, and did in three sections before
 * TEST 10 existed. */
check('all three name the same page', [termSrc, mdSrc, jsonSrc].every(x => x.includes(srcFinding!.source!.page)), true);

head('TEST 11b — a null source is PRINTED with its reason, in every format');

/* SYS001's subject is the resource; there is no containing page. The reason
 * travels with the null exactly as the link-absent reason does — "no source"
 * and "this rule has no source to give" are different facts, and a blank cell
 * collapses them into one. */
const nullSrc = doc1.findings.find(f => f.source === null);
check('the standard fixture produced a finding with no source', nullSrc !== undefined, true);

const term1 = renderReport(r1, {}).join('\n');
const md1 = renderMarkdown(doc1);

/* ⛔ THE EMPTY-STRING GUARD COMES FIRST, and it is not ceremony. `x.includes('')`
 * is TRUE for every x, so blanking SOURCE_NOT_APPLICABLE would satisfy both
 * assertions below while the report printed `source: ` and nothing else. That
 * mutation was run against this file and stayed green here — it was caught by a
 * LITERAL regex in CHECK-ref001 TEST 10e, not by anything in this section. A
 * control whose subject can go empty is the substitutable control again, in the
 * test written to prove a field is rendered. */
check('the reason string is non-empty, so the two assertions below cannot pass vacuously', SOURCE_NOT_APPLICABLE.length > 0, true);
check('the TERMINAL states the reason', term1.includes(SOURCE_NOT_APPLICABLE), true);
check('the MARKDOWN states the reason', md1.includes(SOURCE_NOT_APPLICABLE), true);
/* Independent of the constant, so a future edit to it cannot take these with it. */
check('  and the terminal line is recognisable without reading the constant', /source: none — /.test(term1), true);
check('  as is the Markdown line', /- Source: _none — /.test(md1), true);
/* ⛔ ANCHORED TO A LINE THAT IS *ONLY* THE LABEL, which is what an empty cell
 * actually looks like. Unanchored, `/source: *$/m` matched ANY line ending in
 * the word "source" followed by a colon — and #158 item 6 added one four
 * sections away, a DISCLOSURES heading reading "…per reached data source:",
 * which turned this control red over a section that contains no findings at all.
 * A whole-document regex asserting a per-row property is the defect
 * `document-scoped-regex-defeats-a-per-row-claim` records; this is the same
 * family arriving from the other direction — not a lookahead that spans too far,
 * but a subject that was never scoped to the rows in the first place.
 *
 * ⚠ THE MUTATION IT WAS WRITTEN FOR IS STILL CAUGHT. Blanking
 * SOURCE_NOT_APPLICABLE makes `report.ts` emit `      source: ` with nothing
 * after it, and the anchored form matches that exactly. Verified by mutation
 * rather than by reading. */
check('  and neither prints an empty cell instead', /^\s*source: *$/m.test(term1) || /^\s*- Source: *$/m.test(md1), false);
/* JSON carries the null itself — a serialised `null` is unambiguous where a
 * blank string would not be, so the reason belongs to the two rendered formats
 * and the structure belongs to JSON. */
check('the JSON carries an explicit null, not an omitted key', renderJson(doc1).includes('"source":null'), true);

head('TEST 11c — the UNRECORDED-ORIGIN fallback survives to the report');

/* `references.ts` writes `'(unrecorded page)'` when a discovery route carries
 * no origin, and `'(unknown block)'` for a block with no id. They exist so an
 * absent origin is VISIBLY absent. A renderer that blanked them would make a
 * missing origin indistinguishable from a page that has no name, and a
 * normaliser that hyphenated them would mangle them.
 *
 * ⛔ THERE ARE TWO FALLBACK SITES AND THEY WRITE DIFFERENT STRINGS. Both are
 * real, and finding only one of them produced a false correction on the ticket.
 *
 *   references.ts:240  '(unknown block)'     — the API returned a block with no id
 *   scan.ts:1211       '(unrecorded block)'  — the manifest entry carries no ref facts at all
 *
 * They name DIFFERENT conditions, so two strings is right and two SYNONYMS is
 * not: nothing in either phrase tells a reader which one they are looking at,
 * and "unknown" and "unrecorded" read as the same word. Each now names its own
 * cause. Asserted here rather than described, because the reason a brief could
 * cite one and a grep find the other is that no test held either. */
const orphan = classifyHref(OBSERVED_LINK, 'block-9');
check('classifyHref called without an origin uses the fallback', orphan.sourcePage, '(unrecorded page)');
check('  and the fallback is not an ID, so hyphenate() must leave it alone', hyphenate(orphan.sourcePage), null);
check('  which is exactly what the rule\'s idForm does — it passes through', idForm(orphan.sourcePage), '(unrecorded page)');

const noId = extractReferences([{ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: 'x' }, href: OBSERVED_LINK }] } }], 'page-1')[0];
check('a block returned with no id names THAT condition', noId?.sourceBlock, '(block returned with no id)');
check('  and it is not an ID either, so it survives idForm untouched', idForm(noId!.sourceBlock), '(block returned with no id)');

/* THE TWO FALLBACKS MUST NOT BE SYNONYMS. This is the assertion that would have
 * stopped a brief citing one string and a grep finding the other. */
check('the two fallback conditions render differently', noId!.sourceBlock === '(no origin recorded for this reference)', false);
check('  and neither is a bare blank', [orphan.sourcePage, noId!.sourceBlock].every(s => s.trim().length > 2), true);

finish('One document, three renderings. The suppressions are computed once and the type system will not let a renderer forget one.');
