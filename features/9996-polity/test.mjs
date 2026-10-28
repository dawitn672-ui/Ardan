// Tests for the Polity (9996-polity). See README.md, "Measured by".
export default {
  // every office has a living holder of an estate its law allows, and few holders were made for it
  async poOfficesFilled(pg) {
    const r = await pg.evaluate(() => {
      const K = seed => ({ seed, race: 'human', realm: 'POL-03', status: 'noble', sex: 'M', startAge: 20 });
      const out = [];
      for (const [seed, lands, realm] of [[4101, 'known', 'POL-03'], [4102, 'known', 'POL-01'], [4103, 'great', 'POL-36']]) {
        const P = A.POL; P.stats.made = 0; P.stats.house = 0; P.stats.filled = 0;
        A.newGame(Object.assign(K(seed), { lands, realm }));
        // the first month: 66's market towns are chosen, and the shires get their offices
        for (let i = 0; i < 3; i++) { A.advance(20); let h, g = 0; while ((h = A.headReady()) && g++ < 200) { if (h.type === 'event') A.eventAuto(); else A.S.queue.shift(); } }
        let n = 0, ok = 0, bad = [], realms = 0, per = [];
        for (const x of P.realms()) {
          realms++;
          const offs = x.pol ? x.pol.off : [];
          per.push(offs.length + Object.values(x.council || {}).filter(id => A.P(id) && A.P(id).alive).length);
          for (const o of offs) {
            n++;
            const p = A.P(o.pid);
            if (p && p.alive && P.offEst(x, o.k).includes(P.estateOf(p)) && p.realm === x.id) ok++; else if (bad.length < 4) bad.push(`${x.id}/${o.id}:${p ? P.estateOf(p) : 'none'}`);
          }
        }
        per.sort((a, b) => a - b);
        out.push({ seed, lands, realms, n, ok, made: P.stats.made, house: P.stats.house, bad, p10: per[Math.floor(per.length * .1)], med: per[Math.floor(per.length / 2)], p90: per[Math.floor(per.length * .9)] });
      }
      return out;
    });
    const ok = r.every(x => x.n > 0 && x.ok === x.n && x.made / x.n < .05);
    return { ok, detail: r.map(x => `${x.lands} ${x.seed}: ${x.ok}/${x.n} offices held in ${x.realms} realms (council + offices a realm p10/med/p90 ${x.p10}/${x.med}/${x.p90}); made new ${x.made} (${Math.round(100 * x.made / Math.max(1, x.n))}%), house heads named ${x.house}${x.bad.length ? '; BAD ' + x.bad.join(' ') : ''}`).join(' | ') };
  },

  // 1,000 synthetic courts drawn from a real world's court states: the pass rate within 360 days sits within 5 points
  // of 56's one-shot odds; debates come most often when the balance is close
  async poBillOdds(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 4201, race: 'human', realm: 'POL-03', status: 'peasant', sex: 'M', startAge: 16 });
      T.play(2);
      const P = A.POL, RI = A.RI, courts = [];
      let seed = 12345;
      const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
      const realms = P.realms().filter(x => x.pol && !(A.pc() && A.pc().ruler === x.id));
      const keep = realms.map(x => [x.treasury, x.debt, x.legit]);
      try {
        for (let v = 0; courts.length < 1000 && v < 40; v++) {
          for (const x of realms) {
            x.treasury = Math.round((x.income || 1) * [.1, .4, 1, 2, 3.5][v % 5]); x.debt = v % 7 === 0 ? (x.income || 1) * 1.2 : 0; x.legit = [35, 50, 65, 80, 95][Math.floor(v / 5) % 5];
            const Tl = RI.tally(x);
            for (const k in RI.PUSH) {
              const t = Tl[k]; if (!RI.PUSH[k].law || !RI.PUSH[k].ok(x) || !t.pro.length || t.sup <= .4) continue;
              const B = P.billTarget(x, k, Tl);
              courts.push({ p0: B.o.p, P: B.P, m: B.m, mEst: B.mEst, h: B.h });
              if (courts.length >= 1000) break;
            }
            if (courts.length >= 1000) break;
          }
        }
      } finally { realms.forEach((x, i) => { x.treasury = keep[i][0]; x.debt = keep[i][1]; x.legit = keep[i][2]; }); }
      // run each court's bill as POL.billCount runs it, with the test's own dice
      let pass = 0, p0 = 0, deb = { close: 0, closeN: 0, far: 0, farN: 0 }, counts = 0;
      for (const c of courts) {
        const b = { m0: c.m, dm: 0, h: c.h, n: 0, st: 0, P: c.P, log: [] }, R = { pol: { bill: b } };
        let won = false;
        while (true) {
          const o = P.billOdds(R), x = rnd();
          const out = x < o.pass ? 'pass' : x < o.pass + o.stall ? 'stall' : x < o.pass + o.stall + o.deb ? 'deb' : 'adv';
          b.n++; counts++;
          if (Math.abs(o.m) < .2) { deb.closeN++; if (out === 'deb') deb.close++; } else { deb.farN++; if (out === 'deb') deb.far++; }
          if (out === 'pass') { won = true; break; }
          if (out === 'stall') { b.st++; if (b.st >= P.BILL.stalls) break; }
          if (out === 'deb') P.moveBill(R, rnd() < Math.max(.2, Math.min(.8, .5 + .25 * c.mEst)) ? P.BILL.dm : -P.BILL.dm);
          if (b.n >= P.BILL.checks) break;
        }
        if (won) pass++;
        p0 += c.p0;
      }
      return { n: courts.length, pass: pass / courts.length, p0: p0 / courts.length, close: deb.closeN ? deb.close / deb.closeN : null, far: deb.farN ? deb.far / deb.farN : null, counts: counts / courts.length };
    });
    const gap = Math.abs(r.pass - r.p0) * 100;
    const ok = r.n >= 1000 && gap <= 5 && (r.close == null || r.far == null || r.close > r.far);
    return { ok, detail: `${r.n} courts: bills passed ${(r.pass * 100).toFixed(1)}% within 360 days against 56's one-shot odds of ${(r.p0 * 100).toFixed(1)}% (${gap.toFixed(1)} points); a debate at ${r.close != null ? (r.close * 100).toFixed(1) : '-'}% of counts when |m| < 0.2, ${r.far != null ? (r.far * 100).toFixed(1) : '-'}% otherwise; ${r.counts.toFixed(1)} counts a bill` };
  },

  // the bill's track and odds draw purely, the four outcomes sum to 100%, and a count moves the track
  async poBillTrack(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 4301, race: 'human', realm: 'POL-02', status: 'royal', sex: 'M', startAge: 20 });
      const pc = A.pc(), x = A.realm('POL-02'), P = A.POL;
      A.makeRuler(pc, x.id); P.init(x); x.pol.bill = null;
      const k = Object.keys(A.RI.PUSH).find(k => A.RI.PUSH[k].law && A.RI.PUSH[k].ok(x));
      A.S.time = 5; UI.A.poPropose(k);
      const b = x.pol.bill, o = P.billOdds(x);
      const sum = Math.round((o.pass + o.adv + o.stall + o.deb) * 100);
      UI.screen = 'game'; UI.tab = 'realm'; UI.realmView = 'pol';
      const h0 = T.hash(A.S), rng0 = A.rngState;
      UI.render(); const html = document.querySelector('.po-wrap') ? document.querySelector('.po-wrap').innerHTML : '';
      const tip = UI.TIPS.poBill(x.id);
      const same = T.hash(A.S) === h0 && A.rngState === rng0;
      b.next = A.absDay(); P.billMonth();
      const after = x.pol.bill ? x.pol.bill.log.length : (x.pol.last ? x.pol.last.log.length : -1);
      return { k, opened: !!b, sum, same, track: (html.match(/po-g /g) || []).length, odds: /pass \d+%/.test(html), tip: /Balance m/.test(tip), after, src: b && b.src };
    });
    const ok = r.opened && r.sum >= 99 && r.sum <= 101 && r.same && r.track === 6 && r.odds && r.tip && r.after === 1;
    return { ok, detail: `a bill for ${r.k} brought by the player (${r.src}); next-count odds sum to ${r.sum}%; ${r.track} notches drawn; drawn ${r.same ? 'purely' : 'WITH CHANGES'}; a count logs ${r.after}` };
  },

  // the same seed gives the same votes; a candidate who broke a promise to four electors loses; the tally names all
  async poElectionDeterministic(pg) {
    const r = await pg.evaluate(() => {
      const P = A.POL, run = () => {
        A.newGame({ seed: 4401, race: 'human', realm: 'POL-03', status: 'peasant', sex: 'M', startAge: 16 });
        const x = P.realms().find(z => z.gov === 'elective') || P.realms().find(z => P.elective(z));
        const rec = P.election(x, 'test');
        return { x, rec };
      };
      const a = run(), A1 = JSON.stringify(a.rec.rounds), b = run(), B1 = JSON.stringify(b.rec.rounds);
      const x = b.x, win = b.rec.winner, E = b.rec.electors.filter(e => e !== win);
      // the winner broke promises to four electors (other than themself)
      x.pol.broken = {}; for (const e of E.slice(0, 4)) x.pol.broken[e] = [win];
      const rec2 = P.election(x, 'test2');
      const lines = P.voteLine(x, rec2);
      return { id: x.id, gov: x.gov, same: A1 === B1, n: b.rec.electors.length, named: P.voteLine(x, b.rec).length, win: A.fullName(A.P(win), false), win2: A.P(rec2.winner) ? A.fullName(A.P(rec2.winner), false) : '?', lost: rec2.winner !== win, line: lines.slice(0, 3).join('; '), rounds: rec2.rounds.length };
    });
    const ok = r.same && r.named === r.n && r.n >= 5 && r.lost;
    return { ok, detail: `${r.id} (${r.gov}): ${r.n} electors, the same votes on the same seed ${r.same}; ${r.named} votes named; ${r.win} won, and after breaking promises to four electors ${r.lost ? 'lost to ' + r.win2 : 'STILL WON'} (${r.rounds} round${r.rounds > 1 ? 's' : ''}): ${r.line}` };
  },

  // raising an obligation with a favour owed is free and spends it; without one it is tyranny (−15 / −3), once a year
  async poContractHook(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 4501, race: 'human', realm: 'POL-02', status: 'royal', sex: 'M', startAge: 20 });
      const pc = A.pc(), x = A.realm('POL-02'), P = A.POL;
      A.makeRuler(pc, x.id); P.init(x); P.fillContracts(x);
      const hs = A.realmHouses(x.id).filter(P.landed).slice(0, 3), [h1, h2, h3] = hs;
      const head = A.houseHead(h1.id); if (!pc.rel[head.id]) A.link(pc, head, 'acquaint', 10, 'acquaint');
      A.addFavor(pc, head.id, 1);
      const op = h => Math.round(h.op), o1 = op(h1), o3 = op(h3), f0 = A.favorsOf(pc, head.id);
      UI.A.poOath(`${h1.id}|levy|1`);
      const free = { op: op(h1) - o1, fav: A.favorsOf(pc, head.id) - f0, lv: h1.contract.levy, rest: op(h3) - o3 };
      const o2 = op(h2), o3b = op(h3);
      UI.A.poOath(`${h2.id}|levy|1`);
      const tyr = { op: op(h2) - o2, rest: op(h3) - o3b, lv: h2.contract.levy };
      const lv3 = h3.contract.levy; UI.A.poOath(`${h3.id}|tax|1`);
      const second = { tax: h3.contract.tax, was: lv3 };
      return { free, tyr, second };
    });
    const ok = r.free.op === 0 && r.free.fav === -1 && r.free.lv === 2 && r.free.rest === 0 && r.tyr.op === -15 && r.tyr.rest === -3 && r.tyr.lv === 2 && r.second.tax === 1;
    return { ok, detail: `with a favour owed: opinion ${r.free.op}, favours ${r.free.fav}, levy now ${r.free.lv}, others ${r.free.rest}; without: ${r.tyr.op} with the house, ${r.tyr.rest} with the rest; a second tyrannical change the same year: tax stays ${r.second.tax}` };
  },

  // a peace that moves the player's home queues po_new_crown; each of its three ways does what it says
  async poHomeCeded(pg) {
    const r = await pg.evaluate(() => {
      const ways = {};
      for (const i of [0, 1, 2]) {
        A.newGame({ seed: 4601, race: 'human', realm: 'POL-03', status: 'peasant', sex: 'M', startAge: 20 });
        const pc = A.pc(), home = A.S.prov[pc.home], from = pc.realm;
        const to = (home.adj || []).map(j => A.S.prov[j].owner).find(o => o && o !== from && A.realm(o) && A.realm(o).alive) || Object.keys(A.S.realms).find(id => id !== from && A.S.realms[id].alive);
        A.S.queue = [];
        A.transferProv(home, to, false);
        const q = A.S.queue.find(x => x.ev === 'po_new_crown');
        if (!q) { ways[i] = { queued: false }; continue; }
        const v = A.eventView(q); A.eventChoose(i);
        ways[i] = { queued: true, choice: v.choices[i].t, realm: pc.realm === to ? 'new' : 'old', home: A.S.prov[pc.home].owner === from ? 'old' : 'new', resist: !!pc.flags.po_resist };
      }
      return ways;
    });
    const ok = r[0].queued && r[0].realm === 'new' && r[1].queued && r[1].home === 'old' && r[1].realm === 'old' && r[2].queued && r[2].resist;
    return { ok, detail: Object.values(r).map(w => w.queued ? `"${w.choice}": realm ${w.realm}, home ${w.home}${w.resist ? ', resisting' : ''}` : 'NOT QUEUED').join('; ') };
  },

  // legitimacy's parts sum to its mark, and a New Year moves it a fifth of the gap
  async poLegitParts(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 4701, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
      const P = A.POL, out = [];
      for (const x of P.realms().slice(0, 12)) {
        const parts = P.legitParts(x), T = P.legitTarget(x), sum = Math.max(0, Math.min(100, Math.round(parts.reduce((a, y) => a + y[1], 0))));
        x.legit = 40; P.year(x); const T2 = x.pol.T;
        out.push({ id: x.id, sum, T, moved: x.legit, want: Math.round((40 + .2 * (T2 - 40)) * 10) / 10, n: parts.length });
      }
      return out;
    });
    const ok = r.every(x => x.sum === x.T && Math.abs(x.moved - x.want) < .11);
    return { ok, detail: r.slice(0, 5).map(x => `${x.id}: ${x.n} parts sum to ${x.sum} = mark ${x.T}; 40 → ${x.moved}`).join('; ') };
  },

  // the Polity view draws purely for a ruler and for a lord, escapes names, and fits a phone
  async poPure(pg) {
    await pg.setViewportSize({ width: 390, height: 844 });
    const r = await pg.evaluate(() => {
      const out = {};
      for (const [k, st] of [['ruler', 'royal'], ['lord', 'noble']]) {
        T.enter({ seed: 4801, race: 'human', realm: 'POL-02', status: st, sex: 'F', startAge: 22 });
        const pc = A.pc(), x = A.realm('POL-02');
        if (k === 'ruler') { A.makeRuler(pc, x.id); }
        T.play(1);
        const c = A.P(x.council.chancellor); if (c) c.given = '<b>Bad</b>';
        UI.tab = 'realm'; UI.realmView = 'pol'; UI.poOpen = true;
        const h0 = T.hash(A.S), rng0 = A.rngState;
        UI.render(); UI.render();
        const wrap = document.querySelector('.po-wrap');
        const html = wrap ? wrap.innerHTML : '';
        out[k] = { same: T.hash(A.S) === h0 && A.rngState === rng0, drawn: !!wrap, cards: (html.match(/class="card po-card"/g) || []).length, esc: html.includes('&lt;b&gt;Bad') && !html.includes('<b>Bad'), wide: document.documentElement.scrollWidth <= 392 };
      }
      return out;
    });
    await pg.setViewportSize({ width: 1366, height: 768 });
    const ok = ['ruler', 'lord'].every(k => r[k].same && r[k].drawn && r[k].cards >= 4 && r[k].esc && r[k].wide);
    return { ok, detail: ['ruler', 'lord'].map(k => `${k}: ${r[k].cards} cards, ${r[k].same ? 'pure' : 'CHANGED STATE'}, names ${r[k].esc ? 'escaped' : 'NOT ESCAPED'}, ${r[k].wide ? 'no sideways scroll at 390' : 'SCROLLS SIDEWAYS'}`).join('; ') };
  },

  // every po_ scene renders its choices with no raw token
  async poScenesRender(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 4901, race: 'human', realm: 'POL-02', status: 'noble', sex: 'M', startAge: 30 });
      T.play(1);
      const pc = A.pc(), x = A.realm(pc.realm), P = A.POL, ru = A.P(x.ruler), oth = Object.values(A.S.people).find(p => p.alive && p.id !== pc.id && A.isAdult(p) && p.realm === x.id);
      pc.coin = 5000; P.init(x);
      const o = x.pol.off[0]; o.pid = pc.id;
      const ctx = { rid: x.id, pid: oth.id, poOff: o.id, shire: 'Lorina', realmT: x.short, bill: 'heavier taxes', estate: 'the Guilds', pk: 'taxUp', friendName: 'Ser Odo', foeName: 'Ser Ivo', dd: 50, men: 40, scut: '240 suns', scutN: 240, toId: 'POL-01', fromId: x.id, oldT: x.short, newT: 'Aldmark', homeT: 'Lorina', cand: 1, nV: 5, nE: 7, won: 1, bribe: '40 suns', bribeN: 40 };
      x.pol.bill = { k: 'taxUp', g: 'tax', to: 3, from: 2, log: [], n: 0, st: 0, m0: 0, dm: 0, h: .1, P: .3, sup: [], opp: [], next: A.absDay() + 60 };
      x.pol.elect = { electors: [pc.id], cands: [oth.id], gifts: {}, slander: {} }; x.pol.vote = { rounds: [{}], electors: [], winner: oth.id };
      const bad = [], words = [];
      for (const id of Object.keys(A.EV).filter(k => /^po_/.test(k))) {
        const q = { type: 'event', ev: id, ctx: Object.assign({}, ctx) };
        let v; try { v = A.eventView(q); } catch (e) { bad.push(id + ': ' + e.message); continue; }
        if (!v || q.ctx.skip) continue;
        const txt = String(v.text || ''); words.push([id, txt.split(/\s+/).length]);
        if (T.raw.test(txt) || (v.choices || []).some(c => T.raw.test(c.t))) bad.push(id + ' raw');
      }
      return { n: Object.keys(A.EV).filter(k => /^po_/.test(k)).length, drawn: words.length, max: Math.max(...words.map(w => w[1])), bad };
    });
    const ok = r.n >= 25 && !r.bad.length && r.max <= 80;
    return { ok, detail: `${r.n} po_ events, ${r.drawn} drawn with a test context, longest ${r.max} words${r.bad.length ? '; BAD ' + r.bad.slice(0, 5).join(', ') : ''}` };
  },
};
