# Naming and Legal-Boundary Research: `workspace-lint`

**Date:** 2026-08-16
**Role:** naming and legal-boundary SME (research seat)
**Not legal advice.** This document gathers published facts from primary sources and quotes them. The author is not a lawyer. Sections marked "lawyer required" identify where professional judgment is genuinely needed.
**Status:** research evidence, not a canonical product decision. Nothing here binds the product. `CONTEXT.md` and `docs/adr/` remain canonical.

---

## 1. npm holding-package dispute — `workspace-lint`

### Current registry state

Verified 2026-08-16 with `npm view workspace-lint --json`:

```json
"name": "workspace-lint",
"version": "0.0.1-security",
"description": "security holding package",
"repository": "npm/security-holder",
"maintainers": [],
"time": {
  "created":         "2026-07-10T02:57:56.364Z",
  "0.0.1":           "2026-05-08T02:11:47.379Z",
  "0.0.1-security":  "2026-07-10T02:57:56.536Z"
},
"_npmUser": "npm <npm@npmjs.com>",
"dist-tags": { "latest": "0.0.1-security" }
```

A real `0.0.1` was published 2026-05-08. It was replaced by the holding package on 2026-07-10.

### The holding package README, verbatim

Extracted from `https://registry.npmjs.org/workspace-lint/-/workspace-lint-0.0.1-security.tgz`:

> "# Security holding package
>
> This package contained malicious code and was removed from the registry by the npm security team. A placeholder was published to ensure users are not affected in the future.
>
> Please refer to www.npmjs.com/advisories?search=workspace-lint for more information."

The tarball `package.json` is 4 fields: name, version, `"description": "security holding package"`, `"repository": "npm/security-holder"`.

**This matters.** There are two `npm/security-holder` README variants. The variant commonly quoted online — *"npm is hanging on to the package name, but loosely, and we'll probably give it to you if you want it. You may adopt this package by contacting support@npmjs.com"* — is the **name-reservation** variant. `workspace-lint` carries the **malware-removal** variant, which contains **no adoption language at all**. The optimistic "just email support" advice does not apply to this record.

### Documented process

npm's live policy page, `https://docs.npmjs.com/policies/disputes/`, now renders under the title **"Username Policy"**:

> "Usernames, organization names, and package names ... are available on a first-come, first-served basis, and are intended for immediate and active use."

> "npm does not resolve squatting claims on demand."

> Packages: a name counts as squatted "if the package has no genuine function."

> Usernames: npm is "extremely unlikely to transfer control of a username."

The archived, more procedural policy — `https://github.com/npm/policies/blob/master/archived/disputes.md` — gives the only step list npm has published:

> 1. "Open a support ticket at https://npmjs.com/support"
> 2. "Explain why you require a package, org, or username transferred"
> 3. "Support will address your request. Please note submitting a report does not guarantee the transfer of a package, org, or username."

Trademark route, same page: submit a support ticket with the link to the infringing account and a trademark registration certificate. npm then either transfers the name or asks the holder to clarify the confusion in their profile/README.

**No published timeline exists.** Neither page states a number of days or weeks.

### Real case with a measured timeline

The `bebop` incident — The Register, 2021-08-10, `https://www.theregister.com/2021/08/10/github_npm_package/`:

> npm's older published guidance: "After a few weeks, if there's no resolution, we'll sort it out."

Andrew Sampson emailed the listed package owner, received no reply, and **approximately four weeks later npm transferred control of the `bebop` name to him**. The registry held a stale contact email for the actual owner, Zach Kelling, who had maintained the package for over eight years and discovered the change only when a publish failed.

That case establishes the order of magnitude (weeks) and also establishes that npm's manual process errs in both directions.

### Finding

I found **no reported case of a malware-removal security-holder name being released to a new maintainer.** That is absence of evidence after targeted searching, not proof of impossibility.

Treat `workspace-lint` on npm as unavailable. The realistic path is a support ticket with an unknown, multi-week, non-guaranteed outcome, on a name whose registry history records malicious code — a permanent advisory trail that security scanners and cautious users will surface. Do not block the project on it.

---

## 2. Notion trademark policy — the binding constraint

### Source-retrieval note

