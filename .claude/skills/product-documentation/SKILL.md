---
name: product-documentation
description: Create or maintain an English product documentation hub that connects product strategy, delivery, operations, and user documentation without duplicating PRDs or technical designs.
---

## Writing guidance

Follow [Clear, concise, detailed documents](../../../docs/document-writing.md). Open with `## TL;DR` before Section 1 summarizing product purpose, users, scope/status, and key links. Eliminate all residual wording, filler, meta-commentary, and repetition so every section is to the point, clear, and clean. Link canonical requirements, designs, runbooks, and delivery records instead of duplicating details.

## Diagram guidance

Read [Diagrams in generated documents](../../../docs/document-diagrams.md) before drafting. Include a product/capability overview, primary journey, and audience-to-document map when supported; link canonical technical diagrams rather than duplicating designs.

# Product Documentation

Create or edit one English product documentation hub for a product, platform, or major capability. Use this skill when the user asks for product documentation, a product hub, a product overview, a documentation map, or a living product record. Do not use it to replace a feature PRD/PRDD, a technical design document, an API reference, a runbook, or end-user instructions.

## Destination and Naming

- Read only the relevant `DOCUMENTS_PROVIDER`, `NOTION_ROOT_PAGE_URL`, and vault configuration; never print credentials. Unset or blank provider defaults to Notion. Set `DOCUMENTS_PROVIDER=obsidian` only when local Obsidian storage is explicitly requested; an explicit destination overrides configuration.
- **Notion (default):** Follow [Notion workflow](../../../docs/notion-workflow.md). Store under the OpenPM hub's `Projects` or `Product Documentation` category with title `Product Documentation - <Name>`. Put metadata in properties or a table, use Notion page links, search before creating, read before editing, and read back the saved page. If inaccessible or unauthenticated, preserve a local draft and report `publication pending`.
- **Obsidian:** Resolve the vault from `OBSIDIAN_VAULT_PATH`, `~/Documents/Obsidian Vault`, or `~/Obsidian` (ask if unavailable). Store `Product Documentation - <Name>.md` under `<VAULT>/01 Projects/Product Documentation/` with YAML frontmatter and one English wikilink in `<VAULT>/01 Projects/Product Documentation/Daftar Product Documentation.md`.
- Never create an Indonesian companion file.

## Product Documentation Boundary

The hub is the navigable product source of truth. It explains the product, the intended outcomes, its current scope, how delivery is traced, and where readers can find canonical detail.

- Product requirements belong in a PRD/PRDD. Link them; do not copy their full requirement tables into the hub.
- Implementation architecture, schemas, and API contracts belong in technical documentation. Link them; do not rewrite them here.
- Work status belongs in Jira or the team's delivery tracker. Link active epics/stories/tasks when available.
- Operational procedures belong in a runbook. Link the runbook when it exists.
- End-user documentation uses the audience-appropriate form: tutorial, how-to guide, reference, or explanation. Add links rather than combining those formats into a product hub.
- Architecture decision records remain separate. Summarize only the decision and link its authoritative ADR.

## Create Workflow

1. Ask for the product or capability name if it is missing.
2. Inspect referenced PRDs, technical documentation, repositories, research, tickets, runbooks, and user documentation before asking questions.
3. Ask only for facts that cannot be established from the available evidence. Do not force a section-by-section interview when a source already answers it.
4. If the exact target exists, use this skill's edit workflow instead of overwriting it.
5. Create a useful hub from the available evidence. Set `status: Draft` while material decisions remain unresolved, mark unknowns as `TBD`, and ask only about missing decisions that materially change scope, business rules, or contracts. Do not mark the document approved without evidence of approval.
6. Add metadata (`title`, `version`, `status`, `author`, `date`, `type`, `language: en`, `product_owner`, `last_reviewed`, `next_review`, and `source` when applicable) via YAML frontmatter (Obsidian) or a metadata table/properties (Notion). Set `author` to the active user's profile name (from the authenticated workspace/tool profile or git user, or `TBD` if unavailable)—never to the AI/CLI tool name.
7. Add a version-history table and verify index/category membership.

## Edit Workflow

- Locate and read the complete `Product Documentation - <Name>` page (Notion) or `.md` file (Obsidian) before editing.
- Preserve all required sections, exact identifiers, links, and unrelated content.
- Update only requested facts plus directly affected `TL;DR`, traceability, status, or change-history entries.
- Increment the version metadata and append one version-history entry for every material edit.
- If an active editor marker, lock, or conflicting unsaved version is present, stop and ask the user rather than overwriting it.
- Update the index only for a new document or title/path change.

## Required Document Structure

Start with an opening `## TL;DR` section (concise summary of product purpose, target users, current scope/status, and key links), then use these ten headings in order and preserve all ten when editing:

