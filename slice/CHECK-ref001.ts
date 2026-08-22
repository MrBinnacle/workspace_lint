/* The red test for T3 — REF001, issue #44, spec docs/spec/REF001-link-recognition.md §6.
 *
 *   npx tsx CHECK-ref001.ts
 *
 * No network, no .env, no token. The clock is injected and the Notion surface is
 * the shared fake in CHECK-fakes.ts.
 *
 * The spec names four tests and this file carries all four, plus the mutation
 * checks the slice spec §4.1 makes mandatory. Spec §6 states the standard the
 * first implementation of this rule failed: "a control that can substitute for
 * the mechanism under test is not a control." The synthetic probe injected the
 * known-bad target ID directly and passed whether or not DISCOVERY worked.
 * Nothing below injects a target ID. Every assertion about a target reads an ID
 * the recogniser found in block content.
 */

import { createHarness, reportSection, requiredSection } from './CHECK-harness.js';
import { scan } from './scan.js';
import { buildReportDocument, renderJson, renderMarkdown, renderReport, SOURCE_NOT_APPLICABLE } from './report.js';
import { ANCHOR_TEXT_ABSENT, ANCHOR_TEXT_REDACTED } from './finding.js';
import { hyphenate } from './ids.js';
import { headlineCoverage } from './finding.js';
import { REF001, REF001_ID, refKey } from './ref001.js';
import { SYS001 } from './sys001.js';
import type { Rule } from './rule.js';
import {
  KNOWN_INTERNAL_HOSTS,
  classifyHref,
  extractReferences,
  notionShapedId,
  redactHref,
  type HostEntry,
} from './references.js';
import {
  ROOT, LINK_TARGET, LINK_TARGET_ID,
  cfg, clock, fakePort,
  DEAD_LINK, LIVE_LINK, UNRECOGNISED_LINK, TITLED_UNRECOGNISED_LINK, DEAD_LINK_PLUS_EXTERNAL,
  NESTED_LINK, NESTED_UNREADABLE, DB_MENTION, PAGE_MENTION_DEAD, EXTERNAL_ON_TWO_PAGES,
  ANCHOR_PHRASE, ANCHORED_DEAD_LINK, LINK_TO_PAGE_DEAD,
} from './CHECK-fakes.js';

const { check, head, finish } = createHarness();

/* The observed href, transcribed from docs/proof/results-ref001-live.md §2. It
 * is the fixture root's own link to wl-outside-grant. */
const OBSERVED_HREF = 'https://app.notion.com/p/3bf1351d6af481108dc5dcc8bffb9742';
const OUTSIDE_GRANT = '3bf1351d-6af4-8110-8dc5-dcc8bffb9742';

/* =========================================================================
 * TEST 1 — the recogniser has THREE outcomes and the third one is reachable
 * ========================================================================= */

head('TEST 1 — internal, external, unrecognised: the residue is reachable by construction');

const internal = classifyHref(OBSERVED_HREF, 'block-1');
check('the observed host classifies internal', internal.kind, 'internal');
check('  and it carries the target ID from the URL path', internal.kind === 'internal' ? internal.targetId : '', OUTSIDE_GRANT);

const site = classifyHref('https://acme.notion.site/3bf1351d6af481108dc5dcc8bffb9742', 'block-1');
check('the documented notion.site host classifies internal', site.kind, 'internal');

const plain = classifyHref('https://example.com/blog', 'block-1');
check('a plain external URL classifies external', plain.kind, 'external');

/* Step 5 of spec §4, and it is the whole design. A Notion-shaped ID on a host
 * the tool does not know cannot reach `external` and vanish. */
const custom = classifyHref('https://docs.acme.example/3bf1351d6af481108dc5dcc8bffb9742', 'block-1');
check('a Notion-shaped ID on an unknown host is UNRECOGNISED, never external', custom.kind, 'unrecognised');
check('  and its cause is specific, never generic', custom.kind === 'unrecognised' ? custom.cause : '', 'link-host-unrecognised');

const broken = classifyHref('/3bf1351d6af481108dc5dcc8bffb9742', 'block-1');
check('an unparseable href carrying an ID is UNRECOGNISED', broken.kind, 'unrecognised');
check('  with the other of the two defined causes', broken.kind === 'unrecognised' ? broken.cause : '', 'href-unparseable');

/* Spec §2.1 as amended for #111: `www.notion.so` is OBSERVED — three locators in
 * one run, results-first-real-workspace.md §4 — and `notion.so` is DOCUMENTED,
 * docs/vendor/link-domains.md (vendor changelog, 2026-07-15). `notion.com` still
 * has no locator at any tier and must NOT be in the allow-list; it travels the
 * residue path, which costs precision and not soundness. Adding it on the
 * strength of its siblings would be the inference ADR-0001 decision 4 rejects. */
{
  const r = classifyHref('https://notion.com/Some-Page-3bf1351d6af481108dc5dcc8bffb9742', 'block-1');
  check('notion.com is NOT CHECKED, so it travels the residue path', r.kind, 'unrecognised');
}
for (const host of ['www.notion.so', 'notion.so']) {
  const r = classifyHref(`https://${host}/Some-Page-3bf1351d6af481108dc5dcc8bffb9742`, 'block-1');
  check(`${host} has a locator and resolves as an internal reference`, r.kind, 'internal');
}

check('the allow-list holds exactly the four hosts that have a locator', KNOWN_INTERNAL_HOSTS.length, 4);
check('  app.notion.com is marked observed',
  KNOWN_INTERNAL_HOSTS.find(h => h.host === 'app.notion.com')?.evidence ?? 'missing', 'observed');
check('  *.notion.site is marked documented, not observed',
  KNOWN_INTERNAL_HOSTS.find(h => h.host === '*.notion.site')?.evidence ?? 'missing', 'documented');
check('  www.notion.so is marked observed — results-first-real-workspace.md §4',
  KNOWN_INTERNAL_HOSTS.find(h => h.host === 'www.notion.so')?.evidence ?? 'missing', 'observed');
