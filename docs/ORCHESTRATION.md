# Orchestration

## Agent Workflow

1. Run the target repo's verification commands.
2. Record exact commands in `docs/VERIFY.md` or `docs/RELEASE_CANDIDATE.md`.
3. Run `release-note-weaver <repo>`.
4. Review warnings before copying text into a PR body.

## External Actions

The skill does not perform external actions. If an agent later opens a PR or updates GitHub metadata, that is a separate approved workflow.
