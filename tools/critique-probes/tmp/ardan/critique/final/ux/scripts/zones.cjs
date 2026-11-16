// Where the words and controls of a desktop first view sit: top bar, profile, story, the page you opened.
const { chromium, open, HELPERS } = require('./lib.cjs');
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, 1366, 768, {});
  await page.evaluate(HELPERS);
  await page.evaluate(() => { T.enter({ seed: 5151, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 22 }); T.play(4); T.show('life'); });
  await page.waitForTimeout(2500);
  for (const t of ['life', 'path', 'holdings', 'people', 'realm', 'world']) {
    await page.evaluate(t => { T.show(t); const c = document.querySelector('#mo-cut'); if (c) c.remove(); }, t);
    await page.waitForTimeout(350);
    const r = await page.evaluate(() => {
      const vh = innerHeight, vw = innerWidth, out = {};
      const zones = { top: '#topbar', profile: '#profile', story: '#logwrap', nav: '#tabs', page: '#tabbody' };
      for (const z in zones) {
        const root = document.querySelector(zones[z]); if (!root) { out[z] = null; continue; }
        const rr = root.getBoundingClientRect(); let words = 0;
        const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; const range = document.createRange();
        while ((n = tw.nextNode())) {
          const re = /\S+/g; let m;
          while ((m = re.exec(n.nodeValue))) { range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length); const b = range.getBoundingClientRect(); if (!b.width || !b.height) continue; const x = b.left + b.width / 2, y = b.top + b.height / 2; if (x < rr.left || x > rr.right || y < Math.max(0, rr.top) || y > Math.min(vh, rr.bottom)) continue; const el = document.elementFromPoint(x, y); if (el && root.contains(el)) words++; }
        }
        const ctl = [...root.querySelectorAll('button, a[href], [data-a], input, select, summary, [data-tt][tabindex]')].filter(e => { const b = e.getBoundingClientRect(); if (!b.width) return false; const el = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return !!el && (e === el || e.contains(el) || el.contains(e)) && root.contains(el); });
        out[z] = [words, ctl.filter(e => !ctl.some(o => o !== e && o.contains(e))).length];
      }
      return out;
    });
    const tot = Object.values(r).filter(Boolean).reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);
    console.log(t, JSON.stringify(r), 'total', tot.join('/'), 'page share of words', Math.round(100 * r.page[0] / tot[0]) + '%');
  }
  await browser.close();
})();
