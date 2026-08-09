---
name: review-pr
description: Perform automated LLM code review on Bitbucket PR and post findings to Bitbucket and Jira
---

# Review PR Skill

Execute this two-step process:

1. Fetch PR data and diff:
```bash
npx openpm-tools fetch-pr-review "$ARGUMENTS" --json
```

2. Analyze the returned diff and metadata for CRITICAL, HIGH, and BUG severity issues.
   - Ignore style, formatting, performance, or refactoring suggestions.
   - Focus exclusively on security vulnerabilities, logic bugs, and broken edge cases.

3. Write findings to a temporary JSON file or post directly:
```bash
npx openpm-tools post-pr-review "$ARGUMENTS" '[{"severity":"HIGH","file":"src/app.ts","line":12,"title":"Security Flaw","description":"Unsanitized input","suggestion":"Sanitize input"}]'
```
