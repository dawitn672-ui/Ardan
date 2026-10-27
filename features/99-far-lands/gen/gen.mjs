// The far lands generator: node features/99-far-lands/gen/gen.mjs [--preview=<dir>] [--check] [--lore=<file>] [--out=<file>]
// Writes features/99-far-lands/b-data.core.js (checked in) from the vendored release's map and, when it exists, the
// lore in canon/lore/far-lands.json. Deterministic: the same inputs give the same file byte for byte (--check fails if
// the checked-in file differs). Steps, as in docs/plan/world-expansion-architecture.md stage 2:
//   geography (geo.mjs) -> provinces and adjacency (prov.mjs) -> regions -> ground words and names -> realms,
//   cultures, faiths and houses (realms.mjs) -> the grid as run-length pairs -> the data file and a report.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBase } from './base.mjs';
import { geography, CELL } from './geo.mjs';
import { lorePlan } from './loreplan.mjs';
import { provinces, regions } from './prov.mjs';
import { makeRealms } from './realms.mjs';
import { makeRoutes, makeAtlas } from './routes.mjs';
import { namer } from './names.mjs';
import { rng, hash3 } from './lib.mjs';
import * as PLAN from './plan.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const OUT = arg('out') ? path.resolve(arg('out')) : path.join(HERE, '..', 'b-data.core.js');
// far@1 (Oct 26) is frozen: saves of it open by c-lands.core.js's migration. This generator writes far@2.
export const SEED = 1105, KEY = 'far@2', KA = 46000;

