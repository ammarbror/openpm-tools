---
name: create-ticket
description: Create a Jira ticket assigned to the current sprint with structured description formatting
---

# Create Ticket Skill

Run the following command using Bash:

```bash
npx openpm-tools create-ticket "$ARGUMENTS"
```

If arguments are complex or contain multiple flags:
- Extract summary, type (`--type`), description (`--description`), assignee (`--assignee`), sprint (`--sprint`), epic (`--epic`), story points (`--story-points`).
- Execute `npx openpm-tools create-ticket <summary> [flags]`.
