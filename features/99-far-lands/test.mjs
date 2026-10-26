// Tests for features/99-far-lands: the size-agnostic frame (stage 1) and the Great Continent (stage 2).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { HELPERS } from '../../tests/helpers.mjs';
import { unpack, repack } from '../../tools/pack.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// The same build without this feature: its code files cut from the core blob and its patches undone, so "before" is
// exactly the page the other features make. (This feature's edits inside 62-inked-map stay; they are the identity by
// construction at today's size and are covered by 62's own pixel tests.)
async function beforeBuild(file) {
  const html = fs.readFileSync(file, 'utf8'), parts = unpack(html);
  let core = parts['ardan-core'];
  for (const f of fs.readdirSync(HERE).filter(f => f.endsWith('.core.js')).sort()) {
    const chunk = `\n;(function(){ // features/99-far-lands/${f}\n${fs.readFileSync(path.join(HERE, f), 'utf8')}\n})();\n`;
    if (!core.includes(chunk)) throw new Error(`${f} is not in this build as written`);
    core = core.split(chunk).join('');
  }
  const patches = (await import(pathToFileURL(path.join(HERE, 'patches.mjs')).href)).default;
  for (const p of patches.slice().reverse()) {
    for (const [find, replace, want = 1] of p.edits.slice().reverse()) {
      const blob = p.blob === 'html' ? null : p.blob;
      const src = blob === 'ardan-core' ? core : parts[blob];
      const n = src.split(replace).length - 1;
      if (n !== want) throw new Error(`${p.id}: ${n} copies of the patched text, expected ${want}`);
      const back = src.split(replace).join(find);
      if (blob === 'ardan-core') core = back; else parts[blob] = back;
    }
  }
  parts['ardan-core'] = core;
  const out = path.join(os.tmpdir(), `ardan-fl-before-${process.pid}.html`);
  fs.writeFileSync(out, repack(html, parts, 3));
  return out;
}

async function openPage(browser, file) {
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 300)));
  await pg.goto(pathToFileURL(file).href);
  await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
  await pg.evaluate(HELPERS);
  return { pg, ctx, errs };
}

// What must not move at today's size: five years of three lives (the state and the random stream), and the pixels of
// every map view (the world tab, the campaign map's frame, the full map at zoom 1, 3 and 8, the war room at 1.5, 4 and
// 9), with the inked map on and off.
const MEASURE = () => {
  const out = { lives: [], views: {} };
  for (const [seed, realm] of [[9901, 'POL-01'], [9902, 'POL-20'], [9903, 'POL-11']]) {
    A.newGame({ seed, race: realm === 'POL-11' ? 'orc' : 'human', realm, status: 'peasant', sex: 'M', startAge: 16 });
    T.play(5);
    out.lives.push({ seed, year: A.S.year, hash: T.hash(A.S), rng: A.rngState, bytes: JSON.stringify(A.S).length });
  }
  const hash = c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 2166136261; for (let i = 0; i < d.length; i++) { h ^= d[i]; h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };
  A.newGame({ seed: 621, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
  const pc = A.pc(), enemy = A.neighbors('POL-01')[0];
  A.startWar('POL-01', enemy, null, 'conquest'); A.enlist(pc); A._idIdx = null; A.advance(2); A._idIdx = null;
  A.S.queue = []; UI.screen = 'game'; UI.set.hints = false; UI.tab = 'world'; UI.worldView = 'map';
  if (UI.INKMAP) UI.INKMAP.budgetMs = 1e9;
  const at = () => { const d = A.divById(A.pc().mil.div); return A.S.prov[d.loc]; };
  const gm = z => { const p = at(), w = 7000 / z; UI.gm.view = UI.wrClampView({ x0: p.sx - w / 2, y0: p.sy - w / 3.06, w, h: 0 }); UI.gmDraw(); return UI.$('#gmap'); };
  const war = z => { const p = at(), w = 7000 / z; UI.wr.view = UI.wrClamp({ x0: p.sx - w / 2, y0: p.sy - w / 3.06, w, h: w / 1.5277 }); const c = UI.$('#warmap'); UI.drawWar(c); return c; };
  for (const on of [true, false]) {
    if (UI.INKMAP) { UI.set.inkMap = on; UI.INKMAP.reset(); }
    const k = on ? 'ink' : 'release', V = out.views[k] = {};
    UI.ov = null; UI.render();
    const wm = UI.$('#worldmap'); MAP.draw(wm, { mode: 'political' }); V.world = hash(wm);
    const off = document.createElement('canvas'); off.width = 1400; off.height = 900; MAP.draw(off, { allLabels: true }); V.big = hash(off);
    V.toCanvas = MAP.toCanvas(wm, 3210.5, 1777.25).join(',');
    UI.A.ov('bigmap'); UI.gm.view = null; UI.gmDraw(); V.gmFit = hash(UI.$('#gmap')) + ' ' + JSON.stringify(UI.gm.view);
    for (const z of [1, 3, 8]) V['gm' + z] = hash(gm(z));
    UI.ov = null; UI.render(); UI.warRoomOpen();
    for (const z of [1.5, 4, 9]) V['war' + z] = hash(war(z));
    V.wrView = JSON.stringify(UI.wrView());
    UI.ov = null; UI.render();
  }
  return out;
};

export default {
  async flFrameIdentical(pg, pageErrors, { browser, file }) {
    let before;
    try { before = await beforeBuild(file); } catch (e) { return { ok: false, detail: 'could not derive the build without this feature: ' + e.message }; }
    const B = await openPage(browser, before);
    let a, b;
    try { a = await B.pg.evaluate(MEASURE); } finally { await B.ctx.close(); fs.rmSync(before, { force: true }); }
    b = await pg.evaluate(MEASURE);
    const diff = [];
    a.lives.forEach((l, i) => { const m = b.lives[i]; if (l.hash !== m.hash || l.rng !== m.rng || l.bytes !== m.bytes) diff.push(`seed ${l.seed}: ${l.hash}/${l.rng} vs ${m.hash}/${m.rng}`); });
    for (const k in a.views) for (const v in a.views[k]) if (a.views[k][v] !== b.views[k][v]) diff.push(`${k} ${v}: ${a.views[k][v]} vs ${b.views[k][v]}`);
    const nViews = Object.values(a.views).reduce((s, V) => s + Object.keys(V).length, 0);
    return { ok: !diff.length && !B.errs.length, detail: `${a.lives.length} lives of 5 years (${a.lives.map(l => l.hash).join(', ')}) and ${nViews} view hashes, with and without this feature: ` +
      (diff.length ? `${diff.length} differ: ${diff.slice(0, 4).join('; ')}` : 'identical') + (B.errs.length ? '; page error before: ' + B.errs[0] : '') };
  },
};
