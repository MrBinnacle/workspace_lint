# workspace-lint

A local, read-only CLI that tests a Notion workspace against explicit structural rules.

Run one command. Get a reproducible report: which declared rules no longer hold, the evidence for each defect, a direct link to the affected resource, and one plain repair action.

Working tagline: *CI for Notion workspaces.*

The tool tests rules you declare. It does not judge workspace quality, and it does not infer intent, ownership, or canon from prose.

## Status

**Pre-build.** No source code exists yet. This repository holds the grounding documents the build will work from.

The gate before any build is a 72-hour proof answering one question: can the official Notion API support a complete, deterministic, useful scan of a declared scope? If it cannot produce a complete coverage manifest and stable findings without write access or an LLM, the project stops.

## Two ideas that carry the product

**A partial scan cannot pass.** Notion's API only returns what has been shared with your connection. A green report over half a workspace is a lie, so coverage is part of the result: the report states its access boundary, and an incomplete traversal exits `2` rather than `0`.

**Unknown is not broken.** Notion answers 404 for both "this object is gone" and "you cannot see this object". The report keeps those apart — `confirmed` findings are proved, `indeterminate` findings say what could not be established and why.

## Rules in v0.1

Two built-in, six configured.

| ID | Checks | Mode |
| --- | --- | --- |
| `SYS001` | Scan result is incomplete | Built-in |
| `REF001` | Internal target is archived, trashed, or unreachable | Built-in |
| `REQ001` | Selected resource lacks a required property value | Configured |
| `UNQ001` | Declared unique value occurs more than once | Configured |
| `SCH001` | Peer data sources have incompatible schemas | Configured |
| `REL001` | Relation violates its allowed target contract | Configured |
| `DEP001` | Active resource points to an inactive dependency | Configured |
| `CAN001` | One boundary holds more than one canonical marker | Configured |

Six of eight need configuration, so a first run reports coverage and little else until you declare an invariant. That cost is deliberate — see [ADR-0001](docs/adr/0001-linter-not-entropy-engine.md).

## Intended command surface

Provisional. No code implements this yet.

```bash
workspace-lint scan                                  # coverage + built-in checks
workspace-lint scan --config workspace-lint.yml      # full policy scan
workspace-lint baseline create --config workspace-lint.yml
workspace-lint explain REQ001
```

Exit codes: `0` clean, `1` new violations, `2` auth/config/coverage failure, `3` internal error.

## Name

`workspace-lint` is taken on npm — a security holding package at `0.0.1-security`, no maintainers. The npm package name must differ or be disputed with npm support. The repository name is unaffected. Details in [CONTEXT.md](CONTEXT.md).

## Documents

| Path | What it holds |
| --- | --- |
| [CONTEXT.md](CONTEXT.md) | Glossary, principles, rule catalog, non-goals. Canonical. |
| [docs/adr/](docs/adr/) | Decisions and their consequences. |
| [CLAUDE.md](CLAUDE.md) | Project grounding for Claude Code. |
| [docs/agents/](docs/agents/) | Issue tracker, triage labels, and doc layout the agent skills read. |

This repository is canonical. External planning artifacts are inputs to it, not authorities over it.

## Development

No toolchain is chosen. `.gitignore` covers Node, Python, and Rust; trim it once the stack is settled. The intended surface is a Node CLI, which makes Node the working assumption but not a decision — no ADR records it.
