---
name: release-workflow
description: Create Jira release/version for Ready for Release tickets and generate release notes
---

## Writing guidance

Follow [Clear, concise, detailed documents](../../../docs/document-writing.md). State the main point first, remove repetition, and retain the detail needed to decide, implement, test, or operate. Lead with user-visible changes and required actions. Retain compatibility, migration, known limitations, ticket links, and verified release status; omit generic celebration and repeated ticket descriptions.

## Diagram guidance

Read [Diagrams in generated documents](../../../docs/document-diagrams.md) before drafting. Add source-backed rollout/dependency or before/after flows when useful; retain release facts and ticket links without implying deployment is verified.

# Release Workflow Skill

Run the following command using Bash:

```bash
npx openpm-tools release-workflow "$ARGUMENTS"
```
