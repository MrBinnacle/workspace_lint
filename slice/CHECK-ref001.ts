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
import { renderReport } from './report.js';
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

/* Spec §2.1: these three have no locator and must NOT be in the allow-list.
 * They travel the residue path, which costs precision and not soundness. */
for (const host of ['www.notion.so', 'notion.so', 'notion.com']) {
  const r = classifyHref(`https://${host}/Some-Page-3bf1351d6af481108dc5dcc8bffb9742`, 'block-1');
  check(`${host} is NOT CHECKED, so it travels the residue path`, r.kind, 'unrecognised');
}

check('the allow-list holds exactly the two hosts that have a locator', KNOWN_INTERNAL_HOSTS.length, 2);
check('  app.notion.com is marked observed', KNOWN_INTERNAL_HOSTS[0]!.evidence, 'observed');
check('  *.notion.site is marked documented, not observed', KNOWN_INTERNAL_HOSTS[1]!.evidence, 'documented');

/* =========================================================================
 * TEST 1b — MUTATION CHECK: the host entry is load-bearing, not asserted
 * ========================================================================= */

head('TEST 1b — MUTATION CHECK: remove app.notion.com and the observed href must stop resolving');

const withoutObserved: HostEntry[] = KNOWN_INTERNAL_HOSTS.filter(h => h.host !== 'app.notion.com');
const mutated = classifyHref(OBSERVED_HREF, 'block-1', withoutObserved);
check('with the entry removed the same href is no longer internal', mutated.kind, 'unrecognised');
check('  it does not vanish into external — that is the false green', mutated.kind === 'external', false);
check('the mutation moved the outcome', internal.kind !== mutated.kind, true);

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
 * TEST 4 — spec §6 test 3: the residue and the exit byte. BLOCKED ON #49.
 * ========================================================================= */

head('TEST 4 — the residue does NOT yet reach the exit byte, and the report says so');

/* This is the check spec §6 test 3 asks for, and it does not pass. It asserts
 * what the run actually does and what the run discloses about it, because a
 * check written to the byte the spec wants would be red and a check written to
 * the byte the code produces without the disclosure would be a false green.
 *
 * WHY IT CANNOT PASS HERE. deriveVerdict compares the FUNNEL scalar — evaluated
 * resources over applicable resources — against the declared threshold.
 * ADR-0011 decision 5 makes the threshold a floor on EVERY rule, i.e. on the
 * MINIMUM of the coverage vector. Those were one number while SYS001 was the
 * only rule. On this run the funnel reads 2/2 resources and REF001 reads 0/1
 * references, so a rule sitting at zero is masked by a rule sitting at one.
 * verdict.ts is copied verbatim from a frozen prototype (spec §5), so what it
 * compares is #49's decision and not an edit this ticket may make.
 *
 * THIS CHECK IS A TRIPWIRE. When #49 lands and the byte compares the vector
 * minimum, the three assertions below go RED and force this file to be updated
 * to the spec's expectation of exit 3. */
check('the funnel figure clears the declared threshold', rResidue.byteBasis.funnel >= 1.0, true);
check('  while the vector minimum does not', rResidue.byteBasis.vectorMinimum!.ratio, 0);
check('  the vector minimum is set by REF001', rResidue.byteBasis.vectorMinimum!.rule, REF001_ID);
check('the scan MEASURES the divergence rather than assuming it away', rResidue.byteBasis.byteWouldDiffer, true);

const residueReport = renderReport(rResidue, {}).join('\n');
check('  and the report discloses it on the run', /THE EXIT BYTE IS NOT THE ONE ADR-0011 DECISION 5 REQUIRES/.test(residueReport), true);
check('  naming the issue that decides it', /#49/.test(residueReport), true);
check('  and printing both figures with their units', /byte basis:.*unit: resources.*unit: internal references/.test(residueReport), true);

check('TRIPWIRE — the byte is 0 today; spec §6 test 3 requires 3 and #49 is what changes it', rResidue.verdict.exit, 0);
console.log('  ^ THIS IS THE FALSE GREEN #49 EXISTS TO CLOSE, and it is disclosed rather than hidden.');
console.log('    A run holding an unresolvable reference exits 0 because the coverage floor was');
console.log('    applied to the wrong figure. Do not close #44\'s DoD on the exit byte.');

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
check('the host list restored to its two entries', KNOWN_INTERNAL_HOSTS.length, 2);
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
  reportSection(redacted, 'GAPS').includes('www.notion.so') && reportSection(redacted, 'GAPS').includes(LINK_TARGET_ID), true);
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

finish('The residue path is the mechanism. The host list is an optimisation, and it can never be complete.');
