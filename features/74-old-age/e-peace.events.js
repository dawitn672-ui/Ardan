// Old age, part 5: settling scores and making peace, faith and the fear of death, and the deathbed. The grudges and
// debts are 55-bonds' weighed lines from eight or more years ago (fx.bonds settles or refreshes them); the wrongs are
// 67-memory-weave's record of what this life did. The deathbed is queued by the core when the engine's own death odds
// pass 12% a year; what you say there is on the death screen.
(function () {
const OAp = {
  grudge: id => (p, ctx) => { A.OA.pickBond(p, ctx, -1, 8, id); },
  debt: id => (p, ctx) => { A.OA.pickBond(p, ctx, 1, 10, id); },
  line: (kinds, age, id) => (p, ctx) => { A.OA.pickLine(p, ctx, kinds, age, id); },
};
A.defEvents([
  { id: 'oa_peace_grudge', title: 'Before one of you dies',
    cond: (p, C) => C.old(p) && C.grudge(p, 8),
    w: 3, cool: 5,
    setup: OAp.grudge('oa_peace_grudge'),
    text: 'You saw {oa} at market today, bent over a stick, older than you remembered. It is {oaBago} since {oaByear}, when {oaBdeed}. Neither of you has forgotten it. One of you will die first, and then it will be too late to say anything at all.',
    choices: [
      { t: 'Go to {oahis} door and make your peace', check: { s: 'diplomacy', s2: 'wil', d: 45 },
        win: { r: 'You stand at the door and say it badly. {oaHe} says it badly back. You drink, and it is over.', fx: { them: { op: 25 }, happy: 6, honor: 2, bonds: { settle: 0.2 }, flag: 'oa_peace', oa: { peace: true } } },
        lose: { r: '{oaHe} hears you out and shuts the door. You did what you could. It is not nothing.', fx: { them: { op: 6 }, wil: 1, bonds: { settle: 0.7 } } } },
      { t: 'Send a gift with no message', r: 'A ham, a jug, nothing written. {oaHe} keeps the ham and sends the jug back, which is a kind of answer.', fx: { coin: -6, them: { op: 10 }, bonds: { settle: 0.6 } } },
      { t: 'Let it stand; you were right', r: 'You were right then and you are right now. You will both go to the grave right.', fx: { wil: 1.5, them: { op: -4 }, bonds: { refresh: true } } },
    ] },

  { id: 'oa_peace_debt', title: 'An old kindness, repaid',
    cond: (p, C) => C.old(p) && C.debt(p, 10),
    w: 2, cool: 8,
    setup: OAp.debt('oa_peace_debt'),
    text: '{oa} has come with a sack of meal and a cart to mend your roof. {oaHe} has not forgotten {oaByear}, when {oaBdeed}. You had. {oaHe} says it has been on {oahis} mind for {oaBago}, and {oahe} wants it off before one of you goes.',
    choices: [
      { t: 'Let {oahim} mend the roof', r: 'The roof is mended, badly and lovingly. You both sit on it afterwards like boys.', fx: { them: { op: 10 }, need: { comfort: 8 }, happy: 3, bonds: { spend: true } } },
      { t: 'Wave it off; it was nothing', r: 'You tell {oahim} it was nothing. {oaHe} is hurt, and goes away still owing you, which {oahe} hates.', fx: { honor: 2, them: { op: -2 }, wil: 1 } },
      { t: 'Ask {oahim} for something bigger', check: { s: 'persuasion', s2: 'ins', d: 45 },
        win: { r: '{oaHe} will see your grandchild placed, or your grave tended, or both. It is a good bargain for old friends.', fx: { them: { op: 4 }, coin: 5, need: { purpose: 6 }, bonds: { spend: true } } },
        lose: { r: 'It was too much. {oaHe} goes away smaller than {oahe} came.', fx: { them: { op: -8 }, happy: -2 } } },
    ] },

  { id: 'oa_peace_confess', title: 'What only you remember',
    cond: (p, C) => C.old(p) && C.oldLine(p, 'wrong,shame', 15),
    w: 3, cool: 6,
    setup: OAp.line('wrong,shame', 15, 'oa_peace_confess'),
    text: 'It comes back at night: the year {oaMyear}, when {oaMdeed}. It was {oaMago} ago. Anyone who might have held it against you has forgotten, or died, or never knew. Only you are left to carry it, and you are getting tired.',
    choices: [
      { t: 'Tell the priest, all of it', r: 'He listens with his eyes closed and gives you a penance that seems small. You do it anyway, and twice.', fx: { piety: 4, happy: 3, need: { rest: 4 } } },
      { t: 'Put it right, as far as it can be', check: { s: 'wil', s2: 'persuasion', d: 50 },
        win: { r: 'You find who it touched, or their children, and make what amends coin and words can make.', fx: { honor: 4, coinPct: -0.04, happy: 5 } },
        lose: { r: 'Nobody wants to hear it now. They look at you as if you were wandering in your wits.', fx: { honor: 1, happy: -3 } } },
      { t: 'Keep carrying it', r: 'You carry it, the way you carry the bad knee. It is part of how you walk.', fx: { wil: 1.5, happy: -2 } },
    ] },

  { id: 'oa_peace_killed', title: 'The face you took',
    cond: (p, C) => C.old(p) && C.oldLine(p, 'kill', 10),
    w: 2, cool: 10,
    setup: OAp.line('kill', 10, 'oa_peace_killed'),
    text: 'In {oaMyear} {oaMdeed}, and someone died of it. You have told yourself the reasons for {oaMago}. They are good reasons. They have worn thin with handling, and lately the face comes to you before sleep.',
    choices: [
      { t: 'Pay for prayers for the soul you sent on', r: 'Prayers said every year for ten years, paid in advance. The priest does not ask whose. You do not say.', fx: { coin: -12, piety: 4, happy: 2 } },
      { t: 'Seek out the kin and pay the blood-price', check: { s: 'diplomacy', s2: 'wil', d: 55 },
        win: { r: 'An old woman takes the purse and spits, and then, unexpectedly, takes your hand.', fx: { coinPct: -0.06, honor: 4, happy: 4 } },
        lose: { r: 'They take the purse and curse you on the step. It was owed, all of it.', fx: { coinPct: -0.06, happy: -3, honor: 1 } } },
      { t: 'You would do it again', r: 'You would. You tell the face so, at night, and it goes away for a while.', fx: { wil: 2, piety: -1, happy: -1 } },
    ] },

  { id: 'oa_peace_old_enemies', title: 'The last two who hate each other',
    cond: (p, C) => C.old(p) && C.peers(p, 1, ['enemy', 'rival']),
    w: 2, cool: 6,
    setup: (p, ctx) => { A.OA.choose(p, ctx, A.OA.peers(p, ['enemy', 'rival']), 'oa_peace_old_enemies', 'oa', true); },
    text: p => 'You and {oa} are the last two in the parish who remember why you hate each other. The young think it is funny: two old crows glaring across the church. {oaHe} has taken to sitting on your side, to annoy you. It is working.' + (p.flags.oa_peace != null ? ' You have made one peace already, and it did not kill you.' : ''),
    choices: [
      { t: 'Sit next to {oahim} on purpose', r: 'Shoulder to shoulder through the whole sermon, neither giving an inch. Afterwards, somehow, you are walking home together.', fx: { them: { op: 12 }, happy: 3, need: { company: 6 } } },
      { t: 'Keep the feud going; it keeps you young', r: 'You move your seat to glare better. It is the liveliest part of your week, and {oahis}.', fx: { them: { op: -6 }, happy: 3, wil: 1 } },
      { t: 'Ask the priest to make peace between you', check: { s: 'faith', s2: 'diplomacy', d: 45 },
        win: { r: 'The priest makes you shake hands before the altar. You both mean about half of it. It is a start.', fx: { them: { op: 15 }, piety: 2, flag: 'oa_peace', oa: { peace: true } } },
        lose: { r: 'The priest tries, and {oa} storms out, and blames you, and the parish takes sides.', fx: { them: { op: -10 }, happy: -2 } } },
    ] },

  { id: 'oa_peace_feud', title: 'The feud, at the end',
    cond: (p, C) => C.old(p) && (C.flag(p, 'ak_feud_open') || C.flag(p, 'ak_feud_mill') || C.flag(p, 'ar_house_feud') || C.flag(p, 'hs_feud')),
    w: 3, cool: 20, once: true,
    text: 'The feud with the other house has outlasted the men who began it. Your grandchildren cross the street to avoid theirs and do not know why. You know why. You are almost the only one who does, and the reason, said aloud now, sounds very small.',
    choices: [
      { t: 'Go to their head and end it', check: { s: 'diplomacy', s2: 'wil', d: 50 },
        win: { r: 'Two old men at a table, and a jug, and a priest as witness. The children will marry across it in ten years.', fx: { honor: 4, fame: 2, happy: 5, flag: 'oa_feud_ended' } },
        lose: { r: 'Their head is younger and was not there. He does not see why he should give up a good grudge.', fx: { happy: -3, honor: 1 } } },
      { t: 'Tell the young the real reason, so they can judge', r: 'You tell it plainly. Some of them laugh. Some of them stop crossing the street.', fx: { wil: 1, honor: 1, need: { purpose: 6 } } },
      { t: 'Charge your heirs to carry it on', r: 'You make them swear at your bedside. It will outlast you by another generation, as it was meant to.', fx: { wil: 1.5, honor: -1, family: 1 } },
    ] },

  { id: 'oa_faith_night', title: 'The fear at night',
    cond: (p, C) => C.old(p),
    w: 2, cool: 10,
    text: 'You were never afraid of dying in a fight, when you were young and dying was a thing that happened to clumsy people. Now it comes and sits on the end of the bed in the small hours, patient as a creditor, and you lie very still so as not to wake it.',
    choices: [
      { t: 'Get up and pray until light', r: 'The old words. The knees. The cold floor. By dawn it has gone, and you are very stiff.', fx: { piety: 3, need: { rest: -4 }, wil: 1 } },
      { t: 'Wake someone and talk about anything', r: 'You talk about the price of eels and the neighbour\'s daughter, and it leaves you alone for the night.', fx: { need: { company: 6, rest: 2 }, happy: 1, honor: -1 } },
      { t: 'Stare it down', check: { s: 'wil', s2: 'ins', d: 50 },
        win: { r: 'You look at it, and it is just the end, and everyone gets one. You sleep like a child.', fx: { wil: 2, need: { rest: 8 } } },
        lose: { r: 'It stares back. You see the dawn come up grey, every minute of it.', fx: { happy: -4, need: { rest: -5 } } } },
    ] },

  { id: 'oa_faith_doom', title: 'The painting over the door',
    cond: (p, C) => C.old(p),
    w: 2, cool: 12,
    text: 'Over the temple door the old painting of the Weighing has been touched up for the feast: the light souls going up on the left, and on the right the heavy ones going down into a mouth with teeth. You used to find the devils funny. You notice that the painter has given one of the damned your nose.',
    choices: [
      { t: 'Pay for a candle and a year of prayers', r: 'Coin to the altar, and your name in the priest\'s book. The painted nose seems less like yours after that.', fx: { coinPct: -0.03, piety: 4, happy: 2, flag: 'oa_vow' } },
      { t: 'Go on pilgrimage while your legs hold', check: { s: 'sta', s2: 'faith', d: 50 },
        win: { r: 'Six weeks on the road, a shell for your hat, and a pardon in your purse. You come home thin and sure.', fx: { piety: 6, health: -3, happy: 4, fame: 1, flag: 'oa_pilgrim' } },
        lose: { r: 'You get as far as the second shrine and have to be sent home on a cart, sick and ashamed.', fx: { piety: 3, health: -6 } } },
      { t: 'Tell the painter what you think of his work', r: 'You tell him in the porch. He listens, and paints the nose bigger.', fx: { happy: 3, piety: -2 } },
    ] },

  { id: 'oa_faith_shroud', title: 'Sewing the shroud',
    cond: (p, C) => C.old(p) && !C.flag(p, 'oa_shroud'),
    w: 2, cool: 15,
    text: 'In this parish the old sew their own shrouds, or have them sewn, and keep them folded in the chest with lavender, so the family is not caught short. Yours is the last thing you have put off. The linen sits on the table. It is very good linen.',
    choices: [
      { t: 'Sew it yourself, stitch by stitch', r: 'A winter of evenings by the fire. It is a calm, strange work, and you are proud of the hem.', fx: { piety: 2, wil: 1, need: { purpose: 6 }, flag: 'oa_shroud' } },
      { t: 'Pay the nuns to make it', r: 'They make it beautifully, with a cross in white on white. You keep it in the chest and look at it sometimes.', fx: { coin: -6, piety: 3, flag: 'oa_shroud' } },
      { t: 'Use the linen for a shirt instead', r: 'A fine new shirt. You wear it to church. When the time comes, they can wrap you in the old one.', fx: { happy: 4, looks: 1, piety: -1 } },
    ] },

  { id: 'oa_faith_doubt', title: 'After all these years',
    cond: (p, C) => C.old(p) && p.piety >= 40,
    w: 2, cool: 15,
    text: 'A lifetime of fasts and feasts and kneeling, and now, near the end, when it should be easiest, you find you are not sure. The words are the same. The silence behind them is larger. You have not told anyone. Who would you tell?',
    choices: [
      { t: 'Tell the priest, who may understand', check: { s: 'faith', s2: 'ins', d: 45 },
        win: { r: 'He is quiet a long while, and then admits he has the same silence. You pray together like two men in the dark.', fx: { piety: 3, wil: 1.5, happy: 3 } },
        lose: { r: 'He is shocked, and gives you a penance, and tells your family to watch you.', fx: { piety: -2, happy: -4 } } },
      { t: 'Keep kneeling; faith is what you do', r: 'You keep the fasts and the hours. Doing it is a kind of answer, and some days it is enough.', fx: { piety: 2, wil: 1, happy: -1 } },
      { t: 'Let it go, and see what is left', r: 'You stop going to the dawn prayers. What is left is the sun on the wall, and your breath, and it is not nothing.', fx: { piety: -5, happy: 3, need: { rest: 6 } } },
    ] },

  { id: 'oa_faith_young_priest', title: 'The new priest is a boy',
    cond: (p, C) => C.old(p) && !C.ruler(p),
    w: 2, cool: 12,
    text: 'The old priest is dead, and the bishop has sent a boy with a fresh tonsure and a great many opinions. He has told you twice that you sit wrong, sing wrong and confess wrong. You were confessing before his mother was weaned.',
    choices: [
      { t: 'Tell him so, after prayers', check: { s: 'persuasion', s2: 'wil', d: 45 },
        win: { r: 'He goes red, and then asks you, quite humbly, how the old priest did things. You tell him.', fx: { fame: 1, happy: 4, piety: 1 } },
        lose: { r: 'He preaches on the pride of the old the next Sunday, looking at you.', fx: { happy: -3, honor: -1 } } },
      { t: 'Sing louder, in the old way', r: 'The old ones join in, and by the third hymn the church is singing it your way. The boy gives up.', fx: { happy: 3, piety: 1, need: { company: 6 } } },
      { t: 'Take him under your wing', r: 'You have him to supper and tell him who in the parish lies and who steals. He is a better priest by the fast.', fx: { coin: -2, piety: 2, honor: 1, need: { purpose: 6 } } },
    ] },

  { id: 'oa_faith_dole', title: 'A dole for the poor',
    cond: (p, C) => C.old(p) && (C.rich(p) || p.coin >= 50) && !C.flag(p, 'oa_dole'),
    w: 2, cool: 15,
    text: 'The well-off leave a dole: bread and a penny to every poor soul who comes to the funeral, who will pray for the giver in return. The more who come, the shorter your time in the fire, the friars say. The poor of this town can count, and they remember who gave.',
    choices: [
      { t: 'Set aside a dole for a hundred', r: 'A hundred loaves and a hundred pennies, written into the will. The poor will come. Some of them will even pray.', fx: { coinPct: -0.06, piety: 4, fame: 1, flag: 'oa_dole' } },
      { t: 'Give it now, while you can see their faces', r: 'You give it at your own door on a cold morning. You see the faces. That is worth more than prayers.', fx: { coinPct: -0.06, honor: 3, happy: 4, flag: 'oa_dole' } },
      { t: 'The poor can pray for free', r: 'You keep your bread. The friars will say your name less often, and the poor not at all.', fx: { wil: 1, piety: -2, coin: 2 } },
    ] },

  { id: 'oa_faith_coffin', title: 'Measured for it',
    cond: (p, C) => C.old(p) && (C.rich(p) || C.noble(p) || C.job(p)),
    w: 1, cool: 20, once: true,
    text: p => 'The joiner has come to measure you, at your own request, which unsettles him. He runs the cord from your crown to your heels and writes it on a lath. Elm, he says, or oak if you want to last. He means the coffin. He laughs, and then does not.' + (p.flags.oa_shroud != null ? ' The shroud is in the chest already, smelling of lavender.' : ''),
    choices: [
      { t: 'Oak, and keep it in the barn till needed', r: 'It stands in the barn for years, full of apples. The grandchildren dare each other to lie in it.', fx: { coin: -12, happy: 3, need: { comfort: 4 } } },
      { t: 'Plain elm; the worms do not care', r: 'Elm it is. The joiner approves. He has made a great many of these for people who did care.', fx: { coin: -4, wil: 1 } },
      { t: 'Lie in the oak to try it', r: 'You climb in, in front of him. It fits. You are out again in a moment, and you laugh, and so does he.', fx: { coin: -12, wil: 1.5, happy: 2 } },
    ] },

  { id: 'oa_deathbed', title: 'They have sent for the priest',
    trigger: true,
    cond: (p, C) => C.old(p) && (p.health < 40 || A.deathChance(p) >= 0.12),
    setup: (p, ctx) => {
      const k = A.OA.kids(p).length, g = A.OA.grandkids(p).length, d = A.OA.dead(p).length;
      ctx.oaRoom = k ? `${A.OA.num(Math.min(12, k))} of your children${g ? ' and a row of grandchildren' : ''}` : d >= 3 ? 'two neighbours, and the faces of the dead in the corners' : 'a neighbour and the priest';
    },
    text: p => 'You have been in bed a week, and this morning they sent for the priest. The room is full: {oaRoom}. They speak softly and stop when you open your eyes. You are not dead yet. You might be by morning. Everyone is waiting for you to say something.' + (p.flags.oa_peace != null && p.oa && p.oa.peace && p.oa.peace.length ? ` ${p.oa.peace[p.oa.peace.length - 1]} is at the door; you made your peace in time.` : p.flags.oa_shroud != null ? ' The shroud you sewed is out of the chest.' : p.flags.oa_will != null ? ' The will is written. Nobody mentions it.' : ''),
    choices: [
      { t: 'Say something kind to each of them', r: 'You find a true kind word for each, which takes a long time. They will remember the words longer than you.', fx: { happy: 4, honor: 2, need: { company: 8 }, flag: 'oa_words_kind' } },
      { t: 'Tell them the truth about something', r: 'You tell them the thing nobody has said aloud in this family. It is very quiet. Then someone laughs.', fx: { wil: 2, honor: 1, happy: -2, flag: 'oa_words_true' } },
      { t: 'Ask for broth and send them out', check: { s: 'wil', s2: 'sta', d: 50 },
        win: { r: 'You drink the broth and sleep. In a week you are sitting up and complaining. The priest goes home.', fx: { health: 12, wil: 1 } },
        lose: { r: 'You drink the broth and sleep, and the fever comes back by night. They stay.', fx: { health: -3, need: { rest: 6 } } } },
      { t: 'Settle the will, here and now', req: (p, C) => !C.flag(p, 'oa_will'), r: 'You dictate it in a whisper. The clerk leans close. Nobody argues with a dying man; they will argue after.', fx: { family: 1, flag: 'oa_will', oa: { will: 'eldest' } } },
    ] },

  { id: 'oa_faith_vigil', title: 'Sitting with the dying',
    cond: (p, C) => C.old(p) && !C.ruler(p),
    w: 1, cool: 12,
    text: 'There is a widow in the next house dying slowly, and her people are worn out. Someone has to sit with her through the nights. The priest asks you, because you are old, he says, and so you know how. He is right, which is the worst of it.',
    choices: [
      { t: 'Sit with her, every night until it is over', r: 'Eleven nights. You hold her hand and talk about nothing. On the twelfth morning she goes, quietly, while you are dozing.', fx: { piety: 3, honor: 2, need: { rest: -6, purpose: 8 } } },
      { t: 'Sit one night, and find others for the rest', check: { s: 'persuasion', s2: 'diplomacy', d: 40 },
        win: { r: 'You shame three neighbours into taking a night each. She is never alone.', fx: { honor: 2, fame: 1 } },
        lose: { r: 'Nobody else will come. You sit the rest of the nights too, and are cross about it.', fx: { piety: 2, need: { rest: -6 }, happy: -2 } } },
      { t: 'Say you cannot bear it', r: 'The priest nods, and asks someone younger. You lie awake anyway, listening for the bell.', fx: { happy: -2, need: { rest: 4 }, honor: -1 } },
    ] },

  { id: 'oa_faith_relic', title: 'A bone for the old',
    cond: (p, C) => C.old(p) && (C.flag(p, 'oa_pilgrim') || p.piety >= 25),
    w: 1, cool: 15,
    text: p => `${p.flags.oa_pilgrim != null ? 'Since your pilgrimage, the friars have taken you for a soft touch.' : p.flags.oa_vow != null ? 'Word of the candle you paid for has reached the friars.' : 'The friars know a pious purse when they see one.'} One of them has a knucklebone of a saint who was famous for an easy death, set in silver. To hold it at the end, he says, is to go gently. It can be yours for the price of a cow.`,
    choices: [
      { t: 'Buy it, and keep it under the pillow', r: 'It is cold and smooth and probably a pig\'s. You sleep with it in your fist, and sleep better.', fx: { coinPct: -0.04, piety: 2, need: { rest: 6, comfort: 4 } } },
      { t: 'Ask to see the seal of the bishop', check: { s: 'ins', s2: 'learning', d: 45 },
        win: { r: 'There is no seal. You say so, loudly, in the market. The friar leaves town by the back road.', fx: { fame: 1, happy: 3, honor: 1 } },
        lose: { r: 'He has a seal, and a good one. You still do not believe him, and now you look like a cynic.', fx: { piety: -2, happy: -1 } } },
      { t: 'Send him on his way', r: 'You send him off. If there is an easy death, you will have to find it without help.', fx: { wil: 1, piety: -1 } },
    ] },
]);
})();
