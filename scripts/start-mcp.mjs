import { fileURLToPath } from 'node:url';
import { tsImport } from 'tsx/esm/api';

// MCP clients can launch from any workspace. Resolve .env in this checkout.
process.chdir(fileURLToPath(new URL('../', import.meta.url)));
await tsImport('../src/mcp/index.ts', import.meta.url);
