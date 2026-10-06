# Notion document workflow

When `DOCUMENTS_PROVIDER=notion`, Notion is the authoritative document workspace.
Use the official Notion MCP connection alongside openpm-tools. Notion authorization
is separate from Jira and Bitbucket credentials; no Notion token belongs in `.env`.
The CLI and `create_prdd` return guides. An agent uses Notion tools to save documents.

## OpenPM hub

Use Notion automatically when selected in `.env`; do not ask the user to choose
the document destination again. Fetch and use `NOTION_ROOT_PAGE_URL` when configured.
An explicit destination in the user's request overrides this default. If the
configured page is inaccessible, report the access problem and preserve the draft;
do not silently switch to local storage or create a replacement hub.
Otherwise search Notion for `OpenPM`
and confirm the exact parent. If several match, ask which one. Create a missing
hub only when the user requests one; search first to avoid a duplicate, then create
it in the authorized workspace. Do not create unrelated pages or import existing
documents without a migration request.

Organize its child pages into Projects, PRDDs, Technical Documentation, Knowledge,
and Handoffs. Create these categories as needed. Product documentation hubs link
canonical documents and Jira/Bitbucket URLs instead of duplicating their content.
Use normal Notion page links; replace local-vault paths and Obsidian wikilinks.

## Create and edit documents

Follow the existing skill's content, evidence, section, and versioning requirements.
Its local-file storage instructions apply only to the Obsidian provider. In Notion:

- Drop the `.md` extension from the page title. Keep English-only document titles.
- Put title, version, status, author, date, language and sources in a metadata table
  or page properties instead of requiring YAML frontmatter.
- Search within the selected hub before creating. Preserve existing documents.
- Read the full current page before editing and preserve unrelated content. If it
  changed since reading, re-read and reconcile before writing.
- Keep document sections and version-history entries. Preserve exact identifiers;
  label unsupported facts `TBD` or `Unverified`.
- Retain Mermaid source and its prose explanation. Verify diagrams using an
  available parser; do not claim Notion renders a diagram unless checked.
- Read back the saved page and return its URL. Never claim successful publication
  based only on a guide, local draft, or unverified tool response.

## Document extraction

Extraction still parses local input files. In Notion mode, without an explicit
`out` or `vault`, it stages Markdown in a unique temporary directory. The agent
reads the created files and publishes their content under Knowledge using Notion
tools. This is not automatic upload. Preserve the staged draft if publishing fails;
report its path and `publication pending`. Check for existing source documents
before uploading. Delete only staging files created by the current operation after
successful read-back, if they are no longer needed. Do not delete user source files.

## Continue on another device

Keep a Handoff page for each active project: current task, decisions, canonical
document URLs, blockers and next actions. Read it before continuing. Connect Notion
on each Codex device. The cloud documents persist across devices; this does not
synchronize local tool installations, credentials, or chat history.
