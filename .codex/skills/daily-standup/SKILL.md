---
name: daily-standup
description: Generate a real-time Markdown daily standup report from Jira activity.
---

# Daily Standup

Use this skill for a daily standup, daily progress report, or team status update. Run:

```bash
npx openpm-tools daily-standup [assigneeName] [--json]
```

The report should cover Yesterday's Progress, Today's Focus, and Risks & Blockers for the configured project or optional assignee. Use `--json` when the result will be consumed programmatically.
