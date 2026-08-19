/* A claim declares its own falsifier, and this evaluates it — issue #62.
 *
 *   npx tsx CHECK-claims.ts
 *
 * No network, no .env, no token. Reads documents under the repository root.
 *
 * WHY THIS EXISTS. Twice now a single fact has gone stale across five documents
 * at once, and both times a person reading found it:
 *
 *   - S019: "the project is pre-build", still standing in five surfaces after
 *     PR #56 put source on `main`.
 *   - The #61 pass: "twelve research sweeps" against thirteen, in `PRODUCT.md`,
 *     `CONTEXT.md`, `docs/agents/domain.md` (twice), `docs/research/INDEX.md`
 *     and `.claude/state/checkpoint.md`.
 *
 * THE DESIGN IS DECLARED, NOT INFERRED, and that was a finding rather than a
 * preference. `docs/research/documented-claim-drift-prior-art.md` records that
 * the software literature builds *probabilistic* traceability recovery — IR link
 * reconstruction, learning-based comment-consistency detection — because the link
 * between a claim and its falsifier was never written down. Aerospace and nuclear
 * configuration management does not recover the link; it declares a baseline and
 * pays at write time. Finnish YVL B.1 #359 requires design documentation
 * "traceable to a frozen baseline". So a claim here carries its falsifier inline:
 *
 *   <!-- claim: count glob="docs/research/*.md" exclude="INDEX.md" equals=13 -->
 *   <!-- claim: exists path="slice/sys001.ts" -->
 *   <!-- claim: absent path="slice/unq001.ts" -->
 *
 * INLINE RATHER THAN A SIDECAR MANIFEST, deliberately. A manifest is a second
 * list that drifts from the first, which is #55's defect exactly. The comment
 * sitting next to the sentence is the whole mechanism: editing the sentence puts
 * the falsifier on screen.
 *
 * WHAT THIS DOES NOT COVER — stated, never implied away, following the same
 * discipline as `deref_check.py`'s header:
 *
 *   - TRACKER-BACKED STATUS ("gate 2 is open") needs the GitHub API. This suite
 *     runs inside `npm run check`, which is offline with no token, and that
 *     property is worth more than this class. It belongs in a CI step.
 *   - IDENTIFIER CLAIMS (a hook name, a constant's value) need a token-at-source
 *     table. `ReCite` (arXiv:2608.03734) is the published reference, repairing
 *     stale function references in Linux kernel comments.
 *   - PATH CLAIMS are covered by `deref_check.py` — which lives in the
 *     session-end skill on one machine, not in this repository. That coverage is
 *     weaker than it sounds and is not claimed here.
 *
 * A green run means every DECLARED claim holds. It does not mean the documents
 * are true. An unannotated sentence is unchecked, and most sentences are
 * unannotated.
 *
 * ⚠ THIS SUITE READS ABOVE ITS OWN PACKAGE, and that is a real coupling rather
 * than an oversight. `REPO` is `slice/..`, and the annotated documents live at the
 * repository root. `slice/` is documented as the tree that becomes the publishable
 * package once #8 lands. From that point — or in any CI job or extraction handed
 * only `slice/` — every claim here returns "evaluation failed" and the gate goes
 * red for a reason that has nothing to do with the product.
 *
 * *Revisit if:* `slice/` is renamed `src/`, loses `private: true`, or is built in
 * isolation. The answer then is a repository-root gate that runs this suite and the
 * package's own suites separately, not a path adjustment.
 */

import { readdirSync, existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHarness } from './CHECK-harness.js';

const { check, head, finish } = createHarness();

const HERE = dirname(fileURLToPath(import.meta.url));
/* The repository root, one level above this package. Every `path` and `glob` in
 * a claim is resolved against it, so a claim reads the same wherever it sits. */
const REPO = resolve(HERE, '..');

export type Claim = {
  kind: string;
  attrs: Record<string, string>;
  line: number;
};

export type Verdict = {
  ok: boolean;
  /** What the repository actually shows. Printed on failure; a bare FAIL is not a diagnosis. */
  observed: string;
};

