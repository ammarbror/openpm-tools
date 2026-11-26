---
name: technical-docs
description: Create or edit English technical documentation in the configured Notion or Obsidian workspace using a fixed ten-section system-documentation structure.
---

## Writing guidance

Follow [Clear, concise, detailed documents](../../../docs/document-writing.md). Open with `## TL;DR` before Section 1 summarizing system purpose, architecture, boundaries, and status. Eliminate all residual wording, filler, meta-commentary, and repetition so prose is to the point, clear, and clean while keeping exact technical detail in its canonical section or appendix.

## Diagram guidance

Read [Diagrams in generated documents](../../../docs/document-diagrams.md) before drafting. Cover architecture, module dependencies, ERD, and relevant access, navigation, integration, and recovery flows using focused diagrams.

# Technical Documentation

Create or edit one English technical documentation record for a software system, product, or platform. Use this skill for standalone system, architecture, or technical design documentation; use `create-prdd` for a product requirements + design doc, or `product-technical-specification` when combining product and technical specs into one 12-section document.

## Destination and Naming

- Read only the relevant `DOCUMENTS_PROVIDER`, `NOTION_ROOT_PAGE_URL`, and vault configuration; never print credentials. Unset or blank provider defaults to Notion. Set `DOCUMENTS_PROVIDER=obsidian` only when local Obsidian storage is explicitly requested; an explicit destination overrides configuration.
- **Notion (default):** Follow [Notion workflow](../../../docs/notion-workflow.md). Store under the OpenPM hub's `Technical Documentation` category with title `Technical Documentation - <Name>`. Put metadata in properties or a table, use Notion page links, search before creating, read before editing, and read back the saved page. If inaccessible or unauthenticated, preserve a local draft and report `publication pending`.
- **Obsidian:** Resolve the vault from `OBSIDIAN_VAULT_PATH`, `~/Documents/Obsidian Vault`, or `~/Obsidian` (ask if unavailable). Store `Technical Documentation - <Name>.md` under `<VAULT>/01 Projects/Technical Documentation/` with YAML frontmatter and one English wikilink in `<VAULT>/01 Projects/Technical Documentation/Daftar Technical Documentation.md`.
- Never create an Indonesian companion file.

## Create Workflow

1. Ask for the system or product name if it is missing.
2. Inspect any referenced source files, repositories, schemas, or existing documentation before asking questions.
3. Ask focused questions only about missing decisions that materially change scope, business rules, or contracts. Group related questions when useful; use available evidence to populate the sections.
4. Resolve the exact target in the configured destination before writing. If the document already exists, use the edit workflow and preserve its content instead of replacing it.
5. Create a useful document from the available evidence. Set `status: Draft` while material decisions remain unresolved and mark unknowns as `TBD`. Do not mark the document approved without evidence of approval.
6. Add metadata (`title`, `version`, `status`, `author`, `date`, `type`, `language: en`, and `source` when applicable) via YAML frontmatter (Obsidian) or a metadata table/properties (Notion). Set `author` to the active user's profile name (from the authenticated workspace/tool profile or git user, or `TBD` if unavailable)—never to the AI/CLI tool name.
7. Add a version-history table at the end and verify index/category membership.

## Edit Workflow

- Locate and read the complete `Technical Documentation - <Name>` page (Notion) or `.md` file (Obsidian) before editing.
- Preserve all required sections, existing technical identifiers, API paths, table names, code examples, and unrelated content.
- Update the requested facts and all directly affected sections, including `TL;DR`, architecture, ERD, data dictionary, API contracts, diagrams, and failure handling. Report which sections changed.
- Increment the version metadata (for example `1.0` to `1.1`) and append an English version-history entry for every material edit.
- If an active editor marker, lock, or conflicting unsaved version is present, stop and ask the user rather than overwriting it.
- Update the index only when the document is newly created or its title/path changes.

## Required Document Structure

Start with an opening `## TL;DR` section (concise summary of system purpose, core architecture, boundaries, and status), then use these ten headings in order and preserve all ten when editing:

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

Section expectations:

