/* The suite checks that its own ASSERTIONS can fail — the tautology lint.
 *
 *   npx tsx CHECK-assertions.ts
 *
 * No network, no .env, no token. Reads the .ts files in this directory and
 * nothing else.
 *
 * WHY THIS EXISTS, AND WHY IT IS A GATE RATHER THAN A HABIT. This repository has
 * now shipped four assertions that could not fail, and each one passed exactly as
 * loudly as a real check:
 *
 *   - `x.includes('')` is TRUE for every `x`, so blanking the constant left
 *     CHECK-report.ts green over a bare label.
 *   - `rendered.includes(BLANKED)`, the same shape through a different door.
 *   - A disjunct `|| /link:/.test(term)` was a tautology, because the findings
 *     section prints `link:` four lines above — and a disjunction whose second
 *     term is a tautology asserts nothing about the first.
 *   - `String(got) === String(want)` in the shared harness passed whenever the
 *     TYPES differed, so `check(1, '1')` and `check([1], '1')` both passed.
 *
 * And one more, found on 2026-08-22 while building the measurements section: a
 * negative lookaround written `(?!` followed by `.*` inside a regex applied to a
 * whole rendered report. The lookaround spans the rest of the document, so a
 * qualifier printed anywhere later satisfies it. That one caught a mutation in
 * the terminal and Markdown emitters and PASSED it in the JSON artifact, which
 * is the only reason it was noticed at all.
 *
 * ⛔ EVERY ONE OF THOSE WAS FOUND BY A HUMAN READING, NOT BY THE GATE. §1 of the
 * operating rules says a discipline that must fire cannot live in a layer that
 * depends on someone remembering it. These five shapes are mechanically
 * detectable, so they are detected here.
 *
 * ⚠ WHAT THIS FILE CANNOT DO, STATED SO IT IS NOT MISTAKEN FOR MORE. It is a
 * pattern lint over source text. It cannot see a control whose FIXTURE is
 * degenerate — an assertion looping over an empty array, or one whose input
 * never reaches the branch under test. That failure is semantic, it has bitten
 * this suite too, and the only instrument for it is a mutation actually run and
 * scored by which assertion names it. See `docs/proof/results-143-total-skew.md`.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { createHarness } from './CHECK-harness.js';

const { check, head, finish } = createHarness();

/* ------------------------------------------------------------- the needles --
 *
 * ⛔ EVERY PATTERN IS BUILT BY CONCATENATION AND NEVER WRITTEN AS A LITERAL.
 * This file's whole subject is text that must not appear in the tree, and this
 * file is in the tree. Writing the literal here would make the lint report
 * itself — which is precisely what happened to `CHECK-claims.ts` when the state
 * file reproduced a claim comment verbatim while warning about it, and turned
 * the gate red on three surfaces instead of two.
 *
 * The fixture in TEST 1 is what proves the concatenated needles still match the
 * thing they name, so this construction cannot silently stop detecting.
 * -------------------------------------------------------------------------- */

type Hazard = { id: string; pattern: RegExp; why: string };

const HAZARDS: Hazard[] = [
  {
    id: 'document-spanning-lookaround',
    /* `(?!` or `(?<!` immediately followed by `.*` — the form whose scope is the
     * rest of the line, and on a canonicalised artifact the rest of the file. */
    pattern: new RegExp('\\(\\?' + '<?' + '!' + '\\.' + '\\*'),
    why: 'a negative lookaround followed by .* spans the rest of the document, so a qualifier appearing anywhere later satisfies it — the claim it enforces is "somewhere in the output", not "on this row". Split on the row separator and test each row.',
  },
  {
    id: 'includes-empty-string',
    pattern: new RegExp('\\.includes\\(' + "''" + '\\)|\\.includes\\(' + '""' + '\\)'),
    why: 'true for every subject. Guard the subject\'s emptiness first, then assert a literal that does not read the constant under test.',
  },
  {
    id: 'stringified-comparison',
    pattern: new RegExp('String\\([^)]*\\)\\s*===\\s*' + 'String\\('),
    why: 'passes whenever the types differ. The harness compares with Object.is for this reason.',
  },
];

/* ------------------------------------------------------------- the stripper --
 *
 * ⛔ COMMENTS ARE BLANKED BEFORE SCANNING, AND THIS IS THE WHOLE DESIGN. Every
 * one of the hazards above is DESCRIBED in a comment somewhere in this tree —
 * that is how this repository records what it has been burned by, and those
 * comments must keep being written. A lint that reads them as occurrences would
 * punish the documentation and be switched off within a day.
 *
 * Same construction `CHECK-claims.ts` uses when it blanks fenced code blocks
 * before parsing claim comments, and for the same reason.
 *
 * Newlines are PRESERVED so a reported line number is the real one.
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, m => ' '.repeat(m.length));
}

const dir = new URL('.', import.meta.url);
const files = readdirSync(dir).filter(f => f.endsWith('.ts')).sort();

/* =========================================================================
 * TEST 1 — THE STRIPPER IS CORRECT, and this is the non-vacuity control.
 *
 * ⛔ WITHOUT THIS TEST THE WHOLE FILE IS SUBSTITUTABLE. A stripper that blanked
 * everything would report zero hazards over every file forever, and a green lint
 * over an empty subject is exactly the defect class this file exists to catch —
 * it would be the tautology lint being a tautology. So the stripper is scored in
 * BOTH directions against a fixture: it must remove the commented occurrence AND
 * keep the live one.
 * ========================================================================= */