/* The kind is `[A-Za-z0-9_-]+`, NOT `[a-z]+`. With the narrow class,
 * `<!-- claim: Absent ... -->` and `<!-- claim: count2 ... -->` match nothing, the
 * comment is invisible to the parser, and the sentence reads as guarded while
 * nothing checks it. A capitalised typo is exactly as likely as `exsits` and the
 * narrow class turned it into a silent pass — the opposite of what the paragraph
 * below promises. Match it here; reject it in `evaluate`'s default branch. */
const CLAIM = /<!--\s*claim:\s*([A-Za-z0-9_-]+)\s+([^>]*?)-->/g;
const ATTR = /([a-z]+)="([^"]*)"|([a-z]+)=(\d+)/g;
const FENCE = /^```[\s\S]*?^```/gm;

/**
 * Blank out fenced code blocks, preserving line numbers.
 *
 * A claim comment inside a fence is DOCUMENTATION OF THE SYNTAX, not an
 * assertion. `README.md` shows a real `equals=13` example inside a ```markdown
 * fence; without this, adding README to the annotated set would silently promote
 * a tutorial into a live claim, and editing the example to an illustrative wrong
 * value would fail the gate on a doc example.
 *
 * Newlines survive so `line` still points where a reader would look.
 */
function stripFences(text: string): string {
  return text.replace(FENCE, block => block.replace(/[^\n]/g, ''));
}

/**
 * Every claim in a document, with the line it sits on.
 *
 * The kind is captured rather than matched against a whitelist, so an unknown
 * kind reaches `evaluate` and fails loudly there. Filtering it out here would
 * make a typo — `<!-- claim: exsits ... -->` — silently vanish, which is a claim
 * that reads as checked and is not.
 */
export function parseClaims(text: string): Claim[] {
  const out: Claim[] = [];
  const scannable = stripFences(text);
  for (const m of scannable.matchAll(CLAIM)) {
    const attrs: Record<string, string> = {};
    for (const a of m[2]!.matchAll(ATTR)) {
      if (a[1]) attrs[a[1]] = a[2]!;
      else if (a[3]) attrs[a[3]] = a[4]!;
    }
    out.push({ kind: m[1]!, attrs, line: scannable.slice(0, m.index).split('\n').length });
  }
  return out;
}

/**
 * Files matching a deliberately narrow glob: `dir/sub/*.ext` and nothing else.
 *
 * NO GLOB ENGINE, ON PURPOSE. A dependency for this would be absurd, and a
 * hand-rolled general matcher is a bug farm. The narrowness is enforced rather
 * than documented — an unsupported pattern throws instead of silently matching
 * nothing, because a silent zero is how a count claim passes over an empty set.
 */
function expandGlob(glob: string, repo: string): string[] {
  const cut = glob.lastIndexOf('/');
  if (cut === -1) throw new Error(`glob must contain a directory: ${glob}`);
  const dir = glob.slice(0, cut);
  const pattern = glob.slice(cut + 1);
  /* EXACTLY ONE `*`, with an optional literal prefix before it: `*.md`,
   * `CHECK-*.ts`. Anything else throws. The prefix arrived because a real claim
   * needed `slice/CHECK-*.ts` and this function REFUSED IT at the gate rather
   * than matching nothing — which is the behaviour that makes a narrow matcher
   * safer than a permissive one. */
  const star = pattern.indexOf('*');
  if (star === -1 || pattern.indexOf('*', star + 1) !== -1 || !pattern.slice(star + 1).startsWith('.')) {
    throw new Error(`unsupported glob pattern "${pattern}" — only [prefix]*.ext is supported`);
  }
  const prefix = pattern.slice(0, star);
  const ext = pattern.slice(star + 1);
  return readdirSync(join(repo, dir))
    .filter(f => f.startsWith(prefix) && f.endsWith(ext))
    .sort();
}

