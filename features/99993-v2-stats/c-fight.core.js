// v2 stats, part 3: fighting worth in levies, and races that differ as bodies do (V2_SPEC complaint 12).
//
// A.V2.body.fightingWorth measures a fighter in levies (1 = an untrained spearman in a padded coat): body
// (might^0.5 x speed^0.5 x toughness^0.6) x skill tier x gear. The game's fights are all calibrated on its own worth
// scale (A.fightWorth: the duel engine's rating A.CR, the beasts' w50 rows, GD.CROWD's tiers, 24-honest-odds' duel curve,
// 48-fight-ladder's tiers and lost hand), and for a human that worth already moves with the same things: strength,
// speed, stamina (now derived from the v2 body), the weapon skill and the gear.
//
// What the old worth lacked is the body itself: a giant was worth 37 like a man. So each fighter gets the v2 difference
// of its body from a human body in the same place among its own kind:
//   shift = W_B x ln(fightingWorth(this body) / fightingWorth(a human body of the same percentiles, skill and gear))
// on the game's scale (VS.W_B = 13 points for each e-fold in levies). A human's shift is 0, so every calibrated human
// fight is as before; a giant's is about +40, an orc's +11, a dwarf's +6, an elf's -3. The fighter A.fighterFrom builds
// carries it in its skill (as 48 does for a lost hand), so A.fightWorth, every fight check and the duel engine's own
// rounds read the same worth. The worth is shown in levies: VS.fromWorth (40.6 + 13 x ln levies, fitted on 1,187 humans
// at the start of seed 77-80 worlds, r = 0.83 between ln levies and the old worth).
const VS = A.V2S, B = A.V2.body, RC = A.V2.races;

VS.W_A = 40.6; VS.W_B = 13.0;
VS.toWorth = lv => Math.max(0, VS.W_A + VS.W_B * Math.log(Math.max(1e-3, lv)));
VS.fromWorth = w => Math.exp((w - VS.W_A) / VS.W_B);

// the body part of v2's fighting worth, read from a view (no skill, no gear: those are the same for both bodies)
const bodyWorth = v => B.fightingWorth(Object.assign({}, v, { body: Object.assign({}, v.body, { skills: {} }) }), 'none', 'none').worth;
// the same person in a human body: same percentiles (the view's conditioning), same sex, the same stage of life
VS.humanTwin = function (v) {
  const H = RC.RACES[VS.raceKey('human')], R = RC.RACES[v.race];
  const age = Math.min(28, (v.age / R.ageScale) * H.ageScale);
  return Object.assign({}, v, { race: VS.raceKey('human'), age, genes: Object.assign({}, v.genes) });
};
VS.raceShift = function (p) {
  if (!p || !p.st || p.race === 'human') return 0;
  const v = VS.view(p);
  if (!v) return 0;
  const mine = bodyWorth(v), twin = bodyWorth(VS.humanTwin(v));
  return mine > 0 && twin > 0 ? VS.W_B * Math.log(mine / twin) : 0;
};

