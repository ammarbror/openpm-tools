import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { generateSprintReportWorkflow } from './index.ts';
import type { JiraConfig } from '../review-pr/types.ts';

const config: JiraConfig = {
  email: 'bot@example.com',
  apiToken: 'tok_123',
  baseUrl: 'https://my-domain.atlassian.net',
  projectKey: 'PROJ',
};

const BASE = config.baseUrl;

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  } as Response);
}

function makeIssue(
  key: string,
  statusCategoryKey: 'done' | 'indeterminate' | 'new',
  created?: string,
): unknown {
  return makeIssueFor(key, statusCategoryKey, created ?? '2026-07-02T00:00:00.000Z', 'Alice');
}

function makeIssueFor(
  key: string,
  statusCategoryKey: 'done' | 'indeterminate' | 'new',
  created: string,
  assigneeName: string,
): unknown {
  return {
    id: key,
    key,
    self: `${BASE}/rest/api/3/issue/${key}`,
    fields: {
      summary: `Summary for ${key}`,
      status: {
        name: statusCategoryKey === 'done' ? 'Done' : statusCategoryKey === 'indeterminate' ? 'In Progress' : 'To Do',
        statusCategory: { key: statusCategoryKey, name: 'x' },
      },
      issuetype: { name: 'Story' },
      assignee: { accountId: '1', displayName: assigneeName },
      priority: { name: 'High' },
      created,
    },
  };
}

beforeEach(() => {
  globalThis.fetch = undefined as unknown as typeof globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = undefined as unknown as typeof globalThis.fetch;
});