/**
 * Evaluate one claim against the repository.
 *
 * NEVER THROWS. It returns a false verdict with an `observed` string instead,
 * including for a malformed claim or a missing directory. An earlier draft let
 * `expandGlob`'s `readdirSync` raise: renaming `docs/research/` produced an
 * uncaught ENOENT, `finish()` never ran, no tally printed, and every claim after
 * the throw went unevaluated. The gate still failed — with a stack trace naming
 * the wrong cause instead of the diagnosis this design promises.
 */
export function evaluate(claim: Claim, repo: string): Verdict {
  try {
    switch (claim.kind) {
      case 'count': {
        const glob = claim.attrs.glob;
        const equals = claim.attrs.equals;
        if (!glob || equals === undefined) return { ok: false, observed: 'claim is missing glob= or equals=' };
        const exclude = new Set((claim.attrs.exclude ?? '').split(',').map(s => s.trim()).filter(Boolean));
        const files = expandGlob(glob, repo).filter(f => !exclude.has(f));
        const want = Number(equals);
        return { ok: files.length === want, observed: `${files.length} file(s) match ${glob}` };
      }
      case 'exists': {
        const p = claim.attrs.path;
        if (!p) return { ok: false, observed: 'claim is missing path=' };
        const there = existsSync(join(repo, p));
        return { ok: there, observed: `${p} ${there ? 'exists' : 'does not exist'}` };
      }
      case 'absent': {
        const p = claim.attrs.path;
        if (!p) return { ok: false, observed: 'claim is missing path=' };
        /* THE PARENT DIRECTORY MUST EXIST, and this is the whole difference between
         * a control and a decoration. `absent` is a pure negative, so a mistyped
         * path — `slcie/req001.ts`, `req0001.ts` — is satisfied by a file that
         * never existed, and stays green forever INCLUDING after the thing it
         * guards ships. That is the vacuous-pass hole this repo has now found in
         * `requiredSection`, in `onDisk.length > 0`, and here. Requiring the
         * directory turns a typo into a loud failure. */
        const parent = dirname(join(repo, p));
        if (!existsSync(parent)) {
          return { ok: false, observed: `parent directory of ${p} does not exist — the path is probably mistyped` };
        }
        const there = existsSync(join(repo, p));
        return { ok: !there, observed: `${p} ${there ? 'exists' : 'does not exist'}` };
      }
      default:
        return { ok: false, observed: `unknown claim kind "${claim.kind}"` };
    }
  } catch (e) {
    return { ok: false, observed: `evaluation failed: ${(e as Error).message}` };
  }
}

/* ------------------------------------------------------------------ */

head('TEST 1 — the parser reads all three kinds, and does not quietly drop a typo');

/* THE FIXTURE DERIVES THE NUMBER; IT DOES NOT REPEAT IT.
 *
 * An earlier draft hard-coded `equals=13` here and asserted `13 file(s)` in
 * TEST 3. Adding a fourteenth sweep and correctly updating all six annotated
 * documents would then have failed the gate — inside the CHECKER, pointing at the
 * wrong thing. A literal here is a seventh copy of the scalar this suite exists
 * to retire, sitting in the retirer. These are unit tests of the EVALUATOR; the
 * real number is pinned by the real documents in TEST 6 and nowhere else. */
const SWEEPS = expandGlob('docs/research/*.md', REPO).filter(f => f !== 'INDEX.md').length;

/**
 * The `absent` fixture, and it names a file NOBODY WILL EVER BUILD.
 *
 * THIS WAS `slice/req001.ts` AND IT ROTTED THE DAY REQ001 SHIPPED. Three
 * assertions about the evaluator — "absent, true", "exists, false", and the
 * observed string that goes with it — all failed at once on #58, inside the
 * suite whose job is catching exactly that. The evaluator was correct; its
 * fixture had become a claim about the build.
 *
 * A unit test of the evaluator must not depend on the repository's own state.
 * The parent directory still exists, so the mistyped-path guard is still
 * exercised — this is a permanently-absent path, not an unreachable one.
 */
const NEVER_A_FILE = 'slice/there-is-deliberately-no-such-file.ts';

