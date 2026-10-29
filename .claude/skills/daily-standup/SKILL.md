---
name: daily-standup
description: Generate real-time Markdown daily standup reports from Jira activities
---

## Writing guidance

Follow [Clear, concise, detailed documents](../../../docs/document-writing.md). State the main point first, remove repetition, and retain the detail needed to decide, implement, test, or operate. Use brief outcome-focused items under the existing report headings. Keep issue links and actionable blockers with owner/next action when known; avoid repeating the same update in multiple sections.

## Diagram guidance

Read [Diagrams in generated documents](../../../docs/document-diagrams.md) before drafting. Include a blocker/dependency flow only when it clarifies an actionable relationship; keep ordinary standups concise.

# Daily Standup Report

Generate a markdown daily standup report from recent Jira activities (Yesterday's Progress, Today's Focus, Risks & Blockers) for the configured project or specific assignee.

## Trigger

Use this skill when the user requests a daily standup update, daily progress report, or status update of the team.

## Usage

```bash
npx openpm-tools daily-standup [assigneeName] [--json]
```

Or programmatically in an agent workflow:
```ts
import { generateStandupReport, formatStandupMarkdown } from './src/daily-standup/index.ts';
const report = await generateStandupReport(assigneeName);
const markdown = formatStandupMarkdown(report);
```

