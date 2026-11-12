// Shared helpers for the deciding UX critic. Evidence goes under /tmp/ardan/critique/final/ux/.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const ROOT = '/tmp/ardan/critique/final/ux';
const SHOTS = ROOT + '/shots';
const METRICS = ROOT + '/metrics.jsonl';
const URL = 'file:///tmp/ardan/snap/index.html';

async function open(browser, w, h, opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h }, deviceScaleFactor: 1,
    hasTouch: !!opts.touch, isMobile: !!opts.mobile,
    reducedMotion: opts.motion ? 'no-preference' : 'reduce',
    colorScheme: opts.scheme || 'dark',
  });
  const page = await ctx.newPage();
  page.errs = [];
  page.on('pageerror', e => page.errs.push(String(e.stack || e).slice(0, 400)));
  page.on('console', m => { if (m.type() === 'error') page.errs.push('console: ' + m.text().slice(0, 300)); });
  await page.goto(URL);
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
  await page.waitForTimeout(300);
  page.tag = w < 800 ? 'p' : 'd';
  return { ctx, page };
}

// What is really on screen. Unlike the first draft's measure(), a word counts only if the point at its centre
// hit-tests to its own element (so text under a modal, a sticky bar or a clipped scroller is not counted).
async function measure(page) {
  return page.evaluate(() => {
    const vw = innerWidth, vh = innerHeight;
    const vis = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity !== 0; };
    const hit = (el, x, y) => { if (x < 0 || y < 0 || x >= vw || y >= vh) return false; const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t) || t.contains(el)); };
    let wordsPage = 0, wordsViewNaive = 0, wordsSeen = 0, tinyWords = 0, tinySeen = 0; const fontSizes = {};
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n; const range = document.createRange();
    while ((n = tw.nextNode())) {
      const raw = n.nodeValue; if (!raw.trim()) continue;
      const el = n.parentElement; if (!el || !vis(el)) continue;
      const tag = el.tagName; if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') continue;
      const fs = Math.round(parseFloat(getComputedStyle(el).fontSize));
      const re = /\S+/g; let m; let nodeWords = 0, seen = 0;
      range.selectNodeContents(n); const nr = range.getBoundingClientRect();
      const nodeInView = nr.bottom > 0 && nr.top < vh && nr.right > 0 && nr.left < vw;
      while ((m = re.exec(raw))) {
        nodeWords++;
        if (!nodeInView) continue;
        range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length);
        const r = range.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (hit(el, r.left + r.width / 2, r.top + r.height / 2)) seen++;
      }
      wordsPage += nodeWords; if (nodeInView) wordsViewNaive += nodeWords; wordsSeen += seen;
      fontSizes[fs] = (fontSizes[fs] || 0) + seen;
      if (fs < 12) { tinyWords += nodeWords; tinySeen += seen; }
    }
    const SEL = 'button, a[href], [data-a], [role=button], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])';
    const inter = [...document.querySelectorAll(SEL)].filter(vis);
    const seenCtl = inter.filter(el => { const r = el.getBoundingClientRect(); return hit(el, r.left + r.width / 2, r.top + r.height / 2); });
    // nested controls (a [data-a] wrapping a button) count once
    const top = seenCtl.filter(el => !seenCtl.some(o => o !== el && o.contains(el)));
    const small44 = top.filter(el => { const r = el.getBoundingClientRect(); return r.width < 44 || r.height < 44; });
    const small24 = top.filter(el => { const r = el.getBoundingClientRect(); return r.width < 24 || r.height < 24; });
    const titles = [...document.querySelectorAll('[title]')].filter(vis);
    const titlesSeen = titles.filter(el => { const r = el.getBoundingClientRect(); return hit(el, r.left + r.width / 2, r.top + r.height / 2); });
    const longTitles = titles.filter(el => (el.getAttribute('title') || '').trim().split(/\s+/).length >= 4);
    const tts = [...document.querySelectorAll('[data-tt],[data-tip]')].filter(vis);
    const ttsSeen = tts.filter(el => { const r = el.getBoundingClientRect(); return hit(el, r.left + r.width / 2, r.top + r.height / 2); });
    // the deepest scroller: how many screens of content the tallest scroll container holds
    let maxScroll = { sh: document.documentElement.scrollHeight, ch: vh, who: 'document' };
    for (const el of document.querySelectorAll('*')) {
      if (el.scrollHeight > el.clientHeight + 40 && el.clientHeight > 100) { const oy = getComputedStyle(el).overflowY; if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight / el.clientHeight > maxScroll.sh / maxScroll.ch) maxScroll = { sh: el.scrollHeight, ch: el.clientHeight, who: (el.id ? '#' + el.id : '.' + String(el.className).split(' ')[0]) }; }
    }
    return {
      vw, vh, docScreens: +(document.documentElement.scrollHeight / vh).toFixed(2), scrollW: document.documentElement.scrollWidth,
      scroller: maxScroll.who, scrollerScreens: +(maxScroll.sh / maxScroll.ch).toFixed(2),
      wordsPage, wordsViewNaive, wordsSeen, controls: inter.length, controlsSeen: top.length, small44: small44.length, small24: small24.length,
      titleAttrs: titles.length, titlesSeen: titlesSeen.length, longTitles: longTitles.length, ttTriggers: tts.length, ttSeen: ttsSeen.length,
      tinyWords, tinySeen, fontSizes,
    };
  });
}

async function shot(page, name, opts = {}) {
  const base = `${SHOTS}/${page.tag}-${name}`;
  await page.waitForTimeout(opts.wait ?? 250);
  await page.screenshot({ path: base + '.png' });
  if (opts.full) await page.screenshot({ path: base + '-full.png', fullPage: true });
  let m = {};
  if (!opts.nomeasure) { try { m = await measure(page); } catch (e) { m = { err: String(e) }; } }
  m.name = page.tag + '-' + name;
  if (!opts.nomeasure) fs.appendFileSync(METRICS, JSON.stringify(m) + '\n');
  return m;
}

// in-page helpers (copied from tests/helpers.mjs in spirit)
const HELPERS = () => {
  window.T = {
    enter(o) { A.newGame(o); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); },
    drain(max = 500) { let h, g = 0; while ((h = A.headReady()) && g++ < max) { if (h.type === 'event') { A.eventView(h); A.eventAuto(); } else A.skipPrompt(); } },
    play(years) {
      const end = A.S.year + years;
      for (let guard = 0; guard < 5000 && A.S.year < end; guard++) {
        const r = A.advance(400);
        T.drain();
        if (r.why === 'dead' || !A.pc() || !A.pc().alive) return 'dead';
      }
      return 'ok';
    },
    show(tab) { UI.screen = 'game'; UI.ov = null; if (tab) UI.tab = tab; UI.render(); },
    tabs() { return UI.GROUPS.flatMap(g => g.subs.map(s => s[0])); },
  };
};

// thread-CPU clock for one renderer (load on the shared box makes wall time useless)
async function cpuClock(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  const get = async () => { const { metrics } = await cdp.send('Performance.getMetrics'); const o = {}; for (const m of metrics) o[m.name] = m.value; return o; };
  return { cdp, get };
}

module.exports = { chromium, open, shot, measure, HELPERS, SHOTS, ROOT, cpuClock, fs };
