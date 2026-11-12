// Where the features live. Every tool, test and bench finds feature folders through this file, never by path.
//
// A feature is a folder NN-name/ inside one system folder of src/: src/<system>/NN-name/ (see CLAUDE.md for what each
// system holds). Features apply in the order of their folder names, sorted as plain strings across every system
// (00-security first, 99999-v2-renown last), exactly as they did when they all sat in one features/ folder.
// archive/ holds retired features: never built, never tested.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const SYSTEMS = ['core', 'map', 'world', 'people', 'family', 'nobility', 'diplomacy', 'war', 'economy', 'events', 'ui'];
const isFeature = d => /^\d+-/.test(d);

let cache = null;
// every feature folder: [{ dir: '59-tooltips', name: 'tooltips', system: 'ui', path: '/abs/src/ui/59-tooltips', rel: 'src/ui/59-tooltips' }]
export function allFeatures() {
  if (cache) return cache;
  const out = [];
  for (const system of SYSTEMS) {
    const base = path.join(root, 'src', system);
    if (!fs.existsSync(base)) continue;
    for (const dir of fs.readdirSync(base)) {
      const p = path.join(base, dir);
      if (isFeature(dir) && fs.statSync(p).isDirectory()) out.push({ dir, name: dir.replace(/^\d+-/, ''), system, path: p, rel: `src/${system}/${dir}` });
    }
  }
  out.sort((a, b) => (a.dir < b.dir ? -1 : a.dir > b.dir ? 1 : 0));
  const seen = new Set();
  for (const f of out) { if (seen.has(f.dir)) throw new Error(`feature ${f.dir} is in two systems`); seen.add(f.dir); }
  return (cache = out);
}
export const featureDirs = () => allFeatures().map(f => f.dir);
// the absolute path of a feature folder (by folder name '59-tooltips' or by name 'tooltips'), plus any parts after it
export function featurePath(dirOrName, ...parts) {
  const f = findFeature(dirOrName);
  if (!f) throw new Error(`no feature ${dirOrName}`);
  return path.join(f.path, ...parts);
}
export const findFeature = k => allFeatures().find(f => f.dir === k || f.name === k) || null;
export const isWip = dirOrName => { const f = findFeature(dirOrName); return !!f && fs.existsSync(path.join(f.path, '.wip')); };
