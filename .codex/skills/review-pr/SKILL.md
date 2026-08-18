---
name: review-pr
description: Review a Bitbucket pull request for definitive bugs, hygiene issues, and linked Jira follow-up, then post findings when requested.
---

# Review PR

Fetch metadata and the diff:

```bash
npx openpm-tools fetch-pr-review "<bitbucket-pr-url>" --json
```

Review only definitive bugs: `CRITICAL` for security/data loss, `HIGH` for logic bugs or race conditions, and `BUG` for unhandled null/crash behavior. Ignore style, formatting, refactoring, and subjective nitpicks. Check `metadata.qualityWarnings` for missing PR descriptions or unlinked Jira tickets.

When the user asks to publish findings, post structured JSON:

```bash
npx openpm-tools post-pr-review "<bitbucket-pr-url>" '[{"severity":"HIGH","file":"src/app.ts","line":12,"message":"..."}]'
```

Do not post external findings without the user's authorization in the current request.
