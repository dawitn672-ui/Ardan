// Browser tests for NPC initiative. Each test gets (page, pageErrors, {browser, file}).
// In-page helpers are defined once per test through SETUP (each test runs in a fresh page).
const SETUP = () => {
  window.NIT = {
    words: s => (String(s || '').match(/\S+/g) || []).length,
    raw: /\{[A-Za-z0-9_.]+\}/,
    // play `years`, answering every prompt with its first choice; count each NPC-started event once (an event that
    // starts a duel comes back to the head of the queue after the duel, so count queue items, not visits)
    play(years, onYear) {
      const seen = new WeakSet(), per = {}, seq = [], end = A.S.year + years;
      for (let guard = 0; guard < 6000 && A.S.year < end; guard++) {
        const r = A.advance(60);
        let h, g = 0;
        while ((h = A.headReady()) && g++ < 300) {
          if (h.type === 'event') {
            const e = A.EV[h.ev];
            if (!seen.has(h) && e && (e.npc || (h.ctx && h.ctx.npcMove))) { seen.add(h); per[A.S.year] = (per[A.S.year] || 0) + 1; seq.push(`${A.S.year}:${h.ev}:${h.ctx && h.ctx.pid}`); }
            A.eventChoose(0); A.eventClose();
          } else if (h.type === 'duel') { A.duelAuto(h.d); A.duelClose(); }
          else if (h.type === 'choice') A.choiceChoose(0);
          else A.skipPrompt();
        }
        if (onYear) onYear();
        if (r.why === 'dead' || !A.pc() || !A.pc().alive) break;
      }
      return { per, seq };
    },
    // a grown player with a friend who has a feud and a child, an unmarried child of their own, coin and standing
    stage(seed) {
      A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'F', startAge: 42 });
      const pc = A.pc(), y = A.S.year;
      pc.coin = 600; pc.fame = 20; pc.honor = 60;
      const t = A.makeAcquaintance(pc, 'friend'); t.born = y - 46; t.traits = []; t.coin = 20; t.health = 100;
      A.link(pc, t, 'friend', 55, 'friend');
      const foe = A.makeAcquaintance(pc, 'enemy'); A.link(t, foe, 'enemy', -60, 'enemy');
      const kid = A.newPerson({ given: 'Wenna', sex: 'F', race: pc.race, realm: pc.realm, cult: pc.cult, faith: pc.faith, born: y - 18, status: pc.status, home: pc.home, parents: [pc.id] });
      pc.children.push(kid.id); A.link(pc, kid, 'child', 60, 'mother');
      const mate = A.newPerson({ given: 'Osric', sex: 'M', race: t.race, realm: t.realm, cult: t.cult, faith: t.faith, born: y - 19, status: t.status, home: t.home, parents: [t.id] });
      t.children.push(mate.id); A.link(t, mate, 'child', 60, 'father');
      A.S.queue = [];
      return { pc, t, foe, kid, mate };
    },
  };
};

const FAMILY = {
  ni_borrow: ['ni_borrow_repaid', 'ni_borrow_default'], ni_feud: ['ni_feud_after'], ni_vouch: ['ni_vouch_good', 'ni_vouch_bad'],
  ni_hide: ['ni_hide_caught', 'ni_hide_thanks'], ni_deal: ['ni_deal_profit', 'ni_deal_loss', 'ni_deal_gone'], ni_apprentice: ['ni_apprentice_end'],
  ni_match: ['ni_match_wedding'], ni_slander: ['ni_slander_mend', 'ni_slander_again'], ni_challenge: ['ni_rematch'],
  ni_theft: ['ni_theft_return', 'ni_theft_again'], ni_secret: ['ni_secret_cost'], ni_invite: ['ni_invite_return'],
  ni_confide: ['ni_confide_test'], ni_gift: ['ni_gift_favor'],
};

