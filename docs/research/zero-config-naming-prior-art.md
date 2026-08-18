# "Zero-config" in shipped tooling, and what to call a run with roots but no policy

**Evidence class: documented.** This file records what primary sources state. No Notion response was
involved. Nothing here outranks `docs/proof/`.

Run for issue **#70**. Research note. Written 2026-08-17. All web sources fetched 2026-08-17 unless
stated. **A recommended term is not a decision** — the rename is the operator's call and both files it
would touch are plan-gated.

**Recommended term: `policy-free scan`.** The field supports it, and this repository already
uses the word "policy" in that exact sense in ADR-0001. The rename is not a style preference.
`zero-config` currently carries two incompatible senses inside this repository's own canonical
documents, and one of them is a decision ADR-0001 *rejected*.

**Verdict on keeping "zero-config": not salvageable as the entry point's name. Salvageable as a
hedged capability sentence, in Biome's grammatical form, and only when the minimum input is stated
in the same breath.**

---

## 0. Method, and what a source is evidence of

A marketing page is a primary source for what a project **claims**. It is not a source for what the
project **does**. Section 1 therefore prints the claim and the minimum input in the same row, and
takes the minimum input from installation and getting-started documentation, not from taglines.

Routes not taken, and failures, are recorded in section 6.

---

## 1. Thirteen tools: the claim, and the actual minimum first run

Columns: does the project's **own** documentation use "zero-config"/"zero configuration"; the
verbatim claim; what the user must actually supply before anything runs.

### 1.1 Projects that make the claim

| Project | Verbatim claim (own docs) | Actual minimum input for a first run |
| --- | --- | --- |
| **Parcel** | "The zero configuration build tool for the web." Also: "No more fiddling with configuration, or spending hours to keep up with best practices" and "Parcel works out of the box just as you'd expect." | An HTML entry file that exists on disk, plus an install and an invocation naming that file: `yarn add parcel`, then `parcel index.html`. |
| **Jest** | Feature heading "Zero config". Body: "Jest aims to work out of the box, config free, on most JavaScript projects." | `npm install --save-dev jest`; add `"test": "jest"` to `package.json` scripts; create a test file matching the default pattern (`sum.test.js`); run `npm test`. No `jest.config` file required. |
| **Biome** | "Although Biome can run with zero configuration, you'll likely want to tweak some settings to suit your project's needs" | Getting-started still instructs three steps: `npm i -D -E @biomejs/biome`, then `npx @biomejs/biome init` (which writes `biome.json`), then `npx @biomejs/biome check --write`. |
| **Create React App** | "You **don't** need to install or configure tools like webpack or Babel." Also: "No configuration or complicated folder structures, only the files you need to build your app." | `npx create-react-app my-app`. The tool writes the project, so the claim holds at t=0 and is discharged by generating the files. Escape hatch: eject, after which "you will need to maintain this configuration." The README now opens with a deprecation notice: the project "is now in long-term stasis". |

Sources: <https://parceljs.org/>; <https://jestjs.io/> and <https://jestjs.io/docs/getting-started>;
<https://biomejs.dev/guides/getting-started/>;
<https://raw.githubusercontent.com/facebook/create-react-app/main/README.md>. All fetched 2026-08-17.

### 1.2 Projects that deliberately do not make the claim