check('  notion.so is marked documented, not observed — the changelog is the locator',
  KNOWN_INTERNAL_HOSTS.find(h => h.host === 'notion.so')?.evidence ?? 'missing', 'documented');

/* =========================================================================
 * TEST 1b — MUTATION CHECK: the host entry is load-bearing, not asserted
 * ========================================================================= */

head('TEST 1b — MUTATION CHECK: remove app.notion.com and the observed href must stop resolving');

const withoutObserved: HostEntry[] = KNOWN_INTERNAL_HOSTS.filter(h => h.host !== 'app.notion.com');
const mutated = classifyHref(OBSERVED_HREF, 'block-1', withoutObserved);
check('with the entry removed the same href is no longer internal', mutated.kind, 'unrecognised');
check('  it does not vanish into external — that is the false green', mutated.kind === 'external', false);
check('the mutation moved the outcome', internal.kind !== mutated.kind, true);

/* #111: the same load-bearing proof for BOTH hosts that ticket added. The first
 * check of each pair guards the substitution itself — a filter that matched
 * nothing leaves the list whole and the rest of the block green while testing
 * nothing. */
const WWW_HREF = 'https://www.notion.so/Some-Page-3bf1351d6af481108dc5dcc8bffb9742';
const SO_HREF = 'https://notion.so/Some-Page-3bf1351d6af481108dc5dcc8bffb9742';
const withoutWww: HostEntry[] = KNOWN_INTERNAL_HOSTS.filter(h => h.host !== 'www.notion.so');
check('the #111 mutation actually substituted — exactly one entry left the list',
  withoutWww.length, KNOWN_INTERNAL_HOSTS.length - 1);
const wwwMutated = classifyHref(WWW_HREF, 'block-1', withoutWww);
check('with www.notion.so removed its href degrades to the residue path', wwwMutated.kind, 'unrecognised');
check('  not to external — that is the false green', wwwMutated.kind === 'external', false);
const withoutSo: HostEntry[] = KNOWN_INTERNAL_HOSTS.filter(h => h.host !== 'notion.so');
check('the notion.so mutation actually substituted too', withoutSo.length, KNOWN_INTERNAL_HOSTS.length - 1);
check('with notion.so removed its href degrades to the residue path',
  classifyHref(SO_HREF, 'block-1', withoutSo).kind, 'unrecognised');
/* The vouching question, tested rather than narrated: each new entry ALONE must
 * not recognise the other's href, because the patterns are exact. */
const onlySo = KNOWN_INTERNAL_HOSTS.filter(h => h.host === 'notion.so');
const onlyWww = KNOWN_INTERNAL_HOSTS.filter(h => h.host === 'www.notion.so');
check('notion.so alone does NOT vouch for the www form', classifyHref(WWW_HREF, 'block-1', onlySo).kind, 'unrecognised');
check('www.notion.so alone does NOT vouch for the bare form', classifyHref(SO_HREF, 'block-1', onlyWww).kind, 'unrecognised');

/* Spec §6 test 1c: the regex the first implementation actually shipped. */
const SHIPPED_REGEX_HOSTS: HostEntry[] = [{ host: 'notion.(so|site)', pattern: /notion\.(so|site)/, evidence: 'observed' }];
const asShipped = classifyHref(OBSERVED_HREF, 'block-1', SHIPPED_REGEX_HOSTS);
check('the regex that shipped first matches NONE of the observed hosts', asShipped.kind, 'unrecognised');
console.log('  ^ under this spec the same defect degrades to a REPORTED GAP instead of a clean verdict.');

/* =========================================================================
 * TEST 1c — the ID shape, and where it is looked for
 * ========================================================================= */

head('TEST 1c — a Notion-shaped ID is 32 hex, matched anywhere in the URL');

check('a bare 32-hex run is found', notionShapedId('x/3bf1351d6af481108dc5dcc8bffb9742?v=1'), OUTSIDE_GRANT);
check('  and so is a hyphenated one', notionShapedId(`x/${OUTSIDE_GRANT}`), OUTSIDE_GRANT);
check('  both normalize to ONE string — two forms of one ID would make two buckets',
  notionShapedId('3bf1351d6af481108dc5dcc8bffb9742'), notionShapedId(OUTSIDE_GRANT));
check('a URL with no ID yields null, never a guess', notionShapedId('https://example.com/blog'), null);
check('  and a short hex run is not an ID', notionShapedId('https://example.com/deadbeef'), null);

/* =========================================================================
 * TEST 1d — an href is never rendered verbatim by default
 * ========================================================================= */

head('TEST 1d — the href path may carry a page title, so the path is redacted by default');

const uiStyle = 'https://www.notion.so/My-Private-Roadmap-3bf1351d6af481108dc5dcc8bffb9742';
const safe = redactHref(uiStyle);
check('the redacted form keeps the host — the operator needs it to act', safe.includes('www.notion.so'), true);
check('  and keeps the Notion-shaped ID', safe.includes(OUTSIDE_GRANT), true);
check('  and drops the title segment', /My-Private-Roadmap/.test(safe), false);
check('an unparseable href is redacted to its ID alone', /roadmap/i.test(redactHref('My-Private-Roadmap-3bf1351d6af481108dc5dcc8bffb9742')), false);
check('an external href with no ID keeps its host and drops its path',
  redactHref('https://example.com/secret-plan').includes('secret-plan'), false);

/* =========================================================================
 * TEST 1e — discovery: both routes, and a mention is not counted twice
 * ========================================================================= */

head('TEST 1e — Route A is structural and host-free; Route B parses hosts; the two dedupe on the target');

