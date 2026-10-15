// Starting stories: the opening scene of each of the 20 starts (forced at birth), and the callback that reads what you
// chose, five to fifteen years on. Each opening sets st_<id>_<choice>; each callback reads it with C.flag.
(function () {
const since = (p, f) => (p.flags && p.flags[f] != null ? A.S.year - p.flags[f] : -1);
const story = (p, id, n) => p.flags && p.flags['st_' + id] != null && since(p, 'st_' + id) >= n;
const beastName = () => { const id = A.S.story && A.S.story.beast, c = id && LORE.creatures.find(x => x.id === id); return c ? c.name.replace(/^The /, '') : null; };

A.defEvents([
  // ---- 1. The Bailiff's Ledger (Ashmere, serf)
  { id: 'st_serf_open', title: "The Bailiff's Ledger", trigger: true,
    cond: (p, C) => C.flag(p, 'st_serf'),
    text: 'Yesterday the bailiff struck your mother for a short measure of barley, and you struck him back. He is alive. He has a long memory and a longer ledger. The reeve says the manor court sits at the new moon.',
    choices: [
      { t: 'Run before the new moon', r: 'You go at night with bread and a knife. Behind you, someone writes your name in the ledger as fled.', fx: { flag: 'st_serf_ran', happy: -2 } },
      { t: 'Stand before the court', check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: 'The steward fines you a season of labour and laughs at the bailiff, which is worse for you than the fine.', fx: { flag: 'st_serf_stood', wil: 1 } },
        lose: { r: 'Twelve strokes in the yard, and your name in the ledger in red ink.', fx: { flag: 'st_serf_stood', health: -10, happy: -4 } } },
      { t: 'Go to the bailiff and kneel', r: 'He makes you kneel in the mud of his yard until the bell. He lets it go. He does not forget it.', fx: { flag: 'st_serf_knelt', honor: -1 } },
    ] },
  { id: 'st_serf_echo', title: 'A page in the ledger', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_serf') && story(p, 'serf', 6) && (C.flag(p, 'st_serf_ran') || C.flag(p, 'st_serf_stood') || C.flag(p, 'st_serf_knelt')),
    text: p => `A man with the old bailiff's chin stops you in the road. His father is dead, he says, and the ledger came to him. He has read it through. Your page is still in it${p.flags.st_serf_ran != null ? ', marked fled' : ''}.`,
    choices: [
      { t: 'Ask what it costs to tear the page out', r: 'More than it should. He tears it out in front of you and hands it over, still warm from his coat.', fx: { coin: -40, flag: 'st_serf_page_bought', happy: 3 } },
      { t: 'Tell him you are not that person now', check: { s: 'intimidation', s2: 'wil', d: 45 },
        win: { r: 'He looks at you a while, then at your hands. He closes the book.', fx: { wil: 1, flag: 'st_serf_faced' } },
        lose: { r: 'He smiles, writes something in the margin, and walks on.', fx: { happy: -3, flag: 'st_serf_faced' } } },
      { t: 'Ask how his father died', r: 'Badly, he says, and slowly, and alone. You find that you do not feel what you expected to.', fx: { happy: 1 } },
    ] },

  // ---- 2. No Land for a Second Son (Varenna)
  { id: 'st_second_son_open', title: 'No Land for a Second Son', trigger: true,
    cond: (p, C) => C.flag(p, 'st_second_son'),
    text: 'The will is read in the hall. The land goes to your brother, the silver to the church, and to you a grey horse, your father\'s second sword and his blessing, which the priest reads out in full. Your brother does not look at you.',
    choices: [
      { t: 'Ride out to take service with a lord', r: 'You are gone by noon. The horse knows the road better than you do.', fx: { flag: 'st_second_son_rode', skill: { riding: 2 } } },
      { t: 'Ask your brother for a stewardship', r: 'He gives you the worst manor, on the marsh edge, and makes it sound like a gift.', fx: { flag: 'st_second_son_steward', skill: { stewardship: 2 } } },
      { t: 'Contest the will before the bishop', check: { s: 'persuasion', s2: 'int', d: 55 },
        win: { r: 'The bishop finds a clause about a mill. It is small, and it is yours, and your brother will never forgive it.', fx: { flag: 'st_second_son_contested', coin: 60 } },
        lose: { r: 'The bishop finds for your brother, and charges you for his time.', fx: { flag: 'st_second_son_contested', coin: -20, happy: -3 } } },
    ] },
  { id: 'st_second_son_echo', title: "Your brother's letter", w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_second_son') && story(p, 'second_son', 7),
    text: p => `A letter comes in your brother's hand, which you have not seen in years. ${p.flags.st_second_son_contested != null ? 'He has not forgotten the mill. ' : ''}The harvest has failed twice and the house is in debt. He does not ask for anything. He takes two pages not to ask.`,
    choices: [
      { t: 'Send what silver you can spare', r: 'You send it without a letter. He sends none back. The next year the debt is paid.', fx: { coin: -40, family: 2, flag: 'st_second_son_helped' } },
      { t: 'Ride home and see it for yourself', r: 'The hall is smaller than you remember. So is he. You stay a month and say most of what you came to say.', fx: { family: 1, happy: 2, flag: 'st_second_son_went_home' } },
      { t: 'Keep the letter and do nothing', r: 'You read it again on bad nights. It does not get easier to read.', fx: { wil: 1, flag: 'st_second_son_ignored' } },
    ] },

  // ---- 3. The Carved Debt (Stonehold, dwarf)
  { id: 'st_debt_stone_open', title: 'The Carved Debt', trigger: true,
    cond: (p, C) => C.flag(p, 'st_debt_stone'),
    text: 'Your grandfather borrowed against the family forge and died before he paid. In Stonehold a debt is cut into the hall\'s debt-stone, where everyone passes it. Below his name, the carver has left a clean space. It is the right width for yours.',
    choices: [
      { t: 'Swear before the stone to pay it in work', r: 'The Masters witness it. You will work the forge for a creditor for seven years, and nobody will speak of it after.', fx: { flag: 'st_debt_stone_sworn', honor: 2, skill: { craft: 2 } } },
      { t: 'Wager it all on one masterwork', check: { s: 'craft', s2: 'sta', d: 55 },
        win: { r: 'The creditor turns the blade in the light for a long time and accepts it as full payment. The carver cuts a line through the debt.', fx: { flag: 'st_debt_stone_paid', fame: 2 } },
        lose: { r: 'A flaw in the quench. The creditor keeps the blade as interest.', fx: { flag: 'st_debt_stone_failed', happy: -4 } } },
      { t: 'Leave the hold before your name is cut', r: 'You go out by the trade gate with your tools. Somewhere behind you a carver is sharpening his chisel.', fx: { flag: 'st_debt_stone_left', honor: -2 } },
    ] },
  { id: 'st_debt_stone_echo', title: 'The stone again', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_debt_stone') && story(p, 'debt_stone', 8),
    text: p => p.flags.st_debt_stone_left != null
      ? 'A dwarf trader brings word from Stonehold. Your name was cut into the debt-stone after all, the year you left, and children are taught to spit at it. He says it neutrally.'
      : 'You pass the debt-stone on a feast day. The line for your family has been cut through, as debts are when they are paid. A child asks you what it says, and waits.',
    choices: [
      { t: 'Tell the truth of it', r: 'You tell it plainly. It takes less time than you thought it would.', fx: { honor: 1, happy: 1 } },
      { t: 'Send silver to have the line cut through', r: 'The silver goes back with the trader. A year later a carver you will never meet does the work.', fx: { coin: -60, honor: 2, flag: 'st_debt_stone_cleared' } },
      { t: 'Walk on without a word', r: 'Some stones you only pass.', fx: { wil: 1 } },
    ] },

  // ---- 4. Clanless (Tusk Clans, orc)
  { id: 'st_clanless_open', title: 'Clanless', trigger: true,
    cond: (p, C) => C.flag(p, 'st_clanless'),
    text: 'At the river fight you had a Drevnan boy under your knee and let him run. The War-Mother saw it. This morning the clan broke your spear across the fire and said your name for the last time. The steppe is very wide.',
    choices: [
      { t: 'Ride east to find another clan', r: 'The Ironhide will not have you. The third clan you try needs someone to dig latrines, and does not ask questions.', fx: { flag: 'st_clanless_east', sta: 1 } },
      { t: 'Go west, after the boy you spared', r: 'You do not know why. You follow the river toward Drevna and its towns, which smell of smoke and bread.', fx: { flag: 'st_clanless_west' } },
      { t: 'Stay at the edge of the camp and wait', check: { s: 'wil', s2: 'sta', d: 55 },
        win: { r: 'On the ninth day the War-Mother sends out a bowl of meat, without a word. It is not forgiveness. It is not nothing.', fx: { flag: 'st_clanless_waited', wil: 2 } },
        lose: { r: 'On the ninth day they move the camp, and leave you the ashes.', fx: { flag: 'st_clanless_waited', health: -8, happy: -4 } } },
    ] },
  { id: 'st_clanless_echo', title: 'The boy from the river', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_clanless') && story(p, 'clanless', 5),
    text: 'A Drevnan man with a scar through one eyebrow stops in front of you at a horse fair and does not move. It takes you a moment. The last time you saw that face, it was under your knee.',
    choices: [
      { t: 'Clasp his arm', r: 'He buys you a drink and tells his friends you are the reason he has children. They do not know what to make of you.', fx: { happy: 4, flag: 'st_clanless_met' } },
      { t: 'Ask whether it was worth it', r: '"I am alive," he says. "I did not ask what it cost you." He looks ashamed. You let him go again.', fx: { wil: 1, flag: 'st_clanless_met' } },
      { t: 'Turn and walk away', r: 'He calls after you once. You keep walking. It is the second time you have let him go.', fx: { honor: 1 } },
    ] },

  // ---- 5. The Last Tree of Your Line (Sylvaran, elf)
  { id: 'st_last_tree_open', title: 'The Last Tree of Your Line', trigger: true,
    cond: (p, C) => C.flag(p, 'st_last_tree'),
    text: 'The beech your ancestors went into at death has a black wound in the bark that weeps in the mornings. The singers have tried three saplings from it. None has taken. Your mother says that when it falls, your line has nowhere to go.',
    choices: [
      { t: 'Seek a healer of trees in the old groves', r: 'It is a long walk and the healer is very old. She gives you a clay pot and instructions in a dialect you half understand.', fx: { flag: 'st_last_tree_healer', skill: { husbandry: 2 } } },
      { t: 'Cut a scion and carry it away to plant', r: 'You wrap it in wet moss and leave before anyone can forbid it.', fx: { flag: 'st_last_tree_scion' } },
      { t: 'Accept it, as the Covenant teaches', r: 'Everything returns. You sit with the tree in the evenings, which is what can be done.', fx: { flag: 'st_last_tree_accepted', piety: 4 } },
    ] },
  { id: 'st_last_tree_echo', title: 'What grew', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_last_tree') && story(p, 'last_tree', 10),
    text: p => p.flags.st_last_tree_scion != null || p.flags.st_last_tree_healer != null
      ? 'A letter in your mother\'s spare hand: something has come up in the place you tended. It is crooked and pale and it is alive. She does not say she was wrong. She says come and see.'
      : 'The beech came down in a spring storm. Your mother writes that the singers sang for a whole night, and that a sapling no one planted has come up in the hollow of the stump.',
    choices: [
      { t: 'Go home and see it', r: 'You kneel by it a long while. It is the size of your hand. It is enough.', fx: { happy: 6, family: 2, flag: 'st_last_tree_saw' } },
      { t: 'Write that you will come next year', r: 'You mean it when you write it.', fx: { happy: 1 } },
    ] },

  // ---- 6. Born Under the Articles (Blackreef)
  { id: 'st_articles_open', title: 'Born Under the Articles', trigger: true,
    cond: (p, C) => C.flag(p, 'st_articles'),
    text: 'Your mother sailed eleven years with the Black Gull and died with a full share owed her. The Articles say a share passes to blood. The quartermaster says the Articles say no such thing, and the ship sails at the turn of the tide.',
    choices: [
      { t: 'Read the Articles aloud on the dock', check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: 'The crew listen. The quartermaster pays, in front of them all, and smiles at you in a way you will remember.', fx: { flag: 'st_articles_paid', coin: 80 } },
        lose: { r: 'They laugh, and the ship sails. Someone throws you a copper from the rail.', fx: { flag: 'st_articles_cheated', happy: -3 } } },
      { t: 'Sign on to the same ship', r: 'If the share will not come to you, you will go to it. The quartermaster writes your name very carefully.', fx: { flag: 'st_articles_signed', skill: { sea: 3 } } },
      { t: 'Let it go and find honest work', r: 'There is not much honest work in Blackreef. There is some.', fx: { flag: 'st_articles_honest', honor: 1 } },
    ] },
  { id: 'st_articles_echo', title: 'The quartermaster', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_articles') && story(p, 'articles', 6),
    text: 'The quartermaster of the Black Gull is in a cell under the harbour tower, waiting to hang for stealing shares. He asks for you by name. He says he has something of your mother\'s.',
    choices: [
      { t: 'Go and hear him', r: 'It is her knife, and a list of the shares he took from the dead. Hers is the first line. You take both.', fx: { flag: 'st_articles_list', happy: 2 } },
      { t: 'Go to watch him hang', r: 'You stand at the front. He looks for you, and finds you, and that is all.', fx: { wil: 1 } },
      { t: 'Stay away', r: 'You hear the bell from the harbour while you work.' },
    ] },

  // ---- 7. The Temple's Child (Solenne)
  { id: 'st_foundling_open', title: "The Temple's Child", trigger: true,
    cond: (p, C) => C.flag(p, 'st_foundling'),
    text: 'You were found on the temple steps in a good wool blanket, with a gold ring on a cord. The priests raised you, taught you letters and kept the ring in a box. Today the old sacristan gives you the box, and says you are old enough.',
    choices: [
      { t: 'Ask the sacristan what he knows', r: 'Only that the blanket was dyed in a colour the poor do not buy, and that a carriage was heard in the night.', fx: { flag: 'st_foundling_asked' } },
      { t: 'Take the ring to a goldsmith', r: 'The goldsmith turns it, finds a mark inside the band, and says he would rather not say whose. You pay him twice to say it.', fx: { flag: 'st_foundling_mark', coin: -10 } },
      { t: 'Put it back in the box', r: 'The temple is the only family you know. You leave the box on the sacristan\'s table.', fx: { flag: 'st_foundling_kept', piety: 3 } },
    ] },
  { id: 'st_foundling_echo', title: 'The ring', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_foundling') && story(p, 'foundling', 6),
    text: 'A woman in grey, with good shoes and no servant, waits for you after the evening rite. She has your ring\'s mark on her own hand. She says she has looked for you for a long time, and that she cannot stay.',
    choices: [
      { t: 'Ask her plainly who you are', r: 'She tells you a house and a name and a reason. Then she goes, as she said she would.', fx: { flag: 'st_foundling_told', happy: 2 } },
      { t: 'Tell her you already have a family', r: 'She nods as if she expected it, and presses a purse on you anyway.', fx: { coin: 40, piety: 2, flag: 'st_foundling_refused' } },
      { t: 'Walk her to the gate and say nothing', r: 'At the gate she touches your face once. It is enough to remember.', fx: { happy: 3 } },
    ] },

  // ---- 8. The Widow's Books (Lucerna)
  { id: 'st_widow_open', title: "The Widow's Books", trigger: true,
    cond: (p, C) => C.flag(p, 'st_widow'),
    text: 'Your husband\'s partners come in good coats, with their condolences and a paper. They will take the business off your hands for a fair sum, they say. You kept his books for six years. You know what a fair sum is.',
    choices: [
      { t: 'Show them the books and name the real figure', check: { s: 'trade', s2: 'int', d: 50 },
        win: { r: 'They pay it. On the stairs one of them says something to the other about your husband having married well.', fx: { flag: 'st_widow_sold', coin: 200 } },
        lose: { r: 'They pay their figure and leave you a copy of the paper, which you burn.', fx: { flag: 'st_widow_sold', coin: 90, happy: -3 } } },
      { t: 'Refuse, and run the business yourself', r: 'They are polite about it. Within the month two of your suppliers stop answering letters.', fx: { flag: 'st_widow_kept', skill: { trade: 3 } } },
      { t: 'Sign, and be done with it', r: 'You sign. It is less than it should be, and more than nothing, and it is over.', fx: { flag: 'st_widow_signed', coin: 90 } },
    ] },
  { id: 'st_widow_echo', title: 'The old partners', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_widow') && story(p, 'widow', 6),
    text: p => p.flags.st_widow_kept != null
      ? 'One of your husband\'s old partners comes to you, without his coat, asking for credit. His house has failed. He says he always knew you would make something of it.'
      : 'You see your husband\'s name painted over above a shop that is doing well. One of the old partners is at the door, and raises his hat to you.',
    choices: [
      { t: 'Be gracious', r: 'It costs you little and he will tell the story for years. Most of it will be true.', fx: { honor: 1, fame: 1 } },
      { t: 'Remind him of the paper', r: 'He goes red to the ears. You enjoy that more than you should.', fx: { happy: 3 } },
    ] },

  // ---- 9. The Smallest in the Hall (Frostholm, giant)
  { id: 'st_smallest_open', title: 'The Smallest in the Hall', trigger: true,
    cond: (p, C) => C.flag(p, 'st_smallest'),
    text: 'You are the smallest born in the hall in three generations: a head shorter than your cousins. The eldest has decided you will keep the hall\'s accounts with the human traders in the low valleys, since they will not be afraid of you.',
    choices: [
      { t: 'Go down to the valleys and learn the trade', r: 'The humans are afraid of you anyway. That is useful.', fx: { flag: 'st_smallest_trade', skill: { trade: 2 } } },
      { t: 'Challenge your largest cousin to the stone-lift', check: { s: 'str', s2: 'wil', d: 55 },
        win: { r: 'You lift it. He lifts it too, but by then the hall has seen what it needed to see.', fx: { flag: 'st_smallest_lifted', fame: 2 } },
        lose: { r: 'You cannot lift it. Nobody laughs, which is worse.', fx: { flag: 'st_smallest_failed', happy: -4 } } },
    ] },
  { id: 'st_smallest_echo', title: 'The eldest sends for you', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_smallest') && story(p, 'smallest', 8),
    text: 'The eldest of the hall is dying and sends for you, not for your cousins. She wants the accounts read to her, all of them, from the year you began. It will take three days.',
    choices: [
      { t: 'Read them all', r: 'On the third day she says, "Good," and nothing else, and dies before the evening meal.', fx: { family: 2, wil: 1, flag: 'st_smallest_read' } },
      { t: 'Tell her what they mean instead', r: 'She listens with her eyes closed. When you are done she says you should have been born larger, and that she is glad you were not.', fx: { happy: 4, flag: 'st_smallest_read' } },
    ] },

  // ---- 10. The Horse You Were Not Given (Nine Winds)
  { id: 'st_horse_open', title: 'The Horse You Were Not Given', trigger: true,
    cond: (p, C) => C.flag(p, 'st_horse'),
    text: 'At the spring gathering every youth of sixteen was given a horse by the tribe. Your name was not called. Your uncle says it was a mistake. Your mother says it was not, and will not say why.',
    choices: [
      { t: 'Catch a wild horse of your own', check: { s: 'riding', s2: 'sta', d: 55 },
        win: { r: 'It takes eleven days and most of your skin. She is ugly and fast and she bites everyone but you.', fx: { flag: 'st_horse_caught', skill: { riding: 3 } } },
        lose: { r: 'The horse wins. You walk back with a broken finger and a great deal of dignity.', fx: { flag: 'st_horse_failed', health: -6 } } },
      { t: 'Ask the khan\'s steward why', r: 'He looks at a list, then at you, then at the list again. "Your father\'s debt," he says. You did not know you had a father with debts.', fx: { flag: 'st_horse_asked' } },
      { t: 'Walk, and let them watch you walk', r: 'You walk the whole migration. By the end, the ones who laughed have stopped.', fx: { flag: 'st_horse_walked', sta: 2, wil: 1 } },
    ] },
  { id: 'st_horse_echo', title: 'A horse at the gathering', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_horse') && story(p, 'horse', 5),
    text: 'At this year\'s gathering, a youth of sixteen is passed over when the horses are given. You see the face. You have worn it.',
    choices: [
      { t: 'Give the youth a horse of yours', r: 'You do it in front of everyone. The steward writes something down. You do not care what.', fx: { coin: -30, fame: 2, flag: 'st_horse_gave' } },
      { t: 'Find out why the name was not called', r: 'A debt, again. You pay it. Nobody needs to know who did.', fx: { coin: -40, honor: 2, flag: 'st_horse_paid' } },
      { t: 'Let it be; it made you', r: 'It did make you. You are not sure that is a reason.', fx: { wil: 1 } },
    ] },

  // ---- 11. The Letter in Your Mother's Box (Greyhaven, bastard)
  { id: 'st_letter_box_open', title: "The Letter in Your Mother's Box", trigger: true,
    cond: (p, C) => C.flag(p, 'st_letter_box'),
    text: 'Your mother kept a box under the floor. In it, wrapped in a stocking, is a letter in a great lord\'s hand, promising her marriage, and dated the spring before you were born. It is sealed with his ring.',
    choices: [
      { t: 'Take it to the lord\'s steward', r: 'The steward reads it twice and says he will place it before his lord. You never see the letter again. You are paid a pension, quietly, every quarter.', fx: { flag: 'st_letter_box_sold', coin: 60 } },
      { t: 'Keep it hidden, for the right day', r: 'You sew it into the lining of your coat. It is lighter than it should be.', fx: { flag: 'st_letter_box_kept' } },
      { t: 'Burn it', r: 'Your mother did not use it. You decide she had her reasons.', fx: { flag: 'st_letter_box_burned', wil: 1 } },
    ] },
  { id: 'st_letter_box_echo', title: 'The right day', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_letter_box') && story(p, 'letter_box', 7),
    text: p => p.flags.st_letter_box_kept != null
      ? 'The lord who wrote the letter is dead, and his heir is a sickly boy. A lawyer you have never met asks, very carefully, whether your mother left any papers.'
      : 'The lord who wrote the letter is dead. At the funeral his heir looks across the nave at you for a long moment, as if he knows your face from a mirror.',
    choices: [
      { t: 'Say nothing', r: 'You have lived without it this long.', fx: { wil: 1, flag: 'st_letter_box_silent' } },
      { t: 'Speak to the heir', check: { s: 'etiquette', s2: 'ins', d: 50 },
        win: { r: 'He knew. He has always known. He offers you a place in his household, which is more than either of you expected.', fx: { family: 2, flag: 'st_letter_box_welcomed' } },
        lose: { r: 'He calls for his guards. You are walked to the gate with great courtesy.', fx: { happy: -3 } } },
    ] },

  // ---- 12. The Scribe's Chain (Qadir, slave)
  { id: 'st_scribe_open', title: "The Scribe's Chain", trigger: true,
    cond: (p, C) => C.flag(p, 'st_scribe'),
    text: 'Your master cannot read, and signs whatever you put before him with a flourish he is proud of. On the table this morning is the paper for your sale, which he wants written fair. The ink is still wet on the pen.',
    choices: [
      { t: 'Write it fair, as you are told', r: 'You write your own sale in your best hand. The buyer admires it.', fx: { flag: 'st_scribe_obeyed', wil: 1 } },
      { t: 'Write your freedom instead, and let him sign', check: { s: 'deception', s2: 'wil', d: 55 },
        win: { r: 'He signs it with his flourish. You walk out of the house with the paper in your shirt and do not run until the corner.',
          fx: (p, ctx) => { delete p.flags.unfree; if (p.status === 'slave' || p.status === 'serf') p.status = 'peasant'; A.ach('freed'); A.applyFx(p, { flag: 'st_scribe_forged' }, ctx); return ' (You are free.)'; } },
        lose: { r: 'His wife reads. You did not know his wife reads.', fx: { flag: 'st_scribe_caught', health: -12, happy: -6 } } },
      { t: 'Spoil the paper so it must wait a day', r: 'An accident with the ink. A day is not much. It is a day.', fx: { flag: 'st_scribe_delayed' } },
    ] },
  { id: 'st_scribe_echo', title: 'The flourish', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_scribe') && story(p, 'scribe', 6),
    text: 'In a market you see your old master\'s flourish at the foot of a paper, nailed up for all to read. It is a sale of land, written badly by someone else. He has been cheated of half his fields.',
    choices: [
      { t: 'Read it aloud to the crowd', r: 'You read it slowly and well. The man who wrote it leaves the market before you finish.', fx: { fame: 1, flag: 'st_scribe_read' } },
      { t: 'Leave him to it', r: 'He signed what he was given. So did you, once.', fx: { wil: 1 } },
    ] },

  // ---- 13. After the Fever (Morhaven)
  { id: 'st_fever_open', title: 'After the Fever', trigger: true,
    cond: (p, C) => C.flag(p, 'st_fever'),
    text: 'The fever went through the village in a month. It took your family on a Tuesday, the priest on the Friday after. You are fourteen, alone in a house with the door marked, and the barley still standing in the field.',
    choices: [
      { t: 'Bring in the barley alone', r: 'It takes three weeks and you sleep in the field. In the spring, people from the next valley come to farm the empty houses, and find yours already working.', fx: { flag: 'st_fever_stayed', sta: 2, wil: 1 } },
      { t: 'Walk to the town and find work', r: 'Nobody in the town asks where you are from, which is a kindness, and nobody asks your name, which is not.', fx: { flag: 'st_fever_left' } },
      { t: 'Bury them properly first, all of them', r: 'It takes days. You do it well. You will never be afraid of the dead again.', fx: { flag: 'st_fever_buried', piety: 3, wil: 2 } },
    ] },
  { id: 'st_fever_echo', title: 'The empty village', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_fever') && story(p, 'fever', 10),
    text: 'You pass through the valley where you were born. New families live in the houses now, with new children. An old woman at the well asks whether you knew the people who lived here before.',
    choices: [
      { t: 'Tell her who they were', r: 'You tell her their names. She repeats them, to get them right.', fx: { happy: 3, flag: 'st_fever_named' } },
      { t: 'Say you were only passing', r: 'It is true now.', fx: { wil: 1 } },
    ] },

  // ---- 14. Both Sides of the River (Tessaria)
  { id: 'st_river_open', title: 'Both Sides of the River', trigger: true,
    cond: (p, C) => C.flag(p, 'st_river'),
    text: 'In the forty-fourth year of the war, your brother rides for Prince Andros across the river, and your father\'s house holds for the crown on this side. A letter comes from your brother asking you to meet him at the ford, alone, at night.',
    choices: [
      { t: 'Go to the ford alone', r: 'He is thinner. You talk until the frogs stop. He asks you to tell your father nothing, and you agree.', fx: { flag: 'st_river_met', family: 1 } },
      { t: 'Show the letter to your father', r: 'Your father reads it and puts it in the fire, and sends twelve men to the ford. They come back with nobody.', fx: { flag: 'st_river_told' } },
      { t: 'Burn the letter unopened next time', r: 'There is a next time, and a next. You burn every one.', fx: { flag: 'st_river_burned', wil: 1 } },
    ] },
  { id: 'st_river_echo', title: 'Across the river', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_river') && story(p, 'river', 6),
    text: p => `Word comes across the river that your brother is a prisoner of the crown, held at a fort two days from here${p.flags.st_river_told != null ? ', taken at a ford' : ''}. A guard at the fort owes your house a favour.`,
    choices: [
      { t: 'Call in the favour and get him out', check: { s: 'intrigue', s2: 'wil', d: 55 },
        win: { r: 'He walks out in a borrowed cloak and is across the river by dawn. He does not thank you. He does not need to.', fx: { family: 2, flag: 'st_river_freed' } },
        lose: { r: 'The guard is moved before you reach him. Your brother is still in the fort, and now someone knows you tried.', fx: { happy: -4, flag: 'st_river_tried' } } },
      { t: 'Visit him, and only visit', r: 'You bring bread and a blanket. You sit with him an hour and talk about your mother.', fx: { happy: 2, flag: 'st_river_visited' } },
      { t: 'Leave him to the crown\'s justice', r: 'He chose his side. You tell yourself so, often.', fx: { wil: 1, flag: 'st_river_left' } },
    ] },

  // ---- 15. Neither Tree nor Stone (Eldergrove, half-elf)
  { id: 'st_between_open', title: 'Neither Tree nor Stone', trigger: true,
    cond: (p, C) => C.flag(p, 'st_between'),
    text: 'Your elven grandmother will not say your name, because it is a human name. The human quarter says it wrong, on purpose. Today the harbour master offers you work on the docks, between the ships of both.',
    choices: [
      { t: 'Take the work on the docks', r: 'You are the only one there who can swear at both crews in their own tongue. It is a skill.', fx: { flag: 'st_between_docks', skill: { trade: 1, sea: 1 } } },
      { t: 'Ask your grandmother for an elven name', r: 'She is silent a long time. Then she says one, once, and goes inside.', fx: { flag: 'st_between_named', family: 2 } },
      { t: 'Take a new name of your own', r: 'You choose it on the harbour wall. Nobody says it wrong.', fx: { flag: 'st_between_own_name', wil: 2 } },
    ] },
  { id: 'st_between_echo', title: 'Your grandmother\'s tree', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_between') && story(p, 'between', 8),
    text: 'Your grandmother has gone into her tree. The singers ask whether you will stand with the family at the rite. Some of the family have asked the singers not to ask.',
    choices: [
      { t: 'Stand with them', r: 'You stand at the back. When the song reaches your name, they sing it.', fx: { happy: 5, family: 2, flag: 'st_between_stood' } },
      { t: 'Go to the tree afterwards, alone', r: 'You sit with her an hour. You find you have things to tell her.', fx: { happy: 2, piety: 2 } },
    ] },

  // ---- 16. Salt and Silence (Spice Coast)
  { id: 'st_salt_open', title: 'Salt and Silence', trigger: true,
    cond: (p, C) => C.flag(p, 'st_salt'),
    text: 'The smugglers of Kesh paid your father\'s debts when he died, and you owe them one voyage and no questions. Tonight a lantern swings twice at the end of your street. The cargo is small and heavy, and it does not smell of spice.',
    choices: [
      { t: 'Make the voyage and ask nothing', r: 'You deliver it to a cove at night. Nobody tells you what it was. You are paid in good silver and a nod.', fx: { flag: 'st_salt_sailed', coin: 60 } },
      { t: 'Open the cargo first', check: { s: 'stealth', s2: 'ins', d: 50 },
        win: { r: 'Pitch, sulphur and fuses, packed in salt. Someone is going to burn a ship. You close it up again very carefully.', fx: { flag: 'st_salt_looked' } },
        lose: { r: 'The lid squeals. The man on the dock sees, and smiles, and says nothing, which is worse.', fx: { flag: 'st_salt_seen', happy: -3 } } },
      { t: 'Take it to the harbour watch', r: 'The watch takes the cargo and your name. The smugglers take only your name.', fx: { flag: 'st_salt_betrayed', honor: 1 } },
    ] },
  { id: 'st_salt_echo', title: 'A ship burns', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_salt') && story(p, 'salt', 5),
    text: p => p.flags.st_salt_betrayed != null
      ? 'A man you have never seen sits down beside you in a wine shop and tells you, pleasantly, the names of your neighbours, and of everyone you have loved. Then he leaves. He does not need to say who sent him.'
      : 'A merchant ship burns at its moorings in a far harbour, with all its cargo. The news reaches Kesh in a week. You know, now, what you carried.',
    choices: [
      { t: 'Carry it, and say nothing', r: 'You say nothing. It sits in you like salt.', fx: { wil: 1, flag: 'st_salt_silent' } },
      { t: 'Light a lamp at the shrine for the drowned', r: 'You do not know their names. The priest says that does not matter.', fx: { piety: 3 } },
      { t: 'Find out who paid for it', check: { s: 'intrigue', s2: 'int', d: 55 },
        win: { r: 'A merchant house you trade with. You keep that knowledge very close.', fx: { flag: 'st_salt_knows', skill: { intrigue: 2 } } },
        lose: { r: 'Every door you knock on closes. Someone notices the knocking.', fx: { happy: -3 } } },
    ] },

  // ---- 17. The Novice Who Read Too Much (Skyhold)
  { id: 'st_novice_open', title: 'The Novice Who Read Too Much', trigger: true,
    cond: (p, C) => C.flag(p, 'st_novice'),
    setup: (p, ctx) => { const si = A.BT ? A.BT.pickSecret(p) : -1; ctx.si = si; ctx.secTitle = si >= 0 ? LORE.secrets[si].title : 'the founding of the Abbey'; },
    text: 'For a year you have used the key to the closed shelf. Tonight, in a book with its title scraped off, you find an account of {secTitle} that is not the one the abbot preaches. Footsteps on the stair.',
    choices: [
      { t: 'Hide the book and keep reading later', r: 'You put it behind the others and blow out the lamp. The footsteps pass.', fx: (p, ctx) => { if (A.BT && ctx.si >= 0) A.BT.learnSecret(p, ctx.si); A.applyFx(p, { flag: 'st_novice_read' }, ctx); return ' (Codex: Secrets you know)'; } },
      { t: 'Put it back and give the key to the abbot', r: 'He takes the key without asking where you found it. He looks at you differently afterward, more kindly, which frightens you.', fx: { flag: 'st_novice_confessed', piety: 3 } },
      { t: 'Take the book and leave the Abbey tonight', r: 'You are three valleys away by morning, with a stolen book and no plan.', fx: (p, ctx) => { if (A.BT && ctx.si >= 0) A.BT.learnSecret(p, ctx.si); A.applyFx(p, { flag: 'st_novice_fled', happy: -2 }, ctx); return ' (Codex: Secrets you know)'; } },
    ] },
  { id: 'st_novice_echo', title: 'The abbot\'s visitor', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_novice') && story(p, 'novice', 6),
    text: p => p.flags.st_novice_confessed != null
      ? 'The old abbot is dying and asks for you. He tells you that he read the closed shelf too, at your age, and gave his key to his own abbot. "It was the right thing," he says. "I have never been sure."'
      : 'A monk of Skyhold finds you in the town. He knows what you read, he says. He has read it too. He wants to know what you mean to do about it.',
    choices: [
      { t: 'Say you mean to do nothing', r: 'He nods slowly. It may be the answer he wanted. It may not.', fx: { wil: 1 } },
      { t: 'Say the truth should be written down', r: 'He is quiet. Then he says he has been writing it down for nine years, and does not know who to give it to.', fx: { flag: 'st_novice_ally' } },
    ] },

  // ---- 18. What Took Your Father (Northreach)
  { id: 'st_what_took_open', title: 'What Took Your Father', trigger: true,
    cond: (p, C) => C.flag(p, 'st_what_took'),
    setup: (p, ctx) => { const b = beastName(); if (!b) { ctx.skip = true; return; } ctx.beast = b; },
    text: 'Your father went up the fells last winter after a lost ewe and did not come back. They found his spear and not much else. The old women say it was a {beast}. The reeve says wolves. You have his spear.',
    choices: [
      { t: 'Go up the fells and look for its sign', check: { s: 'tracking', s2: 'ins', d: 50 },
        win: { r: 'You find the place, and the tracks, and the size of them. It was not wolves.', fx: (p, ctx) => { const id = A.S.story && A.S.story.beast; if (id && A.BT) A.BT.learn(p, id, 2); A.applyFx(p, { flag: 'st_what_took_tracked' }, ctx); return ''; } },
        lose: { r: 'Snow has covered whatever there was. You come down with frozen feet and nothing.', fx: { flag: 'st_what_took_lost', health: -5 } } },
      { t: 'Ask the old women what they know of it', r: 'They know a great deal and most of it contradicts the rest.', fx: { flag: 'st_what_took_asked' } },
      { t: 'Hang the spear over the door and leave it', r: 'Your mother cries when she sees it there. Then she thanks you.', fx: { flag: 'st_what_took_hung', family: 1 } },
    ] },
  { id: 'st_what_took_echo', title: 'It came back', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_what_took') && story(p, 'what_took', 5),
    setup: (p, ctx) => { const b = beastName(); if (!b) { ctx.skip = true; return; } ctx.beast = b; },
    text: 'Sheep are taken from the high pastures again, three nights running, the way they were the winter your father went up. The shepherds will not go up. They look at you, and at the spear.',
    choices: [
      { t: 'Go up with the spear', r: 'You go up at dusk. What happens there is yours to know.',
        fx: (p, ctx) => { const id = A.S.story && A.S.story.beast; A.applyFx(p, { flag: 'st_what_took_hunted' }, ctx); if (id && A.BEASTS[id]) A.applyFx(p, { beast: { id, mod: 0.8, place: 'the high pastures', title: 'The fells, at dusk' } }, ctx); return ''; } },
      { t: 'Send to the lord for hunters', r: 'The lord\'s hunters come in a week and kill a large wolf, and go home pleased.', fx: { flag: 'st_what_took_sent' } },
    ] },

  // ---- 19. The Queen's Ward (Drevna, royal)
  { id: 'st_ward_open', title: "The Queen's Ward", trigger: true,
    cond: (p, C) => C.flag(p, 'st_ward'),
    text: 'You are sixteen and the queen\'s ward. Everyone at court is very kind to you. This morning your old nurse, who is not kind to anyone, takes your hand and says, very low, that you should not drink anything the chamberlain sends up.',
    choices: [
      { t: 'Thank her and say nothing to anyone', r: 'You drink from the well in the kitchen yard for a year. Nothing happens. You never know whether that means she was right.', fx: { flag: 'st_ward_careful', ins: 1 } },
      { t: 'Go to the queen', check: { s: 'etiquette', s2: 'wil', d: 50 },
        win: { r: 'The queen hears you out without expression. The chamberlain retires to his estates within the month, for his health.', fx: { flag: 'st_ward_queen', honor: 1 } },
        lose: { r: 'The queen thanks you warmly. Your nurse is sent to a convent in the hills the next day.', fx: { flag: 'st_ward_lost_nurse', happy: -5 } } },
      { t: 'Send the chamberlain a gift of your own', r: 'A fine cup, and a note thanking him for his care. He reads it twice. He is very careful of you after that.', fx: { flag: 'st_ward_warned', skill: { intrigue: 2 } } },
    ] },
  { id: 'st_ward_echo', title: 'The nurse\'s last word', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_ward') && story(p, 'ward', 6),
    text: 'A letter from a convent in the hills, in a hand that shakes: your old nurse is dying. She wants you to know who paid the chamberlain, and why, and she has written it down. The bearer will wait for your answer.',
    choices: [
      { t: 'Ride to the convent', r: 'She is past speaking when you arrive, but the paper is under her pillow, and she smiles when you take it.', fx: { flag: 'st_ward_knows', happy: 1, skill: { intrigue: 1 } } },
      { t: 'Send the bearer back for the paper', r: 'It comes sealed with wax. You do not open it for a year.', fx: { flag: 'st_ward_knows' } },
      { t: 'Send your blessing and no more', r: 'Some things, once known, cannot be put down again.', fx: { wil: 1 } },
    ] },

  // ---- 20. The Company That Did Not Pay (Highland League)
  { id: 'st_unpaid_open', title: 'The Company That Did Not Pay', trigger: true,
    cond: (p, C) => C.flag(p, 'st_unpaid'),
    text: 'The Red Valley company broke up at the end of the season owing every man a year\'s pay. Captain Orrin kept the chest, for safekeeping, and went home to his valley. Six of the lads are going after him. They want you to come.',
    choices: [
      { t: 'Go with the lads', check: { s: 'intimidation', s2: 'str', d: 50 },
        win: { r: 'Orrin opens the chest in his own yard with seven spears at his door. It is lighter than it should be, but it is not empty.', fx: { flag: 'st_unpaid_collected', coin: 50 } },
        lose: { r: 'Orrin has his own lads. You come home with nothing and a cut over the eye.', fx: { flag: 'st_unpaid_beaten', health: -8 } } },
      { t: 'Take it to the League court', r: 'The court finds for the men. Orrin pays a tenth, which the lawyers share with you.', fx: { flag: 'st_unpaid_court', coin: 10 } },
      { t: 'Let it go and find another company', r: 'Pay is a promise. You learn to collect it weekly.', fx: { flag: 'st_unpaid_moved_on', skill: { spear: 1 } } },
    ] },
  { id: 'st_unpaid_echo', title: 'Captain Orrin', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_unpaid') && story(p, 'unpaid', 6),
    text: 'Captain Orrin, grey now, is raising a new company and comes looking for veterans. He does not seem to remember you. He offers good pay, paid monthly, he says, on his honour.',
    choices: [
      { t: 'Remind him of the Red Valley chest', r: 'He remembers then. He pays you on the spot, from his own purse, with interest, to keep it quiet.', fx: { coin: 40, flag: 'st_unpaid_repaid' } },
      { t: 'Warn the young men he is recruiting', r: 'Half of them listen. Orrin\'s company sails short.', fx: { honor: 2, flag: 'st_unpaid_warned' } },
      { t: 'Sign on anyway', r: 'Older now, and so is he. Perhaps.', fx: { flag: 'st_unpaid_signed' } },
    ] },
]);
})();
