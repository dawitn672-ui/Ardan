// Far realm bibles, the Black Pines (990-far-peoples). Format: see bible.r.data.core.js.
(function () {
  const R = A.FARP_REALMS = A.FARP_REALMS || {}, C = A.FARP_CULT = A.FARP_CULT || {};

  R['POL-126'] = { want: 'Respect from Moriden, which the woods sent its conquerors and got nothing back, and the fur road\'s profits.',
    fear: 'Sokdal pushing into the southern valleys, and the Banners coming home.',
    place: ['The first Ulvar khan\'s grave', 'In the Sable Woods, 1,700 km from Moriden, where the emperors must come every fourth year.'],
    own: ['hst_snow', 'muster', { m: 10, who: 'male', need: 'mounted', ok: [{ skill: { riding: 1, survival: 1 } }, 'You ride the ring through the forest. The first tiger is sent to Moriden, as always.'], short: [{ coin: -5, honor: -1 }, 'You come to the first-snow hunt on foot. The ring-captain puts you with the beaters, and fines you.'] },
      'The Hunt of the First Snow', 'At the first snow the king leads a ring hunt of twenty thousand riders through the forest; the first tiger killed goes to Moriden.',
      'The first snow, and the king\'s ring hunt: twenty thousand riders in a circle through the forest. The first {w2} killed is sent to Moriden. Every man of a {w1} rides.',
      'Ride the ring', 'Three days in the snow and the trees. Somebody else kills the tiger, but you were in the ring.',
      'Stay with the millet', 'The hunt goes by without you. The clan chief notes it.', 'You ride the ring hunt of the first snow.', {}, { honor: -3 }] };
  R['POL-127'] = { want: 'To sell furs west as well as east, by a road to the Lakeland its trappers have heard of.',
    fear: 'The Birch March and the Right Wing\'s raids, and the years the Bight does not thaw.',
    place: ['The Bell Moot', 'The great bell that takes two men to ring, and that chooses a prince.'],
    own: ['pry_bell', 'rite', { age: 18, who: 'male' }, 'Ringing the bell', 'The prince is chosen by every fur-hunter strong enough to help ring the great bell, which takes two men.',
      'You are eighteen, and strong enough now to take a rope of the great bell at the Bell Moot. Two men to a rope; every man who rings it has a voice in choosing the prince.',
      'Take a rope and ring', 'The bell goes off over your head like a blow. You have a voice now.', 'Leave it to the older men', 'The bell rings without you. Your voice waits another year.', 'You ring the great bell at the Moot.', { str: 1, honor: 1 }, { honor: -1 }] };
  R['POL-128'] = { want: 'To keep the ice road its own and the khagan\'s officers off the lake.',
    fear: 'The khagan\'s horses on the ice.',
    place: ['The Assembly Stones at Ozhuun', 'Where the Assembly of the Shore meets on the ice at midwinter.'],
    own: ['tsl_stone', 'law', {}, 'Nothing into the Mirror', 'Nothing is thrown into the Mirror; one who does apologises to the lake before the Assembly.',
      'After your punishment you are taken to the shore. The Assembly says you threw something in the {w1}, or let it fall. You must apologise to the lake aloud, before them.',
      'Apologise to the lake', 'You speak to the water. It says nothing, which the Ice-Speaker says is acceptance.', 'Say it was an accident', 'It was, they agree. You apologise anyway.', 'You apologise to the Mirror before the Assembly.', { piety: 1 }, { honor: -2 }] };
  R['POL-129'] = { want: 'Iron and salt from the Sable traders without the fur tax.',
    fear: 'The Frost Riders\' horses on their winter pastures.',
    place: ['The Larch River\'s winter pastures', 'Snow plains where the herds dig for lichen.'],
    own: ['eat_gift', 'wed', { dowry: 1 }, 'Herds as gifts', 'A reindeer is never sold, only given; herds change hands as gifts at weddings.',
      'Your wedding, and the reindeer change hands: never sold, only given. Both families drive a gift-herd into the other\'s corral, and everyone counts. The dowry is {dowry}.',
      'Give good reindeer', 'Your gift-herd is fat and calm. The other family counts it twice, pleased.', 'Give the lame ones', 'They count them. They remember.', 'Reindeer are given at your wedding.', { happy: 2 }, { honor: -3 }] };
  R['POL-130'] = { want: 'Their salmon runs and sea-otter furs, which Hesh\'s traders want.',
    fear: 'Debts to the Sable traders.',
    place: ['The salmon river mouths', 'Where the runs come in out of the fog every summer.'],
    own: ['fgc_salmon', 'ward', { when: 'any', every: 2 }, 'The first salmon', 'The first salmon of the run is eaten by the whole village and its bones returned to the river whole.',
      'The run has begun. The first {w1} is cooked and shared by the whole village, a mouthful each, and its bones are put back in the river whole so the salmon know they were welcome.',
      'Eat your mouthful and give back the bones', 'The bones go back into the water. The run is thick for a month.', 'Eat the whole fish yourself', 'You are full. The run is thin, and everyone knows why.', 'The first salmon is shared and its bones go back.', { piety: 1 }, { honor: -3 }] };
  R['POL-131'] = { want: 'A fair price for furs at the Mouth of Mouths fair.',
    fear: 'Peryvor\'s tax-gatherers coming over the Girdle in winter.',
    place: ['The Feast Island', 'An island in the Great Mire where the bear feasts are held.'],
    own: ['brf_news', 'ward', { when: 'any', every: 3 }, 'Telling the bear the news', 'At the bear feast the bear\'s head sits in the place of honour and is told the news.',
      'The fourth night of the bear feast. The {w3}\'s head sits in the place of honour, and each household tells it the news of the year, so it can carry it home.',
      'Tell the old man your news', 'You tell him about your year. The head listens with its painted eyes.', 'Tell him nothing', 'The bear goes home with less news. People say it will remember.', 'You tell the bear the year\'s news.', { piety: 2 }, { piety: -2 }] };
  R['POL-132'] = { want: 'Grazing south into the Larch Uplands\' valleys.',
    fear: 'A summer drought, so the hay fails and the horses die in winter.',
    place: ['The Cold Pole valley', 'Forty-eight degrees below in January, and the horses outside.'],
    own: ['frr_winter', 'season', { m: 0, pct: 0.06, min: 6, cap: 15, paid: 'You buy hay and keep your horses through the deep cold ({due}).', short: 'You have no hay to buy. You live on mare\'s milk and blood, and lose a horse.', shortFx: { health: -4, honor: -1 } },
      'The deep cold', 'The horses winter outside, digging through the snow for grass; in the deep cold each household buys hay or loses horses.',
      'The deep cold of January. The horses dig for grass under the snow, and the weak ones need hay. Hay this winter costs {due}. The riders live on mare\'s milk and blood.',
      'Buy hay for the weak ones', 'The weak ones live. By spring the herd is thin but whole.', 'Let the herd dig for itself', 'Two horses die in the night. You eat one.', 'You keep your horses through the deep cold.', {}, { health: -3 }] };
  R['POL-133'] = { want: 'To sell iron and copper to the khagan and to Peryvor at once.',
    fear: 'The Birch March, which wants the southern mines.',
    place: ['Kolmheim', 'The largest of the giants\' empty halls, ninety metres long.'],
    own: ['suk_rent', 'ward', { when: 'any', every: 3 }, 'Rent to the landlords', 'Miners leave the first ore of every new seam at the oldest giant hall\'s door, as rent to the landlords.',
      'A new seam has opened. The first basket of ore goes to the door of the oldest giant hall, as rent to the landlords, who have not lived there for centuries.',
      'Carry the ore to the hall', 'You leave it on the doorstep. The hall is cold and very large.', 'Sell the first basket', 'You sell it. Two props break in the new seam that week.', 'You leave the first ore at the giants\' door.', { piety: 1 }, { health: -4 }] };

  C['CUL-71'] = [['vsf_bundle', 'season', { m: 2, pct: 0.1, min: 6, cap: 20, paid: 'The prince\'s men take one skin in ten from your winter\'s furs ({due}).', short: 'You have no furs to count. The prince\'s men write you down as owing.', shortFx: { honor: -1 } },
    'The skin in ten', 'Furs are counted in bundles of forty, and the prince\'s tax is one skin in ten.',
    'The end of the trapping season. The prince\'s men count the furs in bundles of forty and take the {w1}, one skin in ten: {due}.',
    'Lay out your bundles', 'They count and take the best of every ten, as always.', 'Hide a bundle in the snow', 'The dogs find it. They take two in ten.', 'The prince\'s men take the fur tax.', {}, { coin: -8, honor: -1 }]];
  C['CUL-73'] = [['mbc_halves', 'wed', { dowry: 1 }, 'Bear and Grouse', 'The people are two halves, Bear and Grouse; a Bear marries a Grouse, never a Bear.',
    'Your wedding. The halves are checked first: a Bear must marry a Grouse. The elders confirm it, and the dowry is laid out: {dowry}.',
    'Let the elders confirm the halves', 'Bear and Grouse. The elders nod, and the feast begins.', 'Hurry them along', 'They take twice as long, out of spite.', 'Bear marries Grouse, as is right.', { happy: 2 }, { honor: -1 }]];
  C['CUL-74'] = [['mrf_sink', 'mourn', { share: 'equal' }, 'Sunk with stones', 'The dead are rowed out and sunk with stones, the one thing that may go into the lake; the estate is shared alike.',
    '{parent} is rowed out on the {w1} by the eye-keepers and sunk with stones, the only thing ever put into the Mirror. The estate, {estate}, is shared alike. You get {got}.',
    'Row out with the eye-keepers', 'The water closes without a ripple. The eye-keepers say the lake has taken {parent} gently.', 'Watch from the shore', 'You watch. The eye-keepers row back without looking at you.', '{parent} is sunk in the Mirror. You get {got}.', { happy: -2 }, { happy: -3 }]];
  C['CUL-75'] = [['lrf_tongue', 'ward', { when: 'any', every: 3 }, 'The reindeer\'s tongue', 'A guest is given the reindeer\'s tongue.',
    'A guest has come to the camp from the next river. A reindeer is killed, and by custom the tongue, the best of it, goes to the guest.',
    'Give the guest the tongue', 'He eats it slowly, praising each mouthful. His clan will hear of your camp.', 'Keep the tongue for your children', 'The guest eats the shoulder and says nothing at all.', 'You give a guest the reindeer\'s tongue.', { honor: 1 }, { honor: -2 }]];
  C['CUL-76'] = [['swf_ginseng', 'rite', { age: 18, who: 'male' }, 'The ginseng fast', 'Ginseng roots are dug only by men who have fasted three days; a root shaped like a man goes to the prince.',
    'You are eighteen and may dig ginseng now, after a three-day fast. The old men take you into the forest hungry, and show you the five-leaved plant.',
    'Fast and dig', 'Three days hungry, then a root like a little man. It goes to the prince.', 'Eat on the second day', 'The root you dig is small and crooked. The old men say it knew.', 'You fast three days and dig ginseng.', { wil: 1, skill: { survival: 1 } }, { honor: -2 }]];
  C['CUL-77'] = [['fcf_posts', 'season', { m: 9, pct: 0.08, min: 8, cap: 20, paid: 'You pay the Sable trader his autumn reckoning ({due}), and your house keeps its posts.', short: 'You cannot pay the trader. One of your carved posts comes down.', shortFx: { honor: -3 } },
    'The carved posts', 'A house\'s rank is told by its carved posts; a family that cannot pay its debts loses its posts.',
    'Autumn, and the Sable traders want their reckoning: {due}. A house that cannot pay loses a carved post, and with it its rank.',
    'Pay the reckoning', 'The posts stand. The trader smiles and lends you more.', 'Ask the trader to wait', 'He waits, with interest.', 'You pay your debts and keep your posts.', {}, { coin: -6 }]];
  C['CUL-78'] = [['frf_grave', 'grave', {}, 'The horse on the post', 'Horses are buried with their riders, and the grave mound has a horse\'s skull on a post.',
    '', '', '', '', '', 'You are buried with your horse, and its skull is set on a post over the mound.', {}]];
  C['CUL-79'] = [['grm_names', 'law', {}, 'The walled mine', 'A mine that kills three men in a year is closed and walled with a stone carved with their names.',
    'After your punishment the mine-reeve takes you to a walled pit and reads the names on the stone. Your carelessness, he says, is how a mine gets walled.',
    'Read the names aloud with him', 'Three names. You read them twice.', 'Say mines kill men anyway', 'He writes you down as a careless man.', 'The mine-reeve reads you the names on a walled pit.', {}, { honor: -3 }]];
})();
