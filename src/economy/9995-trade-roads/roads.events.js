// The road happens to a venture (9995-trade-roads, c-ventures.core.js). The month hook queues these when a venture
// reaches a hand and the road is unsafe or shut; each works on its venture through A.TRADE.vfx. They can also come
// unasked, rarely, to anyone with goods on the road.
(function () {
  const TR = () => A.TRADE;
  const fill = (p, ctx) => {
    const T = TR(); if (!T) { ctx.skip = 1; return null; }
    const vs = T.ventures(p), v = vs.find(x => x.id === ctx.vid) || vs[0];
    if (!v || !(v.n > 0)) { ctx.skip = 1; return null; }
    ctx.vid = v.id;
    const at = ctx.trAt || (v.leg > 0 ? v.legs[v.leg - 1] : v.f), next = ctx.trNext || v.legs[v.leg] || v.t;
    ctx.good = GD.GOODS[v.k] ? GD.GOODS[v.k].name.toLowerCase() : 'goods';
    ctx.loads = String(v.n);
    ctx.dest = A.realmShort(v.t);
    ctx.place = A.realmShort(at);
    ctx.next = A.realmShort(next);
    ctx.gate = ctx.trCk || `the road out of ${A.realmShort(at)}`;
    ctx.fee = A.coin(Math.max(10, Math.round((v.worth || 100) * 0.08)));
    ctx.bigFee = A.coin(Math.max(20, Math.round((v.worth || 100) * 0.15)));
    ctx.feeN = Math.max(10, Math.round((v.worth || 100) * 0.08));
    ctx.bigFeeN = Math.max(20, Math.round((v.worth || 100) * 0.15));
    return v;
  };
  const vfx = o => (p, ctx) => TR().vfx(p, ctx, typeof o === 'function' ? o(ctx) : o);
  const has = p => !!(A.TRADE && A.TRADE.hasVenture(p));

  A.defEvents([
    {
      id: 'tr_road_bandits', title: 'Riders on the road',
      cond: (p, C) => C.adult(p) && has(p), w: 0.01, cool: 2,
      setup: (p, ctx) => { fill(p, ctx); },
      text: 'A letter from the caravan master, a week late. Past {place} riders have been shadowing the string for three days, keeping to the ridges. Your {loads} loads of {good} for {dest} are near the back. He wants money for more spears, or leave to push on by night.',
      choices: [
        { t: 'Send the money for spears', r: 'The spears are bought at the next well. The riders count them from the ridge and go home.', fx: vfx(c => ({ coin: c.bigFeeN })) },
        { t: 'Tell him to push on by night', check: { s: 'tactics', s2: 'int', d: 45 },
          win: { r: 'They move without fires for four nights and come out ahead of the riders.', fx: vfx({ wait: 10 }) },
          lose: { r: 'In the dark a dozen mules go one way and the string another. Some of them were yours.', fx: vfx({ lose: 0.3, wait: 10 }) } },
        { t: 'Let him buy them off with a share', r: 'He pays them in your cloth and his. A fifth of your loads ride away on other men\'s horses.', fx: vfx({ lose: 0.2 }) },
      ],
    },
    {
      id: 'tr_road_toll', title: 'The toll-men want more',
      cond: (p, C) => C.adult(p) && has(p), w: 0.01, cool: 2,
      setup: (p, ctx) => { fill(p, ctx); },
      text: 'At {gate} the toll-men weigh your {good} twice and find it heavier the second time. The old rate, they say, was for last year. Your factor writes from {place} for orders. The string waits behind a rope.',
      choices: [
        { t: 'Pay what they ask', r: 'You pay. The rope comes down, and the clerk writes the new rate in his book for next year too.', fx: vfx(c => ({ coin: c.feeN })) },
        { t: 'Have the factor argue the tariff', check: { s: 'trade', s2: 'wil', d: 45 },
          win: { r: 'He shows them last year\'s seal and the rate written under it. They take the old toll with bad grace.', fx: vfx({ wait: 5 }) },
          lose: { r: 'They hold the string a month for the insult and take the new rate anyway.', fx: vfx(c => ({ coin: c.feeN, wait: 30 })) } },
        { t: 'Send it round by another strand', r: 'The string turns back. The other road is longer, drier and nobody\'s toll-house.', fx: vfx({ wait: 45 }) },
      ],
    },
    {
      id: 'tr_road_shut', title: 'The pass is shut',
      cond: (p, C) => C.adult(p) && has(p), w: 0.01, cool: 2,
      setup: (p, ctx) => { const v = fill(p, ctx); if (v && !ctx.trCk) ctx.gate = 'the pass'; },
      text: '{gate} is shut. Snow, or the season, or the monks who keep it; the letter does not say which. Your {loads} loads of {good} sit in a caravanserai at {place} with the rest of the string, eating fodder you pay for.',
      choices: [
        { t: 'Wait for the road to open', r: 'You wait. The fodder bill comes every month, and so does the same letter.', fx: vfx(c => ({ wait: 60, coin: Math.round(c.feeN / 2) })) },
        { t: 'Sell at {place} for what it fetches', r: 'The brokers at {place} know the pass is shut as well as you do. They pay accordingly.', fx: vfx({ sellHere: true }) },
      ],
    },
    {
      id: 'tr_road_war', title: 'War on the road',
      cond: (p, C) => C.adult(p) && has(p), w: 0.01, cool: 2,
      setup: (p, ctx) => { fill(p, ctx); },
      text: 'There is war between {place} and {next}, and the road between them is closed to anything that is not an army. Your factor has your {good} in a warehouse at {place}. Soldiers have been asking what is in the warehouses.',
      choices: [
        { t: 'Wait it out', r: 'You wait. The factor moves your bales twice, at night, and charges you for both.', fx: vfx(c => ({ wait: 90, coin: Math.round(c.feeN / 2) })) },
        { t: 'Sell to the brokers at {place}', r: 'You sell into a town full of men who have nothing else to buy with their pay. It is not the worst price.', fx: vfx({ sellHere: true }) },
        { t: 'Bribe a captain for a pass', check: { s: 'intrigue', s2: 'int', d: 50 },
          win: { r: 'The captain\'s seal gets the string through in a week. You do not ask whose loads he took instead.', fx: vfx(c => ({ coin: c.feeN })) },
          lose: { r: 'The captain takes the money, then a third of the bales as evidence of smuggling.', fx: vfx(c => ({ coin: c.feeN, lose: 0.33, wait: 60 })) } },
      ],
    },
    {
      id: 'tr_road_monsoon', title: 'The ship missed the turn',
      cond: (p, C) => C.adult(p) && has(p), w: 0.01, cool: 2,
      setup: (p, ctx) => { fill(p, ctx); },
      text: 'The ship carrying your {good} reached {place} a week after the wind turned. Nothing sails against it. The captain will wait for the other wind, half a year off, or sell the cargo where it lies and go home light.',
      choices: [
        { t: 'Wait for the other wind', r: 'Six months in a foreign port. The captain sends you the harbour dues and a list of what the crew drank.', fx: vfx(c => ({ wait: 150, coin: Math.round(c.feeN / 2) })) },
        { t: 'Sell at {place}', r: 'The port has seen a dozen captains with the same story this month. The price says so.', fx: vfx({ sellHere: true }) },
      ],
    },
    {
      id: 'tr_road_camp', title: 'A bad place to camp',
      cond: (p, C) => C.adult(p) && has(p), w: 0.01, cool: 2,
      setup: (p, ctx) => {
        const v = fill(p, ctx); if (!v) return;
        let site = 'an old well';
        try {
          const W = A.WILDS, r = A.realm(ctx.trAt || v.legs[Math.max(0, v.leg - 1)]), P = r && A.prov(r.capitalProv);
          const ss = W && P ? W.sites(P, p) : [];
          if (ss && ss.length && W.LINE[ss[0].kind]) site = W.LINE[ss[0].kind];
        } catch (e) { /* the scene keeps its well */ }
        ctx.site = site;
      },
      text: 'Out of {place} the string has to camp by {site}. The drivers will not. They say the dead walk there, or the water is bad, or both, and they sit down in the road with your {good} still on the mules.',
      choices: [
        { t: 'Pay for a priest and a double ration', r: 'A hedge-priest from the last village blesses the ground and the drivers eat. They sleep with their backs to it.', fx: vfx(c => ({ coin: Math.round(c.feeN / 2) })) },
        { t: 'Order them to camp anyway', check: { s: 'command', s2: 'wil', d: 45 },
          win: { r: 'Your factor sleeps nearest the place himself. In the morning everyone is there, and so are the bales.', fx: vfx({}) },
          lose: { r: 'By morning four drivers are gone, and the mules they led with them.', fx: vfx({ lose: 0.15 }) } },
        { t: 'Go the long way round', r: 'Two days round by the other side of the valley. The drivers sing.', fx: vfx({ wait: 15 }) },
      ],
    },
    {
      id: 'tr_nine_wells', title: 'A man from the League',
      cond: (p, C) => C.adult(p) && C.flag(p, 'tr_venture') && !C.flag(p, 'tr_nine_wells') && C.skill(p, 'trade') >= 30 && !!(A.TRADE && A.TRADE.on()), w: 0.3, cool: 8,
      setup: (p, ctx) => { const r = A.realm('POL-81'); if (!r || !r.alive) ctx.skip = 1; ctx.league = 'the League of the Nine Wells'; ctx.fee = A.coin(800); },
      text: 'A quiet man in good boots takes a cup at your table. He knows what you sent east last year and what it fetched. There is a way across the Swallowing Sand, he says, forty days shorter than either strand. {league} guides its own. Membership costs {fee}, and an oath never to speak of it.',
      choices: [
        { t: 'Pay and swear the oath', r: 'He takes the money, and your hand, and gives you a word to say to a well-keeper at Varinj. Your caravans will know the way.', fx: (p, ctx) => { p.coin = Math.max(0, p.coin - 800); p.flags = p.flags || {}; p.flags.tr_nine_wells = A.S.year; A.TRADE.graph().trips = null; return ''; } },
        { t: 'Ask what the oath costs if broken', r: 'He smiles and finishes his cup. "Nobody has asked that twice," he says, and leaves you the bill.', fx: { int: 1 } },
        { t: 'Tell him the sand cannot be crossed', r: '"Just so," he says, pleased, and pays for both cups.', fx: { happy: 1 } },
      ],
    },
  ]);
})();
