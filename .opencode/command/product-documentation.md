---
description: Create or maintain an English product documentation hub with ten required sections in the configured Notion or Obsidian workspace. Usage: /product-documentation <product-name>
agent: build
---

## Writing guidance

Follow [Clear, concise, detailed documents](../../docs/document-writing.md). State the main point first, remove repetition, and retain the detail needed to decide, implement, test, or operate. Explain purpose, scope, capabilities, and primary journeys briefly. Link canonical requirements, designs, runbooks, and delivery records rather than reproducing their details.

## Diagram guidance

Read [Diagrams in generated documents](../../docs/document-diagrams.md) before drafting. Include a product/capability overview, primary journey, and audience-to-document map when supported; link canonical technical diagrams rather than duplicating designs.

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

# Product Documentation

Create or edit one English product documentation hub for a product, platform, or major capability. Use this command for product documentation, a product hub, a product overview, a documentation map, or a living product record. Do not use it to replace a feature PRD/PRDD, a technical design document, an API reference, a runbook, or end-user instructions. Read `.codex/skills/product-documentation/SKILL.md` for the complete section expectations, quality rules, and completion checklist.

There is no CLI or MCP writer for this workflow: run it with the available file, MCP, and terminal tools, then verify what was actually saved.

## Storage and Naming

- Notion: store under the OpenPM hub's product documentation category, search before creating, and verify the saved page reads back with all required sections.
- Obsidian: resolve the vault from `OBSIDIAN_VAULT_PATH`, `~/Documents/Obsidian Vault`, or `~/Obsidian`; ask for the path if none exists. Store under `<VAULT>/01 Projects/Product Documentation/` as `Product Documentation - <Name>.md` and keep `Daftar Product Documentation.md` with one English wikilink per document. Do not add duplicate links.
- Never create an Indonesian companion file.

## Documentation boundary

The hub is the navigable product source of truth. Link, do not copy, the canonical detail:

- requirements belong in a PRD/PRDD, including their requirement tables;
- architecture, schemas, and API contracts belong in technical documentation or an ADR;
- work status belongs in Jira or the team's delivery tracker;
- operational procedures belong in a runbook;
- end-user documentation stays a tutorial, how-to, reference, or explanation.

## Create workflow

1. Ask for the product or capability name if it is missing.
2. Inspect referenced PRDs, technical documentation, repositories, research, tickets, runbooks, and user documentation before asking questions.
3. Ask only for facts that cannot be established from the available evidence.
4. If the exact target exists, use the edit workflow instead of overwriting it.
5. Set `status: Draft` while material decisions remain unresolved, mark unknowns `TBD`, and record approval only with evidence.
6. Add YAML frontmatter with `title`, `version`, `status`, `author`, `date`, `type`, `language: en`, `product_owner`, `last_reviewed`, `next_review`, and `source` when applicable.
7. Add a version-history table and update the index with exactly one English wikilink.

## Edit workflow

- Read the complete `Product Documentation - <Name>.md` before editing.
- Preserve required sections, exact identifiers, links, and unrelated content.
- Update only requested facts plus directly affected traceability, status, or change-history entries.
- Increment the frontmatter version and append one version-history entry per material edit.
- Stop and ask if an active editor marker, lock, or conflicting unsaved version is present.
- Update the index only for a new document or title/path change.

## Required structure

Use these headings in this order and preserve all ten when editing:

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

Metrics need formula, baseline, target, measurement window, owner, and analytics source when known. Distinguish `Existing`, `Proposed`, and `Unverified` capabilities with canonical sources; a PRDD does not prove implementation or release. Keep delivery/release snapshots with their source and an actual `Verified at` time, separate from document revision dates. Do not invent SLOs, retention periods, roadmap dates, or Jira backlogs.

## Safety and validation

- Lead with the product outcome and user problem; keep implementation detail in linked technical documents.
- Use meaningful link text, a logical heading hierarchy, active language, and tables that read without rendering.
- Use a diagram only when it clarifies a journey, dependency, or ownership relationship; validate Mermaid with an available parser or renderer and name the tool, otherwise report manual review only.
- Do not create placeholder links; label unknowns `TBD` and record owners where known.
- Do not synchronize to Lark, Jira, or another external system unless explicitly requested.
- Before reporting completion, verify the ten headings, valid frontmatter with `language: en`, agreement between ownership/status/review dates/sources/version history, evidence-backed facts, a single index link, and that no unrelated files changed.

User request: $ARGUMENTS
