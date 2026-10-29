import type { JiraConfig } from '../review-pr/types.ts';
import { loadJiraConfig } from '../review-pr/index.ts';
import {
  createIssue,
  findBoards,
  findTargetSprint,
  getSprints,
  addIssueToSprint,
  searchUsers,
  textToADF,
} from '../review-pr/jira-client.ts';

export type { JiraConfig };

export { loadJiraConfig, textToADF };

function storyTemplate(): string {
  return [
    'h3. User Story',
    '[Isi deskripsi cerita pengguna, contoh: Sebagai <peran>, saya ingin <fitur> sehingga <manfaat>.]',
    '',
    'h3. Acceptance Criteria',
    '- [ ] [Kriteria 1: Kondisi utama yang harus dipenuhi agar cerita dianggap selesai]',
    '- [ ] [Kriteria 2: Penanganan edge case atau aturan bisnis]',
    '- [ ] [Kriteria 3: Kebutuhan responsivitas/desain/performa jika ada]',
    '',
    'h3. Additional Context',
    '- [Isi catatan tambahan, link Figma/PRD, ketergantungan tiket lain, atau pertanyaan pending]',
  ].join('\n');
}

function taskTemplate(): string {
  return [
    'h3. Description',
    '[Isi deskripsi tugas teknis yang akan dikerjakan.]',
    '',
    'h3. Technical Details',
    '- [Spesifikasikan modul, endpoint API, skema database, atau komponen yang terdampak]',
    '- [Penjelasan arsitektur atau keputusan teknis yang diambil]',
    '',
    'h3. Definition of Done',
    '- [ ] Code changes implemented per technical design',
    '- [ ] Unit and/or integration tests cover modified code paths',
    '- [ ] Manually verified on local/staging environment',
    '- [ ] PR submitted for peer review with clear context',
    '',
    'h3. Notes',
    '- [Isi item out-of-scope, potensi risiko, atau hal yang memerlukan verifikasi lanjut]',
  ].join('\n');
}

function epicTemplate(): string {
  return [
    'h3. Epic Description',
    '[Isi gambaran besar inisiatif atau proyek ini.]',
    '',
    'h3. Goals / Objectives',
    '- [ ] [Tujuan 1: Indikator keberhasilan utama dari epic ini]',
    '- [ ] [Tujuan 2: Output/fitur utama yang diproduksi]',
    '',
    'h3. Key Initiatives',
    '- [Isi daftar alur kerja atau inisiatif utama yang dinaungi epic ini]',
    '',
    'h3. Out of Scope',
    '- [Daftar item yang secara eksplisit tidak dicakup dalam epic ini]',
    '',
    'h3. Dependencies & Risks',
    '- [Penjelasan ketergantungan eksternal, blocker, atau risiko proyek]',
  ].join('\n');
}

function bugTemplate(): string {
  return [
    'h3. Description',
    '[Isi penjelasan singkat mengenai masalah atau bug yang ditemukan.]',
    '',
    'h3. Steps to Reproduce',
    '1. [Langkah 1: Navigasi ke halaman/endpoint bermasalah]',
    '2. [Langkah 2: Lakukan tindakan spesifik yang memicu kesalahan]',
    '3. [Langkah 3: Amati kegagalan yang terjadi]',
    '',
    'h3. Expected Behavior',
    '- [Jelaskan hasil atau perilaku yang seharusnya terjadi]',
    '',
    'h3. Actual Behavior',
    '- [Jelaskan hasil atau perilaku salah yang saat ini terjadi, sertakan error log jika ada]',
    '',
    'h3. Environment',
    '- Environment (Staging / Production / Local):',
    '- App / API Version / Commit:',
    '- Device / OS / Browser:',
    '',
    'h3. Evidence',
    '- [Lampirkan screenshot, video rekaman layar, atau log API/cURL]',
  ].join('\n');
}

export function formatDescription(
  issueType: string | undefined,
  description: string,
): string {
  if (description.trim()) return description.trim();
  switch (issueType?.toLowerCase()) {
    case 'story':
      return storyTemplate();
    case 'bug':
      return bugTemplate();
    case 'epic':
      return epicTemplate();
    case 'task':
    default:
      return taskTemplate();
  }
}

function formatResult(
  issueKey: string,
  summary: string,
  sprintName: string | null,
  boardName: string | null,
  parentEpicKey?: string,
): string {
  let msg = `✅ **Ticket created: ${issueKey}**\n\n**Summary:** ${summary}`;
  if (parentEpicKey) {
    msg += `\n**Epic:** ${parentEpicKey}`;
  }
  if (sprintName) {
    msg += `\n**Sprint:** ${sprintName}`;
  }
  if (boardName) {
    msg += `\n**Board:** ${boardName}`;
  }
  return msg;
}

function getEpicCustomFields(issueType: string | undefined, parentEpicKey?: string): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  if (issueType?.toLowerCase() === 'epic') {
    // Epic Name is required for Epic issue type
    fields.customfield_10011 = ''; // placeholder; overridden below if possible
  }

  if (parentEpicKey) {
    // Link child issue to parent Epic
    fields.customfield_10014 = parentEpicKey;
  }

  return fields;
}

