# Solo and Small-Team Segment Evidence — Notion Structural Pain

- **Date:** 2026-08-16
- **Role:** solo and small-team segment SME
- **Scope:** fills the hole left by the prior pain sweep, which was blocked at Reddit, G2, and Capterra.

**This document is research evidence. It is not a canonical product decision.** It does not
override `CONTEXT.md` or any ADR in `docs/adr/`. It is an input.

---

## METHOD AND ITS LIMIT

### Sources I reached

| Source | Route | What it gave |
|---|---|---|
| Capterra reviews | `WebFetch` on `capterra.com/p/186596/Notion/reviews/` and `?page=19` | Verbatim "Cons" text with reviewer role and date |
| Individual blogs (Medium, Substack) | `WebFetch` | First-person solo accounts with dates |
| `lethain.com` (Will Larson) | `WebFetch` | An engineering leader who built this exact tool |
| `notionmastery.com`, `notion.vip` | `WebFetch` | Naming-convention doctrine taught to individuals |
| GitHub | `WebFetch` | Two existing duplicate-detection artifacts |
| `dev.to` | `WebFetch` | A shipping competitor's detection list |
| npm registry API | `WebFetch` | Notion SDK download volume |
| HN Algolia API | `WebFetch` | Confirmed near-zero HN discussion of this pain |
| `templatesfornotion.com` | `WebFetch` | Dated statement on duplicate prevalence |

### Sources I could not reach

**Reddit — blocked on four separate routes.** This blind spot is unchanged from the prior sweep.
1. `WebFetch https://www.reddit.com/r/Notion/search.json` → "Claude Code is unable to fetch from www.reddit.com".
2. `WebFetch https://old.reddit.com/...` → same block.
3. `WebFetch https://redlib.catsarch.com/r/Notion/search` (third-party mirror) → HTTP 403.
4. `WebSearch` with `allowed_domains: ["reddit.com"]` → API error 400, "domains are not accessible to our user agent".

I stopped after four attempts. I did not attempt to bypass any access control.
**I found no working route to Reddit content.** The only Reddit material in this document is
second-hand: two r/Notion quotes reproduced inside a vendor blog post (`eesel.ai`), which I have
marked as such and which I could not verify against the original posts.

**`community.notion.so` — does not exist.** DNS lookup returned `ENOTFOUND`. So did
`forum.notion.so`. The brief named `community.notion.so` as the primary target. As of
2026-08-16 that hostname does not resolve. Notion appears to have no public web forum at either
address. This removes the single largest planned substitute for Reddit and is the biggest
limitation of this sweep.

**Quora** — HTTP 403 on the one directly relevant question. I have its title and URL from search
results but not its body or answers.

**YouTube** — every video page fetch returned only footer navigation. View counts, titles, and
descriptions are not retrievable through this tool. The frequency signal the brief asked for is
unavailable. I have video titles from search result metadata only, with no view counts, so I have
excluded them as evidence.

**Gumroad and Notion Marketplace product pages** — render as JavaScript shells. Product
descriptions, prices, and sales counts did not come back. Template-market claims below rest on
secondary blog reporting, which I have marked as weak.

**G2** — not attempted. The prior sweep recorded 403.

**Not fetched directly, only seen through search-result summaries:** Indie Hackers, Lobsters,
X/Twitter, Product Hunt comment threads, Notion Discord, Notion Facebook groups. Claims sourced
only to a search summary are labelled `[search summary — not verified by fetch]`. Treat those as
weaker than the fetched quotes.

### One more limit that matters

Capterra did not expose **company size** in any fetched review. The brief asks me to separate solo
from teams under 15 people. For Capterra quotes I have the reviewer's job role and industry and
nothing else. I state role and industry, and I do not claim a headcount I cannot see.

---

## 1. SOLO AND HOBBYIST PAIN

### 1.1 Overbuilt structure — too many databases

Suzaan Sayed, Medium, 2026-04-29
(`https://medium.com/@SuzaanSayed/i-rebuilt-my-entire-notion-setup-from-scratch-heres-the-system-i-actually-use-every-day-e291d783b611`):

> "I had a database for goals. A database for habits. A database for projects. A database for
> books. A database for ideas. A database for my databases."

> "I was spending more time inside my productivity system than inside my actual work."

