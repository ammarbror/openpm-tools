---
name: product-documentation
description: Create or maintain an English product documentation hub that connects product strategy, delivery, operations, and user documentation without duplicating PRDs or technical designs.
---

# Product Documentation

Create or edit one English product documentation hub for a product, platform, or major capability. Use this skill when the user asks for product documentation, a product hub, a product overview, a documentation map, or a living product record. Do not use it to replace a feature PRD/PRDD, a technical design document, an API reference, a runbook, or end-user instructions.

## Storage and Naming

- Resolve the vault from `OBSIDIAN_VAULT_PATH`, `~/Documents/Obsidian Vault`, or `~/Obsidian`; ask for the path if none exists.
- Store files under `<VAULT>/01 Projects/Product Documentation/`.
- Use the filename `Product Documentation - <Name>.md`.
- Maintain `<VAULT>/01 Projects/Product Documentation/Daftar Product Documentation.md` with one English wikilink per document. Do not add duplicate links.
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
6. Add YAML frontmatter with `title`, `version`, `status`, `author`, `date`, `type`, `language: en`, `product_owner`, `last_reviewed`, `next_review`, and `source` when applicable.
7. Add a version-history table and update the index with exactly one English wikilink.

## Edit Workflow

- Locate and read the complete `Product Documentation - <Name>.md` before editing.
- Preserve all required sections, exact identifiers, links, and unrelated content.
- Update only requested facts plus directly affected traceability, status, or change-history entries.
- Increment the frontmatter version and append one version-history entry for every material edit.
- If an active editor marker, lock, or conflicting unsaved version is present, stop and ask the user rather than overwriting it.
- Update the index only for a new document or title/path change.

## Required Document Structure

Use these headings in this order. Preserve all ten headings when editing:

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

- the file is stored in the product-documentation folder with the required filename;
- all ten required headings exist in order;
- frontmatter is valid and says `language: en`;
- the ownership, status, review dates, sources, and version history agree;
- product facts, metrics, links, and decisions are evidence-backed or marked `TBD`;
- the hub links to canonical PRD/PRDD, technical, delivery, operations, and user-facing material instead of duplicating it;
- delivery/release snapshots retain their source and actual verification time, separate from document revision dates;
- tables and diagrams are readable and accessible; report parser validation or manual-review limitations for Mermaid when used;
- the documentation index contains exactly one wikilink for the document;
- no unrelated files or companion-language files changed, and any Lark, Jira, or other external changes were explicitly authorized.
