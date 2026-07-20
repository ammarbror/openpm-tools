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
      assignee: { accountId: '1', displayName: 'Alice' },
      priority: { name: 'High' },
      created: created ?? '2026-07-02T00:00:00.000Z',
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
    assert.ok(markdown.includes('3 completed') || markdown.includes('Completed Issues (3)'));
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
    assert.ok(markdown.includes('Issues Added After Sprint Start (2)'));
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
});
