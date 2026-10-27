// War in the Far Lands: the soldier's scenes in the far templates' terms, the horse for a soldier of a horse people,
// the recruiter of the 1105 wars, and the duties of the far organisations. Every scene here is queued by
// c-life.core.js (ctx.fwq); a scene drawn by chance without it is dropped.
(function () {
  const only = (p, ctx) => { if (!ctx.fwq) ctx.skip = true; };
  const RECRUIT = {
    horse: 'A sergeant of the {host} host counts you into a ten. Ten men eat from one pot, and if one runs the other nine are flogged. You are given a bow you cannot yet draw and told the horses belong to the hundred, not to you.',
    rolls: 'A clerk writes your name, your father\'s name and your village into the military roll of {host}, then marks your hand. From today the state feeds you, pays you in strings when it remembers, and counts you twice a year. The man beside you has been on the roll eleven years.',
    elephant: 'In {host} the elephants come first. You are put with the foot who walk beside them, and the first thing a driver teaches you is where not to stand when the beast is afraid.',
    sea: 'The {host} host is a fleet. You are put to an oar and a spear, shown the knot that holds a grapnel, and told that a man who cannot swim learns quickly.',
    hill: 'The {host} host fights from stone. You carry a spear up the pass for a week before anyone shows you how to hold it. The towers over the road have names, and by the second day the men in them know yours.',
    wild: 'There is no muster yard in {host}. An old hunter looks at your hands, your feet and your eyes, then takes you out for nine days. You come back one of them, or you go home.',
    ageset: 'The young men of your initiation are one regiment now. In {host} you will fight beside the boys you were cut with, carry the tall shield they carry, and grow old with them.',
  };
  const RANKUP = {
    horse: 'Your captain hands you a horsetail on a pole: you are {rankName} now, and men ride where it goes. If they break, it is your back the khan\'s officer looks for.',
    rolls: 'The roll of {host} is copied out again with your name a line higher: {rankName}. Your pay rises by a string a month, on paper.',
    elephant: 'You are {rankName} now, and walk nearer the beasts. The drivers nod to you in the morning, which they did not do before.',
    sea: 'You are {rankName} now. You stand at the bow when the grapnels go over, and your crew watch your feet, not the enemy.',
    hill: 'You are {rankName} now, and a tower is yours to keep. The old man you take it from shows you the loose stone where the last keeper hid his wine.',
    wild: 'They call you {rankName} now. It means you choose the path, and when it goes wrong, it was your path.',
    ageset: 'Your set has grown into its shields, and they have named you {rankName}. The older sets watch to see whether you shout or wait.',
  };
  A.defEvents([
    {
      id: 'fw_recruit', title: 'On the rolls', w: 0.01, cool: 50,
      cond: (p, C) => C.soldier(p) && C.flag(p, 'fw_recruit'),
      setup: only,
      text: (p, ctx) => RECRUIT[ctx.cls] || RECRUIT.rolls,
      choices: [
        { t: 'Learn from the oldest man in the company', r: 'He talks for a week. Some of it is true, and you remember which part.', fx: { ins: 1, skill: { tactics: 1 } } },
        { t: 'Show them what you can do', check: { s: 'str', s2: 'sta', d: 45 },
          win: { r: 'You carry a double load to the end of the march and set it down without a word. They stop calling you the new one.', fx: { fame: 2, happy: 3 } },
          lose: { r: 'You fall out a mile short, and the sergeant makes you carry it again tomorrow.', fx: { health: -6, happy: -2 } } },
        { t: 'Send your first pay home', r: 'It is not much. It arrives.', fx: { coin: -5, family: 2, happy: 1 } },
      ],
    },
    {
      id: 'fw_rankup', title: 'A step up', w: 0.01, cool: 1,
      cond: (p, C) => C.soldier(p) && C.flag(p, 'fw_rankup'),
      setup: only,
      text: (p, ctx) => RANKUP[ctx.cls] || RANKUP.rolls,
      choices: [
        { t: 'Stand your men a night of drink', r: 'The night is loud. In the morning they remember who paid.', fx: { coin: -6, happy: 3, fame: 1 } },
        { t: 'Keep the distance an officer keeps', r: 'You eat apart. The men are careful around you now.', fx: { wil: 1, skill: { command: 1 }, happy: -1 } },
        { t: 'Write the news to your family', r: 'Your mother has the letter read out twice in the square.', fx: { family: 1, happy: 2 } },
      ],
    },
    {
      id: 'fw_horse', title: 'A horse for the hundred', w: 0.01, cool: 1,
      cond: (p, C) => C.soldier(p) && C.flag(p, 'fw_horse_asked'),
      setup: only,
      text: 'The {unitWord} rides. You walk behind it with the carts. The quartermaster says a levy horse can be had against your pay, sixty coin taken five at a time, and a trader at the lines will sell one outright.',
      choices: [
        { t: 'Take the levy horse and the debt', r: 'A grey mare with a bad temper and a good wind. The quartermaster writes your name beside hers.', fx: { fwHorse: 'levy', happy: 2 } },
        { t: 'Buy a horse outright', r: 'The trader swears it is the best horse he has, as he swears to everyone.', fx: { fwHorse: 'buy', happy: 3, coin: -2 } },
        { t: 'Walk a while longer', r: 'Your legs get hard. The riders laugh, and then they stop laughing.', fx: { sta: 1, happy: -2 } },
      ],
    },
    {
      id: 'fw_war_recruit', title: 'The recruiter', w: 0.01, cool: 50,
      cond: (p, C) => C.adult(p) && !C.soldier(p) && C.flag(p, 'fw_war_recruit'),
      setup: only,
      text: 'A recruiter with a drum and a list comes to {home}. {host} is at war with {foe}, in what the clerks already call {war}. He wants grown people who can walk, and he pays the first month in hand.',
      choices: [
        { t: 'Put your name on his list', r: 'He pays you on the spot and tells you where to be at dawn.', fx: { fwEnlist: 1, coin: 8, happy: -2 } },
        { t: 'Send him on his way', r: 'He goes to the next door. Two of your neighbours go with him.', fx: { happy: 1 } },
      ],
    },
    {
      id: 'fw_duty_censor', title: 'Two hands in the grain', w: 0.01, cool: 0,
      cond: (p, C) => C.adult(p) && C.flag(p, 'fw_org_censor'),
      setup: only,
      text: 'A district magistrate\'s grain accounts reach {seat} with two hands in them. {head} gives you the file and three days.',
      choices: [
        { t: 'Go through every line yourself', check: { s: 'int', s2: 'learning', d: 45 },
          win: { r: 'The second hand writes its sevens like a clerk from the capital. You name him.', fx: { fwOrg: 8, fame: 2 } },
          lose: { r: 'The numbers swim. You send it up with a guess and a headache.', fx: { fwOrg: 2, happy: -3 } } },
        { t: 'Take the magistrate\'s gift and close the file', r: 'The gift is generous. The file is very thin.', fx: { coin: 30, honor: -5, fwOrg: -4 } },
        { t: 'Pass it to a senior censor', r: 'He takes it, and the credit with it.', fx: { fwOrg: 3 } },
      ],
    },
    {
      id: 'fw_duty_school', title: 'The year\'s test', w: 0.01, cool: 0,
      cond: (p, C) => C.adult(p) && C.flag(p, 'fw_org_school'),
      setup: only,
      text: '{head} sets the year\'s test at {seat}. Those who pass go up the hall. Those who fail sweep it.',
      choices: [
        { t: 'Sit the test', check: { s: 'melee', s2: 'ins', d: 45 },
          win: { r: 'You pass in the first rank. Your name goes up on the board in new paint.', fx: { fwOrg: 10, skill: { melee: 2 } } },
          lose: { r: 'You fail, and you sweep, and you learn the hall very well.', fx: { fwOrg: 2, health: -4 } } },
        { t: 'Help a weaker student through', r: 'He passes. You pass too, at the bottom.', fx: { fwOrg: 4, happy: 2 } },
        { t: 'Skip it and drill alone', r: 'You get better. Nobody at the hall notices.', fx: { skill: { melee: 1 }, fwOrg: -2 } },
      ],
    },
    {
      id: 'fw_duty_spy', title: 'A man to be watched', w: 0.01, cool: 0,
      cond: (p, C) => C.adult(p) && C.flag(p, 'fw_org_spy'),
      setup: only,
      text: 'A message comes to you folded small: a man near {seat} is to be watched for a month, and nothing done. {head} wants to know who visits him.',
      choices: [
        { t: 'Watch the house yourself', check: { s: 'stealth', s2: 'intrigue', d: 45 },
          win: { r: 'Three visitors, one twice, always after the rain. You write it small.', fx: { fwOrg: 9 } },
          lose: { r: 'His servant sees you. You walk away with a split lip and nothing written.', fx: { fwOrg: 1, health: -6 } } },
        { t: 'Pay a servant in the house', r: 'She tells you a great deal, some of it true.', fx: { coin: -15, fwOrg: 5 } },
        { t: 'Report what you can guess', r: 'Nobody checks. This time.', fx: { fwOrg: 2, honor: -2 } },
      ],
    },
    {
      id: 'fw_duty_ring', title: 'New moon in the ring', w: 0.01, cool: 0,
      cond: (p, C) => C.adult(p) && C.flag(p, 'fw_org_ring'),
      setup: only,
      text: '{org} hold their bouts in the yard at {seat} at new moon. Your name is chalked against a man a head taller than you.',
      choices: [
        { t: 'Take the bout', check: { s: 'unarmed', s2: 'str', d: 45 },
          win: { r: 'You get under him and he goes over. The yard shouts your name wrong.', fx: { fwOrg: 9, fame: 3 } },
          lose: { r: 'He sits on you until you tap the sand.', fx: { fwOrg: 3, health: -8 } } },
        { t: 'Ask for a man your own size', r: 'They give you one, and watch you a little less.', fx: { fwOrg: 1, happy: -1 } },
        { t: 'Spend the night before with the old wrestlers', r: 'They teach you a grip that is not in any book.', fx: { skill: { unarmed: 1 }, fwOrg: 2 } },
      ],
    },
    {
      id: 'fw_duty_council', title: 'The spring question', w: 0.01, cool: 0,
      cond: (p, C) => C.adult(p) && C.flag(p, 'fw_org_council'),
      setup: only,
      text: '{head} calls the council at {seat}. The question is a raid in spring: who goes, who stays, and who pays for it.',
      choices: [
        { t: 'Speak for the raid', check: { s: 'persuasion', s2: 'command', d: 45 },
          win: { r: 'The ropes are tied your way. In spring, it will be your raid.', fx: { fwOrg: 8, fame: 2 } },
          lose: { r: 'They hear you out and vote the other way.', fx: { fwOrg: 2, happy: -2 } } },
        { t: 'Speak against it', r: 'The old men nod. The young ones remember your face.', fx: { fwOrg: 3, honor: 2 } },
        { t: 'Say nothing and count the votes', r: 'You know now who owes whom.', fx: { fwOrg: 4, skill: { intrigue: 1 } } },
      ],
    },
    {
      id: 'fw_duty_temple', title: 'The night watch', w: 0.01, cool: 0,
      cond: (p, C) => C.adult(p) && C.flag(p, 'fw_org_temple'),
      setup: only,
      text: 'It is your turn to keep the night at {seat}. {head} leaves you the lamp, the door and the rite.',
      choices: [
        { t: 'Keep the whole night awake', check: { s: 'wil', s2: 'faith', d: 45 },
          win: { r: 'The lamp never gutters. At dawn the eldest touches your forehead.', fx: { fwOrg: 8, piety: 3 } },
          lose: { r: 'You wake with the lamp out and the door open.', fx: { fwOrg: 2, health: -3 } } },
        { t: 'Share the watch with a novice', r: 'She talks all night. The rite is kept, more or less.', fx: { fwOrg: 3, happy: 1 } },
        { t: 'Sleep by the door', r: 'You sleep well. Somebody saw.', fx: { fwOrg: -3, health: 3 } },
      ],
    },
    {
      id: 'fw_duty_judge', title: 'A quarrel brought in', w: 0.01, cool: 0,
      cond: (p, C) => C.adult(p) && C.flag(p, 'fw_org_judge'),
      setup: only,
      text: 'Two families bring a quarrel to {seat}: a well, a boundary stone and a dead goat. {head} gives it to you to settle.',
      choices: [
        { t: 'Hear both sides to the end', check: { s: 'persuasion', s2: 'ins', d: 45 },
          win: { r: 'By evening they share the well and argue only about the goat.', fx: { fwOrg: 8, honor: 2 } },
          lose: { r: 'Both families leave angrier than they came.', fx: { fwOrg: 2, happy: -2 } } },
        { t: 'Split the difference', r: 'Nobody is pleased, which is the usual sign of justice.', fx: { fwOrg: 3 } },
        { t: 'Rule for the family with friends at court', r: 'Their friends remember. So does the other family.', fx: { fwOrg: 4, honor: -4, coin: 10 } },
      ],
    },
  ]);
})();
