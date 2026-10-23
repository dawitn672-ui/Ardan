// Old age, part 6: late things. A late love, a late ambition, letters at sixty, the custom of the manor that only the
// oldest can swear to, the realm's young ruler, wisdom asked for and ignored, and your story told wrong: a deed of
// this life (pc.deeds) as 26-belief-truth's tale tells it, and as an enemy tells it.
(function () {
const OAl = {
  deed: (age, id) => (p, ctx) => { A.OA.pickDeed(p, ctx, age, id); },
  mate: (p, ctx, id) => {
    const want = p.sex === 'M' ? 'F' : 'M';
    const L = A.relsOf(p, ['acquaint', 'friend', 'bestfriend', 'inlaw']).map(x => x.p)
      .filter(t => t.alive && t.sex === want && !(t.spouse && A.P(t.spouse) && A.P(t.spouse).alive) && Math.abs(A.age(t) - A.age(p)) <= 12 && A.age(t) >= A.age(p) - 12);
    return A.OA.choose(p, ctx, L, id, 'oa', true);
  },
};
A.defEvents([
  { id: 'oa_late_love', title: 'Late in the year',
    cond: (p, C) => C.old(p) && !C.married(p) && !C.flag(p, 'oa_late_love'),
    w: 2, cool: 10,
    setup: (p, ctx) => {
      if (OAl.mate(p, ctx, 'oa_late_love')) return;
      // nobody you know: someone new at the feast
      ctx.oa = A.OA.hp(p.sex === 'M' ? ['Mabel', 'Agnes', 'Edith', 'Joan', 'Alys'] : ['Walter', 'Hugh', 'Simon', 'Roger', 'Osric'], 'n', p.id);
      ctx.oahe = p.sex === 'M' ? 'she' : 'he'; ctx.oahim = p.sex === 'M' ? 'her' : 'him'; ctx.oahis = p.sex === 'M' ? 'her' : 'his'; ctx.oaHe = p.sex === 'M' ? 'She' : 'He'; ctx.oaNew = '1';
    },
    text: p => `{oa} sits beside you at the harvest supper, as {oahe} has the last three years, and laughs at your jokes, which nobody has done for a long time. ${p.widowed ? 'You have been alone since the funeral.' : 'You have been alone most of your life.'} Your knees are bad and your teeth are worse. Your heart, it appears, is in working order.`,
    choices: [
      { t: 'Court {oahim}, properly, at your age', check: { s: 'persuasion', s2: 'ins', d: 40 },
        win: { r: '{oaHe} says yes to a walk, and then to another. The village is scandalised and delighted.', fx: { happy: 10, them: { op: 25 }, flag: 'oa_late_love', oa: { mark: 'late_love', later: ['oa_late_love_family', 1, 2] } } },
        lose: { r: '{oaHe} is kind about it. You both pretend it was a joke, and keep sitting together at suppers.', fx: { happy: -2, them: { op: 6 } } } },
      { t: 'Keep it friendship, and treasure it', r: 'You walk {oahim} home every feast day and no further. It is a great deal more than nothing.', fx: { happy: 4, need: { company: 8 }, them: { op: 10 } } },
      { t: 'Laugh it off; you are too old for this', r: 'You laugh, and sit somewhere else next year, and are sorry about it all winter.', fx: { wil: 1, happy: -4 } },
    ] },

  { id: 'oa_late_love_family', title: 'What the family says',
    trigger: true,
    cond: (p, C) => C.old(p) && C.flag(p, 'oa_late_love'),
    text: p => `${A.OA.kids(p).length ? 'Your children have held a council about {oa}, without you.' : 'Your cousins have held a council about {oa}, without you.'} The view is that {oahe} is after the house, that you are making a fool of yourself, and that at your age it is unseemly. They send the eldest to tell you.`,
    choices: [
      { t: 'Marry {oahim} anyway, at the church door', check: { s: 'wil', s2: 'persuasion', d: 45 },
        win: { r: 'A small wedding, with more of the village than of the family. The family comes round, mostly, by spring.', fx: { happy: 10, family: -1, honor: -1, need: { company: 10 } } },
        lose: { r: 'The priest will not do it without the family. You go on as you were, and the family sulks.', fx: { happy: -2, them: { op: 6 } } } },
      { t: 'Keep {oahim}, unmarried, and let them talk', r: '{oaHe} moves in with a chest and a hen. They talk. You find you have stopped caring what anyone says.', fx: { happy: 6, honor: -2, need: { company: 8 } } },
      { t: 'Give {oahim} up for the family\'s sake', r: 'You tell {oahim} at the stile. {oaHe} understands, which is worse. The family is relieved and very kind to you.', fx: { happy: -8, family: 1, wil: 1, unflag: 'oa_late_love' } },
    ] },

  { id: 'oa_late_letters', title: 'Letters at your age',
    cond: (p, C) => C.old(p) && !C.literate(p),
    w: 2, cool: 12,
    text: 'The priest\'s new clerk is teaching the village children their letters on a slate by the porch. You stand at the back, pretending to wait for someone. You have signed with a cross all your life. The clerk says he has taught old men before, and two of them learned.',
    choices: [
      { t: 'Sit with the children and learn', check: { s: 'int', s2: 'wil', d: 50 },
        win: { r: 'It takes two winters and a great deal of laughter at your expense. You read the inscription on your father\'s stone.', fx: { literate: true, int: 1, happy: 6 } },
        lose: { r: 'The letters will not stay still. You learn to write your name, and stop there, and that is something.', fx: { int: 0.5, happy: -2 } } },
      { t: 'Pay him to teach you alone, at night', r: 'Private lessons by rushlight, so nobody sees. You learn faster without the children, and much more slowly than they would.', fx: { coin: -8, literate: true, need: { rest: -4 } } },
      { t: 'You have managed this long without', r: 'You go home. The world has written about you all your life without asking. It can go on.', fx: { wil: 1, need: { rest: 4 } } },
    ] },

  { id: 'oa_late_sea', title: 'You have never seen the sea',
    cond: (p, C) => C.old(p) && !C.coast(p) && !C.ruler(p),
    w: 2, cool: 30, once: true,
    text: 'You have heard about the sea all your life from carters and soldiers, and you have never seen it. It is six days by cart. Your children say it is just a great deal of water. You have begun to think that if you do not go this year, you never will.',
    choices: [
      { t: 'Go, all six days of it', check: { s: 'sta', s2: 'wil', d: 50 },
        win: { r: 'You stand on the shingle with your boots wet. It is just a great deal of water. You weep anyway.', fx: { happy: 12, wil: 1, health: -3, coin: -6, flag: 'oa_saw_sea' } },
        lose: { r: 'You fall sick on the fourth day and come home in the back of the cart without seeing it.', fx: { health: -6, coin: -4, happy: -4 } } },
      { t: 'Ask a carter to bring you back a jar of it', r: 'He brings a jar of grey water and a shell. You taste it. It is salt, as promised.', fx: { coin: -1, happy: 3 } },
      { t: 'Let it stay a story', r: 'Some things are better heard of. You keep the sea in your head, where it is blue.', fx: { wil: 0.5, need: { rest: 4 } } },
    ] },

  { id: 'oa_late_moot', title: 'One more time at the moot',
    cond: (p, C) => C.old(p) && !C.ruler(p) && !C.noble(p),
    w: 2, cool: 10,
    text: 'The village is choosing who will speak for it at the lord\'s court this year, and the young men have the thing sewn up. Nobody has asked you. You know more about the common and the mill-dues than all of them together, and they know it, and that is why.',
    choices: [
      { t: 'Stand up and put your own name forward', check: { s: 'persuasion', s2: 'diplomacy', d: 50 },
        win: { r: 'The old vote as one and half the young follow. You speak for the village this year, slowly and well.', fx: { fame: 3, need: { purpose: 10 }, health: -1 } },
        lose: { r: 'A polite silence, and then a vote, and you lose it by a great many hands.', fx: { happy: -4, honor: 1 } } },
      { t: 'Back the least foolish of the young men', r: 'You make it plain who you favour. He wins, and comes to you for the facts before every court.', fx: { honor: 1, need: { purpose: 6 }, fame: 1 } },
      { t: 'Leave it to them', r: 'You leave it to them. They lose the mill-dues argument in the first hour. You knew they would.', fx: { wil: 1, happy: -1 } },
    ] },

  { id: 'oa_late_bounds', title: 'Where the old boundary ran',
    cond: (p, C) => C.old(p) && !C.ruler(p),
    w: 3, cool: 10,
    text: 'There is a quarrel between two manors over a strip of wood, and the court has sent for the oldest folk of the parish to swear where the boundary ran in their fathers\' time. You are the oldest. You remember the stones. You also remember which lord pays better.',
    choices: [
      { t: 'Swear to the stones as they were', r: 'You walk the court along the line, stone by stone, and swear. One lord thanks you, the other will not.', fx: { honor: 4, fame: 1, health: -1 } },
      { t: 'Swear for the lord who pays', check: { s: 'intrigue', s2: 'wil', d: 50 },
        win: { r: 'Your memory serves the better purse. A heavy purse comes after.', fx: { coin: 25, honor: -4 } },
        lose: { r: 'Another old woman remembers it the other way, and remembers your father moving a stone.', fx: { honor: -5, happy: -3 } } },
      { t: 'Say your memory is not what it was', r: 'They let you go, and swear someone younger, who is wrong.', fx: { wil: 0.5, happy: -1 } },
    ] },

  { id: 'oa_late_bounds_walk', title: 'Beating the bounds',
    cond: (p, C) => C.old(p) && !C.ruler(p),
    w: 2, cool: 8,
    setup: (p, ctx) => { ctx.oaSworn = p.flags.ev && p.flags.ev.oa_late_bounds != null ? '1' : ''; },
    text: p => `At the spring walk round the parish the children are bumped against each boundary stone so they will remember it when they are old. You walk at the front, because you know where the stones are. ${p.flags.ev && p.flags.ev.oa_late_bounds != null ? 'Since you swore to them before the court, they have been yours in a way.' : 'Some have sunk under the turf.'} The smallest child asks why it has to be her head.`,
    choices: [
      { t: 'Bump them properly, as you were bumped', r: 'Every stone, every child, every head. They howl and remember. You remember being bumped by a man dead fifty years.', fx: { honor: 1, happy: 2, need: { purpose: 6 } } },
      { t: 'Tell a story at each stone instead', check: { s: 'persuasion', s2: 'int', d: 45 },
        win: { r: 'A story at every stone: the drowned cow, the lord\'s bastard, the hanged man. They remember the stories better than bruises.', fx: { fame: 1, happy: 4 } },
        lose: { r: 'The stories wander. By the fourth stone the children have wandered too.', fx: { happy: -2 } } },
      { t: 'Find the sunken stones and dig them up', r: 'You dig with a stick and your bare hands. Three come up. Your back stays down a week.', fx: { health: -3, honor: 2, fame: 1 } },
    ] },

  { id: 'oa_late_new_way', title: 'The new way',
    cond: (p, C) => C.old(p) && (C.job(p) || C.poor(p)),
    w: 2, cool: 10,
    text: p => `The young have a new way of ${C_OA_WAY(p)}, from the next valley. It is faster and they say it is better. You have done it the old way for fifty years and you know where the new way will fail, which is in a bad year. They do not have bad years yet.`,
    choices: [
      { t: 'Try the new way yourself, honestly', check: { s: 'int', s2: 'ins', d: 45 },
        win: { r: 'It is better. You say so, which costs you a great deal, and earns you a great deal more.', fx: { int: 1, honor: 2, coin: 4 } },
        lose: { r: 'It fails in your hands exactly as you said it would. Nobody believes it was not on purpose.', fx: { happy: -3, coin: -3 } } },
      { t: 'Keep the old way and say why', r: 'You keep the old way, and write down why, and put it where they will find it after the bad year.', fx: { wil: 1, need: { purpose: 6 }, coin: -2 } },
      { t: 'Mock it loudly at market', r: 'You get a good laugh. They get a good harvest. You both remember it.', fx: { happy: 3, honor: -1 } },
    ] },

  { id: 'oa_late_young_ruler', title: 'A child on the throne',
    cond: (p, C) => C.old(p) && C.youngRuler(p) && !C.noble(p),
    w: 2, cool: 10,
    setup: (p, ctx) => { const r = A.realm(p.realm), ru = r && A.P(r.ruler); if (!ru) { ctx.skip = true; return; } ctx.oaKing = ru.given; ctx.oaKingAge = String(A.age(ru)); },
    text: 'The proclamation is read in the square: new taxes, in the name of {oaKing}, who is {oaKingAge}. The crier reads it in the voice of someone who did not write it. You have seen young rulers before. The ones who write the proclamations are never young.',
    choices: [
      { t: 'Say so, out loud, in the square', check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: 'The square laughs, and nods. Nobody reports an old fool. They repeat it at every hearth.', fx: { fame: 2, happy: 3 } },
        lose: { r: 'The crier takes your name. A bailiff comes to remind you of your duty, and of the stocks.', fx: { honor: -1, happy: -4, coin: -5 } } },
      { t: 'Pray for the young ruler', r: 'You pray for {oaKing}, who will need it, and for yourself, who will pay the tax.', fx: { piety: 2, wil: 0.5 } },
      { t: 'Hide a little coin from the tax', check: { s: 'stealth', s2: 'int', d: 45 },
        win: { r: 'A pot under the hearthstone, as your grandmother kept. The tax-farmer misses it.', fx: { coin: 6, honor: -1 } },
        lose: { r: 'The tax-farmer knows the old hiding places, because his grandmother kept one too.', fx: { coin: -8, honor: -2 } } },
    ] },

  { id: 'oa_late_young_ruler_court', title: 'The young ruler asks the old',
    cond: (p, C) => C.old(p) && C.youngRuler(p) && (C.noble(p) || C.office(p)),
    w: 3, cool: 8,
    setup: (p, ctx) => { const r = A.realm(p.realm), ru = r && A.P(r.ruler); if (!ru) { ctx.skip = true; return; } ctx.oaKing = ru.given; ctx.oaKingAge = String(A.age(ru)); ctx.pid = ru.id; },
    text: '{oaKing}, who is {oaKingAge} and has sat the throne for no time at all, has sent for the old lords one by one to ask what {oaKing}\'s grandparent would have done. The regents stand behind the chair. They did not want you asked.',
    choices: [
      { t: 'Tell the truth, regents or no', check: { s: 'diplomacy', s2: 'wil', d: 55 },
        win: { r: 'You tell it straight, and the young ruler listens, and the regents go grey. You have a friend on the throne.', fx: { them: { op: 20 }, fame: 2, favor: 2 } },
        lose: { r: 'The regents talk over you, and the young ruler does not stop them. You are not sent for again.', fx: { them: { op: -5 }, happy: -4 } } },
      { t: 'Say what the regents want said', r: 'You give the answer the regents nod at. They are pleased. The young ruler looks at you as if you had failed a test.', fx: { favor: 1, honor: -2, them: { op: -6 } } },
      { t: 'Say only: be patient, and outlive them', r: 'The young ruler laughs, the first time today. The regents do not.', fx: { them: { op: 12 }, wil: 1, honor: 1 } },
    ] },

  { id: 'oa_late_ballad', title: 'Your life, as they sing it',
    cond: (p, C) => C.old(p) && C.deeds(p, 8),
    w: 3, cool: 8,
    setup: OAl.deed(8, 'oa_late_ballad'),
    text: 'A ballad-singer at the fair has a new song, and you are in it, after a fashion. In {oaDeedYear} you {oaDeed}. In the song: "{oaTale}." The crowd loves it. Nobody in the crowd knows you are standing at the back.',
    choices: [
      { t: 'Correct him in front of the crowd', check: { s: 'persuasion', s2: 'ins', d: 50 },
        win: { r: 'You tell it plainly. The crowd likes your version better, and the singer adds a verse about an old man at the back.', fx: { fame: 2, honor: 2 } },
        lose: { r: 'The crowd shouts you down. They want the song. Truth is a poor tune.', fx: { happy: -3, fame: -1 } } },
      { t: 'Pay him to sing it right', r: 'He takes your coin and sings it right at the next fair. Then he goes back to the old version, which pays better.', fx: { coin: -6, honor: 1, happy: -1 } },
      { t: 'Enjoy it; you were never that brave', r: 'You hum along. By the end of the summer you half believe it yourself.', fx: { happy: 5, wil: -0.5, fame: 1 } },
    ] },

  { id: 'oa_late_ballad_child', title: 'The story comes back to you',
    cond: (p, C) => C.old(p) && C.deeds(p, 8) && C.grandkids(p),
    w: 2, cool: 10,
    setup: (p, ctx) => { if (!A.OA.pickDeed(p, ctx, 8, 'oa_late_ballad_child')) return; A.OA.choose(p, ctx, A.OA.grandkids(p).filter(g => A.age(g) >= 6), 'oa_late_ballad_child_g', 'oa', true); },
    text: '{oa} comes home from the other children breathless with a story about you: how in {oaDeedYear} you {oaDeed}. "{oaTale}," {oahe} says, eyes shining. Your grandchild has never been so proud of you. Almost none of it happened that way.',
    choices: [
      { t: 'Tell {oahim} what really happened', r: 'You tell it true: smaller, muddier, more frightening. {oaHe} is disappointed, and then, slowly, prouder.', fx: { honor: 2, them: { op: 8 }, wil: 1 } },
      { t: 'Let {oahim} keep the better story', r: 'You say nothing and let {oahim} keep it. One day {oahe} will tell it to {oahis} own, a little bigger.', fx: { happy: 4, them: { op: 10 }, honor: -1 } },
      { t: 'Make it even better', r: 'You add a horse and a storm. {oaHe} runs off to tell the others. You have become a legend at the dinner table.', fx: { happy: 5, fame: 1, honor: -2 } },
    ] },

  { id: 'oa_late_twisted', title: 'As {oa} tells it',
    cond: (p, C) => C.old(p) && C.deeds(p, 6) && C.peers(p, 1, ['enemy', 'rival']),
    w: 2, cool: 10,
    setup: (p, ctx) => { if (!A.OA.pickDeed(p, ctx, 6, 'oa_late_twisted')) return; A.OA.choose(p, ctx, A.OA.peers(p, ['enemy', 'rival']), 'oa_late_twisted_who', 'oa', true); },
    text: '{oa} has been telling the alehouse how it really was in {oaDeedYear}, when you {oaDeed}. In {oahis} telling someone else did the work and you took the credit, and the young have started to believe it. {oaHe} was not even there.',
    choices: [
      { t: 'Find a witness who was there', check: { s: 'persuasion', s2: 'int', d: 45 },
        win: { r: 'An old carter who saw it all tells the alehouse plainly. {oa} drinks somewhere else for a month.', fx: { fame: 1, honor: 2, them: { op: -6 } } },
        lose: { r: 'Every witness is dead or has forgotten. It is your word against a better storyteller.', fx: { honor: -1, happy: -3 } } },
      { t: 'Have it out with {oahim} face to face', r: 'You shout at each other across the bar, two old people, and the young laugh at both. Nobody believes either.', fx: { them: { op: -10 }, happy: 2 } },
      { t: 'Let {oahim} have it; you know what you did', r: 'You know. That will have to do. It is enough, most days.', fx: { wil: 1.5, fame: -1 } },
    ] },

  { id: 'oa_late_pension', title: 'Put out to grass',
    cond: (p, C) => C.old(p) && C.job(p) && !C.ownShop(p),
    w: 2, cool: 10,
    text: '{boss} has called you in, kindly, which is how you know. Your years of service are honoured, and there is a pension: a cottage, a little coin each quarter, a goose at midwinter. Your place will go to someone younger. Your place has been going to someone younger for a while.',
    choices: [
      { t: 'Take the pension with thanks', r: 'You take the cottage and the goose. The first month you do not know what to do with the mornings.', fx: { coinPct: 0.05, need: { rest: 10, purpose: -10 }, happy: -1 } },
      { t: 'Ask to stay on and train your replacement', check: { s: 'persuasion', s2: 'diplomacy', d: 45 },
        win: { r: 'A year more, at half wage, with a boy at your elbow. You make sure he is good.', fx: { rep: 3, need: { purpose: 8 }, coin: 4 } },
        lose: { r: 'There is no place for you. The pension is a little smaller for the asking.', fx: { coinPct: 0.02, happy: -4 } } },
      { t: 'Refuse it and work till you drop', r: 'You will not be put out to grass. You go on, slower, and the young work round you.', fx: { wil: 1.5, health: -2, need: { purpose: 6 } } },
    ] },

  { id: 'oa_late_council', title: 'The oldest voice at the table',
    cond: (p, C) => C.old(p) && (C.office(p) || C.noble(p)) && !C.ruler(p),
    w: 2, cool: 8,
    text: 'At council they have stopped arguing with you, which is worse than when they did. They let you speak, nod, and then decide whatever they had already decided over supper without you. Today the matter is a war, and you have seen how this one ends.',
    choices: [
      { t: 'Speak until they have to answer', check: { s: 'diplomacy', s2: 'wil', d: 55 },
        win: { r: 'You make them answer, point by point, and they cannot. The vote goes your way by one.', fx: { fame: 2, honor: 2, health: -1, favor: 1 } },
        lose: { r: 'They wait you out, politely, and vote as they meant to. You go home and sit in the dark.', fx: { happy: -4 } } },
      { t: 'Find the young one who listens, and work through them', r: 'There is one who listens. You feed them every argument. In five years they will run this table.', fx: { need: { purpose: 8 }, wil: 1 } },
      { t: 'Resign your seat', r: 'You stand, bow, and leave the seal on the table. They are relieved, and a little afraid.', fx: { honor: 1, need: { purpose: -8, rest: 6 } } },
    ] },

  { id: 'oa_late_well', title: 'Something that will outlast you',
    cond: (p, C) => C.old(p) && (C.rich(p) || p.coin >= 80) && !C.flag(p, 'oa_built'),
    w: 2, cool: 15,
    text: 'You have more coin than you will ever spend, and fewer years. The lane has no well of its own and carries water from the river. The bridge plank is rotten. The church porch leaks on the old women waiting out of the rain. Any of these would carry your name a while.',
    choices: [
      { t: 'Pay for a well with your name on the curb', r: 'A deep well, sweet water, your name cut in the curb. Women gossip there every day, about you among other things.', fx: { coinPct: -0.1, fame: 3, happy: 4, flag: 'oa_built' } },
      { t: 'Mend the porch, and ask for no name', r: 'The porch is roofed and benched. Nobody knows who paid, except the old women, who know everything.', fx: { coinPct: -0.06, piety: 3, honor: 2, flag: 'oa_built' } },
      { t: 'Keep it for the family', r: 'The family will need it more than the lane. The lane goes on carrying water.', fx: { family: 1, wil: 0.5 } },
    ] },

  { id: 'oa_late_ambition', title: 'Not done yet',
    cond: (p, C) => C.old(p) && C.fame(p) < 25 && !C.ruler(p),
    w: 2, cool: 10,
    text: 'You set yourself a goal years ago, and you have not reached it. You can count the years left on your fingers if you are honest, and you are not usually honest about it. The young think it is a little sad, an old one still reaching. You think it is the only reason to get up.',
    choices: [
      { t: 'Push for it now, as hard as you can', check: { s: 'wil', s2: 'int', d: 50 },
        win: { r: 'A hard year, and you close half the distance. It may be enough. It may not. You are alive in it.', fx: { need: { purpose: 12 }, wil: 1, fame: 1, health: -2 } },
        lose: { r: 'You push and something gives in your chest. The physician tells you to sit down.', fx: { health: -5, happy: -3 } } },
      { t: 'Hand the goal to someone younger', r: 'You tell a grandchild or a pupil what you wanted, and why. Now it is theirs to want.', fx: { need: { purpose: 4 }, happy: 2, honor: 1 } },
      { t: 'Let it go, and enjoy the evenings', r: 'You let it go. The evenings are long and gold and there is nothing you have to do in them.', fx: { happy: 4, need: { rest: 8, purpose: -6 } } },
    ] },
]);
// what the young are changing (pure, from the person's id)
function C_OA_WAY(p) { return A.OA.hp(['ploughing the long strip', 'setting the loom', 'salting the pork', 'keeping the bees', 'drying the hay', 'pricing the goods'], 'way', p.id); }
})();
