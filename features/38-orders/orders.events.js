// Orders by letter (38-orders). The core sends a letter from your superior with your general's plan; the general's
// temper picks which one. Each choice records how you took it (fx.order), and sixty days later the map settles it:
// the plan worked or it did not, and you obeyed or you did not.
const GO = () => A.GENERALS;
const provName = (j, dflt) => (j != null && A.S.prov[j] ? A.S.prov[j].name : dflt);
// fill the letter's names: it comes from your superior, or, for a recruit with no captain yet, from the general
const chain = (p, ctx) => {
  const sup = A.superior(p), g = A.P(ctx.genId), from = sup || (g && g.alive ? g : null);
  if (!from) { ctx.skip = true; return null; }
  ctx.pid = from.id; ctx.from = !sup ? 'muster' : g && sup.id === g.id ? 'general' : 'captain';
  ctx.general = g ? A.fullName(g, false) : 'the general';
  return from;
};
const fill = (p, ctx) => {
  const g = A.P(ctx.genId);
  if (!g || !g.alive || !chain(p, ctx)) { ctx.skip = true; return; }
  ctx.target = provName(ctx.tp, 'the enemy line'); ctx.post = provName(ctx.pp, 'your post');
};
// the settling scenes need only the chain and the place
const after = (p, ctx) => {
  if (!chain(p, ctx)) return;
  ctx.target = provName(ctx.temper === 'bold' || ctx.temper === 'cunning' ? ctx.tp : ctx.pp, 'the line');
};
const via = ctx => (ctx.from === 'muster' ? 'The general\'s orders are read out at muster, and the sergeant reads them twice.'
  : ctx.from === 'general' ? 'A letter in the general\'s own hand.'
  : 'A letter comes down the line from {themFull}, the general\'s orders copied out above {theirHis} seal.');
const comrades = op => ({ who: 'comrade', op, all: true });