Notion's legal pages are not publicly retrievable at their canonical URLs as of 2026-08-16. `https://www.notion.com/legal/trademark`, `https://www.notion.com/brand`, and `https://www.notion.com/notion-devs-terms` all 307-redirect to `app.notion.com` and return HTTP 401 or 404 to an unauthenticated client. The Wayback availability API returned 502.

The canonical text below was retrieved by calling Notion's own public page API:

```
POST https://www.notion.so/api/v3/loadPageChunk
Content-Type: application/json
{"pageId":"<id>","limit":300,"cursor":{"stack":[]},"chunkNumber":0,"verticalColumns":false}
```

against the page IDs linked from `https://developers.notion.com/page/changelog`. All quotes are verbatim from those page records.

### Notion Trademark Usage Guidelines

Page `9826313c-686a-4f6e-9d8a-48347162714b`.
Human URL: `https://www.notion.so/9826313c686a4f6e9d8a48347162714b`

Definition:

> "The 'Notion Marks' are the words, logos, graphics, designs, and other indicators that identify Notion as the source of a product or service. For example, the name and wordmark 'Notion', and our black and white cube logo are a few of Notion's most valuable assets. All use of the Notion Marks must be done in accordance with these guidelines (the 'Trademark Guidelines') and the Notion brand guidelines found here ... (the 'Brand Guidelines')."

General rules:

> "Always use the Notion Marks in accordance with these Trademark Guidelines, the Brand Guidelines as well as any other guidelines Notion has or in the future provides to you. All rights we grant you to use the Notion Marks require that you specify that the Notion Marks belong to Notion (as described in the Attribution Language section below). Notion can modify or revoke at any time, in its sole discretion, any permission or license we grant you to use our trademarks."

Permitted use:

> "You may refer to the Notion Marks to accurately describe how your products or services relate to our products or services. For example, if you have built an integration to Notion you can say that your integration works with, works for, uses, or was built with Notion's product or service."

**Prohibited use** — the governing clause for this decision:

