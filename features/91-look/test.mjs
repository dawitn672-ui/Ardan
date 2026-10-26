// 91-look: the Night and Washi tokens pass AA everywhere they are used, the Life screen fits one screen at 1366 x 768
// (only the story scrolls), the phone's Life page is short, axe finds nothing on the main tabs in either theme, and
// none of it touches the game.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { HELPERS } from '../../tests/helpers.mjs';
import { LIFE, SETTLE } from '../71-phone/screens.mjs';
const require = createRequire(import.meta.url);

// a fresh page in a context of its own (a viewport, touch or not), booted, motion reduced so fades do not hide layout
async function page(browser, file, opts, errs) {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', ...opts });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 300)));
  await pg.goto(pathToFileURL(file).href);
  await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
  await pg.evaluate(HELPERS);
  return { ctx, pg };
}
// default expander states: nothing remembered
const FRESH = () => { try { localStorage.removeItem('ardan_fold_v1'); } catch (e) {} if (UI.FOLD) { UI.FOLD.state = {}; UI.FOLD.allOpen = false; } };
const THEME = t => { UI.set.theme = t; UI.applySettings(); UI.render(); };
const dropFontCsp = errs => { for (let i = errs.length - 1; i >= 0; i--) if (/fonts\.googleapis\.com/.test(errs[i])) errs.splice(i, 1); };