const FIXTURE = [
  'Thirteen files.',
  `<!-- claim: count glob="docs/research/*.md" exclude="INDEX.md" equals=${SWEEPS} -->`,
  'Source is on `main`.',
  '<!-- claim: exists path="slice/sys001.ts" -->',
  'A file that is not there.',
  `<!-- claim: absent path="${NEVER_A_FILE}" -->`,
  '<!-- claim: exsits path="slice/sys001.ts" -->',
].join('\n');

const parsed = parseClaims(FIXTURE);
check('four claims are found, including the misspelled one', parsed.length, 4);
check('  kind is captured verbatim', parsed[0]!.kind, 'count');
check('  a quoted attribute is read', parsed[0]!.attrs.glob, 'docs/research/*.md');
check('  a bare numeric attribute is read', parsed[0]!.attrs.equals, String(SWEEPS));
check('  the line number points at the claim', parsed[0]!.line, 2);
check('  the typo is PARSED, not filtered', parsed[3]!.kind, 'exsits');

head('TEST 2 — a true claim of each kind passes');

check('count, true', evaluate(parsed[0]!, REPO).ok, true);
check('exists, true', evaluate(parsed[1]!, REPO).ok, true);
check('absent, true', evaluate(parsed[2]!, REPO).ok, true);

head('TEST 3 — a FALSE claim of each kind fails, and says what it observed');

/* THE DIRECTION THAT MATTERS. A checker exercised only against true claims has
 * not been shown to fail; it has been shown to return. Each case below is the
 * in-suite equivalent of a mutation, and the observed string is asserted too
 * because a FAIL with no observed value cannot be acted on. */
const falseCount = parseClaims(`<!-- claim: count glob="docs/research/*.md" exclude="INDEX.md" equals=${SWEEPS + 1} -->`)[0]!;
const falseExists = parseClaims(`<!-- claim: exists path="${NEVER_A_FILE}" -->`)[0]!;
const falseAbsent = parseClaims('<!-- claim: absent path="slice/sys001.ts" -->')[0]!;

check('count, false', evaluate(falseCount, REPO).ok, false);
check('  and reports the real number', evaluate(falseCount, REPO).observed.startsWith(`${SWEEPS} file(s)`), true);
check('exists, false', evaluate(falseExists, REPO).ok, false);
check('  and names the missing path', evaluate(falseExists, REPO).observed, `${NEVER_A_FILE} does not exist`);
check('absent, false', evaluate(falseAbsent, REPO).ok, false);
check('  and names the present path', evaluate(falseAbsent, REPO).observed, 'slice/sys001.ts exists');
check('an unknown kind fails rather than passing', evaluate(parsed[3]!, REPO).ok, false);
check('  and says which kind it did not recognise', evaluate(parsed[3]!, REPO).observed, 'unknown claim kind "exsits"');

head('TEST 4 — a malformed claim throws rather than matching nothing');

/* A silent zero is how a count claim passes over an empty set. */
let threw = '';
try {
  expandGlob('docs/research/**', REPO);
} catch (e) {
  threw = (e as Error).message.slice(0, 22);
}
check('a ** glob is rejected', threw, 'unsupported glob patte');

check('a prefixed glob is supported', expandGlob('slice/CHECK-*.ts', REPO).every(f => f.startsWith('CHECK-') && f.endsWith('.ts')), true);
check('  and it does not match everything in the directory', expandGlob('slice/CHECK-*.ts', REPO).length < readdirSync(join(REPO, 'slice')).length, true);

let threw2 = '';
try {
  expandGlob('*.md', REPO);
} catch (e) {
  threw2 = (e as Error).message.slice(0, 21);
}
check('a directory-less glob is rejected', threw2, 'glob must contain a d');

head('TEST 5 — the empty-set control, and the three vacuous passes it does not cover');

check('a document with no claims yields zero, not a vacuous pass', parseClaims('# Title\n\nNo claims here.').length, 0);

