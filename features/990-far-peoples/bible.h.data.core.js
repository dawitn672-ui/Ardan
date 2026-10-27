// Far realm bibles, the High Steppes and the Rime Coast (990-far-peoples). Format: see bible.r.data.core.js.
(function () {
  const R = A.FARP_REALMS = A.FARP_REALMS || {}, C = A.FARP_CULT = A.FARP_CULT || {};

  R['POL-82'] = { want: 'That Skyhold\'s abbots own the Mother Stair as their mother house again; no envoy has come since 914.',
    fear: 'Lhudum\'s king making himself master of the abbey.',
    place: ['The Thousand-Step Hall', 'The mother house of the Open Sky, five centuries older than Skyhold, up a stair of a thousand steps.'],
    own: ['msr_circuit', 'rite', { age: 18, who: 'all' }, 'The Dzamtso circuit', 'Once in a life the faithful walk the circuit of Lake Dzamtso, 410 km in eighteen days, prostrating at every cairn.',
      'You are eighteen and of an age for the circuit: 410 kilometres round Lake Dzamtso in eighteen days, lying full length at every cairn. The Mother Abbot himself walked it the year he came of age.',
      'Walk the circuit', 'Eighteen days. Your knees and palms are raw, and the lake is the bluest thing you have seen.',
      'Walk half and turn back', 'You come home early. The monks say the other half will wait for you.', 'You walk the Dzamtso circuit.', { piety: 4, sta: 1 }, { piety: -2 }] };
  R['POL-83'] = { want: 'Mastery of the Mother Stair, whose estates own a third of the Trough\'s fields.',
    fear: 'Gorge raids, and Kethra\'s bought riders coming up through the Gorge Gate.',
    place: ['The fortress of Lhudum', 'On its red rock above the Ombharan, looking at the abbey across the valley.'],
    own: ['lhd_silver', 'census', { every: 3, m: 9, per: 1, line: 'The king\'s reeve counts {n} in your house for the silver shoes: {due}.' },
      'The silver shoes', 'Every third year the king rides into Ngodru on horses shod with silver, given to the abbey; every house pays its share.',
      'The king rides into Ngodru this autumn, and his horses will be shod with silver that goes to the abbey after. The reeve counts {n} in your house and asks {due} toward the shoes.',
      'Pay toward the shoes', 'You see the horses go by, flashing. Some of that is yours.',
      'Say the abbey has silver enough', 'The reeve agrees, and writes down that you said so.', 'You pay your share of the king\'s silver shoes.', {}, { coin: -4, honor: -1 }] };
  R['POL-84'] = { want: 'To keep the Cloudwall\'s dragons from Kethra\'s bone-hunters.',
    fear: 'The Mother Stair\'s condemnation.',
    place: ['The Dragons\' Ledge', 'A shelf of rock high on the Cloudwall where the abbey leaves its offerings.'],
    own: ['gyk_yak', 'ward', { when: 'any', every: 3 }, 'The yak for the ledge', 'A yak is driven up to the dragons\' ledge every new moon, and the valley\'s households take turns to give it.',
      'The new moon, and it is your household\'s turn to give the yak that is driven up to the dragons\' ledge. The abbot\'s porters wait at your door with a rope.',
      'Give a good yak', 'It goes up the path with the porters. Nobody watches it all the way.',
      'Give an old one', 'The porters take it. The abbot asks whose it was.', 'You give a yak for the dragons\' ledge.', { coin: -5, piety: 2 }, { piety: -3 }] };
  R['POL-85'] = { want: 'A fair salt price; the Trough pays in barley at the Trough\'s own rate.',
    fear: 'Winter, and the breath-antelope hunters from Marast.',
    place: ['Lake Dzamtso', 'The great salt lake of the plateau, white at the edges, where the caravans gather.'],
    own: ['slk_salt', 'muster', { m: 8, who: 'male', need: 'any', ok: [{ coin: 6, skill: { survival: 1 } }, 'You go down with the salt sheep and come back with barley.'], short: [{ coin: -2 }, 'You stay at the lake.'] },
      'The salt caravan', 'Every autumn a caravan of a thousand sheep carries salt down; on the road the men speak the salt tongue that women may not hear.',
      'Autumn, and the salt caravan forms: a thousand sheep, each with two little bags of salt. The leader speaks the salt tongue now, the one the lakes must not hear boasting.',
      'Go with the sheep and learn the tongue', 'Forty days down and back. You learn ten words of salt tongue and never say them at home.',
      'Stay with the women', 'You stay. The men come back with barley and words you do not know.', 'You go down with the salt caravan.', {}, { happy: -1 }] };
  R['POL-86'] = { cc: 1, want: 'The tea-horse tolls, without the Trough\'s or Shulai\'s officers.',
    fear: 'Each other: eleven lords and two thousand towers of feud.',
    place: ['The Three Sisters\' Bridges', 'Three bridges over three rivers that run side by side through the gorges.'],
    own: ['grg_price', 'law', {}, 'The man-price in yaks', 'Feuds are paid in man-prices counted in yaks: a lord\'s life is 120 yaks, a herder\'s twelve.',
      'Your crime has made a feud between towers. The lords count the man-price in yaks at the foot of the {w1}; when it is paid, the feud is over.',
      'Pay the price at the tower\'s foot', 'The yaks are counted twice. The other tower\'s eldest spits, and it is over.',
      'Let the towers fight it out', 'Your tower takes the feud. Its men do not thank you.', 'A man-price is counted out in yaks.', { coin: -6 }, { honor: -3 }] };
  R['POL-87'] = { want: 'To be left alone, and to learn whether the western holds still keep the Law.',
    fear: 'The ice closing the lower gates, and being found.',
    place: ['The Long Count Wall', 'Nine hundred metres of runes, one for every dwarf of the hold; the oldest are 3,500 years old.'],
    own: ['cgt_rune', 'rite', { age: 30, who: 'all' }, 'The rune in the wall', 'At thirty every dwarf of the hold cuts one rune into the Long Count wall and takes their own name.',
      'You are thirty. Until today you have gone by your master\'s name. You are given a chisel and a place on the {w3}, and you cut your rune beside thirty-five centuries of others.',
      'Cut it deep', 'The rune is clean and deep. The carvers read your name aloud for the first time.',
      'Cut it shallow and quick', 'It is cut. The carvers frown: a shallow rune is a short memory.', 'You cut your rune in the Long Count wall.', { wil: 1, skill: { craft: 1 } }, { honor: -2 }] };
  R['POL-89'] = { want: 'Trade with the Cold Gate, and the yak-men\'s road west kept secret.',
    fear: 'The cold, and Lhudum\'s king.',
    place: ['Karphel', 'Summer pastures at 4,900 metres, the last grass before the ice.'],
    own: ['yak_carry', 'muster', { m: 5, who: 'male', need: 'any', ok: [{ skill: { survival: 1 }, coin: 3 }, 'You carry the Cold Gate\'s iron down to the Trough and come back with barley.'], short: [{}, ''] },
      'The iron carry', 'Every summer the herders carry the Cold Gate\'s iron down to the Trough, and take barley for it, never money.',
      'Summer, and the dwarves have set out the iron at the {w2}\'s lower door. Your herd\'s yaks carry it down to the Trough, as they have since before anyone remembers. You take barley, never money.',
      'Load your yaks', 'Twelve days down and up. The dwarves count the barley and nod.',
      'Ask the dwarves for silver', 'They look at you for a long time and give you barley.', 'Your yaks carry the Cold Gate\'s iron down.', {}, { honor: -2 }] };
  R['POL-90'] = { cc: 1, want: 'To be forgotten by all three realms around it.',
    fear: 'Being found, and the slave raiders.',
    place: ['The Moot Stone', 'Where the valley meets, and where a runaway is given a new name.'],
    own: ['dzm_name', 'law', {}, 'The new name', 'A runaway who reaches Dzuma is given a new name, and the old one is never asked.',
      'After your punishment the Speaker of the Moot reminds you of the one law that holds the valley: nobody asks anyone\'s old name. You have been asking.',
      'Swear never to ask again', 'You swear on the Moot Stone. Several people look relieved.',
      'Say you only wondered', 'The Speaker says wondering is how the raiders find valleys.', 'The Speaker reminds you that old names are not asked.', {}, { honor: -3 }] };
  R['POL-134'] = { faith: 'REL-12', want: 'To be left in the cold, and to trade ivory for iron.',
    fear: 'Warm summers: three above twenty degrees in the last ten years.',
    place: ['The whalebone hall', 'The last hall of the eastern giants, raftered in whale ribs, on the Ice Horn.'],
    own: ['fjr_chant', 'ward', { when: 'any', every: 3 }, 'The Mothers\' Chant', 'In the dark of the year the hall chants its Mothers, forty-nine of them, and every partner sits through it.',
      'The dark of the year, and the hall chants the {w3}: forty-nine Mothers, one by one, in a giant\'s slow voice. It agrees with Jotunhall\'s for thirty-one and then goes its own way. Partners sit through it all.',
      'Sit through the whole chant', 'Two nights. At the forty-ninth Mother the eldest looks round to see who is still awake. You are.',
      'Sleep through the second night', 'You wake for the last Mother. The giants do not mind; the partners do.', 'You sit through the Mothers\' Chant.', { wil: 1 }, { honor: -2 }] };
  R['POL-135'] = { want: 'Iron and wood.',
    fear: 'The frost leviathans in the leads, and a bad ice year.',
    place: ['The walrus rookeries', 'The beaches where the walrus haul out in thousands, and where the camps gather in spring.'],
    own: ['wst_first', 'ward', { when: 'any', every: 2 }, 'The first walrus', 'The first walrus of spring is shared among every family of the camp before anyone eats; the hunter takes the last portion.',
      'Spring, and the first {w3} of the year is on the ice. It is shared among every family of the camp before anyone eats, and the hunter takes the last portion.',
      'Share it out and take the last', 'Your portion is a flipper and the ribs. Everyone eats, and they eat looking at you.',
      'Keep the liver for your own', 'The camp eats. Nobody shares their next catch with you.', 'The first walrus is shared through the camp.', { honor: 2 }, { honor: -4 }] };

  C['CUL-63'] = [
    ['trf_monk', 'ward', { when: 'parent', every: 5 }, 'One son in three', 'One son of every three goes to a monastery; a family with no monk is pitied and slightly distrusted.',
      'The monks of the {w1} are making their rounds. One son in three goes to the monastery. Your family is counted.',
      'Give a son to the monks', 'He goes up the hill in a red robe too big for him. Your family is respectable.',
      'Say your sons are needed in the fields', 'The monks go away. Your family is pitied, and a little distrusted.', 'Your family gives a son to the monastery.', { piety: 3, happy: -1 }, { honor: -2 }],
    ['trf_sky', 'mourn', { share: 'equal' }, 'The sky burial', 'The dead are cut and given to the vultures; the estate is shared alike among the children.',
      '{parent} is carried up to the sky-burial ground above the town, and the body-breakers do their work, and the vultures come. The estate, {estate}, is shared alike. You get {got}.',
      'Watch the vultures come', 'They come down in a long spiral. When they rise again {parent} is gone up.', 'Go home before the breakers start', 'You go home. The breakers do not mind; your aunts do.', '{parent} is given to the sky. You get {got}.', { happy: -2, piety: 1 }, { happy: -3 }],
  ];
  C['CUL-64'] = [['slk_name', 'name', { by: 'keep' }, 'Named for the winter lake', 'A child is named for the lake where the family camped the winter of its birth.',
    'Your child {child} is born, and will carry the name of the lake where the family camped this winter. The {w1} is frozen at the edges; the child is held up to it.',
    'Hold the child up to the lake', 'The wind takes its breath away. It yells the lake\'s name back, more or less.', 'Name it in the tent', 'The grandmothers say a child must know its lake.', '{child} is named for the winter lake.', { happy: 2 }, { happy: -1 }]];
  C['CUL-65'] = [
    ['gcl_bridge', 'market', { cut: 0.05 }, 'The price of a bridge', 'Every bridge has a price: strangers pay in salt, cousins in news.',
      'You carry goods to sell across the gorge. The {w2} has its keeper and its price: strangers pay in salt, cousins in news. He does not know you.',
      'Pay in salt', 'He takes the salt and lets you onto the swinging ropes.', 'Tell him news as if you were a cousin', 'He listens, nods, and charges you double salt for lying.', 'You pay the bridge-keeper: {cut}.', {}, { coin: -4 }],
    ['gcl_tower', 'mourn', { share: 'eldestSon' }, 'The tower\'s heir', 'A dead man\'s tower goes to the eldest son, and the clan\'s feuds with it.',
      '{parent} is dead, and the tower goes to the eldest son with its feuds. The estate is {estate}; you get {got}.',
      'Swear the tower\'s feuds as yours', 'You swear. Two towers across the gorge will hear of it by night.', 'Swear only to your own feuds', 'The clan says a tower cannot halve its feuds.', '{parent}\'s tower passes to the eldest son. You get {got}.', { honor: 1 }, { honor: -2 }],
  ];
  C['CUL-66'] = [['yka_cairn', 'ward', { when: 'any', every: 2 }, 'A stone for the cairn', 'A herder who passes a prayer-flag cairn without adding a stone is followed by bad weather.',
    'You are on the pass with the herd. The cairn under the prayer flags is waist-high with stones. The old men say a herder who passes without adding one is followed by weather.',
    'Add a stone', 'You add one. The flags crack in the wind, and the weather holds.', 'Push on; the herd is restless', 'You push on. The weather follows you down, as they said.', 'You add a stone to the cairn on the pass.', { piety: 1 }, { health: -3 }]];
  C['CUL-67'] = [['cgd_forge', 'ward', { when: 'any', every: 3 }, 'Fire from the First Forge', 'The First Forge is lit once a year from a coal in a stone box, and every forge of the hold is lit from it.',
    'The First Forge is lit, once a year, from the coal kept in the stone box. Every forge in the hold must be relit from it, and your household carries its share of the coal down the stair.',
    'Carry the coal down', 'Your forge takes the old fire. It burns a little hotter, or you think so.', 'Keep your own fire', 'Your forge burns as well as ever. The carvers say it burns unlawfully.', 'Your forge is relit from the First Forge.', { skill: { craft: 1 } }, { honor: -3 }]];
  C['CUL-69'] = [['cwp_snow', 'mourn', { share: 'equal' }, 'Left in the snow', 'The dead of the passes are left in the snow with their baskets, and porters greet them by name as they pass.',
    '{parent} is carried up to the pass and left in the snow with the old basket, beside the {w1}, where porters will greet them by name. The estate, {estate}, is shared alike: {got} to you.',
    'Greet {parent} as you pass', 'You say the name aloud on the next carry. Another porter says it too.', 'Take the long way round', 'You avoid the pass. Porters ask why {parent} is lonely.', '{parent} is left on the pass. You get {got}.', { happy: -2 }, { happy: -3 }]];
  C['CUL-81'] = [['rsh_name', 'name', { by: 'keep' }, 'The name of the last dead', 'A child is named for the last person of the camp who died, and is kin to everyone who loved them.',
    'Your child is born, and is given the name of the last person of the camp who died. {child} is kin now to everyone who loved them, and they come to see.',
    'Let them come and hold the child', 'Old hunters hold the child and call it by its name and weep a little.', 'Keep the child in the tent', 'The camp says a name that is not shown grows cold.', '{child} is named for the camp\'s last dead.', { happy: 2 }, { happy: -2 }]];
  C['CUL-82'] = [['fjg_adopt', 'wed', { dowry: 1 }, 'Into the giant\'s household', 'A human partner who marries is adopted with the spouse into a giant\'s household, and their children are born to it.',
    'You marry, and you and your spouse are taken into a giant\'s household for life, as the partners of Fjorund are. The giant lays a hand the size of a door on both your heads. The dowry is {dowry}.',
    'Kneel for the hand', 'It is warm and heavy, and you are of the hall now.', 'Stand, and bow instead', 'The giant is amused. The partners are not.', 'You are taken into a giant\'s household at your marriage.', { happy: 2, honor: 1 }, { honor: -2 }]];
})();
