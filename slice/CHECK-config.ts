/* The config schema's rule-configuration section — issue #19, second half.
 *
 *   npx tsx CHECK-config.ts
 *
 * No network, no .env, no token. `parseConfig` is a pure function from a string
 * to a result, so every assertion here is a literal config document and its
 * verdict. That is why this suite exists as its own file: the config surface is
 * now large enough that folding it into CHECK-scan-scaffold.ts — which is the
 * funnel's red test — would put two unrelated subjects behind one heading.
 *
 * WHAT THIS SUITE IS ACTUALLY DEFENDING. A configured rule that the loader
 * accepts and nothing evaluates produces a green run over a rule that never
 * ran. That is this product's own defect class, sitting in its own configuration
 * loader, and it is why TEST 3 rejects every rule ID this build cannot execute
 * rather than ignoring it. Silence is the failure mode; a rejection is not.
 *
 * THE MUTATION CHECK IS RUN BY HAND AND RECORDED IN THE COMMIT BODY. parseConfig
 * takes no injectable seam — it reads a string and returns a result — so there is
 * no honest way to bypass one branch of it from inside this file. Bypassing it
 * from outside is the check: comment out the scope identity rejection in
 * config.ts, re-run this suite, and confirm a NON-ZERO EXIT. Score on the exit
 * code, never on grepping for FAIL; a suite that crashes prints no FAIL at all.
 */

import { parseConfig, loadConfig, type RuleDecl } from './config.js';
import { unimplementedRules, type Rule } from './rule.js';
import { fileURLToPath } from 'node:url';
import { hyphenate } from './ids.js';
import { createHarness } from './CHECK-harness.js';
import { ROOT, DATASET } from './CHECK-fakes.js';

const { check, head, finish } = createHarness();

/* A valid document with the rules section swapped in, so every assertion below
 * differs from the accepted case in exactly one place. Building each test's
 * document from scratch is how a suite ends up asserting a rejection that fired
 * for a reason other than the one the test names. */
const withRules = (rules: unknown): string =>
  JSON.stringify({ version: 1, roots: [{ id: ROOT }], minCoverage: 1.0, rules });

const reasonOf = (r: ReturnType<typeof parseConfig>): string => (r.ok ? '' : r.reason);

/* =========================================================================
 * TEST 1 — the section is optional, and its absence is today's behaviour
 * ========================================================================= */

head('TEST 1 — a config with no rules section still loads, and carries an empty list');

const noRules = parseConfig(JSON.stringify({ version: 1, roots: [{ id: ROOT }], minCoverage: 1.0 }));
check('a config without "rules" loads', noRules.ok, true);
/* Empty rather than undefined. Every reader downstream iterates it, and an
 * optional array is a null check at each of those sites — one of which would
 * eventually be forgotten, and the forgotten one reads as "no rules configured"
 * rather than as a crash. */
check('and "rules" is an empty array, not undefined', noRules.ok && noRules.config.rules.length, 0);

const emptyRules = parseConfig(withRules([]));
check('an explicitly empty rules list loads', emptyRules.ok, true);
check('and stays empty', emptyRules.ok && emptyRules.config.rules.length, 0);

const rulesObject = parseConfig(withRules({ REQ001: 'Owner' }));
check('a rules OBJECT is rejected — the section is a list', rulesObject.ok, false);

const ruleNotObject = parseConfig(withRules(['REQ001']));
check('a rules entry that is a bare string is rejected', ruleNotObject.ok, false);

/* =========================================================================
 * TEST 2 — identity is the stable ID, in a rule's scope as much as in a root
 * ========================================================================= */

head('TEST 2 — a scope addressed by name alone is rejected, never resolved');

const scopeByName = parseConfig(withRules([{ rule: 'REQ001', scope: { name: 'Dataset' }, property: 'Owner' }]));
check('a name-only scope is rejected', scopeByName.ok, false);
/* The SAME sentence the roots rejection carries. If these two messages ever
 * differ, the two rejections are two implementations of one rule and one of
 * them will be corrected without the other. */
check('and the reason is the identity rule verbatim', /Identity is the stable ID/.test(reasonOf(scopeByName)), true);
check('and it names the offending entry', /rules\[0\]\.scope/.test(reasonOf(scopeByName)), true);

const scopeByAlias = parseConfig(withRules([{ rule: 'REQ001', scope: { alias: 'wl-dataset' }, property: 'Owner' }]));
check('an alias-only scope is rejected too', scopeByAlias.ok, false);

