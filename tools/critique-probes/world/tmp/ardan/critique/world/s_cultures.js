const C = LORE.cultures, R = LORE.realms;
const out = { cultures: {}, realms: {}, naming: GD.NAMING, realmCulture: GD.REALM_CULTURE, realmHumanCulture: GD.REALM_HUMAN_CULTURE, raceCulture: GD.RACE_CULTURE, tradeNames: GD.TRADE_NAMES, windTribes: GD.WIND_TRIBES, giantHalls: GD.GIANT_HALLS, skin: GD.SKIN, hair: GD.HAIR, hairNames: GD.HAIR_NAMES, eyes: GD.EYES, eyeNames: GD.EYE_NAMES, races: GD.RACE_LIST };
for (const [k, c] of Object.entries(C)) out.cultures[k] = c;
for (const [k, r] of Object.entries(R)) out.realms[k] = r;
out.gdAll = Object.keys(GD);
return out;
