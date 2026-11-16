// Deciding critic: do long journals replay? Each journal dumped by gen.cjs is replayed in a fresh page and the state
// fingerprint compared with the one logged when it was dumped.
//   node replay2.cjs <journal.json>=<fp> ...
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  const out = [];
  for (const a of process.argv.slice(2)) {
    const [file, want] = a.split('=');
    const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage(); page.setDefaultTimeout(3600000);
    const errs = []; page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); }); page.on('pageerror', e => errs.push('pageerror ' + String(e).slice(0, 160)));
    await page.goto('file:///tmp/ardan/snap/index.html');
    await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 3600000 });
    const J = fs.readFileSync(file, 'utf8');
    const r = await page.evaluate(j => { const J = JSON.parse(j); const res = A.replay(J); return { n: J.e.length, kinds: J.e.reduce((o, x) => { const k = Array.isArray(x) ? x[0] : (x && x.k); o[k] = (o[k] || 0) + 1; return o; }, {}), ok: res.ok, at: res.at, k: res.k, why: res.why, steps: res.steps, errors: (res.errors || []).slice(0, 3), fp: A.fingerprint(), year: A.S.year }; }, J);
    const row = { file: file.split('/').pop(), want, got: r.fp, same: r.fp === want, entries: r.n, kinds: r.kinds, ok: r.ok, at: r.at, k: r.k, why: r.why, steps: r.steps, year: r.year, consoleErrors: errs.length };
    console.log(JSON.stringify(row)); out.push(row);
    await page.context().close();
  }
  fs.writeFileSync('/tmp/ardan/critique/engineering/final/out/replay2.json', JSON.stringify(out, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e.stack || e); process.exit(1); });
