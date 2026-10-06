# openpm-tools

AI Product Manager (PM) toolkit for Jira & Bitbucket: create Jira tickets, generate English PRDDs in Obsidian, generate sprint reports, manage release notes, update tickets, and run automated PR reviews — natively integrated with **Codex**, **OpenCode**, **Claude Code**, **Hermes-Agent**, **OpenClaw**, and **Antigravity** (via MCP Server & CLI).

---

## Features

- **`/review-pr` / `fetch_pr_review` & `post_pr_review`** — Fetches PR diffs from Bitbucket, generates structured review prompts, performs PR hygiene alerts (missing description / linked Jira tickets), posts inline + summary findings to Bitbucket, and cross-references linked Jira issues with actionable next steps.
- **`/daily-standup` / `daily_standup`** — Generates real-time Daily Standup Reports in Markdown format from Jira activities (Yesterday's Progress, Today's Focus, Risks & Blockers).
- **`/create-ticket` / `create_ticket`** — Creates a Jira ticket assigned to the active sprint with auto-structured templates (Task, Bug, Story, Epic, Story Points, Assignee).
- **`/create-prdd` / `create_prdd`** — Uses source evidence and focused questions to generate an English Product Requirements & Design Document (`PRDD - <Name> (EN).md`) in your Obsidian vault.
- **`/brainstorm`** — Runs a topic-agnostic, one-question-per-turn brainstorming interview and exports one structured Markdown document with explicit success criteria and optional Mermaid diagrams.
- **`/edit-prdd`** — Updates/edits the English Product Requirements & Design Document (PRDD) in your Obsidian vault.
- **`product-documentation`** — Creates and maintains an English product hub linking requirements, technical designs, delivery, operations, and user documentation.
- **`technical-docs`** — Creates and edits English technical documentation with a fixed 10-section system-documentation structure in your Obsidian vault.
- **`/edit-ticket` / `edit_ticket`** — Updates summary, description, or assignee on existing Jira tickets.
- **`/release-workflow` / `release_workflow`** — Creates Jira release versions for Ready for Release tickets and generates markdown release notes.
- **`/sprint-report` / `sprint_report`** — Generates complete sprint health reports with burndown metrics, assignee distribution, and HTML export.
- **`/extract-knowledge` / `extract_knowledge`** — Converts document files (`.md`, `.pdf`, `.docx`, `.pptx`, `.xlsx`, `.odt`, `.csv`, etc.) into structured, AI-friendly knowledge Markdown files in an Obsidian vault (`<VAULT>/00 Knowledge/`), optionally enhanced by an LLM.

---

## Getting Started

### Prerequisites

- Node.js 20.19+ (20.x), 22.13+ (22.x), or 24+; required by the Mermaid renderer's JSDOM dependency.
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

The CLI and MCP server share the same `.env` configuration. PRDD CLI commands and `create_prdd` return guides; the agent reads sources, asks focused questions, and writes the document. `technical-docs` and `product-documentation` are Codex skills only, with no CLI command or MCP tool.

Jira descriptions support Markdown fenced code blocks and Jira wiki `{code:language}` blocks. Creating or editing a description with a `mermaid` block renders an SVG, uploads it as an issue attachment, and adds an inline media reference beside the retained source. Jira credentials need attachment-upload permission, and attachments must be enabled.

Creation stores the source description before rendering. If rendering, upload, or the description update fails, the error identifies the created issue; inspect and edit that issue instead of creating a duplicate. Sprint assignment has not yet run when enrichment fails. On edits, enrichment happens before the fields update, so a failure leaves the existing fields unchanged; uploaded attachments can remain after a later failure. Repeated edits upload new attachments. The server renderer uses approximate label sizes, so complex diagrams may overlap. Inline display in Jira has not been verified against a live instance.

### 2. OpenCode
Pre-configured via `opencode.json` and `.opencode/command/`. Just clone into your workspace directory.
Commands automatically registered:
- `/review-pr <bitbucket-pr-url>`
- `/daily-standup [assigneeName]`
- `/create-ticket <summary>`
- `/create-prdd <product-name>`
- `/brainstorm [topic] [--quick|--deep]`
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
- `.claude/skills/brainstorm`
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
│ - Evidence-led PRDD guides   │                         │ - Automated sprint triggers  │
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

