// Fights on the ladder (Road to Ten, Power 1-5). Every event fight that can kill or maim, and every brawl, ambush and
// hunt that a plain check used to decide, now rolls on fighting worth:
//   one against one: the duel's own odds on the worth gap (A.DUEL_ODDS, 24-honest-odds), plus your health;
//   a party or a crowd: the group resolver on tier math (A.groupOddsSides, GD.STR_CURVE);
//   a beast: that beast's duel curve, alone or with a hunting party, measured from the duel engine (GD.BEAST_DUEL).
// A converted choice keeps its label, its win and lose text and its fx; only what decides it changes. Its check gains a
// `fight` spec, A.checkOdds reads it, and A.eventChoose rolls exactly that number, so the odds shown are the odds rolled.
// Also: the bestiary's scale fixed where it clashed with its own sizes (audit.core.js), a lost hand costs two tiers for
// every weapon, and the math is shown on event choices, on the duel screen and on the profile.
const FL = A.FL;
const DO = A.DUEL_ODDS = A.DUEL_ODDS || { scale: 6.1, seat: -0.14 };
// A duel's odds by its rules, as [scale, seat, health]: p = 1 / (1 + e^-(d / scale + seat + health * (hA - hB))), d the
// gap in fighting worth of the two fighters as they start (armed), h each one's share of blood at the start (the duel
// starts you at your health, never below 30%). Fitted by maximum likelihood on 9,000 duels (yield, lethal: fighters of
// tiers 1-6 from three worlds, the player's seat at health 40-100 and played by A.duelAuto, which yields under 20% blood;
// a yield is a loss) and 2,200 per rule set for the rest. The foe who may yield (an event's duel) gives the player's seat
// its edge. FL.DREW: a foe who carried no weapon and draws one as the fight starts (A.armFor) fights 0.78 logits below
// their worth (most people carry none). Re-fit with bench/fights-audit.mjs (duels).
FL.RULES = { yield: [6.5, 0.2, 3.1], lethal: [6.5, 0, 3.1], brawl: [5.75, 0.35, 3.5], spar: [9, 0.15, 1.5], tourney: [10, 0.15, 0.5] };
FL.DREW = 0.78;
FL.ruleOf = D => (D.kind === 'spar' ? 'spar' : D.kind === 'tourney' ? 'tourney' : D.kind === 'brawl' || !D.lethal ? 'brawl' : D.toYield ? 'yield' : 'lethal');
FL.duelP = (d, hA, hB, rule, drew) => { const R = FL.RULES[rule] || FL.RULES.yield; return 1 / (1 + Math.exp(-(d / R[0] + R[1] + R[2] * (hA - hB) + FL.DREW * (drew || 0)))); };
FL.HEALTH = FL.RULES.yield[2];
// whether a person goes into a fight empty-handed and draws their everyday weapon (the duel arms them; brawls do not)
FL.draws = (p, rule) => !!(p && p.st && p.id !== A.S.pc && !['brawl', 'spar', 'tourney'].includes(rule) && (!(p.gear || {}).weapon || p.gear.weapon === 'fists' || !GD.GEAR[p.gear.weapon]));
FL.CLAMP = [0.02, 0.98];   // as A.groupOdds

