---
name: review-pr
description: Perform automated LLM code review on Bitbucket PR and post findings to Bitbucket and Jira
---

# Review PR Skill

Automated Bitbucket PR code review with Jira cross-referencing, PR hygiene checks, and actionable next steps.

## Workflow

1. **Fetch PR metadata & diff:**
   ```bash
   npx openpm-tools fetch-pr-review "<bitbucket-pr-url>" --json
   ```

2. **Analyze diff & metadata:**
   - **Severity Levels:** `CRITICAL` (security/data loss), `HIGH` (logic bugs/race conditions), `BUG` (unhandled null/crash).
   - **Rules:** Ignore style, refactoring, formatting, or subjective nitpicks. Only flag definitive bugs.
   - **Hygiene Alerts:** Check `metadata.qualityWarnings` (missing PR description, unlinked Jira tickets).

3. **Post Findings & Cross-References:**
   ```bash
   npx openpm-tools post-pr-review "<bitbucket-pr-url>" '[{"severity":"HIGH","file":"src/app.ts","line":12,"message":"Unsanitized input reaching SQL query."}]'
   ```

