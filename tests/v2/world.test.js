import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../src/v2/rng.js';
import { generateContinent, components } from '../../src/v2/map/continent.js';
import { makeRealms, buildHierarchy, CAPS } from '../../src/v2/nobility.js';
import { makeUnit, makeArmy, startBattle, battlePhase, afterAction, rumourOfBattle } from '../../src/v2/war.js';
import { makeDiplomacy, monthTick, setFactor } from '../../src/v2/diplomacy.js';
import { createGame, nextMonth, choose, sheet } from '../../src/v2/game.js';
import * as game from '../../src/v2/game.js';
import { stats } from '../../src/v2/body.js';

const maps = ['ardan', 'tamar', 'velgrad', 'hesh'].map((seed) => generateContinent({ seed, width: 400, height: 280, provinces: 70 }));

test('one continent: every seed gives a single connected landmass (islands only tiny)', () => {
  for (const m of maps) {
    const c = components(m.elev, m.W, m.H);
    const land = c.list.reduce((s, x) => s + x.size, 0);
    const main = c.list.find((x) => x.id === c.largest).size;
    assert.ok(main / land > 0.985, `${m.seed}: main ${main / land}`);
    for (const x of c.list) if (x.id !== c.largest) assert.ok(x.size < m.W * m.H * 0.0013, 'no second big landmass');
  }
});

test('no land touches the map frame (it is a continent, not a crop)', () => {
  for (const m of maps) {
    let edge = 0;
    for (let x = 0; x < m.W; x++) edge += (m.elev[x] > 0) + (m.elev[(m.H - 1) * m.W + x] > 0);
    for (let y = 0; y < m.H; y++) edge += (m.elev[y * m.W] > 0) + (m.elev[y * m.W + m.W - 1] > 0);
    assert.equal(edge, 0, `${m.seed} edge cells ${edge}`);
  }
});

test('noble pyramid: caps hold and the counts look like a real realm', () => {
  const m = generateContinent({ seed: 'ardan' });
  const { realms } = makeRealms(m, makeRng('r'), 8);
  let biggest = null;
  for (const r of realms) {
    const h = buildHierarchy(r, m, 'ardan');
    assert.ok(h.summary.dukes <= CAPS.duke && h.summary.marquises <= CAPS.marquis);
    assert.ok(h.summary.counts >= r.provinces.length * 0.9);
    assert.ok(h.summary.viscounts >= h.summary.counts * 2 && h.summary.barons >= h.summary.viscounts * 2 && h.summary.lords >= h.summary.barons * 3);
    if (!biggest || r.provinces.length > biggest.r.provinces.length) biggest = { r, h };
  }
  const s = biggest.h.summary;
  assert.ok(s.dukes >= 1 && s.counts + s.viscounts + s.barons + s.lords > 200, `largest realm nobles: ${JSON.stringify(s)}`);
});

test('elite orders fight like forces tens of times their size', () => {
  const run = (eliteN, levyN, seed) => {
    const rng = makeRng(seed);
    const A = makeArmy('Order', 0, [makeUnit(1, 'Order knights', 'order', eliteN, 20, { terror: 0.4, morale: 0.95 })]);
    const B = makeArmy('Levies', 1, [makeUnit(2, 'Levy', 'levy', levyN, 1.0)]);
    const camp = { armies: [A, B], battle: startBattle({}, 'open') };
    while (!camp.battle.over) battlePhase(rng, camp, { armyTactic: ['advance', 'advance'] });
    return camp.battle.winner === 0;
  };
  let w3k = 0, w12k = 0;
  for (let i = 0; i < 40; i++) { w3k += run(250, 3000, i); w12k += run(250, 12000, 100 + i); }
  assert.ok(w3k >= 30, `250 elites vs 3,000 levies won ${w3k}/40`);
  assert.ok(w12k <= 30, `but 12,000 levies can drown them (${w12k}/40 elite wins)`);
});

