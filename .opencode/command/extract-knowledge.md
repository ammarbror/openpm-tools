---
description: "Extract document files (.docx, .pdf, .pptx, .xlsx, .md, .csv) into AI-friendly knowledge markdown for the configured Notion or Obsidian workspace. Usage: /extract-knowledge <file-or-folder> [--llm] [--out <dir>] [--overwrite] [--vault <path>] [--json]"
agent: build
---

# Extract Knowledge

Extract input documents (`.docx`, `.pdf`, `.pptx`, `.xlsx`, `.md`, `.csv`, etc.) into clean Markdown drafts for Notion (default staging) or Obsidian.

## Instructions

1. Read `.codex/skills/extract-knowledge/SKILL.md`, `docs/document-writing.md`, `docs/document-diagrams.md`, and `docs/notion-workflow.md` (when publishing to Notion).
2. Parse positional `<file-or-folder>` and optional flags (`--llm`, `--out`, `--overwrite`, `--vault`, `--json`) from `$ARGUMENTS`.
3. Call the workflow engine:
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
4. When authoring enrichment or publishing to Notion, open with `## TL;DR`, remove parsing artifacts and residual/filler wording while preserving source facts and identifiers, set any `author` metadata to the active user's profile (never the AI/CLI tool name), and report the saved page URL or staged file path.

User request: $ARGUMENTS
