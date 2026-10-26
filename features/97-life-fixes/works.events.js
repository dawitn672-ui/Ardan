// 97-life-fixes: what the great works bring back, years later (e-works.core.js schedules one of each).
// Each reads its work's flag (lfx_almshouse, lfx_ship, lfx_company, lfx_charter, lfx_patent), so a fortune spent opens a
// story instead of only closing a purse.
(function () {
  const work = (p, k) => (Array.isArray(p.lfWorks) ? p.lfWorks.find(w => w && w.k === k && !w.gone) : null);
  const need = k => (p, ctx) => { const w = work(p, k); if (!w) { ctx.skip = 1; return; } if (w.name) ctx.ship = w.name; };
  A.defEvents([
    { id: 'lfx_wk_alms_winter', trigger: true, title: 'A hard winter at the almshouse',
      cond: (p, C) => C.adult(p) && C.flag(p, 'lfx_almshouse'), setup: need('almshouse'),
      text: 'The winter is the worst in twenty years. Your almshouse has twelve beds and forty people sleeping on its floor. The warden comes to you with his cap in his hands: wood, bread, and the door. Shut it, or open it wider.',
      choices: [
        { t: 'Pay for wood, bread and a second hall', r: 'Two thousand suns. Nobody in the almshouse dies that winter, and the town knows whose money it was.', fx: { coin: -2000, fame: 4, honor: 4, piety: 2 } },
        { t: 'Shame the guilds into paying their share', check: { s: 'persuasion', s2: 'wil', d: 46 },
          win: { r: 'The guildmasters pay rather than be named from the pulpit. Your almshouse has friends now.', fx: { fame: 2, honor: 2 } },
          lose: { r: 'They pay nothing, and say so loudly. The warden turns people away in the snow.', fx: { honor: -2, happy: -4 } } },
        { t: 'Keep the twelve beds and shut the door', r: 'The warden shuts it. In spring the sexton is busy.', fx: { happy: -6, honor: -3 } },
      ] },
    { id: 'lfx_wk_ship_storm', trigger: true, title: 'Weather for the {ship}',
      cond: (p, C) => C.adult(p) && C.flag(p, 'lfx_ship'), setup: need('ship'),
      text: 'Word comes up the river: the {ship} is in a foreign port with a sprung mast and a hold full of pepper, and her captain wants money for a refit. Or he can sell the pepper there, cheap, and come home lame.',
      choices: [
        { t: 'Send money for the refit, and wait for the price', check: { s: 'trade', s2: 'int', d: 42 },
          win: { r: 'Four thousand suns go south. The {ship} comes home sound in the autumn, and the pepper sells dear.', fx: { coin: 2500 } },
          lose: { r: 'The refit takes the summer. By the time she is home, every ship from the south has brought pepper.', fx: { coin: -2000 } } },
        { t: 'Sell the pepper there and limp home', r: 'Half a cargo\'s worth, and a ship that will need the yard.', fx: { coin: 800 } },
        { t: 'Go south yourself and see to it', check: { s: 'trade', s2: 'sea', d: 48 },
          win: { r: 'You find a better mast and a better buyer. The voyage pays three times over.', fx: { coin: 6000, fame: 2, health: -3 } },
          lose: { r: 'A month of foreign harbourmasters. You come home poorer, browner and no wiser.', fx: { coin: -1500, health: -5 } } },
      ] },
    { id: 'lfx_wk_company_war', trigger: true, title: 'A war wants your company',
      cond: (p, C) => C.adult(p) && C.flag(p, 'lfx_company'),
      setup: (p, ctx) => { need('company')(p, ctx); if (ctx.skip) return; const r = A.realm(p.realm); ctx.where = r ? r.short : 'the border'; },
      text: 'A captain rides in from {where} with a purse and a contract. A border lord will pay well for forty good men for a summer. Your sergeant says the men are getting fat. Your steward says the men are getting paid either way.',
      choices: [
        { t: 'Hire the company out for the summer', check: { s: 'command', s2: 'wil', d: 45 },
          win: { r: 'They come back in the autumn, fewer by three and richer by a great deal.', fx: { coin: 5000, fame: 4 } },
          lose: { r: 'They come back in the autumn, fewer by fifteen. The lord pays half and blames you.', fx: { coin: 1500, fame: -2, happy: -4 } } },
        { t: 'Keep them at home to guard the roads', r: 'The roads round your house are the safest in the realm, and the dullest.', fx: { honor: 2, happy: 1 } },
        { t: 'Lead them yourself', check: { s: 'tactics', s2: 'str', d: 50 },
          win: { r: 'A summer of marching and one bloody morning. They sing about it, and about you.', fx: { coin: 6000, fame: 8, health: -6 } },
          lose: { r: 'An ambush in a wood. You bring most of them home, and a wound.', fx: { coin: 1000, wound: 'scar_chest', health: -12 } } },
      ] },
    { id: 'lfx_wk_charter_council', trigger: true, title: 'The council of {home}',
      cond: (p, C) => C.adult(p) && C.flag(p, 'lfx_charter'), setup: need('charter'),
      text: 'The new council of {home} meets for the first time in the guildhall, and the first thing it does is quarrel. Weavers against fullers, the parish against the market. They have kept the chair at the head of the table for you.',
      choices: [
        { t: 'Take the chair and keep the peace', check: { s: 'diplomacy', s2: 'wil', d: 44 },
          win: { r: 'By midnight there are rules, a seal and a clerk. They will call it the old charter one day.', fx: { fame: 3, honor: 3, skill: { stewardship: 2 } } },
          lose: { r: 'By midnight there are two councils. The bishop has to be sent for.', fx: { fame: -1, happy: -3 } } },
        { t: 'Leave the chair empty: it is their town', r: 'They fight it out without you, and like you better for it.', fx: { honor: 2 } },
        { t: 'Name your own man to the chair', r: 'He keeps the peace and the tolls flow your way. Nobody loves either of you.', fx: { coin: 1500, honor: -3 } },
      ] },
    { id: 'lfx_wk_patent_snub', trigger: true, title: 'Old blood at the high table',
      cond: (p, C) => C.adult(p) && C.flag(p, 'lfx_patent'),
      setup: (p, ctx) => { if (!p.noble) ctx.skip = 1; },
      text: 'At the lord\'s feast you are seated below the salt, under your new arms, between a wool merchant and a priest. Across the hall an old knight remarks to the table that patents can be bought by the yard, these days, like cloth.',
      choices: [
        { t: 'Answer him across the hall', check: { s: 'persuasion', s2: 'wil', d: 46 },
          win: { r: '"And worn better," you say. The hall laughs with you. The knight does not.', fx: { fame: 3, honor: 2 } },
          lose: { r: 'Your answer comes out sharp and late. The hall laughs, but not with you.', fx: { fame: -2, happy: -4 } } },
        { t: 'Swallow it and stay where you are seated', r: 'You eat your supper. Your grandchildren will sit above the salt.', fx: { wil: 0.5, happy: -3 } },
        { t: 'Pay for the next feast yourself, and seat him low', r: 'Three thousand suns, and he sits by the door. He never forgives you, and never forgets.', fx: { coin: -3000, fame: 3, honor: -1 } },
      ] },
  ]);
})();
