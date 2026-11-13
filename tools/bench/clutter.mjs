// B5: how much a screen shows at once. For a peasant, a noble and a ruler, on every page, at 1366x768 (mouse) and 420x900
// (touch): the words and controls in view without scrolling, the elements of the whole page, the chips, the screens of
// scroll, the share of the width the open page gets, and any sideways scroll.
//
//   node tools/bench/clutter.mjs /tmp/me.html [--out=/tmp/ardan/b5/before.json] [--shots=/tmp/ardan/b5/shots/before] [--only=life,you]
//
// The page is drawn the way the game draws it (UI.tab then UI.render); nothing here touches game state beyond the start of
// each life. A word counts when its text is inside the viewport and the element under its centre is the text's own.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { HELPERS } from '../../tests/helpers.mjs';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = k => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const file = path.resolve(args.find(a => !a.startsWith('--')) || path.join(here, '../../index.html'));
const outFile = opt('out'), shots = opt('shots'), only = opt('only') ? opt('only').split(',') : null;
if (shots) fs.mkdirSync(shots, { recursive: true });

export const VIEWS = {
  desk: { viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  phone: { viewport: { width: 420, height: 900 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
};
export const PERSONAS = {
  peasant: { o: { seed: 7101, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 22 } },
  noble: { o: { seed: 7102, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 32 } },
  ruler: { o: { seed: 7103, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 40 }, ruler: true },
};
// the pages: [name, tab, extra js]
export const PAGES = [
  ['life', 'life', ''], ['story', 'story', ''], ['decisions', 'goals', ''],
  ['you', 'you', ''], ['path', 'path', ''], ['holdings', 'holdings', ''], ['arms', 'war', ''],
  ['people', 'people', ''], ['dynasty', 'legacy', ''],
  ['realm', 'realm', ''], ['world', 'world', "UI.worldView='map';"], ['book', 'book', ''],
];
const START = (o, ruler) => `(() => {
  A.newGame(${JSON.stringify(o)});
  UI.screen = 'game'; UI.set.hints = false; UI.ov = null;
  ${ruler ? 'try { const pc = A.pc(); A.makeRuler(pc, pc.realm, true); } catch (e) {}' : ''}
  for (let y = 0; y < 2; y++) { A.advance(365); let h, g = 0; while ((h = A.S.queue[0]) && g++ < 400) { if (h.type === 'event') { try { A.eventAuto(); } catch (e) { A.S.queue.shift(); } } else A.S.queue.shift(); } const pc = A.pc(); if (!pc.alive) { pc.alive = true; pc.health = 80; } }
  A.S.queue = []; UI.ov = null; UI.render();
})()`;

// in the page: what one drawn screen holds
export const PROBE = () => {
  const W = innerWidth, H = innerHeight;
  const vis = el => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; for (let a = el; a && a.nodeType === 1; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; } return true; };
  const inView = r => r.bottom > 0 && r.top < H && r.right > 0 && r.left < W;
  const zoneOf = el => { const z = el.closest('#topbar,#profile,#logwrap,#side,#bnav,#modal,.phone-profile'); return z ? (z.id || 'phone-profile') : 'other'; };
  const zones = {}, add = (z, k, n = 1) => { (zones[z] = zones[z] || { words: 0, controls: 0 })[k] += n; };
  const tw = document.createTreeWalker(document.getElementById('app'), NodeFilter.SHOW_TEXT);
  let words = 0, n;
  while ((n = tw.nextNode())) {
    const t = n.nodeValue.trim(); if (!t) continue; const el = n.parentElement; if (!el || /^(SCRIPT|STYLE)$/.test(el.tagName) || !vis(el)) continue;
    const rg = document.createRange(); rg.selectNodeContents(n); const r = rg.getBoundingClientRect(); if (!r.width || !inView(r)) continue;
    const top = document.elementFromPoint(Math.min(W - 1, Math.max(0, r.left + r.width / 2)), Math.min(H - 1, Math.max(0, r.top + r.height / 2)));
    if (!top || !(el.contains(top) || top.contains(el))) continue;
    const c = t.split(/\s+/).length; words += c; add(zoneOf(el), 'words', c);
  }
  let controls = 0;
  for (const el of document.querySelectorAll('#app button, #app a[href], #app [data-a], #app input, #app select, #app summary, #app [role=button], #app [role=tab]')) {
    if (el.disabled || !vis(el)) continue; const r = el.getBoundingClientRect(); if (!inView(r)) continue;
    const top = document.elementFromPoint(Math.min(W - 1, Math.max(0, r.left + r.width / 2)), Math.min(H - 1, Math.max(0, r.top + r.height / 2)));
    if (!top || !(el.contains(top) || top.contains(el))) continue;
    controls++; add(zoneOf(el), 'controls');
  }
  const body = document.getElementById('tabbody') || document.getElementById('side') || document.body;
  const elements = [...body.querySelectorAll('*')].filter(e => !/^(SCRIPT|STYLE|PATH|G|CIRCLE|RECT|LINE|POLYGON|POLYLINE|DEFS|USE|TEXT|TSPAN)$/i.test(e.tagName) && !e.closest('svg') ).length;
  const chips = body.querySelectorAll('.chip, .pill, .tag, .badge, .lk-chip, .cost, .eff, [class*=chip]').length;
  const infos = body.querySelectorAll('[data-note], [data-tt], .info, .ib').length;
  const folds = body.querySelectorAll('.fold').length, foldsClosed = body.querySelectorAll('.fold > .fold-b[hidden]').length;
  // the screens of scroll: the page's own scroller, or the window
  const sc = document.getElementById('tabbody'), scrollers = [];
  const scrollEl = (() => { for (let a = sc; a; a = a.parentElement) { if (a.scrollHeight > a.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(a).overflowY)) return a; } return document.scrollingElement; })();
  const screens = +(scrollEl.scrollHeight / (scrollEl === document.scrollingElement ? H : scrollEl.clientHeight)).toFixed(2);
  const side = document.getElementById('side'), sr = side ? side.getBoundingClientRect() : null;
  const hover = [...document.querySelectorAll('#app [onmouseover],#app [onmouseenter]')].length;
  // sideways scroll: the page wider than the screen, or an element sticking out that no scroller holds
  let hs = document.documentElement.scrollWidth - W; const out = [];
  for (const el of document.querySelectorAll('#app *')) {
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.right <= W + 1 || !vis(el)) continue;
    let held = false; for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { if (/auto|scroll|hidden|clip/.test(getComputedStyle(a).overflowX) && a.getBoundingClientRect().right <= W + 1) { held = true; break; } }
    if (!held) out.push((el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className).trim().split(/\s+/)[0]) + '+' + Math.round(r.right - W));
  }
  return { words, controls, elements, chips, infos, folds, foldsClosed, screens, zones, pageShare: sr ? +(sr.width / W).toFixed(2) : 1, hscroll: Math.max(0, hs), sticksOut: out.slice(0, 4), nOut: out.length, hover };
};

