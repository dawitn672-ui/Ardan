// Generals with a temper, and orders by letter: the temper comes from traits, moves how the army fights, shows in the
// war room, and reaches the soldier as a letter whose outcome the map settles sixty days later.
const SETUP = () => {
  window.GOT = {
    // an enlisted soldier in a war, with his army's general known
    soldier(seed, temper) {
      A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
      const pc = A.pc(), enemy = A.neighbors('POL-01')[0];
      A.startWar('POL-01', enemy, null, 'conquest');
      A.enlist(pc); A._idIdx = null;
      A.advance(2); A._idIdx = null;   // the war's first day raises the armies
      const F = A.GENERALS.armyFor(pc);
      if (F && temper) F.a.gtForce = temper;
      return { pc, enemy, F };
    },
    choose(ev, idx, win) {
      const q = A.S.queue.find(x => x.ev === ev); if (!q) return null;
      A.S.queue = [q].concat(A.S.queue.filter(x => x !== q));
      const v = A.eventView(q); const vi = v.choices.findIndex(c => c.i === idx);
      const ch = A.chance; if (win != null) A.chance = () => win;
      try { A.eventChoose(vi); } finally { A.chance = ch; }
      const t = q.result && q.result.text; A.eventClose(); return { text: t, view: v };
    },
  };
};

