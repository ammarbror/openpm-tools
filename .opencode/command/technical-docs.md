---
description: Create or edit English technical documentation with ten required sections in the configured Notion or Obsidian workspace. Usage: /technical-docs <system-name>
agent: build
---

## Writing guidance

Follow [Clear, concise, detailed documents](../../docs/document-writing.md). State the main point first, remove repetition, and retain the detail needed to decide, implement, test, or operate. Explain system purpose and boundaries first, then responsibilities, interactions, contracts, and failure handling. Keep exact technical detail in the relevant section or appendix and reference it elsewhere.

## Diagram guidance

Read [Diagrams in generated documents](../../docs/document-diagrams.md) before drafting. Cover architecture, module dependencies, ERD, and relevant access, navigation, integration, and recovery flows using focused diagrams.

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
publication pending.

# Technical Documentation

Create or edit one English technical document for a software system, product, or platform. Use this command for system documentation, architecture documentation, technical design documentation, or an update to an existing document in this format. Read `.codex/skills/technical-docs/SKILL.md` for the complete section expectations, edit rules, and completion checklist.

There is no CLI or MCP writer for this workflow: run it with the available file, MCP, and terminal tools, then verify what was actually saved.

## Storage and Naming

- Notion: store under the OpenPM hub's technical documentation category, search before creating, and verify the saved page reads back with all required sections.
- Obsidian: resolve the vault from `OBSIDIAN_VAULT_PATH`, `~/Documents/Obsidian Vault`, or `~/Obsidian`; ask for the path if none exists. Store under `<VAULT>/01 Projects/Technical Documentation/` as `Technical Documentation - <Name>.md` and keep `Daftar Technical Documentation.md` with one English wikilink per document. Do not add duplicate links.
- Never create an Indonesian companion file.

## Create workflow

1. Ask for the system or product name if it is missing.
2. Inspect referenced source files, repositories, schemas, or existing documentation before asking questions.
3. Ask focused questions only about missing decisions that materially change scope, business rules, or contracts.
4. Resolve the exact target before writing. If the document already exists, use the edit workflow and preserve its content.
5. Set `status: Draft` while material decisions remain unresolved, mark unknowns `TBD`, and record approval only with evidence.
6. Add YAML frontmatter with `title`, `version`, `status`, `author`, `date`, `type`, `language: en`, and `source` when applicable.
7. Add a version-history table at the end and update the documentation index.

## Edit workflow

- Read the complete document and preserve required sections, technical identifiers, API paths, table names, code examples, and unrelated content.
- Update the requested facts plus directly affected architecture, ERD, data dictionary, API contracts, diagrams, and failure handling; report which sections changed.
- Increment the frontmatter version and append an English version-history entry for every material edit.
- Stop and ask if an active editor marker, lock, or conflicting unsaved version is present.
- Update the index only when the document is new or its title/path changes.

## Required structure

Use these headings in this order and preserve all ten when editing:

1. `## 1. System Purpose & Core Principles`
2. `## 2. High-Level System Architecture`
3. `## 3. Security Model: Roles & Access Rules`
4. `## 4. Editing Safety: One Editor at a Time`
5. `## 5. Module Map`
6. `## 6. Release Cadence & Patch Log`
7. `## 7. Technical: Core Data Model (ERD)`
8. `## 8. Technical: Roles & Enforcement`
9. `## 9. Technical: Application Stack`
10. `## 10. User Interface: Shell & Navigation`

Keep release notes in Section 6 and document revisions in the version-history table; a documentation edit does not imply a software release. Do not imply a one-editor lock unless confirmed; state why Section 4 is not applicable when concurrent editing is irrelevant. Add API, testing, operations, data-governance, or glossary appendices only when the source supports them.

## Safety and validation

- Keep prose, headings, tables, and metadata in English; preserve exact API, table/column, enum, environment-variable, collection, event, and code-symbol names.
- In ERD diagrams and data dictionaries, use real table/collection identifiers exactly as provided; do not rename or abbreviate them.
- Distinguish `Existing`, `Proposed`, and `Unverified` behavior with source references and flag conflicting sources.
- Use fenced Mermaid blocks with valid `flowchart`, `sequenceDiagram`, or `erDiagram` syntax and quoted labels where punctuation could break parsing. Validate with an available parser or renderer and name the tool; otherwise report manual review only.
- Do not invent implementation details; label unsupported decisions `TBD`.
- Do not synchronize to Lark, Jira, or another external system unless explicitly requested.
- Before reporting completion, verify the ten headings, valid frontmatter with `language: en`, diagram verification status, exact identifiers, version history, a single index link, and that no unrelated files changed.

User request: $ARGUMENTS
