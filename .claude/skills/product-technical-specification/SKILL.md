---
name: product-technical-specification
description: Create, edit, or combine PRDs and technical designs into one English Product & Technical Specification with requirements, UX, architecture, API contracts, ERD, and delivery guidance in the configured Notion or Obsidian workspace.
---

## Writing guidance

Follow [Clear, concise, detailed documents](../../../docs/document-writing.md). State the main point first, remove repetition, and retain the detail needed to decide, implement, test, or operate. Connect each product behavior to its technical contract and verification. Use stable cross-references instead of restating requirements across UX, architecture, APIs, and testing.

## Diagram guidance

Read [Diagrams in generated documents](../../../docs/document-diagrams.md) before drafting. Cover context, user journeys, architecture, data relationships, and critical integration sequences; add access, recovery, and rollout views where supported.

# Product & Technical Specification

Produce one implementation-ready specification for a product or feature. Connect the user problem and intended behavior to the technical design and its verification. Use this skill for a combined product/technical spec, including conversion from existing PRDDs and technical documentation. A product overview hub, standalone PRD, or standalone technical document belongs to its corresponding workflow unless the user requests this combined format.

## Destination and naming

- Read only the relevant `DOCUMENTS_PROVIDER`, `NOTION_ROOT_PAGE_URL`, and vault configuration; never print credentials. Unset or blank provider defaults to Notion. An explicit destination overrides configuration.
- For Notion, read the repository's `docs/notion-workflow.md`. Fetch the configured root page, or resolve the existing OpenPM hub when no root is configured. Store under its `Product & Technical Specifications` category, creating the category as needed within the requested document workflow. Search the hub and category before creating a specification.
- Use the page title `Product & Technical Specification - <Name>`. Store metadata in properties or a table. A child-page entry in the category is the index; verify it appears exactly once.
- Before writing Notion content, read `notion://docs/enhanced-markdown-spec` through the official Notion MCP. Use its supported links, native mentions, tables, and fenced code blocks. Fetch saved content to verify publication.
- For Obsidian, resolve `OBSIDIAN_VAULT_PATH` or the existing `~/Documents/Obsidian Vault` or `~/Obsidian`. Store `Product & Technical Specification - <Name>.md` under `<VAULT>/01 Projects/Product & Technical Specifications/`. Maintain `Daftar Product & Technical Specifications.md` with one English wikilink per spec.
- If the configured destination is inaccessible, preserve a local staging draft and report its path with `publication pending`. Do not silently switch providers or create a replacement hub.

## Create, edit, and conversion workflow

1. Resolve the product/feature name, requested scope, and exact destination from the request and existing context. Ask only if missing information materially changes the result.
2. Search for the existing combined specification. Read it completely before editing. Inspect the supplied PRD, technical documentation, source files, schemas, and integration contracts relevant to the scope before asking questions.
3. Build an evidence map: source, revision/commit/environment when available, inspection date, and which claims it supports. A PRD establishes intended behavior; code establishes behavior in the inspected checkout; a schema establishes definitions in the inspected environment. None proves production rollout by itself.
4. On conversion, synthesize the sources into the structure below. Preserve requirement IDs, technical identifiers, decisions, and substantive acceptance criteria. Merge duplicates and surface conflicts with their sources. Preserve the original source documents unless the user explicitly requests replacement or archiving. Do not create a second combined spec when one already exists.
5. Write a useful draft from available evidence. Use `TBD` for missing decisions and `Unverified` for unsupported implementation/release claims. Keep `status: Draft` while material decisions remain unresolved; record approval only with evidence.
6. For edits, change the requested facts and directly affected requirements, UX, contracts, data model, security, tests, rollout, and traceability. Preserve unrelated content. Re-read and reconcile if the document changed before saving; do not overwrite a conflicting active edit.
7. Add metadata: `title`, `version`, `status`, `author`, `date`, `type: Product & Technical Specification`, `language: en`, `product_owner`, `technical_owner`, and `source`. Owners may be `TBD`. Start a new spec at `1.0`; increment the document version for a material edit and append a version-history row. A document revision does not imply a software release.
8. Verify saved content and index membership, then return the canonical page URL or absolute file path and remaining material unknowns.

## Required structure

Keep these twelve primary headings in order. Scale detail to the product or feature; use a reasoned `Not applicable` where appropriate rather than inventing content.

### 1. Product Context & Ownership

Heading: `## 1. Product Context & Ownership`

Describe purpose, user problem, audience, stakeholders, product/technical ownership, scope of this specification, and source evidence. Identify whether the document describes an existing system, a proposed change, or both.

### 2. Goals, Success Metrics & Non-Goals

Heading: `## 2. Goals, Success Metrics & Non-Goals`

State desired outcomes and explicit exclusions. For metrics, capture formula, baseline, target, measurement window, owner, and analytics source when known. Distinguish illustrative dashboard values from measured results or approved targets.

### 3. Users, Journeys & UX

Heading: `## 3. Users, Journeys & UX`

Describe personas, permissions, entry points, user journeys, navigation, and observable behavior. Include relevant loading, empty, error, retry, success, offline, and accessibility states. Link supplied designs. Keep implementation details in the technical sections unless they affect a user's decision.

### 4. Requirements & Acceptance Criteria

