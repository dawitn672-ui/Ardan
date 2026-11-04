// Memory weave (67): choices leave memories; scenes that come later read them and change.
const SETUP = () => {
  window.MWT = {
    // a grown player with a known person to stage scenes with
    adult(seed) {
      T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 24 });
      const pc = A.pc(); pc.alive = true; pc.prison = null;
      return pc;
    },
    stranger(pc) { const t = A.makeAcquaintance(pc, 'acquaint'); A.link(pc, t, 'acquaint', 0, 'acquaint'); return t; },
    // test scenes: never rolled (cond false), queued by hand
    defs() {
      if (A.EV.mwt_river) return;
      A.defEvents([
        { id: 'mwt_river', title: 'The flooded mill', cond: () => false, w: 0, text: 'The millrace is over its banks and {them} is in it to the waist.',
          choices: [{ t: 'Pull him out', r: 'You pull.', fx: { them: { op: 14 } } }, { t: 'Laugh and walk on', r: 'You walk on.', fx: { them: { op: -12 } } }] },
        { id: 'mwt_ask', title: 'A word at the gate', cond: () => false, w: 0, text: '{them} stands at the gate with a request.',
          choices: [{ t: 'Talk it over', check: { s: 'persuasion', d: 45 }, win: { r: 'Agreed.' }, lose: { r: 'No.' } }, { t: 'Send {them} away', r: 'Gone.' }] },
        { id: 'mwt_toll', title: 'The toll at the bridge', cond: () => false, w: 0, text: 'A toll-keeper wants more than the posted price.',
          choices: [{ t: 'Argue the price down', check: { s: 'persuasion', d: 45 }, win: { r: 'He gives way.', fx: { coin: 5 } }, lose: { r: 'He laughs.', fx: { coin: -40 } } }, { t: 'Pay', r: 'You pay.', fx: { coin: -10 } }] },
        { id: 'mwt_mark', title: 'A fair stall', cond: () => false, w: 0, text: 'A stall at the market sells knives.',
          choices: [{ t: 'Haggle hard', check: { s: 'trade', d: 45 }, win: { r: 'Cheap.' }, lose: { r: 'Dear.' } }, { t: 'Walk past', r: 'You walk past.' }] },
      ]);
    },
    // play one queued scene: draw it, choose, close; returns the drawn view
    scene(ev, ctx, pick = 0, force) {
      const q = { type: 'event', ev, ctx: Object.assign({}, ctx || {}) };
      A.S.queue.unshift(q);
      const v = JSON.parse(JSON.stringify(A.eventView(q)));
      if (force != null) { const ra = A.rand; A.rand = () => force; try { A.eventChoose(pick); } finally { A.rand = ra; } } else A.eventChoose(pick);
      A.eventClose();
      return { v, q };
    },
    peek(ev, ctx) { const q = { type: 'event', ev, ctx: Object.assign({}, ctx || {}) }; A.S.queue.unshift(q); const v = JSON.parse(JSON.stringify(A.eventView(q))); A.S.queue.shift(); return { v, q }; },
    words: s => (String(s || '').match(/\S+/g) || []).length,
  };
};

