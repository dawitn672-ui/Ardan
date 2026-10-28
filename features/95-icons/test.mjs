// The icon set: the brief's forty or so on a 24 grid in currentColor, legible at 16 px and unlike each other, wired into
// the stats, vitals, purse, clock, groups, tabs and controls with a word beside each, pure to draw, and axe-clean.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const dropFontCsp = errs => { for (let i = errs.length - 1; i >= 0; i--) if (/fonts\.googleapis\.com/.test(errs[i])) errs.splice(i, 1); };
const LIFE = `(() => { A.newGame({ seed: 9501, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 24 }); UI.screen = 'game'; UI.ov = null; UI.tab = 'life'; UI.set.hints = false; A.S.queue = []; UI.render(); })()`;

export default {
  // every icon the brief lists is in the registry, with a word; each parses on the 24 grid, stays inside it, uses only
  // currentColor, has at most one filled shape, and the whole set is small
  async iconSet(pg) {
    const r = await pg.evaluate(() => {
      const IS = UI.ICONSET, names = Object.keys(IS), bad = [];
      const want = { stat: 6, vital: 6, resource: 3, group: 13, tab: 6, ui: 12 }, have = {};
      for (const n of names) { have[IS[n].group] = (have[IS[n].group] || 0) + 1; for (const [, g] of IS[n].also || []) have[g] = (have[g] || 0) + 1; }
      const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;color:#000'; document.body.appendChild(host);
      let total = 0, big = 0;
      for (const n of names) {
        const s = IS[n].svg; total += s.length; big = Math.max(big, s.length);
        if (!IS[n].label) bad.push(n + ' no label');
        const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${s}</svg>`, 'image/svg+xml');
        if (doc.querySelector('parsererror')) { bad.push(n + ' parse'); continue; }
        if (/#[0-9a-f]{3,6}\b|rgb\(/i.test(s)) bad.push(n + ' hard colour');
        if ((s.match(/fill="(?!currentColor|none)[^"]*"|stroke="(?!currentColor|none)[^"]*"/g) || []).length) bad.push(n + ' paint');
        if ((s.match(/fill="currentColor"/g) || []).length > 1) bad.push(n + ' two fills');
        host.innerHTML = `<svg class="ic" viewBox="0 0 24 24" style="width:24px;height:24px">${s}</svg>`;
        const b = host.firstChild.getBBox();
        if (b.x < -0.3 || b.y < -0.3 || b.x + b.width > 24.3 || b.y + b.height > 24.3) bad.push(`${n} off the grid (${b.x.toFixed(1)},${b.y.toFixed(1)} ${b.width.toFixed(1)}x${b.height.toFixed(1)})`);
      }
      host.remove();
      const short = Object.entries(want).filter(([g, k]) => (have[g] || 0) < k).map(([g, k]) => `${g} ${have[g] || 0}/${k}`);
      const css = getComputedStyle(Object.assign(document.createElement('div'), {})); // keep
      const ic = document.createElement('div'); ic.innerHTML = UI.icon('fist', 's'); document.body.appendChild(ic);
      const cs = getComputedStyle(ic.firstChild), stroke = { w: cs.strokeWidth, cap: cs.strokeLinecap, join: cs.strokeLinejoin, fill: cs.fill };
      ic.remove();
      return { n: names.length, have, short, bad, total, big, stroke };
    });
    const ok = r.n >= 40 && !r.short.length && !r.bad.length && r.total <= 20 * 1024 && r.big <= 1100 && r.stroke.cap === 'round' && r.stroke.join === 'round';
    return { ok, detail: `${r.n} icons (stats ${r.have.stat}, vitals ${r.have.vital}, purse and clock ${r.have.resource}, groups ${r.have.group}, tabs ${r.have.tab}, controls ${r.have.ui}); ${(r.total / 1024).toFixed(1)} KB in all, the largest ${r.big} B; drawn with stroke ${r.stroke.w}, ${r.stroke.cap} caps, ${r.stroke.join} joins` +
      `${r.short.length ? '; MISSING ' + r.short.join(', ') : ''}${r.bad.length ? '; BAD ' + r.bad.slice(0, 6).join(', ') : ''}` };
  },

  // legible at 16 px: rasterized, each icon inks between 8% (3% for a one-stroke control) and 45% of its box (not a blot, not a ghost), and no two
  // differ by fewer than 14 of its 256 pixels, except the sun of Life and Happiness, which the brief gives one subject
  async iconLegible(pg) {
    const r = await pg.evaluate(async () => {
      const IS = UI.ICONSET, names = Object.keys(IS), N = 16, maps = {}, ink = {};
      const cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d', { willReadFrequently: true });
      for (const n of names) {
        const src = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${N}" height="${N}" fill="none" stroke="#000" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" color="#000">${IS[n].svg}</svg>`;
        const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src);
        await img.decode();
        g.clearRect(0, 0, N, N); g.drawImage(img, 0, 0, N, N);
        const d = g.getImageData(0, 0, N, N).data, bits = [];
        for (let i = 3; i < d.length; i += 4) bits.push(d[i] > 110 ? 1 : 0);
        maps[n] = bits; ink[n] = bits.reduce((a, x) => a + x, 0) / (N * N);
      }
      // a control is one stroke (a chevron, a cross, a tick), so its floor is lower
      const faint = names.filter(n => ink[n] < (IS[n].group === 'ui' ? 0.03 : 0.08)), blot = names.filter(n => ink[n] > 0.45);
      const pairs = [];
      for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
        const a = maps[names[i]], b = maps[names[j]]; let d = 0; for (let k = 0; k < a.length; k++) d += a[k] !== b[k];
        pairs.push([d, names[i] + '~' + names[j]]);
      }
      pairs.sort((a, b) => a[0] - b[0]);
      const close = pairs.filter(([d, p]) => d < 14 && p !== 'joy~sun' && p !== 'sun~joy');
      const lo = Math.min(...Object.values(ink)), hi = Math.max(...Object.values(ink));
      return { faint, blot, close: close.map(x => x.join(' ')), nearest: pairs.slice(0, 3).map(x => x[1] + ' ' + x[0]), lo, hi };
    });
    const ok = !r.faint.length && !r.blot.length && !r.close.length;
    return { ok, detail: `at 16 px the icons ink ${(100 * r.lo).toFixed(0)}-${(100 * r.hi).toFixed(0)}% of their box${r.faint.length ? '; FAINT ' + r.faint.join(', ') : ''}${r.blot.length ? '; BLOTS ' + r.blot.join(', ') : ''}; nearest pairs ${r.nearest.join(', ')}${r.close.length ? '; TOO CLOSE ' + r.close.join(', ') : ''}` };
  },

  // on the Life screen the icons stand where the brief puts them, each with its word beside it or as its button's name,
  // and the stat, vital, purse and clock tooltips open with the icon and the word together
  async iconsWired(pg) {
    await pg.evaluate(LIFE);
    const r = await pg.evaluate(() => {
      // each icon as the browser writes it back, so drawn markup can be matched to its name
      const IS = UI.ICONSET, tmp = document.createElement('div');
      const mine = new Map(Object.keys(IS).map(n => { tmp.innerHTML = `<svg viewBox="0 0 24 24">${IS[n].svg}</svg>`; return [tmp.firstChild.innerHTML, n]; }));
      const which = el => mine.get(el.innerHTML) || null;
      const found = { tab: [], top: [], vital: [], stat: [], group: [] }, unlabelled = [];
      for (const b of document.querySelectorAll('#tabs [role=tab]')) { const s = b.querySelector('svg'); if (s && which(s)) found.tab.push(which(s)); }
      for (const s of document.querySelectorAll('#topbar svg')) if (which(s)) found.top.push(which(s));
      for (const s of document.querySelectorAll('#profile .barrow svg')) { const n = which(s); if (!n) continue; (IS[n].group === 'stat' ? found.stat : found.vital).push(n); }
      for (const s of document.querySelectorAll('#tabbody .act svg, #tabbody .group-h svg')) { const n = which(s); if (n && (IS[n].group === 'group' || (IS[n].also || []).some(x => x[1] === 'group'))) found.group.push(n); }
      // the word: the icon's own row, button or label has text or a name
      for (const s of document.querySelectorAll('#app svg.ic')) {
        if (!which(s)) continue;
        const host = s.closest('button, [role=button], .barrow, .group-h, .chip, label, a, .top-home, .clk-ini, .clk-date, .top-coin, .act') || s.parentElement;
        const word = (host.textContent || '').trim() || host.getAttribute('aria-label') || host.getAttribute('title');
        if (!word) unlabelled.push(which(s) + ' in ' + host.tagName.toLowerCase() + '.' + host.className);
      }
      // a debt shows the broken coin
      const pc = A.pc(); pc.debt = 120; UI.render();
      const debt = [...document.querySelectorAll('#topbar svg')].some(s => which(s) === 'broken-coin');
      pc.debt = 0; UI.render();
      const tips = ['stat:str', 'stat:wil', 'health:', 'piety:', 'coin:', 'initiative:'].map(k => { const [a, b] = k.split(':'); const h = UI.TT ? UI.TT.html(a, b) : ''; return [k, /<div class="tip-h"><svg class="ic s ico-tip"/.test(h)]; });
      const uniq = a => [...new Set(a)];
      return { tab: uniq(found.tab), top: uniq(found.top), vital: uniq(found.vital), stat: uniq(found.stat), group: uniq(found.group), unlabelled: uniq(unlabelled), debt, tips, look: !!UI.LOOK };
    });
    const tipsOk = !r.tips.length || r.tips.every(x => x[1]);
    const ok = r.tab.length === 6 && r.top.length >= 7 && r.vital.length === 6 && r.stat.length === 6 && r.group.length >= 9 && !r.unlabelled.length && r.debt && tipsOk;
    return { ok, detail: `tabs ${r.tab.join(' ')}; top bar ${r.top.join(' ')}; vitals ${r.vital.join(' ')}; stats ${r.stat.join(' ')}${r.look ? ' (91-look\'s tiles)' : ''}; groups ${r.group.length} (${r.group.join(' ')}); debt shows the broken coin ${r.debt}; ` +
      `tooltips open with the icon ${r.tips.filter(x => x[1]).length}/${r.tips.length}${r.unlabelled.length ? '; WITHOUT A WORD ' + r.unlabelled.slice(0, 5).join(', ') : '; every icon has its word'}` };
  },

  // drawing every tab and the menu with the new icons changes neither the state nor the random stream, and twice gives
  // the same markup
  async iconsPure(pg) {
    await pg.evaluate(LIFE);
    const r = await pg.evaluate(() => {
      const tabs = UI.GROUPS.flatMap(g => g.subs.map(s => s[0]));
      for (const t of tabs) { UI.tab = t; UI.render(); }
      const s0 = JSON.stringify(A.S), r0 = JSON.stringify(A.rngState), out = [];
      for (const pass of [0, 1]) { const L = []; for (const t of tabs) { UI.tab = t; UI.render(); L.push(document.querySelector('#app').innerHTML.length); } UI.ov = { type: 'menu' }; UI.render(); L.push(document.body.innerHTML.length); UI.ov = null; out.push(L); }
      UI.tab = 'life'; UI.render();
      return { pure: JSON.stringify(A.S) === s0 && JSON.stringify(A.rngState) === r0, same: out[0].join() === out[1].join(), n: out[0].length };
    });
    return { ok: r.pure && r.same, detail: `${r.n} screens drawn twice: state and random stream unchanged ${r.pure}; the same markup both times ${r.same}` };
  },

  // 0 axe violations (WCAG 2.2 AA) on the Life screen with the icons, in both themes
  async iconsAxe(pg, errs) {
    await pg.evaluate(fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'));
    const found = [];
    for (const theme of ['dark', 'light']) {
      await pg.evaluate(LIFE);
      await pg.evaluate(t => { UI.set.theme = t; UI.applySettings && UI.applySettings(); UI.render(); }, theme);
      const v = await pg.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })).violations.map(v => `${v.id}(${v.nodes.map(n => n.target.join(' ')).slice(0, 2).join(';')})`));
      found.push(...v.map(x => theme + ':' + x));
    }
    dropFontCsp(errs);
    return { ok: !found.length, detail: `${found.length} axe violations on the Life screen with the icons, dark and light${found.length ? ': ' + found.slice(0, 6).join(', ') : ''}` };
  },

  // cycle 2 (things.core.js): every one of the Life tab's actions and every market good has its own icon, each a
  // valid drawing on the 24 grid in currentColor with at most one fill; the tiles and the market's rows show them
  async iconThings(pg) {
    const r = await pg.evaluate(() => {
      const acts = Object.keys(GD.ACTIVITIES), goods = Object.keys(GD.GOODS || {});
      const bad = [], miss = [];
      const check = (k, s) => {
        if (!s) { miss.push(k); return; }
        const d = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${s}</svg>`, 'image/svg+xml');
        if (d.querySelector('parsererror')) bad.push(k + ' parse');
        if ((s.match(/fill="(?!currentColor|none)[^"]*"|stroke="(?!currentColor|none)[^"]*"/g) || []).length) bad.push(k + ' paint');
        if ((s.match(/fill="currentColor"/g) || []).length > 1) bad.push(k + ' fills');
      };
      for (const k of acts) check(k, UI.ICONS_ACT[k]);
      for (const k of goods) check(k, UI.ICONS_GOOD[k]);
      const distinct = new Set([...acts.map(k => UI.ICONS_ACT[k]), ...goods.map(k => UI.ICONS_GOOD[k])]).size;
      T.enter({ seed: 951, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
      const tiles = [...document.querySelectorAll('#tabbody .lk-acts > .act[data-v]')], own = tiles.filter(t => t.querySelector('.lk-gi[data-own]')).length;
      UI.A.group('holdings'); UI.render();
      const rows = document.querySelectorAll('#tabbody .ic-good').length, buys = document.querySelectorAll('#tabbody button[data-a="mktBuy"]').length;
      UI.A.group('life');
      const bytes = Object.values(UI.ICONS_ACT).join('').length + Object.values(UI.ICONS_GOOD).join('').length;
      return { acts: acts.length, goods: goods.length, miss, bad, distinct, tiles: tiles.length, own, rows, buys, bytes };
    });
    const ok = !r.miss.length && !r.bad.length && r.distinct === r.acts + r.goods && r.tiles > 0 && r.own === r.tiles && (r.buys === 0 || r.rows > 0) && r.bytes <= 20 * 1024;
    return { ok, detail: `${r.acts} actions and ${r.goods} goods, ${r.distinct} distinct icons (${(r.bytes / 1024).toFixed(1)} KB)${r.miss.length ? '; MISSING ' + r.miss.join(',') : ''}${r.bad.length ? '; BAD ' + r.bad.join(',') : ''}; tiles with their own icon ${r.own} of ${r.tiles}; market rows with a good's icon ${r.rows} (buy buttons ${r.buys})` };
  },
};
