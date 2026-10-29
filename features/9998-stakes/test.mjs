// 9998-stakes: every choice says what it stakes; a disabled choice says why; white and red checks.
const SETUP = () => {
  window.STT = {
    start(o) {
      T.enter(Object.assign({ seed: 99801, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 24 }, o || {}));
      UI.set.hints = false; if (UI.MOMENTS) { UI.set.cutins = false; UI.MOMENTS.skip && UI.MOMENTS.skip(); }
      document.documentElement.dataset.motion = 'off';
      A.S.queue = []; UI.render();
    },
    // plant an event and draw it; returns the rows as drawn
    show(id) {
      A.S.queue = [{ type: 'event', ev: id, forced: true }];
      A.headReady(); UI.render();
      return STT.rows();
    },
    rows() {
      const m = document.getElementById('modal');
      if (!m) return { rows: [], locked: [] };
      const row = b => ({ label: (b.querySelector('.grow') || b).firstChild ? ((b.querySelector('.grow') || b).childNodes[0].textContent || '').trim() : '',
        chips: [...b.querySelectorAll('.st-row .st-c')].map(c => c.textContent.replace(/\s+/g, ' ').trim()),
        red: !!b.querySelector('.st-red'), white: !!b.querySelector('.st-wr, .st-white'), again: !!b.querySelector('.st-again') });
      return { rows: [...m.querySelectorAll('button[data-a="evChoose"]')].map(row), locked: [...m.querySelectorAll('.st-lock')].map(x => x.textContent.replace(/\s+/g, ' ').trim()) };
    },
    // choose choice vi with the roll forced to fail (or succeed)
    choose(vi, ok) {
      const ch = A.chance; A.chance = () => !!ok;
      try { A.eventChoose(vi); } finally { A.chance = ch; }
      A.eventClose(); A.S.queue = [];
    },
    // a planted scene with one of each kind of stake
    plant() {
      A.defEvents([{ id: 'stx_test', title: 'A test', text: 'A test scene.', w: 0, choices: [
        { t: 'Pay his rent', r: 'Paid.', fx: { coin: -30, them: { op: 25 }, happy: 2 } },
        { t: 'Argue him down', check: { s: 'persuasion', s2: 'wil', d: 45 }, win: { r: 'Yes.', fx: { coin: 4, fame: 1 } }, lose: { r: 'No.', fx: { health: -10, coin: -5, them: { op: -8 } } } },
        { t: 'Wade the ford', check: { s: 'sta', s2: 'str', d: 50 }, win: { r: 'Across.', fx: { honor: 2 } }, lose: { r: 'Taken.', fx: { wound: 'leg', health: -15 } } },
        { t: 'Ask nicely', check: { s: 'persuasion', d: 40 }, win: { r: 'Fine.', fx: { happy: 2 } }, lose: { r: 'He shrugs.' } },
        { t: 'Hire the whole boat', req: p => p.coin >= 400, r: 'Hired.', fx: { coin: -400 } },
        { t: 'Read the sign', req: (p, C) => C.literate(p) || C.prof(p, 'stewardship', 60), r: 'Read.', fx: { int: 1 } },
        { t: 'The secret way', req: p => !!p.flags.stx_secret, r: 'Through.', fx: { flag: 'stx_used' } },
        { t: 'Mark the stone', r: 'Marked.', fx: { flag: 'stx_marked', trait: 'brave', event: 'stx_none' } },
        { t: 'Say a word for him', r: 'Said.', fx: p => { p.honor += 2; A.addOp(p, p, 0); } },
        { t: 'Walk away', r: 'Gone.', fx: {} },
      ] }]);
    },
  };
};

