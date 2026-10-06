---
name: review-pr
description: Review a Bitbucket pull request for definitive bugs, hygiene issues, and linked Jira follow-up, then post findings when requested.
---

# Review PR

## Explain the source PR

After fetching the PR, first explain what the source branch changes. Keep this
separate from review findings:

- Summarize the actual diff in 2–5 concise bullets, grouped by behavior or area.
- Use the source diff and commit metadata as evidence; do not infer unimplemented
  work or describe unrelated target-branch code.
- Mention notable API, data, configuration, deployment, or user-facing changes
  when present.
- Label this section `Changes from source PR` in the response before the review
  result.

Fetch metadata and the diff:

```bash
npx openpm-tools fetch-pr-review "<bitbucket-pr-url>" --json
```

Review only definitive bugs: `CRITICAL` for security/data loss, `HIGH` for logic bugs or race conditions, and `BUG` for unhandled null/crash behavior. Ignore style, formatting, refactoring, and subjective nitpicks. Check `metadata.qualityWarnings` for missing PR descriptions or unlinked Jira tickets.

After every review, automatically publish the review result to Bitbucket and linked Jira:

- If findings exist, post the structured findings JSON:

```bash
npx openpm-tools post-pr-review "<bitbucket-pr-url>" '[{"severity":"HIGH","file":"src/app.ts","line":12,"title":"Definitive bug","description":"..."}]'
```

- If no findings exist, post an empty findings array (`[]`). The CLI creates the explicit `NO ISSUES FOUND` review comment and includes any quality warnings.
- This automatic publication is part of the review workflow; do not wait for a separate authorization request.
