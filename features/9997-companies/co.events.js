// Companies (9997): the life of your own company. Most come when the engine queues them (trigger: true): a captain
// falls and a serjeant takes his place, you are passed over, the bread runs out, a captain at the end of his
// patience. Others come from what the company is: its pay, its new men, its veterans, a name the chronicle retired.
const CO = () => A.CO;
const myCo = p => { try { return CO() && CO().myCompany(p); } catch (e) { return null; } };
const coyFill = (p, ctx) => {
  const C = myCo(p);
  if (!C) { ctx.skip = true; return null; }
  ctx.coy = ctx.coy || CO().coName(C.d, C.b, C.i, true);
  ctx.bn = ctx.bn || C.bn;
  ctx.capn = ctx.capn || (C.cap.pc ? 'you' : C.cap.given);
  ctx.serj = C.serjeants[0].given;
  ctx.food = String(Math.round(C.food));
  ctx.pay = String(C.pay);
  return C;
};
const capPerson = (p, ctx) => {
  const C = coyFill(p, ctx);
  if (!C) return null;
  const q = C.cap.person && C.cap.person.alive && !C.cap.pc ? C.cap.person : null;
  if (q) ctx.pid = q.id;
  return q;
};

A.defEvents([
  { id: 'co_new_captain', title: 'A new captain', trigger: true, cool: 1, npc: true,
    cond: (p, C) => C.soldier(p) && C.adult(p),
    setup: (p, ctx) => { const C = coyFill(p, ctx); if (!C || !ctx.pid || !A.P(ctx.pid) || !A.P(ctx.pid).alive) ctx.skip = true; ctx.old = ctx.old || 'the captain'; },
    text: 'They carry Captain {old} back on a door and lay him by the wagons with his boots still on. By dusk the {coy} has a new captain: {them}, who was a serjeant this morning. {khe} walks the lines with a lantern, saying each man\'s name. Some names {khe} has to ask.',
    choices: [
      { t: 'Stand up when {khe} reaches your fire', r: '{them} stops, looks at you, and nods. It is a small thing. The men saw it.', fx: { them: { op: 12 }, coy: { mo: 4, sat: 8 }, merit: 1 } },
      { t: 'Tell {khim} what {old} meant to do tomorrow', check: { s: 'tactics', s2: 'int', d: 45 },
        win: { r: 'You give it plainly: the ditch on the left, the second rank in reserve. {them} listens, and uses it.', fx: { them: { op: 15 }, merit: 3, skill: { tactics: 1 } } },
        lose: { r: 'You get it half wrong, and {them} knows it. "I will make my own plan, thank you."', fx: { them: { op: -6 }, happy: -2 } } },
      { t: 'Sit with {old} until they bury him', r: 'You sit with the dead man in the cold. In the morning the chaplain says you were the only one.', fx: { piety: 3, happy: -2, rel: { who: 'comrade', op: 4, all: true } } },
    ] },

  { id: 'co_passed_over', title: 'Passed over', trigger: true, cool: 2, npc: true,
    cond: (p, C) => C.soldier(p) && (p.mil.rank || 0) >= 4,
    setup: (p, ctx) => { if (!coyFill(p, ctx)) return; p.flags.co_passed_over = A.S.year; },
    text: 'The year\'s promotions are read out at muster. The {bn} goes to Captain {capn}, and you are not named. Captain {capn} has fewer fights than you and a better tailor. Your own company watches your face while the list is read.',
    choices: [
      { t: 'Shake his hand in front of the men', r: 'You shake it hard. The men take it as you meant it. The commander takes it as nothing at all.', fx: { honor: 3, coy: { mo: 3 }, happy: -3 } },
      { t: 'Ask the commander why', check: { s: 'persuasion', s2: 'wil', d: 52 },
        win: { r: 'He hears you out. "Next year," he says, and writes something down. It may be your name.', fx: { merit: 6, bossOp: 4 } },
        lose: { r: 'He hears you out, and then he tells you why, in front of his aide. You will not ask again.', fx: { bossOp: -10, happy: -5 } } },
      { t: 'Take the company drinking on your own purse', r: 'It costs a month\'s pay. Nobody in the {coy} talks about the list that night.', fx: { coin: -15, coy: { mo: 6, sat: 5 }, happy: 2 } },
    ] },

  { id: 'co_transfer_request', title: 'A captain asks to go', trigger: true, cool: 2, npc: true,
    cond: (p, C) => C.soldier(p) && C.adult(p),
    setup: (p, ctx) => { if (!coyFill(p, ctx)) return; p.flags.co_transfer = A.S.year; if (ctx.pid && !(A.P(ctx.pid) && A.P(ctx.pid).alive)) delete ctx.pid; ctx.who = ctx.capn; },
    text: 'Captain {who} of the {coy} has had enough: the pay late, the general a stranger to him, his men buried in places nobody will remember. He has asked for a transfer to the garrisons. The serjeants say he means it. He will go at the end of the week unless somebody gives him a reason not to.',
    choices: [
      { t: 'Give him a reason to stay', check: { s: 'persuasion', s2: 'ins', d: 50 },
        win: { r: 'You talk until the fire is ash. He tears up the letter. He does not say thank you, which is how you know.', fx: { coy: { mo: 5 }, merit: 2 } },
        lose: { r: 'He listens politely and goes anyway. Serjeant {serj} has the company by Sunday.', fx: { happy: -2 } } },
      { t: 'Wish him well and mean it', r: 'He goes with your good word and a bottle. Serjeant {serj} takes the company and does well enough.', fx: { honor: 2, happy: 1 } },
      { t: 'Tell the commander he is shirking', r: 'The commander thanks you for your zeal. The captain leaves in disgrace, and the men know who sent him.', fx: { bossOp: 6, merit: 2, rel: { who: 'comrade', op: -6, all: true }, honor: -4 } },
    ] },

  { id: 'co_turncoat', title: 'The company goes over', trigger: true, cool: 3, npc: true,
    cond: (p, C) => C.soldier(p) && C.atWar(p),
    setup: (p, ctx) => { if (!coyFill(p, ctx)) return; ctx.who = ctx.capn; ctx.foe = ctx.foe || 'the other side'; },
    text: 'Before dawn the picket wakes you. The {coy} is gone: Captain {who} took his men across the river in the dark to {foe}, with the colours and the pay chest. Their fires are still warm. One of them left his boots.',
    choices: [
      { t: 'Ride to warn the commander', r: 'You are the first to tell him. He remembers who was first.', fx: { merit: 5, bossOp: 5, happy: -2 } },
      { t: 'Say nothing until you are asked', r: 'By noon everyone knows. Nobody asks you anything, which is its own kind of answer.', fx: { honor: -2, happy: -1 } },
      { t: 'Go after the stragglers', check: { s: 'tracking', s2: 'spd', d: 55 },
        win: { r: 'You catch eleven of them in the reeds, wet and frightened, and bring them back. Nine are glad of it.', fx: { merit: 7, fame: 1, coy: { mo: 4 } } },
        lose: { r: 'The reeds are full of their pickets. You come back with an arrow in the arm and no stragglers.', fx: { health: -12, merit: 1 } } },
    ] },

  { id: 'co_forage', title: 'The seed grain', trigger: true, cool: 1, npc: true,
    cond: (p, C) => C.soldier(p) && C.atWar(p),
    setup: (p, ctx) => { if (!coyFill(p, ctx)) return; p.flags.co_forage = A.S.year; ctx.place = ctx.place || 'the village'; },
    text: 'There are {food} days of bread in the wagons. Serjeant {serj} has found the barn at {place} where the village keeps its seed grain for the spring. The headman stands in the door with his hat in his hands. "That is next year," he says. "That is all of next year."',
    choices: [
      { t: 'Take the seed grain', r: 'The company eats. The headman watches the sacks go. Next spring, somebody at {place} will not.', fx: { coy: { food: 6, mo: 3 }, honor: -5, piety: -2 } },
      { t: 'Leave it, and take the lord\'s barn instead', check: { s: 'stealth', s2: 'int', d: 50 },
        win: { r: 'The lord\'s steward is asleep. The lord\'s grain feeds the company for a week, and the village keeps its spring.', fx: { coy: { food: 5 }, honor: 2 } },
        lose: { r: 'The steward is awake, and has friends. You come back with half a sack and a black eye.', fx: { coy: { food: 1 }, health: -6 } } },
      { t: 'Leave it, and go hungry', r: 'You march on empty. The men curse you all the way to the river, and the headman blesses you all the way to his grave.', fx: { coy: { mo: -5 }, honor: 4, piety: 2, happy: -3 } },
    ] },

  { id: 'co_hungry_march', title: 'No bread', trigger: true, cool: 1,
    cond: (p, C) => C.soldier(p) && C.atWar(p),
    setup: (p, ctx) => { if (!coyFill(p, ctx)) return; p.flags.co_hungry = A.S.year; },
    text: 'The wagons are empty. The {coy} marches on what it can pick from the hedges, and men begin to slip away at night. Serjeant {serj} counts them every morning and stops saying the number out loud.',
    choices: [
      { t: 'Share out what you carry', r: 'A heel of bread, two onions, a twist of salt. Divided by forty it is nothing. They remember that you divided it.', fx: { coy: { mo: 5 }, health: -4, rel: { who: 'comrade', op: 6, all: true } } },
      { t: 'Raid the officers\' wagon', check: { s: 'stealth', s2: 'spd', d: 55 },
        win: { r: 'Hams and a cheese. Your section eats like lords for one night and says nothing to anyone.', fx: { health: 3, happy: 3, honor: -3 } },
        lose: { r: 'The provost catches you with a ham under your coat. Twenty strokes, in front of the company.', fx: { health: -10, merit: -6, happy: -4 } } },
      { t: 'Tighten your belt and keep step', r: 'You keep step. Hunger is a long road, and you walk all of it.', fx: { health: -3, wil: 1 } },
    ] },

  { id: 'co_desert', title: 'A word at night', trigger: true, cool: 2,
    cond: (p, C) => C.soldier(p) && C.atWar(p),
    setup: (p, ctx) => { const q = A.P(ctx.pid); if (!q || !q.alive || !coyFill(p, ctx)) { ctx.skip = true; return; } p.flags.co_desert = A.S.year; },
    text: 'In the dark {them} crouches by your blanket. No bread for days, no pay for longer. {khe} knows a road home that the provosts do not watch. "Two can go as quiet as one," {khe} whispers. "Come, or keep my secret."',
    choices: [
      { t: 'Talk {khim} out of it', check: { s: 'persuasion', s2: 'wil', d: 48 },
        win: { r: 'You talk until {khe} lies down again. In the morning {khe} will not meet your eye, and {khe} is still there.', fx: { them: { op: 10 } } },
        lose: { r: 'In the morning {khis} blanket is empty. Serjeant {serj} writes the name in the book with the others.', fx: (p, ctx) => { const q = A.P(ctx.pid); if (q && p.mil) { p.mil.squad = (p.mil.squad || []).filter(id => id !== q.id); q.occ = 'deserter'; p.mil.coDes = (p.mil.coDes || 0) + 1; } return ''; } } },
      { t: 'Keep the secret and let {khim} go', r: '{khe} squeezes your arm and is gone. You lie awake until the picket changes.', fx: (p, ctx) => { const q = A.P(ctx.pid); if (q && p.mil) { p.mil.squad = (p.mil.squad || []).filter(id => id !== q.id); q.occ = 'deserter'; p.mil.coDes = (p.mil.coDes || 0) + 1; p.happy = Math.max(0, p.happy - 2); } return ''; } },
      { t: 'Wake the serjeant', r: 'They take {them} in the morning. The flogging is in front of the company. Nobody sits by your fire for a week.', fx: { merit: 3, them: { op: -40 }, honor: -3, rel: { who: 'comrade', op: -8, all: true } } },
    ] },

  { id: 'co_arrears', title: 'Pay day without pay', w: 2, cool: 2,
    cond: (p, C) => C.soldier(p) && C.adult(p) && (() => { const c = myCo(p); return !!(c && c.pay >= 2); })(),
    setup: (p, ctx) => { coyFill(p, ctx); },
    text: 'The paymaster\'s table is set up in the square as it always is, and he sits behind it with an empty chest. The {coy} is {pay} months behind. The men stand in line anyway, because that is what they do on pay day.',
    choices: [
      { t: 'Stand in line with them', r: 'You stand in line. The paymaster writes your name in the book of what is owed. It is a long book now.', fx: { happy: -2, rel: { who: 'comrade', op: 3, all: true } } },
      { t: 'Lend the poorest men what you can', r: 'It is not much, but it buys bread for three families back home.', fx: { coin: -12, honor: 3, coy: { mo: 3 } } },
      { t: 'Go to the town and earn a little on the side', check: { s: 'trade', s2: 'int', d: 45 },
        win: { r: 'You carry sacks at the river for a week. Your purse is heavier, and nobody at the muster noticed.', fx: { coin: 14, sta: 1 } },
        lose: { r: 'The serjeant notices. Three days on the punishment roll.', fx: { merit: -3, happy: -2 } } },
    ] },

  { id: 'co_mutiny_talk', title: 'Talk of the chest', w: 1, cool: 4,
    cond: (p, C) => C.soldier(p) && C.adult(p) && (() => { const c = myCo(p); return !!(c && c.pay >= 3); })(),
    setup: (p, ctx) => { coyFill(p, ctx); },
    text: 'Three months unpaid, and the men of the {coy} talk low at the fires. The pay chest came up from the capital yesterday, they say, and it is for the general\'s guard, not for them. Somebody has a key. Somebody has a plan for the key.',
    choices: [
      { t: 'Tell them you want no part of it', r: 'They stop talking when you come to the fire, after that. Nothing comes of the plan. Nothing yet.', fx: { honor: 2, rel: { who: 'comrade', op: -4, all: true } } },
      { t: 'Carry the men\'s grievance to Captain {capn}', check: { s: 'persuasion', s2: 'wil', d: 52 },
        win: { r: 'The captain takes it up the line. A month\'s pay arrives in a week, from somewhere.', fx: { coy: { mo: 6, sat: 5 }, merit: 2, rel: { who: 'comrade', op: 5, all: true } } },
        lose: { r: 'The captain hears "mutiny" and nothing else. Your name goes up the line instead.', fx: { merit: -6, bossOp: -6 } } },
      { t: 'Report the plan to the provost', r: 'Two men hang. The rest are paid, in time. Not one of them ever drinks with you again.', fx: { merit: 6, bossOp: 6, honor: -4, rel: { who: 'comrade', op: -15, all: true } } },
    ] },

  { id: 'co_honour', title: 'A name for the colours', trigger: true, cool: 1,
    cond: (p, C) => C.soldier(p) && C.adult(p),
    setup: (p, ctx) => { if (!coyFill(p, ctx)) return; ctx.battle = ctx.battle || 'the last fight'; },
    text: 'The {bn} lost a quarter of its men at {battle} and held. The colonel\'s wife has sewn the name onto the colours in yellow thread, and on the morning of the parade the colours need a man to carry them past the general.',
    choices: [
      { t: 'Carry the colours yourself', r: 'You carry them past the general with your chin up and your knees shaking. He looks at the colours, not at you. That is right.', fx: { fame: 2, merit: 3, happy: 3 } },
      { t: 'Give them to the oldest man in the company', r: 'He carries them as if they weighed nothing, and weeps afterwards behind the wagons. The men love you a little for it.', fx: { coy: { mo: 5 }, honor: 2, rel: { who: 'comrade', op: 6, all: true } } },
      { t: 'Read out the names of the dead instead', r: 'It takes a long time. The general waits. Afterwards the chaplain shakes your hand.', fx: { piety: 3, coy: { mo: 3 }, bossOp: -2 } },
    ] },

  { id: 'co_the_new_men', title: 'The new men', w: 1, cool: 3,
    cond: (p, C) => C.soldier(p) && C.adult(p) && (() => { const c = myCo(p); return !!(c && (c.rec.nm || 0) >= 150); })(),
    setup: (p, ctx) => { coyFill(p, ctx); },
    text: 'Forty new men came up to the {coy} with the last draft, farm boys mostly, who hold a spear the way they hold a hoe. The old hands call them "the turnips" and make them carry everything. One of them asks you how to keep his feet from bleeding.',
    choices: [
      { t: 'Show them how it is done', r: 'Wet grass in the boots, rags wound tight, and the knack of the shield on the march. By the end of the month they look like soldiers from a distance.', fx: { skill: { command: 1 }, coy: { mo: 3 }, happy: 1 } },
      { t: 'Let them learn as you did', r: 'You learned by bleeding. So will they. Two of them go home in a month; the rest learn.', fx: { wil: 1, coy: { mo: -2 } } },
      { t: 'Make the turnips carry your kit too', r: 'Your pack is lighter all month. The turnips will remember you the way you remember your first serjeant.', fx: { sta: 1, honor: -2, coy: { mo: -3 } } },
    ] },

  { id: 'co_serjeant', title: 'A serjeant for the company', w: 1, cool: 4,
    cond: (p, C) => C.soldier(p) && (p.mil.rank || 0) >= 4 && (() => { try { return A.squad(p).some(q => A.SQUAD && A.SQUAD.standing(q)); } catch (e) { return false; } })(),
    setup: (p, ctx) => {
      const q = A.squad(p).filter(x => A.SQUAD.standing(x)).sort((a, b) => ((b.sq || {}).n || 0) - ((a.sq || {}).n || 0))[0];
      if (!q || !coyFill(p, ctx)) { ctx.skip = true; return; }
      ctx.pid = q.id; ctx.standing = A.SQUAD.standing(q);
    },
    text: 'Serjeant {serj} of the {coy} has taken a fever and will not march again. The company needs a serjeant by the morning. {them} has come back from more missions with you than anyone, {standing} now. {khe} has never asked for anything.',
    choices: [
      { t: 'Give {them} the halberd', r: '{them} takes it without a word, and the next morning has the company up before the drums. You have a serjeant.', fx: (p, ctx) => { const q = A.P(ctx.pid); if (q && p.mil) { p.mil.coSj = q.id; q.occ = 'Serjeant of the ' + ctx.coy; } return ''; } },
      { t: 'Keep {khim} beside you in the ranks', r: 'You give the halberd to the next man on the roll. {them} understands, or says so.', fx: { them: { op: -4 }, happy: 1 } },
      { t: 'Let the men choose', check: { s: 'command', s2: 'ins', d: 45 },
        win: { r: 'They choose {them}, loudly. A serjeant the men chose is worth two the captain chose.', fx: (p, ctx) => { const q = A.P(ctx.pid); if (q && p.mil) { p.mil.coSj = q.id; q.occ = 'Serjeant of the ' + ctx.coy; } return ''; } },
        lose: { r: 'They choose the loudest man in the company, which is not the same thing.', fx: { coy: { mo: -2 } } } },
    ] },

  { id: 'co_old_company', title: 'The old name', w: 1, cool: 10, once: true,
    cond: (p, C) => C.soldier(p) && C.adult(p) && (() => { const c = myCo(p); return !!(c && c.rec.nw); })(),
    setup: (p, ctx) => { if (!coyFill(p, ctx)) return; ctx.old = ctx.bn.replace(/^the new /, ''); },
    text: 'An old man with one arm stops you in the market and asks your battalion. When you tell him, "the new {old}", he laughs until he coughs. "The new," he says. "I was in the old one. There were nine of us left at the end. You wear it well enough, I suppose."',
    choices: [
      { t: 'Buy him a drink and ask about the old one', r: 'He tells it all: the ford, the winter, the nine. You carry the name differently after.', fx: { coin: -3, coy: { mo: 3 }, happy: 2 } },
      { t: 'Tell him the new one is better', r: 'He stops laughing. "Then go and prove it," he says, and walks off.', fx: { wil: 1, honor: -1 } },
    ] },
]);
