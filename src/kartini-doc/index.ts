import fs from 'node:fs';
import path from 'node:path';
import { getKartiniOsToken, reloadKartiniOsChromeTab } from './auth.ts';
import { parseMarkdownToKartiniDocument, ParsedDocument } from './converter.ts';
import { KartiniOsClient, KartiniDocRecord } from './client.ts';

export interface PublishKartiniDocOptions {
  filePath?: string;
  markdownContent?: string;
  title?: string;
  summary?: string;
  category?: 'project' | 'system' | 'guideline' | 'other';
  docNumber?: string;
  updateExisting?: boolean;
}

export interface PublishKartiniDocResult {
  docNumber: string;
  documentId: string;
  versionId: string;
  title: string;
  category: string;
  status: string;
  sectionCount: number;
  url: string;
}

export async function publishKartiniDocWorkflow(
  options: PublishKartiniDocOptions
): Promise<PublishKartiniDocResult> {
  let content = options.markdownContent || '';
  if (!content && options.filePath) {
    const absPath = path.resolve(process.cwd(), options.filePath);
    if (!fs.existsSync(absPath)) {
      throw new Error(`File not found: ${absPath}`);
    }
    content = fs.readFileSync(absPath, 'utf-8');
  }

  if (!content.trim()) {
    throw new Error('No markdown content or file path provided to publishKartiniDocWorkflow.');
  }

  const parsed: ParsedDocument = parseMarkdownToKartiniDocument(content, {
    defaultTitle: options.title,
    defaultSummary: options.summary,
    defaultCategory: options.category,
  });

  const token = getKartiniOsToken();
  const client = new KartiniOsClient(token);

  let docRecord: KartiniDocRecord | null = null;
  let versionId: string = '';

  // Check if target document exists
  const searchQuery = options.docNumber || options.title || parsed.title;
  docRecord = await client.findDocument(searchQuery);

  if (docRecord && (options.updateExisting || options.docNumber)) {
    // Update existing
    versionId = docRecord.current_version_id;
    await client.updateDocument(docRecord.id, versionId, {
      title: options.title || parsed.title,
      summary: options.summary || parsed.summary,
      category: options.category || parsed.category,
      sections: parsed.sections,
    });
  } else if (docRecord) {
    // Already exists but updateExisting not explicitly set
    // Update the version sections
    versionId = docRecord.current_version_id;
    await client.updateDocument(docRecord.id, versionId, {
      sections: parsed.sections,
    });
  } else {
    // Create new
    const created = await client.createDocument(parsed);
    docRecord = created.document;
    versionId = created.versionId;
  }

  // Refresh Chrome tab if active
  reloadKartiniOsChromeTab();

  return {
    docNumber: docRecord.doc_number,
    documentId: docRecord.id,
    versionId,
    title: docRecord.title,
    category: docRecord.category,
    status: docRecord.status,
    sectionCount: parsed.sections.length,
    url: 'https://kartini-os.com/product-documentation',
  };
}
