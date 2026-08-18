import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

test('brainstorm contracts keep quick and standard/deep mode semantics aligned', () => {
  const root = path.resolve(here, '../..');
  const skill = fs.readFileSync(path.join(root, '.claude/skills/brainstorm/SKILL.md'), 'utf8');
  const command = fs.readFileSync(path.join(root, '.opencode/command/brainstorm.md'), 'utf8');
  assert.match(skill, /`--quick` uses at most 6 turns and may produce fewer than 8 ideas/);
  assert.match(skill, /Standard mode and `--deep` use[\s\S]*require at least 8 distinct ideas/);
  assert.match(command, /`--quick` uses at most 6 turns and may produce fewer than 8 ideas/);
  assert.match(command, /Standard mode and\n`--deep` use at most 10 turns and require at least 8 distinct ideas/);
});

test('OpenCode prompt is self-contained about guide-only output and document safety', () => {
  const root = path.resolve(here, '../..');
  const command = fs.readFileSync(path.join(root, '.opencode/command/brainstorm.md'), 'utf8');
  assert.match(command, /YAML frontmatter must contain exactly these required fields/);
  for (const field of ['`title`', '`type: Brainstorm`', '`topic`', '`date`', '`status: Draft`']) {
    assert.match(command, new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(command, /CLI remains guide-only and[\s\S]*must not write this document/);
  assert.match(command, /YAML-quote `title` and `topic`/);
  assert.match(command, /valid `mermaid` fenced block/);
  assert.match(command, /document must remain understandable without rendering it/);
});

test('brainstorm guide preserves topic when --quick precedes it and does not write files', () => {
  const root = path.resolve(here, '../..');
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brainstorm-guide-'));
  try {
    const cli = path.join(root, 'bin/openpm-tools.ts');
    const tsx = path.join(root, 'node_modules/tsx/dist/cli.mjs');
    const raw = execFileSync(process.execPath, [tsx, cli, 'brainstorm', '--quick', 'team onboarding', '--json', '--out', outputDir], {
      cwd: root,
      env: { ...process.env, TMPDIR: '/tmp' },
      encoding: 'utf8',
    });
    const guide = JSON.parse(raw) as { command: string; topic: string; output: { count: number }; session: { mode: string; sections: string[] } };
    assert.equal(guide.command, 'brainstorm');
    assert.equal(guide.topic, 'team onboarding');
    assert.equal(guide.output.count, 1);
    assert.equal(guide.session.mode, 'quick');
    assert.ok(guide.session.sections.includes('Success Criteria'));
    assert.deepEqual(fs.readdirSync(outputDir), []);
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});

test('brainstorm guide rejects simultaneous quick and deep modes', () => {
  const root = path.resolve(here, '../..');
  const cli = path.join(root, 'bin/openpm-tools.ts');
  const tsx = path.join(root, 'node_modules/tsx/dist/cli.mjs');
  assert.throws(() => execFileSync(process.execPath, [tsx, cli, 'brainstorm', '--quick', '--deep', 'topic', '--json'], {
    cwd: root,
    env: { ...process.env, TMPDIR: '/tmp' },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }));
});

test('brainstorm guide rejects --out without a directory value', () => {
  const root = path.resolve(here, '../..');
  const cli = path.join(root, 'bin/openpm-tools.ts');
  const tsx = path.join(root, 'node_modules/tsx/dist/cli.mjs');
  assert.throws(() => execFileSync(process.execPath, [tsx, cli, 'brainstorm', 'topic', '--out', '--json'], {
    cwd: root,
    env: { ...process.env, TMPDIR: '/tmp' },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }));
});

test('brainstorm guide reports missing topic in JSON and registers help entry', () => {
  const root = path.resolve(here, '../..');
  const cli = path.join(root, 'bin/openpm-tools.ts');
  const tsx = path.join(root, 'node_modules/tsx/dist/cli.mjs');
  const json = JSON.parse(execFileSync(process.execPath, [tsx, cli, 'brainstorm', '--json'], {
    cwd: root,
    env: { ...process.env, TMPDIR: '/tmp' },
    encoding: 'utf8',
  })) as { command: string; topic: string | null };
  assert.equal(json.command, 'brainstorm');
  assert.equal(json.topic, null);

  const help = execFileSync(process.execPath, [tsx, cli, '--help'], {
    cwd: root,
    env: { ...process.env, TMPDIR: '/tmp' },
    encoding: 'utf8',
  });
  assert.match(help, /brainstorm \[topic\]/);
});
