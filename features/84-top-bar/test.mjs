// At four desktop widths, with a long home, a large purse and a debt: the purse and the debt are whole, and the place
// is on screen (the longest name in the world may end in an ellipsis: at least 60 px of it).
const tests = {
  async tbFits(pg, errs, { browser, file }) {
    const { pathToFileURL } = await import('node:url');
    const { HELPERS } = await import('../../tests/helpers.mjs');
    const out = [];
    for (const w of [1024, 1180, 1280, 1440]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 800 } }), p = await ctx.newPage();
      p.on('pageerror', e => errs.push(String(e)));
      await p.goto(pathToFileURL(file).href);
      await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
      await p.evaluate(HELPERS);
      out.push(Object.assign({ w }, await p.evaluate(() => {
        T.enter({ seed: 5150, race: 'human', realm: 'POL-04', status: 'peasant', sex: 'M', startAge: 30 });
        const pc = A.pc(); pc.coin = 1234567; pc.debt = 12345;
        pc.home = A.S.prov.reduce((a, P) => (A.provName(P.id).length > A.provName(a.id).length ? P : a)).id;
        UI.render();
        const info = document.querySelector('#topbar .top-info'), coin = info && info.lastElementChild, home = info && info.querySelector('.top-home');
        const whole = el => !!el && el.scrollWidth <= el.clientWidth + 1 && el.getBoundingClientRect().width > 0;
        return { coin: whole(coin), coinText: coin ? coin.textContent.trim() : '', home: home ? Math.round(home.getBoundingClientRect().width) : 0, bar: Math.round(document.getElementById('topbar').getBoundingClientRect().height) };
      })));
      await ctx.close();
    }
    const ok = out.every(o => o.coin && o.home >= 60 && /owes 12,345/.test(o.coinText));
    return { ok, detail: out.map(o => `${o.w}px: purse "${o.coinText}" ${o.coin ? 'whole' : 'CUT'}, place ${o.home}px, bar ${o.bar}px tall`).join('; ') };
  },
};

// the step rhythm (step.core.js, docs/design/pacing.md), driven in the page as a player would: press a step, settle
// each event it waits at, and let it go on
const STEPS = () => {
  window.__step = kind => new Promise(res => {
    const d0 = A.absDay(), w0 = A.S.warClock || 0; let events = 0, slices = 0;
    UI.A[kind]();
    const iv = setInterval(() => {
      slices++;
      if (UI.step.wait) { events++; let g = 0; while (A.headReady() && g++ < 50) { if (A.S.queue[0].type === 'event') A.eventAuto(); else A.skipPrompt(); } UI.clkResume(); }
      else if (!UI.step.run) { clearInterval(iv); res({ kind, d0, w0, d1: A.absDay(), w1: A.S.warClock || 0, year: A.S.year, events, slices, alive: A.pc().alive }); }
    }, 4);
  });
};
Object.assign(tests, {
  async tbStepWeekMonth(pg) {
    await pg.evaluate(STEPS);
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 8401, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 22 });
      const out = [];
      for (const k of ['stepWeek', 'stepMonth', 'stepWeek', 'stepMonth', 'stepMonth']) out.push(await __step(k));
      // a month step in December runs through the year turn to the first of January
      A.S.warClock = 340;
      out.push(await __step('stepMonth'));
      const html = UI.clkHtml();
      return { out, primary: (html.match(/class="[^"]*primary[^"]*"[^>]*data-a="(\w+)"/g) || []).map(x => x.match(/data-a="(\w+)"/)[1]), keys: /aria-keyshortcuts="W"/.test(html) && /aria-keyshortcuts="M"/.test(html) };
    });
    const MS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    const bad = r.out.filter(o => o.alive && (o.kind === 'stepWeek' ? o.d1 - o.d0 !== 7 : !(MS.includes(o.w1 - 1) && o.d1 > o.d0 && o.d1 - o.d0 <= 32)));
    const ok = !bad.length && r.out[5].w1 === 1 && r.primary.length === 1 && r.primary[0] === 'stepMonth' && r.keys && r.out.some(o => o.events > 0);
    return { ok, detail: r.out.map(o => `${o.kind === 'stepWeek' ? 'week' : 'month'}: day ${o.w0} -> ${o.w1}${o.year !== 1105 ? ` (${o.year})` : ''}, ${o.events} event stop(s), ${o.slices} polls`).join('; ') + `; primary control: ${r.primary.join(', ')}` };
  },
  async tbStepSameWorld(pg) {
    // three months in steps, with the screen drawn between slices, reach the world one long A.advance reaches
    await pg.evaluate(STEPS);
    const r = await pg.evaluate(async () => {
      const o = { seed: 8402, race: 'human', realm: 'POL-05', status: 'artisan', sex: 'M', startAge: 19 };
      T.enter(o);
      for (const k of ['stepMonth', 'stepWeek', 'stepMonth', 'stepMonth']) await __step(k);
      const end = A.absDay(), a = { h: T.hash(A.S), rng: A.rngState };
      A.newGame(o);
      for (let g = 0; g < 500 && A.absDay() < end; g++) {
        A.advance(end - A.absDay());
        let h, k = 0; while ((h = A.headReady()) && k++ < 50) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
      }
      return { a, b: { h: T.hash(A.S), rng: A.rngState }, end: A.absDay() === end };
    });
    const ok = r.end && r.a.h === r.b.h && r.a.rng === r.b.rng;
    return { ok, detail: `steps ${r.a.h}/${r.a.rng}, one advance ${r.b.h}/${r.b.rng}: ${ok ? 'the same world' : 'DIFFERENT'}` };
  },
  async tbStepResponsive(pg) {
    // on the Great Continent a month is sliced: many tasks, and the longest is one day (the month's turn), not the month
    await pg.evaluate(STEPS);
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 8403, race: 'human', realm: 'POL-36', status: 'peasant', sex: 'M', startAge: 20, lands: 'great' });
      await __step('stepWeek');   // the first days build the roads once
      const lt = [];
      const ob = new PerformanceObserver(l => { for (const e of l.getEntries()) lt.push(e.duration); }); ob.observe({ entryTypes: ['longtask'] });
      const t0 = performance.now(), m = await __step('stepMonth'), ms = performance.now() - t0;
      await new Promise(res => setTimeout(res, 50)); ob.disconnect();
      return { ms: Math.round(ms), slices: m.slices, days: m.d1 - m.d0, long: lt.map(Math.round).sort((a, b) => b - a), great: A.S.prov.length > 1000 };
    });
    const ok = r.great && r.days >= 25 && r.long.length >= 0 && (r.long[0] || 0) < 1500 && r.slices >= 5;
    return { ok, detail: `a month of the Great Continent in ${r.ms} ms over ${r.slices} polls; long tasks ${r.long.slice(0, 6).join(', ') || 'none'} ms (the longest is the month's turn, a single day)` };
  },
});
export default tests;
