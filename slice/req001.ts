/* REQ001 — a selected resource lacks a required property value.
 *
 * The THIRD rule and the FIRST configured one. SYS001 and REF001 take no
 * configuration; this rule reads a scope and a property name out of the config
 * file, which is where the config stops describing only the scan and starts
 * describing a rule.
 *
 * THE HYDRATION IS NOT IN THIS FILE. scan.ts retrieves the pages and writes what
 * it observed into the manifest as structure, the same division references.ts
 * and ref001.ts already use. This file is the RULE: what the manifest says about
 * a (resource, property) pair, what that makes it, and what it does to the
 * report.
 *
 * ⭐ THE ONE MAPPING THIS RULE TURNS ON
 *
 * A Notion page returns the properties the integration CAN SEE. A property the
 * connection was never granted is absent from the map, and so is a property
 * that was never defined on that page. The API does not say which, so:
 *
 *   present in the map, carrying no value   → VIOLATION. The rule read it.
 *   present in the map, carrying a value    → conforms.
 *   ABSENT from the map                     → GAP, never a violation.
 *   no map in the response at all           → GAP. Hydration failed.
 *   present, and its value cannot be read   → GAP. The rule is short, not the
 *                                             workspace.
 *
 * Collapsing row 3 into row 1 reports a defect in the operator's workspace that
 * is really a defect in the grant, and it is the single easiest thing to get
 * wrong here (#58 hazard 1). CHECK-req001.ts TEST 3 is the control and TEST 8
 * mutates the mapping to prove the control is not substitutable.
 *
 * THE FIVE STAGES, READ FOR THIS COVERAGE ITEM
 *
 * The funnel's stage names are resource-shaped and this rule's coverage item is
 * a PAIR, so each stage is given its reading once, here, rather than being
 * inferred at four call sites:
 *
 *   declared    the config made this pair applicable to this resource.
 *   resolved    the resource's property map was READ.
 *   enumerated  the property was LOCATED in that map.
 *   fetched     the property carried a value.
 *   evaluated   marked by the scan, when every applicable rule judged the pair.
 *
 * Every test below reads that stage set and the presence of a `Loss`. Nothing
 * parses a cause string: the two readers in this codebase that recovered
 * structure from prose were both wrong, and `Loss` exists because of it.
 *
 * IDENTITY IS ADR-0010 DECISION 7 AND THIS FILE DOES NOT GET TO INVENT IT. The
 * anchor is (rule, PAGE) — not the pair — and the matchkey hierarchy has two
 * keys, `propertyId/v1` then `propertyName/v1`. The ADR's reason travels with
 * them: a property ID survives a rename and probably does not survive a type
 * change; a name survives a type change and does not survive a rename. Neither
 * alone survives both.
 */

import { RESOURCES, type Entry, type ResourceKey } from './manifest.js';
import type { Rule } from './rule.js';
import {
  anchorFor,
  coverageRow,
  type CoverageUnit,
  type Discriminator,
  type Evidence,
  type Finding,
} from './finding.js';

export const REQ001_ID = 'REQ001';

/**
 * ADR-0011 decision 2: REQ001's coverage item is a (resource, property) PAIR.
 * One page carrying two required properties is two coverage items, and a page
 * in no rule's scope is none.
 */
export const REQ001_UNIT: CoverageUnit = 'resource–property pairs';

/**
 * The matchkey hierarchy — ADR-0010 decision 7, in its order.
 *
 * `propertyId/v1` IS OMITTED FROM A FINDING WHOSE ID WAS NEVER OBSERVED rather
 * than being written as an empty string. A hierarchy runs highest-precision key
 * first and a key that is absent simply does not pair at that pass; an empty
 * string would pair every ID-less finding with every other one. The ID is
 * expected on the response — the vendored SDK types every property value as
 * carrying its own `id` — and `docs/research/notion-live-probe.md` § "Probe 3 —
 * Property IDs" observed the opposite on the CONNECTOR path, so the live run is
 * what settles whether this key is ever populated in practice.
 */