Heading: `## 4. Requirements & Acceptance Criteria`

Preserve supplied requirement/story IDs. Assign stable IDs for newly authored requirements when needed for cross-references. Separate MoSCoW scope (`Must`, `Should`, `Could`, `Won't`) from release priority (`P0`, `P1`, `P2`). Use a table with ID, observable requirement, business rule, acceptance criteria, priority, dependencies, owner, and evidence/status. Include failure and permission cases where relevant.

### 5. System Architecture & Module Map

Heading: `## 5. System Architecture & Module Map`

Describe components, module responsibilities, dependencies, data flows, sync/async boundaries, external integrations, stack, deployment boundaries, and authoritative stores. Include a compact module/interface/owner table. Use a Mermaid flowchart or sequence diagram where it clarifies relationships; explain the diagram in prose.

### 6. Data Model & ERD

Heading: `## 6. Data Model & ERD`

Use exact table/collection and column identifiers. Include a Mermaid `erDiagram` plus a data dictionary with types, nullability, defaults, keys, constraints, indexes, and lifecycle where supported. Label entities `Existing`, `Change`, or `New`. Distinguish code/ORM relations from database-enforced constraints and inferred relations. Record inspected schema scope and omitted supporting entities. Document transaction boundaries, field mappings, calculated values, migration impact, retention, and deletion where known.

### 7. API, Events & Integration Contracts

Heading: `## 7. API, Events & Integration Contracts`

Document method/path or event, actor/authentication, request/query fields, response shape, validation, error/status behavior, timeout, retry, idempotency, reads/writes, side effects, and transaction boundaries. Preserve exact API names, enum values, JSON casing, and socket/event names. Distinguish declared DTO fields from filters actually applied by services. Enum membership alone does not prove an outbound message type is supported. Include representative source-backed examples and sequence diagrams when useful.

### 8. Security, Permissions & Data Governance

Heading: `## 8. Security, Permissions & Data Governance`

Map access policy to UI, API, service, socket, and data enforcement points. Explain project/tenant isolation, sensitive fields, validation boundaries, denied-access behavior, audit identifiers, logging restrictions, data ownership, retention, and deletion. Do not assume UI filters or ORM relations enforce authorization. Mark unavailable role/permission mappings as `Unverified`.

### 9. Reliability, Performance & Editing Safety

Heading: `## 9. Reliability, Performance & Editing Safety`

Capture known NFRs, capacity/latency targets, availability, observability, concurrent updates, edit ownership, locks/version checks, duplicate events, replay, reconciliation, and compensation. Do not imply a one-editor lock exists without evidence. Separate a client acknowledgement timeout from provider acknowledgement and an end-to-end SLA. State non-atomic boundaries across database, Redis, and external sends.

### 10. Testing & Requirement Traceability

Heading: `## 10. Testing & Requirement Traceability`

Map requirements to UX behavior, design/module, API/event, data entities, and validation evidence. Reference IDs and section anchors rather than repeating full contracts. Distinguish planned coverage from tests actually executed. Include applicable unit, contract, integration, end-to-end, permission, concurrency, replay, migration, and failure-path tests; identify rollout blockers.

### 11. Release, Rollout & Operations

Heading: `## 11. Release, Rollout & Operations`

Record confirmed release status, environments, configuration names without secrets, migration order, compatibility, rollout gates, rollback, incident/recovery actions, and support owners. Link real delivery records and runbooks. Keep source and actual verification dates for release snapshots separate from document dates. Do not invent cadence, flags, release versions, SLOs, RTO, or RPO.

### 12. Risks, Decisions & Open Questions

Heading: `## 12. Risks, Decisions & Open Questions`

Capture material risks, assumptions, conflicting evidence, mitigations, owner/next action, approved decisions, and unresolved questions. Link existing ADRs. State which gaps prevent implementation, approval, or production reliance.

End with `### Version History` containing document version, date, author, and change. Add supporting appendices only when substantial source material requires them; keep the twelve sections as primary navigation.

## Diagram and publication checks

- Retain diagram source and a prose explanation. Use actual newline characters and explicit triple-backtick `mermaid` fences; do not use single-backtick inline code or `<br>` between diagram statements. Quote Mermaid labels containing punctuation. Do not transform inline-code escaping across an entire page.
- Validate with an available Mermaid parser/renderer and name it. If unavailable, manually review syntax and report that parser/render verification was not performed.
- For Notion, inspect every saved diagram opening fence and language: `mermaid`, with the expected `flowchart`, `sequenceDiagram`, `erDiagram`, or `stateDiagram-v2` first line. A successful save or correct read-back does not establish visual rendering; claim rendering only after checking it.
- Use Notion Markdown links or native mentions in table cells, not raw HTML anchors. Keep child-page/database tags intact during edits; prefer targeted updates.
- Read back all required headings in order, metadata, version history, exact identifiers, tables, source links, diagrams, and any truncation/unknown-block indicators. Confirm the category/index references the spec once.
- Ensure every substantive requirement has acceptance criteria and traceability or an explicit unresolved item. Preserve conflicting source claims with evidence; do not silently resolve product-versus-code differences.
- Creating this document does not authorize code changes, migrations, ticket edits, source-document deletion, or messages to other people. Report publication pending when storage fails.
