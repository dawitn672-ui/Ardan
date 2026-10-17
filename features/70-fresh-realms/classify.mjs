// The life-arc classifier (Road to Ten, Replayability 3, "done when": "a bot classifier sorts 100 runs into 8 or more
// distinct life-arc types with none above 25%").
//
//   node features/70-fresh-realms/classify.mjs <built.html> [--lives=100] [--years=60] [--world=varied|canon]
//        [--seed=9001] [--json=out.json] [--from=saved.json]
//
// Plays bot lives (bench/bot.mjs) in menu worlds (world: 'varied', as the creation screen starts them) over a spread of
// peoples, realms and starting statuses, rotating the bot's personality and whether it spends its initiative. For each
// life it reads what the game itself recorded: the ending and its manner (28-endings), the path the life was on each
// year (46-life-arcs, A.ARCS.path), the undertakings and story arcs it began and finished (46, 50-53), the ranks and
// offices held, prison, freedom, wealth, fame, children. Then it sorts each life into one of the 14 arc types below
// (the first that fits) and reports the distribution against the bar: 8 or more types, none above 25%.
// --from=saved.json re-classifies lives saved by an earlier run without playing them again.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BOT } from '../../bench/bot.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };

// ---- the arc types, in order: the first that fits is the life's arc. Each reads only what the game recorded.
export const TYPES = [
  ['cut_short', 'Cut short', 'died before 25', L => L.deathAge != null && L.deathAge < 25],
  ['crowned', 'The crowned', 'held a throne', L => L.ruled],
  ['risen', 'Risen from below', 'born unfree or common and died free, noble or crowned', L => L.freed || ['risen', 'dust_to_throne'].includes(L.ending) || (L.rungMax - L.rungStart >= 2 && L.startRank <= 3)],
  ['commander', 'The commander', 'rose to captain or above in an army', L => L.maxMil >= 6 || L.ending === 'general'],
  ['outlaw', 'Outlaw and prisoner', 'died in chains, an outlaw for a third of the life, or five years in prison', L => L.ending === 'chains' || share(L, 'criminal') >= 0.33 || L.prisonYears >= 5],
  ['soldier', 'A soldier\'s life', 'a soldier or sellsword for a third of the life, or ten battles', L => share(L, 'soldier') >= 0.33 || L.ending === 'veteran' || L.mercYears >= 5],
  ['lord', 'Lord and courtier', 'lived as a lord, or held an office of state', L => share(L, 'noble') >= 0.5 || L.office],
  ['trader', 'The trader\'s fortune', 'a trader for half the life, or died wealthy', L => L.ending === 'rich' || share(L, 'merchant') >= 0.5],
  ['craft', 'Master of a craft', 'rose to master in a trade, or made a masterwork', L => L.ending === 'master' || L.jobMax >= 4],
  ['faith', 'A life in the faith', 'a priest for a third of the life, or died of good repute before the gods', L => L.ending === 'saint' || share(L, 'priest') >= 0.33],
  ['learned', 'The learned', 'a scholar for a third of the life, or died learned', L => L.ending === 'learned' || L.ending === 'keeper' || share(L, 'scholar') >= 0.33],
  ['road', 'Road and wild', 'a wanderer or a knower of beasts, or famous beyond the parish', L => ['wanderer', 'beast_lore', 'famous'].includes(L.ending)],
  ['kin', 'Kin and household', 'a great family or many friends, or two kin stories lived through', L => ['root', 'beloved'].includes(L.ending) || L.kinArcs >= 2],
  ['common', 'The common lot', 'none of the above: a working life', () => true],
];
const share = (L, p) => (L.years > 0 ? (L.paths[p] || 0) / Math.max(1, L.years) : 0);
export const classify = L => TYPES.find(t => t[3](L))[0];

export function report(lives) {
  const n = lives.length, by = {};
  for (const L of lives) by[L.type = classify(L)] = (by[L.type] || 0) + 1;
  const rows = TYPES.map(t => ({ id: t[0], name: t[1], n: by[t[0]] || 0, pct: +(100 * (by[t[0]] || 0) / Math.max(1, n)).toFixed(1) }));
  const types = rows.filter(r => r.n > 0).length, top = rows.slice().sort((a, b) => b.n - a.n)[0];
  const endings = {}; for (const L of lives) endings[L.ending] = (endings[L.ending] || 0) + 1;
  return { lives: n, types, top: top.id, topPct: top.pct, pass: types >= 8 && top.pct <= 25, rows, endings,
    fresh: lives.filter(L => L.freshRealms > 0).length, freshNear: lives.filter(L => L.freshNear).length, tensions: lives.reduce((a, L) => a + (L.tensions || 0), 0) };
}

