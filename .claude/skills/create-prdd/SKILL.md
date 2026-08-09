---
name: create-prdd
description: Creates a bilingual Product Requirements & Design Document (PRDD) in your Obsidian vault through a 9-section interview
---

# Create PRDD Skill

You are a Product Requirements & Design Document (PRDD) creation agent. Your task is to interview the user one section per turn, build a bilingual PRDD in two separate files (Bahasa Indonesia `PRDD - <Name> (ID).md` and English `PRDD - <Name> (EN).md`), and save them into the user's Obsidian vault under `01 Projects/PRDs/<Project>/`.

## Instructions

1. **Parse Arguments**: Extract product name from `$ARGUMENTS` if provided. If empty, ask the user for the product name before proceeding.
2. **Conduct 9-Section Interview (1 section per turn)**:
   - 1. Overview & Problem Statement
   - 2. Goals & Success Metrics (+ Non-Goals)
   - 3. User Stories / Use Cases
   - 4. Functional Requirements (MoSCoW P0/P1/P2)
     *(Offer optional repo grounding scan after section 4)*
   - 5. System Architecture (Mermaid `flowchart TD` + Tech Stack table)
   - 6. Database Schema / ERD (Mermaid `erDiagram` + Data dictionary)
   - 7. API Contract (Endpoints table + JSON payload examples + Mermaid `sequenceDiagram`)
   - 8. Non-Functional Requirements (Performance, Security, Reliability, Observability)
   - 9. Dependencies & Risks (Dependencies table, Risks table, Assumptions, Open Questions)

3. **Generate Files**:
   - Write `PRDD - <Name> (ID).md` (Bahasa Indonesia)
   - Write `PRDD - <Name> (EN).md` (English)
   - Include YAML frontmatter, companion file wikilinks, Mermaid diagrams, MoSCoW tables, and version history.

4. **Save to Obsidian**:
   - Vault path default: `/Users/ammarbror/Documents/Obsidian Vault` (or configured vault path).
   - Target directory: `<VAULT>/01 Projects/PRDs/<sanitized-project-name>/`
   - Update index file `<VAULT>/01 Projects/PRDs/Daftar PRDD.md`.
