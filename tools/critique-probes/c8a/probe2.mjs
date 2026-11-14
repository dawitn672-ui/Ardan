// C8a grounding probe 2: contact sheets drawn by the current renderer (UI.ANIME via PORTRAIT.svg).
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pw = require('/opt/node-tools/node_modules/playwright');
const [file, out, seedArg] = process.argv.slice(2);
const seed = +(seedArg || 42);
const b = await pw.chromium.launch();
const pg = await b.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });
const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 300)));
await pg.goto('file://' + file);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
await pg.evaluate((seed) => {
  A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
  UI.set.theme = 'dark'; UI.applySettings && UI.applySettings();
  const S = A.S, alive = Object.values(S.people).filter(p => p && p.alive);
  const base = A.pc();
  const clone = (p, o = {}) => { const q = JSON.parse(JSON.stringify(p)); Object.assign(q, o.set || {}); if (o.app) q.app = Object.assign({}, q.app, o.app); if (o.age != null) q.born = S.year - o.age; return q; };
  const humansAdult = alive.filter(p => p.race === 'human' && A.age(p) >= 20 && A.age(p) <= 55);
  // deterministic spread through the list
  const pick = (arr, n) => { const o = []; const step = Math.max(1, Math.floor(arr.length / n)); for (let i = 0; i < n && i * step < arr.length; i++) o.push(arr[i * step]); return o; };
  const SH = window.SH = {};
  SH.random24 = pick(humansAdult, 24).map(p => ({ p, label: `${p.given} ${p.sex}${A.age(p)}` }));
  // hair covered: same crop, no beard, same plain dress, no hat culture; skin kept
  SH.covered24 = SH.random24.map(({ p }) => ({ p: clone(p, { set: { status: 'peasant', ruler: null, noble: null, house: null, cult: 'CUL-22', mil: null, job: null, quirks: [], traits: [], happy: 50 }, app: { hstyle: 'shaved', beard: 'none', paint: 'none', jewel: 'none' } }), label: `${p.sex}${A.age(p)} f${p.app.face}b${p.app.brow}m${p.app.mouth}n${p.app.nose}e${p.app.eyeShape}` }));
  // same skin as well, one sex: the face genes alone
  const men = humansAdult.filter(p => p.sex === 'M');
  SH.genesOnly = pick(men, 20).map(p => ({ p: clone(p, { age: 30, set: { status: 'peasant', ruler: null, noble: null, house: null, cult: 'CUL-22', mil: null, job: null, quirks: [], traits: [], happy: 50 }, app: { hstyle: 'shaved', beard: 'none', paint: 'none', jewel: 'none', skin: '#d9a77f', eye: 1, hair: 1 } }), label: `f${p.app.face}b${p.app.brow}m${p.app.mouth}n${p.app.nose}e${p.app.eyeShape}` }));
  // classes
  const realms = Object.keys(S.realms || {});
  const mk = (o) => { const p = JSON.parse(JSON.stringify(base)); p.id = 'c8_' + o.n; p.given = o.label || ('P' + o.n); p.sur = ''; p.race = o.race || 'human'; p.sex = o.sex || 'M'; p.born = S.year - (o.age ?? 30);
    p.status = o.status || 'peasant'; p.ruler = o.ruler || null; p.mil = o.mil || null; p.job = o.job || null; p.house = o.house || null; p.noble = o.noble || null; p.cult = o.cult || 'CUL-02'; p.realm = o.realm || p.realm; p.prison = null;
    p.flags = Object.assign({}, o.flags || {});
    p.gear = Object.assign({ weapon: 'fists', ranged: null, armor: 'none', shield: null, helm: null, mount: null, cloak: null }, o.gear || {});
    p.wounds = (o.wounds || []).map(k => ({ k })); p.quirks = o.quirks || []; p.alive = !o.dead; p.traits = o.traits || []; p.happy = o.happy ?? 55; p.health = o.health ?? 80; p.rel = {};
    p.app = Object.assign({ skin: '#e8c0a0', hair: 2, eye: 1, hstyle: 'short', beard: 'none', build: 'average', height: o.sex === 'F' ? 158 : 168, face: 1, brow: 1, mouth: 1, nose: 1, eyeShape: 1, paint: 'none', jewel: 'none' }, o.app || {});
    return p; };
  const house = Object.values(S.houses || {}).find(h => h.colors && h.charge);
  let n = 0;
  const classRow = (sex, cult) => [
    { status: 'slave', flags: { unfree: S.year } }, { status: 'serf' }, { status: 'peasant' }, { status: 'artisan' }, { status: 'merchant' }, { status: 'gentry' },
    { status: 'noble', house: house && house.id }, { status: 'royal', house: house && house.id }, { status: 'royal', ruler: realms[0] },
    { status: 'peasant', mil: { rank: 1, troop: 'LI', realm: realms[0] }, gear: { weapon: 'spear', armor: 'padded', helm: 'kettle', shield: 'shield' }, label: 'levy' },
    { status: 'peasant', mil: { rank: 2, troop: 'HI', realm: realms[0] }, gear: { weapon: 'sword', armor: 'mail', helm: 'helm', shield: 'kite' }, label: 'man-at-arms' },
    { status: 'noble', house: house && house.id, mil: { rank: 6, troop: 'HC', realm: realms[0] }, gear: { weapon: 'longsword', armor: 'plate', helm: 'greathelm', cloak: 'tabard' }, label: 'knight' },
    { status: 'peasant', job: { c: 'clergy', k: 'priest', r: 2 }, label: 'priest' },
  ].map(o => { const q = Object.assign({ n: ++n, sex, cult, age: 34 }, o); const p = mk(q); p.id = 'c8_' + sex + cult + (o.label || o.status) + (o.ruler ? 'r' : ''); return { p, label: (o.label || o.status) + (o.ruler ? ' (ruler)' : '') }; });
  SH.classesM = classRow('M', 'CUL-02');
  SH.classesF = classRow('F', 'CUL-02');
  SH.classesM2 = classRow('M', 'CUL-04');
  // ages
  const ages = [0, 1, 3, 6, 10, 13, 16, 20, 25, 30, 40, 50, 60, 70, 80];
  SH.agesM = ages.map(a => { const p = mk({ n: 500, sex: 'M', age: a, app: { hstyle: 'short', beard: 'none' } }); p.id = 'c8_ageM'; return { p, label: 'M ' + a }; });
  SH.agesF = ages.map(a => { const p = mk({ n: 501, sex: 'F', age: a, app: { hstyle: 'long' } }); p.id = 'c8_ageF'; return { p, label: 'F ' + a }; });
  SH.agesElf = [5, 20, 45, 80, 150, 250, 330, 380, 450].map(a => { const p = mk({ n: 502, sex: 'F', race: 'elf', age: a, cult: 'CUL-19', app: { hstyle: 'long', skin: '#ecd2bd' } }); p.id = 'c8_ageE'; return { p, label: 'elf F ' + a }; });
  // every stored face parameter on one man
  SH.params = [];
  for (const [k, vals] of [['face', [0, 1, 2, 3]], ['brow', [0, 1, 2]], ['mouth', [0, 1, 2]], ['nose', [0, 1, 2]], ['eyeShape', [0, 1, 2]]]) for (const v of vals) { const p = mk({ n: 600, sex: 'M', age: 30, app: { hstyle: 'cropped', [k]: v } }); p.id = 'c8_param'; SH.params.push({ p, label: `${k} ${v}` }); }
  // builds and heights (full figure)
  SH.builds = GD.BUILDS.map(bd => { const p = mk({ n: 700, sex: 'M', age: 30, app: { build: bd, height: 172 } }); p.id = 'c8_build'; return { p, label: bd }; });
  SH.heights = [[150, 'F'], [158, 'F'], [175, 'F'], [150, 'M'], [168, 'M'], [185, 'M'], [195, 'M']].map(([h, sx]) => { const p = mk({ n: 701, sex: sx, age: 30, app: { height: h } }); p.id = 'c8_h' + sx; return { p, label: sx + ' ' + h + ' cm' }; });
  // wounds, beards, dark skin
  SH.wounds = Object.keys(GD.WOUNDS).map(k => { const p = mk({ n: 800, sex: 'M', age: 40, wounds: [k], app: { hstyle: 'cropped' } }); p.id = 'c8_w'; return { p, label: k }; });
  SH.beards = GD.BEARDS.map(bd => { const p = mk({ n: 801, sex: 'M', age: 40, app: { beard: bd, hstyle: 'short' } }); p.id = 'c8_bd'; return { p, label: bd }; });
  SH.skins = GD.SKIN.human.map(sk => { const p = mk({ n: 802, sex: 'M', age: 45, app: { skin: sk, hstyle: 'cropped', beard: 'none' } }); p.id = 'c8_sk'; return { p, label: sk }; });
  SH.eyes = GD.EYES.map((e, i) => { const p = mk({ n: 803, sex: 'F', age: 28, app: { eye: i, hstyle: 'tied' } }); p.id = 'c8_ey'; return { p, label: GD.EYE_NAMES[i] + ' ' + e }; });
  SH.hstyles = GD.HAIRSTYLES.flatMap(hs => ['M', 'F'].map(sx => { const p = mk({ n: 804, sex: sx, age: 28, app: { hstyle: hs }, cult: 'CUL-22' }); p.id = 'c8_hs' + sx; return { p, label: sx + ' ' + hs }; }));
  // gender quiz: 12 beardless men, 12 women, mixed, 88 px
  const youngM = alive.filter(p => p.race === 'human' && p.sex === 'M' && A.age(p) >= 16 && A.age(p) <= 40).slice(0, 12).map(p => clone(p, { app: { beard: 'none' } }));
  const youngF = alive.filter(p => p.race === 'human' && p.sex === 'F' && A.age(p) >= 16 && A.age(p) <= 40).slice(0, 12);
  const mixed = []; for (let i = 0; i < 12; i++) { if (youngM[i]) mixed.push(youngM[i]); if (youngF[i]) mixed.push(youngF[i]); }
  SH.quiz = mixed.map((p, i) => ({ p, label: '#' + (i + 1) }));
  window.SHKEY = mixed.map((p, i) => '#' + (i + 1) + '=' + p.sex + A.age(p)).join(' ');
  // one family: parents and children
  const fam = alive.filter(p => (p.children || []).length >= 3 && p.spouse && S.people[p.spouse] && S.people[p.spouse].alive)[0];
  if (fam) { const sp = S.people[fam.spouse]; SH.family = [fam, sp, ...fam.children.map(id => S.people[id]).filter(Boolean)].map(p => ({ p, label: `${p.given} ${p.sex}${A.age(p)}` })); }
}, seed);
async function shot(name, size, cols, opts = {}) {
  const r = await pg.evaluate(({ name, size, cols, opts }) => {
    document.getElementById('sheet')?.remove();
    const list = SH[name]; if (!list) return null;
    const box = document.createElement('div'); box.id = 'sheet';
    box.style.cssText = `position:fixed;left:0;top:0;z-index:99999;background:#0d1120;padding:10px;display:grid;grid-template-columns:repeat(${cols},auto);gap:8px;font:11px sans-serif;color:#eee8da`;
    let html = '';
    for (const { p, label } of list) { const s = PORTRAIT.svg(p, size, opts); html += `<div style="text-align:center">${s}<div>${UI.esc(label)}</div></div>`; }
    box.innerHTML = html; document.body.appendChild(box);
    return { n: list.length, err: UI.ANIME.errors, last: UI.ANIME.lastError || null };
  }, { name, size, cols, opts });
  if (!r) return null;
  const el = await pg.$('#sheet');
  await el.screenshot({ path: `${out}-${name}-${size}${opts.front ? 'f' : ''}.png` });
  return r;
}
const res = {};
res.random24 = await shot('random24', 120, 8, { bust: true });
res.covered24 = await shot('covered24', 120, 8, { bust: true });
res.genesOnly = await shot('genesOnly', 120, 10, { bust: true });
res.genesOnlyF = await shot('genesOnly', 120, 10, { bust: true, front: true });
res.classesM = await shot('classesM', 120, 13, { bust: true });
res.classesF = await shot('classesF', 120, 13, { bust: true });
res.classesM2 = await shot('classesM2', 120, 13, { bust: true });
res.classesFull = await shot('classesM', 200, 13, {});
res.agesM = await shot('agesM', 100, 15, { bust: true });
res.agesF = await shot('agesF', 100, 15, { bust: true });
res.agesElf = await shot('agesElf', 100, 9, { bust: true });
res.params = await shot('params', 120, 8, { bust: true });
res.builds = await shot('builds', 200, 8, {});
res.buildsB = await shot('builds', 120, 8, { bust: true });
res.heights = await shot('heights', 200, 7, {});
res.wounds = await shot('wounds', 110, 10, { bust: true });
res.beards = await shot('beards', 120, 10, { bust: true });
res.skins = await shot('skins', 120, 8, { bust: true });
res.eyes = await shot('eyes', 120, 8, { bust: true });
res.hstyles = await shot('hstyles', 96, 13, { bust: true });
res.quiz = await shot('quiz', 88, 12, { bust: true });
res.family = await shot('family', 110, 10, { bust: true });
res.small = await shot('random24', 46, 12, { bust: true });
const key = await pg.evaluate(() => window.SHKEY);
console.log(JSON.stringify({ res, key, errs: errs.slice(0, 5) }, null, 1));
await b.close();
