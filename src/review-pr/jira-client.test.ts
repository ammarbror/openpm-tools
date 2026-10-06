import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import {
  fetchIssueSummary,
  transitionIssue,
  getTransitions,
  addIssueComment,
  getProject,
  createVersion,
  addFixVersionToIssue,
  descriptionToADF,
  textToADF,
  createIssue,
  updateIssue,
} from './jira-client.js';
import type { JiraConfig, CreateVersionParams } from './types.js';

const config: JiraConfig = {
  email: 'bot@example.com',
  apiToken: 'tok_123',
  baseUrl: 'https://my-domain.atlassian.net',
  projectKey: 'PROJ',
};

beforeEach(() => {
  globalThis.fetch = undefined as unknown as typeof globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = undefined as unknown as typeof globalThis.fetch;
});

void describe('fetchIssueSummary', () => {
  void it('returns key, summary, and status from a Jira issue', async () => {
    globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(
        url,
        'https://my-domain.atlassian.net/rest/api/3/issue/PROJ-42',
      );
      assert.equal(init?.method ?? 'GET', 'GET');
      return new Response(
        JSON.stringify({
          key: 'PROJ-42',
          fields: {
            summary: 'Fix the login bug',
            status: { name: 'In Progress' },
          },
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    };

    const result = await fetchIssueSummary('PROJ-42', config);
    assert.deepStrictEqual(result, {
      key: 'PROJ-42',
      summary: 'Fix the login bug',
      status: 'In Progress',
    });
  });
});

void describe('transitionIssue', () => {
  void it('POSTs the correct transition body', async () => {
    globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(
        url,
        'https://my-domain.atlassian.net/rest/api/3/issue/PROJ-42/transitions',
      );
      assert.equal(init?.method, 'POST');
      const body = JSON.parse(init?.body as string);
      assert.deepStrictEqual(body, { transition: { id: '31' } });
      return new Response(null, { status: 204 });
    };

    await transitionIssue('PROJ-42', config, '31');
  });
});

void describe('getTransitions', () => {
  void it('returns an array of id/name transitions', async () => {
    globalThis.fetch = async (url: RequestInfo | URL) => {
      return new Response(
        JSON.stringify({
          transitions: [
            { id: '11', name: 'To Do' },
            { id: '21', name: 'In Progress' },
            { id: '31', name: 'Done' },
          ],
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    };

    const result = await getTransitions('PROJ-42', config);
    assert.deepStrictEqual(result, [
      { id: '11', name: 'To Do' },
      { id: '21', name: 'In Progress' },
      { id: '31', name: 'Done' },
    ]);
  });
});

void describe('addIssueComment', () => {
  void it('POSTs the correct Atlassian Document Format body', async () => {
    globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(
        url,
        'https://my-domain.atlassian.net/rest/api/3/issue/PROJ-42/comment',
      );
      assert.equal(init?.method, 'POST');
      const body = JSON.parse(init?.body as string);
      assert.deepStrictEqual(body, {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Reviewed by automation.',
                },
              ],
            },
          ],
        },
      });
      return new Response(null, { status: 201 });
    };

    await addIssueComment('PROJ-42', config, 'Reviewed by automation.');
  });
});

void describe('Mermaid Jira descriptions', () => {
  void it('creates with source, uploads the diagram, then updates the same issue', async () => {
    const description = '{code:mermaid}\nsequenceDiagram\n A->>B: Hello\n{code}';
    const methods: string[] = [];
    globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
      methods.push(init?.method ?? 'GET');
      if (String(url).endsWith('/attachments')) {
        assert.ok(init?.body instanceof FormData);
        return new Response(JSON.stringify([{ content: 'https://example.com/diagram.svg' }]), {
          status: 200, headers: { 'content-type': 'application/json' },
        });
      }
      const body = JSON.parse(init?.body as string);
      if (init?.method === 'PUT') {
        assert.ok(String(url).endsWith('/PROJ-42'));
        assert.equal(body.fields.description.content[1].type, 'mediaSingle');
        return new Response(null, { status: 204 });
      }
      assert.deepStrictEqual(body.fields.description, textToADF(description));
      return new Response(JSON.stringify({ key: 'PROJ-42', self: 'issue-url' }), {
        status: 201, headers: { 'content-type': 'application/json' },
      });
    };
    assert.equal((await createIssue(config, { summary: 'Diagram', description })).key, 'PROJ-42');
    assert.deepStrictEqual(methods, ['POST', 'POST', 'PUT']);
  });

  void it('does not update existing fields when diagram rendering fails', async () => {
    globalThis.fetch = async () => { assert.fail('No Jira request should be made'); };
    await assert.rejects(updateIssue(config, 'PROJ-42', {
      summary: 'Changed', description: '```mermaid\nnot a diagram\n```',
    }));
  });

  void it('retains the source description and identifies the created issue when SVG upload fails', async () => {
    const description = '```mermaid\nsequenceDiagram\n A->>B: Hello\n```';
    const calls: string[] = [];
    globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
      calls.push(String(url));
      if (String(url).endsWith('/attachments')) {
        return new Response('Attachments disabled', { status: 403 });
      }
      assert.equal(init?.method, 'POST');
      const body = JSON.parse(init?.body as string);
      assert.deepStrictEqual(body.fields.description, textToADF(description));
      return new Response(JSON.stringify({ key: 'PROJ-42', self: 'issue-url' }), {
        status: 201, headers: { 'content-type': 'application/json' },
      });
    };
    await assert.rejects(createIssue(config, { summary: 'Diagram', description }), /PROJ-42.*source description.*403/);
    assert.equal(calls.length, 2);
  });

  void it('parses fenced Mermaid source as a language-aware code block', () => {
    const doc = textToADF('Before\n\n```mermaid\nsequenceDiagram\n A->>B: Hello\n```');
    assert.deepStrictEqual(doc.content, [
      { type: 'paragraph', content: [{ type: 'text', text: 'Before' }] },
      {
        type: 'codeBlock',
        attrs: { language: 'mermaid' },
        content: [{ type: 'text', text: 'sequenceDiagram\n A->>B: Hello' }],
      },
    ]);
  });

  void it('renders Mermaid and adds an inline media node after uploading SVG', async () => {
    let uploadCalled = false;
    globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(url, 'https://my-domain.atlassian.net/rest/api/3/issue/PROJ-42/attachments');
      assert.equal(init?.method, 'POST');
      assert.ok(init?.body instanceof FormData);
      uploadCalled = true;
      return new Response(
        JSON.stringify([{ content: 'https://my-domain.atlassian.net/rest/api/3/attachment/content/42' }]),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    };

    const doc = await descriptionToADF(
      config,
      'PROJ-42',
      '```mermaid\nsequenceDiagram\n A->>B: Hello\n```',
    );
    const content = doc.content as Record<string, unknown>[];
    assert.equal(uploadCalled, true);
    assert.equal(content[0].type, 'codeBlock');
    assert.equal(content[1].type, 'mediaSingle');
    assert.deepStrictEqual(
      (content[1].content as Record<string, unknown>[])[0],
      {
        type: 'media',
        attrs: {
          type: 'external',
          url: 'https://my-domain.atlassian.net/rest/api/3/attachment/content/42',
          alt: 'Rendered Mermaid diagram 1',
        },
      },
    );
  });
});

