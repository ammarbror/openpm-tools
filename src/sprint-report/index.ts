import type { JiraConfig, SprintReport, SprintIssue, IssueBreakdown, AssigneeBalanceEntry } from '../review-pr/types.ts';
import { loadJiraConfig } from '../review-pr/index.ts';
import {
  findBoards,
  findTargetSprint,
  findSprintByName,
  searchJqlAll,
  getSprints,
} from '../review-pr/jira-client.ts';
import type { JiraSprint, JiraIssue } from '../review-pr/jira-client.ts';

export type { JiraConfig, SprintReport };

export { loadJiraConfig };

export interface SprintReportParams {
  sprintName?: string;
}

export interface SprintReportResult {
  report: SprintReport;
  markdown: string;
}

const SPRINT_REPORT_FIELDS = [
  'summary',
  'status',
  'statuscategory',
  'issuetype',
  'assignee',
  'resolution',
  'resolutiondate',
  'priority',
  'created',
];

function mapIssue(issue: JiraIssue): SprintIssue {
  const statusCategoryKey = issue.fields.status?.statusCategory?.key;
  const statusName = issue.fields.status?.name ?? 'Unknown';

  let statusCategory: 'done' | 'in_progress' | 'to_do';
  if (statusCategoryKey === 'done') {
    statusCategory = 'done';
  } else if (statusCategoryKey === 'indeterminate') {
    statusCategory = 'in_progress';
  } else if (statusCategoryKey === 'new') {
    statusCategory = 'to_do';
  } else {
    statusCategory = categorizeStatusByName(statusName);
  }

  return {
    key: issue.key,
    summary: issue.fields.summary ?? '',
    status: statusName,
    statusCategory,
    issueType: issue.fields.issuetype?.name ?? 'Unknown',
    assignee: issue.fields.assignee?.displayName ?? null,
    priority: issue.fields.priority?.name ?? 'None',
    resolution: issue.fields.resolution?.name,
    resolutionDate: issue.fields.resolutiondate,
    created: issue.fields.created ?? '',
  };
}

function categorizeStatusByName(statusName: string): 'done' | 'in_progress' | 'to_do' {
  const doneStatuses = ['done', 'closed', 'resolved', 'completed'];
  const inProgressStatuses = ['in progress', 'in review', 'review', 'in dev', 'development', 'implementing'];
  const lower = statusName.toLowerCase();
  if (doneStatuses.includes(lower)) return 'done';
  if (inProgressStatuses.includes(lower)) return 'in_progress';
  return 'to_do';
}

function calculateBreakdown(issues: SprintIssue[], sprintStartDate?: string): IssueBreakdown {
  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byAssignee: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  let completed = 0;
  let incomplete = 0;
  const issuesAddedAfter: SprintIssue[] = [];

  for (const issue of issues) {
    byType[issue.issueType] = (byType[issue.issueType] ?? 0) + 1;
    byStatus[issue.status] = (byStatus[issue.status] ?? 0) + 1;
    const assignee = issue.assignee ?? 'Unassigned';
    byAssignee[assignee] = (byAssignee[assignee] ?? 0) + 1;
    byPriority[issue.priority] = (byPriority[issue.priority] ?? 0) + 1;

    if (issue.statusCategory === 'done') {
      completed++;
    } else {
      incomplete++;
    }

    if (sprintStartDate && issue.created && new Date(issue.created) > new Date(sprintStartDate)) {
      issuesAddedAfter.push(issue);
    }
  }

  return {
    total: issues.length,
    byType,
    byStatus,
    byAssignee,
    byPriority,
    scopeChangeCount: issuesAddedAfter.length,
    completed,
    incomplete,
    issuesAddedAfterSprintStart: issuesAddedAfter,
  };
}