const MENTION_ID = '4ca2462e-7bf5-9221-9ed6-edd9c00ca853';
const blocks = [
  {
    id: 'block-1', type: 'paragraph',
    paragraph: { rich_text: [{ type: 'text', text: { content: 'wl-outside-grant' }, href: OBSERVED_HREF }] },
  },
  {
    id: 'block-2', type: 'paragraph',
    /* The API reference defines href as "The URL of any link OR NOTION MENTION in
     * this text", so a mention arrives on both routes. Deduplicating on the
     * detection route counts it twice — the double-count in
     * results-ref001-live.md §5. */
    paragraph: {
      rich_text: [{
        type: 'mention',
        mention: { type: 'page', page: { id: MENTION_ID } },
        href: `https://app.notion.com/p/${MENTION_ID.replace(/-/g, '')}`,
      }],
    },
  },
  { id: 'block-3', type: 'link_to_page', link_to_page: { type: 'page_id', page_id: MENTION_ID } },
  {
    id: 'block-4', type: 'paragraph',
    paragraph: { rich_text: [{ type: 'text', text: { content: 'blog', link: { url: 'https://example.com/blog' } } }] },
  },
];

const refs = extractReferences(blocks, 'page-1');
const internals = refs.filter(r => r.kind === 'internal');
check('two distinct internal targets are discovered, not four', internals.length, 2);
check('  the mention target appears exactly once across both routes',
  internals.filter(r => r.kind === 'internal' && r.targetId === MENTION_ID).length, 1);
check('  the href target is the one the block content carried', internals.some(r => r.kind === 'internal' && r.targetId === OUTSIDE_GRANT), true);
check('the external link is discovered and classified external', refs.filter(r => r.kind === 'external').length, 1);
check('every reference names the page that contained it', refs.every(r => r.sourcePage === 'page-1'), true);
check('  and the block it came from', refs.every(r => r.sourceBlock.startsWith('block-')), true);

/* =========================================================================
 * TEST 2 — acceptance criterion 4, closed on DISCOVERY and not on injection
 * ========================================================================= */

head('TEST 2 — a link whose target the connection cannot read: confirmed, about an unreachable target');

const rDead = await scan({ config: cfg(ROOT, 1.0), port: fakePort(DEAD_LINK), now: clock() });

/* The scan was given ONE ID — the declared root. Everything below is about a
 * page whose ID reached the rule only by being read out of block content. That
 * is the property spec §6 requires and the property the previous red test could
 * not have: its synthetic probe injected the known-bad ID directly. */
check('the config named exactly one resource, the declared root', cfg(ROOT, 1.0).roots.length, 1);
check('  and the link target is not that root', LINK_TARGET_ID === hyphenate(ROOT), false);

const dead = rDead.findings.find(f => f.rule === REF001_ID)!;
check('REF001 produced a finding', dead !== undefined, true);
check('  anchored on the target ID DISCOVERED in block content', dead.anchor.resource, LINK_TARGET_ID);
check('  certainty is CONFIRMED — "this link cannot be resolved" is a proved fact', dead.certainty, 'confirmed');
check('  target state is UNREACHABLE — a 404 cannot tell absent from inaccessible', dead.targetState, 'unreachable');
console.log('  ^ two axes, two different answers. Collapsing them makes this finding inexpressible.');
check('  the gap is bounded — the reference is named', dead.bounded, true);
check('  it is not a declared-root miss', dead.isRootMiss, false);
check('  and the finding names its evidence', `${dead.evidence.object}|${dead.evidence.expected}`, `${LINK_TARGET_ID}|a resolvable internal target`);

/* The one rule in this slice that can name a link, because it discovered one. */
check('the finding carries a link, redacted', dead.link !== null, true);
check('  and the link is the observed href, not one constructed from the ID', dead.link!.includes('app.notion.com'), true);

check('every resource still reached evaluated — the funnel is clean', rDead.verdict.evaluated, rDead.verdict.applicable);
check('  so this run has NO coverage gap', rDead.gaps.length, 0);
check('  the disposition is qualified by the violation, not by a gap', rDead.verdict.disposition, 'qualified');
check('  and the byte is 1 — a new unsuppressed finding', rDead.verdict.exit, 1);

head('TEST 2b — a link whose target IS readable produces no finding');

const rLive = await scan({ config: cfg(ROOT, 1.0), port: fakePort(LIVE_LINK), now: clock() });
check('REF001 judged the reference', rLive.coverage.find(c => c.rule === REF001_ID)!.evaluated, 1);
check('  and found nothing wrong', rLive.findings.filter(f => f.rule === REF001_ID).length, 0);
check('  conformity is conforms', rLive.outcomes[REF001_ID]!.conformity, 'conforms');
check('  evidence is sufficient', rLive.outcomes[REF001_ID]!.evidence, 'sufficient');
check('  and the run exits 0', rLive.verdict.exit, 0);

head('TEST 2c — a 429 on the target is a DROP-OUT, never a dead link');

const rBusy = await scan({
  config: cfg(ROOT, 1.0),
  port: fakePort({ ...DEAD_LINK, [LINK_TARGET]: { pageFail: { status: 429, code: 'rate_limited' } } }),
  now: clock(),
});
check('no REF001 finding is produced', rBusy.findings.filter(f => f.rule === REF001_ID).length, 0);
check('  the reference is a gap instead', rBusy.gaps.some(g => g.resource === refKey(LINK_TARGET_ID)), true);
check('  evidence is unreached — widen access or raise the budget', rBusy.outcomes[REF001_ID]!.evidence, 'unreached');
check('  REF001 judged nothing, so its conformity is ABSENT', rBusy.outcomes[REF001_ID]!.conformity, null);
console.log('  ^ a dead link claimed out of a rate limit is a defect the scan invented.');

/* =========================================================================
 * TEST 3 — spec §6 test 2: the residue is reachable, and it stays in the denominator
 * ========================================================================= */

head('TEST 3 — an unrecognised candidate: one named drop-out, ZERO findings, undecidable');

const rResidue = await scan({ config: cfg(ROOT, 1.0), port: fakePort(UNRECOGNISED_LINK), now: clock() });
const residueRow = rResidue.coverage.find(c => c.rule === REF001_ID)!;

check('the candidate is in the applicable set', residueRow.applicable, 1);
check('  and it is NOT in the evaluated set', residueRow.evaluated, 0);
check('  so REF001 coverage is 0/1 internal references', `${residueRow.evaluated}/${residueRow.applicable}`, '0/1');
check('  the unit travels with the figure', residueRow.unit, 'internal references');