// ---- the bestiary: duel curves and the scale ----------------------------------------------------------------------
// [w50, s, w50 with a hunting party, s with a party]: the fighting worth that wins half the time against the beast, and
// the logistic width, fitted by maximum likelihood on 600 duels per beast and mode (fighters of worth 30 to 133 at health
// 45-100, the duel engine's own auto-play, a party of 8 for "with", the retags below in force), with the health term
// FL.HEALTH. null: no fighter in the sample ever won. Checked by bench/fights-audit.mjs (beasts) and test flScreenOdds.
GD.BEAST_DUEL = {
  'CRE-01': [131, 6.5, 109, 6.5], 'CRE-03': [82, 5, 57, 6.5], 'CRE-05': [null, null, 135, 3.5],
  'CRE-06': [63, 6.5, 14, 10], 'CRE-19': [129, 7.5, 102, 6.5], 'CRE-20': [118, 6, 96, 7],
  'CRE-21': [67, 6.5, 37, 6.5], 'CRE-23': [116, 5.5, 96, 6], 'CRE-25': [121, 6.5, 102, 6.5],
  'CRE-26': [61, 7, 34, 6.5], 'CRE-31': [123, 7, 100, 7], 'CRE-33': [null, null, 142, 10],
  'CRE-34': [130, 2, 128, 7.5], 'CRE-35': [75, 6.5, 50, 5.5], 'CRE-38': [65, 6.5, 38, 6],
  'CRE-43': [34, 6, 0, 6], 'CRE-44': [null, null, 135, 8], 'CRE-45': [null, null, 120, 5],
  'CRE-47': [75, 6, 43, 7], 'CRE-49': [null, null, 115, 7.5], 'CRE-51': [78, 6, 47, 6],
  'CRE-53': [119, 7.5, 100, 6.5], 'CRE-55': [121, 4, 99, 7.5], 'CRE-56': [55, 6, 35, 3],
  'CRE-24': [129, 2, 126, 7.5]
};
FL.STANDIN = { animal: 'CRE-21', great: 'CRE-25', titan: 'CRE-44', legend: 'CRE-05' };
FL.duelRow = id => GD.BEAST_DUEL[id] || GD.BEAST_DUEL[FL.STANDIN[A.beastTier ? A.beastTier(id) : 'animal'] || 'CRE-21'];
// The Roc (HP 200) and Forest Men (HP 170) sat among "animals" though the engine's own rule (HP 170 and up) makes them
// great beasts, and their duels agree (a master wins about half the time alone). Four untagged sea and tropical beasts of
// one to fifty tonnes fell back to "animal"; titans are "over a tonne".
Object.assign(GD.BEAST_TIER, { 'CRE-53': 'great', 'CRE-55': 'great', 'CRE-13': 'titan', 'CRE-14': 'titan', 'CRE-18': 'titan', 'CRE-50': 'titan' });
// The tier texts, said as the duel engine does it (test flTierClaims holds each number within 10 points).
// The release said an animal is something "one trained fighter can kill"; alone, a trained fighter wins about one fight
// in four against the animals, a veteran about half (bench/fights-audit.mjs, tiers: 22.6% and 52.6% of 500 duels).
FL.TIER_TEXT = {
  animal: 'A veteran alone wins about half the time; a trained soldier alone, about one time in four. With a hunting party at your back, a trained soldier wins nine times in ten. An untrained one can still die to it.',
  great: 'A hunting party\'s work, and even then it wants a great fighter at the front: with the hunters behind them a master wins about half the time, an elite about one time in ten. Alone, even a master usually dies.',
};
if (GD.TIER_INFO) for (const k in FL.TIER_TEXT) if (GD.TIER_INFO[k]) GD.TIER_INFO[k].who = FL.TIER_TEXT[k];

// ---- worth ----------------------------------------------------------------------------------------------------------
// the worth of a fighter object, as A.fightWorth computes it for a person
FL.fWorth = function (f) {
  if (!f) return 0;
  let v = A.CR(Object.assign({ fat: 0, burst: 0, fury: 0, hp: 100, maxHp: 100, adapt: 0, mounted: false }, f, { fat: 0, adapt: 0 }), { round: 5 });
  v += (f.wdmg || 3) * 0.9 + (f.prot || 0) * 1.1 + (f.shield || 0) * 1.4;
  return Math.max(0, v);
};
// a person's worth with a given weapon or on horseback; pure (fighterFrom may create p.styles, which is put back)
FL.worthWith = function (p, opts) {
  if (!p || !p.st) return 0;
  const ns = p.styles === void 0, f = A.fighterFrom(p, opts || {});
  if (ns) delete p.styles;
  return Math.round(FL.fWorth(f));
};
const skillOfGear = k => { const g = GD.GEAR[k]; return g ? GD.WEAPON_SKILL[g.kind] || 'unarmed' : 'unarmed'; };
// the weapon a fight spec puts in someone's hand: their own if it is of the named kind, else a plain one of that kind;
// with no kind named, their own, or the everyday weapon they would draw (A.armFor, made pure below)
FL.armsFor = function (p, spec) {
  const own = (p.gear || {}).weapon, o = {};
  if (spec && spec.weapon) { if (skillOfGear(own) !== skillOfGear(spec.weapon)) o.weapon = spec.weapon; }
  else if ((!own || own === 'fists' || !GD.GEAR[own]) && p.id !== A.S.pc && A.armFor) { const a = A.armFor(p); if (a && a.weapon) o.weapon = a.weapon; }
  if (spec && spec.mounted && (p.gear || {}).mount) o.mounted = true;
  return o;
};

