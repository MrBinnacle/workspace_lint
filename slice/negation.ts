/* A negative claim about the vendor must say which kind of negative it is — #125.
 *
 * The mechanism. `CHECK-negation.ts` is the suite over it.
 *
 * ⛔ THERE IS DELIBERATELY NO BASELINE GENERATOR. One existed for the initial
 * twenty-two entries and was deleted in the same commit. A regenerate command is
 * a one-keystroke route to accepting every new negative claim in the repository
 * at once, which is precisely the debt this file exists to make expensive.
 * `negation-baseline.json` is edited by hand, one entry at a time, and the digest
 * is printed by the suite next to the sentence so adding one is a copy rather
 * than a computation.
 *
 * WHY THIS EXISTS, AND WHY IT IS THE CHEAPEST CHECK IN THE REPOSITORY.
 *
 * On 2026-08-19 four assumptions about Notion were checked against the vendor's
 * own pages. FOUR REVERSALS, ALL IN THE SAME DIRECTION — toward "cannot". Zero
 * errors the other way. The largest of them, `#51`, was carried for four
 * sessions as "THE CEILING": `notion-port.ts` had no method for an endpoint, and
 * the absence of the method on OUR port was written down as a property of
 * NOTION, then cited as the constraint gating the project's only cheap evidence
 * route.
 *
 * `docs/research/vendor-assumption-drift-prior-art.md` §4 names what that is, and
 * the name is forty years old. "The API cannot do X", derived from "we looked and
 * found no way", is not a negation at all. It is NEGATION AS FAILURE under a
 * closed-world assumption. DOI 10.1155/2013/632319, on the distinction:
 *
 *   "strong negation explicitly says that the negation of a formula succeeds,
 *    whereas negation as failure says that the formula does not succeed, but also
 *    that it does not explicitly fail either. In other words, negation as failure
 *    can be read as 'it is not currently believed that.'"
 *
 * So our four reversals are A TYPE ERROR VISIBLE ON THE FACE OF THE SENTENCE.
 * Detecting them needs no network call, no vendor corpus and no model — which is
 * why this exists before any of those.
 *
 * AND IT EXPLAINS FOUR-OF-FOUR WITHOUT APPEALING TO BIAS. A positive claim is
 * MONOTONIC under vendor change: Notion shipping a new feature cannot falsify
 * "the API does X". A negation-as-failure claim is NONMONOTONIC by construction,
 * and the vendor shipping ANYTHING AT ALL is the new information. Negative claims
 * are the only class a vendor's forward development can falsify by addition. The
 * direction of our errors is a property of the sentence type, not of the authors.
 *
 * WHAT THIS IS, PRECISELY. It is the FIRST CHECK IN THIS REPOSITORY THAT FLAGS AN
 * UNANNOTATED SENTENCE. `CHECK-claims.ts` evaluates claims that were declared;
 * its header states the standing limit — "an unannotated sentence is unchecked,
 * and most sentences are unannotated". This closes that hole for exactly one
 * sentence class: the one where every measured error occurred.
 *
 * THE THREE MARKERS. A flagged sentence must carry one of:
 *
 *   <!-- claim: vendor url="…" fetched="…" quote="…" -->
 *       STRONG NEGATION. The vendor asserts the negative in its own words.
 *   <!-- nmf -->
 *       NEGATION AS FAILURE, declared. Reads as "it is not currently believed
 *       that". Honest, cheap, and the correct marker for most sentences here.
 *   an entry in negation-baseline.json
 *       ACCEPTED DEBT.
 *
 * BASELINE, NOT SUPPRESSION — the product's own ADR-0008 decision 1 distinction,
 * turned on the repository that ships it. A baselined hit STAYS VISIBLE in the
 * suite's output and does not fail the run; an unbaselined hit does. Without it a
 * new check over ~180 existing assertions is red on day one and gets deleted.
 *
 * ⛔ AND THE BASELINE IS THE ONLY ROUTE FOR AN ADR. "ADRs are never edited in
 * place" is a standing constraint, so fifteen of the twenty-two sentences found
 * on 2026-08-19 CANNOT be marked. Their entries are permanent by design rather
 * than debt to be paid down, and that is not a defect in either rule.
 *
 * ⛔ A STALE BASELINE ENTRY FAILS. An entry whose sentence no longer appears is
 * removed, not left. This is the vacuous-pass hole this repository has now found
 * in `requiredSection`, in `onDisk.length > 0`, and in the `absent` claim kind: a
 * baseline that accumulates dead entries reports more coverage than it has, which
 * is this product's own defect class arriving in its own instrument.
 *
 * WHAT THIS DOES NOT COVER — stated, never implied away.
 *
 *   - IT CANNOT TELL WHETHER A MARKED CLAIM IS TRUE. `<!-- nmf -->` is a type
 *     declaration, not evidence. A sentence marked nmf is correctly typed and may
 *     still be wrong about the world.
 *   - IT CANNOT SEE A NEGATIVE STATED WITHOUT A NEGATIVE WORD. "The grant is
 *     opaque to the integration" asserts a limit and matches nothing here.
 *     Paraphrase defeats a lexical detector, and no baseline entry records that.
 *   - IT DOES NOT DISTINGUISH A CLAIM ABOUT NOTION FROM A CLAIM ABOUT THIS
 *     PRODUCT. The vendor-token test is a heuristic. False positives land in the
 *     baseline, which is the safe direction; false negatives are invisible.
 *   - IT DOES NOT FETCH. The `vendor` marker's URL is checked for FORM only, by
 *     CHECK-claims.ts. The byte-for-byte re-fetch is a separate opt-in script,
 *     because the gate is offline and that property is worth more than this class.
 *
 * A green run means every negative sentence it can see is TYPED. It does not mean
 * the negatives are true.
 */

