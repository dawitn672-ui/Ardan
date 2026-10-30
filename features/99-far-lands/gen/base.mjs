// The Known World as the release ships it: LORE.map (grid and provinces) and LORE's realms, read from the vendored
// build. The generator reads it to stitch the far lands to its edges and never writes it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unpack } from '../../../tools/pack.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export function loadBase() {
  const html = fs.readFileSync(path.join(ROOT, 'vendor/ardan-b593143.html'), 'utf8');
  const core = unpack(html)['ardan-core'];
  const a = core.indexOf('const LORE=JSON.parse(`'), b = core.indexOf('`)', a);
  const LORE = JSON.parse(core.slice(a + 23, b).replace(/\\`/g, '`').replace(/\\\\/g, '\\'));
  const M = LORE.map, bin = Buffer.from(M.rle, 'base64'), grid = new Int16Array(M.gw * M.gh);
  let k = 0;
  for (let i = 0; i + 3 < bin.length; i += 4) { const v = bin.readUInt16LE(i) - 1, n = bin.readUInt16LE(i + 2); grid.fill(v, k, k + n); k += n; }
  return { LORE, gw: M.gw, gh: M.gh, cell: M.cell, grid, provinces: M.provinces, root: ROOT };
}
