// The Polity (9996-polity): bills, offices, oaths, elections and the estates. Most are queued by the engine
// (a-polity, b-bills, c-elect, d-player); the estates' scenes are drawn as any event is.
const POX = () => A.POL;
const aliveP = id => { const p = id && A.P(id); return p && p.alive ? p : null; };
const offOf = (ctx) => { const r = ctx && A.realm(ctx.rid); return r && r.pol ? r.pol.off.find(o => o.id === ctx.poOff) || null : null; };
const myR = p => A.realm(p.ruler || (p.noble ? p.noble.realm : p.realm));
const mine = (p, ctx) => { const o = offOf(ctx); return !!(o && o.pid === p.id); };

A.defEvents([
  // ------------------------------------------------------------------------------------------------ bills
  // queued at a debate on a bill in the player's realm, when the player rules or sits on the council (POL.debate)
  { id: 'po_debate', title: 'The bill is argued', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { const r = A.realm(ctx.rid); if (!r || !r.pol || !r.pol.bill || !ctx.bill) ctx.skip = true; if (!ctx.pid) ctx.skip = true; },
    text: 'The hall is full for the bill for {bill}. {them} has the floor and spends it on the old charters, one by one. {friendName} looks to you. The clerks have their pens up. Whatever is said now will be counted at the next sitting.',
    choices: [
      { t: 'Speak for the bill', check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: 'You give them the treasury\'s numbers, plainly, and then the names of the men who will pay if nothing changes. Two benches go quiet. One nods.', fx: { poBill: 'for', fame: 1 } },
        lose: { r: 'You speak well enough, but {them} answers every point with a precedent. The benches stay where they were.', fx: { them: { op: -4 } } } },
      { t: 'Speak against it', check: { s: 'persuasion', s2: 'int', d: 50 },
        win: { r: 'You agree with {them} at length, and add three dangers of your own. The bill comes out of the day weaker.', fx: { poBill: 'against', them: { op: 6 } } },
        lose: { r: 'You argue against it and are heard as a man who has changed sides. Nobody moves.', fx: { honor: -1 } } },
      { t: 'Call in a favour owed, for a vote', req: (p) => Object.values(p.favors || {}).some(v => v > 0),
        r: 'A word in a doorway, a reminder of an old kindness. A vote that was against is now for, and the debt is paid.', fx: { poBill: 'trade', honor: -1 } },
      { t: 'Let it lie', r: 'You keep your seat and your counsel. The argument goes on without you and ends where it began.', fx: { wil: 1 } },
    ] },

  // queued for a ruling player when an angry estate petitions (POL.petitions)
  { id: 'po_petition', title: 'A petition at the gate', trigger: true, cool: 2,
    cond: (p, C) => C.ruler(p),
    setup: (p, ctx) => { const r = A.realm(ctx.rid); if (!r || !r.pol || !ctx.pk || !ctx.estate || r.pol.bill) ctx.skip = true; if (!ctx.pid) ctx.pid = null; },
    text: 'A roll of parchment as long as a man, sealed by the hundred: {estate} ask for {bill}. They wait in the yard in their best clothes and do not go home. Your steward says they will stand there until you answer, and that they are within their rights.',
    choices: [
      { t: 'Bring their bill before the council', r: 'You take the roll and give it to the clerks. A cheer goes up in the yard. The council will count it every sixty days, and so will they.', fx: { poPet: 'grant', fame: 1 } },
      { t: 'Refuse it', r: 'You send them home. They go, slowly, and talk all the way. Nobody in the yard forgets the answer.', fx: { poPet: 'refuse', wil: 1 } },
      { t: 'Receive the leaders and promise to think on it', check: { s: 'persuasion', s2: 'ins', d: 45 },
        win: { r: 'You give their leaders wine and your whole attention for an hour. They leave with nothing in writing and are pleased with it.', fx: { poEst: { comm: 1 }, happy: 1 } },
        lose: { r: 'They see through the wine. The yard empties, and next year the roll will be longer.', fx: { poPet: 'refuse', happy: -1 } } },
    ] },

  // queued when a bill passes that the player's own estate opposed (POL.endBill)
  { id: 'po_bill_passed', title: 'The law is cried', trigger: true, cool: 4,
    cond: (p, C) => C.adult(p) && !C.ruler(p),
    setup: (p, ctx) => { if (!ctx.bill || !ctx.estate) ctx.skip = true; },
    text: 'A crier reads it at the market cross in {realmT}: {bill}, by order of the crown. Around you {estate} take it badly. A man spits. Another says it will be undone in a year, if the right people are pressed.',
    choices: [
      { t: 'Join those who will press to undo it', r: 'Your name goes on a list kept in a back room. It will be read out at the right time, or the wrong one.', fx: { fame: 1, honor: -1, happy: 1 } },
      { t: 'Shrug, and adapt to it', r: 'Laws change. You work out what it costs you this year and pay it, which is more than most will do.', fx: { int: 1, happy: -1 } },
      { t: 'Say loudly that it is a good law', check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: 'Some look at you sideways; a few agree, quietly, later. The crown\'s men hear of it.', fx: { fame: 2, happy: -1 } },
        lose: { r: 'You are shouted down and pushed out of the press. Your own kind will remember it.', fx: { happy: -3, health: -2 } } },
    ] },

  // ------------------------------------------------------------------------------------------------ offices
  // the governor's yearly choice: how much of the shire's tax sticks to your fingers (POL.pcYear)
  { id: 'po_graft', title: 'The shire\'s accounts', trigger: true, cool: 3,
    cond: (p, C) => C.adult(p) && C.holds(p, 'gov'),
    setup: (p, ctx) => { if (!mine(p, ctx)) ctx.skip = true; },
    text: 'The rolls of {shire} come in at the quarter: hearth money, tolls, fines. Your clerk shows you where the numbers could be smaller and nobody the wiser. Every governor before you did it. One of them was hanged for it.',
    choices: [
      { t: 'Send every sun to the crown', r: 'You seal the rolls as they are and send them on. The crown never thanks a governor for honesty, but the Treasurer has no reason to look.', fx: { poGraft: 0, honor: 2 } },
      { t: 'Keep a little back, as is customary', r: 'A few in a hundred stay in {shire}. The clerk smiles and makes the numbers agree.', fx: { poGraft: 4, coin: 10, honor: -1 } },
      { t: 'Keep a great deal back', r: 'A tenth of the shire\'s tax goes into your strongbox. It is a fine strongbox. The audit, when it comes, will be finer.', fx: { poGraft: 10, coin: 30, honor: -3 } },
    ] },
  // queued when a Treasurer's audit finds the player's graft (POL.audit)
  { id: 'po_audit', title: 'The Treasurer\'s men', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p) && C.holds(p, 'gov'),
    setup: (p, ctx) => { if (!ctx.shire) ctx.skip = true; if (!ctx.pid) ctx.pid = null; },
    text: 'Two clerks in black arrive at {shire} with the Treasurer\'s seal and a list of questions. They have read your rolls against the toll-keepers\' own. The numbers do not agree, and they are polite about it.',
    choices: [
      { t: 'Pay it back, and more', r: 'You pay what was kept and a fine on top. The clerks write "settled" and ride away. You keep the shire, this time.', fx: { coinPct: -15, honor: 1 } },
      { t: 'Blame the clerk', check: { s: 'intrigue', s2: 'int', d: 55 },
        win: { r: 'Your clerk has a bad hand and a worse memory. He is dismissed and you are commended for finding him out.', fx: { honor: -2 } },
        lose: { r: 'The clerk produces your letters. You are dismissed from the shire, and lucky to keep your head.', fx: { poOff: 'lose', fame: -3, honor: -3 } } },
      { t: 'Give up the shire quietly', r: 'You resign before you are dismissed. Nothing is written down, and nothing is forgotten.', fx: { poOff: 'lose', fame: -1 } },
    ] },
  // the reeve's yearly choice: the tolls of the market
  { id: 'po_tolls', title: 'Market tolls', trigger: true, cool: 3,
    cond: (p, C) => C.adult(p) && C.holds(p, 'reeve'),
    setup: (p, ctx) => { if (!mine(p, ctx)) ctx.skip = true; },
    text: 'The guildmasters of {shire} meet in the hall over the market, and you sit at the head of the table. The carters want the tolls eased. The town wants its walls mended, and walls are paid for by tolls.',
    choices: [
      { t: 'Raise the tolls for the walls', r: 'The walls will be mended. The carters will curse your name at every gate, and some will go round by another road.', fx: { poToll: 1, poEst: { burg: -1 }, coin: 20 } },
      { t: 'Ease the tolls', r: 'The carters drink your health. The wall by the tannery leans a little further toward the river.', fx: { poToll: -1, poEst: { burg: 1 }, fame: 1 } },
      { t: 'Leave them as they are', r: 'Nobody is pleased and nobody is angry, which in a reeve is called wisdom.', fx: { poToll: 0, wil: 1 } },
    ] },
  // the magistrate's four cases (POL.pcYear picks one by a hash of the life and the year)
  { id: 'po_case_land', title: 'A boundary stone', trigger: true, cool: 4,
    cond: (p, C) => C.adult(p) && C.holds(p, 'mag'),
    setup: (p, ctx) => { if (!mine(p, ctx)) ctx.skip = true; },
    text: 'A lord\'s steward and a free farmer of {shire} both claim a strip of meadow. The boundary stone has moved, the farmer says, a yard a year for ten years. The steward says stones do not walk. Both look at you.',
    choices: [
      { t: 'Find for the lord', r: 'The meadow goes to the lord. The steward bows. The farmer goes home and sharpens nothing, yet.', fx: { poCase: 'nob>comm', coin: 15 } },
      { t: 'Find for the farmer', r: 'The stone goes back where the farmer says it was. The steward writes to his master that night.', fx: { poCase: 'comm>nob', honor: 1 } },
      { t: 'Have it measured from the old charter', check: { s: 'stewardship', s2: 'int', d: 50 },
        win: { r: 'The charter is found and the chain run out. The stone has moved. The lord pays the farmer and blames his steward.', fx: { poCase: 'comm', fame: 2 } },
        lose: { r: 'The charter is illegible and the chain is short. You split the meadow, and both men hate you.', fx: { poCase: '>nob', happy: -1 } } },
    ] },
  { id: 'po_case_debt', title: 'A merchant\'s debt', trigger: true, cool: 4,
    cond: (p, C) => C.adult(p) && C.holds(p, 'mag'),
    setup: (p, ctx) => { if (!mine(p, ctx)) ctx.skip = true; },
    text: 'A cloth merchant of {shire} holds a knight\'s bond for two hundred suns, two years past due. The knight says the cloth was rotten. The merchant says the knight has a new horse. The bond is real.',
    choices: [
      { t: 'Order the knight to pay', r: 'The knight pays, with ill grace and half of it in kind. The guild notes that the law here can be counted on.', fx: { poCase: 'burg>nob', honor: 1 } },
      { t: 'Excuse the debt for the rotten cloth', r: 'The knight thanks you as one gentleman to another. The merchant tears his bond in the street.', fx: { poCase: 'nob>burg', coin: 10 } },
      { t: 'Send them to settle it between them', r: 'They settle it, in the end, at a tenth of what was owed. Neither will come to you again.', fx: { wil: 1, fame: -1 } },
    ] },
  { id: 'po_case_poach', title: 'Taken in the lord\'s wood', trigger: true, cool: 4,
    cond: (p, C) => C.adult(p) && C.holds(p, 'mag'),
    setup: (p, ctx) => { if (!mine(p, ctx)) ctx.skip = true; },
    text: 'The verderers bring in a boy of {shire} with a hare and a snare. His mother stands at the back. The law is a hand, or a year\'s labour. The lord\'s man says the wood has been stripped this winter.',
    choices: [
      { t: 'Give him the year\'s labour', r: 'The boy works the lord\'s ditches for a year. The verderers are satisfied. His mother does not look at you in the market.', fx: { poCase: 'nob>comm' } },
      { t: 'A fine, and let him go', r: 'His mother pays the fine with the money for seed. The boy runs home. The lord\'s man writes it down.', fx: { poCase: 'comm>nob', honor: 1 } },
      { t: 'Ask why the village is hungry', check: { s: 'persuasion', s2: 'ins', d: 45 },
        win: { r: 'The answer is a bad harvest and a high rent. You have the boy fined a penny and write to the crown about the rent.', fx: { poCase: 'comm', fame: 2, piety: 1 } },
        lose: { r: 'Nobody will say it in front of the lord\'s man. You give him the labour and feel it.', fx: { poCase: 'nob>comm', happy: -2 } } },
    ] },
  { id: 'po_case_heresy', title: 'A wrong prayer', trigger: true, cool: 4,
    cond: (p, C) => C.adult(p) && C.holds(p, 'mag'),
    setup: (p, ctx) => { if (!mine(p, ctx)) ctx.skip = true; },
    text: 'A priest of {shire} brings a weaver before you. She was heard praying the old way, to the old names, at a well. The priest wants her made an example. The weavers\' guild has sent a man to watch.',
    choices: [
      { t: 'Hand her to the priest', r: 'She is taken to the temple to do penance in a white shift. The priest blesses you. The weavers\' man leaves without a word.', fx: { poCase: 'cler>burg', piety: 1 } },
      { t: 'Dismiss it: a prayer at a well is no crime', r: 'She goes home. The priest calls you lax from his pulpit, twice. The guild sends a ham.', fx: { poCase: 'burg>cler', piety: -1 } },
      { t: 'Bind her over to keep the peace', r: 'A small fine and a promise. Neither side is pleased, which is perhaps the law working.', fx: { wil: 1, coin: 5 } },
    ] },
  // the warden's yearly choice on the march
  { id: 'po_march_raid', title: 'Across the march', trigger: true, cool: 3,
    cond: (p, C) => C.adult(p) && C.holds(p, 'warden'),
    setup: (p, ctx) => { if (!mine(p, ctx)) ctx.skip = true; },
    text: 'Smoke over the hills beyond {shire}: the other side burned a hayrick last night, or says we did. Your riders are saddled. The crown wants the march quiet. The march wants blood for the hayrick.',
    choices: [
      { t: 'Ride over and burn two of theirs', check: { s: 'command', s2: 'str', d: 50 },
        win: { r: 'Two ricks and a byre, and nobody killed. The riders come home singing. The far side will remember the number.', fx: { poMarch: 'raid', fame: 2, coin: 25 } },
        lose: { r: 'They were waiting at the ford. You lose a man and a horse and come home with nothing.', fx: { poMarch: 'raid', health: -8, happy: -3 } } },
      { t: 'Hold the line and send a herald', r: 'Your herald comes back with a complaint and a counter-complaint. The hayrick is paid for in words. The riders grumble.', fx: { poMarch: 'hold', honor: 1 } },
      { t: 'Double the watch and wait', r: 'Nothing burns this month. The riders say you are getting old.', fx: { wil: 1, happy: -1 } },
    ] },
  // the collector's yearly choice in the port
  { id: 'po_customs', title: 'The weighing house', trigger: true, cool: 3,
    cond: (p, C) => C.adult(p) && C.holds(p, 'customs'),
    setup: (p, ctx) => { if (!mine(p, ctx)) ctx.skip = true; },
    text: 'Three ships in on the tide at {shire}, and their masters in your weighing house with their manifests. The crown\'s share is a twentieth. Every collector takes a little more for the scales. The masters know it.',
    choices: [
      { t: 'Squeeze them for the scales', r: 'The masters pay, and curse, and next season some of them put in at another port.', fx: { poCustoms: 'squeeze', honor: -1 } },
      { t: 'Take the crown\'s twentieth and no more', r: 'The masters are surprised and say so. One of them sends you a cask of wine, which is not a bribe.', fx: { poEst: { burg: 1 }, honor: 1 } },
      { t: 'Look for smuggled cargo', check: { s: 'trade', s2: 'ins', d: 55 },
        win: { r: 'A false bottom in the second ship. The cargo is forfeit, and the crown\'s share of it is generous.', fx: { coin: 40, fame: 1 } },
        lose: { r: 'You turn three holds over and find salt fish. The masters complain to the guild.', fx: { poEst: { burg: -1 }, happy: -1 } } },
    ] },
  // an office is offered (drawn as any event; setup finds one the player could hold)
  { id: 'po_seek_offered', title: 'A seat to fill', w: 1, cool: 8,
    cond: (p, C) => C.adult(p) && !C.ruler(p) && (C.noble(p) || C.rich(p) || C.soldier(p)),
    setup: (p, ctx) => {
      const P = POX(); if (!P) { ctx.skip = true; return; }
      const s = P.seekable(p).filter(x => !x.bar.length && !x.price);
      if (!s.length) { ctx.skip = true; return; }
      const x = s[Math.floor(P.hash(p.id, A.S.year, 'offer') * s.length)], r = myR(p);
      ctx.rid = r.id; ctx.offId = x.o.id; ctx.offT = P.offName(x.o.k, r.id).toLowerCase(); ctx.shire = (A.S.prov[x.o.at] || {}).name || r.short;
      if (x.ap && x.ap.id !== p.id) ctx.pid = x.ap.id; else ctx.skip = true;
    },
    text: '{them} sends for you. The {offT} of {shire} is to be named, and your name has been spoken. It is not given; it is offered, which is to say that a gift would not be refused, and a refusal would be remembered.',
    choices: [
      { t: 'Accept, and send a gift', req: (p) => p.coin >= 40, r: 'The gift goes in the morning and your name goes on the roll in the afternoon. The pay is fair. The work is endless.', fx: { coin: -40, poOff: 'take', them: { op: 5 } } },
      { t: 'Accept, and send nothing', check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: '{them} likes a man who does not pay for what he is worth. The office is yours.', fx: { poOff: 'take', honor: 1 } },
        lose: { r: 'Someone else sent a gift. You hear of it at second hand.', fx: { them: { op: -3 }, happy: -1 } } },
      { t: 'Decline it with thanks', r: 'You have enough to do. {them} says so does everyone, and lets you go.', fx: { them: { op: -5 }, wil: 1 } },
    ] },

  // ------------------------------------------------------------------------------------------------ oaths
  // queued when the player's realm goes to war and the player owes men by their oath
  { id: 'po_muster', title: 'The muster is called', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p) && C.noble(p),
    setup: (p, ctx) => { if (!ctx.men || !ctx.rid) ctx.skip = true; if (!aliveP(ctx.pid)) ctx.pid = null; },
    text: 'A rider with the crown\'s badge at your gate: {realmT} is at war, and your oath owes {men} men at the muster within the month. Scutage, the price of keeping them at home, is {scut}. Your steward counts the harvest and looks at you.',
    choices: [
      { t: 'Send the men', r: 'They go down the road in a long file, your colours at the head. Some will not come back. The crown marks your name.', fx: { fame: 1, honor: 1, happy: -1 } },
      { t: 'Pay the scutage instead', req: (p, C, ctx) => p.coin >= (ctx.scutN || 0), r: 'The money goes to the crown\'s clerks and the men stay at the harvest. It is lawful. It is not loved.', fx: { poMuster: 'scutage' } },
      { t: 'Refuse the summons', r: 'You send the rider back with nothing. It is a breach of your oath, and the crown keeps a list of those.', fx: { poMuster: 'refuse', honor: -3, wil: 1 } },
    ] },
  // queued now and then when a greedy crown wants more of a lord's oath
  { id: 'po_raise_oath', title: 'The crown wants more', trigger: true, cool: 5,
    cond: (p, C) => C.adult(p) && C.noble(p),
    setup: (p, ctx) => { if (!aliveP(ctx.pid) || !ctx.rid) ctx.skip = true; },
    text: '{them} writes in {theirHis} own hand: the realm\'s needs are great, and your oath was sworn in easier years. The crown asks a larger share of your rents. The letter is courteous, and it is not a question.',
    choices: [
      { t: 'Agree to the larger share', r: 'You sign. The crown is pleased with you, and your steward is not.', fx: { poOath: 'raise', them: { op: 8 } } },
      { t: 'Agree, for a right in return', check: { s: 'persuasion', s2: 'int', d: 55 },
        win: { r: 'You give the share and take a right, written and sealed. Your grandchildren will thank you.', fx: { poOath: 'raiseRight', honor: 1 } },
        lose: { r: 'The crown takes the share and forgets the right. You have only your own copy of the letter.', fx: { poOath: 'raise', them: { op: -4 } } } },
      { t: 'Refuse, citing the oath as sworn', r: 'You write back that an oath is an oath. The crown cannot make you, this year. It will remember.', fx: { them: { op: -12 }, wil: 1 } },
    ] },
  // drawn for a landed lord whom the ruler owes a favour
  { id: 'po_oath_right', title: 'A right in writing', w: 1, cool: 10,
    cond: (p, C) => C.adult(p) && C.noble(p) && C.favors(p) > 0,
    setup: (p, ctx) => { const P = POX(), o = P && P.pcOath(p), ru = o && A.P(o.r.ruler); if (!o || !ru || !(A.favorsOf && A.favorsOf(p, ru.id) > 0) || o.c.rights.length >= 3) { ctx.skip = true; return; } ctx.pid = ru.id; ctx.rid = o.r.id; },
    text: '{them} owes you a favour, and both of you know it. A lawyer at court says the time to ask for a right is when a debt is fresh: a right in the charter outlives the crown that grants it.',
    choices: [
      { t: 'Ask for a right, and spend the favour', r: 'The charter is redrawn and sealed. The favour is spent. Your house holds something now that a new crown cannot easily take.', fx: { poOath: 'right', owed: -1, fame: 1 } },
      { t: 'Ask for a lighter share instead', r: 'The share of your rents is lowered a step. The favour is spent, and your steward smiles for a week.', fx: { poOath: 'lower', owed: -1, happy: 1 } },
      { t: 'Keep the favour for a harder day', r: 'You let it lie. Favours keep, mostly, as long as those who owe them do.', fx: { wil: 1 } },
    ] },
  // queued at a second breach of the oath in ten years: the crown moves to take the land
  { id: 'po_revoke', title: 'Forfeit', trigger: true, cool: 5,
    cond: (p, C) => C.adult(p) && C.noble(p),
    setup: (p, ctx) => { if (!aliveP(ctx.pid)) ctx.skip = true; },
    text: 'Twice you have kept your men at home when the crown called. {them} has asked the council to declare your lands forfeit. A friend at court sends word: there is a week, perhaps, before the vote.',
    choices: [
      { t: 'Ride to court and kneel', r: 'You kneel in the hall in front of everyone. It is remembered as long as the forfeit would have been, and costs less.', fx: { them: { op: 15 }, fame: -3, honor: -1 } },
      { t: 'Pay a heavy fine', req: (p) => p.coin >= 200, r: 'Two hundred suns, and an oath sworn again in the cathedral. The vote is not held.', fx: { coin: -200, them: { op: 5 } } },
      { t: 'Bar your gates', r: 'You close the gates and call your men. The crown has other wars. For now.', fx: { them: { op: -25 }, wil: 2, fame: 1 } },
    ] },
  // queued when the player's home province passes to another realm at a peace (PO-CEDE)
  { id: 'po_new_crown', title: 'New banners in {homeT}', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { if (!ctx.toId || !ctx.fromId || !A.realm(ctx.toId)) ctx.skip = true; },
    text: 'The peace is signed and {homeT} belongs to {newT} now. Their officers are in the square with a table and a book. Those who swear may keep what they have. Those who will not may go, with what they can carry, back to {oldT}.',
    choices: [
      { t: 'Swear to the new crown', r: 'You put your hand on the book. Your holdings stay yours. Your old neighbours in {oldT} will call you a turncoat, and the new ones do not trust you yet.', fx: { poCrown: 'swear', honor: -1 } },
      { t: 'Leave with what you can carry', r: 'You sell what will not travel for half its worth and take the road to {oldT}. It is a long road and you look back once.', fx: { poCrown: 'leave', happy: -4, honor: 1 } },
      { t: 'Stay, and do not kneel', r: 'You stay, and you do not sign. There are others. Nobody says the word yet, but there is a word for it.', fx: { poCrown: 'resist', wil: 2, happy: -2 } },
    ] },

  // ------------------------------------------------------------------------------------------------ elections
  { id: 'po_season_opens', title: 'The electors stir', trigger: true, cool: 3,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { const r = A.realm(ctx.rid); if (!r || !r.pol || !r.pol.elect) ctx.skip = true; ctx.role = ctx.cand ? 'Your name is among the candidates' : 'You have a vote'; },
    text: 'In {realmT} the talk is all of the next choosing. {role}. Men who never wrote to you before write now. A cart of wine arrives with nobody\'s name on it.',
    choices: [
      { t: 'Send the wine back', r: 'The carter is puzzled, and so is whoever sent it. It is known that you cannot be bought cheaply, which some will take as a price.', fx: { honor: 2 } },
      { t: 'Keep the wine and say nothing', r: 'It is good wine. Somebody will ask what it bought, and you will have to decide.', fx: { happy: 2, honor: -1 } },
      { t: 'Find out who sent it', check: { s: 'intrigue', s2: 'ins', d: 45 },
        win: { r: 'The carter talks for a coin. Now you know one candidate\'s steward by sight, and how he spends.', fx: { int: 1 } },
        lose: { r: 'The carter knows nothing, or says so. You drink the wine anyway.', fx: { happy: 1 } } },
    ] },
  // NPC moves: a candidate courts the player's vote (POL.courtMonth, 21's budget)
  { id: 'po_courted_purse', title: 'A purse for a vote', trigger: true, cool: 2, npc: true,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { const r = A.realm(ctx.rid); if (!aliveP(ctx.pid) || !r || !r.pol || !r.pol.elect) ctx.skip = true; },
    text: '{them} is a candidate, and comes in person, which candidates rarely do. {theyHe} speaks of the realm, the roads and the price of grain, and leaves a heavy purse on the table as {theyHe} goes.',
    choices: [
      { t: 'Keep the purse and promise your vote', r: 'You pocket it. Your vote is promised, and {them} will count on it.', fx: { coin: 40, poVote: 1, honor: -2, them: { op: 8 } } },
      { t: 'Return it, and keep your vote free', r: 'You send it back with a civil note. {them} reads it twice and does not call again.', fx: { honor: 2, them: { op: -6 } } },
      { t: 'Keep the purse, promise nothing', check: { s: 'intrigue', s2: 'wil', d: 50 },
        win: { r: 'You thank {themHim} warmly and say nothing that could be repeated. The purse stays.', fx: { coin: 40, honor: -1 } },
        lose: { r: '{them} hears what you did not say. The story goes round the electors.', fx: { coin: 40, honor: -3, them: { op: -12 } } } },
    ] },
  { id: 'po_courted_promise', title: 'A promise for a vote', trigger: true, cool: 2, npc: true,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { const r = A.realm(ctx.rid); if (!aliveP(ctx.pid) || !r || !r.pol || !r.pol.elect) ctx.skip = true; },
    text: '{them} wants your vote and offers what candidates offer: an office, when {theyHe} has the giving of them. {theyHe} names one, and names the man who holds it now, and smiles.',
    choices: [
      { t: 'Promise your vote for the office', r: 'You shake on it. {them} owes you now, if {theyHe} wins and remembers.', fx: { poVote: 1, owed: 1, honor: -1 } },
      { t: 'Say you will vote as you think best', r: '{them} says that is all {theyHe} asks, which is not true.', fx: { honor: 1, them: { op: -3 } } },
      { t: 'Ask for it in writing', check: { s: 'persuasion', s2: 'int', d: 55 },
        win: { r: 'You get it in writing, sealed. It is worth something even if {theyHe} loses.', fx: { poVote: 1, owed: 1, int: 1 } },
        lose: { r: '{them} laughs and says only fools write such things. You have offended a man who may rule you.', fx: { them: { op: -10 } } } },
    ] },
  // queued a year before a promise made as candidate falls due (POL.promiseYear)
  { id: 'po_promise_due', title: 'An old promise', trigger: true, cool: 2,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { if (!aliveP(ctx.pid)) ctx.skip = true; },
    text: '{them} comes to court and stands where you will see {themHim}. You promised {themHim} a favour when you ruled. You rule. {theyHe} has not asked, yet, and does not need to.',
    choices: [
      { t: 'Pay it now, with a gift and a seat at table', req: (p) => p.coin >= 60, r: 'A purse and a place at your right hand for a feast. {them} says the debt is paid, and means it.', fx: { coin: -60, oweThem: -1, them: { op: 12 } } },
      { t: 'Ask for a little more time', r: '{them} gives it, with a look. A promise made at an election has a short memory and a long tail.', fx: { them: { op: -5 } } },
      { t: 'Pretend not to see', r: '{them} leaves before the meat. By spring the whole court knows what your word is worth.', fx: { them: { op: -15 }, honor: -2 } },
    ] },
  // queued when an election in which the player stood or voted is decided (POL.election)
  { id: 'po_election_day', title: 'The count', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { const r = A.realm(ctx.rid); if (!r || !r.pol || !r.pol.vote) { ctx.skip = true; return; } ctx.res = ctx.won ? 'Your name is read out last, and loudest' : 'Another name is read out'; if (!ctx.pid) ctx.pid = null; if (!ctx.pid) ctx.skip = true; },
    text: 'The electors of {realmT} file out of the chapel one by one. A herald reads the tally: {nV} votes of {nE}. {res}. {them} is across the nave, and everyone watches the two of you.',
    choices: [
      { t: 'Cross the nave and take {theirHis} hand', r: 'You take the hand. It is a small thing and a large one, and the electors see it done.', fx: { them: { op: 10 }, honor: 1 } },
      { t: 'Leave without a word', r: 'You go out by the side door. Nobody says anything to your face.', fx: { them: { op: -8 }, wil: 1 } },
      { t: 'Thank each elector by name', check: { s: 'persuasion', s2: 'ins', d: 40 },
        win: { r: 'You remember every name and every vote. The electors go home flattered or worried, which is what you wanted.', fx: { fame: 2 } },
        lose: { r: 'You get one name wrong, and it is the name that mattered.', fx: { fame: -1, happy: -1 } } },
    ] },

  // ------------------------------------------------------------------------------------------------ estates
  // your estate is angry with the crown, and wants your name (drawn)
  { id: 'po_estate_meets', title: 'Your own kind', w: 2, cool: 6, npc: true,
    cond: (p, C) => C.adult(p) && !C.ruler(p) && !C.prison(p),
    setup: (p, ctx) => {
      const P = POX(), r = myR(p); if (!P || !r || !r.pol) { ctx.skip = true; return; }
      const k = P.pcEstate(p), E = P.estState(r)[k];
      if (!E || E.ap > -4) { ctx.skip = true; return; }
      ctx.rid = r.id; ctx.estate = E.name; ctx.npcMove = true;
      const L = E.lead; if (L && L.id !== p.id) ctx.pid = L.id; else ctx.skip = true;
    },
    text: '{them} gathers {estate} in a long room with the shutters closed. There is a petition to the crown, already written, and a space at the bottom. {theyHe} puts the pen in your hand and waits.',
    choices: [
      { t: 'Sign it', r: 'Your name goes down under the others. The crown will see it, and so will {them}.', fx: { them: { op: 10 }, fame: 1 } },
      { t: 'Sign it, with a softer word added', check: { s: 'persuasion', s2: 'int', d: 45 },
        win: { r: 'You add a line that makes the thing a request instead of a threat. {them} lets it stand.', fx: { them: { op: 5 }, honor: 1 } },
        lose: { r: '{them} strikes out your line and keeps your name.', fx: { them: { op: 2 } } } },
      { t: 'Give back the pen', r: 'You say you will not put your name to it. The room goes quiet. {them} takes the pen back and says nothing at all.', fx: { them: { op: -12 }, wil: 1 } },
    ] },
  // the commons, when bread is dear (drawn)
  { id: 'po_bread_price', title: 'Bread at the cross', w: 2, cool: 5,
    cond: (p, C) => C.adult(p) && C.estate(p, 'comm') && C.poor(p),
    setup: (p, ctx) => { const P = POX(), r = myR(p); if (!P || !r || !r.pol || P.grainIdx(r) < 1.5) { ctx.skip = true; return; } ctx.rid = r.id; ctx.price = Math.round(P.grainIdx(r) * 10) / 10; },
    text: 'A loaf costs {price} times what it did. At the market cross the women count their pennies twice and the men talk of the granary behind the reeve\'s house, which is said to be full.',
    choices: [
      { t: 'Go with the crowd to the granary', check: { s: 'unarmed', s2: 'str', d: 50 },
        win: { r: 'The doors give. You carry home a sack, and so does everyone. The reeve does not come out.', fx: { poEst: { comm: 1 }, coin: 6, honor: -1 } },
        lose: { r: 'The reeve\'s men have staves. You come home bloody and without bread.', fx: { health: -10, poEst: { comm: -1 } } } },
      { t: 'Go without, and wait for the harvest', r: 'You tighten your belt and wait. The harvest, when it comes, is thin but real.', fx: { health: -3, wil: 1 } },
      { t: 'Speak for patience at the cross', r: 'Some listen. More shout. Nobody storms the granary today, and a few thank you for it.', fx: { fame: 1, happy: -1 } },
    ] },
  // the host, when the crown cannot pay its soldiers (drawn)
  { id: 'po_arrears', title: 'Pay day passes', w: 2, cool: 5,
    cond: (p, C) => C.adult(p) && C.soldier(p),
    setup: (p, ctx) => { const r = myR(p); if (!r || !r.pol || (r.treasury || 0) > 0) { ctx.skip = true; return; } ctx.rid = r.id; },
    text: 'The paymaster\'s table stays empty for the second month. In the lines the men talk of the crown\'s debts and of the lord who pays his own on time. A sergeant asks you what an officer thinks.',
    choices: [
      { t: 'Tell them the crown will pay', check: { s: 'command', s2: 'wil', d: 50 },
        win: { r: 'They believe you, for now. The pay comes a month later, and short, but it comes.', fx: { fame: 1, poEst: { army: 1 } } },
        lose: { r: 'They do not believe you. Three men desert that week.', fx: { happy: -2, poEst: { army: -1 } } } },
      { t: 'Pay your own men from your purse', req: (p) => p.coin >= 30, r: 'Thirty suns, and your company is the only one that drills the next morning.', fx: { coin: -30, fame: 2 } },
      { t: 'Say nothing', r: 'You keep your counsel. The men draw their own conclusions about officers.', fx: { poEst: { army: -1 } } },
    ] },
  // the clergy, when the crown builds for the gods (drawn)
  { id: 'po_temple', title: 'Stone for the gods', w: 1, cool: 8,
    cond: (p, C) => C.adult(p) && C.estate(p, 'cler'),
    setup: (p, ctx) => { const r = myR(p); if (!r || !r.pol || !(r.riGreatY && A.S.year - r.riGreatY < 3)) { ctx.skip = true; return; } ctx.rid = r.id; },
    text: 'The crown\'s masons have raised a great work, and the clergy of {realm} are asked to bless it. The high priest wants it blessed in the old form, which takes three days. The crown wants it done by noon.',
    choices: [
      { t: 'Keep the old form', r: 'Three days of chanting. The crown waits, and is not pleased, and the faithful come from miles to see it.', fx: { piety: 2, poEst: { cler: 1 } } },
      { t: 'Bless it by noon', r: 'It is done by noon. The crown thanks you. The high priest does not.', fx: { piety: -1, fame: 1 } },
      { t: 'Bless it by noon, then keep the vigil alone', r: 'You do both, and are tired for a week. Each side thinks you are on its side.', fx: { sta: -1, piety: 1 } },
    ] },
  // the guilds, when the crown sells monopolies (drawn)
  { id: 'po_guild_charter', title: 'The crown\'s salt', w: 1, cool: 8,
    cond: (p, C) => C.adult(p) && C.estate(p, 'burg'),
    setup: (p, ctx) => { const P = POX(), r = myR(p); if (!P || !r || !r.pol || P.pos(r, 'trade') !== 1) { ctx.skip = true; return; } ctx.rid = r.id; },
    text: 'The crown has sold the right to all the salt in {realm} to one man, and he has doubled the price. The guildmasters meet. Some want to petition. Some want to buy a share of it. One wants to smuggle.',
    choices: [
      { t: 'Put your name to the petition', r: 'The petition goes to the crown with forty names. Yours is near the top.', fx: { poEst: { burg: 1 }, fame: 1 } },
      { t: 'Buy a share of the monopoly', req: (p) => p.coin >= 80, r: 'A share of the salt costs you eighty suns, and pays well. The guild calls you a traitor at the next meeting.', fx: { coin: -80, poEst: { burg: -1 }, honor: -1 } },
      { t: 'Smuggle salt from over the border', check: { s: 'stealth', s2: 'ins', d: 55 },
        win: { r: 'Six mule-loads a month by the hill road. You make money and friends.', fx: { coin: 50, honor: -1 } },
        lose: { r: 'The salt-master\'s men are waiting at the hill road. The fine is heavy.', fx: { coinPct: -20, fame: -1 } } },
    ] },
  // ------------------------------------------------------------------------------------------------ fiefs
  // queued when forfeit lands are to be granted and the player stands for them or has a say (POL.openFief)
  { id: 'po_fief_vote', title: 'Forfeit lands', trigger: true, cool: 2,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { const r = A.realm(ctx.rid); if (!r || !r.pol || !r.pol.fief || !ctx.houseT) ctx.skip = true; ctx.role = ctx.cand ? 'Your name is one of three before the crown' : 'The council will be asked whom it backs'; },
    text: 'The heads of {houseT} are on spikes over the gate of {realmT}, and half their lands are the crown\'s to give. {role}. For sixty days every lord in the realm remembers who his friends are.',
    choices: [
      { t: 'Write to the councillors at once', check: { s: 'diplomacy', s2: 'int', d: 50 },
        win: { r: 'Your letters go out the same night, and three of them are answered warmly. It is a start.', fx: { fame: 1, skill: { diplomacy: 1 } } },
        lose: { r: 'Your letters arrive after everyone else\'s, and read like it.', fx: { happy: -1 } } },
      { t: 'Say nothing, and let the crown decide', r: 'You keep your counsel. A man who does not scramble for a traitor\'s lands is sometimes given them. Sometimes.', fx: { honor: 1 } },
      { t: 'Ride out to look at the lands', r: 'Good river meadow, a mill, a hall with the roof burned. You come home knowing what they are worth to you.', fx: { int: 1, sta: -1 } },
    ] },
  // queued when the player stood for forfeit lands and another got them (POL.closeFief)
  { id: 'po_passed_over', title: 'Passed over', trigger: true, cool: 3,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { if (!aliveP(ctx.pid) || !ctx.houseT) ctx.skip = true; },
    text: 'The lands of {houseT} go to {them}. The herald reads it out, and {theyHe} accepts with a short speech that thanks everyone but you. Your friends at court are suddenly busy elsewhere.',
    choices: [
      { t: 'Congratulate {themHim} in front of the court', r: 'You bow and say the right words. {them} is surprised and, later, grateful.', fx: { them: { op: 10 }, happy: -2 } },
      { t: 'Leave the hall before the feast', r: 'You ride home in the rain. It is noticed, and it is understood.', fx: { them: { op: -6 }, wil: 1 } },
      { t: 'Ask the crown what you lacked', check: { s: 'etiquette', s2: 'ins', d: 50 },
        win: { r: 'The answer is honest: renown, and a friend on the council. You know now what to buy.', fx: { int: 1, fame: 1 } },
        lose: { r: 'The question is taken as a complaint. The crown\'s regard cools.', fx: { fame: -1, happy: -1 } } },
    ] },
]);
