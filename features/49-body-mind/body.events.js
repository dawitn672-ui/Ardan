// Health as a body (49-body-mind): the treatment of an illness and of a wound, and scenes that a lasting wound brings.
// bm_ill and bm_wound_care are queued by body.core.js when a sickness or a serious wound starts; the rest read the body
// with C.wound(p, part or wound) and C.ill(p).
A.defEvents([
  {
    id: 'bm_ill', trigger: true, title: 'Sick abed',
    text: (p, ctx) => A.age(p) < GD.RACES[p.race].adult
      ? '{illThe} has you. You burn, then shiver, and the blanket is wet with it. Your mother counts the coins in the pot: the physician in {home} charges what he thinks a house can bear, the wise woman by the ford wants a hen and knows her roots, and the priest prays for nothing. Or they can keep you in bed and wait.'
      : '{illThe} has you. You burn, then shiver, and the blanket is wet with it. The physician in {home} charges what he thinks a house can bear. The wise woman by the ford wants a hen and knows her roots, or says she does. The priest prays for nothing. Or you can lie still and let it run.',
    choices: [
      { t: 'Send for the physician, whatever he charges', r: 'He comes with a bag of knives and a boy to carry it, names the sickness in the old tongue, and takes his fee.',
        fx: { coin: -4, coinPct: -0.03, treat: 'physician' } },
      { t: 'Send for the wise woman and her roots', check: { s: 'medicine', s2: 'int', d: 40 },
        win: { r: 'She boils bark and something bitter, and sits with you while you sweat. You know the plant, and you know she is right.', fx: { coin: -1, treat: 'herbs' } },
        lose: { r: 'The root is the wrong root. You are sick from both ends for a week before the fever comes back.', fx: { coin: -1, health: -5, treat: 'herbs_bad' } } },
      { t: 'Ask the priest to pray over you', r: 'He kneels by the bed and says the old words. The fever does not listen, but you sleep.',
        fx: { piety: 3, happy: 3, treat: 'prayer' } },
      { t: 'Stay abed and let it run its course', r: 'You do nothing for weeks. The work waits, or it does not.',
        fx: { need: { rest: 30, purpose: -15 }, treat: 'rest' } },
    ],
  },
  {
    id: 'bm_wound_care', trigger: true, title: 'Seeing to a wound',
    text: 'The {wound} needs seeing to; it is in your {part}, and you feel it there every hour. The barber-surgeon at the market sets bones and sews cuts for a fee. You know a little of poultices yourself, or think you do. The priest will bless it. Or you can bind it tight and carry on, as most people do.',
    choices: [
      { t: 'Pay the barber-surgeon to set it right', r: 'He sews and splints, and it hurts more than the wound did. He says a month or two.',
        fx: { coin: -3, coinPct: -0.02, care: 'surgeon' } },
      { t: 'Clean and dress it yourself', check: { s: 'medicine', s2: 'ins', d: 40 },
        win: { r: 'Boiled water, clean linen, honey on the cut. It closes cleanly.', fx: { care: 'herbs', skill: { medicine: 1 } } },
        lose: { r: 'You get it wrong. It swells and weeps, and the heat spreads.', fx: { care: 'herbs_bad', health: -4 } } },
      { t: 'Have the priest bless it', r: 'He makes the sign over it and leaves you a candle. It heals in its own time.',
        fx: { piety: 2, happy: 2, care: 'prayer' } },
      { t: 'Bind it tight and carry on', r: 'You work through it. Most days you forget it is there, until you do not.',
        fx: { care: 'bind', need: { purpose: 8 } } },
    ],
  },
  {
    id: 'bm_wb_bad_hand', title: 'The hand that will not close', w: 2, cool: 12,
    cond: (p, C) => C.adult(p) && (C.wound(p, 'lost_fingers') || C.wound(p, 'stiff_hand') || C.wound(p, 'crooked_arm')) && (C.job(p) || p.status === 'artisan' || C.skill(p, 'craft') >= 20),
    text: 'At the bench your bad hand drops the tongs twice before noon. The apprentice pretends not to see. There is a way of working with what is left, the old smiths say, but it takes a year of spoiled work to learn it.',
    choices: [
      { t: 'Spend the year learning the other way', check: { s: 'craft', s2: 'wil', d: 45 },
        win: { r: 'By winter the other hand knows what the first one did. Slower, but sure.', fx: { skill: { craft: 2 }, wil: 1 } },
        lose: { r: 'A year of spoiled iron. You go back to the plain work and the plain pay.', fx: { coin: -6, happy: -3 } } },
      { t: 'Let the apprentice be your hands', r: 'He holds, you strike, and you tell him what you see. He learns faster than you would like.',
        fx: { coin: -3, skill: { craft: 0.5 }, need: { company: 6 } } },
      { t: 'Give up the fine work', r: 'Nails and hinges. They pay, a little. Nobody asks.', fx: { happy: -4, coin: 4 } },
    ],
  },
  {
    id: 'bm_wb_march_leg', title: 'The long road', w: 2, cool: 10,
    cond: (p, C) => C.adult(p) && C.soldier(p) && (C.wound(p, 'limp') || C.wound(p, 'bad_knee') || C.wound(p, 'broken_leg')),
    text: 'Twenty miles a day on a leg that does not bend right. By the third day you are at the back of the column with the carts and the wives. The sergeant has noticed.',
    choices: [
      { t: 'March with the column, whatever it costs', check: { s: 'sta', s2: 'wil', d: 50 },
        win: { r: 'You keep your place. Every night the knee swells like rising bread.', fx: { merit: 8, health: -6, wil: 1 } },
        lose: { r: 'On the fifth day it gives. They put you on a cart with the barrels.', fx: { health: -10, merit: -5 } } },
      { t: 'Ask for a place on the baggage cart', r: 'You ride with the salt pork. Nobody calls it shirking to your face.', fx: { merit: -6, happy: -2 } },
      { t: 'Trade your watches for the loan of a mule', r: 'Two nights of other men\'s watches buy the mule. You arrive tired, on four legs.', fx: { coin: -3, need: { rest: -15 } } },
    ],
  },
  {
    id: 'bm_wb_lungs', title: 'A winter in the chest', w: 2, cool: 8,
    cond: (p, C) => C.age(p) >= 12 && C.wound(p, 'lungs'),
    text: 'Since the fever, every frost settles in your chest. You cough before dawn and after supper, and the stairs are a hill. The herb-wife swears by a tent of steam and pine. The priest says it is penance. Your neighbour says sit by the fire and stop complaining.',
    choices: [
      { t: 'Sit by the fire the whole winter', r: 'You burn a cart of wood and do little else. Spring finds you breathing.', fx: { need: { rest: 20, purpose: -12 }, health: 6, coin: -2 } },
      { t: 'Try the steam tent', check: { s: 'medicine', s2: 'sta', d: 45 },
        win: { r: 'Something opens. You breathe to the bottom of your chest for the first time in a year.', fx: { health: 10 } },
        lose: { r: 'You come out of the tent shaking, and the cough is worse.', fx: { health: -6 } } },
      { t: 'Work through it as you always have', r: 'You work. You cough. You work.', fx: { health: -8, coin: 5 } },
    ],
  },
  {
    id: 'bm_wb_one_eye', title: 'The world on one side', w: 2, cool: 15,
    cond: (p, C) => C.age(p) >= 12 && C.wound(p, 'lost_eye'),
    text: 'With one eye the world is flat. You pour ale beside the cup, misjudge steps, flinch from men on your blind side. An old archer at the butts says the trick is to turn your head more than your eye, and to practise until it is a habit.',
    choices: [
      { t: 'Practise at the butts until it is a habit', check: { s: 'bow', s2: 'ins', d: 50 },
        win: { r: 'A month of arrows in the grass, then one in the straw, then most. Your head turns by itself now.', fx: { skill: { bow: 2 }, ins: 1 } },
        lose: { r: 'The arrows go where they like. You stop going to the butts.', fx: { happy: -3, skill: { bow: 0.5 } } } },
      { t: 'Keep a wall on your blind side, always', r: 'You sit with your back to corners now. People think you careful. You are.', fx: { wil: 1, need: { comfort: -5 } } },
      { t: 'Wear the patch and stop thinking about it', r: 'Black leather and a cord. It suits you, the alewife says.', fx: { happy: 2, looks: -1 } },
    ],
  },
  {
    id: 'bm_wb_back', title: 'Reaping with a bad back', w: 2, cool: 8,
    cond: (p, C) => C.adult(p) && C.wound(p, 'back') && (C.poor(p) || C.unfree(p) || C.job(p, 'farm')),
    text: 'The rye is ripe and the reaping does not wait. You bend, and your back answers like a stick across the kidneys. The miller\'s boy will reap your rows for a share of the grain. The steward will not take less because you are hurt.',
    choices: [
      { t: 'Pay the boy his share', r: 'He reaps badly and eats well. The rows get done.', fx: { coin: -4, need: { rest: 10 } } },
      { t: 'Reap your rows bent double', check: { s: 'sta', s2: 'wil', d: 50 },
        win: { r: 'You do it, a row at a time, and lie on the floor every night.', fx: { coin: 3, wil: 1, health: -4 } },
        lose: { r: 'On the second day you cannot stand. The rye stands instead, and some of it is lost.', fx: { health: -12, coin: -2 } } },
      { t: 'Ask the neighbours, and owe them for it', r: 'They come with sickles and a jug. You will owe each of them a day in spring.', fx: { need: { company: 10 }, happy: 2, coin: -1 } },
    ],
  },
  {
    id: 'bm_wb_face', title: 'What the children stare at', w: 2, cool: 15,
    cond: (p, C) => C.adult(p) && (C.wound(p, 'scar_face') || C.wound(p, 'brand') || (C.wound(p, 'burn') && C.wound(p, 'head'))),
    text: 'In the market a child points at your face and asks her mother what happened to it. Her mother hushes her and pulls her away by the wrist. The child keeps looking back at you over her shoulder.',
    choices: [
      { t: 'Crouch and tell her the truth of it', r: 'Her eyes go wide. By evening half the street has the story, and it is larger than it was.', fx: { happy: 2, fame: 1 } },
      { t: 'Pull your hood forward', r: 'You buy what you came for and go home by the back lanes.', fx: { trait: 'shy', wil: 1 } },
      { t: 'Bare your teeth at her', r: 'She shrieks and hides in her mother\'s skirts. Someone laughs. Not the mother.', fx: { trait: 'cruel', fame: 1 } },
    ],
  },
  {
    id: 'bm_wb_weather', title: 'The old wound knows the weather', w: 2, cool: 12,
    cond: (p, C) => C.age(p) >= 35 && C.wound(p, 'lasting'),
    setup: (p, ctx) => {
      const w = (p.wounds || []).find(x => !x.until && GD.WOUNDS[x.k] && (Object.keys(GD.WOUNDS[x.k].fx || {}).length || GD.WOUNDS[x.k].skillPen));
      if (!w) { ctx.skip = true; return; }
      ctx.scar = GD.WOUNDS[w.k].name.toLowerCase();
    },
    text: 'Rain is coming. You know it a day before the farmers do, because of the {scar}: it aches like a bad tooth. Your neighbour has noticed, and asks you to tell him when to cut the hay.',
    choices: [
      { t: 'Tell him, for a share of the hay', r: 'You are right four times in five. He pays in hay and in a sort of respect.', fx: { coin: 2 } },
      { t: 'Tell him, and want nothing for it', r: 'He brings you a cheese at the end of summer anyway.', fx: { rel: { who: 'acquaint', op: 6 }, happy: 1 } },
      { t: 'Rub the ache with goose fat and say nothing', r: 'The fat helps, or the warmth of the rubbing does.', fx: { health: 3 } },
    ],
  },
  {
    id: 'bm_wb_hook', title: 'A hook for the hand', w: 3, once: true,
    cond: (p, C) => C.adult(p) && C.wound(p, 'lost_hand'),
    text: 'The smith has made hooks before, for sailors and once for a hangman. He shows you one: iron, a leather cup, straps across the shoulder. It will hold a rein or a mug, he says, and frighten children. Or he can carve a wooden hand in a glove that does nothing but look like one.',
    choices: [
      { t: 'Take the hook', r: 'It chafes for a month. Then you forget it is there, until someone stares.', fx: { coin: -8, looks: -2, skill: { riding: 1, craft: 1 } } },
      { t: 'Take the wooden hand', r: 'In a glove, at a distance, nobody would know. Close to, everybody does.', fx: { coin: -6, looks: 3, happy: 2 } },
      { t: 'Neither. Pin up the sleeve', r: 'You learn to do one-handed what can be done one-handed, and to ask for the rest.', fx: { wil: 1 } },
    ],
  },
  {
    id: 'bm_wb_splint_arm', title: 'The splint itches', w: 3, cool: 5,
    cond: (p, C) => C.age(p) >= 8 && C.wound(p, 'broken_arm'),
    text: 'Six weeks in the splint and the arm itches like a hive under the wood. The bonesetter said three months. The work does not wait three months, and the itch does not wait at all.',
    choices: [
      { t: 'Cut the splint off early', check: { s: 'sta', s2: 'wil', d: 45 },
        win: { r: 'It holds. Thin and pale, but it holds.', fx: { coin: 3, need: { purpose: 10 } } },
        lose: { r: 'It holds for a week, and then it does not. It knits again, crooked.', fx: { wound: 'crooked_arm', health: -4 } } },
      { t: 'Keep it still the full three months', r: 'You learn to eat with the other hand, and to be patient, which is harder.', fx: { need: { rest: 15, purpose: -15 }, happy: -3 } },
      { t: 'Scratch under it with a knitting needle', r: 'Bliss, for a moment. The needle comes out red, which is not a good sign.', fx: { happy: 3, health: -3 } },
    ],
  },
  {
    id: 'bm_wb_splint_leg', title: 'Learning to walk again', w: 3, cool: 5,
    cond: (p, C) => C.age(p) >= 8 && C.wound(p, 'broken_leg'),
    text: 'The leg is out of the splint and will not take your weight. The bonesetter says walk a little more each day, a crutch first and then a stick. Your mother says lie still until it is strong. The leg says nothing, and aches.',
    choices: [
      { t: 'Walk on it a little more each day', check: { s: 'sta', s2: 'wil', d: 45 },
        win: { r: 'By midsummer you walk to the well and back without the stick.', fx: { spd: 1, need: { purpose: 10 } } },
        lose: { r: 'You push too far too soon. It mends, but short, and you will walk with a hitch.', fx: { wound: 'limp', health: -4 } } },
      { t: 'Lie still until it is strong', r: 'A season in bed. You grow soft and bored, and the leg grows straight.', fx: { need: { rest: 20, purpose: -20 }, happy: -2 } },
      { t: 'Get a good crutch and forget the stick', r: 'The carpenter makes you a fine one. You are quick on it, and in no hurry to give it up.', fx: { coin: -2, happy: 2 } },
    ],
  },
]);