function buildInsights(report: SprintReport): string[] {
  const insights: string[] = [];
  const m = report.metrics;
  const b = report.breakdowns;

  const scopeChangeRateNum = m.scopeChangeRate === 'N/A' ? 0 : parseInt(m.scopeChangeRate, 10);
  const scopeChangeCount = report.issuesAddedAfterSprintStart.length;

  if (m.scopeChangeRate !== 'N/A' && scopeChangeRateNum >= 30) {
    insights.push(
      `Scope change: ${m.scopeChangeRate} of issues (${scopeChangeCount}) were added after sprint start. Lock scope at sprint planning to protect the team's commitment.`,
    );
  }

  if (m.carriedOverIssues > 0) {
    insights.push(
      `${m.carriedOverIssues} issue(s) carried over unfinished. Consider a smaller sprint commitment or breaking large items into subtasks next sprint.`,
    );
  }

  const completionRateNum = m.completionRate === 'N/A' ? 100 : parseInt(m.completionRate, 10);
  if (completionRateNum < 70 && m.totalIssues > 0) {
    insights.push(
      `Completion rate is ${m.completionRate}. Investigate blockers in the Incomplete Issues section and review estimation accuracy.`,
    );
  }

  for (const entry of b.assigneeBalance) {
    if (entry.load === 'overloaded') {
      insights.push(
        `${entry.assignee} is carrying ${entry.share} of the sprint (${entry.count} issues) — risk of bottleneck. Rebalance work or pair on the load.`,
      );
    }
  }

  for (const entry of b.assigneeBalance) {
    if (entry.load === 'unassigned' && entry.count > 0) {
      insights.push(
        `${entry.count} issue(s) are unassigned. Assign owners before the next sprint to avoid drift.`,
      );
      break;
    }
  }

  if (insights.length === 0 && m.totalIssues > 0) {
    insights.push(
      `Sprint looks healthy: ${m.completionRate} completion with manageable scope change. Keep the cadence.`,
    );
  }

  return insights;
}

function formatMarkdown(report: SprintReport): string {
  const s = report.sprint;
  const m = report.metrics;
  const b = report.breakdowns;

  function fmtDate(d: string): string {
    return new Date(d).toISOString().slice(0, 10);
  }

  let md = `# Sprint Report: ${s.name}\n\n`;
  md += `**Board:** ${s.boardName}  \n`;
  md += `**State:** ${s.state}  \n`;
  if (s.startDate) md += `**Start:** ${fmtDate(s.startDate)}  \n`;
  if (s.endDate) md += `**End:** ${fmtDate(s.endDate)}  \n`;
  if (s.durationDays) md += `**Duration:** ${s.durationDays} days  \n`;
  md += '\n';

  md += `## Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Issues | ${m.totalIssues} |\n`;
  md += `| Completed | ${m.completedIssues} |\n`;
  md += `| Incomplete | ${m.incompleteIssues} |\n`;
  md += `| Completion Rate | ${m.completionRate} |\n`;
  md += `| Scope Change Rate | ${m.scopeChangeRate} |\n`;
  md += `| Carried Over | ${m.carriedOverIssues} |\n`;
  md += '\n';

  md += `## By Issue Type\n\n`;
  md += `| Type | Count |\n`;
  md += `|------|-------|\n`;
  for (const [type, count] of Object.entries(b.byType).sort((a, b) => b[1] - a[1])) {
    md += `| ${type} | ${count} |\n`;
  }
  md += '\n';

  md += `## By Status\n\n`;
  md += `| Status | Count |\n`;
  md += `|--------|-------|\n`;
  for (const [status, count] of Object.entries(b.byStatus).sort((a, b) => b[1] - a[1])) {
    md += `| ${status} | ${count} |\n`;
  }
  md += '\n';

  md += `## By Priority\n\n`;
  md += `| Priority | Count |\n`;
  md += `|----------|-------|\n`;
  for (const [priority, count] of Object.entries(b.byPriority).sort((a, b) => b[1] - a[1])) {
    md += `| ${priority} | ${count} |\n`;
  }
  md += '\n';

  md += `## By Assignee\n\n`;
  md += `| Assignee | Count | Share | Load |\n`;
  md += `|----------|-------|-------|------|\n`;
  for (const entry of b.assigneeBalance) {
    md += `| ${entry.assignee} | ${entry.count} | ${entry.share} | ${entry.load} |\n`;
  }
  md += '\n';

  if (report.incompleteIssues.length > 0) {
    md += `## Incomplete / Carryover Issues (${report.incompleteIssues.length})\n\n`;
    for (const issue of report.incompleteIssues) {
      md += `- **${issue.key}** — ${issue.summary} [${issue.status}] (${issue.assignee ?? 'Unassigned'})\n`;
    }
    md += '\n';
  }

  if (report.issuesAddedAfterSprintStart.length > 0) {
    md += `> ${report.issuesAddedAfterSprintStart.length} issue(s) were added after sprint start (scope change). See Scope Change Rate above.\n\n`;
  }

  md += `## Insights & Suggestions\n\n`;
  if (report.insights.length > 0) {
    for (const insight of report.insights) {
      md += `- ${insight}\n`;
    }
  } else {
    md += `No specific risks detected — sprint looks on track.\n`;
  }
  md += '\n';

  return md;
}

