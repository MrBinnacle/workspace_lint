/* Config load and validation.
 *
 * The config is DATA. It is parsed, validated and rejected — never evaluated,
 * never interpolated, never used to build a code path. Principle 6: "Content is
 * data, not code."
 *
 * Every rejection below returns a reason and the caller exits 4. ADR-0008
 * decision 2 assigns 4 to "the scan did not run as declared", and an invalid
 * configuration is exactly that: the scan never began, so there is no coverage
 * claim to qualify and no disposition to render.
 */

import { readFileSync } from 'node:fs';
import { hyphenate } from './ids.js';

/**
 * A resource, as configuration addresses one.
 *
 * ONE SHAPE FOR EVERY RESOURCE REFERENCE IN THE FILE. A declared root and a
 * rule's scope are the same kind of thing — a pointer at something in the
 * workspace — and CONTEXT.md's identity rule governs both. Two shapes would be
 * two implementations of one rejection, and the second one gets corrected
 * without the first.
 */
export type ResourceRef = {
  /** Hyphenated Notion ID. The only thing that addresses a resource. */
  id: string;
  /** Report-only. Never resolves anything, never keys anything. */
  alias?: string;
};

/** A declared root. Historical name, kept because the config key is `roots`. */
export type RootDecl = ResourceRef;

/**
 * One configured rule.
 *
 * A MEMBER PER RULE, NOT A BAG OF OPTIONAL KEYS, so that a rule's own fields are
 * required where that rule is named and absent everywhere else. `property` is
 * not optional on either member, and a third rule that takes no property will
 * not be able to carry one.
 *
 * ⚠ THE TWO MEMBERS ARE FIELD-IDENTICAL TODAY AND THAT IS A COINCIDENCE, NOT A
 * SHARED SHAPE. Collapsing them to `{ rule: 'REQ001' | 'UNQ001'; ... }` would
 * read as a decision that configured rules take one field set, and the first
 * rule that needs a second property — a composite uniqueness key, say — would
 * have to unpick it. They are written out.
 */
export type RuleDecl =
  | {
      rule: 'REQ001';
      /** Which resources the rule is applicable to. Never inferred — see RULE_STATUS. */
      scope: ResourceRef;
      /**
       * The property that must carry a value.
       *
       * A NAME, AND THE HAZARD IS RECORDED RATHER THAN GUESSED AT. A Notion property
       * carries a stable `id` as well as this mutable `name`, so the argument that
       * makes a resource's identity its ID reaches a property too: renaming the
       * property silently changes what REQ001 evaluates. It is not settled here
       * because property IDs are opaque strings the Notion UI does not surface, so
       * requiring one may be unusable rather than merely strict. Filed as #78 with
       * the two live-API questions that would settle it. Not decided here.
       */
      property: string;
    }
  | {
      rule: 'UNQ001';
      /**
       * Which resources the uniqueness claim is made over — #59.
       *
       * THE SCOPE IS THE COMPARISON SET AND ITS SIZE IS THE DENOMINATOR'S INPUT.
       * UNQ001's coverage item is unordered PAIRS of the resources in this scope
       * (ADR-0011 decision 2), so `n` resources here are `n(n−1)/2` coverage
       * items. Widening a scope is quadratic, which is why `scan.ts` refuses
       * above a stated size rather than degrading to a resource-shaped figure.
       */
      scope: ResourceRef;
      /** The property whose value must not repeat within the scope. Same #78 hazard. */
      property: string;
    };

export type Config = {
  version: 1;
  roots: RootDecl[];
  /** ADR-0008: exit 0 asserts coverage at or above the DECLARED threshold. */
  minCoverage: number;
  /**
   * Configured rules, in declaration order. ALWAYS PRESENT, EMPTY WHEN ABSENT.
   * Optional would put a null check at every read site downstream, and the
   * forgotten one reads as "no rules configured" instead of failing.
   */
  rules: RuleDecl[];
};

export type ConfigResult =
  | { ok: true; config: Config }
  | { ok: false; reason: string };

const bad = (reason: string): ConfigResult => ({ ok: false, reason });

/** Keys a user might reach for when they mean "the root", none of which resolve one. */
const NAME_KEYS = ['name', 'title', 'page', 'url', 'link'];

