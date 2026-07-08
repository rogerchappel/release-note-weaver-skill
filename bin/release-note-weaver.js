#!/usr/bin/env node
import { weaveReleaseNote } from '../lib/weaver.js';

function parseArgs(argv) {
  const args = { repoPath: '.', includeGit: true };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--no-git') {
      args.includeGit = false;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else {
      args.repoPath = arg;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log(`Usage: release-note-weaver [repo] [--no-git]

Generates a Markdown release-candidate note from local evidence.`);
  process.exit(0);
}

const result = weaveReleaseNote(args.repoPath, { includeGit: args.includeGit });
console.log(result.markdown);
process.exit(result.warnings.length === 0 ? 0 : 1);
