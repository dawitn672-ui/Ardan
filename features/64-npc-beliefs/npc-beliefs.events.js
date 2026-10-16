// NPC beliefs: scenes in which someone acts on what they believe, true or not, and in which your own knowledge turns
// out to be wrong. ctx.cid is the claim a scene is about; ctx.nbFalse = 1 when the belief driving it is false (the
// bench's count). Setups read and never roll: the person and the claim are picked in order, or by a hash of the year.
// NPC-started scenes (npc: true) are 21-npc-initiative moves or follow-ups; the rest are drawn from the pool.
(function () {
const NB = () => A.NPCB;
const he = (ctx, t) => { ctx.khe = A.he(t); ctx.khim = A.him(t); ctx.khis = A.his(t); };
const words = (s, n) => { const w = String(s || '').replace(/[{}<>"]/g, '').split(/\s+/).filter(Boolean); return w.length <= n ? w.join(' ') : w.slice(0, n).join(' ').replace(/[,;:.]$/, '') + '…'; };
const person = (p, ctx) => { const t = ctx.pid && A.P(ctx.pid); return t && t.alive && t.id !== p.id && A.isAdult(t) ? t : null; };
const mark = (ctx, c, st) => { ctx.cid = c.id; ctx.nbFalse = NB().isFalse(c, st == null ? 1 : st) ? 1 : 0; };
const why = (p, ctx) => ctx.niWhy || '';
// the people you know, in order
const known = p => Object.keys(p.rel || {}).sort().map(A.P).filter(t => t && t.alive && t.id !== p.id && A.isAdult(t));
// a claim held by the most people you know, among those that pass the test
const mostHeld = (p, test) => {
  const n = {};
  let best = null;
  for (const t of known(p)) for (const x of NB().beliefs(t)) if (test(x, t)) { n[x.c.id] = (n[x.c.id] || 0) + 1; if (!best || n[x.c.id] > n[best.c.id] || (n[x.c.id] === n[best.c.id] && x.c.id < best.c.id)) best = Object.assign({ t }, x); }
  return best ? { c: best.c, st: best.st, n: n[best.c.id], t: known(p).find(t => NB().held(t, best.c.id) === best.st) } : null;
};

A.defEvents([
  // ------------------------------------------------------------------ someone acts on what they believe of you
  {
    id: 'nb_accused', npc: true, trigger: true, title: 'What {them} believes',
    cond: (p, C) => C.adult(p), more: why,
    setup: (p, ctx) => {
      const t = person(p, ctx), x = t && NB().worstOf(p, t, 6);
      if (!x) { ctx.skip = 1; return; }
      he(ctx, t); mark(ctx, x.c, x.st); ctx.rumour = NB().say(x.c, p); ctx.kk = x.c.k;
    },
    text: (p, ctx) => ctx.kk === 'K'
      ? '{them} is waiting at your gate with {khis} hat crushed in {khis} fist. {khe} has it from people {khe} trusts {rumour}. {khe} says it plainly, so the neighbours can hear.'
      : '{them} will not take your hand at the well. {khe} tells you why, loud enough for the women at the trough: {khe} has heard {rumour}, and {khe} believes it.',
    choices: [
      { t: 'Swear to {khim} that it is not so', check: { s: 'persuasion', s2: 'wil', d: 45 },
        win: { r: '{them} hears you out to the end. Then {khe} nods once, slowly, and puts {khis} hat back on.', fx: { nb: { fix: 0.5 }, them: { op: 6 }, flag: 'nb_cleared' } },
        lose: { r: '{them} has heard men swear before. {khe} walks off and tells it again, to someone new.', fx: { nb: { spread: 0.3 }, them: { op: -4 }, happy: -2 } } },
      { t: 'Tell {khim} to say it before the elders, or never', check: { s: 'intimidation', s2: 'wil', d: 50 },
        win: { r: '{them} will not stand up before the elders with it. By the next market day the story has gone quiet.', fx: { nb: { fixAll: 0.5 }, fame: 2, them: { op: -6 } } },
        lose: { r: '{khe} says it before the elders, and before everyone who came to watch.', fx: { nb: { spreadAll: 0.4 }, fame: -3 } } },
      { t: 'Let {khim} think it, and be afraid', r: 'You say nothing at all. {them} takes a step back without meaning to. So do the people behind {khim}.', fx: { honor: -2, fame: 1, wil: 1 } },
      { t: 'Walk on without a word', r: 'You walk on. It sits with you through supper and most of the night.', fx: { happy: -2, wil: 1 } },
    ],
  },
  {
    id: 'nb_praised', npc: true, trigger: true, title: 'A cup raised to you',
    cond: (p, C) => C.adult(p), more: why,
    setup: (p, ctx) => {
      const t = person(p, ctx), x = t && NB().taleOf(p, t);
      if (!x) { ctx.skip = 1; return; }
      he(ctx, t); mark(ctx, x.c, x.st); ctx.tale = words(NB().say(x.c, p), 34);
    },
    text: '{them} stands you a cup in front of half the hall and tells them all {tale}. Heads turn your way. It did not happen like that. Not quite, and not by half.',
    choices: [
      { t: 'Tell them how it really went', r: 'There is some laughter, and then real questions. {them} listens hardest of anyone.', fx: { honor: 2, fame: -1, nb: { fix: 0.4 } } },
      { t: 'Raise the cup and say nothing', r: 'You drink. The story goes on without you, and comes out better than before.', fx: { fame: 1, happy: 1 } },
      { t: 'Tell it bigger still', r: 'You give them the part {them} left out, and a part nobody could have known. They cheer.', fx: { fame: 2, honor: -3, nb: { boast: 0.5 }, flag: 'nb_embellished' } },
      { t: 'Ask {khim} a favour while the cup is full', r: '{them} says yes before you have finished asking. You will both remember why.', fx: { owed: 1, honor: -1 } },
    ],
  },
  {
    id: 'nb_cleared', npc: true, trigger: true, title: 'Someone speaks for you',
    cond: (p, C) => C.adult(p) && C.flag(p, 'nb_cleared'), more: why,
    setup: (p, ctx) => {
      const t = person(p, ctx), c = NB().claim(ctx.cid);
      if (!t || !c || c.s !== p.id || c.t) { ctx.skip = 1; return; }
      he(ctx, t); mark(ctx, c, 1); ctx.said = words(NB().say(c, p), 24);
    },
    text: 'At the mill someone was telling the old story again, {said}. {them} heard it and stopped it. {khe} told them where it came from, and that it was a lie. Word of it reaches you two days later.',
    choices: [
      { t: 'Thank {khim} with something better than words', r: 'You bring a ham and a jug. {them} takes both and pretends it was nothing.', fx: { them: { op: 8 }, coin: -10 } },
      { t: 'Ask {khim} to say it to the priest as well', r: '{khe} does, after the next service. The priest says it again from the step.', fx: { fame: 1, them: { op: -2 }, nb: { fixAll: 0.4 } } },
      { t: 'Shrug it off', r: 'Stories come and go. You have work to do.', fx: { wil: 1 } },
    ],
  },
  // ------------------------------------------------------------------ talk of you
  {
    id: 'nb_slander_spread', title: 'Doors that close sooner',
    cond: (p, C) => C.adult(p) && C.nbSlander(p), w: 3, cool: 8,
    setup: (p, ctx) => {
      const x = mostHeld(p, y => y.st > 0 && y.c.s === p.id && y.c.v < 0 && !y.c.t);
      if (!x || x.n < 2 || !x.t) { ctx.skip = 1; return; }
      ctx.pid = x.t.id; he(ctx, x.t); mark(ctx, x.c, x.st); ctx.said = words(NB().say(x.c, p), 26); ctx.n = String(x.n);
    },
    text: 'Doors close a little sooner when you pass. By the third day you have the shape of it: {n} people you know believe {said}. {them} is one of them. None of them has said it to your face.',
    choices: [
      { t: 'Go round and answer it, door by door', check: { s: 'persuasion', s2: 'int', d: 50 },
        win: { r: 'It takes a week of doorsteps. At the end of it most of them are ashamed, and say so.', fx: { nb: { fixAll: 0.6 }, fame: 1 } },
        lose: { r: 'Some listen. More of them watch you go from door to door and take it for guilt.', fx: { nb: { fixAll: 0.2 }, happy: -2 } } },
      { t: 'Answer it with a better story about yourself', r: 'You tell your side, and then a little more. The new story drowns the old one, for now.', fx: { nb: { boast: 0.6 }, honor: -2, fame: 1, flag: 'nb_embellished' } },
      { t: 'Let it burn out on its own', r: 'You keep your head down and your door open. It is slow.', fx: { wil: 1, happy: -1 } },
    ],
  },
  {
    id: 'nb_tale_outgrows', title: 'The tale comes due',
    cond: (p, C) => C.adult(p) && (C.flag(p, 'nb_embellished') || C.nbTale(p)), w: 1.5, cool: 12,
    setup: (p, ctx) => {
      const x = mostHeld(p, y => y.st > 0 && y.c.s === p.id && y.c.k === 'T');
      if (!x || !x.t) { ctx.skip = 1; return; }
      ctx.pid = x.t.id; he(ctx, x.t); mark(ctx, x.c, x.st); ctx.tale = words(NB().say(x.c, p), 30);
    },
    text: '{them} has heard {tale}. Half the district has. Now {khe} has a use for it: there is a thing to be done that wants just such a person, and {khe} has named the day.',
    choices: [
      { t: 'Do it, and make the tale true', check: { s: 'wil', s2: 'sta', d: 55 },
        win: { r: 'It is harder than the tale and uglier, and you do it. Nobody will ever tell this part right either.', fx: { fame: 3, them: { op: 8 } } },
        lose: { r: 'It goes badly, in front of the people who came to see the tale come true.', fx: { health: -10, fame: -3, nb: { fixAll: 0.4 } } } },
      { t: 'Tell {khim} it grew in the telling', r: '{them} is put out, then thoughtful. The story is smaller after that, and so are you, a little.', fx: { honor: 2, fame: -2, nb: { fixAll: 0.5 } } },
      { t: 'Plead an old injury', r: '{them} says {khe} understands, in the voice people use when they do not.', fx: { happy: -2, them: { op: -4 } } },
    ],
  },
  {
    id: 'nb_parent_tale', title: 'Your parent, as they tell it',
    cond: (p, C) => C.adult(p) && C.nbParent(p), w: 1.5, cool: 15,
    setup: (p, ctx) => {
      const r = NB().parentTale(p);
      if (!r) { ctx.skip = 1; return; }
      const par = A.P(r.x.c.s);
      ctx.pid = r.t.id; he(ctx, r.t); mark(ctx, r.x.c, r.x.st); ctx.said = words(NB().say(r.x.c, p), 30);
      ctx.parRole = par && par.sex === 'F' ? 'mother' : 'father';
    },
    text: '{them} knew your {parRole}, or says so. {khe} tells it to anyone who will stand still: {said}. Then {khe} looks you up and down, as if you ought to be able to do the same.',
    choices: [
      { t: 'Tell {khim} what your {parRole} was really like', r: 'You tell {khim}. It is a smaller story, and a better one, and {them} does not much want it.', fx: { nb: { truth: 1 }, honor: 1, them: { op: -3 } } },
      { t: 'Promise yourself to live up to it', r: 'You carry it home with you. It is heavy, and you mean to carry it.', fx: { wil: 1, fame: 1, happy: -1 } },
      { t: 'Let the story keep {khim} warm', r: 'You buy {them} another and hear it again. It is a good story.', fx: { happy: 1, them: { op: 3 } } },
    ],
  },
  // ------------------------------------------------------------------ what people say of others, and what you believe
  {
    id: 'nb_gossip', npc: true, trigger: true, title: '{them} has heard something',
    cond: (p, C) => C.adult(p), more: why,
    setup: (p, ctx) => {
      const t = person(p, ctx), x = t && NB().gossipOf(p, t);
      if (!x) { ctx.skip = 1; return; }
      he(ctx, t); mark(ctx, x.c, x.st); ctx.said = words(NB().say(x.c, p), 26);
      const o = A.P(x.c.s); ctx.other = o ? o.given : 'them';
    },
    text: '{them} draws you aside, out of earshot of the yard. {khe} has it on good authority {said}. "I would not tell just anyone," {khe} says, and tells you the rest of it.',
    choices: [
      { t: 'Thank {khim}, and believe it', r: 'It explains a few things, now that you think of it. Or seems to.', fx: { nb: { believe: 1 }, them: { op: 4 }, flag: 'nb_believed' } },
      { t: 'Ask around before you believe a word', check: { s: 'intrigue', s2: 'ins', d: 45 },
        win: { r: 'A week of careful questions, and you have it from someone who would know.', fx: { nb: { learn: 1 } } },
        lose: { r: 'Nobody will say yes or no. {other} hears that you have been asking.', fx: { nb: { doubt: 1 }, them: { op: -3 } } } },
      { t: 'Go to {other} and tell {other} what is said', r: '{other} goes white, then red, and asks who. You do not say. {them} will guess.', fx: { nb: { warn: 1 }, honor: 2, them: { op: -6 } } },
      { t: 'Tell {khim} you will not hear tales', r: '{them} shrugs and talks about the weather. {khe} will tell someone else.', fx: { honor: 1, them: { op: -2 } } },
    ],
  },
  {
    id: 'nb_truth_out', trigger: true, title: 'It was not so',
    cond: (p, C) => C.adult(p) && C.flag(p, 'nb_believed'),
    setup: (p, ctx) => {
      const c = NB().claim(ctx.cid), st = c ? NB().pcHeld(p, c.id) : 0;
      if (!c || st !== 1 || !NB().isFalse(c, st)) { ctx.skip = 1; return; }
      const o = A.P(c.s);
      if (!o || !o.alive) { ctx.skip = 1; return; }
      ctx.pid = o.id; he(ctx, o); mark(ctx, c, st); ctx.said = words(NB().say(c, p), 26);
      const e = p.nbk[c.id]; ctx.from = e && e[1] ? (A.P(e[1]) || {}).given || NB().name(e[1]) || 'someone' : 'someone'; ctx.heardYear = String(e ? e[2] : A.S.year);
    },
    text: 'You learn it by accident, over something else entirely. {from} told you in {heardYear} {said}. It was never true. The one who tells you now was there, and has no reason to lie.',
    choices: [
      { t: 'Go to {them} and own that you believed it', r: '{them} hears you out. {khe} had wondered why you went cold. Now {khe} knows.', fx: { nb: { learn: 1, own: 1 }, honor: 2, happy: -2 } },
      { t: 'Unsay it to everyone you told', r: 'It is an awkward week. Some of them had liked the story better.', fx: { nb: { learn: 1, fixAll: 0.5 }, honor: 1, fame: -1 } },
      { t: 'Keep it to yourself', r: 'You put it away with the other things you were wrong about. It is not a small pile.', fx: { nb: { learn: 1 }, happy: 1 } },
    ],
  },
  {
    id: 'nb_lie_back', npc: true, trigger: true, title: 'The story comes home',
    cond: (p, C) => C.adult(p) && C.flag(p, 'nb_lied'), more: why,
    setup: (p, ctx) => {
      const t = person(p, ctx), c = NB().claim(ctx.cid);
      if (!t || !c || c.s !== t.id) { ctx.skip = 1; return; }
      he(ctx, t); mark(ctx, c, 1); ctx.said = words(NB().say(c, p), 24);
    },
    text: '{them} knows the story began with you: {said}. {khe} does not say how {khe} knows. {khe} only asks you why, in a voice gone very quiet.',
    choices: [
      { t: 'Deny it to {khis} face', check: { s: 'deception', s2: 'wil', d: 50 },
        win: { r: '{them} wants to believe you more than {khe} wants to be right. {khe} goes, unsure.', fx: { them: { op: 2 }, honor: -1 } },
        lose: { r: 'You hear your own voice and so does {them}. {khe} leaves without another word.', fx: { them: { op: -15 }, fame: -2 } } },
      { t: 'Own it, and take it back in public', r: 'You say it at the well, every word. It costs you, and {them} sees what it costs.', fx: { honor: 2, fame: -2, them: { op: 8 }, nb: { fixAll: 0.6 } } },
      { t: 'Tell {khim} you would do it again', r: 'Now {khe} knows where things stand. So do you.', fx: { them: { op: -15 }, wil: 1, honor: -1 } },
    ],
  },
  // ------------------------------------------------------------------ the player's own telling (the person view's "Talk of what is said")
  {
    id: 'nb_tell', trigger: true, title: 'What people say',
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => {
      const t = person(p, ctx);
      if (!t) { ctx.skip = 1; return; }
      he(ctx, t);
      const you = NB().falseAbout(p, t).filter(x => x.st > 0 && x.c.v < 0).sort((a, b) => a.c.v - b.c.v)[0];
      if (you) { ctx.cidYou = you.c.id; ctx.cid = you.c.id; ctx.nbFalse = 1; }
      const other = NB().fixableOther(p, t);
      if (other) { ctx.cidOther = other.c.id; const o = A.P(other.c.s); ctx.other = o ? o.given : NB().name(other.c.s) || 'that'; }
      const foe = NB().foeFor(p, t);
      if (foe) { ctx.oid = foe.id; ctx.foe = foe.given; }
    },
    text: '{them} has an hour, and so have you. Talk turns, as it will, to what people are saying: of you, of the neighbours, of the lords and how they live.',
    choices: [
      { t: 'Set {khim} right about what is said of you', req: (p, C, ctx) => !!ctx.cidYou, check: { s: 'persuasion', s2: 'int', d: 40 },
        win: { r: '{them} hears you out, and says {khe} never quite believed it. That is not true either.', fx: { nb: { as: 'cidYou', fix: 0.4 }, them: { op: 3 } } },
        lose: { r: '{them} nods along in a way that tells you {khe} has made up {khis} mind.', fx: { them: { op: -2 }, happy: -1 } } },
      { t: 'Tell {khim} the truth about {other}', req: (p, C, ctx) => !!ctx.cidOther, r: 'You tell {khim} what you know, and how you know it. {them} is quiet for a while.', fx: { nb: { as: 'cidOther', truth: 1 }, honor: 1 } },
      { t: 'Tell {khim} a story about {foe}', req: (p, C, ctx) => !!ctx.oid, check: { s: 'deception', s2: 'int', d: 45 },
        win: { r: '{them} leans in. By the end, {khe} is telling it back to you with parts of {khis} own.', fx: { nb: { lie: 'crime' }, honor: -3, flag: 'nb_lied' } },
        lose: { r: '{them} knows {foe}, and knows you, and can see what you are doing.', fx: { honor: -3, fame: -2, them: { op: -6 } } } },
      { t: 'Tell your own deeds, and add to them', r: 'You tell it well. {them} will tell it better.', fx: { nb: { boast: 0.4 }, fame: 1, honor: -2, flag: 'nb_embellished' } },
    ],
  },
  // ------------------------------------------------------------------ battles and beasts
  {
    id: 'nb_battle_tale', title: 'How the battle went',
    cond: (p, C) => C.adult(p) && C.nbBattle(p), w: 2.5, cool: 8,
    setup: (p, ctx) => {
      let best = null;
      for (const t of known(p)) for (const x of NB().beliefs(t)) if (x.c.k === 'B' && NB().isFalse(x.c, x.st) && NB().pcKnows(p, x.c) && (!best || x.c.y > best.x.c.y)) best = { t, x };
      if (!best || !A.WC) { ctx.skip = 1; return; }
      const e = A.WC.ent(best.x.c.o); if (!e) { ctx.skip = 1; return; }
      ctx.pid = best.t.id; he(ctx, best.t); mark(ctx, best.x.c, best.x.st);
      ctx.said = words(NB().say(best.x.c, p), 24);
      ctx.truth = `${A.realmShort(e.a)} won, and ${A.fmt(NB().round2(Array.isArray(e.x) ? e.x[0] : 0))} fell`;
    },
    text: '{them} has the whole bench listening. {khe} tells it as {khis} side tells it: {said}. You know how it went: {truth}. {them} is just coming to the part {khe} likes best.',
    choices: [
      { t: 'Set {khim} right, numbers and all', r: 'The bench goes quiet. {them} says you were not there. You were, or near enough.', fx: { nb: { truth: 1 }, honor: 1, them: { op: -5 } } },
      { t: 'Let it stand, and drink to the dead', r: 'You lift your cup with the rest. The dead do not care whose count is right.', fx: { happy: 2 } },
      { t: 'Tell it bigger still', r: 'You add a charge nobody made and a banner nobody took. They love it.', fx: { fame: 1, honor: -1, nb: { spread: 0.5 } } },
    ],
  },
  {
    id: 'nb_beast_wrong', title: 'Going after it the old way',
    cond: (p, C) => C.adult(p) && C.nbBeast(p, 'wrong'), w: 2, cool: 10,
    setup: (p, ctx) => {
      const r = NB().beastPerson(p, 'wrong');
      if (!r) { ctx.skip = 1; return; }
      ctx.pid = r.t.id; he(ctx, r.t); ctx.beast = r.b.c.id; ctx.beastName = r.b.c.name.replace(/^The /, '');
      ctx.tale = words(String(r.b.c.belief || '').toLowerCase().replace(/[.]$/, ''), 22); ctx.nbFalse = 1;
    },
    text: '{them} is getting ready to go after the {beastName}, and doing it by the old tales: {tale}. You have learned what it really is. {khe} means to leave at first light.',
    choices: [
      { t: 'Tell {khim} what it really is', r: '{them} argues, then listens, then goes to the smith for something different.', fx: { nb: { beast: 1 }, them: { op: 6 } } },
      { t: 'Go with {khim}', check: { s: 'survival', s2: 'ins', d: 50 },
        win: { r: 'You find it where you said it would be, and it does what you said it would. You both come home.', fx: { nb: { beast: 1 }, fame: 2, them: { op: 10 } } },
        lose: { r: 'You are right about the beast, and it is no comfort while it is on top of you.', fx: { health: -12, them: { op: 4 } } } },
      { t: 'Let {khim} learn it the hard way', r: 'You wish {khim} luck. Some lessons do not keep unless they cost something.', fx: { wil: 1, them: { op: -2 } } },
    ],
  },
  {
    id: 'nb_beast_right', title: 'The tales have it wrong',
    cond: (p, C) => C.adult(p) && C.nbBeast(p, 'right'), w: 2, cool: 10,
    setup: (p, ctx) => {
      const r = NB().beastPerson(p, 'right');
      if (!r) { ctx.skip = 1; return; }
      ctx.pid = r.t.id; he(ctx, r.t); ctx.beast = r.b.c.id; ctx.beastName = r.b.c.name.replace(/^The /, '');
    },
    text: 'You mention the {beastName} over the fence, and what everyone says of it. {them} snorts. {khe} has seen three of them die, {khe} says, and the tales have it all backwards.',
    choices: [
      { t: 'Hear {khim} out', r: '{them} draws it in the dirt with a stick: where it goes, what it eats, where it is soft.', fx: { nb: { learnBeast: 1 }, them: { op: 4 }, skill: { survival: 1 } } },
      { t: 'Laugh it off', r: 'Everyone knows what the {beastName} is. {them} shrugs and goes in.', fx: { happy: 1, them: { op: -4 } } },
      { t: 'Pay {khim} to show you', check: { s: 'survival', s2: 'spd', d: 45 },
        win: { r: 'Two days in the wet, and then you see it, and {khe} was right about all of it.', fx: { nb: { learnBeast: 1 }, skill: { survival: 2 }, coin: -5 } },
        lose: { r: 'Two days in the wet and nothing to show but a cough.', fx: { coin: -5, health: -5 } } },
    ],
  },
  // ------------------------------------------------------------------ the court
  {
    id: 'nb_court_word', title: 'What the council believes',
    cond: (p, C) => (C.ruler(p) || C.noble(p)) && C.nbCourt(p), w: 2, cool: 6,
    setup: (p, ctx) => {
      const x = NB().courtTopic(p);
      if (!x) { ctx.skip = 1; return; }
      const s = A.P(x.c.s);
      if (!s || !s.ruler || !A.realm(s.ruler)) { ctx.skip = 1; return; }
      mark(ctx, x.c, x.st); ctx.rid = s.ruler; ctx.said = words(NB().say(x.c, p), 26);
    },
    text: 'There is a story at court, and everyone tells it the same way: {said}. Nobody at the table has seen proof. Everyone at the table has a cousin who has.',
    choices: [
      { t: 'Send someone quiet to find out', check: { s: 'intrigue', s2: 'int', d: 45 },
        win: { r: 'Your man comes back thinner, with names and dates. You know now, one way or the other.', fx: { nb: { court: 'probe' }, skill: { intrigue: 1 } } },
        lose: { r: 'Your man comes back with nothing but a bill for his lodging.', fx: { coin: -15 } } },
      { t: 'Use it against {other} in council', r: 'It goes into the letters to the neighbours. Whether it is true matters less, for now.', fx: { nb: { court: 'use' }, honor: -1, stability: 2 } },
      { t: 'Forbid the tale at your table', r: 'They stop telling it in front of you.', fx: { nb: { court: 'forbid' }, honor: 1, stability: -1 } },
    ],
  },
]);
})();
