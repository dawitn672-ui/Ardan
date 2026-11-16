import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { unpack } from '/tmp/ardan/snap/tools/blob-pack.mjs';
const root = '/tmp/ardan/snap';
const vend = unpack(fs.readFileSync(root + '/vendor/ardan-b593143.html', 'utf8'));
const vhtml = fs.readFileSync(root + '/vendor/ardan-b593143.html', 'utf8');
const feats = fs.readdirSync(root + '/features').filter(d => /^\d+-/.test(d) && !fs.existsSync(`${root}/features/${d}/.wip`)).sort();
let nPatch = 0, nEdit = 0, notInVendor = 0, findLen = [], counts = {}, multi = 0, longFinds = [], chained = [];
const byBlob = {};
for (const d of feats) {
  const f = `${root}/features/${d}/patches.mjs`;
  if (!fs.existsSync(f)) continue;
  const P = (await import(pathToFileURL(f).href)).default;
  for (const p of P) {
    nPatch++;
    byBlob[p.blob] = (byBlob[p.blob] || 0) + 1;
    for (const [find, rep, want = 1] of p.edits) {
      nEdit++; findLen.push(find.length);
      if (want > 1) multi++;
      const target = p.blob === 'html' ? vhtml : vend[p.blob];
      if (!target.includes(find)) { notInVendor++; chained.push(`${d}/${p.id}`); }
      if (find.length > 400) longFinds.push([d + '/' + p.id, find.length]);
    }
    counts[d] = (counts[d] || 0) + p.edits.length;
  }
}
findLen.sort((a, b) => a - b);
console.log({ features: feats.length, patchObjects: nPatch, edits: nEdit, byBlob, multiMatchEdits: multi, findMedian: findLen[findLen.length >> 1], findMax: findLen[findLen.length - 1], editsWhoseFindIsNotInVendor: notInVendor });
console.log('most edits:', Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => k + ' ' + v).join(', '));
console.log('long finds (>400 chars):', longFinds.length, longFinds.slice(0, 8));
console.log('chained (find only exists after an earlier feature):', chained.length, [...new Set(chained.map(c => c.split('/')[0]))].slice(0, 40).join(', '));
