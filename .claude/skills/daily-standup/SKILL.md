# Daily Standup Report

Generate a markdown daily standup report from recent Jira activities (Yesterday's Progress, Today's Focus, Risks & Blockers) for the configured project or specific assignee.

## Trigger

Use this skill when the user requests a daily standup update, daily progress report, or status update of the team.

## Usage

```bash
npx openpm-tools daily-standup [assigneeName]
```

Or programmatically in an agent workflow:
```ts
import { generateStandupReport, formatStandupMarkdown } from './src/daily-standup/index.ts';
const report = await generateStandupReport(assigneeName);
const markdown = formatStandupMarkdown(report);
```
