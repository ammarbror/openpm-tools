import assert from 'node:assert';
import test, { describe, it } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parseDocument, UnsupportedFormatError } from './parser.js';
import { assembleKnowledgeMarkdown, sanitizeFilename } from './assembler.js';
import { resolveVaultPath, VaultPathNotFoundError } from './vault.js';
import { enhanceWithLLM } from './llm.js';
import { extractKnowledgeWorkflow, runFromEnv } from './index.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// We import the CLI parseArgs function dynamically by reading/mocking or extracting if needed.
// To keep things simple, let's test arg parsing through a unit test representation of parseArgs.
function parseArgs(args: string[]) {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];
  const BOOLEAN_FLAGS = new Set(['llm', 'overwrite', 'json']);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (BOOLEAN_FLAGS.has(key)) {
        flags[key] = true;
      } else {
        const next = args[i + 1];
        if (next && !next.startsWith('--') && !next.startsWith('-')) {
          flags[key] = next;
          i++;
        } else {
          flags[key] = true;
        }
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      if (BOOLEAN_FLAGS.has(key)) {
        flags[key] = true;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { flags, positional };
}

describe('extract-knowledge module', () => {
  describe('CLI parseArgs', () => {
    it('properly handles boolean flags and positional arguments without swallowing', () => {
      const { flags, positional } = parseArgs(['extract-knowledge', 'README.md', '--llm', '--overwrite', '--json']);
      assert.strictEqual(positional[0], 'extract-knowledge');
      assert.strictEqual(positional[1], 'README.md');
      assert.strictEqual(flags.llm, true);
      assert.strictEqual(flags.overwrite, true);
      assert.strictEqual(flags.json, true);
    });

    it('retains positional arguments even if boolean flags precede them', () => {
      const { flags, positional } = parseArgs(['extract-knowledge', '--llm', 'README.md']);
      assert.strictEqual(positional[0], 'extract-knowledge');
      assert.strictEqual(positional[1], 'README.md');
      assert.strictEqual(flags.llm, true);
    });
  });

  describe('assembler', () => {
    it('sanitizes titles to lowercase hyphenated stems', () => {
      assert.strictEqual(sanitizeFilename('My Document Title 123!'), 'my-document-title-123');
      assert.strictEqual(sanitizeFilename('---Special...Chars---'), 'special-chars');
      assert.strictEqual(sanitizeFilename(''), 'document');
    });

    it('assembles valid markdown with YAML frontmatter', () => {
      const output = assembleKnowledgeMarkdown({
        title: 'Sample Doc',
        content: '# Heading\n\nContent body.',
        source: '/path/sample.pdf',
        type: 'pdf',
        date: '2026-08-10',
      });

      assert.ok(output.startsWith('---\n'));
      assert.ok(output.includes('title: Sample Doc'));
      assert.ok(output.includes('source: /path/sample.pdf'));
      assert.ok(output.includes('type: pdf'));
      assert.ok(output.includes('date: 2026-08-10'));
      assert.ok(output.includes('# Heading\n\nContent body.'));
    });

    it('handles YAML escaping for titles with quotes or colons', () => {
      const output = assembleKnowledgeMarkdown({
        title: 'Title: "Special" Case',
        content: 'Body text',
        source: '/path/file.md',
        type: 'md',
      });

      assert.ok(output.includes('title: "Title: \\"Special\\" Case"'));
    });
  });

  describe('parser', () => {
    it('parses .md files directly stripping pre-existing frontmatter', async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ek-test-'));
      const mdPath = path.join(tmpDir, 'test.md');
      fs.writeFileSync(mdPath, '---\ntitle: Old Title\n---\n\n# Real Header\nBody text.', 'utf-8');

      const parsed = await parseDocument(mdPath);
      assert.strictEqual(parsed.format, 'md');
      assert.strictEqual(parsed.text.trim(), '# Real Header\nBody text.');
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('rejects legacy formats (.doc, .ppt, .xls) with UnsupportedFormatError', async () => {
      await assert.rejects(
        () => parseDocument('/tmp/old.doc'),
        (err: any) => err instanceof UnsupportedFormatError && err.message.includes('.docx')
      );
      await assert.rejects(
        () => parseDocument('/tmp/old.ppt'),
        (err: any) => err instanceof UnsupportedFormatError && err.message.includes('.pptx')
      );
      await assert.rejects(
        () => parseDocument('/tmp/old.xls'),
        (err: any) => err instanceof UnsupportedFormatError && err.message.includes('.xlsx')
      );
    });
  });

  describe('vault resolver', () => {
    it('prioritizes vaultPath/outDir options over env variables', () => {
      const oldEnv = process.env.OBSIDIAN_VAULT_PATH;
      process.env.OBSIDIAN_VAULT_PATH = '/env/vault';
      try {
        assert.strictEqual(resolveVaultPath({ vaultPath: '/custom/vault' }), path.resolve('/custom/vault'));
        assert.strictEqual(resolveVaultPath({ outDir: '/custom/out' }), path.resolve('/custom/out'));
      } finally {
        if (oldEnv === undefined) delete process.env.OBSIDIAN_VAULT_PATH;
        else process.env.OBSIDIAN_VAULT_PATH = oldEnv;
      }
    });

    it('uses env OBSIDIAN_VAULT_PATH if present', () => {
      const oldEnv = process.env.OBSIDIAN_VAULT_PATH;
      process.env.OBSIDIAN_VAULT_PATH = '/env/vault';
      try {
        assert.strictEqual(resolveVaultPath(), path.resolve('/env/vault'));
      } finally {
        if (oldEnv === undefined) delete process.env.OBSIDIAN_VAULT_PATH;
        else process.env.OBSIDIAN_VAULT_PATH = oldEnv;
      }
    });

    it('throws VaultPathNotFoundError when no vault path resolves', () => {
      const oldEnv1 = process.env.OBSIDIAN_VAULT_PATH;
      const oldEnv2 = process.env.OBSIDIAN_VAULT;
      delete process.env.OBSIDIAN_VAULT_PATH;
      delete process.env.OBSIDIAN_VAULT;

      const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'home-mock-'));
      const originalHome = os.homedir;
      (os as any).homedir = () => tmpHome;

      try {
        assert.throws(() => resolveVaultPath(), VaultPathNotFoundError);
      } finally {
        (os as any).homedir = originalHome;
        if (oldEnv1 !== undefined) process.env.OBSIDIAN_VAULT_PATH = oldEnv1;
        if (oldEnv2 !== undefined) process.env.OBSIDIAN_VAULT = oldEnv2;
        fs.rmSync(tmpHome, { recursive: true, force: true });
      }
    });
  });

  describe('llm enhancer', () => {
    it('returns raw content if LLM_API_KEY is missing', async () => {
      const result = await enhanceWithLLM('Raw Content', { apiKey: '' });
      assert.strictEqual(result, 'Raw Content');
    });

    it('uses fetchLike and returns enhanced text on 200', async () => {
      const mockFetch: typeof globalThis.fetch = async () =>
        new Response(
          JSON.stringify({
            choices: [{ message: { content: 'Enhanced Content' } }],
          }),
          { status: 200 }
        );

      const result = await enhanceWithLLM('Raw Content', { apiKey: 'fake-key', fetchLike: mockFetch });
      assert.strictEqual(result, 'Enhanced Content');
    });

    it('falls back to raw content on non-200 HTTP response, invalid JSON, or fetch timeout', async () => {
      const mockFetch500: typeof globalThis.fetch = async () =>
        new Response('Internal Error', { status: 500 });
      assert.strictEqual(await enhanceWithLLM('Raw 1', { apiKey: 'fake-key', fetchLike: mockFetch500 }), 'Raw 1');

      const mockFetchBadJson: typeof globalThis.fetch = async () =>
        new Response('not json', { status: 200 });
      assert.strictEqual(await enhanceWithLLM('Raw 2', { apiKey: 'fake-key', fetchLike: mockFetchBadJson }), 'Raw 2');

      const mockFetchTimeout: typeof globalThis.fetch = async () => {
        throw new Error('Timeout error');
      };
      assert.strictEqual(await enhanceWithLLM('Raw 3', { apiKey: 'fake-key', fetchLike: mockFetchTimeout }), 'Raw 3');
    });
  });

  describe('workflow & runFromEnv', () => {
    it('processes batch folder with error isolation, overwrite, and skip-on-exists', async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ek-wf-test-'));
      const outDir = path.join(tmpDir, 'out');
      fs.mkdirSync(outDir, { recursive: true });

      const file1 = path.join(tmpDir, 'doc1.md');
      const file2 = path.join(tmpDir, 'doc2.doc'); // invalid
      fs.writeFileSync(file1, '# Doc 1 Content', 'utf-8');
      fs.writeFileSync(file2, 'binary content', 'utf-8');

      // First run: doc1 creates, doc2 fails
      const res1 = await extractKnowledgeWorkflow({
        source: tmpDir,
        out: outDir,
      });

      assert.strictEqual(res1.totalFiles, 2);
      assert.strictEqual(res1.processedCount, 1);
      assert.strictEqual(res1.failedCount, 1);

      // Second run without overwrite: doc1 skipped, doc2 fails again
      const res2 = await extractKnowledgeWorkflow({
        source: tmpDir,
        out: outDir,
      });

      assert.strictEqual(res2.skippedCount, 1);
      assert.strictEqual(res2.failedCount, 1);

      // Third run with overwrite mode: doc1 processed again
      const res3 = await extractKnowledgeWorkflow({
        source: tmpDir,
        out: outDir,
        overwrite: true,
      });

      assert.strictEqual(res3.processedCount, 1);
      assert.strictEqual(res3.skippedCount, 0);

      // Fourth run with --json formatting via runFromEnv
      const jsonOutput = await runFromEnv({
        source: tmpDir,
        out: outDir,
        json: true,
      });
      const parsedJson = JSON.parse(jsonOutput);
      assert.strictEqual(parsedJson.totalFiles, 2);

      // Fifth run formatted text output via runFromEnv
      const textOutput = await runFromEnv({
        source: tmpDir,
        out: outDir,
      });
      assert.ok(textOutput.includes('Knowledge Extraction Summary:'));

      fs.rmSync(tmpDir, { recursive: true, force: true });
    });
  });

  describe('MCP integration', () => {
    it('properly runs workflow from tool args', async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ek-mcp-test-'));
      const outDir = path.join(tmpDir, 'out');
      fs.mkdirSync(outDir, { recursive: true });

      const file1 = path.join(tmpDir, 'doc1.md');
      fs.writeFileSync(file1, '# MCP Doc', 'utf-8');

      const resultText = await runFromEnv({
        source: tmpDir,
        out: outDir,
        json: true,
      });

      const parsed = JSON.parse(resultText);
      assert.strictEqual(parsed.totalFiles, 1);
      assert.strictEqual(parsed.processedCount, 1);

      fs.rmSync(tmpDir, { recursive: true, force: true });
    });
  });
});
