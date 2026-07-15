import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const output = execFileSync('npm', ['pack', '--dry-run', '--json'], { encoding: 'utf8' });
const [pack] = JSON.parse(output);
const files = new Set(pack.files.map((file) => file.path));

for (const required of [
  'package.json',
  'README.md',
  'LICENSE',
  'SECURITY.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'SKILL.md',
  'bin/release-note-weaver.js',
  'lib/weaver.js',
  'fixtures/sample-repo/docs/TASKS.md'
]) {
  if (!files.has(required)) {
    throw new Error(`npm pack is missing ${required}`);
  }
}

const help = execFileSync('node', ['bin/release-note-weaver.js', '--help'], { encoding: 'utf8' });
if (!help.includes('Usage: release-note-weaver')) {
  throw new Error('CLI help output is missing usage text');
}

const version = execFileSync('node', ['bin/release-note-weaver.js', '--version'], { encoding: 'utf8' }).trim();
if (version !== pkg.version) {
  throw new Error(`CLI version ${version} does not match package version ${pkg.version}`);
}

console.log(`package smoke passed for ${pkg.name} with ${files.size} packed files`);