void describe('generateSprintReportWorkflow', () => {
  void it('should generate report for default active sprint', async () => {
    globalThis.fetch = async (url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes('/rest/agile/1.0/board') && !urlStr.includes('/sprint')) {
        return jsonResponse({ values: [{ id: 1, name: 'Test Board', type: 'scrum' }] });
      }
      if (urlStr.includes('/sprint')) {
        return jsonResponse({
          values: [
            {
              id: 5,
              name: 'Sprint 12',
              state: 'active',
              startDate: '2026-07-01T00:00:00.000Z',
              endDate: '2026-07-14T00:00:00.000Z',
            },
          ],
        });
      }
      if (urlStr.includes('/search/jql')) {
        return jsonResponse({
          issues: [
            makeIssue('PROJ-1', 'done'),
            makeIssue('PROJ-2', 'done'),
            makeIssue('PROJ-3', 'done'),
            makeIssue('PROJ-4', 'indeterminate'),
            makeIssue('PROJ-5', 'new'),
          ],
          isLast: true,
        });
      }
      throw new Error(`Unexpected URL: ${urlStr}`);
    };

    const { report, markdown } = await generateSprintReportWorkflow(config, {});

    assert.ok(markdown.includes('Sprint 12'));
    assert.equal(report.metrics.completionRate, '60%');
    assert.equal(report.metrics.completedIssues, 3);
    assert.ok(markdown.includes('| Completed | 3 |'));
  });

  void it('should throw when no boards found', async () => {
    globalThis.fetch = async (url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes('/rest/agile/1.0/board') && !urlStr.includes('/sprint')) {
        return jsonResponse({ values: [] });
      }
      throw new Error(`Unexpected URL: ${urlStr}`);
    };

    await assert.rejects(
      () => generateSprintReportWorkflow(config, {}),
      (err: Error) => {
        assert.ok(err.message.includes('No boards found'));
        return true;
      },
    );
  });

  void it('should throw when sprint not found by name', async () => {
    globalThis.fetch = async (url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes('/rest/agile/1.0/board') && !urlStr.includes('/sprint')) {
        return jsonResponse({ values: [{ id: 1, name: 'Test Board', type: 'scrum' }] });
      }
      if (urlStr.includes('/sprint')) {
        return jsonResponse({ values: [] });
      }
      throw new Error(`Unexpected URL: ${urlStr}`);
    };

    await assert.rejects(
      () => generateSprintReportWorkflow(config, { sprintName: 'NONEXISTENT' }),
      (err: Error) => {
        assert.ok(err.message.includes('not found'));
        return true;
      },
    );
  });

  void it('should generate report for named sprint', async () => {
    globalThis.fetch = async (url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes('/rest/agile/1.0/board') && !urlStr.includes('/sprint')) {
        return jsonResponse({ values: [{ id: 1, name: 'Test Board', type: 'scrum' }] });
      }
      if (urlStr.includes('/sprint')) {
        // findSprintByName iterates active, future, closed until a match.
        // Return the matching sprint only on the 'closed' state pass.
        if (urlStr.includes('state=closed')) {
          return jsonResponse({
            values: [
              {
                id: 7,
                name: 'Sprint 14',
                state: 'closed',
                startDate: '2026-06-01T00:00:00.000Z',
                endDate: '2026-06-14T00:00:00.000Z',
              },
            ],
          });
        }
        return jsonResponse({ values: [] });
      }
      if (urlStr.includes('/search/jql')) {
        return jsonResponse({
          issues: [makeIssue('PROJ-1', 'done'), makeIssue('PROJ-2', 'indeterminate')],
          isLast: true,
        });
      }
      throw new Error(`Unexpected URL: ${urlStr}`);
    };

    const { report, markdown } = await generateSprintReportWorkflow(config, { sprintName: 'Sprint 14' });

    assert.ok(markdown.includes('Sprint 14'));
    assert.equal(report.sprint.name, 'Sprint 14');
  });

  void it('should handle empty sprint (0 issues)', async () => {
    globalThis.fetch = async (url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes('/rest/agile/1.0/board') && !urlStr.includes('/sprint')) {
        return jsonResponse({ values: [{ id: 1, name: 'Test Board', type: 'scrum' }] });
      }
      if (urlStr.includes('/sprint')) {
        return jsonResponse({
          values: [
            {
              id: 5,
              name: 'Sprint 12',
              state: 'active',
              startDate: '2026-07-01T00:00:00.000Z',
              endDate: '2026-07-14T00:00:00.000Z',
            },
          ],
        });
      }
      if (urlStr.includes('/search/jql')) {
        return jsonResponse({ issues: [], isLast: true });
      }
      throw new Error(`Unexpected URL: ${urlStr}`);
    };

    const { report } = await generateSprintReportWorkflow(config, {});

    assert.equal(report.metrics.completionRate, 'N/A');
    assert.equal(report.metrics.totalIssues, 0);
  });

  void it('should handle all issues completed', async () => {
    globalThis.fetch = async (url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes('/rest/agile/1.0/board') && !urlStr.includes('/sprint')) {
        return jsonResponse({ values: [{ id: 1, name: 'Test Board', type: 'scrum' }] });
      }
      if (urlStr.includes('/sprint')) {
        return jsonResponse({
          values: [
            {
              id: 5,
              name: 'Sprint 12',
              state: 'active',
              startDate: '2026-07-01T00:00:00.000Z',
              endDate: '2026-07-14T00:00:00.000Z',
            },
          ],
        });
      }
      if (urlStr.includes('/search/jql')) {
        return jsonResponse({
          issues: [
            makeIssue('PROJ-1', 'done'),
            makeIssue('PROJ-2', 'done'),
            makeIssue('PROJ-3', 'done'),
            makeIssue('PROJ-4', 'done'),
          ],
          isLast: true,
        });
      }
      throw new Error(`Unexpected URL: ${urlStr}`);
    };

    const { report } = await generateSprintReportWorkflow(config, {});

    assert.equal(report.metrics.completionRate, '100%');
    assert.equal(report.metrics.completedIssues, 4);
  });

  void it('should flag issues added after sprint start', async () => {
    globalThis.fetch = async (url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes('/rest/agile/1.0/board') && !urlStr.includes('/sprint')) {
        return jsonResponse({ values: [{ id: 1, name: 'Test Board', type: 'scrum' }] });
      }
      if (urlStr.includes('/sprint')) {
        return jsonResponse({
          values: [
            {
              id: 5,
              name: 'Sprint 12',
              state: 'active',
              startDate: '2026-07-01T00:00:00.000Z',
              endDate: '2026-07-14T00:00:00.000Z',
            },
          ],
        });
      }
      if (urlStr.includes('/search/jql')) {
        return jsonResponse({
          issues: [
            makeIssue('PROJ-1', 'done', '2026-07-05T00:00:00.000Z'),
            makeIssue('PROJ-2', 'done', '2026-07-08T00:00:00.000Z'),
            makeIssue('PROJ-3', 'indeterminate', '2026-06-25T00:00:00.000Z'),
          ],
          isLast: true,
        });
      }
      throw new Error(`Unexpected URL: ${urlStr}`);
    };

    const { report, markdown } = await generateSprintReportWorkflow(config, {});

    assert.equal(report.issuesAddedAfterSprintStart.length, 2);
    assert.ok(markdown.includes('2 issue(s) were added after sprint start'));
  });

  void it('should handle sprint dates where end < start (durationDays undefined)', async () => {
    globalThis.fetch = async (url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes('/rest/agile/1.0/board') && !urlStr.includes('/sprint')) {
        return jsonResponse({ values: [{ id: 1, name: 'Test Board', type: 'scrum' }] });
      }
      if (urlStr.includes('/sprint')) {
        return jsonResponse({
          values: [
            {
              id: 5,
              name: 'Sprint 12',
              state: 'active',
              startDate: '2026-07-14T00:00:00.000Z',
              endDate: '2026-07-01T00:00:00.000Z',
            },
          ],
        });
      }
      if (urlStr.includes('/search/jql')) {
        return jsonResponse({ issues: [makeIssue('PROJ-1', 'done')], isLast: true });
      }
      throw new Error(`Unexpected URL: ${urlStr}`);
    };

    const { report } = await generateSprintReportWorkflow(config, {});

    assert.equal(report.sprint.durationDays, undefined);
  });

  void it('should compute scope change rate and carryover in metrics', async () => {
    globalThis.fetch = async (url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes('/rest/agile/1.0/board') && !urlStr.includes('/sprint')) {
        return jsonResponse({ values: [{ id: 1, name: 'Test Board', type: 'scrum' }] });
      }
      if (urlStr.includes('/sprint')) {
        return jsonResponse({
          values: [
            {
              id: 5,
              name: 'Sprint 12',
              state: 'active',
              startDate: '2026-07-01T00:00:00.000Z',
              endDate: '2026-07-14T00:00:00.000Z',
            },
          ],
        });
      }
      if (urlStr.includes('/search/jql')) {
        return jsonResponse({
          issues: [
            makeIssue('PROJ-1', 'done', '2026-07-05T00:00:00.000Z'),
            makeIssue('PROJ-2', 'done', '2026-07-08T00:00:00.000Z'),
            makeIssue('PROJ-3', 'done', '2026-06-25T00:00:00.000Z'),
            makeIssue('PROJ-4', 'indeterminate', '2026-06-20T00:00:00.000Z'),
            makeIssue('PROJ-5', 'new', '2026-06-20T00:00:00.000Z'),
          ],
          isLast: true,
        });
      }
      throw new Error(`Unexpected URL: ${urlStr}`);
    };

    const { report, markdown } = await generateSprintReportWorkflow(config, {});

    assert.equal(report.metrics.scopeChangeRate, '40%');
    assert.equal(report.metrics.carriedOverIssues, 2);
    assert.ok(markdown.includes('Scope Change Rate'));
    assert.ok(markdown.includes('Carried Over'));
  });

  void it('should render By Priority and assignee balance with load', async () => {
    globalThis.fetch = async (url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes('/rest/agile/1.0/board') && !urlStr.includes('/sprint')) {
        return jsonResponse({ values: [{ id: 1, name: 'Test Board', type: 'scrum' }] });
      }
      if (urlStr.includes('/sprint')) {
        return jsonResponse({
          values: [
            {
              id: 5,
              name: 'Sprint 12',
              state: 'active',
              startDate: '2026-07-01T00:00:00.000Z',
              endDate: '2026-07-14T00:00:00.000Z',
            },
          ],
        });
      }
      if (urlStr.includes('/search/jql')) {
        return jsonResponse({
          issues: [
            makeIssue('PROJ-1', 'done'),
            makeIssue('PROJ-2', 'done'),
            makeIssue('PROJ-3', 'done'),
            makeIssue('PROJ-4', 'indeterminate'),
            makeIssue('PROJ-5', 'new'),
          ],
          isLast: true,
        });
      }
      throw new Error(`Unexpected URL: ${urlStr}`);
    };

    const { report, markdown } = await generateSprintReportWorkflow(config, {});

    assert.ok(typeof report.breakdowns.byPriority === 'object' && report.breakdowns.byPriority !== null);
    assert.ok('High' in report.breakdowns.byPriority);
    assert.ok(Array.isArray(report.breakdowns.assigneeBalance));
    for (const entry of report.breakdowns.assigneeBalance) {
      assert.ok(typeof entry.share === 'string');
      assert.ok(['overloaded', 'balanced', 'idle', 'unassigned'].includes(entry.load));
    }
    assert.ok(markdown.includes('## By Priority'));
    assert.ok(markdown.includes('| Load |'));
  });

  void it('should generate insights when scope change is high', async () => {
    globalThis.fetch = async (url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes('/rest/agile/1.0/board') && !urlStr.includes('/sprint')) {
        return jsonResponse({ values: [{ id: 1, name: 'Test Board', type: 'scrum' }] });
      }
      if (urlStr.includes('/sprint')) {
        return jsonResponse({
          values: [
            {
              id: 5,
              name: 'Sprint 12',
              state: 'active',
              startDate: '2026-07-01T00:00:00.000Z',
              endDate: '2026-07-14T00:00:00.000Z',
            },
          ],
        });
      }
      if (urlStr.includes('/search/jql')) {
        return jsonResponse({
          issues: [
            makeIssue('PROJ-1', 'done', '2026-07-05T00:00:00.000Z'),
            makeIssue('PROJ-2', 'done', '2026-07-08T00:00:00.000Z'),
            makeIssue('PROJ-3', 'done', '2026-07-09T00:00:00.000Z'),
            makeIssue('PROJ-4', 'indeterminate', '2026-06-25T00:00:00.000Z'),
            makeIssue('PROJ-5', 'new', '2026-06-20T00:00:00.000Z'),
          ],
          isLast: true,
        });
      }
      throw new Error(`Unexpected URL: ${urlStr}`);
    };

    const { report, markdown } = await generateSprintReportWorkflow(config, {});

    assert.ok(report.insights.length >= 1);
    assert.ok(report.insights.some((insight) => insight.includes('Scope change:')));
    assert.ok(markdown.includes('## Insights & Suggestions'));
  });

  void it('should produce a healthy insight when metrics are clean', async () => {
    globalThis.fetch = async (url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes('/rest/agile/1.0/board') && !urlStr.includes('/sprint')) {
        return jsonResponse({ values: [{ id: 1, name: 'Test Board', type: 'scrum' }] });
      }
      if (urlStr.includes('/sprint')) {
        return jsonResponse({
          values: [
            {
              id: 5,
              name: 'Sprint 12',
              state: 'active',
              startDate: '2026-07-01T00:00:00.000Z',
              endDate: '2026-07-14T00:00:00.000Z',
            },
          ],
        });
      }
      if (urlStr.includes('/search/jql')) {
        return jsonResponse({
          issues: [
            makeIssueFor('PROJ-1', 'done', '2026-06-20T00:00:00.000Z', 'Alice'),
            makeIssueFor('PROJ-2', 'done', '2026-06-21T00:00:00.000Z', 'Bob'),
            makeIssueFor('PROJ-3', 'done', '2026-06-22T00:00:00.000Z', 'Carol'),
            makeIssueFor('PROJ-4', 'done', '2026-06-23T00:00:00.000Z', 'Dan'),
          ],
          isLast: true,
        });
      }
      throw new Error(`Unexpected URL: ${urlStr}`);
    };

    const { report } = await generateSprintReportWorkflow(config, {});

    assert.equal(report.insights.length, 1);
    assert.ok(report.insights[0].includes('healthy'));
  });
});
