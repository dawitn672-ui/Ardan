// 9992-story-drawer and the rest of B5's declutter rules: the open page gets the width, the story is a drawer, a screen holds
// no more than a budget of words, controls and scroll, no page scrolls sideways at a phone's width, the help names the places
// that exist, a card dims the rest and shows its choices at 768 px, and the activities are six and "More".
import { PERSONAS, PAGES, START, PROBE, SETTLE } from '../../../tools/lib/clutter.mjs';

// The budgets (round 2 B5; CRITIQUE U2 asked 120 words and 12 controls on a phone and 250 and 25 on a desktop, counted
// without the fixed bars). `page` counts what is in the open page's own zone (#side on a desktop, the page on a phone) in the
// first view; `all` the whole first view, bars and rail included. A page that is a map or a long text (World, Book) is held to
// the screens only.
export const BUDGET = {
  desk: { all: { words: 270, controls: 50 }, page: { words: 230, controls: 40 }, screens: 3 },
  phone: { all: { words: 200, controls: 40 }, page: { words: 150, controls: 30 }, screens: 3 },
};
const PROSE = new Set(['world', 'book', 'story']);

const measure = async (pg, w, h, persona, pages) => {
  await pg.setViewportSize({ width: w, height: h });
  const P = PERSONAS[persona], out = {};
  await pg.evaluate(START(P.o, P.ruler));
  await pg.evaluate(() => { UI.render(); });
  for (const [name, tab, extra] of PAGES) {
    if (pages && !pages.includes(name)) continue;
    await pg.evaluate(`(() => { UI.ov = null; A.S.queue = []; UI.tab = ${JSON.stringify(tab)}; ${extra} UI.render(); window.scrollTo(0, 0); const tb = document.getElementById('tabbody'); if (tb) tb.scrollTop = 0; })()`);
    await pg.evaluate(SETTLE);
    out[name] = await pg.evaluate(PROBE);
  }
  return out;
};

