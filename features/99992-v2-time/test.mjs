// 99992-v2-time: one button moves time, quiet months are toasts, five places at most, chapters without a card.
const GONE = ['clkPlay', 'clkSpeed', 'clkSkip', 'clkQuiet', 'stepWeek', 'stepSeason', 'stepUntil', 'stepSpeed', 'phSpeed', 'wrRun', 'wrClkSpeed', 'wrStep', 'simWeek'];

// in the page: press a step as a player would, answer each card it stops at with its first choice, until it ends
const DRIVE = () => {
  window.__answer = () => {
    let g = 0;
    while (A.headReady() && g++ < 60) {
      const q = A.S.queue[0];
      if (q.type === 'event') { if (!q.result) UI.A.evChoose(0); if (A.S.queue[0] === q && q.result) UI.A.evClose(); }
      else { A.skipPrompt(); UI.refresh(); }
    }
    UI.clkResume();
  };
  window.__press = (act, render) => new Promise(res => {
    if (A.S.queue.length) window.__answer();
    const d0 = A.absDay(), m0 = A.V2T.monthOf(A.S.warClock || 0), y0 = A.S.year;
    let cards = 0, modal = false, polls = 0;
    UI.A[act]();
    const iv = setInterval(() => {
      polls++;
      if (render && polls % 6 === 1) T.renderAll();
      if (document.querySelector('#modal')) modal = true;
      if (UI.stepper.wait || (A.S.queue.length && !UI.stepper.run)) { cards++; window.__answer(); }
      else if (!UI.stepper.run) {
        clearInterval(iv);
        res({ act, d0, d1: A.absDay(), m0, m1: A.V2T.monthOf(A.S.warClock || 0), y0, y1: A.S.year, cards, modal, polls, alive: !!(A.pc() && A.pc().alive), toast: (document.getElementById('toast') || {}).textContent || '' });
      }
      if (polls > 4000) { clearInterval(iv); res({ act, stuck: true }); }
    }, 5);
  });
};