Minu Writes, Medium, 2026-07-22
(`https://medium.com/@minuwrites/why-your-notion-workspace-feels-overwhelming-and-how-to-fix-it-2172523a42cc`):

> "Twelve databases. Three 'systems' I had built over different months, each with its own logic.
> A dashboard I hadn't touched in weeks."

**UNTESTABLE.** A count of databases is structural and a linter can produce it. "Too many" is not.
Nothing in the structure distinguishes twelve well-used databases from twelve abandoned ones
without the user first declaring a cap — and a user who could state the right cap does not have
this problem. The complaint is about judgment, not about a defect.

### 1.2 Similarly named databases that break search

Ben Borowski, Notion Mastery blog, 2024-02-06
(`https://notionmastery.com/naming-and-nomenclature-in-notion/`):

> "You _will_ end up with a great number of documents in your Notion space. 1,000s of tasks,
> meetings, notes, and more (maybe even 10s of 1,000s!)."

> "When searching via page titles (the primary way to find documents in Notion), you may find your
> pages, databases, and templates have a similar naming structure. This often leads to challenging
> search outcomes."

> "Notion operates most effectively when you have a reliable schema for naming resources."

The post includes a screenshot of Notion global search returning multiple similarly named "Tasks"
databases.

**TESTABLE — duplicate key.** Identical or near-identical titles across databases are detectable
from structure alone. Note the cost: detecting *near*-identical titles needs a similarity threshold
or a declared naming pattern. That is a policy the user must write.

### 1.3 Duplicate pages inside a database

Three independent artifacts exist for this one pain.

- `github.com/jeromegit/notion-duplicates`, README: *"Detect the duplicated pages in a Notion
  database and optionally delete the dupes."* Its definition: *"It's a page with both the same
  _title_ and same _last\_edited\_time_ as another document."* Stars: 0.
- `github.com/dvanoni/notero` issue #252, opened 2023-04-16, title "Detect and delete duplicate
  Notion pages", body: *"I was just wondering if it is possible to have the notion database
  recognize duplicates in a database so they can be deleted. Thanks!"* Status: open, labelled
  Enhancement. Originally raised by @domhicks in issue #27.
- `templatesfornotion.com/newsletters/notion-remove-duplicates-tutorial`, 2025-09-23:
  *"One common headache, especially in CRM databases, is finding duplicates."*

**TESTABLE — duplicate key.** This is the cleanest match in the whole sweep to a v0.1 rule.
It is also the pain with the lowest configuration cost: "duplicate title within a database" needs
no policy declaration at all.

Note the counter-signal in the same evidence. The GitHub tool has **zero stars**, and the Notero
issue has been **open for over three years**. The pain is real and named. Nobody is crowding
around the solutions.

### 1.4 Orphan pages, dead links, and unused properties

Giorgi Kobaidze, dev.to, 2026-03-29
(`https://dev.to/georgekobaidze/noterunway-because-your-notion-workspace-deserves-an-elite-crew-53bk`),
announcing NoteRunway, a commercial Notion auditor:

> "orphaned pages from long-forgotten projects, duplicate notes written three times because the
> first two vanished into the void, and dead links leading to pages you archived months ago"

> "invisible debt: orphaned pages, broken relations, properties nobody uses"

The tool's stated detection categories: workspace health metrics (page counts, connection density,
empty pages); semantic duplicates; garbage (orphaned, empty, or stale pages, 90+ days untouched);
dead links (@mentions pointing to deleted pages); sensitive data (API keys, PEM keys, JWTs,
passwords); dependency visualization; natural-language commands.

**TESTABLE — orphan page, broken reference, dead dependency.** This list overlaps the v0.1 rule
catalog almost item for item.

**This is the most important finding for product positioning, and it cuts against the product.**
A competitor already ships these detections, and it ships them **zero-config** — it detects
orphans, dead links, and duplicates without asking the user to declare anything. Six of the eight
proposed rules are inert until the user writes a policy. NoteRunway is evidence that the pains
listed here can be attacked without imposing that cost.

### 1.5 Stale and unopened pages

Sue-Jan Noreiga's "guided workspace self-audit + clean up" template names the symptoms it exists
to fix. `[search summary — not verified by fetch; the Notion Marketplace and Gumroad pages both
rendered as empty shells]`: pages not opened in 3+ months, difficulty finding what is needed
quickly, overwhelming and cluttered setups, duplicating work across multiple pages.
URL: `https://www.notion.com/templates/guided-workspace-self-audit-clean-up`. Rated 5.0 from
**one** rating.