/* A MISTYPED `absent` PATH IS THE PURE-NEGATIVE HOLE. Without the parent-directory
 * guard this returns ok, permanently, including after `REQ001` ships. */
const typoAbsent = parseClaims('<!-- claim: absent path="slcie/req001.ts" -->')[0]!;
check('a mistyped absent path FAILS rather than passing vacuously', evaluate(typoAbsent, REPO).ok, false);
check('  and says the parent directory is missing', evaluate(typoAbsent, REPO).observed.includes('parent directory'), true);

/* A CAPITALISED KIND USED TO MATCH NOTHING, so the comment was invisible and the
 * sentence read as guarded. It must reach `evaluate` and be rejected there. */
const capitalised = parseClaims('<!-- claim: Absent path="slice/sys001.ts" -->');
check('a capitalised kind is PARSED, not skipped', capitalised.length, 1);
check('  and is then rejected as unknown', evaluate(capitalised[0]!, REPO).ok, false);

/* A CLAIM INSIDE A FENCE IS DOCUMENTATION, NOT AN ASSERTION. README.md carries a
 * real `equals=` example in a ```markdown fence. */
const fenced = '# Doc\n\n```markdown\n<!-- claim: count glob="nope/*.md" equals=999 -->\n```\n\n<!-- claim: exists path="slice/scan.ts" -->\n';
const fencedClaims = parseClaims(fenced);
check('a claim inside a fence is ignored', fencedClaims.length, 1);
check('  and the one outside it survives', fencedClaims[0]!.kind, 'exists');
check('  and its line number is unshifted by the blanking', fencedClaims[0]!.line, 7);

/* A MISSING DIRECTORY RETURNS A VERDICT, NOT A STACK TRACE. */
const goneDir = parseClaims('<!-- claim: count glob="no-such-dir/*.md" equals=1 -->')[0]!;
check('a count over a missing directory returns a verdict', evaluate(goneDir, REPO).ok, false);
check('  and the observed string names the failure', evaluate(goneDir, REPO).observed.startsWith('evaluation failed:'), true);

head('TEST 6 — every claim in the annotated documents holds at HEAD');

/* THE LIST IS EXPLICIT AND THAT IS THE RESIDUAL RISK, stated rather than hidden.
 * A document annotated but not listed here is not checked. The alternative — walk
 * every .md in the repository — would sweep `docs/inputs/` and `docs/proof/`,
 * which are dated records that must NOT be corrected to match the present. */
const ANNOTATED = [
  'PRODUCT.md',
  'CONTEXT.md',
  'CLAUDE.md',
  'docs/agents/domain.md',
  'docs/research/INDEX.md',
  '.claude/state/checkpoint.md',
];

let totalClaims = 0;
for (const rel of ANNOTATED) {
  /* Read defensively for the same reason `evaluate` catches: a moved document
   * must produce a named failure, not an ENOENT that aborts the run before
   * `finish()` and leaves every later claim unevaluated. */
  let text = '';
  try {
    text = readFileSync(join(REPO, rel), 'utf8');
  } catch (e) {
    check(`  ${rel} is readable`, (e as Error).message, 'readable');
    continue;
  }
  const claims = parseClaims(text);
  check(`  ${rel} carries at least one claim`, claims.length > 0, true);
  totalClaims += claims.length;
  for (const c of claims) {
    const v = evaluate(c, REPO);
    check(`  ${rel}:${c.line} ${c.kind} — ${v.observed}`, v.ok, true);
  }
}

/* The suite-level empty-set guard: if every document lost its annotations, the
 * loop above would assert nothing and this file would go green having checked
 * nothing. Same hole `CHECK-suite-registration.ts` closes with `onDisk.length > 0`. */
check('claims were found across the annotated set at all', totalClaims > 0, true);

finish(
  'A claim carries its own falsifier and the gate evaluates it. Count and filesystem-status\n' +
  'claims ship; tracker-backed status and identifier claims are DEFERRED and named in the\n' +
  'header. A green run means every declared claim holds — not that the documents are true.',
);