import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

/* ------------------------------------------------------------- the lexicon -- */

/**
 * Words that assert a negative capability.
 *
 * `\bno\b` is DELIBERATELY ABSENT. It matches "no other tool", "no price" and
 * "no baseline file" — none of which is a claim about what the vendor can do —
 * and it would drown the signal. `no endpoint` and `there is no` are kept because
 * both name a thing that would have to exist.
 */
export const NEGATIVES = [
  /\bcannot\b/i,
  /\bcan't\b/i,
  /\bcould not\b/i,
  /\bimpossible\b/i,
  /\bunable to\b/i,
  /\bno endpoint\b/i,
  /\bthere is no\b/i,
  /\bthere are no\b/i,
  /\bdoes not support\b/i,
  /\bdo not support\b/i,
  /\bnever returns\b/i,
  /\bnot possible\b/i,
  /\bnot available\b/i,
  /\bnothing returns\b/i,
];

/**
 * Tokens that make a sentence a claim about the VENDOR rather than about us.
 *
 * This is the heuristic half and it is stated as such. `connection` and
 * `workspace` are in this project's own glossary as well as Notion's, so they are
 * omitted — including them makes every coverage sentence a vendor claim.
 */
export const VENDOR = [
  /\bNotion\b/,
  /\/v1\//,
  /\bendpoint\b/i,
  /\bthe API\b/i,
  /\bintegration\b/i,
  /\bSDK\b/,
  /\bvendor\b/i,
  /\bPAT\b/,
];

/** Markers that type a sentence. `nmf` is bare; `vendor` is a claim comment. */
const MARK_NMF = /<!--\s*nmf\s*-->/;
const MARK_VENDOR = /<!--\s*claim:\s*vendor\s/;

const FENCE = /^```[\s\S]*?^```/gm;

/** Blank fenced blocks, preserving line numbers — same rule as CHECK-claims.ts. */
export function stripFences(text: string): string {
  return text.replace(FENCE, block => block.replace(/[^\n]/g, ''));
}

export type Hit = {
  file: string;
  line: number;
  /** The sentence, normalised. What the digest is taken over. */
  sentence: string;
  digest: string;
  marked: 'nmf' | 'vendor' | null;
};

