// A monkey that plays the built game through its own screens and records every error a player could meet.
//
//   node tools/soak.mjs [index.html] [--runs=8] [--steps=600] [--seed=1] [--json=reports/soak.json] [--workers=2]
//
// Each run opens a fresh page, starts a life from the title screen and then, step by step, either clicks a visible
// button or link at random (the way a curious new player would), or lets time pass (A.advance, as the clock would).
// It plays on through deaths and new lives. It records:
//   pageerror   an uncaught exception or rejected promise
//   console     any console.error (features catch their own faults and report them this way, so the browser tests,
//               which watch only uncaught errors, never see them)
//   request     a file the page failed to load (a font, an image)
//   text        words a player would see that are broken: "undefined", "NaN", "[object Object]", an unfilled {token}
// The clicks are drawn from a seeded generator on the Node side, so a run replays exactly: the same --seed and run
// number give the same clicks against the same build. Exit code 1 if anything was found.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = k => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const file = path.resolve(root, args.find(a => !a.startsWith('--')) || 'index.html');
const RUNS = +(opt('runs') || 8), STEPS = +(opt('steps') || 600), SEED = +(opt('seed') || 1), WORKERS = +(opt('workers') || 2);
const jsonOut = opt('json');
const ONLY_RUN = opt('run') != null ? +opt('run') : null;   // replay one run exactly (its clicks depend only on --seed and its number)

const rng = s => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// actions a monkey must not take: they leave the page or wait on the operating system
const SKIP = new Set(['import', 'modLoad']);
const BAD_TEXT = /\bundefined\b|\bNaN\b|\[object Object\]|\{[a-z][a-zA-Z0-9]*\}|\bnull\b(?! and void)/;

const STARTS = [
  { race: 'human', realm: 'POL-01', status: 'peasant' }, { race: 'human', realm: 'POL-01', status: 'noble' },
  { race: 'human', realm: 'POL-05', status: 'merchant' }, { race: 'human', realm: 'POL-07', status: 'serf' },
  { race: 'human', realm: 'POL-02', status: 'royal' }, { race: 'orc', realm: 'POL-11', status: 'peasant' },
  { race: 'dwarf', realm: 'POL-20', status: 'artisan' }, { race: 'elf', realm: 'POL-03', status: 'peasant' },
  { race: 'human', realm: 'POL-13', status: 'peasant' }, { race: 'human', realm: 'POL-24', status: 'noble' },
  { race: 'human', realm: 'POL-30', status: 'merchant' }, { race: 'human', realm: 'POL-04', status: 'royal' },
];
// in the page: draw every tab, open a dozen people and the War Room's tabs, and return any broken words seen
const SWEEP = rx => {
  const R = new RegExp(rx.src), bad = [];
  const look = where => { const tx = document.body.innerText || ''; const m = tx.match(R); if (m) bad.push(where + ': ' + tx.slice(Math.max(0, m.index - 80), m.index + 60).replace(/\s+/g, ' ')); };
  let n = 0;
  if (UI.screen !== 'game' || !A.S || !A.pc()) return { bad, n };
  const keep = { tab: UI.tab, ov: UI.ov };
  const tabs = (UI.GROUPS || []).flatMap(g => g.subs.map(x => x[0]));
  for (const t of tabs) { UI.ov = null; UI.tab = t; UI.render(); look('tab ' + t); n++; }
  const ppl = Object.values(A.S.people).filter(p => p && p.alive && p.id !== A.S.pc).slice(0, 12);
  for (const p of ppl) { if (UI.A.ov) { UI.A.ov(p.id); look('person ' + p.id); n++; } }
  UI.ov = null;
  if (UI.warRoomOpen && UI.wrTabs && A.cmdRole) { try { UI.warRoomOpen(); for (const t of UI.wrTabs(A.cmdRole(A.pc()))) { UI.wr.tab = t.k; UI.wr.sel = null; UI.render(); look('war room ' + t.k); n++; } } finally { UI.ov = null; } }
  UI.tab = keep.tab; UI.ov = null; UI.render();
  return { bad: bad.slice(0, 5), n };
};