| Project | Verbatim stance (own docs) | Actual minimum input for a first run |
| --- | --- | --- |
| **Vite** | "Vite is opinionated and comes with sensible defaults out of the box." No use of "zero-config" on the guide page. | Scaffold with `npm create vite@latest`. `index.html` is mandatory and is "the entry point to your application", treated as source rather than configuration. `vite.config.js` is optional. |
| **esbuild** | "While esbuild can be configured, it attempts to have reasonable defaults so that many common situations work automatically." The phrase "zero config" does not appear. | Entry file plus explicit flags: `./node_modules/.bin/esbuild app.jsx --bundle --outfile=out.js`. Nothing is inferred; the output path is typed by hand. |
| **Prettier** | "Prettier is an opinionated code formatter". Option philosophy: "Prettier has a few options because of history. **But we won't add more of them.**" / "Option requests aren't accepted anymore." | A path and an action: `prettier . --write`. A config file is not required — `--no-config` is documented as "Do not look for a configuration file. The default settings will be used." |
| **Ruff** | "If no config file is found in the filesystem hierarchy, Ruff will fall back to using a default configuration." | A path, which defaults to the working directory: `ruff check path/to/code/`, with `[FILES]... [default: .]`. |
| **Turborepo** | Homepage headline: "Your codebase, faster." Section heading "Simple setup". No zero-config claim found on the homepage or the add-to-existing-repo guide. | Five setup steps: install `turbo`; create `turbo.json` with task definitions; add `.turbo` to `.gitignore`; add `devEngines.packageManager` to the root `package.json`; configure package-manager `workspaces` for multi-package repos. The guide's own framing: "After installing `turbo` and configuring your tasks in `turbo.json`, you'll notice how caching helps you run tasks much faster." |
| **dbt Core** | No zero-config claim. The page states the requirement directly. | "If you're using dbt from the command line, you need a `profiles.yml` file that contains the connection details for your data platform." Plus `dbt_project.yml`, whose `profile` field "references a profile name defined in `profiles.yml`". `profiles.yml` carries account identifiers, hosts, ports and credentials. |
| **Snyk CLI** | Describes itself as "a developer-first, cloud-native security tool". No ease-of-setup or zero-config claim in the CLI README. | "To use the CLI, you must install it and authenticate your machine." A Snyk account is required for `snyk auth`. For open-source projects the README adds that you must build the project first and have the package manager on `PATH`. |
| **OWASP ZAP baseline scan** | No zero-config claim. States the default policy explicitly: "By default it reports all alerts as WARNings but you can specify a config file which can change any rules to FAIL or IGNORE." | A target URL, mandatory: `docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t https://www.example.com`. The `-t` argument is the only required one. |
| **Vercel** | Uses detection language, never "zero configuration": "Vercel automatically configures the build settings for many front-end frameworks"; "Vercel auto-detects the install command during the build step." | A connected git repository. Named failure mode: "if no framework is detected, 'Other' will be selected. In this case the Override toggle for the Build Command will be enabled by default so that you can enter the build command manually." |

Sources: <https://vite.dev/guide/>; <https://esbuild.github.io/getting-started/>;
<https://prettier.io/docs/> and <https://prettier.io/docs/cli> and
<https://prettier.io/docs/option-philosophy>; <https://docs.astral.sh/ruff/configuration/>;
<https://turborepo.dev/> and <https://turborepo.dev/docs/getting-started/add-to-existing-repository>;
<https://docs.getdbt.com/docs/core/connect-data-platform/connection-profiles>;
<https://raw.githubusercontent.com/snyk/cli/main/README.md>;
<https://www.zaproxy.org/docs/docker/baseline-scan/>;
<https://vercel.com/docs/deployments/configure-a-build> (canonical
`https://vercel.com/docs/builds/configure-a-build`). All fetched 2026-08-17.

One incidental find on claim propagation. Vercel's framework catalogue repeats Parcel's tagline as
fact in a third-party voice: "Parcel is a zero configuration build tool for the web that scales to
projects of any size and complexity." The claim travels; the minimum input does not travel with it.

### 1.3 What the survey shows

**No surveyed tool requires zero input.** Every one needs an artifact naming what to operate on and
an invocation naming what to do. The four that claim "zero-config" do not count those as
configuration.

So the field's operative meaning of "zero-config" is narrow and consistent:

> No policy file, no rule selection, no build graph. It has never meant no input.

On that meaning alone, `workspace_lint` would qualify. There is a discriminating variable that
stops it.

**The discriminating variable is where the input comes from.** Every tool that claims the term takes
input that is already present in the working directory, or that the tool itself writes:

- Parcel reads `index.html` because it is there.
- Ruff and Prettier default to `.`.
- Jest globs for `*.test.js`.
- Create React App generates the project it then builds.

`workspace_lint` cannot do this. Its minimum input is a Notion integration token obtained through the
developer portal, at least one opaque page ID, and a share action performed inside Notion's UI. None
of those is discoverable from the filesystem, and ADR-0002 establishes that the connection cannot
enumerate its own grant, so the tool cannot recover the missing input by asking the API.

