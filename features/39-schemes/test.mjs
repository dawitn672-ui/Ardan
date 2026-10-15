// Schemes, both ways: a plot runs month by month to an opening and a last move; it can be found out; the people who
// hate you plot too, and you can notice, unmask and answer them.
const SETUP = () => {
  window.SCT = {
    adult(seed) {
      A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 30 });
      const pc = A.pc(); pc.coin = Math.max(pc.coin, 200);
      return pc;
    },
    person(pc, type, op) {
      const t = A.makeAcquaintance(pc, type || 'acquaint');
      A.link(pc, t, type || 'acquaint', op || 0, type || 'acquaint');
      t.born = A.S.year - 30;
      return t;
    },
    month(pc) { A.onMonth.forEach(f => { try { f(pc); } catch (e) { console.error(e); } }); },
    choose(ev, idx, win) {
      const q = A.S.queue.find(x => x.ev === ev); if (!q) return null;
      A.S.queue = [q].concat(A.S.queue.filter(x => x !== q));
      const v = A.eventView(q); const vi = v.choices.findIndex(c => c.i === idx);
      if (vi < 0) return { view: v, missing: true };
      const ch = A.chance; if (win != null) A.chance = () => win;
      try { A.eventChoose(vi); } finally { A.chance = ch; }
      const t = q.result && q.result.text; A.eventClose(); return { text: t, view: v };
    },
    // run months with discovery switched off until an event of the scheme is queued
    until(pc, re, max) {
      const ch = A.chance;
      for (let m = 1; m <= (max || 40); m++) {
        A.chance = () => false;
        try { SCT.month(pc); } finally { A.chance = ch; }
        const q = A.S.queue.find(x => re.test(x.ev || ''));
        if (q) return { ev: q.ev, months: m };
      }
      return { ev: null, months: max || 40 };
    },
  };
};

