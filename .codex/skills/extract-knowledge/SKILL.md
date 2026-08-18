---
name: extract-knowledge
description: Convert supported documents into AI-friendly knowledge Markdown files in an Obsidian vault.
---

# Extract Knowledge

Run:

```bash
npx openpm-tools extract-knowledge <file-or-folder> [--llm] [--out <dir>] [--overwrite] [--vault <path>] [--json]
```

The input may be `.docx`, `.pdf`, `.pptx`, `.xlsx`, `.md`, `.csv`, or another supported document format. Use `--llm` only when requested or useful, `--out` for a custom destination, `--vault` to override vault configuration, `--overwrite` only when authorized, and `--json` for structured output. Never overwrite existing knowledge files silently.
