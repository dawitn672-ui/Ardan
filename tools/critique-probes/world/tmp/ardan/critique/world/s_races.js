const o = {};
for (const [k, r] of Object.entries(GD.RACES)) o[k] = { adult: r.adult, life: r.life, maxAge: r.maxAge, fertile: r.fertile || r.fert, keys: Object.keys(r).join(',') };
o.raceCulture = Object.fromEntries(Object.entries(GD.RACE_CULTURE).map(([k, f]) => [k, String(f).slice(0, 300)]));
return o;
