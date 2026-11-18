// W1-5 "surrender or defeat" (docs/design/war.md §11.3 and §11.4; D-064 point 10; D-091 to D-096): the will to fight.
//
// The pure logic is the v2 engine's src/war/engine/surrender.js (A.V2.surrender: the two pans, defeat as a fact, what a
// term costs, the pathway an ending took; unit-tested by tests/v2/surrender.test.js). This file reads one side of a war
// as its decider knows it and asks A.WHY the questions an ending is made of:
//   A.WAR.facts(w, side)           the side's war: land held and lost, its capital, its hosts against what they were, the
//                                  battles of the last two years, weariness, the chest, the realm at home, the decider
//                                  himself, his allies, the blows struck at it, and what the victor would ask of it
//   A.WAR.will(w, side)            the two pans as reasons (to fight on; to ask for terms)
//   A.WAR.defeated(w, side)        null, or how the side can no longer fight
//   A.WAR.terms(w, victor, want)   the terms the victor names: real things only (land his soldiers hold, coin, tribute,
//                                  a submission, alliances renounced, a claim renounced, a crown, freedom, the realm
//                                  itself, years of sworn peace), from why he fought (w.cb) and what he holds
//   A.WAR.yieldQ / want / answer   the three decisions, through A.WHY.decide: shall I ask; what do I demand; do I take it
//   A.WAR.standing(w, rid)         'winning' | 'even' | 'losing', read from the facts (the goals and the War Room's buttons)
//   A.WAR.blow(w, side, label, w)  a blow struck at a side by an event (a mission, a hostage, volunteers): a named
//                                  reason in its pan to ask, fading over a year; at most six a war
// The decider is the ruler of the side's leading realm (a dead leader's side passes to its next living realm). A war's
// own state: w.d0 (its first day), w.r0 (the two rulers when it began), w.pk (each side's largest host), w.blows, all
// optional (an old save's war gains them at its first reading).
(function () {
  const E = A.V2 && A.V2.surrender;
  if (!E || !A.WHY) { console.error('[surrender] the v2 engine has no surrender module, or A.WHY is missing'); return; }
  const W = A.WHY;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const r2 = x => Math.round(x * 100) / 100;
  const ln = x => Math.log(Math.max(1e-6, x));
  const short = id => (A.realm(id) ? A.realmShort(id) : String(id || 'the enemy'));
  const WAR = A.WAR = A.WAR || {};
  WAR.E = E;
  WAR.T = Object.assign({
    yieldBand: E.T.band,  // the monthly question: fight on or ask (log-odds; options this close go to the draw)
    wantBand: 1,          // the victor's demands
    ansBand: .6,          // the answer to terms
    temperK: .6,          // the ruler's temper toward yielding (20's aiYield, 68-sharpened) as a reason: this x ln(it)
    blowCap: 6,           // blows kept on a war
    blowDays: 365,        // a blow fades by e^(-days / this)
    battleYears: 2,       // the battles a decider still counts
    annexShare: .85,      // a victor may take the whole realm only when his soldiers hold this share of its people
  }, WAR.T || {});
  W.T.kindCap = Object.assign({ yield: 20, terms: 20 }, W.T.kindCap || {});

  const other = s => (s === 'att' ? 'def' : 'att');
  WAR.other = other;
  WAR.realmsOf = (w, s) => (s === 'att' ? w.att : w.def);
  WAR.lead = (w, s) => (s === 'att' ? w.leadA : w.leadD);
  const alive = id => { const r = A.realm(id); return !!(r && r.alive); };
  WAR.live = w => !!(w && A.S && Array.isArray(A.S.wars) && A.S.wars.includes(w) && !w.end);
  const day = () => (A.absDay ? A.absDay() : A.S.year * 365);
  WAR.day0 = w => (w.d0 != null ? w.d0 : (w.start != null ? w.start * 365 : day()));
  WAR.months = w => Math.max(0, (day() - WAR.day0(w)) / 30.4);
  // a side whose leader has fallen is led by its next living realm: someone takes up the war in his place
  WAR.fixLeads = function (w) {
    for (const s of ['att', 'def']) {
      const L = WAR.lead(w, s);
      if (alive(L)) continue;
      const next = WAR.realmsOf(w, s).find(alive);
      if (next) { if (s === 'att') w.leadA = next; else w.leadD = next; }
    }
  };
  // the war's own memory: its first day, the two rulers when it began, each side's largest host
  WAR.init = function (w) {
    // a day stamped at the turn of the year (the release's A.absDay reads the new year with the old year's last day for
    // the length of the turn) lies a year ahead: a war's first day is never after today
    if (w.d0 == null || w.d0 > day()) w.d0 = day();
    if (!w.r0) { const a = A.realm(w.leadA), d = A.realm(w.leadD); w.r0 = { att: a ? a.ruler : null, def: d ? d.ruler : null }; }
    if (!w.pk) w.pk = { att: 0, def: 0 };
  };
  const field = rids => rids.reduce((a, id) => { const r = A.realm(id); return a + (r && r.alive ? Math.max(0, r.army || 0) : 0); }, 0);
  const power = (rids, lead) => rids.reduce((a, id) => { const r = A.realm(id); return a + (r && r.alive ? A.realmPower(r) * (id === lead ? 1 : .5) : 0); }, 0);

  // ---------------------------------------------------------------- blows
  WAR.blow = function (w, side, label, weight) {
    if (!w || (side !== 'att' && side !== 'def') || !isFinite(weight)) return;
    const B = w.blows = Array.isArray(w.blows) ? w.blows : [];
    B.push([side, day(), String(label || 'a blow').replace(/[<>"{}]/g, '').slice(0, 90), r2(weight)]);
    if (B.length > WAR.T.blowCap) B.splice(0, B.length - WAR.T.blowCap);
  };
  const blowsOf = (w, s) => (Array.isArray(w.blows) ? w.blows : []).filter(b => b && b[0] === s).map(b => [b[2], r2(b[3] * Math.exp(-Math.max(0, day() - b[1]) / WAR.T.blowDays))]).filter(b => Math.abs(b[1]) >= .05);

  // ---------------------------------------------------------------- the temper toward yielding
  const TRIB = [['caution', 1], ['pride', -1], ['wrath', -1], ['warmth', 1]];
  WAR.temper = function (rid) {
    const yd = A.aiYield ? A.aiYield(rid) : 1, w = WAR.T.temperK * ln(yd);
    if (Math.abs(w) < .02) return { w: 0, label: '' };
    const P = A.rulerPersona ? A.rulerPersona(rid) : null, sign = Math.sign(w), ts = [];
    if (P && P.parts) for (const [ax, c] of TRIB) for (const [t, v] of P.parts[ax] || []) if (Math.sign(v * c) === sign && Math.abs(v) >= .15 && !ts.some(x => x[0] === t)) ts.push([t, Math.abs(v)]);
    ts.sort((a, b) => b[1] - a[1]);
    const words = ts.slice(0, 2).map(x => x[0]).join(', ');
    return { w: r2(w), label: words ? `His temper: ${words}` : (sign > 0 ? 'His temper: he would rather bargain than bleed' : 'His temper: slow to give way') };
  };

  // ---------------------------------------------------------------- the facts of one side
  WAR.facts = function (w, s, o) {
    o = o || {};
    const S = A.S, mine = WAR.realmsOf(w, s), theirs = WAR.realmsOf(w, other(s));
    const lead = WAR.lead(w, s), foeLead = WAR.lead(w, other(s)), r = A.realm(lead), fo = A.realm(foeLead);
    const f = { side: s, attacker: s === 'att', cb: w.cb, foe: short(foeLead), months: WAR.months(w), realms: mine.filter(alive).length };
    if (!r || !r.alive) { f.realms = 0; return f; }
    const mset = new Set(mine), tset = new Set(theirs);
    let myPop = 0, myLost = 0, thPop = 0, thHeld = 0;
    for (const p of S.prov) {
      if (mset.has(p.owner)) { myPop += p.pop; if (p.occ && tset.has(p.occ)) myLost += p.pop; }
      else if (tset.has(p.owner)) { thPop += p.pop; if (p.occ && mset.has(p.occ)) thHeld += p.pop; }
    }
    f.lostShare = myPop ? r2(myLost / myPop) : 0;
    f.heldShare = thPop ? r2(thHeld / thPop) : 0;
    const capP = r.capitalProv != null ? A.prov(r.capitalProv) : null, fcapP = fo && fo.capitalProv != null ? A.prov(fo.capitalProv) : null;
    f.capLost = !!(capP && capP.occ && tset.has(capP.occ));
    f.capHeld = !!(fcapP && fcapP.occ && mset.has(fcapP.occ));
    f.cap = capP ? capP.name : r.capital; f.foeCap = fcapP ? fcapP.name : (fo && fo.capital);
    const pm = power(mine, lead), pt = power(theirs, foeLead);
    f.ratio = r2(pm / Math.max(1, pt));
    f.field = field(mine);
    const pk = w.pk || (w.pk = { att: 0, def: 0 });
    if (!o.dry && f.field > (pk[s] || 0)) pk[s] = f.field;
    f.field0 = Math.max(pk[s] || 0, f.field, 1);
    f.kept = r2(f.field / f.field0);
    const yrs = WAR.T.battleYears;
    let won = 0, lost = 0, lastWon = null, lastLost = null;
    for (const b of w.battles || []) {
      if (!b || b.y == null || S.year - b.y > yrs || b.win === 'draw') continue;
      if (b.win === s) { won++; lastWon = b.name; } else { lost++; lastLost = b.name; }
    }
    Object.assign(f, { won, lost, lastWon, lastLost });
    f.weary = r.exhaustion || 0;
    f.broke = (r.treasury || 0) < 0;
    f.debt = (r.debt || 0) > Math.max(1, r.income || 0);
    f.stab = r.stability != null ? r.stability : 50;
    f.rising = S.wars.some(x => x !== w && (x.cb === 'throne' || x.cb === 'liberty') && x.def.includes(lead));
    f.fronts = S.wars.filter(x => x.att.includes(lead) || x.def.includes(lead)).length;
    const pf = A.factionsOf ? A.factionsOf(lead).find(x => x.kind === 'peace') : null;
    f.faction = pf ? r2(clamp(pf.power || 0, 0, 1)) : 0;
    f.allies = mine.filter(id => id !== lead && alive(id)).length;
    f.foeBusy = fo && S.wars.some(x => x !== w && (x.att.includes(foeLead) || x.def.includes(foeLead))) ? 1 : 0;
    const ru = r.ruler != null ? A.P(r.ruler) : null;
    if (ru && ru.alive) {
      const age = A.age(ru), R = GD.RACES && GD.RACES[ru.race];
      // his years told as a man's (an elf of two hundred is not an old man): sixty at 1.2 of his people's old age
      f.age = R && R.old && R.life ? Math.round(60 + (age - 1.2 * R.old) * 25 / (.4 * R.life)) : age;
      f.ill = (ru.health != null ? ru.health : 100) < 30;
      f.child = !!(R && age < R.adult);
      f.honour = (W.temper(ru).honor || 0) >= .3;
    } else if (r.isRebel) f.rebelLeaderGone = true;
    if (w.r0 && w.r0[s] != null && r.ruler != null && String(w.r0[s]) !== String(r.ruler)) f.heir = true;
    const tp = WAR.temper(lead);
    f.temperW = tp.w; f.temperLabel = tp.label;
    f.blows = blowsOf(w, s);
    // what yielding would cost: the terms the other side would name for its cause (war.md: harsh demands lengthen wars)
    if (!o.noTerms) {
      const t = WAR.terms(w, other(s), o.want || 'casus');
      f.terms = E.termsCost(t, f);
      f.termsLabel = WAR.termsWords(t, true);
    }
    return f;
  };
  WAR.will = (w, s, o) => E.will(WAR.facts(w, s, o));
  WAR.defeated = (w, s, f) => E.defeated(f || WAR.facts(w, s, { noTerms: true }));
  // how a war stands for a realm in it, in a word: the leaning of each side toward asking, compared
  WAR.standing = function (w, rid) {
    const s = A.warSide(w, rid);
    if (!s) return 'even';
    const d = E.lean(WAR.facts(w, s, { dry: true, noTerms: true })) - E.lean(WAR.facts(w, other(s), { dry: true, noTerms: true }));
    return d <= -1.5 ? 'winning' : d >= 1.5 ? 'losing' : 'even';
  };

  // ---------------------------------------------------------------- the terms (real things only)
  // a payment: a share of the loser's yearly income (the release's peace took a fifth of it)
  const g1 = L => Math.round(Math.max(500, (L.income || 0) * .2));
  const popOf = rid => A.realmProvs(rid).reduce((a, p) => a + p.pop, 0) || 1;
  // (H-085: a rivalry is a quarrel over a border; its victor keeps the border land his soldiers hold)
  const LAND_CB = new Set(['conquest', 'justified', 'claim', 'reconquest', 'rivalry']);
  // the land the victor's soldiers hold, as the peace may take it (the release's chain to his own land, 68's cap):
  // for his cause, the land he claims (and, in a war of conquest, the land he holds); asking all, every held province
  WAR.land = function (w, vs, want) {
    const res = vs, list = A.wsTreatyProvinces ? A.wsTreatyProvinces(w, res, want) : [];
    return list.filter(p => p && p.owner !== 'unclaimed');
  };
  WAR.terms = function (w, vs, want, o) {
    o = o || {};
    const ls = other(vs), victor = WAR.lead(w, vs), loser = WAR.lead(w, ls), V = A.realm(victor), L = A.realm(loser);
    const out = [];
    if (!V || !L) return out;
    const vAtt = vs === 'att', rebel = A.realm(w.leadA), isRebel = !!(rebel && rebel.isRebel);
    const peace = { k: 'peace', label: 'ten years of sworn peace' };
    // a crown or a land's freedom: the cause is the whole of it
    if ((w.cb === 'throne' && w.claimant) || ((w.cb === 'liberty' || w.cb === 'independence') && isRebel)) {
      if (vAtt) {
        if (w.cb === 'throne') {
          const cl = A.P(w.claimant) && A.P(w.claimant).alive ? A.P(w.claimant) : (rebel && rebel.ruler != null ? A.P(rebel.ruler) : null);
          if (cl && cl.alive && (want === 'all' || !isRebel)) out.push({ k: 'crown', pid: cl.id, label: `${A.fullName(cl, false)} crowned in ${short(w.leadD)}` });
          else if (isRebel) out.push({ k: 'free', label: `the lands that rose kept by ${short(w.leadA)}, apart from ${short(w.leadD)}` });
        } else out.push({ k: 'free', label: `the freedom of ${short(w.leadA)} recognised` });
      } else out.push({ k: 'renounce', label: isRebel ? 'the claim given up and the lands that rose returned' : `the claim of ${short(loser)} given up` });
      out.push(peace);
      return out;
    }
    const coin = (mul, label) => { const amt = Math.round(g1(L) * mul); out.push({ k: 'coin', amt, years: r2(amt / Math.max(1, L.income || 1)), from: loser, to: victor, label: `${label}: ${A.fmt(amt)} suns` }); };
    const landTerm = provs => {
      if (!provs.length) return false;
      const tot = popOf(loser), pop = provs.reduce((a, p) => a + p.pop, 0), capital = provs.some(p => p.id === L.capitalProv);
      out.push({ k: 'land', provs: provs.map(p => p.id), share: r2(pop / tot), capital, to: victor, label: provs.map(p => p.name).join(', ') });
      return true;
    };
    if (want === 'annex') {
      out.push({ k: 'annex', label: `the whole of ${short(loser)}` });
      return out;
    }
    if (!vAtt) {
      // an attack beaten back: the attacker gives up his claim and pays for the war, and the defender keeps the border
      // land his soldiers hold (68-reasons-for-war's F4: "a border district or two", its cap for an attacker beaten back);
      // asked everything, full reparations too. (H-085: W1-5 first left the land out; with it went two in five of the
      // provinces that changed hands, and the memories of land taken that the next war's cause reads.)
      out.push({ k: 'renounce', label: `the claim of ${short(loser)} given up` });
      landTerm(WAR.land(w, vs, 'all'));
      if (want === 'all') coin(1, 'reparations');
      else coin(.5, 'the cost of the war');
      out.push(peace);
      return out;
    }
    const all = want === 'all', cb = w.cb;
    if (LAND_CB.has(cb) || all) landTerm(WAR.land(w, vs, all ? 'all' : 'casus'));
    if (cb === 'insult' || cb === 'incident' || cb === 'holy' || all) out.push({ k: 'humble', label: `a public submission: the ruler of ${short(loser)} kneels` });
    if (cb === 'tribute' || (all && !L.isRebel && !L.overlord && V.overlord !== loser && cb !== 'coalition')) out.push({ k: 'trib', label: `${short(loser)} a tributary of ${short(victor)}` });
    if (cb === 'coalition' && (L.allies || []).some(x => x !== victor && alive(x))) out.push({ k: 'unally', label: `${short(loser)} renounces its alliances` });
    if (all) coin(2.5, 'crushing reparations');
    else if (!out.some(t => t.k === 'land' || t.k === 'trib')) coin(1, 'reparations');
    out.push(peace);
    return out;
  };
  // the terms in words: "Kelmoor and Dunmere; reparations: 1,200 suns; ten years of sworn peace"
  WAR.termsWords = function (terms, brief) {
    const L = (terms || []).filter(t => t && t.label && (!brief || t.k !== 'peace')).map(t => t.k === 'land' ? `the land of ${t.label}` : t.label);
    return L.length ? L.join('; ') : 'nothing but peace';
  };

  // ---------------------------------------------------------------- the three decisions
  const FIGHT_FEEDS = ['pride', 'anger', 'shame', 'zeal', 'grief'];
  // 1. shall I ask for terms? (each month, after a lost battle or a fallen capital)
  WAR.yieldQ = function (w, s, f, o) {
    o = o || {};
    f = f || WAR.facts(w, s);
    const P = E.will(f), foe = WAR.lead(w, other(s));
    return W.decide(WAR.lead(w, s), 'yield', [
      { id: 'fight', at: foe, feeds: FIGHT_FEEDS, reasons: P.fight },
      { id: 'ask', at: foe, feeds: ['fear'], reasons: o.extra ? P.ask.concat(o.extra) : P.ask },
    ], { band: WAR.T.yieldBand, r: WAR.lead(w, s), at: foe, log: o.log, logIf: rec => rec.chose !== 'fight' });
  };
  // a councillor counsels peace (the release's A.councilPropose): his counsel is one more reason to ask, weighed by the
  // ruler with his own (ch: the release's measure of the councillor's standing with him and his skill)
  WAR.counsel = function (r, t, pc, ch) {
    const w = A.S.wars.find(x => (x.att.includes(r.id) && x.def.includes(t.id)) || (x.def.includes(r.id) && x.att.includes(t.id)));
    if (!w || w.ask) return null;
    const s = A.warSide(w, r.id);
    if (WAR.lead(w, s) !== r.id) return null;
    WAR.init(w);
    return WAR.yieldQ(w, s, null, { extra: [{ kind: 'loyalty', weight: r2(.8 + 2 * ((ch || .3) - .3)), label: `The counsel of ${A.fullName(pc, false)}`, source: { t: 'counsel', id: pc.id }, pub: 1 }] });
  };
  // 2. what does the victor demand? (his cause, everything he holds, nothing yet, or the realm itself)
  WAR.want = function (w, vs, o) {
    o = o || {};
    const ls = other(vs), victor = WAR.lead(w, vs), loser = WAR.lead(w, ls), V = A.realm(victor), L = A.realm(loser);
    if (!V || !L) return null;
    const fl = o.loserFacts || WAR.facts(w, ls, { noTerms: true, dry: true }), fv = o.victorFacts || WAR.facts(w, vs, { noTerms: true, dry: true });
    const inf = V.infamy || 0, opts = [];
    const rs = (kind, weight, label, src, pub) => ({ kind, weight: r2(weight), label, source: src, pub: pub ? 1 : 0 });
    const casus = [rs('duty', .6, `What the war was fought for: ${E.CAUSE_WORD[w.cb] || 'his cause'}`, { t: 'cause', id: w.cb || null }, 1),
      rs('reckoning', .5, 'A beaten man with nothing left to lose fights on', { t: 'harsh' }, 0),
      rs('cost', r2(1.2 * (fv.weary || 0) / 100), 'His own realm is tired of the war', { t: 'weary', r: Math.round(fv.weary || 0) }, 0)];
    if (inf > 0) casus.push(rs('fear', r2(inf / 60), 'His name is already black among the crowns', { t: 'infamy', r: Math.round(inf) }, 1));
    opts.push({ id: 'casus', at: loser, reasons: casus });
    const all = [rs('coin', .4, `The wealth of ${short(loser)}`, { t: 'gold', at: loser }, 0),
      rs('ambition', .4, `The land of ${short(loser)}`, { t: 'land', at: loser }, 0),
      rs('reckoning', r2(1.2 * (fl.lostShare || 0) + (o.defeated ? 1.5 : 0)), o.defeated ? `${cap(short(loser))} can fight no more` : `${cap(short(loser))} lies open to him`, { t: 'open', at: loser, r: fl.lostShare || 0 }, 1)];
    opts.push({ id: 'all', at: loser, feeds: ['pride', 'anger', 'grief', 'zeal', 'greed'], reasons: all });
    // nothing yet: the realm is all but his, and he will have it whole (only when the loser asked, not when defeated)
    if (o.asked && (fl.capLost || (fl.lostShare || 0) >= .5)) opts.push({ id: 'press', at: loser, feeds: ['pride', 'anger', 'greed'], reasons: [
      rs('ambition', r2(1.2 * (fl.lostShare || 0)), `All of ${short(loser)} is within his grasp`, { t: 'open', at: loser }, 1),
      rs('cost', -r2(1.5 * (fv.weary || 0) / 100), 'His own realm is tired of the war', { t: 'weary' }, 0)] });
    // the realm itself: only from the defeated, only when his soldiers hold nearly all of it, never a rebel's own crown
    if (o.defeated && (fl.lostShare || 0) >= WAR.T.annexShare && !L.isRebel && !V.isRebel) {
      const big = A.realmProvs(loser).length / Math.max(1, A.realmProvs(victor).length);
      const ann = [rs('ambition', .8, `To make ${short(loser)} his own`, { t: 'annex', at: loser }, 0),
        rs('want', r2(1.5 * fl.lostShare), `${cap(short(loser))} is already in his hands`, { t: 'held', at: loser }, 1),
        rs('reckoning', -r2(1.5 * big), 'A realm too large to hold', { t: 'size', r: r2(big) }, 0),
        rs('fear', -r2(inf / 40 + .5), 'The crowns would league against a conqueror', { t: 'infamy', r: Math.round(inf) }, 1)];
      const far = A.WORLD1 && A.WORLD1.noSwallow ? A.WORLD1.noSwallow(w, loser) : null;
      if (far) ann.push(rs('reckoning', -3, far, { t: 'far' }, 0));
      opts.push({ id: 'annex', at: loser, feeds: ['pride', 'anger', 'greed'], reasons: ann });
    }
    return W.decide(victor, 'terms', opts, { band: WAR.T.wantBand, r: victor, at: loser, log: o.log, logIf: rec => rec.chose !== 'casus' });
  };
  // 3. do I take these terms? (the side that gives them: the asker, or the weaker side offered terms)
  WAR.answer = function (w, s, terms, o) {
    o = o || {};
    const f = WAR.facts(w, s, { noTerms: true });
    f.terms = E.termsCost(terms, f);
    f.termsLabel = WAR.termsWords(terms, true);
    const P = E.will(f), foe = WAR.lead(w, other(s)), ask = P.ask.slice();
    if (o.light) ask.push({ kind: 'reckoning', weight: .4, label: 'The terms are lighter than he feared', source: { t: 'terms' }, pub: 0 });
    return W.decide(WAR.lead(w, s), 'terms', [
      { id: 'accept', at: foe, feeds: ['fear'], reasons: ask },
      { id: 'refuse', at: foe, feeds: FIGHT_FEEDS, reasons: P.fight },
    ], { band: WAR.T.ansBand, r: WAR.lead(w, s), at: foe, log: o.log });
  };
  // 4. the victor's answer to a counter-offer of his cause's terms (he asked for everything)
  WAR.takeCounter = function (w, vs, o) {
    const fv = WAR.facts(w, vs, { noTerms: true, dry: true }), P = E.will(fv), loser = WAR.lead(w, other(vs));
    const take = P.ask.concat([{ kind: 'duty', weight: .6, label: 'His cause is met', source: { t: 'cause', id: w.cb || null }, pub: 1 }]);
    return W.decide(WAR.lead(w, vs), 'terms', [
      { id: 'take', at: loser, reasons: take },
      { id: 'press', at: loser, feeds: ['pride', 'anger', 'greed'], reasons: P.fight },
    ], { band: WAR.T.ansBand, r: WAR.lead(w, vs), at: loser, log: (o || {}).log });
  };
  // 5. the stronger side, tired itself, offers terms rather than press on (pathway 7)
  WAR.offerQ = function (w, vs, fv) {
    const P = E.will(fv || WAR.facts(w, vs, { noTerms: true })), loser = WAR.lead(w, other(vs));
    return W.decide(WAR.lead(w, vs), 'terms', [
      { id: 'press', at: loser, feeds: FIGHT_FEEDS, reasons: P.fight },
      { id: 'offer', at: loser, reasons: P.ask },
    ], { band: WAR.T.yieldBand, r: WAR.lead(w, vs), at: loser, logIf: rec => rec.chose === 'offer' });
  };

  const cap = s => { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };
  WAR.cap = cap;
})();
