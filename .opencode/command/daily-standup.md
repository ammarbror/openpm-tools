---
description: "Generates a markdown daily standup report from recent Jira activities (Yesterday's Progress, Today's Focus, Risks & Blockers). Usage: /daily-standup [assigneeName]"
agent: build
---

## Writing guidance

Follow [Clear, concise, detailed documents](../../docs/document-writing.md). State the main point first, remove repetition, and retain the detail needed to decide, implement, test, or operate. Use brief outcome-focused items under the existing report headings. Keep issue links and actionable blockers with owner/next action when known; avoid repeating the same update in multiple sections.

## Diagram guidance

Read [Diagrams in generated documents](../../docs/document-diagrams.md) before drafting. Include a blocker/dependency flow only when it clarifies an actionable relationship; keep ordinary standups concise.

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
