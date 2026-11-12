// Far Lands childhoods: the worm loft's whisper (Twin Rivers), the guest who steps on the threshold (Long Grass),
// the melon for a caravan (Sand Basins), the stone for the pass cairn (High Steppes), the cup from a lower house's
// hand (Southern Peninsulas), the diving game of the boat children (Thousand Isles) and the calf named for the dead
// (Deep Southland). Each sets a flag a later scene reads. Flags set here start with their land's prefix.
(() => {
  const F = A.FV;
  A.defEvents([
    {
      id: "fv_r_worm_loft",
      title: "The worm loft",
      cond: (p, C) => C.land(p, "R") && C.child(p) && C.age(p) >= 5,
      w: 4, once: true,
      text: "For five weeks, from the hatching to the spinning, no one speaks above a whisper in the house: the worms in the loft are the Silkworm Mother's children, and they die of loud voices. Your little brother has fallen down the loft ladder and is howling. Your grandmother is at the market. The worms are directly above him.",
      choices: [
        { t: "Pick him up and run outside with him", r: "You carry him out into the lane and let him howl there. The worms spin on. Your grandmother hears and gives you a sugared plum.", fx: { family: 3, honor: 1, flag: "fv_r_loft_child" } },
        { t: "Put your hand over his mouth", r: "He bites you. He stops howling, mostly. The worms spin on, and you have a scar on your palm shaped like his teeth.", fx: { wound: "scar_arm", wil: 1, flag: "fv_r_loft_child" } },
        { t: "Shout for your mother", r: "Your shout is louder than his. That evening a whole tray of worms has stopped eating. Nobody says it was you.", fx: { happy: -3, piety: -1 } },
      ],
    },
    {
      id: "fv_r_loft_grown",
      title: "Your own loft",
      cond: (p, C) => C.land(p, "R") && C.adult(p) && C.hasKids(p) && C.flag(p, "fv_r_loft_child") && A.S.year - p.flags.fv_r_loft_child >= 12,
      w: 3, once: true,
      text: "The worms have hatched in your own loft now, and the house whispers. Your child has your brother's lungs. Your brother, grown, has come to visit, and remembers the day he fell down the ladder very differently from you: in his version, you dropped him. Your child is listening with great interest.",
      choices: [
        { t: "Tell it your way, in a whisper", r: "You tell it, whispering. Your brother whispers back his version. The child decides you are both liars and goes to look at the worms.", fx: { family: 4, happy: 3 } },
        { t: "Let your brother's version stand", r: "Your brother is delighted. Your child looks at you with new respect, for dropping people.", fx: { family: 2, honor: -1 } },
        { t: "Take the argument out into the lane", r: "You argue in the lane like boys. Neighbours come out to watch. The worms, at least, are spared.", fx: { family: 5, fame: 1 } },
      ],
    },
    {
      id: "fv_f_threshold",
      title: "The threshold",
      cond: (p, C) => C.land(p, "F") && C.child(p) && C.age(p) >= 6,
      w: 4, once: true,
      setup: (p, ctx) => { F.make(p, ctx, { sex: "M", age: 40, occ: "tax officer from Hesh", status: "gentry" }); },
      text: "The threshold of a tent may not be stepped on. A guest who steps on it is taken out and made to come in again. A tax officer from the Hesh frontier, {them}, has just stepped on yours, in his silk boots, and your father is out with the herds. The grown-ups in the tent are looking at each other. You are the eldest of your father's blood in the tent.",
      choices: [
        { t: "Take him by the sleeve and lead him out", r: "You lead him out and back in. He laughs, and steps over it the second time. He leaves your family's count a little lighter.", fx: { honor: 3, fame: 1, them: { op: 10 }, flag: "fv_f_threshold" } },
        { t: "Tell him the rule in your best voice", r: "He listens to a six-year-old explain the sky's tent to him, and goes out and comes in again, solemnly.", fx: { honor: 2, skill: { persuasion: 1 }, flag: "fv_f_threshold" } },
        { t: "Say nothing, like the grown-ups", r: "Nobody says anything. Your father, when he hears, is quiet with everyone for a day.", fx: { piety: -1 } },
      ],
    },
    {
      id: "fv_f_threshold_officer",
      title: "The officer remembers",
      cond: (p, C) => C.land(p, "F") && C.adult(p) && C.flag(p, "fv_f_threshold") && A.S.year - p.flags.fv_f_threshold >= 12,
      w: 3, once: true,
      text: "A grey-haired Hesh officer comes with this year's tax riders. He has risen. He asks for your tent by your father's name and, when you come out, says he remembers a child who walked him out of a tent by the sleeve. Hesh pays the khagan tribute, and he has been sent to count who among the clans might be paid to be friendly.",
      choices: [
        { t: "Take his silver and be friendly", r: "Silver for news, once a year. The khagan's men would call it something else.", fx: { coin: 40, honor: -3, newRel: { type: "friend", op: 15 } } },
        { t: "Walk him out of the tent again", r: "He laughs aloud and goes. In his report, you hear later, your clan is marked 'not for sale'.", fx: { honor: 4, fame: 1 } },
        { t: "Ask him for news of the south instead", r: "He tells you about the Sau frontier and a great war coming. You tell him about grass. It is a fair trade.", fx: { skill: { diplomacy: 2 }, secret: 1 } },
      ],
    },
    {
      id: "fv_b_melon",
      title: "A melon for the caravan",
      cond: (p, C) => C.land(p, "B") && C.child(p) && C.age(p) >= 6,
      w: 4, once: true,
      text: "Melons are given as a greeting to anyone arriving from a journey, and the size tells the guest what he is worth. A caravan has come in, and your father sends you down to the gate with a melon for its master. There are three in the cool room: a fine big one, a middling one, and a small one with a crack in it.",
      choices: [
        { t: "Take the big one", r: "The caravan master weighs it in his hands and bows to your father across the yard. Your father had meant the middling one.", fx: { family: -2, fame: 1, flag: "fv_b_melon" } },
        { t: "Take the middling one", r: "The caravan master nods, the right nod. Your father nods at you, the same nod.", fx: { family: 3, skill: { etiquette: 1 }, flag: "fv_b_melon" } },
        { t: "Take the small cracked one", r: "The caravan master looks at it, and at you, and laughs so hard he has to sit on a bale. Your father does not laugh.", fx: { family: -4, happy: 3 } },
      ],
    },
    {
      id: "fv_b_melon_master",
      title: "The caravan master's melon",
      cond: (p, C) => C.land(p, "B") && C.adult(p) && C.flag(p, "fv_b_melon") && A.S.year - p.flags.fv_b_melon >= 15,
      w: 3, once: true,
      text: p => `${F.Ago(p, "fv_b_melon")} ago you carried a melon down to a caravan master at your father's gate. Now you come in off a journey yourself, dusty from the Northern Strand, and a child of the house you are visiting walks out to meet you with a melon in both arms. It is very small. The whole yard is watching to see what you do.`,
      choices: [
        { t: "Take it with a deep bow", r: "You bow over the small melon as if it were gold. The child's father, relieved, sends out a large one after it.", fx: { honor: 3, fame: 1 } },
        { t: "Laugh, as the caravan master did", r: "You laugh until you sit down on a bale. The child laughs too. Business that afternoon goes very well.", fx: { happy: 4, skill: { persuasion: 1 } } },
        { t: "Take offence, and leave", r: "You turn your camels at the gate. Word of the small melon reaches three counting houses before you do.", fx: { honor: -1, rep: -2 } },
      ],
    },
    {
      id: "fv_h_cairn_stone",
      title: "A stone for the cairn",
      cond: (p, C) => C.land(p, "H") && C.child(p) && C.age(p) >= 6,
      w: 4, once: true,
      text: "Prayer flags hang on every pass, and a herder who passes one without adding a stone to its cairn is followed by bad weather. You are crossing your first high pass on your uncle's yak. At the top you remember you were supposed to pick up a stone at the bottom, and there are no loose stones up here, only ice.",
      choices: [
        { t: "Tell your uncle", r: "He stops the yaks, digs a stone out of the ice with his knife and gives it to you. It takes half an hour. The weather holds.", fx: { piety: 2, honor: 1, health: -1, flag: "fv_h_cairn" } },
        { t: "Put your button on the cairn instead", r: "A bone button off your coat, placed carefully. Your uncle sees, and says the mountain will accept it, probably.", fx: { piety: 1, flag: "fv_h_cairn" } },
        { t: "Pretend to add a stone", r: "Your hand goes to the cairn empty. Snow comes in that evening and you are two days in a herder's hut. You never tell.", fx: { piety: -2, health: -3, flag: "fv_h_cairn" } },
      ],
    },
    {
      id: "fv_h_cairn_child",
      title: "The cairn on your pass",
      cond: (p, C) => C.land(p, "H") && C.adult(p) && C.hasKids(p) && C.flag(p, "fv_h_cairn") && A.S.year - p.flags.fv_h_cairn >= 14,
      w: 3, once: true,
      text: "You take your own child over the high pass for the first time. At the cairn your child stares at the ice and then at you: the stone from the bottom has been forgotten. You crossed this same pass with your uncle as a child. The cairn has grown since then, and on one side, half buried, is something that looks like a bone button.",
      choices: [
        { t: "Dig a stone out of the ice for them", r: "It takes half an hour, as it did for your uncle. Your child places it beside the button and asks whose that is.", fx: { piety: 2, family: 5 } },
        { t: "Tell them about the button", r: "You tell the whole story, the weather and all. Your child adds a button of their own, solemnly.", fx: { family: 4, happy: 3 } },
        { t: "Tell them it does not matter", r: "Your child looks at you as if you had said the mountain was not there. The weather holds, this time.", fx: { piety: -2, wil: 1 } },
      ],
    },
    {
      id: "fv_m_cup",
      title: "Water from her hand",
      cond: (p, C) => C.land(p, "M") && C.child(p) && C.age(p) >= 6,
      w: 4, once: true,
      setup: (p, ctx) => { F.make(p, ctx, { sex: "F", age: 9, occ: "a weaver's daughter" }); },
      text: "Water may not be taken from the hand of a lower house, and travellers carry their own cups. You have lost yours at the temple fair and walked all morning in the heat. {them}, a weaver's daughter of a house far below yours, holds out a dipper of cool water from her family's jar. Your aunt is somewhere behind you in the crowd.",
      choices: [
        { t: "Drink from her dipper", r: "It is the best water you have ever drunk. Your aunt finds you a minute later and does not speak to you all the way home.", fx: { piety: -2, them: { type: "friend", op: 25 }, flag: "fv_m_cup" } },
        { t: "Ask her to pour it into your hands", r: "She pours it into your cupped palms. Not from her hand, exactly. You both think this is very clever.", fx: { them: { type: "friend", op: 15 }, int: 0.3, flag: "fv_m_cup" } },
        { t: "Refuse, and walk on thirsty", r: "Your aunt finds you by noon, faint with thirst, and praises you. The weaver's girl watches you go.", fx: { piety: 2, health: -3 } },
      ],
    },
    {
      id: "fv_m_cup_grown",
      title: "The weaver's daughter",
      cond: (p, C) => C.land(p, "M") && C.adult(p) && C.flag(p, "fv_m_cup") && A.S.year - p.flags.fv_m_cup >= 12,
      w: 3, once: true,
      setup: (p, ctx) => { F.make(p, ctx, { sex: "F", age: 25, occ: "weaver" }); },
      text: "At the cloth market a weaver, {them}, recognises you before you recognise her: the girl who gave you water at the temple fair when you were a child. Her house has fallen on bad times. The temple is reading her father's debts at the burning ground next month, and a gift from a house of standing would be remembered at the reading.",
      choices: [
        { t: "Give the gift in your house's name", r: "The reader announces her father into a better house than the ledger says. Your aunt hears whose gift it was.", fx: { coin: -40, honor: 3, family: -4, them: { type: "friend", op: 30 } } },
        { t: "Buy her whole stock of cloth instead", r: "Money for cloth is not a gift and nobody can say otherwise. Her family eats this season.", fx: { coin: -30, them: { op: 20 }, skill: { trade: 1 } } },
        { t: "Wish her well and walk on", r: "She nods. You carry your own cup now.", fx: { happy: -2 } },
      ],
    },
    {
      id: "fv_a_diving_game",
      title: "Four minutes down",
      cond: (p, C) => C.land(p, "A", "M") && C.coast(p) && C.child(p) && C.age(p) >= 6,
      w: 4, once: true,
      text: "Children of the boats swim before they walk, and the best divers stay down four minutes. The boat children's game is to sit on the bottom holding a stone, and the last one up is chief until the next tide. The oldest girl has been down longer than anyone ever. You are still down, your chest burning, and she is still down beside you.",
      choices: [
        { t: "Stay down", check: { s: "athletics", s2: "wil", d: 48 },
          win: { r: "She goes up first. You come up after, seeing stars, and are chief of the boats until the next tide.", fx: { sta: 0.5, fame: 1, flag: "fv_a_diver" } },
          lose: { r: "You black out on the bottom. She drags you up by the hair and pounds the water out of you.", fx: { health: -5, newRel: { type: "friend", op: 20 }, flag: "fv_a_diver" } } },
        { t: "Let go of your stone", r: "You shoot up into the air. She comes up a long breath later, chief again. She grins at you all evening.", fx: { happy: 2, flag: "fv_a_diver" } },
        { t: "Tickle her", r: "She comes up shrieking and you come up laughing. Nobody is chief. Everybody is furious.", fx: { happy: 3, honor: -1 } },
      ],
    },
    {
      id: "fv_a_diver_grown",
      title: "Down on the stone",
      cond: (p, C) => C.land(p, "A", "M") && C.adult(p) && C.flag(p, "fv_a_diver") && A.S.year - p.flags.fv_a_diver >= 10,
      w: 3, once: true,
      text: "A pearl-buyer's boat has lost its anchor chest over the reef: silver, in nine fathoms. He offers a tenth of it to whoever can tie a line to the chest. The men of the harbour say nine fathoms is too deep. You used to sit on the bottom holding a stone longer than any child of the boats.",
      choices: [
        { t: "Dive for it", check: { s: "athletics", s2: "sta", d: 56 },
          win: { r: "Your ears scream at the bottom but your hands tie the knot. The chest comes up dripping, and a tenth of it is yours.", fx: { coin: 70, fame: 2 } },
          lose: { r: "You reach the chest and lose the line. You come up bleeding from both ears.", fx: { health: -8, wound: "ear" } } },
        { t: "Teach the buyer's boy to do it", r: "The boy goes down three times and ties it on the fourth. You get half the tenth for teaching.", fx: { coin: 35, skill: { sea: 1 } } },
        { t: "Leave the silver to the sea", r: "The sea keeps it. The harbour says you have lost your lungs. You know better.", fx: { piety: 1 } },
      ],
    },
    {
      id: "fv_d_calf_name",
      title: "A calf for your grandfather",
      cond: (p, C) => C.land(p, "D") && C.child(p) && C.age(p) >= 6,
      w: 4, once: true,
      text: "Cattle carry the ancestors' names. Your grandfather died at the start of the rains, and a red calf was born the same week. Your father says you are to name it for him and keep it, and that a cow named for one's own ancestor is never eaten and never sold. The calf has just kicked you in the knee.",
      choices: [
        { t: "Name it for your grandfather", r: "You say his name into the calf's ear. It kicks you again, which your father says is just like him.", fx: { piety: 3, family: 3, flag: "fv_d_calf" } },
        { t: "Ask for a calmer calf", r: "Your father says the dead choose their calves. The red one is named anyway, by him, and you keep it.", fx: { piety: 1, flag: "fv_d_calf" } },
        { t: "Name it for the kick instead", r: "Your father hits you. The calf gets your grandfather's name, and you get a second name from your cousins.", fx: { family: -3, happy: 2 } },
      ],
    },
    {
      id: "fv_d_calf_cow",
      title: "Your grandfather's cow",
      cond: (p, C) => C.land(p, "D") && C.adult(p) && C.flag(p, "fv_d_calf") && A.S.year - p.flags.fv_d_calf >= 12,
      w: 3, once: true,
      text: "The red calf you named for your grandfather is an old cow now, the best milker in the enclosure and the worst temper. It is a dry year and the bride-wealth for your marriage, or your child's, is short by one beast. A cow named for one's own ancestor is never sold. A cattle man from the Long Herds has offered three heifers for her.",
      choices: [
        { t: "Keep her", r: "She stays. The bride-wealth is found another way, slowly. She kicks you at milking, as always.", fx: { piety: 3, coin: -20 } },
        { t: "Sell her and take the heifers", r: "Three heifers. The marriage goes ahead. At the next funeral, you recite the herd and her name is missing.", fx: { coin: 40, piety: -5, family: 5 } },
        { t: "Give her to the bride's family with her name", r: "A named cow given with her name is an honour to the receiver. They take her with both hands.", fx: { honor: 3, family: 5, piety: 1 } },
      ],
    },
  ]);
})();
