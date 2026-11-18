// Retired by W1-6 (D-098): 20-ai-personality's A.aiFactionAnswer and A.aiRevolt, as they were at 67bca05
// (src/diplomacy/20-ai-personality/persona.core.js). Replaced by A.PEACE.crownAnswer and A.PEACE.theirAnswer
// (src/nobility/9999954-realm-peace/b-factions.core.js). Never built.
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
  const P = A.personPersona(head), p = clamp(.95 * Math.exp(A.AI_TUNE.claimK * P.warLog + .4 * P.pride - .4 * P.caution), .1, 1), yes = A.chance(p), s = yes ? 1 : -1, F = (A.FACTIONS || {})[f.kind] || {};
  const why = traitWhy(P, 'war', A.AI_TUNE.claimK * s).concat(traitWhy(P, 'pride', .4 * s), traitWhy(P, 'caution', -.4 * s));
  why.push([`The crown refused: ${F.demand || 'their demand'}`, s * .4]);
  const name = A.fullName(head, false);
  A.aiLogAdd(yes ? 'revolt' : 'backdown', r.id, null, yes ? `raises the banners of revolt against the crown of ${short(r.id)}.` : `backs down rather than rise against the crown of ${short(r.id)}; the faction breaks up.`, why, `${F.name || 'faction'} leader ${name}`);
  if (!yes) A.S.factions = (A.S.factions || []).filter(x => x !== f);
  return yes;
};