void describe('getProject', () => {
  void it('returns id, key, and name from a Jira project', async () => {
    globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(
        url,
        'https://my-domain.atlassian.net/rest/api/3/project/PROJ',
      );
      assert.equal(init?.method ?? 'GET', 'GET');
      return new Response(
        JSON.stringify({
          id: '10000',
          key: 'PROJ',
          name: 'My Project',
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    };

    const result = await getProject(config, 'PROJ');
    assert.deepStrictEqual(result, {
      id: '10000',
      key: 'PROJ',
      name: 'My Project',
    });
  });

  void it('throws with HTTP status on non-2xx response', async () => {
    globalThis.fetch = async () => {
      return new Response('Not Found', {
        status: 404,
        statusText: 'Not Found',
      });
    };

    await assert.rejects(
      () => getProject(config, 'NOPE'),
      (err: Error) => {
        assert.ok(err.message.includes('404'));
        return true;
      },
    );
  });
});

void describe('createVersion', () => {
  void it('POSTs version params and returns the created version', async () => {
    const params: CreateVersionParams = {
      name: 'Release 2026-08-07',
      projectId: 10000,
      description: 'Sprint 42 release',
      archived: false,
    };

    globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(
        url,
        'https://my-domain.atlassian.net/rest/api/3/version',
      );
      assert.equal(init?.method, 'POST');
      const body = JSON.parse(init?.body as string);
      assert.deepStrictEqual(body, {
        name: 'Release 2026-08-07',
        projectId: 10000,
        description: 'Sprint 42 release',
        archived: false,
      });
      return new Response(
        JSON.stringify({
          id: '10001',
          name: 'Release 2026-08-07',
          description: 'Sprint 42 release',
          archived: false,
          released: false,
          self: 'https://my-domain.atlassian.net/rest/api/3/version/10001',
        }),
        {
          status: 201,
          headers: { 'content-type': 'application/json' },
        },
      );
    };

    const result = await createVersion(config, params);
    assert.strictEqual(result.id, '10001');
    assert.strictEqual(result.name, 'Release 2026-08-07');
    assert.strictEqual(result.released, false);
    assert.strictEqual(result.archived, false);
  });

  void it('throws with HTTP status on non-2xx response', async () => {
    globalThis.fetch = async () => {
      return new Response('Bad Request', {
        status: 400,
        statusText: 'Bad Request',
      });
    };

    await assert.rejects(
      () => createVersion(config, { name: 'v1', projectId: 10000 }),
      (err: Error) => {
        assert.ok(err.message.includes('400'));
        return true;
      },
    );
  });
});

void describe('addFixVersionToIssue', () => {
  void it('PUTs the correct fixVersions update body', async () => {
    globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(
        url,
        'https://my-domain.atlassian.net/rest/api/3/issue/KAIRA-123',
      );
      assert.equal(init?.method, 'PUT');
      const body = JSON.parse(init?.body as string);
      assert.deepStrictEqual(body, {
        update: {
          fixVersions: [{ add: { id: '10001' } }],
        },
      });
      return new Response(null, { status: 204 });
    };

    await addFixVersionToIssue(config, 'KAIRA-123', '10001');
  });

  void it('throws with HTTP status on non-2xx response', async () => {
    globalThis.fetch = async () => {
      return new Response('Forbidden', {
        status: 403,
        statusText: 'Forbidden',
      });
    };

    await assert.rejects(
      () => addFixVersionToIssue(config, 'KAIRA-999', '10001'),
      (err: Error) => {
        assert.ok(err.message.includes('403'));
        return true;
      },
    );
  });
});

void describe('error handling', () => {
  void it('throws with HTTP status on non-2xx response', async () => {
    globalThis.fetch = async () => {
      return new Response('Not Found', {
        status: 404,
        statusText: 'Not Found',
      });
    };

    await assert.rejects(
      () => fetchIssueSummary('PROJ-999', config),
      (err: Error) => {
        assert.ok(err.message.includes('404'));
        return true;
      },
    );
  });
});
