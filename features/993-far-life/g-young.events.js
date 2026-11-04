// Far Lands childhoods and youths, second pass: two scenes for small children and one for a youth in each land,
// so a life begun in the far lands meets its own world from the first years. Ids keep their land's prefix.
(() => {
  const F = A.FV;
  A.defEvents([
    // ---- Twin Rivers
    {
      id: "fv_r_milk_name_child", title: "Your milk name",
      cond: (p, C) => C.land(p, "R") && C.child(p) && C.age(p) >= 3,
      w: 5, once: true,
      text: "Until the census at fifteen you have only a milk name, used at home. Yours is Little Dumpling, after the night you were born. The boy next door has found out, and has told the whole lane. Your grandmother says a milk name is a secret between a child and its household, and that the boy should be ashamed.",
      choices: [
        { t: "Tell the lane his milk name", r: "His is Puddle. The lane laughs at both of you for a week, and then forgets.", fx: { happy: 2, honor: -1, flag: "fv_r_milkname" } },
        { t: "Answer to it proudly", r: "You answer to Little Dumpling in front of everyone. After a while it stops being funny, which is how you win.", fx: { wil: 1, flag: "fv_r_milkname" } },
        { t: "Cry to your grandmother", r: "Your grandmother goes next door. There is shouting about milk names, and then rice cakes.", fx: { family: 3, happy: 1 } },
      ],
    },
    {
      id: "fv_r_milkname_census", title: "The milk name at the census",
      cond: (p, C) => C.land(p, "R") && C.age(p) >= 14 && C.age(p) <= 17 && C.flag(p, "fv_r_milkname") && A.S.year - p.flags.fv_r_milkname >= 7,
      w: 4, once: true,
      text: "At the census table the clerk asks the boy before you in the queue for his given name, and someone at the back calls out 'Puddle'. The whole yard laughs. It is your turn next. Behind you, the same voice is drawing breath to call out 'Little Dumpling'.",
      choices: [
        { t: "Turn round and stop him", r: "One look. He closes his mouth. The clerk writes your given name in a hand smaller than a grain of rice.", fx: { honor: 2, wil: 1 } },
        { t: "Laugh first, at yourself", r: "You call it out yourself. The clerk smiles, writes your real name, and the milk name stays in the yard where it belongs.", fx: { happy: 3, fame: 1 } },
        { t: "Ask the clerk to enter your milk name", r: "He refuses, then considers, then writes it in the margin. It will be in the Ledger for ever.", fx: { fame: 1, honor: -1, happy: 2 } },
      ],
    },
    {
      id: "fv_r_canal_cousins", title: "Lock children",
      cond: (p, C) => C.land(p, "R") && C.child(p) && C.age(p) >= 5,
      w: 5, once: true,
      setup: (p, ctx) => { F.make(p, ctx, { age: 8, occ: "" }); },
      text: "On the Grand Canal children are named for the lock where they were born, and the children of one lock call each other cousin. A barge has tied up for the night, and on it is {them}, born at your own lock, though you have never met. The barge leaves at dawn. The lock-keeper's dog has followed the child on board.",
      choices: [
        { t: "Show your lock cousin the canal bank", r: "You show the eel holes, the broken bollard and the place where the haulers sleep. At dawn the barge leaves with your cousin waving.", fx: { happy: 3, them: { type: "friend", op: 20 } } },
        { t: "Get the dog back before the barge leaves", check: { s: "athletics", s2: "spd", d: 42 },
          win: { r: "You are across two barges and back with the dog before anyone shouts. The lock-keeper gives you a copper.", fx: { coin: 1, spd: 0.3 } },
          lose: { r: "You go into the canal between two barges and are fished out by the lock-keeper, dog and all.", fx: { health: -3, happy: -2 } } },
        { t: "Tell the bargemen the dog is stolen", r: "The bargemen search the barge with great seriousness. Your lock cousin does not wave at dawn.", fx: { honor: -1, them: { op: -10 } } },
      ],
    },
    // ---- Long Grass
    {
      id: "fv_f_first_pony", title: "Your first pony",
      cond: (p, C) => C.land(p, "F") && C.child(p) && C.age(p) >= 3,
      w: 5, once: true,
      text: "On the grass a child is put on a horse before it can walk properly. Your father has led out a dun pony from the herd with a felt saddle tied on with a sash. The pony has a look in its eye. Your mother is watching from the tent door with her arms folded.",
      choices: [
        { t: "Climb on by yourself", check: { s: "riding", s2: "spd", d: 40 },
          win: { r: "You get up on the third try and stay up. Your father lets go of the halter and does not tell your mother.", fx: { skill: { riding: 2 }, flag: "fv_f_pony" } },
          lose: { r: "The pony walks out from under you. You sit in the grass. Your father lifts you back on.", fx: { skill: { riding: 1 }, happy: -1, flag: "fv_f_pony" } } },
        { t: "Ask your father to lift you", r: "He lifts you on and walks the pony round the tents three times. Your mother unfolds her arms.", fx: { family: 3, skill: { riding: 1 }, flag: "fv_f_pony" } },
        { t: "Feed the pony first", r: "You give it a curd from your pocket. It follows you round the camp all afternoon, and you never get on.", fx: { skill: { husbandry: 1 }, happy: 2 } },
      ],
    },
    {
      id: "fv_f_pony_grown", title: "The dun mare",
      cond: (p, C) => C.land(p, "F") && C.teen(p) && C.flag(p, "fv_f_pony") && A.S.year - p.flags.fv_f_pony >= 8,
      w: 4, once: true,
      text: "The dun pony you first sat on is an old mare now, slow, and the camp is moving to winter grass. Your father says she will not make the winter road, and should go to the Horse Feast with the others. Horses are buried with their riders on the grass, but she was never anyone's war horse.",
      choices: [
        { t: "Ask to keep her with you on the road", r: "You walk her the whole road at the back of the herd. She makes it, slowly. Your father says nothing all winter.", fx: { family: -2, piety: 2, happy: 3 } },
        { t: "Let her go to the Horse Feast", r: "She goes with the others. You eat your share, because that is how the grass is.", fx: { wil: 1, happy: -3 } },
        { t: "Give her to the Felt Keepers' herd", r: "The Keepers take old horses for the sacred herd. She grazes the Felt Mountains, and nobody will ever ride her again.", fx: { piety: 3, coin: -5 } },
      ],
    },
    {
      id: "fv_f_winter_name", title: "A name after one winter",
      cond: (p, C) => C.land(p, "F") && C.child(p) && C.age(p) >= 5,
      w: 5, once: true,
      text: "On the Elder Grass a child is not named until it has lived one winter, and the steppe clans have taken up the custom from their orc neighbours. Your new baby sister has lived her winter. Tonight the camp names her, and your mother says the eldest child may whisper one name to choose from.",
      choices: [
        { t: "Whisper the name of the first snow", r: "Your sister is named for the first snow, which fell the night she was born. You feel you named the winter too.", fx: { family: 5, piety: 1 } },
        { t: "Whisper your grandmother's name", r: "Your mother's eyes fill. The grandmother's name is given, and your sister will carry it.", fx: { family: 6, honor: 1 } },
        { t: "Whisper the name of your favourite foal", r: "The tent laughs, and then your father says it is a good name. Your sister is named for a foal.", fx: { happy: 3, family: 2 } },
      ],
    },
    // ---- Sand Basins
    {
      id: "fv_b_lamp_gate", title: "The lamp at the gate",
      cond: (p, C) => C.land(p, "B") && C.child(p) && C.age(p) >= 4,
      w: 5, once: true,
      text: "Caravans are received at the oasis gate with a lamp, and a caravan that arrives after the lamp is out sleeps outside. Tonight it is your family's turn to keep the gate lamp. Your father has gone to fetch oil and left you holding it. It is guttering, and you can hear camel bells out in the dark.",
      choices: [
        { t: "Shield the flame with your hands", r: "You cup it until your palms are hot. The caravan comes in by its light, and the caravan master gives you a dried apricot.", fx: { piety: 2, happy: 2, flag: "fv_b_lamp_child" } },
        { t: "Run for oil yourself", r: "You run. The lamp goes out behind you. The caravan sleeps outside the wall, and you hear the camels all night.", fx: { happy: -3, honor: -1 } },
        { t: "Fan it gently, never blowing", r: "Fan, not breath. It steadies. The priest, when he hears, says you understand fire.", fx: { piety: 3, flag: "fv_b_lamp_child" } },
      ],
    },
    {
      id: "fv_b_lamp_caravan", title: "Received by lamplight",
      cond: (p, C) => C.land(p, "B") && C.adult(p) && C.flag(p, "fv_b_lamp_child") && A.S.year - p.flags.fv_b_lamp_child >= 12,
      w: 3, once: true,
      text: "Your own caravan comes in to an oasis after dark, footsore and short of water. The gate lamp is lit, but a small child is holding it and looking at you over the flame with great seriousness. Behind the child, the gate-keeper is shutting the gate, because his supper is getting cold.",
      choices: [
        { t: "Call out that the lamp is still lit", r: "The keeper grumbles and opens up. You give the child a dried apricot, which seems the right price.", fx: { happy: 3, honor: 1 } },
        { t: "Pay the keeper to wait", r: "He waits for a coin. The child watches the coin very carefully.", fx: { coin: -5 } },
        { t: "Camp outside the wall", r: "Custom is custom. You sleep with the camels and hear the child's lamp go out at midnight.", fx: { piety: 2, health: -2 } },
      ],
    },
    {
      id: "fv_b_monastery_name", title: "Carried to the monastery",
      cond: (p, C) => C.land(p, "B") && C.child(p) && C.age(p) >= 5,
      w: 5, once: true,
      setup: (p, ctx) => { F.make(p, ctx, { sex: "M", age: 70, occ: "monk of the Lamp" }); },
      text: "In the oases under the Iron Teeth a child is named at the monastery it is first carried to, and most names hold a Lamp word. You were carried to the monastery above the vineyards. The old monk who named you, {them}, has sent for you to carry grapes to the drying racks, as children of his naming do at harvest.",
      choices: [
        { t: "Carry grapes all day", r: "By evening your arms are purple to the elbow. The monk shows you the racks where the raisins are made for the caravans.", fx: { piety: 2, sta: 0.3, them: { type: "friend", op: 15 } } },
        { t: "Eat as many as you carry", r: "The monk sees, and says the Lamp feeds travellers first, and you are travelling. He lets you eat.", fx: { happy: 3, them: { op: 5 } } },
        { t: "Ask him what your name means", r: "He tells you: a lamp kept for someone coming late. You decide it is the best name in the oasis.", fx: { wil: 1, skill: { learning: 1 } } },
      ],
    },
    // ---- High Steppes
    {
      id: "fv_h_prayer_wheel", title: "The prayer wheel",
      cond: (p, C) => C.land(p, "H") && C.child(p) && C.age(p) >= 3,
      w: 5, once: true,
      text: "Your grandmother turns a prayer wheel all day, sunwise, and has given you a small one of your own with a tin drum and a bead on a chain. The bead knocks with every turn. Your cousin says that if you turn it the wrong way the prayers come undone.",
      choices: [
        { t: "Turn it sunwise all morning", r: "You turn it until your wrist aches. Your grandmother says you have sent more prayers than the abbot.", fx: { piety: 3, family: 2 } },
        { t: "Turn it backwards to see what happens", r: "Nothing happens. Your grandmother's face happens. You turn it forwards twice as long.", fx: { piety: -1, wil: 1 } },
        { t: "Tie it to the yak's horn", r: "The yak turns it for you all day, mostly sunwise. Your grandmother laughs until she has to sit down.", fx: { happy: 3, skill: { husbandry: 1 } } },
      ],
    },
    {
      id: "fv_h_porter_child", title: "A porter's weather",
      cond: (p, C) => C.land(p, "H") && C.child(p) && C.age(p) >= 5,
      w: 5, once: true,
      text: "Porters of the Cloudwall are named for the weather on the pass on the day they were born. Your name means Snow-in-Sun. Today your uncle is carrying a lowland pilgrim's chest up the Stair, and has let you carry the pilgrim's sandals, which are very large, behind him.",
      choices: [
        { t: "Carry them to the top", r: "Sixteen hundred steps. At the top the pilgrim gives you a coin with a hole in it, and your uncle gives you his whole lunch.", fx: { sta: 0.5, coin: 1, happy: 2 } },
        { t: "Wear them", r: "You clump up the Stair in them. The pilgrim laughs so much he has to rest, which your uncle does not mind at all.", fx: { happy: 3, honor: -1 } },
        { t: "Greet the dead on the pass by name", r: "Your uncle has taught you the names of the porters left in the snow with their baskets. You greet each one as you pass.", fx: { piety: 3, wil: 1 } },
      ],
    },
    {
      id: "fv_h_teen_lot", title: "The novices' lot",
      cond: (p, C) => C.land(p, "H") && C.teen(p),
      w: 4, once: true,
      text: "The monastery needs boys to dance the masked dances at the Sky New Year, and lots are drawn among the valley's youths. You have drawn the Black Hat, the hardest part, which spins for an hour without stopping. The boy who drew the Deer wants to swap. The Deer only has to stand still.",
      choices: [
        { t: "Dance the Black Hat", check: { s: "athletics", s2: "sta", d: 50 },
          win: { r: "You spin the full hour in the abbey yard and do not fall. Old men tell you about their own Black Hat dances for a week.", fx: { fame: 2, piety: 2, sta: 0.5 } },
          lose: { r: "You fall at the fortieth minute and lie in the snow under the mask. The crowd is kind about it.", fx: { happy: -3, piety: 1 } } },
        { t: "Swap with the Deer", r: "You stand still in the Deer mask for an hour, which is harder than it looks.", fx: { wil: 1, honor: -1 } },
        { t: "Ask to draw again", r: "The monks do not draw again. A lot is a lot. You dance the Black Hat anyway, badly.", fx: { piety: -1, happy: -1 } },
      ],
    },
    // ---- Southern Peninsulas
    {
      id: "fv_m_nickname", title: "Little Rat",
      cond: (p, C) => C.land(p, "M") && C.child(p) && C.age(p) >= 3,
      w: 5, once: true,
      text: "Nicknames given in childhood are used all life, even by kings. Today at the temple ring your uncle has called you Little Rat in front of the boxers, because you were found asleep in the rice store. The boxers are laughing. A name said at the ring sticks.",
      choices: [
        { t: "Bite your uncle's ankle", r: "You bite. The boxers roar. You are Little Rat for life, and the town says it with respect.", fx: { epithet: "Little Rat", happy: 2 } },
        { t: "Shout a better name for yourself", r: "Your name is ignored. You are Little Rat. You shout it again every year until you are twelve.", fx: { wil: 1, epithet: "Little Rat" } },
        { t: "Laugh along", r: "You laugh, and the name is said kindly from then on, mostly.", fx: { happy: 3, family: 2 } },
      ],
    },
    {
      id: "fv_m_last_sheaf_child", title: "The last sheaf home",
      cond: (p, C) => C.land(p, "M", "A") && C.child(p) && C.age(p) >= 5,
      w: 5, once: true,
      text: "At the end of the rice harvest the last sheaf is carried home and kept until the next planting, because the Rice Mother lives in it. This year the eldest child carries it, and you are the eldest. It is heavier than it looks, and the path is along the slippery bund between two flooded fields.",
      choices: [
        { t: "Carry it carefully, step by step", r: "You get it home without a splash. It hangs in the granary all year, and you check on it.", fx: { piety: 3, family: 2 } },
        { t: "Run, to get it over with", check: { s: "athletics", s2: "spd", d: 42 },
          win: { r: "You run the bund like a heron and arrive before the grown-ups. Nobody saw how close it was.", fx: { spd: 0.3, happy: 2 } },
          lose: { r: "You and the Rice Mother go into the paddy. The sheaf is dried by the fire and kept anyway, a little muddy.", fx: { piety: -1, happy: -3 } } },
        { t: "Sing to the sheaf all the way", r: "You sing the harvest song to it. The grown-ups behind you join in. The whole field walks home singing.", fx: { piety: 2, skill: { music: 1 } } },
      ],
    },
    {
      id: "fv_m_teen_ledger", title: "The page you will be read from",
      cond: (p, C) => C.land(p, "M") && C.teen(p) && C.faith(p, "REL-37", "REL-38", "REL-25"),
      w: 4, once: true,
      text: "Your temple keeps a ledger page for you already: every debt and gift, to be read aloud at your burning. A priest tells you, as he tells every youth of your house, that a gift now would be a good first line. Your friends have all given something. You have a silver anklet from your grandmother.",
      choices: [
        { t: "Give the anklet", r: "The priest writes it in. Your page begins with a gift. Your grandmother, when she hears, does not speak to you for a day.", fx: { piety: 3, family: -3 } },
        { t: "Give a day's work instead", r: "You sweep the temple court for a day. The priest writes 'a day', which is a small line, and an honest one.", fx: { piety: 2, honor: 1, health: -1 } },
        { t: "Say your page can wait", r: "The priest smiles and says pages always wait. Your friends think you are very brave or very stupid.", fx: { wil: 1, piety: -1 } },
      ],
    },
    // ---- Thousand Isles
    {
      id: "fv_a_tide_food", title: "Food at the tide line",
      cond: (p, C) => C.land(p, "A", "I", "D") && C.coast(p) && C.child(p) && C.age(p) >= 3,
      w: 5, once: true,
      text: "On the islands the dead go out with the ebb and come back with the flood to see that their families behave. Tonight you have been sent down with a bowl of rice and fish for the tide line. The water is coming in fast. A crab is already eyeing the bowl.",
      choices: [
        { t: "Set it down and walk back, not turning", r: "You walk backwards up the beach so as not to turn your back on the sea. You fall over twice. The bowl is gone by morning.", fx: { piety: 3, happy: 1 } },
        { t: "Chase off the crab and wait", r: "You sit with the bowl until the water touches it. Your mother finds you there, soaked, and does not scold you.", fx: { piety: 2, family: 3, health: -1 } },
        { t: "Eat a little first", r: "One mouthful. The dead are generous, your grandmother says, when she sees the bowl. You are not sure she means it.", fx: { happy: 2, piety: -1 } },
      ],
    },
    {
      id: "fv_a_star_chant", title: "Thirty-two stars",
      cond: (p, C) => C.land(p, "A", "I") && C.child(p) && C.age(p) >= 6,
      w: 5, once: true,
      setup: (p, ctx) => { F.make(p, ctx, { sex: "M", age: 65, occ: "old navigator" }); },
      text: "Navigators learn the star-rising points as a chant of thirty-two stars, and teaching it to anyone not of a navigator family is forbidden. {them}, an old navigator who has no grandchildren, has been chanting it on the beach at night where you can hear. He knows you are listening. He has not stopped.",
      choices: [
        { t: "Learn it under your breath", r: "By the end of the dry season you have twenty stars. He never once looks your way.", fx: { skill: { sea: 2 }, secret: 1, flag: "fv_a_stars" } },
        { t: "Ask him straight out to teach you", r: "He says it is forbidden, and then, a month later, starts the chant again a little louder.", fx: { skill: { sea: 1 }, them: { op: 15 }, flag: "fv_a_stars" } },
        { t: "Tell your parents", r: "Your father goes down to the beach. The chanting stops. The old man sits alone by his canoe after that.", fx: { honor: 1, them: { op: -15 } } },
      ],
    },
    {
      id: "fv_a_stars_voyage", title: "Out of sight of land",
      cond: (p, C) => C.land(p, "A", "I") && C.adult(p) && C.flag(p, "fv_a_stars") && A.S.year - p.flags.fv_a_stars >= 10,
      w: 3, once: true,
      text: "A fishing canoe of your village has been blown out of sight of land in a squall, and the men aboard are no navigators. You are on the beach. You know twenty stars of the forbidden chant from an old man who sang it where a child could hear. The sky is clearing.",
      choices: [
        { t: "Take a canoe out and bring them home", check: { s: "sea", s2: "ins", d: 54 },
          win: { r: "You find the rising star you need and bring both canoes home by dawn. Nobody asks where you learned it. Everybody knows.", fx: { fame: 4, honor: 2, deed: "Brought a lost canoe home by the stars" } },
          lose: { r: "You lose the star in cloud and spend a day at sea yourself. A real navigator brings you all home.", fx: { health: -6, happy: -3 } } },
        { t: "Tell a navigator family which way they drifted", r: "You point to the stars. The navigator's son goes out and brings them home, and looks at you strangely afterward.", fx: { honor: 1, secret: 1 } },
        { t: "Wait for the morning, like everyone", r: "They come home on their own two days later, thirsty and alive.", fx: { happy: -1 } },
      ],
    },
    // ---- Black Pines
    {
      id: "fv_t_honey_paws", title: "Honey-Paws",
      cond: (p, C) => C.land(p, "T", "F") && C.child(p) && C.age(p) >= 3,
      w: 5, once: true,
      text: "The bear's true name is never said in the forest. It is the old man, or Honey-Paws, and its paw is the hand. Picking berries with your mother, you have seen a big brown shape in the raspberry canes and are about to shout its real name.",
      choices: [
        { t: "Say 'the old man is here' instead", r: "Your mother hears, and walks you backwards out of the canes without a word. Later she tells everyone how clever you were.", fx: { piety: 2, wil: 1 } },
        { t: "Shout its name", r: "The bear looks up. Your mother picks you up and runs. The village tells you, for years, about the child who called the bear.", fx: { piety: -2, happy: -3 } },
        { t: "Hold very still and say nothing", r: "The old man eats raspberries and goes away. You do not move until your mother finds you.", fx: { wil: 1, skill: { stealth: 1 } } },
      ],
    },
    {
      id: "fv_t_ice_fish", title: "Through the ice",
      cond: (p, C) => C.land(p, "T", "N") && C.child(p) && C.age(p) >= 6,
      w: 5, once: true,
      text: "Your father has cut a hole in the lake ice and given you a line, a hook and a scrap of fat. It is very cold. Nothing has bitten for an hour. Across the ice, the drum-walker's girl has caught four whitefish and is pretending not to notice you.",
      choices: [
        { t: "Ask her what she uses", r: "She shows you, a little scornfully: fish eyes, not fat. You catch two before dark.", fx: { skill: { survival: 2 }, newRel: { type: "friend", op: 10 } } },
        { t: "Wait it out", r: "You wait until your fingers are white. One small fish, very late. You are proud of it.", fx: { wil: 1, health: -1 } },
        { t: "Cut a hole next to hers", r: "Your father makes you fill it in. You do not cut holes in another family's water.", fx: { honor: -1, skill: { survival: 1 } } },
      ],
    },
    {
      id: "fv_t_teen_bell", title: "The bell rope",
      cond: (p, C) => C.land(p, "T") && C.teen(p) && C.male(p),
      w: 4, once: true,
      text: "Every fur-hunter strong enough to help ring the great bell may vote at the Bell Moot. The bell takes two men. The youths of the town test themselves on it after dark, when the watchman is asleep, two at a time. Your partner tonight is the smallest boy on your lane.",
      choices: [
        { t: "Pull with everything you have", check: { s: "athletics", s2: "str", d: 50 },
          win: { r: "The bell speaks once over the town. Every dog barks. You run, and you are strong enough to vote, next time.", fx: { str: 0.5, fame: 1 } },
          lose: { r: "It barely hums. The watchman wakes anyway and cuffs you both.", fx: { happy: -2, honor: -1 } } },
        { t: "Let the small boy try alone first", r: "He hangs on the rope with his feet off the ground. The bell does not move. He never forgets that you let him try.", fx: { newRel: { type: "friend", op: 20 }, happy: 1 } },
        { t: "Go home", r: "You go home. In the morning everyone is talking about who rang it, and it was not you.", fx: { health: 1 } },
      ],
    },
    // ---- Rime Coast
    {
      id: "fv_n_snow_house", title: "A snow house",
      cond: (p, C) => C.land(p, "N") && C.child(p) && C.age(p) >= 4,
      w: 5, once: true,
      text: "The children of the camp build a snow house of their own each winter, the way the hunters build them on the ice: blocks cut with a bone knife, spiralling up. Yours has reached the last block, the one at the top that holds the rest. Two children have built theirs already. Theirs fell in.",
      choices: [
        { t: "Set the last block yourself", check: { s: "craft", s2: "ins", d: 42 },
          win: { r: "It holds. Five children sit inside it with a seal-oil lamp until their mothers come looking.", fx: { skill: { craft: 2 }, happy: 3 } },
          lose: { r: "It falls in on you. You come out of the heap laughing, and the other children dig you out.", fx: { happy: 1, health: -1 } } },
        { t: "Ask a hunter to set it", r: "A hunter sets it with one tap of his knife. It is perfect. It is not quite yours.", fx: { skill: { craft: 1 } } },
        { t: "Leave it open to the stars", r: "You sit inside a house with no roof and watch the green lights move. Your mother calls it a waste of good snow.", fx: { piety: 1, happy: 2 } },
      ],
    },
    {
      id: "fv_n_ivory_toy", title: "An ivory toy",
      cond: (p, C) => C.land(p, "N") && C.child(p) && C.age(p) >= 5,
      w: 5, once: true,
      text: "A giant of Fjorund has come down the Ice Horn to trade, and while the grown-ups bargain over walrus ivory she sits on the shingle and carves. When she has finished she holds out a little walrus, no bigger than your thumb, on a palm as wide as a sledge.",
      choices: [
        { t: "Take it and thank her", r: "You thank her in your words. She answers in hers, a sound like a seal under the ice. You keep the walrus all your life.", fx: { happy: 4, flag: "fv_n_giant_toy" } },
        { t: "Give her something back", r: "You give her your best stone. She studies it for a long while and puts it in her pouch as if it were ivory.", fx: { honor: 2, flag: "fv_n_giant_toy" } },
        { t: "Hide behind your mother", r: "She puts the walrus on the shingle and goes back up the Horn. Your mother picks it up for you.", fx: { happy: 1 } },
      ],
    },
    {
      id: "fv_n_toy_returned", title: "The little walrus",
      cond: (p, C) => C.land(p, "N") && C.adult(p) && C.flag(p, "fv_n_giant_toy") && A.S.year - p.flags.fv_n_giant_toy >= 15,
      w: 3, once: true,
      text: "Giants come down the Ice Horn to trade, and one of them is old now, slow, and carving by the boats as she did when you were small. She is carving a little walrus. You still have the one she gave you. Your own child is watching her hands, very close, without fear.",
      choices: [
        { t: "Show her the walrus she made you", r: "She holds it in her great palm and makes the seal-under-the-ice sound, longer this time. The new walrus goes to your child.", fx: { happy: 4, family: 3, piety: 2 } },
        { t: "Trade her your best ivory for nothing", r: "You give her a tusk. She looks at it, and at you, and goes up the Horn with it. Giants remember gifts.", fx: { coin: -20, honor: 3 } },
        { t: "Let your child go to her alone", r: "Your child comes back with a walrus and a word of the giants' tongue, which nobody in the camp can say.", fx: { family: 4, skill: { learning: 1 } } },
      ],
    },
    // ---- Sunrise Isles
    {
      id: "fv_i_hearth_rope", title: "The rope at the gate",
      cond: (p, C) => C.land(p, "I") && C.child(p) && C.age(p) >= 3,
      w: 5, once: true,
      text: "At the New Year the gate god's straw rope is renewed, and stepping over it is forbidden. The hearth fire must not go out all New Year week. Your father has made you keeper of the hearth for the afternoon while the household goes to the shrine. Your ball has just rolled out under the new rope into the lane.",
      choices: [
        { t: "Leave the ball and mind the fire", r: "The ball sits in the lane all afternoon. The fire does not go out. Your father brings the ball in and says nothing, which is praise.", fx: { piety: 3, wil: 1 } },
        { t: "Crawl under the rope, not over it", r: "Under is not over. You get the ball. You also get back to a fire that is very low, and blow on it, which is worse.", fx: { piety: -1, happy: 2 } },
        { t: "Call a passing child to throw it back", r: "A girl from across the lane throws it back over the rope, which is also not stepping over it. You both feel very clever.", fx: { happy: 2, newRel: { type: "friend", op: 10 } } },
      ],
    },
    {
      id: "fv_i_crest_child", title: "The crest on your sleeve",
      cond: (p, C) => C.land(p, "I") && C.child(p) && C.age(p) >= 6,
      w: 5, once: true,
      setup: (p, ctx) => { F.house(p, ctx); },
      text: "A lord's retainers wear his household crest on their sleeves. Your father serves {house}, and today you have been given a child's coat with the crest sewn on it, for the procession at the seat in {seat}. A boy of another household's retainers has been told by his father that your crest is the one that ran at the river crossing.",
      choices: [
        { t: "Fight him for the crest", check: { s: "unarmed", s2: "str", d: 42 },
          win: { r: "You put him in the ditch. The crest stays clean and you do not. Your father pretends to be angry.", fx: { honor: 2, happy: 2, wound: "broken_nose" } },
          lose: { r: "He puts you in the ditch, crest and all. You walk in the procession with mud on your sleeve.", fx: { happy: -3, honor: 1 } } },
        { t: "Ask your father whether it is true", r: "He tells you about the river crossing, all of it. It is not true, and it is not quite false either.", fx: { skill: { learning: 1 }, family: 3 } },
        { t: "Walk in the procession and say nothing", r: "You walk with your chin up and the crest on your arm. The other boy watches you all the way.", fx: { wil: 1 } },
      ],
    },
    {
      id: "fv_i_teen_ash", title: "Ash on the paths",
      cond: (p, C) => C.land(p, "I") && C.teen(p),
      w: 4, once: true,
      text: "When a volcano wakes, the shrine families walk up toward it, not away, to calm it with song. The mountain above your town is rumbling, and grey ash is falling like snow. The shrine folk are forming up on the road with their bells. They need voices. Your mother is packing the cart to go the other way.",
      choices: [
        { t: "Walk up with the shrine folk", check: { s: "music", s2: "wil", d: 48 },
          win: { r: "You sing all night on the slope with ash in your hair. By dawn the mountain is quiet, and you believe you helped.", fx: { piety: 5, fame: 1, health: -3 } },
          lose: { r: "Your voice gives out in the ash by midnight. A shrine woman sends you down with a wet cloth over your mouth.", fx: { piety: 2, wound: "lungs" } } },
        { t: "Go with your mother's cart", r: "You go down the coast road with the others. From the shore you can hear the bells on the mountain.", fx: { family: 4, health: 1 } },
        { t: "Help load the cart, then walk up", r: "The cart goes without you. You reach the singers at midnight and stand at the back, singing the parts you know.", fx: { piety: 3, family: -2 } },
      ],
    },
    // ---- Deep Southland
    {
      id: "fv_d_drum_child", title: "Feeding the drum",
      cond: (p, C) => C.land(p, "D") && C.child(p) && C.age(p) >= 4,
      w: 5, once: true,
      text: "The royal drums are fed with milk and beer at every new moon. Touching a royal drum without office is forbidden. You have been allowed to carry the milk gourd behind your uncle, who keeps a drum. The drum is taller than you, and very quiet, and you badly want to tap it once.",
      choices: [
        { t: "Carry the milk and touch nothing", r: "You hand the gourd up and watch the milk poured into the drum's cup. Your uncle lets you carry it again next moon.", fx: { piety: 3, flag: "fv_d_drum_child" } },
        { t: "Tap it, very softly", r: "It answers you, a sound under your feet. Your uncle goes grey and makes you fast for a day.", fx: { piety: -2, happy: 2, wil: 1 } },
        { t: "Ask your uncle what the drum says", r: "He says the drum says the king is the king. He says it every moon, and you will carry the milk until you understand it.", fx: { skill: { learning: 1 }, flag: "fv_d_drum_child" } },
      ],
    },
    {
      id: "fv_d_forest_morning", title: "Singing the forest awake",
      cond: (p, C) => C.land(p, "D") && C.child(p) && C.age(p) >= 5,
      w: 5, once: true,
      text: "Down the great river the forest bands sing the forest awake each morning. A band has camped by your village, and before dawn you hear them, one voice and then forty, a sound like the trees themselves. Your mother says they do not like to be watched. You are already halfway to the riverbank.",
      choices: [
        { t: "Sit at the edge and listen", r: "You sit very still in the wet grass until the song ends. A girl of the band waves at you, once, and they are gone.", fx: { piety: 2, happy: 3, skill: { music: 1 } } },
        { t: "Sing along", r: "You sing the wrong song, loudly. The forest people stop, and then, to your astonishment, sing yours back.", fx: { happy: 4, newRel: { type: "friend", op: 10 } } },
        { t: "Go back to bed", r: "You fall asleep to it. It is in your dreams for years.", fx: { health: 1 } },
      ],
    },
    {
      id: "fv_d_teen_initiation", title: "Before the age-set",
      cond: (p, C) => C.land(p, "D") && C.teen(p) && C.age(p) <= 14,
      w: 4, once: true,
      text: "The boys and girls who will be initiated together next dry season are sent out with the herds alone for a month, to learn the cattle's names and the lions' habits. On the twentieth night a lion is walking round your thorn fence, close enough to hear it breathe. The others are asleep.",
      choices: [
        { t: "Wake the others and keep the fire high", r: "You keep the fire roaring till dawn. The lion goes. The others will tell the age-set who woke them.", fx: { honor: 2, fame: 1, health: -1 } },
        { t: "Stand at the gap with your spear", check: { s: "spear", s2: "wil", d: 50 },
          win: { r: "It comes to the gap once and looks at you, and goes. You never tell anyone how your legs felt.", fx: { wil: 1, fame: 2, skill: { spear: 2 } } },
          lose: { r: "It comes through the thorn instead of the gap. It takes a calf and leaves you with a raked arm.", fx: { wound: "bite", health: -8 } } },
        { t: "Drive the weakest calf out to it", r: "The lion takes the calf and leaves. The herd is safe. The calf was named for someone's grandfather.", fx: { coin: -10, piety: -3 } },
      ],
    },
  ]);
})();