> "The following usage of the Notion Marks are prohibited. Please do not:
> - Use the Notion Marks in a way that suggests or implies an endorsement, sponsorship, partnership, or affiliation where such a relationship does not exist.
> - **Use the Notion Marks (including Notion's name) in your business name, app name, website name, domain name, social media handle, or other source.**
> - Copy Notion's look and feel, or imitate our logo or visual identity by incorporating the Notion Marks or anything confusingly similar, into your own trademark, logo, product or service name, business name, trade name, website domain, or slogan.
> - Feature the Notion Marks in connection with pornography, illegal activity, or other material that violates Notion's Terms of Service or Content and Use Policy.
> - Absent a license from Notion, specifically monetize the Notion Marks, such as selling Notion-themed merchandise.
> - Use, display, and promote Notion program badges and credentials except as approved by Notion."

Attribution language:

> "Where you have been granted permission to use the Notion Marks, you must always include the below attribution language or other attribution language that has been provided to you by Notion:
>
> **'Notion and the Notion logo are trademarks of Notion Labs, Inc., and are used here with permission.'**
>
> For community-run websites and social media accounts, please also include clear language that your website or account is a community-run website or account and is not maintained or controlled by Notion."

Contact for clarification: `team@makenotion.com`.

### Notion brand usage guidelines

Page `689045e1-7613-48f8-87a3-c5c80295e00f`.
Human URL: `https://notion.notion.site/Notion-s-brand-usage-guidelines-How-to-use-Notion-s-brand-in-your-marketing-689045e1761348f887a3c5c80295e00f`

Section "How NOT to brand your product or business":

> "❌ Please don't put 'Notion' in your company name, product name, domain name, or social media handle. For example, you cannot use the following names:
> - NotionHub
> - The Notion Helper
> - Notion Starter Pack"

Section "On naming your product or business", the permitted construction:

> "✅ Instead, lead with your own product or business name. You may also add an additional phrase or description that indicates your product is built with and compatible with Notion. This phrase must appear less prominently in your marketing materials. For example, you can name your product 'Acme's Project Hub,' then include a phrase like the following examples below:
> - 'A Notion template'
> - 'A Notion integration'
> - 'A company home on Notion'
> - 'Runs on Notion'
> - 'Consultant services for Notion'"

Community-run disclosure:

> "If you operate a website to host Notion resources (like this), please make sure to mention prominently that it is a community-run website and not maintained by Notion."

The "Made for Notion" badge is offered for download on the same page, for "projects that involve Notion's products and services, like templates, integrations, or how-to courses," subject to: one badge per layout, subordinate placement, no modification/angling/animation, no use of the standalone Notion logo, no use of any part of the Notion logo in your own logo.

### Direct answers

| Question | Answer per published policy |
|---|---|
| May a package name **contain** "notion"? | **No.** "NotionHub" is an explicit counter-example; the Trademark Guidelines bar the mark in "app name ... or other source." |
| Prefix `notion-*`? | **No.** Still the mark inside the product name. |
| Suffix `*-for-notion`? | **No.** Same reason. |
| Permitted construction | Own name, plus a **separate, less prominent** descriptive phrase: "Acme Lint — a Notion integration." |
| Required non-affiliation wording | There is **no mandated disclaimer sentence** for an unaffiliated tool. The mandated sentence is an *attribution* line, and it is conditioned on "Where you have been granted permission to use the Notion Marks." |

**Do not paste the attribution string.** It reads "...and are used here with permission." Without a grant, that sentence is false. Use a plain factual line instead:

> Not affiliated with, endorsed by, or maintained by Notion Labs, Inc. Notion is a trademark of Notion Labs, Inc.

The Notion Marketplace terms (`https://www.notion.com/help/template-gallery-guidelines-and-terms`) reinforce the same obligations for anything published through Notion's own surfaces:

> "you will abide by Notion's Brand Guidelines and Trademark Guidelines, as updated by Notion from time-to-time."

> "you will not make any externally-facing statements that imply a Notion endorsement, certification, affiliation or partnership"

> "Failure to comply with Notion's Brand and Trademark Guidelines may result in termination of these Notion Marketplace Terms of Use and/or other Notion actions."

---

## 3. Notion Developer Terms — constraints on this product's design

Full text retrieved from page `ba413140-8d08-44e0-8330-da2cbb225c20` ("Developer Terms"), the document linked from every developer-terms entry in the API changelog. Changelog history (`https://developers.notion.com/page/changelog`):

- **2026-04-02** — "The Developer Terms have been updated with clarifications to scope, revisions to the Feedback provision, and other minor revisions."
- **2024-12-20** — "Revised Section 1.1 to refine the scope of application of the Developer Terms." / "Revised Section 3.1 to clarify prohibited uses of the API and created a new Section 3.2 for formatting purposes"
- **2024-09-09** — "Revised Section 3.1 of the Developer Terms to include additional security and data use restrictions."

### Applicability — binding without publishing to the Gallery

§1.1:

> "By accessing and using the API for the purposes described above, or by accepting these Developer Terms through a website or mobile application, you are consenting to be bound by these Developer Terms, abide by Notion's Content & Use Policy, and Notion's Brand Guidelines."

This clause converts §2 of this document from etiquette into a contract term. Merely calling the API binds you to the Brand Guidelines.

Relevant definitions from the same page:

> "'Integration' means any application that you develop that creates, reads, updates, exports, and removes or deletes certain content from the Services."

> "'Integration Data' means any data or content collected, gathered, or used by your Integration, including any information about End Users."

> "'End Users' means any users of your Integration, which may include individuals or organizations that are mutual customers of You and Notion."

### §2.1 — the licence to redistribute a reading tool

> "Notion grants you a limited, nonexclusive, revocable, non-sublicensable and non-transferable right to access and use the API solely for the purposes of developing and implementing Integrations that communicate with and make use of the Service. ... In addition, subject to your compliance with the terms and conditions of these Developer Terms, Notion grants you a limited, nonexclusive, revocable, non-sublicensable and non-transferable right to copy and use any data and materials from the Service that are accessed via the API via your Integration in order to make the functionality of the Integration available to third parties and for no other purposes. These Developer Terms do not grant Developer any other rights to Integration Data."

Note "revocable" and "for no other purposes."

### §3.1 — API restrictions, verbatim

> "3.1 You may not: (a) copy, modify, display, distribute, transfer or sublicense the API for use by a third party; (b) interfere with, bypass or disable any features or functionality that are embedded in or included with the API or access our APIs in any manner that (i) compromises, breaks or circumvents any of the technical processes and limitations or security measures associated with the Services, (ii) poses a security vulnerability to customers or users of the Services, or (iii) tests the vulnerability of our systems or networks; (c) access or use the API in order to replicate or compete with the Services; (d) access or use the API in violation of any law or regulation or these Developer Terms; (e) attempt to reverse engineer or otherwise derive source code, trade secrets, or know-how of the APIs or Services; (f) attempt to use the APIs in a manner that exceeds rate limits, or constitutes excessive or abusive usage; (g) use any scraping, data harvesting, web crawlers, or other data extraction methods to extract data from the API; (h) use the API to develop an Integration that competes with or substantially replicates Notion's Services; (i) mislead End Users or collect, store, transfer, sell, use, alter, or delete any Integration Data either without the prior written consent of the End User, or in violation of these Developer Terms; (j) use or assist a third party in using the API in such a way to circumvent applicable Subscription Plan restrictions that are enforced in the Service user interface; (k) process Integration Data to develop, improve, or train non-personalized artificial intelligence or machine learning applications or models; or (l) solicit or receive End User tokens, credentials, or Bot tokens from End User."

Design consequences:

- **(c) and (h) — competing/replicating.** A read-only structural checker does not replicate Notion's Services. Low risk today. Becomes a live question if the product ever stores or renders workspace content as a substitute surface. **Lawyer required at that point.**
- **(g) — data extraction.** Broadly worded. A crawler that walks every page in a workspace to build a structural graph is plausibly within the ordinary reading of "other data extraction methods to extract data from the API." The defensible posture: official API only, user-authorized, rate-limit-respecting, no bulk export, no retention beyond the run.
- **(i) — persisting workspace data.** For a local CLI the operator *is* the End User, so consent is inherent. Any on-disk cache must still be disclosed and deletable.
- **(k) — AI/ML training.** Hard prohibition. No workspace content may feed model training or improvement.
- **(l) — tokens.** Aimed at *you* receiving End User tokens. A purely local tool where the user supplies their own token on their own machine, and the token never leaves that machine, is outside the mischief. **Lawyer required** if any hosted or telemetry component is ever added.

### §3.2 — export control

> "You acknowledge and agree that certain aspects of the API constitute or contain trade secrets of Notion and its licensors. You will comply with all U.S. Export Control Laws. You represent and warrant that you are not located in a country or region embargoed by the U.S. Government or identified on OFAC's List of Specially Designated Nationals, or any other government prohibited parties list, and you will not permit the use of the API by any person or entity identified on those lists. You will not provide, export, re-export, or transfer any part of the API to any embargoed country or region, or to governments or governmental instrumentalities of any embargoed country or region, absent a license or other necessary governmental authorization."

### §4 — data and privacy

§4.1 Your Responsibilities:

> "You acknowledge and agree that you are solely responsible for your Integration, including all security, development, and maintenance. You represent and warrant that you have all necessary rights to distribute and make your Integration available ... You will comply with all applicable privacy laws and regulations, and you will use commercially reasonable efforts to protect Integration Data from unauthorized access or use. You will ensure that user information accessed through the API is collected, processed, transmitted, and maintained in compliance with applicable privacy laws and regulations and any agreements you may have with End Users."

§4.2 Direct Relationships with End Users — **a concrete deliverable**:

> "You will enter into terms of use directly with your End Users and inform your End Users of your privacy policy (together with those terms of use, 'Your Terms'). You will make Your Terms accessible in connection with the download or installation of your Integration, within your Integration, and/or on your public website (Notion acknowledges that you may maintain separate negotiated agreements with End Users that apply in lieu of any online populated terms). Your Terms, together with any associated documentation, will clearly and accurately describe how your Integration functions and how it collects, uses, shares, retains and otherwise processes personal information."

Ship a `TERMS.md` and `PRIVACY.md`, or a single README section, stating: the tool runs locally; what it reads; what it writes to disk; that nothing is transmitted.

§4.3 Support:

> "You agree to use commercially reasonable efforts to provide prompt and comprehensive support and service to End Users. With respect to your Integration, you acknowledge and agree that Notion has no obligations, responsibilities, or liabilities, including for support or technical assistance, with respect to End Users. **You shall not represent to End Users that Notion is available to provide such support.**"

§4.4 Data Subject Requests — governs local caching:

> "You must comply with all data subject requests from End Users with respect to an End User's right to delete, access, or receive (i) any Integration Data pertaining to that End User; and (ii) any metadata that was collected, transmitted, created, or received from that End User through your Integration ... **In the event you retain End User Data following the deletion or uninstallation of your Integration by an End User, you must continue to maintain the End User Data according to Your Terms with the End User and continue to maintain industry standard security measures for that End User Data.**"

### §5.9 — brand obligation restated

> "You acknowledge and agree that notwithstanding any Security Review conducted by Notion, Notion does not 'certify,' warrant or support your Integration. You further represent and warrant that: (i) you will not make any externally-facing statements that imply a Notion endorsement, certification, affiliation or partnership; and (ii) you will abide by Notion's Brand Guidelines, as updated by Notion from time-to-time."

### §5.2, §7.2 — revocability

> §5.2: "Whether or not you or your Integration is included in the Gallery is within Notion's sole discretion. Notion may suspend, disable, or remove your Integration from the Gallery or from within Notion's Services at any time, for any reason, and without prior notice, liability, or other obligation to you."

> §7.2: "Notion may immediately terminate these Developer Terms at any time in its sole discretion and without notice to You."

### §6 — feedback assignment

> "If you provide Notion with comments, suggestions, questions, ratings, or feedback regarding the API or the Services (collectively, 'Feedback'), you hereby assign to Notion all right, title, and interest in and to the Feedback, and agree that Notion is free to use the Feedback without payment, attribution, or restriction."

### §10, §11 — liability and indemnity

> §10: "NOTION'S TOTAL LIABILITY TO YOU FROM ALL CAUSES OF ACTION AND UNDER ALL THEORIES OF LIABILITY WILL BE LIMITED TO AND WILL NOT EXCEED FIVE HUNDRED DOLLARS ($500)."

> §11: "You will defend, indemnify, and hold Notion harmless from and against any liabilities, losses, damages, judgments, fines, penalties, costs and expenses (including reasonable attorneys' fees and court costs), as incurred, arising out of or in any way connected to: (i) your access to and use of the API or the Gallery; (ii) breach or violation of these Developer Terms ...; and (iii) breach of any agreement you have with a third party or End User."

The indemnity runs one way, from you to Notion.

### Rate limits — the operational obligation

`https://developers.notion.com/reference/request-limits`:

> Per connection: "an average of three requests per second, with some bursts beyond the average allowed."

Per workspace: shared across all connections, scaled to the workspace's plan.

Required handling, per the same page:

1. Read the `Retry-After` header and pause requests for at least that duration.
2. Retry failed requests after the pause.
3. Implement exponential backoff with jitter for subsequent 429/529 responses.
4. Set a maximum retry limit and log when reached.

> "Put outgoing requests through a queue so a burst from one job does not consume the connection's full request budget."

> Integrations must "avoid sending requests beyond these limits proactively."

Size limits: handle oversized parameters — the page gives URLs over 2000 characters as the example — and decide on a response such as logging an error or alerting the user.

Separate practical note from the same docs set: **never cache Notion file URLs.** Notion regenerates file/image URLs roughly hourly; a cached URL is dead within ~60 minutes.

---

## 4. Prior-art naming survey — policy and practice diverge

Surveyed via `https://registry.npmjs.org/-/v1/search?text=notion&size=40`, then per-package registry metadata (`https://registry.npmjs.org/<pkg>`). The `license` field and the README text were checked programmatically; the notice column reports whether the registry `readme` field contains any of `affiliat`, `endors`, `unofficial`, `trademark`.

| Package | "notion" in name | License | Non-affiliation notice |
|---|---|---|---|
| `@notionhq/client` | yes | MIT | n/a — official Notion SDK |
| `ntn` | no | MIT | none — **Notion's own official CLI** |
| `notion-to-md` | yes | ISC | none |
| `react-notion-x` | yes | MIT | none |
| `notion-client` | yes | MIT | none in README; npm description says "unofficial Notion API" |
| `notion-utils` | yes | MIT | none |
| `notion-helper` | yes | MIT | none |
| `notion-backup` | yes | MIT | none |
| `notion-md-crawler` | yes | MIT | none |
| `notion-astro-loader` | yes | MIT | none |
| `notion-schemas` | yes | MIT | none |
| `@4ier/notion-cli` | yes | MIT | none |
| `easy-notion-mcp` | yes | MIT | none |
| `notion-mcp-server` | yes | not declared | none |
| `vue-notion` | yes | none declared | none |
| `@tryfabric/martian` | no | ISC | none |

README character counts were verified to rule out false negatives: `ntn` 4840 chars, `@4ier/notion-cli` 6500, `notion-backup` 4802 — all non-empty, none containing a notice. Three packages (`notion-to-md`, `react-notion-x`, `notion-client`) return an empty registry `readme` field, so their notice status is unverified from that source.

### The divergence, stated plainly

**Published policy says:** do not put "Notion" in your product name; imply no affiliation.

**Practitioners observably do:** put "notion" in the name almost universally, and carry no disclaimer.

**Notion has not observably enforced against any of these.** That is the de-facto norm. It is not a safe harbour. It is unenforced policy, and unenforced policy remains enforceable at the trademark owner's discretion the moment a project gets traction — and §5.2 and §7.2 of the Developer Terms make Notion's discretion explicit.

One additional signal: `ntn`, the **official** Notion CLI, now occupies the CLI slot in this ecosystem. That raises the confusion risk specifically for a third-party `notion-*` CLI.

---

## 5. Candidate names — all verified with live `npm view`

All checks run 2026-08-16. Every name in the "available" set returned `npm error code E404` from `registry.npmjs.org`.

### Raw output, finalists

```
### npm view deskcheck
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/deskcheck - Not found
npm error 404
npm error 404  The requested resource 'deskcheck@*' could not be found or you do not have permission to access it.

### npm view lintspace
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/lintspace - Not found
npm error 404
npm error 404  The requested resource 'lintspace@*' could not be found or you do not have permission to access it.

### npm view workspace-check
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/workspace-check - Not found
npm error 404
npm error 404  The requested resource 'workspace-check@*' could not be found or you do not have permission to access it.

### npm view spacecheck
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/spacecheck - Not found
npm error 404
npm error 404  The requested resource 'spacecheck@*' could not be found or you do not have permission to access it.

### npm view pagelint
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/pagelint - Not found
npm error 404
npm error 404  The requested resource 'pagelint@*' could not be found or you do not have permission to access it.

### npm view wsprobe
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/wsprobe - Not found
npm error 404
npm error 404  The requested resource 'wsprobe@*' could not be found or you do not have permission to access it.

### npm view keel-lint
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/keel-lint - Not found
npm error 404
npm error 404  The requested resource 'keel-lint@*' could not be found or you do not have permission to access it.

### npm view workspace-rules
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/workspace-rules - Not found
npm error 404
npm error 404  The requested resource 'workspace-rules@*' could not be found or you do not have permission to access it.

### npm view binnacle-lint
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/binnacle-lint - Not found
npm error 404
npm error 404  The requested resource 'binnacle-lint@*' could not be found or you do not have permission to access it.

### npm view tidydesk
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/tidydesk - Not found
npm error 404
npm error 404  The requested resource 'tidydesk@*' could not be found or you do not have permission to access it.
```

### Also verified E404 (available)

`spacelint`, `wslint`, `workspace-audit`, `workspace-doctor`, `plumb-line`, `gridlint`, `sextant-lint`.

### Taken — excluded

```
binnacle     -> 0.0.5
plumbline    -> 10.0.9
structlint   -> 1.0.0-beta.1
```

### Verified E404 but REJECTED on §2 grounds (contain the Notion mark)

```
notion-lint             404 Not Found
notionlint              404 Not Found
notion-linter           404 Not Found
notion-doctor           404 Not Found
notion-audit            404 Not Found
notion-check            404 Not Found
notion-hygiene          404 Not Found
notion-structure-lint   404 Not Found
```

Availability is not the constraint on these. The Trademark Guidelines are.

### Ranked, compliant shortlist

1. **`binnacle-lint`** — own-brand-led; exactly the construction Notion's guidelines prescribe. Distinctive, no mark, no collision. Matches the existing `MrBinnacle` GitHub identity.
2. **`workspace-rules`** — describes the mechanism (explicit structural rules). No mark. No whitespace ambiguity.
3. **`workspace-check`** — plain, readable, communicates the action.
4. **`deskcheck`** — short and memorable; "desk" is a weaker metaphor for a hosted workspace.
5. **`lintspace`** — reads well, but invites whitespace-linter confusion.
6. **`spacelint`** — same confusion risk, stronger.
7. **`pagelint`** — accurate to the object checked, but collides conceptually with web-page linters.
8. **`workspace-audit`** — "audit" implies a compliance/security scope this product does not have.
9. **`keel-lint`** — brand-consistent, meaning opaque.
10. **`wsprobe`** — `ws` reads as WebSocket to most JS developers. Reject.

### GitHub availability, top candidates

HTTP status from `https://github.com/<path>`, checked 2026-08-16:

```
github.com/MrBinnacle/binnacle-lint  -> 404 (available)
github.com/MrBinnacle/deskcheck      -> 404 (available)
github.com/MrBinnacle/lintspace      -> 404 (available)
github.com/MrBinnacle/spacecheck     -> 404 (available)
github.com/MrBinnacle/workspace-lint -> 404 (hyphen form not created)
github.com/deskcheck                 -> 404 (org/user name free)
github.com/lintspace                 -> 404 (org/user name free)
github.com/spacecheck                -> 200 (org/user TAKEN)
github.com/notionlint                -> 404
github.com/notion-lint               -> 404
github.com/notiondoctor              -> 404
```

Note: the task brief stated `MrBinnacle/workspace_lint` (underscore) already exists. The hyphen form returns 404; that is a different path. The underscore form was not checked.

---

## 6. Licence and dependency-licence obligations

### Conventional licence — MIT

From the measured survey: ESLint MIT, oxlint MIT, Biome dual MIT/Apache-2.0. In the Notion ecosystem specifically, 11 of the 16 packages above declare MIT, two ISC, two nothing.

**Recommendation: MIT.** Apache-2.0 buys an express patent grant and a patent-retaliation clause, which matters for corporate-contributed projects, not a solo read-only CLI. Dual `MIT OR Apache-2.0` is a Rust-ecosystem convention and would look out of place in a Node package.

### What npm itself requires

From `https://docs.npmjs.com/cli/v11/configuring-npm/package-json`:

> Use a current SPDX license identifier: `"license": "BSD-3-Clause"`

> For multiple licences, SPDX expression syntax: `"license": "(ISC OR GPL-3.0)"`

> "Use a string value like this one: `\"license\": \"SEE LICENSE IN <filename>\"` Then include a file named `<filename>` at the top level of the package."

> For packages you do not wish others to use: `"license": "UNLICENSED"`, and "Consider also setting `\"private\": true` to prevent accidental publication."

> "License objects and license arrays are no longer valid metadata and have been deprecated in favor of SPDX expressions."

So: `"license": "MIT"` in `package.json`, plus a `LICENSE` file at repo root carrying the copyright line.

### Third-party dependency disclosure

npm imposes no disclosure obligation of its own. The obligation comes from the dependency licences themselves.

- **Unbundled publish (recommended).** Normal npm CLI, `dependencies` resolved at install time. Each dependency ships its own `LICENSE` inside its own `node_modules` directory. The MIT/ISC/BSD "include this notice in all copies" condition is satisfied automatically. **No extra file needed.**
- **Bundled publish.** If you ship a single-file bundle (esbuild/rollup) or use `bundledDependencies`, you are redistributing those files, and MIT/ISC/BSD-2/BSD-3 all require reproducing the copyright and permission notice. Generate a `THIRD-PARTY-NOTICES.txt`. Bundlers **discard comments by default** — esbuild needs `--legal-comments=external` or equivalent. That exact hazard is the subject of esbuild issue #2745, `https://github.com/evanw/esbuild/issues/2745`. Generate the file in CI so it cannot drift from the lockfile.
- **Apache-2.0 dependencies** add §4(d): the contents of any `NOTICE` file must propagate into your distribution.
- **Copyleft (GPL/AGPL/LGPL)** in the dependency tree changes the analysis materially. **Lawyer required.**

**Recommended control:** a CI licence gate (`license-checker` or `npm-license-crawler`) with an allowlist of `MIT`, `ISC`, `BSD-2-Clause`, `BSD-3-Clause`, `Apache-2.0`, `0BSD`, failing the build on anything else. That converts an open-ended legal question into a machine check that fires before a problem ships.

---

## 7. Where a lawyer is genuinely required

1. **Trademark risk assessment, if the project chooses to use "notion" in the name anyway.** Notion's published guidelines say no. Nominative fair use is a real doctrine and the ecosystem norm favours the project. Weighing those against each other is legal judgment, not research. This document states the published rule; it does not assert the rule is unenforceable.
2. **Any scope expansion past read-only local analysis** — a hosted service, stored workspace content, or a rendering surface — against §3.1(c) and §3.1(h), "competes with or substantially replicates Notion's Services."
3. **Any hosted or telemetry component that would cause the project to receive End User tokens**, against §3.1(l).
4. **Copyleft licences in the dependency tree**, if the CI licence gate fires.

---

## 8. Recommendation

**`binnacle-lint`.**

Verification:

```
$ npm view binnacle-lint
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/binnacle-lint - Not found
npm error 404  The requested resource 'binnacle-lint@*' could not be found

$ curl -o /dev/null -w "%{http_code}" https://github.com/MrBinnacle/binnacle-lint
404
```

Both the npm name and the GitHub repo path are free.

The name contains no Notion Mark, satisfying the Trademark Usage Guidelines' bar on the mark in an "app name," and it is precisely the construction the Brand Guidelines prescribe: lead with your own product name, then add the descriptor separately. Ship it with:

- npm `description`: "Structural linter for Notion workspaces — a Notion integration" (expressly permitted descriptive use)
- README footer: "Not affiliated with, endorsed by, or maintained by Notion Labs, Inc. Notion is a trademark of Notion Labs, Inc."

It carries no whitespace-linter ambiguity, no collision with an existing static-analysis tool, and it inherits the identity already established by the `MrBinnacle` account.

**Strongest argument against it:** discoverability is near zero. Nobody searching npm types "binnacle." Every tool in the survey — twelve packages that all put "notion" in the name, none of which Notion has enforced against — beats it on the search-results page from day one. The project would be accepting a real, measurable distribution penalty in exchange for compliance with a policy the entire ecosystem currently ignores without consequence.

That trade-off is a values decision, not a research finding. If discoverability is judged to outweigh the policy, the honest framing is that the project is choosing to rely on non-enforcement, and that reliance is revocable at Notion's sole discretion — which §5.2 and §7.2 of the Developer Terms state in as many words.

---

## Sources

- npm Username Policy — https://docs.npmjs.com/policies/disputes/
- npm archived disputes policy — https://github.com/npm/policies/blob/master/archived/disputes.md
- npm/security-holder — https://github.com/npm/security-holder
- `workspace-lint` holding tarball — https://registry.npmjs.org/workspace-lint/-/workspace-lint-0.0.1-security.tgz
- The Register, bebop name transfer (2021-08-10) — https://www.theregister.com/2021/08/10/github_npm_package/
- npm `package.json` docs — https://docs.npmjs.com/cli/v11/configuring-npm/package-json
- Notion Developer Terms — https://www.notion.so/notion/Developer-Terms-ba4131408d0844e08330da2cbb225c20
- Notion Trademark Usage Guidelines — https://www.notion.so/9826313c686a4f6e9d8a48347162714b
- Notion brand usage guidelines — https://notion.notion.site/Notion-s-brand-usage-guidelines-How-to-use-Notion-s-brand-in-your-marketing-689045e1761348f887a3c5c80295e00f
- Notion API request limits — https://developers.notion.com/reference/request-limits
- Notion API changelog — https://developers.notion.com/page/changelog
- Notion Marketplace guidelines & terms — https://www.notion.com/help/template-gallery-guidelines-and-terms
- esbuild legal-comments issue #2745 — https://github.com/evanw/esbuild/issues/2745
