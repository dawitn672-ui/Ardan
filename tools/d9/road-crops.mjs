// D9 (CRITIQUE §17, done-when 2): crops of the full map with numbered marks on lines, half of them roads and half
// borders, for a playtester who has not seen the code to tell apart. Writes crop-NN.png and key.json (the answers).
//   node tools/d9/road-crops.mjs <built.html> <outdir> [--seed=620] [--crops=10] [--marks=10] [--zoom=4]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const args = process.argv.slice(2), opt = k => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : null; };
const [html, out] = args.filter(a => !a.startsWith('--'));
if (!html || !out) { console.error('usage: node tools/d9/road-crops.mjs <built.html> <outdir>'); process.exit(1); }
const seed = +(opt('seed') || 620), crops = +(opt('crops') || 10), marks = +(opt('marks') || 10), zoom = +(opt('zoom') || 5);
fs.mkdirSync(out, { recursive: true });
const b = await pw.chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
await pg.goto('file://' + path.resolve(html));
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
await pg.evaluate(seed => {
  A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
  UI.screen = 'game'; UI.set.hints = false; UI.set.atlasFog = false; UI.tab = 'world'; UI.render();
  A.V2MAP.SAT.budgetMs = 1e9; if (UI.INKMAP) UI.INKMAP.budgetMs = 1e9;
  UI.A.ov('bigmap');
}, seed);
const key = [];
for (let c = 0; c < crops; c++) {
  // a crop too crowded to hold its marks clear of towns, names and water is moved to another place (try t)
  let r = null;
  for (let t = 0; t < 12 && !(r && r.marks.length >= marks); t++) r = await pg.evaluate(({ c, t, zoom, marks }) => {
    const h = n => { let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };
    const S = A.S, gw = MAP.gw, gh = MAP.gh, g = MAP.grid, P = S.prov[Math.floor(h(c * 31 + 7 + t * 7919) * S.prov.length)];
    const w = 7000 / zoom; UI.gm.view = UI.wrClampView({ x0: P.sx - w / 2, y0: P.sy - w / 3.06, w, h: 0 }); UI.gmDraw(); UI.gmDraw();
    const cv = document.querySelector('#gmap'), v = UI.gm.view, W = cv.width, H = cv.height, X = x => (x - v.x0) / v.w * W, Y = y => (y - v.y0) / v.h * H;
    const inV = (x, y) => X(x) > 60 && Y(y) > 60 && X(x) < W - 60 && Y(y) < H - 60;
    // the lines in view, read from what is drawn: road points from the roads' own polylines, border points from 62's traced
    // borders (IM.geo, the very lines on the picture), each with the ground it lies on
    const geo = A.D9.geo(), roadPts = [], bordPts = [], at = (x, y) => S.prov[g[Math.floor(y / 10) * gw + Math.floor(x / 10)]];
    for (const o of geo.roads) for (let i = 4; i < o.pts.length - 4; i += 6) if (inV(o.pts[i], o.pts[i + 1])) roadPts.push({ x: o.pts[i], y: o.pts[i + 1], kind: o.rank === 1 ? 'high road' : 'track' });
    for (const o of UI.INKMAP.geo().provPieces) {
      const pa = S.prov[o.a], pb = S.prov[o.b]; if (!pa || !pb) continue;
      for (let i = 4; i < o.pts.length - 4; i += 6) if (inV(o.pts[i], o.pts[i + 1])) bordPts.push({ x: o.pts[i], y: o.pts[i + 1], kind: pa.owner !== pb.owner ? 'realm border' : 'province border', brown: [pa, pb].some(q => /^(hills|steppe|desert|mountains)$/.test(q.terr)) });
    }
    // clear of every town (70 km), every name written on the map (its box and the ring's radius), and running water
    const towns = S.prov.map(p => [p.sx, p.sy]), labels = (A.V2MAP.labelsPlaced || []), Rk = 15 * W / cv.getBoundingClientRect().width;
    const w9 = A.D9.ctx().w;
    const far = (p, list, d) => !list.some(q => (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < d * d);
    const clear = p => !towns.some(([x, y]) => (x - p.x) ** 2 + (y - p.y) ** 2 < 70 * 70)
      && !labels.some(b => X(p.x) > b.x - Rk - 4 && X(p.x) < b.x + b.w + Rk + 4 && Y(p.y) > b.y - Rk - 4 && Y(p.y) < b.y + b.h + Rk + 4)
      && ![[0, 0], [-15, 0], [15, 0], [0, -15], [0, 15]].some(([dx, dy]) => { const xx = Math.floor((p.x + dx) / 10), yy = Math.floor((p.y + dy) / 10); return xx >= 0 && yy >= 0 && xx < gw && yy < gh && w9.riv[yy * gw + xx] >= 40; });
    const roads = roadPts.filter(p => far(p, bordPts, 40) && clear(p)), bords = bordPts.filter(p => far(p, roadPts, 40) && clear(p));
    // half roads, half borders, spread over the crop
    const pick = [], spaced = p => !pick.some(q => Math.hypot(X(q.x) - X(p.x), Y(q.y) - Y(p.y)) < 90);
    const want = { road: Math.ceil(marks / 2), border: Math.floor(marks / 2) };
    const take = (list, kind, n) => { const order = list.map((p, i) => [h(c * 977 + i * 13 + (kind === 'road' ? 1 : 2)), p]).sort((x, y) => x[0] - y[0]).map(x => x[1]); for (const p of order) { if (n <= 0) break; if (spaced(p)) { pick.push(Object.assign({ is: kind }, p)); n--; } } };
    // one ring on a realm border on brown ground (hills, steppe, desert, mountains) where the crop has one
    const brownRealm = bords.filter(p => p.kind === 'realm border' && p.brown);
    if (brownRealm.length) { take(brownRealm, 'border', 1); want.border--; }
    take(roads, 'road', want.road); take(bords, 'border', want.border);
    // numbered in a shuffled order
    const order = pick.map((p, i) => [h(c * 4099 + i), p]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
    const ctx = cv.getContext('2d'), K = W / cv.getBoundingClientRect().width;
    order.forEach((p, i) => {
      // a wide thin ring, so the line runs visibly through it, and a numbered tag on a leader
      const x = X(p.x), y = Y(p.y), R = 15 * K, tx = x + R + 12 * K, ty = y - R - 12 * K;
      ctx.save(); ctx.lineWidth = 1.6 * K; ctx.strokeStyle = '#ffe14a'; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + R * 0.71, y - R * 0.71); ctx.lineTo(tx - 7 * K, ty + 7 * K); ctx.stroke();
      ctx.fillStyle = '#ffe14a'; ctx.beginPath(); ctx.arc(tx, ty, 10 * K, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111'; ctx.font = `bold ${Math.round(13 * K)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), tx, ty + 0.5);
      ctx.restore();
    });
    return { centre: P.name, marks: order.map((p, i) => ({ n: i + 1, is: p.is, kind: p.kind, brown: !!p.brown })) };
  }, { c, t, zoom, marks });
  const el = await pg.$('#gmap');
  const file = `crop-${String(c + 1).padStart(2, '0')}.png`;
  await el.screenshot({ path: path.join(out, file) });
  key.push({ crop: file, centre: r.centre, marks: r.marks });
}
fs.writeFileSync(path.join(out, 'key.json'), JSON.stringify({ seed, zoom, key }, null, 1));
console.log(key.map(k => `${k.crop}: ${k.marks.length} marks (${k.marks.filter(m => m.is === 'road').length} roads)`).join('\n'));
await b.close();
