// 97-life-fixes, part 5: great works for great fortunes.
//
// Late lives pile up 100,000 to 600,000 suns (balance league: peak coin 505,525 for a peasant, 614,099 for a serf),
// and the dearest thing on the Decisions tab cost 3,500. Nine decisions (A.DEC, cat as the tab groups them) give a
// fortune somewhere to go. Each costs what a great fortune can bear, each leaves something that lasts (pc.lfWorks,
// read once a year), each is written into the life's deeds, and five open a scene years later (works.events.js):
//   Endow a chantry           12,000   priests sing for you: piety each year
//   Found an almshouse        20,000   beds and bread for the old poor: renown and honour each year; a hard winter
//   Ransom captives           10,000   the captives of a war bought back: honour, piety, the crown's favour (every 12 years)
//   Fit out a ship            30,000   she trades on her own: about 6% a year, and the sea may take her; a storm
//   Raise a company of men    25,000   your banner on 40 men: renown each year, 2,500 a year to keep; a war wants them
//   Raise a great hall        40,000   needs a family seat: contentment and renown each year
//   Buy a town charter        50,000   your home town chartered: a share of its tolls; the council comes to you
//   Endow a college           60,000   your name on a college: learning each year, for you and your children
//   Buy a patent of nobility  20,000 / 60,000 / 200,000   franklin, then knight, then baron; old blood at the table
// The decisions show once a fortune is a fair way toward them (a quarter of the price), so a poor life's tab is not
// filled with what it cannot afford. Bots never take decisions, so the balance bands are untouched by the sinks.
(function () {
  const LF = A.LF = A.LF || {};
  const coin = n => (A.coin ? A.coin(Math.round(n)) : Math.round(n) + ' suns');
  const R = (label, ok) => [label, !!ok];
  const works = pc => (Array.isArray(pc.lfWorks) ? pc.lfWorks : (pc.lfWorks = []));
  const has = (pc, k) => Array.isArray(pc.lfWorks) && pc.lfWorks.some(w => w && w.k === k && !w.gone);
  const lastOf = (pc, k) => { let y = null; for (const w of Array.isArray(pc.lfWorks) ? pc.lfWorks : []) if (w && w.k === k && (y == null || w.y > y)) y = w.y; return y; };
  const place = pc => (A.provName ? A.provName(pc.home) : 'your town');
  const free = pc => !(pc.flags && pc.flags.unfree);
  const deed = (pc, t) => { (pc.deeds = pc.deeds || []).push({ y: A.S.year, t }); };
  const later = (pc, ev, yrs) => { if (A.EV[ev] && A.schedule) A.schedule({ type: 'event', ev, forced: true, ctx: { lfWork: 1 } }, Math.round(365 * yrs + A.ri(0, 200))); };
  const RUNGS = () => GD.NOBLE_RUNGS || [];
  // the next patent a fortune can buy: [rung, price], or null
  LF.patentNext = function (pc) {
    if (pc.ruler || !free(pc)) return null;
    const r = pc.noble ? pc.noble.rung : -1;
    if (r < 0) return [0, 20000];
    if (r < 2) return [2, 60000];
    if (r < 4) return [4, 200000];
    return null;
  };
  LF.WORKS = {
    chantry: { cat: 'Faith', name: 'Endow a chantry', cost: () => 12000, once: true,
      desc: pc => `Two priests at the temple of ${place(pc)}, paid forever to sing for your soul and your family's.`,
      run: pc => { pc.piety = Math.min(100, (pc.piety || 0) + 15); if (A.fame) A.fame(pc, 3); pc.honor = Math.min(100, (pc.honor || 0) + 3);
        return { deed: `Endowed a chantry at ${place(pc)}`, msg: `The chantry is endowed. From Sunday, two priests sing your name at ${place(pc)}, and will when nobody remembers why.` }; },
      year: pc => { pc.piety = Math.min(100, (pc.piety || 0) + 2); pc.happy = Math.min(100, (pc.happy || 0) + 1); } },
    almshouse: { cat: 'Faith', name: 'Found an almshouse', cost: () => 20000, once: true,
      desc: pc => `Twelve beds, a fire and bread for the old poor of ${place(pc)}, with your arms over the door.`,
      run: pc => { if (A.fame) A.fame(pc, 5); pc.honor = Math.min(100, (pc.honor || 0) + 6); later(pc, 'lfx_wk_alms_winter', A.ri(2, 6));
        return { deed: `Founded an almshouse at ${place(pc)}`, msg: 'The almshouse opens. By the first frost every bed is full.' }; },
      year: pc => { if (A.fame && (pc.fame || 0) < 70) A.fame(pc, 1); pc.honor = Math.min(100, (pc.honor || 0) + 1); } },
    ransom: { cat: 'Faith', name: 'Ransom captives', cost: () => 10000, gap: 12,
      desc: () => 'Buy back from the raiders and the slave-markets the captives taken from your people in the last wars.',
      run: pc => { pc.honor = Math.min(100, (pc.honor || 0) + 8); pc.piety = Math.min(100, (pc.piety || 0) + 5); if (A.fame) A.fame(pc, 4);
        const ru = A.realm(pc.realm) && A.P(A.realm(pc.realm).ruler); if (ru && ru.alive && A.addOp) A.addOp(ru, pc, 10);
        const n = A.ri(60, 140);
        return { deed: `Ransomed ${n} captives`, msg: `${n} captives come home, thin and blinking, by the coast road. Some of them ask your name.` }; } },
    ship: { cat: 'Holdings', name: 'Fit out a ship of your own', cost: () => 30000, once: false,
      show: pc => !has(pc, 'ship'),
      desc: () => 'A round ship, a captain you trust and a crew of twenty. She trades on her own account and yours.',
      run: pc => { const name = A.pick(['Good Hope', 'Mother\'s Grace', 'Grey Gull', 'Fair Return', 'Saint Ermin', 'Patience']); later(pc, 'lfx_wk_ship_storm', A.ri(2, 5));
        return { deed: `Fitted out the ship ${name}`, msg: `The ${name} goes down the river on the ebb with your goods in her. Somewhere a clerk opens a book in her name.`, extra: { name } }; },
      year: (pc, w) => {
        if (A.chance(0.04)) { w.gone = A.S.year; A.log(`The ${w.name || 'ship'} does not come home this year. In the spring a spar with her name washes up on a foreign beach.`, 'bad'); return; }
        const g = Math.round(30000 * A.rf(0.02, 0.1)); pc.coin += g; A.log(`The ${w.name || 'ship'} comes home: your share of the year is ${coin(g)}.`, 'good');
      } },
    company: { cat: 'Arms', name: 'Raise a company of men', cost: () => 25000, show: pc => !has(pc, 'company'),
      desc: () => 'Forty men under your banner: spears, crossbows, a sergeant who has seen a war. They cost 2,500 a year to keep.',
      run: pc => { if (A.fame) A.fame(pc, 5); later(pc, 'lfx_wk_company_war', A.ri(1, 4));
        return { deed: 'Raised a company under their own banner', msg: 'Forty men swear to your banner in the yard. The sergeant spits, and approves.' }; },
      year: (pc, w) => {
        if (pc.coin < 2500) { w.gone = A.S.year; A.log('You cannot pay the company this year. The men take their spears and go to someone who can.', 'bad'); return; }
        pc.coin -= 2500; if (A.fame && (pc.fame || 0) < 80) A.fame(pc, 1);
      } },
    hall: { cat: 'Holdings', name: 'Raise a great hall', cost: () => 40000, once: true,
      need: pc => R('A family seat (Build a family seat) or a noble holding', (pc.assets || []).some(a => a && a.k === 'manor') || !!pc.noble),
      desc: pc => `A hall at ${place(pc)} with a hammer-beam roof, a dais and a hearth a man can stand in.`,
      run: pc => { if (A.fame) A.fame(pc, 6); pc.happy = Math.min(100, (pc.happy || 0) + 10);
        return { deed: `Raised a great hall at ${place(pc)}`, msg: 'The roof-tree goes up with a garland on it and the whole valley drinks under it.' }; },
      year: pc => { pc.happy = Math.min(100, (pc.happy || 0) + 2); if (A.fame && (pc.fame || 0) < 60) A.fame(pc, 1); } },
    charter: { cat: 'Holdings', name: 'Buy a town charter', cost: () => 50000, once: true,
      need: pc => R('Renown 30', (pc.fame || 0) >= 30),
      desc: pc => `Buy ${place(pc)} its charter from the crown: a market, a court and a council of its own, with your name first on the roll.`,
      run: pc => { if (A.fame) A.fame(pc, 8); later(pc, 'lfx_wk_charter_council', A.ri(2, 5));
        return { deed: `Bought ${place(pc)} its charter`, msg: `The charter comes back under the great seal. ${place(pc)} rings every bell it has.` }; },
      year: pc => { pc.coin += 600; } },
    college: { cat: 'Learning', name: 'Endow a college', cost: () => 60000, once: true,
      desc: () => 'A master, six scholars and a library, under your name for as long as there are scholars.',
      run: pc => { if (A.fame) A.fame(pc, 8); if (A.trainSkill) A.trainSkill(pc, 'learning', 3);
        return { deed: 'Endowed a college that bears their name', msg: 'Six scholars in new gowns read your name aloud at their first dinner, badly.' }; },
      year: pc => { if (A.trainSkill) A.trainSkill(pc, 'learning', 1.5);
        for (const c of (pc.children || []).map(A.P)) if (c && c.alive && A.age(c) >= 6 && A.age(c) <= 25 && A.trainSkill) A.trainSkill(c, 'learning', 2); } },
    patent: { cat: 'Family', name: 'Buy a patent of nobility', cost: pc => { const n = LF.patentNext(pc); return n ? n[1] : 0; },
      show: pc => !!LF.patentNext(pc),
      need: pc => { const n = LF.patentNext(pc); return n && n[0] >= 4 ? R('Renown 40', (pc.fame || 0) >= 40) : R('Free', free(pc)); },
      desc: pc => { const n = LF.patentNext(pc), t = n && RUNGS()[n[0]]; return t ? `The heralds will write you down as ${t.title.toLowerCase()} for the right sum: a rung, its income, and old blood that will never forgive you.` : ''; },
      run: pc => { const n = LF.patentNext(pc); if (!n) return null;
        pc.noble = { rung: n[0], realm: pc.realm, holding: pc.noble && pc.noble.holding != null ? pc.noble.holding : pc.home };
        if ((GD.STATUS[pc.status] || {}).rank < 5) pc.status = 'gentry';
        if (A.fame) A.fame(pc, 4); later(pc, 'lfx_wk_patent_snub', A.ri(1, 3));
        const t = RUNGS()[n[0]];
        return { deed: `Bought a patent as ${t ? t.title.toLowerCase() : 'a noble'}`, msg: `The patent comes sealed in red. You are ${t ? t.title.toLowerCase() : 'noble'} now, by the crown's leave and your own money.` }; } },
  };
  LF.workCost = (pc, k) => { const W = LF.WORKS[k]; try { return W ? W.cost(pc) : 0; } catch (e) { return 0; } };
  for (const k of Object.keys(LF.WORKS)) {
    const W = LF.WORKS[k];
    A.DEC['lfx_' + k] = {
      k: 'lfx_' + k, cat: W.cat, name: W.name,
      get desc() { const pc = A.pc(); try { return pc ? W.desc(pc) + ` (${coin(LF.workCost(pc, k))})` : ''; } catch (e) { return ''; } },
      show: pc => {
        if (LF.OFF || !A.isAdult(pc)) return false;
        if (W.show && !W.show(pc)) return false;
        if (W.once && has(pc, k)) return false;
        const c = LF.workCost(pc, k);
        return c > 0 && (pc.coin || 0) >= c / 4;
      },
      reqs: pc => {
        const c = LF.workCost(pc, k), out = [R(coin(c), (pc.coin || 0) >= c)];
        if (W.need) out.push(W.need(pc));
        if (W.gap) { const y = lastOf(pc, k); out.push(R(`Once every ${W.gap} years`, y == null || A.S.year - y >= W.gap)); }
        return out;
      },
      run(pc) {
        const c = LF.workCost(pc, k);
        if (!c || (pc.coin || 0) < c) return null;
        pc.coin -= c;
        const res = W.run(pc) || {};
        works(pc).push(Object.assign({ k, y: A.S.year }, res.extra || {}));
        if (res.deed) deed(pc, res.deed);
        pc.flags['lfx_' + k] = A.S.year;
        return res.msg || 'It is done.';
      },
    };
  }
  // what lasts: once a year, each work does its part (engine side: the month hook, on the first month of a year)
  LF.worksYear = function (pc) {
    if (LF.OFF || !pc || !pc.alive || pc.id !== A.S.pc || !Array.isArray(pc.lfWorks) || !pc.lfWorks.length) return;
    const st = LF.st();
    if (st.wy === A.S.year) return;
    st.wy = A.S.year;
    for (const w of pc.lfWorks) {
      const W = w && LF.WORKS[w.k];
      if (!W || !W.year || w.gone || w.y === A.S.year) continue;
      try { W.year(pc, w); } catch (e) { console.error('works', w.k, e); }
    }
  };
  A.onMonth.push(pc => { try { LF.worksYear(pc); } catch (e) { console.error('works year', e); } });
  // the profile of a life's spending, for the bench: the dearest thing it could buy
  LF.dearest = pc => Math.max(0, ...Object.keys(LF.WORKS).map(k => LF.workCost(pc, k)));
})();
