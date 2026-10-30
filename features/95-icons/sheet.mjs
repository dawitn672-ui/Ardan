// A sheet of the icon set for review (not a test): every icon at 16, 20 and 24 px and once large, on the night and
// washi grounds, with its word. node features/95-icons/sheet.mjs <built.html> <out.png>
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const [file, out] = process.argv.slice(2).map(a => path.resolve(a));
const b = await pw.chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 })).newPage();
await pg.goto(pathToFileURL(file).href);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
await pg.evaluate(() => {
  const IS = UI.ICONSET, names = Object.keys(IS);
  const cell = (n, bg, fg) => `<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;background:${bg};color:${fg};font:12px system-ui">` +
    [16, 20, 24].map(px => `<svg class="ic" viewBox="0 0 24 24" style="width:${px}px;height:${px}px">${IS[n].svg}</svg>`).join('') +
    `<svg class="ic" viewBox="0 0 24 24" style="width:48px;height:48px">${IS[n].svg}</svg><span style="width:110px"><b>${n}</b><br>${UI.esc(IS[n].label)}</span></div>`;
  document.body.innerHTML = `<div style="display:grid;grid-template-columns:repeat(4,max-content);gap:4px;padding:8px;background:#0d1120;width:max-content">` +
    names.map((n, i) => cell(n, i % 2 ? '#141a2c' : '#1b2338', '#eee8da')).join('') + names.slice(0, 0).join('') + '</div>' +
    `<div style="display:grid;grid-template-columns:repeat(4,max-content);gap:4px;padding:8px;background:#f2ede2;width:max-content">` +
    names.map((n, i) => cell(n, i % 2 ? '#faf7f0' : '#ffffff', '#1d2033')).join('') + '</div>';
  document.body.style.margin = 0;
});
await pg.screenshot({ path: out, fullPage: true });
await b.close();
console.log('wrote', out);
