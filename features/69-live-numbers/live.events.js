// Live numbers: eight short scenes for the six numbers a typical life did not use (axe, unarmed, bow, sea, music,
// gambling). The two bouts in the ring carry their own 48-fight-ladder spec (the fair's champion is no knight; the farm
// lads are not either). Each is a moment most lives pass through: a wedding feast, the fair, the butts after church, dice after the
// harvest, the winter's wood, a crossing on the coast, a hand on your collar in the market, and the tables after supper at a gathering of crowns (a scene of the
// release's gathering pool, gscene, so it continues the gathering with A.gNext).
A.defEvents([
  {
    id: 'ln_wedding_song',
    title: 'A song for the bride',
    cond: (p, C) => C.adult(p) && !C.prison(p) && !C.unfree(p),
    w: 1.4, cool: 5,
    text: 'A neighbour\'s daughter is married at the church door, and the feast goes into the biggest barn in {home}. Halfway down the second barrel somebody bangs a cup and calls your name for a song.',
    choices: [
      { t: 'Sing the old bride\'s song', check: { s: 'music', s2: 'wil', d: 40 },
        win: { r: 'You find the note and hold it. The bride cries, her mother cries, and the barn takes up the last verse.', fx: { happy: 4, fame: 1, skill: { music: 1 } } },
        lose: { r: 'You start too high and run out of voice in the second verse. The barn laughs, kindly, and sings it for you.', fx: { happy: -2 } } },
      { t: 'Take the pipe from the piper and play for the dancing', check: { s: 'music', s2: 'int', d: 50 },
        win: { r: 'They dance until the candles gutter. The bride\'s father presses two suns on you at the door.', fx: { coin: 2, fame: 2, happy: 3 } },
        lose: { r: 'The pipe squeals. The piper takes it back without a word and the dancing starts again.', fx: { happy: -3 } } },
      { t: 'Raise your cup and pass the call to the piper', r: 'The piper plays, and you drink to the bride. Nobody remembers who was called.', fx: { happy: 2 } },
    ],
  },
  {
    id: 'ln_fair_ring',
    title: 'The ring at the fair',
    cond: (p, C) => C.adult(p) && !C.old(p) && !C.prison(p),
    w: 1.4, cool: 5,
    text: 'At the fair there is a ring of trodden straw behind the cattle pens, and a ram tethered to the post for whoever throws the champion. The champion is a carter\'s son with no neck. The farm lads go first.',
    choices: [
      { t: 'Wrestle the champion for the ram', check: { s: 'unarmed', s2: 'str', d: 52, fight: { scale: 'one', n: 1, tier: 2, rule: 'spar', weapon: 'fists' } },
        win: { r: 'He comes in low and you let him, and turn him over your hip. The ram is yours, and the fair knows your name by evening.', fx: { fame: 3, coin: 3, happy: 3 } },
        lose: { r: 'He picks you up like a sack and puts you down hard. Your ribs remind you for a week.', fx: { health: -6, happy: -2 } } },
      { t: 'Take on the farm lads first', check: { s: 'unarmed', s2: 'sta', d: 38, fight: { scale: 'one', n: 1, tier: 1, rule: 'spar', weapon: 'fists' } },
        win: { r: 'You throw two of them and lose to the third on a slip. Ale is bought for you all afternoon.', fx: { fame: 1, happy: 3 } },
        lose: { r: 'A lad half your weight puts you in the straw. The crowd enjoys it more than you do.', fx: { health: -2, happy: -1 } } },
      { t: 'Hold the coats and watch', r: 'You hold the coats and shout for the farm lads. A good afternoon, and nobody hurt.', fx: { happy: 1 } },
    ],
  },
  {
    id: 'ln_butts',
    title: 'The butts after church',
    cond: (p, C) => C.adult(p) && !C.old(p) && !C.prison(p) && !C.ruler(p),
    w: 1.8, cool: 4,
    text: 'After church the bows come down to the butts on the green. The young shoot for a capon; the old stand behind them and say how it was done in their day.',
    choices: [
      { t: 'Shoot for the capon', check: { s: 'bow', s2: 'ins', d: 45 },
        win: { r: 'Three in the white at the far butt. You carry the capon home by the feet.', fx: { fame: 1, happy: 3, health: 2 } },
        lose: { r: 'Your third arrow goes into the bank a yard wide. The old men have a great deal to say about it.', fx: { happy: -2 } } },
      { t: 'Shoot a few ends with the old men, for nothing', check: { s: 'bow', s2: 'str', d: 32 },
        win: { r: 'Old Ham shows you how to hold at the anchor, and the next arrow goes where you look.', fx: { skill: { bow: 2 }, happy: 1 } },
        lose: { r: 'The string slaps your wrist raw. Ham says you are holding it like a spoon.', fx: { health: -1 } } },
      { t: 'Leave the bows to others and walk home', r: 'You walk home by the river while the green shouts behind you.', fx: { need: { rest: 4 } } },
    ],
  },
  {
    id: 'ln_threshing_dice',
    title: 'Dice after the harvest',
    cond: (p, C) => C.adult(p) && !C.prison(p) && !C.faith(p, 'REL-07') && p.coin >= 5,
    w: 1.4, cool: 5,
    text: (p) => (p.noble || ['noble', 'royal', 'gentry'].includes(p.status)
      ? 'Harvest is in and the hall is full. After supper the tables are cleared for dice, and silver goes down on the board.'
      : 'The last sheaf is in. The men sweep the threshing floor, set a lantern on a cask, and bring out the dice for the gleaners\' pennies.'),
    choices: [
      { t: 'Play small, and count the throws', check: { s: 'gambling', s2: 'int', d: 42 },
        win: { r: 'You know which throws come up and which only seem to. You go home a few coins heavier.', fx: { coin: 4, happy: 2 } },
        lose: { r: 'The dice go round and your pennies go with them.', fx: { coin: -4 } } },
      { t: 'Play deep against the loudest man', check: { s: 'gambling', s2: 'ins', d: 52 },
        win: { r: 'He bets on his luck and you bet on the odds. By midnight his purse is on your side of the floor.', fx: { coin: 12, fame: 1 } },
        lose: { r: 'He is loud, and he is also good. You walk home with an empty purse and a long face.', fx: { coin: -10, happy: -3 } } },
      { t: 'Hold the lantern and watch', r: 'You hold the lantern and watch other men lose. It is a cheap night.', fx: { happy: 1 } },
    ],
  },
  {
    id: 'ln_winter_wood',
    title: 'The winter\'s wood',
    cond: (p, C) => C.adult(p) && !C.old(p) && !C.prison(p) && !C.noble(p) && !C.rich(p),
    w: 1.4, cool: 5,
    text: 'The woodpile is down to the bark. The reeve has marked a dead oak on the common for whoever will fell it, and there is windfall by the gate that wants splitting.',
    choices: [
      { t: 'Fell the oak yourself', check: { s: 'axe', s2: 'str', d: 45 },
        win: { r: 'It goes down where you meant it to. Enough wood for the winter, and a cartload over to sell.', fx: { coin: 3, need: { comfort: 15 } } },
        lose: { r: 'The trunk twists as it goes and the butt takes the skin off your shin. Half the wood, and a limp until Lantern Night.', fx: { health: -6, need: { comfort: 6 } } } },
      { t: 'Split the windfall by the gate', check: { s: 'axe', s2: 'sta', d: 32 },
        win: { r: 'Clean splits, one stroke each. A stack by the door to the eaves.', fx: { need: { comfort: 10 } } },
        lose: { r: 'The axe sticks in every knot. You split half of it and blister both hands.', fx: { health: -2, need: { comfort: 4 } } } },
      { t: 'Buy a load ready split (6 suns)', r: 'The carter tips it by the door. Dear, and dry.', fx: { coin: -6, need: { comfort: 10 } } },
    ],
  },
  {
    id: 'ln_crossing',
    title: 'The turn of the tide',
    cond: (p, C) => C.adult(p) && C.coast(p) && !C.prison(p),
    w: 1.4, cool: 5,
    text: 'The boat across the estuary goes at the turn of the tide, and the tide will not wait for anyone. The wind is getting up from the sea, and the boatman is short a hand.',
    choices: [
      { t: 'Take an oar and pull with the crew', check: { s: 'sea', s2: 'str', d: 42 },
        win: { r: 'You find the stroke and keep it. On the far side the boatman says there is a bench for you any day you want it.', fx: { happy: 2, skill: { sea: 1 }, coin: 1 } },
        lose: { r: 'You catch a crab and go over backwards into the bilge. You land soaked through and sick.', fx: { health: -4, happy: -2 } } },
      { t: 'Tell the boatman to wait out the squall', check: { s: 'sea', s2: 'ins', d: 38 },
        win: { r: 'You read the sky right. An hour later the water is glass, and you cross dry.', fx: { happy: 2 } },
        lose: { r: 'The squall never comes. You wait for nothing and miss the market on the far side.', fx: { coin: -3 } } },
      { t: 'Go round by the bridge, a day\'s walk', r: 'A day on the road and sore feet, but dry ones.', fx: { need: { rest: -6 }, happy: -1 } },
    ],
  },
  {
    id: 'ln_collared',
    title: 'Hands on your collar',
    cond: (p, C) => C.adult(p) && !C.old(p) && !C.prison(p) && !C.noble(p) && !C.ruler(p),
    w: 1.1, cool: 8,
    text: 'Two of the bailiff\'s men take you by the arms in the market. They want someone who looks like you for a ewe that went missing on First Loaf, and they are not asking.',
    choices: [
      { t: 'Twist free and run', check: { s: 'unarmed', s2: 'spd', d: 45 },
        win: { r: 'You turn the first man\'s wrist and he lets go to save it. You are over the churchyard wall before the second one understands.', fx: { happy: 1, honor: -1 } },
        lose: { r: 'They hold on, and the reeve is less patient with a man who fought. You pay for a ewe you never saw.', fx: { coin: -6, health: -3, honor: -1 } } },
      { t: 'Go quietly and let the reeve see your face', check: { s: 'persuasion', s2: 'wil', d: 40 },
        win: { r: 'The reeve takes one look at you and sends them out again. The ewe-thief, he says, has a beard.', fx: { honor: 1 } },
        lose: { r: 'The reeve is busy. You sit in the lock-up until evening and pay a penny for the room.', fx: { coin: -1, happy: -3 } } },
      { t: 'Shout for a neighbour to vouch for you', r: 'Old Wat comes over from the stalls and swears you were at his fire on First Loaf. They let go, slowly.', fx: { happy: -1 } },
    ],
  },
  {
    id: 'ln_tables',
    title: 'Tables after supper',
    trigger: true,
    gscene: { roles: ['ruler', 'envoy', 'noble', 'knight', 'guard'] },
    setup: (p, ctx) => {
      const g = A.gathById && A.gathById(ctx.gid);
      if (!g || !g.pc) { ctx.skip = 1; return; }
      const me = p.ruler || p.realm, them = (g.guests || []).concat([g.host]).filter(r => r && r !== me && A.realm(r));
      if (!them.length) { ctx.skip = 1; return; }
      ctx.rid = A.pick(them); ctx.other = A.realmShort(ctx.rid);
      ctx.room = g.pc.role === 'guard' ? 'In the guardroom the off watch' : 'After supper the boards are cleared, and the lords';
    },
    text: '{room} play at tables and dice for silver. A man of {other} pushes a stack of coin into the middle and looks round for someone to take him on.',
    choices: [
      { t: 'Sit down and play him for it', check: { s: 'gambling', s2: 'ins', d: 48 },
        win: { r: 'He plays his luck and you play the odds. By the last candle his silver is on your side of the board, and the room knows your name.', fx: (p, ctx) => { p.coin += 30; const g = A.gathById(ctx.gid); if (g && g.pc) g.pc.inf = (g.pc.inf || 0) + 1; A.gNext(ctx); return ''; } },
        lose: { r: 'He is better than he looks. You rise thirty suns lighter, with the room watching you count it out.', fx: (p, ctx) => { p.coin = Math.max(0, p.coin - 30); A.gNext(ctx); return ''; } } },
      { t: 'Play, and lose a little to him on purpose', check: { s: 'gambling', s2: 'int', d: 40 },
        win: { r: 'You lose ten suns so neatly that he thinks he won them. He is your friend for the rest of the week.', fx: (p, ctx) => { p.coin = Math.max(0, p.coin - 10); const g = A.gathById(ctx.gid); if (g && g.pc) g.pc.inf = (g.pc.inf || 0) + 3; A.gNext(ctx); return ''; } },
        lose: { r: 'You mean to lose a little and lose a great deal. He is pleased; your purse is not.', fx: (p, ctx) => { p.coin = Math.max(0, p.coin - 35); const g = A.gathById(ctx.gid); if (g && g.pc) g.pc.inf = (g.pc.inf || 0) + 1; A.gNext(ctx); return ''; } } },
      { t: 'Watch, and listen to what the losers say', r: 'Losing men talk.',
        // reading the players is the gambler's skill: one who can follow the play sees who is losing more than he has
        fx: (p, ctx) => {
          A.trainSkill(p, 'intrigue', 1);
          const g = A.gathById(ctx.gid), sharp = A.skill(p, 'gambling') >= 25;
          if (sharp && g && g.pc) g.pc.inf = (g.pc.inf || 0) + 1;
          A.gNext(ctx);
          return sharp ? 'You can follow the play well enough to see which of the {other} party is losing more than he has.' : 'You cannot follow the play, and learn only who drinks.';
        } },
    ],
  },
]);
