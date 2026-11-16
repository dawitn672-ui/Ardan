// Scenes that look back on the world record (57-world-chronicle): an old soldier's siege, the price of bread since the
// famine, the bells for a dead ruler, children playing at a war, a sickness in the street (queued by the epidemic),
// refugees of a burned town, a song about a battle, a sergeant's war, a grave of a Legend, a coin of a fallen realm, a
// lord's table, a monk writing the annals, the burnt end of a town. Each setup picks an entry the character could know
// of (A.WC.pickFor: their realm or a neighbour's, after their birth, or the realm's canon) and backs out if none fits.
(function () {
const W = () => A.WC;
const pick = (kinds, opts) => (p, ctx) => { W().pickFor(p, ctx, kinds, opts); };
const KIND = {
  battle: 'the battle at {wcPlace} in {wcYear}', siege: 'the siege of {wcPlace} in {wcYear}', fall: '{wcRef}',
};
// a run entry can be told by its place; a canon one by its own name
const told = ctx => (ctx.wcRun && KIND[ctx.wcKind]) || '{wcRef}';

A.defEvents([
  { id: 'wc_old_soldier', title: 'He was there',
    cond: (p, C) => C.adult(p) && !C.soldier(p) && C.chron(p, 'battle,siege,fall'),
    w: 2, cool: 8,
    setup: pick('battle,siege,fall', { id: 'wc_old_soldier' }),
    text: (p, ctx) => `A one-eyed man by the well is telling anyone who stops about ${told(ctx)}. He was there, he says, with the men of {wcRealm}. ${ctx.wcRun && ctx.wcKind === 'battle' ? 'In today\'s telling the dead come to {wcDead}.' : 'In today\'s telling the walls are higher.'} Last week they were lower.`,
    choices: [
      { t: 'Buy him a cup and hear it out', r: 'He tells it twice, the second time with the cup for the gate. You come away knowing how a line breaks.', fx: { coin: -2, happy: 2, skill: { tactics: 1 } } },
      { t: 'Ask him what it was really like', check: { s: 'persuasion', s2: 'ins', d: 45 },
        win: { r: 'He stops performing. Mud, a bad well, a boy who would not stop shouting for his mother. He thanks you for asking.', fx: { wil: 1, skill: { tactics: 1 } } },
        lose: { r: 'He takes it for mockery and tells the street you were not there. Nobody was, he says, but him.', fx: { happy: -2 } } },
      { t: 'Walk on; you have heard it before', r: 'His voice follows you down the street, getting the numbers wrong.', fx: {} },
    ] },

  { id: 'wc_bread_since', title: 'The price of a loaf',
    cond: (p, C) => (C.teen(p) || C.adult(p)) && !C.ruler(p) && C.chron(p, 'famine'),
    w: 2, cool: 8,
    setup: pick('famine', { id: 'wc_bread_since' }),
    text: 'The baker\'s girl names the price of a loaf and waits for you to complain. Everyone does, she says, since {wcRef}. Her father still buys flour by the cart each autumn and sleeps beside it.',
    choices: [
      { t: 'Pay it and say nothing', r: 'She wraps it in yesterday\'s cloth. It is good bread, at least.', fx: { coin: -1, happy: 1 } },
      { t: 'Haggle her down a little', check: { s: 'trade', s2: 'ins', d: 45 },
        win: { r: 'You get a heel of yesterday\'s loaf thrown in, and a look that says you will not get it again.', fx: { coin: 1 } },
        lose: { r: 'Her father comes out of the back with flour to the elbows, and the price goes up.', fx: { coin: -2, happy: -1 } } },
      { t: 'Buy a sack of meal to keep, as people did then', r: 'You carry it home on your shoulder. It sits in the corner like a promise you made to yourself.', fx: { coin: -6, happy: 2, need: { comfort: 6 } } },
    ] },

  { id: 'wc_bells_for_ruler', title: 'Bells at noon',
    cond: (p, C) => (C.teen(p) || C.adult(p)) && C.chron(p, 'ruler'),
    w: 1, cool: 12,
    setup: pick('ruler', { id: 'wc_bells_for_ruler' }),
    text: 'The bells ring at noon for no reason you know. A woman tells you it is for {wcWho}, who died in {wcYear}, and the bells have rung for it every year since. Some go to the shrine to pray. Some go to the tavern to argue about the reign.',
    choices: [
      { t: 'Go to the shrine', r: 'The priest names the dead ruler\'s good works and leaves out the rest. The candles are cheap ones.', fx: { piety: 2, happy: -1 } },
      { t: 'Go to the tavern', r: 'By the third cup the old reign was a golden age, and by the fifth a disgrace.', fx: { coin: -2, happy: 3, need: { company: 6 } } },
      { t: 'Keep working while the others stop', r: 'The street is empty. You get more done in an hour than in a morning.', fx: { coin: 3, happy: -1 } },
    ] },

  { id: 'wc_play_siege', title: 'The siege game',
    cond: (p, C) => C.child(p) && C.age(p) >= 6 && C.chron(p, 'siege,fall,battle'),
    w: 2, cool: 4,
    setup: pick('siege,fall,battle', { id: 'wc_play_siege' }),
    text: (p, ctx) => `The children of the street are playing at ${told(ctx)}. One side holds the woodpile. The other has a ladder made from a cart shaft. Nobody wants to be {wcOther}, so the smallest have to be. They want you on a side.`,
    choices: [
      { t: 'Hold the woodpile', r: 'You hold it until supper, with a stick and a lid for a shield. Your knuckles are raw.', fx: { sta: 1, happy: 1 } },
      { t: 'Go up the ladder', r: 'You are first over the woodpile, and first off it, onto your back. It was worth it.', fx: { spd: 1, health: -1, happy: 2 } },
      { t: 'Be the traitor who opens the gate', r: 'You let the ladder side in by the back. Both sides chase you home, laughing.', fx: { ins: 1, happy: 2 } },
    ] },

  { id: 'wc_sickness_comes', title: 'Chalk on the doors', trigger: true,
    cond: (p, C) => (C.teen(p) || C.adult(p)),
    setup: (p, ctx) => { const e = W().ent(ctx.wci); if (!e || e.k !== 'plague') { ctx.skip = true; return; } W().mark('r' + e.i); Object.assign(ctx, { wcSick: W().name('sick:' + e.p + ':' + e.y) || 'the sickness', wcPlace: A.provName(p.home) }); },
    text: '{wcSick} is in {wcPlace}. Doors are marked with chalk. Your neighbour\'s boy has the sweats, and the healer will not come into the street. The carts for the dead come at night.',
    choices: [
      { t: 'Shut your door and wait it out', r: 'Weeks of bread and boiled water and other people\'s coughing through the wall. It passes your door.', fx: { happy: -3, need: { company: -6 } } },
      { t: 'Tend the neighbours yourself', check: { s: 'medicine', s2: 'sta', d: 45 },
        win: { r: 'Vinegar, clean water, and sitting up with the boy. He lives. The street remembers who came.', fx: { piety: 2, fame: 1, skill: { medicine: 2 } } },
        lose: { r: 'The boy lives. You take the sickness home with you and lie a fortnight in sweats.', fx: { health: -12, piety: 1, skill: { medicine: 1 } } } },
      { t: 'Leave for the country until it passes', r: 'A farmer\'s loft, at a price. You come back to fewer neighbours.', fx: { coin: -8, happy: -1 } },
    ] },

  { id: 'wc_refugees', title: 'From {wcPlace}',
    cond: (p, C) => C.adult(p) && C.chron(p, 'fall,fallen', 'sack'),
    w: 1, cool: 10,
    setup: pick('fall,fallen', { id: 'wc_refugees', mode: 'sack' }),
    text: 'A family sits by the road with a handcart and a goat. They left home after {wcRef}, and have been walking since. The man asks you for work, any work. His wife does not look up.',
    choices: [
      { t: 'Give them a meal', r: 'They eat like people who have learned not to leave crumbs.', fx: { coin: -2, piety: 1, happy: 1 } },
      { t: 'Find the man a day\'s work', check: { s: 'persuasion', s2: 'int', d: 45 },
        win: { r: 'A carter you know needs a man who can lift. He takes him on for the week.', fx: { honor: 1, rep: 1 } },
        lose: { r: 'Nobody wants a stranger with that accent. You walk him back to his cart.', fx: { happy: -1 } } },
      { t: 'Tell them the next town is kinder', r: 'They thank you. It is not, and you both know it.', fx: { honor: -1 } },
    ] },

  { id: 'wc_battle_song', title: 'A new verse',
    cond: (p, C) => C.adult(p) && C.chron(p, 'battle,fall,siege', 'pair'),
    w: 1, cool: 10,
    setup: pick('battle,fall,siege', { id: 'wc_battle_song', mode: 'pair' }),
    text: (p, ctx) => `A singer in the alehouse has a new verse about ${told(ctx)}. In it, every man of {wcRealm} is a hero and every man of {wcOther} a coward. A big man at the back, who talks like a man of {wcOther}, is getting to his feet.`,
    choices: [
      { t: 'Bang the table and sing along', r: 'The chorus is easy. The big man sits down again, outnumbered, and drinks.', fx: { happy: 2, need: { company: 6 } } },
      { t: 'Talk the big man down', check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: 'You buy him a cup and agree the song is rubbish. By closing he is singing it too.', fx: { fame: 1, coin: -1 } },
        lose: { r: 'He was not looking for a friend. Your lip splits on the table edge.', fx: { health: -4 } } },
      { t: 'Finish your cup and go', r: 'You hear the bench go over behind you as the door shuts.', fx: {} },
    ] },

  { id: 'wc_sergeant_war', title: 'How it went at {wcPlace}',
    cond: (p, C) => C.soldier(p) && C.chron(p, 'battle,siege,fall'),
    w: 2, cool: 6,
    setup: pick('battle,siege,fall', { id: 'wc_sergeant_war' }),
    text: (p, ctx) => `Your sergeant was at ${told(ctx)}. Tonight, drunk, he tells the new men how it went: who ran, who held, and which officer he would still kill if he met him on a dark road. He looks at you when he says the word "held".`,
    choices: [
      { t: 'Ask how they held', r: 'Shields locked, the second rank pushing, and nobody looking at the man who fell. He draws it in the dirt.', fx: { skill: { shield: 1, tactics: 1 } } },
      { t: 'Ask who ran', r: 'He names names. Two of them are your officers now. You keep that to yourself.', fx: { ins: 1, skill: { intrigue: 1 } } },
      { t: 'Turn in early; there is a march tomorrow', r: 'You sleep. In the morning half the new men are grey.', fx: { sta: 1, need: { rest: 6 } } },
    ] },

  { id: 'wc_legend_grave', title: 'The grave of {wcWho}',
    cond: (p, C) => C.adult(p) && C.chron(p, 'legend', 'run'),
    w: 2, cool: 12,
    setup: pick('legend', { id: 'wc_legend_grave', mode: 'run' }),
    text: 'Pilgrims crowd the grave of {wcWho}, dead since {wcYear} and already half a saint. A man sells splinters from a spear shaft he swears was the Legend\'s own. Young men with new swords kneel and touch the stone.',
    choices: [
      { t: 'Kneel and touch the stone', r: 'It is only stone, cold and worn smooth. You feel braver anyway, for a day or two.', fx: { wil: 1, piety: 1 } },
      { t: 'Buy a splinter', r: 'You will keep it in your purse for years and never quite believe in it.', fx: { coin: -3, happy: 2 } },
      { t: 'Ask the old men how the Legend really fought', check: { s: 'persuasion', s2: 'int', d: 45 },
        win: { r: 'One of them fought beside {wcWho}. He shows you a cut that is better than any you knew.', fx: { skill: { melee: 2 } } },
        lose: { r: 'They tell you it was all in the eyes, and laugh at your face.', fx: { happy: -1 } } },
    ] },

  { id: 'wc_old_coin', title: 'An old coin',
    cond: (p, C) => (C.teen(p) || C.adult(p)) && C.chron(p, 'fallen,founded,crown', 'run'),
    w: 1, cool: 12,
    setup: pick('fallen,founded,crown', { id: 'wc_old_coin', mode: 'run' }),
    text: 'In your change is a coin struck before {wcRef}: an old face, an old name, worn thin at the edges. The money-changer will take it at half its weight. An old man at the stall says he would give more for it, to keep.',
    choices: [
      { t: 'Keep it in your purse', r: 'It rides there for years, and you turn it over when you are bored.', fx: { happy: 1 } },
      { t: 'Change it at the stall', r: 'Half its weight, as he said. The money-changer drops it in a box of others like it.', fx: { coin: 1 } },
      { t: 'Sell it to the old man', check: { s: 'trade', s2: 'ins', d: 40 },
        win: { r: 'He pays twice the money-changer\'s price, and tells you about the old days for nothing.', fx: { coin: 2 } },
        lose: { r: 'He pays the same as the money-changer and talks for an hour.', fx: { coin: 1, happy: -1 } } },
    ] },

  { id: 'wc_lords_table', title: 'Talk at table',
    cond: (p, C) => C.adult(p) && C.noble(p) && C.chron(p, 'battle,siege,war,peace', 'mine'),
    w: 1, cool: 10,
    setup: pick('battle,siege,war,peace', { id: 'wc_lords_table', mode: 'mine' }),
    text: 'At a lord\'s table the talk turns to {wcRef}. An old knight, red in the face, says your family\'s men came to it late and left it early. The table goes quiet to hear what you will say.',
    choices: [
      { t: 'Laugh it off and fill his cup', r: 'He drinks it. The talk moves on, and so, by the end of the night, does the story.', fx: { honor: -1, happy: 1 } },
      { t: 'Tell him to his face that he lies', check: { s: 'intimidation', s2: 'wil', d: 50 },
        win: { r: 'He looks at you, then at his cup, and mumbles that he may have it wrong. The table remembers that.', fx: { honor: 2, fame: 1 } },
        lose: { r: 'He laughs at you, and the table laughs with him.', fx: { honor: -2, happy: -2 } } },
      { t: 'Tell the table what your family did there', check: { s: 'persuasion', s2: 'int', d: 45 },
        win: { r: 'You have the names and the days. By the end the old knight is nodding along.', fx: { honor: 1, rep: 1 } },
        lose: { r: 'You get a date wrong and he pounces on it.', fx: { honor: -1 } } },
    ] },

  { id: 'wc_annalist', title: 'The annals of {wcRealm}',
    cond: (p, C) => C.adult(p) && C.literate(p) && C.chron(p, 'battle,fall,ruler,famine,plague,fallen,founded,revolt'),
    w: 1, cool: 12,
    setup: pick('battle,fall,ruler,famine,plague,fallen,founded,revolt', { id: 'wc_annalist' }),
    text: 'A monk is writing the annals of {wcRealm}. He has {wcRef} from three tellers, and no two agree on the month, the dead or who was to blame. He dips his pen and asks what you heard.',
    choices: [
      { t: 'Tell it plainly, as you heard it', r: 'He writes it down as a fourth version and thanks you. It is the shortest.', fx: { int: 1, honor: 1 } },
      { t: 'Tell it better than you heard it', r: 'He writes fast. Your version has a hero in it, and the hero sounds a little like you.', fx: { fame: 1, honor: -1 } },
      { t: 'Say you heard nothing worth writing', r: 'He sighs and goes back to the three who disagree.', fx: {} },
    ] },

  { id: 'wc_burnt_end', title: 'The burnt end of {wcPlace}',
    cond: (p, C) => C.adult(p) && C.chron(p, 'fall', 'sack'),
    w: 1, cool: 10,
    setup: pick('fall', { id: 'wc_burnt_end', mode: 'sack' }),
    text: 'You pass the end of {wcPlace} that burned when the town was sacked in {wcYear}, {wcAgo} ago. Nettles grow in the cellars. Nobody has rebuilt; the families who owned it are dead or gone. Something glints at the bottom of one cellar.',
    choices: [
      { t: 'Climb down and look', check: { s: 'athletics', s2: 'ins', d: 45 },
        win: { r: 'A buckle of good silver, black with soot. It cleans up.', fx: { coin: 8 } },
        lose: { r: 'A beam gives under you. You climb out with a gashed shin and nothing else.', fx: { health: -6 } } },
      { t: 'Leave the dead their things', r: 'You walk on. The glint stays where it is.', fx: { piety: 1 } },
    ] },
]);
})();
