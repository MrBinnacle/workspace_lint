/* THROWAWAY. Live REF001 probe over Observed<T>.
 *
 *   npx tsx live-ref001.ts
 *
 * Read-only. The only endpoints called are GET /v1/pages/{id} and
 * GET /v1/blocks/{id}/children. Nothing is created, updated, moved or deleted.
 * Principle 7 holds at the call site, not only at the credential.
 *
 * The token is read from .env by this process and is NEVER printed. Every line
 * of output passes through scrub() before it reaches stdout.
 */

import { Client, APIResponseError } from '@notionhq/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/* Link recognition and the verdict live in their own modules so the offline
 * checks execute the SAME code this live run does. See CHECK-link-recognition.ts.
 * Spec: docs/spec/REF001-link-recognition.md. */
import { extractReferences, internalRefs, unrecognisedRefs, hyphenate } from './link-recognition.js';
import { deriveVerdict, type Gap } from './verdict.js';

/* ---------------------------------------------------------------- env ---- */

const HERE = dirname(fileURLToPath(import.meta.url));
const env: Record<string, string> = {};
for (const line of readFileSync(join(HERE, '..', '.env'), 'utf8').split(/\r?\n/)) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}

const TOKEN = env.NOTION_TOKEN ?? '';
const SECRETS = [TOKEN].filter(s => s.length > 8);

/** Nothing reaches stdout without passing through here. */
function scrub(s: string): string {
  let out = s;
  for (const sec of SECRETS) out = out.split(sec).join('«REDACTED»');
  return out.replace(/\b(ntn_|secret_)[A-Za-z0-9]{8,}/g, '«REDACTED»');
}
const say = (s = '') => console.log(scrub(s));

if (!TOKEN) { say('FATAL: NOTION_TOKEN is empty in .env. Nothing was called.'); process.exit(4); }

const need = (k: string) => {
  const v = env[k];
  if (!v) { say(`FATAL: ${k} is empty in .env. Nothing further was called.`); process.exit(4); }
  return v;
};

const notion = new Client({ auth: TOKEN, notionVersion: env.NOTION_VERSION || '2026-03-11', logLevel: 'error' as any });

/* ------------------------------------------------------- Observed<T> ---- */
/* No unwrap. No getOrThrow. There is deliberately no Observed<T> -> T. */

type Observed<T> =
  | { state: 'complete';    value: T }
  | { state: 'partial';     value: T; cause: string }
  | { state: 'unreachable'; cause: string };

const complete    = <T>(value: T): Observed<T> => ({ state: 'complete', value });
const partial     = <T>(value: T, cause: string): Observed<T> => ({ state: 'partial', value, cause });
const unreachable = <T>(cause: string): Observed<T> => ({ state: 'unreachable', cause });

function omap<A, B>(o: Observed<A>, f: (a: A) => B): Observed<B> {
  if (o.state === 'unreachable') return o;
  return o.state === 'partial' ? partial(f(o.value), o.cause) : complete(f(o.value));
}

function oall<T>(list: Observed<T>[]): Observed<T[]> {
  const causes: string[] = [], vals: T[] = [];
  for (const o of list) {
    if (o.state === 'unreachable') { causes.push(o.cause); continue; }
    if (o.state === 'partial') causes.push(o.cause);
    vals.push(o.value);
  }
  return causes.length ? partial(vals, causes.join(' · ')) : complete(vals);
}

/* ------------------------------------------------- the adapter seam ---- */
/* This is the ONLY place in the file that constructs an Observed. */

type Call = { endpoint: string; status: number | 'ok'; code?: string };
const CALLS: Call[] = [];