check('exactly one gap, and it is the candidate', rResidue.gaps.length, 1);
check('  its cause is machine-readable and specific', rResidue.gaps[0]!.cause.startsWith('link-host-unrecognised'), true);
check('  no generic cause reaches it', /^(error|skipped|unknown)$/i.test(rResidue.gaps[0]!.cause), false);
check('  the gap is bounded — the candidate is named and counted', rResidue.gaps[0]!.bounded, true);

/* Spec §7, non-negotiable: no finding, no certainty, no target state. `Finding`
 * requires both axes, so emitting one would assert two things the scan did not
 * establish. */
check('ZERO findings — the candidate asserts nothing about a target', rResidue.findings.length, 0);
check('  SYS001 does not render it either: it is not SYS001\'s coverage item',
  rResidue.findings.filter(f => f.rule === 'SYS001').length, 0);
check('  and it is NOT reported as the manifest and the gap set disagreeing',
  /the two disagree/.test(renderReport(rResidue, {}).join('\n')), false);

check('REF001 reports undecidable for the run', rResidue.outcomes[REF001_ID]!.evidence, 'undecidable');
check('  and its conformity is ABSENT — nothing was judged', rResidue.outcomes[REF001_ID]!.conformity, null);
check('the report is still qualified, not disclaimed', rResidue.verdict.disposition, 'qualified');

/* =========================================================================
 * TEST 4 — spec §6 test 3: the residue reaches the exit byte. #49 CLOSED.
 * ========================================================================= */

head('TEST 4 — the residue reaches the exit byte (spec §6 test 3)');

/* THE TRIPWIRE FIRED AND THIS IS WHAT IT LOOKS LIKE AFTERWARDS. Read the reason
 * it was ever 0 before trusting the 3.
 *
 * Until ADR-0012, deriveVerdict compared the FUNNEL scalar — evaluated resources
 * over applicable resources — against the declared threshold, while ADR-0011
 * decision 5 requires a floor on EVERY rule, i.e. on the MINIMUM of the coverage
 * vector. Those were one number while SYS001 was the only rule. On this run they
 * are not: the funnel reads 2/2 resources and REF001 reads 0/1 references, so a
 * rule sitting at zero was masked by a rule sitting at one, and this check
 * asserted `exit === 0` on purpose — the false green, written down rather than
 * hidden, with the report disclosing it on every run.
 *
 * ADR-0012 decision 2 made the byte compare the vector minimum. The disclosure
 * is gone from report.ts because the divergence it disclosed is now
 * unrepresentable, and this check asserts the byte the spec always required.
 *
 * THE MUTATION THAT KEEPS THIS HONEST is in CHECK-verdict.ts TEST 2: feeding
 * deriveVerdict the funnel figure in place of the vector drops the byte from 3
 * to 1. If that check ever goes green at 3, the byte has stopped depending on
 * the vector and the assertion below is passing for the wrong reason. */
check('the funnel figure clears the declared threshold on its own', rResidue.byteBasis.funnel >= 1.0, true);
check('  while the figure the byte COMPARED does not', rResidue.byteBasis.compared!.ratio, 0);
check('  and it is REF001 that set it', rResidue.byteBasis.compared!.rule, REF001_ID);
check('  carrying its own unit, so it cannot be read as resources', rResidue.byteBasis.compared!.unit, 'internal references');
check('the byte basis is the verdict\'s own figure, not a second derivation',
  rResidue.byteBasis.compared, rResidue.verdict.coverageMinimum);

const residueReport = renderReport(rResidue, {}).join('\n');
check('  the report prints what the byte compared', /byte basis:.*internal references/.test(residueReport), true);
check('  naming the funnel beside it as NOT compared', /funnel, not compared/.test(residueReport), true);
check('  and the divergence warning is GONE, because it cannot occur',
  /THE EXIT BYTE IS NOT THE ONE ADR-0011 DECISION 5 REQUIRES/.test(residueReport), false);

check('spec §6 test 3 — the residue forces exit 3', rResidue.verdict.exit, 3);
console.log('  ^ this assertion read 0 until ADR-0012, and the 0 was asserted deliberately.');
console.log('    A run holding an unresolvable reference now exits 3 because the coverage');
console.log('    floor is applied to the weakest rule instead of to the funnel.');

/* =========================================================================
 * TEST 5 — spec §6 test 4: an external link enters no denominator
 * ========================================================================= */

head('TEST 5 — external links do not enter the denominator, or step 5 qualifies every scan forever');

const rBoth = await scan({ config: cfg(ROOT, 1.0), port: fakePort(DEAD_LINK_PLUS_EXTERNAL), now: clock() });
const bothRow = rBoth.coverage.find(c => c.rule === REF001_ID)!;
const deadRow = rDead.coverage.find(c => c.rule === REF001_ID)!;

check('the external link WAS discovered and classified', rBoth.externalReferences, 1);
check('  and it changed neither side of the ratio', `${bothRow.evaluated}/${bothRow.applicable}`, `${deadRow.evaluated}/${deadRow.applicable}`);
check('  nor the ratio itself', bothRow.ratio, deadRow.ratio);
check('  nor the finding count', rBoth.findings.length, rDead.findings.length);
check('the report says how many were excluded, and why', /external reference\(s\) were discovered and excluded/.test(renderReport(rBoth, {}).join('\n')), true);

/* =========================================================================
 * TEST 6 — MUTATION CHECK: stage 5 is an INTERSECTION over applicable rules
 * ========================================================================= */

head('TEST 6 — MUTATION CHECK: add a second rule over resources that judges nothing');

/* #43's handoff calls this the single most dangerous line in the slice. Stage 5
 * is "every applicable rule reached a judgement" (ADR-0005 decision 5). A union
 * marks a coverage item evaluated because ONE rule judged it, and inflates every
 * figure computed downstream — the flattering direction. */