const scopeByUrl = parseConfig(withRules([{ rule: 'REQ001', scope: { url: 'https://app.notion.com/p/whatever' }, property: 'Owner' }]));
check('a URL is not an ID here either', scopeByUrl.ok, false);

/* A PRESENT BUT MALFORMED ID IS A TYPO, AND IT USED TO GET THE IDENTITY
 * MESSAGE — which told an operator who had written an `id` to supply an `id`.
 * Found by review, on the likeliest path there is: the README's worked example
 * pairs an id with an alias, so one wrong hex digit produced it. */
const shortId = parseConfig(withRules([{ rule: 'REQ001', scope: { id: '0000', alias: 'wl-dataset' }, property: 'Owner' }]));
check('a malformed scope id is rejected', shortId.ok, false);
check('and the message says the id is malformed, not missing', /is not a Notion ID/.test(reasonOf(shortId)), true);
check('and it does NOT tell the operator to supply an id they wrote', /carries no "id"/.test(reasonOf(shortId)), false);

const scopeBare = parseConfig(withRules([{ rule: 'REQ001', scope: { id: DATASET }, property: 'Owner' }]));
check('a bare 32-hex scope ID is accepted', scopeBare.ok, true);
check('and normalized to hyphenated form', scopeBare.ok && scopeBare.config.rules[0]!.scope.id, '5db3573f-8cf6-a332-afe7-fee0d11db964');

const scopeAliasWithId = parseConfig(withRules([{ rule: 'REQ001', scope: { id: DATASET, alias: 'wl-dataset' }, property: 'Owner' }]));
check('a readable alias may accompany an ID', scopeAliasWithId.ok, true);
check('and it is carried for the report', scopeAliasWithId.ok && scopeAliasWithId.config.rules[0]!.scope.alias, 'wl-dataset');

/* Rejection 4. A required-property rule with no scope asserts the property over
 * every resource the scan enumerated, which is inference of applicability from
 * nothing — the identical list ADR-0001 decision 4 rejects. If #58 wants a
 * default scope, that is a recorded decision, not a loader default. */
const noScope = parseConfig(withRules([{ rule: 'REQ001', property: 'Owner' }]));
check('a REQ001 entry with no scope is rejected', noScope.ok, false);
check('and the reason says why a default would be inference', /infer|applicab/i.test(reasonOf(noScope)), true);

/* =========================================================================
 * TEST 3 — three classes of rule ID, three different rejections
 * ========================================================================= */

head('TEST 3 — the loader rejects every rule ID it cannot execute, and says which kind it is');

const unknownRule = parseConfig(withRules([{ rule: 'REQ002', scope: { id: DATASET }, property: 'Owner' }]));
check('a rule ID outside the catalog is rejected', unknownRule.ok, false);
check('and the message says it is not in the catalog', /catalog/i.test(reasonOf(unknownRule)), true);

/* Case-sensitive on purpose. A loader that upper-cases the input accepts a
 * spelling CONTEXT.md does not use, and the report then prints an ID the
 * operator cannot grep for in their own config. */
const lowerCase = parseConfig(withRules([{ rule: 'req001', scope: { id: DATASET }, property: 'Owner' }]));
check('rule IDs are case-sensitive — "req001" is rejected', lowerCase.ok, false);

const builtIn = parseConfig(withRules([{ rule: 'SYS001', scope: { id: DATASET } }]));
check('a BUILT-IN rule is rejected — it takes no configuration', builtIn.ok, false);
check('and the message says built-in rather than unknown', /built-in/i.test(reasonOf(builtIn)), true);

const builtInRef = parseConfig(withRules([{ rule: 'REF001', scope: { id: DATASET } }]));
check('REF001 is built-in too', builtInRef.ok, false);

/* The class that matters most. UNQ001 is Configured and ships in v0.1 and is
 * NOT in this build — accepting it silently is exactly the false green above. */
