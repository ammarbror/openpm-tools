---
name: extract-knowledge
description: "Extract document files (.docx, .pdf, .pptx, .xlsx, .md, .csv) into AI-friendly knowledge markdown for the configured Notion or Obsidian workspace. Usage: npx openpm-tools extract-knowledge <file-or-folder> [--llm] [--out <dir>] [--overwrite] [--vault <path>] [--json]"
---

## Writing guidance

Follow [Clear, concise, detailed documents](../../../docs/document-writing.md). State the main point first, remove repetition, and retain the detail needed to decide, implement, test, or operate. Apply concise writing to authored summaries and enrichment. Preserve raw extraction, source provenance, exact identifiers, conditions, and exceptions; do not silently condense source evidence or imply the CLI rewrites it automatically.

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


# Extract Knowledge Skill

Run the following command using Bash:

```bash
npx openpm-tools extract-knowledge "$ARGUMENTS"
```

## Argument Extraction & Execution

- Positional argument `<file-or-folder>`: Path to a file or directory of documents.
- Optional flags:
  - `--llm`: Send extracted content through an OpenAI-compatible LLM for enhancement.
  - `--out <dir>`: Custom destination directory for output knowledge markdown files.
  - `--overwrite`: Overwrite target `.knowledge.md` files if they already exist.
  - `--vault <path>`: Root path of the Obsidian vault (overrides environmental configuration).
  - `--json`: Format CLI output as structured JSON.
