// AI personality: ruler traits become weights in every diplomatic decision, and each decision is logged with
// its top 3 reasons (CK3 personality weights / Stellaris ethics, made legible like EU4's "why" lists).
//
// The model:
//   A.rulerPersona(rid) -> { war, warLog, cult, honor, greed, caution, pride, social, zeal, patience, wrath, warmth, parts }
//     war      multiplier on war-declaration odds = cult * e^warLog (cult = realm tradition from A.AGGRO, compressed)
//     the rest are axes on -1..1 built from the ruler's traits (TW below); parts[axis] = [[trait, weight], ...]
//   Small helpers (A.aiWarW, A.aiYield, A.aiWhite, ...) turn the persona into the numbers the engine reads.
//   Decision helpers (A.aiBreakAlly, A.aiSign, A.aiAnswerCall, A.aiNotePeace, ...) roll the dice the engine used to
//   roll, but with persona-weighted odds, and write A.S.aiLog: newest first, capped at 300, each entry with its
//   top 3 reasons as [label, weight] (weight > 0 pushed toward what was done, < 0 against it).
//
// Determinism: only A.chance / A.pick consume randomness, and only where the engine already rolled. Everything
// else here is a pure function of state (the persona cache is keyed by ruler and traits, and never touches A.S).

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const r2 = x => Math.round(x * 100) / 100;
const ln = x => Math.log(Math.max(1e-6, x));
const cap = s => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);
const LOG_CAP = 300;

// Trait -> weights. `war` is in log units on the odds of declaring war (e^0.55 = x1.73); the other axes are
// summed and clamped to -1..1. Opposites mirror each other, so a ruler with both halves of a pair cancels out.
const TW = {
  brave: { war: .35, caution: -.5, pride: .15 },
  craven: { war: -.6, caution: .6, pride: -.2 },
  ambitious: { war: .55, greed: .25, pride: .2 },
  content: { war: -.6, greed: -.25, patience: .15 },
  cruel: { war: .4, warmth: -.6, honor: -.1 },
  kind: { war: -.5, warmth: .6, honor: .15 },
  honest: { honor: .5, war: -.05 },
  deceitful: { honor: -.55, war: .1 },
  zealous: { zeal: .7, honor: .1, war: .05 },
  cynical: { zeal: -.6 },
  greedy: { greed: .6, war: .25, warmth: -.1 },
  generous: { greed: -.6, war: -.25, warmth: .2, social: .1 },
  wrathful: { war: .55, wrath: .7, patience: -.3, caution: -.15 },
  calm: { war: -.45, wrath: -.6, patience: .3 },
  gregarious: { social: .6 },
  shy: { social: -.5, caution: .1 },
  patient: { war: -.4, patience: .6, caution: .15 },
  impetuous: { war: .4, patience: -.6, caution: -.3 },
  loyal: { honor: .55 },
  fickle: { honor: -.55 },
  humble: { war: -.4, pride: -.6 },
  proud: { war: .3, pride: .6, wrath: .1 },
  curious: { social: .2 },
  stubborn: { pride: .25, patience: .2 },
  diligent: { patience: .15 },
  lazy: { war: -.2, social: -.15 },
  trusting: { honor: .15, caution: -.2, social: .2 },
  paranoid: { caution: .4, social: -.35, honor: -.1 },
  vengeful: { wrath: .6, war: .2 },
  forgiving: { wrath: -.6, war: -.15, warmth: .2 },
  temperate: { war: -.1, greed: -.15, patience: .15 },
  gluttonous: { greed: .25 },
  just: { honor: .35, war: -.1 },
  arbitrary: { honor: -.3, war: .1 },
  reckless: { war: .3, caution: -.6, patience: -.3 },
  cautious: { war: -.3, caution: .6 },
  romantic: { social: .25, warmth: .15 },
  stoic: { patience: .3, wrath: -.25 },
  witty: { social: .2 },
  honorable: { honor: .6, war: -.05 },
};
const AXES = ['honor', 'greed', 'caution', 'pride', 'social', 'zeal', 'patience', 'wrath', 'warmth'];
A.AI_TRAIT_WEIGHTS = TW;
A.AI_AXES = AXES;

// tuning constants (one place, so the bench can be re-run against other values)
A.AI_TUNE = Object.assign({
  cultExp: .5,   // realm tradition A.AGGRO enters as AGGRO^cultExp
  hazK: 1.6,     // war odds per check scale as e^(hazK * warLog)
  barK: 20,      // opinion needed before war is thinkable: -25 + barK * warLog
  wearyK: 15,    // war-weariness tolerated before declaring: 30 + wearyK * warLog
}, A.AI_TUNE || {});

