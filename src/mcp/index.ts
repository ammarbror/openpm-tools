#!/usr/bin/env npx tsx
import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { runFromEnv as runCreateTicket } from '../create-ticket/index.ts';
import { runFromEnv as runEditTicket } from '../edit-ticket/index.ts';
import { runFromEnv as runReleaseWorkflow } from '../release-workflow/index.ts';
import { runFromEnv as runSprintReport } from '../sprint-report/index.ts';
import { runFromEnv as runExtractKnowledge } from '../extract-knowledge/index.ts';
import {
  fetchReviewData,
  postBitbucketComments,
  postJiraComments,
  loadBitbucketConfig,
  loadJiraConfig,
} from '../review-pr/index.ts';
import type { ReviewFinding } from '../review-pr/types.ts';

const tools: Tool[] = [
  {
    name: 'create_ticket',
    description:
      'Create a Jira ticket in the current active sprint. BEFORE calling, ALWAYS rewrite/improve the summary into a clear, concise, professional title (fix typos/grammar/wording, max ~80 chars, English). If no description is provided, write one yourself from your understanding of the summary; if you have no understanding, fill in the type-specific sections with placeholders plus an explanation of what each section should contain (Task: Description/Technical Details/Definition of Done/Notes; Bug: Description/Steps to Reproduce/Expected/Actual/Environment/Evidence; Story: User Story/Acceptance Criteria/Additional Context; Epic: Epic Description/Goals/Key Initiatives/Out of Scope/Dependencies).',
    inputSchema: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'Concise summary of the ticket (improve/rewrite it before passing)' },
        description: { type: 'string', description: 'Detailed description or criteria; if omitted, derive it from the summary or fill with type-specific section placeholders' },
        issueType: { type: 'string', description: 'Issue type: Task, Bug, Story, Feature, Epic' },
        assignee: { type: 'string', description: 'Assignee display name' },
        assigneeAccountId: { type: 'string', description: 'Assignee Jira account ID' },
        sprintName: { type: 'string', description: 'Target sprint name' },
        parentEpicKey: { type: 'string', description: 'Parent Epic key (e.g. KAIRA-100)' },
        storyPoints: { type: 'number', description: 'Story points estimation' },
      },
      required: ['summary'],
    },
  },
  {
    name: 'edit_ticket',
    description: 'Update an existing Jira ticket (summary, description, assignee)',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: { type: 'string', description: 'Jira issue key (e.g. KAIRA-123)' },
        summary: { type: 'string', description: 'New summary' },
        description: { type: 'string', description: 'New description' },
        assigneeName: { type: 'string', description: 'Assignee display name' },
        assigneeAccountId: { type: 'string', description: 'Assignee Jira account ID' },
      },
      required: ['issueKey'],
    },
  },
  {
    name: 'release_workflow',
    description: 'Create Jira release/version for Ready for Release tickets and generate markdown release notes',
    inputSchema: {
      type: 'object',
      properties: {
        versionName: { type: 'string', description: 'Custom release version name' },
      },
    },
  },
  {
    name: 'sprint_report',
    description: 'Generate comprehensive Jira sprint report with burndown, assignee breakdown, and HTML export',
    inputSchema: {
      type: 'object',
      properties: {
        sprintName: { type: 'string', description: 'Target sprint name' },
        exportHtml: { type: 'boolean', description: 'Export standalone HTML file with burndown chart' },
      },
    },
  },
  {
    name: 'fetch_pr_review',
    description: 'Fetch Bitbucket PR metadata, diff, linked Jira issues, and prompt for LLM code review',
    inputSchema: {
      type: 'object',
      properties: {
        prUrl: { type: 'string', description: 'Full Bitbucket Pull Request URL' },
      },
      required: ['prUrl'],
    },
  },
  {
    "name": "post_pr_review",
    "description": "Post structured LLM review findings to Bitbucket PR comments and linked Jira issues",
    "inputSchema": {
      "type": "object",
      "properties": {
        "prUrl": { "type": "string", "description": "Full Bitbucket Pull Request URL" },
        "findings": {
          "type": "array",
          "description": "List of review findings (CRITICAL, HIGH, BUG)",
          "items": {
            "type": "object",
            "properties": {
              "severity": { "type": "string", "enum": ["CRITICAL", "HIGH", "BUG"] },
              "file": { "type": "string" },
              "line": { "type": "number" },
              "title": { "type": "string" },
              "description": { "type": "string" },
              "suggestion": { "type": "string" }
            },
            "required": ["severity", "file", "title", "description"]
          }
        }
      },
      "required": ["prUrl", "findings"]
    }
  },
  {
    "name": "create_prdd",
    "description": "Get guidelines and section definitions to generate a 9-section bilingual PRDD (Indonesian + English) for Obsidian",
    "inputSchema": {
      "type": "object",
      "properties": {
        "productName": { "type": "string", "description": "Product name" }
      }
    }
  },
  {
    name: 'extract_knowledge',
    description: 'Extract document files (.docx, .pdf, .pptx, .xlsx, .md, .csv) into AI-friendly knowledge markdown in Obsidian vault',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'Path to source file or folder to extract' },
        llm: { type: 'boolean', description: 'Enhance extracted markdown using LLM' },
        out: { type: 'string', description: 'Custom output directory path' },
        overwrite: { type: 'boolean', description: 'Overwrite existing knowledge markdown files' },
        vault: { type: 'string', description: 'Obsidian vault root directory path' },
        json: { type: 'boolean', description: 'Return output as structured JSON' }
      },
      required: ['source']
    }
  }
];

