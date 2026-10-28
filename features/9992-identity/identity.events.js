// 9992-identity: the scenes of your mark. A dog that follows you home, a horse, a blade and a ship that get names
// (identity.a-mark.core.js keeps them in pc.named, and {dog} {horse} {blade} {ship} name them in any scene), their
// deeds and their ends; the epithet the day it sticks; and the ideas offered to you as thoughts (part 3).
// Prefix ix_. The naming choices take the names identity offers by hash ({nm0} {nm1}, set in setup).
(function () {
const ID = A.ID;
const offers = kind => (p, ctx) => { ctx.nm0 = ID.offer(p, kind, 0); ctx.nm1 = ID.offer(p, kind, 1); };
const named = (p, k) => !!(ID && ID.named(p, k));
const yrs = (p, k) => (ID ? ID.yearsWith(p, k) : 0);
const thOpen = (p, id) => { const t = ID.thoughtState(p); return t.ripe[id] == null && t.held[id] == null && t.dropped[id] == null; };

A.defEvents([
  // ---- a dog
  { id: 'ix_pup', title: 'A pup at the door', w: 2, once: true,
    cond: (p, C) => C.age(p) >= 8 && !C.prison(p) && !C.flag(p, 'ix_no_dog') && !named(p, 'dog'),
    setup: offers('dog'),
    text: 'A thin pup has followed you three days running, from the well to your door. It sits a cart-length off and watches you eat. One ear stands up and one does not. Nobody in the lane will own it.',
    choices: [
      { t: 'Keep it, and call it {nm0}', r: 'It eats a bowl of scraps in a breath and sleeps across your feet. {nm0} it is.', fx: { name: { kind: 'dog', i: 0 }, happy: 3, coin: -1, need: { company: 8 } } },
      { t: 'Keep it, and call it {nm1}', r: 'You say the name twice and it thumps its tail on the third. {nm1} it is.', fx: { name: { kind: 'dog', i: 1 }, happy: 3, coin: -1, need: { company: 8 } } },
      { t: 'Throw it a crust and shut the door', r: 'It is gone by morning. Somebody else\'s dog now, or nobody\'s. You keep your scraps.', fx: { flag: 'ix_no_dog', wil: 0.5 } },
    ] },
  { id: 'ix_dog_night', title: 'A growl in the dark', w: 1, cool: 8,
    cond: (p, C) => C.age(p) >= 12 && named(p, 'dog') && yrs(p, 'dog') >= 1 && !C.prison(p),
    text: 'Past midnight {dog} stands up in the dark and growls at the door, low, the way {dog} never growls at anyone. Something scrapes at the latch outside.',
    choices: [
      { t: 'Open the door with a cudgel in hand', check: { s: 'ins', s2: 'str', d: 44 },
        win: { r: 'A man with a sack runs off up the lane, {dog} at his heels. He drops the sack. It has your neighbour\'s hens in it.', fx: { fame: 1, happy: 2, named: { kind: 'dog', deed: 'Ran a thief off in {year}' } } },
        lose: { r: 'You trip on the step. The thief is away, and so is your good cloak from the peg.', fx: { coin: -6, health: -3, cause: 'a fall in the dark' } } },
      { t: 'Hold {dog} and keep quiet', r: 'The scraping stops. In the morning the lane is talking about the miller\'s loss, not yours.', fx: { need: { rest: -5 }, named: { kind: 'dog', deed: 'Kept watch the night of the thieves, {year}' } } },
    ] },
  { id: 'ix_dog_old', title: 'The last winter', w: 3, once: true,
    cond: (p, C) => named(p, 'dog') && yrs(p, 'dog') >= 10,
    text: '{dog} is grey at the muzzle now and does not get up when you come in. {dog} lifts that one ear, the one that always stood, and lets it fall. {dog} has been with you {dogYears} years.',
    choices: [
      { t: 'Sit up with {dog} by the fire', r: 'You sit up all night with a hand on the old ribs. Near dawn they stop. You bury {dog} under the pear tree.', fx: { happy: -4, need: { company: 5 }, wil: 1, lose: { kind: 'dog', how: 'died' } } },
      { t: 'Ask the knacker to make it quick', r: 'It is done before noon, and kindly. You do not watch. That night the floor by the door is very bare.', fx: { happy: -2, coin: -2, lose: { kind: 'dog', how: 'died' } } },
    ] },

  // ---- a horse
  { id: 'ix_horse_name', title: 'A horse of your own', w: 2, cool: 4,
    cond: (p, C) => C.age(p) >= 12 && C.gear(p, 'mount') && !named(p, 'horse') && !C.prison(p),
    setup: offers('horse'),
    text: 'The groom asks what to chalk over the stall. The beast is yours now, and it has opinions: it bites at strangers, stands quiet for you, and will not cross running water without a word in its ear.',
    choices: [
      { t: 'Chalk up {nm0}', r: '{nm0}. The groom writes it badly, and it stays.', fx: { name: { kind: 'horse', i: 0 }, skill: { riding: 1 } } },
      { t: 'Chalk up {nm1}', r: '{nm1}. The horse flicks an ear at it, which you take as consent.', fx: { name: { kind: 'horse', i: 1 }, skill: { riding: 1 } } },
      { t: 'A horse is a horse. Sell the fancy tack', r: 'You sell the silvered bridle and ride on plain leather. Nobody chalks anything.', fx: { coin: 4 } },
    ] },
  { id: 'ix_horse_carry', title: 'Carried out', w: 2, cool: 6,
    cond: (p, C) => C.soldier(p) && named(p, 'horse') && (ID.named(p, 'horse').battles || 0) >= 1,
    text: 'You remember nothing of the end of the fighting but mud and noise. {horse} remembers the way back. You wake in the horse lines with {horse} standing over you, blowing in your face.',
    choices: [
      { t: 'Give {horse} your own ration of oats', r: 'You go hungry and {horse} does not. The men laugh. You do not care.', fx: { happy: 2, health: -1, cause: 'a hungry week', named: { kind: 'horse', deed: 'Carried you out of the fighting, {year}' } } },
      { t: 'Have the farrier look at that foreleg', r: 'A cracked hoof, caught in time. It costs you, and {horse} will run another year.', fx: { coin: -5, skill: { riding: 1 }, named: { kind: 'horse', deed: 'Carried you out of the fighting, {year}' } } },
    ] },
  { id: 'ix_horse_old', title: 'Out to grass', w: 2, once: true,
    cond: (p, C) => named(p, 'horse') && yrs(p, 'horse') >= 12,
    text: '{horse} is slow on the hills now and stumbles on the stones. {horseYears} years under your saddle. The farrier says what farriers say, and looks at you to see which way you will go.',
    choices: [
      { t: 'Pay a farmer to keep {horse} in clover', r: 'A paddock by a stream and a boy to bring apples. You ride out once a month to see {horse}, on a younger horse that has no name yet.', fx: { coin: -20, happy: 2, lose: { kind: 'horse', how: 'put out to grass' } } },
      { t: 'Sell {horse} while there is a price', r: 'A carter takes {horse} for a fair sum. You do not watch the cart go down the road.', fx: { coin: 12, happy: -3, lose: { kind: 'horse', how: 'sold' } } },
    ] },

  // ---- a blade
  { id: 'ix_blade_name', title: 'Steel with a name', w: 2, cool: 4,
    cond: (p, C) => C.age(p) >= 14 && C.gear(p, 'weapon') && !named(p, 'blade') && (C.soldier(p) || C.skill(p, 'melee') >= 20),
    setup: offers('blade'),
    text: 'An old soldier at the whetstone says a weapon that is never named never learns who it belongs to. He says it as if it were plain fact, like the weather. He holds out his hand for yours.',
    choices: [
      { t: 'Name it {nm0}', r: 'He says {nm0} over it, spits on the edge, and hands it back. It feels no different. It feels a little different.', fx: { name: { kind: 'blade', i: 0 }, happy: 1, wil: 0.3 } },
      { t: 'Name it {nm1}', r: '{nm1}. He nods as if you had passed something.', fx: { name: { kind: 'blade', i: 1 }, happy: 1, wil: 0.3 } },
      { t: 'Say steel needs no name', r: 'He shrugs and sharpens it for nothing. A good edge, anyway.', fx: { skill: { melee: 1 } } },
    ] },
  { id: 'ix_blade_notch', title: 'Notches', w: 1, cool: 8,
    cond: (p, C) => named(p, 'blade') && (ID.named(p, 'blade').kills || 0) >= 2,
    text: 'Cleaning {blade} you count the nicks in the edge, and you know where each one came from. The smith says he can grind them out in an afternoon and {blade} will be as new.',
    choices: [
      { t: 'Have them ground out', r: 'A clean edge again. It catches the light. It does not remember anything now, and neither, for a day, do you.', fx: { coin: -3, happy: 2, need: { rest: 5 } } },
      { t: 'Keep every notch', r: 'You keep them. Men who see {blade} drawn see them too, and some of them think twice.', fx: { fame: 1, skill: { intimidation: 1 }, named: { kind: 'blade', deed: 'Kept its notches, {year}' } } },
    ] },

  // ---- a ship
  { id: 'ix_ship_name', title: 'A name on the stern', w: 2, cool: 4,
    cond: (p, C) => C.adult(p) && named(p, 'ship') === false && ID.KINDS.ship.has(p),
    setup: offers('ship'),
    text: 'The boat came to you with a name half painted out. The sailors will not go out under no name at all. One of them has a pot of paint and a brush and is waiting, not patiently.',
    choices: [
      { t: 'Paint {nm0} on the stern', r: '{nm0}. The men say it twice, to the water, which is how it is done.', fx: { name: { kind: 'ship', i: 0 }, skill: { sea: 1 } } },
      { t: 'Paint {nm1} on the stern', r: '{nm1}. A good name, the oldest hand says, a name that comes home.', fx: { name: { kind: 'ship', i: 1 }, skill: { sea: 1 } } },
      { t: 'Scrape it clean and sell the paint', r: 'No name at all. The men grumble and go out anyway, for the wage.', fx: { coin: 2, happy: -1 } },
    ] },
  { id: 'ix_ship_storm', title: 'Weather off the point', w: 1, cool: 6,
    cond: (p, C) => named(p, 'ship') && C.coast(p),
    text: 'Word comes up from the harbour: {ship} was caught off the point by a squall and is limping in with the mast sprung. The master wants silver for a new spar, and he wants it today.',
    choices: [
      { t: 'Pay for the best spar in the yard', r: '{ship} is out again in a fortnight, and faster than before. The master tells it in every tavern.', fx: { coin: -15, fame: 1, named: { kind: 'ship', deed: 'Came home through the squall off the point, {year}' } } },
      { t: 'Haggle him down', check: { s: 'trade', s2: 'int', d: 45 },
        win: { r: 'A sound spar at half the price. The master calls you something under his breath and takes it.', fx: { coin: -6, named: { kind: 'ship', deed: 'Came home through the squall off the point, {year}' } } },
        lose: { r: 'Too cheap a spar. It cracks in the next blow and the season\'s catch goes with it.', fx: { coin: -14, happy: -2 } } },
    ] },

  // ---- the epithet, the day it sticks (identity's month hook queues it)
  { id: 'ix_epithet', title: 'What they call you', trigger: true,
    cond: (p, C) => C.age(p) >= 10,
    setup: (p, ctx) => { if (!ctx.ep) { if (p.epithet) ctx.ep = String(p.epithet); else ctx.skip = true; } },
    text: 'You hear it first from a boy carrying water, and then from a woman at the stall, not meaning you to hear: {ep}. By the end of the month it is what strangers call you, and what your friends call you to annoy you.',
    choices: [
      { t: 'Answer to it', r: 'You answer to it. A name like that is worth something on the road.', fx: { fame: 2, happy: 1 } },
      { t: 'Tell them your name is your name', check: { s: 'intimidation', s2: 'wil', d: 50 },
        win: { r: 'They stop saying it to your face. They say it everywhere else.', fx: { wil: 1, honor: 1 } },
        lose: { r: 'Which only makes it stick faster. Now there is a song.', fx: { fame: 3, happy: -2 } } },
    ] },

  // ---- thoughts offered by the life you lead (part 3: held for months, they ripen into a trait)
  { id: 'ix_th_barn', title: 'The lord\'s barn', w: 1, once: true,
    cond: (p, C) => C.age(p) >= 13 && (C.poor(p) || C.unfree(p)) && thOpen(p, 'barn'),
    text: 'The second hungry spring running. You carry the tithe sacks up to the lord\'s barn and see it is full to the rafters with last year\'s grain, going musty. The steward sees you looking.',
    choices: [
      { t: 'Hold the thought: the lord\'s barn is always full', r: 'You do not say it. You think it, every day, carrying the sacks up the hill.', fx: { thought: 'barn', skill: { intrigue: 1 } } },
      { t: 'Let it pass. Lords have their reasons', r: 'You put it from your mind and sleep better for it.', fx: { happy: 2, need: { rest: 5 } } },
    ] },
  { id: 'ix_th_steel', title: 'After the fighting', w: 1, once: true,
    cond: (p, C) => C.age(p) >= 15 && (p.kills || 0) >= 2 && thOpen(p, 'steel'),
    text: 'The argument went on for an hour before the fighting, and for a moment after it nobody argued at all. You notice how quiet it is. You notice that you like it.',
    choices: [
      { t: 'Hold the thought: steel answers what words cannot', r: 'You turn it over in the long nights after. It sits easily. That should worry you more than it does.', fx: { thought: 'steel', skill: { melee: 1 } } },
      { t: 'Let it pass, and wash your hands', r: 'You scrub until your knuckles are raw, and go to the priest, and talk about the weather with him.', fx: { piety: 2, happy: 1 } },
    ] },
  { id: 'ix_th_seed', title: 'Coin in the hand', w: 1, once: true,
    cond: (p, C) => C.adult(p) && (C.job(p, 'merchant') || C.skill(p, 'trade') >= 20 || C.ownShop(p)) && thOpen(p, 'seed'),
    text: 'An old moneylender at the fair says he never spent a sun he could have planted, and that this is the whole secret. His coat is shabby. His house, you hear, has eleven windows of glass.',
    choices: [
      { t: 'Hold the thought: every coin is a seed', r: 'You start counting differently: not what a thing costs, but what it would have grown into.', fx: { thought: 'seed', skill: { trade: 1 } } },
      { t: 'Let it pass, and buy a round', r: 'You buy the old man a drink, which he lets you do. Money is for spending, now and then.', fx: { coin: -2, happy: 3, need: { company: 6 } } },
    ] },
  { id: 'ix_th_silence', title: 'No answer', w: 1, once: true,
    cond: (p, C) => C.age(p) >= 14 && !C.parentsAlive(p) && thOpen(p, 'silence'),
    text: 'You prayed for it to go otherwise, and it did not. The priest says the gods heard. Walking home past the graves you wonder what hearing is worth, if nothing comes of it.',
    choices: [
      { t: 'Hold the thought: the gods keep their own counsel', r: 'You still go to the temple. You stop expecting anything there, and look harder everywhere else.', fx: { thought: 'silence', skill: { learning: 1 } } },
      { t: 'Let it pass. Pray harder', r: 'You light a candle every week for a year. It helps, a little, which is all a candle can do.', fx: { piety: 3, coin: -1 } },
    ] },
  { id: 'ix_th_blood', title: 'Old names', w: 1, once: true,
    cond: (p, C) => C.age(p) >= 13 && C.noble(p) && thOpen(p, 'blood'),
    text: 'In the long gallery your grandfather\'s grandfather looks down from his frame with your own chin. The steward tells you which towns that man burned, and says it as if it were praise.',
    choices: [
      { t: 'Hold the thought: blood remembers', r: 'You walk the gallery often after that, learning the faces, and what each one took.', fx: { thought: 'blood', skill: { etiquette: 1 } } },
      { t: 'Let it pass. They are paint and oil', r: 'You leave the steward to his dead. There is a dog in the yard that wants walking.', fx: { happy: 2, skill: { persuasion: 1 } } },
    ] },
  { id: 'ix_th_road', title: 'Another road', w: 1, once: true,
    cond: (p, C) => C.age(p) >= 15 && A.realmsSeen(p) >= 3 && thOpen(p, 'road'),
    text: 'You wake in a strange bed and for a moment do not know which town you are in, and you find you do not mind. The road outside is already busy. It goes on past the hill.',
    choices: [
      { t: 'Hold the thought: the road is the only home', r: 'You stop buying things too heavy to carry. You start to sleep well anywhere.', fx: { thought: 'road', skill: { survival: 1 } } },
      { t: 'Let it pass, and think of home', r: 'You write a letter home that evening, which says nothing much and means a great deal.', fx: { happy: 2, need: { comfort: 6 } } },
    ] },
  { id: 'ix_th_nobody', title: 'Nobody came', w: 1, once: true,
    cond: (p, C) => C.age(p) >= 9 && C.age(p) <= 30 && (C.poor(p) || !C.parentsAlive(p)) && thOpen(p, 'nobody'),
    text: 'You waited at the crossroads until dark for the cart that was meant to come. It did not come. You walked the eleven miles home on your own, and nothing ate you.',
    choices: [
      { t: 'Hold the thought: no one is coming to save you', r: 'It is a cold thought, and it keeps you warm in its way. You stop waiting at crossroads.', fx: { thought: 'nobody', skill: { survival: 1 } } },
      { t: 'Let it pass. Next time they will come', r: 'The next time, they do. You decide to remember that one instead.', fx: { happy: 2 } },
    ] },
  { id: 'ix_th_promise', title: 'A word given', w: 1, once: true,
    cond: (p, C) => C.age(p) >= 13 && C.trait(p, 'honest') && thOpen(p, 'promise'),
    text: 'You promised a man a thing in spring, carelessly, and by autumn keeping it will cost you dear. He has not mentioned it. He would not hold you to it, you think. You would know, though.',
    choices: [
      { t: 'Hold the thought: a promise is a debt', r: 'You keep it, and it costs what you thought. After that you promise less, and mean it all.', fx: { thought: 'promise', skill: { persuasion: 1 }, coin: -4 } },
      { t: 'Let it pass. He has forgotten', r: 'He has not forgotten. He is only too polite to say. You are both polite about it for years.', fx: { coin: 2 } },
    ] },
  { id: 'ix_th_kindness', title: 'The harder thing', w: 1, once: true,
    cond: (p, C) => C.age(p) >= 13 && (C.trait(p, 'kind') || C.trait(p, 'generous')) && thOpen(p, 'kindness'),
    text: 'A boy stole bread from you and you caught him. Everyone in the lane waited to see you beat him. You gave him the rest of the loaf instead, and the lane did not know what to make of it.',
    choices: [
      { t: 'Hold the thought: kindness is the harder strength', r: 'It is harder. You are surprised how often it works anyway.', fx: { thought: 'kindness', skill: { persuasion: 1 } } },
      { t: 'Let it pass. It was only bread', r: 'Only bread. You forget about it. The boy does not.', fx: { honor: 1 } },
    ] },
  { id: 'ix_th_fear', title: 'Afterwards', w: 1, once: true,
    cond: (p, C) => C.age(p) >= 12 && (p.wounds || []).length > 0 && thOpen(p, 'fear'),
    text: 'You were sure, for a long moment, that you were going to die. You did not. Now the fear comes back at odd hours, smaller each time, and you have started to listen to what it says.',
    choices: [
      { t: 'Hold the thought: fear is a teacher', r: 'You learn its voice. It speaks earlier now, and you hear it, and go on anyway.', fx: { thought: 'fear', skill: { athletics: 1 } } },
      { t: 'Let it pass. Drink until it goes', r: 'It goes, mostly. The ale costs what ale costs.', fx: { coin: -3, happy: 2, need: { rest: 5 } } },
    ] },
  { id: 'ix_th_sea', title: 'Green water', w: 1, once: true,
    cond: (p, C) => C.age(p) >= 13 && C.coast(p) && C.skill(p, 'sea') >= 15 && thOpen(p, 'sea'),
    text: 'A wave came over the side and took your feet and the rail held you. Spitting salt, you think: it did not mean you. It does not mean anyone. It is only water doing what water does.',
    choices: [
      { t: 'Hold the thought: the sea does not hate you', r: 'The fear goes out of your hands on the ropes. The old hands see it, and say nothing.', fx: { thought: 'sea', skill: { sea: 1 } } },
      { t: 'Let it pass. Make an offering anyway', r: 'You drop a copper over the side at the harbour mouth, like everybody does.', fx: { piety: 2, coin: -1 } },
    ] },
  { id: 'ix_th_costume', title: 'Under the fur', w: 1, once: true,
    cond: (p, C) => C.adult(p) && !C.noble(p) && (C.office(p) || C.skill(p, 'etiquette') >= 20) && thOpen(p, 'costume'),
    text: 'You saw the great lord without his chain, in the garderobe passage, cursing a stuck door like a carter. Back in the hall with the chain on, he was a lord again. It was very well done.',
    choices: [
      { t: 'Hold the thought: rank is a costume', r: 'You stop bowing quite so low inside, whatever your back does.', fx: { thought: 'costume', skill: { deception: 1 } } },
      { t: 'Let it pass. Some men are born to it', r: 'You bow as low as ever. It is easier.', fx: { happy: 1, skill: { etiquette: 1 } } },
    ] },
  { id: 'ix_th_children', title: 'Small hands', w: 1, once: true,
    cond: (p, C) => C.adult(p) && C.hasKids(p) && thOpen(p, 'children'),
    text: 'Your child copies the way you hold a spoon, and the way you say "well, then" before a hard thing. You had not known you said it. You hear it now in a smaller voice.',
    choices: [
      { t: 'Hold the thought: children are the only deed that lasts', r: 'You start to watch what you do in front of them, which means watching what you do.', fx: { thought: 'children', skill: { learning: 1 } } },
      { t: 'Let it pass, and laugh about it', r: 'You laugh, and the child laughs, and neither of you knows why.', fx: { happy: 3, need: { company: 6 } } },
    ] },
  { id: 'ix_th_ink', title: 'In your own hand', w: 1, once: true,
    cond: (p, C) => C.age(p) >= 12 && C.literate(p) && thOpen(p, 'ink'),
    text: 'You find a note in your own hand from three years back, and it says the opposite of what you remember. You were sure. The ink is sure too, and the ink was there.',
    choices: [
      { t: 'Hold the thought: write it down or it is lost', r: 'You keep a little book after that. It argues with your memory and usually wins.', fx: { thought: 'ink', skill: { learning: 1 }, coin: -1 } },
      { t: 'Let it pass. Memory is good enough', r: 'You burn the note in the stove. It is easier to be sure.', fx: { happy: 1, wil: 0.3 } },
    ] },
  { id: 'ix_th_faces', title: 'What he wanted', w: 1, once: true,
    cond: (p, C) => C.adult(p) && (C.skill(p, 'intrigue') >= 15 || C.office(p)) && thOpen(p, 'faces'),
    text: 'The man who was so kind to you all winter asks his favour in spring. It is a large one. Looking back you can see every kindness laid down like a coin on a counter.',
    choices: [
      { t: 'Hold the thought: every face hides a ledger', r: 'You start keeping a ledger of your own, in your head, with a column for everyone.', fx: { thought: 'faces', skill: { intrigue: 1 } } },
      { t: 'Let it pass, and do the favour', r: 'You do it. He was kind, whatever the reason. That counts.', fx: { honor: 1, coin: -3 } },
    ] },
  { id: 'ix_th_tools', title: 'The knee', w: 1, once: true,
    cond: (p, C) => C.age(p) >= 30 && (C.soldier(p) || ['farm', 'labor', 'smith', 'mason', 'herd'].some(k => C.job(p, k))) && thOpen(p, 'tools'),
    text: 'Your knee has started to tell the weather. The old man at the forge says the body is a tool like any other: look after it and it lasts, use it like a borrowed one and it breaks.',
    choices: [
      { t: 'Hold the thought: the body is a tool, and tools wear', r: 'You start stretching in the mornings like the old man. The others laugh until their own knees go.', fx: { thought: 'tools', skill: { medicine: 1 } } },
      { t: 'Let it pass. Work through it', r: 'You work through it. The knee complains, and you complain back, and the work gets done.', fx: { coin: 3, health: -1, cause: 'a bad knee' } },
    ] },

  // ---- a thought pressed on you by someone you trust (their trait picks it)
  { id: 'ix_th_friend', title: 'Something {them} said', w: 1, cool: 10,
    cond: (p, C) => C.age(p) >= 13 && C.hasRel(p, 'friend', 'bestfriend', 'mentor', 'spouse', 'lover'),
    setup: (p, ctx) => {
      const ids = Object.keys(p.rel || {}).filter(id => { const t = A.P(id), r = p.rel[id]; return t && t.alive && r && ['friend', 'bestfriend', 'mentor', 'spouse', 'lover'].includes(r.type); });
      for (let i = 0; i < ids.length; i++) {
        const id = ids[(ID.hash(p.id + '|thf|' + A.S.year) + i) % ids.length], t = A.P(id);
        const th = (t.traits || []).map(x => ID.THOUGHT_OF_TRAIT[x]).find(k => k && thOpen(p, k));
        if (th) { ctx.pid = id; ctx.th = th; ctx.thName = ID.THOUGHTS[th].name; ctx.thLow = ID.THOUGHTS[th].name.toLowerCase(); return; }
      }
      ctx.skip = true;
    },
    text: '{them} says it while you are both doing something else, as if it were obvious: "{thName}." {them} has lived by it a long while, by the look of things. It has stuck to you since, like a burr.',
    choices: [
      { t: 'Hold the thought, as {them} does', r: 'You turn it over for weeks. Some days it fits you, and some days it chafes.', fx: { thought: 'ctx', them: { op: 4 } } },
      { t: 'Argue {them} out of it', check: { s: 'persuasion', s2: 'int', d: 46 },
        win: { r: 'It is a good argument, the best you have made. {them} laughs and says you may be right.', fx: { skill: { persuasion: 1 }, happy: 2 } },
        lose: { r: 'You lose the argument, and the thought sticks anyway, in its own time.', fx: { them: { op: -2 }, wil: 0.3 } } },
    ] },
]);
})();
