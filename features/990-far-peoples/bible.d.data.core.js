// Far realm bibles, the Deep Southland and the Sunrise Isles (990-far-peoples). Format: see bible.r.data.core.js.
(function () {
  const R = A.FARP_REALMS = A.FARP_REALMS || {}, C = A.FARP_CULT = A.FARP_CULT || {};

  // ---- the Deep Southland
  R['POL-142'] = { want: 'The Coral Coast\'s ports, so that Ndorima\'s gold stops paying the coast\'s markups.',
    fear: 'The gold reefs running out, the best down by a third in thirty years, and cattle plague.',
    place: ['The Great Enclosure', 'Dry-stone walls eleven metres high and two hundred and fifty round, built without mortar.'],
    own: ['ndr_gold', 'law', {}, 'The king\'s gold', 'Gold belongs to the king; a commoner who finds gold brings it to the king\'s men, who pay in cattle.',
      'After your punishment the king\'s men remind you of the gold law. Every grain found belongs to the Stone King; whoever brings it in is paid in cattle, and whoever keeps it is walled into the {w2}\'s outer ring.',
      'Swear to bring in what you find', 'They make you swear on a calf of the king\'s herd.', 'Ask what happens to the gold', 'They tell you, slowly. It goes to the coast.', 'The gold law is read to you.', {}, { honor: -3 }] };
  R['POL-143'] = { want: 'The lake\'s islands, which Nkara claims.',
    fear: 'Nkara\'s drum-king.',
    place: ['The drum-house', 'Where the king\'s ninety-two drums are kept, fed and beaten.'],
    own: ['bsm_silent', 'mourn', { share: 'eldestSon' }, 'The silent drums', 'When a father dies the house drum is silent a month, as the king\'s are a year; the eldest son takes it.',
      '{parent} is dead, and the house\'s small drum is turned to the wall for a month, as the king\'s ninety-two are for a year. The eldest son takes the drum and the land. The estate is {estate}; you get {got}.',
      'Turn the drum to the wall', 'The house is very quiet for a month.', 'Beat it once for {parent}', 'The neighbours hear. It is not done.', 'The house drum is silent for {parent}. You get {got}.', { happy: -2 }, { honor: -2 }] };
  R['POL-144'] = { want: 'All canoe trade through the Lake Gate.',
    fear: 'Busimo\'s fleet.',
    place: ['The Lake Gate drum-fort', 'The narrow water where every canoe passes the drum-king\'s walls.'],
    own: ['nkr_name', 'name', { by: 'keep' }, 'Named by the drum-house', 'Since 1019 every child, herder\'s or farmer\'s, is named by the drum-house.',
      'Your child is carried to the drum-house to be named, as every child in Nkara is since the old king made one naming for herders and farmers alike. The keeper beats the name out on a small drum: {child}.',
      'Carry the child to the drum-house', 'The name is beaten out over the child\'s head. It sleeps through it.', 'Name it at home in the old way', 'The drum-house names it anyway, and fines you.', '{child} is named by the drum-house.', { happy: 2 }, { coin: -3 }] };
  R['POL-145'] = { want: 'The copper trade down the lake.',
    fear: 'Lubwe\'s prices.',
    place: ['The long lake', 'A rift lake so long its far end is another country.'],
    own: ['rvl_canoe', 'levy', { who: 'male' }, 'The war canoe', 'A family\'s war canoe, thirty metres long with eighty paddlers, bears its crew\'s name; in war every man paddles.',
      'War on the lake. The family war canoe, thirty metres long, needs eighty paddlers, and its name is your family\'s. Every man of the family takes his place.',
      'Take your paddle', 'Eighty paddles hit the water at once. Your canoe leads the line.', 'Send a hired man', 'The canoe goes with a stranger in your place, and with your name on it.', 'You paddle in the family war canoe.', { sta: 1, honor: 1 }, { coin: -8, honor: -2 }] };
  R['POL-146'] = { want: 'To find the brother kingdom to the north the Stone Book names, and be one again.',
    fear: 'The lowland lake kings, and cattle plague.',
    place: ['The church of the Book', 'Cut forty metres down into the rock; a pilgrim walks down into it as into a grave.'],
    own: ['tsm_fast', 'ward', { when: 'any', every: 2 }, 'The fast days', 'There are about two hundred fast days a year, on which no animal food is eaten.',
      'A fast day, one of two hundred. No meat, no milk, no egg. The priest of the rock church walks the village at noon and smells the cooking pots.',
      'Eat bread and beans', 'You eat flatbread and spiced beans. The priest nods at your pot.', 'Eat the meat; it will spoil', 'The priest smells it from the lane.', 'You keep a fast day.', { piety: 1 }, { piety: -2 }] };
  R['POL-147'] = { want: 'To keep the inland gold flowing only to its weighers, and the monsoon ships coming.',
    fear: 'Ndorima marching to the coast.',
    place: ['The palace of two hundred rooms at Tumbaro', 'Coral stone cut from the living reef, white as salt.'],
    own: ['crc_monsoon', 'market', { cut: 0.06 }, 'The monsoon call', 'The monsoon\'s turn is called from the Well hall\'s tower; no ship may leave before the call, and harbour dues are paid at it.',
      'You sell on the coast. Nothing sails before the monsoon\'s turn is called from the Well hall\'s tower, and when it is, every cargo pays the harbour dues on the quay.',
      'Pay the dues at the call', 'The call goes up. Your goods go out on the first tide.', 'Load before the call', 'The harbour-master unloads you again, and charges for it.', 'You pay the harbour dues at the monsoon call: {cut}.', {}, { coin: -6 }] };
  R['POL-148'] = { want: 'Better copper prices, and the Copper River\'s mouth.',
    fear: 'Ndorima\'s tribute demands.',
    place: ['The great pits', 'Open copper pits older than the kingdom, stepped down like a stair.'],
    own: ['lbw_cross', 'wed', { dowry: -1 }, 'A copper cross', 'Copper crosses are bride-wealth everywhere; a king\'s daughter costs a thirty-kilo cross.',
      'Your marriage, and the bride-wealth is paid in copper crosses, as everywhere from here to the lakes. A king\'s daughter would cost thirty kilos; yours costs {paid}.',
      'Pay in good crosses', 'Her father weighs each cross in his hand and smiles.', 'Pay in thin crosses', 'He weighs them, and his smile goes.', 'You pay the bride-wealth in copper: {paid}.', { happy: 2 }, { honor: -3 }] };
  R['POL-149'] = { want: 'Grazing and the salt licks, and cattle from the lake kingdoms.',
    fear: 'Cattle plague.',
    place: ['The salt licks of the High Grass', 'Where every herd of the confederacy comes once a year.'],
    own: ['lgh_set', 'rite', { age: 17, who: 'male' }, 'The age-set', 'Every fifteen years a new age-set is made; a youth takes its name at initiation as a second name.',
      'A new age-set is being made, and you are of age for it. With the others you are initiated, given a spear, and given the set\'s name as your second name for life.',
      'Join the age-set', 'You come out of the initiation sore and proud, with a spear and a second name.', 'Wait for the next set', 'The next set is fifteen years off.', 'You are initiated into a new age-set.', { wil: 1, skill: { spear: 1 } }, { honor: -3 }] };
  R['POL-150'] = { want: 'The southern salt road\'s gold to come to Omboa rather than to Ndorima.',
    fear: 'Hadun raiders, and the surf.',
    place: ['The plaque walls', 'Nine hundred brass plaques of kings\' deeds on the palace walls.'],
    own: ['omb_kola', 'ward', { when: 'any', every: 2 }, 'The kola at a meeting', 'Kola is broken and shared at every meeting; to refuse it is to refuse the meeting.',
      'A meeting with a neighbour over a boundary. The kola nut is broken first and shared; to refuse it is to refuse the meeting, and the boundary with it.',
      'Break the kola and share it', 'Bitter, then sweet. The boundary is settled before the second piece.', 'Talk first, eat later', 'Your neighbour stands up and goes home.', 'You break kola at a meeting.', { happy: 1 }, { honor: -2 }] };
  R['POL-151'] = { want: 'To be free of the memory of Zanara\'s tribute, and to sell captives to the Coral Coast.',
    fear: 'Zanara coming back, and Ndorima.',
    place: ['Zanara\'s pillar', 'A stone the old overlords set up on the bank, which nobody will pull down.'],
    own: ['msn_swim', 'rite', { age: 18, who: 'male' }, 'The swim at flood', 'Each generation the strongest swimmer marries the River Bride; every young man swims the flood to be judged.',
      'The river is in flood. You are eighteen, and every young man swims across at the crest while the River Bride\'s priestesses watch. The strongest will marry the river and never a woman.',
      'Swim hard', 'You reach the far bank. You are strong, but not the strongest. Probably that is a relief.', 'Swim slowly on purpose', 'The priestesses saw. They are not fools.', 'You swim the flood before the priestesses.', { sta: 1, skill: { athletics: 1 } }, { honor: -2 }] };
  R['POL-152'] = { faith: 'REL-07', want: 'The salt price, and the southern wells.',
    fear: 'Drought, and Omboa\'s armies.',
    place: ['The salt pans', 'Flats cut into standard slabs, each slab a coin as far as Zanara.'],
    own: ['hdn_veil', 'rite', { age: 18, who: 'male' }, 'The veil at eighteen', 'Men veil their faces from eighteen and never unveil before a stranger, even to eat.',
      'You are eighteen. Your mother\'s brother winds the veil round your face for the first time. From now on no stranger sees your mouth, even when you eat.',
      'Take the veil', 'The cloth is hot and smells of indigo. Your face belongs to the clan now.', 'Ask to wait a year', 'They wait. Strangers stare at your bare face at the wells.', 'You take the veil at eighteen.', { wil: 1 }, { honor: -2 }] };
  R['POL-153'] = { want: 'To keep the monsoon crossing to the Thousand Isles alive.',
    fear: 'The League\'s ships cutting them out, and cyclones.',
    place: ['The founding canoe\'s cave', 'Where a canoe of about 400 lies, its sail woven with a chart of stars.'],
    own: ['crl_dance', 'mourn', { share: 'equal' }, 'Dancing the dead', 'The dead are taken from their tombs every seven years, wrapped in new cloth and danced with; the estate is shared alike.',
      '{parent} is laid in the family tomb. In seven years you will take them out, wrap them in new cloth and dance with them. The estate, {estate}, is shared alike: {got} to you.',
      'Promise the dance', 'The family promises together. Seven years is not long.', 'Say you will be gone by then', 'The aunts say the dead will find you.', '{parent} goes into the tomb. You get {got}.', { happy: -2 }, { happy: -3 }] };

  // ---- the Sunrise Isles
  R['POL-136'] = { want: 'The Spear-Marshalship at the election of 1106, which the Kalvaro and Harovi households both want.',
    fear: 'That the Kalvaro-Harovi feud becomes war, or that Hesh or Sokdal notices.',
    place: ['The ember shrine of Mount Menaro', 'The crater shrine where the Ember Queen tends the mountain\'s fire.'],
    own: ['mnr_east', 'ward', { when: 'any', every: 3 }, 'Facing east', 'Houses, graves and the throne face the sunrise; a man who turns his back on the east at dawn is fined.',
      'Dawn, and the whole {w2} turns to the east. You are out early, and your back is to the sunrise. The household steward is watching from the gate.',
      'Turn and face the sun', 'You turn. The sun comes up out of the sea into your face.', 'Finish what you are doing', 'The steward fines you a day\'s rice.', 'You face the sunrise at dawn.', { piety: 1 }, { coin: -3 }] };
  R['POL-137'] = { want: 'The Ouro hunters\' land north of the march.',
    fear: 'Ouro raids, and the court\'s neglect.',
    place: ['The March palisade', 'A wooden wall across the northern valleys, and the Ouro rivers beyond.'],
    own: ['ivr_hostage', 'ward', { when: 'landed', every: 4 }, 'The hostage-guest', 'Frontier households each keep an Ouro hostage-guest and raise him as a son.',
      'The Lord of the March sends an Ouro boy to your household as hostage-guest. You are to raise him as a son. His people will raise one of yours, somewhere in the north.',
      'Raise him as your own', 'He eats like a son and fights like one. One day he may be a friend on the other side.', 'Keep him in the storehouse', 'He grows up hating the March.', 'Your household raises an Ouro hostage-guest.', { coin: -4, honor: 2 }, { honor: -2 }] };
  R['POL-138'] = { want: 'To be left their rivers.',
    fear: 'The March.',
    place: ['The salmon rivers', 'Cold rivers out of the northern hills, and the villages along them.'],
    own: ['our_cub', 'ward', { when: 'any', every: 4 }, 'Sending the cub home', 'A bear cub is raised in the village for two years, then sent home to the gods at a feast.',
      'The cub your village has raised for two years is grown. Tonight it is sent home to the gods with songs and arrows, and every household brings food for the feast.',
      'Bring food and sing it home', 'The cub goes home with the village\'s news. The owl calls from the trees.', 'Keep away from the feast', 'The village sends it home without your voice.', 'You help send the bear cub home.', { piety: 2 }, { piety: -2 }] };
  R['POL-139'] = { want: 'Trade with the Northern Scatter and Taulen\'s smugglers, which the court forbids.',
    fear: 'The court\'s inspectors, and cyclones.',
    place: ['Urivo harbour', 'Where the sea-houses\' ships come in with their banners or without them.'],
    own: ['sch_banner', 'market', { cut: 0.05 }, 'The full hold', 'A ship that comes home with a full hold flies the house\'s banner, and the whole port drinks at the house\'s cost.',
      'You sell from a full hold. The house banner goes up at the mast, and by custom the whole port drinks tonight at the house\'s cost, and some of that is yours.',
      'Pay for the port\'s drink', 'Urivo drinks your health until dawn. The house\'s name is good.', 'Lower the banner', 'Nobody drinks. Everyone notices.', 'The port drinks at your house\'s cost: {cut}.', { fame: 1 }, { honor: -2 }] };
  R['POL-140'] = { cc: 1, want: 'More ships; the court wants fewer.',
    fear: 'Smugglers who land elsewhere.',
    place: ['The Port Island', 'The one island where foreign ships may land; Isles folk cross to it with a wooden pass.'],
    own: ['luh_pass', 'law', {}, 'The wooden pass', 'Foreigners may not leave the port island; Isles folk who cross to it carry a wooden pass.',
      'After your punishment the Port-Warden\'s clerk checks your wooden pass, turns it over and hands it back. Lose it, he says, and you stay on the island with the foreigners.',
      'Thank him and keep it close', 'You tie it to your belt.', 'Say you know the boatmen', 'He writes down the boatmen\'s names too.', 'The Port-Warden checks your wooden pass.', {}, { honor: -2 }] };
  R['POL-141'] = { want: 'To build and send the twelfth Long Ship, planned for 1110.',
    fear: 'The court refusing the timber.',
    place: ['The eastern cliff fire', 'A fire kept every night so the sun can find its way back.'],
    own: ['wtc_fire', 'ward', { when: 'any', every: 2 }, 'The cliff fire', 'A fire is kept on the eastern cliff every night, so the sun can find its way back; every household takes its night.',
      'Your household\'s night at the cliff fire. You carry driftwood up the path and keep the fire high until dawn, so the sun can find its way back.',
      'Keep it high till dawn', 'At dawn the sun finds its way. The Keeper writes your night in the Log.', 'Let it burn low', 'The sun comes anyway. The Keeper writes that down too.', 'You keep the eastern cliff fire through the night.', { piety: 1, wil: 1 }, { honor: -2 }] };

  C['CUL-120'] = [['ndi_herd', 'mourn', { share: 'eldestSon' }, 'Reciting the herd', 'Cattle carry the ancestors\' names; a family\'s herd is recited at the funeral and passes to the eldest son.',
    '{parent} is buried, and the herd is recited beast by beast, each with the ancestor it carries. The herd goes to the eldest son. The estate is {estate}; you get {got}.',
    'Recite the herd', 'You name every beast. Your voice cracks at the ninth.', 'Let the elders recite it', 'They recite it. They notice who did not.', 'The herd is recited for {parent}. You get {got}.', { happy: -2 }, { honor: -2 }]];
  C['CUL-121'] = [['bsl_morning', 'ward', { when: 'any', every: 3 }, 'Crossing before noon', 'The lake is crossed only in the morning, before the afternoon storms.',
    'You must cross the {w1} today. The rule is plain: in the morning, before the storms come up in the afternoon. It is already late morning.',
    'Wait for tomorrow', 'You wait. At three the storm comes over the water like a wall.', 'Cross now', 'The storm catches you a mile out. You get across, wet and shaking.', 'You cross the lake in the morning.', {}, { health: -6 }]];
  C['CUL-122'] = [['nkl_fish', 'season', { m: 6, pct: 0.1, min: 5, cap: 15, paid: 'The drum-fort takes one fish in ten from your season ({due}).', short: 'You have no catch to show at the Lake Gate. The drum-fort\'s men write your canoe down.', shortFx: { honor: -1 } }, 'One fish in ten', 'Every canoe through the Lake Gate pays one fish in ten of its season.',
    'The fishing season\'s reckoning at the Lake Gate. The drum-fort\'s men take one fish in ten from every canoe, and count with their hands in the hold: {due}.',
    'Let them count', 'One in ten, the best of each ten.', 'Hide fish under the nets', 'They lift the nets.', 'The Lake Gate takes one fish in ten.', {}, { coin: -6 }]];
  C['CUL-123'] = [['rvf_lamps', 'ward', { when: 'any', every: 2 }, 'The night nets', 'Sardine nets are cast at night by lamplight, and the lake glitters with a thousand fires.',
    'A dark night, and the sardine boats go out with lamps. The lake glitters with a thousand fires, and your family\'s boat is short a hand.',
    'Take a lamp and go', 'All night on the water. The catch is silver in the lamplight.', 'Sleep', 'The boat goes short-handed and comes back half full.', 'You fish the sardines by lamplight.', { coin: 2 }, { happy: -1 }]];
  C['CUL-124'] = [['tsi_names', 'name', { by: 'parent' }, 'Father\'s name after', 'A child carries its own name and its father\'s, and the Stone Book holds the lines.',
    'Your child {child} is born, and will carry your name after its own, as the lines are kept. The priest writes it on goatskin for the copy of the Book.',
    'Bring the child to the priest', 'The priest writes the line on goatskin. The child is in the Book.', 'Skip the church', 'The line is not written. The priest will remember.', '{child} is written into the lines.', { happy: 2 }, { piety: -1 }]];
  C['CUL-125'] = [['ccf_coral', 'grave', {}, 'Coral stone', 'The dead of the towns are buried under coral stone cut from the living reef.',
    '', '', '', '', '', 'You are buried under coral stone cut from the living reef.', {}]];
  C['CUL-126'] = [['lcf_furnace', 'ward', { when: 'any', every: 3 }, 'A mother\'s taboos', 'Smelting is a birth; while the copper runs, the smiths keep a mother\'s taboos and no one quarrels near the furnace.',
    'The furnace is lit and the copper is running. Until it is out, the smiths keep a mother\'s taboos, and the village keeps the peace near the {w2}. Your neighbour has insulted you.',
    'Swallow it until the copper is out', 'You say nothing. The copper comes out bright.', 'Have it out now', 'You quarrel. The copper comes out dull, and the smiths look at you.', 'You keep the peace while the copper runs.', { wil: 1 }, { honor: -3 }]];
  C['CUL-127'] = [['lhf_born', 'name', { by: 'keep' }, 'Born as the herd came home', 'Children are named for the hour and the cattle at the birth.',
    'Your child is born as the herd comes home at dusk, and so it is named: {child}, born as the herd came home.',
    'Carry the child out to the cattle', 'The cows breathe on it. It sneezes.', 'Keep it in the hut', 'The old men say a child should meet the herd it is named for.', '{child} is named for the hour of the herd.', { happy: 2 }, { happy: -1 }]];
  C['CUL-129'] = [['omf_seventh', 'name', { by: 'keep' }, 'The seventh day', 'A child is named on the seventh day by its father\'s mother, and the name says what was happening in the house.',
    'The seventh day, and your mother-in-law names the child for what was happening in the house when it came. She takes her time choosing. {child}, she says.',
    'Accept the name', 'Everyone repeats it. It is not the name you wanted. It fits.', 'Suggest another', 'She looks at you for a long time and says the name again.', '{child} is named on the seventh day.', { happy: 2 }, { happy: -2 }]];
  C['CUL-130'] = [['msf_canoe', 'ward', { when: 'any', every: 3 }, 'The launching song', 'Canoes are carved from one log, and a new canoe is launched with a song to the river.',
    'A new canoe, carved from one log, is ready on the {w2}. It must be launched with a song to the river, and every family of the stretch sings.',
    'Sing it into the water', 'It goes in straight and floats level. The river has accepted it.', 'Push it in without singing', 'It floats, and rolls, and everyone blames you.', 'You sing a new canoe into the river.', { skill: { music: 1 } }, { honor: -1 }]];
  C['CUL-131'] = [['hsc_slab', 'market', { cut: 0.05 }, 'The salt slab', 'Salt is cut in standard slabs, and a slab is a coin from the Desert Edge to Zanara.',
    'You sell at the pans. Everything is priced in {w2}s, standard slabs, and the clan takes one slab in twenty for keeping the pans.',
    'Pay in slabs', 'The clan\'s man cuts your slab with a mark. It will pass anywhere south of the sand.', 'Pay in thin slabs', 'He measures them and charges you a full one more.', 'The clan takes its slab: {cut}.', {}, { coin: -4 }]];
  C['CUL-133'] = [['cif_canoe', 'ward', { when: 'any', every: 3 }, 'The east canoe', 'Each year one canoe sails east on the monsoon to the Thousand Isles, and its return is the year\'s festival.',
    'The east canoe is home from the Thousand Isles. Every household goes down to the beach with food and garlands; it is the festival of the year.',
    'Go down with a garland', 'The crew come ashore through the surf, and you hang your garland on a cousin.', 'Mind the gardens', 'Your garden is weeded. Your cousin asks where you were.', 'You greet the east canoe home.', { happy: 2 }, { happy: -1 }]];
  C['CUL-84'] = [
    ['mnf_crest', 'ward', { when: 'soldier', every: 3 }, 'The lord\'s crest', 'A lord\'s retainers wear his crest on their sleeves; one who loses his lord must shave his head or find a new crest within a year.',
      'You serve, and the crest on your sleeve is your lord\'s. A retainer who loses his lord must shave his head or find a new crest within the year. Your lord\'s house has quarrelled with its neighbour.',
      'Keep his crest and stand by him', 'You stand by him. The crest is worn a little higher.', 'Look about for a new crest', 'Your lord hears of it.', 'You wear your lord\'s crest.', { honor: 2 }, { honor: -3 }],
    ['mnf_smoke', 'ward', { when: 'any', every: 4 }, 'Barefoot under the smoke', 'When the mountain smokes heavily the court and the household go barefoot for three days.',
      'The mountain is smoking heavily. For three days the court goes barefoot, and every {w2} with it, so the Ember Queen\'s fire knows the isles are humble.',
      'Go barefoot three days', 'Three days on cold stones. The smoke thins.', 'Keep your sandals', 'The smoke thins anyway. The steward notices your feet.', 'You go barefoot under the mountain\'s smoke.', { piety: 1 }, { honor: -2 }],
    ['mnf_name', 'name', { by: 'keep' }, 'The household name first', 'Household name first, given name second; the given name changes at a man\'s first command.',
      'Your child {child} is born, and is entered household name first, given name second, on the household tablet. If it ever commands, the name will change.',
      'Enter the child on the tablet', 'The steward writes the name. The household is one larger.', 'Wait until it thrives', 'The steward writes it anyway, in pencil.', '{child} is entered on the household tablet.', { happy: 2 }, { happy: -1 }],
  ];
  C['CUL-86'] = [['ouf_rude', 'name', { by: 'keep' }, 'A rude name', 'A baby is given a rude name to keep the spirits from wanting it, and a true name at five.',
    'Your child is born and, as is done here, given a rude name so the spirits will not want it: Dog-Dung, Old Stink. Its true name, {child}, waits until it is five.',
    'Call it by the rude name', 'You call it Old Stink at the door, loudly. The spirits are not interested.', 'Use the true name now', 'The grandmothers are frightened.', '{child} is given a rude name.', { happy: 2 }, { happy: -2 }]];
  C['CUL-87'] = [['scs_house', 'mourn', { share: 'daughters' }, 'The sea-house', 'Women may head sea-houses and pass them to daughters.',
    '{parent} is dead. The sea-house, its ships and its books pass down to the daughters, as the South Chain allows. The estate is {estate}; your share is {got}.',
    'Toast the new head of the house', 'The crews drink to her. The banner goes up.', 'Ask the crews to choose', 'They choose her anyway, and remember you asked.', 'The sea-house passes on. You get {got}.', { happy: -2 }, { honor: -2 }]];
})();
