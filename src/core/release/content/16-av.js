// The release's event pack 16 of 30 (184 events, mostly av_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-027). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const free = p=>!p.flags.unfree&&!p.prison,
      J = (p,...ks)=>!!(p.job&&ks.includes(p.job.c)),
      // [X1 baked patch events/97-first-life-fixes LF-TIER-GATES] Scenes written for a commoner or a private reached the
      // top of the ladder: a queen was told to "Flee to the woods" and "Turn him in for the bounty" (the home-front war
      // scenes), danced at Harvest Home to be married off by the village, and kept a scribe's duties ("it is only a
      // job"); a General of 62 leading 12,800 was asked "You. Name?" by a passing captain; a carpenter of 68 was offered
      // the dead captain's ring and a sellsword's contract. A reigning ruler or a general (A.lfTop, h-words.core.js) no
      // longer draws the home-front, harvest-dance or learned-duty scenes; the rank-and-file camp scenes stop at rank 3;
      // the mercenary scenes stop at 55 (human years) and the road offers at 60. The guards are helpers, not
      // C.ruler/p.mil in the cond text, so A.evAudience classes the scenes as before.
      go = p=>A.C.adult(p)&&free(p)&&!p.ruler&&!(A.lfOld&&A.lfOld(p,60)),
      crook = p=>J(p,"thief","pirate")||A.C.famKind(p,"outlaw")||!!p.flags.av_crew||A.C.prof(p,"stealth",45),
      salt = p=>J(p,"sailor","pirate","fish")||A.C.famKind(p,"sea")||A.C.prof(p,"sea",35),
      // [X1 baked patch events/97-first-life-fixes LF-TIER-GATES] Scenes written for a commoner or a private reached the
      // top of the ladder: a queen was told to "Flee to the woods" and "Turn him in for the bounty" (the home-front war
      // scenes), danced at Harvest Home to be married off by the village, and kept a scribe's duties ("it is only a
      // job"); a General of 62 leading 12,800 was asked "You. Name?" by a passing captain; a carpenter of 68 was offered
      // the dead captain's ring and a sellsword's contract. A reigning ruler or a general (A.lfTop, h-words.core.js) no
      // longer draws the home-front, harvest-dance or learned-duty scenes; the rank-and-file camp scenes stop at rank 3;
      // the mercenary scenes stop at 55 (human years) and the road offers at 60. The guards are helpers, not
      // C.ruler/p.mil in the cond text, so A.evAudience classes the scenes as before.
      sword = p=>!(A.lfOld&&A.lfOld(p,55))&&(!!p.flags.av_sword||!!p.mil&&!p.ruler),
      // [X1 baked patch events/97-first-life-fixes LF-TIER-GATES] Scenes written for a commoner or a private reached the
      // top of the ladder: a queen was told to "Flee to the woods" and "Turn him in for the bounty" (the home-front war
      // scenes), danced at Harvest Home to be married off by the village, and kept a scribe's duties ("it is only a
      // job"); a General of 62 leading 12,800 was asked "You. Name?" by a passing captain; a carpenter of 68 was offered
      // the dead captain's ring and a sellsword's contract. A reigning ruler or a general (A.lfTop, h-words.core.js) no
      // longer draws the home-front, harvest-dance or learned-duty scenes; the rank-and-file camp scenes stop at rank 3;
      // the mercenary scenes stop at 55 (human years) and the road offers at 60. The guards are helpers, not
      // C.ruler/p.mil in the cond text, so A.evAudience classes the scenes as before.
      mwar = p=>!p.ruler&&!(A.lfOld&&A.lfOld(p,55))&&(!!p.flags.av_sword||!!p.mil&&A.C.atWar(p)),
      wild = p=>J(p,"hunter")||A.C.famKind(p,"hunt")||A.C.prof(p,"survival",40)||A.C.prof(p,"tracking",40),
      desertish = p=>A.C.terr(p,"desert")||A.C.realm(p,"POL-17","POL-19","POL-24"),
      BN = {
        "CRE-01": "a Great Ash Dragon",
        "CRE-03": "a Sunwall wyvern",
        "CRE-05": "an Amber Wyrm",
        "CRE-06": "a snow drake",
        "CRE-19": "the Grey Stag",
        "CRE-20": "an aurochs bull",
        "CRE-21": "a pack of Evenwood wolves",
        "CRE-23": "a hell boar",
        "CRE-24": "an Old Man of the Trees",
        "CRE-25": "a cave bear",
        "CRE-26": "a white wyrm",
        "CRE-31": "a snow ape",
        "CRE-33": "a thunder mammoth",
        "CRE-34": "a woolly rhino",
        "CRE-35": "a clan of cave hyenas",
        "CRE-38": "a basilisk",
        "CRE-43": "a sand dragon",
        "CRE-44": "a great crocodile",
        "CRE-45": "a river horse",
        "CRE-47": "a green anaconda",
        "CRE-49": "a tiger",
        "CRE-51": "a world python",
        "CRE-53": "a roc",
        "CRE-55": "a troop of Forest Men",
        "CRE-56": "a pack of Hael Hounds",
      },
      cr = id=>LORE.creatures.find(c=>c.id===id)||{},
      bn = id=>BN[id]||"a "+(cr(id).name||"beast"),
      near = (p,max)=>{const n=A.beastsNear(p).filter(id=>A.BEASTS[id]&&(!max||A.BEASTS[id].hp<=max));return n.length?A.pick(n):null},
      dot = s=>(s=String(s||"").replace(/"/g,"").trim(),s?/[.!?]$/.test(s)?s:s+".":""),
      first = s=>String(s||"").split(/[;.]/)[0].trim(),
      roadName = p=>({"POL-02":"the Sun Road","POL-03":"the Sun Road","POL-16":"the Sun Road","POL-15":"the Horse Road","POL-12":"the Horse Road","POL-31":"the Neck road","POL-19":"the Salt Road","POL-20":"the Gold Road","POL-34":"the Silk Road","POL-26":"the Fur Road","POL-25":"the Fur Road","POL-01":"the Amber Road","POL-10":"the Iron Road","POL-28":"the Zardeep road","POL-29":"the Worldspine passes","POL-30":"the Nagora road","POL-13":"the high road"})[p.realm]||"the high road",
      banditPlace = p=>({"POL-03":"in the Crown foothills","POL-31":"on the Neck road, between two burned road stations","POL-11":"on the steppe border","POL-12":"on the steppe border","POL-34":"on the steppe border","POL-13":"in a high glen"})[p.realm]||"where the road bends into the trees",
      cargo = p=>({"POL-01":["amber","the Cold Bay shore","the Kingsmere Amber Guild"],"POL-02":["salt","the Holy See's coast","the Temple's salt tax"],"POL-08":["tin","the Northreach skerries","Northreach's tenth"],"POL-09":["tin","the Frostholm fjords","the Tin Reeves"],"POL-05":["yew staves","the Varennan border","the treason law"],"POL-24":["fire-oil","the Oil Shore","the Emir's token"],"POL-26":["furs and wax","the Velgrad toll forts","the toll forts"],"POL-25":["furs and wax","the river forts","the toll forts"],"POL-32":["nutmeg","the outer islands","the scales of Amberport"],"POL-21":["pepper","the Pepper Hall","the tenth on spice"],"POL-28":["cut gems","the lower gates","the gate-wardens"],"POL-20":["river gold","the gravel beds","the Emperor's weighers"]})[p.realm]||["wine","the river landing","the lord's toll"],
      port = p=>({"POL-33":"Ratrock","POL-04":"Lucerna","POL-16":"Ostra","POL-14":"Greyhaven","POL-08":"Wolfhaven","POL-32":"Amberport","POL-24":"Sabra","POL-03":"Varenna","POL-17":"Qadira","POL-18":"Tamar"})[p.realm]||A.provName(p.home),
      ruinName = p=>{const t=(A.prov(p.home)||{}).terr;return A.C.realm(p,"POL-20","POL-21","POL-22")?A.pick(["the overgrown ruins of a town of the old Kingdom of the Tedana","the tumbled walls of Old Kimba, swallowed by fig trees"]):t==="desert"||A.C.realm(p,"POL-17","POL-19","POL-24")?A.pick(["the ruins of one of the First Wells","a caravan fort the sand has half eaten"]):A.C.realm(p,"POL-31","POL-16","POL-26","POL-25")?A.pick(["an old road station of the Neck Empire","the shell of a Tessarian road fort"]):A.pick(["the ruins of an old Solen fort","the moss-grown walls of a town of the old Solen Empire","a broken watchtower from the old empire"])};
    A.defEvents([
      {
        id: "av_road_bandits",
        cond: (p,C)=>go(p)&&!C.town(p),
        w: 1.2,
        cool: 6,
        title: "Men in the road",
        text: p=>`Five men step out ${banditPlace(p)}. ${A.pick(["Two have crossbows. One has a rusty sword and a smile.","They wear bits of old army kit and no badges at all.","Their leader is a woman with a boar-spear and a broken front tooth."])} "Purse on the ground and walk on."`,
        choices: [
          {
            t: "Throw down your purse",
            r: "They count it in front of you, laughing, and wave you on.",
            fx: {coinPct:-.5,happy:-5,wil:.5},
          },
          {
            t: "Draw your {weapon} and fight",
            req: (p,C)=>C.gear(p,"weapon"),
            r: "The leader steps up to meet you while the others watch.",
            fx: {
              duel: {
                tier: 2,
                title: "a road bandit",
                troop: "LI",
                opts: {kind:"duel",place:"the road",lethal:!0,toYield:!0,title:"Bandits"},
              },
            },
          },
          {
            t: "Loose an arrow at the leader first",
            req: (p,C)=>C.gear(p,"ranged")&&C.prof(p,"bow",35),
            check: {s:"bow",s2:"ins",d:48},
            win: {
              r: "Your shaft takes the leader through the shoulder. The rest melt into the trees.",
              fx: {fame:2,skill:{bow:3},deed:"Broke a bandit ambush with one arrow"},
            },
            lose: {
              r: "You miss. A crossbow bolt does not.",
              fx: {health:-15,wound:"arrow_wound",cause:"a bandit's bolt",coinPct:-.5},
            },
          },
          {
            t: "Talk your way past",
            check: {s:"persuasion",s2:"int",d:45},
            win: {
              r: "You talk about bad harvests and worse lords. They end up sharing a skin of wine with you.",
              fx: {skill:{persuasion:3},happy:3},
            },
            lose: {r:'"Nice speech." They take the purse and your boots.',fx:{coinPct:-.6,happy:-6}},
          },
        ],
      },
      {
        id: "av_toll_lord",
        cond: (p,C)=>go(p)&&!C.town(p),
        w: 1,
        cool: 7,
        title: "The chain across the road",
        text: p=>`A chain hangs across the road between two posts. A knight with a muddy shield sits on a stool beside it. The lawful toll is a penny a cart for ten miles. He wants ${A.ri(3,6)} suns. "My road, my bridge, my price."`,
        choices: [
          {
            t: "Pay and swallow it",
            req: p=>p.coin>=6,
            r: "You pay. He bites the coin and lifts the chain.",
            fx: {coin:-5,happy:-2},
          },
          {
            t: "Cite the law and threaten the court",
            check: {s:"intrigue",s2:"persuasion",d:50},
            win: {
              r: "You name his liege and the fine for robber-tolls. He lifts the chain without a word.",
              fx: {skill:{intrigue:2},honor:1},
            },
            lose: {r:'He laughs. "The court is far, and I am here." He doubles it.',fx:{coin:-8,happy:-4}},
          },
          {
            t: "Ford the river upstream instead",
            check: {s:"athletics",s2:"sta",d:40},
            win: {r:"Wet to the waist, but free. The knight shouts after you.",fx:{sta:.5,happy:2}},
            lose: {
              r: "The current takes your pack and nearly takes you.",
              fx: {health:-8,coinPct:-.2,cause:"a cold river"},
            },
          },
          {
            t: "Challenge him to fight for the toll",
            req: (p,C)=>C.prof(p,"sword",35)||C.prof(p,"melee",40),
            r: '"Gladly." He takes up his shield.',
            fx: {
              duel: {
                tier: 3,
                title: "a robber knight",
                troop: "HI",
                opts: {kind:"duel",place:"the bridge",lethal:!1,toYield:!0,title:"The toll"},
              },
            },
          },
        ],
      },
      {
        id: "av_broken_axle",
        cond: (p,C)=>go(p)&&(J(p,"merchant","farm","carpenter")||C.rich(p)||A.chance(.3)),
        w: 1,
        cool: 7,
        title: "A broken axle",
        text: p=>`A crack like a bone breaking. The cart drops on one side, ${A.ri(12,25)} miles from the next town. Rain is coming, and your goods are getting wet.`,
        choices: [
          {
            t: "Cut a new axle from a tree",
            check: {s:"craft",s2:"str",d:45},
            win: {r:"Green ash, a hatchet and four hours. It holds to town.",fx:{skill:{craft:4},str:.4}},
            lose: {r:"The new axle splits at the first rut. You walk the last miles.",fx:{coin:-12,happy:-4,wil:.5}},
          },
          {
            t: "Wait for the next cart and pay for help",
            req: p=>p.coin>=5,
            r: "A carter stops by evening and charges 4 suns. Highway robbery, but fair.",
            fx: {coin:-4},
          },
          {
            t: "Unload and carry what you can",
            r: "You save the best of it on your back. The rest rots by the road.",
            fx: {coin:-15,sta:.6,wil:1},
          },
        ],
      },
      {
        id: "av_inn_stranger",
        cond: (p,C)=>go(p),
        w: 1.1,
        cool: 7,
        title: "A stranger at the inn",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id,ctx.pay=A.ri(15,40);const cap=(A.realm(p.realm)||{}).capital||"the capital";ctx.dest=A.pick(["the abbot at "+cap,"a widow in "+cap,"a toll-house clerk at "+cap,"a ship's master in "+port(p)])},
        text: 'In the common room, {them} buys you an ale you did not ask for. "{pay} suns to carry a sealed packet to {dest}. No questions. No looking inside."',
        choices: [
          {
            t: "Take the job",
            check: {s:"ins",s2:"stealth",d:42},
            win: {
              r: "You deliver it. Nobody stops you. You never learn what it was, and you decide that is better.",
              fx: {coin:25,them:{type:"friend",op:15}},
            },
            lose: {
              r: "Two men stop you on the road and take the packet at knifepoint. {them} will not be pleased.",
              fx: {health:-6,them:{type:"enemy",op:-20}},
            },
          },
          {
            t: "Take it, then open it",
            check: {s:"intrigue",s2:"int",d:50},
            win: {
              r: "A list of names and sums. Bribes paid to a royal reeve. You reseal it perfectly and keep a copy.",
              fx: {coin:25,skill:{intrigue:4},flag:"av_secret"},
            },
            lose: {r:"The wax cracks crooked. The receiver sees it at once.",fx:{them:{type:"enemy",op:-30},happy:-4}},
          },
          {t:"Say no",r:"{them} shrugs and finds someone hungrier.",fx:{}},
        ],
      },
      {
        id: "av_inn_commonroom",
        cond: (p,C)=>go(p),
        w: 1,
        cool: 6,
        title: "The common room",
        text: "Three pence buys a place on the straw with twenty strangers, a fire and a snoring carter. In the dark you feel a hand at your pack.",
        choices: [
          {
            t: "Grab the wrist",
            check: {s:"spd",s2:"unarmed",d:40},
            win: {r:"A skinny boy, ten at most. The room wakes and wants to beat him.",fx:{ins:.4}},
            lose: {
              r: "The hand is gone, and so is your purse. Twenty strangers swear they slept.",
              fx: {coinPct:-.3,happy:-4},
            },
          },
          {
            t: "Pretend to sleep and watch where it goes",
            check: {s:"stealth",s2:"ins",d:45},
            win: {
              r: "You follow the thief to the stable and take back your purse and his.",
              fx: {coin:8,skill:{stealth:3}},
            },
            lose: {r:"You really do fall asleep. Morning is poorer.",fx:{coinPct:-.3}},
          },
          {
            t: 'Shout "Thief!"',
            r: "Everybody shouts. Everybody grabs. In the scrum, your purse is lost anyway.",
            fx: {coinPct:-.15,happy:-2},
          },
        ],
      },
      {
        id: "av_inn_knock",
        cond: (p,C)=>go(p)&&p.coin>=10,
        w: .9,
        cool: 8,
        title: "A knock at night",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id},
        text: 'You took a private room: a bed, a lock and fleas. Past midnight, a soft knock. {them} stands there, white-faced. "Please. There are men downstairs asking for me."',
        choices: [
          {
            t: "Let {themHim} in and bar the door",
            check: {s:"deception",s2:"wil",d:42},
            win: {
              r: "When the men knock, you answer in your nightshirt and swear you sleep alone. They go. At dawn {them} thanks you with shaking hands.",
              fx: {them:{type:"friend",op:30},honor:2},
            },
            lose: {
              r: "They push past you. You take a beating for your kindness.",
              fx: {health:-12,them:{type:"friend",op:25},wil:1,cause:"a beating"},
            },
          },
          {
            t: "Ask who the men are first",
            check: {s:"ins",s2:"int",d:38},
            win: {
              r: "A debt-hound and his boy, after twenty suns. You pay it yourself. {them} will remember.",
              fx: {coin:-20,them:{type:"friend",op:40}},
            },
            lose: {r:"While you talk, the men come up the stairs.",fx:{happy:-4}},
          },
          {
            t: "Close the door",
            r: "You hear a scuffle on the stairs, then nothing. You do not sleep well.",
            fx: {happy:-3,honor:-1},
          },
        ],
      },
      {
        id: "av_pilgrims",
        cond: (p,C)=>go(p)&&C.faith(p,"REL-01","REL-02","REL-06","REL-17","REL-07"),
        w: 1,
        cool: 10,
        title: "With the pilgrims",
        text: p=>`A band of pilgrims passes, bound for ${p.faith==="REL-06"?"the Bluespire circuit, where the monks of Skyhold feed every pilgrim":p.faith==="REL-07"?"the road to the First Wells, where water is free by the Book":p.faith==="REL-17"?"the graves of the Marchland Saints":"the Sun Road to Solenne, a brass sun badge on every hat"}. They sing badly and walk slowly, and they ask you to come.`,
        choices: [
          {
            t: "Walk with them for a season",
            r: "Blisters, prayers, cheap bread and good company. You come back lighter.",
            fx: {piety:6,happy:5,sta:.6,coin:-6,wil:.5},
          },
          {
            t: "Hire on as their guard",
            req: (p,C)=>C.gear(p,"weapon"),
            check: {s:"ins",s2:"melee",d:40},
            win: {
              r: "One night two thieves try the baggage. You see them off. The pilgrims pay you in coin and blessings.",
              fx: {coin:15,piety:2,fame:1},
            },
            lose: {
              r: "The thieves come while you doze. The pilgrims forgive you. That is worse.",
              fx: {honor:-2,happy:-3},
            },
          },
          {t:"Wish them well and keep to your road",r:"Their song fades behind you.",fx:{}},
        ],
      },
      {
        id: "av_false_relic",
        cond: (p,C)=>go(p)&&(C.realm(p,"POL-02","POL-03","POL-04","POL-15","POL-31")||C.faith(p,"REL-01")),
        w: .9,
        cool: 9,
        title: "A finger of the saint",
        text: 'A man in a dusty habit opens a little box on a velvet cloth. "The finger bone of a saint. Touched to the Sun Altar. Only twelve suns, for the soul of a mother."',
        choices: [
          {
            t: "Buy it",
            req: p=>p.coin>=12,
            r: "You buy it. Later a butcher tells you it is a pig's knuckle. You keep it anyway.",
            fx: {coin:-12,piety:2,happy:-1},
          },
          {
            t: "Expose him to the crowd",
            check: {s:"learning",s2:"persuasion",d:45},
            win: {
              r: 'You show them the saw marks. The crowd turns on him; he runs, leaving his box of "relics".',
              fx: {fame:1,honor:2,skill:{learning:2}},
            },
            lose: {r:"The crowd sides with the holy man. Someone spits on you.",fx:{happy:-4}},
          },
          {
            t: "Ask him to teach you the trade",
            req: (p,C)=>crook(p)||C.trait(p,"deceitful"),
            check: {s:"deception",s2:"int",d:40},
            win: {
              r: "For a cut he shows you how to age a bone with tea and smoke. Ugly, useful knowledge.",
              fx: {skill:{deception:4},coin:10,piety:-3},
            },
            lose: {r:'He sells you a box of pig knuckles as "stock". You have been taught a lesson.',fx:{coin:-10}},
          },
        ],
      },
      {
        id: "av_caravan_desert",
        cond: (p,C)=>go(p)&&desertish(p),
        w: 1.2,
        cool: 6,
        title: "The caravan by night",
        text: "The caravan moves by night now; in the day the heat kills. Your guide of the Brotherhood swore to the caravan by water. On the third night he stops at a well, lowers the bucket, and draws up sand.",
        choices: [
          {
            t: "Trust the guide to the next well",
            check: {s:"wil",s2:"sta",d:45},
            win: {
              r: "Two more nights of cracked lips. The next well is sweet. You drink until you cry.",
              fx: {wil:2,sta:1},
            },
            lose: {r:"A camel dies, then a driver. You reach water, barely.",fx:{health:-15,wil:2,cause:"thirst"}},
          },
          {
            t: "Dig out the well",
            check: {s:"str",s2:"survival",d:45},
            win: {
              r: "Two fathoms down the sand turns damp, then wet. The whole caravan cheers you.",
              fx: {str:.6,fame:1,skill:{survival:3}},
            },
            lose: {r:"You dig until your hands bleed and find only more sand.",fx:{health:-6,wil:1}},
          },
          {
            t: "Ration the water strictly",
            check: {s:"command",s2:"wil",d:42},
            win: {
              r: "You hold the skins and nobody drinks more than a cup. Everyone lives.",
              fx: {skill:{command:3},honor:2},
            },
            lose: {
              r: "A driver pulls a knife over a cup. You lose half the water in the scuffle.",
              fx: {health:-8,cause:"a knife in the dark"},
            },
          },
        ],
      },
      {
        id: "av_caravan_deathworm",
        cond: (p,C)=>go(p)&&desertish(p),
        w: .8,
        cool: 12,
        once: !0,
        title: "The tale at the fire",
        text: ()=>'The Sand Clan guide tells the guards a story by the fire: the Sand Death-worm, red, two metres long, which "spits acid and kills with lightning" and takes men who sleep far from the camels.',
        choices: [
          {
            t: "Sleep close to the camels like everyone else",
            r: "You sleep close. No worm comes. Nor do the thieves who watch lone sleepers.",
            fx: {happy:1},
          },
          {
            t: "Ask him, quietly, if it is true",
            check: {s:"persuasion",s2:"ins",d:38},
            win: {
              r: p=>`He grins. "${dot(cr("CRE-39").truth)} A red sand boa and a legless lizard, both harmless. But guards who sleep apart get their throats cut by raiders. The tale keeps them close."`,
              fx: {int:.6,skill:{survival:2}},
            },
            lose: {r:'"Sleep far from the camels and find out."',fx:{}},
          },
          {
            t: "Sleep apart to prove you are not afraid",
            check: {s:"ins",s2:"stealth",d:50},
            win: {
              r: "In the night you hear soft feet. You lie still, and the raiders pass you by for the baggage. You raise the alarm.",
              fx: {fame:2,ins:.6},
            },
            lose: {
              r: "No worm. A raider's knife, though, across your arm.",
              fx: {health:-12,wound:"deep_cut",cause:"a raider's knife"},
            },
          },
        ],
      },
      {
        id: "av_pass_winter",
        cond: (p,C)=>go(p)&&C.terr(p,"mountains","hills"),
        w: 1,
        cool: 8,
        title: "Late on the pass",
        text: p=>`It is ${A.pick(["November","late October","the first week of December"])}, and anyone still on the high road is late, poor or running. The pass ahead is white. The mule men at the foot want 3 suns a day and say it will close tomorrow.`,
        choices: [
          {
            t: "Hire a mule man and go now",
            req: p=>p.coin>=9,
            check: {s:"sta",s2:"survival",d:42},
            win: {
              r: "Three days of wind that cuts through wool. The mule man knows every cairn. You come down into the valley alive.",
              fx: {coin:-9,sta:1,wil:1},
            },
            lose: {
              r: "A whiteout. You lose your toes to the cold before the mule man finds the shelter.",
              fx: {coin:-9,wound:"frostbite",health:-12,wil:2,cause:"cold on the pass"},
            },
          },
          {
            t: "Go alone, now, and save the coin",
            check: {s:"survival",s2:"wil",d:55},
            win: {
              r: "You read the cairns yourself and dig a snow-hole when the wind turns. You walk down a different person.",
              fx: {skill:{survival:5},wil:2,fame:1},
            },
            lose: {
              r: "You lose the road in cloud. A shepherd finds you half dead two days later.",
              fx: {health:-25,wound:"frostbite",wil:2,cause:"exposure on the high road"},
            },
          },
          {
            t: "Winter at the foot of the pass",
            r: "Four months in a smoky hostel, working for your keep. The pass opens in April.",
            fx: {coin:-12,happy:-4,wil:1,skill:{craft:2}},
          },
        ],
      },
      {
        id: "av_river_ford",
        cond: (p,C)=>go(p)&&!C.terr(p,"desert"),
        w: 1,
        cool: 7,
        title: "The ford in spring",
        text: "Snowmelt has the river high and brown. The ferryman wants 2 suns, more than twice the usual. The ford, a little upstream, is marked with willow stakes, half of them under water.",
        choices: [
          {
            t: "Pay the ferryman",
            req: p=>p.coin>=2,
            r: "He grins all the way across. You arrive dry and annoyed.",
            fx: {coin:-2},
          },
          {
            t: "Ride the ford",
            req: (p,C)=>C.mounted(p),
            check: {s:"riding",s2:"sta",d:42},
            win: {
              r: "Your mount leans into the current and finds the stones. Water to the saddle, then out.",
              fx: {skill:{riding:4}},
            },
            lose: {
              r: "Your horse stumbles. You both go under and come out a hundred yards down, alive.",
              fx: {health:-12,coinPct:-.15,cause:"the river in flood"},
            },
          },
          {
            t: "Wade it",
            check: {s:"athletics",s2:"str",d:48},
            win: {r:"Waist-deep and freezing, but you make it.",fx:{skill:{athletics:3},sta:.5}},
            lose: {
              r: "The river knocks you down and rolls you over the stones.",
              fx: {health:-15,cause:"drowning in a ford",wound:"bad_knee"},
            },
          },
        ],
      },
      {
        id: "av_grey_ferry",
        cond: (p,C)=>go(p)&&C.realm(p,"POL-14","POL-15","POL-31","POL-25"),
        w: .8,
        cool: 10,
        title: "The Grey Channel ferry",
        text: "The Grey Channel ferry: 45 kilometres of choppy grey water, 6 pence a person and 2 suns a horse. The ferry holders of both shores are on deck, arguing about the take while the boat drifts.",
        choices: [
          {
            t: "Offer to help the crew",
            check: {s:"sea",s2:"str",d:38},
            win: {r:"You take an oar when the wind fails. The master waves your fare.",fx:{skill:{sea:3},str:.3}},
            lose: {r:"You are sick over the side for six hours.",fx:{happy:-3}},
          },
          {
            t: "Listen to the gossip on deck",
            check: {s:"intrigue",s2:"int",d:35},
            win: {
              r: p=>"A Velgrad toll-clerk talks too much. You learn which of the three Neck road stations takes bribes.",
              fx: {skill:{intrigue:3},flag:"av_neckbribe"},
            },
            lose: {r:"Rumors of war and of a black dragon under the channel. Nothing you can use.",fx:{}},
          },
          {t:"Keep to yourself",r:"A long grey crossing.",fx:{}},
        ],
      },
      {
        id: "av_lost_pass",
        cond: (p,C)=>go(p)&&!C.noble(p),
        w: .8,
        cool: 10,
        title: "No letter of passage",
        text: 'At a bridge-gate the sergeant asks for your letter of passage. A scribe writes one for 6 pence and a seal costs a sun, but yours is at the bottom of a river two days back. "No letter, no road."',
        choices: [
          {
            t: "Pay the sergeant to forget the rule",
            req: p=>p.coin>=3,
            check: {s:"persuasion",s2:"ins",d:35},
            win: {r:"Three suns and he cannot remember your face.",fx:{coin:-3}},
            lose: {
              r: "A dry one: he will not take a bribe. He takes your coin anyway, as a fine.",
              fx: {coin:-5,happy:-3},
            },
          },
          {
            t: "Forge a letter at the next inn",
            req: (p,C)=>C.literate(p),
            check: {s:"deception",s2:"craft",d:48},
            win: {
              r: "A seal pressed from a pewter button and a fine clerk's hand. It passes.",
              fx: {skill:{deception:4},flag:"av_forger"},
            },
            lose: {
              r: 'The sergeant holds it to the light. "Funny seal." You spend a night in the lock-up.',
              fx: {happy:-5,honor:-2,fame:-1},
            },
          },
          {
            t: "Go round by the goat paths",
            check: {s:"survival",s2:"athletics",d:40},
            win: {r:"Two days longer, but nobody asks your name.",fx:{skill:{survival:2}}},
            lose: {r:"You twist an ankle on the scree and limp for weeks.",fx:{health:-8,cause:"a fall"}},
          },
        ],
      },
      {
        id: "av_neck_station",
        cond: (p,C)=>go(p)&&C.realm(p,"POL-31"),
        w: 1.1,
        cool: 6,
        title: "The road station",
        text: p=>`The Neck road stations stand every thirty kilometres, small forts that charge what they like. Bread here costs three times Ostra's price. ${A.pick(["Queen Livia's men","Prince Andros's men","Velgrad's collectors"])} want a toll "for the war".`,
        choices: [
          {
            t: "Pay it",
            req: p=>p.coin>=6,
            r: "You pay, and pay again at the next station, and the next.",
            fx: {coin:-6,happy:-3},
          },
          {
            t: "Name the bribe-taker you heard about",
            req: (p,C)=>C.flag(p,"av_neckbribe"),
            r: "You ask for the right corporal by name. He waves you through for a penny and a wink.",
            fx: {coin:-1,happy:2},
          },
          {
            t: "Slip around the fort at night",
            check: {s:"stealth",s2:"survival",d:45},
            win: {r:"You pass under the walls while the sentries dice.",fx:{skill:{stealth:3}}},
            lose: {
              r: `A sentry's lantern finds you. They take a "fine" and a few teeth.`,
              fx: {coin:-8,health:-8,wound:"broken_nose",cause:"a beating"},
            },
          },
        ],
      },
      {
        id: "av_yam_station",
        cond: (p,C)=>go(p)&&C.realm(p,"POL-12","POL-11","POL-34"),
        w: 1,
        cool: 8,
        title: "The yam station",
        text: "A yam station on the grass: fresh horses for riders with the khan's token, a wall to sleep by for anyone with a coin and a good reason. A rider comes in at dusk on a dying horse, with a silver tablet at his belt.",
        choices: [
          {
            t: "Help him change horses fast",
            check: {s:"husbandry",s2:"spd",d:38},
            win: {
              r: "He is gone in minutes. A month later a gift arrives: a good bridle and a word of thanks.",
              fx: {skill:{husbandry:3},coin:6,favor:3},
            },
            lose: {r:"The fresh horse kicks you in the thigh.",fx:{health:-8,cause:"a kick"}},
          },
          {
            t: "Ask what news he carries",
            check: {s:"persuasion",s2:"etiquette",d:50},
            win: {
              r: "He tells you only that the khan is moving riders west. You sell that to a horse-trader for good coin.",
              fx: {coin:12,skill:{intrigue:2}},
            },
            lose: {r:"The tablet outranks any chief. He outranks you too, and says so.",fx:{happy:-2}},
          },
          {t:"Sleep by the wall",r:"Wind, stars and the smell of horses. A good night.",fx:{happy:2}},
        ],
      },
      {
        id: "av_orc_tent",
        cond: (p,C)=>go(p)&&(C.realm(p,"POL-11","POL-34")||C.terr(p,"steppe"))&&!C.race(p,"orc","halforc"),
        w: .9,
        cool: 9,
        title: "Under the Law of the Fire",
        text: "Night falls on the steppe with no shelter in sight but an orc camp. Under the Law of the Fire, a guest who comes in peace is fed and may not be harmed. He brings a gift and leaves within three days.",
        choices: [
          {
            t: "Walk in with a gift",
            req: p=>p.coin>=3,
            r: "You give a knife and a twist of salt. They give you mare's milk, mutton and a spot by the fire. An old woman asks about your mother.",
            fx: {coin:-3,happy:4,newRel:{type:"friend",op:25},lang:"Orcish"},
          },
          {
            t: "Walk in with nothing but manners",
            check: {s:"etiquette",s2:"diplomacy",d:48},
            win: {
              r: "You sing them a song of your people as your gift. They laugh, and approve.",
              fx: {skill:{diplomacy:3},happy:3},
            },
            lose: {r:"A guest without a gift. They feed you anyway, and remember.",fx:{happy:-2,honor:-1}},
          },
          {
            t: "Sleep in the open",
            check: {s:"survival",s2:"sta",d:40},
            win: {r:"Cold and quiet.",fx:{skill:{survival:2}}},
            lose: {r:"The cave hyenas laugh around you all night. You do not sleep.",fx:{happy:-4,health:-4}},
          },
        ],
      },
      {
        id: "av_courier",
        cond: (p,C)=>go(p)&&(C.mounted(p)||C.prof(p,"riding",35)),
        w: 1,
        cool: 7,
        title: "The urgent letter",
        text: "A merchant pays 15 suns for a letter to reach {town} in four days, not seven. Halfway there, at an inn, a pleasant man offers you 40 suns to let him read it for an hour.",
        choices: [
          {
            t: "Ride on, letter unread",
            check: {s:"riding",s2:"sta",d:45},
            win: {
              r: "Four days to the hour. The merchant hires you again.",
              fx: {coin:15,skill:{riding:3},flag:"av_courier"},
            },
            lose: {r:"Your horse throws a shoe. Five days. Half pay.",fx:{coin:7}},
          },
          {
            t: "Take the 40 suns",
            r: "He reads it, smiles, and gives it back. A week later the merchant is ruined in a deal. Someone knew his price.",
            fx: {coin:55,honor:-4,trait:"deceitful"},
          },
          {
            t: "Take the coin and lie about the letter",
            req: (p,C)=>C.prof(p,"deception",35),
            check: {s:"deception",s2:"int",d:52},
            win: {
              r: "You give him a copy with the figures changed. He pays, believes it, and loses a fortune.",
              fx: {coin:55,skill:{deception:4}},
            },
            lose: {
              r: "He sees the ink is fresh. His men see you to the door, hard.",
              fx: {health:-10,coin:15,cause:"a beating"},
            },
          },
        ],
      },
      {
        id: "av_ditch_corpse",
        cond: (p,C)=>go(p)&&!C.town(p),
        w: .9,
        cool: 9,
        title: "In the ditch",
        text: p=>`A man lies face down in the ditch, ${A.pick(["three days dead","not long dead","cold, with crows already at work"])}. His purse is still on his belt. If you are seen with him, you will have to explain.`,
        choices: [
          {
            t: "Raise the hue and cry",
            r: "Every neighbor must answer, so they come. The reeve thanks you for doing your duty, and asks a lot of questions.",
            fx: {honor:2,happy:-1},
          },
          {
            t: "Take the purse and go",
            check: {s:"stealth",s2:"ins",d:38},
            win: {r:"Eleven suns and a lead token you do not understand.",fx:{coin:11,honor:-2}},
            lose: {
              r: "A shepherd on the hill sees you. By evening, you are the man who killed him.",
              fx: {coin:11,punish:"theft",fame:-1},
            },
          },
          {
            t: "Bury him and say the words",
            r: "You dig a shallow grave and say what you remember of the rites.",
            fx: {piety:4,wil:.5,sta:.3},
          },
        ],
      },
      {
        id: "av_horse_race_road",
        cond: (p,C)=>go(p)&&C.mounted(p),
        w: .8,
        cool: 8,
        title: "Riders behind you",
        text: "Four riders come over the ridge behind you, spurring hard. Nobody gallops on this road for good reasons.",
        choices: [
          {
            t: "Spur and outrun them",
            check: {s:"riding",s2:"spd",d:48},
            win: {
              r: "Your horse has more heart than theirs. They fall back at the river.",
              fx: {skill:{riding:4},fame:1},
            },
            lose: {
              r: "They run you down. You lose the horse's saddlebags and most of your dignity.",
              fx: {coinPct:-.4,happy:-5},
            },
          },
          {
            t: "Turn and meet the first one",
            req: (p,C)=>C.prof(p,"mounted",35)||C.prof(p,"lance",30),
            r: "You wheel your horse and lower your point.",
            fx: {
              duel: {
                tier: 3,
                title: "a mounted raider",
                troop: "LC",
                opts: {kind:"duel",place:"the open road",lethal:!0,toYield:!0,title:"Riders"},
              },
            },
          },
          {
            t: "Ride into the trees and hide",
            check: {s:"stealth",s2:"riding",d:45},
            win: {r:"They thunder past.",fx:{skill:{stealth:2}}},
            lose: {r:"Your horse whinnies. They find you.",fx:{coinPct:-.5,health:-6,cause:"robbers"}},
          },
        ],
      },
      {
        id: "av_lame_horse",
        cond: (p,C)=>go(p)&&C.mounted(p),
        w: .8,
        cool: 8,
        title: "A stone in the hoof",
        text: "Your mount goes lame on a stony road, head bobbing on every step. Thirty kilometres to anywhere.",
        choices: [
          {
            t: "Dig out the stone and poultice the hoof",
            check: {s:"husbandry",s2:"int",d:40},
            win: {r:"A bruise, not a break. A day of rest and bran and you ride on.",fx:{skill:{husbandry:4}}},
            lose: {r:"You make it worse. The farrier in town shakes his head and charges double.",fx:{coin:-10}},
          },
          {t:"Walk and lead it",r:"A long walk, but the horse is sound in a week.",fx:{sta:.6,wil:.5}},
          {
            t: "Sell it to the next farmer cheap",
            r: "Ten suns for a horse worth fifty. You walk on lighter and poorer.",
            fx: p=>(p.gear.mount=null,p.coin+=10,"You are on foot now."),
          },
        ],
      },
      {
        id: "av_caravan_guard",
        cond: (p,C)=>go(p)&&(C.gear(p,"weapon")||C.prof(p,"xbow",30)),
        w: 1.1,
        cool: 6,
        title: "Caravan guard",
        setup: (p,ctx)=>{ctx.road=roadName(p)},
        text: "A merchant hiring at the gate: guards for {road}, 25 suns a month and food, more for a crossbow. On the ninth day, at a narrow place, someone has felled a tree across the road.",
        choices: [
          {
            t: "Shout the alarm and form up on the wagons",
            check: {s:"command",s2:"ins",d:45},
            win: {
              r: "The guards form a ring before the raiders close. The raiders think better of it. The merchant pays a bonus.",
              fx: {coin:30,skill:{command:3},fame:1},
            },
            lose: {
              r: "Confusion. They take two wagons before you drive them off.",
              fx: {coin:15,health:-8,cause:"a raider's club"},
            },
          },
          {
            t: "Go forward to meet them",
            r: "You vault the tree trunk with your {weapon} up.",
            fx: {
              coin: 25,
              duel: {
                tier: 2,
                title: "a caravan raider",
                troop: "LI",
                opts: {kind:"duel",place:"a felled tree",lethal:!0,toYield:!0,title:"Ambush"},
              },
            },
          },
          {
            t: "Shoot from the wagon bed",
            req: (p,C)=>C.gear(p,"ranged"),
            check: {s:"xbow",s2:"bow",d:45},
            win: {r:"Three shots, two hits, and the ambush breaks.",fx:{coin:35,skill:{xbow:2,bow:2},fame:1}},
            lose: {
              r: "You loose too early. They know where you are now.",
              fx: {coin:20,health:-10,wound:"arrow_wound",cause:"an arrow"},
            },
          },
        ],
      },
      {
        id: "av_unpaid_soldiers",
        cond: (p,C)=>go(p)&&(C.atWar(p)||C.realm(p,"POL-31")),
        w: 1,
        cool: 7,
        title: "Soldiers on the road",
        text: 'A dozen soldiers sit by a road-shrine, their badges torn off. "Not paid in a year," says their sergeant. "So the road pays us."',
        choices: [
          {
            t: "Pay what they ask",
            req: p=>p.coin>=10,
            r: "Ten suns. They are almost polite.",
            fx: {coin:-10,happy:-2},
          },
          {
            t: "Offer to share food and news instead",
            check: {s:"diplomacy",s2:"persuasion",d:45},
            win: {
              r: "You eat with them. They are farm boys a long way from home. They let you go and tell you which road is safe.",
              fx: {skill:{diplomacy:3},happy:2},
            },
            lose: {r:"They take the food and the coin.",fx:{coin:-12,happy:-4}},
          },
          {
            t: "Claim to be a courier of the crown",
            check: {s:"deception",s2:"wil",d:50},
            win: {r:"They step aside. Nobody wants to hang for one purse.",fx:{skill:{deception:3}}},
            lose: {
              r: '"Then the crown can pay us." They take everything, and your boots.',
              fx: {coinPct:-.7,happy:-6,wil:1},
            },
          },
          {
            t: "Run",
            check: {s:"spd",s2:"athletics",d:42},
            win: {r:"They are too tired and too hungry to chase.",fx:{spd:.4}},
            lose: {
              r: "A thrown stone catches you on the head.",
              fx: {health:-10,wound:"concussion",coinPct:-.4,cause:"a blow to the head"},
            },
          },
        ],
      },
      {
        id: "av_hiring_fair",
        cond: (p,C)=>go(p)&&C.ageAdj(p)<30&&!p.mil,
        w: 1,
        cool: 8,
        title: "The May hiring fair",
        text: `1 May: the hiring fair. Masters stand on carts and shout for hands. A caravan master wants guards for the long road, a ship's mate wants deckhands until Sea Closing, and a captain of a free company wants "anyone with a spine".`,
        choices: [
          {
            t: "Sign with the caravan master",
            r: "You walk out of town behind forty mules.",
            fx: {job:"merchant",coin:10,skill:{trade:2}},
          },
          {
            t: "Sign on as a deckhand",
            req: (p,C)=>C.coast(p),
            r: "Fifteen suns a month and food, paid off in October. You buy a knife and a tarred hat.",
            fx: {job:"sailor",coin:5},
          },
          {
            t: "Take the free company's coin",
            r: "Twenty-five suns a month, promised. A spear, a padded coat and a mark on the roll.",
            fx: {flag:"av_sword",coin:10,gear:{weapon:"spear",armor:"padded"},skill:{spear:2}},
          },
          {t:"Stay with what you know",r:"You eat a pie, watch the others go and walk home.",fx:{happy:1}},
        ],
      },
      {
        id: "av_road_dice",
        cond: (p,C)=>go(p)&&p.coin>=5,
        w: .8,
        cool: 7,
        title: "Bones by the roadside",
        text: `Carters waiting out the rain throw sheep's knucklebones on a blanket. "Penny a throw, sun a round."`,
        choices: [
          {
            t: "Play a round",
            check: {s:"gambling",s2:"ins",d:40},
            win: {r:"You clean them out and leave before they think about it.",fx:{coin:12,skill:{gambling:3}}},
            lose: {r:"The bones hate you today.",fx:{coin:-8}},
          },
          {
            t: "Play their own crooked bones back at them",
            req: (p,C)=>C.prof(p,"gambling",40)||C.prof(p,"deception",45),
            check: {s:"gambling",s2:"deception",d:48},
            win: {r:"You spot the weighted bone and swap in your own. A very profitable evening.",fx:{coin:25}},
            lose: {
              r: "They see the swap. The rest of the evening is a fistfight.",
              fx: {health:-10,coin:-5,wound:"broken_nose",cause:"a brawl"},
            },
          },
          {t:"Just watch",r:"You learn how they cheat. Interesting.",fx:{skill:{gambling:1}}},
        ],
      },
      {
        id: "av_road_shortcut",
        cond: (p,C)=>go(p)&&C.terr(p,"forest","hills","marsh"),
        w: .9,
        cool: 8,
        title: "The shortcut",
        text: `A charcoal burner swears there is a path through the woods that saves a day. "Keep the stream on your left and you can't go wrong."`,
        choices: [
          {
            t: "Take the shortcut",
            check: {s:"tracking",s2:"survival",d:42},
            win: {r:"The stream, the path, the far edge of the wood by noon. He was right.",fx:{skill:{tracking:3}}},
            lose: {r:"There are two streams. By dark you are lost.",fx:{event:"av_wild_lost"}},
          },
          {t:"Stay on the long road",r:"A day longer, a lot safer.",fx:{}},
        ],
      },
      {
        id: "av_washed_bridge",
        cond: (p,C)=>go(p)&&!C.terr(p,"desert","steppe"),
        w: .8,
        cool: 8,
        title: "The bridge is gone",
        text: "The storm took the bridge. Planks hang from the far pier. Fifteen travelers stand on the bank arguing, and a carter with a load of salt is weeping.",
        choices: [
          {
            t: "Organize them to build a raft",
            check: {s:"command",s2:"craft",d:45},
            win: {
              r: "Two hours, three carts' worth of planks and a rope. Everyone crosses, salt and all.",
              fx: {skill:{command:3,craft:2},fame:2,newRel:{type:"friend",op:25}},
            },
            lose: {
              r: "The raft spins and dumps the salt. The carter will curse your name.",
              fx: {happy:-3,newRel:{type:"rival",op:-20}},
            },
          },
          {
            t: "Swim across with a rope",
            check: {s:"athletics",s2:"sta",d:50},
            win: {
              r: "You make the far bank and tie the rope off. Hand over hand, they all follow.",
              fx: {skill:{athletics:4},fame:2},
            },
            lose: {
              r: "The current takes you a mile down. You crawl out half-drowned.",
              fx: {health:-18,cause:"drowning",wil:1},
            },
          },
          {
            t: "Wait two days for the river to fall",
            r: "Two days of bad bread and other people's stories.",
            fx: {coin:-2,happy:-1},
          },
        ],
      },
      {
        id: "av_runaway_serf",
        cond: (p,C)=>go(p)&&!C.unfree(p),
        w: .9,
        cool: 8,
        title: "Hiding in the hay",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id},
        text: `Under the hay in your cart you find {them}, a runaway serf, thin as a rake. "My lord's bailiff is a day behind. A year and a day in a free town and I'm free. Please."`,
        choices: [
          {
            t: "Hide {themHim} and drive on",
            check: {s:"deception",s2:"wil",d:42},
            win: {
              r: "The bailiff's men poke the hay with spears and miss. At the town gate {them} kisses your hands.",
              fx: {them:{type:"friend",op:40},honor:3,happy:4},
            },
            lose: {
              r: "A spear finds a leg. They drag {themHim} back, and fine you for it.",
              fx: {coin:-15,happy:-6,wil:1,them:{op:10}},
            },
          },
          {
            t: "Give {themHim} bread and send {themHim} into the woods",
            r: "You never learn what happened to {themHim}.",
            fx: {coin:-1,honor:1},
          },
          {
            t: "Hand {themHim} over for the reward",
            r: "Five suns from the bailiff. The look on {theirHis} face will stay with you.",
            fx: {coin:5,honor:-5,happy:-4,trait:"cruel"},
          },
        ],
      },
      {
        id: "av_debt_hound",
        cond: (p,C)=>go(p)&&(C.realm(p,"POL-16","POL-04","POL-02","POL-03")||C.town(p)),
        w: .8,
        cool: 9,
        title: "The Debt-Hound",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id},
        text: `A thin man in a black coat sits beside you at the inn: one of the Debt-Hounds the Ostran banks send after fled debtors. "I'm looking for {them}. Your road-companion, I think. Twenty suns if you point."`,
        choices: [
          {
            t: "Point",
            r: "He thanks you and pays. {them} is gone by morning, in chains.",
            fx: {coin:20,honor:-3,them:{type:"enemy",op:-40}},
          },
          {
            t: "Warn {them} in the night",
            check: {s:"stealth",s2:"ins",d:40},
            win: {
              r: "{them} slips out the stable door. The Debt-Hound looks at you a long time over breakfast.",
              fx: {them:{type:"friend",op:35},honor:2},
            },
            lose: {
              r: "The hound was watching the stable. Now he is watching you too.",
              fx: {them:{type:"friend",op:20},flag:"av_hounded"},
            },
          },
          {
            t: "Ask what the debt is",
            check: {s:"trade",s2:"persuasion",d:45},
            win: {
              r: "Thirty suns, with interest on interest. You argue it down and pay it. {them} owes you a life now.",
              fx: {coin:-18,them:{type:"friend",op:50}},
            },
            lose: {r:'"Three hundred suns." You stop asking.',fx:{}},
          },
        ],
      },
      {
        id: "av_caravanserai_fever",
        cond: (p,C)=>go(p)&&(desertish(p)||C.realm(p,"POL-32","POL-11")),
        w: .8,
        cool: 9,
        title: "The caravanserai",
        text: "A caravanserai a day out from the city: free water by the Book of Wells, a sleeping cell for 2 pence. In the next cell a traveler burns with fever and calls for his mother.",
        choices: [
          {
            t: "Nurse him",
            check: {s:"medicine",s2:"sta",d:42},
            win: {
              r: "Wet cloths, willow bark and water. On the fourth day he sits up. He is a spice merchant, and grateful.",
              fx: {skill:{medicine:4},coin:20,piety:2},
            },
            lose: {
              r: "He dies on the third night, and you take his fever home.",
              fx: {health:-15,piety:2,wil:1,cause:"a caravan fever"},
            },
          },
          {t:"Fetch the caravanserai keeper",r:"The keeper moves him to the sick cell. You move on.",fx:{}},
          {t:"Leave before you catch it",r:"You are gone before dawn. Sensible. Cold.",fx:{happy:-1}},
        ],
      },
      {
        id: "av_ruin_shelter",
        cond: (p,C)=>go(p)&&!C.town(p),
        w: .9,
        cool: 8,
        title: "Shelter in the old fort",
        text: p=>`Rain drives you into ${A.pick(["the shell of an old Solen road fort","a ruined Neck Empire road station","a roofless chapel from the old empire"])}. In the night, lantern light and voices in the cellar below.`,
        choices: [
          {
            t: "Creep down and look",
            check: {s:"stealth",s2:"ins",d:45},
            win: {
              r: "Smugglers, counting kegs of untaxed wine. You know their faces now. That could be worth a lot.",
              fx: {skill:{stealth:3},flag:"av_smugglers_known"},
            },
            lose: {
              r: "A stair crumbles. Five faces look up at you.",
              fx: {
                duel: {
                  tier: 2,
                  title: "a smuggler",
                  troop: "LI",
                  opts: {kind:"brawl",place:"a ruined cellar",lethal:!1,toYield:!0,title:"In the cellar"},
                },
              },
            },
          },
          {
            t: "Call down and ask to share the fire",
            check: {s:"persuasion",s2:"wil",d:40},
            win: {
              r: "Smugglers, wary but friendly. They feed you and offer you work.",
              fx: {newRel:{type:"friend",op:20},flag:"av_smugglers_known"},
            },
            lose: {r:"They tell you to leave. In the rain. With knives.",fx:{happy:-4,health:-3}},
          },
          {t:"Leave quietly in the rain",r:"Wet, but alive and none the wiser.",fx:{health:-2}},
        ],
      },
      {
        id: "av_pedlar_wonders",
        cond: (p,C)=>go(p),
        w: .9,
        cool: 8,
        title: "A pedlar of wonders",
        setup: (p,ctx)=>{const o=A.pick([["a unicorn horn cup that sweats near poison","the spiral tusk of a small northern whale, sold south by Hrimfell traders who keep the source quiet",400],["a stone tongue of the Black Maw, to ward off drowning","the fossil tooth of a giant shark. Pearl divers say the Maw still lives; nobody in the north believes them",8],["a griffin's claw from the Burning Waste","a bone of a long-dead beaked beast the wind strips out of the sandstone. Not a griffin. Never a griffin",30],["a phoenix feather that will never burn","a plume of a bird of paradise; the hill tribes cut the feet off the skins, so buyers think the bird never lands",20],["a horned hare's horn, for luck","a wart from a hare with a skin sickness. The Kingsmere market has sold them to rich children since 900",6]]);ctx.item=o[0],ctx.truth=o[1],ctx.price=o[2],ctx.cheap=Math.max(3,Math.round(o[2]/10))},
        text: 'A pedlar unwraps a cloth on his cart. "For you, a wonder: {item}. Only {price} suns, but I like your face."',
        choices: [
          {
            t: "Haggle hard and buy it",
            req: p=>p.coin>=10,
            check: {s:"trade",s2:"persuasion",d:40},
            win: {
              r: "You get it for {cheap} suns. It does nothing, but people stare at it.",
              fx: (p,ctx)=>{p.coin=Math.max(0,p.coin-ctx.cheap),p.happy=Math.min(100,p.happy+3)},
            },
            lose: {
              r: "He gets you to pay twice what he would have taken.",
              fx: (p,ctx)=>{p.coin=Math.max(0,p.coin-ctx.cheap*2)},
            },
          },
          {
            t: "Tell him what it really is",
            check: {s:"learning",s2:"int",d:45},
            win: {r:"It is {truth}, you tell the crowd. The pedlar packs up quickly.",fx:{int:.6,skill:{learning:2}}},
            lose: {r:"He talks faster than you, and the crowd buys.",fx:{}},
          },
          {t:"Walk on",r:"The world is full of wonders for sale.",fx:{}},
        ],
      },
      {
        id: "av_lost_child",
        cond: (p,C)=>go(p)&&!C.town(p),
        w: .7,
        cool: 10,
        title: "A child on the road",
        text: `A small child sits at a crossroads, crying, with a goat on a string. "I went after the goat and now I don't know where home is."`,
        choices: [
          {
            t: "Take the child home, however far",
            check: {s:"tracking",s2:"int",d:35},
            win: {
              r: "A day out of your way. A mother who cannot stop crying, and a supper you will remember.",
              fx: {happy:6,honor:2,newRel:{type:"friend",op:25}},
            },
            lose: {r:"Two days of wrong villages before you find the right one.",fx:{happy:2,honor:2,sta:.4}},
          },
          {
            t: "Leave the child at the next shrine",
            r: "The priest promises to send word. You hope he does.",
            fx: {honor:1},
          },
        ],
      },
      {
        id: "av_storm_hut",
        cond: (p,C)=>go(p)&&C.terr(p,"hills","mountains","plains","forest"),
        w: .9,
        cool: 8,
        title: "The shepherd's hut",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id},
        text: "Hail like pebbles. You run for a shepherd's hut and find {them} already inside, with an army sword and a guilty face. A deserter, or worse.",
        choices: [
          {
            t: "Share your bread",
            r: "You eat in silence, then talk all night. By morning you have a friend you cannot introduce to anyone.",
            fx: {them:{type:"friend",op:25},happy:2},
          },
          {
            t: "Wait until {theyHe} sleeps, then go for the bounty",
            check: {s:"stealth",s2:"ins",d:45},
            win: {
              r: "You bind {themHim} while {theyHe} sleeps. The reeve pays 15 suns for a deserter.",
              fx: {coin:15,honor:-2,them:{type:"enemy",op:-50}},
            },
            lose: {
              r: "{theyHe} wakes, and goes for the sword.",
              fx: {
                duel: {foe:"them",opts:{kind:"duel",place:"a shepherd's hut",lethal:!0,toYield:!0,title:"The deserter"}},
              },
            },
          },
          {
            t: "Leave and take your chances in the hail",
            r: "Bruised all over, but you never learn {theirHis} story.",
            fx: {health:-5,cause:"hail"},
          },
        ],
      },
      {
        id: "av_wanderjahr",
        cond: (p,C)=>C.adult(p)&&C.ageAdj(p)<24&&free(p)&&!p.ruler&&!p.mil&&!C.married(p),
        w: .8,
        once: !0,
        title: "The road calls",
        text: "You have never been further than {town}. A tinker at the well talks about the sea, about deserts, about cities with a hundred thousand people. Your feet itch.",
        choices: [
          {
            t: "Take a year on the road",
            r: "You see five realms' worth of strangers, sleep in barns, work for bread, and come home taller in every way that matters.",
            fx: {int:1,sta:1,wil:1,happy:5,skill:{survival:3,persuasion:2},coin:-10,flag:"av_traveled"},
          },
          {
            t: "Go and do not come back",
            r: "You pack a knife and a blanket. The road is home now.",
            fx: {flag:"av_traveled",wil:2,happy:3,skill:{survival:4},rel:{who:"mother",op:-15}},
          },
          {
            t: "Stay. There is work here.",
            r: "You stay. Sometimes, on summer evenings, you watch the road.",
            fx: {happy:-2,trait:"content"},
          },
        ],
      },
      {
        id: "av_steppe_horsethief",
        cond: (p,C)=>go(p)&&C.prof(p,"riding",25)&&C.realm(p,"POL-12","POL-11","POL-34","POL-15"),
        w: .8,
        cool: 9,
        title: "Horse thieves on the grass",
        text: "In the night someone cuts your horses loose from the picket line. You hear the laughter on the wind. On the steppe, horse theft is half a sport.",
        choices: [
          {
            t: "Track them at first light",
            check: {s:"tracking",s2:"riding",d:48},
            win: {
              r: "You find their camp and walk your horses out under their noses, with one of theirs for the trouble.",
              fx: {skill:{tracking:4},fame:2,gear:{mount:"horse"}},
            },
            lose: {r:"The grass hides everything. You walk home.",fx:{wil:1,happy:-5}},
          },
          {
            t: "Ride into their camp and demand them back",
            check: {s:"intimidation",s2:"wil",d:50},
            win: {
              r: "They laugh, then respect you. They give the horses back and a skin of kumis.",
              fx: {skill:{intimidation:3},fame:1},
            },
            lose: {r:"They laugh, then beat you.",fx:{health:-12,cause:"a beating"}},
          },
          {
            t: "Shrug, and steal some back from someone else",
            req: (p,C)=>crook(p)||C.race(p,"orc","halforc"),
            check: {s:"stealth",s2:"husbandry",d:45},
            win: {
              r: "The grass gives, and the grass takes. You come back with two.",
              fx: {gear:{mount:"horse"},skill:{stealth:3}},
            },
            lose: {r:"They catch you in the act. The clan-mothers fine you in horses.",fx:{coin:-30,honor:-2}},
          },
        ],
      },
      {
        id: "av_wild_lost",
        trigger: !0,
        title: "Lost in the forest",
        text: "The trees all look the same now. The sun is gone behind cloud, the path is gone behind you, and night is coming on fast.",
        choices: [
          {
            t: "Climb a tall tree and look",
            check: {s:"athletics",s2:"int",d:40},
            win: {
              r: "From the top you see smoke from a village. You are home by midnight.",
              fx: {skill:{athletics:2},happy:2},
            },
            lose: {
              r: "A branch gives. You hit the ground hard and spend the night where you fell.",
              fx: {health:-10,wound:"bad_knee",wil:1,cause:"a fall in the forest"},
            },
          },
          {
            t: "Follow water downhill",
            check: {s:"survival",s2:"tracking",d:42},
            win: {
              r: "Streams find rivers, rivers find mills. You walk out by noon the next day.",
              fx: {skill:{survival:4}},
            },
            lose: {
              r: "Three days of wet moss and raw mushrooms. A woodcutter finds you, thin and shaking.",
              fx: {health:-15,wil:2,sta:.6,cause:"hunger and cold"},
            },
          },
          {
            t: "Make a fire and wait for morning",
            check: {s:"survival",s2:"wil",d:35},
            win: {r:"A long night with the fire and your thoughts. At dawn the sun shows you the way.",fx:{wil:1.5}},
            lose: {
              r: "The wood is wet. You shiver till morning and catch a fever.",
              fx: {health:-10,wil:1,cause:"a chill"},
            },
          },
        ],
      },
      {
        id: "av_wild_ruin_dig",
        cond: (p,C)=>go(p)&&!C.town(p)&&!C.terr(p,"tundra"),
        w: 1,
        cool: 8,
        title: "Old stones",
        setup: (p,ctx)=>{ctx.ruin=ruinName(p)},
        text: "A day from {home} lie {ruin}. Villagers carry off the cut stone for byres. A boy says his grandfather found a gold coin there once, and was never right after.",
        choices: [
          {
            t: "Dig in the cellars",
            check: {s:"str",s2:"ins",d:42},
            win: {
              r: p=>`Under a fallen vault you find ${A.pick(["a clay jar of old silver, green with age","a bronze lamp and a handful of coins with a dead emperor's face","a soldier's ring and a broken gilt buckle"])}. A collector in town pays well.`,
              fx: {coin:40,happy:4,skill:{learning:1}},
            },
            lose: {
              r: "The vault comes down. You dig yourself out with a broken arm and nothing else.",
              fx: {health:-18,wound:"broken_ribs",wil:1,cause:"a collapsing ruin"},
            },
          },
          {
            t: "Study the inscriptions",
            req: (p,C)=>C.literate(p),
            check: {s:"learning",s2:"int",d:45},
            win: {
              r: "Old Solen, worn but readable: the names of a garrison, the year of a flood, a joke about a centurion. You write it all down.",
              fx: {skill:{learning:4},int:.8,lang:"Old Solen"},
            },
            lose: {r:"The letters are too worn. You go home with a headache.",fx:{skill:{learning:1}}},
          },
          {t:"Leave the dead their stones",r:"Some places are better left alone.",fx:{piety:1}},
        ],
      },
      {
        id: "av_wild_tomb",
        cond: (p,C)=>go(p)&&!C.town(p),
        w: .8,
        cool: 10,
        title: "The barrow",
        text: p=>`A grassy mound in the ${A.pick(["heather","birchwood","scrub","old pasture"])} with a stone door half fallen in. Shepherds will not graze it. Inside, the dark smells of earth and old bronze.`,
        choices: [
          {
            t: "Go in with a torch",
            check: {s:"wil",s2:"ins",d:42},
            win: {
              r: "A chieftain's bones, a bronze sword green as grass, amber beads. You take the beads and leave the sword.",
              fx: {coin:30,wil:1,piety:-2},
            },
            lose: {
              r: "The roof sighs and drops a stone on your shoulder. You run, and dream of it for months.",
              fx: {health:-10,happy:-5,cause:"a falling stone"},
            },
          },
          {
            t: "Take the sword too",
            req: (p,C)=>C.prof(p,"sword",20)||C.trait(p,"greedy"),
            r: "A bronze sword older than any kingdom. A scholar in town pays 80 suns for it, and the shepherds stop talking to you.",
            fx: {coin:80,piety:-5,honor:-1,happy:2},
          },
          {
            t: "Pour a little ale on the door and leave",
            r: "The shepherds see you do it, and nod.",
            fx: {piety:2,happy:1},
          },
        ],
      },
      {
        id: "av_wild_delve",
        cond: (p,C)=>go(p)&&C.terr(p,"mountains","hills","forest"),
        w: .8,
        cool: 12,
        title: "The sealed delve",
        text: "Behind a waterfall of ivy you find a dwarven door: smooth stone, no handle, a carved oath across the lintel. A dead delve, sealed by its own people long ago.",
        choices: [
          {
            t: "Find the hidden latch",
            req: (p,C)=>!C.race(p,"dwarf"),
            check: {s:"craft",s2:"int",d:55},
            win: {
              r: "A pressure stone under the moss. Inside: cold halls, empty forges, and in a side room, three ingots of dwarf steel nobody came back for.",
              fx: {coin:90,skill:{craft:3},flag:"av_opened_delve"},
            },
            lose: {r:"You find nothing but sore fingers.",fx:{}},
          },
          {
            t: "Read the oath",
            req: (p,C)=>C.race(p,"dwarf")||C.prof(p,"learning",35),
            r: 'It names the clan, the year and the reason: plague. "Let no hand open what grief has closed." You leave it shut.',
            fx: {piety:3,int:.5,wil:.5},
          },
          {
            t: "Tell the nearest hold where it is",
            req: (p,C)=>C.realm(p,"POL-10","POL-28","POL-29")||C.race(p,"dwarf"),
            r: "The Law-Carvers thank you formally, and write your name in a book of small debts.",
            fx: {favor:4,honor:2},
          },
          {t:"Leave it",r:"You leave it as you found it.",fx:{}},
        ],
      },
      {
        id: "av_wild_elfruin",
        cond: (p,C)=>go(p)&&C.terr(p,"forest")&&!C.race(p,"elf"),
        w: .8,
        cool: 12,
        title: "The fallen town",
        text: "Under beech and moss, the lines of walls: an elven town lost in the Old Edge Wars, fifteen hundred years before the Sun calendar. Something moves at the edge of sight. You are being watched.",
        choices: [
          {
            t: "Call out in greeting",
            check: {s:"etiquette",s2:"diplomacy",d:48},
            win: {
              r: "An elf steps out of a tree's shadow. She is amused by your manners and tells you the town's name.",
              fx: {skill:{etiquette:3},newRel:{type:"friend",op:20},int:.5},
            },
            lose: {r:"Nobody answers. An arrow thuds into a tree by your head. You leave.",fx:{happy:-3}},
          },
          {
            t: "Search the ruins anyway",
            check: {s:"stealth",s2:"ins",d:52},
            win: {
              r: "A green glass bead, a silver leaf-pin. You leave before the watchers decide.",
              fx: {coin:35,skill:{stealth:2}},
            },
            lose: {
              r: "An arrow through the calf. A clear message.",
              fx: {health:-14,wound:"arrow_wound",cause:"an elven arrow"},
            },
          },
          {t:"Back away slowly",r:"Whoever was watching lets you go.",fx:{}},
        ],
      },
      {
        id: "av_wild_stonering",
        cond: (p,C)=>go(p)&&C.terr(p,"hills","tundra","plains","forest"),
        w: .7,
        cool: 12,
        title: "The ring of stones",
        text: "A ring of standing stones older than writing. Someone has left fresh milk and a bundle of herbs at the tallest one. A grey-haired woman watches you from the far side.",
        choices: [
          {
            t: "Ask her what they are for",
            check: {s:"persuasion",s2:"faith",d:38},
            win: {
              r: '"Counting the sun," she says. "The tall one throws its shadow on the small one at midwinter. People forgot the counting and kept the milk." She shows you how.',
              fx: {int:1,skill:{learning:2}},
            },
            lose: {r:'"They are for leaving alone," she says.',fx:{}},
          },
          {
            t: "Leave an offering of your own",
            r: "A coin and a prayer. It costs little and you feel better.",
            fx: {coin:-1,piety:2,happy:2},
          },
          {
            t: "Drink the milk",
            r: "The woman curses you very creatively. Nothing happens, except you feel bad all week.",
            fx: {happy:-3,piety:-2},
          },
        ],
      },
      {
        id: "av_wild_ashlands",
        cond: (p,C)=>go(p)&&C.terr(p,"mountains","hills")&&C.realm(p,"POL-05","POL-15","POL-03","POL-13"),
        w: .8,
        cool: 10,
        title: "The buried towns",
        text: "In the Ashlands, towns buried in 13 BR lie under grey slopes. Diggers say the ruins are cursed and that the ash-grey hounds are the ghosts of the Dimming's dead. A digger offers you a share for a strong back.",
        choices: [
          {
            t: "Dig the tunnels with him",
            check: {s:"str",s2:"sta",d:45},
            win: {
              r: "A buried kitchen, pots still on the hearth. A silver cup. You split 60 suns and do not talk about the bones.",
              fx: {coin:30,str:.5,wil:1},
            },
            lose: {
              r: "The tunnel slumps. The digger pulls you out by the ankles, choking on ash.",
              fx: {health:-15,wound:"lungs",cause:"a collapsing tunnel"},
            },
          },
          {
            t: "Watch the hounds at dusk",
            check: {s:"tracking",s2:"ins",d:40},
            win: {
              r: "Not ghosts. Feral dogs, ten or twenty, grey from rolling in ash, descended from the town dogs of the buried valley. Wary of people, bold in packs at night.",
              fx: {skill:{tracking:3},int:.6},
            },
            lose: {
              r: "The pack sees you first.",
              fx: (p,ctx)=>{ctx.beast="CRE-56",A.applyFx(p,{beast:{id:"CRE-56",place:"the ash slopes",title:"The hounds"}},ctx)},
            },
          },
          {
            t: "Refuse; the dead keep their own",
            r: "The digger calls you a coward. You call him alive, for now.",
            fx: {piety:1},
          },
        ],
      },
      {
        id: "av_wild_treasure_map",
        cond: (p,C)=>go(p),
        w: .8,
        cool: 12,
        title: "A map in a boot",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id,ctx.price=A.ri(8,20)},
        text: `{them} has a map drawn on calfskin, taken from a dead man's boot. An X, a ruined tower, a river fork. "{price} suns and it's yours. I'm too old to dig."`,
        choices: [
          {
            t: "Buy it and go looking",
            req: p=>p.coin>=8,
            check: {s:"tracking",s2:"int",d:50},
            win: {
              r: "A week of searching. Under the tower floor, a soldier's hidden pay chest from some forgotten war.",
              fx: {coin:110,happy:8,fame:1,deed:"Found a buried pay chest from a map in a dead man's boot"},
            },
            lose: {r:"The tower is there. So is a hole, already dug, already empty.",fx:{coin:-12,happy:-4,wil:.5}},
          },
          {
            t: "Study the map before you pay",
            check: {s:"ins",s2:"learning",d:42},
            win: {r:"The ink is a week old. You hand it back with a smile.",fx:{int:.5}},
            lose: {r:"It looks real enough. You buy it. It is not.",fx:{coin:-10}},
          },
          {t:"No thanks",r:"{them} sells it to a boy behind you.",fx:{}},
        ],
      },
      {
        id: "av_wild_lair",
        cond: (p,C)=>go(p)&&!C.town(p)&&A.beastsNear(p).length>0,
        w: 1.1,
        cool: 7,
        title: "The lair",
        setup: (p,ctx)=>{ctx.beast=near(p)||"CRE-21",ctx.bn=bn(ctx.beast),ctx.belief=dot(cr(ctx.beast).belief),ctx.bwhere=(A.BEASTS[ctx.beast]||{}).where||"the wilds"},
        text: `Scat, scratched bark and a stink like a butcher's yard, out toward {bwhere}. The signs of {bn}. In the village they say: "{belief}"`,
        choices: [
          {
            t: "Hunt it",
            r: "You check your gear, say a prayer, and go in.",
            fx: {beast:{place:"its lair",title:"The lair"}},
          },
          {
            t: "Watch it and learn",
            check: {s:"tracking",s2:"stealth",d:45},
            win: {
              r: (p,ctx)=>`Three days hidden downwind. What you see is not the village tale. ${dot(first(cr(ctx.beast).behavior))}`,
              fx: {skill:{tracking:4,stealth:2},int:.5},
            },
            lose: {r:"It catches your scent. You run, and it lets you.",fx:{happy:-3,wil:.5}},
          },
          {
            t: "Sell the location to the lord's huntsman",
            r: "Eight suns, and a nod from a man who will take the glory.",
            fx: {coin:8},
          },
          {t:"Leave it alone",r:"It was there before you. You leave it there.",fx:{}},
        ],
      },
      {
        id: "av_wild_village_bounty",
        cond: (p,C)=>C.adult(p)&&free(p)&&!C.town(p)&&A.beastsNear(p).length>0&&(wild(p)||C.gear(p,"weapon")),
        w: 1,
        cool: 8,
        title: "Bounty on a beast",
        setup: (p,ctx)=>{ctx.beast=near(p,260)||"CRE-21",ctx.bn=bn(ctx.beast),ctx.bounty=A.ri(20,60),ctx.belief=dot(cr(ctx.beast).belief)},
        text: 'Something has been taking sheep. The headman says it is {bn}, and the village will pay {bounty} suns for its hide. The old women say other things: "{belief}"',
        choices: [
          {
            t: "Take the bounty and hunt it",
            r: "You go out at dusk to where the last sheep died.",
            fx: (p,ctx)=>{p.flags.av_bounty_beast=ctx.bounty,A.applyFx(p,{beast:{place:"the sheepfold",title:"The bounty"}},ctx)},
          },
          {
            t: "Track it first and see what it really is",
            check: {s:"tracking",s2:"survival",d:45},
            win: {
              r: p=>A.pick(["The tracks are wolf, ordinary wolf, and the shepherd boy has been selling sheep on the side. You tell the headman both things. He pays you half.","It is what they said it was. But now you know its path, and you set a pit where it will walk. It takes the beast in a night."]),
              fx: {coin:20,skill:{tracking:4},fame:1},
            },
            lose: {r:"The trail goes cold in the rocks.",fx:{skill:{tracking:1}}},
          },
          {t:"Turn it down",r:"You have heard what happens to people who hunt for village bounties.",fx:{}},
        ],
      },
      {
        id: "av_wild_hermit",
        cond: (p,C)=>go(p)&&C.terr(p,"forest","hills","mountains","marsh"),
        w: .9,
        cool: 12,
        title: "The hermit",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"mentor").id,ctx.what=A.pick(["a knight who walked away from a war","a healer the village drove out","a monk who lost faith and found it again","a woman who will not say what she ran from"])},
        text: 'In a hut of turf and old spars lives {them}, {what}. Goats, beans, a shelf of herbs and a sword wrapped in oilcloth. "Sit, if you want. Talk, if you must."',
        choices: [
          {
            t: "Stay a season and learn the woods",
            r: "Which mushrooms kill. How to snare a hare. How to sit still for an hour. You leave quieter.",
            fx: {skill:{survival:5,medicine:2},wil:1.5,them:{type:"mentor",op:30}},
          },
          {
            t: "Ask about the sword",
            check: {s:"ins",s2:"wil",d:45},
            win: {
              r: "A long silence. Then lessons, every morning, in a clearing: old forms from an older war.",
              fx: {skill:{sword:5},ins:.8,them:{type:"mentor",op:25}},
            },
            lose: {r:'"That is mine to carry." You do not ask again.',fx:{}},
          },
          {t:"Leave {themHim} in peace",r:"Some people walk into the woods for good reasons.",fx:{}},
        ],
      },
      {
        id: "av_wild_poachers",
        cond: (p,C)=>go(p)&&C.terr(p,"forest","hills","marsh","plains")&&!C.noble(p),
        w: 1,
        cool: 7,
        title: "In the lord's wood",
        text: "At first light you come on three men gutting a stag in the lord's chase. Poaching the royal forests means a hand, or worse. They look at you. You look at them.",
        choices: [
          {
            t: "Help them carry it out for a share",
            check: {s:"stealth",s2:"survival",d:42},
            win: {
              r: "Venison all winter, and three friends who owe you their hands.",
              fx: {coin:8,happy:4,newRel:{type:"friend",op:20},flag:"av_poacher"},
            },
            lose: {r:"The verderer's men catch you with a haunch on your back.",fx:{punish:"theft",honor:-2}},
          },
          {
            t: "Report them to the verderer",
            r: "A reward of 5 suns. The village knows who told. Your fence is broken the next week.",
            fx: {coin:5,favor:2,happy:-3,newRel:{type:"enemy",op:-30}},
          },
          {
            t: "Walk past and see nothing",
            r: "One of them nods. Later, a joint of venison turns up on your doorstep.",
            fx: {happy:2},
          },
        ],
      },
      {
        id: "av_wild_wolfwinter",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.terr(p,"forest","tundra","hills"),
        w: 1,
        cool: 8,
        title: "The hard winter",
        setup: (p,ctx)=>{ctx.beast="CRE-21"},
        text: "The worst winter in twenty years. The deer have starved, and the wolves have come down to the farms: big, broad-skulled northern wolves, hunting in a pack of eight. The village men meet in the alehouse to decide what to do.",
        choices: [
          {
            t: "Lead the hunt to the den",
            check: {s:"command",s2:"tracking",d:48},
            win: {
              r: "You take the beaters up the ridge and drive the pack into the nets. Eight pelts on the church door.",
              fx: {fame:3,skill:{command:3,tracking:3},coin:15,deed:"Led the wolf hunt in the hard winter"},
            },
            lose: {
              r: "The pack splits and doubles back. One wolf finds you alone.",
              fx: {beast:{id:"CRE-21",place:"the snow-filled ravine",mod:.8,title:"Wolves in the snow"}},
            },
          },
          {
            t: "Set poison and pits",
            check: {s:"survival",s2:"int",d:42},
            win: {
              r: "Pits by the fold, poisoned carcasses on the ridge. The killing stops by Midwinter.",
              fx: {skill:{survival:4},fame:1},
            },
            lose: {
              r: "A neighbor's dog takes the poison. A neighbor's cow breaks a leg in a pit.",
              fx: {coin:-15,happy:-4},
            },
          },
          {
            t: "Bring the beasts into the house and wait",
            r: "Two months with the goats in the kitchen. You lose a cow, and keep your skin.",
            fx: {coin:-12,wil:1,happy:-3},
          },
        ],
      },
      {
        id: "av_wild_trapline",
        cond: (p,C)=>C.adult(p)&&free(p)&&(J(p,"hunter")||C.famKind(p,"hunt")),
        w: 1.2,
        cool: 6,
        title: "The trapline",
        text: "Something is robbing your traps: snares sprung, marten taken, bloody fur left behind. Furs are your living, and this costs you a sun a day.",
        choices: [
          {
            t: "Sit up with your bow over the last trap",
            req: (p,C)=>C.gear(p,"ranged"),
            check: {s:"bow",s2:"stealth",d:45},
            win: {
              r: p=>`${A.pick(["A wolverine, all teeth and fury.","A fat old fox.","Two boys from the village, with a sack."])} You deal with it.`,
              fx: {skill:{bow:3,stealth:2},coin:10,perf:5},
            },
            lose: {r:"You fall asleep. In the morning another trap is empty.",fx:{coin:-5}},
          },
          {
            t: "Read the sign and move your line",
            check: {s:"tracking",s2:"survival",d:40},
            win: {r:"You move the line two valleys over. Better furs, too.",fx:{skill:{tracking:3},coin:15,perf:6}},
            lose: {r:"The new valley is poorer. A lean year.",fx:{coin:-10}},
          },
          {t:"Shrug and accept the losses",r:"The woods take a share. They always do.",fx:{coin:-8}},
        ],
      },
      {
        id: "av_wild_whitewyrm",
        cond: (p,C)=>go(p)&&C.terr(p,"mountains","hills")&&(C.race(p,"dwarf")||C.job(p,"miner")||wild(p)),
        w: .8,
        cool: 12,
        title: "The dragon's larva",
        setup: (p,ctx)=>{ctx.beast="CRE-26"},
        text: "A flooded cave, black and still. Something pale moves under the water, as long as a man and then some. Dwarves say it is a dragon's larva and must never be touched.",
        choices: [
          {
            t: "Lie still and watch",
            check: {s:"wil",s2:"ins",d:38},
            win: {
              r: "Blind, white, with feathery gills and tiny eyes under the skin. A salamander, a giant one, older than your grandfather. It tastes the water and drifts away.",
              fx: {int:.8,wil:1,skill:{survival:2}},
            },
            lose: {
              r: "You shift your weight. Stone rattles into the pool. It strikes at the sound.",
              fx: {beast:{id:"CRE-26",place:"a flooded cave",title:"The white wyrm"}},
            },
          },
          {
            t: "Spear it for the alchemists' price",
            req: (p,C)=>C.gear(p,"weapon"),
            r: "You wade in with your weapon raised.",
            fx: {beast:{id:"CRE-26",place:"a flooded cave",title:"The white wyrm"}},
          },
          {t:"Back out quietly",r:"Whatever it is, it was here first.",fx:{}},
        ],
      },
      {
        id: "av_wild_greystag",
        cond: (p,C)=>go(p)&&C.terr(p,"forest")&&(C.realm(p,"POL-06","POL-07","POL-01","POL-05")||C.race(p,"elf","halfelf")),
        w: .7,
        cool: 15,
        title: "The Grey Stag",
        setup: (p,ctx)=>{ctx.beast="CRE-19"},
        text: 'In a glade deep in the old forest stands a deer taller than a horse, with antlers wider than a cart. Humans say the giant deer died out long ago; their antlers sell as "giant bones". It lifts its head and looks at you.',
        choices: [
          {
            t: "Hunt it",
            r: "You nock or raise your weapon. It lowers its antlers.",
            fx: {beast:{id:"CRE-19",place:"a glade in the old forest",title:"The Grey Stag"},honor:-2},
          },
          {
            t: "Watch until it walks away",
            r: "It grazes, unhurried, then melts into the trees. You will tell this story all your life, and few will believe you.",
            fx: {happy:6,wil:1,piety:2,deed:"Saw the Grey Stag in the old forest"},
          },
          {
            t: "Mark the glade and sell it to a lord",
            check: {s:"trade",s2:"intrigue",d:45},
            win: {r:"A count pays 40 suns for the secret. You try not to think about it.",fx:{coin:40,honor:-3}},
            lose: {r:"Nobody believes you.",fx:{happy:-2}},
          },
        ],
      },
      {
        id: "av_wild_aurochs",
        cond: (p,C)=>go(p)&&C.terr(p,"forest","plains")&&A.beastsNear(p).includes("CRE-20"),
        w: .7,
        cool: 12,
        title: "Black bulls in the wood",
        setup: (p,ctx)=>{ctx.beast="CRE-20"},
        text: "A herd of wild cattle in an oak glade: black bulls a head taller than any ox, forward-curving horns, red-brown cows. Humans believe the last aurochs were killed around 700. The bull has seen you.",
        choices: [
          {
            t: "Stand your ground",
            check: {s:"wil",s2:"ins",d:48},
            win: {r:"The bull paws, snorts, and decides you are not worth it.",fx:{wil:1.5,fame:1}},
            lose: {r:"It charges.",fx:{beast:{id:"CRE-20",place:"an oak glade",title:"The aurochs"}}},
          },
          {
            t: "Climb the nearest oak",
            check: {s:"athletics",s2:"spd",d:42},
            win: {
              r: "You spend an afternoon in a tree, watching the herd. It is wonderful.",
              fx: {skill:{athletics:2},happy:4},
            },
            lose: {
              r: "You are halfway up when the horn finds your leg.",
              fx: {health:-20,wound:"limp",cause:"a bull's horn"},
            },
          },
          {
            t: "Remember the place for a pit trap",
            req: (p,C)=>wild(p),
            r: "Bulls can be trapped in pits. You mark the trail and plan.",
            fx: {skill:{tracking:3},flag:"av_aurochs_trail"},
          },
        ],
      },
      {
        id: "av_wild_ashdragon",
        cond: (p,C)=>go(p)&&C.terr(p,"mountains")&&A.beastsNear(p).includes("CRE-01"),
        w: .7,
        cool: 12,
        title: "The sky-king",
        setup: (p,ctx)=>{ctx.beast="CRE-01"},
        text: "A shadow with a wingspan of twelve metres crosses the valley. Above the high pasture a Great Ash Dragon soars on the updraft. Below it, a herd of yak begins to run toward the cliff.",
        choices: [
          {
            t: "Hide under the rocks and watch",
            check: {s:"stealth",s2:"wil",d:40},
            win: {
              r: "A cough of flame, three metres long and gone in a breath: not the minutes the lowland songs claim. The yak stampede over the edge, and it drops onto them. No hoard. Just meat.",
              fx: {int:1,wil:1,deed:"Watched a Great Ash Dragon hunt"},
            },
            lose: {
              r: "It sees you. Dragons do not cook their prey, but they do drive off rivals.",
              fx: {health:-18,wound:"burn",wil:2,cause:"dragon fire"},
            },
          },
          {
            t: "Put a bolt through its wing as it lands",
            req: (p,C)=>C.gear(p,"ranged")&&(C.prof(p,"xbow",40)||C.prof(p,"bow",45)),
            check: {s:"xbow",s2:"bow",d:58},
            win: {
              r: "The thin membrane tears. Grounded, it cannot take off fast from flat ground. Now it is just a very large, very angry animal.",
              fx: {beast:{id:"CRE-01",place:"the high pasture",mod:.6,title:"The grounded dragon"}},
            },
            lose: {
              r: "Your shot goes wide. It goes up on the updraft, and comes back down on you.",
              fx: {beast:{id:"CRE-01",place:"the high pasture",title:"The dragon"}},
            },
          },
          {
            t: "Run for the valley",
            check: {s:"spd",s2:"athletics",d:35},
            win: {r:"You run, and it ignores you. It has a herd to eat.",fx:{spd:.4}},
            lose: {r:"You fall on the scree and roll a long way.",fx:{health:-12,wound:"bad_knee",cause:"a fall"}},
          },
        ],
      },
      {
        id: "av_wild_redwidow",
        cond: (p,C)=>go(p)&&(C.cult(p,"CUL-18")||C.realm(p,"POL-31","POL-28")),
        w: .6,
        cool: 15,
        title: "The Red Widow's country",
        setup: (p,ctx)=>{ctx.beast="CRE-01"},
        text: 'Gold lies in the streams of the upper Tirana, unworked since 1043, because the Red Widow burned the last camps. She takes a hundred and fifty cattle a year. A Marchfolk prospector wants a partner. "She sleeps at noon. Probably."',
        choices: [
          {
            t: "Go panning with him",
            check: {s:"stealth",s2:"survival",d:55},
            win: {
              r: "Four days in the cold water with one eye on the sky. Enough gold dust to fill a thimble twice.",
              fx: {coin:120,wil:1.5,fame:2,deed:"Panned gold on the upper Tirana under the Red Widow's sky"},
            },
            lose: {
              r: "A shadow. Flame. You run and leave everything.",
              fx: {health:-22,wound:"burn",wil:2,coin:-10,cause:"the Red Widow"},
            },
          },
          {
            t: "Ask what he knows about her",
            r: '"She is real. She is old. She is not a punishment for the old empire, whatever the priests say. She is a beast that knows where the cattle are."',
            fx: {int:.5},
          },
          {t:"Decline",r:"Gold does not spend well when you are ash.",fx:{}},
        ],
      },
      {
        id: "av_wild_wyvern_eggs",
        cond: (p,C)=>go(p)&&(C.realm(p,"POL-17","POL-19","POL-24")||A.beastsNear(p).includes("CRE-03"))&&C.terr(p,"mountains","hills","desert"),
        w: .8,
        cool: 10,
        title: "Wyvern eggs",
        setup: (p,ctx)=>{ctx.beast="CRE-03"},
        text: 'A herder will pay 50 suns for a Sunwall wyvern egg: "It cures blindness. My mother cannot see." The nest is on a ledge above a gorge. Qadiri children are told wyverns breathe fire.',
        choices: [
          {
            t: "Climb for the egg",
            check: {s:"athletics",s2:"stealth",d:52},
            win: {
              r: "You get the egg and get down before the mother returns. The herder weeps and pays.",
              fx: {coin:50,skill:{athletics:4}},
            },
            lose: {
              r: "She comes back. Not fire: a jet of scalding spray, like a beetle's.",
              fx: {beast:{id:"CRE-03",place:"a cliff ledge",title:"The wyvern"}},
            },
          },
          {
            t: "Tell him the eggs cure nothing",
            check: {s:"persuasion",s2:"medicine",d:45},
            win: {
              r: "He listens. You send him to a physician instead; a cataract needle, not an egg.",
              fx: {honor:2,skill:{medicine:2}},
            },
            lose: {r:"He finds someone braver and stupider than you.",fx:{}},
          },
          {
            t: "Sell him a chicken egg painted brown",
            req: (p,C)=>crook(p)||C.trait(p,"deceitful"),
            r: "Fifty suns. His mother stays blind. You sleep fine, mostly.",
            fx: {coin:50,honor:-5,skill:{deception:3}},
          },
        ],
      },
      {
        id: "av_wild_ford_crocs",
        cond: (p,C)=>go(p)&&(C.realm(p,"POL-18","POL-20","POL-22")||A.beastsNear(p).includes("CRE-44")),
        w: .9,
        cool: 9,
        title: "The ford of the Monuti",
        setup: (p,ctx)=>{ctx.beast="CRE-44"},
        text: "Cattle must cross the ford. The water is brown and slow, and at the edge a log that is not a log has been lying very still. The Tamari say crocodiles are the Flood Mother's guards and must not be killed in the flood.",
        choices: [
          {
            t: "Drive the herd across fast and loud",
            check: {s:"husbandry",s2:"command",d:45},
            win: {r:"Noise, splash, every beast across. The log never moves.",fx:{skill:{husbandry:3}}},
            lose: {r:"The last calf is taken in a roll and gone.",fx:{coin:-20,happy:-4}},
          },
          {
            t: "Bind its snout",
            req: (p,C)=>C.prof(p,"survival",40)||C.prof(p,"unarmed",40),
            check: {s:"unarmed",s2:"survival",d:55},
            win: {
              r: "A crocodile cannot open its jaws against pressure. You land on its back and loop the rope. Bound, it is harmless. The herders sing about it.",
              fx: {fame:3,str:.6,deed:"Bound a great crocodile's jaws at the ford"},
            },
            lose: {r:"It rolls.",fx:{beast:{id:"CRE-44",place:"the reed-bank",title:"The crocodile"}}},
          },
          {
            t: "Wait for the herders who know the ford",
            r: "A day lost, but they know the shallows. Nobody is taken.",
            fx: {coin:-3},
          },
        ],
      },
      {
        id: "av_wild_riverhorse",
        cond: (p,C)=>go(p)&&(C.realm(p,"POL-18","POL-20","POL-22")||A.beastsNear(p).includes("CRE-45"))&&!C.terr(p,"desert"),
        w: .8,
        cool: 10,
        title: "The river horse",
        setup: (p,ctx)=>{ctx.beast="CRE-45"},
        text: "Your boat drifts too close to a pool where the river horses rest. A bull opens his mouth, showing tusks as long as your forearm. River horses kill more people on the river than crocodiles.",
        choices: [
          {
            t: "Pole hard for the bank",
            check: {s:"sea",s2:"str",d:42},
            win: {r:"You reach the reeds as he surfaces where you were.",fx:{skill:{sea:3}}},
            lose: {
              r: "He overturns the boat like a toy.",
              fx: {health:-20,coinPct:-.2,cause:"a river horse",wound:"broken_ribs"},
            },
          },
          {
            t: "Stay still and let the current carry you",
            check: {s:"wil",s2:"ins",d:45},
            win: {r:"He watches you drift past. Slowly, slowly, out of his water.",fx:{wil:1.5}},
            lose: {
              r: "He decides you are a challenge.",
              fx: {beast:{id:"CRE-45",place:"the river shallows",title:"The river horse"}},
            },
          },
        ],
      },
      {
        id: "av_wild_maneater",
        cond: (p,C)=>C.adult(p)&&free(p)&&(C.realm(p,"POL-30")||A.beastsNear(p).includes("CRE-49")),
        w: .9,
        cool: 10,
        title: "The man-eater",
        setup: (p,ctx)=>{ctx.beast="CRE-49",ctx.n=A.ri(4,11)},
        text: "A tiger has taken {n} people from the villages along the forest edge. The Ranpuri say a man-eater carries the soul of a murderer. The headman is raising beaters, and asks for anyone who can hold a spear.",
        choices: [
          {
            t: "Stand with the spears at the end of the beat",
            r: "The beaters drum. The grass parts. It comes straight for you.",
            fx: {beast:{id:"CRE-49",place:"the end of the beat",mod:.9,title:"The man-eater"}},
          },
          {
            t: "Sit up over the last kill with a bow",
            req: (p,C)=>C.gear(p,"ranged"),
            check: {s:"bow",s2:"wil",d:55},
            win: {
              r: "It returns at dusk, as they do. One arrow behind the shoulder. In the morning they find it: old, with broken teeth. Too slow for deer. That is why it took people.",
              fx: {fame:4,skill:{bow:4},coin:30,deed:"Killed the man-eater of the forest edge"},
            },
            lose: {
              r: "It comes from behind the platform.",
              fx: {beast:{id:"CRE-49",place:"the forest edge at dusk",title:"The man-eater"}},
            },
          },
          {
            t: "Help the families move out of the forest edge",
            r: "Not glorious. Nobody else is taken that season.",
            fx: {honor:2,piety:1,sta:.4},
          },
        ],
      },
      {
        id: "av_wild_forestmen",
        cond: (p,C)=>go(p)&&(C.realm(p,"POL-21")||A.beastsNear(p).includes("CRE-55")),
        w: .8,
        cool: 12,
        title: "The Forest Men",
        setup: (p,ctx)=>{ctx.beast="CRE-55"},
        text: "A family of great apes in a clearing: a silver-backed male, mothers, a small one riding a back. The Keshi say they are people who fled into the forest to avoid work. A trader from Amberport will pay 200 suns for a live young one.",
        choices: [
          {
            t: "Watch them and leave",
            r: "They eat leaves, groom, nap. The big male beats his chest once at you and then ignores you. You will not forget his face.",
            fx: {happy:4,wil:.5},
          },
          {
            t: "Try for the young one",
            check: {s:"stealth",s2:"spd",d:58},
            win: {
              r: "You get it. The mother screams all night from the treeline. You get your 200 suns.",
              fx: {coin:200,honor:-5,happy:-6,trait:"cruel"},
            },
            lose: {r:"The male charges.",fx:{beast:{id:"CRE-55",place:"a forest clearing",title:"The silverback"}}},
          },
        ],
      },
      {
        id: "av_wild_rocegg",
        cond: (p,C)=>go(p)&&C.coast(p)&&(salt(p)||C.realm(p,"POL-32","POL-21")),
        w: .6,
        cool: 15,
        title: "The roc's egg",
        setup: (p,ctx)=>{ctx.beast="CRE-53"},
        text: "Your ship waters at the Isle of Pearls. Sailors say the roc carries off elephants and lays eggs as big as houses. Inland, you find a nest on the forest floor with an egg thirty centimetres long, and a bird three metres tall that cannot fly.",
        choices: [
          {
            t: "Take the egg",
            check: {s:"spd",s2:"stealth",d:40},
            win: {
              r: 'An omelette for twenty sailors, and a shell that sells in port for 25 suns as a "roc egg, only a small one".',
              fx: {coin:25,happy:3},
            },
            lose: {
              r: "The bird kicks like a mule with a grudge.",
              fx: {beast:{id:"CRE-53",place:"the forest floor",title:"The roc"}},
            },
          },
          {
            t: "Leave it, and laugh at the sailors' tales",
            r: "Harmless. Flightless. Elephants indeed.",
            fx: {int:.5,happy:2},
          },
        ],
      },
      {
        id: "av_wild_mammoth_ivory",
        cond: (p,C)=>go(p)&&(C.terr(p,"tundra")||C.realm(p,"POL-09","POL-23","POL-25")),
        w: .8,
        cool: 12,
        title: "Dragon-kin in the ice",
        text: 'The spring melt has opened a riverbank, and out of the frozen mud comes a hairy shoulder, then a curled tusk longer than you are tall. Southerners call these "dragon-kin". Their ivory sells for good money.',
        choices: [
          {
            t: "Hack out the tusks",
            check: {s:"str",s2:"sta",d:42},
            win: {r:"Two days of chopping frozen mud. The tusks go south for 120 suns.",fx:{coin:120,str:.6}},
            lose: {
              r: "The bank slumps and buries the beast again, nearly with you.",
              fx: {health:-12,cause:"a collapsing riverbank"},
            },
          },
          {
            t: "Study it",
            r: "A mammoth, small and shaggy, like the herds the giants of Frostholm keep alive today. Not dragon-kin at all.",
            fx: {int:.8,skill:{learning:2}},
          },
          {
            t: "Tell the giants",
            req: (p,C)=>C.race(p,"giant")||C.realm(p,"POL-09","POL-23"),
            r: "The hall-giants come and take it, carefully, to the cold-hall. They give you salt and a nod.",
            fx: {favor:3,honor:1},
          },
        ],
      },
      {
        id: "av_wild_woollyrhino",
        cond: (p,C)=>go(p)&&C.terr(p,"steppe","tundra")&&A.beastsNear(p).includes("CRE-34"),
        w: .8,
        cool: 12,
        title: "The horned wool-beast",
        setup: (p,ctx)=>{ctx.beast="CRE-34"},
        text: "Something shaggy and enormous sweeps the snow off the grass with a horn a metre long. Westerners say the horned wool-beast died out long ago. The Tusk Clans do not, and they hunt it with pits.",
        choices: [
          {
            t: "Dig a pit on its path",
            check: {s:"survival",s2:"str",d:48},
            win: {
              r: "It has poor eyes and a bad temper. It walks into your pit. Meat, hide and a horn worth a horse.",
              fx: {coin:60,fame:2,skill:{survival:4}},
            },
            lose: {
              r: "It finds you before it finds the pit.",
              fx: {beast:{id:"CRE-34",place:"the steppe edge",title:"The woolly rhino"}},
            },
          },
          {t:"Keep well away",r:"Wise. Very wise.",fx:{}},
        ],
      },
      {
        id: "av_wild_falcons",
        cond: (p,C)=>go(p)&&(C.terr(p,"tundra","mountains")||C.realm(p,"POL-25","POL-23","POL-09")),
        w: .8,
        cool: 9,
        title: "Falcon chicks",
        text: "A trained hunting falcon sells in the south for 150 suns. On a sea cliff, a falcon pair has a nest with three chicks. The hunters from the summer camps say the ledge has killed two men.",
        choices: [
          {
            t: "Climb down on a rope",
            check: {s:"athletics",s2:"wil",d:52},
            win: {
              r: "You come up with two chicks in your shirt and your heart in your mouth. A falconer pays 60 suns for them untrained.",
              fx: {coin:60,skill:{athletics:4},wil:1},
            },
            lose: {
              r: "The rope frays on the edge. You fall the last few metres onto the ledge and break your ankle.",
              fx: {health:-20,wound:"limp",wil:2,cause:"a fall from a sea cliff"},
            },
          },
          {
            t: "Train one yourself",
            req: (p,C)=>C.prof(p,"husbandry",30)||wild(p),
            check: {s:"husbandry",s2:"wil",d:50},
            win: {
              r: "A year of patience and gloves. Your falcon comes to your fist. A lord offers you 150 suns; you are not sure you can sell her.",
              fx: {coin:150,skill:{husbandry:6},happy:4},
            },
            lose: {r:"She flies off one day and does not come back.",fx:{happy:-4,wil:1}},
          },
          {t:"Leave them",r:"The parents scream at you all the way down the path.",fx:{}},
        ],
      },
      {
        id: "av_wild_deepweaver",
        cond: (p,C)=>go(p)&&C.terr(p,"mountains","hills")&&(C.job(p,"miner")||C.race(p,"dwarf")||A.chance(.5)),
        w: .7,
        cool: 10,
        title: "The deepweaver",
        text: "Miners say the deepweaver spiders in the old galleries are the size of dogs. You put your hand on a ledge in the dark and feel something move across it.",
        choices: [
          {
            t: "Keep perfectly still",
            check: {s:"wil",s2:"ins",d:38},
            win: {
              r: "It walks off your hand. In the lamplight: a spider the size of your palm. Big, ugly, not a dog.",
              fx: {wil:1,int:.4},
            },
            lose: {
              r: "It bites. Pain like a hot nail, then fever for a week. Rarely fatal. You are glad of rarely.",
              fx: {health:-12,wound:"bite",cause:"a deepweaver bite"},
            },
          },
          {
            t: "Snatch your hand back",
            r: "It bites anyway.",
            fx: {health:-10,wound:"bite",cause:"a deepweaver bite"},
          },
        ],
      },
      {
        id: "av_wild_bog",
        cond: (p,C)=>go(p)&&C.terr(p,"marsh"),
        w: 1,
        cool: 8,
        title: "The soft ground",
        text: "One step off the path and the ground gives. You are in the bog to your thighs, and every movement takes you deeper. Dusk is coming, and the wisplights with it.",
        choices: [
          {
            t: "Lie flat and spread your weight",
            check: {s:"survival",s2:"wil",d:42},
            win: {
              r: "Slowly, slowly, you swim out of the mud on your belly. You lie on the path laughing like a fool.",
              fx: {skill:{survival:3},wil:1.5},
            },
            lose: {
              r: "You panic, then stop panicking. A peat-cutter hauls you out with a pole, one boot short.",
              fx: {health:-8,wil:1,coin:-2},
            },
          },
          {
            t: "Shout for help",
            r: "A peat-cutter comes with a pole. He charges you 2 suns and a lecture.",
            fx: {coin:-2},
          },
        ],
      },
      {
        id: "av_wild_charcoal",
        cond: (p,C)=>go(p)&&C.terr(p,"forest","hills"),
        w: .8,
        cool: 9,
        title: "The charcoal burners",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id},
        text: `Smoke rises from turf mounds in a clearing: charcoal burners, black from hair to heel, who live in the woods all summer. Their leader, {them}, says one of them is an outlaw with a price on his head. "Which one? We don't ask in the wood."`,
        choices: [
          {
            t: "Work a season with them",
            r: "Hard, hot, dirty work. You are paid in coin and in friends who know every path in the forest.",
            fx: {coin:12,sta:1,them:{type:"friend",op:25},skill:{survival:2}},
          },
          {
            t: "Find out who the outlaw is",
            check: {s:"ins",s2:"intrigue",d:45},
            win: {
              r: "You work it out from his hands: a soldier's calluses. You keep it to yourself; it is useful to know.",
              fx: {skill:{intrigue:3},flag:"av_outlaw_known"},
            },
            lose: {
              r: "You ask too many questions. You wake with a knife at your throat and a warning.",
              fx: {happy:-4,them:{op:-15}},
            },
          },
          {t:"Move on",r:"You walk on, smelling of smoke for a week.",fx:{}},
        ],
      },
      {
        id: "av_wild_greenwood",
        cond: (p,C)=>go(p)&&C.terr(p,"forest","hills","marsh")&&(C.poor(p)||crook(p)||C.flag(p,"outlaw")),
        w: .9,
        cool: 10,
        title: "The greenwood band",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id},
        text: `Bowmen step out of the bracken. Their leader, {them}, is lean and laughing. "Runaway serfs, a disgraced squire, a priest who drank the altar wine. We rob the lord's rents. There's room for one more."`,
        choices: [
          {
            t: "Join the band",
            r: "You learn to live in the wood, to shoot from cover and to vanish. You are an outlaw now, and freer than you have ever been.",
            fx: {flag:"av_crew",skill:{stealth:4,bow:3,survival:3},them:{type:"friend",op:30},honor:-2,happy:4},
          },
          {
            t: "Ask them to rob your own lord's steward",
            req: (p,C)=>C.poor(p),
            r: "They do. You get a share of your own rent back. It is the sweetest money you ever spent.",
            fx: {coin:15,happy:5,them:{type:"friend",op:15}},
          },
          {t:"Thank them and keep walking",r:'"Next time, then." They melt back into the green.',fx:{}},
        ],
      },
      {
        id: "av_wild_hunt_contract",
        cond: (p,C)=>C.adult(p)&&free(p)&&(J(p,"hunter")||C.famKind(p,"hunt"))&&A.beastsNear(p).length>0,
        w: 1.1,
        cool: 7,
        title: "The lord's commission",
        setup: (p,ctx)=>{ctx.beast=near(p)||"CRE-25",ctx.bn=bn(ctx.beast),ctx.pay=30+((A.BEASTS[ctx.beast]||{}).fame||5)*4},
        text: `The lord's steward wants {bn} cleared from the valley before the lord's guests arrive. {pay} suns, half now. "And the hide for the hall."`,
        choices: [
          {
            t: "Take it on, and do it properly",
            check: {s:"tracking",s2:"survival",d:48},
            win: {
              r: "You track it for days, learn its path and choose the ground. When it comes, you are ready.",
              fx: (p,ctx)=>{p.coin+=Math.round(ctx.pay/2),A.applyFx(p,{beast:{place:"ground of your choosing",mod:.75,title:"The commission"}},ctx)},
            },
            lose: {
              r: "It finds you while you are still tracking it.",
              fx: (p,ctx)=>{p.coin+=Math.round(ctx.pay/2),A.applyFx(p,{beast:{place:(A.BEASTS[ctx.beast]||{}).where||"the wilds",title:"The commission"}},ctx)},
            },
          },
          {
            t: "Take the half and stall",
            check: {s:"deception",s2:"persuasion",d:45},
            win: {
              r: 'You report "fresh sign" for weeks. The guests leave without seeing it. You keep the half.',
              fx: (p,ctx)=>{p.coin+=Math.round(ctx.pay/2),p.honor=Math.max(0,p.honor-3)},
            },
            lose: {r:"The steward sees through it. Your name is mud among the gentry.",fx:{fame:-2,perf:-10}},
          },
          {t:"Refuse; it is not worth it",r:"The steward finds someone younger.",fx:{perf:-3}},
        ],
      },
      {
        id: "av_wild_guide",
        cond: (p,C)=>C.adult(p)&&free(p)&&wild(p)&&!C.town(p),
        w: 1,
        cool: 7,
        title: "A guide wanted",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id},
        text: '{them}, a merchant with soft hands and four mules, needs a guide through the wild country to {town}. "Two suns a day and keep. I am told you know the paths."',
        choices: [
          {
            t: "Guide {themHim} the safe way",
            check: {s:"survival",s2:"tracking",d:40},
            win: {
              r: "Ten days without a mule lost. {them} pays in full and recommends you to friends.",
              fx: {coin:20,skill:{survival:3},them:{type:"friend",op:25},fame:1},
            },
            lose: {r:"A mule goes over a ledge. {them} docks your pay.",fx:{coin:10}},
          },
          {
            t: "Take the fast way through bandit country",
            check: {s:"stealth",s2:"tracking",d:50},
            win: {
              r: "Four days faster. {them} pays a bonus and swears you are a genius.",
              fx: {coin:30,skill:{stealth:3}},
            },
            lose: {
              r: "The bandits find you.",
              fx: {
                coin: 10,
                duel: {
                  tier: 2,
                  title: "a forest bandit",
                  troop: "LI",
                  opts: {kind:"duel",place:"a forest path",lethal:!0,toYield:!0,title:"The short way"},
                },
              },
            },
          },
          {t:"Turn the job down",r:"You have other things to do.",fx:{}},
        ],
      },
      {
        id: "av_wild_settle",
        cond: (p,C)=>go(p)&&C.ageAdj(p)<40&&!C.noble(p)&&C.realm(p,"POL-31","POL-25","POL-28","POL-14","POL-12","POL-30","POL-26","POL-18"),
        w: .5,
        once: !0,
        title: "The free land",
        text: 'In the Free Marches, nobody rules. Nine realms claim it and none holds it. Families grow rye in the valleys and pray to the Marchland Saints, and no lord takes a tithe. A cousin writes: "Come. There is land for anyone who will clear it."',
        choices: [
          {
            t: "Go, and clear your own land",
            check: {s:"sta",s2:"survival",d:45},
            win: {
              r: "Two years of felling oaks and burning stumps. A cabin, a field, a fence, and no lord. It is yours.",
              fx: {asset:"cottage",wil:2,sta:1,happy:8,deed:"Cleared free land in the Marches"},
            },
            lose: {
              r: "Bandits burn your first cabin. You build a second. It is smaller, but it is yours.",
              fx: {asset:"hovel",wil:3,happy:2},
            },
          },
          {t:"Stay where you are known",r:"Better a lord you know than bandits you don't.",fx:{}},
        ],
      },
      {
        id: "av_crime_recruit",
        cond: (p,C)=>go(p)&&!J(p,"thief")&&!p.flags.av_crew&&(C.poor(p)||C.prof(p,"stealth",35)||C.famKind(p,"outlaw"))&&(C.town(p)||C.coast(p)),
        w: 1,
        cool: 10,
        title: "An offer in the alley",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id,ctx.crew=A.pick(["the Gutter Cats","the Lantern Street crew","the Saltpans boys","Old Mother Fen's lot","the Dock Rats"])},
        text: `{them} runs a crew called {crew}: a dozen thieves who own one market and one stretch of dock. "You've got quick hands and nothing to lose. Work for us. A share of everything, and nobody touches you."`,
        choices: [
          {
            t: "Join the crew",
            r: "You learn the cant, the signals and the rules. A purse is a fish. A fence is an uncle. Never rob your own street.",
            fx: {job:"thief",flag:"av_crew",them:{type:"friend",op:25},skill:{stealth:3,deception:2}},
          },
          {
            t: "Do one job and see",
            check: {s:"stealth",s2:"spd",d:40},
            win: {
              r: "A merchant's purse in the market crush. {them} gives you a third and a nod.",
              fx: {coin:12,flag:"av_crew",them:{op:10}},
            },
            lose: {r:"The merchant grabs your wrist and shouts. You tear free and run.",fx:{happy:-4,them:{op:-5}}},
          },
          {t:"Say no",r:'{them} shrugs. "Offer stands. Most people come back."',fx:{}},
        ],
      },
      {
        id: "av_crime_cutpurse",
        cond: (p,C)=>C.adult(p)&&free(p)&&(J(p,"thief")||p.flags.av_crew||C.prof(p,"stealth",40)),
        w: 1.2,
        cool: 5,
        title: "Fair day",
        setup: (p,ctx)=>{ctx.mark=A.pick(["a fat wool merchant","a priest with a heavy collection bag","a young knight showing off to a girl","a drunk drover with a week's pay"])},
        text: p=>`Fair day, and the square is packed shoulder to shoulder. ${A.pick(["A juggler draws the crowd.","A bear dances on a chain.","Two women are screaming over a goose."])} Your mark: {mark}.`,
        choices: [
          {
            t: "Cut the purse strings",
            check: {s:"stealth",s2:"spd",d:42},
            win: {
              r: p=>`A fat fish: ${A.ri(15,40)} suns' worth. Gone before he feels the breeze.`,
              fx: {coin:28,perf:5,skill:{stealth:3}},
            },
            lose: {
              r: '"THIEF!" The hue and cry goes up. Every hand in the square is reaching for you.',
              fx: {event:"av_crime_huecry"},
            },
          },
          {
            t: "Work it with a stall partner",
            check: {s:"deception",s2:"stealth",d:38},
            win: {
              r: "Your partner spills apples at his feet; you lift the purse while he helps pick them up.",
              fx: {coin:20,perf:4,skill:{deception:2}},
            },
            lose: {r:"The apples roll, the mark looks round, and catches your hand in his belt.",fx:{punish:"theft"}},
          },
          {
            t: "Let this one go",
            r: "Something about it smells wrong. Later you see the watch-captain was standing right behind him.",
            fx: {ins:.5},
          },
        ],
      },
      {
        id: "av_crime_huecry",
        trigger: !0,
        title: "Hue and cry",
        text: "Behind you, the hue and cry: every neighbor must answer it or be fined, so every neighbor does. Shouts, dogs, a bell starting to ring.",
        choices: [
          {
            t: "Run for the rooftops",
            check: {s:"athletics",s2:"spd",d:45},
            win: {r:"Up a water butt, over a tannery, down a chimney-side. Gone.",fx:{skill:{athletics:3},spd:.4}},
            lose: {
              r: "A tile slides. You come down in a yard full of angry people.",
              fx: {health:-10,cause:"a fall from a roof",punish:"theft"},
            },
          },
          {
            t: 'Turn and join the hunt, shouting "There he goes!"',
            check: {s:"deception",s2:"wil",d:45},
            win: {
              r: "You run with the crowd, point at a fleeing dog, and peel off at the next lane.",
              fx: {skill:{deception:3}},
            },
            lose: {r:"The man you robbed is right behind you. He knows your face.",fx:{punish:"theft"}},
          },
          {
            t: "Drop the purse and walk",
            r: "You let it fall in the gutter and walk away whistling. Nothing gained, nothing hanged.",
            fx: {happy:-2},
          },
        ],
      },
      {
        id: "av_crime_fence",
        cond: (p,C)=>C.adult(p)&&free(p)&&crook(p)&&!p.flags.av_uncle,
        w: 1,
        cool: 8,
        title: "Meeting an uncle",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id,ctx.trade=A.pick(["a second-hand clothier","a pawn-lender","a small money-changer","a rag-buyer","an amber dealer"])},
        text: `You have a silver cup you cannot sell. A friend sends you to {them}, {trade}: an "uncle", in the cant. A fence pays a quarter to a third of a thing's worth, and less for anything marked.`,
        choices: [
          {
            t: "Haggle",
            check: {s:"trade",s2:"deception",d:42},
            win: {
              r: "A third of its worth, and the uncle respects you for it. You have a buyer now.",
              fx: {coin:25,flag:"av_uncle",them:{type:"friend",op:15},skill:{trade:2}},
            },
            lose: {r:"A fifth. He knows you have nowhere else to go.",fx:{coin:12,flag:"av_uncle"}},
          },
          {
            t: "Take what he offers",
            r: "A quarter. Fair, for an uncle.",
            fx: {coin:18,flag:"av_uncle",them:{type:"friend",op:10}},
          },
          {
            t: "Melt it down yourself",
            check: {s:"craft",s2:"int",d:45},
            win: {r:"A lump of silver, no marks. Worth more than the fence would pay.",fx:{coin:30,skill:{craft:2}}},
            lose: {r:"You burn your hand and half the silver runs into the ashes.",fx:{coin:8,wound:"burn",health:-5}},
          },
        ],
      },
      {
        id: "av_crime_lamp",
        cond: (p,C)=>C.adult(p)&&free(p)&&crook(p),
        w: 1,
        cool: 9,
        title: "A lamp in the crew",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"friend").id},
        text: "Three jobs in a row, and three times the watch was waiting. Someone in the crew is a lamp, an informer. The crew is looking at {them}, who joined last spring. {them} is looking at you.",
        choices: [
          {
            t: "Find the real lamp",
            check: {s:"intrigue",s2:"ins",d:48},
            win: {
              r: "It is the boss's own cousin, paid by the watch-captain. You bring proof. The crew owes you.",
              fx: {skill:{intrigue:4},fame:2,perf:10,them:{type:"friend",op:30}},
            },
            lose: {
              r: "You find nothing. The crew decides on {them}. You never see {themHim} again.",
              fx: {happy:-6,wil:1},
            },
          },
          {
            t: "Stand up for {them}",
            check: {s:"persuasion",s2:"wil",d:45},
            win: {
              r: "Your word holds. {them} lives. The real lamp is caught the next month.",
              fx: {them:{type:"friend",op:40},honor:2},
            },
            lose: {r:"Now they wonder about you, too.",fx:{perf:-10,them:{type:"friend",op:20},happy:-4}},
          },
          {
            t: "Point at {them} to save yourself",
            r: "Easy. The crew believes it. You are not sure you do.",
            fx: {honor:-5,them:{type:"enemy",op:-60},trait:"deceitful"},
          },
        ],
      },
      {
        id: "av_crime_watchman",
        cond: (p,C)=>C.adult(p)&&free(p)&&crook(p)&&C.town(p),
        w: 1,
        cool: 7,
        title: "Wet or dry?",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id},
        text: "A new watchman walks your street, {them}. In the cant, a watchman who takes bribes is wet, one who won't is dry. You need to know which, and soon.",
        choices: [
          {
            t: "Offer a little gift",
            req: p=>p.coin>=5,
            check: {s:"ins",s2:"persuasion",d:42},
            win: {
              r: "Wet as the harbor. Five suns a month and he forgets your face.",
              fx: {coin:-5,them:{type:"friend",op:10},flag:"av_wetwatch"},
            },
            lose: {r:"Dry as bone. He arrests you for trying.",fx:{punish:"theft",them:{type:"enemy",op:-20}}},
          },
          {
            t: "Watch him for a month first",
            check: {s:"intrigue",s2:"stealth",d:40},
            win: {
              r: "He drinks at the Crooked Lamp and owes the dice-master money. Wet, once you know where to pour.",
              fx: {skill:{intrigue:3},flag:"av_wetwatch"},
            },
            lose: {r:"He notices you noticing him.",fx:{them:{type:"rival",op:-10}}},
          },
          {t:"Move your work to another street",r:"Fewer marks, less risk.",fx:{perf:-3}},
        ],
      },
      {
        id: "av_crime_kesh_roofs",
        cond: (p,C)=>C.adult(p)&&free(p)&&(C.realm(p,"POL-21")||C.prof(p,"athletics",45))&&(crook(p)||C.realm(p,"POL-21")),
        w: 1,
        cool: 8,
        title: "The climbing thieves",
        text: p=>p.realm==="POL-21"?"The climbing thieves of Kesh go over walls the way others go through doors. Kito the Gecko, the boldest of them, is said to have taken a pearl from a merchant's tower while the merchant slept. A pepper merchant's tower stands four storeys high, with a window open for the heat.":"A spice merchant's house has an upper window open for the heat, four storeys up a sheer wall. In the south they would call it a Kesh job.",
        choices: [
          {
            t: "Climb",
            check: {s:"athletics",s2:"stealth",d:52},
            win: {
              r: "Finger-holds in the mortar, a drainpipe, the sill. A box of pearls on the table. Down the same way, before the moon.",
              fx: {coin:70,skill:{athletics:4,stealth:3},fame:1,perf:8},
            },
            lose: {
              r: "Halfway up, the mortar crumbles.",
              fx: {health:-22,wound:"bad_knee",cause:"a fall from a wall",wil:1},
            },
          },
          {
            t: "Bribe the night servant for the door",
            req: p=>p.coin>=10,
            check: {s:"persuasion",s2:"intrigue",d:45},
            win: {r:"The door is unbarred at the third hour. Less glory, same pearls.",fx:{coin:50,perf:5}},
            lose: {r:"The servant takes your coin and tells his master.",fx:{coin:-10,punish:"theft"}},
          },
          {t:"Too high, too soon",r:"You go home. The window will be open again.",fx:{}},
        ],
      },
      {
        id: "av_crime_raggangs",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.realm(p,"POL-17")&&(C.poor(p)||crook(p)),
        w: 1.1,
        cool: 7,
        title: "The rag heaps",
        text: "Rags are paper in Qadira, and paper is money: thirty-two mills on the river buy every scrap. The rag gangs fight over the refuse heaps outside the south gate. This morning another gang has moved onto yours.",
        choices: [
          {
            t: "Fight for the heap",
            r: "You pick up a stick and walk out to meet their biggest.",
            fx: {
              duel: {
                tier: 1,
                title: "a rag-gang bruiser",
                troop: "SL",
                opts: {kind:"brawl",place:"the south gate heaps",lethal:!1,toYield:!0,title:"The rag heaps"},
              },
            },
          },
          {
            t: "Make a deal: split the heap",
            check: {s:"diplomacy",s2:"persuasion",d:42},
            win: {
              r: "East half, west half, and peace. The mills pay the same either way.",
              fx: {skill:{diplomacy:3},coin:8,newRel:{type:"friend",op:15}},
            },
            lose: {r:"They laugh, and take the whole heap.",fx:{coin:-5,happy:-3}},
          },
          {
            t: "Sell to a different mill at a better price",
            check: {s:"trade",s2:"int",d:40},
            win: {
              r: "The paper journeymen at the river mill pay a third more for linen. You stop fighting for rubbish.",
              fx: {coin:15,skill:{trade:3}},
            },
            lose: {r:"The mill-master cheats you on the weight.",fx:{coin:-3}},
          },
        ],
      },
      {
        id: "av_crime_exchange",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.realm(p,"POL-16","POL-04")&&crook(p),
        w: 1.1,
        cool: 7,
        title: "The Exchange",
        text: p=>`The ${p.realm==="POL-16"?"Exchange of Ostra":"loggia of the Lucernan bankers"} at noon: black caps, bills of credit, more money changing hands in an hour than a village sees in a lifetime. The pickpockets of the Exchange work here, and a forger in the arcade sells perfect bills.`,
        choices: [
          {
            t: "Lift a banker's bill-case",
            check: {s:"stealth",s2:"spd",d:52},
            win: {
              r: "Bills of credit worth a fortune, and useless without a forger. Luckily, there is one in the arcade.",
              fx: {coin:90,perf:8,skill:{stealth:3}},
            },
            lose: {r:"Bankers keep guards. The guards keep clubs.",fx:{health:-10,punish:"theft",cause:"a beating"}},
          },
          {
            t: "Pass a forged bill at a small counting-house",
            req: (p,C)=>C.literate(p),
            check: {s:"deception",s2:"trade",d:50},
            win: {
              r: "The clerk checks the seal, the hand, the date, and pays out 60 suns.",
              fx: {coin:60,skill:{deception:4},flag:"av_forger"},
            },
            lose: {
              r: "The clerk knows the banker's hand. Forgery is a hanging matter in some cities.",
              fx: {prison:2,why:"forgery",event:"av_ledger"},
            },
          },
          {
            t: "Just watch how the money moves",
            check: {s:"trade",s2:"int",d:40},
            win: {
              r: "You learn how bills of exchange work. That is worth more than any purse.",
              fx: {skill:{trade:4},int:.5},
            },
            lose: {r:"It is all Solen and numbers.",fx:{}},
          },
        ],
      },
      {
        id: "av_crime_canals",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.realm(p,"POL-04")&&crook(p),
        w: 1,
        cool: 8,
        title: "The Night Watch on the water",
        text: "In Lucerna the Night Watch patrols the canals by boat. A glassmaker's storehouse backs onto a dark side-canal, and the watch-boat passes every half hour.",
        choices: [
          {
            t: "Swim in between patrols",
            check: {s:"athletics",s2:"stealth",d:48},
            win: {
              r: "In through a water-gate, out with a sack of fine glass cups held over your head.",
              fx: {coin:55,skill:{athletics:3},perf:6},
            },
            lose: {
              r: "The watch-boat comes early. A boathook in your collar.",
              fx: {prison:1,why:"burglary",event:"av_ledger"},
            },
          },
          {
            t: "Bribe the watch-boat crew",
            req: p=>p.coin>=15,
            check: {s:"intrigue",s2:"persuasion",d:42},
            win: {r:"The boat rows slowly and looks the other way. Fifteen suns well spent.",fx:{coin:30,perf:4}},
            lose: {r:"A dry crew. They take your money as evidence.",fx:{coin:-15,punish:"theft"}},
          },
          {t:"Not tonight",r:"The water is cold anyway.",fx:{}},
        ],
      },
      {
        id: "av_heist_start",
        cond: (p,C)=>C.adult(p)&&free(p)&&(J(p,"thief")||p.flags.av_crew||C.prof(p,"stealth",50))&&!C.ruler(p),
        w: 1,
        cool: 10,
        title: "The big job",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"friend").id},
        text: '{them} has an idea, and a gleam in {theirHis} eye. "Not purses. Not cups. One job, done right, and we never work again. I have three marks. You choose."',
        choices: [
          {
            t: "The wool merchant's strongroom",
            r: "Iron-bound chest, two dogs, one old guard. Rich and careless. You start planning.",
            fx: (p,ctx)=>{ctx.mark="the wool merchant's strongroom",ctx.loot=220,ctx.diff=45,A.applyFx(p,{event:"av_heist_scout"},ctx)},
          },
          {
            t: "The guild hall's silver plate",
            r: "Twenty pieces of silver plate, a night porter, a dozen apprentices sleeping upstairs. You start planning.",
            fx: (p,ctx)=>{ctx.mark="the guild hall's silver plate",ctx.loot=320,ctx.diff=52,A.applyFx(p,{event:"av_heist_scout"},ctx)},
          },
          {
            t: "The bishop's treasury",
            r: "Gold on the altar, a vault under the floor, and guards who believe they serve a god. You start planning.",
            fx: (p,ctx)=>{ctx.mark="the temple treasury",ctx.loot=500,ctx.diff=60,A.applyFx(p,{event:"av_heist_scout"},ctx)},
          },
          {
            t: '"No. Too big."',
            r: "{them} goes to someone else. You hear later how it went: not well.",
            fx: {ins:.4},
          },
        ],
      },
      {
        id: "av_heist_scout",
        trigger: !0,
        title: "Casing the mark",
        setup: (p,ctx)=>{ctx.mark||(ctx.mark="the wool merchant's strongroom",ctx.loot=220,ctx.diff=45)},
        text: "Step one: learn {mark} like your own hand. When the guards change, which dog sleeps, where the keys hang, which window sticks.",
        choices: [
          {
            t: "Watch from a rooftop for a month",
            check: {s:"stealth",s2:"int",d:40},
            win: {
              r: "You know every lamp lit and every door barred. The plan gets easier.",
              fx: (p,ctx)=>(ctx.diff=(ctx.diff||45)-8,A.trainSkill(p,"stealth",2),A.applyFx(p,{event:"av_heist_night"},ctx),"You are ready."),
            },
            lose: {
              r: "A maid sees you on the roof twice. That will matter.",
              fx: (p,ctx)=>{ctx.diff=(ctx.diff||45)+6,A.applyFx(p,{event:"av_heist_night"},ctx)},
            },
          },
          {
            t: "Bribe a servant inside",
            req: p=>p.coin>=15,
            check: {s:"persuasion",s2:"intrigue",d:45},
            win: {
              r: "A kitchen boy, fifteen suns, and a wax copy of the key.",
              fx: (p,ctx)=>{p.coin=Math.max(0,p.coin-15),ctx.diff=(ctx.diff||45)-12,A.applyFx(p,{event:"av_heist_night"},ctx)},
            },
            lose: {
              r: "The kitchen boy takes the coin and says nothing to anyone. Yet.",
              fx: (p,ctx)=>{p.coin=Math.max(0,p.coin-15),ctx.diff=(ctx.diff||45)+4,A.applyFx(p,{event:"av_heist_night"},ctx)},
            },
          },
          {
            t: "Get yourself hired there",
            check: {s:"deception",s2:"etiquette",d:48},
            win: {
              r: "Three weeks as a porter. You know the place better than its owner.",
              fx: (p,ctx)=>{ctx.diff=(ctx.diff||45)-15,A.trainSkill(p,"deception",3),A.applyFx(p,{event:"av_heist_night"},ctx)},
            },
            lose: {
              r: "They do not hire you, and the steward remembers your face.",
              fx: (p,ctx)=>{ctx.diff=(ctx.diff||45)+8,A.applyFx(p,{event:"av_heist_night"},ctx)},
            },
          },
          {t:"Call it off",r:"Something feels wrong. You walk away while you can.",fx:{wil:.5}},
        ],
      },
      {
        id: "av_heist_night",
        trigger: !0,
        title: "The night of the job",
        setup: (p,ctx)=>{ctx.mark||(ctx.mark="the wool merchant's strongroom",ctx.loot=220),ctx.diff==null&&(ctx.diff=48)},
        text: "Moonless. The bells ring the second hour. You stand in the shadow by {mark} with a dark lantern, picks and a sack. Your heart is louder than the bells.",
        choices: [
          {
            t: "Pick the lock",
            check: {s:"stealth",s2:"craft",d:48},
            win: {
              r: "",
              fx: (p,ctx)=>A.chance(A.clamp(.5+(A.checkVal(p,{s:"stealth",s2:"craft"})-(ctx.diff||48))/60,.1,.92))?(A.applyFx(p,{event:"av_heist_split"},ctx),"Click. Inside, the dark smells of wax and money. You fill the sack and are gone before the third bell."):(A.applyFx(p,{prison:A.ri(2,4),why:"burglary",event:"av_ledger",fame:2},ctx),"The lock gives, and so does a board under your foot. A dog, a lantern, a shout. They take you in the yard."),
            },
            lose: {
              r: "The pick snaps in the lock. You leave empty-handed before the guard comes round.",
              fx: {happy:-5,wil:1},
            },
          },
          {
            t: "Go in through the roof",
            check: {s:"athletics",s2:"stealth",d:50},
            win: {
              r: "Tiles off, rafters, a drop onto sacks. Inside.",
              fx: (p,ctx)=>A.chance((ctx.diff||48)>55?.55:.8)?(A.applyFx(p,{event:"av_heist_split"},ctx),"You fill the sack and go out the way you came."):(A.applyFx(p,{health:-10,prison:A.ri(2,4),why:"burglary",event:"av_ledger"},ctx),"On the way out, a rafter cracks. You fall into the guards' room."),
            },
            lose: {
              r: "A tile slides and smashes in the yard. Lanterns. You run.",
              fx: {health:-6,happy:-4,cause:"a fall"},
            },
          },
          {
            t: "Have {them} start a fire two streets over as a distraction",
            req: (p,C,ctx)=>!!ctx.pid,
            r: "Smoke, bells, every guard running the wrong way. You walk in and out.",
            fx: (p,ctx)=>(A.applyFx(p,{event:"av_heist_split",honor:-3},ctx),"Two houses burn. Nobody dies, this time."),
          },
          {
            t: "Lose your nerve and walk away",
            r: "You go home and lie awake. Nothing gained, nothing lost but face.",
            fx: {happy:-3,them:{op:-10}},
          },
        ],
      },
      {
        id: "av_heist_split",
        trigger: !0,
        title: "Splitting the take",
        setup: (p,ctx)=>{ctx.pid||(ctx.pid=A.makeAcquaintance(p,"friend").id),ctx.loot||(ctx.loot=220),ctx.half=Math.round(ctx.loot/2)},
        text: "In a cellar by candlelight you lay it all out: worth {loot} suns to a fence, maybe more. Your partner counts it twice. Then counts you.",
        choices: [
          {
            t: "Split it fair, half and half",
            r: "Half each. A fortune. You buy a round for the whole crew.",
            fx: (p,ctx)=>(p.coin+=ctx.half||110,A.fame(p,3),p.job&&p.job.c==="thief"&&(p.job.perf=Math.min(100,p.job.perf+15)),A.applyFx(p,{them:{type:"friend",op:25},happy:10,deed:"Pulled off a great burglary"},ctx),`(+${ctx.half||110} suns)`),
          },
          {
            t: "Watch your partner's hands",
            check: {s:"ins",s2:"dagger",d:45},
            win: {
              r: "You see the knife before it clears the sleeve. You take it all, and leave {themHim} alive and bleeding.",
              fx: (p,ctx)=>(p.coin+=ctx.loot||220,A.applyFx(p,{them:{type:"enemy",op:-70},wil:1,fame:2},ctx),`(+${ctx.loot||220} suns)`),
            },
            lose: {
              r: "The knife takes you under the ribs. When you wake, the cellar is empty.",
              fx: {health:-30,wound:"deep_cut",wil:2,cause:"a partner's knife",them:{type:"enemy",op:-70}},
            },
          },
          {
            t: "Cheat {themHim} out of the best pieces",
            check: {s:"deception",s2:"trade",d:48},
            win: {
              r: "The gold cup goes in your sleeve. The rest you split. {theyHe} never knows.",
              fx: (p,ctx)=>(p.coin+=Math.round((ctx.loot||220)*.7),A.applyFx(p,{honor:-3},ctx),`(+${Math.round((ctx.loot||220)*.7)} suns)`),
            },
            lose: {
              r: "{theyHe} sees the cup. Steel comes out.",
              fx: {
                duel: {foe:"them",opts:{kind:"duel",place:"a cellar",lethal:!0,toYield:!0,title:"Thieves fall out"}},
              },
            },
          },
        ],
      },
      {
        id: "av_ledger",
        trigger: !0,
        title: "In the ledger",
        text: "The ledger, in the cant: prison. Stone, straw, a bucket, and a gaoler who sells bread at three times its price. One of the bars in the high window is loose, and your cellmate has noticed too.",
        choices: [
          {
            t: "Work the bar loose and go",
            check: {s:"str",s2:"stealth",d:52},
            win: {
              r: "Three weeks of scraping with a spoon. One night, out, over the wall, gone. They will be looking for you.",
              fx: {free:!0,flag:"av_bounty",ach:"escaped",wil:1,fame:2,deed:"Broke out of prison"},
            },
            lose: {
              r: "The gaoler finds the scrapings. A beating and a deeper cell.",
              fx: {health:-12,wil:2,cause:"a gaoler's beating"},
            },
          },
          {
            t: "Bribe the gaoler",
            req: p=>p.coin>=40,
            check: {s:"persuasion",s2:"intrigue",d:45},
            win: {
              r: "Forty suns, a door left unlocked, a cart of straw. You are out.",
              fx: {coin:-40,free:!0,flag:"av_bounty",ach:"escaped"},
            },
            lose: {r:"He takes the forty and laughs.",fx:{coin:-40,happy:-6}},
          },
          {
            t: "Serve your time and keep your head down",
            r: "You learn a great deal from the other prisoners. Most of it is about crime.",
            fx: {wil:2,skill:{stealth:2,deception:2,intrigue:2}},
          },
        ],
      },
      {
        id: "av_crime_burglary",
        cond: (p,C)=>C.adult(p)&&free(p)&&crook(p)&&!C.rich(p),
        w: 1,
        cool: 6,
        title: "An empty house",
        text: p=>`The ${A.pick(["notary","grain factor","tax-farmer","widowed cloth merchant"])} on the hill has gone to ${A.pick(["a wedding","the coast","the capital"])} for a week. One old servant, deaf in one ear, and a back gate with a rotten bar.`,
        choices: [
          {
            t: "Go in at night",
            check: {s:"stealth",s2:"ins",d:45},
            win: {
              r: p=>`Candlesticks, linen, a purse in a boot. ${A.pick(["The uncle gives you 40 suns for the lot.","You keep the boot purse and sell the rest."])}`,
              fx: {coin:40,perf:6,skill:{stealth:3}},
            },
            lose: {
              r: "The old servant is not as deaf as they said.",
              fx: {punish:"theft",health:-5,cause:"a servant's cudgel"},
            },
          },
          {
            t: "Go in by day, dressed as a workman",
            check: {s:"deception",s2:"wil",d:45},
            win: {r:'"Here to fix the shutters." The servant even makes you tea.',fx:{coin:35,skill:{deception:3}}},
            lose: {r:"A neighbor knows every workman in town. You are not one.",fx:{punish:"theft"}},
          },
          {t:"Leave it",r:"Easy money is rarely easy.",fx:{}},
        ],
      },
      {
        id: "av_crime_gutterking",
        cond: (p,C)=>C.adult(p)&&free(p)&&crook(p)&&!p.flags.av_boss,
        w: .9,
        cool: 9,
        title: "The gutter king",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id,ctx.cut=A.ri(20,40)},
        text: `You are fetched at night to a back room behind a tannery. {them}, the gutter king of this quarter, sits on a barrel and eats an apple with a knife. "You've been busy. Busy pays tax. {cut} suns, every quarter."`,
        choices: [
          {
            t: "Pay the tax",
            req: (p,C,ctx)=>p.coin>=20,
            r: "You pay. He smiles. You are under his wing now, and his thumb.",
            fx: (p,ctx)=>{p.coin=Math.max(0,p.coin-ctx.cut),A.applyFx(p,{them:{type:"friend",op:15},perf:5},ctx)},
          },
          {
            t: "Refuse to his face",
            check: {s:"intimidation",s2:"wil",d:55},
            win: {
              r: `He studies you a long time. "You'll go far, or you'll go in the river." He lets you go. Others hear of it.`,
              fx: {fame:3,skill:{intimidation:3},them:{type:"rival",op:-20}},
            },
            lose: {
              r: "His men take you into the yard.",
              fx: {health:-18,wound:"broken_nose",wil:2,them:{type:"enemy",op:-20},cause:"a beating"},
            },
          },
          {
            t: "Offer to work for him instead of paying",
            check: {s:"persuasion",s2:"intrigue",d:45},
            win: {
              r: '"I like you." You become one of his hands, and you learn how a quarter is run.',
              fx: {skill:{intrigue:4},them:{type:"mentor",op:25},perf:8},
            },
            lose: {r:'"Did I ask?" You pay double.',fx:{coin:-30}},
          },
        ],
      },
      {
        id: "av_crime_turfwar",
        cond: (p,C)=>C.adult(p)&&free(p)&&crook(p),
        w: 1,
        cool: 8,
        title: "Turf",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"rival").id},
        text: "A new crew under {them} is working your market: your marks, your stalls, your corners. Your crew wants blood. The watch wants an excuse.",
        choices: [
          {
            t: "Call {them} out, fists only",
            r: "Behind the fishmarket at dusk, both crews watching.",
            fx: {
              duel: {foe:"them",opts:{kind:"brawl",place:"behind the fishmarket",lethal:!1,toYield:!0,title:"Turf"}},
            },
          },
          {
            t: "Tip the watch about them",
            check: {s:"intrigue",s2:"deception",d:45},
            win: {
              r: "Half their crew in the ledger by the end of the week. Your market is quiet again.",
              fx: {skill:{intrigue:3},perf:8,honor:-2,them:{type:"enemy",op:-40}},
            },
            lose: {r:"The watch takes your tip and some of your crew too.",fx:{perf:-10,happy:-5}},
          },
          {
            t: "Offer them the fish market and keep the rest",
            check: {s:"diplomacy",s2:"persuasion",d:45},
            win: {r:"A truce over a jug. Less money, no blood.",fx:{skill:{diplomacy:3},them:{type:"rival",op:15}}},
            lose: {r:"They take the fish market and start on the rest.",fx:{perf:-8,coin:-10}},
          },
        ],
      },
      {
        id: "av_crime_rise",
        cond: (p,C)=>C.adult(p)&&free(p)&&J(p,"thief")&&p.job.r>=1&&!p.flags.av_boss,
        w: .8,
        cool: 12,
        title: "The boss is taken",
        text: "The watch took your crew's boss last night. He is on his way to the tall widow, the gallows, and the crew is in a cellar arguing about who leads now. Three of them look at you.",
        choices: [
          {
            t: "Step up",
            check: {s:"command",s2:"intimidation",d:50},
            win: {
              r: "You talk, you threaten, you promise shares. By morning the crew is yours.",
              fx: p=>(p.flags.av_boss=A.S.year,p.job&&(p.job.r=Math.max(p.job.r,3),p.job.perf=Math.min(100,p.job.perf+15)),A.fame(p,4),A.trainSkill(p,"command",4),"You are a gang boss now."),
            },
            lose: {
              r: "Someone else wants it more. The crew splits, and you get the leavings.",
              fx: {perf:-10,happy:-5,newRel:{type:"rival",op:-30}},
            },
          },
          {
            t: "Try to break the boss out",
            check: {s:"stealth",s2:"tactics",d:58},
            win: {
              r: "A cart, a bribe, a broken chain on the road to the gallows. He owes you his neck, and he does not forget.",
              fx: {fame:4,perf:15,newRel:{type:"mentor",op:50},deed:"Snatched a man from the road to the gallows"},
            },
            lose: {
              r: "The guards were ready. Now there are two of you in the cart.",
              fx: {prison:3,why:"attempted rescue",event:"av_ledger"},
            },
          },
          {
            t: "Back someone else, quietly",
            r: "You back the winner. Safe, and a lieutenant's share.",
            fx: {perf:5,coin:10},
          },
        ],
      },
      {
        id: "av_crime_protection",
        cond: (p,C)=>C.adult(p)&&free(p)&&(p.flags.av_boss||J(p,"thief")&&p.job.r>=2||crook(p)&&C.prof(p,"intimidation",35)),
        w: 1,
        cool: 6,
        title: "Collection day",
        text: 'Collection day. Twelve shops on Lantern Street pay for "protection". The baker is short again. His wife is pregnant, he says, and the flour price is up.',
        choices: [
          {
            t: "Make an example of him",
            check: {s:"intimidation",s2:"str",d:40},
            win: {
              r: "You smash his oven door. He pays, and so does every shop on the street, early.",
              fx: {coin:30,perf:6,honor:-4,trait:"cruel"},
            },
            lose: {r:"The baker's brother is a blacksmith.",fx:{health:-14,cause:"a blacksmith's fist",perf:-5}},
          },
          {
            t: "Let him off this month",
            r: "He weeps. The street hears of it. Some think you are soft; more of them think you are fair.",
            fx: {coin:20,honor:2,fame:1},
          },
          {
            t: "Actually protect them: deal with the bread thieves",
            check: {s:"tracking",s2:"intimidation",d:42},
            win: {
              r: "You find who has been stealing from the bakers and break it up. The street pays gladly now.",
              fx: {coin:35,perf:8,honor:1},
            },
            lose: {r:"The thieves are the watch's own sons.",fx:{happy:-3,perf:-3}},
          },
        ],
      },
      {
        id: "av_crime_smuggle",
        cond: (p,C)=>C.adult(p)&&free(p)&&(C.coast(p)||crook(p)||p.flags.av_smugglers_known)&&!C.ruler(p),
        w: 1.1,
        cool: 7,
        title: "A run in the dark",
        setup: (p,ctx)=>{const c=cargo(p);ctx.goods=c[0],ctx.where=c[1],ctx.dodge=c[2],ctx.pay=A.ri(25,50)},
        text: "Every tax makes a smuggler. A boatman wants a strong back for a night run: {goods}, past {dodge}, landed at {where}. {pay} suns for one night.",
        choices: [
          {
            t: "Do the run",
            check: {s:"stealth",s2:"sea",d:45},
            win: {
              r: "Muffled oars, no moon, a signal lantern on the shore. You are paid before dawn.",
              fx: (p,ctx)=>{p.coin+=ctx.pay,A.applyFx(p,{flag:"av_smuggler",skill:{stealth:2,sea:2}},ctx)},
            },
            lose: {r:"A revenue boat comes out of the fog. Everyone over the side.",fx:{punish:"smuggling",health:-6}},
          },
          {
            t: "Do it, and keep a little cargo back for yourself",
            check: {s:"deception",s2:"stealth",d:50},
            win: {
              r: "The boatman counts wrong. You do not.",
              fx: (p,ctx)=>{p.coin+=ctx.pay+20,A.applyFx(p,{flag:"av_smuggler",honor:-2},ctx)},
            },
            lose: {
              r: "The boatman counts right. You swim home.",
              fx: {health:-8,newRel:{type:"enemy",op:-30},cause:"cold water"},
            },
          },
          {
            t: "Turn him in to the revenue men",
            r: "A reward of 10 suns, and the shore families stop talking to you.",
            fx: {coin:10,favor:2,honor:-1,newRel:{type:"enemy",op:-25}},
          },
          {t:"Not your business",r:"You go to bed. You hear oars in the night.",fx:{}},
        ],
      },
      {
        id: "av_crime_yew",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.realm(p,"POL-05","POL-03")&&(crook(p)||J(p,"bowyer","merchant")),
        w: 1,
        cool: 10,
        title: "Yew for Varenna",
        text: "Ashmere yew makes the best war bows in the world, and Ashmere's treason law forbids selling it south. A Varennan factor offers 120 suns for a cart of staves taken over the border under turnips.",
        choices: [
          {
            t: "Drive the cart",
            check: {s:"deception",s2:"wil",d:52},
            win: {
              r: "The border sergeant pokes the turnips and waves you through. 120 suns.",
              fx: {coin:120,flag:"av_smuggler",honor:-2},
            },
            lose: {r:"The sergeant finds the staves. Treason.",fx:{punish:"treason"}},
          },
          {
            t: "Inform on the factor",
            r: "The King's men take him at dawn. You are paid, and watched.",
            fx: {coin:25,favor:5,newRel:{type:"enemy",op:-30}},
          },
          {t:"Refuse",r:"Some coin is not worth a rope.",fx:{}},
        ],
      },
      {
        id: "av_crime_fireoil",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.realm(p,"POL-24","POL-33","POL-04","POL-12","POL-15")&&(crook(p)||salt(p)),
        w: .8,
        cool: 12,
        title: "A jar of fire-oil",
        text: "A sealed jar, packed in straw, heavy and stinking. Fire-oil from the seeps of the Oil Shore. On the black market a jar is worth 200 suns, and it can burn a ship to the waterline. Someone needs it carried to a captain at the harbor.",
        choices: [
          {
            t: "Carry it carefully",
            check: {s:"stealth",s2:"sta",d:48},
            win: {
              r: "Delivered. The captain pays 50 suns and asks no questions. You learn later what Dragon Night really was.",
              fx: {coin:50,flag:"av_fireoil",skill:{stealth:2}},
            },
            lose: {
              r: "A stumble on the quay. The jar cracks. Somebody drops a pipe.",
              fx: {health:-25,wound:"burn",wil:2,cause:"a fire-oil blaze"},
            },
          },
          {
            t: "Sell it yourself to the highest bidder",
            check: {s:"trade",s2:"intrigue",d:55},
            win: {r:"200 suns from a Lucernan with a cold smile.",fx:{coin:200,honor:-3,flag:"av_bounty"}},
            lose: {
              r: "The Emir's men find you first. You are lucky to leave the city alive.",
              fx: {health:-20,coin:-20,cause:"the Emir's men",wound:"scar_face"},
            },
          },
          {t:"Refuse to touch it",r:"Fire-oil and secrets: both burn the hand that holds them.",fx:{}},
        ],
      },
      {
        id: "av_crime_seedlings",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.realm(p,"POL-32","POL-21")&&(salt(p)||crook(p)||J(p,"merchant")),
        w: .7,
        cool: 15,
        title: "Nutmeg seedlings",
        text: "A Keshi captain offers 500 suns for twelve living nutmeg seedlings, smuggled off the Sultanate's islands in a water jar. Spice moves past the scales every day. Seedlings off the islands mean death.",
        choices: [
          {
            t: "Do it",
            check: {s:"stealth",s2:"sea",d:60},
            win: {
              r: "Twelve green shoots in a jar of bilge water, past three searches. Five hundred suns. You will never tell anyone.",
              fx: {coin:500,fame:2,flag:"av_bounty",deed:"Smuggled spice seedlings off the islands"},
            },
            lose: {
              r: "A searcher lifts the jar's false bottom.",
              fx: {die:"executed for smuggling nutmeg seedlings off the Amber Isles"},
            },
          },
          {t:"Refuse",r:"The captain finds someone else. That someone is hanged in the spring.",fx:{wil:.5}},
        ],
      },
      {
        id: "av_crime_goldpan",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.realm(p,"POL-20","POL-22")&&(C.poor(p)||crook(p)),
        w: 1,
        cool: 8,
        title: "The gravel beds",
        text: "The gold of Zanara lies in river gravels, and every grain belongs to the Emperor. A panner who is caught loses a hand. At night the gravel beds are full of shadows with wooden bowls.",
        choices: [
          {
            t: "Pan by moonlight",
            check: {s:"stealth",s2:"sta",d:45},
            win: {
              r: "A pinch of dust a night for a month. Sixty suns, sewn into your belt.",
              fx: {coin:60,skill:{stealth:3}},
            },
            lose: {
              r: "The Emperor's weighers have dogs.",
              fx: {wound:"lost_hand",health:-20,wil:3,cause:"the law of the gold"},
            },
          },
          {
            t: "Buy from panners and resell",
            req: p=>p.coin>=20,
            check: {s:"trade",s2:"intrigue",d:48},
            win: {
              r: "You buy cheap from frightened people and sell dear to a Sabran. It does not feel good. It feels profitable.",
              fx: {coin:45,honor:-2,skill:{trade:3}},
            },
            lose: {r:"The Sabran pays in clipped silver.",fx:{coin:-15}},
          },
          {t:"Keep your hands",r:"You like your hands.",fx:{}},
        ],
      },
      {
        id: "av_bounty_on_you",
        cond: (p,C)=>C.adult(p)&&free(p)&&(p.flags.av_bounty||p.flags.outlaw||p.flags.av_hounded||C.famKind(p,"outlaw")&&C.ageAdj(p)>18),
        w: 1.4,
        cool: 4,
        title: "A price on your head",
        setup: (p,ctx)=>{ctx.price=A.ri(30,120)},
        text: p=>`${A.pick(["A stranger has been asking about you at every inn.","The notice on the church door describes you rather well.","Your old friend at the tavern will not meet your eye."])} There is a price on your head: {price} suns. And someone has come to collect it.`,
        choices: [
          {
            t: "Face the bounty hunter",
            r: "You find him before he finds you.",
            fx: {
              duel: {
                tier: 3,
                title: "a bounty hunter",
                troop: "XB",
                opts: {kind:"duel",place:"a back lane",lethal:!0,toYield:!1,title:"The bounty hunter"},
              },
            },
          },
          {
            t: "Move on, change your name",
            check: {s:"deception",s2:"survival",d:45},
            win: {
              r: "A new town, a new name, a beard or a haircut. The trail goes cold.",
              fx: {unflag:"av_bounty",skill:{deception:3},wil:1},
            },
            lose: {
              r: "He tracks you three towns over. You barely get away.",
              fx: {health:-12,wound:"arrow_wound",cause:"a bounty hunter's bolt"},
            },
          },
          {
            t: "Pay off whoever put up the price",
            req: (p,C,ctx)=>p.coin>=80,
            check: {s:"persuasion",s2:"intrigue",d:48},
            win: {
              r: "Eighty suns and an apology through a priest. The notice comes down.",
              fx: {coin:-80,unflag:"av_bounty"},
            },
            lose: {r:"They take the money and keep the notice up.",fx:{coin:-80,happy:-6}},
          },
        ],
      },
      {
        id: "av_bounty_start",
        cond: (p,C)=>go(p)&&!p.flags.av_bhunter&&(C.prof(p,"tracking",35)||C.prof(p,"xbow",40)||sword(p))&&!J(p,"thief"),
        w: .9,
        cool: 10,
        title: "Wanted",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"enemy").id,ctx.price=A.ri(30,60),ctx.crime=A.pick(["killed a carter for his mules","robbed the tithe barn","burned a mill in a feud","deserted with the company pay chest"])},
        text: 'A notice on the church door: {themFull}, who {crime}. {price} suns, alive. Half that dead. The reeve has no men to spare. "Anyone may take him," he says.',
        choices: [
          {
            t: "Track {themHim} down",
            check: {s:"tracking",s2:"int",d:45},
            win: {
              r: "Five days, three villages, one muddy footprint. You find {themHim} in a woodshed.",
              fx: {
                flag: "av_bhunter",
                skill: {tracking:4},
                duel: {foe:"them",opts:{kind:"duel",place:"a woodshed",lethal:!0,toYield:!0,title:"The wanted man"}},
              },
            },
            lose: {r:"{theyHe} hears you coming and is gone.",fx:{skill:{tracking:1},happy:-2}},
          },
          {
            t: "Ask around the taverns",
            check: {s:"intrigue",s2:"persuasion",d:42},
            win: {
              r: "A sister who hates {themHim}. A barn. You and two reeve's men take {themHim} sleeping.",
              fx: (p,ctx)=>(p.coin+=ctx.price,A.applyFx(p,{flag:"av_bhunter",fame:2},ctx),`(+${ctx.price} suns)`),
            },
            lose: {r:"Word gets back to {themHim} that you are asking.",fx:{them:{op:-20}}},
          },
          {t:"Leave it to the reeve",r:"Not your affair.",fx:{}},
        ],
      },
      {
        id: "av_bounty_debtor",
        cond: (p,C)=>C.adult(p)&&free(p)&&(p.flags.av_bhunter||C.prof(p,"tracking",50)||C.realm(p,"POL-16")&&C.prof(p,"tracking",30)),
        w: 1.1,
        cool: 6,
        title: "The fled debtor",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id},
        text: "An Ostran bank wants {them} back: a dyer who borrowed 300 suns and fled. They pay a tenth of the debt to whoever brings {themHim} in. You find {themHim} in a fishing village, mending nets, with three small children.",
        choices: [
          {
            t: "Bring {themHim} in",
            r: "The children cry the whole first mile. You are paid 30 suns. The Debtors' Tower is not a kind place.",
            fx: {coin:30,honor:-2,happy:-4,them:{type:"enemy",op:-50}},
          },
          {
            t: "Report {themHim} dead",
            check: {s:"deception",s2:"wil",d:45},
            win: {
              r: "A burial record bought from a priest for 2 suns. The bank writes off the debt. {them} will light a candle for you every year.",
              fx: {coin:-2,honor:3,them:{type:"friend",op:50}},
            },
            lose: {r:"The bank sends its own man to check. Now you owe them.",fx:{coin:-30,fame:-1}},
          },
          {
            t: "Warn {themHim} and leave",
            r: "{theyHe} is gone by morning, children and all.",
            fx: {honor:1,them:{type:"friend",op:30}},
          },
        ],
      },
      {
        id: "av_bounty_killer",
        cond: (p,C)=>C.adult(p)&&free(p)&&(p.flags.av_bhunter||C.prof(p,"tracking",55))&&!C.old(p),
        w: 1.2,
        cool: 6,
        title: "A hard bounty",
        setup: (p,ctx)=>{ctx.price=A.ri(100,200)},
        text: "The big one: a killer with five murders on the notice and {price} suns on his head, holed up with two others in a ruined watchtower in the hills. Three men have gone for him already. None came back.",
        choices: [
          {
            t: "Go in at night, alone",
            check: {s:"stealth",s2:"ins",d:55},
            win: {
              r: "You take the two guards in their sleep and wake him with a blade at his throat.",
              fx: (p,ctx)=>(p.coin+=ctx.price,A.applyFx(p,{fame:5,skill:{stealth:4},epithet:"the Hound",deed:"Took a five-time killer in his own tower"},ctx),`(+${ctx.price} suns)`),
            },
            lose: {
              r: "One of them was awake.",
              fx: {
                duel: {
                  tier: 4,
                  title: "the tower killer",
                  troop: "HI",
                  opts: {kind:"duel",place:"a ruined watchtower",lethal:!0,toYield:!1,title:"The bounty"},
                },
              },
            },
          },
          {
            t: "Starve them out",
            check: {s:"tactics",s2:"wil",d:48},
            win: {
              r: "Ten days of watching the well. On the eleventh, they come out with their hands up.",
              fx: (p,ctx)=>(p.coin+=ctx.price,A.applyFx(p,{fame:3,skill:{tactics:3},wil:1},ctx),`(+${ctx.price} suns)`),
            },
            lose: {r:"They break out at night, past you, and are gone.",fx:{happy:-5,wil:1}},
          },
          {t:"Pass on this one",r:"Three men did not come back. You would like to.",fx:{}},
        ],
      },
      {
        id: "av_bounty_innocent",
        cond: (p,C)=>C.adult(p)&&free(p)&&(p.flags.av_bhunter||C.prof(p,"tracking",50)),
        w: 1,
        cool: 8,
        title: `"I didn't do it"`,
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id},
        text: `{them}, tied on the back of your mule, has said the same thing for three days: "I didn't do it. Ask the miller's wife. Ask anyone." The reward is 40 suns.`,
        choices: [
          {
            t: "Hand {themHim} over; the court can decide",
            r: "You are paid. You hear later that the court decided quickly.",
            fx: {coin:40,happy:-4,wil:.5},
          },
          {
            t: "Ask the miller's wife",
            check: {s:"ins",s2:"intrigue",d:45},
            win: {
              r: "She turns white, then talks. It was her brother. You bring him in instead, and {them} goes home.",
              fx: {coin:40,honor:4,fame:2,them:{type:"friend",op:50}},
            },
            lose: {r:"She says nothing useful. You still do not know.",fx:{coin:40,happy:-3}},
          },
          {t:"Cut {themHim} loose",r:"No reward. You sleep well.",fx:{honor:2,them:{type:"friend",op:35}}},
        ],
      },
      {
        id: "av_framed",
        cond: (p,C)=>C.adult(p)&&free(p)&&!C.ruler(p),
        w: .8,
        cool: 12,
        title: "Framed",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"enemy").id,ctx.what=A.pick(["a silver chalice from the shrine","the reeve's strongbox","a dead man's purse","the lord's hawk"])},
        text: "The watch knocks at dawn. {what} has been found under your floorboards. You did not put it there. You know who did: {them}, who has hated you since last year.",
        choices: [
          {
            t: "Prove it was planted",
            check: {s:"int",s2:"intrigue",d:52},
            win: {
              r: "Mud on the boards from {theirHis} lane, a witness who saw {themHim} at your window. The court turns on {themHim}.",
              fx: {honor:3,fame:2,skill:{intrigue:3},them:{type:"enemy",op:-30}},
            },
            lose: {r:"The judge does not believe a word.",fx:{punish:"theft",fame:-2,wil:2}},
          },
          {
            t: "Call on friends to swear for you",
            req: (p,C)=>C.hasRel(p,"friend","bestfriend"),
            check: {s:"persuasion",s2:"wil",d:42},
            win: {
              r: "Four neighbors swear you were home. The case falls apart.",
              fx: {honor:1,rel:{who:"friend",op:10}},
            },
            lose: {r:"Your friends swear. The judge prefers the evidence.",fx:{punish:"theft"}},
          },
          {
            t: "Run before they hang it on you",
            check: {s:"spd",s2:"stealth",d:42},
            win: {
              r: "Out the back, over the wall, gone. But now you are what they said you were.",
              fx: {flag:"av_bounty",wil:1,happy:-6},
            },
            lose: {r:"They catch you in the lane. Running looks guilty.",fx:{prison:2,why:"theft",event:"av_ledger"}},
          },
        ],
      },
      {
        id: "av_crime_friend_ledger",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.hasRel(p,"friend","bestfriend")&&(crook(p)||C.town(p)),
        w: .8,
        cool: 10,
        title: "A friend in the ledger",
        setup: (p,ctx)=>{const f=A.relsOf(p,["bestfriend","friend"]).filter(x=>x.p.alive);ctx.pid=f.length?f[0].p.id:A.makeAcquaintance(p,"friend").id},
        text: "{them} is in the town gaol for a debt, or a fight, or a theft; the story keeps changing. The gaoler is fat and greedy. The wall at the back is old.",
        choices: [
          {
            t: "Bribe the gaoler",
            req: p=>p.coin>=30,
            check: {s:"persuasion",s2:"ins",d:40},
            win: {r:'Thirty suns, and {them} walks out "on a technicality".',fx:{coin:-30,them:{op:30}}},
            lose: {r:"He takes your money and doubles the price.",fx:{coin:-30,happy:-4}},
          },
          {
            t: "Break {themHim} out at night",
            check: {s:"stealth",s2:"str",d:52},
            win: {
              r: "A crowbar, a crumbling wall and a waiting horse. {them} will never forget it.",
              fx: {them:{type:"bestfriend",op:50},fame:2,flag:"av_bounty"},
            },
            lose: {
              r: "The night watch catches you with the crowbar.",
              fx: {prison:2,why:"aiding an escape",event:"av_ledger"},
            },
          },
          {
            t: "Bring food and wait it out",
            r: "Bread, cheese, a blanket. {them} serves the time and comes out thinner and grateful.",
            fx: {coin:-5,them:{op:15}},
          },
        ],
      },
      {
        id: "av_crime_forgers",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.realm(p,"POL-31","POL-03","POL-16")&&(crook(p)||J(p,"merchant","smith")),
        w: 1,
        cool: 9,
        title: "Bad coin",
        text: p=>p.realm==="POL-31"?"Forgers flood the Tessarian markets with bad Leontines. A man offers you a bag of them: a hundred face-value for 30 good suns. Tessar boils coin forgers in oil.":p.realm==="POL-03"?"A clipper offers you a bag of clipped silver and a pair of shears. Varenna hangs coin clippers.":'A forger in the arcade offers you a bag of "good" coin: a hundred face-value for 30 suns.',
        choices: [
          {
            t: "Buy and pass them carefully",
            req: p=>p.coin>=30,
            check: {s:"deception",s2:"trade",d:48},
            win: {
              r: "One here, two there, never twice at the same stall. You double your money.",
              fx: {coin:40,honor:-2,skill:{deception:3}},
            },
            lose: {r:"A money-changer bites one and calls the watch.",fx:{coin:-30,punish:"theft"}},
          },
          {
            t: "Inform the mint",
            r: "The mint pays a reward. The forger does not live to spend his.",
            fx: {coin:15,favor:3,honor:1},
          },
          {t:"Walk away",r:"Your neck is worth more than the bag.",fx:{}},
        ],
      },
      {
        id: "av_crime_horsethief",
        cond: (p,C)=>C.adult(p)&&free(p)&&!C.mounted(p)&&(crook(p)||C.prof(p,"riding",40))&&!C.rich(p),
        w: .9,
        cool: 9,
        title: "A fine horse",
        text: p=>`A fine bay gelding stands tied outside the ${A.pick(["inn","smithy","chapel"])}, saddle and all. Its owner is inside. ${p.realm==="POL-15"?"Morhaven hangs horse thieves at the gate.":"Horse thieves hang in most realms."}`,
        choices: [
          {
            t: "Untie it and ride",
            check: {s:"riding",s2:"stealth",d:48},
            win: {
              r: "Three villages away by nightfall. A good horse, a new life.",
              fx: {gear:{mount:"horse"},honor:-3,flag:"av_bounty"},
            },
            lose: {r:"The owner comes out early, with friends.",fx:{punish:"theft",health:-10,cause:"a beating"}},
          },
          {t:"Leave it",r:"You walk on. Your feet hurt, and your neck is fine.",fx:{}},
        ],
      },
      {
        id: "av_crime_cattle_raid",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.realm(p,"POL-13","POL-22","POL-11","POL-19","POL-34"),
        w: 1,
        cool: 7,
        title: "The raid",
        setup: (p,ctx)=>{ctx.beasts={"POL-19":"camels","POL-11":"horses","POL-34":"horses"}[p.realm]||"cattle"},
        text: "The young men are going over the ridge tonight to lift {beasts} from the next valley. It is half sport, half war, and all of the girls will hear who brought back the most.",
        choices: [
          {
            t: "Go with them",
            check: {s:"stealth",s2:"husbandry",d:45},
            win: {
              r: "You come home at dawn driving six beasts and singing. Your name is on every tongue.",
              fx: {coin:30,fame:2,happy:6,skill:{stealth:2,husbandry:2}},
            },
            lose: {
              r: "The other valley was waiting.",
              fx: {
                duel: {
                  tier: 2,
                  title: "an angry herdsman",
                  troop: "LI",
                  opts: {kind:"brawl",place:"a moonlit pasture",lethal:!1,toYield:!0,title:"The raid"},
                },
              },
            },
          },
          {
            t: "Lead them",
            req: (p,C)=>C.prof(p,"command",25)||C.prof(p,"tactics",25),
            check: {s:"tactics",s2:"command",d:48},
            win: {
              r: "Two parties, a feint at the upper fold, and the real raid at the lower. Twenty beasts and no blood.",
              fx: {coin:50,fame:3,skill:{tactics:3}},
            },
            lose: {r:"Your plan is too clever. Half the boys get lost.",fx:{fame:-1,happy:-4}},
          },
          {
            t: "Stay home and guard your own herd",
            r: "Their valley comes for yours next month, as it always does. You are ready.",
            fx: {skill:{husbandry:2}},
          },
        ],
      },
      {
        id: "av_crime_killing_offer",
        cond: (p,C)=>C.adult(p)&&free(p)&&(crook(p)||sword(p))&&C.town(p),
        w: .7,
        cool: 12,
        title: "A knife in the dark",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id},
        text: '{them} slides a purse across the table. "Fifteen suns. A man walks home along the tannery lane every night. He does not walk home tomorrow." Most hired knives are caught within a month, and most talk.',
        choices: [
          {t:"Refuse and leave",r:"You leave the purse on the table.",fx:{honor:1}},
          {
            t: "Warn the man",
            check: {s:"intrigue",s2:"stealth",d:42},
            win: {
              r: "He is a guild clerk who found the wrong numbers in a ledger. He leaves town that night, and sends you 20 suns from far away.",
              fx: {coin:20,honor:3,them:{type:"enemy",op:-40}},
            },
            lose: {r:"{them} learns that you warned him.",fx:{them:{type:"enemy",op:-50},flag:"av_bounty"}},
          },
          {
            t: "Take the purse",
            r: "You take it. In the lane, in the dark, you find you are what you are.",
            fx: (p,ctx)=>(p.coin+=15,A.addTrait(p,"cruel"),p.honor=Math.max(0,p.honor-15),A.chance(.5)?(A.applyFx(p,{punish:"murder"},ctx),"Within a month you are taken. The hired man always is."):"Nobody ever finds out. You find out, every night."),
          },
        ],
      },
      {
        id: "av_crime_retire",
        cond: (p,C)=>C.adult(p)&&free(p)&&J(p,"thief")&&(C.ageAdj(p)>30||p.coin>300),
        w: .8,
        cool: 12,
        title: "Going straight",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id},
        text: "You have enough put away for a small shop. The crew does not like people leaving: they know too much. {them}, the crew's heavy, comes to see you about it.",
        choices: [
          {
            t: "Buy your way out",
            req: p=>p.coin>=60,
            r: "Sixty suns, a drink and a promise of silence. You open a chandler's shop with the rest.",
            fx: {coin:-60,job:"merchant",unflag:"av_crew",happy:6},
          },
          {
            t: "Tell {themHim} you know where the bodies are buried",
            check: {s:"intimidation",s2:"intrigue",d:50},
            win: {
              r: '"Fair enough," {theyHe} says. You are left alone, carefully.',
              fx: {job:"merchant",unflag:"av_crew",skill:{intimidation:3}},
            },
            lose: {
              r: '"So do I." {theyHe} draws.',
              fx: {
                duel: {foe:"them",opts:{kind:"duel",place:"your new shop",lethal:!0,toYield:!0,title:"Leaving the crew"}},
              },
            },
          },
          {t:"Stay in the life",r:"One more job. There is always one more job.",fx:{perf:5}},
        ],
      },
      {
        id: "av_crime_street_kid",
        cond: (p,C)=>C.adult(p)&&free(p)&&crook(p)&&C.ageAdj(p)>20,
        w: .8,
        cool: 12,
        title: "A small hand in your pocket",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id},
        text: "A hand in your own pocket, of all things. You catch the wrist: {them}, a gutter child, all elbows and fury. Not bad. Not good either.",
        choices: [
          {
            t: "Teach {themHim} properly",
            r: "You show {themHim} the cant, the signals, the rules. {theyHe} learns fast. Too fast, maybe.",
            fx: {them:{type:"friend",op:35},skill:{stealth:2,persuasion:2},happy:3},
          },
          {
            t: "Take {themHim} to the temple orphanage",
            r: "The priests take {themHim} in. {theyHe} escapes in a week, but comes back sometimes for bread.",
            fx: {honor:2,them:{type:"friend",op:15},piety:1},
          },
          {t:"Box {theirHis} ears and let go",r:"{theyHe} spits and runs. Fair.",fx:{}},
        ],
      },
      {
        id: "av_crime_amber",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.realm(p,"POL-01")&&C.coast(p),
        w: 1,
        cool: 8,
        title: "The amber shore",
        text: "After a north-east gale, amber lies on the Cold Bay shore like honey on the sand. By law, every piece goes to the Kingsmere Amber Guild at the Guild's price. The shore families have their own law.",
        choices: [
          {
            t: "Gather and sell to the Guild",
            r: "A bucket of amber, a Guild price, a Guild clerk's sneer. Six suns.",
            fx: {coin:6,sta:.4},
          },
          {
            t: "Gather and sell to the shore families' buyer",
            check: {s:"stealth",s2:"trade",d:42},
            win: {
              r: "Three times the Guild price, paid in a fish-shed by lantern light.",
              fx: {coin:20,flag:"av_smuggler"},
            },
            lose: {r:"A Guild clerk who does not look away.",fx:{punish:"smuggling"}},
          },
          {
            t: "Inform on the buyer",
            r: "The Guild pays well for names. The shore families pay back in other ways.",
            fx: {coin:15,newRel:{type:"enemy",op:-30},honor:-1},
          },
        ],
      },
      {
        id: "av_crime_wreckers",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.coast(p)&&C.realm(p,"POL-08","POL-14","POL-09","POL-13"),
        w: .8,
        cool: 12,
        title: "False lights",
        text: p=>`Storm night. ${p.realm==="POL-14"?"Greyhaven hangs wreckers.":"Northreach men still strip stranded ships."} Some of the village men are carrying a lantern up to the headland, where a ship might mistake it for the harbor light.`,
        choices: [
          {
            t: "Go with them",
            r: "A cog breaks on the rocks. In the morning there is wine, cloth and timber on the beach, and bodies.",
            fx: {coin:40,honor:-6,happy:-6,piety:-3},
          },
          {
            t: "Put out their lantern",
            check: {s:"stealth",s2:"str",d:45},
            win: {
              r: "You smash it and run. The ship stands off and lives. The village never learns who.",
              fx: {honor:4,wil:1},
            },
            lose: {
              r: "They catch you at it.",
              fx: {health:-15,cause:"a beating on the headland",newRel:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Stay home and bar the door",
            r: "You hear the ship break up at dawn. You do not go down to the beach.",
            fx: {happy:-3},
          },
        ],
      },
      {
        id: "av_crime_old_crewmate",
        cond: (p,C)=>C.adult(p)&&free(p)&&(p.flags.av_crew||p.flags.av_smuggler||p.flags.av_bounty||C.famKind(p,"outlaw")||C.prof(p,"stealth",50))&&!J(p,"thief"),
        w: 1,
        cool: 10,
        title: "An old face",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id},
        text: `{them} from the old days turns up at your door, thinner, with a cough and a grin. "You've done well. Respectable. Be a shame if people knew." {theyHe} wants 30 suns. Then more, later.`,
        choices: [
          {t:"Pay",req:p=>p.coin>=30,r:"You pay. {theyHe} will be back.",fx:{coin:-30,happy:-5}},
          {
            t: "Call {theirHis} bluff",
            check: {s:"wil",s2:"intimidation",d:48},
            win: {
              r: `"Tell them. I'll tell them about you." {theyHe} leaves, and does not come back.`,
              fx: {wil:1.5,them:{type:"enemy",op:-20}},
            },
            lose: {r:"{theyHe} tells. People look at you differently now.",fx:{fame:-2,honor:-4,happy:-6}},
          },
          {
            t: "Help {themHim} instead",
            r: "A meal, a bed, a doctor for the cough. {theyHe} cries. Blackmail is a poor man's trade.",
            fx: {coin:-10,honor:2,them:{type:"friend",op:40}},
          },
        ],
      },
      {
        id: "av_crime_cant",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.coast(p)&&crook(p)&&!p.langs.includes("Corsair cant"),
        w: .8,
        once: !0,
        title: "The cant",
        text: "On the docks they talk in a language that is not quite a language: a purse is a fish, an informer a lamp, a sun a face, the gallows the tall widow, and to drink with the Queen is to drown. You keep missing jokes that might get you killed.",
        choices: [
          {
            t: "Learn it from an old docker",
            r: "A month of beer and patience. Now you hear everything.",
            fx: {lang:"Corsair cant",skill:{intrigue:2,deception:2},coin:-4},
          },
          {
            t: "Fake it",
            check: {s:"deception",s2:"int",d:45},
            win: {r:"You nod in the right places. Good enough, for now.",fx:{skill:{deception:2}}},
            lose: {r:'You call a watchman "wet" to his face.',fx:{health:-6,cause:"a slap",happy:-3}},
          },
        ],
      },
      {
        id: "av_sea_pressed",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.coast(p)&&!C.noble(p)&&!J(p,"pirate","sailor")&&!p.mil&&(C.poor(p)||p.debt>0),
        w: .9,
        cool: 12,
        title: "The press",
        text: p=>p.realm==="POL-25"?"In Velgrad a debtor can be bound to row the toll galleys. The bailiff comes with a chain and a paper with your name on it.":"You wake in a dark hold that stinks of bilge, with a lump on your head. Last night's friendly sailors bought you three drinks too many. The galley is already at sea.",
        choices: [
          {
            t: "Take the oar and endure",
            r: "Blisters, then calluses, then a back like a bull's. A season at the bench, then the shore.",
            fx: {str:1.5,sta:1.5,wil:2,health:-8,happy:-10,skill:{sea:4},flag:"av_galley",cause:"the galley bench"},
          },
          {
            t: "Fight the oar-master",
            r: "You get one good punch in.",
            fx: {
              duel: {
                tier: 2,
                title: "the oar-master",
                troop: "SL",
                opts: {kind:"brawl",place:"the rowing deck",lethal:!1,toYield:!0,title:"The oar-master"},
              },
              flag: "av_galley",
            },
          },
          {
            t: "Jump at the first sight of land",
            check: {s:"athletics",s2:"sea",d:50},
            win: {r:"Over the side at dusk, a long swim, a beach. Free.",fx:{skill:{athletics:3},wil:1}},
            lose: {
              r: "They fish you out with a boathook and flog you for it.",
              fx: {health:-15,wil:2,flag:"av_galley",wound:"back",cause:"a flogging"},
            },
          },
        ],
      },
      {
        id: "av_sea_bench",
        cond: (p,C)=>C.adult(p)&&!p.prison&&(p.flags.av_galley||p.flags.unfree==="slave"&&C.coast(p))&&!p.flags.av_freedoar,
        w: 1.2,
        cool: 4,
        title: "At the bench",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"friend").id},
        text: "Three men to an oar, chained at the ankle. The drum sets the stroke. {them}, chained beside you, whispers that on Share Day at Blackreef a galley slave named Tam Oarsman won his freedom with one throw of the dice, and now the Freed Oars sail their own ship.",
        choices: [
          {
            t: "Pull, and keep {them} alive",
            r: "You share water, you take {theirHis} stroke when {theyHe} faints. You both live through the season.",
            fx: {sta:1,str:.8,wil:1.5,them:{type:"bestfriend",op:40}},
          },
          {
            t: "Plan to take the ship with the others",
            check: {s:"command",s2:"intrigue",d:58},
            win: {
              r: "One night the chains come off at once. By morning the galley is yours, and you steer for Blackreef, where nobody asks.",
              fx: (p,ctx)=>(p.flags.unfree&&(delete p.flags.unfree,A.ach("freed")),A.applyFx(p,{unflag:"av_galley",flag:"av_freedoar",fame:5,job:"pirate",deed:"Led a galley-slave rising",epithet:"Oarbreaker"},ctx)),
            },
            lose: {
              r: "Someone talks. The ringleaders hang from the yard. You are flogged and live.",
              fx: {health:-20,wil:3,wound:"back",cause:"a flogging"},
            },
          },
          {
            t: "Keep your head down and count the days",
            r: "Day after day after day. You are stronger than you were. You are less than you were.",
            fx: {str:1,wil:2,happy:-6},
          },
        ],
      },
      {
        id: "av_sea_wreck",
        cond: (p,C)=>C.adult(p)&&free(p)&&salt(p),
        w: 1,
        cool: 10,
        title: "Shipwreck",
        text: p=>`The ship strikes ${A.pick(["an uncharted reef","the rocks in a gale","a shoal in the fog"])} with a sound like a barn falling down. Water pours into the hold. The boat is already full of the captain's friends.`,
        choices: [
          {
            t: "Cling to a spar and kick for shore",
            check: {s:"sea",s2:"sta",d:48},
            win: {
              r: "A night in the water, a morning on the sand. You count the faces that wash up with you.",
              fx: {wil:2,sta:1,skill:{sea:3},coinPct:-.5,deed:"Survived a shipwreck"},
            },
            lose: {
              r: "The cold takes you down twice. You wake on a beach that is not on any chart.",
              fx: {health:-20,wil:2,coinPct:-.6,event:"av_sea_castaway",cause:"the sea"},
            },
          },
          {
            t: "Save the ship's boy who cannot swim",
            check: {s:"athletics",s2:"wil",d:52},
            win: {
              r: "You tow him all night. At dawn you both crawl ashore. He follows you like a dog for a year.",
              fx: {honor:4,fame:2,wil:2,newRel:{type:"friend",op:50},coinPct:-.5},
            },
            lose: {
              r: "The sea takes him from your hands. You live. You wish you had held on.",
              fx: {wil:3,happy:-10,coinPct:-.5,health:-10,cause:"the sea"},
            },
          },
          {
            t: "Grab the strongbox and jump",
            check: {s:"str",s2:"sea",d:55},
            win: {
              r: "It floats, barely. You come ashore with your arms round the captain's money.",
              fx: {coin:120,honor:-2},
            },
            lose: {r:"It drags you down. You let go just in time.",fx:{health:-18,coinPct:-.6,cause:"drowning"}},
          },
        ],
      },
      {
        id: "av_sea_castaway",
        trigger: !0,
        title: "The island",
        text: "An island: a beach, a hill, palms or pines, a spring if you can find it, and no sails on any horizon. You have a knife, your shirt and a dead man's boots.",
        choices: [
          {
            t: "Build a signal fire on the hill and wait",
            check: {s:"survival",s2:"wil",d:45},
            win: {
              r: "Forty days of crabs and rain. On the forty-first, a fishing boat sees your smoke.",
              fx: {wil:3,skill:{survival:4},flag:"av_castaway",deed:"Lived forty days on a desert island"},
            },
            lose: {
              r: "A season. Then a second. When the ship comes you have forgotten how to speak to people.",
              fx: {wil:4,health:-15,happy:-10,flag:"av_castaway",skill:{survival:6},cause:"hunger on the island"},
            },
          },
          {
            t: "Build a raft",
            check: {s:"craft",s2:"sea",d:52},
            win: {
              r: "Driftwood, vines, a sail of your shirt. Three days to a coast with a fishing village.",
              fx: {skill:{craft:3,sea:4},wil:2,fame:2},
            },
            lose: {
              r: "The raft breaks up in the surf. You swim back to the island and start again.",
              fx: {health:-10,wil:2,flag:"av_castaway",cause:"the surf"},
            },
          },
          {
            t: "Explore the island",
            check: {s:"tracking",s2:"survival",d:42},
            win: {
              r: "A cave with old ashes, broken jars and a dead man's scratched calendar. And a buried purse he never spent.",
              fx: {coin:60,wil:1.5},
            },
            lose: {r:"A cut foot that festers.",fx:{health:-12,cause:"a festering wound"}},
          },
        ],
      },
      {
        id: "av_sea_isleturtle",
        cond: (p,C)=>C.adult(p)&&free(p)&&salt(p)&&!C.terr(p,"tundra"),
        w: .7,
        cool: 15,
        title: "The island that sank",
        text: "A low, ridged island floats off the bow, rubbery and grey, five metres long. The crew want to tie up and rest on it. Sailors tell of landing on an island that sank beneath them.",
        choices: [
          {
            t: "Warn them: it is a turtle",
            check: {s:"sea",s2:"persuasion",d:40},
            win: {
              r: "A giant leathery turtle warming itself. As you speak, it lifts its head, and dives. Nobody was standing on it.",
              fx: {fame:1,skill:{sea:2},int:.5},
            },
            lose: {r:"They laugh. Two men step onto it. It dives. You pull one out.",fx:{happy:-5,wil:1}},
          },
          {
            t: "Step onto it yourself",
            r: "It dives. You go down with it and come up spitting. The crew laugh for a week.",
            fx: {health:-5,happy:-2,cause:"cold water"},
          },
        ],
      },
      {
        id: "av_sea_kraken",
        cond: (p,C)=>C.adult(p)&&C.coast(p),
        w: .6,
        cool: 15,
        title: "The kraken on the beach",
        text: "A thing has washed up on the shingle: a squid as long as a ship, with eyes like serving plates and arms lined with toothed suckers. The priest says it is an omen. Fishermen say krakens drag ships down.",
        choices: [
          {
            t: "Measure it and think",
            check: {s:"learning",s2:"int",d:40},
            win: {
              r: "Its sucker marks match the round scars on whales' heads. It lives deep, fights whales, and dies in warm surface water. It never dragged a ship anywhere.",
              fx: {int:1,skill:{learning:3}},
            },
            lose: {r:"It smells too bad to think near.",fx:{}},
          },
          {
            t: "Cut a piece to sell as a curiosity",
            r: "A sucker the size of a plate sells for 8 suns to an apothecary.",
            fx: {coin:8},
          },
          {t:"Let the priest bless it and burn it",r:"A great stink and a fine sermon.",fx:{piety:2}},
        ],
      },
      {
        id: "av_sea_ironjaw",
        cond: (p,C)=>C.adult(p)&&free(p)&&salt(p)&&C.realm(p,"POL-33","POL-03","POL-04","POL-16","POL-24","POL-17","POL-02"),
        w: .8,
        cool: 12,
        title: "Old Ironjaw",
        setup: (p,ctx)=>{ctx.beast="CRE-09"},
        text: "A spout off the bow, then a back like a capsized hull, scarred white. Old Ironjaw, the Grey Leviathan that has rammed and sunk four ships near the Strait of Hael since 1088. Western insurance is eight in a hundred because of him. He turns toward you.",
        choices: [
          {
            t: "Turn away and run before the wind",
            check: {s:"sea",s2:"ins",d:50},
            win: {
              r: "He was hunting, not hating. You crossed his path and left it. He sounds and is gone.",
              fx: {skill:{sea:4},fame:1},
            },
            lose: {
              r: "He hits the stern. The rudder is gone, three men are gone, and the ship limps for a month.",
              fx: {health:-15,wil:2,coinPct:-.2,cause:"Old Ironjaw"},
            },
          },
          {
            t: "Get to the shallows, where he will not follow",
            check: {s:"sea",s2:"int",d:45},
            win: {
              r: "He avoids shallow water. You knew that. The crew now think you are a sea-witch.",
              fx: {fame:2,skill:{sea:3}},
            },
            lose: {r:"Too far. You make it, but the hull is sprung.",fx:{coinPct:-.15,happy:-4}},
          },
          {
            t: "Man the harpoons",
            req: (p,C)=>C.prof(p,"throwing",40)||C.prof(p,"sea",55),
            check: {s:"throwing",s2:"str",d:60},
            win: {
              r: "Three irons in him, from three boats. He bleeds, he dives, he breaks the lines. Nobody kills Old Ironjaw. But nobody has hurt him like that, either.",
              fx: {fame:5,skill:{throwing:4},deed:"Put three irons into Old Ironjaw"},
            },
            lose: {
              r: "The line runs out and takes your hand with it.",
              fx: {wound:"lost_fingers",health:-18,wil:2,cause:"a harpoon line"},
            },
          },
        ],
      },
      {
        id: "av_sea_serpent",
        cond: (p,C)=>C.adult(p)&&C.coast(p)&&C.realm(p,"POL-04","POL-02","POL-03","POL-16","POL-15","POL-17","POL-18","POL-24","POL-33"),
        w: .7,
        cool: 12,
        title: "The serpent of the Middle Sea",
        text: "A silver ribbon ten metres long with a red crest rises beside the boat, slow as a dream. The old sailors go pale. The Middle Sea serpent: it foretells earthquakes. They saw three before the Morhaven quake of 1039.",
        choices: [
          {
            t: "Reach out and touch it",
            r: "Cold, smooth, scaleless. A fish, a huge, harmless fish. It slides away into the deep.",
            fx: {happy:5,int:.5,deed:"Touched the Middle Sea serpent"},
          },
          {
            t: "Warn the town of the earthquake",
            r: "The town spends a week sleeping in the fields. No earthquake comes. The priests call it a mercy.",
            fx: {piety:2,fame:-1},
          },
          {
            t: "Shrug; it is just a fish",
            r: "The old sailors watch you all season, waiting for the ground to shake.",
            fx: {},
          },
        ],
      },
      {
        id: "av_sea_drakes",
        cond: (p,C)=>C.adult(p)&&free(p)&&salt(p),
        w: .9,
        cool: 9,
        title: "Sea drakes",
        text: "Three sea drakes follow the ship: long narrow wings like an albatross's, ten metres across, combs of teeth for catching fish. Sailors say killing one brings a storm. A passenger is loading a crossbow.",
        choices: [
          {
            t: "Stop him",
            check: {s:"intimidation",s2:"persuasion",d:40},
            win: {
              r: "The crossbow goes over the side, and nearly the passenger. The crew buys you a drink.",
              fx: {fame:1,skill:{intimidation:2}},
            },
            lose: {
              r: "He shoots. One drake falls into the sea. Three days later a storm comes, as storms do. The crew blames him, and you.",
              fx: {happy:-4,health:-6,cause:"a storm"},
            },
          },
          {
            t: "Throw them fish scraps",
            r: "They swoop and squabble all afternoon. It is the best day of the voyage.",
            fx: {happy:4},
          },
          {t:"Let him shoot",r:"He misses, as it happens. Nobody likes him anyway.",fx:{}},
        ],
      },
      {
        id: "av_sea_orcas",
        cond: (p,C)=>C.adult(p)&&C.coast(p)&&C.realm(p,"POL-08","POL-01","POL-14","POL-09","POL-23","POL-26","POL-25"),
        w: .8,
        cool: 10,
        title: "Wolves of the Sea",
        text: "Black-and-white backs break the water around your boat: a pod of the Wolves of the Sea, fifteen strong, curious. Northreach sailors believe they are the dead of the Sea King's hall and must not be harmed. Your boatmate reaches for a spear.",
        choices: [
          {
            t: "Grab his arm",
            r: "They circle, spout, and go. Your boatmate sulks, and lives.",
            fx: {piety:2,happy:3},
          },
          {
            t: "Let them guide you",
            check: {s:"sea",s2:"ins",d:40},
            win: {r:"Where they hunt, the fish are. You fill the boat.",fx:{coin:12,skill:{sea:3}}},
            lose: {
              r: "They swim too fast. You follow too far and are caught by the tide.",
              fx: {health:-6,cause:"the tide"},
            },
          },
        ],
      },
      {
        id: "av_sea_spidercrab",
        cond: (p,C)=>C.adult(p)&&C.coast(p)&&(J(p,"fish","sailor","pirate")||salt(p)),
        w: .8,
        cool: 10,
        title: "The thing in the pot",
        text: "The crab pot comes up heavy. Inside: legs, legs, legs, spanning more than your arms can reach. A spider crab. The old men say they drag fishermen down to drown.",
        choices: [
          {
            t: "Haul it in and sell it",
            r: "Harmless, slow and tasty. A tavern keeper pays 6 suns and hangs a leg over his bar.",
            fx: {coin:6,happy:2},
          },
          {t:"Throw it back for luck",r:"The old men nod. Good luck is good luck.",fx:{piety:1}},
        ],
      },
      {
        id: "av_sea_blackmaw",
        cond: (p,C)=>C.adult(p)&&C.coast(p)&&(salt(p)||C.realm(p,"POL-32","POL-24","POL-21")),
        w: .6,
        cool: 15,
        title: "The Black Maw",
        text: "A whale thrashes on the surface, bleeding. Then a fin comes up beside it, taller than a man, and a mouth you could stand in closes on the whale's flank. Northerners say the Black Maw died out ages ago; they sell its fossil teeth as charms.",
        choices: [
          {
            t: "Row away, very quietly",
            r: "You row. You do not stop rowing until the harbor. Nobody believes you, of course.",
            fx: {wil:1.5,happy:-2,deed:"Saw the Black Maw take a whale"},
          },
          {
            t: "Wait and collect what the Maw leaves",
            check: {s:"wil",s2:"sea",d:52},
            win: {
              r: "When it is gone, you tow in whale meat and blubber worth 50 suns, and a tooth as long as your hand caught in the flesh.",
              fx: {coin:50,wil:2,fame:2},
            },
            lose: {
              r: "It comes back. It bumps the boat, once, and goes. You are not the same afterward.",
              fx: {wil:3,happy:-6,trait:"paranoid"},
            },
          },
        ],
      },
      {
        id: "av_sea_mutiny",
        cond: (p,C)=>C.adult(p)&&free(p)&&(J(p,"sailor","pirate")||salt(p)&&C.coast(p)),
        w: 1,
        cool: 10,
        title: "Mutiny",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id},
        text: 'The captain has flogged a boy to death for a stolen biscuit and cut the water ration to a cup. In the forecastle, {them} shows you a knife. "Tonight. Are you in?"',
        choices: [
          {
            t: "Join the mutiny",
            check: {s:"ins",s2:"melee",d:48},
            win: {
              r: "Quick and almost bloodless. The captain goes into the boat with a cask of water. The crew elects you mate.",
              fx: {fame:3,perf:10,them:{type:"friend",op:30},flag:"av_mutineer"},
            },
            lose: {
              r: "The officers were waiting.",
              fx: {
                duel: {
                  tier: 3,
                  title: "the ship's mate",
                  troop: "HI",
                  opts: {kind:"duel",place:"a pitching deck at night",lethal:!0,toYield:!1,title:"Mutiny"},
                },
              },
            },
          },
          {
            t: "Warn the captain",
            r: "The ringleaders hang from the yard. The captain gives you their share. The crew never speaks to you again.",
            fx: {coin:30,perf:8,honor:-3,them:{type:"enemy",op:-60},happy:-6},
          },
          {
            t: "Talk the captain into mercy",
            check: {s:"persuasion",s2:"wil",d:55},
            win: {
              r: "You tell him what is coming. He is a fool, but not a complete one. Full rations. No more floggings. No mutiny.",
              fx: {honor:3,fame:2,skill:{persuasion:3}},
            },
            lose: {
              r: "He has you flogged for insolence. That night, the mutiny happens without you.",
              fx: {health:-12,wound:"back",wil:2,cause:"a flogging"},
            },
          },
        ],
      },
      {
        id: "av_sea_articles",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.coast(p)&&!J(p,"pirate")&&(C.realm(p,"POL-33")||C.famKind(p,"sea","outlaw")||crook(p)&&salt(p)),
        w: 1,
        cool: 10,
        title: "The Articles of Blackreef",
        text: `A corsair captain is signing men at the harbor. The Articles of Blackreef: share and share alike, a vote on every captain, a cripple's share for a lost limb, and the dice thrown before every raid. "Make your mark."`,
        choices: [
          {
            t: "Make your mark",
            r: "You are a corsair now. You pour wine to the Drowned Queen and get a gold earring to pay her, should you need it.",
            fx: {job:"pirate",skill:{sea:3},happy:4,flag:"av_corsair",piety:1},
          },
          {
            t: "Ask about the cripple's share first",
            r: `"Six hundred for a right arm, five for a left, a hundred for an eye." He grins. "It's honest work." You sign.`,
            fx: {job:"pirate",flag:"av_corsair",int:.3},
          },
          {t:"Walk away",r:`He calls after you, "The sea's still there when you're ready."`,fx:{}},
        ],
      },
      {
        id: "av_sea_shareday",
        cond: (p,C)=>C.adult(p)&&free(p)&&(J(p,"pirate")||C.realm(p,"POL-33")&&salt(p)),
        w: 1.2,
        cool: 5,
        title: "Share Day",
        text: "Share Day after a great prize: the whole Brotherhood on the beach at Ratrock, the loot in heaps, the shares counted aloud. Ima Redsail is counting votes to unseat Captain-General Nell Brine and go back to open raiding. Both sides want your voice.",
        choices: [
          {
            t: "Vote for Nell Brine and the toll",
            r: "The dragon toll is safe money: one in forty from every merchant through the strait. Nell keeps the chair. Your share is steady.",
            fx: {coin:40,honor:1,perf:4},
          },
          {
            t: "Vote for Ima Redsail and the old ways",
            r: "Ima wants raids, not tolls, and no fifth for the Lucernan families. The beach roars. Whatever happens, you chose.",
            fx: {coin:30,fame:1,happy:3,flag:"av_redsail"},
          },
          {
            t: "Sell your vote",
            check: {s:"intrigue",s2:"trade",d:45},
            win: {
              r: "Grusk Tallyman pays twelve suns for it and you vote as he likes.",
              fx: {coin:52,honor:-2,skill:{intrigue:2}},
            },
            lose: {r:"Both sides find out you tried to sell to both sides.",fx:{coin:25,fame:-2,happy:-4}},
          },
          {
            t: "Throw for your share at the Shrine of the Dice",
            req: (p,C)=>p.coin>=10,
            check: {s:"gambling",s2:"ins",d:50},
            win: {r:"Double or nothing, and the luck-gods love you today.",fx:{coin:80,happy:6}},
            lose: {r:"Nothing. The luck-gods are fickle.",fx:{coin:-10,happy:-5}},
          },
        ],
      },
      {
        id: "av_sea_dragonnight",
        cond: (p,C)=>C.adult(p)&&free(p)&&(J(p,"pirate")||p.flags.av_fireoil)&&!p.flags.av_dragonsecret,
        w: .8,
        cool: 10,
        title: "Dragon Night",
        text: "Twelfth of July: Dragon Night. The Brotherhood sings of the fire-dragon sixty metres long that rose from the Strait of Hael for Mag Brine in 1051. Late, very drunk, an old quartermaster beckons you down to the hold and lifts a tarpaulin. Clay jars. The smell of fire-oil.",
        choices: [
          {
            t: "Swear to keep the secret",
            r: "Forty pirates know it. Now forty-one. There never was a dragon: there was Sabran fire-oil burned on the water, and merchants who have paid the dragon toll ever since.",
            fx: {flag:"av_dragonsecret",int:.6,perf:8},
          },
          {
            t: "Think about what Lucerna would pay for this",
            check: {s:"intrigue",s2:"wil",d:55},
            win: {
              r: "You hold the thought, and the secret, for the right day. A secret like this is a fortune.",
              fx: {flag:"av_dragonsecret",skill:{intrigue:3}},
            },
            lose: {
              r: 'The quartermaster sees it in your face. "Forty know it. Forty-one is one too many." His knife is already out.',
              fx: {
                duel: {
                  tier: 3,
                  title: "the old quartermaster",
                  troop: "HI",
                  opts: {kind:"duel",place:"a ship's hold",lethal:!0,toYield:!1,title:"Dragon Night"},
                },
              },
            },
          },
        ],
      },
      {
        id: "av_sea_prize",
        cond: (p,C)=>C.adult(p)&&free(p)&&J(p,"pirate"),
        w: 1.3,
        cool: 4,
        title: "A fat prize",
        text: p=>`A ${A.pick(["Lucernan grain cog","Varennan wine ship","Qadiri paper hulk","Ostran spice galley"])} strikes her colours after one volley. Her crew kneels on the deck. Her master is begging. The crew looks to see what you will do.`,
        choices: [
          {
            t: "Take the cargo, spare the crew",
            r: "Cargo, purses, the master's good boots. The crew rows home in their own boat and tells the story right.",
            fx: {coin:60,perf:6,honor:1},
          },
          {
            t: "Hold the master for ransom",
            check: {s:"intimidation",s2:"trade",d:45},
            win: {r:"His guild pays 300 suns for him. A good season.",fx:{coin:100,perf:10,fame:1}},
            lose: {r:"He dies of fever in the hold before the ransom comes.",fx:{coin:20,happy:-4}},
          },
          {
            t: "Make an example: burn her",
            r: "Smoke on the horizon for a day. The next merchant pays the toll without arguing.",
            fx: {coin:50,perf:8,honor:-5,fame:2,trait:"cruel"},
          },
        ],
      },
      {
        id: "av_sea_boarding",
        cond: (p,C)=>C.adult(p)&&free(p)&&(J(p,"pirate")||(J(p,"sailor")||salt(p)&&C.coast(p))&&C.gear(p,"weapon")),
        w: 1,
        cool: 6,
        title: "Over the rail",
        text: p=>J(p,"pirate")?"The grapnels bite. The merchant's marines line the rail with spears. Somebody has to go first.":"Corsairs are coming over the rail with axes. The master shouts for every man.",
        choices: [
          {
            t: "Go over first",
            r: "You leap the gap between the ships.",
            fx: {
              duel: {
                tier: 3,
                title: "a marine",
                troop: "SP",
                opts: {kind:"duel",place:"a rolling deck",lethal:!0,toYield:!1,title:"Boarding"},
              },
              fame: 1,
              perf: 5,
            },
          },
          {
            t: "Throw first, fight second",
            req: (p,C)=>C.gear(p,"ranged","javelins","throwaxes","knives")||C.prof(p,"throwing",40),
            check: {s:"throwing",s2:"ins",d:48},
            win: {
              r: "Two of them go down before the ships touch. The rest break.",
              fx: {fame:2,skill:{throwing:3},perf:6},
            },
            lose: {
              r: "You miss, and they come over.",
              fx: {
                duel: {
                  tier: 3,
                  title: "a boarder",
                  troop: "AX",
                  opts: {kind:"duel",place:"a rolling deck",lethal:!0,toYield:!1,title:"Boarders"},
                },
              },
            },
          },
          {
            t: "Hang back with the second wave",
            r: "You come over when it is nearly done. Nobody notices. Somebody might.",
            fx: {perf:-4},
          },
        ],
      },
      {
        id: "av_sea_marooned",
        cond: (p,C)=>C.adult(p)&&free(p)&&J(p,"pirate"),
        w: .6,
        cool: 15,
        title: "Marooned",
        text: "The crew votes. You lost: a quarrel over a share, a word to the wrong man, a vote for the losing captain. The penalty is a rock, a bottle of water and the clothes you stand in.",
        choices: [
          {
            t: "Endure the rock",
            check: {s:"survival",s2:"wil",d:45},
            win: {
              r: "A week of seabirds' eggs and rainwater. A fishing boat takes you off.",
              fx: {wil:3,skill:{survival:3}},
            },
            lose: {
              r: "Ten days, no rain. You are half dead when they find you.",
              fx: {health:-25,wil:4,cause:"thirst on a rock"},
            },
          },
          {
            t: "Argue the vote before they row off",
            check: {s:"persuasion",s2:"diplomacy",d:52},
            win: {
              r: "You speak, they vote again, you row back with them. The Articles are the Articles.",
              fx: {skill:{persuasion:4},fame:2},
            },
            lose: {r:"They row off laughing.",fx:{event:"av_sea_castaway"}},
          },
        ],
      },
      {
        id: "av_sea_voyage",
        cond: (p,C)=>C.adult(p)&&free(p)&&(J(p,"merchant")||C.famKind(p,"merchant","sea"))&&p.coin>=50,
        w: 1.1,
        cool: 6,
        title: "A share in a voyage",
        setup: (p,ctx)=>{const v=A.pick([["the Spice Sea","cloves and nutmeg from Amberport","the scales at Amberport take a fifth"],["the Grey Channel","furs, amber and tar from the north","the channel toll eats a slice"],["the Middle Sea lanes","grain and oil for Lucerna","the Staple takes one bushel in twenty"],["the Tin Road","tin and walrus ivory","the Tin Reeves want their tenth"],["the Western Approach","wine and cloth past the Strait of Hael","the dragon toll is one in forty, and Old Ironjaw is out there"]]);ctx.route=v[0],ctx.goods=v[1],ctx.risk=v[2]},
        text: "A ship's master is selling shares in a voyage on {route}: {goods}. Fifty suns a share. {risk}. Open-sea sailing is from Sea Opening to Sea Closing.",
        choices: [
          {
            t: "Buy one share",
            check: {s:"trade",s2:"ins",d:40},
            win: {
              r: "She comes home in October, low in the water. Your fifty becomes a hundred and ten.",
              fx: {coin:60,skill:{trade:3}},
            },
            lose: {
              r: "She does not come home. Storm, pirates, or the leviathan; nobody knows.",
              fx: {coin:-50,happy:-5,wil:.5},
            },
          },
          {
            t: "Sail with your goods yourself",
            check: {s:"trade",s2:"sea",d:48},
            win: {
              r: "You buy cheap at the far end with your own eyes and sell dear at home. A fine season.",
              fx: {coin:110,skill:{trade:3,sea:3},perf:8},
            },
            lose: {r:"A gale, a jettisoned cargo, a lean winter.",fx:{coin:-50,sta:.6,wil:1}},
          },
          {t:"Keep your money ashore",r:"Safe, and small.",fx:{}},
        ],
      },
      {
        id: "av_sea_jettison",
        cond: (p,C)=>C.adult(p)&&free(p)&&(J(p,"merchant","sailor")||salt(p))&&C.coast(p),
        w: .9,
        cool: 8,
        title: "Lighten ship",
        text: "A gale off a lee shore. The master shouts to lighten ship: the cargo must go over the side, and some of it is yours.",
        choices: [
          {
            t: "Throw your own goods first",
            r: "Bales and barrels into the black water. The ship rides higher, and lives. The master remembers who went first.",
            fx: {coin:-30,honor:3,wil:1,newRel:{type:"friend",op:25}},
          },
          {
            t: "Argue for other men's cargo",
            check: {s:"persuasion",s2:"intimidation",d:48},
            win: {r:"The wool goes, not your wine. Selfish, and it works.",fx:{honor:-2,skill:{persuasion:2}}},
            lose: {r:"They throw yours, and you nearly with it.",fx:{coin:-40,health:-5,cause:"a fall in a storm"}},
          },
          {
            t: "Help sail her off the shore instead",
            check: {s:"sea",s2:"sta",d:52},
            win: {
              r: "You and the bosun claw her off with a scrap of sail. Nobody's goods go over.",
              fx: {fame:2,skill:{sea:4}},
            },
            lose: {r:"Too late. The cargo goes, all of it.",fx:{coin:-35}},
          },
        ],
      },
      {
        id: "av_sea_becalmed",
        cond: (p,C)=>C.adult(p)&&free(p)&&salt(p),
        w: 1,
        cool: 8,
        title: "Becalmed",
        text: "No wind for nine days. The sea is glass, the sails hang dead, and the water casks are a third full. Men are starting to look at each other.",
        choices: [
          {
            t: "Put the boats out and tow",
            check: {s:"command",s2:"sta",d:45},
            win: {
              r: "Rowing in turns, a mile an hour, until a breeze finds you on the twelfth day.",
              fx: {skill:{command:3},sta:1,wil:1},
            },
            lose: {
              r: "Men faint at the oars. The water runs out before the wind comes.",
              fx: {health:-15,wil:2,cause:"thirst at sea"},
            },
          },
          {
            t: "Ration the water fairly, yourself included",
            r: "A cup a day. You hold to it. When the wind comes the crew would follow you anywhere.",
            fx: {wil:2,honor:2,health:-8,cause:"thirst"},
          },
          {
            t: "Steal water at night",
            check: {s:"stealth",s2:"ins",d:45},
            win: {r:"You live well while others suffer. Nobody knows.",fx:{honor:-4,health:4}},
            lose: {
              r: "Caught at the cask. The crew votes for the rope's end.",
              fx: {health:-20,wound:"back",fame:-2,cause:"a flogging"},
            },
          },
        ],
      },
      {
        id: "av_sea_plagueship",
        cond: (p,C)=>C.adult(p)&&C.coast(p)&&(salt(p)||C.town(p)),
        w: .7,
        cool: 15,
        title: "A forty-day",
        text: "A ship anchors outside the harbor flying the yellow cloth. A forty-day, in the cant: a plague ship, kept off for forty days. At night, boats creep out to her to sell bread at ten times the price, and come back with who-knows-what.",
        choices: [
          {
            t: "Row out with food anyway, for nothing",
            check: {s:"sta",s2:"medicine",d:45},
            win: {
              r: "You leave the bread on her ladder and never touch a hand. You do not fall sick. They remember your boat.",
              fx: {honor:4,piety:3,fame:1},
            },
            lose: {
              r: "A fever takes you a week later. You live through it, barely.",
              fx: {health:-30,wil:2,piety:3,cause:"ship fever"},
            },
          },
          {
            t: "Row out and sell bread at ten times the price",
            check: {s:"sta",s2:"trade",d:45},
            win: {r:"Forty suns in a week. You scrub your hands raw every night.",fx:{coin:40,honor:-2}},
            lose: {r:"You bring the fever home.",fx:{coin:20,health:-30,cause:"ship fever"}},
          },
          {
            t: "Stay well away",
            r: "Forty days. Then the yellow cloth comes down, and half her crew walks ashore.",
            fx: {},
          },
        ],
      },
      {
        id: "av_sea_pearls",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.coast(p)&&C.realm(p,"POL-24","POL-32","POL-17","POL-21","POL-30"),
        w: 1,
        cool: 8,
        title: "The pearl beds",
        text: "A free diver keeps a share of what he brings up, after the Emir's best pearl. The beds lie six fathoms down. Your lungs burn just thinking about it.",
        choices: [
          {
            t: "Dive",
            check: {s:"sea",s2:"sta",d:48},
            win: {
              r: p=>`A shell the size of your palm, and inside it ${A.pick(["a rose-colored pearl","a perfect white pearl","a black pearl, rare as honesty"])}. Not the Emir's best, so yours.`,
              fx: {coin:60,skill:{sea:4},sta:.8},
            },
            lose: {
              r: "You come up too fast. Blood from your ears, and a ringing for a month.",
              fx: {health:-12,wound:"ear",cause:"diving"},
            },
          },
          {
            t: "Hide the best pearl from the Emir's man",
            req: (p,C)=>crook(p)||C.trait(p,"greedy"),
            check: {s:"deception",s2:"stealth",d:52},
            win: {
              r: "Under your tongue, past the counter. You sell it in another port for 200 suns.",
              fx: {coin:200,honor:-2,flag:"av_smuggler"},
            },
            lose: {r:"The Emir's man knows every trick.",fx:{punish:"smuggling",coin:-20}},
          },
          {t:"Haul the ropes for the divers",r:"Safer work. Smaller pay.",fx:{coin:10,str:.4}},
        ],
      },
      {
        id: "av_sea_salvage",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.coast(p),
        w: .9,
        cool: 8,
        title: "A wreck on the beach",
        text: p=>`After the storm, a broken cog lies on the beach with her belly open. Barrels, bales, a ship's bell. ${p.realm==="POL-14"?"Greyhaven hangs wreckers; salvage belongs to the owners and the crown.":"The lord's reeve will be here by noon to claim the wreck-right."}`,
        choices: [
          {
            t: "Help the survivors first",
            r: "Three sailors, half-drowned, under the timbers. They live. Their master pays you from his own purse.",
            fx: {coin:15,honor:3,newRel:{type:"friend",op:30}},
          },
          {
            t: "Take what you can carry before the reeve comes",
            check: {s:"stealth",s2:"str",d:40},
            win: {r:"Two casks of wine and a bolt of good cloth, buried in the dunes.",fx:{coin:35,honor:-2}},
            lose: {r:"The reeve comes early.",fx:{punish:"theft"}},
          },
          {
            t: "Guard the wreck for the reeve",
            r: "The reeve pays a sun a day and says you are a good subject.",
            fx: {coin:3,favor:2},
          },
        ],
      },
      {
        id: "av_sea_whalers",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.coast(p)&&C.realm(p,"POL-26","POL-25","POL-23","POL-08","POL-09"),
        w: .9,
        cool: 10,
        title: "The Truce of Dobin",
        text: 'The whaling boat closes on a huge pale back in the fjord: a Frost Leviathan. The Truce of Dobin forbids killing them, and in 1095 the giants raided the coast for two years after whalers killed two. The harpooner is raising his iron anyway. "Who will know?"',
        choices: [
          {
            t: "Stop him",
            check: {s:"str",s2:"persuasion",d:45},
            win: {
              r: "You catch his arm. The leviathan blows, rolls and goes. The giants on the cliff, whom you had not seen, lower their spears.",
              fx: {honor:3,favor:3,fame:1},
            },
            lose: {r:"He throws. Somebody will know.",fx:{happy:-6,flag:"av_bounty"}},
          },
          {
            t: "Let him throw",
            r: "Two days of towing a monster. A rich haul. And in the spring, the giants come.",
            fx: {coin:60,honor:-3,flag:"av_bounty"},
          },
          {t:"Hunt seals instead and leave the leviathan",r:"A smaller haul, a quiet winter.",fx:{coin:15}},
        ],
      },
      {
        id: "av_sea_queen",
        cond: (p,C)=>C.adult(p)&&C.coast(p)&&salt(p),
        w: .8,
        cool: 10,
        title: "The Drowned Queen's due",
        text: "Sea Opening, 1 April: ships are blessed and sail. Every sailor pours wine to the Drowned Queen. She has no priests and no seat. She has every sailor's gold earring, which pays her if the sea takes them.",
        choices: [
          {
            t: "Buy a gold earring and pour your wine",
            req: p=>p.coin>=8,
            r: "Eight suns of gold in your ear. If you drown, you will drown paid up.",
            fx: {coin:-8,piety:4,happy:3},
          },
          {
            t: "Pour your wine and keep your ear",
            r: "A cup over the side. The old salts mutter, but the Queen is not fussy.",
            fx: {piety:2},
          },
          {t:"Laugh at it",r:"Nobody laughs with you.",fx:{piety:-3,happy:-2}},
        ],
      },
      {
        id: "av_sea_stowaway",
        cond: (p,C)=>C.adult(p)&&free(p)&&(J(p,"sailor","pirate","merchant")||salt(p))&&C.coast(p),
        w: .9,
        cool: 9,
        title: "The stowaway",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id,ctx.what=A.pick(["a runaway slave from the galley-benches","a girl running from a marriage","a boy who wants to see the world","a debtor with the Debt-Hounds behind him"])},
        text: "Three days out, you find {them} in the cable tier: {what}, thin, frightened and very seasick. The master hangs stowaways or sells them.",
        choices: [
          {
            t: "Hide {themHim} and share your food",
            check: {s:"stealth",s2:"deception",d:45},
            win: {
              r: "Two weeks of whispered meals. At the next port {them} slips ashore and is gone with your blessing.",
              fx: {honor:3,them:{type:"friend",op:40}},
            },
            lose: {
              r: "The bosun finds you both.",
              fx: {health:-10,wound:"back",them:{type:"friend",op:30},cause:"a flogging"},
            },
          },
          {
            t: "Take {themHim} to the master and plead for work",
            check: {s:"persuasion",s2:"etiquette",d:42},
            win: {
              r: "The master grunts and puts {themHim} to work for passage. {them} becomes a good sailor.",
              fx: {them:{type:"friend",op:30},perf:3},
            },
            lose: {r:"The master sells {themHim} at the next port.",fx:{happy:-6,honor:-1}},
          },
          {
            t: "Report {themHim}",
            r: "The master pays you a sun. You do not ask what happened next.",
            fx: {coin:1,honor:-4},
          },
        ],
      },
      {
        id: "av_sea_captaincy",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.coast(p)&&C.prof(p,"sea",55)&&!p.flags.av_capt,
        w: .7,
        cool: 15,
        title: "A deck of your own",
        text: "The owner of a small cog, old and tired, offers her to you on shares: you sail, you pay him half the profits for five years, and then she is yours. She leaks a little. She sails well.",
        choices: [
          {
            t: "Take her",
            r: "Your own deck under your feet. Your own crew. Your own mistakes.",
            fx: {asset:"cog",flag:"av_capt",fame:3,happy:8,deed:"Became master of a ship"},
          },
          {
            t: "Buy her outright",
            req: p=>p.coin>=600,
            r: "Six hundred suns and no partner. Every voyage is yours.",
            fx: {coin:-600,asset:"cog",flag:"av_capt",fame:3,happy:10},
          },
          {t:"Stay a mate; a captain drowns with the ship",r:"You keep your berth and your neck.",fx:{}},
        ],
      },
      {
        id: "av_sea_marque",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.coast(p)&&C.atWar(p)&&(salt(p)||p.flags.av_capt),
        w: .9,
        cool: 10,
        title: "Letters of marque",
        setup: (p,ctx)=>{const e=A.enemyRealmOf(p.realm);ctx.foe=e&&LORE.realms[e]?A.realmShort(e):"the enemy"},
        text: "The admiralty offers letters of marque: a licence to take {foe}'s ships and keep four parts in five. Piracy with a seal on it.",
        choices: [
          {
            t: "Take the letters and hunt",
            check: {s:"sea",s2:"tactics",d:50},
            win: {
              r: "Three prizes in a season. Your share would buy a manor.",
              fx: {coin:160,fame:3,favor:4,skill:{sea:3,tactics:2}},
            },
            lose: {
              r: "An enemy galley catches you instead. You lose the ship's boat and three men.",
              fx: {
                duel: {
                  tier: 3,
                  title: "an enemy marine",
                  troop: "SP",
                  opts: {kind:"duel",place:"a burning deck",lethal:!0,toYield:!0,title:"Privateers"},
                },
              },
            },
          },
          {
            t: "Refuse; a sailor is not a soldier",
            r: "You carry grain instead, at war prices. Safer money.",
            fx: {coin:30},
          },
        ],
      },
      {
        id: "av_sea_ice",
        cond: (p,C)=>C.adult(p)&&free(p)&&salt(p)&&C.realm(p,"POL-26","POL-25","POL-23","POL-09","POL-08"),
        w: .9,
        cool: 9,
        title: "Ice in the fjord",
        text: "Late in the year the ice comes down the fjord faster than anyone thought. The boat is caught: plates grinding against the hull, the shore a long white mile away.",
        choices: [
          {
            t: "Haul the boat across the ice",
            check: {s:"str",s2:"sta",d:48},
            win: {
              r: "A day of hauling, ropes over shoulders. You reach shore with the boat and every man.",
              fx: {str:1,sta:1,wil:1},
            },
            lose: {
              r: "The ice gives under you. They pull you out, but your feet have frozen.",
              fx: {health:-18,wound:"frostbite",cause:"freezing water"},
            },
          },
          {
            t: "Wait for a lead to open",
            check: {s:"sea",s2:"wil",d:45},
            win: {
              r: "On the third night the tide opens a black channel, and you row like madmen.",
              fx: {skill:{sea:4},wil:1.5},
            },
            lose: {
              r: "The ice crushes the hull. You walk ashore with nothing.",
              fx: {coinPct:-.4,wil:2,health:-10,cause:"cold"},
            },
          },
        ],
      },
      {
        id: "av_sea_fogreef",
        cond: (p,C)=>C.adult(p)&&free(p)&&(J(p,"sailor","pirate")||p.flags.av_capt||salt(p)&&C.coast(p)),
        w: 1,
        cool: 7,
        title: "Fog on the reef",
        text: "Thick fog, and somewhere close, the sound of surf on rocks. The pilot is sick below. The master looks at you.",
        choices: [
          {
            t: "Take soundings and creep",
            check: {s:"sea",s2:"int",d:48},
            win: {
              r: "Lead line, mark by mark. You find the channel by the bottom: sand, then shell, then deep. Through.",
              fx: {skill:{sea:5},perf:8,fame:1},
            },
            lose: {r:"You touch, and grind, and get off with a sprung plank.",fx:{perf:-5,coinPct:-.1}},
          },
          {
            t: "Anchor and wait it out",
            r: "A day and a night at anchor, the crew muttering. The fog lifts. You were a cable's length from the rocks.",
            fx: {wil:1,perf:2},
          },
        ],
      },
      {
        id: "av_sea_slaver",
        cond: (p,C)=>C.adult(p)&&free(p)&&(J(p,"sailor","pirate")||p.flags.av_capt||salt(p)&&C.coast(p))&&!C.unfree(p),
        w: .8,
        cool: 10,
        title: "The slaver",
        text: "You fall in with a slaver at anchor in a quiet bay: two hundred souls in her hold, chained, bound for the markets. Her crew is small and drunk.",
        choices: [
          {
            t: "Take her and free them",
            check: {s:"tactics",s2:"command",d:52},
            win: {
              r: "A night boarding. Chains off, a beach, freedom. Two hundred people know your name.",
              fx: {fame:5,honor:6,coin:30,deed:"Freed a slave ship",epithet:"the Unchainer"},
            },
            lose: {
              r: "They were less drunk than they looked.",
              fx: {
                duel: {
                  tier: 3,
                  title: "the slaver's mate",
                  troop: "HI",
                  opts: {kind:"duel",place:"a slaver's deck",lethal:!0,toYield:!1,title:"The slaver"},
                },
              },
            },
          },
          {
            t: "Take her and sell the cargo yourself",
            req: (p,C)=>J(p,"pirate"),
            r: "Two hundred souls is a fortune in any market. You will be rich, and you will be the kind of person who did this.",
            fx: {coin:300,honor:-10,trait:"cruel",piety:-5},
          },
          {t:"Sail on",r:"You sail on. The wind carries the smell for a mile.",fx:{happy:-4}},
        ],
      },
      {
        id: "av_sea_harborfight",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.coast(p)&&salt(p),
        w: 1,
        cool: 6,
        title: "Harbor tavern",
        text: p=>`The crew of a ${A.pick(["Greyhaven","Lucernan","Blackreef","Northreach","Qadiri"])} ship takes over the harbor tavern and starts singing insults about your ship and your mothers.`,
        choices: [
          {
            t: "Start the fight",
            r: "Benches, jugs, a man through the window. Glorious.",
            fx: {
              duel: {
                tier: 2,
                title: "a rival sailor",
                troop: "SL",
                opts: {kind:"brawl",place:"the harbor tavern",lethal:!1,toYield:!0,title:"Harbor brawl"},
              },
            },
          },
          {
            t: "Out-sing them",
            check: {s:"music",s2:"wil",d:40},
            win: {
              r: "You know a ruder verse. Then a ruder one. By midnight both crews are singing together.",
              fx: {skill:{music:3},happy:5,newRel:{type:"friend",op:20}},
            },
            lose: {r:"They know ruder verses than you.",fx:{happy:-3}},
          },
          {t:"Drink somewhere else",r:"A quieter tavern. Worse beer.",fx:{}},
        ],
      },
      {
        id: "av_teen_runaway_sea",
        cond: (p,C)=>C.teen(p)&&C.coast(p)&&!C.unfree(p)&&!C.noble(p),
        w: .8,
        once: !0,
        title: "The ship in the harbor",
        text: "A ship sails with the tide tonight for places you have only heard of. The mate says a ship's boy gets food, a hammock and a sun a month. Nobody at home has to know until you are gone.",
        choices: [
          {
            t: "Run away to sea",
            r: "You leave a note you cannot really write. By morning, the coast is a grey line.",
            fx: {job:"sailor",skill:{sea:5},wil:1.5,happy:4,rel:{who:"mother",op:-20},flag:"av_traveled"},
          },
          {
            t: "Ask your parents first",
            r: "They say no, loudly. You stay. You watch every sail go.",
            fx: {happy:-3,rel:{who:"mother",op:5}},
          },
          {
            t: "Go down and just watch her sail",
            r: "Lanterns on the water, the creak of ropes. One day.",
            fx: {happy:2},
          },
        ],
      },
      {
        id: "av_merc_join",
        cond: (p,C)=>go(p)&&!p.mil&&!p.flags.av_sword&&C.ageAdj(p)<40&&(C.gear(p,"weapon")||C.poor(p))&&(C.atWar(p)||C.realm(p,"POL-31","POL-16","POL-04","POL-03")),
        w: 1,
        cool: 10,
        title: "The drum in the square",
        setup: (p,ctx)=>{ctx.co=A.pick(["the Black Lanterns","the Broken Wheel","the Company of the Hare","the Iron Fathers","the Dawn Volunteers","the Free Company of Saint Ilio"])},
        text: 'A drum in the square and a captain on a barrel: {co}, a free company, hiring. Twenty-five suns a month for a spearman, thirty-five for a crossbow, paid "on the first of the month, every month". The veterans behind him laugh at that.',
        choices: [
          {
            t: "Sign the roll",
            r: "Your mark on the roll, a month's pay in advance (half of it), and a place at the company fire.",
            fx: {flag:"av_sword",coin:12,skill:{spear:2,melee:2},newRel:{type:"friend",op:20}},
          },
          {
            t: "Sign as a crossbowman",
            req: (p,C)=>C.prof(p,"xbow",30)||C.gear(p,"ranged","xbow"),
            r: "Thirty-five suns a month, they say. A crossbow, a pavise and a place in the second line.",
            fx: {flag:"av_sword",coin:17,gear:{ranged:"xbow"},skill:{xbow:3}},
          },
          {t:"Walk on",r:"The drum fades behind you.",fx:{}},
        ],
      },
      {
        id: "av_merc_contract",
        cond: (p,C)=>C.adult(p)&&free(p)&&(p.flags.av_sword||C.soldier(p)&&C.realm(p,"POL-31","POL-16","POL-04","POL-03","POL-33")),
        w: 1.1,
        cool: 6,
        title: "Two bids",
        text: p=>`The company is between contracts, and two buyers come to the camp. ${p.realm==="POL-31"?"Queen Livia's treasurer offers forty suns a man, paid later. A baron who backs Prince Andros offers twenty-five, paid now, in Velgrad silver.":'A great lord offers forty suns a man, paid "when the war chest arrives". A merchant city offers twenty-five, paid now, in good coin.'} The captain asks the company to vote.`,
        choices: [
          {
            t: "Vote for the big promise",
            r: "The company follows the big number. You know how this story goes, and so do the veterans.",
            fx: {coin:10,flag:"av_unpaid"},
          },
          {
            t: "Vote for coin in hand",
            r: "Twenty-five suns, counted into your palm. The veterans nod at you.",
            fx: {coin:25,int:.3},
          },
          {
            t: "Argue for half now, half later, from the big buyer",
            check: {s:"trade",s2:"persuasion",d:50},
            win: {
              r: "The captain takes your idea to the treasurer, who agrees. Twenty now, twenty later. The company cheers you.",
              fx: {coin:20,fame:2,skill:{trade:3}},
            },
            lose: {r:"The treasurer laughs and goes to another company.",fx:{coin:5,happy:-3}},
          },
        ],
      },
      {
        id: "av_merc_paymaster",
        cond: (p,C)=>C.adult(p)&&free(p)&&(p.flags.av_sword||p.flags.av_unpaid||C.soldier(p)&&C.atWar(p)),
        w: 1.1,
        cool: 8,
        title: "No pay",
        setup: (p,ctx)=>{ctx.months=A.ri(4,14)},
        text: "The company has not been paid in {months} months. The paymaster arrives with an empty wagon and a speech about patience. Men are selling their boots for bread. Someone mutters about Madara, in 1045, when the unpaid Free Companies seized the town.",
        choices: [
          {
            t: "Stand with the company and seize the paymaster",
            check: {s:"command",s2:"intimidation",d:48},
            win: {
              r: "The company holds him, and the town, until the silver comes. It comes. Half of it.",
              fx: {coin:60,fame:2,honor:-2,unflag:"av_unpaid"},
            },
            lose: {
              r: "The paymaster's escort fights. It gets ugly.",
              fx: {
                duel: {
                  tier: 3,
                  title: "the paymaster's guard",
                  troop: "HI",
                  opts: {kind:"duel",place:"the pay wagon",lethal:!0,toYield:!0,title:"No pay"},
                },
              },
            },
          },
          {
            t: "Take what you can from the countryside",
            r: "Every soldier knows how unpaid armies eat. A farm's chickens, a farm's seed corn. You eat. The farm does not.",
            fx: {coin:20,honor:-4,happy:-3},
          },
          {
            t: "Walk away from the company",
            r: "You leave at night with your kit. Not desertion, if they never paid you. Probably.",
            fx: {unflag:"av_sword",wil:1},
          },
          {
            t: "Wait, and trust the paymaster",
            r: "Three more months. Then a third of what you were owed, in bad coin.",
            fx: {coin:15,wil:1.5,happy:-5},
          },
        ],
      },
      {
        id: "av_merc_switch",
        cond: (p,C)=>C.adult(p)&&free(p)&&(p.flags.av_sword||C.soldier(p)&&C.atWar(p)&&p.mil&&p.mil.rank>=2),
        w: .9,
        cool: 10,
        title: "Double pay",
        text: 'A man from the other side comes into camp under a white rag, to "talk about prisoners". To you, quietly, he talks about double pay, a bounty for every man you bring, and the gate of a town you are guarding.',
        choices: [
          {
            t: "Turn your coat",
            check: {s:"intrigue",s2:"deception",d:52},
            win: {
              r: "You cross with twenty men at night. Double pay, and your old captain's curse on your head.",
              fx: {coin:80,honor:-8,flag:"av_turncoat",newRel:{type:"enemy",op:-50}},
            },
            lose: {r:"You are seen. Turncoats hang.",fx:{punish:"desertion",honor:-5}},
          },
          {
            t: "Arrest him and take him to the captain",
            r: "The captain hangs him and pays you a bonus. You will never know if the offer was real.",
            fx: {coin:15,honor:3,fame:1,merit:2},
          },
          {t:"Say no and let him go",r:'He shrugs. "Offer stands." You do not sleep well.',fx:{honor:1}},
        ],
      },
      {
        id: "av_merc_sack",
        cond: (p,C)=>C.adult(p)&&free(p)&&mwar(p),
        w: 1,
        cool: 10,
        title: "The town has surrendered",
        text: "The town opened its gates at dawn. The captains say the men have earned three days. The veterans remember Lorino, 1071: the Grey Hand, fourteen months unpaid, sacked it after it surrendered and killed eight hundred townsfolk. Lorino has never forgiven anyone.",
        choices: [
          {
            t: "Join the sack",
            r: "Three days you do not talk about afterward. You come back with silver, and something else you cannot put down.",
            fx: {coin:90,honor:-10,happy:-6,trait:"cruel",piety:-4},
          },
          {
            t: "Loot, but harm no one",
            check: {s:"wil",s2:"command",d:45},
            win: {
              r: "You take from the empty houses and the abbot's plate and leave the people be.",
              fx: {coin:45,honor:-1},
            },
            lose: {r:"You cannot stop what the others do. You see things.",fx:{coin:30,wil:2,happy:-8}},
          },
          {
            t: "Stand at a church door and protect the people inside",
            check: {s:"intimidation",s2:"wil",d:52},
            win: {
              r: "Forty townsfolk behind you, a spear across the door. Nobody gets past. They will name a child after you.",
              fx: {honor:8,fame:3,piety:4,deed:"Held a church door against a sack",epithet:"the Doorward"},
            },
            lose: {
              r: "Your own comrades push past you. You live. Not everyone inside does.",
              fx: {health:-15,wil:3,honor:3,happy:-10,cause:"comrades' blows"},
            },
          },
          {
            t: "Argue for sparing the town for a ransom instead",
            check: {s:"diplomacy",s2:"command",d:55},
            win: {
              r: "The town pays a ransom in plate, the company gets its money, and nobody dies. The captains grumble, then count.",
              fx: {coin:50,honor:5,fame:3,skill:{diplomacy:4}},
            },
            lose: {r:"They laugh you down. The sack goes on.",fx:{happy:-8,wil:1}},
          },
        ],
      },
      {
        id: "av_merc_hundredman",
        cond: (p,C)=>C.adult(p)&&free(p)&&(p.flags.av_sword||C.soldier(p)&&C.realm(p,"POL-31","POL-16","POL-04","POL-03","POL-33"))&&!p.flags.av_hundredman,
        w: .9,
        cool: 8,
        title: "The election",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"rival").id},
        text: "The hundredman, the squad captain of the first hundred, is dead of a wound gone bad. In the Free Companies the men choose their officers. {them} wants it. So, perhaps, do you.",
        choices: [
          {
            t: "Stand for it",
            check: {s:"command",s2:"persuasion",d:50},
            win: {
              r: "Hands go up. More for you. You are hundredman now, four shares a month, and a hundred lives on your conscience.",
              fx: {flag:"av_hundredman",coin:50,fame:3,skill:{command:4},them:{type:"rival",op:-20}},
            },
            lose: {
              r: "{them} wins. {theyHe} remembers who stood against {themHim}.",
              fx: {happy:-4,them:{type:"rival",op:-15}},
            },
          },
          {
            t: "Back {them} for a sergeant's place",
            r: "{them} wins and makes you a sergeant. Two shares, and a friend in the tent.",
            fx: {coin:25,them:{type:"friend",op:30}},
          },
          {t:"Stay out of it",r:"You vote, and keep your head down.",fx:{}},
        ],
      },
      {
        id: "av_merc_postern",
        cond: (p,C)=>C.adult(p)&&free(p)&&mwar(p),
        w: .8,
        cool: 12,
        title: "The postern key",
        text: "You hold the night watch at the postern gate of a besieged town. A note comes over the wall on an arrow: two hundred suns, left under the third stone of the well, for the gate open at the second hour.",
        choices: [
          {
            t: "Take the note to your captain",
            r: "The captain lays an ambush at the postern. The second hour comes, and so do the enemy. They do not leave.",
            fx: {fame:3,merit:3,honor:3,coin:20},
          },
          {
            t: "Burn the note and say nothing",
            r: "Nobody comes to the gate. Nobody knows. You watch the third stone every day.",
            fx: {},
          },
          {
            t: "Open the gate",
            r: "Two hundred suns under the stone. A town you were paid to guard, burning. If anyone ever learns, you will hang.",
            fx: {coin:200,honor:-15,flag:"av_turncoat",happy:-8},
          },
        ],
      },
      {
        id: "av_merc_ransom",
        cond: (p,C)=>C.adult(p)&&free(p)&&mwar(p),
        w: 1,
        cool: 8,
        title: "A knight in the mud",
        text: 'After the fight, a knight lies in the mud with his horse dead on his leg. His armor is worth sixty suns and his ransom much more. He sees your face. "Ransom," he says. "My family will pay."',
        choices: [
          {
            t: "Take him prisoner for ransom",
            check: {s:"etiquette",s2:"trade",d:42},
            win: {
              r: "His family pays 150 suns, and he sends you a fine dagger after, with his compliments.",
              fx: {coin:150,fame:2,honor:2,gear:{weapon:"dagger"}},
            },
            lose: {r:"Your own lord claims him. You get a pat on the back.",fx:{coin:10,happy:-4}},
          },
          {
            t: "Strip the armor and let him go",
            r: "Sixty suns of mail and a knight walking home barefoot. He laughs, despite himself.",
            fx: {coin:60,honor:1},
          },
          {
            t: "Kill him for his gear",
            r: "Quick. Sixty suns of mail. His crest is known, and his family will learn who wore it last.",
            fx: {coin:60,honor:-8,newRel:{type:"enemy",op:-60}},
          },
        ],
      },
      {
        id: "av_merc_halforc",
        cond: (p,C)=>C.adult(p)&&free(p)&&sword(p)&&!C.race(p,"halforc","orc"),
        w: .8,
        cool: 12,
        title: "The half-orc",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id},
        text: "There is a half-orc in your file, {them}, who gets the worst tent, the last of the stew and every insult the company knows. {theyHe} never answers. Tonight, three men are waiting for {themHim} behind the latrines.",
        choices: [
          {
            t: "Stand beside {themHim}",
            r: "Two against three. You come out bloody and laughing. {theyHe} has your back for life.",
            fx: {
              health: -8,
              them: {type:"bestfriend",op:50},
              honor: 3,
              cause: "a brawl",
              duel: {
                tier: 2,
                title: "a company bully",
                troop: "SP",
                opts: {kind:"brawl",place:"behind the latrines",lethal:!1,toYield:!0,title:"Three on one"},
              },
            },
          },
          {
            t: "Warn {themHim}",
            r: "{theyHe} does not go behind the latrines. The bullies find another victim. {theyHe} remembers who warned {themHim}.",
            fx: {them:{type:"friend",op:25}},
          },
          {
            t: "Stay out of it",
            r: "In the morning {theyHe} has a broken hand and says {theyHe} fell.",
            fx: {honor:-1},
          },
        ],
      },
      {
        id: "av_merc_fever",
        cond: (p,C)=>C.adult(p)&&sword(p),
        w: .9,
        cool: 9,
        title: "Camp fever",
        text: "Too many men in one muddy camp for too long. The flux comes first, then the fever. At Madara in 1003 three thousand soldiers died of it. The company barber shrugs.",
        choices: [
          {
            t: "Move your tent upstream and boil your water",
            check: {s:"medicine",s2:"int",d:40},
            win: {
              r: "You and your file stay well. The others call you fussy, then stop calling you anything.",
              fx: {skill:{medicine:3},int:.4},
            },
            lose: {r:"It finds you anyway.",fx:{health:-25,wil:2,cause:"camp fever"}},
          },
          {
            t: "Nurse the sick",
            check: {s:"sta",s2:"medicine",d:45},
            win: {
              r: "Water, broth, clean straw. More of your file live than any other.",
              fx: {honor:3,skill:{medicine:4},fame:1},
            },
            lose: {r:"You fall sick yourself and nearly join them.",fx:{health:-30,wil:2,honor:2,cause:"camp fever"}},
          },
          {
            t: "Pray",
            r: "The camp prays. The fever does as it likes.",
            fx: {piety:2,health:-10,cause:"camp fever"},
          },
        ],
      },
      {
        id: "av_merc_desert",
        cond: (p,C)=>C.adult(p)&&free(p)&&(p.flags.av_sword||C.soldier(p)&&p.mil.rank<=2)&&(C.atWar(p)||p.flags.av_unpaid),
        w: .8,
        cool: 10,
        title: "The road home",
        text: "The night is dark and the pickets are drunk. Home is twenty days' walk. Deserters hang at the road stations, if they are caught.",
        choices: [
          {
            t: "Go",
            check: {s:"stealth",s2:"survival",d:48},
            win: {
              r: "Twenty nights of walking and hiding in barns. You walk into your own village thin as a rake and alive.",
              fx: p=>(delete p.flags.av_sword,delete p.flags.av_unpaid,p.mil&&(p.mil=null),A.willGrow(p,2),p.flags.av_bounty=A.S.year,"You are a deserter now. Someone may come looking."),
            },
            lose: {r:"A patrol finds you in a ditch at dawn.",fx:{punish:"desertion"}},
          },
          {
            t: "Stay, and do your duty",
            r: "You go back to your blanket. Morning comes, and the war.",
            fx: {wil:1,honor:1},
          },
        ],
      },
      {
        id: "av_merc_retire",
        cond: (p,C)=>C.adult(p)&&free(p)&&p.flags.av_sword&&(C.ageAdj(p)>32||p.coin>400),
        w: .8,
        cool: 12,
        title: "Laying down the spear",
        text: 'Your knees ache in the mornings. The young ones call you "old man", kindly. An innkeeper on the high road is selling up: a common room, six beds, a stable and a good well.',
        choices: [
          {
            t: "Buy the inn",
            req: p=>p.coin>=250,
            r: "Two hundred and fifty suns, every coin you saved and some you did not. Your company drinks there free, once.",
            fx: {
              coin: -250,
              asset: "inn",
              unflag: "av_sword",
              happy: 10,
              deed: "Retired from the free companies and bought an inn",
            },
          },
          {
            t: "Go home with what you have",
            r: "You hang your spear over a door and learn to farm again.",
            fx: {unflag:"av_sword",happy:4,wil:1},
          },
          {
            t: "One more season",
            r: "The drum is hard to leave.",
            fx: {coin:25,health:-5,cause:"an old soldier's wounds"},
          },
        ],
      },
      {
        id: "av_merc_bodyguard",
        cond: (p,C)=>C.adult(p)&&free(p)&&(sword(p)||C.prof(p,"melee",45)||C.prof(p,"sword",45))&&!C.noble(p),
        w: 1,
        cool: 9,
        title: "The bodyguard",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id},
        text: "{them}, a merchant with many enemies, hires you as bodyguard: 40 suns a month and a bed outside {theirHis} door. In the third week, at the second hour, a board creaks on the stair.",
        choices: [
          {
            t: "Meet whoever it is on the stair",
            r: "A shape with a knife, coming up fast.",
            fx: {
              coin: 40,
              them: {type:"friend",op:30},
              duel: {
                tier: 3,
                title: "a hired knife",
                troop: "LI",
                opts: {kind:"duel",place:"a dark stair",lethal:!0,toYield:!1,title:"The stair"},
              },
            },
          },
          {
            t: "Wake {themHim} and get out the back",
            check: {s:"ins",s2:"stealth",d:45},
            win: {
              r: "Out through the kitchen as the door splinters. {them} pays you double and leaves the city that week.",
              fx: {coin:80,them:{type:"friend",op:40},ins:.6},
            },
            lose: {
              r: "They were waiting at the back, too.",
              fx: {health:-18,wound:"deep_cut",coin:40,cause:"a hired knife"},
            },
          },
          {
            t: "Shout for the watch",
            r: "The stair goes quiet. The watch comes an hour later and finds nothing. {them} sleeps with a light on from now on.",
            fx: {coin:40},
          },
        ],
      },
      {
        id: "av_merc_rival",
        cond: (p,C)=>C.adult(p)&&free(p)&&sword(p)&&!C.old(p),
        w: .9,
        cool: 8,
        title: "Words at the fire",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"rival").id},
        text: "{them}, a sergeant of another hundred, says loudly at the fire that you ran at the last fight. You did not. The company goes quiet, waiting.",
        choices: [
          {
            t: "Challenge {themHim} with blunted steel",
            r: "A ring of men, two blunted swords, and the captain looking the other way.",
            fx: {
              duel: {
                foe: "them",
                opts: {kind:"duel",place:"the company fire",lethal:!1,toYield:!0,title:"Words at the fire"},
              },
            },
          },
          {
            t: "Call witnesses",
            check: {s:"persuasion",s2:"wil",d:45},
            win: {
              r: "Three men of your file stand up and say what you did. {them} is laughed off.",
              fx: {fame:2,them:{type:"enemy",op:-20}},
            },
            lose: {r:"Nobody stands up. The story sticks.",fx:{fame:-2,happy:-5,wil:1}},
          },
          {
            t: "Laugh at {themHim}",
            check: {s:"persuasion",s2:"int",d:42},
            win: {r:'"I did run: toward them. Where were you?" The fire roars.',fx:{fame:1,skill:{persuasion:2}}},
            lose: {r:"Nobody laughs.",fx:{happy:-3}},
          },
        ],
      },
      {
        id: "av_merc_greyhand",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.realm(p,"POL-31")&&(sword(p)||crook(p)),
        w: .8,
        cool: 12,
        title: "The queen's written leave",
        text: "In Soldiers' Town, old men of the Grey Hand drink and do not talk about Lorino. One of them says Oren Vask, their old captain, is selling a paper: the queen's written leave for the sack of 1071. Prince Andros would pay a fortune for it. So would the queen, to burn it.",
        choices: [
          {
            t: "Find Vask and broker the sale",
            check: {s:"intrigue",s2:"persuasion",d:58},
            win: {
              r: "You carry the paper's price between two courts and take a broker's cut that would buy a farm.",
              fx: {coin:250,skill:{intrigue:5},flag:"av_bounty",fame:2},
            },
            lose: {
              r: "Both sides decide you know too much.",
              fx: {flag:"av_bounty",health:-12,wound:"scar_face",cause:"an assassin's knife"},
            },
          },
          {
            t: "Tell the people of Lorino",
            r: "They do not want money. They want the paper read aloud in the square. You tell them where it is. It is gone by morning.",
            fx: {honor:3,wil:1},
          },
          {t:"Stay out of it",r:"Old sins have long knives.",fx:{}},
        ],
      },
      {
        id: "av_merc_looting",
        cond: (p,C)=>C.adult(p)&&free(p)&&mwar(p),
        w: 1,
        cool: 6,
        title: "The field after",
        text: "The field after the fight: crows, groans, and the camp followers already moving among the dead with knives. A dead captain lies near you with a gold ring and a good sword.",
        choices: [
          {
            t: "Take the sword and the ring",
            r: "A good sword and a ring worth thirty suns. The dead have no use for them.",
            fx: {coin:30,gear:{weapon:"goodsword"},honor:-1},
          },
          {
            t: "Help the wounded instead",
            check: {s:"medicine",s2:"sta",d:40},
            win: {
              r: "You carry five men to the barber. Three live. One of them is an enemy.",
              fx: {honor:4,skill:{medicine:3},newRel:{type:"friend",op:30}},
            },
            lose: {r:"You carry five men to the barber. None live. You keep carrying.",fx:{wil:2,honor:2,happy:-5}},
          },
          {
            t: "Take the ring back to his family",
            r: "A long ride out of your way. His widow gives you bread and a look you do not forget.",
            fx: {honor:5,piety:2,happy:2},
          },
        ],
      },
      {
        id: "av_merc_dice",
        cond: (p,C)=>C.adult(p)&&sword(p)&&p.coin>=10,
        w: .9,
        cool: 6,
        title: "Pay night",
        text: "Pay night, for once. The dice come out on a drumhead. By midnight half the company is broke and the other half is drunk.",
        choices: [
          {
            t: "Throw",
            check: {s:"gambling",s2:"ins",d:45},
            win: {r:"The drumhead loves you. A month's pay doubles.",fx:{coin:25,happy:4}},
            lose: {r:"A month's pay, gone in an hour.",fx:{coin:-20,happy:-4}},
          },
          {
            t: "Run the game yourself and take a cut",
            check: {s:"gambling",s2:"intimidation",d:48},
            win: {r:"The house always wins. You are the house.",fx:{coin:30,skill:{gambling:3}}},
            lose: {
              r: "A loser accuses you of loaded dice. Fists fly.",
              fx: {health:-8,wound:"broken_nose",cause:"a brawl"},
            },
          },
          {
            t: "Send your pay home",
            r: "Your family eats this month.",
            fx: {coin:-10,rel:{who:"mother",op:10},honor:1},
          },
        ],
      },
      {
        id: "av_merc_forage",
        cond: (p,C)=>C.adult(p)&&mwar(p),
        w: 1,
        cool: 7,
        title: "Foraging",
        text: "Your file is sent foraging. At a farm, a woman stands in front of the barn with a pitchfork and three children behind her. The barn holds next year's seed corn.",
        choices: [
          {
            t: "Take it all; orders are orders",
            r: "You take the seed corn. You do not look back. The children's faces stay with you.",
            fx: {merit:1,honor:-4,happy:-4},
          },
          {t:"Take half and leave the seed",r:"Your sergeant swears, but the file eats.",fx:{honor:2,happy:1}},
          {
            t: "Pay her from your own purse",
            req: p=>p.coin>=10,
            r: "Ten suns for a sack of oats. She does not thank you. She does not curse you either.",
            fx: {coin:-10,honor:3},
          },
        ],
      },
      {
        id: "av_merc_bridge",
        cond: (p,C)=>C.adult(p)&&free(p)&&mwar(p)&&!C.old(p),
        w: .8,
        cool: 10,
        title: "Hold the bridge",
        text: 'Twelve of you, a narrow stone bridge, and a column of the enemy coming down the valley road. The rest of the army is an hour away. The captain looks at you. "Until they come."',
        choices: [
          {
            t: "Stand in the middle of the bridge",
            r: "Shields locked, spears out. The first of them come on.",
            fx: {
              duel: {
                tier: 3,
                title: "an enemy spearman",
                troop: "SP",
                opts: {kind:"duel",place:"a narrow stone bridge",lethal:!0,toYield:!1,title:"The bridge"},
              },
              fame: 2,
              merit: 3,
            },
          },
          {
            t: "Break the bridge instead",
            check: {s:"siegecraft",s2:"str",d:50},
            win: {
              r: "A keystone, a lever and twelve men heaving. The middle span falls into the river. The enemy stops.",
              fx: {fame:3,merit:3,skill:{siegecraft:4},deed:"Broke the bridge before the enemy column"},
            },
            lose: {
              r: "The stones will not move. You fight anyway.",
              fx: {
                duel: {
                  tier: 3,
                  title: "an enemy spearman",
                  troop: "SP",
                  opts: {kind:"duel",place:"a narrow stone bridge",lethal:!0,toYield:!1,title:"The bridge"},
                },
              },
            },
          },
          {
            t: "Shoot from the far bank",
            req: (p,C)=>C.gear(p,"ranged"),
            check: {s:"xbow",s2:"bow",d:48},
            win: {
              r: "Every man who sets foot on the bridge goes down. They stop trying.",
              fx: {fame:3,merit:2,skill:{xbow:2,bow:2}},
            },
            lose: {
              r: "Their archers outnumber yours.",
              fx: {health:-15,wound:"arrow_wound",cause:"an arrow at the bridge"},
            },
          },
        ],
      },
      {
        id: "av_merc_ladder",
        cond: (p,C)=>C.adult(p)&&free(p)&&mwar(p)&&!C.old(p),
        w: .8,
        cool: 10,
        title: "First up the ladder",
        text: "The breach is choked with dead. The captain offers a double share and a gold chain to the first man over the wall by ladder.",
        choices: [
          {
            t: "Climb first",
            check: {s:"athletics",s2:"wil",d:55},
            win: {
              r: "Stones, boiling water, a spear-point past your ear, and then you are on the wall. The gold chain is yours.",
              fx: {coin:60,fame:5,merit:5,deed:"First over the wall"},
            },
            lose: {
              r: "A stone takes you off the ladder.",
              fx: {health:-30,wound:"concussion",wil:2,cause:"a fall from a siege ladder"},
            },
          },
          {
            t: "Hold the ladder for others",
            r: "Not glorious. Someone else gets the chain. You get to keep your skull.",
            fx: {merit:1},
          },
        ],
      },
      {
        id: "av_merc_escort",
        cond: (p,C)=>C.adult(p)&&free(p)&&(mwar(p)||C.mounted(p)&&C.atWar(p)&&!p.ruler),
        w: .8,
        cool: 10,
        title: "Through the war country",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id},
        text: "{them}, a widow of good family, must cross the war country to her brother's castle. Burned villages, deserters, the enemy's outriders. She pays 60 suns for an escort who will not rob her himself.",
        choices: [
          {
            t: "Take the back roads",
            check: {s:"survival",s2:"stealth",d:45},
            win: {
              r: "Nine days of goat paths and silent camps. Her brother pays you double and offers you a place.",
              fx: {coin:120,them:{type:"friend",op:40},favor:2},
            },
            lose: {
              r: "Outriders find you on the fourth day.",
              fx: {
                coin: 60,
                duel: {
                  tier: 3,
                  title: "an enemy outrider",
                  troop: "LC",
                  opts: {kind:"duel",place:"a burned village",lethal:!0,toYield:!0,title:"Outriders"},
                },
              },
            },
          },
          {
            t: "Ride the high road fast",
            req: (p,C)=>C.mounted(p),
            check: {s:"riding",s2:"ins",d:48},
            win: {
              r: "Five days, two horses each, past three patrols at a gallop.",
              fx: {coin:60,skill:{riding:4},them:{type:"friend",op:25}},
            },
            lose: {
              r: "A patrol rides you down. She is taken for ransom; you are let go.",
              fx: {coin:30,happy:-8,fame:-1},
            },
          },
          {t:"Refuse; it is not worth it",r:"She finds another escort. You hope he is honest.",fx:{}},
        ],
      },
      {
        id: "av_merc_giant",
        cond: (p,C)=>C.adult(p)&&free(p)&&sword(p),
        w: .6,
        cool: 15,
        title: "The giant in the company",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id},
        text: "The captain has hired a giant: six hundred suns a month, twenty loaves and a sheep a day. More than the rest of the hundred together. The men grumble. The giant, {them}, sits alone eating the sheep and looking sad.",
        choices: [
          {
            t: "Go and sit with {themHim}",
            r: "The giant talks about the cold halls of the north and the sea. {theyHe} is homesick. You become friends, which is useful in a fight.",
            fx: {them:{type:"friend",op:40},lang:"Hall Tongue",happy:3},
          },
          {
            t: "Join the grumbling",
            r: "The giant hears every word. In the next fight, {theyHe} shields others, not you.",
            fx: {happy:-1},
          },
          {
            t: "Ask {themHim} to teach you to wrestle",
            check: {s:"unarmed",s2:"str",d:50},
            win: {
              r: "{theyHe} throws you a hundred times. On the hundred-and-first, you stay standing. {theyHe} laughs like a landslide.",
              fx: {skill:{unarmed:5},str:1,them:{type:"friend",op:30}},
            },
            lose: {r:"You bounce. Repeatedly.",fx:{health:-10,wound:"broken_ribs",cause:"a giant's throw"}},
          },
        ],
      },
      {
        id: "av_young_outlaw_uncle",
        cond: (p,C)=>C.ageAdj(p)>=8&&C.ageAdj(p)<15&&C.famKind(p,"outlaw"),
        w: 1.2,
        once: !0,
        title: "Uncle comes home at night",
        text: "Your uncle comes home after midnight, muddy to the knees, and drops a heavy bag on the table. It clinks. He sees you watching from the ladder and puts a finger to his lips.",
        choices: [
          {
            t: "Keep the secret",
            r: "He winks, and in the morning there is a honey cake by your bed. You learn early that some things are not said.",
            fx: {skill:{stealth:2,deception:1},happy:3},
          },
          {
            t: "Ask him to take you next time",
            r: '"When you can walk on dry leaves without a sound." You practice every day after that.',
            fx: {skill:{stealth:4},spd:.5},
          },
          {
            t: "Tell your mother",
            r: "Your mother and your uncle shout until dawn. He leaves for a year. You are not sure you did right.",
            fx: {honor:1,happy:-3},
          },
        ],
      },
      {
        id: "av_young_firstkill",
        cond: (p,C)=>C.ageAdj(p)>=11&&C.ageAdj(p)<17&&(C.famKind(p,"hunt")||C.terr(p,"forest","hills","tundra")&&!C.town(p)),
        w: 1,
        once: !0,
        title: "The first deer",
        text: p=>`Your ${A.pick(["uncle","older cousin","grandmother","father's old hunting friend"])} takes you out before dawn with a bow too big for you. Frost on the bracken. A roe deer steps into the clearing, forty paces off, and lifts its head.`,
        choices: [
          {
            t: "Draw and loose",
            check: {s:"bow",s2:"ins",d:25},
            win: {
              r: "A clean shot behind the shoulder. You are blooded on the cheek, as is the custom. Your hands do not stop shaking until noon.",
              fx: p=>{if(A.trainSkill(p,"bow",4),A.trainSkill(p,"tracking",2),A.chance(.35))return p.apt=p.apt||{},p.apt.bow=Math.max(p.apt.bow||1,1.3),"You have a natural eye for it."},
            },
            lose: {r:"The arrow goes into a tree. The deer goes into the trees. Next time.",fx:{skill:{bow:2},wil:.5}},
          },
          {
            t: "Wait for it to come closer",
            check: {s:"stealth",s2:"wil",d:25},
            win: {
              r: "Twenty paces. Fifteen. You do not even need to aim. Patience is a weapon too.",
              fx: {skill:{stealth:3,bow:2},wil:.5},
            },
            lose: {r:"It smells you and is gone.",fx:{skill:{stealth:1}}},
          },
          {
            t: "Lower the bow",
            r: "You cannot do it. The deer walks away. Nobody laughs, which is worse, or better.",
            fx: {trait:"kind",happy:1},
          },
        ],
      },
      {
        id: "av_young_harbor",
        cond: (p,C)=>C.ageAdj(p)>=7&&C.ageAdj(p)<14&&C.coast(p),
        w: .9,
        once: !0,
        title: "Off the harbor wall",
        text: "The harbor children dive off the end of the wall at high tide, where the water is green and deep and very cold. They dare you.",
        choices: [
          {
            t: "Dive",
            check: {s:"sta",s2:"wil",d:20},
            win: {
              r: "Cold like a slap, green light, and up into the noise and the cheering. You dive every day after that.",
              fx: p=>{if(A.trainSkill(p,"sea",4),A.trainSkill(p,"athletics",2),A.chance(.3))return p.apt=p.apt||{},p.apt.sea=Math.max(p.apt.sea||1,1.3),"The water feels like home."},
            },
            lose: {
              r: "You go in flat. Your whole front is red for a day. You go again tomorrow.",
              fx: {skill:{sea:2},wil:1},
            },
          },
          {
            t: "Climb down the ladder instead",
            r: "They jeer. You learn to swim anyway, slowly, in the shallows.",
            fx: {skill:{sea:2}},
          },
          {t:"Refuse",r:"You watch from the wall. The sea can wait.",fx:{}},
        ],
      },
      {
        id: "av_teen_poach",
        cond: (p,C)=>C.teen(p)&&!C.noble(p)&&C.terr(p,"forest","hills","plains","marsh"),
        w: .9,
        cool: 6,
        title: "The lord's rabbits",
        text: `Your cousin knows where the lord's warren is, and where the warrener sleeps. "Six rabbits, two each for our mothers, two for the pot. Nobody counts rabbits."`,
        choices: [
          {
            t: "Go with your cousin",
            check: {s:"stealth",s2:"spd",d:25},
            win: {
              r: "Six rabbits, a sack, and a run home under the moon. Best stew of the year.",
              fx: {skill:{stealth:3,survival:1},happy:4},
            },
            lose: {
              r: "The warrener's dog. You get away; your cousin gets a thrashing and does not give your name.",
              fx: {happy:-3,wil:1},
            },
          },
          {
            t: "Set snares on the common instead",
            check: {s:"survival",s2:"int",d:25},
            win: {r:"Two rabbits, honestly caught. Your mother is proud.",fx:{skill:{survival:3}}},
            lose: {r:"A fox gets there first.",fx:{}},
          },
          {t:"Stay home",r:"Your cousin calls you a hen.",fx:{}},
        ],
      },
      {
        id: "av_road_dwarfgate",
        cond: (p,C)=>go(p)&&!C.race(p,"dwarf")&&C.realm(p,"POL-10","POL-28","POL-29"),
        w: 1,
        cool: 9,
        title: "Outside the gate",
        text: "A trader at a dwarven hold sleeps outside the gates, in the hold's guest hall, or at a human-run inn. You pay the gate fee and wait. The gate-warden studies your goods, your boots and your face with equal suspicion.",
        choices: [
          {
            t: "Wait politely, as long as it takes",
            check: {s:"etiquette",s2:"wil",d:40},
            win: {
              r: "Three days. On the fourth, a dwarf factor takes your wool at a fair price and writes your name in a book. That book matters.",
              fx: {coin:25,skill:{etiquette:3},flag:"av_hold_book"},
            },
            lose: {
              r: "You grumble once, loudly. The warden hears. The gate stays shut to you this year.",
              fx: {happy:-3},
            },
          },
          {
            t: "Try to trade at the guest hall door",
            check: {s:"trade",s2:"persuasion",d:48},
            win: {
              r: "A dwarf smith buys your whole stock to save himself the walk. He pays in good steel.",
              fx: {coin:40,skill:{trade:3}},
            },
            lose: {r:"The warden fines you for trading outside the market.",fx:{coin:-8}},
          },
          {
            t: "Learn some Holdspeech while you wait",
            r: "The guest hall cook teaches you. Dwarves are startled into politeness when you use it.",
            fx: {lang:"Holdspeech",int:.4},
          },
        ],
      },
      {
        id: "av_road_elfedge",
        cond: (p,C)=>go(p)&&!C.race(p,"elf","halfelf")&&C.realm(p,"POL-06","POL-07"),
        w: 1,
        cool: 9,
        title: "Past the forest edge",
        text: "Humans may live only at the forest edge, under license. You followed a hurt deer a little too far in, and now two elves are standing between you and the way back, bows half drawn.",
        choices: [
          {
            t: "Show your license and apologize",
            check: {s:"etiquette",s2:"diplomacy",d:45},
            win: {
              r: "They read it, check the seal, and walk you to the edge without a word. Courteous, in their way.",
              fx: {skill:{etiquette:2},honor:1},
            },
            lose: {r:"Your license is out of date. A fine, and a black mark in their ledger.",fx:{coin:-15,happy:-3}},
          },
          {
            t: "Tell them about the deer and offer it to them",
            check: {s:"persuasion",s2:"survival",d:40},
            win: {
              r: 'One of them almost smiles. They finish the deer cleanly and give you a haunch. "Next time, let it go."',
              fx: {newRel:{type:"friend",op:15},happy:3},
            },
            lose: {r:"They take the deer, and your bow.",fx:{gear:{ranged:null},happy:-4}},
          },
          {
            t: "Run",
            check: {s:"spd",s2:"stealth",d:55},
            win: {r:"You make it out. You do not come back.",fx:{spd:.4}},
            lose: {r:"An arrow pins your coat to a tree, deliberately. Then they walk you out.",fx:{happy:-5,wil:1}},
          },
        ],
      },
      {
        id: "av_road_kraoth",
        cond: (p,C)=>go(p)&&(J(p,"merchant")||C.famKind(p,"merchant"))&&C.realm(p,"POL-34","POL-26","POL-25","POL-12"),
        w: 1,
        cool: 8,
        title: "The Toll of Kraoth",
        text: "On the Silk Road the Tusk Clans take one part in ten of everything since 1103: the Toll of Kraoth. The toll-chief counts your bales, slowly, and smiles at your silks.",
        choices: [
          {
            t: "Pay the tenth",
            r: "One bale in ten. The road is safe after that; the clans see to it.",
            fx: {coin:-20,skill:{trade:1}},
          },
          {
            t: "Declare half your goods",
            check: {s:"deception",s2:"trade",d:50},
            win: {r:"He counts what you show him. You save forty suns.",fx:{coin:20,skill:{deception:3}}},
            lose: {r:"He counts what you did not show him, and takes a fifth of it.",fx:{coin:-45,honor:-1}},
          },
          {
            t: "Give a gift to the toll-chief's mother",
            check: {s:"etiquette",s2:"diplomacy",d:45},
            win: {
              r: "A bolt of red silk for the old woman. The toll-chief counts every bale as a twentieth.",
              fx: {coin:-5,skill:{diplomacy:3},newRel:{type:"friend",op:20}},
            },
            lose: {r:"The gift is the wrong colour. The tenth becomes an eighth.",fx:{coin:-25}},
          },
        ],
      },
      {
        id: "av_wild_rival_hunter",
        cond: (p,C)=>C.adult(p)&&free(p)&&(J(p,"hunter")||C.famKind(p,"hunt")||C.prof(p,"bow",45)),
        w: .9,
        cool: 9,
        title: "Whose arrow?",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"rival").id},
        text: 'A great stag lies dead in the snow with two arrows in it: yours, and one fletched with grey goose. {them} comes out of the trees with a bow. "My stag."',
        choices: [
          {
            t: "Show whose arrow killed it",
            check: {s:"tracking",s2:"int",d:42},
            win: {
              r: "Your arrow is in the heart, {theirHis} in the haunch. Even {them} has to admit it.",
              fx: {coin:12,skill:{tracking:2},them:{type:"rival",op:10}},
            },
            lose: {r:"It is not clear at all. You argue till dark.",fx:{them:{type:"rival",op:-15}}},
          },
          {
            t: "Split it",
            r: "A haunch each, the hide to {themHim}, the antlers to you. You share a fire, and a story or two.",
            fx: {coin:6,them:{type:"friend",op:20}},
          },
          {
            t: "Settle it with a shooting match",
            check: {s:"bow",s2:"ins",d:50},
            win: {
              r: "Three arrows each at a knot on an oak. Yours touch. {theirHis} do not. {theyHe} laughs and gives you the stag.",
              fx: {coin:12,fame:1,skill:{bow:3},them:{type:"friend",op:15}},
            },
            lose: {r:"{theyHe} splits your arrow. Fair is fair.",fx:{them:{type:"rival",op:5},wil:.5}},
          },
        ],
      },
      {
        id: "av_wild_snowed_in",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.terr(p,"mountains","tundra","hills","forest")&&(wild(p)||C.job(p,"herd")),
        w: .9,
        cool: 8,
        title: "Snowed in",
        text: "A blizzard catches you three days from home, at a stone hut on the high pasture. You have flint, a little meal, an axe, and the hut has half a roof.",
        choices: [
          {
            t: "Patch the roof and wait it out",
            check: {s:"survival",s2:"sta",d:42},
            win: {
              r: "Six days of snow, porridge and the fire. You walk down thinner and very calm.",
              fx: {wil:2,skill:{survival:3}},
            },
            lose: {
              r: "The fuel runs out on the fourth day. You burn the door. Your toes go black at the tips.",
              fx: {health:-15,wound:"frostbite",wil:2,cause:"cold"},
            },
          },
          {
            t: "Push for home through the storm",
            check: {s:"sta",s2:"survival",d:55},
            win: {
              r: "Into the white and out the other side. You stagger in at midnight and the whole village cheers.",
              fx: {sta:1,fame:1,wil:1},
            },
            lose: {
              r: "They find you in spring. Almost. A shepherd finds you on the fourth day, barely breathing.",
              fx: {health:-30,wound:"frostbite",wil:3,cause:"the blizzard"},
            },
          },
        ],
      },
      {
        id: "av_wild_hunt_lord",
        cond: (p,C)=>C.adult(p)&&free(p)&&!C.noble(p)&&C.terr(p,"forest","hills","plains")&&A.beastsNear(p).some(id=>["CRE-23","CRE-20","CRE-25","CRE-21","CRE-49","CRE-35"].includes(id)),
        w: .9,
        cool: 9,
        title: "Beater at the lord's hunt",
        setup: (p,ctx)=>{const n=A.beastsNear(p).filter(id=>["CRE-23","CRE-20","CRE-25","CRE-21","CRE-49","CRE-35"].includes(id));ctx.beast=n.length?A.pick(n):"CRE-23",ctx.bn=bn(ctx.beast)},
        text: "The lord is hunting, and the village is called out to beat the wood with sticks and drums: a penny a day and the offal. The line moves through the thicket, shouting. Then the shouting stops. Out of the brush, not toward the lord but toward you, comes {bn}.",
        choices: [
          {
            t: "Stand and turn it with your stick and voice",
            check: {s:"wil",s2:"intimidation",d:50},
            win: {
              r: "You roar and wave. It swerves, back toward the lord's spears. That night the lord sends you a silver penny and his compliments.",
              fx: {coin:5,fame:2,wil:1.5,favor:2},
            },
            lose: {r:"It does not turn.",fx:{beast:{place:"the lord's chase",mod:.85,title:"The beat"}}},
          },
          {
            t: "Climb a tree",
            check: {s:"athletics",s2:"spd",d:40},
            win: {r:"It passes beneath you. You come down when the horns blow.",fx:{skill:{athletics:2}}},
            lose: {r:"Not fast enough.",fx:{health:-15,wound:"bite",cause:"a beast at the hunt"}},
          },
          {
            t: "Throw yourself flat",
            r: "It goes over and past. A neighbor is not so lucky. You carry him home.",
            fx: {wil:1,happy:-3},
          },
        ],
      },
      {
        id: "av_road_pilgrim_skyhold",
        cond: (p,C)=>go(p)&&(C.faith(p,"REL-06")||C.realm(p,"POL-27")),
        w: .8,
        cool: 10,
        title: "The Bluespire circuit",
        text: "The pilgrim circuit around Bluespire is many days of thin air and prayer flags. The monks of Skyhold feed every pilgrim. On the third pass, an old pilgrim sits down in the snow and will not get up.",
        choices: [
          {
            t: "Carry her to the next monastery",
            check: {s:"str",s2:"sta",d:48},
            win: {
              r: "Two days with an old woman on your back. The monks bow to you, which they do not do lightly.",
              fx: {piety:6,sta:1,wil:1.5,honor:2},
            },
            lose: {
              r: "You carry her as far as you can. Then you sit with her until she goes.",
              fx: {piety:4,wil:2,happy:-5},
            },
          },
          {
            t: "Run ahead for the monks",
            check: {s:"spd",s2:"sta",d:42},
            win: {r:"The monks come with a litter. She lives to finish the circuit.",fx:{piety:4,honor:1}},
            lose: {r:"By the time the monks come, it is too late.",fx:{piety:2,happy:-4}},
          },
          {
            t: "Sit with her and pray",
            r: "You pray together in the snow. She thanks you and dies smiling, which the monks say is a good death.",
            fx: {piety:5,wil:1},
          },
        ],
      },
      {
        id: "av_road_sellsword_offer",
        cond: (p,C)=>go(p)&&(C.prof(p,"sword",45)||C.prof(p,"axe",45)||C.prof(p,"spear",45))&&!p.flags.av_sword&&!p.mil,
        w: .8,
        cool: 10,
        title: "A sword for hire",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id},
        text: `{them}, a scarred captain of a free company, watches you train in an inn yard. "You're wasted here. Twenty-five a month, plunder shares, and nobody asks where you're from."`,
        choices: [
          {
            t: "Take the coin",
            r: "You go with the company at dawn. A new life, paid monthly, in theory.",
            fx: {flag:"av_sword",coin:25,them:{type:"mentor",op:20}},
          },
          {
            t: "Ask for more: you are worth it",
            check: {s:"trade",s2:"persuasion",d:48},
            win: {
              r: '"Forty, and a file to lead." You shake on it.',
              fx: {flag:"av_sword",coin:40,them:{type:"mentor",op:25},skill:{command:2}},
            },
            lose: {r:'"Then stay wasted." He rides off.',fx:{}},
          },
          {t:"No",r:'He shrugs. "They all say no, until the harvest fails."',fx:{}},
        ],
      },
      {
        id: "av_crime_jailer_offer",
        cond: (p,C)=>C.adult(p)&&free(p)&&C.town(p)&&!crook(p)&&C.poor(p),
        w: .7,
        cool: 12,
        title: "Turnkey wanted",
        text: `The town gaol needs a turnkey: three suns a month, a room, and "whatever the prisoners' families pay for kindness". The last turnkey left in a hurry.`,
        choices: [
          {
            t: "Take the job honestly",
            r: "Keys, buckets and misery. You are fair, and the prisoners know it. Some of them remember you later, outside.",
            fx: {coin:15,honor:2,wil:1,skill:{intimidation:2}},
          },
          {
            t: "Take the job and the bribes",
            r: "Bread at three times the price, a blanket for a sun, a letter out for five. You do well. You do not feel well.",
            fx: {coin:50,honor:-4,skill:{intrigue:3}},
          },
          {t:"No",r:"Gaols are bad luck.",fx:{}},
        ],
      },
      {
        id: "av_road_famous_outlaw",
        cond: (p,C)=>go(p)&&!C.town(p)&&C.fame(p)>=15,
        w: .7,
        cool: 12,
        title: "They know your name",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"acquaint").id},
        text: `Bandits stop you on a lonely road, and then their leader, {them}, squints at you and lowers the crossbow. "Wait. You're {full}." The others crowd round to look.`,
        choices: [
          {
            t: "Play to it",
            check: {s:"persuasion",s2:"wil",d:40},
            win: {
              r: "You tell a story or two. They give you supper and an escort to the next village, and ask you to put them in a song.",
              fx: {fame:2,happy:4,them:{type:"friend",op:20}},
            },
            lose: {r:'"Famous people pay more." They take double.',fx:{coinPct:-.5,happy:-4}},
          },
          {
            t: "Offer them honest work",
            check: {s:"command",s2:"persuasion",d:50},
            win: {
              r: "Two of them follow you out of the woods, and stay loyal for years.",
              fx: {newRel:{type:"friend",op:40},fame:1,honor:2},
            },
            lose: {r:"They laugh. Honest work is why they are here.",fx:{}},
          },
          {
            t: "Ask for their leader's name in return",
            r: "{them} tells you, proudly. You will hear it again.",
            fx: {them:{type:"acquaint",op:10}},
          },
        ],
      },
    ]);
  })();
})();