That places `workspace_lint`'s first run alongside **Snyk** (`snyk auth`, account required) and
**dbt** (`profiles.yml` with warehouse credentials). Neither claims zero-config. Both state the
requirement in the first paragraph of their getting-started page.

The closest structural match in the survey is the **ZAP baseline scan**: one mandatory target
argument, an optional config file whose only job is to move rules between WARN, FAIL and IGNORE.
That is `workspace_lint`'s exact shape — declared roots mandatory, rule configuration optional. ZAP
does not call it zero-config. ZAP calls it a baseline scan and prints the default policy.

---

## 2. Terms of art, and what each actually denotes

| Term | First-party source | What it actually denotes | Fit for "roots but no policy" |
| --- | --- | --- | --- |
| **Convention over configuration** | Rails Doctrine: conventions remove decisions such as "whether it's 'id', 'postId', 'posts_id', or 'pid'". The doctrine concedes the remainder: "most applications worth building have some elements that are unique in some way. It may only be 5% or 1%, but it's there." | The tool infers settings from a structure it can already see. It presumes the structure is visible. | **No.** The premise fails. There is no visible structure — the token and the page ID are outside the tool's reach. |
| **Batteries included** | PEP 206: "having a rich and versatile standard library which is immediately available, without making the user download separate packages." | Distribution completeness. Nothing about configuration. | **No.** Wrong axis entirely. |
| **Sensible / reasonable defaults** | Vite: "opinionated and comes with sensible defaults out of the box." esbuild: "reasonable defaults so that many common situations work automatically." | Every setting has a value when you do not set one. Says nothing about required input. | **Accurate but weak.** True of this product, and it describes no differentiator. |
| **Opinionated (defaults)** | Prettier: "an opinionated code formatter"; "Option requests aren't accepted anymore… For formatting-related options, this is final." | The tool decides policy and declines to let you change it. | **No.** This product's declared rules exist precisely so the operator *can* change policy. The word would contradict framings 1 and 3. |
| **Auto-detection** | Vercel: "automatically configures", "auto-detects", plus the named fallback — "Other" preset with the override toggle pre-enabled. | Inference from observed artifacts, with a stated failure path. This is the honest form, because it names what happens when inference fails. | **No.** Same failed premise as convention-over-configuration. Nothing to detect. |
| **"Zero-config mode"** as distinct from "zero-config" | Not found as a first-party product term in any source checked. | — | Biome's hedge is the nearest thing: a **capability** sentence ("can run with zero configuration"), not a product name. That grammatical form is the part worth copying. |
| **Baseline scan / scan policy** | OWASP ZAP: the baseline scan takes a mandatory `-t` target; the optional config "can change any rules to FAIL or IGNORE." | The scanner field already separates **target** (mandatory scope) from **policy** (optional rule selection and severity). | **The right distinction, the wrong word.** See section 4 — "baseline" is unusable here. |

**Finding for item 2.** There is no single settled term of art for "runs without a policy, but not
without input." What the field does have, and what matters more, is the underlying distinction:
scanners treat **scope** and **policy** as two separate inputs, and only the second is optional. That
distinction is already load-bearing in this repository. It is what ADR-0002 and ADR-0011 are about.

---

## 3. Has anyone been burned by the promise? Yes, with receipts

Three cases where the claim itself was the ground of the complaint, and one where the escape hatch
was the concession.

**Parcel #4022 — "Parcel 2: TypeScript automatic zero configuration not type checking or reading
tsconfig.json."** Opened 2020-01-20, 85 comments, closed. The reporter derives the expectation
directly from the tagline: *"As part of parcels 'zero configuration', parcel automatically detects
TypeScript and configures the project to correctly use TypeScript."* Observed behaviour: the
`typescript` package was not installed automatically, `tsconfig.json` was ignored — the reporter
verified this by inserting deliberately malformed JSON and watching the build still succeed — and
type errors compiled silently.
<https://github.com/parcel-bundler/parcel/issues/4022>, fetched 2026-08-17.

