// The ten key tasks (Road to Ten, UI and UX 8), played by a bot on a desktop and on a phone. The bot taps (or clicks)
// what a player would and scrolls only when the next thing is out of sight, the least it must; it counts both.
//
// Cost, a proxy for time: one tap is 1, and scrolling one screen-height is 1 (a flick moves about a screen). A task's
// phone/desktop ratio is its phone cost over its desktop cost. The plan's bar is 1.5.
import { LIFE, SETTLE, openPage, DEVICES } from './screens.mjs';

const RESET = `UI.lastSub = {}; UI.worldView = 'map'; UI.ov = null; A.S.queue = []; try { UI.TT && UI.TT.closeAll(); } catch (e) {}`;
const ON = (tab) => `(() => { ${RESET} UI.tab = ${JSON.stringify(tab)}; UI.render(); window.scrollTo(0, 0); })()`;

export const TASKS = [
  { name: 'start a life', setup: `(() => { ${RESET} SAVES.listCache = []; UI.screen = 'title'; UI.render(); window.scrollTo(0, 0); })()`,
    steps: [{ tap: '[data-a=newLife]' }, { tap: '[data-a=randomizeCr]' }, { tap: '[data-a=crStep][data-v="3"]' }, { tap: '[data-a=startLife]' }],
    done: `UI.screen === 'game' && !!A.pc()` },
  { name: 'read and answer an event', setup: 'EVENT',
    steps: [{ see: '#modal .mtext', whole: true }, { tap: '#modal [data-a=evChoose]' },
      // the outcome, when the choice ends in words (one may open a fight or a hunt instead)
      { see: '#modal .mtext', whole: true, optional: true }, { tap: '#modal [data-a=evClose]', optional: true }],
    done: `!document.querySelector('#modal [data-a=evClose]')` },
  { name: 'find your health\'s breakdown', setup: ON('life'),
    steps: [{ tap: '#sub-you', only: 'phone', unless: '.ph-you' }, { tap: '#profile [data-tt=health], .ph-you [data-tt=health], .phone-profile [data-tt=health]' }],
    done: `!!(UI.TT && UI.TT.stack.length && /Health/.test(UI.TT.stack[0].el.textContent))` },
  { name: 'open a person and talk', setup: ON('life'),
    steps: [{ tap: '[data-a=group][data-v=people]' }, { tap: '#tabbody .card[data-a=ov][data-v^="person:"]' }, { tap: '#modal [data-a=int][data-v$="|talk"]' }],
    done: `true` },
  { name: 'train a skill', setup: ON('life'),
    steps: [{ select: '#tabbody select[aria-label="Training focus"]', index: 2 }],
    done: `true` },
  { name: 'save', setup: ON('life'), steps: [{ tap: '[data-a=save]' }], done: `true` },
  { name: 'check the market', setup: ON('life'),
    steps: [{ tap: '[data-a=group][data-v=holdings]' }, { tap: '.ph-jump [data-a=phJump]', text: 'Market', only: 'phone', optional: true }, { see: '#tabbody .mkt-t' }],
    done: `!!document.querySelector('.mkt-t')` },
  { name: 'find your realm\'s ruler', setup: ON('life'),
    steps: [{ tap: '[data-a=group][data-v=realm]' }, { see: '#tabbody .card.person' }],
    done: `!!document.querySelector('#tabbody .card.person')` },
  { name: 'open the map and find your home', setup: ON('life'),
    steps: [{ tap: '[data-a=group][data-v=chronicle]' }, { tap: '#sub-world' }, { tap: '[data-a=ov][data-v=bigmap]' }, { tap: '[data-a=gmZoom][data-v=home]' }],
    done: `!!document.querySelector('#gmap')` },
  { name: 'read the chronicle', setup: ON('life'),
    steps: [{ tap: '[data-a=group][data-v=chronicle]' }, { tap: '#sub-book' }, { see: 'section.chron-life' }],
    done: `!!document.querySelector('section.chron-life')` },
];

// an event the world offers, queued and open on the Life tab
export const EVENT = `(() => { ${RESET} const pc = A.pc(); UI.tab = 'life';
  for (let g = 0; g < 80; g++) { A.advance(30); const h = A.S.queue[0]; if (h && h.type === 'event') { const v = A.eventView(h); if (v && v.choices && v.choices.length >= 2) { A.S.queue = [h]; break; } } A.S.queue = []; if (!pc.alive) { pc.alive = true; pc.health = 80; } }
  UI.render(); window.scrollTo(0, 0); })()`;

