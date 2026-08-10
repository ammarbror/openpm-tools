import fs from 'node:fs';
import path from 'node:path';
import { OfficeConverter } from 'officeparser';

export class UnsupportedFormatError extends Error {
  constructor(ext: string, modernExt?: string) {
    const msg = modernExt
      ? `.${ext} format is not supported. Please convert to .${modernExt}`
      : `.${ext} format is not supported.`;
    super(msg);
    this.name = 'UnsupportedFormatError';
  }
}

const LEGACY_MAP: Record<string, string> = {
  doc: 'docx',
  ppt: 'pptx',
  xls: 'xlsx',
};

const SUPPORTED_OFFICE_EXTS = new Set([
  'docx',
  'pptx',
  'xlsx',
  'pdf',
  'odt',
  'odp',
  'ods',
  'rtf',
  'csv',
  'html',
  'epub',
]);

function stripFrontmatter(text: string): string {
  const match = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (match) {
    return text.slice(match[0].length);
  }
  return text;
}

export async function parseDocument(filePath: string): Promise<{ text: string; format: string }> {
  const rawExt = path.extname(filePath).replace(/^\./, '');
  const ext = rawExt.toLowerCase();

  if (!ext) {
    throw new UnsupportedFormatError('unknown');
  }

  if (LEGACY_MAP[ext]) {
    throw new UnsupportedFormatError(ext, LEGACY_MAP[ext]);
  }

  if (ext === 'md') {
    const rawText = await fs.promises.readFile(filePath, 'utf-8');
    const cleanedText = stripFrontmatter(rawText);
    return { text: cleanedText, format: 'md' };
  }

  if (SUPPORTED_OFFICE_EXTS.has(ext)) {
    const res = await OfficeConverter.convert(filePath, 'md', { parseConfig: { ocr: false } });
    const text = typeof res === 'string' ? res : (res as any)?.value ?? String(res);
    return { text, format: ext };
  }

  throw new UnsupportedFormatError(ext);
}