// ---- the resolver -----------------------------------------------------------------------------------------------------
const logistic = z => 1 / (1 + Math.exp(-z));
const healthF = p => A.clamp((p && p.health != null ? p.health : 100) / 100, 0.3, 1);
FL.nOf = (spec, ctx) => Math.max(1, Math.round(spec.nCtx && ctx && +ctx.n ? +ctx.n : spec.n || 1));
// which beast: the event's own beast (ctx.beast, or a word such as "boar" in ctx.game), else the one the text names
FL.beastOf = function (spec, ctx) {
  if (spec.beastCtx && ctx) for (const k of ['beast', 'aBeast', 'game', 'prey']) {
    const v = ctx[k];
    if (typeof v !== 'string' || !v) continue;
    if (GD.BEAST_DUEL[v] || (A.BEASTS && A.BEASTS[v]) || /^CRE-\d+$/.test(v)) return v;
    const b = FL.beastIn(v);
    if (b) return b.id;
  }
  return spec.beast || 'CRE-21';
};
// FL.resolve(pc, spec, ctx, check): the chance that pc wins this fight, and what went into it. Pure.
FL.resolve = function (pc, spec, ctx, check) {
  ctx = ctx || {};
  const R = { scale: spec.scale, edge: 0 };
  R.wMe = FL.worthWith(pc, FL.armsFor(pc, spec));
  if (spec.edge && check && A.checkVal) {
    const v = A.checkVal(pc, { s: spec.edge, d: check.d });
    R.edge = A.clamp(Math.round((v - (check.d || 45)) * 0.2), -5, 5);
  }
  const w = R.wMe + R.edge, hf = healthF(pc);
  let p;
  if (spec.scale === 'beast') {
    const id = FL.beastOf(spec, ctx), row = FL.duelRow(id), party = (spec.allies || 0) > 0, n = FL.nOf(spec, ctx);
    R.beast = id; R.party = party; R.n = n; R.btier = A.beastTier ? A.beastTier(id) : 'animal';
    if (n > 1) {
      // a pack: each beast stands in the group resolver as a fighter of the worth that ties it one to one
      const unit = row[0] == null ? 160 : row[0];
      const mine = [{ p: null, w, S: A.strengthOf(w), C: A.bodyCap(pc) }].concat(party ? A.groupSide([{ w: GD.CROWD[2].w, sta: GD.CROWD[2].sta, n: Math.min(spec.allies, 8) }]) : []);
      p = A.groupOddsSides(mine, A.groupSide([{ w: unit, sta: 40, n }]), {});
      R.unitW = unit;
    } else {
      const w50 = party ? row[2] : row[0], s = party ? row[3] : row[1];
      p = w50 == null ? 0 : logistic((w - w50) / s + FL.HEALTH * (hf - 1));
      if (GD.BEAST_FLYER && GD.BEAST_FLYER[id] && !party && !A.canReachFlyer(pc)) p = 0;
      R.w50 = w50;
    }
  } else if (spec.scale === 'one') {
    const foe = spec.pid && ctx.pid ? A.P(ctx.pid) : null;
    const rule = spec.rule || 'yield';
    let drew = 0;
    if (foe && foe.st && foe.id !== pc.id) { R.foe = foe.id; R.wThem = FL.worthWith(foe, FL.armsFor(foe, spec)); drew = !spec.weapon && FL.draws(foe, rule) ? 1 : 0; }
    else R.wThem = (GD.CROWD[spec.tier] || GD.CROWD[2]).w;
    p = FL.duelP(w - R.wThem, hf, foe ? healthF(foe) : 1, rule, drew);
  } else {
    // a party or a crowd: you (and any allies) against n of a crowd tier, by the group resolver's tier math
    const T = GD.CROWD[spec.tier] || GD.CROWD[2], n = FL.nOf(spec, ctx), AT = GD.CROWD[spec.allyTier || 2] || GD.CROWD[2];
    const mine = [{ p: null, w, S: A.strengthOf(w), C: A.bodyCap(pc) }].concat(spec.allies ? A.groupSide([{ w: AT.w, sta: AT.sta, n: spec.allies }]) : []);
    p = A.groupOddsSides(mine, A.groupSide([{ w: T.w, sta: T.sta, n }]), { ground: spec.ground });
    R.n = n; R.wThem = T.w; R.allies = spec.allies || 0;
  }
  R.p = A.clamp(p, FL.CLAMP[0], FL.CLAMP[1]);
  R.pct = Math.round(R.p * 100);
  return R;
};
// the event being decided (A.checkOdds is called with the event at the head of the queue, as 30-get-to-know reads it)
FL.headCtx = function () { const q = A.S && A.S.queue && A.S.queue[0]; return q && q.type === 'event' ? q.ctx || {} : {}; };
const checkOdds = A.checkOdds;
A.checkOdds = function (pc, check) {
  if (check && check.fight && pc && pc.st) { try { return FL.resolve(pc, check.fight, FL.headCtx(), check).pct; } catch (e) { console.error('fight-ladder odds', e); } }
  return checkOdds.apply(this, arguments);
};

