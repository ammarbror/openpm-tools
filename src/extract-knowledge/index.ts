import fs from 'node:fs';
import path from 'node:path';
import { parseDocument } from './parser.js';
import { assembleKnowledgeMarkdown, sanitizeFilename } from './assembler.js';
import { enhanceWithLLM } from './llm.js';
import { resolveVaultPath, ensureDirExist } from './vault.js';

export interface ExtractKnowledgeParams {
  source: string;
  llm?: boolean;
  out?: string;
  vault?: string;
  overwrite?: boolean;
  json?: boolean;
}

export interface SingleFileResult {
  file: string;
  status: 'created' | 'skipped' | 'failed';
  targetPath?: string;
  error?: string;
}

export interface ExtractKnowledgeResult {
  totalFiles: number;
  processedCount: number;
  skippedCount: number;
  failedCount: number;
  results: SingleFileResult[];
}

function resolveFiles(sourcePath: string): string[] {
  const absolutePath = path.resolve(sourcePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Source path does not exist: ${sourcePath}`);
  }

  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) {
    return [absolutePath];
  }

  if (stat.isDirectory()) {
    const files: string[] = [];
    const entries = fs.readdirSync(absolutePath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && !entry.name.startsWith('.')) {
        files.push(path.join(absolutePath, entry.name));
      }
    }
    return files;
  }

  return [];
}

export async function extractKnowledgeWorkflow(
  params: ExtractKnowledgeParams
): Promise<ExtractKnowledgeResult> {
  const files = resolveFiles(params.source);
  const targetDir = params.out
    ? path.resolve(params.out)
    : path.join(resolveVaultPath({ vaultPath: params.vault }), '00 Knowledge');

  ensureDirExist(targetDir);

  const results: SingleFileResult[] = [];
  let processedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const titleWithoutExt = path.parse(filePath).name;
    const sanitizedStem = sanitizeFilename(titleWithoutExt);
    const targetPath = path.join(targetDir, `${sanitizedStem}.knowledge.md`);

    // Skip-on-exists check runs BEFORE reading/parsing/LLM unless overwrite is true
    if (fs.existsSync(targetPath) && !params.overwrite) {
      results.push({
        file: fileName,
        status: 'skipped',
        targetPath,
      });
      skippedCount++;
      continue;
    }

    try {
      const parsed = await parseDocument(filePath);
      let content = parsed.text;

      if (params.llm) {
        content = await enhanceWithLLM(content);
      }

      const assembled = assembleKnowledgeMarkdown({
        title: titleWithoutExt,
        content,
        source: filePath,
        type: parsed.format,
      });

      fs.writeFileSync(targetPath, assembled, 'utf-8');

      results.push({
        file: fileName,
        status: 'created',
        targetPath,
      });
      processedCount++;
    } catch (err: any) {
      results.push({
        file: fileName,
        status: 'failed',
        error: err.message || String(err),
      });
      failedCount++;
    }
  }

  return {
    totalFiles: files.length,
    processedCount,
    skippedCount,
    failedCount,
    results,
  };
}

export async function runFromEnv(params: ExtractKnowledgeParams): Promise<string> {
  const result = await extractKnowledgeWorkflow(params);

  if (params.json) {
    return JSON.stringify(result, null, 2);
  }

  const lines: string[] = [
    `Knowledge Extraction Summary:`,
    `Total Files: ${result.totalFiles}`,
    `Processed: ${result.processedCount}`,
    `Skipped: ${result.skippedCount}`,
    `Failed: ${result.failedCount}`,
    ``,
    `Details:`,
  ];

  for (const res of result.results) {
    if (res.status === 'created') {
      lines.push(`  [CREATED] ${res.file} -> ${res.targetPath}`);
    } else if (res.status === 'skipped') {
      lines.push(`  [SKIPPED] ${res.file} (exists: ${res.targetPath})`);
    } else {
      lines.push(`  [FAILED]  ${res.file} (error: ${res.error})`);
    }
  }

  return lines.join('\n');
}
