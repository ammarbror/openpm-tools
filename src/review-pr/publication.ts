import type { ReviewSubmission } from './types.ts';
import { fetchReviewData, postBitbucketComments, postJiraComments } from './index.ts';

export function parseReviewSubmission(value: unknown): ReviewSubmission {
  const input = value as any;
  if (!input || Array.isArray(input) || !input.snapshot) {
    throw new Error('Expected a review object with snapshot, status, limitations, and findings; bare findings arrays are no longer accepted');
  }
  for (const key of ['sourceCommit', 'destinationCommit', 'diffHash']) {
    const pattern = key === 'diffHash' ? /^[a-f0-9]{64}$/i : /^[a-f0-9]{7,64}$/i;
    if (typeof input.snapshot[key] !== 'string' || !pattern.test(input.snapshot[key])) {
      throw new Error(`Invalid snapshot.${key}; copy the snapshot from fetch-pr-review`);
    }
  }
  if (!['complete', 'incomplete'].includes(input.status) || !Array.isArray(input.limitations)
    || input.limitations.some((v: unknown) => typeof v !== 'string' || !v.trim())
    || !Array.isArray(input.findings)) throw new Error('Invalid review status, limitations, or findings');
  if (input.status === 'incomplete' && input.limitations.length === 0) {
    throw new Error('Incomplete reviews require a limitation explaining the missing context');
  }
  const findings = input.findings.map((f: any) => {
    if (!f || typeof f !== 'object') throw new Error('Invalid review finding');
    const message = f.message || [f.title, f.description, f.suggestion].filter(Boolean).join(' - ');
    if (!['CRITICAL', 'HIGH', 'BUG'].includes(f.severity) || typeof f.file !== 'string' || !f.file.trim()
      || typeof message !== 'string' || !message.trim()
      || (f.line != null && (!Number.isInteger(f.line) || f.line < 1))) throw new Error('Invalid review finding');
    return { severity: f.severity, file: f.file, message, ...(f.line == null ? {} : { line: f.line }) };
  });
  return { snapshot: input.snapshot, status: input.status, limitations: input.limitations, findings };
}

/** Validate the reviewed snapshot before any external writes. */
export async function publishReview(prUrl: string, value: unknown) {
  const submission = parseReviewSubmission(value);
  const data = await fetchReviewData(prUrl);
  if (Object.entries(data.snapshot).some(([key, hash]) => submission.snapshot[key as keyof typeof data.snapshot] !== hash)) {
    throw new Error('PR source, destination, or diff changed since review; fetch and review again before publishing');
  }
  let inlineResults: { file: string; line: number; success: boolean }[];
  try {
    inlineResults = await postBitbucketComments(data.prInfo, data.bbConfig, submission.findings,
      data.metadata.qualityWarnings ?? [], submission);
  } catch {
    return { success: false, bitbucket: { success: false }, inlineResults: [], jiraResults: [] };
  }
  const canonicalUrl = `https://bitbucket.org/${data.prInfo.workspace}/${data.prInfo.repoSlug}/pull-requests/${data.prInfo.prNumber}`;
  const jiraResults = await postJiraComments(canonicalUrl, data.metadata.title, data.jiraKeys,
    data.jiraConfig, submission.findings, submission);
  return {
    success: inlineResults.every(r => r.success) && jiraResults.every(r => r.success),
    bitbucket: { success: true }, inlineResults, jiraResults,
  };
}
