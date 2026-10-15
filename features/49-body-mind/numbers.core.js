// Cut dead numbers (Road to Ten, Character 7). bench/dead-numbers.mjs counts, for each stat and skill, the outcomes it
// changes in a bot life. Nine skills that a typical life almost never meets are merged into the skill of their family,
// for the player: reading one reads the family's number, training one trains it, the sheet shows one row, and an old
// save's points are folded in (the higher of the two). NPCs keep their separate numbers, so the war layer and the
// duels of other people are as they were.
//   dagger, dual wield -> Blades (sword)            crossbow, throwing -> Bows and throwing (bow)
//   lance, mounted combat -> Riding and the lance  siegecraft -> Tactics and siegecraft
//   logistics -> Stewardship and supply            deception -> Intrigue and deceit
// See README for the table before and after, and for the numbers still under the line.
(function () {
  const BM = A.BM = A.BM || {};
  const isPC = p => p && A.S && p.id === A.S.pc;
  BM.MERGE = { dagger: 'sword', dualwield: 'sword', xbow: 'bow', throwing: 'bow', lance: 'riding', mounted: 'riding', siegecraft: 'tactics', logistics: 'stewardship', deception: 'intrigue' };
  BM.MERGED_NAME = { sword: 'Blades', bow: 'Bows & throwing', riding: 'Riding & the lance', tactics: 'Tactics & siegecraft', stewardship: 'Stewardship & supply', intrigue: 'Intrigue & deceit' };
  BM.MERGED_DESC = {
    sword: 'Swords, knives, a blade in each hand. Cuts, thrusts, binds.',
    bow: 'Bow, crossbow, javelin and sling: anything you loose at a distance.',
    riding: 'The saddle: long journeys, fighting mounted, the couched lance.',
    tactics: 'Formations, ground, timing; walls, mines and engines.',
    stewardship: 'Estates, accounts and stores; feeding an army on the march.',
    intrigue: 'Plots, spies and secrets, and the lies that carry them.',
  };
  for (const k in BM.MERGED_NAME) { GD.SKILLS[k] = BM.MERGED_NAME[k]; if (GD.SKILL_DESC) GD.SKILL_DESC[k] = BM.MERGED_DESC[k]; }
  BM.canon = k => BM.MERGE[k] || k;
  // reading and training a merged skill is reading and training its family's (for the player)
  const skill = A.skill;
  A.skill = function (p, k) { return isPC(p) && BM.MERGE[k] ? skill.call(this, p, BM.MERGE[k]) : skill.apply(this, arguments); };
  const train = A.trainSkill;
  A.trainSkill = function (p, k, amt) { return isPC(p) && BM.MERGE[k] ? train.call(this, p, BM.MERGE[k], amt) : train.apply(this, arguments); };
  // an old save, a new life: fold a merged skill's points and talent into the family's
  BM.fold = function (p) {
    if (!p || !p.skills) return;
    for (const a in BM.MERGE) {
      const c = BM.MERGE[a];
      if ((p.skills[a] || 0) > (p.skills[c] || 0)) p.skills[c] = p.skills[a];
      if (p.apt && (p.apt[a] || 1) > (p.apt[c] || 1)) p.apt[c] = p.apt[a];
    }
  };
  const ng = A.newGame;
  A.newGame = function () { const r = ng.apply(this, arguments); try { BM.fold(A.pc()); } catch (e) { console.error('fold', e); } return r; };
  const de = A.deserialize;
  A.deserialize = function () { const r = de.apply(this, arguments); try { BM.fold(A.pc()); } catch (e) { console.error('fold', e); } return r; };
  // the player's sheet and training picker show one row per family
  if (typeof A.trainTargets === 'function') {
    const tt = A.trainTargets;
    A.trainTargets = function (p) { const L = tt.apply(this, arguments); return isPC(p) && Array.isArray(L) ? L.filter(x => !BM.MERGE[x.k]) : L; };
  }
  const prof = UI.profBlock;
  UI.profBlock = function (p) {
    if (!isPC(p)) return prof.apply(this, arguments);
    const cats = GD.SKILL_CATS, slim = {};
    for (const c in cats) slim[c] = cats[c].filter(k => !BM.MERGE[k]);
    GD.SKILL_CATS = slim;
    try { return prof.apply(this, arguments); } finally { GD.SKILL_CATS = cats; }
  };
})();
