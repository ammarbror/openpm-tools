---
name: edit-ticket
description: Update the summary, description, or assignee of an existing Jira ticket.
---

# Edit Ticket

Run:

```bash
npx openpm-tools edit-ticket <issueKey> [--summary "..."] [--description "..."] [--assignee "..."]
```

Only change fields requested by the user. Preserve Jira issue keys and do not expose credentials.
