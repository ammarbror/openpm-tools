---
name: release-workflow
description: Create a Jira release version for Ready for Release tickets and generate release notes.
---

# Release Workflow

Run the repository CLI:

```bash
npx openpm-tools release-workflow [arguments]
```

Use the user's requested release options, such as `--version-name`, and preserve the workflow's Jira filtering and Markdown release-note output. Confirm scope before external Jira mutations when the request is ambiguous.