// ---- routing event fights through the resolver -------------------------------------------------------------------------
// A plain check on a fight is converted when the fight can kill or maim, or when it is a fight of the body (a combat
// skill or a body stat decides it). A fight with no roll that the ladder forbids (one person killing a great beast with
// no risk) gets a roll; its old result becomes the win. Children's scuffles with each other are left alone.
FL.CONVERTED = [];
FL.done = new WeakSet();
FL.LOSE = {
  beast: { r: 'It turns on you before the blow is home. You get clear, but not whole.', fx: { health: -22, wound: 'scar_chest', cause: 'a beast that would not die' } },
  men: { r: 'There are more of them than you can handle. You get away bloodied, with nothing.', fx: { health: -20, wound: 'deep_cut', cause: 'a fight against too many' } },
};
FL.convertChoice = function (e, i) {
  const c = e.choices[i];
  if (!c || c.group || (c.check && c.check.fight)) return false;
  const t = FL.tag(e, i);
  if (!t || !t.fight || (t.child && t.scale === 'one')) return false;
  if (t.decided === 'plain check') {
    const body = t.combatSkill || FL.BODY.includes(t.skill);
    if (!t.deadly && !body) return false;
    c.check = Object.assign({}, c.check, { fight: FL.spec(e, i, t) });
  } else if (t.decided === 'no roll' && FL.clashes(e, i, t).length) {
    const sp = FL.spec(e, i, t), L = sp.scale === 'beast' ? FL.LOSE.beast : FL.LOSE.men;
    c.win = { r: c.r, fx: c.fx };
    c.lose = { r: L.r, fx: Object.assign({}, L.fx) };
    c.check = { s: sp.weapon ? Object.keys(FL.WEAPON_OF).find(k => FL.WEAPON_OF[k] === sp.weapon) || 'melee' : 'melee', s2: 'str', d: 50, fight: sp };
    delete c.r; delete c.fx;
    t.made = true;
  } else return false;
  FL.CONVERTED.push({ id: e.id, i, scale: c.check.fight.scale, deadly: t.deadly, made: !!t.made });
  return true;
};
FL.convertEvent = function (e) {
  if (!e || typeof e !== 'object' || !Array.isArray(e.choices) || FL.done.has(e)) return 0;
  FL.done.add(e);
  let n = 0;
  for (let i = 0; i < e.choices.length; i++) { try { if (FL.convertChoice(e, i)) n++; } catch (err) { console.error('fight-ladder convert', e.id, err); } }
  return n;
};
FL.convertAll = function () { let n = 0; for (const id in A.EV) n += FL.convertEvent(A.EV[id]); return n; };
const defEvents = A.defEvents;
A.defEvents = function (list) {
  const r = defEvents.apply(this, arguments);
  try { for (const e of list || []) if (e && e.id && A.EV[e.id] === e) FL.convertEvent(e); } catch (err) { console.error('fight-ladder', err); }
  return r;
};
FL.convertAll();
if (typeof window !== 'undefined') window.addEventListener('ardan-content', () => FL.convertAll());