Minu Writes, 2026-07-22, prescribes: *"Delete any pages unopened for thirty days"* and
*"a fifteen minute reset every Sunday."*

**PARTIALLY TESTABLE.** `last_edited_time` is structural metadata and a linter reads it directly.
But every source above says **unopened**, not unedited. The Notion API exposes edit time, not view
time. A linter can flag "not edited in N days". It cannot answer the question users are actually
asking. NoteRunway solves this by ingesting page views; NotePulse
(`microlaunch.net/h/how-to-clean-up-unused-notion-pages-by-sorting-and-filtering-based-on-real-usage-data`)
exists solely to *"add page view analytics directly to your Notion databases"* — a whole product
built because edit time is not the signal.

### 1.6 Inconsistent tags and select-option proliferation

Capterra, Rakhi V., QA Lead, Information Technology and Services, 2+ years' use, 2026-03-27,
Cons field, verbatim:

> "without consistent templates and naming, it's easy for information to become scattered"

Guidance from `super.so/blog/how-to-add-tags-in-notion` `[search summary — not verified by fetch]`:
standardize tag names by reviewing and merging duplicates quarterly; limit options to 5-15 tags,
because 50+ tags become noise.

**TESTABLE — value outside a declared allowed set.** And this is exactly the rule class that
carries the full configuration cost. The linter cannot know which select options are legitimate.
The user must enumerate them. That enumeration is the same work as cleaning the property by hand,
done once, in a less familiar syntax.

### 1.7 Formula and rollup difficulty

Quora question title, verbatim from the search result (body returned HTTP 403, so I have the title
and URL only):

> "Why am I finding Notion to be so difficult and overwhelming whether it is relation or rollups or
> formula? How do you think I overcome this problem? I am just making a personal system."

URL: `https://www.quora.com/Why-am-I-finding-Notion-to-be-so-difficult-and-overwhelming-whether-it-is-relation-or-rollups-or-formula-How-do-you-think-I-overcome-this-problem-I-am-just-making-a-personal-system`

Notion's documented limit: formulas can only be 15 layers deep, and every reference to another
formula or rollup adds a layer, even across databases `[search summary, sourced to
notionapps.com — not verified by fetch]`.

**UNTESTABLE for the v0.1 rule set.** A formula that is hard to understand is not a structural
defect. A formula that errors is detectable, but that is not one of the eight rules.

### 1.8 Findability and overwhelm

Capterra Cons fields, verbatim:

- Jiahao H., Deployment Strategist, Information Technology and Services, 1-2 years, 2026-01-04:
  > "Notion can feel overwhelming due to its flexibility and lack of strong structure out of the box"
- Janusz H., Owner, Internet, 2024-10-17:
  > "Notes are unfortunately organised much worse than tasks. I miss a good search engine there."
- "VR", Sr. Strategy and Ops Manager, E-Learning, 2024-10-04:
  > "The steep learning curve in the beginning is its biggest drawback...like being given a blank
  > canvas without guidance."
- Shelby D., Digital Marketing Specialist, Banking, 1-2 years, 2026-04-20:
  > "can feel overwhelming at first because of how many customization options there are"
- Daria I., Office Manager, Information Technology and Services, 2024-11-11:
  > "Sometimes it can feel a bit overwhelming with so many features, and it takes a while to figure
  > out the best way to set things up."

**UNTESTABLE.** These are the most frequent complaints in the reachable corpus, and none of them
is a structural defect. They are complaints about the cost of building structure. A tool whose
first demand is "write a YAML policy file" adds to this cost. It does not reduce it.

### 1.9 Frequency note

The pains a linter can test (1.2, 1.3, 1.4, 1.6) appear less often in the reachable corpus than the
pains it cannot (1.1, 1.7, 1.8). I cannot quantify the ratio: Reddit is blocked, YouTube view
counts are unavailable, and Capterra cons are surfaced by relevance rather than exhaustively.
The direction of the imbalance is consistent across every source I did reach.

---

## 2. SMALL-TEAM PAIN (UNDER ~15 PEOPLE)

**Verdict on this section: still WEAK. I did not improve on the prior sweep.**

