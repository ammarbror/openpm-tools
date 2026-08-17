# openpm-tools

AI Product Manager (PM) toolkit for Jira & Bitbucket: create Jira tickets, generate bilingual PRDDs in Obsidian, generate sprint reports, manage release notes, update tickets, and run automated PR reviews — natively integrated with **Codex**, **OpenCode**, **Claude Code**, **Hermes-Agent**, **OpenClaw**, and **Antigravity** (via MCP Server & CLI).

---

## Features

- **`/review-pr` / `fetch_pr_review` & `post_pr_review`** — Fetches PR diffs from Bitbucket, generates structured review prompts, performs PR hygiene alerts (missing description / linked Jira tickets), posts inline + summary findings to Bitbucket, and cross-references linked Jira issues with actionable next steps.
- **`/daily-standup` / `daily_standup`** — Generates real-time Daily Standup Reports in Markdown format from Jira activities (Yesterday's Progress, Today's Focus, Risks & Blockers).
- **`/create-ticket` / `create_ticket`** — Creates a Jira ticket assigned to the active sprint with auto-structured templates (Task, Bug, Story, Epic, Story Points, Assignee).
- **`/create-prdd` / `create_prdd`** — Conducts a 9-section interview to generate a bilingual Product Requirements & Design Document (Bahasa Indonesia `PRDD - <Name> (ID).md` + English `PRDD - <Name> (EN).md`) in your Obsidian vault.
- **`/edit-prdd` / `edit_prdd`** — Updates/edits an existing bilingual Product Requirements & Design Document (PRDD) in your Obsidian vault, keeping the Bahasa Indonesia and English versions in sync.
- **`/edit-ticket` / `edit_ticket`** — Updates summary, description, or assignee on existing Jira tickets.
- **`/release-workflow` / `release_workflow`** — Creates Jira release versions for Ready for Release tickets and generates markdown release notes.
- **`/sprint-report` / `sprint_report`** — Generates complete sprint health reports with burndown metrics, assignee distribution, and HTML export.
- **`/extract-knowledge` / `extract_knowledge`** — Converts document files (`.md`, `.pdf`, `.docx`, `.pptx`, `.xlsx`, `.odt`, `.csv`, etc.) into structured, AI-friendly knowledge Markdown files in an Obsidian vault (`<VAULT>/00 Knowledge/`), optionally enhanced by an LLM.

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
# Fill in BITBUCKET_API_TOKEN, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_URL, JIRA_PROJECT_KEY, OBSIDIAN_VAULT_PATH
# (BITBUCKET_EMAIL is optional when using Bitbucket API Tokens with Bearer auth)
```

---

## Multi-Agent Integration Guide

### 1. Codex

Codex can use this repository in two ways:

- **Project guidance and skills:** keep the repository open as a Codex workspace. `AGENTS.md` documents the shared conventions, and `.codex/skills/` contains reusable workflow instructions when installed in the checkout.
- **CLI and MCP:** run commands directly from the repository, or connect the stdio MCP server:

```bash
# Direct CLI
npx openpm-tools create-ticket "Fix payment gateway timeout" --type bug

# Local development commands
npm run cli -- sprint-report --export-html
npm run mcp
```

For a Codex skill that is not present in an older checkout, use the equivalent CLI command documented below. The CLI and MCP server share the same `.env` configuration.

### 2. OpenCode
Pre-configured via `opencode.json` and `.opencode/command/`. Just clone into your workspace directory.
Commands automatically registered:
- `/review-pr <bitbucket-pr-url>`
- `/daily-standup [assigneeName]`
- `/create-ticket <summary>`
- `/create-prdd <product-name>`
- `/edit-prdd <product-name>`
- `/edit-ticket <issueKey>`
- `/sprint-report`
- `/release-workflow`
- `/extract-knowledge <file-or-folder>`

### 3. Claude Code
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
- `.claude/skills/edit-prdd`
- `.claude/skills/edit-ticket`
- `.claude/skills/release-workflow`
- `.claude/skills/sprint-report`
- `.claude/skills/review-pr`
- `.claude/skills/extract-knowledge`

### 4. Hermes-Agent
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

### 5. OpenClaw
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

### 6. Antigravity
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

## Recommended Deployment Pattern: Combined / Hybrid Agent Architecture

For production setups, a **Combined (Hybrid)** architecture is recommended:

```
                          ┌───────────────────────────┐
                          │   Shared openpm-tools     │
                          │   (MCP Server & CLI)      │
                          └─────────────┬─────────────┘
                                        │
           ┌────────────────────────────┴────────────────────────────┐
           ▼                                                         ▼