async function observe<T>(endpoint: string, fn: () => Promise<T>): Promise<Observed<T>> {
  try {
    const v = await fn();
    CALLS.push({ endpoint, status: 'ok' });
    return complete(v);
  } catch (e) {
    // Never log the error object: it can carry request context. Code and status only.
    if (e instanceof APIResponseError) {
      CALLS.push({ endpoint, status: e.status, code: e.code });
      if (e.status === 404) return unreachable(`404 ${e.code} on ${endpoint} — absent or inaccessible, indistinguishable`);
      if (e.status === 403) return unreachable(`403 ${e.code} on ${endpoint} — restricted`);
      if (e.status === 429) return unreachable(`429 rate_limited on ${endpoint}`);
      return unreachable(`${e.status} ${e.code} on ${endpoint}`);
    }
    CALLS.push({ endpoint, status: 0, code: 'transport' });
    return unreachable(`transport failure on ${endpoint}`);
  }
}

/** Paginated child listing. Truncation becomes `partial`, never a silent stop. */
async function listChildren(id: string, label: string, maxPages = 20): Promise<Observed<any[]>> {
  const acc: any[] = [];
  let cursor: string | undefined = undefined;
  for (let page = 0; page < maxPages; page++) {
    const step: Observed<any> = await observe(`GET /v1/blocks/${label}/children`, () =>
      notion.blocks.children.list({ block_id: id, page_size: 100, start_cursor: cursor }));
    if (step.state === 'unreachable') {
      return acc.length ? partial(acc, `${step.cause} — enumeration of ${label} stopped after ${acc.length} blocks`)
                        : unreachable(step.cause);
    }
    const r: any = step.value;
    acc.push(...(r.results ?? []));
    // Positive test only. Proof §1: absence of request_status is uninformative.
    if (r.request_status?.type === 'incomplete')
      return partial(acc, `request_status incomplete (${r.request_status.incomplete_reason}) on ${label}`);
    if (!r.has_more) return complete(acc);
    cursor = r.next_cursor;
  }
  return partial(acc, `enumeration of ${label} abandoned after ${maxPages} pages — remaining count unknown`);
}

/* ------------------------------------------------- link extraction ---- */
/* Moved to link-recognition.ts and specified in
 * docs/spec/REF001-link-recognition.md.
 *
 * The host list narrowed as a result. It previously admitted notion.so,
 * www.notion.so, notion.com and www.notion.com; none of those has a locator, so
 * spec §2.1 marks them `not checked` and §7 makes "no host without a locator"
 * non-negotiable. They now travel the residue path, which costs precision and
 * not soundness. Only app.notion.com is observed; only *.notion.site is
 * documented.
 *
 * The residue is no longer a hand-pushed finding either. It enters the coverage
 * manifest, and SYS001 derives from the manifest — see report(). */

type Link = { targetId: string; via: string; sourceBlock: string };

/* ----------------------------------------------------- the scan ------- */

type Stage = 'declared' | 'resolved' | 'enumerated' | 'fetched' | 'evaluated';
/* Keyed by the native object ID, never by title.
 *
 * CONTEXT.md settled default: "Identity is the stable ID. Names are report-only
 * aliases." The first live run keyed this map on titles and counted
 * wl-revoke-parent twice — once as "revoke-parent" from the proof §4 check and
 * once as "wl-revoke-parent" from the child walk. The denominator read 5 for 4
 * resources. A title-keyed manifest inflates its own coverage ratio. */
const manifest = new Map<string, { alias: string; stages: Set<Stage>; cause: string }>();
const mark = (id: string, alias: string, s: Stage, cause = '') => {
  const key = hyphenate(id) ?? id;
  const e = manifest.get(key) ?? { alias, stages: new Set<Stage>(), cause: '' };
  if (alias && !e.alias.startsWith('wl-')) e.alias = alias;
  e.stages.add(s); if (cause) e.cause = cause;
  manifest.set(key, e);
};

type Finding = { rule: string; resource: string; certainty: string; target_state?: string; detail: string; bounded: boolean; isRootMiss?: boolean };
const findings: Finding[] = [];