// ---- wounds tied to the ladder ----------------------------------------------------------------------------------------
// GD.WOUND_TIERS: a lost hand takes two tiers off whatever you fight with (the release's skill penalties covered the
// sword and the bow only: a spearman lost 3 worth). Lost fingers cost every hand weapon what they cost the sword (-5).
// A crushed knee or a limp keep their cut to speed. The cut lives in the fighter, so the duel, the worth, the chip and
// the odds all see it.
GD.WOUND_TIERS = GD.WOUND_TIERS || { lost_hand: 2 };
FL.HAND = ['sword', 'axe', 'spear', 'dagger', 'unarmed', 'lance', 'melee'];
FL.dropTiers = function (w, k) {
  const m = GD.TIERS.map(t => t.min);
  let i = 0; for (let j = 0; j < m.length; j++) if (w >= m[j]) i = j;
  if (i - k < 0) return Math.max(0, w - 11.5 * k);
  const lo = j => (j === 0 ? 30 : m[j]), hi = j => (j + 1 < m.length ? m[j + 1] : m[j] + (m[j] - m[j - 1]));
  const frac = A.clamp((w - lo(i)) / (hi(i) - lo(i)), 0, 0.999), j = i - k;
  return lo(j) + frac * (hi(j) - lo(j));
};
let inWound = false;
const fighterFrom = A.fighterFrom;
A.fighterFrom = function (p, opts) {
  const f = fighterFrom.apply(this, arguments);
  if (inWound || !p || !Array.isArray(p.wounds) || !p.wounds.length || !f || f.beast) return f;
  try {
    const has = k => p.wounds.some(x => x && x.k === k);
    if (has('lost_fingers') && FL.HAND.includes(f.skillK) && !((GD.WOUNDS.lost_fingers || {}).skillPen || {})[f.skillK]) f.skill = Math.max(0, f.skill - 5);
    const k = GD.WOUND_TIERS.lost_hand;
    if (k && has('lost_hand')) {
      const ws = p.wounds; let f0;
      inWound = true;
      try { p.wounds = ws.filter(x => !x || x.k !== 'lost_hand'); f0 = A.fighterFrom(p, opts); } finally { p.wounds = ws; inWound = false; }
      if (has('lost_fingers') && FL.HAND.includes(f0.skillK) && !((GD.WOUNDS.lost_fingers || {}).skillPen || {})[f0.skillK]) f0.skill = Math.max(0, f0.skill - 5);
      const w0 = FL.fWorth(f0), w1 = FL.fWorth(f), want = FL.dropTiers(w0, k);
      if (w1 > want) f.skill -= (w1 - want) / 0.42;
      f.oneHand = true;
    }
  } catch (e) { console.error('fight-ladder wounds', e); }
  return f;
};
// what each lasting wound costs in a fight, for the profile: worth with and without it (pure)
FL.woundCosts = function (p) {
  if (!p || !Array.isArray(p.wounds)) return [];
  const now = A.fightWorth(p), out = [];
  for (const k of [...new Set(p.wounds.map(x => x && x.k).filter(Boolean))]) {
    const W = GD.WOUNDS[k]; if (!W) continue;
    const without = A.fightWorth(Object.assign({}, p, { wounds: p.wounds.filter(x => x && x.k !== k) }));
    const st = Object.entries(W.fx || {}).filter(([, v]) => v).map(([s, v]) => `${(GD.STAT_SHORT && GD.STAT_SHORT[s]) || s} ${v > 0 ? '+' : ''}${v}`);
    if (without === now && !st.length) continue;
    out.push({ k, name: W.name, perm: !!W.perm, before: without, after: now, tb: A.tierOf(without).n, ta: A.tierOf(now).n, stats: st });
  }
  return out;
};