**Parcel #8595 — "Parcel 2 doesn't work out of box, parcel 1 however does."** Opened 2022-11-01,
closed. Verbatim: *"if parcel 2 can live up to the disclaimer to be 'The zero configuration build
tool for the web' then it should be 'The zero configuration build tool for the web'."* And: *"There
could be more but it is not really zero configuration and drop in, tons of issues, but the moment I
revert back to 1, it just works magically."* One of the three listed defects was that the reporter
"had to add .parcelrc but still doesn't really work".
<https://github.com/parcel-bundler/parcel/issues/8595>, fetched 2026-08-17.

**Turborepo #749 — "Zero-config."** Opened 2022-02-16, closed. A feature request to *"Go back to zero
config"*, asking to *"Remove the need for `turbo.json` or any config and assume every task in
topological by default (like lerna)"* and to *"Make caching opt-in (remove the defaults) or
detected."* It was not implemented: `turbo.json` remains a required step in the current
add-to-existing-repo guide. A commenter argued for keeping the requirement: *"I do actually like that
turbo fails when a command is not in the `turbo.json`. It ensures I set the dependencies and cache
right and rename my scripts correctly."*
<https://github.com/vercel/turborepo/issues/749>, fetched 2026-08-17.

**Create React App — the escape hatch is the concession.** The README promises "You **don't** need to
install or configure tools like webpack or Babel", then documents eject: "all the configuration and
build dependencies will be moved directly into your project… but then you will need to maintain this
configuration." The promise was scoped to the happy path, and the boundary was a one-way door.
<https://raw.githubusercontent.com/facebook/create-react-app/main/README.md>, fetched 2026-08-17.

**The mechanism, stated plainly.** In none of these cases is the complaint "I had to type a command."
The complaint is that the claim set an expectation about *what the tool would infer*, the tool failed
to infer it, and the user could not tell whether that was a bug or a boundary. "Zero-config" moves
the job of stating the tool's limits out of the documentation and into the user's surprise.

That is the coverage problem wearing different clothes. This product's entire differentiator is
stating precisely what it could not reach. Opening with a claim that conceals what it needs is the
same defect the coverage manifest exists to prevent, committed in the first sentence a buyer reads.

**Negative result, recorded.** No case was found of a project **renaming** or **retracting** a
zero-config claim. Parcel and Jest both still carry the claim verbatim on their front pages as of the
2026-08-17 fetch. Route taken: repo-scoped and global full-text search over GitHub issues via the
`gh` CLI, using the complaint phrasings `"not zero config"`, `"zero-config" misleading`, and
`"zero-config" but requires`. Global searches returned noise. The two Parcel hits came from
repo-scoped searches. This is a weak negative: absence of a rename in GitHub issue text is not
evidence that no project ever renamed one, and marketing-copy history is not searchable from issue
trackers.

---

## 4. Recommendation

### 4.1 The finding that decides it is internal, not external

Grep across the repository for `zero[- ]config`, 2026-08-17. The term already carries **two
incompatible senses in canonical documents**.

**Sense A — ADR-0001, decision 4, a settled rejection:**

> "Policy checks require explicit configuration. Zero-config inference of owner, canon, uniqueness,
> or peer status is rejected."

Here "zero-config" means *the tool infers policy the operator never declared.* ADR-0001 rejects it.

**Sense B — PRODUCT.md, framing 2, the adopted entry point:**

> "**Zero-config decay report** — 'run one command, get what is stale, abandoned, duplicated, and
> over-complex, with links.' Costs the user nothing before it returns something."

Here "zero-config" means *the tool runs built-in rules that need no declared policy.*

The two are substantively compatible. Counting relation totals and edit ages is not inferring canon,
and PRODUCT.md says so directly: *"Counting stays inside that decision; scoring leaves it."* The
conflict is purely terminological. But it is exactly the kind of collapse `CONTEXT.md` exists to
prevent, and PRODUCT.md warns about this specific hazard two lines earlier — shipping a judgement
"would reopen ADR-0001 without a superseding ADR." A reader who reads decision 4 and then reads
framing 2 sees the product naming its entry point after a thing an ADR rejected.

**The repository already owns the correct vocabulary.** ADR-0001's own Consequences section uses it:

> "The user must declare **policy** before most checks do anything. Out of the eight v0.1 rules, six
> are configured and only two are **built-in**."

