import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { formatDescription, createTicketWorkflow } from './index.ts';

describe('formatDescription', () => {
  it('formats Story description with provided text', () => {
    const res = formatDescription('story', 'As a user I want login feature');
    assert.equal(res, 'As a user I want login feature');
  });

  it('formats Story description when text is empty with section guidance', () => {
    const res = formatDescription('story', '');
    assert.match(res, /h3\. User Story/);
    assert.match(res, /Isi deskripsi cerita pengguna/);
    assert.match(res, /h3\. Acceptance Criteria/);
    assert.match(res, /h3\. Additional Context/);
  });

  it('formats Bug description when text is empty with reproduction steps', () => {
    const res = formatDescription('bug', '');
    assert.match(res, /h3\. Description/);
    assert.match(res, /h3\. Steps to Reproduce/);
    assert.match(res, /h3\. Expected Behavior/);
    assert.match(res, /h3\. Actual Behavior/);
    assert.match(res, /h3\. Environment/);
    assert.match(res, /h3\. Evidence/);
  });

  it('formats Task description when text is empty with tech details and DoD', () => {
    const res = formatDescription('task', '');
    assert.match(res, /h3\. Description/);
    assert.match(res, /h3\. Technical Details/);
    assert.match(res, /h3\. Definition of Done/);
    assert.match(res, /h3\. Notes/);
  });

  it('formats Epic description when text is empty with goals and key initiatives', () => {
    const res = formatDescription('epic', '');
    assert.match(res, /h3\. Epic Description/);
    assert.match(res, /h3\. Goals \/ Objectives/);
    assert.match(res, /h3\. Key Initiatives/);
    assert.match(res, /h3\. Out of Scope/);
    assert.match(res, /h3\. Dependencies & Risks/);
  });
});

describe('createTicketWorkflow', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => { globalThis.fetch = originalFetch; });
  const config = { email: 'test@example.com', apiToken: 'test', baseUrl: 'https://jira.example.com', projectKey: 'TEST' };
  function fixture(options: { users?: object[]; active?: object[]; future?: object[]; failSprint?: boolean } = {}) {
    const created: Record<string, any>[] = [];
    const sprintWrites: unknown[] = [];
    globalThis.fetch = async (input, init) => {
      const url = new URL(String(input));
      const json = (data: unknown) => new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
      if (url.pathname.endsWith('/board')) return json({ values: [{ id: 1, name: 'Board' }] });
      if (url.pathname.endsWith('/sprint')) return json({ values: url.searchParams.get('state') === 'active' ? options.active ?? [{ id: 2, name: 'Sprint 1' }] : options.future ?? [] });
      if (url.pathname.endsWith('/user/search')) return json(options.users ?? []);
      if (url.pathname.endsWith('/issue') && init?.method === 'POST' && url.pathname.includes('/api/3/')) {
        created.push(JSON.parse(String(init.body)).fields);
        return json({ key: 'TEST-1', self: 'https://jira.example.com/TEST-1' });
      }
      if (url.pathname.endsWith('/issue') && init?.method === 'POST') {
        sprintWrites.push(JSON.parse(String(init.body)));
        return options.failSprint ? new Response('Forbidden', { status: 403 }) : new Response(null, { status: 204 });
      }
      throw new Error(`Unexpected request: ${url}`);
    };
    return { created, sprintWrites };
  }
  const params = { summary: 'Fix lookup', storyPoints: 3 };
  it('preserves structured descriptions, resolves exact assignee, and sends the estimate', async () => {
    const { created, sprintWrites } = fixture({ users: [{ accountId: 'other', displayName: 'Ammar Other' }, { accountId: 'correct', displayName: 'Ammar Abror' }] });
    const description = 'h3. Objective\nFix lookup\nh3. Acceptance Criteria\n* Return the requested card';
    const result = await createTicketWorkflow(config, { ...params, assignee: ' ammar abror ', description });
    assert.equal(result.issueKey, 'TEST-1');
    assert.deepEqual(created[0].assignee, { id: 'correct' });
    assert.equal(created[0].customfield_10032, 3);
    assert.equal(created[0].description.content.filter((n: any) => n.type === 'heading').length, 2);
    assert.deepEqual(sprintWrites, [{ issues: ['TEST-1'] }]);
  });
  for (const users of [[], [{ accountId: 'a', displayName: 'Ammar Other' }], [{ accountId: 'a', displayName: 'Ammar Abror' }, { accountId: 'b', displayName: 'Ammar Abror' }]]) {
    it(`rejects unresolved or ambiguous assignees (${users.length} results) before creation`, async () => {
      const { created } = fixture({ users });
      await assert.rejects(createTicketWorkflow(config, { ...params, assignee: 'Ammar Abror' }), /exactly one/);
      assert.equal(created.length, 0);
    });
  }
  it('rejects an explicit missing sprint before creation', async () => {
    const { created } = fixture();
    await assert.rejects(createTicketWorkflow(config, { ...params, sprintName: 'Missing' }), /No issue was created/);
    assert.equal(created.length, 0);
  });
  it('falls back to a future sprint when no sprint is active', async () => {
    fixture({ active: [], future: [{ id: 3, name: 'Next' }] });
    assert.equal((await createTicketWorkflow(config, params)).sprintName, 'Next');
  });
  it('returns no sprint when none exists', async () => {
    const { sprintWrites } = fixture({ active: [], future: [] });
    assert.equal((await createTicketWorkflow(config, params)).sprintName, null);
    assert.equal(sprintWrites.length, 0);
  });
  it('reports the existing issue key when sprint assignment fails', async () => {
    const { created } = fixture({ failSprint: true });
    await assert.rejects(createTicketWorkflow(config, params), /TEST-1 was created.*do not retry creation/);
    assert.equal(created.length, 1);
  });
  it('does not assign epics to a sprint', async () => {
    const { sprintWrites } = fixture();
    assert.equal((await createTicketWorkflow(config, { ...params, issueType: 'Epic' })).sprintName, null);
    assert.equal(sprintWrites.length, 0);
  });
  it('preserves an explicit zero estimate, account ID, and parent epic', async () => {
    const { created } = fixture();
    await createTicketWorkflow(config, { ...params, storyPoints: 0, assigneeAccountId: 'known', parentEpicKey: 'TEST-EPIC' });
    assert.equal(created[0].customfield_10032, 0);
    assert.equal(created[0].customfield_10014, 'TEST-EPIC');
    assert.deepEqual(created[0].assignee, { id: 'known' });
  });
  it('accepts an estimate from custom fields', async () => {
    const { created } = fixture();
    await createTicketWorkflow(config, { summary: 'Fix lookup', customFields: { customfield_10032: 5 } });
    assert.equal(created[0].customfield_10032, 5);
  });
  it('rejects an explicit sprint for an Epic before creating it', async () => {
    const { created } = fixture();
    await assert.rejects(createTicketWorkflow(config, { ...params, issueType: 'Epic', sprintName: 'Sprint 1' }), /Epics are not added/);
    assert.equal(created.length, 0);
  });
  for (const storyPoints of [undefined, NaN, Infinity, -1]) {
    it(`rejects invalid or absent estimates (${storyPoints}) before creation`, async () => {
      const { created } = fixture();
      await assert.rejects(createTicketWorkflow(config, { ...params, storyPoints }), /storyPoints estimate/);
      assert.equal(created.length, 0);
    });
  }
});
