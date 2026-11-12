// Deciding critic: what a save costs as the life goes on (main-thread CPU, bytes), and what a load costs.
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const FILES = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage(); page.setDefaultTimeout(3600000);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  const cpu = async (fn, arg) => { const a = await metrics(); const r = await page.evaluate(fn, arg); const b = await metrics(); return { r, ms: Math.round((b.ThreadTime - a.ThreadTime) * 1000) }; };
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 3600000 });
  const out = [];
  for (const f of FILES) {
    const s = fs.readFileSync(f, 'utf8');
    const des = await cpu(s => { A.deserialize(JSON.parse(s)); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; return A.S.year; }, s);
    const str = await cpu(() => JSON.stringify(A.S).length);
    const pack = await cpu(() => JSON.stringify(A.packState(A.S)).length);
    const fp = await cpu(() => { const t = JSON.stringify(A.packState(A.S)); const t0 = performance.now(); A.fingerprint(t); return t.length; });
    const enc = await cpu(async () => { const r = await SAVES.encode(A.S, A.J); window.__bytes = r.bytes; return r.bytes.length; });
    const save1 = await cpu(async () => { const ok = await UI.save(true); return ok; });
    const save2 = await cpu(async () => { const ok = await UI.save(true); return ok; });
    const save3 = await cpu(async () => { const ok = await UI.save(true); const L = await SAVES.list(); return { ok, slots: L.map(x => x.slot + ':' + x.kb) }; });
    const dec = await cpu(async () => { const d = await SAVES.decode(window.__bytes); return Object.keys(d.S.people).length; });
    const row = { file: f.split('/').pop(), year: des.r, deserializeMs: des.ms, stateMB: +(str.r / 1e6).toFixed(2), stringifyMs: str.ms, packedMB: +(pack.r / 1e6).toFixed(2), packMs: pack.ms, gzKB: Math.round(enc.r / 1024), encodeMs: enc.ms, saveMs: [save1.ms, save2.ms, save3.ms], slots: save3.r.slots, decodeMs: dec.ms };
    console.log(JSON.stringify(row)); out.push(row);
  }
  fs.writeFileSync('/tmp/ardan/critique/engineering/final/out/savecost.json', JSON.stringify(out, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e.stack || e); process.exit(1); });