export const PROPERTY_ID_KEY = 'propertyId/v1';
export const PROPERTY_NAME_KEY = 'propertyName/v1';

/**
 * The manifest key for a pair entry.
 *
 * PREFIXED FOR THE SAME REASON `refKey` IS. A page under the declared root and
 * a required-property pair about that page are entries in two different
 * coverage items; the Manifest slots on (unit, key), and the prefix keeps them
 * apart in the rendered GAPS section, where only the key is printed.
 *
 * THE KEY IS NOT AN IDENTIFIER ANYTHING PARSES. A Notion property name may
 * contain `#`, so splitting this string recovers the wrong property. Every
 * reader takes the property from `Entry.req` instead.
 */
export const pairKey = (resource: string, property: string): ResourceKey => `req:${resource}#${property}`;

/* ------------------------------------------------------- reading a value -- */

/**
 * What one property of one page turned out to be.
 *
 * FOUR STATES, AND THE FOURTH IS WHY THIS IS NOT A BOOLEAN. "Absent from the
 * map" and "present and empty" are the two observations the whole rule turns
 * on, and `unreadable` is the third thing that actually happens: a property
 * whose object does not carry the key its own `type` names. Folding that into
 * `empty` would report a violation the scan did not prove.
 *
 * `comparable` IS FOR UNQ001 AND REQ001 NEVER READS IT — #59. REQ001 asks
 * whether a value was present; UNQ001 asks whether two values are the same one,
 * and that second question needs the value itself. The field is added here
 * rather than in a second reader because two readers of one property map is two
 * declarations of one contract, and they would drift on exactly the shapes that
 * are hard to read.
 *
 * ⛔ IT IS NULLABLE, AND A NULL IS A REFUSAL RATHER THAN AN EMPTY STRING. This
 * build renders a comparable for two payload shapes — a plain string, and a
 * rich-text array every span of which carries `plain_text`. A number, a
 * checkbox, a relation and a select carry a value REQ001 correctly calls
 * present, and no comparable this build is willing to assert: `String(1.0)` and
 * `String(1)` differ, and `JSON.stringify` over a select object would make
 * property order the comparison. UNQ001 reads a null as UNDECIDABLE and reports
 * a gap — the rule is short, not the workspace, which is the ruling REQ001
 * already makes for `unreadable`. An empty string here would instead collide
 * every unreadable value with every other one.
 * Revisit if: a real configuration needs uniqueness over a numeric or select
 * property. The answer is a per-shape comparable stated in the spec, not a
 * `String()` reached for at the call site.
 */
export type PropertyReading =
  | { state: 'value'; propertyId: string | null; comparable: string | null }
  | { state: 'empty'; propertyId: string | null }
  | { state: 'unreadable'; propertyId: string | null }
  /**
   * The API returned the property and DID NOT EXPRESS ITS VALUE — issue #127.
   *
   * Notion's changelog, 2026-08-05: "The API can now return formula and rollup
   * page property values and property item values with `type` set to
   * `"unsupported"` and an empty `unsupported` object."
   *
   * ⛔ THIS IS NOT "THE VALUE COULD NOT BE COMPUTED", and the distinction is the
   * whole reason the state is named `unexpressed` rather than `uncomputed`. The
   * type is a statement about what the REST representation can carry. The value
   * very likely exists and renders correctly in the Notion UI. Reading it as a
   * claim about Notion's engine is an inference past the locator — the same
   * boundary as "a UI affordance is not an API behaviour", crossed from the
   * other side.
   *
   * DISTINCT FROM `unreadable`, WHICH IS ABOUT US. `unreadable` says this build
   * does not understand the shape. `unexpressed` says the API declined to send
   * one. Collapsing them would blame the tool for the vendor's boundary and send
   * the operator after the wrong remedy.
   *
   * DISTINCT FROM `empty`, WHICH IS AN OBSERVATION. `empty` means the scan read
   * the value and there was none — that is REQ001's violation. `unexpressed`
   * means the scan never read the value at all, so no conformity claim is
   * available in either direction.
   */
  | { state: 'unexpressed'; propertyId: string | null }
  | { state: 'absent' };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Is a rich-text-shaped array blank?
 *
 * A `rich_text` holding one span of spaces is an array of length 1, so a length
 * test alone calls `"   "` a value. This reads `plain_text` — which the API
 * puts on every span, mention and equation alike — and reports blank only when
 * EVERY element carries one and all of them trim away. An element the reader
 * does not understand makes the array non-blank, which is the direction that
 * does not invent a violation.
 */
