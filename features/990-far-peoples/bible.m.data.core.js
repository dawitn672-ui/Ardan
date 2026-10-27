// Far realm bibles, the Southern Peninsulas (990-far-peoples). Format: see bible.r.data.core.js.
(function () {
  const R = A.FARP_REALMS = A.FARP_REALMS || {}, C = A.FARP_CULT = A.FARP_CULT || {};

  R['POL-91'] = { want: 'To take back the Upper Plain and the Gorge Gate from Kethra\'s Bought Riders, and the horse road with them.',
    fear: 'Horses: none breed well in the plain\'s heat, and every war horse comes through an enemy\'s gate.',
    place: ['The burning stairs of the Sona at Vahrapora', 'Two kilometres of stone steps where three hundred bodies are burned a day.'],
    own: ['vhr_weigh', 'mourn', { share: 'temple' }, 'The Debt Weighing', 'At every death the temple reads the dead man\'s ledger of debts and gifts aloud and names the house he will be reborn into.',
      'At the burning stairs the temple reads {parent}\'s ledger aloud, debt by debt and gift by gift, and names the house of the next birth. The temple takes its tenth of {estate} first. You get {got}.',
      'Pay to strike a last debt', 'The ledger-keeper strikes a line. The house named is a little higher than it would have been.',
      'Let the ledger stand', 'The house named is a low one. Your aunts weep for the wrong reason.', 'The temple weighs {parent}\'s debts at the burning. You get {got}.', { coin: -3, piety: 1 }, { honor: -1, happy: -3 }] };
  R['POL-92'] = { want: 'Vahrapora and the Sona\'s holy stairs, and to be called Great Kings by the temples.',
    fear: 'The horse road from the plateau being cut, and the Stall-Masters\' knives.',
    place: ['The Gorge Gate', 'The only horse road from the plateau down to the Gulf Plain.'],
    own: ['kth_remount', 'muster', { m: 9, who: 'male', need: 'mounted', ok: [{ skill: { riding: 1, mounted: 1 } }, 'The stall-master looks your horse over and passes it for the stables.'], short: [{ coin: -8 }, 'You come without a horse. The stall-master fines you the price of a remount\'s keep.'] },
      'The stable count', 'Every autumn the stables count horses and riders; a free man of the plain brings a horse or pays toward a remount.',
      'Autumn, and the stall-masters count the kingdom\'s horses at the {w1}. Every free man of the Upper Plain brings a horse to be counted for the Riders, or pays toward a remount from the Gorge Gate.',
      'Bring your horse to the count', 'It is counted and branded with the stall\'s mark. It is half the Riders\' now.',
      'Bring a mule and smile', 'The stall-master does not smile.', 'Your horse is counted for the stables.', {}, { coin: -10, honor: -1 }] };
  R['POL-93'] = { want: 'To pay neither overlord and keep both away, and to hold the Gulf\'s sea trade.',
    fear: 'Cyclones, and rivers that move.',
    place: ['The Tiger Mangroves', 'The delta\'s sea face, where the honey-gatherers wear masks on the backs of their heads.'],
    own: ['juv_race', 'ward', { when: 'any', every: 2 }, 'The Turning-Tide Race', 'Every district\'s sixty-oar boat races at the year\'s highest tide; the winning district pays no tax that year.',
      'The year\'s highest tide, and the race. Your district\'s sixty-oar war boat needs every arm, and the winning district pays no tax this year.',
      'Take an oar', 'Your hands bleed by the second bend. Your boat comes in third, and the district buys the drink anyway.',
      'Watch from the bank', 'Your district loses by a length. People count the men on the bank.', 'You row for your district in the tide race.', { sta: 1, happy: 1 }, { honor: -2 }] };
  R['POL-94'] = { want: 'To be left alone, and to keep Vahra\'s road-builders out.',
    fear: 'Vahra\'s road through the Rainwall, abandoned in 880 and begun again in 1101.',
    place: ['The Rain Gate', 'Where 11,800 millimetres of rain fall in a year and the stones stand in rows on the ridges.'],
    own: ['stp_stake', 'levy', { who: 'adult' }, 'Pulling the stakes', 'No road is allowed through the Rainwall; in war every household goes out at night to pull up the road-builders\' stakes.',
      'War on the ridges, and the road-builders\' stakes are in the hills again. Every household of the {w1} sends someone out at night with a knife and a sack.',
      'Go out and pull stakes', 'A wet night and forty stakes. By morning the road-builders\' line is gone again.',
      'Stay by your fire', 'The others go. They say, for years, who did not.', 'You go out at night to pull the road-builders\' stakes.', { skill: { stealth: 1 } }, { honor: -3 }] };
  R['POL-95'] = { want: 'To abolish the debt-ledgers.',
    fear: 'Vahra\'s temple armies.',
    place: ['The Gate of Unmarking', 'Where everyone takes off the thread, the brow mark and the house name before they come in.'],
    own: ['rin_unmark', 'ward', { when: 'any', every: 3 }, 'The Gate of Unmarking', 'At the city gate everyone takes off whatever marks their birth house; inside, everyone has a given name only.',
      'You come back to Rinnath from the plain with your house\'s thread still on your wrist. At the Gate of Unmarking the Renouncers wait with a basket for threads and brow marks.',
      'Drop the thread in the basket', 'You walk in with your given name and nothing else.',
      'Hide the thread in your sleeve', 'A Renouncer sees the bump in your sleeve and looks sad, which is worse than angry.', 'You leave your house marks at the Gate of Unmarking.', { piety: 1 }, { honor: -2 }] };
  R['POL-96'] = { want: 'To keep the white elephants breeding and the Sleeper dreaming.',
    fear: 'A white elephant dying without a calf.',
    place: ['The Elephant Stair', 'The steps down to the Sona where three hundred priests wash fourteen white elephants at dawn.'],
    own: ['dvr_dung', 'market', { cut: 0.06 }, 'The temple\'s share', 'Whatever is sold within sight of the Elephant Stair pays the temple a share, as the white elephants\' dung is sold to pilgrims.',
      'You sell in the temple-city. Everything sold within sight of the Elephant Stair pays the Sleeper\'s temple a share; even the white elephants\' dung is sold to pilgrims as a blessing.',
      'Pay the temple\'s share', 'The priest drops it in the box and blesses your scales.',
      'Sell round the corner', 'A priest finds you round the corner. The share is larger there.', 'The temple takes its share of your sale: {cut}.', { piety: 1 }, { coin: -6 }] };
  R['POL-97'] = { want: 'The Gulf\'s pearl banks and the coast toll.',
    fear: 'Ayamo\'s army coming over the Western Comb.',
    place: ['The Sea Stone', 'The coronation stone under the sea, uncovered only at the lowest tide.'],
    own: ['rkh_two', 'census', { every: 2, m: 2, per: 1, line: 'Two boats leave with the tribute; your house\'s share for {n} is {due}.' },
      'Two boats for two masters', 'Tribute goes to Vahra in rice and to Ayamo in pearls on the same day, by two boats leaving together; every house pays its share.',
      'Tribute day. Two boats are loaded side by side in the harbour, one with rice for Vahra and one with pearls for Ayamo. The harbour clerk counts {n} in your house and asks {due}.',
      'Pay for both boats', 'The two boats leave together and part at the harbour mouth.',
      'Pay for one boat only', 'The clerk asks which master you would like to explain that to.', 'Your house pays its share of the double tribute.', {}, { coin: -4, honor: -1 }] };
  R['POL-98'] = { want: 'To win back the tributaries Thinsak has drawn away, and make Ayamo pay again.',
    fear: 'That the Turning Lake fails to turn, as in 1096, and Thinsak\'s rise.',
    place: ['The temple-mountain of Thareang', 'Five towers sixty-five metres high on a moated square one and a half kilometres a side.'],
    own: ['prv_turn', 'ward', { when: 'any', every: 2 }, 'The Turning', 'On the day the lake\'s river turns, the king cuts a rope across it with a golden knife, and two thousand boats race down.',
      'The river has turned back toward the sea. The king cuts the rope with a golden knife, and two thousand boats go down the river at once. Your village has a boat.',
      'Row with the village', 'You row until the river is all boats. Your village comes in nowhere and sings all the way home.',
      'Fish while everyone races', 'The fish are easy to catch. The village does not forget who was fishing.', 'You race down the turned river with your village.', { happy: 2 }, { honor: -2 }] };
  R['POL-99'] = { want: 'To stop building temples, and to take back the temple lands.',
    fear: 'The temples and their monks, who hold a third of the fields and pay nothing.',
    place: ['The temple plain', 'Two thousand six hundred shrines on a hundred square kilometres, and another going up each month.'],
    own: ['aym_shrine', 'ward', { when: 'any', every: 3 }, 'A brick for merit', 'Every man who can builds a shrine for merit; a poor man gilds a brick.',
      'A new shrine is going up at the edge of the plain. Every man who can gives toward it; a rich man builds one, a poor man gilds a single brick with his name on it.',
      'Gild a brick', 'Your brick goes into the shrine wall, gold side out, your name on the back where only the Lamp can read it.',
      'Keep your coin for rice', 'You eat better this month. The monks note who gave nothing.', 'You gild a brick for a new shrine.', { coin: -3, piety: 2 }, { piety: -2 }] };
  R['POL-100'] = { want: 'Pravith\'s crown; the old tributaries are coming over to Thinsak one by one.',
    fear: 'Pravith\'s elephants, and the Elephant Lords\' price.',
    place: ['The moated town of Thinsak', 'The young capital, square moats inside square moats, every lane numbered.'],
    own: ['tns_count', 'census', { every: 3, m: 1, per: 1, line: 'The counters set your rank by {n} in your house; the head-silver is {due}.' },
      'Counted by men', 'Every man is counted by the men he commands; the number is his rank and his name at court, and the head-silver follows it.',
      'The king\'s counters are in the {w1}. Every man is counted by the people he commands: a farmer is twenty, a lord ten thousand. Your house is counted at {n}, and the head-silver is {due}.',
      'Be counted and pay', 'You are a number now, and a small one. The king knows it.',
      'Claim more than you have', 'They count again in the street. Your number goes down.', 'You are counted by the men you command.', {}, { coin: -3, honor: -2 }] };
  R['POL-101'] = { want: 'The March to the South, down Panduro\'s coast.',
    fear: 'Taulen\'s armies, beaten in 939 and 1077, and Meshilo\'s claim on the upper Lio.',
    place: ['The governors\' citadel', 'Taken from Taulen in 939 and kept, with the old governors\' seals still on its gates.'],
    own: ['lik_exam', 'exam', { every: 3, m: 7, who: 'free', s: 'learning', s2: 'int', d: 58, pass: [{ fame: 3, honor: 2, coin: 10 }, 'You pass the Liokan exams and are entered as an official of the kingdom.'], fail: [{ happy: -2 }, 'Your name is not on the board. The village schoolmaster sighs.'] },
      'The Liokan exams', 'Officials sit exams copied from Taulen\'s, written in Liokan with Sennish letters.',
      'An exam year. The candidates gather in the citadel with brushes and rice. The papers are Taulen\'s questions, written in Liokan with Sennish letters; three Liokans have even passed Taulen\'s.',
      'Sit the exam', 'Two days of brushwork. You write more than you knew you knew.',
      'Leave it to the scholars', 'You stay home. The schoolmaster does not look surprised.', 'You sit the Liokan exams.', {}, { happy: -1 }] };
  R['POL-102'] = { want: 'To survive Lioka\'s march south.',
    fear: 'Lioka.',
    place: ['The red-brick towers', 'The old temple towers of the Sandalwood Coast, red against the green hills.'],
    own: ['pnd_licence', 'law', {}, 'The king\'s sandalwood', 'Sandalwood is cut only on the king\'s licence; a tree cut without it costs the cutter his hand.',
      'After your punishment the king\'s forester reads you the sandalwood law. Every tree is the king\'s; a tree cut without a licence costs the cutter his hand. He looks at your hands while he reads.',
      'Swear never to cut without a licence', 'He makes you swear on a stick of sandalwood. It smells of every temple on the coast.',
      'Say the hills are full of trees', 'He writes your name in the forest book.', 'The sandalwood law is read to you.', {}, { honor: -3 }] };
  R['POL-103'] = { want: 'One overlord, not two, and a better tin price.',
    fear: 'Both overlords.',
    place: ['The tin hills', 'Stream-cut hills behind the port, every stream panned for tin since anyone remembers.'],
    own: ['trk_hats', 'wed', { dowry: 1 }, 'A dowry in hats', 'Tin is cast in hat shapes, and a bride\'s dowry is counted in tin hats.',
      'Your wedding. The bride\'s dowry is carried in and stacked on the floor: tin cast in the shape of hats, counted one by one. It comes to {dowry}.',
      'Count every hat aloud', 'The stack is taller than the bride\'s youngest brother. The room applauds.',
      'Weigh them instead', 'The weight is right. Everyone says the count would have been more.', 'The dowry is counted in tin hats: {dowry}.', { happy: 2 }, { honor: -1 }] };
  R['POL-104'] = { want: 'To become the Strait\'s second anchorage and take Tirangga\'s share.',
    fear: 'Suraeng\'s toll-ships.',
    place: ['The Lady\'s Jetty', 'Where every captain who anchors is met and taken to eat with the Harbour-Lady.'],
    own: ['brn_meal', 'market', { cut: 0.05 }, 'The meal with the Lady', 'A captain who anchors at Bauraan eats a meal with the Harbour-Lady before he may trade, and pays for it.',
      'You trade in Bauraan, and before a bale changes hands you eat with the Harbour-Lady, as every captain does. The fish is good. The bill is part of the trade.',
      'Eat and praise the fish', 'She asks about every port you know. You tell her too much.', 'Refuse the meal and trade', 'Nobody will buy from you until you have eaten.', 'You eat with the Harbour-Lady and pay: {cut}.', {}, { coin: -5 }] };
  R['POL-105'] = { want: 'To keep the slavers of Kethra and Rakhol out of the ridges.',
    fear: 'Kethra\'s raids.',
    place: ['The Ridge of Mothers\' Trees', 'The clans\' meeting ground, where the mother trees are older than the parting.'],
    own: ['crd_move', 'ward', { when: 'any', every: 4 }, 'The twelve-year move', 'Villages move every twelve years when the fields tire; a village is named for its ridge, not its houses.',
      'The fields have tired. The {w1} moves along the ridge to new ground, as it does every twelve years, and every household carries its own roof poles.',
      'Carry your poles and build again', 'A month of building. The village is in a new place with its old name.',
      'Stay in the old house', 'You stay. The village is gone over the ridge, and the slavers know where the empty houses are.', 'Your village moves along its ridge.', { sta: 1 }, { happy: -3 }] };
  R['POL-106'] = { want: 'A better salt price, and Pravith\'s tribute, paid in salt, cut.',
    fear: 'Thinsak\'s raids, and Pravith\'s tax.',
    place: ['The Black Well', 'The sacred brine spring, whose salt only women may boil.'],
    own: ['moi_women', 'ward', { when: 'any', every: 3 }, 'The women\'s pans', 'Salt from the sacred well is boiled only by women; a man who watches spoils it.',
      'The women are boiling the sacred well\'s salt in the iron pans. Men keep away from the boiling house; a man who watches spoils the salt.',
      'Keep away from the boiling house', 'You haul wood to a pile outside and go. The salt comes out white.',
      'Look in at the door', 'The salt comes out grey. The women know whose shadow was at the door.', 'The women boil the sacred salt while you keep away.', {}, { honor: -2, coin: -4 }] };
  R['POL-107'] = { want: 'To keep the elephant trade theirs alone.',
    fear: 'Pravith or Thinsak taking the Elephant Pass.',
    place: ['The Elephant Pass', 'The forest road out of the Hill Country, the only one an elephant train can use.'],
    own: ['elp_tongue', 'rite', { age: 17, who: 'male' }, 'The forest tongue', 'Catchers speak a secret tongue in the jungle and never say their own names there.',
      'You are seventeen and go into the forest with the catchers for the first time. From the forest edge on you speak only the {w1}, and you never say your own name under the trees.',
      'Speak only the forest tongue', 'Ten days, and not a word of the plain tongue. The master catcher says you may come again.',
      'Call out a plain word in fright', 'The elephants hear it, the catchers say. They send you home.', 'You go into the forest with the catchers.', { skill: { survival: 1, husbandry: 1 } }, { honor: -2 }] };
  R['POL-108'] = { want: 'Nothing from anyone.',
    fear: 'Everyone.',
    place: ['The Plateau of Urns', 'Great stone jars on a high plain, older than any people\'s story.'],
    own: ['ash_whistle', 'wed', { dowry: 1 }, 'Courting by whistle', 'Courting is done by whistle at dusk across the valley; a match is made when both whistled names are called together.',
      'Your wedding, which began with whistling at dusk across the valley. Tonight both your whistled names are called together from the hills, and the hills answer. The dowry is {dowry}.',
      'Whistle the names together', 'The two names go out across the valley and come back from four kilometres off.',
      'Say the names aloud', 'Everyone indoors hears them. Nobody outdoors does.', 'Your whistled names are called together.', { happy: 2 }, { happy: -2 }] };
  R['POL-109'] = { want: 'A real kingdom, and a recognised title.',
    fear: 'Swimming tigers, which kill three hundred of his people a year, and Juvai\'s fleet.',
    place: ['The Tiger Mangroves', 'Honey, salt and tigers that swim.'],
    own: ['mng_mask', 'ward', { when: 'any', every: 2 }, 'The mask on the back of the head', 'Honey-gatherers wear masks on the backs of their heads, because the mangrove tigers attack from behind.',
      'Honey season in the mangroves. Before you go in, your mother ties a mask on the back of your head with a painted face, so the tigers think you are watching them.',
      'Wear the mask and go in', 'Three combs of honey and no tiger. The mask stares behind you all day.',
      'Go in without it', 'You come back with the honey and a story about a shadow in the water.', 'You gather honey with a mask on the back of your head.', { coin: 3 }, { health: -6 }] };

  C['CUL-88'] = [
    ['vhn_house', 'wed', { dowry: 1 }, 'Her husband\'s house', 'A woman takes her husband\'s house at marriage and loses her birth house\'s rank, for better or worse.',
      'Your wedding, and the temple-house is written in again: the bride leaves her birth house\'s rank and takes her husband\'s. The {w1}\'s clerk changes one line. The dowry is {dowry}.',
      'Sign the new line', 'One line in the temple\'s ledger, and two houses are changed.', 'Ask the clerk to wait', 'He waits. Both families stare at you.', 'The bride takes her husband\'s house.', { happy: 2 }, { honor: -2 }],
    ['vhn_cup', 'ward', { when: 'any', every: 3 }, 'Your own cup', 'Water may not be taken from the hand of a lower house; travellers carry their own cups.',
      'You are thirsty on the road, and a woman at a well offers you water in her own cup. You do not know her house.',
      'Drink from your own cup', 'You hold out your cup. She pours, and nobody is offended.', 'Drink from hers', 'You drink. Someone behind you gasps; her house is low.', 'You drink from your own cup on the road.', {}, { honor: -2 }],
  ];
  C['CUL-89'] = [['juv_channel', 'name', { by: 'keep' }, 'Named for a channel', 'Boatmen name a child for the river channel of its birth, and change it if the channel moves.',
    'Your child is born on the boat, in a {w1} that moved twice last year. {child} is named for it, and may be named again if the river changes its mind.',
    'Dip the child\'s feet in the channel', 'The child yells at the cold water. The channel has heard its name.', 'Name it on dry land', 'The grandmother says a dry name has no river.', '{child} is named for the channel of its birth.', { happy: 2 }, { happy: -1 }]];
  C['CUL-90'] = [['stb_vote', 'mourn', { share: 'lord' }, 'The stable keeps it', 'A Stable-born man\'s horse, rank and stall go back to the stables; his free-born children get only what he gave them living.',
    '{parent} is dead. The stable takes back the horse, the stall and the rank, as it does for every Bought Rider. The estate is {estate}; what is yours is {got}.',
    'Hand the horse back', 'The stall-master leads it away. You keep the bridle, which nobody asked for.', 'Ask the stables to let you ride', 'They laugh. The free-born do not ride with the bought.', '{parent}\'s horse and stall go back to the stables. You get {got}.', { happy: -2 }, { honor: -2 }]];
  C['CUL-92'] = [['spl_stone', 'grave', {}, 'Your stone on the ridge', 'A stone is planted for every death; a man\'s name is the name of his tallest stone.',
    '', '', '', '', '', 'A stone is planted for you on the ridge, among four hundred thousand.', {}]];
  C['CUL-93'] = [['aym_rains', 'rite', { age: 17, who: 'male' }, 'A rains season in robes', 'Every boy lives in a monastery for at least one rains season, with shaved head and begging bowl.',
    'You are seventeen and have not yet spent your rains season in robes. Your mother shaves your head herself, and the monks give you a bowl.',
    'Go in for the rains', 'Three months of begging at dawn and sitting at noon. You come out lighter.', 'Say you will go next year', 'Your mother tells everyone you are going next year.', 'You spend a rains season in the monastery.', { piety: 3, wil: 1 }, { piety: -2 }]];
  C['CUL-94'] = [['prv_tank', 'law', {}, 'The tank is the sea', 'Every temple-mountain has a water tank that is the sea; a man who fouls it is drowned in it.',
    'After your punishment the temple steward walks you to the tank below the {w1}. This water is the sea, he says. A man who throws refuse in it is drowned in it.',
    'Kneel at the tank and swear', 'You kneel. The water is very still.', 'Say it is only a pond', 'He writes down that you said so.', 'The steward shows you the temple tank.', { piety: 1 }, { honor: -3 }]];
  C['CUL-95'] = [['tsf_ring', 'law', {}, 'Champions at the temple ring', 'Disputes between towns are settled by champions in the temple boxing ring.',
    'Your crime has become a quarrel between two {w1}s. It will be settled at the temple ring by two champions, and your town expects you to stand in your champion\'s corner.',
    'Stand in the corner', 'Your champion wins in the fourth round. Your quarrel is over, and you owe him.', 'Stay away', 'Your champion loses. The town knows who did not stand behind him.', 'Your quarrel is settled at the temple ring.', { coin: -3 }, { honor: -3 }]];
  C['CUL-96'] = [['lio_teeth', 'rite', { age: 17, who: 'all' }, 'Black teeth', 'Teeth are lacquered black at sixteen or seventeen, because only animals and ghosts have white teeth.',
    'It is time for your teeth. The lacquer is bitter and must be put on for days, and you may eat only soft rice. Only animals and ghosts have white teeth.',
    'Lacquer them black', 'A week of bitterness. Your smile is a proper one now.', 'Keep them white', 'Children point at you in the lane and call you ghost.', 'Your teeth are lacquered black.', { looks: 1 }, { honor: -2, looks: -1 }]];
  C['CUL-97'] = [['pnd_betel', 'ward', { when: 'any', every: 3 }, 'The betel for a guest', 'Betel is offered to every guest; to refuse it is to refuse friendship.',
    'A guest at your {w1}. Before a word of business, the betel tray: leaf, nut and lime, offered with both hands. To refuse it is to refuse friendship.',
    'Offer the tray with both hands', 'He chews, and his teeth go red, and you are friends.', 'Go straight to business', 'He leaves without chewing and without a bargain.', 'You offer betel to a guest.', { happy: 1 }, { honor: -2 }]];
  C['CUL-98'] = [
    ['tlf_pan', 'mourn', { share: 'eldestSon' }, 'The tin pan', 'A tin-washer\'s wooden pan passes from father to son, and the eldest takes the claim.',
      '{parent} is dead. The wooden pan that washed the {w1} for thirty years goes to the eldest son, with the claim. The estate is {estate}. You get {got}.',
      'Take your share and the pan if it is yours', 'The pan is worn smooth. Whoever has it now will feel the old hands in it.', 'Argue for the claim', 'You argue at the graveside. The claim stays with the eldest.', '{parent}\'s pan and claim pass on. You get {got}.', { happy: -2 }, { honor: -2 }],
    ['tlf_goat', 'ward', { when: 'any', every: 4 }, 'The goat at the stream head', 'When a mine\'s stream runs dry, the miners kill a goat at its head and move on.',
      'Your stream has run dry. The miners gather at its head with a goat, and the man whose claim it was holds the knife.',
      'Give the goat and move on', 'The goat is killed at the stream head. You walk to the next stream with your pan.', 'Keep panning the dry bed', 'You find nothing. The others are already working the next stream.', 'A goat is killed where your stream ran dry.', { coin: -3 }, { happy: -2 }],
  ];
  C['CUL-99'] = [['cry_parting', 'rite', { age: 20, who: 'all' }, 'The retelling of the parting', 'Every ten years the clans meet to retell the parting from the Ridge Yaru, and argue about who was wronged.',
    'You are twenty and sit for the first time at the retelling of the parting, held every ten years: how the clans left the Twin Rivers\' hills and who wronged whom. The argument begins at once.',
    'Argue your clan\'s side', 'You argue until dawn and win nothing. Everyone agrees it was a good meeting.', 'Say it was long ago', 'Both sides turn on you at once.', 'You argue the parting at the clans\' meeting.', { skill: { persuasion: 1 } }, { honor: -1 }]];
  C['CUL-100'] = [['moi_well', 'name', { by: 'keep' }, 'Named for the well', 'Families are named for the salt well they have the right to draw from.',
    'Your child {child} is born, and is carried to the {w2} your family draws from, and its name is said over the brine.',
    'Say the name over the brine', 'The brine is warm and smells of the earth. The child has a well.', 'Name it at home', 'The well-keeper asks which well the child belongs to.', '{child} is named over the family well.', { happy: 2 }, { happy: -1 }]];
  C['CUL-101'] = [['elc_name', 'name', { by: 'keep' }, 'Named for an elephant', 'A catcher\'s child is named for the first elephant its father caught.',
    'Your child is born and named, as catchers\' children are, for an elephant: {child}, after the first one caught by your house.',
    'Show the child to the old elephant', 'The old cow puts her trunk on the child\'s head. It does not cry.', 'Keep the child from the stables', 'The old catchers say an elephant\'s name should meet the elephant.', '{child} is named for an elephant.', { happy: 2 }, { happy: -1 }]];
  C['CUL-102'] = [['ahf_name', 'rite', { age: 17, who: 'all' }, 'The whistled name', 'Every person has a whistled name that carries four kilometres across a valley, and a spoken name used only indoors.',
    'You are seventeen. Your whistled name is to be called across the valley for the first time, by you, at dusk, and every hill that hears it will know you.',
    'Whistle it across the valley', 'The name goes out and comes back from the far ridge. Someone over there whistles it again.', 'Whistle it quietly', 'Nobody across the valley hears it. Your mother does, and sighs.', 'You whistle your name across the valley.', { skill: { music: 1 } }, { happy: -1 }]];
  C['CUL-103'] = [['rkh_temples', 'ward', { when: 'any', every: 3 }, 'Two temples', 'Every port has two temples, one Lamp and one Wheel, and merchants pray at both.',
    'You are about to sail. At the harbour stand the two temples, the Lamp and the Wheel, and merchants pray at both before a voyage.',
    'Pray at both', 'Two prayers, two offerings. The voyage is well begun twice.', 'Pray at one', 'The priests of the other notice.', 'You pray at both harbour temples.', { coin: -1, piety: 1 }, { piety: -1 }]];
  C['CUL-104'] = [['sed_pearl', 'rite', { age: 17, who: 'all' }, 'The first pearl', 'A diver\'s first pearl, and the first of every season, is given to the Sleeper\'s temple.',
    'Your first dive as a grown diver. You go down on the stone with your brother on the rope, and come up with a pearl. By custom the first pearl of the season goes to the Sleeper\'s temple.',
    'Take it to the temple', 'The priest holds it to the light and smiles. The season will be kind.', 'Keep it and say there was none', 'Your brother on the rope saw your fist.', 'You give the season\'s first pearl to the temple.', { piety: 2 }, { honor: -3 }]];
})();
