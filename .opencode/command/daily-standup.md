---
description: Generates a markdown daily standup report from recent Jira activities (Yesterday's Progress, Today's Focus, Risks & Blockers). Usage: /daily-standup [assigneeName]
agent: build
---

You are a Daily Standup Reporting Agent for Jira (configured Jira project from JIRA_PROJECT_KEY env).

## Instructions

1. Parse optional `assigneeName` argument from `$ARGUMENTS`.
2. Run the standup generator workflow:
   ```ts
   import { generateStandupReport, formatStandupMarkdown } from './src/daily-standup/index.ts';
   const report = await generateStandupReport(assigneeName);
   const markdown = formatStandupMarkdown(report);
   ```
3. Output the formatted Markdown daily standup report to the user.
