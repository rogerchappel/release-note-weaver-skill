# release-note-weaver-skill

Generate release-candidate notes from local repo evidence without inventing claims.

The CLI reads completed tasks, verification logs, optional recent commits, and open tasks, then writes a Markdown note that separates proven changes from limitations and missing evidence.

## Quickstart

```bash
npm install
npm test
npm run check
npm run smoke
npm run release:check
node bin/release-note-weaver.js . --no-git
```

## CLI

```bash
release-note-weaver <repo>
release-note-weaver <repo> --no-git
release-note-weaver --no-git <repo>
release-note-weaver --help
release-note-weaver --version
```

The repository operand is optional and defaults to the current directory. Supported flags
may appear before or after it. Unknown options and extra repository operands print usage
information and exit `2` without generating a note.
Nonexistent repository paths and operands that are not directories are handled the same way:
the CLI prints a concise diagnostic with usage information and does not generate a note.

The command exits `0` when no missing-evidence warnings are produced and `1` when warnings
are present.

## Evidence Sources

- `docs/TASKS.md` checked tasks become evidence-backed changes.
- `docs/TASKS.md` unchecked tasks become follow-up.
- `docs/VERIFY.md` and `docs/RELEASE_CANDIDATE.md` command lines become verification evidence.
  Commands may be plain lines, Markdown list entries, fenced lines, or inline code followed by
  a prose result annotation; inline-code annotations are omitted from the extracted command.
  Supported command prefixes include Node package runners, Python, Go, Cargo, Deno, Bun,
  `make`, `just`, common JVM/.NET test runners, and relative executable paths such as
  `./scripts/verify.sh`. Narrative sentences and result labels are not command evidence.
- Recent Git commits are included unless `--no-git` is supplied. Git evidence is read only
  when the repository operand resolves to the Git worktree root itself. A plain directory
  nested inside another checkout is not treated as that checkout, and subdirectory operands
  are not supported. If the operand is not a Git worktree root, the note contains a
  `Git evidence unavailable` warning and the CLI exits `1`. Paths containing spaces are
  supported. Use `--no-git` to intentionally skip this check and retain file-only behavior.

## Safety

- Local reads only.
- No GitHub writes.
- No tags, releases, package publishing, or branch changes.

## Limitations

- Task parsing expects Markdown checklist syntax.
- Verification parsing recognizes the documented common command prefixes and relative executable
  paths; other command forms must be recorded using a supported runner.
- Generated text is a draft and should be reviewed before use in a public PR.

## Verify

```bash
npm run release:check
```
