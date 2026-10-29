---
name: create-ticket
description: Create a clear Jira ticket with a context-based story point estimate in the active sprint, or the first future sprint when none is active.
---

# Create Ticket

Use the repository CLI from the repository directory. Load configured credentials through the CLI; never expose credentials or copy secrets into a ticket.

```bash
npx openpm-tools create-ticket "<improved summary>" --description "<complete description>" --story-points <estimate> [flags] --json
```

## Prepare the ticket

Rewrite the summary as a concise, professional action and affected feature. Preserve product names, technical identifiers, and prefixes such as [BE] or [FE]. Use the user's explicit issue type; otherwise choose Bug for a defect, Story for user-facing functionality, Epic for a multi-ticket initiative, and Task for other work.

Extract the requested assignee, sprint, parent epic, and estimate. Supported flags are `--type`, `--description`, `--assignee`, `--assignee-id`, `--sprint`, `--epic`, and `--story-points`. Use an exact Jira display name or a known account ID. Do not guess an account ID. If a name has no unique exact match, resolve it with available Jira read tools or ask for clarification before creating.

## Write a description the assignee can work from

Always prepare the clearest description the available context supports. Use supplied documents and relevant conversation context, preserving business rules, field mappings, URLs, payloads, and examples. Do not invent endpoint contracts, observed errors, designs, or approved business decisions.

Write a complete, structured description using Jira headings (`h3. Heading`) or Markdown headings. The CLI preserves supplied content without adding sections or inferred requirements.

Include the sections that help explain this ticket:

- Objective and context: the problem, affected product or users, and intended outcome.
- Scope and expected behavior: specific changes and relevant success, empty, validation, and error scenarios.
- Acceptance criteria: observable outcomes that can be tested; avoid vague criteria such as "works correctly".
- Technical details and examples: known endpoints, payloads, mappings, dependencies, and related tickets.
- Open questions and assumptions: label unresolved decisions and estimation assumptions explicitly.

For Bugs, include known actual/expected behavior, reproduction steps, environment, and evidence. Mark unavailable evidence as unknown rather than manufacturing reproduction steps. For Stories, explain user benefit. For Epics, explain goals and child work streams.

A short request still needs a concrete objective, known scope, and useful acceptance criteria. State material unknowns clearly. Ask only when an unresolved choice would materially change the requested work. An omitted description is a CLI fallback skeleton, not a finished ticket.

## Recommend and populate story points

Preserve an explicit user estimate. Otherwise recommend an estimate from the ticket's scope, complexity, components, integration dependencies, testing, and uncertainty, then pass it through `--story-points`. Use the project's known scale. If none is available, use 1, 2, 3, 5, 8, or 13 as a provisional Fibonacci scale:

- 1: isolated, well-understood change with limited testing.
- 2: small change with a few validation paths.
- 3: moderate feature or defect affecting a familiar flow.
- 5: several components or an integration with meaningful testing.
- 8: substantial integration, cross-system changes, or notable uncertainty.
- 13: broad work needing decomposition; explain the recommendation and identify child work without creating extra tickets unless requested.

Points represent relative effort and uncertainty, not hours. Include a brief estimation rationale and material assumptions in the description. Do not silently assign 0 for missing context. For an Epic, explain whether its estimate covers the whole initiative and avoid presenting it as a sprint commitment. The CLI requires a finite, non-negative estimate and does not infer one.

## Sprint and completion

An explicit sprint must exist on the selected board. Otherwise, the CLI uses the active sprint, then the first future sprint, or leaves the issue in the backlog if neither exists. Epics do not enter sprints; omit `--sprint` for them.

Check the saved ticket with an available Jira read tool when possible: summary, description, type, assignee, story points, parent epic, and sprint. If a read tool is unavailable, report the CLI result and state that saved fields were not independently verified. Return the issue link, summary, assignee, actual sprint or backlog placement, and estimate with a short rationale.

If any creation step errors, the issue may already exist. Inspect the issue key in the error or locate the issue in Jira before retrying. Repair the existing issue when creation succeeded but sprint assignment or diagram enrichment failed. Never blindly repeat create after an uncertain response.

## Mermaid Descriptions

Keep Mermaid source in fenced `mermaid` or `{code:mermaid}` blocks without changing the supplied diagram logic. The shared Jira client renders and uploads SVG attachments while retaining source. Attachment permission is required. Creation saves the source first; an enrichment failure reports the existing issue key. Edit that issue instead of retrying creation. Edits enrich before updating fields; uploaded attachments may remain on later failure. Repeated edits upload new attachments. Layout measurements are approximate; live Jira inline display is unverified.
