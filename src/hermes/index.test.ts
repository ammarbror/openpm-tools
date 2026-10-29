import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createHermesConfig } from '../../scripts/hermes-config.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const script = path.join(root, 'scripts', 'hermes-config.mjs');

test('Hermes config uses the installed runtime and absolute launcher from another directory without touching its profile', () => {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'openpm-hermes-'));
  const existing = path.join(scratch, 'config.yaml');
  fs.writeFileSync(existing, 'model: keep-my-model\nmcp_servers: {}\n');
  try {
    const raw = execFileSync(process.execPath, [script, '--json'], {
      cwd: scratch,
      encoding: 'utf8',
      env: { ...process.env, HERMES_HOME: scratch, JIRA_API_TOKEN: 'not-for-export', BITBUCKET_API_TOKEN: 'not-for-export' },
    });
    const config = JSON.parse(raw);
    assert.deepEqual(config, createHermesConfig());
    assert.equal(config.mcp_servers['openpm-tools'].command, process.execPath);
    const [launcher] = config.mcp_servers['openpm-tools'].args;
    assert.ok(path.isAbsolute(launcher));
    assert.ok(fs.existsSync(launcher));
    assert.deepEqual(Object.keys(config.mcp_servers), ['openpm-tools']);
    assert.equal(config.mcp_servers['openpm-tools'].env, undefined);
    assert.ok(!raw.includes('not-for-export'));
    assert.equal(fs.readFileSync(existing, 'utf8'), 'model: keep-my-model\nmcp_servers: {}\n');
    assert.deepEqual(fs.readdirSync(scratch), ['config.yaml']);
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
});

test('Notion is an explicit optional OAuth connection in Hermes config', () => {
  const config = JSON.parse(execFileSync(process.execPath, [script, '--with-notion', '--json'], { encoding: 'utf8' }));
  assert.deepEqual(config.mcp_servers.notion, { url: 'https://mcp.notion.com/mcp', auth: 'oauth' });
});

test('Hermes config rejects unsupported options', () => {
  assert.throws(() => execFileSync(process.execPath, [script, '--install'], { stdio: 'pipe' }));
});

test('Hermes bridge routes every canonical workflow to an existing skill', () => {
  const bridge = fs.readFileSync(path.join(root, '.hermes/skills/openpm-tools/SKILL.md'), 'utf8');
  const routes = Array.from(bridge.matchAll(/`(\.codex\/skills\/[^`]+\/SKILL\.md)`/g), match => match[1]);
  const skills = fs.readdirSync(path.join(root, '.codex/skills'))
    .map(name => `.codex/skills/${name}/SKILL.md`)
    .filter(name => fs.existsSync(path.join(root, name)));
  assert.deepEqual(routes.sort(), skills.sort());
});
