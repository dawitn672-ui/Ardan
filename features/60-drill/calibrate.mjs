// The drill's calibration bench (Road to Ten, War 4). Two counterfactuals, each "same seed, change only drill":
//  1. Line battles with hand-set troops, fought on fixed seeds: the same men, the same random stream, the drill moved.
//     Each counter is pooled over many fights at odds that vary with the seed, in five blocks for the spread.
//  2. Real war-map fights frozen at their start (bench/rankfx-lab.mjs, as 44-rank-battles measured War 1): every
//     division on the player's side set to one drill level, the fight run out.
//   node features/60-drill/calibrate.mjs <built.html> [--n=200] [--fights=40] [--json=/tmp/ardan/drill/cal.json]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DRILL_LAB } from './lab.mjs';
import { RANKFX_LAB } from '../../bench/rankfx-lab.mjs';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const opt = k => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const file = path.resolve(process.argv.slice(2).find(a => !a.startsWith('--')) || path.join(root, 'index.html'));
const N = +(opt('n') || 200), FIGHTS = +(opt('fights') || 40);

const browser = await pw.chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(file).href);
await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
await page.evaluate(DRILL_LAB);
await page.evaluate(RANKFX_LAB);
const line = process.argv.includes('--map-only') ? null : await page.evaluate(n => {
  A.newGame({ seed: 23, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
  const L = DRLAB.line, R = DRLAB.rec, out = {};
  // an arm: pooled over n fights in five blocks; seeds and odds are the same for every arm of a counter
  const arm = mk => {
    const blocks = [];
    for (let b = 0; b < 5; b++) {
      let w = 0, dA = 0, dB = 0; const per = Math.floor(n / 5);
      for (let j = 0; j < per; j++) { const i = b * per + j, B = DRLAB.fight(mk(i), 7000 + i); if (B.winner === 'A') w++; dA += B.dead.A; dB += B.dead.B; }
      blocks.push({ win: w / per, dA: dA / per, dB: dB / per });
    }
    const m = f => blocks.reduce((a, x) => a + f(x), 0) / blocks.length;
    return { win: m(x => x.win), dA: m(x => x.dA), dB: m(x => x.dB), blocks };
  };
  const gap = (a, b) => {   // a against b: win-rate points, and the change in A's and B's dead; with the spread over blocks
    const dw = a.blocks.map((x, i) => 100 * (x.win - b.blocks[i].win)), dd = a.blocks.map((x, i) => 100 * (x.dA / b.blocks[i].dA - 1));
    const lo = xs => Math.round(Math.min(...xs)), hi = xs => Math.round(Math.max(...xs));
    return { win: Math.round(100 * (a.win - b.win)), winSpread: [lo(dw), hi(dw)], deadA: Math.round(100 * (a.dA / b.dA - 1)), deadASpread: [lo(dd), hi(dd)], deadB: Math.round(100 * (a.dB / b.dB - 1)),
      a: { win: Math.round(100 * a.win), dA: Math.round(a.dA), dB: Math.round(a.dB) }, b: { win: Math.round(100 * b.win), dA: Math.round(b.dA), dB: Math.round(b.dB) } };
  };
  // 1. a shield wall of spearmen (450 to 800 a wing) against couched lances (300 heavy horse a wing)
  const wall = (tac, v) => i => ({ a: L('SP', 450 + (i * 37) % 350, tac), b: L('HC', 300, 'lance'), dlA: v == null ? null : R(v), dlB: R(0.4) });
  const wD = arm(wall('shieldwall', 0.7)), wA = arm(wall('shieldwall', 0.4)), wH = arm(wall('shieldwall', 0.2)), wN = arm(wall('hold', 0.05)), wR = arm(wall('shieldwall', null));
  out.wallDrilledVsNever = gap(wD, wN); out.wallDrilledVsAverage = gap(wD, wA); out.wallHalfVsNever = gap(wH, wN); out.wallAverageVsRelease = gap(wA, wR);
  // 2. a pike hedge (300 to 600 a wing) against lances
  const pike = (tac, v) => i => ({ a: L('PK', 300 + (i * 37) % 300, tac), b: L('HC', 300, 'lance'), dlA: v == null ? null : R(v), dlB: R(0.4) });
  const pD = arm(pike('pikehedge', 0.7)), pN = arm(pike('hold', 0.05)), pR = arm(pike('pikehedge', null));
  out.pikeDrilledVsNever = gap(pD, pN); out.pikeDrilledVsRelease = gap(pD, pR);
  // 3. a wedge of heavy horse (side A) into spearmen who drilled to stand (0.4) or never did (0.05)
  const wedge = v => i => ({ a: L('HC', 300, 'lance'), b: L('SP', 450 + (i * 37) % 350, 'hold'), dlA: R(0.7), dlB: R(v) });
  out.wedgeVsRawLine = gap(arm(wedge(0.05)), arm(wedge(0.4)));
  // 4. a skirmish screen of light foot (450 to 850) against a slow block of 600 spearmen a wing
  const scr = (tac, v) => i => ({ a: L('LI', 450 + (i * 37) % 400, tac), b: L('SP', 600, 'hold'), dlA: v == null ? null : R(v), dlB: R(0.4) });
  out.screenDrilledVsNever = gap(arm(scr('skirmish', 0.7)), arm(scr('hold', 0.05)));
  return out;
}, N);
console.log(JSON.stringify(line));

// the war map: frozen real fights, every division on the player's side set to one drill level
const map = await page.evaluate(nf => {
  const fights = window.RANKFX_FIGHTS(nf, 6000);
  const setDrill = v => key => {
    const F = A.S.fights[+String(key).slice(1)]; if (!F) return;
    const pc = A.pc(), ours = (F.aIds || []).concat(F.dIds || []).map(A.divById).filter(d => d && !A.hostile(d.r, pc.mil.realm));
    for (const d of ours) { d.dr = d.dr || {}; for (const k of A.DRILL.FAMS) d.dr[k] = v; }
  };
  const arms = { never: setDrill(0.05), average: setDrill(0.4), drilled: setDrill(0.7) }, out = { fights: fights.length };
  for (const [k, fn] of Object.entries(arms)) {
    let w = 0, m = 0;
    for (const f of fights) { const r = window.RANKFX_RUN(f, fn); if (r != null) { m++; if (r) w++; } }
    out[k] = { won: w, of: m, pct: Math.round(100 * w / Math.max(1, m)) };
  }
  out.swing = out.drilled.pct - out.never.pct;
  return out;
}, FIGHTS).catch(e => ({ error: String(e.message || e).slice(0, 300) }));
console.log(JSON.stringify(map));
await browser.close();
const json = opt('json');
if (json) { fs.mkdirSync(path.dirname(path.resolve(json)), { recursive: true }); fs.writeFileSync(path.resolve(json), JSON.stringify({ line, map }, null, 1)); }
