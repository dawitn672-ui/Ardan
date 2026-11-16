// Across the world (the two halves joined): the Silk Road's chain of hands, an eastern merchant in Kraoth, the
// Broker's Silence and the tales each end tells of the other, travellers who cross, and the threads the lore runs
// between the halves (the Long Count and the western calendar, the Old Mare's hides and the western orcs, the
// Long Carry to Skyhold, the Drevnan trappers, Emberdeep's knives on the Rainwall, Kesh's ships on the Coral Coast,
// the Hadun wells, Ranpur's pale elephants, Zanara's pillar at Mosandi).
// A Known World home hears of the east only in a Great Continent game (C.greatWorld); a Known World game never
// meets these events. Flags set here start fv_x_.
(() => {
  const F = A.FV;
  A.defEvents([
    {
      id: "fv_x_chain_of_hands",
      title: "Nine hands to the west",
      cond: (p, C) => C.land(p, "R", "B", "F") && C.adult(p) && (C.job(p, "merchant") || C.rich(p)),
      w: 2, once: true,
      text: "A bale of Delta silk passes through nine hands between Venshai and the orc toll-city of Kraoth, and each hand doubles the price and halves what it knows of the next. You have only ever sold to the next hand west. A Gap horse-dealer says that for the price of a good camel train you could send your own factor three hands further, past the Nine Wells' brokers.",
      choices: [
        { t: "Send a factor west past the Wells", r: "Your factor goes west with silk and a letter of credit. You will hear from him in two years, or never.", fx: { coin: -80, flag: "fv_x_factor", skill: { trade: 2 } } },
        { t: "Sell to the next hand, as always", r: "The next hand pays what the next hand pays. You never learn what happens to your silk.", fx: { coin: 30 } },
        { t: "Ask the dealer what lies at the far end", r: "\"Orcs,\" he says, \"and iron-ringed men who eat their dead, the brokers say.\" He grins. He has been to Kraoth.", fx: { skill: { learning: 1 }, flag: "fv_x_heard_west" } },
      ],
    },
    {
      id: "fv_x_factor_back",
      title: "The factor comes back",
      cond: (p, C) => C.farLand(p) && C.adult(p) && C.flag(p, "fv_x_factor") && A.S.year - p.flags.fv_x_factor >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { F.make(p, ctx, { sex: "M", age: 40, occ: "your factor on the western road", status: "merchant" }); },
      text: p => `Your factor {them} is back after ${F.ago(p, "fv_x_factor")}, thinner, with a western sword and a bag of silver stamped with a sun and an orc's tusk. He sold your silk in Kraoth for eight times the Venshai price. The Nine Wells' men followed him the whole way home and spoke to him at every well. He has not decided yet what he told them.`,
      choices: [
        { t: "Pay him his share and send him again", r: "He takes his share and goes west again in spring. The Wells' brokers send you a melon, which is the size of a threat.", fx: { coin: 120, them: { op: 20 }, flag: "fv_x_west_road" } },
        { t: "Pay him and tell him never to speak of it", r: "He keeps his share and his silence. The Wells leave you alone, and you never send another.", fx: { coin: 90, honor: 1 } },
        { t: "Sell his route to the League of the Wells", r: "The League pays well for routes. Your factor leaves your service the same week.", fx: { coin: 150, honor: -4, them: { type: "enemy", op: -30 } } },
      ],
    },
    {
      id: "fv_x_kraoth_easterner",
      title: "A man from the felt lands",
      cond: (p, C) => C.greatWorld(p) && !C.farLand(p) && C.adult(p) && (C.job(p, "merchant") || C.rich(p)) && C.realm(p, "POL-34", "POL-11", "POL-12", "POL-17", "POL-19"),
      w: 2, once: true,
      setup: (p, ctx) => { F.make(p, ctx, { sex: "M", age: 35, occ: "merchant from beyond the Long Grass", status: "merchant" }); },
      text: "In Kraoth's market, where silk comes in from the east through the orc toll-keepers, a man in a pointed felt hat with ear-flaps is selling silk himself, bolt by bolt, for half what the brokers ask. {them} speaks the Gap's trade-talk and a little orcish. The brokers' agents are watching his stall and writing in small books.",
      choices: [
        { t: "Buy his whole stock", r: "You pay half the brokers' price. By the end of the week his stall is empty, and he is gone, and nobody will say where.", fx: { coin: 60, flag: "fv_x_east_silk" } },
        { t: "Buy a bolt and ask about his road", r: "He tells you about a city where twenty thousand men are sealed in brick cells to write. You do not believe him, and buy him a drink.", fx: { coin: -10, them: { type: "friend", op: 20 }, flag: "fv_x_heard_east", skill: { learning: 1 } } },
        { t: "Tell the brokers' agents his lodging", r: "The agents thank you. He does not open his stall the next morning.", fx: { coin: 25, honor: -5, them: { type: "enemy", op: -30 } } },
      ],
    },
    {
      id: "fv_x_sunrise_tales",
      title: "Tales of the sunrise",
      cond: (p, C) => C.greatWorld(p) && !C.farLand(p) && C.adult(p),
      w: 2, once: true,
      text: "A ballad-seller by the shrine steps has a new sheet: tales of the far east, bought, he swears, from a broker of the deep sands. Silk grows on trees there, in a land of dog-headed men who bark their prayers. He sells it for a copper. A Kraoth caravan guard by the stall laughs and says the east is full of clerks, not dogs.",
      choices: [
        { t: "Buy the sheet and believe it", r: "You read it by the fire to the family. The children bark at each other for a week.", fx: { coin: -1, happy: 3, flag: "fv_x_heard_east" } },
        { t: "Ask the guard what he has seen", check: { s: "persuasion", s2: "int", d: 45 },
          win: { r: "Clerks, he says, and paper money, and a wall with towers lit every night. He has the burn of a felt-hatted man's bow on his arm.", fx: { skill: { learning: 2 }, flag: "fv_x_heard_east" } },
          lose: { r: "He has had enough of questions and walks off. The ballad-seller sells you a second sheet out of pity.", fx: { coin: -1 } } },
        { t: "Laugh at both of them", r: "Dog-headed men, clerks, it is all the same to you, and to your harvest.", fx: { wil: 1 } },
      ],
    },
    {
      id: "fv_x_eat_their_dead",
      title: "Iron-ringed savages",
      cond: (p, C) => C.farLand(p) && C.adult(p),
      w: 2, once: true,
      text: "A storyteller in the market is reading the Sunset Tales from a printed book: the west is a cold waste of iron-ringed savages who eat their dead and have no letters. The crowd loves it. A woman at the back says her brother met a western man at Ozand once, and he had letters, and did not eat anyone.",
      choices: [
        { t: "Believe the book", r: "Printed books do not lie, everyone knows. You buy a copy for the children.", fx: { coin: -3, happy: 2, flag: "fv_x_heard_west" } },
        { t: "Ask the woman about her brother", r: "He said the westerner wore iron rings on his mail, not his nose, and prayed to a weighing god. It is not as good a story.", fx: { skill: { learning: 1 }, flag: "fv_x_heard_west" } },
        { t: "Say aloud the tales are the brokers' lies", r: "The crowd turns on you. The storyteller has a League stamp on his book, and a friend in the crowd with a cudgel.", fx: { honor: 2, wound: "broken_nose" } },
      ],
    },
    {
      id: "fv_x_westerner_arrives",
      title: "A westerner at the gate",
      cond: (p, C) => C.farLand(p) && C.adult(p),
      w: 2, once: true,
      setup: (p, ctx) => { F.make(p, ctx, { sex: "M", age: 30, occ: "traveller from the far west" }); },
      text: "A man rides in who is like nobody here: pale, with grey eyes and a mail shirt of iron rings, speaking the Gap's trade-talk badly. {them} says he has come from the far end of the silk road, and asks for a roof. The magistrate's men have seen him. So have the children, who are waiting to see whether he eats anyone.",
      choices: [
        { t: "Give him a roof and hear his story", r: "He stays a week. He has letters, a god who weighs souls, and a wife at home he talks about too much.", fx: { honor: 2, them: { type: "friend", op: 25 }, flag: "fv_x_hosted_west" } },
        { t: "Feed him and send him on", r: "He eats, thanks you in three tongues, and rides east toward the coast.", fx: { coin: -5, piety: 1, flag: "fv_x_hosted_west" } },
        { t: "Report him to the magistrate", r: "The magistrate questions him for a week and sends him to the capital in a cart. Nobody hears of him again.", fx: { favor: 3, honor: -3, them: { type: "enemy", op: -30 } } },
      ],
    },
    {
      id: "fv_x_tales_answered",
      title: "You have met one",
      cond: (p, C) => C.farLand(p) && C.adult(p) && C.flag(p, "fv_x_hosted_west") && C.flag(p, "fv_x_heard_west") && A.S.year - p.flags.fv_x_hosted_west >= 1,
      w: 3, once: true,
      text: "The storyteller is back in the market with the Sunset Tales, the part about the westerners who eat their dead. You have had a westerner under your roof. He ate rice and mutton and talked about his wife. Your neighbours know you hosted him, and they are looking at you, waiting to see whether you say so.",
      choices: [
        { t: "Tell the crowd what he was like", check: { s: "persuasion", s2: "wil", d: 50 },
          win: { r: "They listen. Half of them believe you. The storyteller loses his crowd and glares at you over his book.", fx: { fame: 2, honor: 2, newRel: { type: "rival", op: -10 } } },
          lose: { r: "They laugh: you were fooled by a westerner, the tales say they are cunning. You go home red.", fx: { happy: -3 } } },
        { t: "Say nothing and let them enjoy it", r: "The crowd enjoys it. You enjoy knowing better, which is a small, mean pleasure.", fx: { wil: 1 } },
        { t: "Buy the storyteller's book and burn it", r: "He sells it gladly; he has twenty more. The League prints them by the hundred.", fx: { coin: -10, honor: 1 } },
      ],
    },
    {
      id: "fv_x_two_counts",
      title: "Two counts of years",
      cond: (p, C) => C.land(p, "R") && C.adult(p) && C.literate(p),
      w: 2, once: true,
      setup: (p, ctx) => { F.make(p, ctx, { sex: "M", age: 45, occ: "western traveller with a calendar" }); },
      text: "At Hauden the Long Count has written the year, the day and the noon shadow without a break since 640 before the Return. A western traveller, {them}, has a calendar of his Temple's, counted from the Return itself. You lay the two side by side out of curiosity. The Count's six dim summers fall six years before the western Return. They should fall just before it.",
      choices: [
        { t: "Show it to a clerk of the Long Count", r: "The clerk looks for an hour and goes pale. He thanks you and takes your name. Nobody in Hauden knew the western calendar existed.", fx: { secret: 1, fame: 2, flag: "fv_x_two_counts" } },
        { t: "Copy both counts and keep the copy", r: "You fold the copy into your book of the classics. Six years is a long time to be wrong by.", fx: { secret: 1, skill: { learning: 2 }, flag: "fv_x_two_counts" } },
        { t: "Tell the traveller his Temple is wrong", r: "He laughs, then stops laughing when he sees the shadow tables. He leaves for the west early.", fx: { them: { op: -10 }, skill: { learning: 1 }, flag: "fv_x_two_counts" } },
      ],
    },
    {
      id: "fv_x_count_rites",
      title: "The Board of Rites asks",
      cond: (p, C) => C.land(p, "R") && C.adult(p) && C.flag(p, "fv_x_two_counts") && A.S.year - p.flags.fv_x_two_counts >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { F.make(p, ctx, { sex: "M", age: 50, occ: "officer of the Board of Rites", status: "gentry" }); },
      text: "An officer of the Board of Rites, {them}, calls on you. The Board's own calendar was corrected by six years in 466 and the correction buried. He does not say so. He asks, very pleasantly, for your copy of the two counts you laid side by side, and whether anyone else has seen it.",
      choices: [
        { t: "Give him the copy", r: "He thanks you warmly and burns it in your brazier before he leaves. You are given a minor office the next spring.", fx: { favor: 5, honor: -2 } },
        { t: "Say it is lost", check: { s: "deception", s2: "wil", d: 55 },
          win: { r: "He does not believe you, and cannot prove anything. Your copy stays in the book of classics.", fx: { secret: 1, skill: { deception: 2 } } },
          lose: { r: "His men search your house while you take tea. They find the copy. You are fined for keeping a false calendar.", fx: { coin: -40, honor: -2, them: { type: "enemy", op: -20 } } } },
        { t: "Send the copy to Hauden first", r: "You had it sent to the College of the Long Count a month ago. He goes white. Both empires have sworn to leave Hauden alone.", fx: { honor: 4, favor: -6, them: { type: "enemy", op: -30 } } },
      ],
    },
    {
      id: "fv_x_lamp_monk_west",
      title: "What do you carry?",
      cond: (p, C) => C.greatWorld(p) && !C.farLand(p) && C.adult(p),
      w: 2, once: true,
      setup: (p, ctx) => { F.make(p, ctx, { sex: "M", age: 50, occ: "monk of the Two Lamps from the east" }); },
      text: "A monk in a patched robe with two small lamps hung from his staff has walked from the east, further than anyone in the village has heard of. His teaching says a Second Bearer will come from the west carrying a lamp no one can name, and his abbey asks every western traveller what he carries. {them} has come to ask it at the source. He asks you.",
      choices: [
        { t: "Tell him of your own faith", r: "He listens closely and writes it in a script that looks like falling rain. He thanks you as if you had given him gold.", fx: { piety: 2, them: { type: "friend", op: 20 }, flag: "fv_x_lamp_asked" } },
        { t: "Show him a lantern and joke", r: "He laughs politely. He has heard that joke in every village since the Gap.", fx: { happy: 1 } },
        { t: "Take him to the priest", r: "The priest and the monk talk for a night. In the morning the priest is thoughtful and the monk is gone, east again.", fx: { piety: 1, favor: 1, flag: "fv_x_lamp_asked" } },
      ],
    },
    {
      id: "fv_x_old_mare_messenger",
      title: "The foals who went west",
      cond: (p, C) => C.greatWorld(p) && !C.farLand(p) && C.race(p, "orc", "halforc") && C.adult(p),
      w: 3, once: true,
      setup: (p, ctx) => { F.make(p, ctx, { race: "orc", sex: "F", age: 45, occ: "messenger of the Old Mare clans" }); },
      text: "An orc of the far east has come west with a painted hide rolled under her arm: {them}, messenger of the Old Mare clans, who stayed on the Elder Grass when the sixty clans walked west. Their winter-counts are three thousand years old. She wants to compare your clan's sign for the Walk with theirs. By her face, she already knows yours is drawn wrong.",
      choices: [
        { t: "Bring your clan's oldest sign", r: "She spreads her hide beside it. The signs are almost the same, and she says so, grudgingly, which in the Old Mare is warm praise.", fx: { fame: 2, honor: 2, them: { type: "friend", op: 20 } } },
        { t: "Ask what her hides say of your clan", check: { s: "persuasion", s2: "int", d: 50 },
          win: { r: "They name the mother who led your clan west, which nobody here knew. You carry the name home like a coal.", fx: { secret: 1, piety: 3, skill: { learning: 1 } } },
          lose: { r: "She says the western clans lost their way and their mothers' names with it. Then she spits.", fx: { happy: -3, them: { op: -10 } } } },
        { t: "Tell her the west is the true grass now", r: "She rolls up her hide. The foals who went west will come home when the grass calls, she says. Not before.", fx: { honor: 1, them: { type: "rival", op: -15 } } },
      ],
    },
    {
      id: "fv_x_skyhold_letter",
      title: "A letter over the ice",
      cond: (p, C) => C.greatWorld(p) && C.realm(p, "POL-27") && C.adult(p),
      w: 3, once: true,
      text: "A yak-man of the Ice Shoulders has come down to Skyhold, which none living has seen happen, with a letter sealed in red felt. It is from an abbey called Gyokar on the far side of the ice, and it is addressed to Skyhold's abbot. It has taken two years. The abbot's steward needs someone to feed the yak-man and keep him from talking in the town until the abbot decides.",
      choices: [
        { t: "Take the yak-man into your house", r: "He eats your barley for a week and teaches your children three words of his tongue. The abbot sends for him at last.", fx: { coin: -10, honor: 2, newRel: { type: "friend", op: 20 }, flag: "fv_x_ice_letter" } },
        { t: "Ask the yak-man what the letter says", check: { s: "persuasion", s2: "ins", d: 50 },
          win: { r: "He cannot read it, but he knows what Gyokar's monks said: they know the Red Stair, and they call our abbot theirs too.", fx: { secret: 1, flag: "fv_x_ice_letter" } },
          lose: { r: "He shrugs. He carries letters; he does not open them.", fx: { happy: -1 } } },
        { t: "Tell the town about the letter", r: "By evening every pilgrim at the inns has a version. The steward never asks you to keep anything again.", fx: { fame: 2, favor: -4 } },
      ],
    },
    {
      id: "fv_x_drevna_uncle",
      title: "Over the pines in 1093",
      cond: (p, C) => C.greatWorld(p) && C.realm(p, "POL-26", "POL-25") && C.adult(p),
      w: 2, once: true,
      setup: (p, ctx) => { F.make(p, ctx, { sex: "M", age: 50, occ: "fur trader from the east" }); },
      text: "Two trappers of your country went east over the pines in 1093 with furs tallied at Lubany, and never came back. A fur trader from beyond the forest, {them}, drinking in the harbour, says he has seen Lubany tally-stamps on furs in a prince's storehouse at Peryvor, far to the east, where westerners are not welcome.",
      choices: [
        { t: "Tell the trappers' families", r: "The families come to the harbour to hear him. One widow asks him to carry a letter east. He says he will try.", fx: { honor: 3, newRel: { type: "friend", op: 15 }, flag: "fv_x_peryvor_furs" } },
        { t: "Ask him how to get to Peryvor", check: { s: "persuasion", s2: "int", d: 48 },
          win: { r: "He draws the road on the table in beer: rivers, a lake, a bell. It is a long way.", fx: { skill: { survival: 1 }, flag: "fv_x_peryvor_furs", secret: 1 } },
          lose: { r: "He decides he has said too much and leaves without finishing his beer.", fx: { them: { op: -10 } } } },
        { t: "Say nothing; the dead are dead", r: "He drinks on. The stamps stay in the prince's storehouse a world away.", fx: { piety: 1 } },
      ],
    },
    {
      id: "fv_x_emberdeep_knife",
      title: "A knife from the west",
      cond: (p, C) => C.land(p, "M") && C.adult(p) && C.realm(p, "POL-94", "POL-108", "POL-106"),
      w: 3, once: true,
      text: "Two ridges of the Rainwall trade salt with the stockaded posts on the High Wastes' fringe, for iron knives stamped with the marks of western smiths. It is the only land contact between the south and the far west, and few know it. A post-keeper offers you a knife with a hammer-and-flame mark for two tubes of salt. It is the best iron you have held.",
      choices: [
        { t: "Trade the salt for the knife", r: "Two tubes of salt. The knife takes an edge like water and never loses it.", fx: { coin: -10, skill: { dagger: 1 }, flag: "fv_x_western_iron" } },
        { t: "Ask where the mark comes from", r: "\"Under a mountain, far west,\" he says. \"Short men. Good iron. They do not come here themselves.\"", fx: { skill: { learning: 1 }, flag: "fv_x_western_iron" } },
        { t: "Carry salt to the posts yourself next season", check: { s: "survival", s2: "sta", d: 54 },
          win: { r: "Nine days over the rain ridges. The post is real, and so are its miners, who speak a tongue full of stones.", fx: { coin: 20, skill: { survival: 2 }, deed: "Walked the Rainwall to the western posts" } },
          lose: { r: "The rains catch you on the fifth ridge. You turn back with fever.", fx: { health: -10, wound: "lungs" } } },
      ],
    },
    {
      id: "fv_x_kesh_south",
      title: "Paid to forget",
      cond: (p, C) => C.greatWorld(p) && C.realm(p, "POL-21") && C.adult(p) && (C.job(p, "sailor") || C.job(p, "merchant") || C.job(p, "pirate")),
      w: 3, once: true,
      setup: (p, ctx) => { F.make(p, ctx, { sex: "M", age: 55, occ: "speaker of the Coral Coast harbours", status: "merchant" }); },
      text: "Blown south past the last known cape, your ship comes into a harbour of coral-stone towns with Well halls on the shore. Keshi ships have reached this coast three times in a century, the townsmen say, and the League keeps the visits off its records. {them}, speaker of the harbours, offers you a full hold of ivory to sail home and forget the way.",
      choices: [
        { t: "Take the ivory and forget", r: "You sail home rich, and tell the harbour you were blown about and found nothing. The captains who came before you said the same.", fx: { coin: 120, honor: -2, flag: "fv_x_coral_coast" } },
        { t: "Refuse, and mark the way on your chart", r: "They let you go. A Coral Coast boat follows you north for three days, to see where you turn.", fx: { secret: 1, fame: 2, them: { type: "rival", op: -20 }, flag: "fv_x_coral_coast" } },
        { t: "Ask to trade openly every year", check: { s: "diplomacy", s2: "int", d: 56 },
          win: { r: "The speaker thinks for a day. One ship a year, quietly, to his own harbour only. It is a beginning.", fx: { coin: 40, skill: { diplomacy: 2 }, them: { type: "friend", op: 20 }, flag: "fv_x_coral_coast" } },
          lose: { r: "He says the League has paid Keshi captains for a century to stay away, and will pay you too, or worse.", fx: { coin: 30, them: { op: -10 } } } },
      ],
    },
    {
      id: "fv_x_hadun_toll",
      title: "The guide law",
      cond: (p, C) => (C.greatWorld(p) && C.realm(p, "POL-19")) || C.realm(p, "POL-152"),
      w: 3, once: true,
      text: p => p.realm === "POL-152"
        ? "Your clan's wells are linked to the Sand Clans' wells far to the north by a guide law older than either people. Each year the Hadun pay a northern guide-clan a toll that the Sand Clans' Speaker at Zarak has never been told about. This year the guide-clan's man has come south himself, and wants the toll doubled."
        : "Your guide-clan collects a toll every year from veiled salt-men far to the south, beyond the last wells anyone at Zarak has mapped, under a guide law older than the Speaker. Nobody at Zarak knows. This year it is your turn to ride south for it, and the veiled men have sent word they will pay only half.",
      choices: [
        { t: "Keep the old toll as it was", r: "The old toll is paid and the old law kept. Neither Zarak nor the Hadun drums hear of it.", fx: { honor: 2, coin: 10 } },
        { t: "Press the other side hard", check: { s: "intimidation", s2: "wil", d: 52 },
          win: { r: "You get your way. The wells will be watched more closely next year.", fx: { coin: 30, newRel: { type: "rival", op: -15 } } },
          lose: { r: "The other side walks away from the well. For a season nobody pays, and both clans' caravans go thirsty.", fx: { coin: -20, health: -4 } } },
        { t: "Tell your Speaker about the guide law", r: "The Speaker is astonished and annoyed in equal parts. The toll is taxed from next year.", fx: { favor: 4, honor: -2 } },
      ],
    },
    {
      id: "fv_x_white_herd",
      title: "The western herd",
      cond: (p, C) => (C.greatWorld(p) && C.realm(p, "POL-30")) || C.realm(p, "POL-96", "POL-107"),
      w: 3, once: true,
      setup: (p, ctx) => { F.make(p, ctx, { sex: "M", age: 60, occ: "priest of the Sleeper's temples" }); },
      text: p => p.realm === "POL-30"
        ? "A priest from far beyond the Rainwall, {them}, has come over the passes to Ranpur's Elephant Hills. His temple keeps a book: about three hundred years before the Return, its priests led a white elephant west to found a temple in a new kingdom. He asks to see Ranpur's pale elephants, and the one called Moon-Pearl above all."
        : "The temple at Dvaarnath keeps the Book of the Western Herd: its priests once led a white elephant west over the Rainwall to found a temple in a new kingdom. {them}, an old priest, means to walk west after her line before he dies. He wants a companion who can handle elephants and keep a secret.",
      choices: [
        { t: "Help him", r: p => p.realm === "POL-30" ? "You take him to the hills. He sees a grey calf with pale ears and kneels in the mud for an hour." : "You go west with him as far as the first passes. He goes on alone, and you come back with his blessing and his book's last page.", fx: { piety: 4, them: { type: "friend", op: 25 }, deed: "Walked with a priest of the white elephants" } },
        { t: "Ask what the book says of the line", r: "Every pale calf in the west is of the temple cow's line, he says. Her temple failed and her calves went wild. He weeps a little telling it.", fx: { secret: 1, skill: { learning: 1 } } },
        { t: "Turn him away", r: "He goes, without anger. Pale elephants are not your business.", fx: { happy: 1, them: { op: -5 } } },
      ],
    },
    {
      id: "fv_x_zanara_pillar",
      title: "Zanara's pillar",
      cond: (p, C) => (C.greatWorld(p) && C.realm(p, "POL-20") && C.adult(p) && C.literate(p)) || (C.realm(p, "POL-151") && C.adult(p)),
      w: 3, once: true,
      text: p => p.realm === "POL-151"
        ? "In the king's yard at Mosandi stands a stone pillar the river people call the Northern Stone: Zanara's tribute pillar of 931, and beside it in a chest the treaty that ended the tribute in 1003, a Zanari document with a Kanemba seal. A northern scribe has come asking to copy it. The king wants someone to watch him."
        : "A river trader from the far south says that in a king's yard at Mosandi stands a stone with Zanari letters on it: a tribute pillar of 931, and a treaty of 1003 under a Kanemba seal. If true, the court archives have no copy. The archivists would pay to know, and the court might not want them to.",
      choices: [
        { t: "Copy what it says", r: "You copy the pillar's text line by line. It names a tribute of gold and men that no Zanari chronicle admits.", fx: { secret: 1, skill: { learning: 2 }, fame: 1 } },
        { t: "Take the news to those who would pay", r: "They pay. What they do with it is their business. You hear the court is displeased.", fx: { coin: 40, favor: -3 } },
        { t: "Leave the old stone alone", r: "Old tribute is old shame. You let it lie.", fx: { piety: 1 } },
      ],
    },
    {
      id: "fv_x_ten_tongues",
      title: "Locked in at dusk",
      cond: (p, C) => C.land(p, "A", "M", "I") && C.adult(p) && (C.job(p, "merchant") || C.job(p, "sailor")),
      w: 2, cool: 8,
      text: "At Lamhou, the Southern Court's one door to the sea trade, the Foreign Quarter's gate shuts at dusk on three drums, and a foreigner found in the city at night is fined his cargo. The notices on the Wall of Ten Tongues say so in ten scripts. Your buyer is late, and the second drum has sounded. He is a street away, with your money.",
      choices: [
        { t: "Run for the gate", check: { s: "athletics", s2: "spd", d: 48 },
          win: { r: "You slide through as the bar drops. The buyer finds you in the morning, and pays.", fx: { coin: 25, spd: 0.3 } },
          lose: { r: "The bar drops in your face. The watch takes you to the Superintendent's office, where the fine is your cargo.", fx: { coin: -60, honor: -1 } } },
        { t: "Wait for the buyer and pay the watch", r: "The watch is used to it. The bribe is a tenth of the sale. The Superintendent takes a tenth of every tenth.", fx: { coin: 10, honor: -2 } },
        { t: "Go back in and leave the money", r: "You are inside before the third drum. Your buyer may or may not come in the morning. He does, with a little less.", fx: { coin: 5 } },
      ],
    },
    {
      id: "fv_x_white_sails",
      title: "White sails and no oars",
      cond: (p, C) => C.land(p, "I", "T") && C.coast(p) && C.old(p),
      w: 2, once: true,
      text: "Your grandmother used to tell it: in 1031 a ship came out of the east with white sails and no oars, and stood off the coast for a day, and went away. The same year a carved log came ashore on the Outer Isle with marks nobody could read. A young scholar from the court is collecting old people's memories of it, and has come to you.",
      choices: [
        { t: "Tell it exactly as she told it", r: "He writes down every word, including the bit about the dog that barked at it all day. He thanks you as if you had seen it.", fx: { fame: 2, honor: 1 } },
        { t: "Improve the story a little", r: "The ship gets bigger and the sails whiter. He writes it all down. In a hundred years your version will be the true one.", fx: { fame: 3, honor: -2 } },
        { t: "Ask him why the court wants to know", r: "The Watch on the Outer Isle has built eleven Long Ships to find where the sun is born, he says. They would like to know if someone found it first.", fx: { secret: 1, skill: { learning: 1 } } },
      ],
    },
  ]);
})();
