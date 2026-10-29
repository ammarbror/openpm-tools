---
name: daily-standup
description: Generate a real-time Markdown daily standup report from Jira activity.
---

## Writing guidance

Follow [Clear, concise, detailed documents](../../../docs/document-writing.md). State the main point first, remove repetition, and retain the detail needed to decide, implement, test, or operate. Use brief outcome-focused items under the existing report headings. Keep issue links and actionable blockers with owner/next action when known; avoid repeating the same update in multiple sections.

## Diagram guidance

Read [Diagrams in generated documents](../../../docs/document-diagrams.md) before drafting. Include a blocker/dependency flow only when it clarifies an actionable relationship; keep ordinary standups concise.

# Daily Standup

Use this skill for a daily standup, daily progress report, or team status update. Run:

```bash
npx openpm-tools daily-standup [assigneeName] [--json]
```

The report should cover Yesterday's Progress, Today's Focus, and Risks & Blockers for the configured project or optional assignee. Use `--json` when the result will be consumed programmatically.
