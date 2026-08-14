import { loadJiraConfig, loadBitbucketConfig } from '../review-pr/index.ts';
import type { JiraConfig, BitbucketConfig } from '../review-pr/types.ts';

export interface StandupItem {
  key: string;
  summary: string;
  status: string;
  assignee: string;
  priority: string;
  updatedAt: string;
}

export interface StandupReport {
  date: string;
  completedYesterday: StandupItem[];
  inProgressToday: StandupItem[];
  blockers: StandupItem[];
}

async function jiraFetch<T>(
  url: string,
  config: JiraConfig,
  options: RequestInit = {},
): Promise<T> {
  const encoded = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
  const headers: Record<string, string> = {
    Authorization: `Basic ${encoded}`,
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Jira API error: ${response.status}${text ? ` — ${text}` : ''}`);
  }
  return response.json() as Promise<T>;
}

export async function generateStandupReport(assigneeName?: string): Promise<StandupReport> {
  const jiraConfig = loadJiraConfig();
  
  // Build JQL search query
  let jql = `project = "${jiraConfig.projectKey}" AND updated >= -2d ORDER BY updated DESC`;
  if (assigneeName) {
    jql = `project = "${jiraConfig.projectKey}" AND assignee ~ "${assigneeName}" AND updated >= -3d ORDER BY updated DESC`;
  }

  const searchUrl = `${jiraConfig.baseUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=50&fields=summary,status,priority,assignee,updated`;
  
  interface JiraSearchResp {
    issues: Array<{
      key: string;
      fields: {
        summary: string;
        status: { name: string; statusCategory: { key: string } };
        priority: { name: string };
        assignee?: { displayName: string };
        updated: string;
      };
    }>;
  }

  const data = await jiraFetch<JiraSearchResp>(searchUrl, jiraConfig);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const completedYesterday: StandupItem[] = [];
  const inProgressToday: StandupItem[] = [];
  const blockers: StandupItem[] = [];

  for (const issue of data.issues || []) {
    const item: StandupItem = {
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      priority: issue.fields.priority?.name || 'Medium',
      updatedAt: issue.fields.updated,
    };

    const statusCategory = issue.fields.status.statusCategory?.key;

    if (item.priority.toLowerCase().includes('blocker') || item.priority.toLowerCase().includes('highest') || item.priority === 'P0' || item.priority === 'P1') {
      blockers.push(item);
    }

    if (statusCategory === 'done') {
      completedYesterday.push(item);
    } else if (statusCategory === 'indeterminate' || item.status.toLowerCase().includes('progress')) {
      inProgressToday.push(item);
    }
  }

  return {
    date: todayStr,
    completedYesterday,
    inProgressToday,
    blockers,
  };
}

export function formatStandupMarkdown(report: StandupReport): string {
  let md = `## ☀️ Daily Standup Report — ${report.date}\n\n`;

  md += `### 🟢 Progress (Completed / Moved to Done)\n`;
  if (report.completedYesterday.length === 0) {
    md += `- *No issues completed recently*\n`;
  } else {
    for (const item of report.completedYesterday) {
      md += `- **[${item.key}]** ${item.summary} \`(${item.status})\` — *@${item.assignee}*\n`;
    }
  }

  md += `\n### 🎯 Today's Focus (In Progress)\n`;
  if (report.inProgressToday.length === 0) {
    md += `- *No active tasks in progress*\n`;
  } else {
    for (const item of report.inProgressToday) {
      md += `- **[${item.key}]** ${item.summary} \`(${item.status})\` — *@${item.assignee}*\n`;
    }
  }

  md += `\n### 🚧 Risks & Blockers\n`;
  if (report.blockers.length === 0) {
    md += `- *No active blockers reported*\n`;
  } else {
    for (const item of report.blockers) {
      md += `- ⚠️ **[${item.key}]** ${item.summary} [Priority: ${item.priority}] — *@${item.assignee}*\n`;
    }
  }

  return md;
}
