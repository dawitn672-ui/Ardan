// Nested tooltips: Holdings. The purse, the gear you carry and the armorer's prices, the market (price, stock, the
// dealer's cut, the town's own store), the nearest market towns (road, carting, prices there), the trade roads, the
// property table, and 56-realm-inside's money book ("Where the money goes"). Each entry reads the live game and
// changes nothing. Where the number on screen is a sum, its rows add up to it; where it is a product (a price), the
// factors multiply to it.
(function () {
  const G = UI.TIPS = UI.TIPS || {}, TT = UI.TT, K = TT.K;
  const { esc, r0, r1, r2, sg, pct, H, R, D, F, L, coin } = K;
  const pc = () => A.pc();
  const without = (p, o) => Object.assign({}, p, o);
  const gearOf = (p, slot, k, q) => without(p, { gear: Object.assign({}, p.gear, { [slot]: k }), gearQ: Object.assign({}, p.gearQ || {}, { [slot]: q || 'common' }) });
  const home = () => { const p = pc(); return p ? A.homeMkt(p) : null; };
  const MT = () => (A.MT && A.MT.on && A.MT.on() ? A.MT : null);
  const goodName = k => esc((GD.GOODS[k] || {}).name || k);

  // ---- the purse ---------------------------------------------------------------------------------------------------
  TT.ownParts = function (p) {
    const parts = [[L('coin', '', 'Coin'), p.coin || 0]];
    for (const a of p.assets || []) { const P = GD.PROPERTY[a.k]; if (P) parts.push([L('prop', a.k, esc(a.name || P.name)), P.price]); }
    for (const sl in p.gear || {}) { const k = p.gear[sl], g = k && GD.GEAR[k]; if (g && g.price) parts.push([L('gearSlot', sl, esc(g.name)), g.price]); }
    return { parts, total: (p.coin || 0) + A.assetValue(p) };
  };
  G.worthAll = function () {
    const p = pc(); if (!p) return '';
    const S = TT.ownParts(p);
    return H('Everything you own', coin(S.total)) + D('Coin in hand, and what your holdings and gear cost new. A sale fetches less: gear goes back for about a third.') +
      TT.sumRows(S.parts, S.total, 'All of it', v => esc(A.fmt(v))) +
      (p.debt ? F(`Your ${L('debt', '', 'debt')} of ${coin(p.debt)} is not taken off.`) : '');
  };
  G.debt = function () {
    const p = pc(); if (!p) return '';
    const d = p.debt || 0;
    return H('Debt', coin(d)) + D('Owed to the moneylenders. Each new year adds 12% unless you pay it down; a short year adds what you could not pay.') +
      R('Interest a year at 12%', coin(d * 0.12)) + (d > 50 ? R(L('happy', '', 'Happiness') + ', each year', '−5', 'tt-sub') : '') +
      F('Deep in debt, your living is forced one step down.');
  };

  // ---- gear ----------------------------------------------------------------------------------------------------------
  // what a piece does, at a quality: rows of the stats (base × quality, base + quality)
  TT.gearStats = function (k, q) {
    const g = GD.GEAR[k], Q = GD.QUAL[q || 'common'] || GD.QUAL.common, rows = [];
    if (!g) return '';
    if (g.dmg) {
      rows.push(R('Damage', `${g.dmg}${Q.dmg !== 1 ? ' ×' + Q.dmg + ' = ' + r1(g.dmg * Q.dmg) : ''}`));
      if (g.pierce || Q.pierce) rows.push(R('Pierce (against armor)', `${g.pierce || 0}${Q.pierce ? ' + ' + Q.pierce : ''}`));
      if (g.reach) rows.push(R('Reach', sg(g.reach), 'tt-sub'));
      if (g.spd || Q.spd) rows.push(R('Quickness', sg((g.spd || 0) + (Q.spd || 0)), 'tt-sub'));
      if (g.twoHand) rows.push(R('Two hands', 'no shield', 'tt-sub'));
      rows.push(R('Trains', L('skill', GD.WEAPON_SKILL[g.kind] || 'unarmed', esc(GD.SKILLS[GD.WEAPON_SKILL[g.kind] || 'unarmed'] || g.kind)), 'tt-sub'));
    } else if (g.prot != null) {
      rows.push(R('Protection', `${g.prot}${Q.prot !== 1 ? ' ×' + Q.prot + ' = ' + r1(g.prot * Q.prot) : ''}`));
      if (g.weight) rows.push(R('Weight', g.weight + ` (tires a body with ${L('stat', 'sta', 'stamina')} under 50)`, 'tt-sub'));
    } else if (g.def) rows.push(R('Defense', g.def + ' + ' + L('skill', 'shield', 'shield work') + ' ÷ 40'));
    else if (g.ride != null) rows.push(R('Riding', g.ride + (g.war ? ' · war-trained' : '')));
    return rows.join('');
  };
  const worthIf = (p, slot, k, q) => A.fightWorth(gearOf(p, slot, k, q));
  G.gearSlot = function (slot) {
    const p = pc(); if (!p) return '';
    const k = p.gear[slot], g = k && GD.GEAR[k]; if (!g) return '';
    const q = A.qualOf(p, slot), w = A.fightWorth(p), w0 = A.fightWorth(without(p, { gear: Object.assign({}, p.gear, { [slot]: null }) }));
    return H(esc(g.name), null, esc((GD.QUAL[q] || GD.QUAL.common).n) + ' · ' + esc(slot)) + TT.gearStats(k, q) +
      (['weapon', 'armor', 'shield', 'helm'].includes(slot) ? R(L('worthGear', p.id, 'Fighting worth') + ' with it', `${w} (${sg(w - w0)})`, 'tt-sum') : '') +
      R('Bought new', coin(A.gearPrice(k, q, home())), 'tt-sub') + F('Sold back, it fetches about a third of that.');
  };
  // the armorer: price = list × quality × the market's metal (or horses), at least 1
  TT.priceParts = function (k, q, rid) {
    const g = GD.GEAR[k], Q = GD.QUAL[q || 'common'] || GD.QUAL.common, m = rid && A.mkt(rid);
    let metal = 1, why = '';
    if (m && ['weapon', 'armor', 'helm', 'shield', 'ranged'].includes(g.slot)) { const raw = m.p.steel / GD.GOODS.steel.base * 0.5 + m.p.iron / GD.GOODS.iron.base * 0.5; metal = A.clamp(raw, 0.6, 1.8); why = `Iron and steel in your market (${pct(raw)} of their usual price${raw !== metal ? ', held to 60–180%' : ''})`; }
    else if (m && g.slot === 'mount') { const raw = m.p.horses / GD.GOODS.horses.base; metal = A.clamp(raw, 0.6, 1.8); why = `Horses in your market (${pct(raw)} of the usual price)`; }
    return { start: g.price || 1, factors: [[esc(Q.n) + ' work', Q.price], [esc(why), metal]], total: A.gearPrice(k, q, rid) };
  };
  G.shopItem = function (arg) {
    const p = pc(); const [k, q0] = String(arg).split('|'), q = q0 || UI.shopQ || 'common', g = GD.GEAR[k]; if (!p || !g) return '';
    const P = TT.priceParts(k, q, home()), w = A.fightWorth(p), wi = worthIf(p, g.slot, k, q), have = p.gear[g.slot] === k && A.qualOf(p, g.slot) === q;
    return H(esc(g.name), coin(P.total), esc((GD.QUAL[q] || {}).n || q)) + TT.gearStats(k, q) +
      (['weapon', 'armor', 'shield', 'helm'].includes(g.slot) && !have ? R(`${L('worth', p.id, 'Fighting worth')} if you wore it`, `${wi} (now ${w}, ${sg(wi - w)})`, 'tt-sum') : '') +
      `<div class="tip-row tt-sum"><span>The price</span><b></b></div>` + K.mul(['List price', P.start, 'Price'], P.factors, P.total, v => coin(v)) +
      F('Your old piece is sold back at about a third of its list price.');
  };

  // ---- the market ------------------------------------------------------------------------------------------------------
  // a price in your market: the realm's price × the dealer's cut × the town's own store (66-markets) and the rest
  TT.mktParts = function (rid, k, side, pid) {
    const p = pc(), m = A.mkt(rid), base = m.p[k], spread = Math.max(A.spread(p), 0.2 / A.mktDepth(rid)), cut = side === 'sell' ? 1 - spread : 1 + spread;
    const f = side === 'sell' ? A.sellPrice : A.buyPrice, shown = pid != null && MT() ? MT().at(pid, () => f(rid, k)) : f(rid, k);
    const town = shown / Math.max(1e-9, base * cut);
    const realm = A.realm(rid), here = pid != null ? pid : MT() ? MT().townFor(rid, p) : null;
    return {
      start: base, total: shown, spread, cut, town, here,
      factors: [[side === 'sell' ? `The dealer's cut (−${pct(spread)})` : `The dealer's cut (+${pct(spread)})`, cut],
        [here != null && MT() ? `${esc(MT().name(here))}'s own store against its need` : 'Your province: distance and what it makes', town]],
      realmName: realm ? realm.short : rid,
    };
  };
  TT.spreadRows = function (rid) {
    const p = pc(), ts = A.tradeSkill(p), st = A.staffBonus ? A.staffBonus(p, 'trade') : 0, raw = 0.1 - ts / 1200 - st * 0.3, own = A.spread(p), floor = 0.2 / A.mktDepth(rid);
    return R(`${L('skill', 'trade', 'Trade')} ${ts}${p.job && p.job.c === 'merchant' ? ' (with your merchant\'s rank)' : ''}`, `10% − ${r1(ts / 12)}%`, 'tt-sub') +
      (st ? R('Your factor', '−' + r1(st * 30) + '%', 'tt-sub') : '') +
      R('Your cut', pct(own) + (raw !== own ? ' (2% to 10%)' : ''), 'tt-sub') +
      (floor > own ? R(`A shallow market: never under`, pct(floor), 'tt-sub') : '');
  };
  G.mktPrice = function (arg) {
    const p = pc(); const [k, side = 'buy', pid0] = String(arg).split('|');
    const pid = pid0 !== undefined && pid0 !== '' && MT() ? +pid0 : null, t = pid != null && A.S.mt && A.S.mt.T ? A.S.mt.T[pid] : null;
    const rid = t ? t.r : home();
    if (!p || !rid || !GD.GOODS[k]) return '';
    const P = TT.mktParts(rid, k, side, pid), Gd = GD.GOODS[k], m = A.mkt(rid);
    const tag = m.ex && m.ex.includes(k) ? 'made in the realm' : m.im && m.im.includes(k) ? 'imported' : '';
    const why = A.ECON && A.ECON.why ? (pid != null ? MT().at(pid, () => A.ECON.why(rid, k)) : A.ECON.why(rid, k)) : '';
    return H(goodName(k), coin(P.total), (side === 'sell' ? 'you sell' : 'you buy') + (pid != null && MT() ? ' at ' + esc(MT().name(pid)) : '')) +
      K.mul([`${esc(P.realmName)}'s price${tag ? ' (' + tag + ')' : ''}`, P.start, side === 'sell' ? 'You get' : 'You pay'], P.factors, Math.round(P.total), v => coin(v)) +
      R('Its usual price', esc(A.coin(Gd.base)), 'tt-sub') + TT.spreadRows(rid) +
      (why ? D(esc(why)) : '') + F(`Each load you ${side === 'sell' ? 'sell pushes the price down' : 'buy pushes the price up'}: a market only swallows so much.`);
  };
  G.cargo = function () {
    const p = pc(); if (!p) return '';
    const parts = [['On your back', GD.TRANSPORT.back.cap]], mt = p.gear && p.gear.mount;
    if (mt) parts.push([esc((GD.GEAR[mt] || {}).name || mt), mt === 'mule' ? 2 : mt === 'camel' ? 3 : 1]);
    for (const k of p.transport || []) if (GD.TRANSPORT[k]) parts.push([L('transport', k, esc(GD.TRANSPORT[k].name)), GD.TRANSPORT[k].cap]);
    if (p.job && p.job.c === 'merchant' && p.job.r) parts.push(['A merchant\'s rank, 5 a step', p.job.r * 5]);
    const cargo = p.cargo || {}, held = Object.entries(cargo).filter(([, n]) => n > 0);
    return H('Loads you can carry', A.carryCap(p)) + TT.sumRows(parts, A.carryCap(p), 'Loads') +
      (held.length ? `<div class="tip-row tt-sum"><span>Carrying now</span><b>${held.reduce((a, x) => a + x[1], 0)}</b></div>` + held.map(([k, n]) => R(goodName(k), n, 'tt-sub')).join('') : D('Nothing yet.')) +
      F('A load is what a mule carries.');
  };
  G.transport = function (k) {
    const T = GD.TRANSPORT[k], p = pc(); if (!T || !p) return '';
    return H(esc(T.name), coin(T.price)) + D(esc(T.d || '')) + R('Loads', '+' + T.cap) + R(L('cargo', '', 'You could carry'), A.carryCap(p) + ((p.transport || []).includes(k) ? 0 : T.cap), 'tt-sub');
  };

  // ---- the nearest market towns (66-markets) -------------------------------------------------------------------------
  G.mtRoad = function (pid) {
    const M = MT(); pid = +pid; if (!M) return '';
    const P = M.tripPlan(pid); if (!P) return '';
    const R0 = P.R;
    return H('To ' + esc(P.name), null, esc(A.realmShort(P.rid))) +
      R('Steps on the road', r1(R0.steps)) + R('Distance', `${R0.km} km${R0.sea ? ' by sea' : ''}`, 'tt-sub') + R('Days', `${R0.days} (${R0.sea ? '100' : '30'} km a day)`, 'tt-sub') +
      R(P.foreign ? 'Tolls abroad' : 'Market dues', pct(P.toll), 'tt-sub') + R('Danger on the road', pct(P.risk), 'tt-sub') +
      R(L('initiative', '', 'Initiative'), P.ini + '⧗', 'tt-sub') + F('A day of the road is about 30 km; by sea, 100.');
  };
  G.mtCart = function (arg) {
    const M = MT(); const [pid0, k] = String(arg).split('|'), pid = +pid0; if (!M || !GD.GOODS[k]) return '';
    const P = M.tripPlan(pid), R0 = P ? P.R : null; if (!R0) return '';
    const share = GD.GOODS[k].base * R0.f, floor = M.ABS0 + M.ABS * R0.steps, v = M.cartCost(k, R0);
    return H('Carting a load', coin(v), goodName(k)) +
      R(`A share of its worth (${esc(A.coin(GD.GOODS[k].base))} × ${r2(R0.f)})`, r2(share), share >= floor ? 'tt-on-row' : 'tt-sub') +
      R(`Mules, fodder and inns (${r2(M.ABS0)} + ${r2(M.ABS)} a step × ${r1(R0.steps)})`, r2(floor), floor > share ? 'tt-on-row' : 'tt-sub') +
      F('A load costs whichever is more: so grain and timber are dear to cart, and pearls are not.');
  };

  // ---- the trade roads -----------------------------------------------------------------------------------------------
  TT.runOf = dest => (A.bestRuns(pc()) || []).find(x => x.id === dest) || null;
  G.tradeRun = function (dest) {
    const p = pc(), x = TT.runOf(dest); if (!p || !x) return '';
    const P = A.runPlan(dest, {}), rid = home();
    return H('To ' + esc(A.realmShort(dest)), pct(x.m), goodName(x.k)) +
      R(`Buy here (${esc(A.realmShort(rid))})`, esc(A.coin(r1(x.buy)))) + R('Sell there', esc(A.coin(r1(x.sell)))) +
      R('Margin: (sell − buy) ÷ buy', pct(x.m), 'tt-sum') +
      R('Tolls', pct(x.toll) + (x.embargo ? ' (an embargo: ×3)' : ''), 'tt-sub') +
      R('Danger', pct(x.risk), 'tt-sub') + (P ? R('Road', `${P.km} km · ${P.days} days${P.sea ? ' by sea' : ''}`, 'tt-sub') : '') +
      R(L('initiative', '', 'Initiative'), (P ? P.ini : Math.max(1, Math.ceil(x.days / 25))) + '⧗', 'tt-sub') +
      F('Ranked by margin less tolls less half the danger. Each load sold there pushes its price down.');
  };
  G.runRisk = function (dest) {
    const P = A.runPlan(dest, {}); if (!P) return '';
    const war = A.S.wars.some(w => w.att.includes(dest) || w.def.includes(dest) || w.att.includes(P.home) || w.def.includes(P.home));
    const parts = [['Any road', 5], [`${P.days} days on it (÷ 4)`, P.days / 4]];
    if (war) parts.push(['A war at either end', 8]);
    if (P.sea) parts.push(['The sea', 4]);
    return H('Danger on the road', pct(P.risk)) + K.pts(parts, Math.round(P.risk * 100), 'Danger') + F('Guards cut it to about a third. Held between 2% and 60%.');
  };

  TT.runParts = function (dest) {
    const P = A.runPlan(dest, { guards: UI.run && UI.run.guards }); if (!P) return null;
    const parts = [['The sale there, roughly', P.sale]];
    if (P.toll) parts.push([`Tolls (${pct(P.toll)})`, -P.sale * P.toll]);
    if (P.guardCost) parts.push(['Guards', -P.guardCost]);
    if (P.haul) parts.push(['Carting the loads', -P.haul]);
    return { P, parts, total: P.net };
  };
  G.runPlan = function (dest) {
    const S = TT.runParts(dest); if (!S) return '';
    const P = S.P;
    return H('A run to ' + esc(A.realmShort(dest)), coin(P.net), 'net, if all goes well') + TT.sumRows(S.parts, S.total, 'Net', v => esc(A.fmt(v))) +
      R('Your cargo, worth here', coin(P.value), 'tt-sub') + R('Road', `${P.km} km · ${P.days} days${P.sea ? ' by sea' : ''}`, 'tt-sub') +
      R(L('runRisk', dest, 'Danger on the road'), pct(P.risk), 'tt-sub') + R(L('initiative', '', 'Initiative'), P.ini + '⧗', 'tt-sub') +
      F('Each load sold there fetches a little less than the one before.');
  };

  // ---- property -------------------------------------------------------------------------------------------------------
  G.prop = function (k) {
    const P = GD.PROPERTY[k], p = pc(); if (!P || !p) return '';
    const inc = P.income || 0, n = (p.assets || []).filter(a => a && a.k === k).length, net = inc - P.upkeep;
    return H(esc(P.name), coin(P.price)) +
      R('Income a year', inc ? coin(inc) : '—') + R('Upkeep a year', '−' + esc(A.coin(P.upkeep))) +
      R('Net', (net < 0 ? '−' : '+') + coin(Math.abs(net)), 'tt-sum') +
      (net > 0 ? R('Pays for itself in', r1(P.price / net) + ' years', 'tt-sub') : '') +
      (P.comfort ? R('Comfort', '+' + P.comfort, 'tt-sub') : '') + (n ? R('You hold', n, 'tt-sub') : '') +
      F('The crown takes a tenth of rents where 56-realm-inside taxes them; a holding burned in a raid pays nothing until rebuilt.');
  };

  // ---- the money book (56-realm-inside) ---------------------------------------------------------------------------------
  const BOOK = {
    hold: 'What your farms, shops and boats brought in.',
    allow: 'Paid to you by your house or the crown, for being who you are.',
    keep: 'What your holdings cost to keep: roofs, tools, hands.',
    life: 'Bread, beds and show: your way of living.',
    kids: 'Children at home cost a share of your living each.',
    debt: 'What went to or came from the moneylenders when the year closed.',
    horse: 'A mount eats, unless your household keeps a stable.',
    retain: 'Household knights and men-at-arms, a squire, a household, by rank.',
    staff: 'A wage for each steward, castellan and factor.',
    tax: 'A hearth tax and a tallage on wages, at your realm\'s tax law.',
    landtax: 'A tenth of your rents and holdings, at your realm\'s tax law.',
    wage: 'Your pay for the year\'s work.', pay: 'Pay from the army, by rank.', rents: 'Rents from your lands.',
    crown: 'Your share of the crown\'s income.', company: 'Your share of the company\'s chest.', council: 'A councillor\'s stipend.',
    fines: 'Fines and bribes paid to the law.', gifts: 'Gifts and favours at court.', ransom: 'The price of your freedom after a lost battle.',
    rebuild: 'Rebuilding a holding burned in a raid.', ruin: 'A burned holding sold.',
  };
  const bookOf = which => { const p = pc(), P = p && p.riPurse; return P ? (which === 'last' ? P.last : P.cur) : null; };
  TT.bookParts = function (which) {
    const B = bookOf(which); if (!B) return null;
    const lines = Object.entries(B.lines || {}).filter(([, x]) => x && x[1]).sort((a, b) => b[1][1] - a[1][1]);
    return { y: B.y, parts: lines.map(([k, x]) => [L('purseLine', which + '|' + k, esc(x[0])), x[1]]), total: lines.reduce((a, [, x]) => a + x[1], 0) };
  };
  G.purseTotal = function (which) {
    const S = TT.bookParts(which); if (!S) return '';
    return H('All told', (S.total < 0 ? '−' : '+') + coin(Math.abs(S.total)), which === 'last' ? 'the year ' + esc(S.y) : 'since New Year ' + esc(S.y)) +
      TT.sumRows(S.parts, S.total, 'All told', v => esc(A.fmt(v))) + F('Trade, purchases and what scenes give or take are not in the book; your coin moves by those too.');
  };
  G.purseLine = function (arg) {
    const [which, k] = String(arg).split('|'), B = bookOf(which), x = B && B.lines && B.lines[k], p = pc(); if (!x || !p) return '';
    let more = '';
    if (k === 'life') { const ls = A.LIFESTYLE[p.lifestyle || A.lifestyleDefault(p)]; if (ls) more = R(L('lifestyle', '', esc(ls.name) + ' living') + ', a full year', coin(ls.cost), 'tt-sub') + (p.mil ? R('In the army: half', '', 'tt-sub') : ''); }
    if (k === 'hold' || k === 'keep') more = (p.assets || []).map(a => { const P = GD.PROPERTY[a.k]; return P ? R(L('prop', a.k, esc(a.name || P.name)), k === 'hold' ? '~' + coin(P.income || 0) : '−' + coin(P.upkeep), 'tt-sub') : ''; }).join('');
    if (k === 'horse' && A.RI && A.RI.horseKeep) more = R('A full year now', coin(A.RI.horseKeep(p)), 'tt-sub');
    if (k === 'retain' && A.RI && A.RI.retainers) more = R('A full year now', coin(A.RI.retainers(p)[0]), 'tt-sub');
    if (k === 'staff' && A.RI && A.RI.staffWages) more = R('25 + half their skill, each', coin(A.RI.staffWages(p)), 'tt-sub');
    if (k === 'debt' && p.debt) more = R(L('debt', '', 'Debt now'), coin(p.debt), 'tt-sub');
    return H(esc(x[0]), (x[1] < 0 ? '−' : '+') + coin(Math.abs(x[1])), which === 'last' ? esc(B.y) : 'this year') + D(esc(BOOK[k] || 'A line of the year\'s book.')) + more +
      F(`One line of ${L('purseTotal', which, 'the year\'s book')}.`);
  };
})();
