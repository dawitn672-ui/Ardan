// Hunting dominant strategies (Road to Ten, Balance 6: "hunt dominant strategies"; the economy's exploit test is
// bench/exploit.mjs). For every activity a commoner can take up, plays the same lives with a bot that does that
// activity whenever it can (otherwise it answers what the game puts in front of it, by the best odds), and compares
// what the lives reach: median peak wealth, median peak fame, median age at death. A strategy is DOMINANT when it beats
// the median strategy on all three at once by a clear margin (wealth ×3, fame +10, and no shorter life): a loop that
// pays more, makes you known, and costs nothing is the thing to find.
//   node bench/dominance.mjs [built.html] [--lives=6] [--years=30] [--workers=4] [--only=a,b] [--json=reports/dominance.json]
// Exit code 1 if any strategy is dominant.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const opt = k => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const file = path.resolve(process.argv.slice(2).find(a => !a.startsWith('--')) || path.join(root, 'index.html'));
const LIVES = +(opt('lives') || 6), YEARS = +(opt('years') || 30), WORKERS = Math.max(1, +(opt('workers') || 4));
const median = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };

const browser = await pw.chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
const errs = [], pages = [];
for (let w = 0; w < WORKERS; w++) {
  const page = await browser.newPage();
  page.on('pageerror', e => errs.push(String(e.message || e)));
  await page.goto(pathToFileURL(file).href);
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
  pages.push(page);
}
// the activities an adult commoner can take up at the start of a life
const acts = await pages[0].evaluate(() => {
  A.newGame({ seed: 1, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 20 });
  return Object.keys(GD.ACTIVITIES).filter(k => { try { return A.canAct(k)[0]; } catch (e) { return false; } });
});
const ONLY = opt('only') ? opt('only').split(',') : null;
const strategies = ['none'].concat(acts).filter(k => !ONLY || ONLY.includes(k));
const jobs = [];
for (const k of strategies) for (let i = 0; i < LIVES; i++) jobs.push({ k, i });
const played = new Array(jobs.length);
const play = (page, { k, i }) => page.evaluate(([k, i, years]) => {
  A.newGame({ seed: 4100 + i * 7919, race: 'human', realm: ['POL-01', 'POL-03', 'POL-05'][i % 3], status: ['peasant', 'artisan'][i % 2], sex: i % 2 ? 'F' : 'M', startAge: 18 });
  const start = A.S.year; let peakCoin = 0, peakFame = 0, done = 0;
  for (let g = 0; g < 2000; g++) {
    const pc = A.pc(); if (!pc || !pc.alive || A.S.year - start >= years) break;
    if (k !== 'none') { try { if (A.canAct(k)[0]) { const r = A.doActivity(k); if (r && r.ok !== false) done++; } } catch (e) {} }
    const r = A.advance(31);
    let h, n = 0;
    while ((h = A.headReady()) && n++ < 300) {
      if (h.type === 'event') { const v = A.eventView(h); let best = 0, bo = -1; v.choices.forEach((c, j) => { const o = c.odds == null ? 100 : c.odds; if (o > bo) { bo = o; best = j; } }); A.eventChoose(best); A.eventClose(); }
      else if (h.type === 'choice') A.choiceChoose(0);
      else if (h.type === 'duel') { A.duelAuto(h.d); A.duelClose(); }
      else if (h.type === 'mission') { A.missionAuto(h.m); if (A.S.queue[0] === h) A.missionClose ? A.missionClose() : A.S.queue.shift(); }
      else if (h.type === 'battle') { A.battleAuto(h.b); if (A.S.queue[0] === h) A.battleClose ? A.battleClose() : A.S.queue.shift(); }
      else A.skipPrompt();
    }
    const p2 = A.P(A.S.pc); if (p2) { peakCoin = Math.max(peakCoin, p2.coin || 0); peakFame = Math.max(peakFame, p2.fame || 0); }
    if (r && r.why === 'dead') break;
  }
  const pc = A.P(A.S.pc);
  return { coin: peakCoin, fame: peakFame, age: pc ? A.age(pc) : 0, died: !!(pc && !pc.alive), done };
}, [k, i, YEARS]);
await Promise.all(pages.map(async (page, w) => {
  for (let j = w; j < jobs.length; j += WORKERS) { played[j] = await play(page, jobs[j]); process.stdout.write('.'); }
}));
process.stdout.write('\n');
const rows = strategies.map(k => {
  const L = jobs.map((j, x) => (j.k === k ? played[x] : null)).filter(Boolean);
  return { k, coin: median(L.map(l => l.coin)), fame: median(L.map(l => l.fame)), age: median(L.map(l => l.age)), died: L.filter(l => l.died).length, done: median(L.map(l => l.done)) };
});
const mid = { coin: median(rows.map(r => r.coin)), fame: median(rows.map(r => r.fame)), age: median(rows.map(r => r.age)) };
for (const r of rows) r.dominant = r.coin >= mid.coin * 3 && r.fame >= mid.fame + 10 && r.age >= mid.age && r.died <= Math.ceil(LIVES / 3);
rows.sort((a, b) => b.coin - a.coin);
console.log(`median strategy: peak wealth ${mid.coin}, peak fame ${mid.fame}, age ${mid.age} (${LIVES} lives of ${YEARS} years each, ${strategies.length} strategies)`);
for (const r of rows) console.log(`${r.dominant ? 'DOMINANT' : '        '} ${r.k.padEnd(18)} wealth ${String(r.coin).padStart(7)}  fame ${String(r.fame).padStart(3)}  age ${r.age}  died ${r.died}/${LIVES}  times done ${r.done}`);
const out = { file: path.relative(root, file), lives: LIVES, years: YEARS, median: mid, rows, dominant: rows.filter(r => r.dominant).map(r => r.k), errors: errs.slice(0, 5) };
const json = opt('json');
if (json) { fs.mkdirSync(path.dirname(path.resolve(json)), { recursive: true }); fs.writeFileSync(path.resolve(json), JSON.stringify(out, null, 1)); }
console.log(out.dominant.length ? `dominant: ${out.dominant.join(', ')}` : 'no dominant strategy');
await browser.close();
process.exit(out.dominant.length || errs.length ? 1 : 0);
