// Old age, part 4: handing on. The sword over the hearth (it goes to the heir: fx.oa.hand), the tools, the shop, the
// holding, the name, the will (fx.oa.will, read again years later and on the death screen), the plot by the wall.
// Several read what the life left: 53-arcs-things' Kestrel and the bridge, the mill and the bell; 46-life-arcs'
// legacies (the holding bought from the widow, the house abroad, the shrine, the school); 49-body-mind's pupil and
// memoirs. Each sets an oa_ flag that later scenes and the epilogue read.
(function () {
const OAh = {
  heirTok: (p, ctx) => { const h = A.OA.heir(p) || A.OA.grandkids(p).find(g => A.isAdult(g)); if (h) { A.OA.put(p, ctx, h, 'oaH'); return h; } return null; },
};
A.defEvents([
  { id: 'oa_hand_sword', title: 'The blade over the hearth',
    cond: (p, C) => C.old(p) && C.gear(p, 'weapon') && !C.gear(p, 'weapon', 'dagger', 'knife', 'club', 'staff') && !C.flag(p, 'oa_handed'),
    w: 2, cool: 10,
    setup: (p, ctx) => {
      const g = GD.GEAR[p.gear.weapon]; ctx.oaWeap = (g ? g.name : 'blade').toLowerCase();
      if (!OAh.heirTok(p, ctx)) { const y = A.OA.young(p)[0]; if (y) A.OA.put(p, ctx, y, 'oaH'); else ctx.skip = true; }
    },
    text: 'Your {oaWeap} hangs over the hearth now, and it takes both hands to get it down. You oil it every month out of habit. {oaH} looks at it whenever {oaHhe} comes in, the way you once looked at your own father\'s. It is a question nobody has asked aloud.',
    choices: [
      { t: 'Give it to {oaH} now, while you can say why', r: 'You put it in {oaH}\'s hands and tell {oaHhim} what it cost and who it killed. {oaHHe} does not laugh.', fx: { honor: 2, happy: 3, flag: 'oa_handed', oa: { hand: 'weapon' } } },
      { t: 'Sell it, and leave coin instead', check: { s: 'trade', s2: 'ins', d: 45 },
        win: { r: 'A young knight pays well for a blade with a story. The coin goes in the chest for the family.', fx: { coin: 30, happy: -2, flag: 'oa_handed', oa: { hand: 'weapon' } } },
        lose: { r: 'The armourer offers scrap price and talks about the rust. You take it home again.', fx: { happy: -3 } } },
      { t: 'Keep it by the bed; you may need it yet', r: 'You hang it by the bed instead. It is not much use to an old arm, but nobody breaks into this house.', fx: { wil: 1, need: { comfort: 4 } } },
    ] },

  { id: 'oa_hand_kestrel', title: 'Who carries Kestrel',
    cond: (p, C) => C.old(p) && C.flag(p, 'ao_kestrel') && !C.flag(p, 'oa_kestrel_left'),
    w: 3, cool: 30, once: true,
    setup: (p, ctx) => { if (!OAh.heirTok(p, ctx)) { const y = A.OA.young(p)[0]; if (y) A.OA.put(p, ctx, y, 'oaH'); else ctx.skip = true; } },
    text: 'Kestrel hangs on the wall with its song, and you have outlived most of the people in the song. When you go, someone will carry it. The Marroks have never stopped thinking it is theirs. {oaH} has always assumed it will come to {oaHhim}. The monks think it is a lie with an edge.',
    choices: [
      { t: 'Kestrel to {oaH}, with the true story', r: 'You tell {oaH} the whole of it, the pawnshop and the ford. The song is better. The truth will keep the sword honest.', fx: { honor: 2, happy: 3, flag: 'oa_kestrel_left', oa: { mark: 'kestrel_heir' } } },
      { t: 'Send it back to the Marroks at last', r: 'The captain\'s great-grandchild weeps on the step. You have a friend in that house for as long as you have.', fx: { honor: 4, fame: 2, happy: -2, flag: 'oa_kestrel_left', oa: { mark: 'kestrel_home' } } },
      { t: 'Have it buried with you', r: 'It will lie with you under the stone. The song will have to manage without the steel.', fx: { piety: 1, fame: 1, wil: 1, flag: 'oa_kestrel_left', oa: { mark: 'kestrel_grave' } } },
    ] },

  { id: 'oa_hand_tools', title: 'The tools of the trade',
    cond: (p, C) => C.old(p) && (C.job(p) || C.prof(p, 'craft', 35) || C.prof(p, 'husbandry', 35)) && !C.flag(p, 'oa_tools'),
    w: 2, cool: 10,
    setup: (p, ctx) => {
      const pu = p.bmPupil && A.P(p.bmPupil.id);
      if (pu && pu.alive) A.OA.put(p, ctx, pu, 'oaH'); else if (!OAh.heirTok(p, ctx)) { const y = A.OA.young(p)[0]; if (y) A.OA.put(p, ctx, y, 'oaH'); else ctx.skip = true; }
    },
    text: p => 'Your tools hang on their pegs in the order you hung them forty years ago: worn to the shape of your hand, each with a nick you know. {oaH} could use them. {oaHHe} would hang them differently. You are not sure you can bear that, and you are not sure it matters.' + (p.flags.oa_shop_shared != null ? ' {oaH}\'s name is on the sign beside yours already.' : ''),
    choices: [
      { t: 'Give them to {oaH}, all of them, today', r: 'You take them off the pegs one by one and tell {oaHhim} the name of each. Then you sit in the empty shop.', fx: { honor: 2, happy: -2, need: { purpose: -6 }, flag: 'oa_tools', oa: { hand: 'tools' } } },
      { t: 'Give {oaHhim} one a year, with a lesson', r: 'One tool each spring feast, and a lesson with it. You have a reason to see the next spring feast, and the one after.', fx: { need: { purpose: 10 }, happy: 2, wil: 1, flag: 'oa_tools', oa: { hand: 'tools' } } },
      { t: 'Sell them to the guild for good coin', r: 'The guild pays well for good old steel. You count it and feel like a man who has sold his hands.', fx: { coin: 20, happy: -4 } },
    ] },

  { id: 'oa_hand_shop', title: 'Your name over the door',
    cond: (p, C) => C.old(p) && C.ownShop(p),
    w: 2, cool: 10,
    setup: (p, ctx) => { if (!OAh.heirTok(p, ctx)) ctx.oaH = 'your journeyman'; },
    text: 'The sign over the shop still has your name on it, repainted every spring. You are in the back more than the front now, and {oaH} is in the front more than the back. The customers have started asking for {oaH} by name.',
    choices: [
      { t: 'Put {oaH}\'s name on the sign beside yours', r: 'Two names, yours above. The painter charges for both. Trade does not fall off, which stings a little.', fx: { coin: -4, honor: 2, need: { purpose: -4 }, flag: 'oa_shop_shared' } },
      { t: 'Keep the counter, and the keys', r: 'You go back to the front every morning, and the customers go back to asking for you. It is tiring.', fx: { wil: 1, need: { rest: -5, purpose: 6 }, rep: 2 } },
      { t: 'Sell the shop and live on it', check: { s: 'trade', s2: 'int', d: 45 },
        win: { r: 'A rival guildsman pays the full worth to be rid of you. You have never been so rich or so idle.', fx: { coinPct: 0.2, happy: 2, need: { purpose: -10 } } },
        lose: { r: 'He offers half, and you are too proud to take half. The shop stays yours, and so does the doubt.', fx: { happy: -3 } } },
    ] },

  { id: 'oa_hand_holding', title: 'Whose ground it will be',
    cond: (p, C) => C.old(p) && (C.flag(p, 'la_hold_bought') || C.flag(p, 'la_hold_halves') || C.flag(p, 'ak_land_home') || C.flag(p, 'ao_map_field')),
    w: 3, cool: 30, once: true,
    setup: (p, ctx) => { if (!OAh.heirTok(p, ctx)) ctx.oaH = 'a cousin'; },
    text: p => `${p.flags.la_hold_bought != null ? `You bought this ground off the widow in ${p.flags.la_hold_bought}, coin by coin.` : p.flags.ao_map_field != null ? 'This field came to you out of a lead box and a court case.' : 'This ground is yours by a long, hard road.'} You know where it floods and where the stone is. {oaH} will have it, or someone will. The question is in what shape, and how many pieces.`,
    choices: [
      { t: 'All of it to {oaH}, kept whole', r: 'Whole ground feeds a family; halves feed two badly. The others will not thank you. The ground will.', fx: { honor: 1, family: 1, need: { purpose: 4 }, flag: 'oa_will', oa: { will: 'eldest' } } },
      { t: 'Split it fairly among all your blood', r: 'A strip each, measured with a rope. It is fair, and none of the strips is enough.', fx: { honor: 2, happy: 2, flag: 'oa_will', oa: { will: 'split' } } },
      { t: 'Sell it while it is worth something', check: { s: 'trade', s2: 'ins', d: 45 },
        win: { r: 'A neighbour pays more than it is worth to round off his own. The coin goes further than the ground would have.', fx: { coinPct: 0.15, happy: -2 } },
        lose: { r: 'He knows you are old and low-balls. You sell anyway, and regret it every time you pass.', fx: { coinPct: 0.05, happy: -5 } } },
    ] },

  { id: 'oa_hand_name', title: 'The name stops with you',
    cond: (p, C) => C.old(p) && !C.hasKids(p) && !C.flag(p, 'oa_name'),
    w: 2, cool: 15,
    setup: (p, ctx) => { const L = A.relsOf(p, ['sibling', 'cousin', 'nephew', 'friend', 'student']).map(x => x.p).filter(t => t.alive && A.isAdult(t) && A.age(t) < A.age(p) - 10); A.OA.choose(p, ctx, L, 'oa_hand_name', 'oa', true); },
    text: 'You have no child, and the name ends with you unless you give it somewhere. {oa}, your {oaw}, is young enough and decent enough. Among people like you, a name can be given before witnesses, with what goes with it. It is a strange thing to ask of anyone.',
    choices: [
      { t: 'Ask {oa} to take your name and your goods', check: { s: 'persuasion', s2: 'diplomacy', d: 45 },
        win: { r: '{oa} takes it before the priest and two witnesses, solemn as a wedding. The name goes on.', fx: { them: { op: 20 }, happy: 6, flag: 'oa_name' } },
        lose: { r: '{oa} is touched and refuses. {oaHis} own father would never forgive it.', fx: { them: { op: 6 }, happy: -3 } } },
      { t: 'Leave everything to the church instead', r: 'The priest will say your name every year on the day. It is a kind of child.', fx: { piety: 4, coinPct: -0.1, flag: 'oa_name', oa: { will: 'church' } } },
      { t: 'Let it end; names are for the living', r: 'You will be the last of it. You find you mind less than you thought.', fx: { wil: 1.5, happy: -1, flag: 'oa_name', oa: { will: 'none' } } },
    ] },

  { id: 'oa_hand_pupil', title: 'Better than you',
    cond: (p, C) => C.old(p) && C.pupil(p) && C.flag(p, 'bm_surpassed'),
    w: 3, cool: 30, once: true,
    setup: (p, ctx) => { const t = A.P(p.bmPupil.id); if (!t || !t.alive) { ctx.skip = true; return; } A.OA.put(p, ctx, t, 'oa', true); ctx.oaSkill = (GD.SKILLS[p.bmPupil.k] || 'the work').toLowerCase(); },
    text: 'Everyone says it now: {oa} is better at {oaSkill} than you ever were. They say it in front of you, which is new. {oaHe} still comes on feast days and asks what you would have done, and you can see that {oahe} already knows.',
    choices: [
      { t: 'Say so yourself, in public', r: 'You say it at the guild feast, loudly. {oa} goes red. People think better of you both.', fx: { fame: 2, honor: 2, them: { op: 15 }, happy: -1 } },
      { t: 'Find the one thing {oahe} still does wrong', check: { s: 'ins', s2: 'int', d: 50 },
        win: { r: 'There is one thing, and you show {oahim}. {oaHe} is grateful, and so are you, privately.', fx: { them: { op: 8 }, wil: 1, need: { purpose: 6 } } },
        lose: { r: 'There is nothing. You invent something. {oaHe} is too kind to say so.', fx: { them: { op: -4 }, happy: -3 } } },
      { t: 'Send your old clients to {oahim}', r: 'You send them all, with a word. Your door is quieter. {oaHis} is busier.', fx: { coin: -6, them: { op: 12 }, need: { purpose: -4 }, honor: 1 } },
    ] },

  { id: 'oa_hand_memoir', title: 'Someone has read your book',
    cond: (p, C) => C.old(p) && C.flag(p, 'bm_memoir'),
    w: 2, cool: 12,
    setup: (p, ctx) => { const L = A.OA.young(p).concat(A.OA.peers(p)); A.OA.choose(p, ctx, L, 'oa_hand_memoir', 'oa', true); },
    text: p => `{oa} has read your memoirs, the copy that goes round the lane, and has come to argue. ${p.flags.bm_memoir != null && A.S.year - p.flags.bm_memoir >= 3 ? 'It is years since you finished them.' : 'The ink is hardly dry.'} {oaHe} says you have it wrong about {oahis} family, and has brought a list.`,
    choices: [
      { t: 'Go through the list, honestly', check: { s: 'learning', s2: 'wil', d: 45 },
        win: { r: 'Half the list is right. You write the corrections in the margin, in your own hand. The book is better.', fx: { honor: 2, int: 0.5, them: { op: 10 } } },
        lose: { r: 'You argue every point and lose most of them. {oaHe} leaves with the book, triumphant.', fx: { them: { op: -6 }, happy: -3 } } },
      { t: 'Tell {oahim} to write {oahis} own', r: '{oaHe} says {oahe} will. {oaHe} will not, and the book stands.', fx: { wil: 1, them: { op: -4 }, happy: 1 } },
      { t: 'Burn the copy and keep the original', r: 'One less copy in the lane. You have the only true one now, under the bed, and nobody can argue with that.', fx: { happy: 2, fame: -1 } },
    ] },

  { id: 'oa_hand_secret_place', title: 'Where the trout lie',
    cond: (p, C) => C.old(p) && !C.ruler(p) && !C.flag(p, 'oa_told_secret'),
    w: 2, cool: 15,
    setup: (p, ctx) => {
      ctx.oaSecret = A.OA.hp(['where the trout lie under the alders when the river is low', 'where the wild bees nest in the old oak', 'the dye that sets blue without souring', 'which of the lord\'s fences has a loose rail', 'the cure for the cough that the healer does not know'], 'sec', p.id);
      if (!OAh.heirTok(p, ctx)) { const y = A.OA.young(p)[0]; if (y) A.OA.put(p, ctx, y, 'oaH'); else { ctx.oaH = 'a neighbour\'s child'; ctx.oaHhim = 'the child'; } }
    },
    text: 'You know {oaSecret}. Your grandmother told you, on condition that you tell no one, and you never have. It has been worth a good deal to you over the years. If you die without telling, nobody will ever know it again.',
    choices: [
      { t: 'Tell {oaH}, on the same condition', r: 'You walk {oaH} out there and show {oaHhim}, and make {oaHhim} swear. It feels like a wedding.', fx: { happy: 4, honor: 1, flag: 'oa_told_secret' } },
      { t: 'Tell the whole village at the harvest supper', r: 'Everyone knows by morning. For a season you are loved. After that it is just a thing everyone knows.', fx: { fame: 2, happy: 2, coin: -2, flag: 'oa_told_secret' } },
      { t: 'Take it with you', r: 'Some things are yours. You go there once more, alone, and keep it.', fx: { wil: 1.5, happy: 1 } },
    ] },

  { id: 'oa_hand_seal', title: 'The seal of the house',
    cond: (p, C) => C.old(p) && C.famHead(p) && C.heir(p) && !C.ruler(p),
    w: 2, cool: 12,
    setup: (p, ctx) => { OAh.heirTok(p, ctx) || (ctx.skip = true); },
    text: 'You are head of the house, and the seal is on your finger. {oaH} does the riding, the courts and the quarrels with neighbours, and comes home to ask your leave for what {oaHhe} has already done. The lords have begun to write to {oaHhim} directly.',
    choices: [
      { t: 'Give {oaH} the seal and the house, now', r: 'You take it off before the household. Your finger looks strange without it. {oaH} kneels, awkwardly.', fx: { honor: 2, family: 1, need: { purpose: -8 }, happy: -2, flag: 'oa_handed', oa: { hand: 'seal' } } },
      { t: 'Keep the seal, and let {oaHhim} do the riding', r: 'The seal stays on your hand. {oaH} rides out with your letters and your name. It works, mostly.', fx: { wil: 1, need: { purpose: 4 } } },
      { t: 'Call in the lords and show them who rules', check: { s: 'diplomacy', s2: 'wil', d: 50 },
        win: { r: 'You hold a court, and they bow to you first. {oaH} learns something watching it.', fx: { fame: 2, honor: 1, health: -1 } },
        lose: { r: 'Half of them send excuses. The other half look past you at {oaH}.', fx: { happy: -4, honor: -1 } } },
    ] },

  { id: 'oa_hand_will', title: 'The will',
    cond: (p, C) => C.old(p) && !C.flag(p, 'oa_will') && (C.hasKids(p) || C.rich(p) || p.coin >= 40),
    w: 3, cool: 8,
    text: p => 'The priest and a clerk sit at your table with ink and a sheet, and wait. You have put this off for ten years. Everyone you leave behind will read it, and remember you by it, and some of them will never forgive it. The clerk dips his pen.' + (p.flags.oa_contract != null ? ' The holding went to the heir by the contract; this is for the rest.' : ''),
    choices: [
      { t: 'All to the eldest, the old way', r: 'The house, the land and the chest to the eldest; to the rest, a blessing and a pot each. The clerk writes it without blinking.', fx: { family: 1, honor: 1, flag: 'oa_will', oa: { will: 'eldest', later: ['oa_hand_will_after', 3, 7] } } },
      { t: 'Equal parts, to the last spoon', r: 'You count the spoons. The clerk counts them again. Fair is a hard word to write down.', fx: { happy: 2, need: { purpose: 6 }, flag: 'oa_will', oa: { will: 'split', later: ['oa_hand_will_after', 3, 7] } } },
      { t: 'A third to the altar for your soul', r: 'The priest writes that part himself, in a beautiful hand. The family will feel it.', fx: { piety: 5, coinPct: -0.05, family: -1, flag: 'oa_will', oa: { will: 'church', later: ['oa_hand_will_after', 3, 7] } } },
      { t: 'Send them away; you are not dead yet', r: 'You send them off. The ink dries on the empty sheet. You will do it next year.', fx: { wil: 1, happy: 1 } },
    ] },

  { id: 'oa_hand_will_after', title: 'Someone has seen the will',
    trigger: true,
    cond: (p, C) => C.old(p) && C.flag(p, 'oa_will'),
    setup: (p, ctx) => { const L = A.OA.adultKids(p).concat(A.relsOf(p, ['sibling', 'nephew', 'cousin']).map(x => x.p).filter(t => t.alive)); A.OA.choose(p, ctx, L, 'oa_hand_will_after', 'oa', true); },
    text: p => `The clerk drinks, and talks. {oa} knows what the will says now, and has come to talk about it. ${p.oa && p.oa.will && p.oa.will.k === 'eldest' ? '{oaHe} is not the eldest.' : p.oa && p.oa.will && p.oa.will.k === 'church' ? '{oaHe} has heard what the altar gets.' : '{oaHe} has views on what equal means.'}`,
    choices: [
      { t: 'Change nothing, and say so', r: 'You tell {oahim} it is written and it stays written. {oaHe} leaves stiff-backed. The will stands.', fx: { wil: 1.5, them: { op: -10 } } },
      { t: 'Add something for {oahim}, quietly', r: 'A codicil: the good cloak and a field corner. {oaHe} is mollified. The others will find out.', fx: { coinPct: -0.03, them: { op: 12 }, honor: -1 } },
      { t: 'Have the clerk whipped for talking', check: { s: 'intimidation', s2: 'wil', d: 45 },
        win: { r: 'The clerk is dismissed, the priest apologises, and nobody discusses your will again in your hearing.', fx: { honor: 1, happy: 2 } },
        lose: { r: 'The clerk has friends. Now the whole parish discusses your will.', fx: { happy: -4, honor: -1 } } },
    ] },

  { id: 'oa_hand_bridge', title: 'What you built',
    cond: (p, C) => C.old(p) && (C.flag(p, 'ao_bridge_name') || C.flag(p, 'ao_bridge_free') || C.flag(p, 'ao_bell_name') || C.flag(p, 'ao_bell_mother') || C.flag(p, 'ao_mill_justice')),
    w: 2, cool: 20,
    text: p => `${p.flags.ao_bridge_name != null || p.flags.ao_bridge_free != null ? 'The bridge has stood through every flood since you fought for it, and carters cross it without a thought.' : p.flags.ao_bell_name != null || p.flags.ao_bell_mother != null ? 'The bell you saw cast rings for every wedding and every burial, and nobody alive remembers the old cracked one.' : 'The mill grinds honest grain, and the children no longer believe in its ghost.'} A boy asks you who made it. He is surprised it was anyone.`,
    choices: [
      { t: 'Tell him the whole story, fights and all', r: 'He listens to the end. He will be the one who tells it, after.', fx: { fame: 1, happy: 3, need: { company: 4 } } },
      { t: 'Say it was always there', r: 'He nods; of course it was. Things that work become weather. You find that you like that.', fx: { wil: 1.5, happy: 1 } },
      { t: 'Pay a mason to cut the date in it', r: 'A year and a line, cut deep. In a hundred years someone will wonder who you were.', fx: { coin: -10, fame: 2 } },
    ] },

  { id: 'oa_hand_house_abroad', title: 'The house you built abroad',
    cond: (p, C) => C.old(p) && (C.flag(p, 'la_house_charter') || C.flag(p, 'la_house_factor') || C.flag(p, 'la_house_cousin') || C.flag(p, 'la_house_self') || C.flag(p, 'la_house_partner')),
    w: 2, cool: 20,
    text: 'A letter from the foreign port, in a hand you do not know. The house you set up there trades under your name still, though nobody in it has seen your face. They want to know whether to keep the name when you are gone, or put their own on the door.',
    choices: [
      { t: 'Keep the name; it is worth money', r: 'Your name opens doors in a port you will never see again. They will keep it as long as it pays.', fx: { fame: 1, coin: 5, wil: 1 } },
      { t: 'Let them take their own name', r: 'You write back that it is theirs now. It is a generous letter. It costs you more than it says.', fx: { honor: 3, happy: -2 } },
      { t: 'Make one last voyage to see it', check: { s: 'sea', s2: 'sta', d: 50 },
        win: { r: 'You walk in at the door with your name over it. They do not know you, and then they do.', fx: { happy: 8, fame: 2, health: -3 } },
        lose: { r: 'The sea is rougher than you remember. You are carried ashore at the first port and go home by land.', fx: { health: -6, happy: -2 } } },
    ] },

  { id: 'oa_hand_shrine', title: 'The shrine, years on',
    cond: (p, C) => C.old(p) && (C.flag(p, 'la_shr_hosp') || C.flag(p, 'la_shr_pilg') || C.flag(p, 'la_shr_nun') || C.flag(p, 'la_shr_nephew') || C.flag(p, 'la_sch_all') || C.flag(p, 'la_sch_poor')),
    w: 2, cool: 20,
    text: p => `${p.flags.la_sch_all != null || p.flags.la_sch_poor != null ? 'The school you founded has a master you did not choose and boys you will never know.' : 'The shrine you founded has a keeper you did not choose and pilgrims you will never meet.'} You go to look at it, slowly, on a fine day. The keeper does not recognise you, and asks if you have come far.`,
    choices: [
      { t: 'Tell him who you are', r: 'He is mortified, and gives you the good chair, and asks for money for the roof.', fx: { coin: -5, fame: 1, happy: 3 } },
      { t: 'Say only that you have come far', r: 'He shows you round as he shows everyone. He gets your part of it wrong. It does not matter.', fx: { wil: 1.5, piety: 2 } },
      { t: 'Find something wrong and say so', check: { s: 'persuasion', s2: 'int', d: 45 },
        win: { r: 'He listens, and changes it. You walk home knowing it is still yours a little.', fx: { happy: 4, need: { purpose: 6 } } },
        lose: { r: 'He thanks you coldly and changes nothing. It is his now.', fx: { happy: -3 } } },
    ] },

  { id: 'oa_hand_last_task', title: 'One more thing to finish',
    cond: (p, C) => C.old(p) && (C.job(p) || C.flag(p, 'la_book_true') || C.flag(p, 'la_book_two') || C.flag(p, 'la_mon_done')),
    w: 2, cool: 12,
    text: 'There is one piece of work you have been carrying in your head for years: a thing you were going to make, or write, or mend, when there was time. There is time now, and less of it every season. Your hands are slower and your eyes worse, and you know exactly how it should go.',
    choices: [
      { t: 'Start it this week, however it turns out', check: { s: 'wil', s2: 'int', d: 45 },
        win: { r: 'It takes the winter. It is not as good as the one in your head. It is real, and it is done.', fx: { fame: 2, happy: 6, need: { purpose: 12, rest: -5 } } },
        lose: { r: 'You start it, and stall, and start again. It sits on the bench half-done, reproaching you.', fx: { happy: -3, need: { purpose: 4 } } } },
      { t: 'Describe it to someone younger to make', r: 'You describe it so well they make it better than you would have. You are pleased, and furious.', fx: { honor: 1, need: { company: 4 }, happy: 1 } },
      { t: 'Let it stay in your head, where it is perfect', r: 'It stays perfect. You take it out and look at it some nights, like a coin.', fx: { need: { rest: 6 }, wil: 0.5 } },
    ] },
]);
})();