const allSpansBlank = (items: unknown[]): boolean =>
  items.every(i => isRecord(i) && typeof i.plain_text === 'string' && i.plain_text.trim() === '');

/**
 * The comparable string for a rich-text-shaped array, or null — #59, UNQ001.
 *
 * EVERY element must carry a `plain_text` string. One span the reader does not
 * understand makes the whole array uncomparable, because a join that skipped it
 * would compare a value the page does not hold. That is the same direction
 * `allSpansBlank` takes and for the same reason: the conservative answer is the
 * one that does not invent an observation.
 *
 * The spans are joined in order and the result is trimmed once, at the end. A
 * title split across two spans by an inline mention is one string in the
 * editor, and comparing it span-by-span would call it different from the same
 * title typed in one go.
 */
const richTextComparable = (items: unknown[]): string | null => {
  const parts: string[] = [];
  for (const i of items) {
    if (!isRecord(i) || typeof i.plain_text !== 'string') return null;
    parts.push(i.plain_text);
  }
  return parts.join('').trim();
};

/**
 * Read one property out of a page's property map.
 *
 * PURE, AND EXPORTED, so the mapping can be asserted directly and mutated
 * directly. The scan calls it at the point of observation and records the
 * result as manifest structure; nothing downstream re-derives it.
 *
 * `false` AND `0` ARE VALUES. An unchecked checkbox and a zero are answers the
 * editor gave, and reporting them as missing would be a rule about content
 * rather than about presence.
 */
export function readProperty(properties: Record<string, unknown>, name: string): PropertyReading {
  /* `hasOwnProperty`, NOT `in`. `in` walks the prototype chain, so a property
   * configured as `constructor`, `toString` or `valueOf` is found on
   * `Object.prototype` and the pair is recorded as LOCATED IN THE MAP, which is
   * false. It never produced a violation — every prototype value falls through
   * to `unreadable` — but it handed the operator the wrong remedy: "the rule
   * has to learn this shape" where the truth is "the property is not there". */
  if (!Object.prototype.hasOwnProperty.call(properties, name)) return { state: 'absent' };

  const value = properties[name];
  if (!isRecord(value)) return { state: 'unreadable', propertyId: null };

  const propertyId = typeof value.id === 'string' ? value.id : null;
  const type = value.type;
  /* The payload lives under the key the value's own `type` names. Without a
   * usable `type`, or without that key present, the scan has not read the
   * property — it has only seen that the property exists. */
  if (typeof type !== 'string' || !(type in value)) return { state: 'unreadable', propertyId };

  /* THE VENDOR'S OWN "I WILL NOT SEND THIS" — issue #127, changelog 2026-08-05.
   *
   * It must be caught HERE, before the payload is inspected, because the payload
   * is an EMPTY OBJECT and the catch-all at the end of this function reads any
   * non-array, non-string, non-null payload as a present value. That is correct
   * for `select`, `date` and `number`; it is wrong for this one, and the only
   * thing that distinguishes them is the type name. Before this line,
   * `{ type: 'unsupported', unsupported: {} }` returned `state: 'value'` and
   * REQ001 counted the pair as EVALUATED — a judgement over a value nobody read.
   *
   * Keyed on the type name, deliberately, and not on "payload is an empty
   * object": `{}` is a legitimate payload shape elsewhere in the union, and a
   * structural test would sweep shapes the vendor never called unsupported. */
  if (type === 'unsupported') return { state: 'unexpressed', propertyId };

  const payload = value[type];
  if (payload === null || payload === undefined) return { state: 'empty', propertyId };
  if (Array.isArray(payload)) {
    if (payload.length === 0 || allSpansBlank(payload)) return { state: 'empty', propertyId };
    return { state: 'value', propertyId, comparable: richTextComparable(payload) };
  }
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    return trimmed === '' ? { state: 'empty', propertyId } : { state: 'value', propertyId, comparable: trimmed };
  }
  /* A value REQ001 reads as present and UNQ001 cannot compare. See the
   * `comparable` note on PropertyReading: null is a refusal, not a blank. */
  return { state: 'value', propertyId, comparable: null };
}