export { createIssue, findBoards, findTargetSprint, addIssueToSprint };

export interface TicketParams {
  summary: string;
  description?: string;
  issueType?: string;
  /** Jira account ID for the assignee (e.g. "557058:abc123") */
  assigneeAccountId?: string;
  /** Assignee display name — resolved to accountId via searchUsers if assigneeAccountId is not set */
  assignee?: string;
  customFields?: Record<string, unknown>;
  /** If set, links the created issue as a child of this Epic key (e.g. "KAIRA-100") */
  parentEpicKey?: string;
  /** Required estimate unless supplied in customFields.customfield_10032. */
  storyPoints?: number;
  /** If set, finds and adds the issue to the sprint with this name instead of auto-detecting */
  sprintName?: string;
}

export type TicketResult = {
  issueKey: string;
  sprintName: string | null;
  boardName: string | null;
  message: string;
};

export async function createTicketWorkflow(
  config: JiraConfig,
  params: TicketParams,
): Promise<TicketResult> {
  const points = params.storyPoints ?? params.customFields?.customfield_10032;
  if (typeof points !== 'number' || !Number.isFinite(points) || points < 0) {
    throw new Error('Provide a finite, non-negative storyPoints estimate based on ticket scope; no estimate is inferred by the CLI.');
  }
  const isEpic = params.issueType?.toLowerCase() === 'epic';
  const boards = await findBoards(config);
  if (boards.length === 0) {
    throw new Error(
      `No boards found for project "${config.projectKey}". Make sure the project has a board configured.`,
    );
  }
  const board = boards[0];

  // Resolve sprint: use sprintName if provided, otherwise auto-detect
  let sprintName: string | null = null;
  let sprint: Awaited<ReturnType<typeof findTargetSprint>> = null;

  if (isEpic && params.sprintName) {
    throw new Error('Epics are not added to sprints; omit sprintName.');
  }
  if (params.sprintName) {
    // Try active sprints first, then future
    const allSprints = [
      ...(await getSprints(config, board.id, 'active')),
      ...(await getSprints(config, board.id, 'future')),
    ];
    sprint = allSprints.find((s) => s.name === params.sprintName) ?? null;
    if (!sprint) throw new Error(`Sprint "${params.sprintName}" was not found on board "${board.name}". No issue was created.`);
    if (sprint) {
      sprintName = sprint.name;
    }
  } else if (!isEpic) {
    sprint = await findTargetSprint(config, board.id);
    if (sprint) {
      sprintName = sprint.name;
    }
  }

  // Resolve assignee: if assignee (display name) is provided and no accountId, search for it
  let assigneeAccountId = params.assigneeAccountId;
  if (!assigneeAccountId && params.assignee) {
    const users = await searchUsers(config, params.assignee);
    const normalized = params.assignee.trim().toLowerCase();
    const matches = users.filter(user => user.displayName.trim().toLowerCase() === normalized);
    if (matches.length !== 1) throw new Error(`Assignee "${params.assignee}" must match exactly one Jira display name. Use assigneeAccountId to disambiguate. No issue was created.`);
    assigneeAccountId = matches[0].accountId;
  }

  const description = formatDescription(
    params.issueType,
    params.description ?? '',
  );

  // Merge epic-specific custom fields with user-provided ones
  const epicFields = getEpicCustomFields(params.issueType, params.parentEpicKey);
  const mergedCustomFields: Record<string, unknown> = {
    ...epicFields,
    ...(params.customFields ?? {}),
  };

  mergedCustomFields.customfield_10032 = points;

  // For Epic type, set Epic Name to the summary if no explicit epic name given
  if (isEpic && !mergedCustomFields.customfield_10011) {
    mergedCustomFields.customfield_10011 = params.summary;
  }

  const issue = await createIssue(config, {
    summary: params.summary,
    description,
    issueType: params.issueType,
    assigneeAccountId,
    customFields: Object.keys(mergedCustomFields).length > 0 ? mergedCustomFields : undefined,
  });

  // Don't add Epics to sprints — they live above sprint level
  if (!isEpic && sprint) {
    try {
      await addIssueToSprint(config, sprint.id, issue.key);
    } catch (error) {
      throw new Error(`Issue ${issue.key} was created, but adding it to sprint "${sprint.name}" failed. Inspect and repair this issue; do not retry creation.`, { cause: error });
    }
  }

  const message = formatResult(
    issue.key,
    params.summary,
    sprintName,
    board.name,
    params.parentEpicKey,
  ) + `\n**Type:** ${params.issueType ?? 'Task'}\n**Assignee:** ${params.assignee ?? assigneeAccountId ?? 'Not specified'}\n**Story points:** ${points}`
    + (sprint ? '' : `\n**Placement:** ${isEpic ? 'Outside sprints (Epic)' : 'Backlog'}`);

  return {
    issueKey: issue.key,
    sprintName,
    boardName: board.name,
    message,
  };
}

export async function runFromEnv(params: TicketParams): Promise<string> {
  const config = loadJiraConfig();
  const result = await createTicketWorkflow(config, params);
  return result.message;
}
