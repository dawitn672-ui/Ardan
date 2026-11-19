// M1 (owner order 68, D-142 point 2): choose the one continent's map seed by measured quality. Each candidate map seed is
// built in the page (A.V2MAP.build, the very code a life plays on) and read on seven counts, each 0 to 100:
//   lore       realm heartlands that fit the lore: each realm's words in the Codex (a sea realm on the coast, mountain folk
//              high, steppe and plains realms on open grass, the dry realms on dry land, the forest realms in wood, the
//              north, south, east and west the primers name, Tamar's river, Drevna's lakes, Irondeep beside Aldmark, Abara
//              beside Tamar), read from the built provinces (LOREFIT below; each word 0 to 1, a realm the mean of its words)
//   roads      roads that read as roads (D9-2's legibility): the share of road length that does NOT run along a border.
//              The D9-2 readings (69, 75, 73 of 100) were blind playtests of crops, not a number a seed can be given; the
//              confusions the blind readers made (province bounds taken for roads 20 times, tracks for borders 10, H-077) are
//              roads and borders lying side by side, so this counts the cells of every road in a run of 4 or more cells
//              (40 km) within one cell of a border line (a crossing touches a border for 2 or 3 cells, not 4)
//   borders    the release's realm borders kept (the Codex's neighbours, allies and rivals stay neighbours)
//   rivers     rivers that reach the sea: the share of rivers (flow at the mouth >= RIVER_T), weighted by that flow, whose
//              mouth is within two cells of the open sea
//   sizes      provinces in range: the share whose land is within half to twice the release's
//   onepiece   one connected landmass: the share of the generated land that is the one continent (none drowned as islets)
//   towns      towns on a road and on water (D9's ground), the mean of the two shares
// The total weighs them 30, 20, 15, 10, 10, 5, 10. A candidate that fails a gate (a rule the game's tests hold every continent
// to: the sea realms on the shore, v2mapSeaRealms) is out, whatever its total. Writes <out>/scores.json and, with --png, the full map of the winner
// and the two runners-up as the game draws it (a life on that continent, the full map at its widest), PNG.
//   node tools/m1/choose-seed.mjs <built.html> [--n=24] [--prefix=m1-] [--out=docs/design/m1] [--png]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const args = process.argv.slice(2), opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const html = args.find(a => !a.startsWith('--'));
if (!html) { console.error('usage: node tools/m1/choose-seed.mjs <built.html> [--n=24] [--out=docs/design/m1] [--png]'); process.exit(1); }
const N = +opt('n', 24), PREFIX = opt('prefix', 'm1-'), OUT = path.resolve(opt('out', 'docs/design/m1')), PNG = args.includes('--png');
const WEIGHTS = { lore: 30, roads: 20, borders: 15, rivers: 10, sizes: 10, onepiece: 5, towns: 10 };

