// What the first draft did not test: other screen sizes, 200% text, keyboard order, the light theme, small phones.
const { chromium, open, shot, measure, HELPERS, fs } = require('./lib.cjs');
const AXE = fs.readFileSync('/tmp/ardan/snap/node_modules/axe-core/axe.min.js', 'utf8');
const P = (...a) => console.log(...a);
const NOBLE = { seed: 5151, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 22 };
(async () => {
  const browser = await chromium.launch();
  // ---- 1. breakpoints
  for (const [W, H, touch] of [[360, 640, true], [768, 1024, true], [1024, 768, false], [1280, 720, false], [1920, 1080, false]]) {
    const { ctx, page } = await open(browser, W, H, { touch, mobile: touch });
    await page.evaluate(HELPERS);
    await page.evaluate(o => { T.enter(o); T.play(1); T.show('life'); }, NOBLE);
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const box = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return r.width ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null; };
      const tb = box('#tabbody'); const vis = tb ? Math.max(0, Math.min(innerHeight, tb[1] + tb[3]) - tb[1]) : 0;
      const dock = document.querySelector('.v2-step.primary'); const dr = dock.getBoundingClientRect();
      const nav = document.querySelector('#bnav, .bnav'); const nr = nav && nav.getBoundingClientRect().width ? nav.getBoundingClientRect() : null;
      // on a phone the page is what lies between the tabs and the dock
      const free = nr ? Math.round(dr.top - (tb ? tb[1] : 0)) : vis;
      return { phone: !!(UI.isPhone && UI.isPhone()), profile: box('#profile'), log: box('#logwrap'), tabbody: tb, pageShare: +(((tb ? tb[2] : 0) * free) / (innerWidth * innerHeight)).toFixed(2), freeH: free, hScroll: document.documentElement.scrollWidth > innerWidth, btn: [Math.round(dr.x), Math.round(dr.y), Math.round(dr.width), Math.round(dr.height)] };
    });
    P('SIZE', W + 'x' + H, JSON.stringify(r));
    page.tag = 's' + W;
    const m = await shot(page, 'life');
    P('   first view: words', m.wordsSeen, 'controls', m.controlsSeen, 'under44', m.small44, 'under24', m.small24, 'tiny(<12px) words', m.tinySeen, 'fonts', JSON.stringify(m.fontSizes));
    await ctx.close();
  }
  // ---- 2. the game's own largest text size, on a phone
  {
    const { ctx, page } = await open(browser, 420, 900, { touch: true, mobile: true });
    await page.evaluate(HELPERS);
    await page.evaluate(o => { T.enter(o); T.play(1); T.show('life'); }, NOBLE);
    const set = await page.evaluate(() => { UI.A.menu(); const m = document.querySelector('#modal'); const s = [...m.querySelectorAll('select')].find(x => [...x.options].some(o => /200|2 times/.test(o.textContent))); if (!s) return 'no select'; s.value = s.options[s.options.length - 1].value; s.dispatchEvent(new Event('change', { bubbles: true })); UI.ov = null; UI.render(); return s.getAttribute('data-c') + '=' + s.value; });
    await page.waitForTimeout(600);
    for (const t of ['life', 'people', 'holdings']) {
      await page.evaluate(t => { T.show(t); }, t); await page.waitForTimeout(400);
      const o = await page.evaluate(() => ({ hScroll: document.documentElement.scrollWidth - innerWidth, clipped: [...document.querySelectorAll('#tabbody *, #topbar *')].filter(e => e.children.length === 0 && e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== 'visible').length, rootFont: getComputedStyle(document.documentElement).fontSize, btnH: Math.round(document.querySelector('.v2-step.primary').getBoundingClientRect().height), topbar: document.querySelector('#topbar').innerText.replace(/\s+/g, ' ').slice(0, 80) }));
      page.tag = 'x200'; await shot(page, t, { nomeasure: true });
      P('TEXT 200%', set, t, JSON.stringify(o));
    }
    await ctx.close();
  }
  // ---- 3. keyboard order on the adult Life page (desktop), focus ring, Escape; 4. light theme contrast
  {
    const { ctx, page } = await open(browser, 1366, 768, {});
    await page.evaluate(HELPERS);
    await page.evaluate(o => { T.enter(o); T.play(1); T.show('life'); }, NOBLE);
    await page.waitForTimeout(400);
    const stops = [];
    for (let i = 0; i < 70; i++) {
      await page.keyboard.press('Tab');
      const s = await page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return 'body'; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); const zone = e.closest('#topbar') ? 'top' : e.closest('#profile') ? 'profile' : e.closest('#logwrap') ? 'story' : e.closest('#tabs') ? 'tabs' : e.closest('#tabbody') ? 'page' : 'other'; return zone + ':' + (e.getAttribute('data-a') || e.getAttribute('data-tt') || e.tagName.toLowerCase()) + (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 ? '' : '(no ring)') + (r.width === 0 ? '(hidden)' : ''); });
      stops.push(s);
    }
    const zones = {}; let first = {}; stops.forEach((s, i) => { const z = s.split(':')[0]; zones[z] = (zones[z] || 0) + 1; if (!(z in first)) first[z] = i + 1; });
    P('KEYBOARD: 70 Tab presses by zone', JSON.stringify(zones), 'first stop in each zone at press #', JSON.stringify(first), 'no visible ring:', stops.filter(s => /no ring/.test(s)).length, 'first 14:', stops.slice(0, 14).join(' > '));
    const total = await page.evaluate(() => [...document.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])')].filter(e => e.getBoundingClientRect().width > 0 && !e.disabled).length);
    P('   tab stops on the page in all:', total, 'skip link:', await page.evaluate(() => !!document.querySelector('a[href^="#"].skip, .skip-link, [data-a="skip"]')));
    // light theme
    await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'light'); if (UI.set) UI.set.theme = 'light'; UI.render(); });
    await page.waitForTimeout(400);
    await page.evaluate(AXE);
    for (const t of ['life', 'people', 'holdings', 'world']) {
      await page.evaluate(t => { T.show(t); }, t); await page.waitForTimeout(300);
      const v = await page.evaluate(async () => { const res = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] }); return res.violations.map(v => v.id + '×' + v.nodes.length + (v.id === 'color-contrast' ? ' e.g. ' + v.nodes.slice(0, 2).map(n => (n.any[0] && n.any[0].data ? n.any[0].data.contrastRatio + ':1 ' + n.any[0].data.fontSize : '') + ' ' + n.html.replace(/\s+/g, ' ').slice(0, 70)).join(' ; ') : '')); });
      P('AXE light theme', t, v.length ? v.join(' | ').slice(0, 500) : 'clean');
    }
    page.tag = 'light'; await page.evaluate(() => T.show('life')); await shot(page, 'life', { nomeasure: true });
    await ctx.close();
  }
  await browser.close();
})();
