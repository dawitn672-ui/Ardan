// 999993-crown-crimes (P3, owner order 54, D-062 addendum): crimes against a ruler have reasoned consequences.
//
// The owner's playtest: "i attempted murder on a monarch 100s of times and was never once executed. if i asked
// forgiveness they forgave me no matter how much they hated me prior. i murdered countless monarchs with zero consequence
// as it never happened." The release's murder was one roll from anywhere (a serf could knife the emperor from his field
// twice a year), "someone saw" was a flat coin, the punishment was the commoner's (a blood-price, or the cells), the
// apology a coin toss, and the realm went on as if nothing had happened. Now, for a reigning ruler:
//
//  - REACH. You must be able to get near him: a post at his court or in his council, a rank in his army, his own kin, a
//    noble of his realm, or his favour (an audience). Otherwise the attempt is refused, and says why.
//  - THE ATTEMPT. The odds weigh your intrigue and stealth against his guard, which is doubled after every attempt the
//    court learns of, his spymaster's craft and his own suspicion (a paranoid king sleeps badly and well guarded).
//  - DISCOVERY is its own roll, with a named reason: the guard on the stair, the spymaster's trail, the servants who saw
//    you near him before. An attempt nobody traces still doubles the guard and the court remembers you were near.
//  - THE RECORD. Every attempt and every regicide is kept (A.S.crown.rec): who, whom, how, whether it is known, the
//    verdict and its reason. The wronged ruler's opinion of you falls to hatred; the court knows.
//  - THE SENTENCE follows the realm's law (A.lawOf) and the judge's personality: death by default for an attempt on a
//    crown; the cruel, wrathful and vengeful never spare; the forgiving and the kind spare a man they once thought well
//    of, or jail him; the greedy take a ransom; the just keep the law; a king spares his own blood to exile; a foreign
//    prince caught is a cause of war. Every verdict names its reason.
//  - FORGIVENESS (the apology) is decided by his opinion, his traits, the gravity of what you did, how often you have
//    begged, and the gifts you have given since. A hatred that deep is not talked away.
//  - A KILLED MONARCH IS DEAD. A.kill runs the succession (A.rulerDies, the house resolver, A.POSTS); the realm shakes
//    (stability, its factions' anger), the chronicle says so, and an inquiry hunts the hand for two years. Once it is
//    known, the dead man's kin are your enemies, a price is set on your head, and avengers come.
//
// Engine code: A.rand through A.chance and A.ri only; nothing here runs while the page draws.
(function () {
  if (typeof A === 'undefined' || !A.INT_FN) return;
  const CC = A.CROWN = A.CROWN || {};
  const S = () => A.S;
  const st = () => { const s = S(); if (!s.crown || typeof s.crown !== 'object') s.crown = {}; const c = s.crown; c.rec = c.rec || []; c.guard = c.guard || {}; c.sus = c.sus || {}; c.bounty = c.bounty || {}; return c; };
  const name = p => (p ? (A.fullName ? A.fullName(p, false) : p.given) : 'someone');
  const style = (p, rid) => { const r = A.realm(rid); try { return p && r && A.rulerStyle ? A.rulerStyle(p, r) : name(p); } catch (e) { return name(p); } };
  const has = (p, t) => !!(p && A.has && A.has(p, t));
  const sk = (p, k) => (p && A.skill ? A.skill(p, k) : 0);
  const KIN = ['mother', 'father', 'sibling', 'child', 'spouse', 'grandparent', 'grandchild', 'uncle', 'nephew', 'cousin'];
  const relOf = (a, b) => (a && b && a.rel && a.rel[b.id] ? a.rel[b.id] : null);
  const kinOf = (a, b) => { const r = relOf(a, b); return r && KIN.includes(r.type) ? r.type : ''; };
  // a person's own opinion of another, made if missing (an engine write: only from the engine's own paths)
  const opRel = (a, b) => { if (!a.rel[b.id]) a.rel[b.id] = { type: 'acquaint', op: 0, since: S().year }; return a.rel[b.id]; };
  const hate = (a, b, op) => { if (!a || !b || !a.alive || a.id === b.id) return; const r = opRel(a, b); r.op = Math.min(r.op || 0, op); if (!KIN.includes(r.type)) r.type = 'enemy'; };

  CC.isRuler = t => !!(t && t.alive && t.ruler && A.realm(t.ruler) && A.realm(t.ruler).ruler === t.id);
  CC.guardOf = rid => { const g = st().guard[rid]; return g ? Math.max(0, g.lvl - Math.floor((S().year - g.y) / 2)) : 0; };
  CC.spyOf = rid => { const r = A.realm(rid), id = r && r.council && r.council.spymaster, p = id != null ? A.P(id) : null; return p && p.alive ? p : null; };

  // ---- reach: how you could come near him, or '' -------------------------------------------------------------------------
  CC.reach = function (pc, t) {
    const rid = t.ruler;
    const k = kinOf(pc, t); if (k) return `you are his ${k}`;
    const held = A.POSTS && A.POSTS.held ? A.POSTS.held(pc.id) : [];
    if (pc.realm === rid) {
      if (pc.office || held.some(x => !/^(house|title):/.test(x))) return 'you hold a post at his court';
      if (['noble', 'royal'].includes(pc.status) || (pc.noble && pc.noble.rung >= 4)) return 'you are a noble of his realm';
      if (pc.mil && !pc.mil.merc && (pc.mil.rank || 0) >= 3) return 'you hold a rank in his army';
      if (pc.job && ['courtier', 'servant'].includes(pc.job.c)) return 'you serve in great houses';
    }
    if (pc.ruler) return 'you are a crowned head, and kings receive kings';
    const op = (relOf(t, pc) || {}).op || 0;
    if (op >= 20) return 'he thinks well enough of you to grant an audience';
    return '';
  };

  // ---- the attempt ------------------------------------------------------------------------------------------------------
  const KNIFE = ['a knife in the dark', 'poison in the wine', 'a fall from a high window', 'an "accident" on the ice'];
  CC.attempt = function (pc, t, r) {
    const rid = t.ruler, R = A.realm(rid), c = st(), year = S().year;
    const how = CC.reach(pc, t);
    if (!how) return { ok: false, msg: `You cannot get near ${style(t, rid)}. Walls, guards and a court stand between: a post at court, a rank in his army, his blood or his favour would bring you within reach.`, cls: 'bad' };
    const spy = CC.spyOf(rid), glvl = CC.guardOf(rid), sus = c.sus[pc.id] || 0;
    const skill = sk(pc, 'intrigue') + sk(pc, 'stealth') + (A.stat ? A.stat(pc, 'int') : 0) / 2;
    const guard = 180 + 40 * glvl + (spy ? sk(spy, 'intrigue') / 2 : 0) + (has(t, 'paranoid') ? 30 : 0);
    pc.honor = A.clamp((pc.honor || 0) - 20, 0, 100);
    const ok = A.chance(A.clamp(0.25 + (skill - guard) / 200, 0.03, 0.85));
    // discovery, and its reason: the biggest of the parts that found you
    const parts = [
      [ok ? 0.12 : 0.4, ok ? 'a servant saw you leave his rooms' : 'the guard took you on the stair with the blade in your hand'],
      [0.12 * glvl, 'the guard had been doubled since the last attempt'],
      [spy ? sk(spy, 'intrigue') / 250 : 0, spy ? `${name(spy)}, his spymaster, followed the trail to your door` : ''],
      [has(t, 'paranoid') ? 0.12 : 0, 'he trusts no one, and had you watched'],
      [0.15 * sus, 'you had been seen near him before, too often'],
    ];
    const dp = A.clamp(parts.reduce((a, x) => a + x[0], 0) - (sk(pc, 'stealth') + sk(pc, 'intrigue')) / 500, 0.05, 0.95);
    const found = A.chance(dp), why = found ? parts.filter(x => x[1]).sort((a, b) => b[0] - a[0])[0][1] : '';
    c.sus[pc.id] = sus + 1;
    c.guard[rid] = { lvl: glvl + 1, y: year };
    const before = (relOf(t, pc) || {}).op || 0;
    const rec = { y: year, by: pc.id, vic: t.id, rid, k: ok ? 'regicide' : 'attempt', how, known: found ? year : 0, why, op0: before };
    c.rec.push(rec); if (c.rec.length > 200) c.rec.shift();
    if (ok) {
      const cause = A.pick(KNIFE);
      pc.kills = (pc.kills || 0) + 1;
      A.ach && A.ach('king_slayer');
      rec.cause = cause;
      A.kill(t, cause);                       // the ruler is dead: A.rulerDies runs the succession
      CC.afterRegicide(pc, t, rid, rec);
      return { msg: `${style(t, rid)} is dead: ${cause}. ${found ? `And it is known: ${why}.` : 'Nobody saw. The court will hunt the hand.'}`, cls: 'bad' };
    }
    if (!found) {
      A.log(`The attempt on ${style(t, rid)} fails, and nobody knows whose hand it was. The guard is doubled.`, 'bad');
      return { msg: `Your attempt on ${t.given}'s life fails. No one has named you, yet.`, cls: 'bad' };
    }
    hate(t, pc, -100); hate(pc, t, Math.min(0, ((relOf(pc, t) || {}).op || 0) - 30));
    if (r) r.type = KIN.includes(r.type) ? r.type : 'enemy';
    A.news(`An attempt on the life of ${style(t, rid)} fails. The hand was ${name(pc)}'s: ${why}.`, 'crown');
    A.log(`${t.given} survives your attempt, and knows it was you: ${why}.`, 'bad');
    CC.sentence(pc, t, rec);
    return { msg: `Your attempt on ${t.given}'s life fails.`, cls: 'bad' };
  };

  // ---- a ruler is murdered: the realm and the dead man's kin -----------------------------------------------------------
  CC.kinOfDead = dead => Object.keys(dead.rel || {}).map(id => [A.P(id), dead.rel[id].type]).filter(([p, k]) => p && p.alive && ['child', 'spouse', 'sibling', 'mother', 'father'].includes(k)).map(([p]) => p);
  CC.afterRegicide = function (pc, dead, rid, rec) {
    const R = A.realm(rid), heir = R ? A.P(R.ruler) : null;
    rec.heir = heir ? heir.id : null;
    if (R) {
      R.stability = Math.max(0, (R.stability || 0) - 12);
      if (A.factionsOf) for (const f of A.factionsOf(rid)) f.discontent = Math.min(100, (f.discontent || 0) + 10);
    }
    A.news(`${name(dead)} of ${A.realmShort(rid)} was murdered (${rec.cause || 'by a hidden hand'}). ${rec.known ? `The hand was ${name(pc)}'s.` : 'The court hunts the hand.'} The realm is shaken.`, 'crown');
    if (rec.known) CC.known(pc, rec, true);
    else rec.inq = S().year + 2;                // the inquiry runs two years
  };
  // the hand is known (now, or found later by the inquiry): the kin hate you, a price is set, and if you are within
  // reach of the new ruler's law you are taken
  CC.known = function (pc, rec, now) {
    const dead = A.P(rec.vic), R = A.realm(rec.rid), judge = R ? A.P(R.ruler) : null, c = st();
    if (!rec.known) rec.known = S().year;
    const kin = dead ? CC.kinOfDead(dead) : [];
    for (const k of kin) hate(k, pc, -100);
    if (judge && judge.id !== pc.id) hate(judge, pc, kinOf(judge, dead) ? -100 : -70);
    const amt = Math.round(300 + Math.min(4000, Math.max(0, (R && R.treasury) || 0) * 0.02));
    c.bounty[pc.id] = { rid: rec.rid, amt, y: S().year, kin: kin.map(k => k.id), vic: rec.vic, n: 0 };
    if (!now) A.news(`The murder of ${name(dead)} is solved: the hand was ${name(pc)}'s (${rec.why}). ${A.realmShort(rec.rid)} sets ${A.coin(amt)} on the killer's head.`, 'crown');
    A.log(`A price of ${A.coin(amt)} is set on your head in ${A.realmShort(rec.rid)}${kin.length ? `, and ${kin.map(k => k.given).slice(0, 3).join(', ')} swear vengeance` : ''}.`, 'bad');
    if (judge && judge.id !== pc.id && pc.realm === rec.rid && !pc.prison) CC.sentence(pc, judge, rec);
  };

  // ---- the sentence: the realm's law and the judge's nature; every verdict names its reason ------------------------------
  CC.verdict = function (pc, judge, rec) {
    const law = A.lawOf ? A.lawOf(rec.rid) : 'other', regicide = rec.k === 'regicide', dead = A.P(rec.vic);
    const kin = kinOf(judge, pc), op0 = rec.op0 || 0;
    const v = (k, why, x) => Object.assign({ k, why }, x || {});
    if (pc.ruler) return v('war', `${A.realmShort(pc.ruler)}'s own crown sent the knife. No court tries a king: ${judge.given} answers with the sword`);
    if (regicide) {
      if (kin && !kinOf(judge, dead)) return v('exile', `you are his ${kin}, and he will not hang his own blood; he will not see your face again`);
      if (has(judge, 'ambitious') && !kinOf(judge, dead) && judge.id === rec.heir) return v('exile', `${judge.given} owes his crown to your knife and cannot be seen to thank you: exile, and a purse left at the border`, { purse: 60 });
      return v('death', law === 'deep' ? 'the Law-Carvers keep one line for the death of a king' : law === 'orc' ? 'no blood-price buys a chief\'s life' : `the murder of ${dead ? dead.given : 'a king'} is treason in any law`);
    }
    // an attempt on a crown
    if (kin) return v('exile', `you are his ${kin}: he spares his own blood, and sends it away`);
    if (has(judge, 'cruel')) return v('death', 'he is cruel, and wants the crowd to see it', { slow: true });
    if (has(judge, 'wrathful') || has(judge, 'vengeful')) return v('death', `he is ${has(judge, 'wrathful') ? 'wrathful' : 'vengeful'}, and you came for his life`);
    if ((has(judge, 'forgiving') || has(judge, 'kind')) && op0 >= 40) return v('mercy', `he is ${has(judge, 'forgiving') ? 'forgiving' : 'kind'}, and he thought well of you before; he spares you, once`);
    if (has(judge, 'greedy') && (+pc.coin || 0) >= 400) return v('fine', 'he is greedy, and would rather have your purse than your head', { fine: Math.max(400, Math.round(pc.coin * 0.8)) });
    if (has(judge, 'forgiving') || has(judge, 'kind')) return v('prison', `he is ${has(judge, 'forgiving') ? 'forgiving' : 'kind'}: he will not kill, but he will not forget`, { years: A.ri(10, 18) });
    if (law === 'elf') return v('exile', 'the Moot casts out for a hundred years whoever raises a hand against the crowned', { outlaw: true });
    if (law === 'deep') return v('exile', 'the Law-Carvers wall you out of the hold, in winter', { hurt: 20 });
    if (law === 'pirate') return v('exile', 'the crew votes, and marooned you are', { hurt: 15 });
    if (law === 'east' || law === 'well') return v('maim', law === 'east' ? 'the eastern law takes the hand that was raised against the throne' : 'the Book of Wells is plain: the hand, and the cells', { years: A.ri(4, 8) });
    if (has(judge, 'calm') || has(judge, 'patient') || has(judge, 'content')) return v('prison', 'he is a calm man, and a deep cell is surer than a scaffold', { years: A.ri(12, 20) });
    return v('death', `an attempt on the crown is treason under ${law === 'sun' ? 'the Sun Codes' : law === 'north' ? 'the northern law' : 'the law'}`);
  };
  CC.sentence = function (pc, judge, rec) {
    const v = CC.verdict(pc, judge, rec);
    rec.verdict = v.k; rec.vwhy = v.why; rec.judge = judge.id;
    const ctx = { pid: judge.id, judge: style(judge, judge.ruler || rec.rid), why: v.why, crime: rec.k === 'regicide' ? 'the murder of a king' : 'an attempt on the life of a king', rid: rec.rid, ri: st().rec.indexOf(rec) };
    switch (v.k) {
      case 'war': {
        const a = rec.rid, b = pc.ruler;
        if (A.setRelPair) A.setRelPair(a, b, -90);
        if ((has(judge, 'wrathful') || has(judge, 'vengeful') || has(judge, 'proud') || rec.k === 'regicide') && A.startWar && !(A.atWar && A.atWar(a).some(w => w && (w.att === b || w.def === b)))) {
          A.startWar(a, b, `The War of the Hidden Knife`);
          ctx.verdict = `${A.realmShort(a)} declares war on you. ${v.why}.`;
        } else ctx.verdict = `${A.realmShort(a)} breaks with you and will remember. ${v.why}.`;
        break;
      }
      case 'death': ctx.verdict = `Death${v.slow ? ', and slowly' : ''}. ${v.why}.`; break;
      case 'exile': A.exile(pc); if (v.outlaw) pc.flags.outlaw = true; if (v.hurt) pc.health = Math.max(1, pc.health - v.hurt); if (v.purse) pc.coin = (+pc.coin || 0) + v.purse; ctx.verdict = `Exile. ${v.why}.`; break;
      case 'prison': A.imprison(pc, v.years, rec.k === 'regicide' ? 'regicide' : 'an attempt on the crown'); ctx.verdict = `${v.years} years in a deep cell. ${v.why}.`; break;
      case 'maim': A.addWound && A.addWound(pc, 'lost_hand'); A.imprison(pc, v.years, 'an attempt on the crown'); ctx.verdict = `Your right hand, and ${v.years} years in the cells. ${v.why}.`; break;
      case 'fine': pc.coin = Math.max(0, (+pc.coin || 0) - v.fine); ctx.verdict = `A ransom of ${A.coin(v.fine)}. ${v.why}.`; break;
      case 'mercy': { const r = opRel(judge, pc); r.op = -40; rec.pardon = S().year; ctx.verdict = `Pardoned, this once. ${v.why}.`; break; }
    }
    ctx.verdict = ctx.verdict.replace(/\.\.$/, '.');
    A.log(`The verdict of ${judge.given} for ${ctx.crime}: ${ctx.verdict}`, 'bad');
    A.queue({ type: 'event', ev: v.k === 'death' ? 'cc_scaffold' : 'cc_verdict', forced: true, now: true, ctx });
    return v;
  };
  // the plea on the scaffold: the judge's nature decides, never the plea's eloquence alone (0 for the cruel and the
  // vengeful and for a regicide's judge whose blood was spilled)
  CC.mercy = function (pc, judge, rec) {
    if (!judge || has(judge, 'cruel') || has(judge, 'vengeful') || has(judge, 'wrathful')) return 0;
    if (rec && rec.k === 'regicide' && kinOf(judge, A.P(rec.vic))) return 0;
    return A.clamp(0.05 + (has(judge, 'forgiving') ? 0.2 : 0) + (has(judge, 'kind') ? 0.12 : 0) + (sk(pc, 'diplomacy') + sk(pc, 'persuasion')) / 800 + (rec && rec.k === 'regicide' ? -0.1 : 0), 0, 0.4);
  };

  // ---- the inquiry and the avengers (monthly) ------------------------------------------------------------------------------
  A.onMonth.push(function (pc) {
    try {
      const s = S(); if (!s || !s.crown || !pc || !pc.alive) return;
      const c = s.crown;
      for (const rec of c.rec || []) {
        if (rec.by !== pc.id || rec.known || !rec.inq) continue;
        if (s.year > rec.inq) { rec.inq = 0; continue; }
        const spy = CC.spyOf(rec.rid), p = A.clamp(0.04 + (spy ? sk(spy, 'intrigue') / 1200 : 0) + 0.03 * ((c.sus || {})[pc.id] || 0) - sk(pc, 'stealth') / 2500, 0.01, 0.3);
        if (A.chance(p)) { rec.why = spy ? `${name(spy)}, the spymaster, ran the inquiry to its end` : 'a servant, paid at last, told what he saw'; CC.known(pc, rec, false); }
      }
      const b = c.bounty && c.bounty[pc.id];
      if (b && !pc.prison && !(A.S.queue || []).some(q => q && q.ev === 'cc_avenger')) {
        const here = pc.realm === b.rid, since = s.year - (b.last || b.y);
        if (since >= 1 && A.chance(here ? 0.08 : 0.03)) { b.last = s.year; b.n = (b.n || 0) + 1; CC.avenger(pc, b); }
      }
    } catch (e) { console.error('crown crimes', e); }
  });
  // who comes for the price: the dead man's kin when one is grown, else a hired blade (never a relative made for the scene)
  CC.avenger = function (pc, b) {
    const kin = (b.kin || []).map(A.P).filter(k => k && k.alive && A.isAdult(k) && !k.ruler);   // a king sends others
    let who = kin.length ? A.pick(kin) : null, hired = false;
    if (!who && A.makeAcquaintance) { who = A.makeAcquaintance(pc, 'acquaint'); hired = true; if (who) who.occ = 'a hired blade'; }
    if (!who) return;
    const dead = A.P(b.vic);
    A.queue({ type: 'event', ev: 'cc_avenger', forced: true, ctx: { pid: who.id, amt: A.coin(b.amt), whyCome: hired ? `${A.coin(b.amt)} on your head brought ${who.given} to your door` : `${who.given} has not forgotten ${dead ? dead.given : 'the dead'}` } });
  };

  // ---- forgiveness: never automatic --------------------------------------------------------------------------------------
  // what pc did to t that the court knows: { g (gravity 0..1), what }
  CC.grievance = function (t, pc) {
    let g = 0, what = '';
    for (const rec of (S().crown && S().crown.rec) || []) {
      if (rec.by !== pc.id || !rec.known) continue;
      if (rec.vic === t.id && rec.k === 'attempt' && g < 0.6) { g = rec.pardon ? 0.35 : 0.6; what = 'you tried to kill him'; }
      const dead = A.P(rec.vic);
      if (rec.vic !== t.id && dead && kinOf(t, dead) && g < 0.8) { g = 0.8; what = `you killed his ${kinOf(t, dead)}`; }
    }
    return { g, what };
  };
  CC.forgiveOdds = function (pc, t, r) {
    const op = relOf(t, pc) ? relOf(t, pc).op : (r ? r.op : 0) || 0, gr = CC.grievance(t, pc);
    const sorry = (pc.flags.ccSorry || {})[t.id], rep = sorry && S().year - sorry.y <= 3 ? sorry.n : 0;
    const gifts = (r && r.ccGifts) || 0;
    const mod = (has(t, 'forgiving') ? 0.25 : 0) + (has(t, 'kind') ? 0.12 : 0) + (has(t, 'calm') ? 0.05 : 0) - (has(t, 'vengeful') ? 0.25 : 0) - (has(t, 'wrathful') ? 0.15 : 0) - (has(t, 'proud') ? 0.1 : 0) - (has(t, 'stubborn') ? 0.05 : 0);
    const gift = Math.min(0.25, gifts / (300 * (1 + 4 * gr.g)));
    let p = A.clamp(0.3 + op / 160 + mod - gr.g - 0.15 * rep + gift, 0.02, 0.85);
    let why;
    if (gr.g >= 0.6 && op <= -60) { p = Math.min(p, 0.03); why = `${gr.what}, and a hatred that deep is not talked away`; }
    else if (gr.g) why = gr.what;
    else if (op <= -50) why = 'he hates you';
    else if (rep >= 2) why = 'you have begged before';
    else if (has(t, 'vengeful') || has(t, 'wrathful')) why = `he is ${has(t, 'vengeful') ? 'vengeful' : 'wrathful'}`;
    else if (has(t, 'forgiving') || has(t, 'kind')) why = `he is ${has(t, 'forgiving') ? 'forgiving' : 'kind'}`;
    else if (gift > 0.05) why = 'your gifts since have spoken for you';
    else why = op >= 0 ? 'there was little between you' : 'he has no reason to';
    return { p, why, g: gr.g };
  };
  const apologize0 = A.INT_FN.apologize;
  A.INT_FN.apologize = function (pc, t, r) {
    if (!pc || !t) return apologize0.apply(this, arguments);
    const o = CC.forgiveOdds(pc, t, r), ok = A.chance(o.p);
    const sr = pc.flags.ccSorry = pc.flags.ccSorry || {}, cur = sr[t.id];
    sr[t.id] = { n: cur && S().year - cur.y <= 3 ? cur.n + 1 : 1, y: S().year };
    if (ok) {
      A.addOp(pc, t, o.g ? A.ri(4, 10) : A.ri(8, 20));
      const tr = relOf(t, pc); if (tr) tr.op = A.clamp(tr.op + (o.g ? A.ri(10, 25) : A.ri(8, 20)), -100, 100);
      if (o.g) for (const rec of st().rec) if (rec.by === pc.id && rec.vic === t.id && rec.known) rec.forgiven = S().year;
      return { msg: `${t.given} accepts your apology${o.g ? `, though ${o.why}` : ''}: ${o.g ? 'he lets it lie' : o.why === 'there was little between you' ? 'it was not much between you' : o.why}.` };
    }
    A.addOp(pc, t, sr[t.id].n > 1 ? -3 : 1);
    return { msg: `${t.given} will not forgive you: ${o.why}.`, cls: o.g ? 'bad' : '' };
  };
  // what you have given since counts as part of an apology
  const gift0 = A.INT_FN.gift;
  if (typeof gift0 === 'function') A.INT_FN.gift = function (pc, t, r) {
    const c0 = +pc.coin || 0, res = gift0.apply(this, arguments);
    try { const spent = c0 - (+pc.coin || 0); if (spent > 0 && r) r.ccGifts = (r.ccGifts || 0) + spent; } catch (e) {}
    return res;
  };

  // a scheme that ends in a king's death (39-schemes): the death is the scheme's, the inquiry and the rest are the crown's
  CC.schemeKill = function (pc, t, cause) {
    const rid = t.ruler, c = st();
    const rec = { y: S().year, by: pc.id, vic: t.id, rid, k: 'regicide', how: 'a scheme', known: 0, why: '', op0: (relOf(t, pc) || {}).op || 0, cause };
    c.rec.push(rec); c.sus[pc.id] = (c.sus[pc.id] || 0) + 1; c.guard[rid] = { lvl: CC.guardOf(rid) + 1, y: S().year };
    A.kill(t, cause);
    CC.afterRegicide(pc, t, rid, rec);
    return rec;
  };

  // ---- the murder of a reigning ruler goes through all of the above; anyone else's, as before ------------------------------
  const murder0 = A.INT_FN.murder;
  A.INT_FN.murder = function (pc, t, r) {
    if (CC.isRuler(t)) return CC.attempt(pc, t, r);
    return murder0.apply(this, arguments);
  };
  A.SIGNATURE = Object.assign(A.SIGNATURE || {}, { crownCrimes: true });
})();
