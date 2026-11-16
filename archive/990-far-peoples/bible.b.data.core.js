// Far realm bibles, the Sand Basins (990-far-peoples). Format: see bible.r.data.core.js.
(function () {
  const R = A.FARP_REALMS = A.FARP_REALMS || {}, C = A.FARP_CULT = A.FARP_CULT || {};

  R['POL-70'] = { want: 'To be the only market between the Knot and Kraoth, and set the western price of silk.',
    fear: 'The Shrinking Sea\'s ferries failing, and the khagan\'s road carrying the silk north of Ozand.',
    place: ['The Hall of Broken Halves', 'The contract archive, where two million halves of broken clay tablets wait for their other halves.'],
    own: ['ozd_mask', 'market', { cut: 0.06 }, 'The Market of Masks', 'Rival houses bargain masked, through go-betweens, and seal a deal by breaking a clay tablet between them.',
      'You sell in Ozand. Your buyer sits masked behind his go-between, and you are handed a mask of your own. The deal is sealed by breaking a clay tablet; one half goes to the Hall, and the go-between\'s fee to him.',
      'Put on the mask and break the tablet', 'The tablet snaps clean. Your half goes into the Hall of Broken Halves with two million others.',
      'Bargain bare-faced', 'The other side laughs behind its mask and gives you the worst price of the day.', 'You break a tablet in the Market of Masks; the go-between takes {cut}.', {}, { coin: -6 }] };
  R['POL-71'] = { want: 'The Varesh\'s water: Ozand\'s canals upstream take a third, and Varesht wants a treaty or a war.',
    fear: 'Ozand\'s money hiring the Right Wing against it.',
    place: ['The Great Canal Head', 'Where the river is split into the kingdom\'s canals by stone and old law.'],
    own: ['vrs_water', 'law', {}, 'The Water Court', 'Every canal\'s share is read in the Fire Temple each spring; a water thief has his own canal blocked for a year.',
      'After your punishment the Water Court reads the shares again for your benefit: so many hours of water for each {w1}, read in the Fire Temple before the flame. A thief\'s canal is blocked for a year.',
      'Swear before the flame to take your share only', 'The priest makes you hold your hand toward the fire as you swear. It is warm, not hot.',
      'Say Ozand steals more than you', 'True, the judge agrees, and blocks your canal for a month to make the point.', 'The water shares are read to you before the flame.', { piety: 1 }, { coin: -6, honor: -1 }] };
  R['POL-72'] = { cc: 1, want: 'To keep both strands and the Red Saddle running through its scales, and to stay off every army\'s road.',
    fear: 'The khagan\'s road taking the silk north, and a war that closes the Red Saddle.',
    place: ['The Nineteen Scales', 'The public scales at the Knot\'s foot, each kept by its hereditary family.'],
    own: ['ush_scale', 'market', { cut: 0.04 }, 'The nineteen scales', 'Everything sold in Ushivar is weighed on a public scale; a false keeper is hanged from his own beam.',
      'You sell in Ushivar, and nothing changes hands until it has been weighed on a public {w2}. The scale-family takes its fee, and the beam it would hang from if it lied hangs over your head.',
      'Weigh at the public scale', 'The beam settles. The scale-master calls the weight and takes his fee.',
      'Weigh on your own scale in the back street', 'Your buyer will not take your weight. You go to the public scale anyway, late.', 'Your goods are weighed at a public scale: {cut}.', {}, { coin: -4 }] };
  R['POL-73'] = { want: 'To be free of the North Road garrisons and Hesh\'s tribute.',
    fear: 'Raiders from the Right Wing down the Ice Stair.',
    place: ['The Cave of a Thousand Lamps', 'A cliff of painted caves above the oasis, every one with its lamp niche.'],
    own: ['tsk_lute', 'rite', { age: 17, who: 'all' }, 'The five strings', 'Every child learns the five-string lute, and plays one of the Tsarke Modes before the elders at seventeen.',
      'You are seventeen, and you must play one of the Tsarke Modes before the oasis elders on the five-string lute, as every child of Tsarke does. The king\'s orchestra is three hundred strong; the elders have heard better.',
      'Play the mode through', 'You miss two notes and hold the long one. The elders nod you through.',
      'Say your fingers are hurt', 'They let it pass. Somebody hums the mode at you in the street for a month.', 'You play a Tsarke Mode before the elders.', { skill: { music: 2 } }, { honor: -2 }] };
  R['POL-74'] = { want: 'To make all three Lamp schools accept the Root Teaching again.',
    fear: 'Lamp-Breakers inside its own cells.',
    place: ['Teshur\'s Lamp', 'A clay lamp said to be the teacher\'s own, kept burning since about 190.'],
    own: ['rlk_guest', 'ward', { when: 'any', every: 3 }, 'Three days without asking', 'Every traveller is fed for three days without being asked his faith; on the fourth day he is asked.',
      'Travellers at the monastery gate, and your household is on the roll to feed them. Three days of bread and broth, and no question about their faith. On the fourth day the monks ask.',
      'Feed them and ask nothing', 'They eat for three days. On the fourth a monk asks; one is of the Lamp, two are not.',
      'Ask them first thing', 'They answer, and leave. The monks are displeased with you, not with them.', 'You feed travellers three days without asking.', { coin: -2, piety: 2 }, { honor: -2 }] };
  R['POL-75'] = { want: 'To hold the Northern Strand for Hesh and tax it.',
    fear: 'Being forgotten by Moriden.',
    place: ['The Drum Tower of Tsenkai', 'Two thousand kilometres from Moriden, beating the hours for an emperor who never hears them.'],
    own: ['nrd_ledger', 'census', { every: 3, m: 4, per: 1, line: 'The garrison clerk enters {n} of your house in Hesh\'s Ledger and takes {due}.' },
      'Entered as Hesh men', 'Garrison sons are entered in Hesh\'s Ledger as Hesh men, and every house on the strand is counted for the head-tax.',
      'The garrison clerk is counting. He enters every soul in your house in the Ledger of Hesh, two thousand kilometres away, and asks the head-tax: {n} heads, {due}.',
      'Be entered and pay', 'You are a Hesh man now on paper, whatever the oasis says.',
      'Give a false count', 'He counts the beds. The fine is larger than the tax.', 'The garrison clerk enters your house in the Ledger.', {}, { coin: -5 }] };
  R['POL-76'] = { want: 'To keep the fire-oil secret, and sell it to whoever pays most, never to one buyer.',
    fear: 'The khagan learning to make it, and a buyer who comes with an army.',
    place: ['The Seven Flames', 'Fires from vents in the rock of the temple court; a flame that dies means a High Flame dies.'],
    own: ['khz_flame', 'ward', { when: 'any', every: 3 }, 'The seven flames', 'Every household of the city sends oil and a night of watching to the Seven Flames, so none goes out.',
      'Your household\'s night at the Seven Flames. You sit in the temple court with a jar of oil and watch the seventh flame, the small one. If it dies, a High Flame dies.',
      'Sit up with the flame', 'It gutters once at the third hour. You feed it, and it holds.',
      'Doze against the wall', 'You wake to a priest feeding your flame. He says nothing, loudly.', 'You watch a night at the Seven Flames.', { piety: 2 }, { honor: -2, piety: -2 }] };
  R['POL-77'] = { want: 'To keep the Jade Hall\'s monopoly, and the caravans of the Southern Strand from turning north.',
    fear: 'Navesht\'s bought soldiers, who guard the strand and could take the city.',
    place: ['The Jade Hall', 'Where every jade of the Southern Strand is graded, cut and sold, and none leaves uncounted.'],
    own: ['mrs_moon', 'ward', { when: 'any', every: 2 }, 'The moonlight line', 'Jade-diggers walk the dry riverbeds by moonlight in a line, women in front, because wet jade glows under the moon.',
      'A full moon over the {w1}. The diggers walk the dry bed in a line, women in front, because wet jade glows under the moon and women see it first. A stone found by foot is the finder\'s.',
      'Walk the line behind the women', 'Near dawn a woman ahead of you stops. The stone glows green in her hand, and she gives you a sliver.',
      'Dig by lamplight on your own', 'You find nothing. The line passes you and does not stop.', 'You walk the moonlit riverbed with the jade line.', { coin: 3 }, { happy: -2 }] };
  R['POL-78'] = { want: 'More boys: the Purchased cannot pass their rank to their sons, so every Purse must buy or die out.',
    fear: 'The Bought-Boy Road being cut, and their own sons\' resentment.',
    place: ['The Purse Hall', 'Where the Purses hang their captains\' purses, each with the silver he was bought for.'],
    own: ['nvs_purse', 'levy', { who: 'male' }, 'Sworn to the Purse', 'The Purchased ride to every war of the oasis, and every free man of Navesht owes them a horse or himself.',
      'War, and the Purses ride. Every free man of Navesht owes them a horse or himself in the second line. The Purse-Master\'s steward comes for yours.',
      'Ride in the second line', 'You ride behind the Purchased. They do not speak to you, but they do not leave you either.',
      'Give a horse instead', 'The steward takes your best horse, not your worst.', 'The Purses ride to war, and you owe them.', { skill: { riding: 1 } }, { coin: -10 }] };
  R['POL-79'] = { want: 'To keep its 1,600 km of underground channels from falling in, and the khagan\'s tribute low.',
    fear: 'An earthquake that breaks the channels, and the khagan\'s army camping in the Low Basin.',
    place: ['The Long Channel', 'Eighty-two kilometres under the desert, the longest of them.'],
    own: ['ozr_lower', 'rite', { age: 17, who: 'male' }, 'Born under the ground', 'Channel-keepers\' sons are lowered into the channels with a lamp and a rope; one who comes back is a keeper.',
      'You are seventeen and the keepers lower you down a shaft into the dark with a lamp and a rope. You must walk the channel to the next shaft and come up. The keepers call it being born again under the ground.',
      'Go down and walk', 'An hour in water to the knee, and then light above you. You come up a keeper.',
      'Let go of the rope', 'They pull you up. You will not be asked again.', 'You walk the channel under the ground.', { wil: 1, sta: 1 }, { honor: -3 }] };
  R['POL-80'] = { cc: 0, want: 'To be the Nine Wells\' open face in the east.',
    fear: 'Phelkar\'s king, who wants the city\'s toll for himself.',
    place: ['The Public Cistern', 'The one place in Varinj where a caravan may water; the keeper\'s count of animals is the tax.'],
    own: ['vrj_cistern', 'market', { cut: 0.06 }, 'The count at the cistern', 'Every caravan waters at the public cistern and nowhere else; the keeper counts the animals, and the count is the tax.',
      'You sell in Varinj, and your beasts must drink at the public cistern. The keeper counts each one through and writes the tax on a shard.',
      'Water at the cistern', 'Every beast counted, the tax paid. The water is sweet.',
      'Water at a private well', 'The keeper\'s men find the wet ground. You pay the tax twice.', 'The cistern keeper counts your animals: {cut}.', {}, { coin: -8 }] };
  R['POL-81'] = { want: 'That east and west never meet: every bolt and every story must pass through a League hand.',
    fear: 'A traveller who crosses the whole road and comes back to tell, or a map of the Cross-Desert Track.',
    place: ['The Nine Wells', 'A hidden oasis in the middle of the Swallowing Sand, on no map the League did not draw.'],
    own: ['nwl_silence', 'law', {}, 'The Broker\'s Silence', 'A factor never lies about weight and never tells the truth about distance.',
      'After your punishment a Master of the Wells sits with you. Never lie about weight, he says; never tell the truth about distance. He asks you how far it is to the far end of the road.',
      'Say it is very far', 'He smiles. Far enough, he agrees.',
      'Tell him what you heard', 'He writes it down, and the next caravan you ask to join is full.', 'A Master of the Wells reminds you of the Silence.', { skill: { deception: 1 } }, { honor: -3 }] };
  R['POL-88'] = { want: 'More caravans over the Red Saddle, and none over the Ruby Pass.',
    fear: 'An army that comes over the pass instead of a caravan.',
    place: ['The Red Saddle castle', 'At the top of the pass, where every caravan rests a day and eats apricots.'],
    own: ['ysg_apricot', 'ward', { when: 'any', every: 3 }, 'A day at the castle', 'A caravan at the top rests a day at the castle, eats apricots, and is told the road is worse than it is.',
      'A caravan has reached the top, and your household serves at the castle. You carry apricots to the traders and tell them about the road ahead: the slides, the ghosts, the brigands. Make it worse than it is.',
      'Tell them the road is terrible', 'They hire two more of your cousins as guides.',
      'Tell them the truth', 'The Lord\'s steward hears you. That is not what apricots are for.', 'You tell a caravan of the road\'s dangers at the castle.', { coin: 2 }, { honor: -2 }] };

  C['CUL-54'] = [
    ['ozi_tea', 'ward', { when: 'rich', every: 3 }, 'The third cup', 'A bargain is made over three cups of tea in the counting house, and the third cup is the bargain.',
      'A broker invites you to the {w2} for tea. The first cup is about the weather; the second about the road. You both know what the third will be.',
      'Drink to the third cup', 'The third cup is poured, and the bargain is made, and neither of you named a price aloud.',
      'Name a price over the first cup', 'The broker sets down his cup and talks about the weather for an hour.', 'You make a bargain over the third cup.', { skill: { trade: 1 } }, { honor: -2 }],
    ['ozi_melon', 'wed', { dowry: 1 }, 'The wedding melons', 'Melons are given as a greeting to anyone arriving from a journey, and to a bride\'s family: the size tells what she is worth.',
      'Your wedding, and the groom\'s family sends melons to the bride\'s house. Everyone in the street measures them by eye; the size says what the bride is worth to them. The dowry is {dowry}.',
      'Send the biggest melons in the market', 'Two men carry each one. The street is satisfied.',
      'Send small sweet ones', 'They are sweeter. Nobody in the street believes it.', 'Melons go to the bride\'s house.', { happy: 2 }, { honor: -2 }],
  ];
  C['CUL-55'] = [['vrt_tower', 'mourn', { share: 'temple' }, 'The tower of the birds', 'The dead are laid on towers for the birds, and the temple takes its tenth before the estate is shared.',
    '{parent} is carried to the tower and laid out for the birds, so that neither earth nor fire is defiled. The fire priests take the temple\'s tenth of {estate}; the rest is shared. You get {got}.',
    'Stand at the foot of the tower', 'The birds come. You stay until the priests send you home.', 'Ask for a grave in the earth', 'The priests refuse, and remember you asked.', '{parent} is laid on the tower. You get {got}.', { happy: -2, piety: 1 }, { piety: -4 }]];
  C['CUL-56'] = [
    ['tsi_grapes', 'season', { m: 8, pct: 0.04, min: 4, cap: 8, paid: 'A basket of grapes goes to the monastery for the caravans\' raisins ({due}).', short: 'You have no grapes to give. The monks write your house down as owing.', shortFx: { piety: -1 } },
      'The grape basket', 'Every household gives a basket of grapes to the monastery at harvest, to be dried for the caravans.',
      'Harvest, and the {w2} sends its carts round for the grape baskets. The monks dry them on the roofs for the caravans. Your basket is worth {due}.',
      'Give a full basket', 'The monk tips it onto the roof with the others. Your grapes will cross half the world as raisins.',
      'Give the bruised ones', 'The monk tips them out, looks at them, and looks at you.', 'You give a basket of grapes to the monastery.', {}, { piety: -2 }],
    ['tsi_lamp', 'ward', { when: 'any', every: 3 }, 'The lamp at the gate', 'Caravans are received with a lamp lit at the oasis gate; one arriving after the lamp is out sleeps outside.',
      'Your household\'s turn to keep the lamp at the oasis gate. A caravan is late on the road. The law says when the lamp is out the gate is shut; the oil is nearly gone.',
      'Buy oil and keep it lit', 'The caravan comes in at midnight, and its master gives you a length of silk.',
      'Let it go out on time', 'The caravan sleeps outside. Its master remembers your gate.', 'You keep the lamp at the oasis gate.', { coin: -1, honor: 1 }, { honor: -1 }],
  ];
  C['CUL-57'] = [['mri_cicada', 'grave', {}, 'The jade cicada', 'The dead of the jade families are buried with a jade cicada on the tongue.',
    '', '', '', '', '', 'You are buried with a jade cicada on your tongue, as the jade families are.', {}]];
  C['CUL-58'] = [
    ['ozi_crawl', 'ward', { when: 'spring', every: 2 }, 'The spring crawl', 'A channel is cleaned every spring by men who crawl it in the dark; one who has cleaned a whole channel sits with the keepers.',
      'Spring, and your family\'s channel must be cleaned. The men go down the {w1} shafts with lamps and baskets and crawl the channel, clearing silt, for days.',
      'Crawl your stretch', 'Four days in the wet dark. When you come up the light hurts.',
      'Pay a crawler to go for you', 'He goes. The keepers do not count your family\'s stretch as yours.', 'You crawl your stretch of the channel.', { sta: 1 }, { coin: -5 }],
    ['ozi_name', 'name', { by: 'keep' }, 'The channel\'s name', 'Every family is named for the channel it keeps.',
      'Your child {child} is born and carried to the head of the family\'s channel, where the water comes out of the dark, and is named into it.',
      'Carry the child to the channel head', 'The water is cold on the child\'s feet. It yells, which is lucky.',
      'Name it at home', 'The keepers say a child not shown to the water may forget it.', '{child} is named at the channel head.', { happy: 2 }, { happy: -1 }],
  ];
  C['CUL-59'] = [['usi_name', 'name', { by: 'keep' }, 'The scale\'s child', 'Market children take the name of the public scale their father works at.',
    'Your child {child} is born, and the market already calls it by the name of the {w2} you work: the third scale\'s child, the ninth scale\'s.',
    'Carry the child round the scales', 'Each scale-master puts a grain of something in the child\'s fist. It drops all of them.',
    'Keep the child from the market', 'The market names it anyway.', '{child} is named for the scale.', { happy: 2 }, { happy: -1 }],
    ['usi_tower', 'ward', { when: 'any', every: 2 }, 'The tower call', 'A caravan\'s arrival is called from the tower with its strand and its size, and every price changes within the hour.',
      'The tower calls a caravan: the northern strand, three hundred camels. Within the hour every price in the {w1} will move. You have goods in store.',
      'Sell before the hour is out', 'You sell at the old price to a man who did not hear the call.', 'Wait and see', 'Prices fall. You sell at the new price, lower.', 'A caravan is called from the tower.', { skill: { trade: 1 } }, { coin: -4 }]];
  C['CUL-60'] = [['wbr_oath', 'rite', { age: 20, who: 'male' }, 'The well-name', 'A broker takes a well-name at his oath: the name of the well he will die keeping.',
    'You are twenty, and a broker house will take your oath. You give up your name for a well\'s: the one you will die keeping, somewhere in the Swallowing Sand.',
    'Take the well-name', 'You say the oath at the Inner Well. Your old name is never used again, even by your mother.',
    'Ask for a nearer well', 'There is no nearer well, they say. There is only the one you are given.', 'You take a well-name at your oath.', { wil: 1, skill: { trade: 1 } }, { honor: -3 }]];
  C['CUL-61'] = [['prc_sons', 'mourn', { share: 'lord' }, 'The purse goes back', 'A Purse man\'s rank and purse go back to his Purse at his death; his sons are born free and get nothing of it.',
    '{parent} is dead. The Purse takes back the purse, the horse and the rank; the sons of the Purchased are born free and take nothing of it. The estate is {estate}. You get {got}.',
    'Let the Purse take it', 'The captain takes the purse and salutes you, which he did not have to do.', 'Ask for the horse at least', 'He gives you the horse\'s halter.', '{parent}\'s purse goes back to the Purse. You get {got}.', { happy: -2 }, { honor: -2 }]];
  C['CUL-68'] = [
    ['ysi_bridge', 'ward', { when: 'any', every: 2 }, 'The rope bridge', 'Rope bridges are rebuilt every year by the whole valley in one day; the man who ties the last knot crosses first.',
      'The day of the bridge. The whole {w1} works from dawn twisting new ropes and hauling them across the gorge. The man who ties the last knot crosses first, before anyone knows if it holds.',
      'Tie the last knot', 'You tie it and walk across. It sways and holds, and the valley shouts.',
      'Twist rope and let others tie', 'Someone else crosses first. You walk over after him with everyone else.', 'You help rebuild the valley\'s rope bridge.', { fame: 1, sta: 1 }, { happy: -1 }],
    ['ysi_tree', 'wed', { dowry: 1 }, 'An apricot tree for a dowry', 'A valley\'s apricot trees are counted, and a tree is a dowry.',
      'Your wedding. The apricot trees are counted in front of both families, and the bride\'s family names the trees that go with her. The dowry is {dowry}.',
      'Count the trees aloud', 'Three trees, and a good one by the stream.', 'Ask for coin instead of trees', 'Coin, they say, does not fruit.', 'Apricot trees are named as a dowry.', { happy: 2 }, { honor: -1 }],
  ];
})();
