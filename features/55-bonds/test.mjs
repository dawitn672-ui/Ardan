// Bonds: a bond's history weighs, fades, moves opinion and is cited; NPCs keep secrets you can find and use, and they
// can use yours; the kin of the dead and the realms that were wronged remember across generations, and the AI reads it.
import { BOT } from '../../bench/bot.mjs';

const SETUP = () => {
  window.BDT = {
    adult(seed, o) {
      A.newGame(Object.assign({ seed, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'F', startAge: 34 }, o || {}));
      const pc = A.pc(); pc.coin = 400; pc.honor = 60; A.S.queue = [];
      if (A.NPCI) A.NPCI.state(pc).b = 2;
      return pc;
    },
    // a grown person of the player's town who knows nobody yet, with the traits asked for
    stranger(pc, traits, sex) {
      const keep = A.CIRCLES ? A.CIRCLES.TIE : null; if (A.CIRCLES) A.CIRCLES.TIE = 0;
      try {
        const p = A.makeAcquaintance(pc, 'acquaint'); p.born = A.S.year - 35; p.home = pc.home; p.rel = p.rel || {};
        if (traits) p.traits = traits.slice(); if (sex) p.sex = sex; p.health = 100;
        for (const id of Object.keys(pc.rel)) if (id === String(p.id)) delete pc.rel[id];
        delete p.rel[pc.id];
        return p;
      } finally { if (A.CIRCLES) A.CIRCLES.TIE = keep; }
    },
    // queue an event and pick a choice (by its index in the event), optionally forcing a check
    choose(ev, ctx, idx, win) {
      A.S.queue = [{ type: 'event', ev, ctx: Object.assign({}, ctx), forced: true }];
      const q = A.S.queue[0], v = A.eventView(q);
      if (v.skip) return { skip: true, view: v };
      const vi = v.choices.findIndex(c => c.i === idx);
      if (vi < 0) return { missing: true, view: v };
      const ch = A.chance; if (win != null) A.chance = () => win;
      try { A.eventChoose(vi); } finally { A.chance = ch; }
      const res = q.result; A.eventClose();
      return { view: v, text: res && res.text, success: res && res.success };
    },
    words: s => (String(s || '').match(/\S+/g) || []).length,
    line: (pc, t) => (pc.rel[t.id].hist || []).slice(-1)[0],
    yearOn(pc) { A.S.year++; A.BONDS.year(pc); },
  };
};

