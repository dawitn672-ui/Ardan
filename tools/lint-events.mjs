// Lint and play-test new event packs.
//
//   node tools/lint-events.mjs --feature=memory-threads [--html=/tmp/x.html]
//
// Static: loads the feature's *.events.js with a stub engine and checks shape. Dynamic: opens the built page and,
// for every new event under several characters, renders it and takes every choice from a saved state, failing on
// exceptions, raw {tokens}, or text over the diet (event text 80 words, choice 12). Prints a JSON summary; exits 1 on errors.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const feature = arg('feature');
if (!feature) { console.error('usage: --feature=name [--html=path]'); process.exit(2); }
const dir = fs.readdirSync(path.join(root, 'features')).find(d => d.replace(/^\d+-/, '') === feature);
if (!dir) { console.error('no feature ' + feature); process.exit(2); }
const html = path.resolve(root, arg('html') || 'index.html');
const FX = 'str spd ins sta int wil health happy looks fame honor piety coin coinPct family skill rep masterwork promote style styleXp apt trait untrait wound flag unflag rel them newRel lover die prison punish free merit patronOp rulerOp realmStab realmGold armyXp secret epithet deed ach job perf lang literate gear asset duel beast event stability treasury legit realmRel favor mission cause why infamy authority houseOp factionDisc owed oweThem letter bossOp sworn claim pact ally warOn'.split(' ');
const words = s => (String(s).match(/\S+/g) || []).length;
const errors = [], warns = [];

// ---- static
const stub = () => new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => '' : stub(), apply: () => stub() });
const events = [];
for (const f of fs.readdirSync(path.join(root, 'features', dir)).filter(f => f.endsWith('.events.js'))) {
  const A = new Proxy({ defEvents: list => { for (const e of list) events.push(Object.assign(e, { _file: f })); } }, { get: (t, k) => k in t ? t[k] : stub() });
  try { vm.runInNewContext(fs.readFileSync(path.join(root, 'features', dir, f), 'utf8'), { A, GD: stub(), LORE: stub(), console }, { filename: f }); }
  catch (e) { errors.push(`${f}: does not load: ${e.message}`); }
}
const ids = new Set();
for (const e of events) {
  const at = `${e._file}:${e.id}`;
  if (typeof e.id !== 'string' || !/^[a-z][a-z0-9_]+$/.test(e.id)) errors.push(`${at}: bad id`);
  if (ids.has(e.id)) errors.push(`${at}: duplicate id`); ids.add(e.id);
  if (!e.title) errors.push(`${at}: no title`);
  if (!e.text) errors.push(`${at}: no text`);
  if (typeof e.text === 'string' && words(e.text) > 80) errors.push(`${at}: text ${words(e.text)} words`);
  if (!e.trigger && typeof e.cond !== 'function') warns.push(`${at}: no cond, can fire for anyone`);
  if (typeof e.cond === 'function' && !/^\s*(\(\s*p\s*(,\s*C\s*)?\)|p)\s*=>/.test(e.cond.toString())) warns.push(`${at}: cond should be (p, C) => ... using C.* helpers`);
  const ch = e.choices || [];
  if (ch.length < 2 || ch.length > 4) (ch.length ? warns : errors).push(`${at}: ${ch.length} choices`);
  ch.forEach((c, i) => {
    const ca = `${at} choice ${i + 1}`;
    if (typeof c.t === 'string' && words(c.t) > 12) errors.push(`${ca}: ${words(c.t)} words`);
    if (c.check) {
      if (typeof c.check.d !== 'number' || c.check.d < 5 || c.check.d > 90) errors.push(`${ca}: check.d ${c.check.d}`);
      if (!c.win || !c.lose) errors.push(`${ca}: check without win and lose`);
    } else if (!('r' in c) && !c.fx) warns.push(`${ca}: no result text`);
    for (const fx of [c.fx, c.win && c.win.fx, c.lose && c.lose.fx]) if (fx && typeof fx === 'object') for (const k of Object.keys(fx)) if (!FX.includes(k)) errors.push(`${ca}: unknown fx key ${k}`);
  });
}

