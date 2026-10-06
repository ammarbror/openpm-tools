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

## Mermaid Descriptions

Keep Mermaid source in fenced `mermaid` or `{code:mermaid}` blocks. The shared Jira client renders and uploads SVG attachments while retaining source. Attachment permission is required. Creation saves the source first; if enrichment fails, inspect the issue key in the error and edit that issue instead of retrying creation. On edits, a rendering or upload failure leaves fields unchanged, though previously uploaded attachments may remain. Repeated edits upload new attachments. Layout measurements are approximate, and live Jira inline display is unverified.