1. `## 1. Product Summary & Ownership`
2. `## 2. Users, Problems & Evidence`
3. `## 3. Vision, Outcomes & Success Metrics`
4. `## 4. Scope, Capabilities & Non-Goals`
5. `## 5. User Journeys & Product Experience`
6. `## 6. Delivery Traceability & Roadmap`
7. `## 7. Release, Rollout & Change History`
8. `## 8. Operations, Support & Product Governance`
9. `## 9. Risks, Decisions & Open Questions`
10. `## 10. Documentation Map & User Enablement`

### Section Expectations

- **Product Summary & Ownership:** product purpose, status, product owner, stakeholders, audience, lifecycle status, and review cadence.
- **Users, Problems & Evidence:** user segments, user needs, evidence source, confidence, and assumptions to validate. Distinguish evidence from opinions.
- **Vision, Outcomes & Success Metrics:** outcome statements and metrics with formula, baseline, target, measurement window, owner, and analytics source. Mark unknowns as `TBD`.
- **Scope, Capabilities & Non-Goals:** current capabilities, scope boundary, explicitly excluded work, and the canonical PRD/PRDD link for detailed requirements.
- **User Journeys & Product Experience:** the important journeys, entry points, happy path, permissions, and high-value empty/loading/error/retry states. Link design or user documentation instead of embedding unnecessary screen-by-screen detail.
- **Delivery Traceability & Roadmap:** a compact mapping from user need to capability, PRD/PRDD, technical document, delivery tracker, and release when known. Use stable requirement or capability IDs when sources provide them; do not invent IDs solely for the hub.
- **Release, Rollout & Change History:** release status, compatibility, migration/rollback links, launch checks, and confirmed product changes. Keep document revisions in a separate version-history table; editing the hub does not imply a product release.
- **Operations, Support & Product Governance:** support boundary, operational owner, known service-level commitments, incident/runbook links, data/privacy ownership, and document review ownership. Do not invent SLOs or retention periods.
- **Risks, Decisions & Open Questions:** material risk, mitigation, owner, decision status, ADR links, assumptions, and unresolved questions with an owner or next action when known.
- **Documentation Map & User Enablement:** audience-based links to PRDs, technical docs, API references, runbooks, Jira, design, tutorials, how-to guides, reference material, and explanations. Keep each item canonical.

## Documentation Quality Rules

- Lead with the product outcome and user problem, not a solution or implementation detail.
- Write requirements and capabilities as observable behavior. Keep technical implementation in the linked technical document or ADR.
- Use concise, scannable headings, tables, and short paragraphs. Put the decisive information first.
- Use meaningful link text and preserve a logical heading hierarchy.
- Use active, direct, inclusive language. Define unfamiliar abbreviations on first use.
- Do not rely on color, position, or diagrams as the only way to convey a fact. Give diagrams concise textual context and alt text for images when supported.
- Distinguish `Existing`, `Proposed`, and `Unverified` capabilities using canonical source references. A PRDD establishes intended behavior; it does not prove that a feature is implemented or released. Flag conflicting sources.
- Use a diagram only when it makes a journey, dependency, or ownership relationship materially clearer. Validate Mermaid with an available parser or renderer, fix syntax errors, and name the tool used. If none is available, report manual review and lack of parser verification.
- Treat the hub as a living document: set `last_reviewed` when it is checked and set `next_review` to a known cadence or `TBD`.
- For copied delivery or release statuses, include the source and an explicit `Verified at` date/time when actually checked. Document revision and `last_reviewed` dates do not refresh these snapshots. If not checked, retain the original verification date or label the status `Unverified`; prefer canonical links when a snapshot is unnecessary.
- Do not synchronize to Lark, Jira, or another external system unless the user explicitly requests it.

## Recommended Traceability Table

Use a compact table when delivery artifacts exist:

| User Need / Capability | Canonical Requirement | Technical Design | Delivery | Release / Status |
| --- | --- | --- | --- | --- |
| Human-readable user need or capability | PRD/PRDD link and requirement ID when available | Technical doc or ADR link | Epic, story, or task link | Version, date, or `TBD` |

Do not create placeholder links or duplicate a Jira backlog in this document.

## Completion Checklist

Before reporting completion, verify:

- the hub is saved in the configured destination with the required title/filename (and read back if in Notion);
- an opening `## TL;DR` section and all ten required headings exist in order;
- metadata/frontmatter is valid and says `language: en`;
- all residual wording, filler, and repetition are removed;
- the ownership, status, review dates, sources, and version history agree;
- product facts, metrics, links, and decisions are evidence-backed or marked `TBD`;
- the hub links to canonical PRD/PRDD, technical, delivery, operations, and user-facing material instead of duplicating it;
- delivery/release snapshots retain their source and actual verification time, separate from document revision dates;
- tables and diagrams are readable and accessible; report parser validation or manual-review limitations for Mermaid when used;
- the category/index contains exactly one entry for the document;
- no unrelated files or companion-language files changed, and any Lark, Jira, or other external changes were explicitly authorized.