// WCAG 2.x contrast of two colours as the browser computed them ("rgb(r, g, b)" or "#rrggbb")
const CONTRAST = () => {
  const parse = c => { c = String(c).trim(); if (c[0] === '#') return [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)); const m = c.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [0, 0, 0]; };
  const lum = c => { const [r, g, b] = parse(c).map(v => v / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  window.__ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  // a token's value as a colour: resolved through a probe element, so var() chains are followed
  window.__tok = k => { const p = document.createElement('i'); p.style.color = `var(${k})`; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; };
};

export default {
  // 1366 x 768, the Life tab (71-phone's LIFE screen), default expander states: the rail and the panel do not scroll,
  // only the story does. At 1920 x 1080 the same holds with Your days open.
  async fitsOneScreen(pg, errs, { browser, file }) {
    const out = {};
    for (const [w, h] of [[1366, 768], [1920, 1080]]) {
      const { ctx, pg: p } = await page(browser, file, { viewport: { width: w, height: h } }, errs);
      try {
        await p.evaluate(FRESH);
        await p.evaluate(LIFE());
        await p.evaluate(SETTLE);
        out[w] = await p.evaluate(() => {
          const m = el => el ? { sh: el.scrollHeight, ch: el.clientHeight, fits: el.scrollHeight <= el.clientHeight + 4 } : null;
          const acts = document.querySelector('#tabbody .fold-acts > .fold-b');
          const tiles = [...document.querySelectorAll('#tabbody .lk-acts > .act')];
          const ab = acts && acts.getBoundingClientRect();
          const seen = ab ? tiles.filter(t => { const r = t.getBoundingClientRect(); return r.bottom <= ab.bottom + 1; }).length : 0;
          const yd = document.querySelector('#tabbody .plan-card > .fold-x');
          return { tab: m(document.getElementById('tabbody')), profile: m(document.getElementById('profile')), page: document.scrollingElement.scrollHeight <= innerHeight + 1,
            tiles: tiles.length, seen, yourDays: yd ? yd.getAttribute('aria-expanded') : null, log: m(document.getElementById('log')) };
        });
      } finally { await ctx.close(); }
    }
    const a = out[1366], b = out[1920];
    const ok = a.tab.fits && a.profile.fits && a.page && b.tab.fits && b.profile.fits && b.page && a.tiles >= 20 && a.yourDays === 'false' && b.yourDays === 'true';
    return { ok, detail: `1366x768: panel ${a.tab.sh}/${a.tab.ch}, rail ${a.profile.sh}/${a.profile.ch}, page fits ${a.page}, activity tiles in sight ${a.seen} of ${a.tiles}, Your days open ${a.yourDays}; ` +
      `1920x1080: panel ${b.tab.sh}/${b.tab.ch}, rail ${b.profile.sh}/${b.profile.ch}, tiles in sight ${b.seen} of ${b.tiles}, Your days open ${b.yourDays}` };
  },

  // every text token on every surface it can sit on, in both themes: 4.5:1 (3:1 for control borders, the focus ring
  // and bar fills on their track); the gold and danger fills with their text; the odds badges; the release's names point
  // at the new tokens; UI.realmInk gives AA ink for any realm colour and is pure
  async tokensContrast(pg) {
    await pg.evaluate(CONTRAST);
    const r = await pg.evaluate(() => {
      T.enter({ seed: 91, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 20 });
      const TEXT = ['--ink', '--ink-2', '--ink-3', '--accent', '--accent-strong', '--danger', '--ok', '--warn', '--info', '--crown-ink', '--blood-ink', '--lore-ink', '--war-ink', '--peace-ink', '--rubric-ink',
        '--vital-health', '--st-str', '--st-spd', '--st-ins', '--st-sta', '--st-int', '--st-wil', '--odds-likely', '--odds-even', '--odds-risky', '--odds-long',
        '--r-common', '--r-uncommon', '--r-rare', '--r-epic', '--r-legendary', '--r-mythic', '--focus'];
      const SURF = ['--bg', '--surface', '--raised', '--raised-hover', '--overlay', '--sunken'];
      const bad = [], worst = {}, alias = [];
      const MAP = { '--text-1': '--ink', '--text-2': '--ink-2', '--text-3': '--ink-3', '--surface-1': '--surface', '--bg-1': '--bg', '--bg-0': '--sunken', '--border-2': '--line-strong', '--bad': '--danger' };
      for (const th of ['dark', 'light']) {
        UI.set.theme = th; UI.applySettings();
        let lo = 99;
        for (const t of TEXT) for (const s of SURF) {
          const q = __ratio(__tok(t), __tok(s)), need = t === '--focus' ? 3 : 4.5;
          lo = Math.min(lo, t === '--focus' ? 99 : q);
          if (q < need) bad.push(`${th} ${t} on ${s} ${q.toFixed(2)}`);
        }
        // control borders on what they sit on (Washi's sunken wells are fields, and a field's edge sits on the surface)
        for (const s of th === 'dark' ? SURF : SURF.filter(x => x !== '--sunken')) { const q = __ratio(__tok('--line-strong'), __tok(s)); if (q < 3) bad.push(`${th} --line-strong on ${s} ${q.toFixed(2)}`); }
        // bar fills on their track
        for (const f of ['--vital', '--vital-health', '--accent', '--st-str', '--st-spd', '--st-ins', '--st-sta', '--st-int', '--st-wil']) { const q = __ratio(__tok(f), __tok('--sunken')); if (q < 3) bad.push(`${th} bar ${f} ${q.toFixed(2)}`); }
        // text on fills
        const g = __ratio(__tok('--on-accent'), __tok('--accent-fill')), d = __ratio('#ffffff', __tok('--danger-fill'));
        if (g < 4.5) bad.push(`${th} on gold ${g.toFixed(2)}`);
        if (d < 4.5) bad.push(`${th} white on danger ${d.toFixed(2)}`);
        // the gold fill's edge on Washi: its 1 px border against the page
        if (th === 'light') { const e = __ratio(__tok('--accent-fill-line'), __tok('--surface')); if (e < 3) bad.push(`light gold border ${e.toFixed(2)}`); }
        // odds badges: band text on a tint of the band over --raised
        const mix = (a, b, t) => { const P = c => c.match(/[\d.]+/g).slice(0, 3).map(Number); const x = P(a), y = P(b); return `rgb(${x.map((v, i) => Math.round(v * t + y[i] * (1 - t))).join(',')})`; };
        for (const b of ['likely', 'even', 'risky', 'long']) { const c = __tok('--odds-' + b), q = __ratio(c, mix(c, __tok('--raised'), th === 'dark' ? 0.14 : 0.12)); if (q < 4.5) bad.push(`${th} odds ${b} badge ${q.toFixed(2)}`); }
        for (const [o, n] of Object.entries(MAP)) if (__tok(o) !== __tok(n)) alias.push(`${th} ${o}`);
        worst[th] = +lo.toFixed(2);
      }
      // realm ink: 24 colours, both themes
      const COLS = ['#c0392b', '#2e86de', '#27ae60', '#8e44ad', '#f1c40f', '#e67e22', '#16a085', '#7f8c8d', '#ffffff', '#000000', '#ff00ff', '#00ffff', '#3a2a1a', '#d35400', '#1abc9c', '#9b59b6', '#34495e', '#e84393', '#6c5ce7', '#00b894', '#fdcb6e', '#b2bec3', 'red"><x', null];
      let realmBad = 0, pure = true;
      for (const th of ['dark', 'light']) {
        UI.set.theme = th; UI.applySettings();
        for (const c of COLS) {
          const a = UI.realmInk(c, th), b = UI.realmInk(c, th);
          if (a !== b || JSON.stringify(a) !== JSON.stringify(b)) pure = false;
          if (!/^#[0-9a-f]{6}$/.test(a.ink) || !/^#[0-9a-f]{6}$/.test(a.swatch)) pure = false;
          if (Math.min(__ratio(a.ink, __tok('--surface')), __ratio(a.ink, __tok('--raised'))) < 4.5) realmBad++;
        }
      }
      UI.set.theme = 'dark'; UI.applySettings();
      return { bad, worst, alias, realmBad, pure, n: TEXT.length * SURF.length * 2 };
    });
    const ok = !r.bad.length && !r.alias.length && !r.realmBad && r.pure;
    return { ok, detail: `${r.n} text/surface pairs: worst text ratio dark ${r.worst.dark}, light ${r.worst.light}; below the bar: ${r.bad.length ? r.bad.slice(0, 6).join(', ') : 'none'}; ` +
      `release names not on the new tokens: ${r.alias.length ? r.alias.join(', ') : 'none'}; realm inks under 4.5:1: ${r.realmBad} of 48, pure and escaped ${r.pure}` };
  },

  // the phone's Life page (390 x 844, touch) is at most 1.3 screens; it was 2.6
  async phoneLife(pg, errs, { browser, file }) {
    const { ctx, pg: p } = await page(browser, file, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, errs);
    let r;
    try {
      await p.evaluate(FRESH);
      await p.evaluate(LIFE());
      await p.evaluate(SETTLE);
      r = await p.evaluate(() => ({ h: document.scrollingElement.scrollHeight, vh: innerHeight, w: document.scrollingElement.scrollWidth, tiles: document.querySelectorAll('#tabbody .lk-acts > .act').length,
        small: [...document.querySelectorAll('#tabbody .lk-acts > .act')].filter(t => t.getBoundingClientRect().height < 43.5).length }));
    } finally { await ctx.close(); }
    const screens = +(r.h / r.vh).toFixed(2);
    return { ok: screens <= 1.3 && r.w <= 391 && r.tiles >= 20 && !r.small, detail: `Life page ${r.h} px in a ${r.vh} px screen: ${screens} screens (was 2.61); ${r.tiles} tiles, ${r.small} under 44 px; page width ${r.w}` };
  },

  // axe-core on Life, People, Holdings and Realm at 1366 x 768, in the dark and the light theme
  async lookAxe(pg, errs, { browser, file }) {
    const { ctx, pg: p } = await page(browser, file, { viewport: { width: 1366, height: 768 } }, errs);
    const found = []; let n = 0;
    try {
      await p.evaluate(fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'));
      await p.evaluate(FRESH);
      await p.evaluate(LIFE());
      for (const th of ['dark', 'light']) {
        await p.evaluate(THEME, th);
        for (const g of ['life', 'people', 'holdings', 'realm']) {
          await p.evaluate(g => { UI.TT && UI.TT.closeAll(); const b = document.querySelector(`[data-a="group"][data-v="${g}"]`); if (b) b.click(); }, g);
          await p.evaluate(SETTLE);
          const v = await p.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } })).violations.map(v => `${v.id}(${v.nodes.length}: ${v.nodes[0].target.join(' ')})`));
          n++;
          found.push(...v.map(x => `${th}/${g}: ${x}`));
        }
      }
    } finally { await ctx.close(); dropFontCsp(errs); }
    return { ok: n === 8 && !found.length, detail: `${n} screens (Life, People, Holdings, Realm × dark, light): ${found.length} violations${found.length ? ': ' + found.slice(0, 6).join('; ') : ''}` };
  },

  // the activity tiles: one grid, each tile with its group's icon, and its description in a tooltip that opens on hover
  async lookTiles(pg, errs, { browser, file }) {
    const { ctx, pg: p } = await page(browser, file, { viewport: { width: 1366, height: 768 } }, errs);
    let r;
    try {
      await p.evaluate(FRESH);
      await p.evaluate(LIFE());
      await p.evaluate(SETTLE);
      const t = await p.$('#tabbody .lk-acts > .act[data-tt="act"]:not(:disabled)');
      await t.hover();
      await p.waitForTimeout(150);
      r = await p.evaluate(() => {
        const tiles = [...document.querySelectorAll('#tabbody .lk-acts > .act')], pop = document.getElementById('tt-pop-1');
        const first = document.querySelector('#tabbody .lk-acts > .act[data-tt="act"]:not(:disabled)');
        const D = GD.ACTIVITIES[first.dataset.v];
        return { n: tiles.length, grids: document.querySelectorAll('#tabbody .lk-acts').length, icons: tiles.filter(t => t.querySelector('.lk-gi svg')).length, tips: tiles.filter(t => t.dataset.tt === 'act' || t.dataset.a !== 'act').length,
          h: Math.max(...tiles.map(t => Math.round(t.getBoundingClientRect().height))), cols: new Set(tiles.map(t => Math.round(t.getBoundingClientRect().left))).size,
          open: !!pop && !pop.hidden && pop.textContent.includes(D.desc) && pop.textContent.includes(D.name) };
      });
    } finally { await ctx.close(); }
    const ok = r.grids === 1 && r.n >= 20 && r.icons === r.n && r.tips === r.n && r.h <= 40 && r.cols === 3 && r.open;
    return { ok, detail: `${r.n} tiles in ${r.grids} grid, ${r.cols} columns, at most ${r.h} px tall; ${r.icons} with their group's icon; ${r.tips} with a tooltip; hover opens the description ${r.open}` };
  },

  // drawing with the look: every tab, the rail, the chips' "+N", the two-column sheet: the state and the random stream
  // unchanged, and drawing twice gives the same markup
  async lookPure(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 92, race: 'elf', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
      const h0 = T.hash(A.S), g0 = JSON.stringify(A.S.rng), marks = [];
      for (const pass of [0, 1]) {
        const m = [];
        for (const t of T.tabs()) { UI.tab = t; UI.ov = null; UI.render(); m.push(document.getElementById('app').innerHTML.length); }
        UI.tab = 'life'; UI.render();
        const more = document.querySelector('[data-a="lookChips"]'); if (more) { more.click(); more.click(); }
        UI.A.lookRail(); UI.A.lookRail();
        UI.refresh && UI.refresh(); UI.refreshTab && UI.refreshTab();
        m.push(document.getElementById('app').innerHTML.length);
        marks.push(m);
      }
      return { pure: T.hash(A.S) === h0 && JSON.stringify(A.S.rng) === g0, same: marks[0].every((x, i) => x === marks[1][i]), n: marks[0].length };
    });
    return { ok: r.pure && r.same, detail: `${r.n} draws twice: state and random stream unchanged ${r.pure}, same markup ${r.same}` };
  },
};
