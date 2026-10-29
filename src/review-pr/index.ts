import type { PRInfo, ReviewFinding, BitbucketConfig, JiraConfig, ReviewSnapshot, ReviewSubmission } from './types.ts';
import { createHash } from 'node:crypto';
import { parsePRURL } from './url-parser.ts';
import { extractJiraKeys } from './jira-detector.ts';
import { buildReviewPrompt } from './prompts.ts';
import { fetchPRInfo, fetchPRDiff, postGeneralComment, postInlineComment, upsertReviewComment } from './bitbucket-client.ts';
import { addIssueCommentADF, upsertReviewIssueComment } from './jira-client.ts';

// ---------------------------------------------------------------------------
// Config loaders
// ---------------------------------------------------------------------------

/**
 * Load Bitbucket configuration from environment variables.
 * Requires BITBUCKET_EMAIL and BITBUCKET_API_TOKEN.
 * Throws if any required variable is missing or empty.
 */
export function loadBitbucketConfig(): BitbucketConfig {
  const email = process.env.BITBUCKET_EMAIL;
  const apiToken = process.env.BITBUCKET_API_TOKEN;

  if (!apiToken) {
    throw new Error(
      'Missing BITBUCKET_API_TOKEN environment variable. Set BITBUCKET_API_TOKEN in .env or export it.',
    );
  }

  return { email: email || undefined, apiToken };
}

/**
 * Load Jira configuration from environment variables.
 * Requires JIRA_EMAIL, JIRA_API_TOKEN, JIRA_URL, and JIRA_PROJECT_KEY.
 * Throws if any required variable is missing or empty.
 */
export function loadJiraConfig(): JiraConfig {
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const baseUrl = process.env.JIRA_URL;
  const projectKey = process.env.JIRA_PROJECT_KEY;

  if (!email) {
    throw new Error(
      'Missing JIRA_EMAIL environment variable. Set JIRA_EMAIL in .env or export it.',
    );
  }
  if (!apiToken) {
    throw new Error(
      'Missing JIRA_API_TOKEN environment variable. Set JIRA_API_TOKEN in .env or export it.',
    );
  }
  if (!baseUrl) {
    throw new Error(
      'Missing JIRA_URL environment variable. Set JIRA_URL in .env or export it.',
    );
  }
  if (!projectKey) {
    throw new Error(
      'Missing JIRA_PROJECT_KEY environment variable. Set JIRA_PROJECT_KEY in .env or export it.',
    );
  }

  return { email, apiToken, baseUrl, projectKey };
}

// ---------------------------------------------------------------------------
// Review data fetch
// ---------------------------------------------------------------------------

/**
 * Fetch all data needed to review a pull request.
 *
 * 1. Parses the Bitbucket PR URL into PRInfo
 * 2. Loads both Bitbucket and Jira configs from env
 * 3. Fetches the diff between two matching reads of the PR heads
 * 4. Extracts Jira issue keys from PR metadata
 * 5. Builds the review prompt string
 *
 * Returns a complete data bundle ready for the LLM to consume.
 */
export async function fetchReviewData(
  prUrl: string,
): Promise<{
  prInfo: PRInfo;
  prUrl: string;
  metadata: import('./types.ts').PRMetadata;
  diff: string;
  jiraKeys: string[];
  bbConfig: BitbucketConfig;
  jiraConfig: JiraConfig;
  reviewPrompt: string;
  snapshot: ReviewSnapshot;
}> {
  const prInfo = parsePRURL(prUrl);
  const bbConfig = loadBitbucketConfig();
  const jiraConfig = loadJiraConfig();

  const metadata = await fetchPRInfo(prInfo, bbConfig);
  const diff = await fetchPRDiff(prInfo, bbConfig);
  const after = await fetchPRInfo(prInfo, bbConfig);
  if (!metadata.sourceCommit || !metadata.destinationCommit) throw new Error('PR commit hashes are missing; review incomplete');
  if (metadata.sourceCommit !== after.sourceCommit || metadata.destinationCommit !== after.destinationCommit) {
    throw new Error('PR changed while fetching; fetch and review again');
  }
  if (diff.trim() && !/^(diff --git |--- )/.test(diff)) throw new Error('Invalid diff; review incomplete');
  const snapshot = {
    sourceCommit: metadata.sourceCommit,
    destinationCommit: metadata.destinationCommit,
    diffHash: createHash('sha256').update(diff).digest('hex'),
  };

  const jiraKeys = extractJiraKeys(metadata);
  
  // PR Hygiene & Description Quality Check
  const qualityWarnings: string[] = [];
  if (!metadata.description || metadata.description.trim().length < 15) {
    qualityWarnings.push('PR Description is missing or too short. Provide a clear summary of changes.');
  }
  if (jiraKeys.length === 0) {
    qualityWarnings.push('No linked Jira issue found in PR title, source branch, or explicit description links.');
  }

  const reviewPrompt = buildReviewPrompt(diff, metadata.title, metadata.description, snapshot);

  return { prInfo, prUrl, metadata: { ...metadata, qualityWarnings }, diff, jiraKeys, bbConfig, jiraConfig, reviewPrompt, snapshot };
}