const notBuilt = parseConfig(withRules([{ rule: 'UNQ001', scope: { id: DATASET }, property: 'Title' }]));
check('a configured rule this build does not run is rejected', notBuilt.ok, false);
check('and the message names the issue that would build it', /#59/.test(reasonOf(notBuilt)), true);
check('and it is NOT reported as unknown', /catalog/i.test(reasonOf(notBuilt)), false);

const deferred = parseConfig(withRules([{ rule: 'SCH001', scope: { id: DATASET } }]));
check('a deferred catalog rule is rejected', deferred.ok, false);
check('and named as deferred rather than as a typo', /deferred/i.test(reasonOf(deferred)), true);

const missingRuleKey = parseConfig(withRules([{ scope: { id: DATASET }, property: 'Owner' }]));
check('an entry with no "rule" key is rejected', missingRuleKey.ok, false);

/* THE CATALOG IS AN OBJECT LITERAL, SO IT INHERITS FROM Object.prototype.
 * `RULE_STATUS['toString']` is a truthy function, which walked past the
 * not-in-catalog branch and landed on the fall-through return: the operator was
 * told their typo was a real catalog rule that ships later. Found by review, and
 * the suite could not have caught it — every ID it tested was one with no
 * prototype twin. These four are the twins. */
for (const inherited of ['toString', 'constructor', 'hasOwnProperty', '__proto__']) {
  const r = parseConfig(withRules([{ rule: inherited, scope: { id: DATASET }, property: 'Owner' }]));
  check(`an inherited Object key ("${inherited}") is not a rule`, r.ok, false);
  check(`  and it is reported as not in the catalog`, /catalog/i.test(reasonOf(r)), true);
}

/* =========================================================================
 * TEST 4 — REQ001's own field, and the one hazard it carries
 * ========================================================================= */

head('TEST 4 — REQ001 declares one required property, and it must be named');

const ok4 = parseConfig(withRules([{ rule: 'REQ001', scope: { id: DATASET }, property: 'Owner' }]));
check('the accepted shape loads', ok4.ok, true);
check('and carries the rule ID', ok4.ok && ok4.config.rules[0]!.rule, 'REQ001');
check('and carries the property name', ok4.ok && ok4.config.rules[0]!.property, 'Owner');
check('and there is exactly one entry', ok4.ok && ok4.config.rules.length, 1);

const noProperty = parseConfig(withRules([{ rule: 'REQ001', scope: { id: DATASET } }]));
check('REQ001 without a property is rejected', noProperty.ok, false);

const emptyProperty = parseConfig(withRules([{ rule: 'REQ001', scope: { id: DATASET }, property: '   ' }]));
check('a blank property name is rejected', emptyProperty.ok, false);

const numberProperty = parseConfig(withRules([{ rule: 'REQ001', scope: { id: DATASET }, property: 7 }]));
check('a non-string property is rejected', numberProperty.ok, false);

/* Stored trimmed, not merely validated trimmed. `"Owner "` names no Notion
 * property, and an untrimmed store put it in the manifest as a second entry —
 * see the duplicate case in TEST 5. */
const paddedProperty = parseConfig(withRules([{ rule: 'REQ001', scope: { id: DATASET }, property: '  Owner  ' }]));
check('surrounding whitespace is stripped from the property name', paddedProperty.ok && paddedProperty.config.rules[0]!.property, 'Owner');

/* =========================================================================
 * TEST 5 — a duplicate entry is a silent doubling of REQ001's denominator
 * ========================================================================= */

head('TEST 5 — duplicates are rejected, and the match is on the NORMALIZED ID');

const dup = parseConfig(withRules([
  { rule: 'REQ001', scope: { id: DATASET }, property: 'Owner' },
  { rule: 'REQ001', scope: { id: DATASET }, property: 'Owner' },
]));
check('two identical entries are rejected', dup.ok, false);
check('and the reason names the coverage item it would double', /pair/i.test(reasonOf(dup)), true);

/* The two spellings of one ID. Matching on the raw string would let this pass,
 * and REQ001's denominator is (resource, property) PAIRS — so the duplicate
 * inflates the denominator and the ratio moves toward the flattering answer. */
const dupHyphenated = parseConfig(withRules([
  { rule: 'REQ001', scope: { id: DATASET }, property: 'Owner' },
  { rule: 'REQ001', scope: { id: '5db3573f-8cf6-a332-afe7-fee0d11db964' }, property: 'Owner' },
]));
check('a bare ID and its hyphenated twin are the same entry', dupHyphenated.ok, false);

/* The whitespace twin. Found by review: `property` was validated with `.trim()`
 * and stored raw, so these were TWO entries and REQ001's denominator gained a
 * pair no observation could ever fill. */
const dupPadded = parseConfig(withRules([
  { rule: 'REQ001', scope: { id: DATASET }, property: 'Owner' },
  { rule: 'REQ001', scope: { id: DATASET }, property: 'Owner ' },
]));
check('a property name and its whitespace twin are the same entry', dupPadded.ok, false);

const twoProperties = parseConfig(withRules([
  { rule: 'REQ001', scope: { id: DATASET }, property: 'Owner' },
  { rule: 'REQ001', scope: { id: DATASET }, property: 'Status' },
]));
check('two required properties in one scope are NOT duplicates', twoProperties.ok, true);
check('and both are kept', twoProperties.ok && twoProperties.config.rules.length, 2);

/* Property names are compared as written. Notion property names are
 * case-sensitive and "owner" is a different property from "Owner", so folding
 * case here would reject a legitimate pair. */
const caseDistinct = parseConfig(withRules([
  { rule: 'REQ001', scope: { id: DATASET }, property: 'Owner' },
  { rule: 'REQ001', scope: { id: DATASET }, property: 'owner' },
]));
check('property names differing only in case are two entries', caseDistinct.ok, true);

/* =========================================================================
 * TEST 6 — every rejection is exit 4, and every rejection says something
 * ========================================================================= */

head('TEST 6 — a rejection carries a reason an operator can act on');

const rejections = [scopeByName, scopeByAlias, noScope, unknownRule, builtIn, notBuilt, deferred, noProperty, dup];
check('every rejection above returned ok:false', rejections.every(r => !r.ok), true);
check('and every one carries a non-empty reason', rejections.every(r => reasonOf(r).length > 20), true);
/* The offending entry is locatable. "rules[2] is invalid" sends an operator to
 * the right line; "invalid rule configuration" sends them to the whole file. */
check('and every one names its entry by index', rejections.slice(0, 8).every(r => /rules\[\d\]/.test(reasonOf(r))), true);

/* =========================================================================
 * TEST 7 — a rule the document declares and the BUILD cannot run
 * ========================================================================= */

head('TEST 7 — a configured rule with no implementation stops the scan, it does not get ignored');

/* This is the hole the example config opened, and it is the same hole TEST 3
 * closes from the other side. TEST 3 rejects a rule ID this build cannot run at
 * LOAD time, from a table in config.ts. That table is hand-kept, so the day
 * REQ001's implementation is late by one commit, the loader says yes and the
 * scan runs two rules while the report describes three. This check asks the
 * BUILD rather than the table. */
const decl = (property: string): RuleDecl => ({ rule: 'REQ001', scope: { id: hyphenate(DATASET)! }, property });
const fakeRule = (id: string) => ({ id }) as unknown as Rule;

check('a configured rule with no implementation is named', unimplementedRules([decl('Owner')], [fakeRule('SYS001'), fakeRule('REF001')]).join(','), 'REQ001');
check('and it is empty once the rule is built', unimplementedRules([decl('Owner')], [fakeRule('SYS001'), fakeRule('REQ001')]).length, 0);
check('no configured rules is trivially satisfiable', unimplementedRules([], [fakeRule('SYS001')]).length, 0);
/* Two entries configuring one unbuilt rule are ONE defect. Printing the ID
 * twice reads as two different problems and sends the operator looking for a
 * second one. */
check('two entries for one unbuilt rule report it once', unimplementedRules([decl('Owner'), decl('Status')], [fakeRule('SYS001')]).length, 1);

/* =========================================================================
 * TEST 8 — the shipped example config actually loads
 * ========================================================================= */

head('TEST 8 — wl.config.example.json is loaded by the suite, not only by a reader');

/* IT SHIPPED BROKEN ONCE, IN THIS DIFF. The first version of the example
 * declared a REQ001 entry, which this build rejects unconditionally — the only
 * worked example in the repository exited 4. Nothing in the suite read the file,
 * so nothing said so; a reviewer running the CLI by hand found it. An example
 * config is an executable claim about the product, and this is the assertion
 * that makes it one. */
/* fileURLToPath, not `.pathname` — on Windows a file URL's pathname is
 * `/C:/…`, which readFileSync rejects. The suite must run on both platforms. */
const example = loadConfig(fileURLToPath(new URL('../wl.config.example.json', import.meta.url)));
check('the shipped example config loads', example.ok, true);
/* And it declares nothing this build cannot run. The rule-config section exists
 * for #58 and #59; until one of them lands, an entry here would make the example
 * exit 4 again — this is the assertion that catches the re-add. */
check('and configures no rule this build cannot execute',
  example.ok ? unimplementedRules(example.config.rules, [fakeRule('SYS001'), fakeRule('REF001')]).length : -1, 0);

finish(
  'The loader rejects; it never resolves and never ignores. Each rejection above exits 4 —\n' +
  'ADR-0008 decision 2, "the scan did not run as declared" — because an unloadable configuration\n' +
  'means the scan never began. The mutation check for this file is run BY HAND and recorded in\n' +
  'the commit body: bypass the scope identity rejection in config.ts and this suite must exit\n' +
  'non-zero. A control that passes with its mechanism removed tested nothing.',
);
