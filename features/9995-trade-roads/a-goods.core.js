// The living economy, part 1: the far lands' goods and the lore's monies (growth lane E, cycle 1).
//
// The lore's world turns on trade, but the goods table was the Known World's alone: no tea, jade, porcelain, paper
// or silver, and silk made wherever the forest was wet. On the Great Continent (99-far-lands installed) this adds the
// lore's goods and says where each is made (A.ECON.REGION, by the lore's region codes on each far province) and who
// wants it most (A.ECON.DEMAND_LAND, by land). Silk, spices, horses and furs, which the release had, are made where
// the lore makes them. A Known World game never sees the far goods: they are put into GD.GOODS when the far lands are
// installed and taken out when they are not, the way 99 installs its data.
//
// The monies: A.MONEY.of(rid) is a realm's coin from the lore's money table (the string, the ledger-weight, the
// half-note, the saddle bar, the ozani...). Suns stay the hidden unit; a coin is worth so many suns. Crossing from one
// money to another costs the money-changers' cut (A.MONEY.change), and Taulen pays a quarter of what it owes a seller
// in half-notes that pass at 60 in 100.
(function () {
  if (!A.ECON || !GD.GOODS) return;
  const E = A.ECON;
  const TR = A.TRADE = A.TRADE || {};

  // ---- the far goods (prices in suns a load, the Known World's scale: a load is what a mule carries)
  TR.GOODS = {
    tea: { name: 'Tea', base: 50, kw: /\btea\b/i },
    jade: { name: 'Jade', base: 350, kw: /\bjade\b/i },
    porcelain: { name: 'Porcelain', base: 160, kw: /porcelain|celadon/i },
    paper: { name: 'Paper', base: 40, kw: /\bpaper\b/i },
    silver: { name: 'Silver', base: 150, kw: /\bsilver\b/i },
  };
  // where the lore makes them (its regions' "Resources"), weight on top of the land's (A.ECON.LAND); and the old goods
  // where the lore says they come from
  TR.REGION = {
    tea: { 'R-09': 5, 'R-13': 4, 'R-06': 3, 'R-08': 2, 'M-05': 2, 'H-05': 0.5 },
    jade: { 'B-05': 5, 'H-06': 4, 'B-03': 2, 'M-05': 1, 'M-06': 1, 'T-07': 1 },
    porcelain: { 'R-08': 4, 'R-09': 3, 'R-10': 2, 'R-12': 1 },
    paper: { 'R-08': 3, 'R-12': 3, 'R-09': 2, 'R-06': 1 },
    silver: { 'R-09': 0.3, 'T-07': 0.5, 'F-11': 0.2 },
    silk: { 'R-08': 6, 'R-06': 3, 'R-09': 3, 'R-03': 1.5, 'I-01': 1, 'M-10': 1, 'B-05': 0.5, 'M-05': 0.5 },
    spices: { 'A-01': 4, 'A-07': 4, 'A-03': 3, 'A-04': 2, 'M-01': 2, 'M-12': 2, 'R-09': 0.5 },
    horses: { 'F-09': 5, 'F-05': 4, 'F-01': 3, 'F-12': 3, 'F-08': 2, 'R-02': 2, 'R-11': 2, 'T-10': 2, 'F-06': 1, 'B-01': 1, 'B-08': 1 },
    furs: { 'T-03': 4, 'T-11': 4, 'T-04': 3, 'T-05': 3, 'T-06': 3, 'T-08': 3, 'T-09': 3, 'T-10': 2, 'T-01': 2, 'T-12': 2, 'F-11': 2, 'F-05': 1 },
  };
  // the rich buy them (loads a month per 10,000 suns of a realm's income), and people drink tea
  TR.WEALTH = { tea: 0.004, jade: 0.0015, porcelain: 0.003, paper: 0.002, silver: 0.008 };
  TR.PEOPLE = { tea: 0.01, paper: 0.002 };
  // who wants them most, by land ('W' the Known World; the lore's lands by letter): the plateau and the grass drink tea,
  // the Twin Rivers hoard silver (it buys a third more at Venshai than at Ostra) and the west pays for silk and china
  TR.DEMAND_LAND = {
    tea: { W: 0.15, R: 2, H: 4, F: 2.5, B: 1.5, M: 1, A: 0.5, I: 1.5, T: 0.5, D: 0.1, N: 0.3 },
    silver: { W: 0.5, R: 4, H: 2, M: 2, B: 2, F: 1.5, A: 1, I: 1.5 },
    jade: { W: 0.3, R: 4, B: 1, H: 1, I: 1 },
    porcelain: { W: 1.5, R: 0.8, M: 1.5, A: 1.5, B: 1.2 },
    paper: { W: 0.4, R: 3, I: 2, B: 1 },
    silk: { W: 1.6, R: 0.5, B: 1.2, F: 1.2 },
  };
  // Velgrad's lore exports "silk re-sold from the east": it sells silk on, it does not make it
  TR.RESOLD = { silk: ['POL-25', 'POL-34'] };

  const added = [];
  TR.installGoods = function () {
    if (added.length) return;
    for (const k in TR.GOODS) if (!GD.GOODS[k]) { GD.GOODS[k] = TR.GOODS[k]; added.push(['g', k]); }
    for (const k in TR.REGION) if (!E.REGION[k]) { E.REGION[k] = TR.REGION[k]; added.push(['r', k]); }
    for (const k in TR.DEMAND_LAND) if (!E.DEMAND_LAND[k]) { E.DEMAND_LAND[k] = TR.DEMAND_LAND[k]; added.push(['d', k]); }
    for (const k in TR.RESOLD) if (!E.RESOLD[k]) { E.RESOLD[k] = TR.RESOLD[k]; added.push(['x', k]); }
    for (const k in TR.WEALTH) if (E.WEALTH[k] == null) { E.WEALTH[k] = TR.WEALTH[k]; added.push(['w', k]); }
    for (const k in TR.PEOPLE) if (E.PEOPLE[k] == null) { E.PEOPLE[k] = TR.PEOPLE[k]; added.push(['p', k]); }
    E._tc = null; E._roads = null;
  };
  TR.uninstallGoods = function () {
    const at = { g: GD.GOODS, r: E.REGION, d: E.DEMAND_LAND, x: E.RESOLD, w: E.WEALTH, p: E.PEOPLE };
    for (const [w, k] of added) delete at[w][k];
    added.length = 0;
    E._tc = null; E._roads = null;
  };
  TR.goodsOn = () => added.length > 0;
  const FL = A.FAR;
  if (FL && typeof FL.install === 'function') {
    const ins = FL.install, unins = FL.uninstall;
    FL.install = function () { const r = ins.apply(this, arguments); try { if (FL.active) TR.installGoods(); } catch (e) { console.error('trade goods', e); } return r; };
    FL.uninstall = function () { const r = unins.apply(this, arguments); try { TR.uninstallGoods(); } catch (e) { console.error('trade goods', e); } return r; };
    if (FL.active) TR.installGoods();
  }

  // ---- the monies (the lore's money table, MN-01 to MN-22). sun: suns a coin is worth; kind: what it is made of,
  // which sets the money-changers' cut. A realm not named takes its land's money; the Known World counts in suns.
  const M = A.MONEY = A.MONEY || {};
  M.COINS = {
    sun: { name: 'sun', pl: 'suns', sun: 1, kind: 'silver', d: 'the Known World\'s silver' },
    string: { name: 'string', pl: 'strings', sun: 2, kind: 'bronze', d: 'bronze chits strung by the thousand; a string weighs nearly four kilos' },
    note: { name: 'string', pl: 'strings', sun: 2, kind: 'note', d: 'bronze strings, and the half-notes of the Note Office, which pass at about 60 in 100' },
    chit: { name: 'banner chit', pl: 'banner chits', sun: 1.6, kind: 'bronze', d: 'iron and bronze chits; Hesh burned its paper in 1079' },
    bar: { name: 'saddle bar', pl: 'saddle bars', sun: 150, kind: 'silver', d: 'a silver bar stamped with the khagan\'s horse-brand' },
    ozani: { name: 'ozani', pl: 'ozani', sun: 2.8, kind: 'silver', d: 'the Garden Valleys\' coin, the most trusted silver between the Knot and Kraoth' },
    purse: { name: 'sealed purse', pl: 'sealed purses', sun: 280, kind: 'silver', d: 'a League purse of mixed silver, passed unopened for years' },
    suvarn: { name: 'suvarn', pl: 'suvarns', sun: 55, kind: 'gold', d: 'Vahra\'s gold coin; cowries in the markets' },
    stall: { name: 'stall-coin', pl: 'stall-coins', sun: 7, kind: 'silver', d: 'the Bought Riders\' monthly pay' },
    tin: { name: 'tin hat', pl: 'tin hats', sun: 0.5, kind: 'tin', d: 'tin cast as a hat or an animal; sura-gold for great sums' },
    temple: { name: 'temple measure', pl: 'temple measures', sun: 1, kind: 'goods', d: 'rice, cloth and gold leaf by weight; Pravith strikes no coin' },
    measure: { name: 'household measure', pl: 'household measures', sun: 9, kind: 'goods', d: 'a year\'s husked rice for one person' },
    sable: { name: 'sable', pl: 'sables', sun: 6, kind: 'goods', d: 'pelts by count and grade' },
    quill: { name: 'quill of gold', pl: 'quills of gold', sun: 30, kind: 'gold', d: 'gold dust in goose-quills of fixed size' },
    cross: { name: 'copper cross', pl: 'copper crosses', sun: 1, kind: 'goods', d: 'copper cast as a cross; bride-wealth across the Deep South' },
    cowrie: { name: 'string of cowries', pl: 'strings of cowries', sun: 0.1, kind: 'goods', d: 'shells from the island reefs, about 6,000 to the sun' },
    salt: { name: 'salt bar', pl: 'salt bars', sun: 1, kind: 'goods', d: 'salt cut in bars' },
    felt: { name: 'felt token', pl: 'felt tokens', sun: 4, kind: 'goods', d: 'stamped felt redeemable in sheep at the Wing-Khan\'s herds' },
    ruby: { name: 'ruby weight', pl: 'ruby weights', sun: 20, kind: 'goods', d: 'rough Knot rubies by weight' },
    jade: { name: 'jade piece', pl: 'jade pieces', sun: 25, kind: 'goods', d: 'a hand\'s-breadth jade disc' },
    cattle: { name: 'bull', pl: 'cattle', sun: 12, kind: 'goods', d: 'no herder sells a cow for coin if he can help it' },
  };
  M.REALM = {
    'POL-36': 'note', 'POL-37': 'chit', 'POL-58': 'bar', 'POL-70': 'ozani', 'POL-81': 'purse', 'POL-91': 'suvarn', 'POL-92': 'stall',
    'POL-110': 'tin', 'POL-98': 'temple', 'POL-136': 'measure', 'POL-142': 'quill', 'POL-147': 'quill', 'POL-148': 'cross',
    'POL-152': 'salt', 'POL-146': 'salt', 'POL-59': 'felt', 'POL-88': 'ruby', 'POL-77': 'jade', 'POL-149': 'cattle',
  };
  M.LAND = { R: 'string', F: 'bar', B: 'ozani', H: 'string', M: 'cowrie', A: 'tin', I: 'string', T: 'sable', N: 'sable', D: 'cowrie', W: 'sun' };
  // the money-changers' cut, by what the coin is made of (silver to silver is the cheapest; goods-money is barter)
  M.CUT = { silver: 0.02, gold: 0.03, bronze: 0.04, note: 0.04, tin: 0.04, goods: 0.06 };
  M.NOTE_SHARE = 0.25;   // Taulen pays a quarter of what it owes a seller in half-notes
  M.NOTE_RATE = 0.6;     // which pass at about 60 in 100 (1104)
  M.keyOf = function (rid) {
    const r = A.realm(rid); if (!r) return 'sun';
    const base = String(rid).match(/^POL-\d+/); const id = base ? base[0] : rid;
    return M.REALM[id] || M.LAND[r.land || 'W'] || 'sun';
  };
  M.of = rid => M.COINS[M.keyOf(rid)] || M.COINS.sun;
  // what changing a sum of suns' worth from realm a's money into realm b's costs, as a share (0 within one money)
  M.change = function (a, b) {
    const ka = M.keyOf(a), kb = M.keyOf(b); if (ka === kb) return 0;
    const ca = M.COINS[ka] || M.COINS.sun, cb = M.COINS[kb] || M.COINS.sun;
    return Math.max(M.CUT[ca.kind] || 0.03, M.CUT[cb.kind] || 0.03);
  };
  // what a seller loses to the half-notes in a realm that pays in them (Taulen)
  M.noteLoss = rid => (M.of(rid).kind === 'note' ? M.NOTE_SHARE * (1 - M.NOTE_RATE) : 0);
  // "120 strings (about 240 suns)": a sum of suns in a realm's coin (pure)
  M.fmt = function (suns, rid) {
    const c = M.of(rid), n = suns / c.sun;
    if (c === M.COINS.sun) return A.coin(suns);
    const v = n >= 100 ? A.fmt(Math.round(n)) : n >= 10 ? String(Math.round(n)) : String(Math.round(n * 10) / 10);
    return `${v} ${n === 1 ? c.name : c.pl} (about ${A.coin(suns)})`;
  };
})();
