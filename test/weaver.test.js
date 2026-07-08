import assert from 'node:assert/strict';
import test from 'node:test';
import { collectEvidence, weaveReleaseNote } from '../lib/weaver.js';

test('collects completed tasks and verification lines', () => {
  const evidence = collectEvidence('fixtures/sample-repo', { includeGit: false });
  assert.deepEqual(evidence.completedTasks, [
    'Scaffold CLI',
    'Add safety docs'
  ]);
  assert.deepEqual(evidence.verification, [
    'npm test',
    'npm run smoke'
  ]);
});

test('separates open tasks from completed changes', () => {
  const evidence = collectEvidence('fixtures/sample-repo', { includeGit: false });
  assert.deepEqual(evidence.openTasks, ['Add hosted docs']);
});

test('renders warnings when evidence is missing', () => {
  const result = weaveReleaseNote('fixtures/empty-repo', { includeGit: false });
  assert.ok(result.warnings.includes('Missing completed task evidence in docs/TASKS.md.'));
  assert.match(result.markdown, /Warnings/);
});
