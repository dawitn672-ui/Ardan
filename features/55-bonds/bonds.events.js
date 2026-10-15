// Bonds (55-bonds): scenes that come out of a bond's history, its secrets, and the long memories of families and realms.
// The NPC-started ones are kinds of 21-npc-initiative's monthly move (registered in the core files), so they carry
// npc: true and are only ever queued. Each cites one dated line of the bond ({hline}) and acts on it: an apology settles
// a wrong, a favour asked spends a kindness, a refusal brings it back to its full weight.
(function () {
const BD = () => A.BONDS;
const SEC = () => A.BONDS.SEC;
const FE = () => A.BONDS.FEUD;
const alive = (p, ctx) => { const t = A.P(ctx.pid); if (!t || !t.alive || t.id === p.id) { ctx.skip = true; return null; } return t; };
const price = (p, ctx, frac, lo) => { const t = A.P(ctx.pid); if (!t) return; ctx.amtN = BD().sum(p, t, frac, lo); ctx.amt = BD().coin(ctx.amtN); };
const can = n => (p, C, ctx) => (p.coin || 0) >= (+ctx[n] || 0) && (+ctx[n] || 0) > 0;
const pay = (p, ctx, n) => { const v = Math.min(Math.floor(p.coin || 0), +ctx[n] || 0); p.coin = (p.coin || 0) - v; return v; };
const why = (p, ctx) => ctx.niWhy || '';   // 21-npc-initiative's "Why ..." line, under Read more
const GIFT = ['a ham under one arm', 'a jar of good honey', 'a knife with a horn handle', 'a cheese the size of a cartwheel', 'a skin of last year\'s wine', 'a hen that still lays'];
const ASK = ['a place for a cousin in your household', 'a word on {theirHis} behalf with the magistrate', 'a loan of your cart for the harvest', 'your name on a letter to the guild'];

A.defEvents([
  // ---------------------------------------------------------------- what passed between you (Relationships 4)

  { id: 'bd_old_kindness', title: 'An old kindness', trigger: true, npc: true, cool: 1,
    cond: (p, C) => C.adult(p), more: why,
    setup: (p, ctx) => BD().pastSetup(1, { min: 10, age: 2, kin: false, then: (p2, c, t) => { c.gift = BD().hp(GIFT, t.id, A.S.year); } })(p, ctx),
    text: '{them} is at your door with {gift}, and no reason ready for it. {hline} {theyHe} says it was nothing, then stays for supper.',
    choices: [
      { t: 'Ask {themHim} in for supper', r: 'You eat, and talk until the candle is down to nothing. {theyHe} walks home lighter.',
        fx: { happy: 3, them: { op: 6 }, need: { company: 12 }, bonds: { refresh: true, note: { t: '{them} came to thank you for {hy}' } } } },
      { t: 'Ask a favour of {themHim} in return', r: 'You ask. {theyHe} agrees at once, and something goes out of the evening.',
        fx: { owed: 1, them: { op: -4 }, bonds: { spend: true } } },
      { t: 'Tell {themHim} it was nothing, and mean it', r: '{theyHe} argues, then lets it go, and leaves the gift on the bench anyway.',
        fx: { honor: 2, bonds: { settle: 0.6 } } },
    ] },

  { id: 'bd_old_wrong', title: 'What {them} has not forgotten', trigger: true, npc: true, cool: 1,
    cond: (p, C) => C.adult(p), more: why,
    setup: (p, ctx) => { BD().pastSetup(-1, { min: 10, age: 1, kin: false })(p, ctx); if (!ctx.skip) price(p, ctx, 0.15, 5); },
    text: '{them} stops you in the street, loud enough for the stalls to hear. {hline} {theyHe} wants it answered, here, in front of people who know you both.',
    choices: [
      { t: 'Say you were wrong, there and then', r: 'You say it plainly. Somebody laughs. {them} does not, and nods once.',
        fx: { honor: 2, fame: -1, them: { op: 10 }, bonds: { settle: 0.3, note: { t: 'You owned in public what you did in {hy}' } } } },
      { t: 'Offer to make it good in coin ({amt})', req: can('amtN'), r: '{them} counts the {amt} in front of everyone. It is not forgiveness. It is something.',
        fx: (p, ctx) => { pay(p, ctx, 'amtN'); return A.applyFx(p, { them: { op: 6 }, bonds: { settle: 0.5, note: { t: 'You paid for what you did in {hy}' } } }, ctx); } },
      { t: 'Tell {themHim} you would do it again', r: 'You say it, and walk on. Behind you {them} has gone very quiet.',
        fx: { wil: 1, them: { op: -10, type: 'rival' }, bonds: { refresh: true } } },
      { t: 'Walk on without a word', r: 'You walk on. People watch you go, and start talking once you are past.', fx: { fame: -1, happy: -2 } },
    ] },

  { id: 'bd_kin_grudge', title: '{them} remembers', trigger: true, npc: true, cool: 1,
    cond: (p, C) => C.adult(p), more: why,
    setup: (p, ctx) => { BD().pastSetup(-1, { min: 12, kin: true })(p, ctx); if (!ctx.skip) price(p, ctx, 0.3, 10); },
    text: '{them} is waiting where the road narrows, alone. {hline} {theyHe} has come a long way to say it to your face.',
    choices: [
      { t: 'Offer blood money ({amt})', req: can('amtN'), r: '{them} takes it, because {theirHis} family needs it, and hates you a little more for that.',
        fx: (p, ctx) => { pay(p, ctx, 'amtN'); return A.applyFx(p, { them: { op: 12 }, honor: 1, bonds: { settle: 0.5, note: { t: 'You paid blood money for {hy}' } } }, ctx); } },
      { t: 'Hear {themHim} out, all of it', check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: 'You stand and listen until {theyHe} runs out of words. It is not peace, but it is less than it was.', fx: { them: { op: 12 }, bonds: { settle: 0.6 } } },
        lose: { r: '{theyHe} runs out of words and finds a knife instead. You get away from it, just.', fx: { health: -6, them: { op: -5 } } } },
      { t: 'Face {themHim}, if {theyHe} insists on it', r: '{theyHe} insists.',
        fx: { bonds: { refresh: true }, duel: { foe: 'them', opts: { lethal: false, toYield: true, title: 'An old score' } } } },
      { t: 'Ride past', r: 'You ride past. {theyHe} calls something after you that you do not quite hear.', fx: { happy: -2, wil: 1 } },
    ] },

  { id: 'bd_kin_debt', title: 'A debt that passed down', trigger: true, npc: true, cool: 1,
    cond: (p, C) => C.adult(p), more: why,
    setup: (p, ctx) => BD().pastSetup(1, { min: 8, kin: true, then: (p2, c, t) => { c.ask = BD().hp(ASK, t.id, A.S.year).replace('{theirHis}', A.his(t)); } })(p, ctx),
    text: '{them} asks for you by name at the gate. {hline} {theyHe} has brought a small gift, and a larger favour: {ask}.',
    choices: [
      { t: 'Grant {themHim} what {theyHe} asks', r: 'You do it. It costs you a morning and a little standing, and {them} will not forget it.',
        fx: { them: { op: 14 }, owed: 1, fame: -1, bonds: { refresh: true, note: { t: 'You did right by {themHim}, as you did by {hof} {hy}' } } } },
      { t: 'Take the gift, and refuse the favour', r: '{theyHe} hides the disappointment badly. The gift is good, at least.',
        fx: { coin: 8, them: { op: -6 }, bonds: { spend: true } } },
      { t: 'Tell {themHim} the debt died with the dead', r: '{them} goes white, then red, and leaves the gift on the step.',
        fx: { them: { op: -15 }, honor: -1, bonds: { settle: 0.2 } } },
    ] },

  { id: 'bd_grave', title: 'A grave you know', w: 1, cool: 12,
    cond: (p, C) => C.adult(p) && C.bondMemory(p, 0, true),
    setup: (p, ctx) => {
      let best = null;
      for (const id of Object.keys(p.rel || {})) {
        const t = A.P(id); if (!t || t.alive) continue;
        const e = BD().cite(p, t, { min: 10 });
        if (e && (!best || Math.abs(e.w) > Math.abs(best.e.w))) best = { t, e };
      }
      if (!best) { ctx.skip = true; return; }
      ctx.pid = best.t.id; ctx.hy = best.e.y; ctx.ht = best.e.t; ctx.bdCite = 1;
      ctx.hline = `You remember ${best.e.y}, when ${BD().deedLine(best.e)}.`;
    },
    text: 'You pass the place where {them} is buried. {hline} The grass on the grave has been cut by somebody. Not by you.',
    choices: [
      { t: 'Leave flowers on the stone', r: 'You leave them, and stand a while longer than you meant to.', fx: { happy: 2, piety: 1, coin: -2 } },
      { t: 'Look in on {theirHis} family', r: 'You knock at the door. They know your name before you give it.', fx: { coin: -5, bonds: { visit: true } } },
      { t: 'Walk on', r: 'You walk on. The dead keep.', fx: { wil: 1 } },
    ] },

  // ---------------------------------------------------------------- secrets and leverage (Relationships 5)

  { id: 'bd_sec_glimpse', title: 'Something about {them}', w: 1, cool: 4,
    cond: (p, C) => C.adult(p) && C.bondSecret(p),
    setup: (p, ctx) => {
      const L = SEC().someHidden(p); if (!L.length) { ctx.skip = true; return; }
      const t = A.pick(L), s = SEC().of(t); if (!s) { ctx.skip = true; return; }
      ctx.pid = t.id;
      ctx.clue = {
        debt: 'A moneylender\'s boy is at {them}\'s gate again, the third time this month, and goes away with nothing.',
        affair: '{them} comes out of a house that is not {theirHis} own an hour before dawn, and looks both ways.',
        bastard: '{them} buys a child\'s shoes at the fair, and has no child that you know of.',
        heresy: 'At a burial, {them} moves {theirHis} lips with the prayers and does not say the words.',
        crime: 'A drunk at the inn goes quiet when {them} comes in, and leaves by the back.',
        embezzle: '{them} stands a round with new coin, a great deal of it, on what {theyHe} is paid.',
        desert: 'An old soldier spits when {them}\'s name comes up, and will not say why.',
      }[s.k] || '{them} is hiding something.';
    },
    text: (p, ctx) => ctx.clue + ' You could find out more.',
    choices: [
      { t: 'Look into it, quietly', check: { s: 'intrigue', s2: 'ins', d: 45 },
        win: { r: 'It takes a week of small questions. You know now.', fx: { bonds: { learn: true } } },
        lose: { r: '{them} hears that you have been asking, and is cold with you after.', fx: { them: { op: -6 } } } },
      { t: 'Ask {themHim} about it, straight out', r: '{them} goes still, then tells you, because you already half know.', fx: { them: { op: -8 }, honor: 1, bonds: { learn: true } } },
      { t: 'It is none of your business', r: 'You let it be. Everyone keeps something.', fx: { honor: 1 } },
    ] },

  { id: 'bd_sec_told', title: '{them} lowers {theirHis} voice', trigger: true, npc: true, cool: 1,
    cond: (p, C) => C.adult(p), more: why,
    setup: (p, ctx) => { const t = alive(p, ctx); if (!t) return; const o = SEC().gossipOf(p, t); if (!o) { ctx.skip = true; return; } ctx.oid = o.id; ctx.subj = o.given; },
    text: '{them} has had a cup too many, and leans close. It is about {subj}, whom {theyHe} has known for years, and {theyHe} makes you swear not to repeat it.',
    choices: [
      { t: 'Listen', r: 'You listen. It is worse than you thought, and better to know.', fx: { honor: -1, them: { op: 4 }, bonds: { learn: 'oid' } } },
      { t: 'Stop {themHim} before {theyHe} says it', r: '{them} looks at you oddly, then laughs, and talks of the weather.', fx: { honor: 2, them: { op: -2 } } },
      { t: 'Listen, then warn {subj} that people talk', r: 'You listen, and the next day you tell {subj} that people talk. {subj} does not ask who.', fx: { bonds: { learn: 'oid', warn: true } } },
    ] },

  { id: 'bd_dig_try', title: 'What {them} keeps hidden', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { alive(p, ctx); ctx.how = 'dig'; },
    text: 'You set about finding out what {them} keeps from the world: who {theyHe} owes, where {theyHe} goes at night, who stops talking when {theyHe} comes in.',
    choices: [
      { t: 'Ask about {themHim} in the taverns', check: { s: 'intrigue', s2: 'int', d: 50 },
        win: { r: 'A name, a date, a place. You put them together.', fx: { bonds: { learn: true } } },
        lose: { r: 'Word reaches {them} that you have been asking.', fx: { them: { op: -10 } } } },
      { t: 'Pay a servant to watch {themHim} for a month', req: p => (p.coin || 0) >= 15, r: 'Fifteen suns, and a month later the servant tells you what there was to see.', fx: { coin: -15, honor: -1, bonds: { learn: true } } },
      { t: 'Think better of it', r: 'You let it go. Some doors are better left shut.', fx: { honor: 1 } },
    ] },

  // 39-schemes' plot "dig into their past": its last move, and being found out (renamed from sch_done_dig / sch_found)
  { id: 'bd_dig_done', title: 'What you found out about {them}', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { const t = alive(p, ctx); if (!t) return; const s = SEC().of(t); ctx.found = s ? 1 : 0; ctx.sec = s ? s.t : ''; ctx.how = 'dig'; },
    text: (p, ctx) => ctx.found ? 'Months of small questions, and {them}\'s life lies open in front of you. {sec}' : 'Months of small questions, and nothing. {them} is what {theyHe} seems, which is rarer than you thought.',
    choices: [
      { t: 'Keep it close', req: (p, C, ctx) => !!ctx.found, r: 'You write nothing down. You will not need to.', fx: { scheme: { end: true }, bonds: { learn: true } } },
      { t: 'Let {them} know that you know', req: (p, C, ctx) => !!ctx.found, r: 'A word in passing: a name, a date. {them} understands, and will keep out of your way.', fx: { scheme: { end: true }, bonds: { learn: true, lever: 'silence' } } },
      { t: 'Burn your notes', r: 'You burn them. If there was anything, it is ash now.', fx: { scheme: { end: true }, honor: 2 } },
      { t: 'Put it down to a wasted season', req: (p, C, ctx) => !ctx.found, r: 'You put it down to a wasted season, and look at {them} differently anyway.', fx: { scheme: { end: true }, wil: 1 } },
    ] },
  { id: 'bd_dig_found', title: '{them} has heard you asking', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p), setup: (p, ctx) => { alive(p, ctx); },
    text: '{them} has heard that you have been asking about {themHim}: in the taverns, at the market, of {theirHis} own servants. {theyHe} wants to know why.',
    choices: [
      { t: 'Deny everything', check: { s: 'deception', s2: 'wil', d: 50 },
        win: { r: '{theyHe} half believes you, which is the most you could hope for.', fx: { them: { op: -8 } } },
        lose: { r: '{theyHe} does not believe a word, and now {theyHe} has caught you lying too.', fx: { them: { op: -30, type: 'enemy' } } } },
      { t: 'Say you wanted to know {themHim} better', r: '{them} does not believe that either, but likes it better than a lie.', fx: { them: { op: -12 }, honor: 1 } },
      { t: 'Shrug', r: 'You shrug. {them} will remember the shrug longer than the questions.', fx: { them: { op: -25, type: 'rival' }, wil: 1 } },
    ] },

  { id: 'bd_lever', title: 'What you know of {them}', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => {
      const t = alive(p, ctx); if (!t) return;
      const s = SEC().known(p, t); if (!s) { ctx.skip = true; return; }
      ctx.sec = s.t; ctx.amtN = SEC().price(t, s.sev === 'criminal'); ctx.amt = BD().coin(ctx.amtN);
    },
    text: 'You find {them} alone and tell {themHim} what you know. {sec} {theyHe} does not ask how you found out, only what you want for keeping it.',
    choices: [
      { t: 'A favour, when you ask for one', check: { s: 'intimidation', s2: 'wil', d: 40, bonus: pc => A.BONDS.SEC.bonus(pc) },
        win: { r: '{them} nods. {theyHe} will do it, and hate you while {theyHe} does.', fx: { bonds: { lever: 'favor' } } },
        lose: { r: '{them} laughs in your face. "Then tell them," {theyHe} says.', fx: { honor: -1, bonds: { refused: true } } } },
      { t: 'Money: {amt}', check: { s: 'intimidation', s2: 'wil', d: 50, bonus: pc => A.BONDS.SEC.bonus(pc) },
        win: { r: '{them} pays, the next day, in a purse with no mark on it.', fx: { bonds: { lever: 'coin' } } },
        lose: { r: '{them} tells you to go to the devil, and means it.', fx: { honor: -1, bonds: { refused: true } } } },
      { t: 'That {theyHe} keep out of your way', r: '{them} agrees too quickly. You will have no trouble from {themHim} for a long while.', fx: { bonds: { lever: 'silence' } } },
      { t: 'Nothing, after all', r: 'You talk of the weather instead. {them} watches you all the way to the door.', fx: { them: { op: -3 } } },
    ] },

  { id: 'bd_lever_refused', title: '{them} calls your bluff', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p), setup: (p, ctx) => { const t = alive(p, ctx); if (t && !SEC().known(p, t)) ctx.skip = true; },
    text: '{them} told you to do your worst, and meant it. What you know could still ruin {themHim}, if you said it in the right places.',
    choices: [
      { t: 'Say it in the right places', r: 'You tell it at the market and at the temple door. By the week\'s end {them} cannot buy bread without being stared at.', fx: { bonds: { expose: true } } },
      { t: 'Let it go, this time', r: 'You let it go. {them} knows now that you tried, and that you would not.', fx: { them: { op: -12 }, wil: -1 } },
    ] },

  { id: 'bd_blackmail', title: '{them} knows', trigger: true, npc: true, cool: 1,
    cond: (p, C) => C.adult(p), more: why,
    setup: (p, ctx) => {
      const t = alive(p, ctx); if (!t) return;
      const s = SEC().theyKnow(p, t); if (!s) { ctx.skip = true; return; }
      ctx.mt = s.t; ctx.mine = s.t; price(p, ctx, 0.25, 10);
    },
    text: '{them} sits down across from you without being asked. {theyHe} knows. {mine} {theyHe} names a price, {amt}, or the whole town hears it by the next market day.',
    choices: [
      { t: 'Pay {themHim}', req: can('amtN'), r: 'You pay. {them} counts it twice and promises that is the end of it.', fx: { them: { op: 4 }, bonds: { mine: 'pay' } } },
      { t: 'Tell {themHim} to do {theirHis} worst', check: { s: 'deception', s2: 'wil', d: 50 },
        win: { r: 'It comes out. You laugh at it, and enough people believe the laugh.', fx: { fame: -1, them: { op: -10 }, bonds: { mine: 'blunt' } } },
        lose: { r: 'It comes out, and it sticks to you.', fx: { them: { op: -10 }, bonds: { mine: 'out' } } } },
      { t: 'Remind {themHim} what you know of {themHim}', req: (p, C, ctx) => { const t = A.P(ctx.pid), s = t && A.BONDS.SEC.known(p, t); return !!s && !s.out; },
        r: 'You say one name and one date. {them} sits back. Neither of you will speak of it again.', fx: { honor: -2, bonds: { mine: 'turn' } } },
      { t: 'Frighten {themHim} into silence', check: { s: 'intimidation', s2: 'str', d: 50 },
        win: { r: '{them} leaves white-faced, and you will not hear of it again.', fx: { honor: -2, them: { op: -15 }, bonds: { mine: 'cow' } } },
        lose: { r: '{them} is more frightened of being poor than of you. By market day it is out.', fx: { them: { op: -20 }, bonds: { mine: 'out' } } } },
    ] },

  { id: 'bd_blackmail_again', title: '{them} is back', trigger: true, npc: true, cool: 1,
    cond: (p, C) => C.adult(p), more: why,
    setup: (p, ctx) => {
      const t = alive(p, ctx); if (!t) return;
      const s = A.BONDS.SEC.mine(p).find(x => x.t === ctx.mt && !x.out) || SEC().theyKnow(p, t);
      if (!s) { ctx.skip = true; return; }
      ctx.mt = s.t; price(p, ctx, 0.35, 15);
    },
    text: '{them} is back, as you knew {theyHe} would be. Business has been bad, {theyHe} says, and the price of quiet has gone up: {amt}.',
    choices: [
      { t: 'Pay again', req: can('amtN'), r: 'You pay. You both know it will not be the last time.', fx: { happy: -3, bonds: { mine: 'pay' } } },
      { t: 'Not one more coin', check: { s: 'deception', s2: 'wil', d: 50 },
        win: { r: 'It comes out, and you shrug it off as an old story.', fx: { fame: -1, them: { op: -15 }, bonds: { mine: 'blunt' } } },
        lose: { r: 'It comes out, and it sticks.', fx: { them: { op: -15 }, bonds: { mine: 'out' } } } },
      { t: 'Frighten {themHim} off for good', check: { s: 'intimidation', s2: 'str', d: 55 },
        win: { r: 'You make it very plain. {them} leaves the town before the month is out.', fx: { honor: -2, them: { op: -25 }, bonds: { mine: 'cow' } } },
        lose: { r: '{them} goes straight from your door to the alehouse, and talks.', fx: { them: { op: -20 }, bonds: { mine: 'out' } } } },
    ] },

  // ---------------------------------------------------------------- long memories of realms (Diplomacy 6)

  { id: 'bd_feud_envoy', title: 'The envoy of {other} will not sit', w: 1, cool: 8,
    cond: (p, C) => C.ruler(p) && C.feud(p, 'against'),
    setup: (p, ctx) => {
      const x = FE().pick(p, 'against'); if (!x) { ctx.skip = true; return; }
      const r = A.realm(p.ruler);
      ctx.rid = x.o; ctx.fk = x.e.k; ctx.fy = x.e.y; ctx.fline = FE().label(x.e) + ', in ' + x.e.y; ctx.bdCite = 1;
      ctx.repN = Math.max(500, Math.round(((r && r.income) || 20000) * 0.25 / 100) * 100); ctx.rep = A.fmt ? A.fmt(ctx.repN) : String(ctx.repN);
    },
    text: 'The envoy of {other} will not take the seat you offer. In {otherName} they still say it of your realm: "{fline}." Nobody who did it is alive. {otherRuler} has not forgotten it.',
    choices: [
      { t: 'Offer reparations from the treasury ({rep})', r: 'The envoy counts the chests, and sits. The grudge is smaller. It is not gone.',
        fx: (p, ctx) => A.applyFx(p, { treasury: -(+ctx.repN || 0), realmRel: 10, bonds: { feud: 'settle' } }, ctx) },
      { t: 'Send an apology in your own hand', r: 'The letter is read aloud in {otherName}. Some of them weep. Your own lords mutter.', fx: { legit: -2, realmRel: 5, bonds: { feud: 'apology' } } },
      { t: 'Remind the envoy who wronged whom first', req: (p, C) => C.feud(p, 'held'), check: { s: 'diplomacy', s2: 'int', d: 55 },
        win: { r: 'You give them a date of your own. The envoy, to his credit, laughs. Both ledgers are a little lighter.', fx: { realmRel: 5, bonds: { feud: 'remind' } } },
        lose: { r: 'It becomes a shouting match about the dead, and the envoy leaves early.', fx: { realmRel: -6 } } },
      { t: 'Give the envoy nothing', r: 'The envoy leaves before dinner. Your lords approve, loudly.', fx: { legit: 1, realmRel: -5 } },
    ] },

  { id: 'bd_feud_vow', title: 'A cup raised to an old wrong', w: 1, cool: 10,
    cond: (p, C) => C.ruler(p) && C.feud(p, 'held'),
    setup: (p, ctx) => {
      const x = FE().pick(p, 'held'); if (!x) { ctx.skip = true; return; }
      ctx.rid = x.o; ctx.fk = x.e.k; ctx.fy = x.e.y; ctx.fline = FE().origin(x.e); ctx.bdCite = 1;
    },
    text: 'At the feast your lords raise their cups to an old wrong. {other}: {fline}. They are waiting to hear whether you mean to carry it.',
    choices: [
      { t: 'Swear to carry it', r: 'You swear it. The hall roars. {other} will hear of it within the month.', fx: { legit: 2, realmRel: -5, bonds: { feud: 'swear' } } },
      { t: 'Say it died with the ones who did it', r: 'The hall goes quiet. Somebody spills a cup. In {other} they will hear of this too.', fx: { legit: -2, realmRel: 5, bonds: { feud: 'forgive' } } },
      { t: 'Drink, and say nothing', r: 'You drink. Everyone takes the silence the way they like it best.', fx: { happy: 1 } },
    ] },

  { id: 'bd_feud_tale', title: 'The old soldier\'s story', w: 1, cool: 10,
    cond: (p, C) => C.adult(p) && !C.ruler(p) && C.feud(p, 'held'),
    setup: (p, ctx) => {
      const x = FE().pick(p, 'held'); if (!x) { ctx.skip = true; return; }
      ctx.rid = x.o; ctx.fline = FE().label(x.e).replace(/^\w/, c => c.toLowerCase()) + ', in ' + x.e.y; ctx.bdCite = 1;
    },
    text: 'An old soldier at the inn tells it again, as he does every feast day: {other} {fline}. The young ones have heard it so often they mouth the words with him.',
    choices: [
      { t: 'Drink to the day it is paid back', r: 'The room drinks with you. It is a good feeling, and a dangerous one.', fx: { happy: 2, need: { company: 8 } } },
      { t: 'Say the people who did it are all dead', r: 'The soldier stares at you. "Their grandsons are not," he says, and the room agrees with him.', fx: { wil: 1, fame: -1 } },
      { t: 'Ask how it really happened', r: 'He tells it twice, differently each time. Somewhere between the two is what happened.', fx: { skill: { learning: 1 } } },
    ] },
]);
})();
