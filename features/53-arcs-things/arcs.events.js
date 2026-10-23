// Thirteen story arcs about objects, places and mysteries (53-arcs-things; Road to Ten, Events 3 and 4). Each stage is a
// trigger-only scene the story track in 46-life-arcs brings on years apart; every choice moves the arc on (fx.arc) and
// leaves a mark that the later scenes read (M below), and every last scene leaves something that lasts.
// Nothing here is magic: every curse, relic and haunting has a person behind it.
// The pack is a block of its own: event packs share one script scope, and 46-life-arcs has its own M.
{
// a mark this arc has left: fx.arc {mark:'x'} sets the flag la_x (46-life-arcs). Called with the whole mark name,
// so the mark a later stage answers is plain in the source, to a reader and to the memory index in bench/bot.mjs.
const M = (p, m) => !!(p && p.flags && p.flags['la_' + m]);
const MK = (p, k) => (p && p.arcs && p.arcs[k] && Array.isArray(p.arcs[k].m) ? p.arcs[k].m : []);
const WHO = (p, ctx, o) => A.AO.who(p, ctx, o);
const WORD = (p, ctx, k, f) => A.AO.word(p, ctx, k, f);
const NOBLE = p => A.C.noble(p);
const reeve = p => (NOBLE(p) ? 'your steward' : 'the reeve');
const stw = p => (NOBLE(p) ? 'your own steward' : "the lord's steward");
const fatherAlive = p => { const f = p && p.parents && A.P(p.parents[0]); return !!(f && f.alive); };

// Kestrel: who holds the sword now, read from the arc's marks in order
const SW_YOU = ['ao_sw_bought', 'ao_sw_cheap', 'ao_sw_kept', 'ao_sw_refused', 'ao_sw_bid', 'ao_sw_mud', 'ao_sw_blooded', 'ao_sw_wall'];
const SW_AT = { ao_sw_lord: 'lord', ao_sw_told: 'lord', ao_sw_lost_court: 'lord', ao_sw_out: 'lord', ao_sw_gave: 'kin', ao_sw_court: 'kin', ao_sw_sold: 'knight', ao_sw_letgo: 'knight', ao_sw_gone: 'lost' };
const swAt = p => MK(p, 'ao_sword').reduce((h, m) => (SW_YOU.includes(m) ? 'you' : SW_AT[m] || h), 'lord');
const swHas = p => swAt(p) === 'you';
// the stolen horse, by what was in the stall
const HORSE = { mule: 'your mule', horse: 'your bay gelding', palfrey: 'your grey palfrey', destrier: 'your warhorse', camel: 'your camel' };
// the house whose gallery has your face
const PH = (p, ctx) => {
  const hid = WORD(p, ctx, 'hid', () => { const hs = A.realmHouses(p.realm).filter(h => h.id !== p.house); return hs.length ? A.pick(hs).id : ''; });
  const h = hid ? A.house(hid) : null;
  ctx.house = h && h.name ? h.name : 'an old family';
  ctx.seat = h && h.seat ? h.seat : A.provName(p.home);
  return h;
};
// what the song is about: the loudest thing this life has done, if any of these arcs left one
const SONGS = [
  ['the sword Kestrel, and the hand that carries it', 'Kestrel-Hand'],
  ['the night the cursed mill burned, and the steward who hanged for it', 'Millfire'],
  ['the bridge at {home}, and the name on its keystone', 'the Bridgewright'],
  ["the finger in the silver box, which was a dog's", 'Dog-Finger'],
  ['a horse thief who became a groom', 'the Horse-Friend'],
  ['the cog Patience, lost and found', 'the Shipfinder'],
  ['the night of the fire, and the bell', 'the Bell-Ringer'],
  ['the burnt tower, and the names on the stone', 'the Stone-Raiser'],
  ['your part in the last muster, a good deal enlarged', 'the Bold'],
  ['a goose that once chased you the length of {home} market', 'Goose-Runner'],
];
// The subject is chosen once, in the song's first stage, from the endings this life has reached: that chain lives in
// ao_song_1's setup, where the choosing happens, so the other arcs it reads are plain in the event that reads them.
const SONG = (p, ctx, i0) => {
  const R = A.realm(p.realm), cap = R && R.capital ? R.capital : 'the capital';
  ctx.far = A.provName(p.home) === cap ? 'every market town in ' + A.realmShort(p.realm) : cap;
  const i = WORD(p, ctx, 'si', () => (i0 == null ? 9 : i0));
  const S = SONGS[i] || SONGS[9];
  ctx.subj = A.T(S[0]);
  WORD(p, ctx, 'ep', () => S[1]);
};

A.defEvents([
  // ================================================================ Kestrel: a sword with a song (6 stages, 10-20 years)
  { id: 'ao_sword_1', title: 'A sword in the back room', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: "Behind a pawnbroker's counter in {home}, among plough-irons and a cracked lute, hangs a sword in a rotten scabbard. A hawk is worked into the crossguard, and along the blade, in old letters, runs one word: KESTREL. The drovers sing of Kestrel, the sword Captain Marrok carried at the Narrow Pass. The pawnbroker calls it a curiosity and asks forty.",
    choices: [
      { t: 'Pay the forty and take it home', req: p => p.coin >= 40, r: 'You pay. It is heavier than it looks and better balanced than anything you have held, and you hang it where you can see it from the bed.', fx: { coin: -40, happy: 4, arc: { mark: 'ao_sw_bought' } } },
      { t: 'Haggle, and hope he never heard the song', check: { s: 'trade', s2: 'ins', d: 45 },
        win: { r: 'You get it for fifteen and a grumble about the scabbard.', fx: { coin: -15, happy: 2, arc: { mark: 'ao_sw_cheap' } } },
        lose: { r: 'He watches your hand on the hilt, names a price you cannot meet, and sends a boy up to the manor. The steward buys it before noon.', fx: { happy: -3, arc: { mark: 'ao_sw_lord' } } } },
      { t: 'Tell him what he has', r: "He stares at the blade, then at you. The lord's steward pays him ten times forty, and he gives you a share of it, which surprises you both.", fx: { coin: 15, honor: 3, arc: { mark: 'ao_sw_told' } } },
    ] },
  { id: 'ao_sword_2', title: "Marrok's blood", trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { const t = WHO(p, ctx); if (t) ctx.kin = t.sex === 'F' ? 'granddaughter' : 'grandson'; },
    text: p => (swHas(p)
      ? `${M(p, 'ao_sw_bought') ? 'You paid the forty and thought it cheap. ' : M(p, 'ao_sw_cheap') ? 'You paid fifteen, and the pawnbroker still grumbles about the scabbard. ' : ''}{them} comes to your door, cap in hand: Captain Marrok's {kin}. {theyHe} pawned Kestrel drunk in a hungry winter, and always meant to buy it back. {theyHe} has no money now either, only the name, which {theyHe} says the way people mention a debt.`
      : `{them}, Captain Marrok's {kin}, finds you at the market. {theyHe} pawned Kestrel drunk in a hungry winter, and now the lord's steward wears it to the fair.${M(p, 'ao_sw_told') ? ' You told the pawnbroker what he had, and took your share of it.' : M(p, 'ao_sw_lord') ? ' The boy went up to the manor while your hand was on the hilt.' : ''} A pawn may be redeemed within a year and a day. {theyHe} wants you to say so before the manor court, since you knew the sword by name.`),
    choices: [
      { t: 'Give it back to {them}', req: p => swHas(p), r: '{them} holds it across both palms like a loaf. {theyHe} cannot find anything to say, so you talk about the weather until {theyHe} can.', fx: { honor: 5, happy: 2, them: { op: 25 }, arc: { mark: 'ao_sw_gave' } } },
      { t: 'Keep it. You paid fair', req: p => swHas(p), r: '{theyHe} goes. You hear later that {theyHe} tells the story with you in it, and not kindly.', fx: { wil: 1, them: { op: -20 }, arc: { mark: 'ao_sw_kept' } } },
      { t: 'Swear before the manor court for {themHim}', req: p => !swHas(p), check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: 'The court hears you, and the law. The steward hands Kestrel over with a face like vinegar.', fx: { honor: 3, them: { op: 20 }, arc: { mark: 'ao_sw_court' } } },
        lose: { r: "The steward's word outweighs yours. The court calls the pawn a sale and fines you for wasting its morning.", fx: { coin: -5, them: { op: 10 }, arc: { mark: 'ao_sw_lost_court' } } } },
      { t: "Keep out of a lord's business", req: p => !swHas(p), r: 'You keep out of it. The steward notices, and is easy with you over the rent that winter.', fx: { coin: 10, them: { op: -10 }, arc: { mark: 'ao_sw_out' } } },
    ] },
  { id: 'ao_sword_3', title: "The abbey's chronicle", trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); },
    text: p => `A monk who has heard you know about Kestrel shows you a page of the abbey's chronicle, written the year of the Narrow Pass. It says Captain Marrok never held the pass. He sold it, and the enemy paid him in silver and a sword with a hawk on the guard: the hawk was their badge.${M(p, 'ao_sw_gave') ? ' You gave it to {them}.' : M(p, 'ao_sw_kept') ? ' You kept it, and {them} tells the story unkindly.' : M(p, 'ao_sw_court') ? ' You swore for {them} before the manor court.' : M(p, 'ao_sw_lost_court') ? ' The court called the pawn a sale, and fined you.' : M(p, 'ao_sw_out') ? " You kept out of the lord's business, and your rent was easy." : ''} ${{ you: 'The sword on your wall was the price.', kin: "The sword at {them}'s hearth was the price." }[swAt(p)] || "The sword at the steward's hip was the price."}`,
    choices: [
      { t: 'Pay the monk to copy the page for you', r: 'He copies it in a clear brown hand and will take nothing beyond the cost of the ink.', fx: { coin: -5, int: 1, arc: { mark: 'ao_sw_truth' } } },
      { t: 'Ask him to let that page go missing', r: 'The monk is old, and tired of the song too. The page goes into the brazier. The song stays true, which is to say false.', fx: { happy: 2, honor: -2, arc: { mark: 'ao_sw_burned' } } },
      { t: 'Tell {them} what {theirHis} grandfather did', r: '{them} hears it out, then goes away without a word. Some say {theyHe} has stopped drinking since; others, that {theyHe} has started in earnest.', fx: { honor: 2, them: { op: -15 }, arc: { mark: 'ao_sw_toldkin' } } },
    ] },
  { id: 'ao_sword_4', title: 'A buyer for Kestrel', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); },
    text: p => {
      const at = swAt(p);
      // what the monk's page came to, if you did anything with it
      const page = M(p, 'ao_sw_burned') ? " The monk's page went into his brazier." : M(p, 'ao_sw_toldkin') ? ' {them} has not spoken to you since you told {themHim}.' : '';
      if (at === 'you') return `A young knight of a great house rides into {home} to see Kestrel, having heard the song. He offers three hundred for it, which would buy a farm, and says, smiling, that it would be safer with someone trained to use it.${M(p, 'ao_sw_truth') ? " The monk's page is in your chest." : ''}${page}`;
      if (at === 'kin') return '{them} has drunk through everything but Kestrel. A young knight of a great house has offered three hundred for it, for the song. {them} comes to you first: you can have it for the hundred {theyHe} owes.' + page;
      return "The old lord dies, and his heir sells what he does not want. Kestrel is laid out on a trestle with the hounds' collars and the hangings. A young knight of a great house means to have it, for the song. The bidding starts at a hundred." + page;
    },
    choices: [
      { t: 'Sell it to the knight', req: p => swHas(p), r: 'He counts three hundred onto your table and rides off with the song on his hip.', fx: { coin: 300, arc: { mark: 'ao_sw_sold' } } },
      { t: 'Refuse him, and smile back', req: p => swHas(p), r: p => (M(p, 'ao_sw_truth') ? "You show him the monk's page. He reads it twice and leaves without his smile. You bar the door that night anyway." : 'He stops smiling and leaves. You bar the door that night, and for a good many nights after.'), fx: { fame: 2, wil: 1, arc: { mark: 'ao_sw_refused' } } },
      { t: 'Buy it, whatever it costs', req: p => !swHas(p), r: p => (p.coin < 120 ? 'It costs a hundred and twenty, which is more than you have, so it costs everything you have and a promise besides. Kestrel comes home in a sack.' : swAt(p) === 'kin' ? "You pay {them}'s hundred, and twenty more for {theirHis} pride. Kestrel comes home in a sack." : 'It costs a hundred and twenty and a sleepless night. Kestrel comes home in a sack.'), fx: { coin: -120, happy: 4, arc: { mark: 'ao_sw_bid' } } },
      { t: 'Let the knight have it', req: p => !swHas(p), r: 'The knight buys it and rides south. Kestrel leaves {home} for the first time in a lifetime, and the song goes with it.', fx: { happy: -1, wil: 1, arc: { mark: 'ao_sw_letgo' } } },
    ] },
  { id: 'ao_sword_5', title: 'The levy at the ford', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => (swHas(p)
      ? `Raiders come over the hills, and the levy is called to the ford below {home}. Kestrel hangs on your wall.${M(p, 'ao_sw_refused') ? ' You refused three hundred for it.' : M(p, 'ao_sw_bid') ? ' It cost you a hundred and twenty to get it back.' : ''} A sword with a song draws eyes in a fight, and not only friendly ones.${M(p, 'ao_sw_truth') ? " The monk's page says the enemy's smiths made it. It is still sharp." : ''}`
      : `Raiders come over the hills, and the levy is called to the ford below {home}. ${swAt(p) === 'knight' ? 'The knight who bought Kestrel rides at its head, with the hawk at his hip.' : 'Kestrel rides at its head, on a hip that is not yours.'}${M(p, 'ao_sw_sold') ? ' You sold it to him yourself.' : M(p, 'ao_sw_letgo') ? ' You let him have it.' : ''} The raiders will cross at the ford, if they cross.`),
    choices: [
      { t: 'Carry Kestrel in the line', req: p => swHas(p), check: { s: 'melee', s2: 'wil', d: 50 },
        win: { r: 'You hold your stretch of the bank. Afterwards men you do not know point at the hawk on your guard, and then at you.', fx: { fame: 4, honor: 2, arc: { mark: 'ao_sw_blooded' } } },
        lose: { r: "The line holds. Your arm does not: a raider's axe opens it from wrist to elbow, and Kestrel comes home cleaner than you do.", fx: { fame: 2, wound: 'scar_arm', arc: { mark: 'ao_sw_blooded' } } } },
      { t: 'Leave it on the wall and take a spear', req: p => swHas(p), r: 'You fight with a spear like everyone else and come home with everyone else. Kestrel is where you left it.', fx: { happy: 2, arc: { mark: 'ao_sw_wall' } } },
      { t: 'Go with the levy, and watch the hawk', req: p => !swHas(p), check: { s: 'ins', s2: 'spd', d: 50 },
        win: { r: 'The knight goes down in the ford with an arrow in his throat. You reach Kestrel before his squire does, and say nothing about it after.', fx: { happy: 3, honor: -2, arc: { mark: 'ao_sw_mud' } } },
        lose: { r: 'The knight goes down in the ford. In the press you lose sight of the sword, and when the water clears it is gone.', fx: { health: -8, arc: { mark: 'ao_sw_gone' } } } },
      { t: 'Stay home this once', req: p => !swHas(p), r: 'You stay home. The raiders turn back at the ford, and the knight comes home a hero, with the sword.', fx: { happy: 1, wil: 1, arc: { mark: 'ao_sw_home' } } },
    ] },
  { id: 'ao_sword_6', title: 'Where Kestrel goes', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); },
    text: p => (swHas(p)
      ? `${M(p, 'ao_sw_mud') ? 'Kestrel hangs on your wall, out of the ford, and nobody has asked how.' : 'Kestrel has been yours for years now.'}${M(p, 'ao_sw_blooded') ? ' Men still point at the hawk.' : M(p, 'ao_sw_wall') ? ' The ford never saw it.' : ''}${M(p, 'ao_sw_truth') ? " The monk's page is in your chest." : ''} {them}'s eldest has come of age and walked over to {home} to see it. A sword with a song goes somewhere in the end, and people remember where.`
      : `${M(p, 'ao_sw_gone') ? 'Kestrel went into the ford and out of it in somebody else\'s hand.' : M(p, 'ao_sw_home') ? "Kestrel came back from the ford on the knight's hip, and you stayed home that day." : "Kestrel is a knight's now, on a wall you will never see."} What you have left is the story, ${M(p, 'ao_sw_truth') ? "and the monk's page that says the song is a lie" : 'which the drovers still sing wrong'}. A minstrel at the fair wants your part in it.`),
    choices: [
      { t: 'Wear it, and let them call you by it', req: p => swHas(p), r: 'You wear it on market days, and to church, and the priest does not object. Within the year {home} has a name for you.', fx: { gear: { weapon: 'goodsword' }, aoQual: { weapon: 'master' }, epithet: 'Kestrel', fame: 3, flag: 'ao_kestrel', deed: 'Carried the sword Kestrel', arc: { go: 'end' } } },
      { t: "Put it in the hands of Marrok's blood", req: p => swHas(p), r: '{them} weeps, which you did not expect, and makes {theirHis} eldest swear on the blade to keep it. The Marroks will remember you longer than the song does.', fx: { honor: 6, them: { type: 'friend', op: 40 }, flag: 'ao_kestrel_given', deed: 'Gave Kestrel back to the Marroks', arc: { go: 'end' } } },
      { t: 'Give the minstrel your part, plainly', req: p => !swHas(p), r: p => (M(p, 'ao_sw_truth') ? 'The new verses are worse for singing and better for remembering. The pass is sold in them, and your name is in the third.' : 'The minstrel puts you in the third verse, buying the sword for forty. It is the verse people hum.'), fx: { fame: 3, flag: 'ao_kestrel_song', deed: 'Put yourself into the song of Kestrel', arc: { go: 'end' } } },
      { t: 'Have a smith copy it, hawk and all', req: p => !swHas(p), r: 'It costs you forty, or all you have. The smith copies the hawk well and the balance badly, and nobody but you will ever know the difference.', fx: { coin: -40, gear: { weapon: 'sword' }, flag: 'ao_kestrel_copy', deed: 'Had the sword Kestrel copied', arc: { go: 'end' } } },
    ] },

  // ================================================================ the old map (4 stages)
  { id: 'ao_map_1', title: 'Something in the lining', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WORD(p, ctx, 'nm', () => A.givenName(p.cult, 'F')); },
    text: "At a dead man's sale in {home} you buy a coat for the winter. Sewn into the lining is a map on calfskin: the hills above {home}, a stream, an oak drawn split down the middle, and a cross beside it. Under the cross, in brown ink: for the heirs of {nm}. The pedlar who sold you the coat has become very interested in it.",
    choices: [
      { t: 'Go up into the hills and look', r: 'You walk the stream from its mouth to its spring. There is no split oak, only a field, new-ploughed, where one could have stood.', fx: { sta: 1, happy: 1, arc: { mark: 'ao_map_went' } } },
      { t: 'Pay a clerk to read the hand', r: "The clerk says the hand is eighty years old, and the cross is no treasure mark but a surveyor's. It marks the corner of something.", fx: { coin: -8, skill: { learning: 1 }, arc: { mark: 'ao_map_read' } } },
      { t: 'Sell it back to the pedlar', r: 'He pays fifteen without haggling, which tells you something, and leaves for the hills that afternoon with a spade.', fx: { coin: 15, arc: { mark: 'ao_map_sold' } } },
    ] },
  { id: 'ao_map_2', title: 'The field by the hedge', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); },
    text: p => (M(p, 'ao_map_sold')
      ? 'The pedlar dug in the hills for a month, found nothing, and now drinks in {home} swearing the map is a cheat. You remember it well enough. The field where the oak stood belongs to {them}, who keeps a sharp dog, and the cross falls by {theirHis} hedge.'
      : `The oak is long gone. Where it stood, {them} ploughs a field and keeps a sharp dog.${M(p, 'ao_map_read') ? ' The clerk said the cross marks a corner. A corner of what, the map does not say.' : M(p, 'ao_map_went') ? ' You have walked that stream from its spring to its mouth.' : ''} The cross on the map falls by {theirHis} hedge.`),
    choices: [
      { t: 'Dig by the hedge at night', check: { s: 'stealth', s2: 'sta', d: 50 },
        win: { r: 'Two feet down, your spade rings on lead: a box the size of a psalter, sealed with pitch.', fx: { happy: 3, arc: { mark: 'ao_map_dug' } } },
        lose: { r: 'The dog finds you before you find anything, and {them} finds you after the dog.', fx: { health: -5, them: { op: -20 }, arc: { mark: 'ao_map_caught' } } } },
      { t: 'Ask {them} to dig with you, for halves', r: '{theyHe} thinks about it through a whole mug of ale, then fetches two spades. Two feet down by the hedge, both of them ring on lead.', fx: { them: { op: 15 }, honor: 1, arc: { mark: 'ao_map_halves' } } },
      { t: 'Leave it in the ground', r: 'You put the map away and the field out of your mind, mostly.', fx: { wil: 1, arc: { mark: 'ao_map_left' } } },
    ] },
  { id: 'ao_map_3', title: 'What was in the box', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); WORD(p, ctx, 'nm', () => A.givenName(p.cult, 'F')); },
    text: p => `${M(p, 'ao_map_left') ? "{them}'s plough turned up a lead box by the hedge this spring, and the talk brought it to your door." : M(p, 'ao_map_caught') ? '{them} dug where you had been digging, out of spite, found a lead box, and brings it to you sullenly.' : M(p, 'ao_map_halves') ? '{them} brings the lead box to your table and sits down to watch it opened, halves agreed.' : M(p, 'ao_map_dug') ? 'You open the lead box on your table, the hedge-earth still on it.' : 'You open the lead box on your table.'} Inside, in oilcloth, is no gold: a charter under an old lord's seal, granting the field by the split oak and the stream beside it to {nm} and her heirs for ever. The parish book says {nm} was your father's grandmother.`,
    choices: [
      { t: "Show it to the lord's steward", r: 'The steward reads it twice, goes the colour of the parchment, and says he must show it to his lord.', fx: { honor: 2, arc: { mark: 'ao_map_shown' } } },
      { t: 'Have a lawyer in {capital} read it', r: 'The lawyer says the seal is good and the grant is good, and the lord will fight it. He would take the case for a fifth of the field.', fx: { coin: -20, int: 1, arc: { mark: 'ao_map_lawyer' } } },
      { t: 'Hide it again, and think', r: 'You put it under the floor and think about it every time you cross the room.', fx: { wil: 1, arc: { mark: 'ao_map_hidden' } } },
    ] },
  { id: 'ao_map_4', title: 'The field by the split oak', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); },
    text: p => `${M(p, 'ao_map_shown') ? 'The lord has heard about the charter, and sends for you.' : M(p, 'ao_map_lawyer') ? 'Your lawyer says the manor court sits next month and the case is good.' : M(p, 'ao_map_hidden') ? 'The charter is still under your floor, and you cross that room twice a day.' : 'The charter is still under your floor.'} It is good land. {them} has ploughed it twenty years and paid the lord rent for it. If the charter stands, {theyHe} pays the rent to you, or goes.`,
    choices: [
      { t: 'Press your claim in the manor court', check: { s: 'persuasion', s2: 'int', d: 55 },
        win: { r: 'The court reads the seal and cannot argue with it. The field is yours, and the stream with it, and {them} will not look at you in church.', fx: { aoAsset: { k: 'farm', name: 'The field by the split oak' }, them: { type: 'rival', op: -25 }, flag: 'ao_map_field', deed: 'Won back a field by an old charter', arc: { go: 'end' } } },
        lose: { r: "The lord's lawyer finds a later grant, or writes one. You pay the costs of the court, and {them} does not forgive the trying.", fx: { coin: -30, them: { type: 'enemy', op: -40 }, flag: 'ao_map_lost', deed: 'Lost a claim to a field in the manor court', arc: { go: 'end' } } } },
      { t: 'Give the charter to {them}', r: "You put it in {theirHis} hands. The field is {theirHis} own by law now, not by the lord's leave, and {theyHe} knows whom to thank.", fx: { honor: 6, them: { type: 'friend', op: 40 }, flag: 'ao_map_gave', deed: 'Gave away the charter to a field', arc: { go: 'end' } } },
      { t: 'Sell the charter to the lord', r: 'The lord pays well to see it burn. You stay to watch it burn too, since that seems only polite.', fx: { coin: 150, flag: 'ao_map_sold', deed: 'Sold the charter of a field to the lord', arc: { go: 'end' } } },
    ] },

  // ================================================================ the burnt tower (4 stages)
  { id: 'ao_ruin_1', title: 'The tower on the hill', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `On the hill above {home} stands a burnt tower nobody goes near. Children dare each other to touch the door. This winter the frost brought down a wall, and under it is a stair going down into the dark. ${NOBLE(p) ? 'Your steward wants' : 'The reeve wants'} the fallen stone for the new church, and the stair filled in.`,
    choices: [
      { t: 'Let them take the stone for the church', r: 'The carts go up empty and come down heavy. The stair is filled with rubble, and the priest blesses the rubble.', fx: { piety: 3, arc: { mark: 'ao_ru_church' } } },
      { t: 'Go down the stair first, with a lamp', r: 'At the bottom is a vault, and in the vault are bones: a dozen people, large and small, lying where they fell. The door was barred from outside.', fx: { wil: 1, happy: -2, arc: { mark: 'ao_ru_down' } } },
      { t: p => (NOBLE(p) ? 'Keep the hill as it is, and pay for the stone' : 'Lease the hill from the lord'), req: p => p.coin >= 20, r: p => (NOBLE(p) ? 'You pay the church for stone from elsewhere. The hill is yours, and stays as it is, nettles and all.' : 'The lord is glad to be paid for a hill of nettles. It is yours for nine years and nine.'), fx: { coin: -20, int: 1, arc: { mark: 'ao_ru_lease' } } },
    ] },
  { id: 'ao_ruin_2', title: 'The bones under the tower', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); },
    text: p => `${M(p, 'ao_ru_church') ? "The rubble in the stair settled, and a mason's boy fell through into a vault full of bones." : M(p, 'ao_ru_lease') ? 'Your hill has a vault, and the vault has bones.' : M(p, 'ao_ru_down') ? 'You went down the stair with a lamp, and the bones are where you left them.' : 'The bones are still in the vault.'} A dozen people, children among them, behind a door barred from outside. {them}, whose family has been in {home} longest, tells you what {theirHis} grandmother said: in the hungry year, the village burned the tower with its lord and his household inside.`,
    choices: [
      { t: 'Bury them in the churchyard, with a priest', req: p => p.coin >= 10, r: 'The priest says the words and does not ask whose bones they are. Half the village stays away from the burying.', fx: { coin: -10, piety: 4, arc: { mark: 'ao_ru_buried' } } },
      { t: 'Fill in the vault and say nothing', r: '{them} nods slowly, as if you have passed a test {theyHe} did not mean to set.', fx: { honor: -2, happy: 2, them: { op: 10 }, arc: { mark: 'ao_ru_quiet' } } },
      { t: 'Ask {them} who carried the torches', r: "{theyHe} names names. One of the names is your great-grandfather's.", fx: { int: 1, them: { op: -10 }, arc: { mark: 'ao_ru_asked' } } },
    ] },
  { id: 'ao_ruin_3', title: 'The last of the house', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx, { key: 'heir' }); },
    text: p => `A stranger comes to {home} with a priest's letter and a family tree: {them}, last of the house that held the tower. {theyHe} has heard about the bones${M(p, 'ao_ru_buried') ? ' and the burying' : ''}, and wants to know how {theirHis} people died.${M(p, 'ao_ru_asked') ? ' You know the names.' : ''}${M(p, 'ao_ru_quiet') ? ' The village has decided it knows nothing.' : ''}`,
    choices: [
      { t: 'Tell {themHim} the truth', r: p => (M(p, 'ao_ru_asked') ? '{theyHe} hears it standing. Then {theyHe} asks for the names, and you give them, your own family among them.' : '{theyHe} hears it standing, and asks for names you do not have. {theyHe} says {theyHe} will find them.'), fx: { honor: 4, them: { op: 20 }, arc: { mark: 'ao_ru_truth' } } },
      { t: 'Tell {themHim} it was raiders', r: '{theyHe} thanks you. The village stands you ale for a month and does not say why.', fx: { honor: -3, happy: 2, arc: { mark: 'ao_ru_lie' } } },
      { t: 'Pay {themHim} to go home', req: p => p.coin >= 40, r: '{theyHe} takes the money and spits by your door, which is a kind of receipt.', fx: { coin: -40, wil: 1, arc: { mark: 'ao_ru_paid' } } },
    ] },
  { id: 'ao_ruin_4', title: 'What the hill becomes', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx, { key: 'heir' }); },
    text: p => `${M(p, 'ao_ru_truth') ? '{them} has stayed on in {home}, and the village cannot meet {theirHis} eye.' : M(p, 'ao_ru_lie') ? '{them} went home believing in raiders.' : M(p, 'ao_ru_paid') ? '{them} took your forty and went, and spat by the door on the way.' : '{them} went away unanswered.'} The tower's stone is good stone, and the hill is ${M(p, 'ao_ru_lease') ? (NOBLE(p) ? 'yours' : 'yours by lease') : "nobody's, since nobody will touch it"}. ${M(p, 'ao_ru_buried') ? 'The dead are in the churchyard now.' : 'The dead are still under it.'} Something must be done with the place.`,
    choices: [
      { t: "Build a house from the tower's stone", r: 'You build on the old footings. The walls are a yard thick and warm in winter, and the children stop daring each other.', fx: { aoAsset: { k: 'cottage', name: 'The house on the tower hill' }, happy: 3, flag: 'ao_ruin_house', deed: 'Built a house from the stone of the burnt tower', arc: { go: 'end' } } },
      { t: 'Raise a stone for the dead', r: p => (M(p, 'ao_ru_asked') || M(p, 'ao_ru_truth') ? 'You cut their names on it, and under them the names of the ones who carried torches. People leave flowers. Some of them leave early.' : 'You do not know their names, so you cut the year. People leave flowers, and stop talking when you pass.'), fx: { honor: 4, piety: 2, flag: 'ao_ruin_stone', deed: 'Raised a stone for the dead of the burnt tower', arc: { go: 'end' } } },
      { t: 'Sell the stone to the church builders', r: 'The carts take the tower away a load at a time. By harvest there is only a green mound, and the church has a new aisle.', fx: { coin: 60, flag: 'ao_ruin_sold', deed: 'Sold the stone of the burnt tower', arc: { go: 'end' } } },
      { t: 'Give the hill to {them}', req: p => M(p, 'ao_ru_truth'), r: '{them} builds nothing on it. {theyHe} plants a yew by the old door and comes to sit under it, and after a while you go and sit there too.', fx: { honor: 3, them: { type: 'friend', op: 40 }, flag: 'ao_ruin_given', deed: 'Gave the tower hill back to the last of its house', arc: { go: 'end' } } },
    ] },

  // ================================================================ the finger in the silver box (5 stages)
  { id: 'ao_relic_1', title: "The pilgrim's box", trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: "A pilgrim dies of a fever in {home}, and leaves what he carried to you, who fetched him water: a silver box no longer than a finger, and in it a finger, brown and dry. A letter under a bishop's seal says it was a martyr's. The priest would like it for the church. A goldsmith would like a look at the box.",
    choices: [
      { t: 'Give it to the church', r: 'The priest carries it up the aisle under a cloth, and it goes into a niche by the altar with a candle in front of it.', fx: { piety: 4, arc: { mark: 'ao_re_church' } } },
      { t: 'Keep it in your house', r: 'You set it on the shelf over the hearth. The house feels watched, in a way you decide is a comfort.', fx: { piety: 2, happy: 2, arc: { mark: 'ao_re_kept' } } },
      { t: 'Let the goldsmith look at the box', r: 'The goldsmith says the silver is good and the seal is not: the wax is new, and the bishop it names has been dead forty years. He keeps his voice low.', fx: { int: 1, arc: { mark: 'ao_re_doubt' } } },
    ] },
  { id: 'ao_relic_2', title: 'The fever breaks', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `A child of {home} with the sweating fever is carried ${M(p, 'ao_re_church') ? 'into the church' : 'to your door'} to touch the box, and the fever breaks that night. By the next feast there are forty pilgrims in {home}. They want to touch it too, and they have brought money.${M(p, 'ao_re_doubt') ? ' You think of the new wax on the seal.' : ''}`,
    choices: [
      { t: 'Let them come, and take their offerings', r: 'They come in hundreds. The alehouse is full, the offerings fill a chest, and the priest buys new vestments and stops asking questions.', fx: { coin: 40, piety: -1, arc: { mark: 'ao_re_pilgrims' } } },
      { t: 'Turn the pilgrims away', r: 'Most go grumbling. One woman sits on the step with her sick husband for three days, until you let her in.', fx: { honor: 2, happy: -2, arc: { mark: 'ao_re_closed' } } },
      { t: 'Write to the bishop and ask', r: "You pay a clerk to write it fair. The bishop's answer will take a season, or several.", fx: { coin: -3, piety: 1, int: 1, arc: { mark: 'ao_re_wrote' } } },
    ] },
  { id: 'ao_relic_3', title: 'The same finger', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); },
    text: p => `A friar comes to {home}: {them}, who says the abbey two valleys south has the same martyr's same finger, under the same bishop's seal, and has had it six years.${M(p, 'ao_re_wrote') ? ' The bishop has sent {themHim}, in answer to your letter.' : ''}${M(p, 'ao_re_pilgrims') ? ' {theyHe} has been watching your pilgrims with interest.' : M(p, 'ao_re_closed') ? ' Your door has been shut to pilgrims since the spring.' : ''} {theyHe} wants to lay the two side by side.`,
    choices: [
      { t: 'Lay them side by side, and look hard', check: { s: 'medicine', s2: 'ins', d: 50 },
        win: { r: "Side by side they are twins. {them} turns yours to the window: a dog's toe-bone, {theyHe} says, and a big dog. You both know it now.", fx: { int: 1, arc: { mark: 'ao_re_fake' } } },
        lose: { r: '{them} cannot tell, or will not say. You are left with a finger that may be holy and may not.', fx: { piety: 1, arc: { mark: 'ao_re_unsure' } } } },
      { t: 'Hide it before {theyHe} sees it', r: '{theyHe} goes away puzzled, and writes a long letter to somebody.', fx: { honor: -2, wil: 1, arc: { mark: 'ao_re_hidden' } } },
      { t: 'Pay {themHim} to call yours the true one', req: p => p.coin >= 30, r: '{theyHe} takes your money for the poor, {theyHe} says, and writes a fine letter that yours is the true one. The other abbey will have a letter too, by spring.', fx: { coin: -30, fame: 2, arc: { mark: 'ao_re_bribed' } } },
    ] },
  { id: 'ao_relic_4', title: "The goldsmith's back room", trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx, { key: 'forger' }); },
    text: p => `The silver box has a maker's mark, and the mark leads you to a shop in {capital}. {them} makes reliquaries there, and the bones that go in them, and the bishops' seals for the letters. ${M(p, 'ao_re_fake') ? 'You know what yours is.' : M(p, 'ao_re_unsure') ? 'The friar could not tell you. This shop can.' : 'Now you know what yours is.'}${M(p, 'ao_re_hidden') ? ' You hid yours from the friar, and here it is in a ledger.' : ''} {theyHe} has sold forty of them.${M(p, 'ao_re_pilgrims') ? ' The pilgrims are still coming to {home}.' : ''}`,
    choices: [
      { t: "Denounce {themHim} to the bishop's court", r: '{them} goes to the stocks, then out of the realm. Forty churches get a letter, and some of them never forgive you for it.', fx: { honor: 3, piety: 2, them: { op: -40 }, arc: { mark: 'ao_re_denounced' } } },
      { t: 'Buy {theirHis} silence', req: p => p.coin >= 50, r: '{theyHe} takes the money. {theyHe} will not say where your box came from, and nobody will think to ask.', fx: { coin: -50, wil: 1, arc: { mark: 'ao_re_silence' } } },
      { t: 'Leave {themHim} to {theirHis} trade', r: '{theyHe} shrugs. Faith, {theyHe} says, is in the touching, not the bone. You take that home with you and cannot put it down.', fx: { happy: 1, int: 1, arc: { mark: 'ao_re_left' } } },
    ] },
  { id: 'ao_relic_5', title: 'What the relic is', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `The box is ${M(p, 'ao_re_church') ? 'in its niche in the church' : M(p, 'ao_re_kept') ? 'on the shelf over your hearth, where you set it' : 'on the shelf over your hearth'}${M(p, 'ao_re_pilgrims') ? ', and {home} lives on the pilgrims it brings' : ''}. ${M(p, 'ao_re_fake') ? "You know it holds a dog's bone." : 'You know where it was made.'}${M(p, 'ao_re_denounced') ? ' Forty churches know where theirs came from.' : M(p, 'ao_re_silence') ? ' The goldsmith is paid to forget your name.' : M(p, 'ao_re_left') ? ' The goldsmith is still at his trade.' : ''}${M(p, 'ao_re_bribed') ? " The friar's letter still calls yours the true one." : ''} The priest asks you, before the whole parish, what is to be done with it.`,
    choices: [
      { t: 'Say before the parish that it is false', r: p => `The church is silent, then loud.${M(p, 'ao_re_pilgrims') ? ' The pilgrims stop coming, and {home} is poorer for it.' : ''} People begin to tell you things they would tell nobody else.`, fx: { honor: 6, piety: -2, trait: 'honest', flag: 'ao_relic_false', deed: 'Named a false relic before the parish', arc: { go: 'end' } } },
      { t: 'Let the shrine stand. Faith is in the touching', r: 'The candle stays lit in front of the box. Children still get better there, sometimes.', fx: { coin: 30, piety: 2, trait: 'cynical', flag: 'ao_relic_shrine', deed: 'Kept a shrine you knew was false', arc: { go: 'end' } } },
      { t: 'Bury it in the grave of the pilgrim', r: 'You bury it with the pilgrim who carried it. Whatever it was, it goes into the ground with someone who believed in it.', fx: { piety: 3, happy: 2, flag: 'ao_relic_buried', deed: 'Buried a relic with the pilgrim who carried it', arc: { go: 'end' } } },
    ] },

  // ================================================================ the cursed mill (5 stages)
  { id: 'ao_mill_1', title: 'The mill nobody uses', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `The mill below {home} has had three millers in ten years. One drowned in the race, one hanged himself in the loft, and one ran in the night and left his boots. They say the wheel turns by itself after dark. The village grinds by hand and goes short. ${NOBLE(p) ? 'The mill is on your land, and earns you nothing.' : 'The lord would lease it for almost nothing.'}`,
    choices: [
      { t: p => (NOBLE(p) ? 'Put a new miller in it, at your cost' : 'Take the lease, and a miller'), req: p => p.coin >= 20, r: 'The new miller lasts a fortnight. He says the wheel turned in the night with the sluice shut, and nobody in the loft but him.', fx: { coin: -20, arc: { mark: 'ao_mi_lease' } } },
      { t: 'Spend a night in the loft and see', r: 'You sit in the loft with a cudgel and a candle. Some time after midnight, below you, the wheel begins to turn.', fx: { wil: 1, happy: -2, arc: { mark: 'ao_mi_night' } } },
      { t: 'Ask the priest to bless it', r: 'The priest sprinkles the wheel and leaves well before dark. The wheel still turns at night.', fx: { piety: 2, arc: { mark: 'ao_mi_blessed' } } },
    ] },
  { id: 'ao_mill_2', title: 'Ghosts do not need carts', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `${M(p, 'ao_mi_night') ? 'You saw it: the wheel turning, and a lantern down by the sluice.' : M(p, 'ao_mi_lease') ? 'The miller you put in has run, like the others.' : M(p, 'ao_mi_blessed') ? "The priest's blessing held a fortnight. The wheel turned again last night." : 'The wheel turned again last night.'} In the morning there is fresh flour on the stones, and the ruts of a loaded cart in the mud by the race. Ghosts do not need carts.`,
    choices: [
      { t: 'Wait in the reeds and follow the cart', check: { s: 'stealth', s2: 'ins', d: 50 },
        win: { r: p => `The cart goes up the hill by back lanes to the barn of ${stw(p)}, loaded with flour from grain that never paid the tithe.`, fx: { int: 1, arc: { mark: 'ao_mi_saw' } } },
        lose: { r: 'Someone hears you in the reeds. A cudgel finds your head before you see whose arm is behind it.', fx: { wound: 'concussion', arc: { mark: 'ao_mi_hit' } } } },
      { t: 'Tell the whole village about the cart', r: '{home} has three new stories by evening, and only one of them has the devil in it.', fx: { fame: 1, happy: 1, arc: { mark: 'ao_mi_told' } } },
      { t: 'Put a lock on the sluice', r: 'The lock is off by the next morning, neatly, by someone who had the right tools.', fx: { coin: -5, wil: 1, arc: { mark: 'ao_mi_locked' } } },
    ] },
  { id: 'ao_mill_3', title: "The drowned miller's kin", trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { const t = WHO(p, ctx); if (t) ctx.sib = t.sex === 'F' ? 'sister' : 'brother'; },
    text: p => `{them}, the drowned miller's {sib}, comes to you at dusk. The night before he drowned, {theyHe} says, he quarrelled with ${stw(p)} about the sluice. He swam like an otter, and he drowned in three feet of water, and nobody asked how.${M(p, 'ao_mi_saw') ? ' You know where the cart went.' : M(p, 'ao_mi_hit') ? ' The lump on your head agrees with {themHim}.' : M(p, 'ao_mi_told') ? ' The village has the cart from you, and only one story has the devil in it.' : M(p, 'ao_mi_locked') ? ' Your lock came off the sluice in a night, neatly.' : ''}`,
    choices: [
      { t: p => (NOBLE(p) ? "Have your steward's barn opened" : 'Take it to the lord'), check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: p => (NOBLE(p) ? 'You have the barn opened before witnesses. The flour is there, sack on sack, and the steward has gone white.' : "The lord hears you out and has his steward's barn opened. The flour is there, sack on sack."), fx: { honor: 3, them: { op: 20 }, arc: { mark: 'ao_mi_lord' } } },
        lose: { r: p => (NOBLE(p) ? 'The barn is empty, swept, and smells of new lime. Your steward is hurt that you would think it.' : 'The lord hears you out and believes his steward. You are told not to frighten the village with ghost stories.'), fx: { fame: -1, them: { op: 10 }, arc: { mark: 'ao_mi_ignored' } } } },
      { t: 'Go to the steward and ask for a share', r: 'He looks you over, then offers a tenth of the flour money. The curse, it seems, has room for one more.', fx: { coin: 30, honor: -4, arc: { mark: 'ao_mi_share' } } },
      { t: 'Tell {them} to keep quiet, for {theirHis} sake', r: '{theyHe} goes away angry. You notice {theyHe} keeps away from the race after dark, all the same.', fx: { wil: 1, them: { op: -10 }, arc: { mark: 'ao_mi_hush' } } },
    ] },
  { id: 'ao_mill_4', title: 'The mill on fire', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); },
    text: p => `${M(p, 'ao_mi_lord') ? 'The steward was turned off, swearing it was all lies.' : M(p, 'ao_mi_ignored') ? "The steward knows what you said of him, and his two men have been asking where you sleep." : M(p, 'ao_mi_share') ? 'Your tenth of the flour money comes each quarter, and so does {them}, who has guessed.' : M(p, 'ao_mi_hush') ? '{them} has kept quiet, as you asked, and keeps off the race after dark.' : 'The wheel still turns at night.'} Tonight the mill is burning, the loft first, where the tallies would be kept. Someone is shouting down in the race.`,
    choices: [
      { t: 'Go down into the race for whoever it is', check: { s: 'sta', s2: 'wil', d: 50 },
        win: { r: 'You drag a half-drowned boy out of the race. He saw the men with the torches, and he knows their names.', fx: { fame: 3, honor: 2, arc: { mark: 'ao_mi_rescued' } } },
        lose: { r: 'You get the boy out. A burning beam comes down across your back as you climb the bank.', fx: { fame: 2, wound: 'burn', arc: { mark: 'ao_mi_burned' } } } },
      { t: 'Save the millstones and shut the sluice', r: 'You and three neighbours drag the stones clear and drop the sluice. The shouting stops. Someone got out of the race and ran, and you never see the face.', fx: { coin: 15, wil: 1, arc: { mark: 'ao_mi_stones' } } },
      { t: 'Stand back, and watch who watches', r: "You watch the faces in the firelight. Two of the steward's men are there, with soot to the elbow.", fx: { int: 1, ins: 1, arc: { mark: 'ao_mi_watched' } } },
    ] },
  { id: 'ao_mill_5', title: 'The mill stands', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); },
    text: p => `The mill stands, blackened to the wheel.${M(p, 'ao_mi_rescued') || M(p, 'ao_mi_burned') ? ' The boy from the race tells his story to anyone who will stand still.' : M(p, 'ao_mi_watched') ? ' You know whose men lit the fire.' : M(p, 'ao_mi_stones') ? ' The millstones you dragged clear that night are sound.' : ''}${M(p, 'ao_mi_share') ? ' Your share of the flour money has stopped, now the mill is ash.' : ''} Nobody in {home} says curse any more, by daylight. The mill wants a miller, and the steward wants to know what you will say at the assize.`,
    choices: [
      { t: 'Run the mill yourself, and honestly', req: p => p.coin >= 40, r: 'You rebuild the loft, mend the wheel, and grind at the lawful toll. In a year {home} brings you its corn without crossing itself first.', fx: { coin: -40, aoAsset: { k: 'workshop', name: 'The mill below {home}' }, trait: 'honest', flag: 'ao_mill_miller', deed: 'Ran the cursed mill honestly', arc: { go: 'end' } } },
      { t: 'Swear against the steward at the assize', check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: 'The assize hangs the steward for the drowned miller and the fire. {them} comes to the hanging and shakes your hand afterwards, in front of everyone.', fx: { honor: 5, trait: 'brave', them: { type: 'friend', op: 30 }, flag: 'ao_mill_justice', deed: 'Swore a steward to the gallows for a drowned miller', arc: { go: 'end' } } },
        lose: { r: 'The steward has friends on the bench. He walks out of the assize a free man, and he knows your face now.', fx: { honor: 2, trait: 'brave', newRel: { type: 'enemy', op: -50 }, flag: 'ao_mill_enemy', deed: 'Swore against a steward at the assize, and lost', arc: { go: 'end' } } } },
      { t: 'Say nothing, and take his silver', r: 'He pays well, and keeps on paying. The ghost story comes back by winter, and you do not contradict it.', fx: { coin: 80, trait: 'deceitful', flag: 'ao_mill_curse', deed: 'Took silver to keep a mill cursed', arc: { go: 'end' } } },
    ] },

  // ================================================================ the stolen horse (4 stages)
  { id: 'ao_horse_1', title: 'An empty stall', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WORD(p, ctx, 'horse', () => HORSE[p.gear && p.gear.mount] || 'your grey mare'); WORD(p, ctx, 'mk', () => (p.gear && GD.GEAR[p.gear.mount] ? p.gear.mount : 'horse')); },
    text: "At dawn the stall is empty and the halter cut. {horse} is gone. There are prints in the mud toward the drove road, a man's and a horse's, and a long night's start on you. The great fair at {capital} is in a week. In {realmShort} they hang horse thieves, when they catch them.",
    choices: [
      { t: 'Ride after them on a borrowed nag', check: { s: 'riding', s2: 'ins', d: 50 },
        win: { r: 'You follow the prints to the drove road, and the drove road to a barn where the trail turns to mud. But you know which way it was heading.', fx: { gear: { mount: null }, sta: 1, arc: { mark: 'ao_ho_trail' } } },
        lose: { r: 'The borrowed nag goes lame by noon. You walk it home and pay its owner for the shoe.', fx: { gear: { mount: null }, coin: -3, happy: -2, arc: { mark: 'ao_ho_lame' } } } },
      { t: 'Report it to the reeve', r: 'The reeve writes it down very slowly, with a description, and promises to send word to the fair.', fx: { gear: { mount: null }, honor: 1, arc: { mark: 'ao_ho_reeve' } } },
      { t: 'Buy another and be done with it', req: p => p.coin >= 40, r: 'You buy a sound bay from a neighbour, and try not to look at the empty peg where the old halter hung.', fx: { gear: { mount: 'horse' }, coin: -40, happy: 1, arc: { mark: 'ao_ho_bought' } } },
    ] },
  { id: 'ao_horse_2', title: 'At the horse fair', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); WORD(p, ctx, 'horse', () => 'your grey mare'); },
    text: p => `At the fair in {capital}, among four hundred beasts, you see {horse}${M(p, 'ao_ho_bought') ? ', which you had nearly stopped thinking about' : ''}. The mane is hogged, the brand is new, and the price is low. The seller is {them}, in soldier's boots, with a cough, who has not seen you yet.${M(p, 'ao_ho_reeve') ? " The reeve's word never reached the fair." : M(p, 'ao_ho_trail') ? ' The drove road pointed this way, and you were right.' : M(p, 'ao_ho_lame') ? ' You gave up the chase at noon, on a lame borrowed nag.' : ''}`,
    choices: [
      { t: 'Seize the halter and shout thief', check: { s: 'intimidation', s2: 'str', d: 50 },
        win: { r: 'The crowd closes round. {them} does not even try to run, and the fair-wardens take {themHim} in charge.', fx: { honor: 2, them: { op: -20 }, arc: { mark: 'ao_ho_caught' } } },
        lose: { r: 'Two of {theirHis} friends put you in the dung, and by the time you are up, {them} and the horse are gone.', fx: { health: -10, wound: 'broken_nose', arc: { mark: 'ao_ho_beaten' } } } },
      { t: 'Buy it back without a word', req: p => p.coin >= 40, r: '{them} counts your money twice and never once meets your eye. You lead your own horse home at a walk.', fx: { coin: -40, aoMount: 1, arc: { mark: 'ao_ho_rebought' } } },
      { t: 'Follow {themHim} home from the fair', r: '{theyHe} goes to a hovel outside the walls where a woman coughs worse than {theyHe} does. Three children. No other horse, and no food you can see.', fx: { ins: 1, happy: -1, arc: { mark: 'ao_ho_followed' } } },
    ] },
  { id: 'ao_horse_3', title: 'The thief', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); },
    text: p => `${M(p, 'ao_ho_caught') ? "{them} is in the fair-wardens' cellar, and the warden says the owner's word decides between the rope and the brand." : M(p, 'ao_ho_beaten') ? '{them} turns up in {home}, sober and thinner, leading your horse on a rope. {theyHe} has come to settle it.' : M(p, 'ao_ho_rebought') ? '{them} turns up in {home} a month later looking for work, and does not know you at first.' : M(p, 'ao_ho_followed') ? '{them} sees you in the hovel door and knows you. {theyHe} does not run. There is nowhere to run, with three children.' : '{them} is pointed out to you in {home}, and does not run.'} {theyHe} was a soldier once, and the company never paid {themHim} off.`,
    choices: [
      { t: 'Hand {themHim} to the law', r: 'The assize sits within the month. You go, because the owner must.', fx: { wil: 1, happy: -3, arc: { mark: 'ao_ho_law' } } },
      { t: 'Let {themHim} work off the horse', r: '{theyHe} works your ground a year without wages, and better than you would have guessed.', fx: { coin: 20, them: { op: 25 }, arc: { mark: 'ao_ho_work' } } },
      { t: 'Let {themHim} go, with the price of bread', req: p => p.coin >= 20, r: '{theyHe} takes the money as if it burns. The children eat that week, and so does {theyHe}.', fx: { coin: -20, honor: 3, them: { op: 30 }, arc: { mark: 'ao_ho_freed' } } },
    ] },
  { id: 'ao_horse_4', title: 'The horse and the thief', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); WORD(p, ctx, 'horse', () => 'your grey mare'); },
    text: p => (M(p, 'ao_ho_law')
      ? `The assize sentences {them} to hang at the crossroads${M(p, 'ao_ho_rebought') ? ', and does not give you back what you paid for your own horse' : ', and gives you back {horse} in the same breath'}. The rope is ready for the morning, and {theirHis} children are in the crowd. The sheriff says the owner may still ask for mercy, though few do.`
      : `${M(p, 'ao_ho_work') ? '{them} has worked off the horse and stayed on.' : M(p, 'ao_ho_freed') ? '{them} has come back, the price of that bread worked off in another man\'s field.' : '{them} has come back with work in hand, and something to say.'} {theyHe} knows horses better than anyone in {home}, and gentles {horse} with a word. {theyHe} asks whether there is a place for {themHim} with you.`),
    choices: [
      { t: 'Let the rope do its work', req: p => M(p, 'ao_ho_law'), r: 'You watch, because the owner must. {horse} comes home with you, and you never ride it past that crossroads again.', fx: { aoKill: 'hanged for horse theft', aoMount: 1, trait: 'stubborn', flag: 'ao_horse_hanged', deed: 'Saw a horse thief hanged', arc: { go: 'end' } } },
      { t: 'Ask for mercy, in front of everyone', req: p => M(p, 'ao_ho_law'), r: 'The sheriff grumbles and calls for the iron instead. {them} is branded on the hand and goes home to {theirHis} children, and does not look at you.', fx: { aoMount: 1, honor: 3, them: { op: 30 }, flag: 'ao_horse_mercy', deed: 'Begged a horse thief off the rope', arc: { go: 'end' } } },
      { t: 'Take {themHim} on as your groom', req: p => !M(p, 'ao_ho_law'), r: '{theyHe} sleeps over the stable and keeps it better than you ever did. Nobody steals from you again, which may not be a coincidence.', fx: { aoMount: 1, them: { type: 'friend', op: 40 }, flag: 'ao_horse_groom', deed: 'Took a horse thief on as your groom', arc: { go: 'end' } } },
      { t: 'Give {themHim} the horse, and part friends', req: p => !M(p, 'ao_ho_law'), r: '{them} rides off on your horse with your blessing, which is a thing you will explain to people for years.', fx: { aoMount: -1, honor: 4, them: { type: 'friend', op: 50 }, flag: 'ao_horse_given', deed: 'Gave your stolen horse to the thief', arc: { go: 'end' } } },
    ] },

  // ================================================================ the face in the gallery (4 stages, 6-15 years)
  { id: 'ao_portrait_1', title: 'Your face on a wall', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { PH(p, ctx); },
    text: 'Kept waiting in the long gallery at {seat}, the seat of {house}, you find yourself before a portrait of a young woman in the clothes of your grandmother\'s day. The face is yours: the nose, the set of the mouth, the way of standing. An old servant passing with a tray stops, looks from the painting to you, and only just keeps hold of the tray.',
    choices: [
      { t: 'Ask the servant who she was', r: "The lord's aunt, the servant whispers. She ran off with a groom at eighteen and was struck out of the family book. Then the servant hurries away.", fx: { int: 1, arc: { mark: 'ao_po_asked' } } },
      { t: 'Say nothing, and see to your business', r: 'You see to your business. On the road home you find you are touching your own face.', fx: { wil: 1, arc: { mark: 'ao_po_quiet' } } },
      { t: 'Offer the steward money for the painting', req: p => p.coin >= 30, r: 'The steward is puzzled, and glad of the money: nobody looks at that one. It comes home with you in a cart, under sacking.', fx: { coin: -30, happy: 2, arc: { mark: 'ao_po_bought' } } },
    ] },
  { id: 'ao_portrait_2', title: 'Who your grandmother was', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { PH(p, ctx); },
    text: p => `${M(p, 'ao_po_asked') ? "A lord's aunt, and a groom." : M(p, 'ao_po_bought') ? 'The portrait hangs in your house now, and visitors look from it to you and back.' : M(p, 'ao_po_quiet') ? 'You said nothing and went about your business, and the face came home with you.' : 'You cannot put the face out of your mind.'} Your father's mother never said where she came from, only that she had married beneath her, which everyone took for a joke. ${fatherAlive(p) ? 'Your father might know more.' : 'The parish book might know more.'}`,
    choices: [
      { t: p => (fatherAlive(p) ? 'Ask your father, plainly' : 'Ask the oldest of your kin'), r: 'It comes out slowly, over an evening: a ring she would not sell even in the famine year, kept at the bottom of a chest. The chest is in your loft.', fx: { happy: 2, arc: { mark: 'ao_po_ring' } } },
      { t: 'Search the parish book', r: 'The book has her marriage to a groom, and her own name scratched out and written over in another hand. Under the scratching you can still read {house}.', fx: { coin: -5, int: 1, arc: { mark: 'ao_po_book' } } },
      { t: 'Let it lie', r: 'You let it lie. It does not lie quietly.', fx: { wil: 1, happy: 1, arc: { mark: 'ao_po_let' } } },
    ] },
  { id: 'ao_portrait_3', title: 'The cold room', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => {
      const h = PH(p, ctx), a = A.AO.arc(p, ctx), head = h && h.headPid ? A.P(h.headPid) : null;
      const ok = head && head.alive && head.id !== p.id;
      if (a && !a.pid && ok) a.pid = head.id;
      if (!a && ok) { ctx.pid = head.id; return; }
      WHO(p, ctx, { status: 'noble', sur: h && h.name ? String(h.name).replace(/^House\s+/, '') : '' });
    },
    text: p => `${M(p, 'ao_po_let') ? 'You let it lie. It did not let you. ' : ''}{them} of {house} has heard there is someone in {home} with the face from the gallery, and sends for you. ${M(p, 'ao_po_ring') ? "Your grandmother's ring is in your pocket, with the arms of {house} on the bezel." : M(p, 'ao_po_book') ? 'You bring a copy of the scratched page.' : 'You go with nothing in your hands but your face.'} {theyHe} receives you standing, in a cold room, with a lawyer at {theirHis} elbow.`,
    choices: [
      { t: 'Show what you have, and say who you are', check: { s: 'etiquette', s2: 'wil', d: 50 },
        win: { r: '{them} turns what you brought over twice. Then {theyHe} sends the lawyer out, and calls for wine.', fx: { happy: 3, them: { op: 20 }, arc: { mark: 'ao_po_owned' } } },
        lose: { r: '{them} calls you a chancer with a lucky face and has you shown out by the kitchen door.', fx: { happy: -3, them: { op: -20 }, arc: { mark: 'ao_po_spurned' } } } },
      { t: 'Say you want nothing from {themHim}', r: '{theyHe} does not believe you, at first. By the end of the hour {theyHe} does, a little.', fx: { honor: 3, them: { op: 10 }, arc: { mark: 'ao_po_nothing' } } },
      { t: 'Ask what your going away is worth', r: 'The lawyer names a sum before {them} can speak. It is a fair sum, for a face.', fx: { coin: 40, honor: -3, arc: { mark: 'ao_po_price' } } },
    ] },
  { id: 'ao_portrait_4', title: 'The family book', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { PH(p, ctx); WHO(p, ctx); },
    text: p => (M(p, 'ao_po_owned') ? "{them} offers to write your grandmother's name back into the family book of {house}, and yours under it. The cousins are not pleased, and say so at dinner."
      : M(p, 'ao_po_nothing') ? 'A stiff letter comes from {them}, in {theirHis} own hand: there is a place for you at {seat} at the midwinter feast, and in the family book, if you want it.'
      : M(p, 'ao_po_spurned') ? 'A letter comes from the lawyer of {house}. The family will not own you, but it would pay for your silence, and for anything of your grandmother\'s you hold.'
      : 'The money is spent. The face is still yours, and people in {home} have started to talk about it, and so has the lawyer of {house}, who writes again.'),
    choices: [
      { t: 'Take your place in the family book', req: p => M(p, 'ao_po_owned') || M(p, 'ao_po_nothing'), r: 'Your name goes into the book under hers, in new ink. At the feast a cousin you never met raises a cup to you, and means it.', fx: { them: { type: 'cousin', op: 30 }, fame: 3, flag: 'ao_portrait_kin', deed: 'Was written into the family book of a great house', arc: { go: 'end' } } },
      { t: 'Sell them your silence, and the past', req: p => M(p, 'ao_po_spurned') || M(p, 'ao_po_price'), r: 'You sign a paper you do not read twice. The past goes into the lawyer\'s satchel, and the money goes into yours.', fx: { coin: 60, flag: 'ao_portrait_sold', deed: 'Sold a great house your silence', arc: { go: 'end' } } },
      { t: 'Keep the secret, and the face', r: 'You say nothing to anyone. Sometimes, at a fair, you see a stranger with your nose, and nod.', fx: { secret: 1, happy: 2, flag: 'ao_portrait_secret', deed: 'Kept the secret of your own blood', arc: { go: 'end' } } },
      { t: 'Stand on your own name, not theirs', r: 'You write back that you have a name already, and sign it large. It is the best letter you ever wrote.', fx: { wil: 1, trait: 'proud', flag: 'ao_portrait_own', deed: 'Refused the name of a great house', arc: { go: 'end' } } },
    ] },

  // ================================================================ the Patience: a missing ship (5 stages)
  { id: 'ao_ship_1', title: 'A share in the Patience', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); },
    text: 'The cog Patience is fitting out for the south with a hold of wool, and her owners are selling sixteenths to pay for the voyage. A sixteenth costs eighty and should come back doubled in a year, if she comes back. Her master, {them}, has sailed the run nine times. Half of {home} is buying in.',
    choices: [
      { t: 'Buy a sixteenth', req: p => p.coin >= 80, r: "You put your mark in the owners' book. The Patience sails on a fair wind, with flags, and you watch her out of sight.", fx: { coin: -80, happy: 3, arc: { mark: 'ao_sh_share' } } },
      { t: 'Buy a sixty-fourth, and sleep at night', r: 'Twenty buys a sixty-fourth, or all you have buys a little less. A plank and a half, the clerk says. You own a plank and a half of her.', fx: { coin: -20, happy: 1, arc: { mark: 'ao_sh_small' } } },
      { t: 'Keep out, and watch who buys', r: 'You keep your money. The man who buys most is a stranger from {capital}, which you note.', fx: { ins: 1, arc: { mark: 'ao_sh_none' } } },
    ] },
  { id: 'ao_ship_2', title: 'Overdue', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); },
    text: p => `The Patience is three months overdue. On the quays they say storm, or corsairs, or the bottom of the sea. A man from {capital} is buying shares in her at a tenth of their price, and buying a great many.${M(p, 'ao_sh_none') ? ' The owners, who know you kept out, ask you to look into it, for a part of whatever is saved.' : ''}`,
    choices: [
      { t: 'Sell your share to the man from {capital}', req: p => M(p, 'ao_sh_share') || M(p, 'ao_sh_small'), r: 'He pays a tenth in good coin, and writes your name off the book with a flourish.', fx: { coin: 8, arc: { mark: 'ao_sh_soldout' } } },
      { t: 'Pay for letters to the southern ports', r: 'A clerk writes to six harbourmasters in three tongues. It will be a season before any answer.', fx: { coin: -10, int: 1, arc: { mark: 'ao_sh_letters' } } },
      { t: 'Find out who the man from {capital} is', r: "He is {them}'s brother-in-law, it turns out, and has never bought a share in anything before.", fx: { ins: 1, arc: { mark: 'ao_sh_buyer' } } },
      { t: 'Light a candle for her, and wait', r: 'You light the candle. Half of {home} lights one too, and the church smells of tallow for a month.', fx: { piety: 2, arc: { mark: 'ao_sh_wait' } } },
    ] },
  { id: 'ao_ship_3', title: 'A sailor with southern silver', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); },
    text: p => `A sailor off the Patience turns up in {home} with southern silver in his purse and no ship. Drunk, he says she never sank. {them} ran her into a southern port, sold the wool, bought the crew's silence and changed her name.${M(p, 'ao_sh_buyer') ? ' You know already who has been buying her shares.' : ''}${M(p, 'ao_sh_letters') ? ' Your letters have come back from every port but one.' : ''}${M(p, 'ao_sh_soldout') ? ' You sold your share for a tenth.' : M(p, 'ao_sh_wait') ? ' Your candle for her is still burning in the church.' : ''}`,
    choices: [
      { t: 'Pay him for the name of the port', r: 'He names the port, and the name she sails under now: the Fortune. He spends your money before dark.', fx: { coin: -15, ins: 1, arc: { mark: 'ao_sh_port' } } },
      { t: 'Take him before the owners', r: 'The owners hear him out. Three days later he is pulled from the river, and nobody saw anything.', fx: { honor: 2, happy: -2, arc: { mark: 'ao_sh_witness' } } },
      { t: 'Buy up the cheap shares yourself', req: p => p.coin >= 50, r: 'The man from {capital} sells, puzzled, and the widows on the quay sell gladly. You own a quarter of a ship nobody can find.', fx: { coin: -50, wil: 1, arc: { mark: 'ao_sh_bought' } } },
    ] },
  { id: 'ao_ship_4', title: 'The Fortune', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); },
    text: p => `${M(p, 'ao_sh_witness') ? 'The owners pay your passage south.' : 'You take passage south.'} In the port lies a cog called the Fortune, with new paint on old timbers and a patch in the mainsail you would know anywhere.${M(p, 'ao_sh_port') ? " The sailor's directions were exact." : ''} {them} is ashore, prosperous, under another name. The harbour court here is slow, foreign and for sale.`,
    choices: [
      { t: 'Bring a suit in the harbour court', check: { s: 'persuasion', s2: 'int', d: 55 },
        win: { r: 'The court seizes the Fortune while it thinks. It thinks for a month, and finds for the owners of the Patience.', fx: { coin: -20, arc: { mark: 'ao_sh_seized' } } },
        lose: { r: '{them} has friends who dine with the judges. The court finds for {themHim}, and charges you for its time.', fx: { coin: -20, happy: -3, arc: { mark: 'ao_sh_lostsuit' } } } },
      { t: 'Go to {them} alone, and listen', r: '{theyHe} is not ashamed. {theyHe} offers you a purse heavy enough to forget a great deal with, and gives you a week to think.', fx: { ins: 1, arc: { mark: 'ao_sh_offer' } } },
      { t: 'Hire men to cut her out at night', check: { s: 'intrigue', s2: 'str', d: 55 },
        win: { r: 'Your men take her on the night tide with half a crew and no lights. By dawn she is out of sight of land.', fx: { honor: -1, arc: { mark: 'ao_sh_taken' } } },
        lose: { r: 'The watch is awake. You get away over the rooftops. Two of your men do not.', fx: { health: -10, arc: { mark: 'ao_sh_fled' } } } },
    ] },
  { id: 'ao_ship_5', title: 'What the voyage paid', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); },
    text: p => (M(p, 'ao_sh_seized') || M(p, 'ao_sh_taken')
      ? `The Patience is home under her own name, with a hold of southern wine. The owners meet to share what is left${M(p, 'ao_sh_bought') ? ', and a quarter of it is yours by right' : ''}, and agree you have earned a finder's part. {them} is in a southern prison, or out of it by now.`
      : `You are home without the Patience. {them} sails the Fortune north and south as if nothing had happened, and has sent a purse after you, with a letter that says only: for your trouble.${M(p, 'ao_sh_lostsuit') ? ' The harbour court found for {themHim}, and charged you for its time.' : M(p, 'ao_sh_fled') ? ' Two of your men are still in that port, or under it.' : M(p, 'ao_sh_offer') ? ' It is the purse {theyHe} offered you to your face.' : ''} The owners want to know what you will tell them.`),
    choices: [
      { t: "Take your finder's part in silver", req: p => M(p, 'ao_sh_seized') || M(p, 'ao_sh_taken'), r: p => (M(p, 'ao_sh_bought') ? 'Your quarter and your finder\'s part come to more silver than you have seen in one place. Half of {home} wants to borrow some.' : "Your finder's part comes in a leather bag. Half of {home} wants to borrow some."), fx: { coin: 250, fame: 3, flag: 'ao_ship_home', deed: 'Brought the lost cog Patience home', arc: { go: 'end' } } },
      { t: "Take the master's house in {home} instead", req: p => M(p, 'ao_sh_seized') || M(p, 'ao_sh_taken'), r: "The owners give you {them}'s fine house, which the court has taken. You sleep in a thief's bed, and sleep well.", fx: { aoAsset: { k: 'townhouse', name: "The master's house" }, flag: 'ao_ship_house', deed: "Took a thieving master's house for a lost ship", arc: { go: 'end' } } },
      { t: 'Keep the purse, and tell them she sank', req: p => !(M(p, 'ao_sh_seized') || M(p, 'ao_sh_taken')), r: 'You tell them she sank with all hands. The widows weep. The purse is heavy, and stays heavy a long time.', fx: { coin: 150, trait: 'greedy', flag: 'ao_ship_bribed', deed: 'Took a purse to say a ship had sunk', arc: { go: 'end' } } },
      { t: 'Send the purse back, and tell them all of it', req: p => !(M(p, 'ao_sh_seized') || M(p, 'ao_sh_taken')), r: "You tell the owners everything and send the purse south again, empty but for your answer. {them}'s name is spat on every quay on the coast.", fx: { honor: 4, fame: 2, them: { type: 'enemy', op: -40 }, flag: 'ao_ship_told', deed: 'Named the master who stole the Patience', arc: { go: 'end' } } },
    ] },

  // ================================================================ a song about you (3 stages)
  { id: 'ao_song_1', title: 'A song with your name in it', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => {
      WHO(p, ctx);
      // the loudest thing these arcs have left in this life, in order; a soldier's muster or a goose if they left nothing
      SONG(p, ctx, A.C.flag(p, 'ao_kestrel') ? 0 : A.C.flag(p, 'ao_mill_justice') ? 1 : A.C.flag(p, 'ao_bridge_name') ? 2
        : A.C.flag(p, 'ao_relic_false') ? 3 : A.C.flag(p, 'ao_horse_groom') ? 4 : A.C.flag(p, 'ao_ship_home') ? 5
        : A.C.flag(p, 'ao_bell_name') ? 6 : A.C.flag(p, 'ao_ruin_stone') ? 7 : A.C.soldier(p) ? 8 : 9);
    },
    text: '{them}, a minstrel with a cracked lute and a good voice, has made a song about you. It is about {subj}. It has a tune that sticks and a chorus with your name in it, and half of it is not true. Children sing it in the lanes of {home}, and stop when they see you coming.',
    choices: [
      { t: 'Pay {themHim} to change the verses', req: p => p.coin >= 15, r: '{theyHe} takes the money and makes you braver, taller and a great deal duller.', fx: { coin: -15, arc: { mark: 'ao_so_paid' } } },
      { t: 'Laugh, and stand {themHim} a drink', r: 'You laugh louder than anyone at the worst verse. It is the right thing to do, and harder than it looks.', fx: { happy: 3, them: { op: 15 }, arc: { mark: 'ao_so_laughed' } } },
      { t: 'Tell {themHim} to sing it somewhere else', r: '{theyHe} sings it somewhere else: everywhere else.', fx: { wil: 1, them: { op: -20 }, arc: { mark: 'ao_so_banned' } } },
    ] },
  { id: 'ao_song_2', title: 'The song travels', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); SONG(p, ctx); },
    text: p => `The song has gone to {far}, ${M(p, 'ao_so_paid') ? 'though only its old verses; nobody sings the ones you paid for' : 'with two new verses you have not heard'}. A carter three days from {home} hums the chorus at you without knowing whose it is.${M(p, 'ao_so_banned') ? ' One verse is now about how you tried to stop it.' : M(p, 'ao_so_laughed') ? ' The verse you laughed loudest at is the one they all sing.' : ''} {them} is back, and wants the real story for a last verse.`,
    choices: [
      { t: 'Tell {themHim} the real story', r: 'You tell it plain, including the parts you come out of badly. {them} is delighted with those parts.', fx: { happy: 2, honor: 1, arc: { mark: 'ao_so_true' } } },
      { t: 'Tell {themHim} a better one', r: '{theyHe} writes it down and asks no questions, which is how you know {theyHe} knows.', fx: { fame: 2, honor: -2, arc: { mark: 'ao_so_lie' } } },
      { t: 'Refuse, and let it be what it is', r: '{theyHe} shrugs and makes up an ending. It is not a bad one.', fx: { wil: 1, arc: { mark: 'ao_so_refused' } } },
    ] },
  { id: 'ao_song_3', title: 'The last verse', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); SONG(p, ctx); },
    text: p => `On the feast day {them} sings the whole song in {home}, ${M(p, 'ao_so_true') ? 'with the true story in the last verse' : M(p, 'ao_so_lie') ? 'with your better story in the last verse' : M(p, 'ao_so_refused') ? 'with the ending {theyHe} made up when you would not give one' : 'with an ending of {theirHis} own'}. All {home} is there, and joins the chorus. When it ends, someone at the back shouts a name for you, {ep}, and it catches.`,
    choices: [
      { t: 'Answer to the name', r: 'You raise your cup to it. By the next market, nobody in {home} calls you anything else.', fx: { aoEpithet: 1, fame: 4, flag: 'ao_song_name', deed: 'Was given a name by a song', arc: { go: 'end' } } },
      { t: 'Pay {themHim} to sing it in {far}', req: p => p.coin >= 30, r: '{them} sings it in {far} all winter, in better company than yours. Strangers there know your name before your face.', fx: { coin: -30, fame: 6, flag: 'ao_song_capital', deed: 'Paid for your song to be sung in the capital', arc: { go: 'end' } } },
      { t: 'Buy the song outright, so it dies with you', req: p => p.coin >= 40, r: '{them} sells it, and swears on the lute never to sing it again. In a year only the children remember the chorus.', fx: { coin: -40, trait: 'proud', flag: 'ao_song_bought', deed: 'Bought a song about yourself, to silence it', arc: { go: 'end' } } },
      { t: 'Give {them} a place at your fire', r: '{them} comes for a night and stays for the winter, and every winter after. The song gets longer.', fx: { happy: 3, them: { type: 'friend', op: 40 }, flag: 'ao_song_friend', deed: 'Kept a minstrel as a friend', arc: { go: 'end' } } },
    ] },

  // ================================================================ the pot of old silver (4 stages)
  { id: 'ao_hoard_1', title: 'The pot of old silver', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `Digging ${NOBLE(p) ? 'a new drain below the stables' : 'a new pit behind the house'}, your spade breaks a pot packed with silver: old coins, black with age, with a king's head nobody in {home} could name. Some hundreds, at a guess. By the law of {realmShort}, treasure in the ground is the crown's, and a finder who tells gets a reward. A finder who does not tell gets a rope, if it comes out.`,
    choices: [
      { t: p => `Report it to ${reeve(p)}`, r: 'It is counted twice and written up for {capital}. Your reward will come when the crown\'s assessor does.', fx: { honor: 3, arc: { mark: 'ao_hd_told' } } },
      { t: 'Rebury it and tell no one', r: 'You put it back under a flat stone and plant beans over it. You find you check on the beans a great deal.', fx: { wil: 1, arc: { mark: 'ao_hd_hid' } } },
      { t: 'Tell your family, and swear them to it', r: 'You show them by candlelight. They swear. One of them is eight, and you watch that one closely.', fx: { happy: 3, arc: { mark: 'ao_hd_family' } } },
    ] },
  { id: 'ao_hoard_2', title: 'Old silver is hard to spend', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => (M(p, 'ao_hd_told')
      ? "The crown's assessor comes from {capital}, counts the hoard, and finds it a third lighter than the first count said. He looks at the reeve. The reeve looks at you."
      : `${M(p, 'ao_hd_hid') ? 'The pot is under a flat stone in the bean bed. ' : M(p, 'ao_hd_family') ? 'Your own know, down to the eight-year-old. ' : ''}Old silver is hard to spend. The moneychanger in {capital} turns your first coin over and over, and asks where you found a king that old.`),
    choices: [
      { t: 'Tell the assessor who has the missing third', req: p => M(p, 'ao_hd_told'), r: 'The assessor writes it down and pays your reward. The reeve is turned out by spring, and knows exactly whose word did it.', fx: { coin: 20, honor: 2, arc: { mark: 'ao_hd_accused' } } },
      { t: 'Say the first count was a mistake', req: p => M(p, 'ao_hd_told'), r: 'The assessor shrugs and pays your reward. The reeve stands you a drink, and later another.', fx: { coin: 30, honor: -2, arc: { mark: 'ao_hd_covered' } } },
      { t: 'Have it melted down, at a loss', req: p => !M(p, 'ao_hd_told'), r: 'A smith in {capital} melts it for a third of the weight and asks nothing. You come home with plain silver, and less of it.', fx: { coin: 60, arc: { mark: 'ao_hd_melted' } } },
      { t: 'Spend it a coin at a time', req: p => !M(p, 'ao_hd_told'), check: { s: 'deception', s2: 'ins', d: 50 },
        win: { r: 'A coin at a time, in different towns, with different stories. Nobody asks twice.', fx: { coin: 50, arc: { mark: 'ao_hd_slow' } } },
        lose: { r: 'The moneychanger writes your name in a book. You watch him do it.', fx: { coin: 10, arc: { mark: 'ao_hd_noticed' } } } },
    ] },
  { id: 'ao_hoard_3', title: 'Someone knows', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); },
    text: p => (M(p, 'ao_hd_accused') ? '{them}, your neighbour and cousin to the old reeve, has started asking loudly how much of the hoard you kept back. {theyHe} wants a share of it, or {theyHe} will swear you did.'
      : M(p, 'ao_hd_covered') ? '{them}, your neighbour, has noticed the reeve buying you drinks, and wants to know why, and wants a share of whatever the reason is.'
      : `{them}, your neighbour, saw you digging under the beans by moonlight${M(p, 'ao_hd_noticed') ? ', and the moneychanger has been asking about you in {home}' : ''}. {theyHe} wants a third, or {theyHe} goes to the reeve.`),
    choices: [
      { t: 'Pay {themHim} off', req: p => p.coin >= 30, r: '{theyHe} takes it. {theyHe} will be back; that kind always is.', fx: { coin: -30, arc: { mark: 'ao_hd_paid' } } },
      { t: 'Call {theirHis} bluff', check: { s: 'intimidation', s2: 'wil', d: 50 },
        win: { r: '{theyHe} backs down, red to the ears, and does not speak to you again for a year.', fx: { wil: 1, them: { op: -30 }, arc: { mark: 'ao_hd_bluff' } } },
        lose: { r: '{theyHe} goes to the reeve that same afternoon, and the reeve comes with men and spades.', fx: { coin: -20, them: { op: -30 }, arc: { mark: 'ao_hd_exposed' } } } },
      { t: p => (M(p, 'ao_hd_told') ? 'Take {themHim} before the reeve yourself' : 'Go to the reeve before {theyHe} can'), r: p => (M(p, 'ao_hd_told') ? 'You turn out your purse in front of the reeve. {them} is fined for a false tongue, and you for the trouble of the court.' : 'You go and tell it, all of it. The fine is heavy and the silver is gone, but you sleep that night.'), fx: { honor: 3, coin: -10, arc: { mark: 'ao_hd_confessed' } } },
    ] },
  { id: 'ao_hoard_4', title: 'What the silver bought', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); },
    text: p => (M(p, 'ao_hd_told') ? "The crown has its silver and you have had your reward. You kept one coin back, with a dead king's face, and nobody has missed it."
      : M(p, 'ao_hd_exposed') || M(p, 'ao_hd_confessed') ? "The crown has the silver, and a fine, and the priest has praised your honesty from the pulpit, which is worse. All that is left is one coin you kept back, with a dead king's face."
      : `What is left of the old silver is ${M(p, 'ao_hd_melted') ? 'plain bars under the floor' : M(p, 'ao_hd_slow') ? 'going out a coin at a time, in towns where nobody knows you' : 'still in the bean bed'}. It is enough to change a life, if you are careful how.${M(p, 'ao_hd_paid') ? ' {them} is still watching.' : M(p, 'ao_hd_bluff') ? ' {them} has not spoken to you since you faced {themHim} down.' : ''}`),
    choices: [
      { t: 'Buy land with it, openly', req: p => !(M(p, 'ao_hd_told') || M(p, 'ao_hd_exposed') || M(p, 'ao_hd_confessed')), r: 'You buy a farm from a widow who asks no questions about where a person like you found the money. The answer is: in the ground.', fx: { aoAsset: { k: 'farm', name: 'The farm the silver bought' }, flag: 'ao_hoard_land', deed: 'Bought land with buried silver', arc: { go: 'end' } } },
      { t: 'Bury it again, for your children', req: p => !(M(p, 'ao_hd_told') || M(p, 'ao_hd_exposed') || M(p, 'ao_hd_confessed')), r: 'You bury it deeper, somewhere new, and tell one person where. The beans grow over it as if nothing were there.', fx: { family: 200, secret: 1, flag: 'ao_hoard_buried', deed: 'Buried a pot of silver for your heirs', arc: { go: 'end' } } },
      { t: 'Give a share to the church', r: p => (M(p, 'ao_hd_told') || M(p, 'ao_hd_exposed') || M(p, 'ao_hd_confessed') ? 'You give the last coin to the poor-box. The priest knows what it is, and says a mass for the dead king, whoever he was.' : 'You give a tenth to the church and keep the rest. The priest knows exactly what it is, and says nothing, and prays for you.'), fx: { coin: 20, piety: 4, trait: 'generous', flag: 'ao_hoard_church', deed: 'Gave buried silver to the church', arc: { go: 'end' } } },
      { t: 'Wear one coin on a cord, for luck', r: 'You bore a hole through the dead king and hang him round your neck. When things go badly you hold him, and things go on.', fx: { wil: 1, happy: 2, flag: 'ao_hoard_coin', deed: 'Wore a coin of a buried hoard for luck', arc: { go: 'end' } } },
    ] },

  // ================================================================ the book in the common tongue (4 stages)
  { id: 'ao_book_1', title: 'A book under the straw', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); },
    text: p => `{them}, a friar running from the bishop's men, begs a night in your ${NOBLE(p) ? 'stables' : 'barn'} and is gone before dawn. Under the straw {theyHe} leaves a bundle: a holy book, copied out in the common speech of {realmShort} instead of the temple tongue. The bishop burns such books. He has burned the people who copy them.${p.literate ? '' : ' You cannot read it, but you know what it is.'}`,
    choices: [
      { t: 'Hide it in the thatch', r: 'It goes up into the thatch in oilcloth. You lie awake under it, listening for horses.', fx: { wil: 1, arc: { mark: 'ao_bk_hid' } } },
      { t: 'Take it to the priest', r: 'The priest turns white, and then turns pages, slowly, until the candle is out.', fx: { piety: 3, arc: { mark: 'ao_bk_priest' } } },
      { t: p => (p.literate ? 'Read it, by a shaded candle' : 'Find someone to read it to you'), r: 'It is the same faith you were raised in. You understand it for the first time, and that frightens you more than the bishop does.', fx: { int: 1, piety: 1, arc: { mark: 'ao_bk_read' } } },
    ] },
  { id: 'ao_book_2', title: 'Readers by night', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => (M(p, 'ao_bk_priest')
      ? 'The priest did not burn the book. He read it, and now he preaches in words people understand, and a few of them meet in the vestry at night to hear more. He wants you there, since you brought it.'
      : `${M(p, 'ao_bk_read') ? 'You know now what is in it. ' : ''}Word gets round, the way it does. Neighbours come at night to hear the book read in words they understand: a carter, two widows, the smith\'s son. They sit on your floor with the shutters closed and a boy on the step.`),
    choices: [
      { t: 'Read with them, and let them read', r: 'They come back every week, and bring others. Some of them can make out letters now. One is a girl who cannot keep a secret.', fx: { piety: 2, fame: 1, arc: { mark: 'ao_bk_readers' } } },
      { t: 'Send them away, for their own sakes', r: 'They go, and do not come back, and greet you a little less warmly at market.', fx: { wil: 1, happy: -2, arc: { mark: 'ao_bk_sent' } } },
      { t: 'Copy it out, so it cannot all be lost', req: p => !!p.literate, r: 'It takes the winter and most of your candles. Your hand is worse than the friar\'s, but every word is there.', fx: { skill: { learning: 2 }, arc: { mark: 'ao_bk_copied' } } },
    ] },
  { id: 'ao_book_3', title: "The bishop's searchers", trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `The bishop's searchers come to {home} with a list and a cart. They turn out chests, lift floorboards, and go through the thatch with hooks.${M(p, 'ao_bk_hid') ? ' Your book is up in that thatch, in oilcloth.' : ''}${M(p, 'ao_bk_readers') ? (M(p, 'ao_bk_priest') ? ' The people from the vestry are watching you, and each other.' : ' The people who sat on your floor are watching you, and each other.') : M(p, 'ao_bk_sent') ? ' The ones you sent away say nothing, and look at nobody.' : ''}${M(p, 'ao_bk_copied') ? ' There are two books now, and one hiding place.' : ''}`,
    choices: [
      { t: 'Hide it in the church, of all places', check: { s: 'stealth', s2: 'ins', d: 50 },
        win: { r: "It spends a week behind the altar under the priest's own linen. The searchers go away with somebody else's book.", fx: { happy: 2, arc: { mark: 'ao_bk_safe' } } },
        lose: { r: 'They find it behind the altar, and find you a day later. The fine takes your savings and the penance takes a month of Sundays.', fx: { coin: -30, happy: -4, arc: { mark: 'ao_bk_found' } } } },
      { t: 'Hand it over, to save the others', r: 'You hand it over at the door. They burn it in the square, and do not ask who else read it. This time.', fx: { piety: 1, honor: -3, arc: { mark: 'ao_bk_gave' } } },
      { t: 'Burn it yourself, tonight', r: p => (p.literate ? 'You burn it a page at a time, reading each one as it goes.' : 'You burn it a page at a time, saying over what you remember of each.'), fx: { wil: 1, happy: -3, arc: { mark: 'ao_bk_burned' } } },
    ] },
  { id: 'ao_book_4', title: 'What the book left', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => (M(p, 'ao_bk_safe') || M(p, 'ao_bk_copied')
      ? `The searchers have gone, and the book is ${M(p, 'ao_bk_copied') ? 'still in the world, in your hand if not the friar\'s' : 'back in the thatch'}.${M(p, 'ao_bk_readers') ? ' Your readers are still coming.' : ''} The words of the faith are words to you now, not sounds, and you cannot go back to the sounds.`
      : `${M(p, 'ao_bk_burned') ? 'You burned it yourself, a page at a time. ' : M(p, 'ao_bk_gave') ? 'They burned it in the square, and did not ask who else had read it. ' : M(p, 'ao_bk_found') ? 'They found it behind the altar, and you a day later, and burned it. ' : 'The book is ash. '}But you remember whole pages of it, the way people remember songs, and you catch yourself saying them under your breath at work. Others have caught you too.`),
    choices: [
      { t: 'Teach the children to read from it', req: p => M(p, 'ao_bk_safe') || M(p, 'ao_bk_copied'), r: 'Six children, on winter evenings, with the shutters closed. In a year four of them can read, and one of them can read better than you.', fx: { literate: true, trait: 'zealous', flag: 'ao_book_school', deed: 'Taught children to read from a forbidden book', arc: { go: 'end' } } },
      { t: 'Send it on to the next village', req: p => M(p, 'ao_bk_safe') || M(p, 'ao_bk_copied'), r: 'It goes out under a load of turnips to a cousin of a cousin. You never learn where it ends up, which is the point.', fx: { honor: 3, trait: 'brave', flag: 'ao_book_sent', deed: 'Sent a forbidden book on its way', arc: { go: 'end' } } },
      { t: 'Keep what you know, and keep quiet', r: 'You keep it, in the thatch or in your head, and say nothing. The bishop dies; another comes. You are still waiting.', fx: { wil: 2, trait: 'patient', flag: 'ao_book_quiet', deed: 'Kept a forbidden book, and your counsel', arc: { go: 'end' } } },
      { t: 'Say the pages aloud in the market', req: p => !(M(p, 'ao_bk_safe') || M(p, 'ao_bk_copied')), r: 'You stand on the well-step and say what you remember. Nobody stops you. Some stop to listen, and some go to fetch the priest.', fx: { fame: 3, piety: 2, trait: 'zealous', flag: 'ao_book_preached', deed: 'Said forbidden scripture aloud in the market', arc: { go: 'end' } } },
    ] },

  // ================================================================ the bell of your parish (4 stages)
  { id: 'ao_bell_1', title: 'The cracked bell', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: 'The great bell of {home} cracked at the new year, ringing for a wedding, and now it clanks like a dropped pot. The old women say it is a judgment on the bride. A bellfounder is on the roads this summer, and recasting will cost more than {home} has ever raised for anything.',
    choices: [
      { t: 'Give a good sum toward it', req: p => p.coin >= 30, r: "Your name goes at the top of the priest's list, which is a pleasure you did not expect to enjoy.", fx: { coin: -30, piety: 2, arc: { mark: 'ao_be_gave' } } },
      { t: 'Go door to door for the money', r: 'Some give pennies, some give eggs, one gives a goat. It adds up, slowly, and your feet hurt.', fx: { skill: { persuasion: 1 }, happy: -1, arc: { mark: 'ao_be_collected' } } },
      { t: 'Let it ring cracked', r: 'You say so in the porch: a cracked bell rings the dead out as well as a sound one. Not everyone agrees.', fx: { wil: 1, arc: { mark: 'ao_be_cracked' } } },
    ] },
  { id: 'ao_bell_2', title: "The founder's pit", trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); },
    text: p => `The founder, {them}, digs a casting pit beside the churchyard and asks for bronze. People bring pots, candlesticks, a sword hilt, a wedding ring.${M(p, 'ao_be_cracked') ? ' The parish found the money without you, and noticed.' : M(p, 'ao_be_collected') ? ' You went door to door for this bronze, and know what each pot cost.' : ''} Late one night you see {them} weighing it all by lantern, and the weight that goes in the ledger is less than the weight on the beam.`,
    choices: [
      { t: "Put your mother's old pot in the pit", r: "Your mother's pot goes in with the rest. It is a foolish thing to want, a pot in a bell, and you want it.", fx: { happy: 2, piety: 1, arc: { mark: 'ao_be_pot' } } },
      { t: 'Count the bronze with {themHim}, by daylight', check: { s: 'ins', s2: 'int', d: 45 },
        win: { r: 'You count it together in front of the priest. {them} finds the missing bronze in a sack {theyHe} had forgotten about.', fx: { honor: 2, them: { op: -10 }, arc: { mark: 'ao_be_counted' } } },
        lose: { r: 'You count it together and get a different answer every time. The bell will be what it will be.', fx: { happy: -1, arc: { mark: 'ao_be_short' } } } },
      { t: 'Say nothing. Founders always take their tithe', r: '{them} notices that you noticed, and that you said nothing, and is friendly to you for the rest of the summer.', fx: { them: { op: 15 }, arc: { mark: 'ao_be_skim' } } },
    ] },
  { id: 'ao_bell_3', title: 'Fire in the thatch', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `The new bell goes up on a frame of oak and is rung for the first time${M(p, 'ao_be_short') || M(p, 'ao_be_skim') ? ', in a voice a little thin, though nobody says so' : M(p, 'ao_be_counted') ? ', in a full voice, with every ounce of the bronze in it' : ', in a voice they hear two valleys off'}. Three nights later there is fire in the thatch at the far end of {home}. The wind is from the west, and everybody is asleep.`,
    choices: [
      { t: 'Ring the bell and wake everyone', check: { s: 'sta', s2: 'str', d: 45 },
        win: { r: 'You ring until your palms bleed. Every house turns out with buckets, and the fire stops at the smithy wall.', fx: { fame: 3, arc: { mark: 'ao_be_rang' } } },
        lose: { r: 'You ring, and the rope takes the skin off both hands, and you cannot close them for a month. Every house turns out all the same.', fx: { fame: 2, health: -6, arc: { mark: 'ao_be_rang' } } } },
      { t: 'Run for the fire with a bucket', r: 'You get there first and do what one bucket can, which is not much. Then the bell starts, someone else on the rope.', fx: { honor: 2, health: -5, arc: { mark: 'ao_be_bucket' } } },
      { t: 'Get your own household clear first', r: 'Your own are out and safe, with the bedding. By then somebody else is on the rope.', fx: { happy: 1, arc: { mark: 'ao_be_own' } } },
    ] },
  { id: 'ao_bell_4', title: 'A name on the rim', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); },
    text: p => `{home} is rebuilding the burnt end of the lane. {them} comes back to cut a name into the bell's rim, as the custom is, and the parish is quarrelling about whose.${M(p, 'ao_be_rang') ? ' Half of them say yours: you rang it the night of the fire.' : M(p, 'ao_be_gave') ? ' Your name was first on the list.' : M(p, 'ao_be_bucket') ? ' You were at the fire first, with one bucket, and some say that counts.' : M(p, 'ao_be_own') ? ' You got your own out first, and that is remembered too.' : ''}${M(p, 'ao_be_pot') ? " Your mother's pot is in it somewhere." : ''} The priest wants the saint's.`,
    choices: [
      { t: 'Let it carry your name', r: 'Your name goes round the rim in letters a thumb high. When you are dead it will ring for everyone else.', fx: { fame: 4, honor: -1, epithet: 'the Bell-Ringer', flag: 'ao_bell_name', deed: 'Had your name cast on the bell of your parish', arc: { go: 'end' } } },
      { t: "Your mother's name", r: 'Her name goes on the rim. Old women who knew her come to stand under the bell on Sundays.', fx: { happy: 4, flag: 'ao_bell_mother', deed: "Had your mother's name cast on the parish bell", arc: { go: 'end' } } },
      { t: "The saint's name, as is proper", r: 'The saint gets the bell. The priest gets his way. You get his gratitude, which comes out at odd moments for years.', fx: { piety: 4, honor: 1, flag: 'ao_bell_saint', deed: 'Gave the parish bell its saint', arc: { go: 'end' } } },
    ] },

  // ================================================================ the bridge (5 stages, 8-16 years)
  { id: 'ao_bridge_1', title: 'The ford', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `The ford at {home} drowns someone most springs. This year it took a carter, his horse and a load of slates, and his widow stood on the bank all day. ${NOBLE(p) ? 'Your tenants want' : 'The village wants'} a stone bridge. Nobody wants to pay for one. A stone bridge costs more than a church, and lasts longer.`,
    choices: [
      { t: 'Pledge money toward a bridge', req: p => p.coin >= 40, r: 'You pledge forty in front of the priest. Others pledge after you, smaller sums, and some of them mean it.', fx: { coin: -40, honor: 2, arc: { mark: 'ao_br_pledged' } } },
      { t: p => (NOBLE(p) ? 'Petition your liege to build it' : 'Petition the lord to build it'), check: { s: 'persuasion', s2: 'int', d: 50 },
        win: { r: 'The lord will pay for half, if the toll is his. It is more than anyone expected.', fx: { honor: 1, arc: { mark: 'ao_br_lord' } } },
        lose: { r: 'The lord says fords were good enough for his father, and drowned nobody worth mentioning.', fx: { happy: -2, arc: { mark: 'ao_br_refused' } } } },
      { t: 'Keep a ferry, and charge a fair fare', r: 'You buy a flat boat and a rope. People pay you to cross, and resent it a little each time.', fx: { coin: 30, honor: -2, arc: { mark: 'ao_br_ferry' } } },
    ] },
  { id: 'ao_bridge_2', title: 'The mason from the south', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); },
    text: p => `A master mason comes up from the south: {them}, who has built three bridges and has drawings of all of them. {theyHe} wants half the money before a stone is cut, and the rest when the keystone goes in.${M(p, 'ao_br_ferry') ? ' Your ferry would be out of business, of course.' : ''}${M(p, 'ao_br_refused') ? ' The lord will not pay; the parish will have to.' : ''}`,
    choices: [
      { t: 'Pay {themHim} the half, and trust {themHim}', req: p => p.coin >= 30, r: '{theyHe} takes the money, hires men, and starts. By autumn the first pier stands in the river, and you go to look at it most evenings.', fx: { coin: -30, happy: 2, arc: { mark: 'ao_br_trust' } } },
      { t: 'Hire a local mason, for less', r: 'The local man has built barns and a chapel. He says a bridge is only a barn lying down.', fx: { coin: -10, arc: { mark: 'ao_br_local' } } },
      { t: 'Pay by the arch, as each one stands', check: { s: 'trade', s2: 'persuasion', d: 45 },
        win: { r: '{them} grumbles, then agrees: each arch paid for when it stands, and not before.', fx: { coin: -15, arc: { mark: 'ao_br_arch' } } },
        lose: { r: '{theyHe} rolls up the drawings and goes south again. You hire the local man.', fx: { coin: -10, arc: { mark: 'ao_br_local' } } } },
    ] },
  { id: 'ao_bridge_3', title: 'The spring flood', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => { WHO(p, ctx); },
    text: p => `The bridge is half built when the spring flood comes down, brown and fast and full of trees. The timber centring under the second arch is groaning. ${M(p, 'ao_br_local') ? 'Your local mason swears it will hold, and has gone pale.' : M(p, 'ao_br_arch') ? '{them} wants every pair of hands on the ropes: an arch in the river is an arch {theyHe} is not paid for.' : M(p, 'ao_br_trust') ? '{them} has your half-payment and wants every pair of hands on the ropes.' : '{them} wants every pair of hands on the ropes.'}`,
    choices: [
      { t: 'Get on the ropes with them', check: { s: 'str', s2: 'sta', d: 50 },
        win: { r: 'It holds. You do not know how long you hung on that rope, only that the light changed twice.', fx: { fame: 2, arc: { mark: 'ao_br_held' } } },
        lose: { r: 'It holds. Your hand does not: the rope runs, and takes two fingers with it.', fx: { fame: 2, wound: 'lost_fingers', arc: { mark: 'ao_br_held' } } } },
      { t: 'Pull everyone back and let it go', r: 'The second arch goes into the river with a sound like a barn door. Nobody dies. It will cost a year.', fx: { happy: -3, arc: { mark: 'ao_br_fell' } } },
      { t: 'Cut the centring free to save the first arch', check: { s: 'int', s2: 'ins', d: 50 },
        win: { r: 'The centring goes downstream like a raft. The first arch stands, and the second can be built again.', fx: { int: 1, arc: { mark: 'ao_br_cut' } } },
        lose: { r: 'You cut, and both arches go. Nobody dies, which is all that can be said for it.', fx: { happy: -4, arc: { mark: 'ao_br_fell' } } } },
    ] },
  { id: 'ao_bridge_4', title: 'The toll board', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `The bridge stands across the river at {home}${M(p, 'ao_br_fell') ? ', a year late' : ''}. ${M(p, 'ao_br_lord') ? "The lord's steward has put up a toll board:" : 'The lord has put up a toll board all the same:'} a penny a foot, two a beast.${M(p, 'ao_br_pledged') ? ' You paid toward this bridge.' : ''} The parish meets about it in the church porch, and they look to you to speak.`,
    choices: [
      { t: 'Argue that it should be free', check: { s: 'persuasion', s2: 'wil', d: 55 },
        win: { r: 'The lord gives way, for a fixed sum a year from the parish. The board comes down, and a boy kicks it into the river.', fx: { honor: 2, arc: { mark: 'ao_br_free' } } },
        lose: { r: "The lord's lawyer has the last word, and the board stays.", fx: { happy: -2, arc: { mark: 'ao_br_tolled' } } } },
      { t: 'Offer to farm the toll yourself', req: p => p.coin >= 50, r: 'You pay the lord a year in advance and sit in the toll-house with a box and a long face.', fx: { coin: -50, arc: { mark: 'ao_br_farm' } } },
      { t: 'Pay the toll, and say nothing', r: 'You pay your penny. Others pay theirs, and say plenty, but not to the steward.', fx: { wil: 1, arc: { mark: 'ao_br_paid' } } },
    ] },
  { id: 'ao_bridge_5', title: 'The keystone', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `A mason's boy is cutting letters on the keystone. ${M(p, 'ao_br_free') ? 'The bridge is free, by the lord\'s own charter.' : M(p, 'ao_br_farm') ? 'You keep the toll-box, and are disliked for it in a small, steady way.' : M(p, 'ao_br_tolled') ? "The board stayed up, and the toll is the lord's." : M(p, 'ao_br_paid') ? "The toll is the lord's, and you pay your penny with everyone else." : "The toll is the lord's."}${M(p, 'ao_br_held') ? ' You were on the ropes the night of the flood.' : M(p, 'ao_br_cut') ? ' You cut the centring loose and saved the first arch.' : ''} Nobody has drowned at {home} since the bridge stood. The parish wants a name on the stone, and the boy has his chisel up.`,
    choices: [
      { t: 'Your own name on the keystone', r: 'Your name goes on the keystone. Carters touch it for luck as they pass under, which is apparently an honour.', fx: { fame: 4, epithet: 'the Bridgewright', flag: 'ao_bridge_name', deed: 'Put your name on the keystone of the bridge', arc: { go: 'end' } } },
      { t: "The drowned carter's name", r: "The carter's widow walks over it every market day, and pats the stone where his name is.", fx: { honor: 4, piety: 1, flag: 'ao_bridge_carter', deed: 'Named the bridge for a drowned carter', arc: { go: 'end' } } },
      { t: 'Cut the free passage into the stone', req: p => M(p, 'ao_br_free'), r: 'FREE PASSAGE FOR EVER, the stone says, and the lord\'s seal under it. Lords die; stone stays.', fx: { honor: 5, fame: 2, flag: 'ao_bridge_free', deed: 'Won free passage over the bridge for ever', arc: { go: 'end' } } },
      { t: 'Build an inn at the bridgehead', req: p => M(p, 'ao_br_farm') && p.coin >= 300, r: 'Everyone who crosses passes your door, and a good many stop. The toll and the inn together make you a person of consequence.', fx: { coin: -300, aoAsset: { k: 'inn', name: 'The inn at the bridgehead' }, flag: 'ao_bridge_inn', deed: 'Built an inn at the bridgehead', arc: { go: 'end' } } },
    ] },
]);
}
