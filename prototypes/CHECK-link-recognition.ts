/* Offline checks for REF001 link recognition — docs/spec/REF001-link-recognition.md §6.
 *
 *   npx tsx CHECK-link-recognition.ts
 *
 * No network, no .env, no token. Deterministic.
 *
 * The test this file exists to replace: the previous red test injected a known-bad
 * page ID straight into the resolver and asserted REF001 fired. It passed whether
 * or not link DISCOVERY worked, and discovery was in fact broken — the host
 * allow-list did not contain the host the fixture's own link is served from.
 * A control that can substitute for the mechanism under test is not a control.
 *
 * Test 1 below therefore carries a MUTATION CHECK: it removes app.notion.com from
 * the host list and asserts the discovery goes red. If that mutation leaves the
 * test green, the test is not measuring discovery and is invalid.
 */

import {
  classifyHref,
  extractReferences,
  internalRefs,
  unrecognisedRefs,
  KNOWN_INTERNAL_HOSTS,
  type HostEntry,
} from './link-recognition.js';
import { deriveVerdict, type Gap } from './verdict.js';

let fails = 0;
const check = (name: string, got: unknown, want: unknown) => {
  const ok = String(got) === String(want);
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: got=${got} want=${want}`);
};
const head = (s: string) => console.log(`\n== ${s} ==`);

/* ------------------------------------------------------------- fixtures -- */

/* The shape of the block the API actually returned on 2026-08-17, recorded in
 * docs/proof/results-ref001-live.md §2:
 *   [paragraph] type=text text="wl-outside-grant"
 *               href=https://app.notion.com/p/3bf1351d6af481108dc5dcc8bffb9742 */
const OBSERVED_HREF = 'https://app.notion.com/p/3bf1351d6af481108dc5dcc8bffb9742';
const OBSERVED_TARGET = '3bf1351d-6af4-8110-8dc5-dcc8bffb9742';

const observedBlock = {
  object: 'block',
  id: '1a2b3c4d-0000-4000-8000-000000000001',
  type: 'paragraph',
  paragraph: {
    rich_text: [
      {
        type: 'text',
        text: { content: 'wl-outside-grant', link: { url: OBSERVED_HREF } },
        plain_text: 'wl-outside-grant',
        href: OBSERVED_HREF,
      },
    ],
  },
};

/* =========================================================================
 * TEST 1 — discovery on the observed host, with the mutation check
 * ========================================================================= */

head('TEST 1 — REF001 discovers the link from BLOCK CONTENT, not from an injected ID');

const found = extractReferences([observedBlock]);
const internal = internalRefs(found);

check('exactly one internal reference discovered', internal.length, 1);
check('target ID was extracted from the href in the block', internal[0]?.targetId, OBSERVED_TARGET);
check('detection route is href on the observed host', internal[0]?.via, 'href(app.notion.com)');
check('it is attributed to the block it came from', internal[0]?.sourceBlock, observedBlock.id);
check('nothing fell into the residue', unrecognisedRefs(found).length, 0);

console.log('  ^ the ID above was produced by extractReferences() reading the block.');
console.log('    Nothing handed it to a resolver. That is the difference from the old red test.');

head('TEST 1b — MUTATION CHECK: remove app.notion.com and the discovery must go RED');

const mutatedHosts: HostEntry[] = KNOWN_INTERNAL_HOSTS.filter(h => h.host !== 'app.notion.com');
const mutated = classifyHref(OBSERVED_HREF, observedBlock.id, mutatedHosts);

check('with the host removed, it is NO LONGER internal', mutated.kind !== 'internal', true);
check('and it is not silently dropped either', mutated.kind, 'unrecognised');
check('cause is named and specific', (mutated as any).cause, 'link-host-unrecognised');

console.log('  ^ the host entry is load-bearing: deleting it changes the result.');
console.log('    This is what the previous control could not show about itself.');

head('TEST 1c — the regex the first implementation actually shipped');

/* results-ref001-live.md §2: the first implementation matched /notion\.(so|site)/.
 * Executed here rather than described, because the whole finding is that it
 * failed silently and nobody noticed. */
const shippedRegex = /notion\.(so|site)/;
check('the shipped regex does NOT match the observed host', shippedRegex.test('app.notion.com'), false);
const shippedHosts: HostEntry[] = [{ host: 'legacy', pattern: shippedRegex, evidence: 'documented' }];
check(
  'under the shipped regex the link becomes residue, not silence',
  classifyHref(OBSERVED_HREF, 'b', shippedHosts).kind,
  'unrecognised',
);
console.log('  ^ under the spec, the original defect degrades to a reported gap.');
console.log('    Under the original code it degraded to a clean verdict.');

/* =========================================================================
 * TEST 2 — the residue is reachable
 * ========================================================================= */

head('TEST 2 — a Notion-shaped ID on an unknown host reaches the residue');

const customDomainHref = 'https://handbook.acme.com/p/3bf1351d6af481108dc5dcc8bffb9742';
const custom = classifyHref(customDomainHref, 'block-2');
check('classified unrecognised', custom.kind, 'unrecognised');
check('cause', (custom as any).cause, 'link-host-unrecognised');
check('the verbatim href is retained as evidence', (custom as any).href, customDomainHref);

const relative = classifyHref('/3bf1351d6af481108dc5dcc8bffb9742', 'block-3');
check('a relative href is unrecognised, never assumed internal', relative.kind, 'unrecognised');
check('cause', (relative as any).cause, 'href-unparseable');

console.log('  ^ Notion documents custom domains for Sites. This case is not hypothetical,');
console.log('    and no allow-list can ever cover it.');

/* =========================================================================
 * TEST 3 — the residue reaches the exit byte
 * ========================================================================= */

head('TEST 3 — an unrecognised reference lowers coverage and forces exit 3');

/* Four applicable references: three resolved, one unrecognised. */
const gaps: Gap[] = [
  { resource: customDomainHref, cause: 'link-host-unrecognised', bounded: true },
];
const v = deriveVerdict({ applicable: 4, evaluated: 3, gaps, violations: 0, coverageThreshold: 1.0 });

check('the unrecognised reference stays in the denominator', v.applicable, 4);
check('coverage ratio', `${v.evaluated}/${v.applicable}`, '3/4');
check('gap is bounded, so the disposition is qualified not disclaimed', v.disposition, 'qualified');
check('exit', v.exit, 3);

const v0 = deriveVerdict({ applicable: 4, evaluated: 4, gaps: [], violations: 0, coverageThreshold: 1.0 });
check('control: with nothing unrecognised the same inputs exit 0', v0.exit, 0);

/* An unrecognised reference cannot reach exit 0 by raising the threshold alone.
 * Its SYS001 gap finding is still new and unsuppressed, and ADR-0008 exit 1
 * fires on that. This corrected an error in spec §5, which had claimed exit 0.
 * The check was executed rather than reasoned about, and the reasoning lost. */
const vTol = deriveVerdict({ applicable: 4, evaluated: 3, gaps, violations: 0, coverageThreshold: 0.5 });
check('raising the threshold to 0.5 does NOT buy exit 0', vTol.exit, 1);
check('the report is still qualified', vTol.disposition, 'qualified');

const vBaselined = deriveVerdict({
  applicable: 4, evaluated: 3, gaps, violations: 0,
  coverageThreshold: 0.5, newUnsuppressedFindings: 0,
});
check('exit 0 requires the gap to be BASELINED as well', vBaselined.exit, 0);
check('and the report stays qualified even then', vBaselined.disposition, 'qualified');
console.log('  ^ the only route to exit 0 with an unrecognised link is an explicit');
console.log('    operator decision recorded in the baseline. Not a threshold tweak.');

const vUnbounded = deriveVerdict({
  applicable: 4, evaluated: 3, violations: 0, coverageThreshold: 0.5,
  gaps: [{ resource: 'wl-pagination', cause: 'enumeration abandoned', bounded: false }],
});
check('an UNBOUNDED gap is not tolerable at any threshold', vUnbounded.exit, 2);
check('and renders no summary verdict', vUnbounded.disposition, 'disclaimed');

/* =========================================================================
 * TEST 4 — external links do not enter the denominator
 * ========================================================================= */

head('TEST 4 — plain external links stay external');

check('a plain external URL', classifyHref('https://example.com/blog', 'b').kind, 'external');
check('an external URL with no Notion-shaped ID', classifyHref('https://news.ycombinator.com/item?id=1', 'b').kind, 'external');
check('mailto', classifyHref('mailto:someone@example.com', 'b').kind, 'external');

/* The deliberate over-report, pinned so it is visible rather than discovered later. */
const falsePositive = classifyHref('https://example.com/a/3bf1351d6af481108dc5dcc8bffb9742', 'b');
check('a non-Notion URL carrying 32 hex chars IS over-reported', falsePositive.kind, 'unrecognised');
console.log('  ^ chosen. A false unrecognised costs precision; a false external costs soundness');
console.log('    and is CONTEXT.md Non-goal 4. Tests 1 and 4 constrain each other on purpose.');

/* =========================================================================
 * TEST 5 — Route A, and the double-count it would otherwise cause
 * ========================================================================= */

head('TEST 5 — structural references need no host, and are not counted twice');

const mentionBlock = {
  id: 'blk-mention',
  type: 'paragraph',
  paragraph: {
    rich_text: [
      {
        type: 'mention',
        mention: { type: 'page', page: { id: OBSERVED_TARGET } },
        plain_text: 'wl-outside-grant',
        /* The rich-text reference: href is "The URL of any link or Notion mention
         * in this text". A mention therefore appears on BOTH detection routes. */
        href: OBSERVED_HREF,
      },
    ],
  },
};

const mentionRefs = extractReferences([mentionBlock]);
check('the mention is discovered', internalRefs(mentionRefs).length, 1);
check('via the structural route, not the href route', internalRefs(mentionRefs)[0]?.via, 'mention(page)');
check('counted once, not twice', mentionRefs.length, 1);

const bothBlocks = extractReferences([observedBlock, mentionBlock]);
check('same target via two routes in two blocks is still one reference', internalRefs(bothBlocks).length, 1);
console.log('  ^ dedupe is on the resolved target ID. Keying it on the route would');
console.log('    reproduce the double-count of results-ref001-live.md §5.');

/* ----------------------------------------------------------------- done -- */

console.log('');
console.log(fails ? `${fails} FAILURE(S)` : 'ALL CHECKS PASS');
process.exit(fails ? 1 : 0);
