import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const scratch = await fs.mkdtemp(path.join(os.tmpdir(), 'openpm-smoke-'));
const client = new Client({ name: 'openpm-setup-check', version: '1.0.0' });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [fileURLToPath(new URL('./start-mcp.mjs', import.meta.url))],
  cwd: scratch,
  stderr: 'pipe',
});
transport.stderr?.on('data', chunk => process.stderr.write(chunk));

try {
  await client.connect(transport, { timeout: 60000 });
  const { tools } = await client.listTools();
  assert.equal(tools.length, 9);
  const guide = await client.callTool({ name: 'create_prdd', arguments: { productName: 'Setup Check' } });
  assert.ok(!guide.isError);
  assert.match(JSON.stringify(guide.content), /Setup Check/);
  const source = path.join(scratch, 'sample.md');
  const out = path.join(scratch, 'knowledge');
  await fs.writeFile(source, '# Setup check\n\nDocument extraction works locally.\n');
  const extraction = await client.callTool({ name: 'extract_knowledge', arguments: { source, out, json: true } });
  assert.ok(!extraction.isError);
  assert.match(await fs.readFile(path.join(out, 'sample.knowledge.md'), 'utf8'), /Document extraction works locally/);
  console.log(JSON.stringify({ status: 'passed', tools: tools.map(tool => tool.name), checks: ['MCP initialization from another folder', 'tool discovery', 'PRDD guide', 'document extraction'] }, null, 2));
} finally {
  await client.close();
  await transport.close();
  await fs.rm(scratch, { recursive: true, force: true });
}
