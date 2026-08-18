---
name: create-prdd
description: Create an English-only nine-section Product Requirements & Design Document in an Obsidian vault through an interview.
---

# Create PRDD

Interview the user one section per turn, then write one English file: `PRDD - <Name> (EN).md` under `<VAULT>/01 Projects/PRDs/<sanitized-project-name>/`. Do not create an Indonesian file or require a companion document. If the product name is absent, ask for it first.

Use these nine sections: (1) Overview & Problem Statement, (2) Goals & Success Metrics plus Non-Goals, (3) User Stories / Use Cases, (4) Functional Requirements with MoSCoW P0/P1/P2, (5) System Architecture with `flowchart TD` and tech-stack table, (6) Database Schema / ERD with `erDiagram` and data dictionary, (7) API Contract with endpoint table, JSON examples, and `sequenceDiagram`, (8) Non-Functional Requirements covering performance/security/reliability/observability, and (9) Dependencies & Risks with dependencies, risks, assumptions, and open questions.

Resolve the vault from `OBSIDIAN_VAULT_PATH`, `~/Documents/Obsidian Vault`, or `~/Obsidian`; if unavailable, ask the user for the path. Write all content, headings, tables, and metadata in English. Include YAML frontmatter, valid Mermaid diagrams, MoSCoW tables, and version history. Do not add a companion-file wikilink. Update `<VAULT>/01 Projects/PRDs/Daftar PRDD.md` with one English-file wikilink.
