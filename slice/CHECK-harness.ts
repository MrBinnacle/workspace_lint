/* The assertion harness both check suites run through.
 *
 * ONE COPY, AND THE COMPARISON IS STRICT. Both suites previously carried their
 * own `check()` comparing `String(got) === String(want)`, which passes when the
 * types differ: `check('x', 1, '1')` is green, and so is `check('x', [1], '1')`.
 * A loose comparison inside the instrument that certifies this product's
 * honesty is the product's own defect class — a system reporting success over
 * an unverified state — sitting in the last place anything would check.
 *
 * `Object.is` rather than `===` so that NaN equals NaN and -0 does not equal 0.
 * Stringification survives only in the MESSAGE, where its job is display.
 *
 * Values that are not primitives must be reduced to a primitive by the CALLER,
 * because only the caller knows which property it means. `check('ids', set.size,
 * 4)` states its subject; `check('ids', set, 4)` does not.
 */

export type Harness = {
  /** One assertion. Prints PASS or FAIL and records the failure. */
  check(name: string, got: unknown, want: unknown): void;
  /** A section heading. */
  head(title: string): void;
  /** Prints the tally and exits 0 on a clean run, 1 otherwise. */
  finish(closingNote: string): never;
};

const show = (v: unknown): string => (typeof v === 'string' ? v : String(v));

/**
 * One section of a rendered report, by its heading.
 *
 * ASSERTING SECTION MEMBERSHIP REQUIRES CUTTING THE SECTION OUT. The suites
 * previously wrote `/GAPS[\s\S]*<id>/`, which spans the whole remainder of the
 * report: an ID appearing only in CALLS MADE satisfied a test claiming it
 * appeared in GAPS. That is the same hole the title-redaction test exists to
 * close — green in the section it was asserted over, broken elsewhere — this
 * time inside the assertion itself.
 */
export function reportSection(rendered: string, heading: string): string {
  const start = rendered.indexOf(`──────── ${heading} ────────`);
  if (start === -1) return '';
  const rest = rendered.slice(start + heading.length + 20);
  const end = rest.indexOf('────────');
  return end === -1 ? rest : rest.slice(0, end);
}

export function createHarness(): Harness {
  let fails = 0;

  return {
    check(name, got, want) {
      const ok = Object.is(got, want);
      if (!ok) fails++;
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: got=${show(got)} want=${show(want)}`);
    },

    head(title) {
      console.log(`\n== ${title} ==`);
    },

    finish(closingNote) {
      console.log('');
      console.log(fails === 0 ? 'ALL CHECKS PASS' : `${fails} CHECK(S) FAILED`);
      console.log(closingNote);
      process.exit(fails === 0 ? 0 : 1);
    },
  };
}
