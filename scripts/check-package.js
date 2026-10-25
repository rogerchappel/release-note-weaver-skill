import assert from 'node:assert/strict';
import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const workflow = fs.readFileSync('.github/workflows/ci.yml', 'utf8');

assert.equal(packageJson.type, 'module');
assert.ok(packageJson.bin['release-note-weaver']);
assert.ok(packageJson.scripts.test);
assert.ok(packageJson.scripts.smoke);
assert.ok(packageJson.scripts['package:smoke']);
assert.ok(packageJson.scripts['release:check']);
assert.ok(packageJson.files.includes('SKILL.md'));
assert.ok(packageJson.files.includes('fixtures'));
assert.ok(packageJson.files.includes('LICENSE'));
assert.ok(packageJson.files.includes('SECURITY.md'));
assert.ok(packageJson.files.includes('CHANGELOG.md'));
assert.ok(packageJson.files.includes('CONTRIBUTING.md'));

// CI intentionally uses the one aggregate readiness gate, rather than a
// separate release:readiness alias that could drift from release:check.
assert.match(workflow, /run: npm run release:check/);
assert.match(packageJson.scripts['release:check'], /npm run check/);
assert.match(packageJson.scripts['release:check'], /npm test/);
assert.match(packageJson.scripts['release:check'], /npm run smoke/);
assert.match(packageJson.scripts['release:check'], /npm run package:smoke/);

console.log('package metadata and release readiness contract ok');
