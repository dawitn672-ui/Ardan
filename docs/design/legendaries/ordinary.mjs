// The ordinary arms, before and after owner order 52 (D-050): one sheet, ordinary.png, at twice the pixels.
//   node docs/design/legendaries/ordinary.mjs            writes ordinary.png (and ordinary-timing.json)
//   node docs/design/legendaries/ordinary.mjs --keep     also leaves the page it was shot from (ordinary.html)
// Everything on it is drawn by the game's own figure library (src/ui/engine/figure: arms.js, gear.js). "Before" is the
// same library as it stood at commit bcfd0d5, read out of git into a temporary folder; where git cannot give it, the
// sheet says so and shows only today's drawing.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { decode, quantize } from './src/png.mjs';
import zlib from 'node:zlib';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../..'), BEFORE = 'bcfd0d5';
const NEW = await import(path.join(root, 'src/ui/engine/figure/index.js'));
let OLD = null, OLDG = null;
try {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ardan-arms-before-'));
  const tar = execFileSync('git', ['-C', root, 'archive', BEFORE, 'src/ui/engine/figure', 'src/people/engine/face.js'], { maxBuffer: 1 << 26 });
  execFileSync('tar', ['-x', '-C', tmp], { input: tar });
  OLD = await import(path.join(tmp, 'src/ui/engine/figure/index.js')); OLDG = await import(path.join(tmp, 'src/ui/engine/figure/gear.js'));
} catch (e) { console.log('before: not available (' + String(e.message).split('\n')[0] + ')'); }

const { Scene, compose, lookOf, swordArt, daggerArt, haftArt, bowArt, quiverArt, crossbowArt, shieldArt, charge, STYLES, HAFT_LEN, BOW_LEN, SHIELD_H } = NEW;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const R = Math.PI / 2, T = {}; let n = 0;
// one drawing in a box w x h px, k px a millimetre; fn(S) draws round (0, 0), pointing right
const cell = (w, h, k, fn, cls = '') => { const S = new Scene('o' + (n++).toString(36) + '_', { px: k * 2, lod: 2 }); S.layer('weapon'); fn(S); return `<div class="c ${cls}">${S.svg([-w / 2 / k, -h / 2 / k, w / k, h / k], { w, h, order: ['weapon'] })}</div>`; };
const time = (name, fn) => { for (let i = 0; i < 12; i++) { const S0 = new Scene('t_', { px: 1 }); S0.layer('weapon'); fn(S0); } const t0 = process.cpuUsage(); let sh = 0; for (let i = 0; i < 60; i++) { const S = new Scene('t_', { px: 1 }); S.layer('weapon'); fn(S); sh = S.shapes; } const u = process.cpuUsage(t0); T[name] = { ms: +((u.user + u.system) / 60000).toFixed(3), shapes: sh }; };

