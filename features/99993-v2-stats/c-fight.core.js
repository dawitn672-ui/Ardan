// v2 stats, part 3: every fight's strength is A.V2.body.fightingWorth, in levies (1 = an untrained spearman in a
// padded coat). Races differ as bodies do (square-cube giants, orcs about 2.2x a man's lift), and a human reaches a
// giant only through skill tiers and breakthroughs (V2_SPEC complaint 12).
//
// The game's fights are all calibrated on its own worth scale (A.fightWorth: the duel engine's rating A.CR, the beasts'
// w50 rows, GD.CROWD's tiers, 24-honest-odds' duel curve). So the levies are put on that scale, by one curve fitted on
// the game's people (VS.W_A + VS.W_B x ln levies), and the fighter object A.fighterFrom builds gets exactly that worth:
// its skill is moved until FL.fWorth (= A.fightWorth) reads it, as 48-fight-ladder does for a lost hand. So the worth a
// view shows, the odds a fight check rolls and the duel engine's own rounds all follow the v2 body.
const VS = A.V2S, B = A.V2.body;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// fitted on the start of seed 77-80 worlds: 1,187 humans 16 and over, r = 0.83 between ln levies and the old worth; the
// other races are left to the body (a median giant reads 14 levies, 75 on the old scale, where the release had 37)
VS.W_A = 40.6; VS.W_B = 13.0;
// what the gear adds, as v2's GEAR multipliers (none 1, levy 1.25, mail 1.6, plate 2.0), from the game's slots
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
// v2 fighting worth in levies, for a person (and the fighter the game built for them, if any)
VS.levies = function (p, f) {
  const v = VS.view(p);
  if (!v) return 0;
  // the weapon skill the fighter carries (skill + a third of melee + perks, as the game counts it) as hours practised
  const sk = f && f.skill != null ? f.skill : Math.max(A.skill(p, 'sword'), A.skill(p, 'axe'), A.skill(p, 'spear'), A.skill(p, 'unarmed'));
  const vv = Object.assign({}, v, { body: Object.assign({}, v.body, { skills: { fight: VS.hoursOf(sk) } }) });
  return B.fightingWorth(vv, 'fight', 'none').worth * VS.gearMult(f, p);
};
VS.toWorth = lv => Math.max(0, VS.W_A + VS.W_B * Math.log(Math.max(1e-3, lv)));
VS.fromWorth = w => Math.exp((w - VS.W_A) / VS.W_B);
VS.worth = (p, f) => VS.toWorth(VS.levies(p, f));

// the fighter object carries the v2 worth (people only; beasts keep their rows)
VS.fwOff = false;
const fighterFrom = A.fighterFrom;
const fWorth = f => (A.FL && A.FL.fWorth ? A.FL.fWorth(f) : 0);
A.fighterFrom = function (p, opts) {
  const f = fighterFrom.apply(this, arguments);
  if (VS.fwOff || !f || f.beast || !p || !p.st || !A.FL || !A.FL.fWorth) return f;
  try {
    const want = VS.worth(p, f), now = fWorth(f);
    if (isFinite(want) && isFinite(now)) { f.skill += (want - now) / 0.42; f.v2Levies = VS.levies(p, f); }
  } catch (e) { console.error('v2 worth', e); }
  return f;
};
// the fighter the game builds before the v2 worth is put in (pure: fighterFrom may create p.styles, which is put back)
VS.rawFighter = function (p, opts) {
  const ns = p.styles === void 0;
  VS.fwOff = true;
  try { return A.fighterFrom(p, opts || {}); } finally { VS.fwOff = false; if (ns) delete p.styles; }
};
VS.leviesOf = p => (p && p.st ? VS.levies(p, VS.rawFighter(p)) : 0);
// the old worth, for tests and the fit (never shown)
VS.oldWorth = function (p) { VS.fwOff = true; try { return A.fightWorth(p); } finally { VS.fwOff = false; } };
