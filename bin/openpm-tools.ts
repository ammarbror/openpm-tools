#!/usr/bin/env npx tsx
import 'dotenv/config';
import { runFromEnv as runCreateTicket } from '../src/create-ticket/index.ts';
import { runFromEnv as runEditTicket } from '../src/edit-ticket/index.ts';
import { runFromEnv as runReleaseWorkflow } from '../src/release-workflow/index.ts';
import { runFromEnv as runSprintReport } from '../src/sprint-report/index.ts';
import { runFromEnv as runExtractKnowledge } from '../src/extract-knowledge/index.ts';
import { generateStandupReport, formatStandupMarkdown } from '../src/daily-standup/index.ts';
import {
  fetchReviewData,
  postBitbucketComments,
  postJiraComments,
  loadBitbucketConfig,
  loadJiraConfig,
} from '../src/review-pr/index.ts';
import type { ReviewFinding } from '../src/review-pr/types.ts';

function printHelp() {
  console.log(`
openpm-tools CLI - AI PM Toolkit for Jira & Bitbucket

Usage:
  npx openpm-tools <command> [options]

Commands:
  create-ticket <summary> [options]
    --type <task|bug|story>       Issue type (default: auto-detected or Task)
    --description <text>          Issue description
    --assignee <name>             Assignee display name
    --assignee-id <accountId>    Assignee Jira account ID
    --sprint <sprintName>        Target sprint name
    --epic <epicKey>              Parent Epic key (e.g. KAIRA-100)
    --story-points <num>         Story points estimation

  edit-ticket <issueKey> [options]
    --summary <text>              New summary
    --description <text>          New description
    --assignee <name>             Assignee display name
    --assignee-id <accountId>    Assignee Jira account ID

  release-workflow [options]
    --version-name <name>        Custom version name

  sprint-report [options]
    --sprint <sprintName>        Target sprint name
    --export-html                 Export HTML burndown chart

  fetch-pr-review <prUrl>
    Fetch PR metadata, diff, and review prompt for LLM analysis.

  post-pr-review <prUrl> <findingsJsonFileOrString>
    Post LLM findings to Bitbucket PR and linked Jira issues.

  daily-standup [assigneeName]
    Generate a markdown daily standup report from Jira activities.

  create-prdd [productName]
    Print guidelines for creating a bilingual PRDD (Obsidian Vault).

  brainstorm [topic] [options]
    Print the interactive brainstorming workflow guide (agent-generated Markdown).
    --quick                       Use a shorter ideation session
    --deep                        Use the full bounded session
    --out <directory>             Suggested Markdown output directory

  edit-prdd [productName]
    Print guidelines for editing a bilingual PRDD (Obsidian Vault).

  extract-knowledge <file-or-folder> [options]
    Convert document files into structured AI-friendly knowledge .md files.
    --llm                         Use OpenAI-compatible LLM to enhance output
    --out <dir>                   Custom output directory
    --overwrite                   Overwrite target file if exists
    --vault <path>                Custom Obsidian Vault path

Global Options:
  --json                          Output raw JSON result
  --help, -h                      Show this help message
`);
}