// ---- dynamic
let dyn = null;
if (!errors.length && events.length) {
  let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
  const browser = await pw.chromium.launch();
  const pg = await browser.newPage();
  const perrs = []; pg.on('pageerror', e => perrs.push(String(e).slice(0, 200)));
  await pg.goto(pathToFileURL(html).href);
  await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
  dyn = await pg.evaluate((ids) => {
    const RAW = /\{[A-Za-z0-9_.]+\}/, w = s => (String(s || '').match(/\S+/g) || []).length;
    const out = { missing: [], checked: 0, eligibleSomewhere: {}, problems: [], skills: [] };
    // the engine catches effect errors and only logs them; collect them as failures
    let cur = '';
    const ce = console.error; console.error = (...a) => { out.problems.push(`${cur}: engine error: ${a.map(x => String(x && x.message || x)).join(' ').slice(0, 160)}`); };
    const KNOWN = new Set([...Object.keys(GD.SKILLS), ...GD.STATS]);
    for (const id of ids) { const e = A.EV[id]; if (!e) { out.missing.push(id); continue; }
      for (const c of e.choices || []) for (const s of c.check ? [c.check.s, c.check.s2] : []) if (s && !KNOWN.has(s)) out.problems.push(`${id}: unknown check skill/stat ${s}`); }
    const people = [
      { race: 'human', realm: 'POL-01', status: 'peasant', startAge: 9 }, { race: 'human', realm: 'POL-01', status: 'noble', startAge: 30 },
      { race: 'orc', realm: 'POL-11', status: 'peasant', startAge: 24 }, { race: 'human', realm: 'POL-05', status: 'merchant', startAge: 45 },
      { race: 'dwarf', realm: 'POL-20', status: 'artisan', startAge: 70 }, { race: 'human', realm: 'POL-07', status: 'serf', startAge: 66 },
      { race: 'elf', realm: 'POL-03', status: 'gentry', startAge: 120 }, { race: 'human', realm: 'POL-02', status: 'royal', startAge: 40 },
    ];
    for (const o of people) {
      A.newGame(Object.assign({ seed: 4040, sex: o.startAge % 2 ? 'F' : 'M' }, o));
      A.pc().mil = A.pc().mil || null;
      const base = A.serialize();
      for (const id of ids) {
        const e = A.EV[id]; if (!e) continue;
        let ok = true; try { ok = !e.cond || !!e.cond(A.pc(), A.C); } catch (err) { out.problems.push(`${id}: cond throws: ${err.message}`); continue; }
        if (!ok) continue;
        out.eligibleSomewhere[id] = (out.eligibleSomewhere[id] || 0) + 1;
        const nCh = (e.choices || []).length || 1;
        for (let i = 0; i < nCh; i++) {
          A.deserialize(JSON.parse(base)); A.S.queue = [];
          const q = { type: 'event', ev: id }; A.S.queue.unshift(q);
          let v; try { v = A.eventView(q); } catch (err) { out.problems.push(`${id}: view throws: ${err.message}`); break; }
          if (v.skip) { if (i === 0) out.problems.push(`${id}: eligible but skipped by the engine (unfilled token or setup failure) for ${o.race} ${o.status} ${o.startAge}`); break; }
          if (i === 0) {
            out.checked++;
            const all = [v.title, v.text, ...v.choices.map(c => c.t)].join(' | ');
            if (RAW.test(all)) out.problems.push(`${id}: raw token ${all.match(RAW)[0]}`);
            if (w(v.text) > 80) out.problems.push(`${id}: rendered text ${w(v.text)} words`);
            for (const c of v.choices) if (w(c.t) > 12) out.problems.push(`${id}: rendered choice ${w(c.t)} words`);
          }
          const idx = v.choices.findIndex(c => c.i === i); if (idx < 0) continue;
          cur = `${id} choice ${i + 1}`;
          try { A.eventChoose(idx); const r = A.S.queue[0] && A.S.queue[0].result; const rt = r ? (r.text || r.r || JSON.stringify(r)).slice(0, 400) : '';
            if (RAW.test(rt)) out.problems.push(`${id} choice ${i + 1}: raw token in result`); A.eventClose(); }
          catch (err) { out.problems.push(`${id} choice ${i + 1}: throws: ${err.message}`); }
        }
      }
    }
    console.error = ce;
    out.problems = [...new Set(out.problems)];
    return out;
  }, [...ids]);
  dyn.pageErrors = perrs.slice(0, 5);
  await browser.close();
  for (const m of dyn.missing) errors.push(`${m}: not registered in the built page (is the feature in the build?)`);
  for (const p of dyn.problems) errors.push(p);
  for (const p of dyn.pageErrors) errors.push('page error: ' + p);
  const never = [...ids].filter(i => !dyn.eligibleSomewhere[i] && !events.find(e => e.id === i).trigger);
  if (never.length) warns.push(`${never.length} events were not eligible for any of the 8 test characters (fine if their cond needs history): ${never.slice(0, 12).join(', ')}`);
}
const summary = { feature, events: events.length, checkedInBrowser: dyn ? dyn.checked : 0, errors, warnings: warns };
console.log(JSON.stringify(summary, null, 1));
process.exit(errors.length ? 1 : 0);
