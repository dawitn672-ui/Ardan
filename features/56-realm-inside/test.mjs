// Browser tests for the realm from inside (56-realm-inside): a court of named people with wants and fears, laws that
// move by what those people push, vassal deals and claimants with backers, AI gold that is spent instead of burned,
// and the player's money sinks with a breakdown. Each test gets (page, pageErrors, {browser, file}).
const SETUP = () => {
  window.RIT = {
    life(seed, o) { A.newGame(Object.assign({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30, diff: 'story' }, o || {})); return A.pc(); },
    // live the world for `years`, the player swapped for any adult when they die; each(y) after every new year
    world(years, each, tick) {
      const end = A.S.year + years; let lastY = A.S.year;
      for (let k = 0; k < 40000 && A.S.year < end; k++) {
        A.advance(30); tick && tick();
        let h, g = 0; while ((h = A.headReady()) && g++ < 300) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
        if (!A.pc().alive) { const kid = Object.values(A.S.people).find(p => p.alive && p.id !== A.S.pc && A.isAdult(p)); if (!kid) break; A.S.pc = kid.id; }
        if (A.S.year !== lastY) { lastY = A.S.year; each && each(A.S.year); }
      }
    },
    ai: () => Object.values(A.S.realms).filter(r => r.alive && !r.isRebel && !r.playerRun),
    choose(ev, idx, win) {
      const q = A.S.queue.find(x => x.ev === ev); if (!q) return null;
      A.S.queue = [q].concat(A.S.queue.filter(x => x !== q));
      const v = A.eventView(q), vi = v.choices.findIndex(c => c.i === idx);
      const ch = A.chance; if (win != null) A.chance = () => win;
      try { A.eventChoose(vi); } finally { A.chance = ch; }
      const t = q.result && q.result.text; A.eventClose(); return { text: t, view: v };
    },
    pure(fn) { fn(); const s0 = JSON.stringify(A.S), r0 = JSON.stringify(A.rngState); const h = fn(); return { same: JSON.stringify(A.S) === s0 && JSON.stringify(A.rngState) === r0, h }; },
  };
};
const pct = (a, b) => b ? Math.round(1000 * a / b) / 10 : 0;

