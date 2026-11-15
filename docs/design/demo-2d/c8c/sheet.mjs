// C8c · the dress sheets (D-060). Everything on them is drawn by the game's own figure library (src/ui/engine/figure).
//   node docs/design/demo-2d/c8c/sheet.mjs            writes the PNGs beside this file
//   node docs/design/demo-2d/c8c/sheet.mjs --keep     also leaves the pages they were shot from (*.html)
//   node docs/design/demo-2d/c8c/sheet.mjs --seed=k   another cast (the default cast is the one the blind test read)
// Sheets:
//   stations.png        8 stations x 4 peoples, labelled (the class sheet of CRITIQUE V2)
//   stations-blind.png  the same 32 people, shuffled, numbered, no labels: what the blind reader is shown
//   stations-key.json   the answer key of the blind sheet
//   soldiers.png        the ranks of an army, as busts at list size and as profile cards (V7)
//   occasions.png       one person of each station in each outfit (day, best, work, travel, arms, mourning)
//   peoples.png         a countryman and a countrywoman of all 24 cultures
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../../..');
const L = await import(path.join(root, 'src/ui/engine/figure/index.js'));
const arg = k => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const SEED = arg('seed') || 'c8c', KEEP = process.argv.includes('--keep');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const STATIONS = ['serf', 'peasant', 'artisan', 'merchant', 'clergy', 'soldier', 'knight or noble', 'royal'];
// four peoples, one of each cut: Northfolk (tunic), Qadiri (robe), Wind Riders (kaftan), Zanari (drape)
export const PEOPLES = [['CUL-02', '#f2d2bd', [2, 4, 5, 7]], ['CUL-04', '#c79670', [0, 1, 0, 2]], ['CUL-03', '#d9b48c', [0, 1, 0, 0]], ['CUL-08', '#734731', [0, 0, 1, 0]]];
const REALMS = ['#7a2a2a', '#2a4a7a', '#3a6a3a', '#7a5a2a', '#5a2a6a', '#2a6a6a'];
const DEVICES = ['tower', 'antlers', 'star', 'sun', 'tree', 'crescent'];
const rnd = key => L.stream(SEED, key);

// one person of a station and a people, as the game's sheet would describe them
export function person(station, cid, skin, hairs, k, more = {}) {
  const r = rnd(station + cid + k), pick = a => a[Math.floor(r() * a.length) % a.length], male = more.sex ? more.sex === 'M' : r() < .6;
  const id = SEED + '-' + station + '-' + cid + '-' + k, realm = pick(REALMS);
  const base = { id, name: '', sex: male ? 'M' : 'F', race: 'human', age: 20 + Math.floor(r() * 36), alive: true,
    app: { skin, hair: pick(hairs), eye: Math.floor(r() * 7), hstyle: pick(['short', 'long', 'braided', 'cropped', 'tied', 'curly', 'wild']), beard: pick(['none', 'none', 'short', 'full', 'stubble', 'goatee', 'mustache']), build: pick(['average', 'lean', 'sturdy', 'heavy', 'slight']) },
    estate: 'peasant', ruler: false, rung: 0, officer: false, gear: {}, wounds: [], traits: [], quirks: [], married: r() < .6, strength: 0, mood: 0,
    colors: { realm, field: pick(REALMS.filter(c => c !== realm)), charge: '#d8c48a', device: null }, cult: L.cultureOf(cid), where: 'in' };
  const st = {
    serf: { estate: 'serf' }, peasant: { estate: 'peasant', job: pick(['farm', 'herd', 'labor', 'fish']) }, artisan: { estate: 'artisan', job: pick(['smith', 'weaver', 'carpenter', 'brewer', 'mason']) }, merchant: { estate: 'merchant', job: 'merchant' },
    clergy: { estate: 'priest', rung: pick([1, 1, 2, 3]) },
    soldier: { sex: 'M', estate: 'peasant', mil: { rank: pick([0, 0, 1, 2]), troop: 'SP' }, gear: (a => a[(more.n || 0) % a.length])([{ armor: { id: 'padded' }, weapon: { id: 'spear' }, helm: { id: 'kettle' }, shield: { id: 'shield' } }, { armor: { id: 'mail' }, weapon: { id: 'sword' }, helm: { id: 'helm' }, shield: { id: 'shield' } }, { armor: { id: 'padded' }, weapon: { id: 'dagger' }, helm: { id: 'helm' }, ranged: { id: 'longbow' } }]) },
    'knight or noble': r() < .5 && male ? { estate: 'noble', rung: 4, gear: { armor: { id: 'plate' }, weapon: { id: 'longsword' } }, colors: { ...base.colors, device: pick(DEVICES) } } : { estate: 'noble', rung: pick([4, 5, 6]), gear: male ? { weapon: { id: 'arming' } } : {}, colors: { ...base.colors, device: pick(DEVICES) } },
    royal: { estate: 'royal', ruler: true, rung: 8 },
  }[station] || {};
  return { ...base, ...st, ...more };
}
const GROUND = { a: '#9aa3b8', b: '#2a2e3e' };
let uid = 0;
export function draw(sh, w = 200, crop = 'tall') {
  const look = L.lookOf(sh), tall = crop === 'tall';
  return L.compose(look, { crop, width: w, height: tall ? Math.round(w * 1.5) : w, id: 's' + (uid++).toString(36) + '_', tier: crop === 'list' ? 1 : 2, ground: GROUND, frame: { c: '#6e7bab', w: 1.2 } }).svg;
}
const page = (title, body, cols, cw) => `<!doctype html><meta charset="utf-8"><title>${esc(title)}</title><style>body{margin:14px;background:#ece5d6;color:#2a2620;font:13px/1.3 Georgia,serif}h1{font-size:17px;margin:0 0 10px}.g{display:grid;grid-template-columns:repeat(${cols},${cw}px);gap:10px 8px}.c b{display:block;font-weight:normal;font-size:12px}.c i{font-style:normal;font-weight:bold;font-size:15px}.h{font-weight:bold;align-self:center}svg{display:block}</style><h1>${esc(title)}</h1><div class="g">${body}</div>`;

