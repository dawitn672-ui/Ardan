// 97-life-fixes: new writing for the doors that showed the same scene again and again.
// - Families (a-memory.core.js, LF.FAMILY): the festival activity and going courting always queued one scene
//   (festival_day, meet_love). Each now has three more; the queue takes the one this life has seen least.
// - The study plan's breakthrough had two scenes ("An old scholar" came 6 to 11 times a life): five more, each once.
// - Duties for the pools that repeated most: sailors (two scenes), clerks and courtiers, the guilds, the clergy.
(function () {
  const LF = A.LF = A.LF || {};
  LF.FAMILY = LF.FAMILY || {};
  LF.FAMILY.festival_day = ['lfx_fest_hiring', 'lfx_fest_vigil', 'lfx_fest_fires'];
  LF.FAMILY.meet_love = ['lfx_meet_rain', 'lfx_meet_loaf', 'lfx_meet_dance'];
  // a love interest for the courting scenes, as meet_love finds one
  const lover = (p, ctx) => {
    if (ctx.pid && A.P(ctx.pid) && A.P(ctx.pid).alive) return;
    const l = A.makeLoveInterest ? A.makeLoveInterest(p) : null;
    if (!l) { ctx.skip = 1; return; }
    ctx.pid = l.id;
  };
  A.defEvents([
    // ---- the festival family ----
    { id: 'lfx_fest_hiring', trigger: true, title: 'The hiring fair',
      text: 'It is the hiring fair at {home}. Men and women stand in rows with the tokens of their trade in their hats: a twist of wool, a whip, a crook. Masters walk the rows and feel arms. There is a wrestling ring, a ballad-seller, and gingerbread.',
      choices: [
        { t: 'Try a fall in the wrestling ring', check: { s: 'unarmed', s2: 'str', d: 42 },
          win: { r: 'You throw a carter twice your size. The crowd shouts a name that is nearly yours.', fx: { fame: 2, happy: 4, str: 0.3 } },
          lose: { r: 'The carter throws you into the straw, twice, and helps you up both times.', fx: { happy: -2, health: -2, wil: 0.4 } } },
        { t: 'Hire on for three weeks of extra work', r: 'A farmer takes your hand on it. Three weeks of other men\'s hay, paid in silver.', fx: { coin: 14, happy: -2, sta: 0.3 } },
        { t: 'Buy gingerbread and ribbons for the house', r: 'Ribbons for the door, gingerbread for whoever gets there first.', fx: { coin: -4, happy: 6, family: 3 } },
        { t: 'Stand by the ballad-seller and learn his songs', r: 'By dusk you know four of them, and the worst one best.', fx: { happy: 3, skill: { music: 1 } } },
      ] },
    { id: 'lfx_fest_vigil', trigger: true, title: 'The long vigil',
      text: 'It is the night of the long vigil. Every window in {home} has a candle in it, and the temple doors stand open until dawn. The old women know every verse by heart. Outside a boy sells hot chestnuts from a pan.',
      choices: [
        { t: 'Keep the vigil on your knees until dawn', r: 'Your knees are raw by first light. Something in you is quieter than it was.', fx: { piety: 5, health: -2, wil: 0.5 } },
        { t: 'Carry a candle in the procession', check: { s: 'faith', s2: 'wil', d: 35 },
          win: { r: 'You walk near the front, and the priest marks your face.', fx: { piety: 3, fame: 1 } },
          lose: { r: 'Your candle gutters halfway round the square. A child laughs, and is hushed.', fx: { piety: 1, happy: -2 } } },
        { t: 'Buy chestnuts and walk home early', r: 'Hot fingers, a cold walk, your own bed.', fx: { coin: -1, happy: 4 } },
      ] },
    { id: 'lfx_fest_fires', trigger: true, title: 'Fires on the hill',
      text: 'On the shortest night the young people of {home} build fires on the hill and leap them for luck. The old say a clean leap means a good year. The fiddler has been drinking since noon and plays the better for it.',
      choices: [
        { t: 'Leap the biggest fire', check: { s: 'spd', s2: 'athletics', d: 40 },
          win: { r: 'You clear it by a hand. Luck for a year, they tell you, and pour you a cup.', fx: { happy: 6, fame: 1 } },
          lose: { r: 'You land short and singe your shins. Nobody saw much in the smoke.', fx: { health: -4, happy: -1 } } },
        { t: 'Dance until the fiddler falls asleep', check: { s: 'spd', s2: 'diplomacy', d: 32 },
          win: { r: 'You dance three sets with the same partner and walk home together.', fx: { happy: 5, newRel: { type: 'friend', op: 20 } } },
          lose: { r: 'You dance with everyone and remember no one.', fx: { happy: 2 } } },
        { t: 'Watch the fires from the wall', r: 'From the wall the hill looks like a town on fire. You like it better from here.', fx: { happy: 3, wil: 0.3 } },
      ] },

    // ---- the courting family ----
    { id: 'lfx_meet_rain', trigger: true, title: 'Under the same eaves', setup: lover,
      text: 'Rain comes down the street in rods. You run for the nearest doorway, and so does {themFull}, with a basket held over {theirHis} head. The doorway is not wide. Neither of you is going anywhere for an hour.',
      choices: [
        { t: 'Make the hour pass with talk', check: { s: 'persuasion', s2: 'int', d: 40 },
          win: { r: 'By the time the rain stops you have laughed twice and agreed to be rained on again.', fx: { them: { type: 'lover', op: 30, back: 'lover' }, happy: 7 } },
          lose: { r: 'You talk about the weather. Then, for want of anything else, about the weather.', fx: { them: { type: 'acquaint', op: 4 }, happy: -2 } } },
        { t: 'Give {themHim} your cloak and get wet', r: 'You walk home soaked. {them} keeps the cloak a week before bringing it back.', fx: { them: { type: 'friend', op: 18 }, health: -2 } },
        { t: 'Wait out the rain in silence', r: 'An hour of rain and two strangers. Then the street, and one.', fx: { happy: 1 } },
      ] },
    { id: 'lfx_meet_loaf', trigger: true, title: 'The last loaf', setup: lover,
      text: 'There is one good loaf left on the baker\'s board, and two hands reach for it: yours and the hand of {themFull}. Neither lets go. The baker has seen this before. She folds her arms and waits.',
      choices: [
        { t: 'Offer to split it, and walk {themHim} home', check: { s: 'diplomacy', s2: 'wil', d: 38 },
          win: { r: 'Half a loaf each and the long way round. You meet again on purpose.', fx: { them: { type: 'lover', op: 28, back: 'lover' }, happy: 6 } },
          lose: { r: '{them} takes the half, thanks you politely, and is gone.', fx: { them: { type: 'acquaint', op: 6 } } } },
        { t: 'Let go, with a bow', r: '{them} laughs and remembers your face.', fx: { them: { type: 'friend', op: 16 }, happy: -1 } },
        { t: 'Pull harder', check: { s: 'str', s2: 'intimidation', d: 35 },
          win: { r: 'You win the loaf. {them} looks at you as if you were a mule.', fx: { happy: 2, them: { type: 'rival', op: -10 } } },
          lose: { r: 'The loaf tears. The baker charges you both for it.', fx: { coin: -1, happy: -2 } } },
      ] },
    { id: 'lfx_meet_dance', trigger: true, title: 'A partner at the wedding', setup: lover,
      text: 'A neighbour\'s daughter is married today and half of {home} is drinking to it. When the pipes start, {themFull} is standing alone by the barrel, pretending to look for someone. The next dance is a slow one.',
      choices: [
        { t: 'Ask {themHim} to dance', check: { s: 'spd', s2: 'diplomacy', d: 36 },
          win: { r: 'One dance becomes four. People begin to talk, and you let them.', fx: { them: { type: 'lover', op: 30, back: 'lover' }, happy: 7 } },
          lose: { r: 'You tread on {theirHis} foot in the first turn and again in the last.', fx: { them: { type: 'acquaint', op: 6 }, happy: -1 } } },
        { t: 'Bring {themHim} a cup and talk instead', check: { s: 'persuasion', s2: 'ins', d: 42 },
          win: { r: 'You talk until the barrel is dry. A friend, at least, and maybe more.', fx: { them: { type: 'friend', op: 26 }, happy: 4 } },
          lose: { r: 'You find nothing to say that the pipes do not drown.', fx: { them: { type: 'acquaint', op: 3 } } } },
        { t: 'Dance with the bride\'s grandmother', r: 'She is light on her feet and heavy with gossip. You learn who is courting whom.', fx: { happy: 3, fame: 1 } },
      ] },

    // ---- the study plan: five new breakthroughs, each once a life ----
    { id: 'lfx_st_disputation', flow: ['study'], trigger: true, lfOnce: true, title: 'A disputation',
      text: 'The masters of the cathedral school hold a disputation on the feast day: one question, argued before the town. This year it is whether a lie told to save a life is still a lie. The master looks down the benches for someone to take the side nobody wants.',
      choices: [
        { t: 'Take the side nobody wants', check: { s: 'learning', s2: 'int', d: 46 },
          win: { r: 'You lose the argument and win the room. The master writes your name in his book.', fx: { fame: 2, skill: { learning: 3, persuasion: 1 } } },
          lose: { r: 'You tie yourself in a knot in front of the town, and untie it in your head for weeks.', fx: { happy: -3, skill: { learning: 2 } } } },
        { t: 'Take notes from the back bench', r: 'You fill four pages. Two are worth keeping.', fx: { skill: { learning: 2 } } },
        { t: 'Argue it out afterwards at the alehouse', r: 'The alehouse decides for the lie, loudly, and you pay for the jug.', fx: { coin: -2, happy: 3, skill: { persuasion: 2 } } },
      ] },
    { id: 'lfx_st_chained', flow: ['study'], trigger: true, lfOnce: true, title: 'The chained library',
      text: 'The monks of the river house keep their books on chains and let nobody in. But the librarian is old and his eyes are going. He will let you read for a week if you copy him a page a day in a fair hand.',
      choices: [
        { t: 'Copy by day and read by night', r: 'Seven nights of candles. Your eyes ache and your head is full.', fx: { skill: { learning: 3 }, health: -3 } },
        { t: 'Bargain to borrow one book instead', check: { s: 'persuasion', s2: 'etiquette', d: 44 },
          win: { r: 'He lends you a herbal wrapped in oilcloth and makes you swear on it.', fx: { skill: { learning: 2, medicine: 2 } } },
          lose: { r: 'He takes offence. The door closes, gently, for good.', fx: { happy: -2 } } },
        { t: 'Pay for the roof instead of copying', r: 'The house needs a roof more than another page. He lets you read three days.', fx: { coin: -15, skill: { learning: 2 } } },
      ] },
    { id: 'lfx_st_reckoning', flow: ['study'], trigger: true, lfOnce: true, title: 'A sum drawn in beer',
      text: 'A wool merchant at the inn has a sum he cannot do on his fingers: three partners, unequal shares, half a cargo lost at sea. He has drawn it on the table in beer. A sun to anyone who can do it, he says, and three to anyone who can show him how.',
      choices: [
        { t: 'Do the sum, and show him how', check: { s: 'int', s2: 'trade', d: 44 },
          win: { r: 'It takes an hour and half the table. He pays three suns and the beer.', fx: { coin: 3, skill: { learning: 2, trade: 2 } } },
          lose: { r: 'Your answer is wrong. He knows, because his partners would kill him otherwise.', fx: { happy: -2, skill: { learning: 1 } } } },
        { t: 'Do the sum, and keep the method', check: { s: 'int', s2: 'learning', d: 36 },
          win: { r: 'One sun, and the merchant will be back next quarter with the next one.', fx: { coin: 1, skill: { learning: 1 } } },
          lose: { r: 'The beer dries before you finish.', fx: { skill: { learning: 1 } } } },
        { t: 'Watch the drovers try it', r: 'Four of them, four answers. You learn something about drovers.', fx: { happy: 1, skill: { trade: 1 } } },
      ] },
    { id: 'lfx_st_map', flow: ['study'], trigger: true, lfOnce: true, title: 'A map that is wrong',
      text: 'In the back of a borrowed book is a map of Ardan, beautifully drawn and wrong in a dozen places you know: rivers on the wrong side of hills, a town that burned before your grandfather was born. There is room in the margin.',
      choices: [
        { t: 'Correct it in your own hand', r: 'It is less beautiful now and more true. The owner may not thank you.', fx: { skill: { learning: 2, survival: 1 }, happy: 2 } },
        { t: 'Copy it as it is, errors and all', r: 'You learn the shape of the world as somebody wished it.', fx: { skill: { learning: 1, craft: 1 } } },
        { t: 'Ask travellers at the inn what else is wrong', check: { s: 'persuasion', s2: 'ins', d: 40 },
          win: { r: 'A carter, a pilgrim and a deserter between them redraw the north.', fx: { skill: { learning: 2, tracking: 1 }, fame: 1 } },
          lose: { r: 'Every traveller has a different north. You stop asking.', fx: { skill: { learning: 1 }, happy: -1 } } },
      ] },
    { id: 'lfx_st_window', flow: ['study'], trigger: true, lfOnce: true, title: 'A face at the window',
      text: 'For a month a child has watched you read through the window, nose to the glass, every evening until called home. Tonight there is a knock. It is the miller\'s youngest, with a slate and a stub of chalk.',
      choices: [
        { t: 'Teach the child the letters', r: 'Twenty-six marks over a winter of evenings. Teaching them, you learn them again.', fx: { skill: { learning: 2 }, honor: 2, need: { rest: -8 } } },
        { t: 'Buy the child a primer and send them home', r: 'The primer comes back a month later, read to pieces.', fx: { honor: 1, coin: -3, happy: 1 } },
        { t: 'Say you have no time', r: 'The face at the window stops coming. The evenings are your own again.', fx: { skill: { learning: 1 }, need: { rest: 4 } } },
      ] },

    // ---- duties for the pools that repeated most ----
    { id: 'lfx_du_sea_overboard', duty: ['sailor'], trigger: true, title: 'Man overboard',
      text: 'A green boy goes over the side in a squall, and the captain will not turn the ship for a boy. You have a coil of line in your hands. The sea is grey and full of teeth.',
      choices: [
        { t: 'Throw the line and go in after him', check: { s: 'sea', s2: 'sta', d: 46 },
          win: { r: 'You haul him in by the collar. The crew stand you drinks for a week.', fx: { fame: 2, merit: 6, sta: 0.3 } },
          lose: { r: 'The line pays out. The boy is gone, and you nearly follow him.', fx: { health: -8, happy: -6 } } },
        { t: 'Throw the line and hold the rail', check: { s: 'sea', s2: 'ins', d: 38 },
          win: { r: 'He gets a hand to it. You both live, and he never leaves your side again.', fx: { merit: 3, happy: 3 } },
          lose: { r: 'He never finds the line.', fx: { happy: -5 } } },
        { t: 'Obey the captain', r: 'The ship holds her course. Nobody speaks of the boy at supper.', fx: { merit: 2, happy: -6, honor: -2 } },
      ] },
    { id: 'lfx_du_sea_rations', duty: ['sailor'], trigger: true, lfOnce: true, title: 'Short rations',
      text: 'Forty days out and the water butts are green. The captain has halved the rations, and now he means to halve them again. The bosun says the men will not stand a second cut. They are all looking at you.',
      choices: [
        { t: 'Speak for the men to the captain', check: { s: 'persuasion', s2: 'wil', d: 45 },
          win: { r: 'He opens the last of the wine instead. The grumbling stops.', fx: { merit: 4, fame: 1 } },
          lose: { r: 'He calls it mutiny talk and stops your pay for the voyage.', fx: { merit: -6, coin: -10 } } },
        { t: 'Give your own ration to the youngest', r: 'You arrive thin as a rake, and the boys would follow you anywhere.', fx: { health: -5, honor: 3, merit: 2 } },
        { t: 'Keep your head down and your mouth shut', r: 'There is no mutiny, and no wine. You arrive.', fx: { happy: -3 } },
      ] },
    { id: 'lfx_du_ct_child_petition', duty: ['courtier', 'scribe', 'steward'], trigger: true, lfOnce: true, title: 'A petition in a child\'s hand',
      text: 'Among the petitions is one in a child\'s hand. Her father was taken for the levy, and her mother cannot work the strip alone. It is spelled badly and it is true. It is not your place to send it up.',
      choices: [
        { t: 'Send it up anyway, with a note of your own', check: { s: 'etiquette', s2: 'persuasion', d: 44 },
          win: { r: 'The steward reads it and signs a release. You never learn her name.', fx: { honor: 3, merit: 2 } },
          lose: { r: 'It comes back with a note: such matters are not for you.', fx: { merit: -5 } } },
        { t: 'Pay a substitute out of your own purse', r: 'Twenty-five suns buys a man to march in her father\'s place.', fx: { coin: -25, honor: 4 } },
        { t: 'File it with the rest', r: 'It goes in the box with the others. The box is very full.', fx: { merit: 1, happy: -3 } },
      ] },
    { id: 'lfx_du_gd_apprentice', duty: ['guild'], trigger: true, lfOnce: true, title: 'An apprentice\'s mistake',
      text: 'Your apprentice has ruined a week\'s work with one careless hand, and stands waiting to be beaten, as his last master beat him. He is fourteen. The customer comes on Saturday.',
      choices: [
        { t: 'Work through the nights to make it again', r: 'You make it again, better. The boy watches every stroke.', fx: { health: -4, perf: 4 } },
        { t: 'Make him do it again, and stand over him', check: { s: 'craft', s2: 'wil', d: 40 },
          win: { r: 'He gets it right on the third try, and does not forget it.', fx: { perf: 3, skill: { craft: 1 } } },
          lose: { r: 'It is worse the second time. The customer takes his trade elsewhere.', fx: { perf: -5, coin: -10 } } },
        { t: 'Tell the customer the truth', check: { s: 'persuasion', s2: 'etiquette', d: 42 },
          win: { r: 'He laughs. He was fourteen once.', fx: { perf: 1, honor: 1 } },
          lose: { r: 'He wants his deposit back, and gets it.', fx: { coin: -12, perf: -2 } } },
      ] },
    { id: 'lfx_du_ch_wedding', duty: ['clergy'], trigger: true, lfOnce: true, title: 'A wedding nobody wants',
      text: 'You are to marry a girl of fifteen to a widower of sixty with three mills. Her mother wants it and her father wants it. The girl stands at the temple door and does not come in.',
      choices: [
        { t: 'Refuse to say the words', check: { s: 'faith', s2: 'wil', d: 46 },
          win: { r: 'The bishop backs you, this once. The widower goes home to his mills.', fx: { honor: 4, piety: 3 } },
          lose: { r: 'Another priest marries them by noon, and you are moved to a hill parish.', fx: { merit: -8, honor: 2 } } },
        { t: 'Talk to the girl before anything', check: { s: 'persuasion', s2: 'ins', d: 40 },
          win: { r: 'She tells you what she wants: the miller\'s boy, who has nothing. You find a reason to delay.', fx: { piety: 2, happy: 2 } },
          lose: { r: 'She says nothing at all. You marry them.', fx: { happy: -4 } } },
        { t: 'Say the words', r: 'The widower pays the temple well. You do not sleep.', fx: { merit: 3, happy: -5, piety: -2 } },
      ] },
  ]);
})();
