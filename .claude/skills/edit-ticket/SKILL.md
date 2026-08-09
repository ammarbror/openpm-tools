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
