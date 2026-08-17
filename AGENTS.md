# openpm-tools agent guidance

This repository provides Jira, Bitbucket, and Obsidian workflows through a shared CLI and stdio MCP server.

## Using the repository from Codex

- Prefer the project-local Codex skills in `.codex/skills/` for repeatable workflows when they are available.
- Run the CLI from the repository with `npx openpm-tools <command> ...` or `npm run cli -- <command> ...`.
- Use `npm run mcp` when connecting Codex to the repository's stdio MCP server.
- Load credentials from `.env`; never print, commit, or copy secret values into tickets, reports, prompts, or documentation.
- Treat generated PRDs, release notes, and reports as user-owned artifacts: inspect paths before writing and preserve existing content unless the workflow explicitly updates it.
- Run `npm test` after code changes. Keep documentation-only changes free of unrelated source edits.

See `README.md` for command arguments and Codex setup.
