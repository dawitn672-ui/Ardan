// 90-fold: sections fold, the folds are remembered, the screen is shorter, and nothing about the game changes.
// (The Life tab's activities were an accordion of groups; since 91-look they are one section, one grid of tiles.)
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
      out.look = !!UI.LOOK;
      return out;
    }, START.toString());
    const shorter = Object.keys(r.on).filter(k => r.on[k] < r.off[k] - 0.2);
    // with 91-look's layout in the build the Life panel and the profile fit (only the story scrolls); without it, 3.2 and 1.7
    const [life, prof, hold] = r.look ? [1.05, 1.05, 3.2] : [3.2, 1.7, 4.5];
    const ok = r.on.life <= life && r.on.holdings <= hold && r.on.realm <= 1.6 && r.on.profile <= prof && shorter.length >= 4;
    return { ok, detail: `screens of scroll at 1366x768${r.look ? ' (91-look in the build)' : ''}, folds off → on: ${Object.keys(r.on).map(k => `${k} ${r.off[k]} → ${r.on[k]}`).join(', ')}` };
  },
  async foldToggles(pg) {
    const r = await pg.evaluate(async start => {
      eval(start)();
      // the Life tab's activities are one section (one grid of tiles), open by default; Your days folds to its summary
      const acts = [...document.querySelectorAll('#tabbody .fold-acts > .fold-head > .fold-h')];
      const a = acts[0], key = a && a.dataset.v, sec = a && a.closest('.fold');
      const open0 = a && a.getAttribute('aria-expanded') === 'true';
      const ctl = a && document.getElementById(a.getAttribute('aria-controls')) === sec.querySelector(':scope > .fold-b');
      const yd = document.querySelector('#tabbody .plan-card > .fold-x'), yd0 = yd && yd.getAttribute('aria-expanded');
      const ydSum = yd && yd.nextElementSibling && /\S/.test(yd.nextElementSibling.textContent);
      a.click();
      const closed = sec.querySelector(':scope > .fold-b').hidden && a.getAttribute('aria-expanded') === 'false' && !!sec.querySelector(':scope > .fold-head > .fold-sum');
      const stored = JSON.parse(localStorage.getItem(UI.FOLD.KEY) || '{}')['life|' + key] === false;
      // a fresh draw keeps the choice
      UI.render();
      const kept = [...document.querySelectorAll('#tabbody .fold-h')].find(h => h.dataset.v === key).getAttribute('aria-expanded') === 'false';
      document.querySelector('#tabbody .fold-acts > .fold-head > .fold-h').click();
      const back = document.querySelector('#tabbody .fold-acts > .fold-head > .fold-h').getAttribute('aria-expanded') === 'true';
      // a tall card's corner button
      document.querySelector('[data-a="group"][data-v="holdings"]').click(); await new Promise(res => setTimeout(res, 40));
      const x = document.querySelector('#tabbody .fold-card > .fold-x'), card = x && x.closest('.fold-card');
      const was = card && card.classList.contains('folded'); if (x) x.click();
      const cardFlip = !!card && card.classList.contains('folded') !== was;
      // open all, and back
      document.querySelector('[data-a="foldAll"]').click();
      const allOpen = [...document.querySelectorAll('#tabbody .fold-h')].every(h => h.getAttribute('aria-expanded') === 'true');
      document.querySelector('[data-a="foldAll"]').click();
      return { sections: acts.length, open0, ctl, yd0, ydSum, closed, stored, kept, back, cardFlip, allOpen, again: !UI.FOLD.allOpen };
    }, START.toString());
    const ok = r.sections === 1 && r.open0 && r.ctl && r.yd0 === 'false' && r.ydSum && r.closed && r.stored && r.kept && r.back && r.cardFlip && r.allOpen && r.again;
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
