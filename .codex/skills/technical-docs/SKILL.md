---
name: technical-docs
description: Create or edit English technical documentation in the configured Notion or Obsidian workspace using a fixed ten-section system-documentation structure.
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


# Technical Documentation

Create or edit one English technical documentation file for a software system, product, or platform. Use this skill when the user asks for system documentation, architecture documentation, technical design documentation, or an update to an existing document in this format.

## Storage and Naming

- Resolve the vault from `OBSIDIAN_VAULT_PATH`, `~/Documents/Obsidian Vault`, or `~/Obsidian`; ask for the path if none exists.
- Store files under `<VAULT>/01 Projects/Technical Documentation/`.
- Use the filename `Technical Documentation - <Name>.md`.
- Maintain `<VAULT>/01 Projects/Technical Documentation/Daftar Technical Documentation.md` with one English wikilink per document. Do not add duplicate links.
- Never create an Indonesian companion file.

## Create Workflow

1. Ask for the system or product name if it is missing.
2. Inspect any referenced source files, repositories, schemas, or existing documentation before asking questions.
3. Ask focused questions only about missing decisions that materially change scope, business rules, or contracts. Group related questions when useful; use available evidence to populate the sections.
4. Resolve the exact target path before writing. If the document already exists, use the edit workflow and preserve its content instead of replacing it.
5. Create a useful document from the available evidence. Set `status: Draft` while material decisions remain unresolved and mark unknowns as `TBD`. Do not mark the document approved without evidence of approval.
6. Add YAML frontmatter with `title`, `version`, `status`, `author`, `date`, `type`, `language: en`, and `source` when applicable.
7. Add a version-history table at the end and update the documentation index.

## Edit Workflow

- Locate the exact `Technical Documentation - <Name>.md` file before editing it.
- Read the complete document and preserve all required sections, existing technical identifiers, API paths, table names, code examples, and unrelated content.
- Update the requested facts and all directly affected sections, including architecture, ERD, data dictionary, API contracts, diagrams, and failure handling. Preserve unrelated content and the document structure; report which sections changed.
- Increment the frontmatter version (for example `1.0` to `1.1`) and append an English version-history entry for every material edit.
- If an active editor marker, lock, or conflicting unsaved version is present, stop and ask the user rather than overwriting it.
- Update the index only when the document is newly created or its title/path changes.

## Required Document Structure

Use these headings in this order. Preserve all ten headings when editing:

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

- the file is in the configured technical-documentation folder with the required filename;
- all ten required headings exist in order;
- frontmatter is valid and says `language: en`;
- Mermaid blocks have been checked with an available parser or renderer and syntax errors fixed; name the tool used, or report manual review and lack of parser verification when no tool is available;
- exact API paths, table/collection names, enum values, and code identifiers match the source material;
- every state-changing integration documents its failure, retry, idempotency, and transaction behavior when known;
- implementation, testing, operations, and data-governance appendices are present only when relevant;
- version history matches the current version;
- the index contains exactly one wikilink for the document;
- no unrelated files or companion-language documents were created or changed.
