// M1 (order 71, D-151): tools/lint-lore-map.mjs's rules (tools/lib/lore-map.mjs): what a sentence claims about a realm's
// ground, and whether the map's facts bear it out. On a small world made here, then on the one map's own facts.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { realmMatcher, claimsIn, judge, check } from '../../tools/lib/lore-map.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LORE = { realms: {
  'POL-01': { name: 'Empire of Aldmark', short: 'Aldmark' },
  'POL-10': { name: 'Kingdom of Irondeep', short: 'Irondeep' },
  'POL-04': { name: 'Republic of Lucerna', short: 'Lucerna' },
  'POL-26': { name: 'Kingdom of Drevna', short: 'Drevna' },
} };
const R = (o) => Object.assign({ provinces: 4, coastal: 0, capital: { coast: false, river: false, stream: false, lake: false }, compass: { u: 0.5, v: 0.5 }, seas: {}, lakes: {}, terr: {}, high: 0, rivers: [], ranges: [], forests: [], neighbours: [] }, o);
const F = {
  realms: {
    'POL-01': R({ short: 'Aldmark', terr: { plains: 3, forest: 1 }, compass: { u: 0.4, v: 0.2 }, coastal: 1, seas: { 'the Middle Sea': 1 }, neighbours: ['POL-10'] }),
    'POL-10': R({ short: 'Irondeep', terr: { mountains: 3, hills: 1 }, high: 0.7, compass: { u: 0.5, v: 0.3 }, neighbours: ['POL-01'] }),
    'POL-04': R({ short: 'Lucerna', terr: { plains: 4 }, compass: { u: 0.5, v: 0.6 } }),
    'POL-26': R({ short: 'Drevna', terr: { forest: 4 }, compass: { u: 0.8, v: 0.3 }, lakes: { 'lake 3': 2 } }),
  },
  waters: [{ name: 'the Middle Sea', kind: 'inland sea', realms: ['POL-01'] }],
  rivers: [],
};
const M = realmMatcher(LORE);
const bad = (text, owner, codex = true) => check(text, owner, M, F, { codex }).filter(c => c.why).map(c => `${c.realm} ${c.kind}`);

test('a realm\'s own text: its ground, its sea, its place on the compass', () => {
  assert.deepEqual(bad('The iron-ringed empire of the northern plains, with a fleet on the Middle Sea.', 'POL-01'), []);
  assert.deepEqual(bad('A lagoon republic that feeds the Middle Sea.', 'POL-04'), ['POL-04 coast', 'POL-04 sea']);
  assert.deepEqual(bad('The Lakeland: furs, beeswax and the Crown Lakes.', 'POL-26'), []);
  assert.deepEqual(bad('The southern plains are his.', 'POL-01'), ['POL-01 compass']);
});

test('a word another realm\'s name owns is that realm\'s claim', () => {
  // "beside Aldmark's plains": the plains are Aldmark's, and Irondeep borders it
  assert.deepEqual(bad('The dwarven hold beside Aldmark\'s plains, in the mountains.', 'POL-10'), []);
  const cs = claimsIn('The dwarven hold beside Aldmark\'s plains.', 'POL-10', M, { codex: true });
  assert.ok(cs.some(c => c.kind === 'plains' && c.realm === 'POL-01'));
  assert.ok(cs.some(c => c.kind === 'border' && c.realm === 'POL-10' && c.arg === 'POL-01'));
  // a border the map has not
  assert.deepEqual(bad('Lucerna keeps a march on the Drevna border.', null), ['POL-04 border']);
});

test('which way a road runs is no claim; where a land lies is', () => {
  assert.deepEqual(bad('Aldmark sends its amber south by the Horse Road.', null), []);
  assert.deepEqual(bad('Drevna, the eastern lake country, with its forests.', null), []);
  assert.deepEqual(bad('Aldmark lies north of Lucerna.', null), []);
  assert.deepEqual(bad('Lucerna lies north of Aldmark.', null), ['POL-04 compass of']);
});

test('small named waters: a bay needs a coast, a lake a lake; a sea the map must have', () => {
  assert.deepEqual(bad('The galleys of Aldmark winter in Cold Bay.', null), []);
  assert.deepEqual(bad('Irondeep\'s barges cross Cold Bay.', null), ['POL-10 sea']);
  assert.deepEqual(bad('Drevna fishes Lake Radov.', null), []);
  assert.deepEqual(bad('Aldmark trades on the Salt Sea.', null), ['POL-01 sea']);
});

test('the open sea is reached from any coast; an enclosed sea only from its shores', () => {
  const F2 = JSON.parse(JSON.stringify(F));
  F2.waters.push({ name: 'the Strait of Hael', kind: 'strait', realms: [] });
  F2.realms['POL-01'].seas = { 'the Northern Ocean': 2 };       // Aldmark has a sea coast
  F2.realms['POL-04'].lakes = { 'the Middle Sea': 1 }; F2.realms['POL-04'].coastal = 1;   // Lucerna only the inland sea
  const b2 = (t, o) => check(t, o, M, F2, { codex: true }).filter(c => c.why).map(c => `${c.realm} ${c.kind}`);
  assert.deepEqual(b2('Its galleys pass the Strait of Hael.', 'POL-01'), []);
  assert.deepEqual(b2('Its galleys pass the Strait of Hael.', 'POL-04'), ['POL-04 sea']);
});

test('outside the Codex a land word may be the land beside the realm; the compass is the Codex\'s', () => {
  const F3 = JSON.parse(JSON.stringify(F));
  F3.realms['POL-04'].near = { terr: { mountains: 2 }, lake: false, high: true };    // hills just over Lucerna's border
  const b3 = (t, o, codex) => check(t, o, M, F3, { codex }).filter(c => c.why).map(c => `${c.realm} ${c.kind}`);
  assert.deepEqual(b3('The Warden of the Highlands keeps the march.', 'POL-04', false), []);
  assert.deepEqual(b3('A realm of highlands and peaks.', 'POL-04', true), ['POL-04 mountain']);
  assert.deepEqual(b3('The southern plains lords rode at the Millrun.', 'POL-01', false), []);
});

test('judge reads the facts it is given', () => {
  assert.equal(judge({ realm: 'POL-10', kind: 'mountain' }, F), null);
  assert.match(judge({ realm: 'POL-04', kind: 'mountain' }, F) || '', /little high ground/);
  assert.match(judge({ realm: 'POL-04', kind: 'lake' }, F) || '', /no lake/);
});

// on the one map's facts: the lint reads them, and the claims it makes of the lore are about the realms the lore names
test('the one map\'s facts are whole, and the Codex\'s words are read against them', () => {
  const D = JSON.parse(fs.readFileSync(path.join(root, 'data/map/one-continent.json'), 'utf8'));
  const L = JSON.parse(fs.readFileSync(path.join(root, 'src/core/release/core/00-lore.json'), 'utf8'));
  assert.ok(D.facts && Object.keys(D.facts.realms).length === Object.keys(L.realms).length, 'a fact sheet for every realm');
  for (const id of Object.keys(L.realms)) {
    const r = D.facts.realms[id];
    assert.ok(r.capital && r.compass && r.terr && Array.isArray(r.neighbours) && Array.isArray(r.towns), id + ' whole');
  }
  const ML = realmMatcher(L);
  // Northreach's intro: longships (coast) and its north; the claims are made and judged, whatever the map says
  const cs = check(L.realms['POL-08'].primer.intro, 'POL-08', ML, D.facts);
  assert.ok(cs.some(c => c.kind === 'coast'), 'Northreach\'s longships read as a coast');
});