async function oneRun(browser, run) {
  const R = rng(SEED * 1000 + run);
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: run % 3 === 2 ? { width: 390, height: 844 } : { width: 1280, height: 800 } });
  const pg = await ctx.newPage();
  const found = [];
  let step = 0, last = 'boot';
  const add = (kind, msg) => found.push({ kind, msg: String(msg).slice(0, 400), run, step, after: last });
  pg.on('pageerror', e => add('pageerror', e.stack || e));
  pg.on('console', m => { if (m.type() === 'error') add('console', m.text()); });
  pg.on('requestfailed', r => add('request', r.url().slice(0, 160) + ' ' + ((r.failure() || {}).errorText || '')));
  pg.on('dialog', d => (R() < .5 ? d.accept() : d.dismiss()).catch(() => {}));
  pg.on('filechooser', fc => fc.setFiles([]).catch(() => {}));
  await pg.goto(pathToFileURL(file).href);
  await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
  let lives = 0, years0 = null, maxYear = 0, sweeps = 0, screens = 0, clicks = 0;
  // half the runs start from the title screen like a player; the other half begin a chosen life (every people and
  // rank, any age, any difficulty) so the monkey reaches what a random first life rarely does
  if (run % 2) {
    const s = STARTS[Math.floor(R() * STARTS.length)];
    const o = Object.assign({ seed: 1000 + run * 77 + SEED, sex: R() < .5 ? 'M' : 'F', startAge: 16 + Math.floor(R() * 30), diff: ['story', 'hard', 'realism'][Math.floor(R() * 3)] }, s);
    last = 'start ' + JSON.stringify(o);
    await pg.evaluate(o => { A.newGame(o); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); }, o).catch(e => add('harness', e));
  }
  for (step = 0; step < STEPS; step++) {
    // now and then, look at everything: every tab, a dozen people, the War Room, checking the words on each
    if (step % 40 === 39) { last = 'sweep'; const r = await pg.evaluate(SWEEP, { src: BAD_TEXT.source }).catch(e => ({ err: String(e) })); if (r && r.err) add('harness', r.err); if (r && r.n) { sweeps++; screens += r.n; } for (const b of (r && r.bad) || []) add('text', b); continue; }
    const st = await pg.evaluate(() => ({ screen: UI.screen, q: A.S && A.S.queue ? A.S.queue.length : 0, ov: !!UI.ov, year: A.S && A.S.year,
      alive: !!(A.S && A.pc && A.pc() && A.pc().alive) })).catch(e => ({ err: String(e) }));
    if (st.err) { add('harness', st.err); break; }
    if (st.year) { maxYear = Math.max(maxYear, st.year); if (years0 == null) years0 = st.year; }
    // let time pass now and then, when nothing is waiting on the player
    if (st.screen === 'game' && st.alive && !st.q && !st.ov && R() < .35) {
      const days = 5 + Math.floor(R() * 90);
      last = `advance ${days}`;
      await pg.evaluate(d => { A.advance(d); UI.render(); }, days).catch(e => add('harness', e));
      continue;
    }
    const targets = await pg.evaluate(() => {
      const vis = el => { const r = el.getBoundingClientRect(); if (!r.width || !r.height) return false; const s = getComputedStyle(el); return s.visibility !== 'hidden' && s.display !== 'none' && !el.disabled && !el.closest('[aria-hidden="true"]'); };
      return [...document.querySelectorAll('[data-a], button, select, [data-tt]')].filter(vis).map((el, i) => { el.setAttribute('data-soak', i); return { i, a: el.getAttribute('data-a') || (el.tagName === 'SELECT' ? 'select' : el.hasAttribute('data-tt') ? 'tt:' + el.getAttribute('data-tt') : el.tagName.toLowerCase()), v: (el.getAttribute('data-v') || '').slice(0, 40), sel: el.tagName === 'SELECT' ? el.options.length : 0 }; });
    }).catch(e => { add('harness', e); return []; });
    const pool = targets.filter(t => !SKIP.has(t.a));
    if (!pool.length) { last = 'nothing to click'; await pg.evaluate(() => UI.render()).catch(() => {}); continue; }
    // an open event, battle or duel wants an answer: answer it more often than wandering off
    const answer = pool.filter(t => /^(evChoose|qChoice|mChoose|bAuto|duelAuto|cAuto|mAuto|evClose|bClose|duelClose|cClose|mClose|qClose|closeOv|continue|startLife|randomLife|contAs|newLife)$/.test(t.a));
    const t = answer.length && R() < .6 ? answer[Math.floor(R() * answer.length)] : pool[Math.floor(R() * pool.length)];
    last = `${t.a}${t.v ? ' ' + t.v : ''}`; clicks++;
    if (t.a === 'newLife' || t.a === 'randomLife' || t.a === 'startLife') lives++;
    try {
      if (t.a === 'select') await pg.selectOption(`[data-soak="${t.i}"]`, { index: Math.floor(R() * Math.max(1, t.sel)) }, { timeout: 3000 });
      else await pg.click(`[data-soak="${t.i}"]`, { timeout: 3000, force: true });
    } catch (e) { if (!/detached|not attached|Timeout|intercepts|not visible|outside of the viewport/.test(String(e))) add('harness', e); }
    if (step % 10 === 0) {
      const bad = await pg.evaluate(rx => {
        const R = new RegExp(rx.src, rx.fl), tx = document.body.innerText || ''; const m = tx.match(R); if (!m) return null; const i = m.index;
        // the innermost element whose text holds it, named by id, class and data-a, so the finding says where it is
        let el = [...document.querySelectorAll('body *')].filter(e => R.test(e.innerText || '')).pop();
        const path = []; for (let e = el; e && e !== document.body && path.length < 6; e = e.parentElement) path.push(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : ''));
        return tx.slice(Math.max(0, i - 80), i + 60).replace(/\s+/g, ' ') + '  [in ' + path.reverse().join(' > ') + ']';
      }, { src: BAD_TEXT.source, fl: '' }).catch(() => null);
      if (bad) add('text', bad);
    }
  }
  await ctx.close();
  return { run, found, lives, years: years0 == null ? 0 : maxYear - years0, sweeps, screens, clicks };
}

