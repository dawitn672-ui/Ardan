// Far realm bibles, the Thousand Isles (990-far-peoples). Format: see bible.r.data.core.js.
(function () {
  const R = A.FARP_REALMS = A.FARP_REALMS || {}, C = A.FARP_CULT = A.FARP_CULT || {};

  R['POL-110'] = { cc: 1, want: 'To keep the Strait\'s toll, and stop Kemodari\'s rice fleets supplying the Tail ports.',
    fear: 'Kemodari rising, and a Taulen fleet ending the sea ban and with it Venshai\'s yearly gift.',
    place: ['The Toll Chain anchorage', 'Where a stone chain closed the Strait in 790; its anchor-stones still stand in the shallows.'],
    own: ['srg_pilot', 'market', { cut: 0.08 }, 'The Strait pilot', 'Every ship that anchors pays, and takes a Strait pilot aboard to the next anchorage; the pilots are the Lord\'s eyes.',
      'You sell at the Strait. Your ship has paid at the toll-island, and now a Strait pilot comes aboard to take you to the next anchorage. He steers, he watches, and he is paid out of what you sell.',
      'Feed the pilot and let him steer', 'He brings you in without a scrape and writes something on a palm leaf.',
      'Steer yourself and pay him to sit', 'He sits. At the next anchorage the Lord knows everything anyway.', 'A Strait pilot takes his fee: {cut}.', {}, { coin: -8 }] };
  R['POL-111'] = { want: 'To feed the Strait, and then to own it.',
    fear: 'The Ash Father\'s fire, and the water-temples, which can stop the water.',
    place: ['The Ash Father\'s crater temple', 'At the head of all the water, where the calendar of 210 days is kept.'],
    own: ['kmd_water', 'season', { m: 4, pct: 0.05, min: 5, cap: 12, paid: 'The water-temple opens your terrace on its day; you give {due}.', short: 'You have nothing for the water-temple. Your terrace waits its turn behind the givers.', shortFx: { happy: -2, honor: -1 } },
      'The water calendar', 'The water-temples open each terrace\'s water in turn by a calendar of 210 days; the king obeys it too.',
      'Your terrace\'s day on the water calendar. The water-temple priests open the channel at the head of your field and expect a gift: {due}. The king himself waits for his own day.',
      'Give the gift and open the water', 'The water runs onto your terrace. The priest moves on to the next.',
      'Open the channel early yourself', 'Your neighbour\'s terrace runs dry. The priests close yours for a week.', 'The water-temple opens your terrace.', {}, { coin: -8, honor: -2 }] };
  R['POL-112'] = { want: 'To keep its water-temples free of Kemodari\'s priests.',
    fear: 'Being swallowed by Kemodari.',
    place: ['The Mother Temple of the East', 'Usaling\'s own water-temple, older than Kemodari\'s calendar.'],
    own: ['usl_order', 'name', { by: 'keep' }, 'Named by birth order', 'Children are named by birth order (Sae, Duwa, Tigo, Mpato) before their own names.',
      'Your child is born, and is named first for its place among its brothers and sisters, Sae or Duwa or Tigo or Mpato, and only then by its own name: {child}.',
      'Call the child by both names', 'The child is Duwa {child} now, or Sae, and the village knows where it stands.',
      'Use only the given name', 'The elders keep saying the order name anyway.', '{child} is named by birth order.', { happy: 2 }, { happy: -1 }] };
  R['POL-113'] = { want: 'To sell gold and pepper at the Strait\'s ports on their own terms.',
    fear: 'Suraeng\'s tax collectors, and the swamp fevers.',
    place: ['The House of the Nine Horns', 'A roof of nine horns, for nine generations of mothers under it.'],
    own: ['tnm_horn', 'mourn', { share: 'daughters' }, 'The horn-roofed house', 'Land and houses pass from mother to daughter; a house of nine horns has nine generations of mothers.',
      '{parent} is dead. The {w1} passes down the mothers\' line, and a new horn may be added to the roof. The estate is {estate}; your share is {got}.',
      'Help raise the new horn', 'The roof has one more horn by evening. The mother lord thanks you.', 'Ask for a son\'s share', 'The mother lord laughs and gives you a buffalo calf to stop you talking.', 'The house passes down the mothers\' line. You get {got}.', { happy: -2 }, { honor: -2 }] };
  R['POL-114'] = { want: 'Every river mouth of the Great Forest Isle.',
    fear: 'The Longhouse war-parties.',
    place: ['The river-mouth palace', 'Where the king sits on a throne cut from one ironwood log.'],
    own: ['lgk_silent', 'market', { cut: 0.05 }, 'The silent market', 'Goods from the interior are bought at a silent market: each side leaves its goods on the bank, and neither sees the other.',
      'You trade upriver. At the silent market you leave salt and cloth on the bank and go back to the boat. In the morning there is camphor in their place, or your salt is still there.',
      'Leave fair goods and go', 'Morning: camphor and a hornbill casque. Nobody was seen.', 'Hide and watch', 'You see nothing all night, and in the morning nothing has been left.', 'You trade at the silent market: {cut} in salt.', {}, { coin: -5 }] };
  R['POL-115'] = { want: 'The coast kings out of the rivers.',
    fear: 'Lingkaro\'s slavers.',
    place: ['The longest longhouse', 'Two hundred and six doors under one roof.'],
    own: ['lnh_gallery', 'law', {}, 'The gallery settles it', 'A longhouse is one village under one roof; a quarrel is settled by the whole gallery.',
      'After your punishment the whole gallery sits outside the doors to hear your quarrel. Two hundred doors\' worth of neighbours listen and decide.',
      'Speak to the gallery', 'They listen, and argue, and decide against you, mildly.', 'Stay behind your door', 'The gallery decides without you, and less mildly.', 'The longhouse gallery hears your quarrel.', { skill: { persuasion: 1 } }, { honor: -3 }] };
  R['POL-116'] = { want: 'To be Taulen\'s chief tributary in the Isles and the Junk Road\'s main market.',
    fear: 'Silo\'s raids and the cyclones.',
    place: ['The Gong Hall', 'Where the chiefs\' gongs hang, each as loud as the rank of the boat that carries it.'],
    own: ['pln_gong', 'levy', { who: 'male' }, 'The gongs go out', 'In war every chief\'s boat sails with its gong, and every free man of the island rows for his chief.',
      'War, and the chiefs\' gongs are beaten from the Gong Hall to the beach. Every free man rows in his chief\'s {w1}.',
      'Take an oar in the war boat', 'The gong beats the stroke. You row out with the fleet.', 'Hide in the hills', 'The fleet sails. When it comes back, your chief remembers.', 'You row in your chief\'s war boat.', { sta: 1 }, { honor: -4 }] };
  R['POL-117'] = { want: 'Gold traded only for iron, and the lowlanders kept below.',
    fear: 'Paaluan\'s tax.',
    place: ['The Great Terraces', 'Rice terraces climbing 1,500 metres, cut fifty generations ago.'],
    own: ['trc_eldest', 'mourn', { share: 'eldest' }, 'The eldest\'s terrace', 'A terrace is inherited by the eldest child, boy or girl, and the eldest\'s name becomes the terrace\'s.',
      '{parent} is dead. The {w1} goes to the eldest child, boy or girl, and takes the eldest\'s name. The estate is {estate}. You get {got}.',
      'Help the eldest walk the terrace', 'You walk the walls with the new owner. The name is said at each corner.', 'Dispute the terrace', 'The village elders hear you and give the eldest the terrace, as always.', 'The terrace goes to the eldest. You get {got}.', { happy: -2 }, { honor: -2 }] };
  R['POL-118'] = { want: 'Slaves to sell, and Taulen\'s smugglers\' silver.',
    fear: 'A Taulen fleet sent south, and Suraeng and Paaluan making common cause.',
    place: ['The Reef of Prizes', 'The reef where the captains count their season\'s prizes, and where a captain with none is put ashore.'],
    own: ['sil_reef', 'season', { m: 10, pct: 0.1, min: 10, cap: 30, paid: 'Your share of the season goes to the Captain of Captains: {due}.', short: 'You bring nothing to the reckoning. They put you ashore on a reef with a knife and a coconut, and fetch you back in a week.', shortFx: { health: -8, honor: -2 } },
      'The reef reckoning', 'At the season\'s end every raider pays the Captain of Captains; one with no prize is put on a reef with a knife.',
      'The end of the raiding season, and the reckoning on the Reef of Prizes. Every raider\'s share is counted, and the Captain of Captains takes his: {due}. A man with nothing is put ashore with a knife and a coconut.',
      'Pay the captain his share', 'He weighs it and nods. You will sail next season.', 'Hide your share in the mangroves', 'They find it. You go ashore with a knife and a coconut.', 'You pay your share at the reef reckoning.', {}, { health: -8, honor: -2 }] };
  R['POL-119'] = { want: 'The Scent Narrows and its toll.',
    fear: 'Tidoha.',
    place: ['The Sandbank', 'Between the twin isles, where the two rulers meet each year in boats.'],
    own: ['trn_sand', 'ward', { when: 'any', every: 3 }, 'The sandbank meeting', 'The twin rulers meet once a year on boats at the sandbank; if either steps onto the sand, it is war.',
      'The day of the sandbank meeting. The two rulers come out in their boats with every boat of both isles behind them. If either steps onto the sand, it is war. Your boat is in the line.',
      'Hold your boat in the line', 'Nobody steps on the sand. The kings shout at each other for an hour and go home.', 'Pull out of the line', 'The line closes. Your neighbours ask where you went.', 'You hold your boat in the line at the sandbank.', { honor: 1 }, { honor: -2 }] };
  R['POL-120'] = { cc: 1, want: 'The Narrows.',
    fear: 'Teranu and Kemodari.',
    place: ['The Queen\'s Fort', 'Stone walls over the spice harbour, built to watch Teranu across the water.'],
    own: ['tdh_spice', 'law', {}, 'The kings\' market', 'Spice is sold only in the rulers\' markets; a planter who sells to a foreign ship is drowned.',
      'After your punishment the Queen\'s harbour-master reads you the spice law: cloves and nutmeg are sold only in the Queen\'s market. A planter who sells to a foreign ship is drowned off the fort.',
      'Swear to sell in the market only', 'You swear. The harbour-master watches your boat for a season anyway.', 'Say foreign ships pay better', 'They do, he agrees. He writes down your name.', 'The spice law is read to you at the fort.', {}, { honor: -3 }] };
  R['POL-121'] = { want: 'To build ships for every fleet in the Isles and be beholden to none.',
    fear: 'Fire in the ebony forests.',
    place: ['The great yards', 'Where every keel is sung over for seven days before it is laid.'],
    own: ['bnv_keel', 'ward', { when: 'any', every: 3 }, 'The ship\'s navel', 'A ship is born: the boat-priests sing over the keel for seven days, and a blessing is sealed in its navel.',
      'A keel is laid in the yard, and the {w2}s sing over it for seven days. On the last day every household that worked on it brings something small to seal in the ship\'s navel.',
      'Bring a token for the navel', 'Your token goes into the hole in the keel and is sealed with resin. The ship will carry it forever.', 'Stay away from the yard', 'The ship is sealed without you. It will not know you.', 'You seal a token in a new ship\'s navel.', { piety: 1 }, { piety: -1 }] };
  R['POL-122'] = { want: 'Pigs, shells and plumes, and the coast traders kept on the coast.',
    fear: 'Nothing outside; each valley fears the next.',
    place: ['The Snow on the Equator', 'Ice on the highest peaks of the Great Green, which the coast does not believe in.'],
    own: ['grh_pigs', 'ward', { when: 'any', every: 3 }, 'The pig feast', 'A big man gives away hundreds of pigs at once; the man who gives most is greatest, and the receivers owe.',
      'A big man is giving an {w3}: hundreds of pigs given away in one day. Your household receives one, and with it a debt that will be called at the next feast.',
      'Take the pig and owe', 'The pig is good. The debt sits on your house like a guest.', 'Refuse the pig', 'The big man is insulted. The valley talks of nothing else.', 'You receive a pig at a big man\'s feast, and owe.', { happy: 2, honor: -1 }, { honor: -3 }] };
  R['POL-123'] = { want: 'A fair price for plumes; the Scent Isles\' traders pay in iron.',
    fear: 'The highlanders.',
    place: ['The stilt villages', 'Houses on posts over the coastal swamp, where the plume traders come by boat.'],
    own: ['brd_tree', 'ward', { when: 'armed', every: 3 }, 'The plume-tree', 'Plume-trees are owned; a man who shoots a bird from another\'s tree pays a pig.',
      'You are out with a bow, and the birds are displaying in a tree at the forest edge. It is not your family\'s tree. A bird shot from another man\'s tree costs a pig.',
      'Walk on to your own tree', 'Your own tree has fewer birds. You shoot one, and it is yours.', 'Shoot from the near tree', 'The tree\'s owner hears of it by dusk. A pig is owed.', 'You shoot plume birds from your own tree only.', { skill: { bow: 1 } }, { coin: -5, honor: -1 }] };
  R['POL-124'] = { want: 'Free water: no toll on their own boats, and the right to dive any reef.',
    fear: 'Being forced ashore.',
    place: ['The Rice Reef', 'Where the fleet passes a drowned saint and every boat throws rice.'],
    own: ['drf_swim', 'name', { by: 'keep' }, 'Swim before you walk', 'Children swim before they walk, and each is named for the water it was born over.',
      'Your child {child} is born on the {w1} and named for the water under it. Before it can walk it will be dropped over the side to swim.',
      'Drop the child in the shallows', 'It kicks and comes up spluttering and swims, more or less. The fleet cheers.', 'Wait until it can walk', 'The old women say a child that walks first will want the land.', '{child} is named for the water of its birth.', { happy: 2 }, { happy: -1 }] };
  R['POL-125'] = { want: 'An equal share of the toll with Suraeng.',
    fear: 'Bauraan taking its trade, and Kemodari.',
    place: ['The Wall of Blades', 'Where foreign crews hang their weapons at the jetty until they sail.'],
    own: ['trg_blades', 'ward', { when: 'armed', every: 2 }, 'The Wall of Blades', 'No one carries a weapon ashore from a ship; blades hang on the Wall at the jetty until the ship sails.',
      'You come ashore from a ship with a blade at your side. At the jetty the Wall of Blades is hung with a hundred others, and the harbour-master\'s man holds out his hand.',
      'Hang your blade on the wall', 'It hangs between a sailor\'s knife and a captain\'s sword. You walk in light.', 'Keep it hidden under your coat', 'They search you at the market gate and fine you.', 'You hang your blade on the Wall at the jetty.', {}, { coin: -6, honor: -1 }] };

  C['CUL-105'] = [
    ['stf_hall', 'law', {}, 'Petition from a boat', 'A lord\'s hall stands on posts over the water, and petitioners speak to him from boats.',
      'After your punishment you may petition the {w2}. His {w3} stands on posts over the water; you speak to him from a boat, looking up, while it rocks.',
      'Petition from the boat', 'He hears you out from his window and reduces nothing, but he hears you.', 'Climb the posts', 'His guards push you back into the water.', 'You petition the sea lord from a boat.', { skill: { persuasion: 1 } }, { honor: -2, health: -2 }],
    ['stf_pass', 'wed', { dowry: 1 }, 'The palm-leaf pass', 'A bride\'s family gives the groom a palm-leaf pass to their river, so their boats may pass without toll.',
      'Your wedding. The bride\'s family gives the groom a palm-leaf pass to their river, and the families\' boats will pass each other\'s tolls for good. The dowry is {dowry}.',
      'Take the pass with both hands', 'The leaf is old and soft. It is worth more than the dowry.', 'Ask for coin instead', 'They give coin, and keep the leaf.', 'A palm-leaf pass is given at your wedding.', { happy: 2 }, { honor: -1 }],
  ];
  C['CUL-106'] = [['tnh_leave', 'rite', { age: 18, who: 'male' }, 'Going away', 'Young men are expected to leave and trade; a man who never leaves is called the hearth-cat.',
    'You are eighteen. Your mother\'s brothers have a pack ready. Young men go away to trade and come home rich, or not at all. A man who stays is the hearth-cat.',
    'Take the pack and go', 'You go down to the coast. You come home a year later with a little gold and a lot of stories.', 'Stay by the hearth', 'They call you the hearth-cat, kindly, for the rest of your life.', 'You go away to trade, as young men do.', { skill: { trade: 1 }, coin: 5 }, { honor: -3 }]];
  C['CUL-107'] = [['kmf_tower', 'grave', {}, 'The cremation tower', 'The dead are cremated in towers shaped like the mountain, and the ashes go to the sea.',
    '', '', '', '', '', 'You are burned in a tower shaped like the mountain, and your ashes go to the sea.', {}]];
  C['CUL-108'] = [['usf_spear', 'ward', { when: 'spring_mounted', every: 2 }, 'The spear battle', 'Each spring the villages fight a mounted battle with blunt spears to bring the rains.',
    'Spring, and the villages ride out against each other with blunt spears to bring the rains. Blood spilled feeds the fields. You have a horse; you are expected.',
    'Ride in the spear battle', 'You are knocked off once and get back on. The rains come in a week.', 'Lead your horse home', 'The rains come anyway, a little late. People blame you a little.', 'You ride in the spring spear battle.', { skill: { mounted: 1 }, health: -3 }, { honor: -2 }]];
  C['CUL-109'] = [['lhf_omen', 'ward', { when: 'any', every: 2 }, 'The omen bird', 'The omen birds\' calendar decides when to plant, travel and fight; a bad call turns a war party home.',
    'You are about to set out on the river when a {w1} calls from the wrong side of the path. The omen readers say a bad call turns even a war party home.',
    'Turn back and wait a day', 'You go a day late. The river is calmer.', 'Go on regardless', 'You go on. Everything that goes wrong is the bird\'s fault for a month.', 'You turn back for an omen bird.', { piety: 1 }, { happy: -2 }]];
  C['CUL-110'] = [['lkt_name', 'mourn', { share: 'eldestSon' }, 'The river mouth', 'Merchant houses are named for the river mouth they hold, and the eldest son holds it.',
    '{parent} is dead, and the {w1} the house holds goes to the eldest son with the house\'s name. The estate is {estate}; your share is {got}.',
    'Swear to the new head', 'You swear. The river mouth stays the house\'s.', 'Take your share and leave the house', 'You leave. The house is smaller, and says so.', 'The river mouth passes to the eldest son. You get {got}.', { happy: -2 }, { honor: -2 }]];
  C['CUL-111'] = [['plf_tattoo', 'rite', { age: 18, who: 'all' }, 'The first tattoo', 'A tattoo is earned one by one: a voyage, a battle, a child. The first is for the first voyage.',
    'You are back from your first voyage beyond the reef, and you have earned your first tattoo. The tattooist is waiting with soot and a little comb of bone.',
    'Take the first tattoo', 'It hurts more than the voyage did. It is the first line of your life on your skin.', 'Say you will wait for a better voyage', 'The tattooist shrugs. Your skin stays empty a while.', 'You earn your first tattoo.', { looks: 1, wil: 1 }, { honor: -1 }]];
  C['CUL-112'] = [['tcl_slide', 'ward', { when: 'any', every: 4 }, 'Rebuilding the terraces', 'Terraces are rebuilt after every landslide by the whole village in one season.',
    'A landslide has taken three terraces above the village. The whole village rebuilds them this season, stone by stone, before the rice goes in.',
    'Carry stones with everyone', 'Two months of stone. The terraces stand, and the {w2}s in the granaries are fed for it.', 'Work your own terrace only', 'Yours is fine. The others notice.', 'You help rebuild the terraces after a slide.', { sta: 1 }, { honor: -2 }]];
  C['CUL-113'] = [['srf_knife', 'levy', { who: 'male' }, 'The captain\'s knife', 'In a raid every man\'s share is set by the captain\'s knife, cutting a palm leaf into strips.',
    'The captains are raiding, and every man of the reefs is called to the {w1}s. The share of each will be set by the captain\'s knife, cutting a palm leaf into strips.',
    'Sail with the raid', 'Your strip is narrow, but it is a strip.', 'Stay on the reef', 'The fleet sails without you. No strip, and a long memory.', 'You sail with the raid.', { coin: 4 }, { honor: -3 }]];
  C['CUL-114'] = [['clv_tree', 'name', { by: 'keep' }, 'The child\'s clove tree', 'A clove tree is planted at each child\'s birth; the tree is the child\'s, and to cut it is to curse the child.',
    'Your child {child} is born, and you plant a {w1} tree for it at the edge of the garden. The tree is the child\'s for life; to cut it is to curse the child.',
    'Plant it with your own hands', 'The sapling is no taller than your hand. It will outlive you.', 'Have the gardener plant it', 'It is planted. Your grandmother says a tree knows whose hands.', 'A clove tree is planted for {child}.', { happy: 2 }, { happy: -1 }],
    ['clv_leave', 'wed', { dowry: 1 }, 'Both kings\' leave', 'Every person belongs to Teranu or Tidoha by birth, and marries across only with both rulers\' leave.',
      'Your wedding. Before the feast both courts\' clerks must see that the match is within one isle, or that both rulers have given leave. The dowry is {dowry}, in {w3} and cloves.',
      'Show the clerks the leave', 'Both clerks stamp it. The feast smells of cloves.', 'Marry first and ask after', 'Both courts fine you, which is the only thing they have agreed on in years.', 'The clerks of both courts check your match.', { happy: 2 }, { coin: -8, honor: -1 }]];
  C['CUL-115'] = [['bnf_wash', 'mourn', { share: 'equal' }, 'Into the gallery', 'The dead go into the cliff galleries, to be washed and re-dressed every few years; the estate is shared alike.',
    '{parent} is carried up to the {w3} and laid with the family\'s dead. In a few years you will bring them out to wash and dress. The estate, {estate}, is shared alike: {got} to you.',
    'Carry the body up yourself', 'The gallery is cool and dry. Your grandparents are there in their good cloth.', 'Pay bearers', 'The bearers carry {parent} up. The boat-priest asks why you did not.', '{parent} goes into the cliff gallery. You get {got}.', { happy: -2, piety: 1 }, { honor: -2 }]];
  C['CUL-116'] = [['ghl_war', 'law', {}, 'Paid for in pigs', 'A man killed in war or a quarrel is paid for in pigs, and wars stop when it rains.',
    'After your punishment the valley counts what you owe in pigs, as every wrong here is counted. The big man calls out the number, and it is raining, so the quarrel is paused.',
    'Pay the pigs', 'Your pigs go to the other house. The quarrel ends when the sun comes out.', 'Wait for the rain to stop', 'It stops. The quarrel resumes.', 'Your wrong is counted in pigs.', { coin: -5 }, { honor: -3 }]];
  C['CUL-117'] = [['bcf_dance', 'market', { cut: 0.05 }, 'The dance for the birds', 'Plumes are sold only after a dance at which the birds are honoured.',
    'You have plumes to sell. Before any trader may see them, the village dances to honour the birds, and the dancers are paid from the sale.',
    'Dance before you sell', 'The dance goes on till dusk. The plumes sell well in the morning.', 'Sell before the dance', 'The trader will not buy undanced plumes.', 'The birds are danced before your plumes are sold: {cut}.', {}, { coin: -4 }]];
  C['CUL-118'] = [['dhf_ashore', 'grave', {}, 'The empty island', 'The dead are buried on islands no one lives on, and their boats are broken and left beside them.',
    '', '', '', '', '', 'You are buried on an island where no one lives, with your boat broken beside you.', {}]];
})();