// the fighter object carries the shift (people only; beasts keep their rows)
VS.fwOff = false;
const fighterFrom = A.fighterFrom;
A.fighterFrom = function (p, opts) {
  const f = fighterFrom.apply(this, arguments);
  if (VS.fwOff || !f || f.beast || !p || !p.st) return f;
  try {
    const sh = VS.raceShift(p);
    if (sh && isFinite(sh)) { f.skill += sh / 0.42; f.v2Shift = sh; }
  } catch (e) { console.error('v2 worth', e); }
  return f;
};
// The duel engine already makes some races fight above or below the worth A.CR reads: a giant has 3.2 times a man's
// blood, an orc 1.12 and a dwarf 1.1, and races carry mass, reach and an opening burst that the worth (read at round 5,
// at full blood) never sees. Measured on 6,300 duels against humans with no v2 shift (the duel engine's auto-play,
// fighters of tiers 1-5 and every ninth raised, the player's seat at health 40-100, a third of foes drawing a weapon;
// maximum likelihood on FL.duelP's curve), that edge is, in worth points: giant +40.5, orc +14.5, elf -2, dwarf -6.5;
// refit with the shift in place (the engine does not take skill and blood one for one), orc +16.5, elf -2.5, dwarf -10.5.
// Playtest 2 (new 7): with the v2 shift on top, a giant fought as about +80, an orc +25, and the duel screen said 37 in
// 100 where giants won 86 (orcs 55 and 73; a dwarf 55 and 47). So in a duel each fighter's skill gives back the edge
// the engine adds of itself (f.engineEdge, which 48's FL.fWorth counts), and every race fights at the worth it shows:
// the v2 difference of its body. Outside a duel (A.fightWorth, its parts, the group resolver) nothing changes.
// Half-races (no realm to measure in) take half of the parent people's edge.
VS.ENGINE_EDGE = { human: 0, giant: 40.5, orc: 16.5, elf: -2.5, dwarf: -10.5, halforc: 8, halfelf: -1 };
VS.engineEdge = f => (f && !f.beast && f.race && !VS.fwOff ? VS.ENGINE_EDGE[f.race] || 0 : 0);
VS.evenDuel = function (D) {
  for (const f of [D && D.a, D && D.b]) {
    const e0 = VS.engineEdge(f);
    if (!e0 || f.engineEdge != null) continue;
    f.skill -= e0 / 0.42; f.engineEdge = e0;
  }
};
const startDuel = A.startDuel;
A.startDuel = function () {
  const D = startDuel.apply(this, arguments);
  try { if (D && D.a && D.b) VS.evenDuel(D); } catch (e) { console.error('v2 duel', e); }
  return D;
};
// worth in levies, as the fights read it
VS.leviesOf = p => (p && p.st ? VS.fromWorth(A.fightWorth(p)) : 0);
// the old worth, for tests (never shown)
VS.oldWorth = function (p) { VS.fwOff = true; try { return A.fightWorth(p); } finally { VS.fwOff = false; } };
// v2's own worth of the body view with the fighter's skill and gear (for tests)
VS.ARMOR = { padded: 0.13, leather: 0.13, hide: 0.13, mail: 0.48, dwarfmail: 0.5, brigandine: 0.42, scale: 0.45, lamellar: 0.45, mailplate: 0.7, plate: 0.88, dwarfplate: 0.9 };
VS.gearMult = function (f, p) {
  const g = (p && p.gear) || {};
  let m = 1;
  if (f && f.wkind && f.wkind !== 'fists') m += 0.12;
  m += VS.ARMOR[g.armor] || 0;
  if (f && f.shield) m += 0.05;
  if (g.helm) m += 0.04;
  return m;
};
VS.v2Levies = function (p) {
  const v = VS.view(p);
  if (!v) return 0;
  const ns = p.styles === void 0;
  let f; VS.fwOff = true;
  try { f = A.fighterFrom(p, {}); } finally { VS.fwOff = false; if (ns) delete p.styles; }
  const vv = Object.assign({}, v, { body: Object.assign({}, v.body, { skills: { fight: VS.hoursOf(f.skill) } }) });
  return B.fightingWorth(vv, 'fight', 'none').worth * VS.gearMult(f, p);
};

// the levies a player sees: v2's own scale (a human Master is about a giant's 15-25 only with breakthroughs and order
// gear), with the race shift already in the body view. Playtest round 1: the game's worth scale put a general at 285.
// v2's levies rank people a little differently from the release's worth (r = 0.78), so the worth's tier name is never
// put beside them (playtest 2, old 17: "Elite · about one and a half levies"): the chip says the levies alone, the sheet
// says them with VS.levyRank, read from the same levies, and the duel and wound lines say the worth's tiers alone.
VS.shownLevies = p => (p && p.st ? VS.v2Levies(p) : 0);
