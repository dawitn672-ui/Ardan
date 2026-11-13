// The release's event pack 7 of 30 (109 events, mostly bd_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-027). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const tagOf = p=>{const b=p&&p.blood?GD.BLOOD[p.blood.id]:null;return b?b.tag:""},
      kin = (p,t)=>!!(p&&p.blood)&&tagOf(p)===t,
      hid = (p,t)=>kin(p,t)&&!p.blood.show,
      houseOf = p=>{const L=p&&p.blood?LORE.bloodlines[p.blood.id]:null;return L&&L.name?String(L.name).replace(/\s*\(.*\)\s*/g,""):"your house"},
      bio = (p,s)=>{const x=A.prov(p.home);return!!(x&&x.biome&&x.biome.indexOf(s)>=0)},
      elev = p=>{const x=A.prov(p.home);return x&&x.elev?x.elev:0},
      age = p=>A.age(p),
      ap = (p,o,s)=>{const r=A.applyFx(p,o,{});return r?s+" "+r:s},
      shown = p=>!!(p.blood&&p.blood.show);
    A.defEvents([
      {
        id: "bd_sunborn_saffron",
        cond: (p,C)=>C.adult(p)&&C.female(p)&&C.blood(p,"sunborn"),
        w: 1.4,
        cool: 8,
        title: "A hundred shades",
        text: p=>`At the market in {home} a spice-seller swears his saffron is pure. Everyone nods. To your Corvane eyes it is ${A.pick(["three colours, not one: saffron, safflower and a dull red of brick dust","the wrong orange entirely, a dye-cut fake with a faint green sheen","half true threads and half dyed corn silk"])}.`,
        choices: [
          {
            t: "Call it out in front of the crowd",
            check: {s:"int",s2:"diplomacy",d:42},
            win: {
              r: "You hold a thread to the light and show them. The crowd turns on him. The market warden thanks you by name.",
              fx: {fame:2,honor:2,happy:3},
            },
            lose: {
              r: "Nobody else can see it. They think you are a fussy noblewoman picking a quarrel. The seller smirks.",
              fx: {happy:-3,wil:.5},
            },
          },
          {
            t: "Say nothing, buy only the true threads",
            r: "You pick through his jar thread by thread. He never knows why you smile.",
            fx: {coin:3,int:.3},
          },
          {
            t: "Offer your eyes to the dyers' guild for a fee",
            check: {s:"trade",s2:"int",d:38},
            win: {
              r: "The dyers pay well for a woman who can match a red across two bolts. Corvane daughters have done this for centuries.",
              fx: {coin:25,skill:{trade:3}},
            },
            lose: {
              r: "The guild master will not take advice from a woman with a name older than his city.",
              fx: {happy:-2},
            },
          },
        ],
      },
      {
        id: "bd_corvane_banner",
        cond: (p,C)=>C.adult(p)&&C.male(p)&&C.blood(p,"sunborn")&&!C.old(p),
        w: 1.4,
        once: !0,
        title: "Red and green",
        text: 'At the muster the captain points to the signal flags on the far hill. "Which is ours, the red or the green?" To you they are the same muddy grey. By the old custom of the Holy See, a Corvane son does not read banners, and so does not lead troops.',
        choices: [
          {
            t: "Admit it and ask for the quartermaster's ledger instead",
            r: "The captain nods; he knew the name. You will never lead a charge, but every sack of bread in the camp is now yours to count.",
            fx: {skill:{stewardship:4},wil:1,happy:-2},
          },
          {
            t: "Guess",
            check: {s:"int",s2:"ins",d:55},
            win: {r:"You guess right. Nobody notices. You feel sick anyway.",fx:{happy:1}},
            lose: {
              r: "Wrong. The captain says nothing, which is worse than shouting. The story is round the camp by supper.",
              fx: {honor:-3,happy:-5,wil:1.5},
            },
          },
          {
            t: "Learn the flags by their place and shape, not their colour",
            check: {s:"int",s2:"tactics",d:45},
            win: {
              r: 'You learn every flag by its staff, its position and its fold. The captain laughs. "Your great-grandfather should have thought of that."',
              fx: {skill:{tactics:4},int:.6,wil:1},
            },
            lose: {
              r: "There are too many flags and too little time. You give up, angry at your own eyes.",
              fx: {wil:1,happy:-3},
            },
          },
        ],
      },
      {
        id: "bd_lion_reach",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"lion"),
        w: 1.3,
        cool: 7,
        title: "The long arm",
        text: p=>`A bout in the practice yard. Your opponent is quick, but your Valdane arm reaches a hand further than his. ${age(p)>=36?"Lately, though, your heart pounds after a hard ride, and the physician has said the word every Valdane fears.":"The sun-sisters say the long blood is a gift paid for later."}`,
        choices: [
          {
            t: "Fight at the end of your reach",
            check: {s:"sword",s2:"ins",d:40,bonus:()=>10},
            win: {
              r: "He never gets inside your point. Three touches to none. The yard goes quiet.",
              fx: {skill:{sword:3},fame:1,happy:3},
            },
            lose: {
              r: "He ducks under your arm and taps your ribs. Reach is not everything.",
              fx: {skill:{sword:2},wil:.5},
            },
          },
          {
            t: "Push hard to the end of the hour",
            check: {s:"sta",s2:"wil",d:50},
            win: {r:"You wear him down and finish strong.",fx:{sta:.6,skill:{sword:2}}},
            lose: {
              r: "Your chest goes tight and the yard tilts. You sit on the bench a long time, listening to your own heart.",
              fx: {health:-12,cause:"a weak Valdane heart",wil:1.5},
            },
          },
          {
            t: "Stop early. A Valdane lives by knowing when",
            r: "You hand him the sword and walk off. Some call it pride. You call it the next ten years.",
            fx: {health:3,wil:.5},
          },
        ],
      },
      {
        id: "bd_iron_sink",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"ironbone"),
        w: 1.4,
        cool: 10,
        title: "Like an anvil",
        text: "The ferry lurches at the ford and you go over the side. An Ironside does not float. The water closes over your head and you go down like a dropped anvil, feet first into the mud.",
        choices: [
          {
            t: "Walk along the bottom toward the bank",
            check: {s:"wil",s2:"sta",d:45},
            win: {
              r: "Twenty slow steps through black water, chest burning. You climb out of the reeds to a crowd of open mouths.",
              fx: {wil:2,fame:2,sta:.4},
            },
            lose: {
              r: "You lose your way in the dark and come up half-drowned. The ferrymen pull you out with a boathook.",
              fx: {health:-20,cause:"near-drowning",wound:"lungs",wil:1.5},
            },
          },
          {
            t: "Grab for the ferry rope as you sink",
            check: {s:"ins",s2:"str",d:40},
            win: {
              r: "Your hand finds the rope. Iron bones are good for one thing: you do not let go.",
              fx: {str:.4,happy:2},
            },
            lose: {
              r: "You miss. They fish you out on the third try, blue and coughing.",
              fx: {health:-15,cause:"near-drowning",wil:1},
            },
          },
          {
            t: "Next time, cross by the bridge, however far",
            r: "You swear it there in the mud. Two of your line have drowned. You will not be the third.",
            fx: {wil:1,happy:-2},
          },
        ],
      },
      {
        id: "bd_frost_snow",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"frost"),
        w: 1.4,
        cool: 8,
        title: "Sleeping in the snow",
        text: p=>`A blizzard catches you on the road to {town} with ${A.pick(["two drovers","a peddler and his boy","three of your guards"])}. They shake and weep with cold. You only feel warm and sleepy: the Winterborn blood. But you have not eaten since dawn, and your house knows what hunger does to it.`,
        choices: [
          {
            t: "Dig a snow hole, pack them in, and sleep",
            check: {s:"survival",s2:"sta",d:35},
            win: {
              r: "By morning you are all alive. The others swear they owe you their fingers.",
              fx: {wil:1,fame:1,newRel:{type:"friend",op:30}},
            },
            lose: {
              r: "You wake weak and shaking. The hunger got you before the cold could.",
              fx: {health:-15,cause:"hunger and cold",wil:1.5},
            },
          },
          {
            t: "Carry the weakest on your back to the next village",
            check: {s:"str",s2:"wil",d:50},
            win: {
              r: "Bare-handed in the frost, you walk all night. The village rings its bell for you.",
              fx: {fame:3,honor:3,wil:2,str:.5},
            },
            lose: {
              r: "Your legs go from under you a mile short. Other men find you all at dawn.",
              fx: {health:-18,cause:"hunger and cold",wil:2},
            },
          },
          {
            t: "Eat every crumb in the packs first, then wait it out",
            r: "You eat like a wolf and sleep like a stone. The others look at the empty sacks and say nothing.",
            fx: {health:3,happy:-1},
          },
        ],
      },
      {
        id: "bd_wakeful_fit",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"wakeful"),
        w: 1.4,
        cool: 7,
        title: "The bold fit",
        text: "For two weeks you have slept four hours a night and felt like a king. Ideas pour out of you. Tonight you are certain: put every sun you have into one venture. Your family has seen this before. They remember the pass tax of 975.",
        choices: [
          {
            t: "Do it. The feeling has never lied",
            check: {s:"int",s2:"trade",d:58},
            win: {
              r: "It works. You double your money, and for a month you cannot stop laughing.",
              fx: {coinPct:.6,happy:8},
            },
            lose: {
              r: "It fails. Then the black mood comes, as it always does, and lasts until the thaw.",
              fx: {coinPct:-.5,happy:-15,wil:2.5},
            },
          },
          {
            t: "Write the plan down and wait one week",
            check: {s:"wil",s2:"int",d:45},
            win: {
              r: "A week later you read it and laugh. Half was brilliant. You keep that half.",
              fx: {wil:1.5,int:.5,coin:10},
            },
            lose: {
              r: "You cannot wait. You spend half your purse in three days and feel nothing but restless.",
              fx: {coinPct:-.25,wil:1},
            },
          },
          {
            t: "Spend the waking hours on books instead",
            r: "While the house sleeps you read through two winters' worth of books.",
            fx: {skill:{learning:4},int:.8},
          },
        ],
      },
      {
        id: "bd_balance_bridge",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"balance"),
        w: 1.4,
        cool: 8,
        title: "The broken bridge",
        text: "Spring floods have taken the bridge to {town}. One beam still spans the torrent, slick and narrow. The only other way across is the ferry, and a Stonefoot on a boat is a Stonefoot on his knees.",
        choices: [
          {
            t: "Walk the beam",
            check: {s:"spd",s2:"wil",d:45,bonus:()=>15},
            win: {
              r: "You walk it like a road while the crowd on the bank holds its breath. A carter offers to pay you to carry his letters across.",
              fx: {fame:2,coin:4,spd:.4},
            },
            lose: {
              r: "A gust takes you on the last step. You land in the shallows and crawl out bruised.",
              fx: {health:-10,cause:"a fall into a flood",wil:1},
            },
          },
          {
            t: "Take the ferry and endure it",
            check: {s:"wil",s2:"sta",d:55},
            win: {
              r: "Grey-faced and silent, you stay on your feet the whole way. You count that as a victory.",
              fx: {wil:2},
            },
            lose: {
              r: "You faint on the deck halfway over and wake on the far bank with a ferryman's boot under your head.",
              fx: {happy:-5,honor:-1,wil:1.5},
            },
          },
          {
            t: "Wait three days for the water to fall",
            r: "You lose three days and keep your dignity.",
            fx: {happy:-1},
          },
        ],
      },
      {
        id: "bd_deeplung_dive",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"deeplung")&&!C.old(p),
        w: 1.4,
        cool: 8,
        title: "Under the black water",
        text: p=>`Shouts from the ${A.C.coast(p)?"quay":"mill-pond"}: a child has gone under and not come up. The water is ${A.pick(["black and cold","thick with silt","deep, and full of weed"])}. Others cannot stay down past a minute. You can stay down for five.`,
        choices: [
          {
            t: "Dive",
            check: {s:"sta",s2:"wil",d:40,bonus:()=>20},
            win: {
              r: "You find the child tangled in weed at the bottom and bring them up. They cough. They live. The whole town knows your name by nightfall.",
              fx: {fame:4,honor:3,wil:1,deed:"Dived and brought up a drowned child alive"},
            },
            lose: {
              r: "You find the child, but too late. You carry the small body to its mother.",
              fx: {wil:2.5,happy:-8,honor:1},
            },
          },
          {
            t: "Dive deep and fast, whatever it costs your ears",
            check: {s:"sta",s2:"ins",d:30,bonus:()=>20},
            win: {
              r: "You hit the bottom in seconds and bring the child up. Something in your ear tears with a pop.",
              fx: {fame:4,honor:3,wound:"ear",deed:"Dived and brought up a drowned child alive"},
            },
            lose: {
              r: "Too fast, too deep. Your eardrum bursts, and you come up dizzy and empty-handed.",
              fx: {wound:"ear",health:-8,cause:"a burst eardrum",wil:2},
            },
          },
          {
            t: "Shout for a rope and a boat",
            r: "The boat comes. The child does not. You will remember this.",
            fx: {wil:1,happy:-6,honor:-2},
          },
        ],
      },
      {
        id: "bd_falcon_banner",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"falcon"),
        w: 1.4,
        cool: 7,
        title: "A banner at three kilometers",
        text: p=>`From the ${A.C.soldier(p)?"watchtower":"church tower of {home}"} you see riders on the far ridge, three kilometers off. Others see dust. You see the banner: ${A.pick(["a black boar on gold","three white towers on red","a broken wheel, the badge of a free company","the colours of {enemy}"])}. It is noon, and the sun is already driving needles behind your eyes.`,
        choices: [
          {
            t: "Shade your eyes and read every detail",
            check: {s:"ins",s2:"wil",d:45},
            win: {
              r: "You count forty lances and a baggage train. Your report reaches the lord before the riders reach the valley.",
              fx: {fame:2,favor:6,merit:2,ins:.4},
            },
            lose: {
              r: "You stare too long. The headache drops you to your knees, and you are blind with it until dusk.",
              fx: {health:-6,cause:"a blinding headache",happy:-4,wil:1},
            },
          },
          {
            t: "Report what you saw at once and go below",
            r: "A quick word and you retreat to the dark stairwell. Enough to raise the alarm.",
            fx: {favor:3,merit:1},
          },
          {
            t: "Buy green glass shades in the next town (8 suns)",
            req: p=>p.coin>=8,
            r: "Falcones have worn green glass for a century. Now you see why. The world is dimmer, and kinder.",
            fx: {coin:-8,happy:3,flag:"bd_greenglass"},
          },
        ],
      },
      {
        id: "bd_falcon_watchroll",
        cond: (p,C)=>C.child(p)&&C.blood(p,"falcon")&&C.ageAdj(p)>=6,
        once: !0,
        w: 2,
        title: "The Tower Watch roll",
        text: "You are six, and the house steward writes your name on the Tower Watch roll, as he has for every Falcone child who shows the eyes. Five years of service on the walls will follow. Today he shows you the sea from the top of the tower and asks what you see.",
        choices: [
          {
            t: '"A ship with a patched red sail. Thirty kilometers out."',
            check: {s:"ins",s2:"int",d:20,bonus:()=>10},
            win: {
              r: `The steward checks with a sailor's glass and goes white. "Patched. Red. Yes." He gives you a sweet.`,
              fx: {ins:.6,happy:4,fame:1},
            },
            lose: {
              r: "You see it, but the sun stabs you and you start to cry. The steward gives you a dark cloth for your eyes.",
              fx: {wil:.8,happy:-2},
            },
          },
          {
            t: "Ask why you must serve and your cousins need not",
            r: '"Because you can see," he says. "The rest of us cannot." You are proud and angry at once.',
            fx: {wil:.6,int:.3},
          },
        ],
      },
      {
        id: "bd_memory_nights",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"memory"),
        w: 1.4,
        cool: 6,
        title: "Nothing is forgotten",
        text: p=>`You cannot sleep. You remember everything: ${A.pick(["every word {father} said to you at fourteen","the exact sum a friend borrowed nine years ago, and the day","the face of every man who ever laughed at you","every number in a ledger you read once, a decade ago"])}. It all plays again, night after night. A Lunetti forgets nothing, and some of them walk into the harbor.`,
        choices: [
          {
            t: "Walk the streets until dawn",
            r: "You walk until your legs ache and the bells ring Prime. It helps a little.",
            fx: {wil:2,happy:-4,sta:.3},
          },
          {
            t: "Pour it all into a ledger, page after page",
            check: {s:"learning",s2:"wil",d:40},
            win: {
              r: "Written down, it stops shouting. You sleep for the first time in a week. The book is a terrible and wonderful thing.",
              fx: {int:.6,wil:1.5,happy:3,skill:{learning:3}},
            },
            lose: {
              r: "The more you write, the more you remember. Dawn finds you surrounded by paper.",
              fx: {wil:1,happy:-5},
            },
          },
          {
            t: "Use it. Call in the old debts you remember to the penny",
            check: {s:"int",s2:"trade",d:40},
            win: {
              r: "You name each date and sum. Nobody can argue with you. Your purse grows, and so does your reputation for coldness.",
              fx: {coin:35,skill:{trade:2},happy:-1},
            },
            lose: {r:"They pay, but they hate you for remembering.",fx:{coin:12,happy:-4}},
          },
          {
            t: "Talk to someone",
            req: (p,C)=>C.married(p)||C.hasRel(p,"friend","bestfriend"),
            r: "You talk until the candle dies. Someone listened. You sleep.",
            fx: {happy:6,wil:1},
          },
        ],
      },
      {
        id: "bd_taster_cup",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"taster"),
        w: 1.4,
        cool: 8,
        title: "A bitter edge",
        text: p=>`At a ${A.pick(["guild feast","wedding supper","lord's table","banquet for a visiting envoy"])} the wine reaches your tongue with the faintest bitter edge. One part in a hundred, perhaps. Wolfsbane? Or just a bad barrel? Around you, men are already drinking. The rich food is making you queasy anyway, as it always does.`,
        choices: [
          {
            t: "Stand up and stop the drinking",
            check: {s:"int",s2:"ins",d:42,bonus:()=>15},
            win: {
              r: "The steward tests the barrel on a dog. The dog dies. Every guest at the table now owes you a life.",
              fx: {fame:4,honor:3,favor:8,newRel:{type:"friend",op:40}},
            },
            lose: {
              r: "It was a sour barrel. The host is furious. A Doravelli who cries poison over bad wine is laughed at for years.",
              fx: {honor:-3,happy:-6,wil:1},
            },
          },
          {
            t: "Quietly swap the host's cup for a fresh one",
            check: {s:"stealth",s2:"ins",d:40},
            win: {
              r: "The host drinks clean wine and never knows. Later, a servant runs from the house in the night.",
              fx: {skill:{intrigue:3},honor:1},
            },
            lose: {r:"You are seen fiddling with the host's cup. Now people wonder about you.",fx:{honor:-2,happy:-3}},
          },
          {
            t: "Push your plate away and leave early, sick",
            r: "Your stomach turns at the spice and the smoke. You go home grey and thin, as Doravellis often are.",
            fx: {health:-4,cause:"a weak stomach",happy:-2},
          },
        ],
      },
      {
        id: "bd_doravelli_cup",
        cond: (p,C)=>C.child(p)&&kin(p,"taster")&&C.age(p)>=6,
        once: !0,
        w: 3,
        title: "The Rule of the Cup",
        text: "You are seven. By the Rule of the Cup of 971, every child of Doravelli blood is given a cup of water with one drop of wolfsbane. A child who tastes it belongs to the house and goes to the Staple house to train. Your mother holds your hand very tightly.",
        choices: [
          {
            t: "Sip it slowly, like they told you",
            fx: p=>shown(p)?ap(p,{wil:.6,happy:2,flag:"bd_doravelli_named"},"It tastes like licking a cold iron gate. You spit it out and say so. The steward writes your name in the book of the Cup."):ap(p,{happy:-1},"It tastes like water. You drink it all. The steward nods kindly and closes the book. You are a Doravelli by blood, but not by the Cup."),
          },
          {
            t: "Ask why the grown-ups look so scared",
            fx: p=>shown(p)?ap(p,{int:.4,flag:"bd_doravelli_named"},"You taste it before they answer, and make a face. Everyone breathes out."):ap(p,{int:.4},'"Because one day you might stand between a prince and his death," your mother says. You taste nothing. She looks relieved and sad at once.'),
          },
        ],
      },
      {
        id: "bd_sixfinger_grip",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"sixfinger"),
        w: 1.4,
        cool: 8,
        title: "Six fingers",
        text: p=>`${A.pick(["Your horse bolts on the cliff road","A rope snaps on the castle stair","A cart slides toward the ditch with a child on it"])}, and your six-fingered hand closes on the reins like a vice. The danger passes. But an old woman by the road makes the sign against evil and spits: "Tessaran hand. A curse on the land." And there is a fluttering in your chest that has not quite stopped.`,
        choices: [
          {
            t: "Show her the hand that just saved a life",
            check: {s:"diplomacy",s2:"wil",d:42},
            win: {
              r: 'You hold it open for the crowd. "A curse that holds the reins," someone mutters, and laughs. The old woman shuffles off.',
              fx: {fame:1,honor:2,wil:1},
            },
            lose: {
              r: "They stare at the hand, not the deed. You put it in your sleeve and ride on.",
              fx: {happy:-4,wil:1.5},
            },
          },
          {
            t: "Sit down until your heart settles",
            r: "Your house buries its young with weak hearts. You wait in the grass until the fluttering stops.",
            fx: {health:3,wil:.5},
          },
          {
            t: "Ignore both and ride on hard",
            check: {s:"sta",s2:"wil",d:45},
            win: {r:"The flutter fades on the road.",fx:{sta:.3}},
            lose: {
              r: "A mile on, the world greys out and you slide from the saddle. You wake with a farmer fanning your face.",
              fx: {health:-15,cause:"the Tessaran heart",wil:1.5},
            },
          },
        ],
      },
      {
        id: "bd_bull_appetite",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"bull"),
        w: 1.4,
        cool: 6,
        title: "The bull eats",
        text: p=>`A lean year in {home}. You eat what three men eat, and the household notices. ${age(p)>=36?"Your knees are stiff in the mornings now, and your heart labours on the stairs. Few full bulls live past fifty.":"Your shoulders strain your shirts, but a long march still leaves you blown."}`,
        choices: [
          {
            t: "Eat your fill. A bull starves fast (15 suns)",
            req: p=>p.coin>=15,
            r: "You buy meat at famine prices and feel your strength come back.",
            fx: {coin:-15,str:.5,happy:2},
          },
          {
            t: "Go hungry with everyone else",
            r: "You tighten your belt with the rest. Your strength drains away week by week, and you grit your teeth.",
            fx: {health:-10,cause:"hunger",wil:2,str:-.3},
          },
          {
            t: "Go out and hunt your own meat",
            check: {s:"survival",s2:"str",d:45},
            win: {
              r: "You bring back a boar on your shoulders and share it. The village eats well for a week.",
              fx: {fame:1,skill:{survival:3},honor:1},
            },
            lose: {r:"Three days in the woods, nothing to show but blisters.",fx:{health:-5,cause:"hunger",wil:1}},
          },
        ],
      },
      {
        id: "bd_bull_cousin",
        cond: (p,C)=>C.adult(p)&&hid(p,"bull")&&!C.married(p)&&!C.old(p),
        once: !0,
        w: 1.5,
        title: "A Harrow match",
        text: "You carry the bull-blood hidden: strong, but no giant. The elders of House Harrow want a full bull in the next generation, and full bulls are born only when two carriers wed. They have a cousin picked out from Harrowsett.",
        choices: [
          {
            t: "Agree. The house needs its bulls",
            r: "The elders clasp your hand. Your children may be giants, and may die at fifty. That is the Harrow bargain.",
            fx: {honor:3,happy:-1,flag:"bd_harrow_match"},
          },
          {
            t: "Refuse. You will marry for love",
            check: {s:"diplomacy",s2:"wil",d:45},
            win: {r:"They grumble, but they let you go. There are other cousins.",fx:{wil:1.5,happy:3}},
            lose: {
              r: "They let you go, coldly. You will not be welcome at Copperham this year.",
              fx: {wil:1.5,honor:-2,rel:{who:"father",op:-10}},
            },
          },
          {
            t: "Ask to meet the cousin first",
            r: "You meet. You talk. You do not hate each other, which in noble marriages is a fine start.",
            fx: {happy:2,newRel:{type:"friend",op:25}},
          },
        ],
      },
      {
        id: "bd_owl_night",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"owl"),
        w: 1.4,
        cool: 7,
        title: "Starlight",
        text: "A moonless night. The others see only black. To your owl-eyes the field is grey and clear, and you see shapes moving through the hedge toward the byres: four men, crouched, with sacks. By day you wear dark gauze and squint like an old woman. By night you are the best eyes in the land.",
        choices: [
          {
            t: "Stalk them alone in the dark",
            check: {s:"stealth",s2:"ins",d:45,bonus:()=>15},
            win: {
              r: "You come up behind the last man and put him on the ground before the others know you are there. They run.",
              fx: {fame:2,skill:{stealth:3},ins:.5},
            },
            lose: {
              r: "A lantern flares in your face and you are dazzled. Someone clubs you and the thieves get away.",
              fx: {health:-12,cause:"a cudgel blow",wound:"concussion",wil:1},
            },
          },
          {
            t: "Wake the household and lead them out",
            check: {s:"command",s2:"ins",d:40},
            win: {
              r: "You call every move in a whisper. The thieves are caught in the hedge with the sacks still empty.",
              fx: {skill:{command:3},honor:2,fame:1},
            },
            lose: {r:"Your sleepy helpers blunder and shout. The thieves vanish.",fx:{happy:-2}},
          },
          {
            t: "Let them go. Count the sheep in the morning",
            r: "You lose two ewes and a night's sleep.",
            fx: {coin:-6,happy:-2},
          },
        ],
      },
      {
        id: "bd_laughing_fester",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"laughing"),
        w: 1.4,
        cool: 7,
        title: "The wound you did not feel",
        text: p=>`A week ago you ${A.pick(["cut your calf on a rusted nail","took a sword-tip in the side in practice","burned your hand on a forge and kept working","broke a finger and laughed"])}. You felt nothing. A Montaro never does. Now it smells sweet and wrong, and red lines climb from it.`,
        choices: [
          {
            t: "Let the barber cut it clean and burn it",
            r: "He works with a hot knife while you watch with mild interest. It will heal, a third faster than anyone else's.",
            fx: {health:-6,cause:"a festering wound",coin:-3,wil:.5},
          },
          {
            t: "Find a herbalist with honey and moss",
            check: {s:"medicine",s2:"int",d:40},
            win: {
              r: "Honey, moss, clean linen boiled every day. The red lines fade.",
              fx: {skill:{medicine:3},health:2},
            },
            lose: {
              r: "The poultice is not enough. You burn with fever for a week.",
              fx: {health:-20,cause:"a festering wound",wil:2},
            },
          },
          {
            t: "Ignore it. It does not hurt",
            check: {s:"sta",s2:"wil",d:60},
            win: {r:"Somehow, the laughing blood wins. It heals on its own.",fx:{sta:.3}},
            lose: {
              r: "The rot goes deep. You nearly die, and you will walk with a limp for life. Many Montaros die of wounds they ignored.",
              fx: {health:-32,cause:"a festering wound",wound:"limp",wil:2.5},
            },
          },
        ],
      },
      {
        id: "bd_montaro_nettle",
        cond: (p,C)=>C.child(p)&&kin(p,"laughing")&&C.age(p)>=4,
        once: !0,
        w: 3,
        title: "The nettle test",
        text: "You are five. A Montaro uncle you have never met holds out a bunch of stinging nettles and tells you to squeeze them tight. Every child of Montaro blood takes the nettle test, and any child with the laughing blood goes to Vitia to be raised under the Montaro name.",
        choices: [
          {
            t: "Squeeze as hard as you can",
            fx: p=>shown(p)?ap(p,{wil:1,flag:"bd_vitia"},'Your palm comes up in white lumps. You feel nothing at all, and you giggle. Your uncle smiles. "Vitia, then." Your mother turns away.'):ap(p,{wil:.6,happy:-2},"It burns like fire. You scream and drop them. The uncle nods, almost kindly, and leaves. You stay home."),
          },
          {
            t: "Refuse and hide behind your mother",
            fx: p=>shown(p)?ap(p,{flag:"bd_vitia"},"Your uncle simply takes your hand and closes it on the nettles himself. You feel nothing. You go to Vitia that spring."):ap(p,{happy:1},'Your uncle laughs, brushes a leaf on your wrist, and watches you yelp. "Not one of ours." You stay home.'),
          },
        ],
      },
      {
        id: "bd_oak_thief",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"oak"),
        w: 1.4,
        cool: 7,
        title: "Built to stand",
        text: "A cutpurse slices your belt-string in the market crowd and runs. Cinderwell legs were made for holding a shield-line, not for chasing anyone. He is already ten paces off.",
        choices: [
          {
            t: "Chase him anyway",
            check: {s:"spd",s2:"wil",d:60},
            win: {
              r: "Somehow you catch him at the fountain. He looks more surprised than you.",
              fx: {spd:.5,coin:2,happy:3},
            },
            lose: {
              r: "He is gone before you have turned around. The crowd laughs at the lumbering noble.",
              fx: {coin:-12,happy:-4,wil:1},
            },
          },
          {
            t: "Throw the nearest thing at his head",
            check: {s:"ins",s2:"str",d:45},
            win: {
              r: "A cabbage, thrown with Shield Yard arms. He drops like a sack. You get your purse back.",
              fx: {fame:1,happy:4},
            },
            lose: {r:"The cabbage hits a priest. You pay for the cabbage and lose the purse.",fx:{coin:-13,honor:-1}},
          },
          {
            t: "Plant your feet and shout for the watch",
            r: "The watch comes slowly. Your purse does not come at all.",
            fx: {coin:-12,wil:.5},
          },
        ],
      },
      {
        id: "bd_thirstless_well",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"thirstless"),
        w: 1.4,
        cool: 8,
        title: "The second well is dry",
        text: "The caravan reaches the second well and finds only sand and a dead bird. The next water is two days off. Men begin to count mouthfuls. You can go two days on half of what they need: the Zahiri gift.",
        choices: [
          {
            t: "Give your share to the weakest",
            r: "You walk two days on a few swallows and give the rest to a sick boy and an old camel-man. They live. In the tents, they call you a prince of the old blood.",
            fx: {honor:4,fame:2,wil:1.5,health:-4,cause:"thirst"},
          },
          {
            t: "Ride ahead alone to find the next well",
            check: {s:"survival",s2:"sta",d:45},
            win: {
              r: "You find the water and ride back with full skins before anyone dies.",
              fx: {fame:3,skill:{survival:3},sta:.5},
            },
            lose: {
              r: "You lose the track for a day. When you find the well, you find the caravan already there.",
              fx: {health:-8,cause:"thirst",wil:1},
            },
          },
          {
            t: "Keep your water. You may need it",
            r: "You need very little of it, in the end. Nobody forgets that you kept it.",
            fx: {honor:-3,happy:-2},
          },
        ],
      },
      {
        id: "bd_thirstless_stone",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"thirstless")&&C.age(p)>=22,
        w: 1.2,
        cool: 9,
        title: "The stone",
        text: "A pain in your back like a hot spear. You fold up on the floor and cannot stand. Almost every Zahiri of your age passes stones, and the Dry Month fast makes it worse. This year the fast falls in the heat.",
        choices: [
          {
            t: "Drink water day and night, fast or no fast",
            r: "You break the fast and drink jug after jug until the stone passes, with a scream. The imam is not pleased with you.",
            fx: {piety:-4,health:2,wil:.5},
          },
          {
            t: "Keep the fast. Bear it",
            check: {s:"wil",s2:"sta",d:52},
            win: {
              r: "Three days of agony. The stone passes on the last night of the fast. You are prouder than you have ever been.",
              fx: {wil:3,piety:4,health:-8,cause:"a kidney stone"},
            },
            lose: {
              r: "You pass out on the second day. The physicians pour water into you anyway. Something in your back is never quite right again.",
              fx: {wil:2,health:-22,cause:"a kidney stone",piety:2},
            },
          },
          {
            t: "Send for a stone-cutter (20 suns)",
            req: p=>p.coin>=20,
            check: {s:"sta",s2:"wil",d:45},
            win: {
              r: "The cutter is good. Quick hands, clean knife, and you live.",
              fx: {coin:-20,health:-6,cause:"a stone-cutter's knife"},
            },
            lose: {
              r: "The cutter is drunk. You survive, barely, and a fever follows.",
              fx: {coin:-20,health:-25,cause:"a stone-cutter's knife",wil:2},
            },
          },
        ],
      },
      {
        id: "bd_sandeye_glare",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"sandeye"),
        w: 1.4,
        cool: 7,
        title: "Through the glare",
        text: "Noon on the salt flat, the air shaking with heat. The guards squint at nothing. Your Bahar eyes see clearly through the glare: riders, crouched behind a dune two kilometers off, waiting for the loaded camels. But the attack will come at dusk, when you are almost blind.",
        choices: [
          {
            t: "Lead a strike at noon, while they cannot see you",
            check: {s:"tactics",s2:"ins",d:45,bonus:()=>10},
            win: {
              r: "You come at them out of the sun. They scatter, leaving water skins and a fine mare.",
              fx: {fame:3,coin:30,skill:{tactics:3}},
            },
            lose: {
              r: "They see you coming after all. A bloody skirmish in the dunes, and you take a cut.",
              fx: {health:-14,cause:"a raider's blade",wound:"scar_arm",wil:1},
            },
          },
          {
            t: "Turn the caravan wide and push on before dark",
            check: {s:"survival",s2:"command",d:40},
            win: {
              r: "You reach the next camp before sunset. The raiders find an empty track.",
              fx: {skill:{survival:2},honor:2},
            },
            lose: {
              r: "Night falls on the open sand. You cannot see your own hand; others must lead you. The raiders take three camels.",
              fx: {coin:-10,happy:-4,wil:1.5},
            },
          },
          {
            t: "Warn the guides and let them handle it",
            r: "They thank you. A chief's line that cannot see at night must trust other eyes. Tonight you do.",
            fx: {wil:.5},
          },
        ],
      },
      {
        id: "bd_feverproof_plague",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"feverproof"),
        w: 1.4,
        cool: 9,
        title: "The delta fever",
        text: "The summer fever runs through {home}. The priests blame bad air rising from the mud and the Flood Mother's anger. Whole streets lie shaking under blankets. You walk among them untouched, as your house always has. But your blood gives no shield against flux or famine.",
        choices: [
          {
            t: "Nurse the sick through the summer",
            check: {s:"medicine",s2:"wil",d:40},
            win: {
              r: "You carry water, cool brows and bury the dead. When the river falls, the street brings you bread and flowers.",
              fx: {fame:3,honor:4,piety:2,skill:{medicine:4},wil:1.5},
            },
            lose: {
              r: "The fever cannot touch you, but the flux in the camp does. You lie weak for a month.",
              fx: {health:-18,cause:"the bloody flux",wil:2,honor:2},
            },
          },
          {
            t: "Organise the healthy to burn the bad air with smoke",
            check: {s:"command",s2:"int",d:42},
            win: {
              r: "Smoke pots in every street. Nobody knows why it helps, but fewer die where the smoke is thick.",
              fx: {fame:2,skill:{command:3}},
            },
            lose: {r:"The smoke fires get out of hand and a granary burns.",fx:{coin:-15,honor:-2}},
          },
          {
            t: "Stay in the palace and wait",
            r: "You wait it out behind closed doors. Your gift goes to waste this year.",
            fx: {happy:-2},
          },
        ],
      },
      {
        id: "bd_runner_message",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"runner")&&!C.old(p),
        w: 1.4,
        cool: 7,
        title: "One hundred kilometers",
        text: p=>`${A.C.atWar(p)?"Enemy riders are on the river road.":"A dam has cracked above the valley."} A warning must reach {town}, one hundred kilometers off, before sunset tomorrow. No horse can do it on these hills. A Kanemba can.`,
        choices: [
          {
            t: "Run",
            check: {s:"sta",s2:"wil",d:45,bonus:()=>15},
            win: {
              r: "You run through the night and arrive at noon with the message in your fist. They sing your name the old way, the way the Rememberers do.",
              fx: {
                fame: 4,
                honor: 3,
                sta: .8,
                favor: 6,
                epithet: "Swiftfoot",
                deed: "Ran a hundred kilometers in a day to carry a warning",
              },
            },
            lose: {
              r: "You arrive with blood pouring from your nose and the world spinning. The message is in time. You are not well for a week.",
              fx: {health:-15,cause:"thick blood and exhaustion",fame:2,wil:2},
            },
          },
          {
            t: "Run, but pace yourself and rest at the halfway well",
            check: {s:"sta",s2:"survival",d:38,bonus:()=>15},
            win: {r:"Steady as a heartbeat. You arrive at dusk, just in time.",fx:{fame:2,sta:.5}},
            lose: {r:"You rest too long. The warning comes an hour late.",fx:{happy:-5,wil:1}},
          },
          {t:"Send a rider and hope",r:"The rider is a day late. You will always wonder.",fx:{happy:-3}},
        ],
      },
      {
        id: "bd_runner_blood",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"runner")&&C.age(p)>=40,
        w: 1.3,
        cool: 8,
        title: "Thick blood",
        text: "Headaches every afternoon. Your face is red even in the shade, and your nose bleeds on the slightest climb. Five emperors of your line died of strokes before fifty. The court physician arrives with his bowl and lancet.",
        choices: [
          {
            t: "Let him bleed you",
            r: "He takes a bowl of dark blood from your arm. Strangely, for once the cure works: your head clears for months.",
            fx: {health:6,happy:2},
          },
          {
            t: "Refuse. You are a runner, not a patient",
            check: {s:"sta",s2:"wil",d:55},
            win: {r:"The headaches pass with the hot season.",fx:{wil:1}},
            lose: {
              r: "One morning your left hand will not close and your words come out wrong. It fades in a week. The next one may not.",
              fx: {health:-22,cause:"a stroke",wil:2,int:-.5},
            },
          },
          {
            t: "Run less, rest more, drink more water",
            r: "You give up the long runs. It is like giving up an arm.",
            fx: {health:3,happy:-4,wil:1},
          },
        ],
      },
      {
        id: "bd_twin_childbed",
        cond: (p,C)=>C.adult(p)&&kin(p,"twin")&&!C.old(p),
        w: 1.4,
        cool: 9,
        title: "Two cords",
        setup: (p,ctx)=>{ctx.cousin=A.givenName(p.cult,"F")},
        text: "Your cousin {cousin} of House Asfari is in childbed with twins, as so many women of your line are. The labour has gone on a day and a night. Five of the last nine royal Asfari mothers died this way. The Rememberers wait outside with two cords to tie the babies onto the royal line.",
        choices: [
          {
            t: "Ride for the best midwife in {capital}",
            check: {s:"riding",s2:"sta",d:45},
            win: {
              r: "You kill a horse getting her there, but she comes in time. Two small boys, one mother, all alive.",
              fx: {honor:3,fame:1,skill:{riding:3},newRel:{type:"friend",op:35}},
            },
            lose: {r:"You arrive with the midwife at dawn. The twins live. {cousin} does not.",fx:{wil:2.5,happy:-8}},
          },
          {
            t: "Sit with her and hold her hand through it",
            r: "You stay through the worst of it. When it is over she is grey and weak, but breathing. Two cords are tied.",
            fx: {wil:1.5,honor:2,newRel:{type:"friend",op:30}},
          },
          {
            t: "Pray at the shrine of the ancestors",
            r: "You pray all night. In the morning there are two new names in the house and one exhausted mother. You will never know if the prayer mattered.",
            fx: {piety:4,wil:.5},
          },
        ],
      },
      {
        id: "bd_boneless_bonds",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"boneless"),
        w: 1.4,
        cool: 8,
        title: "No rope holds a Keshari",
        text: "Robbers on the coast road tie you to a palm tree and go through your packs, laughing. They tied your wrists like any man's. You are not any man. Your thumb folds flat, your shoulder rolls, and the rope begins to slide.",
        choices: [
          {
            t: "Slip free and creep away while they argue over your purse",
            check: {s:"stealth",s2:"spd",d:40,bonus:()=>20},
            win: {
              r: "You are gone into the trees before they look up. Rope Hall training, never wasted.",
              fx: {skill:{stealth:3},happy:4,coin:-5},
            },
            lose: {
              r: "Your shoulder slips out of its socket with a wet click. You get away, but you cannot lift your arm for a month.",
              fx: {health:-12,cause:"a dislocated shoulder",wound:"back",coin:-10,wil:1.5},
            },
          },
          {
            t: "Slip free and take your purse back",
            check: {s:"unarmed",s2:"spd",d:52,bonus:()=>10},
            win: {
              r: "They turn to see their captive behind them with a branch. Two run. You get everything back.",
              fx: {fame:2,coin:5,skill:{unarmed:3}},
            },
            lose: {
              r: "Your knee gives way as you jump, the way Keshari knees do. They beat you and leave you tied again, tighter.",
              fx: {health:-18,cause:"a robber's beating",wound:"bad_knee",coin:-15,wil:2},
            },
          },
          {
            t: "Stay tied and let them take the purse",
            r: "They take it and leave. You slip the rope at your leisure and walk home lighter.",
            fx: {coin:-15},
          },
        ],
      },
      {
        id: "bd_bear_doorpost",
        cond: (p,C)=>C.male(p)&&kin(p,"bear")&&C.ageAdj(p)>=11&&C.ageAdj(p)<16,
        once: !0,
        w: 3,
        title: "The doorpost",
        text: "Once a year the Sevrin boys are measured against the old doorpost in the palace. The steward cuts a notch for each. The tallest are the house's pride. A short prince, by custom, may be sent to a monastery.",
        choices: [
          {
            t: "Stand as straight as you can",
            fx: p=>shown(p)?ap(p,{happy:4,str:.5,wil:.3},"The steward has to stand on a stool to cut your notch. The uncles clap you on the back. Some of them look worried, too: the tallest Sevrins rarely see forty-five."):ap(p,{happy:-5,wil:1.5},"Your notch is lower than your cousins'. The steward says nothing. The abbot of a hill monastery is invited to supper that week."),
          },
          {
            t: "Ask why the tall ones die young",
            fx: p=>ap(p,{int:.4,wil:.5},'"Because the heart is the same size," says the old steward, "but it has more man to carry." He cuts your notch and moves on.'),
          },
        ],
      },
      {
        id: "bd_bear_heart",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"bear")&&C.age(p)>=30,
        w: 1.3,
        cool: 7,
        title: "A heart too small",
        text: "Halfway up the tower stair your sight goes black for a moment and your heart hammers like a smith. Your joints ache in the cold. Your house is the tallest in the world, and the tallest Sevrins rarely live past forty-five.",
        choices: [
          {
            t: "Give up the stairs, the hunts and the heavy armour",
            r: "You live slower. Men who once feared your size see a big man resting.",
            fx: {health:6,happy:-5,wil:1},
          },
          {
            t: "Keep going as you always have",
            check: {s:"sta",s2:"wil",d:55},
            win: {r:"The blackness passes. You keep going. For now.",fx:{wil:.5}},
            lose: {
              r: "You collapse at the top of the stair and wake in your bed a day later, a physician's ear to your chest.",
              fx: {health:-25,cause:"heart failure",wil:2},
            },
          },
          {
            t: "Ask the monks for foxglove tea",
            check: {s:"medicine",s2:"faith",d:45},
            win: {r:"The old infirmarian knows the dose. Your heart steadies.",fx:{health:8,piety:2}},
            lose: {
              r: "Too strong. Foxglove is a poison in clumsy hands. You vomit for two days.",
              fx: {health:-12,cause:"foxglove poisoning"},
            },
          },
        ],
      },
      {
        id: "bd_listener_plot",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"listener"),
        w: 1.4,
        cool: 8,
        title: "Through the door",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"rival").id,ctx.plot=A.pick(["poison the steward before the harvest accounts","open the postern gate on the Saint's Day","forge your lord's seal on a land grant","sell the garrison count to the enemy","have a rival merchant's warehouse burned"])},
        text: "Three rooms away, behind a shut door, two men are whispering. Anyone else would hear nothing. You hear every word: {them} is planning to {plot}.",
        choices: [
          {
            t: "Take it to those in power",
            check: {s:"intrigue",s2:"int",d:45,bonus:()=>15},
            win: {
              r: "You give the date, the place, the words. Men are waiting when the plotters come. {them} hangs or flees. You are noticed.",
              fx: {favor:10,fame:2,skill:{intrigue:3},them:{type:"enemy",op:-50}},
            },
            lose: {
              r: 'You have only your word, and your word is "I heard it through a wall." Nobody believes you, and now {them} knows you know.',
              fx: {them:{type:"enemy",op:-40},happy:-4},
            },
          },
          {
            t: "Let {them} know that you heard. Quietly",
            check: {s:"intrigue",s2:"wil",d:45},
            win: {
              r: "A few soft words in the corridor. From now on {them} pays you for your silence.",
              fx: {coin:30,honor:-2,them:{type:"enemy",op:-20}},
            },
            lose: {
              r: "{them} smiles and says nothing. A week later, someone tries to push you down a stair.",
              fx: {health:-10,cause:"a fall down a stair",them:{type:"enemy",op:-40},wil:1},
            },
          },
          {
            t: "Forget you heard it",
            r: "You have heard many things through many walls. This one you leave there.",
            fx: {happy:-1},
          },
        ],
      },
      {
        id: "bd_listener_drums",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"listener"),
        w: 1.2,
        cool: 8,
        title: "The drums",
        text: p=>`The ${A.C.soldier(p)?"war-drums of the muster":"drums and horns of the {festival} procession"} begin all at once. To your ears it is like being beaten with planks. The ground tilts. A Dravic cannot lead an army that marches to drums, and the enemy knows it.`,
        choices: [
          {
            t: "Push wax deep into your ears and stay",
            check: {s:"wil",s2:"sta",d:48},
            win: {r:"Muffled and grim, you stand through it. Nobody sees how close you came to falling.",fx:{wil:2}},
            lose: {
              r: "You collapse in the street. When you wake, your ears ring and do not stop for days.",
              fx: {health:-8,cause:"the drums",wound:"ear",happy:-4,wil:1.5},
            },
          },
          {
            t: "Walk away before it gets worse",
            r: "You leave and sit in a quiet chapel until your head stops pounding. People talk.",
            fx: {honor:-1,happy:-2},
          },
          {
            t: "Ask the drummers to play softer near you",
            check: {s:"diplomacy",s2:"int",d:40},
            win: {r:"They grin and play like mice whenever you pass. Small kindness, big relief.",fx:{happy:3}},
            lose: {r:"They play louder. Some people think it is funny.",fx:{happy:-4,wil:1}},
          },
        ],
      },
      {
        id: "bd_ranavir_test",
        cond: (p,C)=>C.child(p)&&kin(p,"unpoisoned")&&C.age(p)>=5,
        cool: 3,
        w: 3,
        title: "The yearly cup",
        text: "Once a year, every child of House Ranavir drinks a cup with a measured grain of arsenic in it. A carrier feels nothing. A child who is not a carrier sickens, and if the court physician misjudges the dose, can die. You stand in line with your cousins.",
        choices: [
          {
            t: "Drink it down",
            fx: p=>shown(p)?ap(p,{wil:.5,happy:1},"A faint metal taste, then nothing. The physician marks your name with a green line, as every year."):ap(p,{health:-15,cause:"the arsenic test",wil:1.5},"Cramps and vomiting all night. You live, but your name gets a red line in the book."),
          },
          {
            t: "Watch the physician measure the dose first",
            fx: p=>shown(p)?ap(p,{int:.5},"You watch his scales closely. He sees you watching and measures twice. You drink and feel nothing."):ap(p,{health:-8,cause:"the arsenic test",int:.5},"Because you watched, he measured carefully. You are sick for a day, not a week."),
          },
        ],
      },
      {
        id: "bd_unpoisoned_cup",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"unpoisoned"),
        w: 1.3,
        once: !0,
        title: "A gripe in the belly",
        text: "After supper you feel a faint cramp and a taste of metal. Nothing more. Two days later a servant who finished your plate dies screaming. Someone has tried to poison you with arsenic, the poisoner's favourite. They did not know what house you were born to.",
        choices: [
          {
            t: "Hunt the poisoner",
            check: {s:"intrigue",s2:"int",d:50},
            win: {
              r: "The cook's boy breaks first. The trail leads to someone you trusted. Justice is done, one way or another.",
              fx: {skill:{intrigue:4},fame:2,wil:1},
            },
            lose: {r:"The trail goes cold. Somewhere, someone is still trying.",fx:{happy:-6,wil:1.5}},
          },
          {
            t: "Pretend to be dying, and see who comes to look",
            check: {s:"intrigue",s2:"wil",d:45},
            win: {
              r: "You groan for three days. On the third, a visitor asks the physician too many questions. Now you know.",
              fx: {skill:{intrigue:3},int:.5,newRel:{type:"enemy",op:-40}},
            },
            lose: {r:"Nobody comes. You lie in bed three days for nothing.",fx:{happy:-3}},
          },
          {
            t: "Pay for the servant's burial and grieve",
            r: "You pay for a good pyre and sit with the family. The poison was for you.",
            fx: {coin:-10,honor:3,wil:1.5,happy:-4},
          },
        ],
      },
      {
        id: "bd_storm_sense",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"storm"),
        w: 1.4,
        cool: 6,
        title: "The pressure in your ears",
        text: "Your ears ache and your sinuses throb like a drum skin. The sky is clear and blue, the sea flat. But a Maruang knows: a cyclone is a day off. In the harbour, the fishing fleet is making ready to sail.",
        choices: [
          {
            t: "Run down to the harbour and stop the boats",
            check: {s:"diplomacy",s2:"command",d:45},
            win: {
              r: "They grumble, but they stay. Next day the storm tears the sea white. Not one boat is lost.",
              fx: {fame:3,honor:3,favor:5},
            },
            lose: {r:"Half the captains laugh at you and sail. Four boats never come back.",fx:{wil:2,happy:-6}},
          },
          {
            t: "Board up your house and ride it out in bed",
            r: "You lie in the dark with a wet cloth on your face while the storm screams. The headaches last a week after.",
            fx: {health:-4,cause:"pressure headaches",happy:-2},
          },
          {
            t: "Buy up rope and timber now, sell it after (20 suns)",
            req: p=>p.coin>=20,
            r: "After the storm, everyone needs rope and timber. You sell at triple. Some call it clever; some call it greedy.",
            fx: {coin:30,honor:-1,skill:{trade:2}},
          },
        ],
      },
      {
        id: "bd_lean_famine",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"lean")&&C.age(p)<45,
        w: 1.4,
        cool: 8,
        title: "The killing frost",
        text: "An ice crust over the snow, and the herds cannot reach the grass. By midwinter the whole camp is on half rations. Others grow thin and slow. You do not. The lean-blood was made for this.",
        choices: [
          {
            t: "Give half your ration to the children",
            r: "You live on a quarter ration for two months and still ride every day. The mothers of the camp will not forget.",
            fx: {honor:4,fame:2,wil:2},
          },
          {
            t: "Ride out to find grass under the snow",
            check: {s:"husbandry",s2:"survival",d:45},
            win: {
              r: "You find a valley where the wind has scoured the crust. The herds live.",
              fx: {skill:{husbandry:3,survival:2},fame:2},
            },
            lose: {
              r: "Days of empty white. You come back with frostbitten fingers.",
              fx: {wound:"frostbite",health:-8,cause:"frostbite",wil:1.5},
            },
          },
          {
            t: "Trade your spare horses for grain at a town",
            check: {s:"trade",s2:"int",d:40},
            win: {r:"A good price. Grain sacks for the camp, and a horse left over.",fx:{coin:10,skill:{trade:2}}},
            lose: {r:"The townsmen smell your hunger and cheat you blind.",fx:{coin:-10,happy:-3}},
          },
        ],
      },
      {
        id: "bd_lean_sugar",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"lean")&&C.age(p)>=42,
        w: 1.3,
        cool: 7,
        title: "The sweet sickness",
        text: "Good years have made you heavy. Now you are thirsty all day, you make water all night, and a sore on your foot will not heal. Few khans of your line have died old and whole. The healer tastes your water and frowns: it is sweet.",
        choices: [
          {
            t: "Eat like a herder in a bad winter",
            check: {s:"wil",s2:"sta",d:50},
            win: {
              r: "Meat, milk, no honey, no bread, long rides. The thirst eases. The sore closes.",
              fx: {health:8,wil:2,happy:-3},
            },
            lose: {
              r: "You last a month, then the feasts call you back.",
              fx: {health:-6,cause:"the sweet sickness",wil:1},
            },
          },
          {
            t: "Ignore it and feast",
            r: "You feast. The sore spreads, and your sight grows cloudy at the edges.",
            fx: {health:-18,cause:"the sweet sickness",happy:3},
          },
          {
            t: "Let the healer cut away the rotting flesh",
            r: "He cuts and burns. You will walk with a limp, but you will walk.",
            fx: {health:-8,cause:"the sweet sickness",wound:"limp",wil:1.5},
          },
        ],
      },
      {
        id: "bd_saltskin_fast",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"saltskin"),
        w: 1.4,
        cool: 7,
        title: "Heat that fells others",
        text: "High summer and the date harvest. Men drop in the groves from the heat, but you sweat freely and stay cool. Then the fast comes. A Sabrani loses salt and water faster than anyone, and two children of your house died in a Dry Month before 1035.",
        choices: [
          {
            t: "Work the harvest and keep the fast",
            check: {s:"wil",s2:"sta",d:55},
            win: {
              r: "You carry the fallen into the shade and keep working until sunset. Then salt, water and dates. You make it.",
              fx: {wil:2.5,piety:3,honor:2,sta:.5},
            },
            lose: {
              r: "Cramps fold you double in the grove. You wake with someone forcing salt water past your lips.",
              fx: {health:-20,cause:"heat and the fast",wil:2},
            },
          },
          {
            t: "Keep the fast in the shade, and do no work",
            r: "You pray, rest and wait for sunset each day. Not glorious. Alive.",
            fx: {piety:3,happy:-1},
          },
          {
            t: "Take salt water by day, as the house physicians advise",
            r: "Since Emir Nasir died after the fast of 1086, the physicians have pressed this. Some imams frown. You live.",
            fx: {piety:-2,health:2},
          },
        ],
      },
      {
        id: "bd_seasteady_storm",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"seasteady"),
        w: 1.4,
        cool: 7,
        title: "Steady on a pitching deck",
        text: p=>`${age(p)>=40?"Ashore you fall on stairs now, and the ground sways for weeks after every voyage. But at sea you are still a Brine.":"Ashore the ground sways for days after a voyage. At sea you are as steady as a mast."} A squall hits at night. The helmsman is on his knees, sick. The deck stands on end.`,
        choices: [
          {
            t: "Take the helm",
            check: {s:"sea",s2:"wil",d:45,bonus:()=>15},
            win: {
              r: "You hold her into the wind all night. At dawn the crew looks at you the way crews have always looked at Brines.",
              fx: {fame:3,skill:{sea:4},honor:2},
            },
            lose: {
              r: "You hold, but you take the risk no one else would, and a wave smashes you into the rail.",
              fx: {health:-14,cause:"a wave",wound:"broken_ribs",wil:1.5},
            },
          },
          {
            t: "Go up and cut the torn sail free",
            check: {s:"spd",s2:"sea",d:45,bonus:()=>15},
            win: {
              r: "Up the mast in the howling dark, steady as on a floor. The sail goes over the side and the ship rights.",
              fx: {fame:2,spd:.5,skill:{sea:3}},
            },
            lose: {
              r: "The mast whips you off. You land in the scuppers, alive.",
              fx: {health:-18,cause:"a fall from a mast",wil:1.5},
            },
          },
          {
            t: "Stay below; let the captain earn his share",
            r: "The ship survives. In the share-book that night, someone writes a small, unkind note beside your name.",
            fx: {honor:-2},
          },
        ],
      },
      {
        id: "bd_fury_friend",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"fury"),
        w: 1.4,
        cool: 7,
        title: "The red comes",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"friend").id},
        text: "A wrestling bout at the clan fire turns rough. Someone shoves {them} into you, and you feel it rising: the heat, the roar in your ears, the world going red at the edges. The fury of Gorath. Once it starts, it does not stop, and it does not know friends.",
        choices: [
          {
            t: "Let it come",
            check: {s:"str",s2:"unarmed",d:40,bonus:()=>15},
            win: {
              r: "Three men are down before it lets go. Then your lips go grey and you faint. When you wake, {them} has a broken arm and will not look at you.",
              fx: {fame:2,str:.5,them:{op:-25},health:-6,cause:"the fury's fainting"},
            },
            lose: {
              r: "You strike {them} hard enough to split a lip and loosen teeth, then collapse grey-faced in the dirt.",
              fx: {them:{op:-35},health:-10,cause:"the fury's fainting",honor:-2},
            },
          },
          {
            t: "Bite down on it. Hard",
            check: {s:"wil",s2:"ins",d:55},
            win: {
              r: "You walk to the edge of the firelight, shaking, and hold the red back until it drains away. The Grey Mothers saw. They nod.",
              fx: {wil:3,honor:2,them:{op:10}},
            },
            lose: {
              r: "You hold it back for three heartbeats. Then it comes anyway, and it is worse for waiting.",
              fx: {them:{op:-30},health:-10,cause:"the fury's fainting",wil:1.5},
            },
          },
          {
            t: "Leave the fire before it rises",
            r: "You stride off into the dark. Some call it fear. The ones who know your blood call it wisdom.",
            fx: {wil:1,them:{op:5}},
          },
        ],
      },
      {
        id: "bd_hide_gathering",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"hide"),
        w: 1.4,
        cool: 7,
        title: "Hide and heat",
        text: "The summer gathering. A drunk from another clan pulls a knife on you over a horse race and slashes across your ribs. The cut barely breaks your hide. But the sun is high, the air is thick, and an Ironhide sweats poorly. Two clan-mothers of your line died of heat at gatherings like this one.",
        choices: [
          {
            t: "Laugh at the scratch and knock him down",
            check: {s:"unarmed",s2:"str",d:40},
            win: {
              r: "One blow. The crowd roars. You walk into the shade before the heat can take you.",
              fx: {fame:2,skill:{unarmed:2}},
            },
            lose: {
              r: "You win, but the fight goes long in the heat. You fall over afterwards and lie twitching in the grass.",
              fx: {health:-16,cause:"heat sickness",wil:1.5},
            },
          },
          {
            t: "Laugh at the scratch and walk to the river",
            r: "You sit up to your neck in cold water while the drunk's clan apologises. A good day after all.",
            fx: {honor:2,happy:3},
          },
          {
            t: "Fight him properly, to settle it",
            fx: {
              duel: {
                tier: 2,
                title: "a drunk clan rider",
                opts: {kind:"brawl",place:"the gathering ground",lethal:!1,toYield:!0,title:"A brawl at the gathering"},
              },
            },
          },
        ],
      },
      {
        id: "bd_greymother_years",
        cond: (p,C)=>C.female(p)&&C.blood(p,"greymother")&&C.age(p)>=45,
        w: 1.5,
        cool: 8,
        title: "The grey braid",
        text: p=>`You have outlived ${A.pick(["your sisters","your first husband","most of the warriors you grew up with","a son"])}, and you will likely outlive more. Your grey braid gives you a seat on the Grey Council. Young chiefs fear your memory. Some hate you for it. Today a war-chief half your age wants the council to bless his raid.`,
        choices: [
          {
            t: "Remind him, word for word, what happened the last time",
            check: {s:"int",s2:"diplomacy",d:45},
            win: {
              r: "You name the dead of the last raid, one by one. The council overrules him. He leaves white with rage.",
              fx: {fame:2,honor:3,wil:1.5,newRel:{type:"enemy",op:-30}},
            },
            lose: {r:"He shouts you down. The young ones cheer him. You will remember this, too.",fx:{wil:2,happy:-4}},
          },
          {
            t: "Bless it. Let the young learn their own lessons",
            r: "He goes. Some come back. You add the names of the rest to what you carry.",
            fx: {wil:1,happy:-3},
          },
          {
            t: "Teach a braid-girl the law instead",
            r: "You sit with a bright girl of another kin and teach her the old judgments. She will never wear the grey braid, but she will know the law.",
            fx: {happy:4,int:.3,newRel:{type:"friend",op:35}},
          },
        ],
      },
      {
        id: "bd_longwind_run",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"longwind")&&!C.old(p),
        w: 1.4,
        cool: 7,
        title: "Half-human",
        text: "In the charge you hit about as hard as a strong human, and the young bloods call you half-human for it, as they have called the Longwind line for 140 years. But when the charge is over and the others lie gasping, you are still running.",
        choices: [
          {
            t: "Volunteer to carry word behind enemy lines",
            check: {s:"sta",s2:"stealth",d:45,bonus:()=>15},
            win: {
              r: `Three days and nights alone, running. You come back with the enemy's count and nobody says "half-human" to your face again.`,
              fx: {fame:3,sta:.6,skill:{stealth:3},merit:3,honor:2},
            },
            lose: {
              r: "You are spotted on the second night and hunted like a hare. You make it back with an arrow in your shoulder.",
              fx: {health:-18,cause:"an arrow wound",wound:"arrow_wound",wil:2},
            },
          },
          {
            t: "Challenge the loudest mocker to a run",
            check: {s:"sta",s2:"wil",d:35,bonus:()=>15},
            win: {r:"He bursts in the first hour. You trot back to camp and fetch him water.",fx:{fame:1,happy:5}},
            lose: {r:"You pull a muscle and lose. The mockery doubles.",fx:{happy:-5,wil:1.5}},
          },
          {t:"Ignore them",r:"You have heard it all your life. You will hear it again.",fx:{wil:1}},
        ],
      },
      {
        id: "bd_longwind_camp",
        cond: (p,C)=>kin(p,"longwind")&&C.age(p)>=10&&C.age(p)<=13,
        once: !0,
        w: 3,
        title: "The forty-kilometer run",
        text: "You are twelve. The Runners' Camp takes only children of the Longwind line who can run forty kilometers in a day. The course is marked with cairns across the grass. The other children in the Horde are watching.",
        choices: [
          {
            t: "Run steady from dawn",
            check: {s:"sta",s2:"wil",d:25,bonus:p=>shown(p)?25:0},
            win: {
              r: "You reach the last cairn before sunset, still running. The Runners paint the mark of Orrak on your arm.",
              fx: {sta:.8,wil:1,fame:1,flag:"bd_runners_camp"},
            },
            lose: {
              r: "You burn out at thirty kilometers, like any orc. You are of the line, but not of the wind.",
              fx: {wil:1.5,happy:-5},
            },
          },
          {
            t: "Sprint the first part to show them",
            check: {s:"sta",s2:"spd",d:32,bonus:p=>shown(p)?20:0},
            win: {
              r: "You sprint, and somehow you never stop. The camp takes you.",
              fx: {sta:.6,spd:.5,flag:"bd_runners_camp"},
            },
            lose: {r:"You are on your knees in the grass by noon.",fx:{wil:1.5,happy:-4}},
          },
        ],
      },
      {
        id: "bd_oakborn_years",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"oakborn"),
        w: 1.4,
        cool: 10,
        title: "Deep years",
        text: "A friend you grew up with has grey in her hair. You do not. You age two-thirds as fast as other elves, and they already outlive every human kingdom. The Oakborn have shrunk from seventeen carriers to two, because children come once in two hundred years, if at all.",
        choices: [
          {
            t: "Spend this year with your friend, every day of it",
            r: "You walk the Evenwood together through a whole turn of seasons. You will remember it for five hundred years.",
            fx: {happy:6,wil:1},
          },
          {
            t: "Plant an oak for her, as the old ones do",
            r: "You plant an acorn in the glade. It will be a great tree when you are still young.",
            fx: {piety:3,wil:1.5,happy:2},
          },
          {
            t: "Turn to long work: a history no one else will finish",
            check: {s:"learning",s2:"wil",d:40},
            win: {
              r: "You begin a chronicle that will take three centuries. The Keepers are delighted.",
              fx: {skill:{learning:4},int:.6,fame:1},
            },
            lose: {r:"The work is too large even for you. You set it aside for a century.",fx:{wil:1}},
          },
        ],
      },
      {
        id: "bd_mistwalker_noon",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"mistwalker"),
        w: 1.4,
        cool: 7,
        title: "Eyes that shine",
        text: "Your eyes shine in lamplight and see in near-total dark. In the night ranges you are a ghost. But today raiders come at noon across open ground, the sun full in your face, just as they did in the raid of 611. You are half-blind behind your veil.",
        choices: [
          {
            t: "Fight anyway, by sound and shadow",
            check: {s:"ins",s2:"bow",d:55},
            win: {r:"You fight blind and well. The raiders break.",fx:{fame:3,ins:.6,wil:2}},
            lose: {
              r: "A blade you never saw opens your arm.",
              fx: {health:-18,cause:"a raider's blade",wound:"deep_cut",wil:2},
            },
          },
          {
            t: "Fall back to the trees and wait for dusk",
            check: {s:"tactics",s2:"stealth",d:42},
            win: {
              r: "At dusk you hunt them through the woods. Not one reaches the river.",
              fx: {fame:2,skill:{tactics:3,stealth:2}},
            },
            lose: {r:"They are gone before the light fails, with what they came for.",fx:{happy:-4,wil:1}},
          },
          {
            t: "Guide the others and let them do the shooting",
            r: "You call out where to aim by sound. A captain's work, not a hero's.",
            fx: {skill:{command:3}},
          },
        ],
      },
      {
        id: "bd_quickened_torches",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"quickened"),
        w: 1.4,
        cool: 7,
        title: "Flickering light",
        text: p=>`${A.pick(["A torchlit feast in the great hall","A barn fire, flames leaping through the slats","Lightning flashing through the leaves on a night march"])}. The light flickers, and you feel the familiar wrongness behind your eyes. The Quickened see a blade before it moves, and fall in fits when the light dances. Sethril died of one. Serin was killed during one in 1079.`,
        choices: [
          {
            t: "Close your eyes and turn away at once",
            check: {s:"wil",s2:"ins",d:40,bonus:()=>10},
            win: {r:"Eyes shut, breathing slow, you wait. The wrongness passes.",fx:{wil:1.5}},
            lose: {
              r: "Too late. You wake on the floor with a bitten tongue and frightened faces above you.",
              fx: {health:-12,cause:"a fit",wound:"concussion",wil:1.5,happy:-4},
            },
          },
          {
            t: "Push through. People need you",
            check: {s:"wil",s2:"sta",d:58},
            win: {
              r: "You do what must be done and get out before it takes you. Your hands shake for an hour.",
              fx: {wil:2.5,honor:2,fame:1},
            },
            lose: {
              r: "The fit takes you in the middle of it. Others have to drag you clear.",
              fx: {health:-20,cause:"a fit",wound:"burn",wil:2},
            },
          },
          {
            t: "Leave. Always leave",
            r: "You walk out into the dark without explaining. Your kin understand. Others do not.",
            fx: {honor:-1},
          },
        ],
      },
      {
        id: "bd_quickened_rod",
        cond: (p,C)=>C.child(p)&&kin(p,"quickened")&&C.age(p)>=25,
        once: !0,
        w: 3,
        title: "The dropped rod",
        text: "You are thirty, which for an elf is still a child. The master of the School of the Quickened holds a wooden rod above your open hand and lets it fall without warning. Every child of Sethril's line is tested this way.",
        choices: [
          {
            t: "Watch his fingers",
            fx: p=>shown(p)?ap(p,{spd:.6,ins:.6,flag:"bd_quickened_school"},'You catch it before it has fallen the width of a finger. The master nods. "The deeper drills, then." He does not smile.'):ap(p,{wil:.8},"The rod slaps your palm before your hand closes. You will train with the ordinary blades."),
          },
          {
            t: "Watch the rod",
            fx: p=>shown(p)?ap(p,{spd:.5,ins:.5,flag:"bd_quickened_school"},"It barely moves before your fist is round it. The master writes your name."):ap(p,{wil:.8,happy:-2},"It drops through your fingers. You try again. And again. The master gently stops you."),
          },
        ],
      },
      {
        id: "bd_lightfoot_pole",
        cond: (p,C)=>C.child(p)&&kin(p,"lightfoot")&&C.age(p)>=9,
        once: !0,
        w: 3,
        title: "The birch pole",
        text: "You are ten. Every child of Faelas Leafstep's line walks a peeled birch pole across the stream, wet and springing. Carriers join the scout families of Rinael and Elwen. The others keep the name and choose another trade.",
        choices: [
          {
            t: "Walk it slowly",
            check: {s:"spd",s2:"wil",d:20,bonus:p=>shown(p)?25:0},
            win: {
              r: "You cross without a wobble, then turn and walk back for fun. The scouts laugh and claim you.",
              fx: {spd:.6,happy:4,flag:"bd_lightfoot_scout"},
            },
            lose: {
              r: "Splash. The stream is cold and the scouts are kind. You will be something else.",
              fx: {wil:1,happy:-3},
            },
          },
          {
            t: "Run it",
            check: {s:"spd",s2:"ins",d:26,bonus:p=>shown(p)?25:0},
            win: {
              r: "You run it like a branch path in the canopy. A scout whistles.",
              fx: {spd:.8,flag:"bd_lightfoot_scout"},
            },
            lose: {
              r: "You slip and land badly on the rocks. Your wrist cracks like a twig.",
              fx: p=>ap(p,{health:-10,cause:"a broken wrist",wil:1},shown(p)?"A Lightfoot's bones break easily. They let you try again in spring, and you pass.":"You heal, and choose another path."),
            },
          },
        ],
      },
      {
        id: "bd_lightfoot_press",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"lightfoot"),
        w: 1.4,
        cool: 7,
        title: "Light bones",
        text: "A brawl breaks out in a crowded square, and the press of bodies closes around you. A shove, a falling cart, a club: any of it would bruise a human. It could cripple a Lightfoot. Above you, a balcony rail.",
        choices: [
          {
            t: "Leap for the balcony and run the rooftops",
            check: {s:"spd",s2:"ins",d:40,bonus:()=>15},
            win: {r:"You go up like a cat and away across the tiles, landing soft as a leaf.",fx:{spd:.5,happy:3}},
            lose: {
              r: "You make the rail, but a roof tile slides. You land on the cobbles and hear your shin snap.",
              fx: {health:-20,cause:"broken bones",wound:"limp",wil:2},
            },
          },
          {
            t: "Shield a child and push through",
            check: {s:"ins",s2:"wil",d:50},
            win: {r:"You get the child out with only a bruise. Lucky.",fx:{honor:3,fame:1}},
            lose: {
              r: "A club catches your forearm. It breaks like dry kindling.",
              fx: {health:-15,cause:"broken bones",wound:"scar_arm",honor:2,wil:1.5},
            },
          },
          {
            t: "Flatten against a doorway and wait",
            r: "You wait it out in a doorway, small and still. Scouts do not fight in a press.",
            fx: {},
          },
        ],
      },
      {
        id: "bd_deepbreath_summons",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"deepbreath"),
        w: 1.4,
        cool: 8,
        title: "The thin air and the thick",
        text: p=>A.chance(.5)?"A rope team is trapped on the Crown Shelf, high above where even dwarves gasp and stumble. You can work there as if it were a forge floor. Bardun blood.":"A summons: you are wanted at a lowland court, below a thousand meters. Carriers of your blood sicken in thick air within weeks, and in old age the heart strains.",
        choices: [
          {
            t: "Climb. Whatever is asked, go high",
            check: {s:"sta",s2:"survival",d:42,bonus:()=>15},
            win: {
              r: "You climb where others cannot and bring three dwarves down alive. Mount Bardun remembers its children.",
              fx: {fame:3,honor:3,sta:.6,skill:{survival:3}},
            },
            lose: {
              r: "An ice-fall catches you on the shelf. You come down with frostbitten toes.",
              fx: {health:-14,cause:"the high ice",wound:"frostbite",wil:2},
            },
          },
          {
            t: "Go down to the lowlands and endure it",
            check: {s:"wil",s2:"sta",d:50},
            win: {
              r: "You do your business, short of breath and short of temper, and get back up to the clean air.",
              fx: {wil:2,favor:4},
            },
            lose: {
              r: "Three weeks below and you are grey, swollen and coughing. They carry you home on a litter.",
              fx: {health:-18,cause:"lowland sickness",wil:1.5},
            },
          },
          {
            t: "Send someone else",
            r: "Someone else goes. Some call it wisdom. Some call it the blood making excuses.",
            fx: {honor:-1},
          },
        ],
      },
      {
        id: "bd_hammer_anvil",
        cond: (p,C)=>C.adult(p)&&kin(p,"hammer"),
        w: 1.4,
        cool: 8,
        title: "The Anvil of Dagna",
        text: p=>shown(p)?"Your arms are the full Hammerhand gift: you can draw iron that would take two other smiths. You also eat five thousand calories a day, your shoulders are stiff as old leather, and twenty-two of your line have died of the heart before 190. A great commission has come to the forge.":"You carry the Hammerhand blood single, not full: stronger than most dwarves, but no giant at the anvil. The royal clan marries carrier cousins to breed full Hammers. Today there is a great commission at the forge, and you are not chosen to lead it.",
        choices: [
          {
            t: "Take the great hammer yourself",
            check: {s:"craft",s2:"str",d:50},
            win: {
              r: "A week of blows no one else could strike. The piece sings when it is struck. Your name goes into the forge book.",
              fx: {skill:{craft:5},fame:3,str:.5},
            },
            lose: {
              r: "Your shoulder locks halfway through and the metal cools wrong. The piece cracks in the quench.",
              fx: {skill:{craft:2},happy:-5,wil:1.5,health:-6,cause:"a strained heart"},
            },
          },
          {
            t: "Work as striker for another and learn",
            r: "You swing for a master and watch his hands. You learn more than you expected.",
            fx: {skill:{craft:3},int:.3},
          },
          {
            t: "Feed the appetite first: a great meal (6 suns)",
            req: p=>p.coin>=6,
            r: "You eat for three, then work like three. The cook despairs.",
            fx: {coin:-6,str:.4,happy:3},
          },
        ],
      },
      {
        id: "bd_deepeye_dark",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"deepeye"),
        w: 1.4,
        cool: 8,
        title: "By the light of one coal",
        text: "A roof-fall in the lower drift. Lamps go out. Darkness, total and full of dust, and men crying out. You blow on a single coal from a smashed brazier, and by its glow you can see the whole gallery: the dead end, the cracked prop, and the way out.",
        choices: [
          {
            t: "Lead them out one by one, hand to hand",
            check: {s:"ins",s2:"wil",d:40,bonus:()=>15},
            win: {
              r: "Eleven miners come up into the night air behind you. Clan Deepeye's old saying is true: one coal, one Deepeye, enough.",
              fx: {fame:4,honor:3,wil:1.5,deed:"Led eleven miners out of a collapsed drift by the light of one coal"},
            },
            lose: {
              r: "A second fall cuts the line. You get six out. You go back for the rest, but there is no way through.",
              fx: {wil:3,happy:-8,health:-10,cause:"a roof-fall"},
            },
          },
          {
            t: "Shore up the cracked prop first",
            check: {s:"craft",s2:"str",d:45},
            win: {r:"The prop holds. Everyone walks out together.",fx:{skill:{craft:3},fame:2}},
            lose: {
              r: "The prop shifts and a stone catches your shoulder.",
              fx: {health:-15,cause:"a roof-fall",wound:"broken_ribs",wil:1},
            },
          },
          {
            t: "Get yourself out and send help",
            r: "You find the way and bring a rescue party. Most are saved. A Deepeye could have done more.",
            fx: {honor:-2,wil:.5},
          },
        ],
      },
      {
        id: "bd_stonelung_gas",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"stonelung"),
        w: 1.4,
        cool: 8,
        title: "Air you cannot smell",
        text: "Your crew is cutting a new gallery. Dust that would choke other miners does nothing to your lungs. But you have almost no sense of smell, and the lamp on the wall has begun to burn low and blue. Thirty-one Stonelungs have died in gas pockets since 812.",
        choices: [
          {
            t: "Trust the lamp, not your nose. Out, now",
            r: "You grab the lamp and drive the crew out. Behind you, the gallery fills with bad air. Nobody dies today.",
            fx: {honor:2,wil:1,skill:{survival:2}},
          },
          {
            t: "Finish the cut. It is only a draught",
            check: {s:"sta",s2:"ins",d:60},
            win: {r:"The flame steadies again. It was only a draught. This time.",fx:{coin:8,skill:{craft:2}}},
            lose: {
              r: "You wake on the surface with the crew slapping your face. Two minutes more and you would not have woken.",
              fx: {health:-25,cause:"bad air",wound:"lungs",wil:2},
            },
          },
          {
            t: "Send the youngest, who can smell, to check",
            r: "He sniffs, goes pale and runs. You follow. Stonelungs have always needed others' noses.",
            fx: {wil:.5},
          },
        ],
      },
      {
        id: "bd_skarfell_door",
        cond: (p,C)=>C.adult(p)&&C.blood(p,"skarfell"),
        w: 1.4,
        cool: 7,
        title: "Through a human door",
        text: "Only three meters tall, you can duck through a human doorway, which no other giant can. Human tin traders want to deal with you and no one else. But at the Thing the big halls call your line runts, and you feel the cold more than they do.",
        choices: [
          {
            t: "Go into the human trading hall and bargain",
            check: {s:"trade",s2:"diplomacy",d:42},
            win: {
              r: "You sit at a human table on a bench of three chairs and drive a fine bargain for the hall.",
              fx: {coin:40,skill:{trade:3},fame:1},
            },
            lose: {
              r: "The traders are slipperier than you thought. The hall grumbles at the price.",
              fx: {coin:5,happy:-3},
            },
          },
          {
            t: "Answer the runts mockery at the Thing",
            check: {s:"spd",s2:"unarmed",d:45,bonus:()=>10},
            win: {
              r: "You wrestle a Jotunhall giant twice your weight, turn him faster than he can follow, and put him on his back.",
              fx: {fame:3,spd:.5,honor:2},
            },
            lose: {
              r: "He is simply too heavy. You lie in the snow while the big halls laugh.",
              fx: {health:-10,cause:"a giant's throw",wil:2,happy:-4},
            },
          },
          {
            t: "Buy heavier furs for the winter (15 suns)",
            req: p=>p.coin>=15,
            r: "You buy bear furs from the traders. Warm at last.",
            fx: {coin:-15,health:4,happy:3},
          },
        ],
      },
      {
        id: "bd_jotun_knees",
        cond: (p,C)=>C.adult(p)&&C.male(p)&&C.blood(p,"jotun"),
        w: 1.4,
        cool: 7,
        title: "The weight of a king",
        text: p=>`${age(p)>=38?"Your knees grind like millstones now, and your hips ache on the hall steps. ":""}A roof-beam in the great hall cracks in a storm and comes down on a family of herders. No one else in Hrimfell could lift it. You can. You also eat more each day than a household of five, and a fall from your own height can kill. It killed Hrolf in 1049.`,
        choices: [
          {
            t: "Lift the beam",
            check: {s:"str",s2:"wil",d:45,bonus:()=>15},
            win: {
              r: "You lift it onto your shoulder and hold it while they crawl out. The hall sings of it for a winter.",
              fx: {fame:4,honor:3,str:.6,deed:"Lifted a fallen roof-beam off a herding family"},
            },
            lose: {
              r: "They get out, but something in your knee tears as you lower it. You will walk with a stick.",
              fx: {fame:3,honor:3,health:-15,cause:"ruined knees",wound:"bad_knee",wil:2},
            },
          },
          {
            t: "Order others to lever it with poles",
            check: {s:"command",s2:"int",d:40},
            win: {r:"Twelve men and four poles. Slower, but nobody is hurt.",fx:{skill:{command:3}}},
            lose: {
              r: "The poles slip. In the end you lift it anyway, badly.",
              fx: {health:-12,cause:"ruined knees",wound:"back"},
            },
          },
        ],
      },
      {
        id: "bd_fever_badair",
        cond: (p,C)=>C.ageAdj(p)>=12,
        w: 1.1,
        cool: 5,
        title: "The fever",
        text: p=>`A fever comes on you in the ${A.pick(["heat of summer","wet of autumn","thaw"])}: shaking, sweats, a head like a split log. ${A.pick(["The priest says bad air rising from the low ground.","Your neighbour swears someone has put the evil eye on you.","Your aunt says the gods are angry with this house.","The midwife says it is the season; half the street has it."])} Everyone has a cure.`,
        choices: [
          {
            t: "Prayers, holy water and a candle to {god}",
            check: {s:"sta",s2:"faith",d:38},
            win: {
              r: "On the fourth night the fever breaks. The priest takes the credit. Maybe he is right.",
              fx: {piety:3,health:-5,cause:"a fever"},
            },
            lose: {
              r: "The prayers do not touch it. You burn for two weeks.",
              fx: {health:-18,cause:"a fever",wil:1.5,piety:1},
            },
          },
          {
            t: "The herb-wife: willow bark, broth and rest (2 suns)",
            check: {s:"sta",d:30},
            win: {
              r: "Bitter bark tea brings the heat down. Broth and sleep do the rest.",
              fx: {coin:-2,health:-4,cause:"a fever"},
            },
            lose: {
              r: "Even the herb-wife cannot hurry it. But you live.",
              fx: {coin:-2,health:-12,cause:"a fever",wil:1},
            },
          },
          {
            t: "Let the barber bleed the bad humour out",
            check: {s:"sta",d:48},
            win: {
              r: "You feel faint and pale, and then, slowly, better. Despite the bleeding, not because of it.",
              fx: {coin:-1,health:-10,cause:"a fever and a bleeding"},
            },
            lose: {
              r: "Weak from fever and weaker from the lancet, you lie near death for days.",
              fx: {coin:-1,health:-26,cause:"a fever and a bleeding",wil:2},
            },
          },
          {
            t: "Sweat it out under every blanket in the house",
            check: {s:"sta",s2:"wil",d:40},
            win: {
              r: "Three days soaked in sweat, then it lifts. You feel tougher for it.",
              fx: {health:-6,cause:"a fever",wil:1,sta:.3},
            },
            lose: {r:"It drags on for a month and leaves you thin.",fx:{health:-16,cause:"a fever",wil:1.5}},
          },
        ],
      },
      {
        id: "bd_child_fever",
        cond: (p,C)=>C.child(p)&&C.ageAdj(p)>=3&&C.parentsAlive(p),
        w: 1,
        cool: 5,
        title: "Burning up",
        text: "You are hot and cold at once, and the ceiling beams swim. Your mother sits by the bed all night with a wet cloth. Somebody has hung a sprig of rowan over the door to keep the sickness out.",
        choices: [
          {
            t: "Drink the horrible bitter tea",
            check: {s:"sta",s2:"wil",d:20},
            win: {
              r: "It tastes like tree bark, because it is. By morning you can sit up.",
              fx: {health:-4,cause:"a childhood fever",wil:.5},
            },
            lose: {
              r: "You throw it up. The fever lasts a week, and the house goes quiet with fear.",
              fx: {health:-14,cause:"a childhood fever",wil:1},
            },
          },
          {
            t: "Ask for a story",
            r: "Your mother tells the old tale of the fox and the frozen river, twice. You fall asleep before the end and wake cooler.",
            fx: {health:-6,cause:"a childhood fever",happy:3,rel:{who:"mother",op:8}},
          },
        ],
      },
      {
        id: "bd_work_injury",
        cond: (p,C)=>C.adult(p)&&!!p.job&&["farm","labor","smith","mason","carpenter","miner","fish","herd","sailor","hunter","brewer"].includes(p.job.c),
        w: 1.1,
        cool: 6,
        title: "Hurt at work",
        text: p=>{const j=p.job.c;return({farm:"The plough-ox steps on your foot and leans.",labor:"A loaded hod slips off the scaffold and onto your shoulder.",smith:"A scale of white-hot iron flies off the anvil into your forearm.",mason:"A block swings on the crane rope and pins your hand to the wall.",carpenter:"The adze glances off a knot and bites into your shin.",miner:"A chunk of the roof drops and catches your back.",fish:"A hook on the long-line goes through your palm as the line runs out.",herd:"A ram you are shearing kicks your knee sideways.",sailor:"A loose block swings across the deck and hits your ribs.",hunter:"You fall down a bank chasing a wounded deer.",brewer:"A full barrel rolls off the cart onto your foot."}[j]||"You hurt yourself at work.")+" Work does not stop for pain, and nobody pays a man who cannot work."},
        choices: [
          {
            t: "Bind it and keep working",
            check: {s:"wil",s2:"sta",d:45},
            win: {
              r: "You work through it, white-lipped. It heals crooked, but it heals.",
              fx: {wil:2,perf:4,health:-6,cause:"a work injury"},
            },
            lose: {
              r: "It gets worse with every day of work. In the end you are laid up for a month anyway.",
              fx: {wil:1.5,health:-18,cause:"a work injury",perf:-6,coin:-6},
            },
          },
          {
            t: "Rest until it heals (lose a month's wages)",
            r: "A month of sitting. Your purse shrinks, but you heal straight.",
            fx: {coin:-8,health:3,perf:-2},
          },
          {
            t: "See the bonesetter (3 suns)",
            req: p=>p.coin>=3,
            check: {s:"sta",d:35},
            win: {
              r: "She feels the bones, pulls once, and binds it in splints and egg-white. Good as new by the season's end.",
              fx: {coin:-3,health:-2},
            },
            lose: {
              r: "She sets it as well as anyone could. It still aches in the rain, and always will.",
              fx: {coin:-3,health:-8,cause:"a work injury",wound:"back"},
            },
          },
        ],
      },
      {
        id: "bd_bad_tooth",
        cond: (p,C)=>C.ageAdj(p)>=14,
        w: 1,
        cool: 7,
        title: "The rotten tooth",
        text: "A back tooth has gone black, and your jaw swells until one eye half-closes. You cannot chew. The old women say a worm is eating it from the inside.",
        choices: [
          {
            t: "The tooth-puller at the fair (1 sun)",
            check: {s:"wil",s2:"sta",d:35},
            win: {
              r: "A big man with pliers, a drummer to cover the screams, and it is out. The relief is like a sunrise.",
              fx: {coin:-1,health:3,wil:1},
            },
            lose: {
              r: "He breaks it and has to dig for the roots. You bleed for a day and burn with fever for three.",
              fx: {coin:-1,health:-12,cause:"a botched tooth-pulling",wil:1.5},
            },
          },
          {
            t: "Oil of cloves from the apothecary (3 suns)",
            req: p=>p.coin>=3,
            r: "Cloves numb it. The tooth stays, rotting quietly, until it falls out on its own a year later.",
            fx: {coin:-3,happy:2},
          },
          {
            t: "Tie a string to the door and slam it",
            check: {s:"wil",d:40},
            win: {
              r: "Bang. The tooth flies across the room. You sit on the floor laughing and crying.",
              fx: {wil:1.5,happy:2},
            },
            lose: {
              r: "The string slips. You do it four times before it works.",
              fx: {wil:2,health:-4,cause:"a rotten tooth"},
            },
          },
        ],
      },
      {
        id: "bd_failing_eyes",
        cond: (p,C)=>C.adult(p)&&(C.old(p)||C.ageAdj(p)>=42),
        w: 1,
        once: !0,
        title: "The letters swim",
        text: p=>`${p.literate?"Letters swim on the page now":"You cannot thread a needle any more"}, and faces across the room blur. Your eyes are getting old before the rest of you.`,
        choices: [
          {
            t: "Buy a reading stone of polished beryl in {capital} (20 suns)",
            req: p=>p.coin>=20,
            r: "The glazier sets a clear stone over the page and the letters jump up large and sharp. A small miracle for twenty suns.",
            fx: {coin:-20,happy:5,int:.3},
          },
          {
            t: "Have a child read and thread for you",
            r: "A grandchild or a neighbour's boy becomes your eyes, and learns a great deal from what you have them read.",
            fx: {happy:2,wil:.5},
          },
          {
            t: "Squint and refuse to admit it",
            r: "You squint, guess and make mistakes. Pride is expensive.",
            fx: {happy:-3,wil:1},
          },
        ],
      },
      {
        id: "bd_quack",
        cond: (p,C)=>C.adult(p),
        w: .9,
        cool: 8,
        title: "The doctor in the velvet coat",
        text: p=>`A travelling doctor sets up in {home} with a velvet coat, a monkey and a table of wonders: ${A.pick(["powdered unicorn horn that detects poison","theriac of sixty-four ingredients",`a "dragon's tooth" to hang over a sickbed`,"mummy dust from the tombs of Tamar"])}. A crowd gathers. Across the square, the old herb-wife sells nettle and yarrow and is ignored.`,
        choices: [
          {
            t: "Buy the wonder (10 suns)",
            req: p=>p.coin>=10,
            r: 'You feel better for a week, mostly because you paid so much. The "unicorn horn" is a sliver of northern whale tusk.',
            fx: {coin:-10,happy:3},
          },
          {
            t: "Ask him awkward questions in front of the crowd",
            check: {s:"int",s2:"medicine",d:42},
            win: {
              r: "You ask where unicorns live. He names three different places. The crowd starts laughing, and he packs up by noon.",
              fx: {fame:2,int:.4,happy:3},
            },
            lose: {r:"He is a smooth talker. Somehow you end up the fool, and he sells twice as much.",fx:{happy:-3}},
          },
          {
            t: "Go and learn from the herb-wife instead",
            r: "She shows you yarrow for wounds, willow for fever and which mushroom kills. Better than any monkey.",
            fx: {skill:{medicine:3},coin:-1},
          },
        ],
      },
      {
        id: "bd_dog_bite",
        cond: (p,C)=>C.ageAdj(p)>=12,
        w: .9,
        cool: 8,
        title: "The dog that did not run",
        text: "A farm dog on the lane comes at you without a sound and sinks its teeth into your leg before you can kick it off. Was there foam at its lips? You are not sure. Everyone knows what a mad dog's bite means.",
        choices: [
          {
            t: "Burn the bite out with a hot iron",
            check: {s:"wil",d:40},
            win: {
              r: "You hold still while the smith does it. The smell is the worst part. It heals clean.",
              fx: {wil:2,health:-6,cause:"a dog bite",wound:"burn"},
            },
            lose: {
              r: "You flinch, he slips, and the burn is worse than the bite. But it heals.",
              fx: {wil:1.5,health:-10,cause:"a dog bite",wound:"burn"},
            },
          },
          {
            t: "Find the dog and watch it for ten days",
            check: {s:"int",s2:"husbandry",d:35},
            win: {
              r: "The dog is alive and grumpy ten days later. Not mad, just mean. You sleep again.",
              fx: {int:.4,health:-3,cause:"a dog bite",happy:3},
            },
            lose: {
              r: "The farmer has already killed and buried it. You spend a month waiting for madness that never comes.",
              fx: {wil:2,happy:-6,health:-3,cause:"a dog bite"},
            },
          },
          {
            t: "Wash it with wine and pray",
            r: "You wash, you pray, and you wait. It was not a mad dog. You will never know how lucky that was.",
            fx: {piety:2,health:-5,cause:"a dog bite",wound:"bite"},
          },
        ],
      },
      {
        id: "bd_lucky_escape",
        cond: (p,C)=>C.ageAdj(p)>=12,
        w: .9,
        cool: 10,
        title: "A hair's breadth",
        text: p=>A.pick(["A roof tile slides off in the wind and shatters exactly where you were standing one step ago.","A runaway cart thunders down the lane. You jump into a doorway, and it misses you by a hand.","Lightning splits the oak you were sheltering under, a heartbeat after you left it to fetch your hat.","The well rope snaps just as you lean over to haul the bucket. You catch the stone rim with one hand."]),
        choices: [
          {
            t: "Thank {god} on your knees, right there",
            r: "You promise the god a candle and you keep the promise.",
            fx: {piety:4,coin:-1},
          },
          {
            t: "Take it as a sign to change your life",
            r: "You stand a long time, shaking. Then you go home and do the thing you have been putting off for years.",
            fx: {wil:2,happy:2},
          },
          {
            // [X1 baked patch events/99999-v2-content V2C-TAVERN-ROUND-ADULT] bd_lucky_escape offered "Laugh, and buy the
            // whole tavern a drink (5 suns)" from 12, so a penniless 14-year-old saw it on the card as an option out of reach.
            // Standing a round is a grown man's choice: it needs 16 years as well as the coin. (9998-choice-stakes shows a
            // locked row only for a requirement it can read, so a child no longer sees it.)
            t: "Laugh, and buy the whole tavern a drink (5 suns)",
            req: p=>p.coin>=5&&A.age(p)>=16,
            r: "Death missed. The beer did not. Half the town drinks to your luck.",
            fx: {coin:-5,happy:6,newRel:{type:"friend",op:20}},
          },
        ],
      },
      {
        id: "bd_convalescence",
        cond: (p,C)=>C.ageAdj(p)>=12&&p.health<60,
        w: 1.3,
        cool: 6,
        title: "The long mending",
        text: "Weeks in bed. You watch the light move across the wall, day after day. Your body is mending slowly. Your mind has nothing to do but think.",
        choices: [
          {
            t: "Ask the priest to teach you your letters",
            req: p=>!p.literate,
            check: {s:"int",s2:"wil",d:38},
            win: {
              r: "By the time you can walk, you can read. The world has more in it than it did.",
              fx: {literate:!0,skill:{learning:4},int:.6},
            },
            lose: {r:"You learn the shapes of a few letters, and your own name.",fx:{skill:{learning:2}}},
          },
          {
            t: "Think hard about the life you are living",
            r: "You make plans, and some promises to yourself. You get up a slightly different person.",
            fx: {wil:2.5,int:.3},
          },
          {
            t: "Get up too early and go back to work",
            check: {s:"sta",s2:"wil",d:52},
            win: {
              r: "Grim and wobbly, you are back at it. Your body forgives you this time.",
              fx: {coin:6,wil:1,sta:.3},
            },
            lose: {
              r: "You collapse the second day and are carried back to bed for twice as long.",
              fx: {health:-10,cause:"a relapse",wil:1},
            },
          },
          {
            t: "Rest properly and eat well (6 suns)",
            req: p=>p.coin>=6,
            r: "Meat broth, eggs, sleep. You come out of it stronger than you went in.",
            fx: {coin:-6,health:12},
          },
        ],
      },
      {
        id: "bd_old_joints",
        cond: (p,C)=>C.old(p),
        w: 1.2,
        cool: 5,
        title: "Old bones",
        text: p=>`Mornings are the worst. ${A.pick(["Your knees crack like kindling on the stairs.","Your fingers are swollen and will not close on a spoon.","Your back has bent and will not straighten.","Cold gets into your hips and stays all winter."])} The young move past you as if you were furniture.`,
        choices: [
          {
            t: "Willow bark, hot stones and a soak at the bath-house (3 suns)",
            req: p=>p.coin>=3,
            r: "Hot water and bitter tea. For a week you move like a younger self.",
            fx: {coin:-3,health:4,happy:3},
          },
          {
            t: "Keep working as you always have",
            check: {s:"wil",s2:"sta",d:45},
            win: {r:"You do it slower, but you do it. People notice, and respect it.",fx:{wil:1.5,honor:2}},
            lose: {r:"You overdo it and spend a week flat on your back.",fx:{health:-10,cause:"old age",wil:1}},
          },
          {
            t: "Hand the heavy work to the young and teach them instead",
            r: "You sit and watch, and correct. They grumble, and learn. You find you like it.",
            fx: {happy:4,int:.3,newRel:{type:"friend",op:25}},
          },
        ],
      },
      {
        id: "bd_old_dignity",
        cond: (p,C)=>C.old(p),
        w: 1,
        cool: 6,
        title: "The old one",
        text: p=>`${A.pick(["A young clerk talks to you slowly and loudly, as if you were a child.","Your hands shake as you pour, and someone takes the jug from you without asking.","At the feast you are seated by the door, far from where you used to sit.","Children follow you down the lane, copying your walk."])} Age takes your strength first, then your place.`,
        choices: [
          {
            t: "Answer with quiet dignity",
            r: "You thank them, sit straight and say nothing more. By the end of the evening people are quieter around you.",
            fx: {wil:1.5,honor:2},
          },
          {
            t: "Tell them what you did at their age",
            check: {s:"diplomacy",s2:"int",d:38},
            win: {
              r: "The table goes quiet as you tell it. Someone refills your cup himself, and asks for another story.",
              fx: {fame:1,happy:5},
            },
            lose: {r:"They nod politely and talk over you again.",fx:{happy:-3,wil:1}},
          },
          {
            t: "Lose your temper",
            r: "You bang the table and shout. They will remember you are still alive, at least.",
            fx: {happy:-1,honor:-1},
          },
        ],
      },
      {
        id: "bd_train_body",
        cond: (p,C)=>C.adult(p)&&!C.old(p)&&C.ageAdj(p)<36,
        w: 1,
        cool: 4,
        title: "Hard work, hard body",
        text: p=>A.pick(["The miller pays a penny for every sack carried up his stair. ","An old soldier in {home} runs the hills each dawn and says you could come along. ","A wrestling master holds a ring behind the tannery every rest-day. "])+"It would mean a season of aching muscles and early mornings.",
        choices: [
          {
            t: "Carry sacks until your back screams",
            check: {s:"str",s2:"wil",d:40},
            win: {
              r: "A season of sacks. Your shoulders broaden and your grip could crack walnuts.",
              fx: {str:1.2,coin:4,wil:.5},
            },
            lose: {r:"You strain your back in the first month.",fx:{str:.4,health:-6,cause:"a strained back",wil:.8}},
          },
          {
            t: "Run the hills at dawn",
            check: {s:"sta",s2:"wil",d:40},
            win: {r:"By midsummer you can run to {town} and back without stopping.",fx:{sta:1.2,spd:.4}},
            lose: {r:"Blisters, cramps and a twisted ankle. Some gain, much pain.",fx:{sta:.4,wil:.8}},
          },
          {
            t: "Wrestle in the ring",
            check: {s:"unarmed",s2:"str",d:38},
            win: {
              r: "You learn to fall, to throw and to read a man's weight. You win the last bout of the season.",
              fx: {skill:{unarmed:4},ins:.6,str:.4},
            },
            lose: {r:"You are thrown, again and again. You learn from that too.",fx:{skill:{unarmed:2},wil:1}},
          },
          {t:"You have no time for this",r:"Life is busy. Your body stays as it is.",fx:{}},
        ],
      },
      {
        id: "bd_child_river",
        cond: (p,C)=>C.child(p)&&C.ageAdj(p)>=7,
        w: 1.1,
        cool: 3,
        title: "Summer days",
        text: p=>`A long hot day and nothing to do. The other children are ${A.pick(["daring each other to swim across the river","racing to the old stone cross and back","climbing the tallest tree on the common"])}.`,
        choices: [
          {
            t: "Swim across",
            check: {s:"sta",s2:"wil",d:22},
            win: {r:"You touch the far bank first. You feel like a fish.",fx:{sta:.6,happy:4}},
            lose: {
              r: "You swallow half the river and an older boy hauls you out by your hair.",
              fx: {wil:.8,health:-4,cause:"near-drowning",happy:-2},
            },
          },
          {
            t: "Race them all",
            check: {s:"spd",s2:"sta",d:22},
            win: {r:"You win by three lengths and nobody can stop talking about it.",fx:{spd:.6,happy:4}},
            lose: {r:"You come last, red-faced. Next summer.",fx:{spd:.3,wil:.5}},
          },
          {
            t: "Climb to the very top",
            check: {s:"str",s2:"wil",d:24},
            win: {r:"From the top you can see the whole valley, all the way to {town}.",fx:{str:.5,wil:.5,happy:4}},
            lose: {
              r: "A branch cracks. You fall into the bushes and break nothing, by luck.",
              fx: {health:-6,cause:"a fall from a tree",wil:.6},
            },
          },
        ],
      },
      {
        id: "bd_flux_camp",
        cond: (p,C)=>C.adult(p)&&C.soldier(p),
        w: 1.1,
        cool: 5,
        title: "The bloody flux",
        text: "The camp has stood in one place too long. The latrines are too near the water, and the bloody flux is going through the tents. More men die of it in a summer than in a battle. The surgeon blames bad air from the ditches.",
        choices: [
          {
            t: "Drink only ale and boiled broth, never the stream",
            check: {s:"int",s2:"sta",d:35},
            win: {
              r: "An old sergeant's trick. Nobody knows why it works, but you stay well while the tent next to you empties.",
              fx: {int:.3,health:-2,cause:"the flux"},
            },
            lose: {r:"It gets you anyway. Two weeks of misery.",fx:{health:-18,cause:"the bloody flux",wil:1.5}},
          },
          {
            t: "Organise new latrines downstream",
            check: {s:"command",s2:"int",d:42},
            win: {
              r: "You make the men dig. They curse you, and then fewer of them die.",
              fx: {skill:{command:3},merit:2,honor:2},
            },
            lose: {r:"Nobody digs for a common soldier. The flux spreads.",fx:{happy:-3}},
          },
          {
            t: "Nurse your sick comrades",
            check: {s:"sta",s2:"medicine",d:45},
            win: {
              r: "Water, clean straw, and a hand to hold. Most of your tent lives. They will not forget.",
              fx: {skill:{medicine:3},honor:3,wil:1},
            },
            lose: {r:"You nurse them and catch it yourself.",fx:{health:-20,cause:"the bloody flux",honor:2,wil:2}},
          },
        ],
      },
      {
        id: "bd_will_humiliation",
        cond: (p,C)=>C.adult(p)&&!C.noble(p)&&!C.ruler(p),
        w: 1,
        cool: 8,
        title: "Struck in the market",
        text: p=>`${A.pick(["The reeve","A knight's squire","The lord's steward","A tax-farmer's bully"])} strikes you across the face in the market at {home} for not stepping aside fast enough. Everyone sees. Everyone waits to see what you will do.`,
        choices: [
          {
            t: "Lower your eyes and take it",
            r: "Your face burns for a week, inside and out. But you do not forget, and something in you sets like iron.",
            fx: {wil:3,happy:-6,honor:-1},
          },
          {
            t: "Hit him back",
            check: {s:"unarmed",s2:"str",d:42},
            win: {
              r: "He goes down in the fish-guts. The market cheers. Then the guards come, and you run.",
              fx: {fame:2,happy:4,honor:2,favor:-6},
            },
            lose: {
              r: "His friends beat you in the gutter. A night in the stocks follows.",
              fx: {health:-15,cause:"a beating",wil:2,honor:-1},
            },
          },
          {
            t: "Answer with a line the whole market will repeat",
            check: {s:"diplomacy",s2:"int",d:45},
            win: {
              r: "Your words are sharper than his hand. The laughter follows him down the street for a year.",
              fx: {fame:2,wil:1,happy:3},
            },
            lose: {r:"He strikes you again for your tongue.",fx:{health:-5,cause:"a beating",wil:2,happy:-4}},
          },
        ],
      },
      {
        id: "bd_will_grief",
        cond: (p,C)=>C.adult(p)&&p.parents.length>0&&!C.parentsAlive(p),
        w: 1,
        cool: 10,
        title: "The day of the burying",
        text: p=>{const d=p.parents.map(x=>A.P(x)).find(x=>x&&!x.alive);return`It is the day of the year you buried your ${d?`${d.sex==="F"?"mother":"father"}, ${d.given}`:"parents"}. You thought it would be easier by now. Then something small, a smell of woodsmoke, a song through a window, and it is like the first morning all over again.`},
        choices: [
          {
            t: "Go to the grave and talk, out loud",
            r: "You talk for an hour: what you have done, what you have failed at. The wind does not answer. You feel lighter walking home.",
            fx: {wil:2,happy:3,piety:1},
          },
          {
            t: "Work twice as hard, so there is no time to think",
            r: "You work until dark and sleep without dreams. The grief waits patiently.",
            fx: {wil:1.5,perf:4,happy:-2},
          },
          {
            t: "Do something they would have been proud of",
            check: {s:"wil",s2:"int",d:38},
            win: {
              r: "You do the thing you promised them. It feels like a hand on your shoulder.",
              fx: {wil:2.5,honor:3,happy:4},
            },
            lose: {r:"You try and fall short. You sit down in the road and cry, and then get up.",fx:{wil:2,happy:-3}},
          },
        ],
      },
      {
        id: "bd_will_coldnight",
        cond: (p,C)=>C.ageAdj(p)>=13,
        w: 1,
        cool: 8,
        title: "The long cold night",
        text: p=>`${A.pick(["The town gate shuts in your face at sunset","Your horse goes lame on an empty moor","The ferry has left and the ferryman has gone home","You lose the path in the hills as night falls"])}. No fire, no roof, a thin cloak. The cold comes down like a lid. It is a long way to dawn.`,
        choices: [
          {
            t: "Keep walking all night to stay warm",
            check: {s:"sta",s2:"wil",d:42},
            win: {
              r: "You walk circles till the sky greys. You have never been so glad to see the sun.",
              fx: {wil:2.5,sta:.6},
            },
            lose: {
              r: "By dawn your toes are white and dead-feeling. Some feeling comes back. Not all.",
              fx: {wil:2.5,health:-12,cause:"cold",wound:"frostbite"},
            },
          },
          {
            t: "Burrow into a haystack or leaf-pile and wait",
            check: {s:"survival",s2:"wil",d:35},
            win: {r:"Itchy, damp, alive. An old trick that works.",fx:{wil:1.5,skill:{survival:2}}},
            lose: {
              r: "The cold finds its way in. You shiver till dawn and cough for weeks.",
              fx: {health:-10,cause:"a chill on the lungs",wil:2},
            },
          },
          {
            t: "Sneak into a barn",
            check: {s:"stealth",s2:"ins",d:40},
            win: {
              r: "You sleep warm among the cows and leave before the farmer wakes.",
              fx: {happy:2,skill:{stealth:2}},
            },
            lose: {
              r: "The farmer's dogs. You run off into the dark with a torn coat and a bitten ankle.",
              fx: {health:-8,cause:"a dog bite",wil:2},
            },
          },
        ],
      },
      {
        id: "bd_will_failure",
        cond: (p,C)=>C.adult(p)&&!C.old(p)&&(!!p.job||!!p.mil||!!p.school),
        w: 1,
        cool: 7,
        title: "Not good enough",
        text: p=>`${p.mil?"You were sure the promotion was yours. It went to a man with a cousin on the council.":p.school?'Your master watches your trial and says one word: "Again." In front of everyone.':"The guild masters look at your best work, the thing you spent a whole season on, and shake their heads."} You go home with nothing but the bitterness.`,
        choices: [
          {
            t: "Start again tomorrow, at dawn, harder than before",
            check: {s:"wil",d:40},
            win: {r:"A year of grinding work. Next time, nobody can deny you.",fx:{wil:3,perf:8,int:.3,happy:2}},
            lose: {
              r: "You push yourself to the edge and make yourself ill. But the stubbornness stays.",
              fx: {wil:2.5,health:-6,cause:"overwork"},
            },
          },
          {
            t: "Ask the masters exactly what was wrong",
            check: {s:"diplomacy",s2:"int",d:40},
            win: {
              r: "One of them, surprised, tells you honestly. It stings. It is also the most useful thing anyone has ever told you.",
              fx: {int:.8,wil:1.5,perf:4},
            },
            lose: {r:"They take your question for a complaint.",fx:{perf:-3,wil:1}},
          },
          {
            t: "Drown it in drink for a week",
            r: "A week of ale and self-pity. You wake up poorer and no wiser.",
            fx: {coin:-6,happy:-2,health:-3,cause:"drink"},
          },
        ],
      },
      {
        id: "bd_will_fear",
        cond: (p,C)=>C.ageAdj(p)>=11&&C.ageAdj(p)<30,
        w: 1,
        once: !0,
        title: "The thing you fear",
        setup: (p,ctx)=>{const f=A.pick([["heights","climb the bell tower to free the jammed rope"],["deep water","swim out to the boat that has slipped its mooring"],["the dark","go down into the old cellar to fetch the lamp oil"],["fire","carry the burning pan out of the kitchen"]]);ctx.fear=f[0],ctx.task=f[1]},
        text: "You have always been afraid of {fear}. Not a little afraid: sick, shaking afraid. Today there is no one else, and someone has to {task}.",
        choices: [
          {
            t: "Do it, shaking",
            check: {s:"wil",d:35},
            win: {
              r: "Every step is a fight. You do it. Afterwards you sit down and laugh until you cry. The fear is smaller now, forever.",
              fx: {wil:3,trait:"brave",happy:4},
            },
            lose: {
              r: "You freeze halfway and someone has to come for you. But you went further than ever before.",
              fx: {wil:2,happy:-4},
            },
          },
          {
            t: "Find someone else to do it",
            r: "Someone else does it. They look at you a little differently afterwards.",
            fx: {happy:-3,honor:-1},
          },
        ],
      },
      {
        id: "bd_will_hunger",
        cond: (p,C)=>C.ageAdj(p)>=12&&C.poor(p),
        w: 1.2,
        cool: 5,
        title: "The hungry gap",
        text: "Last year's grain is gone and this year's is still green in the field. Nettle soup, bark-flour bread, a turnip shared four ways. The children cry at night. Up at the manor, the lord's barn is full.",
        choices: [
          {
            t: "Endure it, and give your share to the youngest",
            r: "You go to bed hungry for six weeks. When the harvest comes in you are thin as a rake, and harder inside than you have ever been.",
            fx: {wil:3,health:-8,cause:"hunger",honor:2},
          },
          {
            t: "Steal a sack from the lord's barn at night",
            check: {s:"stealth",s2:"spd",d:45},
            win: {
              r: "One sack, out over the wall in the dark. The family eats for a month.",
              fx: {skill:{stealth:3},happy:4},
            },
            lose: {r:"The bailiff's men catch you with the sack.",fx:{punish:"theft"}},
          },
          {
            t: "Gather in the woods: mushrooms, roots, snares",
            check: {s:"survival",s2:"int",d:38},
            win: {
              r: "You know the woods. Rabbit and chanterelle stew is a feast in the hungry gap.",
              fx: {skill:{survival:3},happy:2},
            },
            lose: {
              r: "You find little, and one bad mushroom gives you a night of cramps.",
              fx: {health:-8,cause:"a bad mushroom",wil:1},
            },
          },
        ],
      },
      {
        id: "bd_will_break_body",
        cond: (p,C)=>C.adult(p)&&!C.old(p)&&(C.stat(p,"str")>=35||C.stat(p,"sta")>=35||C.soldier(p)),
        w: .8,
        cool: 8,
        title: "Past the wall",
        text: "For months you have trained and got no better. Same weight, same distance, same aching end. Today, at the moment you would always stop, something in you says: not yet.",
        choices: [
          {
            t: "Run until you drop, and then run more",
            check: {s:"wil",s2:"sta",d:55},
            win: {
              r: "You go through the wall into something calm and endless. When you finally stop, you are not the same.",
              fx: {sta:2,wil:2.5},
            },
            lose: {
              r: "You go too far, and your body goes on strike. A week in bed.",
              fx: {health:-12,cause:"exhaustion",wil:1.5,sta:.5},
            },
          },
          {
            t: "Lift the stone nobody in {home} can lift",
            check: {s:"str",s2:"wil",d:58},
            win: {
              r: "It comes up off the ground, to your knees, to your chest. The onlookers go silent. You have never been this strong.",
              fx: {str:2,wil:2,fame:2},
            },
            lose: {
              r: "Something in your back goes with a twang.",
              fx: {health:-12,cause:"a torn back",wound:"back",wil:1.5},
            },
          },
          {
            t: "Spar against the best fighter you know until dark",
            check: {s:"ins",s2:"wil",d:55},
            win: {
              r: "Somewhere in the fiftieth bout you start to see his moves before he makes them.",
              fx: {ins:2,skill:{sword:3,unarmed:2},wil:1.5},
            },
            lose: {
              r: "He takes you apart all day. You go home bloodied and thinking.",
              fx: {health:-8,cause:"a hard sparring bout",ins:.6,wil:1.5},
            },
          },
          {t:"Stop. Not today",r:"You stop where you always stop. Tomorrow, maybe.",fx:{}},
        ],
      },
      {
        id: "bd_will_break_mind",
        cond: (p,C)=>C.adult(p)&&(C.literate(p)||C.stat(p,"int")>=40),
        w: .8,
        cool: 8,
        title: "The knot",
        text: p=>`For a whole season you have chewed on ${A.pick(["a ledger that will not balance by eleven suns","a tactic that would have won the last battle, if only it worked","a verse that will not come right","how to bring water to the high field without a pump","a passage of scripture that seems to say two things"])}. Tonight, by a dying candle, you feel it begin to loosen.`,
        choices: [
          {
            t: "Stay up all night and break it open",
            check: {s:"int",s2:"wil",d:52},
            win: {
              r: "By dawn you have it. It is simple, once seen. You feel the world shift a little in your head.",
              fx: {int:2,wil:1.5,skill:{learning:3},happy:5},
            },
            lose: {r:"It slips away again at the last moment. You sleep till noon, furious.",fx:{int:.5,wil:1.5}},
          },
          {t:"Sleep on it",r:"You wake with half the answer in your head. Half is something.",fx:{int:.8}},
          {
            t: "Talk it through with someone who disagrees",
            check: {s:"diplomacy",s2:"int",d:40},
            win: {
              r: "The argument goes on for hours. Out of it, between you, comes the answer.",
              fx: {int:1.2,newRel:{type:"friend",op:25}},
            },
            lose: {r:"The argument just goes on.",fx:{int:.3,happy:-2}},
          },
        ],
      },
      {
        id: "bd_will_bullied",
        cond: (p,C)=>C.child(p)&&C.ageAdj(p)>=6,
        w: 1,
        cool: 4,
        title: "Bigger children",
        text: p=>`Three bigger children have decided you are the one to torment this year. They ${A.pick(["take your bread","push you in the ditch on the way home","call you a name that sticks","throw your shoes in the millpond"])}, every day.`,
        choices: [
          {
            t: "Fight the biggest one",
            check: {s:"str",s2:"wil",d:22},
            win: {r:"You bloody his nose. They leave you alone after that.",fx:{str:.4,wil:1,happy:3,trait:"brave"}},
            lose: {
              r: "You lose, badly. But you fought, and next time they think twice.",
              fx: {health:-5,cause:"a schoolyard beating",wil:2},
            },
          },
          {
            t: "Tell a grown-up",
            r: "A grown-up has a word. It stops for a while. They call you a tattler.",
            fx: {happy:-1,wil:.5},
          },
          {
            t: "Make them laugh instead",
            check: {s:"int",s2:"diplomacy",d:20},
            win: {
              r: "Your joke about the priest's donkey turns them. By midsummer you run with them.",
              fx: {int:.3,newRel:{type:"friend",op:20}},
            },
            lose: {r:"They laugh at you, not with you.",fx:{happy:-3,wil:1}},
          },
          {
            t: "Bear it in silence",
            r: "You say nothing and give them nothing. It is a long year. You come out of it older than your age.",
            fx: {wil:2.5,happy:-4},
          },
        ],
      },
      {
        id: "bd_will_march",
        cond: (p,C)=>C.adult(p)&&C.soldier(p),
        w: 1,
        cool: 5,
        title: "The march in the rain",
        text: "Six days of forced march in cold rain. Your feet are raw meat in your boots, your pack straps have rubbed your shoulders bloody, and the sergeant says another twenty kilometers before dark.",
        choices: [
          {
            t: "Keep pace, and say nothing",
            check: {s:"wil",s2:"sta",d:45},
            win: {
              r: "Step after step after step. When the column halts you are still in your place.",
              fx: {wil:2.5,sta:.6,merit:2},
            },
            lose: {
              r: "You fall out at the last hill and come in an hour late, limping.",
              fx: {wil:1.5,health:-6,cause:"the march",merit:-1},
            },
          },
          {
            t: "Carry a struggling comrade's pack too",
            check: {s:"str",s2:"wil",d:50},
            win: {
              r: "Double weight, the whole last stretch. The company sees.",
              fx: {wil:2.5,str:.6,honor:3,merit:3,newRel:{type:"friend",op:35}},
            },
            lose: {r:"You both fall behind. But you came in together.",fx:{wil:2,honor:2,health:-6,cause:"the march"}},
          },
          {
            t: "Bind your feet with rags and grease at the halt",
            check: {s:"survival",s2:"int",d:35},
            win: {
              r: "A trick from an old campaigner. The next day you walk easier than anyone.",
              fx: {skill:{survival:2},wil:1},
            },
            lose: {r:"The rags slip. Your feet are worse than ever.",fx:{health:-5,cause:"the march",wil:1.5}},
          },
        ],
      },
      {
        id: "bd_will_vigil",
        cond: (p,C)=>C.ageAdj(p)>=14,
        w: .9,
        cool: 8,
        title: "The vigil",
        text: p=>`The priests of {faith} keep a night vigil before ${A.pick(["the great feast","a holy day","the blessing of the fields","the day of the dead"])}: no food since noon, no sleep, kneeling on stone until dawn. You have said you will keep it this year.`,
        choices: [
          {
            t: "Keep it to the end",
            check: {s:"wil",s2:"faith",d:42},
            win: {
              r: "Somewhere after midnight the pain in your knees goes far away, and the candle flames seem to breathe. Hunger and tiredness, the priest says later. Or the god.",
              fx: {wil:2.5,piety:5,skill:{faith:2}},
            },
            lose: {
              r: "You nod off against a pillar before the third bell. Nobody says anything. You know.",
              fx: {wil:1,piety:1,happy:-3},
            },
          },
          {
            t: "Kneel half the night, then slip out",
            r: "You keep half of it. Half a vigil is better than none, you tell yourself.",
            fx: {piety:1,wil:.5},
          },
        ],
      },
      {
        id: "bd_wild_wolfmen",
        cond: (p,C)=>C.ageAdj(p)>=14&&C.terr(p,"forest","hills")&&(bio(p,"Temperate forest")||bio(p,"Taiga")),
        w: 1,
        cool: 8,
        title: "Wolf-men",
        text: "The trappers at the inn say the road through the pines is haunted by wolf-men: men who ate wolf meat in a hard winter and turned. Two carters went missing last month. You have business on the far side.",
        choices: [
          {
            t: "Travel with the carters' convoy and pay what they pay",
            r: "Halfway through, men in wolf pelts step out of the trees. Not monsters: outlaws, with spears and empty bellies. The carters pay the toll, two suns a head, and the wolf-men wave you through.",
            fx: {coin:-2,int:.3},
          },
          {
            t: "Go alone, by night, quietly",
            check: {s:"stealth",s2:"survival",d:45},
            win: {
              r: "You slip past a fire where men in wolfskins snore. Wolf-men. Hah.",
              fx: {skill:{stealth:3},happy:2},
            },
            lose: {
              r: "They hear you. Pelts, cudgels, and no mercy. They take everything and leave you bleeding by the road.",
              fx: {coin:-12,health:-14,cause:"outlaws",wil:2},
            },
          },
          {
            t: 'Hunt the "wolf-man" yourself',
            fx: {
              duel: {
                tier: 2,
                title: "an outlaw in a wolf pelt",
                troop: "SP",
                opts: {kind:"brawl",place:"the pine road",lethal:!0,toYield:!0,title:"The wolf-man of the pines"},
              },
            },
          },
          {t:"Wait for a better season",r:"You wait. The business can wait too.",fx:{happy:-1}},
        ],
      },
      {
        id: "bd_wild_winterwolves",
        cond: (p,C)=>C.ageAdj(p)>=14&&C.terr(p,"forest","tundra","hills")&&!C.town(p),
        w: 1,
        cool: 7,
        title: "Wolves at the byre",
        text: "A hard winter. The wolves have come down from the deep woods: big grey brutes, not the pony-sized monsters of the Northfolk tales, but big enough. Last night they killed a calf two farms over. Tonight you hear them circling your byre.",
        choices: [
          {
            t: "Pen the beasts tight and keep fires burning till dawn",
            check: {s:"husbandry",s2:"wil",d:38},
            win: {
              r: "A long, cold night of feeding fires. In the morning, tracks all round and every beast alive.",
              fx: {wil:1.5,skill:{husbandry:2}},
            },
            lose: {r:"You doze off near dawn. They take a ewe.",fx:{coin:-6,wil:1,happy:-3}},
          },
          {
            t: "Take a spear out into the dark",
            fx: {beast:{id:"CRE-21",place:"the byre in the snow",light:"night",title:"Wolves in the snow"}},
          },
          {
            t: "Lay poisoned bait in the woods (2 suns)",
            check: {s:"survival",s2:"int",d:40},
            win: {
              r: "Two dead wolves by the stream and the rest move on. The pelts sell for three suns each.",
              fx: {coin:4,skill:{survival:2}},
            },
            lose: {
              r: "A neighbour's dog eats the bait. He will not forgive you soon.",
              fx: {coin:-2,newRel:{type:"rival",op:-20}},
            },
          },
        ],
      },
      {
        id: "bd_wild_boar",
        cond: (p,C)=>C.ageAdj(p)>=14&&C.terr(p,"forest","hills"),
        w: 1,
        cool: 7,
        title: "The boar",
        text: p=>`${p.realm==="POL-15"?"Morhaven farmers call it the Devourer's pig: ":""}a boar the height of a man's chest at the shoulder bursts out of the thicket, tusks yellow, little eyes red. It has been ripping up the fields for a month. Now it has turned on you.`,
        choices: [
          {
            t: "Climb the nearest tree and wait it out",
            check: {s:"spd",s2:"str",d:35},
            win: {
              r: "You are up the oak before it reaches you. It grunts and roots below for an hour, then wanders off.",
              fx: {happy:1,spd:.3},
            },
            lose: {
              r: "A tusk catches your calf as you scramble up.",
              fx: {health:-15,cause:"a boar's tusk",wound:"deep_cut",wil:1},
            },
          },
          {t:"Stand with the boar spear",fx:{beast:{id:"CRE-23",place:"a holm-oak thicket",title:"The boar"}}},
          {
            t: "Run",
            check: {s:"spd",d:45},
            win: {r:"You run like never before. It loses interest at the stream.",fx:{spd:.4}},
            lose: {
              r: "It is faster than it looks. It knocks you flat and tramples you before it goes.",
              fx: {health:-20,cause:"a boar",wound:"broken_ribs",wil:1.5},
            },
          },
        ],
      },
      {
        id: "bd_wild_cavebear",
        cond: (p,C)=>C.ageAdj(p)>=14&&C.terr(p,"mountains","hills"),
        w: .9,
        cool: 9,
        title: "The cave in winter",
        text: p=>`Sleet drives you into a cave on the mountainside. Deeper in, you smell it: musk, old bones, and breath. A cave bear, ${p.race==="dwarf"?"the beast your elders say guards the ancestors' vaults":"a beast humans say died out long ago. The dwarves know better"}. Something huge stirs in the dark.`,
        choices: [
          {
            t: "Back out the way you came, slow and silent",
            check: {s:"stealth",s2:"ins",d:40},
            win: {
              r: "One step, one breath. You are back in the sleet, shaking, but alive.",
              fx: {wil:1.5,skill:{stealth:2}},
            },
            lose: {
              r: "A stone rolls under your boot. A roar fills the cave and a paw catches your back as you flee.",
              fx: {health:-22,cause:"a cave bear",wound:"scar_chest",wil:2},
            },
          },
          {t:"Fight it in its own cave",fx:{beast:{id:"CRE-25",place:"a cave mouth",title:"The cave bear"}}},
          {
            t: "Leave meat at the mouth as an offering and go",
            r: "You leave your dried meat on a flat stone and back away. Whether it was the offering or luck, nothing follows you.",
            fx: {piety:3,wil:1},
          },
        ],
      },
      {
        id: "bd_wild_silara",
        cond: (p,C)=>C.ageAdj(p)>=12&&C.race(p,"elf","halfelf")&&C.terr(p,"forest"),
        w: 1,
        cool: 10,
        title: "The serpent of Lake Silara",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"friend").id},
        text: 'A human merchant, {them}, comes back from Lake Silara pale as milk. "A serpent," {theyHe} says. "Four meters long, in the water at dusk." Every elf in earshot is trying very hard not to laugh.',
        choices: [
          {
            t: "Take {themHim} back at dusk to see it properly",
            check: {s:"survival",s2:"diplomacy",d:35},
            win: {
              r: "You show {themHim} the giant eels, eighty years old and long as a boat, and the lines of otters that look like humps. {them} laughs until {theyHe} cries. A friend for life.",
              fx: {them:{type:"friend",op:30},int:.3,happy:3},
            },
            lose: {r:"The eels do not show. {them} leaves more certain than ever.",fx:{happy:1}},
          },
          {
            t: "Agree solemnly that it is a terrible serpent",
            r: "{them} tells it in every human town from here to the sea. The elves of the lake drink to you all winter.",
            fx: {happy:4,honor:-1},
          },
          {
            t: 'Go and catch one of the "serpents" for supper',
            check: {s:"survival",s2:"str",d:45},
            win: {r:"A three-meter eel on the bank, and a feast for the whole glade.",fx:{skill:{survival:3},fame:1}},
            lose: {r:"The eel pulls you into the lake. The otters seem amused.",fx:{happy:-2,wil:.5}},
          },
        ],
      },
      {
        id: "bd_wild_hyenas",
        cond: (p,C)=>C.ageAdj(p)>=14&&C.terr(p,"steppe","plains"),
        w: 1,
        cool: 7,
        title: "Laughter in the dark",
        text: p=>`Cave hyenas have been following the herd for three nights, giggling in the dark beyond the firelight. ${["orc","halforc"].includes(p.race)?"Your people say hyenas carry the souls of the unburied.":"The orc herders say hyenas carry the souls of the unburied."} Yesterday you passed a dead traveller in the grass and did not stop.`,
        choices: [
          {
            t: "Picket the horses and keep fires all night",
            check: {s:"husbandry",s2:"wil",d:38},
            win: {
              r: "Fires, dogs and no sleep. The hyenas move on to an easier herd.",
              fx: {wil:1.5,skill:{husbandry:2}},
            },
            lose: {r:"They come in at the darkest hour and take a foal.",fx:{coin:-10,happy:-3,wil:1}},
          },
          {
            t: "Ride out with a torch and a spear",
            fx: {beast:{id:"CRE-35",place:"the long grass",light:"night",title:"Hyenas in the dark"}},
          },
          {
            t: "Go back and bury the dead traveller",
            r: "You ride back and pile stones over the body. That night the hyenas are gone. The smell of death was what drew them, the herders say. Or the soul is at rest.",
            fx: {piety:4,wil:1,int:.3},
          },
        ],
      },
      {
        id: "bd_wild_thunderhorse",
        cond: (p,C)=>C.ageAdj(p)>=14&&(C.terr(p,"steppe")||bio(p,"Steppe")),
        w: 1,
        cool: 8,
        title: "The Thunder Horse",
        text: "A summer storm rolls over the grass, and under the thunder there is another sound: a drumming that shakes the earth. The drummers cry that the Storm-Father is riding his horse the size of a hill across the sky. It is coming straight at the camp.",
        choices: [
          {
            t: "Get off the line, now",
            check: {s:"riding",s2:"ins",d:40},
            win: {
              r: "You swing up and gallop sideways. A thousand wild horses thunder past where your tent stood. The Thunder Horse is a herd.",
              fx: {skill:{riding:3},int:.3},
            },
            lose: {
              r: "The edge of the herd catches you. You are knocked flat and trampled.",
              fx: {health:-22,cause:"a stampede",wound:"broken_ribs",wil:2},
            },
          },
          {
            t: "Kneel and pray to the Storm-Father",
            check: {s:"faith",s2:"wil",d:50},
            win: {
              r: "The herd splits around your camp like water round a rock. The drummers will tell this for years.",
              fx: {piety:5,fame:2},
            },
            lose: {
              r: "The herd does not care about prayers. You are lucky to crawl away with a broken arm.",
              fx: {health:-20,cause:"a stampede",wound:"scar_arm",piety:2,wil:2},
            },
          },
          {
            t: "Ride into the herd and try to rope a stallion",
            check: {s:"riding",s2:"str",d:58},
            win: {
              r: "Madness, and it works. You come back at dawn leading a wild grey stallion worth a herd-lord's ransom.",
              fx: {coin:60,fame:3,skill:{riding:4}},
            },
            lose: {
              r: "The stallion drags you a hundred meters through the grass before the rope burns through your hands.",
              fx: {health:-18,cause:"a wild horse",wound:"burn",wil:2},
            },
          },
        ],
      },
      {
        id: "bd_wild_hornedhare",
        cond: (p,C)=>C.ageAdj(p)>=12&&C.terr(p,"steppe","plains"),
        w: .9,
        cool: 9,
        title: "The horned hare",
        text: 'A pedlar at the crossroads shows a stuffed hare with two little horns on its head. "Rarest beast of the Grass Sea," he says. "Its horn brings luck in love and dice. Three suns for a horn."',
        choices: [
          {
            t: "Buy a horn (3 suns)",
            req: p=>p.coin>=3,
            r: "You wear it on a thong. It may even work: you feel luckier.",
            fx: {coin:-3,happy:3},
          },
          {
            t: 'Look closely at the "horns"',
            check: {s:"int",s2:"medicine",d:35},
            win: {
              r: "They are not horn at all but crusty warts: a skin sickness hares catch. The pedlar sees your face and quickly covers the hare.",
              fx: {int:.5,skill:{medicine:1}},
            },
            lose: {r:"They look like horns to you.",fx:{}},
          },
          {
            t: "Go out and snare your own horned hare",
            check: {s:"survival",s2:"ins",d:48},
            win: {
              r: 'After a week you catch one with the warts on its head. You sell the "horn" in town for four suns. Everyone is happy.',
              fx: {coin:4,skill:{survival:3},honor:-1},
            },
            lose: {r:"You catch plenty of hares. None with horns.",fx:{skill:{survival:2}}},
          },
        ],
      },
      {
        id: "bd_wild_deathstalker",
        cond: (p,C)=>C.ageAdj(p)>=12&&C.terr(p,"desert"),
        w: 1,
        cool: 7,
        title: "In the boot",
        text: "You forgot to shake out your boot. The pain is like a hot nail driven into your foot, and a yellow scorpion the length of your finger scuttles away. A deathstalker. The caravan boys say they grow as big as horses in the deep sand. This one was big enough.",
        choices: [
          {
            t: "Cut the sting and suck out the poison",
            r: "Everyone says to do it. It does nothing but add a cut to a sting. You burn and shake for two days.",
            fx: {health:-16,cause:"a scorpion sting",wil:1},
          },
          {
            t: "Lie still in the shade, drink and wait",
            check: {s:"sta",s2:"wil",d:38},
            win: {
              r: "A day of fire in your leg, then it fades. Grown men usually live. Children and the old often do not.",
              fx: {health:-8,cause:"a scorpion sting",wil:1.5},
            },
            lose: {
              r: "Fever, shaking and a racing heart for three days. You come out of it weak.",
              fx: {health:-20,cause:"a scorpion sting",wil:2},
            },
          },
          {
            t: "Find the clan healer with milk and poppy (2 suns)",
            req: p=>p.coin>=2,
            r: "She binds it cold and gives you poppy milk. You sleep through the worst.",
            fx: {coin:-2,health:-6,cause:"a scorpion sting"},
          },
        ],
      },
      {
        id: "bd_wild_deathworm",
        cond: (p,C)=>C.ageAdj(p)>=12&&C.terr(p,"desert"),
        w: 1,
        cool: 9,
        title: "The Sand Death-worm",
        text: 'Around the fire the guides tell of the Sand Death-worm of the Red Waste: two meters long, blood-red, spitting acid and killing with lightning. "Never sleep far from the camels," they say. The hired guards edge closer to the fire. In the morning you see something red slide into the sand by your bedroll.',
        choices: [
          {
            t: "Dig it out",
            check: {s:"survival",s2:"ins",d:38},
            win: {
              r: "It is a red sand boa, as long as your forearm and harmless as a shoelace. The guides grin. The tale keeps hired guards close at night; that is its purpose.",
              fx: {int:.5,skill:{survival:2},happy:2},
            },
            lose: {
              r: "It bites you, harmlessly, and is gone. The guards are now certain the worm is real.",
              fx: {happy:-1},
            },
          },
          {
            t: "Sleep closer to the caravan from now on",
            r: "Exactly what the guides wanted. You sleep safer, with or without a worm.",
            fx: {wil:.5},
          },
          {
            t: 'Catch it, and sell a "death-worm skin" in the next town',
            check: {s:"trade",s2:"intrigue",d:40},
            win: {
              r: "A merchant from the coast pays fifteen suns for the skin of the dreaded worm.",
              fx: {coin:15,honor:-2},
            },
            lose: {r:"The buyer is from the Sand Clans. He laughs so hard he has to sit down.",fx:{happy:-3}},
          },
        ],
      },
      {
        id: "bd_wild_drywell",
        cond: (p,C)=>C.ageAdj(p)>=14&&C.terr(p,"desert"),
        w: 1,
        cool: 8,
        title: "The dry well",
        text: "The well on the map is a hole full of sand and a dead jackal. Every guide says it: never trust one well; carry water for two. You did not. The next well is a day and a half off.",
        choices: [
          {
            t: "Push on hard by day",
            check: {s:"sta",s2:"wil",d:48},
            win: {
              r: "Cracked lips, swimming eyes, and then the palms of the next well. You drink until you are sick.",
              fx: {wil:2,sta:.6,health:-6,cause:"thirst"},
            },
            lose: {
              r: "The noon heat drops you. A passing caravan finds you staggering, tongue swollen.",
              fx: {health:-24,cause:"thirst",wil:2.5},
            },
          },
          {
            t: "Rest in the shade by day, walk by night",
            check: {s:"survival",s2:"int",d:40},
            win: {
              r: "You walk under the stars and sleep under a cloak by day. Slow, and you arrive alive.",
              fx: {skill:{survival:3},wil:1},
            },
            lose: {r:"You lose the track in the dark and wander half a night.",fx:{health:-14,cause:"thirst",wil:2}},
          },
          {
            t: "Follow the white oryx tracks",
            check: {s:"survival",s2:"ins",d:50},
            win: {
              r: "Where the oryx go there is green, and where there is green there is a seep of water. The hunters were right.",
              fx: {skill:{survival:4},ins:.5,happy:4},
            },
            lose: {r:"The tracks lead in circles. You lose a day.",fx:{health:-16,cause:"thirst",wil:2}},
          },
        ],
      },
      {
        id: "bd_wild_basilisk",
        cond: (p,C)=>C.ageAdj(p)>=14&&C.terr(p,"desert"),
        w: .9,
        cool: 9,
        title: "The basilisk",
        text: "In a dry wadi a long brown lizard rears up and hisses: a basilisk. Townsfolk say its look can kill. Desert people know the truth. It spits for the eyes from two and a half meters, and its bite can kill a man.",
        choices: [
          {
            t: "Back away slowly, eyes narrowed",
            check: {s:"ins",s2:"spd",d:35},
            win: {r:"It spits and misses. You back out of range and go round.",fx:{ins:.3}},
            lose: {
              r: "The spit hits your face. You scrub your eyes with milk from your skin, as the clans taught you, and see blurrily for days.",
              fx: {health:-8,cause:"basilisk venom",wil:1},
            },
          },
          {t:"Kill it",fx:{beast:{id:"CRE-38",place:"a dry wadi",title:"The basilisk"}}},
          {
            t: "Catch it for a snake-charmer's pay",
            check: {s:"stealth",s2:"ins",d:55},
            win: {
              r: "A forked stick and a sack. The snake-charmer in town pays twelve suns and looks impressed.",
              fx: {coin:12,ins:.5,fame:1},
            },
            lose: {
              r: "It spits full in your eyes. Milk saves one. The other is never right again.",
              fx: {health:-15,cause:"basilisk venom",wound:"lost_eye",wil:2},
            },
          },
        ],
      },
      {
        id: "bd_wild_griffinbones",
        cond: (p,C)=>C.ageAdj(p)>=12&&C.terr(p,"desert"),
        w: .8,
        cool: 12,
        title: "Griffin bones",
        text: "A sandstorm has scoured a cliff face, and great bones stick out of the rock: a skull with a hooked beak, ribs like a ship's timbers. The salt miners say griffins guarded the desert gold until the dragons killed them. Traders pay well for a griffin beak.",
        choices: [
          {
            t: "Chip out the beak and sell it",
            check: {s:"craft",s2:"str",d:38},
            win: {
              r: "It comes out whole. A trader on the coast pays twenty suns and swears it will cure any fever.",
              fx: {coin:20},
            },
            lose: {r:"It shatters into stone crumbs. Stone. The bones are stone all through.",fx:{int:.4,happy:-1}},
          },
          {
            t: "Leave them alone. The dead guard their gold",
            r: "You touch nothing and ride on. A guide nods approval.",
            fx: {piety:2},
          },
          {
            t: "Study them: count the bones, draw them",
            check: {s:"int",s2:"learning",d:40},
            win: {
              r: "The bones have turned to stone and lie in rock laid down long before any dragon. Whatever this was, it died before the world had names.",
              fx: {int:1,skill:{learning:2}},
            },
            lose: {r:"You draw for an hour and understand nothing.",fx:{int:.3}},
          },
        ],
      },
      {
        id: "bd_wild_avalanche",
        cond: (p,C)=>C.ageAdj(p)>=14&&(C.terr(p,"mountains")||bio(p,"Alpine")),
        w: 1,
        cool: 8,
        title: "The avalanche track",
        text: "The path crosses a long scar of broken trees and piled snow where an avalanche came down last spring. It is noon, and the sun has been on the slope all morning. Your companions want to hurry across.",
        choices: [
          {
            t: "Wait for dawn and cross one at a time",
            check: {s:"wil",s2:"survival",d:35},
            win: {
              r: "You make them wait in the cold. At dawn you cross one by one on the hard crust. In the afternoon the slope lets go behind you.",
              fx: {wil:1.5,skill:{survival:3},honor:2},
            },
            lose: {
              r: "They go without you, and they make it. You are teased all the way to the next village.",
              fx: {happy:-2,wil:1},
            },
          },
          {
            t: "Cross now, fast",
            check: {s:"spd",s2:"sta",d:45},
            win: {
              r: "Halfway over you hear the crack. You run. The snow comes down a stone's throw behind you.",
              fx: {spd:.4,happy:2},
            },
            lose: {
              r: "The slope moves under your feet. You are buried to the chest and dug out half-dead.",
              fx: {health:-25,cause:"an avalanche",wound:"frostbite",wil:2.5},
            },
          },
          {
            t: "Turn back and take the long valley road",
            r: "Three extra days and a sore back. Mountain folk would call that cheap.",
            fx: {coin:-3},
          },
        ],
      },
      {
        id: "bd_wild_thinair",
        cond: (p,C)=>C.ageAdj(p)>=14&&!C.race(p,"dwarf")&&(elev(p)>=2500||C.terr(p,"mountains")),
        w: 1,
        cool: 8,
        title: "The thin air",
        text: p=>`You are guiding ${A.pick(["a salt train","a party of pilgrims","a lowland merchant and his mules"])} over a pass at four and a half thousand meters, where the air of the Roof is thin as broth. Your head pounds, your lips are blue, and one of the lowlanders is talking nonsense.`,
        choices: [
          {
            t: "Go down a stage and rest a day",
            r: "Down two hundred meters, a day's rest, and everyone's head clears. The mountain was not going anywhere.",
            fx: {skill:{survival:2},wil:.5},
          },
          {
            t: "Chew the herders' leaves and climb slowly",
            check: {s:"survival",s2:"sta",d:40},
            win: {
              r: "Like the herders of Skyhold: a bitter leaf in the cheek and slow, steady steps. You top the pass together.",
              fx: {skill:{survival:3},sta:.6,coin:6},
            },
            lose: {
              r: "The leaves help, but not enough. You get them over, then collapse at the top.",
              fx: {health:-12,cause:"mountain sickness",wil:1.5},
            },
          },
          {
            t: "Push on hard to get it over with",
            check: {s:"sta",s2:"wil",d:55},
            win: {r:"Grim, gasping, you drive them over the top by dusk.",fx:{wil:2,sta:.8,coin:6}},
            lose: {
              r: "The lowlander dies in the night with froth on his lips, and you nearly join him.",
              fx: {health:-20,cause:"mountain sickness",wil:2.5,happy:-6},
            },
          },
        ],
      },
      {
        id: "bd_wild_crowneagle",
        cond: (p,C)=>C.ageAdj(p)>=9&&C.terr(p,"mountains","hills"),
        w: .9,
        cool: 9,
        title: "The eagle's shadow",
        text: "A shadow crosses the fold: a Crown Eagle, wings wider than a man is tall, circling low. They say these eagles carry off lambs and children. Most of that is talk. Some of it is not. A little girl is playing by the wall, alone.",
        choices: [
          {
            t: "Run and scoop the child up",
            check: {s:"spd",s2:"ins",d:35},
            win: {
              r: "You have her in your arms when the eagle stoops. It pulls up, screaming, and takes a lamb instead.",
              fx: {honor:3,fame:1,coin:-2},
            },
            lose: {
              r: "You reach her as the talons hit your shoulder. You keep the child. The eagle keeps some of your skin.",
              fx: {health:-12,cause:"eagle talons",wound:"scar_arm",honor:4,fame:2,wil:1},
            },
          },
          {
            t: "Sling a stone at it",
            check: {s:"bow",s2:"ins",d:45},
            win: {
              r: "The stone clips its wing. It sheers off over the ridge and does not come back.",
              fx: {skill:{bow:2},fame:1},
            },
            lose: {r:"You miss. It takes a lamb and flies off heavily.",fx:{coin:-3}},
          },
          {
            t: "Shout and wave your cloak",
            r: "The eagle swings away. Most of the old tales are nonsense, but you are glad you shouted.",
            fx: {wil:.3},
          },
        ],
      },
      {
        id: "bd_wild_knockers",
        cond: (p,C)=>C.adult(p)&&(C.job(p,"miner")||C.race(p,"dwarf")&&C.terr(p,"mountains","hills")),
        w: 1.1,
        cool: 7,
        title: "The knockers",
        text: "Deep in an old drift you hear it: tap... tap... tap-tap, ahead in the dark. The old miners say it is the knockers, small spirits who knock to warn you, or to lure you to your death. The shift is not over, and the seam here is rich.",
        choices: [
          {
            t: "Leave at once",
            r: "You walk out fast with your crew behind you. An hour later the drift falls in with a roar. Knockers, says the crew. Rock and timber groaning before a fall, says the mine-master. Either way, you live.",
            fx: {wil:1,honor:1,skill:{survival:2}},
          },
          {
            t: "Leave a crust for the knockers and finish the shift",
            check: {s:"ins",s2:"sta",d:55},
            win: {r:"The tapping stops. You finish the shift and haul out a fine load of ore.",fx:{coin:10,piety:1}},
            lose: {
              r: "The roof comes down behind you. You dig out with broken ribs.",
              fx: {health:-22,cause:"a mine collapse",wound:"broken_ribs",wil:2},
            },
          },
          {
            t: "Laugh at the old tales and work on",
            check: {s:"ins",s2:"craft",d:60},
            win: {r:"You work on. It holds. This time.",fx:{coin:12}},
            lose: {
              r: "A crack, a roar, darkness. You wake in the open air with a crushed hand.",
              fx: {health:-25,cause:"a mine collapse",wound:"lost_fingers",wil:2.5},
            },
          },
        ],
      },
      {
        id: "bd_wild_snowape",
        cond: (p,C)=>C.ageAdj(p)>=14&&C.terr(p,"mountains"),
        w: .8,
        cool: 10,
        title: "Tracks in the snow",
        text: "Across a snowfield runs a line of footprints like a man's, but half again as long, with a thumb on the side. The herders call it the wild giant, the snow-man, a cursed giant who walks alone. Some say it is shy. Some say it eats travellers.",
        choices: [
          {
            t: "Follow the tracks at a distance",
            check: {s:"survival",s2:"stealth",d:45},
            win: {
              r: "At dusk you see it: a great shaggy ape, grey-white, digging roots by a stream. It looks at you a long moment and walks away. No one believes you.",
              fx: {int:.5,wil:1,happy:4},
            },
            lose: {
              r: "You lose the tracks in a snow squall and spend a freezing night in the rocks.",
              fx: {health:-10,cause:"cold",wil:1.5},
            },
          },
          {t:"Hunt it with a spear",fx:{beast:{id:"CRE-31",place:"the snowfields",title:"The snow-man"}}},
          {
            t: "Leave a gift of salt by the tracks",
            r: "You leave salt and turn back. The herders approve.",
            fx: {piety:2,coin:-1},
          },
        ],
      },
      {
        id: "bd_wild_wisplights",
        cond: (p,C)=>C.ageAdj(p)>=12&&C.terr(p,"marsh"),
        w: 1.2,
        cool: 7,
        title: "Wisplights",
        text: "Crossing the fen at dusk, you see blue flames floating over the peat, drifting, going out, kindling again further off. The fenfolk say they are the drowned, trying to lead the living into the bog to join them.",
        choices: [
          {
            t: "Follow them to see what they are",
            check: {s:"ins",s2:"survival",d:45},
            win: {
              r: "You reach a pool where bubbles rise from the mud and catch fire in the air. Marsh gas, burning. You walk home on the staked path with a secret.",
              fx: {int:.8,wil:1},
            },
            lose: {
              r: "The moss gives way under you. Bog water to the chest, cold as death. You claw your way out by a root.",
              fx: {health:-15,cause:"the bog",wil:2},
            },
          },
          {
            t: "Keep your eyes on the staked path and walk on",
            r: "You do not look up again until the village lamps. That is how fenfolk grow old.",
            fx: {wil:.5},
          },
          {
            t: "Throw a burning brand at the nearest light",
            check: {s:"ins",s2:"int",d:40},
            win: {
              r: "Whoomph. A sheet of blue fire over the pool, then nothing. Burning air, not ghosts.",
              fx: {int:.6,happy:2},
            },
            lose: {
              r: "The gas flares up in your face. Your eyebrows will grow back.",
              fx: {health:-6,cause:"a burn",wound:"burn"},
            },
          },
        ],
      },
      {
        id: "bd_wild_hydra",
        cond: (p,C)=>C.ageAdj(p)>=12&&C.terr(p,"marsh"),
        w: 1,
        cool: 10,
        title: "The Hydra",
        text: p=>`In a warm spring pool in the reeds you see it: a writhing knot with a dozen heads, hissing. ${p.realm==="POL-01"?"Every Aldmark child knows the tale of the Hydra of the Greenmire:":"There is an old Aldmark tale of the Hydra of the Greenmire:"} cut off one head and two grow back.`,
        choices: [
          {
            t: "Hack at it with your blade",
            check: {s:"ins",s2:"spd",d:40},
            win: {
              r: "You cut one head, and the knot explodes into a dozen water snakes going every way. Two heads for one, indeed. Mating snakes in autumn, every one.",
              fx: {int:.5,happy:3},
            },
            lose: {
              r: "The knot bursts and snakes go everywhere, including up your leg. One bites you.",
              fx: {health:-6,cause:"a snakebite",happy:-2},
            },
          },
          {
            t: "Watch it quietly from the bank",
            r: "After an hour it loosens into separate snakes: water snakes knotted together to mate in the warm water. Not one hydra but twenty lovers.",
            fx: {int:.8,skill:{survival:1}},
          },
          {
            t: "Run to the village with the news",
            r: "The village turns out with pitchforks and finds snakes. You will be teased about the Hydra until you die.",
            fx: {happy:-3,fame:1},
          },
        ],
      },
      {
        id: "bd_wild_fenague",
        cond: (p,C)=>C.ageAdj(p)>=10&&(C.terr(p,"marsh")||bio(p,"Tropical")),
        w: 1.2,
        cool: 6,
        title: "The ague",
        text: "A hot, still summer, and the ague comes up out of the low ground: shaking fits every third day, burning in between. Some say it is the bad air off the standing water. The locals sleep on raised floors in smoke.",
        choices: [
          {
            t: "Sleep in smoke on a raised floor, like the locals",
            check: {s:"sta",d:35},
            win: {r:"Smoky, itchy and bitten less. The ague passes you by this year.",fx:{skill:{survival:2}}},
            lose: {r:"It gets you anyway. Three weeks of fits.",fx:{health:-15,cause:"marsh ague",wil:1.5}},
          },
          {
            t: "Go to higher ground for the summer",
            r: "You spend the summer with cousins on a dry hill. Wise, but your fields go untended.",
            fx: {coin:-8,health:2},
          },
          {
            t: "Ignore it and work the fields",
            check: {s:"sta",s2:"wil",d:50},
            win: {r:"You work through. Lucky, this year.",fx:{coin:6,wil:1}},
            lose: {
              r: "The ague takes you hard and comes back every summer after.",
              fx: {health:-22,cause:"marsh ague",wil:2},
            },
          },
        ],
      },
      {
        id: "bd_wild_croc",
        cond: (p,C)=>C.ageAdj(p)>=12&&(C.terr(p,"marsh")||bio(p,"Savanna")),
        w: 1,
        cool: 8,
        title: "At the drinking place",
        text: p=>`At the river's edge, something like a floating log is not a log: a great crocodile, seven meters of it. ${p.realm==="POL-18"?"In flood season the Tamari say the crocodiles are the Flood Mother's guards, and must not be killed.":"Last month it took a goat."} You need water.`,
        choices: [
          {
            t: "Draw water with a bucket on a long pole",
            r: "The old way: stand well back, swing the bucket, never wade. The log watches you, and stays a log.",
            fx: {skill:{survival:2}},
          },
          {
            t: "Wade in quickly while it seems asleep",
            check: {s:"spd",s2:"ins",d:50},
            win: {r:"In, fill, out. The log does not move. Your heart does.",fx:{happy:1}},
            lose: {
              r: "It moves faster than anything that size should. You tear free with your leg in ribbons.",
              fx: {health:-28,cause:"a crocodile",wound:"bite",wil:2.5},
            },
          },
          {
            t: "Kill it before it takes a child",
            fx: p=>(p.realm==="POL-18"&&A.applyFx(p,{piety:-3},{}),A.applyFx(p,{beast:{id:"CRE-44",place:"the reed-bank",title:"The crocodile"}},{}),""),
          },
        ],
      },
      {
        id: "bd_wild_blizzard",
        cond: (p,C)=>C.ageAdj(p)>=12&&(C.terr(p,"tundra")||bio(p,"Taiga")||bio(p,"Glacier")),
        w: 1.2,
        cool: 6,
        title: "Blizzard",
        text: "The sky goes white, then the world does. A blizzard on the open tundra: you cannot see your own hand, and the wind takes your breath away before you can use it. Dig in, share warmth and wait, the old ones say. Or die.",
        choices: [
          {
            t: "Dig into a drift with the others and share warmth",
            check: {s:"survival",s2:"wil",d:38},
            win: {
              r: "Three days pressed together in a snow cave, singing to stay awake. Everyone walks out.",
              fx: {wil:2,skill:{survival:3},newRel:{type:"friend",op:25}},
            },
            lose: {
              r: "Everyone lives. Your feet do not escape so lightly.",
              fx: {health:-14,cause:"frostbite",wound:"frostbite",wil:2},
            },
          },
          {
            t: "Push for the shelter you know is close",
            check: {s:"sta",s2:"ins",d:52},
            win: {
              r: "You find the hut by the cairns, one stone to the next. A fire, a kettle, alive.",
              fx: {sta:.6,wil:1.5},
            },
            lose: {
              r: "You miss the hut by a stone's throw and wander until you fall. Herders find you in time. Barely.",
              fx: {health:-26,cause:"exposure",wound:"frostbite",wil:2.5},
            },
          },
          {
            t: "Shelter behind the sled dogs and wait",
            r: "The dogs curl round you like a living wall. Smelly, warm, and loyal. You live.",
            fx: {wil:1,health:-4,cause:"cold"},
          },
        ],
      },
      {
        id: "bd_wild_mammoth",
        cond: (p,C)=>C.ageAdj(p)>=14&&C.terr(p,"tundra"),
        w: 1,
        cool: 9,
        title: "The thunder mammoths",
        text: "A herd of small shaggy mammoths moves across the tundra, kept by a pair of giants walking slowly behind them. Lowlanders swear mammoths died out long ago. A calf has wandered toward you, and its mother has noticed.",
        choices: [
          {
            t: "Back away and give the cow room",
            r: "You never come between a cow and her calf. The giants nod to you as they pass.",
            fx: {wil:.5,newRel:{type:"friend",op:15}},
          },
          {
            t: "Walk up to the giants and offer to trade",
            check: {s:"diplomacy",s2:"trade",d:42},
            win: {
              r: "Slow speech, slow thoughts, fair dealing. You trade a knife for a bundle of mammoth wool worth five times as much.",
              fx: {coin:15,skill:{trade:2,diplomacy:2}},
            },
            lose: {r:"You surprise them. Giants do not like surprises. They loom until you leave.",fx:{happy:-2}},
          },
          {t:"Hunt the calf",fx:{beast:{id:"CRE-33",place:"the frozen plain",title:"The mammoth cow"}}},
        ],
      },
      {
        id: "bd_wild_leviathan",
        cond: (p,C)=>C.ageAdj(p)>=14&&C.coast(p),
        w: 1,
        cool: 9,
        title: "Leviathan",
        text: "Out on the water, a hundred meters off, the sea heaves. A grey back longer than your boat rises, blows a fountain of spray and sinks again. A Grey Leviathan, hunting. Sailors say leviathans are the souls of drowned kings, and that Old Ironjaw has sunk four ships since 1088.",
        choices: [
          {
            t: "Turn hard away from its path",
            check: {s:"sea",s2:"ins",d:40},
            win: {
              r: "You swing the boat off its line. Behind you the sea boils as it takes a whale calf. You were not part of its hunt.",
              fx: {skill:{sea:3},wil:1},
            },
            lose: {
              r: "Its tail fluke passes under the boat and lifts it half out of the water. You come down hard on the gunwale.",
              fx: {health:-15,cause:"a leviathan's wake",wound:"broken_ribs",wil:2},
            },
          },
          {
            t: "Hold course and throw a coin to the drowned kings",
            r: "You toss a sun over the side. The grey back does not rise again. Somebody, somewhere, accepted the toll.",
            fx: {coin:-1,piety:3},
          },
          {
            t: "Just watch, in awe",
            check: {s:"wil",s2:"ins",d:30},
            win: {
              r: "It rises once more, close, and you see its eye, old and unconcerned. You will tell your grandchildren.",
              fx: {happy:5,wil:1},
            },
            lose: {
              r: "You watch too long and drift into its hunt. A heave of water half swamps you.",
              fx: {health:-8,cause:"near-drowning",wil:1.5},
            },
          },
        ],
      },
      {
        id: "bd_wild_seamaidens",
        cond: (p,C)=>C.ageAdj(p)>=12&&C.coast(p),
        w: 1,
        cool: 9,
        title: "Sea maidens",
        text: "At dusk, from the rocks off the point, comes a wailing song, almost human. The old sailors cross themselves: sea maidens, singing ships onto the rocks. Through the haze you see shapes on the stones, sleek and pale.",
        choices: [
          {
            t: "Row close to see",
            check: {s:"sea",s2:"ins",d:38},
            win: {
              r: "Seals. Big grey monk seals, wailing to each other on the rocks, and a sea cow holding her calf upright in the water like a mother with a baby. You laugh all the way home.",
              fx: {int:.6,happy:4,skill:{sea:2}},
            },
            lose: {
              r: "The current pushes you onto the rocks. The maidens, whatever they are, do not help.",
              fx: {health:-10,cause:"the rocks",wil:1},
            },
          },
          {
            t: "Stop your ears and steer wide, like the old sailors",
            r: "Safe and wide. The legend lives another night.",
            fx: {wil:.3},
          },
          {
            t: "Club one for its pelt and oil",
            check: {s:"str",s2:"ins",d:40},
            win: {
              r: "You come home with a seal pelt and a jar of oil. Some places, Lucerna among them, fine men for this.",
              fx: p=>ap(p,{coin:8,honor:p.realm==="POL-04"?-3:0},p.realm==="POL-04"?"A watchman saw you. The fine eats half the profit.":""),
            },
            lose: {
              r: "The bull seal is bigger than you thought. It knocks you into the sea.",
              fx: {health:-8,cause:"a seal",happy:-2},
            },
          },
        ],
      },
      {
        id: "bd_wild_gale",
        cond: (p,C)=>C.adult(p)&&C.coast(p)&&(C.job(p,"fish")||C.job(p,"sailor")||C.job(p,"pirate")||A.chance(.25)),
        w: 1,
        cool: 6,
        title: "A gale out of season",
        text: "Weeks before Sea Closing, the sky goes the colour of a bruise and a gale comes screaming out of the west. You are out on the water, three hours from harbour. Open-sea sailing has its seasons for a reason.",
        choices: [
          {
            t: "Run for the harbour under bare poles",
            check: {s:"sea",s2:"wil",d:45},
            win: {
              r: "Huge grey seas chase you all the way, and the harbour mouth swallows you whole. The whole quay cheers.",
              fx: {skill:{sea:4},fame:2,wil:1.5},
            },
            lose: {
              r: "You make harbour with the mast gone and a man overboard. You got him back, nearly drowned.",
              fx: {health:-14,cause:"a storm at sea",coin:-15,wil:2},
            },
          },
          {
            t: "Ride it out at sea, bow to the waves",
            check: {s:"sea",s2:"sta",d:50},
            win: {
              r: "A night of bailing and prayer. At dawn the sea is flat and you are alive.",
              fx: {wil:2.5,sta:.6,skill:{sea:3}},
            },
            lose: {
              r: "A wave rolls the boat. You cling to the hull for hours until a fishing boat finds you.",
              fx: {health:-22,cause:"a storm at sea",coin:-20,wil:3},
            },
          },
          {
            t: "Run for the nearest cove, rocks or no rocks",
            check: {s:"sea",s2:"ins",d:48},
            win: {
              r: "A tiny cove, a gap between the rocks a boat's width wide, and you thread it. Safe.",
              fx: {skill:{sea:3},ins:.5},
            },
            lose: {
              r: "The boat strikes. You swim ashore through the surf and watch her break up.",
              fx: {health:-18,cause:"a shipwreck",coin:-25,wil:2},
            },
          },
        ],
      },
      {
        id: "bd_wild_python",
        cond: (p,C)=>C.ageAdj(p)>=14&&bio(p,"Tropical rainforest"),
        w: 1.2,
        cool: 8,
        title: "On the low branch",
        text: "A scream from the path. A World Python, thick as a man's thigh, has dropped from a low branch onto a herd-boy and is winding round him. Locals say: cut it loose fast, before the coils close.",
        choices: [
          {
            t: "Hack at the coils with your blade",
            check: {s:"axe",s2:"str",d:40},
            win: {
              r: "Three hard cuts and the coils loosen. The boy wriggles free, blue and gasping, but alive.",
              fx: {honor:3,fame:2,skill:{axe:2}},
            },
            lose: {
              r: "The coils slide over you too. Others come with machetes and cut you both out.",
              fx: {health:-15,cause:"a python",wound:"broken_ribs",honor:3,wil:2},
            },
          },
          {
            t: "Find the head and drive a blade through it",
            fx: {beast:{id:"CRE-51",place:"the deep green",title:"The World Python"}},
          },
          {
            t: "Run for help",
            r: "You bring men with machetes. They are almost too late. The boy lives, with cracked ribs.",
            fx: {honor:1},
          },
        ],
      },
    ]);
  })();
})();
