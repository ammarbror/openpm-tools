import crypto from 'node:crypto';

export interface KartiniSection {
  id: string;
  title: string;
  body: string;
  mermaid?: string;
  sort_order: number;
}

export interface ParsedDocument {
  title: string;
  summary: string;
  category: 'project' | 'system' | 'guideline' | 'other';
  sections: KartiniSection[];
}

export function inlineMarkdownToHtml(text: string): string {
  let out = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold & Italic
  out = out.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  out = out.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Inline code
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Links: [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  return out;
}

export function markdownToKartiniHtml(md: string): { html: string; mermaid?: string } {
  const lines = md.split('\n');
  const out: string[] = [];
  let mermaidCode: string | undefined = undefined;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Mermaid code block
    if (line.trim().startsWith('```mermaid')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      mermaidCode = codeLines.join('\n');
      continue;
    }

    // Fenced Code block
    if (line.trim().startsWith('```')) {
      const langMatch = line.trim().match(/^```([a-z0-9+#.-]*)/i);
      const lang = langMatch?.[1] || 'plaintext';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```

      const spans = codeLines
        .map((cl) => {
          const escaped = cl
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          return `<span class="code-line">${escaped || '&#8203;'}</span>`;
        })
        .join('');

      out.push(`<pre data-language="${lang}"><code>${spans}</code></pre>`);
      continue;
    }

    // Markdown Table
    if (line.trim().startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }

      if (tableLines.length >= 2) {
        const parseRow = (r: string) => {
          const cells = r.trim().split('|');
          if (cells[0] === '') cells.shift();
          if (cells[cells.length - 1] === '') cells.pop();
          return cells.map((c) => c.trim());
        };

        const headerCells = parseRow(tableLines[0]);
        // line 1 is separator | :--- | :--- |
        const bodyRows = tableLines.slice(2).map(parseRow);

        let tableHtml = '<table class="doc-table">\n<thead>\n<tr>\n';
        for (const h of headerCells) {
          tableHtml += `<th>${inlineMarkdownToHtml(h)}</th>\n`;
        }
        tableHtml += '</tr>\n</thead>\n<tbody>\n';
        for (const row of bodyRows) {
          tableHtml += '<tr>\n';
          for (let c = 0; c < headerCells.length; c++) {
            const cellVal = row[c] ?? '';
            const processedCell = cellVal.replace(/<br\s*\/?>/gi, '<br/>');
            tableHtml += `<td>${inlineMarkdownToHtml(processedCell)}</td>\n`;
          }
          tableHtml += '</tr>\n';
        }
        tableHtml += '</tbody>\n</table>';
        out.push(tableHtml);
      }
      continue;
    }

    // Sub-heading (###, ####, etc.)
    if (line.startsWith('###')) {
      const headingText = line.replace(/^#+\s*/, '').trim();
      out.push(`<h3>${inlineMarkdownToHtml(headingText)}</h3>`);
      i++;
      continue;
    }

    // Unordered List
    if (/^\s*[-*]\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*[-*]\s+/, '').trim();
        listItems.push(`<li>${inlineMarkdownToHtml(itemText)}</li>`);
        i++;
      }
      out.push(`<ul>\n${listItems.join('\n')}\n</ul>`);
      continue;
    }

    // Ordered List
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*\d+\.\s+/, '').trim();
        listItems.push(`<li>${inlineMarkdownToHtml(itemText)}</li>`);
        i++;
      }
      out.push(`<ol>\n${listItems.join('\n')}\n</ol>`);
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      const bqLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        bqLines.push(lines[i].replace(/^>\s*/, ''));
        i++;
      }
      out.push(`<blockquote>${inlineMarkdownToHtml(bqLines.join(' '))}</blockquote>`);
      continue;
    }

    // Divider
    if (line.trim() === '---') {
      out.push('<hr class="doc-break" />');
      i++;
      continue;
    }

    // Paragraph
    const pLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('|') &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith('---') &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      pLines.push(lines[i]);
      i++;
    }
    if (pLines.length > 0) {
      out.push(`<p>${inlineMarkdownToHtml(pLines.join(' '))}</p>`);
    }
  }

  return { html: out.join('\n'), mermaid: mermaidCode };
}

export function parseMarkdownToKartiniDocument(content: string, options?: {
  defaultTitle?: string;
  defaultSummary?: string;
  defaultCategory?: 'project' | 'system' | 'guideline' | 'other';
}): ParsedDocument {
  // Extract top heading if exists
  const titleMatch = content.match(/^#\s+(.+)$/m);
  let title = options?.defaultTitle || (titleMatch ? titleMatch[1].trim() : 'Untitled Product Document');

  // Strip prefix like "Product & Technical Specification: "
  title = title.replace(/^Product\s*(&|and)?\s*Technical\s*Specification:\s*/i, '').trim();

  // Try extracting summary from TL;DR, Executive Summary, Overview, or Problem Statement
  let summary = options?.defaultSummary || '';
  if (!summary) {
    const summaryMatch = content.match(/(?:TL;DR|TL:DR|Executive Summary|Overview|Problem Statement)\s*\n+([^\n#]+)/i);
    if (summaryMatch) {
      summary = summaryMatch[1].replace(/^[-*]\s+/, '').trim().slice(0, 300);
    } else {
      summary = `Product documentation for ${title}`;
    }
  }

  const category = options?.defaultCategory || 'project';

  // Split into sections by ##
  const rawSections = content.split(/^##\s+/m);
  const sectionsToProcess = rawSections.slice(1);

  const sections: KartiniSection[] = [];

  for (let idx = 0; idx < sectionsToProcess.length; idx++) {
    const sec = sectionsToProcess[idx];
    const firstNewline = sec.indexOf('\n');
    let secTitle = sec.slice(0, firstNewline).trim();
    // Strip numeric prefixes like "1. ", "12. " because Kartini OS automatically renders section numbers (1..N)
    secTitle = secTitle.replace(/^\d+\.\s*/, '').trim();

    const bodyMd = sec.slice(firstNewline + 1).trim();
    const { html, mermaid } = markdownToKartiniHtml(bodyMd);

    const sectionObj: KartiniSection = {
      id: crypto.randomUUID(),
      title: secTitle,
      body: html,
      sort_order: idx,
    };

    if (mermaid) {
      sectionObj.mermaid = mermaid;
    }

    sections.push(sectionObj);
  }

  return {
    title,
    summary,
    category,
    sections,
  };
}
