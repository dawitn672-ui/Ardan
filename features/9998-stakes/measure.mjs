// 9998-stakes: how many choices show their stakes, over real lives.
//
//   node features/9998-stakes/measure.mjs <built.html> [--lives=8] [--events=60] [--json=out.json]
//
// Plays lives from eight starts (peasant, noble, merchant, soldier, ruler, child, elf, orc), and draws every scene that
// comes up as the player sees it (UI.render, the scene card included), then lets the bot choose (A.eventAuto). For each
// choice row it records whether the row says what the choice stakes: a stake line or chips (.lf-stake, .st-row) or one
// of 92's effect hints (.sc-hint). It counts the same on any build, so a build without this feature gives the "before".
// Also: the choices a scene held out of reach and drew with a reason, the red and white checks marked, and how many
// rows changed nothing at all (no effect, no check), which have no stakes to show.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const file = path.resolve(args.find(a => !a.startsWith('--')) || 'index.html');
const LIVES = +opt('lives', 8), PER = +opt('events', 60);
const STARTS = [
  { seed: 9101, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 },
  { seed: 9102, race: 'human', realm: 'POL-02', status: 'noble', sex: 'F', startAge: 18 },
  { seed: 9103, race: 'human', realm: 'POL-03', status: 'merchant', sex: 'M', startAge: 20 },
  { seed: 9104, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 22 },
  { seed: 9105, race: 'human', realm: 'POL-05', status: 'noble', sex: 'M', startAge: 30 },
  { seed: 9106, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 6 },
  { seed: 9107, race: 'elf', realm: 'POL-10', status: 'peasant', sex: 'F', startAge: 60 },
  { seed: 9108, race: 'orc', realm: 'POL-11', status: 'peasant', sex: 'M', startAge: 18 },
];

const b = await pw.chromium.launch();
const pg = await b.newPage({ viewport: { width: 1366, height: 768 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await pg.goto(pathToFileURL(file).href);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
const out = await pg.evaluate(({ STARTS, LIVES, PER }) => {
  const R = { lives: 0, events: 0, rows: 0, rowsStake: 0, rowsActive: 0, rowsActiveStake: 0, checks: 0, checksFail: 0, red: 0, white: 0,
    silent: [], locked: 0, lockedReq: 0, lockedWhite: 0, lockedRed: 0, again: 0, hiddenReq: 0, hiddenReqWhy: 0, pure: true, samples: [] };
  const hasFx = c => !!c && (c.check || c.group || (c.fx && (typeof c.fx === 'function' || Object.keys(c.fx).length)));
  for (const o of STARTS.slice(0, LIVES)) {
    A.newGame(o); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.set.hints = false;
    if (UI.MOMENTS) { UI.set.cutins = false; UI.MOMENTS.skip && UI.MOMENTS.skip(); }
    document.documentElement.dataset.motion = 'off';
    R.lives++;
    let seen = 0;
    for (let g = 0; g < 20000 && seen < PER; g++) {
      const h = A.headReady();
      if (h && h.type === 'event') {
        if (h.result) { A.eventClose(); continue; }
        const v = A.eventView(h);
        if (!v || v.skip) { A.eventAuto(); continue; }
        const e = A.EV[h.ev] || {};
        const rng0 = A.rngState;
        UI.render();
        if (A.rngState !== rng0) R.pure = false;
        const m = document.getElementById('modal');
        const btns = m ? [...m.querySelectorAll('button[data-a="evChoose"]')] : [];
        R.events++; seen++;
        for (const bt of btns) {
          const vc = v.choices[+bt.dataset.v], c = vc && vc.i >= 0 && e.choices ? e.choices[vc.i] : null;
          const stake = !!bt.querySelector('.lf-stake, .st-row, .sc-hint') && /\S/.test([...bt.querySelectorAll('.lf-stake, .st-row, .sc-hint')].map(x => x.textContent).join(''));
          R.rows++; if (stake) R.rowsStake++;
          if (hasFx(c)) { R.rowsActive++; if (stake) R.rowsActiveStake++; else if (R.silent.length < 40) R.silent.push(`${h.ev}: ${vc.t} :: ${typeof c.fx === 'function' ? String(c.fx).slice(0, 120) : JSON.stringify(c.fx || {}).slice(0, 120)}`); }
          if (c && (c.check || c.group)) {
            R.checks++;
            const lf = [...bt.querySelectorAll('.lf-stake, .st-row')].map(x => x.textContent).join(' ');
            if (/If it fails|Nothing lost/.test(lf)) R.checksFail++;
          }
          if (bt.classList.contains('sc-red') || bt.querySelector('.st-red')) R.red++;
          if (bt.classList.contains('sc-white') || bt.querySelector('.st-white')) R.white++;
          if (bt.querySelector('.st-again')) R.again++;
          if (R.samples.length < 40 && stake && (seen % 5 === 0)) R.samples.push(`${h.ev}: ${vc.t} => ${[...bt.querySelectorAll('.lf-stake, .st-row, .sc-hint')].map(x => x.textContent).join(' | ')}`);
        }
        const shown = new Set(v.choices.map(x => x.i));
        (e.choices || []).forEach((c, i) => { if (!shown.has(i) && c && c.req) R.hiddenReq++; });
        for (const L of (m ? m.querySelectorAll('.st-lock') : [])) {
          R.locked++;
          if (L.classList.contains('st-lock-req')) { R.lockedReq++; R.hiddenReqWhy++; }
          if (L.classList.contains('st-lock-white')) R.lockedWhite++;
          if (L.classList.contains('st-lock-red')) R.lockedRed++;
          if (R.samples.length < 60) R.samples.push(`LOCKED ${h.ev}: ${L.textContent}`);
        }
        A.eventAuto();
        continue;
      }
      if (h) { if (A.skipPrompt) A.skipPrompt(); else A.S.queue.shift(); continue; }
      if (!A.pc() || !A.pc().alive) break;
      A.advance(31);
    }
  }
  A.S.queue = []; UI.render();
  return R;
}, { STARTS, LIVES, PER });
await b.close();
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : '-');
const res = Object.assign({ file: path.basename(file), errors: errs.slice(0, 5) }, out, {
  shareAll: pct(out.rowsStake, out.rows), shareActive: pct(out.rowsActiveStake, out.rowsActive), checksFailShown: pct(out.checksFail, out.checks),
  hiddenReqExplained: pct(out.hiddenReqWhy, out.hiddenReq) });
if (opt('json')) fs.writeFileSync(opt('json'), JSON.stringify(res, null, 1));
const { samples, silent, ...head } = res;
console.log(JSON.stringify(head, null, 1));
if (args.includes('--samples')) console.log(samples.join('\n') + '\n-- rows that change something and show nothing --\n' + silent.join('\n'));
