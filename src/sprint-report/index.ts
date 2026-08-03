import type {
  JiraConfig,
  SprintReport,
  SprintIssue,
  IssueBreakdown,
  AssigneeBalanceEntry,
  DailyBurndownPoint,
} from '../review-pr/types.ts';
import { loadJiraConfig } from '../review-pr/index.ts';
import {
  findBoards,
  findTargetSprint,
  findSprintByName,
  searchJqlAll,
  getSprints,
  findStoryPointsField,
} from '../review-pr/jira-client.ts';
import type { JiraSprint, JiraIssue } from '../review-pr/jira-client.ts';
import { writeFileSync, statSync } from 'node:fs';

export type { JiraConfig, SprintReport };

export { loadJiraConfig };

export interface SprintReportParams {
  sprintName?: string;
  exportHtml?: string;
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
  'flagged',
];

function mapIssue(issue: JiraIssue, storyPointsFieldId?: string): SprintIssue {
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

  let storyPoints: number | undefined;
  if (storyPointsFieldId) {
    const raw = issue.fields[storyPointsFieldId] as number | string | undefined;
    if (typeof raw === 'number') {
      storyPoints = raw;
    } else if (typeof raw === 'string') {
      const parsed = parseFloat(raw);
      storyPoints = Number.isNaN(parsed) ? undefined : parsed;
    }
  }

  const flaggedRaw = issue.fields.flagged;
  const flagged = typeof flaggedRaw === 'boolean' ? flaggedRaw : false;

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
    storyPoints,
    flagged,
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
  const pointsByAssignee: Record<string, number> = {};
  let completed = 0;
  let incomplete = 0;
  const issuesAddedAfter: SprintIssue[] = [];

  for (const issue of issues) {
    byType[issue.issueType] = (byType[issue.issueType] ?? 0) + 1;
    byStatus[issue.status] = (byStatus[issue.status] ?? 0) + 1;
    const assignee = issue.assignee ?? 'Unassigned';
    byAssignee[assignee] = (byAssignee[assignee] ?? 0) + 1;
    byPriority[issue.priority] = (byPriority[issue.priority] ?? 0) + 1;

    if (typeof issue.storyPoints === 'number') {
      pointsByAssignee[assignee] = (pointsByAssignee[assignee] ?? 0) + issue.storyPoints;
    }

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
    pointsByAssignee,
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

  if (report.blockers.length > 0) {
    insights.push(
      `${report.blockers.length} blocker(s) detected (flagged or status "Blocked"). Unblock these before they threaten the sprint commitment.`,
    );
  }

  if (insights.length === 0 && m.totalIssues > 0) {
    insights.push(
      `Sprint looks healthy: ${m.completionRate} completion with manageable scope change. Keep the cadence.`,
    );
  }

  return insights;
}

function makeBar(pct: number, width = 24): string {
  const clamped = Math.max(0, Math.min(100, pct));
  const filled = Math.round((clamped / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${Math.round(clamped)}%`;
}

function findBlockers(issues: SprintIssue[]): SprintIssue[] {
  return issues.filter((issue) => {
    if (issue.statusCategory === 'done') return false;
    if (issue.flagged) return true;
    if (/blocked/i.test(issue.status)) return true;
    return false;
  });
}

function buildBurndown(
  issues: SprintIssue[],
  sprint: JiraSprint,
  committedPoints: number,
): SprintReport['burndown'] {
  if (!sprint.startDate || !sprint.endDate) {
    return { byCount: [], byPoints: [], isEstimated: true };
  }

  const start = new Date(sprint.startDate);
  const end = new Date(sprint.endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return { byCount: [], byPoints: [], isEstimated: true };
  }

  const now = new Date();
  const lastDay = end > now ? now : end;

  const totalIssues = issues.length;
  const totalPoints = committedPoints;

  const days: Date[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const lastMidnight = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate());
  while (cursor <= lastMidnight) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const dayCount = days.length;
  const byCount: DailyBurndownPoint[] = [];
  const byPoints: DailyBurndownPoint[] = [];

  days.forEach((day, idx) => {
    const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
    const resolvedCount = issues.filter((i) => {
      return i.statusCategory === 'done' && i.resolutionDate !== undefined && new Date(i.resolutionDate) <= dayEnd;
    }).length;
    const resolvedPoints = issues.reduce((sum, i) => {
      if (i.statusCategory === 'done' && i.resolutionDate !== undefined && new Date(i.resolutionDate) <= dayEnd) {
        return sum + (typeof i.storyPoints === 'number' ? i.storyPoints : 0);
      }
      return sum;
    }, 0);

    const idealCount = dayCount > 1 ? totalIssues * (1 - idx / (dayCount - 1)) : 0;
    const idealPoints = dayCount > 1 ? totalPoints * (1 - idx / (dayCount - 1)) : 0;

    byCount.push({
      date: day.toISOString().slice(0, 10),
      remaining: totalIssues - resolvedCount,
      ideal: Math.max(0, Math.round(idealCount * 100) / 100),
    });
    byPoints.push({
      date: day.toISOString().slice(0, 10),
      remaining: Math.max(0, Math.round((totalPoints - resolvedPoints) * 100) / 100),
      ideal: Math.max(0, Math.round(idealPoints * 100) / 100),
    });
  });

  return { byCount, byPoints, isEstimated: true };
}

function buildHealth(report: SprintReport): SprintReport['health'] {
  const m = report.metrics;
  const total = report.metrics.totalIssues;

  const completionNum = m.completionRate === 'N/A' ? 100 : parseInt(m.completionRate, 10);
  const scopeNum = m.scopeChangeRate === 'N/A' ? 0 : parseInt(m.scopeChangeRate, 10);
  const scopeStability = Math.max(0, Math.min(100, 100 - scopeNum));

  const carryoverFactor = total > 0
    ? (m.carriedOverIssues === 0 ? 100 : Math.max(0, 100 - (m.carriedOverIssues / total) * 100))
    : 100;

  const blockersFactor = total > 0
    ? (report.blockers.length === 0 ? 100 : Math.max(0, 100 - (report.blockers.length / total) * 100))
    : 100;

  const completion = Math.max(0, Math.min(100, completionNum));

  const factors: { label: string; score: number; detail: string }[] = [
    {
      label: 'Completion',
      score: Math.round(completion),
      detail: m.completionRate === 'N/A' ? 'No issues to complete' : `${m.completionRate} of issues completed`,
    },
    {
      label: 'Scope stability',
      score: Math.round(scopeStability),
      detail: m.scopeChangeRate === 'N/A' ? 'No scope change' : `${m.scopeChangeRate} added after start`,
    },
    {
      label: 'Carryover',
      score: Math.round(carryoverFactor),
      detail: m.carriedOverIssues === 0 ? 'No carryover' : `${m.carriedOverIssues} carried over`,
    },
    {
      label: 'Blockers',
      score: Math.round(blockersFactor),
      detail: report.blockers.length === 0 ? 'No blockers' : `${report.blockers.length} blocker(s)`,
    },
  ];

  const score = Math.round(
    completion * 0.4 + scopeStability * 0.25 + carryoverFactor * 0.2 + blockersFactor * 0.15,
  );

  let grade: SprintReport['health']['grade'];
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return { score, grade, factors };
}

// ── Mermaid chart helpers (Obsidian-native) ──

function mermaidBurndownLine(series: DailyBurndownPoint[], title: string): string {
  if (series.length < 2) return '';
  const dates = series.map((p) => `"${p.date.slice(5)}"`).join(', ');
  const values = series.map((p) => String(p.remaining)).join(', ');
  const ideals = series.map((p) => String(Math.round(p.ideal * 100) / 100)).join(', ');
  const maxVal = Math.max(...series.map((p) => Math.max(p.remaining, Math.ceil(p.ideal))), 1);
  return [
    '```mermaid',
    'xychart-beta',
    `    title "${title}"`,
    `    x-axis "Date" [${dates}]`,
    `    y-axis "Remaining" 0 --> ${Math.ceil(maxVal * 1.1)}`,
    `    line [${values}]`,
    `    line [${ideals}]`,
    '```',
  ].join('\n');
}

function mermaidPie(title: string, data: Record<string, number>): string {
  const entries = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `    "${k}" : ${v}`)
    .join('\n');
  if (!entries) return '';
  return '```mermaid\npie\n    title ' + title + '\n' + entries + '\n```';
}

function mermaidBar(series: { label: string; value: number }[], title: string): string {
  if (series.length === 0) return '';
  const labels = series.map((s) => `"${s.label}"`).join(', ');
  const values = series.map((s) => String(s.value)).join(', ');
  const maxVal = Math.max(...series.map((s) => s.value), 1);
  return [
    '```mermaid',
    'xychart-beta',
    `    title "${title}"`,
    `    x-axis ${labels.length > 1 ? `[${labels}]` : `"${series[0].label}"`}`,
    `    y-axis 0 --> ${Math.ceil(maxVal * 1.2)}`,
    `    bar [${values}]`,
    '```',
  ].join('\n');
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

  if (report.blockers.length > 0) {
    md += `## Blockers\n\n`;
    md += `> The following issues are blocked or flagged and not yet done:\n\n`;
    for (const issue of report.blockers) {
      md += `- **${issue.key}** — ${issue.summary} [${issue.status}] (${issue.assignee ?? 'Unassigned'})\n`;
    }
    md += '\n';
  }

  md += `## Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Issues | ${m.totalIssues} |\n`;
  md += `| Completed | ${m.completedIssues} |\n`;
  md += `| Incomplete | ${m.incompleteIssues} |\n`;
  md += `| Completion Rate | ${report.progressBars.completion} |\n`;
  if (m.committedPoints > 0) {
    md += `| Point Completion | ${report.progressBars.points} |\n`;
  } else {
    md += `| Point Completion | N/A |\n`;
  }
  md += `| Scope Change Rate | ${m.scopeChangeRate} |\n`;
  md += `| Carried Over | ${m.carriedOverIssues} |\n`;
  if (m.committedPoints > 0) {
    md += `| Committed Points | ${m.committedPoints} |\n`;
    md += `| Completed Points | ${m.completedPoints} |\n`;
  }
  md += '\n';

  md += `## Health Scorecard\n\n`;
  md += `**Grade: ${report.health.grade}** — ${report.health.score}/100\n\n`;
  md += `| Factor | Score | Detail |\n`;
  md += `|--------|-------|--------|\n`;
  for (const factor of report.health.factors) {
    md += `| ${factor.label} | ${factor.score} | ${factor.detail} |\n`;
  }
  md += '\n';

  md += `## Burndown (estimated)\n\n`;
  md += `> Estimated — Jira Cloud does not expose historical snapshots.\n\n`;
  const bd = report.burndown;
  if (bd.byCount.length === 0) {
    md += `No burndown available (sprint start/end dates missing).\n\n`;
  } else {
    const sampleStep = bd.byCount.length > 14 ? Math.ceil(bd.byCount.length / 14) : 1;
    md += '```\n';
    md += `date        remaining  ideal\n`;
    bd.byCount.forEach((pt, idx) => {
      if (idx % sampleStep !== 0 && idx !== bd.byCount.length - 1) return;
      const rem = String(pt.remaining).padStart(7);
      const ideal = String(pt.ideal).padStart(7);
      md += `${pt.date}  ${rem}  ${ideal}\n`;
    });
    if (m.committedPoints > 0 && bd.byPoints.length > 0) {
      md += `\npoints burndown:\n`;
      md += `date        remaining  ideal\n`;
      bd.byPoints.forEach((pt, idx) => {
        if (idx % sampleStep !== 0 && idx !== bd.byPoints.length - 1) return;
        const rem = String(pt.remaining).padStart(7);
        const ideal = String(pt.ideal).padStart(7);
        md += `${pt.date}  ${rem}  ${ideal}\n`;
      });
    }
    md += '```\n\n';

    // Mermaid burndown charts
    const bdCountChart = mermaidBurndownLine(bd.byCount, 'Burndown (Issues)');
    if (bdCountChart) {
      md += bdCountChart + '\n\n';
    }
    if (m.committedPoints > 0 && bd.byPoints.length > 0) {
      const bdPointsChart = mermaidBurndownLine(bd.byPoints, 'Burndown (Story Points)');
      if (bdPointsChart) {
        md += bdPointsChart + '\n\n';
      }
    }
  }

  md += `## By Issue Type\n\n`;
  md += `| Type | Count |\n`;
  md += `|------|-------|\n`;
  for (const [type, count] of Object.entries(b.byType).sort((a, b) => b[1] - a[1])) {
    md += `| ${type} | ${count} |\n`;
  }
  md += '\n';

  const typePie = mermaidPie('Issue Types', b.byType);
  if (typePie) {
    md += typePie + '\n\n';
  }

  md += `## By Status\n\n`;
  md += `| Status | Count |\n`;
  md += `|--------|-------|\n`;
  for (const [status, count] of Object.entries(b.byStatus).sort((a, b) => b[1] - a[1])) {
    md += `| ${status} | ${count} |\n`;
  }
  md += '\n';

  const statusPie = mermaidPie('Status Distribution', b.byStatus);
  if (statusPie) {
    md += statusPie + '\n\n';
  }

  md += `## By Priority\n\n`;
  md += `| Priority | Count |\n`;
  md += `|----------|-------|\n`;
  for (const [priority, count] of Object.entries(b.byPriority).sort((a, b) => b[1] - a[1])) {
    md += `| ${priority} | ${count} |\n`;
  }
  md += '\n';

  md += `## By Assignee\n\n`;
  if (m.committedPoints > 0) {
    md += `| Assignee | Count | Share | Load | Points |\n`;
    md += `|----------|-------|-------|------|--------|\n`;
    for (const entry of b.assigneeBalance) {
      md += `| ${entry.assignee} | ${entry.count} | ${entry.share} | ${entry.load} | ${entry.points ?? 0} |\n`;
    }
  } else {
    md += `| Assignee | Count | Share | Load |\n`;
    md += `|----------|-------|-------|------|\n`;
    for (const entry of b.assigneeBalance) {
      md += `| ${entry.assignee} | ${entry.count} | ${entry.share} | ${entry.load} |\n`;
    }
  }
  md += '\n';

  // Mermaid bar chart for assignee workload
  const assigneeBar = mermaidBar(
    b.assigneeBalance.map((e) => ({ label: e.assignee.split(' ')[0] ?? e.assignee, value: e.count })),
    'Issues per Assignee',
  );
  if (assigneeBar) {
    md += assigneeBar + '\n\n';
  }

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

  if (report.blockers.length > 0) {
    md += `## Blockers (detailed)\n\n`;
    for (const issue of report.blockers) {
      const points = typeof issue.storyPoints === 'number' ? ` (${issue.storyPoints} pts)` : '';
      md += `- **${issue.key}** — ${issue.summary} [${issue.status}]${points} (${issue.assignee ?? 'Unassigned'})${issue.flagged ? ' — flagged' : ''}\n`;
    }
    md += '\n';
  }

  return md;
}

export function exportReportHtml(report: SprintReport): string {
  const s = report.sprint;
  const m = report.metrics;
  const b = report.breakdowns;

  function esc(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const gradeColor: Record<string, string> = {
    A: '#1a7f37',
    B: '#3fb950',
    C: '#d29922',
    D: '#db6d28',
    F: '#cf222e',
  };
  const badgeColor = gradeColor[report.health.grade] ?? '#57606a';

  const fmtDate = (d: string): string => new Date(d).toISOString().slice(0, 10);

  // Burndown SVG
  function burndownSvg(series: DailyBurndownPoint[], label: string, color: string): string {
    if (series.length === 0) return '';
    const width = 640;
    const height = 220;
    const padL = 40;
    const padR = 16;
    const padT = 16;
    const padB = 28;
    const maxVal = Math.max(
      ...series.map((p) => Math.max(p.remaining, p.ideal)),
      1,
    );
    const innerW = width - padL - padR;
    const innerH = height - padT - padB;
    const x = (i: number): number =>
      padL + (series.length > 1 ? (i / (series.length - 1)) * innerW : innerW / 2);
    const y = (v: number): number => padT + innerH - (v / maxVal) * innerH;

    const remainingPts = series.map((p, i) => `${x(i)},${y(p.remaining)}`).join(' ');
    const idealPts = series.map((p, i) => `${x(i)},${y(p.ideal)}`).join(' ');

    return `
      <div class="chart-title">${esc(label)}</div>
      <svg viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="${esc(label)}">
        <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + innerH}" stroke="#d0d7de" />
        <line x1="${padL}" y1="${padT + innerH}" x2="${padL + innerW}" y2="${padT + innerH}" stroke="#d0d7de" />
        <polyline points="${idealPts}" fill="none" stroke="#d29922" stroke-dasharray="4 4" stroke-width="2" />
        <polyline points="${remainingPts}" fill="none" stroke="${color}" stroke-width="2" />
        <text x="${padL}" y="${padT + 4}" font-size="10" fill="#57606a">${maxVal}</text>
        <text x="${padL}" y="${padT + innerH}" font-size="10" fill="#57606a">0</text>
        <text x="${padL}" y="${height - 6}" font-size="10" fill="#57606a">${esc(series[0].date)}</text>
        <text x="${padL + innerW}" y="${height - 6}" font-size="10" fill="#57606a" text-anchor="end">${esc(series[series.length - 1].date)}</text>
      </svg>`;
  }

  const svgCount = burndownSvg(report.burndown.byCount, 'Burndown by issue count', '#0969da');
  const svgPoints = report.burndown.byPoints.length > 0 && m.committedPoints > 0
    ? burndownSvg(report.burndown.byPoints, 'Burndown by story points', '#8250df')
    : '';

  const assigneeRows = b.assigneeBalance.map((entry) => {
    const points = m.committedPoints > 0 ? `<td>${entry.points ?? 0}</td>` : '';
    return `<tr><td>${esc(entry.assignee)}</td><td>${entry.count}</td><td>${esc(entry.share)}</td><td>${esc(entry.load)}</td>${points}</tr>`;
  }).join('');

  const assigneeHeaders = m.committedPoints > 0
    ? '<th>Assignee</th><th>Count</th><th>Share</th><th>Load</th><th>Points</th>'
    : '<th>Assignee</th><th>Count</th><th>Share</th><th>Load</th>';

  const priorityRows = Object.entries(b.byPriority)
    .sort((a, b) => b[1] - a[1])
    .map(([priority, count]) => `<tr><td>${esc(priority)}</td><td>${count}</td></tr>`)
    .join('');

  const blockerItems = report.blockers.map((issue) => {
    const points = typeof issue.storyPoints === 'number' ? ` (${issue.storyPoints} pts)` : '';
    return `<li><strong>${esc(issue.key)}</strong> — ${esc(issue.summary)} [${esc(issue.status)}]${points} (${esc(issue.assignee ?? 'Unassigned')})${issue.flagged ? ' — flagged' : ''}</li>`;
  }).join('');

  const insightItems = report.insights.map((insight) => `<li>${esc(insight)}</li>`).join('');

  const factorRows = report.health.factors.map((f) => {
    return `<tr><td>${esc(f.label)}</td><td>${f.score}</td><td>${esc(f.detail)}</td></tr>`;
  }).join('');

  const metaRows = [
    ['Total Issues', String(m.totalIssues)],
    ['Completed', String(m.completedIssues)],
    ['Incomplete', String(m.incompleteIssues)],
    ['Completion Rate', report.progressBars.completion],
    ['Point Completion', m.committedPoints > 0 ? report.progressBars.points : 'N/A'],
    ['Scope Change Rate', m.scopeChangeRate],
    ['Carried Over', String(m.carriedOverIssues)],
  ];
  if (m.committedPoints > 0) {
    metaRows.push(['Committed Points', String(m.committedPoints)]);
    metaRows.push(['Completed Points', String(m.completedPoints)]);
  }
  const metaRowsHtml = metaRows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('');

  const blockersSection = report.blockers.length > 0
    ? `<div class="callout">${blockerItems}</div>`
    : '<p>No blockers detected.</p>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Sprint Report: ${esc(s.name)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    margin: 0; padding: 32px; background: #f6f8fa; color: #1f2328; line-height: 1.5;
  }
  .container { max-width: 880px; margin: 0 auto; background: #ffffff; border: 1px solid #d0d7de; border-radius: 8px; padding: 32px; }
  h1 { margin: 0 0 4px; font-size: 24px; }
  .meta { color: #57606a; font-size: 14px; margin-bottom: 24px; }
  h2 { font-size: 18px; border-bottom: 1px solid #d0d7de; padding-bottom: 6px; margin-top: 32px; }
  table { border-collapse: collapse; width: 100%; margin-top: 12px; font-size: 14px; }
  th, td { border: 1px solid #d0d7de; padding: 6px 10px; text-align: left; }
  th { background: #f6f8fa; }
  .badge { display: inline-block; background: ${badgeColor}; color: #fff; font-weight: 700; font-size: 20px; border-radius: 6px; padding: 8px 14px; }
  .grade-row { display: flex; align-items: center; gap: 16px; margin-top: 12px; }
  .grade-score { font-size: 14px; color: #57606a; }
  .callout { background: #ffebe9; border: 1px solid #ffc1ba; border-radius: 6px; padding: 12px 16px; margin-top: 12px; }
  .callout li { margin: 4px 0; }
  .chart-title { font-weight: 600; margin: 16px 0 4px; font-size: 14px; }
  svg { background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 6px; }
  ul { margin: 8px 0; padding-left: 20px; }
</style>
</head>
<body>
<div class="container">
  <h1>Sprint Report: ${esc(s.name)}</h1>
  <div class="meta">
    Board: ${esc(s.boardName)} &middot; State: ${esc(s.state)}
    ${s.startDate ? `&middot; Start: ${esc(fmtDate(s.startDate))}` : ''}
    ${s.endDate ? `&middot; End: ${esc(fmtDate(s.endDate))}` : ''}
    ${s.durationDays ? `&middot; Duration: ${s.durationDays} days` : ''}
  </div>

  <h2>Health Scorecard</h2>
  <div class="grade-row">
    <span class="badge">${esc(report.health.grade)}</span>
    <span class="grade-score">${report.health.score}/100</span>
  </div>
  <table>
    <tr><th>Factor</th><th>Score</th><th>Detail</th></tr>
    ${factorRows}
  </table>

  <h2>Summary</h2>
  <table>
    ${metaRowsHtml}
  </table>

  <h2>Burndown (estimated)</h2>
  <p style="color:#57606a;font-size:13px;">Estimated — Jira Cloud does not expose historical snapshots.</p>
  ${svgCount}
  ${svgPoints}

  <h2>By Assignee</h2>
  <table>
    <tr>${assigneeHeaders}</tr>
    ${assigneeRows}
  </table>

  <h2>By Priority</h2>
  <table>
    <tr><th>Priority</th><th>Count</th></tr>
    ${priorityRows}
  </table>

  <h2>Blockers</h2>
  ${blockersSection}

  <h2>Insights &amp; Suggestions</h2>
  <ul>${insightItems}</ul>
</div>
</body>
</html>`;
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

  let storyPointsFieldId: string | undefined;
  try {
    const detected = await findStoryPointsField(config);
    if (detected) storyPointsFieldId = detected;
  } catch {
    storyPointsFieldId = undefined;
  }

  const fields = storyPointsFieldId
    ? [...SPRINT_REPORT_FIELDS, storyPointsFieldId]
    : SPRINT_REPORT_FIELDS;

  const jql = `project = ${config.projectKey} AND sprint = ${sprint.id}`;
  const issues = await searchJqlAll(config, jql, {
    fields,
    maxResults: 100,
  });

  const sprintIssues = issues.map((issue) => mapIssue(issue, storyPointsFieldId));
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

  const committedPoints = sprintIssues.reduce(
    (sum, i) => sum + (typeof i.storyPoints === 'number' ? i.storyPoints : 0),
    0,
  );
  const completedPoints = completedIssues.reduce(
    (sum, i) => sum + (typeof i.storyPoints === 'number' ? i.storyPoints : 0),
    0,
  );
  const pointCompletionRate = committedPoints > 0
    ? `${Math.round((completedPoints / committedPoints) * 100)}%`
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
      return {
        assignee,
        count,
        share,
        load,
        points: breakdown.pointsByAssignee[assignee],
      };
    })
    .sort((a, b) => b.count - a.count);

  const blockers = findBlockers(sprintIssues);
  const burndown = buildBurndown(sprintIssues, sprint, committedPoints);

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
      committedPoints,
      completedPoints,
      pointCompletionRate,
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
    burndown,
    health: { score: 0, grade: 'F', factors: [] },
    blockers,
    progressBars: {
      completion: makeBar(completionRate === 'N/A' ? 100 : parseInt(completionRate, 10)),
      points: makeBar(pointCompletionRate === 'N/A' ? 0 : parseInt(pointCompletionRate, 10)),
    },
  };

  report.health = buildHealth(report);
  report.insights = buildInsights(report);

  const markdown = formatMarkdown(report);

  return { report, markdown };
}

export async function runFromEnv(params: SprintReportParams): Promise<string> {
  const config = loadJiraConfig();
  const result = await generateSprintReportWorkflow(config, params);

  let markdown = result.markdown;

  if (params.exportHtml) {
    const html = exportReportHtml(result.report);
    const outPath = resolveExportPath(params.exportHtml, result.report.sprint.name);
    writeFileSync(outPath, html, 'utf8');
    markdown += `\n\nHTML report written to: ${outPath}`;
  }

  return markdown;
}

function resolveExportPath(exportHtml: string, sprintName: string): string {
  if (exportHtml.endsWith('/') || isDirectory(exportHtml)) {
    const safe = sprintName.replace(/[^a-zA-Z0-9]+/g, '-');
    return `${exportHtml.replace(/\/$/, '')}/sprint-report-${safe}.html`;
  }
  return exportHtml;
}

function isDirectory(path: string): boolean {
  try {
    const stat = statSync(path);
    return stat.isDirectory();
  } catch {
    return false;
  }
}
