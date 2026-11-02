---
description: Create or update a Product Documentation document in Kartini OS (https://kartini-os.com/product-documentation) from a Markdown specification. Usage: /create-kartini-doc <file-path> [--category <cat>] [--summary <text>] [--doc-number <PD-YYYY-XXXX>]
agent: build
---

# Create Product Document in Kartini OS

Publish or update a Markdown product specification or PRD in Kartini OS Product Documentation (`https://kartini-os.com/product-documentation`).

## Usage

```bash
npx openpm-tools publish-kartini-doc $ARGUMENTS
```

## Workflow

1. Read `.codex/skills/create-kartini-doc/SKILL.md` for section conventions and formatting rules.
2. Ensure the source markdown file exists with `## Section Title` headings and diagrams.
3. Execute `npx openpm-tools publish-kartini-doc <filePath>` to convert sections, parse Mermaid diagrams, extract the active Chrome session token, and upload to Kartini OS.
4. Verify the document appears in Kartini OS and that the drawer renders tables and SVGs accurately.
