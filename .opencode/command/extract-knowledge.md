---
description: "Extract document files (.docx, .pdf, .pptx, .xlsx, .md, .csv) into AI-friendly knowledge markdown for the configured Notion or Obsidian workspace. Usage: /extract-knowledge <file-or-folder> [--llm] [--out <dir>] [--overwrite] [--vault <path>] [--json]"
agent: build
---

## Writing guidance

Follow [Clear, concise, detailed documents](../../docs/document-writing.md). State the main point first, remove repetition, and retain the detail needed to decide, implement, test, or operate. Apply concise writing to authored summaries and enrichment. Preserve raw extraction, source provenance, exact identifiers, conditions, and exceptions; do not silently condense source evidence or imply the CLI rewrites it automatically.

## Diagram guidance

Read [Diagrams in generated documents](../../docs/document-diagrams.md) before drafting. Preserve extractable source diagrams and captions. Add source-backed derived views only as labeled enrichment, keeping the raw extraction intact; the CLI does not add diagrams automatically.

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


You are a Document Knowledge Extraction Agent. Your task is to process input documents (.docx, .pdf, .pptx, .xlsx, .md, .csv, etc.) and convert them into standardized, AI-friendly Markdown drafts for the configured Notion or Obsidian workspace.

## Instructions

1. Parse positional argument `<file-or-folder>` and optional flags (`--llm`, `--out`, `--overwrite`, `--vault`, `--json`) from `$ARGUMENTS`.
2. Check storage configuration:
   - When the provider is Notion (the default), do not require an Obsidian vault; stage the draft locally unless `--out` is provided.
   - When the provider is Obsidian, use `--vault`, `--out`, or `OBSIDIAN_VAULT_PATH` / `OBSIDIAN_VAULT`; prompt for the vault only when none is configured.
3. Call workflow engine:
   ```ts
   import { runFromEnv } from './src/extract-knowledge/index.ts';
   const result = await runFromEnv({
     source: '<file-or-folder>',
     llm: <boolean>,
     out: '<out-dir-or-undefined>',
     vault: '<vault-path-or-undefined>',
     overwrite: <boolean>,
     json: <boolean>
   });
   ```
4. Display extraction summary details to user.
