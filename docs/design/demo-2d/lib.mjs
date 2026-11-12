// Loads the part library from assets/parts/ (source JSON, read as it is: the gate-1 stand-in for tools/parts/blob-pack.mjs)
// and holds the four sitters of the style frame. Used by build.mjs and tests/v2/draw.test.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

export function loadLib(dir = path.join(root, 'assets/parts')) {
  const parts = {}; let palettes = null;
  const walk = d => {
    for (const f of fs.readdirSync(d).sort()) {
      const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) { walk(p); continue; }
      if (!f.endsWith('.json')) continue;
      const j = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (f === 'palettes.json') { palettes = j; continue; }
      if (j.layers || j.cuts) parts[j.id || path.basename(f, '.json')] = j;
      else for (const [k, v] of Object.entries(j)) if (v && typeof v === 'object' && v.layers) parts[v.id || k] = v;
    }
  };
  walk(dir);
  return { parts, palettes };
}

// The four sitters (characters.md §15 gate 1: a man of 32 in mail, a woman of 27, a girl of 6, a scarred man of 71).
// Every feature not named sits at its people's mean (0).
export const SITTERS = [
  {
    id: 'g1-wat', name: 'Wat Hollin', line: 'Man-at-arms, 32. Mail over a quilted coat; a cut on the cheek from last summer, still red.',
    sex: 'M', age: 32, height: 178, skin: 'weathered', eyes: 'hazel', hair: { style: 'cropped', color: 'darkbrown' }, beard: 'beard_short',
    g: { jawW: 0.6, chin: 0.5, chinW: 0.4, cheekbones: 0.5, cheeks: -0.5, noseBridge: 0.45, noseLen: 0.2, noseW: 0.3, lids: -0.35, lips: -0.3, mouthW: 0.2, browWeight: 0.6, faceLen: 0.1 },
    wounds: [{ k: 'cut', at: 'cheek_f', y: 0.6 }],
    dress: [{ id: 'gambeson' }, { id: 'hauberk' }, { id: 'guige' }],
  },
  {
    id: 'g1-alys', name: 'Alys', line: 'A tenant\'s wife, 27. A russet kirtle laced over a linen shift; her hair in one braid.',
    sex: 'F', age: 27, height: 163, skin: 'rosy', eyes: 'grey-blue', hair: { style: 'braid_side', color: 'chestnut' }, expr: { smile: 0.45 },
    g: { faceLen: -0.2, cheekbones: 0.5, cheeks: 0.25, eyeSize: 0.3, lips: 0.45, noseTip: -0.45, noseLen: -0.25, jawW: -0.2, chin: 0.2, browShape: 0.3, freckles: 0 },
    dress: [{ id: 'shift' }, { id: 'kirtle' }],
  },
  {
    id: 'g1-mae', name: 'Mae', line: 'Her daughter, 6. A blue wool smock gone short in the arms, a patch on the shoulder.',
    sex: 'F', age: 6, height: 114, skin: 'fair', eyes: 'grey-blue', hair: { style: 'braids_two', color: 'flaxen' }, expr: { smile: 0.6 },
    g: { cheeks: 0.6, noseTip: -0.5, eyeSize: 0.2, lips: 0.2, freckles: 1 }, flags: ['freckles'],
    dress: [{ id: 'smock' }],
  },
  {
    id: 'g1-oswin', name: 'Sir Oswin Garde', line: 'Lord of a manor, 71. A crimson gown, a green mantle lined with vair. An old sword cut through the brow; the nose broken twice.',
    sex: 'M', age: 71, height: 170, skin: 'aged', eyes: 'grey-blue', hair: { style: 'bald_fringe', color: 'grey' }, beard: 'beard_full', grey: 1, browColor: 'grey',
    g: { faceLen: 0.45, noseLen: 0.5, noseBridge: 0.75, jawW: 0.15, cheeks: -0.7, cheekbones: 0.6, lids: -0.6, browWeight: 0.9, browRidge: 0.8, lips: -0.4, earSize: 0.4 },
    wounds: [{ k: 'cut', at: 'brow_n', y: 40 }, { k: 'broken_nose', y: 30 }],
    dress: [{ id: 'gown' }, { id: 'mantle' }],
  },
];
