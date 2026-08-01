import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
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

test('library rejects nonexistent and non-directory repository paths', () => {
  assert.throws(
    () => collectEvidence('fixtures/does-not-exist', { includeGit: false }),
    /Repository path does not exist:/u
  );
  assert.throws(
    () => collectEvidence('package.json', { includeGit: false }),
    /Repository path is not a directory:/u
  );
});

test('cli exposes help and version metadata', () => {
  const cwd = new URL('..', import.meta.url);
  const help = execFileSync('node', ['bin/release-note-weaver.js', '--help'], { cwd, encoding: 'utf8' });
  assert.match(help, /release-note-weaver \[repo\]/u);

  const version = execFileSync('node', ['bin/release-note-weaver.js', '--version'], { cwd, encoding: 'utf8' });
  assert.equal(version, '0.1.0\n');
});

test('cli rejects unknown options without generating a release note', () => {
  const cwd = new URL('..', import.meta.url);
  const result = spawnSync('node', ['bin/release-note-weaver.js', '--bogus'], {
    cwd,
    encoding: 'utf8'
  });

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /Unknown option: --bogus/u);
  assert.match(result.stderr, /Usage: release-note-weaver/u);
  assert.doesNotMatch(result.stderr, /Release Candidate Note/u);
});

test('cli rejects more than one repository operand', () => {
  const cwd = new URL('..', import.meta.url);
  const result = spawnSync(
    'node',
    ['bin/release-note-weaver.js', 'fixtures/sample-repo', 'fixtures/empty-repo', '--no-git'],
    { cwd, encoding: 'utf8' }
  );

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /Unexpected repository operand: fixtures\/empty-repo/u);
  assert.match(result.stderr, /Usage: release-note-weaver/u);
});

test('cli rejects invalid repository paths without generating a release note', () => {
  const cwd = new URL('..', import.meta.url);

  for (const [repoPath, diagnostic] of [
    ['fixtures/does-not-exist', /Repository path does not exist:/u],
    ['package.json', /Repository path is not a directory:/u]
  ]) {
    const result = spawnSync('node', ['bin/release-note-weaver.js', repoPath, '--no-git'], {
      cwd,
      encoding: 'utf8'
    });

    assert.equal(result.status, 2);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, diagnostic);
    assert.match(result.stderr, /Usage: release-note-weaver/u);
    assert.doesNotMatch(result.stderr, /Release Candidate Note/u);
  }
});

test('cli accepts supported flags before or after the repository operand', () => {
  const cwd = new URL('..', import.meta.url);
  const before = execFileSync(
    'node',
    ['bin/release-note-weaver.js', '--no-git', 'fixtures/sample-repo'],
    { cwd, encoding: 'utf8' }
  );
  const after = execFileSync(
    'node',
    ['bin/release-note-weaver.js', 'fixtures/sample-repo', '--no-git'],
    { cwd, encoding: 'utf8' }
  );

  assert.equal(before, after);
  assert.match(before, /Release Candidate Note/u);
});