async function main() {
  const ROOT = need('FIXTURE_ROOT_ID');
  const UNSHARED = env.UNSHARED_PAGE_ID || '';
  const REVOKE_PARENT = env.REVOKE_PARENT_ID || '';
  const REVOKE_CHILD = env.REVOKE_CHILD_ID || '';

  say('workspace_lint — LIVE REF001 probe over Observed<T>');
  say(`Notion-Version: ${env.NOTION_VERSION || '2026-03-11'} · read-only · ${new Date().toISOString()}`);
  say('');

  /* -- identity check, and it is also the auth check --------------------- */
  const me = await observe('GET /v1/users/me', () => notion.users.me({}));
  if (me.state === 'unreachable') {
    say(`AUTH FAILED — ${me.cause}`);
    say('EXIT 4 — the scan did not run as declared.');
    process.exit(4);
  }
  say(`bot identity ok — ${(me as any).value?.name ?? '(unnamed)'} (${(me as any).value?.type ?? '?'})`);
  say('');

  /* -- declared root ----------------------------------------------------- */
  mark(ROOT, 'wl-proof-fixture', 'declared');
  const root = await observe('GET /v1/pages/{root}', () => notion.pages.retrieve({ page_id: ROOT }));
  if (root.state === 'unreachable') {
    findings.push({ rule: 'SYS001', resource: 'root', certainty: 'confirmed', bounded: true, isRootMiss: true,
      detail: `A declared root was never reached — ${root.cause}` });
    return report();
  }
  mark(ROOT, 'wl-proof-fixture', 'resolved');
  say('declared root resolved.');

  /* -- enumerate the root ------------------------------------------------ */
  const rootBlocks = await listChildren(ROOT, 'root');
  mark(ROOT, 'wl-proof-fixture', 'enumerated', rootBlocks.state === 'partial' ? rootBlocks.cause : '');
  if (rootBlocks.state === 'unreachable') {
    findings.push({ rule: 'SYS001', resource: 'root', certainty: 'confirmed', bounded: false,
      detail: `Root enumeration failed — ${rootBlocks.cause}` });
    return report();
  }
  mark(ROOT, 'wl-proof-fixture', 'fetched');
  const blocks = rootBlocks.value;
  say(`root enumerated — ${blocks.length} blocks (${rootBlocks.state}).`);

  /* The applicable set is built from the ENUMERATED blocks, not from the subset
   * this code knows how to classify. wl-dataset is a child_database, and counting
   * only child_page produced a coverage ratio of 2/2 over a root with three
   * children — a denominator that shrinks to match the scan's own blind spots. */
  const childRes = blocks.filter(b => b.type === 'child_page' || b.type === 'child_database');
  say(`child resources under root: ${childRes.length} — ${childRes.map(b => `${b.child_page?.title ?? b.child_database?.title} (${b.type})`).join(', ') || '(none)'}`);
  for (const c of childRes) {
    const label = String(c.child_page?.title ?? c.child_database?.title ?? c.id);
    mark(c.id, label, 'declared'); mark(c.id, label, 'resolved');
  }

  /* -- proof §4 re-check: does the revoked child appear anywhere? -------- */
  if (REVOKE_PARENT) {
    const rp = await listChildren(REVOKE_PARENT, 'revoke-parent');
    if (rp.state === 'unreachable') {
      say(`revoke-parent — ${rp.cause}`);
    } else {
      const kids = rp.value.filter(b => b.type === 'child_page');
      say(`revoke-parent enumerated — ${rp.value.length} blocks, ${kids.length} child_page.`);
      const childId = hyphenate(REVOKE_CHILD) ?? '';
      const listed = rp.value.some(b => hyphenate(b.id) === childId);
      say(`  wl-revoke-child listed in the parent's children? ${listed ? 'YES' : 'NO'}`);
      if (!listed) {
        say('  → proof §4 RE-CONFIRMED LIVE: the child is invisible, not named-but-unreadable.');
        say('    It never enters the applicable set, so no rule can produce a finding about it.');
      }
      mark(REVOKE_PARENT, 'wl-revoke-parent', 'declared'); mark(REVOKE_PARENT, 'wl-revoke-parent', 'resolved');
      mark(REVOKE_PARENT, 'wl-revoke-parent', 'enumerated'); mark(REVOKE_PARENT, 'wl-revoke-parent', 'fetched');
    }
  }

  /* -- descend one level into child pages -------------------------------- */
  for (const c of childRes) {
    const label = String(c.child_page?.title ?? c.child_database?.title ?? c.id);
    if (c.type === 'child_database') {
      mark(c.id, label, 'enumerated', 'data-source enumeration not implemented in this prototype');
      continue;   // a NAMED gap. Bounded, because the resource has a name.
    }
    const kids = await listChildren(c.id, label);
    if (kids.state === 'unreachable') { mark(c.id, label, 'resolved', kids.cause); continue; }
    mark(c.id, label, 'enumerated', kids.state === 'partial' ? kids.cause : '');
    mark(c.id, label, 'fetched');
    say(`  ${label}: ${kids.value.length} blocks (${kids.state})`);
    blocks.push(...kids.value);            // their links join the REF001 pass below
    if (kids.state === 'complete') mark(c.id, label, 'evaluated');
    else findings.push({ rule: 'SYS001', resource: label, certainty: 'confirmed', bounded: false,
      detail: `Enumeration incomplete — ${kids.cause}` });
  }

  /* -- REF001 ------------------------------------------------------------ */
  say('');
  say('REF001 — resolving every internal link found in readable content.');
  const refs = extractReferences(blocks);
  const links: Link[] = internalRefs(refs).map(r => ({ targetId: r.targetId, via: r.via, sourceBlock: r.sourceBlock }));
  const unrecognised = unrecognisedRefs(refs);
  say(`  ${links.length} link(s) discovered: ${links.map(l => l.via).join(', ') || '(none)'}`);

  /* The synthetic control is OPT-IN (`--control`). It was the default in the first
   * live run and it hid the extractor defect: a probe of a known-bad ID passes the
   * red test whether or not link DISCOVERY works. A control that can substitute for
   * the mechanism under test is not a control. */
  if (process.argv.includes('--control') && UNSHARED && !links.some(l => l.targetId === hyphenate(UNSHARED))) {
    say('  --control: injecting UNSHARED_PAGE_ID directly. This does NOT exercise link discovery.');
    links.push({ targetId: hyphenate(UNSHARED)!, via: 'control(synthetic)', sourceBlock: 'root' });
  }

  /* Spec §5. Each unrecognised candidate is ONE drop-out at the Evaluated stage,
   * entered in the manifest and never pushed onto the findings list by hand.
   * SYS001 derives from the manifest in report(); a second copy of the coverage
   * data drifts, and results-ref001-live.md §4 records it drifting toward the
   * flattering answer. The drop-out is bounded: it names the containing block
   * and quotes the href verbatim, so it can be counted and each member named. */
  if (unrecognised.length) {
    say(`  !! ${unrecognised.length} href(s) could not be classified as internal or external:`);
    for (const u of unrecognised) {
      say(`     [${u.cause}] ${u.href}`);
      manifest.set(`unrecognised-link:${u.href}`, {
        alias: `«link ${u.href.slice(0, 28)}…»`,
        stages: new Set<Stage>(['declared', 'resolved', 'enumerated', 'fetched']),
        cause: `${u.cause} — block ${u.sourceBlock}`,
      });
    }
  }

  if (UNSHARED) {
    const found = links.some(l => l.targetId === hyphenate(UNSHARED));
    say(`  control check — is the known dead link among the DISCOVERED links? ${found ? 'YES' : 'NO'}`);
    if (!found) say('     → link discovery is not working. Any clean verdict below is false.');
  }

  const resolutions: Observed<any>[] = [];
  for (const l of links) {
    const t = await observe(`GET /v1/pages/${l.targetId.slice(0, 8)}…`, () => notion.pages.retrieve({ page_id: l.targetId }));
    resolutions.push(t);
    if (t.state === 'unreachable') {
      findings.push({ rule: 'REF001', resource: 'root', certainty: 'confirmed', target_state: 'unreachable', bounded: true,
        detail: `Link (${l.via}) to ${l.targetId} cannot be resolved — ${t.cause}` });
      say(`  REF001 FIRES — ${l.via} → ${l.targetId.slice(0, 8)}…  certainty: confirmed, target_state: unreachable`);
    } else {
      say(`  resolves — ${l.via} → ${l.targetId.slice(0, 8)}…  target_state: present`);
    }
  }
  const allTargets = oall(resolutions);
  say(`  aggregate over link targets: ${allTargets.state}${allTargets.state !== 'complete' ? ' — partiality propagated upward' : ''}`);
  mark(ROOT, 'wl-proof-fixture', 'evaluated');

  report();
}

