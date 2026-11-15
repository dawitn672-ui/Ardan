// 999997-scope (B5 part 2, D-055): UI.scope(pc) is one pure reader of age, class, post, rank, war and household, and six
// lives (a newborn, a child of 9, a squire of 16, a File-Leader at war, a captain in garrison, a councillor) draw every page,
// overlay and person card with no string their scope forbids. The forbidden lists are data, below, one per life.
const POL = "race: 'human', realm: 'POL-01'";

// A life: how it is made, what must never be on any of its pages or overlays (`pages`), what must never be on another
// person's card (`cards`, the card's words and buttons), and what must be (`must`).
export const LIVES = [
  {
    name: 'newborn', setup: `T.enter({ seed: 8101, ${POL}, status: 'peasant', sex: 'M', startAge: 0 })`,
    pages: [/See a physician/, /Rest and recover/, /Pick pockets/, /\bLooks\s*(striking|handsome|pleasing|plain|homely|ill-favoured)/i, /Browse schools/, /Find work/, /Enlist/, /Joining a faction/,
      /Make your mark|Arms of your own/, /Choose what to train/, /Untrained/, /Order of battle/, /Ask to join/, /War Room/, /Everything you own/, /Your market/, /Pick a fight/, /Compliment/, /Murder/],
    cards: [/Get to know/, /Pick a fight/, /Insult/, /Compliment/, /long talk/, /Ask for money/, /Murder/],
    must: [/Spend time together/],
  },
  {
    name: 'child of 9', setup: `T.enter({ seed: 8102, ${POL}, status: 'peasant', sex: 'F', startAge: 9 })`,
    pages: [/Pick pockets/, /Burgle/, /Rob a traveler/, /Smuggle/, /Throw dice/, /Plot to seize/, /Enlist/, /Lend money/, /Fund a trade venture/, /Challenge someone to a duel/, /Find work/, /Browse schools/,
      /Ask to join/, /Order of battle/, /Statecraft/, /Joining a faction/, /Make your mark|Arms of your own/, /Look for love/, /Everything you own/, /Your market/, /War Room/],
    cards: [/Pick a fight/, /Insult/, /Murder/, /duel/i, /Plot/, /Spar/, /Flirt/, /Give gift/, /Train together/],
    must: [/Get into mischief|Play with other children/, /Ask for advice/],
  },
  {
    name: 'squire of 16', setup: `T.enter({ seed: 8103, ${POL}, status: 'gentry', sex: 'M', startAge: 16 })`,
    pages: [/Find work/, /Pick pockets/, /Burgle/, /Rob a traveler/, /Smuggle/, /Plot to seize/, /Carve out a realm/, /Found your own company/, /War Room/, /Statecraft/, /Order of battle/],
    cards: [/Pick a fight/, /Insult/, /Murder/, /Challenge to a duel/, /Plot/],
    must: [/Spar with someone/, /Spend time together/],
  },
  {
    name: 'File-Leader at war',
    setup: `(() => { T.enter({ seed: 8104, ${POL}, status: 'peasant', sex: 'M', startAge: 25 }); const pc = A.pc(); A.enlist(pc); pc.mil.rank = 1; const me = pc.mil.realm; A.startWar(me, A.neighbors(me)[0], null, 'conquest'); A._idIdx = null; A.advance(12); A._idIdx = null; A.S.queue = []; })()`,
    pages: [/Open the War Room/, /War Room/, /Statecraft/, /Govern the realm/, /Plot to seize/, /Fund a trade venture/, /Find work/, /Enlist in/, /Browse schools/, /Seek a fighting school/, /Negotiate peace/, /Dictate the peace/],
    cards: [],
    must: [/File-Leader/, /Order of battle/],
  },
  {
    name: 'captain in garrison',
    setup: `(() => { T.enter({ seed: 8105, ${POL}, status: 'peasant', sex: 'M', startAge: 28 }); const pc = A.pc(); A.enlist(pc); pc.mil.rank = 4; const me = pc.mil.realm; A.S.wars = A.S.wars.filter(w => !w.att.includes(me) && !w.def.includes(me)); A._idIdx = null; A.S.queue = []; })()`,
    pages: [/War Room/, /Next day/i, /Next week/i, /on the march/, /Sue for peace/, /Negotiate peace/, /Dictate the peace/, /Find work/, /Enlist in/, /Statecraft/, /Govern the realm/, /Browse schools/, /Seek a fighting school/],
    cards: [],
    must: [/Captain/],
  },
  {
    name: 'councillor',
    setup: `(() => { T.enter({ seed: 8106, ${POL}, status: 'noble', sex: 'M', startAge: 38 }); const pc = A.pc(); pc.job = null; A.POSTS.appoint('seat:' + pc.realm + ':chancellor', pc.id, { why: 'test', by: 'test' }); A.S.queue = []; })()`,
    pages: [/Find work/, /Enlist/, /Pick pockets/, /Burgle/, /Rob a traveler/, /Smuggle/, /Throw dice/, /Browse schools/, /Only a ruler/, /Only the war council/, /Plan your freedom/, /You are free\./, /War Room/],
    cards: [],
    must: [/Chancellor/, /The council/],
  },
];

