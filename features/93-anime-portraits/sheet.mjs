// Portrait sheets for review (not part of the build or the tests): 40 varied people at 88 px, 32 px, 32 px as black
// silhouettes, and 200 x 300 full figures, written as PNGs.
//   node features/93-anime-portraits/sheet.mjs <built.html> <out-prefix> [dark|light]
//   ZOOM=1,2,9 node features/93-anime-portraits/sheet.mjs <built.html> <out-prefix>   (those people at 240 px)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const [file, out, theme = 'dark'] = process.argv.slice(2);
const b = await pw.chromium.launch(); const pg = await b.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 1 });
const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 300))); pg.on('console', m => { if (/error|CSP/i.test(m.type() + m.text())) errs.push(m.text().slice(0, 200)); });
await pg.goto('file://' + file); await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
const info = await pg.evaluate((theme) => {
  A.newGame({ seed: 931, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
  UI.set.theme = theme; UI.applySettings && UI.applySettings();
  const base = A.pc();
  const realms = Object.keys(A.S.realms || {});
  const house = Object.values(A.S.houses || {}).find(h => h.colors && h.charge);
  const mk = (o) => {
    const R = GD.RACES[o.race || 'human'], p = JSON.parse(JSON.stringify(base));
    p.id = 'sh_' + o.n; p.given = o.given || ('P' + o.n); p.sur = '';
    p.race = o.race || 'human'; p.sex = o.sex || 'M'; p.born = A.S.year - (o.age ?? 25);
    p.status = o.status || 'peasant'; p.ruler = o.ruler || null; p.mil = o.mil || null; p.job = o.job || null; p.house = o.house || null; p.noble = null;
    p.cult = o.cult || p.cult; p.realm = o.realm || p.realm;
    p.gear = Object.assign({ weapon: 'fists', ranged: null, armor: 'none', shield: null, helm: null, mount: null, cloak: null }, o.gear || {});
    p.wounds = (o.wounds || []).map(k => ({ k })); p.quirks = o.quirks || []; p.alive = !o.dead; p.traits = o.traits || [];
    p.happy = o.happy ?? 55; p.health = o.health ?? 80; p.rel = {};
    const sk = GD.SKIN[p.race] || GD.SKIN.human;
    p.app = Object.assign({}, base.app, { skin: sk[(o.n * 3) % sk.length], hair: o.n % 11, eye: o.n % 8, beard: 'none', hstyle: 'short' }, o.app || {});
    return p;
  };
  const L = [
    { race: 'human', sex: 'M', age: 25, app: { hstyle: 'short', hair: 1 }, cult: 'CUL-02' },
    { race: 'human', sex: 'F', age: 22, app: { hstyle: 'long', hair: 4 }, happy: 80, cult: 'CUL-01' },
    { race: 'human', sex: 'F', age: 15, app: { hstyle: 'tied', hair: 7 }, cult: 'CUL-11' },
    { race: 'human', sex: 'M', age: 8, app: { hstyle: 'short', hair: 5 } },
    { race: 'human', sex: 'F', age: 6, app: { hstyle: 'braided', hair: 0 }, cult: 'CUL-12' },
    { race: 'human', sex: 'F', age: 0 },
    { race: 'human', sex: 'M', age: 70, app: { hstyle: 'short', beard: 'full', hair: 2 } },
    { race: 'human', sex: 'F', age: 72, app: { hstyle: 'long', hair: 1 } },
    { race: 'elf', sex: 'F', age: 120, app: { hstyle: 'long', hair: 6 }, cult: 'CUL-19' },
    { race: 'elf', sex: 'M', age: 200, app: { hstyle: 'long', hair: 9 }, cult: 'CUL-20' },
    { race: 'halfelf', sex: 'F', age: 30, app: { hstyle: 'ponytail', hair: 3 } },
    { race: 'halfelf', sex: 'M', age: 40, app: { hstyle: 'wild', hair: 0 } },
    { race: 'dwarf', sex: 'M', age: 80, app: { hstyle: 'braided', beard: 'braided', hair: 8 }, cult: 'CUL-21' },
    { race: 'dwarf', sex: 'F', age: 70, app: { hstyle: 'braided', hair: 4 }, cult: 'CUL-21' },
    { race: 'orc', sex: 'M', age: 25, app: { hstyle: 'mohawk', hair: 0, paint: 'warpaint' }, cult: 'CUL-22', traits: ['wrathful'], happy: 30 },
    { race: 'orc', sex: 'F', age: 22, app: { hstyle: 'topknot', hair: 0 }, cult: 'CUL-23' },
    { race: 'halforc', sex: 'M', age: 28, app: { hstyle: 'cropped', hair: 1, beard: 'stubble' } },
    { race: 'giant', sex: 'M', age: 40, app: { hstyle: 'wild', hair: 3, beard: 'long' }, cult: 'CUL-24' },
    { race: 'giant', sex: 'F', age: 35, app: { hstyle: 'braided', hair: 5 }, cult: 'CUL-24' },
    { race: 'human', sex: 'M', age: 45, ruler: realms[0], status: 'royal', app: { hstyle: 'short', beard: 'short', hair: 3 } },
    { race: 'human', sex: 'F', age: 33, ruler: realms[1], status: 'royal', app: { hstyle: 'long', hair: 0 }, happy: 75 },
    { race: 'human', sex: 'F', age: 28, status: 'noble', house: house && house.id, app: { hstyle: 'curly', hair: 7 } },
    { race: 'human', sex: 'M', age: 35, status: 'noble', house: house && house.id, app: { hstyle: 'tied', hair: 2 }, traits: ['proud'] },
    { race: 'human', sex: 'M', age: 50, job: { c: 'clergy', k: 'priest', r: 2 }, app: { hstyle: 'cropped', hair: 2 } },
    { race: 'human', sex: 'M', age: 30, mil: { rank: 2, troop: 'HI', realm: realms[0] }, gear: { weapon: 'spear', armor: 'mail', helm: 'helm', shield: 'kite' }, app: { hstyle: 'short', hair: 1 } },
    { race: 'human', sex: 'M', age: 32, house: house && house.id, mil: { rank: 6, troop: 'HC', realm: realms[0] }, gear: { weapon: 'longsword', armor: 'plate', cloak: 'tabard' }, app: { hstyle: 'short', hair: 6 } },
    { race: 'human', sex: 'M', age: 50, dead: true, app: { hstyle: 'short', hair: 2, beard: 'goatee' } },
    { race: 'human', sex: 'M', age: 40, wounds: ['lost_eye', 'scar_face'], app: { hstyle: 'wild', hair: 0, beard: 'stubble' }, happy: 20 },
    { race: 'human', sex: 'F', age: 40, status: 'merchant', app: { hstyle: 'topknot', hair: 1 }, cult: 'CUL-04' },
    { race: 'human', sex: 'M', age: 35, status: 'artisan', app: { hstyle: 'curly', hair: 3, beard: 'mustache' }, cult: 'CUL-08' },
    { race: 'human', sex: 'M', age: 28, status: 'slave', app: { hstyle: 'locks', hair: 0 }, happy: 15, cult: 'CUL-09' },
    { race: 'elf', sex: 'M', age: 15, app: { hstyle: 'short', hair: 6 } },
    { race: 'dwarf', sex: 'M', age: 10, app: { hstyle: 'short', hair: 7 } },
    { race: 'orc', sex: 'F', age: 6, app: { hstyle: 'tied', hair: 0 } },
    { race: 'human', sex: 'F', age: 24, traits: ['wrathful'], happy: 10, app: { hstyle: 'short', hair: 8 }, cult: 'CUL-15' },
    { race: 'human', sex: 'F', age: 19, happy: 95, traits: ['gregarious'], app: { hstyle: 'ponytail', hair: 5 }, cult: 'CUL-14' },
    { race: 'human', sex: 'M', age: 19, happy: 5, app: { hstyle: 'long', hair: 4 } },
    { race: 'elf', sex: 'F', age: 380, app: { hstyle: 'long', hair: 9 } },
    { race: 'elf', sex: 'F', age: 90, dead: true, app: { hstyle: 'long', hair: 6 } },
    { race: 'dwarf', sex: 'M', age: 60, mil: { rank: 3, troop: 'HI', realm: realms[0] }, gear: { weapon: 'greataxe', armor: 'dwarfplate', helm: 'horned' }, app: { hstyle: 'braided', beard: 'long', hair: 7 } },
  ];
  window.SHEET = L.map((o, i) => mk(Object.assign({ n: i + 1 }, o)));
  return { n: SHEET.length, house: house && house.id, realms: realms.slice(0, 3) };
}, theme);
async function shot(name, size, cols, opts = {}) {
  await pg.evaluate(({ size, cols, opts, theme }) => {
    document.getElementById('sheet')?.remove();
    const box = document.createElement('div'); box.id = 'sheet';
    box.style.cssText = `position:fixed;left:0;top:0;z-index:99999;background:${theme === 'light' ? '#f2ede2' : '#0d1120'};padding:10px;display:grid;grid-template-columns:repeat(${cols},auto);gap:8px;font:11px sans-serif;color:${theme === 'light' ? '#1d2033' : '#eee8da'}`;
    const t0 = performance.now();
    let html = '';
    for (const p of SHEET) { const s = PORTRAIT.svg(p, size, opts); html += `<div style="text-align:center">${s}<div>${p.race[0]}${p.sex}${A.age(p)}${p.alive ? '' : '†'} ${((s.length) / 1024).toFixed(1)}k</div></div>`; }
    box.innerHTML = html; document.body.appendChild(box);
    window.SHEET_T = performance.now() - t0;
  }, { size, cols, opts, theme });
  const el = await pg.$('#sheet');
  await el.screenshot({ path: `${out}-${name}.png` });
  return pg.evaluate(() => ({ t: SHEET_T, err: UI.ANIME ? UI.ANIME.errors : null, last: UI.ANIME ? UI.ANIME.lastError : null }));
}
if (process.env.ZOOM) { await pg.evaluate((z) => { window.SHEET = SHEET.filter((p, i) => z.split(',').map(Number).includes(i + 1)); }, process.env.ZOOM); const rz = await shot('zoom', 240, 5, { bust: true }); console.log(JSON.stringify(rz)); await b.close(); process.exit(0); }
const r1 = await shot('b88', 88, 10, { bust: true });
const r2 = await shot('small', 32, 20, { bust: true });
const r3 = await shot('full', 200, 10);
await pg.addStyleTag({ content: '#sheet svg .ap-fig{filter:brightness(0)!important}' });
const r4 = await shot('sil32', 32, 20, { bust: true });
console.log(JSON.stringify({ info, r1, r2, r3, errs: errs.slice(0, 5) }));
await b.close();