// ---- the lives, played in the page
const STARTS = [
  ['human', 'POL-01', 'peasant'], ['human', 'POL-05', 'serf'], ['human', 'POL-03', 'artisan'], ['human', 'POL-04', 'merchant'],
  ['human', 'POL-01', 'noble'], ['human', 'POL-02', 'royal'], ['dwarf', 'POL-20', 'artisan'], ['orc', 'POL-11', 'peasant'],
  ['elf', 'POL-06', 'gentry'], ['human', 'POL-07', 'serf'], ['human', 'POL-02', 'peasant'], ['human', 'POL-12', 'merchant'],
  ['human', 'POL-14', 'artisan'], ['human', 'POL-08', 'noble'], ['human', 'POL-16', 'peasant'], ['human', 'POL-03', 'slave'],
];
const COLLECT = () => {
  // a pure reader on the month hook: which path the life is on, which years in prison or as a sellsword
  if (!window.__cl) {
    window.__cl = { y: -1, paths: {}, prison: 0, merc: 0 };
    A.onMonth.push(pc => {
      const C = window.__cl;
      if (!pc || A.S.year === C.y) return;
      C.y = A.S.year;
      const p = A.ARCS && A.ARCS.path ? A.ARCS.path(pc) : null;
      if (p) C.paths[p] = (C.paths[p] || 0) + 1;
      if (pc.prison) C.prison++;
      if (pc.mil && pc.mil.merc) C.merc++;
    });
  }
  window.__clLife = (o, pers, engaged, years) => {
    Object.assign(window.__cl, { y: -1, paths: {}, prison: 0, merc: 0 });
    const L = B.life(o, pers, engaged, years), S = L.samples || [], pc = A.P(A.S.pc) || A.pc();
    const st = pc && pc.arcs && typeof pc.arcs === 'object' ? pc.arcs : {}, AR = A.ARCS || { ARC: {} };
    const arcs = Object.keys(st).map(k => ({ k, f: (AR.ARC[k] || {}).feature || (AR.ARC[k] && AR.ARC[k].story ? 'story' : 'life'), done: !!(st[k] && st[k].done && !st[k].gave), stage: (st[k] && st[k].stage) || 0 }));
    const end = pc ? (pc.ending || (A.endingOf ? A.endingOf(pc) : { id: '?', manner: '?' })) : { id: '?' };
    const max = k => Math.max(-1, ...S.map(s => (typeof s[k] === 'number' ? s[k] : -1)));
    const rank = s => (GD.STATUS[s] || { rank: 2 }).rank;
    const fresh = Object.values(A.S.realms).filter(r => r.alive && r.fresh);
    const home = pc && A.prov(pc.home);
    const near = !!(home && fresh.some(r => r.id === pc.realm || A.S.prov.some(P => P.owner === r.id && P.adj.some(j => A.S.prov[j] && A.S.prov[j].owner === pc.realm))));
    return {
      start: o, pers, engaged, years: L.years, deathAge: L.deathAge, cause: L.cause, ending: end.id, manner: end.manner,
      ruled: S.some(s => s.ruler) || !!(pc && (pc.ruler || pc.wasRuler)), maxMil: max('mil'), office: S.some(s => s.office),
      freed: !!(S[0] && S[0].unfree && S.length && !S[S.length - 1].unfree), startRank: rank(o.status),
      rungStart: S[0] ? S[0].rung : -1, rungMax: max('rung'), maxCoin: max('coin'), jobMax: Math.max(-1, ...S.map(s => +(String(s.job).split(':')[1] || -1))),
      kids: max('kids'), paths: Object.assign({}, window.__cl.paths), prisonYears: window.__cl.prison, mercYears: window.__cl.merc,
      arcs, kinArcs: arcs.filter(a => a.f === 'arcs-kin' && a.stage >= 2).length, storyArcs: arcs.filter(a => a.f !== 'life').length, events: L.events,
      freshRealms: fresh.length, freshNear: near, tensions: (A.S.freshTensions || []).length,
    };
  };
};

async function play(html, n, years, world, seed0) {
  const require = createRequire(import.meta.url);
  let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
  const browser = await pw.chromium.launch();
  const pg = await browser.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 300)));
  await pg.goto(pathToFileURL(html).href);
  await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
  await pg.evaluate(BOT);
  await pg.evaluate(COLLECT);
  const lives = [], t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const [race, realm, status] = STARTS[i % STARTS.length];
    const o = { seed: seed0 + i * 7919, race, realm, status, sex: i % 2 ? 'F' : 'M', startAge: 16 };
    if (world) o.world = world;
    const pers = ['careful', 'reckless', 'greedy', 'random'][Math.floor(i / 2) % 4], engaged = i % 3 !== 2;
    let L;
    try { L = await pg.evaluate(([o, p, e, y]) => window.__clLife(o, p, e, y), [o, pers, engaged, years]); } catch (e) { L = { start: o, error: String(e).slice(0, 200) }; }
    if (!L.error) lives.push(L);
    process.stdout.write(L.error ? 'x' : '.');
  }
  await browser.close();
  console.log(` ${lives.length} lives in ${Math.round((Date.now() - t0) / 1000)} s${errs.length ? `, ${errs.length} page errors: ${errs[0]}` : ''}`);
  return { lives, errors: errs.length };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  let lives, meta = {};
  if (arg('from')) ({ lives, meta } = JSON.parse(fs.readFileSync(arg('from'), 'utf8')));
  else {
    const html = path.resolve(root, process.argv.slice(2).find(a => !a.startsWith('--')) || 'index.html');
    const world = arg('world') === 'canon' ? null : (arg('world') || 'varied');
    meta = { html: path.relative(root, html), world: world || 'canon', years: +(arg('years') || 60), seed: +(arg('seed') || 9001) };
    const r = await play(html, +(arg('lives') || 100), meta.years, world, meta.seed);
    lives = r.lives; meta.errors = r.errors;
  }
  const R = report(lives);
  console.log(`${R.lives} lives, ${R.types} of ${TYPES.length} types, largest ${R.top} at ${R.topPct}% -> ${R.pass ? 'PASS' : 'FAIL'} (bar: 8 or more types, none above 25%)`);
  for (const r of R.rows) console.log(`  ${r.name.padEnd(24)} ${String(r.n).padStart(4)}  ${String(r.pct).padStart(5)}%`);
  console.log('  endings:', Object.entries(R.endings).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', '));
  if (R.fresh) console.log(`  lives in a world with fresh realms: ${R.fresh}; living in or next to one: ${R.freshNear}; starting tensions seen: ${R.tensions}`);
  if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify({ meta, report: R, lives }, null, 1));
}
