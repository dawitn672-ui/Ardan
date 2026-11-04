// The icons at their working sizes only (16, 20, 24 px, real pixels, both grounds), for a legibility check:
// node features/95-icons/sheet-small.mjs <built.html> <out.png> [--zoom=2]
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const args = process.argv.slice(2), [file, out] = args.filter(a => !a.startsWith('--')).map(a => path.resolve(a));
const zoom = +((args.find(a => a.startsWith('--zoom=')) || '--zoom=2').slice(7));
const b = await pw.chromium.launch();
// rendered at 1 device pixel per CSS pixel, then the screenshot is scaled up without smoothing to show real pixels
const pg = await (await b.newContext({ viewport: { width: 1000, height: 700 }, deviceScaleFactor: 1 })).newPage();
await pg.goto(pathToFileURL(file).href);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
await pg.evaluate(() => {
  const IS = UI.ICONSET, names = Object.keys(IS);
  const row = (bg, fg) => `<div style="display:grid;grid-template-columns:repeat(11,max-content);gap:6px 14px;padding:8px;background:${bg};color:${fg};font:10px system-ui">` +
    names.map(n => `<div style="display:flex;flex-direction:column;align-items:flex-start;gap:2px"><div style="display:flex;align-items:center;gap:5px">` +
      [16, 20, 24].map(px => `<svg class="ic" viewBox="0 0 24 24" style="width:${px}px;height:${px}px">${IS[n].svg}</svg>`).join('') + `</div><span>${n}</span></div>`).join('') + '</div>';
  document.body.innerHTML = `<div id="s" style="width:max-content">${row('#141a2c', '#eee8da')}${row('#faf7f0', '#1d2033')}</div>`;
  document.body.style.margin = 0;
});
const el = await pg.$('#s'), box = await el.boundingBox();
const png = await el.screenshot();
// scale up with nearest-neighbour in a fresh page
const p2 = await (await b.newContext({ viewport: { width: Math.ceil(box.width * zoom), height: Math.ceil(box.height * zoom) } })).newPage();
await p2.setContent(`<img src="data:image/png;base64,${png.toString('base64')}" style="width:${box.width * zoom}px;image-rendering:pixelated;display:block">`);
await p2.screenshot({ path: out });
await b.close();
console.log('wrote', out);