// ---------------------------------------------------------------------------
// Bitbucket comment posting
// ---------------------------------------------------------------------------

/**
 * Post review findings as comments on a Bitbucket pull request.
 *
 * - If a complete review has no findings, posts a single "NO ISSUES FOUND" comment.
 * - Incomplete reviews are marked as incomplete and never claim a clean result.
 * - Otherwise posts a grouped general comment (CRITICAL > HIGH > BUG) with
 *   each finding formatted as `\`file:line\` — message`.
 * - Also posts inline comments on the affected lines with a `[SEVERITY]` prefix.
 * - Returns per-inline publication results, including failed anchors.
 */
export async function postBitbucketComments(
  prInfo: PRInfo,
  bbConfig: BitbucketConfig,
  findings: ReviewFinding[],
  qualityWarnings: string[] = [],
  submission?: ReviewSubmission,
): Promise<{ file: string; line: number; success: boolean }[]> {
  const lines: string[] = [];
  if (submission) {
    lines.push(`Reviewed source ${submission.snapshot.sourceCommit}; destination ${submission.snapshot.destinationCommit}.`);
    if (submission.status === 'incomplete') lines.push('**REVIEW INCOMPLETE**');
    for (const limitation of submission.limitations) lines.push(`- Limitation: ${limitation}`);
  }

  // PR Quality Warnings Header
  if (qualityWarnings.length > 0) {
    lines.push('## ⚠️ PR Quality Alerts');
    for (const warn of qualityWarnings) {
      lines.push(`- **Warning:** ${warn}`);
    }
    lines.push('');
  }

  if (findings.length === 0 && submission?.status !== 'incomplete') {
    lines.push('**NO ISSUES FOUND** – No definitive bugs found within the reviewed scope. This is not merge approval.');
  } else {
    // Build grouped general comment
    const groups: Record<string, ReviewFinding[]> = { CRITICAL: [], HIGH: [], BUG: [] };
    for (const f of findings) {
      if (groups[f.severity]) {
        groups[f.severity].push(f);
      }
    }

    for (const severity of ['CRITICAL', 'HIGH', 'BUG'] as const) {
      const group = groups[severity];
      if (!group || group.length === 0) continue;

      lines.push(`### ${severity}`);
      lines.push('');
      for (const f of group) {
        const location = f.line != null ? `\`${f.file}:${f.line}\`` : `\`${f.file}\``;
        lines.push(`- ${location} — ${f.message}`);
      }
      lines.push('');
    }
  }

  // Next Steps Guidance
  lines.push('## 🎯 Next Steps');
  if (findings.length > 0) {
    const hasCritical = findings.some(f => f.severity === 'CRITICAL');
    const hasHigh = findings.some(f => f.severity === 'HIGH');
    
    if (hasCritical) {
      lines.push('1. 🚨 **Action Required:** Fix the Critical security vulnerabilities before merging.');
    }
    if (hasHigh) {
      lines.push(`${hasCritical ? '2' : '1'}. 🛠 **Action Required:** Fix the High severity logic bugs.`);
    }
    lines.push(`${(hasCritical || hasHigh) ? '3' : '1'}. 🧪 Retest the changes in staging environment.`);
  } else {
    lines.push(submission?.status === 'incomplete'
      ? 'Complete the missing review context before drawing a conclusion.'
      : 'Review CI and any stated limitations before deciding whether to merge.');
  }
  if (qualityWarnings.length > 0) {
    lines.push('- 📝 Please update the PR description to link the correct Jira ticket and clarify changes.');
  }
  lines.push('');

  const generalComment = lines.join('\n');
  if (submission) await upsertReviewComment(prInfo, bbConfig, generalComment);
  else await postGeneralComment(prInfo, bbConfig, generalComment);

  const inlineResults: { file: string; line: number; success: boolean }[] = [];
  const inlineGroups = new Map<string, ReviewFinding[]>();
  for (const f of findings) {
    if (f.line == null) continue;
    const key = JSON.stringify([f.file, f.line]);
    const group = inlineGroups.get(key) ?? [];
    group.push(f);
    inlineGroups.set(key, group);
  }

  for (const group of inlineGroups.values()) {
    const f = group[0];
    const line = f.line!;
    const message = group.map(finding => `[${finding.severity}] ${finding.message}`).join('\n\n');
    try {
      if (submission) await upsertReviewComment(prInfo, bbConfig, `${message}\nReviewed source ${submission.snapshot.sourceCommit}.`, { path: f.file, to: line }, submission.snapshot.sourceCommit);
      else await postInlineComment(prInfo, bbConfig, message, f.file, line);
      inlineResults.push({ file: f.file, line, success: true });
    } catch {
      inlineResults.push({ file: f.file, line, success: false });
    }
  }
  return inlineResults;
}