const build = (traits, base, extra) => {
  const T = A.AI_TUNE, P = Object.assign({ traits: [], base, cult: r2(Math.pow(Math.max(.05, base), T.cultExp)), warLog: 0, parts: {} }, extra);
  for (const k of AXES) P[k] = 0;
  for (const t of traits) {
    const w = TW[t];
    if (!w) continue;
    P.traits.push(t);
    for (const k in w) { if (k === 'war') P.warLog += w[k]; else P[k] += w[k]; (P.parts[k] = P.parts[k] || []).push([t, w[k]]); }
  }
  P.warLog = r2(clamp(P.warLog, -1.6, 1.6));
  for (const k of AXES) P[k] = r2(clamp(P[k], -1, 1));
  P.war = Math.round(1000 * P.cult * Math.exp(P.warLog)) / 1000;
  return Object.freeze(P);
};
const cache = new Map();
A.rulerPersona = function (rid) {
  const r = A.realm(rid);
  const ru = r && r.ruler != null ? A.P(r.ruler) : null;
  const traits = ru && Array.isArray(ru.traits) ? ru.traits : [];
  const base = A.AGGRO && A.AGGRO[rid] != null ? (+A.AGGRO[rid] || 1) : 1;
  const T = A.AI_TUNE, key = (ru ? ru.id : '') + '|' + base + '|' + traits.join(',') + '|' + T.cultExp;
  const hit = cache.get(rid);
  if (hit && hit.key === key) return hit.P;
  // the realm's tradition (A.AGGRO) stays the baseline, compressed so a ruler's character can outweigh it:
  // orcs at 1.7 become 1.3, the gentlest realm at 0.2 becomes 0.45
  const P = build(traits, base, { rid, ruler: ru ? ru.id : null });
  cache.set(rid, { key, P });
  return P;
};
// any person's temper (a claimant, a rebel lord): same weights, no realm tradition
A.personPersona = p => build(p && Array.isArray(p.traits) ? p.traits : [], 1, { rid: null, ruler: p ? p.id : null });

// the trait that drives an axis most in the given direction (for labels): "wrathful"
const lead = (P, axis, sign) => {
  let best = null;
  for (const [t, w] of P.parts[axis] || []) if ((sign == null || Math.sign(w) === sign) && (!best || Math.abs(w) > Math.abs(best[1]))) best = [t, w];
  return best ? best[0] : null;
};
// "Wrathful ruler" style reasons for one axis: each trait's own push, times k (k carries the sign of the decision)
const traitWhy = (P, axis, k, tail) => (P.parts[axis] || []).map(([t, w]) => [`${cap(t)} ruler${tail ? ': ' + tail : ''}`, w * k]);

// ---------- numbers the engine reads ----------
A.aiWarW = rid => A.rulerPersona(rid).war;                                       // war-declaration weight (was A.AGGRO)
A.aiWarHaz = rid => { const P = A.rulerPersona(rid); return P.cult * Math.exp(A.AI_TUNE.hazK * P.warLog); };  // odds of declaring, per check (was A.AGGRO)
A.aiWarBar = rid => clamp(-25 + A.AI_TUNE.barK * A.rulerPersona(rid).warLog, -60, -8);  // opinion at which war is thinkable (was -25)
A.aiWeary = rid => clamp(30 + A.AI_TUNE.wearyK * A.rulerPersona(rid).warLog, 8, 55);    // war-weariness tolerated before a new war (was 30)
A.aiNerve = rid => .7 + .3 * A.rulerPersona(rid).caution;                          // strength edge wanted before attacking (was .7)
A.aiNoCause = rid => .6 * Math.exp(-.6 * A.rulerPersona(rid).patience);            // odds factor for war with no accepted cause (was .6)
A.aiFearAt = rid => 1.25 * (1 - .2 * A.rulerPersona(rid).caution);                 // power ratio at which a neighbor is a threat (was 1.25)
A.aiAllyBar = rid => 48 - 10 * A.rulerPersona(rid).social;                          // interest needed to seek an alliance (was 48)
A.aiCallAdj = rid => { const P = A.rulerPersona(rid); return .25 * P.honor - .1 * P.caution; };  // added to the call-to-arms odds
A.aiYield = rid => { const P = A.rulerPersona(rid); return clamp(Math.exp(.6 * P.caution - .7 * P.pride - .3 * P.wrath + .2 * P.warmth), .3, 2.5); };
const will = P => clamp(Math.exp(.4 * P.caution - .5 * P.pride - .5 * P.wrath + .3 * P.warmth - .3 * P.warLog), .3, 2.5);
A.aiWhite = w => Math.sqrt(will(A.rulerPersona(w.leadA)) * will(A.rulerPersona(w.leadD)));
A.aiPeaceWill = rid => { const P = A.rulerPersona(rid); return Math.round(clamp(12 * (P.caution - P.pride - .6 * P.wrath + .4 * P.warmth) - 4 * P.warLog, -20, 20)); };
A.aiSubmitAdj = rid => { const P = A.rulerPersona(rid); return clamp(.1 * (P.caution - P.pride), -.2, .2); };
A.aiGreedW = rid => { const P = A.rulerPersona(rid); return P.war * Math.exp(.7 * P.greed); };
A.aiGiveP = rid => { const P = A.rulerPersona(rid); return clamp(.25 * Math.exp(-1.2 * P.greed + .3 * P.warmth), .03, .7); };
A.aiSpite = rid => { const P = A.rulerPersona(rid); return clamp(Math.exp(.5 * P.greed + .6 * P.wrath + .3 * P.pride - .4 * P.warmth), .3, 2.5); };
A.aiRivalW = rid => { const P = A.rulerPersona(rid); return clamp(Math.exp(.6 * P.wrath + .4 * P.pride + .6 * P.warLog - .4 * P.warmth), .2, 3); };
A.aiTradeW = rid => { const P = A.rulerPersona(rid); return clamp(Math.exp(.5 * P.social + .4 * P.greed), .4, 2.2); };
A.aiNapW = rid => { const P = A.rulerPersona(rid); return clamp(Math.exp(.6 * P.caution + .3 * P.honor - .3 * P.warLog), .4, 2.2); };
A.aiPlan = rid => clamp(Math.exp(.4 * A.rulerPersona(rid).patience), .6, 1.6);    // patient rulers build a cause first
A.aiBetrayP = rid => clamp(.06 * Math.exp(-1.5 * A.rulerPersona(rid).honor), .01, .25);
A.aiJoinP = rid => { const P = A.rulerPersona(rid); return clamp(.35 * Math.exp(.4 * P.honor + .5 * P.warLog), .05, .8); };