// ---------------------------------------------------------------- the classes --------------------------------------
const MK = [1, 2, 3], MKN = ['Plain', 'Fine', 'Masterwork'];
const SW = { arming: ['Arming sword', 780], long: ['Longsword', 940], great: ['Greatsword', 1180], short: ['Short sword', 540], estoc: ['Estoc', 960], falchion: ['Falchion', 700], sabre: ['Sabre', 820], leaf: ['Leaf blade (elf)', 720], cleaver: ['Cleaver (orc)', 640] };
const OWN = { leaf: 'elf', cleaver: 'orc', sabre: 'desert' };
const DG = { dagger: 'Dagger', parry: 'Parrying dagger', rondel: 'Rondel dagger', knife: 'Knife', seax: 'Long knife' };
const HF = { axe: 'War axe', hand: 'Hand axe', great: 'Great axe', cleaver: 'Chopper', mace: 'Flanged mace', star: 'Morningstar', flail: 'Flail', hammer: 'War hammer', pick: 'War pick', maul: 'Maul', club: 'Cudgel' };
const PL = { spear: 'Spear', boar: 'Boar spear', pike: 'Pike', lance: 'Lance', glaive: 'Glaive', halberd: 'Halberd', bill: 'Bill', poleaxe: 'Poleaxe', partisan: 'Partisan' };
const BW = { self: 'Self bow', long: 'Longbow', recurve: 'Horn bow' };
const SH = { round: 'Round shield', heater: 'Heater', kite: 'Kite shield', targe: 'Targe', buckler: 'Buckler', pavise: 'Pavise' };
const dev = (S, c, z, m) => charge(S, 'tower', c, z, m);
const row = (name, note, before, cells) => `<tr><th>${esc(name)}${note ? `<small>${esc(note)}</small>` : ''}</th><td class="b">${before}</td>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
const none = t => `<div class="no">${esc(t)}</div>`;
const oldSword = (L, k, w, h, o = {}) => OLDG ? cell(w, h, k, S => OLDG.swordArt(S, [-L * .26, 0], R, L, 1, o), 'old') : none('before: not available');
let rows = '';
const head = t => { rows += `<tr class="h"><td colspan="5">${esc(t)}</td></tr>`; };

head('Swords');
for (const [form, [name, L]] of Object.entries(SW)) { const k = 268 / (L * 1.44), w = 280, h = form === 'great' ? 78 : 62; rows += row(name, form === 'arming' ? 'and its scabbard' : '', oldSword(L, k, w, h), MK.map(q => cell(w, h, k, S => swordArt(S, [-L * .27, form === 'sabre' ? 14 : 0], R, L, q, { form, st: OWN[form] })))); time('sword.' + form, S => swordArt(S, [0, 0], R, L, 2, { form }));
  if (form === 'arming' || form === 'sabre') rows += row('', 'sheathed', oldSword(L, k, w, h, { sheathed: true }), MK.map(q => cell(w, h, k, S => swordArt(S, [-L * .27, form === 'sabre' ? 14 : 0], R, L, q, { form, st: OWN[form], sheathed: true })))); }
head('Daggers and knives');
for (const [form, name] of Object.entries(DG)) { const L = 290, k = 232 / (L * 1.8), w = 280, h = ({ dagger: 66, parry: 80 })[form] || 54; rows += row(name, '', form === 'dagger' && OLDG ? cell(w, h, k, S => OLDG.swordArt(S, [-L * .3, 0], R, L, 1, { sheathed: true }), 'old') : none(form === 'dagger' ? 'before: not available' : 'drawn as the one dagger'), MK.map(q => cell(w, h, k, S => daggerArt(S, [-L * .34, 0], R, L, q, { form })))); time('dagger.' + form, S => daggerArt(S, [0, 0], R, L, 2, { form })); }
head('Axes, maces and hammers');
// form: [room beyond the haft's length (mm), how far left of the middle the haft sits (mm), the haft's line above the middle (mm), the cell's height (px)]
const HFV = { axe: [110, 30, -22, 84], hand: [110, 30, -22, 84], great: [110, 30, -22, 70], cleaver: [190, 10, -58, 96], mace: [110, 30, 8, 84], star: [110, 30, 8, 84], flail: [270, 44, -92, 88], hammer: [110, 30, 8, 84], pick: [110, 30, -76, 92], maul: [110, 30, 8, 70], club: [110, 30, 8, 84] };
for (const [form, name] of Object.entries(HF)) { const L = HAFT_LEN[form], [room, left, up, h] = HFV[form], k = 268 / (L + room), w = 280; rows += row(name, '', none(form === 'axe' ? 'a belt axe, one shape (see the people above)' : form === 'hammer' ? 'a belt hammer, one shape' : form === 'mace' || form === 'star' || form === 'flail' || form === 'club' || form === 'pick' || form === 'maul' ? 'drawn as the belt hammer' : 'drawn as the belt axe'), MK.map(q => cell(w, h, k, S => haftArt(S, [-L / 2 - left, up], R, L, q, { form })))); time('haft.' + form, S => haftArt(S, [0, 0], R, L, 2, { form })); }
head('Spears and pole arms (the head, and the whole arm beneath it)');
for (const [form, name] of Object.entries(PL)) { const L = HAFT_LEN[form], k = .4, w = 280, [h, up] = ({ lance: [118, -72], halberd: [120, -6], bill: [110, -30], poleaxe: [104, 22] })[form] || [100, 0], k2 = 272 / (L + 470); rows += row(name, '', none(form === 'spear' ? 'one spearhead on a staff (see the people above)' : 'drawn as the one spear'), MK.map(q => cell(w, h, k, S => haftArt(S, [-L - 150, up], R, L, q, { form, pennon: form === 'lance' ? '#7a2a24' : undefined })) + cell(w, 22, k2, S => haftArt(S, [-(L + 440) / 2, 0], R, L, q, { form, pennon: form === 'lance' ? '#7a2a24' : undefined }), 'thin'))); time('pole.' + form, S => haftArt(S, [0, 0], R, L, 2, { form })); }
head('Bows, quivers and crossbows');
for (const [form, name] of Object.entries(BW)) { const L = BOW_LEN[form], k = 268 / (L * 1.03), w = 280, h = form === 'recurve' ? 64 : 50, tip = form === 'recurve' ? [.5 * L, -.07 * L] : [.5 * L, -.085 * L], kc = .62;
  rows += row(name, 'its grip and a nock, and the whole bow', none('not drawn: no bow had art'), MK.map(q => `<div class="pair">${cell(138, 62, kc, S => bowArt(S, [-10, 4], R, L, q, { form }))}${cell(138, 62, kc, S => bowArt(S, [-tip[0] + (form === 'recurve' ? 30 : 38), -tip[1] + (form === 'recurve' ? 26 : 4)], R, L, q, { form }))}</div>` + cell(w, h, k, S => bowArt(S, [0, form === 'recurve' ? 26 : 16], R, L, q, { form }), 'thin'))); time('bow.' + form, S => bowArt(S, [0, 0], R, L, 2, { form })); }
rows += row('Quiver', 'and its arrows', none('not drawn'), MK.map(q => cell(280, 64, .36, S => quiverArt(S, [-372, 0], R, 520, q, {})))); time('quiver', S => quiverArt(S, [0, 0], R, 520, 2, {}));
rows += row('Crossbow', '', none('not drawn'), MK.map(q => cell(280, 204, .27, S => crossbowArt(S, [-400, 0], R, 760, q, {})))); time('crossbow', S => crossbowArt(S, [0, 0], R, 760, 2, {}));
head('Shields');
for (const [form, name] of Object.entries(SH)) { const hh = SHIELD_H[form], k = 118 / hh, w = 280, h = 130; rows += row(name, '', form === 'heater' && OLD ? none('one heater, by the leg (see the people above)') : none(form === 'heater' ? 'before: not available' : 'drawn as the one heater'), MK.map(q => cell(w, h, k, S => shieldArt(S, [0, -hh / 2], hh, q, { form, field: '#7a2a24', pale: '#c9a13a', device: dev })))); time('shield.' + form, S => shieldArt(S, [0, 0], hh, 2, { form, field: '#7a2a24', pale: '#c9a13a', device: dev })); }

// ---------------------------------------------------------------- rarity, the peoples' makes, a crude piece ----------
const strip = (list, fn, w = 206, h = 60) => `<div class="strip">${list.map(([label, o]) => `<figure>${cell(w, h, 196 / (760 * 1.44), S => fn(S, o))}<figcaption>${esc(label)}</figcaption></figure>`).join('')}</div>`;
const sw = (S, o) => swordArt(S, [-760 * .27, 0], R, 760, o.q ?? 2, o);
const more = `<h2>What a thing is made of: common, rare, epic, legendary</h2><p class="sub">The same fine arming sword in each. Rare is pattern-welded and blued; epic is black steel cut with marks, on twin fullers; a legendary that has no drawing of its own yet is sun-steel let in with gold. None of them glows (D-045).</p>
${strip([['Common', { r: 0 }], ['Rare', { r: 1 }], ['Epic', { r: 2 }], ['Legendary (by rule)', { r: 3 }], ['Rare, sheathed', { r: 1, sheathed: true }], ['Epic, sheathed', { r: 2, sheathed: true }]], sw)}
<h2>Whose smiths made it: six makes of hilt, drawn and sheathed</h2><p class="sub">A sword that names no form takes the one its people make: a sabre in the desert, a leaf blade among elves, a broad short blade under the mountain, a cleaver on the eastern grass.</p>
${strip(STYLES.map(st => [({ north: 'Northern', solen: 'Solen', desert: 'Desert', dwarf: 'Dwarf', elf: 'Elf', orc: 'Orc' })[st], { st, q: 3 }]), sw)}${strip(STYLES.map(st => [({ north: 'Northern', solen: 'Solen', desert: 'Desert', dwarf: 'Dwarf', elf: 'Elf', orc: 'Orc' })[st] + ', sheathed', { st, q: 2, sheathed: true }]), sw)}
<h2>And a crude one of each kind</h2><p class="sub">Bad iron, the fire's scale left on, a nicked edge, cord for a grip, a rawhide scabbard, a haft that kept its bend, lashing where a socket should be.</p>
<div class="strip">${[['Sword', S => swordArt(S, [-205, 0], R, 760, 0, {})], ['Its scabbard', S => swordArt(S, [-205, 0], R, 760, 0, { sheathed: true })], ['Axe', S => haftArt(S, [-420, 14], R, 760, 0, { form: 'axe' })], ['Mace', S => haftArt(S, [-340, 0], R, 640, 0, { form: 'mace' })], ['Spear', S => haftArt(S, [-760, 0], R, 1100, 0, { form: 'spear' })], ['Self bow', S => bowArt(S, [0, 24], R, 1080, 0, { form: 'self' })]].map(([label, fn]) => `<figure>${cell(206, 66, 196 / 1094, fn)}<figcaption>${esc(label)}</figcaption></figure>`).join('')}</div>`;

// ---------------------------------------------------------------- on the person, before and after ------------------
const sheet = (i, o = {}) => ({ id: 'q' + i, name: 'N' + i, sex: 'M', race: 'human', age: 32, alive: true, estate: 'peasant',
  app: { skin: ['#f3d6c1', '#e8c0a0', '#d9a77f', '#c08a5e', '#7e5132'][i % 5], hair: i % 11, eye: i % 8, hstyle: ['short', 'cropped', 'long', 'tied'][i % 4], beard: ['none', 'stubble', 'short', 'full'][i % 4], build: ['average', 'sturdy', 'muscular', 'lean'][i % 4], height: 176 },
  gear: {}, wounds: [], traits: [], quirks: [], colors: { realm: '#3d6aa8', field: '#7a2a24', charge: '#d8c48a', device: 'M0 -10 L2.4 -3 L9.5 -3 L3.8 1.2 L6 8 L0 4 L-6 8 L-3.8 1.2 L-9.5 -3 L-2.4 -3 Z' }, mood: 0, ...o });
const g = (weapon, o = {}) => ({ armor: { id: o.armor || 'mail', make: o.q ?? 1 }, weapon: weapon ? { id: weapon, make: o.q ?? 1, rarity: o.r || 0 } : null, shield: o.shield ? { id: o.shield, make: o.q ?? 1 } : null, ranged: o.ranged ? { id: o.ranged, make: o.q ?? 1 } : null });
const CAST = [['Levy: a crude sword and shield', sheet(2, { gear: g('sword', { shield: 'heater', q: 0, armor: 'padded' }) })], ['Knight: a masterwork longsword', sheet(3, { estate: 'noble', gear: g('longsword', { shield: 'heater', q: 3, armor: 'plate' }) })], ['Spearman, a round shield', sheet(4, { gear: g('spear', { shield: 'shield', armor: 'padded' }) })], ['Halberdier, fine', sheet(5, { gear: g('halberd', { q: 2 }) })],
  ['A war axe at the belt', sheet(21, { gear: g('axe', { armor: 'leather' }) })], ['A mace, fine', sheet(7, { gear: g('mace', { q: 2, armor: 'mailplate' }) })], ['Archer: a longbow', sheet(8, { gear: g('dagger', { ranged: 'longbow', armor: 'padded' }) })], ['Crossbowman', sheet(9, { gear: g('dagger', { ranged: 'xbow', armor: 'padded' }) })], ['A dwarf: hammer and targe', sheet(12, { race: 'dwarf', app: { ...sheet(12).app, height: 135 }, gear: g('warhammer', { shield: 'targe', q: 2 }) })]];
const fig = (lib, sh) => { try { return compose(lib.lookOf(sh), { crop: 'figure', width: 138, tier: 2, id: 'f' + (n++).toString(36) + '_', ground: { a: '#9aa0ae', b: '#4f5462' } }).svg; } catch (e) { return none('could not be drawn'); } };
const people = `<div class="cast">${CAST.map(([name, sh]) => `<figure>${OLD ? fig(OLD, sh) : none('before: not available')}<div class="ar">before</div>${fig(NEW, sh)}<div class="ar">after</div><figcaption>${esc(name)}</figcaption></figure>`).join('')}</div>`;

// ---------------------------------------------------------------- the cost -----------------------------------------
const SIZES = [['list', 46, 1], ['list', 88, 1], ['tall', 176, 2], ['figure', 300, 2]];
// Before and after are timed turn and turn about, in nine batches a size, and the middle batch is the figure given: the
// container is shared, and one long run of either would carry whatever else the machine was doing at the time.
function bench(libs) {
  const looks = {}, out = {}, one = (k, Lk, crop, width, tier) => libs[k].compose(Lk, { crop, width, tier, id: 'b_' });
  for (const k in libs) { looks[k] = CAST.map(c => libs[k].lookOf(c[1])); out[k] = {}; }
  for (let w = 0; w < 4; w++) for (const k in libs) for (const [crop, width, tier] of SIZES) for (const Lk of looks[k]) one(k, Lk, crop, width, tier);      // warm
  for (const [crop, width, tier] of SIZES) {
    const times = {}; for (const k in libs) times[k] = [];
    for (let b = 0; b < 9; b++) for (const k in libs) { const t0 = process.cpuUsage(); for (let r = 0; r < 3; r++) for (const Lk of looks[k]) one(k, Lk, crop, width, tier); const u = process.cpuUsage(t0); times[k].push((u.user + u.system) / 1000 / (3 * looks[k].length)); }
    for (const k in libs) { const s = times[k].sort((a, b) => a - b); let sh = 0, kb = 0; for (const Lk of looks[k]) { const r = one(k, Lk, crop, width, tier); sh += r.shapes; kb += r.svg.length; }
      out[k][crop + width] = { ms: +s[s.length >> 1].toFixed(2), low: +s[0].toFixed(2), high: +s[s.length - 1].toFixed(2), shapes: Math.round(sh / looks[k].length), kb: Math.round(kb / looks[k].length / 1024) }; }
  }
  return out;
}
const B = bench(OLD ? { before: OLD, after: NEW } : { after: NEW }), cost = { after: B.after, before: B.before || null, arms: T };
fs.writeFileSync(path.join(here, 'ordinary-timing.json'), JSON.stringify(cost, null, 1));
const cell2 = c => `${c.ms} ms (${c.low} to ${c.high}) · ${c.shapes} shapes · ${c.kb} KB`;
const crow = k => `<tr><td>${esc(({ list46: 'A list portrait, 46 px', list88: 'A list portrait, 88 px', tall176: 'Two by three, 176 px', figure300: 'The standing figure, 300 px' })[k])}</td>${cost.before ? `<td>${cell2(cost.before[k])}</td>` : '<td>–</td>'}<td>${cell2(cost.after[k])}</td></tr>`;
const slow = Object.entries(T).sort((a, b) => b[1].ms - a[1].ms).slice(0, 3).map(([k, v]) => `${k} ${v.ms} ms (${v.shapes} shapes)`).join(', ');
const costHtml = `<h2>What it costs to draw</h2><p class="sub">The nine people above, armed as shown, composed in node on the shared container: CPU time a picture, the middle of nine batches taken turn and turn about, with the fastest and slowest batch in brackets. The spread is the machine's, and is wider than the difference between the two columns. The game's own budget test, fgBudget, measures the same thing in the browser against a fresh world (under 6 ms a list portrait). A piece that lies outside a picture is not drawn at all; a detail smaller than the picture can show is left out.</p>
<table class="cost"><thead><tr><th>Picture</th><th>Before</th><th>After</th></tr></thead><tbody>${['list46', 'list88', 'tall176', 'figure300'].map(crow).join('')}</tbody></table>
<p class="sub">One piece alone, at full detail (one pixel a millimetre, fine make): ${Object.keys(T).length} forms, mean ${(Object.values(T).reduce((a, v) => a + v.ms, 0) / Object.keys(T).length).toFixed(2)} ms; the slowest are ${esc(slow)}.</p>`;

// ---------------------------------------------------------------- the page -----------------------------------------
const fonts = path.join(root, 'assets/fonts'), font = (f, fam, w, st = 'normal') => `@font-face{font-family:${fam};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(fonts, f)).toString('base64')}) format('woff2');font-weight:${w};font-style:${st};font-display:block}`;
const css = `${font('cinzel-normal-600-700-latin.woff2', 'Cinzel', '600 700')}${font('literata-normal-400-700-latin.woff2', 'Literata', '400 700')}${font('literata-italic-400-600-latin.woff2', 'Literata', '400 600', 'italic')}
:root{--paper:#efe8da;--ink:#2a2233;--muted:#665b57;--rule:#c8b99c;--gold:#8a6c22;--verm:#a8322a}*{box-sizing:border-box}html,body{margin:0;background:var(--paper);color:var(--ink);font:14px/1.5 Literata,Georgia,serif}
main{width:1366px;margin:0 auto;padding:28px 24px 50px}svg{display:block}.kick{font:600 12px Cinzel,serif;letter-spacing:.24em;text-transform:uppercase;color:var(--verm);margin:0 0 6px}h1{font:700 34px/1.08 Cinzel,serif;letter-spacing:.05em;margin:0}
.lede{max-width:1000px;color:var(--muted);margin:10px 0 0;font-size:15px}h2{font:700 17px Cinzel,serif;letter-spacing:.1em;text-transform:uppercase;margin:34px 0 3px;display:flex;align-items:center;gap:14px}h2::after{content:"";flex:1;height:1px;background:var(--rule)}.sub{color:var(--muted);font-style:italic;font-size:13.5px;margin:0 0 12px;max-width:1040px}
.cast{display:grid;grid-template-columns:repeat(9,1fr);gap:8px}.cast figure{margin:0;text-align:center}.cast svg{border-radius:4px;margin:0 auto}.cast .ar{font:600 9.5px Cinzel,serif;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin:3px 0 7px}.cast figcaption{font-size:12px;line-height:1.3;color:var(--ink)}
table.arms{border-collapse:separate;border-spacing:0 3px;width:100%}table.arms th{width:150px;text-align:left;font:600 12.5px Literata,serif;padding-right:8px;vertical-align:middle}table.arms th small{display:block;font:italic 400 11.5px Literata,serif;color:var(--muted)}table.arms td{padding:0 3px;vertical-align:middle}
table.arms thead th{font:600 10.5px Cinzel,serif;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);text-align:center;width:auto;padding:0 0 4px}tr.h td{font:700 13px Cinzel,serif;letter-spacing:.12em;text-transform:uppercase;padding:14px 0 3px;border-bottom:1px solid var(--rule)}
.c{background:#f7f2e7;border:1px solid #dccfb6;border-radius:4px;overflow:hidden}.c.old{background:#ebe5d8}.c.thin{margin-top:2px;background:#f3eee2}.pair{display:flex;gap:4px}td.b .c{opacity:.96}.no{font:italic 12px/1.3 Literata,serif;color:#8a7f78;text-align:center;padding:4px 10px;width:282px}
.strip{display:grid;grid-template-columns:repeat(6,max-content);gap:8px 10px;margin-bottom:8px}.strip figure{margin:0}.strip figcaption{font-size:12px;color:var(--muted);font-style:italic;margin-top:2px;text-align:center}
table.cost{border-collapse:collapse;font-size:13px;margin-bottom:10px}table.cost th,table.cost td{text-align:left;padding:4px 22px 4px 0;border-bottom:1px solid var(--rule)}table.cost th{font:600 10px Cinzel,serif;letter-spacing:.1em;text-transform:uppercase;color:var(--gold)}`;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=1366"><title>Ardan · ordinary arms, before and after</title><style>${css}</style></head><body><main>
<p class="kick">Ordinary arms · owner order 52 · before and after</p><h1>Ardan · the ordinary arms, redrawn</h1>
<p class="lede">Every weapon and shield a person in the game can carry, as the figure library draws it now: a made thing, with its fuller, guard, grip and pommel, its langets and rivets, its nocks and string, at each make. Nothing here is a legendary piece and nothing here is a picture file: these are the game's own drawings (<code>src/ui/engine/figure/arms.js</code>), the same ones a portrait shows small.</p>
<h2>On the person: before and after</h2><p class="sub">The same nine people, the same gear, drawn by the library as it stood before this order (commit ${BEFORE}) and as it stands now. Before, every pole arm was one spear, every axe and mace one belt tool, every shield one heater, and a bow was not drawn at all.</p>${people}
<h2>Every class, at three makes</h2><p class="sub">Plain is a journeyman's sound work; Fine is a good shop's (the design's “good” and “fine”: the library has four makes today, the fifth comes with E2); Masterwork is a master's best. The left column is what the game drew for that item before.</p>
<table class="arms"><thead><tr><th></th><th>Before</th>${MKN.map(m => `<th>${m}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
${more}${costHtml}</main></body></html>`;
const page = path.join(here, 'ordinary.html'); fs.writeFileSync(page, html);
console.log('ordinary.html', (html.length / 1024).toFixed(0), 'KB;', Object.keys(T).length, 'forms timed');

// RGB pixels to a PNG (rows unfiltered: it is only handed to quantize())
const CRC = (() => { const t = new Uint32Array(256); for (let i = 0; i < 256; i++) { let c = i; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[i] = c >>> 0; } return t; })();
const crc = b => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
function encode(W, H, rgb) { const raw = Buffer.alloc((W * 3 + 1) * H); for (let y = 0; y < H; y++) { raw[y * (W * 3 + 1)] = 0; Buffer.from(rgb.buffer, rgb.byteOffset + y * W * 3, W * 3).copy(raw, y * (W * 3 + 1) + 1); } const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2; return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 1 })), chunk('IEND', Buffer.alloc(0))]); }
const { chromium } = await import(process.env.PLAYWRIGHT_PATH ? path.join(process.env.PLAYWRIGHT_PATH, 'index.mjs') : '/opt/node-tools/node_modules/playwright/index.mjs');
const browser = await chromium.launch();
try {
  const pg = await (await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 2, colorScheme: 'light' })).newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await pg.goto('file://' + page); await pg.evaluate(() => document.fonts.ready);
  if (errs.length) { console.error('PAGE ERRORS\n' + errs.join('\n')); process.exitCode = 1; }
  const total = await pg.evaluate(() => document.documentElement.scrollHeight), strips = [];
  for (let y = 0; y < total; y += 3000) strips.push(decode(await pg.screenshot({ fullPage: true, clip: { x: 0, y, width: 1366, height: Math.min(3000, total - y) } })));
  const W = strips[0].W, H = strips.reduce((a, s) => a + s.H, 0), rgb = new Uint8Array(W * H * 3); let off = 0; for (const s of strips) { rgb.set(s.rgb, off); off += s.rgb.length; }
  const out = quantize(encode(W, H, rgb), 256, -14); fs.writeFileSync(path.join(here, 'ordinary.png'), out); console.log('ordinary.png', W + 'x' + H, (out.length / 1024).toFixed(0), 'KB');
} finally { await browser.close(); }
if (!process.argv.includes('--keep')) fs.unlinkSync(page);