A.defEvents([
  { id: 'go_order_bold', title: 'Orders: the first wave', npc: true, cool: 1,
    cond: (p, C) => C.soldier(p) && C.atWar(p), setup: fill,
    text: (p, ctx) => `${via(ctx)} General {general} means to take {target} before the month is out, and your company goes in with the first wave. "We do not wait for the engines," it says. "The general has never waited for anything."`,
    choices: [
      { t: 'Go in with the first wave', check: { s: 'melee', s2: 'wil', d: 50 },
        win: { r: 'You are on the wall at {target} before the second wave has left the ditch. The general\'s aide writes your name down.', fx: { merit: 8, fame: 1, order: 'obey' } },
        lose: { r: 'A stone off the parapet takes you on the shoulder, and you come down the ladder the hard way. They saw you go up, at least.', fx: { health: -14, merit: 3, order: 'obey' } } },
      { t: 'Go when the wave goes, and not before', r: 'You go in with the rest, no sooner. The company comes back with most of its men. Nobody writes your name down.', fx: { merit: 2, order: 'letter' } },
      { t: 'Find another way in', check: { s: 'tactics', s2: 'int', d: 55 },
        win: { r: 'A culvert under the east wall, half full of water. You bring twelve men through it while the first wave keeps the walls busy. {them} is angry for a day and grateful for a month.', fx: { merit: 7, skill: { tactics: 2 }, them: { op: -3 }, order: 'own' } },
        lose: { r: 'The culvert is barred, and by the time you are back the first wave has gone in without you. {them} wants to know where you were.', fx: { merit: -5, them: { op: -8 }, order: 'own' } } },
      { t: 'Keep your company back', r: 'You find reasons: a broken ladder, a late signal. The first wave goes in a company short, and your men live to grumble about it. {them} knows what you did.', fx: { merit: -6, them: { op: -12 }, honor: -3, rel: comrades(8), order: 'ignore' } },
    ] },

  { id: 'go_order_cautious', title: 'Orders: hold and wait', npc: true, cool: 1,
    cond: (p, C) => C.soldier(p) && C.atWar(p), setup: fill,
    text: (p, ctx) => `${via(ctx)} General {general} will not move until the enemy does. Your company is to hold {post}, keep its fires small, and answer nothing the enemy shows it. Across the valley their foragers work the fields in plain sight. Your men watch them eat.`,
    choices: [
      { t: 'Hold, as ordered', r: 'You hold. The foragers fill their carts and go home. Your men grumble, and none of them die.', fx: { merit: 2, happy: -3, order: 'obey' } },
      { t: 'Hold, and drill the men while you wait', r: 'You drill them in the mud until they hate you. They are quicker at the end of it, and slower to forgive.', fx: { merit: 1, skill: { command: 2 }, rel: comrades(-3), order: 'letter' } },
      { t: 'Raid the foragers at dusk', check: { s: 'stealth', s2: 'tactics', d: 50 },
        win: { r: 'You take two carts and a mule, and lose no one. The men eat well. {them} does not ask where the bacon came from.', fx: { merit: 4, coin: 12, them: { op: -2 }, rel: comrades(4), order: 'own' } },
        lose: { r: 'The foragers had an escort. You come back two men short, and {them} has your name by morning.', fx: { health: -8, merit: -5, them: { op: -8 }, order: 'own' } } },
      { t: 'Take the company across the valley', r: 'You go after their camp with a hundred men and no orders. You burn a barn, and their horse chases you home. The general hears of it, and so does the whole army.', fx: { merit: -4, them: { op: -10 }, fame: 1, skill: { melee: 1 }, order: 'ignore' } },
    ] },

  { id: 'go_order_cunning', title: 'Orders: make a noise', npc: true, cool: 1,
    cond: (p, C) => C.soldier(p) && C.atWar(p), setup: fill,
    text: (p, ctx) => `${via(ctx)} General {general} wants noise at {target}: drums, fires, a show of ladders, every night for a week. The real blow falls somewhere the letter does not name. Your company is the noise, and noise draws arrows.`,
    choices: [
      { t: 'Make the noise, close under the walls', check: { s: 'stealth', s2: 'wil', d: 45 },
        win: { r: 'Six nights of drums and torches, and on the seventh they have moved half the garrison to face you. Somewhere else, the general\'s real attack goes in.', fx: { merit: 6, order: 'obey' } },
        lose: { r: 'On the fourth night they come out at you with crossbows. The noise stops early.', fx: { health: -10, merit: 2, order: 'obey' } } },
      { t: 'Light the fires, keep the men out of bowshot', r: 'Fires and drums, and not a man within bowshot of the walls. The enemy is not fooled for long. Nobody is hurt.', fx: { merit: 1, order: 'letter' } },
      { t: 'Turn the feint into a real attack', check: { s: 'tactics', s2: 'melee', d: 60 },
        win: { r: 'They thin their wall to watch your drums, and you go over the thin part. {them} did not order it and cannot complain about it.', fx: { merit: 9, fame: 1, them: { op: -4 }, order: 'own' } },
        lose: { r: 'They were waiting. You come back with half the men you took, and the general\'s feint is known now for what it was.', fx: { health: -12, merit: -8, them: { op: -10 }, order: 'own' } } },
      { t: 'Keep the company quiet', r: 'Your company sits in its trenches and makes no noise at all. The enemy watches the right place. Your men sleep well; {them} sends for you.', fx: { merit: -6, them: { op: -10 }, rel: comrades(5), order: 'ignore' } },
    ] },

  { id: 'go_order_steady', title: 'Orders: hold the line', npc: true, cool: 1,
    cond: (p, C) => C.soldier(p) && C.atWar(p), setup: fill,
    text: (p, ctx) => `${via(ctx)} General {general} keeps the line where it is. Your company holds {post} and sends a patrol toward {target} every second night. It is the plainest order you have ever had.`,
    choices: [
      { t: 'Lead the patrols yourself', check: { s: 'stealth', s2: 'ins', d: 45 },
        win: { r: 'On the third night you find where their pickets change. By noon the general has it in writing.', fx: { merit: 5, skill: { stealth: 1 }, order: 'obey' } },
        lose: { r: 'An ambush in a sunken lane. You get your men out, and most of yourself.', fx: { health: -8, merit: 2, order: 'obey' } } },
      { t: 'Send the patrols and keep the post', r: 'The patrols go out and come back. You keep the post and the lists. Nothing happens, as ordered.', fx: { merit: 2, order: 'letter' } },
      { t: 'Ask {them} for a real objective', check: { s: 'persuasion', s2: 'int', d: 50 },
        win: { r: '{them} hears you out, and sends your idea up the line under {theirHis} own name. Some of the credit comes back down to you.', fx: { merit: 3, them: { op: 4 }, skill: { persuasion: 1 }, order: 'own' } },
        lose: { r: '{them} reads you the order again, slowly, as if to a child. You send the patrols.', fx: { merit: -2, them: { op: -6 }, order: 'letter' } } },
      { t: 'Let the patrols lapse', r: 'The patrols stop going out after the first week, and the men sleep. {them} finds out when the enemy is suddenly much closer than anyone knew.', fx: { merit: -5, them: { op: -8 }, happy: 3, rel: comrades(3), order: 'ignore' } },
    ] },

  // you held back, and the plan worked without you
  { id: 'go_reckoning', title: 'Called to account', cool: 1,
    cond: (p, C) => C.soldier(p), setup: after,
    text: '{target} is ours. General {general}\'s plan worked without your company, and {themFull} wants to know why it had to. You stand in {theirHis} tent with your cap in your hands.',
    choices: [
      { t: 'Tell the truth: you thought the order wrong', r: '{them} hears it, and writes something down. You keep your rank. You will not get the next one soon.', fx: { merit: -6, honor: 2, them: { op: -3 } } },
      { t: 'Blame the signal, the ladders, the weather', check: { s: 'persuasion', s2: 'int', d: 55 },
        win: { r: 'The weather was bad, and {them} has no wish to write a report. It goes no further.', fx: { merit: -1, honor: -2 } },
        lose: { r: '{them} has already talked to your sergeant. The lie costs you more than the truth would have.', fx: { merit: -12, them: { op: -10 }, honor: -3 } } },
      { t: 'Ask for the worst post, to make it right', r: '{them} gives you the worst post on the line for a month. You take it, and you come off it thinner.', fx: { merit: -3, health: -5, them: { op: 4 } } },
    ] },

  // you went your own way or held back, and the plan failed
  { id: 'go_vindicated', title: 'The plan that failed', cool: 1,
    cond: (p, C) => C.soldier(p), setup: after,
    text: 'General {general}\'s plan has come to nothing. {target} is not ours, and the dead are being counted. Men in your company say, loudly, that you were right. {them} can hear them.',
    choices: [
      { t: 'Say nothing. Let the dead speak', r: 'You keep your mouth shut. The men think more of you for it, and so, quietly, does {them}.', fx: { them: { op: 5 }, honor: 2 } },
      { t: 'Say it in the mess: the order was wrong', r: 'You say it where it will travel, and it travels up the line too. The men cheer you. The general does not.', fx: { fame: 1, merit: 2, them: { op: -8 }, rel: comrades(6) } },
      { t: 'Write a plain account for the general', check: { s: 'persuasion', s2: 'int', d: 50 },
        win: { r: 'Your account goes up the line, plain and without blame. It comes back with the general\'s seal and a note to watch you.', fx: { merit: 8, skill: { tactics: 1 } } },
        lose: { r: 'The general does not like to be taught. Your letter comes back unopened, and {them} is told to keep you on a short rein.', fx: { merit: -4, them: { op: -6 } } } },
    ] },

  // you obeyed, and the plan failed
  { id: 'go_blame', title: 'Blame comes down', cool: 1,
    cond: (p, C) => C.soldier(p), setup: after,
    text: 'General {general}\'s plan for {target} has failed, and blame is coming down the line the way water comes down a hill. {themFull} needs a name for the report. {theyHe} is looking at yours.',
    choices: [
      { t: 'Take your share and no more', r: 'You say what you did and what you were ordered to do, in that order. The report has both.', fx: { merit: -3, honor: 2 } },
      { t: 'Show {themHim} the order in writing', r: 'You still have the letter. {them} reads {theirHis} own seal on it and finds another name for the report.', fx: { merit: 1, them: { op: -8 } } },
      { t: 'Take the whole blame for {themHim}', r: 'You take all of it. You lose a step in the lists, and {them} owes you a thing {theyHe} will not forget.', fx: { merit: -8, them: { op: 12 }, honor: 3 } },
    ] },
]);
