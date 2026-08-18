---
name: brainstorm
description: Runs a topic-agnostic, bounded brainstorming interview and exports one Markdown document.
---

# Brainstorm Skill

Run an interactive brainstorming session for any topic: product ideas, personal decisions,
processes, technical problems, writing, research questions, or another subject the user names.
The deliverable is exactly one Markdown file, written to the directory the user selects (default:
the current working directory). This is an ideation record, not factual research or professional
legal, medical, or financial advice.

## Arguments and session controls

- Parse `$ARGUMENTS` as `<topic>`, with optional `--quick`, `--deep`, and `--out <directory>`.
- If no usable topic is present, ask for the topic and do not create a file yet.
- Adapt the language to the user's language. Ask at most one substantive question per turn.
- `--quick` uses at most 6 turns and may produce fewer than 8 ideas. Standard mode and `--deep` use
  at most 10 turns and require at least 8 distinct ideas unless the user explicitly requests fewer.
  Never invent user facts: label gaps `TBD` or `N/A`.
- `finish`, `done`, and `export` are early-completion signals. Summarize what is known and export.

## Interview flow

Use this order, adapting or skipping only when the user already answered it:

1. Ask one focused question: “What outcome would make this brainstorming session useful?”
   Capture audience and context only in later turns or when the user volunteers them.
2. Ask for constraints, resources, time horizon, and non-goals.
3. Diverge: generate ideas without judging them. Add synthesized ideas only with the label
   `Source: synthesized idea`; preserve user ideas as `Source: user-provided`.
4. Cluster ideas into themes and identify overlaps.
5. Ask which criteria matter most (impact, effort, risk, reach, learning, or user-provided criteria).
6. Prioritize separately from idea generation; explain the rationale and trade-offs.
7. Synthesize recommended directions, open questions/risks, and concrete next actions.

Do not imply that an idea is validated. Mark assistant inferences `Source: assumption` and unresolved
items `Source: open question`. For high-stakes topics, include a qualified-review note and recommend
appropriate professional review.

## Markdown output contract

Create one file named `Brainstorm - <sanitized-topic> - <YYYY-MM-DD>.md`. Normalize input newlines to
spaces and remove control characters before using the topic. Replace runs of characters outside
letters, numbers, spaces, `_`, and `-` with `-`, trim separators, cap the sanitized topic stem at
80 characters, and use `Topic` when empty. If the path exists, append ` (2)`, ` (3)`, etc.; never
overwrite silently. State the final path.

The file begins with YAML frontmatter. YAML-quote `title` and `topic`, escaping backslashes, double
quotes, and newlines. It contains `title`, `type: Brainstorm`, `topic`, `date`, and
`status: Draft`. Include these sections in this order (use `TBD`/`N/A` where needed):

1. Objective & Context
2. Constraints & Non-Goals
3. Assumptions & Evidence Boundaries
4. Success Criteria
5. Divergent Ideas (at least 8 distinct ideas in standard mode unless fewer were explicitly requested,
   each with source label)
6. Themes & Clusters
7. Prioritization Criteria & Rationale
8. Recommended Directions & Trade-offs
9. Open Questions & Risks
10. Next Actions

Keep all information understandable without rendering a diagram. Add Mermaid only when it materially
clarifies relationships, stages, dependencies, or choices (usually a simple `flowchart`); include a
one-sentence explanation immediately before it. Omit Mermaid for a simple list or when it would be
decorative. Never use a diagram as a substitute for the prose explanation.
