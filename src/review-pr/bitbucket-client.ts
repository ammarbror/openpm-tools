import type { PRInfo, PRMetadata } from './types.ts';
import { createHash } from 'node:crypto';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildAuth(config: { email?: string; apiToken: string }): string {
  if (config.email && config.email.trim().length > 0) {
    return `Basic ${Buffer.from(`${config.email}:${config.apiToken}`).toString('base64')}`;
  }
  return config.apiToken.startsWith('Bearer ') ? config.apiToken : `Bearer ${config.apiToken}`;
}

async function apiFetch(
  url: string,
  config: { email?: string; apiToken: string },
  options: RequestInit = {},
): Promise<Response> {
  const auth = buildAuth(config);
  const headers = new Headers(options.headers);
  headers.set('Authorization', auth);

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '(unable to read body)');
    throw new Error(`Bitbucket API error: ${res.status} ${res.statusText} — ${body}`);
  }
  return res;
}

function prUrl(info: PRInfo): string {
  return `https://api.bitbucket.org/2.0/repositories/${info.workspace}/${info.repoSlug}/pullrequests/${info.prNumber}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch PR metadata (title, description, source branch) and commit messages.
 */
export async function fetchPRInfo(
  info: PRInfo,
  config: { email?: string; apiToken: string },
): Promise<PRMetadata> {
  const res = await apiFetch(prUrl(info), config);
  const data = await res.json();

  const title: string = data.title ?? '';
  const rawDesc = data.rendered?.description ?? data.description ?? '';
  const description: string = typeof rawDesc === 'string' ? rawDesc : (rawDesc?.raw ?? rawDesc?.html ?? String(rawDesc));
  const sourceBranch: string = data.source?.branch?.name ?? '';

  const commitMessages = await fetchPRCommits(info, config);

  return { title, description, sourceBranch, commitMessages,
    sourceCommit: data.source?.commit?.hash,
    destinationCommit: data.destination?.commit?.hash };
}

/**
 * Fetch the unified diff for a pull request (returns raw diff text).
 */
export async function fetchPRDiff(
  info: PRInfo,
  config: { email?: string; apiToken: string },
): Promise<string> {
  const res = await apiFetch(`${prUrl(info)}/diff`, config, {
    headers: { Accept: 'text/plain' },
  });
  return res.text();
}

/** Update only this authenticated user's marker-bearing review comments. */
export async function upsertReviewComment(
  info: PRInfo,
  config: { email?: string; apiToken: string },
  content: string,
  inline?: { path: string; to: number },
  sourceCommit?: string,
): Promise<void> {
  const identity = await (await apiFetch('https://api.bitbucket.org/2.0/user', config)).json();
  if (!identity.uuid) throw new Error('Cannot identify Bitbucket comment author');
  const key = inline ? createHash('sha256').update(JSON.stringify({ ...inline, sourceCommit })).digest('hex') : 'summary';
  const marker = `<!-- openpm-review:${key} -->`;
  const base = `${prUrl(info)}/comments`;
  let next: string | undefined = base;
  let existing: number | undefined;
  while (next) {
    const page = await (await apiFetch(next, config)).json();
    if (!Array.isArray(page.values)) throw new Error('Invalid Bitbucket comments response');
    existing = page.values.find((c: any) => !c.deleted && c.user?.uuid === identity.uuid && c.content?.raw?.startsWith(`${marker}\n`))?.id;
    if (existing !== undefined) break;
    next = page.next;
    if (next && new URL(next).origin !== 'https://api.bitbucket.org') throw new Error('Invalid Bitbucket pagination origin');
  }
  const res = await apiFetch(existing === undefined ? base : `${base}/${existing}`, config, {
    method: existing === undefined ? 'POST' : 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: { raw: `${marker}\n${content}` }, ...(inline ? { inline } : {}) }),
  });
  await res.text();
}

/**
 * Fetch commit messages for a pull request.
 */
export async function fetchPRCommits(
  info: PRInfo,
  config: { email?: string; apiToken: string },
): Promise<string[]> {
  const res = await apiFetch(`${prUrl(info)}/commits`, config);
  const data = await res.json();
  const values: Array<{ message?: string }> = data.values ?? [];
  return values.map((c) => c.message ?? '');
}

/**
 * Post a general (non-inline) comment on a pull request.
 */
export async function postGeneralComment(
  info: PRInfo,
  config: { email?: string; apiToken: string },
  content: string,
): Promise<void> {
  const res = await apiFetch(`${prUrl(info)}/comments`, config, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' } as Record<string, string>,
    body: JSON.stringify({ content: { raw: content } }),
  });
  // consume body so the connection is properly released
  await res.text();
}

/**
 * Post an inline comment on a specific file / line of a pull request.
 */
export async function postInlineComment(
  info: PRInfo,
  config: { email?: string; apiToken: string },
  content: string,
  file: string,
  line: number,
): Promise<void> {
  const res = await apiFetch(`${prUrl(info)}/comments`, config, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' } as Record<string, string>,
    body: JSON.stringify({ content: { raw: content }, inline: { to: line, path: file } }),
  });
  await res.text();
}