The reason is stated plainly: **no reachable source attributes a structural complaint to a team of
a stated size under 15.** Capterra gives role and industry, not headcount. The blogs are solo.
Larson is not small-team. I will not infer headcount from job titles.

### 2.1 What I found, with the size caveat attached

Capterra, Khyan A., Senior Business Development Representative, Computer Software, 1-2 years'
use, 2026-05-12, Cons field, verbatim:

> "workspaces can get cluttered with duplicate pages or outdated information if teams aren't
> maintaining things consistently"

**TESTABLE — duplicate key, plus stale-page detection with the edit-time caveat from 1.5.**
Company size unknown.

Capterra, Marco C., Pre Litigation Legal Assistant, Legal Services, less than 6 months, 2025-12-28,
Cons field, verbatim:

> "when many notes are added, it creates confusion because it's not clear who created each note"

**TESTABLE — missing required value**, if and only if the team declares an owner property as
required. Notion exposes created-by. The complaint is that nobody looks at it. A linter that
reports "page X has no declared owner" only helps a team that first declared owners mandatory.
Company size unknown.

Capterra, Rakhi V. (quoted in full at 1.6) — scattered information without consistent naming.
Company size unknown.

### 2.2 The one detailed team account, and why it is not this segment

Will Larson, "Refactoring internal documentation in Notion", 2026-02-05
(`https://lethain.com/refactoring-internal-docs-notion/`). Verbatim:

> "We migrated from Confluence to Notion in January, 2025, which had left around a bunch of old
> pages that were 'obviously wrong.'"

> "We had inconsistent approach to what we documented in Git-managed files versus managing in
> Notion. This led to duplication."

> "We've had a bunch of new folks join over the past year, who weren't sure if they were empowered
> to update documentation or if someone else was managing any given file"

> "we started using Notion AI as the primary mechanism for exposing content, which meant that
> hierarchical organization was less important, and that having inaccurate snippets was harmful"

What he did: created "Scheduled to Archive" and "Archive" teamspaces with weekly automated
migration; built a script that identified and archived **approximately 1,500 pages** where "it and
all children were last edited more than N days ago"; built a tool to promote current pages buried
in stale hierarchies; built a **broken-link detector** that recursively found 404s while excluding
archived content.

**This is the strongest single piece of evidence in the sweep, and it is evidence for both sides.**
It is proof that the exact rule set has real value: stale-page pruning, dead-link detection, and
duplicate-hierarchy compaction, in production, at a company with at least 1,500 archivable pages.
That is not a team under 15. And the operator did not buy a linter. **He wrote one.**

`storyflow.so/blog/best-team-wiki-tools-2026` `[search summary — not verified by fetch]` reports
that Notion teams should turn on wiki mode so pages carry owners and verification with expiry
dates, "which most Notion teams never do". If accurate, Notion already ships the owner-and-expiry
mechanism this product would lint for, and teams do not switch it on. That is a demand signal
pointing down, not up.

---

## 3. WILLINGNESS TO CONFIGURE — THE DECISIVE QUESTION

The brief asks for behavioural evidence, not stated preference. Here it is, per segment.

### 3.1 Solo and hobbyist — EVIDENCE FOUND, and it points the wrong way

**Behaviours found that would predict tolerance of a config file:**

- **Naming conventions are taught to individuals and adopted.** Ben Borowski, 2024-02-06, free
  public post, not paywalled: *"Notion operates most effectively when you have a reliable schema
  for naming resources."* William Nutt, `notion.vip/insights/golden-rules-of-notion`, undated,
  rule 7 "Name Naturally": use plural, intuitive names for databases (People, Events, Resources)
  for consistency. Rule 5 is literally "Think Like an Engineer". Rule 3 states that *"tinkering"
  is essential; avoid installing pre-made templates as they undermine creating unified systems.*
- **Individuals pay for formula instruction.** Red Gregory sells "Learn Notion Formulas (Course)"
  at $45 (`https://redgregory.gumroad.com/l/ekppem`; price via
  `notions.ws/notion-template/learn-notion-formulas-course` `[search summary — not verified by
  fetch]`). A market for a $45 formula course means some individuals will pay to acquire a
  declarative-syntax skill.