/**
 * Every rule ID CONTEXT.md's catalog names, and what this build does with it.
 *
 * THE POINT OF THIS TABLE IS THAT NOTHING IS IGNORED. A rule ID the loader
 * accepts and the scan never executes produces a green run over a rule that did
 * not run — the exact false green this product exists to detect, in this
 * product's own loader. So every ID is classified and every class but
 * `configurable` is a rejection with its own message: an operator who typed
 * `REQ002` has a different problem from one who configured a deferred rule, and
 * one message for both tells neither of them what to do.
 *
 * ⛔ THERE IS NO `not-built` CLASS, AND ITS REMOVAL IS A DECISION — #59. The
 * table carried `UNQ001: { kind: 'not-built', issue: '#59' }` until UNQ001
 * shipped, at which point the class had no member and its branch was
 * unreachable: a rejection path no assertion could score. It is not kept for a
 * future rule, because **"is this rule built?" is not a question this file can
 * answer.** `rule.ts`'s own header says so — the loader validates the DOCUMENT
 * against a table, and whether a rule was compiled into this binary is a
 * question about the BUILD. `unimplementedRules` asks the build directly and
 * `cli.ts` rejects on it at exit 4 before any call is made. A `not-built` entry
 * here would be a hand-kept mirror of `BUILT_RULES` that goes stale the way this
 * one did, one release behind, in the file whose whole job is refusing to guess.
 */
const RULE_STATUS: Record<string, { kind: 'built-in' | 'configurable' | 'deferred' }> = {
  SYS001: { kind: 'built-in' },
  REF001: { kind: 'built-in' },
  REQ001: { kind: 'configurable' },
  UNQ001: { kind: 'configurable' },
  SCH001: { kind: 'deferred' },
  REL001: { kind: 'deferred' },
  DEP001: { kind: 'deferred' },
  CAN001: { kind: 'deferred' },
};

/**
 * The catalog, as data, so a control can assert over it — #59.
 *
 * EXPORTED BECAUSE THE TABLE IS A CLAIM ABOUT THE CATALOG AND CLAIMS GET
 * CHECKED. `CHECK-config.ts` reads it to assert that every ID `CONTEXT.md`'s
 * rule catalog names is classified here, which is the half a per-ID test cannot
 * cover: a test names the IDs it knows about, and the failure mode is a rule
 * nobody remembered to add.
 */
export const ruleCatalog = (): Record<string, 'built-in' | 'configurable' | 'deferred'> =>
  Object.fromEntries(Object.entries(RULE_STATUS).map(([id, s]) => [id, s.kind]));

/**
 * The identity rejection, in ONE place, for roots and for rule scopes alike.
 *
 * `where` is the operator-facing path — `roots[0]`, `rules[2].scope` — because a
 * rejection that does not locate the offending entry sends the reader to the
 * whole file. It is passed in rather than derived, since only the caller knows
 * what it is parsing.
 */
function parseResourceRef(value: unknown, where: string): { ok: true; ref: ResourceRef } | { ok: false; reason: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return { ok: false, reason: `${where} must be an object` };
  const rec = value as Record<string, unknown>;
  const id = hyphenate(typeof rec.id === 'string' ? rec.id : null);

  if (!id) {
    /* A PRESENT BUT MALFORMED ID IS A TYPO, NOT AN IDENTITY ERROR, and it is
     * checked first because the two failures need opposite instructions. An
     * operator who wrote `{ "id": "0000", "alias": "x" }` was told to supply an
     * "id" they had already supplied — the alias branch below fired on a
     * one-character mistake. The example config in the README pairs an id with
     * an alias, so that is the likeliest path through this function. */
    if (typeof rec.id === 'string' && rec.id.trim() !== '') {
      return { ok: false, reason: `${where}.id is ${JSON.stringify(rec.id)}, which is not a Notion ID (32 hex digits, hyphenated or bare)` };
    }

    /* The named-but-unidentified case gets its own message, because it is the
     * one a user actually writes and the one CONTEXT.md forbids guessing at.
     * "A configuration that identifies a resource by name alone is rejected,
     * never guessed at — a guess would make the scan's subject depend on a
     * title that an editor can change." Search is documented as non-exhaustive
     * (docs/research/notion-api-documented.md), so the resolution step a guess
     * would need is both mutable and unreliable, and it fails silently. */
    const nameKey = NAME_KEYS.find(k => typeof rec[k] === 'string' && rec[k]);
    if (nameKey || typeof rec.alias === 'string') {
      return {
        ok: false,
        reason:
          `${where} is addressed by ${nameKey ?? 'alias'} and carries no "id". ` +
          `Identity is the stable ID; a name is a report-only alias and is never resolved to a resource ` +
          `(CONTEXT.md, "Settled defaults").`,
      };
    }
    return { ok: false, reason: `${where}.id is missing or is not a Notion ID (32 hex digits, hyphenated or bare)` };
  }

  return { ok: true, ref: { id, ...(typeof rec.alias === 'string' && rec.alias ? { alias: rec.alias } : {}) } };
}

