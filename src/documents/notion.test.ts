import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { usesNotion, notionPrddGuide } from './notion.ts';
import { extractKnowledgeWorkflow } from '../extract-knowledge/index.ts';

test('Notion selection is explicit and accepts whitespace and casing', () => {
  assert.equal(usesNotion({}), false);
  assert.equal(usesNotion({ DOCUMENTS_PROVIDER: 'obsidian' }), false);
  assert.equal(usesNotion({ DOCUMENTS_PROVIDER: ' NOTION ' }), true);
});

test('Notion PRDD guide requires safe publishing and preserves document sections', () => {
  const guide = notionPrddGuide('Payments');
  assert.equal(guide.provider, 'notion');
  assert.equal(guide.guideOnly, true);
  assert.equal(guide.sections.length, 9);
  assert.equal(guide.title, 'PRDD - Payments (EN)');
  assert.match(guide.instructions, /Search the hub for the exact title/);
  assert.match(guide.instructions, /read back the saved page/);
  assert.match(notionPrddGuide('Payments', 'edit').instructions, /read the complete existing page/);
});

test('Notion extraction stages files without requiring an Obsidian vault', async () => {
  const previous = process.env.DOCUMENTS_PROVIDER;
  process.env.DOCUMENTS_PROVIDER = 'notion';
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'openpm-notion-test-'));
  let staging;
  try {
    const source = path.join(scratch, 'sample.md');
    fs.writeFileSync(source, '# Sample\n\nEvidence from a local document.');
    const result = await extractKnowledgeWorkflow({ source });
    assert.equal(result.processedCount, 1);
    assert.equal(result.publicationStatus, 'pending');
    staging = path.dirname(result.results[0].targetPath!);
    assert.ok(path.basename(staging).startsWith('openpm-notion-'));
    assert.match(fs.readFileSync(result.results[0].targetPath!, 'utf8'), /Evidence from a local document/);
    const explicit = await extractKnowledgeWorkflow({ source, out: path.join(scratch, 'explicit') });
    assert.equal(path.dirname(explicit.results[0].targetPath!), path.join(scratch, 'explicit'));
  } finally {
    if (previous === undefined) delete process.env.DOCUMENTS_PROVIDER;
    else process.env.DOCUMENTS_PROVIDER = previous;
    if (staging) fs.rmSync(staging, { recursive: true, force: true });
    fs.rmSync(scratch, { recursive: true, force: true });
  }
});
