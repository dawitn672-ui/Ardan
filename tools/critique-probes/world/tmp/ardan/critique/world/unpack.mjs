import fs from 'node:fs';
import { unpack } from '/tmp/ardan/snap/tools/pack.mjs';
const html = fs.readFileSync('/tmp/ardan/snap/index.html', 'utf8');
const parts = unpack(html);
for (const [k, v] of Object.entries(parts)) fs.writeFileSync(`/tmp/ardan/critique/world/blobs/${k}.js`, v);
const v = fs.readFileSync('/tmp/ardan/snap/vendor/ardan-b593143.html', 'utf8');
const p2 = unpack(v);
for (const [k, s] of Object.entries(p2)) fs.writeFileSync(`/tmp/ardan/critique/world/blobs/release-${k}.js`, s);
console.log(Object.fromEntries(Object.entries(parts).map(([k, s]) => [k, s.length])));
