---
name: extract-knowledge
description: Convert supported documents into AI-friendly knowledge Markdown files in the configured Notion or Obsidian workspace.
---

## Writing guidance

Follow [Clear, concise, detailed documents](../../../docs/document-writing.md). When authoring or publishing the knowledge document, start with a concise `## TL;DR` section summarizing the core purpose, takeaways, and scope before the main body. Eliminate parsing artifacts, residual template/OCR wording, filler, meta-commentary, and repetition so authored summaries are to the point, clear, and clean. If setting `author` metadata, use the active user's profile (or original source author, or `TBD` if unavailable)—never the AI/CLI tool name. Preserve raw extraction, source provenance, exact identifiers, conditions, and exceptions; do not silently condense source evidence or imply the CLI rewrites it automatically.

## Diagram guidance

Read [Diagrams in generated documents](../../../docs/document-diagrams.md) before drafting. Preserve extractable source diagrams and captions. Add source-backed derived views only as labeled enrichment, keeping the raw extraction intact; the CLI does not add diagrams automatically.

## Document destination

Check `DOCUMENTS_PROVIDER` in the repository configuration before choosing storage.
If it is unset or blank, default to Notion; set it to `obsidian` only when local Obsidian storage is explicitly requested.
Use the configured provider and `NOTION_ROOT_PAGE_URL` automatically; do not ask
the user to select storage again. An explicit user destination overrides this
default. If the configured page is inaccessible, report the access problem
instead of silently changing destinations.
When it is `notion`, follow `docs/notion-workflow.md`: use the official Notion MCP
connection and the OpenPM hub; local-vault paths, wikilinks, and file-index rules
below apply only to Obsidian. Preserve the content, evidence, section, interview,
and versioning requirements. Store metadata as page properties or a table. Use
Notion page links, search before creating, read before editing, and read back saved
pages. Without an authenticated Notion connection, preserve the draft and report
publication pending. Extraction produces local staging files for the agent to
publish through Notion; it does not upload automatically.


# Extract Knowledge

Run:

```bash
npx openpm-tools extract-knowledge <file-or-folder> [--llm] [--out <dir>] [--overwrite] [--vault <path>] [--json]
```

The input may be `.docx`, `.pdf`, `.pptx`, `.xlsx`, `.md`, `.csv`, or another supported document format. Use `--llm` only when requested or useful, `--out` for a custom destination, `--vault` to override vault configuration, `--overwrite` only when authorized, and `--json` for structured output. Never overwrite existing knowledge files silently.