function parseArgs(args: string[]) {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];
  const BOOLEAN_FLAGS = new Set(['llm', 'overwrite', 'json', 'quick', 'deep']);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (BOOLEAN_FLAGS.has(key)) {
        flags[key] = true;
      } else {
        const next = args[i + 1];
        if (next && !next.startsWith('--') && !next.startsWith('-')) {
          flags[key] = next;
          i++;
        } else {
          flags[key] = true;
        }
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      if (BOOLEAN_FLAGS.has(key)) {
        flags[key] = true;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { flags, positional };
}

async function main() {
  const rawArgs = process.argv.slice(2);
  if (rawArgs.length === 0 || rawArgs.includes('--help') || rawArgs.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const command = rawArgs[0];
  const { flags, positional } = parseArgs(rawArgs.slice(1));
  const isJson = Boolean(flags.json);

  try {
    switch (command) {
      case 'create-ticket': {
        const summary = positional[0] || (flags.summary as string);
        if (!summary) {
          console.error('Error: summary is required for create-ticket');
          process.exit(1);
        }
        const result = await runCreateTicket({
          summary,
          description: (flags.description as string) || undefined,
          issueType: (flags.type as string) || undefined,
          assignee: (flags.assignee as string) || undefined,
          assigneeAccountId: (flags['assignee-id'] as string) || undefined,
          sprintName: (flags.sprint as string) || undefined,
          parentEpicKey: (flags.epic as string) || undefined,
          storyPoints: flags['story-points'] ? Number(flags['story-points']) : undefined,
        });
        if (isJson) {
          console.log(JSON.stringify({ success: true, message: result }, null, 2));
        } else {
          console.log(result);
        }
        break;
      }

      case 'edit-ticket': {
        const issueKey = positional[0] || (flags.key as string);
        if (!issueKey) {
          console.error('Error: issueKey is required for edit-ticket');
          process.exit(1);
        }
        const result = await runEditTicket({
          issueKey,
          summary: (flags.summary as string) || undefined,
          description: (flags.description as string) || undefined,
          assigneeName: (flags.assignee as string) || undefined,
          assigneeAccountId: (flags['assignee-id'] as string) || undefined,
        });
        if (isJson) {
          console.log(JSON.stringify({ success: true, message: result }, null, 2));
        } else {
          console.log(result);
        }
        break;
      }

      case 'release-workflow': {
        const versionName = (flags['version-name'] as string) || undefined;
        const result = await runReleaseWorkflow(versionName ? { versionName } : undefined);
        if (isJson) {
          console.log(JSON.stringify({ success: true, data: result }, null, 2));
        } else {
          console.log(`Release workflow completed for version: ${result.version?.name || 'N/A'}`);
          console.log(`Issues processed: ${result.issueCount}`);
          if (result.releaseNotesPath) {
            console.log(`Release notes written to: ${result.releaseNotesPath}`);
          }
        }
        break;
      }

      case 'sprint-report': {
        const result = await runSprintReport({
          sprintName: (flags.sprint as string) || undefined,
          exportHtml: flags['export-html'] ? true : undefined,
        });
        if (isJson) {
          console.log(JSON.stringify({ success: true, markdown: result }, null, 2));
        } else {
          console.log(result);
        }
        break;
      }

      case 'fetch-pr-review': {
        const prUrl = positional[0] || (flags.url as string);
        if (!prUrl) {
          console.error('Error: PR URL is required for fetch-pr-review');
          process.exit(1);
        }
        const reviewData = await fetchReviewData(prUrl);
        if (isJson) {
          console.log(JSON.stringify({
            prUrl: reviewData.prUrl,
            prInfo: reviewData.prInfo,
            metadata: reviewData.metadata,
            jiraKeys: reviewData.jiraKeys,
            diff: reviewData.diff,
            reviewPrompt: reviewData.reviewPrompt,
          }, null, 2));
        } else {
          console.log(`=== PR Metadata ===\nTitle: ${reviewData.metadata.title}\nJira Keys: ${reviewData.jiraKeys.join(', ')}\n`);
          console.log(`=== System Review Prompt ===\n${reviewData.reviewPrompt}`);
        }
        break;
      }

      case 'post-pr-review': {
        const prUrl = positional[0];
        const findingsRaw = positional[1] || (flags.findings as string);
        if (!prUrl || !findingsRaw) {
          console.error('Error: PR URL and findings JSON are required for post-pr-review');
          process.exit(1);
        }

        let rawFindings: any[];
        if (findingsRaw.startsWith('[') || findingsRaw.startsWith('{')) {
          rawFindings = JSON.parse(findingsRaw);
        } else {
          const fs = await import('fs');
          rawFindings = JSON.parse(fs.readFileSync(findingsRaw, 'utf-8'));
        }

        const findings: ReviewFinding[] = (Array.isArray(rawFindings) ? rawFindings : [rawFindings]).map((f: any) => ({
          severity: f.severity || 'BUG',
          file: f.file || 'unknown',
          line: f.line != null ? Number(f.line) : undefined,
          message: f.message || [f.title, f.description, f.suggestion].filter(Boolean).join(' - ') || 'Issue detected',
        }));

        const bbConfig = loadBitbucketConfig();
        const jiraConfig = loadJiraConfig();
        const reviewData = await fetchReviewData(prUrl);

        await postBitbucketComments(reviewData.prInfo, bbConfig, findings, (reviewData.metadata as any).qualityWarnings || []);
        const jiraResults = await postJiraComments(prUrl, reviewData.metadata.title, reviewData.jiraKeys, jiraConfig, findings);

        if (isJson) {
          console.log(JSON.stringify({ success: true, jiraResults }, null, 2));
        } else {
          console.log('✅ Review comments posted successfully to Bitbucket & Jira.');
        }
        break;
      }

      case 'daily-standup':
      case 'standup-report': {
        const assignee = positional[0] || (flags.assignee as string);
        const report = await generateStandupReport(assignee);
        if (isJson) {
          console.log(JSON.stringify(report, null, 2));
        } else {
          console.log(formatStandupMarkdown(report));
        }
        break;
      }

      case 'create-prdd': {
        const prodName = positional[0] || (flags.name as string) || 'Product';
        const vaultPath = process.env.OBSIDIAN_VAULT_PATH || process.env.OBSIDIAN_VAULT || 'Dynamic (OBSIDIAN_VAULT_PATH env / user home / user prompt)';
        const guide = {
          command: 'create-prdd',
          productName: prodName,
          vaultPath,
          description: 'Bilingual Product Requirements & Design Document (PRDD) generator for Obsidian',
          sections: [
            '1. Overview & Problem Statement',
            '2. Goals & Success Metrics',
            '3. User Stories / Use Cases',
            '4. Functional Requirements (MoSCoW)',
            '5. System Architecture (Mermaid flowchart TD)',
            '6. Database Schema / ERD (Mermaid erDiagram)',
            '7. API Contract (Endpoints & Mermaid sequenceDiagram)',
            '8. Non-Functional Requirements',
            '9. Dependencies & Risks'
          ],
          outputs: [
            `PRDD - ${prodName} (ID).md`,
            `PRDD - ${prodName} (EN).md`
          ]
        };
        if (isJson) {
          console.log(JSON.stringify(guide, null, 2));
        } else {
          console.log(`=== PRDD Creation Guide for "${prodName}" ===`);
          console.log('Run via AI Agent (Codex / OpenCode / Claude Code / Hermes / OpenClaw / Antigravity):');
          console.log('Use slash command /create-prdd to start 9-section bilingual interview.');
        }
        break;
      }

      case 'brainstorm': {
        if (flags.quick && flags.deep) {
          console.error('Error: brainstorm cannot use --quick and --deep together');
          process.exit(1);
        }
        if ('out' in flags && typeof flags.out !== 'string') {
          console.error('Error: brainstorm --out requires a directory value');
          process.exit(1);
        }
        const topic = positional.join(' ').trim() || undefined;
        const guide = {
          command: 'brainstorm',
          topic: topic || null,
          description: 'Topic-agnostic interactive brainstorming workflow; the CLI prints guidance and does not generate the Markdown itself.',
          invocation: '/brainstorm [topic] [--quick|--deep] [--out <directory>]',
          output: {
            format: 'Markdown',
            count: 1,
            directory: (flags.out as string) || 'current working directory (or user-selected directory)',
            filename: 'Brainstorm - <sanitized-topic> - <YYYY-MM-DD>.md',
            collisionPolicy: 'append a numeric suffix; never overwrite silently',
          },
          session: {
            mode: flags.deep ? 'deep' : flags.quick ? 'quick' : 'standard',
            maxTurns: flags.deep ? 10 : flags.quick ? 6 : 10,
            ideaRequirement: flags.quick
              ? 'fewer than 8 allowed'
              : 'at least 8 distinct ideas unless the user explicitly requests fewer',
            cadence: 'one substantive question per turn',
            earlyFinishSignals: ['finish', 'done', 'export'],
            sections: [
              'Objective & Context',
              'Constraints & Non-Goals',
              'Assumptions & Evidence Boundaries',
              'Success Criteria',
              'Divergent Ideas',
              'Themes & Clusters',
              'Prioritization Criteria & Rationale',
              'Recommended Directions & Trade-offs',
              'Open Questions & Risks',
              'Next Actions',
            ],
          },
          mermaid: {
            policy: 'Include only when it materially clarifies relationships, stages, dependencies, or choices; omit decorative diagrams.',
            requirement: 'If included, use a valid mermaid fenced block, explain it in one sentence, and retain an equivalent prose explanation.',
          },
        };
        if (isJson) {
          console.log(JSON.stringify(guide, null, 2));
        } else {
          console.log(`=== Brainstorming Guide${topic ? ` for "${topic}"` : ''} ===`);
          console.log('Run via an AI agent with /brainstorm [topic] to conduct the one-question-per-turn interview.');
          console.log(`The agent exports one Markdown file: ${guide.output.filename}`);
          console.log('The CLI is guide-only; it does not run the interview or write the document.');
        }
        break;
      }

      case 'edit-prdd': {
        const prodName = positional[0] || (flags.name as string) || 'Product';
        const vaultPath = process.env.OBSIDIAN_VAULT_PATH || process.env.OBSIDIAN_VAULT || 'Dynamic (OBSIDIAN_VAULT_PATH env / user home / user prompt)';
        const guide = {
          command: 'edit-prdd',
          productName: prodName,
          vaultPath,
          description: 'Bilingual Product Requirements & Design Document (PRDD) editor for Obsidian',
          sections: [
            '1. Overview & Problem Statement',
            '2. Goals & Success Metrics',
            '3. User Stories / Use Cases',
            '4. Functional Requirements (MoSCoW)',
            '5. System Architecture (Mermaid flowchart TD)',
            '6. Database Schema / ERD (Mermaid erDiagram)',
            '7. API Contract (Endpoints & Mermaid sequenceDiagram)',
            '8. Non-Functional Requirements',
            '9. Dependencies & Risks'
          ],
          outputs: [
            `PRDD - ${prodName} (ID).md`,
            `PRDD - ${prodName} (EN).md`
          ]
        };
        if (isJson) {
          console.log(JSON.stringify(guide, null, 2));
        } else {
          console.log(`=== PRDD Editing Guide for "${prodName}" ===`);
          console.log('Run via AI Agent (Codex / OpenCode / Claude Code / Hermes / OpenClaw / Antigravity):');
          console.log('Use slash command /edit-prdd to edit and synchronize 9-section bilingual files.');
        }
        break;
      }

      case 'extract-knowledge': {
        const source = positional[0] || (flags.source as string);
        if (!source) {
          console.error('Error: source file or folder path is required for extract-knowledge');
          process.exit(1);
        }
        const result = await runExtractKnowledge({
          source,
          llm: Boolean(flags.llm),
          out: (flags.out as string) || undefined,
          vault: (flags.vault as string) || undefined,
          overwrite: Boolean(flags.overwrite),
          json: isJson,
        });
        console.log(result);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (isJson) {
      console.error(JSON.stringify({ success: false, error: message }, null, 2));
    } else {
      console.error(`❌ Error: ${message}`);
    }
    process.exit(1);
  }
}

main();
