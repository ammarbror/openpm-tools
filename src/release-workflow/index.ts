import { mkdir, writeFile } from 'node:fs/promises';
import { findBoards, findTargetSprint, searchJqlAll, getProject, createVersion, addFixVersionToIssue, type JiraIssue } from '../review-pr/jira-client.js';
import { loadJiraConfig } from '../review-pr/index.js';
import type { JiraVersion } from '../review-pr/types.js';

export interface ReleaseWorkflowResult {
  version: JiraVersion | null;
  issueCount: number;
  releaseNotesPath: string;
  issues: JiraIssue[];
}

export function defaultVersionName(date?: Date): string {
  const d = date ?? new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `Release ${yyyy}-${mm}-${dd}`;
}

export function cleanSummary(summary?: string | null): string {
  if (summary == null) {
    return '';
  }
  
  const trimmed = summary.trim();
  if (!trimmed) {
    return '';
  }
  
  const stripped = trimmed.replace(/^\s*(\[[^\]]*\]\s*)+/, '');
  const result = stripped.replace(/\s+/g, ' ').trim();
  
  if (!result) {
    return trimmed;
  }
  
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export function groupIssuesByType(issues: JiraIssue[]): Record<string, JiraIssue[]> {
  const groups: Record<string, JiraIssue[]> = {
    Features: [],
    Bugs: [],
    Tasks: [],
    Epics: [],
    Other: [],
  };

for (const issue of issues) {
     const type = issue.fields.issuetype?.name;
     if (type === 'Story') {
       groups.Features.push(issue);
     } else if (type === 'Bug') {
       groups.Bugs.push(issue);
     } else if (type === 'Task') {
       groups.Tasks.push(issue);
     } else if (type === 'Epic') {
       groups.Epics.push(issue);
     } else {
       groups.Other.push(issue);
     }
   }

  return groups;
}

export function generateReleaseNotes(issues: JiraIssue[], versionName: string, date?: Date): string {
  const d = date ?? new Date();
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const groups = groupIssuesByType(issues);

  const lines: string[] = [`# Release ${versionName}`, `Date: ${dateStr}`];

  const order: Array<keyof typeof groups> = ['Features', 'Bugs', 'Tasks', 'Epics', 'Other'];

  for (const group of order) {
    const groupIssues = groups[group];
    if (groupIssues.length === 0) {
      continue;
    }
    lines.push('', `## ${group}`);
    for (const issue of groupIssues) {
      lines.push(`- [${issue.key}] ${cleanSummary(issue.fields.summary)}`);
    }
  }

  return lines.join('\n');
}

export async function releaseWorkflowRun(options?: { versionName?: string }): Promise<ReleaseWorkflowResult> {
  const config = loadJiraConfig();

  const boards = await findBoards(config);
  if (boards.length === 0) {
    throw new Error('No Jira board found for project ' + config.projectKey);
  }

  const sprint = await findTargetSprint(config, boards[0].id);
  if (!sprint) {
    throw new Error('No active or future sprint found for project ' + config.projectKey);
  }

  const jql = `project = ${config.projectKey} AND sprint = ${sprint.id} AND status = "Ready for Release"`;
  const issues = await searchJqlAll(config, jql, { fields: ['key', 'summary', 'status', 'issuetype'] });

  if (issues.length === 0) {
    console.log(`No issues with status "Ready for Release" found in project ${config.projectKey}. Exiting without creating a release.`);
    return { version: null, issueCount: 0, releaseNotesPath: '', issues: [] };
  }

  const project = await getProject(config, config.projectKey);
  const projectId = Number(project.id);

  const versionName = options?.versionName ?? defaultVersionName();
  const notes = generateReleaseNotes(issues, versionName);

  const version = await createVersion(config, { name: versionName, projectId, description: notes, archived: false });

  for (const issue of issues) {
    await addFixVersionToIssue(config, issue.key, version.id);
    console.log('Assigned fixVersion ' + version.name + ' to ' + issue.key);
  }

  const sanitized = versionName.replace(/[^a-zA-Z0-9]+/g, '-');
  const releaseNotesPath = 'release-notes/RELEASE_NOTES_' + sanitized + '.md';
  await mkdir('release-notes', { recursive: true });
  await writeFile(releaseNotesPath, notes, 'utf8');

  return { version, issueCount: issues.length, releaseNotesPath, issues };
}

export async function runFromEnv(options?: { versionName?: string }): Promise<ReleaseWorkflowResult> {
  let resolvedOptions = options;
  if (!resolvedOptions) {
    const argv = process.argv;
    const flagIndex = argv.indexOf('--version-name');
    if (flagIndex !== -1 && argv[flagIndex + 1]) {
      resolvedOptions = { versionName: argv[flagIndex + 1] };
    }
  }

  try {
    const result = await releaseWorkflowRun(resolvedOptions);
    console.log(`Release workflow completed. Issues released: ${result.issueCount}`);
    if (result.releaseNotesPath) {
      console.log(`Release notes written to: ${result.releaseNotesPath}`);
    }
    return result;
  } catch (error) {
    console.error('Release workflow failed:', error);
    process.exitCode = 1;
    throw error;
  }
}