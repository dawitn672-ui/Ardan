// Realm bibles, part E: the holds, the grass, the Roof and the monsoon coast (47-realm-bible). See bible.core.js for the kinds of custom and their fields.
(function () {
  const D = A.BIBLE_DATA = A.BIBLE_DATA || {}, W = A.BIBLE_WORDS = A.BIBLE_WORDS || {};

  W['CUL-21'] = [['durrik', 'a line of the Deep Law, cut in stone'], ['thangrel', 'a master of a craft, sworn before the Council'], ['ombrak', 'a dwarf\'s full name, carved at thirty']];
  W['CUL-22'] = [['ghazrul', 'a deed-name, earned in youth'], ['urdrak', 'the clan herd, which no one rider owns'], ['shurrak', 'the war-chief\'s share of a raid']];
  W['CUL-23'] = [['ommakh', 'a mother\'s hearth: her tent, her herd'], ['tulvek', 'the marriage horses'], ['krenna', 'the council of clan-mothers']];
  W['CUL-03'] = [['essar', 'the horn post-token of the Compact'], ['saghal', 'the spring count of horses owed the khan'], ['kauvel', 'a name handed down from a grandparent']];
  W['CUL-12'] = [['hemmal', 'the butter and wool owed to the monastery'], ['osselin', 'a name chosen by a monk'], ['auralt', 'the high ground where the dead are given to the birds']];
  W['CUL-13'] = [['kollamar', 'the Raja\'s sixth of the rice'], ['tirrasu', 'the temple\'s tenth of an estate'], ['kevvaram', 'a market tally-house']];

  D['POL-10'] = {
    want: 'To keep the Iron Road Contract honest and the Deep Gate shut, and to buy Aldmark\'s grain without selling the hold along with the iron.',
    fear: 'That Aldmark\'s grain becomes Aldmark\'s leash, and that the thane Korrin sets his mother aside before the Council of Masters can stop him.',
    place: { name: 'The Deep Gate', text: 'Iron doors in the mountain\'s face, with breastplates and war-picks behind them and sappers under the floor. No human army has passed it. The grain wagons from Aldmark stop outside.' },
    customs: [
      { id: 'irn_metal_tithe', name: 'The metal tithe', kind: 'year', m: 2, who: 'adult',
        rule: 'Irondeep takes no coin tax; each spring every hearth and forge pays a tithe of worked metal to the hold.',
        text: 'The first of spring. Tithe-takers of the Council of Masters go door to door with a balance and a sack. Nobody in Irondeep pays the queen in coin; they pay in metal, a nail-weight from a hearth and a bar from a forge. Yours goes on the scale.',
        fx: { coin: -4 }, keepT: 'Put a fair weight on the scale', keep: 'The tithe-taker checks the beam, nods, and chalks a mark on your door-post.',
        defy: { t: 'Give them scrap and cinders', r: 'The scale says scrap. He reads you the {w1} on tithes, word for word, and chalks a black mark that stays on your door all year.', fx: { honor: -3, wil: 1 } },
        log: 'The tithe-takers weigh out your share of metal for the hold.' },
      { id: 'irn_masters_piece', name: 'The piece before the masters', kind: 'rite', age: 25, who: 'adult',
        rule: 'At twenty-five every soul of the hold brings a piece of their own work before a {w2} of the Council, to be judged.',
        text: 'You are twenty-five, and by custom you owe the hold a piece of your own work. It need not be iron: a hinge, a ledger, a mended boot will do. A {w2} of the Council of Masters turns it over in her hands and waits to hear what it is for.',
        fx: { skill: { craft: 1 }, honor: 1 }, keepT: 'Lay your best piece on the bench', keep: 'She finds the flaw you hoped she would miss, names it, and passes the piece anyway. You know where to look next time.',
        defy: { t: 'Bring nothing and say you are no smith', r: 'She writes it down. Masters remember who would not be judged, and their doors open a little slower.', fx: { honor: -2, happy: -1, wil: 1 } },
        log: 'A {w2} of the Council judges your work and marks it passed.' },
      { id: 'irn_carvers_word', name: 'The Carver\'s reading', kind: 'law',
        rule: 'After any sentence a Law-Carver reads aloud the {w1} you broke, and you say it back; no queen may soften it.',
        text: 'Your sentence is given, and then a Law-Carver of Orsa Flintmark\'s bench reads out the {w1} you broke, cut in the court wall centuries ago. The queen could not pardon you if she wished. The Deep Law asks only that you say the words back.',
        fx: { honor: -1, piety: 1 }, keepT: 'Say the words back', keep: 'You repeat the line, stumbling once. The Carver corrects you, and the clerk writes that you said it.',
        defy: { t: 'Keep silent', r: 'The Carver reads it again, slower, and enters your silence beside your sentence. It will be read out the next time you are judged.', fx: { honor: -3, wil: 1 } },
        log: 'A Law-Carver reads you the {w1} you broke, and you say it back.' },
    ],
  };

  D['POL-28'] = {
    want: 'To take back the Nagora Pass from Ranpur, keep Tessaria paying on the Tirana gold, and make the Hold Bank the bank every realm must ask.',
    fear: 'That the old king dies with Orrin Goldvein still reading him his letters, and the Eldest Carver\'s trial of Emberdeep splits the three holds.',
    place: { name: 'The First Hall', text: 'Where the Deep Law was first carved, line under line, down a wall nobody has seen the bottom of. The Eldest Carver sits beneath it, and the king has not left it since 1098.' },
    customs: [
      { id: 'stn_carved_name', name: 'The name on the wall', kind: 'rite', age: 30, who: 'all',
        rule: 'At thirty a dwarf\'s full name, the {w3}, is carved on the clan wall, and the one named pays the carver.',
        text: 'You are thirty. In Stonehold that is when a name is finished. A carver cuts your {w3} into the clan wall, below your mother\'s and father\'s, and the one who is named pays for the cutting: twenty marks for the stone and the chisel.',
        fx: { coin: -20, honor: 2 }, keepT: 'Pay the carver and stand by the wall', keep: 'The chips fall for an afternoon. Afterwards your kin touch the letters, and a clerk of the Hold Bank enters the name against your account.',
        defy: { t: 'Leave the stone blank', r: 'The space waits under your parents\' names. Elders call you by your short name, as they would a child, and do not explain why.', fx: { honor: -4, wil: 1 } },
        log: 'Your {w3} is cut on the clan wall, and you pay the carver.' },
      { id: 'stn_carved_shares', name: 'Shares cut in stone', kind: 'mourn', share: 'equal',
        rule: 'An estate is split in equal shares, as the {w1} of inheritance says; the Hold Bank keeps each share until it is signed for.',
        text: '{parent} is laid in the deep tombs. A clerk of the Hold Bank reads the {w1} of inheritance: equal shares, no favourite, no will heard against the stone. The estate comes to {estate}. Your share is {got}, less the Bank\'s fee for keeping it.',
        fx: { coin: -3, happy: -2 }, keepT: 'Sign for your share', keep: 'You sign the Bank\'s book in two places. The clerk counts the coin out twice and takes the fee once.',
        defy: { t: 'Claim more, for the years you nursed {parent}', r: 'The Eldest Carver\'s clerk hears you out and points at the wall. Your brothers and sisters heard you too.', fx: { happy: -4, honor: -2, wil: 1 } },
        log: '{parent} is laid in the deep tombs; the {w1} splits the estate equally, and you get {got}.' },
      { id: 'stn_zardeep_toll', name: 'The Zardeep toll', kind: 'market', cut: 0.1,
        rule: 'One part in ten of what you sell in the hold goes to the Zardeep toll, which pays for the gate and its pikes.',
        text: 'You sell in the hold\'s market, and the toll-clerk is already at your elbow with a tally-stick. One part in ten for Zardeep, as it has been since the pass was cut. Today that is {cut}. Kettil Ironbrow\'s men of the Old Toll watch the counting.',
        fx: { happy: -1 }, keepT: 'Let the clerk count', keep: 'He counts, you watch him count, and the tally-stick gets a new notch. The rest is yours.',
        defy: { t: 'Say half the goods were sold outside the gate', r: 'The clerk asks which gate, and when. The Old Toll men write your name down, and next time they count every piece twice.', fx: { honor: -3, happy: -2 } },
        log: 'The Zardeep toll takes {cut} of your sale.' },
    ],
  };

  D['POL-29'] = {
    want: 'To dig a road out of a mountain that grows hotter every decade, keep the Chanari steel secret between Emberdeep and Ranpur, and outlast the dragon of Kardeep.',
    fear: 'That the Smith-Father\'s breath turns to scalding steam again as in 1050, and the Forge-Queen\'s secret heat readings are worse than anyone is told.',
    place: { name: 'The Breath Vents', text: 'Fissures in the lowest forges where hot springs rise and heat the crucibles. The dwarves call it the Smith-Father\'s breath. The tunnel walls are warm to the hand, and warmer than they were.' },
    customs: [
      { id: 'emb_dragon_watch', name: 'A night on the Dragon Watch', kind: 'ward', when: 'any', every: 4,
        rule: 'Every grown soul of Emberdeep stands a night on the Dragon Watch every few years, crossbow on the sky, whatever their trade.',
        text: 'Your turn on the Dragon Watch. You climb to a slit high above Tharmund with a borrowed crossbow and a lamp you may not light. Inga Crag\'s sergeant shows you which part of the sky is yours and tells you not to sleep. Nothing comes. Something did, once.',
        fx: { skill: { xbow: 1 }, happy: -1 }, keepT: 'Stand the night with your eyes on the sky', keep: 'Dawn comes grey through the slit. Your neck aches, and your hands know the crossbow a little better.',
        defy: { t: 'Pay a younger dwarf to stand it for you', r: 'He takes the coin and the night. The sergeant writes both your names in the watch book, and Inga Crag reads that book.', fx: { coin: -10, honor: -2 } },
        log: 'You stand a night on the Dragon Watch above Tharmund. The sky stays empty.' },
      { id: 'emb_heat_wed', name: 'An hour of heat', kind: 'wed', dowry: 0,
        rule: 'No dowry passes at an Emberdeep wedding; the couple are given an hour of forge-heat a week at the Breath Vents instead.',
        text: 'In Emberdeep a marriage is not paid for in coin. No dowry passes, and the {dowry} that was promised goes back into purses. Instead the forge-wardens give the pair one hour of heat a week at the Breath Vents, and stamp both names on a single tally.',
        fx: { skill: { craft: 1 }, happy: 1 }, keepT: 'Take the hour of heat', keep: 'You and your spouse spend the first hour at the vent together, sweating. The tally hangs over your door.',
        defy: { t: 'Demand the dowry by the human custom', r: 'The forge-wardens hear you out and tell you to go and marry in Aldmark. Your spouse\'s kin repeat it at every meal.', fx: { honor: -2, happy: -3 } },
        log: 'You marry the Emberdeep way: no dowry, and an hour of heat a week at the vents.' },
      { id: 'emb_given_to_heat', name: 'Given to the breath', kind: 'grave',
        rule: 'The dead are laid in a sealed cut beside the Breath Vents, their {w3} cut on the seal, and the heat keeps them.',
        log: 'You are laid in a sealed cut by the Breath Vents, your {w3} on the seal, where the Smith-Father\'s breath keeps you.' },
    ],
  };

  D['POL-11'] = {
    want: 'To keep the clans riding behind the Line of Gorath after Vrag\'s weak heart gives out, and to take the grass back to the Salt Shore from the Nine Winds.',
    fear: 'That Vrag dies without an heir the shamans will confirm, and the clans split as they were before Gorath, each selling horses to whoever pays.',
    place: { name: 'The Drum Ring at Urgol', text: 'A ring of standing drums on the open grass where the Drum Council of senior shamans meets. A war-chief is confirmed there, and the Grey Mothers have overruled one there.' },
    customs: [
      { id: 'hrd_deed_name', name: 'The ride for a name', kind: 'rite', age: 17, who: 'all',
        rule: 'Until you earn a {w1} you are only of your clan; at seventeen you ride the summer relay for one.',
        text: 'You are seventeen and still called by your clan\'s name, like a foal. Each summer the Drum Council sets the young a ride: a relay to the Salt Sea edge and back before the moon turns. Those who make it are given a {w1}. Those who do not stay foals.',
        fx: { skill: { riding: 1 }, fame: 1 }, keepT: 'Ride the relay', keep: 'You ride four horses into the ground and come back thin. A shaman beats your new {w1} on the drum, once, so the grass hears it.',
        defy: { t: 'Stay by the tents', r: 'Your clan keeps calling you by its own name. The young who rode use their new ones, and use them in front of you.', fx: { honor: -3, happy: -2, wil: 1 } },
        log: 'Your {w1} is beaten on the drum at Urgol.' },
      { id: 'hrd_clan_herd', name: 'Back to the herd', kind: 'mourn', share: 'clan',
        rule: 'When a rider dies the horses and felt go back to the {w2}; the children keep a saddle and an old mare.',
        text: '{parent} is dead and given to the grass. The horses and felt were never {parent}\'s alone: they go back into the {w2}, and the clan elder counts them in. The estate was {estate}. You get {got}, and a saddle.',
        fx: { happy: -2 }, keepT: 'Let the elder count them in', keep: 'You hand over the halters one by one. The elder gives you back the old mare, as is allowed.',
        defy: { t: 'Drive the best horses off before the count', r: 'The elder sends riders after you. They bring the horses back and do not speak to you at the next gathering.', fx: { honor: -4, happy: -2, wil: 1 } },
        log: '{parent}\'s horses go back into the {w2}; you get {got} and a saddle.' },
      { id: 'hrd_remount', name: 'A remount for the Line', kind: 'levy', who: 'adult',
        rule: 'In war, whoever does not ride sends a remount to the Line of Gorath, and the {w3} of every raid is the war-chief\'s first.',
        text: 'War, and the drums at Urgol carry from camp to camp. Whoever does not ride with the relays owes a remount to the Line of Gorath, and the {w3} of whatever the riders bring back is the war-chief\'s before it is anyone else\'s.',
        fx: { coin: -8 }, keepT: 'Give up a remount', keep: 'A rider takes your second horse on a lead and does not look back. Your string is one horse shorter.',
        defy: { t: 'Hide the horse in a gully', r: 'They find it by its tracks. Your clan pays the remount for you, and the clan does not forget whose debt it was.', fx: { honor: -4, happy: -2 } },
        log: 'War again; a rider takes your remount for the Line of Gorath.' },
    ],
  };

  D['POL-34'] = {
    want: 'To hold the Silk Road toll at Kraoth, keep thirty-one clans sworn to the War-Mother, and never kneel to the Line of Gorath.',
    fear: 'That the War-Mother faints in the sun before the clans, and the clan-mothers are pressed to choose a war-chief who calls himself holy.',
    place: { name: 'The toll-stones of Kraoth', text: 'Two standing stones on the Silk Road where every caravan halts and pays one part in ten. Gurz the Toll-Keeper counts the silver in a felt tent between them. Velgrad pays, and complains.' },
    customs: [
      { id: 'tsk_mothers_hearth', name: 'The hearth goes to daughters', kind: 'mourn', share: 'daughters',
        rule: 'Tent and herd belong to the {w1}, and the {w1} passes to the daughters; sons take a horse and join their wives\' hearths.',
        text: '{parent} is dead. Among the Tusk Clans the tent and the herd belong to the {w1}, and the {w1} goes to the daughters, as Urza Ironhide took Grakka\'s. The estate was {estate}. You get {got}.',
        fx: { happy: -2 }, keepT: 'Let the daughters take the tent', keep: 'The eldest sister ties the tent-flap with her own cord. The rest of you are guests in it now.',
        defy: { t: 'Take it to the {w3}', r: 'The clan-mothers hear you out in silence and send you away with one horse. The tale reaches the other camps before you do.', fx: { happy: -3, honor: -2, wil: 1 } },
        log: '{parent}\'s {w1} goes to the daughters, as the clan-mothers rule; you get {got}.' },
      { id: 'tsk_marriage_horses', name: 'The marriage horses', kind: 'wed', dowry: -1,
        rule: 'At a wedding the couple pay the {w2}, horses and turquoise, to the bride\'s mother\'s hearth.',
        text: 'You marry, and the bride\'s mother counts the {w2} at her tent door: horses, felt and turquoise, the price of taking someone from her hearth. Whatever {dowry} came with the match is beside the point. You pay {paid}.',
        fx: { happy: 1 }, keepT: 'Lead the horses to her door', keep: 'She runs her hand down each one\'s legs and keeps the best for her own string. The match is sound.',
        defy: { t: 'Bargain her down by two horses', r: 'You win the two horses. She tells the camp what her daughter was worth to you, and the camp agrees with her.', fx: { honor: -3, happy: -2 } },
        log: 'You pay the {w2} at the mother\'s tent: {paid}.' },
      { id: 'tsk_mothers_judge', name: 'The mothers\' judgment', kind: 'law',
        rule: 'Wrongs are priced by the {w3}, not the War-Mother: after a sentence you owe the wronged hearth a horse.',
        text: 'Your sentence stands, and then the {w3} adds its own. Among the Tusk Clans the clan-mothers, not the War-Mother, decide what a wrong costs: a horse to the hearth you wronged, led to its door by your own hand.',
        fx: { coin: -10 }, keepT: 'Lead a horse to the hearth', keep: 'The horse goes. The wronged hearth\'s mother nods to you at the next drum, and that is the end of it.',
        defy: { t: 'Appeal to the War-Mother over them', r: 'Urza Ironhide sends word that she does not overrule the mothers on law. Now every camp knows you asked her to.', fx: { honor: -3, happy: -2, wil: 1 } },
        log: 'The {w3} rules that you owe a horse to the hearth you wronged.' },
    ],
  };

  D['POL-12'] = {
    want: 'To keep nine tribes under one Compact while a nearly blind khan sells fire-oil to Queen Livia, and to hold the Salt Shore against the Horde.',
    fear: 'That the oil money, which goes to the khan alone, makes the other chiefs call a council and force him out, and the Compact of 925 ends with him.',
    place: { name: 'The Compact Stone at Kharsa', text: 'A grey stone by the khan\'s tents where the nine chiefs cut their marks in 925. Each spring every tribe sends a rider to touch its mark and carry the news home.' },
    customs: [
      { id: 'nwd_post_road', name: 'The post must ride', kind: 'ward', when: 'mounted', every: 2,
        rule: 'Whoever keeps a horse must carry the post one stage when the {w1} is shown, by the Compact of 925.',
        text: 'A rider on a spent horse pulls up at your tent and holds out the {w1}, a strip of horn cut with nine marks. By the Compact of 925 you must carry his bag one stage on, a day\'s ride, to the next tent. He takes your fresh horse and leaves you his.',
        fx: { skill: { riding: 1 }, health: -1 }, keepT: 'Take the bag and ride', keep: 'You ride the stage, hand the bag on, and come home a day later on someone else\'s tired horse. Yours comes back by spring, mostly.',
        defy: { t: 'Say your horse is lame', r: 'The rider looks at your horse and cuts your tent\'s mark on his tally. Your chief will hear it at the spring gathering.', fx: { honor: -4 } },
        log: 'A post-rider shows you the {w1}; you carry the bag one stage.' },
      { id: 'nwd_horse_count', name: 'The spring count', kind: 'year', m: 3, who: 'adult',
        rule: 'Each spring every tribe gives the khan one horse in thirty, called out family by family at the {w2}.',
        text: 'Spring, and your tribe gathers to count horses before the grass comes up. The khan\'s men take one in thirty, as the Compact says, and the chief\'s crier calls the {w2} tent by tent. Your share comes to a foal, or its price in silver.',
        fx: { coin: -5 }, keepT: 'Hand over a sound foal', keep: 'You lead out a foal. The khan\'s man feels its legs and takes it without a word.',
        defy: { t: 'Hand over your oldest mare', r: 'The khan\'s man takes her and says aloud what she is. The whole gathering laughs, and they remind you of it next spring.', fx: { honor: -3, happy: -2 } },
        log: 'The spring {w2}: one horse in thirty goes to the khan.' },
      { id: 'nwd_grandsire_name', name: 'A grandparent\'s name', kind: 'name', rule: 'grandparent',
        text: 'Your child is born, and the women of the tent are already saying the name. Among the Wind Riders a child takes a {w3}, a grandparent\'s name, so the dead keep riding with the tribe. This one is {child}.',
        fx: { happy: 2 }, keepT: 'Say {child} at the tent door', keep: 'You say it into the wind three times, as is done. The old people nod.',
        defy: { t: 'Give the child a name of your own', r: 'The elders use the {w3} anyway, and the child grows up answering to both, and to neither quite.', fx: { honor: -2, wil: 1 } },
        log: 'Your child takes a {w3}: {child}.' },
    ],
  };

  D['POL-27'] = {
    want: 'To keep the White Stair whole after the dying 13th Abbot, answer the Red Stair\'s claim that the search found the wrong child, and keep the salt trails open.',
    fear: 'That the Abbot dies before his sealed letter is read, the Red Stair raises its own abbot, and the Steward\'s steel turns sworn guards into soldiers.',
    place: { name: 'The White Stair', text: 'Steps cut up the cliff face to the abbey of Skyhold. Pilgrims climb it with butter and silver, the Stair Guard with staves and slings. The thin air does the rest.' },
    customs: [
      { id: 'sky_butter_tithe', name: 'Butter for the lamps', kind: 'year', m: 8, who: 'adult',
        rule: 'At summer\'s end every household gives the {w1}, a tithe of butter and wool, to its valley\'s monastery.',
        text: 'Summer pasture ends and the herds come down. A monk with a yak and two empty baskets stops at your door for the {w1}: butter sewn in skin, wool rolled in hanks. The lamps at Skyhold burn on butter, and so does the monk.',
        fx: { coin: -4, piety: 1 }, keepT: 'Fill both baskets', keep: 'He does not weigh it. He looks in the baskets and blesses the door-frame, and the yak takes your butter up the valley.',
        defy: { t: 'Give him last year\'s rancid butter', r: 'He takes it without a word. The lamp-keeper smells it within a week, and within a month so does the valley.', fx: { piety: -2, honor: -2 } },
        log: 'A monk takes the {w1} of butter and wool from your house.' },
      { id: 'sky_monk_name', name: 'The monk\'s name', kind: 'name', rule: 'keep',
        text: 'Your child is born, and a monk from the valley house comes to give it an {w2}. He chooses {child}, then opens a ledger. Every family owes one child to the monasteries; he writes whether this is the one, and what your house has given already.',
        fx: { piety: 1, happy: -1 }, keepT: 'Accept the name and the ledger', keep: 'The monk writes {child} under your house\'s other names. The ink is the same whichever child it is.',
        defy: { t: 'Ask him to strike this child from the ledger', r: 'He strikes nothing, and writes that you asked. The Steward\'s clerks read these ledgers when the abbey is short of novices.', fx: { piety: -2, wil: 1 } },
        log: 'A monk names your child {child} and enters it in the abbey\'s ledger.' },
      { id: 'sky_open_sky', name: 'Given to the open sky', kind: 'grave',
        rule: 'The dead are carried up to the {w3} and given to the birds, so nothing of them is kept from the open sky.',
        log: 'You are carried up to the {w3} at dawn and given to the birds, under the open sky.' },
    ],
  };

  D['POL-30'] = {
    want: 'To hold the Nagora Pass it took from Stonehold in 1085, keep the Chanari steel secret, and keep the temples rich enough to stay loyal to the Raja.',
    fear: 'That the temples, which hold the courts and the gold, choose the kinsman Kiran Ranavir over the Raja, while the One Face preachers win the merchants.',
    place: { name: 'The steel-works at Chanari', text: 'The only place in the world where humans make crucible steel, behind a wall and the Steel Guard. The secret came from Emberdeep, and every worker swears by the Thousand Names to keep it.' },
    customs: [
      { id: 'ran_kings_sixth', name: 'The Raja\'s sixth', kind: 'year', m: 10, who: 'commoner',
        rule: 'After the rice harvest the {w1}, one basket in six, is weighed out for the Raja on the village threshing floor.',
        text: 'The rice is cut and threshed. The Raja\'s weigher comes with a beam, and a temple scribe with him, and the {w1} is measured out on the threshing floor: one basket in six, to feed the elephants and the Steel Guard. The scribe writes the weight in two books.',
        fx: { coin: -6 }, keepT: 'Fill the sixth basket', keep: 'The weigher calls the weight, the scribe repeats it, and the basket goes on the cart.',
        defy: { t: 'Wet the rice so it weighs heavier', r: 'The weigher bites a grain and spits. He takes the sixth from the dry heap instead, and the scribe writes your name in both books.', fx: { honor: -3, piety: -1 } },
        log: 'The Raja\'s weigher takes the {w1} from your harvest.' },
      { id: 'ran_temple_tenth', name: 'The temple\'s tenth', kind: 'mourn', share: 'temple',
        rule: 'Before an estate is shared, the temple takes the {w2}, a tenth for the lamps of the Thousand Names.',
        text: '{parent} is burned by the river. Before the heirs see a coin, the temple takes the {w2}, a tenth for the Thousand Names, and its priest divides the rest by temple law. The estate was {estate}. You get {got}.',
        fx: { piety: 1, happy: -2 }, keepT: 'Give the tenth with both hands', keep: 'The priest ties a thread on your wrist for {parent}, and a lamp is lit in the temple in the name of the dead.',
        defy: { t: 'Ask why a thousand gods need a tenth', r: 'The priest does not answer. The temple courts remember the question, and their clerks remember the face.', fx: { piety: -3, honor: -1, wil: 1 } },
        log: '{parent} is burned by the river; the temple takes the {w2}, and you get {got}.' },
      { id: 'ran_market_tally', name: 'The market twentieth', kind: 'market', cut: 0.05,
        rule: 'One part in twenty of what is sold in Ranpur\'s markets is counted at the {w3} for the Raja.',
        text: 'You sell your goods, and before the buyer is out of sight a tally-man from the {w3} is at your stall with a slate. One part in twenty for the Raja, he says, and holds out his palm. Today that is {cut}.',
        fx: { happy: -1 }, keepT: 'Count it into his palm', keep: 'He marks your stall on the slate and moves on. The coin rings as it drops in his bag.',
        defy: { t: 'Swear by three of the Names it was a gift', r: 'He has heard that oath before. He fines you on top of the twentieth, and swears by four.', fx: { coin: -8, piety: -1 } },
        log: 'The {w3} takes {cut} of your sale.' },
    ],
  };
})();