export default {
  async schemeRuns(pg) {
    // a sway from the person's button to the last move
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = SCT.adult(91), t = SCT.person(pc, 'acquaint', 0);
      const op0 = t.rel[pc.id].op;
      A.interact(t.id, 'sc_win');
      const pick = SCT.choose('sch_win_choose', 0);
      const s = A.SCHEMES.list(pc)[0];
      const months = s ? A.SCHEMES.monthsLeft(pc, s) : null;
      const open = SCT.until(pc, /^sch_opening/);
      SCT.choose('sch_opening', 1);   // wait for a better one
      const done = SCT.until(pc, /^sch_done_/);
      const res = SCT.choose('sch_done_sway', 0);
      return { started: !!s, months, chooseText: pick && pick.view.text, open, done, total: open.months + done.months, op: t.rel[pc.id].op - op0, left: A.SCHEMES.list(pc).length, text: res && res.text };
    });
    const ok = r.started && r.open.ev === 'sch_opening' && r.done.ev === 'sch_done_sway' && r.op >= 20 && r.left === 0 && Math.abs(r.total - r.months) <= 2 && !/\{/.test(r.chooseText + r.text);
    return { ok, detail: `estimated ${r.months} months, took ${r.total} (opening after ${r.open.months}); their opinion of you +${Math.round(r.op)}. Choosing: "${r.chooseText}"` };
  },

  async schemeFoundOut(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const out = {};
      // a slander found out in its first month
      let pc = SCT.adult(92), t = SCT.person(pc, 'acquaint', 0);
      A.SCHEMES.start(pc, t, 'slander');
      const ch = A.chance; A.chance = () => true; try { SCT.month(pc); } finally { A.chance = ch; }
      out.queued = A.S.queue.map(q => q.ev).filter(e => /^sch_/.test(e));
      SCT.choose('sch_found', 0, false);   // deny, and fail
      out.type = pc.rel[t.id].type; out.left = A.SCHEMES.list(pc).length;
      // the risk a month, by kind, for an ordinary target
      pc = SCT.adult(93); t = SCT.person(pc, 'acquaint', 0);
      out.risk = {};
      for (const k of Object.keys(A.SCHEMES.KINDS)) out.risk[k] = Math.round(1000 * A.SCHEMES.risk(pc, { k, t: t.id, prog: 0 })) / 10;
      return out;
    });
    const ok = r.queued.includes('sch_found') && r.type === 'enemy' && r.left === 0 && r.risk.murder > r.risk.sway;
    return { ok, detail: `found out: ${r.queued.join(', ')}, then an ${r.type}; risk a month: ${Object.entries(r.risk).map(([k, v]) => `${k} ${v}%`).join(', ')}` };
  },

  async murderPlot(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = SCT.adult(94), t = SCT.person(pc, 'rival', -50);
      A.interact(t.id, 'sc_harm');
      SCT.choose('sch_harm_choose', 1);
      const s = A.SCHEMES.list(pc)[0]; s.prog = 95; s.mid = 1;
      const done = SCT.until(pc, /^sch_done_/);
      const res = SCT.choose('sch_done_murder', 0, true);
      // and one found out at the last move
      const pc2 = SCT.adult(95), t2 = SCT.person(pc2, 'rival', -50);
      A.SCHEMES.start(pc2, t2, 'murder'); const s2 = A.SCHEMES.list(pc2)[0]; s2.prog = 95; s2.mid = 1;
      SCT.until(pc2, /^sch_done_/);
      SCT.choose('sch_done_murder', 0, false);
      const found = A.S.queue.some(q => q.ev === 'sch_found_murder');
      return { done: done.ev, dead: !t.alive, cause: t.cause, text: res && res.text, found };
    });
    return { ok: r.done === 'sch_done_murder' && r.dead && r.found, detail: `the last move: ${r.done}; target dead: ${r.dead} (${r.cause}); a failed poisoning queues sch_found_murder: ${r.found}` };
  },

  async plottedAgainst(pg) {
    // a cruel man who hates you plots your death; you notice, unmask him and expose him
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = SCT.adult(96), e = SCT.person(pc, 'enemy', -80);
      e.rel[pc.id].op = -85; e.traits = (e.traits || []).filter(x => x !== 'kind').concat(['cruel', 'vengeful']);
      const ch = A.chance; let months = 0;
      A.chance = () => true;
      try { for (; months < 12 && !pc.scAgainst; months++) SCT.month(pc); } finally { A.chance = ch; }
      const plot = pc.scAgainst && Object.assign({}, pc.scAgainst);
      A.S.queue = [];
      A.chance = () => true; try { SCT.month(pc); } finally { A.chance = ch; }
      const noticed = A.S.queue.some(q => q.ev === 'sch_noticed');
      SCT.choose('sch_noticed', 0, true);
      const unmasked = A.S.queue.find(q => q.ev === 'sch_unmasked');
      const named = unmasked && unmasked.ctx.pid === e.id;
      const f0 = e.fame || 0;
      SCT.choose('sch_unmasked', 1);
      // left alone, a plot lands
      const pc2 = SCT.adult(97), e2 = SCT.person(pc2, 'enemy', -80); e2.rel[pc2.id].op = -85;
      pc2.scAgainst = { by: e2.id, k: 'slander', prog: 95, m: 0, noticed: 1 };
      A.chance = () => false; try { SCT.month(pc2); } finally { A.chance = ch; }
      const landed = A.S.queue.map(q => q.ev).filter(x => /^sch_/.test(x));
      return { plot, months, noticed, named, exposed: f0 - (e.fame || 0), dropped: !pc.scAgainst, landed };
    });
    const ok = r.plot && r.plot.k === 'murder' && r.noticed && r.named && r.dropped && r.landed.includes('sch_slandered');
    return { ok, detail: `${r.plot ? r.plot.k : 'no'} plot after ${r.months} months; noticed ${r.noticed}; unmasked the right man ${r.named}; exposed (fame −${r.exposed}), plot dropped ${r.dropped}; a slander left alone lands as ${r.landed.join(', ')}` };
  },

  async schemesOnScreen(pg) {
    // the buttons, the Life card, escaping, and pure rendering
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = SCT.adult(98), t = SCT.person(pc, 'acquaint', 0), u = SCT.person(pc, 'acquaint', 0);
      t.given = '<img src=x>Mal';
      A.SCHEMES.start(pc, t, 'sway');
      pc.scAgainst = { by: t.id, k: 'slander', prog: 10, m: 0, noticed: 1 };
      const h1 = UI.personModal ? UI.personModal(u) : '', h0 = UI.personModal ? UI.personModal(t) : '';
      UI.TAB.life(pc);   // a first draw may set up caches of its own
      const st = JSON.stringify(A.rngState), s0 = JSON.stringify(A.S);
      const life = UI.TAB.life(pc);
      const pure = JSON.stringify(A.rngState) === st && JSON.stringify(A.S) === s0;
      const card = (life.match(/<div class="card small schemes"[\s\S]*?<\/div><\/div>/) || [''])[0];
      return { win: /data-v="[^"]*\|sc_win"/.test(h1), harm: /data-v="[^"]*\|sc_harm"/.test(h1), busy: /\|sc_(win|harm)"/.test(h0), card: card.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), raw: /<img src=x>/.test(life), pure };
    });
    const ok = r.win && r.harm && !r.busy && r.card.includes('Winning over') && r.card.includes('working against you') && !r.raw && r.pure;
    return { ok, detail: `buttons: win ${r.win}, against ${r.harm}, and none on someone you already plot on (${!r.busy}); card: "${r.card}"; markup escaped: ${!r.raw}; render pure: ${r.pure}` };
  },

  async plotsInRealLives(pg) {
    // in bot lives, the people who come to hate you plot against you
    const r = await pg.evaluate(() => {
      const seen = {};
      let years = 0;
      for (const seed of [101, 102, 103, 104]) {
        A.newGame({ seed, race: 'human', realm: ['POL-01', 'POL-03'][seed % 2], status: ['noble', 'merchant'][seed % 2], sex: 'M', startAge: 20 });
        const end = A.S.year + 25;
        for (let g = 0; g < 4000 && A.S.year < end && A.pc().alive; g++) {
          A.advance(60);
          let h, n = 0;
          while ((h = A.headReady()) && n++ < 300) {
            if (h.type === 'event') { if (/^sch_/.test(h.ev)) seen[h.ev] = (seen[h.ev] || 0) + 1; A.eventAuto(); }
            else if (h.type === 'choice') A.choiceChoose(0); else if (h.type === 'battle') A.battleClose();
            else if (h.type === 'duel') { A.duelAuto(h.d); A.duelClose(); } else A.S.queue.shift();
          }
        }
        years += A.S.year - (end - 25);
      }
      return { seen, years };
    });
    const n = Object.values(r.seen).reduce((a, x) => a + x, 0);
    return { ok: n >= 1, detail: `${n} scheme scenes in ${r.years} years of four lives: ${Object.entries(r.seen).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}` };
  },
};
