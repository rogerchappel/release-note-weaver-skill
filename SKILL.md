# Release Note Weaver Skill

## When To Use

Use this skill when an agent has completed local repo work and needs evidence-backed release-candidate notes, PR body material, or launch-safe summaries.

## Inputs

- A local repository path.
- `docs/TASKS.md` with completed and open checklist items.
- Optional `docs/VERIFY.md` or `docs/RELEASE_CANDIDATE.md` with exact verification commands.
  Commands may be plain, bulleted, fenced, or inline-code entries. Supported prefixes include
  Node package runners, Python, Go, Cargo, Deno, Bun, `make`, `just`, JVM/.NET test runners,
  and relative executables such as `./scripts/verify.sh`; narrative/result lines are ignored.
- Optional git history.

## Side-Effect Boundaries

This skill only reads local files and prints Markdown. It must not create GitHub PRs, push branches, publish packages, tag releases, or edit release notes in place.

## Approval Requirements

No approval is required for local read-only note generation. Explicit approval is required before using the generated notes in external systems or performing any GitHub operation.

## Examples

```bash
release-note-weaver . > /tmp/release-notes.md
release-note-weaver ../some-repo --no-git
```

## Validation

Run:

```bash
npm test
npm run check
npm run smoke
```

Check that every public claim in the generated note is backed by a task, verification line, or commit.
