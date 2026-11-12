// Deciding critic: what makes a Life refresh cost what it costs at year 50? Each refresh runs in its own task (so the
// MutationObserver sweep and the timers it starts run, as in play). CPU from CDP thread metrics.
//   node ablate.cjs --tag=x --w=1366 --state=file
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const TAG = arg('tag', 'ablate'), W = +arg('w', 1366), STATE = arg('state', '/tmp/ardan/critique/engineering/out/noble-y50-state.json'), NREF = +arg('n', 6), TAB = arg('tab', 'life');
const OUT = '/tmp/ardan/critique/engineering/final/out';
(async () => {
  const browser = await chromium.launch({ args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'] });
  const phone = W < 500;
  const ctx = await browser.newContext({ viewport: { width: W, height: phone ? 860 : 900 }, deviceScaleFactor: 1, hasTouch: phone, isMobile: phone });
  const page = await ctx.newPage(); page.setDefaultTimeout(3600000);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 3600000 });
  const s = fs.readFileSync(STATE, 'utf8');
  await page.evaluate(([s, TAB]) => {
    A.deserialize(JSON.parse(s)); UI.screen = 'game'; UI.tab = TAB; UI.ov = null; UI.render();
    const F = UI.FOLD, L = UI.LOOK, M = UI.MOTION, VS = A.V2S;
    window.__AB = { orig: { cards: F.cards, fit: L.fitLife, chip: L.chipFit, name: L.nameFit, play: M.play, logwrap: UI.renderLogWrap, sweep: VS.sweep },
      set(o) {
        const k = this.orig;
        F.cards = o.passes ? () => {} : k.cards; L.fitLife = o.passes ? () => {} : k.fit; L.chipFit = o.passes ? () => {} : k.chip; L.nameFit = o.passes ? () => {} : k.name; M.play = o.passes ? () => {} : k.play;
        UI.renderLogWrap = o.log2 ? function () { const Lg = A.S.log; A.S.log = Lg.slice(-2); try { return k.logwrap.apply(this, arguments); } finally { A.S.log = Lg; } } : k.logwrap;
        VS.sweep = o.sweep ? () => {} : k.sweep;
        UI.render();
      },
      delRules(test) { let n = 0; const ex = []; const walk = owner => { const Lr = owner.cssRules; for (let i = Lr.length - 1; i >= 0; i--) { const r = Lr[i]; if (r.type === 1) { if (test(r.selectorText || '')) { ex.push(r.selectorText); owner.deleteRule(i); n++; } } else if (r.cssRules) walk(r); } }; for (const sh of document.styleSheets) { try { walk(sh); } catch (e) {} } return { n, ex }; },
      async refreshes(n) { for (let i = 0; i < n; i++) { UI.refresh(); void document.body.offsetHeight; await new Promise(r => setTimeout(r, 30)); } await new Promise(r => setTimeout(r, 200)); return document.getElementsByTagName('*').length; },
    };
  }, [s, TAB]);
  const res = [];
  const run = async (label, o) => {
    await page.evaluate(o => __AB.set(o), o);
    await page.evaluate(() => __AB.refreshes(2));   // warm
    const a = await metrics();
    const doc = await page.evaluate(n => __AB.refreshes(n), NREF);
    const b = await metrics();
    const d = k => b[k] - a[k];
    const r = { label, cpu: Math.round(d('ThreadTime') * 1000 / NREF), script: Math.round(d('ScriptDuration') * 1000 / NREF), style: Math.round(d('RecalcStyleDuration') * 1000 / NREF), layout: Math.round(d('LayoutDuration') * 1000 / NREF), recalcs: +(d('RecalcStyleCount') / NREF).toFixed(1), layouts: +(d('LayoutCount') / NREF).toFixed(1), doc };
    console.log(JSON.stringify(r)); res.push(r);
    fs.writeFileSync(`${OUT}/ablate-${TAG}.json`, JSON.stringify(res, null, 1));
  };
  await run('baseline', {});
  await run('log cut to 2 years', { log2: 1 });
  await run('post-render passes stubbed (FOLD.cards, LOOK.fitLife/chipFit/nameFit, MOTION.play)', { passes: 1 });
  await run('text sweep stubbed (VS.sweep)', { sweep: 1 });
  await run('log2 + passes + sweep', { log2: 1, passes: 1, sweep: 1 });
  const hb = await page.evaluate(() => __AB.delRules(s => /(^|,)\s*body[^,]*:has\(/.test(s)));
  console.log('deleted body:has rules', hb.n, JSON.stringify(hb.ex));
  await run('body:has() rules deleted', {});
  const h = await page.evaluate(() => __AB.delRules(s => s.includes(':has(')));
  console.log('deleted the other :has rules', h.n, JSON.stringify(h.ex));
  await run('all :has() rules deleted', {});
  await run('all :has() deleted + log2', { log2: 1 });
  await run('all :has() deleted + passes stubbed', { passes: 1 });
  await run('all :has() deleted + log2 + passes + sweep', { log2: 1, passes: 1, sweep: 1 });
  fs.writeFileSync(`${OUT}/ablate-${TAG}.json`, JSON.stringify({ res, hb, h }, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e.stack || e); process.exit(1); });
