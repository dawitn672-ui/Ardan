// 999-confidants: the scene that opens each rank of a bond (confidants.core.js queues it with ctx.pid, ctx.cfRank).
// Three kinds of bond, five ranks each. Every choice reaches the rank; what you say shapes the rest.
(function () {
const ROLE = { friend: ['friend', 'bestfriend', 'comrade', 'student'], love: ['lover', 'betrothed', 'spouse'], mentor: ['mentor', 'master', 'patron', 'superior'] };
// a scene shown without its person (a tool rendering it): someone of that kind of bond, or anyone you know
const who = role => (p, ctx) => {
  if (!(ctx.pid && A.P(ctx.pid) && A.P(ctx.pid).alive)) {
    const ids = Object.keys(p.rel || {}).filter(id => { const t = A.P(id); return t && t.alive && A.isAdult(t); });
    const id = ids.find(i => ROLE[role].includes(p.rel[i].type)) || ids[0];
    if (id) ctx.pid = id; else { ctx.skip = true; return; }
  }
  const t = A.P(ctx.pid);
  ctx.khe = A.he(t); ctx.khim = A.him(t); ctx.khis = A.his(t);
};
const E = (o, title, text, choices) => ({ id: o.id, title, npc: true, trigger: true, cond: (p, C) => C.adult(p), setup: who(o.id.split('_')[1]), text, choices });

A.defEvents([
  // ---- a friend
  E({ id: 'cf_friend_1' }, 'A habit of company', '{them} has started saving you a place on the bench without being asked. Tonight {khe} pushes a cup across before you sit, as if the two of you had always done this.',
    [{ t: 'Drink and talk until the fire is ash', r: 'You talk about nothing much until late. It is the best evening you have had in a while.', fx: { happy: 3, need: { company: 15 } } },
     { t: 'Ask what {khe} wants from you', r: '{khe} laughs at you. Nothing, {khe} says. That is rather the point. You feel foolish, and pleased.', fx: { ins: 0.3, them: { op: 3 } } }]),
  E({ id: 'cf_friend_2' }, 'A spare key', '{them} hands you a key on a thong. The back door, {khe} says, for when you need it and {khe} is out. {khe} does not make a speech about it.',
    [{ t: 'Take it, and give one of yours back', r: 'You cut a copy of your own the next day. Neither of you mentions it again.', fx: { coin: -2, them: { op: 5 } } },
     { t: 'Take it, and say you will not need it', r: 'You need it within the year. {khe} is kind enough not to say anything.', fx: { happy: 2 } }]),
  E({ id: 'cf_friend_3' }, 'A debt between friends', 'You did {them} a turn last winter and forgot it. {khe} did not. {khe} says plainly that {khe} owes you, and that {khe} pays what {khe} owes.',
    [{ t: 'Tell {khim} there is no debt between you', r: '{khe} nods, and does not believe you, and will pay it anyway when you least expect it.', fx: { honor: 1, them: { op: 4 } } },
     { t: 'Say you will hold {khim} to it', r: 'A handshake on it. It is a strange thing, to be owed by a friend. It is also useful.', fx: { skill: { diplomacy: 1 } } }]),
  E({ id: 'cf_friend_4' }, 'Standing in the road', 'Someone said a hard thing about you in the market, and {them} told him to say it again. He did not. {khe} tells you about it afterwards, as if it were a joke, rubbing {khis} knuckles.',
    [{ t: 'Thank {khim} and buy the drinks', r: 'You buy rather a lot of drinks. Neither of you remembers getting home.', fx: { coin: -6, happy: 4, need: { company: 10 } } },
     { t: 'Tell {khim} you fight your own quarrels', check: { s: 'persuasion', s2: 'wil', d: 40 },
       win: { r: '{khe} hears it, and grins, and says next time {khe} will hold your coat.', fx: { wil: 0.5, honor: 1 } },
       lose: { r: '{khe} goes quiet. It takes a week to mend, and it mends.', fx: { happy: -2, honor: 1 } } }]),
  E({ id: 'cf_friend_5' }, 'Old friends', '{them} says, out of nowhere, that if {khe} dies first you are to have the good knife and the bad dog. {khe} has written it down. {khe} shows you where.',
    [{ t: 'Promise the same, the other way', r: 'You write yours under {khis}, in worse handwriting. Two names on one sheet of paper.', fx: { happy: 4, them: { op: 5 } } },
     { t: 'Tell {khim} not to be morbid', r: '{khe} laughs and puts the paper away. You both know where it is.', fx: { happy: 2, wil: 0.5 } }]),

  // ---- a lover, a betrothed, a spouse
  E({ id: 'cf_love_1' }, 'A small thing remembered', '{them} has remembered how you take your bread, which you never told {khim}. It is on the table when you come in, the crust cut off, just so.',
    [{ t: 'Say nothing and eat it', r: 'You eat it. {khe} watches you eat it. That is the whole of the evening, and it is enough.', fx: { happy: 3, need: { company: 12 } } },
     { t: 'Learn something of {khis} in return', check: { s: 'ins', s2: 'int', d: 42 },
       win: { r: 'Within the month you know how {khe} likes the shutters and which song to stop humming. {khe} notices.', fx: { them: { op: 6 }, ins: 0.3 } },
       lose: { r: 'You get it wrong, earnestly. {khe} finds it funnier than anything you have ever done on purpose.', fx: { happy: 2 } } }]),
  E({ id: 'cf_love_2' }, 'A season of your own', '{them} wants a week away, the two of you, somewhere nobody knows your names. {khe} has already asked a cousin with a cottage. {khe} has not asked you.',
    [{ t: 'Go, and leave your work to wait', r: 'A week of rain and nobody needing anything. You come back with a cold and no regrets.', fx: { happy: 5, need: { rest: 15, company: 15 }, coin: -8 } },
     { t: 'Say a week is too long, and offer two days', r: '{khe} takes the two days and makes them count. You suspect {khe} expected the bargaining.', fx: { happy: 3, need: { company: 8 } } }]),
  E({ id: 'cf_love_3' }, 'A favour asked of no one else', '{them} tells you something {khe} has told nobody: a fear, and a thing {khe} once did about it. Then {khe} asks you not to look at {khim} differently.',
    [{ t: 'Tell {khim} something of your own', r: 'You trade it, a fear for a fear. Afterwards the house is very quiet, and very warm.', fx: { them: { op: 6 }, happy: 2 } },
     { t: 'Promise to keep it, and keep it', r: 'You do not tell a soul. {khe} sees that you have not, and something between you settles.', fx: { honor: 2 } }]),
  E({ id: 'cf_love_4' }, 'In front of everyone', 'At the feast {them} takes your hand on the table, in front of your family and {khis}, and leaves it there. An aunt notices. Everybody notices.',
    [{ t: 'Leave your hand where it is', r: 'The aunt sniffs. The rest of the table decides to approve. You are talked about, kindly, for a month.', fx: { fame: 1, happy: 3 } },
     { t: 'Squeeze it and let it go', r: 'A small thing, and {khe} understands it. Some things are for the two of you.', fx: { wil: 0.5, them: { op: 3 } } }]),
  E({ id: 'cf_love_5' }, 'What you are to each other', '{them} says, plainly, that whatever comes, {khe} has had the better part of {khis} life with you. Then {khe} goes back to mending the shirt, and will not say it twice.',
    [{ t: 'Say it back', r: 'You say it back. {khe} pretends not to hear, and smiles at the shirt.', fx: { happy: 5, need: { company: 15 } } },
     { t: 'Take the shirt and finish it yourself', r: 'You make a poor job of it. {khe} wears it anyway, for years.', fx: { happy: 3, skill: { craft: 1 } } }]),

  // ---- a mentor, a master, a patron
  E({ id: 'cf_mentor_1' }, 'Worth teaching', '{them} watches you work for longer than usual, then takes the tool out of your hand and shows you, once, the way {khe} does it. {khe} hands it back without a word.',
    [{ t: 'Do it {khis} way, slowly', r: 'Your first tries are worse than your old way. By the tenth they are better.', fx: { int: 0.3, need: { purpose: 10 } } },
     { t: 'Ask why it is done that way', check: { s: 'learning', s2: 'int', d: 42 },
       win: { r: 'The answer takes an hour and changes how you see the whole job.', fx: { skill: { learning: 2 } } },
       lose: { r: '{khe} says because it works, and goes back to {khis} own bench.', fx: { happy: -1 } } }]),
  E({ id: 'cf_mentor_2' }, 'An hour each week', '{them} says {khe} will give you an hour a week, the same hour, and that you will not be late for it. {khe} does not ask whether you want it.',
    [{ t: 'Be early every week', r: 'You are early every week for a year. {khe} is never early, and never late.', fx: { wil: 0.5, need: { purpose: 12 } } },
     { t: 'Bargain for the evening instead', r: '{khe} gives you the evening and charges you the candles. A fair trade.', fx: { coin: -3, need: { rest: 8 } } }]),
  E({ id: 'cf_mentor_3' }, 'A word in the right ear', '{them} has spoken for you to someone who matters, without telling you. You hear of it from the someone. {khe} says it was nothing, and that you will owe {khim} for it.',
    [{ t: 'Thank {khim} properly, with a gift', r: 'A good bottle. {khe} drinks half of it with you and keeps the rest for an occasion.', fx: { coin: -10, them: { op: 6 } } },
     { t: 'Promise to live up to the word', r: '{khe} says that is the only thanks worth having, and means it.', fx: { honor: 1, need: { purpose: 10 } } }]),
  E({ id: 'cf_mentor_4' }, 'The hard lesson', '{them} sets you work you cannot do, and watches you fail at it, and then tells you exactly why. It is the worst afternoon of your training and you know it is the most useful.',
    [{ t: 'Go back and do it again', check: { s: 'wil', s2: 'sta', d: 45 },
       win: { r: 'The fourth time, it comes right. {khe} nods once, which from {khim} is a speech.', fx: { wil: 0.6, need: { purpose: 12 } } },
       lose: { r: 'You go home with blistered hands and the lesson, which is worth more than the hands.', fx: { health: -3, wil: 0.6 } } },
     { t: 'Ask {khim} what {khe} failed at, at your age', r: '{khe} tells you, which {khe} has never told anyone. You both laugh at it.', fx: { them: { op: 5 }, happy: 2 } }]),
  E({ id: 'cf_mentor_5' }, 'What is handed on', '{them} gives you {khis} own tools, or {khis} books, or {khis} sword: the thing {khe} worked with. {khe} says {khe} has no more use for it, which is not true.',
    [{ t: 'Take it, and use it', r: 'It fits your hand as if it knew it. Every time you use it, you think of {khim}.', fx: { need: { purpose: 15 }, happy: 3 } },
     { t: 'Take it, and promise to hand it on', r: 'One day you will give it to someone young and impatient, and say you have no more use for it.', fx: { honor: 2, happy: 2 } }]),
]);
})();
