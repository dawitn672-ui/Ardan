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
    // the same wars, run with one side's generals of each temper, counting what the temper is about. A war is
    // chaotic: one changed draw reshapes it, and twelve wars passed or failed on the random stream alone (with a few
    // draws burned each month, cautious out-assaulted bold two to one). So this pools twelve wars on each of eight
    // shifted streams, 96 a temper. Each order the army gives is classed by its target when given: an assault (men
    // stand there; a pursuit if one of them fell back from a fight in the last 8 days and has not re-formed; engaged
    // if they are fighting elsewhere or already being fought from another side; at a fort if walls stand), or a
    // march on an empty province (a siege if walled). The same division sent at the same place again within 30 days
    // is one order.
    const r = await pg.evaluate(() => {
      const G = A.GENERALS, out = {};
      for (const t of ['steady', 'bold', 'cautious', 'cunning']) out[t] = { assaults: 0, pursuits: 0, fortAssaults: 0, engaged: 0, sieges: 0, open: 0, orders: 0, fights: 0, won: 0, dead: 0, killed: 0, taken: 0, ours: 0, theirs: 0, held: 0, mv: {} };
      for (const burn of [0, 1, 2, 3, 5, 7, 11, 40]) for (const t of Object.keys(out)) {
        const o = out[t];
        const hook = () => { for (let i = 0; i < burn; i++) A.rand(); };
        A.onMonth.push(hook);
        try { for (let s = 0; s < 12; s++) {
          A.newGame({ seed: 71 + s, race: 'human', realm: 'POL-05', status: 'peasant', sex: 'M', startAge: 30 });
          const me = ['POL-01', 'POL-02', 'POL-03'][s % 3], en = A.neighbors(me)[s % 2];
          if (!en) continue;
          A.startWar(me, en, null, 'conquest');
          const think = A.armyThink, fend = A.fightEnd, occ = A.occupy, seen = new Map();
          A.armyThink = function (a) {
            if (a.realm !== me) return think.apply(this, arguments);
            a.gtForce = t;
            const S = A.S, before = new Map(A.armyDivs(a).map(d => [d.id, (d.path || []).join()]));
            const fights0 = new Map(Object.keys(S.fights || {}).map(k => [+k, new Set(A.allDivs().filter(x => x.atk === +k && x.r === me).map(x => x.loc))]));
            const st0 = Object.assign({}, G.stats[t] || {});
            const res = think.apply(this, arguments);
            for (const [k, v] of Object.entries(G.stats[t] || {})) o.mv[k] = (o.mv[k] || 0) + v - (st0[k] || 0);
            for (const d of A.armyDivs(a)) {
              if (!d.path || !d.path.length || before.get(d.id) === d.path.join()) continue;
              const j = d.path[d.path.length - 1], P = A.S.prov[j];
              if (!P || !A.hostile(me, A.ctrl(P))) continue;
              const H = A.divsAt(j).filter(x => A.hostile(me, x.r));
              if (d.path.length > 1 && H.length) continue;     // a march that will meet them on the way is not an order to attack
              const key = d.id + '>' + j; if (seen.has(key) && S.warClock - seen.get(key) < 30) continue; seen.set(key, S.warClock);
              o.orders++;
              const er = A.realm(P.owner), walls = (P.fort || 0) > 0 || (er && er.capitalProv === j);
              if (H.length) {
                o.assaults++;
                if ((P.fort || 0) > 0) o.fortAssaults++;
                if (H.some(x => G.disordered(x, S.warClock))) o.pursuits++;
                const f0 = fights0.get(j);
                if (H.some(x => x.atk != null && x.atk !== j) || (f0 && f0.size && !f0.has(d.loc))) o.engaged++;
              } else if (walls) o.sieges++; else o.open++;
            }
            return res;
          };
          // every fight our side starts, won or lost, and the dead on both sides of every fight we are in
          A.fightEnd = function (pid, w) {
            const F = A.S.fights && A.S.fights[pid];
            if (F && F.a === me) { o.dead += F.deadA; o.killed += F.deadD; if (F.menA + F.menD >= 1000) { o.fights++; if (w === 'att') o.won++; } }
            if (F && F.b === me) { o.dead += F.deadD; o.killed += F.deadA; }
            return fend.apply(this, arguments);
          };
          A.occupy = function (P, rid) { if (rid === me && P && P.owner !== me && A.ctrl(P) !== me) o.taken++; return occ.apply(this, arguments); };
          const men = r => A.divsOf(r).reduce((x, d) => x + d.men, 0), m0 = men(me), e0 = men(en);
          // 300 days of war; scenes queued for the player (a custom, a plague nearby) would hold the clock, so clear them
          try { const d0 = A.today(); for (let g = 0; g < 300 && A.today() - d0 < 300; g++) { A.S.queue = []; A.advance(Math.min(30, 300 - (A.today() - d0))); } }
          finally { A.armyThink = think; A.fightEnd = fend; A.occupy = occ; }
          o.ours += Math.max(0, m0 - men(me)); o.theirs += Math.max(0, e0 - men(en));
          o.held += A.S.prov.filter(P => P.owner !== me && A.ctrl(P) === me).length;
        } } finally { A.onMonth.splice(A.onMonth.indexOf(hook), 1); }
      }
      return out;
    });
    const s = r.steady, b = r.bold, c = r.cautious, n = r.cunning;
    const pc = (x, y) => x / Math.max(1, y);
    const field = o => pc(o.assaults, o.assaults + o.sieges), soft = o => pc(o.sieges + o.open + o.engaged, o.orders), win = o => pc(o.won, o.fights);
    // provinces taken for every 100,000 men the army is down at the end (the dead, the destroyed and the deserted,
    // less what came back in drafts). Counted by the dead in battle alone, cunning is level with steady (see README)
    const perDead = o => pc(o.taken, o.ours / 1e5);
    const T = [s, b, c, n];
    // cautious (GO-ARMY-DECIDE): keeps a third in reserve and stays on the defensive when outnumbered on his front.
    // And the wars must have been fought: with the clock held, every temper read 0 and the test passed on nothing
    const okCautious = c.assaults >= 50 && b.assaults >= c.assaults * 1.1 && s.assaults >= c.assaults * 1.1;
    // bold (GO-ARMY-MOVES): presses after a win, piles into the fight with their main host instead of sitting down
    // before empty walls, goes in less rested. More assaults and pursuits, more of them field fights, and he wins as
    // often as a steady general. Every bar needs a real sample under it
    const okBold = s.pursuits >= 30 && s.fights >= 200 && b.assaults >= s.assaults * 1.25 && b.pursuits >= s.pursuits * 1.5 &&
      field(b) >= field(s) + 0.02 && win(b) >= win(s) - 0.05 && (b.mv.pursue || 0) >= 30 && (b.mv.join || 0) >= 30;
    // cunning: goes round walls and held places, falls on men already busy, feints, and leaves a host standing ready
    // alone. The highest share of orders at empty or engaged places, the fewest assaults on walls, the most
    // provinces taken for his dead; and the moves themselves happened
    const okCunning = n.orders >= 500 && T.every(o => o === n || soft(n) >= soft(o) + 0.03) && T.every(o => o === n || n.fortAssaults < o.fortAssaults) &&
      T.every(o => o === n || perDead(n) > perDead(o)) && (n.mv.round || 0) >= 50 && (n.mv.feint || 0) >= 5 && (n.mv.flank || 0) >= 10;
    const k = x => `${Math.round(x / 1000)}k`, p = x => `${Math.round(x * 100)}%`;
    const line = (t, v) => `${t}: ${v.assaults} assaults (${v.pursuits} pursuits, ${v.fortAssaults} at walls, ${v.engaged} on men engaged), ${p(field(v))} field, ${p(soft(v))} at empty or engaged places of ${v.orders} orders, won ${p(win(v))} of ${v.fights} fights, ${k(v.dead)} dead of ours and ${k(v.killed)} of theirs, ${v.taken} taken (${perDead(v).toFixed(1)} per 100k men down), ${k(v.ours)} men down, ${v.held} held`;
    const fails = [!okCautious && 'cautious', !okBold && 'bold', !okCunning && 'cunning'].filter(Boolean);
    return { ok: !fails.length, detail: (fails.length ? `FAILED ${fails.join(', ')}; ` : '') + Object.entries(r).map(([t, v]) => line(t, v)).join('; ') +
      `; moves: bold ${JSON.stringify(b.mv)}, cunning ${JSON.stringify(n.mv)}` };
  },

  async planIsVisible(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const { F } = GOT.soldier(81, 'bold');
      if (!F) return { none: true };
      // sixty days of war; scenes other features queue (a custom, a plague nearby) would hold the clock, so clear them
      const d0 = A.today(); for (let g = 0; g < 60 && A.today() - d0 < 60; g++) { A.S.queue = []; A.advance(60 - (A.today() - d0)); }
      const a = F.a, h = UI.wrArmyRow(a, A.cmdRole(A.pc()));
      return { plan: a.gtPlan, line: (h.match(/<b>(Bold|Cautious|Cunning|Steady)<\/b> · [^<]*/) || [''])[0], text: A.GENERALS.planText(a) };
    });
    if (r.none) return { ok: false, detail: 'no army for the soldier' };
    return { ok: !!r.plan && /Bold/.test(r.line), detail: `war room: "${r.line.replace(/<\/?b>/g, '')}"` };
  },

  async movesAreVisible(pg) {
    // in real wars, a bold army's plan says where it presses and a cunning one's which walls it goes round, which
    // place it makes a show at; and the letter that comes down the line says the same
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const G = A.GENERALS, seen = { bold: {}, cunning: {} }, eg = {}, letters = {};
      for (let s = 0; s < 12; s++) for (const t of ['bold', 'cunning']) {
        A.newGame({ seed: 71 + s, race: 'human', realm: 'POL-05', status: 'peasant', sex: 'M', startAge: 30 });
        const me = ['POL-01', 'POL-02', 'POL-03'][s % 3], en = A.neighbors(me)[s % 2];
        if (!en) continue;
        A.startWar(me, en, null, 'conquest');
        const think = A.armyThink;
        A.armyThink = function (a) {
          if (a.realm === me) a.gtForce = t;
          const res = think.apply(this, arguments);
          if (a.realm === me) {
            const m = G.move(a), txt = G.planText(a);
            if (m) { seen[t][m.k] = (seen[t][m.k] || 0) + 1; if (!eg[t + m.k]) eg[t + m.k] = txt; }
            // the letter a soldier of this army would get now
            if (m && !letters[t + m.k] && ((t === 'bold' && m.k === 'press') || (t === 'cunning' && (m.k === 'round' || m.k === 'feint')))) {
              const o = G.orderFor(null, a, null);
              if (o.press || o.wall != null || o.noise != null) letters[t + m.k] = { tp: o.tp, pp: o.pp, press: o.press, wp: o.wall, np: o.noise, gen: a.gen };
            }
          }
          return res;
        };
        try { const d0 = A.today(); for (let g = 0; g < 300 && A.today() - d0 < 150; g++) { A.S.queue = []; A.advance(Math.min(30, 150 - (A.today() - d0))); } } finally { A.armyThink = think; }
      }
      // the letters, read by a soldier
      const texts = {};
      for (const [key, L] of Object.entries(letters)) {
        const { pc } = GOT.soldier(85);
        const t = key.startsWith('bold') ? 'bold' : 'cunning', ctx = { order: 1, genId: A.GENERALS.armyFor(pc).a.gen, temper: t, tp: L.tp, pp: L.pp != null ? L.pp : pc.home };
        if (L.press) ctx.press = 1; if (L.wp != null) ctx.wp = L.wp; if (L.np != null) ctx.np = L.np;
        A.S.queue = []; A.queue({ type: 'event', ev: 'go_order_' + t, forced: true, ctx });
        const q = A.S.queue.find(x => x.ev === 'go_order_' + t); texts[key] = q ? A.eventView(q).text : null;
      }
      return { seen, eg, texts };
    });
    const ok = (r.seen.bold.press || 0) >= 3 && (r.seen.cunning.round || 0) >= 3 && /press on to /.test(r.eg.boldpress || '') && /round the walls of /.test(r.eg.cunninground || '') &&
      /press on to it while they are broken/.test(r.texts.boldpress || '') && /round the walls of /.test(r.texts.cunninground || '') && Object.values(r.texts).every(x => x && !/\{/.test(x));
    return { ok, detail: `moves seen: bold ${JSON.stringify(r.seen.bold)}, cunning ${JSON.stringify(r.seen.cunning)}; war room: ${Object.values(r.eg).map(x => `"${x}"`).join(', ')}; letters: ${Object.values(r.texts).map(x => `"${x}"`).join(' | ')}` };
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