// ---------------------------------------------------------------------------
// Jira comment posting
// ---------------------------------------------------------------------------

/**
 * Post cross-reference and findings-summary comments to Jira issues.
 *
 * For each Jira key:
 * - Always posts a cross-reference comment with the PR title/URL.
 * - If findings exist, also posts a summary with severity counts.
 *
 * Errors for individual keys are caught so a single failure doesn't
 * block the remaining keys. Returns a results array indicating which
 * keys succeeded and which failed.
 */
export async function postJiraComments(
  prUrl: string,
  prTitle: string,
  jiraKeys: string[],
  jiraConfig: JiraConfig,
  findings: ReviewFinding[],
  submission?: ReviewSubmission,
): Promise<{ key: string; success: boolean }[]> {
  const results: { key: string; success: boolean }[] = [];

  // Count findings by severity
  const severityCounts = { CRITICAL: 0, HIGH: 0, BUG: 0 };
  for (const f of findings) {
    if (f.severity in severityCounts) {
      severityCounts[f.severity as keyof typeof severityCounts]++;
    }
  }

  for (const key of jiraKeys) {
    try {
      // Build one combined ADF comment with a clickable PR link + review summary.
      const paragraphs: Array<Record<string, unknown>> = [];

      // Paragraph 1: cross-reference with clickable PR title link
      paragraphs.push({
        type: 'paragraph',
        content: [
          { type: 'text', text: 'A pull request was reviewed: ' },
          {
            type: 'text',
            text: prTitle,
            marks: [{ type: 'link', attrs: { href: prUrl } }],
          },
        ],
      });

      // Paragraph 2: review summary heading
      paragraphs.push({
        type: 'paragraph',
        content: [{ type: 'text', text: 'Review summary:' }],
      });

      if (submission) {
        paragraphs.push({ type: 'paragraph', content: [{ type: 'text', text:
          `Source ${submission.snapshot.sourceCommit}; destination ${submission.snapshot.destinationCommit}. ${submission.limitations.join('; ')}` }] });
      }
      if (submission?.status === 'incomplete') {
        paragraphs.push({ type: 'paragraph', content: [{ type: 'text', text: 'REVIEW INCOMPLETE' }] });
      }
      if (findings.length === 0 && submission?.status !== 'incomplete') {
        paragraphs.push({
          type: 'paragraph',
          content: [{ type: 'text', text: '- NO ISSUES FOUND within the reviewed scope; not merge approval.' }],
        });
      } else {
        paragraphs.push({
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text:
                `- ${findings.length} issue(s) found: ` +
                `${severityCounts.CRITICAL} Critical, ${severityCounts.HIGH} High, ${severityCounts.BUG} Bug`,
            },
          ],
        });

        // One paragraph per finding (plain severity prefix, no [SEVERITY] brackets)
        for (const f of findings) {
          const location = f.line != null ? `${f.file}:${f.line}` : f.file;
          paragraphs.push({
            type: 'paragraph',
            content: [
              { type: 'text', text: `- ${f.severity} ${location} — ${f.message}` },
            ],
          });
        }
      }

      // Closing paragraph
      paragraphs.push({
        type: 'paragraph',
        content: [{ type: 'text', text: 'See PR comments for details.' }],
      });

      const doc = {
        type: 'doc',
        version: 1,
        content: paragraphs,
      };
      if (submission) await upsertReviewIssueComment(key, jiraConfig, prUrl, doc);
      else await addIssueCommentADF(key, jiraConfig, doc);

      results.push({ key, success: true });
    } catch {
      results.push({ key, success: false });
    }
  }

  return results;
}