export async function generateSprintReportWorkflow(
  config: JiraConfig,
  params: SprintReportParams,
): Promise<SprintReportResult> {
  let sprint: JiraSprint | null;
  let boardName: string;

  if (params.sprintName) {
    sprint = await findSprintByName(config, params.sprintName);
    if (!sprint) {
      throw new Error(
        `Sprint "${params.sprintName}" not found. Check the sprint name or number.`,
      );
    }
    const boards = await findBoards(config);
    boardName = boards.length > 0 ? boards[0].name : 'N/A';
  } else {
    const boards = await findBoards(config);
    if (boards.length === 0) {
      throw new Error(
        `No boards found for project "${config.projectKey}".`,
      );
    }
    boardName = boards[0].name;
    sprint = await findTargetSprint(config, boards[0].id);
    if (!sprint) {
      throw new Error(
        `No active or future sprint found for board "${boardName}".`,
      );
    }
  }

  const jql = `project = ${config.projectKey} AND sprint = ${sprint.id}`;
  const issues = await searchJqlAll(config, jql, {
    fields: SPRINT_REPORT_FIELDS,
    maxResults: 100,
  });

  const sprintIssues = issues.map(mapIssue);
  const breakdown = calculateBreakdown(sprintIssues, sprint.startDate);
  const completedIssues = sprintIssues.filter(i => i.statusCategory === 'done');
  const incompleteIssues = sprintIssues.filter(i => i.statusCategory !== 'done');

  let durationDays: number | undefined;
  if (sprint.startDate && sprint.endDate) {
    const start = new Date(sprint.startDate).getTime();
    const end = new Date(sprint.endDate).getTime();
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      durationDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    }
  }

  const totalIssues = sprintIssues.length;
  const completedCount = breakdown.completed;
  const completionRate = totalIssues > 0
    ? `${Math.round((completedCount / totalIssues) * 100)}%`
    : 'N/A';
  const scopeChangeRate = totalIssues > 0
    ? `${Math.round((breakdown.scopeChangeCount / totalIssues) * 100)}%`
    : 'N/A';

  const assigneeBalance: AssigneeBalanceEntry[] = Object.entries(breakdown.byAssignee)
    .map(([assignee, count]) => {
      const share = totalIssues > 0 ? `${Math.round((count / totalIssues) * 100)}%` : '0%';
      let load: AssigneeBalanceEntry['load'];
      if (assignee === 'Unassigned') {
        load = 'unassigned';
      } else if (parseInt(share, 10) >= 40) {
        load = 'overloaded';
      } else if (count === 0) {
        load = 'idle';
      } else {
        load = 'balanced';
      }
      return { assignee, count, share, load };
    })
    .sort((a, b) => b.count - a.count);

  const report: SprintReport = {
    sprint: {
      id: sprint.id,
      name: sprint.name,
      state: sprint.state,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      durationDays,
      boardName: boardName ?? 'N/A',
    },
    metrics: {
      totalIssues,
      completedIssues: completedCount,
      incompleteIssues: totalIssues - completedCount,
      completionRate,
      scopeChangeRate,
      carriedOverIssues: totalIssues - completedCount,
    },
    breakdowns: {
      byType: breakdown.byType,
      byStatus: breakdown.byStatus,
      byAssignee: breakdown.byAssignee,
      byPriority: breakdown.byPriority,
      assigneeBalance,
    },
    completedIssues,
    incompleteIssues,
    issuesAddedAfterSprintStart: breakdown.issuesAddedAfterSprintStart,
    insights: [],
  };

  report.insights = buildInsights(report);

  const markdown = formatMarkdown(report);

  return { report, markdown };
}

export async function runFromEnv(params: SprintReportParams): Promise<string> {
  const config = loadJiraConfig();
  const result = await generateSprintReportWorkflow(config, params);
  return result.markdown;
}