const judgesNothing: Rule = { ...SYS001, id: 'SYS999', judge: () => new Set<string>() };
const rUnion = await scan({ config: cfg(ROOT, 1.0), port: fakePort(DEAD_LINK), now: clock(), rules: [SYS001, judgesNothing, REF001] });

check('with SYS001 alone every resource was evaluated', rDead.verdict.evaluated, 2);
check('  a second resources-rule that judges nothing takes the funnel to ZERO', rUnion.verdict.evaluated, 0);
check('  the mutation moved the figure', rDead.verdict.evaluated !== rUnion.verdict.evaluated, true);
check('  and REF001 is UNAFFECTED — it counts a different coverage item',
  rUnion.coverage.find(c => c.rule === REF001_ID)!.evaluated, 1);
console.log('  ^ a union here would have left the funnel at 2/2 and reported full coverage over');
console.log('    resources a rule had just declined to judge.');

/* =========================================================================
 * TEST 7 — MUTATION CHECK: the host entry is load-bearing END TO END
 * ========================================================================= */

head('TEST 7 — MUTATION CHECK: remove app.notion.com and the whole scan must change verdict');

const restore = [...KNOWN_INTERNAL_HOSTS];
KNOWN_INTERNAL_HOSTS.splice(0, KNOWN_INTERNAL_HOSTS.length, ...restore.filter(h => h.host !== 'app.notion.com'));
const rBlind = await scan({ config: cfg(ROOT, 1.0), port: fakePort(DEAD_LINK), now: clock() });
KNOWN_INTERNAL_HOSTS.splice(0, KNOWN_INTERNAL_HOSTS.length, ...restore);

check('the dead-link finding is gone', rBlind.findings.filter(f => f.rule === REF001_ID).length, 0);
check('  but the link did NOT vanish — that is the false green', rBlind.coverage.find(c => c.rule === REF001_ID)!.applicable, 1);
check('  it degraded to a reported gap with a named cause', rBlind.gaps[0]!.cause.startsWith('link-host-unrecognised'), true);
check('  and REF001 went from conforms-or-violates to undecidable', rBlind.outcomes[REF001_ID]!.evidence, 'undecidable');
check('the host list restored to its four entries', KNOWN_INTERNAL_HOSTS.length, 4);
console.log('  ^ results-ref001-live.md §2: the regex that shipped first matched none of the');
console.log('    observed hosts. The run discovered zero links, raised no error, and would have');
console.log('    reported a clean verdict over a root containing a dead link.');

/* =========================================================================
 * TEST 8 — no page title reaches stdout, on ANY line, and every figure names its unit
 * ========================================================================= */

head('TEST 8 — a Notion link path carries the page title, and the default report never prints one');

const rTitled = await scan({ config: cfg(ROOT, 1.0), port: fakePort(TITLED_UNRECOGNISED_LINK), now: clock() });
const redacted = renderReport(rTitled, {}).join('\n');
const shown = renderReport(rTitled, { showTitles: true }).join('\n');

/* ASSERTED OVER EVERY RENDERED LINE, NEVER OVER ONE SECTION. #42 shipped a
 * redaction hole that was green in the section it was asserted over and broken
 * four sections later, under a report claiming titles were redacted. */
check('the title appears on NO rendered line by default', /My-Private-Roadmap/.test(redacted), false);
/* requiredSection, NOT reportSection. reportSection returns '' for a heading it
 * cannot find, and '' satisfies every negative assertion — so renaming a heading
 * in report.ts would turn these three green while testing nothing. That is the
 * substitutable control this file's own header rails against, sitting inside the
 * control itself. */
check('  not in the manifest table', /My-Private-Roadmap/.test(requiredSection(redacted, 'COVERAGE MANIFEST')), false);
check('  not in the gaps section', /My-Private-Roadmap/.test(requiredSection(redacted, 'GAPS')), false);
check('  and not in the call log', /My-Private-Roadmap/.test(requiredSection(redacted, 'CALLS MADE (read-only)')), false);
check('the redacted form still names the host and the ID, which is what the operator acts on',
  reportSection(redacted, 'GAPS').includes('notion.com') && reportSection(redacted, 'GAPS').includes(LINK_TARGET_ID), true);
check('--show-titles opts in and the verbatim href appears', /My-Private-Roadmap/.test(shown), true);
check('  and the default report says the opt-in exists', /page titles redacted by default/.test(redacted), true);

/* =========================================================================
 * TEST 9 — three holes review found that every green suite above missed
 * ========================================================================= */

head('TEST 9 — a link inside a toggle is discovered, because a scan that cannot see it exits 0');

const rNested = await scan({ config: cfg(ROOT, 1.0), port: fakePort(NESTED_LINK), now: clock() });
check('the nested link was discovered', rNested.coverage.find(c => c.rule === REF001_ID)?.applicable, 1);
check('  and it produced the dead-link finding', rNested.findings.filter(f => f.rule === REF001_ID).length, 1);
check('  anchored on the target inside the toggle', rNested.findings.find(f => f.rule === REF001_ID)!.anchor.resource, LINK_TARGET_ID);
check('  so the run does NOT exit 0 over a root containing a dead link', rNested.verdict.exit !== 0, true);
console.log('  ^ reading only top-level blocks made REF001 report a full ratio over a');
console.log('    denominator it never built. Spec criterion 2 is marked non-negotiable.');

head('TEST 9b — a container the API refuses is an UNBOUNDED loss, not a silent stop');

const rBlindToggle = await scan({ config: cfg(ROOT, 1.0), port: fakePort(NESTED_UNREADABLE), now: clock() });
check('the root carries a loss', rBlindToggle.manifest.of('resources').find(e => e.isRoot)!.loss !== null, true);
check('  and it is UNBOUNDED — the unread links cannot be counted', rBlindToggle.gaps.find(g => g.isRootMiss === false && !g.bounded) !== undefined, true);
check('  so the disposition is disclaimed and the byte is 2', `${rBlindToggle.verdict.disposition}/${rBlindToggle.verdict.exit}`, 'disclaimed/2');

