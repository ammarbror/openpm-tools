# Diagrams in generated documents

Use this guide when creating or editing documents through the repository's skills,
commands, or PRDD CLI/MCP guides. Prefer a visual explanation for workflows,
decisions, relationships, and state changes. Keep required document headings and
place each diagram in the section it explains.
Follow [Clear, concise, detailed documents](document-writing.md) for prose and depth;
each visual should add understanding without repeating adjacent content.

## Plan the reader's path

Start a substantial document with a compact overview diagram near the introduction,
then add focused diagrams alongside the important journeys, contracts, and data
models. Each diagram should answer a distinct reader question. For a full PRDD,
technical document, or combined specification, normally cover the overview, primary
journey, system interactions, and data relationships when those concepts apply.
Add decision, lifecycle, failure/recovery, or rollout views where they explain
behavior that prose alone makes difficult to follow. Do not treat one architecture
diagram as sufficient coverage of every flow.

Scale coverage to the evidence and scope. A short note or simple topic may need no
diagram. Briefly explain inapplicable or unsupported views rather than inventing
components, transitions, schema, dates, or business rules to fill a diagram quota.
For edits, improve diagrams within the requested scope and update directly affected
views; preserve unrelated content and user-supplied Mermaid unless changing it is
authorized.

## Choose the view

| Reader question | Preferred view | Show |
| --- | --- | --- |
| What is this product or system connected to? | `flowchart TD` or `flowchart LR` | Actors, system boundary, external systems, labeled connections |
| How does the user reach an outcome? | Flowchart | Entry point, actions, decisions, success, important error/retry branches |
| Who calls whom, and in what order? | `sequenceDiagram` | Named participants, requests/events, responses, sync/async boundaries, relevant failure paths |
| What changes state, and under which conditions? | `stateDiagram-v2` | Known states, transition triggers, terminal states, duplicate/retry behavior |
| How is data related? | `erDiagram` | Exact entity/key names, supported relationships and cardinality; distinguish inferred from enforced relations |
| What rule selects an outcome? | Flowchart with decision nodes | Conditions, branch labels, eligibility or permission outcomes |
| What depends on what? | Flowchart | Modules, owners, delivery dependencies, or canonical document relationships |
| How will rollout or recovery work? | Flowchart; timeline only with sourced dates | Order, gates, failure handling, rollback or compensation boundaries |

## Coverage by workflow

| Workflow | Expected visual coverage when supported |
| --- | --- |
| `create-prdd` | Overview/context in Section 1; primary journey in Section 3; architecture in Section 5; ERD in Section 6; sequence for each materially different critical integration in Section 7. Add decision/state views in Sections 4 or 8 for complex rules and recovery. |
| `edit-prdd` | Apply the PRDD coverage to the requested change; reconcile affected journeys, architecture, ERD, sequence, and state/decision views. A narrow edit does not authorize a full visual rewrite. |
| `technical-docs` | Context/architecture in Section 2; module dependencies in Section 5; ERD in Section 7; access decision/enforcement flow in Sections 3 or 8; UI navigation in Section 10 when applicable. Add sequences, editing lifecycle, and recovery views in their relevant section or appendix. |
| `product-technical-specification` | Context in Section 1; user journey in Section 3; architecture/module relationships in Section 5; ERD in Section 6; critical API/event sequences in Section 7; meaningful access, lifecycle/recovery, and rollout views in Sections 8, 9, and 11. |
| `product-documentation` | Product context/capability map in Sections 1 or 4; primary journey in Section 5; audience-to-document map in Section 10. Add delivery/rollout dependencies when useful; link detailed technical diagrams in canonical designs. |
| `brainstorm` | Map themes/clusters and show recommended choices or next-action dependencies when the topic has meaningful relationships. Label synthesized ideas and assumptions; simple topics can remain diagram-free. |
| `extract-knowledge` | Preserve source diagrams and captions where extractable; add a clearly labeled derived overview/process/relationship view only when supported by extracted evidence. Keep the original extraction and source references intact. |
| `daily-standup` | Add a compact blocker/dependency flow only when it explains an actionable relationship. Keep ordinary updates concise. |
| `sprint-report` | Preserve generated metrics/charts; add a dependency or blocker flow when supported by issue links. Charts use measured sprint data, never invented progress. |
| `release-workflow` | Add a rollout/dependency or before/after flow when release evidence supports it; keep ticket links and release facts. A release note does not prove deployment. |

## Make diagrams readable

- Use fenced `mermaid` blocks as editable source. Prefer the simple syntax above
  over renderer-specific extensions. Use stable node IDs and quote flowchart labels
  containing punctuation. Preserve exact API, event, table, field, and enum names.
- Give each diagram a descriptive title or caption stating its purpose and key
  takeaway. Add a short text summary when the caption is insufficient for readers
  without rendering; avoid repeating every arrow. Define abbreviations and any
  arrow or line-style conventions. Readers should understand the conclusion even
  when the diagram does not render.
- Keep one level of detail per diagram. Aim for about 5–9 nodes or participants in
  overview views; split crowded views into linked subprocesses. ERDs may need more
  entities, but should be grouped by domain with omissions stated.
- Label branches and meaningful arrows. Include relevant denied, invalid, timeout,
  retry, duplicate, and compensation paths when known. Do not imply unknown retry
  policies, transaction boundaries, or locks exist.
- Mark `Existing`, `Proposed`, `Unverified`, and `TBD` in labels or captions, and
  keep source/revision/environment references nearby. Separate current and proposed
  views if combining them would suggest an unimplemented flow is live.
- Keep precise contracts, acceptance criteria, role matrices, and data dictionaries
  in text/tables next to the diagrams. Do not encode essential meaning only in
  color, line placement, or an image.

## Validate and publish

1. Cross-check participants, identifiers, branches, states, relationships, and
   ordering against the supporting evidence and adjacent text/tables. Syntax
   validation alone does not establish factual accuracy.
2. Validate Mermaid with an available parser or renderer, repair syntax errors,
   and identify the tool used. If none is available, report manual syntax review
   and lack of parser verification. If rendering is available, inspect for clipped
   labels, overlapping nodes, unreadable density, and ambiguous arrows.
3. Verify the destination preserves the Mermaid block and explanation. For Notion,
   follow `docs/notion-workflow.md` and its supported Markdown/block format; read
   back the saved source and language. Read-back proves source preservation, not
   visual rendering. Do not claim the destination renders a diagram unless checked.
4. If the destination cannot render Mermaid, retain source and the text summary;
   add a rendered SVG/PNG only when supported and within the authorized operation.
   Do not silently drop the diagram or claim a fallback image was uploaded.
5. Report the saved page URL or file path and any validation/rendering limitations.
   Preserve publication, versioning, overwrite, and external-write safety rules.
