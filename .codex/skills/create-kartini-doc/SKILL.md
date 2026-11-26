---
name: create-kartini-doc
description: Create or update a Product Documentation document in Kartini OS (https://kartini-os.com/product-documentation) from a Markdown specification, PRD, or technical document.
---

# Create Product Document in Kartini OS

Use this skill to convert and publish a local Markdown product specification, PRD, or technical document into **Kartini OS Product Documentation** (`https://kartini-os.com/product-documentation`).

## Prerequisites

1. **Active Chrome Session**: Google Chrome must be open with an active tab logged into `https://kartini-os.com` (as Ammar or authorized team member).
2. **Apple Events Permission**: In Google Chrome, enable **View > Developer > Allow JavaScript from Apple Events** so the tool can safely read the active Supabase JWT session token (`sb-zubhkexpkefjahotobnx-auth-token`) from `localStorage`.
   *(Alternative)*: Provide `DOC_AUTH_TOKEN` in `.env` if Chrome automation is unavailable.

## Kartini OS Architecture & Content Rules

- **Storage**: Powered by Supabase tables:
  - `product_documents` (`id`, `doc_number`, `title`, `summary`, `status`, `category`, `current_version_id`, `created_by`, `updated_by`).
  - `product_document_versions` (`id`, `document_id`, `version`, `status`, `sections`, `change_summary`).
- **Categories**: Must be one of `project`, `system`, `guideline`, or `other`.
- **Status Lifecycle**: Starts in `draft` (v1.0). Requires explicit user action or approval trigger to move to `pending_approval` / `approved`.
- **Section Numbering**: Kartini OS automatically renders 1-indexed section numbers (`1.`, `2.`, ...). Do **not** prefix section titles with numbers (e.g. use `Product Context & Ownership`, not `1. Product Context & Ownership`), otherwise it will display as duplicate numbers (`1. 1. Product Context...`).
- **Formatting Standards**:
  - Tables: Must use `<table class="doc-table"><thead>...</thead><tbody>...</tbody></table>`.
  - Code Blocks: Must use `<pre data-language="..."><code><span class="code-line">...</span></code></pre>`.
  - Sub-headings: Use `<h3>`.
  - Mermaid Diagrams: Do **not** leave Mermaid code inside the HTML body; extract it into the dedicated `mermaid` property on the section object so Kartini OS renders it as a crisp, interactive SVG.

## Execution Workflow

### Step 1: Prepare the Source Markdown
Ensure the source specification file exists (e.g. `docs/specifications/<name>.md` or generated via `product-technical-specification` / `product-documentation`) and follows [Clear, concise, detailed documents](../../../docs/document-writing.md):
- Document title in `# Title` or frontmatter (if `author` is included, set it to the active user's profile or `TBD`—never the AI/CLI tool name).
- Start the document body with a concise `## TL;DR` section before the main sections.
- Clear summary in the `TL;DR` / executive summary / problem statement.
- Sections partitioned by `## Section Title` without numeric prefixes.
- Eliminate all residual wording, draft chatter, meta-commentary, filler, and repetition so every section is to the point, clear, and clean.

### Step 2: Publish via OpenPM CLI
Run the integrated CLI command from the repository root:

```bash
# Create a new document in Kartini OS
npx openpm-tools publish-kartini-doc docs/specifications/<filename>.md

# Or publish with explicit category and summary
npx openpm-tools publish-kartini-doc docs/specifications/<filename>.md \
  --category project \
  --summary "Short description of the initiative"

# Or update an existing document version (e.g. PD-2026-0019)
npx openpm-tools publish-kartini-doc docs/specifications/<filename>.md \
  --doc-number PD-2026-0019 \
  --update-existing
```

### Step 3: Verify Rendered Content in Chrome
1. The CLI automatically signals Google Chrome to refresh the `kartini-os.com` tab.
2. Verify via browser evaluation or inspection:
   - Document row appears in the table with correct `doc_number` (e.g. `PD-2026-0019`), title, and `draft` status.
   - Drawer opens cleanly when the row is clicked.
   - All 13 sections, tables, code blocks, and interactive SVG diagrams render properly.
