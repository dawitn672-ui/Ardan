// Generals with a temper, and orders by letter (Road to Ten, War 3: "give AI generals personalities (cautious, bold,
// cunning) and visible plans. Your superior's orders arrive as letters you can follow or ignore, with consequences").
//
// In the release every AI army thinks alike (A.armyThink): it attacks a province when its odds pass a fixed bar, and
// sends a third of its divisions at once. Now the general's traits set a temper, and the temper moves four dials:
//   bold (brave, impetuous, wrathful, reckless, ambitious, proud): attacks at worse odds, sooner, with half its divisions;
//   cautious (craven, patient, calm, cautious, content): wants better odds and rested men, and sends fewer;
//   cunning (deceitful, witty, curious, paranoid): goes for the undefended and keeps away from forts;
//   steady (none of these, or a tie between them): the release's army.
// Each army keeps its plan (a.gtPlan), and the war room shows it with the temper. A soldier whose army has a plan gets
// it as a letter from his superior (or read out at muster, if he has no captain yet), at most every five months: go in first, hold and wait, make a noise, hold the line.
// Whatever he does, sixty days later the map says whether the plan worked, and that decides what comes of it.
//
// Engine side: A.armyThink reads the dials (patches) and is wrapped to record the plan; the month hook sends the
// letters and settles them. Rendering only reads the plan.
(function () {
  const G = A.GENERALS = {
    TRAITS: {
      bold: ['brave', 'impetuous', 'wrathful', 'reckless', 'ambitious', 'proud'],
      cautious: ['craven', 'patient', 'calm', 'cautious', 'content'],
      cunning: ['deceitful', 'witty', 'curious', 'paranoid'],
    },
    // need: multiplies the odds an attack must reach; spear: the share of divisions sent at once (the release: 1/3);
    // prep: multiplies the rest (organisation) and planning a division must have before it attacks;
    // weak: multiplies the pull of an undefended province and the push of a fort
    DIALS: {
      bold: { need: 0.88, spear: 1 / 2, prep: 0.7, weak: 1 },
      cautious: { need: 1.3, spear: 2 / 9, prep: 1.25, weak: 1 },
      cunning: { need: 1.1, spear: 2 / 9, prep: 1, weak: 2.2 },
      steady: { need: 1, spear: 1 / 3, prep: 1, weak: 1 },
    },
    NAMES: { bold: 'Bold', cautious: 'Cautious', cunning: 'Cunning', steady: 'Steady' },
    WAIT: 60,      // days before an order's outcome is known
    EVERY: 150,    // days between letters at least
  };
  // a person's temper as a general
  G.temper = function (p) {
    if (!p || !Array.isArray(p.traits)) return 'steady';
    let best = 'steady', top = 0, tie = false;
    for (const k of ['bold', 'cautious', 'cunning']) {
      const n = G.TRAITS[k].filter(t => p.traits.includes(t)).length;
      if (n > top) { best = k; top = n; tie = false; } else if (n && n === top) tie = true;
    }
    return top && !tie ? best : 'steady';
  };
  // an army's temper: its general's, unless the player leads it (then the player decides)
  G.of = function (a) {
    if (!a) return 'steady';
    if (a.gtForce && G.DIALS[a.gtForce]) return a.gtForce;   // for tests
    if (!a.gen || a.gen === A.S.pc) return 'steady';
    return G.temper(A.P(a.gen));
  };
  G.need = a => G.DIALS[G.of(a)].need;
  G.spear = a => G.DIALS[G.of(a)].spear;
  G.weak = a => G.DIALS[G.of(a)].weak;
  G.prep = a => G.DIALS[G.of(a)].prep;

  // the plan: where the army is sending divisions, and where it holds
  const think = A.armyThink;
  A.armyThink = function (a) {
    const r = think.apply(this, arguments);
    try {
      const S = A.S, ds = A.armyDivs(a), at = [], posts = {};
      for (const d of ds) {
        if (d.path && d.path.length === 1) { const P = S.prov[d.path[0]]; if (P && A.hostile(a.realm, A.ctrl(P)) && !at.includes(P.id)) at.push(P.id); }
        if (d.post != null) posts[d.post] = (posts[d.post] || 0) + 1;
      }
      const hold = Object.keys(posts).sort((x, y) => posts[y] - posts[x])[0];
      const old = a.gtPlan && Array.isArray(a.gtPlan.at) ? a.gtPlan.at.filter(j => S.prov[j] && A.hostile(a.realm, A.ctrl(S.prov[j]))) : [];
      a.gtPlan = { at: (at.length ? at : old).slice(0, 3), hold: hold != null ? +hold : null, stance: a.stance || null };
    } catch (e) {}
    return r;
  };
  // the plan in words, for the war room (pure)
  G.planText = function (a) {
    const t = G.of(a), pl = a && a.gtPlan, S = A.S;
    const names = pl && pl.at ? pl.at.map(j => S.prov[j] && S.prov[j].name).filter(Boolean) : [];
    const hold = pl && pl.hold != null && S.prov[pl.hold] ? S.prov[pl.hold].name : null;
    const list = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0];
    if (t === 'bold') return list ? `means to take ${list}, and will not wait for better odds` : 'looking for a fight';
    if (t === 'cautious') return hold ? `holds at ${hold}, and will move only at long odds in his favour` : 'waits for the enemy to move';
    if (t === 'cunning') return list ? `feints, and goes for what is left open: ${list}` : 'watching for a weak place';
    return list ? `holds the line and presses at ${list}` : hold ? `holds the line at ${hold}` : 'holds the line';
  };
  const row = UI.wrArmyRow;
  if (typeof row === 'function') UI.wrArmyRow = function (a) {
    const h = row.apply(this, arguments);
    try {
      if (!a || !a.gen || a.gen === A.S.pc) return h;
      const at = h.lastIndexOf('</div>');
      if (at < 0) return h;
      const t = G.of(a), line = `<div class="tiny"><b>${UI.esc(G.NAMES[t])}</b> · ${UI.esc(G.planText(a))}</div>`;
      return h.slice(0, at) + line + h.slice(at);
    } catch (e) { return h; }
  };

  // the soldier's army: his division's, or else his realm's first
  G.armyFor = function (pc) {
    if (!pc || !pc.mil) return null;
    const d = A.divById(pc.mil.div);
    if (d && d.army) { const a = A.army(d.army); if (a) return { a, d }; }
    const rid = pc.mil.realm || pc.realm, as = rid ? A.armiesOf(rid) : [];
    return as.length ? { a: as[0], d } : null;
  };
  // what the order is about: a province to take, and a province to hold
  G.orderFor = function (pc, a, d) {
    const S = A.S, pl = a.gtPlan || {}, mine = d && d.path && d.path.length === 1 ? d.path[0] : null;
    let tp = mine != null && A.hostile(a.realm, A.ctrl(S.prov[mine])) ? mine : (pl.at || [])[0];
    const pp = d && d.post != null ? d.post : pl.hold != null ? pl.hold : d ? d.loc : null;
    if (tp == null && pp != null) { const P = S.prov[pp]; const j = P && P.adj.find(x => A.hostile(a.realm, A.ctrl(S.prov[x]))); if (j != null) tp = j; }
    return { tp: tp != null ? tp : null, pp: pp != null ? pp : null };
  };

  // an order's effect key: obey (as ordered), letter (to the letter, no further), own (your own way), ignore
  (A.FX_EXTRA = A.FX_EXTRA || []).push('order');
  const apply = A.applyFx;
  A.applyFx = function (pc, fx, ctx) {
    const r = apply.apply(this, arguments);
    try {
      if (fx && typeof fx === 'object' && fx.order && ctx && ctx.order && pc && pc.id === A.S.pc) {
        const S = A.S, t = ctx.temper || 'steady', attack = t === 'bold' || t === 'cunning';
        const prov = attack ? ctx.tp : ctx.pp;
        if (prov != null) {
          S.goPend = (S.goPend || []).slice(-5);
          S.goPend.push({ due: A.absDay() + G.WAIT, k: fx.order, prov, realm: (pc.mil && pc.mil.realm) || pc.realm, gen: ctx.genId, t, tp: ctx.tp, pp: ctx.pp });
        }
      }
    } catch (e) { console.error('orders fx', e); }
    return r;
  };
  // sixty days on, the map says whether the plan worked
  G.settle = function (pc, o) {
    const P = A.S.prov[o.prov];
    if (!P || !pc || !pc.alive || !pc.mil) return null;
    const worked = A.ctrl(P) === o.realm || A.friendly(A.ctrl(P), o.realm);
    const ctx = { order: 2, genId: o.gen, temper: o.t, tp: o.tp, pp: o.pp, worked: worked ? 1 : 0 };
    const g = A.P(o.gen), gname = g ? A.fullName(g, false) : 'the general';
    if (o.k === 'obey' || o.k === 'letter') {
      if (worked) {
        const m = o.k === 'obey' ? 4 : 2;
        pc.mil.merit = (pc.mil.merit || 0) + m;
        A.log(`${gname}'s plan has worked: ${P.name} is ours. You did as you were told, and it is remembered (+${m} merit).`, 'good');
        return 'credit';
      }
      A.queue({ type: 'event', ev: 'go_blame', forced: true, ctx });
      return 'go_blame';
    }
    if (worked) {
      if (o.k === 'ignore') { A.queue({ type: 'event', ev: 'go_reckoning', forced: true, ctx }); return 'go_reckoning'; }
      A.log(`${gname}'s plan has worked: ${P.name} is ours. Nobody asks how your company went in.`, 'muted');
      return 'quiet';
    }
    A.queue({ type: 'event', ev: 'go_vindicated', forced: true, ctx });
    return 'go_vindicated';
  };

  A.onMonth.push(pc => {
    const S = A.S, now = A.absDay();
    // settle what is due
    if (S.goPend && S.goPend.length) {
      const due = S.goPend.filter(o => o.due <= now);
      if (due.length) { S.goPend = S.goPend.filter(o => o.due > now); for (const o of due) { try { G.settle(pc, o); } catch (e) { console.error('orders', e); } } }
    }
    // a new letter
    if (!pc || !pc.alive || !pc.mil || pc.mil.merc || pc.prison) return;   // a company fights where it is paid
    if (S.goNext && now < S.goNext) return;
    const F = G.armyFor(pc); if (!F) return;
    const a = F.a, g = A.P(a.gen);
    if (!g || !g.alive || g.id === pc.id || !A.atWar(a.realm).length) return;
    if (S.queue.some(q => q && q.ctx && q.ctx.order)) return;
    if (!A.chance(0.4)) return;
    const t = G.of(a), o = G.orderFor(pc, a, F.d);
    let kind = t;
    if ((t === 'bold' || t === 'cunning') && o.tp == null) kind = 'steady';
    if (o.pp == null && (kind === 'cautious' || kind === 'steady')) return;
    if (kind === 'steady' && o.tp == null) return;
    S.goNext = now + G.EVERY;
    A.queue({ type: 'event', ev: 'go_order_' + kind, forced: true, ctx: { order: 1, genId: g.id, temper: kind, tp: o.tp, pp: o.pp } });
  });
})();
