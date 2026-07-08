# Release Candidate Notes

## Changes

- Added a read-only release-note weaver CLI.
- Added evidence collection from tasks, verification docs, and commits.
- Added fixture-backed tests.
- Documented safety boundaries and orchestration.

## Verification

- `npm test` - passed, 3 tests.
- `npm run check` - passed, package metadata ok.
- `npm run smoke` - passed, generated evidence-backed notes from fixture data with no missing-evidence warnings.

## Classification

Ship.