const server = new Server(
  {
    name: 'openpm-tools',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const toolArgs = args || {};

  try {
    switch (name) {
      case 'create_ticket': {
        const result = await runCreateTicket({
          summary: String(toolArgs.summary),
          description: toolArgs.description ? String(toolArgs.description) : undefined,
          issueType: toolArgs.issueType ? String(toolArgs.issueType) : undefined,
          assignee: toolArgs.assignee ? String(toolArgs.assignee) : undefined,
          assigneeAccountId: toolArgs.assigneeAccountId ? String(toolArgs.assigneeAccountId) : undefined,
          sprintName: toolArgs.sprintName ? String(toolArgs.sprintName) : undefined,
          parentEpicKey: toolArgs.parentEpicKey ? String(toolArgs.parentEpicKey) : undefined,
          storyPoints: toolArgs.storyPoints ? Number(toolArgs.storyPoints) : undefined,
        });
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'edit_ticket': {
        const result = await runEditTicket({
          issueKey: String(toolArgs.issueKey),
          summary: toolArgs.summary ? String(toolArgs.summary) : undefined,
          description: toolArgs.description ? String(toolArgs.description) : undefined,
          assigneeName: toolArgs.assigneeName ? String(toolArgs.assigneeName) : undefined,
          assigneeAccountId: toolArgs.assigneeAccountId ? String(toolArgs.assigneeAccountId) : undefined,
        });
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'release_workflow': {
        const result = await runReleaseWorkflow(
          toolArgs.versionName ? { versionName: String(toolArgs.versionName) } : undefined
        );
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'sprint_report': {
        const result = await runSprintReport({
          sprintName: toolArgs.sprintName ? String(toolArgs.sprintName) : undefined,
          exportHtml: Boolean(toolArgs.exportHtml),
        });
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'fetch_pr_review': {
        const reviewData = await fetchReviewData(String(toolArgs.prUrl));
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  prUrl: reviewData.prUrl,
                  prInfo: reviewData.prInfo,
                  metadata: reviewData.metadata,
                  jiraKeys: reviewData.jiraKeys,
                  diff: reviewData.diff,
                  reviewPrompt: reviewData.reviewPrompt,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'post_pr_review': {
        const prUrl = String(toolArgs.prUrl);
        const rawFindings = (toolArgs.findings || []) as any[];
        const findings: ReviewFinding[] = rawFindings.map((f: any) => ({
          severity: f.severity || 'BUG',
          file: f.file || 'unknown',
          line: f.line != null ? Number(f.line) : undefined,
          message: f.message || [f.title, f.description, f.suggestion].filter(Boolean).join(' - ') || 'Issue detected',
        }));

        const bbConfig = loadBitbucketConfig();
        const jiraConfig = loadJiraConfig();
        const reviewData = await fetchReviewData(prUrl);

        await postBitbucketComments(reviewData.prInfo, bbConfig, findings);
        const jiraResults = await postJiraComments(
          prUrl,
          reviewData.metadata.title,
          reviewData.jiraKeys,
          jiraConfig,
          findings
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, jiraResults }, null, 2),
            },
          ],
        };
      }

      case 'create_prdd': {
        const prodName = toolArgs.productName ? String(toolArgs.productName) : 'Product';
        const vaultPath = process.env.OBSIDIAN_VAULT_PATH || process.env.OBSIDIAN_VAULT || 'Dynamic (OBSIDIAN_VAULT_PATH env / user home / user prompt)';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  productName: prodName,
                  vaultPath,
                  instructions: 'Conduct a 9-section interview with the user (Overview, Goals/Metrics, User Stories, Functional Requirements MoSCoW, System Architecture, Database Schema ERD, API Contract, Non-Functional Requirements, Dependencies & Risks). Resolve vault path dynamically (OBSIDIAN_VAULT_PATH env -> home dir -> user prompt). Write PRDD - <Name> (ID).md and PRDD - <Name> (EN).md under <VAULT>/01 Projects/PRDs/<sanitized-name>/ and append index in Daftar PRDD.md.',
                  sections: [
                    '1. Overview & Problem Statement',
                    '2. Goals & Success Metrics (with Non-Goals)',
                    '3. User Stories / Use Cases',
                    '4. Functional Requirements (MoSCoW P0/P1/P2)',
                    '5. System Architecture (Mermaid flowchart TD)',
                    '6. Database Schema / ERD (Mermaid erDiagram)',
                    '7. API Contract (Endpoints & Mermaid sequenceDiagram)',
                    '8. Non-Functional Requirements',
                    '9. Dependencies & Risks'
                  ]
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'extract_knowledge': {
        const result = await runExtractKnowledge({
          source: String(toolArgs.source),
          llm: toolArgs.llm === true,
          out: toolArgs.out ? String(toolArgs.out) : undefined,
          overwrite: toolArgs.overwrite === true,
          vault: toolArgs.vault ? String(toolArgs.vault) : undefined,
          json: toolArgs.json === true,
        });
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error executing ${name}: ${message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
