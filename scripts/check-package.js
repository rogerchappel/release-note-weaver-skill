import assert from 'node:assert/strict';
import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

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

console.log('package metadata ok');