// ---- the everyday weapon, made pure ------------------------------------------------------------------------------------
// A.armFor picks the weapon an unarmed foe draws when a fight starts. It drew on the game's random stream, so the worth
// on a profile could not know it. It now picks from the person's id: the same weapon in every fight, and on the screen.
FL.hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const armFor = A.armFor;
if (typeof armFor === 'function') A.armFor = function (p) {
  const c0 = A.chance, k0 = A.pick;
  let h = FL.hash(p && p.id || 'x') || 1;
  const r = () => { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 4294967296; };
  A.chance = x => r() < x; A.pick = a => (a && a.length ? a[Math.floor(r() * a.length)] : undefined);
  try { return armFor.apply(this, arguments); } finally { A.chance = c0; A.pick = k0; }
};

// ---- the profile's odds: the weapon they would draw, and both fighters' health ------------------------------------------
// 24-honest-odds fitted A.shownDuelOdds on armed fighters at full health; most people carry no weapon until a fight, and
// you may be hurt. The number on a profile now reads the worth they fight with and the health you both have.
if (typeof A.shownDuelOdds === 'function') A.shownDuelOdds = function (a, b) {
  if (!a || !b) return 50;
  const d = FL.worthWith(a, FL.armsFor(a, {})) - FL.worthWith(b, FL.armsFor(b, {}));
  const drew = (FL.draws(b, 'lethal') ? 1 : 0) - (FL.draws(a, 'lethal') ? 1 : 0);
  return 100 / (1 + Math.exp(-(d / DO.scale + DO.seat + FL.HEALTH * (healthF(a) - healthF(b)) + FL.DREW * drew)));
};

// ---- the duel screen: both tiers and the chance, before the first blow -------------------------------------------------
// D.measure is set when the duel starts (engine side): the fighters as they stand, armed, at their health. The opening
// line ("an even match", "far beyond you") now reads the same chance, so the line and the number agree.
FL.duelMeasure = function (D) {
  const a = D.a, b = D.b, hfA = a.maxHp ? A.clamp(a.hp / a.maxHp, 0.3, 1) : 1;
  const m = { wA: Math.round(FL.fWorth(a)) };
  m.tA = A.tierOf(m.wA).n;
  let p;
  if (b.beast) {
    const row = FL.duelRow(b.beast), party = !!D.party, w50 = party ? row[2] : row[0], s = party ? row[3] : row[1];
    p = w50 == null ? 0 : logistic((m.wA - w50) / s + FL.HEALTH * (hfA - 1));
    m.beast = b.beast; m.party = party; m.btier = A.beastTier(b.beast); m.w50 = w50;
  } else {
    const hfB = b.maxHp ? A.clamp(b.hp / b.maxHp, 0.3, 1) : 1;
    m.wB = Math.round(FL.fWorth(b)); m.tB = A.tierOf(m.wB).n; m.weaponB = b.weapon;
    m.rule = FL.ruleOf(D); m.drew = !!D._flDrew;
    p = FL.duelP(m.wA - m.wB, hfA, hfB, m.rule, m.drew ? 1 : 0);
  }
  m.p = A.clamp(p, FL.CLAMP[0], FL.CLAMP[1]); m.pct = Math.round(m.p * 100);
  return m;
};
FL.weighLine = function (D) {
  const who = D.b.beast ? 'the beast' : D.b.short, p = D.measure.pct;
  return p < 12 ? `Your gut goes cold. ${A.cap(who)} is far beyond you. Only willpower and luck will carry you.`
    : p < 32 ? `${A.cap(who)} is stronger than you. Watch, learn, adapt — or die.`
      : p < 45 ? `${A.cap(who)} has the edge, but not by much.`
        : p <= 55 ? 'An even match. The first exchange is a coin.'
          : p < 85 ? `You have the edge over ${who}.` : `${A.cap(who)} is outmatched, and you both know it.`;
};
const startDuel = A.startDuel;
A.startDuel = function (pc, foe, opts) {
  const k = (opts && opts.kind) || 'duel', drew = !!(foe && !foe.beastId && foe.gear && !['brawl', 'spar', 'tourney'].includes(k) && (!foe.gear.weapon || foe.gear.weapon === 'fists' || !GD.GEAR[foe.gear.weapon]));
  const D = startDuel.apply(this, arguments);
  try {
    if (D && D.a && D.b && Array.isArray(D.log)) {
      if (drew) Object.defineProperty(D, '_flDrew', { value: true, enumerable: true, writable: true, configurable: true });
      const old = A.weighText(D), at = D.log.indexOf(old);
      D.measure = FL.duelMeasure(D);
      if (at >= 0) D.log[at] = FL.weighLine(D);
    }
  } catch (e) { console.error('fight-ladder duel', e); }
  return D;
};
FL.css = '.fl-measure{display:block;font-size:.82em;opacity:.8;margin-top:2px;font-weight:normal}' +
  '.fl-duel{margin:6px 0 8px;text-align:center}.fl-wounds{margin-top:4px}';