// each realm's words, from its name and its primer's first line (LORE.realms[id].primer.intro), quoted beside it
const LOREFIT = {
  'POL-01': ['plains', 'north'],              // "the iron-ringed empire of the northern plains"
  'POL-04': ['coast'],                        // "a lagoon republic ... that feeds the Middle Sea"
  'POL-05': ['west'],                         // "the western kingdom of ash soil"
  'POL-06': ['forest'],                       // "the great forest of the Evenwood"
  'POL-07': ['coast', 'forest'],              // "the sea-elves of the fir coast"
  'POL-08': ['coast', 'north'],               // "fog, forest, ice and longships"
  'POL-09': ['coast', 'north', 'cold'],       // "the giant halls of the far northern isle"
  'POL-10': ['high', 'nextTo:POL-01'],        // "the dwarven hold beside Aldmark's plains"
  'POL-11': ['plains', 'south'],              // "the orc clans of the southern grass"
  'POL-12': ['plains', 'coast'],              // "nine horse tribes on the steppe by the Salt Sea"
  'POL-13': ['high'],                         // "a league of mountain valleys"
  'POL-14': ['coast'],                        // "the channel kingdom: 58 galleys"
  'POL-16': ['coast'],                        // "the bankers' city of murex purple"
  'POL-17': ['coast', 'dry'],                 // "the sultanate of passes and galleys on the desert coast"
  'POL-18': ['dry', 'river'],                 // "the river kingdom of the Monuti, whose flood and wheat feed the Middle Sea"
  'POL-19': ['dry'],                          // "nearly all of it Red Waste"
  'POL-20': ['plains'],                       // "the gold of the Golden Plains"
  'POL-21': ['coast'],                        // "four merchant towns on the pepper coast"
  'POL-22': ['high', 'nextTo:POL-18'],        // "the highland kingdom that holds the source of the Monuti, and so Tamar's harvest"
  'POL-23': ['coast', 'east', 'cold'],        // "the giant kingdom of the frozen eastern coast"
  'POL-24': ['coast', 'dry'],                 // "the pearl emirate ... its oil shore"
  'POL-25': ['east'],                         // "the feudal kingdom of the Eastland"
  'POL-26': ['lakes'],                        // "the Lakeland"
  'POL-27': ['high'],                         // "the monastery-state on the Roof of the World"
  'POL-28': ['high'],                         // "the greatest dwarven hold"
  'POL-29': ['high'],                         // "the dwarven hold inside a hot mountain"
  'POL-32': ['coast', 'east'],                // "the spice islands of the eastern gulf"
  'POL-33': ['coast'],                        // "the pirate haven in the shoals of the Strait of Hael"
  'POL-34': ['plains', 'east'],               // "the orc clans of the eastern steppe"
};