head('TEST 9c — a DATABASE reference is a drop-out, never a proved dead link');

const rDb = await scan({ config: cfg(ROOT, 1.0), port: fakePort(DB_MENTION), now: clock() });
check('the database reference is in REF001\'s denominator', rDb.coverage.find(c => c.rule === REF001_ID)!.applicable, 1);
check('  it was NOT judged — the slice cannot retrieve it', rDb.coverage.find(c => c.rule === REF001_ID)!.evaluated, 0);
check('  and it produced NO finding', rDb.findings.filter(f => f.rule === REF001_ID).length, 0);
check('  the cause names the limit, and it is machine-readable', rDb.gaps[0]!.cause.startsWith('target-kind-not-retrievable'), true);
check('  no request was spent on it', rDb.calls.some(c => String(c.endpoint).includes(LINK_TARGET_ID)), false);
console.log('  ^ GET /v1/pages does not return a database. Retrieving one anyway makes a');
console.log('    readable, shared database report as certainty:confirmed / unreachable —');
console.log('    a defect the scan invented, which is what property 3 of ref001.ts forbids.');
/* The precision limit that remains, carried ON the finding rather than left in
 * a document. A URL says nothing about the object's kind, so a 404 on one also
 * covers a target that is a database. */
check('a URL-discovered target keeps the ambiguity on the finding', /also covers a target that is not a page/.test(dead.message), true);

const rMention = await scan({ config: cfg(ROOT, 1.0), port: fakePort(PAGE_MENTION_DEAD), now: clock() });
const mentionFinding = rMention.findings.find(f => f.rule === REF001_ID)!;
check('a Route A PAGE mention produces the same finding', mentionFinding.certainty, 'confirmed');
check('  discovered without parsing any host', /mention\(page\)/.test(mentionFinding.message), true);
check('  and it carries NO kind qualifier — Route A stated the kind', /also covers a target that is not a page/.test(mentionFinding.message), false);
console.log('  ^ "If a connection doesn\'t have access to the mentioned page, then the mention');
console.log('    is returned with just the ID." The reference survives the failure it reports.');

head('TEST 9d — the same external href on two pages is ONE reference');

const rTwice = await scan({ config: cfg(ROOT, 1.0), port: fakePort(EXTERNAL_ON_TWO_PAGES), now: clock() });
check('counted once, not once per page it was pasted on', rTwice.externalReferences, 1);
console.log('  ^ the report prints this as a fact. Deduping per page made it move with');
console.log('    where an editor pasted the link rather than with what the workspace holds.');

head('TEST 8b — two rules, two rows, and no figure without its unit');

check('the vector has two rows', rDead.coverage.length, 2);
check('  SYS001 counts resources', rDead.coverage.find(c => c.rule === 'SYS001')!.unit, 'resources');
check('  REF001 counts internal references', rDead.coverage.find(c => c.rule === REF001_ID)!.unit, 'internal references');
check('  and the counts are never pooled — the headline is the MINIMUM of the vector',
  headlineCoverage(rDead.coverage)!.ratio, Math.min(...rDead.coverage.map(c => c.ratio)));

const UNIT_WORDS = /resources|references|rules|blocks|pages|ms|requests|threshold/;
const deadReport = renderReport(rDead, {}).join('\n');
const bare = deadReport.split('\n').filter(l => /\d+\/\d+/.test(l) && !UNIT_WORDS.test(l));
check('no line prints a ratio without naming its unit', bare.join(' | '), '');

/* =========================================================================
 * TEST 10 — #100: the finding names WHERE the link is, not only what it points at
 * =========================================================================
 * The first run against a real workspace reported two unresolvable references
 * and named neither containing page (docs/proof/results-first-real-workspace.md
 * §5). On a twenty-resource fixture the reader can find them by opening twenty
 * pages; on several hundred they cannot, and the finding degrades to an alarm
 * with no address.
 *
 * The data was never missing. `references.ts` recorded it at the point of
 * discovery and `report.ts` rendered it zero times.
 */

head('TEST 10 — a REF001 finding names its source page and block');

check('the finding carries a source at all', dead.source !== null, true);
check('  and the source page is the page whose block content held the link', dead.source!.page, hyphenate(ROOT));
check('  and the block is the one the recogniser read it out of', dead.source!.block, 'block-link');

/* ⛔ THE ID FORM IS THE ASSERTION, not a formatting preference. scan.ts hands
 * extractReferences the BARE page ID, so this field arrived unhyphenated while
 * every anchor and manifest row beside it was hyphenated. Notion IDs are
 * time-ordered and share leading hex, so a reader cannot match two forms of the
 * same ID by eye — the standing constraint #42's run established. */
check('  the source page is FULL and HYPHENATED, like every other ID in the report', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(dead.source!.page), true);
check('  and it is the same form the anchor uses, so the two can be matched', dead.source!.page.length, dead.anchor.resource.length);

/* The address is USABLE: it names a page the manifest also holds, so the reader
 * can go from the finding to the row. A source naming a page absent from the
 * manifest would be an address to nowhere. */
check('  and the manifest holds that page, so the address resolves to a row',
  rDead.manifest.all().some(e => e.key === hyphenate(ROOT)), true);

head('TEST 10b — the source reaches the rendered report, on its own line');

const deadTerm = renderReport(rDead, {}).join('\n');
check('the terminal report prints the source page', deadTerm.includes(hyphenate(ROOT)!), true);
check('  labelled, so a bare ID is not left to be guessed at', /source: page [0-9a-f-]{36} · block /.test(deadTerm), true);

/* NOT a substitutable control: the assertion must be able to fail. Before #100
 * `grep -c sourcePage slice/report.ts` returned 0 and the line below was absent
 * from every format. */
check('  and the FINDINGS section is where it appears, not some other section',
  requiredSection(deadTerm, 'FINDINGS').includes('source: page'), true);

head('TEST 10c — the source is IDs only, and no title reaches any line of it');

