// 99997-v2-war, part 3: elite orders, few and terrible (V2_SPEC complaint 9).
//
// v2's orders (A.V2.orders): a handful in the world, 150-350 sworn members each, every member worth 14-26 levies, plus
// terror that shakes the men facing them; joining takes three trials. The game already has its orders (GD.ORDERS: the
// Iron Wolf, the Sun, the Greyfeathers, ...), each a division of its own in its realm's forces, with lore, ranks and a
// way in (A.orderJoin). So v2's rules are laid onto them rather than a second set of orders made:
//   - members: the release's sizes (200-300) are already inside 150-350, and stay;
//   - worth: 14 + 1.2 x (the order's experience - 80), held within 14-26 (the Greyfeathers 14, the Iron Wolf 18.8,
//     the Last Door 26); terror 0.25-0.45 from the same experience. Fixed by the order's record, not drawn;
//   - the division simulator: each order battalion (A.orderBuildCompanies) is scaled so that its attack, defence and
//     toughness per man are its worth times a levy's (GD.BN.LV), so in A.fightDay and A.divCombat an order of 260
//     fights like 3,000 to 7,000 levies, and takes a front no wider than its few men;
//   - terror: each day of a war-map fight with an order in it, every division on the other side loses order (its
//     morale) of terror x 3% of its full order, scaled by the order's men (full at 150);
//   - joining: A.orderJoin first runs v2's three trials (the endurance march, the weapon trial, the oath night) on
//     attempt(); fail one and the order sends you away for two years.
(function () {
  const V2 = A.V2 || {}, OR = V2.orders, OD = V2.odds, W = A.V2W;
  if (!OR || !W || !GD.ORDERS) return;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  W.ORDER = { W_MIN: 14, W_MAX: 26, TERROR_DAY: 0.03, RETRY_YEARS: 2 };
  W.orderWorth = id => { const o = GD.ORDERS[id]; return o ? Math.round(clamp(14 + 1.2 * ((o.exp || 80) - 80), W.ORDER.W_MIN, W.ORDER.W_MAX) * 10) / 10 : 1; };
  W.orderTerror = id => { const o = GD.ORDERS[id]; return o ? Math.round(clamp(0.25 + 0.02 * ((o.exp || 80) - 80), 0.25, 0.45) * 100) / 100 : 0; };
  W.orderList = () => Object.keys(GD.ORDERS).map(id => ({ id, name: GD.ORDERS[id].name, members: GD.ORDERS[id].size, worth: W.orderWorth(id), terror: W.orderTerror(id), levies: Math.round(GD.ORDERS[id].size * W.orderWorth(id)) }));

  // ---- the division simulator ---------------------------------------------------------------------------------------
  const pm = B => (B.soft + B.def + B.hp) / Math.max(1, B.men);
  W.scaleOrders = function () {
    const L = GD.BN.LV; if (!L) return;
    for (const id in GD.ORDERS) {
      const o = GD.ORDERS[id];
      (o.comps || []).forEach((c, i) => {
        const code = A.orderCode(id, i), B = GD.BN[code];
        if (!B || B.v2w) return;
        // the simulator multiplies by experience (A.xpLevel): the order's veterans are counted once, here
        const xm = A.xpLevel ? A.xpLevel(o.exp || 0)[2] || 1 : 1;
        const f = W.orderWorth(id) * pm(L) / Math.max(1e-6, pm(B)) / xm;
        GD.BN[code] = Object.assign({}, B, { soft: B.soft * f, hard: B.hard * f, def: B.def * f, brk: B.brk * f, hp: B.hp * f, v2w: Math.round(f * 100) / 100 });
      });
    }
    // (this runs at load, before any world exists, so no template has cached its sums yet: A.tplS keeps them in a
    // property that is never saved)
  };
  if (typeof A.orderBuildCompanies === 'function') {
    const ob = A.orderBuildCompanies;
    A.orderBuildCompanies = function () { const r = ob.apply(this, arguments); W.scaleOrders(); return r; };
  }
  W.scaleOrders();
  // an order's worth per member as the division simulator reads it, in levies (for the tests and the sheet)
  // (against an ordinary division of the same realm, as the simulator reads both, times that division's own worth)
  W.simWorth = function (d) {
    const per = x => { const c = A.divCombat(x); return (c.soft + c.def + c.hp) / Math.max(1, x.men); };
    const r = A.realm(d.r), line = r && r.forces ? r.forces.divs.filter(x => !x.elite && x.men > 500).sort((a, b) => (a.id < b.id ? -1 : 1))[0] : null;
    if (!line) { const L = GD.BN.LV; return per(d) / ((L.soft + L.def + L.hp) / L.men); }
    return per(d) / per(line) * (W.divWorth ? W.divWorth(line) : 1);
  };

  // the orders' page reads the same worth: members times their worth in levies (the release measured it against the
  // realm's biggest line division, which read 57 a member after the scaling, and nothing where a realm had none)
  if (typeof A.orderSummary === 'function') {
    const os = A.orderSummary;
    A.orderSummary = function (id) {
      const s = os.apply(this, arguments);
      try { if (s && GD.ORDERS[id]) { s.likeMen = Math.round((s.men || GD.ORDERS[id].size) * W.orderWorth(id)); s.v2worth = W.orderWorth(id); } } catch (e) {}
      return s;
    };
  }

  // ---- terror on the war map --------------------------------------------------------------------------------------------
  W.terrorDay = function (pid) {
    const F = A.S.fights && A.S.fights[pid]; if (!F) return;
    for (const [mine, theirs] of [[F.aIds, F.dIds], [F.dIds, F.aIds]]) {
      let t = 0;
      for (const id of mine) { const d = A.divById(id); if (d && d.elite && d.men > 0 && d.org > 0.5) t += W.orderTerror(d.elite) * Math.min(1, d.men / 150); }
      if (!t) continue;
      for (const id of theirs) { const d = A.divById(id); if (!d || d.elite) continue; d.org = Math.max(0, d.org - A.divMaxOrg(d) * W.ORDER.TERROR_DAY * Math.min(1, t)); }
    }
  };
  const fd = A.fightDay;
  A.fightDay = function (pid) {
    const r = fd.apply(this, arguments);
    try { W.terrorDay(pid); } catch (e) { console.error('v2 order terror', e); }
    return r;
  };

  // ---- three trials to join ----------------------------------------------------------------------------------------------
  W.applicant = function (pc) {
    const VS = A.V2S, s = VS && VS.stats ? VS.stats(pc) : null, m = VS ? VS.minds(pc) : { judgment: 100, will: 100 };
    return { capability: { march: s && s.march ? s.march : 35, worth: VS && VS.leviesOf ? VS.leviesOf(pc) : 1, will: m.will }, judgment: m.judgment, will: m.will };
  };
  W.trialFor = function (pc, id) {
    const o = GD.ORDERS[id];
    const order = { weapon: (o.req && o.req.skill && o.req.skill[0]) || 'sword', name: o.name };
    return OR.trial(W.dice(), OD.attempt, W.applicant(pc), order);
  };
  const join = A.orderJoin;
  if (typeof join === 'function') A.orderJoin = function (id) {
    const pc = A.pc(), o = GD.ORDERS[id];
    if (!pc || !o || pc.order) return join.apply(this, arguments);
    const miss = A.orderReqs ? A.orderReqs(pc, id).filter(x => !x.ok) : [];
    if (miss.length || !A.orderDiv(id)) return join.apply(this, arguments);
    pc.flags = pc.flags || {};
    const k = 'v2w_trial_' + id;
    if (pc.flags[k] != null && A.S.year - pc.flags[k] < W.ORDER.RETRY_YEARS) return { ok: false, msg: `${A.cap(o.name)} will not test you again before ${pc.flags[k] + W.ORDER.RETRY_YEARS}.` };
    const t = W.trialFor(pc, id);
    pc.v2wTrials = (pc.v2wTrials || 0) + 1;
    if (!t.passed) {
      pc.flags[k] = A.S.year;
      const fell = t.results.find(r => !r.success);
      const msg = `You fail ${fell.label}. ${A.cap(o.name)} sends you home.`;
      A.log(msg, 'bad');
      return { ok: false, msg };
    }
    A.log(`You pass the three trials of ${o.name}: ${t.results.map(r => r.label).join(', ')}.`, 'good');
    return join.apply(this, arguments);
  };
})();
