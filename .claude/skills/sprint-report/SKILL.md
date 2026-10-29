---
name: sprint-report
description: Generate comprehensive Jira sprint report with burndown metrics and HTML export
---

## Writing guidance

Follow [Clear, concise, detailed documents](../../../docs/document-writing.md). State the main point first, remove repetition, and retain the detail needed to decide, implement, test, or operate. Lead with sprint health, progress, and material blockers. Preserve metrics, assumptions, issue evidence, and export paths; explain implications without narrating every table or chart value.

## Diagram guidance

Read [Diagrams in generated documents](../../../docs/document-diagrams.md) before drafting. Preserve generated metrics and charts; add source-backed blocker/dependency flows when useful, without inventing progress or issue relationships.

# Sprint Report Skill

Run the following command using Bash:

```bash
npx openpm-tools sprint-report --export-html "$ARGUMENTS"
```