FL.style = () => { if (typeof document === 'undefined' || document.getElementById('fl-style')) return; const s = document.createElement('style'); s.id = 'fl-style'; s.textContent = FL.css; document.head.appendChild(s); };
FL.digits = () => (A.DIFF && A.DIFF.showOdds ? A.DIFF.showOdds() : true);
FL.duelBox = function (D) {
  const m = D.measure; if (!m) return '';
  const pc = A.pc(), dg = FL.digits(), num = w => (dg && w != null ? ' ' + w : '');
  let them;
  if (m.beast) {
    const I = GD.TIER_INFO[m.btier] || {};
    them = `${A.cap(A.beastShort ? A.beastShort(m.beast) : 'the beast')}: ${I.name || m.btier}${m.party ? ', and the hunters are with you' : ', and you are alone'}`;
  } else them = `${D.b.short || D.b.name}: ${m.tB}${num(m.wB)}, with ${String(m.weaponB || 'bare hands').toLowerCase()}`;
  const odds = dg ? `Fighters like you win this about ${m.pct} times in 100.` : m.pct >= 75 ? 'You should win this.' : m.pct >= 50 ? 'You have the better of it.' : m.pct >= 30 ? 'The odds are against you.' : 'You will probably lose.';
  return `<div class="fl-duel small"><b>The measure.</b> You: ${UI.esc(m.tA + num(m.wA))}. ${UI.esc(them)}. ${UI.esc(odds)}</div>`;
};
const duelModal = UI.duelModal;
UI.duelModal = function (D) {
  let h = duelModal.apply(this, arguments);
  try {
    FL.style();
    const box = FL.duelBox(D), at = h.indexOf('<div class="duellog">');
    if (box && at >= 0 && !D.over) h = h.slice(0, at) + box + h.slice(at);
    // the foe's chip reads the worth they fight with (armed), not the worth they carry about
    const foe = D.b && D.b.pid ? A.P(D.b.pid) : null, m = D.measure;
    if (foe && m && m.wB != null) {
      const chip = UI.tierChip(foe), t = A.tierOf(m.wB);
      if (h.includes(chip)) h = h.replace(chip, `<span class="chip tier ${t.k}" title="${UI.esc('Fighting worth ' + m.wB + ', armed as they are for this fight')}">${UI.icon ? UI.icon('swords', 's') : ''}${UI.esc(t.n)} · ${m.wB}</span>`);
    }
  } catch (e) { console.error('fight-ladder duel screen', e); }
  return h;
};