export default {
  async tempersFromTraits(pg) {
    const r = await pg.evaluate(() => {
      const G = A.GENERALS, T = traits => G.temper({ traits });
      const cases = [T(['brave', 'proud']), T(['patient', 'craven']), T(['deceitful']), T(['brave', 'patient']), T(['kind'])];
      // the generals the world actually makes
      const n = { bold: 0, cautious: 0, cunning: 0, steady: 0 };
      for (let s = 0; s < 6; s++) {
        A.newGame({ seed: 900 + s, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M' });
        for (const id in A.S.realms) { const R = A.S.realms[id]; if (!R.alive || R.isRebel) continue; const g = A.P(A.wsGeneralFor(id)); if (g) n[G.temper(g)]++; }
      }
      return { cases, n };
    });
    const ok = r.cases.join() === 'bold,cautious,cunning,steady,steady' && r.n.bold > 0 && r.n.cautious > 0 && r.n.cunning > 0 && r.n.steady > 0;
    return { ok, detail: `traits → temper: ${r.cases.join(', ')}; the world's generals: ${Object.entries(r.n).map(([k, v]) => `${k} ${v}`).join(', ')}` };
  },

  async temperMovesTheWar(pg) {
    // the same wars, run with one side's generals of each temper, counting what the temper is about: assaults on
    // defended provinces. A war is chaotic: one changed draw reshapes it, and twelve wars passed or failed on the random
    // stream alone (with a few draws burned each month, cautious out-assaulted bold two to one). So this pools twelve
    // wars on each of eight shifted streams, 96 a temper. The dead are reported but not held to a bar.
    const r = await pg.evaluate(() => {
      const out = {};
      for (const t of ['steady', 'bold', 'cautious', 'cunning']) out[t] = { assaults: 0, ours: 0, theirs: 0, held: 0 };
      for (const burn of [0, 1, 2, 3, 5, 7, 11, 40]) for (const t of Object.keys(out)) {
        const o = out[t];
        const hook = () => { for (let i = 0; i < burn; i++) A.rand(); };
        A.onMonth.push(hook);
        try { for (let s = 0; s < 12; s++) {
          A.newGame({ seed: 71 + s, race: 'human', realm: 'POL-05', status: 'peasant', sex: 'M', startAge: 30 });
          const me = ['POL-01', 'POL-02', 'POL-03'][s % 3], en = A.neighbors(me)[s % 2];
          if (!en) continue;
          A.startWar(me, en, null, 'conquest');
          const think = A.armyThink;
          A.armyThink = function (a) {
            if (a.realm !== me) return think.apply(this, arguments);
            a.gtForce = t;
            const before = new Map(A.armyDivs(a).map(d => [d.id, (d.path || []).join()]));
            const res = think.apply(this, arguments);
            for (const d of A.armyDivs(a)) {
              if (!d.path || d.path.length !== 1 || before.get(d.id) === d.path.join()) continue;
              const P = A.S.prov[d.path[0]];
              if (P && A.hostile(me, A.ctrl(P)) && A.divsAt(P.id).some(x => A.hostile(me, x.r))) o.assaults++;
            }
            return res;
          };
          const men = r => A.divsOf(r).reduce((x, d) => x + d.men, 0), m0 = men(me), e0 = men(en);
          try { for (let m = 0; m < 10; m++) A.advance(30); } finally { A.armyThink = think; }
          o.ours += Math.max(0, m0 - men(me)); o.theirs += Math.max(0, e0 - men(en));
          o.held += A.S.prov.filter(P => P.owner !== me && A.ctrl(P) === me).length;
        } } finally { A.onMonth.splice(A.onMonth.indexOf(hook), 1); }
      }
      return out;
    });
    const s = r.steady, b = r.bold;
    const c = r.cautious;
    // over 96 wars: bold 414, steady 404, cautious 329 assaults. Bold against steady is within the noise (a bold general
    // also thinks too often to hold a plan, see GO-ARMY-TEMPO), so it is reported, not held
    const ok = b.assaults >= c.assaults * 1.1 && s.assaults >= c.assaults * 1.1;
    const k = n => `${Math.round(n / 1000)}k`;
    return { ok, detail: Object.entries(r).map(([t, v]) => `${t}: ${v.assaults} assaults, ${k(v.ours)} of ours and ${k(v.theirs)} of theirs dead, ${v.held} provinces held`).join('; ') };
  },

  async planIsVisible(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const { F } = GOT.soldier(81, 'bold');
      if (!F) return { none: true };
      for (let m = 0; m < 2; m++) A.advance(30);
      const a = F.a, h = UI.wrArmyRow(a, A.cmdRole(A.pc()));
      return { plan: a.gtPlan, line: (h.match(/<b>(Bold|Cautious|Cunning|Steady)<\/b> · [^<]*/) || [''])[0], text: A.GENERALS.planText(a) };
    });
    if (r.none) return { ok: false, detail: 'no army for the soldier' };
    return { ok: !!r.plan && /Bold/.test(r.line), detail: `war room: "${r.line.replace(/<\/?b>/g, '')}"` };
  },

  async letterInARealWar(pg) {
    // an enlisted soldier gets his general's orders by letter within a few months
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      let seen = null, text = null, months = 0;
      for (const seed of [82, 83, 84]) {
        GOT.soldier(seed);
        for (let m = 0; m < 24 && A.pc().alive && !seen; m++) {
          A.advance(30); months++;
          let g = 0, h;
          while ((h = A.headReady()) && g++ < 300) {
            if (h.type === 'event' && /^go_order_/.test(h.ev)) { seen = h.ev; text = A.eventView(h).text; break; }
            if (h.type === 'event') A.eventAuto(); else if (h.type === 'choice') A.choiceChoose(0); else if (h.type === 'battle') A.battleClose();
            else if (h.type === 'duel') { A.duelAuto(h.d); A.duelClose(); } else A.S.queue.shift();
          }
        }
        if (seen) break;
      }
      return { seen, text, months };
    });
    return { ok: !!r.seen && !/\{/.test(r.text), detail: r.seen ? `${r.seen} after ${r.months} months: "${r.text}"` : `no letter in ${r.months} months` };
  },

  async ordersSettle(pg) {
    // what you did, and whether the plan worked, decide what comes of it
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const out = {};
      const cases = [['obey', true], ['obey', false], ['ignore', true], ['ignore', false], ['own', false], ['own', true]];
      for (const [k, worked] of cases) {
        const { pc, enemy, F } = GOT.soldier(85, 'bold');
        if (!F) return { none: true };
        const P = A.S.prov.find(x => x.owner === enemy);
        // the letter itself, chosen through the event
        A.S.queue = [];
        A.queue({ type: 'event', ev: 'go_order_bold', forced: true, ctx: { order: 1, genId: F.a.gen, temper: 'bold', tp: P.id, pp: pc.home } });
        const idx = { obey: 0, letter: 1, own: 2, ignore: 3 }[k];
        const res = GOT.choose('go_order_bold', idx, true);
        const pend = (A.S.goPend || []).slice(-1)[0];
        if (worked) P.occ = 'POL-01';
        const ctrlOk = (A.ctrl(P) === 'POL-01') === worked;
        const m0 = pc.mil.merit;
        A.S.queue = [];
        const got = pend ? A.GENERALS.settle(pc, pend) : null;
        out[k + (worked ? '+' : '-')] = { got, pend: pend && pend.k, merit: pc.mil.merit - m0, ctrlOk, text: res && res.text };
      }
      return out;
    });
    if (r.none) return { ok: false, detail: 'no army for the soldier' };
    const want = { 'obey+': 'credit', 'obey-': 'go_blame', 'ignore+': 'go_reckoning', 'ignore-': 'go_vindicated', 'own-': 'go_vindicated', 'own+': 'quiet' };
    const bad = Object.keys(want).filter(k => !r[k] || !r[k].ctrlOk || r[k].got !== want[k]);
    return { ok: !bad.length, detail: bad.length ? `wrong: ${bad.map(k => `${k} → ${r[k] && r[k].got} (ctrl ${r[k] && r[k].ctrlOk})`).join(', ')}` : Object.entries(r).map(([k, v]) => `${k} → ${v.got}${v.merit ? ` (+${v.merit} merit)` : ''}`).join(', ') };
  },
};
