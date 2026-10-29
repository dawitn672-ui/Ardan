// The living economy, part 3: a trade life on the long roads (growth lane E, cycle 1; lives review I4).
//
// A merchant could buy at home and carry a wagon to the five nearest market towns (66), or make 45's runs to a
// neighbouring realm, and then had nothing to spend a fortune on. Now the player can send what they carry with the
// caravans to any market the roads reach, a hand or several away: a venture.
//   - The venture pays its freight before it leaves: each hand's carting, the tolls at the lore's chokepoints (to their
//     holders) and every relay broker's tenth. It then takes the road's real time: months, a year or two to the far
//     end of the Silk Road.
//   - On the way the road happens to it: riders at a pass, toll-men who want more, snow on the Red Saddle, a war that
//     closes the strand, a ship that missed the monsoon, a night camped by one of 997's wild places. Each is a scene
//     (roads.events.js, prefix tr_) with a cost either way.
//   - At the end the goods sell at that market's price, down the slide its depth allows, less the money-changers' cut
//     between the two monies (A.MONEY) and, in Taulen, the half-notes. The money comes home as a letter of credit, as
//     slowly as the brokers' letters travel.
// Ventures are open on the Great Continent only (they need the roads). At most TR.MAX_VENTURES at once.
//
// State: pc.ventures (a list; missing in old saves), pc.credits (letters on the way). The month hook moves them (it
// draws the road's dice). The card only reads.
(function () {
  const TR = A.TRADE; if (!TR || !A.ECON) return;
  const E = A.ECON, M = A.MONEY;
  Object.assign(TR, { MAX_VENTURES: 3, V_RISK: 0.12, V_SCENE: 0.35, FACTOR: 0.1 });   // the far factor who sells for you takes a tenth
  const Gs = () => GD.GOODS;
  const vlist = pc => (pc && Array.isArray(pc.ventures) ? pc.ventures : []);
  TR.ventures = pc => vlist(pc).filter(v => v.st === 'road' || v.st === 'held');
  TR.hasVenture = pc => TR.ventures(pc).length > 0;

  // what n loads fetch sold into a market: the sale price now, down the release's per-load slide, and never more than
  // the price the market's own store would set once it holds them (45's scarcity rule): one load of silk into a
  // market whose rich buy a twentieth of a load a month fetches what that market will pay for a year's silk, not its
  // famine price (pure)
  TR.fetch = function (rid, k, n, pc) {
    const m = A.mkt(rid); if (!m || !(n > 0)) return 0;
    const depth = A.mktDepth(rid, k), now = A.sellPrice(rid, k, pc);
    let after = now;
    if (m.s && E.normal) {
      const N = E.normal(m, k), s = m.s[k] || 0, sc = x => Math.max(E.LO, Math.min(E.HI, Math.pow(N / Math.max(x, N * 0.05), E.ELASTIC)));
      after = now * sc(s + n) / sc(s);
    }
    let got = 0;
    for (let i = 0; i < n; i++) got += Math.min(now * Math.max(0.3, 1 - i * 0.6 / depth), (now + after) / 2);
    return got;
  };
  // what a venture of n loads of k from home to the trip's end would cost and fetch (pure)
  TR.vPlan = function (pc, k, n, T) {
    const home = A.homeMkt(pc), mh = A.mkt(home), md = T.md(), g = Gs()[k]; if (!mh || !md || !g) return null;
    const v0 = mh.p[k], c = TR.cost(T, k, v0, g.base); if (c == null) return null;
    // the freight: everything but the interest, which is the player's own money lying on the road
    let interest = 0, v = v0;
    for (let i = 0; i < T.legs.length; i++) { const e = T.legs[i]; if (i) v *= 1 + TR.BROKER; const t = TR.tollOf(e, k); const add = v * TR.INTEREST * Math.max(0.5, e.days / 30); interest += add; v += v * t + g.base * e.f + add; }
    const freight = Math.round((c - v0 - interest) * n);
    const got = TR.fetch(T.b, k, n, pc);
    const cut = M.change(T.b, home) + M.noteLoss(T.b) + TR.FACTOR;
    const net = Math.round(got * (1 - cut));
    const atHome = Math.round(A.sellPrice(home, k, pc) * n);
    return { k, n, b: T.b, hands: T.hands, months: Math.max(1, Math.round(T.days / 30)), freight, sale: Math.round(got), cut, net, atHome, gain: net - freight - atHome, legs: T.legs, T };
  };
  // the best places to send what the player carries (pure): for each good in the cargo, the trips that pay best
  TR.vOptions = function (pc, per) {
    if (!TR.on() || !pc) return [];
    const home = A.homeMkt(pc), cargo = A.cargo ? (pc.cargo || {}) : {}, out = [];
    const trips = TR.trips(home, pc) || [];
    for (const k in cargo) {
      const n = cargo[k] || 0; if (!(n > 0) || !Gs()[k]) continue;
      const opts = [];
      for (const T of trips) { if (T.hands < 1) continue; const P = TR.vPlan(pc, k, n, T); if (P && P.net > 0) opts.push(P); }
      opts.sort((a, b) => b.gain - a.gain || (a.b < b.b ? -1 : 1));
      out.push(...opts.slice(0, per || 3));
    }
    return out;
  };

  // ---- sending (an engine action)
  TR.send = function (dest, k) {
    const pc = A.pc(); if (!pc || !TR.on()) return { ok: false, msg: 'There are no long roads from here.' };
    if (TR.ventures(pc).length >= TR.MAX_VENTURES) return { ok: false, msg: `You already have ${TR.MAX_VENTURES} ventures on the road.` };
    const home = A.homeMkt(pc), T = (TR.trips(home, pc) || []).find(x => x.b === dest); if (!T) return { ok: false, msg: 'No caravan goes there from here.' };
    const n = Math.floor((pc.cargo || {})[k] || 0); if (!(n > 0)) return { ok: false, msg: 'You carry none of that.' };
    const P = TR.vPlan(pc, k, n, T); if (!P) return { ok: false, msg: 'That may not go by that road.' };
    if (pc.coin < P.freight) return { ok: false, msg: `The freight is ${A.coin(P.freight)}, and you have ${A.coin(pc.coin)}.` };
    pc.coin -= P.freight;
    pc.cargo[k] -= n; if (!(pc.cargo[k] > 0)) delete pc.cargo[k];
    // the tolls go to the gates' holders, as the caravans' do
    for (const e of T.legs) for (const ck of e.ck) { const t = TR.tollOf({ ck: [ck], west: e.west }, k); if (!(t > 0)) continue; const hr = A.realm(ck.by); if (hr && hr.alive) hr.treasury = (hr.treasury || 0) + Math.round(n * A.mkt(home).p[k] * t); }
    const now = A.absDay(); let at = now; const due = [];
    T.legs.forEach((e, i) => { at += e.days + (i ? TR.RELAY_DAYS : 0); due.push(at); });
    pc.ventures = vlist(pc);
    const id = 'v' + (A.S.year % 100) + '_' + (pc.ventures.length + 1) + '_' + (now % 1000);
    pc.ventures.push({ id, k, n, f: home, t: dest, legs: T.legs.map(e => e.b), due, leg: 0, y: A.S.year, paid: P.freight, worth: Math.round(n * A.mkt(home).p[k]), st: 'road', loss: 0, seen: 0 });
    pc.flags = pc.flags || {}; pc.flags.tr_venture = A.S.year;
    A.log(`You send ${n} load${n > 1 ? 's' : ''} of ${Gs()[k].name.toLowerCase()} to ${A.realmShort(dest)}: ${T.hands} hand${T.hands > 1 ? 's' : ''}, about ${P.months} month${P.months > 1 ? 's' : ''} on the road. Freight, tolls and the brokers' tenths: ${A.coin(P.freight)}.`, 'info');
    return { ok: true };
  };
  // a scene's choice works on its venture: lose a share, wait, pay, or sell where it stands
  TR.vfx = function (pc, ctx, o) {
    const v = vlist(pc).find(x => x.id === (ctx && ctx.vid)); if (!v) return '';
    o = o || {};
    if (o.coin) pc.coin = Math.max(0, pc.coin - o.coin);
    if (o.lose) { const l = Math.min(v.n, Math.max(1, Math.round(v.n * o.lose))); v.n -= l; v.loss += l; if (v.n <= 0) { v.st = 'lost'; return ' The venture is gone.'; } }
    if (o.wait) for (let i = v.leg; i < v.due.length; i++) v.due[i] += o.wait;
    if (o.sellHere) { TR.vSettle(pc, v, v.legs[Math.max(0, v.leg - 1)] || v.f); return ''; }
    if (o.flag) { pc.flags = pc.flags || {}; pc.flags[o.flag] = A.S.year; }
    v.st = 'road';
    return '';
  };
  // the goods are sold where they stand; the money comes home by letter
  TR.vSettle = function (pc, v, at) {
    const k = v.k, n = v.n, m = A.mkt(at); if (!m || !(n > 0)) { v.st = 'lost'; return; }
    const got = TR.fetch(at, k, n, pc), depth = A.mktDepth(at, k);
    m.p[k] *= Math.max(0.5, 1 - n * 0.6 / depth / 2);
    if (m.s) m.s[k] = (m.s[k] || 0) + n;
    const cut = M.change(at, v.f) + M.noteLoss(at) + TR.FACTOR, net = Math.round(got * (1 - cut));
    const days = TR.newsDays(at, A.homeMkt(pc)) || 30;
    pc.credits = Array.isArray(pc.credits) ? pc.credits : [];
    pc.credits.push({ amt: net, due: A.absDay() + days, from: at, k, n, cut: Math.round(got - net), paid: v.paid, worth: v.worth });
    v.st = 'sold'; v.sold = net; v.at = at;
    A.log(`Your ${n} load${n > 1 ? 's' : ''} of ${Gs()[k].name.toLowerCase()} sell at ${A.realmShort(at)} for ${M.fmt(got, at)}; your factor${M.change(at, v.f) ? ', the money-changers' : ''}${M.noteLoss(at) ? ' and the half-notes' : ''} take ${A.coin(got - net)}. A letter of credit is on its way home.`, 'info');
  };
  const sceneFor = (v, e, why) => {
    if (why === 'war') return 'tr_road_war';
    if (why && why.startsWith('shut:')) return 'tr_road_shut';
    if (why === 'wind') return 'tr_road_monsoon';
    const ck = e && e.ck && e.ck.find(c => c.toll > 0);
    return A.pick(ck ? ['tr_road_toll', 'tr_road_bandits', 'tr_road_camp'] : ['tr_road_bandits', 'tr_road_camp']);
  };
  // the month: ventures move a hand when its days are done; a hand that cannot go on waits, and the road may happen
  A.onMonth.push(() => {
    try {
      const pc = A.pc(); if (!pc || !pc.alive) return;
      const now = A.absDay(), mo = A.monthOf(A.today()).m;
      if (Array.isArray(pc.credits) && pc.credits.length) {
        const keep = [];
        for (const c of pc.credits) {
          if (c.due > now) { keep.push(c); continue; }
          pc.coin += c.amt; pc.flags = pc.flags || {}; pc.flags.traded = (pc.flags.traded || 0) + c.amt;
          const net = c.amt - (c.paid || 0) - (c.worth || 0);
          A.log(`A letter of credit from ${A.realmShort(c.from)}: ${A.coin(c.amt)} for ${c.n} load${c.n > 1 ? 's' : ''} of ${(Gs()[c.k] || { name: 'goods' }).name.toLowerCase()}. Against what the goods were worth at home and the freight, ${net >= 0 ? 'a gain' : 'a loss'} of ${A.coin(Math.abs(net))}.`, net >= 0 ? 'good' : 'warn');
        }
        pc.credits = keep;
      }
      if (!TR.on()) return;
      for (const v of TR.ventures(pc)) {
        if (v.st !== 'road' || v.leg >= v.legs.length || now < v.due[v.leg]) continue;
        const at = v.legs[v.leg]; v.leg++;
        if (v.leg >= v.legs.length) { TR.vSettle(pc, v, v.t); continue; }
        // the next hand: open, and safe?
        const e = (TR.graph().out[at] || []).find(x => x.b === v.legs[v.leg] && TR.secretOk(x, v.f, pc));
        const why = e ? TR.shutWhy(e, mo) : '';
        if (why) { for (let i = v.leg - 1; i < v.due.length; i++) v.due[i] += 30; v.leg--; }
        const risky = why || A.chance(TR.V_RISK * Math.min(2, (e ? e.dist : 1500) / 1500));
        if (risky && v.seen < 3 && (why ? A.chance(0.5) : A.chance(TR.V_SCENE))) {
          v.seen++; v.st = 'held';
          const ck = e && e.ck && e.ck.find(c => c.toll > 0 || c.shut);
          A.schedule({ type: 'event', ev: sceneFor(v, e, why), ctx: { vid: v.id, trAt: at, trNext: v.legs[v.leg] || v.t, trCk: ck ? ck.n : '', trWhy: why }, forced: true }, 1);
        } else if (risky && !why) {
          // the road takes its share without a scene: a mule down a ravine, a bale gone at an inn
          const l = Math.max(1, Math.round(v.n * A.rf(0.05, 0.2))); v.n -= l; v.loss += l;
          A.log(`Word from the road to ${A.realmShort(v.t)}: ${l} load${l > 1 ? 's' : ''} of your ${Gs()[v.k].name.toLowerCase()} lost past ${A.realmShort(at)}.`, 'warn');
          if (v.n <= 0) v.st = 'lost';
        }
      }
      // a scene that never came (dropped from the queue) does not hold a venture for ever
      for (const v of vlist(pc)) if (v.st === 'held' && v.leg < v.due.length && now > v.due[v.leg] + 120) v.st = 'road';
    } catch (e) { console.error('ventures', e); }
  });

  // ---- the card (pure): the long roads from the player's market, what they carry could fetch, and what is out
  TR.card = function (pc) {
    if (!pc) return '';
    if (!TR.on()) { const f = TR.fortuneCard(pc); return f ? `<div class="tr-card" style="margin-top:10px"><div class="small"><b>A great purse</b></div>${f}</div>` : ''; }
    const home = A.homeMkt(pc), c = M.of(home), esc = UI.esc, G = Gs();
    let h = `<div class="tr-card" style="margin-top:10px"><div class="small"><b>The long roads</b> <span class="tiny muted">${esc(`Money here: the ${c.name} (${c.d}; ${c.sun === 1 ? 'the unit of account' : `about ${c.sun} suns`}).`)}</span></div>`;
    const opts = TR.vOptions(pc, 2);
    if (opts.length) {
      h += '<table class="tiny" style="width:100%;margin-top:4px"><tr class="muted"><td>Send</td><td>To</td><td class="hide-s">Hands</td><td>Months</td><td>Freight</td><td>Fetches</td><td></td></tr>';
      for (const P of opts) {
        const tip = `By ${P.legs.map(e => A.realmShort(e.b)).join(', ')}${P.legs.some(e => e.rn) ? ` (${P.legs.map(e => e.rn).filter(Boolean)[0]})` : ''}. Sold there for about ${A.coin(P.sale)}${`, less ${Math.round(P.cut * 100)} in 100 to your factor${P.cut > TR.FACTOR + 1e-9 ? ' and the money-changers' : ''}`}. Sold at home now: ${A.coin(P.atHome)}.`;
        h += `<tr title="${esc(tip)}"><td>${esc(`${P.n} ${G[P.k].name.toLowerCase()}`)}</td><td>${esc(A.realmShort(P.b))}</td><td class="hide-s">${P.hands}</td><td>${P.months}</td><td>${esc(A.coin(P.freight))}</td><td class="${P.gain > 0 ? 'good' : 'muted'}">${esc(A.coin(P.net))}</td><td><button class="btn tiny" data-a="trSend" data-v="${esc(P.b + '|' + P.k)}"${pc.coin < P.freight ? ' disabled' : ''}>Send</button></td></tr>`;
      }
      h += '</table>';
    } else h += `<div class="tiny muted">${esc('Buy goods here and carry them, and the caravans will take them as far as the roads go.')}</div>`;
    const vs = vlist(pc).filter(v => v.st === 'road' || v.st === 'held'), cr = Array.isArray(pc.credits) ? pc.credits : [];
    if (vs.length || cr.length) {
      const now = A.absDay();
      const line = v => { const left = Math.max(0, Math.round(((v.due[v.due.length - 1] || now) - now) / 30)), at = v.leg > 0 ? A.realmShort(v.legs[v.leg - 1]) : A.realmShort(v.f); return `${v.n} ${G[v.k] ? G[v.k].name.toLowerCase() : v.k} to ${A.realmShort(v.t)}: ${v.st === 'held' ? 'held' : 'past'} ${at}, about ${left} month${left === 1 ? '' : 's'} to go${v.loss ? `, ${v.loss} lost` : ''}`; };
      h += `<div class="tiny" style="margin-top:4px">${esc([...vs.map(line), ...cr.map(x => `a letter of credit from ${A.realmShort(x.from)} for ${A.coin(x.amt)}, on its way`)].join('; ') + '.')}</div>`;
    }
    return h + TR.fortuneCard(pc) + '</div>';
  };
  const card = E.card;
  E.card = function (rid) {
    let h = card.apply(this, arguments);
    try { const pc = A.pc(); if (pc && rid === A.homeMkt(pc)) h += TR.card(pc); } catch (e) { console.error('trade card', e); }
    return h;
  };
  // ---- what a fortune is for (lives review cycle 2, F1: a merchant ended on 1.65 million suns, and nothing late in a
  // life cost more than a few thousand). Two things a great purse can do on the roads, both with stakes:
  //   - lend to a crown (TR.lend): its treasury takes the money and its debt grows by it; it pays interest every year
  //     at a rate set by its credit (6 in 100, and 3 more for every year of income it already owes) and the principal
  //     back after LOAN_YEARS. A crown that goes broke (04-world-fixes' A.WF.broke) or repudiates its debts pays
  //     nothing more. A loan sways the ruler (opinion +, a favour owed).
  //   - endow a caravanserai on the road out of your realm (TR.endow): walls, wells and a garrison. Every caravan
  //     through the realm loses less to bandits (r.serais, up to SERAI_MAX), and the world remembers who built it.
  // And at each New Year the log says what the purse did that year, and how much of it came from trade.
  Object.assign(TR, { LOAN_MIN: 5000, LOAN_YEARS: 5, LOAN_RATE: 0.06, LOAN_DEBT_RATE: 0.03, SERAI_COST: 20000, SERAI_MAX: 5, SERAI_CUT: 0.1 });
  TR.loanRate = r => { const inc = Math.max(1, r.income || 0); return Math.round((TR.LOAN_RATE + TR.LOAN_DEBT_RATE * Math.min(4, (r.debt || 0) / inc)) * 1000) / 1000; };
  TR.loanTargets = function (pc) {
    if (!pc) return [];
    const home = A.homeMkt(pc), out = [], seen = new Set();
    const add = id => { const r = A.realm(id); if (!r || !r.alive || r.playerRun || seen.has(id) || (pc.ruler && pc.ruler === id)) return; seen.add(id); out.push(r); };
    add(pc.realm); add(home);
    for (const id of (A.neighbors ? A.neighbors(home) : []).slice().sort()) add(id);
    return out.slice(0, 4);
  };
  TR.lend = function (rid, share) {
    const pc = A.pc(), r = A.realm(rid); if (!pc || !r || !r.alive) return { ok: false, msg: 'No such crown.' };
    if (!TR.loanTargets(pc).includes(r)) return { ok: false, msg: 'That crown does not borrow from you.' };
    const amt = Math.round(Math.max(TR.LOAN_MIN, (pc.coin || 0) * (share || 0.25)) / 100) * 100;
    if (!(pc.coin >= amt) || amt < TR.LOAN_MIN) return { ok: false, msg: `A crown borrows ${A.coin(TR.LOAN_MIN)} at the least.` };
    const rate = TR.loanRate(r);
    pc.coin -= amt; r.treasury = (r.treasury || 0) + amt; r.debt = (r.debt || 0) + amt;
    pc.crownLoans = Array.isArray(pc.crownLoans) ? pc.crownLoans : [];
    pc.crownLoans.push({ rid, amt, rate, y: A.S.year, until: A.S.year + TR.LOAN_YEARS, got: 0 });
    const ru = r.ruler != null ? A.P(r.ruler) : null;
    if (ru && ru.alive && A.addOp) { try { A.addOp(ru, pc, 6); } catch (e) {} }
    pc.flags = pc.flags || {}; pc.flags.tr_crown_loan = A.S.year;
    A.log(`You lend ${A.coin(amt)} to the crown of ${A.realmShort(rid)}, at ${Math.round(rate * 100)} in 100 a year, to be repaid in ${A.S.year + TR.LOAN_YEARS}.`, 'info');
    return { ok: true };
  };
  TR.loanYear = function (pc) {
    const L = Array.isArray(pc.crownLoans) ? pc.crownLoans : null; if (!L || !L.length) return;
    const keep = [];
    for (const x of L) {
      const r = A.realm(x.rid);
      const broke = !r || !r.alive || (A.WF && A.WF.broke && A.WF.broke(r)) || (r.riDefault != null && r.riDefault >= x.y);
      if (broke) {
        A.log(`The crown of ${A.realmShort(x.rid)} cannot pay: your loan of ${A.coin(x.amt)} is lost, after ${A.coin(x.got)} of interest.`, 'bad');
        pc.flags = pc.flags || {}; pc.flags.tr_loan_lost = A.S.year;
        continue;
      }
      const due = Math.round(x.amt * x.rate) + (A.S.year >= x.until ? x.amt : 0);
      r.treasury -= due; if (A.S.year >= x.until) r.debt = Math.max(0, (r.debt || 0) - x.amt);
      pc.coin += due; x.got += due;
      if (A.S.year >= x.until) A.log(`The crown of ${A.realmShort(x.rid)} repays your loan: ${A.coin(x.amt)}, and ${A.coin(x.got)} in all.`, 'good');
      else keep.push(x);
    }
    pc.crownLoans = keep;
  };
  TR.seraiCost = r => TR.SERAI_COST * (1 + (r && r.serais || 0));
  TR.endow = function () {
    const pc = A.pc(); if (!pc) return { ok: false };
    const r = A.realm(A.homeMkt(pc)); if (!r) return { ok: false, msg: 'No road here.' };
    if ((r.serais || 0) >= TR.SERAI_MAX) return { ok: false, msg: `The roads of ${r.short} have all the caravanserais they can use.` };
    const c = TR.seraiCost(r); if (!(pc.coin >= c)) return { ok: false, msg: `A caravanserai costs ${A.coin(c)}.` };
    pc.coin -= c; r.serais = (r.serais || 0) + 1;
    pc.fame = Math.min(100, (pc.fame || 0) + 4);
    pc.flags = pc.flags || {}; pc.flags.tr_serai = A.S.year;
    (pc.deeds = Array.isArray(pc.deeds) ? pc.deeds : []).push({ y: A.S.year, t: `Built a caravanserai on the roads of ${r.short}` });
    A.log(`You endow a caravanserai on the road out of ${r.short}: walls, a well, a stable and a garrison of ten. ${A.coin(c)}. The caravans will lose less on that road.`, 'good');
    A.news(`A caravanserai rises on the roads of ${r.short}, built by ${A.fullName ? A.fullName(pc, false) : pc.given}.`, 'realm');
    return { ok: true };
  };
  // the bandits' share on a trip falls with the caravanserais of the realms it passes through (read by TR.month)
  TR.seraiMul = T => { let n = 0; for (const id of T.through.concat([T.b])) { const r = A.realm(id); n += r && r.serais || 0; } return Math.max(0.5, 1 - TR.SERAI_CUT * n); };
  // the New Year line: what the purse did, and how much of it was trade
  TR.purseYear = function (pc) {
    const P = pc.purseY, t = (pc.flags && pc.flags.traded) || 0;
    if (P && P.y === A.S.year - 1) {
      const d = Math.round(pc.coin - P.c), tr = Math.round(t - P.t);
      if (Math.abs(d) >= 200) A.log(`Your purse over ${P.y}: ${A.coin(pc.coin)} at the New Year, ${d >= 0 ? 'up' : 'down'} ${A.coin(Math.abs(d))}${tr > 0 ? `; trade and ventures brought in ${A.coin(tr)}` : ''}.`, 'info');
    }
    pc.purseY = { y: A.S.year, c: Math.round(pc.coin), t: Math.round(t) };
  };
  A.onMonth.push(() => {
    try {
      const pc = A.pc(); if (!pc || !pc.alive || A.monthOf(A.today()).m !== 0) return;
      TR.loanYear(pc); TR.purseYear(pc);
    } catch (e) { console.error('fortune', e); }
  });
  // (pure) the card's last part: loans and the caravanserai, for a purse that can afford them
  TR.fortuneCard = function (pc) {
    const esc = UI.esc, L = Array.isArray(pc.crownLoans) ? pc.crownLoans : [];
    let h = '';
    if ((pc.coin || 0) >= TR.LOAN_MIN) {
      const rows = TR.loanTargets(pc).map(r => `<button class="btn tiny" data-a="trLend" data-v="${esc(r.id)}" title="${esc(`${Math.round(TR.loanRate(r) * 100)} in 100 a year; its debt is ${A.fmt(Math.round(r.debt || 0))}, its income ${A.fmt(Math.round(r.income || 0))} a year. A broke crown pays nothing more.`)}">${esc(`Lend to ${r.short} (${Math.round(TR.loanRate(r) * 100)}%)`)}</button>`).join(' ');
      if (rows) h += `<div class="tiny" style="margin-top:6px">${esc(`A crown borrows a quarter of your purse (${A.coin(Math.max(TR.LOAN_MIN, Math.round((pc.coin || 0) * 0.25 / 100) * 100))}) for ${TR.LOAN_YEARS} years:`)} ${rows}</div>`;
      const r = A.realm(A.homeMkt(pc));
      if (r && (r.serais || 0) < TR.SERAI_MAX && pc.coin >= TR.seraiCost(r) * 0.5) h += `<div class="tiny" style="margin-top:4px"><button class="btn tiny" data-a="trEndow"${pc.coin < TR.seraiCost(r) ? ' disabled' : ''}>${esc(`Endow a caravanserai (${A.coin(TR.seraiCost(r))})`)}</button> <span class="muted">${esc(`${r.short} has ${r.serais || 0}. Caravans through it lose less to bandits.`)}</span></div>`;
    }
    if (L.length) h += `<div class="tiny" style="margin-top:4px">${esc('Out on loan: ' + L.map(x => `${A.coin(x.amt)} to ${A.realmShort(x.rid)} at ${Math.round(x.rate * 100)}% until ${x.until}`).join('; ') + '.')}</div>`;
    return h;
  };
  if (typeof UI !== 'undefined' && UI.A) Object.assign(UI.A, {
    trSend(v) { const [dest, k] = String(v || '').split('|'); const r = TR.send(dest, k); if (r && !r.ok && r.msg) A.log(r.msg, 'warn'); UI.render(); },
    trLend(v) { const r = TR.lend(String(v || ''), 0.25); if (r && !r.ok && r.msg) A.log(r.msg, 'warn'); UI.render(); },
    trEndow() { const r = TR.endow(); if (r && !r.ok && r.msg) A.log(r.msg, 'warn'); UI.render(); },
  });
})();
