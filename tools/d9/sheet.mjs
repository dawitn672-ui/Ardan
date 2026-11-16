// D9: a sheet of the map for the owner: for each seed the whole continent and a close view, with the numbers under it.
//   node tools/d9/sheet.mjs <built.html> <out.png> [--seeds=620,4242,90001] [--zoom=4]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const args = process.argv.slice(2), opt = k => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : null; };
const [html, outPng] = args.filter(a => !a.startsWith('--'));
const seeds = (opt('seeds') || '620,4242,90001').split(',').map(Number), zoom = +(opt('zoom') || 4);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'd9-sheet-'));
const b = await pw.chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
await pg.goto('file://' + path.resolve(html));
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
const rows = [];
for (const seed of seeds) {
  const facts = await pg.evaluate(seed => {
    A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
    UI.screen = 'game'; UI.set.hints = false; UI.set.atlasFog = false; UI.tab = 'world'; UI.render();
    A.V2MAP.SAT.budgetMs = 1e9; if (UI.INKMAP) UI.INKMAP.budgetMs = 1e9;
    UI.A.ov('bigmap');
    const G = A.D9.ground(), N = A.D9.names(), c = {}; for (const p of A.S.prov) c[p.terr] = (c[p.terr] || 0) + 1;
    const r = [0, 0, 0]; for (const e of G.edges) r[e.rank]++;
    const k = G.crossings.reduce((o, x) => (o[x.kind] = (o[x.kind] || 0) + 1, o), {});
    return { seed, terr: Object.entries(c).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} ${n}`).join(', '), high: r[1], track: r[2], ford: k.ford || 0, bridge: k.bridge || 0, passes: G.passes.length,
      names: [N.seas[0], N.ranges[0], N.rivers[0], N.forests[0], N.passes[0]].filter(Boolean).join(' · ') };
  }, seed);
  const shots = [];
  for (const [z, tag] of [[1, 'whole'], [zoom, 'close']]) {
    await pg.evaluate(({ z }) => {
      // the close view: the busiest crossing country, centred on the province with the most roads and crossings
      let P = A.S.prov[A.realm('POL-01').capitalProv];
      if (z > 1) { const G = A.D9.ground(), n = new Map(); for (const x of G.crossings) n.set(x.prov, (n.get(x.prov) || 0) + 1); for (const e of G.edges) if (e.rank === 1) { n.set(e.a, (n.get(e.a) || 0) + 1); n.set(e.b, (n.get(e.b) || 0) + 1); } let best = -1; for (const [id, v] of n) if (v > best) { best = v; P = A.S.prov[id]; } }
      const w = 7000 / z; UI.gm.view = UI.wrClampView({ x0: P.sx - w / 2, y0: P.sy - w / 3.06, w, h: 0 }); UI.gmDraw(); UI.gmDraw();
    }, { z });
    const f = path.join(tmp, `${seed}-${tag}.png`);
    await (await pg.$('#gmap')).screenshot({ path: f });
    shots.push(f);
  }
  rows.push({ facts, shots });
}
const img = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
const page = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#1b1712;color:#efe4cc;font:14px Georgia,serif}
h1{font:600 20px Cinzel,Georgia,serif;margin:14px 18px 4px}p.k{margin:0 18px 10px;color:#cdbf9f;font-size:13px}
.row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 18px 6px}.row img{width:100%;display:block;border:1px solid #4a3f30}
.f{margin:0 18px 16px;font-size:12.5px;color:#d8ccb0}</style>
<h1>D9 · the map's ground, three seeds</h1>
<p class="k">Left: the whole continent (high roads only). Right: a close view (zoom ${zoom}): high roads (red-brown, pale casing), tracks (thin brown), realm borders (dashed ink), province bounds (dotted), fords (pale diamonds), bridges (two flared lines), passes (two arcs), woods (small trees), marsh (reeds), rivers with their tributaries, and the names of seas, ranges, rivers, forests and passes.</p>
${rows.map(r => `<div class="row"><img src="${img(r.shots[0])}"><img src="${img(r.shots[1])}"></div>
<div class="f">Seed ${r.facts.seed}: ${r.facts.high} high roads, ${r.facts.track} tracks, ${r.facts.ford} fords, ${r.facts.bridge} bridges, ${r.facts.passes} passes · terrain ${r.facts.terr} · e.g. ${r.facts.names}</div>`).join('\n')}`;
const sp = await (await b.newContext({ viewport: { width: 1500, height: 900 } })).newPage();
await sp.setContent(page);
await sp.screenshot({ path: outPng, fullPage: true });
await b.close();
fs.rmSync(tmp, { recursive: true, force: true });
console.log(outPng, Math.round(fs.statSync(outPng).size / 1024) + ' KB');