test('player choices move battle results at every rank', () => {
  const ranks = { soldier: ['back', 'push'], sergeant: ['tight', 'gap'], captain: ['hide', 'rally'], commander: ['hold-res', 'reserve'] };
  for (const [rank, [lo, hi]] of Object.entries(ranks)) {
    let wl = 0, wh = 0;
    for (let i = 0; i < 160; i++) {
      for (const [choice, inc] of [[lo, () => wl++], [hi, () => wh++]]) {
        const rng = makeRng(`${rank}:${i}`);
        const A = makeArmy('A', 0, [makeUnit(1, 'Levy', 'levy', 3000, 1), makeUnit(2, 'MaA', 'maa', 600, 2.5)]);
        const B = makeArmy('B', 1, [makeUnit(3, 'Levy', 'levy', 3100, 1), makeUnit(4, 'MaA', 'maa', 620, 2.5)]);
        const camp = { armies: [A, B], battle: startBattle({}, 'open') };
        while (!camp.battle.over) battlePhase(rng, camp, { armyTactic: ['advance', 'advance'], player: { rank, choice, person: { worth: rank === 'soldier' ? 2.5 : 6, judgment: 105, will: 110 } } });
        if (camp.battle.winner === 0) inc();
      }
    }
    assert.ok(wh > wl, `${rank}: ${lo}=${wl} ${hi}=${wh}`);
    if (rank !== 'soldier') assert.ok((wh - wl) / 160 >= 0.04, `${rank} effect ${(wh - wl) / 160}`);
  }
});

test('after-action report names causes; outsiders only get rumours', () => {
  const rng = makeRng(3);
  const A = makeArmy('A', 0, [makeUnit(1, 'Levy', 'levy', 2000, 1)]), B = makeArmy('B', 1, [makeUnit(2, 'Levy', 'levy', 1500, 1)]);
  const camp = { armies: [A, B], battle: startBattle({}, 'ford') };
  while (!camp.battle.over) battlePhase(rng, camp, {});
  const r = afterAction(camp); assert.ok(r.causes.length >= 1 && r.headline);
  const rum = rumourOfBattle(rng, camp); assert.match(rum, /pedlar|swears/i); assert.ok(!/Losses|units|morale/.test(rum));
});

test('diplomacy is alive: alliances form and break, wars start and end over a century', () => {
  const m = maps[0]; const { realms, realmOf } = makeRealms(m, makeRng('dd'), 7);
  const d = makeDiplomacy(realms, makeRng('d2')); const world = { realms, map: m, realmOf };
  for (let i = 0; i < realms.length; i++) for (let j = i + 1; j < realms.length; j++) if ((i + j) % 3 === 0) setFactor(d, i, j, 'claim', -30, { text: 'old claim' });
  const rng = makeRng('dip'); const kinds = {};
  for (let y = 0; y < 100; y++) for (let mo = 1; mo <= 12; mo++) for (const e of monthTick(d, world, rng, 1105 + y, mo)) kinds[e.kind] = (kinds[e.kind] ?? 0) + 1;
  for (const k of ['alliance', 'alliance-broken', 'war', 'peace', 'marriage']) assert.ok(kinds[k] > 0, `${k}: ${JSON.stringify(kinds)}`);
});

test('the game: one button, monthly cards, no play button, no forced chapters, no default piety', () => {
  assert.equal(typeof game.play, 'undefined'); assert.equal(typeof game.simWeek, 'undefined');
  const g = createGame({ seed: 'ardan', estate: 'noble', mapSize: [400, 280] });
  assert.equal(g.me.faith, undefined, 'piety is not a stat everyone carries');
  const h0 = stats(g.me).height; let cards = 0, maxCards = 0;
  for (let m = 0; m < 12 * 20; m++) {
    const r = nextMonth(g); cards += r.cards.length; maxCards = Math.max(maxCards, r.cards.length);
    for (const c of r.cards) if (c.kind === 'event') choose(g, c, Math.floor(g.rng.next() * c.choices.length));
    if (g.campaign) g.campaign = null; // war is tested separately
  }
  assert.ok(stats(g.me).height > h0 * 2.5, `grew from ${h0} to ${stats(g.me).height}`);
  assert.ok(maxCards >= 2, 'some months are busier than others');
  const s = sheet(g); assert.ok(s.kin.length >= 5 && s.place?.text);
  assert.ok(!g.chronicle.some((c) => /chapter/i.test(c.text)));
});
