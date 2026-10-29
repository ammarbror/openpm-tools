import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function createHermesConfig() {
  const root = fileURLToPath(new URL('../', import.meta.url));
  return {
    mcp_servers: {
      'openpm-tools': {
        command: process.execPath,
        args: [path.join(root, 'scripts', 'start-mcp.mjs')],
      },
    },
  };
}

function main(args) {
  const allowed = new Set(['--json', '--with-notion', '--help']);
  const unknown = args.find(arg => !allowed.has(arg));
  if (unknown) throw new Error(`Unknown option: ${unknown}`);
  if (args.includes('--help')) {
    console.log('Usage: node scripts/hermes-config.mjs [--with-notion] [--json]');
    console.log('Print a credential-free config fragment. Merge it into the active Hermes profile config.yaml; existing configuration is never changed.');
    return;
  }
  const config = createHermesConfig();
  if (args.includes('--with-notion')) {
    config.mcp_servers.notion = { url: 'https://mcp.notion.com/mcp', auth: 'oauth' };
  }
  if (args.includes('--json')) {
    console.log(JSON.stringify(config, null, 2));
    return;
  }
  const server = config.mcp_servers['openpm-tools'];
  const lines = [
    '# Merge into the existing mcp_servers mapping; do not replace your profile.',
    'mcp_servers:',
    '  openpm-tools:',
    `    command: ${JSON.stringify(server.command)}`,
    `    args: ${JSON.stringify(server.args)}`,
  ];
  if (config.mcp_servers.notion) {
    lines.push('  notion:', '    url: "https://mcp.notion.com/mcp"', '    auth: oauth');
  }
  console.log(lines.join('\n'));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
