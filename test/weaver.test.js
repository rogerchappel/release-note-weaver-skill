import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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

test('collects Markdown-formatted verification commands without result annotations', () => {
  const evidence = collectEvidence('fixtures/verification-syntax', { includeGit: false });
  assert.deepEqual(evidence.verification, [
    'npm test',
    'node bin/release-note-weaver.js . --no-git',
    'make test',
    'deno test',
    './scripts/verify.sh',
    'make check',
    'python3 -m pytest',
    'npx eslint .',
    'uv run pytest',
    'bash scripts/verify.sh',
    'pnpm test',
    'yarn test',
    'npm run check',
    'node --version'
  ]);
});

test('cli renders Markdown-formatted verification commands without a missing-evidence warning', () => {
  const cwd = new URL('..', import.meta.url);
  const output = execFileSync(
    'node',
    ['bin/release-note-weaver.js', 'fixtures/verification-syntax', '--no-git'],
    { cwd, encoding: 'utf8' }
  );

  assert.match(output, /- npm test\n/u);
  assert.match(output, /- node bin\/release-note-weaver\.js \. --no-git\n/u);
  assert.doesNotMatch(output, /passed, 13 tests/u);
  assert.match(output, /- make test\n/u);
  assert.match(output, /- deno test\n/u);
  assert.match(output, /- \.\/scripts\/verify\.sh\n/u);
  assert.match(output, /- python3 -m pytest\n/u);
  assert.match(output, /- npx eslint \.\n/u);
  assert.match(output, /- uv run pytest\n/u);
  assert.match(output, /- bash scripts\/verify\.sh\n/u);
  assert.match(output, /- pnpm test\n/u);
  assert.match(output, /- yarn test\n/u);
  assert.doesNotMatch(output, /passed, 14 tests/u);
  assert.doesNotMatch(output, /Run deno test/u);
  assert.doesNotMatch(output, /Result: make test/u);
  assert.doesNotMatch(output, /Run python3 -m pytest/u);
  assert.doesNotMatch(output, /Use npx eslint/u);
  assert.doesNotMatch(output, /The uv run pytest command/u);
  assert.doesNotMatch(output, /Run npm test before publishing/u);
  assert.doesNotMatch(output, /Missing verification command evidence/u);
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

function makeGitRepository(prefix = 'release-note-weaver-') {
  const repoPath = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(repoPath, 'docs'));
  fs.writeFileSync(path.join(repoPath, 'docs/TASKS.md'), '- [x] Test Git evidence\n');
  fs.writeFileSync(path.join(repoPath, 'docs/VERIFY.md'), 'npm test\n');
  execFileSync('git', ['init', '-q', repoPath]);
  execFileSync('git', ['-C', repoPath, 'config', 'user.name', 'Test User']);
  execFileSync('git', ['-C', repoPath, 'config', 'user.email', 'test@example.com']);
  execFileSync('git', ['-C', repoPath, 'add', '.']);
  execFileSync('git', ['-C', repoPath, 'commit', '-qm', 'repository evidence']);
  return repoPath;
}

test('collects Git commits only when the operand is the worktree root', (t) => {
  const repoPath = makeGitRepository('release note weaver root ');
  t.after(() => fs.rmSync(repoPath, { recursive: true, force: true }));

  const evidence = collectEvidence(repoPath);
  assert.equal(evidence.gitEvidenceAvailable, true);
  assert.match(evidence.commits[0], /repository evidence/u);
});

test('does not inherit Git commits for an unrelated nested directory', (t) => {
  const repoPath = makeGitRepository();
  const nestedPath = path.join(repoPath, 'unrelated target');
  fs.mkdirSync(path.join(nestedPath, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(nestedPath, 'docs/TASKS.md'), '- [x] Nested task\n');
  fs.writeFileSync(path.join(nestedPath, 'docs/VERIFY.md'), 'npm test\n');
  t.after(() => fs.rmSync(repoPath, { recursive: true, force: true }));

  const result = weaveReleaseNote(nestedPath);
  assert.deepEqual(result.evidence.commits, []);
  assert.ok(result.warnings.includes(
    'Git evidence unavailable: repository operand must be a Git worktree root.'
  ));
});

test('warns and exits nonzero when Git evidence is requested for a non-Git directory', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'release note weaver non git '));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  const cwd = new URL('..', import.meta.url);
  const result = spawnSync('node', ['bin/release-note-weaver.js', directory], {
    cwd,
    encoding: 'utf8'
  });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /Git evidence unavailable: repository operand must be a Git worktree root\./u);
});

test('--no-git remains valid for a non-Git directory with spaces', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'release note weaver no git '));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  const result = weaveReleaseNote(directory, { includeGit: false });
  assert.equal(result.evidence.gitEvidenceAvailable, false);
  assert.doesNotMatch(result.markdown, /Git evidence unavailable/u);
});
