import { describe, it } from 'node:test';
import assert from 'node:assert';
import { extractJiraKeys } from './jira-detector.js';

void describe('extractJiraKeys', () => {
  void it('does not publish to keys inherited only from commit messages', () => {
    assert.deepStrictEqual(extractJiraKeys({ title: 'KAIRA-975', description: '', sourceBranch: 'KAIRA-975',
      commitMessages: ["Merge branch KAIRA-564", 'fix KAIRA-777'] }), ['KAIRA-975']);
    assert.deepStrictEqual(extractJiraKeys({ title: 'Fix', description: '', sourceBranch: 'fix',
      commitMessages: ['fix KAIRA-777'] }), []);
  });
  void it('finds a key in the title', () => {
    const result = extractJiraKeys({
      title: 'Fix KAIRA-123 bug',
      description: '',
      sourceBranch: '',
      commitMessages: [],
    });
    assert.deepStrictEqual(result, ['KAIRA-123']);
  });

  void it('uses explicit Jira links in descriptions, not incidental ticket mentions', () => {
    assert.deepStrictEqual(extractJiraKeys({ title: '', sourceBranch: '', commitMessages: [],
      description: 'Compare KAIRA-999. Ticket: https://jira.example.com/browse/KAIRA-123' }), ['KAIRA-123']);
  });

  void it('finds a key in the branch name', () => {
    const result = extractJiraKeys({
      title: '',
      description: '',
      sourceBranch: 'feature/KAIRA-456',
      commitMessages: [],
    });
    assert.deepStrictEqual(result, ['KAIRA-456']);
  });

  void it('deduplicates multiple occurrences of the same key across fields', () => {
    const result = extractJiraKeys({
      title: 'KAIRA-999 Fix',
      description: 'Related to KAIRA-999',
      sourceBranch: 'bugfix/KAIRA-999',
      commitMessages: ['wip KAIRA-999', 'KAIRA-999 done'],
    });
    assert.deepStrictEqual(result, ['KAIRA-999']);
  });

  void it('returns an empty array when no Jira keys are present', () => {
    const result = extractJiraKeys({
      title: 'General cleanup',
      description: 'No tickets here',
      sourceBranch: 'main',
      commitMessages: ['chore: tidy up'],
    });
    assert.deepStrictEqual(result, []);
  });

  void it('matches case-insensitive keys and normalizes to uppercase', () => {
    const result = extractJiraKeys({
      title: 'fix kaira-789 issue',
      description: '',
      sourceBranch: '',
      commitMessages: [],
    });
    assert.deepStrictEqual(result, ['KAIRA-789']);
  });
});
