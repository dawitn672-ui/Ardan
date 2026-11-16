const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const SHOTS = '/tmp/ardan/critique/ux/shots';
const METRICS = '/tmp/ardan/critique/ux/metrics.jsonl';
async function open(browser, w, h, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: !!opts.touch, isMobile: !!opts.mobile, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.errs = [];
  page.on('pageerror', e => page.errs.push(String(e.stack || e).slice(0, 400)));
  page.on('console', m => { if (m.type() === 'error') page.errs.push('console: ' + m.text().slice(0, 300)); });
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
  await page.waitForTimeout(300);
  page.tag = w < 800 ? 'p' : 'd';
  return { ctx, page };
}
// measure what is on screen: words in viewport and page, interactive elements, tooltips, tiny fonts, small targets
async function measure(page) {
  return page.evaluate(() => {
    const vw = innerWidth, vh = innerHeight;
    const vis = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity !== 0; };
    const inView = el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw; };
    // walk text nodes
    let wordsPage = 0, wordsView = 0, tiny = 0, tinyWords = 0; const fontSizes = {};
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) {
      const t = n.nodeValue.trim(); if (!t) continue;
      const el = n.parentElement; if (!el || !vis(el)) continue;
      const tag = el.tagName; if (tag === 'SCRIPT' || tag === 'STYLE') continue;
      const w = t.split(/\s+/).filter(Boolean).length;
      wordsPage += w;
      const range = document.createRange(); range.selectNodeContents(n); const rr = range.getBoundingClientRect();
      if (rr.bottom > 0 && rr.top < vh && rr.right > 0 && rr.left < vw) wordsView += w;
      const fs = Math.round(parseFloat(getComputedStyle(el).fontSize));
      fontSizes[fs] = (fontSizes[fs] || 0) + w;
      if (fs < 12) { tiny++; tinyWords += w; }
    }
    const inter = [...document.querySelectorAll('button, a[href], [data-a], [role=button], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(vis);
    const interView = inter.filter(inView);
    const smallTargets = interView.filter(el => { const r = el.getBoundingClientRect(); return r.width < 44 || r.height < 44; });
    const tiny24 = interView.filter(el => { const r = el.getBoundingClientRect(); return r.width < 24 || r.height < 24; });
    const titles = [...document.querySelectorAll('[title]')].filter(vis);
    const tts = [...document.querySelectorAll('[data-tt],[data-tip]')].filter(vis);
    const allVis = [...document.body.querySelectorAll('*')].filter(vis);
    const icons = [...document.querySelectorAll('svg, img, canvas')].filter(vis);
    return {
      vw, vh, scrollH: document.documentElement.scrollHeight, scrollW: document.documentElement.scrollWidth,
      screens: +(document.documentElement.scrollHeight / vh).toFixed(2),
      wordsPage, wordsView, elementsVisible: allVis.length, elementsInView: allVis.filter(inView).length,
      interactive: inter.length, interactiveInView: interView.length, smallTargets44: smallTargets.length, tinyTargets24: tiny24.length,
      titleAttrs: titles.length, ttTriggers: tts.length, ttInView: tts.filter(inView).length, icons: icons.length,
      tinyTextNodes: tiny, tinyWords, fontSizes,
    };
  });
}
async function shot(page, name, opts = {}) {
  const base = `${SHOTS}/${page.tag}-${name}`;
  await page.waitForTimeout(opts.wait ?? 250);
  await page.screenshot({ path: base + '.png' });
  if (opts.full) await page.screenshot({ path: base + '-full.png', fullPage: true });
  let m = {};
  try { m = await measure(page); } catch (e) { m = { err: String(e) }; }
  m.name = page.tag + '-' + name;
  fs.appendFileSync(METRICS, JSON.stringify(m) + '\n');
  return m;
}
const HELPERS = () => {
  window.T = {
    enter(o) { A.newGame(o); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); },
    play(years, opts = {}) {
      const end = A.S.year + years;
      for (let guard = 0; guard < 5000 && A.S.year < end; guard++) {
        const r = A.advance(400);
        let h, g = 0;
        while ((h = A.headReady()) && g++ < 500) { if (h.type === 'event') { A.eventView(h); A.eventAuto(); } else A.skipPrompt(); }
        if (r.why === 'dead' || !A.pc() || !A.pc().alive) return 'dead';
      }
      return 'ok';
    },
    tabs() { return UI.GROUPS.flatMap(g => g.subs.map(s => s[0])); },
  };
};
module.exports = { chromium, open, shot, measure, HELPERS, SHOTS };