export default {
  async farLedgerPaid(pg) {
    // world review cycle 2, F5 and F6: every crown starts at its reserve; on the Great Continent the far ledger is paid
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 4407, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20, lands: 'great' });
      A.S.queue.length = 0;
      // (the first wars of 1105 hire sellswords before the first month: a crown holds at least nine tenths of its reserve)
      const all = Object.values(A.S.realms).filter(x => x.alive && !x.playerRun && x.income > 0), low = all.filter(x => x.treasury < 0.9 * A.RI.reserveYears(x) * x.income).length;
      T.play(1, { each: () => { const q = A.pc(); if (q) q.health = 90; } });
      const TT = A.realm('POL-36'), B = TT.riBook || {};
      return { low, n: all.length, lore: (B.cats || {}).lore || 0, mul: TT.loreMul, inc: TT.income, armyPay: Math.round(TT.army * 3.2) };
    });
    const ok = r.low <= r.n * 0.1 && r.lore > 0 && r.mul >= 1 && r.mul < 6;
    return { ok, detail: JSON.stringify(r) };
  },

  // Diplomacy 2: every realm's council is five named people, each with a want and a fear
  async riCourtOfPeople(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      RIT.life(5601);
      const RI = A.RI, L = Object.values(A.S.realms).filter(x => x.alive && !x.isRebel);
      let seats = 0, filled = 0, cast = 0, heads = 0, titled = 0, aims = 0;
      const wants = {}, fears = {}, headIds = new Set(Object.values(A.S.houses).map(h => h.headPid).filter(Boolean));
      const RX = { chancellor: /chancellor|envoy|speaker|vizier|herald|seneschal/i, marshal: /marshal|general|warlord|constable|commander/i, treasurer: /treasurer|steward|banker|reeve|factor/i, spymaster: /spy|whisper/i, chaplain: /chaplain|bishop|abbot|priest|prior/i };
      for (const x of L) for (const seat of Object.keys(A.COUNCIL)) {
        seats++;
        const p = A.P((x.council || {})[seat]); if (!p || !p.alive) continue;
        filled++; if (p.castId) cast++; if (headIds.has(p.id)) heads++;
        if (RX[seat].test(String(p.title || ''))) titled++;
        const a = RI.aims(p); if (a && RI.WANT[a.want] && RI.FEAR[a.fear]) { aims++; wants[a.want] = (wants[a.want] || 0) + 1; fears[a.fear] = (fears[a.fear] || 0) + 1; }
      }
      const ald = A.realm('POL-01'), m = A.P(ald.council.marshal);
      return { realms: L.length, seats, filled, cast, heads, titled, aims, wants, fears, aldMarshal: m ? A.fullName(m, false) + ' (' + (m.title || '') + ')' : null };
    });
    const ok = r.filled === r.seats && r.aims === r.filled && Object.keys(r.wants).length >= 6 && Object.keys(r.fears).length >= 5 && r.cast >= r.seats * .3 && r.titled >= 15;
    return { ok, detail: `${r.realms} realms: ${r.filled}/${r.seats} seats held by named people (${r.cast} from the cast, ${r.heads} heads of houses, ${r.titled} whose own title is the seat's); every one has a want and a fear: wants ${JSON.stringify(r.wants)}, fears ${JSON.stringify(r.fears)}; Aldmark's Marshal: ${r.aldMarshal}` };
  },

  // Diplomacy 3: the loudest push follows the realm's need, and the crown's own temper moves the odds
  async riPushesFollowNeed(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      RIT.life(5602);
      const RI = A.RI, x = A.realm('POL-03'), ru = A.P(x.ruler);
      x.laws.tax = 1; x.debt = 0;
      const top = () => { const a = RI.agendaOf(RI.tally(x), true, x); return a ? a.k : null; };
      const pOf = k => Math.round(100 * RI.odds(x, RI.tally(x)[k]).p);
      // the treasurer wants a strong crown
      const tr = A.P(x.council.treasurer), keep = tr.traits.slice(); tr.traits = ['just', 'loyal', 'diligent'];
      x.treasury = x.income * .2; x.debt = x.income * 1.5;
      const broke = { top: top(), taxUp: pOf('taxUp') };
      x.treasury = x.income * 4; x.debt = 0;
      const rich = { top: top(), taxDown: pOf('taxDown'), taxUp: pOf('taxUp') };
      // the same broke realm under a greedy ruler and a generous one
      x.treasury = x.income * .2; x.debt = x.income * 1.5;
      const rt = ru.traits.slice();
      ru.traits = ['greedy', 'ambitious']; const greedy = pOf('taxUp');
      ru.traits = ['generous', 'kind']; const generous = pOf('taxUp');
      ru.traits = rt;
      // a session with the dice held: the law changes, and the record names who pushed it and why
      x.treasury = x.income * .2;
      const ch = A.chance; A.chance = () => true; const t0 = x.laws.tax;
      // with 9996-polity a law opens a bill at the court instead of changing at once: close it, so the change lands
      let e; try { e = RI.session(x); if (x.pol && x.pol.bill && A.POL && A.POL.endBill) A.POL.endBill(x, true); } finally { A.chance = ch; tr.traits = keep; }
      return { broke, rich, greedy, generous, t0, t1: x.laws.tax, e: e ? { k: e.k, who: A.P(e.who) ? A.fullName(A.P(e.who), false) : null, why: e.why.map(w => w[0]) } : null };
    });
    const ok = r.broke.top === 'taxUp' && r.rich.top !== 'taxUp' && r.rich.taxUp < r.broke.taxUp && r.greedy > r.generous && r.e && r.e.who && r.e.why.length >= 2 && r.t1 !== r.t0;
    return { ok, detail: `broke (2 months, debt 1.5 years): loudest push ${r.broke.top}, ${r.broke.taxUp}% to pass; rich (4 years): loudest ${r.rich.top} (${r.rich.taxDown}% to lighten, taxUp only ${r.rich.taxUp}%); broke under a greedy ruler ${r.greedy}% vs a generous one ${r.generous}%; a held session: ${r.e && r.e.k} by ${r.e && r.e.who}, tax ${r.t0} → ${r.t1}, because: ${r.e && r.e.why.join('; ')}` };
  },

  // Diplomacy 2 + 3 in a living world: laws move by named pushers, factions are led by named people, councillors back them
  async riCourtInTheWorld(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const RI = A.RI, out = { laws: 0, lawsNamed: 0, laws2: 0, refused: 0, deals: 0, seats: 0, claims: 0, claimsNamed: 0, facs: 0, facsHead: 0, facsBacked: 0, facYears: 0, pri: 0, ry: 0, kinds: {} };
      const tax = {}, auth = {};
      for (const seed of [5603, 5604, 5605]) {
        RIT.life(seed, { status: 'peasant', startAge: 16 });
        RIT.world(30, y => {
          for (const x of RIT.ai()) {
            out.ry++;
            for (const e of (x.riCourt || []).filter(e => e.y === y)) {
              out.kinds[e.k] = (out.kinds[e.k] || 0) + 1;
              if (RI.PUSH[e.k] && RI.PUSH[e.k].law && e.p !== 100 && !e.ruler) { out.laws++; if (!e.yes) out.refused++; if (e.who && A.P(e.who) && e.why && e.why.length >= 1) out.lawsNamed++; if (e.why && e.why.length >= 2) out.laws2++; }
              if (['pension', 'seatdeal', 'refuse'].includes(e.k)) out.deals++;
              if (e.k === 'seat') out.seats++;
              if (e.k === 'claim') { out.claims++; if (e.who && e.back && e.back.length) out.claimsNamed++; }
            }
            if (x.riPri && x.riPri.y === y) out.pri++;
            for (const f of A.factionsOf(x.id)) {
              out.facYears++;
              const lead = A.S.houses[f.leader], head = lead && lead.headPid ? A.P(lead.headPid) : null;
              if (head && head.alive && RI.aims(head)) out.facsHead++;
              if (RI.backers(f).length) out.facsBacked++;
            }
          }
        });
        for (const x of RIT.ai()) { const t = x.laws.tax || 1; tax[t] = (tax[t] || 0) + 1; const a = x.laws.authority; auth[a] = (auth[a] || 0) + 1; }
      }
      return Object.assign(out, { tax, auth });
    });
    const realms = Object.values(r.tax).reduce((a, b) => a + b, 0), extremes = (r.tax['0.6'] || 0) + (r.tax['1.5'] || 0);
    const ok = r.laws >= 100 && r.lawsNamed === r.laws && r.refused > 0 && r.refused < r.laws && r.facsHead >= r.facYears * .9 && r.facsBacked > 0 && r.pri >= r.ry * .3 && extremes <= realms * .6 && Object.keys(r.tax).length >= 3;
    return { ok, detail: `3 worlds × 30 years, ${r.ry} AI realm-years: ${r.laws} law pushes decided (${r.laws - r.refused} passed, ${r.refused} refused), ${pct(r.lawsNamed, r.laws)}% name the person who pushed it and why (${pct(r.laws2, r.laws)}% with 2+ reasons); ${r.deals} vassal deals, ${r.seats} seats changing hands, ${r.claims} claimants (${r.claimsNamed} with named backers); faction-years ${r.facYears}: led by a named head with aims ${pct(r.facsHead, r.facYears)}%, backed by a councillor ${pct(r.facsBacked, r.facYears)}%; a spending push steers the treasury in ${pct(r.pri, r.ry)}% of realm-years; taxes at the end ${JSON.stringify(r.tax)}, authority ${JSON.stringify(r.auth)}; kinds ${JSON.stringify(r.kinds)}` };
  },

  // Diplomacy 3: a claimant's army is what the houses behind them bring; after the war, backers are honoured or hunted
  async riClaimantBackers(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      RIT.life(5606, { status: 'peasant' });
      const RI = A.RI, x = A.realm('POL-01'), hs = A.realmHouses(x.id);
      const cand = hs.filter(h => ['N01', 'N02', 'N03'].includes(h.rung)).map(h => A.houseHead(h.id)).find(p => p && p.alive && !p.ruler);
      for (const h of hs) h.op = 70;
      A.S.factions = (A.S.factions || []).filter(f => f.realm !== x.id);
      const loyal = Math.round(100 * RI.claimShare(x, cand));
      const sorted = hs.slice().sort((a, b) => A.houseStrength(b) - A.houseStrength(a));
      sorted.slice(0, Math.ceil(sorted.length / 2)).forEach(h => h.op = 15);
      const back = RI.backersOf(x, cand), split = Math.round(100 * RI.claimShare(x, cand));
      x.riClaim = { pid: cand.id, y: A.S.year, rel: 'head of a great house', want: RI.aims(cand).want, back };
      const army0 = x.army, w = A.successionWar(x, cand), rebel = A.realm(w.leadA);
      const got = Math.round(100 * rebel.army / army0);
      const news = (A.S.news || []).slice(0, 6).map(n => n.t || n[1] || n.text || String(n)).find(t => /declare/.test(t)) || '';
      const ops0 = w.riBack.map(id => A.S.houses[id].op);
      const ch = A.chance; A.chance = () => true;
      try { A.settleWar(w, 'def'); } finally { A.chance = ch; }
      const ops1 = w.riBack.map(id => A.S.houses[id].op), e = (x.riCourt || []).find(e => e.k === 'claimlost');
      return { loyal, split, backers: back.length, got, news, drop: ops0.map((o, i) => o - ops1[i]), hunted: e ? e.hunted.length : -1, claim: (x.riCourt || []).some(e => e.k === 'claim') };
    });
    const ok = r.loyal <= 35 && r.split >= r.loyal + 20 && Math.abs(r.got - r.split) <= 2 && r.drop.every(d => d >= 15) && r.hunted >= 1 && r.claim && /declare/.test(r.news);
    return { ok, detail: `a claimant's share of the army: ${r.loyal}% when every house is loyal, ${r.split}% when the stronger half hate the crown (${r.backers} backers); the war gave them ${r.got}%; "${r.news}"; after the claim failed the backers' loyalty fell by ${r.drop.join(', ')} and ${r.hunted} heads were taken` };
  },

  // Diplomacy 5: AI gold is spent, not burned; the hoarding flag reads 0; armies, stability and wars stay sane
  async riGoldGetsUsed(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const RI = A.RI, tot = { inc: 0, up: 0, int: 0, debt: 0, cats: {} }, o = { ry: 0, hoard: 0, burned: 0, wars: 0, army: [], stab: [], tre: [] };
      const fa = A.forcesAI;
      for (const seed of [606, 1212, 2424]) {
        RIT.life(seed, { status: 'peasant', startAge: 16 });
        // anything the crown loses inside A.forcesAI that the book does not explain (recruits, debts, the ladder) was burned
        A.forcesAI = function (x) {
          const t0 = x.treasury, d0 = x.debt || 0, B = x.riBookNext, c0 = B ? Object.values(B.cats).reduce((a, b) => a + b, 0) : 0;
          const res = fa.apply(this, arguments);
          const B1 = x.riBookNext, c1 = B1 ? Object.values(B1.cats).reduce((a, b) => a + b, 0) : 0;
          const lost = (t0 - x.treasury) - (c1 - c0) - Math.max(0, d0 - (x.debt || 0));
          if (lost > 1) o.burned += lost;
          return res;
        };
        const ids = new Set(A.S.wars.map(w => w.id));
        try {
          RIT.world(30, y => {
            for (const x of RIT.ai()) {
              const B = x.riBook; if (!B || B.y !== y) continue;
              o.ry++; tot.inc += B.inc; tot.up += B.up; tot.int += B.int; tot.debt += Math.max(0, B.d0 - B.d1);
              for (const k in B.cats) tot.cats[k] = (tot.cats[k] || 0) + B.cats[k];
              const q = x.treasury / Math.max(1, x.income); o.tre.push(q); if (q > 6) o.hoard++;
              const L = LORE.realms[x.id], base = (L ? L.army : x.army0 || x.army) * (x.provPop || 1) / (x.basePop || 1);
              o.army.push(x.army / Math.max(1, base)); o.stab.push(x.stability);
            }
          }, () => { for (const w of A.S.wars) if (!ids.has(w.id)) { ids.add(w.id); o.wars++; } });
        } finally { A.forcesAI = fa; }
      }
      const q = (a, f) => { const s = a.slice().sort((x, y) => x - y); return Math.round(100 * s[Math.floor(f * (s.length - 1))]) / 100; };
      const share = {}; for (const k in tot.cats) share[k] = Math.round(1000 * tot.cats[k] / tot.inc) / 10;
      return { ry: o.ry, hoard: o.hoard, burnedPct: Math.round(1000 * o.burned / tot.inc) / 10, upkeep: Math.round(1000 * tot.up / tot.inc) / 10, share, warsPerRY: Math.round(1000 * o.wars / o.ry) / 1000,
        army: [q(o.army, .1), q(o.army, .5), q(o.army, .9)], stab: [q(o.stab, .1), q(o.stab, .5), q(o.stab, .9)], tre: [q(o.tre, .5), q(o.tre, .9), q(o.tre, 1)] };
    });
    const big = Object.entries(r.share).filter(([, v]) => v >= 1).length + (r.upkeep >= 5 ? 1 : 0);
    // sanity bands: the fix layer over the same 3 worlds x 30 years read armies 0.72-1.33 of normal (p10-p90), stability 32-74, 0.018 wars a realm-year
    const ok = r.hoard === 0 && r.burnedPct <= .5 && big >= 5 && r.army[0] >= .5 && r.army[2] <= 1.6 && r.stab[1] >= 40 && r.stab[1] <= 70 && r.stab[2] <= 92 && r.warsPerRY >= .012 && r.warsPerRY <= .03;
    return { ok, detail: `3 worlds × 30 years, ${r.ry} AI realm-years: hoarding flags (over 6 years of income) ${r.hoard}; burned ${r.burnedPct}% of income (the fix layer burned about 65%); spent as a share of income: host upkeep ${r.upkeep}%, ${Object.entries(r.share).map(([k, v]) => k + ' ' + v + '%').join(', ')}; treasury in years of income median ${r.tre[0]}, p90 ${r.tre[1]}, max ${r.tre[2]}; army ÷ normal p10/50/90 ${r.army.join('/')}; stability ${r.stab.join('/')}; ${r.warsPerRY} wars a realm-year` };
  },

  // Economy 6: the player's sinks, each a line in the year's money; taxes reach the realm's treasury
  async riPlayerMoney(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const RI = A.RI, run = (realm) => {
        const pc = RIT.life(5607, { realm, status: 'noble' });
        pc.noble = pc.noble || { rung: 5, realm, holding: A.realmProvs(realm)[0].id }; pc.noble.rung = 5; pc.noble.realm = realm;
        pc.lifestyle = 'comfortable'; pc.gear.mount = 'destrier'; pc.coin = 5000; pc.debt = 0; pc.mil = null; pc.job = null;
        pc.assets = [{ k: 'farm', name: 'Freehold farm (30 acres)', y: A.S.year, where: A.provName(pc.home) }, { k: 'manor', name: 'Manor with tenants', y: A.S.year, where: A.provName(pc.home) }];
        const st = Object.values(A.S.people).find(p => p.alive && p.id !== pc.id && A.isAdult(p)); pc.staff = { steward: st.id };
        const x = A.realm(realm); x.laws.tax = 1.2; const t0 = x.treasury;
        A.S.year++; A.moneyYear(pc);
        const L = pc.riPurse.cur.lines, paid = ['tax', 'landtax'].reduce((a, k) => a + (L[k] ? -L[k][1] : 0), 0);
        return { lines: Object.fromEntries(Object.entries(L).map(([k, v]) => [k, v[1]])), toCrown: Math.round(x.treasury - t0), paid, bible: !!RI.bibleTaxes(pc) };
      };
      const noCustom = run('POL-14'), custom = run('POL-01');
      return { noCustom, custom, bibleBuilt: !!A.BIBLE };
    });
    const a = r.noCustom.lines, b = r.custom.lines;
    const ok = a.horse === -60 && a.retain === -1080 && a.staff < 0 && a.tax < 0 && a.landtax < 0 && a.hold > 0 && a.life < 0 && r.noCustom.toCrown === r.noCustom.paid && b.landtax < 0 && (r.bibleBuilt ? r.custom.bible && !b.tax : b.tax < 0);
    return { ok, detail: `a viscount in Greyhaven (heavy taxes, no tax custom): ${Object.entries(a).map(([k, v]) => k + ' ' + v).join(', ')}; the crown received ${r.noCustom.toCrown} (= the ${r.noCustom.paid} paid). ${r.bibleBuilt ? `In Aldmark the hearth mark (47-realm-bible) already taxes free folk: no hearth tax line (${b.tax || 0}), the tenth on rents ${b.landtax}` : `Built without 47-realm-bible: Aldmark charges the hearth tax too (${b.tax}), and the tenth on rents ${b.landtax}`}` };
  },

  // Economy 6: taken in battle and ransomed; a holding burned in a raid, idle until rebuilt
  async riRansomAndRaid(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const RI = A.RI, pc = RIT.life(5608, { status: 'gentry' });
      pc.coin = 3000; pc.mil = { rank: 4, realm: pc.realm, merit: 0, battles: 0, years: 2, kills: 0, squad: [], warsCommanded: {} };
      const enemy = A.neighbors(pc.realm).find(id => A.realm(id) && A.realm(id).alive);
      const n = RI.ransomOf(pc), et0 = A.realm(enemy).treasury;
      A.S.queue = [];
      const ch = A.chance; A.chance = () => true;
      let taken; try { taken = RI.maybeTaken(pc, enemy, 'line'); } finally { A.chance = ch; }
      const c0 = pc.coin; RIT.choose('ri_taken', 0);
      const ransom = { n, odds: Math.round(100 * RI.takenOdds(pc, 'line')), paid: c0 - pc.coin, toEnemy: Math.round(A.realm(enemy).treasury - et0), line: pc.riPurse.cur.lines.ransom };
      // a raid: the farm's province held by the enemy at war
      pc.assets = [{ k: 'farm', name: 'Freehold farm (30 acres)', y: A.S.year, where: A.provName(pc.home) }];
      const P = A.prov(pc.home); A.startWar(enemy, P.owner, null, 'conquest'); P.occ = enemy;
      A.S.queue = []; pc.flags.ri_raid = null;
      A.chance = () => true; try { RI.raidMonth(pc); } finally { A.chance = ch; }
      const burnt = !!pc.assets[0].burnt, q = A.S.queue.some(x => x.ev === 'ri_burned');
      A.S.year++; A.moneyYear(pc);
      const idleHold = (pc.riPurse.cur.lines.hold || [0, 0])[1];
      const c1 = pc.coin; RIT.choose('ri_burned', 0);
      const rebuilt = !pc.assets[0].burnt, cost = c1 - pc.coin;
      A.S.year++; A.moneyYear(pc);
      const hold2 = (pc.riPurse.cur.lines.hold || [0, 0])[1];
      const view = RIT.pure(() => UI.TAB.holdings(pc));
      return { taken, ransom, burnt, q, idleHold, rebuilt, cost, hold2, pure: view.same, card: /Where the money goes/.test(view.h) && /Rebuilding after the raids/.test(view.h) };
    });
    const ok = r.taken && r.ransom.paid === r.ransom.n && r.ransom.toEnemy === r.ransom.n && r.ransom.line && r.burnt && r.q && r.idleHold === 0 && r.rebuilt && r.cost === 120 && r.hold2 > 0 && r.pure && r.card;
    return { ok, detail: `a gentry captain (odds of being taken after a lost battle ${r.ransom.odds}%): ransom ${r.ransom.n}, paid ${r.ransom.paid}, to the captor's treasury ${r.ransom.toEnemy}; the farm burned by an occupying enemy: ${r.burnt}, its income that year ${r.idleHold}; rebuilt for ${r.cost} (40% of its price), then it paid ${r.hold2}; the Holdings tab lists it and draws purely: ${r.pure}` };
  },

  // the player at court sees who pushes what and why, may speak, and the voice counts; the card is pure and escaped
  async riCourtCardAndVoice(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const RI = A.RI, pc = RIT.life(5609, { status: 'noble' });
      pc.noble = pc.noble || { rung: 5, realm: pc.realm, holding: A.realmProvs(pc.realm)[0].id }; pc.noble.rung = Math.max(5, pc.noble.rung);
      const x = A.realm(pc.realm);
      RI.session(x);
      const ag = x.riAgenda, p = ag && A.P(ag.who);
      if (p) { p.given = '<b>Evil</b>'; }
      const v = RIT.pure(() => UI.courtTab(pc));
      const names = Object.values(x.council).map(A.P).filter(Boolean).filter(c => v.h.includes(UI.esc(A.fullName(c, false)))).length;
      const T0 = ag ? RI.tally(x, null)[ag.k] : null;
      A.S.time = 5; UI.A.riVoice('for');
      const T1 = ag ? RI.tally(x, { k: ag.k, side: ag.pc.side, w: ag.pc.w })[ag.k] : null;
      return { agenda: ag ? RI.PUSH[ag.k].t : null, pure: v.same, card: /The court of/.test(v.h) && /Wants/.test(v.h) && /Before the court/.test(v.h), names, raw: /<b>Evil<\/b>/.test(v.h), sup0: T0 && T0.sup, sup1: T1 && T1.sup, w: ag && ag.pc && ag.pc.w, time: A.S.time };
    });
    const ok = r.agenda && r.pure && r.card && r.names >= 4 && !r.raw && r.sup1 > r.sup0 && r.time === 4;
    return { ok, detail: `before the court: ${r.agenda}; the card names ${r.names} of 5 councillors with wants and fears, draws purely (${r.pure}) and escapes names; speaking for it (1 initiative) adds weight ${r.w}: support ${r.sup0} → ${r.sup1}` };
  },

  // every scene renders from the moment that queues it: no raw token, text within 80 words, labels within 12, every
  // choice (both ways for a check) resolves
  async riScenesRender(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const RI = A.RI, words = s => (String(s || '').match(/\S+/g) || []).length, held = (fn) => { const ch = A.chance; A.chance = () => true; try { return fn(); } finally { A.chance = ch; } };
      const SC = {
        ri_taken: () => { const pc = RIT.life(5611, { status: 'gentry' }); pc.mil = { rank: 4, realm: pc.realm, merit: 0, battles: 0, years: 2, kills: 0, squad: [], warsCommanded: {} }; A.S.queue = [];
          held(() => RI.maybeTaken(pc, A.neighbors(pc.realm)[0], 'line')); },
        ri_burned: () => { const pc = RIT.life(5612, { status: 'merchant' }); pc.coin = 2000; pc.assets = [{ k: 'inn', name: 'Roadside inn', y: A.S.year, where: A.provName(pc.home) }];
          const P = A.prov(pc.home), en = A.neighbors(P.owner)[0]; A.startWar(en, P.owner, null, 'conquest'); P.occ = en; A.S.queue = []; held(() => RI.raidMonth(pc)); },
        ri_court_push: () => { const pc = RIT.life(5613, { status: 'royal', realm: 'POL-02' }), x = A.realm('POL-02'); A.makeRuler(pc, x.id); x.playerRun = true;
          x.treasury = x.income * .1; x.debt = x.income * 2; A.S.queue = []; held(() => RI.session(x)); },
        ri_court_ask: () => { const pc = RIT.life(5614, { status: 'noble' }); pc.noble = pc.noble || { rung: 5, realm: pc.realm, holding: A.realmProvs(pc.realm)[0].id }; pc.noble.rung = 5;
          const x = A.realm(pc.realm); RI.session(x); if (A.NPCI) A.NPCI.state(pc).b = 2; A.S.queue = []; held(() => RI.askMonth(pc)); },
      };
      const out = [];
      for (const ev in SC) {
        const n = (A.EV[ev].choices || []).length;
        for (let i = 0; i < n; i++) for (const win of A.EV[ev].choices[i].check ? [true, false] : [null]) {
          SC[ev]();
          const q = A.S.queue.find(x => x.ev === ev);
          if (!q) { out.push({ ev, i, err: 'not queued' }); continue; }
          const v = A.eventView(q), c = v.choices.find(x => x.i === i);
          if (!c) continue;      // a choice its own req hides here
          const res = RIT.choose(ev, i, win);
          out.push({ ev, i, win, text: words(v.text), label: words(c.t), raw: T.raw.test(v.text) || T.raw.test(c.t) || T.raw.test(res && res.text || ''), skip: !!q.ctx.skip, res: !!(res && res.text) });
        }
      }
      return out;
    });
    const bad = r.filter(x => x.err || x.raw || x.skip || x.text > 80 || x.label > 12 || !x.res);
    const evs = [...new Set(r.map(x => x.ev))];
    return { ok: !bad.length && evs.length === 4, detail: `${r.length} choice outcomes across ${evs.join(', ')}; longest text ${Math.max(...r.map(x => x.text || 0))} words, longest label ${Math.max(...r.map(x => x.label || 0))}; problems: ${bad.length ? JSON.stringify(bad.slice(0, 4)) : 'none'}` };
  },

  // a ruling player hears the same pushes as a petition, and their answer is the law
  async riRulerHearsCouncil(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const RI = A.RI, pc = RIT.life(5610, { status: 'royal', realm: 'POL-02' }), x = A.realm('POL-02');
      A.makeRuler(pc, x.id); x.playerRun = true;
      for (const id in A.S.realms) { const o = A.S.realms[id]; if (o.alive) { RI.ensureHeads(o); } }
      // the council a ruler inherits keeps its people; give it reason to push: an empty treasury and a debt
      x.council = x.council || {};
      RI.fillCouncil(x); pc.ruler = null; RI.fillCouncil(x); pc.ruler = x.id;
      x.treasury = x.income * .1; x.debt = x.income * 2; x.laws.tax = 1;
      A.S.queue = [];
      const ch = A.chance; A.chance = () => true;
      try { RI.session(x); } finally { A.chance = ch; }
      const q = A.S.queue.find(e => e.ev === 'ri_court_push'), k = q && q.ctx.riK, t0 = x.laws.tax, a0 = x.laws.authority;
      const res = RIT.choose('ri_court_push', 0);
      return { k, t0, t1: x.laws.tax, a0, a1: x.laws.authority, text: res && res.view.text, log: (x.riCourt || [])[0] };
    });
    const moved = r.k === 'taxUp' ? r.t1 > r.t0 : r.k === 'taxDown' ? r.t1 < r.t0 : r.k === 'authUp' ? r.a1 > r.a0 : r.k === 'authDown' ? r.a1 < r.a0 : true;
    const ok = !!r.k && moved && r.log && r.log.ruler && /has the floor/.test(r.text || '');
    return { ok, detail: `the council presses for ${r.k}; granted: tax ${r.t0} → ${r.t1}, authority ${r.a0} → ${r.a1}; "${(r.text || '').slice(0, 140)}…"` };
  },
  // cycle 1 (lives I2): "The council presses" 21 to 24 times a reign. It is council business now: twice a life, ten
  // years apart (97-life-fixes' policy for NPC moves), and a held year waits
  async riCourtPushRare(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 5691, race: 'human', realm: 'POL-02', status: 'royal', sex: 'M', startAge: 30 });
      const pc = A.pc(); A.makeRuler(pc, pc.realm, true);
      const r0 = A.realm(pc.ruler); let n = 0;
      for (let y = 0; y < 30; y++) {
        A.S.year++;
        A.S.queue = A.S.queue.filter(q => q.ev !== 'ri_court_push' || (n++, false));
        try { A.RI.session(r0); } catch (e) {}
        const q = A.S.queue.find(q => q.ev === 'ri_court_push');
        if (q) { pc.evN = pc.evN || {}; pc.evN.ri_court_push = (pc.evN.ri_court_push || 0) + 1; pc.flags.ev = pc.flags.ev || {}; pc.flags.ev.ri_court_push = A.S.year; }
      }
      n += A.S.queue.filter(q => q.ev === 'ri_court_push').length;
      return { n };
    });
    return { ok: r.n >= 1 && r.n <= 2, detail: `30 years of a reign's council sessions: the court pressed ${r.n} times (about 18 before: 60% of sessions)` };
  },
};
