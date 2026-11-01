// The phone audit: every screen on an iPhone SE (375 x 667), a Pixel 7 (412 x 915) and a desktop (1366 x 900),
// screenshotted and measured (overflow, tap targets, small text, fixed bars, modals); and the ten key tasks.
//
//   node features/71-phone/audit.mjs /tmp/ardan/phone/full.html --tag=after [--devices=se,pixel,desk] [--screens=life,event] [--full=1]
//   node features/71-phone/audit.mjs /tmp/ardan/phone/full.html --tag=after --tasks
//
// Writes /tmp/ardan/phone/<tag>/<device>-<screen>.png (and -end.png scrolled to the bottom of a sheet, -full.png the
// whole page), audit.json or tasks.json, and prints a table.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { DEVICES, openPage, measureScreens } from './screens.mjs';
import { TASKS, runTasks } from './tasks.mjs';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = k => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const file = path.resolve(args.find(a => !a.startsWith('--')) || path.join(here, '../../index.html'));
const outDir = path.join(opt('dir') || '/tmp/ardan/phone', opt('tag') || 'audit');
fs.mkdirSync(outDir, { recursive: true });
const browser = await pw.chromium.launch();

if (args.includes('--tasks')) {
  const devs = opt('devices') ? opt('devices').split(',') : ['desk', 'se', 'pixel'];
  const r = await runTasks(browser, file, devs);
  const phones = devs.filter(d => d !== 'desk');
  console.log('task'.padEnd(34) + devs.map(d => d.padStart(16)).join('') + phones.map(d => ('ratio ' + d).padStart(12)).join(''));
  for (const t of TASKS) {
    const cell = d => { const x = r[d][t.name]; return `${x.taps}t ${x.scroll}px${x.ok ? '' : ' X'}`.padStart(16); };
    console.log(t.name.padEnd(34) + devs.map(cell).join('') + phones.map(p => (r.desk ? (r[p][t.name].cost / r.desk[t.name].cost).toFixed(2) : '').padStart(12)).join(''));
    for (const d of devs) if (r[d][t.name].why) console.log('   ', d, r[d][t.name].why);
  }
  fs.writeFileSync(path.join(outDir, 'tasks.json'), JSON.stringify(r, null, 1));
} else {
  const devs = (opt('devices') || 'se,pixel,desk').split(',');
  const only = opt('screens') ? opt('screens').split(',') : null;
  const report = {};
  for (const d of devs) {
    const errs = [];
    const { ctx, pg } = await openPage(browser, file, d, errs);
    report[d] = await measureScreens(pg, { touch: DEVICES[d].hasTouch, only, each: async (name, pg, m) => {
      m.errors = errs.splice(0);
      await pg.screenshot({ path: path.join(outDir, `${d}-${name}.png`) });
      if (m.modal && m.modal.scrolls) {
        await pg.evaluate(() => { for (const e of document.querySelectorAll('#modal, #modal *')) { const cs = getComputedStyle(e); if (/auto|scroll/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 1) e.scrollTop = e.scrollHeight; } });
        await pg.screenshot({ path: path.join(outDir, `${d}-${name}-end.png`) });
        await pg.evaluate(() => { for (const e of document.querySelectorAll('#modal, #modal *')) e.scrollTop = 0; });
      }
      if (opt('full')) await pg.screenshot({ path: path.join(outDir, `${d}-${name}-full.png`), fullPage: true });
    } });
    await ctx.close();
  }
  fs.writeFileSync(path.join(outDir, 'audit.json'), JSON.stringify(report, null, 1));
  for (const d of devs) {
    console.log(`\n${d}: screen               over  off  hscr  small/targets  gloss  inline  tiny/text  covered  modal`);
    for (const [n, m] of Object.entries(report[d])) {
      if (m.error) { console.log(`  ${n.padEnd(20)} ERROR ${m.error}`); continue; }
      const md = m.modal ? `${m.modal.h}px${m.modal.stuck ? ' STUCK' : ''}${m.modal.scrolls ? ' scrolls' : ''}${m.modal.choiceTop != null ? ' choices@' + m.modal.choiceTop : ''}` : '';
      console.log(`  ${n.padEnd(20)} ${m.overflow ? 'YES ' : 'no  '} ${String(m.nOff).padStart(4)} ${String(m.hscroll.length).padStart(5)}  ${String(m.small.length).padStart(5)}/${String(m.targets).padEnd(6)} ${String(m.glossary.length).padStart(5)} ${String(m.inline.length).padStart(6)}  ${String(m.tinyText.length).padStart(4)}/${String(m.textEls).padEnd(5)} ${String(m.covered ?? '').padStart(7)}  ${md}${m.errors && m.errors.length ? ' ERR ' + m.errors[0] : ''}`);
    }
  }
}
await browser.close();
console.log('\nwrote', outDir);
