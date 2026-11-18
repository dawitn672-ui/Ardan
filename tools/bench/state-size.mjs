// The state's size and what grows with the years (X5, the state diet; docs/IOS_ROADMAP.md §7.7, rule 21).
//
//   node tools/bench/state-size.mjs [built.html] [--seed=7] [--status=noble] [--sex=M] [--age=16] [--realm=POL-01]
//        [--years=100] [--at=0,25,50,75,100] [--json=out.json] [--dump=dir] [--top=12]
//   node tools/bench/state-size.mjs [built.html] --state=dir/x-y50-state.json [--json=out.json]   (one dumped state, no play)
//
// Plays one life with the engine's own bot (as long-life-audit.mjs: every card answered by A.eventAuto, the eldest
// living child or a young person of the realm taken on after a death) and at each year of --at reads A.S: the raw JSON
// (A.serialize), the packed state a save stores (A.packState), the gzipped save SAVES.encode writes (state and journal),
// and a breakdown: every top-level key; people alive and dead, and per field for each; realms per field; the biggest
// children of every key over 20 KB. --dump writes <dir>/<tag>-y<n>-state.json and -journal.json at each point, so a
// compaction can be measured on the same states without playing again. Reading draws nothing and changes nothing.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { watchPage } from '../lib/page-errors.mjs';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const arg = (k, d) => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const HTML = path.resolve(args.find(a => !a.startsWith('--')) || path.join(root, 'index.html'));
const O = { seed: +arg('seed', 7), status: arg('status', 'noble'), sex: arg('sex', 'M'), startAge: +arg('age', 16), realm: arg('realm', 'POL-01'), race: 'human' };
const YEARS = +arg('years', 100), AT = arg('at', '0,25,50,75,100').split(',').map(Number).filter(n => n <= YEARS);
const JSONOUT = arg('json', null), DUMP = arg('dump', null), TOP = +arg('top', 12), STATE = arg('state', null);
const TAG = arg('tag', `${O.status}-s${O.seed}`);
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${TAG}: ` + a.join(' '));

// in the page: the breakdown of A.S (pure: reads only)
const MEASURE = async top => {
  const S = A.S, len = v => { const s = JSON.stringify(v); return s === undefined ? 0 : s.length; };
  const kb = n => Math.round(n / 102.4) / 10;
  const raw = A.serialize(), packed = JSON.stringify(A.packState ? A.packState(S) : S);
  S.rng = A.rngState;
  const enc = await SAVES.encode(S, A.J);
  const journal = JSON.stringify(A.J || null).length;
  const keys = {}; for (const k of Object.keys(S)) keys[k] = len(S[k]);
  // per-field sizes over a set of records ("k":value, each)
  const fields = recs => { const f = {}; for (const r of recs) if (r && typeof r === 'object') for (const k of Object.keys(r)) f[k] = (f[k] || 0) + k.length + 3 + len(r[k]); return f; };
  const topOf = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => [k, kb(v)]);
  const ppl = Object.values(S.people || {}), alive = ppl.filter(p => p.alive), dead = ppl.filter(p => !p.alive);
  const rlm = Object.values(S.realms || {});
  // children of every big key
  const kids = {};
  for (const k of Object.keys(S)) if (keys[k] > 20480 && S[k] && typeof S[k] === 'object' && !['people', 'realms'].includes(k)) {
    const c = {}; if (Array.isArray(S[k])) c['[' + S[k].length + ' items]'] = keys[k]; else for (const j of Object.keys(S[k])) c[j] = len(S[k][j]);
    kids[k] = topOf(c, top);
  }
  // inside people's biggest object fields: the keys of flags, rel, mem, ...
  const inner = {};
  for (const f of ['flags', 'rel', 'mem', 'v2', 'deeds', 'skx']) {
    const c = {}; let any = false;
    for (const p of ppl) { const v = p[f]; if (v && typeof v === 'object' && !Array.isArray(v)) for (const j of Object.keys(v)) { any = true; const jj = /^\d+$/.test(j) ? '<id>' : j; c[jj] = (c[jj] || 0) + j.length + 3 + len(v[j]); } }
    if (any) inner[f] = topOf(c, top);
  }
  const rInner = {};
  for (const r of rlm) for (const k of Object.keys(r)) { const v = r[k]; if (v && typeof v === 'object' && !Array.isArray(v)) { const c = rInner[k] = rInner[k] || {}; for (const j of Object.keys(v)) { const jj = /^\d+$/.test(j) ? '<id>' : /^[A-Z]{3}-\d+/.test(j) ? '<realm>' : j; c[jj] = (c[jj] || 0) + j.length + 3 + len(v[j]); } } }
  const rFields = fields(rlm);
  const rInnerTop = {}; for (const k of Object.keys(rInner)) if (rFields[k] > 10240) rInnerTop[k] = topOf(rInner[k], 8);
  return {
    year: S.year, rawKB: kb(raw.length), packedKB: kb(packed.length), saveGzKB: kb(enc.bytes.length), journalKB: kb(journal),
    people: { n: ppl.length, alive: alive.length, dead: dead.length, aliveKB: kb(len(alive)), deadKB: kb(len(dead)) },
    realms: { n: rlm.length, alive: rlm.filter(r => r.alive).length },
    keys: topOf(keys, 40), peopleAlive: topOf(fields(alive), top + 8), peopleDead: topOf(fields(dead), top + 8),
    realmFields: topOf(rFields, top + 8), realmInner: rInnerTop, peopleInner: inner, children: kids,
  };
};

const print = m => {
  log(`year ${m.year}: raw ${m.rawKB} KB, packed ${m.packedKB} KB, save gz ${m.saveGzKB} KB (journal ${m.journalKB} KB); people ${m.people.n} (${m.people.alive} alive ${m.people.aliveKB} KB, ${m.people.dead} dead ${m.people.deadKB} KB); realms ${m.realms.n} (${m.realms.alive} alive)`);
  const row = (t, a) => console.log('  ' + t.padEnd(14) + a.map(([k, v]) => `${k} ${v}`).join(', '));
  row('keys', m.keys.slice(0, 24));
  row('people alive', m.peopleAlive); row('people dead', m.peopleDead); row('realms', m.realmFields);
  for (const [k, v] of Object.entries(m.realmInner)) row('realm.' + k, v);
  for (const [k, v] of Object.entries(m.peopleInner)) row('person.' + k, v);
  for (const [k, v] of Object.entries(m.children)) row(k, v);
};

async function main() {
  const browser = await pw.chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); page.setDefaultTimeout(3600000);
  const errs = []; watchPage(page, errs);
  await page.goto(pathToFileURL(HTML).href);
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 600000 });
  const out = { html: HTML, o: O, points: [], errors: errs };
  if (STATE) {
    const s = fs.readFileSync(path.resolve(STATE), 'utf8');
    await page.evaluate(s => { A.deserialize(s); A.journalResume(null); }, s);
    const m = await page.evaluate(MEASURE, TOP); print(m); out.points.push(m);
  } else {
    await page.evaluate(o => { A.newGame(o); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); }, O);
    const y0 = await page.evaluate(() => A.S.year);
    if (DUMP) fs.mkdirSync(DUMP, { recursive: true });
    for (const at of AT) {
      const r = await page.evaluate(end => {
        const notes = []; let cards = 0;
        for (let guard = 0; guard < 40000 && A.S.year < end; guard++) {
          const r = A.advance(400); let h, g = 0;
          while ((h = A.headReady()) && g++ < 500) { if (h.type === 'event') { A.eventView(h); A.eventAuto(); cards++; } else A.skipPrompt(); }
          const pc = A.pc();
          if (r.why === 'dead' || !pc || !pc.alive) {
            const P = id => A.S.people[id];
            const k2 = ((pc && pc.children) || []).map(P).filter(p => p && p.alive).sort((x, y) => A.age(y) - A.age(x))[0] || Object.values(A.S.people).find(p => p.alive && pc && p.realm === pc.realm && A.age(p) >= 16 && A.age(p) <= 30);
            notes.push(`${A.S.year}: ${pc ? pc.given : '?'} died; continued as ${k2 ? k2.given : 'nobody'}`);
            if (k2) { A.continueAs(k2.id); UI.ov = null; } else return { notes, cards, dead: true };
          }
        }
        return { notes, cards, year: A.S.year };
      }, y0 + at);
      for (const n of r.notes) log('note', n);
      const m = await page.evaluate(MEASURE, TOP); m.at = at; m.fp = await page.evaluate(() => A.fingerprint()); print(m); out.points.push(m);
      if (DUMP) {
        const d = await page.evaluate(() => ({ s: A.serialize(), j: JSON.stringify(A.J) }));
        fs.writeFileSync(path.join(DUMP, `${TAG}-y${at}-state.json`), d.s); fs.writeFileSync(path.join(DUMP, `${TAG}-y${at}-journal.json`), d.j);
      }
      if (r.dead) break;
    }
  }
  log(`errors ${errs.length}${errs.length ? ': ' + errs[0].slice(0, 200) : ''}`);
  if (JSONOUT) fs.writeFileSync(JSONOUT, JSON.stringify(out, null, 1));
  await browser.close();
  process.exitCode = errs.length ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e => { log('FATAL', e.stack || e); process.exit(1); });
