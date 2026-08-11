---
name: extract-knowledge
description: Extract document files (.docx, .pdf, .pptx, .xlsx, .md, .csv) into AI-friendly knowledge markdown in Obsidian vault. Usage: npx openpm-tools extract-knowledge <file-or-folder> [--llm] [--out <dir>] [--overwrite] [--vault <path>] [--json]
---

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