export default {
  async mwRecordsChoices(pg) {
    // a choice leaves a line: who, what, when, the kind of scene, the check and how it went, what it did
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      MWT.defs(); const pc = MWT.adult(6701), t = MWT.stranger(pc), y = A.S.year; pc.coin = 150;
      const none = pc.mw === undefined;
      MWT.scene('mwt_river', { pid: t.id }, 0);
      MWT.scene('mwt_toll', {}, 0, 0.999);    // the check is lost
      const m = pc.mw.m;
      return { none, n: m.length, a: m[0], b: m[1], last: pc.mw.last.mwt_toll, y, json: JSON.stringify(pc.mw).length };
    });
    const a = r.a || {}, b = r.b || {};
    const ok = r.none && r.n === 2 && a.p && a.y === r.y && (a.k || []).includes('kind') && /pulled him out/.test(a.d || '') && b.s === 'persuasion' && b.ok === 0 &&
      (b.k || []).includes('loss') && b.n === -40 && b.sh === 'road' && /tried to argue/.test(b.d || '') && r.last && r.last[1] === 0 && r.last[2] === 0;
    return { ok, detail: `no record before: ${r.none}; after two choices ${r.n} lines (${r.json} bytes): ${JSON.stringify(a)}; ${JSON.stringify(b)}; last toll choice ${JSON.stringify(r.last)}` };
  },

  async mwWeaveOnlyWithMemory(pg) {
    // each of the four rules changes the scene when its memory exists, and leaves it exactly as it was otherwise
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      MWT.defs();
      // without memories: the same scenes, untouched
      let pc = MWT.adult(6702), t = MWT.stranger(pc);
      const bare = { ask: MWT.peek('mwt_ask', { pid: t.id }).v, toll: MWT.peek('mwt_toll', {}).v, mark: MWT.peek('mwt_mark', {}).v };
      const bareMw = [MWT.peek('mwt_ask', { pid: t.id }).q.ctx.mw, MWT.peek('mwt_toll', {}).q.ctx.mw];
      // with them
      pc = MWT.adult(6702); t = MWT.stranger(pc);
      const y0 = A.S.year;
      MWT.scene('mwt_river', { pid: t.id }, 0);           // a kindness to t
      MWT.scene('mwt_toll', {}, 0, 0.001);                 // won a persuasion check on the road
      MWT.scene('mwt_mark', {}, 0, 0.999);                 // lost a trade check at market, the same year
      A.S.year++;
      const person = MWT.peek('mwt_ask', { pid: t.id });  // person rule: +6 on the check
      const again = MWT.peek('mwt_toll', {});              // again rule: label (as in y0), +6 on the won check
      const s2 = MWT.peek('mwt_mark', {});                 // again rule as well (the same scene), +3 on a lost check
      const t2 = MWT.stranger(pc);
      const skill = MWT.peek('mwt_ask', { pid: t2.id });  // a stranger: the skill rule, from the toll
      return { y0, bare, bareMw, person: person.v, pr: person.q.ctx.mw.r, again: again.v, ar: again.q.ctx.mw.r, s2: s2.v, skill: skill.v, sr: skill.q.ctx.mw && skill.q.ctx.mw.r, name: t.given };
    });
    const Y = String(r.y0);
    const pOk = r.pr === 'person' && r.person.text.includes(Y) && r.person.text.includes(r.name) && /pulled him out/.test(r.person.text) && r.person.choices[0].odds === r.bare.ask.choices[0].odds + 6;
    const aOk = r.ar === 'again' && r.again.text.includes(Y) && r.again.choices[0].t.endsWith(`(as in ${Y})`) && r.again.choices[0].odds === r.bare.toll.choices[0].odds + 6;
    const mOk = r.s2.choices[0].odds === r.bare.mark.choices[0].odds + 3 && r.s2.text.includes(Y);
    const sOk = r.sr === 'skill' && r.skill.text.includes(Y) && /argued the price down/.test(r.skill.text) && r.skill.choices[0].odds === r.bare.ask.choices[0].odds + 5;
    const bareOk = !r.bareMw[0] && !r.bareMw[1] && !/\b1\d{3}\b/.test(r.bare.ask.text + r.bare.toll.text);
    return { ok: pOk && aOk && mOk && sOk && bareOk,
      detail: `without memory: no weave (${bareOk}); person ${pOk}: "${r.person.text}" odds ${r.bare.ask.choices[0].odds}→${r.person.choices[0].odds}; again ${aOk}: "${r.again.text}" / "${r.again.choices[0].t}" ${r.bare.toll.choices[0].odds}→${r.again.choices[0].odds}; ` +
        `again after a loss ${mOk}: ${r.bare.mark.choices[0].odds}→${r.s2.choices[0].odds}; skill ${sOk}: "${r.skill.text}" ${r.bare.ask.choices[0].odds}→${r.skill.choices[0].odds}` };
  },

  async mwOddsAreTheOddsPlayed(pg) {
    // the shown odds are the odds rolled: with the person memory, a draw of 0.53 wins where the bare odds would lose
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      MWT.defs();
      const pc = MWT.adult(6703), t = MWT.stranger(pc);
      const bare = MWT.peek('mwt_ask', { pid: t.id }).v.choices[0].odds;
      MWT.scene('mwt_river', { pid: t.id }, 0); A.S.year++;
      const shown = MWT.peek('mwt_ask', { pid: t.id }).v.choices[0].odds;
      const draw = (bare + 1) / 100;   // loses at the bare odds, wins at the shown ones
      const { q } = MWT.scene('mwt_ask', { pid: t.id }, 0, draw - 1e-9);
      return { bare, shown, won: q.result.success };
    });
    return { ok: r.shown === r.bare + 6 && r.won === true, detail: `bare ${r.bare}%, shown ${r.shown}%, a draw just past the bare odds wins: ${r.won}` };
  },

  async mwReleaseEventsChange(pg) {
    // real release scenes, picked from the most fired in bot lives: staged with and without a memory
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      MWT.defs();
      const ids = Object.keys(A.EV).filter(id => { const e = A.EV[id]; return !/^mwt_/.test(id) && !(A.EV_RETIRED && A.EV_RETIRED.has(id)) && (e.choices || []).some(c => c.check && c.check.s === 'persuasion') && typeof e.text === 'string' && !e.trigger; }).slice(0, 40);
      const out = [];
      for (const id of ids) {
        let pc = MWT.adult(6704);
        const bare = MWT.peek(id, {});
        if (bare.v.skip) continue;
        pc = MWT.adult(6704);
        MWT.scene('mwt_toll', {}, 0, 0.001); A.S.year++;
        const w = MWT.peek(id, {});
        out.push({ id, bare: bare.v.text, woven: w.v.text, mw: w.q.ctx.mw ? w.q.ctx.mw.r : null, off: !!(w.q.ctx.mw && w.q.ctx.mw.off), words: MWT.words(w.v.text), raw: T.raw.test(w.v.text + w.v.choices.map(c => c.t).join(' ')) });
      }
      return out;
    });
    const woven = r.filter(x => x.mw && !x.off), changed = woven.filter(x => x.woven !== x.bare), long = r.filter(x => x.words > 80), raw = r.filter(x => x.raw);
    return { ok: woven.length >= 10 && changed.length === woven.length && !long.length && !raw.length,
      detail: `${r.length} release scenes with a persuasion check: ${woven.length} woven from a won toll argument, all changed: ${changed.length === woven.length}; the rest dropped for length (${r.filter(x => x.off).length}); over 80 words ${long.length}; raw tokens ${raw.length}; e.g. ${woven[0] ? woven[0].id + ': "' + woven[0].woven + '"' : '-'}` };
  },

  async mwRenderPure(pg) {
    // drawing a woven scene, and every tab, moves neither the random stream nor the state
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      MWT.defs();
      const pc = MWT.adult(6705), t = MWT.stranger(pc);
      MWT.scene('mwt_river', { pid: t.id }, 0); A.S.year++;
      const q = { type: 'event', ev: 'mwt_ask', ctx: { pid: t.id } }; A.S.queue.unshift(q);
      A.eventView(q);   // the engine's first drawing (the setup) has run
      T.renderAll();    // and the screens' own harmless first-draw setup (an empty cargo hold), as in 01-replay
      const before = A.rngState, h0 = T.hash(A.S);
      UI.render(); T.renderAll(); UI.render(); A.eventView(q);
      const html = UI.eventModal ? UI.eventModal(q) : '';
      return { rng: A.rngState === before, same: T.hash(A.S) === h0, shown: html.includes(String(A.S.year - 1)), mw: !!q.ctx.mw };
    });
    return { ok: r.rng && r.same && r.mw && r.shown, detail: `woven ${r.mw}, on screen ${r.shown}; random stream untouched ${r.rng}; state untouched ${r.same}` };
  },

  async mwReplay(pg) {
    // the same seed and the engine's own choices reach the same world twice, with the record read along the way
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const run = () => {
        T.enter({ seed: 6706, race: 'human', realm: 'POL-05', status: 'merchant', sex: 'F', startAge: 18 });
        let woven = 0;
        T.play(10, { onEvent: v => {} , each: () => {} });
        woven = A.MW.stats.woven;
        return { h: T.hash(A.S.people) + ':' + T.hash(A.S.realms) + ':' + A.rngState, lines: (A.pc().mw || { m: [] }).m.length, woven };
      };
      A.MW.stats.woven = 0; const a = run(); A.MW.stats.woven = 0; const b = run();
      return { a, b };
    });
    return { ok: r.a.h === r.b.h && r.a.lines > 0, detail: `${r.a.h === r.b.h ? 'same world' : 'worlds differ'}; ${r.a.lines} memory lines, ${r.a.woven} scenes woven in 10 years` };
  },

  async mwSaves(pg) {
    // the record survives a save exactly; a save from before this feature (no pc.mw) loads and plays on
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 6707, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      T.play(6);
      const lines = (A.pc().mw || { m: [] }).m.length;
      const enc = await SAVES.encode(A.S, A.J), d = await SAVES.decode(enc.bytes);
      const pcD = d.S.people[d.S.pc];
      const same = JSON.stringify(pcD.mw) === JSON.stringify(A.pc().mw);
      // an old save
      const raw = JSON.parse(A.serialize());
      for (const p of Object.values(raw.people || {})) delete p.mw;
      for (const q of raw.queue || []) if (q.ctx) delete q.ctx.mw;
      A.deserialize(raw);
      const st = T.play(3);
      // a choice after loading starts the record again
      MWT.defs(); const pc = A.pc(); pc.alive = true; pc.prison = null; delete pc.mw;
      MWT.scene('mwt_toll', {}, 1);
      return { lines, same, st, alive: !!pc, after: pc.mw ? pc.mw.m.length : 0 };
    });
    return { ok: r.lines > 0 && r.same && r.alive && r.after > 0, detail: `${r.lines} lines saved and loaded exactly: ${r.same}; an old save without the record loads and plays 3 years (${r.st}); the next choice writes ${r.after} line` };
  },

  async mwInLives(pg) {
    // 12 years of three real lives: scenes are woven, none over 80 words, no raw token, the cited year is in the past
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const S = { events: 0, woven: 0, long: 0, raw: 0, future: 0, by: {}, eg: [] };
      for (const [seed, status] of [[6711, 'peasant'], [6712, 'merchant'], [6713, 'noble']]) {
        T.enter({ seed, race: 'human', realm: 'POL-01', status, sex: 'M', startAge: 16 });
        T.play(12, { onEvent: v => {
          const q = A.S.queue[0], w = q && q.ctx && q.ctx.mw;
          S.events++;
          if (w && !w.off) { S.woven++; S.by[w.r] = (S.by[w.r] || 0) + 1; if (MWT.words(v.text) > 80) S.long++; if (!(w.y < A.S.year)) S.future++; if (S.eg.length < 4) S.eg.push(v.text); }
          if (T.raw.test(v.text + v.choices.map(c => c.t).join(' '))) S.raw++;
        } });
      }
      return S;
    });
    return { ok: r.woven > 0 && !r.long && !r.raw && !r.future, detail: `${r.events} events, ${r.woven} woven (${JSON.stringify(r.by)}); over 80 words ${r.long}; raw tokens ${r.raw}; citing this year or later ${r.future}; e.g. "${r.eg[0] || ''}"` };
  },

  async mwSourcesIntact(pg) {
    // the wrapped setup keeps the event's own source first; cond and text are untouched, so the classifiers agree
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const E = Object.values(A.EV);
      const wrapped = E.filter(e => e._mwWrapped).length;
      const withOwn = E.filter(e => e._mwWrapped && /ctx\.pid\s*=/.test(e.setup.toString())).length;
      const reads = E.filter(e => e._mwWrapped && /p\.flags\.ev/.test(e.setup.toString())).length;
      return { n: E.length, wrapped, withOwn, reads };
    });
    return { ok: r.wrapped === r.n && r.reads === r.n && r.withOwn > 50, detail: `${r.wrapped} of ${r.n} events ask the record in their setup; ${r.withOwn} own setups that pick a person still read as such` };
  },
  // cycle 1: "The last time you were at market, in 1106, you tried to cut it, and failed": a deed whose object is a bare
  // pronoun is cited only with the scene's title to say what "it" was, and a line cited this year waits for the next.
  async mwBareObject(pg) {
    const r = await pg.evaluate(() => {
      const d = A.MW.citeDeed;
      return {
        bare: d({ d: 'you tried to cut it, and failed' }),
        titled: d({ d: 'you tried to cut it, and failed', t: 'A tooth on a cord' }),
        full: d({ d: 'you tried to talk the drover down, and failed' }),
        them: d({ d: 'you chose to take them' }), away: d({ d: 'you chose to send them away' }),
      };
    });
    return { ok: r.bare === '' && /\(a tooth on a cord\)/.test(r.titled) && r.full === 'you tried to talk the drover down, and failed' && r.them === '' && r.away === 'you chose to send them away',
      detail: JSON.stringify(r) };
  },

  // cycle 1 (lives B3): a second Suilan read as the dead patron. A person who shares a given name with someone else the
  // player knows is named in full by {them} and by the weave.
  async mwKnownName(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 6702, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 30 });
      const pc = A.pc();
      const a = A.makeAcquaintance(pc, 'acquaint'), b = A.makeAcquaintance(pc, 'acquaint');
      pc.rel = pc.rel || {}; pc.rel[a.id] = pc.rel[a.id] || { type: 'friend', op: 20 }; pc.rel[b.id] = pc.rel[b.id] || { type: 'acquaint', op: 0 };
      const lone = A.knownName(b);
      b.given = a.given; if (!b.sur) b.sur = 'Tav';
      a.alive = false;
      const named = A.knownName(b), tok = A.ctxTokens(pc, { pid: b.id }).them;
      return { lone, given: b.given, named, tok, full: A.fullName(b, false) };
    });
    return { ok: r.lone.length > 0 && r.named !== r.given && r.named.startsWith(r.given) && r.tok === r.named, detail: JSON.stringify(r) };
  },
};