# View the topic-agnostic brainstorming guide (agent generates the Markdown)
npx openpm-tools brainstorm "team onboarding" --json

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

Edit an existing English Product Requirements & Design Document (PRDD) in your Obsidian vault (`<VAULT>/01 Projects/PRDs/<Project>/`).

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

Inspect source evidence and ask focused questions to generate one English nine-section PRDD (`PRDD - <Name> (EN).md`) under `<VAULT>/01 Projects/PRDs/<Project>/` and update the `Daftar PRDD.md` index.

**CLI Usage:**
```bash
npx openpm-tools create-prdd [product-name] [--json]
```

**Codex / OpenCode / Claude Code:**
- `/create-prdd [product-name]`

PRDD requirements keep MoSCoW scope (`Must`, `Should`, `Could`, `Won't`) separate from release priority (`P0`, `P1`, `P2`). Creation preserves an existing file; edits update affected cross-references and version history. Keep exact schema and API identifiers, label unsupported facts `TBD` or `Unverified`, and validate Mermaid diagrams with an available parser or renderer.

### `product-documentation` Skill

Use the Codex skill to create or maintain a product hub linking canonical delivery documents:

- Skill instructions: `.codex/skills/product-documentation/SKILL.md`
- Output folder: `<VAULT>/01 Projects/Product Documentation/`
- Filename: `Product Documentation - <Name>.md`
- Index: `Daftar Product Documentation.md`, with one English wikilink per hub
- Structure: ten sections covering ownership, evidence, outcomes, scope, journeys, delivery, releases, operations, risks, and the documentation map
- Link PRDDs, technical designs, Jira, runbooks, and user guides rather than duplicating them. Preserve actual verification dates for delivery and release snapshots.

### `technical-docs` Skill

Use the Codex skill for system, architecture, or technical design documentation:

- Skill instructions: `.codex/skills/technical-docs/SKILL.md`
- Output folder: `<VAULT>/01 Projects/Technical Documentation/`
- Filename: `Technical Documentation - <Name>.md`
- Required structure: 10 English sections covering architecture, security, data model, stack, and UI navigation
- The skill updates `Daftar Technical Documentation.md`, preserves technical identifiers, validates Mermaid structure, and records version history after edits.

### `brainstorm` Command & Skill

Run `/brainstorm [topic]` in an AI agent for a bounded, topic-agnostic interview. The agent asks one
substantive question per turn and exports exactly one collision-safe Markdown file named
`Brainstorm - <sanitized-topic> - <YYYY-MM-DD>.md` to the selected directory (current working
directory by default). Standard sessions separate divergent idea generation from clustering and
prioritization and include at least eight ideas unless fewer are requested. Missing details are
marked `TBD` or `N/A`. The exported document includes explicit success criteria, and ideas are not
presented as research or professional advice.

Mermaid is optional: it is included only when a simple diagram materially clarifies relationships,
stages, dependencies, or choices, with a prose explanation alongside it. Simple topics remain
diagram-free. The standalone CLI is guide-only and does not conduct the interview or write the file:

```bash
npx openpm-tools brainstorm [topic] [--quick|--deep] [--out <directory>] [--json]
```

The JSON guide reports the command, topic, output convention, session stages, and Mermaid policy.

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
├── .codex/skills/           # Codex skills, including technical-docs and product-documentation
├── AGENTS.md                 # Codex/repository working guidance
├── .opencode/command/       # OpenCode command definitions (brainstorm.md, create-prdd.md)
└── opencode.json            # OpenCode command registrations
```

---

## Development & Testing

Before pushing, synchronize affected agent guides, run `npm test`, and run `git diff --check`. Keep local vault exports, authentication QR images, and `.env` out of commits. The repository currently has no lint or build script.

```bash
# Run unit tests (Jira/Bitbucket calls are mocked)
npm test

# Run MCP server locally
npm run mcp

# Run CLI locally
npm run cli -- --help
```

---

## License

MIT