`docs/inputs/decay-causal-synthesis-2026-08-16.md` §3 uses it too: the countable signals are
*"countable without a declared policy."*

So "policy" already means the operator-authored rule configuration, and "built-in" already means a
rule that needs none. `policy-free scan` is not a borrowed term. It is the term this repository has
been using without naming.

### 4.2 Recommended term

**`policy-free scan`** — a run with declared roots and credentials, and no operator-declared rule
configuration. Only built-in rules evaluate.

Why it holds:

1. It names the thing that is absent (policy), not the thing that is present (rules), and not a
   quantity of effort (zero).
2. It matches the field's real distinction. ZAP's optional config exists only to move rules between
   WARN, FAIL and IGNORE — that is policy, and the target is not.
3. It composes with `CONTEXT.md`'s existing atoms — Declared root, Rule, Operator — and touches no
   coverage vocabulary. Coverage is still measured against declared roots either way, which is the
   point: **scope is not policy, and a policy-free scan still has scope.**
4. It cannot be read as reopening ADR-0001 decision 4, because decision 4 is about inference and this
   term makes no inference claim.

**Consequent naming for the entry point:** `policy-free decay report`. One word changes; the sentence
that follows it in PRODUCT.md — "Costs the user nothing before it returns something" — is the true
claim and survives verbatim.

### 4.3 Rejected alternatives, with reasons

