# openpm-tools

AI Product Manager (PM) toolkit for Jira & Bitbucket: create Jira tickets, generate bilingual PRDDs in Obsidian, generate sprint reports, manage release notes, update tickets, and run automated PR reviews — natively integrated with **OpenCode**, **Claude Code**, **Hermes-Agent**, **OpenClaw**, and **Antigravity** (via MCP Server & CLI).

---

## Features

- **`/review-pr` / `fetch_pr_review` & `post_pr_review`** — Fetches PR diffs from Bitbucket, generates structured review prompts, posts inline + summary findings to Bitbucket, and cross-references linked Jira issues.
- **`/create-ticket` / `create_ticket`** — Creates a Jira ticket assigned to the active sprint with auto-structured templates (Task, Bug, Story, Epic, Story Points, Assignee).
- **`/create-prdd` / `create_prdd`** — Conducts a 9-section interview to generate a bilingual Product Requirements & Design Document (Bahasa Indonesia `PRDD - <Name> (ID).md` + English `PRDD - <Name> (EN).md`) in your Obsidian vault.
- **`/edit-ticket` / `edit_ticket`** — Updates summary, description, or assignee on existing Jira tickets.
- **`/release-workflow` / `release_workflow`** — Creates Jira release versions for Ready for Release tickets and generates markdown release notes.
- **`/sprint-report` / `sprint_report`** — Generates complete sprint health reports with burndown metrics, assignee distribution, and HTML export.

---

## Getting Started

### Prerequisites

- Node.js 20+
- Atlassian credentials (for Jira/Bitbucket features):
  - **Bitbucket API token** ([App Passwords](https://bitbucket.org/account/settings/app-passwords/))
  - **Jira API token** ([API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens))
  - Jira URL & Project Key
- Obsidian Vault (for `/create-prdd`)

### Setup

```bash
# 1. Clone repo
git clone https://github.com/ammarbror/openpm-tools.git
cd openpm-tools

# 2. Install dependencies
npm install

# 3. Configure credentials
cp .env.example .env
# Fill in BITBUCKET_EMAIL, BITBUCKET_API_TOKEN, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_URL, JIRA_PROJECT_KEY
```

---

## Multi-Agent Integration Guide

### 1. OpenCode
Pre-configured via `opencode.json` and `.opencode/command/`. Just clone into your workspace directory.
Commands automatically registered:
- `/review-pr <bitbucket-pr-url>`
- `/create-ticket <summary>`
- `/create-prdd <product-name>`
- `/edit-ticket <issueKey>`
- `/sprint-report`
- `/release-workflow`

### 2. Claude Code
Supports both **MCP Server** and **Native Skills**.

#### Option A: MCP Server (Recommended)
Add to your `~/.claude.json` or project `.mcp.json`:

```json
{
  "mcpServers": {
    "openpm-tools": {
      "command": "npx",
      "args": ["tsx", "/path/to/openpm-tools/src/mcp/index.ts"],
      "env": {
        "BITBUCKET_EMAIL": "your-email@example.com",
        "BITBUCKET_API_TOKEN": "your-token",
        "JIRA_EMAIL": "your-email@example.com",
        "JIRA_API_TOKEN": "your-jira-token",
        "JIRA_URL": "https://your-domain.atlassian.net",
        "JIRA_PROJECT_KEY": "PROJ"
      }
    }
  }
}
```

#### Option B: Native Skills
This repo contains pre-packaged skills in `.claude/skills/`:
- `.claude/skills/create-ticket`
- `.claude/skills/create-prdd`
- `.claude/skills/edit-ticket`
- `.claude/skills/release-workflow`
- `.claude/skills/sprint-report`
- `.claude/skills/review-pr`

### 3. Hermes-Agent
Hermes-Agent can use `openpm-tools` via MCP or CLI tool calls.

**Via MCP (`~/.hermes/mcp.json` or agent config):**
```json
{
  "mcpServers": {
    "openpm-tools": {
      "command": "npx",
      "args": ["tsx", "/path/to/openpm-tools/src/mcp/index.ts"]
    }
  }
}
```

**Via CLI:**
Instruct Hermes to run `npx openpm-tools <command> [options]`.

### 4. OpenClaw
Add `openpm-tools` to your OpenClaw tool definition using stdio MCP:

```json
{
  "tools": [
    {
      "type": "mcp",
      "name": "openpm-tools",
      "command": "npx",
      "args": ["tsx", "/path/to/openpm-tools/src/mcp/index.ts"]
    }
  ]
}
```

### 5. Antigravity
Add to your Antigravity MCP configuration:

```json
{
  "mcpServers": {
    "openpm-tools": {
      "command": "npx",
      "args": ["tsx", "/path/to/openpm-tools/src/mcp/index.ts"]
    }
  }
}
```

---

## Standalone CLI Usage

You can also run any command directly from terminal:

```bash
# Create Jira ticket
npx openpm-tools create-ticket "Fix payment gateway timeout" --type bug --sprint "Sprint 12" --story-points 3

# View PRDD creation guide
npx openpm-tools create-prdd "MyApp"

# Edit ticket
npx openpm-tools edit-ticket KAIRA-123 --summary "Updated summary" --assignee "Ammar"

# Run release workflow
npx openpm-tools release-workflow --version-name "v1.5.0"

# Generate sprint report
npx openpm-tools sprint-report --export-html

# Fetch PR diff for LLM review
npx openpm-tools fetch-pr-review "https://bitbucket.org/myworkspace/myrepo/pull-requests/42" --json

# Post PR review findings
npx openpm-tools post-pr-review "https://bitbucket.org/myworkspace/myrepo/pull-requests/42" findings.json
```

---

## Architecture

```
openpm-tools/
├── bin/
│   └── openpm-tools.ts      # Unified CLI runner (Node/npm bin)
├── src/
│   ├── mcp/
│   │   └── index.ts         # Stdio MCP Server (Claude Code, Antigravity, OpenClaw, Hermes)
│   ├── create-ticket/
│   ├── edit-ticket/
│   ├── release-workflow/
│   ├── sprint-report/
│   └── review-pr/
├── .claude/skills/          # Claude Code skill manifests
├── .opencode/command/       # OpenCode command definitions (create-prdd.md)
└── opencode.json            # OpenCode command registrations
```

---

## Development & Testing

```bash
# Run unit tests
npm test

# Run MCP server locally
npm run mcp

# Run CLI locally
npm run cli -- --help
```

---

## License

MIT