const out = {};
// ---- 8 stations x 4 peoples
{
  const cast = [];
  for (const [cid, skin, hairs] of PEOPLES) STATIONS.forEach((st, i) => cast.push({ st, cid, sh: person(st, cid, skin, hairs, 0, { n: PEOPLES.findIndex(p => p[0] === cid) }) }));
  out.stations = page('C8c · eight stations in four peoples (Northfolk, Qadiri, Wind Riders, Zanari)', cast.map(c => `<div class="c">${draw(c.sh)}<b>${esc(L.cultureOf(c.cid).name)} · ${esc(c.st)}</b></div>`).join(''), 8, 200);
  // the blind sheet: the same people in a shuffled order, numbered
  const r = rnd('shuffle'), order = cast.map((c, i) => [r(), i]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  out['stations-blind'] = page('Thirty-two people', order.map((i, n) => `<div class="c">${draw(cast[i].sh)}<i>${n + 1}</i></div>`).join(''), 8, 200);
  out.key = order.map((i, n) => ({ n: n + 1, station: cast[i].st, people: L.cultureOf(cast[i].cid).name, sex: cast[i].sh.sex }));
}
// ---- the ranks of an army: busts at list size (88 px), then cards
{
  const RANKS = [['Levy spearman', 0, 'padded', 'spear', 'kettle', 'SP'], ['Archer', 0, 'padded', 'dagger', 'helm', 'LB'], ['File-leader', 1, 'padded', 'spear', 'helm', 'SP'], ['Sergeant, heavy foot', 2, 'mail', 'sword', 'helm', 'HI'], ['Squad captain', 3, 'mail', 'sword', 'helm', 'HI'], ['Captain', 4, 'brigandine', 'sword', null, 'HI'], ['Commander', 6, 'mailplate', 'longsword', null, 'HC'], ['General', 7, 'plate', 'longsword', null, 'HC']];
  let b = '';
  for (const crop of ['list', 'tall']) for (const [name, rank, armor, weapon, helm, troop] of RANKS) {
    const [cid, skin, hairs] = PEOPLES[rank % 2 ? 1 : 0];
    const sh = person('soldier', cid, skin, hairs, 'r' + rank + name, { sex: 'M', mil: { rank, troop }, officer: rank >= 6, colors: { realm: '#7a2a2a', field: '#7a2a2a', charge: '#d8c48a', device: null }, gear: { armor: { id: armor }, weapon: { id: weapon }, ...(helm ? { helm: { id: helm } } : {}), ...(troop === 'LB' ? { ranged: { id: 'longbow' } } : rank < 4 ? { shield: { id: 'shield' } } : {}) }, where: crop === 'list' ? 'list' : 'in' });
    b += `<div class="c">${draw(sh, crop === 'list' ? 88 : 180, crop)}<b>${esc(name)}</b></div>`;
  }
  // a lord's household: the guard knight and two retainers in the house's livery, beside a soldier of the realm
  const liv = { field: '#2a4a7a', charge: '#d8c48a', device: 'tower' }, [cid, skin, hairs] = PEOPLES[0];
  const H = [['Guard knight (livery)', person('soldier', cid, skin, hairs, 'g1', { estate: 'gentry', mil: null, role: 'guard', livery: liv, gear: { armor: { id: 'mail' }, weapon: { id: 'sword' } } })], ['Guard (livery)', person('soldier', cid, skin, hairs, 'g2', { estate: 'gentry', mil: null, role: 'guard', livery: liv, gear: { armor: { id: 'mail' }, weapon: { id: 'sword' } } })],
    ['Maid (livery)', person('peasant', cid, skin, hairs, 'm1', { sex: 'F', role: 'maid', livery: liv })], ['Steward (livery)', person('peasant', cid, skin, hairs, 'm2', { sex: 'M', estate: 'gentry', livery: liv })], ['Nurse', person('peasant', cid, skin, hairs, 'm3', { sex: 'F', role: 'nurse' })], ['Tutor', person('artisan', cid, skin, hairs, 'm4', { role: 'tutor' })]];
  for (const [name, sh] of H) b += `<div class="c">${draw(sh, 180)}<b>${esc(name)}</b></div>`;
  out.soldiers = page('C8c · the ranks of an army at list size and as cards; a lord\'s household in his livery', b, 8, 180);
}
// ---- outfits by occasion
{
  let b = '<div class="h"></div>' + L.WEARS.map(w => `<div class="h">${esc(w)}</div>`).join('');
  const rows = [['peasant', 0, {}], ['artisan', 0, {}], ['merchant', 1, {}], ['knight or noble', 0, { sex: 'M', estate: 'noble', rung: 5, gear: { armor: { id: 'plate' }, weapon: { id: 'longsword' } }, colors: { realm: '#2a4a7a', field: '#7a2a2a', charge: '#d8c48a', device: 'antlers' } }], ['knight or noble', 0, { sex: 'F', estate: 'noble', rung: 5, gear: {} }], ['peasant', 2, {}], ['merchant', 3, {}]];
  for (const [st, pi, more] of rows) {
    const [cid, skin, hairs] = PEOPLES[pi];
    b += `<div class="h">${esc(L.cultureOf(cid).name)}<br>${esc(st)}</div>` + L.WEARS.map(w => `<div class="c">${draw(person(st, cid, skin, hairs, 'o', { ...more, wear: w, where: w === 'travel' ? 'out' : 'in' }), 170)}</div>`).join('');
  }
  out.occasions = page('C8c · one person, six outfits (the road is drawn out of doors)', b, 7, 170);
}
// ---- every culture
{
  const SK = { 'CUL-04': '#c79670', 'CUL-05': '#c79670', 'CUL-06': '#b07a52', 'CUL-07': '#b07a52', 'CUL-08': '#734731', 'CUL-09': '#54342a', 'CUL-10': '#93603f', 'CUL-13': '#b07a52', 'CUL-03': '#d9b48c', 'CUL-12': '#d9b48c', 'CUL-16': '#93603f', 'CUL-17': '#c79670', 'CUL-22': '#6f8a5a', 'CUL-23': '#7f8a5a' };
  const RACE = { 'CUL-19': 'elf', 'CUL-20': 'elf', 'CUL-21': 'dwarf', 'CUL-22': 'orc', 'CUL-23': 'orc', 'CUL-24': 'giant' };
  let b = '';
  for (const cid of Object.keys(L.CULTURES)) for (const [st, sex] of [['peasant', 'M'], ['peasant', 'F'], ['merchant', 'M'], ['knight or noble', 'F']]) b += `<div class="c">${draw(person(st, cid, SK[cid] || '#f2d2bd', [0, 1, 2, 3], 'p' + sex, { sex, race: RACE[cid] || 'human', gear: {}, estate: st === 'peasant' ? 'peasant' : st === 'merchant' ? 'merchant' : 'noble', rung: 5 }), 150)}<b>${esc(L.CULTURES[cid].name)} · ${st === 'peasant' ? (sex === 'M' ? 'countryman' : 'countrywoman') : st === 'merchant' ? 'merchant' : 'lady'}</b></div>`;
  out.peoples = page('C8c · the 24 cultures: a countryman, a countrywoman, a merchant and a lady of each', b, 8, 150);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const require = createRequire(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/');
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  fs.writeFileSync(path.join(here, 'stations-key.json'), JSON.stringify(out.key, null, 1) + '\n');
  for (const name of ['stations', 'stations-blind', 'soldiers', 'occasions', 'peoples']) {
    const html = path.join(here, name + '.html'); fs.writeFileSync(html, out[name]);
    const pg = await browser.newPage({ viewport: { width: name === 'occasions' ? 1280 : name === 'peoples' ? 1300 : 1700, height: 900 }, deviceScaleFactor: name === 'peoples' ? 1 : 1.5 });
    await pg.goto('file://' + html); await pg.waitForTimeout(200);
    await pg.screenshot({ path: path.join(here, name + '.png'), fullPage: true }); await pg.close();
    if (!KEEP) fs.unlinkSync(html);
    console.log('wrote', name + '.png');
  }
  await browser.close();
}