export default {
  // no Play, no speeds, no "sim a week", no Week / Season / Until: at a phone's width, a laptop's, and in the war room
  async v2tNoPlay(pg) {
    const out = [];
    for (const w of [420, 1366]) {
      await pg.setViewportSize({ width: w, height: w < 500 ? 900 : 768 });
      out.push(await pg.evaluate(GONE => {
        T.enter({ seed: 9201, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
        const acts = () => [...document.querySelectorAll('[data-a]')].map(e => e.dataset.a);
        const page = acts();
        // 99997-v2-war: the War Room opens only for those who serve or rule (no view of a war you are not in), so the
        // noble enlists before he opens it
        if (A.V2W && !A.V2W.canRoom()) A.enlist(A.pc());
        UI.warRoomOpen && UI.warRoomOpen();
        const room = acts(), roomTime = [...document.querySelectorAll('.wr-time [data-a]')].map(e => e.dataset.a);
        UI.ov = null; UI.render();
        const words = [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(t => /^(Play|Pause|Quiet|Next season|Next week|Until something happens)$/i.test(t));
        return { w: innerWidth, bad: GONE.filter(k => page.includes(k) || room.includes(k) || typeof UI.A[k] === 'function'), words, next: page.filter(a => a === 'v2Next').length, roomTime };
      }, GONE));
    }
    // Space and 1 to 5 no longer run a clock
    const keys = await pg.evaluate(async () => {
      const d0 = A.absDay();
      for (const k of [' ', '1', '5']) document.body.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
      await new Promise(r => setTimeout(r, 600));
      return { moved: A.absDay() - d0, run: !!(UI.clk && UI.clk.run) };
    });
    const ok = out.every(o => !o.bad.length && !o.words.length && o.next === 1 && o.roomTime.length && !o.roomTime.some(a => a !== 'v2Next' && a !== 'v2Day' && a !== 'v2Week')) && !keys.moved && !keys.run;
    return { ok, detail: out.map(o => `${o.w}px: ${o.bad.length ? 'still there: ' + o.bad.join(', ') : 'no clock controls'}, ${o.words.length ? 'words: ' + o.words.join(', ') : 'no Play words'}, ${o.next} Next month, war room: ${o.roomTime.join(', ')}`).join('; ') + `; keys moved ${keys.moved} days` };
  },

  // Next month advances exactly one calendar month (December runs into January), a save made mid-month goes on to the
  // start of the next month, and a quiet month opens no dialog: a 2-second toast and a line in the story
  async v2tNextMonth(pg) {
    await pg.evaluate(DRIVE);
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 9202, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 24 });
      const steps = [];
      let camp = 0;
      for (let i = 0; i < 14; i++) {
        // a road or a march taken on a card's first choice: step it through by the week, as a player must
        if (A.V2T.campaign()) { camp++; let g = 0; while (A.V2T.campaign() && g++ < 40) await __press('v2Week'); continue; }
        steps.push(await __press('v2Next'));
      }
      T.enter({ seed: 9212, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 24 });
      A.S.warClock = 340; UI.render();                       // December
      const dec = await __press('v2Next');
      // a save made mid-month (the 20th of a month, as a Week step left it) loads and goes to the next month's start
      A.S.warClock = 140; const save = A.serialize(); A.deserialize(save); UI.render();
      const mid = await __press('v2Next');
      return { steps, dec, mid, camp, MS: A.MONTH_START };
    });
    const one = s => !s.stuck && s.alive && (s.y1 === s.y0 ? s.m1 === s.m0 + 1 : s.m0 === 11 && s.m1 === 0 && s.y1 === s.y0 + 1) && r.MS[s.m1] + 1 === (s.d1 - s.y1 * 365);
    const bad = r.steps.concat([r.dec, r.mid]).filter(s => s.alive && !one(s));
    const quiet = r.steps.filter(s => s.cards === 0);
    const quietOk = quiet.length > 0 && quiet.every(s => !s.modal && s.toast.length > 0);
    const busy = r.steps.filter(s => s.cards > 0).length;
    return { ok: !bad.length && quietOk && busy > 0, detail: `${r.steps.length} months (${r.camp} on campaign): ${quiet.length} quiet (no dialog, toast "${quiet[0] && quiet[0].toast}"), ${busy} with cards; December -> month ${r.dec.m1} of ${r.dec.y1}; mid-month save -> day ${r.mid.d1 - r.mid.y1 * 365}${bad.length ? '; NOT ONE MONTH: ' + JSON.stringify(bad[0]) : ''}` };
  },

  // the quiet month's line is in the story, and its toast is gone after about two seconds
  async v2tQuietToast(pg) {
    await pg.evaluate(DRIVE);
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 9203, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 });
      for (let i = 0; i < 24; i++) {
        const lines = A.S.log.reduce((a, e) => a + e.lines.length, 0);
        const s = await __press('v2Next');
        if (s.cards === 0 && s.alive) {
          const L = A.S.log[A.S.log.length - 1].lines, last = L[L.length - 1][0];
          const t = document.getElementById('toast'), shown = t && t.classList.contains('ts-on');
          await new Promise(res => setTimeout(res, 2400));
          const gone = !t.classList.contains('ts-on');
          return { found: true, toast: s.toast, last, logged: A.S.log.reduce((a, e) => a + e.lines.length, 0) > lines, shown, gone, modal: s.modal };
        }
      }
      return { found: false };
    });
    const ok = r.found && !r.modal && r.toast === r.last && r.logged && r.shown && r.gone;
    return { ok, detail: r.found ? `toast "${r.toast}", story "${r.last}", shown ${r.shown}, gone after 2.4 s ${r.gone}, dialog ${r.modal}` : 'no quiet month in 24' };
  },

  // the director: 0 to 3 scenes a month with season weights, from the seed alone
  async v2tBusyMonths(pg) {
    const r = await pg.evaluate(() => {
      const run = () => {
        T.enter({ seed: 9204, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 25 });
        const n = [0, 0, 0, 0, 0], seas = { winter: [0, 0], summer: [0, 0] }, V = A.V2T, d0 = V.director;
        V.director = function (pc) { const k = d0.apply(this, arguments); n[Math.min(4, k)]++; const s = V.SEASON(V.monthOf(A.S.warClock || 0)); if (seas[s]) { seas[s][0] += k; seas[s][1]++; } return k; };
        try { T.play(25); } finally { V.director = d0; }
        return { n, seas, fp: A.fingerprint() };
      };
      const a = run(), b = run();
      return { n: a.n, w: a.seas.winter[0] / a.seas.winter[1], s: a.seas.summer[0] / a.seas.summer[1], same: a.fp === b.fp };
    });
    const ok = r.n[4] === 0 && r.n[0] > 0 && r.n[1] > 0 && r.n[2] > 0 && r.n[0] > r.n[1] && r.s > r.w && r.same;
    return { ok, detail: `months with 0/1/2/3 drawn: ${r.n.slice(0, 4).join('/')} (more: ${r.n[4]}); a winter month ${r.w.toFixed(2)}, a summer month ${r.s.toFixed(2)}; same seed same world: ${r.same}` };
  },

  // same seed and same choices, played through the button with and without drawing every page: the same world
  async v2tSameWorld(pg) {
    await pg.evaluate(DRIVE);
    const r = await pg.evaluate(async () => {
      const life = async render => {
        T.enter({ seed: 9205, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 18 });
        for (let i = 0; i < 10; i++) await __press('v2Next', render);
        return { fp: A.fingerprint(), rng: A.rngState | 0, day: A.absDay() };
      };
      const a = await life(false), b = await life(true);
      return { a, b };
    });
    const ok = r.a.fp === r.b.fp && r.a.rng === r.b.rng && r.a.day === r.b.day;
    return { ok, detail: `plain ${r.a.fp} at day ${r.a.day}; drawn every poll ${r.b.fp} at day ${r.b.day}` };
  },

  // at most five places, War only while at war; at peace the army's pages sit under You
  async v2tPlaces(pg) {
    const out = [];
    for (const w of [420, 1366]) {
      await pg.setViewportSize({ width: w, height: w < 500 ? 900 : 768 });
      out.push(await pg.evaluate(() => {
        T.enter({ seed: 9206, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
        const pc = A.pc(), groups = () => UI.GROUPS.map(g => g.k), bar = () => [...document.querySelectorAll('[data-a="group"]')].map(b => b.dataset.v);
        const peace = { groups: groups(), bar: bar(), warUnder: (UI.groupOf('war') || {}).k, war: A.atWar(pc.realm).length };
        const foe = Object.keys(A.S.realms).find(id => id !== pc.realm && A.S.realms[id].alive && !A.hostile(pc.realm, id));
        // 99997-v2-war: the War place is there only for a war you fight in, so the noble enlists as the war begins
        A.declareWar(pc.realm, foe); if (A.V2W && !A.V2W.inWar(pc)) A.enlist(pc); UI.render();
        const war = { groups: groups(), bar: bar(), warUnder: (UI.groupOf('war') || {}).k, war: A.atWar(pc.realm).length };
        // every page still opens
        const seen = []; for (const g of UI.GROUPS) for (const [k] of UI.subsOf(g)) { UI.setTab(k); UI.render(); if (UI.tab === k) seen.push(k); }
        return { w: innerWidth, peace, war, seen };
      }));
    }
    const ok = out.every(o => o.peace.groups.length <= 5 && !o.peace.groups.includes('war') && o.peace.warUnder === 'you' &&
      o.war.war > 0 && o.war.groups.length === 5 && o.war.groups[4] === 'war' && o.war.warUnder === 'war' && o.peace.bar.length <= 5 && o.war.bar.length <= 5 && o.seen.includes('war') && o.seen.includes('codex'));
    return { ok, detail: out.map(o => `${o.w}px: peace ${o.peace.groups.join('/')} (bar ${o.peace.bar.length}), war ${o.war.groups.join('/')} (bar ${o.war.bar.length}); ${o.seen.length} pages open`).join('; ') };
  },

  // on the road the clock offers a day and a week, not a month; Next day is one day
  async v2tCampaign(pg) {
    await pg.evaluate(DRIVE);
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 9207, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 30 });
      const pc = A.pc(), home = A.S.prov[pc.home];
      const far = A.S.prov.filter(P => P && P.owner === pc.realm && P.id !== pc.home).sort((a, b) => Math.hypot(b.x - home.x, b.y - home.y) - Math.hypot(a.x - home.x, a.y - home.y))[0];
      const j = A.JR && A.JR.start(pc, far.id, 'visit'); UI.render();
      const acts = [...document.querySelectorAll('#clk [data-a]')].map(e => e.dataset.a);
      const day = await __press('v2Day');
      const refuse = (UI.A.v2Next(), UI.stepper.run);
      return { j: !!j, camp: A.V2T.campaign(), acts, day, refuse };
    });
    const ok = r.j && r.camp && r.acts.includes('v2Day') && r.acts.includes('v2Week') && !r.acts.includes('v2Next') && (r.day.cards > 0 || r.day.d1 - r.day.d0 === 1) && !r.refuse;
    return { ok, detail: `journey ${r.j}, campaign ${r.camp && r.camp.k}; clock ${r.acts.join(', ')}; Next day ${r.day.d0} -> ${r.day.d1} (${r.day.cards} cards); Next month refused ${!r.refuse}` };
  },

  // no chapter card: a chapter opens on the Life tab, its third aim chosen there; faith aims only for the devout
  async v2tChapters(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9208, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 13 });
      const pc = A.pc(); pc.piety = 30;
      T.play(3);
      const card = A.S.evShown && A.S.evShown.chp_card != null ? 1 : 0;
      const c = pc.chap && pc.chap.cur;
      UI.tab = 'life'; UI.render();
      const pick = document.querySelectorAll('[data-a="chpPick"]').length;
      const third = c && c.alt ? c.alt.l : null;
      if (pick) document.querySelector('[data-a="chpPick"][data-v="1"]').click();
      const after = pc.chap.cur.aims.map(a => a.l), still = document.querySelectorAll('[data-a="chpPick"]').length;
      const D = A.CH.aim('pious'), plain = D.fit(pc);
      pc.job = { c: 'clergy', r: 0 }; const clergy = D.fit(pc); pc.job = null;
      const amb = A.LF && A.LF.AMB && A.LF.AMB.faith ? A.LF.AMB.faith.fit(Object.assign({}, pc, { piety: 45 })) : 0;
      return { open: !!c, card, pick, took: third == null || after.includes(third), still, plain, clergy, amb, logged: A.S.log.some(e => e.lines.some(l => /^Chapter .* begins/.test(l[0]) || / Chapter .* begins/.test(l[0]))) };
    });
    const ok = r.open && r.card === 0 && r.took && r.still === 0 && r.plain === 0 && r.clergy > 0 && r.amb === 0 && r.logged && (r.pick === 2 || r.pick === 0);
    return { ok, detail: `chapter open ${r.open}, chapter cards ${r.card}, pick buttons ${r.pick} -> ${r.still}, story line ${r.logged}; shrine aim fit: plain ${r.plain}, clergy ${r.clergy}; faith ambition at piety 45: ${r.amb}` };
  },
};
