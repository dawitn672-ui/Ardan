// Rivals and ambition (51-arcs-rivals): thirteen story arcs on the story track of 46-life-arcs. Each scene is
// trigger-only; every choice moves the arc on (fx.arc) and leaves a mark that later scenes read (M below), changing
// what they say and what they offer. The people are real: your rival, your friend, your nephew if you have them, and
// the same person from the first scene to the last (A.ARV.cast in arcs.core.js).
(function () {
const M = (p, m) => !!(p && p.flags && p.flags['la_ar_' + m]);
const any = (p, ...ms) => ms.some(m => M(p, m));
const mk = m => ({ mark: 'ar_' + m });
const fin = m => ({ go: 'end', mark: 'ar_' + m });
const X = () => A.ARV;
const lane = (p, ctx) => X().memo(p, ctx, 'lane', () => X().lane(p));

// ---------------------------------------------------------------- the other one: a rival's rise (five scenes)
const RISE = {
  army: ['a captain\'s commission', 'the command of a regiment', 'a seat on the {rulerTitle}\'s council of war'],
  court: ['a place in the {rulerTitle}\'s household', 'a seat on the {rulerTitle}\'s council', 'the keeping of a royal castle'],
  trade: ['a share in a ship', 'a counting-house on the quay at {capital}', 'the farm of the customs at {capital}'],
  craft: ['the master\'s place you both wanted', 'the wardenship of the guild', 'a seat among the aldermen of {capital}'],
  land: ['the lease of the mill', 'the reeve\'s staff', 'the mill, the reeve\'s staff and the best farm in the parish'],
};
const rise = (ctx, i) => (RISE[ctx.lane] || RISE.land)[i];
const RIVAL = { prefer: ['rival', 'enemy'], best: 'low', make: { type: 'rival', op: -10, back: 'rival', status: 'same' } };
const riseSetup = (p, ctx) => { lane(p, ctx); X().cast(p, ctx, 'rival', RIVAL); };

// ---------------------------------------------------------------- the apprentice who passes you (five scenes)
const AGEW = { 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen', 16: 'sixteen', 17: 'seventeen' };
const PUPIL = { make: { type: 'student', back: 'mentor', op: 20, age: [14, 16], occ: 'an apprentice' } };

// ---------------------------------------------------------------- the patron who wants something back (four scenes)
const HIGHER = { serf: 'gentry', peasant: 'gentry', artisan: 'gentry', merchant: 'noble', gentry: 'noble', noble: 'noble', royal: 'noble', slave: 'merchant' };
const patron = (p, ctx) => X().cast(p, ctx, 'patron', { pick: q => A.patronOf && A.patronOf(q),
  make: q => ({ type: 'acquaint', op: 30, status: HIGHER[q.status] || 'gentry', age: X().older(q, 12, 22), coin: 2000 }) });
const PAT_HELP = {
  army: 'speaks for you to your colonel', court: 'finds you a better place in the household',
  trade: 'puts {khis} credit behind your next venture', craft: 'pays your entry to the guild',
  land: 'pays off the fine the steward laid on your family',
};
const foe = (p, ctx) => X().memo(p, ctx, 'foe', () => { let n = ''; for (let i = 0; i < 6 && (!n || n === (A.P(ctx.pid) || {}).given || n === p.given); i++) n = A.givenName(p.cult, 'M'); return n; });

// ---------------------------------------------------------------- the false friend (four scenes)
const FRIEND = { prefer: ['bestfriend', 'friend'], best: 'high', make: { type: 'friend', op: 35 } };

// ---------------------------------------------------------------- the election (four scenes)
const seat = (p, ctx) => {
  X().memo(p, ctx, 'office', () => (p.job && GD.CAREERS[p.job.c] && GD.CAREERS[p.job.c].guild ? 'warden' : A.C.town(p) ? 'alderman' : 'reeve'));
  X().memo(p, ctx, 'seat', () => (ctx.office === 'warden' ? 'warden of the guild' : `${ctx.office} of ${A.provName(p.home)}`));
  X().memo(p, ctx, 'hall', () => (ctx.office === 'warden' ? 'guildhall' : ctx.office === 'alderman' ? 'town hall' : 'church porch'));
};
const OPP = { prefer: ['rival', 'enemy'], best: 'low', make: q => ({ type: 'rival', op: -10, back: 'rival', age: X().older(q, 4, 14) }) };

// ---------------------------------------------------------------- an affair of honour (four scenes)
const SLUR = {
  army: 'that you were at the back when the line broke, and running',
  court: 'that your grandfather bought the name you carry, and paid too much for it',
  trade: 'that your scales are short and your word is shorter',
  craft: 'that your work is bought for your father\'s sake, and not for its own',
  land: 'that your word is worth what your fences are, which is nothing',
};
const DUEL = { make: { type: 'rival', op: -25, back: 'rival', status: 'same' } };
const honour = (p, ctx) => { lane(p, ctx); X().memo(p, ctx, 'slur', () => SLUR[ctx.lane] || SLUR.land); X().cast(p, ctx, 'foe', DUEL); };

// ---------------------------------------------------------------- the libel (four scenes)
const AUTHOR = { prefer: ['rival', 'enemy'], best: 'low', make: { type: 'acquaint', op: -20 } };

// ---------------------------------------------------------------- a forged charter (four scenes)
const land = (p, ctx) => {
  X().memo(p, ctx, 'stake', () => { const a = X().holding(p); return a ? a.k : ''; });
  X().memo(p, ctx, 'land', () => {
    const a = ctx.stake && (p.assets || []).find(x => x.k === ctx.stake);
    if (a) return `your ${X().short(a)}`;
    const h = A.family(p);
    return h && h.seat ? `your family's land at ${h.seat}` : 'the ground your house stands on';
  });
  X().memo(p, ctx, 'landName', () => String(ctx.land).replace(/^your family's/, "the family's").replace(/^your /, 'the ').replace(/^the ground your house/, 'the ground the house'));
};
const CLAIM = { make: { type: 'rival', op: -20, back: 'rival', status: 'gentry' } };

// ---------------------------------------------------------------- the stolen secret (four scenes)
const secret = (p, ctx) => {
  const S = X().SECRET[p.job && p.job.c] || X().SECRET.smith;
  X().memo(p, ctx, 'thing', () => S[0]);
  X().memo(p, ctx, 'epi', () => S[1]);
  X().memo(p, ctx, 'short', () => S[2]);
  X().memo(p, ctx, 'buyer', () => { const r = A.relsOf(p, ['rival', 'enemy']).find(x => x.p.alive); return r ? r.p.given : A.givenName(p.cult, 'M'); });
  X().cast(p, ctx, 'thief', { make: { type: 'student', back: 'mentor', op: 25, age: [19, 25], occ: 'a journeyman' } });
};

// ---------------------------------------------------------------- the bribe that comes due (three scenes)
const ASK = {
  army: 'that you pass the regiment\'s bread without weighing it',
  court: 'that {khis} son\'s name goes on the list for a place at court',
  trade: 'that you put your seal on {khis} bales without opening them',
  craft: 'that you put your mark on {khis} goods without looking at them',
  land: 'that you say nothing about where {khis} boundary stones have walked to',
};
const briber = (p, ctx) => { lane(p, ctx);
  X().cast(p, ctx, 'briber', { make: q => ({ type: 'acquaint', op: 10, status: 'merchant', age: X().older(q, 5, 15), coin: 1500 }) }); };

// ---------------------------------------------------------------- the vendetta at court (six scenes)
const house = (p, ctx) => {
  X().memo(p, ctx, 'house', () => {
    const mine = p.house, hs = A.realmHouses(p.realm).filter(h => h.id !== mine && h.name);
    return hs.length ? hs[(String(p.id).length + A.S.year) % hs.length].name : 'House Vane';
  });
  const h = Object.values(A.S.houses || {}).find(x => x.name === ctx.house);
  X().cast(p, ctx, 'house', { make: q => ({ type: 'rival', op: -20, back: 'rival', status: 'noble', age: X().older(q, -6, 8),
    sur: h ? A.houseSurname(h) : 'Vane', occ: `of ${ctx.house}` }) });
};

// ---------------------------------------------------------------- the usurper in your house (four scenes)
const usurper = (p, ctx) => {
  X().memo(p, ctx, 'stake', () => { const a = X().holding(p, ['manor', 'farm', 'inn', 'workshop', 'barge']); return a ? a.k : ''; });
  X().memo(p, ctx, 'place', () => (ctx.stake ? `the ${ctx.stake}` : A.C.ownShop(p) || p.job ? 'the workshop' : 'the household'));
  const t = X().cast(p, ctx, 'steward', { prefer: ['nephew', 'cousin'], best: 'high', not: q => !A.isAdult(q),
    make: { type: 'colleague', op: 30, back: 'colleague', age: [24, 32], occ: 'a steward' } });
  if (t) X().memo(p, ctx, 'kin', () => { const r = p.rel[t.id]; return r && r.type === 'nephew' ? (t.sex === 'F' ? 'niece' : 'nephew') : r && r.type === 'cousin' ? 'cousin' : ''; });
};

// ---------------------------------------------------------------- the moneylender (five scenes)
const NEED = {
  army: 'Your kit was lost in the rout, and the army wants it replaced from your own pocket',
  court: 'Your sister is to marry, and the dowry was promised in your father\'s day',
  trade: 'A cargo went down off the cape with half your money in it',
  craft: 'Your stock has spoiled in the wet, and the customers want what they paid for',
  land: 'The harvest failed, and the rent is due all the same',
};
const lender = (p, ctx) => {
  lane(p, ctx); X().memo(p, ctx, 'need', () => NEED[ctx.lane] || NEED.land);
  X().memo(p, ctx, 'stake', () => { const a = X().holding(p, ['cottage', 'townhouse', 'farm', 'hovel', 'workshop', 'inn']); return a ? a.k : ''; });
  X().memo(p, ctx, 'pledge', () => (ctx.stake ? `your ${ctx.stake}` : 'your tools'));
  X().cast(p, ctx, 'lender', { make: q => ({ type: 'acquaint', op: 0, status: 'merchant', age: X().older(q, 8, 18), occ: 'a moneylender', coin: 3000 }) });
};

A.defEvents([
  // ================================================================ THE OTHER ONE
  { id: 'ar_rise_1', title: 'The other one', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: riseSetup,
    text: (p, ctx) => `${ctx.old ? '{them} has been your rival for years.' : '{them} started out when you did, in the same place, and has kept half a step ahead of you ever since.'} This spring {khe} has got ${rise(ctx, 0)}, which you wanted. People who used to stop at your door stop at {khers} now. {khe} sends word that there is no ill will. That is how you know there is.`,
    choices: [
      { t: 'Wish {khim} well, where everyone can see', r: 'You take {khis} hand in front of half of {home}. It costs you more than it costs {khim}.', fx: { honor: 3, happy: -3, them: { op: 10 }, arc: mk('rise_grace') } },
      { t: 'Work twice as hard, and say nothing', r: 'You are up before the light and late to bed. It shows in your work, and in your face.', fx: { wil: 1, sta: 1, health: -5, arc: mk('rise_drive') } },
      { t: 'Find out what {khe} paid for it', check: { s: 'intrigue', s2: 'ins', d: 45 },
        win: { r: '{khe} borrowed against {khis} mother\'s house to get it, from a man in {capital} who does not wait.', fx: { secret: 1, arc: mk('rise_dirt') } },
        lose: { r: 'Someone tells {khim} you were asking. {khe} tells the story in company, and tells it well.', fx: { honor: -2, them: { op: -10 }, arc: mk('rise_nosy') } } },
    ] },
  { id: 'ar_rise_2', title: 'Higher still', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: riseSetup,
    text: (p, ctx) => `{them} has risen again: ${rise(ctx, 1)}. ${M(p, 'rise_grace') ? '{khe} remembers who took {khis} hand, and asks if you will work for {khim}. The pay is good.'
      : M(p, 'rise_drive') ? 'You have done well on your own, though not so well. {khe} has noticed, and does not like being chased.'
      : M(p, 'rise_dirt') ? 'The debt in {capital} is still unpaid. You may be the only one who knows.'
      : '{khe} has not forgotten your questions, and has made sure others remember them.'} Now a man who wants {khis} place comes to ask what you know of {khim}.`,
    choices: [
      { t: 'Take the work {khe} offers', req: p => M(p, 'rise_grace'), r: 'You go to work for the one you meant to beat. The money comes on time. The evenings are long.', fx: { coin: 120, happy: -5, them: { op: 10 }, arc: mk('rise_served') } },
      { t: 'Tell him about the debt in {capital}', req: p => M(p, 'rise_dirt'), r: 'He pays for the wine and thanks you. Before the year is out, the man in {capital} calls the debt in.', fx: { coin: 30, honor: -4, them: { op: -15 }, arc: mk('rise_told') } },
      { t: 'Speak against {khim}, carefully', check: { s: 'persuasion', s2: 'int', d: 50 },
        win: { r: 'You say little and make it count. Doors that opened for {khim} open a little slower.', fx: { fame: 1, them: { op: -10 }, arc: mk('rise_spoke') } },
        lose: { r: 'You say too much. It reaches {khim} by the next market day, with additions.', fx: { honor: -3, them: { op: -20 }, arc: mk('rise_spoke') } } },
      { t: 'Say you have nothing to say', r: 'The man goes away with nothing. He tells people you are loyal, or afraid.', fx: { honor: 2, happy: -1, arc: mk('rise_silent') } },
    ] },
  { id: 'ar_rise_3', title: 'Too heavy', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: riseSetup,
    text: (p, ctx) => `{them} has ${rise(ctx, 2)} now, and it is too heavy for {khim}. ${M(p, 'rise_told') ? 'The man in {capital} has called in the debt, and all of {home} knows it.'
      : M(p, 'rise_served') ? 'You keep {khis} books. You can see how close to the edge it runs.'
      : '{khis} creditors are at the door, and {khe} has taken to drinking in the afternoons.'} {khe} comes to you${M(p, 'rise_served') ? '' : ', of all people,'} and asks for help.`,
    choices: [
      { t: 'Lend {khim} what {khe} needs', req: p => p.coin >= 150, r: 'You put the money in {khis} hand. {khe} counts it twice and cannot find the words.', fx: { coin: -150, them: { op: 25 }, arc: mk('rise_lent') } },
      { t: 'Refuse {khim}, to {khis} face', r: 'You tell {khim} no. {khe} nods, as if {khe} had expected nothing else.', fx: { happy: 2, honor: -1, them: { op: -10 }, arc: mk('rise_refused') } },
      { t: 'Buy up {khis} debts cheap, and wait', check: { s: 'trade', s2: 'int', d: 50 },
        win: { r: 'You buy {khis} notes at a third of their face. Now it is you {khe} owes.', fx: { coin: 60, them: { op: -15 }, arc: mk('rise_owned') } },
        lose: { r: 'Someone with deeper pockets had the same idea. You are left holding the worst of the paper.', fx: { coin: -60, arc: mk('rise_refused') } } },
    ] },
  { id: 'ar_rise_4', title: 'Up, or down', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: riseSetup,
    text: (p, ctx) => (M(p, 'rise_lent') ? `{them} came through, on your money. {khe} has kept what {khe} had, and pays you back in coin and in favours, which you had not expected. Now {khe} offers you a share in all of it.`
      : M(p, 'rise_owned') ? '{them} pays you on every quarter day, in person, and hates every coin of it. Today {khe} asks you to forgive what is left.'
      : `{them} lost ${rise(ctx, 2)}, and the house with it. People stop at your door again. {khe} lives in two rooms over a chandler's now, and asks you for work.`),
    choices: [
      { t: 'Take the share {khe} offers', req: p => M(p, 'rise_lent'), r: 'You take it. Your fortunes are tied to {khers} now, for good or ill.', fx: { coin: 100, them: { op: 5 }, arc: mk('rise_partner') } },
      { t: 'Collect it, to the last coin', req: p => M(p, 'rise_owned'), r: 'You collect it all, on time, every time. {khe} stops looking you in the eye.', fx: { coin: 120, honor: -2, them: { op: -20 }, arc: mk('rise_collected') } },
      { t: p => (M(p, 'rise_lent') ? 'Forgive the loan, and take no share' : M(p, 'rise_owned') ? 'Forgive what is left of the debt' : 'Give {khim} work, at a fair wage'),
        r: 'It costs you. {khe} knows exactly what it costs you, which is the point.', fx: { coin: -50, honor: 2, them: { op: 25 }, arc: mk('rise_kind') } },
      { t: 'Let {khim} watch you prosper', req: p => !M(p, 'rise_lent') && !M(p, 'rise_owned'), r: 'You say no, kindly, and buy a new coat. {khe} sees it on you at church.', fx: { happy: 4, them: { op: -15 }, arc: mk('rise_gloat') } },
    ] },
  { id: 'ar_rise_5', title: 'Two old dogs', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { riseSetup(p, ctx); ctx.yrs = X().years(p, ctx); },
    text: (p, ctx) => `It is {yrs} years since {them} got ${rise(ctx, 0)}. You are both grey at the temples. ${any(p, 'rise_partner', 'rise_kind') ? '{khe} sends a cask at midwinter now, and you send one back.'
      : M(p, 'rise_collected') ? '{khe} crosses the road rather than pass you.'
      : M(p, 'rise_gloat') ? '{khe} still lives over the chandler\'s, and still does not look at your door.' : ''} At a wedding you find yourselves at the same table, with one empty chair between you.`,
    choices: [
      { t: 'Take the chair, and call it done', r: 'You sit. You talk about the old days, which were not good, and laugh anyway. Whatever it was, it is over.',
        fx: { happy: 4, them: { op: 40, type: 'friend', back: 'friend' }, arDeed: 'Made peace with {themFull}, a rival of {yrs} years', arc: fin('rise_peace') } },
      { t: 'Keep the chair between you', r: '{khe} raises a cup to you across it. You raise yours. Neither of you means it kindly, and both of you go home sharper.',
        fx: { wil: 1, them: { op: -30, type: 'enemy', back: 'enemy' }, trait: 'ambitious', arc: fin('rise_feud') } },
      { t: 'Leave before the toasts', r: 'You walk home the long way. You find you no longer much care what {khe} has. It surprises you.',
        fx: { happy: 2, trait: 'content', arDeed: 'Outgrew a rivalry with {themFull}', arc: fin('rise_let') } },
    ] },

  // ================================================================ THE APPRENTICE
  { id: 'ar_pupil_1', title: 'A pair of hands', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p) && C.job(p),
    setup: (p, ctx) => { const t = X().cast(p, ctx, 'pupil', PUPIL); if (t) ctx.agew = AGEW[Math.round(A.age(t) * 16 / GD.RACES[t.race].adult)] || 'not yet grown'; },
    text: '{them} is {agew}, all elbows and appetite, sent to you by a widow who cannot feed {khim} any longer. {khe} breaks something the first day. By the third {khe} has worked out how it was made, and mended it, without being asked. You have had apprentices before. None of them did that.',
    choices: [
      { t: 'Teach {khim} everything you know', r: 'You show {khim} the tricks it took you twenty years to find. {khe} eats them like bread.', fx: { happy: 2, coin: -20, them: { op: 15 }, arc: mk('pupil_all') } },
      { t: 'Teach the work, and keep the secrets', r: 'You teach {khim} what any master would. The rest stays in your head, where it earns its keep.', fx: { coin: 20, them: { op: 5 }, arc: mk('pupil_half') } },
      { t: 'Work {khim} hard, as you were worked', r: '{khe} sweeps, carries and fetches from dark to dark. {khe} does not complain. {khe} does not smile either.', fx: { coin: 40, wil: 1, them: { op: -10 }, arc: mk('pupil_hard') } },
    ] },
  { id: 'ar_pupil_2', title: 'Asked for by name', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p) && C.job(p),
    setup: (p, ctx) => X().cast(p, ctx, 'pupil', PUPIL),
    text: p => `{them} is quicker than you were at that age. People who come to your door have started asking for {khim} by name. ${M(p, 'pupil_all') ? '{khe} does things your way, and then a little better.'
      : M(p, 'pupil_half') ? '{khe} has worked out some of what you kept back, alone, at night, by candle-ends.'
      : '{khe} does exactly what {khe} is told, and not one thing more.'} Now a big commission comes in: work that will be talked about.`,
    choices: [
      { t: 'Give {khim} the commission, and the credit', r: 'It goes out under {khis} name and yours. Folk talk about it, mostly about {khim}.', fx: { coin: 40, happy: -2, them: { op: 15 }, arc: mk('pupil_credit') } },
      { t: 'Do it yourself; {khe} can watch', r: 'You do it yourself, and well. {khe} watches with {khis} arms folded.', fx: { coin: 60, them: { op: -10 }, arc: mk('pupil_held') } },
      { t: 'Each of you does one; the buyer chooses', check: { s: 'int', s2: 'wil', d: 50 },
        win: { r: 'Yours is chosen, just. {khe} sees why before you say a word.', fx: { coin: 50, fame: 2, them: { op: 5 }, arc: mk('pupil_won') } },
        lose: { r: 'The buyer takes {khers}. You both know the buyer was right, and you learn something from it.', fx: { happy: -5, int: 1, them: { op: 5 }, arc: mk('pupil_beaten') } } },
    ] },
  { id: 'ar_pupil_3', title: 'The offer across the river', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p) && C.job(p),
    setup: (p, ctx) => X().cast(p, ctx, 'pupil', PUPIL),
    text: p => `A rival master across the river has offered {them} a journeyman's wage and a room of {khis} own. ${M(p, 'pupil_credit') ? '{khe} would rather stay, {khe} says, if staying means something.'
      : M(p, 'pupil_held') ? '{khe} does not ask your leave. {khe} tells you, and waits to see what you will do.'
      : M(p, 'pupil_beaten') ? 'Since the day the buyer chose {khis} work, {khe} has known what {khe} is worth.'
      : '{khe} has not forgotten that the buyer chose yours. {khe} asks what you think.'} {khis} indentures have two years to run.`,
    choices: [
      { t: 'Match the offer, from your own pocket', req: p => p.coin >= 100, r: 'You pay {khim} a journeyman\'s wage two years early. {khe} stays.', fx: { coin: -100, them: { op: 15 }, arc: mk('pupil_kept') } },
      { t: 'Let {khim} go, with your blessing', r: '{khe} goes across the river with your good word and your second-best tools.', fx: { happy: -3, honor: 2, them: { op: 25 }, arc: mk('pupil_freed') } },
      { t: 'Hold {khim} to {khis} indentures', check: { s: 'persuasion', s2: 'wil', d: 45 },
        win: { r: 'The paper holds. {khe} stays, and works two years without a word to spare.', fx: { coin: 60, them: { op: -25 }, arc: mk('pupil_bound') } },
        lose: { r: 'A flaw is found in the indenture. {khe} goes, and tells everyone why.', fx: { honor: -2, them: { op: -30 }, arc: mk('pupil_lost') } } },
    ] },
  { id: 'ar_pupil_4', title: 'The better name', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p) && C.job(p),
    setup: (p, ctx) => X().cast(p, ctx, 'pupil', PUPIL),
    text: p => `${M(p, 'pupil_kept') ? '{them} still works under your roof. Most of what goes out with your mark is {khers} now. A lord sends for "the master", and means {khim}.'
      : M(p, 'pupil_freed') ? '{them} has a place of {khis} own across the river, and more custom than you. {khe} still sends you the hard work, and the hard customers.'
      : '{them} has a place of {khis} own across the river, and more custom than you. {khe} has done well out of spite, and says so.'} Your hands are slower than they were. They tell you so in the mornings.`,
    choices: [
      { t: 'Offer {khim} a partnership', req: p => !any(p, 'pupil_bound', 'pupil_lost'), r: 'You put both names over the door. Yours comes first, for now, and the profit is halved.', fx: { coin: 60, happy: -3, them: { op: 15 }, arc: mk('pupil_partner') } },
      { t: 'Offer {khim} a partnership, and an apology', req: p => any(p, 'pupil_bound', 'pupil_lost'), check: { s: 'persuasion', s2: 'wil', d: 55 },
        win: { r: '{khe} makes you say it twice. Then {khe} shakes your hand, and both names go over the door.', fx: { coin: 60, happy: -4, them: { op: 30 }, arc: mk('pupil_partner') } },
        lose: { r: '{khe} hears you out and says no. {khe} says it pleasantly, which is worse.', fx: { happy: -5, arc: mk('pupil_spurned') } } },
      { t: 'Compete with {khim}, openly', check: { s: 'int', s2: 'wil', d: 55 },
        win: { r: 'You undercut {khim} for a season and win back the best of your custom. You are tired in a way that does not lift.', fx: { coin: 120, fame: 3, health: -5, arc: mk('pupil_fought') } },
        lose: { r: 'You undercut {khim}; {khe} undercuts you back, and {khe} is younger.', fx: { coin: -60, happy: -4, wil: 1, arc: mk('pupil_fought') } } },
      { t: 'Ask {khim} to show you the new way', r: '{khe} shows you, patiently, the way you once showed {khim}. It is hard to listen. You listen.', fx: { int: 1, happy: -3, them: { op: 20 }, arc: mk('pupil_learned') } },
    ] },
  { id: 'ar_pupil_5', title: 'The old master', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => X().cast(p, ctx, 'pupil', PUPIL),
    text: p => `${M(p, 'pupil_partner') ? 'The two names have been over the door for years now.'
      : M(p, 'pupil_fought') ? 'You and {them} have competed so long that the town takes sides at weddings.'
      : M(p, 'pupil_learned') ? 'You work the new way now, mostly. {them} still drops by to see that you do.'
      : '{them} would not share a door with you, and has not set foot in yours since.'} You are old for the work. What becomes of it cannot wait much longer.`,
    choices: [
      { t: 'Leave the work to {them}', r: 'You sign it over before witnesses. {khe} does not speak for a while, and then speaks too much.',
        fx: { honor: 3, them: { op: 30 }, arDeed: 'Left the work to {themFull}, who came as an apprentice', arc: fin('pupil_heir') } },
      { t: 'Keep it in your own hands to the end', r: 'You keep the keys on your belt and work until your hands give out. It is yours, every inch.',
        fx: { coin: 80, them: { op: -10 }, trait: 'stubborn', arDeed: 'Kept the work in your own hands to the end', arc: fin('pupil_mine') } },
      { t: 'Sell up, and buy a cottage with a garden', r: 'You sell all but your best tools, and grow beans. People still come for your advice. You give it slowly.',
        fx: { happy: 6, asset: 'cottage', arDeed: 'Gave up the work and retired to a cottage', arc: fin('pupil_retired') } },
    ] },

  // ================================================================ THE PATRON
  { id: 'ar_patron_1', title: 'A friend above you', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { lane(p, ctx); patron(p, ctx); },
    text: (p, ctx) => `{themFull}, {themOcc}, has taken an interest in you. {khe} ${PAT_HELP[ctx.lane] || PAT_HELP.land}, and asks nothing for it. "Nothing yet," {khe} says, and smiles as if it were a joke. People like {khim} do not make jokes.`,
    choices: [
      { t: 'Take it, with thanks', r: 'You take it. {khe} waves your thanks away, which you will remember later.', fx: { coin: 60, merit: 5, oweThem: 1, them: { op: 10 }, arc: mk('pat_took') } },
      { t: 'Take the help, but pay back the money', r: 'You pay back what can be paid in coin. The rest cannot be, and you both know it.', fx: { coin: -30, merit: 5, honor: 2, arc: mk('pat_paid') } },
      { t: 'Refuse, politely', r: '{khe} is surprised, and then amused. "Another time," {khe} says.', fx: { honor: 3, them: { op: -10 }, arc: mk('pat_refused') } },
    ] },
  { id: 'ar_patron_2', title: 'A small thing', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => patron(p, ctx),
    text: p => `${M(p, 'pat_took') ? 'It is a while since {them} paid for things.' : M(p, 'pat_paid') ? 'You paid back the money, but {them} has not forgotten the rest.' : 'You refused {them} once. {khe} asks anyway, as if to see what you are made of.'} {khe} wants a small thing: that you tell the magistrate you saw {khis} men at the boundary stone on a day you did not. A neighbour's field hangs on it.`,
    choices: [
      { t: 'Say what {khe} wants said', r: 'You swear to it. The magistrate believes you. The neighbour loses his field and does not look at you again.', fx: { honor: -5, coin: 40, them: { op: 15 }, arc: mk('pat_lied') } },
      { t: 'Say what you saw, and nothing more', r: 'You tell the truth, which helps nobody. {them} hears of it by supper.', fx: { honor: 3, them: { op: -15 }, arc: mk('pat_truth') } },
      { t: 'Be away from home that week', r: 'You find business elsewhere. The case goes on without you. Everyone knows why you went.', fx: { coin: -20, happy: -2, them: { op: -5 }, arc: mk('pat_away') } },
    ] },
  { id: 'ar_patron_3', title: 'The real price', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { patron(p, ctx); foe(p, ctx); },
    text: p => `${M(p, 'pat_lied') ? '{them} has been generous since the boundary case: a gift at midwinter, a word in the right ear.' : '{them} has been cool with you since the boundary case.'} Now {khe} wants something larger. {khe} has a rival, {foe}, a wool merchant, and wants {foe}'s letters. {foe} trusts you; you were children together. You are the one person who could walk into that house and out again.`,
    choices: [
      { t: 'Fetch the letters', check: { s: 'stealth', s2: 'deception', d: 50 },
        win: { r: 'You take them from the chest while {foe} pours the wine. {them} reads them that night.', fx: { honor: -4, coin: 80, them: { op: 20 }, arc: mk('pat_fetched') } },
        lose: { r: '{foe} comes back for the jug and finds you at the chest. Neither of you says anything. Neither of you needs to.', fx: { honor: -6, them: { op: -10 }, arc: mk('pat_caught') } } },
      { t: 'Warn {foe} instead', r: '{foe} burns the letters and presses a purse on you. {them} hears the letters are gone, and guesses why.', fx: { honor: 2, coin: 30, them: { op: -25 }, arc: mk('pat_warned') } },
      { t: 'Tell {them} you will do no more', r: '{khe} hears you out and nods. "No more," {khe} agrees. It sounds like a door shutting.', fx: { honor: 3, happy: 2, them: { op: -20 }, arc: mk('pat_done') } },
    ] },
  { id: 'ar_patron_4', title: 'Paid in full', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { patron(p, ctx); foe(p, ctx); },
    text: p => (M(p, 'pat_fetched')
      ? '{them} owns a good part of you now, and knows it. {khe} asks for the last thing: that you kneel in {khis} hall before witnesses and swear to be {khers} in all things.'
      : M(p, 'pat_caught') ? '{foe} has told half of {home} what you were doing at the chest, and {them} has said nothing in your defence. {khe} sends for you all the same: kneel and swear to {khim}, and it all goes away.'
      : '{them} has let it be known that you are ungrateful. Doors are closing. {khe} sends word: kneel in {khis} hall and swear to be {khers}, and they will open again.'),
    choices: [
      { t: 'Kneel, and swear', r: 'You kneel on cold stone and say the words. {khe} raises you up and embraces you. You are {khers} now.',
        fx: { sworn: 1, coin: 100, honor: -3, them: { op: 30 }, arDeed: 'Swore to be the sworn follower of {themFull}', arc: fin('pat_sworn') } },
      { t: 'Pay back every coin, and owe {khim} nothing', req: p => p.coin >= 150, r: 'You count it out on {khis} table. {khe} lets you. You walk out owing no one, and with fewer friends.',
        fx: { coin: -150, honor: 4, oweThem: -3, them: { op: -15 }, flag: 'ar_own_man', arDeed: 'Paid off {themFull} and owed no one', arc: fin('pat_free') } },
      { t: 'Tell the magistrate what {khe} had you do', check: { s: 'persuasion', s2: 'int', d: 55 },
        win: { r: 'The magistrate listens, and then the {rulerTitle}\'s justices. {them} is fined and shamed, and does not forgive you.', fx: { honor: 5, fame: 3, oweThem: -3, them: { op: -40, type: 'enemy', back: 'enemy' }, flag: 'ar_patron_broken', arc: fin('pat_exposed') } },
        lose: { r: '{khe} has friends on the bench. You are fined for slander, and {khe} is your enemy besides.', fx: { coin: -60, honor: -2, oweThem: -3, them: { op: -40, type: 'enemy', back: 'enemy' }, flag: 'ar_patron_broken', arc: fin('pat_exposed') } } },
    ] },

  // ================================================================ THE FALSE FRIEND
  { id: 'ar_false_1', title: 'Questions', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => X().cast(p, ctx, 'friend', FRIEND),
    text: (p, ctx) => `${ctx.old ? '{them} has been your friend for years, and stood by you when it counted.' : '{them} came to {home} last year and made {khim}self useful: a loan here, a hand there, an evening by your fire.'} Lately {khe} asks a great many questions about your affairs: what you paid for things, who owes you, where you keep the box. Friends ask such things. You have answered most of them.`,
    choices: [
      { t: 'Answer, as a friend would', r: 'You tell {khim} what {khe} asks. It is pleasant to be asked.', fx: { happy: 3, them: { op: 5 }, arc: mk('false_open') } },
      { t: 'Turn the questions back on {khim}', check: { s: 'ins', s2: 'persuasion', d: 45 },
        win: { r: '{khe} turns them aside, but not before you learn {khe} has been meeting a man from {capital} who buys debts.', fx: { wil: 1, arc: mk('false_wary') } },
        lose: { r: '{khe} laughs and says you think like a bailiff. You end up apologising.', fx: { happy: -2, them: { op: 5 }, arc: mk('false_open') } } },
      { t: 'Keep your affairs to yourself', r: 'You change the subject. {khe} lets you, a little too easily.', fx: { wil: 1, them: { op: -5 }, arc: mk('false_closed') } },
    ] },
  { id: 'ar_false_2', title: 'Something missing', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => X().cast(p, ctx, 'friend', FRIEND),
    text: p => `${M(p, 'false_wary') ? 'The man from {capital} who buys debts has bought yours, all of them, at a good price. He knew exactly which to buy.'
      : M(p, 'false_closed') ? 'Someone has been telling {home} your business. It is half wrong, which means it came at second hand.'
      : 'A buyer you have dealt with for ten years has gone elsewhere, at a price only someone who knew yours could have offered. Only {them} knew yours.'}`,
    choices: [
      { t: 'Have it out with {them}', check: { s: 'ins', s2: 'wil', d: 50 },
        win: { r: '{khe} denies it, badly. You have known {khim} too long not to see it.', fx: { honor: 1, them: { op: -20 }, arc: mk('false_known') } },
        lose: { r: '{khe} is hurt, or plays it well. You end up buying the next jug.', fx: { coin: -5, happy: -3, them: { op: 5 }, arc: mk('false_fooled') } } },
      { t: 'Tell {khim} a secret that is not true', check: { s: 'deception', s2: 'int', d: 50 },
        win: { r: 'The false secret is all over {home} within the week. Only {them} had it.', fx: { int: 1, arc: mk('false_proved') } },
        lose: { r: 'The secret goes nowhere. Either {khe} is innocent, or careful.', fx: { happy: -1, arc: mk('false_fooled') } } },
      { t: 'Say nothing, and watch', r: 'You keep your face pleasant and your eyes open. It is tiring.', fx: { wil: 1, happy: -3, arc: mk('false_watch') } },
    ] },
  { id: 'ar_false_3', title: 'What was owed', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => X().cast(p, ctx, 'friend', FRIEND),
    text: p => (any(p, 'false_known', 'false_proved') ? '{them} comes to you at last, sober and frightened. {khe} owes money to a man in {capital}, and has been paying him in your affairs. {khe} asks you to forgive {khim}.'
      : M(p, 'false_fooled') ? 'A stranger tells you, over a cup: {them} has been selling your affairs to a man in {capital} for years. {khe} does not know that you know.'
      : 'Watching pays. You see {them} hand a folded letter to a rider bound for {capital}, and you see the rider pay {khim}.'),
    choices: [
      { t: 'Forgive {khim}, this once', r: 'You forgive {khim}. {khe} weeps, which you had not expected, and swears it is over.', fx: { honor: 2, happy: -2, them: { op: 20 }, arc: mk('false_forgave') } },
      { t: 'Feed {khis} paymaster lies, through {khim}', check: { s: 'deception', s2: 'int', d: 50 },
        win: { r: 'For a season the man in {capital} buys what you want him to believe. It pays.', fx: { coin: 80, honor: -2, arc: mk('false_turned') } },
        lose: { r: 'The man in {capital} sees through it, and so does {them}. {khe} stops coming by.', fx: { coin: -30, them: { op: -20 }, arc: mk('false_broke') } } },
      { t: 'Break with {khim}, in front of everyone', r: 'You tell {khim} what {khe} is, loudly, before witnesses. {home} takes your side, mostly.', fx: { honor: 2, fame: 1, happy: -4, them: { op: -40 }, arc: mk('false_broke') } },
    ] },
  { id: 'ar_false_4', title: 'A sickbed', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => X().cast(p, ctx, 'friend', FRIEND),
    text: p => `${M(p, 'false_forgave') ? '{them} has kept faith since, or seems to. You still notice when {khe} asks a question.'
      : M(p, 'false_turned') ? 'The game with the man in {capital} is over. {them} played it with you to the end, which is a kind of loyalty.'
      : '{them} keeps away, mostly. When you meet, it is {khe} who looks away first.'} This winter {khe} is ill, and sends a boy to ask if you will come.`,
    choices: [
      { t: 'Go, and take {khim} as {khe} is', r: 'You sit by {khis} bed and talk about nothing. Whatever {khe} was, {khe} is your friend.',
        fx: { them: { op: 35, type: 'friend', back: 'friend' }, trait: 'forgiving', arc: fin('false_kept') } },
      { t: 'Send the boy back with nothing', r: 'You send the boy back. {khe} mends, and does not send again.',
        fx: { wil: 1, them: { op: -40, type: 'enemy', back: 'enemy' }, arc: fin('false_enemy') } },
      { t: 'Go, but never trust so easily again', r: 'You go, and you are kind. You also move your box, and tell no one where, and that habit stays.',
        fx: { them: { op: 10 }, trait: 'paranoid', arDeed: 'Found out {themFull}, and trusted less after', arc: fin('false_wary_end') } },
    ] },

  // ================================================================ THE ELECTION
  { id: 'ar_elec_1', title: 'The empty chair', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { seat(p, ctx); X().cast(p, ctx, 'opp', OPP); },
    text: p => `The old {office} died at Candlemas, and the office of {seat} is empty. Three men come to ask you to stand${p.flags.ar_own_man ? ', because you owe nobody' : p.flags.ar_cleared ? ', because the justices cleared your name' : ''}. {them} is standing too, and has been buying drinks since the funeral.`,
    choices: [
      { t: 'Stand, and promise to lower the dues', r: 'The promise goes down well. You will have to keep it, or be remembered for not keeping it.', fx: { fame: 2, honor: -1, arc: mk('elec_promise') } },
      { t: 'Stand on your name, and promise nothing', r: 'You promise nothing. The old men like it. The young ones wonder what you are for.', fx: { honor: 2, arc: mk('elec_name') } },
      { t: 'Stand, and buy the votes you need', req: p => p.coin >= 100, r: 'You buy them quietly, a few at a time: a debt let go here, a cask there.', fx: { coin: -100, honor: -3, arc: mk('elec_bought') } },
    ] },
  { id: 'ar_elec_2', title: 'The count', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { seat(p, ctx); X().cast(p, ctx, 'opp', OPP); },
    text: p => `The vote is at Michaelmas, in the {hall}. ${M(p, 'elec_promise') ? '{them} tells everyone you have promised what you cannot pay for.'
      : M(p, 'elec_bought') ? 'You have bought enough votes to win, if they stay bought. {them} is buying too.'
      : '{them} tells everyone you are too proud to ask for a vote.'} The night before, {khe} sends a friend to ask what it would take for you to stand down.`,
    choices: [
      { t: 'Speak before the vote', req: p => !M(p, 'elec_bought'), check: { s: 'persuasion', s2: 'int', d: 50 },
        win: { r: 'You speak plainly, and not too long. The hands go up for you.', fx: { fame: 3, them: { op: -10 }, arc: mk('elec_won') } },
        lose: { r: '{them} speaks after you, and better. The hands go up for {khim}.', fx: { happy: -4, arc: mk('elec_lost') } } },
      { t: 'Make sure the bought votes stay bought', req: p => M(p, 'elec_bought'), check: { s: 'intrigue', s2: 'persuasion', d: 35 },
        win: { r: 'They stay bought. You win by eleven.', fx: { fame: 2, honor: -2, them: { op: -15 }, arc: mk('elec_won') } },
        lose: { r: 'Some of them take {khis} money as well, and vote for {khim}. You lose, and have paid for it.', fx: { happy: -5, arc: mk('elec_lost') } } },
      { t: 'Visit every voter at home first', check: { s: 'persuasion', s2: 'sta', d: 40 },
        win: { r: 'You walk every lane in {home} and drink at every table. You win, and are ill for a week.', fx: { health: -5, coin: -20, them: { op: -10 }, arc: mk('elec_won') } },
        lose: { r: 'You walk every lane and drink at every table. They drink your health and vote for {them}.', fx: { health: -5, coin: -20, arc: mk('elec_lost') } } },
      { t: 'Name your price to stand down', r: 'You stand down for a purse and a seat on the council. {them} wins unopposed.', fx: { coin: 120, honor: -2, them: { op: 20 }, arc: mk('elec_sold') } },
    ] },
  { id: 'ar_elec_3', title: 'The accounts', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { seat(p, ctx); X().cast(p, ctx, 'opp', OPP); },
    text: p => (M(p, 'elec_won') ? `You are {seat}. The first thing on the table is the dues, and {them} sits at the back of the {hall}, waiting for you to fail.${M(p, 'elec_promise') ? ' You promised to lower them.' : ''} The roof leaks onto the table while you read.`
      : `{them} is {seat}. ${M(p, 'elec_sold') ? 'You have your seat on the council, and your purse, and {khis} accounts in front of you.' : '{khe} has asked you onto the council, to show there are no hard feelings.'} The accounts do not add up.`),
    choices: [
      { t: 'Lower the dues, and pay for the roof yourself', req: p => M(p, 'elec_won'), r: 'You keep your word, with your own money. People notice, and say so.', fx: { coin: -80, fame: 3, honor: 2, arc: mk('elec_kept') } },
      { t: 'Raise the dues; the roof comes first', req: p => M(p, 'elec_won'), r: 'The roof is mended, by your cousin, at a good price for your cousin. Your name is cursed in every house that pays.', fx: { coin: 30, fame: -2, honor: -2, arc: mk('elec_roof') } },
      { t: 'Go through {khis} accounts line by line', req: p => !M(p, 'elec_won'), check: { s: 'int', s2: 'trade', d: 50 },
        win: { r: 'Thirty {coinName}s a year have been going to {khis} brother-in-law. You can prove it.', fx: { fame: 2, them: { op: -20 }, arc: mk('elec_found') } },
        lose: { r: 'You find nothing you can prove. {khe} thanks you for your trouble, with a smile.', fx: { happy: -3, arc: mk('elec_sore') } } },
      { t: 'Help {khim} put them right', req: p => !M(p, 'elec_won'), r: 'You sit up three nights with {khim} over the figures. It is not what either of you expected.', fx: { honor: 2, health: -2, them: { op: 20 }, arc: mk('elec_helped') } },
    ] },
  { id: 'ar_elec_4', title: 'The next election', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { seat(p, ctx); X().cast(p, ctx, 'opp', OPP); },
    text: p => (M(p, 'elec_won') ? `Your term is up. ${M(p, 'elec_kept') ? 'They have not forgotten the roof you paid for.' : 'They have not forgotten the dues.'} {them} is standing against you again, and this time {khe} has {khis} speech written out.`
      : M(p, 'elec_found') ? 'The election comes round again. Everyone knows what you found in the accounts. {them} is standing anyway, and so, they say, should you.'
      : 'The election comes round again. {them} stops you after church and asks for your vote, and your hand on it.'),
    choices: [
      { t: 'Stand on what you have done', req: p => any(p, 'elec_kept', 'elec_found'), check: { s: 'persuasion', s2: 'int', d: 40 },
        win: { r: 'You win, and the second time means more than the first. They will call you {office} after you are dead.', fx: { fame: 4, rep: 3, flag: 'ar_seat', arDeed: 'Chosen {seat}', arc: fin('elec_seat') } },
        lose: { r: 'You lose by a handful. You go home and sleep better than you have in years.', fx: { happy: 2, trait: 'humble', arDeed: 'Stood for {seat}, and lost', arc: fin('elec_out') } } },
      { t: 'Stand against {khim}', req: p => !any(p, 'elec_kept', 'elec_found'), check: { s: 'persuasion', s2: 'int', d: 55 },
        win: { r: 'You win. {them} shakes your hand on the steps, and means about half of it.', fx: { fame: 4, rep: 3, flag: 'ar_seat', arDeed: 'Chosen {seat}', arc: fin('elec_seat') } },
        lose: { r: 'You lose by a handful. You go home and sleep better than you have in years.', fx: { happy: 2, trait: 'humble', arDeed: 'Stood for {seat}, and lost', arc: fin('elec_out') } } },
      { t: 'Back {them}, and say so', r: 'You stand beside {khim} in the {hall} and raise your hand for {khim}. It costs you less than you feared.',
        fx: { honor: 2, them: { op: 30, type: 'friend', back: 'friend' }, arDeed: 'Gave way to {themFull} for the good of {home}', arc: fin('elec_backed') } },
      { t: 'Never stand for anything again', r: 'You tell them you are done with it. It is the first promise you have kept without trying.',
        fx: { happy: 4, trait: 'content', arDeed: 'Gave up standing for office', arc: fin('elec_done') } },
    ] },

  // ================================================================ AN AFFAIR OF HONOUR
  { id: 'ar_hon_1', title: 'Words at table', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: honour,
    text: 'At the midsummer feast, {them} says in the hearing of twenty people {slur}. The table goes quiet. Somebody laughs, then stops. Everyone is looking at you to see what it is worth.',
    choices: [
      { t: 'Demand satisfaction, there and then', r: 'You stand and say the words. The room breathes out. {them} bows, smiling.', fx: { honor: 3, them: { op: -15 }, arc: mk('hon_challenged') } },
      { t: 'Answer with something sharper', check: { s: 'persuasion', s2: 'int', d: 50 },
        win: { r: 'Your answer gets the bigger laugh. {them} smiles too, with {khis} mouth only.', fx: { fame: 2, them: { op: -15 }, arc: mk('hon_wit') } },
        lose: { r: 'Your answer falls flat. The laugh, when it comes, is {khers}.', fx: { honor: -3, happy: -3, arc: mk('hon_flat') } } },
      { t: 'Let it pass', r: 'You go on eating. The meat tastes of nothing.', fx: { honor: -4, wil: 1, arc: mk('hon_passed') } },
    ] },
  { id: 'ar_hon_2', title: 'First light', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: honour,
    text: p => `${M(p, 'hon_challenged') ? 'It takes a year of letters, duels being forbidden by the {rulerTitle}, but it is arranged: a field beyond {home}, swords, first blood to end it.'
      : M(p, 'hon_wit') ? '{them} has not forgiven the laugh. A year to the day after the feast, {khis} cousin brings you a challenge in writing.'
      : '{them} has told the story all year, and improved it. When {khe} tells it to your face, there is no letting it pass twice.'} The grass is grey with frost. {khe} is there already, rolling {khis} shoulders.`,
    choices: [
      { t: 'Fight', check: { s: 'melee', s2: 'spd', d: 50 },
        win: { r: 'You open {khis} sword arm from wrist to elbow. First blood, and more. {khe} goes down on one knee in the frost.', fx: { honor: 4, fame: 3, them: { op: -10 }, arc: mk('hon_won') } },
        lose: { r: '{khis} point takes you across the face before your guard is up. It is over in a breath.', fx: { honor: 1, wound: 'scar_face', arc: mk('hon_lost') } } },
      { t: 'Send a champion to fight in your place', req: p => p.coin >= 80, r: 'A hired man fights for you, and wins. Everyone knows whose blood it was.', fx: { coin: -80, honor: -3, arc: mk('hon_champion') } },
      { t: 'Apologise, on the field', r: 'You say the words in front of the seconds. {them} accepts them graciously, and repeats them for years.', fx: { honor: -5, them: { op: 20 }, arc: mk('hon_sorry') } },
    ] },
  { id: 'ar_hon_3', title: 'Not finished', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: honour,
    text: p => `${M(p, 'hon_won') ? '{them} carries {khis} arm in a sling still, and {khis} brother has begun to say the cut was foul.'
      : M(p, 'hon_lost') ? 'You wear {khis} mark across your face. {khe} is generous about it in company, which is worse.'
      : M(p, 'hon_champion') ? 'Everyone knows you paid a man to bleed for you. {them}\'s friends say so at table, where you can hear.'
      : '{them} has taken your apology as a debt, and now {khe} calls on it, in front of people.'} It is not finished.`,
    choices: [
      { t: 'Offer {khis} family your hand', r: 'You send a gift and go yourself after it. They take the gift. The hand takes longer.', fx: { coin: -40, them: { op: 25 }, arc: mk('hon_peace') } },
      { t: 'Meet {khis} brother too, if he wants it', check: { s: 'melee', s2: 'wil', d: 55 },
        win: { r: 'The brother lasts less long than {them} did. Nobody says foul again.', fx: { fame: 4, honor: 3, them: { op: -15 }, arc: mk('hon_twice') } },
        lose: { r: 'The brother is better than {them}. His point goes through your forearm and the field turns white.', fx: { honor: 1, wound: 'scar_arm', arc: mk('hon_twice_lost') } } },
      { t: 'Lay the whole affair before the {rulerTitle}\'s justices', r: 'It is lawful, and slow, and it looks like fear to some. The justices note your name with approval.', fx: { coin: -30, favor: 5, them: { op: -20 }, arc: mk('hon_law') } },
    ] },
  { id: 'ar_hon_4', title: 'What they call you', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: honour,
    text: p => `${any(p, 'hon_won', 'hon_twice') ? 'They tell the story of the frost and the field in places you have never been.'
      : any(p, 'hon_lost', 'hon_twice_lost') ? 'People look at your scar first and your face second.'
      : M(p, 'hon_champion') ? 'The story they tell is about your champion, not about you.' : 'The story they tell is about your apology.'} ${M(p, 'hon_peace') ? '{them} nods to you at church now.' : M(p, 'hon_law') ? 'The justices fined you both, and {them} paid {khis} fine in coppers, to make a point.' : '{them} has not forgotten either.'} It is time to decide what it was.`,
    choices: [
      { t: 'Wear the name the songs give you', req: p => any(p, 'hon_won', 'hon_twice'), r: 'You let them call you what they like. What they like is Firstfrost.',
        fx: { fame: 3, epithet: 'Firstfrost', arDeed: 'Fought {themFull} at first light, and won', arc: fin('hon_named') } },
      { t: 'Make a friend of {khim} at last', r: 'You ride to {khis} house unannounced and stay three days. After that you are at each other\'s weddings, and each other\'s funerals.',
        fx: { honor: 1, them: { op: 40, type: 'friend', back: 'friend' }, arc: fin('hon_friends') } },
      { t: 'Keep the quarrel, and your sword oiled', r: 'You do not make it up. You practise every morning, in case.',
        fx: { skill: { melee: 2 }, them: { op: -30, type: 'enemy', back: 'enemy' }, trait: 'wrathful', arc: fin('hon_feud') } },
      { t: 'Hang the sword over the fire for good', r: 'You hang it over the hearth and leave it there. It gathers dust. You find you do not miss it.',
        fx: { happy: 3, trait: 'calm', arDeed: 'Gave up the sword after an affair of honour', arc: fin('hon_done') } },
    ] },

  // ================================================================ THE LIBEL
  { id: 'ar_libel_1', title: 'Verses on the church door', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `Someone has nailed verses to the church door in {home}. They are about you${p.flags.ar_seat ? ', and the office you hold' : ''}. They say you are seen leaving a widow's house by the back gate, and they call you Backgate. By noon the children are singing them. Nobody admits to reading them. Everybody knows the third verse.`,
    choices: [
      { t: 'Tear them down yourself, in daylight', r: 'You tear them down with half of {home} watching. It improves the story.', fx: { honor: 1, fame: -1, happy: -2, arc: mk('lib_tore') } },
      { t: 'Answer in verse, on the same door', check: { s: 'music', s2: 'int', d: 55 },
        win: { r: 'Your answer is better than the verses, and ruder. The children sing yours now.', fx: { fame: 3, arc: mk('lib_verse') } },
        lose: { r: 'Your answer scans badly. The children sing both, and yours is the joke.', fx: { fame: -2, happy: -3, arc: mk('lib_verse') } } },
      { t: 'Find out whose hand it is', check: { s: 'intrigue', s2: 'ins', d: 50 },
        win: { r: 'The hand is a clerk\'s, and you have seen it before, on a letter in your own chest.', fx: { int: 1, arc: mk('lib_traced') } },
        lose: { r: 'Asking about the verses spreads them. A dozen people recite them to you, to help.', fx: { fame: -2, happy: -2, arc: mk('lib_asked') } } },
    ] },
  { id: 'ar_libel_2', title: 'The hand', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => X().cast(p, ctx, 'author', AUTHOR),
    text: (p, ctx) => `${M(p, 'lib_traced') ? 'You lay the old letter beside the verses. It is the same hand: {them}\'s.' : 'It comes out, as these things do. The verses are {them}\'s.'}${ctx.old ? ' Of course they are.' : ''} {khe} denies it to anyone who asks, smiling. The verses have reached {capital}.`,
    choices: [
      { t: 'Bring a suit for slander', r: 'A lawyer draws it up for a fee. It will take a year to come on, and cost more than you think.', fx: { coin: -40, arc: mk('lib_sued') } },
      { t: 'Pay {khim} to stop', r: '{khe} takes the money with a show of not understanding. The verses stop.', fx: { coin: -60, honor: -2, them: { op: 10 }, arc: mk('lib_paid') } },
      { t: 'Write worse verses about {khim}', check: { s: 'music', s2: 'int', d: 50 },
        win: { r: 'Yours are worse, which is to say better. {home} has two songs now, and likes the new one more.', fx: { fame: 2, them: { op: -20 }, arc: mk('lib_war') } },
        lose: { r: 'Yours are clumsy and mean. People sing them about you.', fx: { honor: -2, fame: -1, them: { op: -10 }, arc: mk('lib_war') } } },
    ] },
  { id: 'ar_libel_3', title: 'The second round', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => X().cast(p, ctx, 'author', AUTHOR),
    text: p => `${M(p, 'lib_paid') ? 'The money bought a year\'s quiet. Now there are new verses on the door, and a note under yours asking for more.'
      : M(p, 'lib_war') ? 'Your verses and {them}\'s have run all winter. The priest has preached on the two of you, by name.'
      : 'The case comes on at the assize in {capital}. {them} has hired a lawyer who talks for an hour about your grandfather.'} It has to end somewhere.`,
    choices: [
      { t: 'Lay {khis} own letter before the justices', req: p => M(p, 'lib_traced'), check: { s: 'persuasion', s2: 'int', d: 40 },
        win: { r: 'The justices compare the hands and find for you. {them} pays damages and costs.', fx: { coin: 100, honor: 4, them: { op: -20 }, arc: mk('lib_won') } },
        lose: { r: '{khis} lawyer says any clerk can copy a hand. The justices agree with him.', fx: { coin: -60, fame: -2, arc: mk('lib_lost') } } },
      { t: 'Put your case to the justices', req: p => !M(p, 'lib_traced'), check: { s: 'persuasion', s2: 'int', d: 55 },
        win: { r: 'The justices find for you. {them} pays damages and costs, and pays them slowly.', fx: { coin: 100, honor: 4, them: { op: -20 }, arc: mk('lib_won') } },
        lose: { r: 'The justices find the verses unkind but not unlawful. You pay the costs.', fx: { coin: -60, fame: -2, arc: mk('lib_lost') } } },
      { t: 'Make terms with {khim}, privately', r: 'You meet in a back room and agree to say nothing more about each other. It holds, mostly.', fx: { coin: -30, them: { op: 15 }, arc: mk('lib_terms') } },
      { t: 'Let {home} make up its own mind', r: 'You stop answering. People get bored, in time, and find someone new.', fx: { fame: -2, happy: 2, arc: mk('lib_ignored') } },
    ] },
  { id: 'ar_libel_4', title: 'What sticks', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => X().cast(p, ctx, 'author', AUTHOR),
    text: p => (M(p, 'lib_won') ? 'The judgment is read out in {capital} and copied in {home}. Some people still sing the third verse, quietly.'
      : M(p, 'lib_lost') ? 'You lost before the justices, and paid for it. The verses are sung now with a new last line, about the court.'
      : M(p, 'lib_terms') ? 'You and {them} keep your bargain. The verses are still sung, though by neither of you.'
      : 'The verses are sung less now. Children who never knew what they meant still call you Backgate.'),
    choices: [
      { t: 'Have the judgment nailed where the verses were', req: p => M(p, 'lib_won'), r: 'The judgment goes up on the church door, with its seal. It stays there until the rain takes it.',
        fx: { honor: 3, fame: 2, flag: 'ar_cleared', arDeed: 'Cleared of a libel before the justices at {capital}', arc: fin('lib_cleared') } },
      { t: 'Take the name, and laugh first', r: 'You call yourself Backgate before anyone else can. It stops being an insult and becomes a name.',
        fx: { fame: 3, honor: -1, epithet: 'Backgate', arDeed: 'Took the name Backgate from a libel and kept it', arc: fin('lib_named') } },
      { t: 'Make {khim} pay for as long as {khe} lives', r: 'You never speak to {khim} again, and see to it that nobody who wants your custom does either.',
        fx: { them: { op: -40, type: 'enemy', back: 'enemy' }, trait: 'vengeful', arc: fin('lib_feud') } },
      { t: 'Live it down, and say nothing', r: 'You say nothing for so long that silence becomes what you are known for.',
        fx: { wil: 1, trait: 'stoic', arDeed: 'Lived down a libel in silence', arc: fin('lib_stoic') } },
    ] },

  // ================================================================ A FORGED CHARTER
  { id: 'ar_charter_1', title: 'An old charter', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { land(p, ctx); X().cast(p, ctx, 'claimant', CLAIM); },
    text: '{themFull} rides into {home} with a charter: old vellum, a brown seal, and a line in a cramped hand that gives {khis} family {land}. The priest reads it twice. It looks very old. It smells new. If it stands, you are a tenant on your own ground.',
    choices: [
      { t: 'Take it to a clerk who knows old hands', r: 'The clerk wants a month and a fee, and gets both.', fx: { coin: -40, arc: mk('ch_clerk') } },
      { t: 'Look for your own papers', check: { s: 'learning', s2: 'int', d: 45 },
        win: { r: 'Your grandfather\'s deed is at the bottom of the chest, wrapped in a shirt. You read it by the window.', fx: { int: 1, arc: mk('ch_papers') } },
        lose: { r: 'There is nothing in the chest but receipts and a lock of someone\'s hair.', fx: { happy: -3, arc: mk('ch_nopapers') } } },
      { t: 'Offer {khim} money to ride on', req: p => p.coin >= 80, r: '{khe} takes it, and rides on as far as the next village.', fx: { coin: -80, them: { op: 10 }, arc: mk('ch_bought') } },
    ] },
  { id: 'ar_charter_2', title: 'The seal', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { land(p, ctx); X().cast(p, ctx, 'claimant', CLAIM); },
    text: p => `${M(p, 'ch_clerk') ? 'The clerk says the seal is real and the charter is not: the wax was lifted from some other deed with a hot knife.'
      : M(p, 'ch_papers') ? 'Your grandfather\'s deed is good, but its dates are odd: it is younger than the hedges. Someone held this ground before your family.'
      : M(p, 'ch_bought') ? '{them} is back within the month with a second charter, for more.'
      : 'You have no papers. Your family has held it so long that nobody thought to write it down.'} {khe} has gone to law.`,
    choices: [
      { t: 'Answer {khim} in the hundred court', r: 'You will answer at the next session. You spend the winter getting ready.', fx: { coin: -30, arc: mk('ch_court') } },
      { t: 'Have a better charter made, older than {khers}', check: { s: 'deception', s2: 'learning', d: 55 },
        win: { r: 'A scribe in {capital} who asks no questions makes you a grant older than {khers}, with a better seal.', fx: { coin: -60, honor: -3, arc: mk('ch_forged') } },
        lose: { r: 'The scribe you go to takes your money and tells {them}, who pays better.', fx: { coin: -60, honor: -4, arc: mk('ch_exposed') } } },
      { t: 'Take it to the {rulerTitle}\'s justices', r: 'Royal justice is slow and dear, and it is not bought by local men.', fx: { coin: -80, favor: 3, arc: mk('ch_crown') } },
    ] },
  { id: 'ar_charter_3', title: 'The hearing', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { land(p, ctx); X().cast(p, ctx, 'claimant', CLAIM); },
    text: p => `The hearing is in ${M(p, 'ch_crown') ? 'the justices\' hall at {capital}' : 'the church porch, before the hundred court'}. {them} brings {khis} charter and two lawyers. ${M(p, 'ch_clerk') ? 'You bring the clerk, who has brought a candle and a knife.'
      : M(p, 'ch_forged') ? 'You bring a charter older than {khers}, and as false.'
      : M(p, 'ch_exposed') ? 'Everyone has heard what you tried with the scribe.'
      : 'You bring yourself, and your neighbours.'}`,
    choices: [
      { t: 'Let the clerk show how the seal was lifted', req: p => M(p, 'ch_clerk'), check: { s: 'persuasion', s2: 'int', d: 35 },
        win: { r: 'The clerk lifts a seal off a tax receipt in front of the court. It is over by noon.', fx: { honor: 2, them: { op: -20 }, arc: mk('ch_won') } },
        lose: { r: 'The court does not follow the clerk, and does not like being lectured.', fx: { coin: -40, arc: mk('ch_lost') } } },
      { t: 'Lay your own charter before the court', req: p => M(p, 'ch_forged'), check: { s: 'deception', s2: 'wil', d: 45 },
        win: { r: 'Two false charters, and yours is the older. The court finds for you, field and all. You do not sleep well.', fx: { coin: 50, honor: -2, arc: mk('ch_won_false') } },
        lose: { r: 'The court looks at both and sends for the bishop\'s clerk. You are fined for the forgery.', fx: { coin: -100, honor: -5, arc: mk('ch_lost') } } },
      { t: 'Bring your neighbours to swear for you', check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: 'Twelve neighbours swear that you and yours have held the ground time out of mind. The old law still counts.', fx: { honor: 1, them: { op: -15 }, arc: mk('ch_won') } },
        lose: { r: 'Seven swear for you. {them} has paid the other five to stay at home.', fx: { happy: -4, arc: mk('ch_lost') } } },
      { t: 'Settle: split the ground with {khim}', r: 'You split it along the old hedge. You keep the house; {khe} gets the better field.', fx: { coin: -50, them: { op: 15 }, arc: mk('ch_split') } },
    ] },
  { id: 'ar_charter_4', title: 'The ground', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { land(p, ctx); X().cast(p, ctx, 'claimant', CLAIM); },
    text: p => (M(p, 'ch_lost') ? '{them} has the judgment. {khis} men come up the lane with a cart on a Monday, and a list.'
      : M(p, 'ch_split') ? 'The hedge runs between your house and {khis} field now. {them} waves across it, some mornings.'
      : `The ground is yours${M(p, 'ch_won_false') ? ', on a charter as false as {khers}' : ', and the court has written it so'}. {them} has left {home}, swearing.`),
    choices: [
      { t: 'Walk the bounds and have them written', req: p => !M(p, 'ch_lost'), r: 'You walk the bounds with the priest and twelve boys, and at each stone you bump a boy on it so he remembers.',
        fx: { honor: 2, flag: 'ar_bounds', arDeed: 'Kept {landName} against a forged charter', arc: fin('ch_kept') } },
      { t: p => (M(p, 'ch_split') ? 'Make a friend of {khim} over the hedge' : 'Forgive {khim} the forgery'), req: p => !M(p, 'ch_lost'), r: 'You go over with a jug. It turns out {khe} was put up to it, and is sorry, and good company.',
        fx: { coin: -10, them: { op: 30, type: 'friend', back: 'friend' }, arc: fin('ch_friends') } },
      { t: 'Throw {khis} men off your ground', req: p => M(p, 'ch_lost'), check: { s: 'intimidation', s2: 'str', d: 55 },
        win: { r: 'You meet the cart with cudgels and your neighbours. The men go. The court fines you, and lets it lie.', fx: { coin: -50, them: { op: -30, type: 'enemy', back: 'enemy' }, flag: 'ar_bounds', arDeed: 'Held {landName} against the court and a forged charter', arc: fin('ch_held') } },
        lose: { r: 'They have more cudgels. You lose the ground and a tooth, and spend a season in the cells.', fx: { prison: 1, why: 'riot', arLose: 1, them: { op: -30, type: 'enemy', back: 'enemy' }, arc: fin('ch_jailed') } } },
      { t: 'Give it up, and start again elsewhere', req: p => M(p, 'ch_lost'), r: 'You load the cart yourself. The new place is smaller, and the roof is sound.',
        fx: { happy: -6, arLose: 1, asset: 'cottage', arc: fin('ch_moved') } },
    ] },

  // ================================================================ THE STOLEN SECRET
  { id: 'ar_recipe_1', title: 'It comes right', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p) && C.job(p),
    setup: secret,
    text: 'After years of trying, you have it: {thing}. Nobody else in {home} can do it, and folk come from two days away for it. {them}, your journeyman, was there the night it came right. {khe} held the lamp and watched your hands.',
    choices: [
      { t: 'Write it down, and lock it in the chest', r: 'You write it out plain, so it will outlast you, and lock it away.', fx: { int: 1, coin: 40, arc: mk('rec_locked') } },
      { t: 'Keep it in your head, and nowhere else', r: 'You burn your notes. It lives behind your eyes now, and dies with you.', fx: { wil: 1, coin: 40, arc: mk('rec_head') } },
      { t: 'Teach it to {them}, and bind {khim} by oath', r: '{khe} swears on {khis} mother\'s grave never to sell it. You believe {khim}. Why would you not?', fx: { coin: 20, them: { op: 15 }, arc: mk('rec_shared') } },
    ] },
  { id: 'ar_recipe_2', title: 'Across the river', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: secret,
    text: p => `{buyer}, across the river, is selling {short}. The same, or near enough, for a little less. {them} left your service at Michaelmas and has a new coat. ${M(p, 'rec_locked') ? 'The chest has been opened and locked again, neatly.' : M(p, 'rec_head') ? '{khe} must have watched you a hundred times, counting.' : 'So much for the oath.'}`,
    choices: [
      { t: 'Take it to the magistrate', check: { s: 'persuasion', s2: 'int', d: 50 },
        win: { r: 'The magistrate hears you and orders {buyer} to stop. {buyer} pays a fine, and stops, or says so.', fx: { coin: 40, them: { op: -20 }, arc: mk('rec_law') } },
        lose: { r: 'The magistrate says a way of working cannot be owned. {buyer} buys him a dinner.', fx: { coin: -30, them: { op: -20 }, arc: mk('rec_nolaw') } } },
      { t: 'Do it better, and leave them last year\'s', check: { s: 'craft', s2: 'int', d: 50 },
        win: { r: 'By spring yours is better than it was. Theirs is last year\'s.', fx: { coin: 60, health: -3, arc: mk('rec_better') } },
        lose: { r: 'You spoil three batches trying. Theirs sells. Yours sits.', fx: { coin: -60, happy: -3, arc: mk('rec_spoiled') } } },
      { t: 'Pay men to visit {buyer} by night', r: 'The men break what they find and are paid. {buyer} knows who sent them. So, soon, does everyone.', fx: { coin: -40, honor: -5, arc: mk('rec_wrecked') } },
    ] },
  { id: 'ar_recipe_3', title: 'At the door', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: secret,
    text: p => `{them} is at your door, thin and out of work. {buyer} had what {khe} knew, and no more use for {khim}. ${M(p, 'rec_wrecked') ? 'The magistrate is asking about the night the men came, and {them} was there.' : M(p, 'rec_better') ? 'Your new way is the talk of {home}, and {khe} knows nothing of it.' : '{khe} cannot meet your eye.'} {khe} asks you to take {khim} back.`,
    choices: [
      { t: 'Take {khim} back, at a boy\'s wage', r: '{khe} takes it. {khe} works like someone with a debt to pay, which {khe} is.', fx: { coin: 20, them: { op: 15 }, arc: mk('rec_back') } },
      { t: 'Make {khim} swear to what {khe} did, before witnesses', check: { s: 'intimidation', s2: 'wil', d: 45 },
        win: { r: '{khe} swears it. {buyer} is fined a year\'s profit, and it comes to you.', fx: { coin: 120, them: { op: -20 }, arc: mk('rec_sworn') } },
        lose: { r: '{khe} will not swear. {khe} goes, and you hear later that {khe} is in {capital}.', fx: { happy: -2, them: { op: -15 }, arc: mk('rec_gone') } } },
      { t: 'Close the door on {khim}', r: 'You shut the door. You hear {khim} on the step a while before {khe} goes.', fx: { honor: 1, happy: -2, them: { op: -30 }, arc: mk('rec_shut') } },
    ] },
  { id: 'ar_recipe_4', title: 'Whose it is', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: secret,
    text: p => `It is years since {short} first came right under your hands. ${M(p, 'rec_back') ? '{them} works beside you again, and is better at it than you are.' : M(p, 'rec_sworn') ? '{buyer} makes something else now.' : '{buyer} still sells it, a little worse than yours.'} Now a merchant from {capital} wants to buy the right to it outright, and make it by the cartload.`,
    choices: [
      { t: 'Keep it, and put your name on it', r: 'You sell nothing. You put your mark on every piece and let them call it after you.',
        fx: { fame: 4, arEpithet: '{epi}', arDeed: 'Made {thing}', arc: fin('rec_named') } },
      { t: 'Sell it, and buy a town house', r: 'You sell it for more than you have seen in one place, and buy a town house. It will be made in {capital} now, under another name.',
        fx: { happy: -3, asset: 'townhouse', arDeed: 'Sold the secret of {thing}', arc: fin('rec_sold') } },
      { t: 'Give it away to anyone who asks', r: 'You teach it to anyone who comes. In ten years it is how everyone does it, and nobody remembers it was yours.',
        fx: { honor: 4, happy: 3, trait: 'generous', arDeed: 'Gave away the secret of {thing}', arc: fin('rec_given') } },
      { t: 'Leave it to {them}, who came back', req: p => M(p, 'rec_back'), r: 'You write it out for {khim}, and sign it. {khe} reads it twice and puts it inside {khis} shirt.',
        fx: { them: { op: 30, type: 'friend', back: 'friend' }, arDeed: 'Left the secret of {thing} to {themFull}', arc: fin('rec_heir') } },
    ] },

  // ================================================================ THE BRIBE
  { id: 'ar_bribe_1', title: 'A purse on the table', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: briber,
    text: (p, ctx) => `{themFull} puts a heavy purse on your table and asks only ${ASK[ctx.lane] || ASK.land}. "Nobody will know," {khe} says. "And one day I may ask a small thing more."${p.flags.ar_own_man ? ' You have owed no one for a while now. You had got used to it.' : ''}`,
    choices: [
      { t: 'Take the purse, and do as {khe} asks', r: 'You do it. The purse is heavier than the thing you did, which seems a fair trade at the time.', fx: { coin: 120, honor: -4, them: { op: 15 }, arc: mk('bribe_took') } },
      { t: 'Take the purse, and do nothing for it', r: 'You keep it and do nothing. {khe} finds out within the month, and says nothing, which should worry you.', fx: { coin: 120, honor: -2, them: { op: -20 }, arc: mk('bribe_cheated') } },
      { t: 'Refuse, and show {khim} the door', r: '{khe} picks up the purse and goes, pleasantly. {khe} is a patient sort.', fx: { honor: 3, them: { op: -10 }, arc: mk('bribe_refused') } },
      { t: 'Report {khim} to the magistrate', r: 'The magistrate fines {khim} and thanks you. You are known now as hard to buy.', fx: { honor: 2, merit: 5, fame: 1, them: { op: -30 }, arc: mk('bribe_reported') } },
    ] },
  { id: 'ar_bribe_2', title: 'The small thing more', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: briber,
    text: p => (M(p, 'bribe_took') ? '{them} is back, greyer and richer. {khe} wants the small thing more: your seal on a cargo you will not be allowed to see. {khe} reminds you, kindly, of the first time.'
      : M(p, 'bribe_cheated') ? '{them} has not forgotten the purse you kept for nothing. {khe} wants it back, doubled, or {khe} will tell everyone why you had it.'
      : '{them} has done well since you turned {khim} away. Now {khe} sits on the bench that hears complaints against people like you, and someone has made one. A purse, {khe} hints, would lose it.'),
    choices: [
      { t: 'Set your seal on the cargo', req: p => M(p, 'bribe_took'), r: 'You set your seal on it. You do not ask what was in it, and you are careful not to find out.', fx: { coin: 150, honor: -5, them: { op: 15 }, arc: mk('bribe_deeper') } },
      { t: 'Pay what {khe} asks', req: p => !M(p, 'bribe_took') && p.coin >= 150, r: 'You pay. {khe} counts it in front of you and writes something in a little book.', fx: { coin: -150, honor: -3, them: { op: 10 }, arc: mk('bribe_paid') } },
      { t: 'Go over {khis} head, and tell everything', r: 'You go to the justices and tell it all. They fine you, and write it down, and thank you in a way that is not quite thanks.', fx: { honor: 3, coin: -80, merit: -10, them: { op: -30 }, arc: mk('bribe_confessed') } },
      { t: 'Tell {khim} to do {khis} worst', r: '{khe} smiles. {khe} has waited years to be asked.', fx: { wil: 1, them: { op: -25 }, arc: mk('bribe_dared') } },
    ] },
  { id: 'ar_bribe_3', title: 'Before the justices', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: briber,
    text: p => (M(p, 'bribe_deeper') ? 'The cargo was the {rulerTitle}\'s own salt, stolen. The justices have {them}, and {them} has given them your name, and your seal.'
      : M(p, 'bribe_paid') ? '{them} has lost {khis} place for taking purses, and the justices are going through {khis} little book, name by name. Yours is on page four.'
      : M(p, 'bribe_confessed') ? 'Your confession has done its work. {them} is before the justices, and you are the witness they need.'
      : '{them} did {khis} worst. It is before the justices now: your word against {khers}, and {khis} ledger, which has your name in it.'),
    choices: [
      { t: 'Tell the whole truth, whatever it costs', r: 'You tell it all: the purse, the table, the words. They fine you, and believe you, and hang no one.',
        fx: { honor: 4, coin: -60, trait: 'honest', flag: 'ar_clean_hands', arDeed: 'Gave evidence against {themFull} before the justices', arc: fin('bribe_truth') } },
      { t: 'Lie, and make it stick', check: { s: 'deception', s2: 'wil', d: 55 },
        win: { r: 'Your story holds and {khers} does not. {khe} goes to prison. You go home.', fx: { honor: -3, trait: 'deceitful', them: { op: -40, type: 'enemy', back: 'enemy' }, arc: fin('bribe_lied') } },
        lose: { r: 'Your story comes apart at the second question. You go to prison for a year, and so does {khe}.', fx: { prison: 1, why: 'bribery', honor: -6, trait: 'deceitful', arc: fin('bribe_jailed') } } },
      { t: 'Buy {khis} silence one last time', req: p => p.coin >= 200, r: 'You pay the last and largest purse. {khe} forgets your name in front of the justices. You will not forget {khers}.',
        fx: { coin: -200, them: { op: 10 }, trait: 'paranoid', flag: 'ar_bought_silence', arc: fin('bribe_bought') } },
    ] },

  // ================================================================ THE VENDETTA AT COURT
  { id: 'ar_ven_1', title: 'Below the salt', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: house,
    text: 'At the {rulerTitle}\'s Easter feast the steward seats you below {themFull}, of {house}. It is the third time this year. {house} has wanted your family\'s place at court since before you were born, and {them} is the one they have sent to take it. At the high table they are watching to see if you notice.',
    choices: [
      { t: 'Take your proper seat, and make {khim} move', r: '{khe} moves, slowly, to laughter. You have won a chair and made an enemy of a house.', fx: { honor: 2, them: { op: -15 }, arc: mk('ven_scene') } },
      { t: 'Sit where you are put, and remember', r: 'You eat below the salt and smile at {khim} across it. {khe} sees that you have a long memory.', fx: { wil: 1, happy: -2, arc: mk('ven_remember') } },
      { t: 'Have a word with the steward, and a purse', r: 'The steward is very sorry. Next time your chair is where it should be, and {them} asks why.', fx: { coin: -60, favor: 1, arc: mk('ven_steward') } },
    ] },
  { id: 'ar_ven_2', title: 'Whispers', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: house,
    text: p => `Word goes round the court that your family owes money to lenders in {capital} and is selling its silver. It is half true. ${M(p, 'ven_scene') ? 'It began the week after the feast.' : M(p, 'ven_remember') ? 'You know where it began. You have been waiting for it.' : 'The steward, for a second purse, tells you where it began: with {them}.'}`,
    choices: [
      { t: 'Answer whispers with whispers', check: { s: 'intrigue', s2: 'int', d: 50 },
        win: { r: 'By midsummer the court is saying that {house} cheats its own tenants. It is not true, but it is interesting.', fx: { honor: -2, them: { op: -15 }, arc: mk('ven_whisper') } },
        lose: { r: 'Your whispers are traced to your own servants. You look petty, and frightened.', fx: { honor: -3, fame: -2, arc: mk('ven_traced') } } },
      { t: 'Go to the {rulerTitle} and speak plainly', check: { s: 'etiquette', s2: 'persuasion', d: 55 },
        win: { r: 'The {rulerTitle} hears you, is amused, and lets it be known that your debts are nobody\'s business.', fx: { favor: 5, fame: 1, arc: mk('ven_favour') } },
        lose: { r: 'The {rulerTitle} hears you and says nothing, which is answer enough.', fx: { favor: -3, happy: -3, arc: mk('ven_snub') } } },
      { t: 'Find an ally among the other houses', r: 'You spend a season in other people\'s halls. One lord likes you for yourself, or says so.', fx: { coin: -50, newRel: { type: 'friend', op: 30 }, arc: mk('ven_ally') } },
    ] },
  { id: 'ar_ven_3', title: 'A match', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: house,
    text: p => `{house} proposes a match: {them}'s nephew to a girl of your blood. It would end the quarrel, or carry it inside your walls. ${M(p, 'ven_favour') ? 'The {rulerTitle} smiles on it.' : M(p, 'ven_ally') ? 'Your new friend says it is a trap.' : any(p, 'ven_traced', 'ven_snub') ? 'After this year, you need friends more than pride.' : 'Your family waits for you to say.'}`,
    choices: [
      { t: 'Accept the match', r: 'The contracts are signed. Your families will share grandchildren, and grudges.', fx: { honor: 1, them: { op: 20 }, arc: mk('ven_match') } },
      { t: 'Refuse it, politely', r: 'You refuse in the politest letter you have ever written. {them} reads the politeness as an insult, correctly.', fx: { honor: 2, them: { op: -15 }, arc: mk('ven_refuse') } },
      { t: 'Make a better match elsewhere, first', check: { s: 'diplomacy', s2: 'etiquette', d: 50 },
        win: { r: 'You marry the girl into a greater house before {house} can blink. They are left holding their offer.', fx: { fame: 2, favor: 2, them: { op: -20 }, arc: mk('ven_better') } },
        lose: { r: 'The greater house declines. {house} hears of it, and withdraws its offer with a smile.', fx: { fame: -2, them: { op: -10 }, arc: mk('ven_refuse') } } },
    ] },
  { id: 'ar_ven_4', title: 'The boar hunt', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: house,
    text: p => `The court hunts boar in the {rulerTitle}'s forest. In the thick of it {them}'s horse goes down in a gully, and {them} with it, pinned. ${M(p, 'ven_match') ? 'The wedding is set for the spring. ' : ''}Nobody else has seen. {khe} sees you, and says nothing, and waits.`,
    choices: [
      { t: 'Climb down and drag {khim} free', check: { s: 'athletics', s2: 'str', d: 45 },
        win: { r: 'You get {khim} out from under the horse. {khe} does not thank you. {khe} does not need to.', fx: { honor: 3, them: { op: 30 }, arc: mk('ven_saved') } },
        lose: { r: 'You get {khim} out, and the horse kicks as it rises. You ride home bent double.', fx: { wound: 'broken_ribs', them: { op: 30 }, arc: mk('ven_saved') } } },
      { t: 'Ride on, as if you saw nothing', r: 'You ride on. They find {khim} at dusk, alive, with a broken leg and a long time to think.', fx: { honor: -4, wil: 1, them: { op: -20 }, arc: mk('ven_rode') } },
      { t: 'Ride for help, and see the court knows it was you', r: 'You bring the huntsmen and tell the story at supper. It is a good story, and you are in it.', fx: { fame: 2, favor: 2, them: { op: 5 }, arc: mk('ven_herald') } },
    ] },
  { id: 'ar_ven_5', title: 'The seal', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: house,
    text: p => `The keeper of the {rulerTitle}'s seal is dying, and the place will go to your house or to {house}. ${M(p, 'ven_saved') ? '{them} has said, to some surprise, that you would serve well.' : M(p, 'ven_rode') ? '{them} walks with a stick now, and tells everyone why.' : 'The court remembers who rode for help. {them} remembers who told the story.'} The {rulerTitle} will hear you both.`,
    choices: [
      { t: 'Make your case on its merits', check: { s: 'persuasion', s2: 'int', d: 50 },
        win: { r: 'You speak for a quarter of an hour without notes. The seal is yours.', fx: { favor: 5, fame: 3, arc: mk('ven_seal') } },
        lose: { r: '{them} speaks better, or has spoken earlier, to the right people. The seal goes to {house}.', fx: { favor: -2, happy: -4, arc: mk('ven_noseal') } } },
      { t: 'Buy the council\'s voices', req: p => p.coin >= 200, r: 'It costs two years\' rents. The seal is yours, and everyone knows its price.', fx: { coin: -200, honor: -4, favor: 3, arc: mk('ven_seal') } },
      { t: 'Stand aside for {them}', r: 'You tell the {rulerTitle} that {them} is the better choice. The court is astonished. So is {them}.', fx: { honor: 3, them: { op: 30 }, arc: mk('ven_aside') } },
    ] },
  { id: 'ar_ven_6', title: 'The end of it', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: house,
    text: p => `${M(p, 'ven_seal') ? 'You keep the {rulerTitle}\'s seal now. {house} has nothing left to take from you.' : M(p, 'ven_aside') ? '{them} keeps the seal, and has not once used it against you.' : '{them} keeps the {rulerTitle}\'s seal, and uses it on you when {khe} can.'} You are both older. Either it ends with you, or it passes to your children.`,
    choices: [
      { t: 'Swear peace between the houses, before the {rulerTitle}', r: 'You and {them} kneel together and swear it. Your grandchildren will not know what it was about.',
        fx: { sworn: 1, them: { op: 40, type: 'friend', back: 'friend' }, flag: 'ar_house_peace', arDeed: 'Ended the feud with {house}', arc: fin('ven_peace') } },
      { t: 'Pass the feud to your heirs', r: 'You tell your heir the whole of it, in order, on a winter night. It will outlive you both.',
        fx: { them: { op: -40, type: 'enemy', back: 'enemy' }, trait: 'vengeful', flag: 'ar_house_feud', arc: fin('ven_feud') } },
      { t: 'Leave court for good', r: 'You go home to your own country and your own table, where you sit where you like.',
        fx: { happy: 6, favor: -5, trait: 'content', arDeed: 'Left the court and the feud with {house}', arc: fin('ven_left') } },
      { t: 'Use the seal to break {khim}', req: p => M(p, 'ven_seal'), r: 'A warrant goes astray; a lease is not renewed. In three years {house} has nothing but its name.',
        fx: { honor: -4, them: { op: -50, type: 'enemy', back: 'enemy' }, arDeed: 'Broke {house} at court', arc: fin('ven_ruin') } },
    ] },

  // ================================================================ THE USURPER IN YOUR HOUSE
  { id: 'ar_usurp_1', title: 'Indispensable', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: usurper,
    text: (p, ctx) => `${ctx.kin ? 'Your {kin} {them}' : '{them}'} has run {place} for you these three years. {khe} knows every account, every buyer and every man's wage. Lately the men take their questions to {khim} before you, and {khe} answers them without sending them on.${p.flags.ar_bounds ? ' {khe} knows the bounds you fought for as well as you do.' : ''}`,
    choices: [
      { t: 'Give {khim} more, and let {khim} run it', r: 'You hand {khim} the second set of keys. Things run better than they ever did under you.', fx: { coin: 80, happy: 2, them: { op: 15 }, arc: mk('usu_trust') } },
      { t: 'Take the keys back, quietly', r: 'You take back the keys and the ledgers. {khe} hands them over with a little bow.', fx: { coin: -20, wil: 1, them: { op: -10 }, arc: mk('usu_keys') } },
      { t: 'Bring your own child in beside {khim}', req: (p, C) => C.hasKids(p), r: 'Your child learns the work at {them}\'s elbow. They do not like each other.', fx: { happy: -1, rel: { who: 'child', op: 10 }, them: { op: -15 }, arc: mk('usu_child') } },
    ] },
  { id: 'ar_usurp_2', title: 'The second ledger', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: usurper,
    text: p => (M(p, 'usu_trust') ? 'In the strongroom you find a second ledger in {them}\'s hand. The figures are the same as yours, except the totals.'
      : M(p, 'usu_child') ? '{them} and your child have quarrelled in front of the men. Your child says {them} is skimming. {them} says your child is a fool. One of them is right.'
      : '{them} has been talking to the men behind your back, and to your best buyers, about what will happen when you are gone.'),
    choices: [
      { t: 'Have it out with {khim} tonight', check: { s: 'ins', s2: 'wil', d: 50 },
        win: { r: '{khe} admits nothing and explains everything. You understand at last how much {khe} has taken.', fx: { them: { op: -20 }, arc: mk('usu_known') } },
        lose: { r: '{khe} has an answer for everything, and makes you feel old for asking.', fx: { happy: -4, them: { op: -10 }, arc: mk('usu_doubt') } } },
      { t: 'Watch {khim}, and count everything twice', r: 'You count everything twice for a year. You find what you are looking for, and lose sleep finding it.', fx: { health: -4, int: 1, arc: mk('usu_known') } },
      { t: 'Let it be; {khe} has earned a little', r: 'You let it be. Whatever {khe} takes, the place makes more under {khim} than it did under you.', fx: { coin: 40, honor: -1, them: { op: 10 }, arc: mk('usu_let') } },
    ] },
  { id: 'ar_usurp_3', title: 'The men choose', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: usurper,
    text: p => (M(p, 'usu_known') ? 'You tell {them} {khe} is finished here. {khe} goes out into the yard and talks to the men, and the men put down their tools.'
      : '{them} comes to you with a paper: half of {place} made over to {khim}, "for the years". The men are standing behind {khim} in the yard, waiting.'),
    choices: [
      { t: 'Face the men yourself', check: { s: 'command', s2: 'persuasion', d: 50 },
        win: { r: 'You walk out and talk to them one by one, by name. One by one they pick up their tools.', fx: { fame: 2, them: { op: -20 }, arc: mk('usu_held') } },
        lose: { r: 'They hear you out. Then they look at {them}, and wait for {khim} to tell them what to do.', fx: { happy: -6, arc: mk('usu_broken') } } },
      { t: 'Sign the paper', r: 'You sign. Half of it is {khers} now. The men pick up their tools.', fx: { them: { op: 25 }, arc: mk('usu_signed') } },
      { t: 'Send for the sheriff', r: 'The sheriff\'s men come up the lane. Nobody fights, but nobody forgets who sent for them.', fx: { coin: -40, honor: 1, them: { op: -30 }, arc: mk('usu_law') } },
    ] },
  { id: 'ar_usurp_4', title: 'Whose house', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: usurper,
    text: p => (M(p, 'usu_held') ? '{place} is yours again, and the men know it. {them} is still in {home}, living on what {khe} took, and waiting.'
      : M(p, 'usu_broken') ? 'The men answer to {them} now. You are master of {place} in name, and in nothing else.'
      : M(p, 'usu_signed') ? '{them} owns half of {place}. {khe} runs it well. You are a guest at your own table.'
      : 'The sheriff has put {them} out. Your men are slow and sullen, and the work suffers for it.'),
    choices: [
      { t: 'Keep it, and run it yourself until you drop', req: p => any(p, 'usu_held', 'usu_law'), r: 'You are first in the yard every morning and last out of it. It is yours.',
        fx: { coin: 60, health: -4, trait: 'diligent', arDeed: 'Kept {place} against {themFull}', arc: fin('usu_kept') } },
      { t: 'Make {khim} your partner, in writing', r: 'You put both names to it before a notary. {khe} earned half. You choose to give it.',
        fx: { coin: 40, them: { op: 30, type: 'friend', back: 'friend' }, arDeed: 'Made {themFull} a partner in {place}', arc: fin('usu_partner') } },
      { t: 'Give it all up to {khim}, and go', r: 'You hand {khim} the keys and walk out with a bag. {khe} watches you go from the door.',
        fx: { coin: 150, happy: -4, arLose: 1, asset: 'cottage', arc: fin('usu_gone') } },
      { t: 'Cast {khim} out, and curse {khis} name', r: 'You put {khim} out with what {khe} came with. {khe} will be your enemy until one of you is buried.',
        fx: { coin: -60, honor: 1, them: { op: -50, type: 'enemy', back: 'enemy' }, arc: fin('usu_cast') } },
    ] },

  // ================================================================ THE MONEYLENDER
  { id: 'ar_debt_1', title: 'By Lady Day', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: lender,
    text: '{need}. You need a hundred {coinName}s by Lady Day, and you have not got forty. {themFull} lends money from a narrow house by the bridge. {khe} has soft hands, a long memory, and a rate {khe} calls friendly.',
    choices: [
      { t: 'Borrow the hundred at {khis} rate', r: '{khe} counts it out twice and writes your name in a book.', fx: { coin: 100, arc: mk('debt_rate') } },
      { t: 'Pledge {pledge} for a lower rate', r: '{khe} lends against {pledge}. The rate is lower. {pledge} is in the book now too.', fx: { coin: 120, happy: -3, arc: mk('debt_pledge') } },
      { t: 'Borrow half, and pinch for the rest', r: 'You borrow fifty, sell the good coat and eat less. It is enough, just.', fx: { coin: 50, happy: -4, health: -2, wil: 1, arc: mk('debt_half') } },
    ] },
  { id: 'ar_debt_2', title: 'Quarter day', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: lender,
    text: p => `The first payment falls due on quarter day. ${M(p, 'debt_rate') ? 'At {khis} rate, the hundred has grown like dough in a warm room.' : M(p, 'debt_pledge') ? 'The rate is low and {them} is patient, and {pledge} is in the book.' : 'You owe fifty, and fifty is more than you have.'} {them} sends a boy to remind you, politely.`,
    choices: [
      { t: 'Pay what is due, whatever it costs', r: 'You pay it to the coin. The house goes without meat till Easter.', fx: { coin: -60, happy: -3, honor: 2, arc: mk('debt_paid') } },
      { t: 'Ask {khim} for more time', r: '{khe} gives it gladly. Time is what {khe} sells.', fx: { happy: -2, them: { op: 5 }, arc: mk('debt_time') } },
      { t: 'Pay it in work instead of coin', r: '{khe} has you carry letters and sit in on hard bargains. You learn more than you wanted about your neighbours.', fx: { health: -3, skill: { trade: 1 }, them: { op: 10 }, arc: mk('debt_work') } },
    ] },
  { id: 'ar_debt_3', title: 'A sealed box', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: lender,
    text: p => `${M(p, 'debt_time') ? 'With the time {khe} gave you, the debt has doubled.' : M(p, 'debt_work') ? 'You know too much of {them}\'s business now, and {khe} knows it.' : 'You have paid two quarters in three, and the debt is barely smaller.'} {them} offers to strike your name from the book, all of it, for one thing: carry a sealed box to {capital}, and ask nothing.`,
    choices: [
      { t: 'Carry the box, and ask nothing', check: { s: 'stealth', s2: 'ins', d: 45 },
        win: { r: 'You hand it over at a back door in {capital}. {them} draws a line through your name.', fx: { honor: -3, them: { op: 10 }, arc: mk('debt_carried') } },
        lose: { r: 'The box is opened at the city gate. It is church plate. You talk your way out of a cell, barely.', fx: { honor: -5, fame: -2, arc: mk('debt_caught') } } },
      { t: 'Refuse, and pay as you can', r: 'You refuse. {khe} shrugs, and adds the interest.', fx: { coin: -40, honor: 2, them: { op: -5 }, arc: mk('debt_refused') } },
      { t: 'Find another lender to pay {khim} off', check: { s: 'persuasion', s2: 'trade', d: 50 },
        win: { r: 'A cousin\'s friend lends at half {khis} rate, and you pay {them} off in front of witnesses.', fx: { coin: -30, them: { op: -10 }, arc: mk('debt_moved') } },
        lose: { r: 'Nobody will lend to someone already in {them}\'s book. {khe} hears that you asked.', fx: { happy: -3, them: { op: -10 }, arc: mk('debt_refused') } } },
    ] },
  { id: 'ar_debt_4', title: 'The bailiff', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: lender,
    text: p => (M(p, 'debt_carried') ? '{them} has struck your name from one book and written it in another: the one where {khe} keeps the names of people who carried boxes. {khe} needs another carried.'
      : M(p, 'debt_moved') ? '{them} does not like to lose a customer. {khe} has bought up your cousin\'s debts instead, and your cousin is at your door, white in the face.'
      : 'The debt has doubled. {them} sends the bailiff, with a list of what you own written out in {khis} own neat hand.'),
    choices: [
      { t: 'Carry one more box', req: p => M(p, 'debt_carried'), check: { s: 'stealth', s2: 'ins', d: 50 },
        win: { r: 'One more back door, one more line in the book. {khe} smiles at you now in the street.', fx: { honor: -3, coin: 40, them: { op: 10 }, arc: mk('debt_courier') } },
        lose: { r: 'The watch is waiting at the back door this time. You get a year, and {them} gets nothing.', fx: { prison: 1, why: 'carrying stolen plate', honor: -4, arc: mk('debt_jailed') } } },
      { t: 'Pay what is asked, and be poorer', req: p => !M(p, 'debt_carried'), r: 'You pay. The good chair goes, and the second bed, and the pewter.', fx: { coin: -100, happy: -4, arc: mk('debt_stripped') } },
      { t: 'Stand on the law, and make {khim} prove it', check: { s: 'persuasion', s2: 'int', d: 50 },
        win: { r: 'The book has your name, but the rate is past what the law allows. The justices cut it by half.', fx: { coin: 40, them: { op: -20 }, arc: mk('debt_law') } },
        lose: { r: 'The justices read the book and find for {khim}, with costs.', fx: { coin: -80, arc: mk('debt_stripped') } } },
    ] },
  { id: 'ar_debt_5', title: 'Free and clear', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: lender,
    text: p => (M(p, 'debt_courier') ? '{them} has a hold on you that no coin will clear. {khe} knows it. You know it. It is time to settle what you are to each other.'
      : M(p, 'debt_jailed') ? 'A year in the cells struck your name from {them}\'s book. It did not strike it from anyone else\'s.'
      : M(p, 'debt_law') ? 'The justices cut your debt by half. What is left is still yours to pay, and {them} still keeps the book.'
      : 'You have little left, and owe less. {them} sends a new year\'s greeting, as to any customer.'),
    choices: [
      { t: 'Pay the last of it, and never borrow again', r: 'You count out the last coins on {khis} table. {khe} draws a line through your name. You walk home lighter.',
        fx: { coin: -60, trait: 'cautious', arDeed: 'Paid off {themFull}, the moneylender', arc: fin('debt_clear') } },
      { t: 'Set up as a lender yourself', r: 'You learned the trade from the wrong side of the table. Now you sit on the other side.',
        fx: { coin: 150, honor: -3, trait: 'greedy', arDeed: 'Set up as a moneylender in {home}', arc: fin('debt_lender') } },
      { t: 'Go to work for {khim} until it is paid', r: '{khe} takes you on as {khis} clerk. Before long you know every name in the book, and they know yours.',
        fx: { skill: { trade: 2 }, them: { op: 25, type: 'colleague', back: 'colleague' }, flag: 'ar_lender_clerk', arc: fin('debt_clerk') } },
      { t: 'Sell up, and owe nobody anything', r: 'You sell up and pay everything. You rent two rooms, and sleep well in them.',
        fx: { coin: 40, happy: 2, arLose: 1, flag: 'ar_debt_free', arc: fin('debt_sold') } },
    ] },
]);
})();
