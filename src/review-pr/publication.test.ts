import { beforeEach, afterEach, it } from 'node:test';
import assert from 'node:assert/strict';
import { fetchReviewData } from './index.ts';
import { parseReviewSubmission, publishReview } from './publication.ts';
import type { ReviewSubmission } from './types.ts';

const prUrl = 'https://bitbucket.org/ws/repo/pull-requests/42';
const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
let source: string;
let destination: string;
let diff: string;
let bbComments: any[];
let jiraComments: any[];
let writes: { url: string; method: string; body: any }[];
let failJira: boolean;
let failInline: boolean;
let prReads: number;
let moveDuringFetch: boolean;
const json = (body: unknown) => new Response(JSON.stringify(body), {
  status: 200, headers: { 'content-type': 'application/json' },
});

beforeEach(() => {
  Object.assign(process.env, { BITBUCKET_EMAIL: 'review@example.com', BITBUCKET_API_TOKEN: 'fake',
    JIRA_EMAIL: 'review@example.com', JIRA_API_TOKEN: 'fake', JIRA_URL: 'https://jira.example.com', JIRA_PROJECT_KEY: 'KAIRA' });
  source = 'a'.repeat(40); destination = 'b'.repeat(40);
  diff = 'diff --git a/a.ts b/a.ts\n--- a/a.ts\n+++ b/a.ts\n@@ -1 +1 @@\n-old\n+new\n';
  bbComments = []; jiraComments = []; writes = [];
  failJira = false; failInline = false; prReads = 0; moveDuringFetch = false;
  globalThis.fetch = async (input, options) => {
    const url = String(input);
    const method = options?.method ?? 'GET';
    if (method !== 'GET') {
      const body = JSON.parse(String(options?.body));
      writes.push({ url, method, body });
      if (url.includes('api.bitbucket.org')) {
        if (body.inline && failInline) return new Response('bad line', { status: 400 });
        if (method === 'POST') bbComments.push({ id: bbComments.length + 1, user: { uuid: 'reviewer' }, ...body });
        else Object.assign(bbComments.find(c => url.endsWith(`/${c.id}`)), body);
      } else {
        if (failJira) return new Response('unavailable', { status: 503 });
        if (method === 'POST') jiraComments.push({ id: String(jiraComments.length + 1), author: { accountId: 'reviewer' }, ...body });
        else Object.assign(jiraComments.find(c => url.endsWith(`/${c.id}`)), body);
      }
      return json({});
    }
    if (url.endsWith('/2.0/user')) return json({ uuid: 'reviewer' });
    if (url.endsWith('/myself')) return json({ accountId: 'reviewer' });
    if (url.includes('/comments')) return json({ values: bbComments });
    if (url.includes('/comment?')) return json({ comments: jiraComments, total: jiraComments.length });
    if (url.endsWith('/commits')) return json({ values: [{ message: 'Merge KAIRA-999' }] });
    if (url.endsWith('/diff')) return new Response(diff);
    if (url.endsWith('/pullrequests/42')) {
      prReads++;
      if (moveDuringFetch && prReads === 2) source = 'c'.repeat(40);
      return json({ title: 'KAIRA-123', description: 'Add the requested behavior',
        source: { branch: { name: 'KAIRA-123' }, commit: { hash: source } },
        destination: { commit: { hash: destination } } });
    }
    throw new Error(`Unexpected request: ${method} ${url}`);
  };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
  Object.assign(process.env, originalEnv);
});

async function submission(): Promise<ReviewSubmission> {
  const data = await fetchReviewData(prUrl);
  return { snapshot: data.snapshot, status: 'complete', limitations: [], findings: [] };
}

it('rejects legacy arrays and malformed findings before making any writes', () => {
  assert.throws(() => parseReviewSubmission([]), /snapshot/);
  assert.throws(() => parseReviewSubmission({ snapshot: {}, status: 'complete', limitations: [], findings: [] }), /snapshot/);
  assert.equal(writes.length, 0);
});

it('accepts abbreviated commit hashes returned by Bitbucket', async () => {
  const review = await submission();
  review.snapshot.sourceCommit = 'a'.repeat(12);
  review.snapshot.destinationCommit = 'b'.repeat(12);
  assert.deepEqual(parseReviewSubmission(review).snapshot, review.snapshot);
});

for (const changed of ['source', 'destination', 'diff'] as const) {
  it(`rejects a changed ${changed} before publishing`, async () => {
    const review = await submission();
    if (changed === 'source') source = 'c'.repeat(40);
    if (changed === 'destination') destination = 'c'.repeat(40);
    if (changed === 'diff') diff += '+another change\n';
    await assert.rejects(() => publishReview(prUrl, review), /changed since review/);
    assert.equal(writes.length, 0);
  });
}

it('rejects a PR moving during diff collection', async () => {
  moveDuringFetch = true;
  await assert.rejects(() => fetchReviewData(prUrl), /changed while fetching/);
  assert.equal(writes.length, 0);
});

