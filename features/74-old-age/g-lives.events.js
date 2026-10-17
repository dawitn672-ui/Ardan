// Old age, part 7: old age as each kind of life meets it. The old couple (and the one who becomes the other's
// nurse), the old serf freed because he can no longer work, the old soldier at the muster, the merchant's ledger of
// debts to forgive, the old priest, the old ruler and the child heir, the elf who outlives the humans' great-
// grandchildren, the dwarf's name in the hall, the orc who did not die in battle. And the best and worst days of
// the life, from 67-memory-weave's record.
(function () {
const OAg = {
  spouse: (p, ctx, pre) => { const s = p.spouse && A.P(p.spouse); if (!s || !s.alive) { ctx.skip = true; return null; } return A.OA.put(p, ctx, s, pre || 'oa', true); },
};
A.defEvents([
  { id: 'oa_life_couple', title: 'Forty years of the same quarrel',
    cond: (p, C) => C.old(p) && C.married(p),
    w: 3, cool: 8,
    setup: (p, ctx) => { OAg.spouse(p, ctx); },
    text: 'You and {oa} are having the quarrel again: the one about the roof, or the money, or whose mother was worse, begun before your children were born. Neither of you remembers how it started. Both of you know every line of it, and when to shout.',
    choices: [
      { t: 'Give in, for once, after all these years', r: '{oa} is so astonished {oahe} forgets to gloat. The house is very quiet. You both miss the quarrel a little.', fx: { them: { op: 12 }, happy: 2, wil: -0.5 } },
      { t: 'Win it, finally', check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: 'You find the argument you never thought of. {oa} has no answer. You feel twenty and terrible.', fx: { happy: 4, them: { op: -6 }, wil: 1 } },
        lose: { r: '{oa} has a new argument too, saved up for years. You lose, again, as usual.', fx: { happy: -2, them: { op: 2 } } } },
      { t: 'Laugh in the middle of it', r: 'You laugh, and {oa} laughs, and you cannot either of you go on. It ends in the kitchen with the good cheese.', fx: { them: { op: 8 }, happy: 5, need: { company: 6 } } },
    ] },

  { id: 'oa_life_nurse', title: '{oa} does not know you today',
    cond: (p, C) => C.old(p) && C.married(p),
    w: 2, cool: 10,
    setup: (p, ctx) => { const s = OAg.spouse(p, ctx); if (s && A.age(s) < A.age(p) - 8) ctx.skip = true; ctx.oaMe = p.sex === 'F' ? 'wife' : 'husband'; },
    text: 'This morning {oa} asked you, politely, who you were and when {oahis} {oaMe} would be home. Some days {oahe} is all there; some days {oahe} is somewhere forty years ago, waiting for someone who looks like you used to. You are the nurse now. Nobody asked.',
    choices: [
      { t: 'Care for {oahim} yourself, day and night', r: 'You wash, feed and walk {oahim}, and answer the same question twenty times a day. You are very tired, and you would not have it otherwise.', fx: { them: { op: 15 }, honor: 2, need: { rest: -6, purpose: 8 }, health: -2 } },
      { t: 'Pay a woman from the village to help', r: 'A broad, patient woman comes mornings. {oa} likes her better than you, some days. You sleep.', fx: { coin: -10, need: { rest: 8 }, them: { op: 4 } } },
      { t: 'Play along: be the one {oahe} is waiting for', r: 'You come in at the door and say you are home. {oaHis} face. You do it every evening now.', fx: { happy: 4, them: { op: 12 }, wil: -0.5 } },
    ] },

  { id: 'oa_life_anniversary', title: 'The day you were married',
    cond: (p, C) => C.old(p) && C.married(p),
    w: 2, cool: 10,
    setup: (p, ctx) => { OAg.spouse(p, ctx); },
    text: 'It is the day you were married, and you are the only one who remembers. {oa} is in the garden pulling up the wrong plants. The church you were married in has a new roof, and the priest who married you is dead. The day itself is a fine one.',
    choices: [
      { t: 'Take {oahim} to the church door again', r: 'You stand where you stood, slower. {oaHe} remembers then, or says {oahe} does. It is the same thing at your age.', fx: { them: { op: 12 }, happy: 5, piety: 1 } },
      { t: 'Buy {oahim} something foolish', r: 'A ribbon, a comb, a bright useless thing from the pedlar. {oaHe} wears it to market and tells everyone.', fx: { coin: -4, them: { op: 10 }, happy: 3 } },
      { t: 'Say nothing and help in the garden', r: 'You pull up the wrong plants too, side by side, and neither of you mentions the day.', fx: { them: { op: 6 }, need: { company: 6, rest: 4 } } },
    ] },

  { id: 'oa_life_serf_freed', title: 'Freed because you are worn out',
    cond: (p, C) => C.old(p) && C.unfree(p),
    w: 3, cool: 20, once: true,
    text: 'The steward has written you out of the lord\'s rolls. You are free, he says, as if it were a gift: free of labour-service, free of the lord\'s bread, free of the cottage that goes with the work. You are too old to be worth feeding. You have been the lord\'s for sixty years.',
    choices: [
      { t: 'Take the freedom and go to your kin', r: 'You walk out of the gate with a bundle. It is the first road you have ever chosen. It leads to a cousin\'s barn.', fx: { free: true, happy: 4, need: { comfort: -8 }, wil: 1 } },
      { t: 'Beg to stay on in the cottage as you are', check: { s: 'persuasion', s2: 'wil', d: 45 },
        win: { r: 'The lord\'s wife hears of it and lets you keep the cottage for scaring crows. You are free, and housed.', fx: { free: true, need: { comfort: 6 }, happy: 2 } },
        lose: { r: 'The steward says the cottage is for a working man. You are free by quarter day, and homeless.', fx: { free: true, happy: -6, health: -2 } } },
      { t: 'Refuse to go; the lord owes you your keep', r: 'You sit on the doorstep and will not move. In the end they leave you there, unfree, fed, and furious.', fx: { wil: 2, honor: 1, happy: -2 } },
    ] },

  { id: 'oa_life_muster', title: 'The muster-master\'s eye',
    cond: (p, C) => C.old(p) && C.soldier(p),
    w: 3, cool: 8,
    text: 'The muster-master walks the line and stops in front of you. He looks at the grey in your beard, the way you stand on the bad leg, and the sword arm. "How old are you, soldier?" Everyone on the line is listening for the answer.',
    choices: [
      { t: 'Lie about your age, boldly', check: { s: 'intimidation', s2: 'wil', d: 50 },
        win: { r: 'You knock ten years off and stare him down. He writes what you say. Nobody laughs.', fx: { wil: 1, merit: 2, happy: 2 } },
        lose: { r: 'He laughs, and the line laughs, and you are moved to the baggage.', fx: { happy: -5, merit: -2 } } },
      { t: 'Ask to drill the recruits instead', r: 'You are given twenty farm boys and a field. You make soldiers of eleven of them, which is a good year.', fx: { skill: { command: 2 }, need: { purpose: 8 }, merit: 2 } },
      { t: 'Ask for your discharge and your pay', r: 'Your discharge, your back pay and a handshake. The camp goes on without you the next morning.', fx: { coin: 15, need: { purpose: -8, rest: 8 }, happy: 1 } },
    ] },

  { id: 'oa_life_ledger', title: 'The book of debts',
    cond: (p, C) => C.old(p) && (C.job(p, 'merchant') || C.job(p, 'moneylender') || C.job(p, 'banker') || C.rich(p)),
    w: 2, cool: 12,
    text: 'The old ledger is heavy with debts owed you: some by men now dead, some by widows, some by people who will never pay and know you know it. A merchant who dies with a full debt-book, the friars say, carries it with him. Your heirs say it is worth good money.',
    choices: [
      { t: 'Forgive the poor debtors, every one', r: 'You strike them out one by one, and send word. A widow comes to your door with a cake and cannot speak.', fx: { coinPct: -0.05, piety: 4, honor: 3, fame: 1 } },
      { t: 'Call them all in while you can', check: { s: 'trade', s2: 'intimidation', d: 50 },
        win: { r: 'You collect more than you expected and make more enemies than you expected. The heirs are delighted.', fx: { coinPct: 0.08, honor: -2 } },
        lose: { r: 'You collect very little and make a great many enemies. The friars preach on it.', fx: { coinPct: 0.01, honor: -3, happy: -2 } } },
      { t: 'Leave the book to the heirs', r: 'Let them chase it. You put it in the chest and do not open it again.', fx: { family: 1, wil: 0.5 } },
    ] },

  { id: 'oa_life_old_priest', title: 'The bishop\'s letter',
    cond: (p, C) => C.old(p) && (C.job(p, 'clergy') || C.job(p, 'priest') || C.job(p, 'monk')),
    w: 3, cool: 10,
    text: 'The bishop writes, warmly, that your long service deserves rest, and that a young man of good family is ready to take your parish. There is a cell for you at the cathedral and a stipend. You have buried and married and named half the parish. The other half you have scolded.',
    choices: [
      { t: 'Accept, and go to the cathedral', r: 'A cell, a bell, and a great deal of time to pray. You are lonelier than you expected, and closer to heaven.', fx: { piety: 4, need: { purpose: -8, rest: 10 }, coin: 5 } },
      { t: 'Refuse, and write the bishop why', check: { s: 'faith', s2: 'persuasion', d: 50 },
        win: { r: 'The parish petitions for you, with a hundred crosses. The bishop gives way, sourly.', fx: { fame: 2, need: { purpose: 8 }, rep: 2 } },
        lose: { r: 'The bishop is not moved. The young man arrives at Michaelmas, and you are a guest in your own church.', fx: { happy: -6, honor: 1 } } },
      { t: 'Ask to train the young man first', r: 'A year with him at your side. He is good, under the family. You tell him which of them lie.', fx: { honor: 2, need: { purpose: 6 }, piety: 1 } },
    ] },

  { id: 'oa_life_regent', title: 'The heir is a child',
    cond: (p, C) => C.old(p) && C.ruler(p),
    w: 3, cool: 8,
    setup: (p, ctx) => {
      const r = A.realm(p.ruler), h = r && A.P(r.heir);
      if (!h || !h.alive || A.isAdult(h)) { ctx.skip = true; return; }
      A.OA.put(p, ctx, h, 'oa', true);
    },
    text: 'You are old, and your heir {oa} is {oaage}. If you die this winter the realm will be ruled by whoever stands nearest the cradle. The great lords have each, separately, assured you of their devotion to the child, and of their doubts about the others.',
    choices: [
      { t: 'Name a regency council, balanced against itself', check: { s: 'diplomacy', s2: 'int', d: 55 },
        win: { r: 'Three lords who hate each other, sworn together. None can move without the others. The child will be safe, if bored.', fx: { stability: 6, legit: 4, wil: 1 } },
        lose: { r: 'They spend the oath-taking quarrelling about precedence. It does not bode well.', fx: { stability: -4, happy: -3 } } },
      { t: 'Name the child\'s mother regent', r: 'The lords bow and mutter. She will have to be harder than any of them, and she knows it.', fx: { legit: 2, stability: -2, them: { op: 10 } } },
      { t: 'Live, out of spite, until the child is grown', r: 'You decide not to die. It is the least practical decision of your reign, and the most popular with the child.', fx: { wil: 2, them: { op: 15 }, health: 3 } },
    ] },

  { id: 'oa_life_ruler_told', title: 'The reign in the chronicle',
    cond: (p, C) => C.old(p) && C.ruler(p) && C.deeds(p, 5),
    w: 2, cool: 10,
    setup: (p, ctx) => { A.OA.pickDeed(p, ctx, 5, 'oa_life_ruler_told'); },
    text: 'The court chronicler reads you his account of your reign, for approval. In {oaDeedYear} you {oaDeed}; in his pages, "{oaTale}." He has made you very great. He has also left out what it cost, and who paid.',
    choices: [
      { t: 'Approve it; the realm needs a great ruler', r: 'You seal it. In a hundred years you will be greater than you were, and the realm will believe in itself a little more.', fx: { fame: 3, legit: 3, honor: -2 } },
      { t: 'Make him write what it cost', r: 'He writes it, unhappily. It is a smaller, truer book. Some at court will never forgive you for it.', fx: { honor: 4, legit: -2, wil: 1 } },
      { t: 'Burn it and let them judge you after', r: 'It goes in the fire. Let the next chronicler find his own lies.', fx: { wil: 1.5, fame: -1 } },
    ] },

  { id: 'oa_life_elf', title: 'Their great-grandchildren',
    cond: (p, C) => C.old(p) && C.race(p, 'elf'),
    w: 3, cool: 15,
    text: 'You walk through the human town at the edge of the wood. The people at the market have the faces of people you knew: the same chin, the same laugh, worn on great-grandchildren who have never heard of you. You have outlived their whole line, four times over, and you are only now beginning to tire.',
    choices: [
      { t: 'Tell one of them about the ancestor you knew', r: 'He is polite, and puzzled, and walks away thinking the elf was mad. You are a story he will tell.', fx: { happy: 2, need: { company: 4 }, fame: 1 } },
      { t: 'Go home and sing the long songs to the young', check: { s: 'music', s2: 'wil', d: 45 },
        win: { r: 'The young sit through the whole night of it. The names will go on a few centuries more.', fx: { fame: 2, wil: 1, need: { purpose: 8 } } },
        lose: { r: 'Your voice breaks in the second hour. The young are kind about it.', fx: { happy: -3 } } },
      { t: 'Choose the tree you will lie under', r: 'An oak on the slope, facing the morning. You visit it every day. It is a very slow conversation.', fx: { piety: 3, wil: 1, need: { rest: 6 } } },
    ] },

  { id: 'oa_life_dwarf', title: 'Your name in the hall',
    cond: (p, C) => C.old(p) && C.race(p, 'dwarf'),
    w: 3, cool: 20,
    text: 'The rune-cutter of the hold has come to ask what is to be cut beside your name in the Ancestors\' Hall: one line, for all who come after. Your master has one line. Your father has one line. You have had a hundred and eighty years and cannot think of a single thing.',
    choices: [
      { t: 'The work you made', r: '"Made true." He cuts it deep. Every apprentice who passes will touch it for luck.', fx: { fame: 2, piety: 2, wil: 1 } },
      { t: 'The kin you kept', r: '"Kept faith with the clan." The elders nod. It is what is cut most often, and it is never untrue.', fx: { honor: 3, family: 1 } },
      { t: 'Let the clan choose, after', r: 'He goes away with nothing. The clan will decide what you were. You find that frightening, and right.', fx: { wil: 1.5, happy: -1 } },
    ] },

  { id: 'oa_life_orc', title: 'Not dead in battle',
    cond: (p, C) => C.old(p) && C.race(p, 'orc', 'halforc'),
    w: 3, cool: 12,
    text: 'Among your people the old are a kind of joke: those who did not die well. The young warriors bring you meat and do not meet your eye. You have outlived three chiefs and two wars and every one of your yearmates, and every one of them died better than you will.',
    choices: [
      { t: 'Seek one last fight', check: { s: 'wil', s2: 'str', d: 55 },
        win: { r: 'You call out a young braggart before the fire and put him on the ground. They meet your eye now.', fx: { fame: 3, health: -4, happy: 6 } },
        lose: { r: 'He is gentle with you. That is worse than any wound.', fx: { health: -6, happy: -6 } } },
      { t: 'Become the one who remembers', r: 'You tell the war-stories at every fire, with every name. The young start to come for them.', fx: { need: { purpose: 10 }, fame: 1, wil: 1 } },
      { t: 'Laugh at them for wanting to die young', r: 'You tell them what you have seen of glory. Some of them hear it. Most of them will die young anyway.', fx: { wil: 1, honor: -1, happy: 2 } },
    ] },

  { id: 'oa_life_oldest', title: 'The oldest in the parish',
    cond: (p, C) => C.old(p) && C.age(p) >= 70 && C.outlived(p, 2),
    w: 2, cool: 30, once: true,
    setup: (p, ctx) => { A.OA.choose(p, ctx, A.OA.dead(p).slice(0, 1), 'oa_life_oldest'); },
    text: p => 'With the death of {oa} you are now the oldest soul in the parish, and it has been noticed. The lord sends a cheese. The priest mentions you in the prayers, by name, as a sign of heaven\'s favour or as a warning. Children are brought to touch your hand.' + (p.flags.oa_feud_ended != null ? ' Even the other house sends someone, now the feud is done.' : ''),
    choices: [
      { t: 'Hold court on the bench by the church', r: 'You sit in the sun and receive visitors like a bishop. It is very pleasant and slightly absurd.', fx: { fame: 2, happy: 4, need: { company: 8 } } },
      { t: 'Tell them all the secret is spite', r: 'You say it is spite, and onions, and never paying the tithe on time. It goes round the parish by evening.', fx: { happy: 3, piety: -1, fame: 1 } },
      { t: 'Hide indoors from all of it', r: 'You bar the door. They leave cheeses on the step. You eat them.', fx: { need: { rest: 8, company: -4 }, wil: 1 } },
    ] },

  { id: 'oa_life_thief', title: 'Easy pickings',
    cond: (p, C) => C.old(p) && !C.ruler(p) && !C.noble(p),
    w: 2, cool: 12,
    text: 'There is a man in your house in the dark, going through the chest by the door. He has come because you are old and live alone and are known to keep coin. He does not know you are awake. You can hear him breathing.',
    choices: [
      { t: 'Take the poker and go for him', check: { s: 'melee', s2: 'wil', d: 50 },
        win: { r: 'He did not expect the poker, or the language. He goes out of the window without the coin.', fx: { fame: 1, happy: 4, wil: 1 } },
        lose: { r: 'He knocks you down on his way out, with the coin.', fx: { health: -6, coinPct: -0.05, wound: 'concussion' } } },
      { t: 'Lie still and let him take it', r: 'He takes the coin in the chest, which is the coin you keep there for thieves. The rest is under the floor.', fx: { coin: -5, wil: 1, need: { comfort: -6 } } },
      { t: 'Speak to him, calmly, by name', check: { s: 'ins', s2: 'persuasion', d: 55 },
        win: { r: 'You guessed right: a neighbour\'s son. He puts it all back and weeps, and you give him a coin to go away.', fx: { coin: -1, honor: 2, happy: 2 } },
        lose: { r: 'You guessed wrong. He panics and runs, with the coin and your good knife.', fx: { coinPct: -0.05, happy: -4 } } },
    ] },

  { id: 'oa_life_best_day', title: 'The best of your days',
    cond: (p, C) => C.old(p) && C.oldLine(p, 'kind,gain,name', 10),
    w: 3, cool: 8,
    setup: (p, ctx) => { A.OA.pickLine(p, ctx, 'kind,gain,name', 10, 'oa_life_best_day'); },
    text: 'Someone at supper asks the old ones for the best day of their lives, as a game. When it comes round to you, you find you know at once: the year {oaMyear}, when {oaMdeed}. It is {oaMago} ago and it is quite close, as if you could reach it from your chair.',
    choices: [
      { t: 'Tell it, all of it', r: 'You tell it well, and they are quiet after. Someone says it was a good day. It was.', fx: { happy: 6, need: { company: 6 } } },
      { t: 'Say something else; that one is yours', r: 'You tell them about a feast instead. The real one you keep, warm, in your pocket.', fx: { wil: 1, happy: 3 } },
      { t: 'Say it was the day you saw the sea', req: p => p.flags.oa_saw_sea != null, r: 'You tell them about the shingle and the wet boots and the salt. Nobody else at the table has seen it.', fx: { happy: 5, wil: 0.5, need: { company: 4 } } },
      { t: 'Say you have not had it yet', r: 'They laugh. You meant it, a little. It makes the young ones look at you differently.', fx: { wil: 1.5, need: { purpose: 6 } } },
    ] },

  { id: 'oa_life_worst_loss', title: 'What it cost',
    cond: (p, C) => C.old(p) && C.oldLine(p, 'loss', 12),
    w: 2, cool: 10,
    setup: (p, ctx) => { A.OA.pickLine(p, ctx, 'loss', 12, 'oa_life_worst_loss'); },
    text: 'The steward\'s boy is doing your accounts, because your eyes are bad, and he finds the old entry for {oaMyear}, when {oaMdeed}. It was a great deal of money then. He whistles. You remember the night after it, sitting up with the ledger and the candle.',
    choices: [
      { t: 'Tell him what you learned from it', r: 'You tell him about the night and the candle. He listens, because it is a good story and you are paying him.', fx: { wil: 1, need: { purpose: 4 }, coin: -1 } },
      { t: 'Tell him to strike it out', r: 'He draws a line through it. It is gone from the book. It was gone from your purse long ago.', fx: { happy: 2, need: { rest: 4 } } },
      { t: 'Check his sums for the rest of the evening', check: { s: 'stewardship', s2: 'int', d: 45 },
        win: { r: 'You find an error of his in your favour, and one in his. He leaves humbler.', fx: { coin: 4, int: 0.5 } },
        lose: { r: 'You find nothing, and keep him late, and he charges you for the candle.', fx: { coin: -2, happy: -2 } } },
    ] },

  { id: 'oa_life_cheat', title: 'They think you are simple',
    cond: (p, C) => C.old(p) && !C.ruler(p),
    w: 2, cool: 10,
    text: 'The new man at the market stall gives you short weight and short change in one easy movement, smiling, because you are old and must be simple. You were weighing goods before his father could count. You saw exactly what he did.',
    choices: [
      { t: 'Call it out for the whole market to hear', check: { s: 'trade', s2: 'wil', d: 45 },
        win: { r: 'You make him weigh it again in front of everyone. The market enjoys it. He never cheats an old one again.', fx: { coin: 2, fame: 1, happy: 3 } },
        lose: { r: 'He talks fast and loud, and the crowd sides with the young man. You go home short.', fx: { coin: -2, happy: -3, honor: -1 } } },
      { t: 'Play simple, and cheat him back', check: { s: 'intrigue', s2: 'ins', d: 50 },
        win: { r: 'You pay him in clipped coin from your grandmother\'s pot. He takes it, smiling, because you are old.', fx: { coin: 3, honor: -1, happy: 4 } },
        lose: { r: 'He bites the coin. You are not as quick as you were.', fx: { coin: -3, honor: -2 } } },
      { t: 'Say nothing, and buy elsewhere', r: 'You buy from the old woman at the end of the row ever after, and tell your neighbours why.', fx: { wil: 1, coin: -1 } },
    ] },
]);
})();
