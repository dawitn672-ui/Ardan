// Old age, part 1: the body failing, and how you meet it. Sight, hearing, hands, teeth, the stair, the cold, the
// horse you cannot mount, the old hurt that comes back (67-memory-weave's record of when you were hurt).
// Helpers: A.OA (old-age.core.js). Every cond requires C.old, so the scorecard counts these as old-age scenes.
(function () {
A.defEvents([
  { id: 'oa_body_faces', title: 'Faces across the square',
    cond: (p, C) => C.old(p) && !C.ruler(p),
    w: 2, cool: 12,
    text: 'You greeted a stranger by your cousin\'s name this morning, warmly, and walked straight past your cousin. Beyond ten paces the world has gone soft at the edges. People are starting to wave from closer than they used to.',
    choices: [
      { t: 'Tell people plainly that your eyes are going', r: 'They stop being offended and start shouting their names as they come. It is a kind of courtesy.', fx: { honor: 1, happy: -2, need: { company: 6 } } },
      { t: 'Greet everyone warmly, just in case', check: { s: 'persuasion', s2: 'ins', d: 45 },
        win: { r: 'You are suddenly the friendliest old soul in the parish. Strangers bring you eggs.', fx: { happy: 3, fame: 1 } },
        lose: { r: 'You embrace the tax-farmer\'s clerk. He tells everyone, with relish.', fx: { happy: -3, honor: -1 } } },
      { t: 'Keep to the house and the faces you know', r: 'The house is quiet. You know every crack in the wall by touch, which is something.', fx: { need: { rest: 8, company: -6 }, wil: 1 } },
    ] },

  { id: 'oa_body_glass', title: 'A reading glass',
    cond: (p, C) => C.old(p) && (C.literate(p) || C.job(p) || C.rich(p)),
    w: 1, cool: 15, once: true,
    text: p => 'A pedlar from the south has a glass the size of a coin, ground so thick that a letter under it swells like a toad. Twelve suns, he says, and swears a bishop bought its brother. Your own eyes have been making the small work into guesswork for a year.' + (p.flags.ev && p.flags.ev.oa_body_faces != null ? ' You have known it since the day you embraced the wrong man in the square.' : ''),
    choices: [
      { t: 'Pay the twelve suns', r: 'The letters jump up black and sharp. You read the whole of an old contract at one sitting, and find the clause you were cheated by.', fx: { coin: -12, int: 1, happy: 3 } },
      { t: 'Haggle, and look for the flaw', check: { s: 'trade', s2: 'ins', d: 45 },
        win: { r: 'There is a bubble in the edge. You get it for seven, and it reads well enough round the bubble.', fx: { coin: -7, int: 1, happy: 2 } },
        lose: { r: 'He packs up and leaves while you are still pointing at the bubble. The next town gets it.', fx: { happy: -2 } } },
      { t: 'Have a young pair of eyes read for you', r: 'A grandchild or a neighbour\'s girl reads to you in the evenings, stumbling. She learns more than you do.', fx: { happy: 1, need: { company: 6 }, wil: -1 } },
    ] },

  { id: 'oa_body_ears', title: 'What they say behind their hands',
    cond: (p, C) => C.old(p),
    w: 2, cool: 12,
    text: 'At table the talk has become a river of noise with a few words floating in it. You laugh when the others laugh and nod at what may have been a question. Twice tonight you answered something nobody asked, and the young ones grinned into their cups.',
    choices: [
      { t: 'Sit at the head, where the voices come to you', r: 'You take the high seat as if it were your right. It is, more or less, and you hear half of everything now.', fx: { happy: 2, honor: -1, need: { company: 4 } } },
      { t: 'Cup your ear and make them say it twice', r: 'They say it twice, slower, and some of the wit goes out of it. You do not care.', fx: { wil: 1, happy: -1, need: { company: 6 } } },
      { t: 'Stop trying, and watch their faces', check: { s: 'ins', s2: 'wil', d: 45 },
        win: { r: 'Faces say more than words did. You see who is lying about the harvest, and who is in love.', fx: { ins: 1, happy: 2 } },
        lose: { r: 'You watch, and miss everything, and drift off by the fire before the pudding.', fx: { happy: -3, need: { rest: 6 } } } },
    ] },

  { id: 'oa_body_hands', title: 'Hands that will not close',
    cond: (p, C) => C.old(p) && (C.job(p) || C.poor(p) || C.prof(p, 'craft', 30)),
    w: 2, cool: 12,
    text: 'In the cold mornings your hands are claws until noon. The knuckles have swollen like knots in a rope, and the work that used to be in your fingers is somewhere else now. You dropped a full pail today and stood looking at it.',
    choices: [
      { t: 'Warm them in goose fat and keep working', r: 'It stinks, and it helps. By midday you can hold a tool, if not well.', fx: { coin: -2, sta: 1, happy: -1 } },
      { t: 'Give the fine work to someone younger', r: 'You stand at their elbow and say what you would do. They do it worse, and learn.', fx: { coin: -4, happy: -2, need: { purpose: 6 } } },
      { t: 'Ask the cunning woman for her salve', check: { s: 'medicine', s2: 'ins', d: 45 },
        win: { r: 'Comfrey and something she will not name. The swelling goes down by half.', fx: { health: 4, happy: 2 } },
        lose: { r: 'It burns, and the skin peels, and your hands are no better for it.', fx: { health: -2, coin: -2 } } },
    ] },

  { id: 'oa_body_teeth', title: 'The last back tooth',
    cond: (p, C) => C.old(p) && !C.race(p, 'elf'),
    w: 1, cool: 20, once: true,
    text: 'The last of your back teeth has been loose since harvest, and now it aches with every mouthful. Bread must be soaked. Meat is a memory. The barber at the fair pulls teeth for two suns and a cup of strong drink, his or yours.',
    choices: [
      { t: 'Let the barber pull it', check: { s: 'wil', s2: 'sta', d: 40 },
        win: { r: 'One wrench, a noise like a cork, and it is out. You eat soft food in peace for the first time in months.', fx: { coin: -2, health: 4, wil: 1 } },
        lose: { r: 'It breaks. He digs for the root for a long time. You do not eat for a week.', fx: { coin: -2, health: -4 } } },
      { t: 'Live on broth and porridge', r: 'You become an authority on porridge. The tooth stays, aching quietly, like a lodger.', fx: { health: -1, happy: -2, need: { comfort: -4 } } },
      { t: 'Tie it to the door and have a child slam it', r: 'The child slams it with enormous pleasure. The tooth comes out. So does a good deal of blood.', fx: { health: -2, happy: 3, need: { company: 4 } } },
    ] },

  { id: 'oa_body_stair', title: 'The stair',
    cond: (p, C) => C.old(p) && !C.poor(p),
    w: 2, cool: 12,
    text: 'The stair to your bed has grown three steps since spring. You count them going up, and rest on the seventh, and pretend to be looking at the beam. Last week you missed the bottom one in the dark and sat on the floor until the cat came.',
    choices: [
      { t: 'Move your bed down by the hearth', r: 'The bed comes down to the warm room. It feels like a defeat for a week, and then like sense.', fx: { health: 4, happy: -2, need: { comfort: 6 } } },
      { t: 'Have a rope rail put up', r: 'A carpenter fixes a rope along the wall. Twenty climbs a day keep your legs. Mostly.', fx: { coin: -6, sta: 1 } },
      { t: 'Climb it every day, out of spite', check: { s: 'sta', s2: 'wil', d: 45 },
        win: { r: 'You climb it, and climb it again. By autumn you take the seventh step without resting.', fx: { sta: 1, wil: 1 } },
        lose: { r: 'You fall on the fourth step and crack a rib. The bed comes down anyway.', fx: { health: -5, wound: 'broken_ribs' } } },
    ] },

  { id: 'oa_body_cold', title: 'The cold gets in',
    cond: (p, C) => C.old(p) && (C.poor(p) || C.terr(p, 'hills', 'mountains', 'tundra')),
    w: 2, cool: 10,
    text: 'The winter has found the gaps in you. You sleep in your cloak and wake stiff as a plank, and the fire never seems to reach past your knees. An old neighbour went in the night last week, sitting up by a dead hearth. They found her in the morning.',
    choices: [
      { t: 'Buy a cartload of wood, whatever it costs', r: 'You burn it like a lord. The cold stays outside, and so does most of your purse.', fx: { coinPct: -0.08, health: 5, need: { comfort: 8 } } },
      { t: 'Sleep in the byre with the beasts', r: 'The cow breathes warm all night. You smell like her by Candlemas, and you are alive.', fx: { health: 4, happy: -3, honor: -1 } },
      { t: 'Take in a lodger to share the fire', r: 'A widow from the lane moves in with her pot and her opinions. The fire is doubled, and so is the talk.', fx: { coin: 3, need: { company: 8, rest: -4 } } },
    ] },

  { id: 'oa_body_horse', title: 'The mounting block',
    cond: (p, C) => C.old(p) && (C.mounted(p) || C.noble(p) || C.soldier(p)),
    w: 1, cool: 12,
    text: 'The groom brings the mounting block without being asked, and then, today, a second groom to give you a leg up. Your horse turns her head and regards you. Thirty years you swung into the saddle from the ground.',
    choices: [
      { t: 'Wave them off and mount from the ground', check: { s: 'riding', s2: 'sta', d: 50 },
        win: { r: 'It is ugly, and it works. The grooms find something else to look at. You ride out with your back straight.', fx: { wil: 1, happy: 3 } },
        lose: { r: 'You hang across the saddle like a sack of meal, and then you are on the cobbles.', fx: { health: -4, happy: -3 } } },
      { t: 'Use the block and say nothing', r: 'You use the block. Nobody says anything either. The ride is a good one.', fx: { happy: 1, health: 1 } },
      { t: 'Give up the saddle for a cart', r: 'A cart with cushions, and a boy to drive it. You see more of the country, slower.', fx: { coin: -8, need: { comfort: 8 }, happy: -2 } },
    ] },

  { id: 'oa_body_old_hurt', title: 'The old hurt',
    cond: (p, C) => C.old(p) && C.oldLine(p, 'hurt', 15),
    w: 2, cool: 12,
    setup: (p, ctx) => { A.OA.pickLine(p, ctx, 'hurt', 15, 'oa_body_old_hurt'); },
    text: 'It is {oaMago} since the day {oaMdeed}. You were young and it healed, more or less. Now, in the wet weeks, it comes back to collect: the same place, the same ache, as if the years had only been interest on it.',
    choices: [
      { t: 'Pay a bonesetter to look at it again', check: { s: 'medicine', s2: 'sta', d: 45 },
        win: { r: 'He finds what the first one missed, and binds it right. The wet weeks are kinder.', fx: { coin: -6, health: 6 } },
        lose: { r: 'He pulls it about and charges you for the pulling. It aches worse.', fx: { coin: -6, health: -3 } } },
      { t: 'Drink to it, as you did then', r: 'Strong drink dulls it, and you tell the story to anyone who stays. Fewer stay each time.', fx: { coin: -2, happy: 3, health: -1 } },
      { t: 'Bear it, and say nothing', r: 'You walk to church on it every week. Nobody knows what it costs you.', fx: { wil: 1.5, happy: -2 } },
    ] },

  { id: 'oa_body_lasting_wound', title: 'The scar that knows the weather',
    cond: (p, C) => C.old(p) && C.wound(p, 'lasting'),
    w: 1, cool: 12,
    text: 'The mark you carry from your fighting years has become a prophet. It aches a day before rain and two before snow, and the village has started asking you about the weather. You are right more often than the priest.',
    choices: [
      { t: 'Forecast for anyone who asks', r: 'They come to your door before haying and before a wedding. You are wrong once, at a wedding, and hear about it.', fx: { fame: 1, need: { company: 6, rest: -4 } } },
      { t: 'Charge a copper a forecast', r: 'A copper a forecast adds up over a wet year. The priest calls it trafficking with spirits.', fx: { coin: 4, piety: -1 } },
      { t: 'Keep the aches to yourself', r: 'You say nothing and bring your own washing in early. Your neighbours wonder how you always know.', fx: { wil: 1, happy: 1 } },
    ] },

  { id: 'oa_body_forget', title: 'The word that will not come',
    cond: (p, C) => C.old(p),
    w: 2, cool: 12,
    text: 'You went to the shed for something this morning and stood there among the tools with no idea what. Yesterday the name of your own street left you mid-sentence. It comes back, all of it, an hour later. That hour is getting longer.',
    choices: [
      { t: 'Tie knots in a cord for each thing to remember', r: 'Your belt grows knots like a fishing net. You remember the knots, mostly, if not what they are for.', fx: { int: 0.5, happy: -1, need: { purpose: 4 } } },
      { t: 'Recite the old songs every night to keep it sharp', check: { s: 'learning', s2: 'wil', d: 45 },
        win: { r: 'Forty verses a night. The street\'s name stays where you put it.', fx: { int: 1, wil: 1 } },
        lose: { r: 'You lose your place in the third verse every night, and lie awake hunting for it.', fx: { happy: -3, need: { rest: -4 } } } },
      { t: 'Laugh at it before anyone else can', r: 'You make a joke of it at market. People laugh with you, and then, a little, at you.', fx: { happy: 2, honor: -1, need: { company: 4 } } },
    ] },

  { id: 'oa_body_fall', title: 'On the ice',
    cond: (p, C) => C.old(p) && !C.ruler(p),
    w: 1, cool: 15,
    text: 'The yard is glazed with ice and you went down on it hard. Nothing broke, you think. But you lay a long while looking at the grey sky before you could get your knees under you, and nobody came. The bucket is still out there.',
    choices: [
      { t: 'Send for a son or daughter to live nearer', req: (p, C) => C.hasKids(p), r: 'They come, with a cart and a long face, and take the room by the door. You are watched now.', fx: { health: 4, happy: -2, need: { company: 8 } } },
      { t: 'Spread ash on the yard and carry on', r: 'Ash on the ice, a stick by the door. You fall again in February, gently, near the woodpile.', fx: { health: -2, wil: 1 } },
      { t: 'Pay a neighbour\'s boy to do the yard', r: 'He does the yard and the well, and steals your apples, and is worth it.', fx: { coin: -5, health: 3 } },
    ] },

  { id: 'oa_body_sleep', title: 'Awake before the birds',
    cond: (p, C) => C.old(p),
    w: 1, cool: 10,
    text: 'You wake every night at the same black hour and lie listening to the house. The dead come round at that hour, and the debts, and the things you said thirty years ago that you would like back. Dawn is a long way off.',
    choices: [
      { t: 'Get up and work by rushlight', r: 'You mend, sort and sharpen in the dark. By morning there is a row of finished things and you are tired by noon.', fx: { coin: 2, need: { rest: -5, purpose: 6 } } },
      { t: 'Pray until it passes', r: 'The old words wear a groove for your mind to run in. Sometimes it is sleep at the end of it.', fx: { piety: 2, need: { rest: 4 } } },
      { t: 'A cup of poppy-water from the apothecary', r: 'You sleep like a stone and wake like one. It costs, and you start to want it.', fx: { coin: -3, need: { rest: 10 }, wil: -1 } },
    ] },

  { id: 'oa_body_walk', title: 'The long way round',
    cond: (p, C) => C.old(p) && !C.ruler(p),
    w: 1, cool: 10,
    text: 'The walk to market that took you half an hour now takes the morning, with rests on the churchyard wall and the stile by the ford. Your physician, who is younger than your boots, says walking is the best medicine and riding in a cart is the worst.',
    choices: [
      { t: 'Walk it every market day, rain or not', r: 'You know every stone of it. By the fast you only rest at the stile.', fx: { sta: 1, health: 3, need: { rest: -4 } } },
      { t: 'Ride in a neighbour\'s cart and pay for the ride', r: 'A copper each way and his talk for nothing. You hear everything the parish knows.', fx: { coin: -3, need: { company: 6 }, sta: -0.5 } },
      { t: 'Send someone else to market', r: 'Someone else buys the wrong cheese, and the world comes to you secondhand.', fx: { need: { rest: 6, company: -6 }, happy: -1 } },
    ] },

  { id: 'oa_body_mirror', title: 'Your father\'s face',
    cond: (p, C) => C.old(p),
    w: 1, cool: 20, once: true,
    text: 'In the bucket this morning, before the water settled, your father looked up at you. The same jowl, the same scowl at the world. You never thought you would get his face. You are older now than he was when he died, or near it.',
    choices: [
      { t: 'Take out his things and look at them', r: 'An awl, a belt, a letter you cannot read. You sit with them till dark, and know him a little better.', fx: { happy: -2, wil: 1, need: { purpose: 4 } } },
      { t: 'Grow a beard, or wear a hood', r: 'You change what you can. It is your face again, nearly, and you stop looking in buckets.', fx: { happy: 2, looks: -1 } },
      { t: 'Make his scowl your own', r: 'You scowl at the world on purpose. It works: the young step out of your way, as they did for him.', fx: { wil: 1, need: { company: -4 }, honor: 1 } },
    ] },

  { id: 'oa_body_strength', title: 'The sack of grain',
    cond: (p, C) => C.old(p) && C.stat(p, 'str') >= 30,
    w: 1, cool: 12,
    text: 'A sack you once carried up the loft ladder one-handed sits on the ground where you set it down halfway. A boy of fifteen picks it up and carries it up without being asked, whistling. You were stronger than anyone. The body keeps no record of that.',
    choices: [
      { t: 'Thank him and pay him a copper', r: 'He does the rest of the sacks for a copper each. You sit and count them, which you are still good at.', fx: { coin: -2, happy: 1, need: { company: 4 } } },
      { t: 'Wrestle him for it, as you would have once', check: { s: 'str', s2: 'wil', d: 55 },
        win: { r: 'You turn him over with an old trick he has never seen. The village talks of it for a month.', fx: { fame: 1, happy: 4, health: -1 } },
        lose: { r: 'He is gentle about it, which is worse. You limp home.', fx: { health: -3, happy: -3 } } },
      { t: 'Carry the next one up yourself, slowly', r: 'One step at a time, resting on each rung. It takes all afternoon. It is done.', fx: { str: 0.5, health: -2, wil: 1 } },
    ] },

  { id: 'oa_body_physician', title: 'The physician\'s verdict',
    cond: (p, C) => C.old(p) && (C.rich(p) || C.noble(p)) && p.health < 70,
    w: 2, cool: 8,
    text: 'The physician has listened to your chest, tasted your water and frowned at a chart of the heavens. Your humours are cold and dry, he says, as befits the age, and he has a regimen: no wine, no red meat, no women, and a draught of his own making at forty suns the flask.',
    choices: [
      { t: 'Follow the regimen to the letter', r: 'Boiled fowl and barley water for a season. You feel no better and no worse, only poorer and more virtuous.', fx: { coin: -40, health: 4, happy: -4 } },
      { t: 'Take the draught, keep the wine', r: 'The draught tastes of liquorice and lead. The wine tastes of wine. One of them helps.', fx: { coin: -40, health: 3, happy: 2 } },
      { t: 'Pay his fee and ignore him', r: 'You pay him for the visit and send him on his way. Your cook is delighted.', fx: { coin: -5, happy: 3, health: -1 } },
    ] },

  { id: 'oa_body_care', title: 'Minding the body',
    cond: (p, C) => C.old(p) && p.bmCare > 0,
    w: 1, cool: 10,
    text: 'The baths and the morning walks have become a habit, and the habit has become a rule, and the rule has made you a bore on the subject. Your knees are better than your brother\'s were at this age. The family has heard about your knees.',
    choices: [
      { t: 'Keep the regimen, every day', r: 'Every day. Your knees continue to be a subject of conversation, mostly yours.', fx: { health: 4, happy: -1, need: { company: -4 } } },
      { t: 'Bring a grandchild on the morning walk', req: (p, C) => C.grandkids(p), r: 'The child runs ahead and back, ahead and back, and asks you about every bird. You walk further than you meant.', fx: { health: 3, happy: 3, need: { company: 6 } } },
      { t: 'Skip it for once and sleep in', r: 'You sleep in, and enjoy it, and feel it in your knees by evening.', fx: { need: { rest: 8 }, health: -1, happy: 2 } },
    ] },
]);
})();
