// Powers wave 1, part 3: meeting a being (the cards pw_encounter and pw_great; docs/design/powers.md).
//
// Every choice's odds come from the power scale and the being's own ways, in words on the card (never a number):
//   flee   your speed against its speed, flight and way of hunting (a chaser runs you down; running provokes some)
//   calm   what turns its kind away (fire, stillness, food thrown, courtesy...), against its temper and hunger
//   fight  A.POWER.compare: the might and the matchup of the profiles. Close (within a few levels): the duel engine fights
//          it out. Far apart: settled here, at once: death or flight when it is far above you, a kill when far below
//   speak  only a speaking or wise being: it answers through A.WHY.decide, with its reasons (hunger, its view of people,
//          your courtesy, its pride against your weakness, an old grudge against your realm or people)
// A great being met (pw_great) answers how its character sheet says it answers being sought, flattered, attacked or
// ignored, bent by its grudges and loves toward your realm and people, its hunger and its pride, through A.WHY.
(function () {
  const PW = A.POWER;
  if (!PW) return;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const art = s => (/^the /i.test(s) ? '' : /^[aeiou]/i.test(s) ? 'an ' : 'a ');
  const low = s => String(s || '').replace(/^The /, 'the ');
  const cap = s => { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };
  const why = (w, kind, label, pub) => ({ kind, weight: w, label, source: { t: 'meet' }, pub: pub !== false });

  // ---------------------------------------------------------------- the being on the card
  PW.wildOf = ctx => { const st = A.S && A.S.pw; return ctx && ctx.wid && st && st.wild ? st.wild.find(w => w.id === ctx.wid && !w.dead) || null : null; };
  PW.foe = function (ctx) {
    const w = PW.wildOf(ctx);
    return w ? PW.being(w) : PW.being({ sp: ctx.sp, key: ctx.key || '' });
  };
  PW.foeName = function (ctx) {
    const w = PW.wildOf(ctx), s = PW.species(ctx.sp);
    return w && w.name ? `${w.name} the ${s.n}` : low(s ? s.n : 'beast');
  };

  // ---------------------------------------------------------------- odds (0-1)
  PW.fleeP = function (p, ctx) {
    const b = PW.foe(ctx), s = PW.species(ctx.sp), me = PW.being(p);
    if (!b || !s) return 0.5;
    let q = 0.62 + (me.prof.spd - b.prof.spd) * 0.05;
    if (b.prof.flight >= 6) q -= 0.12;
    if (s.beh.hunt === 'chase') q -= 0.1; else if (s.beh.hunt === 'ambush') q -= 0.05; else if (s.beh.hunt === 'graze') q += 0.1;
    if ((s.beh.provoked || []).includes('running')) q -= 0.12;
    if (s.beh.nature && ['relentless', 'bloodthirsty'].includes(s.beh.nature.k)) q -= 0.1;   // it does not give up the chase
    if ((s.beh.calmed || []).some(c => /distance|path away|retreat|backing/.test(c))) q += 0.08;
    if (['pack', 'swarm', 'host'].includes(s.beh.social)) q -= 0.06;
    if (b.temper) q += b.temper.k === 'wary' ? 0.06 : b.temper.k === 'bold' || b.temper.k === 'hungry' ? -0.06 : 0;
    if (me.t - b.t >= 10) q += 0.15;
    if (ctx.hunt) q += 0.15;   // the hunter chose the ground
    return clamp(q, 0.06, 0.95);
  };
  // what turns its kind away; null for a kind with a nature nothing soothes (bloodthirsty, relentless, mindless, cruel)
  PW.calmWord = ctx => { const s = PW.species(ctx.sp); return (s && s.beh.calmed && s.beh.calmed[0]) || null; };
  PW.calmP = function (p, ctx) {
    const b = PW.foe(ctx), s = PW.species(ctx.sp);
    if (!b || !s) return 0.4;
    let q = 0.42 + (A.skill ? (A.skill(p, 'survival') || 0) / 220 : 0) + ((A.stat ? A.stat(p, 'ins') : 40) - 40) / 300;
    q += { avoids: 0.15, ignores: 0.1, tolerates: 0.05, curious: 0.05, bargains: 0, hunts: -0.15, hates: -0.25 }[s.beh.people] || 0;
    if (b.temper) q += b.temper.k === 'calm' ? 0.1 : b.temper.k === 'hungry' ? -0.1 : b.temper.k === 'bold' ? -0.05 : 0;
    if (PW.season() === s.beh.mating) q -= 0.08;
    q -= Math.max(0, b.prof.cunning - 6) * 0.03;
    return clamp(q, 0.05, 0.9);
  };
  PW.fightP = (p, ctx) => { const c = PW.compare(p, PW.foe(ctx)); return c ? c.p : 0.5; };
  // a speaking or wise being's answer: the options and their reasons
  PW.talkOptions = function (p, ctx) {
    const b = PW.foe(ctx), s = PW.species(ctx.sp), me = PW.being(p);
    const gap = b.t - me.t, se = PW.season(), hungry = se === 'winter' || (s.beh.drives || [])[0] === 'hunger';
    const courtesy = clamp(((A.skill ? A.skill(p, 'persuasion') || 0 : 0) + (A.skill ? A.skill(p, 'diplomacy') || 0 : 0) * 0.5) / 40, 0, 1.6);
    const view = s.beh.people;
    return [
      { id: 'spare', reasons: [why(courtesy, 'sympathy', 'your courtesy'), why(view === 'bargains' || view === 'curious' ? 0.8 : view === 'tolerates' ? 0.5 : 0, 'temper', `its kind ${view === 'curious' ? 'is curious about' : view === 'tolerates' ? 'tolerates' : 'deals with'} people`), why(gap < 0 ? 0.8 : 0, 'fear', 'you are stronger than it')] },
      { id: 'demand', reasons: [why(s.beh.guards === 'hoard' || s.beh.drives.includes('hoarding') ? 0.9 : 0.4, 'coin', `it wants something for its ${s.beh.guards}`), why(gap > 4 ? 0.5 : 0, 'station', 'you are smaller than it')] },
      { id: 'attack', reasons: [why(hungry ? 0.9 : 0.2, 'want', hungry ? 'it is hungry' : 'it has fed'), why(view === 'hates' ? 1.6 : view === 'hunts' ? 0.9 : 0, 'temper', `its kind ${view} people`), why(gap > 10 ? 0.6 : gap < -4 ? -1 : 0, 'reckoning', gap > 10 ? 'you are nothing to it' : 'you could hurt it')] },
    ];
  };
  const mindOf = (ctx, b) => ({ id: 'beast:' + (ctx.wid || ctx.sp), temper: { pride: b.temper && b.temper.k === 'bold' ? 0.6 : 0.2, wrath: b.temper && b.temper.k === 'hungry' ? 0.5 : 0, caution: b.temper && b.temper.k === 'wary' ? 0.6 : 0, greed: 0.3 }, feel: [] });
  PW.talkP = function (p, ctx) {
    const b = PW.foe(ctx);
    if (!b || !A.WHY || !A.WHY.E || !A.WHY.E.odds) return 0.4;
    const o = A.WHY.E.odds(mindOf(ctx, b), PW.talkOptions(p, ctx), {});
    return o ? clamp((o.spare || 0) + 0.5 * (o.demand || 0), 0.04, 0.96) : 0.4;
  };
  PW.canTalk = ctx => { const b = PW.foe(ctx), s = PW.species(ctx.sp); return !!b && (b.int === 'speaking' || b.int === 'wise') && !(s && s.beh.nature); };

  // ---------------------------------------------------------------- the card's words (at most 80 once rendered)
  PW.encText = function (p, ctx) {
    const b = PW.foe(ctx), s = PW.species(ctx.sp);
    if (!b || !s) return 'Something moves in the dark, and is gone.';
    const me = PW.being(p), c = PW.compare(me, b), band = PW.band(b.level), w = PW.wildOf(ctx);
    const who = w && w.name ? `${w.name}, ${art(s.n)}${low(s.n)}${w.titles && w.titles[0] ? ' called ' + w.titles[0].n : ''}` : `${art((b.temper ? b.temper.w + ' ' : '') + s.n)}${b.temper ? b.temper.w + ' ' : ''}${low(s.n)}`;
    const lead = ctx.hunt ? (ctx.famous ? `After weeks of tracking you find ${who}.` : `You came for game and found ${who}.`) : `Near ${ctx.place || 'the road'}: ${who}.`;
    const edge = c.edges.length ? ` ${cap(c.edges[0].t)}.` : '';
    const mind = b.int === 'beast' ? '' : b.int === 'cunning' ? ' It is cunning.' : ' It can speak.';
    return `${lead} ${cap(ctx.cause || PW.cause(s))}. It is ${PW.gapWords(c.gap)}: ${band.r} rank, ${band.w} (level ${b.level}; you stand at ${me.level}).${edge}${mind}`;
  };

  // ---------------------------------------------------------------- what happens
  const hurt = function (p, amount, cause, pen) {
    p.health -= Math.round(amount);
    p.lastHurt = cause;
    if (amount >= 25 && A.addWound) A.addWound(p, A.pick(['deep_cut', 'broken_ribs', 'scar_arm', 'limp']));
    if (p.health <= 0 && A.mortalCheck) A.mortalCheck(p, cause, pen || 0);
    return !p.alive;
  };
  const dropsOf = s => (s.drops || []).reduce((a, d) => a + d.worth, 0);
  PW.slainBy = function (p, ctx) {
    const w = PW.wildOf(ctx), s = PW.species(ctx.sp);
    if (w) { w.dead = A.S.year; w.by = 'the player'; if (w.name) A.news(`${A.fullName(p, false)} has killed ${w.name} the ${s.n}.`, 'pw'); }
  };
  PW.resolve = function (p, ctx, how) {
    const s = PW.species(ctx.sp), b = PW.foe(ctx);
    if (!s || !b) return '';
    PW.meet(s.id);
    if (ctx.wid) PW.know(ctx.wid);
    const name = PW.foeName(ctx), cause = name, me = PW.being(p), gap = b.t - me.t;
    const fall = (lo, hi) => (lo + (hi - lo) * A.rand()) * clamp(1 + gap / 25, 0.4, 2.5);
    if (how === 'leave') return 'You let it be, and go home with nothing but the story.';
    if (how === 'flee') {
      if (A.chance(PW.fleeP(p, ctx))) return 'You get away, lungs burning. It does not follow.';
      return hurt(p, fall(8, 22), cause, clamp(gap / 40, 0, 0.5)) ? '' : `It catches you before the trees. You get away, but not whole.`;
    }
    if (how === 'calm') {
      if (A.chance(PW.calmP(p, ctx))) return `It works: ${PW.calmWord(ctx)}. It turns away and is gone.`;
      return hurt(p, fall(10, 26), cause, clamp(gap / 40, 0, 0.5)) ? '' : 'It does not work. It comes at you, and you are lucky to crawl away.';
    }
    if (how === 'talk') {
      const rec = A.WHY.decide(mindOf(ctx, b), 'beast', PW.talkOptions(p, ctx), { log: false });
      const ans = rec ? rec.chose : 'attack';
      if (ans === 'spare') return 'It hears you out, and lets you go.';
      if (ans === 'demand') { const c0 = Math.min(p.coin || 0, Math.max(5, Math.round(dropsOf(s) / 2))); if (c0 > 0) { p.coin -= c0; return `It names a price, and you pay it: ${A.coin ? A.coin(c0) : c0 + ' suns'}.`; } return hurt(p, fall(5, 14), cause, 0) ? '' : 'It wants what you do not have, and takes it out of your hide instead.'; }
      return PW.resolve(p, ctx, 'fight');
    }
    // fight
    const c = PW.compare(me, b);
    if (c.close && b.kind !== 'legend') {
      A.startDuelFront(p, { beastId: s.id }, { kind: 'beast', place: ctx.place || 'the wilds', title: cap(name) });
      return 'You go at it.';
    }
    if (A.chance(c.p)) {
      const coin = Math.round(dropsOf(s) * 0.6), fame = clamp(Math.round(b.t / 6 + Math.max(0, gap) / 2), 1, 30);
      p.coin = (p.coin || 0) + coin; if (A.fame) A.fame(p, fame);
      if (gap > 0 && Array.isArray(p.deeds)) p.deeds.push({ y: A.S.year, t: `Killed ${name} alone` });
      PW.slainBy(p, ctx);
      return gap > 0 ? `Against all sense, it is dead and you are not. What it leaves fetches ${A.coin ? A.coin(coin) : coin}.` : `It is no match for you. What it leaves fetches ${A.coin ? A.coin(coin) : coin}.`;
    }
    if (gap >= 10 * PW.D.odds.hugeLog) return hurt(p, fall(45, 90), cause, clamp(0.25 + (gap - 12) / 40, 0.25, 0.7)) ? '' : 'It is over in moments. You wake in the mud, broken, and it is gone.';
    return hurt(p, fall(12, 30), cause, 0.05) ? '' : 'You hurt it, and it hurts you worse. It breaks off; so do you.';
  };

  // ---------------------------------------------------------------- a great being met
  PW.greatText = function (p, ctx) {
    const L = PW.LEG.get(ctx.lg), b = PW.being(ctx.lg), me = PW.being(p);
    if (!L) return '';
    const t = L.titles && L.titles[0] ? `, ${L.titles[0].n}` : '';
    return `${L.n}${t}. ${L.d} ${L.speech} It is ${PW.gapWords(Math.min(0, me.t - b.t))}: level ${b.level}, where you stand at ${me.level}.`;
  };
  PW.greatOptions = function (p, ctx, react) {
    const L = PW.LEG.get(ctx.lg), g = (A.S.pw && A.S.pw.leg && A.S.pw.leg[ctx.lg]) || {};
    const pref = ((L.reacts || {})[react] || {}).a || 'scorn';
    const ids = ['spare', 'demand', 'test', 'scorn', 'bargain', 'rage'];
    const on = (L.grudges || []).filter(x => x.at === p.realm || x.at === p.race), love = (L.loves || []).filter(x => x.at === p.realm || x.at === p.race);
    const hungry = clamp((g.fed || 0) / Math.max(1, L.hungerMonths), 0, 2);
    return ids.map(id => {
      const rs = [];
      if (id === pref) rs.push(why(2.2, 'temper', ((L.reacts || {})[react] || {}).line || 'its way'));
      if (id === 'rage' || id === 'demand') for (const x of on) rs.push(why(1.2 * x.w, 'grudge', `an old grudge: ${x.why}`));
      if (id === 'spare') for (const x of love) rs.push(why(1.2 * x.w, 'kin', `it is fond of your people: ${x.why}`));
      if (id === 'rage') { rs.push(why(react === 'attacked' ? 3 : -1.2, react === 'attacked' ? 'insult' : 'cost', react === 'attacked' ? 'you drew steel on it' : 'you are not worth the trouble')); rs.push(why(0.6 * hungry, 'want', 'it is hungry')); }
      if (id === 'scorn' && react === 'flattered' && (L.temper || {}).pride < 0.5) rs.push(why(0.8, 'temper', 'it has no use for flattery'));
      if (id === 'spare' && react === 'flattered' && (L.temper || {}).pride >= 0.5) rs.push(why(0.8, 'station', 'it likes to be praised'));
      return { id, reasons: rs, feeds: id === 'rage' ? ['anger', 'pride'] : [] };
    });
  };
  const legMind = L => { const g = (A.S.pw && A.S.pw.leg && A.S.pw.leg[L.id]) || {}; return { id: 'legend:' + L.id, temper: L.temper || {}, feel: g.feel || [], grudges: g.grudges || [] }; };
  PW.greatP = function (p, ctx, react) {
    const L = PW.LEG.get(ctx.lg);
    if (!L || !A.WHY || !A.WHY.E) return 0.5;
    const o = A.WHY.E.odds(legMind(L), PW.greatOptions(p, ctx, react), {});
    return o ? clamp(1 - (o.rage || 0) - 0.5 * (o.test || 0) - 0.3 * (o.demand || 0), 0.04, 0.96) : 0.5;
  };
  PW.greatAnswer = function (p, ctx, react) {
    const L = PW.LEG.get(ctx.lg);
    if (!L) return '';
    PW.know(L.id);
    { const st = PW.state(); st.metLeg = st.metLeg || {}; st.metLeg[L.id] = A.S.year; }   // met: its skills and arms are known now
    const rec = A.WHY.decide(legMind(L), 'legend', PW.greatOptions(p, ctx, react), { logIf: r => r.chose === 'rage' || r.chose === 'bargain' });
    const ans = rec ? rec.chose : 'scorn', line = ((L.reacts || {})[react] || {}).a === ans ? ((L.reacts || {})[react] || {}).line : '';
    const b = PW.being(L.id), gap = b.t - PW.being(p).t;
    if (ans === 'spare') { if (A.fame) A.fame(p, 2); return line || 'It lets you go. You will tell this for the rest of your days, and few will believe you.'; }
    if (ans === 'scorn') return line || 'It does not answer. When you look again, it is gone.';
    if (ans === 'bargain') { const c0 = Math.min(p.coin || 0, 20); p.coin -= c0; p.happy = clamp((p.happy || 50) + 4, 0, 100); return (line || 'It names terms, and keeps them to the letter.') + (c0 ? ` It costs you ${A.coin ? A.coin(c0) : c0}.` : ''); }
    if (ans === 'demand') { const c0 = Math.min(p.coin || 0, Math.max(10, Math.round((p.coin || 0) / 2))); if (c0 > 0) { p.coin -= c0; return (line || 'It wants a tithe.') + ` You pay ${A.coin ? A.coin(c0) : c0}.`; } return hurt(p, 20, L.n, 0.1) ? '' : (line || 'It wants a tithe you cannot pay.') + ' It takes it in blood.'; }
    if (ans === 'test') { if (A.chance(clamp(((A.stat ? A.stat(p, 'wil') : 40) + 10) / 120, 0.1, 0.8))) { if (A.fame) A.fame(p, 4); return (line || 'It tests you.') + ' You do not break. It lets you go, and you are not quite the same.'; } return hurt(p, 25, L.n, 0.15) ? '' : (line || 'It tests you.') + ' You fail. It leaves you bleeding in the dust.'; }
    // rage: far above any man
    return hurt(p, 70 + gap * 2, L.n, clamp(0.3 + gap / 60, 0.3, 0.75)) ? '' : (line || 'It turns on you.') + ' Somehow you live. No one who saw it understands how.';
  };
})();
