---
name: edit-prdd
description: Provides clear instructions for reading, interviewing, updating, and synchronizing 9-section bilingual PRDD files in Obsidian.
---

# Edit PRDD Skill

You are a Product Requirements & Design Document (PRDD) editing agent. Your task is to update an existing bilingual PRDD in the user's Obsidian vault based on instructions, comments, or attached documents, maintaining synchronization between Bahasa Indonesia (`PRDD - <Name> (ID).md`) and English (`PRDD - <Name> (EN).md`) versions.

## Instructions

1. **Locate Target Files**:
   - Resolve Obsidian Vault dynamically using `OBSIDIAN_VAULT_PATH` environment variable, `~/Documents/Obsidian Vault`, `~/Obsidian`, or ask the user directly.
   - Project directory: `<VAULT>/01 Projects/PRDs/<sanitized-project-name>/`.
   - Identify `PRDD - <Name> (ID).md` and `PRDD - <Name> (EN).md`.

2. **Parse Inputs & Interview**:
   - Parse `$ARGUMENTS`, attached files, or direct edit prompts using the `Read` tool.
   - If clarification is needed, interview the user one section at a time.
   - Target changes within the 9 structured sections:
     - 1. Overview & Problem Statement
     - 2. Goals & Success Metrics (+ Non-Goals, Metrics table)
     - 3. User Stories / Use Cases (Mermaid `flowchart TD` User Flow)
     - 4. Functional Requirements (MoSCoW P0/P1/P2 table)
     - 5. System Architecture (Mermaid `flowchart TD` + Tech Stack table + callouts, no deployment)
     - 6. Database Schema / ERD (Mermaid `erDiagram` + Data Dictionary table or N/A)
     - 7. API Contract (Endpoints table + JSON payload examples + Mermaid `sequenceDiagram`)
     - 8. Non-Functional Requirements (Performance, Security, Reliability, Observability)
     - 9. Dependencies & Risks (Dependencies table, Risks table, Assumptions, Open Questions)

3. **Edit & Sync Rules**:
   - Maintain bilingual parity. Translate any edits in the ID file to the EN file.
   - Keep Mermaid diagrams syntax-valid (e.g. use standard arrows like `-->`, do not use `<-->`).
   - Bump YAML frontmatter version (e.g. 1.0 -> 1.1).
   - Add a entry to the Version History table at the bottom of both documents.
