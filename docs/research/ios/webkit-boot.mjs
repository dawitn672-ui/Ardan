// I1 (docs/IOS_ROADMAP.md): does the one-file build boot in WebKit (Playwright's Linux WebKit at 375x667, not WKWebView
// under capacitor://), with its CSP, the 'strict-dynamic' script injection and a blob: worker, and does a save land?
//   PLAYWRIGHT_BROWSERS_PATH=... node docs/research/ios/webkit-boot.mjs /tmp/ardan/me/x.html
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const file = path.resolve(process.argv[2]);
const browser = await pw.webkit.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const pg = await ctx.newPage();
const errs = [], csp = [];
pg.on('pageerror', e => errs.push(String(e.message || e).slice(0, 200)));
pg.on('console', m => { const t = m.text(); if (/Content Security Policy|Refused/i.test(t)) csp.push(t.slice(0, 200)); else if (m.type() === 'error') errs.push(t.slice(0, 200)); });
const t0 = Date.now();
await pg.goto(pathToFileURL(file).href);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 300000 });
const boot = await pg.evaluate(() => window.ARDAN_BOOT);
// the worker: build a blob worker under the page's own CSP and see it answer
const worker = await pg.evaluate(() => new Promise(res => {
  try {
    const url = URL.createObjectURL(new Blob(['onmessage = e => postMessage(e.data * 2)'], { type: 'text/javascript' }));
    const w = new Worker(url); const to = setTimeout(() => res('no answer'), 5000);
    w.onmessage = e => { clearTimeout(to); res('answered ' + e.data); }; w.onerror = e => { clearTimeout(to); res('error ' + (e.message || e)); };
    w.postMessage(21);
  } catch (e) { res('threw ' + e.message); }
}));
const ahead = await pg.evaluate(() => ({ ahead: typeof A.V2_MAKE, idb: typeof indexedDB, cs: typeof CompressionStream, locks: !!(navigator.locks), audioSession: 'audioSession' in navigator }));
// a new life and a save
const saved = await pg.evaluate(async () => { try { A.newGame({ seed: 7102, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 32 }); UI.screen = 'game'; UI.render(); const r = await SAVES.save(); return r; } catch (e) { return 'threw ' + e.message; } });
console.log(JSON.stringify({ ms: Date.now() - t0, boot, worker, ahead, saved: saved && { ok: saved.ok, kb: saved.kb, where: saved.where }, errs: errs.slice(0, 6), csp: csp.slice(0, 6) }, null, 1));
await browser.close();
