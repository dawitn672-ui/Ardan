// The far faiths (990-far-peoples): what each of the 55 faiths of the Great Continent calls its clergy, the holy day its
// realms keep as a custom (47-realm-bible's `year` kind), and the words of that day. The holy days' names and months
// come from the lore (words.data.core.js, A.FARP_DAYS); everything said here is written for the game.
//   priest  how a scene names the faith's clergy ("the priest" in the release's own events)
//   day     which of A.FARP_DAYS is the realm's custom (an index), or [name, month] where the lore has no fixed month
//   rite    what a household does on the day, as a verb phrase: "Every household keeps {hday}: it {rite}."
//   scene   the first meeting's words (after "<Month>, and {hday}.")
//   keepT, keep, defyT, defyR   the choice to keep the day, its result; the choice to stay away, its result
//   strict  true: the faith counts who stays away (defying costs honour as well as piety)
(function () {
  const F = A.FARP_FAITH = A.FARP_FAITH || {};
  const f = (id, priest, day, rite, scene, keepT, keep, defyT, defyR, strict) => { F[id] = { priest, day, rite, scene, keepT, keep, defyT, defyR, strict: !!strict }; };

  // ---- the Twin Rivers and the Sand Basins
  f('REL-20', 'the examined official', 1, 'sweeps its graves and feeds the tablets',
    'The whole village walks out to the grave mounds with brooms and bowls. The headman reads the names off the tablets in order, eldest first.',
    'Sweep the graves and read the names', 'You sweep, set out rice and say each name aloud. The headman marks your household present.',
    'Stay in the field; the dead can wait', 'The headman marks your household absent. Your neighbours notice whose graves are dusty.', true);
  f('REL-21', 'the censor', 0, 'burns a memorial for an honest man who died',
    'In the yamen court the censors burn copies of their dead colleagues\' memorials. Anyone may bring a name of an honest man to add.',
    'Bring a name to the fire', 'You give a name. The censor writes it on a slip and burns it with the rest.',
    'Keep away from censors', 'Nobody asks for you. A clerk notes, all the same, who did not come.');
  f('REL-22', 'the paper-god seller', 0, 'smears honey on the Kitchen Clerk\'s mouth and burns him',
    'The year\'s end. The paper Kitchen Clerk over the stove has watched your house all year. Tonight he goes up to report.',
    'Smear his mouth with honey and burn him', 'He goes up in a curl of sweet smoke. Tomorrow a new one is pasted up, clean.',
    'Let him go up as he is', 'You do not sweeten him. Your grandmother will not speak to you until the new one is up.');
  f('REL-23', 'the monk', 1, 'lights the road lamps and feeds whoever comes',
    'The Long Night of Lamps. Every Lamp monastery lights its road from gate to gate, and every house on the road sets a bowl out for travellers.',
    'Set a lamp and a bowl at your gate', 'Three travellers eat at your gate before midnight. One leaves a copper; one leaves a blessing.',
    'Bar the gate and save the oil', 'The road is lit everywhere but at your gate. The monks walk past it slowly.', true);
  f('REL-24', 'the chaplain', 1, 'brings its weapons to be blessed',
    'The Lamp of Arms. The monk-soldiers drill in the monastery yard, and anyone who carries a blade brings it to be touched with lamp oil.',
    'Bring your blade to the lamp', 'A monk wipes oil along the edge and says a line you do not catch.',
    'Keep your blade at home', 'You stay home. The monks are not offended; the soldiers are.');
  f('REL-25', 'the monk', 1, 'gives morning alms and presses gold leaf on an image',
    'The Lighting at the full moon of May. The monks walk the streets at dawn with their bowls, and the temple images glitter with new gold leaf.',
    'Fill a bowl and buy a leaf of gold', 'You press your square of gold onto the image\'s knee. It is already thick with other people\'s.',
    'Sleep through the alms round', 'The bowls pass your door empty. Your mother gives twice to make up for it.');
  f('REL-26', 'the hermit', 0, 'keeps a week of silence',
    'The Silent Week. From the first dawn of the year nobody in the valley speaks for seven days. Bargains are made by fingers; quarrels wait.',
    'Keep the silence for seven days', 'Seven days of fingers and nods. On the eighth your voice sounds strange to you.',
    'Talk; somebody has to sell the goats', 'You talk. People turn away from you as from a smell.', true);
  f('REL-27', 'the Wick', 0, 'breaks a lamp and burns a debt-book in the dark',
    'The Breaking, at the new moon of May. In a cellar the cell meets without a light, and someone has brought a monastery\'s debt-book.',
    'Go down to the cellar and break a lamp', 'You break a clay lamp under your heel. The debt-book burns on the floor, and everyone is quiet.',
    'Stay above ground tonight', 'You stay home. The Wicks remember who was there, and who was not.');
  f('REL-28', 'the fire priest', 0, 'takes new fire home from the temple',
    'The New Day at the spring equinox. The fire priests in their mouth-cloths give every household a coal from the flame that never dies.',
    'Carry the temple coal home in a pot', 'You carry it home without blowing on it, which is harder than it sounds. The hearth is new.',
    'Keep your own old fire', 'Your hearth is a year old tonight. The priests call that a dirty fire.', true);
  f('REL-29', 'the Burnt Tongue', ['the night watch of the pipes', 9], 'stands a night watch at the pipe-houses',
    'A night watch at the pipe-houses of the order. Nobody is told what the pipes carry, and nobody asks twice.',
    'Stand the watch and ask nothing', 'You stand till dawn by a pipe that is warm to the touch. Nobody speaks to you.',
    'Plead a fever', 'They let you go. Your name is set down on a list you will never see.');
  f('REL-62', 'the dyke-warden', 0, 'reads the wardens\' names at the dyke shrine',
    'The Wardens\' Day, the first of the high-water watch. At the shrine on the embankment the warden reads out the names of officials who died holding the dyke.',
    'Stand at the shrine and leave rice', 'You stand through the names. The river is already high and brown behind the shrine.',
    'Go fishing on the high water', 'The fish are good. The warden reads your father\'s name too, and looks for you.');
  f('REL-63', 'the speaker', 0, 'carries the first rice to the mother grove',
    'The Mothers\' Feast, after the first rice harvest. The clan carries the first basket up the ridge to the grove no one cuts.',
    'Carry a basket up to the grove', 'You leave the rice at the roots of the oldest tree. The speaker ties a thread on your wrist.',
    'Sell the first basket instead', 'You get a good price. The speaker will not tie a thread on your wrist this year.');
  f('REL-64', 'the silk priestess', 0, 'warms the silkworm eggs and whispers in the lofts',
    'The Hatching. The worm eggs have been warmed for days against the women\'s bodies, and today the loft is kept as quiet as a sickroom.',
    'Whisper, and keep the loft warm', 'The eggs hatch black and tiny. The priestess counts them and says it will be a year.',
    'Shout up the ladder for your dinner', 'The priestess hears it. If the worms sicken this year, everyone will know why.');
  f('REL-65', 'the tower monk', 0, 'lights the beacon towers and keeps them lit',
    'The Lighting of the Towers at midwinter. Every beacon on the Corridor is lit at once, and the soldiers stand the night as lay monks.',
    'Carry oil up to the tower', 'You climb with a jar on your back. From the top the lights run away east and west like a road.',
    'Leave the tower to the soldiers', 'The tower is lit without you. A monk writes your name under those who stayed below.');
  f('REL-66', 'the grave-cutter', ['the Opening of the Jade Rivers', 3], 'gathers jade for the dead',
    'The Opening of the Jade Rivers. The grave-cutters\' families wade the shallows for green stones, and every household that can sends someone.',
    'Wade the river for jade', 'You find two small stones and give the better to the grave-cutter, for your grandmother\'s suit.',
    'Leave jade to the rich', 'You stay dry. Your grandmother will be buried with less, and says so.');
  f('REL-68', 'the master catcher', ['the Lease Day', 9], 'asks the elephant lords\' leave for the season',
    'The Lease Day, after the rains. The master catchers walk to the forest edge with rice and rope and speak to the elephant lords in the secret tongue.',
    'Carry the rice and keep your mouth shut', 'You stand behind the catchers and say nothing in the plain tongue. The forest is quiet back.',
    'Go in without asking', 'You go in early. The catchers will not take you this season.');
  f('REL-69', 'the master of the wells', ['the Weighing', 2], 'weighs one coin in a hundred at the Inner Well',
    'The first new moon of the caravan season, and the Weighing. Every broker in the Nine Wells brings a purse, and one coin in a hundred goes on the scale.',
    'Bring your purse to the scale', 'Your coin weighs true. A master nods, and you are a man whose word has a weight.',
    'Keep your purse shut this year', 'Nobody forces you. Nobody offers you a bargain on trust this year either.');
  f('REL-74', 'the woman shaman', 0, 'brings rice cakes to the grandmother of its mountain',
    'The Grandmothers\' Festival. The shamans dance with bells and fans at the foot of the mountain, and every household brings rice cakes.',
    'Bring cakes and watch the dance', 'The shaman spins past you and taps your shoulder with her fan. The old women say that is lucky.',
    'Stay home and mend the roof', 'You mend the roof. Building without the grandmother\'s leave, the old women say; you will see.');

  // ---- the Long Grass and the High Steppes
  f('REL-30', 'the felt-keeper', 0, 'sprinkles mare\'s milk to the four quarters',
    'The White Month, and the camp\'s first milking of the year. The drummer walks round the tents, and every family flicks milk to the four quarters.',
    'Flick the milk to the four winds', 'The milk goes up white and comes down on the grass. The drummer beats once for your tent.',
    'Drink the milk yourself', 'You drink it. An old woman spits, carefully, to the side.', true);
  f('REL-31', 'the marmot-speaker', 0, 'moves the camp away from the burrows',
    'The Marmot\'s Silence, the hottest week of summer. The marmot-speaker has listened to the burrows and says the camp must move.',
    'Strike the tent and move with the camp', 'A day of packing in the heat. The new ground is worse, and nobody falls sick.',
    'Stay by the good water', 'You stay. The camp moves away from you as from a sick man.');
  f('REL-32', 'the clan-mother', 0, 'paints the year on the winter count',
    'The first snow, and the Winter Count. The keeper paints one picture for the whole year on the hide, and every tent argues for its own.',
    'Tell the keeper your year', 'You tell her about your year. She paints something else, but she listened.',
    'Leave the count to the old', 'The year is painted without you. Your tent is not in it.');
  f('REL-33', 'the monk', 0, 'turns the prayer wheels and lights butter lamps',
    'The Sky New Year. The monastery\'s prayer flags are renewed, and every household carries butter for the lamps up the stair.',
    'Carry butter up the stair', 'Your arms ache from the climb. The new flags crack in the wind over your head.',
    'Keep the butter for the winter', 'The butter lasts the winter. The monks do not ask after you.');
  f('REL-34', 'the red abbot', 0, 'watches the peaks and burns juniper',
    'The Day of the Watch, the first clear day after the monsoon. Everyone climbs to a ridge and watches the peaks for a dragon.',
    'Climb and keep the watch till dusk', 'No dragon. The juniper smoke goes up anyway, and the abbot says the watch is the prayer.',
    'Stay down and work', 'You work. If a dragon comes this year, it will not be your fault, but they will say it is.');
  f('REL-35', 'the lord-speaker', 0, 'gives the mountain lord a sheep',
    'The Lords\' Feast. The valley drives its sheep to the cairn below the peak, and the lord-speaker chooses which go to the mountain.',
    'Give a sheep to the lord', 'The lord-speaker takes a good ewe. Juniper smoke, and a stone added to the cairn.',
    'Give the worst sheep you have', 'He takes it without a word. In spring a slide of stones comes down near your fold.');
  f('REL-36', 'the law-carver', 0, 'carries a coal from the First Forge',
    'The Kindling. The First Forge is lit once a year, and every hearth in the hold is relit from its coal.',
    'Relight your hearth from the forge', 'You carry the coal down in an iron pot. Your hearth takes it at once.',
    'Keep your own fire burning', 'Your fire never went out. The carvers call it an unlawful fire.', true);
  f('REL-48', 'the feast-master', 0, 'sends the bear home with songs',
    'Late winter, and a bear has been taken in its den. For five nights the clan feasts it as a guest and apologises to it.',
    'Sit up five nights with the bear', 'You sing to the bear\'s head on the fifth night and do not laugh once. It goes home well.',
    'Go to bed early', 'You sleep. The feast-master does not seat you near the bear again.');
  f('REL-49', 'the drum-walker', 0, 'sits the night while the walker fetches the sun',
    'The Drum Night at midwinter. The drum-walker beats until the small hours and walks the world-tree to bring the sun back.',
    'Sit in the tent until the drum stops', 'Near dawn the drum stops and the walker falls over. Someone says the sun is coming.',
    'Sleep through the drum', 'You sleep. In the morning the sun comes up regardless, but people look at you.');
  f('REL-50', 'the herder\'s wife', 0, 'cuts the first calf\'s ear for the Mother',
    'The Calving, late in May. The first calf of the herd is born, and its ear-tip is cut and left on a stump for the Reindeer Mother.',
    'Cut the ear and leave it on the stump', 'The calf shakes its head and goes to suck. The ear-tip is gone by morning.',
    'Let the calf keep its ear', 'The calf is whole. The herd, the old herders say, is the Mother\'s, not yours.');
  f('REL-51', 'the eye-keeper', 0, 'listens for the ice and throws nothing in',
    'The Ice Crack, in January. The whole shore waits for the lake to speak, and nobody throws so much as a fish-bone onto the ice.',
    'Stand on the shore and wait for it', 'Near noon the ice cracks like a tree falling. The eye-keepers nod.',
    'Fish the ice as usual', 'You fish. The eye-keepers say nothing, and nobody will lend you a sledge.');
  f('REL-52', 'the drum-walker', 0, 'confesses its broken taboos aloud',
    'The Return of the Sun. When the sun first shows, every broken taboo of the dark months must be said aloud in the camp.',
    'Say yours aloud in front of the camp', 'You say it. People nod; worse has been said. The seals will come back.',
    'Keep yours to yourself', 'You say nothing. If the seals stay away, someone will remember you were quiet.', true);
  f('REL-73', 'the mare-singer', 0, 'rides out to greet the white horse',
    'The White Horse at midsummer. The mare-singers lead a white mare round the camp, and no one may ride her.',
    'Walk beside the mare and sing', 'You walk the round with the singers. The mare is calm.',
    'Ride out after strays instead', 'You ride. The singers say a rider who turns his back on the White Horse is lucky to be riding.');

  // ---- the Southern Peninsulas and the Thousand Isles
  f('REL-37', 'the ledger-keeper', 0, 'lights lamps and gives a gift to strike a debt',
    'The Turning, at the new moon of October. Every house is lit with lamps, and the temple opens its debt-ledgers to gifts.',
    'Give a gift and see a debt struck', 'The ledger-keeper strikes a line. You do not know whose debt it was; it may have been yours.',
    'Light no lamps', 'Your house is dark on the brightest night of the year. The temple writes that down too.', true);
  f('REL-38', 'the elephant-priest', 1, 'floats a lamp on the river for the Sleeper',
    'The Monsoon Welcome. At dusk the river is covered with little lamps, each one a wish that the Sleeper keep dreaming.',
    'Float a lamp on the Sona', 'Your lamp goes out among the others and is lost. That is how it should be.',
    'Watch from the bank', 'You watch. The priests say the dream is held up by every lamp, and yours was missing.');
  f('REL-39', 'the renouncer', 0, 'gives away one thing it loves',
    'The Giving Up, at the full moon of March. The townsfolk bring one thing each that they love and leave it at the gate.',
    'Give away something you love', 'You leave it at the gate. It is gone before you have walked home.',
    'Give away something you do not want', 'A renouncer looks at what you left and then at you.');
  f('REL-40', 'the temple rank-holder', 0, 'serves its days at the temple-mountain',
    'The King\'s Climb at the new moon of April. Every free man serves his temple rank, and the king climbs the mountain at the world\'s centre.',
    'Serve your days at the temple', 'You haul water to the tanks for nine days. From below, you see the king reach the summit.',
    'Pay a substitute', 'The substitute works for you. The temple steward writes down both names.', true);
  f('REL-41', 'the rice woman', ['the Last Sheaf', 9], 'carries the last sheaf home with a hidden knife',
    'The end of the main harvest. The last sheaf is cut with a knife hidden in the hand, so the rice soul is not frightened away.',
    'Cut it with the knife in your palm', 'The sheaf comes home on your shoulder and is hung over the door till planting.',
    'Cut it with the sickle and be done', 'The women stop singing. If the next crop is thin, you will hear about it.');
  f('REL-43', 'the master navigator', 0, 'chants the star-rising points at dawn',
    'The Rising of the Seven Sisters opens the sailing season. Before dawn the navigators chant the star-rising points on the beach.',
    'Stand on the beach and learn a line', 'You catch one line of the chant. A master hears you and does not correct you.',
    'Get the boat ready instead', 'Your boat is ready first. The masters say a boat is ready when its crew is.');
  f('REL-44', 'the water priest', 0, 'lights no fire and does not go out',
    'The Silent Day, at the new moon of March. No fire is lit and nobody goes out of doors from dawn to dawn. The island goes quiet.',
    'Sit in the dark until dawn', 'A long day and a longer night. At dawn the cooking smoke goes up all over the island at once.',
    'Light a small fire for the children', 'Your smoke is the only smoke on the island. The water priest will remember whose it was.', true);
  f('REL-45', 'the tide-caller', 0, 'leaves food at the tide line for the dead',
    'The Great Flood Tide. All the dead come in with the flood to see how their families live. The tide-callers stand in the water.',
    'Set food at the tide line and face the sea', 'The water takes the food. You keep your face to the sea until the turn.',
    'Turn your back and mend the nets', 'You turn your back on the flood. The tide-caller says your grandfather saw.');
  f('REL-46', 'the omen-reader', 0, 'feasts the hornbill and reads the omens',
    'The Hornbill Festival after the rice harvest. The longhouse dances, and the omen-readers read the coming year from the birds.',
    'Dance the hornbill dance', 'You dance until your legs give. The omen for your door is a good one, or so they say.',
    'Travel through the festival', 'You go on your way. The omen-readers would have told you not to.');
  f('REL-47', 'the boat-priest', ['the Washing of the Dead', 7], 'washes and re-dresses its dead',
    'The Washing of the Dead. The village brings its dead out of the cliff galleries, washes the bones and dresses them in new cloth.',
    'Wash your grandmother\'s bones', 'You wash her carefully and dress her in the new cloth. She goes back to the gallery smarter than she was alive.',
    'Pay for cloth and stay away', 'The cloth is paid for. The effigy of your grandmother is put back without you.');
  f('REL-67', 'the mask-keeper', ['the Pig Feast', 7], 'dances the ancestors at a big man\'s pig feast',
    'A big man\'s pig feast. The masks come out of the men\'s house, and for one night the dancers are the dead.',
    'Bring a pig and watch the dance', 'Your pig goes on the fire with the others. An ancestor dances past you and does not look.',
    'Keep your pig', 'You keep your pig. The big man counts the pigs, and counts yours missing.');
  f('REL-70', 'the boat\'s eldest', ['the passing of the saints\' reef', 4], 'throws rice to the drowned saints at their reef',
    'The fleet passes the reef where a saint drowned. Every boat throws a handful of rice to the water as it goes by.',
    'Throw your rice', 'The rice scatters on the swell. The eldest of your boat says the current will be kind.',
    'Keep the rice for the pot', 'You keep it. The eldest watches the water for the rest of the day.');
  f('REL-60', 'the well-keeper', 1, 'fasts from dawn to dusk through the Dry Month',
    'The Dry Month. From dawn to dusk no food or water passes the lips of the faithful, and the Well halls give water-alms at dusk.',
    'Keep the fast', 'Thirty days of dry mouths. At dusk the water-alms taste better than wine.',
    'Eat behind a closed door', 'You eat at noon, quietly. A Well-Keeper notices your lips are not cracked.', true);

  f('REL-42', 'the lake priest', 0, 'lets fish go at the turning of the lake',
    'The Turning, when the lake that runs backward breathes out. The lake priests cut the king\'s rope across the water, and every fishing family lets a fish go.',
    'Let a live fish go', 'It flicks away into the brown water. The lake priest marks your boat.',
    'Net the turning-day fish', 'You fill your boat. Nobody in the village will buy from it.', true);
  // a Known World faith kept in the far lands: the Path of the Well among the Hadun salt clans
  f('REL-07', 'the well-keeper', ['the Dry Month', 7], 'fasts from dawn to dusk and gives water-alms',
    'The Dry Month. From dawn to dusk no food or water passes the lips of the faithful, and at dusk the well-keepers give water to anyone who asks.',
    'Keep the fast', 'Thirty dry days. At dusk the water tastes of iron and is the best thing in the world.',
    'Drink at noon behind the tent', 'A well-keeper sees the wet on your veil.', true);
  // a Known World faith kept in the far lands: the Hall-giants' Mothers, as Fjorund chants them
  f('REL-12', 'the eldest of the hall', ['the night of the Mothers', 11], 'sits up through the chant of the Mothers',
    'The longest night. The hall\'s eldest begins the Mothers at dusk and does not stop until the last is named.',
    'Sit up to the last Mother', 'The last name is sung at dawn. The fire is down to coals, and the hall is quiet.',
    'Sleep in the far corner', 'You sleep. The chant goes on over you like weather.');

  // ---- the Black Pines, the Rime Coast and the Sunrise Isles
  f('REL-53', 'the shrine family', 1, 'hangs lanterns to guide its dead home',
    'The Return of the Dead in mid-August. Every gate has a lantern, and the house sets a place for those who come back.',
    'Hang a lantern and set a place', 'The lantern burns all night. In the morning the bowl is untouched, as it should be.',
    'Spend the coin on oil for the shop', 'Your gate is dark. Your mother hangs a lantern at hers for both of you.');
  f('REL-54', 'the ember priestess', 0, 'carries a child\'s fire-name to the crater shrine',
    'The New Year of the Ember. At the crater shrine every child born in the year is given a fire-name, and the queen\'s fire is carried down.',
    'Carry the ember home', 'You carry the ember down the mountain in a clay pot. The house is warm with the queen\'s fire.',
    'Keep the old year\'s fire', 'Your fire is old. The priestesses say an old fire is a cold house.');
  f('REL-55', 'the Keeper of the Log', ['the Dawn Watch', 0], 'watches the dawn from the east cliff',
    'The year\'s first dawn. The oath-brothers and sisters of the Watch stand on the east cliff and look for the land the sun is born from.',
    'Stand on the cliff and do not look away', 'The sun comes up out of the sea. No land, again. The Keeper writes the day in the Log.',
    'Sleep in', 'You miss the dawn. The Keeper writes that down as well.', true);

  // ---- the Deep Southland
  f('REL-56', 'the herd-elder', 0, 'counts the herd and names the calves for the dead',
    'The Herd Count at the start of the rains. Each family drives its cattle past the elders and recites the herd, beast by beast.',
    'Recite your herd to the elders', 'You name every beast and the ancestor it carries. The elders nod at the old names.',
    'Count it yourself later', 'You keep your herd at home. The elders say a herd nobody recites forgets its names.');
  f('REL-57', 'the drum-keeper', 0, 'feeds the royal drum with milk and beer',
    'The Drum Feast after the first rains. The drum-keepers feed the royal drums with milk and beer, and the drums are beaten for the king.',
    'Bring milk for the drums', 'Your gourd of milk goes into the drum-keeper\'s bowl. The drums speak at dusk.',
    'Stay with your cattle', 'The drums are fed without you. The drum-keeper\'s men count the gourds.', true);
  f('REL-58', 'the rain-maker', 0, 'climbs the rain hill with a black beast',
    'The Calling, late in the dry season. The rain-makers fast on the hill, and the villages send black cattle up as offerings.',
    'Send a black goat up the hill', 'Your goat goes up the hill. Three days later it rains, a little.',
    'Keep your goat; it may not rain anyway', 'It rains anyway. The rain-makers say it rained for the others.');
  f('REL-59', 'the master smith', 0, 'sings to the furnaces as they are lit',
    'The Lighting of the Furnaces at the start of the dry season. The smiths put medicines in the furnace base and the village sings to it.',
    'Sing to the furnace and keep the peace', 'You sing until the copper runs. Nobody quarrels near the furnace, not even you.',
    'Quarrel with your neighbour as usual', 'You quarrel. If the copper comes out poor, the smiths know whose voice it was.');
  f('REL-61', 'the priest', 0, 'fasts and sings the Book through the night',
    'The Finding of the Book. The priests sing the Stone Book by lamplight, and the faithful fast and stand through the night.',
    'Fast and stand through the singing', 'Your legs ache and your belly growls. At dawn the last line is sung, and you are lighter for it.',
    'Eat before the singing', 'You eat meat on a fast day. A priest smells it on your breath.', true);
  f('REL-71', 'the trance-dancer', ['the Rain Dance', 9], 'dances the eland down at the first storm',
    'The first storm of the year is on the horizon. The trance-dancers dance the great eland down so it will bring the rain.',
    'Clap for the dancers until the rain', 'You clap until your hands sting. The storm breaks over the camp at midnight.',
    'Shelter and wait it out', 'The storm comes all the same. The dancers say it came for them, not you.');
  f('REL-72', 'the river priestess', ['the River Feast', 8], 'gives white cloth to the river',
    'The River Feast. The priestesses wade out at the flood with bolts of white cloth, and every household gives a strip to the river.',
    'Give a strip of white cloth', 'Your strip goes downstream with the others like a line of birds.',
    'Keep the cloth for a shirt', 'You have a new shirt. The river, the priestesses say, has a long memory.');
})();
