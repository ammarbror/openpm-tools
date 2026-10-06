---
description: Create an English nine-section Product Requirements & Design Document in the configured Notion or Obsidian workspace from source evidence and focused questions.
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


# Create PRDD

Create one English file: `PRDD - <Name> (EN).md` under `<VAULT>/01 Projects/PRDs/<sanitized-project-name>/`. If the product name is absent, ask for it first. Ask only the questions that cannot be answered from the user's request, referenced files, screenshots, repositories, schemas, APIs, or existing documentation; do not force a one-question-per-section interview when evidence is already available.

Use these nine sections in this order:

1. Overview & Problem Statement
2. Goals & Success Metrics plus Non-Goals
3. User Stories / Use Cases
4. Functional Requirements with separate MoSCoW and release-priority fields
5. System Architecture with `flowchart TD` and a technology-stack table
6. Database Schema / ERD with `erDiagram` and a data dictionary
7. API Contract with endpoint tables, JSON examples, and `sequenceDiagram`
8. Non-Functional Requirements covering performance, security/privacy, reliability, accessibility, and observability
9. Dependencies & Risks with dependencies, risks, assumptions, rollout considerations, and open questions

Resolve the vault from `OBSIDIAN_VAULT_PATH`, `~/Documents/Obsidian Vault`, or `~/Obsidian`; if unavailable, ask the user for the path. Write all content, headings, tables, and metadata in English. Include YAML frontmatter, valid Mermaid diagrams, MoSCoW tables, and version history. Do not add a companion-file wikilink. Update `<VAULT>/01 Projects/PRDs/Daftar PRDD.md` with one English-file wikilink.

## Creation Workflow

1. Resolve the vault and inspect the referenced source material before interviewing.
2. If the exact target PRDD already exists, do not overwrite it; use `edit-prdd` instead.
3. Create a useful document from the available evidence. Set `status: Draft` while material decisions remain unresolved, mark unknowns as `TBD`, and ask only about missing decisions that materially change scope, business rules, or contracts. Do not mark the document approved without evidence of approval.
4. Use YAML frontmatter with `title`, `version`, `status`, `author`, `date`, `type`, `language: en`, and `source` when applicable.
5. Add a version-history table with the initial version and creation date.
6. Add exactly one English wikilink to `Daftar PRDD.md`; never create an Indonesian companion document.

## Section Quality Rules

- Overview must state the problem evidence, target users, stakeholders, scope, constraints, assumptions, and non-goals.
- Success metrics must define the formula, baseline, target, measurement window, owner, and required analytics events when known. Mark unknown values as `TBD`.
- Each user story must identify the persona, desired outcome, relevant permission, and acceptance criteria. Include important empty, loading, error, retry, and duplicate states.
- Functional requirements must use a table with separate fields for:
  - MoSCoW: `Must`, `Should`, `Could`, or `Won't`;
  - release priority: `P0`, `P1`, or `P2`;
  - requirement, business rule, acceptance criteria, dependencies, and owner when known.
- Architecture must document deployment boundaries, external integrations, trust boundaries, synchronous/asynchronous flows, and the authoritative source for calculated values.
- The ERD and data dictionary must preserve exact table/collection names, columns, enums, JSON shapes, keys, constraints, indexes, existing/change/new status, and migration impact. Never rename a real identifier for readability.
- API contracts must document method/path, actor, authentication, request, response, validation, status/error codes, idempotency, timeout, retry, side effects, reads/writes, and transaction boundaries. Preserve existing field names and casing. For new contracts, prefer public camelCase fields and database snake_case fields when consistent with project conventions; document their mapping.
- Distinguish `Existing`, `Proposed`, and `Unverified` behavior, with source references. Requirements describe intended behavior; code and schemas establish implemented behavior within the inspected version/environment. Flag conflicting sources rather than silently choosing one.
- Non-functional requirements should cover performance, security/privacy, reliability, availability, accessibility, observability, retention, and testability when relevant.
- Dependencies and risks must include mitigation, rollout/rollback impact, operational owner, assumptions, and unresolved decisions.

## Optional Appendices

Add only when supported by the source or useful for delivery:

- API and integration contract details
- Testing strategy and traceability matrix
- Analytics event catalog
- Rollout, migration, and rollback plan
- Glossary and architecture decision log

Do not create empty appendices.

## Safety and Validation

- Preserve exact API paths, database identifiers, enum values, environment-variable names, and code symbols.
- Use fenced Mermaid with safe quoted labels. Validate diagrams with an available Mermaid parser or renderer, fix reported syntax errors, and identify the tool used. If none is available, inspect syntax manually and report diagrams as manually reviewed, not parser-verified.
- Cross-check changes across requirements, architecture, ERD, data dictionary, API contracts, sequence diagrams, NFRs, and risks.
- Do not invent unsupported implementation details; label them `TBD` or add them to open questions.
- Do not synchronize to Lark, Jira, or another external system unless explicitly requested.
- Before reporting completion, verify the nine headings are present and ordered, frontmatter is valid, the version history matches the current version, the PRD index has one link, and no unrelated files changed.