export function generate() {
  const t0 = Date.now(), log = [];
  const base = loadBase();
  const lorePath = arg('lore') ? path.resolve(arg('lore')) : path.join(base.root, 'canon/lore/far-lands.json');
  const loreText = fs.existsSync(lorePath) ? fs.readFileSync(lorePath, 'utf8') : null, lore = loreText ? JSON.parse(loreText) : null;
  // the peoples and faiths, when the lore lane has written them: cultures with their name lists, faiths in full
  const pfPath = path.join(path.dirname(lorePath), 'peoples-and-faiths.json');
  const pfText = lore && fs.existsSync(pfPath) ? fs.readFileSync(pfPath, 'utf8') : null;
  if (pfText) { const PF = JSON.parse(pfText); lore.cultures = PF.cultures; lore.faiths = PF.faiths; lore.game_tables = PF.game_tables; }
  const loreHash = loreText ? crypto.createHash('sha256').update(loreText + (pfText || '')).digest('hex').slice(0, 16) : null;
  const plan = lore ? lorePlan(lore) : PLAN.handPlan();
  const G = geography(base, SEED, plan), GW = G.GW, GH = G.GH;
  const V = provinces(G, base, SEED, KA);
  const lands = regions(V.P, G);
  // far@2: what the lore says each land holds, beside what the generator made (the test reads both)
  if (lore) for (const g of lore.regions || []) if (lands[g.land]) lands[g.land].lore = (lands[g.land].lore || 0) + (+g.area_km2 || 0);
  // the high waste along a land's ranges (shape.mjs, wastes) is held apart from its regions' areas
  for (const p of V.P) if (/-00$/.test(p.region) && lands[p.land]) lands[p.land].waste = (lands[p.land].waste || 0) + p.cells * 100;
  const nb = base.provinces.length, P = V.P;
  // ---- the ground word: the release's eight, from height, roughness and biome (the release's own mix is hills 41%,
  // forest 15%, steppe 13%, plains 11%, desert 8%, mountains 7%, tundra 3%, marsh 2%)
  const WORDS = ['hills', 'forest', 'steppe', 'plains', 'desert', 'mountains', 'tundra', 'marsh'];
  for (const p of P) {
    const b = p.biome, e = p.elev, rel = p.relief;
    let t;
    if ((e >= 2700 && (rel >= 430 || e >= 5200)) || (rel >= 650 && e >= 1300)) t = 'mountains';
    else if (e >= 2700) t = 'hills';                  // the flat top of a high plateau rolls; its biome (Alpine highland) keeps it high
    else if (b === 'Glacier' || b === 'Tundra') t = 'tundra';
    else if (b === 'Marsh') t = 'marsh';
    else if (rel >= 190 || (e >= 900 && rel >= 110)) t = 'hills';
    else if (b === 'Desert') t = 'desert';
    else if (b === 'Steppe' || b === 'Savanna') t = 'steppe';
    else if (b === 'Dry woodland') t = 'plains';
    else t = p.river === 2 && p.pop / p.cells > 1500 ? 'plains' : 'forest';
    if (t === 'forest' && p.pop / (p.cells * 100) > 45 && rel < 200) t = 'plains';   // the crowded basins are farmland
    // the lore names each region's ground: a word it does not name gives way to the first it does that fits
    const reg = plan.lore && plan.regions.find(r => r.id === p.region), cands = reg ? reg.terr.filter(w => WORDS.includes(w)) : [];
    if (cands.length && !cands.includes(t)) t = cands.find(w => (w !== 'mountains' || rel >= 300 || e >= 2500) && (w !== 'hills' || rel >= 120 || e >= 900)) || cands[cands.length - 1];
    p.terr = t;
  }
  // ---- names (the lore's lists when present; the stand-in palettes otherwise)
  const used = new Set(base.provinces.map(q => q.name.toLowerCase()));
  for (const id in base.LORE.realms) used.add(base.LORE.realms[id].short.toLowerCase());
  const R = rng(SEED + 7), namers = {};
  const nm = (L, v) => (namers[L + v] = namers[L + v] || namer(rng(SEED + 1000 + L.charCodeAt(0) * 7 + v), L, v, used));
  P.forEach((p, k) => {
    p.pid = `PLC-${7001 + k}`;
    p.base = nm(p.land, p.x % 2).word({ min: 4, max: 10 });
    p.name = p.base;
  });
  // ---- realms
  const adjOf = p => V.adj[p.k], seaOf = p => V.sea[p.k];
  for (const p of P) p.town = Math.round(p.pop * 0.05);
  const provAtKm = (x, y) => { const cx = Math.floor((x - G.F.x0) / CELL), cy = Math.floor((y - G.F.y0) / CELL); if (cx < 0 || cy < 0 || cx >= GW || cy >= GH) return null; const o = V.own[cy * GW + cx]; return o >= 0 ? P[o] : null; };
  const RL = makeRealms(P, adjOf, seaOf, SEED, base, lore, provAtKm);
  // the names in the world now (makeRealms names the far provinces from their peoples' lists)
  used.clear(); for (const q of base.provinces) used.add(q.name.toLowerCase());
  for (const id in base.LORE.realms) used.add(base.LORE.realms[id].short.toLowerCase());
  for (const p of P) used.add(p.name.toLowerCase());
  if (RL.placeReport) log.push(`names: ${RL.placeReport.fromList} provinces named from their peoples' place lists (${RL.placeReport.sided} of them a side of the country, "Upper ...", and ${RL.placeReport.fallback} from another land's people), ${RL.placeReport.unnamed} left with the land's sounds`);
  if (RL.quota) log.push(`quotas: realms hold ${(RL.quota.want / 1e6).toFixed(2)}M km² by the lore's holds_km2; off by ${(RL.quota.off / 1e6).toFixed(2)}M (${(100 * RL.quota.err).toFixed(1)}%) over ${RL.quota.n} realm-regions; worst ` + RL.quota.worst.map(w => `${w[1]} ${w[2]} ${Math.round(w[3] / 1e3)}k/${Math.round(w[4] / 1e3)}k`).join(', '));
  if (lore) log.push(`lore: ${RL.loreReport.realms} realms read, ${RL.loreReport.placed} placed` + (RL.loreReport.skipped.length ? `; skipped ${RL.loreReport.skipped.slice(0, 8).join(', ')}` : ''));
  // ---- what each province is: its type, walls and largest town
  const caps = new Set(Object.values(RL.realms).map(r => r.capId));
  const ranked = P.filter(p => p.realm).sort((a, b) => b.pop - a.pop || a.id - b.id), cityCut = ranked[Math.floor(ranked.length * 0.1)]?.pop || 0;
  const WILD = { hills: 'Hills', mountains: 'Heights', forest: 'Woods', desert: 'Waste', steppe: 'Grass', tundra: 'Barrens', marsh: 'Fens', plains: 'Downs' };
  for (const p of P) {
    const h = hash3(p.k, 5, 9);
    if (!p.realm) {
      p.realm = 'unclaimed'; p.type = 'unclaimed land';
      p.name = `The ${p.base} ${p.terr === 'forest' && /Taiga/.test(p.biome) ? 'Pines' : WILD[p.terr] || 'Wilds'}`;
      used.add(p.name.toLowerCase());
      p.town = 0; p.fort = 0; continue;
    }
    const L = p.land;
    if (caps.has(p.pid)) p.type = 'capital city';
    else if (p.pop >= cityCut) p.type = 'city';
    else if (p.terr === 'desert' || (p.biome === 'Desert' && p.river)) p.type = L === 'B' && h < 0.35 ? 'caravanserai' : 'oasis';
    else if (L === 'F' && p.terr === 'steppe' && h < 0.25) p.type = 'yam station';
    else if (L === 'H' && h < 0.3) p.type = 'monastery';
    else if (L === 'T' && h < 0.3) p.type = 'ring-fort';
    else if (p.terr === 'mountains' || (p.terr === 'hills' && h < 0.25)) p.type = 'castle';
    else p.type = p.coast || p.river ? (h < 0.5 ? 'market town' : 'town') : 'town';
    const share = { 'capital city': 0.16, city: 0.1, 'market town': 0.06, town: 0.04, castle: 0.03, oasis: 0.2, caravanserai: 0.1, 'yam station': 0.04, monastery: 0.03, 'ring-fort': 0.05 }[p.type] || 0.04;
    p.town = Math.max(400, Math.round(p.pop * share * (0.7 + 0.6 * h) / 100) * 100);
    p.fort = p.type === 'capital city' ? 3 : p.type === 'city' || p.type === 'castle' ? 2 : p.type === 'ring-fort' || p.terr === 'mountains' ? 1 + (h < 0.4 ? 1 : 0) : h < 0.3 ? 1 : 0;
  }
  // the realms' capitals are named for their provinces; the primer says what the realm is, dryly
  const faithName = id => (RL.faiths.find(f => f.id === id) || {}).name || '';
  for (const [id, r] of Object.entries(RL.realms)) {
    const cap = P.find(p => p.pid === r.capId);
    if (r.capName && !used.has(r.capName.toLowerCase())) { used.delete(cap.name.toLowerCase()); cap.name = r.capName; used.add(cap.name.toLowerCase()); }
    r.capital = cap.name; delete r.capName;
    const H = Object.values(RL.houses).find(h => h.realm === id && h.kind === 'royal'); if (H) H.seat = cap.name;
    const cult = r.cult && RL.cultures[r.cult];
    const shortOf = a => (RL.realms[a] || base.LORE.realms[a] || { short: a }).short, allies = r.allies.map(shortOf), rivals = r.rivals.map(shortOf);
    r.primer = {
      intro: r.loreNote && r.loreNote.intro ? r.loreNote.intro : `${r.name}: ${r.provs.length} provinces of ${(lands[r.land] || PLAN.LANDS[r.land] || { name: r.land }).name.replace(/^the /i, '')}, ruled from ${cap.name}.`,
      ruler: r.loreNote && r.loreNote.ruler ? r.loreNote.ruler : H ? `The ${r.title} of House ${H.sur || H.name.replace(/^House /, '')}, who rules from ${cap.name}.` : '',
      'people and land': `${fmt(r.pop)} people on ${fmt(r.area)} km², ${cult ? 'most of them ' + cult.name : 'of many peoples'}. Faith: ${faithName(r.faith)}.`,
      strength: `${fmt(r.army)} standing, ${fmt(r.levy)} at full levy.`,
      'three people to know': '', ...(r.loreNote && r.loreNote.want ? { wants: r.loreNote.want } : {}), ...(r.loreNote && r.loreNote.fear ? { fears: r.loreNote.fear } : {}),
      ties: (rivals.length ? `Rival of ${rivals.join(' and ')}` : 'No great rival') + (allies.length ? `; allied to ${allies.join(' and ')}.` : '.'),
    };
    delete r.provs; delete r.loreNote;
  }
  for (const H of Object.values(RL.houses)) { if (H.kind === 'noble') { const p = P.find(q => q.pid === H.seatId); if (p) H.seat = p.name; } }

  // ---- far@2: the lore's great routes on the province graph (with the sea lanes its sea roads need), and the atlas
  let routes = [], atlas = null;
  if (lore) {
    // the canon road the Silk Road runs on into, west of Kraoth (TR-09, the Silk Road of the east: the Tusk Clans,
    // Drevna, Velgrad), from the Known World's own capitals, so the great road reads as one road
    const capAt = short => { const id = Object.keys(base.LORE.realms).find(k => base.LORE.realms[k].short === short), L = id && base.LORE.realms[id]; const q = L && base.provinces.find(p => p.pid === L.capId); return q ? [q.sx, q.sy] : null; };
    const west = [[6800, 1600], capAt('Drevna'), capAt('Velgrad')].filter(Boolean);
    const withCanon = Object.assign({}, lore, { routes: (lore.routes || []).concat(west.length >= 2 ? [{ id: 'TR-09', name: 'The Silk Road of the east', kind: 'caravan', strands: [{ name: 'Kraoth to Velgrad', pts: west }] }] : []) });
    const RT = makeRoutes(withCanon, P, V, base, provAtKm, G.F);
    routes = RT.routes;
    const landAt = (x, y) => { const cx = Math.floor((x - G.F.x0) / CELL), cy = Math.floor((y - G.F.y0) / CELL); return cx >= 0 && cy >= 0 && cx < GW && cy < GH && !!G.land[cy * GW + cx]; };
    atlas = makeAtlas(lore, landAt, G.F, GW, GH);
    for (const r of plan.regions) if (r.kind === 'waste') atlas.regions[r.id] = r.name;
    log.push(`routes: ${routes.length} strands of ${new Set(routes.map(r => r.id)).size} routes over ${new Set(routes.flatMap(r => r.p)).size} provinces (${routes.filter(r => r.p.some(id => id < nb)).length} reach the Known World), ${RT.lanes} sea lanes added, ${RT.miss} legs not found; ` +
      `atlas: ${Object.keys(atlas.regions).length} regions, ${atlas.ranges.length} ranges, ${atlas.rivers.length} rivers, ${atlas.lakes.length} lakes, ${atlas.seas.length} seas, ${atlas.straits.length} straits, ${atlas.passes.length} passes`);
  }
  // ---- the grid: province id + 1 and run length, Uint16 little-endian pairs over the whole frame (0: water, and
  // the cells of the Known World, which the game copies in from its own map)
  const runs = [];
  let cur = -2, len = 0;
  for (let i = 0; i < G.N; i++) {
    const o = V.own[i], v = o >= 0 ? nb + o : o <= -2 ? -2 - o : -1;
    if (v === cur && len < 65535) { len++; continue; }
    if (len) runs.push(cur + 1, len);
    cur = v; len = 1;
  }
  runs.push(cur + 1, len);
  const rle = Buffer.from(Uint16Array.from(runs).buffer).toString('base64');
  // ---- provinces, in columns
  const sorted = a => [...a].sort((x, y) => x - y);
  const cols = { id: [], pid: [], name: [], type: [], realm: [], x: [], y: [], sx: [], sy: [], pop: [], town: [], biome: [], terr: [], elev: [], fort: [], coast: [], cells: [], adj: [], sea: [], region: [] };
  for (const p of P) {
    cols.id.push(p.id); cols.pid.push(p.pid); cols.name.push(p.name); cols.type.push(p.type); cols.realm.push(p.realm);
    cols.x.push(p.x); cols.y.push(p.y); cols.sx.push(p.sx); cols.sy.push(p.sy); cols.pop.push(p.pop); cols.town.push(p.town);
    cols.biome.push(p.biome); cols.terr.push(p.terr); cols.elev.push(p.elev); cols.fort.push(p.fort); cols.coast.push(p.coast ? 1 : 0);
    cols.cells.push(p.cells); cols.adj.push(sorted(V.adj[p.k])); cols.sea.push(sorted(V.sea[p.k])); cols.region.push(p.region);
  }
  const seam = {}; for (const [q, l] of [...V.seam.entries()].sort((a, b) => a[0] - b[0])) seam[q] = sorted(l);
  const seaBase = {}; for (const [q, l] of [...V.seaBase.entries()].sort((a, b) => a[0] - b[0])) seaBase[q] = sorted(l);
  for (const [q, l] of [...V.baseBase.entries()].sort((a, b) => a[0] - b[0])) seam[q] = sorted([...(seam[q] || []), ...l]);
  const baseExt = {}; for (const [q, e] of [...V.ext.entries()].sort((a, b) => a[0] - b[0])) baseExt[q] = [e.cells, e.coast ? 1 : 0];
  const D = {
    v: 2, key: KEY, gw: GW, gh: GH, cell: CELL, x0: G.F.x0, y0: G.F.y0, ox: G.OX, oy: G.OY, base: nb, rle, provinces: cols, seam, seaBase, baseExt,
    realms: RL.realms, houses: RL.houses, relations: RL.relations, cultures: RL.cultures, naming: RL.naming, lang: RL.lang, faiths: RL.faiths,
    lands, routes, atlas, lore: lore ? 'canon/lore/far-lands.json' : null, loreHash,
  };
  const json = JSON.stringify(D);
  const text = `// features/99-far-lands/b-data.core.js: the far lands as data, generated by gen/gen.mjs (seed ${SEED}). Do not edit by hand:\n` +
    `// run node features/99-far-lands/gen/gen.mjs. The Great Continent (c-lands.core.js) reads it when a game asks for it.\n` +
    `A.FL_DATA = ${json};\n`;
  // ---- report
  const landArea = P.reduce((s, p) => s + p.cells, 0) * CELL * CELL;
  const byTerr = {}; for (const p of P) byTerr[p.terr] = (byTerr[p.terr] || 0) + 1;
  const held = P.filter(p => p.realm !== 'unclaimed');
  log.push(`far land ${(landArea / 1e6).toFixed(1)}M km², ${P.length} provinces (${held.length} held, ${P.length - held.length} unclaimed), ${Object.keys(RL.realms).length} realms, ` +
    `${Object.keys(RL.cultures).length} cultures, ${RL.faiths.length} faiths, ${Object.keys(RL.houses).length} houses; ${V.straits} straits, ${V.lanes} sea lanes; ` +
    `${(P.reduce((s, p) => s + p.pop, 0) / 1e6).toFixed(0)}M people`);
  log.push('ground: ' + Object.entries(byTerr).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${(100 * n / P.length).toFixed(0)}%`).join(', '));
  log.push('lands: ' + Object.entries(lands).map(([k, v]) => `${k} ${(v.area / 1e6).toFixed(1)}M km² ${P.filter(p => p.land === k).length}p ${Object.values(RL.realms).filter(r => r.land === k).length}r`).join(' | '));
  log.push(`data ${(text.length / 1024).toFixed(0)} KB (grid ${(rle.length / 1024).toFixed(0)} KB); ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  return { text, D, G, V, base, log };
}
const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const r = generate();
  for (const l of r.log) console.log(l);
  if (process.argv.includes('--check')) {
    const old = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (old !== r.text) { console.error('b-data.core.js differs from what the generator makes'); process.exit(1); }
    console.log('b-data.core.js is what the generator makes');
  } else { fs.writeFileSync(OUT, r.text); console.log('wrote', path.relative(process.cwd(), OUT)); }
  const pv = arg('preview');
  if (pv) {
    const { geoPicture, regionPicture, write } = await import('./preview.mjs');
    const GW = r.G.GW, GH = r.G.GH;
    write(pv, 'geo.png', geoPicture(r.G, r.base, GW, GH, 2));
    const owner = new Int32Array(r.G.N).fill(-1), realmIx = {}, realmOfP = r.D.provinces.realm;
    Object.keys(r.D.realms).forEach((k, i) => { realmIx[k] = i; });
    for (let i = 0; i < r.G.N; i++) owner[i] = r.G.inBase(i) ? -2 : r.V.own[i] >= 0 ? r.V.own[i] : -1;
    const colRealm = (v, i) => v === -2 ? (r.G.baseCell(i) >= 0 ? [150, 150, 140] : [38, 58, 82]) : v < 0 ? [30, 50, 78] : realmOfP[v] === 'unclaimed' ? [120, 118, 110] : (() => { const c = r.D.realms[realmOfP[v]].color; return [1, 3, 5].map(k => parseInt(c.slice(k, k + 2), 16)); })();
    write(pv, 'realms.png', regionPicture(owner, colRealm, GW, GH, 2, true));
  }
}