export default {
  // the chips, as the choice is written: costs, gains, what a check brings and risks; hidden things stay hidden; pure
  async stChips(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      if (!A.STAKES) return { err: 'no A.STAKES in this build' };
      STT.start(); STT.plant();
      const pc = A.pc(); pc.coin = 50; pc.literate = false;
      A.S.queue = [{ type: 'event', ev: 'stx_test', forced: true }]; A.headReady();
      const rng0 = A.rngState, h0 = T.hash(A.S);
      UI.render(); UI.render();
      const pure = A.rngState === rng0 && T.hash(A.S) === h0;
      const R = STT.rows();
      const lf = [...document.querySelectorAll('#modal .lf-stake')].map(x => x.textContent);
      A.S.queue = []; UI.render();
      return { R, pure, lf };
    });
    if (r.err) return { ok: false, detail: r.err };
    const by = l => r.R.rows.find(x => x.label === l) || { chips: [] };
    const has = (l, rx) => by(l).chips.some(c => rx.test(c));
    const fails = [];
    if (!has('Pay his rent', /^Costs 30 suns$/)) fails.push('cost');
    if (!has('Pay his rent', /▲▲.*their regard/)) fails.push('large gain');
    if (!has('Pay his rent', /▲.*spirits/)) fails.push('small gain');
    if (!has('Argue him down', /^If it works: \+4 suns, ▲.*renown$/)) fails.push('win');
    if (!has('Argue him down', /^If it fails: hurt, −5 suns, their regard$/)) fails.push('fail (97 words)');
    if (!has('Ask nicely', /^Nothing lost if it fails$/)) fails.push('nothing lost');
    if (!has('Wade the ford', /If it fails: a wound, hurt/)) fails.push('wound');
    if (by('Mark the stone').chips.length) fails.push('hidden flag/trait/event shown: ' + by('Mark the stone').chips);
    if (!has('Say a word for him', /^• .*honour$/)) fails.push('function touch');
    if (by('Walk away').chips.length) fails.push('nothing to say, but chips');
    if (!r.pure) fails.push('drawing changed the state or the stream');
    return { ok: !fails.length, detail: fails.length ? 'missing: ' + fails.join('; ') + ' ' + JSON.stringify(r.R.rows) : `${r.R.rows.length} rows, ${r.lf.length} stake lines, pure` };
  },

  // dotsMatchFx (backtests #5): over every event in the build, each chip of a plain choice names a family its fx
  // changes, and each family it changes has a chip (up to the row's three)
  async stDotsMatchFx(pg) {
    const r = await pg.evaluate(() => {
      const ST = A.STAKES; if (!ST) return { err: 'no A.STAKES' };
      T.enter({ seed: 99802, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 });
      const pc = A.pc();
      const fam = (fx) => {
        const out = new Set();
        for (const k in fx) {
          const d = ST.KEY[k]; if (!d) continue;
          const v = k === 'them' ? (fx.them && typeof fx.them === 'object' ? (fx.them.op || (fx.them.type ? 1 : 0)) : 0) : typeof fx[k] === 'number' ? fx[k] : fx[k] ? 1 : 0;
          if (v && !(k === 'them' && !fx.them.op)) out.add(d.w);
        }
        if (typeof fx.coin === 'number' && fx.coin) out.add('coin');
        return out;
      };
      let n = 0, phantom = 0, missing = 0; const bad = [];
      for (const e of Object.values(A.EV)) for (const c of e.choices || []) {
        if (c.check || c.group || !c.fx || typeof c.fx !== 'object') continue;
        const F = fam(c.fx); if (!F.size) continue;
        n++;
        const label = typeof c.t === 'string' ? c.t : '';
        const all = ST.choiceChips(c, e, { ev: e.id, ctx: {} }, pc, { t: label });
        const chips = all.filter(x => (x.k === 'gain' || x.k === 'cost') && (x.coin || x.treasury || (x.part && ST.KEY[x.part.k]) || /^\+.*suns?$/.test(x.t)));
        const words = chips.map(x => x.treasury ? 'the treasury' : x.coin || /suns?$/.test(x.t) ? 'coin' : x.t.replace(/^[▲▼]+\s*/, ''));
        for (const w of words) if (!F.has(w) && !/,/.test(w) && w !== 'the treasury') { phantom++; if (bad.length < 6) bad.push(`${e.id}: chip ${w} not in ${[...F]}`); }
        const priced = /\bsuns?\b|\d/.test(label);
        for (const f of F) if (!words.includes(f) && !(f === 'coin' && priced) && all.length < 3 && f !== 'the treasury') { missing++; if (bad.length < 6) bad.push(`${e.id}: ${f} has no chip (${words})`); }
      }
      return { n, phantom, missing, bad };
    });
    if (r.err) return { ok: false, detail: r.err };
    return { ok: r.n > 1000 && !r.phantom && !r.missing, detail: `${r.n} plain choices with an effect; chips naming nothing the effect changes ${r.phantom}, changed families with no chip ${r.missing} ${r.bad.join(' | ')}` };
  },

  // whiteRetry (backtests #6): a failed white check is held back until your value in it has risen 5, then it says so
  async stWhiteRetry(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      if (!A.STAKES) return { err: 'no A.STAKES' };
      STT.start(); STT.plant();
      const pc = A.pc(), ck = A.EV.stx_test.choices[1].check;
      let R0 = STT.show('stx_test');
      const vi = R0.rows.findIndex(x => x.label === 'Argue him down');
      const white = R0.rows[vi].white;
      STT.choose(vi, false);
      const rec = pc.retry && pc.retry['stx_test:1'];
      const R1 = STT.show('stx_test'); A.S.queue = [];
      const lockedAfterFail = !R1.rows.some(x => x.label === 'Argue him down') && R1.locked.some(t => /Argue him down.*Not yet: you failed this in \d+\. Grow 5 more in Persuasion and Willpower/.test(t));
      // +3: still held back
      const v0 = A.checkVal(pc, ck);
      for (let i = 0; i < 60 && A.checkVal(pc, ck) < v0 + 3; i++) A.trainSkill(pc, 'persuasion', 1);
      const R2 = STT.show('stx_test'); A.S.queue = [];
      const stillLocked = !R2.rows.some(x => x.label === 'Argue him down');
      for (let i = 0; i < 80 && A.checkVal(pc, ck) < v0 + 5.5; i++) A.trainSkill(pc, 'persuasion', 1);
      const R3 = STT.show('stx_test');
      const back = R3.rows.find(x => x.label === 'Argue him down');
      const again = !!back && back.again && back.chips.some(c => /^Again: you are better at this now \(\+\d+ since \d+\)$/.test(c));
      const vi3 = R3.rows.findIndex(x => x.label === 'Argue him down');
      STT.choose(vi3, true);
      const cleared = !(pc.retry && pc.retry['stx_test:1']);
      return { white, rec, lockedAfterFail, stillLocked, again, cleared, l1: R1.locked, c3: back && back.chips };
    });
    if (r.err) return { ok: false, detail: r.err };
    const ok = r.white && r.rec && r.rec.v > 0 && r.lockedAfterFail && r.stillLocked && r.again && r.cleared;
    return { ok, detail: `white mark ${r.white}; remembered ${JSON.stringify(r.rec)}; held back after the failure ${r.lockedAfterFail} (${r.l1}); still at +3 ${r.stillLocked}; back at +5 with "Again" ${r.again} (${r.c3}); a success forgets it ${r.cleared}` };
  },

  // redMarked (backtests #6): every check whose loss lasts, or in a once-in-a-life scene, is red, and is drawn as ONE
  // CHANCE; a failed red check never comes back
  async stRedMarked(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const ST = A.STAKES; if (!ST) return { err: 'no A.STAKES' };
      // the rule over every event
      let red = 0, white = 0, wrong = 0; const bad = [];
      const lasting = fx => fx && (typeof fx === 'function' ? /\bdie\s*:|pcDeath\(|\bprison\s*:|imprison\(|\bwound\s*:|addWound\(|\bexile|\bdisown/.test(String(fx)) : !!(fx.die || fx.prison || fx.wound || fx.exile || fx.disown));
      for (const e of Object.values(A.EV)) for (const c of e.choices || []) {
        if (!c.check && !c.group) continue;
        const want = e.once || c.once || (c.lose && lasting(c.lose.fx)) || (c.check && c.check.fight && c.check.fight.lethal) ? 'red' : 'white';
        const got = ST.checkKind(c, e);
        if (got === 'red') red++; else white++;
        if (got !== want) { wrong++; if (bad.length < 5) bad.push(e.id); }
      }
      // the card draws it, and a failure locks it for good
      STT.start(); STT.plant();
      const pc = A.pc();
      const R0 = STT.show('stx_test');
      const vi = R0.rows.findIndex(x => x.label === 'Wade the ford');
      const drawnRed = R0.rows[vi].red && !R0.rows[vi].white;
      const card = document.querySelector('#modal button.sc-red .sc-oncew');
      STT.choose(vi, false);
      pc.st.sta += 30; pc.st.str += 30;
      const R1 = STT.show('stx_test'); A.S.queue = [];
      const gone = !R1.rows.some(x => x.label === 'Wade the ford') && R1.locked.some(t => /Wade the ford.*It does not come again/.test(t));
      return { red, white, wrong, bad, drawnRed, cardTag: card ? card.textContent : null, gone };
    });
    if (r.err) return { ok: false, detail: r.err };
    const ok = !r.wrong && r.red > 100 && r.white > 1000 && r.drawnRed && r.gone;
    return { ok, detail: `${r.red} red and ${r.white} white checks, ${r.wrong} misclassed ${r.bad}; drawn red ${r.drawnRed} (card tag "${r.cardTag}"); a failed red check gone for good, even 30 stronger ${r.gone}` };
  },

  // a choice out of reach says why, when the why is a goal you can work towards; a story gate stays hidden
  async stLockedWhy(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      if (!A.STAKES) return { err: 'no A.STAKES' };
      STT.start(); STT.plant();
      const pc = A.pc(); pc.coin = 12; pc.literate = false;
      const R0 = STT.show('stx_test'); A.S.queue = [];
      pc.coin = 500; pc.literate = true;
      const R1 = STT.show('stx_test'); A.S.queue = [];
      // the reader on the release's own reqs: thresholds read, story gates not
      const ST = A.STAKES;
      const reads = [p => p.coin >= 40, (p, C, ctx) => p.coin >= (ctx.fee || 30), p => p.literate, (p, C) => C.prof(p, 'bow', 35), (p, C) => C.prof(p, 'stealth', 30) || C.trait(p, 'deceitful'), p => (A.realm(p.ruler) || {}).treasury > 3e3];
      const hides = [p => !!p.flags.x, (p, C, ctx) => !!ctx.owned, (p, C) => C.married(p), p => p.coin >= 40 && !!p.flags.y, (p, C, ctx) => !!offer(ctx, 1)];
      return { R0, R1, read: reads.map(f => !!ST.parseReq(f)), hide: hides.map(f => !ST.parseReq(f)) };
    });
    if (r.err) return { ok: false, detail: r.err };
    const L = r.R0.locked;
    const fails = [];
    if (!L.some(t => /Hire the whole boat.*Needs 400 suns \(you have 12 suns\)/.test(t))) fails.push('coin');
    if (!L.some(t => /Read the sign.*Needs reading and writing, or Stewardship 60 \(you have \d+\)/.test(t))) fails.push('letters or a skill');
    if (L.some(t => /secret way/.test(t)) || r.R0.rows.some(x => /secret way/.test(x.label))) fails.push('a story gate showed');
    if (r.R1.locked.length || !r.R1.rows.some(x => x.label === 'Hire the whole boat') || !r.R1.rows.some(x => x.label === 'Read the sign')) fails.push('not open once you have it');
    if (r.read.includes(false)) fails.push('reader missed a threshold ' + r.read);
    if (r.hide.includes(false)) fails.push('reader read a story gate ' + r.hide);
    return { ok: !fails.length, detail: fails.length ? fails.join('; ') + ' ' + JSON.stringify(r.R0.locked) : `locked rows: ${L.join(' | ')}; open once reached` };
  },

  // the hook: another screen registers chips for its own buttons and a reason for a disabled one
  async stRegistry(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const ST = A.STAKES; if (!ST || !ST.add || !ST.why) return { err: 'no registry' };
      STT.start(); STT.plant();
      ST.add('stxBill', (v, pc) => [{ k: 'cost', t: '−' + A.coin(+v) }, { k: 'gain', t: '▲ the commons' }]);
      ST.why('stxBill', v => (+v > 100 ? 'The council will not hear it this season.' : ''));
      ST.add('choice', (c, e) => (e.id === 'stx_test' && c.t === 'Walk away' ? [{ k: 'note', t: 'Your advisor frowns' }] : []));
      const box = document.createElement('div'); box.id = 'stx-box';
      box.innerHTML = '<button data-a="stxBill" data-v="40">Lighter levies</button><button data-a="stxBill" data-v="400" disabled>Heavy levies</button>';
      document.body.appendChild(box);
      const n = ST.decorate(box);
      const chips = [...box.querySelectorAll('.st-row')].map(x => x.textContent);
      if (A.LF && A.LF.explainDisabled) A.LF.explainDisabled(box);
      const title = box.querySelector('[disabled]').getAttribute('title');
      const again = ST.decorate(box);
      const R = STT.show('stx_test'); A.S.queue = [];
      box.remove();
      ST.reg.stxBill = []; ST.reg.choice = (ST.reg.choice || []).slice(0, -1);
      return { n, again, chips, title, walk: (R.rows.find(x => x.label === 'Walk away') || {}).chips };
    });
    if (r.err) return { ok: false, detail: r.err };
    const ok = r.n === 2 && r.again === 0 && /−40 suns/.test(r.chips[0]) && /the commons/.test(r.chips[0]) && r.title === 'The council will not hear it this season.' && (r.walk || []).includes('Your advisor frowns');
    return { ok, detail: `decorated ${r.n} (again ${r.again}): ${JSON.stringify(r.chips)}; disabled title "${r.title}"; a choice adder: ${JSON.stringify(r.walk)}` };
  },

  // over real lives: the rows that change something show their stakes, every check shows what failing costs, drawing
  // stays pure, and an old save (no retry memory, a view from before) plays on
  async stInLives(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      if (!A.STAKES) return { err: 'no A.STAKES' };
      const starts = [{ seed: 99811, status: 'peasant', startAge: 16 }, { seed: 99812, status: 'noble', startAge: 20, sex: 'M' }, { seed: 99813, status: 'merchant', startAge: 22 }];
      let rows = 0, act = 0, actStake = 0, checks = 0, checkFail = 0, impure = 0, events = 0, locked = 0;
      for (const o of starts) {
        STT.start(o);
        for (let g = 0, seen = 0; g < 8000 && seen < 30; g++) {
          const h = A.headReady();
          if (h && h.type === 'event') {
            if (h.result) { A.eventClose(); continue; }
            const v = A.eventView(h); if (!v || v.skip) { A.eventAuto(); continue; }
            const e = A.EV[h.ev] || {}, rng0 = A.rngState, h0 = T.hash(A.S);
            UI.render();
            if (A.rngState !== rng0 || T.hash(A.S) !== h0) impure++;
            seen++; events++;
            for (const b of document.querySelectorAll('#modal button[data-a="evChoose"]')) {
              const vc = v.choices[+b.dataset.v], c = vc && vc.i >= 0 && e.choices ? e.choices[vc.i] : null;
              rows++;
              const txt = [...b.querySelectorAll('.st-row')].map(x => x.textContent).join(' ');
              if (c && (c.check || c.group || (c.fx && (typeof c.fx === 'function' || Object.keys(c.fx).length)))) { act++; if (txt.trim()) actStake++; }
              if (c && (c.check || c.group)) { checks++; if (/If it fails|Nothing lost/.test(txt)) checkFail++; }
            }
            locked += document.querySelectorAll('#modal .st-lock').length;
            A.eventAuto(); continue;
          }
          if (h) { A.skipPrompt(); continue; }
          if (!A.pc() || !A.pc().alive) break;
          A.advance(31);
        }
      }
      // an old save: no retry memory
      delete A.pc().retry; const s = T.play(2);
      A.S.queue = []; UI.render();
      return { rows, act, actStake, checks, checkFail, impure, events, locked, s };
    });
    if (r.err) return { ok: false, detail: r.err };
    const share = r.act ? r.actStake / r.act : 0;
    const ok = r.events >= 60 && share >= 0.9 && r.checkFail === r.checks && !r.impure && r.s !== undefined;
    return { ok, detail: `${r.events} scenes, ${r.rows} rows: ${(share * 100).toFixed(1)}% of the ${r.act} that change something show their stakes; ${r.checkFail}/${r.checks} checks say what failing costs; ${r.locked} rows out of reach drawn with a reason; impure draws ${r.impure}; an old save played on (${r.s})` };
  },
};
