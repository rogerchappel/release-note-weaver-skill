import fs from 'node:fs';
import path from 'node:path';
import childProcess from 'node:child_process';

function readIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return '';
    throw error;
  }
}

function checkedTasks(tasksMarkdown) {
  return tasksMarkdown
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*-\s+\[x\]\s+(.+)$/i))
    .filter(Boolean)
    .map((match) => match[1].trim());
}

function uncheckedTasks(tasksMarkdown) {
  return tasksMarkdown
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*-\s+\[\s\]\s+(.+)$/i))
    .filter(Boolean)
    .map((match) => match[1].trim());
}

function verificationLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => line.replace(/^[-*]\s+/, ''))
    .filter((line) => /^(npm|node|bash|pnpm|yarn|python|pytest|go test|cargo test)\b/.test(line))
}

function gitCommits(repoPath) {
  try {
    const output = childProcess.execFileSync('git', ['-C', repoPath, 'log', '--oneline', '-8'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return output.split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

function bulletList(items, fallback) {
  if (items.length === 0) return [`- ${fallback}`];
  return items.map((item) => `- ${item}`);
}

function buildMarkdown(evidence, warnings) {
  const lines = [
    '# Release Candidate Notes',
    '',
    '## Evidence-Backed Changes',
    ...bulletList(evidence.completedTasks, 'No completed tasks found in docs/TASKS.md.'),
    '',
    '## Verification',
    ...bulletList(evidence.verification, 'No verification commands found in docs/VERIFY.md or docs/RELEASE_CANDIDATE.md.'),
    '',
    '## Recent Commits',
    ...bulletList(evidence.commits, 'Git history not inspected or no commits found.'),
    '',
    '## Limitations And Follow-Up',
    ...bulletList(evidence.openTasks, 'No unchecked tasks found.'),
    '',
    '## Warnings',
    ...bulletList(warnings, 'No missing evidence warnings.')
  ];

  return `${lines.join('\n')}\n`;
}

export function collectEvidence(repoPath = '.', options = {}) {
  const absolutePath = path.resolve(repoPath);
  const tasks = readIfExists(path.join(absolutePath, 'docs/TASKS.md'));
  const verify = [
    readIfExists(path.join(absolutePath, 'docs/VERIFY.md')),
    readIfExists(path.join(absolutePath, 'docs/RELEASE_CANDIDATE.md'))
  ].join('\n');

  return {
    repoPath: absolutePath,
    completedTasks: checkedTasks(tasks),
    openTasks: uncheckedTasks(tasks),
    verification: verificationLines(verify),
    commits: options.includeGit === false ? [] : gitCommits(absolutePath)
  };
}

export function weaveReleaseNote(repoPath = '.', options = {}) {
  const evidence = collectEvidence(repoPath, options);
  const warnings = [];

  if (evidence.completedTasks.length === 0) warnings.push('Missing completed task evidence in docs/TASKS.md.');
  if (evidence.verification.length === 0) warnings.push('Missing verification command evidence.');
  if (options.includeGit !== false && evidence.commits.length === 0) warnings.push('No git commit evidence found.');

  return {
    evidence,
    warnings,
    markdown: buildMarkdown(evidence, warnings)
  };
}
