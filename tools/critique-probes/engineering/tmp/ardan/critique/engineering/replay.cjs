// Determinism at length: replay the 50-year journal from renderprof in a fresh page and compare the state fingerprint;
// then time a cold load of the year-50 save (decode, migrate, first draw).
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const OUT = '/tmp/ardan/critique/engineering/out';
(async () => {
  const S = fs.readFileSync(`${OUT}/noble-y50-state.json`, 'utf8');
  const J = fs.readFileSync(`${OUT}/noble-y50-journal.json`, 'utf8');
  const browser = await chromium.launch({ args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'] });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 300)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 300000 });
  // the expected fingerprint, computed the game's own way from the dumped text
  const want = await page.evaluate(s => A.fingerprint(s), S);
  const jinfo = JSON.parse(J);
  console.log('journal entries', jinfo.e.length, 'has o', !!jinfo.o);
  const m0 = await metrics();
  const r = await page.evaluate(j => { const t0 = performance.now(); const J = JSON.parse(j); const res = A.replay(J); return { res: { ok: res.ok, at: res.at, k: res.k, why: res.why, steps: res.steps, errors: (res.errors || []).slice(0, 5) }, ms: performance.now() - t0, got: A.fingerprint(), year: A.S.year, len: A.serialize().length }; }, J);
  const m1 = await metrics();
  const same = r.got === want;
  console.log(JSON.stringify({ replay: r.res, wallMs: Math.round(r.ms), cpuMs: Math.round((m1.ThreadTime - m0.ThreadTime) * 1000), year: r.year, same, want, got: r.got, len: r.len, wantLen: S.length }));
  // a cold load of the year-50 state through the save path: encode as a save, then decode and enter
  const m2 = await metrics();
  const L = await page.evaluate(async s => {
    const t0 = performance.now();
    A.deserialize(JSON.parse(s));
    const t1 = performance.now();
    const enc = await SAVES.encode(A.S, A.J); const t2 = performance.now();
    let dec = null; try { dec = await SAVES.decode(enc.bytes); } catch (e) { dec = { err: String(e) }; }
    const t3 = performance.now();
    UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); void document.body.offsetHeight;
    const t4 = performance.now();
    return { deserialize: t1 - t0, encode: t2 - t1, decode: t3 - t2, firstDraw: t4 - t3, bytes: enc.bytes.length, decOk: !!(dec && !dec.err), decErr: dec && dec.err };
  }, S);
  const m3 = await metrics();
  console.log(JSON.stringify({ load: L, cpuMs: Math.round((m3.ThreadTime - m2.ThreadTime) * 1000) }));
  fs.writeFileSync(`${OUT}/replay.json`, JSON.stringify({ r, same, want, L, errs }, null, 1));
  console.log('errors', errs.slice(0, 5));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