/* Origin's invariant, asserted rather than trusted: both halves are IDs. The
 * fixture's child page carries the title `wl-revoke-parent`, so a source field
 * that had picked up an alias anywhere would show it. */
const SOURCE_LINES = deadTerm.split('\n').filter(l => l.includes('source: page'));
check('there is at least one source line to test — the check is not vacuous', SOURCE_LINES.length > 0, true);
check('  and no source line carries the fixture\'s page title', SOURCE_LINES.some(l => l.includes('wl-revoke-parent')), false);
check('  nor any non-ID text beyond the labels', SOURCE_LINES.every(l => /^ *source: page [0-9a-f-]+ · block [0-9a-z-]+$/.test(l)), true);

head('TEST 10d — MUTATION: put an alias in the source and the leak assertions fire');

/* The control for TEST 10c. Substitute the title for the ID in a rendered
 * source line and confirm both assertions that passed above now fail. A
 * redaction check that cannot fail is the substitutable control spec §6 names,
 * and this repository has shipped one: #42 printed a page title four lines
 * under a report asserting titles were redacted. */
const MUTATED_SOURCE_LINE = '      source: page wl-revoke-parent · block block-link';
check('the mutated line DOES carry the title', MUTATED_SOURCE_LINE.includes('wl-revoke-parent'), true);
check('  so TEST 10c\'s title assertion would have failed on it', [MUTATED_SOURCE_LINE].some(l => l.includes('wl-revoke-parent')), true);
check('  and its ID-shape assertion would have failed too', [MUTATED_SOURCE_LINE].every(l => /^ *source: page [0-9a-f-]+ · block [0-9a-z-]+$/.test(l)), false);
check('  while the real report still passes both', SOURCE_LINES.some(l => l.includes('wl-revoke-parent')) === false && SOURCE_LINES.length > 0, true);

head('TEST 10e — a finding whose rule has no source says so, and never goes blank');

/* SYS001's subject IS the resource; #100's brief puts a source for it out of
 * scope explicitly. The null must be PRINTED with its reason, for the same
 * reason the null link is: "no source" and "this rule has no source to give"
 * are different facts, and a blank cell collapses them. */
const rGapForSource = await scan({ config: cfg(ROOT, 1.0), port: fakePort(NESTED_UNREADABLE), now: clock() });
const sysFinding = rGapForSource.findings.find(f => f.rule === 'SYS001');
check('the fixture produced a SYS001 finding to test', sysFinding !== undefined, true);
check('  and it carries no source', sysFinding?.source ?? null, null);
const gapTerm = renderReport(rGapForSource, {}).join('\n');
check('  the report still prints a source line for it', /source: none —/.test(gapTerm), true);
check('  and the line states the REASON, not a dash or a blank', gapTerm.includes(SOURCE_NOT_APPLICABLE), true);

/* =========================================================================
 * TEST 11 — #135, #141: a dead-target finding carries its anchor text, and the
 * existing title-reveal option is the ONLY thing that publishes it.
 *
 * WHY THIS EXISTS. Run 1 produced 1-of-5 CANT-TELL because the report threw the
 * anchor text away, leaving the operator an ID for a page they could not open —
 * `docs/proof/dispositions-real-roots.md`. Anchor text is title-class by the
 * remedy test (#139), so it rides `--show-titles` and there is no second flag.
 * ========================================================================= */

head('TEST 11 — the finding carries the source-side anchor text, raw');

const rAnchored = await scan({ config: cfg(ROOT, 1.0), port: fakePort(ANCHORED_DEAD_LINK), now: clock() });
const anchored = rAnchored.findings.find(f => f.rule === REF001_ID);

check('the fixture produced a dead-target finding', anchored !== undefined, true);
check('  and it carries the anchor text the editor typed', anchored?.anchorText ?? null, ANCHOR_PHRASE);
check('  which is the string the workspace still holds for a target it cannot open',
  anchored?.targetState, 'unreachable');

head('TEST 11a — DEFAULT RENDER: the anchor text appears NOWHERE in the whole report');

/* ASSERTED OVER EVERY RENDERED LINE, NEVER OVER ONE SECTION. #42 shipped a page
 * title through a pagination helper's endpoint label, four lines under a report
 * claiming titles were redacted — the guarantee was made for the page and
 * checked for a section. Terminal AND Markdown AND JSON, because the document
 * is the thing that decides and all three read it. */
const anchoredTerm = renderReport(rAnchored, {}).join('\n');
const anchoredDoc = buildReportDocument(rAnchored, {});
const anchoredMd = renderMarkdown(anchoredDoc);
const anchoredJson = renderJson(anchoredDoc);

/* GUARD THE SUBJECT'S EMPTINESS FIRST. `''.includes(x)` is false for every x
 * and `x.includes('')` is true for every x, so an assertion over a blank
 * report, or over a blanked constant, passes while proving nothing. This
 * repository has shipped exactly that: CHECK-report.ts asserted
 * `rendered.includes(SOURCE_NOT_APPLICABLE)` and blanking the constant left it
 * green over a report printing a bare label. */
check('the terminal report is non-empty, so the absence below means something', anchoredTerm.length > 0, true);
check('  the Markdown report is non-empty too', anchoredMd.length > 0, true);
check('  and the JSON report is non-empty', anchoredJson.length > 0, true);
check('  the phrase under test is itself non-empty', ANCHOR_PHRASE.length > 0, true);

check('the anchor text is absent from the ENTIRE terminal report', anchoredTerm.includes(ANCHOR_PHRASE), false);
check('  absent from the ENTIRE Markdown report', anchoredMd.includes(ANCHOR_PHRASE), false);
check('  and absent from the ENTIRE JSON artifact, which outlives the terminal', anchoredJson.includes(ANCHOR_PHRASE), false);

/* And the withholding is STATED. A blank tells the reader nothing was there;
 * this must tell them something was withheld and how to see it. */
check('the report says the anchor text was withheld', anchoredTerm.includes(ANCHOR_TEXT_REDACTED), true);
check('  and names the flag that reveals it, so the reader is not stuck',
  ANCHOR_TEXT_REDACTED.includes('--show-titles'), true);

