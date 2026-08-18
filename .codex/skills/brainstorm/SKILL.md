---
name: brainstorm
description: Run a bounded brainstorming interview for any topic and export one structured Markdown document.
---

# Brainstorm

Use this skill for product ideas, personal decisions, processes, technical problems, writing, or research questions. The deliverable is exactly one Markdown file in the user-selected directory (default: current working directory); it is an ideation record, not factual research or professional advice.

- Interpret the user request as `<topic>` with optional `--quick`, `--deep`, and `--out <directory>` controls.
- If no usable topic is provided, ask for it before creating a file.
- Match the user's language and ask at most one substantive question per turn.
- Quick mode uses at most 6 turns. Standard/deep mode uses at most 10 turns and at least 8 distinct ideas unless fewer are explicitly requested.
- `finish`, `done`, and `export` complete early. Never invent user facts; label gaps `TBD` or `N/A`.

Interview in this order, adapting when already answered: objective and context; constraints/resources/time horizon/non-goals; divergent ideas; themes; prioritization criteria; prioritized directions and trade-offs; open questions, risks, and next actions. Label assistant-generated ideas `Source: synthesized idea`, user ideas `Source: user-provided`, inferences `Source: assumption`, and unresolved items `Source: open question`. For high-stakes topics, include a qualified-review note.

Write `Brainstorm - <sanitized-topic> - <YYYY-MM-DD>.md`. Normalize newlines to spaces, remove control characters, replace runs outside letters/numbers/spaces/`_`/`-` with `-`, trim separators, cap the stem at 80 characters, and use `Topic` when empty. If the path exists, append ` (2)`, ` (3)`, etc.; never overwrite silently. Begin with YAML frontmatter containing quoted `title`, quoted `topic`, `type: Brainstorm`, `date`, and `status: Draft`.

Use these sections in order: Objective & Context; Constraints & Non-Goals; Assumptions & Evidence Boundaries; Success Criteria; Divergent Ideas; Themes & Clusters; Prioritization Criteria & Rationale; Recommended Directions & Trade-offs; Open Questions & Risks; Next Actions. Include Mermaid only when it materially clarifies relationships, with a prose explanation immediately before it.
