// 999995-next-year: Next month or Next year (round 2 B6): two buttons that never become a stop control, a year that runs
// month by month and stops only for what is notable, small matters that wait, one digest, no initiative pool.
const DRIVE = () => {
  // answer what waits, the first choice of each card, then Close; the step goes on by itself once a card is settled
  window.__nyAnswer = () => {
    let g = 0, n = 0;
    while (A.headReady() && g++ < 80) {
      const q = A.S.queue[0];
      if (q.type === 'event') { n++; if (!q.result) UI.A.evChoose(0); if (A.S.queue[0] === q && q.result) UI.A.evClose(); }
      else { A.skipPrompt(); UI.refresh(); }
    }
    UI.clkResume();
    return n;
  };
  // press a step as a player would. o.hold: when the step has ended, leave what waits in the queue and report it.
  window.__nyPress = (act, o = {}) => new Promise(res => {
    if (A.S.queue.length) window.__nyAnswer();
    const R = UI.REDRAW, f0 = R.full, d0 = A.absDay(), y0 = A.S.year, ST = UI.stepper;
    let cards = 0, polls = 0, waited = false;
    UI.A[act]();
    const iv = setInterval(() => {
      polls++;
      if (ST.wait) waited = true;
      if (ST.wait || (A.S.queue.length && !ST.run && !o.hold)) cards += window.__nyAnswer();
      else if (!ST.run) {
        clearInterval(iv);
        const s = ST.sum;
        res({ act, d0, d1: A.absDay(), y0, y1: A.S.year, cards, waited, polls, full: R.full - f0, why: ST.why || '', sum: s && s.kind === 'year' ? s : null,
          waiting: A.S.queue.filter(q => q.type === 'event').map(q => q.ev), alive: !!(A.pc() && A.pc().alive), age: A.pc() ? A.age(A.pc()) : -1 });
      }
      if (polls > 6000) { clearInterval(iv); res({ act, stuck: true }); }
    }, 4);
  });
  // a small test event of our own, and one of weight
  window.__nyEv = (id, fx, extra) => { A.EV[id] = Object.assign({ id, title: 'Test ' + id, text: 'Something happens to you.', choices: [{ t: 'Go on', r: 'It passes.', fx: fx || { happy: 1 } }, { t: 'Leave it', r: 'It passes.', fx: { happy: 0 } }] }, extra || {}); return id; };
  // a life as a player meets it after its first days (the hearth mark, a forced card of day one, is answered)
  window.__nyEnter = o => { T.enter(o); A.advance(3); let h, k = 0; while ((h = A.headReady()) && k++ < 50) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } A.S.queue.length = 0; if (window.__nyBare) A.S.sched = (A.S.sched || []).filter(x => !(x && x.item && x.item.type === 'event')); UI.render(); };
  // the month's own draws off, so a test meets only the cards it sets (a page lives for one test)
  window.__nyNoDraws = () => { A.V2T.director = () => 0; window.__nyBare = true; const q0 = A.queue; A.queue = function (q) { if (q && q.type === 'event' && !/^ny_/.test(q.ev)) return; return q0.apply(this, arguments); }; };   // and the scenes the world queues itself (a ruler's, a neighbour's) are dropped, the year's scheduled scenes cleared
  window.__nyWait = async () => { for (let i = 0; i < 80 && Object.keys(A.EV).length < 2000; i++) await new Promise(r => setTimeout(r, 100)); };
};

export const limits = { nyChildhood: 1500, nyOneRedraw: 900, nyYearSameWorld: 900, nyEarlyStops: 900 };

