// Circles: new acquaintances arrive inside your circles, a friend of your foe starts cooler, word of a great harm reaches
// the victim's friends, and cliques form in the unit or the street.
const SETUP = () => {
  window.CIT = {
    adult(seed) {
      A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'F', startAge: 30 });
      return A.pc();
    },
    // a grown person of the player's town who knows nobody yet
    stranger(pc) {
      const keep = A.CIRCLES.TIE; A.CIRCLES.TIE = 0;
      try { const p = A.makeAcquaintance(pc, 'acquaint'); p.born = A.S.year - 30; p.home = pc.home; p.rel = p.rel || {}; return p; } finally { A.CIRCLES.TIE = keep; }
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
  async firstImpressions(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = CIT.adult(201);
      if (A.NPCI) A.NPCI.state(pc).b = 2;   // room in the shared NPC budget (21-npc-initiative)
      const F = CIT.stranger(pc), E = CIT.stranger(pc);
      A.link(pc, F, 'friend', 60, 'friend'); A.link(pc, E, 'enemy', -60, 'enemy');
      const meet = tie => {
        const n = CIT.stranger(pc);
        if (tie) A.link(n, tie, 'friend', 50, 'friend');
        A.S.queue = [];
        const ri = A.ri; A.ri = () => 0;   // A.link draws -10..10 for the back opinion; hold it still to compare
        try { A.link(pc, n, 'acquaint', 0, 'acquaint'); } finally { A.ri = ri; }
        return { n, op: n.rel[pc.id].op, mine: pc.rel[n.id].op, q: A.S.queue.map(q => q.ev) };
      };
      const plain = meet(null), viaFriend = meet(F), viaFoe = meet(E);
      const h = UI.personModal(viaFoe.n);
      const line = (h.match(/Circle: [^<]*(<span[^>]*>[^<]*<\/span>)?/) || [''])[0].replace(/<[^>]+>/g, '');
      return { plain: plain.op, friend: viaFriend.op - plain.op, foe: viaFoe.op - plain.op, mineFoe: viaFoe.mine - plain.mine, queued: viaFoe.q, line };
    });
    const ok = r.friend === 8 && r.foe === -12 && r.queued.includes('cir_foes_friend') && /your foe/.test(r.line);
    return { ok, detail: `a stranger's first opinion of you, against a plain stranger: a friend of your friend ${r.friend >= 0 ? '+' : ''}${r.friend}, a friend of your foe ${r.foe}; queued ${r.queued.join(', ')}; "${r.line}"` };
  },

  async wordGetsAround(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = CIT.adult(202), t = CIT.stranger(pc);
      if (A.NPCI) A.NPCI.state(pc).b = 2;   // room in the shared NPC budget (21-npc-initiative)
      A.link(pc, t, 'acquaint', 10, 'acquaint');
      const friends = [0, 1, 2].map(() => { const x = CIT.stranger(pc); A.link(t, x, 'friend', 60, 'friend'); A.link(pc, x, 'acquaint', 10, 'acquaint'); return x; });
      const before = friends.map(x => x.rel[pc.id].op);
      A.S.queue = [];
      A.addOp(pc, t, -5);
      const small = friends.map((x, i) => x.rel[pc.id].op - before[i]);
      const mid = friends.map(x => x.rel[pc.id].op);
      A.addOp(pc, t, -30);
      const big = friends.map((x, i) => Math.round((x.rel[pc.id].op - mid[i]) * 10) / 10);
      const lines = A.S.log.flatMap(e => (e.lines || []).map(l => l[0])).filter(l => /Word gets around/.test(l));
      const queued = A.S.queue.map(q => q.ev);
      CIT.choose('cir_word', 1, true);
      const soothed = friends.map((x, i) => Math.round((x.rel[pc.id].op - mid[i]) * 10) / 10);
      return { small, big, line: lines[0], queued, soothed };
    });
    const ok = r.small.every(v => v === 0) && r.big.every(v => v <= -9 && v >= -11) && !!r.line && r.queued.includes('cir_word') && r.soothed.every((v, i) => v > r.big[i]);
    return { ok, detail: `after −5: their friends move ${r.small.join(', ')}; after −30: ${r.big.join(', ')}; telling your side first leaves ${r.soothed.join(', ')}. "${r.line}"` };
  },

  async cliqueForms(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = CIT.adult(203);
      const ms = [0, 1, 2].map(() => { const x = CIT.stranger(pc); A.link(pc, x, 'acquaint', 5, 'acquaint'); return x; });
      A.S.queue = [];
      A.queue({ type: 'event', ev: 'cir_clique', forced: true, ctx: {} });
      const before = ms.map(x => x.rel[pc.id].op);
      const res = CIT.choose('cir_clique', 0);
      const tied = ms.every(x => ms.every(y => x === y || (x.rel[y.id] && x.rel[y.id].op >= 40)));
      return { text: res && res.view.text, tied, warmer: ms.map((x, i) => Math.round(x.rel[pc.id].op - before[i])), clique: pc.clique && pc.clique.ids.length };
    });
    return { ok: r.tied && r.warmer.every(v => v >= 8) && r.clique === 3 && !/\{/.test(r.text), detail: `joined: the three are friends with each other ${r.tied}, warmer to you by ${r.warmer.join(', ')}. "${r.text}"` };
  },

  async circlesInRealLives(pg) {
    // the same lives with and without circles forming: how often the people you know know each other
    const r = await pg.evaluate(() => {
      const run = tie => {
        const keep = A.CIRCLES.TIE; A.CIRCLES.TIE = tie;
        let known = 0, inCircle = 0, met = 0, foes = 0;
        try {
          // nine lives: on three, two died within twelve years and their circles had no time to form
          for (const seed of [211, 212, 213, 214, 215, 216, 217, 218, 219]) {
            A.newGame({ seed, race: 'human', realm: ['POL-01', 'POL-03', 'POL-05'][seed % 3], status: ['artisan', 'merchant', 'peasant'][seed % 3], sex: seed % 2 ? 'M' : 'F', startAge: 18 });
            const end = A.S.year + 20;
            for (let g = 0; g < 3000 && A.S.year < end && A.pc().alive; g++) {
              A.advance(60);
              let h, n = 0;
              while ((h = A.headReady()) && n++ < 300) {
                if (h.type === 'event') A.eventAuto(); else if (h.type === 'choice') A.choiceChoose(0); else if (h.type === 'battle') A.battleClose();
                else if (h.type === 'duel') { A.duelAuto(h.d); A.duelClose(); } else A.S.queue.shift();
              }
            }
            const pc = A.pc();
            for (const id of Object.keys(pc.rel)) {
              const t = A.P(id); if (!t || !t.alive || A.CIRCLES.BLOOD.includes(pc.rel[id].type)) continue;
              // close to someone else you know, whatever you feel about them
              known++; if (A.CIRCLES.close(t).some(x => x.id !== pc.id && pc.rel[x.id])) inCircle++;
              if (pc.rel[id].circ) { met++; if (pc.rel[id].circ.e.length) foes++; }
            }
          }
        } finally { A.CIRCLES.TIE = keep; }
        return { known, inCircle, pct: Math.round(100 * inCircle / Math.max(1, known)), met, foes };
      };
      return { off: run(0), on: run(A.CIRCLES.TIE) };
    });
    const ok = r.on.pct >= r.off.pct + 10 && r.on.met > r.off.met;
    return { ok, detail: `people you know who are close to someone else you know: ${r.off.pct}% (${r.off.inCircle}/${r.off.known}) without circles forming, ${r.on.pct}% (${r.on.inCircle}/${r.on.known}) with; first meetings coloured by a circle ${r.off.met} → ${r.on.met} (${r.on.foes} through a foe)` };
  },

  async circlesOnScreen(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = CIT.adult(204), F = CIT.stranger(pc), t = CIT.stranger(pc);
      F.given = '<b>Bad</b>'; A.link(pc, F, 'friend', 70, 'friend'); A.link(t, F, 'friend', 60, 'friend'); A.link(pc, t, 'acquaint', 0, 'acquaint');
      UI.personModal(t);
      const st = JSON.stringify(A.rngState), s0 = JSON.stringify(A.S);
      const h = UI.personModal(t);
      return { pure: JSON.stringify(A.rngState) === st && JSON.stringify(A.S) === s0, raw: h.includes('<b>Bad</b>'), shown: /Circle: close to &lt;b&gt;Bad/.test(h) };
    });
    return { ok: r.pure && !r.raw && r.shown, detail: `circle line shown and escaped: ${r.shown && !r.raw}; render pure: ${r.pure}` };
  },
};
