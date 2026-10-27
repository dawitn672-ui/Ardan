// 995-hall-of-lives: the three start stories the Hall opens (hall.core.js adds them to 29-starts' list). Each has its
// opening scene (st_<id>_open, forced at birth by 29) and a callback years later that reads what you chose.
(function () {
const since = (p, f) => (p.flags && p.flags[f] != null ? A.S.year - p.flags[f] : -1);

A.defEvents([
  // ---- The Beggar's Heir (Solenne)
  { id: 'st_hl_beggar_open', title: "The Beggar's Heir", trigger: true,
    cond: (p, C) => C.flag(p, 'st_hl_beggar'),
    text: 'Old Ansel died on the temple steps in the night, sitting up, with his cup in his lap. He left you three things: the pitch by the second pillar, the cup, and what he owed the beggar-king of the lower town. The beggar-king has sent a boy to say he will call at noon.',
    choices: [
      { t: 'Wait at the pillar and pay what you can', r: 'The beggar-king takes the cup and two coppers, and lets you keep the pitch. He calls you Ansel, as a joke. It sticks.', fx: { flag: 'st_hl_beggar_paid', coin: -2, honor: 1 } },
      { t: 'Argue that a dead man\'s debt dies with him', check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: 'He laughs, and says Ansel always said you had a mouth on you. The debt is struck. The pitch costs double from now on.', fx: { flag: 'st_hl_beggar_argued', wil: 1 } },
        lose: { r: 'His men take you behind the bakehouse to explain the law of the steps. It takes a while.', fx: { flag: 'st_hl_beggar_argued', health: -8, happy: -3 } } },
      { t: 'Sell the pitch to a rival and leave', r: 'A one-eyed woman from the fish stairs pays nine coppers for it. By noon you are on the north road with Ansel\'s cup.', fx: { flag: 'st_hl_beggar_left', coin: 1, happy: -1 } },
    ] },
  { id: 'st_hl_beggar_echo', title: 'The second pillar', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_hl_beggar') && since(p, 'st_hl_beggar') >= 6,
    text: p => `You pass the temple steps. A child sits at the second pillar with a cup${p.flags.st_hl_beggar_left != null ? ' very like the one you carried away' : ''}. The beggar-king is dead, someone tells you. The new one is worse.`,
    choices: [
      { t: 'Fill the child\'s cup', r: 'The child counts it twice and looks at you as if you might want it back.', fx: { coin: -10, piety: 2, happy: 2 } },
      { t: 'Ask who keeps the steps now', check: { s: 'intrigue', s2: 'ins', d: 45 },
        win: { r: 'A name, a tavern and a time. Knowing who keeps the steps is worth something in a town.', fx: { skill: { intrigue: 3 } } },
        lose: { r: 'Nobody on the steps has ever heard of anyone. You are not one of them any more.', fx: { happy: -2 } } },
      { t: 'Walk past without looking', r: 'You have walked past a great many children since then. This one is no harder.', fx: { wil: 1 } },
    ] },

  // ---- The Sexton's Book (Morhaven)
  { id: 'st_hl_gravedigger_open', title: "The Sexton's Book", trigger: true,
    cond: (p, C) => C.flag(p, 'st_hl_gravedigger'),
    text: 'The old sexton taught you letters so you could keep his book: who lies where, and who paid. Last spring you filled a grave by lamplight for a man in a good coat, who paid well. Now the frost has heaved the ground, and the coffin you buried has come up light as kindling.',
    choices: [
      { t: 'Open the coffin', check: { s: 'ins', s2: 'wil', d: 45 },
        win: { r: 'Stones, wrapped in sacking, and a purse wedged in the corner. Someone wanted a death on the books.', fx: { flag: 'st_hl_gravedigger_opened', coin: 25 } },
        lose: { r: 'The lid splits and you go in after it, up to the elbow in cold sacking. You sleep badly for a week.', fx: { flag: 'st_hl_gravedigger_opened', happy: -3, health: -3 } } },
      { t: 'Bury it again, deeper', r: 'You dig until your hands bleed. The book says a man lies there. The book is what people read.', fx: { flag: 'st_hl_gravedigger_buried', skill: { husbandry: 1 } } },
      { t: 'Take the book to the priest', r: 'The priest reads the page twice, tears it out, and gives you a shilling for your trouble.', fx: { flag: 'st_hl_gravedigger_told', piety: 2, coin: 1 } },
    ] },
  { id: 'st_hl_gravedigger_echo', title: 'A man in a good coat', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_hl_gravedigger') && since(p, 'st_hl_gravedigger') >= 7,
    text: p => `At a market far from Morhaven a man in a good coat buys apples. He is older and stouter, and his name, the stallholder says, is not the one in the sexton's book${p.flags.st_hl_gravedigger_opened != null ? ', the one on a coffin full of stones' : ''}. He has not seen you.`,
    choices: [
      { t: 'Say his old name aloud', check: { s: 'intimidation', s2: 'wil', d: 50 },
        win: { r: 'He goes white, and pays you to forget it again. You forget it for a good price.', fx: { coin: 40, honor: -1 } },
        lose: { r: 'He turns, looks through you and walks off. By evening there is a man asking after you at the inn.', fx: { happy: -4 } } },
      { t: 'Follow him to see where he lives', check: { s: 'stealth', s2: 'ins', d: 45 },
        win: { r: 'A tall house, a wife, three children. You know something about this man that his wife does not.', fx: { skill: { stealth: 2 } } },
        lose: { r: 'You lose him in the crowd at the bridge, which is perhaps as well.', fx: {} } },
      { t: 'Let the dead stay dead', r: 'You buy your apples and go. It is not your book any more.', fx: { wil: 1, happy: 1 } },
    ] },

  // ---- What Is Left of the House (Varenna)
  { id: 'st_hl_fallen_open', title: 'What Is Left of the House', trigger: true,
    cond: (p, C) => C.flag(p, 'st_hl_fallen'),
    text: 'Your father backed the claimant who lost. The new lord\'s bailiffs have taken the land, the plate, the horses and the hangings, and written each in a list. What they could not write down was the name. Your mother has kept the seal ring in her shoe. She asks what you mean to do with it.',
    choices: [
      { t: 'Ride to the new lord and kneel', check: { s: 'etiquette', s2: 'wil', d: 50 },
        win: { r: 'He makes you wait three days, then gives you a post at his table, below the salt. It is a beginning.', fx: { flag: 'st_hl_fallen_knelt', honor: -1, skill: { etiquette: 2 } } },
        lose: { r: 'He keeps you waiting a week and does not see you. The steward sends you away with bread.', fx: { flag: 'st_hl_fallen_knelt', happy: -4 } } },
      { t: 'Sell the ring and buy into trade', r: 'A goldsmith pays well for the stone and better for the story. You have a purse and no name to spend it under.', fx: { flag: 'st_hl_fallen_sold', coin: 60, honor: -2 } },
      { t: 'Keep the ring and wait', r: 'You hang it round your neck on a cord. Claimants die. Houses come back. You can wait.', fx: { flag: 'st_hl_fallen_kept', wil: 1 } },
    ] },
  { id: 'st_hl_fallen_echo', title: 'The old hangings', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'st_hl_fallen') && since(p, 'st_hl_fallen') >= 6,
    text: p => `In a merchant's hall you see your family's hangings on the wall, the hunting scene your grandmother sewed. The merchant bought them from the bailiffs for almost nothing.${p.flags.st_hl_fallen_kept != null ? ' The ring is still on its cord under your shirt.' : ''}`,
    choices: [
      { t: 'Offer to buy them back', r: 'He names a price ten times what he paid. You pay it. They smell of his house now.', fx: { coin: -80, family: 2, happy: 3 } },
      { t: 'Tell the hall whose they were', check: { s: 'persuasion', s2: 'int', d: 45 },
        win: { r: 'By the end of the evening the merchant is apologising to you, and half the hall knows your name again.', fx: { fame: 2 } },
        lose: { r: 'The merchant\'s guests laugh. Everyone in Varenna has a grandmother who sewed something.', fx: { happy: -3 } } },
      { t: 'Say nothing and drink his wine', r: 'It is good wine. You drink a good deal of it, under your grandmother\'s stag.', fx: { happy: 1, wil: 1 } },
    ] },
]);
})();
