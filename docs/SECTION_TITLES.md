# Configurable section titles

`weaveReleaseNote(repoPath, options)` accepts an optional `sectionTitles` object. Use these keys to override the Markdown headings; omitted keys retain their defaults:

| Key | Default heading |
| --- | --- |
| `changes` | Evidence-Backed Changes |
| `verification` | Verification |
| `commits` | Recent Commits |
| `followUp` | Limitations And Follow-Up |
| `warnings` | Warnings |

Example:

```js
import { weaveReleaseNote } from './lib/weaver.js';

const { markdown } = weaveReleaseNote('.', {
  sectionTitles: {
    changes: 'Delivered',
    verification: 'Checks',
    followUp: 'Next steps'
  }
});
console.log(markdown);
```

Only heading labels change; the evidence and section contents are unchanged. The default title remains `Release Candidate Notes`.
