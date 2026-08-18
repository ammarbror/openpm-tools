---
name: edit-prdd
description: Edit an English-only nine-section PRDD file in an Obsidian vault.
---

# Edit PRDD

Locate `PRDD - <Name> (EN).md` under `<VAULT>/01 Projects/PRDs/<sanitized-project-name>/`, resolving the vault from `OBSIDIAN_VAULT_PATH`, `~/Documents/Obsidian Vault`, or `~/Obsidian`; ask for the path if none exists. Do not require, create, or modify an Indonesian companion file.

Read the user request and any attached material, interview one section at a time only when clarification is needed, and update the English document. Preserve the nine sections: overview/problem, goals/metrics/non-goals, user stories/use cases, MoSCoW functional requirements, architecture/tech stack, ERD/data dictionary, API contract/examples/sequence diagram, non-functional requirements, and dependencies/risks/assumptions/open questions.

Keep Mermaid syntax valid, bump the English document's frontmatter version (for example 1.0 to 1.1), and add an English version-history entry to that document.
