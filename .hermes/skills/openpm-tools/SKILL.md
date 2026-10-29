---
name: openpm-tools
description: Run this repo's Jira, PR review, and document workflows.
---

# OpenPM Tools for Hermes

## When to use

Use for Jira tickets, sprint/standup reports, releases, Bitbucket PR reviews, and
product or technical documents managed by this checkout. Invoke with
`/openpm-tools <workflow> <request>` or select the matching workflow from the request.
Loading this skill does not authorize unrelated writes, messages, or scheduled jobs.

## Procedure

1. Resolve the checkout root from this loaded file: `.hermes/skills/openpm-tools/SKILL.md`
   is inside that root. Use the actual absolute path from skill loading; do not guess
   a different checkout. Read `<root>/AGENTS.md` and keep terminal commands in this
   root so the CLI loads the correct `.env`.
2. Read the matching canonical skill below in full using the file-reading tool.
   Resolve its relative references from the canonical file's own directory, not
   this Hermes wrapper. These are shared workflow instructions; follow them in
   Hermes using its available file, terminal, and MCP tools.

| Workflow | Canonical skill under the checkout root |
| --- | --- |
| `create-ticket` | `.codex/skills/create-ticket/SKILL.md` |
| `edit-ticket` | `.codex/skills/edit-ticket/SKILL.md` |
| `review-pr` | `.codex/skills/review-pr/SKILL.md` |
| `daily-standup` | `.codex/skills/daily-standup/SKILL.md` |
| `sprint-report` | `.codex/skills/sprint-report/SKILL.md` |
| `release-workflow` | `.codex/skills/release-workflow/SKILL.md` |
| `create-prdd` | `.codex/skills/create-prdd/SKILL.md` |
| `edit-prdd` | `.codex/skills/edit-prdd/SKILL.md` |
| `brainstorm` | `.codex/skills/brainstorm/SKILL.md` |
| `extract-knowledge` | `.codex/skills/extract-knowledge/SKILL.md` |
| `product-documentation` | `.codex/skills/product-documentation/SKILL.md` |
| `technical-docs` | `.codex/skills/technical-docs/SKILL.md` |
| `product-technical-specification` | `.codex/skills/product-technical-specification/SKILL.md` |

3. For documents and reports, read `<root>/docs/document-writing.md` and
   `<root>/docs/document-diagrams.md`. Keep explanations clear, concise, detailed,
   and source-backed; use diagrams for meaningful flows and relationships.
4. Use the discovered `openpm-tools` MCP tools when their inputs match the workflow.
   Tool prefixes depend on Hermes registration; inspect discovery rather than
   inventing tool names. For CLI operations, run `npm run cli -- <command> ...` from
   the checkout. Treat paths and user content as data; quote arguments safely.
5. PRDD guides return instructions, not saved documents. The agent writes document
   content through the configured provider. Notion is the default: follow
   `<root>/docs/notion-workflow.md`, use the separate authenticated Notion connection,
   and read back saved pages. Codex authentication does not authenticate Hermes.
   If unavailable, preserve a draft and report `publication pending`.

## Pitfalls

- Never print `.env`, credentials, cookies, tokens, or credential-bearing URLs.
  The MCP launcher loads `.env` inside this checkout; do not copy its values into
  Hermes configuration or skill files.
- Keep review snapshot/status/limitations/findings intact. Review publication uses
  the canonical skill's explicitly linked targets and failure handling; it does
  not authorize Jira status transitions, approval, or merge.
- Document-only workflows have no dedicated CLI/MCP writer. Do not invent commands
  such as `technical-docs` or assume generated text has been published.
- A missing canonical file or inaccessible provider is a reported blocker, not
  permission to substitute another workflow or destination.
- For Lark, use the installed Lark skills and authenticated user identity. Confirm
  service, target, identity, and scope; obtain explicit confirmation immediately
  before each external write as required by the repository's Lark instructions.

## Verification

Check the canonical workflow's saved result, exact identifiers, version history,
and read-back requirements. Return the real ticket/page URL or absolute file path,
with remaining unknowns and any partial publication failure. Report tests and
rendering as verified only when actually checked.
