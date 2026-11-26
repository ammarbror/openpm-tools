---
description: Create or maintain an English product documentation hub with ten required sections in the configured Notion or Obsidian workspace. Usage: /product-documentation <product-name>
agent: build
---

# Product Documentation

Create or edit one English product documentation hub (`Product Documentation - <Name>`) in Notion (default) or Obsidian (`DOCUMENTS_PROVIDER=obsidian`). There is no CLI or MCP writer: use file, Notion MCP, and terminal tools, then verify what was saved.

## Workflow

1. Read `.codex/skills/product-documentation/SKILL.md`, `docs/document-writing.md`, `docs/document-diagrams.md`, and `docs/notion-workflow.md` (when using Notion).
2. Link canonical PRDDs, technical docs, Jira items, runbooks, and user docs instead of duplicating them.
3. Open with `## TL;DR` followed by the ten required headings in order, set `author` to the active user's profile (or `TBD`, never the AI/CLI tool name), eliminate all residual/filler wording, validate Mermaid diagrams, and verify saved read-back and single index entry.

User request: $ARGUMENTS
