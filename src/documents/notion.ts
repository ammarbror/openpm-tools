export function usesNotion(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.DOCUMENTS_PROVIDER?.trim().toLowerCase() === 'notion';
}

export function notionPrddGuide(productName: string, mode: 'create' | 'edit' = 'create') {
  return {
    command: `${mode}-prdd`,
    provider: 'notion',
    productName,
    title: `PRDD - ${productName} (EN)`,
    rootPage: process.env.NOTION_ROOT_PAGE_URL?.trim() || 'OpenPM hub (resolve through Notion MCP)',
    guideOnly: true,
    sections: [
      '1. Overview & Problem Statement',
      '2. Goals & Success Metrics plus Non-Goals',
      '3. User Stories / Use Cases',
      '4. Functional Requirements (MoSCoW scope; release priority P0/P1/P2)',
      '5. System Architecture',
      '6. Database Schema / ERD',
      '7. API Contract',
      '8. Non-Functional Requirements',
      '9. Dependencies & Risks',
    ],
    instructions: [
      'Use the separately connected official Notion MCP server. This tool returns guidance and does not publish a page.',
      'Read docs/notion-workflow.md and inspect source evidence. Ask only for materially missing decisions.',
      'Use Notion by default when DOCUMENTS_PROVIDER=notion; do not ask the user to choose a destination again. If NOTION_ROOT_PAGE_URL is configured, fetch that exact page and use it without searching for alternative hubs. Only search for OpenPM when no root URL is configured; ask which hub only if that search is ambiguous. A destination explicitly requested by the user overrides configuration. If the configured page is inaccessible, report the connection or permission problem rather than silently switching destinations.',
      mode === 'create'
        ? 'Search the hub for the exact title before creation. Preserve any existing page and use the edit workflow instead of duplicating it.'
        : 'Locate and read the complete existing page before editing. If it is missing, report that rather than creating a replacement.',
      'Keep the nine English sections, exact technical identifiers, metadata and version history. Label unsupported claims TBD or Unverified.',
      'Use Notion page links instead of filesystem paths or Obsidian wikilinks. Preserve unrelated content and read back the saved page before reporting its URL.',
      'If Notion is disconnected or a write fails, preserve the draft and report publication pending. Never describe a local file as published.',
    ].join(' '),
  };
}