export default {
  // at 1366 x 768 the open page has at least 60% of the width, and the story is a drawer a button opens
  async sdPageWidth(pg) {
    await pg.setViewportSize({ width: 1366, height: 768 });
    const r = await pg.evaluate(async start => {
      eval(start);
      UI.tab = 'life'; UI.render(); await new Promise(res => setTimeout(res, 60));
      const share = () => document.getElementById('side').getBoundingClientRect().width / innerWidth;
      const lw = () => document.getElementById('logwrap'), vis = () => getComputedStyle(lw()).visibility !== 'hidden' && lw().getBoundingClientRect().left < innerWidth - 100;
      const out = { share: +share().toFixed(2), closedHidden: !vis() };
      const btn = document.querySelector('#topbar [data-a="storyDrawer"]');
      out.btn = !!btn && getComputedStyle(btn).display !== 'none' && btn.getAttribute('aria-expanded') === 'false';
      btn.click(); await new Promise(res => setTimeout(res, 300));
      out.open = vis() && document.getElementById('game').classList.contains('lk-story-open') && document.querySelector('#topbar [data-a="storyDrawer"]').getAttribute('aria-expanded') === 'true';
      out.openShare = +share().toFixed(2);
      UI.render(); await new Promise(res => setTimeout(res, 60));
      out.keeps = vis();                           // a full draw keeps it open
      document.querySelector('#topbar [data-a="storyDrawer"]').click(); await new Promise(res => setTimeout(res, 300));
      out.closedAgain = !vis();
      out.feed = document.querySelectorAll('#tabbody .sd-feed .ll').length;
      // new lines: a neutral dot on the button, never the red one
      A.log('A word in the street.'); UI.render(); await new Promise(res => setTimeout(res, 60));
      const dot = document.querySelector('#topbar .story-btn .badge-new');
      out.dot = !!dot;
      out.dotNeutral = !!dot && getComputedStyle(dot).backgroundColor !== getComputedStyle(document.documentElement).getPropertyValue('--danger');
      return out;
    }, START(PERSONAS.noble.o));
    const ok = r.share >= 0.6 && r.closedHidden && r.btn && r.open && r.keeps && r.closedAgain && r.feed >= 1 && r.dot && r.dotNeutral;
    return { ok, detail: JSON.stringify(r) };
  },

  // from 1600 the story is a column beside the page (the page at least half the window), below it a drawer (the page at least 60%)
  async sdWidths(pg) {
    const rows = [];
    for (const [w, h] of [[1100, 800], [1280, 720], [1440, 900], [1599, 800], [1600, 900], [1920, 1080]]) {
      await pg.setViewportSize({ width: w, height: h });
      const r = await pg.evaluate(async start => {
        eval(start); UI.tab = 'life'; UI.render(); await new Promise(res => setTimeout(res, 40));
        const side = document.getElementById('side').getBoundingClientRect(), lw = document.getElementById('logwrap').getBoundingClientRect();
        return { share: +(side.width / innerWidth).toFixed(2), storyInView: lw.left >= 0 && lw.right <= innerWidth + 1 && getComputedStyle(document.getElementById('logwrap')).visibility !== 'hidden', hs: document.documentElement.scrollWidth - innerWidth };
      }, START(PERSONAS.noble.o));
      rows.push({ w, ...r });
    }
    const bad = rows.filter(r => r.hs > 0 || (r.w < 1600 && (r.share < 0.6 || r.storyInView)) || (r.w >= 1600 && (r.share < 0.5 || !r.storyInView)));
    return { ok: !bad.length, detail: rows.map(r => `${r.w}: page ${r.share}, story ${r.storyInView ? 'column' : 'drawer'}`).join('; ') };
  },

  // a screen holds a budget of words and controls, and no page is longer than three screens (desktop and phone, three lives)
  async b5Budget(pg) {
    const bad = [], seen = [];
    for (const [vn, w, h] of [['desk', 1366, 768], ['phone', 420, 900]]) {
      for (const persona of ['peasant', 'noble', 'ruler']) {
        const m = await measure(pg, w, h, persona);
        for (const [name, x] of Object.entries(m)) {
          const B = BUDGET[vn], zone = vn === 'desk' ? (x.zones.side || {}) : (x.zones.side || {});
          const pw = zone.words || 0, pc = zone.controls || 0;
          seen.push(`${vn}/${persona}/${name} ${x.words}w ${x.controls}c page ${pw}w ${pc}c ${x.screens}s`);
          const why = [];
          if (!PROSE.has(name) && x.words > B.all.words) why.push(`${x.words} words in view (max ${B.all.words})`);
          if (x.controls > B.all.controls) why.push(`${x.controls} controls in view (max ${B.all.controls})`);
          if (!PROSE.has(name) && pw > B.page.words) why.push(`${pw} words in the page (max ${B.page.words})`);
          if (pc > B.page.controls) why.push(`${pc} controls in the page (max ${B.page.controls})`);
          if (x.screens > B.screens) why.push(`${x.screens} screens of scroll (max ${B.screens})`);
          if (why.length) bad.push(`${vn}/${persona}/${name}: ${why.join(', ')}`);
        }
      }
    }
    return { ok: !bad.length, detail: bad.length ? bad.slice(0, 12).join(' | ') : `${seen.length} screens within budget` };
  },

  // no sideways scroll at a phone's width on any page, for any of the three lives (and nothing sticks out of its scroller)
  async b5NoSideways(pg) {
    const bad = [];
    for (const w of [390, 420]) {
      for (const persona of ['peasant', 'noble', 'ruler']) {
        const m = await measure(pg, w, 844, persona);
        for (const [name, x] of Object.entries(m)) if (x.hscroll > 0 || x.nOut > 0) bad.push(`${w}/${persona}/${name}: +${x.hscroll}px ${x.sticksOut.join(' ')}`);
      }
    }
    return { ok: !bad.length, detail: bad.length ? bad.slice(0, 8).join(' | ') : 'no page scrolls sideways at 390 or 420 px, for a peasant, a noble and a ruler' };
  },

  // nothing hides behind a hover: no pointer-over or mouse-enter handler attribute on any page
  async b5NoHoverOnly(pg) {
    await pg.setViewportSize({ width: 1366, height: 768 });
    const m = await measure(pg, 1366, 768, 'noble');
    const bad = Object.entries(m).filter(([, x]) => x.hover > 0).map(([n, x]) => `${n} ${x.hover}`);
    return { ok: !bad.length, detail: bad.length ? bad.join(', ') : 'no hover handler on any page' };
  },

  // the help names the places that exist (generated from UI.GROUPS) and never a "tab"
  async b5HelpNames(pg) {
    const r = await pg.evaluate(async () => {
      const out = [];
      for (const [st, age] of [['peasant', 20], ['noble', 32]]) {
        A.newGame({ seed: 77, race: 'human', realm: 'POL-01', status: st, sex: 'M', startAge: age });
        UI.screen = 'game'; UI.ov = null; A.S.queue = [];
        const d = document.createElement('div'); d.innerHTML = UI.helpModal();
        const t = d.textContent.replace(/\s+/g, ' ');
        out.push({ st, names: UI.GROUPS.map(g => g.name), missing: UI.GROUPS.filter(g => !t.includes(g.name)).map(g => g.name), tab: (t.match(/\b[A-Z][a-z]+ tabs?\b|\btabs?\b/g) || []).slice(0, 4), play: /\bPlay\b|speeds 1/.test(t) });
      }
      return out;
    });
    const bad = r.filter(x => x.missing.length || x.tab.length || x.play);
    return { ok: !bad.length, detail: bad.length ? JSON.stringify(bad) : `the help names ${r[0].names.join(', ')} and ${r[1].names.join(', ')}; no "tab", no Play button` };
  },

  // a card dims the rest, sits over the open page and every choice is in view at 1366 x 768
  async b5CardFits(pg) {
    await pg.setViewportSize({ width: 1366, height: 768 });
    const r = await pg.evaluate(async start => {
      eval(start);
      const pc = A.pc(), seen = [];
      // the first ready event with at least three choices, shown
      let found = null;
      for (let g = 0; g < 80 && !found; g++) {
        A.advance(30); const h = A.S.queue[0];
        if (h && h.type === 'event') { const v = A.eventView(h); if (v && v.choices && v.choices.length >= 3) { found = v.choices.length; A.S.queue = [h]; break; } }
        A.S.queue = []; if (!pc.alive) { pc.alive = true; pc.health = 80; }
      }
      UI.ov = null; UI.set.hints = true; UI.render(); await new Promise(res => setTimeout(res, 700));
      const m = document.getElementById('modal'), card = m && m.querySelector('.sc-card');
      if (!card) return { found, card: false };
      const cr = card.getBoundingClientRect(), side = document.getElementById('side').getBoundingClientRect();
      const ch = [...m.querySelectorAll('.choices button')].map(b => b.getBoundingClientRect().bottom);
      const scrim = getComputedStyle(m).backgroundColor;
      return { found, card: true, choices: ch.length, lowest: Math.round(Math.max(...ch)), H: innerHeight, centred: Math.abs((cr.left + cr.width / 2) - (side.left + side.width / 2)) < 12, scrim, hint: !!m.querySelector('.hint-float') };
    }, START(PERSONAS.noble.o));
    const ok = r.card && r.choices >= 3 && r.lowest <= r.H && r.centred && /rgba?\(/.test(r.scrim) && !/, 0\)$/.test(r.scrim);
    return { ok, detail: JSON.stringify(r) };
  },

  // six suggested activities in every life (97-first-life-fixes' six and "More activities"), a tile asked for opens the rest
  async b5Activities(pg) {
    await pg.setViewportSize({ width: 1366, height: 768 });
    const r = await pg.evaluate(async start => {
      eval(start);
      UI.actsAll = false; UI.set.lfLives = 5;                      // not a first life
      UI.tab = 'life'; UI.render(); await new Promise(res => setTimeout(res, 60));
      const tiles = () => [...document.querySelectorAll('#tabbody .lk-acts > .act')], shown = () => tiles().filter(t => !t.hidden).length;
      const out = { all: tiles().length, shown: shown() };
      const more = document.querySelector('#tabbody [data-a="actsMore"]');
      out.btn = !!more && /^More activities \(\d+\)$/.test(more.textContent);
      out.head = document.querySelector('#tabbody .fold-acts .fold-n') ? +document.querySelector('#tabbody .fold-acts .fold-n').dataset.n : 0;
      more.click(); await new Promise(res => setTimeout(res, 60));
      out.opened = shown() === tiles().length;
      UI.actsAll = false; UI.render(); await new Promise(res => setTimeout(res, 40));
      const hidden = tiles().find(t => t.hidden);
      UI.FOLD.reveal(hidden); await new Promise(res => setTimeout(res, 60));
      out.reveal = tiles().every(t => !t.hidden);
      return out;
    }, START(PERSONAS.noble.o));
    const ok = r.all >= 8 && r.shown === 6 && r.btn && r.head >= r.all && r.opened && r.reveal;
    return { ok, detail: JSON.stringify(r) };
  },

  // Decisions: what can be decided now first; the rest under a closed "Not yet possible"
  async b5Decisions(pg) {
    await pg.setViewportSize({ width: 1366, height: 768 });
    const r = await pg.evaluate(async start => {
      eval(start); UI.FOLD.state = {};
      UI.tab = 'goals'; UI.render(); await new Promise(res => setTimeout(res, 60));
      const tb = document.getElementById('tabbody');
      const later = [...tb.querySelectorAll('.fold')].find(f => f.dataset.fk === 'not yet possible');
      const closed = !!later && later.querySelector(':scope > .fold-b').hidden;
      const openNow = [...tb.querySelectorAll('.card.dec')].filter(c => !c.closest('.fold-b[hidden]'));
      return { later: !!later, closed, n: tb.querySelectorAll('.card.dec').length, shown: openNow.length, enabledShown: openNow.filter(c => { const b = c.querySelector('button[data-a="decide"]'); return b && !b.disabled; }).length, intro: /no quest lists/i.test(tb.textContent) };
    }, START(PERSONAS.noble.o));
    const ok = r.later && r.closed && r.shown === r.enabledShown && !r.intro;
    return { ok, detail: JSON.stringify(r) };
  },
};