/* ---------------------------------------------------- report ---------- */

function report() {
  /* SYS001 is DERIVED from the manifest, never pushed by hand.
   *
   * The first live run maintained the two independently and they disagreed: the
   * manifest showed wl-dataset stalled at `enumerated`, the findings list was
   * empty of gaps, and the exit byte read 1 instead of 3. A coverage rule whose
   * input is a second copy of the coverage data will drift from it, and it will
   * drift in the flattering direction. One source of truth. */
  for (const [id, v] of manifest) {
    if (v.stages.has('evaluated')) continue;
    const cause = v.cause || 'left the funnel before evaluation, cause unrecorded';
    findings.push({ rule: 'SYS001', resource: v.alias, certainty: 'confirmed',
      bounded: !/remaining count unknown|abandoned/.test(cause),
      detail: `Applicable resource was not evaluated — ${cause}` });
  }

  /* One implementation of the verdict, shared with CHECK-link-recognition.ts.
   * The exit byte and the manifest were maintained separately in the first live
   * run and disagreed — the byte read 1 where the contract required 3. */
  const gapFindings = findings.filter(f => f.rule === 'SYS001');
  const violations = findings.filter(f => f.rule !== 'SYS001');
  const gaps: Gap[] = gapFindings.map(g => ({
    resource: g.resource, cause: g.detail, bounded: g.bounded, isRootMiss: g.isRootMiss,
  }));

  const v = deriveVerdict({
    applicable: manifest.size,
    evaluated: [...manifest.values()].filter(m => m.stages.has('evaluated')).length,
    gaps,
    violations: violations.length,
    /* No baseline exists in this prototype, so every finding is new and
     * unsuppressed by construction. */
    newUnsuppressedFindings: findings.length,
    coverageThreshold: Number(env.COVERAGE_THRESHOLD ?? 1),
  });
  const { disposition, applicable, evaluated, exit, why } = v;

  say('');
  say('──────── COVERAGE MANIFEST ────────');
  const STAGES: Stage[] = ['declared', 'resolved', 'enumerated', 'fetched', 'evaluated'];
  for (const [, v] of manifest)
    say(`  ${v.alias.padEnd(18)} ${STAGES.map(s => (v.stages.has(s) ? '●' : '○')).join(' ')}  ${v.cause}`);
  say(`  ${''.padEnd(18)} ${STAGES.map(s => s[0]).join(' ')}   (declared resolved enumerated fetched evaluated)`);

  say('');
  say('──────── FINDINGS ────────');
  if (!findings.length) say('  none');
  for (const f of findings)
    say(`  ${f.rule}  ${f.resource}  certainty=${f.certainty}  target_state=${f.target_state ?? '—'}  ${f.bounded ? 'bounded' : 'UNBOUNDED'}\n        ${f.detail}`);

  say('');
  say('──────── REPORT ────────');
  say(`  disposition:     ${disposition}${disposition === 'disclaimed' ? '   ← NO SUMMARY VERDICT RENDERED' : ''}`);
  say(`  coverage ratio:  ${evaluated}/${applicable}`);
  say(`  conformity:      ${violations.length ? 'violates' : disposition === 'disclaimed' ? 'withheld' : 'conforms'}`);
  say(`  exit:            ${exit}   (${why})`);

  say('');
  say('──────── CALLS MADE (read-only) ────────');
  for (const c of CALLS) say(`  ${String(c.status).padEnd(4)} ${c.code ?? ''} ${c.endpoint}`);

  process.exit(exit);
}

main().catch(e => {
  say(`UNHANDLED: ${scrub(String(e?.message ?? e))}`);
  process.exit(4);
});
