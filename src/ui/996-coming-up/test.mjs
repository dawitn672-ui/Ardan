// 996-coming-up: the strip shows what is known to be ahead, hides what is not public, and never changes the world.
export default {
  async comingUpShows(pg) {
    const r = await pg.evaluate(() => {
      // the first seed whose peasant lives the year (cycle 2: seed 8's dies of a fever in 1106 once 9997 moves the dice)
      for (let seed = 8; seed < 14; seed++) { T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', startAge: 18 }); T.play(1); if (A.pc() && A.pc().alive) break; }
      const pc = A.pc(), S = A.S;
      const t = Object.values(S.people).find(p => p.alive && p.id !== pc.id && A.isAdult(p));
      // the strip holds the five soonest lines, so the life's own dated returns are set aside for the test's (the peasant's
      // apprenticeship, ending next month in the world after D-021's day-0 council fix, pushed the repayment off it)
      const keepSched = S.sched; S.sched = (S.sched || []).filter(s => !(s && s.item && UI.COMING.schedLine(s.item, pc)));
      A.schedule({ type: 'event', ev: 'ni_borrow_repaid', ctx: { pid: t.id, amt: '12 suns' }, forced: true }, 200);
      A.schedule({ type: 'event', ev: 'ni_secret_cost', ctx: { pid: t.id }, forced: true }, 100);      // a surprise: hidden
      A.schedule({ type: 'event', ev: 'gk_meet', label: 'The guild judges your masterpiece' }, 60);       // an item's own label
      // a custom of the realm, made due next month for the test
      const m0 = A.monthOf(A.today()).m, c = A.BIBLE.mine(pc).find(x => x.kind === 'year'), was = c && c.m;
      if (c) { c.m = (m0 + 1) % 12; if (pc.rb) delete pc.rb[c.id]; }
      S.time = A.initiativeCap(pc);
      const items = UI.COMING.items(pc).map(x => x.when + ' | ' + x.text);
      UI.tab = 'life'; UI.render();
      const el = document.querySelector('#tabbody .cu-strip'), txt = el ? el.textContent : '';
      if (c) c.m = was;
      S.sched = keepSched;
      return { items, shown: !!el, repay: txt.includes('is due to repay 12 suns'), own: txt.includes('The guild judges your masterpiece'),
        secret: /secret|betray/i.test(txt), custom: c ? items.some(x => x.startsWith('Next month') && x.includes(A.BIBLE.fill(pc, c.name))) : null, ini: txt.includes('Initiative is full') };
    });
    return { ok: r.shown && r.repay && r.own && !r.secret && r.custom !== false && r.ini, detail: r.items.join(' / ') };
  },

  async comingUpPure(pg) {
    const r = await pg.evaluate(() => {
      const run = look => {
        T.enter({ seed: 4040, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'F', startAge: 16 });
        let drawn = 0, moved = 0;
        T.play(5, { each: () => { if (!look) return; const r0 = A.rngState, h0 = T.hash(A.S); UI.tab = 'life'; UI.render(); UI.COMING.items(A.pc()); if (A.rngState !== r0 || T.hash(A.S) !== h0) moved++; if (document.querySelector('.cu-strip')) drawn++; } });
        return { w: T.hash(A.S.people) + ':' + A.rngState, drawn, moved };
      };
      const a = run(false), b = run(true);
      return { same: a.w === b.w, drawn: b.drawn, moved: b.moved };
    });
    return { ok: r.same && r.drawn > 0 && !r.moved, detail: `drawn ${r.drawn} times; draws that moved the state or the dice ${r.moved}; the same world with and without looking ${r.same}` };
  },
  // cycle 2 (design B4): 13 of 16 Week steps ended "Nothing new in your story: the days went by as days do". The note
  // now says what the week changed (skills, regard, what Coming up brought nearer), or where and when you are
  // v2 (99992-v2-time): cuStepNote dropped. It drove 16 Week steps and read 84's step note card; the Week step and the
  // card are gone (Next month only; a quiet month is a 2-second toast and a story line, v2tQuietToast).
  // cycle 2 (design B7): "What Took Your Father" had no second beat for five years. Every story start now has one
  // two to five months in, named in Coming up before it comes
  async cuStoryBeats(pg) {
    const r = await pg.evaluate(() => {
      const out = [];
      for (const S of (A.STARTS || []).filter(s => UI.COMING.BEATS.includes(s.id))) {
        A.newGame(Object.assign({ seed: 9960 + out.length, sex: 'F' }, S.cr, { story: S.id }));
        let shown = null, listed = false;
        // v2 (99992-v2-time): the month's scenes now fall on its days, so A.advance stops more often inside a month;
        // eight months are counted in days, not in calls
        const d0 = A.absDay();
        for (let m = 0; m < 80 && A.absDay() - d0 < 8 * 31 && !shown && A.pc().alive; m++) {
          A.advance(Math.min(31, d0 + 8 * 31 - A.absDay()));
          if (!listed) listed = (UI.COMING.items(A.pc()) || []).some(x => x.kind === 'promise');
          let g = 0, q;
          while ((q = A.headReady()) && g++ < 60) {
            if (q.type === 'event') { if (q.ev === 'cu_beat_' + S.id) shown = Math.round((A.absDay() - A.S.start0) / 30) || m + 1; A.eventView(q); A.eventChoose(0); A.eventClose(); }
            else A.skipPrompt();
          }
        }
        out.push({ id: S.id, shown, listed });
      }
      return out;
    });
    const miss = r.filter(x => !x.shown), unlisted = r.filter(x => !x.listed);
    return { ok: r.length === 20 && !miss.length && unlisted.length <= 2, detail: `${r.length} stories: second beat within 8 months for ${r.length - miss.length}${miss.length ? ' (missing ' + miss.map(x => x.id).join(', ') + ')' : ''}; named in Coming up first for ${r.length - unlisted.length}` };
  },
};
