# Link domains — the `app.notion.com/p/{id}` migration, and what it did not touch

- **Fetched:** 2026-08-19. **Entry dated:** 2026-07-15. **Scope: REST API, not the MCP connector.**
- `https://developers.notion.com/page/changelog`

## The four sentences, verbatim

> "the `url` values returned for [pages](/reference/page), [databases](/reference/database), and
> [data sources](/reference/data-source), and the `href` values for page and database
> [mentions](/reference/rich-text), now point at the Notion app domain with a page path prefix,
> `https://app.notion.com/p/{page-id}`"

> "Existing `notion.so` links continue to open correctly."

> "Links authored by users, such as `link.url` in rich text and URL property values, and links to
> sites published on `notion.site` or custom domains are unchanged."

> "These values are links for people to open in Notion, not stable identifiers: their domain and path
> format may change again."

## What each one settles

**1. `notion.so` now has a locator.** `.claude/state/checkpoint.md` states *"`notion.so`,
`www.notion.so` and `notion.com` are **not checked** — no locator exists for any of the three."* One
of the three now has one. ⚠ **It does not extend to the other two** — the vendor wrote `notion.so`,
not `www.notion.so`, and said nothing about `notion.com`.

**2. ⭐ The migrated set and the set `REF001` reads are DISJOINT.** `REF001` Route B classifies
user-authored hrefs out of rich text (`slice/references.ts` line 287 — `link.url`). The vendor
declares that population **unchanged**. Route A (mentions) reads the migrated population.

**Consequence:** `#111`'s `www.notion.so` under-reporting is **persistent, not a transient that ages
out.** Reading the migration as "old hosts are being retired, so this decays on its own" is wrong.

**3. ⛔ The vendor declares its own host set volatile.** *"not stable identifiers: their domain and
path format may change again."* This repository already held that position — *"the host set is
unbounded and no allow-list can ever be complete"* — on an inference from custom domains for Sites.
It now has a first-party receipt, and a stronger one: not merely unbounded in principle, but
**announced as changeable** by the party that changes it. `#111`'s ⛔ *"do not close this by extending
the allow-list"* is upgraded from a design position to a vendor-corroborated one.

**4. No path-handling defect, checked rather than assumed.** The `/p/{page-id}` prefix is new in this
entry. `slice/references.ts` keys on the **ID shape anywhere in the URL**, never on the path — line
154's comment states the property and line 196 names `app.notion.com/p/{id}` explicitly. A host the
list does not know still reaches the residue path.

**The design survived a vendor path-format change that shipped a month before anyone here read the
changelog.** That is the strongest evidence the residue path has.

## What may change in the code

`KNOWN_INTERNAL_HOSTS` (`slice/references.ts:87`) may gain `notion.so` as `evidence: 'documented'` on
this locator. It is an **optimisation** that suppresses residue noise and changes no verdict.
`www.notion.so` remains `observed` from `#111`'s own run and is a separate host string.
