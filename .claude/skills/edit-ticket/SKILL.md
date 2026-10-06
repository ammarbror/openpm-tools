---
name: edit-ticket
description: Update summary, description, or assignee of an existing Jira ticket
---

# Edit Ticket Skill

Run the following command using Bash:

```bash
npx openpm-tools edit-ticket "$ARGUMENTS"
```

If arguments specify keys like summary, description, or assignee:
- Format as `npx openpm-tools edit-ticket <issueKey> --summary "..." --description "..." --assignee "..."`

## Mermaid Descriptions

Keep Mermaid source in fenced `mermaid` or `{code:mermaid}` blocks. The shared Jira client renders and uploads SVG attachments while retaining source. Attachment permission is required. Creation saves the source first; if enrichment fails, inspect the issue key in the error and edit that issue instead of retrying creation. On edits, a rendering or upload failure leaves fields unchanged, though previously uploaded attachments may remain. Repeated edits upload new attachments. Layout measurements are approximate, and live Jira inline display is unverified.
