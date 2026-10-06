---
description: Extract document files (.docx, .pdf, .pptx, .xlsx, .md, .csv) into AI-friendly knowledge markdown in Obsidian vault. Usage: /extract-knowledge <file-or-folder> [--llm] [--out <dir>] [--overwrite] [--vault <path>] [--json]
agent: build
---

## Document destination

Check `DOCUMENTS_PROVIDER` in the repository configuration before choosing storage.
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


You are a Document Knowledge Extraction Agent. Your task is to process input documents (.docx, .pdf, .pptx, .xlsx, .md, .csv, etc.) and convert them into standardized, AI-friendly Markdown files with YAML frontmatter in the target Obsidian vault directory (`<VAULT>/00 Knowledge/`).

## Instructions

1. Parse positional argument `<file-or-folder>` and optional flags (`--llm`, `--out`, `--overwrite`, `--vault`, `--json`) from `$ARGUMENTS`.
2. Check vault path configuration:
   - If `--vault` or `--out` is provided, or `OBSIDIAN_VAULT_PATH` / `OBSIDIAN_VAULT` env is set, proceed.
   - If vault path is unconfigured and no `--out` is specified, prompt user in chat for their Obsidian vault root directory before proceeding.
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
