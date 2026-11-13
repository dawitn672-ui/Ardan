// B5: how much a screen shows at once. For a peasant, a noble and a ruler, on every page, at 1366x768 (mouse) and 420x900
// (touch): the words and controls in view without scrolling, the elements of the whole page, the chips, the screens of
// scroll, the share of the width the open page gets, and any sideways scroll.
//
//   node tools/bench/clutter.mjs /tmp/me.html [--out=/tmp/ardan/b5/before.json] [--shots=/tmp/ardan/b5/shots/before] [--only=life,you] [--persona=noble]
//
// The page is drawn the way the game draws it (UI.tab then UI.render); nothing here touches game state beyond the start of
// each life. A word counts when its text is inside the viewport and the element under its centre is the text's own.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { HELPERS } from '../../tests/helpers.mjs';
import { VIEWS, PERSONAS, PAGES, START, PROBE, SETTLE } from '../lib/clutter.mjs';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = k => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const file = path.resolve(args.find(a => !a.startsWith('--')) || path.join(here, '../../index.html'));
const outFile = opt('out'), shots = opt('shots'), only = opt('only') ? opt('only').split(',') : null;
if (shots) fs.mkdirSync(shots, { recursive: true });


const browser = await pw.chromium.launch();
const report = {};
for (const [vn, vopt] of Object.entries(VIEWS)) {
  for (const [pn, P] of Object.entries(PERSONAS)) {
    if (opt('persona') && !opt('persona').split(',').includes(pn)) continue;
    const ctx = await browser.newContext({ ...vopt, reducedMotion: 'reduce' });
    const pg = await ctx.newPage(); const errs = [];
    pg.on('pageerror', e => errs.push(String(e.message || e).slice(0, 200)));
    await pg.goto(pathToFileURL(file).href);
    await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
    await pg.evaluate(HELPERS);
    await pg.evaluate(START(P.o, P.ruler));
    for (const [name, tab, extra] of PAGES) {
      if (only && !only.includes(name)) continue;
      const key = `${vn}/${pn}/${name}`;
      try {
        await pg.evaluate(`(() => { UI.ov = null; A.S.queue = []; UI.tab = ${JSON.stringify(tab)}; ${extra} UI.render(); window.scrollTo(0, 0); const tb = document.getElementById('tabbody'); if (tb) tb.scrollTop = 0; })()`);
        await pg.evaluate(SETTLE);
        const m = await pg.evaluate(PROBE);
        m.tab = await pg.evaluate(() => UI.tab);
        report[key] = m;
        if (shots) await pg.screenshot({ path: path.join(shots, `${vn}-${pn}-${name}.png`) });
      } catch (e) { report[key] = { error: String(e.message || e).slice(0, 200) }; }
    }
    if (errs.length) report[`${vn}/${pn}/errors`] = errs.slice(0, 5);
    await ctx.close();
  }
}
await browser.close();
if (outFile) { fs.mkdirSync(path.dirname(outFile), { recursive: true }); fs.writeFileSync(outFile, JSON.stringify(report, null, 1)); }
// a table: one row a screen
console.log('view/persona/page'.padEnd(26) + 'words ctrl  elem   dom chips fold screens  share hscroll');
for (const [k, m] of Object.entries(report)) {
  if (m.error || Array.isArray(m)) { console.log(k.padEnd(26), m.error || JSON.stringify(m)); continue; }
  console.log(k.padEnd(26) + String(m.words).padStart(5) + String(m.controls).padStart(5) + String(m.elements).padStart(6) + String(m.dom).padStart(6) + String(m.chips).padStart(6) + String(m.folds + '/' + m.foldsClosed).padStart(6) + String(m.screens).padStart(8) + String(m.pageShare).padStart(7) + String(m.hscroll || 0).padStart(7) + (m.nOut ? '  out:' + m.nOut + ' ' + m.sticksOut.join(' ') : ''));
}
