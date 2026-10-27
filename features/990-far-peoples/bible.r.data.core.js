// Far realm bibles, the Twin Rivers (990-far-peoples). A realm: want, fear, place [name, text], and its own custom; its
// people's customs are in C[culture]; its faith's holy day comes from faiths.data.core.js. A custom is
//   [id, kind, params, name, rule, text, keepT, keep, defyT, defyR, log, fx, defyFx]
// with the kinds and params of 47-realm-bible (bible.core.js) plus exam, census, muster and season (zz-far-peoples.core.js).
(function () {
  const R = A.FARP_REALMS = A.FARP_REALMS || {}, C = A.FARP_CULT = A.FARP_CULT || {};

  R['POL-36'] = { want: 'To take back the Northern Plain and Moriden before the dynasty\'s two-hundredth year.',
    fear: 'Bankruptcy: half-notes passing at sixty in a hundred, and the army eating two thirds of the revenue.',
    place: ['The Hall of Cells at Venshai', 'Twenty thousand brick exam cells in rows a kilometre long, used nine days every third year and swept the rest.'],
    own: ['tau_exam', 'exam', { every: 3, m: 2, who: 'free', s: 'learning', s2: 'int', d: 62, pass: [{ fame: 4, honor: 2, coin: 15 }, 'Your number is on the wall of passes. A clerk writes you into the Ledger as a {w3}.'], fail: [{ happy: -2 }, 'Your number is not on the wall. You walk home with the other ninety-nine.'] },
      'The triennial exams', 'Every third spring any free man may sit the prefectural exams, sealed three days in a brick cell.',
      'Spring of an exam year. The prefect\'s men chalk the cell numbers on the Hall wall. Three days and two nights in a brick box, a board for a desk, and a clerk to copy your paper so no examiner knows your hand.',
      'Sit the exam', 'You are sealed in with ink, rice and a chamber pot. On the third night you stop hearing the man in the next cell weep.',
      'Let scholars sit it', 'You stay at your work. Your mother tells the neighbours you were ill.', 'You sit the exam in the Hall of Cells.', {}, { happy: -1 }] };

  R['POL-37'] = { want: 'To conquer the Taulen basin and be the only court under Heaven, and to stop paying the khagan.',
    fear: 'That the banners have gone soft and hire Sennish men to ride for them; and the khagan\'s sons.',
    place: ['The Hall of Banners at Moriden', 'Where the eight banners hang; the Black Banner\'s pole is a cedar carried 1,700 km from the Sable Woods.'],
    own: ['hsh_banner', 'muster', { m: 9, who: 'male', need: 'mounted', ok: [{ skill: { riding: 1 }, honor: 1 }, 'You ride past the banner captain on your own horse. He nods you through.'], short: [{ coin: -6, honor: -1 }, 'You come to the muster on foot. The captain fines you a horse\'s keep.'] },
      'The banner muster', 'At the autumn hunt every man of a banner household rides in the ring, mounted, or pays for a horse.',
      'Autumn, and the banners ride out for the great hunt: a ring forty kilometres wide. A man who lets a deer through the line loses his stipend for a year. Your household is on the banner roll.',
      'Ride in the ring', 'Two days in the saddle, shouting at deer. Nothing gets through your stretch of the line.',
      'Hire a Sennish man to ride for you', 'He rides well enough. The captain knows whose horse it is, and who is not on it.', 'The banner hunt rides out, and you ride with it.', {}, { coin: -8, honor: -2 }] };

  R['POL-38'] = { want: 'To keep the salt revenue at home and hold the Tea-and-Horse Road for its own cavalry.',
    fear: 'Being crushed between the two courts, with the Black Lamp\'s hills on the eastern rim.',
    place: ['The Chain Gorges', 'The Taulen\'s three gorges through the Red Rim, where the river runs too fast for any army\'s boats.'],
    own: ['shu_weir', 'season', { m: 2, pct: 0.06, min: 8, cap: 20, paid: 'The weir-tax goes to the water-steward: {due}.', short: 'You cannot pay the weir-tax. Your field gets its water last.', shortFx: { honor: -1, happy: -2 } },
      'The Split Weir', 'Each spring the king cuts the first dam at the Split Weir, and every field the water reaches pays the weir-tax.',
      'Spring. The king himself cuts the first bamboo cage at the Split Weir, and the water runs out to the fields. A king who does not come is believed dead. The water-steward\'s men follow the water with a ledger. Your share is {due}.',
      'Pay for the water', 'The steward marks your field watered. By evening the ditch beside it is full.',
      'Open the sluice at night', 'Your field drinks for free. In the morning the steward\'s men are waiting at the sluice.', 'The weir is cut and the water reaches your field.', {}, { coin: -8, honor: -2 }] };

  R['POL-39'] = { want: 'To keep the Lantern Gate\'s toll and play Hesh, Taulen and the khagan against each other.',
    fear: 'That Hesh and the khagan agree, or that the silk moves north and starves the Gate.',
    place: ['The Lantern Gate', 'The Corridor\'s fort and toll, where every caravan pays a tenth and is given a felt token.'],
    own: ['phe_beacon', 'rite', { age: 17, who: 'male' }, 'A year in the tower',
      'Every son of a tower household keeps a beacon tower for a year before he may marry; a dark tower costs a horse.',
      'You are seventeen. Your father walks you to the {w1} on the ridge and hands you the oil jars. For a year you light it at dusk, every dusk, and the count-riders come at random.',
      'Climb the tower and keep it lit', 'A long year of oil and wind. The count-riders find your fire burning every time.',
      'Let your cousin take your year', 'Your cousin keeps the tower. Nobody in the valley will give you a daughter until you have kept one.', 'You keep your year in the beacon tower.', { wil: 1, skill: { survival: 1 } }, { honor: -3 }] };

  R['POL-40'] = { want: 'To take back the southern valleys of the Sable Woods while Hesh is busy in the south.',
    fear: 'That Hesh calls Sokdal\'s army south against Taulen again, as it did in 1062.',
    place: ['The White Head', 'The volcano on the Sable border and its crater lake; its ash of 946 fell on the Sunrise Isles.'],
    own: ['sok_leave', 'levy', { who: 'male' }, 'The Grandmother\'s leave',
      'No king of Sokdal goes to war until a shaman climbs the White Head and comes down with leave; then every village sends men.',
      'The shaman has come down from the White Head with the Grandmother\'s leave, and the generals have their war. The village elder reads out the names of the men the {w1} owes.',
      'Go with the village men', 'You march with the others behind the village guardians\' banner. The Grandmother gave leave; that is something.',
      'Hide in the hills until it passes', 'You come back after the levy. The elder has crossed your name off and written it again, lower down.', 'The Grandmother gives leave for war, and the village sends its men.', { honor: 1 }, { honor: -4 }] };

  R['POL-41'] = { want: 'The southern strand of the Tea-and-Horse Road, and a road to the sea down the Lio.',
    fear: 'A Taulen army coming up the Lio valley or through Shulai.',
    place: ['Lake Ezhu and the Three Pagodas of Azemu', 'Three brick pagodas on the lake shore, the tallest sixty-nine metres, older than any king\'s list.'],
    own: ['mes_torch', 'ward', { when: 'any', every: 2 }, 'The Torch Night',
      'On the longest day every household walks its field banks with pine torches to burn the insects.',
      'The longest day, and at dusk the whole valley lights pine torches. Every household walks its own field banks to burn the insects. Round Lake Ezhu forty thousand torches circle the water.',
      'Take a torch and walk your banks', 'You walk until the torch burns your fingers. The water doubles every light.',
      'Leave your banks dark', 'Yours is the one dark bank in the valley. The insects, everyone agrees, will come from there.', 'On Torch Night you walk your field banks with fire.', { happy: 2, skill: { husbandry: 1 } }, { honor: -2 }] };

  R['POL-42'] = { want: 'To win back for Lamhou\'s own merchants the right to sail abroad, lost in 1003.',
    fear: 'The Silo raiders, and the Tide Families\' smuggling, which take the trade the edict gives Lamhou.',
    place: ['The Wall of Ten Tongues', 'The foreign quarter\'s wall, with the city\'s notices pasted up in ten scripts.'],
    own: ['lam_drums', 'market', { cut: 0.08 }, 'The three drums at dusk',
      'Foreign trade is done inside the quarter by day; the port\'s superintendent takes his cut before the gate shuts on three drums.',
      'You sell in the foreign quarter. Before the third drum at dusk the superintendent\'s clerk takes his eighth of what you made, and any foreigner left in the city after dark is fined his cargo.',
      'Pay the clerk his eighth', 'He counts it twice and stamps your tally. You are out of the gate before the third drum.',
      'Sell your last bale after the drums', 'You make the sale. The night watch finds your buyer, and the fine comes to your door.', 'The superintendent takes his cut of your sale: {cut}.', { coin: -1 }, { coin: -10, honor: -1 }] };

  R['POL-43'] = { want: 'The law of 1003 repealed: the right to live ashore, marry landsmen and sit the exams.',
    fear: 'A Taulen admiral who decides to clear the coast.',
    place: ['The Low Water anchorage', 'Where three thousand boats lie lashed into a floating town every winter.'],
    own: ['tid_plank', 'name', { by: 'keep' }, 'The first step on the plank',
      'A child takes its first step on a plank between two boats; a child who falls in is named for the water.',
      'Your child, {child}, is old enough to stand. The families lay a plank between your {w2} and the next boat and put the child on it. Everyone watches the water.',
      'Let the child walk the plank', 'Three steps and a wobble. The child is caught before the water, and the grandmothers cheer.',
      'Carry the child across', 'You carry the child over. The grandmothers say nothing, which is worse than if they had.', '{child} takes a first step on the plank between the boats.', { happy: 2 }, { honor: -2, happy: -1 }] };

  R['POL-44'] = { want: 'Fewer exiles: Taulen sends three hundred disgraced officials a year, and their heirs hold the best coast.',
    fear: 'A cyclone year with no relief from the mainland; the Silo raiders.',
    place: ['The Exiles\' Graves', 'Graves of disgraced officials since 650, every one facing north toward the capital.'],
    own: ['tir_host', 'ward', { when: 'any', every: 4 }, 'The host family',
      'Every exile from the mainland is given a host family that answers for him, and the families compete for the great ones.',
      'A boat from the mainland has brought another disgraced official. The prince\'s steward goes from house to house for a host family that will feed him and answer for what he writes.',
      'Take the exile in', 'He eats a great deal and writes letters by lamplight. The steward thanks you, and so do the exile\'s friends.',
      'Say your house is too small', 'The steward finds another family. That family now knows people in Venshai, and you do not.', 'Your household feeds and answers for a mainland exile.', { coin: -4, honor: 2 }, { honor: -1 }] };

  R['POL-45'] = { want: 'To stop the Sennish settlers clearing the valleys; ninety thousand have come in twenty years.',
    fear: 'The Taulen pacification commissioners, and the Black Lamp\'s recruiters taking the young men.',
    place: ['The Ridge of Mothers', 'The meeting ground of the clans, where no tree is cut and no weapon is drawn.'],
    own: ['rdg_insult', 'ward', { when: 'any', every: 3 }, 'The singing of insults',
      'Feuds between clans go to the autumn meeting, where they are settled by a contest of sung insults; the loser pays a pig and laughs.',
      'Your clan\'s quarrel has gone to the autumn meeting on the Ridge of Mothers. The Speaker, who may not touch a weapon, calls the two sides to sing their insults at each other until one runs dry.',
      'Sing until they run out', 'You sing about their pigs, their roofs and their grandfather. The crowd laughs at both of you; the Speaker calls it even.',
      'Refuse to sing', 'You pay the pig without singing. Nobody laughs, and the feud is not quite over.', 'Your clan\'s quarrel is sung out at the autumn meeting.', { skill: { music: 1 }, happy: 1 }, { coin: -5, honor: -1 }] };

  R['POL-46'] = { want: 'To keep the tea price, and the secret of the white-hair tea bushes, inside the clans.',
    fear: 'The Tea Office\'s inspectors, who want every bush counted.',
    place: ['The Thousand-Year Bush', 'A tea tree the clans call a thousand years old. It is about seven hundred.'],
    own: ['tea_flush', 'ward', { when: 'any', every: 3 }, 'The first flush',
      'Only women pick and roast the first flush; a man who touches a first-flush leaf pays a pig.',
      'The first flush is coming in. The women are on the hill from dawn with baskets, and the men keep to the lower terraces, well away from the new leaves.',
      'Keep to your own work', 'The women roast the first leaves at dusk, and the smell comes down the hill to you.',
      'Help carry the baskets', 'A leaf sticks to your sleeve. The eldest mother sees it, and a pig is owed.', 'The first flush is picked by the women, as it must be.', { happy: 1 }, { coin: -6, honor: -1 }] };

  R['POL-47'] = { want: 'To be paid on time, and to run the horse fairs without Moriden\'s inspectors.',
    fear: 'The khagan\'s spring raid, and Moriden pulling the wall garrisons south for the war on Taulen.',
    place: ['The Ninth Gate', 'The brick gate-fort where the khagan\'s envoys come through the wall.'],
    own: ['wal_fire', 'ward', { when: 'any', every: 2 }, 'The tower fire at dusk',
      'Every wall household lights its tower fire at dusk; a tower dark at the count is fined a horse.',
      'Your household\'s stretch of wall has a tower, and the count-rider comes along the top at dusk. The fire must be lit by the time he reaches you, wind or no wind.',
      'Light it and wait for him', 'He reaches your tower with the fire already high and rides on without a word.',
      'Light it late', 'He gets there first. The fine is a horse, and he lets you pay it in silver.', 'Your tower fire is lit at dusk for the count.', { honor: 1 }, { coin: -10 }] };

  R['POL-48'] = { want: 'To bless dynasties again: both courts coming to the Weir-kings\' tombs for confirmation.',
    fear: 'The next great quake, and Phelkar\'s raids into the loess.',
    place: ['The Valley of the Weir-kings', 'Tombs from about 1400 before the Reckoning, the oldest in the east.'],
    own: ['hro_tomb', 'mourn', { share: 'eldest' }, 'The tomb room',
      'The dead lie in the cave house\'s tomb room until the clan tomb opens; the eldest keeps the house and sleeps beside them.',
      '{parent} is laid in the tomb room at the back of the {w1}, where the family\'s dead wait for the clan tomb to open. The eldest keeps the house and sleeps nearest them. The estate is {estate}; you get {got}.',
      'Sleep beside the dead tonight', 'You sleep in the tomb room. In the morning the pot on the roof has not swung.',
      'Sleep outside', 'You sleep in the yard. The family takes it for fear, not grief.', '{parent} goes into the tomb room. You get {got}.', { happy: -2 }, { honor: -2 }] };

  R['POL-49'] = { want: 'A seat on the Chancellery, and the right to sell rice north when the price is high.',
    fear: 'Lake Saulo\'s floods, and being the battlefield of the next war.',
    place: ['Lake Saulo', 'The Taulen\'s overflow lake, which takes the river\'s floods and gives them back in spring.'],
    own: ['mlk_basket', 'season', { m: 2, pct: 0.05, min: 5, cap: 15, paid: 'You carry your baskets and pay the dyke-levy: {due}.', short: 'You have no levy and few baskets. The {w1} records it.', shortFx: { honor: -2 } },
      'The baskets of earth', 'Every spring each household mends its stretch of the {w1}; the man who carries most baskets is dyke-head.',
      'Spring repairs on the {w1}. Every man carries baskets of earth up the bank and a boy notches a stick for each one. The man with the most notches is dyke-head for the year. There is also a levy of {due}.',
      'Carry baskets until dark', 'Your stick has forty notches. Not the most, but nobody laughs at it.',
      'Pay the levy and go fishing', 'You pay. The dyke-head is a man who carried more than you, and he remembers it.', 'You carry earth to the ring dyke in spring.', { sta: 1 }, { honor: -2 }] };

  R['POL-50'] = { cc: 1, want: 'Peace. War shuts the canal, and the porters starve.',
    fear: 'Either empire breaking the Treaty of the Weir.',
    place: ['The Bridge of Two Customs', 'A 400 m bridge over the Sau with a customs post at each end, one for each empire.'],
    own: ['tsa_bridge', 'market', { cut: 0.1 }, 'The Bridge of Two Customs',
      'A merchant pays customs at the north post, crosses the bridge, and pays again at the south; except on New Year\'s Day.',
      'You sell across the river. The north post takes its customs; four hundred metres on, the south post takes its own, and both clerks stamp your paper with the same bored face.',
      'Pay both posts', 'Two stamps, two fees. The goods arrive, which is more than war would let them.',
      'Wait for New Year\'s Day', 'You wait, and pay nothing, but your buyer would not wait. You sell lower.', 'You pay both customs posts on the bridge: {cut} in all.', {}, { coin: -6 }] };

  R['POL-51'] = { want: 'To keep the Long Count unbroken and the observatory\'s records out of either court\'s hands.',
    fear: 'A court that rewrites the Count, as the Southern Court tried in 977.',
    place: ['The Bronze Gnomon and the Hall of Shelves', 'A twelve-metre gnomon read at every noon since 640 before the Reckoning, and one shelf of records for each year.'],
    own: ['hau_noon', 'ward', { when: 'any', every: 3 }, 'The noon of the Count',
      'At every noon the Count\'s clerks read the gnomon\'s shadow; at noon the whole city falls quiet so they can.',
      'The bell before noon. Carts stop, the market stops talking, and in the square the clerks of the Count stoop over the Bronze Gnomon\'s shadow and write the year, the day and the weather.',
      'Stand still with everyone', 'You stand still. A clerk calls the length of the shadow, and the city starts again.',
      'Finish your sale', 'You keep talking through the noon. Heads turn. Someone writes something down.', 'At noon you stand still for the Count.', { piety: 1 }, { honor: -2 }] };

  R['POL-52'] = { want: 'To keep the salt monopoly, and to win the right to sell to Sokdal.',
    fear: 'Southern smugglers selling Taulen salt in the north.',
    place: ['The Tower of the White Pans', 'A prison tower in the salt pans; the emperor\'s brother lives at the top of it.'],
    own: ['slt_seal', 'law', {}, 'The Salt Lord\'s seal',
      'Every bushel of salt is weighed before a priest of the Dyke Saints and sealed; false salt is drowned with its seller.',
      'After your punishment the Salt Lord\'s clerk reads you the salt law again, slowly. Every bushel weighed before a priest, every bushel sealed. False salt goes into the sea in a sack, with its seller.',
      'Swear on the seal', 'You swear before the priest that your salt will be sealed. He makes you say it twice.',
      'Say salt is salt', 'The clerk writes your name in the book of watched men.', 'The salt law is read to you again after your punishment.', { piety: 1 }, { honor: -3 }] };

  R['POL-53'] = { want: 'To keep the Mountain Lamp free of the Ledger officials who would register every monk for tax.',
    fear: 'The Black Lamp, whose leader was the White Cliff\'s own prior.',
    place: ['The Summit Lamp', 'A lamp on the White Cliff\'s summit, kept burning since 588.'],
    own: ['wcl_climb', 'rite', { age: 18, who: 'all' }, 'The night climb',
      'A novice of the abbey lands climbs to the summit shrine in one night with a lamp; if it goes out, he climbs again.',
      'You are eighteen, and the abbey lands ask every young man and woman for the night climb: 3,099 metres to the summit shrine, in one night, with a lit lamp. If it goes out you climb again the next night.',
      'Climb with the lamp', 'Your lamp gutters twice and holds. At dawn you set it beside the Summit Lamp.',
      'Say your knees are bad', 'The monks shrug. Your knees, they say, will be there next year.', 'You climb the White Cliff by night with a lamp.', { sta: 1, wil: 1, piety: 2 }, { honor: -2 }] };

  R['POL-54'] = { want: 'To be made a king by one of the courts, and to choose the one that pays more.',
    fear: 'That the courts make peace and crush him together, or his officers do to him what he did.',
    place: ['The West Gate', 'The pass between the upper Sau and the Red Basin, held by the Protector\'s best regiment.'],
    own: ['seu_uncle', 'census', { every: 2, m: 8, per: 2, line: 'The village soldier counts {n} in your house and takes {due}.' },
      'The village uncle', 'Each soldier holds a named village\'s tax and rides there every harvest to count heads and collect.',
      'Harvest, and your village\'s soldier rides in. The children call him uncle. He counts the heads in your house, {n} of them, and takes {due}, two strings a head.',
      'Feed the uncle and pay', 'He eats with you, pays compliments to the cook and rides off with the strings.',
      'Hide the children in the loft', 'He counts the bowls on the shelf instead, and laughs, and takes the full sum.', 'The village uncle counts your house at harvest.', {}, { coin: -4, honor: -1 }] };

  R['POL-55'] = { want: 'To bring down the Ledger itself, and burn every census roll in both empires.',
    fear: 'Hunger, on poor hill land with 900,000 mouths; and a Taulen army whose men have been paid.',
    place: ['The Hall of Burned Rolls', 'A barn where 1.1 million census pages were burned in 1097. The floor is still black.'],
    own: ['blk_burn', 'rite', { age: 17, who: 'all' }, 'Burning your own name',
      'Every member of the Commune burns his own census entry on joining; the Commune keeps no lists.',
      'You are seventeen and old enough to join. A Wick puts a page of the old census in your hand: your household\'s entry, in a clerk\'s neat brush. Burn it, and no Ledger anywhere will know you.',
      'Burn the page', 'It curls and goes. You are nobody, which here is the point.',
      'Keep it in your shirt', 'The Wick says nothing. You are still written down somewhere, and so are they, now.', 'You burn your own census entry.', { wil: 1 }, { honor: -3 }] };

  R['POL-56'] = { want: 'A Sennish emperor in Moriden again, of the Ishe, with the duke as First Minister.',
    fear: 'Discovery.',
    place: ['The Velden dykes', 'Fifty kilometres of the Hesh\'s northern dykes, and the duke\'s men on every one.'],
    own: ['vel_south', 'ward', { when: 'landed', every: 2 }, 'Bowing to the south',
      'On the Count\'s New Year the duke\'s household dresses in Jade Dynasty clothes behind closed doors and bows to the south.',
      'The New Year of the Count. Behind closed doors the duke\'s people put on the old Jade Dynasty dress and bow to the south, to the emperor in Venshai. You are trusted enough to be asked.',
      'Bow to the south', 'You bow. Nobody speaks of it after. You are one of them now, whatever that will cost.',
      'Plead a fever and stay home', 'You stay home. The duke\'s steward visits the next week and asks after your health.', 'You bow to the south behind closed doors.', { honor: 1 }, { honor: -2 }] };

  R['POL-57'] = { want: 'Freedom from Taulen\'s tribute, and the salt road to Meshilo.',
    fear: 'Taulen\'s pacification, and the Black Lamp in the northern valleys.',
    place: ['The stilt palace of Ngorusau', 'Built over the river so that no road reaches the king\'s door.'],
    own: ['ngo_tribute', 'census', { every: 3, m: 9, per: 1, line: 'The tribute-counter counts {n} in your house: {due} for Venshai.' },
      'The elephant tribute', 'Every third year the king sends elephants and silver to Venshai, and every household is counted for its share.',
      'A tribute year. The king\'s counters come up the valley before the great procession to Venshai: so many elephants, so much silver, and a share from every house. They count {n} in yours and ask {due}.',
      'Pay the tribute share', 'You pay. In spring you see the elephants go down the road, painted, with your silver on them somewhere.',
      'Say the counters miscounted', 'They count again, slowly, out loud, in front of the neighbours.', 'Your household pays its share of the tribute to Venshai.', {}, { coin: -3, honor: -1 }] };

  // ---- the Twin Rivers' peoples
  C['CUL-25'] = [
    ['pls_tablet', 'wed', { dowry: 1 }, 'The bride and the tablets', 'A new bride bows to the household\'s ancestor tablets before she bows to her husband.',
      'The wedding. Before anything else the bride is taken to the shelf by the door where the tablets stand, eldest on the left, and bows to each of them. Only then does she bow to her husband. The dowry is {dowry}.',
      'Bow to the tablets first', 'The tablets are bowed to, the husband after. The old aunts approve of the order.',
      'Skip the tablets; it is late', 'The aunts are horrified. Your wedding is talked of for the wrong reason.', 'The bride bows to the tablets, then to the groom.', { happy: 2 }, { honor: -3 }],
    ['pls_dyke', 'levy', { who: 'male' }, 'One man in five', 'When the Hesh rises every village sends one man in five to the dyke; a son sent instead of silver earns a red mark.',
      'The Hesh is rising and the {w1} has come with his list. One man in five to the dyke, or the village pays. A household that sends a son is entered in the Ledger with a red mark of merit.',
      'Go to the dyke', 'Ten days of mud, ropes and baskets. Your household\'s {w2} gets its red mark.',
      'Pay the silver instead', 'You pay. The {w2} gets no mark, and the warden looks at you as at a purse.', 'You go to the dyke when the Hesh rises.', { sta: 1, honor: 1 }, { coin: -6 }],
    ['pls_newyear', 'season', { m: 0, pct: 0.08, min: 10, cap: 25, paid: 'You settle your debts before the New Year: {due}.', short: 'You go to your creditor\'s door on New Year\'s morning and bow. The debt is carried.', shortFx: { honor: -2, happy: -2 } },
      'Debts before the New Year', 'Debts are settled before the New Year; who cannot pay bows at his creditor\'s door, and the debt is carried.',
      'The last days of the year, and every debt in the village is being settled. What you owe comes to {due}. A man who cannot pay goes to his creditor\'s door on New Year\'s morning and bows.',
      'Settle what you owe', 'You pay and walk home light. New Year\'s morning you can spend in bed.',
      'Bow at the door instead', 'You bow on the cold step. The debt is carried, and so is the memory of it.', 'You settle your debts before the New Year.', {}, { honor: -2 }],
  ];
  C['CUL-26'] = [
    ['lks_boat', 'wed', { dowry: 1 }, 'The wedding boat', 'Weddings are held on boats, and the bride is rowed across open water so her old district\'s spirits cannot follow.',
      'Your wedding is held on a boat. The bride is rowed out across the open lake, far enough that her old district\'s spirits lose the scent and turn back to the reeds. The dowry is {dowry}.',
      'Row the long way round', 'You row out past the last reed bed. Whatever was following stays behind.',
      'Hold it on the bank; the lake is rough', 'You marry on dry land. Every bad luck of the first year is blamed on the spirits that followed her.', 'You are married on a boat on the open lake.', { happy: 2 }, { happy: -3 }],
    ['lks_drown', 'mourn', { share: 'equal' }, 'The straw figure', 'A drowned man is fished up with a rice-straw figure of himself, and the estate is shared among the children alike.',
      '{parent} is dead. The district makes a rice-straw figure and lays it in the grave beside the body, so that whatever the water took is buried too. The estate, {estate}, goes to the children alike: {got} to you.',
      'Weave a straw figure', 'Your figure is clumsy. It goes into the grave anyway, face up.',
      'Bury the body only', 'The old women say a part of {parent} is still out on the lake.', '{parent} is buried with a straw figure. You get {got}.', { happy: -2 }, { happy: -3 }],
  ];
  C['CUL-27'] = [
    ['dlt_dowry', 'wed', { dowry: 2 }, 'Reels on the red table', 'A daughter\'s dowry is counted in reels of silk, shown to the groom\'s family on a red table.',
      'The betrothal. The bride\'s family lays the dowry out on a red table, {w1} by {w1}, and the groom\'s mother counts. Here the reels are twice what a plain dowry would be: {dowry}.',
      'Count the reels aloud', 'The groom\'s mother counts every reel and smiles at the last. The match is made.',
      'Ask for coin instead of silk', 'You get coin, and a reputation in the guild halls for not knowing what silk is.', 'The dowry is counted out on the red table: {dowry}.', { happy: 2 }, { honor: -2 }],
  ];
  C['CUL-28'] = [
    ['grg_brine', 'ward', { when: 'any', every: 4 }, 'The cup of brine', 'A visitor is given the household\'s own brine to taste before tea; to spit it out is an insult.',
      'A guest at the door. Before tea, before a word, you pour a cup of your household\'s own brine from the {w1} and hold it out. To spit it out is an insult; to praise it is to be a friend.',
      'Pour the brine', 'He drinks it, makes a face and praises it. Now there can be tea.',
      'Go straight to the tea', 'The guest drinks your tea politely. He tells the village you have no well worth tasting.', 'A guest tastes your brine before tea.', { happy: 1 }, { honor: -1 }],
  ];
  C['CUL-29'] = [
    ['lss_names', 'wed', { dowry: 1 }, 'The count of generations', 'At a wedding both clans\' old names are spoken with the full count of generations.',
      'The wedding, and the clan elders stand to speak the old names with the full count of generations: Hro, Dza, Kun, and every father back to the Weir-kings. It takes an hour. The dowry is {dowry}.',
      'Stand through the whole count', 'Your legs ache by the ninetieth father. The elders nod at the end as if it went quickly.',
      'Ask them to shorten it', 'They shorten it. Somewhere, an old woman says, a grandfather has been forgotten.', 'The generations are counted at your wedding.', { happy: 2 }, { honor: -2 }],
  ];
  C['CUL-30'] = [
    ['sab_pole', 'ward', { when: 'any', every: 3 }, 'The spirit pole', 'Every banner household keeps a spirit pole in its yard and feeds the crows on it at dawn.',
      'Dawn. The crows are on the spirit pole in your yard, waiting. Every banner household feeds them first thing, before the horses, before itself.',
      'Feed the crows', 'They take the meat and shout about it. The yard is lucky for another day.',
      'Feed the horses first', 'The crows leave for your neighbour\'s pole. Your grandmother watches them go.', 'You feed the crows on the spirit pole at dawn.', { piety: 1 }, { piety: -2 }],
  ];
  C['CUL-31'] = [
    ['skd_guard', 'ward', { when: 'any', every: 4 }, 'The village guardians', 'Every village keeps carved wooden guardians at its entrance and replaces them every twelve years.',
      'The year of new guardians. The old grandfather and grandmother posts at the {w1}\'s entrance are pulled up and burned, and every household gives a day to carving the new ones.',
      'Give your day to the carving', 'You plane the grandmother\'s nose. It is a little crooked; the elders say she will be fierce.',
      'Give coin instead of the day', 'The coin is taken. The posts go up without any of your work in them.', 'You help carve the village guardians.', { skill: { craft: 1 } }, { coin: -3 }],
  ];
  C['CUL-32'] = [
    ['cor_token', 'market', { cut: 0.1 }, 'The silk tenth', 'A caravan that pays the tenth at Dzuden gets a felt token with the king\'s lamp; one without is turned back.',
      'You trade on the Corridor. At Dzuden the king\'s men take the {w2}, the tenth, and give you a felt token stamped with the lamp. Without one, every tower turns you back.',
      'Pay the tenth and take the token', 'The token is warm from the stamp. The towers let you through.',
      'Try the hill path round Dzuden', 'A tower sees your dust. You pay the tenth and a fine for the walk.', 'You pay the silk tenth at Dzuden: {cut}.', {}, { coin: -8 }],
  ];
  C['CUL-33'] = [
    ['nfl_chain', 'name', { by: 'parent' }, 'The name-chain', 'A son\'s first syllable is his father\'s last, so a man can recite fifty generations as one chain.',
      'Your child is born. Here a child\'s first syllable is a parent\'s last, so the {w2} goes on one more link. {child} it is. Now the whole chain must be recited at the naming.',
      'Recite the chain without a slip', 'Fifty links, and not one dropped. The old men nod.',
      'Stumble at the thirtieth link', 'You stumble. A man who forgets a link in public loses face for a year, and you do.', '{child} is named, one more link in the chain.', { happy: 2 }, { honor: -3 }],
  ];
  C['CUL-34'] = [
    ['ryr_rice', 'name', { by: 'keep' }, 'Named at the first harvest', 'A child is named at the first rice harvest after its birth, and its parents are called Father-of and Mother-of it.',
      'The rice harvest after your child\'s birth, and the naming. The child is {child} now, and from today the village calls you by your child\'s name: Father-of, Mother-of, for the rest of your days.',
      'Answer to your new name', 'Someone calls you by it at the well, and you turn. It fits.',
      'Keep using your own name', 'You keep your old name. People use it, but carefully, as if it were a bit old-fashioned.', '{child} is named at the first rice harvest.', { happy: 2 }, { happy: -1 }],
  ];
  C['CUL-35'] = [
    ['tdf_wed', 'wed', { dowry: 1 }, 'Three boats for three days', 'A boat-wedding is three boats lashed together for three days; the bride\'s boat is cut loose last.',
      'Your wedding: three boats lashed together for three days of rice wine and drums. On the third night the bride\'s family\'s boat is cut loose last and drifts away. The dowry is {dowry}.',
      'Cut the rope yourself', 'You cut it. Her family\'s boat goes out on the tide, and they are singing.',
      'Keep the boats lashed another day', 'You run out of rice wine on the fourth day and everyone blames you.', 'Three boats are lashed for your wedding.', { happy: 3 }, { coin: -5 }],
  ];
  C['CUL-36'] = [
    ['cst_barefoot', 'ward', { when: 'any', every: 3 }, 'Barefoot to the temple', 'When a junk comes home its crew walks barefoot to the temple before they see their families.',
      'A junk comes home with men you know aboard. Before anything else they walk barefoot from the quay to the temple, past their own doors, and you are expected to walk with your kin.',
      'Walk barefoot with them', 'The stones are hot. At the temple door you see their faces, finally, and they are home.',
      'Meet them at the quay', 'You hug your cousin on the quay. He pulls away, and the old sailors spit.', 'You walk barefoot to the temple with a junk\'s crew.', { piety: 1, happy: 1 }, { honor: -2 }],
  ];
  C['CUL-37'] = [
    ['tri_tattoo', 'rite', { age: 17, who: 'female' }, 'The face pattern', 'A girl\'s face is tattooed in her mother\'s clan pattern over three days; she may not speak until it heals.',
      'Your mother\'s sister has the needles ready. Three days of her clan\'s pattern, line by line, and you may not speak until it heals. No one can forge a Tirun face.',
      'Lie still and keep silent', 'Three days, then ten of silence. The face in the water is your mother\'s, and your own.',
      'Ask for a smaller pattern', 'They give you a smaller one. Old women read it and look sorry for you.', 'Your face is tattooed in your mother\'s pattern.', { wil: 1, looks: 1 }, { honor: -2 }],
  ];
  C['CUL-38'] = [
    ['wlh_gate', 'wed', { dowry: 1 }, 'The night at the gate', 'A household\'s gate is its name; on his wedding night the eldest son sleeps at the gate.',
      'Your wedding, and the old law of the {w1}: the eldest son sleeps the wedding night at the household\'s gate, wrapped in a felt, with a bow. The bride waits. The dowry is {dowry}.',
      'Sleep at the gate', 'Cold, and nothing comes through the gate. The bride says that was the point.',
      'Sleep in the house', 'Nothing comes through the gate. The neighbours say it is luck, not you.', 'You keep the night at the gate.', { honor: 1 }, { honor: -2 }],
  ];
  C['CUL-39'] = [
    ['tmc_mother', 'mourn', { share: 'daughters' }, 'The mother\'s line', 'Land, houses and tea trees pass from mother to daughter; a man\'s children are not his clan.',
      '{parent} is buried on the tea hill. Here everything goes down the {w3}, from mother to daughter: the house, the land, the trees. The estate is {estate}. Your share is {got}.',
      'Let the trees go to the daughters', 'The trees go to the daughters. Everyone drinks the funeral tea from the same pot.',
      'Ask the clan for a son\'s share', 'The clan hears you out and laughs, kindly.', 'The estate goes down the mother\'s line. You get {got}.', { happy: -2 }, { honor: -2 }],
  ];
  C['CUL-41'] = [
    ['cnl_lock', 'name', { by: 'keep' }, 'Named for the lock', 'A child is named for the lock where it was born, and the lock-children of one lock call each other cousin.',
      'Your child is born on the water by a {w1}, and the keeper comes out with a lamp to see. {child} will carry the lock\'s name after its own, and every child of this lock will call it cousin.',
      'Show the child to the lock-keeper', 'He holds the child up over the gate and says the lock\'s name. A dozen cousins cheer from the barges.',
      'Keep the child below deck', 'The keeper goes back in. The lock-children will not call yours cousin.', '{child} is named for the lock of its birth.', { happy: 2 }, { happy: -2 }],
    ['cnl_oath', 'rite', { age: 18, who: 'male' }, 'The brotherhood oath', 'The canal brotherhoods swear their oaths in the Dyke Saints\' shrines; an oath-breaker is pushed in at the deepest lock.',
      'You are eighteen, and the haulers\' brotherhood will take your oath at the Dyke Saints\' shrine by the {w1}. A man who breaks it is pushed in at the deepest lock.',
      'Swear at the shrine', 'You swear with your hand on the {w3} rope. The brothers slap your back hard enough to hurt.', 'Haul without swearing', 'You haul alone. The brotherhood\'s barges pass you at every lock.', 'You swear the haulers\' oath at the shrine.', { honor: 1, sta: 1 }, { honor: -2 }],
  ];
  C['CUL-42'] = [
    ['ngf_grove', 'grave', {}, 'The elephant grove', 'Elephants and their mahouts are buried in the same grove; the people of the hills go into it too.',
      '', '', '', '', '', 'You are buried in the {w1}, where the elephants of your village lie beside their mahouts.', {}],
  ];
})();