export function parseConfig(raw: string): ConfigResult {
  let doc: unknown;
  try {
    doc = JSON.parse(raw);
  } catch (e) {
    return bad(`config is not valid JSON — ${(e as Error).message}`);
  }
  if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) return bad('config must be a JSON object');
  const o = doc as Record<string, unknown>;

  if (o.version !== 1) return bad(`config version must be 1, got ${JSON.stringify(o.version)}`);

  if (!Array.isArray(o.roots) || o.roots.length === 0) return bad('config must declare at least one root in "roots"');
  /* Slice scope, not a product limit. The spec's §1.1 cut is ONE declared root;
   * a second root would be enumerated by code no test in this slice exercises,
   * and an unexercised path inside the coverage instrument is the defect class
   * this product exists to detect. */
  if (o.roots.length > 1) return bad(`this slice accepts exactly one declared root, got ${o.roots.length} (spec docs/spec/v0.1-scan-slice.md §1.1)`);

  const roots: RootDecl[] = [];
  for (const [i, r] of o.roots.entries()) {
    const ref = parseResourceRef(r, `roots[${i}]`);
    if (!ref.ok) return bad(ref.reason);
    roots.push(ref.ref);
  }

  const rules = parseRules(o.rules);
  if (!rules.ok) return bad(rules.reason);

  let minCoverage = 1.0;
  if (o.minCoverage !== undefined) {
    if (typeof o.minCoverage !== 'number' || !Number.isFinite(o.minCoverage) || o.minCoverage < 0 || o.minCoverage > 1)
      return bad(`minCoverage must be a number in [0, 1], got ${JSON.stringify(o.minCoverage)}`);
    minCoverage = o.minCoverage;
  }

  return { ok: true, config: { version: 1, roots, minCoverage, rules: rules.rules } };
}

/**
 * The rule-configuration section — issue #19.
 *
 * Absent means an empty list, which is the behaviour every earlier config had.
 * Everything else is validated and rejected on the spot; the caller exits 4.
 */