// ---------- the log ----------
A.aiTop = function (why, n) {
  return (why || []).filter(x => x && isFinite(x[1]) && Math.abs(x[1]) >= .005)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, n || 3)
    .map(([l, w]) => [String(l).replace(/[<>"]/g, ''), r2(w)]);
};
A.aiLogAdd = function (k, rid, oid, text, why, who) {
  const S = A.S;
  if (!S) return null;
  if (!Array.isArray(S.aiLog)) S.aiLog = [];
  const r = A.realm(rid), ru = r && r.ruler != null ? A.P(r.ruler) : null;
  const e = { y: S.year, d: A.today ? A.today() : 0, k, r: rid, o: oid || null, who: who != null ? String(who) : ru && A.rulerStyle ? A.rulerStyle(ru, r) : '', t: String(text || ''), why: A.aiTop(why, 3) };
  S.aiLog.unshift(e);
  if (S.aiLog.length > LOG_CAP) S.aiLog.length = LOG_CAP;
  return e;
};
const short = id => A.realmShort(id);

// ---------- reasons ----------
const CBN = { justified: 'a forged claim', reconquest: 'lost land to reclaim', rivalry: 'an old rivalry', holy: 'holy war', incident: 'a border incident',
  insult: 'an insult to avenge', tribute: 'refused tribute', betrayal: 'no cause but appetite', conquest: 'conquest', coalition: 'a coalition' };
A.aiWhyWar = function (a, b, P, rel, cb) {
  const Pa = A.rulerPersona(a), ra = A.realm(a) || {}, out = traitWhy(Pa, 'war', 1);
  for (const x of out) x[1] *= A.AI_TUNE.hazK;
  if (Math.abs(ln(Pa.cult)) > .05) out.push([Pa.cult > 1 ? 'A warlike realm' : 'A peaceable realm', ln(Pa.cult)]);
  if (P) out.push([`${P.ratio.toFixed(1)}x their strength`, ln(Math.max(.05, clamp(P.ratio - A.aiNerve(a), 0, 2.5)))]);
  if (rel != null) out.push([`Bad blood (opinion ${Math.round(rel)})`, .4 + ln(Math.max(.05, 1 + (-rel - 25) / 60))]);
  if (cb) out.push([`A cause: ${CBN[cb] || cb}`, .3 + ln(cb === 'justified' || cb === 'reconquest' ? 2.2 : 1.5)]);
  else out.push(['No accepted cause', ln(A.aiNoCause(a))]);
  if ((ra.rivals || []).includes(b)) out.push(['Sworn rivals', ln(1.5)]);
  const inf = clamp(1 - (ra.infamy || 0) / 90, .15, 1);
  if (inf < .95) out.push(['Infamy gives pause', ln(inf)]);
  return out;
};
A.aiNoteWar = function (a, b, P, rel, cb, res) {
  if (res && res.ok === false) return res;
  A.aiLogAdd('war', a, b, `declares war on ${short(b)}.`, A.aiWhyWar(a, b, P, rel, cb));
  return res;
};

// interest: what a ruler's character adds to how much realm a wants realm b (feeds A.interest, shown by A.interestParts)
A.aiInterestParts = function (a, b, out) {
  out = out || [];
  const ra = A.realm(a), rb = A.realm(b);
  if (!ra || !rb) return out;
  const P = A.rulerPersona(a), Pb = A.rulerPersona(b), add = (l, v) => { v = Math.round(v); v && out.push([l, v]); };
  if (P.social) add(`Their ruler is ${lead(P, 'social', Math.sign(P.social))}`, 8 * P.social);
  if (ra.faith && rb.faith) {
    if (ra.faith === rb.faith && P.zeal) add(`Their ruler is ${lead(P, 'zeal', Math.sign(P.zeal))}: ${P.zeal > 0 ? 'one faith' : 'faith matters little'}`, (P.zeal > 0 ? 10 : 6) * P.zeal);
    if (ra.faith !== rb.faith && P.zeal > 0) add(`Their ruler is ${lead(P, 'zeal', 1)}: another faith`, -10 * P.zeal);
  }
  const ratio = A.realmPower(rb) / Math.max(1, A.realmPower(ra));
  if (P.greed > 0 && (A.hasTrade(a, b) || (rb.income || 0) > (ra.income || 0))) add(`Their ruler is ${lead(P, 'greed', 1)}: your gold`, 6 * P.greed);
  if (P.caution > 0 && ratio > 1.5) add(`Their ruler is ${lead(P, 'caution', 1)}: you are strong`, 8 * P.caution);
  if (P.pride > 0 && ratio > 2) add(`Their ruler is ${lead(P, 'pride', 1)}: nobody's junior`, -8 * P.pride);
  if (P.wrath > 0 && (ra.rivals || []).includes(b)) add(`Their ruler is ${lead(P, 'wrath', 1)}: an old rival`, -10 * P.wrath);
  if (P.warmth > 0) add(`Their ruler is ${lead(P, 'warmth', 1)}`, 4 * P.warmth);
  if (Pb.honor >= .3) add('Your ruler keeps faith', 6 * Pb.honor);
  else if (Pb.honor <= -.3) add('Your ruler breaks faith', 8 * Pb.honor);
  return out;
};
A.aiInterestSum = (a, b) => A.aiInterestParts(a, b, []).reduce((s, x) => s + x[1], 0);

// relation drift: everything that moves a's opinion of b each year (A.politicsYear adds A.aiPullSum; the UI shows the parts)
A.aiPullParts = function (a, b, ui) {
  const ra = A.realm(a), rb = A.realm(b), out = [];
  if (!ra || !rb) return out;
  const P = A.rulerPersona(a), allied = (ra.allies || []).includes(b), trade = A.hasTrade(a, b);
  // the engine's own yearly pulls (unchanged from A.politicsYear)
  allied && out.push(['Allies', 1]);
  trade && out.push(['Trade partners', 1]);
  const same = ra.faith && rb.faith && ra.faith === rb.faith;
  same && out.push(['Same faith', .4]);
  A.claimsOn(a, b).length && out.push(['They hold land we claim', -1.5]);
  A.claimsOn(b, a).length && out.push(['They claim our land', -1]);
  rb.infamy > 25 && A.neighbors(a).includes(b) && out.push([`Their infamy (${Math.round(rb.infamy)})`, -rb.infamy / 30]);
  ra.overlord === b && out.push(['We pay them tribute', -.8]);
  // the ruler's character
  if (P.social && (allied || trade)) out.push([`Ruler is ${lead(P, 'social', Math.sign(P.social))}: ${P.social > 0 ? 'warms to friends' : 'keeps friends at arm\'s length'}`, .4 * P.social * ((allied ? 1 : 0) + (trade ? 1 : 0))]);
  if (ra.faith && rb.faith && P.zeal) {
    if (same) out.push([`Ruler is ${lead(P, 'zeal', Math.sign(P.zeal))}: ${P.zeal > 0 ? 'one faith' : 'faith matters little'}`, .5 * P.zeal]);
    else if (P.zeal > 0) out.push([`Ruler is ${lead(P, 'zeal', 1)}: another faith`, -.6 * P.zeal]);
  }
  const rival = (ra.rivals || []).includes(b);
  if (rival && P.wrath > 0) out.push([`Ruler is ${lead(P, 'wrath', 1)}: nurses the rivalry`, -.8 * P.wrath]);
  if (rival && P.wrath < 0) out.push([`Ruler is ${lead(P, 'wrath', -1)}: lets the quarrel cool`, -.4 * P.wrath]);
  if (P.warmth > 0 && !rival && !A.hostile(a, b)) out.push([`Ruler is ${lead(P, 'warmth', 1)}`, .3 * P.warmth]);
  if (P.pride > 0 && A.neighbors(a).includes(b) && A.realmPower(rb) / Math.max(1, A.realmPower(ra)) > 2.2) out.push([`Ruler is ${lead(P, 'pride', 1)}: resents their strength`, -.6 * P.pride]);
  const Pb = A.rulerPersona(b);
  if (Math.abs(Pb.honor) >= .3) out.push([Pb.honor > 0 ? 'Their ruler keeps faith' : 'Their ruler breaks faith', .4 * Pb.honor]);
  if (ui) {
    // what A.diplomacyYear does on top: allies warm by one more, everyone else drifts 3% back toward neutral
    const v = ra.rel ? ra.rel[b] || 0 : 0;
    if (allied) out.push(['Sworn friendship', 1]);
    else if (Math.abs(v * .03) >= .05) out.push(['Old feelings fade', -v * .03]);
    return out.filter(x => Math.abs(x[1]) >= .05).map(([l, x]) => [l, Math.round(x * 10) / 10]);
  }
  return out;
};
A.aiPullSum = (a, b) => A.aiPullParts(a, b, false).reduce((s, x) => s + x[1], 0);

// ---------- decisions ----------
// keep or break an alliance (diploAI). Same two rolls the engine made, odds scaled by honor.
A.aiBreakAlly = function (rid, al) {
  const P = A.rulerPersona(rid), iv = A.interest(rid, al), m = Math.exp(-1.1 * P.honor), bar = 8 - 12 * P.honor;
  const low = iv < bar && A.chance(clamp(.35 * m, .02, .9));
  const fear = !low && A.threatsTo(rid).includes(al) && A.chance(clamp(.5 * m, .05, .95));
  if (!low && !fear) return false;
  const why = traitWhy(P, 'honor', -1.1);
  if (low) why.push([`Little to gain (interest ${Math.round(iv)})`, .3 + (bar - iv) / 25]);
  if (fear) why.push(['They have grown dangerous', .9]);
  A.aiLogAdd('unally', rid, al, `breaks the alliance with ${short(al)}.`, why);
  return true;
};
A.aiNoteBetray = function (rid, tid, res) {
  if (res && res.ok === false) return res;
  const P = A.rulerPersona(rid), ra = A.realm(rid), rt = A.realm(tid);
  const why = traitWhy(P, 'honor', -1.5).concat(traitWhy(P, 'war', 1));
  if (ra && rt) why.push([`${(A.realmPower(ra) / Math.max(1, A.realmPower(rt))).toFixed(1)}x their strength`, .5]);
  A.aiLogAdd('betray', rid, tid, `turns on its own ally ${short(tid)}.`, why);
  return res;
};

const SIGN_TXT = { ally: 'swears an alliance with', def: 'signs a defensive pact with', trade: 'opens its markets to', nap: 'signs a pact of non-aggression with',
  guar: 'guarantees the independence of', sub: 'pays a subsidy to', emb: 'embargoes', rival: 'names as its rival', trib: 'bends the knee to' };
const SIGN_AXIS = { ally: ['social', 1], def: ['caution', 1], trade: ['greed', 1], nap: ['caution', 1], guar: ['honor', 1], sub: ['greed', -1], emb: ['wrath', 1], rival: ['wrath', 1], trib: ['pride', -1] };
A.aiSignWhy = function (k, a, b) {
  const P = A.rulerPersona(a), [ax, s] = SIGN_AXIS[k] || ['social', 1], why = traitWhy(P, ax, s);
  if (k === 'trib') {
    why.push(...traitWhy(P, 'caution', .8));
    const ra = A.realm(a), rb = A.realm(b);
    if (ra && rb) why.push([`They are ${(A.realmPower(rb) / Math.max(1, A.realmPower(ra))).toFixed(1)}x stronger`, .8]);
    if (rb && A.rulerPersona(b).war > 1.1) why.push(['Their ruler is hungry for land', .5]);
  } else if (k === 'emb' || k === 'rival') {
    why.push(...traitWhy(P, 'greed', .5));
    why.push([`Bad blood (opinion ${A.relBetween(a, b)})`, .3 - A.relBetween(a, b) / 100]);
  } else if (k === 'sub') {
    why.push(['Their war is against our enemies', .6]);
  } else {
    // the same factors A.interest uses, persona included
    for (const [l, v] of A.interestParts(a, b)) why.push([l, v / 20]);
  }
  return why;
};
A.aiSign = function (k, a, b, opts) {
  const ok = A.sign(k, a, b, opts);
  if (ok) A.aiLogAdd(k, a, b, `${SIGN_TXT[k] || k} ${short(b)}.`, A.aiSignWhy(k, a, b));
  return ok;
};
A.aiJustify = function (a, b) {
  const res = A.justifyStart(a, b, true);
  if (res && res.ok) {
    const P = A.rulerPersona(a), why = traitWhy(P, 'war', 1).concat(traitWhy(P, 'patience', .4));
    why.push([`Bad blood (opinion ${A.relBetween(a, b)})`, .3 - A.relBetween(a, b) / 100]);
    A.aiLogAdd('justify', a, b, `sets clerks to forge a claim on ${short(b)}.`, why);
  }
  return res;
};

// a call to arms: answer it or break the alliance (callToArmsNow). p already includes A.aiCallAdj.
A.aiAnswerCall = function (al, def, att, p) {
  const yes = A.chance(p), P = A.rulerPersona(al), a = A.realm(al) || {}, s = yes ? 1 : -1;
  const why = traitWhy(P, 'honor', .25 * 4 * s).concat(traitWhy(P, 'caution', -.1 * 4 * s));
  const rel = A.relBetween(al, def);
  why.push([`Opinion of ${short(def)} ${rel > 0 ? '+' : ''}${rel}`, s * rel / 100]);
  if (a.exhaustion > 20) why.push([`War-weary (${Math.round(a.exhaustion)})`, -s * a.exhaustion / 100]);
  if (A.atWar(al).length) why.push(['Already at war', -s * .6]);
  if (A.relBetween(al, att) > 40) why.push([`Friends with ${short(att)}`, -s * .5]);
  A.aiLogAdd(yes ? 'call' : 'refuse', al, def, yes ? `honors the call to arms from ${short(def)} against ${short(att)}.` : `refuses the call to arms from ${short(def)}; the alliance is broken.`, why);
  return yes;
};
A.aiJoinAttack = function (al, att, def) {
  const yes = A.chance(A.aiJoinP(al));
  if (yes) {
    const P = A.rulerPersona(al), why = traitWhy(P, 'war', 1).concat(traitWhy(P, 'honor', .4));
    why.push([`Opinion of ${short(att)} +${A.relBetween(al, att)}`, .5], [`Opinion of ${short(def)} ${A.relBetween(al, def)}`, .3]);
    A.aiLogAdd('join', al, att, `marches with ${short(att)} against ${short(def)}.`, why);
  }
  return yes;
};

// peace (checkPeace): called just before the engine settles a war on its own
A.aiNotePeace = function (w, res) {
  const loser = res === 'att' ? w.leadD : res === 'def' ? w.leadA : null, la = A.realm(w.leadA), ld = A.realm(w.leadD);
  if (!la || !ld) return;
  const why = [], sc = w.score || 0;
  if (loser) {
    const P = A.rulerPersona(loser), L = A.realm(loser), lsc = loser === w.leadD ? sc : -sc;
    why.push([`War score ${lsc > 0 ? '+' : ''}${Math.round(-lsc)} against them`, Math.abs(sc) >= 80 ? 2 : Math.abs(sc) / 60]);
    if (L && L.exhaustion > 60) why.push([`Exhausted (${Math.round(L.exhaustion)})`, L.exhaustion / 80]);
    why.push(...traitWhy(P, 'caution', .6), ...traitWhy(P, 'pride', -.7), ...traitWhy(P, 'wrath', -.3));
    A.aiLogAdd('yield', loser, loser === w.leadD ? w.leadA : w.leadD, `yields to ${short(loser === w.leadD ? w.leadA : w.leadD)}: ${w.name || 'the war'} is lost.`, why);
  } else {
    const yrs = A.S.year - (w.start || A.S.year);
    if (yrs >= 2) why.push([`${yrs} years of war`, yrs / 6]);
    if (Math.abs(sc) < 15) why.push(['Stalemate', .5]);
    if (la.exhaustion > 75 && ld.exhaustion > 75) why.push(['Both sides exhausted', 1]);
    for (const id of [w.leadA, w.leadD]) { const P = A.rulerPersona(id); why.push(...traitWhy(P, 'caution', .4, short(id)), ...traitWhy(P, 'pride', -.5, short(id)), ...traitWhy(P, 'wrath', -.5, short(id))); }
    A.aiLogAdd('peace', w.leadA, w.leadD, `makes a white peace with ${short(w.leadD)}: ${w.name || 'the war'} ends.`, why);
  }
};

// tribute: a tributary stops paying (politicsYear); same three rolls, scaled by pride/caution
A.aiDefy = function (rid, ovid) {
  const r = A.realm(rid), ov = A.realm(ovid), P = A.rulerPersona(rid);
  if (!r || !ov) return false;
  const m = clamp(Math.exp(.6 * P.pride + .3 * P.warLog - .5 * P.caution - .2 * P.honor), .3, 2.5);
  const ratio = A.realmPower(ov) / Math.max(1, A.realmPower(r)), rel = A.relBetween(rid, ovid);
  const a = ratio < 1.6 && A.chance(clamp(.25 * m, .02, .9)), b = !a && rel < -60 && A.chance(clamp(.12 * m, .02, .9)), c = !a && !b && ov.exhaustion > 70 && A.chance(clamp(.2 * m, .02, .9));
  if (!a && !b && !c) return false;
  const why = traitWhy(P, 'pride', .6).concat(traitWhy(P, 'caution', -.5), traitWhy(P, 'war', .3));
  a && why.push([`The overlord is only ${ratio.toFixed(1)}x stronger`, .8]);
  b && why.push([`Hatred of the overlord (${rel})`, .8]);
  c && why.push([`The overlord is exhausted (${Math.round(ov.exhaustion)})`, .8]);
  A.aiLogAdd('defy', rid, ovid, `stops paying tribute to ${short(ovid)}.`, why);
  return true;
};
A.aiPunish = function (ovid, rid) {
  const P = A.rulerPersona(ovid), p = clamp(.5 * Math.exp(.5 * P.wrath + .4 * P.pride + .4 * P.warLog - .4 * P.warmth), .1, .95), yes = A.chance(p), s = yes ? 1 : -1;
  const why = traitWhy(P, 'wrath', .5 * s).concat(traitWhy(P, 'pride', .4 * s), traitWhy(P, 'war', .4 * s), traitWhy(P, 'warmth', -.4 * s));
  why.push([yes ? 'Tribute must be paid' : 'Not worth a war', .2]);
  A.aiLogAdd(yes ? 'punish' : 'release', ovid, rid, yes ? `marches to make ${short(rid)} pay its tribute.` : `lets ${short(rid)} go without a fight.`, why);
  return yes;
};
// after winning a war: make the loser a tributary? (settleWar's 50% roll, scaled by greed)
A.aiExact = function (win, lose) {
  const P = A.rulerPersona(win), yes = A.chance(clamp(.5 * Math.exp(.8 * P.greed + .3 * P.pride - .4 * P.warmth), .1, .9));
  if (yes) {
    const why = traitWhy(P, 'greed', .8).concat(traitWhy(P, 'pride', .3), traitWhy(P, 'warmth', -.4));
    why.push(['Victory in the field', .5]);
    A.aiLogAdd('exact', win, lose, `makes the beaten ${short(lose)} its tributary.`, why);
  }
  return yes;
};

// a rival made peace with: peaceable, forgiving rulers bury rivalries (a new choice; the engine never ended one on its own)
A.aiMendRival = function (rid) {
  const r = A.realm(rid), P = A.rulerPersona(rid);
  if (!r || !(r.rivals || []).length || (P.warLog > -.2 && P.wrath > -.3) || A.atWar(rid).length) return false;
  const rv = r.rivals.find(x => A.realm(x) && A.realm(x).alive && !A.hostile(rid, x) && A.relBetween(rid, x) > -75);
  if (!rv || !A.chance(clamp(.04 * Math.exp(-1.2 * P.warLog - .8 * P.wrath + .4 * P.warmth), .01, .25))) return false;
  A.cancelTr('rival', rid, rv);
  A.remember(rv, rid, 'peace', 8);
  const why = traitWhy(P, 'war', -1).concat(traitWhy(P, 'wrath', -.8), traitWhy(P, 'warmth', .4));
  why.push([`Opinion of them ${A.relBetween(rid, rv)}`, .2]);
  A.aiLogAdd('mend', rid, rv, `buries its rivalry with ${short(rv)}.`, why);
  return true;
};
// a claimant decides whether to raise banners (AI-started succession wars only: a contested succession, a tottering crown)
A.aiPressClaim = function (r, cl) {
  if (!r || !cl) return false;
  const pc = A.pc();
  if (pc && cl.id === pc.id) return true;
  const P = A.personPersona(cl), p = clamp(.6 * Math.exp(1.2 * P.warLog + .4 * P.pride - .4 * P.caution), .08, 1), yes = A.chance(p), s = yes ? 1 : -1;
  const why = traitWhy(P, 'war', 1.2 * s).concat(traitWhy(P, 'pride', .4 * s), traitWhy(P, 'caution', -.4 * s));
  why.push([`${cap(r.short)} is ${r.stability < 30 ? 'tottering' : 'divided'} (stability ${Math.round(r.stability)})`, s * (.3 + Math.max(0, 40 - r.stability) / 60)]);
  const name = A.fullName(cl, false);
  A.aiLogAdd(yes ? 'claim' : 'kneel', r.id, null, yes ? `faces ${name}, who refuses to kneel and claims the throne.` : `is spared a civil war: ${name} has a claim but kneels.`, why, `claimant ${name}`);
  return yes;
};
// a faction's demand: the ruler yields or refuses (pride, caution), then the faction's leader rises or backs down (his own temper)
A.aiFactionAnswer = function (r, f) {
  const P = A.rulerPersona(r.id), adj = clamp(.12 * (P.caution - P.pride) - .05 * P.wrath, -.25, .25);
  const yes = A.chance(clamp(f.power * 1.4 - r.stability / 200 + adj, .1, .85)), s = yes ? 1 : -1, F = (A.FACTIONS || {})[f.kind] || {};
  const why = traitWhy(P, 'caution', .12 * 8 * s).concat(traitWhy(P, 'pride', -.12 * 8 * s), traitWhy(P, 'wrath', -.05 * 8 * s));
  why.push([`The faction holds ${Math.round(f.power * 100)}% of the swords`, s * (f.power * 1.4 - .3)], [`Stability ${Math.round(r.stability)}`, -s * r.stability / 200]);
  A.aiLogAdd(yes ? 'yieldfac' : 'defyfac', r.id, null, yes ? `yields to the ${F.name || 'faction'}: ${F.demand || 'its demand'}.` : `refuses the ${F.name || 'faction'}.`, why);
  return yes;
};
A.aiRevolt = function (r, f) {
  const lead = A.S.houses[f.leader], head = lead ? A.houseHead(lead.id) : null;
  if (!head || (A.pc() && head.id === A.pc().id)) return true;
  const P = A.personPersona(head), p = clamp(.7 * Math.exp(1.2 * P.warLog + .4 * P.pride - .4 * P.caution), .1, 1), yes = A.chance(p), s = yes ? 1 : -1, F = (A.FACTIONS || {})[f.kind] || {};
  const why = traitWhy(P, 'war', 1.2 * s).concat(traitWhy(P, 'pride', .4 * s), traitWhy(P, 'caution', -.4 * s));
  why.push([`The crown refused: ${F.demand || 'their demand'}`, s * .4]);
  const name = A.fullName(head, false);
  A.aiLogAdd(yes ? 'revolt' : 'backdown', r.id, null, yes ? `faces ${name} and the ${F.name || 'faction'} in arms.` : `is spared a revolt: ${name} and the ${F.name || 'faction'} back down.`, why, `${F.name || 'faction'} leader ${name}`);
  if (!yes) A.S.factions = (A.S.factions || []).filter(x => x !== f);
  return yes;
};
// a coalition marches: the strongest hawk among the members leads it
A.aiNoteCoalition = function (lead, t, mem) {
  const P = A.rulerPersona(lead), rt = A.realm(t);
  const why = traitWhy(P, 'war', 1).concat([[`${short(t)}'s infamy (${Math.round(rt ? rt.infamy : 0)})`, 1], [`${mem.length} realms stand together`, mem.length / 4]]);
  A.aiLogAdd('coalition', lead, t, `leads a coalition of ${mem.length} realms against ${short(t)}.`, why);
};

// ---------- the AI answering the player ----------
// reasons for an AI ruler's answer to the player's proposal k (the same numbers the odds use)
A.aiSubmitWhy = function (tid, rid) {
  const P = A.rulerPersona(tid), ratio = A.realmPower(A.realm(rid)) / Math.max(1, A.realmPower(A.realm(tid)));
  return [[`You are ${ratio.toFixed(1)}x stronger`, Math.round(100 * (ratio - 2) / 4)], [`Opinion of you ${A.relBetween(tid, rid)}`, Math.round(A.relBetween(tid, rid) / 3)]]
    .concat((P.parts.caution || []).map(([t, w]) => [`${cap(t)} ruler`, Math.round(10 * w)]), (P.parts.pride || []).map(([t, w]) => [`${cap(t)} ruler`, Math.round(-10 * w)]));
};
const answerOf = (k, r, t) => {
  if (k === 'vassalize') return A.aiSubmitWhy(t.id, r.id).map(([l, v]) => [l, v / 10]);
  const o = A.diplOptions(r, t).find(x => x.k === k);
  return o && o.reasons ? o.reasons.map(([l, v]) => [l, v / 10]) : [];
};
const ASKED = { ally: 'an alliance', def: 'a defensive pact', nap: 'a pact of non-aggression', trade: 'a trade pact', access: 'military access', guar: 'your guarantee',
  summit: 'a summit', marry: 'a royal match', vassalize: 'your demand for tribute' };
const _diplDo = A.diplDo;
A.diplDo = function (k, tid) {
  const r = A.myRealm(), t = A.realm(tid);
  let pre = null;
  if (ASKED[k] && r && t && t.alive) {
    const o = A.diplOptions(r, t).find(x => x.k === k);
    if (o && o.chance != null && !o.dis && !o.cool) pre = answerOf(k, r, t);
  }
  const res = _diplDo.apply(this, arguments);
  if (pre && res) {
    const yes = !!res.ok;
    A.aiLogAdd(yes ? 'accept' : 'decline', tid, r.id, `${yes ? 'accepts' : 'refuses'} ${ASKED[k]} from ${short(r.id)}.`, pre.map(([l, v]) => [l, yes ? v : -v]));
  }
  return res;
};
// the player's peace offer: log the answer with the willingness parts
A.aiWillParts = function (T) {
  if (!T || !T.e) return [];
  const P = A.rulerPersona(T.eid), out = [[`War score ${Math.round(T.sc)}`, Math.round(T.sc * 1.3)], ['Base', 18]];
  if (T.e.exhaustion) out.push([`Their war-weariness (${Math.round(T.e.exhaustion)})`, Math.round(T.e.exhaustion * .35)]);
  if (T.r && T.r.exhaustion) out.push([`Your war-weariness (${Math.round(T.r.exhaustion)})`, -Math.round(T.r.exhaustion * .15)]);
  if (A.atWar(T.eid).length > 1) out.push(['Fighting on another front', 10]);
  const pw = A.aiPeaceWill(T.eid);
  if (pw) out.push([`Their ruler is ${P.traits.filter(t => ['caution', 'pride', 'wrath', 'warmth'].some(ax => (TW[t] || {})[ax])).join(', ') || 'set in their ways'}`, pw]);
  return out;
};
const _peaceOffer = A.peaceOffer;
A.peaceOffer = function (wid, picks) {
  const pc = A.pc(), rid = pc && pc.ruler, w = A.S.wars.find(x => x.id === wid);
  const T = w && rid ? A.peaceTerms(w, rid) : null;
  const res = _peaceOffer.apply(this, arguments);
  if (T && res && (res.ok || /refuses/.test(res.msg || ''))) {
    const parts = A.aiWillParts(T).map(([l, v]) => [l, (res.ok ? 1 : -1) * v / 20]);
    A.aiLogAdd(res.ok ? 'accept' : 'decline', T.eid, rid, res.ok ? `accepts peace terms from ${short(rid)}.` : `refuses the peace terms of ${short(rid)}.`, parts);
  }
  return res;
};
// offers the AI makes to the player: log them, and tell the player why in the offer itself
A.aiOfferWhy = function (o, pr) {
  const t = A.realm(o.rid);
  if (!t || !pr) return [];
  const P = A.rulerPersona(t.id);
  if (o.kind === 'tribute') return traitWhy(P, 'greed', .7).concat(traitWhy(P, 'war', 1), [[`They are ${(A.realmPower(t) / Math.max(1, A.realmPower(pr))).toFixed(1)}x your strength`, 1]]);
  if (o.kind === 'claimdemand') return [['An old claim', 1]].concat(traitWhy(P, 'wrath', .6), traitWhy(P, 'pride', .4));
  if (['sue', 'demand', 'whitepeace'].includes(o.kind)) {
    const w = A.S.wars.find(x => x.id === o.war), why = traitWhy(P, 'caution', .6).concat(traitWhy(P, 'pride', -.7), traitWhy(P, 'wrath', -.4));
    if (w) why.push([`War score ${Math.round(A.warSide(w, t.id) === 'att' ? w.score : -w.score)}`, .8]);
    if (t.exhaustion > 30) why.push([`War-weariness ${Math.round(t.exhaustion)}`, t.exhaustion / 80]);
    return why;
  }
  return A.interestParts(t.id, pr.id).map(([l, v]) => [l, v / 10]);
};
const KIND_TXT = { ally: 'offers an alliance to', defpact: 'proposes a defensive pact to', access: 'asks military access of', nap: 'proposes a pact of non-aggression to',
  trade: 'offers a trade pact to', marry: 'proposes a royal match to', tribute: 'demands tribute from', aid: 'asks for gold from', buy: 'offers to buy land from',
  sue: 'sues for peace with', demand: 'demands the surrender of', whitepeace: 'offers a white peace to', jointwar: 'proposes a joint war to', coalition: 'invites into a league',
  claimdemand: 'demands land back from' };
const _queueAiOffer = A.queueAiOffer;
A.queueAiOffer = function (pc, r, o) {
  const n = A.S.queue.length, res = _queueAiOffer.apply(this, arguments);
  if (o && r && A.S.queue.length > n) {
    const why = A.aiTop(A.aiOfferWhy(o, r), 3), it = A.S.queue[A.S.queue.length - 1];
    A.aiLogAdd('offer', o.rid, r.id, `${KIND_TXT[o.kind] || 'makes an offer to'} ${short(r.id)}.`, why);
    const shown = why.filter(x => x[1] > 0).map(x => x[0]);
    if (it && typeof it.text === 'string' && shown.length) it.text += ` Their reasons: ${shown.join('; ')}.`;
  }
  return res;
};
