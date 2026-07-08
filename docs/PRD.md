# PRD

## Goal

Help agents turn local repo evidence into concise release-candidate notes while avoiding unsupported claims.

## Non-Goals

- No PR creation.
- No release tagging.
- No package publishing.
- No summarization from remote services.

## Requirements

- Read local task and verification docs.
- Include recent git commits when available.
- Keep completed changes, verification, commits, and limitations separate.
- Warn when task or verification evidence is missing.
- Provide fixture-backed tests and a smoke command.

## Success Metrics

- A fixture repo produces release-candidate notes with completed changes and verification.
- Missing evidence produces warnings and a non-zero CLI exit.
- Maintainers can paste the output into a PR body after review.
