---
name: create-ticket
description: Create a well-structured Jira ticket in the active sprint with an improved summary and description.
---

# Create Ticket

Use the repository CLI:

```bash
npx openpm-tools create-ticket "<improved summary>" [flags]
```

Always rewrite the supplied summary for clarity, grammar, concise professional Jira style, and a clear action or feature. If a description is supplied, refine and structure it. If absent, generate a meaningful description from context; if context is insufficient, omit `--description` so the CLI can provide its ticket-type template.

Preserve and extract supported flags: `--type`, `--description`, `--assignee`, `--sprint`, `--epic`, and `--story-points`. Do not expose credentials or copy secrets into the ticket.
