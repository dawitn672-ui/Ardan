// W1-6 part c: risings (docs/design/war.md §13.4; D-099). Each is a person's decision through A.WHY, never a roll:
//
//   A.PAX.claimQ(r, cl, ctx)   a claimant presses his claim or kneels (kind 'claim'): his blood, a child heir, the
//                                throne's doubted right, the realm shaking, the houses sore enough to back him, his
//                                ambition; against, his oath and the realm's peace, the crown's hosts. Asked at a ruler's
//                                death (the release's contested-succession roll is gone: the claimant is asked), in a
//                                tottering realm each year (its 1-in-20 roll is gone) and by 20's A.aiPressClaim.
//   A.PAX.lordRiseQ(r, h)      a great lord with a deep grievance rises against a ruling player or bides (kind 'rise';
//                                the release's A.vassalYear rolled 0.15).
//   A.PAX.commonsQ(r)          the commons rise (§13.4: a shared grievance, a voice, an occasion), decided by the voice
//                                (a named leader of the commons: the Polity's, else a priest of the realm's council); no
//                                voice, no rising (the release's A.rulerYear rolled 0.35 under stability 15).
//   A.PAX.sides(r, nr, w, f)   when a league rises, every other great lord chooses the crown, the rebels or his own
//                                hall (kind 'side'): his loyalty, a tie to the rebels, the two sides' swords, his seat.
(function () {
  const PE = A.PAX, W = () => A.WHY;
  if (!PE) return;
  const { clamp, live, short } = PE;
  const r2 = x => Math.round(x * 100) / 100;
  const rs = (kind, weight, label, source, pub) => ({ kind, weight: r2(weight), label, source, pub: pub ? 1 : 0 });
  Object.assign(PE.T, { claimBand: 1, riseBand: .8, sideBand: 1, commonsAt: 25, lordAt: 25 });
  W().T.kindCap = Object.assign({ claim: 20, rise: 10, side: 20, commons: 10 }, W().T.kindCap || {});
  const crownMen = r => Math.max(1, (r.army || 0) + (A.MEN ? A.MEN.reserve(r) * .1 : (r.roll || 0) * .1));

  // the houses sore with the crown, as a share of the realm's swords (who would back a claim or a rising)
  PE.soreShare = function (r, below) {
    let all = 0, sore = 0;
    for (const h of A.realmHouses(r.id)) { const s = A.houseStrength(h); all += s; if ((h.op != null ? h.op : 50) < (below || 35)) sore += s; }
    return all > 0 ? sore / all : 0;
  };

  // ---------------------------------------------------------------- a claimant
  PE.claimQ = function (r, cl, ctx) {
    ctx = ctx || {};
    if (!r || !live(cl)) return null;
    const old = ctx.old || (r.ruler != null ? A.P(r.ruler) : null), heir = ctx.heir || null;
    const kin = old && old.rel && old.rel[cl.id] && ['sibling', 'child'].includes(old.rel[cl.id].type);
    const h = cl.house && A.S.houses[cl.house], great = h && h.great !== false && ['N01', 'N02', 'N03'].includes(h.rung);
    const R = heir && GD.RACES ? GD.RACES[heir.race] : null, child = !!(heir && R && A.age(heir) < R.adult);
    const legit = r.legit != null ? r.legit : 50, stab = r.stability != null ? r.stability : 50, sore = PE.soreShare(r);
    const press = [
      kin ? rs('claim', 1, 'The blood of kings', { t: 'blood', id: old.id }, 1) : great ? rs('claim', .4, `The name of ${h.name}`, { t: 'house', id: h.id }, 1) : rs('claim', -.6, 'A thin claim', { t: 'blood' }, 1),
      rs('ambition', .5, 'The crown within his reach', { t: 'ambition' }, 0),
      rs('claim', (50 - legit) / 20, legit < 50 ? 'The crown\'s right is doubted' : 'The crown\'s right is accepted', { t: 'legit', r: Math.round(legit) }, 1),
      rs('reckoning', Math.min(1.5, (35 - stab) / 12), stab < 35 ? 'The realm is shaking' : 'The realm is quiet', { t: 'stability', r: Math.round(stab) }, 1),
      rs('want', sore >= .1 ? 4 * sore - .3 : -1, sore >= .1 ? 'Lords sore with the crown would back him' : 'No lord would back him', { t: 'backers', r: r2(sore) }, 0),
    ];
    if (child) press.push(rs('reckoning', 1.6, 'A child would rule', { t: 'child', id: heir.id }, 1));
    return W().decide(cl, 'claim', [
      { id: 'press', at: r.id, feeds: ['pride', 'anger', 'greed'], reasons: press },
      { id: 'kneel', at: r.id, feeds: ['fear'], reasons: [
        rs('loyalty', 2.2, 'His oath, and the peace of the realm', { t: 'oath' }, 1),
        rs('fear', .9, 'The crown\'s hosts', { t: 'hosts', r: Math.round(r.army || 0) }, 0),
        r.claimY && A.S.year - r.claimY < 8 ? rs('fear', 1.5, 'The last claim to this crown was fought only lately', { t: 'claimed', y: r.claimY }, 1) : null,
      ].filter(Boolean) },
    ], { band: PE.T.claimBand, r: r.id, at: 'crown', logIf: rec => rec.chose === 'press' });
  };
  // 20-ai-personality's A.aiPressClaim asks this (the rulers' log keeps its line); true when he presses
  PE.presses = function (r, cl, ctx) {
    const rec = PE.claimQ(r, cl, ctx);
    if (!rec) return false;
    if (rec.chose === 'press') {
      r.claimY = A.S.year;
      PE.note(r, { k: 'claim', chose: 'press', p: cl.id, via: ctx && ctx.heir ? 'death' : 'shaking', st: Math.round(r.stability || 0) }, rec);
      if (A.aiLogAdd) A.aiLogAdd('claim', r.id, null, `refuses to kneel and claims the throne of ${short(r.id)}.`, (rec.why || []).map(x => [x[0], x[1]]), `claimant ${A.fullName(cl, false)}`);
    }
    return rec.chose === 'press' ? rec : false;
  };
  // the claimant a crown would face: the eldest grown brother or child of the old ruler, else the head of the realm's
  // greatest house (the release picked one at random)
  PE.claimantOf = function (r, heir, oldRuler) {
    const pc = A.pc(), adult = p => A.age(p) >= GD.RACES[p.race].adult, cand = [];
    if (oldRuler) for (const x of A.relsOf(oldRuler, ['sibling', 'child'])) if (x.p.alive && (!heir || x.p.id !== heir.id) && adult(x.p) && !x.p.ruler) cand.push(x.p);
    if (pc && pc.alive && pc.realm === r.id && (!heir || pc.id !== heir.id) && !pc.ruler && (pc.house === r.house || (pc.noble && pc.noble.rung >= 6)) && adult(pc)) cand.push(pc);
    if (cand.length) return cand.sort((a, b) => (a.born || 0) - (b.born || 0) || String(a.id).localeCompare(String(b.id)))[0];
    const hs = A.realmHouses(r.id).filter(h => ['N01', 'N02', 'N03'].includes(h.rung) && h.great !== false)
      .sort((a, b) => A.houseStrength(b) - A.houseStrength(a) || String(a.id).localeCompare(String(b.id)));
    return hs.length ? A.houseHead(hs[0].id) : null;
  };

  // a neighbour's crown takes a side in a war of succession: the claimant's (att) or the crown's (def)
  PE.meddleQ = function (o, r, cl, side) {
    if (!o || !r) return false;
    const rel = A.relBetween(o.id, r.id), ratio = A.realmPower(o) / Math.max(1, A.realmPower(r)), weary = o.exhaustion || 0;
    const join = side === 'att'
      ? [rs('grudge', (-rel - 30) / 25, `Bad blood with ${short(r.id)}`, { t: 'opinion', at: r.id, r: rel }, 1), rs('ambition', .5, `A grateful king of ${short(r.id)}, if ${live(cl) ? A.fullName(cl, false) : 'the claimant'} wins`, { t: 'claimant', id: cl ? cl.id : null }, 0)]
      : [rs('duty', 1, `His alliance with ${short(r.id)}`, { t: 'ally', at: r.id }, 1), rs('kin', (rel - 40) / 30, `Friendship with ${short(r.id)}`, { t: 'opinion', at: r.id, r: rel }, 1)];
    join.push(rs('reckoning', .8 * (Math.min(2, ratio) - 1), ratio >= 1 ? 'His hosts can spare the men' : 'His hosts are few', { t: 'ratio', r: r2(ratio) }, 0));
    const rec = W().decide(o.id, 'war', [
      { id: 'join', at: r.id, feeds: side === 'att' ? ['anger', 'pride', 'greed'] : ['love'], reasons: join },
      { id: 'stay', at: r.id, feeds: ['fear'], reasons: [rs('cost', 1 + weary / 50, 'The cost of a war in men, coin and the harvest', { t: 'cost', r: Math.round(weary) }, 0)] },
    ], { band: 1, r: o.id, at: r.id, logIf: x => x.chose === 'join' });
    return !!(rec && rec.chose === 'join');
  };

  // ---------------------------------------------------------------- a great lord rises against a ruling player
  PE.lordRiseQ = function (r, h) {
    const hp = h.headPid != null ? A.P(h.headPid) : null;
    if (!live(hp) || hp.id === A.S.pc) return null;
    const op = h.op != null ? h.op : 50, stab = r.stability != null ? r.stability : 50;
    const ratio = A.houseStrength(h) / crownMen(r), f = PE.factionOf(h);
    const allies = f ? f.members.filter(id => id !== h.id).length : 0;
    const backer = A.neighbors(r.id).map(A.realm).find(o => o && o.alive && !o.isRebel && A.relBetween(o.id, r.id) < -40);
    const rise = [
      rs('grudge', (30 - op) / 8, 'His grievance with the crown', { t: 'opinion', id: h.id, r: Math.round(op) }, 1),
      rs('reckoning', (45 - stab) / 15, stab < 45 ? 'The throne is shaking' : 'The throne stands firm', { t: 'stability', r: Math.round(stab) }, 1),
      rs('reckoning', 3 * Math.min(1.5, ratio) - 1.2, ratio >= .5 ? 'His men are many beside the crown\'s' : 'His men are few beside the crown\'s', { t: 'ratio', r: r2(ratio) }, 0),
      rs('ambition', .4, 'He thinks his blood as good as the king\'s', { t: 'ambition' }, 0),
    ];
    if (allies) rise.push(rs('kin', .4 * Math.min(3, allies), `${allies} house${allies === 1 ? '' : 's'} of his league beside him`, { t: 'faction', id: f.id }, 1));
    if (backer) rise.push(rs('want', .6, `${short(backer.id)} would back him`, { t: 'backer', at: backer.id }, 0));
    if (A.S.wars.some(w => w.cb === 'throne' && w.def.includes(r.id))) rise.push(rs('reckoning', -2, 'A war for the throne is already fought', { t: 'war' }, 1));
    return W().decide(hp, 'rise', [
      { id: 'rise', at: r.id, feeds: ['anger', 'pride', 'grudge'], reasons: rise },
      { id: 'bide', at: r.id, feeds: ['fear'], reasons: [rs('loyalty', 1.2, 'His oath to the crown', { t: 'oath' }, 1), rs('fear', 1, 'A rising that fails ends on the block', { t: 'risk' }, 0)] },
    ], { band: PE.T.riseBand, r: r.id, at: h.id, logIf: rec => rec.chose === 'rise' });
  };
  // the release's A.vassalYear: the lords of a ruling player's realm (their loyalty moved in A.factionsYear already)
  PE.vassalYear = function (pc, r) {
    for (const h of A.realmHouses(r.id)) {
      if ((h.op != null ? h.op : 50) >= PE.T.lordAt) continue;
      const rec = PE.lordRiseQ(r, h);
      if (!rec || rec.chose !== 'rise') continue;
      const head = A.houseHead(h.id);
      if (!head || !head.alive) continue;
      PE.note(r, { k: 'rise', chose: 'rise', h: h.id }, rec);
      A.log(`${h.name} rises against you! ${A.fullName(head)} claims your crown. ${W().tell(rec, true)}`, 'war');
      A.successionWar(r, head);
      return;
    }
  };

  // ---------------------------------------------------------------- the commons
  // the voice: a named leader of the commons (the Polity's), else the Chaplain (a priest of the people)
  PE.voiceOf = function (r) {
    const e = r.pol && r.pol.est && r.pol.est.comm, p = e && e.lead ? A.P(e.lead) : null;
    if (live(p) && p.id !== A.S.pc) return p;
    const c = r.council && r.council.chaplain ? A.P(r.council.chaplain) : null;
    return live(c) && c.id !== A.S.pc ? c : null;
  };
  PE.commonsQ = function (r) {
    const v = PE.voiceOf(r);
    if (!v) return null;
    const stab = r.stability != null ? r.stability : 50, POL = A.POL;
    const ap = POL && POL.approval && r.pol ? POL.approval(r, 'comm') : 0, bread = POL && POL.grainIdx ? POL.grainIdx(r) : 1;
    const tax = r.laws && r.laws.tax ? r.laws.tax : 1, lost = ((r.pol && r.pol.lost) || []).filter(y => A.S.year - y < 3).length;
    const rise = [
      rs('grudge', -ap / 3, ap < 0 ? 'The commons\' grievance' : 'The commons have little to complain of', { t: 'estate', id: 'comm', r: ap }, 1),
      rs('reckoning', (PE.T.commonsAt - stab) / 8, 'The realm is breaking: the occasion', { t: 'stability', r: Math.round(stab) }, 1),
    ];
    if (bread >= 1.5) rise.push(rs('want', Math.min(2, bread - 1), 'Bread they cannot buy', { t: 'bread', r: r2(bread) }, 1));
    if (tax > 1) rise.push(rs('grudge', tax >= 1.5 ? 1.2 : .6, tax >= 1.5 ? 'Crushing taxes' : 'Heavy taxes', { t: 'tax', r: tax }, 1));
    if ((r.exhaustion || 0) >= 30) rise.push(rs('grudge', (r.exhaustion || 0) / 40, 'Sons taken for the crown\'s wars', { t: 'weary', r: Math.round(r.exhaustion) }, 1));
    if (lost) rise.push(rs('reckoning', .6, 'A war lost: men home unpaid, with their arms', { t: 'lost', r: lost }, 1));
    return W().decide(v, 'commons', [
      { id: 'rise', at: r.id, feeds: ['anger', 'zeal'], reasons: rise },
      { id: 'endure', at: r.id, feeds: ['fear'], reasons: [rs('fear', 1.6, 'The crown\'s soldiers and its gibbets', { t: 'soldiers', r: Math.round(r.army || 0) }, 0)] },
    ], { band: PE.T.riseBand, r: r.id, at: 'crown', logIf: rec => rec.chose === 'rise' });
  };

  // ---------------------------------------------------------------- the other lords choose a side (§13.4)
  PE.sideOptions = function (r, h, rebels, rebelMen) {
    const op = h.op != null ? h.op : 50, ratio = rebelMen / crownMen(r);
    let tie = null;
    for (const id of rebels) { const o = A.S.houses[id]; const t = o && PE.tieOf ? PE.tieOf(h, o) : null; if (t) { tie = [t, o]; break; } }
    const hp = h.headPid != null ? A.P(h.headPid) : null, seat = live(hp) && A.POSTS && A.POSTS.held(hp.id).some(k => /^seat:/.test(k));
    return [
      { id: 'crown', reasons: [
        rs('loyalty', .8 + (op - 50) / 25, op >= 50 ? 'His loyalty to the crown' : 'His oath, though he has little love for the crown', { t: 'opinion', id: h.id, r: Math.round(op) }, 1),
        rs('reckoning', 1.2 * (1 - Math.min(2, ratio)), ratio < 1 ? 'The crown is the stronger' : 'The rebels are as strong as the crown', { t: 'ratio', r: r2(ratio) }, 0),
        seat ? rs('want', .8, 'His seat on the king\'s council', { t: 'seat', id: hp.id }, 1) : null,
      ].filter(Boolean) },
      { id: 'rebels', reasons: [
        rs('grudge', (40 - op) / 10, 'His grievance with the crown', { t: 'opinion', id: h.id, r: Math.round(op) }, 1),
        tie ? rs('kin', 1, `${tie[0][0].toUpperCase() + tie[0].slice(1)} with ${tie[1].name}`, { t: 'tie', id: tie[1].id }, 1) : rs('kin', -.5, 'No tie to the houses that rose', { t: 'tie' }, 0),
        rs('reckoning', 1.2 * (Math.min(2, ratio) - 1), 'The rebels\' swords', { t: 'ratio', r: r2(ratio) }, 0),
      ] },
      { id: 'home', reasons: [rs('fear', .9, 'A war between his own lord\'s lords is no place to be', { t: 'risk' }, 0), rs('want', .3, 'His own lands to hold', { t: 'lands' }, 1)] },
    ];
  };
  PE.sides = function (r, nr, w, members) {
    const S = A.S, out = { crown: 0, rebels: 0, home: 0 };
    if (!r || !nr || !w) return out;
    const tics = (A.CMD && A.CMD.tics ? A.CMD.tics(r.id) : A.realmHouses(r.id)).filter(h => !members.includes(h.id) && !(h.headPid != null && h.headPid === S.pc));
    let rebelMen = members.reduce((a, id) => a + A.houseStrength(S.houses[id] || {}), 0);
    for (const h of tics.slice(0, 12)) {
      const rec = W().decide(W().houseMind(h), 'side', PE.sideOptions(r, h, members, rebelMen), { band: PE.T.sideBand, r: r.id, at: w.id, logIf: x => x.chose !== 'crown' });
      if (!rec) continue;
      out[rec.chose]++;
      if (rec.chose === 'rebels') {
        const men = Math.round(A.houseStrength(h) * .6);
        nr.army = (nr.army || 0) + men;
        r.army = Math.max(0, (r.army || 0) - men);
        rebelMen += A.houseStrength(h);
        h.op = clamp((h.op || 50) - 10, 0, 100);
        PE.note(r, { k: 'side', chose: 'rebels', h: h.id, w: w.id }, rec);
      }
    }
    w.sides = out;
    return out;
  };
})();