const browser = await pw.chromium.launch();
const queue = ONLY_RUN != null ? [ONLY_RUN] : Array.from({ length: RUNS }, (_, i) => i), out = [];
await Promise.all(Array.from({ length: Math.min(WORKERS, RUNS) }, async () => {
  while (queue.length) { const r = queue.shift(); const res = await oneRun(browser, r).catch(e => ({ run: r, found: [{ kind: 'harness', msg: String(e).slice(0, 300), run: r }], lives: 0, years: 0 })); out.push(res); process.stdout.write(`run ${r}: ${res.found.length} found; ${res.clicks} clicks, ${res.years} game years, ${res.sweeps} sweeps (${res.screens} screens drawn)\n`); }
}));
await browser.close();
const all = out.flatMap(r => r.found);
const byMsg = {};
for (const f of all) { const k = f.kind + ' | ' + f.msg.split('\n')[0].replace(/\d+/g, '#').slice(0, 160); (byMsg[k] = byMsg[k] || { n: 0, first: f }).n++; }
const groups = Object.entries(byMsg).sort((a, b) => b[1].n - a[1].n);
console.log(`\n${RUNS} runs x ${STEPS} steps: ${all.length} findings in ${groups.length} kinds`);
for (const [k, g] of groups) console.log(`${String(g.n).padStart(4)}  ${k}\n      run ${g.first.run} step ${g.first.step} after "${g.first.after}": ${g.first.msg.replace(/\s+/g, ' ').slice(0, 300)}`);
if (jsonOut) fs.writeFileSync(path.resolve(root, jsonOut), JSON.stringify({ file: path.relative(root, file), runs: RUNS, steps: STEPS, seed: SEED, total: all.length, groups: groups.map(([k, g]) => ({ k, n: g.n, first: g.first })), runsOut: out.map(r => ({ run: r.run, years: r.years, clicks: r.clicks, sweeps: r.sweeps, screens: r.screens, n: r.found.length })) }, null, 1));
process.exitCode = all.length ? 1 : 0;
