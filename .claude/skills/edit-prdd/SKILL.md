---
name: edit-prdd
description: Edit an English-only nine-section PRDD file in the configured Notion or Obsidian workspace.
---

## Writing guidance

Follow [Clear, concise, detailed documents](../../../docs/document-writing.md). Ensure an opening `## TL;DR` section appears before Section 1 (add it if missing; update it when scope or key decisions change). Keep edits focused and strictly eliminate residual wording, stale leftovers, filler, meta-commentary, and repetition so the document stays to the point, clear, and clean without losing requirements, decisions, contracts, evidence, or exceptions.

## Diagram guidance

Read [Diagrams in generated documents](../../../docs/document-diagrams.md) before drafting. Update diagrams for the requested change and reconcile affected views; preserve unrelated content and supplied Mermaid outside that scope.

## Destination and Locating the PRDD

- Read only the relevant `DOCUMENTS_PROVIDER`, `NOTION_ROOT_PAGE_URL`, and vault configuration; never print credentials. Unset or blank provider defaults to Notion. Set `DOCUMENTS_PROVIDER=obsidian` only when local Obsidian storage is explicitly requested; an explicit destination overrides configuration.
- **Notion (default):** Follow [Notion workflow](../../../docs/notion-workflow.md). Search within `NOTION_ROOT_PAGE_URL` (or the OpenPM hub) for `PRDD - <Name> (EN)`. Read the complete existing page before editing, preserve unrelated content, and read back the saved page. If missing or inaccessible, report the gap instead of creating a replacement or switching providers.
- **Obsidian:** Resolve the vault from `OBSIDIAN_VAULT_PATH`, `~/Documents/Obsidian Vault`, or `~/Obsidian` (ask if unavailable) and locate `<VAULT>/01 Projects/PRDs/<sanitized-project-name>/PRDD - <Name> (EN).md`. If the exact English file is missing, stop and report it rather than creating a replacement. Never create or modify an Indonesian companion file.

# Edit PRDD

Read the user request and any attached material, interview one section at a time only when clarification is needed, and update the English PRDD. Ensure `## TL;DR` precedes the nine sections: overview/problem, goals/metrics/non-goals, user stories/use cases, MoSCoW functional requirements, architecture/tech stack, ERD/data dictionary, API contract/examples/sequence diagram, non-functional requirements, and dependencies/risks/assumptions/open questions.

Keep Mermaid syntax valid, bump the document version (for example `1.0` to `1.1`), and append an English version-history entry.

## Edit Workflow

1. Locate the exact file and read the complete PRDD before editing.
2. Inspect referenced screenshots, repositories, schemas, APIs, tickets, and existing documentation that can establish the requested fact.
3. Ask only for information that remains materially ambiguous.
4. Change only the requested scope. Preserve unrelated prose, technical identifiers, API paths, table/collection names, enum values, JSON examples, and existing decisions.
5. If a schema, API, business rule, or object is added, removed, or renamed, harmonize every reference in requirements, architecture, ERD, data dictionary, API contracts, sequence diagrams, NFRs, dependencies, risks, assumptions, and open questions.
6. If an object is removed, delete all stale references, residual wording, leftover discussion text, filler, or obsolete endpoints so the document stays clean and to the point.
7. If the requested change introduces an unsupported implementation detail, mark it `TBD` or add it to open questions instead of inventing a decision.

## Consistency Rules

- Ensure an opening `## TL;DR` section precedes the nine headings and preserve their order:
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

- Increment the version metadata for every material edit and append an English version-history row describing the change.
- Preserve the existing author and source metadata unless the user explicitly changes them; update the document date for the edit. When recording an author for an edit or version-history entry, use the active user's profile name (from the authenticated workspace/tool profile or git user, or `TBD` if unavailable)—never the AI/CLI tool name.
- If an active editor marker, lock, or conflicting unsaved version is present, stop and ask the user rather than overwriting.
- In Obsidian, update `Daftar PRDD.md` only when the title or path changes, keeping one English wikilink; in Notion, verify the saved page reads back cleanly under `PRDDs`.
- Do not synchronize to Lark, Jira, or another external system unless explicitly requested.

## Validation Checklist

Before reporting completion, verify:

- the exact English PRDD page or file was edited (and read back if in Notion);
- an opening `## TL;DR` section and all nine numbered headings exist in order;
- metadata/frontmatter remains valid and says `language: en`;
- Mermaid blocks have been validated with an available parser or renderer and syntax errors fixed; identify the tool used. If none is available, inspect syntax manually and report diagrams as manually reviewed, not parser-verified;
- API paths, table/collection names, enum values, JSON keys, and code identifiers match the updated source;
- all cross-section references are harmonized, and removed objects and residual/filler wording are gone;
- version history matches the current version;
- the index/category has no duplicate entry;
- no Indonesian companion file or unrelated file was created or modified.
