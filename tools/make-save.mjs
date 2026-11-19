// Make a sample save of a build, for tests/saves/ (every version keeps one, D-134 and D-141; tests/suites/saves.test.mjs
// loads them all after every change, so an old save that stops loading fails CI).
//
//   node tools/make-save.mjs [built.html] --out=tests/saves/v2.1.0-noble.ardan [--status=noble] [--realm=POL-01]
//                            [--race=human] [--sex=M] [--age=20] [--years=3] [--seed=77]
//   node tools/make-save.mjs [built.html] --out=tests/saves/<v>-<recipe>.ardan --recipe=<name> [--recipes=tools/version-samples.json]
//
// The life is played by code (the bot answers every card), then saved with the build's own SAVES.encode, exactly the
// bytes "Save to file" would write. With --recipe (D-141, order 67) the life is a named scenario from
// tools/version-samples.json, played to a moment where a version's change is in play: the worlds of its seeds are tried
// in turn, the life is taken on as the realm's ruler or a landed lord when the recipe says so, and the save is made the
// moment its card waits (before the bot would answer it), so whoever loads it meets that card first.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const file = path.resolve(root, args.find(a => !a.startsWith('--')) || 'index.html');
const out = opt('out');
if (!out) { console.error('usage: node tools/make-save.mjs [built.html] --out=tests/saves/<name>.ardan [--recipe=<name> | --status=noble ...]'); process.exit(2); }
let R;
if (opt('recipe')) {
  const all = JSON.parse(fs.readFileSync(path.resolve(root, opt('recipes', 'tools/version-samples.json')), 'utf8')).recipes;
  R = all[opt('recipe')];
  if (!R) { console.error(`no recipe "${opt('recipe')}" (${Object.keys(all).join(', ')})`); process.exit(2); }
} else {
  R = { o: { race: opt('race', 'human'), realm: opt('realm', 'POL-01'), status: opt('status', 'noble'), sex: opt('sex', 'M'), startAge: +opt('age', 20) },
    seeds: [+opt('seed', 77)], until: 'any', years: +opt('years', 3) };
}

// in the page: one world of the recipe; the moment reached and the save as base64, or null
const PLAY = async ([R, seed]) => {
  A.newGame(Object.assign({}, R.o, { seed })); UI.screen = 'game'; UI.render();
  const pc0 = A.pc(), realm = A.realm(pc0.realm);
  if (R.as === 'ruler') {
    const ru = realm && A.P(realm.ruler);
    if (!ru || !ru.alive) return { miss: 'no living ruler' };
    if (ru.id !== pc0.id) { A.continueAs(ru.id); UI.ov = null; }
  } else if (R.as === 'lord') {
    const head = p => { const h = p.house && A.S.houses && A.S.houses[p.house]; return !!h && h.headPid === p.id; };
    const R2 = p => (GD.RACES[p.race] || GD.RACES.human).adult;
    const lords = Object.values(A.S.people).filter(p => p.alive && p.realm === pc0.realm && !p.ruler && p.noble && p.noble.holding != null && head(p) && A.age(p) >= R2(p) + 4)
      .sort((a, b) => (b.noble.rung || 0) - (a.noble.rung || 0) || (a.id < b.id ? -1 : 1));
    if (!lords.length) return { miss: 'no landed lord' };
    A.continueAs(lords[0].id); UI.ov = null;
  }
  const at = {
    any: () => false,
    summoned: () => A.S.queue.some(q => q && q.ev === 'cm_summons'),
    peaceTable: () => !!(A.pc() && A.pc().ruler) && A.S.queue.some(q => q && q.warCard != null),
  }[R.until || 'any'];
  if (!at) return { err: 'no such moment: ' + R.until };
  const end = A.S.year + R.years;
  let hit = false;
  for (let g = 0; g < 20000 && A.S.year < end && !hit; g++) {
    A.advance(30); let h, k = 0;
    while (!(hit = at()) && (h = A.headReady()) && k++ < 500) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
    if (!A.pc() || !A.pc().alive) return { miss: `${A.pc() ? A.pc().given : 'the life'} died in ${A.S.year}` };
  }
  if (R.until !== 'any' && !hit) return { miss: `not reached by ${A.S.year}` };
  const pc = A.pc();
  const B = (await SAVES.encode(A.S, A.J)).bytes;
  let s = ''; for (let i = 0; i < B.length; i += 8192) s += String.fromCharCode.apply(null, B.subarray(i, i + 8192));
  return { b64: btoa(s), year: A.S.year, who: `${A.fullName ? A.fullName(pc, false) : pc.given}, ${A.age(pc)}`, waits: (A.S.queue[0] && (A.S.queue[0].ev || A.S.queue[0].title)) || '' };
};

const browser = await pw.chromium.launch();
try {
  let res = null, seed = null;
  for (const s of R.seeds || [77]) {
    const pg = await browser.newPage();
    try {
      await pg.goto(pathToFileURL(file).href);
      // every event pack loaded (a build that names no such moment, the release as uploaded: its events defined)
      await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 })
        .catch(() => pg.waitForFunction(() => typeof A !== 'undefined' && A.EV && Object.keys(A.EV).length > 100, null, { timeout: 60000 }));
      res = await pg.evaluate(PLAY, [R, s]);
    } finally { await pg.close(); }
    if (res && res.err) { console.error(res.err); process.exit(2); }
    if (res && res.b64) { seed = s; break; }
    console.log(`seed ${s}: ${res ? res.miss : 'nothing'}; the next world`);
    res = null;
  }
  if (!res) { console.error(`no world of seeds ${(R.seeds || []).join(', ')} reached "${R.until}"`); process.exit(1); }
  const dest = path.resolve(root, out);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(res.b64, 'base64'));
  console.log(`${path.relative(root, dest)}: seed ${seed}, ${res.who} in ${res.year}${res.waits ? `, waiting: ${res.waits}` : ''}, ${(fs.statSync(dest).size / 1024).toFixed(0)} KB`);
} finally { await browser.close(); }