// in the page: mark the first visible match of sel (and text) as the bot's target; null if none
const FIND = ([sel, text]) => {
  for (const e of document.querySelectorAll('[data-ph-bot]')) e.removeAttribute('data-ph-bot');
  const vis = e => { const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; for (let a = e; a && a.nodeType === 1; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.display === 'none' || cs.visibility === 'hidden') return false; } return true; };
  const el = [...document.querySelectorAll(sel)].find(e => vis(e) && (!text || e.textContent.includes(text)));
  if (!el) return false;
  el.setAttribute('data-ph-bot', '1');
  return true;
};
// in the page: scroll the least that brings the target into the clear band (the screen less the fixed bars over it);
// returns the pixels scrolled
const REVEAL = ([whole]) => {
  const el = document.querySelector('[data-ph-bot]'); if (!el) return 0;
  let moved = 0;
  const scrollers = [];
  for (let a = el.parentElement; a; a = a.parentElement) {
    if (a === document.body || a === document.documentElement) break;
    const cs = getComputedStyle(a);
    if (/auto|scroll/.test(cs.overflowY) && a.scrollHeight > a.clientHeight + 1) scrollers.push(a);
  }
  scrollers.push(document.scrollingElement);
  for (const sc of scrollers) {
    for (let k = 0; k < 3; k++) {
      let top = 0, bottom = innerHeight;
      if (sc !== document.scrollingElement) { const sr = sc.getBoundingClientRect(); top = Math.max(top, sr.top); bottom = Math.min(bottom, sr.bottom); }
      // fixed and sticky bars cover the page (not a target inside them, and not a modal, which covers them)
      for (const b of document.querySelectorAll('#topbar, .ph-dock, #bnav, #modal.ph-pin .mbox > .choices')) {
        if (b.contains(el)) continue;
        if (el.closest('#modal') && !b.closest('#modal')) continue;
        const cs = getComputedStyle(b); if (!/fixed|sticky/.test(cs.position)) continue;
        const br = b.getBoundingClientRect(); if (br.height < 1) continue;
        if (br.top <= top + 1 && br.bottom > top) top = br.bottom; else if (br.bottom >= bottom - 1 && br.top < bottom) bottom = br.top;
      }
      const r = el.getBoundingClientRect();
      const band = bottom - top, need = whole ? Math.min(r.height, band) : Math.min(r.height, Math.min(240, band));
      let d = 0;
      if (r.top < top) d = r.top - top; else if (r.top + need > bottom) d = r.top + need - bottom;
      if (Math.abs(d) < 1) return moved;
      const b0 = sc.scrollTop; sc.scrollTop = b0 + d; const got = sc.scrollTop - b0;
      moved += Math.abs(got);
      if (Math.abs(got) < 1) break;
    }
  }
  return moved;
};

// play one task on a page that is already set up; returns { taps, scroll, cost, ok }
export async function playTask(pg, task, { touch, settle }) {
  let taps = 0, scroll = 0;
  const H = await pg.evaluate(() => innerHeight);
  for (const s of task.steps) {
    if (s.only && s.only !== (touch ? 'phone' : 'desk')) continue;
    const sel = s.tap || s.see || s.select;
    if (s.unless && await pg.evaluate(FIND, [s.unless, null])) continue;
    if (!await pg.evaluate(FIND, [sel, s.text || null])) if (s.optional) continue; else return { taps, scroll, cost: NaN, ok: false, why: 'not found: ' + sel + (s.text ? ' ' + s.text : '') };
    scroll += await pg.evaluate(REVEAL, [!!s.whole]);
    const loc = pg.locator('[data-ph-bot]').first();
    if (s.tap) { if (touch) await loc.tap(); else await loc.click(); taps++; }
    else if (s.select) { const v = await loc.evaluate((e, i) => e.options[Math.min(i, e.options.length - 1)].value, s.index || 0); await loc.selectOption(v); taps += 2; }
    if (settle) await pg.evaluate(settle);
  }
  const ok = await pg.evaluate(`!!(${task.done})`);
  return { taps, scroll: Math.round(scroll), cost: taps + scroll / H, ok };
}

export const setupJs = t => (t.setup === 'EVENT' ? EVENT : t.setup);
export { LIFE };

// the ten tasks on each device, each from the same fresh life (seed 7101, two years played)
export async function runTasks(browser, file, devs) {
  const out = {};
  for (const d of devs) {
    const { ctx, pg } = await openPage(browser, file, d);
    out[d] = {};
    for (const t of TASKS) {
      await pg.evaluate(LIFE());
      await pg.evaluate(setupJs(t));
      await pg.evaluate(SETTLE);
      out[d][t.name] = await playTask(pg, t, { touch: !!DEVICES[d].hasTouch, settle: SETTLE });
    }
    await ctx.close();
  }
  return out;
}