export default {
  async bondsLedgerWeighs(pg) {
    // what an action did to a bond becomes the weight of its line; lines fade by their half-life and top up when
    // repeated; once a year their sum pulls opinion toward itself, and strong memories keep a bond from being forgotten
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const BD = A.BONDS, pc = BDT.adult(5501), t = BDT.stranger(pc, ['honest']);
      A.link(pc, t, 'acquaint', 10, 'acquaint'); t.rel[pc.id].op = 10;
      // an event choice with ctx.pid: its "them" opinion is the line's weight, its label the deed
      A.defEvents([{ id: 'bdt_mill', title: 'The flooded mill', trigger: true, cond: (p, C) => C.adult(p), text: '{them} is in the race, and the wheel is turning.',
        choices: [{ t: 'Pull {themHim} out', r: 'You pull.', fx: { them: { op: 14 } } }, { t: 'Shout for help', r: 'You shout.', fx: { them: { op: -3 } } }] }]);
      BD.state(pc).y = A.S.year;
      BDT.choose('bdt_mill', { pid: t.id }, 0);
      const e = BDT.line(pc, t), mill = { t: e.t, w: e.w, h: e.h, d: e.d };
      // an interaction: an insult is a short, bad line; a second long talk in the same year tops the first one up
      A.interact(t.id, 'insult'); const insLine = BDT.line(pc, t), ins = Object.assign({}, insLine);
      A.interact(t.id, 'talk'); const n1 = pc.rel[t.id].hist.length; A.interact(t.id, 'talk'); const n2 = pc.rel[t.id].hist.length;
      // fading: the mill (+14, half-life 6) after 6 years; the insult (half-life 4) after 6
      for (let i = 0; i < 6; i++) BDT.yearOn(pc);
      const millAfter = pc.rel[t.id].hist.find(x => x.t === mill.t).w, insAfter = insLine.w;
      // the pull: a bond that remembers +30 and has fallen to -10 on both sides closes 30% of the gap in a year
      const u = BDT.stranger(pc, []); A.link(pc, u, 'acquaint', 0, 'acquaint');
      A.bondNote(pc, u, 'You hid her from the watch', null, { v: 30, h: 20 });
      pc.rel[u.id].op = -10; u.rel[pc.id].op = -10;
      BDT.yearOn(pc);
      const upTheirs = u.rel[pc.id].op, upMine = pc.rel[u.id].op;
      // a wrong pulls down: -25 remembered, opinion +20
      const v = BDT.stranger(pc, []); A.link(pc, v, 'acquaint', 20, 'acquaint'); v.rel[pc.id].op = 20;
      A.bondNote(pc, v, 'You mocked him at court', null, { v: -25, h: 12 });
      BDT.yearOn(pc);
      const down = v.rel[pc.id].op;
      // forgetting: two quiet acquaintances, four years idle; the one with a strong memory is kept
      const plain = BDT.stranger(pc, []), held = BDT.stranger(pc, []);
      A.link(pc, plain, 'acquaint', 5, 'acquaint'); A.link(pc, held, 'acquaint', 5, 'acquaint');
      A.bondNote(pc, held, 'You stood surety for him', null, { v: 20, h: 25 });
      pc.rel[plain.id].seen = pc.rel[held.id].seen = A.S.year - 4;
      A.bondsYear(pc);
      return { mill, ins: { t: ins.t, w: ins.w, h: ins.h }, topUp: n2 === n1, millAfter, insAfter, upTheirs, upMine, down, plainKept: !!pc.rel[plain.id], heldKept: !!pc.rel[held.id] };
    });
    // expected: +14 halves in 6 years (7); an insult (half-life 4) keeps 0.35 of itself; the +30 line, after a year's fading
    // to 29, closes 30% of the 39-point gap (+12, to 2); the -25 line (half-life 12) fades to 23.6 and pulls +20 down 13
    const ok = r.mill.w === 14 && r.mill.h === 6 && /^The flooded mill: you pulled (him|her) out$/.test(r.mill.t) && r.ins.w < 0 && r.ins.h === 4 && r.topUp &&
      r.millAfter >= 6 && r.millAfter <= 8 && Math.abs(r.insAfter) <= Math.abs(r.ins.w) * 0.4 && r.upTheirs === 2 && r.upMine === 2 && r.down === 7 && !r.plainKept && r.heldKept;
    return { ok, detail: `"${r.mill.t}" weighs +${r.mill.w} (half-life ${r.mill.h}); "${r.ins.t}" ${r.ins.w} (half-life ${r.ins.h}); a second talk tops up: ${r.topUp}; ` +
      `after 6 years +${r.mill.w} → ${r.millAfter}, ${r.ins.w} → ${r.insAfter}; a +30 memory lifts -10 to ${r.upTheirs} (theirs) and ${r.upMine} (yours) in a year; ` +
      `a -25 memory pulls +20 to ${r.down}; after 4 idle years a plain acquaintance kept ${r.plainKept}, one with a +20 memory kept ${r.heldKept}` };
  },

  async bondsHistoryCited(pg) {
    // {history} for any event with ctx.pid; the line under an event about someone you share history with; both escaped
    // and drawn without touching the random stream or the state
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const BD = A.BONDS, pc = BDT.adult(5502), t = BDT.stranger(pc, [], 'F');
      A.link(pc, t, 'friend', 40, 'friend');
      A.bondNote(pc, t, 'You insulted her at the fair', A.S.year - 3, { v: -12, d: 'you insulted her at the <b>fair</b>' });
      A.defEvents([{ id: 'bdt_token', title: 'A meeting', trigger: true, cond: (p, C) => C.adult(p), text: '{them} nods to you. {history}', choices: [{ t: 'Nod back', r: '', fx: {} }, { t: 'Look away', r: '', fx: {} }] },
        { id: 'bdt_plain', title: 'Market day', trigger: true, cond: (p, C) => C.adult(p), text: '{them} is selling eggs.', choices: [{ t: 'Buy some', r: '', fx: {} }, { t: 'Walk on', r: '', fx: {} }] }]);
      A.S.queue = [{ type: 'event', ev: 'bdt_token', ctx: { pid: t.id }, forced: true }];
      const v1 = A.eventView(A.S.queue[0]);
      // nothing to quote: the token is unfilled and the engine drops the event
      const u = BDT.stranger(pc, []); A.link(pc, u, 'acquaint', 0, 'acquaint');
      A.S.queue = [{ type: 'event', ev: 'bdt_token', ctx: { pid: u.id }, forced: true }];
      const dropped = A.eventView(A.S.queue[0]).skip;
      // the aside under a plain event, escaped
      A.S.queue = [{ type: 'event', ev: 'bdt_plain', ctx: { pid: t.id }, forced: true }];
      A.eventView(A.S.queue[0]);
      const rng0 = JSON.stringify(A.rngState), s0 = JSON.stringify(A.S);
      const h = UI.eventModal(A.S.queue[0]);
      const pure = JSON.stringify(A.rngState) === rng0 && JSON.stringify(A.S) === s0;
      return { text: v1.text, dropped, aside: (h.match(/bd-past[^>]*>([^<]*)/) || [])[1] || '', raw: h.includes('<b>fair'), pure };
    });
    const ok = /She has not forgotten \d{4}, when you insulted her at the &lt;b&gt;fair&lt;\/b&gt;|She has not forgotten \d{4}, when you insulted her at the bfair\/b/.test(r.text) || (/She has not forgotten \d{4}, when you insulted her/.test(r.text) && !r.raw);
    return { ok: ok && r.dropped && /^Between you: \d{4}, you insulted her/.test(r.aside) && !r.raw && r.pure,
      detail: `{history}: "${r.text}"; with nothing to quote the event is dropped: ${r.dropped}; under a plain event: "${r.aside}"; markup escaped: ${!r.raw}; render pure: ${r.pure}` };
  },

  async bondsHistoryEvents(pg) {
    // the four scenes that come out of a bond's history: each renders with a real person and its line, within the word
    // diet, and its choices act on the line it cites
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const BD = A.BONDS, out = [];
      const stage = (seed, v, kinLine) => {
        const pc = BDT.adult(seed), t = BDT.stranger(pc, ['proud'], 'M');
        A.link(pc, t, 'acquaint', v > 0 ? 40 : -30, 'acquaint'); t.rel[pc.id].op = v > 0 ? 40 : -30;
        if (kinLine) BD.add(pc, t, 'His father Odo: you lent him 40 suns', { y: A.S.year - 4, v, h: 20, s: 'inh', of: 'father, Odo,', src: 'you lent him 40 suns' });
        else A.bondNote(pc, t, 'You lent him 40 suns', A.S.year - 4, { v, h: 12, d: v > 0 ? 'you lent him 40 suns' : 'you mocked him at the guild' });
        return { pc, t };
      };
      const cases = [['bd_old_kindness', 18, false], ['bd_old_wrong', -18, false], ['bd_kin_grudge', -20, true], ['bd_kin_debt', 14, true]];
      for (const [ev, v, kin] of cases) {
        const n = (A.EV[ev].choices || []).length;
        for (let i = 0; i < n; i++) {
          const { pc, t } = stage(5600 + i, v, kin);
          const w0 = pc.rel[t.id].hist[0].w;
          const res = BDT.choose(ev, { pid: t.id, npcMove: true }, i, true);
          if (res.skip || res.missing) { out.push({ ev, i, skip: !!res.skip, missing: !!res.missing }); continue; }
          const v1 = res.view;
          out.push({ ev, i, text: v1.text, words: BDT.words(v1.text), labels: v1.choices.map(c => BDT.words(c.t)), raw: /\{[A-Za-z0-9_.]+\}/.test(v1.text + v1.choices.map(c => c.t).join('')), w0, w1: pc.rel[t.id].hist[0].w, lines: pc.rel[t.id].hist.length, result: res.text });
          A.S.queue = [];
        }
      }
      return out;
    });
    const bad = r.filter(x => x.skip || x.raw || x.words > 80 || (x.labels || []).some(w => w > 12));
    const apology = r.find(x => x.ev === 'bd_old_wrong' && x.i === 0), defiant = r.find(x => x.ev === 'bd_old_wrong' && x.i === 2), spend = r.find(x => x.ev === 'bd_old_kindness' && x.i === 1);
    const ok = !bad.length && r.length === 14 && apology && Math.abs(apology.w1 - apology.w0 * 0.3) < 1 && defiant && Math.abs(defiant.w1) >= Math.abs(defiant.w0) && spend && Math.abs(spend.w1 - spend.w0 / 2) < 1;
    return { ok, detail: `${r.length} choices played across 4 scenes, ${bad.length} broken; "${(r[0] || {}).text}" (${(r[0] || {}).words} words); ` +
      `an apology settles the wrong ${apology && apology.w0} → ${apology && apology.w1}; defiance keeps it at ${defiant && defiant.w1}; asking a favour spends a kindness ${spend && spend.w0} → ${spend && spend.w1}` +
      (bad.length ? `; BROKEN ${JSON.stringify(bad[0])}` : '') };
  },

  async bondsEveryScene(pg) {
    // every scene of the pack, staged with what it needs (a dead friend, a hidden secret, a blackmailer, a crown with a
    // grudge), renders within the word diet with no raw token, and every choice plays
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const BD = A.BONDS, SEC = BD.SEC, FE = BD.FEUD, out = [];
      const withSecret = pc => { const t = Object.values(A.S.people).find(p => p.alive && A.isAdult(p) && p.id !== pc.id && SEC.of(p) && !pc.rel[p.id]); A.link(pc, t, 'acquaint', 5, 'acquaint'); return t; };
      const other = pc => Object.keys(A.S.realms).find(id => id !== pc.realm && A.S.realms[id].alive && !A.S.realms[id].isRebel);
      const STAGE = {
        bd_grave: pc => { const t = BDT.stranger(pc, [], 'M'); A.link(pc, t, 'friend', 50, 'friend'); A.bondNote(pc, t, 'You nursed him through the fever', A.S.year - 6, { v: 20, h: 25 });
          const k = A.newPerson({ given: 'Wat', sex: 'M', race: t.race, realm: t.realm, cult: t.cult, faith: t.faith, born: A.S.year - 20, status: t.status, home: t.home, parents: [t.id] }); t.children = [k.id];
          A.kill(t, 'old age'); return {}; },
        bd_sec_glimpse: pc => { withSecret(pc); return {}; },
        bd_sec_told: pc => { const o = withSecret(pc), t = BDT.stranger(pc, ['gregarious'], 'F'); A.link(pc, t, 'friend', 50, 'friend'); A.link(t, o, 'friend', 60, 'friend'); return { pid: t.id, npcMove: true }; },
        bd_dig_try: pc => ({ pid: withSecret(pc).id }),
        bd_dig_done: pc => ({ pid: withSecret(pc).id, k: 'dig', sc: 1 }),
        bd_dig_found: pc => ({ pid: withSecret(pc).id, k: 'dig', sc: 1 }),
        bd_lever: pc => { const t = withSecret(pc); SEC.learn(pc, t, 'test'); return { pid: t.id }; },
        bd_lever_refused: pc => { const t = withSecret(pc); SEC.learn(pc, t, 'test'); return { pid: t.id }; },
        bd_blackmail: pc => { const t = withSecret(pc); SEC.learn(pc, t, 'test'); SEC.addMine(pc, 'deed', 'What you did in the matter of the miller\'s well, in 1100.', [t.id]); return { pid: t.id, npcMove: true }; },
        bd_blackmail_again: pc => { const t = withSecret(pc); const s = SEC.addMine(pc, 'deed', 'What you did in the matter of the miller\'s well, in 1100.', [t.id]); return { pid: t.id, mt: s.t, npcMove: true }; },
        bd_feud_envoy: pc => { const o = other(pc); FE.add(o, pc.realm, 'capital', { place: A.realm(o).capital }); FE.add(pc.realm, o, 'heart', { place: 'Thornfield' }); return {}; },
        bd_feud_vow: pc => { const o = other(pc); FE.add(pc.realm, o, 'capital', { place: A.realm(pc.realm).capital }); return {}; },
        bd_feud_tale: pc => { const o = other(pc); FE.add(pc.realm, o, 'sack', { place: A.realm(pc.realm).capital }); return {}; },
      };
      const RULER = new Set(['bd_feud_envoy', 'bd_feud_vow']);
      for (const ev of Object.keys(STAGE)) {
        const n = (A.EV[ev].choices || []).length;
        for (let i = 0; i < n; i++) {
          const pc = BDT.adult(5900 + i, RULER.has(ev) ? { status: 'royal', startAge: 40 } : {});
          if (RULER.has(ev)) { A.makeRuler(pc, pc.realm); const rr = A.realm(pc.realm); rr.treasury = Math.max(rr.treasury || 0, 50000); }
          const ctx = STAGE[ev](pc);
          if (!A.EV[ev].trigger && A.EV[ev].cond && !A.EV[ev].cond(pc, A.C)) { out.push({ ev, i, cond: false }); continue; }
          const res = BDT.choose(ev, ctx, i, i % 2 === 0);
          if (res.skip) { out.push({ ev, i, skip: true, text: res.view && res.view.text }); continue; }
          if (res.missing) { out.push({ ev, i, missing: true }); continue; }   // a choice this staging does not offer (its req)
          const v = res.view;
          out.push({ ev, i, words: BDT.words(v.text), labels: Math.max(...v.choices.map(c => BDT.words(c.t))), raw: /\{[A-Za-z0-9_.]+\}/.test([v.title, v.text, ...v.choices.map(c => c.t), res.text || ''].join(' ')), text: v.text, result: res.text });
        }
      }
      return out;
    });
    const played = r.filter(x => x.words != null), bad = r.filter(x => x.skip || x.cond === false || x.raw || x.words > 80 || x.labels > 12);
    const evs = new Set(played.map(x => x.ev));
    const longest = played.reduce((a, x) => x.words > a.words ? x : a, { words: 0 });
    return { ok: !bad.length && evs.size === 13, detail: `${played.length} choices played in ${evs.size} of 13 scenes (${r.filter(x => x.missing).length} not offered in their staging); ${bad.length} broken; longest text ${longest.words} words (${longest.ev}): "${longest.text}"` +
      (bad.length ? `; BROKEN ${JSON.stringify(bad.slice(0, 3))}` : '') };
  },

  async bondsInRealLives(pg) {
    // bot lives: how much of all opinion change on the player's bonds the memories make by themselves, and how often an
    // event cites what passed between you
    await pg.evaluate(BOT);
    const r = await pg.evaluate(() => {
      const BD = A.BONDS; BD.resetStats();
      let total = 0, inCite = 0;
      const snap = () => { const pc = A.pc(), m = new Map(); if (!pc) return m; for (const id of Object.keys(pc.rel)) { const t = A.P(id); m.set(id + '>', pc.rel[id].op || 0); if (t && t.rel && t.rel[pc.id]) m.set(id + '<', t.rel[pc.id].op || 0); } return m; };
      const diff = (a, b) => { let d = 0; for (const [k, v] of b) d += Math.abs(v - (a.has(k) ? a.get(k) : 0)); return d; };
      const keep = {};
      // a scene that cites a past line: its setup marks ctx.bdCite (this feature's scenes) or ctx.past (21-npc-initiative's)
      const wrap = name => { const f = keep[name] = A[name]; A[name] = function () {
        const q = name === 'eventChoose' ? A.S.queue[0] : null, cite = !!(q && q.ctx && (q.ctx.bdCite || (q.ctx.past && String(q.ctx.past).trim())));
        const pc0 = A.S.pc, a = snap(); const res = f.apply(this, arguments);
        if (A.S.pc === pc0) { const d = diff(a, snap()); total += d; if (cite) inCite += d; } return res; }; };
      const names = ['advance', 'eventChoose', 'doActivity', 'duelClose', 'choiceChoose', 'battleAuto', 'missionAuto', 'duelAuto', 'skipPrompt'].filter(n => typeof A[n] === 'function');
      names.forEach(wrap);
      const lives = [];
      const starts = [['human', 'POL-01', 'artisan'], ['human', 'POL-03', 'merchant'], ['human', 'POL-05', 'peasant'], ['dwarf', 'POL-20', 'artisan'], ['human', 'POL-02', 'noble'], ['orc', 'POL-11', 'peasant']];
      try {
        starts.forEach(([race, realm, status], i) => {
          const L = B.life({ seed: 5700 + i, race, realm, status, sex: i % 2 ? 'F' : 'M', startAge: 16 }, ['careful', 'greedy'][i % 2], i % 2 === 0, 40);
          lives.push(L.years);
        });
      } finally { for (const n of names) A[n] = keep[n]; }
      const years = lives.reduce((a, b) => a + b, 0);
      return { years, lives, total: Math.round(total), pull: Math.round(BD.stats.pull), inCite: Math.round(inCite), led: BD.stats.led, textCites: BD.stats.textCites, bd: BD.stats.cite_bd, past: BD.stats.cite_past, token: BD.stats.cite_token, asides: BD.stats.asides, pidEvents: BD.stats.pidEvents, events: BD.stats.events };
    });
    const pull = 100 * r.pull / Math.max(1, r.total), hist = 100 * (r.pull + r.inCite) / Math.max(1, r.total), led = 100 * r.led / Math.max(1, r.total);
    const perLife = r.textCites / r.lives.length, perDecade = 10 * r.textCites / Math.max(1, r.years);
    const ok = pull >= 10 && perDecade >= 2 && r.bd >= r.lives.length && r.asides > 0;
    return { ok, detail: `${r.lives.length} lives, ${r.years} years: of ${r.total} points of opinion change on the player's bonds (both sides), the yearly pull of memories made ${pull.toFixed(1)}%, ` +
      `${hist.toFixed(1)}% with the choices in scenes that cite a past line; ${led.toFixed(1)}% was written to a dated line; events citing a bond's history in their text: ${r.textCites} ` +
      `(${perLife.toFixed(1)} a life, ${perDecade.toFixed(1)} a decade: ${r.bd} this feature's scenes, ${r.past} 21-npc-initiative's {past}, ${r.token} other), plus ${r.asides} with the "Between you" line, of ${r.pidEvents} events about someone known (${r.events} events in all)`,
      data: r };
  },

  async bondsSecrets(pg) {
    // who hides what follows from who they are, and the draw is pure; you find it, use it at a cost to your honour, and a
    // hold keeps their hostile moves off you
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const BD = A.BONDS, SEC = BD.SEC, pc = BDT.adult(5503);
      // the grown people of a fresh world, and 300 more met in the street
      for (let i = 0; i < 300; i++) { const p = A.makeAcquaintance(pc, 'acquaint'); p.born = A.S.year - 20 - (i % 40); delete pc.rel[p.id]; if (p.rel) delete p.rel[pc.id]; }
      const rng0 = JSON.stringify(A.rngState);
      const ppl = Object.values(A.S.people).filter(p => p.alive && A.isAdult(p) && p.id !== pc.id);
      const kinds = {}; let n = 0, greedyDebt = 0, greedy = 0, plainDebt = 0, plain = 0;
      for (const p of ppl) { const s = SEC.of(p); if (s) { n++; kinds[s.k] = (kinds[s.k] || 0) + 1; } }
      // trait bias, on the same people with their traits swapped
      for (const p of ppl) { const keep = p.traits; p.traits = ['greedy']; const a = SEC.of(p); p.traits = []; const b = SEC.of(p); p.traits = keep; if (a) { greedy++; if (a.k === 'debt') greedyDebt++; } if (b) { plain++; if (b.k === 'debt') plainDebt++; } }
      const again = ppl.every(p => JSON.stringify(SEC.of(p)) === JSON.stringify(SEC.of(p)));
      const pure = JSON.stringify(A.rngState) === rng0;
      // find one: the glimpse, forced to succeed
      const t = ppl.find(p => { const s = SEC.of(p); return s && s.sev === 'criminal'; });
      A.link(pc, t, 'acquaint', 0, 'acquaint'); t.rel[pc.id].op = 0;
      const before = SEC.known(pc, t);
      A.S.queue = [{ type: 'event', ev: 'bd_sec_glimpse', ctx: {}, forced: true }];
      const pick = A.pick; A.pick = L => L.find(x => x.id === t.id) || L[0];
      let g; try { g = BDT.choose('bd_sec_glimpse', {}, 0, true); } finally { A.pick = pick; }
      const found = SEC.known(pc, t);
      // use it: a favour (forced win) costs honour and leaves them owing you, and a strong hold
      const honor0 = pc.honor, fav0 = A.favorsOf(pc, t.id);
      const lv = BDT.choose('bd_lever', { pid: t.id }, 0, true);
      const hold = SEC.hook(pc, t), honorCost = honor0 - pc.honor, favours = A.favorsOf(pc, t.id) - fav0;
      // the hold: in 200 forced months they want no hostile move toward you (21-npc-initiative's desire)
      let hostile = 0, hostileFree = 0;
      if (A.NPCI) {
        t.rel[pc.id].op = -80; t.traits = ['cruel', 'deceitful', 'wrathful', 'greedy'];
        for (let m = 0; m < 200; m++) for (const k of Object.keys(A.NPCI.KINDS)) if (A.NPCI.KINDS[k].g === 'hostile') hostile += A.NPCI.desire(pc, t, k, pc.rel[t.id]).w > 0 ? 1 : 0;
        const keep = pc.bonds.hook[t.id]; delete pc.bonds.hook[t.id];
        for (const k of Object.keys(A.NPCI.KINDS)) if (A.NPCI.KINDS[k].g === 'hostile') hostileFree += A.NPCI.desire(pc, t, k, pc.rel[t.id]).w > 0 ? 1 : 0;
        pc.bonds.hook[t.id] = keep;
      }
      // a refusal, then exposure: their renown falls, their circle cools on them
      const u = ppl.find(p => p !== t && SEC.of(p)); A.link(pc, u, 'acquaint', 0, 'acquaint');
      SEC.learn(pc, u, 'test');
      const fame0 = u.fame || 0, crim = SEC.known(pc, u).sev === 'criminal';
      BDT.choose('bd_lever', { pid: u.id }, 0, false);
      const refusedQueued = A.S.queue.some(q => q.ev === 'bd_lever_refused');
      BDT.choose('bd_lever_refused', { pid: u.id }, 0);
      return { n, of: ppl.length, kinds, greedyDebt: Math.round(100 * greedyDebt / Math.max(1, greedy)), plainDebt: Math.round(100 * plainDebt / Math.max(1, plain)), again, pure,
        before: !!before, found: found && found.t, glimpse: g && g.view && g.view.text, lever: lv.text, hold: hold && hold.until - A.S.year, honorCost, favours, hostile, hostileFree,
        refusedQueued, fameDrop: fame0 - (u.fame || 0), crim, out: !!SEC.known(pc, u).out };
    });
    const share = 100 * r.n / r.of;
    const ok = share >= 25 && share <= 60 && Object.keys(r.kinds).length >= 4 && r.greedyDebt > r.plainDebt && r.again && r.pure && !r.before && !!r.found &&
      r.hold === 10 && r.honorCost >= 3 && r.favours === 2 && (!r.hostileFree || r.hostile === 0) && r.refusedQueued && r.fameDrop >= 6 && r.out;
    return { ok, detail: `${r.n} of ${r.of} grown people hide something (${share.toFixed(0)}%): ${Object.entries(r.kinds).map(([k, v]) => `${k} ${v}`).join(', ')}; a debt is ${r.greedyDebt}% of a greedy person's secrets, ${r.plainDebt}% of a traitless one's; ` +
      `pure and stable: ${r.pure && r.again}; found by a glimpse: "${r.found}"; a favour asked costs ${r.honorCost} honour, leaves ${r.favours} favours owed and a hold for ${r.hold} years; ` +
      `hostile moves wanted in 200 held months: ${r.hostile} (${r.hostileFree} kinds without the hold); a refusal queues the next scene: ${r.refusedQueued}; exposing a ${r.crim ? 'criminal' : 'shunned'} secret costs them ${r.fameDrop} renown` };
  },

  async bondsBlackmail(pg) {
    // your own secrets: a murder nobody saw is yours to keep, unless someone did see; the one who knows may blackmail you
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const BD = A.BONDS, SEC = BD.SEC, pc = BDT.adult(5504);
      const w = BDT.stranger(pc, ['greedy', 'deceitful']); A.link(pc, w, 'acquaint', 0, 'acquaint'); w.rel[pc.id].op = -5;
      const v = BDT.stranger(pc, []); A.link(pc, v, 'acquaint', -30, 'acquaint');
      // the release's murder, forced to succeed and to go uncaught; the witness (one in four) forced to have seen it, and to be w
      const ch = A.chance, pick = A.pick, seen = SEC.SEEN;
      let k = 0; A.chance = p => ++k === 1;   // the attempt succeeds; every later roll fails, so the law does not catch you
      A.pick = L => L.find(x => x && x.id === w.id) || L[0];
      SEC.SEEN = 1;
      let res; try { A.S.time = 9; res = A.interact(v.id, 'murder'); } finally { A.chance = ch; A.pick = pick; SEC.SEEN = seen; }
      const mine = SEC.mine(pc).slice(), knows = SEC.theyKnow(pc, w);
      const want = A.NPCI ? A.NPCI.desire(pc, w, 'bd_blackmail', pc.rel[w.id]).w : 1;
      // the scene: paying costs what they ask; refusing and failing to laugh it off brings it out (and the law)
      const coin0 = pc.coin;
      const paid = BDT.choose('bd_blackmail', { pid: w.id, npcMove: true }, 0);
      const cost = coin0 - pc.coin;
      const fame0 = pc.fame || 0, honor0 = pc.honor;
      const refused = BDT.choose('bd_blackmail', { pid: w.id, npcMove: true }, 1, false);
      return { msg: res && res.msg, dead: !v.alive, mine: mine.map(s => s.t), witness: !!knows, want: Math.round(want * 100) / 100, paid: paid.view && paid.view.text, cost, words: BDT.words(paid.view && paid.view.text),
        out: SEC.mine(pc).some(s => s.out), honorLoss: honor0 - pc.honor, prison: !!pc.prison || !pc.alive || /hang|prison|fine|flog|exile|gallows|stocks|blood-price/i.test(String(refused.text || '')), refused: refused.text };
    });
    const ok = r.dead && r.mine.length === 1 && r.witness && r.want > 0 && r.cost > 0 && r.out && r.honorLoss >= 8 && r.prison && r.words <= 80;
    return { ok, detail: `"${r.msg}"; your secret: "${r.mine[0]}"; the witness knows it: ${r.witness}, wants to blackmail you (desire ${r.want}); "${r.paid}" (${r.words} words); paying cost ${r.cost}; ` +
      `refusing and failing to laugh it off: out ${r.out}, honour −${r.honorLoss}, the law: ${r.prison} ("${r.refused}")` };
  },

  async bondsDigScheme(pg) {
    // through 39-schemes: "Plot: dig into their past" runs as a scheme and its last move is this feature's scene
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const BD = A.BONDS, SEC = BD.SEC, SC = A.SCHEMES, pc = BDT.adult(5505);
      const t = Object.values(A.S.people).find(p => p.alive && A.isAdult(p) && p.id !== pc.id && SEC.of(p) && !pc.rel[p.id]);
      A.link(pc, t, 'acquaint', 0, 'acquaint');
      if (!SC || !SC.KINDS.dig) {
        const opts = A.interactOptions(pc, t);
        const res = BDT.choose('bd_dig_try', { pid: t.id }, 1);
        return { schemes: false, button: opts.includes('bd_dig'), found: !!SEC.known(pc, t), text: res.view && res.view.text };
      }
      const opts = A.interactOptions(pc, t);
      const res = A.interact(t.id, 'sc_dig');
      const s = SC.list(pc).find(x => x.t === t.id);
      let months = 0, scene = null;
      const risk = SC.risk; SC.risk = () => 0;
      try {
        for (; months < 40 && !scene; months++) {
          for (const f of A.onMonth) try { f(pc); } catch (e) {}
          const q = A.S.queue.find(x => x.ev === 'bd_dig_done' || x.ev === 'sch_opening');
          if (q && q.ev === 'sch_opening') { A.S.queue = [q]; A.eventView(q); A.eventChoose(A.eventView(q).choices.findIndex(c => c.i === 1)); A.eventClose(); }
          else if (q) scene = q;
        }
      } finally { SC.risk = risk; }
      let text = '';
      if (scene) { A.S.queue = [scene]; const v = A.eventView(scene); text = v.text; A.eventChoose(v.choices.findIndex(c => c.i === 0)); A.eventClose(); }
      return { schemes: true, button: opts.includes('sc_dig'), started: !!s, est: s ? SC.monthsLeft(pc, { k: 'dig', t: t.id, prog: 0 }) : 0, months, scene: !!scene, text, found: !!SEC.known(pc, t), ended: !SC.list(pc).some(x => x.t === t.id) };
    });
    const ok = r.schemes ? r.button && r.started && r.scene && r.found && r.ended : r.button && r.found;
    return { ok, detail: r.schemes ? `button shown ${r.button}; the plot ran ${r.months} months (estimated ${r.est}) and closed with "${r.text}"; secret found ${r.found}` : `no schemes in this build: the dig button ${r.button}, found ${r.found}: "${r.text}"` };
  },

  async bondsKin(pg) {
    // kin remember a killing; the dead leave their memories to their children; your heir inherits what people felt for you
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const BD = A.BONDS, pc = BDT.adult(5506, { sex: 'M', startAge: 40 });
      // a man with a wife and two grown children, killed in a duel to the death
      const v = BDT.stranger(pc, [], 'M');
      const mk = (sex, born, rel) => { const k = A.newPerson({ given: sex === 'F' ? 'Agna' : 'Bors', sex, race: v.race, realm: v.realm, cult: v.cult, faith: v.faith, born, status: v.status, home: v.home, parents: rel === 'child' ? [v.id] : [] }); return k; };
      const wife = mk('F', A.S.year - 38), son = mk('M', A.S.year - 18, 'child'), daughter = mk('F', A.S.year - 16, 'child');
      v.spouse = wife.id; wife.spouse = v.id; v.children = [son.id, daughter.id];
      A.link(pc, v, 'rival', -20, 'rival');
      BD.blaming(v.id, 'duel', () => A.kill(v, 'a fight with you'));
      const kin = [wife, son, daughter].map(k => ({ op: k.rel[pc.id] ? k.rel[pc.id].op : null, type: pc.rel[k.id] && pc.rel[k.id].type, line: pc.rel[k.id] && Object.assign({}, (pc.rel[k.id].hist || []).slice(-1)[0]) }));
      // a friend you did right by dies of old age: his son takes up the memory, and its pull, at half weight
      const f = BDT.stranger(pc, [], 'M'); A.link(pc, f, 'friend', 60, 'friend');
      A.bondNote(pc, f, 'You pulled him out of the river', A.S.year - 5, { v: 30, h: 25, d: 'you pulled him out of the river' });
      const fs = mk('M', A.S.year - 20, 'child'); fs.parents = [f.id]; f.children = [fs.id];
      A.kill(f, 'old age');
      const inhLine = pc.rel[fs.id] && (pc.rel[fs.id].hist || []).slice(-1)[0], inh = inhLine && Object.assign({}, inhLine);
      const cite = inh ? BD.citeLine(pc, fs, inh) : '';
      fs.rel[pc.id].op = 0; BD.state(pc).y = A.S.year; BDT.yearOn(pc);
      const inhOp = fs.rel[pc.id].op;
      // the heir: a woman who hates the father (-40 remembered) meets his son as an enemy of the house
      const h = BDT.stranger(pc, [], 'F'); A.link(pc, h, 'enemy', -40, 'enemy');
      A.bondNote(pc, h, 'You insulted her at her own wedding', A.S.year - 6, { v: -35, h: 25, d: 'you insulted her at her own wedding' });
      const heir = A.newPerson({ given: 'Edric', sex: 'M', race: pc.race, realm: pc.realm, cult: pc.cult, faith: pc.faith, born: A.S.year - 20, status: pc.status, home: pc.home, parents: [pc.id] });
      pc.children.push(heir.id); A.link(pc, heir, 'child', 60, 'father');
      A.kill(pc, 'old age');
      A.continueAs(heir.id);
      const me = A.pc(), hlLine = me.rel[h.id] && (me.rel[h.id].hist || []).slice(-1)[0], hl = hlLine && Object.assign({}, hlLine);
      const hc = hl ? BD.citeLine(me, h, hl) : '';
      h.rel[me.id] = h.rel[me.id] || { type: 'acquaint', op: 0 }; h.rel[me.id].op = 0; BD.state(me).y = A.S.year; BDT.yearOn(me);
      return { kin, inh: inh && { t: inh.t, w: inh.w }, cite, inhOp, heirLine: hl && { t: hl.t, w: hl.w }, heirCite: hc, heirOp: h.rel[me.id].op };
    });
    const kinOk = r.kin.length === 3 && r.kin.every(k => k.op != null && k.op <= -45 && k.type === 'enemy' && k.line && /^You killed (her|his) (husband|father), /.test(k.line.t) && k.line.w === -45);
    const ok = kinOk && r.inh && r.inh.w === 15 && /knows what you did for his father, .+, in \d{4}: you pulled him out of the river/.test(r.cite) && r.inhOp >= 4 &&
      r.heirLine && r.heirLine.w <= -20 && /has not forgotten \d{4}, when \w+, your father, insulted her at her own wedding/.test(r.heirCite) && r.heirOp <= -6;
    return { ok, detail: `after a death in a duel: ${r.kin.map(k => `${k.type} ${k.op} "${k.line && k.line.t}"`).join('; ')}; a friend's son inherits "${r.inh && r.inh.t}" (+${r.inh && r.inh.w}): "${r.cite}", and in a year his opinion goes 0 → ${r.inhOp}; ` +
      `the heir inherits "${r.heirLine && r.heirLine.t}" (${r.heirLine && r.heirLine.w}): "${r.heirCite}"; her opinion of the heir 0 → ${r.heirOp} in a year` };
  },

  async bondsFeudInherited(pg) {
    // a grudge for a capital taken outlives the ruler who lost it, and moves the AI's choices: an alliance it would
    // seek, and its odds of attacking that neighbour
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const BD = A.BONDS, FE = BD.FEUD;
      BDT.adult(5507, { realm: 'POL-05' });
      // decisions: (1) the alliance A.diploAI would seek: Math.min(interest(x, y), interest(y, x) + 10) against the ruler's bar.
      // Find a pair of realms that would ally today, give x a grudge from forty years ago (y took its capital under the
      // ruler of that time), let x's ruler die, and ask again
      // (a new ruler has a new character, so a pair is kept only if, under the successor, it would still ally without the grudge)
      const allyV = (x, y) => Math.min(A.interest(x, y), A.interest(y, x) + 10), barOf = x => A.aiAllyBar ? A.aiAllyBar(x) : 48;
      const ids = Object.values(A.S.realms).filter(x => x.alive && !x.isRebel && x.id !== A.pc().realm).map(x => x.id), save = A.serialize();
      let al = null, v0 = null, vOn = null, vOff = null, bar = null, allyHeir = null, tries = 0;
      for (const x of ids) for (const y of ids) {
        if (al || x === y || tries > 12) continue;
        const rx = A.realm(x), ry = A.realm(y);
        if (rx.allies.includes(y) || ry.allies.length >= 3 || A.hostile(x, y)) continue;
        const v = allyV(x, y);
        if (!(v >= barOf(x) + 2 && v < barOf(x) + 18 && A.interest(x, y) <= A.interest(y, x) + 10)) continue;
        tries++;
        const g = FE.add(x, y, 'capital', { place: rx.capital }); g.y = A.S.year - 40;
        A.rulerDies(rx, 'old age');
        const on = allyV(x, y); FE.ON = false; const off = allyV(x, y); FE.ON = true;
        if (off >= barOf(x)) { al = { x: rx, y: ry }; v0 = v; vOn = on; vOff = off; bar = barOf(x); allyHeir = FE.origin(g); }
        else { A.deserialize(JSON.parse(save)); }
      }
      const live = Object.values(A.S.realms).filter(x => x.alive && !x.isRebel && x.id !== A.pc().realm);
      let a = null, b = null;
      for (const x of live) { if (al && x.id === al.x.id) continue; const n = A.neighbors(x.id).map(A.realm).find(y => y && y.alive && !y.isRebel && y.id !== A.pc().realm && A.realmProvs(x.id).length >= 3); if (n) { a = x; b = n; break; } }
      // b takes a's capital
      const cap = A.prov(a.capitalProv), capName = cap.name, ruler0 = A.P(a.ruler);
      A.transferProv(cap, b.id, true);
      const e = FE.list(a.id, b.id).find(x => x.k === 'capital');
      const origin0 = FE.origin(e);
      // the ruler dies; the next one inherits
      A.rulerDies(a, 'old age');
      const ruler1 = A.P(a.ruler);
      const origin1 = FE.origin(e), parts = A.opinionParts(a.id, b.id).map(x => x[0] + ' ' + x[1]), offer = A.interestParts(a.id, b.id).map(x => x[0] + ' ' + x[1]);
      // (2) the odds a's ruler declares war on b in A.aiWarCheck, read from the dice it rolls
      A.setRelPair(a.id, b.id, -20);
      const odds = on => {
        FE.ON = on;
        const S = A.S, keep = { wars: S.wars, chance: A.chance, preview: A.warPreview, shuffle: A.shuffle, rest: a.aiLastWar, ex: a.exhaustion, st: a.stability, tr: Object.assign({}, a.truce || {}) };
        S.wars = []; a.aiLastWar = null; a.exhaustion = 0; a.stability = 80; a.truce = {};
        let pair = null, p = null;
        A.shuffle = L => L.slice().sort((x, y) => (x === a.id || x === b.id || (x && x.id === a.id) ? -1 : 0) - (y === a.id || y === b.id || (y && y.id === a.id) ? -1 : 0));
        A.warPreview = function (x, y) { pair = x + '>' + y; return keep.preview.apply(this, arguments); };
        A.chance = q => { if (pair === a.id + '>' + b.id && p == null) p = q; return false; };
        try { A.aiWarCheck(); } finally { S.wars = keep.wars; A.chance = keep.chance; A.warPreview = keep.preview; A.shuffle = keep.shuffle; a.aiLastWar = keep.rest; a.exhaustion = keep.ex; a.stability = keep.st; a.truce = keep.tr; FE.ON = true; }
        return p;
      };
      const pOn = odds(true), pOff = odds(false), mul = A.feudWarMul(a.id, b.id);
      const why = A.aiWhyWar ? A.aiWhyWar(a.id, b.id, A.warPreview(a.id, b.id), A.relBetween(a.id, b.id), null).map(x => x[0]) : [];
      return { a: a.short, b: b.short, capName, ruler0: ruler0 && ruler0.given, ruler1: ruler1 && ruler1.given, w: e && e.w, origin0, origin1, heirs: e ? e.heirs.length : 0, parts: parts.filter(x => /capital/.test(x)), offer: offer.filter(x => /grudge|Opinion/.test(x)),
        ax: al && al.x.short, ay: al && al.y.short, v0: v0 != null ? Math.round(v0) : null, vOn: vOn != null ? Math.round(vOn) : null, vOff: vOff != null ? Math.round(vOff) : null, bar: bar != null ? Math.round(bar) : null, allyHeir,
        pOn, pOff, mul: Math.round(mul * 100) / 100, why: why.filter(x => /grudge/.test(x)) };
    });
    const ok = r.w === -35 && r.heirs === 1 && r.ruler0 !== r.ruler1 && /carried by/.test(r.origin1) && r.parts.length === 1 && r.offer.some(x => /grudge/.test(x)) &&
      r.v0 >= r.bar && r.vOff >= r.bar && r.vOn < r.bar && /carried by/.test(r.allyHeir || '') && r.pOn != null && r.pOff != null && r.pOn > r.pOff * 1.5;
    return { ok, detail: `${r.b} takes ${r.a}'s capital ${r.capName}: "${r.origin0}" (${r.w}); ${r.ruler0} dies and ${r.ruler1} succeeds: "${r.origin1}"; tooltip "${r.parts[0]}"; offer reasons ${r.offer.join(' / ')}; ` +
      `${r.ax} would ally with ${r.ay} (${r.v0} against a bar of ${r.bar}); after "${r.allyHeir}" it stands at ${r.vOn} with the ledger read, ${r.vOff} with it ignored; ` +
      `odds of war a month on ${r.b}: ${r.pOff && r.pOff.toFixed(4)} → ${r.pOn && r.pOn.toFixed(4)} (×${(r.pOn / r.pOff).toFixed(2)}, vengeance ×${r.mul}); war log: "${r.why[0] || ''}"` };
  },

  async bondsFeudWorlds(pg) {
    // whole worlds: the ledger forms by itself and outlives rulers; then, on the same final state, the AI's own decision
    // functions with the ledger read and ignored, for every grudge it holds (no divergence between the two)
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const FE = A.BONDS.FEUD, out = { active: 0, carried: 0, kinds: {}, deaths: 0, wars: 0, grudgeWars: 0, pairs: 0, dInterest: 0, allyFlips: 0, allyBefore: 0, warBarFlips: 0, nbPairs: 0 };
      for (const seed of [5801, 5802]) {
        A.newGame({ seed, race: 'elf', realm: 'POL-06', status: 'gentry', sex: 'F', startAge: 120 });
        const onWar = (w, opts) => { if (opts && opts.silent || w.leadA === A.pc().realm) return; out.wars++; if (FE.sum(w.leadA, w.leadD) <= -10) out.grudgeWars++; };
        const onDie = () => { out.deaths++; };
        A.on('warStart', onWar); A.on('rulerDied', onDie);
        try {
          const end = A.S.year + 50;
          for (let g = 0; g < 20000 && A.S.year < end; g++) {
            const res = A.advance(400); let h, n = 0;
            while ((h = A.headReady()) && n++ < 300) { if (h.type === 'event') A.eventAuto(); else if (h.type === 'choice') A.choiceChoose(0); else if (h.type === 'duel') { A.duelAuto(h.d); A.duelClose(); } else if (h.type === 'battle') { A.battleAuto(h.b); if (A.S.queue[0] === h) A.S.queue.shift(); } else A.skipPrompt(); }
            if (res.why === 'dead' || !A.pc() || !A.pc().alive) break;
          }
        } finally { A.HOOKS.warStart = A.HOOKS.warStart.filter(f => f !== onWar); A.HOOKS.rulerDied = A.HOOKS.rulerDied.filter(f => f !== onDie); }
        for (const id of Object.keys(A.S.realms)) {
          const x = A.S.realms[id];
          for (const b of Object.keys(x.feud || {})) {
            for (const e of x.feud[b]) { if (Math.abs(e.w) < 2) continue; out.active++; out.kinds[e.k] = (out.kinds[e.k] || 0) + 1; if ((e.heirs || []).length) out.carried++; }
            const y = A.realm(b);
            if (!x.alive || x.isRebel || !y || !y.alive || FE.sum(id, b) > -10) continue;
            // the same state, the ledger read and then ignored
            out.pairs++;
            const ally = () => Math.min(A.interest(id, b), A.interest(b, id) + 10), bar = A.aiAllyBar ? A.aiAllyBar(id) : 48, warBar = A.aiWarBar ? A.aiWarBar(id) : -25;
            const iOn = A.interest(id, b), aOn = ally(), relOn = A.relBetween(id, b);
            FE.ON = false; const iOff = A.interest(id, b), aOff = ally(), relOff = A.relBetween(id, b); FE.ON = true;
            out.dInterest += iOn - iOff;
            if (aOff >= bar) { out.allyBefore++; if (aOn < bar) out.allyFlips++; }
            if (A.neighbors(id).includes(b)) { out.nbPairs++; if (relOff > warBar && relOn <= warBar) out.warBarFlips++; }
          }
        }
      }
      return out;
    });
    // the pass: the ledger forms by itself, a fifth of it outlives the ruler who suffered it, and the AI's own interest
    // reads it; the flips are reported, not required (they turn on how close each pair stood to a bar)
    const ok = r.active >= 20 && r.carried >= 0.2 * r.active && r.pairs >= 5 && r.dInterest / Math.max(1, r.pairs) <= -6;
    return { ok, detail: `two worlds of 50 years: ${r.active} feud lines held at the end (${Object.entries(r.kinds).map(([k, v]) => `${k} ${v}`).join(', ')}), ${r.carried} of them carried past a ruler's death (${r.deaths} rulers died); ` +
      `${r.grudgeWars} of ${r.wars} AI wars were declared on a realm the attacker held in grudge. On the final state, for the ${r.pairs} grudges of 10 or more: the ledger moves the holder's interest in the other by ${(r.dInterest / Math.max(1, r.pairs)).toFixed(1)} on average; ` +
      `of ${r.allyBefore} pairs that would ally without it, ${r.allyFlips} would not; of ${r.nbPairs} neighbours, ${r.warBarFlips} pass from war unthinkable to thinkable`, data: r };
  },

  async bondsOnScreen(pg) {
    // the person view shows the weighed history, what you know of them and what they know of you; the Realm tab shows
    // the long memories with their origins; all escaped and drawn without a die or a change of state
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const BD = A.BONDS, SEC = BD.SEC, pc = BDT.adult(5508);
      const t = Object.values(A.S.people).find(p => p.alive && A.isAdult(p) && p.id !== pc.id && SEC.of(p));
      A.link(pc, t, 'acquaint', 0, 'acquaint');
      A.bondNote(pc, t, 'You lent <img src=x data-pwn=1> 40 suns', A.S.year - 2, { v: 12 });
      SEC.learn(pc, t, 'test');
      SEC.addMine(pc, 'deed', 'What you did at <b>the mill</b>, in 1100.', [t.id]);
      const o = Object.keys(A.S.realms).find(id => id !== pc.realm && A.S.realms[id].alive);
      BD.FEUD.add(pc.realm, o, 'heart', { place: '<i>Thornfield</i>' });
      UI.personModal(t); UI.TAB.realm(pc);
      const rng0 = JSON.stringify(A.rngState), s0 = JSON.stringify(A.S);
      const h = UI.personModal(t), rt = UI.TAB.realm(pc);
      const pure = JSON.stringify(A.rngState) === rng0 && JSON.stringify(A.S) === s0;
      // markup never reaches state: lines, secrets and places are kept with < > " stripped, and escaped again when drawn
      return { pure, hist: /What has passed between you/.test(h) && /\+12/.test(h), know: /What you know of/.test(h), they: /knows:<\/b> What you did at b?the mill/.test(h), raw: /<img src=x|<b>the mill|<i>Thornfield/.test(h + rt), card: /Long memories of/.test(rt) && /Took i?Thornfield/.test(rt), lever: A.interactOptions(pc, t).includes('bd_lever') };
    });
    return { ok: r.pure && r.hist && r.know && r.they && !r.raw && r.card && r.lever,
      detail: `history with weights ${r.hist}; what you know of them ${r.know}; what they know of you ${r.they}; "Use what you know" offered ${r.lever}; realm card ${r.card}; escaped ${!r.raw}; render pure ${r.pure}` };
  },

  async bondsOldSave(pg) {
    // a save from before this feature (no weights, no pc.bonds, no feud ledgers) loads and plays five years
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = BDT.adult(5509);
      const t = BDT.stranger(pc, []); A.link(pc, t, 'friend', 40, 'friend'); pc.rel[t.id].hist = [{ y: A.S.year - 1, t: 'An old line' }];
      const raw = JSON.parse(A.serialize());
      for (const p of Object.values(raw.people || {})) { delete p.bonds; for (const id in p.rel || {}) if (p.rel[id].hist) p.rel[id].hist = p.rel[id].hist.map(e => ({ y: e.y, t: e.t })); }
      for (const x of Object.values(raw.realms || {})) delete x.feud;
      A.deserialize(raw);
      // the old weightless line is shown as it was, and weighs nothing
      const shown = /An old line/.test(UI.personModal(A.P(t.id))), M = A.BONDS.mem(A.pc(), A.P(t.id));
      const st = T.play(5);
      return { st, alive: !!A.pc(), year: A.S.year, shown, M };
    });
    return { ok: r.alive && r.shown && r.M === 0, detail: `loaded: the old line is shown ${r.shown} and weighs ${r.M}; played on to ${r.year} (${r.st})` };
  },
};
