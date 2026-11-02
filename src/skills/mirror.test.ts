import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');

function skillNames(base: string): string[] {
  const dir = path.join(root, base);
  return fs.readdirSync(dir)
    .filter(name => fs.existsSync(path.join(dir, name, 'SKILL.md')))
    .sort();
}

test('Claude skills mirror the canonical Codex skills', () => {
  const canonical = skillNames('.codex/skills');
  const mirrors = skillNames('.claude/skills');
  assert.deepEqual(mirrors, canonical);

  for (const name of canonical) {
    const source = fs.readFileSync(path.join(root, `.codex/skills/${name}/SKILL.md`), 'utf8');
    const mirror = fs.readFileSync(path.join(root, `.claude/skills/${name}/SKILL.md`), 'utf8');
    assert.equal(mirror, source, `.claude/skills/${name}/SKILL.md drifted from .codex/skills/${name}/SKILL.md; copy the canonical file`);
  }
});

test('every canonical skill declares a matching name and a description', () => {
  for (const name of skillNames('.codex/skills')) {
    const source = fs.readFileSync(path.join(root, `.codex/skills/${name}/SKILL.md`), 'utf8');
    const frontmatter = source.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(frontmatter, `.codex/skills/${name}/SKILL.md is missing YAML frontmatter`);

    const declared = frontmatter[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
    const description = frontmatter[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
    assert.equal(declared, name, `.codex/skills/${name}/SKILL.md must declare name: ${name}`);
    assert.ok(description && description.length > 0, `.codex/skills/${name}/SKILL.md is missing a description`);
  }
});

test('every canonical skill is reachable as an OpenCode slash command', () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'opencode.json'), 'utf8')) as {
    command: Record<string, { description?: string; template?: string }>;
  };

  for (const name of skillNames('.codex/skills')) {
    const command = config.command[name];
    assert.ok(command, `opencode.json has no command entry for skill ${name}; add a /${name} slash command`);
    assert.ok(command.description && command.description.length > 0, `opencode.json command ${name} needs a description`);
    assert.ok(command.template && command.template.length > 0, `opencode.json command ${name} needs a template`);
  }

  for (const [name, command] of Object.entries(config.command)) {
    const referenced = command.template?.match(/\.opencode\/command\/([a-z0-9-]+)\.md/)?.[1];
    if (!referenced) continue;

    const commandFile = path.join(root, `.opencode/command/${referenced}.md`);
    assert.ok(fs.existsSync(commandFile), `opencode.json command ${name} references missing .opencode/command/${referenced}.md`);

    const source = fs.readFileSync(commandFile, 'utf8');
    const description = source.match(/^---\n[\s\S]*?^description:\s*(.+)$/m)?.[1]?.trim();
    assert.ok(description, `.opencode/command/${referenced}.md needs a description in its frontmatter`);
  }
});