it('publishes an incomplete verdict without a clean result', async () => {
  const review = await submission();
  review.status = 'incomplete'; review.limitations = ['Caller source unavailable'];
  const result = await publishReview(prUrl, review);
  assert.equal(result.success, true);
  assert.match(bbComments[0].content.raw, /REVIEW INCOMPLETE/);
  assert.doesNotMatch(bbComments[0].content.raw, /NO ISSUES FOUND/);
  assert.match(JSON.stringify(jiraComments[0]), /REVIEW INCOMPLETE/);
  assert.doesNotMatch(JSON.stringify(jiraComments[0]), /NO ISSUES FOUND/);
});

it('requires incomplete review reasons and validates severity and line numbers', async () => {
  const review = await submission();
  assert.throws(() => parseReviewSubmission({ ...review, status: 'incomplete' }), /limitation/);
  for (const finding of [null, { severity: 'LOW' }, { severity: 'BUG', file: 'a', message: 'bad', line: 0 }]) {
    assert.throws(() => parseReviewSubmission({ ...review, findings: [finding] }));
  }
});

it('updates own summaries and inline locations on repeat reviews, without duplicating', async () => {
  const review = await submission();
  review.findings = [{ severity: 'BUG', file: 'a.ts', line: 1, message: 'Incorrect result' }];
  assert.equal((await publishReview(prUrl, review)).success, true);
  review.findings[0].message = 'Clarified consequence';
  assert.equal((await publishReview(prUrl, review)).success, true);
  assert.equal(bbComments.length, 2);
  assert.equal(jiraComments.length, 1);
  assert.match(bbComments[1].content.raw, /Clarified consequence/);
  assert.equal(writes.filter(w => w.method === 'PUT').length, 3);
  assert.ok(writes.every(w => !w.url.includes('/transitions')));
});

it('never overwrites another author even when they copy a review marker', async () => {
  const review = await submission();
  await publishReview(prUrl, review);
  bbComments[0].user.uuid = 'someone-else';
  jiraComments[0].author.accountId = 'someone-else';
  await publishReview(prUrl, review);
  assert.equal(bbComments.length, 2);
  assert.equal(jiraComments.length, 2);
});

it('preserves multiple findings at the same inline location when publishing again', async () => {
  const review = await submission();
  review.findings = [
    { severity: 'HIGH', file: 'a.ts', line: 1, message: 'Missing permission check' },
    { severity: 'BUG', file: 'a.ts', line: 1, message: 'Incorrect empty result' },
  ];
  assert.equal((await publishReview(prUrl, review)).success, true);
  assert.equal(bbComments.length, 2);
  assert.match(bbComments[1].content.raw, /Missing permission check/);
  assert.match(bbComments[1].content.raw, /Incorrect empty result/);
  review.findings[1].message = 'Clarified empty result';
  assert.equal((await publishReview(prUrl, review)).success, true);
  assert.equal(bbComments.length, 2);
  assert.match(bbComments[1].content.raw, /Missing permission check/);
  assert.match(bbComments[1].content.raw, /Clarified empty result/);
});

it('reports Jira failure instead of overall success', async () => {
  const review = await submission(); failJira = true;
  const result = await publishReview(prUrl, review);
  assert.equal(result.success, false);
  assert.equal(result.bitbucket.success, true);
  assert.deepEqual(result.jiraResults, [{ key: 'KAIRA-123', success: false }]);
});

it('reports inline failure while preserving the posted summary', async () => {
  const review = await submission(); failInline = true;
  review.findings = [{ severity: 'BUG', file: 'a.ts', line: 1, message: 'Incorrect result' }];
  const result = await publishReview(prUrl, review);
  assert.equal(result.success, false);
  assert.equal(result.bitbucket.success, true);
  assert.equal(result.inlineResults[0].success, false);
});

it('reports a failed Bitbucket summary and does not publish to Jira', async () => {
  const review = await submission();
  const fetchMock = globalThis.fetch;
  globalThis.fetch = async (url, options) => String(url).endsWith('/2.0/user')
    ? new Response('forbidden', { status: 403 }) : fetchMock(url, options);
  const result = await publishReview(prUrl, review);
  assert.equal(result.success, false);
  assert.equal(result.bitbucket.success, false);
  assert.deepEqual(result.jiraResults, []);
  assert.equal(jiraComments.length, 0);
});

it('finds own review comments on later pages before deciding to create', async () => {
  const review = await submission();
  await publishReview(prUrl, review);
  const fetchMock = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    const target = String(url);
    if (!options?.method && target.endsWith('/comments')) return json({ values: [], next: `${target}?page=2` });
    if (!options?.method && target.endsWith('/comment?startAt=0')) return json({ comments: [{ id: 'unrelated' }], total: 2 });
    return fetchMock(url, options);
  };
  await publishReview(prUrl, review);
  assert.equal(bbComments.length, 1);
  assert.equal(jiraComments.length, 1);
  assert.equal(writes.filter(w => w.method === 'PUT').length, 2);
});

it('rejects invalid diff responses rather than recording a clean result', async () => {
  diff = '{"error":"diff unavailable"}';
  await assert.rejects(() => fetchReviewData(prUrl), /Invalid diff/);
  assert.equal(writes.length, 0);
});

it('requires both commit hashes from Bitbucket', async () => {
  source = '';
  await assert.rejects(() => fetchReviewData(prUrl), /commit hashes are missing/);
  assert.equal(writes.length, 0);
});