// in the page: one candidate's readings
const SCORE = ({ seed, LOREFIT }) => {
  const VM = A.V2MAP, base = VM.release(), C = A.V2.continent, LAKE = (C.BIOME || {}).LAKE;
  const t0 = performance.now(), w = VM.build(seed, base), G = w.ground, ms = Math.round(performance.now() - t0);
  const gw = w.gw, gh = w.gh, N = gw * gh, g = w.grid, P = w.prov, B = base.provinces, ocean = w.ocean, riv = w.riv;
  const realmOf = id => B[id].realm;
  const nb4 = k => { const x = k % gw, y = (k / gw) | 0; return [x > 0 ? k - 1 : -1, x < gw - 1 ? k + 1 : -1, y > 0 ? k - gw : -1, y < gh - 1 ? k + gw : -1]; };
  // ---- one piece: the generated land (the generator's grid) that is the main landmass
  const gen = w.gen, GN = gen.elev.length; let genLand = 0;
  const field = new Float32Array(GN); for (let k = 0; k < GN; k++) { const l = gen.elev[k] > 0 && gen.biome[k] !== LAKE; field[k] = l ? 1 : -1; if (l) genLand++; }
  const comp = C.components(field, gen.W, gen.H), main = comp.largest >= 0 ? comp.list[comp.largest].cells.length : 0;
  const onepiece = 100 * main / Math.max(1, genLand), islets = comp.list.length - 1;
  // ---- rivers to the sea: every mouth on the generator's grid (a river cell, flow >= RIVER_T, that runs into water or
  // nowhere), weighted by its flow: into the open sea (water that reaches the frame on the game's grid), or into a lake,
  // an inland sea or a sink
  let rAll = 0, rSea = 0, nR = 0, nSea = 0;
  const fx = gen.W / gw, fy = gen.H / gh, isLand = k => gen.elev[k] > 0 && gen.biome[k] !== LAKE;
  for (let k = 0; k < GN; k++) {
    if (!isLand(k) || gen.acc[k] < VM.RIVER_T) continue;
    const t = gen.flowTo[k]; if (t >= 0 && isLand(t)) continue;
    let sea = false;
    if (t >= 0) { const x = Math.min(gw - 1, Math.floor(((t % gen.W) + 0.5) / fx)), y = Math.min(gh - 1, Math.floor((((t / gen.W) | 0) + 0.5) / fy)); for (let dy = -1; dy <= 1 && !sea; dy++) for (let dx = -1; dx <= 1 && !sea; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < gw && yy < gh && ocean[yy * gw + xx]) sea = true; } }
    nR++; rAll += gen.acc[k]; if (sea) { nSea++; rSea += gen.acc[k]; }
  }
  const rivers = 100 * rSea / Math.max(1, rAll);
  // ---- province sizes against the release's
  let inRange = 0, minC = Infinity, maxR = 0;
  for (const q of P) { const r = q.cells / Math.max(1, B[q.id].cells); if (r >= 0.5 && r <= 2) inRange++; minC = Math.min(minC, q.cells); maxR = Math.max(maxR, r); }
  const sizes = 100 * inRange / P.length;
  // ---- realm borders kept
  const pairs = (grid, own) => { const s = new Set(); for (let k = 0; k < N; k++) { const a = grid[k]; if (a < 0) continue; const x = k % gw; for (const j of [x < gw - 1 ? k + 1 : -1, k + gw < N ? k + gw : -1]) { if (j < 0) continue; const b = grid[j]; if (b < 0) continue; const ra = own(a), rb = own(b); if (ra !== rb && ra && rb && ra !== 'unclaimed' && rb !== 'unclaimed') s.add(ra < rb ? ra + '|' + rb : rb + '|' + ra); } } return s; };
  const oldP = pairs(base.grid, realmOf), newP = pairs(g, realmOf);
  let kept = 0; for (const p of oldP) if (newP.has(p)) kept++;
  const borders = 100 * kept / Math.max(1, oldP.size);
  // ---- roads beside borders: distance (in cells) from every land cell to a province border, and to a realm border
  const dist = realm => {
    const d = new Int16Array(N).fill(32767), q = [];
    for (let k = 0; k < N; k++) { const a = g[k]; if (a < 0) continue; for (const j of nb4(k)) { if (j < 0) continue; const b = g[j]; if (b >= 0 && b !== a && (!realm || realmOf(a) !== realmOf(b))) { d[k] = 0; q.push(k); break; } } }
    for (let h = 0; h < q.length; h++) { const k = q[h]; for (const j of nb4(k)) if (j >= 0 && g[j] >= 0 && d[j] > d[k] + 1) { d[j] = d[k] + 1; q.push(j); } }
    return d;
  };
  const dP = dist(false), dR = dist(true);
  let roadCells = 0, along = 0, alongRealm = 0, high = 0, track = 0;
  const onRoad = new Set();
  for (const e of G.edges) {
    if (!e.rank) continue;
    if (e.rank === 1) high++; else track++;
    onRoad.add(e.a); onRoad.add(e.b);
    const p = e.path; roadCells += p.length;
    for (const [d, add] of [[dP, n => along += n], [dR, n => alongRealm += n]]) {
      let run = 0;
      for (let i = 0; i <= p.length; i++) { if (i < p.length && d[p[i]] <= 1) run++; else { if (run >= 4) add(run); run = 0; } }
    }
  }
  const roads = 100 * (1 - along / Math.max(1, roadCells));
  // ---- towns on a road and on water
  let onWater = 0;
  for (const q of P) { const k = Math.floor(q.sy / 10) * gw + Math.floor(q.sx / 10); let wet = riv[k] >= VM.STREAM_T; if (!wet) for (const j of nb4(k)) if (j >= 0 && g[j] < 0) wet = true; if (wet) onWater++; }
  const towns = 50 * onRoad.size / P.length + 50 * onWater / P.length;
  // ---- the lore's heartlands
  let x0 = gw, x1 = 0, y0 = gh, y1 = 0; for (let k = 0; k < N; k++) if (g[k] >= 0) { const x = k % gw, y = (k / gw) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const lakeShore = q => { for (let k = 0; k < N; k++) if (g[k] === q.id) for (const j of nb4(k)) if (j >= 0 && g[j] < 0 && !ocean[j]) return true; return false; };
  const cl = v => Math.max(0, Math.min(1, v));
  const fit = {}, words = {};
  for (const id in LOREFIT) {
    const ps = P.filter(q => realmOf(q.id) === id); if (!ps.length) continue;
    const cap = ps.find(q => B[q.id].type === 'capital city') || ps[0];
    const u = (cap.sx / 10 - x0) / Math.max(1, x1 - x0), v = (cap.sy / 10 - y0) / Math.max(1, y1 - y0);
    const share = f => ps.filter(f).length / ps.length;
    const adj = new Set(); for (const q of ps) for (const j of q.adj) adj.add(realmOf(j));
    const out = {};
    for (const wd of LOREFIT[id]) {
      let s;
      if (wd === 'coast') s = 0.5 * (cap.coast ? 1 : 0) + 0.5 * cl(share(q => q.coast) / 0.6);
      else if (wd === 'plains') s = cl(share(q => q.terr === 'plains' || q.terr === 'steppe') / 0.5);
      else if (wd === 'forest') s = cl(share(q => q.terr === 'forest') / 0.4);
      else if (wd === 'dry') s = cl(share(q => q.terr === 'desert' || q.terr === 'steppe') / 0.5);
      else if (wd === 'high') s = cl(share(q => q.terr === 'mountains' || q.terr === 'hills' || q.elev >= 900) / 0.6);
      else if (wd === 'cold') s = v <= 0.3 || share(q => q.terr === 'tundra') >= 0.3 ? 1 : cl(1 - (v - 0.3) / 0.3);
      else if (wd === 'north') s = v <= 0.4 ? 1 : cl(1 - (v - 0.4) / 0.2);
      else if (wd === 'south') s = v >= 0.6 ? 1 : cl(1 - (0.6 - v) / 0.2);
      else if (wd === 'east') s = u >= 0.6 ? 1 : cl(1 - (0.6 - u) / 0.2);
      else if (wd === 'west') s = u <= 0.4 ? 1 : cl(1 - (u - 0.4) / 0.2);
      else if (wd === 'river') { const f = riv[Math.floor(cap.sy / 10) * gw + Math.floor(cap.sx / 10)]; s = f >= VM.RIVER_T ? 1 : f >= VM.STREAM_T ? 0.5 : 0; }
      else if (wd === 'lakes') s = cl(share(lakeShore) / 0.3);
      else if (wd.startsWith('nextTo:')) s = adj.has(wd.slice(7)) ? 1 : 0;
      out[wd] = Math.round(s * 100) / 100;
    }
    words[id] = out;
    const vals = Object.values(out); fit[id] = vals.reduce((a, b) => a + b, 0) / vals.length;
  }
  const lore = 100 * Object.values(fit).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(fit).length);
  // ---- gates (rules the game's tests hold every continent to, so the one continent must pass them): a realm named for the
  // sea has its capital on the coast, and one named for islands at least two thirds of its provinces coastal
  // (99991-v2-map v2mapSeaRealms)
  const gates = [];
  for (const id in LORE.realms) {
    const nm = LORE.realms[id].name, sea = VM.SEA_ID && VM.SEA_ID[id];
    const isle = sea === 'peninsula' || (!sea && VM.ISLE_RX.test(nm)), coast = sea === 'coast' || (!sea && VM.COAST_RX.test(nm));
    if (!isle && !coast) continue;
    const ps = P.filter(q => realmOf(q.id) === id), capP = ps.find(q => B[q.id].type === 'capital city') || ps[0];
    const nc = ps.filter(q => q.coast).length;
    if (!(capP && capP.coast) || (isle && nc * 3 < ps.length * 2)) gates.push(`${LORE.realms[id].short || id}: capital coastal ${!!(capP && capP.coast)}, ${nc}/${ps.length} provinces coastal`);
  }
  const terr = P.reduce((o, q) => (o[q.terr] = (o[q.terr] || 0) + 1, o), {});
  const r1 = x => Math.round(x * 10) / 10;
  return { seed, ms, lore: r1(lore), roads: r1(roads), borders: r1(borders), rivers: r1(rivers), sizes: r1(sizes), onepiece: r1(onepiece), towns: r1(towns),
    gates, facts: { islets, riversToSea: nSea + '/' + nR, bordersKept: kept + '/' + oldP.size, roadsAlongRealmBorders: r1(100 * alongRealm / Math.max(1, roadCells)), highRoads: high, tracks: track,
      onRoad: onRoad.size, onWater, provinces: P.length, smallest: minC, largestRatio: r1(maxR), coastal: P.filter(q => q.coast).length, terr },
    weak: Object.entries(fit).filter(([, f]) => f < 0.6).map(([id, f]) => `${LORE.realms[id].short || id} ${Math.round(f * 100)} (${Object.entries(words[id]).map(([k, v]) => k + ' ' + v).join(', ')})`) };
};

