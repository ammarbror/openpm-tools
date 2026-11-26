# Clear, concise, detailed documents

Apply this guide to documents and reports created or edited through the repository's
skills, commands, and CLI/MCP guides. Write enough for the intended reader to make
a decision or carry out the work without guessing. Keep the document's required
language, section structure, evidence, versioning, and publication rules.

## Put the reader's answer first

- Start every created document (after metadata/title and before Section 1) with a concise
  `## TL;DR` section summarizing the core purpose, key decision or outcome, scope
  boundary, and current status or next action in 3–5 scannable lines or bullets.
- Open with the purpose, problem or outcome, and scope. For substantial documents,
  use a short overview so readers understand the whole before the detail. For short
  reports, lead directly with the result, current focus, or blocker.
- Start each section with its main fact, decision, or rule. Add context only when it
  explains why that point matters. Use descriptive headings and one idea per paragraph.
- Use plain words, active verbs, and consistent domain terms. Define unfamiliar
  abbreviations once. Replace vague claims such as "fast", "secure", or "works
  correctly" with observable behavior or sourced criteria; mark unknown targets `TBD`.
- Eliminate all residual wording: remove conversational filler, AI meta-commentary,
  throat-clearing, redundant introductions, duplicate restatements across prose/tables/diagrams,
  vague buzzwords, and stale draft or edit leftovers. Keep every sentence to the point,
  clear, and clean.

## Keep the detail that changes understanding or action

- Preserve exact identifiers, business rules, constraints, acceptance criteria,
  permission boundaries, and meaningful failure/retry cases. Concision must not
  remove conditions, exceptions, or evidence needed to implement, test, or operate.
- For a requirement or procedure, identify the actor or trigger, condition, action,
  and observable outcome when applicable. Include owner, dependency, and next action
  when known and useful; do not fill every paragraph with empty metadata fields.
- Put detailed contracts, field dictionaries, payloads, and supporting evidence in
  their canonical section or a useful appendix. Link to that detail elsewhere.
  Keep decisive constraints and risks visible near the behavior they qualify.
- Use tables for comparisons, mappings, rules, and structured contracts; numbered
  lists for ordered steps; prose for explanation. Use representative examples for
  ambiguous behavior and important exceptions, rather than repeating every variant.
- Separate supported facts, proposed behavior, assumptions, and unresolved decisions.
  Keep source references near the claims they support. Never replace missing
  evidence with confident wording or invented detail.
- Scale depth to scope and audience, without a fixed word/page quota. Preserve
  required headings; use a brief reasoned `Not applicable` where appropriate.
  Omit optional empty sections. A narrow edit does not authorize a full rewrite.

## Let diagrams carry their share

Follow [Diagrams in generated documents](document-diagrams.md). Use diagrams to
explain relationships, sequence, or decisions; use adjacent text for rules,
exceptions, evidence, and the takeaway. A concise caption can state both the
diagram's purpose and its conclusion. Add a text summary when needed for readers
without rendering, but avoid describing every arrow again. Preserve existing
contracts and user-supplied Mermaid within the authorized scope.

## Review before delivery

1. Can the intended reader quickly find the purpose, scope, main behavior or
   decision, and any material blocker or next action?
2. Does every paragraph, table, diagram, and example add information the reader
   needs? Verify the opening `## TL;DR` is present and all residual wording, filler,
   and repetition are removed without losing requirements or evidence.
3. Are important conditions, exceptions, exact contracts, and verification criteria
   still explicit? Could the reader act without guessing?
4. Do prose, tables, examples, diagrams, and status labels agree? Is every factual
   claim sourced or clearly marked as unverified, proposed, or unresolved?
5. For edits, did only requested content and directly affected references change?
   Verify the saved result according to the skill's storage and read-back rules.
