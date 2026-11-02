---
description: Create, edit, or combine PRDs and technical designs into one English Product & Technical Specification with twelve required sections. Usage: /product-technical-specification <product-or-feature-name>
agent: build
---

## Writing guidance

Follow [Clear, concise, detailed documents](../../docs/document-writing.md). State the main point first, remove repetition, and retain the detail needed to decide, implement, test, or operate. Connect each product behavior to its technical contract and verification. Use stable cross-references instead of restating requirements across UX, architecture, APIs, and testing.

## Diagram guidance

Read [Diagrams in generated documents](../../docs/document-diagrams.md) before drafting. Cover context, user journeys, architecture, data relationships, and critical integration sequences; add access, recovery, and rollout views where supported.

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

# Product & Technical Specification

Produce one implementation-ready English specification for a product or feature, connecting the user problem and intended behavior to the technical design and its verification. Use this command for a combined product/technical spec, including conversion from existing PRDDs and technical documentation. A product overview hub, standalone PRD, or standalone technical document belongs to its own workflow. Read `.codex/skills/product-technical-specification/SKILL.md` for the complete section contracts, publication checks, and completion checklist.

There is no CLI or MCP writer for this workflow: run it with the available file, MCP, and terminal tools, then verify what was actually saved.

## Destination and naming

- Notion: fetch the configured root page, or resolve the existing OpenPM hub when no root is configured. Store under its `Product & Technical Specifications` category, creating the category as needed, and use the title `Product & Technical Specification - <Name>`. Before writing content, read `notion://docs/enhanced-markdown-spec` through the official Notion MCP; use supported links, native mentions, tables, and fenced code blocks.
- Obsidian: resolve `OBSIDIAN_VAULT_PATH`, `~/Documents/Obsidian Vault`, or `~/Obsidian`. Store `Product & Technical Specification - <Name>.md` under `<VAULT>/01 Projects/Product & Technical Specifications/` and keep `Daftar Product & Technical Specifications.md` with one English wikilink per spec.
- If the destination is inaccessible, preserve a local staging draft and report `publication pending`; do not switch providers or create a replacement hub.
- Never create an Indonesian companion file.

## Create, edit, and conversion workflow

1. Resolve the product/feature name, requested scope, and exact destination; ask only when missing information materially changes the result.
2. Search for an existing combined specification and read it completely before editing. Inspect the supplied PRD, technical documentation, source files, schemas, and integration contracts before asking questions.
3. Build an evidence map: source, revision/commit/environment when available, inspection date, and the claims each source supports. A PRD establishes intended behavior, code establishes behavior in the inspected checkout, and a schema establishes definitions in the inspected environment; none alone proves production rollout.
4. On conversion, synthesize sources into the structure below. Preserve requirement IDs, technical identifiers, decisions, and substantive acceptance criteria; merge duplicates and surface conflicts. Keep the original sources unless replacement or archiving is explicitly requested, and never create a second combined spec when one exists.
5. Use `TBD` for missing decisions and `Unverified` for unsupported implementation or release claims. Keep `status: Draft` while material decisions remain unresolved.
6. For edits, change the requested facts and directly affected requirements, UX, contracts, data model, security, tests, rollout, and traceability; preserve unrelated content. Reconcile instead of overwriting a conflicting active edit.
7. Add metadata: `title`, `version`, `status`, `author`, `date`, `type: Product & Technical Specification`, `language: en`, `product_owner`, `technical_owner`, and `source`. Start at `1.0`, increment for material edits, and append a version-history row; a document revision is not a software release.
8. Verify saved content and index membership, then return the canonical page URL or absolute file path with remaining material unknowns.

## Required structure

Keep these twelve headings in order. Scale detail to the product or feature and write a reasoned `Not applicable` instead of inventing content.

1. `## 1. Product Context & Ownership`
2. `## 2. Goals, Success Metrics & Non-Goals`
3. `## 3. Users, Journeys & UX`
4. `## 4. Requirements & Acceptance Criteria`
5. `## 5. System Architecture & Module Map`
6. `## 6. Data Model & ERD`
7. `## 7. API, Events & Integration Contracts`
8. `## 8. Security, Permissions & Data Governance`
9. `## 9. Reliability, Performance & Editing Safety`
10. `## 10. Testing & Requirement Traceability`
11. `## 11. Release, Rollout & Operations`
12. `## 12. Risks, Decisions & Open Questions`

End with `### Version History` containing document version, date, author, and change. Keep twelve sections as primary navigation and add appendices only when substantial source material requires them.

## Section contracts

- Requirements: preserve supplied IDs, assign stable IDs for new ones, separate MoSCoW (`Must`, `Should`, `Could`, `Won't`) from release priority (`P0`, `P1`, `P2`), and include acceptance criteria, business rules, dependencies, owner, and evidence/status.
- Data model: use exact table/collection and column identifiers with a Mermaid `erDiagram` and data dictionary; label entities `Existing`, `Change`, or `New`; distinguish database-enforced constraints from ORM relations and inferred relations.
- API and events: document actor/authentication, request and response fields, validation, errors, timeout, retry, idempotency, side effects, and transaction boundaries; preserve exact names, enum values, and casing. Declared DTO fields do not prove a filter is applied.
- Security: map policy to UI, API, service, socket, and data enforcement points; do not assume UI filters or ORM relations enforce authorization.
- Reliability and editing safety: separate client and provider acknowledgement from end-to-end SLAs, state non-atomic boundaries across database, cache, and external sends, and do not imply a one-editor lock without evidence.
- Traceability: map requirements to UX, design, API/event, data, and validation evidence by ID or anchor; distinguish planned coverage from executed tests.

## Diagram and publication checks

- Retain diagram source and a prose explanation; use real newlines and fenced `mermaid` blocks, never inline-code or `<br>` between statements, and quote labels containing punctuation.
- Validate with an available Mermaid parser or renderer and name the tool; otherwise report manual review only.
- For Notion, inspect saved diagram fences and their first line (`flowchart`, `sequenceDiagram`, `erDiagram`, `stateDiagram-v2`). A successful save or read-back does not prove visual rendering.
- Read back required headings in order, metadata, version history, exact identifiers, tables, source links, diagrams, and any truncation indicators; confirm the category/index references the spec once.
- Do not change code, run migrations, edit tickets, delete source documents, or message other people without explicit authorization.
- Before reporting completion, verify every substantive requirement has acceptance criteria and traceability or an explicit unresolved item, and that preserved conflicts still cite their evidence.

User request: $ARGUMENTS
