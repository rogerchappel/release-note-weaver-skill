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

function validateRepositoryPath(repoPath) {
  let stats;
  try {
    stats = fs.statSync(repoPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Repository path does not exist: ${repoPath}`);
    }
    throw error;
  }

  if (!stats.isDirectory()) {
    throw new Error(`Repository path is not a directory: ${repoPath}`);
  }
}

function checkedTasks(tasksMarkdown) {
  return tasksMarkdown
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*(?:[-*+]|\d+[.)])\s+\[x\]\s+(.+)$/i))
    .filter(Boolean)
    .map((match) => match[1].trim());
}

function uncheckedTasks(tasksMarkdown) {
  return tasksMarkdown
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*(?:[-*+]|\d+[.)])\s+\[\s\]\s+(.+)$/i))
    .filter(Boolean)
    .map((match) => match[1].trim());
}

function verificationLines(text) {
  const commandPattern = /^(?:(?:npm|npx|node|bash|pnpm|yarn|python|python3|pytest|uv|deno|bun|make|just|go test|cargo test|dotnet test|mvn|gradle|\.\/[^\s]+)(?:\s|$))/;
  const proseSentencePattern = /\b(?:should|must|was|were|is|are|will)\b.*[.!?]$/i;

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => line.replace(/^(?:[-*+]|\d+[.)])\s+/, ''))
    .map((line) => line.match(/^`([^`]+)`(?:\s+.*)?$/)?.[1] ?? line)
    .filter((line) => commandPattern.test(line) && !proseSentencePattern.test(line))
}

function gitCommits(repoPath) {
  try {
    const topLevel = childProcess.execFileSync(
      'git',
      ['-C', repoPath, 'rev-parse', '--show-toplevel'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();

    if (fs.realpathSync(topLevel) !== fs.realpathSync(repoPath)) {
      return { available: false, commits: [] };
    }

    const output = childProcess.execFileSync('git', ['-C', repoPath, 'log', '--oneline', '-8'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return { available: true, commits: output.split(/\r?\n/).filter(Boolean) };
  } catch {
    return { available: false, commits: [] };
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
  validateRepositoryPath(absolutePath);
  const tasks = readIfExists(path.join(absolutePath, 'docs/TASKS.md'));
  const verify = [
    readIfExists(path.join(absolutePath, 'docs/VERIFY.md')),
    readIfExists(path.join(absolutePath, 'docs/RELEASE_CANDIDATE.md'))
  ].join('\n');

  const git = options.includeGit === false
    ? { available: false, commits: [] }
    : gitCommits(absolutePath);

  return {
    repoPath: absolutePath,
    completedTasks: checkedTasks(tasks),
    openTasks: uncheckedTasks(tasks),
    verification: verificationLines(verify),
    commits: git.commits,
    gitEvidenceAvailable: git.available
  };
}

export function weaveReleaseNote(repoPath = '.', options = {}) {
  const evidence = collectEvidence(repoPath, options);
  const warnings = [];

  if (evidence.completedTasks.length === 0) warnings.push('Missing completed task evidence in docs/TASKS.md.');
  if (evidence.verification.length === 0) warnings.push('Missing verification command evidence.');
  if (options.includeGit !== false && !evidence.gitEvidenceAvailable) {
    warnings.push('Git evidence unavailable: repository operand must be a Git worktree root.');
  } else if (options.includeGit !== false && evidence.commits.length === 0) {
    warnings.push('No git commit evidence found.');
  }

  return {
    evidence,
    warnings,
    markdown: buildMarkdown(evidence, warnings)
  };
}
