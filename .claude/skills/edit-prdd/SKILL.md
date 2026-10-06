---
name: edit-prdd
description: Edit an English-only nine-section PRDD file in the configured Notion or Obsidian workspace.
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


# Edit PRDD

Locate `PRDD - <Name> (EN).md` under `<VAULT>/01 Projects/PRDs/<sanitized-project-name>/`, resolving the vault from `OBSIDIAN_VAULT_PATH`, `~/Documents/Obsidian Vault`, or `~/Obsidian`; ask for the path if none exists. Do not require, create, or modify an Indonesian companion file. If the exact English PRDD cannot be found, stop and report the missing path instead of creating a replacement.

Read the user request and any attached material, interview one section at a time only when clarification is needed, and update the English document. Preserve the nine sections: overview/problem, goals/metrics/non-goals, user stories/use cases, MoSCoW functional requirements, architecture/tech stack, ERD/data dictionary, API contract/examples/sequence diagram, non-functional requirements, and dependencies/risks/assumptions/open questions.

Keep Mermaid syntax valid, bump the English document's frontmatter version (for example 1.0 to 1.1), and add an English version-history entry to that document.

## Edit Workflow

1. Locate the exact file and read the complete PRDD before editing.
2. Inspect referenced screenshots, repositories, schemas, APIs, tickets, and existing documentation that can establish the requested fact.
3. Ask only for information that remains materially ambiguous.
4. Change only the requested scope. Preserve unrelated prose, technical identifiers, API paths, table/collection names, enum values, JSON examples, and existing decisions.
5. If a schema, API, business rule, or object is added, removed, or renamed, harmonize every reference in requirements, architecture, ERD, data dictionary, API contracts, sequence diagrams, NFRs, dependencies, risks, assumptions, and open questions.
6. If an object is removed, delete stale references and do not leave residual discussion text or obsolete endpoints.
7. If the requested change introduces an unsupported implementation detail, mark it `TBD` or add it to open questions instead of inventing a decision.

## Consistency Rules

- Preserve the nine headings and their order:
  1. Overview & Problem Statement
  2. Goals & Success Metrics plus Non-Goals
  3. User Stories / Use Cases
  4. Functional Requirements
  5. System Architecture
  6. Database Schema / ERD
  7. API Contract
  8. Non-Functional Requirements
  9. Dependencies & Risks
- Keep MoSCoW separate from release priority: use `Must`, `Should`, `Could`, `Won't` for scope and `P0`, `P1`, `P2` for release priority.
- Preserve existing API and database field names and casing, including JSONB keys. For new contracts, prefer public camelCase fields and database snake_case fields when consistent with project conventions; document their mapping.
- Distinguish `Existing`, `Proposed`, and `Unverified` behavior, with source references. Requirements describe intended behavior; code and schemas establish implemented behavior within the inspected version/environment. Flag conflicting sources rather than silently choosing one.
- In ERD and data dictionaries, use exact schema identifiers. Do not pluralize, abbreviate, or replace a real table/collection name with a display label.
- For API changes, preserve or update method/path, actor, authentication, request, response, validation, errors, idempotency, retry, side effects, reads/writes, and transaction boundary.
- For state-changing or money/security-sensitive flows, preserve the documented source of truth, locking/transaction boundary, duplicate-event behavior, audit identifiers, and rollback/compensation behavior.

## Versioning and Safety

- Increment the frontmatter version for every material edit and append an English version-history row describing the change.
- Preserve the existing author and source metadata unless the user explicitly changes them; update the document date for the edit.
- If an active editor marker, lock, or conflicting unsaved version is present, stop and ask the user rather than overwriting.
- Update `Daftar PRDD.md` only when the document title or path changes, and keep exactly one English wikilink.
- Do not synchronize to Lark, Jira, or another external system unless explicitly requested.

## Validation Checklist

Before reporting completion, verify:

- the exact English PRDD file was edited;
- all nine headings exist in the correct order;
- frontmatter remains valid and says `language: en`;
- Mermaid blocks have been validated with an available parser or renderer and syntax errors fixed; identify the tool used. If none is available, inspect syntax manually and report diagrams as manually reviewed, not parser-verified;
- API paths, table/collection names, enum values, JSON keys, and code identifiers match the updated source;
- all cross-section references are harmonized and removed objects have no stale references;
- version history matches the current version;
- the PRD index has no duplicate link;
- no Indonesian companion file or unrelated file was created or modified.