export default {
  async npcInitiativeBudget(pg) {
    // 20 years of three lives: never more than CAP NPC events in a calendar year, about RATE a year overall,
    // and the cooldowns per person and per kind hold in the move log
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const NI = A.NPCI, out = [];
      for (const [seed, status] of [[101, 'noble'], [202, 'merchant'], [303, 'peasant'], [404, 'artisan']]) {
        A.newGame({ seed, race: 'human', realm: 'POL-01', status, sex: seed % 2 ? 'F' : 'M', startAge: 22 });
        const y0 = A.S.year, res = NIT.play(20), pc = A.pc(), st = pc.npci || { log: [], hy: {} };
        const years = A.S.year - y0, n = Object.values(res.per).reduce((a, b) => a + b, 0);
        let personGap = 99, kindGap = 99;
        const lastP = {}, lastK = {};
        for (const l of st.log) {
          if (lastP[l.pid] != null) personGap = Math.min(personGap, l.y - lastP[l.pid]);
          if (lastK[l.k] != null) kindGap = Math.min(kindGap, l.y - lastK[l.k]);
          lastP[l.pid] = l.y; lastK[l.k] = l.y;
        }
        out.push({ status, years, n, maxYear: Math.max(0, ...Object.values(res.per)), maxBooked: Math.max(0, ...Object.values(st.hy || {})), personGap, kindGap, kinds: new Set(st.log.map(l => l.k)).size });
      }
      return { out, CAP: NI.CAP, RATE: NI.RATE, BANK: NI.BANK, PC: NI.PERSON_COOL, KC: NI.KIND_COOL };
    });
    const bad = r.out.filter(l => l.maxYear > r.CAP || l.maxBooked > r.CAP || l.n > r.RATE * l.years + r.BANK + 1 || l.personGap < r.PC || l.kindGap < r.KC);
    const total = r.out.reduce((a, l) => a + l.n, 0), years = r.out.reduce((a, l) => a + l.years, 0);
    return {
      ok: !bad.length && total >= 3 * years / 10,
      detail: `${total} NPC events in ${years} years (${(10 * total / Math.max(1, years)).toFixed(1)} per decade); worst year ${Math.max(...r.out.map(l => l.maxYear))} (cap ${r.CAP}); ` +
        r.out.map(l => `${l.status}: ${l.n} in ${l.years}y, ${l.kinds} kinds, gaps person ${l.personGap} kind ${l.kindGap}`).join('; ') + (bad.length ? `; BROKEN: ${JSON.stringify(bad[0])}` : ''),
    };
  },

  async npcInitiativeHistory(pg) {
    // NPC events, interactions and get-to-know write the bond history; the person view shows it, escaped, without
    // touching the random stream or the state; the history is capped
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const { pc, t } = NIT.stage(31);
      UI.screen = 'game'; UI.tab = 'life';
      A.S.queue.push({ type: 'event', ev: 'ni_gift', ctx: { pid: t.id, npcMove: true } });
      A.headReady(); A.eventChoose(0); A.eventClose();
      const afterEvent = (pc.rel[t.id].hist || []).map(e => e.t);
      A.interact(t.id, 'time');
      const afterInteract = pc.rel[t.id].hist.map(e => e.t);
      // get to know a stranger
      const stranger = Object.values(A.S.people).find(p => p.alive && p.id !== pc.id && !pc.rel[p.id] && A.isAdult(p));
      A.S.time = 10; A.getToKnow(stranger.id);
      // with 30-get-to-know the meeting is a scene: play it (keep it short and proper)
      const gk = A.S.queue.find(q => q.ev === 'gk_meet');
      if (gk) { A.S.queue = [gk].concat(A.S.queue.filter(q => q !== gk)); A.eventView(gk); A.eventChoose(3); A.eventClose(); }
      const knowLine = (pc.rel[stranger.id] && pc.rel[stranger.id].hist || []).map(e => e.t);
      // the cap
      for (let i = 0; i < 20; i++) A.bondNote(pc, t, 'Test line ' + i);
      const capped = pc.rel[t.id].hist.length;
      // markup in a loaded save must come out escaped
      pc.rel[t.id].hist.push({ y: A.S.year, t: '<img src=x data-pwn=1>' });
      A.S.queue = [];
      const rng0 = A.rngState, h0 = T.hash(A.S);
      UI.ov = { type: 'person', id: t.id }; UI.renderModal();
      const html = (document.querySelector('#modal') || {}).innerHTML || '';
      const injected = !!document.querySelector('#modal [data-pwn]');
      UI.ov = null; UI.renderModal();
      return {
        afterEvent, afterInteract, knowLine, capped, injected,
        shows: html.includes('What has passed between you') && html.includes('Test line 19') && html.includes('Between you'),
        pure: A.rngState === rng0 && T.hash(A.S) === h0,
      };
    });
    const ok = r.afterEvent.length >= 1 && r.afterInteract.length > r.afterEvent.length && r.knowLine.length === 1 && r.capped === 12 && r.shows && !r.injected && r.pure;
    return { ok, detail: `after gift: "${r.afterEvent.join(' / ')}"; after interaction: ${r.afterInteract.length} lines; get-to-know: "${r.knowLine[0]}"; capped at ${r.capped}; view shows it: ${r.shows}; markup escaped: ${!r.injected}; render pure: ${r.pure}` };
  },

  async npcInitiativeDeterminism(pg) {
    // the same seed gives the same NPC moves, whether or not anyone looks: "looking" opens every known person's view
    // (with its bond history) and draws every tab, each year. (Drawing every tab only holds since staff-pure.core.js.)
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const run = look => {
        T.enter({ seed: 4711, race: 'human', realm: 'POL-05', status: 'merchant', sex: 'M', startAge: 24 });
        const res = NIT.play(15, () => {
          if (!look || A.S.queue.length) return;
          const pc = A.pc();
          for (const id of Object.keys(pc.rel)) { UI.ov = { type: 'person', id }; UI.renderModal(); }
          UI.ov = null; UI.renderModal();
          T.renderAll();
        });
        T.renderAll(); // both runs draw once at the end, so first-draw setup (an empty cargo hold) matches
        return { seq: res.seq, end: A.rngState + ':' + T.hash(A.S.people) + ':' + T.hash(A.S.realms) };
      };
      const a = run(false), b = run(false), c = run(true);
      return { n: a.seq.length, same: a.seq.join('|') === b.seq.join('|') && a.end === b.end, sameLooking: a.seq.join('|') === c.seq.join('|') && a.end === c.end, first: a.seq.slice(0, 4) };
    });
    return { ok: r.n >= 3 && r.same && r.sameLooking, detail: `${r.n} NPC events in 15 years (${r.first.join(', ')}...); same seed same moves: ${r.same}; same while looking at people: ${r.sameLooking}` };
  },

  async npcInitiativeEvents(pg, errs) {
    // every event and every choice, follow-ups included, with a real person behind it: renders whole, stays in the
    // word diet, resolves without engine errors, and leaves a line of history
    await pg.evaluate(SETUP);
    const r = await pg.evaluate((FAMILY) => {
      const out = { covered: new Set(), problems: [], choices: 0, notes: 0 };
      let cur = '';
      const ce = console.error; console.error = (...a) => out.problems.push(`${cur}: console.error ${a.map(x => String(x && x.message || x)).join(' ').slice(0, 160)}`);
      const { pc, t } = NIT.stage(57);
      const base = A.serialize();
      const tryEvent = (item, label) => {
        const e = A.EV[item.ev]; if (!e) { out.problems.push(`${label}: missing`); return []; }
        A.S.queue = [JSON.parse(JSON.stringify(item))];
        const v = A.eventView(A.S.queue[0]);
        if (v.skip) { out.problems.push(`${label}: skipped`); return []; }
        out.covered.add(item.ev);
        const all = [v.title, v.text, ...v.choices.map(c => c.t)].join(' | ');
        if (NIT.raw.test(all)) out.problems.push(`${label}: raw token ${all.match(NIT.raw)[0]}`);
        if (NIT.words(v.text) > 80) out.problems.push(`${label}: text ${NIT.words(v.text)} words`);
        for (const c of v.choices) if (NIT.words(c.t) > 12) out.problems.push(`${label}: choice "${c.t}" too long`);
        if (!e.npc || !e.trigger) out.problems.push(`${label}: not npc+trigger`);
        return v.choices.map(c => c.i);
      };
      const choose = (item, i, label) => {
        A.S.queue = [JSON.parse(JSON.stringify(item))];
        const v = A.eventView(A.S.queue[0]), idx = v.choices.findIndex(c => c.i === i);
        if (idx < 0) return [];
        const pid = item.ctx.pid, h0 = (pc2().rel[pid] && pc2().rel[pid].hist || []).length;
        cur = `${label} choice ${i + 1}`;
        A.eventChoose(idx);
        const res = A.S.queue.find(q => q.type === 'event' && q.result);
        if (res && NIT.raw.test(res.result.text)) out.problems.push(`${cur}: raw token in result`);
        if (res && !res.result.text) out.problems.push(`${cur}: empty result`);
        // a duel started by the choice resolves, so its end handler is exercised too
        for (let g = 0; g < 4 && A.S.queue.length; g++) { const q = A.S.queue[0]; if (q.type === 'duel') { A.duelAuto(q.d); A.duelClose(); } else if (q.type === 'event' && q.result) A.eventClose(); else A.S.queue.shift(); }
        out.choices++;
        if ((pc2().rel[pid] && pc2().rel[pid].hist || []).length > h0) out.notes++;
        return (A.S.sched || []).map(x => x.item).filter(x => x && x.ctx && x.ctx.follow);
      };
      const pc2 = () => A.pc();
      for (const ev of Object.keys(FAMILY)) {
        A.deserialize(JSON.parse(base));
        const item = { type: 'event', ev, ctx: { pid: t.id, npcMove: true } };
        if (ev === 'ni_challenge' || ev === 'ni_theft' || ev === 'ni_slander' || ev === 'ni_secret') { A.pc().rel[t.id].op = -50; if (A.P(t.id).rel[A.pc().id]) A.P(t.id).rel[A.pc().id].op = -50; }
        const idxs = tryEvent(item, ev);
        let followCtx = null;
        for (const i of idxs) {
          A.deserialize(JSON.parse(base));
          const fol = choose(item, i, ev);
          if (fol.length && !followCtx) followCtx = { ctx: fol[0].ctx, state: A.serialize() };
        }
        if (!followCtx) { out.problems.push(`${ev}: no choice scheduled a follow-up`); continue; }
        for (const fe of FAMILY[ev]) {
          const fitem = { type: 'event', ev: fe, ctx: Object.assign({}, followCtx.ctx, { follow: fe }), forced: true };
          A.deserialize(JSON.parse(followCtx.state));
          const fidx = tryEvent(fitem, fe);
          for (const i of fidx) { A.deserialize(JSON.parse(followCtx.state)); choose(fitem, i, fe); }
        }
      }
      // the challenge's follow-up comes from the duel's end; make sure the handler books it
      A.deserialize(JSON.parse(base));
      const D = { result: 'win' }; A.DUEL_END.niChallenge(D, t.id);
      const booked = (A.S.sched || []).some(x => x.item && x.item.ev === 'ni_rematch');
      if (!booked) out.problems.push('niChallenge: no rematch booked');
      console.error = ce;
      return { covered: [...out.covered], problems: [...new Set(out.problems)], choices: out.choices, notes: out.notes, all: Object.keys(A.EV).filter(k => k.startsWith('ni_')).length };
    }, FAMILY);
    const missing = r.all - r.covered.length;
    return {
      ok: !r.problems.length && missing === 0 && r.all >= 24 && r.notes >= r.choices * .9 && !errs.length,
      detail: `${r.covered.length} of ${r.all} events played, ${r.choices} choices, ${r.notes} wrote history` + (r.problems.length ? `; ${r.problems.length} problems, e.g. ${r.problems.slice(0, 3).join(' || ')}` : ''),
    };
  },

  async npcInitiativeCast(pg) {
    // the named cast's written wants and fears reach the game: motives weight their desires, a confidence quotes the
    // fear, and the "why" line quotes the want
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const { pc } = NIT.stage(77);
      const cid = Object.keys(LORE.cast).find(k => { const c = LORE.cast[k]; return c.fears && /^(She|He) fears/.test(c.fears) && c.born && A.S.year - c.born > 25; });
      const c = A.personFromCast(cid);
      A.link(pc, c, 'friend', 70, 'friend'); c.traits = [];
      const plain = A.makeAcquaintance(pc, 'friend'); plain.traits = []; plain.born = c.born; A.link(pc, plain, 'friend', 70, 'friend');
      if (c.rel[pc.id]) c.rel[pc.id].op = 70; if (plain.rel[pc.id]) plain.rel[pc.id].op = 70;
      const NI = A.NPCI, dc = NI.desire(pc, c, 'confide', pc.rel[c.id]).w, dp = NI.desire(pc, plain, 'confide', pc.rel[plain.id]).w;
      A.S.queue = [{ type: 'event', ev: 'ni_confide', ctx: { pid: c.id, npcMove: true } }];
      const v = A.eventView(A.S.queue[0]);
      const fearBit = LORE.cast[cid].fears.split(/\s+/).slice(2, 7).join(' ');
      const ctx = NI.launch(pc, { t: c, k: 'confide', w: 1, why: ['cast'], o: 70 });
      const wantBit = String(LORE.cast[cid].wants || '').split(/\s+/).slice(2, 6).join(' ');
      return { cid, motives: NI.motives(c), dc, dp, quotesFear: v.text.includes(fearBit), why: ctx.niWhy, quotesWant: !wantBit || ctx.niWhy.includes(wantBit), words: NIT.words(v.text) };
    });
    const ok = !!r.motives && r.motives.fear === 1 && r.dc > r.dp && r.quotesFear && r.quotesWant && r.words <= 80;
    return { ok, detail: `${r.cid}: motives ${JSON.stringify(r.motives)}; confide desire cast ${r.dc.toFixed(2)} vs plain ${r.dp.toFixed(2)}; confidence quotes the written fear: ${r.quotesFear} (${r.words} words); why line: "${r.why.slice(0, 120)}"` };
  },

  async npcInitiativeOldSave(pg) {
    // a save from before this feature (no budget, no history, no marks) loads and plays on
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      T.enter({ seed: 909, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 });
      T.play(4);
      const S = JSON.parse(A.serialize()), pc = S.people[S.pc];
      delete pc.npci;
      for (const id in pc.rel) { delete pc.rel[id].hist; delete pc.rel[id].niTold; delete pc.rel[id].niConf; }
      S.queue = [];
      A.deserialize(S);
      let err = null;
      try {
        T.play(6);
        const p = A.pc();
        for (const id of Object.keys(p.rel).slice(0, 10)) UI.personModal(A.P(id), '');
      } catch (e) { err = String(e.stack || e).slice(0, 300); }
      const st = A.pc().npci;
      return { err, budget: st && typeof st.b === 'number', moves: st ? st.tot : -1 };
    });
    return { ok: !r.err && r.budget, detail: r.err ? r.err : `old save plays on: budget recreated, ${r.moves} moves in 6 years` };
  },
};
