---
description: Create or edit English technical documentation with ten required sections in the configured Notion or Obsidian workspace. Usage: /technical-docs <system-name>
agent: build
---

# Technical Documentation

Create or edit one English technical document (`Technical Documentation - <Name>`) in Notion (default) or Obsidian (`DOCUMENTS_PROVIDER=obsidian`). There is no CLI or MCP writer: use file, Notion MCP, and terminal tools, then verify what was saved.

## Workflow

1. Read `.codex/skills/technical-docs/SKILL.md`, `docs/document-writing.md`, `docs/document-diagrams.md`, and `docs/notion-workflow.md` (when using Notion).
2. Inspect referenced code, schemas, and docs before asking focused questions.
3. Open with `## TL;DR` followed by the ten required headings in order, set `author` to the active user's profile (or `TBD`, never the AI/CLI tool name), eliminate all residual/filler wording, validate Mermaid diagrams, and verify saved read-back and single index entry.

User request: $ARGUMENTS