const SETTLE = () => (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => new Promise(r => setTimeout(r, 120))).then(() => new Promise(r => requestAnimationFrame(() => r())));

const browser = await pw.chromium.launch();
const report = {};
for (const [vn, vopt] of Object.entries(VIEWS)) {
  for (const [pn, P] of Object.entries(PERSONAS)) {
    if (only && !only.includes(pn) && !only.includes(vn)) { /* filter by page below */ }
    const ctx = await browser.newContext({ ...vopt, reducedMotion: 'reduce' });
    const pg = await ctx.newPage(); const errs = [];
    pg.on('pageerror', e => errs.push(String(e.message || e).slice(0, 200)));
    await pg.goto(pathToFileURL(file).href);
    await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
    await pg.evaluate(HELPERS);
    await pg.evaluate(START(P.o, P.ruler));
    for (const [name, tab, extra] of PAGES) {
      if (only && !only.includes(name)) continue;
      const key = `${vn}/${pn}/${name}`;
      try {
        await pg.evaluate(`(() => { UI.ov = null; A.S.queue = []; UI.tab = ${JSON.stringify(tab)}; ${extra} UI.render(); window.scrollTo(0, 0); })()`);
        await pg.evaluate(SETTLE);
        const m = await pg.evaluate(PROBE);
        m.tab = await pg.evaluate(() => UI.tab);
        report[key] = m;
        if (shots) await pg.screenshot({ path: path.join(shots, `${vn}-${pn}-${name}.png`) });
      } catch (e) { report[key] = { error: String(e.message || e).slice(0, 200) }; }
    }
    if (errs.length) report[`${vn}/${pn}/errors`] = errs.slice(0, 5);
    await ctx.close();
  }
}
await browser.close();
if (outFile) { fs.mkdirSync(path.dirname(outFile), { recursive: true }); fs.writeFileSync(outFile, JSON.stringify(report, null, 1)); }
// a table: one row a screen
console.log('view/persona/page'.padEnd(26) + 'words ctrl  elem chips fold screens  share hscroll');
for (const [k, m] of Object.entries(report)) {
  if (m.error || Array.isArray(m)) { console.log(k.padEnd(26), m.error || JSON.stringify(m)); continue; }
  console.log(k.padEnd(26) + String(m.words).padStart(5) + String(m.controls).padStart(5) + String(m.elements).padStart(6) + String(m.chips).padStart(6) + String(m.folds + '/' + m.foldsClosed).padStart(6) + String(m.screens).padStart(8) + String(m.pageShare).padStart(7) + String(m.hscroll || 0).padStart(7) + (m.nOut ? '  out:' + m.nOut + ' ' + m.sticksOut.join(' ') : ''));
}
