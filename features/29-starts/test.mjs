// Starting stories: every story starts the life it promises, opens with its scene, and comes back years later.
export default {
  async startsAll(pg) {
    const r = await pg.evaluate(() => {
      const out = [];
      for (const s of A.STARTS) {
        const o = Object.assign({ seed: 900 + out.length, sex: 'F' }, s.cr, { story: s.id });
        A.newGame(o);
        const pc = A.pc(), q = A.S.queue.find(x => x.type === 'event' && x.ev === 'st_' + s.id + '_open');
        const bad = [];
        if (pc.race !== s.cr.race) bad.push('race ' + pc.race);
        if (pc.realm !== s.cr.realm) bad.push('realm ' + pc.realm);
        if (pc.status !== s.cr.status) bad.push('status ' + pc.status);
        if (!q) bad.push('no opening');
        let text = '', nChoices = 0;
        if (q) {
          A.S.queue = [q].concat(A.S.queue.filter(x => x !== q));
          const v = A.eventView(q); text = v.text; nChoices = v.choices.length;
          if (T.raw.test(v.text) || v.choices.some(c => T.raw.test(c.t))) bad.push('raw token');
          if (v.choices.length < 2) bad.push('choices ' + v.choices.length);
          A.eventChoose(0); const res = A.S.queue[0] && A.S.queue[0].result;
          if (!res || !res.text || T.raw.test(res.text)) bad.push('result');
          A.eventClose && A.eventClose();
        }
        // the callback: move the story's start back in time and see that its echo is eligible
        const echo = A.EV['st_' + s.id + '_echo'];
        for (const k of Object.keys(pc.flags)) if (k.startsWith('st_' + s.id)) pc.flags[k] -= 16;
        const age0 = pc.born; pc.born -= 16;
        let eligible = false; try { eligible = !!echo && !!echo.cond(pc, A.C); } catch (e) { bad.push('echo cond ' + e.message); }
        pc.born = age0;
        if (!eligible) bad.push('echo not eligible');
        out.push({ id: s.id, bad, words: text.split(/\s+/).length, nChoices });
      }
      return out;
    });
    const bad = r.filter(x => x.bad.length);
    return { ok: r.length === 20 && !bad.length, detail: `${r.length} stories; ${bad.length ? 'problems: ' + bad.map(x => x.id + ' (' + x.bad.join(', ') + ')').join('; ') : 'all open, resolve and come back'}; longest opening ${Math.max(...r.map(x => x.words))} words` };
  },

  async startsCreateScreen(pg) {
    const r = await pg.evaluate(() => {
      UI.A.newLife();
      UI.step = 0; UI.render();
      const html0 = document.getElementById('app').innerHTML;
      const listed = A.STARTS.every(s => html0.includes(UI.esc(s.title).replace(/&#39;/g, "'")) || document.getElementById('app').textContent.includes(s.title));
      UI.A.crStory('widow');
      const c = UI.cr, set = c.race === 'human' && c.realm === 'POL-04' && c.status === 'merchant' && c.sex === 'F' && c.startAge === 24;
      const summary = document.getElementById('app').textContent.includes("The Widow's Books");
      // changing the rank clears the story
      const kept = A.storyFor(c) === 'widow'; c.status = 'peasant'; const cleared = A.storyFor(c) === null; c.status = 'merchant';
      UI._newLifeOk = true; UI.startLife(); UI._newLifeOk = false;
      const pc = A.pc(), opened = A.S.queue.some(q => q.ev === 'st_widow_open'), flagged = pc.flags.st_widow != null;
      return { listed, set, summary, kept, cleared, opened, flagged, coin: pc.coin };
    });
    return { ok: r.listed && r.set && r.summary && r.kept && r.cleared && r.opened && r.flagged, detail: JSON.stringify(r) };
  },

  async startsDeterministic(pg) {
    const r = await pg.evaluate(() => {
      const run = () => { A.newGame(Object.assign({ seed: 4242 }, A.STARTS[17].cr, { story: A.STARTS[17].id })); T.play(2); return T.hash(A.S); };
      return run() === run();
    });
    return { ok: r, detail: r ? 'the same story and seed give the same life' : 'two runs differ' };
  },

  // first-hour I3 and B5: creation was four long steps (12,500 px on a phone) with Lands and age last, the stories hid
  // behind a closed line, and picking the Known World only after a far realm silently moved the birth. Now "A new life"
  // opens on one screen with Lands first and three ways in; the full screens put Lands and age above the realm; and the
  // switch says what it did.
  async startsQuick(pg, errs, { browser, file }) {
    const { pathToFileURL } = await import('node:url');
    const sizes = [];
    for (const [w, h, mob] of [[1366, 768, false], [390, 844, true]]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob }), p = await ctx.newPage();
      p.on('pageerror', e => errs.push(String(e)));
      await p.goto(pathToFileURL(file).href);
      await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
      sizes.push(await p.evaluate(() => { UI.set.lfLives = 0; UI.A.newLife(); window.scrollTo(0, 0); return { w: innerWidth, vh: innerHeight, h: document.documentElement.scrollHeight }; }));
      await ctx.close();
    }
    const r = await pg.evaluate(() => {
      UI.set.lfLives = 0; UI.A.newLife();
      const app = document.getElementById('app'), q = s => app.querySelector(s);
      const order = (a, b) => !!(a && b && (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING));
      const quick = { lands: !!q('.crq-lands'), ways: [...app.querySelectorAll('[data-a=crQuick]')].map(b => b.dataset.v).join(','), landsFirst: order(q('.crq-lands'), q('.crq-ways')),
        cards: app.querySelectorAll('.crq-stories > .opt-grid > [data-a=crStory]').length, all: A.STARTS.every(s => app.textContent.includes(s.title)), score: /multiplied/.test(app.textContent) };
      // Start at 16 goes straight to a life of 16
      UI._newLifeOk = true; UI.A.crQuick('adult'); UI._newLifeOk = false;
      const adult = { screen: UI.screen, age: A.age(A.pc()) };
      // the full screens: Lands, then age, then the people and the realm
      UI.A.newLife(); UI.A.crStep(0);
      const L = q('.fl-lands'), age = [...app.querySelectorAll('.field')].find(f => /Where your story starts/.test(f.textContent)), realm = [...app.querySelectorAll('.field')].find(f => /Realm of birth/i.test(f.textContent));
      const full = { order: order(L, age) && order(age, realm), begin: (() => { UI.A.crStep(3); return !/Where your story starts/.test(app.textContent) && !app.querySelector('.fl-lands'); })() };
      // a far realm, then the Known World only: warned before, told after
      UI.A.crStep(0);
      const far = Object.keys(A.FAR.D.realms).find(r => A.raceAllowed(UI.cr.race, r)); UI.cr.realm = far; UI.crFix(); UI.render();
      const warned = !!q('.cr-lands-warn');
      const toasts = [], t0 = UI.toast; UI.toast = m => toasts.push(m);
      UI.A.crSet('lands:known'); UI.toast = t0;
      const told = toasts.some(m => m.includes(A.FAR.D.realms[far].name) && /beyond the Known World/.test(m)) && /beyond the Known World/.test(app.textContent);
      UI.A.crSet('lands:great');
      return { quick, adult, full, warned, told };
    });
    const [d, ph] = sizes;
    const ok = r.quick.lands && r.quick.landsFirst && r.quick.ways === 'born,adult,story' && r.quick.cards === 3 && r.quick.all && r.quick.score &&
      r.adult.screen === 'game' && r.adult.age === 16 && r.full.order && r.full.begin && r.warned && r.told && d.h <= d.vh * 1.15 && ph.h <= ph.vh * 1.8;
    return { ok, detail: `quick screen ${d.h}px at ${d.w}x${d.vh} and ${ph.h}px at ${ph.w}x${ph.vh} (the four steps were 12,500 px on a phone); ways ${r.quick.ways}, Lands first ${r.quick.landsFirst}, ${r.quick.cards} story cards (all 20 listed ${r.quick.all}), score explained ${r.quick.score}; ` +
      `Start at 16 -> ${r.adult.screen} at ${r.adult.age}; full screens: Lands, age, realm in order ${r.full.order}, gone from Begin ${r.full.begin}; far realm warned ${r.warned}, the switch says where the birth went ${r.told}` };
  },
};
