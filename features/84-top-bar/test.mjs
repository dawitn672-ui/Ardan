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
      if (UI.stepper.wait) { events++; let g = 0; while (A.headReady() && g++ < 50) { if (A.S.queue[0].type === 'event') A.eventAuto(); else A.skipPrompt(); } UI.clkResume(); }
      else if (!UI.stepper.run) { clearInterval(iv); res({ kind, d0, w0, d1: A.absDay(), w1: A.S.warClock || 0, year: A.S.year, events, slices, alive: A.pc().alive }); }
    }, 4);
  });
};
Object.assign(tests, {
  // v2 (99992-v2-time): tbStepWeekMonth dropped. It drove the Week and Month steps; Week is gone (the owner: Next month only). One month a press is v2tNextMonth.
  async tbStepSameWorld(pg) {
    // three months in steps, with the screen drawn between slices, reach the world one long A.advance reaches
    await pg.evaluate(STEPS);
    const r = await pg.evaluate(async () => {
      const o = { seed: 8402, race: 'human', realm: 'POL-05', status: 'artisan', sex: 'M', startAge: 19 };
      T.enter(o);
      // v2: the Week step is gone; four months
      for (const k of ['stepMonth', 'stepMonth', 'stepMonth', 'stepMonth']) await __step(k);
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
      await __step('stepMonth');   // the first days build the roads once (v2: a month; Week is gone)
      const lt = [];
      const ob = new PerformanceObserver(l => { for (const e of l.getEntries()) lt.push(e.duration); }); ob.observe({ entryTypes: ['longtask'] });
      A.S.queue = [];   // v2: Next month waits for the cards left from the last step
      // v2: this soldier's host is on the march by now, so the clock offers a week, not a month
      const camp = !!(A.V2T && A.V2T.campaign());
      const t0 = performance.now(), m = await __step(camp ? 'v2Week' : 'stepMonth'), ms = performance.now() - t0;
      await new Promise(res => setTimeout(res, 50)); ob.disconnect();
      return { camp, ms: Math.round(ms), slices: m.slices, days: m.d1 - m.d0, long: lt.map(Math.round).sort((a, b) => b - a), great: A.S.prov.length > 1000 };
    });
    const ok = r.great && r.days >= (r.camp ? 7 : 25) && r.long.length >= 0 && (r.long[0] || 0) < 1500 && (r.slices >= 5 || r.ms < 300);   // v2: a month that is done in under 300 ms needs no slices
    return { ok, detail: `a month of the Great Continent in ${r.ms} ms over ${r.slices} polls; long tasks ${r.long.slice(0, 6).join(', ') || 'none'} ms (the longest is the month's turn, a single day)` };
  },
  // a life begun through the creation screen (which keeps its page number in UI.step) steps a month at a time, and the
  // stepper's state stays readable: a month passes per step and the step ends on its own
  async tbStepAfterMenu(pg) {
    const r = await pg.evaluate(async () => {
      UI.A.newLife(); UI.step = 3; UI._newLifeOk = true; UI.startLife(); UI._newLifeOk = false; A.S.queue = []; UI.render();
      const out = [];
      for (let i = 0; i < 3; i++) {
        const d0 = A.absDay(); UI.stepStart('month');
        let g = 0;
        while (UI.stepper.run && g++ < 600) {
          if (UI.stepper.wait) { let k = 0; while (A.headReady() && k++ < 50) { if (A.S.queue[0].type === 'event') A.eventAuto(); else A.skipPrompt(); } UI.clkResume(); }
          await new Promise(res => setTimeout(res, 50));
        }
        out.push(A.absDay() - d0);
      }
      return { days: out, stepper: typeof UI.stepper === 'object', page: UI.step };
    });
    const ok = r.stepper && r.days.every(d => d >= 25 && d <= 38);
    return { ok, detail: `three monthly steps after the creation screen: ${r.days.join(', ')} days; the stepper is its own object ${r.stepper}, the creation page ${r.page}` };
  },
});