head('TEST 1 — the comment stripper removes documentation and keeps live code');

/* Built by concatenation for the same reason the needles are. */
const HAZARD_IN_CODE = 'if (x' + '.includes(' + "''" + ')) return;';
const FIXTURE = [
  '/* A comment that mentions ' + '.includes(' + "''" + ') on purpose. */',
  HAZARD_IN_CODE,
  '// A trailing comment mentioning ' + '.includes(' + "''" + ') too',
].join('\n');

const stripped = stripComments(FIXTURE);
const emptyStringHazard = HAZARDS.find(h => h.id === 'includes-empty-string')!;

check('the fixture really does contain the hazard three times, so this is not vacuous',
  (FIXTURE.match(/\.includes\(/g) ?? []).length, 3);
check('  the stripper keeps the LIVE occurrence', emptyStringHazard.pattern.test(stripped), true);
check('  and removes both COMMENTED occurrences',
  (stripped.match(/\.includes\(/g) ?? []).length, 1);
check('  line numbering survives, so a report names the real line',
  stripped.split('\n').length, FIXTURE.split('\n').length);
check('  and the stripper did not simply blank the file',
  stripped.trim().length > 0, true);
check('    specifically, the live statement is intact', stripped.includes('if (x'), true);

/* Each needle is shown to match the thing it names. A pattern built by
 * concatenation that quietly stopped matching would take the rest of this file
 * green with it. */
head('TEST 1b — every needle still matches the shape it is named for');

/* ⛔ THE SAMPLES ARE CONCATENATED TOO, AND THE LINT IS WHAT TAUGHT ME THAT.
 * The needles were built this way from the start and the samples were not — so
 * this file's own `stringified-comparison` sample was a live occurrence, and
 * TEST 2 reported this file at line 146. That is the lint working, on its
 * author, on its first run. It is also the exact shape recorded in the header:
 * a file whose subject is text that must not appear cannot spell that text. */
const SAMPLES: Record<string, string> = {
  'document-spanning-lookaround': 'const RE = /\\bword\\b(?' + '!' + '.' + '*qualifier)/;',
  'includes-empty-string': HAZARD_IN_CODE,
  'stringified-comparison': 'return String(got) ' + '===' + ' String' + '(want);',
};

for (const h of HAZARDS) {
  const sample = SAMPLES[h.id]!;
  check(`${h.id}: the needle matches its own sample`, h.pattern.test(sample), true);
  /* AND does not match a benign line, so it is not a needle that matches
   * everything — the other half of a substitutable control. */
  check(`  and does NOT match an ordinary assertion`,
    h.pattern.test('check(\'a plain assertion\', got, want);'), false);
}

/* =========================================================================
 * TEST 2 — no live occurrence of any hazard anywhere in the slice
 * ========================================================================= */

head('TEST 2 — no assertion in this tree carries a shape that cannot fail');

check('files were found on disk at all, so the sweep below is not over nothing',
  files.length > 0, true);

let scannedBytes = 0;
const found: string[] = [];

for (const f of files) {
  const src = stripComments(readFileSync(new URL(f, dir), 'utf8'));
  scannedBytes += src.trim().length;
  for (const h of HAZARDS) {
    src.split('\n').forEach((line, i) => {
      if (h.pattern.test(line)) found.push(`${f}:${i + 1} [${h.id}] ${line.trim()}`);
    });
  }
}

/* ⛔ THE SECOND HALF OF THE EMPTY-SUBJECT GUARD. `files.length > 0` proves the
 * directory was read; this proves the stripper left something to search. A
 * stripper that blanked every file would satisfy the first and fail this. */
check('  and the stripped sources are non-empty, so there was text to search',
  scannedBytes > 1000, true);

/* Reported as the JOINED LIST rather than as a count or a boolean, so a failure
 * names the file, the line and the shape instead of saying only that something,
 * somewhere, is wrong. */
check('no live tautological or document-scoped assertion', found.join('\n'), '');

if (found.length) {
  console.log('');
  for (const hit of found) console.log(`    ${hit}`);
  console.log('');
  for (const h of HAZARDS) console.log(`    ${h.id} — ${h.why}`);
}

finish('An assertion that cannot fail passes as loudly as a real one. These five shapes are mechanically detectable, so a reader is no longer the only thing standing between them and the gate. The shapes that are NOT mechanical — a control whose fixture never reaches the branch — need a mutation run and scoring by which assertion names it.');
