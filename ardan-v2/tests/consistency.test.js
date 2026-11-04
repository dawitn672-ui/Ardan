import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, nextMonth, choose, sheet } from '../src/game.js';

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
