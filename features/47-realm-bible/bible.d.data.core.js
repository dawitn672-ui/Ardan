// Realm bibles, part D: the south and the spice seas (47-realm-bible). See bible.core.js for the kinds of custom and their fields.
(function () {
  const D = A.BIBLE_DATA = A.BIBLE_DATA || {}, W = A.BIBLE_WORDS = A.BIBLE_WORDS || {};

  W['CUL-04'] = [['aswel', 'a garden plot on one channel, one water-share'], ['tessila', 'a ruling read from the Book of Wells'], ['ezzaf', 'the sluice-keeper who takes the tenth']];
  W['CUL-06'] = [['hekkeb', 'the flood mark cut on the temple stair'], ['ommaka', 'the month of dyke work every house owes'], ['urnebu', 'the natron-priests who keep the dead']];
  W['CUL-05'] = [['wadrun', 'the road of wells a rider must know'], ['khessur', 'a debt paid in camels or in blood'], ['sirhal', 'the clan herd, which owns every camel in the end']];
  W['CUL-07'] = [['nefra', 'the best pearl of a boat, the Emir\'s'], ['dhurrel', 'a diving crew and its boat'], ['ulhet', 'lamp oil, a word not said in council']];
  W['CUL-08'] = [['dunsa', 'the Rememberers\' song of a line'], ['tobolo', 'a gold nugget, the Emperor\'s by law'], ['wassamo', 'a grandparent come back in a child']];
  W['CUL-10'] = [['merandu', 'a merchant house, and its shares'], ['oluka', 'the Pepper Hall scales'], ['sefandi', 'a marriage sealed as a contract between houses']];
  W['CUL-09'] = [['tsenar', 'the king of the year, whose turn it is'], ['dellaw', 'a terrace field held by one house'], ['emmeret', 'the ancestor house where a line is kept']];
  W['CUL-14'] = [['olang', 'the Storm Watch, a night alone at sea'], ['tepasi', 'the Sultan\'s fifth of all spice'], ['wennu', 'the father\'s name a child carries after its own']];
  W['CUL-16'] = [['iwoko', 'the true name, kept in the Deep Green'], ['lasu', 'a trade name, given to outsiders']];
  W['CUL-17'] = [['tirawi', 'a clan sign carved on a house post'], ['hessang', 'the ridge mist, where the dead walk']];

  D['POL-17'] = {
    want: 'To hold the Sunwall and the sea lanes both, bring Sabra\'s pearl coast back under the Sultan, and keep rag paper a thing only Qadir can make.',
    fear: 'That the Sultan dies of his stones with Jalal at the harbour and the fleet, and a journeyman with a jar carries the paper south to Sabra.',
    place: { name: 'The House of Water at Qadira', text: 'Where the Well-Keepers sit over the Book of Wells and may declare a sultan\'s order against it. Every water quarrel on the coast ends up in its courtyard.' },
    customs: [
      { id: 'qad_water_tenth', name: 'The tenth at the sluice', kind: 'year', m: 8, who: 'free',
        rule: 'Each {w1} gives the {w3} a tenth of its watered crop after the date harvest, for the Sultan\'s water.',
        text: 'The dates are in. The {w3} comes down the channel with his tally-board and his boy, stopping at each {w1} where the Sultan\'s water runs. He counts your baskets twice, the second time aloud, and holds out his hand for the tenth.',
        fx: { coin: -4 }, keepT: 'Give him the tenth', keep: 'He marks the board and moves on to the next sluice. Your channel runs full through the winter.',
        defy: { t: 'Hide two baskets under the palm litter', r: 'He finds them; it is not his first harvest. All winter your sluice-gate opens a day late each week, and the garden shows it.', fx: { coin: -2, happy: -3, wil: 1 } },
        log: 'The {w3} takes the water tenth from your {w1}.' },
      { id: 'qad_well_debt', name: 'The debt to the well', kind: 'law',
        rule: 'Whoever is punished also owes the town well a day of water-carrying, and hears a {w2} read from the Book of Wells.',
        text: 'Your sentence is served, but in Qadir the Book has its own say. A Well-Keeper reads the {w2} on your case in the courtyard, slowly, then hands you two jars. Until dark you fill the troughs at the town well, and everyone who drinks knows why.',
        fx: { piety: 1, happy: -1 }, keepT: 'Carry the water until dark', keep: 'Your shoulders ache by evening. The Keeper writes that the debt to the well is paid.',
        defy: { t: 'Pay a porter to carry it for you', r: 'The porter carries, and the Keeper writes that you paid him. The Keeper\'s lists are read aloud in the market on Fridays.', fx: { coin: -8, honor: -2 } },
        log: 'A Well-Keeper reads the {w2}, and you carry water at the town well until dark.' },
      { id: 'qad_grave', name: 'Washed in well water', kind: 'mourn', share: 'equal',
        rule: 'The dead are washed in well water and buried before the next sunset, and the Book of Wells divides the estate among all the children.',
        text: '{parent} is washed in water drawn from the nearest well and buried before sunset, facing it. Next morning a Well-Keeper reads the {w2} on the estate: {estate}, divided among all the children alike. You get {got}.',
        fx: { happy: -2, piety: 1 }, keepT: 'Take your share as the Book reads it', keep: 'You take it. Your brothers and sisters take theirs, and nobody argues in front of the Keeper.',
        defy: { t: 'Ask the Keeper to read it again', r: 'He reads it again, slower, and the family hears you ask. The share does not change.', fx: { honor: -2, wil: 1 } },
        log: '{parent} is washed and buried before sunset; the Book of Wells gives you {got}.' },
    ],
  };

  D['POL-18'] = {
    want: 'To keep the flood mark high and believed, feed the Middle Sea on Tamari wheat, and hold the Long Rift against Tessaria while Abara keeps the headwaters open.',
    fear: 'That someone proves the mark of 1089 was re-cut, and the living god is found to be a man who lied about the water.',
    place: { name: 'The flood stair at Tamar', text: 'Stone steps down into the Monuti, cut each year at the height of the flood. The grain tax, the king\'s right and the year\'s bread are all read off them.' },
    customs: [
      { id: 'tam_dyke_month', name: 'The month on the dykes', kind: 'year', m: 1, who: 'commoner',
        rule: 'Every commoner owes the {w2}: a month of work on the dykes and canals each year, at low water before the flood.',
        text: 'Low water. The nome governor\'s scribe reads out the names of your district, and yours is among them. The {w2} begins tomorrow: a month of mud, baskets and reed rope, so that the flood goes where the Flood Mother means it to and not into your house.',
        fx: { coin: -4, happy: -1 }, keepT: 'Take your basket to the dyke', keep: 'A month of mud and short bread. When the water rises in summer, the stretch you patched holds.',
        defy: { t: 'Pay a poorer man to go in your place', r: 'The scribe allows it, at a price, and writes both names. The man you paid is back in a week with a split hand.', fx: { coin: -10 } },
        log: 'You work the {w2} on the dykes before the flood.' },
      { id: 'tam_natron', name: 'The natron and the tenth', kind: 'mourn', share: 'temple',
        rule: 'The dead go to the {w3} for natron and linen, and the Flood Mother\'s temple takes a tenth of the estate.',
        text: '{parent} goes to the {w3}, who salt the body in natron for forty days and wrap it in linen. Their fee is the temple\'s tenth of everything left behind. The estate comes to {estate}; when the scribes have taken the tenth and divided the rest, you get {got}.',
        fx: { happy: -2, piety: 1 }, keepT: 'Pay the tenth and walk behind the bier', keep: 'The {w3} do their work well. {parent} goes into the tomb whole, with bread and a jar of beer.',
        defy: { t: 'Bury the body yourself in the desert sand', r: 'The sand keeps a body nearly as well, people say. The priests do not say so, and the street remembers a burial with no wrapping.', fx: { piety: -3, honor: -2 } },
        log: '{parent} goes to the {w3} and the tomb; the temple takes its tenth, and you get {got}.' },
      { id: 'tam_levy', name: 'The levy between sowing and harvest', kind: 'levy', who: 'male',
        rule: 'In war the levy is raised only from March to July, one man from every second house, or grain to feed one.',
        text: 'War, and the nome drum. Tamar fights in the months the fields can spare, March to July, and the levy takes one man from every second house. Yours is a first house this year. The scribe offers the old choice: go, or give grain to feed the man who does.',
        fx: { coin: -6 }, keepT: 'Measure out the grain and stay', keep: 'You measure out the grain. A boy from two houses down goes with it.',
        defy: { t: 'Say your house is a second house', r: 'The scribe checks the roll. You are wrong, and he says so in front of the whole street.', fx: { honor: -3, coin: -2 } },
        log: 'The levy comes through for the war; you give grain for a man to go.' },
    ],
  };

  D['POL-19'] = {
    want: 'To keep the Red Waste closed to anyone without a guide, take a fifth of every salt fee at Mirah, and keep the Well of Samar in clan hands.',
    fear: 'That the Zanari cut a road that needs no guides, or that Qadir\'s soldiers come to the Well of Samar after all.',
    place: { name: 'The Well of Samar', text: 'The First Well, guarded by its Keeper and by riders of every clan. Pilgrims pay for its water; Qadir swore, in secret, never to send soldiers near it.' },
    customs: [
      { id: 'snd_wells', name: 'Reciting the road of wells', kind: 'rite', age: 18, who: 'all',
        rule: 'At eighteen every youth recites the {w1}, the wells from Zarak to Mirah, before the clan chiefs, or rides behind a guide.',
        text: 'You are eighteen, and the chiefs sit by the fire to hear your {w1}: every well between Zarak and Mirah, its depth, its taste, the days between it and the next. A rider who knows them guides. A rider who does not follows someone who does.',
        fx: { int: 1, skill: { survival: 1 } }, keepT: 'Recite the wells, one by one', keep: 'You miss one, a dry well three days south of Mirah. An old man corrects you, and the chiefs let it pass.',
        defy: { t: 'Say you will learn them on the road', r: 'Then you will ride behind a guide until you do, the chiefs say. Riding at the back is noticed.', fx: { honor: -2, wil: 1 } },
        log: 'You recite the {w1} before the clan chiefs.' },
      { id: 'snd_herd', name: 'The camels go back', kind: 'mourn', share: 'clan',
        rule: 'When a rider dies, the camels, the tent and the salt-rights go back to the {w3}, and the chiefs share them out again.',
        text: '{parent} dies. Among the clans nothing of a rider\'s stays his for long: the camels, the tent and the salt-rights, worth {estate} by the Mirah count, go back to the {w3}, and the chiefs share them out again where they are needed. You get {got}, and the saddle.',
        fx: { happy: -2, honor: 1 }, keepT: 'Lead the camels to the clan herd', keep: 'The chiefs take the camels and give you back the oldest, which knows the way to every well.',
        defy: { t: 'Ride off with the best camel', r: 'Nobody stops you. Nobody of your clan rides with you that season either, and the next well you reach is closed to you.', fx: { coin: 15, honor: -5, happy: -2 } },
        log: '{parent} dies; the camels go back to the {w3}, and you get {got}.' },
      { id: 'snd_khessur', name: 'Settled at the well', kind: 'law',
        rule: 'After a judgment the wronged clan may claim {w2}: camels by the well-count, or a knife fight at the well at dawn.',
        text: 'The judgment is given, but the clan you wronged is not done. They claim {w2}, as is their right: three camels by the well-count, or you meet their chosen rider at the well at dawn, knives only, until one of you cannot stand.',
        fx: { coin: -15 }, keepT: 'Pay the camels', keep: 'You lead three camels to their tents. Their chief looks at the teeth of each one before he takes it.',
        defy: { t: 'Meet their rider at the well at dawn', r: 'You fight in the cold before sunrise. You are both on your feet at the end, just, and the clans call the debt paid in blood.', fx: { health: -15, honor: 3, wil: 1 } },
        log: 'The wronged clan claims {w2}, and you pay it in camels.' },
    ],
  };

  D['POL-24'] = {
    want: 'To stay free of Qadir, keep the pearl banks and the Gold Road caravans, and sell lamp oil to Blackreef and Lucerna without ever naming it in council.',
    fear: 'That a Qadiri fleet comes down the gulf before the fire-boats are ready, or that someone counts the empties and learns where the oil goes.',
    place: { name: 'The oil shore', text: 'A stretch of black sand south of Sabra where the lamp oil is boiled in walled yards. The Emir\'s men guard it, and every empty jar that comes back is counted.' },
    customs: [
      { id: 'sab_bride_pearls', name: 'Pearls on the blue cloth', kind: 'wed', dowry: -1,
        rule: 'At a wedding your house pays the other a price in pearls, counted out on a blue cloth before a Well-Keeper.',
        text: 'The contract is read before a Well-Keeper. In Sabra no dowry comes to you; pearls go, from your house to theirs, counted one by one on a blue cloth while both families watch. The price is {paid}, and everyone at the wedding will know whether the pearls were good.',
        fx: { honor: 1 }, keepT: 'Count out the pearls in full', keep: 'The pearls are counted and found good. Their mother holds one up to the light and says nothing against it.',
        defy: { t: 'Slip seed pearls in among the good ones', r: 'Their grandmother finds the seed pearls before the count is half done. The wedding goes on; the story goes round faster.', fx: { honor: -4, coin: 5 } },
        log: 'You pay {paid} in pearls at your wedding, counted on the blue cloth.' },
      { id: 'sab_word_not_said', name: 'The word not said', kind: 'ward', when: 'any', every: 4,
        rule: 'Nobody in Sabra calls the {w3} by any name but lamp oil, or asks where the jars that carry it are going.',
        text: 'A sailor in the harbour asks you, loudly, what Sabra puts in the sealed jars that go out at night. Two of the Emir\'s men are close enough to hear. In Sabra the {w3} is lamp oil, and lamp oil is not discussed.',
        fx: { coin: 2 }, keepT: 'Say lamp oil, and turn away', keep: 'Lamp oil, you tell him. That evening a man you do not know pays for your supper.',
        defy: { t: 'Tell him what the jars really hold', r: 'He thanks you. The next week the Emir\'s men stop you at the gate and go through everything you own, slowly.', fx: { coin: -12, happy: -3, wil: 1 } },
        log: 'Someone asks about the {w3}, and you say lamp oil, as everyone does.' },
      { id: 'sab_first_pearl', name: 'The first pearl', kind: 'rite', age: 17, who: 'commoner',
        rule: 'At seventeen a commoner dives once with a {w2}, and the best pearl of that dive is the {w1}, the Emir\'s.',
        text: 'At seventeen you go out with a {w2} for your first dive, a stone tied to your foot and a peg on your nose. One oyster holds a fat pearl, the best of the boat this week, and the Emir\'s clerk is already holding out his little box for the {w1}.',
        fx: { sta: 1, skill: { sea: 1 } }, keepT: 'Put the pearl in the clerk\'s box', keep: 'The clerk writes your name beside it. The crew say a diver who gives the first one up will find more.',
        defy: { t: 'Swallow it and say the oyster was empty', r: 'You get it back two days later. The crew saw your throat move, and they do not take you out again.', fx: { coin: 20, honor: -3, happy: -2 } },
        log: 'Your first dive with a {w2}; the best pearl goes to the Emir as the {w1}.' },
    ],
  };

  D['POL-20'] = {
    want: 'To set the price of gold from Sabra to Qadira, push the Road Promise through Abara\'s claim, and cut the road to Atani before the May rains.',
    fear: 'That the Emperor\'s numb hand spreads before his heir is sung into the line, and the High Rememberer refuses to sing the next one.',
    place: { name: 'The Hall of Weights at Zanara', text: 'Where the imperial weights are kept in an iron chest. Every gold scale from Sabra to Qadira is set by them, and a merchant caught with a light weight loses his stall.' },
    customs: [
      { id: 'zan_wassamo', name: 'The grandparent comes back', kind: 'name', by: 'grandparent',
        rule: 'A newborn takes the name of a grandparent, who is held to have come back in the child.',
        text: 'The child is born, and before you can open your mouth the grandmothers have named it {child}, for the grandparent who is held to have come back. A Rememberer will add the {w3} to your line\'s {w1} at the next feast.',
        fx: { piety: 1, happy: 1 }, keepT: 'Let the old name stand', keep: '{child} it is. Half the family speaks to the child as to an elder, and the child seems to expect it.',
        defy: { t: 'Give the child a name of your own choosing', r: 'The name is yours to give, the Rememberer agrees, and then leaves your line\'s song a verse short at the feast.', fx: { piety: -2, honor: -2, wil: 1 } },
        log: 'Your child is named {child}, a {w3}, after the grandparent.' },
      { id: 'zan_nugget', name: 'Every nugget to the Emperor', kind: 'ward', when: 'any', every: 4,
        rule: 'Every gold nugget is {w2}, the Emperor\'s by law, and weigh-men search every household every few years.',
        text: 'Two weigh-men from the Hall of Weights call at your door with a scale, a lamp and a list. Every nugget in the empire is {w2}, the Emperor\'s by law, and every house is searched in its turn. They would like to see your strongbox, and the floor under the bed.',
        fx: { coin: -6 }, keepT: 'Open the strongbox to them', keep: 'They weigh, they write, and they take a fee for the weighing. One of them is polite about it.',
        defy: { t: 'Keep the box shut until they bring a magistrate', r: 'They bring one. He opens the box himself and fines you for the wait.', fx: { coin: -12, honor: -2 } },
        log: 'The weigh-men search your house for {w2} and take their fee.' },
      { id: 'zan_sung', name: 'Sung into the line', kind: 'mourn', share: 'eldest',
        rule: 'The dead are buried under the family floor and sung into the {w1}; the eldest child keeps the house and all in it.',
        text: '{parent} is buried under the floor of the house, and a Rememberer sings the name into the {w1}, among the Thousand Ancestors. The house and all in it, {estate}, go to the eldest child, who now keeps the line\'s song. You get {got}.',
        fx: { piety: 2, happy: -2 }, keepT: 'Sit through the whole song', keep: 'It takes the night. By dawn {parent} is one name among hundreds, which is the point.',
        defy: { t: 'Pay the Rememberer to shorten it', r: 'The song is shorter, and so is the line in it. The neighbours count the verses.', fx: { coin: -5, honor: -3 } },
        log: '{parent} is sung into the {w1}; the eldest keeps the house, and you get {got}.' },
    ],
  };

  D['POL-21'] = {
    want: 'To keep every grain of pepper passing through the Pepper Hall, undersell Ranpur on the Nagora road, and stop Zanara\'s eastern road reaching the sea anywhere but Kesh.',
    fear: 'That the Amber merchants call in the 200,000 suns, and the harbour dues of 1105 turn out to be pawned already.',
    place: { name: 'The Pepper Hall at Kesh', text: 'A long shed of black hardwood on the harbour where every spice cargo is weighed. The council of houses meets in its loft, above the smell, and takes its tenth from the scales below.' },
    customs: [
      { id: 'kes_scales', name: 'The tenth at the scales', kind: 'market', cut: 0.1,
        rule: 'Goods sold at home pass the {w2}, the Pepper Hall scales, and the council of houses takes a tenth.',
        text: 'You bring your goods to sell, and a boy in a house sash steers you not to the buyer but to the {w2}. One clerk weighs, a second writes, and a third takes the council\'s cut, {cut}, before you see a coin of the rest.',
        fx: { skill: { trade: 1 } }, keepT: 'Put your goods on the scales', keep: 'The clerks are quick and fair to the grain. You learn more about prices in an hour than in a season of haggling.',
        defy: { t: 'Sell behind the warehouse, off the scales', r: 'The buyer pays well, and a house runner sees it. The council fines you twice the cut and bars you from the scales for a month.', fx: { coin: -15, honor: -2 } },
        log: 'Your goods pass the {w2}; the council of houses takes its cut, {cut}.' },
      { id: 'kes_sefandi', name: 'The marriage as a contract', kind: 'wed', dowry: 2,
        rule: 'A marriage is a {w3}, sealed at the Pepper Hall, and each house puts in as much as the other.',
        text: 'In Kesh a wedding is a {w3}, a contract between two houses, written up by Pepper Hall clerks and sealed in green wax. The other house brings {dowry}. Your own house is bound to match it, so the new household starts with twice that.',
        fx: { honor: 1 }, keepT: 'Seal the contract in green wax', keep: 'The clerks seal it. Your household opens its ledger with both sums, and both houses own a share of what comes of it.',
        defy: { t: 'Marry by the old words, without the clerks', r: 'The ancestors are satisfied. The houses are not: neither will lend to a couple with no contract, and both say so.', fx: { honor: -2, coin: -10, happy: 2 } },
        log: 'You marry by {w3} at the Pepper Hall; your house matches the {dowry} the other brings.' },
      { id: 'kes_shares', name: 'Shares in the estate', kind: 'mourn', share: 'equal',
        rule: 'An estate is cut into equal shares among all the children, daughters as sons, as the shares of a {w1} are.',
        text: '{parent} is laid in the house of the ancestors with a peppercorn on each eye. In Kesh an estate is cut like a {w1}: into equal shares, one to each living child, daughters as sons. The estate comes to {estate}. Your share is {got}.',
        fx: { happy: -2 }, keepT: 'Take your share and sign the ledger', keep: 'You sign below your brothers and sisters. The clerk blots the page and closes the book.',
        defy: { t: 'Claim the eldest\'s right, as inland people do', r: 'The clerks hear you out and write the shares equal anyway. Your brothers and sisters do not forget that you asked.', fx: { happy: -3, honor: -2, wil: 1 } },
        log: '{parent} goes to the ancestors, and the estate is cut in equal shares: you get {got}.' },
    ],
  };

  D['POL-22'] = {
    want: 'To hold the source of the Monuti and the river gift that comes with it, keep Zanara off the Road Promise, and keep the two hosts from ever meeting as enemies.',
    fear: 'That Yared and Yonas each call the other\'s year void, and Abara wakes on New Year\'s Day with two kings and one crown.',
    place: { name: 'The Twin Courts at Abara', text: 'Two palaces facing each other across one square, each with its own guard. On New Year\'s Day the crown is carried across the square from one to the other, on foot.' },
    customs: [
      { id: 'abr_crown_tenth', name: 'The tenth to the year\'s king', kind: 'year', m: 0, who: 'free',
        rule: 'At New Year the crown crosses the square, and every free house pays a tenth of grain and cattle to the {w1}.',
        text: 'New Year\'s Day. In Abara the crown is carried across the square to the other king\'s court, and in your valley a new set of toll-men arrive in the other king\'s colours. The tenth of grain and cattle goes to the {w1}, whoever he is this year. They want to know what last year\'s men took.',
        fx: { coin: -5 }, keepT: 'Pay the tenth to this year\'s men', keep: 'You pay. They give you a stamped tile to show the other king\'s men next year.',
        defy: { t: 'Say you already paid the other king', r: 'They laugh: the other king is not king this year. They take a calf as well as the tenth, for wasting their morning.', fx: { coin: -9, happy: -2 } },
        log: 'The crown crosses the square, and you pay the tenth to the {w1}.' },
      { id: 'abr_whose_host', name: 'Whose host you march with', kind: 'levy', who: 'male',
        rule: 'In war a free man serves, or pays pike-silver, with the host of the king who granted his {w2}, not the king of the year.',
        text: 'War. The drums come up the terraces, and with them the question every Abari war asks: whose host? Your {w2} was granted by the other king, so you march or pay with his pikes, whichever king is at war. The muster-man has both lists.',
        fx: { coin: -6 }, keepT: 'Pay pike-silver to your own king\'s man', keep: 'You pay. His host marches in good order, and does not stand next to the other one.',
        defy: { t: 'Pay the other king\'s man instead, he is closer', r: 'Now both muster-men have your name. Your own king\'s man comes back for his share in spring, with friends.', fx: { coin: -10, honor: -2 } },
        log: 'War, and you pay pike-silver to the host of the king who granted your {w2}.' },
      { id: 'abr_youngest', name: 'The youngest keeps the terrace', kind: 'mourn', share: 'youngest',
        rule: 'When a parent dies, the youngest child keeps the {w2} and the house; the elder ones are expected in the hosts or the towns.',
        text: '{parent} is carried up to the {w3}, where the line is kept. In the highlands the elder children go to the hosts and the towns, and the youngest, who stayed, keeps the {w2} and the house. The estate comes to {estate}. You get {got}.',
        fx: { happy: -2, piety: 1 }, keepT: 'Let the youngest keep the terrace', keep: 'The youngest is handed the plough-ox by the horn, as is done, and the rest of you walk home down the mountain.',
        defy: { t: 'Ask the elders to divide the terrace', r: 'The elders say a terrace cut in two feeds no one. They say it kindly, and they say it to everyone.', fx: { honor: -2, happy: -2, wil: 1 } },
        log: '{parent} goes to the {w3}; the youngest keeps the {w2}, and you get {got}.' },
    ],
  };

  D['POL-32'] = {
    want: 'To hold the clove and nutmeg trade against Ranpur, keep the secret of the needle, and end the Keshi alliance on the Sultan\'s terms once Kesh\'s debts are bought up.',
    fear: 'That the clove harvest fails while House Doravelli of Lucerna holds it in pledge, and the galleys are sold to pay the debt.',
    place: { name: 'The needle house at Amberport', text: 'A shuttered tower on the harbour mole where the Sultan\'s pilots keep the secret needle that steers the galleys. No one else goes in, and no pilot is let off the isles.' },
    customs: [
      { id: 'amb_storm_watch', name: 'The Storm Watch', kind: 'rite', age: 17, who: 'all',
        rule: 'At seventeen every islander keeps the {w1}: a night alone in an open boat when the old ones say a storm is near.',
        text: 'Your grandmother\'s knees ache, and that means a storm. At seventeen it is your turn for the {w1}, as every sultan of the Maruang line has kept it: a night alone in an open boat off the reef, with a lamp, a water jar and one oar. They push you off at dusk.',
        fx: { wil: 1, skill: { sea: 1 } }, keepT: 'Take the oar and go out', keep: 'The storm comes at midnight and is gone by dawn. You bail with your hands until they bleed, and are brought in alive.',
        defy: { t: 'Stay ashore and say the storm was false', r: 'The storm is real, and everyone who went out that night saw you on the beach in the lightning.', fx: { honor: -3, happy: -2 } },
        log: 'You keep the {w1}, a night alone at sea off the reef.' },
      { id: 'amb_fifth', name: 'The Sultan\'s fifth', kind: 'year', m: 9, who: 'commoner',
        rule: 'At the clove harvest the Sultan takes the {w2}, a fifth of all spice, at the harbour before any ship is loaded.',
        text: 'The cloves are picked and dried on mats until they rattle. Before a single sack goes aboard, the Sultan\'s men take the {w2}: a fifth of all spice, measured with a scoop that, the growers say, has grown larger every reign.',
        fx: { coin: -5 }, keepT: 'Let them scoop the fifth', keep: 'They scoop, and stamp your sacks with the Sultan\'s mark. Stamped sacks sell, at least.',
        defy: { t: 'Sell a sack to a Ranpuri ship by night', r: 'The Ranpuri pays well. Two weeks later the Sultan\'s men take a fifth of your trees instead, with saws.', fx: { coin: -8, happy: -3, wil: 1 } },
        log: 'The Sultan\'s men take the {w2} from your harvest at the harbour.' },
      { id: 'amb_wennu', name: 'The father\'s name carried', kind: 'name', by: 'keep',
        rule: 'A child\'s name is followed by its father\'s given name, so any island can tell whose it is.',
        text: 'Your child is born and named {child}. In the isles a name is never alone: after it comes the {w3}, the father\'s given name, so that anyone on any island can tell whose child it is. The midwife waits to hear it said.',
        fx: { happy: 2 }, keepT: 'Say the father\'s name after the child\'s', keep: 'You say it. The midwife repeats both names to the neighbours, who carry them to the next island.',
        defy: { t: 'Give the child the mother\'s name instead', r: 'People take it to mean the father is not who he seems. The talk crosses three islands by the next market.', fx: { honor: -3, wil: 1 } },
        log: 'Your child is named {child}, with the {w3} after it.' },
    ],
  };
})();
