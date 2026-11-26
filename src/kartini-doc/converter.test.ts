import assert from 'node:assert/strict';
import test from 'node:test';
import { parseMarkdownToKartiniDocument } from './converter.ts';

test('parseMarkdownToKartiniDocument extracts summary from TL;DR section before fallback', () => {
  const md = `# Wallet Hardening Spec

## TL;DR
- Enforce atomic ledger locking on redemption callbacks and add idempotency checks.

## Product Context & Ownership
Details here.
`;

  const parsed = parseMarkdownToKartiniDocument(md);
  assert.equal(parsed.title, 'Wallet Hardening Spec');
  assert.equal(
    parsed.summary,
    'Enforce atomic ledger locking on redemption callbacks and add idempotency checks.'
  );
  assert.equal(parsed.sections[0]?.title, 'TL;DR');
});

test('parseMarkdownToKartiniDocument preserves Executive Summary and Overview extraction', () => {
  const md = `# Payments Spec

## Overview
Handle settlement webhooks safely.
`;

  const parsed = parseMarkdownToKartiniDocument(md);
  assert.equal(parsed.summary, 'Handle settlement webhooks safely.');
});