// ---- event choices: the measure under every fight --------------------------------------------------------------------
FL.measureText = function (pc, spec, ctx, check) {
  const R = FL.resolve(pc, spec, ctx, check), dg = FL.digits(), num = w => (dg && w != null ? ' ' + Math.round(w) : '');
  const tn = w => A.tierOf(w).n;
  let me = `you, ${tn(R.wMe)}${num(R.wMe)}`;
  if (R.edge && spec.edge) me += dg ? ` (${R.edge > 0 ? '+' : ''}${R.edge} for ${(GD.SKILLS[spec.edge] || spec.edge).toLowerCase()})` : ` (${(GD.SKILLS[spec.edge] || spec.edge).toLowerCase()} ${R.edge > 0 ? 'helps' : 'hurts'})`;
  let them;
  if (R.scale === 'beast') {
    const I = GD.TIER_INFO[R.btier] || {}, nm = A.beastShort ? A.beastShort(R.beast) : 'the beast';
    them = `${R.n > 1 ? R.n + ' of ' + nm.replace(/^the /, 'the ') : nm} (${(I.name || R.btier).toLowerCase()})${R.party ? ', with the hunters' : ', alone'}`;
  } else if (R.scale === 'one') {
    const foe = R.foe ? A.P(R.foe) : null;
    them = foe ? `${foe.given}, ${tn(R.wThem)}${num(R.wThem)}` : `one ${tn(R.wThem)}${num(R.wThem)}`;
  } else {
    const T = GD.CROWD[spec.tier] || GD.CROWD[2];
    them = `${R.n} ${T.n} (${tn(T.w)}${num(T.w)})`;
    if (R.allies) me += ` and ${R.allies} beside you`;
    if (R.scale === 'army') them = `your corner of the fight: ${them}`;
  }
  return `Measured: ${me}, against ${them}.`;
};
const eventModal = UI.eventModal;
UI.eventModal = function (q) {
  let h = eventModal.apply(this, arguments);
  try {
    const e = q && A.EV[q.ev], v = q && q.view, pc = A.pc();
    if (e && v && pc && !q.result && Array.isArray(v.choices)) {
      FL.style();
      h = h.replace(/(<button data-a="evChoose" data-v="(\d+)"><span class="grow">)([^<]*)(<\/span>)/g, (all, a, idx, label, b) => {
        const vc = v.choices[+idx], c = vc && e.choices[vc.i];
        if (!c || !c.check || !c.check.fight) return all;
        return a + label + `<small class="fl-measure">${UI.esc(FL.measureText(pc, c.check.fight, q.ctx || {}, c.check))}</small>` + b;
      });
    }
  } catch (err) { console.error('fight-ladder measure', err); }
  return h;
};

// ---- the profile: what each wound costs in a fight -------------------------------------------------------------------
const profileModal = UI.profileModal;
if (typeof profileModal === 'function') UI.profileModal = function (pc) {
  let h = profileModal.apply(this, arguments);
  try {
    const P = pc && pc.st ? pc : A.pc(), rows = FL.woundCosts(P), at = h.indexOf('<div class="group-h">Wounds & scars</div>');
    if (rows.length && at >= 0) {
      const next = h.indexOf('<div class="group-h">', at + 10), cut = next > 0 ? next : h.lastIndexOf('</div>');
      const line = rows.map(r => `${r.name}: ${r.before === r.after ? 'no cost to your fighting worth' : r.tb === r.ta ? `worth ${r.before} to ${r.after}` : `${r.tb} ${r.before} to ${r.ta} ${r.after}`}${r.stats.length ? ' (' + r.stats.join(', ') + ')' : ''}`).join('. ');
      h = h.slice(0, cut) + `<div class="small ink2 fl-wounds">In a fight: ${UI.esc(line)}.</div>` + h.slice(cut);
    }
  } catch (e) { console.error('fight-ladder profile', e); }
  return h;
};
