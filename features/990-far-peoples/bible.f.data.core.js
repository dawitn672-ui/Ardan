// Far realm bibles, the Long Grass (990-far-peoples). Format: see bible.r.data.core.js.
(function () {
  const R = A.FARP_REALMS = A.FARP_REALMS || {}, C = A.FARP_CULT = A.FARP_CULT || {};

  R['POL-58'] = { want: 'Tegur wants his heir Ulgai named by the Felt Council before he dies, and Hesh\'s tribute doubled.',
    fear: 'That the Right Wing breaks away at his death, as every khaganate of the grass has split before.',
    place: ['The Forbidden Valley', 'In the Felt Mountains, where Tegur\'s grave is already dug and nobody but the Keepers may go.'],
    own: ['khg_ten', 'muster', { m: 3, who: 'male', need: 'mounted', ok: [{ skill: { riding: 1, bow: 1 } }, 'Your ten\'s leader looks over your horse and your bow and moves on to your brother.'], short: [{ honor: -2, coin: -5 }, 'You stand before your ten\'s leader without a horse. He answers for you, and makes you pay for it.'] },
      'The count of tens', 'Every household belongs to a ten, a hundred and a thousand; each spring a man shows his ten\'s leader his horse and his bow.',
      'Spring, and the count. Every man of the camp stands before his ten\'s leader with his horse, his bow and his brother. The leader answers to the hundred, the hundred to the thousand, the thousand to the khagan.',
      'Stand for the count', 'You are counted: one man, one horse, one bow. The khagan knows you exist.',
      'Be out after strays', 'Your ten is counted one short. The leader finds you the next day.', 'You stand in the spring count of your ten.', {}, { honor: -3 }] };
  R['POL-59'] = { want: 'To be khagan after Tegur, or to rule the Right Wing alone and keep the Gap\'s whole toll.',
    fear: 'The Left Wing\'s guards, and Ulgai.',
    place: ['Torul', 'The Wing-Khan\'s winter city on the Grey Arm, felt and timber round a stone court.'],
    own: ['rwg_rope', 'rite', { age: 18, who: 'male' }, 'The twelve ropes',
      'At the spring gathering each clan is tied to the Wing-Khan\'s tent by a horsehair rope; a grown man lays his hand on his clan\'s.',
      'The spring gathering, and the twelve ropes run from the Wing-Khan\'s tent to the clans\' standards. You are eighteen; today you lay your hand on your clan\'s rope with the men.',
      'Lay your hand on the rope', 'The rope is greasy with a hundred years of hands. You are of the Right Wing now.',
      'Keep your hands in your belt', 'Nobody cuts the rope, but people saw whose hand was missing.', 'You lay your hand on your clan\'s rope at the gathering.', { honor: 1 }, { honor: -3 }] };
  R['POL-60'] = { want: 'Grazing: the old line at the Grey Arm\'s headwaters back from the Right Wing\'s clans.',
    fear: 'A killing winter, and a united khaganate.',
    place: ['The hide-house of Vaagmaar', 'Sixty winter-counts on painted hides, the oldest three thousand years old.'],
    own: ['omr_walk', 'ward', { when: 'any', every: 3 }, 'The Telling of the Walk',
      'Every midsummer the clan-mothers recite which of the sixty clans walked west and which stayed, and spit for those who left.',
      'Midsummer, and the Telling of the Walk. The clan-mothers stand under the hides and recite the sixty clans, name by name: who stayed on the {w1}, and who walked west. For each that left, the camp spits.',
      'Spit with the camp', 'Sixty names, and a dry mouth by the end. The mothers are pleased.',
      'Keep your mouth closed', 'The mother nearest you notices. She spits for you, at you.', 'You spit for the clans that walked west.', { honor: 1 }, { honor: -2 }] };
  R['POL-61'] = { want: 'The right to tax caravans on the Saltpan crossing, which two others claim.',
    fear: 'The Old Mare clans, who call half-orcs foals of the wrong mare.',
    place: ['The Thuldush salt lick', 'Where the clans meet, and where the cattle of three peoples lick the same salt.'],
    own: ['rhd_hollow', 'rite', { age: 17, who: 'all' }, 'The Red Hollow',
      'Every grown member of the Red Hide goes once to the Red Hollow to dig their own ochre.',
      'You are seventeen. The clan sends you to the Red Hollow, the one pit, with a bone spade and a skin bag. The ochre you dig is yours for life; it marks you as {w1}.',
      'Dig your own ochre', 'Your hands come out red to the elbow. The colour does not wash off for a month.',
      'Buy ochre from a trader', 'It is the same red. Everyone knows it is not yours.', 'You dig your own ochre at the Red Hollow.', { sta: 1 }, { honor: -3 }] };
  R['POL-62'] = { cc: 1, want: 'To keep the ferries running as the sea shrinks a kilometre a year.',
    fear: 'The sea drying out, so that caravans walk across the salt and pay nobody.',
    place: ['The Shrinking Sea', 'Its old shore lines are cut on posts at every landing; they have walked thirty kilometres in seven hundred years.'],
    own: ['slp_coin', 'market', { cut: 0.05 }, 'A coin for the sea',
      'Every caravan crossing the Shrinking Sea throws one coin into it; the clan\'s divers collect them at year\'s end.',
      'You cross with a load to sell. At the middle of the ferry every traveller throws a coin into the water, and the ferrymen watch that it is a real one. At year\'s end the divers bring them up.',
      'Throw a good coin', 'It goes down green and slow. The ferryman nods.',
      'Throw a lead slug', 'The ferryman sees it. The fare for the way back doubles.', 'You throw a coin to the Shrinking Sea: {cut}.', {}, { coin: -6 }] };
  R['POL-63'] = { want: 'To stop paying the khagan 30,000 bushels a year, and to sell iron at its own price.',
    fear: 'The khagan\'s death-war passing through its fields.',
    place: ['Kolmavor\'s earth walls', 'Walls of rammed earth built by the First Khaganate about 620, still higher than a rider.'],
    own: ['brm_skull', 'ward', { when: 'any', every: 4 }, 'The bear over the door',
      'Every farm keeps a bear\'s skull over its door and gives it back to the forest after nine years.',
      'The bear skull over your farm\'s door has had its nine years. It must go back to the forest, carried by the head of the house, and a new one be taken at the next feast.',
      'Carry it to the forest', 'You leave it in the moss at the forest edge and walk back without turning round.',
      'Leave it up another year', 'It stays. In the village they say the bear is tired of your door.', 'You give the old bear skull back to the forest.', { piety: 1 }, { piety: -2 }] };
  R['POL-64'] = { want: 'To sell Lake Nermur\'s salt straight to the Basins, not through the khagan\'s officers.',
    fear: 'The Right Wing\'s claims, and raiders coming down the Ice Stair.',
    place: ['The Causeway to Nowhere', 'A causeway of the Bronze Weir age running nine kilometres into the lake and stopping.'],
    own: ['lks_ice', 'ward', { when: 'any', every: 3 }, 'Walking the ice',
      'The reed-cutters\' year begins when the fresh half of the lake freezes; the first to cross to the salt half is chief of the feast.',
      'The fresh half of the lake has frozen. The young men stand on the shore and look at the grey ice toward the salt half, which never freezes hard. The first across is chief of the winter feast.',
      'Walk out across the ice', 'It groans the whole way. You reach the salt edge and turn, and the shore cheers.',
      'Wait for someone else to go first', 'Someone else goes first. He is chief of the feast, and he lets you know it.', 'You walk the ice at the year\'s turn.', { wil: 1, fame: 1 }, { happy: -1 }] };
  R['POL-65'] = { want: 'That the khagan\'s caravans keep using their wells.',
    fear: 'Drought, and the wells failing.',
    place: ['The Bone Fields', 'Fossil beds of bones too big for any living beast; the clans sell the eggs in Moriden.'],
    own: ['grv_guest', 'ward', { when: 'any', every: 3 }, 'The guest on foot',
      'A guest who reaches a camp on foot is given a camel; one who arrives on a camel gets water and nothing else.',
      'A traveller walks into your camp out of the gravel, on foot, half dead. The law of the gravel is plain: a guest who comes on foot leaves on a camel.',
      'Give him a camel', 'He leaves on your second-best camel. Next year his clan sends you two.',
      'Give him water and point the way', 'He walks on. The story walks faster than he does.', 'A guest on foot leaves your camp on your camel.', { coin: -6, honor: 2 }, { honor: -3 }] };
  R['POL-66'] = { want: 'That no khagan\'s grave is ever found, and the next khagan is chosen in the valley as the law says.',
    fear: 'Grave-robbers paid by Hesh\'s collectors, and a khagan chosen elsewhere.',
    place: ['The Forbidden Valley', 'The khagans\' graves in the Felt Mountains, under grass a thousand horses have ridden flat.'],
    own: ['flk_ride', 'grave', {}, 'The thousand horses', 'A Keeper\'s grave is ridden over until no one can find it, as a khagan\'s is.',
      '', '', '', '', '', 'You are buried in the valley, and the Keepers ride over the place until the grass hides it.', {}] };
  R['POL-67'] = { want: 'Revenge on the Hesh banners who took their best grazing for horse-farms in 1068.',
    fear: 'Being given to Hesh in a peace treaty.',
    place: ['Balsen meadow', 'The summer grass under the Boundary Hills, where the Sable traders come down with furs.'],
    own: ['dwn_raid', 'wed', { dowry: -1 }, 'The sham raid', 'A bride is carried off in a sham raid at the new moon; the groom\'s family pays the raid price in horses next morning.',
      'The new moon, and your wedding raid. The groom\'s riders carry the bride off at a gallop, her brothers chase them halfway and turn back laughing, and in the morning the raid price is paid in horses: {paid}.',
      'Pay the raid price in good horses', 'Her father walks round each horse twice and calls the raid a fair one.',
      'Pay in old horses', 'He takes them. At the wedding feast he tells everyone what he was paid with.', 'The raid price is paid: {paid}.', { happy: 2 }, { honor: -3 }] };
  R['POL-68'] = { want: 'To keep the Gap open, whoever is khagan.',
    fear: 'The khaganate splitting and the Gap becoming a frontier.',
    place: ['The Wind Fair grounds', 'The flat below the town where thirty thousand horses are sold each autumn.'],
    own: ['tdz_horse', 'market', { cut: 0.05 }, 'One in a hundred', 'Every herd driven through the Gap pays one horse in a hundred; the town sells its own herd at the Wind Fair.',
      'You sell in the Gap. The Reeve\'s men count what passes the {w1}, and of every hundred they take one. What you sold today pays its share before you are out of the gate.',
      'Pay the town\'s share', 'A clerk writes it in Gap-talk, so that nobody can say they did not understand.',
      'Argue it in another tongue', 'They answer in Gap-talk, and charge you for the interpreter.', 'The Gap takes its one in a hundred: {cut}.', {}, { coin: -5 }] };
  R['POL-69'] = { want: 'To go home to the Sable Woods with honour, or ride into Moriden behind the khagan.',
    fear: 'Moriden\'s offer of pardon, which half the men would take.',
    place: ['The Broken Pole', 'Their banner, carried on a broken pole since 1088 and not to be mended.'],
    own: ['bbn_pole', 'levy', { who: 'male' }, 'The broken pole', 'The banner is carried on a broken pole, and every man rides under it to war until the old emperors ride again.',
      'War, and the Banner Without a Pole calls the households. The banner goes out on its broken pole, and every man who can sit a horse rides under it. Those who do not are written off the roll.',
      'Ride under the broken pole', 'You ride behind it with the others. Nobody talks about mending it.',
      'Take Moriden\'s pardon instead', 'You stay behind. Half the camp will not look at you, and the other half asks how the pardon was.', 'You ride to war under the broken pole.', { honor: 2 }, { honor: -5 }] };

  C['CUL-43'] = [['lwk_hunt', 'rite', { age: 17, who: 'male' }, 'The horse-name', 'A youth who rides his first ring-hunt is given a horse-name by his father\'s clan and keeps it for life.',
    'The ring-hunt, and your first. The riders close the ring for two days, and when it is over your father\'s clan gives you a horse-name in front of the {w2}. It is yours till you die.',
    'Ride the ring and take your name', 'You ride well enough. The name they give you is a fast one.', 'Ride at the back and stay safe', 'They give you a name. It is a slow horse\'s name.', 'You ride the ring-hunt and are given a horse-name.', { skill: { riding: 1 } }, { honor: -2 }]];
  C['CUL-44'] = [['rwk_bride', 'wed', { dowry: 1 }, 'The dawn raid', 'A bride is taken from her tent at dawn by the groom\'s riders; her brothers chase them halfway and turn back.',
    'Dawn, and the groom\'s riders sweep the bride out of her tent. Her brothers mount and chase them halfway across the grass, shouting, and then turn back at the agreed stone. The dowry follows: {dowry}.',
    'Ride hard to the stone', 'You reach the stone first. Her brothers turn back grinning.', 'Let them catch you', 'They catch you, as a joke, and tell it at every gathering for years.', 'The dawn raid takes the bride to her new tent.', { happy: 2 }, { honor: -2 }]];
  C['CUL-45'] = [['oml_winter', 'name', { by: 'keep' }, 'A winter before a name', 'A child is not named until it has lived one winter; one who dies before is buried nameless under the tent floor.',
    'Your child has lived through a winter. Only now, by the old law of the {w1}, is it named, and the counter paints a mark for it on the hide. It is {child}.',
    'Call the child by name at last', 'The name is said aloud for the first time, and the whole camp says it back.', 'Keep calling it the small one', 'The clan-mothers frown. A child with no name, they say, is easy for the winter to take.', '{child} has lived a winter and is named.', { happy: 2 }, { happy: -2 }]];
  C['CUL-46'] = [['rhc_both', 'name', { by: 'keep' }, 'Two names', 'A child may have an orc name and a human name; the clan-mother calls it by the one she likes.',
    'Your child is born, and is given two names here, as many of the {w3} are: an orc name and a human one. {child} is what the clan-mother calls it; the other waits.',
    'Give both names', 'The child has two names and will choose at thirteen. The clan-mother already has.', 'Give it one name only', 'The Old Mare would approve. The Red Hide do not.', '{child} is given two names.', { happy: 2 }, { honor: -1 }]];
  C['CUL-47'] = [['slh_brand', 'law', {}, 'The salt-mark', 'Every camel carries its owner\'s salt-mark; to rebrand a camel is a hanging matter.',
    'After your punishment the clan elders show you a branding iron: your household\'s salt-mark. Brand your camels on the left flank, they say, and never touch another man\'s mark.',
    'Brand your camels again in front of them', 'They watch you brand every beast. Your herd is clean.', 'Say a mark is just a mark', 'They write your herd down as one to watch.', 'The elders make you brand your camels before them.', { honor: 1 }, { honor: -3 }],
    ['slh_salt', 'ward', { when: 'any', every: 3 }, 'Salt and a date', 'Guests are given salt and a date before anything else; a man who has eaten your salt may not raid your herd that year.',
      'Riders at the {w1}, strangers. Before anything else they are given salt and a date. A man who has eaten your salt may not raid your herd this year.',
      'Give them salt and a date', 'They eat. Their leader licks the salt off his thumb and looks at your camels with friendlier eyes.', 'Give them nothing until they speak', 'They speak, and ride off, and count your camels as they go.', 'Strangers eat your salt and date.', { honor: 1 }, { coin: -5 }]];
  C['CUL-48'] = [['brf_loaf', 'season', { m: 8, pct: 0.03, min: 4, cap: 6, paid: 'The khagan\'s riders take the loaf and the salt at your gate ({due}) and ride on.', short: 'You have no loaf to put out. The riders stop at your gate and look round the yard.', shortFx: { honor: -1, happy: -2 } }, 'The loaf at the gate', 'When the khagan\'s tax riders come, every farm leaves a loaf and salt at the gate; the riders take the loaf and leave the farm.',
    'The khagan\'s tax riders are on the road. Every farm puts a loaf and a dish of salt on a cloth at its gate. The riders take the loaf and ride past the farm.',
    'Put out the loaf and salt', 'The riders take the loaf and do not stop. That is what the loaf is for.', 'Put out nothing and bar the gate', 'They stop. They are in your yard an hour.', 'You leave a loaf and salt for the khagan\'s riders.', { coin: -1 }, { coin: -8 }]];
  C['CUL-49'] = [['lsc_boat', 'wed', { dowry: 1 }, 'The reed boat', 'A marriage gift is a reed boat built by the groom; if it leaks, the bride\'s mother may refuse him.',
    'Your wedding gift is a reed boat built by the groom\'s own hands. The bride\'s mother rows it out on the {w1} and sits in it a long while, looking at the bottom. The dowry is {dowry}.',
    'Build it tight and wait', 'She rows back dry. She says nothing, which means yes.', 'Buy a boat from a reed-cutter', 'It does not leak. She knows whose knots those are.', 'The bride\'s mother sits in the reed boat. It is dry.', { skill: { craft: 1 }, happy: 2 }, { honor: -2 }]];
  C['CUL-50'] = [['gsc_saddle', 'mourn', { share: 'eldestSon' }, 'The saddle under the head', 'The dead are left on the gravel with their saddle under their head; the eldest son takes the herd.',
    '{parent} is laid on the gravel with a saddle under the head, facing the {w3}. Nobody touches the saddle again. The herd goes to the eldest son; the estate is {estate}, and you get {got}.',
    'Leave the saddle and walk away', 'You walk away without looking back. The gravel keeps the rest.', 'Take the saddle; it is a good one', 'You take it. Nobody in the camp will sit on it, or near you.', '{parent} is left on the gravel. You get {got}.', { happy: -2 }, { honor: -4 }]];
  C['CUL-51'] = [['fkp_oath', 'rite', { age: 20, who: 'all' }, 'The Keeper\'s oath', 'A Keeper takes the name of a dead khagan\'s horse at the oath, and gives up his own forever.',
    'You are twenty, and of age for the Keepers\' oath. You will give up your name forever and take the name of a dead khagan\'s horse, and the valley will be yours to keep till you die.',
    'Take the oath and the horse\'s name', 'Nobody calls you by your old name again. The grass in the valley looks different now.', 'Keep your name a while longer', 'The Keepers wait. They are good at it.', 'You take the Keepers\' oath.', { piety: 3, wil: 1 }, { honor: -2 }]];
  C['CUL-52'] = [['dgc_honey', 'name', { by: 'keep' }, 'The pot of forest honey', 'A Sable bride brings forest honey to her husband\'s tent; it is eaten at their first child\'s naming.',
    'Your child {child} is named today, and the pot of forest honey that came with the bride is opened at last. Every guest gets a finger of it, and the child a taste.',
    'Open the honey for the naming', 'The honey has gone hard and dark. It is the best thing anyone has eaten all year.', 'Save the honey for a better day', 'The guests eat mutton. Your wife says nothing about the honey, at length.', '{child} is named, and the forest honey is eaten.', { happy: 2 }, { happy: -2 }]];
  C['CUL-53'] = [['gap_wind', 'ward', { when: 'any', every: 3 }, 'The west shutters', 'Inns close their west shutters on the first day of the Gap Wind and open them on the last, and both days are a feast.',
    'The first day of the Gap Wind. Every inn in town slams its west shutters at once, and the {w1}s are hung with ribbons. Shutting yours with the town is half the feast.',
    'Shut the shutters with the town', 'The bang goes down the street like a drum. Then there is drink.', 'Leave them open for the light', 'The wind takes your lamp, your papers and your good name in one night.', 'You shut the west shutters with the town.', { happy: 2 }, { coin: -3 }]];
})();
