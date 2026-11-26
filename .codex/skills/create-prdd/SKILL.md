---
name: create-prdd
description: Create an English nine-section Product Requirements & Design Document in the configured Notion or Obsidian workspace from source evidence and focused questions.
---

## Writing guidance

Follow [Clear, concise, detailed documents](../../../docs/document-writing.md). Open every PRDD (before Section 1) with a concise `## TL;DR` section summarizing the problem, intended outcome, scope boundary, and status/blockers. Eliminate all residual wording, filler, meta-commentary, and repetition so every sentence is to the point, clear, and clean while retaining all detail needed to decide, implement, test, or operate. Put exact API/schema detail in its canonical section and cross-reference it.

## Diagram guidance

Read [Diagrams in generated documents](../../../docs/document-diagrams.md) before drafting. Include context and user-journey diagrams alongside architecture, ERD, and critical integration sequences; add rule, state, and recovery views where supported.

## Destination and Naming

- Read only the relevant `DOCUMENTS_PROVIDER`, `NOTION_ROOT_PAGE_URL`, and vault configuration; never print credentials. Unset or blank provider defaults to Notion. Set `DOCUMENTS_PROVIDER=obsidian` only when local Obsidian storage is explicitly requested; an explicit destination in the user request overrides configuration.
- **Notion (default):** Follow [Notion workflow](../../../docs/notion-workflow.md). Fetch `NOTION_ROOT_PAGE_URL` (or resolve the OpenPM hub), store under `PRDDs` with title `PRDD - <Name> (EN)`, put metadata in properties or a table, use Notion page links, search before creating, and read back the saved page. If unavailable or inaccessible, preserve a local draft and report `publication pending`; never switch providers silently.
- **Obsidian:** Resolve the vault from `OBSIDIAN_VAULT_PATH`, `~/Documents/Obsidian Vault`, or `~/Obsidian` (ask if unavailable). Store `PRDD - <Name> (EN).md` under `<VAULT>/01 Projects/PRDs/<sanitized-project-name>/` with YAML frontmatter and one English wikilink in `<VAULT>/01 Projects/PRDs/Daftar PRDD.md`. Never create an Indonesian companion document.

# Create PRDD

Create one English PRDD for a product or feature. Use `product-technical-specification` when combining a PRD and full technical design into a 12-section spec, or `product-documentation` for a living product hub. If the product name is absent, ask for it first. Ask only questions that cannot be answered from the request, referenced files, screenshots, repositories, schemas, APIs, or existing docs.

Open with `## TL;DR` immediately before the nine numbered sections in this order:

1. Overview & Problem Statement
2. Goals & Success Metrics plus Non-Goals
3. User Stories / Use Cases
4. Functional Requirements with separate MoSCoW and release-priority fields
5. System Architecture with `flowchart TD` and a technology-stack table
6. Database Schema / ERD with `erDiagram` and a data dictionary
7. API Contract with endpoint tables, JSON examples, and `sequenceDiagram`
8. Non-Functional Requirements covering performance, security/privacy, reliability, accessibility, and observability
9. Dependencies & Risks with dependencies, risks, assumptions, rollout considerations, and open questions

Write all content, headings, tables, and metadata in English, with valid Mermaid diagrams, MoSCoW tables, and version history.

## Creation Workflow

1. Resolve the configured destination (Notion page or Obsidian vault) and inspect the referenced source material before interviewing.
2. If the exact target PRDD already exists, do not overwrite it; use `edit-prdd` instead.
3. Create a useful document from the available evidence. Set `status: Draft` while material decisions remain unresolved, mark unknowns as `TBD`, and ask only about missing decisions that materially change scope, business rules, or contracts. Do not mark the document approved without evidence of approval.
4. Add metadata (`title`, `version`, `status`, `author`, `date`, `type`, `language: en`, and `source` when applicable) via YAML frontmatter (Obsidian) or a metadata table/properties (Notion). Set `author` to the active user's profile name (from the authenticated workspace/tool profile or git user, or `TBD` if unavailable)—never to the AI/CLI tool name.
5. Add a version-history table with the initial version and creation date.
6. Verify index membership: in Notion, confirm one entry under `PRDDs` and read back the saved page; in Obsidian, add one English wikilink to `Daftar PRDD.md` without creating an Indonesian companion document.

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
- Before reporting completion, verify `## TL;DR` and the nine numbered headings are present and ordered, metadata/frontmatter is valid, the version history matches the current version, the index/category has one entry (read-back verified in Notion), all residual/filler wording is removed, and no unrelated files changed.
