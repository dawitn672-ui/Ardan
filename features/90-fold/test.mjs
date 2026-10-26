// 90-fold: sections fold, the folds are remembered, the screen is shorter, and nothing about the game changes.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const START = () => {
  try { localStorage.removeItem(UI.FOLD.KEY); } catch (e) {}
  UI.FOLD.state = {}; UI.FOLD.allOpen = false; UI.FOLD.OFF = false;
  A.newGame({ seed: 77, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
  UI.screen = 'game'; UI.set.hints = false; A.S.queue = []; UI.ov = null; UI.tab = 'life'; UI.render();
};
export default {
  async foldFits(pg) {
    await pg.setViewportSize({ width: 1366, height: 768 });
    const r = await pg.evaluate(async start => {
      eval(start)();
      const screens = el => el ? +(el.scrollHeight / el.clientHeight).toFixed(2) : 0;
      const out = {};
      for (const off of [true, false]) {
        UI.FOLD.OFF = off;
        const row = {};
        for (const g of ['life', 'pathwar', 'holdings', 'realm']) {
          document.querySelector(`[data-a="group"][data-v="${g}"]`).click();
          await new Promise(res => setTimeout(res, 40));
          row[g] = screens(document.getElementById('tabbody'));
        }
        UI.render(); row.profile = screens(document.getElementById('profile'));
        out[off ? 'off' : 'on'] = row;
      }
      UI.FOLD.OFF = false;
      return out;
    }, START.toString());
    const shorter = Object.keys(r.on).filter(k => r.on[k] < r.off[k] - 0.2);
    const ok = r.on.life <= 3.2 && r.on.holdings <= 4.5 && r.on.realm <= 1.6 && r.on.profile <= 1.7 && shorter.length >= 4;
    return { ok, detail: `screens of scroll at 1366x768, folds off → on: ${Object.keys(r.on).map(k => `${k} ${r.off[k]} → ${r.on[k]}`).join(', ')}` };
  },
  async foldToggles(pg) {
    const r = await pg.evaluate(async start => {
      eval(start)();
      const head = () => [...document.querySelectorAll('#tabbody .fold-acts > .fold-head > .fold-h')];
      const hs = head();
      const closed0 = hs.filter(h => h.getAttribute('aria-expanded') === 'false').length;
      const a = hs.find(h => h.getAttribute('aria-expanded') === 'false'), key = a && a.dataset.v;
      a.click();
      const sec = a.closest('.fold'), opened = !sec.querySelector(':scope > .fold-b').hidden && a.getAttribute('aria-expanded') === 'true';
      const openActs = document.querySelectorAll('#tabbody .fold-acts.open').length;
      const stored = JSON.parse(localStorage.getItem(UI.FOLD.KEY) || '{}')['life|' + key] === true;
      // a fresh draw keeps the choice
      UI.render();
      const kept = [...document.querySelectorAll('#tabbody .fold-h')].find(h => h.dataset.v === key).getAttribute('aria-expanded') === 'true';
      // a tall card's corner button
      document.querySelector('[data-a="group"][data-v="holdings"]').click(); await new Promise(res => setTimeout(res, 40));
      const x = document.querySelector('#tabbody .fold-card > .fold-x'), card = x && x.closest('.fold-card');
      const was = card && card.classList.contains('folded'); if (x) x.click();
      const cardFlip = !!card && card.classList.contains('folded') !== was;
      // open all, and back
      document.querySelector('[data-a="foldAll"]').click();
      const allOpen = [...document.querySelectorAll('#tabbody .fold-h')].every(h => h.getAttribute('aria-expanded') === 'true');
      document.querySelector('[data-a="foldAll"]').click();
      return { n: hs.length, closed0, opened, openActs, stored, kept, cardFlip, allOpen, back: !UI.FOLD.allOpen };
    }, START.toString());
    const ok = r.n >= 4 && r.closed0 >= 3 && r.opened && r.openActs === 1 && r.stored && r.kept && r.cardFlip && r.allOpen && r.back;
    return { ok, detail: JSON.stringify(r) };
  },
  async foldPure(pg) {
    const r = await pg.evaluate(async start => {
      eval(start)();
      const s0 = JSON.stringify(A.S), g0 = JSON.stringify(A.rngState);
      for (const g of ['life', 'people', 'pathwar', 'holdings', 'realm', 'chronicle']) {
        document.querySelector(`[data-a="group"][data-v="${g}"]`).click();
        await new Promise(res => setTimeout(res, 30));
        for (const h of [...document.querySelectorAll('#tabbody [data-a="fold"]')].slice(0, 4)) h.click();
      }
      return { same: JSON.stringify(A.S) === s0, rng: JSON.stringify(A.rngState) === g0 };
    }, START.toString());
    return { ok: r.same && r.rng, detail: `state unchanged ${r.same}, random stream unchanged ${r.rng}` };
  },
  async foldAxe(pg, errs) {
    await pg.evaluate(fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'));
    const found = [];
    await pg.evaluate(start => eval(start)(), START.toString());
    for (const g of ['life', 'holdings', 'realm']) {
      await pg.evaluate(g => document.querySelector(`[data-a="group"][data-v="${g}"]`).click(), g);
      const v = await pg.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } })).violations.map(v => `${v.id}(${v.nodes.length})`));
      found.push(...v.map(x => g + ':' + x));
    }
    for (let i = errs.length - 1; i >= 0; i--) if (/Refused to connect to 'https:\/\/fonts\.googleapis\.com/.test(errs[i])) errs.splice(i, 1);
    return { ok: !found.length, detail: `${found.length} axe violations on the folded Life, Holdings and Realm tabs${found.length ? ': ' + found.join(', ') : ''}` };
  },
};
