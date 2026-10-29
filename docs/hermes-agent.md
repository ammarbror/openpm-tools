# Hermes Agent setup

This checkout provides a native `/openpm-tools` skill that routes to the 13 shared
workflows, plus a configuration generator for its nine MCP tools. The skill reuses
the canonical instructions under `.codex/skills/`, including the writing and
diagram guides; there is no second copy to synchronize.

## Connect this checkout

Install Hermes separately, install this repository's npm dependencies, and configure
the required Jira/Bitbucket values in this checkout's `.env`. Keep secrets there;
the generator never reads or exports them.

From the repository directory, run:

```bash
npm install
node scripts/hermes-config.mjs --with-notion
```

The command prints YAML with absolute paths to the current Node executable and
`scripts/start-mcp.mjs`. Merge the entries into the existing `mcp_servers` mapping
in the active Hermes profile's `config.yaml` (default: `~/.hermes/config.yaml`).
Preserve existing model, tool, and server settings. Do not redirect the output over
the whole profile file. Omit `--with-notion` if Notion is already configured or
Obsidian is explicitly selected. `--json` prints the same configuration as JSON.

The resulting shape is:

```yaml
mcp_servers:
  openpm-tools:
    command: "/absolute/path/to/node"
    args: ["/absolute/path/to/openpm-tools/scripts/start-mcp.mjs"]
  notion:
    url: "https://mcp.notion.com/mcp"
    auth: oauth
```

For Notion, complete OAuth in the same Hermes profile:

```bash
hermes mcp login notion
```

Notion authorization in Codex does not carry over to Hermes. Document storage still
uses `DOCUMENTS_PROVIDER` and `NOTION_ROOT_PAGE_URL` from this checkout's `.env`.
Without a working connection, keep the local draft and report publication pending.

Hermes uses `mcp_servers` in `config.yaml`, rather than the Claude-style
`mcpServers` example previously shown in this repo. See the official
[Hermes MCP guide](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp)
and [Notion connection guide](https://developers.notion.com/guides/mcp/get-started-with-mcp).

## Enable the project skill

From this checkout:

```bash
hermes skills trust
hermes chat
```

This is Hermes's project-skill trust step. Inspect the repo before trusting it.
The native skill lives at `.hermes/skills/openpm-tools/SKILL.md`. Older Hermes
versions without project-local skill support need an update before using this
setup. See the official [Hermes skills guide](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills).

Example requests inside Hermes:

```text
/openpm-tools create-prdd Customer Registration
/openpm-tools technical-docs Document the redemption integration from its source code
/openpm-tools product-technical-specification Combine the existing PRDD and technical design
/openpm-tools review-pr https://bitbucket.org/<workspace>/<repo>/pull-requests/<id>
```

The bridge also routes create/edit tickets, daily standups, sprint reports,
release notes, brainstorming, knowledge extraction, PRDD edits, and product hubs.
Document-only workflows remain agent-authored; they are not new CLI commands.
For CLI fallback, run `npm run cli -- <command> ...` from the repository directory.

## Verify and refresh

```bash
node scripts/smoke-mcp.mjs --hermes
```

This checks the generated stdio configuration from another directory: server
startup, nine-tool discovery, PRDD guidance, and local document extraction. It does
not launch Hermes, authenticate Notion, or perform live Jira/Bitbucket writes.

In Hermes, confirm `/openpm-tools` is available and ask it to list the connected
OpenPM tools and return a PRDD guide before using a write workflow. A generated
guide is not a saved document. Verify the first requested publication by read-back.

After MCP configuration or server-code changes, use `/reload-mcp` in Hermes or
start a new session. Use `/reload-skills` if the project slash command has not
appeared. Regenerate the fragment when moving the checkout or changing the Node
installation, since its paths are absolute.