export default {
  // two buttons in fixed places at both widths; the running one is not a stop button; the year leads in childhood
  async nyButtons(pg) {
    await pg.evaluate(DRIVE);
    const out = [];
    for (const w of [420, 1366]) {
      await pg.setViewportSize({ width: w, height: w < 500 ? 900 : 768 });
      out.push(await pg.evaluate(w => {
        const info = () => [...document.querySelectorAll('#clk .v2-step')].map(b => { const r = b.getBoundingClientRect(); return { t: b.textContent.trim(), a: b.dataset.a, primary: b.classList.contains('primary'), dis: b.getAttribute('aria-disabled') === 'true', x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), prog: !!b.querySelector('.clk-prog'), run: b.classList.contains('run') }; });
        const res = { w };
        __nyEnter({ seed: 9501, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 });
        const adult = info(); res.adult = adult;
        // running: the label stays, it is disabled, there is a bar, and nowhere is there a stop control
        UI.A.v2Year();
        const during = info(); res.during = during;
        res.stop = document.querySelectorAll('[data-a="stepStop"]').length;
        res.stopLabel = [...document.querySelectorAll('#clk button')].some(b => /^\s*(Stop|Pause)/i.test(b.textContent));
        UI.stepStop && UI.stepper.run && UI.stepHalt();
        A.S.queue.length = 0; UI.render();
        res.after = info();
        // a child: the year is the main button
        __nyEnter({ seed: 9502, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 7 });
        res.child = info();
        res.dock = !!document.querySelector('#clk .ph-dock .v2-time');
        return res;
      }, w));
    }
    const same = (a, b) => a.length === b.length && a.every((x, i) => x.x === b[i].x && x.y === b[i].y && x.t === b[i].t);
    const ok = out.every(o => o.adult.length === 2 && o.adult[0].t === 'Next month' && o.adult[1].t === 'Next year' && o.adult[0].primary && !o.adult[1].primary &&
      o.during.length === 2 && o.during.every(b => b.dis) && same(o.adult, o.during) && o.during.some(b => b.run && b.prog) && !o.stop && !o.stopLabel &&
      same(o.adult, o.after) && o.after.every(b => !b.dis) && o.child[1].primary && !o.child[0].primary && Math.abs(o.child[0].w - o.adult[0].w) <= 2 && Math.abs(o.child[1].w - o.adult[1].w) <= 2) &&
      out[0].dock;
    return { ok, detail: out.map(o => `${o.w}px: ${o.adult.map(b => b.t + (b.primary ? '*' : '')).join(' | ')}; running: ${o.during.map(b => b.t + (b.dis ? ' (off)' : '')).join(' | ')}, ${o.stop} stop controls; child: ${o.child.map(b => b.t + (b.primary ? '*' : '')).join(' | ')}; fixed ${same(o.adult, o.during)}/${same(o.adult, o.after)}`).join('; ') };
  },

  // the rule: notable or routine, from the definition alone
  async nyClassify(pg) {
    await pg.evaluate(DRIVE);
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 9503, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 });
      await __nyWait();
      const Y = A.V2Y, ev = (id, fx, extra) => __nyEv(id, fx, extra);
      const q = (id, o) => Object.assign({ type: 'event', ev: id }, o || {});
      const adult = !!A.isAdult(A.pc());
      const c = {};
      c.small = Y.classify(q(ev('ny_small', { happy: 2, skill: { persuasion: 1 }, them: { op: 5 } }))).notable;
      c.wound = Y.classify(q(ev('ny_wound', { wound: 'broken_nose' }))).notable;
      c.woundLose = Y.classify(q(ev('ny_wl', { happy: 1 }, { choices: [{ t: 'Fight', check: { s: 'str', d: 45 }, win: { r: 'Won.', fx: { fame: 1 } }, lose: { r: 'Lost.', fx: { wound: 'deep_cut' } } }, { t: 'Walk', r: 'Away.', fx: {} }] }))).notable;
      c.fnDie = Y.classify(q(ev('ny_fn', { happy: 1 }, { choices: [{ t: 'Go', fx: p => { p.die = 1; return 'It ends.'; } }, { t: 'No', r: '.', fx: {} }] }))).notable;
      c.job = Y.classify(q(ev('ny_job', { job: 'smith' }))).notable;
      c.purse = Y.classify(q(ev('ny_purse', { coin: 500 }))).notable;
      c.pennies = Y.classify(q(ev('ny_pennies', { coin: 5 }))).notable;
      c.topic = Y.classify(q(ev('ny_marriage_offer', { happy: 1 }))).notable;
      c.notTopic = Y.classify(q(ev('ny_tavern_song', { happy: 1 }))).notable;
      c.ruler = Y.classify(q(ev('ny_rule', { happy: 1 }, { cond: (p, C) => C.ruler(p) }))).notable;
      c.forced = Y.classify(q('ny_small', { forced: true })).notable;
      c.chain = Y.classify(q('ny_small', { lfFrom: 'chain' })).notable;
      c.gathering = Y.classify(q('ny_small', { ctx: { gid: 3 } })).notable;
      c.label = Y.classify(q('ny_small', { label: 'The loan falls due' })).notable;
      c.battle = Y.classify({ type: 'battle' }).notable;
      c.unknown = Y.classify(q('ny_not_defined_anywhere')).notable;
      // a child's list is shorter: a post is a grown person's matter
      const pc = A.pc(), born = pc.born; pc.born = A.S.year - 8;
      c.childJob = Y.classify(q('ny_job')).notable; c.childPurse = Y.classify(q('ny_purse')).notable; c.childWound = Y.classify(q('ny_wound')).notable;
      pc.born = born;
      // pure: no state, no rolls
      const rng = A.rngState, fp = A.fingerprint(); for (let i = 0; i < 50; i++) Y.classify(q('ny_wound'));
      c.pure = rng === A.rngState && fp === A.fingerprint();
      // the whole corpus: neither everything nor nothing stops a year
      let n = 0, notable = 0, nChild = 0, notableChild = 0;
      for (const id of Object.keys(A.EV)) { if (id.startsWith('ny_')) continue; n++; if (Y.def(id, true).notable) notable++; nChild++; if (Y.def(id, false).notable) notableChild++; }
      return { c, adult, n, notable, nChild, notableChild };
    });
    const c = r.c;
    const ok = r.adult && !c.small && c.wound && c.woundLose && c.fnDie && c.job && c.purse && !c.pennies && c.topic && !c.notTopic && c.ruler && c.forced && c.chain && c.gathering && c.label && c.battle && c.unknown &&
      !c.childJob && !c.childPurse && c.childWound && c.pure && r.notable / r.n > 0.15 && r.notable / r.n < 0.6 && r.notableChild <= r.notable;
    return { ok, detail: `${r.notable} of ${r.n} events are notable for a grown person (${r.nChild ? Math.round(100 * r.notableChild / r.nChild) : 0}% for a child); small ${c.small}, wound ${c.wound}, wound only on a lost roll ${c.woundLose}, a fx function ${c.fnDie}, post ${c.job}/${c.childJob} child, purse ${c.purse}, pennies ${c.pennies}, marriage id ${c.topic}, ruler ${c.ruler}, forced ${c.forced}, chain ${c.chain}, gathering ${c.gathering}, deadline ${c.label}, battle ${c.battle}; pure ${c.pure}` };
  },

  // twelve month presses and one year press end on the same world when nothing stops the year
  async nyYearSameWorld(pg) {
    await pg.evaluate(DRIVE);
    const r = await pg.evaluate(async () => {
      const life = async (o, mode) => {
        __nyEnter(o);
        let cards = 0, presses = 0, why = '';
        if (mode === 'year') { const s = await __nyPress('v2Year'); cards += s.cards; presses++; why = s.why; }
        else for (let i = 0; i < 12; i++) { const s = await __nyPress('v2Next'); cards += s.cards; presses++; }
        return { fp: A.fingerprint(), rng: A.rngState | 0, day: A.absDay(), cards, presses, why };
      };
      const tries = [];
      for (const seed of [9511, 9512, 9513, 9514, 9515, 9516, 9517, 9518]) {
        const o = { seed, race: 'human', realm: 'POL-0' + (1 + seed % 5), status: 'peasant', sex: seed % 2 ? 'M' : 'F', startAge: seed < 9515 ? 0 : 2 };
        const a = await life(o, 'month'), b = await life(o, 'year');
        tries.push({ seed, a, b });
        if (tries.filter(t => t.a.cards === 0 && t.b.cards === 0 && !t.b.why).length >= 3) break;
      }
      return tries;
    });
    const quiet = r.filter(t => t.a.cards === 0 && t.b.cards === 0 && !t.b.why);
    const same = quiet.every(t => t.a.fp === t.b.fp && t.a.rng === t.b.rng && t.a.day === t.b.day);
    return { ok: quiet.length >= 2 && same, detail: `${quiet.length} quiet years of ${r.length} compared (seeds ${quiet.map(t => t.seed).join(', ')}): twelve Next month presses and one Next year press ${same ? 'reach the same world' : 'DIFFER'}` };
  },

  // the year ends early, in one line, for what matters
  async nyEarlyStops(pg) {
    await pg.evaluate(DRIVE);
    const r = await pg.evaluate(async () => {
      const out = {};
      await __nyWait(); __nyNoDraws();
      const withHook = async (name, o, hook, act) => {
        __nyEnter(o);
        const f = pc => { try { if (!f.done && (A.S.warClock || 0) === 100) { f.done = true; hook(pc); } } catch (e) { f.err = String(e); } };
        A.onDay.push(f);
        let s;
        try { s = await __nyPress(act || 'v2Year', { hold: true }); } finally { A.onDay.splice(A.onDay.indexOf(f), 1); }
        out[name] = { why: s.why, d: s.d1 - s.d0, err: f.err || '', sumWhy: s.sum && s.sum.why, early: !!(s.sum && s.sum.early) };
      };
      const base = { race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M' };
      await withHook('wound', Object.assign({ seed: 9521, startAge: 30 }, base), pc => A.addWound(pc, 'broken_nose'));
      await withHook('illness', Object.assign({ seed: 9522, startAge: 30 }, base), pc => { pc.ill = { k: 'flux', name: 'summer flux', m: 2, tot: 2, dmg: 0, y: A.S.year, t: '' }; });
      await withHook('death', Object.assign({ seed: 9523, startAge: 9 }, base), pc => { const p = A.P((pc.parents || [])[0]); if (p) p.alive = false; else throw new Error('no parent'); });
      await withHook('birth', Object.assign({ seed: 9524, startAge: 9 }, base), pc => { const par = A.P((pc.parents || [])[0]); if (!par) throw new Error('no parent'); A.S.people.ny_baby = { id: 'ny_baby', given: 'Baby', alive: true, born: A.S.year, race: 'human', sex: 'F', parents: [par.id] }; par.children = (par.children || []).concat('ny_baby'); });
      await withHook('card', Object.assign({ seed: 9525, startAge: 30 }, base), pc => { __nyEv('ny_weighty', { wound: 'deep_cut' }); A.schedule({ type: 'event', ev: 'ny_weighty', forced: true }, 3); });
      // coming of age: age 15 becomes 16 at the year's turn
      __nyEnter(Object.assign({ seed: 9526, startAge: 15 }, base));
      const s = await __nyPress('v2Year', { hold: true }); out.age = { why: s.why, age: s.age, d: s.d1 - s.d0 };
      return out;
    });
    const w = r.wound, i = r.illness, d = r.death, b = r.birth, c = r.card, a = r.age;
    const ok = /wound/i.test(w.why) && w.d < 300 && /illness/i.test(i.why) && /death/i.test(d.why) && /birth/i.test(b.why) && /Test ny_weighty/.test(c.why) && /cannot wait/.test(c.why) && /come of age|coming of age/i.test(a.why) &&
      [w, i, d, b, c].every(x => x.d < 300 && !x.err && x.early);
    return { ok, detail: `wound "${w.why}" after ${w.d} days; illness "${i.why}"; death "${d.why}" ${d.err}; birth "${b.why}" ${b.err}; card "${c.why}"; age 15: "${a.why}" (now ${a.age})` };
  },

  // small matters never stop a month or a year; they wait for its end and come one at a time; more than a year keeps pass
  async nySmallMattersWait(pg) {
    await pg.evaluate(DRIVE);
    const r = await pg.evaluate(async () => {
      await __nyWait(); __nyNoDraws();
      const base = { race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', seed: 9531, startAge: 30 };
      const out = {};
      // a year with two small cards: no stop, both wait at its end, the digest says so
      __nyEnter(base);
      const ids = []; for (let i = 0; i < 2; i++) { const id = __nyEv('ny_small' + i, { happy: 1 }); ids.push(id); A.schedule({ type: 'event', ev: id }, 80 + i * 90); }
      const y = await __nyPress('v2Year', { hold: true });
      out.year = { why: y.why, waited: y.waited, waiting: y.waiting, d: y.d1 - y.d0, digest: !!document.querySelector('.year-sum'), text: (document.querySelector('.year-sum') || {}).textContent || '', modal: !!document.querySelector('#modal') };
      __nyAnswer();
      // more than the year keeps: the rest pass, and say so
      __nyEnter(Object.assign({}, base, { seed: 9532 }));
      // a quiet year: since A2 re-rolled the world, an enemy reaches this seed's home in December and the levy is called
      // (72's call to the spear, truly notable, stops the year); the levy is held back so the test sees only its nine cards
      const levyOk = A.TS && A.TS.levyOk; if (levyOk) A.TS.levyOk = () => false;
      for (let i = 0; i < 9; i++) { const id = __nyEv('ny_many' + i, { happy: 1 }); A.schedule({ type: 'event', ev: id }, 20 + i * 30); }
      let m; try { m = await __nyPress('v2Year', { hold: true }); } finally { if (levyOk) A.TS.levyOk = levyOk; }
      out.many = { waiting: m.waiting.length, why: m.why, text: (document.querySelector('.year-sum') || {}).textContent || '', sumPassed: m.sum && m.sum.passed, story: JSON.stringify(A.S.log.slice(-2)) };
      __nyAnswer();
      // a month: the card that falls inside it waits for its end, and the step never waits at it
      __nyEnter(Object.assign({}, base, { seed: 9533 }));
      const id = __nyEv('ny_mid', { happy: 1 }); A.schedule({ type: 'event', ev: id }, 9);
      const mo = await __nyPress('v2Next', { hold: true });
      out.month = { waited: mo.waited, waiting: mo.waiting, d: mo.d1 - mo.d0 };
      return out;
    });
    const y = r.year, m = r.many, mo = r.month;
    const ok = !y.why && !y.waited && y.waiting.length === 2 && y.d > 360 && y.digest && /2 small matters wait/.test(y.text) && y.modal &&
      m.waiting === 6 && /3 more passed/.test(m.text) && !m.why && !mo.waited && mo.waiting.length === 1 && mo.d > 25;
    return { ok, detail: `year: stopped "${y.why}", ${y.waiting.length} wait at its end after ${y.d} days, digest ${y.digest} ("${y.text.slice(0, 90)}"); nine small cards: ${m.waiting} kept, ${m.sumPassed} passed; month: step waited at it ${mo.waited}, ${mo.waiting.length} waits at the end after ${mo.d} days; modal ${y.modal}, nine: "${m.why || ""}" "${m.text.slice(0, 160)}"` };
  },

  // Esc ends a year at the end of its month; a letter key never stops anything
  async nyEsc(pg) {
    await pg.evaluate(DRIVE);
    const r = await pg.evaluate(async () => {
      __nyEnter({ seed: 9541, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 });
      const key = k => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
      const ST = UI.stepper, d0 = A.absDay();
      // N while a year runs: it says so and nothing stops
      UI.A.v2Year(); key('n'); key('m'); const still = ST.run;
      await new Promise(r => setTimeout(r, 300));
      const mid = ST.run, kindMid = ST.kind;
      key('Escape');
      for (let i = 0; i < 400 && ST.run; i++) { if (ST.wait) __nyAnswer(); await new Promise(r => setTimeout(r, 10)); }
      const d1 = A.absDay(), turns = A.MONTH_START.map(x => A.S.year * 365 + x + 1);
      return { still, mid, kindMid, run: ST.run, days: d1 - d0, atTurn: turns.includes(d1) || (d1 - A.S.year * 365) === 1, why: ST.sum && ST.sum.why || '', hit: ST.hit };
    });
    const ok = r.still && r.mid && r.kindMid === 'year' && !r.run && r.days < 340 && r.atTurn && /ended the year/.test(r.why);
    return { ok, detail: `N and M while a year ran: it went on (${r.still}, ${r.mid}); Esc ended it after ${r.days} days, on a month's turn ${r.atTurn}: "${r.why}"` };
  },

  // a quiet year: one full redraw, one digest, and at most 2 s of CPU at 1366 px
  async nyOneRedraw(pg, errs, { cpu }) {
    await pg.evaluate(DRIVE);
    await pg.setViewportSize({ width: 1366, height: 768 });
    const samples = [];
    for (const seed of [9551, 9552, 9553, 9554, 9555, 9556]) {
      await pg.evaluate(s => { __nyEnter({ seed: s, race: 'human', realm: 'POL-0' + (1 + s % 5), status: 'artisan', sex: 'M', startAge: 2 }); }, seed);
      for (let k = 0; k < 4; k++) {
        await pg.evaluate(() => new Promise(r => setTimeout(r, 300)));
        const c0 = await cpu();
        const s = await pg.evaluate(async () => { const s = await __nyPress('v2Year'); return { cards: s.cards, why: s.why, full: s.full, digest: !!document.querySelector('.year-sum'), days: s.d1 - s.d0, alive: s.alive }; });
        const c1 = await cpu();
        if (!s.alive) break;
        if (!s.cards && !s.why && s.days > 360) samples.push(Object.assign(s, { cpu: Math.round(c1 - c0), seed }));
      }
      if (samples.length >= 4) break;
    }
    const med = samples.map(s => s.cpu).sort((a, b) => a - b)[Math.floor(samples.length / 2)];
    const ok = samples.length >= 2 && samples.every(s => s.full === 1 && s.digest) && med <= 2000;
    return { ok, detail: `${samples.length} quiet years: ${samples.map(s => `${s.cpu} ms CPU, ${s.full} full redraw, digest ${s.digest}`).join('; ')}; median ${med} ms (limit 2000)` };
  },

  // a newborn reaches 12 in about 25 presses at most
  async nyChildhood(pg) {
    await pg.evaluate(DRIVE);
    const r = await pg.evaluate(async () => {
      const outs = [];
      for (const seed of [9561, 9562]) {
        __nyEnter({ seed, race: 'human', realm: 'POL-0' + (1 + seed % 5), status: ['peasant', 'artisan'][seed % 2], sex: 'F', startAge: 0 });
        let presses = 0, cards = 0, early = 0;
        for (let i = 0; i < 60 && A.pc().alive && A.age(A.pc()) < 12; i++) { const s = await __nyPress('v2Year'); presses++; cards += s.cards; if (s.why) early++; }
        outs.push({ seed, presses, cards, early, age: A.age(A.pc()), alive: A.pc().alive });
      }
      return outs;
    });
    const ok = r.every(x => (!x.alive || x.age >= 12) && x.presses <= 25);
    return { ok, detail: r.map(x => `seed ${x.seed}: ${x.alive ? 'age ' + x.age : 'died'} in ${x.presses} Next year presses (${x.early} stopped early), ${x.cards} cards answered`).join('; ') };
  },

  // no pool of initiative: nothing is refused for it, and nothing shows it
  async nyNoInitiative(pg) {
    await pg.evaluate(DRIVE);
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9571, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 }); A.S.queue.length = 0;
      A.S.time = 0; A.advance(2); A.S.queue.length = 0;
      const pool = A.S.time, cap = A.initiativeCap(A.pc());
      const keys = ['run', 'lift', 'practice', 'train_yard', 'chores', 'study'].filter(k => A.ACT ? A.ACT[k] : true);
      let refused = 0, done = 0;
      for (let i = 0; i < 30; i++) { A.S.yearActs = {}; const res = A.doActivity(keys[i % keys.length]); if (res && res.ok === false) { if (/initiative/i.test(res.msg || '')) refused++; } else done++; }
      A.S.queue.length = 0; UI.tab = 'life'; UI.render();
      const clock = document.getElementById('clk'), body = document.getElementById('game') || document.body;
      const marks = (body.textContent.match(/⧗/g) || []).length;
      // the Life page's activity tiles and the coming-up strip say nothing of it
      return { pool, cap, refused, done, ini: !!(clock && clock.querySelector('.clk-ini')), marks, full: /Initiative is (full|nearly)/.test(body.textContent) };
    });
    const ok = r.pool >= 50 && r.cap >= 50 && r.refused === 0 && r.done >= 10 && !r.ini && r.marks === 0 && !r.full;
    return { ok, detail: `pool ${r.pool} of ${r.cap} after two days from 0; ${r.done} activities done, ${r.refused} refused for initiative; clock shows it ${r.ini}; ⧗ marks on the page ${r.marks}; "initiative is full" ${r.full}` };
  },

  // overtraining is on the player: weariness, then health, then a strain; a light life has none of it
  async nyOvertraining(pg) {
    await pg.evaluate(DRIVE);
    const r = await pg.evaluate(() => {
      const life = n => {
        T.enter({ seed: 9581, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 25 }); A.S.queue.length = 0;
        A.advance(2); A.S.queue.length = 0;
        const keys = ['run', 'lift', 'practice', 'train_yard', 'chores', 'study'];
        for (let i = 0; i < n; i++) { A.S.yearActs = {}; A.doActivity(keys[i % keys.length]); }
        A.advance(1); A.S.queue.length = 0;               // the day's tick moves what was spent into load
        const spent = A.V2Y.state().load;
        // a month and a bit: the load is weighed at the month's turn
        let g = 0; while (g++ < 80) { const r = A.advance(1); let h, k = 0; while ((h = A.headReady()) && k++ < 50) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } if (A.absDay() - A.S.year * 365 > 45) break; }
        const pc = A.pc(), lines = JSON.stringify(A.S.log);
        return { spent, rest: A.MOODS.needs(pc).rest, health: Math.round(pc.health), warned: /driven yourself too hard/.test(lines), strain: pc.wounds.some(w => w.k === 'strain'), load: A.V2Y.state().load, fp: A.fingerprint() };
      };
      const heavy = life(40), heavy2 = life(40), light = life(2);
      return { heavy, light, same: heavy.fp === heavy2.fp };
    });
    const h = r.heavy, l = r.light;
    const ok = h.spent > 20 && h.warned && !l.warned && h.rest < l.rest && h.health < l.health && r.same;
    return { ok, detail: `forty activities in a day or two (load ${h.spent}): rest ${h.rest} vs ${l.rest}, health ${h.health} vs ${l.health}, warned ${h.warned}, strain ${h.strain}; two activities: warned ${l.warned}; same seed same world ${r.same}` };
  },

  // the words say the same: the help and the hint name Next year, and none teaches a pool of initiative
  async nyWords(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9591, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 7 });
      UI.A.help();
      const m = document.getElementById('modal'), t = m ? m.textContent : '';
      const hint = A.V2T.hintWords();
      return { help: /Next year/.test(t) && /Next month/.test(t), noPool: !/initiative ⧗/.test(t) && /no pool of initiative/i.test(t), esc: /Esc/.test(t), hint: /Next year/.test(hint) && /Next month/.test(hint), whatNow: (A.whatNow ? A.whatNow() : []).map(x => x.t).filter(t => /Live the next/.test(t)) };
    });
    const ok = r.help && r.noPool && r.hint;
    return { ok, detail: `help names both buttons ${r.help}, says there is no pool ${r.noPool}, Esc ${r.esc}; the clock's hint names both ${r.hint}; What now: ${r.whatNow.join(', ') || 'none offered'}` };
  },

  async nyStripSkipsScripts(pg) {
    // the cost-mark pass after each draw must never read the page's <script> text (about 5 MB): CI run 100 found it
    // read document.body.textContent on every draw, which made each draw about 6 times slower
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9592, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 8 });
      const d = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
      let script = 0, body = 0;
      Object.defineProperty(Node.prototype, 'textContent', { configurable: true, get() { if (this.tagName === 'SCRIPT') script++; if (this === document.body) body++; return d.get.call(this); }, set(v) { d.set.call(this, v); } });
      try { UI.tab = 'life'; UI.render(); UI.refresh(); A.V2Y.strip(); } finally { Object.defineProperty(Node.prototype, 'textContent', d); }
      const app = document.getElementById('app'); app.insertAdjacentHTML('beforeend', '<span id="ny-probe">Rest (2 ⧗) here</span>');
      const n = A.V2Y.strip(), left = document.getElementById('ny-probe').textContent; document.getElementById('ny-probe').remove();
      return { script, body, n, left };
    });
    const ok = r.script === 0 && r.body === 0 && r.n >= 1 && r.left === 'Rest here';
    return { ok, detail: `script text read ${r.script} times, the body's ${r.body}; a planted mark stripped: ${r.n} ("${r.left}")` };
  },
};
