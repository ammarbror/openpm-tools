import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatDescription } from './index.ts';

describe('formatDescription', () => {
  it('formats Story description with provided text', () => {
    const res = formatDescription('story', 'As a user I want login feature');
    assert.match(res, /h3\. User Story/);
    assert.match(res, /As a user I want login feature/);
    assert.match(res, /h3\. Acceptance Criteria/);
    assert.match(res, /h3\. Additional Context/);
  });

  it('formats Story description when text is empty with section guidance', () => {
    const res = formatDescription('story', '');
    assert.match(res, /h3\. User Story/);
    assert.match(res, /Isi deskripsi cerita pengguna/);
    assert.match(res, /h3\. Acceptance Criteria/);
    assert.match(res, /h3\. Additional Context/);
  });

  it('formats Bug description when text is empty with reproduction steps', () => {
    const res = formatDescription('bug', '');
    assert.match(res, /h3\. Description/);
    assert.match(res, /h3\. Steps to Reproduce/);
    assert.match(res, /h3\. Expected Behavior/);
    assert.match(res, /h3\. Actual Behavior/);
    assert.match(res, /h3\. Environment/);
    assert.match(res, /h3\. Evidence/);
  });

  it('formats Task description when text is empty with tech details and DoD', () => {
    const res = formatDescription('task', '');
    assert.match(res, /h3\. Description/);
    assert.match(res, /h3\. Technical Details/);
    assert.match(res, /h3\. Definition of Done/);
    assert.match(res, /h3\. Notes/);
  });

  it('formats Epic description when text is empty with goals and key initiatives', () => {
    const res = formatDescription('epic', '');
    assert.match(res, /h3\. Epic Description/);
    assert.match(res, /h3\. Goals \/ Objectives/);
    assert.match(res, /h3\. Key Initiatives/);
    assert.match(res, /h3\. Out of Scope/);
    assert.match(res, /h3\. Dependencies & Risks/);
  });
});