fs.mkdirSync(OUT, { recursive: true });
const b = await pw.chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } });
const pg = await ctx.newPage();
const errs = []; pg.on('pageerror', e => errs.push(String(e.message || e)));
await pg.goto(pathToFileURL(path.resolve(html)).href);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
const rows = [];
for (let i = 1; i <= N; i++) {
  const seed = await pg.evaluate(s => A.V2MAP.seedOf(s), PREFIX + String(i).padStart(2, '0'));
  const r = await pg.evaluate(SCORE, { seed, LOREFIT });
  r.total = Math.round(Object.entries(WEIGHTS).reduce((s, [k, wt]) => s + wt * r[k], 0) / Object.values(WEIGHTS).reduce((a, b) => a + b, 0) * 10) / 10;
  rows.push(r);
  console.log(`${seed}: total ${r.total} | lore ${r.lore} roads ${r.roads} borders ${r.borders} rivers ${r.rivers} sizes ${r.sizes} one piece ${r.onepiece} towns ${r.towns} | ${r.ms} ms${r.gates.length ? ' | OUT: ' + r.gates.join('; ') : ''}`);
}
// a candidate that fails a gate is out, whatever its readings
rows.sort((a, b) => (a.gates.length ? 1 : 0) - (b.gates.length ? 1 : 0) || b.total - a.total || (a.seed < b.seed ? -1 : 1));
fs.writeFileSync(path.join(OUT, 'scores.json'), JSON.stringify({ weights: WEIGHTS, lorefit: LOREFIT, rows }, null, 1) + '\n');
console.log('best: ' + rows.slice(0, 3).map(r => `${r.seed} (${r.total})`).join(', '));
if (PNG) {
  const names = ['winner', 'runner-up-1', 'runner-up-2'];
  for (let i = 0; i < Math.min(3, rows.length); i++) {
    const seed = rows[i].seed;
    await pg.evaluate(seed => {
      const VM = A.V2MAP; VM.ONE = seed; VM.cache.clear();
      A.newGame({ seed: 620, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
      UI.screen = 'game'; UI.set.hints = false; UI.set.atlasFog = false; UI.tab = 'world'; A.S.queue = []; UI.render();
      VM.SAT.budgetMs = 1e9; if (UI.INKMAP) UI.INKMAP.budgetMs = 1e9;
      UI.A.ov('bigmap');
      UI.gm.view = UI.wrClampView({ x0: 0, y0: 0, w: 7000, h: 0 }); UI.gmDraw(); UI.gmDraw();
    }, seed);
    const el = await pg.$('#gmap');
    await el.screenshot({ path: path.join(OUT, names[i] + '.png') });
    console.log(`${names[i]}.png: ${seed}`);
  }
}
await b.close();
if (errs.length) { console.error('page errors: ' + errs.slice(0, 3).join(' | ')); process.exit(1); }