/**
 * The identity of a flagged sentence.
 *
 * DIGEST OF THE SENTENCE, NEVER THE LINE NUMBER. ADR-0010 forbids a fingerprint
 * containing anything volatile, and a line number is the most volatile field in a
 * document — inserting a paragraph above renumbers every entry below it and
 * invalidates the whole baseline at once. Editing the SENTENCE re-raises it,
 * which is the behaviour we want: changing the words is when the type should be
 * re-examined.
 */
export function digestOf(file: string, sentence: string): string {
  return createHash('sha256').update(`${file} ${sentence}`).digest('hex').slice(0, 12);
}

/** Whitespace-collapsed, so a reflow does not re-raise every entry in the file. */
export const normalise = (s: string): string => s.replace(/\s+/g, ' ').trim();

/**
 * Every negative-capability sentence in one document, with its marker state.
 *
 * THE UNIT IS THE SENTENCE, NOT THE LINE. This repository writes long paragraph
 * lines — `CONTEXT.md` line 154 is over 300 characters — so a line-level digest
 * would re-raise on any edit anywhere in the paragraph and the baseline would
 * never hold still.
 *
 * A marker counts when it is on the SAME LINE or within the next three, which is
 * where every existing claim comment in this repository sits.
 */
export function findNegations(text: string, file: string): Hit[] {
  const scannable = stripFences(text);
  const lines = scannable.split('\n');
  const out: Hit[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    /* A marker line is not itself a claim. Without this the `vendor` marker's own
     * quote= text is scanned, and a vendor sentence asserting a negative flags
     * the very comment that types it. */
    if (MARK_NMF.test(line) || MARK_VENDOR.test(line)) continue;

    const window = lines.slice(i, i + 4).join('\n');
    const marked: Hit['marked'] = MARK_VENDOR.test(window) ? 'vendor' : MARK_NMF.test(window) ? 'nmf' : null;

    for (const sentence of line.split(/(?<=[.!?])\s+/)) {
      const s = normalise(sentence);
      if (!s) continue;
      if (!NEGATIVES.some(r => r.test(s))) continue;
      if (!VENDOR.some(r => r.test(s))) continue;
      out.push({ file, line: i + 1, sentence: s, digest: digestOf(file, s), marked });
    }
  }
  return out;
}

/* --------------------------------------------------------------- the scope -- */

/** Decision surfaces only. `docs/research/` and `docs/proof/` are evidence, appended not decided. */
export function scannedFiles(repo: string): string[] {
  const out = ['CONTEXT.md', 'PRODUCT.md'];
  for (const dir of ['docs/adr', 'docs/spec']) {
    if (!existsSync(join(repo, dir))) continue;
    for (const f of readdirSync(join(repo, dir)).filter(n => n.endsWith('.md')).sort()) out.push(`${dir}/${f}`);
  }
  return out;
}

export type Baseline = { digest: string; file: string; note: string }[];

export function loadBaseline(repo: string): Baseline {
  const p = join(repo, 'slice', 'negation-baseline.json');
  if (!existsSync(p)) return [];
  return JSON.parse(readFileSync(p, 'utf8')) as Baseline;
}

export type Audit = {
  hits: Hit[];
  /** Flagged, unmarked, and not in the baseline. These fail the run. */
  unaccounted: Hit[];
  /** In the baseline, and no longer present in any document. These also fail. */
  stale: Baseline;
};

export function audit(repo: string, baseline: Baseline): Audit {
  const hits: Hit[] = [];
  for (const f of scannedFiles(repo)) {
    if (!existsSync(join(repo, f))) continue;
    hits.push(...findNegations(readFileSync(join(repo, f), 'utf8'), f));
  }
  const seen = new Set(hits.map(h => h.digest));
  const based = new Set(baseline.map(b => b.digest));
  return {
    hits,
    unaccounted: hits.filter(h => h.marked === null && !based.has(h.digest)),
    stale: baseline.filter(b => !seen.has(b.digest)),
  };
}