- **`baseline scan`** (ZAP's own term, the closest structural match in the field). **Unusable.**
  `CONTEXT.md` defines *Baseline* as "The accepted-debt record", and enforces "Baseline is not
  suppression" as one of its seven distinctions. Importing ZAP's word would collide with a defined
  term that ADR-0008 and ADR-0010 both depend on. Recorded here because it is the best available
  demonstration that a field term must be checked against the local glossary before adoption.
- **`built-in rule scan` / `default-rule scan`.** Accurate, and PRODUCT.md already uses "built-in
  rather than a configured rule". But it names the rules rather than the absent configuration, and it
  provokes "which defaults?" before the report has been described. Keep "built-in rule" as the
  rule-level adjective; do not promote it to the run-level name.
- **`unconfigured scan`.** Reads as a defect state or a setup error, not a mode.
- **`out-of-the-box run`.** In every source checked, "out of the box" describes a feeling that
  nothing had to be touched. It states no contract, and this product sells contracts.
- **`zero-config scan`, retained as-is.** See 4.4.

### 4.4 Is "zero-config" salvageable? Narrowly, and not as a name

**Not as the name of the entry point.** Three reasons, in order of weight:

1. It is already overloaded inside this repository, against a settled ADR (4.1).
2. It is false on this product's own definition of the word. The operator must obtain a token from
   the developer portal, share pages with an integration, and supply at least one page ID. ADR-0002
   establishes the tool cannot recover any of that itself. A buyer tests the claim in the first five
   minutes and finds it false — which is precisely the failure PRODUCT.md names for the wider claim:
   "A precise smaller claim is sellable; a vague larger one is not, and a buyer who tests the larger
   one finds it false."
3. The evidence in section 3 shows what happens next. The complaint does not arrive as "your docs
   were imprecise." It arrives as a bug report quoting the tagline back.

**Salvageable as a hedged capability sentence, in Biome's form**, and only with the minimum stated in
the same breath. Concretely:

> Runs with no rule configuration. It needs a Notion integration token and at least one declared
> root. It cannot discover either, because the API connection cannot enumerate its own grant
> (ADR-0002).

That sentence is honest, it is two lines, and it is also the pitch — the second half is the product's
only uncontested differentiator. The cost of the honesty is negative.

### 4.5 Proposed `CONTEXT.md` glossary rows

Written to match the existing table's register. Adoption is the owner's call.

| Term | Definition |
| --- | --- |
| Policy | The operator-authored rule configuration: which rules run, over what scopes, with what parameters and thresholds. Distinct from declared roots, which are scope. A scan requires scope. It does not require policy. |
| Policy-free scan | A scan run with credentials and declared roots but no policy. Only built-in rules evaluate. Coverage is measured against declared roots exactly as in a configured scan, and the report disposition is computed the same way. Not "zero-config": the operator must still supply a token and at least one declared root, and the connection cannot enumerate its own grant (ADR-0002). |
| Built-in rule | A rule whose applicable set is determined without policy. Contrast: configured rule. `UNQ001` is currently configured and PRODUCT.md moves it to built-in. |

### 4.6 What the rename does not do

It does not reopen Gate 1. Gate 1 decided **which framing is the entry point**, and that decision is
about the buyer and the surface, not about the label. PRODUCT.md's Gate 1 record can keep its
historical wording with a bracketed note, in the same "corrections are marked in place" convention
the file already uses for the coverage claim and the superseded kill criterion.

---

## 5. Next actions

1. **Decide the term.** If `policy-free scan` is accepted, the edit touches two canonical documents
   (`CONTEXT.md` glossary, `PRODUCT.md` framings and kill criteria) plus `README.md` if it carries
   the phrase. Both canonical documents are behind the §5 plan gate.
2. **Blast radius, measured 2026-08-17.** `zero[- ]config` appears in: `PRODUCT.md` (5 lines: 53, 69,
   86, 123, 184), `CONTEXT.md` (line 147), `docs/adr/0001-linter-not-entropy-engine.md` (line 20 —
   **do not edit**; ADRs are superseded by reference, and sense A there is correct as written),
   `.claude/state/checkpoint.md`, `.claude/state/checkpoint-archive.md`, `.claude/state/store.json`,
   `docs/demand-test/outreach.md`, and four files under `docs/inputs/` and `docs/research/`.
   `docs/inputs/` mirrors external artifacts and is never edited. Research sweeps are dated records;
   leave them.
3. **Check the claim gate before editing.** `CHECK-claims.ts` evaluates `<!-- claim: ... -->`
   comments in `PRODUCT.md` and `CONTEXT.md`. Confirm no claim comment quotes the term before
   rewording surrounding prose. Run `cd slice && npm run check` after the edit.
4. **Open the ADR-0001 terminology question explicitly.** Sense A and sense B are compatible, so no
   superseding ADR is needed. A one-line note in `CONTEXT.md` recording that "zero-config" in
   ADR-0001 means *inference without declaration*, and is not what framing 2 named, closes the
   collision permanently.

---

## 6. Routes not taken, and failures

- **`WebSearch` was never called.** The brief records it exhausted at 200/200. Every web source above
  came from `WebFetch` against first-party documentation, or from `gh` against GitHub.
- **`mcp__github__search_issues` failed** with `MCP error -32603: Authentication Failed: Bad
  credentials`, twice. Routed around via the `gh` CLI, which is authenticated in this repository.
- **`https://docs.snyk.io/snyk-cli/getting-started-with-the-snyk-cli` → 404.**
  `https://docs.snyk.io/developer-tools/snyk-cli/getting-started-with-the-snyk-cli` → 404. Snyk's row
  was sourced from `https://raw.githubusercontent.com/snyk/cli/main/README.md` instead, which is
  first-party. Consequence: Snyk's *marketing* claim was not surveyed, only the CLI README's. If a
  zero-config claim exists on `snyk.io` product pages, this note has not seen it.
- **`https://turborepo.com/…` → 301 to `https://turborepo.dev/…`.** Followed.
- **`https://semgrep.dev/docs/…` → 301 to `https://docs.semgrep.dev/…`.** Followed. Semgrep's
  quickstart requires `semgrep login` before `semgrep ci`; `semgrep scan` is the alternative for
  users without a GitHub or GitLab account. The page made no default-ruleset statement, so Semgrep is
  not in the section 1 tables — its minimum input is documented, its claim is not.
- **`https://parceljs.org/getting-started/migration/` returned navigation only**, no article body.
  The Parcel 1 → 2 configuration delta was therefore **not verified from the migration guide**.
  Section 3's Parcel evidence rests on the two issue threads instead, which quote the tagline
  directly and are stronger for the purpose.
- **Prettier's "What is Prettier?" page carried no CLI command.** The minimum invocation came from
  `https://prettier.io/docs/cli`.
- **Not attempted:** archived copies of marketing pages (no Wayback access without WebSearch), so the
  negative in section 3 about renames could not be tested against historical copy.
