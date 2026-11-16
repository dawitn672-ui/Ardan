import fs from 'node:fs';
import { unpack } from '/tmp/ardan/snap/tools/blob-pack.mjs';
const html = fs.readFileSync(process.argv[2], 'utf8');
const parts = unpack(html);
for (const [k, v] of Object.entries(parts)) { fs.writeFileSync(`${process.argv[3]}/${k}.js`, v); console.log(k, (v.length/1024).toFixed(0), 'KB'); }
// also inline scripts sizes
const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].map(m => [m[1].slice(0,80), m[2].length]);
console.log(scripts);
