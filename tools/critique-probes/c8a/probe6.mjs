// C8a probe 6: wall time until 60 portraits are really on screen. Inline SVG vs <img> (blob URL, data URL), first use and reuse.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pw = require('/opt/node-tools/node_modules/playwright');
const [file] = process.argv.slice(2);
const b = await pw.chromium.launch();
const pg = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
await pg.goto('file://' + file);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
const res = await pg.evaluate(async () => {
  A.newGame({ seed: 42, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
  const alive = Object.values(A.S.people).filter(p => p.alive && A.age(p) > 16);
  const raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const strip = s => s.replace(/ filter="url\(#[^"]+\)"/g, '');
  const mk = (from, n, f) => alive.slice(from, from + n).map(p => f(UI.ANIME.svg(p, 88, { bust: true })));
  const box = () => { document.getElementById('sheet')?.remove(); const d = document.createElement('div'); d.id = 'sheet'; d.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;background:#0d1120;padding:6px;display:grid;grid-template-columns:repeat(10,88px);gap:4px;width:920px'; document.body.appendChild(d); return d; };
  const out = {};
  const time = async (name, html, imgs) => {
    const d = box(); await raf2();
    const t0 = performance.now(); d.innerHTML = html; d.getBoundingClientRect(); const t1 = performance.now();
    if (imgs) await Promise.all([...d.querySelectorAll('img')].map(i => i.decode().catch(() => 0)));
    const t2 = performance.now(); await raf2(); const t3 = performance.now();
    out[name] = { mount: +(t1 - t0).toFixed(1), decoded: +(t2 - t0).toFixed(1), painted: +(t3 - t0).toFixed(1), nodes: d.querySelectorAll('*').length };
  };
  // inline, with and without the filter (fresh strings each time so nothing is reused)
  await time('inline_first', mk(0, 60, s => s).join(''));
  await time('inline_again', mk(0, 60, s => s).join(''));
  await time('inlineNoFilter', mk(60, 60, strip).join(''));
  // img with blob URLs: first use, then the same URLs again
  const urls = mk(120, 60, s => URL.createObjectURL(new Blob([s], { type: 'image/svg+xml' })));
  const imgHtml = u => u.map(x => `<img width="88" height="88" alt="" src="${x}">`).join('');
  await time('imgBlob_first', imgHtml(urls), true);
  await time('imgBlob_reuse', imgHtml(urls), true);
  await time('imgBlob_reuse2', imgHtml(urls), true);
  const urlsN = mk(180, 60, s => URL.createObjectURL(new Blob([strip(s)], { type: 'image/svg+xml' })));
  await time('imgBlobNoFilter_first', imgHtml(urlsN), true);
  await time('imgBlobNoFilter_reuse', imgHtml(urlsN), true);
  // data URLs
  const durls = mk(240, 60, s => 'data:image/svg+xml,' + encodeURIComponent(strip(s)));
  await time('imgDataNoFilter_first', imgHtml(durls), true);
  await time('imgDataNoFilter_reuse', imgHtml(durls), true);
  out.dataUrlKB = +(durls.reduce((a, x) => a + x.length, 0) / 60 / 1024).toFixed(1);
  // canvas: how long 100 filled paths take to draw at 88 px, as a floor for a bitmap cache
  const paths = []; { const d = document.createElement('div'); d.innerHTML = strip(UI.ANIME.svg(alive[7], 88, { bust: true })); d.querySelectorAll('path').forEach(p => { const a = p.getAttribute('d'); if (a) paths.push(a); }); }
  const cv = document.createElement('canvas'); cv.width = cv.height = 176; const cx = cv.getContext('2d');
  const tc0 = performance.now();
  for (let r = 0; r < 200; r++) { cx.setTransform(0.88, 0, 0, 0.88, 0, 0); cx.clearRect(0, 0, 200, 200); for (const a of paths) { const P = new Path2D(a); cx.fillStyle = '#a86'; cx.fill(P); cx.strokeStyle = '#1b1730'; cx.lineWidth = 1; cx.stroke(P); } }
  cx.getImageData(0, 0, 1, 1);
  out.canvas = { paths: paths.length, msPerPortrait: +((performance.now() - tc0) / 200).toFixed(3) };
  return out;
});
console.log(JSON.stringify(res, null, 1));
await b.close();
