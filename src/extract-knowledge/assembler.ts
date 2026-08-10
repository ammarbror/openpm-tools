export interface KnowledgeAssemblyOptions {
  title: string;
  content: string;
  source: string;
  type: string;
  date?: string;
}

export function assembleKnowledgeMarkdown(options: KnowledgeAssemblyOptions): string {
  const { title, content, source, type, date } = options;
  const isoDate = date || new Date().toISOString().split('T')[0];

  const escapeYaml = (val: string): string => {
    if (val.includes('\n') || val.includes(':') || val.includes('"') || val.includes("'") || val.includes('#')) {
      return JSON.stringify(val);
    }
    return val;
  };

  const frontmatter = [
    '---',
    `title: ${escapeYaml(title)}`,
    `source: ${escapeYaml(source)}`,
    `type: ${escapeYaml(type)}`,
    `date: ${escapeYaml(isoDate)}`,
    '---',
  ].join('\n');

  return `${frontmatter}\n\n${content}`;
}

export function sanitizeFilename(title: string): string {
  let stem = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!stem) {
    stem = 'document';
  }

  return stem;
}