- **Individuals build buttons and automations.** Multiple 2026-current guides for personal
  recurring tasks via Button properties and database automations
  (`thomasjfrank.com/notion-automated-recurring-tasks/`, `matthiasfrank.de/en/recurring-tasks-in-notion/`,
  `thesweetsetup.com/how-to-create-notion-buttons-to-automate-your-workflow/`)
  `[search summaries — not verified by fetch]`.

**Behaviours found that predict rejection of a config file, and they are stronger:**

- **The dominant purchase is a template, and buying a template is paying to avoid configuring.**
  This is the sharpest finding in the section. A template buyer is not demonstrating tolerance for
  configuration. They are demonstrating the opposite: willingness to spend money so that somebody
  else does the structural thinking. The size of the template market is a measure of how much
  individuals will pay **not** to write a policy.
- **The documented response to complexity is deletion.** Suzaan Sayed's rule after the rebuild:
  *"if I have to click more than twice to find something, it doesn't belong here."* Her new system
  has four pages. Minu Writes' has four sections. Neither reached for a tool. Both cut.
- **The stated barrier is already the learning curve.** See every Capterra quote in 1.8. The
  product's first ask lands on top of a barrier users already name as the worst thing about Notion.
- **The Quora question in 1.7 is a person building a personal system who finds relations, rollups,
  and formulas overwhelming.** Notion's own declarative surfaces are already past this user's
  tolerance. A YAML file is not easier than a rollup.

**Finding for the solo segment: they will configure a system they are building *for themselves to
use*. There is no evidence they will configure a system whose only output is a report about that
system.** Every configuration behaviour found above buys a running feature — a recurring task, a
computed field, a findable page. Writing a lint policy buys a list of complaints.

### 3.2 Small team under ~15 — NO EVIDENCE FOUND

I found no source that attributes any configuration behaviour — formulas, API use, automation
tools, paid templates, naming conventions, or developer tooling — to a Notion team of a stated size
under 15 people. Not one.

**NO EVIDENCE FOUND.**

I am recording the absence rather than reasoning from the solo or the enterprise evidence to fill
it. Note that this absence is produced partly by my blocked sources: Reddit and a Notion community
forum are where a five-person startup would post, and I could reach neither. **Absence of evidence
here is substantially an artifact of the blocked crawl, exactly as the prior sweep warned.**

### 3.3 Technical operators — EVIDENCE FOUND, strong, and self-defeating

Not one of the two segments named in the brief, but the evidence forced it into view.

- **`@notionhq/client` recorded 6,505,659 downloads from 2026-07-17 to 2026-08-15** (npm registry
  API, `api.npmjs.org/downloads/point/last-month/@notionhq/client`). A large population interacts
  with Notion programmatically. Download counts include CI and mirrors and do not map to humans;
  treat the number as an order of magnitude, not a headcount.
- Larson wrote four separate scripts rather than search for a tool (2.2).
- `jeromegit` published `notion-duplicates` to GitHub and PyPI. Zero stars.

**This population unambiguously tolerates configuration files. It also writes the tool instead of
buying it.** Every artifact above is a person who hit the pain and shipped their own answer within
a weekend. That is the definition of a market that will not pay.

---

## 4. WHAT THEY DO INSTEAD TODAY

Six observed responses. Ranked by how often they appear in the reachable corpus.

