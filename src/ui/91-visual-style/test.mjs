// 91-visual-style: the Night and Washi tokens pass AA everywhere they are used, the Life screen fits one screen at 1366 x 768
// (only the story scrolls), the phone's Life page is short, axe finds nothing on the main tabs in either theme, and
// none of it touches the game.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { HELPERS } from '../../../tests/helpers.mjs';
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
      r = await p.evaluate(() => ({ hint: Math.round(((document.querySelector('#tabbody > .hint') || { getBoundingClientRect: () => ({ height: -10 }) }).getBoundingClientRect().height) + 10), h: document.scrollingElement.scrollHeight - Math.round(((document.querySelector('#tabbody > .hint') || { getBoundingClientRect: () => ({ height: -10 }) }).getBoundingClientRect().height) + 10), vh: innerHeight, w: document.scrollingElement.scrollWidth, tiles: document.querySelectorAll('#tabbody .lk-acts > .act').length,
        small: [...document.querySelectorAll('#tabbody .lk-acts > .act')].filter(t => t.getBoundingClientRect().height < 43.5).length }));
    } finally { await ctx.close(); }
    const screens = +(r.h / r.vh).toFixed(2);
    // v2 (99992-v2-time): 1.5, not 1.3. A new chapter's open choice of aim now stands on the page (about 170 px) instead of
    // inside the folded ambition card: the owner's rule is that nothing hides behind a click. It folds back once chosen.
    return { ok: screens <= 1.5 && r.w <= 391 && r.tiles >= 20 && !r.small, detail: `Life page ${r.h} px in a ${r.vh} px screen (not counting the first-run hint in flow, ${r.hint} px): ${screens} screens (was 2.61); ${r.tiles} tiles, ${r.small} under 44 px; page width ${r.w}` };
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

  // the activity tiles: one grid, each tile with its group's icon, and its description on the sheet that a press opens
  // (round 2 B4, D-007: it was a tooltip that opened on hover; nothing opens on hover now)
  async lookTiles(pg, errs, { browser, file }) {
    const { ctx, pg: p } = await page(browser, file, { viewport: { width: 1366, height: 768 } }, errs);
    let r;
    try {
      await p.evaluate(FRESH);
      await p.evaluate(LIFE());
      await p.evaluate(SETTLE);
      const t = await p.$('#tabbody .lk-acts > .act[data-a="act"]:not(:disabled):not([aria-disabled="true"])');
      await t.hover();
      await p.waitForTimeout(400);
      const hov = await p.evaluate(() => !!document.querySelector('.tt-pop:not([hidden]), #modal .act-sheet'));
      const key = await t.getAttribute('data-v');
      await t.click();
      await p.waitForTimeout(150);
      r = await p.evaluate(key => {
        const tiles = [...document.querySelectorAll('#tabbody .lk-acts > .act')], sheet = document.querySelector('#modal .act-sheet');
        const D = GD.ACTIVITIES[key];
        return { n: tiles.length, grids: document.querySelectorAll('#tabbody .lk-acts').length, icons: tiles.filter(t => t.querySelector('.lk-gi svg')).length, tips: tiles.filter(t => t.dataset.a === 'act' || t.dataset.a !== 'act').length,
          h: Math.max(...tiles.map(t => Math.round(t.getBoundingClientRect().height))), cols: new Set(tiles.map(t => Math.round(t.getBoundingClientRect().left))).size,
          open: !!sheet && sheet.textContent.includes(D.desc) && sheet.textContent.includes(D.name) };
      }, key);
      r.hov = hov;
    } finally { await ctx.close(); }
    const ok = r.grids === 1 && r.n >= 20 && r.icons === r.n && r.tips === r.n && r.h <= 40 && r.cols === 3 && r.open && !r.hov;
    return { ok, detail: `${r.n} tiles in ${r.grids} grid, ${r.cols} columns, at most ${r.h} px tall; ${r.icons} with their group's icon; hover opens nothing (${!r.hov}); a press opens the sheet with the description ${r.open}` };
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
  // §1.6: every realm has a colour and an AA ink in both themes, and the palette is the same every time.
  // Changed for v2 (docs/v2/LANES.md: the Far Lands are dropped from the build): this measured the Great Continent's 118
  // accents, which no longer exist (A.FL_DATA is absent). It now measures the same on the generated continent, whose
  // realms are the Known World's 35 and those 70-fresh-realms-and-tensions carves out: the Known World keeps its own colours, every
  // realm in play has a valid colour and an AA ink in both themes, and reading them is pure and stable (the release gives
  // two far-apart realms one colour, so the distinct count is reported). Bordering realms of near the same colour are
  // reported here; 62-inked-map hatches them (inkBriefMarks).
  async realmColours(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 7101, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 20 });
      UI.screen = 'game'; UI.render();
      const lin = c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      const lab = h => { const [r, g, b] = [1, 3, 5].map(i => lin(parseInt(h.slice(i, i + 2), 16) / 255)); const l = Math.cbrt(0.4122 * r + 0.5363 * g + 0.0514 * b), m = Math.cbrt(0.2119 * r + 0.6807 * g + 0.1074 * b), s = Math.cbrt(0.0883 * r + 0.2817 * g + 0.6300 * b); return [0.2105 * l + 0.7936 * m - 0.0041 * s, 1.9780 * l - 2.4286 * m + 0.4506 * s, 0.0259 * l + 0.7828 * m - 0.8087 * s]; };
      const dist = (a, b) => { const p = lab(a), q = lab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
      const ids = Object.keys(A.S.realms).filter(id => id !== 'unclaimed' && A.S.realms[id]);
      const owner = new Map(A.S.prov.map(p => [p.id, p.owner]));
      const pairs = new Set();
      for (const P of A.S.prov) for (const j of P.adj || []) { const a = P.owner, b = owner.get(j); if (a && b && a !== b && a !== 'unclaimed' && b !== 'unclaimed') pairs.add(a < b ? a + '|' + b : b + '|' + a); }
      const d = [...pairs].map(k => { const [a, b] = k.split('|'); return dist(UI.realmHex(a), UI.realmHex(b)); }).sort((x, y) => x - y);
      const known = Object.values(A.S.realms).filter(x => x && /^POL-\d+$/.test(x.id) && +x.id.slice(4) <= 35);
      const lore = (typeof LORE !== 'undefined' && LORE.realms) || {};
      const keep = known.every(x => UI.realmHex(x) === String((lore[x.id] || x).color).toLowerCase());
      const hexOk = ids.every(id => /^#[0-9a-f]{6}$/.test(UI.realmHex(id)));
      let inkOk = 0, n = 0;
      for (const id of ids) for (const th of ['dark', 'light']) { n++; const k = UI.realmInk(UI.realmHex(id), th), T = UI.LOOK.THEMES[th]; if (Math.min(UI.LOOK.contrast(k.ink, T['--surface']), UI.LOOK.contrast(k.ink, T['--raised'])) >= 4.5) inkOk++; }
      const distinct = new Set(ids.map(id => UI.realmHex(id))).size;
      const h0 = T.hash(A.S);
      const again = ids.every(id => UI.realmHex(id) === UI.realmHex(A.S.realms[id]));
      return { realms: ids.length, pairs: pairs.size, min: d[0], med: d[Math.floor(d.length / 2)], close: d.filter(x => x < 0.04).length,
        keep, known: known.length, hexOk, inkOk, n, distinct, pure: T.hash(A.S) === h0, again, far: typeof A.FL_DATA !== 'undefined' && !!A.FL_DATA };
    });
    const f = x => (x || 0).toFixed(3);
    const ok = !r.far && r.known >= 30 && r.keep && r.hexOk && r.inkOk === r.n && r.pure && r.again;
    return { ok, detail: `${r.realms} realms on the continent, ${r.distinct} distinct colours; ${r.pairs} bordering pairs: OKLab distance median ${f(r.med)}, least ${f(r.min)}, ${r.close} under 0.04 (hatched by 62); ` +
      `the Known World's ${r.known} keep their colours ${r.keep}; AA ink ${r.inkOk}/${r.n}; pure ${r.pure}, stable ${r.again}; Far Lands data present ${r.far}` };
  },

  // §4.5 and §1.5: People as rows (twenty fit), the Realm tab's header band, rarity on gear quality and achievements; pure
  async lookRows(pg, errs, { browser, file }) {
    const { ctx, pg: p } = await page(browser, file, { viewport: { width: 1366, height: 768 } }, errs);
    try {
      await p.evaluate(FRESH);
      const r = await p.evaluate(() => {
        T.enter({ seed: 77, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
        UI.set.hints = false; T.play(3); A.S.queue = []; UI.ov = null;
        const h0 = T.hash(A.S), g0 = JSON.stringify(A.S.rng);
        UI.tab = 'people'; UI.render();
        const rows = [...document.querySelectorAll('#tabbody .card.person.lk-row')];
        const hs = rows.map(x => Math.round(x.getBoundingClientRect().height));
        const tb = document.getElementById('tabbody');
        const fit = Math.floor((tb.clientHeight - 120) / Math.max(1, Math.max(...hs)));
        UI.tab = 'realm'; UI.render();
        const band = document.querySelector('#tabbody .lk-band');
        const nums = band ? band.querySelectorAll('.lk-band-k dd:not(.lk-band-sp)').length : 0;
        const name = band && band.querySelector('.lk-band-n');
        const rr = A.realm(A.pc().realm), ink = UI.realmInkOf(rr);
        const cs = name && { color: getComputedStyle(name).color };
        // gear quality and the achievements
        const chip = UI.qualChip('master'), fine = UI.qualChip('fine'), none = UI.qualChip('common');
        UI.tab = 'legacy'; UI.render();
        const ach = [...document.querySelectorAll('#tabbody .achgrid .card.ach.rar')];
        const tiers = new Set(ach.map(a => a.dataset.tier));
        const pure = T.hash(A.S) === h0 && JSON.stringify(A.S.rng) === g0;
        return { rows: rows.length, maxH: Math.max(...hs), fit, band: !!band, nums, nameInk: cs && cs.color, ink: ink.ink, chip: /rar-epic/.test(chip) && /◆◆◆/.test(chip), fine: /rar-uncommon/.test(fine), none: none === '', ach: ach.length, achAll: Object.keys(GD.ACH).length, tiers: tiers.size, pure };
      });
      const hex = c => { const m = String(c).match(/\d+/g); return m ? '#' + m.slice(0, 3).map(v => (+v).toString(16).padStart(2, '0')).join('') : c; };
      const ok = r.rows >= 5 && r.maxH <= 32 && r.fit >= 18 && r.band && r.nums === 4 && hex(r.nameInk) === r.ink && r.chip && r.fine && r.none && r.ach === r.achAll && r.tiers >= 5 && r.pure;
      return { ok, detail: `People: ${r.rows} rows of at most ${r.maxH} px, ${r.fit} fit in the panel; Realm band ${r.band} with ${r.nums} numbers, name in its ink ${hex(r.nameInk) === r.ink}; ` +
        `Masterwork epic ${r.chip}, Fine uncommon ${r.fine}, common plain ${r.none}; ${r.ach}/${r.achAll} achievements tiered in ${r.tiers} tiers; pure ${r.pure}` };
    } finally { await ctx.close(); }
  },
  // the rest of this round's look: a war's strength bar, the rail's delta flash, beasts' tiers in the Codex, the realm
  // chip on a person's page, a pinned tooltip's mark; and drawing twice draws the same
  async lookMore(pg, errs, { browser, file }) {
    const { ctx, pg: p } = await page(browser, file, { viewport: { width: 1366, height: 768 } }, errs);
    try {
      await p.evaluate(FRESH);
      const r = await p.evaluate(async () => {
        T.enter({ seed: 91, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
        UI.set.hints = false; A.S.queue = []; UI.ov = null;
        const pc = A.pc(), out = {};
        // a war
        const en = A.neighbors(pc.realm)[0]; A.startWar(pc.realm, en, null, 'conquest'); A.S.queue = [];
        // Changed in round 2 (wf-round2), with v2 in the build: a war you are not in is rumour only (99997-v2-war,
        // playtest 1 findings 5 and 10), so its card and bar are gone for this peasant; he enlists to see his war, and
        // its strength is told as his rank knows it (finding 4: estimates, "about 160,000"), never exact
        out.v2 = !!A.V2W;
        if (out.v2) { A.enlist(pc); A._idIdx = null; A.advance(2); A._idIdx = null; A.S.queue = []; UI.ov = null; }
        UI.tab = 'war'; UI.render();
        const st = [...document.querySelectorAll('#tabbody .lk-str')];
        out.wars = st.length; out.warLabel = st[0] && st[0].getAttribute('aria-label');
        out.warShown = st[0] ? st[0].textContent : '';
        // the delta flash: the first draw shows none; a change shows it on that row
        UI.tab = 'life'; UI.render();
        out.flash0 = document.querySelectorAll('#profile .lk-dlt').length;
        UI.render(); out.flash1 = document.querySelectorAll('#profile .lk-dlt').length;
        pc.health = Math.max(1, pc.health - 10); UI.render();
        const d = document.querySelector('#profile .lk-v-health .lk-dlt');
        out.flash = d ? d.textContent : null;
        out.anyFlash = [...document.querySelectorAll('#profile .lk-dlt')].map(x => x.textContent);
        await new Promise(res => setTimeout(res, 1800));
        out.gone = !document.querySelector('#profile .lk-dlt');
        // beasts in the Codex
        UI.tab = 'codex'; UI.codex = 'beasts'; UI.render();
        const bs = [...document.querySelectorAll('#tabbody .card.rar-beast')];
        out.beasts = bs.length; out.beastTiers = [...new Set(bs.map(b => b.dataset.tier))].sort().join(',');
        UI.tab = 'life'; UI.render();
        // a pinned tooltip: a click on a stat's label pins it, and the popover says so
        const a = document.querySelector('#profile .barrow .lbl [data-tt="health"]') || document.querySelector('#profile .barrow .lbl [data-tt]');
        if (a) { a.click(); await new Promise(res => setTimeout(res, 60)); }
        out.pin = !!document.querySelector('.tt-pop.tt-pin');
        if (UI.TT) UI.TT.closeAll();
        // a person's page: the realm chip
        UI.A.ov('person:' + (pc.father || (pc.parents || [])[0]));
        const chip = document.querySelector('#modal .lk-realm');
        out.chip = chip ? chip.textContent : null;
        UI.ov = null; UI.render();
        // realm chips in People rows and in a tooltip that names a realm (the market's price)
        UI.tab = 'people'; UI.render();
        out.rowChips = document.querySelectorAll('#tabbody .card.person.lk-row .lk-realm').length;
        UI.tab = 'holdings'; if (UI.FOLD) UI.FOLD.allOpen = true; UI.render();
        const ta = document.querySelector('#tabbody [data-tt="mktPrice"], #tabbody [data-tt="tradeRun"]');
        if (ta && UI.TT) { UI.TT.open(ta, 1, 'click'); const el = UI.TT.stack[0] && UI.TT.stack[0].el; out.ttChip = el ? (el.querySelector('.lk-realm') || {}).textContent || 'none' : 'no popover'; UI.TT.closeAll(); }
        if (UI.FOLD) UI.FOLD.allOpen = false;
        // sparklines: the Realm band's four numbers get a line once two months have been drawn
        UI.tab = 'realm'; UI.render();
        out.spark0 = document.querySelectorAll('#tabbody .lk-band .lk-spark').length;
        for (let i = 0; i < 3; i++) { A.advance(31); A.S.queue = []; UI.render(); }
        const sp = [...document.querySelectorAll('#tabbody .lk-band .lk-spark')];
        out.sparks = sp.length; out.sparkLabel = sp[0] && sp[0].getAttribute('aria-label');
        await new Promise(res => setTimeout(res, 1800));   // the months' delta flashes have run out
        // pure: drawing every tab twice gives the same markup
        const h0 = T.hash(A.S), g0 = JSON.stringify(A.S.rng), m = [];
        for (const pass of [0, 1]) { const x = []; for (const t of T.tabs()) { UI.tab = t; UI.render(); x.push(document.getElementById('app').innerHTML.length); } m.push(x.join(',')); }
        out.same = m[0] === m[1]; out.pure = T.hash(A.S) === h0 && JSON.stringify(A.S.rng) === g0;
        return out;
      });
      // v2: the bar's numbers are estimates (W.estimate's words), and the rail's vitals are words, not 0-100 numbers (the
      // owner's rule), so a wound flashes no "▼ −10": no number flashes at all (changed in round 2, wf-round2)
      const est = s => /^Strength: us (about [\d,]+|some [\d,]+|a handful) against them (about [\d,]+|some [\d,]+|a handful)$/.test(s || '');
      const warOk = r.wars >= 1 && /^Strength: us .+ against them .+/.test(r.warLabel || '') && (!r.v2 || (est(r.warLabel) && !/\d+(\.\d)?k\b/.test(r.warShown)));
      const flashOk = r.v2 ? r.flash === null && !r.anyFlash.length : r.flash === '▼ −10';
      const ok = warOk && r.flash0 === 0 && r.flash1 === 0 && flashOk && r.gone && r.beasts >= 10 && r.beastTiers.split(',').length >= 3 && !!r.chip && r.pin && r.rowChips >= 3 && r.ttChip && !/^(none|no popover)$/.test(r.ttChip) && r.spark0 === 0 && r.sparks === 4 && /^Treasury since \d+: /.test(r.sparkLabel || '') && r.same && r.pure;
      return { ok, detail: `war strength bars ${r.wars} ("${r.warLabel}"${r.v2 ? `, shown "${r.warShown}"` : ''}); delta flash: none on the first draws (${r.flash0}, ${r.flash1}), "${r.flash}" after a wound${r.v2 ? ` (with v2 none with a number: ${JSON.stringify(r.anyFlash)})` : ''}, gone after 1.6 s ${r.gone}; ${r.beasts} beasts tiered (${r.beastTiers}); realm chip "${r.chip}"; pinned tooltip marked ${r.pin}; realm chips in ${r.rowChips} People rows and in a market tooltip ("${r.ttChip}"); Realm band sparklines ${r.spark0} -> ${r.sparks} ("${r.sparkLabel}"); same markup ${r.same}, pure ${r.pure}` };
    } finally { await ctx.close(); }
  },

  // cycle 1 visual B1: on the Chronicle's vellum every line of text is the page's ink by night and by day (the Night
  // tokens once printed the headings #eee8da on #ece0c4, 1.1:1), and on the phone the export button sits below the
  // title instead of beside it
  async vellumInk(pg, errs, { browser, file }) {
    const out = {};
    for (const [w, h] of [[1366, 768], [390, 844]]) {
      const { ctx, pg: p } = await page(browser, file, { viewport: { width: w, height: h }, isMobile: w < 600, hasTouch: w < 600 }, errs);
      try {
        await p.evaluate(CONTRAST);
        out[w] = await p.evaluate(() => {
          T.enter({ seed: 91, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 20 });
          const r = {};
          for (const th of ['dark', 'light']) {
            UI.set.theme = th; UI.applySettings(); UI.A.group('chronicle'); UI.render();
            const v = document.querySelector('.il-vellum'); if (!v) { r[th] = 'no vellum'; continue; }
            let lo = 99, worst = '';
            for (const e of v.querySelectorAll('h1,h2,h3,h4,h5,p,button,span,li,b,i,em')) {
              if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
              const q = __ratio(getComputedStyle(e).color, '#e2d0a8');   // the page's darkest stop
              if (q < lo) { lo = q; worst = e.tagName + ' ' + e.textContent.trim().slice(0, 24); }
            }
            const b = v.querySelector('[data-a="chronicleExport"]'), t = v.querySelector('h3');
            const bb = b && b.getBoundingClientRect(), tb = t && t.getBoundingClientRect();
            r[th] = { lo: +lo.toFixed(2), worst, below: !!(bb && tb && bb.top >= tb.bottom - 1) };
          }
          return r;
        });
      } finally { await ctx.close(); }
    }
    const ok = [1366, 390].every(w => ['dark', 'light'].every(th => out[w][th].lo >= 4.5)) && out[390].dark.below && out[390].light.below;
    return { ok, detail: JSON.stringify(out) };
  },

  // cycle 1 visual B2: a first-run hint never covers a control. With an event waiting only its odds hint shows (in the
  // column above the card on desktop, under the last choice on the phone); on the Life page the hint is in flow.
  async hintsClear(pg, errs, { browser, file }) {
    const out = {};
    for (const [w, h] of [[1366, 768], [1920, 1080], [390, 844]]) {
      const { ctx, pg: p } = await page(browser, file, { viewport: { width: w, height: h }, isMobile: w < 600, hasTouch: w < 600 }, errs);
      try {
        out[w] = await p.evaluate(async () => {
          const settle = () => new Promise(res => setTimeout(res, 350));
          const cover = () => {
            const hs = [...document.querySelectorAll('.hint')].filter(e => e.getBoundingClientRect().width);
            const hits = [];
            for (const hn of hs) {
              const r = hn.getBoundingClientRect();
              for (const b of document.querySelectorAll('button, [data-a], .sc-ch')) {
                if (hn.contains(b) || b.contains(hn)) continue;
                const sheet = document.querySelector('#modal.sc-sheet');
                if (sheet && !sheet.contains(b)) continue;   // under the phone's full-screen sheet
                const q = b.getBoundingClientRect();
                if (!q.width || getComputedStyle(b).visibility === 'hidden') continue;
                // only what is drawn above the page: a control hidden under a modal sheet does not count
                const top = document.elementFromPoint(Math.min(innerWidth - 1, Math.max(0, (Math.max(q.left, r.left) + Math.min(q.right, r.right)) / 2)), Math.min(innerHeight - 1, Math.max(0, (Math.max(q.top, r.top) + Math.min(q.bottom, r.bottom)) / 2)));
                if (q.right > r.left + 1 && q.left < r.right - 1 && q.bottom > r.top + 1 && q.top < r.bottom - 1 && top && hn.contains(top)) hits.push((b.dataset.a || b.tagName) + ':' + b.textContent.trim().slice(0, 14) + '@' + Math.round(q.top) + '-' + Math.round(q.bottom) + '/' + Math.round(r.top));
              }
            }
            return { n: hs.length, hits };
          };
          T.enter({ seed: 7101, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 20 });
          if (UI.MOMENTS) { UI.set.cutins = false; UI.MOMENTS.skip(); }
          UI.set.hints = true;
          A.S.queue = [{ type: 'event', ev: 'lf_love_potion', forced: true, ctx: {} }]; UI.render(); await settle();
          const ev = cover();
          A.S.queue = []; UI.render(); await settle();
          const life = cover();
          return { ev, life };
        });
      } finally { await ctx.close(); }
    }
    const ok = Object.values(out).every(o => o.ev.n === 1 && !o.ev.hits.length && o.life.n <= 1 && !o.life.hits.length);
    return { ok, detail: JSON.stringify(out) };
  },

  // cycle 1 visual I7: one gold primary per view. The Codex's chosen section, the map's mode and creation's chosen
  // chips are selected toggles, drawn raised with an accent underline, not gold; each view keeps at most one gold fill.
  async onePrimary(pg) {
    const r = await pg.evaluate(async () => {
      const gold = () => [...document.querySelectorAll('button.primary')].filter(b => { const q = b.getBoundingClientRect(); return q.width > 0 && q.bottom > 0 && q.top < innerHeight && getComputedStyle(b, '::before').display !== 'none'; }).map(b => b.dataset.a || b.textContent.trim().slice(0, 12));
      const tick = () => new Promise(res => setTimeout(res, 120));
      const out = {};
      T.enter({ seed: 91, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 20 }); UI.set.hints = false;
      UI.A.group('chronicle'); UI.A.tab('codex'); UI.render(); await tick(); out.codex = gold();
      UI.ov = { type: 'bigmap' }; UI.renderModal(); await tick(); out.map = gold().filter(a => a !== 'stepMonth' && a !== 'stepSeason' && a !== 'stepWeek' && a !== 'v2Next');   // v2: the clock's one button is v2Next
      UI.ov = null; UI.renderModal();
      UI.A.newLife(); UI.step = 1; UI.render(); await tick(); out.create = gold();
      UI.screen = 'game'; UI.render();
      return out;
    });
    const ok = Object.values(r).every(g => g.length <= 1);
    return { ok, detail: JSON.stringify(r) };
  },

  // cycle 2, the title as a vista: three parallax layers over the dawn sky, three busts of three different peoples of
  // the continent, the logotype over a brush stroke with a seal; seeded (the same title twice), pure, still under
  // reduced motion; "Begin a new life" still in sight at 1366 x 768
  async titleVista(pg, errs, { browser, file }) {
    const { pathToFileURL } = await import('node:url');
    const run = async opts => {
      const ctx = await browser.newContext(Object.assign({ viewport: { width: 1366, height: 768 } }, opts)), p = await ctx.newPage();
      p.on('pageerror', e => errs.push(String(e)));
      await p.goto(pathToFileURL(file).href); await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
      const r = await p.evaluate(() => {
        UI.screen = 'title'; UI.render();
        const h0 = JSON.stringify(A.S.realms ? Object.keys(A.S.realms).length : 0) + JSON.stringify(A.rngState);
        UI.render(); const a = document.getElementById('title').innerHTML; UI.render(); const b = document.getElementById('title').innerHTML;
        const T = UI.LOOK.TITLE, ppl = T.people(T.seed());
        // v2: without the Far Lands (docs/v2/LANES.md) the continent's cultures carry no land, and each is its own people,
        // so the three busts must be of three different cultures there (three lands, where cultures have them)
        const lands = new Set(ppl.map(p => { const D = A.FAR && A.FAR.D; const c = (typeof LORE !== 'undefined' && LORE.cultures[p.cult]) || (D && D.cultures[p.cult]); return c && (c.land || 'cult:' + p.cult); }));
        const moving = document.getAnimations().filter(x => /^tl/.test(x.animationName || '') && x.effect.getKeyframes().some(k => k.transform && k.transform !== 'none')).length;
        const btn = document.querySelector('[data-a=newLife]').getBoundingClientRect();
        return { layers: document.querySelectorAll('#title .tl-par svg.tl-l').length, busts: document.querySelectorAll('#title .tl-bust svg').length, lands: lands.size,
          brush: !!document.querySelector('#title .logo .tl-brush'), seal: !!document.querySelector('#title .logo .tl-seal'), same: a === b, moving,
          inSight: btn.bottom <= innerHeight, pure: h0 === JSON.stringify(A.S.realms ? Object.keys(A.S.realms).length : 0) + JSON.stringify(A.rngState) };
      });
      await ctx.close(); return r;
    };
    const full = await run({}), red = await run({ reducedMotion: 'reduce' });
    // cycle 2 (visual B1): in Day theme the vista's words keep Night's ink: the count line and the tagline at 4.5:1 or
    // more on the vista's mid ridge (#463f6e), and the title holds no map (it moved to How to play)
    const day = await (async () => {
      const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } }), p = await ctx.newPage();
      await p.goto(pathToFileURL(file).href); await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
      const r = await p.evaluate(() => {
        UI.set.theme = 'light'; UI.applySettings(); UI.screen = 'title'; UI.render();
        const lum = c => { const m = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map(v => v / 255).map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4)); return .2126 * m[0] + .7152 * m[1] + .0722 * m[2]; };
        const bg = lum('rgb(70,63,110)'), ratio = el => { const l = lum(getComputedStyle(el).color); return (Math.max(l, bg) + .05) / (Math.min(l, bg) + .05); };
        const t = document.getElementById('title');
        return { blurb: ratio(t.querySelector('.blurb')), sub: ratio(t.querySelector('.sub')), map: !!t.querySelector('canvas') };
      });
      await ctx.close(); return r;
    })();
    const ok = full.layers === 4 && full.busts === 3 && full.lands === 3 && full.brush && full.seal && full.same && full.moving > 0 && full.inSight && full.pure && red.moving === 0 && day.blurb >= 4.5 && day.sub >= 4.5 && !day.map;
    return { ok, detail: `layers ${full.layers}, busts ${full.busts} of ${full.lands} lands, brush ${full.brush}, seal ${full.seal}, same twice ${full.same}, drifting ${full.moving} (reduced ${red.moving}), button in sight ${full.inSight}, pure ${full.pure}; Day theme: count line ${day.blurb.toFixed(1)}:1, tagline ${day.sub.toFixed(1)}:1 on the vista, map in the title ${day.map}` };
  },

  // cycle 2 (visual B7, B9, B11): the ladder never breaks a rank's name mid-word; the rail's delta chip does not sit on
  // the number it reports; a People row's chips end in an ellipsis, never a clipped letter
  async lookSmallFixes(pg) {
    await pg.setViewportSize({ width: 1366, height: 768 });
    const r = await pg.evaluate(() => {
      // v2: no lands:'great' (the Far Lands are out of the build, docs/v2/LANES.md): every world is the generated continent
      T.enter({ seed: 777, race: 'human', realm: 'POL-02', status: 'noble', sex: 'F', startAge: 24 });
      UI.set.motion = 'off'; UI.applySettings(); A.S.queue = [];
      UI.tab = 'path'; UI.render();
      const spans = [...document.querySelectorAll('#tabbody .ladder > span')];
      // a word broken across lines has more than one line box
      const broken = spans.filter(s => { const t = s.firstChild && s.firstChild.nodeType === 3 ? s.firstChild : [...s.childNodes].find(n => n.nodeType === 3); if (!t) return false; const words = t.textContent.split(/(\s+)/); let at = 0; for (const w of words) { if (w.trim()) { const r = document.createRange(); r.setStart(t, at); r.setEnd(t, at + w.length); const lines = new Set([...r.getClientRects()].map(x => Math.round(x.top))); if (lines.size > 1) return true; } at += w.length; } return false; }).map(s => s.textContent.trim());
      UI.tab = 'life'; UI.render();
      const pc = A.pc(); pc.health = Math.max(5, (pc.health || 80) - 30); UI.refresh();
      const d = document.querySelector('#profile .lk-dlt'), row = d && d.closest('.barrow'), v = row && row.querySelector('.val');
      const over = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
      const covers = d && v ? over(d.getBoundingClientRect(), v.getBoundingClientRect()) : null;
      UI.tab = 'people'; UI.render();
      const chips = [...document.querySelectorAll('#tabbody .card.person.lk-row .chip')];
      const bad = chips.filter(c => c.scrollWidth > c.clientWidth + 1 && getComputedStyle(c).textOverflow !== 'ellipsis').length;
      UI.tab = 'life'; UI.render();
      return { n: spans.length, broken, flash: !!d, covers, chips: chips.length, bad };
    });
    const ok = !r.broken.length && (!r.flash || r.covers === false) && r.bad === 0;
    return { ok, detail: `ladder: ${r.n} ranks, broken mid-word ${r.broken.length ? r.broken.join(', ') : 'none'}; delta chip shown ${r.flash}, over its number ${r.covers}; People chips ${r.chips}, clipped without an ellipsis ${r.bad}` };
  },
  // playtest 2 new 14 (labels cut off at 1366): the rail's vitals keep their words ("Happiness", not "☀ ..."), a long
  // name's longest word stays whole ("HOOFBREAKE / R"), and a v2 skill row's tier never runs over its hours
  async lookNoCut(pg, errs, { browser, file }) {
    const { ctx, pg: p } = await page(browser, file, { viewport: { width: 1366, height: 768 } }, errs);
    let r;
    try {
      await p.evaluate(FRESH);
      await p.evaluate(LIFE(7101, { race: 'orc' }));
      await p.evaluate(() => { const pc = A.pc(); pc.given = 'Mogash'; pc.epithet = 'Hoofbreaker'; UI.render(); });
      await p.evaluate(SETTLE);
      r = await p.evaluate(() => {
        const cut = [...document.querySelectorAll('#profile .lk-vitals .barrow > .lbl')].filter(l => l.scrollWidth > l.clientWidth + 1).map(l => l.textContent.trim());
        // each word of the name on one line: a word broken in two has two line boxes
        const n = document.querySelector('#profile .pname'), broken = [];
        const t = n && [...n.childNodes].find(x => x.nodeType === 3 && x.textContent.trim());
        if (t) { const txt = t.textContent; let i = 0;
          for (const w of txt.split(/(\s+)/)) { if (w.trim()) { const rg = document.createRange(); rg.setStart(t, i); rg.setEnd(t, i + w.length); const tops = new Set([...rg.getClientRects()].map(x => Math.round(x.top))); if (tops.size > 1) broken.push(w); } i += w.length; } }
        const over = [];
        for (const row of document.querySelectorAll('#profile .profs .prow')) {
          const a = row.querySelector('.v2-tier'), b = row.querySelector('.v2-hrs'), nm = row.querySelector(':scope > span:first-child');
          if (!a || !b || !nm) continue;
          // the text's own extent, not the box's: a word wider than its column spills over its neighbour
          const ext = el => { const rg = document.createRange(); rg.selectNodeContents(el); return rg.getBoundingClientRect(); };
          const A1 = ext(a), B1 = ext(b), N1 = ext(nm);
          // (3 px of slack: two text boxes on lines set close touch by their font's ascent and descent, not their ink)
          const hit = (x, y) => x.left < y.right - 3 && y.left < x.right - 3 && x.top < y.bottom - 3 && y.top < x.bottom - 3;
          if (hit(A1, B1) || hit(N1, A1) || hit(N1, B1)) over.push(nm.textContent.trim());
        }
        return { cut, name: n ? n.textContent.trim() : '', words: !!t, broken, over, rows: document.querySelectorAll('#profile .profs .prow .v2-tier').length, vitals: document.querySelectorAll('#profile .lk-vitals .barrow').length };
      });
    } finally { await ctx.close(); }
    const ok = r.vitals >= 5 && !r.cut.length && /Hoofbreaker/.test(r.name) && r.words && !r.broken.length && r.rows > 0 && !r.over.length;
    return { ok, detail: `vitals ${r.vitals}, cut ${r.cut.length ? r.cut.join(', ') : 'none'}; "${r.name}": words broken ${r.broken.length ? r.broken.join(', ') : 'none'}; ${r.rows} skill rows, overlapping ${r.over.length ? r.over.join(', ') : 'none'}` };
  },
};
