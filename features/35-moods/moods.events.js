// Needs and moods: scenes a low need starts. Each offers a way to meet the need, at a price; none is free.
// fx.need changes the four needs (moods.core.js handles the key in A.applyFx), so the choice checker can read it.
(function () {

A.defEvents([
  // ---- weary (rest)
  { id: 'md_weary_morning', title: 'The morning you cannot get up',
    cond: (p, C) => (C.adult(p) || C.teen(p)) && C.mood(p, 'rest'), w: 3, cool: 4,
    text: 'The bell goes and your body does not. Your hands ache before you have done anything with them. Somewhere a day of work is waiting.',
    choices: [
      { t: 'Stay in bed until noon', r: 'You sleep like the dead and wake hungry. The work is still there, but so are you.', fx: { need: { rest: 30 }, coin: -10 } },
      { t: 'Get up anyway', check: { s: 'wil', s2: 'sta', d: 50 },
        win: { r: 'You get through the day on stubbornness. Nobody notices what it cost.', fx: { need: { purpose: 8 }, wil: 1 } },
        lose: { r: 'You drop a tool on your foot by mid-morning and go home anyway, worse off.', fx: { need: { rest: 5 }, health: -4 } } },
      { t: 'Ask someone to cover for you', r: 'They do, and they will ask for the favour back.', fx: { need: { rest: 20, company: 5 }, happy: -1 } },
    ] },
  { id: 'md_weary_snap', title: 'A short temper',
    cond: (p, C) => C.adult(p) && C.mood(p, 'rest'), w: 2, cool: 5,
    text: 'Someone asks you a simple question and you hear yourself bark at them. It is not their fault you have not slept properly in weeks.',
    choices: [
      { t: 'Apologise, and go and rest', r: 'They accept it. You take the afternoon off and sit in the sun like an old man.', fx: { need: { rest: 18, company: 4 }, coin: -5 } },
      { t: 'Let it stand and work on', r: 'The work gets done. The look on their face stays with you.', fx: { need: { purpose: 6 }, happy: -3 } },
    ] },
  { id: 'md_weary_healer', title: 'The healer\'s advice',
    cond: (p, C) => C.adult(p) && C.mood(p, 'rest') && C.town(p), w: 1.5, cool: 8,
    text: 'An old healer looks at your eyes, your hands and the way you sit, and charges you for telling you what you already know: you are wearing yourself out.',
    choices: [
      { t: 'Take a week of rest, as she says', r: 'A week of sleep, broth and doing nothing. It feels like a theft and it works.', fx: { need: { rest: 40 }, coin: -20 } },
      { t: 'Buy her tonic instead', r: 'It tastes of bark and honey and gives you three good days.', fx: { need: { rest: 15 }, coin: -8, health: 2 } },
      { t: 'Thank her and ignore it', r: 'You are not ready to be old yet.', fx: { need: { purpose: 4 }, wil: .5 } },
    ] },

  // ---- lonely (company)
  { id: 'md_lonely_evening', title: 'An evening alone',
    cond: (p, C) => (C.adult(p) || C.teen(p)) && C.mood(p, 'company'), w: 3, cool: 4,
    text: 'You eat alone again, and notice it. Through the wall you can hear a family arguing about nothing, and you would give a good deal to be arguing with somebody.',
    choices: [
      { t: 'Go out and find company', r: 'A crowded room, a bench, a stranger with opinions. It is enough for tonight.', fx: { need: { company: 25 }, coin: -6 } },
      { t: 'Write a letter to someone far away', req: p => p.literate, r: 'It takes three drafts. Writing it is half the comfort; the answer, if it comes, will be the rest.', fx: { need: { company: 15, purpose: 3 } } },
      { t: 'Sit with it', r: 'You sit with it. It is not the worst thing in the world, being alone with yourself. It is not the best.', fx: { need: { rest: 6 }, wil: .5, happy: -1 } },
    ] },
  { id: 'md_lonely_neighbour', title: 'The neighbour\'s invitation',
    cond: (p, C) => C.adult(p) && C.mood(p, 'company'), w: 2, cool: 6,
    text: 'A neighbour you hardly know says, as if it were nothing, that there is a pot on the fire tonight and room on the bench if you want it.',
    choices: [
      { t: 'Go, and bring something', r: 'You bring bread. They talk about their goats for an hour. You laugh more than you have in months.', fx: { need: { company: 30 }, coin: -3 } },
      { t: 'Make your excuses', r: 'You thank them and stay in. They do not ask again for a while.', fx: { need: { rest: 8 } } },
    ] },
  { id: 'md_lonely_dog', title: 'A dog at the door',
    cond: (p, C) => C.mood(p, 'company') && !C.child(p), w: 1.5, cool: 12, once: true,
    text: 'A thin dog with one torn ear has been sleeping at your door for three nights. It watches you come and go with a patience that is almost rude.',
    choices: [
      { t: 'Take it in', r: 'It eats more than it should and sleeps on your feet. The house is less quiet.', fx: { need: { company: 20, comfort: 4 }, coin: -5 } },
      { t: 'Feed it, and leave the door shut', r: 'It stays by the door, fed and patient, until one day it is gone.', fx: { need: { company: 6 }, coin: -2 } },
      { t: 'Chase it off', r: 'It goes. It looks back once.', fx: { wil: .5, happy: -2 } },
    ] },

  // ---- adrift (purpose)
  { id: 'md_adrift_question', title: 'What is it all for',
    cond: (p, C) => C.adult(p) && C.mood(p, 'purpose'), w: 3, cool: 4,
    text: 'You do what you did yesterday, and will do tomorrow, and cannot remember the last time any of it led anywhere. The question sits in your chest all day.',
    choices: [
      { t: 'Set yourself a hard goal and start today', r: 'It is small and it is yours. You feel the old pull of wanting something.', fx: { need: { purpose: 25 }, happy: 1 } },
      { t: 'Ask a priest', r: 'The priest has heard it before, and says so, and then says something better than you expected.', fx: { need: { purpose: 15 }, piety: 2, coin: -2 } },
      { t: 'Drink until it goes away', r: 'It goes away. It comes back in the morning, with a headache.', fx: { need: { company: 8 }, health: -3, coin: -4 } },
    ] },
  { id: 'md_adrift_offer', title: 'A stranger\'s offer',
    cond: (p, C) => C.adult(p) && C.mood(p, 'purpose') && !C.unfree(p), w: 1.5, cool: 8,
    text: 'A trader who is short a hand offers you a season on the road with his carts: hard work, poor pay, and somewhere you have never been.',
    choices: [
      { t: 'Go with the carts', r: 'Dust, bad food, a new town every week. You come back browner, poorer and less lost.', fx: { need: { purpose: 30, rest: -15 }, skill: { trade: 1 } } },
      { t: 'Stay where you are', r: 'The carts go without you. You watch them out of sight.', fx: { need: { rest: 6 } } },
    ] },
  { id: 'md_adrift_teach', title: 'Someone asks you to teach them',
    cond: (p, C) => C.adult(p) && C.mood(p, 'purpose'), w: 1.5, cool: 8,
    text: 'A youngster has been watching you work, and finally asks whether you would show them how it is done. They are clumsy and eager and need a great deal of patience.',
    choices: [
      { t: 'Teach them', r: 'They are slow, then less slow. Watching them get it is better than getting it yourself.', fx: { need: { purpose: 25, company: 10 }, coin: -3 } },
      { t: 'Tell them to find someone else', r: 'They go. You keep your evenings.', fx: { need: { rest: 10 } } },
    ] },

  // ---- in want (comfort)
  { id: 'md_want_cold', title: 'A cold house',
    cond: (p, C) => (C.adult(p) || C.teen(p)) && C.mood(p, 'comfort'), w: 3, cool: 4,
    text: 'There is frost on the inside of the shutters and not enough wood for the week. You can see your breath at supper.',
    choices: [
      { t: 'Buy wood, whatever it costs', r: 'The fire takes the frost off the walls and a bite out of your purse.', fx: { need: { comfort: 20 }, coin: -12 } },
      { t: 'Gather it yourself in the woods', check: { s: 'survival', s2: 'sta', d: 45 },
        win: { r: 'Two days of cold work, and a stack that will see you through.', fx: { need: { comfort: 18, rest: -8 } } },
        lose: { r: 'The forester\'s man catches you with an armful of the lord\'s wood.', fx: { need: { rest: -5 }, coin: -10, happy: -2 } } },
      { t: 'Wear everything you own and wait', r: 'You sleep in your coat. The cold gets into your chest.', fx: { health: -4, wil: .5 } },
    ] },
  { id: 'md_want_borrow', title: 'Short again',
    cond: (p, C) => C.adult(p) && C.mood(p, 'comfort'), w: 2, cool: 6,
    text: 'The month runs out before the money does, again. A moneylender\'s boy has left a note under your door: easy terms, he says.',
    choices: [
      { t: 'Borrow, and breathe for a month', r: 'You eat well for a month. The interest will eat well after that.', fx: { need: { comfort: 20 }, coin: 30, flag: 'md_borrowed' } },
      { t: 'Sell something you love', r: 'It goes for less than it is worth. You do not look back at it on the stall.', fx: { need: { comfort: 12 }, coin: 15, happy: -3 } },
      { t: 'Tighten your belt', r: 'Thin soup and early nights. You get through it, thinner.', fx: { need: { purpose: 4 }, health: -2, wil: 1 } },
    ] },
  { id: 'md_borrowed_due', title: 'The moneylender\'s boy again',
    cond: (p, C) => C.adult(p) && C.flag(p, 'md_borrowed') && A.S.year - p.flags.md_borrowed >= 1, w: 3, cool: 10, once: true,
    text: 'The moneylender\'s boy is back, with the same smile and a different note. The easy terms have grown up.',
    choices: [
      { t: 'Pay it all, with the interest', r: 'You pay. It hurts. It is over.', fx: { need: { comfort: -10 }, coin: -45, unflag: 'md_borrowed' } },
      { t: 'Ask for more time', check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: 'He gives you a season, and makes a note in his book.', fx: { coin: -10 } },
        lose: { r: 'Two large men come by that evening to discuss it.', fx: { coin: -55, health: -6, unflag: 'md_borrowed' } } },
    ] },

  // ---- content
  { id: 'md_content_evening', title: 'A good evening',
    cond: (p, C) => C.adult(p) && C.mood(p, 'content'), w: 1.5, cool: 6,
    text: 'Nothing happens tonight. The fire is warm, the work is done, and the people you care about are within shouting distance. You notice it, which is rare.',
    choices: [
      { t: 'Say so, out loud', r: 'Someone laughs at you for it, and then agrees.', fx: { happy: 4, family: 1 } },
      { t: 'Keep it to yourself', r: 'You keep it, like a coin in a pocket, for a worse day.', fx: { wil: 1, happy: 2 } },
    ] },
  { id: 'md_content_restless', title: 'Too comfortable',
    cond: (p, C) => C.adult(p) && C.mood(p, 'content') && C.young(p), w: 1, cool: 10,
    text: 'Everything is well. That is the trouble. You have the strange feeling that a life can be wasted by being too pleasant.',
    choices: [
      { t: 'Shake it up: take a risk', r: 'You say yes to something you would have refused last year.', fx: { need: { purpose: 15, rest: -10 }, fame: 1 } },
      { t: 'Enjoy it while it lasts', r: 'It lasts a while. That is not nothing.', fx: { happy: 3 } },
    ] },
]);
})();