1. **Delete everything and rebuild.** Suzaan Sayed, 2026-04-29, verbatim: *"Three months ago I
   deleted everything in my Notion."* `grizzlytemplates.com` reports *"My workspace has been
   rebuilt from scratch at least three times"* `[search summary — the page returned HTTP 403 on
   direct fetch, so this quote is unverified]`.
2. **Buy or duplicate a template.** The Notion Marketplace and Gumroad carry cleanup and audit
   templates; Sue-Jan Noreiga's self-audit template is one. Secondary reporting puts top Gumroad
   Notion template sellers in the $500–$3,000/month range with outliers far above
   (`insightraider.com`, `kupkaike.com`) `[search summaries — not verified by fetch; treat as
   weak]`.
3. **Impose a manual periodic ritual.** Minu Writes: *"a fifteen minute reset every Sunday."*
   Tag guidance: merge duplicate tags quarterly.
4. **Simplify by fiat.** Sayed's two-click rule. Four-page workspaces. Four-section dashboards.
5. **Buy an automated auditor.** NoteRunway, launched 2026-03-29.
6. **Write a script.** Larson, `jeromegit`, `dvanoni/notero`'s requesters.

**Finding.** Responses 1 through 4 are the common ones, and none of them has a slot for a
diagnostic. The user who deletes everything has already decided the old structure is worthless;
a report enumerating its defects arrives after that decision, not before it. The user doing a
Sunday reset is doing the *remediation* by hand and does not lack the *diagnosis* — they can see
their own workspace. Responses 5 and 6 do have a slot, and both are already occupied: 5 by a
zero-config commercial product, 6 by the user's own thirty lines of Python.

The brief anticipated this correctly. **A user whose response is "start over" will never run a
linter,** and "start over" is the single most documented response in this corpus.

---

## 5. VERDICT

### **NO.** There is no viable non-consultant segment for a *config-driven* structural linter at v0.1.

The reason, stated as a mechanism rather than a mood:

The product's value is gated on the user writing a policy. A policy states what the workspace
*should* look like. Every solo behaviour in section 3.1 and every remediation in section 4 shows
individuals who do not have a stable answer to that question — that instability *is* their
complaint. Sayed rebuilt because her structure was wrong; Minu Writes had "three 'systems'... each
with its own logic". Asking these users to declare their intended schema asks them to supply the
artifact whose absence is the problem. Six of eight rules do nothing until they answer.

The two rules that fire without a policy — duplicate detection and orphan/broken-reference
detection — are real, TESTABLE, and confirmed by independent evidence (1.3, 1.4). They are also
the exact surface NoteRunway already covers commercially, without a config file, since
2026-03-29. On that surface the product is not differentiated by its rules; it is differentiated by
requiring more setup than the incumbent.

The segment that will unambiguously tolerate a YAML config is the technical operator
(section 3.3). That segment's demonstrated response to this pain is to write the tool
in an afternoon. Six and a half million monthly SDK downloads is a supply signal, not a demand
signal.

**Named alternative, since the brief asks for a segment if the answer is yes:** the nearest thing
to a viable non-consultant buyer is the **technical solo operator or founding engineer who already
runs the Notion API and already maintains a workspace past a few thousand pages** — Larson's
profile, minus the company. I am not naming it as a yes, because the one documented member of it
built his own.

### Strongest counter-argument to my own answer

**My NO may be a verdict on the config file, not on the segment.**

NoteRunway exists. Someone funded and shipped a product whose seven detection categories match
this rule catalog nearly item for item, five months ago. NotePulse exists for the stale-page
subproblem alone. `notion-duplicates` and Notero #252 exist for the duplicate subproblem alone.
Four independent artifacts attacking four slices of one pain is not the signature of a
non-existent market. It is the signature of a real, fragmented, under-served one.

If that reading is right, then the finding is not "no segment exists" but **"the segment exists and
the configuration requirement is what excludes it."** A tool that ran the two zero-config rules on
first invocation and offered the other six as opt-in would test the same audience without the
gate. My evidence cannot distinguish these two readings, because the thing I would need to
distinguish them — high-volume first-person complaint from ordinary users — lives on Reddit, and
Reddit is blocked.

A second, weaker counter: my Capterra sample is relevance-ranked, not exhaustive, and it still
surfaced two verbatim complaints naming duplicate pages, outdated information, and inconsistent
naming as the top drawback of the product. That is a higher hit rate for TESTABLE structural
defects than I expected before running the sweep.

---

## 6. NEXT ACTION

Three, in priority order.

1. **Falsify or confirm the configuration gate directly, since it is the load-bearing claim and my
   evidence cannot settle it.** Ship the two zero-config rules (duplicate title within a database;
   orphan page and broken @mention reference) as the default first run, and instrument whether any
   user ever writes a config file for the other six. That is a measurement, not a redesign.
2. **Buy or trial NoteRunway and record what it reports on a real messy workspace.** It is the
   direct incumbent on the zero-config surface and launched 2026-03-29. The 72-hour API proof in
   `CONTEXT.md` should run against the same workspace so the two outputs are comparable.
3. **Re-run this sweep from a network that can reach Reddit, or through a human who can search
   r/Notion by hand.** The solo segment verdict in this document rests on blogs, review-site cons
   fields, and vendor copy. The population it describes talks somewhere else. Until r/Notion is
   read, both this document's NO and the prior sweep's "NO EVIDENCE FOUND" are verdicts about a
   crawler, and it would appear as though the crawler has now delivered the same non-answer twice.
