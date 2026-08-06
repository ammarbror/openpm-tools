import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { rmSync } from 'node:fs';
import {
  releaseWorkflowRun,
  generateReleaseNotes,
  groupIssuesByType,
  defaultVersionName,
  cleanSummary,
} from './index.js';

const BASE = 'https://my-domain.atlassian.net';

const story = {
  id: '1',
  key: 'KAIRA-101',
  self: 'x',
  fields: {
    summary: 'Add login',
    status: { name: 'Ready for Release' },
    issuetype: { name: 'Story' },
  },
};
const bug = {
  id: '2',
  key: 'KAIRA-102',
  self: 'x',
  fields: {
    summary: 'Fix crash',
    status: { name: 'Ready for Release' },
    issuetype: { name: 'Bug' },
  },
};
const task = {
  id: '3',
  key: 'KAIRA-103',
  self: 'x',
  fields: {
    summary: 'Write docs',
    status: { name: 'Ready for Release' },
    issuetype: { name: 'Task' },
  },
};
const other = {
  id: '4',
  key: 'KAIRA-104',
  self: 'x',
  fields: {
    summary: 'Misc',
    status: { name: 'Ready for Release' },
    issuetype: { name: 'Improvement' },
  },
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function makeRouter(opts: {
  issues?: unknown[];
  activeSprints?: unknown[];
  futureSprints?: unknown[];
} = {}) {
  const issues = opts.issues ?? [story, bug];
  const activeSprints = opts.activeSprints ?? [{ id: 42, name: 'Sprint 42', state: 'active' }];
  const futureSprints = opts.futureSprints ?? [];

  let versionBody: Record<string, unknown> | null = null;
  let versionPosts = 0;
  let putIssueCalls = 0;

  const router = async (url: RequestInfo | URL, init?: RequestInit) => {
    const u = String(url);
    if (u.includes('/sprint?state=active')) {
      return json({ values: activeSprints });
    }
    if (u.includes('/sprint?state=future')) {
      return json({ values: futureSprints });
    }
    if (u.includes('/rest/agile/1.0/board')) {
      return json({ values: [{ id: 1, name: 'KAIRA Board' }] });
    }
    if (u.includes('/rest/api/3/search/jql')) {
      return json({ issues, isLast: true });
    }
    if (u.includes('/rest/api/3/project/KAIRA')) {
      return json({ id: '10000', key: 'KAIRA', name: 'KAIRA' });
    }
    if (u.includes('/rest/api/3/version')) {
      versionPosts++;
      versionBody = init?.body ? JSON.parse(init.body as string) : null;
      return json(
        {
          id: '10001',
          name: 'v1.0',
          archived: false,
          released: false,
          self: BASE + '/rest/api/3/version/10001',
        },
        201,
      );
    }
    if (u.includes('/rest/api/3/issue/')) {
      putIssueCalls++;
      return new Response(null, { status: 204 });
    }
    return new Response('Not Found', { status: 404 });
  };

  return {
    fetch: router,
    get versionBody() { return versionBody; },
    get versionPosts() { return versionPosts; },
    get putIssueCalls() { return putIssueCalls; },
  };
}

beforeEach(() => {
  process.env.JIRA_EMAIL = 'bot@example.com';
  process.env.JIRA_API_TOKEN = 'tok_123';
  process.env.JIRA_URL = BASE;
  process.env.JIRA_PROJECT_KEY = 'KAIRA';
  globalThis.fetch = undefined as unknown as typeof globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = undefined as unknown as typeof globalThis.fetch;
  delete process.env.JIRA_EMAIL;
  delete process.env.JIRA_API_TOKEN;
  delete process.env.JIRA_URL;
  delete process.env.JIRA_PROJECT_KEY;
  rmSync('release-notes', { recursive: true, force: true });
});

void describe('defaultVersionName', () => {
  void it('returns a string matching the format', () => {
    const result = defaultVersionName();
    assert.match(result, /^Release \d{4}-\d{2}-\d{2}$/);
  });
});

void describe('groupIssuesByType', () => {
  void it('groups issues into Features/Bugs/Tasks/Epics/Other', () => {
    const issues = [story, bug, task, other];
    const result = groupIssuesByType(issues);
    assert.deepStrictEqual(result, {
      Features: [story],
      Bugs: [bug],
      Tasks: [task],
      Epics: [],
      Other: [other],
    });
  });
});

void describe('cleanSummary', () => {
  void it('strips a single leading tag prefix', () => {
    assert.strictEqual(cleanSummary('[BUG] Fix Filter Market'), 'Fix Filter Market');
  });

  void it('strips multiple stacked tag prefixes and collapses whitespace', () => {
    assert.strictEqual(cleanSummary('[BE] [TASK]   Adjust Logic'), 'Adjust Logic');
  });

  void it('strips a tag with no space after it', () => {
    assert.strictEqual(cleanSummary('[BACKLOG]Implement Logout API'), 'Implement Logout API');
  });

  void it('trims and collapses whitespace and capitalizes first letter', () => {
    assert.strictEqual(cleanSummary('  plain  summary  '), 'Plain summary');
  });

  void it('returns trimmed original when bracket is empty', () => {
    assert.strictEqual(cleanSummary('[]'), '[]');
  });

  void it('returns trimmed original when stripping leaves nothing', () => {
    assert.strictEqual(cleanSummary('[BUG]'), '[BUG]');
  });

  void it('returns empty string for empty input', () => {
    assert.strictEqual(cleanSummary(''), '');
  });

  void it('returns empty string for non-string input', () => {
    assert.strictEqual(cleanSummary(undefined as unknown as string), '');
  });
});

void describe('generateReleaseNotes', () => {
  void it('generates markdown with sections for each group in order', () => {
    const fixedDate = new Date('2026-08-07T12:00:00Z');
    const notes = generateReleaseNotes([story, bug], 'v1.0', fixedDate);
    const expected = [
      '# Release v1.0',
      'Date: 2026-08-07',
      '',
      '## Features',
      '- [KAIRA-101] Add login',
      '',
      '## Bugs',
      '- [KAIRA-102] Fix crash',
    ].join('\n');
    assert.strictEqual(notes, expected);
  });

  void it('humanizes tagged issue summaries', () => {
    const tagged = {
      id: '99',
      key: 'KAIRA-999',
      self: 'x',
      fields: {
        summary: '[BE] [TASK] Adjust Logic',
        status: { name: 'Ready for Release' },
        issuetype: { name: 'Task' },
      },
    };
    const notes = generateReleaseNotes([tagged], 'v1.0', new Date('2026-08-07T12:00:00Z'));
    assert.match(notes, /- \[KAIRA-999\] Adjust Logic/);
  });
});

void describe('releaseWorkflowRun', () => {
  void it('happy path creates version, assigns fixVersions, writes notes', async () => {
    const m = makeRouter();
    globalThis.fetch = m.fetch;

    const result = await releaseWorkflowRun({ versionName: 'v1.0' });

    assert.strictEqual(result.version?.id, '10001');
    assert.strictEqual(result.issueCount, 2);
    assert.strictEqual(result.releaseNotesPath, 'release-notes/RELEASE_NOTES_v1-0.md');

    const body = m.versionBody;
    assert.ok(body !== null);
    assert.ok(!('released' in body));
    assert.ok((body.description as string).includes('KAIRA-101'));
    assert.strictEqual(m.putIssueCalls, 2);
  });

  void it('zero-tickets path returns null version without creating one', async () => {
    const m = makeRouter({ issues: [] });
    globalThis.fetch = m.fetch;

    const result = await releaseWorkflowRun();

    assert.strictEqual(result.version, null);
    assert.strictEqual(result.issueCount, 0);
    assert.strictEqual(m.versionPosts, 0);
  });

  void it('no-sprint path throws error matching /sprint/i', async () => {
    const m = makeRouter({ activeSprints: [], futureSprints: [] });
    globalThis.fetch = m.fetch;

    await assert.rejects(
      () => releaseWorkflowRun(),
      (err: Error) => {
        assert.ok(/sprint/i.test(err.message));
        return true;
      },
    );
  });
});
