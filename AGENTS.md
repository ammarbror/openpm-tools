# openpm-tools agent guidance

This repository provides Jira, Bitbucket, and document workflows through a shared CLI and stdio MCP server.

## Notion document workspace

When `DOCUMENTS_PROVIDER=notion`, use `docs/notion-workflow.md` and the separately
authenticated official Notion MCP server for document storage. This overrides
local-vault storage instructions in document skills. The OpenPM hub is canonical;
preserve evidence and versioning rules, use page URLs, and verify saved content.
Guides and local extraction do not themselves publish pages. Keep drafts when
Notion is unavailable and report publication pending.

Notion is the default document provider when `DOCUMENTS_PROVIDER` is unset or
blank. Set `DOCUMENTS_PROVIDER=obsidian` only to opt into local Obsidian storage.

Use the configured provider and root page automatically. With
`DOCUMENTS_PROVIDER=notion` and `NOTION_ROOT_PAGE_URL` set, fetch that exact page
and use it without asking the user to select storage again. Explicit user
destination requests override configuration. If the configured destination is
inaccessible, report the access problem instead of silently changing providers.

## Using the repository from Codex

- Prefer the project-local Codex skills in `.codex/skills/` for repeatable workflows when they are available.
- Run the CLI from the repository with `npx openpm-tools <command> ...` or `npm run cli -- <command> ...`.
- Use `npm run mcp` when connecting Codex to the repository's stdio MCP server.
- Load credentials from `.env`; never print, commit, or copy secret values into tickets, reports, prompts, or documentation.
- Treat generated PRDs, release notes, and reports as user-owned artifacts: inspect paths before writing and preserve existing content unless the workflow explicitly updates it.
- Keep PRDD guidance consistent across `.codex/skills/`, `.claude/skills/`, `.opencode/command/`, CLI/MCP guides, and `opencode.json`. The Hermes skill at `.hermes/skills/openpm-tools/SKILL.md` routes to the canonical `.codex/skills/` files; update its routing table when adding or removing workflows. Product and technical documentation remain agent workflows without dedicated CLI/MCP writers.
- Stage repository files explicitly; keep local vault exports and authentication QR images out of commits.
- Run `npm test` after code changes. Keep documentation-only changes free of unrelated source edits.

See `README.md` for command arguments and Codex setup.

## Using the repository from Hermes

Follow `.hermes/skills/openpm-tools/SKILL.md` and `docs/hermes-agent.md`. Generate
MCP configuration with `node scripts/hermes-config.mjs`; do not overwrite a user's
Hermes profile or copy `.env` credentials into it. Notion requires separate Hermes
authorization. Verify the generated launcher with `node scripts/smoke-mcp.mjs --hermes`.