// ---- cycle 1, lane O (first-hour B1, B4, I1, I2, I5): the hints, the early years, the week's note, How to play, and a
// first life's activities. Each test sets up what the review saw, then checks it is gone.
Object.assign(tests, {
  // B1: the hints named Play, Space and Next; the What now hint lay over What now and caught clicks; it stayed eleven
  // months. Now: the first hint is the clock's, under the step buttons, naming Week and Month; the tab's hint sits after
  // What now in the page; a click on What now's first item lands on it; a step retires the clock's hint, three steps
  // the tab's.
  async tbHintsBeside(pg) {
    await pg.evaluate(STEPS);
    const r = await pg.evaluate(async () => {
      UI.set.lfLives = 1; UI.set.hintsSeen = {}; UI.set.hintSteps = {}; UI.hintUsed = {}; T.enter({ seed: 8411, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 }); A.S.queue = []; UI.render();
      const all = () => [...document.querySelectorAll('.hint')];
      const words = () => all().map(h => h.textContent).join(' | ');
      const rect = el => el.getBoundingClientRect(), over = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
      const pop = document.querySelector('#clk .clk-step > .hint-pop'), btns = [...document.querySelectorAll('#clk .clk-step > button')];
      const one = { clock: !!pop, text: words(), covers: pop ? btns.some(b => over(rect(b), rect(pop))) : null, old: /\bPlay\b|Space|\bNext\b(?! month| week| season)/.test(words()) };
      await __step('stepMonth');
      A.S.queue = []; UI.render();
      const wn = document.querySelector('#tabbody .whatnow'), hint = document.querySelector('#tabbody .hint-at');
      const item = document.querySelector('#tabbody .wn-item'), ir = item && rect(item);
      const hit = ir && document.elementFromPoint(ir.left + ir.width / 2, ir.top + ir.height / 2);
      const two = { clockGone: !document.querySelector('#clk .hint-pop') && !!UI.hintSeen('clock'), hint: hint ? hint.dataset.hint : null,
        after: !!(hint && wn && (wn.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING)), overlaps: !!(hint && [...document.querySelectorAll('#tabbody .wn-item')].some(x => over(rect(x), rect(hint)))),
        clickable: !!(hit && item.contains(hit)), pe: hint ? getComputedStyle(hint).pointerEvents : '', text: words() };
      const id = two.hint;
      for (let i = 0; i < 3; i++) { await __step('stepMonth'); A.S.queue = []; }   // v2: Week is gone
      UI.render();
      const three = { retired: !!(id && UI.hintSeen(id)), now: (document.querySelector('#tabbody .hint-at') || {}).dataset ? (document.querySelector('#tabbody .hint-at') || { dataset: {} }).dataset.hint : null };
      const wnText = (A.whatNow(A.pc()) || []).map(x => x.t + '>' + (x.act && x.act[0])).join(', ');
      return { one, two, three, wnText };
    });
    // v2 (99992-v2-time): the clock is one Next month button with no step group, so its hint no longer sits under a
    // step group; the hints must still never name Play, Space or the old Next
    const ok = !r.one.old &&
      r.two.clockGone && r.two.hint === 'whatnow' && r.two.after && !r.two.overlaps && r.two.clickable && r.two.pe === 'none' &&
      r.three.retired && !/Let time run/.test(r.wnText);
    return { ok, detail: `first hint by the clock: ${r.one.clock} ("${r.one.text.slice(0, 90)}"), covers a step button ${r.one.covers}, names Play/Space/Next ${r.one.old}; ` +
      `after a Month: clock hint retired ${r.two.clockGone}, next hint "${r.two.hint}" after What now ${r.two.after}, over its items ${r.two.overlaps}, What now's first item takes its click ${r.two.clickable}, hint pointer-events ${r.two.pe}; ` +
      `three steps later "${r.two.hint}" retired ${r.three.retired}; What now: ${r.wnText}` };
  },
  // I1: a newborn pressed Month up to sixteen times for a first event. Now under five the main step is a season, and after
  // two empty steps "Until something happens"; a season is the days of three Months, so the world is the same.
  // v2 (99992-v2-time): tbStepSeason dropped. The season and "until something happens" steps are gone (Next month only); v2tNextMonth holds the month.
  // the season and "until" steps keep the world: the same days as one long A.advance
  // v2 (99992-v2-time): tbStepSeasonSameWorld dropped. It drove the season and "until" steps, which are gone; v2tSameWorld and tbStepSameWorld hold the same-world rule for the month.
  // I2: weeks 2 to 6 of a life showed nothing at all. Now each step ends with a note of what passed in it; drawing it
  // changes neither the state nor the random stream.
  // v2 (99992-v2-time): tbStepNote dropped. The step's note card is gone: a quiet month is a 2-second toast and a story line (v2tQuietToast).
  // B4: How to play was 998 words, taught "Press Play (or Space)", never named Week or Month. Now it opens on the first
  // hour, step by step, and the rest is folded by subject.
  async tbHelpFirstHour(pg) {
    const r = await pg.evaluate(() => {
      UI.screen = 'title'; UI.render(); UI.A.help();
      const m = document.getElementById('modal'), first = m && m.querySelector('.help-first');
      const words = t => t.trim().split(/\s+/).length;
      return { first: first ? first.textContent : '', firstWords: first ? words(first.textContent) : 0, steps: first ? first.querySelectorAll('li').length : 0,
        folded: m ? m.querySelectorAll('details.help-more').length : 0, open: m ? [...m.querySelectorAll('details.help-more')].filter(d => d.open).length : 0, all: m ? m.textContent : '' };
    });
    // v2 (99992-v2-time): the first hour names Next month, the one control (Week is gone)
    const ok = /Next month/.test(r.first) && !/\bWeek\b/.test(r.first) && r.firstWords <= 90 && r.steps >= 5 && r.folded >= 8 && !r.open && !/Press Play/.test(r.all);
    return { ok, detail: `first hour: ${r.steps} steps in ${r.firstWords} words, names Week and Month ${/Month/.test(r.first) && /Week/.test(r.first)}; ${r.folded} subjects folded (${r.open} open); "Press Play" gone ${!/Press Play/.test(r.all)}` };
  },
  // I5: a first life faced 31 activities, and "Make a friend" answered two columns away. Now it sees six, "More" opens
  // the rest, and an activity's answer is written above the tiles.
  async tbActsSix(pg) {
    const r = await pg.evaluate(() => {
      UI.set.lfLives = 1; T.enter({ seed: 8441, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 }); A.S.queue = []; UI.render();
      const vis = () => [...document.querySelectorAll('#tabbody [data-a="act"]')].filter(b => b.offsetParent !== null).length;
      const six = vis(), more = document.querySelector('#tabbody [data-a="actsMore"]'), moreText = more ? more.textContent : '';
      const k = [...document.querySelectorAll('#tabbody [data-a="act"]')].filter(b => b.offsetParent !== null).map(b => b.dataset.v).find(v => v === 'make_friend') || 'make_friend';
      UI.A.act(k); A.S.queue = []; UI.ov = null; UI.render();
      const note = document.querySelector('#tabbody .act-res'), grid = document.querySelector('#tabbody .acts, #tabbody .fold-acts');
      const noteText = note ? note.textContent : '', near = !!(note && grid && (note.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING || grid.contains(note)));
      UI.A.actsMore(); const all = vis();
      UI.set.lfLives = 4; UI.actsAll = false; UI.render(); const later = vis();
      return { six, moreText, noteText, near, all, later };
    });
    const ok = r.six === 6 && /More activities/.test(r.moreText) && /Make a friend/.test(r.noteText) && r.near && r.all > 20 && r.later > 20;
    return { ok, detail: `first life: ${r.six} activities shown, "${r.moreText}"; after Make a friend: "${r.noteText.slice(0, 100)}" above the tiles ${r.near}; More shows ${r.all}; a later life ${r.later}` };
  },

  // cycle 2 (design A5): on a 390 and a 360 px phone with a large purse and a debt, the date, the initiative and the
  // purse never overlap, and the purse keeps its whole number
  async tbPhone(pg, errs, { browser, file }) {
    const { pathToFileURL } = await import('node:url');
    const out = [];
    for (const w of [390, 360]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 844 }, isMobile: true, hasTouch: true }), p = await ctx.newPage();
      p.on('pageerror', e => errs.push(String(e)));
      await p.goto(pathToFileURL(file).href); await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
      out.push(Object.assign({ w }, await p.evaluate(() => {
        A.newGame({ seed: 5, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 }); UI.screen = 'game';
        const pc = A.pc(); pc.coin = 7023; pc.debt = 38; UI.render();
        const t = document.querySelector('#topbar'), box = s => { const e = t.querySelector(s); return e ? e.getBoundingClientRect() : null; };
        const els = ['.clk-date', '.clk-ini', '.top-coin'].map(box).filter(Boolean);
        let overlap = 0; for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { const a = els[i], b = els[j]; if (a.right > b.left + 1 && b.right > a.left + 1 && a.bottom > b.top && b.bottom > a.top) overlap++; }
        const coin = t.querySelector('.top-coin > b'), whole = coin && coin.scrollWidth <= coin.clientWidth + 1;
        return { overlap, whole, n: els.length };
      })));
      await ctx.close();
    }
    const ok = out.every(o => o.n === 3 && !o.overlap && o.whole);
    return { ok, detail: out.map(o => `${o.w} px: ${o.overlap} overlaps, purse whole ${o.whole}`).join('; ') };
  },
});
export default tests;