head('TEST 11b — REVEAL: --show-titles publishes it, through the SAME flag as aliases');

const revealedTerm = renderReport(rAnchored, { showTitles: true }).join('\n');
const revealedJson = renderJson(buildReportDocument(rAnchored, { showTitles: true }));

check('the anchor text appears under --show-titles', revealedTerm.includes(ANCHOR_PHRASE), true);
check('  in the JSON artifact as well', revealedJson.includes(ANCHOR_PHRASE), true);
check('  and the redaction placeholder is gone', revealedTerm.includes(ANCHOR_TEXT_REDACTED), false);
console.log('  ^ ONE flag governs titles and anchor text. #139 ruled them the same disclosure');
console.log('    category by the remedy test, so a second flag would be a reopened ruling.');

head('TEST 11c — NO ANCHOR TEXT is a THIRD state, distinct from withheld');

/* A link_to_page is a block, not a rich-text run: the workspace never held a
 * string for it. "Withheld from you" and "there was never one" are different
 * facts and one string for both prints a false sentence in whichever case it
 * was not written for. */
const rLtp = await scan({ config: cfg(ROOT, 1.0), port: fakePort(LINK_TO_PAGE_DEAD), now: clock() });
const ltpFinding = rLtp.findings.find(f => f.rule === REF001_ID);

check('the link_to_page fixture produced a dead-target finding', ltpFinding !== undefined, true);
check('  discovered by the structural route, which carries no text', ltpFinding?.evidence.location.includes('link_to_page'), true);
/* ASSERTED AS A BOOLEAN, and the first draft of this line was not. It read
 * `ltpFinding?.anchorText ?? 'NOT-NULL'` against `null`, which can never be
 * equal on any input: a null coalesces to the sentinel and a string is not
 * null. An assertion that cannot pass is the mirror of one that cannot fail,
 * and this suite exists because of the second kind. */
check('  so the finding carries no anchor text at all', ltpFinding?.anchorText === null, true);

const ltpTerm = renderReport(rLtp, {}).join('\n');
const ltpRevealed = renderReport(rLtp, { showTitles: true }).join('\n');

check('the report is non-empty, so the assertions below mean something', ltpTerm.length > 0, true);
check('the report states the absence rather than printing a blank', ltpTerm.includes(ANCHOR_TEXT_ABSENT), true);
check('  and NEVER an empty string after the label', / anchor text: *$/m.test(ltpTerm), false);
check('  the absence is NOT reported as a redaction', ltpTerm.includes(ANCHOR_TEXT_REDACTED), false);
check('  and --show-titles still says "there was never one", not "withheld"',
  ltpRevealed.includes(ANCHOR_TEXT_ABSENT), true);
/* WIDENED TO `string` ON PURPOSE. Compared directly, `tsc` rejects the
 * expression as unintentional — the two constants are literal types with no
 * overlap — which means the COMPILER already proves what this asserts, and
 * proves it for every future edit rather than for this run. The runtime check
 * stays because the type-level guarantee evaporates the moment either constant
 * is widened to `string`, and that edit would look harmless. */
const absentAsString: string = ANCHOR_TEXT_ABSENT;
check('the two states are DIFFERENT strings, so a reader can tell them apart',
  absentAsString === ANCHOR_TEXT_REDACTED, false);

head('TEST 11d — MUTATION: revert the redaction and TEST 11a must fail');

/* VERIFY THE SUBSTITUTION APPLIED BEFORE SCORING THE RUN. An unapplied mutation
 * is indistinguishable from dead code and both look like a green gate — S031
 * scored a mis-escaped mutation as a pass. The mutation here is the reveal
 * decision inverted: publish the raw anchor text with titles redacted, which is
 * what the code did before #141 and what a careless edit would restore. */
const leaked = rAnchored.findings
  .filter(f => f.rule === REF001_ID)
  .map(f => `      anchor text: ${f.anchorText ?? ANCHOR_TEXT_ABSENT}`)
  .join('\n');

check('the mutation actually substituted — the mutated text carries the phrase',
  leaked.includes(ANCHOR_PHRASE), true);
check('  and it is not empty, so the assertions below are not vacuous', leaked.length > 0, true);
check('  TEST 11a\'s whole-report assertion FAILS on the mutated output',
  leaked.includes(ANCHOR_PHRASE), true);
check('  while the real default render still passes it', anchoredTerm.includes(ANCHOR_PHRASE), false);
console.log('  ^ the control is not substitutable: blanking ANCHOR_TEXT_REDACTED would not');
console.log('    rescue it, because 11a asserts the PHRASE is absent, not that a constant is present.');

head('TEST 11e — the reveal decision is made ONCE, in the document');

/* The safety property of storing anchor text raw rests entirely on there being
 * a single decision point. If a renderer could reach past the document to
 * Finding.anchorText, the guarantee would be three renderers each remembering a
 * rule — which is the drift hazard ADR-0012 decision 6 closed at the module
 * layer and #45 closed at the render layer. */
const docDefault = buildReportDocument(rAnchored, {});
const docRevealed = buildReportDocument(rAnchored, { showTitles: true });
const rowDefault = docDefault.findings.find(f => f.rule === REF001_ID);
const rowRevealed = docRevealed.findings.find(f => f.rule === REF001_ID);

check('the DOCUMENT already holds the resolved string, not the raw one', rowDefault?.anchorText, ANCHOR_TEXT_REDACTED);
check('  and holds the revealed string when the flag is set', rowRevealed?.anchorText, ANCHOR_PHRASE);
check('  the field is never null on the document, so no renderer can print a blank',
  typeof rowDefault?.anchorText === 'string' && rowDefault.anchorText.length > 0, true);
check('  while the raw value stays on the FINDING, where only the document reads it',
  rAnchored.findings.find(f => f.rule === REF001_ID)?.anchorText, ANCHOR_PHRASE);

finish('The residue path is the mechanism. The host list is an optimisation, and it can never be complete.');