/**
 * Can REQ001 judge this pair?
 *
 * Yes when the property map was read, the property was located in it, and no
 * drop-out was recorded. A pair whose map was never read has no answer, and a
 * pair whose property was not in the map has an answer the scan cannot
 * distinguish from a permission failure.
 */
export const judgeable = (e: Entry): boolean =>
  e.stages.has('resolved') && e.stages.has('enumerated') && e.loss === null;

/** A judged pair whose property carried no value. THE VIOLATION. */
const unfilled = (e: Entry): boolean => judgeable(e) && !e.stages.has('fetched');

export const REQ001: Rule = {
  id: REQ001_ID,
  unit: REQ001_UNIT,
  /* A required property the rule READ and found empty is a defect proved in
   * something the scan read, not a judgement it failed to reach. */
  findingKind: 'conformity-violation',

  judge(m) {
    const judged = new Set<ResourceKey>();
    /* PAIRS ONLY. Judging a resource here would mark it `evaluated` on the
     * strength of a rule that looked at one property of it — the union hazard
     * that inflates every figure downstream. */
    for (const e of m.of(REQ001_UNIT)) if (judgeable(e)) judged.add(e.key);
    return judged;
  },

  findingsFrom(m) {
    /* THE GAP SET IS NOT AN INPUT, for the reason it is not one in ref001.ts:
     * a violation and a gap are different objects produced by disjoint entries.
     * `unfilled` requires `judgeable`; gapsFrom emits only entries that never
     * reached `evaluated`. */
    const links = new Map(m.of(RESOURCES).map(e => [e.key, e.link]));

    return m
      .of(REQ001_UNIT)
      .filter(unfilled)
      .map((e): Finding => {
        /* Read off the entry, never split out of the key. */
        const facts = e.req;
        const resource = facts?.resource ?? e.key;
        const property = facts?.property ?? '(the configured property was not recorded)';
        const anchor = anchorFor(REQ001_ID, resource);

        /* ADR-0010 decision 6: no matchkey holds the observed value. The name
         * and the ID identify WHICH property, and the emptiness — the whole
         * observation — is in the evidence and nowhere else. */
        const discriminator: Discriminator = {
          ...(facts?.propertyId ? { [PROPERTY_ID_KEY]: facts.propertyId } : {}),
          [PROPERTY_NAME_KEY]: property,
        };

        /* THE VALUE IS NEVER PRINTED, and there is no line below that could
         * print it: the rule stores whether a value was present, not what it
         * was. A property VALUE is workspace content, and #42 shipped a title
         * into a call log four lines under a report claiming titles were
         * redacted. The NAME is the operator's own configured string. */
        const evidence: Evidence = {
          object: anchor.resource,
          location: `the page's own property map, property "${property}"`,
          observed: 'the property is present in the map and carries no value',
          expected: 'a property carrying a value',
        };

        return {
          rule: REQ001_ID,
          anchor,
          discriminator,
          /* The map was read and the property was in it. The scan proved this. */
          certainty: 'confirmed',
          /* The resource was retrieved — hydration is what produced the map. */
          targetState: 'present',
          /* The pair is named, so the missing item can be counted. */
          bounded: true,
          /* A property is never a declared root. Pervasiveness condition (a)
           * belongs to the traversal. */
          isRootMiss: false,
          evidence,
          /* The resource's own url, ALREADY REDACTED by scan.ts at the point of
           * entry. Null for a resource the scan staged from a parent's block
           * listing, which has no url to capture. */
          link: links.get(anchor.resource) ?? null,
          /* NULL, AND THE NULL IS THE ANSWER. A source is where a reader goes
           * that is not the subject. REQ001's subject is the resource's own
           * property map — the reader is already at the address, and inventing
           * a second one would send them somewhere the rule never looked. */
          source: null,
          /* No reference is involved: REQ001's subject is a (resource, property)
           * pair the operator declared. Nothing to anchor and nothing to redact. */
          anchorText: null,
          message: `required property "${property}" is present and carries no value`,
        };
      })
      /* ADR-0010 decision 7's occurrence order: property ID ascending. The tie
       * on a null ID falls to the name, which is what keeps the order TOTAL —
       * an unspecified tie-break is an ADR-0004 violation that only shows up on
       * a workspace nobody tested. */
      .sort((a, b) => {
        const ai = a.discriminator[PROPERTY_ID_KEY] ?? '';
        const bi = b.discriminator[PROPERTY_ID_KEY] ?? '';
        if (ai !== bi) return ai < bi ? -1 : 1;
        const an = a.discriminator[PROPERTY_NAME_KEY] ?? '';
        const bn = b.discriminator[PROPERTY_NAME_KEY] ?? '';
        if (an !== bn) return an < bn ? -1 : 1;
        return a.anchor.resource < b.anchor.resource ? -1 : a.anchor.resource > b.anchor.resource ? 1 : 0;
      });
  },

  coverage(m, judged) {
    /* The applicable set is every pair the config declared over a resource the
     * scan enumerated, INCLUDING the pairs this rule could not decide. A pair
     * whose property map never arrived stays in the denominator and lowers the
     * ratio; dropping it would shrink the denominator to fit the scan's own
     * blind spot, which is the defect results-ref001-live.md §3 records. */
    return coverageRow(REQ001_ID, REQ001_UNIT, judged.size, m.count(REQ001_UNIT));
  },

  outcome(m, judged, findings) {
    const entries = m.of(REQ001_UNIT);

    /* ADR-0005 decision 1: conformity is ABSENT when the evaluated set is
     * empty. A verdict that was never formed is not a verdict. */
    const conformity = judged.size === 0 ? null : findings.length > 0 ? 'violates' : 'conforms';

    /* An empty applicable set has no sufficiency either. */
    if (entries.length === 0) return { conformity, evidence: null };

    /* STRUCTURAL, off the stage set and the presence of a loss.
     *
     * `unreached` — the property was never LOCATED: the page was refused, or it
     * carried no map, or the map held no such property. Every one of those has
     * the same remedy, and it is the `unreached` remedy: widen the grant or
     * raise the budget. The third case is the interesting one — an ungranted
     * property and an undefined property are the same response — and sharing
     * more is exactly what would tell them apart.
     * `undecidable` — the property WAS located and its value could not be read.
     * Neither sharing more nor re-running helps; the rule has to learn that
     * property shape. Same argument REF001 makes for an unrecognised link.
     *
     * ADR-0005 decision 1 gives `unreached` precedence where both hold. */
    const unreached = entries.some(e => !e.stages.has('enumerated') && e.loss !== null);
    const undecidable = entries.some(e => e.stages.has('enumerated') && e.loss !== null);

    return { conformity, evidence: unreached ? 'unreached' : undecidable ? 'undecidable' : 'sufficient' };
  },
};
