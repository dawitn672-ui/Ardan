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
  // §1.6 for 153 realms: the Great Continent's 118 get accents that stand apart from the realms they border, the Known
  // World's 35 keep their own colour, every one has an AA ink in both themes, and the palette is the same every time
  async realmColours(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 7101, lands: 'great', race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 20 });
      UI.screen = 'game'; UI.render();
      const D = A.FL_DATA, P = D.provinces, owner = new Map();
      for (let i = 0; i < P.id.length; i++) owner.set(P.id[i], P.realm[i]);
      const RL = Array.isArray(D.realms) ? D.realms : Object.entries(D.realms), far = RL.map(x => x[0]);
      const loreCol = new Map(RL.map(([id, x]) => [id, String(x.color).toLowerCase()]));   // the lore's colours, before the accents
      const lin = c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      const lab = h => { const [r, g, b] = [1, 3, 5].map(i => lin(parseInt(h.slice(i, i + 2), 16) / 255)); const l = Math.cbrt(0.4122 * r + 0.5363 * g + 0.0514 * b), m = Math.cbrt(0.2119 * r + 0.6807 * g + 0.1074 * b), s = Math.cbrt(0.0883 * r + 0.2817 * g + 0.6300 * b); return [0.2105 * l + 0.7936 * m - 0.0041 * s, 1.9780 * l - 2.4286 * m + 0.4506 * s, 0.0259 * l + 0.7828 * m - 0.8087 * s]; };
      const dist = (a, b) => { const p = lab(a), q = lab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
      const pairs = new Set();
      for (let i = 0; i < P.id.length; i++) for (const j of P.adj[i] || []) { const a = P.realm[i], b = owner.get(j); if (a && b && a !== b && a !== 'unclaimed' && b !== 'unclaimed' && far.includes(a) && far.includes(b)) pairs.add(a < b ? a + '|' + b : b + '|' + a); }
      const dNew = [], dOld = [];
      for (const k of pairs) { const [a, b] = k.split('|'); dNew.push(dist(UI.realmHex(a), UI.realmHex(b))); dOld.push(dist(loreCol.get(a), loreCol.get(b))); }
      dNew.sort((x, y) => x - y); dOld.sort((x, y) => x - y);
      const med = a => a[Math.floor(a.length / 2)];
      const known = Object.values(A.S.realms).filter(x => !far.includes(x.id) && /^POL-\d+$/.test(x.id) && +x.id.slice(4) <= 35);
      const keep = known.every(x => UI.realmHex(x) === x.color.toLowerCase());
      let inkOk = 0, n = 0;
      for (const id of far) for (const th of ['dark', 'light']) { n++; const k = UI.realmInk(UI.realmHex(id), th), T = UI.LOOK.THEMES[th]; if (Math.min(UI.LOOK.contrast(k.ink, T['--surface']), UI.LOOK.contrast(k.ink, T['--raised'])) >= 4.5) inkOk++; }
      const distinct = new Set(far.map(id => UI.realmHex(id))).size;
      const h0 = T.hash(A.S);
      const again = far.every(id => UI.realmHex(id) === UI.realmHex(A.S.realms[id]));
      return { pairs: pairs.size, minNew: dNew[0], medNew: med(dNew), minOld: dOld[0], medOld: med(dOld), close: dNew.filter(d => d < 0.04).length, closeOld: dOld.filter(d => d < 0.04).length,
        keep, known: known.length, inkOk, n, distinct, far: far.length, pure: T.hash(A.S) === h0, again };
    });
    const f = x => x.toFixed(3);
    const ok = r.keep && r.inkOk === r.n && r.distinct >= r.far - 4 && r.medNew > r.medOld && r.close < r.closeOld && r.pure && r.again;
    return { ok, detail: `${r.far} far realms, ${r.distinct} distinct colours; ${r.pairs} bordering pairs: OKLab distance median ${f(r.medOld)} -> ${f(r.medNew)}, least ${f(r.minOld)} -> ${f(r.minNew)}, pairs under 0.04 ${r.closeOld} -> ${r.close}; ` +
      `the Known World's ${r.known} unchanged ${r.keep}; AA ink ${r.inkOk}/${r.n}; pure ${r.pure}, stable ${r.again}` };
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
        UI.tab = 'war'; UI.render();
        const st = [...document.querySelectorAll('#tabbody .lk-str')];
        out.wars = st.length; out.warLabel = st[0] && st[0].getAttribute('aria-label');
        // the delta flash: the first draw shows none; a change shows it on that row
        UI.tab = 'life'; UI.render();
        out.flash0 = document.querySelectorAll('#profile .lk-dlt').length;
        UI.render(); out.flash1 = document.querySelectorAll('#profile .lk-dlt').length;
        pc.health = Math.max(1, pc.health - 10); UI.render();
        const d = document.querySelector('#profile .lk-v-health .lk-dlt');
        out.flash = d ? d.textContent : null;
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
      const ok = r.wars >= 1 && /^Strength: us .+ against them .+/.test(r.warLabel || '') && r.flash0 === 0 && r.flash1 === 0 && r.flash === '▼ −10' && r.gone && r.beasts >= 10 && r.beastTiers.split(',').length >= 3 && !!r.chip && r.pin && r.rowChips >= 3 && r.ttChip && !/^(none|no popover)$/.test(r.ttChip) && r.spark0 === 0 && r.sparks === 4 && /^Treasury since \d+: /.test(r.sparkLabel || '') && r.same && r.pure;
      return { ok, detail: `war strength bars ${r.wars} ("${r.warLabel}"); delta flash: none on the first draws (${r.flash0}, ${r.flash1}), "${r.flash}" after a wound, gone after 1.6 s ${r.gone}; ${r.beasts} beasts tiered (${r.beastTiers}); realm chip "${r.chip}"; pinned tooltip marked ${r.pin}; realm chips in ${r.rowChips} People rows and in a market tooltip ("${r.ttChip}"); Realm band sparklines ${r.spark0} -> ${r.sparks} ("${r.sparkLabel}"); same markup ${r.same}, pure ${r.pure}` };
    } finally { await ctx.close(); }
  },
};
