# Proving a structural claim about a Notion workspace

> **Status: UNSENT. Superseded 2026-08-17.** Gate 1 closed on the owner's own research rather than
> on a five-team send — see `PRODUCT.md`, Gates, gate 1, and issue #40. **Note the title.** This
> instrument is built around framing 3, the coverage proof, which Gate 1 concluded is not the entry
> point. It is the clearest surviving artefact of the recruitment bias issue #40 recorded: the
> questionnaire names the answer in its own heading. Kept as a record. **Do not send from it
> without reopening Gate 1 first.**

> **Header note — not part of the sent document.** The three lines below are placeholders. Matthew writes them in his own words at send time. Required content: (1) what decision the answers control — whether a read-only Notion CLI gets built at all, and which of three versions; (2) that the same questions go to a small number of people and the sets are read together; (3) what happens to the recipient's name. Prohibited: any description of the tool beyond "read-only command-line, reports what it could not see." Describing it teaches the recipient the answer to give. Delete this note before sending.

**Purpose:** `<one or two sentences — see header note>`

**From:** `<sender>` — **To:** `<recipient name and role>` — **How your answers will be used:** `<one sentence — see header note>`

## Context

Some teams keep data in Notion that other people depend on. Examples: a control register an auditor reads, a policy library, a customer or vendor record set, a database that feeds a production system. When that data is wrong or incomplete, somebody acts on the wrong thing.

These questions are about what you do today about that risk. They are not about whether your workspace is tidy. Tidiness is not the subject. Wrong answers and repeated work are the subject.

There is no product yet. There is no code. This questionnaire is the gate before any gets written.

## How to answer

Type your answers under each question, in the blockquote. Answer in any order.

Give the answer that is true, not the answer that helps the tool. "We do nothing about this" is more useful than a hopeful answer. Write "I don't know" where you do not know.

Skip nothing without a mark. If a question does not apply, write "N/A" and say why in five words.

Effort: about 15 minutes. There is no deadline. Answer when it suits you. Send a partial set rather than waiting until you can finish it.

---

## Part 1 — The data and who depends on it

### What data do you keep in Notion that someone outside your team relies on?

_Why this matters: this decides whether the rest of the questionnaire applies to you at all. Name the actual databases or page trees, not the category._

>

### Who reads that data, and what do they do with it?

_Name the role and the action. Example: "the external auditor pulls the control list each quarter and samples it."_

>

### When that data is wrong, who finds out, and how?

>

---

## Part 2 — The last time it was wrong

### Describe the last time you acted on something in Notion that turned out to be wrong or out of date. What did it cost?

_Why this matters: this is the single most important question here. Cost can be hours, a wrong decision, a repeated task, a customer effect, or an audit finding. Give the concrete incident, not the general pattern. If you cannot recall one, say so — that is a real answer._

>

### How often does that happen?

>

### Have you moved any data out of Notion because you could not trust it there? What moved, and where did it go?

_Why this matters: if the answer is yes and the move is done, the problem I am studying is already solved by exit, not by tooling._

>

---

## Part 3 — What you do today

### Somebody asks you to prove that a set of Notion pages or databases is complete and current. What do you do?

_Describe the actual steps. Include the manual ones. Include "I say it is complete and they accept that."_

>

### How do you know that nobody shared a page with you that you failed to check, or failed to share one you needed?

_Why this matters: the Notion API cannot list what a connection can see. I want to know whether you hit that limit by hand today._

>

### What do you use now — scripts, formulas, templates, paid tools, a person? Name them.

>

---

## Part 4 — Three versions of the same tool

Below are three tools. Each runs on your machine, reads Notion through the official API, and writes to nothing. Each is a real alternative. I will build one of the three, not all three. They are listed in no order of preference.

Answer all three blocks. Answer each block on its own, before you read the next one.

### Version A — Declared rules

You write a configuration file that states your rules. Example: "every row in the Vendors database must have an Owner." You run one command. You get a report that lists each rule that no longer holds, with a link to each defect.

Answer these three:
1. Would you run this? Yes or no.
2. Who would you show the output to?
3. What would have to be true before you paid for it?

>

### Version B — Decay report, no configuration

You write no configuration. You run one command. You get a report of what is stale, duplicated, unreferenced, or heavy: pages nobody edited in six months, duplicate titles, links that resolve to nothing, databases with no writes and no inbound references, and a count of the rollups and formulas each database carries. Every item carries a link. The report counts facts. It does not grade your workspace.

Answer these three:
1. Would you run this? Yes or no.
2. Who would you show the output to?
3. What would have to be true before you paid for it?

>

### Version C — Coverage proof

You name your starting pages and databases. You run one command. You get a written statement of exactly what the tool read and what it could not read: every page it reached, every request that failed, every limit it hit, and every gap. The report refuses to say "clean" when the scan was partial.

Answer these three:
1. Would you run this? Yes or no.
2. Who would you show the output to?
3. What would have to be true before you paid for it?

>

### Which version would you install first? Which would you never install?

_Give both, and say why in one sentence each._

>

### Would any of the three change what you show an auditor, a client, or a regulator? Which one, and what would change?

>

---

## Part 5 — Money and authority

### If this tool cost money, who signs for it, and out of which budget?

_Name the role. Say "nobody" if that is the answer._

>

### What do you pay for today that sits closest to this job?

>

---

## Part 6 — Agents

### Does anyone in your team use a Notion AI agent or assistant to answer questions from your workspace?

If yes: has it ever answered from a page that was out of date? What happened?

>

---

## Anything else?

What did I not ask that I should have?

>
