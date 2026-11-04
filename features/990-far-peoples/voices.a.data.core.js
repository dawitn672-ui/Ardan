// Far voices, part A: the Twin Rivers and the Sand Basins (990-far-peoples). The banks are 54-voices' own form
// (A.VOICE_DATA; see features/54-voices/voices.a.data.core.js), written compactly:
//   v(culture, lord, ruler, council, year, greet, oath, curse, who, sayings, lines, swap)
// lord, ruler, council: 'word: gloss', or 'w1'..'w3' for one of the culture's own three words (A.BIBLE_WORDS).
// who: 'the clerks; old dyke-men'. sayings and lines: 'text | topics'. swap: 'plain word = w2', or ''.
// Topics: money law oath death war kin faith land sea feast guest work power travel. Everything here is invented.
(function () {
  const V = A.VOICE_DATA = A.VOICE_DATA || {};
  const term = t => (/^w[123]$/.test(t) ? t : t.split(/:\s*/).length === 2 ? t.split(/:\s*/) : null);
  const pair = s => { const i = s.lastIndexOf('|'); return [s.slice(0, i).trim(), s.slice(i + 1).trim()]; };
  const v = A.farVoice = A.farVoice || function (id, lord, ruler, council, year, greet, oath, curse, who, sayings, lines, swap) {
    V[id] = { lord: term(lord), ruler: term(ruler), council: term(council), year, greet, oath, curse,
      who: who.split(/;\s*/), sayings: sayings.map(pair), lines: lines.map(pair),
      swap: swap ? swap.split(/;\s*/).map(x => x.split(/\s*=\s*/)) : [] };
  };

  // ---- the Twin Rivers
  v('CUL-25', 'hauren: a magistrate of the Ledger', 'Tienshou: the emperor, who holds the earthly Ledger', 'sevlun: the six boards in sitting', 'the {n} year of {ru} by the Long Count',
    'Rice in your bowl.', 'By the Ledger and my fathers\' tablets.', 'May your entry be lost.', 'the clerks; old dyke-men; plain-country grandmothers',
    ['A debt carried is not a debt forgiven | money', 'Sweep the graves before you sweep the house | death kin', 'The dyke does not ask whose son you are | land work', 'What is not written did not happen | law power'],
    ['Every {w2} is read before Heaven at the year\'s end. | money faith law', 'The {lord} keeps the Ledger; the {w1} keeps the water out. | power land', 'A {w3} is seated first at any table, even a poor one. | power guest feast'], 'household = w2');
  v('CUL-26', 'w1', 'Tienshou: the emperor of the Southern Court', 'saivun: the lake princes\' sitting', 'the {n} flood-year of {ru}',
    'May your dyke hold.', 'By the dyke god of my district.', 'May the {w3} open at night.', 'the boatmen; lake grandmothers; the dyke-heads',
    ['A ring dyke is only as high as its lowest neighbour | land work kin', 'Row the bride far, and the past stays home | kin', 'Rice grows where men carry earth | work land'],
    ['In {w2} the whole district sleeps on the {w1}. | land work', 'A district that loses its stretch carries its neighbour\'s god for shame. | faith land'], '');
  v('CUL-27', 'wazen: a silk magistrate', 'Tienshou: the emperor at Venshai', 'luvesh: the Chancellery in sitting', 'the {n} silk-year of {ru}',
    'Quiet lofts and white cocoons.', 'On the Silk Law, and may I drown in cocoons if I lie.', 'May your worms sicken at the moult.', 'the guild women; silk clerks; old reelers',
    ['Speak softly; the worms are listening | work kin', 'A reel counted twice is a reel sold once | money', 'Silk has no country but the Delta | power work', 'The third moult tells the year | work land'],
    ['A daughter\'s worth is counted in {w1}s on a red table. | kin money', 'From the hatching to the spinning the whole house whispers. | work kin'], '');
  v('CUL-28', 'nertsen: a well-lord of the basin', 'Tienshou: the emperor, far down the gorges', 'w3', 'the {n} salt-year of {ru}',
    'Brine in your well.', 'By my well and my grandfather\'s derrick.', 'May you drill a dry hole.', 'the well-men; the buffalo drivers; Gorge grandmothers',
    ['The hole is not a well until it runs | work land', 'Taste the brine before you trust the man | guest', 'The fog hides the basin, not the debts | money'],
    ['A family that drills a dry {w1} is pitied for a generation. | work kin', 'In the {w2} you can hear the {w3}s creak before you see them. | land work'], '');
  v('CUL-29', 'hrokai: an old clan head of the loess', 'Weirhun: the king who keeps the Weir-kings\' tombs', 'dzalun: the clan heads in the cave hall', 'the {n} year of {ru}, as the bells count',
    'May the cliff stand.', 'On the Weir-kings\' bell.', 'May your cave be dug deeper.', 'the tomb-keepers; old cave women; donkey men',
    ['The dead sleep at the back and listen | death kin', 'Old names take an hour; good names take a life | kin', 'When the pot swings, sleep in the yard | land'],
    ['We were here before the Ledger, and the {w2} remembers. | power land', 'A {w1} is never dug deeper after a death in it. | death kin'], '');
  v('CUL-30', 'beiren: a banner captain', 'w2', 'gusun moot: the eight banners in council', 'the {n} snow of {ru}',
    'A fast horse and a full bow.', 'By the crows on my pole.', 'May you ride a mule to the hunt.', 'the banner men; old riders; crow-feeders',
    ['A banner is a pole and the men under it | war power', 'Feed the crows first, and yourself last | faith', 'The grandfathers were real | war kin'],
    ['A man of the {w1} who lets a deer through the line rides without pay for a year. | war power', 'A {w3} is worth a village, and some villages say so. | money'], '');
  v('CUL-31', 'yangsol: a lord of the valleys', 'w3', 'baeksun: the generals in council', 'the {n} year of {ru}, the white king',
    'Peace on your village gate.', 'Before the grandmother of the mountain.', 'May your guardians fall in the night.', 'the archers; village elders; women shamans',
    ['The mountain gives leave, or the war waits | war faith', 'A poem tells you whose cousin you are | kin', 'Five arrows in a row, and ask the king | war power'],
    ['Every {w1} has its grandfather and grandmother posts at the gate. | faith kin', 'The {w2} feeds the valley; the generals eat first. | land power'], '');
  v('CUL-32', 'dzonglord: a tower-lord of the Corridor', 'Gyalpo: the king, who is Son of Heaven at home', 'w3', 'the {n} beacon-year of {ru}',
    'May your tower burn bright.', 'By the lamp and the tower I kept.', 'May your tower be dark at the count.', 'the tower monks; old soldiers; the toll clerks',
    ['A dark tower costs a horse | war law', 'The tenth is light; the road is long | money travel', 'Every son keeps a tower once | kin war'],
    ['A caravan without the {w2} token is turned back at every {w1}. | money travel', 'A man of the {w1} carries its name before his own. | kin'], '');
  v('CUL-33', 'ngolomu: a lake lord', 'Meshilo-ten: the king of the nine lakes', 'tsosun: the ferry-masters\' meeting', 'the {n} year of {ru}',
    'Calm water on all nine lakes.', 'By the fifty links of my name.', 'May you drop a link in public.', 'the ferrymen; old singers; the monks',
    ['The ferry never stops; the ferryman does | work death', 'A name is a chain; mind the links | kin', 'Sing across the water, and wait for the answer | kin feast'],
    ['A man can recite his {w2} back fifty generations without a breath. | kin', 'Every {w1} has a ferry that must never stop running. | travel work'], '');
  v('CUL-34', 'lakdang: a clan elder of the ridges', 'w2', 'paangsuu: the ridge meeting', 'the {n} harvest of the Speaker {ru}',
    'Rice water and a dry roof.', 'By the tiger of my ridge.', 'May the tiger forget you are kin.', 'the hill women; the Speaker\'s men; old bowmen',
    ['The Speaker carries no knife and needs none | law power', 'A tiger of your ridge is kin, until it is not | death kin', 'Burn the hill, plant the hill, leave the hill | land'],
    ['Every clan has its {w1}, and no one hunts its tiger. | land kin', 'A guest is given {w2} before he is asked his name. | guest'], '');
  v('CUL-35', 'tauvei: an eldest of a fleet', 'Eldest of the Nine Fleets: the boat-dwellers\' first elder', 'mirsun: the nine fleets lashed in council', 'the {n} year of {ru}\'s fleets',
    'Deep water under you.', 'By my boat and the boat that saved my father.', 'May you die on land.', 'the boat women; pilots; old divers',
    ['The sea is wider than the Ledger | power sea', 'A child that floats need not walk | kin sea', 'Name the boat that saved you | kin sea'],
    ['A {w3} buys his fish from us and calls us thieves. | money sea', 'Every family\'s {w2} is its house, its name and its grave. | sea kin death'], '');
  v('CUL-36', 'mirlord: a junk-master of the coast', 'Tienshou: the emperor, who forbids the sea', 'w1', 'the {n} year of {ru}, with the south wind',
    'Fair wind and a full hold.', 'By the star shrine on my junk.', 'May your home name be cursed in a strange port.', 'the sailors; the port clerks; navigators',
    ['Take a name for every port | sea travel', 'Barefoot to the temple, then home | faith sea', 'The court forbids the sea; the sea does not hear | power sea'],
    ['When the {w2} blows, every junk on the coast is out past the bar. | sea travel', 'The scholars of Venshai have never seen {w3}. | power'], '');
  v('CUL-37', 'paangdo: a chief of the island', 'Prince of the Isle: the island\'s lord under Venshai', 'ruksaa: the clan mothers in council', 'the {n} year of {ru}',
    'May the reef be kind.', 'By my mother\'s face.', 'May your face fade.', 'island mothers; reef fishers; exiles\' cooks',
    ['A face cannot be forged | kin oath', 'Host an exile, and you host his letters | guest power', 'North coast turtles are kin; south coast turtles are dinner | land feast'],
    ['Every girl\'s face carries her mother\'s line, and the {w2} watches over both. | kin faith', 'A cup of {w3} is given to a guest before a word. | guest'], '');
  v('CUL-38', 'gatelord: a wall-warden\'s captain', 'Warden of the Wall: the march\'s lord', 'saukai moot: the gate-households\' meeting', 'the {n} raid-year of {ru}',
    'Fire on your tower.', 'By my gate and my willow.', 'May your tower be dark at the count.', 'the gate men; old horse-traders; wall widows',
    ['Trade at the gate in spring, fight at it in winter | war money', 'The empire builds walls and forgets wages | power money', 'A willow for every man the wall kept | death'],
    ['An {w3} sells horses north in the morning and watches for them at night. | money war', 'Past the {w1} is {w2}, and the khagan\'s riders. | war travel'], '');
  v('CUL-39', 'naamo: an eldest mother of a clan', 'Eldest Mother: the first of the tea clans', 'w3', 'the {n} flush of {ru}',
    'Good leaves and a long line.', 'By the Tea Mother of my village.', 'May your bricks crumble.', 'the tea women; old mothers; brick pressers',
    ['A man drinks the tea; a woman owns the tree | kin land', 'The emperor drinks what we choose | power money', 'If her mother drinks your tea, stay | kin feast'],
    ['Only the eldest woman picks the {w1}\'s leaves, once a year. | faith work', 'A husband lives in his wife\'s house, and his children are her {w3}. | kin'], '');
  v('CUL-40', 'oldfire: a head of an old-fire lineage', 'Abbot of the White Cliff: the lord the old fires choose', 'w3', 'the {n} year of {ru}',
    'May your fire never die.', 'By the fire that has not gone out.', 'May your fire die and your patron refuse a coal.', 'the old-fire men; cliff women; abbey tenants',
    ['Old fire does not marry new | kin', 'A household is its fire | kin faith', 'Buy a coal and owe for a life | money'],
    ['Some fires in the {w1}s have burned six hundred years. | faith kin', 'The {w2} grows red on the cliff terraces above the clouds. | land'], '');
  v('CUL-41', 'lockmaster: a head of the canal brotherhood', 'the two emperors: the courts both banks obey', 'brothersun: the brotherhoods in the shrine', 'the {n} canal-year of {ru}',
    'Water at every lock.', 'At the Dyke Saints\' shrine, and the deepest lock under me.', 'May your barge stick at every gate.', 'the haulers; lock-keepers; grain clerks',
    ['A handful at the gate saves a day at the gate | money travel', 'Both empires eat because we haul | power work', 'Break the oath, meet the deep lock | oath death'],
    ['Children of one {w1} call each other cousin all their lives. | kin', 'The {w2} goes north on our backs, and a little of it stays. | money work'], '');
  v('CUL-42', 'chaankhuu: an elephant lord of the court', 'w3', 'ngorusuu: the court on its stilts', 'the {n} tribute-year of {ru}',
    'May your elephant be kind.', 'By the grove where my mahout lies.', 'May your elephant forget you.', 'the mahouts; the hill farmers; court ladies',
    ['An elephant and its man share a grave | death', 'Two names for two rooms | power', 'The emperor\'s road south runs through us | power travel'],
    ['Every elephant is buried in the {w1} beside its mahout. | death', 'The king crosses rivers on his ministers\' backs, and never walks. | power'], '');

  // ---- the Sand Basins
  v('CUL-54', 'parandar: a great broker', 'First Weigher: the republic\'s head', 'mashavand: the brokers\' council of masks', 'the {n} year of {ru}\'s weighing',
    'A sweet melon and an honest scale.', 'By the third cup.', 'May your tablets break in the wrong place.', 'the brokers; go-betweens; Ozandi aunts',
    ['The third cup is the bargain | money guest', 'A son named in public is a son disowned | kin', 'Ozand knows the price of both ends of the world | money power'],
    ['A {w2} keeps two prices, one for each end of the road. | money', 'The {w3} rate moves twice a day and once at night. | money'], '');
  v('CUL-55', 'khozar: a canal lord', 'Varshah: the king of the canals', 'w2', 'the {n} water-year of {ru}',
    'Water to your field and fire to your hearth.', 'Before the fire that never dies.', 'May your canal be blocked a year.', 'the canal-wardens; fire priests; farmers\' wives',
    ['Fan the fire; never blow on it | faith', 'Ozand takes a third, and asks for more | money land', 'Earth and fire are clean; keep them so | death faith'],
    ['Every son is named for the {w1} that waters his father\'s land. | kin land', 'The {w3} of a temple has burned since before the Ledger. | faith'], '');
  v('CUL-56', 'rauchar: a lord of a monastery town', 'Tsarkeshah: the king of the oasis', 'lampmoot: the abbots and elders in council', 'the {n} year of {ru}',
    'May the lamp be lit when you come.', 'By the two lamps.', 'May you arrive after the lamp is out.', 'the monks; lute players; oasis elders',
    ['Every child learns five strings | kin feast', 'Come before the lamp goes out | travel guest', 'Grapes for the monks, raisins for the road | faith work'],
    ['The Lamp came east through every {w2} on the strand. | faith travel', 'Water comes to the oasis by the {w3}, under the sand. | land'], '');
  v('CUL-57', 'yashar: a jade master', 'Jade King: the city\'s king', 'penmoot: the jade masters\' hall', 'the {n} jade-year of {ru}',
    'Green stones under your feet.', 'By the jade on my tongue at death.', 'May your river run dry of stone.', 'the jade-cutters; river women; old divers',
    ['A stone found by foot is yours; by hand, the master\'s | money work law', 'Women see the moon in the stone first | work kin', 'Every emperor\'s seal was cut here | power work'],
    ['Children are named for stones their fathers found in the {w1}. | kin', 'A {w3} set is a dowry for a jade daughter. | kin money'], '');
  v('CUL-58', 'channel-lord: a keeper of a great channel', 'Ozurshah: the king of the low land', 'keeper moot: the channel-keepers\' sitting', 'the {n} year of {ru}',
    'Cool water from under the ground.', 'By the channel my family keeps.', 'May your channel fall in.', 'the channel-keepers; vine growers; night workers',
    ['Water runs under the desert if you ask it | land work', 'Sleep by day, work by night, eat grapes | work', 'A man who crawled a whole channel may sit with keepers | work power'],
    ['Down every {w1} is a boy with a lamp and a rope. | work', 'In {w2} summer, the town lives in its cellars. | land'], '');
  v('CUL-59', 'scale-master: a keeper of a public scale', 'Chief Scale: the city\'s first keeper', 'w2', 'the {n} year of {ru}\'s scales',
    'An honest beam.', 'By my beam, from which I would hang.', 'May your scale be tested at dawn and found false.', 'the scale families; porters; changers',
    ['Weigh it twice, sell it once | money', 'The tower calls, and prices run | money travel', 'A false keeper hangs from his own beam | law death'],
    ['Every {w2} in the market is tested at dawn against the bronze weights. | money law', 'The price of {w3} is set here and boasted of in Ozand. | money'], '');
  v('CUL-60', 'w2', 'First of the Nine: the League\'s head', 'astsun: the Nine Masters at the Inner Well', 'the {n} caravan-year of {ru}',
    'Water and a true weight.', 'By the Silent Scale and my well.', 'May you speak of the far end of the road.', 'the brokers; guides; well-keepers',
    ['Never lie about weight; never tell the truth about distance | oath money travel', 'A broker dies at his well | death', 'A full waterskin at the edge of the sand is a sentence | law'],
    ['Inside the {w1} no one asks where the silk was made. | travel money', 'One coin in a hundred is weighed, and it is {w3} after. | money faith'], '');
  v('CUL-61', 'pen-captain: a captain of a Purse', 'Purse-Master: the first of the Purchased', 'w1', 'the {n} year of {ru}\'s Purse',
    'A good horse and a full purse.', 'By the silver I was bought for.', 'May your sons ride.', 'the Purchased; stable-boys; old captains',
    ['Bought because we were the best | war power', 'Our sons are free and cannot follow us | kin', 'Nine years by the Purse Book | war work'],
    ['Every boy at the {w3} is given a stable-name and a purse. | kin money', 'The {w1} hangs its captains\' purses full in the hall. | death war'], '');
  v('CUL-62', 'dune-elder: an elder of the sand-skirt', 'nobody: the sand-skirt has no king', 'wellsit: the herders at the dry well', 'the {n} dry year since the great sand',
    'Water before bread.', 'By the dune I was born on.', 'May the sand\'s heart take you.', 'the herders; guides; salt women',
    ['Water first; a guest who refuses it is an enemy | guest', 'The sand\'s heart eats caravans | travel death', 'Where the maps end, we begin | travel land'],
    ['A child is named for the dune or the {w2} of its birth. | kin land', 'Nobody of ours crosses the {w3}. | travel death'], '');
  v('CUL-68', 'gurlord: a valley lord of the Knot', 'Lord of the Red Saddle: the pass-lord', 'trammoot: the valley lords in the castle', 'the {n} apricot-year of {ru}',
    'Apricots and a good bridge.', 'By the secret name my grandmother gave me.', 'May someone learn your secret name.', 'the porters; valley women; bridge men',
    ['Tell the road worse than it is | travel money', 'The last knot crosses first | work', 'A tree is a dowry | kin money land'],
    ['Every {w1} rebuilds its rope bridge in one day each year. | work travel', 'In the {w3} every tree is counted. | land kin'], '');
})();