- Purpose and principles: scope, users, boundaries, non-goals, assumptions, and governing design principles.
- Architecture: components, dependencies, data flows, sync/async boundaries, external integrations, trust boundaries, and deployment topology. Use Mermaid when relationships or flows are easier to understand visually.
- Security: authentication, authorization policy, roles, trust boundaries, data classification, sensitive fields, audit logging, retention, and access rules. Keep implementation enforcement details in Section 8.
- Editing safety: concurrent editing of application records, ownership of an edit session, locking or version checks, conflict handling, and recovery. Do not imply the application has a one-editor lock unless confirmed. If concurrent editing is irrelevant, state why this section is not applicable. Keep document ownership and review metadata separate from application behavior.
- Module map: modules, responsibilities, owning team, dependencies, public interfaces, and emitted or consumed events when applicable.
- Release cadence and patch log: environments, configuration and secret ownership, migration order, compatibility, release process, versioning, rollback, support handoff, and confirmed software releases/patches. Keep document revision history in the version-history table at the end; a documentation edit does not imply a software release.
- Core data model: Mermaid `erDiagram`, exact table and collection names, relationships, keys, constraints, indexes, transaction boundaries, lifecycle/retention, existing/change/new status, and a data dictionary.
- Roles and enforcement: map the Section 3 access policy to concrete API, service, database, and UI enforcement points, including denied-access behavior and checks. Reference the policy rather than duplicating it.
- Application stack: languages, frameworks, runtime, storage, infrastructure, deployment, observability, important versions, and configuration names without secret values.
- User interface: shell layout, navigation, routes, route-to-API mapping, permissions, loading/empty/error/success states, and responsive/accessibility behavior.

### Optional implementation appendices

Add only the appendices supported by the source material or required by the system:

- **API and Integration Contracts:** endpoint/method, actor, authentication, request, response, validation, status/error codes, idempotency, retry behavior, timeout, side effects, reads/writes, and transaction boundary.
- **Testing Strategy:** unit, integration, contract, end-to-end, webhook replay, concurrency, migration, and failure-path coverage.
- **Operations and Incident Runbook:** SLO/SLA, dashboards, alerts, retry/reconciliation, RTO/RPO, incident actions, and escalation owner.
- **Data Governance:** data owner, classification, retention, masking, deletion, audit, and compliance constraints.
- **Glossary and Decision Log:** domain terms, unresolved decisions, ADR references, risks, and open questions.

Do not add empty appendices. Keep the ten required sections as the primary navigation and place appendices after Section 10 when they materially improve implementation or operations.

## Technical Writing Rules

- Keep prose, headings, tables, and metadata in English.
- Preserve exact names for APIs, database tables/columns, enum values, environment variables, collections, events, and code symbols.
- In ERD diagrams and data dictionaries, use the real singular/plural table or collection identifier exactly as provided. Do not rename `ewallet` to `ewallets`, abbreviate a table name, or use a display label as a schema identifier.
- Preserve existing API and database field names and casing. For new contracts, prefer public camelCase fields and database snake_case fields when consistent with project conventions. Document field mappings and the authoritative source for calculated values.
- Distinguish `Existing`, `Proposed`, and `Unverified` behavior, with source references. A PRDD establishes intended behavior, not proof of implementation. Verify implemented behavior against code/schema in the inspected version/environment and flag conflicting sources.
- Use fenced Mermaid blocks with valid `flowchart`, `sequenceDiagram`, or `erDiagram` syntax. Quote labels that contain punctuation likely to break Mermaid parsing.
- Use tables for role matrices, stack inventories, patch logs, and data dictionaries; use diagrams only where they clarify flow or relationships.
- Do not invent implementation details. Label unsupported decisions as `TBD` or place them in an open-questions section.
- Keep external links and source references near the facts they support.
- Do not synchronize to Lark, Jira, or another external system unless the user explicitly requests that operation.

### Reliability and security invariants

Document these when the system has state-changing or money/security-sensitive flows:

- authentication and authorization boundary;
- validation and server-side source of truth;
- idempotency key and duplicate-event behavior;
- retry, timeout, reconciliation, and compensating-action behavior;
- transaction/locking boundary and consistency requirements;
- audit identifiers and sensitive-data logging restrictions;
- migration compatibility and rollback behavior.

## Completion Checklist

Before reporting completion, verify:

- the document is saved in the configured destination with the required title/filename (and read back if in Notion);
- an opening `## TL;DR` section and all ten required headings exist in order;
- metadata/frontmatter is valid and says `language: en`;
- all residual wording, filler, and repetition are removed;
- Mermaid blocks have been checked with an available parser or renderer and syntax errors fixed; name the tool used, or report manual review and lack of parser verification when no tool is available;
- exact API paths, table/collection names, enum values, and code identifiers match the source material;
- every state-changing integration documents its failure, retry, idempotency, and transaction behavior when known;
- implementation, testing, operations, and data-governance appendices are present only when relevant;
- version history matches the current version;
- the category/index contains exactly one entry for the document;
- no unrelated files or companion-language documents were created or changed.
