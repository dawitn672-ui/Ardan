// Old age, part 3: grandchildren, the heir, being cared for or neglected, and the young who do not listen. The old
// had to arrange their own keep: a retirement contract with the heir (bed, board and a cloak a year, written before
// the manor court), or a corrody bought from an abbey. Both are chains: the contract comes back to be kept or broken.
(function () {
const OAkin = {
  gk: (id, f) => (p, ctx) => { const L = A.OA.grandkids(p).filter(f || (() => true)); A.OA.choose(p, ctx, L, id, 'oa', true); },
  kid: (id, f) => (p, ctx) => { const L = A.OA.adultKids(p).filter(f || (() => true)); A.OA.choose(p, ctx, L, id, 'oa', true); },
  op: (p, t) => (t && t.rel && t.rel[p.id] ? t.rel[p.id].op || 0 : 0),
};
A.defEvents([
  { id: 'oa_kin_namesake', title: 'Named for you',
    cond: (p, C) => C.old(p) && C.grandkids(p),
    w: 2, cool: 30, once: true,
    setup: OAkin.gk('oa_kin_namesake', g => A.age(g) <= 3),
    text: 'They bring the new baby to your door wrapped in a shawl you remember. {oa}, they have called {oahim}, and it takes you a moment to understand they mean for you. {oaHe} has your frown already, the mother says. You hold {oahim} badly, having forgotten how.',
    choices: [
      { t: 'Give the child your best thing', r: 'A ring, a knife, a cup: you press it into the shawl. The mother tries to give it back, and fails.', fx: { coinPct: -0.03, them: { op: 20 }, happy: 6 } },
      { t: 'Bless {oahim} at the church door', r: 'You say the old words over {oahim}, the ones your grandmother said over you. The priest pretends not to hear the pagan bits.', fx: { piety: 2, happy: 5, them: { op: 10 } } },
      { t: 'Say the name was a mistake', r: 'You tell them it will be a burden. They are hurt. The child is called by it anyway, and shortens it.', fx: { wil: 1, happy: -2, family: -1 } },
    ] },

  { id: 'oa_kin_lesson', title: 'Show me how',
    cond: (p, C) => C.old(p) && C.grandkids(p),
    w: 3, cool: 5,
    setup: (p, ctx) => {
      const L = A.OA.grandkids(p).filter(g => A.age(g) >= 6 && A.age(g) <= 16);
      const g = A.OA.choose(p, ctx, L, 'oa_kin_lesson', 'oa', true);
      if (!g) return;
      const best = Object.keys(GD.SKILLS).filter(k => (p.skills || {})[k] != null).sort((a, b) => A.skill(p, b) - A.skill(p, a))[0] || 'craft';
      ctx.oaSkill = GD.SKILLS[best].toLowerCase(); ctx.oaSk = best;
    },
    text: '{oa}, who is {oaage}, has been watching you work for a week with {oahis} chin on the bench. Today {oahe} asks to be shown. You were good at {oaSkill} once; you are still better than anyone {oahe} knows. Your patience is not what it was.',
    choices: [
      { t: 'Teach {oahim} properly, slowly, every day', r: 'Every afternoon for a season. {oaHe} is clumsy, then less clumsy, then quietly good.', fx: { them: { op: 15 }, need: { purpose: 10, rest: -4 }, happy: 3 } },
      { t: 'Teach the shortcuts and the tricks', check: { s: 'int', s2: 'ins', d: 45 },
        win: { r: '{oaHe} learns in a month what took you years, and shows off to the other children.', fx: { them: { op: 12 }, happy: 4, need: { purpose: 6 } } },
        lose: { r: 'The tricks without the ground under them. {oaHe} cuts {oahis} hand and loses heart.', fx: { them: { op: 4 }, happy: -2 } } },
      { t: 'Tell {oahim} to find a proper master', r: 'You were a hard learner and you would be a hard teacher. {oaHe} goes off to the smith\'s, sulking.', fx: { them: { op: -6 }, need: { rest: 6 } } },
    ] },

  { id: 'oa_kin_trouble', title: '{oa} in trouble',
    cond: (p, C) => C.old(p) && C.grandkids(p),
    w: 2, cool: 8,
    setup: OAkin.gk('oa_kin_trouble', g => A.age(g) >= 12 && A.age(g) <= 22),
    text: '{oa} turns up at your door after dark with a split lip, and will not go home. There was a fight at the fair, and a stall overturned, and the stallholder knows {oahis} face. {oaHis} parents will hear by morning. {oaHe} came to you first.',
    choices: [
      { t: 'Pay the stallholder and say nothing', r: 'You go to the stallholder at dawn with coin. The matter is closed. {oa} owes you, and knows it.', fx: { coin: -8, them: { op: 15 } } },
      { t: 'Walk {oahim} home and stand beside {oahim}', r: 'You stand beside {oahim} while {oahe} confesses. The parents are angry, and less angry with you there.', fx: { them: { op: 10 }, honor: 2, happy: -1 } },
      { t: 'Send {oahim} home to face it alone', r: 'You shut the door on {oahim}, gently. It is the hardest thing you have done this year.', fx: { them: { op: -10 }, wil: 1.5, honor: 1 } },
    ] },

  { id: 'oa_kin_wedding', title: 'A grandchild\'s wedding',
    cond: (p, C) => C.old(p) && C.grandkids(p),
    w: 2, cool: 6,
    setup: OAkin.gk('oa_kin_wedding', g => A.isAdult(g) && !g.spouse),
    text: '{oa} is to be married at midsummer, and you are to sit at the high table and be shown to the other family like a relic. They expect a gift. They also expect, though nobody says it, that you will not dance.',
    choices: [
      { t: 'Give a gift worth talking about', r: 'A good sum, in a purse, in front of the other family. {oa} kisses you. The other family recalculates.', fx: { coinPct: -0.06, them: { op: 18 }, fame: 1 } },
      { t: 'Dance, stiff knees and all', check: { s: 'sta', s2: 'wil', d: 45 },
        win: { r: 'One slow round with the bride. The hall claps. It is the best thing you do all year.', fx: { happy: 8, them: { op: 10 } } },
        lose: { r: 'Halfway round your knee goes. You finish the dance sitting down, which is a new figure.', fx: { happy: 2, health: -3, them: { op: 6 } } } },
      { t: 'Give advice instead of coin', r: 'You tell {oa} three true things about marriage. {oaHe} forgets two. The third will matter.', fx: { them: { op: 6 }, wil: 1, happy: 1 } },
    ] },

  { id: 'oa_kin_four', title: 'Four of you in a row',
    cond: (p, C) => C.old(p) && C.grandkids(p) && p.children.some(c => A.P(c) && A.P(c).children.some(g => A.P(g) && A.P(g).children.length)),
    w: 2, cool: 30, once: true,
    text: 'A painter at the fair sits four of your blood in a row on a bench: you, your child, a grandchild and a baby on the end, who will not keep still. Each face is a worn copy of the one before. He wants two suns for a likeness.',
    choices: [
      { t: 'Pay for the likeness', r: 'He paints fast and flatters nobody. It hangs over the hearth, and visitors play at telling who is who.', fx: { coin: -2, happy: 6, family: 1 } },
      { t: 'Make the young ones learn the line back', r: 'They recite it under protest: your father, his father, back to a man who kept bees. Some of it will stay.', fx: { happy: 3, need: { purpose: 6 }, wil: 1 } },
      { t: 'Let the baby have your seat and go home', r: 'You go home to bed at noon, which is your right. They paint three of them, and a gap.', fx: { need: { rest: 8 }, happy: -1 } },
    ] },

  { id: 'oa_kin_move_in', title: 'Come and live with us',
    cond: (p, C) => C.old(p) && C.heir(p) && !C.ruler(p),
    w: 2, cool: 10,
    setup: OAkin.kid('oa_kin_move_in'),
    text: '{oa} wants you to give up your house and come to live with {oahis} family: the room by the kitchen, your meals cooked, the children underfoot. It is kindly meant. It is also the end of your own door, your own fire, your own hour for supper.',
    choices: [
      { t: 'Go, and be grateful', r: 'You go. The room is warm and the children are loud, and nobody asks you what anything should cost.', fx: { need: { comfort: 10, company: 8, purpose: -8 }, them: { op: 10 }, honor: -1 } },
      { t: 'Stay in your own house while your legs hold', r: 'You stay. {oa} comes on Sundays and looks at your roof and says nothing about it.', fx: { wil: 1.5, need: { purpose: 6, comfort: -4 }, them: { op: -4 } } },
      { t: 'Have them move in with you instead', check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: 'They come to your house, under your rules. You are the master of a much louder household.', fx: { happy: 4, need: { company: 8 }, them: { op: 4 } } },
        lose: { r: 'They will not leave their own place. There is a coolness at table for a while.', fx: { them: { op: -6 }, happy: -2 } } },
    ] },

  { id: 'oa_kin_contract', title: 'Bed, board and a cloak a year',
    cond: (p, C) => C.old(p) && C.heir(p) && (C.poor(p) || p.status === 'artisan') && !C.flag(p, 'oa_contract'),
    w: 2, cool: 10, once: true,
    setup: OAkin.kid('oa_kin_contract'),
    text: 'It is time to hand the holding to {oa}, as everyone does. The custom is a contract before the manor court: the land to {oahim}, and to you a room with a fire, a measure of grain a quarter, a new cloak each midwinter and a seat at the table, for life.',
    choices: [
      { t: 'Have it written and sworn before the court', r: 'The steward writes it down: so much barley, so much fuel, the room by the chimney. {oa} swears to it.', fx: { coin: -3, need: { comfort: 6 }, them: { op: 6 }, flag: 'oa_contract', oa: { mark: 'contract', later: ['oa_kin_contract_after', 2, 5] } } },
      { t: 'Hand it over on a handshake, as family', r: 'No clerks between kin. {oa} takes your hand, and the land, and is moved.', fx: { them: { op: 14 }, honor: 1, flag: 'oa_contract', oa: { mark: 'trust', later: ['oa_kin_contract_after', 2, 5] } } },
      { t: 'Keep the holding till they bury you', r: 'You keep it. {oa} goes on working it for you, and waits, and does not say what {oahe} thinks of waiting.', fx: { wil: 1, them: { op: -10 }, need: { purpose: 6 } } },
    ] },

  { id: 'oa_kin_contract_after', title: 'What was promised',
    trigger: true,
    cond: (p, C) => C.old(p) && C.flag(p, 'oa_contract'),
    setup: (p, ctx) => {
      const t = ctx.pid && A.P(ctx.pid);
      if (!t || !t.alive) { ctx.skip = true; return; }
      A.OA.put(p, ctx, t, 'oa', true);
      ctx.oaKept = OAkin.op(p, t) >= 25 ? '1' : '';
    },
    text: p => (p.oa && p.oa.m && p.oa.m.contract != null
      ? 'The court roll says a measure of barley a quarter. '
      : 'There was no roll, only a handshake. ') + '{oa}\'s household has got used to having the land, and to having you. The barley this quarter is short, and there is a thin blanket on your bed where the promised cloak should be.',
    choices: [
      { t: 'Take {oahim} before the manor court', req: (p) => !!(p.oa && p.oa.m && p.oa.m.contract != null), check: { s: 'persuasion', s2: 'int', d: 40 },
        win: { r: 'The steward reads the roll aloud. {oa} pays the arrears and a fine, and will not look at you.', fx: { coin: 6, need: { comfort: 6 }, them: { op: -12 } } },
        lose: { r: 'The steward rules the barley was a hard year\'s barley. You go home with nothing but enemies at your own table.', fx: { them: { op: -15 }, happy: -4 } } },
      { t: 'Shame {oahim} at church, quietly', r: 'You wear the thin blanket to the temple as a cloak. By Sunday evening the cloak is at your door.', fx: { them: { op: -6 }, need: { comfort: 6 }, honor: -1 } },
      { t: 'Say nothing; it is a hard year for them too', r: 'You eat less and keep the peace. {oa} notices, and is ashamed, and is kinder after.', fx: { health: -2, them: { op: 10 }, wil: 1 } },
    ] },

  { id: 'oa_kin_neglect', title: 'Nobody has come',
    cond: (p, C) => C.old(p) && C.hasKids(p),
    w: 2, cool: 8,
    setup: (p, ctx) => { const L = A.OA.adultKids(p).filter(k => OAkin.op(p, k) < 25); A.OA.choose(p, ctx, L, 'oa_kin_neglect', 'oa', true); },
    text: '{oa} has not been to see you since the spring fair, though {oahe} lives a morning\'s walk away. You hear news of {oahim} from the carter: a new roof, a good harvest, a fine new hat. The carter is very kind about it, which you mind more.',
    choices: [
      { t: 'Walk over there yourself', check: { s: 'sta', s2: 'persuasion', d: 45 },
        win: { r: 'You arrive at supper. {oa} is ashamed, and glad, and puts you in the best seat.', fx: { them: { op: 15 }, happy: 4, health: -1 } },
        lose: { r: 'You arrive tired and cross and say the wrong thing at the door. It is a short visit.', fx: { them: { op: -5 }, health: -2, happy: -2 } } },
      { t: 'Send a sharp letter by the carter', r: 'You say exactly what you think. {oa} comes the next week, stiffly, and stays an hour.', fx: { them: { op: -4 }, wil: 1, need: { company: 4 } } },
      { t: 'Make friends of your neighbours instead', r: 'If your own will not come, others will. You feed the lane\'s children and they visit for the cake.', fx: { coin: -3, need: { company: 8 }, them: { op: -4 } } },
    ] },

  { id: 'oa_kin_cared', title: 'Broth every morning',
    cond: (p, C) => C.old(p) && C.hasKids(p),
    w: 2, cool: 8,
    setup: (p, ctx) => { const L = A.OA.adultKids(p).filter(k => OAkin.op(p, k) >= 40); A.OA.choose(p, ctx, L, 'oa_kin_cared', 'oa', true); },
    text: '{oa} comes every morning with broth and every evening to bank the fire, and in between does {oahis} own work and raises {oahis} own children. {oaHe} is tired. You can see it in how {oahe} sits down. {oaHe} would never say so.',
    choices: [
      { t: 'Tell {oahim} to come every other day', r: '{oaHe} argues, and then gives in. On the free days you burn the broth yourself, cheerfully.', fx: { them: { op: 8 }, need: { comfort: -4, purpose: 4 }, health: -1 } },
      { t: 'Pay a girl from the village to help', r: 'You pay a girl to come mornings. {oa} is offended for a week and grateful for the rest of the year.', fx: { coin: -8, them: { op: 10 }, need: { comfort: 4 } } },
      { t: 'Thank {oahim} properly, once, and mean it', r: 'You say it plainly at the door. {oaHe} has to go outside for a while.', fx: { them: { op: 15 }, happy: 3 } },
    ] },

  { id: 'oa_kin_quarrel', title: 'Over your head',
    cond: (p, C) => C.old(p) && C.hasKids(p) && p.children.filter(c => A.P(c) && A.P(c).alive && A.isAdult(A.P(c))).length >= 2,
    w: 2, cool: 10,
    setup: (p, ctx) => {
      const L = A.OA.adultKids(p);
      if (L.length < 2) { ctx.skip = true; return; }
      A.OA.put(p, ctx, L[0], 'oa', true); A.OA.put(p, ctx, L[L.length - 1], 'oaB');
    },
    text: '{oa} and {oaB} are quarrelling about what happens to the house when you die, in the yard, where you can hear every word. Neither seems to think you are listening, or alive in any way that counts. {oaB} wants the orchard. {oa} wants everything.',
    choices: [
      { t: 'Go out and settle it now, out loud', check: { s: 'diplomacy', s2: 'wil', d: 50 },
        win: { r: 'The house to {oa}, the orchard to {oaB}, and both of them silent. You are still the head of this family.', fx: { honor: 2, wil: 1, them: { op: 4 } } },
        lose: { r: 'They both turn on you. You go back inside with your ears burning.', fx: { happy: -4, them: { op: -8 } } } },
      { t: 'Bang on the shutter and say you are not dead yet', r: 'The yard goes very quiet. They are polite to you for a month.', fx: { happy: 2, them: { op: -4 } } },
      { t: 'Let them fight; it will keep them visiting', r: 'They come more often now, separately, to make their case. You eat well.', fx: { need: { company: 8 }, honor: -1, happy: 1 } },
    ] },

  { id: 'oa_kin_leaving', title: 'Off to the city',
    cond: (p, C) => C.old(p) && C.grandkids(p),
    w: 2, cool: 6,
    setup: OAkin.gk('oa_kin_leaving', g => A.age(g) >= 14 && A.age(g) <= 24),
    text: '{oa} is going to {capital}, with a bundle and a letter to a cousin of a cousin. {oaHis} parents have given up arguing. {oaHe} has come to you last, and stands in the door with the light behind {oahim}, already halfway down the road.',
    choices: [
      { t: 'Give {oahim} your purse', r: 'All of it, or near enough. {oaHe} protests, then counts it on the road when {oahe} thinks you are not looking.', fx: { coinPct: -0.05, them: { op: 15 }, happy: 2 } },
      { t: 'Tell {oahim} what the city did to you', r: 'Every cheat you met, every lie you were told. {oaHe} laughs. Some of it will save {oahim}.', fx: { them: { op: 6 }, wil: 1, need: { purpose: 4 } } },
      { t: 'Forbid it, as head of the family', check: { s: 'intimidation', s2: 'wil', d: 55 },
        win: { r: '{oaHe} stays, furious. In a year {oahe} is glad, or says so.', fx: { them: { op: -6 }, honor: 1 } },
        lose: { r: '{oaHe} goes anyway, without your blessing, and does not write.', fx: { them: { op: -15 }, happy: -4 } } },
    ] },

  { id: 'oa_kin_alone', title: 'Who will look after you',
    cond: (p, C) => C.old(p) && !C.hasKids(p) && !C.married(p) && !C.ruler(p),
    w: 3, cool: 10,
    text: 'You have no child to bring you broth, and nobody at all to bank your fire on a bad night. The priest has noticed. He mentions, gently, that old people without kin often die in the snow in February, and are found in March.',
    choices: [
      { t: 'Take in a poor widow as a housekeeper', r: 'She comes with a goat and a sharp tongue, and keeps you alive out of what seems like spite.', fx: { coin: -6, need: { company: 8, comfort: 6 }, happy: 1 } },
      { t: 'Foster an orphan and raise them to it', r: 'A boy of nine from the parish, all elbows. He will owe you a home in ten years. If you last that long.', fx: { coin: -4, newRel: { type: 'friend', op: 30 }, need: { purpose: 10, rest: -4 } } },
      { t: 'Manage alone, as you always have', r: 'You stack the wood higher and sleep in your boots. February comes. You see March.', fx: { wil: 1.5, health: -2 } },
    ] },

  { id: 'oa_kin_corrody', title: 'A corrody',
    cond: (p, C) => C.old(p) && !C.ruler(p) && !C.flag(p, 'oa_corrody') && (C.rich(p) || p.coin >= 60),
    w: 2, cool: 12, once: true,
    text: 'The cellarer of the abbey has a proposal: pay down a sum now, and the abbey will keep you for life. A room in the guest range, a loaf and a gallon of ale a day, a place at the fire, a monk to read to you. Many do it. The abbey does well out of those who live short.',
    choices: [
      { t: 'Buy the corrody', r: 'The cellarer counts your money with a holy face. You move in at Michaelmas with a chest and a dog.', fx: { coinPct: -0.25, need: { comfort: 10, purpose: -6 }, health: 4, flag: 'oa_corrody', oa: { later: ['oa_kin_corrody_life', 1, 3] } } },
      { t: 'Haggle the sum down', check: { s: 'trade', s2: 'int', d: 50 },
        win: { r: 'He agrees to a smaller sum, betting on your cough. You intend to disappoint him.', fx: { coinPct: -0.15, need: { comfort: 8 }, flag: 'oa_corrody', oa: { later: ['oa_kin_corrody_life', 1, 3] } } },
        lose: { r: 'He looks at your colour and raises it. You walk out.', fx: { happy: -3 } } },
      { t: 'Keep your money and your door', r: 'You thank him and go home to your own cold house, your own bad ale, your own hour for bed.', fx: { wil: 1, need: { purpose: 4 } } },
    ] },

  { id: 'oa_kin_corrody_life', title: 'Living on the abbey',
    trigger: true,
    cond: (p, C) => C.old(p) && C.flag(p, 'oa_corrody'),
    text: 'You have been at the abbey long enough to know which monk waters the ale and which one snores through matins. The cellarer looks at you each morning as at a debt that will not fall due. You are, you realise, enjoying yourself.',
    choices: [
      { t: 'Complain to the abbot about the ale', check: { s: 'persuasion', s2: 'wil', d: 45 },
        win: { r: 'The ale improves. The cellarer\'s face does not. The other corrodians treat you as their captain.', fx: { happy: 4, need: { comfort: 6 }, fame: 1 } },
        lose: { r: 'The abbot reminds you that the contract says ale, not good ale.', fx: { happy: -3 } } },
      { t: 'Make yourself useful in the scriptorium', r: 'You sharpen quills and grind ink and correct the novices\' sums. They hate you, and learn.', fx: { int: 1, need: { purpose: 10 }, piety: 1 } },
      { t: 'Live long, out of spite', r: 'You eat every loaf owed you and ask for more. The cellarer prays for you, sincerely, and impatiently.', fx: { health: 4, wil: 1, piety: -1 } },
    ] },

  { id: 'oa_kin_young_deaf', title: 'They will not listen',
    cond: (p, C) => C.old(p) && C.youngFolk(p),
    w: 3, cool: 6,
    setup: (p, ctx) => { A.OA.choose(p, ctx, A.OA.young(p), 'oa_kin_young_deaf', 'oa', true); },
    text: 'You told {oa} plainly that the beam would not take the weight, that the man selling the mule was a cheat, that the river would rise. {oaHe} nodded and smiled and patted your hand and did it anyway. The mule has died. The beam is next.',
    choices: [
      { t: 'Say it again, louder', check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: 'This time {oahe} listens, sulkily. The beam is propped. Nobody thanks you, which is how you know it worked.', fx: { them: { op: 4 }, honor: 2 } },
        lose: { r: '{oaHe} stops visiting rather than hear it a third time.', fx: { them: { op: -10 }, happy: -2 } } },
      { t: 'Prop the beam yourself, at night', r: 'You prop it with a post and say nothing. When it holds through the storm you say nothing then too.', fx: { health: -1, them: { op: 6 }, wil: 1 } },
      { t: 'Let {oahim} learn as you did', r: 'You were young once, and nobody could tell you either. The beam comes down in March. Nobody is under it.', fx: { wil: 1, them: { op: 2 }, happy: -1 } },
    ] },

  { id: 'oa_kin_young_ask', title: 'Asking the old',
    cond: (p, C) => C.old(p) && C.youngFolk(p),
    w: 3, cool: 6,
    setup: (p, ctx) => {
      const t = A.OA.choose(p, ctx, A.OA.young(p), 'oa_kin_young_ask', 'oa', true);
      if (!t) return;
      ctx.oaQ = A.OA.hp(['whether to marry the miller\'s widow, who is rich and has a temper', 'whether to take a debt to buy a second cow', 'whether to go for a soldier', 'whether to forgive a brother who cheated {oahim}'], 'q', p.id, t.id, A.S.year).replace('{oahim}', ctx.oahim);
    },
    text: '{oa} has come to ask you {oaQ}. Nobody else will give {oahim} a straight answer, {oahe} says, and you are old, so you must know. You do not know. You do have an opinion, which at your age is a kind of knowing.',
    choices: [
      { t: 'Give a straight answer', check: { s: 'ins', s2: 'int', d: 45 },
        win: { r: '{oaHe} does as you say, and it goes well, and {oahe} tells people. More of the young come to your door.', fx: { them: { op: 12 }, fame: 1, need: { purpose: 8 } } },
        lose: { r: '{oaHe} does as you say, and it goes badly, and {oahe} tells people that too.', fx: { them: { op: -8 }, happy: -3 } } },
      { t: 'Ask questions until {oahe} answers it {oahim}self', r: 'An hour of questions. {oaHe} leaves cross and certain. It is {oahis} answer, at least.', fx: { them: { op: 6 }, wil: 1, need: { company: 4 } } },
      { t: 'Tell {oahim} what you did, and what came of it', r: 'Your own story, warts and all. {oaHe} learns more about you than {oahe} asked for.', fx: { them: { op: 8 }, happy: 2, honor: -1 } },
    ] },
]);
})();
