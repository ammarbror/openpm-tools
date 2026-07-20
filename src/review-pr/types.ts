export interface PRInfo {
  workspace: string;
  repoSlug: string;
  prNumber: number;
}

export interface PRMetadata {
  title: string;
  description: string;
  sourceBranch: string;
  commitMessages: string[];
}

export interface ReviewFinding {
  severity: 'CRITICAL' | 'HIGH' | 'BUG';
  file: string;
  line?: number;
  message: string;
}

export interface ReviewResult {
  findings: ReviewFinding[];
  jiraKeys: string[];
  prUrl: string;
}

export interface BitbucketConfig {
  email: string;
  apiToken: string;
}

export interface JiraConfig {
  email: string;
  apiToken: string;
  baseUrl: string;
  projectKey: string;
}

export interface SprintIssue {
  key: string;
  summary: string;
  status: string;
  statusCategory: 'done' | 'in_progress' | 'to_do';
  issueType: string;
  assignee: string | null;
  priority: string;
  resolution?: string;
  resolutionDate?: string;
  created: string;
}

export interface IssueBreakdown {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byAssignee: Record<string, number>;
  byPriority: Record<string, number>;
  scopeChangeCount: number;
  completed: number;
  incomplete: number;
  issuesAddedAfterSprintStart: SprintIssue[];
}

export interface AssigneeBalanceEntry {
  assignee: string;
  count: number;
  share: string;
  load: 'overloaded' | 'balanced' | 'idle' | 'unassigned';
}

export interface SprintReport {
  sprint: {
    id: number;
    name: string;
    state: string;
    startDate?: string;
    endDate?: string;
    boardName: string;
    durationDays?: number;
  };
  metrics: {
    totalIssues: number;
    completedIssues: number;
    incompleteIssues: number;
    completionRate: string;
    scopeChangeRate: string;
    carriedOverIssues: number;
  };
  breakdowns: {
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    byAssignee: Record<string, number>;
    byPriority: Record<string, number>;
    assigneeBalance: AssigneeBalanceEntry[];
  };
  completedIssues: SprintIssue[];
  incompleteIssues: SprintIssue[];
  issuesAddedAfterSprintStart: SprintIssue[];
  insights: string[];
}
