// Old age, part 2: the last of your generation. The funerals you attend (the people this life actually knew, and
// the year they died), the friends who are left, and being the oldest who remembers: entries of 57-world-chronicle's
// record from 25 or more years ago, when you were young. A scene with nobody or nothing to cite backs out.
(function () {
const OAgen = {
  dead: (types, within, id) => (p, ctx) => { A.OA.choose(p, ctx, A.OA.dead(p, types, within), id); },
  peer: (types, id) => (p, ctx) => { A.OA.choose(p, ctx, A.OA.peers(p, types), id, 'oa', true); },
  entry: (kinds, years, id) => (p, ctx) => { A.OA.pickEntry(p, ctx, kinds, years, id); },
};
A.defEvents([
  { id: 'oa_gen_funeral', title: 'Another burial',
    cond: (p, C) => C.old(p) && C.mourns(p, 2, ['friend', 'bestfriend', 'sibling', 'acquaint', 'mentor', 'inlaw', 'lover']),
    w: 3, cool: 3,
    setup: OAgen.dead(['friend', 'bestfriend', 'sibling', 'acquaint', 'mentor', 'inlaw', 'lover'], 2, 'oa_gen_funeral'),
    text: 'They bury {oa}, your {oaw}, in the wet ground behind the church. You know the hymn without the book now; you have sung it often enough this year. The young ones at the graveside keep glancing at you, as if counting.',
    choices: [
      { t: 'Say a few words over the grave', check: { s: 'persuasion', s2: 'wil', d: 45 },
        win: { r: 'You tell one true story about {oa}, a small one. People laugh and then weep, which is right.', fx: { fame: 1, happy: 2, need: { company: 6 } } },
        lose: { r: 'Your voice goes halfway through. You stand there with your mouth open until the priest takes over.', fx: { happy: -4, need: { company: 4 } } } },
      { t: 'Pay for the funeral ale', r: 'You stand the whole wake. They drink to {oa} and then to you, which is a little hasty.', fx: { coinPct: -0.03, happy: 2, need: { company: 8 } } },
      { t: 'Stand at the back and leave before the end', r: 'You slip away before the earth goes in. You have heard that sound enough.', fx: { wil: 1, happy: -2, need: { rest: 4 } } },
    ] },

  { id: 'oa_gen_enemy_grave', title: 'You outlived {oa}',
    cond: (p, C) => C.old(p) && C.mourns(p, 3, ['enemy', 'rival']),
    w: 2, cool: 6,
    setup: OAgen.dead(['enemy', 'rival'], 3, 'oa_gen_enemy_grave'),
    text: '{oa} is dead, {oaago} gone, and you are not. You spent a good part of your life hating {oahim}, and the hate has nowhere to go now. It sits in you like a dog whose master has left.',
    choices: [
      { t: 'Visit the grave and say what you never said', r: 'You say it all to the turf. It answers nothing, and you walk home lighter, a little ashamed.', fx: { wil: 1, happy: 3, honor: -1 } },
      { t: 'Send something to the widow or the children', r: 'A cheese and a few coins, with no message. They know who it is from. Nobody knows what it means.', fx: { coin: -5, honor: 2, happy: -1 } },
      { t: 'Drink to having won', r: 'You drink to it alone at the window. It tastes thinner than you expected.', fx: { happy: 2, piety: -1, need: { company: -4 } } },
    ] },

  { id: 'oa_gen_count', title: 'Counting on your fingers',
    cond: (p, C) => C.old(p) && C.outlived(p, 4),
    w: 2, cool: 8,
    setup: (p, ctx) => {
      const d = A.OA.dead(p);
      if (d.length < 4) { ctx.skip = true; return; }
      A.OA.put(p, ctx, d[0], 'oa'); A.OA.put(p, ctx, d[1], 'oaB'); A.OA.put(p, ctx, d[2], 'oaC');
      ctx.oaN = A.OA.num(Math.min(12, d.length));
    },
    text: p => 'At prayers the priest reads the names of the year\'s dead, and you find you are counting on your fingers the ones you knew: {oa}, {oaB}, {oaC}, and more behind them, {oaN} in all. Your fingers are not enough. The pews in front of you have thinned.' + (p.flags.ev && p.flags.ev.oa_gen_funeral != null ? ' You stood at most of those graves.' : ''),
    choices: [
      { t: 'Pay for prayers for all of them', r: 'One service, all the names. The priest stumbles over them and you correct him from the pew.', fx: { coin: -10, piety: 3, happy: 1 } },
      { t: 'Cut their names on a board in the porch', check: { s: 'craft', s2: 'ins', d: 45 },
        win: { r: 'Plain letters on oak, one by one through the winter. People stop to read it on the way in.', fx: { fame: 1, wil: 1, need: { purpose: 8 } } },
        lose: { r: 'You spell two of them wrong and split the board on the third. It goes on the fire.', fx: { happy: -3, need: { purpose: 2 } } } },
      { t: 'Go and drink with the living', r: 'You find the ones still breathing at the alehouse and buy the round. There are not many.', fx: { coin: -3, happy: 4, need: { company: 8 } } },
    ] },

  { id: 'oa_gen_last_sibling', title: 'The last of your mother\'s children',
    cond: (p, C) => C.old(p) && C.outlived(p, 1, ['sibling']) && !C.peers(p, 1, ['sibling']),
    w: 2, cool: 30, once: true,
    setup: OAgen.dead(['sibling'], null, 'oa_gen_last_sibling'),
    text: 'With {oa} gone, you are the last of your mother\'s children. Nobody else alive remembers the old house, the dog that bit the priest, or what your father said the night of the flood. When you go, all of it goes.',
    choices: [
      { t: 'Tell it all to someone young before it goes', r: 'You tell a niece, a neighbour\'s child, anyone who sits still. Some of it will last a generation.', fx: { happy: 2, need: { company: 6, purpose: 6 } } },
      { t: 'Walk out to where the old house stood', r: 'Nettles and a hearthstone. You stand in the place where the door was and say their names.', fx: { piety: 2, wil: 1, happy: -2 } },
      { t: 'Keep it to yourself; it was yours', r: 'You keep it, the way you keep a coin in a sock. It is cold comfort, and comfort.', fx: { wil: 1, need: { company: -4 } } },
    ] },

  { id: 'oa_gen_oldest', title: 'You were there',
    cond: (p, C) => C.old(p) && C.remembers(p, 'battle,siege,fall,war,peace,ruler,revolt', 25),
    w: 3, cool: 6,
    setup: OAgen.entry('battle,siege,fall,war,peace,ruler,revolt', 25, 'oa_gen_oldest'),
    text: 'At the well a young man is telling a girl about {oaRef}, all of it wrong, the way a song tells it. You were {oaAge} that year. You remember the smell. He catches you listening and lowers his voice, as if you might take it away from him.',
    choices: [
      { t: 'Tell them how it really was', check: { s: 'persuasion', s2: 'int', d: 45 },
        win: { r: 'You tell it plainly: the waiting, the rumours, the wrong people dead. They listen to the end.', fx: { fame: 1, wil: 1, need: { company: 6 } } },
        lose: { r: 'They humour you, and as you leave you hear him start his version again, louder.', fx: { happy: -3, need: { company: 2 } } } },
      { t: 'Let him have his song', r: 'You fill your bucket and go. Songs outlast the people who were there; that is what they are for.', fx: { wil: 1, happy: -1 } },
      { t: 'Correct one detail, sharply, and walk off', r: 'You tell him he has the year wrong. He has not, as it happens, but he goes red anyway.', fx: { happy: 2, honor: -1 } },
    ] },

  { id: 'oa_gen_hunger_years', title: 'The hungry year',
    cond: (p, C) => C.old(p) && C.remembers(p, 'famine,plague', 20),
    w: 2, cool: 10,
    setup: OAgen.entry('famine,plague', 20, 'oa_gen_hunger_years'),
    text: 'The young are selling their seed corn to buy ribbons at the fair, because last year was good and the year before. You remember {oaRef}. You were {oaAge}. You remember what people ate at the end of it, and who stopped coming to church.',
    choices: [
      { t: 'Warn them, at length', check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: 'A few of them keep back a sack. Not many. Enough to say you were right, later.', fx: { fame: 1, honor: 1 } },
        lose: { r: 'They call you a crow. The ribbons are very fine.', fx: { happy: -3 } } },
      { t: 'Fill your own loft and say nothing', r: 'Barley, beans, dried apples, salted pork. Your loft smells of other people\'s ridicule. You sleep well.', fx: { coinPct: -0.04, need: { comfort: 8 }, wil: 1 } },
      { t: 'Buy a ribbon yourself', r: 'A blue one. You wear it to church and the young ones laugh, kindly. You have been hungry enough.', fx: { coin: -1, happy: 4 } },
    ] },

  { id: 'oa_gen_rulers', title: 'Under how many crowns',
    cond: (p, C) => C.old(p) && C.remembers(p, 'ruler,crown', 20),
    w: 2, cool: 12,
    setup: OAgen.entry('ruler,crown', 20, 'oa_gen_rulers'),
    text: 'The new coins have a new face on them. You keep a few of the old ones in a pot, from before {oaRef}, when you were {oaAge}. You have outlived crowns. A boy at market asks you who was ruling then, and you have to think.',
    choices: [
      { t: 'Show him the old coins and tell him', r: 'He turns them over and over. You give him one. He spends it the same afternoon.', fx: { coin: -1, happy: 2, need: { company: 4 } } },
      { t: 'Say they are all the same in the end', r: 'He nods solemnly. You believe it less than you said it, and more than you did at his age.', fx: { wil: 1, piety: -1 } },
      { t: 'Sell the old coins to a collector', check: { s: 'trade', s2: 'ins', d: 45 },
        win: { r: 'A clerk from the capital pays twice their weight for the face on them.', fx: { coin: 10, happy: 1 } },
        lose: { r: 'He pays their weight, and not a crumb more, and you feel you sold your youth by the ounce.', fx: { coin: 3, happy: -2 } } },
    ] },

  { id: 'oa_gen_bench', title: 'The bench by the door',
    cond: (p, C) => C.old(p) && C.mourns(p, 6, ['friend', 'bestfriend', 'spouse', 'sibling']),
    w: 2, cool: 8,
    setup: OAgen.dead(['friend', 'bestfriend', 'spouse', 'sibling'], 6, 'oa_gen_bench'),
    text: 'You sat on this bench with {oa} on summer evenings for longer than you can count, saying nothing much. {oaHe} has been gone {oaago}. The other end of the bench is still worn smooth where {oahe} sat. You have not sat in the middle since.',
    choices: [
      { t: 'Ask someone to sit with you in the evenings', r: 'A neighbour sits, and talks too much, and is not {oa}. You let {oahim} come again.', fx: { happy: 2, need: { company: 8 } } },
      { t: 'Keep the end free and sit alone', r: 'You sit at your end. The swifts come and go. It is a kind of conversation.', fx: { wil: 1, happy: -1, need: { rest: 4 } } },
      { t: 'Burn the bench and build a new one', r: 'A new bench, rough and unworn. It is a strange thing to do at your age. It helps.', fx: { coin: -3, happy: 3, need: { purpose: 6 } } },
    ] },

  { id: 'oa_gen_letter', title: 'A letter from the dead',
    cond: (p, C) => C.old(p) && C.mourns(p, 1, ['friend', 'bestfriend', 'sibling', 'lover', 'mentor']),
    w: 2, cool: 10,
    setup: OAgen.dead(['friend', 'bestfriend', 'sibling', 'lover', 'mentor'], 1, 'oa_gen_letter'),
    text: 'A carter brings a letter, much travelled, in {oa}\'s hand. {oaHe} wrote it before the end, and it has taken the long road to you. It asks how your knees are and says {oahe} will come at harvest. {oaHe} has been dead since spring.',
    choices: [
      { t: 'Write back anyway, and put it in the grave', r: 'You write a page about your knees and the harvest, and push it into the turf with your stick.', fx: { happy: 2, piety: 1, need: { purpose: 4 } } },
      { t: 'Read it again until you have it by heart', r: 'You read it every evening until it falls apart along the folds. By then you know it.', fx: { wil: 1, happy: -2 } },
      { t: 'Burn it at once', r: 'It goes up in a breath. You were never one for keeping things. Afterwards you wish you had.', fx: { wil: 0.5, happy: -3, need: { rest: 4 } } },
    ] },

  { id: 'oa_gen_widowed', title: 'The other side of the bed',
    cond: (p, C) => C.old(p) && C.widowed(p),
    w: 2, cool: 8,
    setup: OAgen.dead(['spouse'], null, 'oa_gen_widowed'),
    text: 'It is {oaago} since {oa} died, and you still sleep on your side of the bed, as if {oahe} might want the room. You still lay two spoons some mornings before you notice. The house is very orderly now. Nobody leaves boots by the fire.',
    choices: [
      { t: 'Give {oahis} things to the poor at last', r: 'The clothes, the boots, the good cloak. You keep one thing back and do not say which.', fx: { piety: 2, happy: -3, honor: 1 } },
      { t: 'Move into the middle of the bed', r: 'You sleep in the middle. It is enormous and cold for a month, and then it is yours.', fx: { happy: 2, need: { rest: 6 } } },
      { t: 'Talk to {oahim} in the evenings, as before', r: 'You tell {oahim} about the price of eggs and the neighbour\'s daughter. The neighbours hear and say nothing.', fx: { happy: 3, honor: -1, need: { company: 4 } } },
    ] },

  { id: 'oa_gen_old_friend', title: '{oa} walks over',
    cond: (p, C) => C.old(p) && C.peers(p, 1, ['friend', 'bestfriend']),
    w: 3, cool: 6,
    setup: OAgen.peer(['friend', 'bestfriend'], 'oa_gen_old_friend'),
    text: '{oa} comes up the lane with a stick in one hand and a jug in the other, the way {oahe} has for years, slower each time. {oaHe} sits down heavily and says the climb gets steeper. You have known {oahim} longer than anyone alive.',
    choices: [
      { t: 'Talk about the old days until dark', r: 'The same stories, told the same way, which is the point. {oaHe} laughs at the same places.', fx: { them: { op: 10 }, happy: 4, need: { company: 8 } } },
      { t: 'Settle between you who goes first and who speaks', r: 'Practical things. Who gets the chest. Who carries whom. You shake on it like a horse sale.', fx: { them: { op: 6 }, wil: 1, piety: 1, need: { purpose: 4 } } },
      { t: 'Talk {oahim} into one last journey together', check: { s: 'persuasion', s2: 'sta', d: 45 },
        win: { r: 'Three days to the shrine and three back, with a cart and a boy. You talk the whole way.', fx: { them: { op: 14 }, happy: 8, health: -2 } },
        lose: { r: 'You get as far as the ford before {oa}\'s back gives out. You turn round, laughing at yourselves.', fx: { them: { op: 6 }, happy: 2, health: -1 } } },
    ] },

  { id: 'oa_gen_friend_failing', title: '{oa} will not see spring',
    cond: (p, C) => C.old(p) && C.peers(p, 1, ['friend', 'bestfriend', 'sibling', 'mentor']),
    w: 2, cool: 8,
    setup: (p, ctx) => {
      const L = A.OA.peers(p, ['friend', 'bestfriend', 'sibling', 'mentor']).filter(t => A.age(t) >= A.age(p) - 3);
      A.OA.choose(p, ctx, L, 'oa_gen_friend_failing', 'oa', true);
    },
    text: 'Word comes that {oa}, your {oaw}, has taken to {oahis} bed, and the family has sent for the priest. They say {oahe} asked for you by name, twice. It is a day\'s walk in the cold, and you are not the walker you were.',
    choices: [
      { t: 'Go, whatever it costs your legs', check: { s: 'sta', s2: 'wil', d: 45 },
        win: { r: 'You sit by the bed through a long night. {oaHe} knows you. Towards dawn {oahe} rallies and asks for soup.', fx: { them: { op: 15 }, happy: 4, health: -2 } },
        lose: { r: 'You arrive half-dead yourself and spend two days in the next bed. You talk across the gap.', fx: { them: { op: 12 }, health: -5 } } },
      { t: 'Send a grandchild with a letter and a blanket', r: 'The child comes back and says {oa} held the letter all evening. You do not ask anything else.', fx: { them: { op: 6 }, happy: -1, coin: -2 } },
      { t: 'Stay home and light a candle', r: 'A candle in the window all night. It is what you can do. It is not much.', fx: { piety: 2, happy: -3, them: { op: -2 } } },
    ] },

  { id: 'oa_gen_bearers', title: 'Who will carry you',
    cond: (p, C) => C.old(p) && C.outlived(p, 3),
    w: 1, cool: 15, once: true,
    text: p => 'Coming back from another burial it strikes you that the men who would have carried your coffin are mostly in the ground ahead of you. You run through who is left. It is a short list, and half of them would drop you.' + (p.flags.oa_grave != null ? ' You have your place by the east wall. Getting there is the trouble.' : ''),
    choices: [
      { t: 'Pay the guild to bury you properly', r: 'The fee is paid, the bearers named, the ale ordered. You feel absurdly pleased, like a man who has booked a good room.', fx: { coinPct: -0.03, happy: 3, need: { comfort: 4 } } },
      { t: 'Ask four young men, and feed them well', r: 'They agree with their mouths full. You make them practise with a sack of flour, to their great amusement.', fx: { coin: -4, happy: 2, need: { company: 6 } } },
      { t: 'Decide your enemies can carry you, and enjoy it', r: 'You write it down and tell no one. It will be the best joke you ever made.', fx: { happy: 4, honor: -1 } },
    ] },

  { id: 'oa_gen_master_tools', title: 'Your old master\'s things',
    cond: (p, C) => C.old(p) && C.mourns(p, 4, ['mentor', 'superior', 'lord']),
    w: 1, cool: 12,
    setup: OAgen.dead(['mentor', 'superior', 'lord'], 4, 'oa_gen_master_tools'),
    text: '{oa}, who taught you or gave you orders for half your life, has been dead {oaago}, and the heirs are selling the house. A table in the yard holds what is left: a cup, a belt, a box of papers. Nobody else in the crowd knew {oahim} young.',
    choices: [
      { t: 'Buy the cup', r: 'Two coppers. You drink from it every evening and find yourself giving orders in {oa}\'s voice.', fx: { coin: -2, happy: 2 } },
      { t: 'Buy the box of papers, unread', check: { s: 'learning', s2: 'int', d: 45 },
        win: { r: 'Accounts, letters, a confession nobody heard. You understand {oa} better at last, and like {oahim} more.', fx: { coin: -5, int: 1, wil: 1 } },
        lose: { r: 'Bills and receipts. You use them to light the fire, one a night, all winter.', fx: { coin: -5, need: { comfort: 4 } } } },
      { t: 'Walk past the table', r: 'You walk past. What you had from {oahim} is not on any table.', fx: { wil: 1, happy: -1 } },
    ] },

  { id: 'oa_gen_annals', title: 'The monk with the book',
    cond: (p, C) => C.old(p) && C.remembers(p, 'battle,siege,fall,famine,plague,ruler,revolt,war', 25),
    w: 2, cool: 12,
    setup: OAgen.entry('battle,siege,fall,famine,plague,ruler,revolt,war', 25, 'oa_gen_annals'),
    text: 'A monk is going from house to house with a wax tablet, asking the oldest people what they remember of {oaRef}. The abbey is writing its annals, and the old annals burned. You were {oaAge}. What you tell him will be what happened.',
    choices: [
      { t: 'Tell it straight, even the parts nobody likes', r: 'He writes it all down, frowning at the parts about the abbey. You make him read it back.', fx: { honor: 2, int: 0.5, need: { purpose: 6 } } },
      { t: 'Give yourself a better part in it', check: { s: 'intrigue', s2: 'int', d: 45 },
        win: { r: 'In the abbey\'s book you held a gate. In a hundred years it will be true.', fx: { fame: 3, honor: -2 } },
        lose: { r: 'Another old man down the lane remembers you differently, in detail. The monk crosses you out.', fx: { honor: -2, happy: -3 } } },
      { t: 'Say you remember nothing', r: 'He goes on to the next door. What happened will be what someone else remembers.', fx: { wil: 0.5, need: { rest: 4 } } },
    ] },

  { id: 'oa_gen_reunion', title: 'The men of the ford',
    cond: (p, C) => C.old(p) && (C.flag(p, 'la_cmd_held') || C.flag(p, 'la_cmd_broke') || C.flag(p, 'la_cmd_stayed')),
    w: 2, cool: 30, once: true,
    text: p => `Five old men come to your door on the day of the ford, as they do now every year, fewer each time. ${p.flags.la_cmd_held != null ? 'They call it your ford in the alehouse, and they mean it kindly.' : 'Nobody in the alehouse mentions the ford, and these five never stop.'} One of them has brought the company's rag of a banner.`,
    choices: [
      { t: 'Drink to the dead, by name', r: 'You know every name. They do not, any more, and you give them back.', fx: { happy: 4, fame: 1, coin: -3, need: { company: 8 } } },
      { t: 'Ask what they really thought of your orders', check: { s: 'command', s2: 'ins', d: 45 },
        win: { r: 'They tell you, kindly and brutally. You were right about the river, wrong about the horses.', fx: { wil: 1.5, skill: { command: 1 } } },
        lose: { r: 'Nobody will say. They have made up their minds what you were, and it is fixed.', fx: { happy: -2, wil: 0.5 } } },
      { t: 'Hang the banner in the church', r: 'The priest objects, and then accepts a donation. It hangs over the north door, fading.', fx: { coin: -6, piety: 1, fame: 1 } },
    ] },

  { id: 'oa_gen_dreams', title: 'The dead at the table',
    cond: (p, C) => C.old(p) && C.outlived(p, 3),
    w: 2, cool: 10,
    setup: OAgen.dead(null, null, 'oa_gen_dreams'),
    text: 'Most nights now the dead come to supper in your dreams. Last night it was {oa}, sitting where {oahe} always sat, asking for the salt. You woke with your hand out to pass it. The priest says the dead are restless when they are owed prayers.',
    choices: [
      { t: 'Pay for prayers for {oa}', r: 'Three services. {oa} stops coming to supper. You find you miss {oahim}.', fx: { coin: -6, piety: 2, happy: -1 } },
      { t: 'Ask the wise woman what the dead want', check: { s: 'faith', s2: 'ins', d: 45 },
        win: { r: 'Salt on the windowsill, she says, and a name said aloud at dusk. You do it. The dreams turn kind.', fx: { happy: 3, need: { rest: 6 } } },
        lose: { r: 'She wants a hen, and then another. The dreams go on, with poultry in them.', fx: { coin: -3, happy: -2 } } },
      { t: 'Set a place for them, and sleep easy', r: 'An empty bowl at the end of the table. The family thinks you have gone soft in the head. You sleep through.', fx: { need: { rest: 8 }, honor: -1 } },
    ] },

  { id: 'oa_gen_young_cemetery', title: 'Room in the churchyard',
    cond: (p, C) => C.old(p) && C.outlived(p, 2) && !C.flag(p, 'oa_grave'),
    w: 2, cool: 10,
    text: 'The sexton is pacing out the churchyard with a rod, because it is full. The new dead will go in the low field by the brook, where it floods. There are three good places left by the east wall, he says, looking at you with a professional eye. A plot is a fifth of a year\'s bread.',
    choices: [
      { t: 'Buy the place by the east wall', r: 'He knocks in a peg with your name chalked on it. You visit it on fine days and sit in the sun.', fx: { coinPct: -0.05, piety: 2, happy: 2, flag: 'oa_grave' } },
      { t: 'Buy it for an old friend who cannot', r: 'You pay for the place beside yours too. You will have someone to talk to.', fx: { coinPct: -0.08, honor: 3, piety: 1, flag: 'oa_grave' } },
      { t: 'The low field is good enough for anyone', r: 'You tell him the brook was good enough for your grandmother. He writes you down for the brook.', fx: { wil: 1, happy: -1 } },
    ] },
]);
})();
