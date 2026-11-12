import fs from 'node:fs';
import { unpack } from '/tmp/ardan/snap/tools/pack.mjs';
const html = fs.readFileSync('/tmp/ardan/snap/index.html', 'utf8');
const parts = unpack(html);
for (const [k, v] of Object.entries(parts)) { fs.writeFileSync(`/tmp/ardan/critique/ux/blobs/${k}.js`, v); console.log(k, v.length); }
