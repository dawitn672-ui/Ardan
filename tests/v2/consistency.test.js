import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, nextMonth, choose, sheet } from '../../src/core/engine/game.js';

test('one holder per title; the inheritance box and the tree agree (30 seeds, 10 years each)', () => {
  for (let i = 0; i < 30; i++) {
    const g = createGame({ seed: 'c' + i, estate: i % 3 === 0 ? 'commoner' : 'noble', mapSize: [260, 180] });
    for (let m = 0; m < 120; m++) {
      const r = nextMonth(g);
      for (const c of r.cards) if (c.kind === 'event') choose(g, c, 0);
      g.campaign = null;
      const holders = new Map();
      for (const p of g.world.people.all()) if (p.deathYear == null) for (const t of p.titles) { assert.ok(!holders.has(t), `seed c${i}: ${t} held twice`); holders.set(t, p.id); }
      for (const p of g.world.people.all()) if (p.deathYear != null) assert.equal(p.titles.length, 0, `seed c${i}: dead ${p.name} keeps a title`);
    }
    const s = sheet(g);
    if (g.me.heirTo && s.seat && g.me.heirTo === s.seat) assert.equal(s.place.place, 1, `seed c${i}: tree says heir, box says ${s.place.text}`);
    if (g.me.estate === 'commoner') assert.equal(s.seat, null);
    const names = g.world.people.all().filter((p) => p.house === g.me.house).map((p) => p.name);
  }
});

// v2 lane "family" (integration step 5): the game's people have no v2 genes, so the host may judge wits itself
// (judgedSimple) and give the elders' measure (ability). Without them nothing changes.
test('succession takes a host judgement of the unfit and of ability', async () => {
  const { People } = await import('../../src/family/engine/kin.js');
  const { lineOfSuccession } = await import('../../src/family/engine/succession.js');
  const P = new People();
  const mk = (id, sex, by, extra = {}) => P.add({ id, sex, birthYear: by, house: 'H', name: 'p' + id, ...extra });
  const dad = mk(1, 'male', 1050), a = mk(2, 'male', 1075, { judgedSimple: true, ability: 50 }), b = mk(3, 'male', 1078, { ability: 300 }), c = mk(4, 'female', 1080, { ability: 200 });
  for (const k of [a, b, c]) P.link(k, dad, null);
  const y = 1105;
  assert.equal(lineOfSuccession(P, dad, { law: 'male-preference', fitness: 'none' }, y).line[0].person.id, 2, 'the law is the law');
  const passed = lineOfSuccession(P, dad, { law: 'male-preference', fitness: 'unfit-passed-over' }, y);
  assert.equal(passed.line[0].person.id, 3);
  assert.equal(passed.skipped[0].why, 'judged simple by the house council');
  assert.equal(lineOfSuccession(P, dad, { law: 'elective', fitness: 'none' }, y).line[0].person.id, 3, 'the elders choose the ablest');
});