function parseRules(value: unknown): { ok: true; rules: RuleDecl[] } | { ok: false; reason: string } {
  if (value === undefined) return { ok: true, rules: [] };
  if (!Array.isArray(value)) return { ok: false, reason: '"rules" must be a list of rule configurations, one per configured rule' };

  const rules: RuleDecl[] = [];
  /* Keyed on (rule, NORMALIZED scope ID, property). REQ001's coverage item is
   * (resource, required property) PAIRS — ADR-0011 — so a duplicate entry adds
   * a pair to the denominator that no second observation ever fills, and the
   * ratio moves toward the flattering answer. Normalized because a bare ID and
   * its hyphenated twin are one resource; raw-string keys would let the pair
   * through. */
  const seen = new Set<string>();

  for (const [i, entry] of value.entries()) {
    const where = `rules[${i}]`;
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return { ok: false, reason: `${where} must be an object` };
    const rec = entry as Record<string, unknown>;

    const id = rec.rule;
    if (typeof id !== 'string' || id === '') return { ok: false, reason: `${where}.rule is missing — name the rule this entry configures, e.g. "REQ001"` };

    /* Case-sensitive, and deliberately. Upper-casing the input would accept a
     * spelling CONTEXT.md does not use, and every report line would then print
     * an ID the operator cannot find in their own file.
     *
     * ⭐ THE GATE READS THE TABLE. It was `id !== 'REQ001'` — a hardcoded ID
     * beside a table of every other ID, which is two declarations of one
     * catalog. The second configured rule is what made them disagree: adding
     * UNQ001 to the table without touching the string would have left it
     * rejected as not-configurable while the table said otherwise. */
    /* `Object.hasOwn`, NOT a bare lookup. An object literal inherits from
     * Object.prototype, so `RULE_STATUS['toString']` is a truthy function and
     * `RULE_STATUS['__proto__']` is an object: a typo like `toString` walked
     * straight past the not-in-catalog branch, arrived with `status.kind`
     * undefined, and fell through to the last return — which told the operator
     * their typo was a real catalog rule that ships later. */
    const status = Object.hasOwn(RULE_STATUS, id) ? RULE_STATUS[id] : undefined;
    if (!status) {
      return {
        ok: false,
        reason: `${where}.rule is ${JSON.stringify(id)}, which is not a rule ID in this catalog. The catalog is CONTEXT.md, "Rule catalog", and IDs are upper case.`,
      };
    }
    if (status.kind === 'built-in') {
      return {
        ok: false,
        reason: `${where}.rule is ${id}, which is a built-in rule and takes no configuration. It runs on every scan; remove the entry.`,
      };
    }
    if (status.kind === 'deferred') {
      return {
        ok: false,
        reason: `${where}.rule is ${id}, which is deferred in the v0.1 catalog and is not built. Remove the entry — a configured rule that nothing evaluates would report a green run over a rule that never ran.`,
      };
    }
    /* Configurable. `id` is narrowed by the assertion below rather than by this
     * branch, because the table is a runtime record and TypeScript cannot see
     * that its `configurable` members are exactly the RuleDecl tags. The two
     * lists are kept in step by CHECK-config.ts TEST 3, not by the compiler,
     * and that gap is stated here rather than hidden behind a cast. */
    if (id !== 'REQ001' && id !== 'UNQ001') {
      return {
        ok: false,
        reason: `${where}.rule is ${id}, which the catalog classifies as configurable and this build has no declaration shape for. This is a defect in workspace_lint, not in the config file.`,
      };
    }

    /* Scope is REQUIRED, and the absence of a default is the decision. A
     * required-property rule with no declared scope asserts the property over
     * every resource the scan enumerated, which infers applicability from
     * nothing — the list ADR-0001 decision 4 rejects, and Principle 4 with it.
     * A default scope is available to #58 as a recorded decision; it is not
     * available to a loader as a convenience.
     *
     * THE ARGUMENT IS STRONGER FOR UNQ001, NOT WEAKER. A default scope there
     * would assert that every resource the scan happened to enumerate belongs
     * in one comparison set, and the resulting denominator is quadratic in a
     * number nobody declared. */
    if (rec.scope === undefined) {
      return {
        ok: false,
        reason: `${where}.scope is missing. ${id} must declare which resources it is applicable to — a rule with no scope would infer applicability from nothing, which ADR-0001 decision 4 rejects.`,
      };
    }
    const scope = parseResourceRef(rec.scope, `${where}.scope`);
    if (!scope.ok) return { ok: false, reason: scope.reason };

    if (typeof rec.property !== 'string' || rec.property.trim() === '') {
      const what = id === 'UNQ001' ? 'whose value must not repeat within the scope' : 'that is required';
      return { ok: false, reason: `${where}.property must name the property ${what}, as a non-empty string` };
    }
    /* TRIMMED, AND THE TRIMMED VALUE IS WHAT IS STORED AND KEYED. It was
     * validated trimmed and stored raw, which let "Owner" and "Owner " through
     * as two entries — the same duplicate the normalized scope ID exists to
     * catch, one field to the right. `"Owner "` names no Notion property, so it
     * would contribute a (resource, property) pair to REQ001's denominator that
     * no observation can ever fill. Distinct from the case-sensitivity decision
     * below: `Owner` and `owner` are genuinely two properties; surrounding
     * whitespace is not a property name. */
    const property = rec.property.trim();

    /* Compared as written. Notion property names are case-sensitive, so folding
     * case here would reject "Owner" and "owner" as one entry when they are two
     * different properties. */
    /* The rule ID and the scope ID are fixed-shape — a rule ID has no spaces and
     * a hyphenated Notion ID is 36 characters of hex and hyphen — so only the
     * LAST field can contain a space, and no two distinct triples can produce
     * one key. A property name may contain anything else. */
    const key = `${id} ${scope.ref.id} ${property}`;
    if (seen.has(key)) {
      /* Both rules inflate on a duplicate and they inflate differently, so the
       * message names the rule's own coverage item. UNQ001's is the worse of
       * the two: a repeated declaration re-registers every pair in the scope,
       * which is quadratic in the scope size rather than linear in it. */
      const item =
        id === 'UNQ001'
          ? 'unordered pairs of resources in the scope, so a duplicate re-registers every pair'
          : '(resource, property) pairs, so a duplicate inflates the denominator';
      return {
        ok: false,
        reason: `${where} repeats an earlier entry — ${id} over ${property} in the same scope. Its coverage item is ${item} and nothing ever fills it.`,
      };
    }
    seen.add(key);

    rules.push({ rule: id, scope: scope.ref, property });
  }

  return { ok: true, rules };
}

export function loadConfig(path: string): ConfigResult {
  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch (e) {
    return bad(`config file could not be read at ${path} — ${(e as NodeJS.ErrnoException).code ?? 'unknown error'}`);
  }
  return parseConfig(raw);
}
