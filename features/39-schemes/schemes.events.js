// Schemes, both ways (39-schemes). The core runs the plots month by month; these are the scenes: choosing one, the
// opening halfway, the last move, being found out, and the plots of the people who hate you.
const SC = () => A.SCHEMES;
const who = (p, ctx) => { const t = A.P(ctx.pid); if (!t || !t.alive) ctx.skip = true; };
const can = k => (p, C, ctx) => SC().can(p, A.P(ctx.pid), k);
// the choosing scene shows what each open scheme would take
const est = (p, ctx, ks) => {
  const t = A.P(ctx.pid); if (!t) return '';
  const NAME = { sway: 'Winning {themHim} over', befriend: 'A friendship', seduce: 'A seduction', slander: 'A whispering campaign', murder: 'A death' };
  return ks.filter(k => SC().can(p, t, k)).map(k => { const e = SC().estimate(p, t, k); return `${NAME[k]}: about ${e.months} months, and ${e.found} in 100 that {theyHe} finds you out first.`; }).join(' ');
};
const PLOT = (k, extra) => Object.assign({ scheme: { start: k } }, extra || {});

A.defEvents([
  { id: 'sch_win_choose', title: 'What you want of {them}', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p), setup: who,
    text: (p, ctx) => `You think about {them}, and what you could make of {themHim} with time and care. ${est(p, ctx, ['sway', 'befriend', 'seduce'])}`,
    choices: [
      { t: 'Win {themHim} over', req: can('sway'), r: 'You begin with small things: a greeting remembered, a door held, a word in the right ear.', fx: PLOT('sway') },
      { t: 'Make a friend of {themHim}', req: can('befriend'), r: 'You find out what {theyHe} likes, and arrange to like it too.', fx: PLOT('befriend') },
      { t: 'Seduce {themHim}', req: can('seduce'), r: 'You learn where {theyHe} goes in the evenings.', fx: PLOT('seduce') },
      { t: 'Leave it', r: 'Some people are better left as they are.', fx: {} },
    ] },

  { id: 'sch_harm_choose', title: 'What you would do to {them}', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p), setup: who,
    text: (p, ctx) => `You think about {them}, and about what it would take to bring {themHim} down. ${est(p, ctx, ['slander', 'murder'])}`,
    choices: [
      { t: 'Spread lies about {themHim}', req: can('slander'), r: 'You start with a story that is nearly true. Those travel best.', fx: PLOT('slander', { honor: -2 }) },
      { t: 'Have {themHim} killed', req: can('murder'), r: 'You begin to learn {theirHis} habits: where {theyHe} sleeps, what {theyHe} drinks, who guards the door.', fx: PLOT('murder', { honor: -5 }) },
      { t: 'Leave it', r: 'You let it go, for now. Hate keeps, and it keeps you up at night.', fx: { happy: -3 } },
    ] },

  // halfway: an opening
  { id: 'sch_opening', title: 'An opening', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p), setup: who,
    text: (p, ctx) => ({
      sway: '{them} is in trouble with {theirHis} household over money, and nobody has offered to help.',
      befriend: '{them} is going hunting on the feast day, and one of the party has dropped out.',
      seduce: '{them} has quarrelled with whoever {theyHe} was seeing, and drinks alone at the inn most nights.',
      slander: 'A clerk who keeps {them}\'s accounts owes you money and drinks too much.',
      murder: '{them} rides out alone to the same mill every week, on the same day, by the same lane.',
    }[ctx.k] || '{them} is, for a little while, within reach.') + ' It is an opening. Openings close.',
    choices: [
      { t: 'Seize it now', check: { s: 'deception', s2: 'int', d: 50 },
        win: { r: 'It goes the way you meant it to. You are much nearer than you were.', fx: { scheme: { prog: 30 } } },
        lose: { r: 'You move too fast, and {them} sees your hand in it.', fx: { scheme: { found: true } } } },
      { t: 'Wait for a better one', r: 'You let it pass. There will be others, and you are patient.', fx: { scheme: { prog: 5 } } },
      { t: 'Pay someone to make the most of it', req: p => p.coin >= 20, r: 'Twenty suns buy a servant\'s help and a servant\'s silence, for a while.', fx: { coin: -20, scheme: { prog: 15 } } },
    ] },

  // the last move
  { id: 'sch_done_sway', title: '{them} has come round', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p), setup: who,
    text: 'Months of small kindnesses, and {them} now looks for you when you come into a room. {theyHe} has no idea how it happened.',
    choices: [
      { t: 'Let it settle', r: '{them} thinks well of you now, and believes it was {theirHis} own idea.', fx: { them: { op: 25 }, scheme: { end: true } } },
      { t: 'Ask {themHim} to speak for you', r: '{them} speaks for you in company. People listen, and {theyHe} likes you a little less for having been asked.', fx: { them: { op: 12 }, fame: 2, scheme: { end: true } } },
      { t: 'Tell {themHim} it was all on purpose', r: '{them} laughs, then stops laughing. Something honest is left between you.', fx: { them: { op: 6 }, honor: 3, scheme: { end: true } } },
    ] },
  { id: 'sch_done_befriend', title: 'A friend in {them}', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p), setup: who,
    text: '{them} sends for you now when there is something to celebrate, and sometimes when there is not. It began as a plan. It does not feel like one.',
    choices: [
      { t: 'Drink to it', r: 'You drink to it, and to the next time.', fx: { them: { op: 20, type: 'friend' }, scheme: { end: true } } },
      { t: 'Swear to stand by each other', check: { s: 'persuasion', s2: 'wil', d: 45 },
        win: { r: 'You swear it over bread and salt. {theyHe} means it, and so, to your surprise, do you.', fx: { them: { op: 30, type: 'friend' }, honor: 2, scheme: { end: true } } },
        lose: { r: '{them} laughs and calls it a bit much. You are friends, if not sworn ones.', fx: { them: { op: 10, type: 'friend' }, happy: -2, scheme: { end: true } } } },
    ] },
  { id: 'sch_done_seduce', title: '{them}, late', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p), setup: who,
    text: 'The inn has emptied and {them} has not. {theyHe} says {theyHe} should go home, and does not move.',
    choices: [
      { t: 'Stay the night', r: 'You stay. In the morning neither of you pretends it was an accident.', fx: { them: { op: 20, type: 'lover' }, happy: 4, honor: -2, scheme: { end: true } } },
      { t: 'Stop at a kiss', r: 'You walk {themHim} to the door and no further. {theyHe} will think about it for a week.', fx: { them: { op: 10 }, honor: 1, scheme: { end: true } } },
    ] },
  { id: 'sch_done_slander', title: 'The story is ready', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p), setup: who,
    text: 'The story about {them} has been told in three taverns and one counting-house. It needs only a last push, and someone to be seen pushing.',
    choices: [
      { t: 'Let it run by itself', r: 'It runs. By midsummer people lower their voices when {them} goes by.', fx: { scheme: { smear: 20, end: true }, honor: -3 } },
      { t: 'Put your own name to it', check: { s: 'persuasion', s2: 'intimidation', d: 55 },
        win: { r: 'You say it to {theirHis} face, in company, and nobody doubts you. {them} is finished in this town.', fx: { scheme: { smear: 30, end: true }, fame: 2, honor: -4 } },
        lose: { r: 'You say it in company, and {them} has an answer ready. Now everyone knows who started it.', fx: { scheme: { found: true }, fame: -2 } } },
      { t: 'Whisper it at court only', r: 'A few great people hear it, and think less of {them}. The streets never do.', fx: { scheme: { smear: 10, end: true }, honor: -1 } },
    ] },
  { id: 'sch_done_murder', title: 'The day you chose', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p), setup: who,
    text: 'You know {them}\'s habits now better than {theirHis} own family does: what {theyHe} drinks, when {theyHe} rides, which door is left unbarred. It can be done this week.',
    choices: [
      { t: 'Poison at the feast', check: { s: 'intrigue', s2: 'int', d: 50 },
        win: { r: '{them} is taken ill at the high table and dies before morning. The physicians blame the eels.', fx: { scheme: { kill: 'poison in the wine', end: true }, honor: -10 } },
        lose: { r: 'A taster falls sick instead, and the cup is traced back. Not to you, not yet, but {them} knows now.', fx: { scheme: { found: true }, honor: -10 } } },
      { t: 'A hired knife in the lane', req: p => p.coin >= 60, check: { s: 'intrigue', s2: 'wil', d: 40 },
        win: { r: 'Sixty suns, and {them} is found in the lane at dawn. The knife is never found.', fx: { coin: -60, scheme: { kill: 'a knife in a dark lane', end: true }, honor: -10 } },
        lose: { r: 'The knife takes your money and talks to the watch. {them} learns whose money it was.', fx: { coin: -60, scheme: { found: true }, honor: -10 } } },
      { t: 'Call it off', r: 'You burn your notes. {them} will never know how near it came.', fx: { scheme: { end: true }, honor: 3 } },
    ] },

  // found out
  { id: 'sch_found', title: '{them} knows', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p), setup: who,
    text: (p, ctx) => ({
      sway: '{them} has worked out that your kindnesses were a campaign, and {theyHe} does not like being campaigned upon.',
      befriend: '{them} has heard you asking {theirHis} friends what {theyHe} likes. {theyHe} wants to know why.',
      seduce: '{them} has heard, from someone who enjoyed telling it, that you set out to have {themHim}.',
      slander: 'The story about {them} has been traced back, tavern by tavern, to you.',
    }[ctx.k] || '{them} has found you out.'),
    choices: [
      { t: 'Deny everything', check: { s: 'deception', s2: 'wil', d: 50 },
        win: { r: '{theyHe} half believes you. That is the best you could hope for.', fx: { them: { op: -10 } } },
        lose: { r: '{theyHe} does not believe a word, and now {theyHe} has caught you lying too.', fx: { them: { op: -35, type: 'enemy' } } } },
      { t: 'Own it, and apologise', r: 'You own it. {theyHe} is cold, but {theyHe} respects the owning.', fx: { them: { op: -15 }, honor: 2 } },
      { t: 'Let {themHim} think what {theyHe} likes', r: 'You shrug. {them} will remember the shrug longer than the plot.', fx: { them: { op: -30, type: 'rival' }, wil: 1 } },
    ] },
  { id: 'sch_found_murder', title: '{them} knows you tried', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p), setup: who,
    text: '{them} knows who wanted {themHim} dead. {theyHe} has told the people who matter, and the watch has been asking where you were.',
    choices: [
      { t: 'Run before they come', r: 'You are gone by nightfall, with what you can carry. Your name stays behind and is spoken badly.', fx: { them: { op: -60, type: 'enemy' }, fame: -5, coinPct: -20 } },
      { t: 'Stand your ground and deny it', check: { s: 'deception', s2: 'wil', d: 60 },
        win: { r: 'There is no proof, and you are hard to frighten. The watch goes away. {them} does not.', fx: { them: { op: -40, type: 'enemy' } } },
        lose: { r: 'They have the poisoner, and the poisoner has your name.', fx: { them: { op: -60, type: 'enemy' }, punish: 'attempted murder' } } },
      { t: 'Confess, and throw yourself on the law', r: 'You confess. The law is not kind, but it is quicker than {them} would be.', fx: { them: { op: -40, type: 'enemy' }, punish: 'attempted murder', honor: 4 } },
    ] },

  // their plots
  { id: 'sch_noticed', title: 'Something is wrong', trigger: true, cool: 1, npc: true,
    cond: (p, C) => C.adult(p),
    text: (p, ctx) => (ctx.k === 'murder'
      ? 'Twice this month a stranger has asked your servants when you go out, and which way you ride. Your dog was sick after eating something by the gate.'
      : 'People stop talking when you come into a room. A friend asks, carefully, whether there is any truth in it, and will not say what "it" is.'),
    choices: [
      { t: 'Find out who', check: { s: 'intrigue', s2: 'ins', d: 50 },
        win: { r: 'It takes a week of questions and some money in the right hands. You have a name.', fx: { scheme: { unmask: true } } },
        lose: { r: 'Every trail ends in a tavern and a shrug. Whoever it is, they are careful.', fx: { happy: -2 } } },
      { t: 'Double the locks and the guard', req: p => p.coin >= 15, r: 'New bars, a second man at the door, a different road each day. Whatever was coming will take longer.', fx: { coin: -15, scheme: { guard: 40 } } },
      { t: 'Put it out of your mind', r: 'You decide it is nothing. You sleep well, mostly.', fx: { happy: 2 } },
    ] },
  { id: 'sch_unmasked', title: 'It is {them}', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p), setup: who,
    text: (p, ctx) => `It is {them}. ${ctx.k === 'murder' ? '{theyHe} has paid a man to kill you, and the man is still waiting for his moment.' : '{theyHe} has been telling stories about you, and some people have started to believe them.'}`,
    choices: [
      { t: 'Confront {themHim}', check: { s: 'intimidation', s2: 'wil', d: 50 },
        win: { r: '{them} goes white and swears it is over. You believe {themHim}, because {theyHe} is frightened.', fx: { scheme: { drop: true }, them: { op: 10 } } },
        lose: { r: '{them} laughs at you. Now {theyHe} knows that you know, and will be more careful.', fx: { them: { op: -10 } } } },
      { t: 'Expose {themHim} for all to hear', r: 'You tell it in the market and at the church door. {them} is shamed, and {theyHe} will not forgive you for it.', fx: { scheme: { drop: true, expose: 10 }, them: { op: -20, type: 'enemy' } } },
      { t: 'Answer in kind', r: 'You say nothing to {themHim}, and begin a story of your own.', fx: { scheme: { drop: true, start: 'slander' }, honor: -2 } },
      { t: 'Let it go, and watch', r: 'You let {themHim} go on, and watch more closely than {theyHe} knows.', fx: { scheme: { guard: 20 }, wil: 1 } },
    ] },
  { id: 'sch_slandered', title: 'A story about you', trigger: true, cool: 1, npc: true,
    cond: (p, C) => C.adult(p), setup: who,
    text: 'The story going round {home} is about you, and it is not true, or not quite. People you have known for years are polite to you now. Someone says {them} told it first.',
    choices: [
      { t: 'Answer it in public', check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: 'You stand up at the market cross and take it apart, fact by fact. It dies there.', fx: { fame: 2, them: { op: -10 } } },
        lose: { r: 'You protest too much. People who had not heard it have heard it now.', fx: { fame: -6 } } },
      { t: 'Take {them} before a court', req: p => p.coin >= 30, r: 'The court finds for you, after thirty suns and a season. Nobody remembers the verdict, only the story.', fx: { coin: -30, fame: -2, them: { op: -20, type: 'enemy' } } },
      { t: 'Let it burn out', r: 'It burns for a year, then people find a new story. Some of the ash stays on you.', fx: { fame: -4, wil: 1 } },
    ] },
  { id: 'sch_attempt', title: 'In the lane', trigger: true, cool: 1, npc: true,
    cond: (p, C) => C.adult(p), setup: who,
    text: 'A man steps out of a doorway as you pass, and there is a knife in his hand, held low. He does not say anything. Behind you, the lane is empty.',
    choices: [
      { t: 'Fight him', check: { s: 'dagger', s2: 'str', d: 50 },
        win: { r: 'You take the knife off him and some of his fingers with it. Before the watch comes he tells you who paid: {them}.', fx: { fame: 2, them: { op: -20, type: 'enemy' } } },
        lose: { r: 'He cuts you twice before a door opens and he runs. You never see his face again.', fx: { health: -25 } } },
      { t: 'Run', check: { s: 'athletics', s2: 'spd', d: 45 },
        win: { r: 'You run, and you are quicker. You sleep somewhere else for a month.', fx: { happy: -3 } },
        lose: { r: 'He catches you at the corner. A cut in the back, and then voices, and he is gone.', fx: { health: -20 } } },
      { t: 'Shout for the watch', check: { s: 'intimidation', s2: 'wil', d: 55 },
        win: { r: 'Windows open, a dog barks, a watchman comes running, and the man is caught. He was paid by {them}.', fx: { them: { op: -20, type: 'enemy' } } },
        lose: { r: 'Nobody comes in time. He cuts you once, and is gone into the dark.', fx: { health: -15 } } },
    ] },
]);