const PAGES = ['life', 'goals', 'path', 'holdings', 'war', 'people', 'legacy', 'realm', 'world', 'book', 'codex', 'profile', 'story', 'you'];

// every page at two widths, every overlay, and a few people's cards: the words and the buttons, as text
const DRAW = async (pg, setup) => {
  const out = { pages: {}, over: {}, cards: {} };
  await pg.setViewportSize({ width: 1366, height: 768 });
  await pg.evaluate(setup);
  const info = await pg.evaluate(() => { const pc = A.pc(); return { held: A.POSTS.held(pc.id), age: A.age(pc), role: A.role(pc).k }; });
  out.info = info;
  const text = el => (el ? el.textContent : '').replace(/\s+/g, ' ');
  for (const [w, h, tag] of [[1366, 768, ''], [420, 900, '@phone']]) {
    await pg.setViewportSize({ width: w, height: h });
    for (const t of PAGES) {
      out.pages[t + tag] = await pg.evaluate(t => {
        UI.ov = null; A.S.queue = []; UI.tab = t;
        try { UI.render(); } catch (e) { return 'ERR ' + e.message; }
        const app = document.getElementById('app');
        return (app ? app.textContent : '').replace(/\s+/g, ' ');
      }, t);
    }
  }
  await pg.setViewportSize({ width: 1366, height: 768 });
  const ovs = ['house', 'profs', 'profile', 'tree', 'menu', 'help', 'warroom'];
  for (const t of ovs) {
    out.over[t] = await pg.evaluate(t => {
      A.S.queue = []; UI.tab = 'life'; UI.ov = null;
      try {
        if (t === 'warroom') UI.warRoomOpen && UI.warRoomOpen();
        else UI.ov = { type: t, id: (A.pc().parents || [])[0] };
        UI.renderModal();
      } catch (e) { UI.ov = null; return 'ERR ' + e.message; }
      const m = document.getElementById('modal'), r = m ? m.textContent.replace(/\s+/g, ' ') : '';
      UI.ov = null; UI.renderModal(); return r;
    }, t);
  }
  const people = await pg.evaluate(() => {
    const pc = A.pc(), ids = { self: pc.id }, par = (pc.parents || [])[0];
    if (par) ids.parent = par;
    const s = Object.values(A.S.people).find(p => p.alive && p.id !== pc.id && p.realm === pc.realm && !(pc.parents || []).includes(p.id));
    if (s) ids.stranger = s.id;
    return ids;
  });
  for (const [k, id] of Object.entries(people)) {
    out.cards[k] = await pg.evaluate(id => {
      UI.ov = { type: 'person', id }; A.S.queue = [];
      try { UI.renderModal(); } catch (e) { UI.ov = null; return 'ERR ' + e.message; }
      const m = document.getElementById('modal'), r = m ? m.textContent.replace(/\s+/g, ' ') + ' ¦ ' + [...m.querySelectorAll('button')].map(b => b.textContent.trim()).join(' / ') : '';
      UI.ov = null; UI.renderModal(); return r;
    }, id);
  }
  return out;
};

export const drawLife = DRAW;

