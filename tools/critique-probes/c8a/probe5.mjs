// C8a probe 5: what a page of portraits costs to put on screen: inline SVG (today) vs <img>, with and without the silhouette filter.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pw = require('/opt/node-tools/node_modules/playwright');
const [file] = process.argv.slice(2);
const b = await pw.chromium.launch();
const pg = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
await pg.goto('file://' + file);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
await pg.evaluate(() => {
  A.newGame({ seed: 42, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
  const alive = Object.values(A.S.people).filter(p => p.alive && A.age(p) > 16).slice(0, 60);
  window.SV = alive.map(p => UI.ANIME.svg(p, 88, { bust: true }));
  window.SVN = SV.map(s => s.replace(/ filter="url\(#[^"]+\)"/g, ''));
  window.mount = (kind) => {
    document.getElementById('sheet')?.remove();
    const box = document.createElement('div'); box.id = 'sheet';
    box.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;background:#0d1120;padding:6px;display:grid;grid-template-columns:repeat(10,88px);gap:4px;width:920px';
    const t0 = performance.now();
    if (kind === 'inline') box.innerHTML = SV.join('');
    else if (kind === 'inlineNoFilter') box.innerHTML = SVN.join('');
    else { const src = kind === 'img' ? SV : SVN; box.innerHTML = src.map(s => `<img width="88" height="88" decoding="sync" alt="" src="${URL.createObjectURL(new Blob([s], { type: 'image/svg+xml' }))}">`).join(''); }
    document.body.appendChild(box);
    box.getBoundingClientRect();
    const t1 = performance.now();
    return { ms: t1 - t0, nodes: box.querySelectorAll('*').length, htmlKB: box.innerHTML.length / 1024 };
  };
});
const out = {};
for (const kind of ['inline', 'inlineNoFilter', 'img', 'imgNoFilter']) {
  const runs = [];
  let info;
  for (let i = 0; i < 7; i++) {
    info = await pg.evaluate(k => mount(k), kind);
    await pg.waitForTimeout(kind.startsWith('img') ? 150 : 30);
    const el = await pg.$('#sheet');
    const t = Date.now(); await el.screenshot({ path: process.argv[3] + '-' + kind + '.png' }); runs.push(Date.now() - t);
    // second screenshot: nothing changed, measures the fixed cost (capture + encode)
  }
  runs.sort((a, b) => a - b);
  out[kind] = { mountMs: +info.ms.toFixed(2), nodes: info.nodes, htmlKB: +info.htmlKB.toFixed(0), shotMedianMs: runs[3], shotMinMs: runs[0] };
}
// main-thread cost seen by the page: style+layout+paint via a traced frame
const cdp = await pg.context().newCDPSession(pg);
for (const kind of ['inline', 'inlineNoFilter', 'img']) {
  await cdp.send('Performance.enable');
  const m0 = (await cdp.send('Performance.getMetrics')).metrics;
  for (let i = 0; i < 5; i++) { await pg.evaluate(k => mount(k), kind); await pg.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); }
  const m1 = (await cdp.send('Performance.getMetrics')).metrics;
  const g = (m, n) => m.find(x => x.name === n).value;
  out[kind].layoutMs = +((g(m1, 'LayoutDuration') - g(m0, 'LayoutDuration')) * 1000 / 5).toFixed(2);
  out[kind].styleMs = +((g(m1, 'RecalcStyleDuration') - g(m0, 'RecalcStyleDuration')) * 1000 / 5).toFixed(2);
  out[kind].taskMs = +((g(m1, 'TaskDuration') - g(m0, 'TaskDuration')) * 1000 / 5).toFixed(2);
}
console.log(JSON.stringify(out, null, 1));
await b.close();
