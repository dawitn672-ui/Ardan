A.newGame({ seed: 11, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 0 });
UI.screen = 'game'; UI.tab = 'life'; UI.render();
const pc = A.pc();
const S = A.S;
const realms = Object.values(S.realms).map(r => ({ id: r.id, name: r.name, short: r.short, title: r.title, race: r.race, cult: r.cult, ruler: r.ruler, alive: r.alive !== false, dead: r.dead }));
const keys = Object.keys(pc);
const sample = {};
for (const k of keys) { const v = pc[k]; sample[k] = typeof v === 'object' ? JSON.stringify(v).slice(0, 300) : v; }
return { year: S.year, nPeople: Object.keys(S.people).length, realms, keys, sample, sKeys: Object.keys(S) };