export default {
  // one reader, four questions, the same answer for the same state, and nothing written
  async scopeShape(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 8120, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 9 });
      const pc = A.pc(), h0 = T.hash(A.S), r0 = A.rngState, s = UI.scope(pc);
      const a = JSON.stringify([s.stage, s.minor, s.settled, s.post.any, s.war.arms, s.sees('looks'), s.page('realm'), s.act('crime_burgle'), s.page('life')]);
      const again = UI.scope(pc) === s;
      for (let i = 0; i < 5; i++) { UI.scope(pc).social(A.P(pc.parents[0]), ['argue', 'time']); UI.scope(pc).act('lift'); }
      const pure = T.hash(A.S) === h0 && A.rngState === r0;
      T.enter({ seed: 8121, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 40 });
      const pc2 = A.pc(); A.makeRuler(pc2, pc2.realm, true);
      const t = UI.scope(pc2);
      return { a, again, pure, ruler: [t.stage, t.post.ruler, t.post.any, t.war.room, t.sees('court'), t.sees('statecraft'), t.sees('findWork'), t.page('realm'), t.act('plot_throne').show, t.act('gamble').show] };
    });
    const ok = r.a === JSON.stringify(['child', true, false, false, false, true, false, { show: false, why: 'Too young' }, true]) && r.again && r.pure &&
      JSON.stringify(r.ruler) === JSON.stringify(['adult', true, true, true, true, true, false, true, true, false]);
    return { ok, detail: `child ${r.a}; same object ${r.again}; pure ${r.pure}; ruler ${JSON.stringify(r.ruler)}` };
  },

  // an activity no life like his is offered: A.canAct refuses it, with the words the Life page hides, for four lives
  async scopeActs(pg) {
    const r = await pg.evaluate(() => {
      const out = {};
      const life = (n, o, f) => { T.enter(Object.assign({ seed: 8130, race: 'human', realm: 'POL-01', sex: 'M', status: 'peasant', startAge: 25 }, o)); if (f) f(A.pc()); const pc = A.pc(); out[n] = ['heal', 'crime_burgle', 'gamble', 'plot_throne', 'lift', 'pray'].map(k => `${k}:${A.canAct(k)[0] ? 'y' : 'n'}`).join(' '); };
      life('infant', { startAge: 0 });
      life('child12', { startAge: 12 });
      life('adult', {});
      life('council', { status: 'noble', startAge: 38 }, pc => A.POSTS.appoint('seat:' + pc.realm + ':chancellor', pc.id, { why: 't', by: 't' }));
      return out;
    });
    const ok = /heal:n.*pray:n/.test(r.infant) && /crime_burgle:n/.test(r.child12) && /heal:y/.test(r.child12) && /crime_burgle:y|crime_burgle:n/.test(r.adult) && /gamble:n/.test(r.council) && /gamble:y/.test(r.adult);
    return { ok, detail: JSON.stringify(r) };
  },

  // B5 part 1's tablet claim, held: on a coarse pointer at 768 and 1024 px the time buttons are 44 px targets in view and no page
  // scrolls sideways (the page keeps the desktop layout there; the phone shell is D-055's "not done")
  async b5Tablet(pg, errs, { browser, file }) {
    const { pathToFileURL } = await import('node:url');
    const out = [];
    for (const [w, h] of [[768, 1024], [1024, 768]]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
      const p = await ctx.newPage();
      try {
        await p.goto(pathToFileURL(file).href);
        await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
        out.push(await p.evaluate(async () => {
          A.newGame({ seed: 8300, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 }); UI.screen = 'game'; UI.ov = null; A.S.queue = []; UI.set.hints = false;
          const res = { w: innerWidth, btn: null, hs: 0, pages: [] };
          for (const t of ['life', 'people', 'realm', 'holdings', 'profile']) {
            UI.tab = t; UI.render(); await new Promise(r => setTimeout(r, 80));
            res.hs = Math.max(res.hs, document.documentElement.scrollWidth - innerWidth);
            if (!res.btn) { const b = [...document.querySelectorAll('button')].find(x => /Next month/i.test(x.textContent)); const r = b && b.getBoundingClientRect(); if (r) res.btn = [Math.round(r.width), Math.round(r.height), r.top >= 0 && r.bottom <= innerHeight]; }
          }
          return res;
        }));
      } finally { await ctx.close(); }
    }
    const bad = out.filter(r => !r.btn || r.btn[0] < 44 || r.btn[1] < 44 || !r.btn[2] || r.hs > 0);
    return { ok: !bad.length, detail: out.map(r => `${r.w}px: Next month ${r.btn ? r.btn.slice(0, 2).join('x') : 'missing'}, sideways +${r.hs}`).join('; ') };
  },

  // the six lives draw every page, overlay and card without a forbidden string, and show what they must
  async scopeSixLives(pg) {
    const bad = [], seen = [];
    for (const L of LIVES) {
      const d = await DRAW(pg, L.setup);
      const errs = [...Object.entries(d.pages), ...Object.entries(d.over), ...Object.entries(d.cards)].filter(([, v]) => typeof v === 'string' && v.startsWith('ERR')).map(([k, v]) => `${k}: ${v}`);
      if (errs.length) bad.push(`${L.name}: ${errs.join('; ')}`);
      const surfaces = [...Object.entries(d.pages).map(([k, v]) => [`page ${k}`, v]), ...Object.entries(d.over).filter(([k]) => k !== 'help' && k !== 'menu').map(([k, v]) => [`overlay ${k}`, v]), ['own card', d.cards.self || '']];
      for (const re of L.pages) for (const [where, txt] of surfaces) if (re.test(txt)) { bad.push(`${L.name}: ${re} on ${where}`); break; }
      for (const re of L.cards) for (const k of ['parent', 'stranger']) if (d.cards[k] && re.test(d.cards[k])) { bad.push(`${L.name}: ${re} on the ${k}'s card`); break; }
      for (const re of L.must) { const all = surfaces.map(x => x[1]).concat(Object.values(d.cards)); if (!all.some(t => re.test(t))) bad.push(`${L.name}: ${re} is nowhere (over-hidden)`); }
      seen.push(`${L.name} (${d.info.role}, ${Object.keys(d.pages).length} pages, ${Object.keys(d.over).length} overlays, ${Object.keys(d.cards).length} cards)`);
      if (process.env.SCOPE_DUMP) (await import('node:fs')).writeFileSync(`${process.env.SCOPE_DUMP}/${L.name.replace(/\W+/g, '-')}.json`, JSON.stringify(d, null, 1));
    }
    return { ok: !bad.length, detail: bad.length ? `${bad.length} leaks: ${bad.slice(0, 24).join(' | ')}` : `no forbidden string in ${seen.join('; ')}` };
  },
};
