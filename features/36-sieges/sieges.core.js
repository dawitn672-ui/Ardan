// Playable sieges (Road to Ten, War 5). In the release a siege is a day counter: a besieged province falls when
// P.sgd reaches P.sgNeed (set by its walls, its people and the general's siegecraft), and nobody inside or outside
// decides anything. Now, once a month, whoever is in a siege chooses, from either side of the wall:
//   outside, with your division: mine under the walls, storm the breach, tighten the ring, or keep the camp clean;
//   inside, in your besieged home: ration the bread, sortie at night, buy smuggled food, or speak for surrender.
// The choices move the real counter (P.sgd), so they move when the walls fall. Every month a siege runs, sickness
// grows in the camp (P.sgSick): it thins the besiegers and can take you. When the town falls, the side you were on
// gets the end of it: the sack or the mercy.
//
// Engine side only: the month hook and the event effects change state; the event text reads it.
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const SG = A.SIEGE = {};
  // where the player stands in a siege, if anywhere: { P, side: 'out' | 'in', d }
  SG.role = function (pc) {
    if (!pc || !pc.alive || pc.prison) return null;
    if (pc.mil && pc.mil.div) {
      const d = A.divById(pc.mil.div);
      if (d && d.sieging) { const P = A.S.prov[d.loc]; if (P && P.sgBy === d.r) return { P, side: 'out', d }; }
      return null;   // a soldier elsewhere is not at home to defend it
    }
    const P = A.prov(pc.home);
    if (P && P.sgBy && A.hostile(P.sgBy, A.ctrl(P)) && A.friendly(A.ctrl(P), pc.realm)) return { P, side: 'in', d: null };
    return null;
  };
  // the siege as words, for the events
  SG.state = function (P) {
    const need = Math.max(1, P.sgNeed || 30), done = clamp((P.sgd || 0) / need, 0, 1), left = Math.max(0, Math.round(need - (P.sgd || 0)));
    const walls = done < 0.25 ? 'whole' : done < 0.5 ? 'scarred' : done < 0.8 ? 'cracked' : 'breached in places';
    const food = done < 0.3 ? 'enough' : done < 0.6 ? 'short' : done < 0.85 ? 'rationed to a crust' : 'gone';
    const sick = (P.sgSick || 0) < 15 ? 'little' : (P.sgSick || 0) < 40 ? 'spreading' : 'everywhere';
    return { days: Math.round(P.sgd || 0), left, walls, food, sick, place: P.name };
  };
  // move the siege: + brings the fall nearer, - pushes it away (in days)
  SG.push = function (P, days) { if (P && P.sgBy) P.sgd = clamp((P.sgd || 0) + days, 0, (P.sgNeed || 30) + 1); };
  SG.fromCtx = ctx => (ctx && ctx.loc != null ? A.S.prov[ctx.loc] : null);

  // effect keys for siege events: siege (a share of the whole siege: + brings the fall nearer), sgSick (camp
  // sickness), sgTerms (you spoke for surrender, so the town falls on terms). The siege is ctx.loc.
  (A.FX_EXTRA = A.FX_EXTRA || []).push('siege', 'sgSick', 'sgTerms');
  const apply = A.applyFx;
  A.applyFx = function (pc, fx, ctx) {
    const r = apply.apply(this, arguments);
    try {
      if (fx && typeof fx === 'object' && (fx.siege || fx.sgSick || fx.sgTerms)) {
        const P = SG.fromCtx(ctx);
        if (P) {
          if (fx.siege && P.sgBy) SG.push(P, fx.siege * Math.max(1, P.sgNeed || 30));
          if (fx.sgSick) P.sgSick = clamp((P.sgSick || 0) + fx.sgSick, 0, 100);
          if (fx.sgTerms) P.sgTerms = 1;
        }
      }
    } catch (e) { console.error('siege fx', e); }
    return r;
  };

  // the month: sickness in the camp, and the player's choice
  A.onMonth.push(pc => {
    const S = A.S;
    for (const P of S.prov) {
      if (!P.sgBy) { if (P.sgSick) P.sgSick = Math.max(0, P.sgSick - 10); continue; }
      P.sgSick = clamp((P.sgSick || 0) + 6, 0, 100);
      const sick = P.sgSick / 1500;   // up to 6.7% of the besiegers a month at its worst
      if (sick > 0) for (const d of A.divsAt(P.id)) if (d.r === P.sgBy && d.sieging) A.divLose(d, d.men * sick);
    }
    const R = SG.role(pc);
    if (!R) return;
    const key = R.P.id + ':' + S.year + ':' + Math.floor((A.today ? A.today() : 0) / 30.42);
    if (S.sgAsked === key) return;
    S.sgAsked = key;
    if (A.S.queue.some(q => q && q.ctx && q.ctx.siege)) return;
    // forced: headReady drops an event seen in the last 240 days, which would leave one choice per siege. The setup
    // still drops the scene once the siege is over.
    A.queue({ type: 'event', ev: R.side === 'out' ? 'sg_camp' : 'sg_walls', forced: true, ctx: { loc: R.P.id, siege: 1 } });
    // camp fever can take the besieger too
    if (R.side === 'out' && A.chance((R.P.sgSick || 0) / 400)) {
      pc.health = clamp(pc.health - A.ri(8, 18), 0, 100); pc.lastHurt = 'camp fever';
      A.log(`Camp fever goes through the lines at ${R.P.name}, and through you.`, 'bad');
    }
  });

  // the fall: the side you were on gets the end of it
  const occupy = A.occupy;
  A.occupy = function (P, rid) {
    const pc = A.pc(), R = SG.role(pc), was = R && R.P === P ? R.side : null, surrendered = P && P.sgTerms;
    const r = occupy.apply(this, arguments);
    try {
      if (P) { P.sgSick = 0; P.sgTerms = 0; }
      if (pc && pc.alive && was === 'out') A.queue({ type: 'event', ev: 'sg_taken', ctx: { loc: P.id, siege: 1 } });
      if (pc && pc.alive && was === 'in') A.queue({ type: 'event', ev: surrendered ? 'sg_terms' : 'sg_sacked', ctx: { loc: P.id, siege: 1 } });
    } catch (e) { console.error('sieges', e); }
    return r;
  };
})();
