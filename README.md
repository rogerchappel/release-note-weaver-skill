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
release-note-weaver --help
release-note-weaver --version
```

The command exits `0` when no missing-evidence warnings are produced and `1` when warnings are present.

## Evidence Sources

- `docs/TASKS.md` checked tasks become evidence-backed changes.
- `docs/TASKS.md` unchecked tasks become follow-up.
- `docs/VERIFY.md` and `docs/RELEASE_CANDIDATE.md` command lines become verification evidence.
- Recent git commits are included unless `--no-git` is supplied.

## Safety

- Local reads only.
- No GitHub writes.
- No tags, releases, package publishing, or branch changes.

## Limitations

- Task parsing expects Markdown checklist syntax.
- Verification parsing only recognizes common command prefixes.
- Generated text is a draft and should be reviewed before use in a public PR.

## Verify

```bash
npm run release:check
```