┌──────────────────────────────┐                         ┌──────────────────────────────┐
│       Interactive Dev        │                         │    Background Automation     │
│ (Codex / OpenCode / Claude)  │                         │  (Hermes-Agent / OpenClaw)   │
├──────────────────────────────┤                         ├──────────────────────────────┤
│ - Direct CLI & slash cmds    │                         │ - Telegram / Slack / Webhook │
│ - Interactive 9-step PRDD    │                         │ - Automated sprint triggers  │
│ - Local terminal workflows   │                         │ - PR review on git push/hook │
└──────────────────────────────┘                         └──────────────────────────────┘
```

- **Codex / OpenCode / Claude Code (Interactive)**: Use for interactive development, running workflow skills or slash commands (`/create-prdd`, `/review-pr`), and pair-programming in a local terminal/IDE.
- **Hermes-Agent / OpenClaw (Autonomous / Background)**: Connect via `openpm-tools` MCP server or CLI to handle background triggers (e.g. automatically creating Jira tickets from Slack messages, sending automated sprint reports to Telegram, or auditing PRs on webhooks).

Both agent tiers share the same `.env` credentials and `openpm-tools` core engine.

---

## Standalone CLI Usage

You can also run any command directly from terminal:

```bash
# Create Jira ticket
npx openpm-tools create-ticket "Fix payment gateway timeout" --type bug --sprint "Sprint 12" --story-points 3

# View PRDD creation guide
npx openpm-tools create-prdd "MyApp"

# View PRDD editing guide
npx openpm-tools edit-prdd "MyApp"

# Generate daily standup report
npx openpm-tools daily-standup "Dian Aditya"

# Edit ticket
npx openpm-tools edit-ticket KAIRA-123 --summary "Updated summary" --assignee "Ammar"

# Run release workflow
npx openpm-tools release-workflow --version-name "v1.5.0"

# Extract knowledge from a file or folder into Obsidian vault
npx openpm-tools extract-knowledge ./document.docx --llm --overwrite

# Generate sprint report
npx openpm-tools sprint-report --export-html

# Fetch PR diff for LLM review
npx openpm-tools fetch-pr-review "https://bitbucket.org/myworkspace/myrepo/pull-requests/42" --json

# Post PR review findings
npx openpm-tools post-pr-review "https://bitbucket.org/myworkspace/myrepo/pull-requests/42" findings.json
```

---

### `daily-standup` Command & Skill

Generate a real-time Daily Standup Report in Markdown format from recent Jira activities. Grouped into **Yesterday's Progress**, **Today's Focus**, and **Risks & Blockers**.

**CLI Usage:**
```bash
npx openpm-tools daily-standup [assigneeName] [--json]
```

**Parameters / Flags:**
- `assigneeName`: Optional string filter for a specific team member.
- `--json`: Output result as a structured JSON object.

**Codex / OpenCode / Claude Code:**
- `/daily-standup [assigneeName]`

---

### `edit-prdd` Command & Skill

Edit and synchronize existing bilingual Product Requirements & Design Document (PRDD) files in your Obsidian vault (`<VAULT>/01 Projects/PRDs/<Project>/`).

**CLI Usage:**
```bash
npx openpm-tools edit-prdd [product-name] [--json]
```

**Parameters / Flags:**
- `product-name`: Name of the product PRDD to locate and edit (e.g., `"MyApp"`).
- `--json`: Output result as a structured JSON guide.

**Codex / OpenCode / Claude Code:**
- `/edit-prdd [product-name]`

---

### `create-prdd` Command & Skill

Conduct a 9-section interview or parse attached documents to generate a bilingual PRDD (`PRDD - <Name> (ID).md` and `PRDD - <Name> (EN).md`) under `<VAULT>/01 Projects/PRDs/<Project>/` and update the `Daftar PRDD.md` index.

**CLI Usage:**
```bash
npx openpm-tools create-prdd [product-name] [--json]
```

**Codex / OpenCode / Claude Code:**
- `/create-prdd [product-name]`

---

### `extract-knowledge` Command & MCP Tool

Extract structured Markdown knowledge files from office documents, PDFs, CSVs, and Markdown files into `<VAULT>/00 Knowledge/`.

**CLI Usage:**
```bash
npx openpm-tools extract-knowledge <file-or-folder> [options]
```

**Parameters / Flags:**
- `<file-or-folder>`: Path to target file or directory containing files.
- `--llm`: Optional flag to enable LLM enhancement via OpenAI-compatible endpoint.
- `--vault <path>`: Explicit path to Obsidian vault.
- `--out <dir>`: Explicit output directory override.
- `--overwrite`: Overwrite existing knowledge file if present.
- `--json`: Output result as structured JSON array.

**MCP Tool:**
- `extract_knowledge`: Accepts `source` (required string path), `llm` (optional boolean), `vault` (optional string), `out` (optional string), `overwrite` (optional boolean).

**OpenCode Command:**
- `/extract-knowledge <file-or-folder>`

---

## Architecture

```
openpm-tools/
├── bin/
│   └── openpm-tools.ts      # Unified CLI runner (Node/npm bin)
├── src/
│   ├── mcp/
│   │   └── index.ts         # Stdio MCP Server (Codex, Claude Code, Antigravity, OpenClaw, Hermes)
│   ├── create-ticket/
│   ├── edit-ticket/
│   ├── release-workflow/
│   ├── sprint-report/
│   └── review-pr/
├── .claude/skills/          # Claude Code skill manifests
├── .codex/skills/            # Codex project skill manifests
├── AGENTS.md                 # Codex/repository working guidance
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
