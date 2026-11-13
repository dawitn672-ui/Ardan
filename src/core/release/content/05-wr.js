// The release's event pack 5 of 30 (86 events, mostly wr_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-027). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const R = p=>p.mil&&(p.mil.merc?p.mil.contract:p.mil.realm)||p.realm,
      foeOf = p=>{const r=R(p),e=r?A.enemyRealmOf(r):null;return e?A.realmShort(e):A.pick(["the enemy","the other side"])},
      war = p=>{const r=R(p);return!!r&&A.atWar(r).length>0},
      camp = p=>!!p.mil&&(war(p)||!!p.mil.merc),
      mates = p=>A.squad(p).length>0,
      rank = p=>p.mil?p.mil.rank:-1,
      civ = (p,C)=>C.adult(p)&&!C.soldier(p),
      crook = (p,C)=>civ(p,C)&&(p.job&&p.job.c==="thief"||C.flag(p,"outlaw")||C.flag(p,"wr_gang")),
      // [X1 baked patch events/97-first-life-fixes LF-TIER-GATES] Scenes written for a commoner or a private reached the
      // top of the ladder: a queen was told to "Flee to the woods" and "Turn him in for the bounty" (the home-front war
      // scenes), danced at Harvest Home to be married off by the village, and kept a scribe's duties ("it is only a
      // job"); a General of 62 leading 12,800 was asked "You. Name?" by a passing captain; a carpenter of 68 was offered
      // the dead captain's ring and a sellsword's contract. A reigning ruler or a general (A.lfTop, h-words.core.js) no
      // longer draws the home-front, harvest-dance or learned-duty scenes; the rank-and-file camp scenes stop at rank 3;
      // the mercenary scenes stop at 55 (human years) and the road offers at 60. The guards are helpers, not
      // C.ruler/p.mil in the cond text, so A.evAudience classes the scenes as before.
      homeFront = (p,C)=>civ(p,C)&&C.atWar(p)&&!(A.lfTop&&A.lfTop(p)),
      law = p=>A.lawOf(R(p)),
      nm = (p,sex)=>{try{return A.givenName(p.cult,sex||"M")||"Tam"}catch{return"Tam"}},
      prov = id=>{try{return A.provName(id)||"home"}catch{return"home"}},
      faithName = p=>{const f=A.faith(p.faith);return f&&f.name?f.name:"the old gods"},
      gangName = p=>A.pick(["the Lantern Boys","the Saltmen","the Gutter Dogs","the Wharf Rats","the Hooks","the Tallow Crew",`Mother ${nm(p,"F")}'s crew`]);
    function prep(p,ctx){const sq=A.shuffle(A.squad(p)),a=sq[0],b=sq[1];a?ctx.pid=a.id:delete ctx.pid,ctx.m2=b?b.id:"",ctx.mate=a?a.given:nm(p),ctx.mhe=a?A.he(a):"he",ctx.Mhe=A.cap(ctx.mhe),ctx.mhim=a?A.him(a):"him",ctx.mhis=a?A.his(a):"his",ctx.Mhis=A.cap(ctx.mhis),ctx.quirk=a&&a.quirk?a.quirk:"never says much",ctx.mhome=prov(a?a.home:p.home),ctx.mate2=b?b.given:nm(p),ctx.foe=foeOf(p),ctx.unit=p.mil?p.mil.unit:"the company",ctx.rk=p.mil?A.milTitle(p):"soldier",ctx.mr=A.realmShort(R(p)),ctx.capt=nm(p),ctx.sarge=nm(p)}
    function prepH(p,ctx){ctx.foe=foeOf(p),ctx.mr=A.realmShort(p.realm),ctx.npc=nm(p),ctx.npcw=nm(p,"F"),ctx.gang=gangName(p),ctx.gang2=gangName(p),ctx.boss=nm(p)}
    const both = (obj,fn)=>(A.V2C&&A.V2C.parts||(f=>f))((p,ctx)=>{const a=A.applyFx(p,obj,ctx),b=fn(p,ctx);return[a,b].filter(x=>typeof x=="string"&&x).join(" ")},[obj,fn]),
      die1 = how=>(p,ctx)=>A.comradeDies(p,A.P(ctx.pid),how)||"",
      die2 = how=>(p,ctx)=>A.comradeDies(p,A.P(ctx.m2),how)||"",
      // [X1 baked patch events/99999-v2-content V2C-FX-PARTS] The soldier packs build 227 choices as both({ honor: 2,
      // ... }, op2(-30)): a closure whose source shows only "applyFx(p, obj, ctx)", so the card could read none of what
      // they do (playtest 2, old 18 and 19: "It will be remembered", "• changes regard" naming nobody). The closures now
      // carry their parts (A.V2C.parts: f.v2parts, and op2's regard and messmate as f.v2meta), which the chips read as
      // written. Nothing they do changes. In the source: write these effects as data, or give the helpers a way to say
      // what they hold.
      op2 = d=>(A.V2C&&A.V2C.parts||(f=>f))((p,ctx)=>{const c=A.P(ctx.m2);return c&&A.addOp(p,c,d),""},null,{op:d,who:"m2"}),
      gone1 = (p,ctx)=>{const c=A.P(ctx.pid);return c&&p.mil&&(p.mil.squad=p.mil.squad.filter(id=>id!==c.id)),""},
      gallows = p=>(A.S.queue.splice(1,0,{type:"event",ev:"gallows",ctx:{}}),""),
      deserterFate = p=>R(p)==="POL-05"?"have their two drawing fingers cut off":law(p)==="orc"?"lose their deed-names":R(p)==="POL-31"?"hang at the road stations":"hang on one witness",
      smuggle = p=>{const r=p.realm;return r==="POL-01"?["raw amber off the Cold Bay shore","the Kingsmere Amber Guild's buyers"]:r==="POL-08"||r==="POL-09"?["Frostholm tin","the Tin Reeves and the crown's tenth"]:r==="POL-02"||r==="POL-04"?["untaxed sea salt","the Temple's salt tax"]:r==="POL-05"?["bundles of yew staves and war bows bound for Varenna","the treason law on war bows"]:r==="POL-24"||r==="POL-12"||r==="POL-15"?["sealed jars of fire-oil","the toll forts and the crown's seep law"]:r==="POL-28"||r==="POL-29"||r==="POL-10"?["uncut gems and hold steel","the gate-tallies of the holds"]:r==="POL-20"?["river gold in a hollow ox-yoke","the governor's panning-tally"]:r==="POL-25"||r==="POL-26"?["sable furs and beeswax","the river toll forts"]:r==="POL-07"||r==="POL-06"?["unmarked fir and oak","the Keepers' marks"]:r==="POL-32"?["pepper and clove seedlings","the scales of Amberport"]:r==="POL-17"?["bales of paper and a journeyman who knows how it is made","the Sultan's paper law"]:["untaxed wine and salt","the toll-house on the bridge"]};
    A.defEvents([
      {
        id: "wr_letter_home",
        cond: (p,C)=>C.soldier(p)&&mates(p),
        setup: prep,
        title: "A letter home",
        text: ()=>`A rest day by ${A.pick(["a muddy ford","a burned mill","a roadside shrine","a dry well"])}. A carter going back toward {home} will take letters for a penny. {mate}, who {quirk}, watches you hold the paper.`,
        choices: [
          {
            t: "Write the truth: the hunger, the dead, the fear",
            req: p=>p.literate,
            r: "You write it all. It is the most honest thing you have done in months. Whether they should read it is another matter.",
            fx: {wil:1,happy:2,int:.3},
          },
          {
            t: "Write that all is well and the food is good",
            req: p=>p.literate,
            r: "You lie kindly, as every soldier does. Somewhere in {home} someone will sleep better.",
            fx: {happy:3,rel:{who:"mother",op:5}},
          },
          {
            t: "Ask {mate} to teach you your letters",
            req: p=>!p.literate,
            check: {s:"int",s2:"learning",d:40},
            win: {
              r: "Night after night {mate} scratches letters in the dirt by the fire. By the end of the month you can write your own name, and more.",
              fx: {literate:!0,skill:{learning:3},them:{op:10}},
            },
            lose: {
              r: "The letters swim in front of your eyes. {mate} is patient, but the march is not.",
              fx: {skill:{learning:2},them:{op:5}},
            },
          },
          {t:"Send nothing",r:"You fold the paper into your boot. Maybe next week.",fx:{happy:-1}},
        ],
      },
      {
        id: "wr_march_hunger",
        cond: (p,C)=>camp(p),
        setup: prep,
        title: "Half bread",
        text: 'Third day on half bread. The carts are stuck somewhere behind you and the villages ahead are already stripped to the floorboards. {mate} chews a strap of leather "for the taste".',
        choices: [
          {
            t: "Tighten your belt and march",
            r: "You march on air and spite. Your legs remember it for years.",
            fx: {sta:1,wil:1.5,health:-5,cause:"hunger on the march"},
          },
          {
            t: "Slip off the road to find something",
            check: {s:"survival",s2:"ins",d:45},
            win: {
              r: "A forgotten turnip clamp under old straw. You share it with the file, and they will not forget it.",
              fx: {skill:{survival:3},them:{op:10},happy:3},
            },
            lose: {
              r: "You come back empty-handed, and the file-leader strikes you for straggling.",
              fx: {health:-4,happy:-3,merit:-2},
            },
          },
          {
            t: "Buy from the sutler at robber prices (8 suns)",
            req: p=>p.coin>=8,
            r: "A heel of rye bread and a sliver of cheese for eight suns. Worth every one.",
            fx: {coin:-8,health:3},
          },
          {
            t: "Give half your bread to {mate}",
            r: "{mate} looks at you a long time and says nothing. Later, {mhe} will.",
            fx: {them:{op:15},health:-3,honor:2,wil:1},
          },
        ],
      },
      {
        id: "wr_forage_farm",
        cond: (p,C)=>camp(p),
        setup: prep,
        title: "The foraging party",
        text: "Foraging party. The farm is small: a woman, two children, a cow, and a sack of seed grain under the floor. Your orders are to bring back what the army needs. That seed is next spring's whole life.",
        choices: [
          {
            t: "Take everything, as ordered",
            r: "You take the seed and the cow. The woman does not cry. That is worse.",
            fx: {merit:3,honor:-6,happy:-3},
          },
          {
            t: "Take the cow and report the farm stripped",
            check: {s:"intrigue",s2:"int",d:40},
            win: {r:"The sergeant believes you. Somewhere a family will plant in spring.",fx:{honor:4,wil:.5}},
            lose: {
              r: "The sergeant finds the seed sack on a second look. Six strokes for you, and the seed goes anyway.",
              fx: {health:-8,merit:-4,honor:2,wil:1},
            },
          },
          {
            t: "Pay her out of your own pocket (10 suns)",
            req: p=>p.coin>=10,
            r: "You press ten suns into her hand. It is less than the seed is worth and more than anyone else will give her.",
            fx: {coin:-10,honor:6,piety:2},
          },
          {
            t: "Take the silver ring she offers to be left alone",
            r: "You pocket the ring and walk past. The next party will not.",
            fx: {coin:12,honor:-8},
          },
        ],
      },
      {
        id: "wr_loot_shrine",
        cond: (p,C)=>camp(p),
        setup: prep,
        title: "The village shrine",
        text: ()=>`The village is {foe} ground and empty. Its shrine still has ${A.pick(["a silver lamp","a silver offering bowl","a gilt reliquary"])} on the altar. Men from another file are already prying at the door. {mate} looks at you.`,
        choices: [
          {
            t: "Grab the silver before they do",
            check: {s:"spd",s2:"stealth",d:40},
            win: {
              r: "Silver is silver. The sutler gives you 40 suns and asks no questions.",
              fx: {coin:40,honor:-6,piety:-4},
            },
            lose: {
              r: "A file-leader sees you with it. Looting a shrine can earn a captain's rope; you get a flogging and lose the silver.",
              fx: {health:-12,merit:-5,honor:-6,wil:1},
            },
          },
          {
            t: "Stand in the doorway and stop them",
            check: {s:"wil",s2:"command",d:50},
            win: {
              r: "Something in your face stops them. They go off to rob a henhouse instead.",
              fx: {honor:6,fame:1,piety:3,wil:1},
            },
            lose: {
              r: "They shove you aside, and one breaks your nose for the trouble.",
              fx: {wound:"broken_nose",honor:4,wil:1},
            },
          },
          {
            t: "Leave it. Gods are gods.",
            r: "You walk on. Behind you, the altar cracks under an axe.",
            fx: {piety:1},
          },
        ],
      },
      {
        id: "wr_hang_looter",
        cond: (p,C)=>C.soldier(p)&&rank(p)>=4,
        title: "The captain's rope",
        setup: (p,ctx)=>{prep(p,ctx),ctx.looter=nm(p),ctx.lage=A.ri(17,22)},
        text: "A farmer kneels before your tent, hat in his hands. One of your men, {looter}, a boy of {lage}, took his pig and struck his wife. Two witnesses. A captain may hang a looter caught in the act on one. The whole company is watching what you do.",
        choices: [
          {
            t: "Hang him. The law is the law.",
            r: "You give the order. The company is very quiet that night, and very careful for a long time after.",
            fx: {merit:6,wil:2,happy:-6,fame:1},
          },
          {
            t: "Twelve strokes, and pay the farmer",
            r: "The boy lives, scarred. The farmer gets two suns and his pig back. Some officers call you soft.",
            fx: {coin:-2,honor:4,merit:2},
          },
          {
            t: "Put him first on the next ladder",
            r: "You let the enemy decide. {looter} goes first up the next wall.",
            fx: {merit:3,honor:-2},
          },
          {
            t: "Send the farmer away with nothing",
            r: "The farmer goes. Your men learn that the coat is a license to rob. You will pay for that lesson later.",
            fx: {honor:-8,merit:-3},
          },
        ],
      },
      {
        id: "wr_comrade_loots",
        cond: (p,C)=>C.soldier(p)&&mates(p)&&rank(p)<=2,
        setup: prep,
        title: "Half for you",
        text: `You come round a barn and find {mate} with a farm girl's dowry chest open, stuffing coins into {mhis} shirt. {Mhe} sees you. "Half for you. Nobody needs to know."`,
        choices: [
          {
            t: "Take your half",
            r: "Fifteen suns in your boot. Every time you look at {mate} now, you both remember.",
            fx: {coin:15,honor:-6,them:{op:5}},
          },
          {
            t: "Make {mhim} put it back",
            check: {s:"diplomacy",s2:"wil",d:45},
            win: {
              r: "{mate} swears, then puts it back. Later, by the fire, {mhe} thanks you.",
              fx: {honor:5,them:{op:10}},
            },
            lose: {
              r: '"Mind your own business." {Mhe} keeps the coin and never quite trusts you again.',
              fx: {them:{op:-15},honor:2},
            },
          },
          {
            t: "Report {mhim} to the file-leader",
            r: "{mate} is flogged in front of the file. The officers note your name. The men do not like an informer.",
            fx: {merit:4,them:{op:-40},rel:{who:"comrade",op:-5,all:!0},happy:-3},
          },
          {t:"Walk away and say nothing",r:"You saw nothing. It is the oldest rule of the camp.",fx:{}},
        ],
      },
      {
        id: "wr_cruel_captain",
        cond: (p,C)=>C.soldier(p)&&rank(p)<=3,
        setup: prep,
        title: "Twenty strokes",
        text: "Captain {capt} has the drummer boy tied to a wagon wheel for losing a shoe on the march. Twelve strokes is the most a squad captain may give. He has called for twenty.",
        choices: [
          {
            t: "Step forward and take the last eight yourself",
            check: {s:"wil",s2:"sta",d:50},
            win: {
              r: "You take eight strokes without a sound. The company never forgets it. Neither does the captain.",
              fx: {health:-15,wil:3,fame:2,honor:6,rel:{who:"comrade",op:8,all:!0},cause:"a flogging"},
            },
            lose: {
              r: "You go down at the fifth stroke. But the boy is spared the rest.",
              fx: {health:-20,wil:2,honor:5,wound:"back",cause:"a flogging"},
            },
          },
          {
            t: "Remind him, out loud, of the rule of twelve",
            check: {s:"diplomacy",s2:"learning",d:50},
            win: {
              r: "A senior captain hears. The flogging stops at twelve. Captain {capt} smiles at you in a way you do not like.",
              fx: {honor:4,merit:1,flag:"wr_capt_enemy"},
            },
            lose: {
              r: '"Twenty-one, then," says the captain. "And six for the barrack lawyer."',
              fx: {health:-10,wil:1.5,cause:"a flogging"},
            },
          },
          {
            t: "Look at your boots",
            r: "You count the strokes with everyone else. Twenty. You will hear them in your sleep.",
            fx: {happy:-5,wil:.5},
          },
        ],
      },
      {
        id: "wr_favorite",
        cond: (p,C)=>C.soldier(p)&&rank(p)<=3,
        setup: prep,
        title: "The captain's nephew",
        text: "The dry billet, the second horse, the easy guard at the general's tent: all of it goes to {sarge}, the captain's sister's son. Now he has your place on the file-leader's list too, and he cannot tie a buckle.",
        choices: [
          {
            t: "Challenge him to a bout with practice staves",
            r: "The whole company turns out to watch.",
            fx: {
              duel: {
                tier: 2,
                title: "the captain's nephew",
                troop: "SP",
                opts: {kind:"brawl",lethal:!1,toYield:!0,place:"the drill ground",title:"Staves on the drill ground"},
              },
            },
          },
          {
            t: "Make yourself useful to the captain instead",
            check: {s:"diplomacy",s2:"intrigue",d:50},
            win: {
              r: "You fetch, carry, flatter and remember his wine. Two months later the list has your name on it.",
              fx: {merit:8,honor:-2},
            },
            lose: {r:"The captain sees exactly what you are doing and despises it.",fx:{merit:-3,happy:-3}},
          },
          {
            t: "Swallow it and work harder",
            r: "You march first and dig deepest. The men notice, even if the captain does not.",
            fx: {merit:4,sta:.6,wil:1},
          },
        ],
      },
      {
        id: "wr_lowborn",
        cond: (p,C)=>C.soldier(p)&&!p.mil.merc&&["serf","peasant","slave"].includes(p.status)&&rank(p)>=1&&rank(p)<=4,
        setup: prep,
        title: "Born behind a plough",
        text: p=>`You have the merit, the scars and the men's trust. The commander's clerk reads out the list of new ${rank(p)>=3?"captains":"sergeants"}, and your name is not on it. "Good soldier," the clerk says to someone. "But born behind a plough. The knights would never stand for it."`,
        choices: [
          {
            t: "Demand to see the commander",
            check: {s:"diplomacy",s2:"wil",d:55},
            win: {
              r: "The commander hears you out, looks at your scars, and writes your name in himself. Somebody in the officers' mess spits.",
              fx: {merit:12,fame:1,honor:2},
            },
            lose: {
              r: "You are thrown out of the tent and fined a week's pay for insolence.",
              fx: {coin:-6,wil:2,happy:-5},
            },
          },
          {
            t: "Swallow it. Next year.",
            r: "It sits in your belly like a stone, and the stone makes you harder.",
            fx: {wil:2,happy:-4},
          },
          {
            t: "Think about a Free Company that pays for skill, not blood",
            r: "The hired companies care what you can do, not who your father was. You start asking around.",
            fx: {flag:"wr_merc_thoughts",int:.3,happy:1},
          },
        ],
      },
      {
        id: "wr_foreigner",
        cond: (p,C)=>C.soldier(p)&&!p.mil.merc&&rank(p)<=4&&(C.flag(p,"foreign")||A.realm(p.mil.realm)&&A.realm(p.mil.realm).race&&A.realm(p.mil.realm).race!==p.race),
        setup: prep,
        title: "Not one of us",
        text: p=>`"No ${GD.RACES[p.race]?GD.RACES[p.race].adj:"foreign"} gives orders to {mr} men." The squad captain says it to your face, cheerfully, as he hands the staff of command to a man with half your service.`,
        choices: [
          {
            t: "Volunteer for every hard duty until they see you",
            r: "A season of the worst duties. By the end, the men call you by your name instead of your race.",
            fx: {merit:6,sta:.8,wil:1.5,health:-5},
          },
          {
            t: "Flatten the next man who says it",
            r: "At supper a man says it again. You put down your bowl.",
            fx: {
              duel: {
                tier: 2,
                title: "a loudmouth from the mess",
                opts: {kind:"brawl",lethal:!1,toYield:!0,place:"the mess fire",title:"At the mess fire"},
              },
            },
          },
          {t:"Let it go",r:"You have heard it all your life. You let it go, again.",fx:{wil:1,happy:-3}},
        ],
      },
      {
        id: "wr_sentry_sleep",
        cond: (p,C)=>C.soldier(p),
        setup: prep,
        title: "Third watch",
        text: "Third watch on the picket line. Rain, no fire, two days without proper sleep. Your eyes keep closing. A sentry found asleep can hang in any army in Ardan.",
        choices: [
          {
            t: "Pinch yourself, pace, recite every prayer you know",
            check: {s:"wil",s2:"sta",d:45},
            win: {r:"Dawn comes grey and wet, and you are still on your feet.",fx:{wil:1.5,sta:.5}},
            lose: {
              r: "You wake to a boot in your ribs. The sergeant settles for a flogging instead of the rope. This time.",
              fx: {health:-12,merit:-6,wil:1,cause:"a flogging"},
            },
          },
          {
            t: "Pay {mate} a sun to stand your watch",
            req: p=>p.coin>=1,
            r: "{mate} takes the sun and your spear. You owe {mhim} more than a sun if the captain comes round.",
            fx: {coin:-1,them:{op:3},health:2},
          },
          {
            t: "Rub cold mud in your eyes and keep moving",
            r: "It stings like fire. You stay awake, and learn something about yourself.",
            fx: {wil:1,sta:.3},
          },
        ],
      },
      {
        id: "wr_sentry_shape",
        cond: (p,C)=>camp(p),
        setup: prep,
        title: "Beyond the stakes",
        text: ()=>`Something moves in the dark beyond the stakes. ${A.pick(["A crouching shape where no bush stood at sunset.","The soft clink of mail.","A twig snaps, and a breath is held too long."])}`,
        choices: [
          {
            t: "Go out and meet it",
            r: "You slip between the stakes with your blade low.",
            fx: {
              merit: 2,
              duel: {
                tier: 2,
                title: "an enemy scout",
                troop: "LI",
                opts: {kind:"duel",place:"the picket line",light:"night",title:"In the dark beyond the stakes"},
              },
            },
          },
          {
            t: "Raise the alarm",
            check: {s:"ins",s2:"int",d:40},
            win: {
              r: "The camp turns out. Torches find three enemy scouts with knives. The captain asks your name.",
              fx: {merit:5,fame:1},
            },
            lose: {
              r: "The camp turns out and finds a stray goat. Men curse you all the next day.",
              fx: {happy:-4,merit:-1},
            },
          },
          {
            t: "Keep still and watch",
            check: {s:"stealth",s2:"ins",d:45},
            win: {
              r: "You watch the shape slip away and see which way it goes. Your report is worth more than a dead scout.",
              fx: {merit:4,skill:{stealth:2}},
            },
            lose: {
              r: "You watch so hard you miss the second one. A cut across the arm in the dark, and then he is gone.",
              fx: {wound:"deep_cut",health:-8},
            },
          },
        ],
      },
      {
        id: "wr_sutler",
        cond: (p,C)=>C.soldier(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.sut=nm(p,"F")},
        title: "The sutler",
        text: "{sut} the sutler follows the company with a cart of bread, needles, ale and tallow. She knows every man's debts and every officer's secrets. Tonight she sits down next to you with a jug.",
        choices: [
          {
            t: "Ask her what she hears",
            check: {s:"diplomacy",s2:"intrigue",d:40},
            win: {
              r: `"Your captain sells the company's oats to a horse-dealer," she says. Now you know something worth knowing.`,
              fx: {skill:{intrigue:3},int:.3},
            },
            lose: {r:"She talks all night and tells you nothing at all. A professional.",fx:{}},
          },
          {
            t: "Buy a proper pair of boots from her (12 suns)",
            req: p=>p.coin>=12,
            r: "Good boots. On the march they are worth more than a sword.",
            fx: {coin:-12,sta:.5,health:4},
          },
          {
            t: "Help her fix the cart axle",
            check: {s:"craft",s2:"str",d:35},
            win: {
              r: "The axle holds. From then on your bread comes a little bigger.",
              fx: {health:3,happy:3,skill:{craft:2}},
            },
            lose: {r:"You break it worse. She calls you a name the whole company repeats for a month.",fx:{happy:-2}},
          },
        ],
      },
      {
        id: "wr_camp_boy",
        cond: (p,C)=>C.soldier(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.boy=nm(p,"M"),ctx.bage=A.ri(9,12)},
        title: "The camp boy",
        text: "A boy of about {bage}, {boy}, has followed the company since his village burned. He fetches water, steals food and sleeps under the baggage wagon. Lately he has started following you.",
        choices: [
          {
            t: "Take him under your wing",
            r: "You share your blanket and teach him to sharpen a blade. For a while you have someone to protect.",
            fx: {happy:5,honor:3,wil:.5,flag:"wr_boy"},
          },
          {
            t: "Pay a farm family to take him (10 suns)",
            req: p=>p.coin>=10,
            r: "You leave him with a miller's wife and ten suns. He cries. It is the best thing you do all year.",
            fx: {coin:-10,honor:5,piety:2,happy:2},
          },
          {
            t: "Chase him off. A camp is no place for a child.",
            r: "He goes. A week later you see him with another company, carrying their water.",
            fx: {happy:-2},
          },
        ],
      },
      {
        id: "wr_drill_sergeant",
        cond: (p,C)=>C.soldier(p)&&rank(p)<=1,
        setup: prep,
        title: "The drill sergeant",
        text: `Sergeant {sarge} has picked you. Every morning you carry the heaviest pole, stand the longest, and get screamed at the loudest. "You'll thank me when the arrows come," he says. Nobody believes him.`,
        choices: [
          {
            t: "Take it all without a word",
            check: {s:"wil",s2:"sta",d:45},
            win: {
              r: "At the end of the month {sarge} gives you a nod. From him it is a medal.",
              fx: {sta:1.5,str:.8,wil:2,merit:3,skill:{spear:2,shield:2}},
            },
            lose: {
              r: "You drop in the heat. He pours a bucket over you and starts again.",
              fx: {sta:1,wil:1.5,health:-5},
            },
          },
          {
            t: "Answer back",
            check: {s:"diplomacy",s2:"int",d:55},
            win: {
              r: "The whole file laughs, and even {sarge}'s mouth twitches. He eases up. A bit.",
              fx: {happy:3,fame:1},
            },
            lose: {r:"Three nights cleaning latrines. The smell stays in your nose until spring.",fx:{happy:-5,wil:1}},
          },
          {
            t: "Ask him to teach you properly",
            r: '"Finally, one with a brain." He shows you the shield-turn that keeps a spear out of your belly.',
            fx: {skill:{shield:4,spear:3},ins:.6},
          },
        ],
      },
      {
        id: "wr_gamble_debt",
        cond: (p,C)=>C.soldier(p)&&A.squad(p).length>=2,
        setup: (p,ctx)=>{prep(p,ctx),ctx.debt=A.ri(30,70)},
        title: "Bad dice",
        text: "Bad dice. You owe {mate2} {debt} suns, and pay day is a month away if it comes at all. {mate2} has started sharpening a knife where you can see it.",
        choices: [
          {
            t: "Pay it all",
            req: (p,C,ctx)=>p.coin>=(ctx.debt||30),
            r: "You pay. {mate2} grins and buys the next jug.",
            fx: (p,ctx)=>(p.coin=Math.max(0,p.coin-(ctx.debt||30)),""),
          },
          {
            t: "Double or nothing",
            check: {s:"int",s2:"ins",d:50},
            win: {r:"Double or nothing comes up nothing. The debt is gone, and {mate2} is not smiling.",fx:{happy:4}},
            lose: {
              r: "Now you owe twice as much. You hand over what you have and swear off dice. Again.",
              fx: {coinPct:-.5,happy:-6,wil:1},
            },
          },
          {
            t: "Ask {mate} to stand with you",
            check: {s:"diplomacy",s2:"wil",d:45},
            win: {
              r: '{mate} stands at your shoulder when {mate2} comes. The debt is suddenly "paid in friendship".',
              fx: {them:{op:6},happy:2},
            },
            lose: {
              r: "{mate2} goes to the file-leader. You pay with a week of digging, a flogging and a third of your purse.",
              fx: {health:-8,coinPct:-.3},
            },
          },
          {
            t: "Refuse to pay",
            r: "{mate2} meets you behind the baggage carts with the knife.",
            fx: both({
              duel: {
                tier: 2,
                title: "a dice-winner with a knife",
                opts: {kind:"duel",lethal:!1,toYield:!0,place:"behind the baggage carts",title:"Behind the baggage carts"},
              },
            }, op2(-30)),
          },
        ],
      },
      {
        id: "wr_desert_tempt",
        cond: (p,C)=>C.soldier(p)&&mates(p)&&rank(p)<=3,
        setup: prep,
        title: "The road home",
        text: p=>`{mate} whispers in the dark. "The road home is two days east. No pay in months, and the next fight will kill half of us. I'm going tonight. Come with me." Deserters ${deserterFate(p)} if they are caught.`,
        choices: [
          {
            t: "Go with {mhim}",
            r: "You slip out between the pickets with {mate}, carrying nothing but your boots and your fear.",
            fx: p=>(A.desert(),""),
          },
          {
            t: "Talk {mhim} out of it",
            check: {s:"diplomacy",s2:"wil",d:45},
            win: {
              r: "{mate} stays. Weeks later, after the next fight, {mhe} thanks you. Alive.",
              fx: {them:{op:12},wil:.5},
            },
            lose: {
              r: "In the morning {mate}'s blanket is empty. You never learn if {mhe} made it home.",
              fx: both({happy:-4},gone1),
            },
          },
          {
            t: "Report {mhim}",
            r: "They catch {mate} at the ford. The captain needs one witness. You are the witness.",
            fx: both({merit:5,honor:-4,wil:2,happy:-10},die1("hanged as a deserter on your word")),
          },
          {
            t: "Say nothing and stay",
            r: "{mate} is gone by morning. You did not stop {mhim}, and you did not follow.",
            fx: both({happy:-2},gone1),
          },
        ],
      },
      {
        id: "wr_nightmare",
        cond: (p,C)=>C.soldier(p)&&p.mil.battles>0,
        setup: prep,
        title: "Bad nights",
        text: ()=>`You wake in the dark with your heart hammering, sure you are back in the press. ${A.pick(["The smell of the field comes back with every cookfire.","You see the face of the first man you killed.","You hear the horses screaming."])} It has happened every night for a week.`,
        choices: [
          {
            t: "Talk to {mate} about it",
            r: "{mate} listens, then says {mhe} has the same dream. Somehow that helps more than anything.",
            fx: {wil:1.5,happy:4,them:{op:10}},
          },
          {
            t: "Go to the camp priest",
            r: p=>`The priest of ${faithName(p)} hears you out without judging. "Fear after a fight is not cowardice," he says. "It is the price of having been there."`,
            fx: {piety:4,wil:1,happy:3},
          },
          {
            t: "Keep it to yourself and keep working",
            check: {s:"wil",s2:"sta",d:50},
            win: {
              r: "Slowly, over weeks, the nights get quieter. You carry it, and it does not break you.",
              fx: {wil:2.5},
            },
            lose: {
              r: "It gets worse before it gets better. You snap at everyone, and the file notices.",
              fx: {wil:1.5,happy:-6,health:-3},
            },
          },
          {
            t: "Drink until you stop dreaming",
            r: "The ale works, for a while. Then it is just one more thing you need.",
            fx: {happy:2,health:-6,coin:-5},
          },
        ],
      },
      {
        id: "wr_shaking_hands",
        cond: (p,C)=>C.soldier(p)&&p.mil.battles>0,
        setup: prep,
        title: "Shaking hands",
        text: "The horns sound for drill, only drill, and your hands start to shake so badly you drop your spear. Some of the new men laugh. {mate} does not.",
        choices: [
          {
            t: "Breathe slowly, pick it up, carry on",
            check: {s:"wil",s2:"ins",d:45},
            win: {r:"Count, breathe, pick it up. The shaking passes. Nobody laughs a second time.",fx:{wil:2}},
            lose: {
              r: "It does not pass. The file-leader sends you to the baggage for the day, kindly, which is worse.",
              fx: {wil:1.5,happy:-4},
            },
          },
          {
            t: "Ask for a week with the wagons",
            r: "A week of mules and harness. Your hands are steadier when you come back.",
            fx: {happy:3,wil:1,merit:-1,skill:{husbandry:2}},
          },
          {
            t: "Let {mate} talk you through it",
            r: "{mate} sits with you behind the tents and talks about nothing, home, food, until it stops.",
            fx: {them:{op:10},wil:1,happy:2},
          },
          {
            t: "Thrash the man who laughed",
            r: "The laughing stops when you stand up.",
            fx: {
              duel: {
                tier: 1,
                title: "a green recruit",
                opts: {kind:"brawl",lethal:!1,toYield:!0,place:"the drill ground",title:"The man who laughed"},
              },
            },
          },
        ],
      },
      {
        id: "wr_fester",
        cond: (p,C)=>C.soldier(p)&&p.mil.battles>0,
        setup: prep,
        title: "A hot wound",
        text: ()=>`The cut on your ${A.pick(["thigh","forearm","side","calf"])} has gone hot and red, and it smells. The barber-surgeon who follows the company charges two suns to look at it.`,
        choices: [
          {
            t: "Pay the barber-surgeon (2 suns)",
            req: p=>p.coin>=2,
            r: "He opens it, washes it with vinegar and packs it with honey. You scream into a strap. In a week the redness fades.",
            fx: {coin:-2,health:8,wil:1},
          },
          {
            t: "Burn it clean yourself",
            check: {s:"wil",s2:"medicine",d:45},
            win: {
              r: "Hot iron and a strap between your teeth. It stops festering. You have a new scar.",
              fx: {wil:2,health:4,wound:"burn"},
            },
            lose: {
              r: "You burn it, and it festers anyway. Fever for ten days.",
              fx: {health:-20,wil:2,cause:"a festering wound"},
            },
          },
          {
            t: "Ignore it and march",
            check: {s:"sta",s2:"wil",d:55},
            win: {r:"Your body wins the fight on its own.",fx:{sta:.8,wil:1}},
            lose: {
              r: "Fever takes you on the road. They carry you in a cart for a week.",
              fx: {health:-25,wil:1.5,cause:"wound fever"},
            },
          },
        ],
      },
      {
        id: "wr_amputation",
        cond: (p,C)=>C.soldier(p)&&p.mil.battles>0,
        w: .4,
        cool: 12,
        setup: prep,
        title: "The saw",
        text: `A hand crushed in the last fight has turned black at the fingers. The surgeon wipes his saw on his apron. "It comes off at the wrist, or you die of it by the new moon. Five suns, and I'm quick."`,
        choices: [
          {
            t: "Let him cut (5 suns)",
            r: "He is quick. You will learn to do everything with one hand.",
            fx: {coin:-5,wound:"lost_hand",wil:3,health:-10,cause:"the surgeon's saw"},
          },
          {
            t: "Have {mate} hold you while he takes only the fingers",
            check: {s:"sta",s2:"wil",d:50},
            win: {
              r: "{mate} holds you down. The surgeon takes two fingers and leaves the hand. It is enough.",
              fx: {coin:-5,wound:"lost_fingers",wil:2.5,them:{op:10}},
            },
            lose: {
              r: "The rot is past the knuckles. Two days later he takes the hand anyway, and the fever comes with it.",
              fx: {coin:-5,wound:"lost_hand",wil:3,health:-22,cause:"gangrene"},
            },
          },
          {
            t: "Refuse, and pray it heals",
            check: {s:"sta",s2:"wil",d:62},
            win: {
              r: "Against all sense, the black stops at the knuckles. You lose two fingers and keep your life.",
              fx: {wound:"lost_fingers",wil:2,piety:2},
            },
            lose: {
              r: "The rot climbs. By the time you beg for the saw, the fever has its teeth in you.",
              fx: {wound:"lost_hand",health:-35,wil:3,cause:"gangrene"},
            },
          },
        ],
      },
      {
        id: "wr_arrow",
        cond: (p,C)=>camp(p),
        setup: prep,
        title: "An arrow from the hedge",
        text: ()=>`An arrow from a hedge catches you ${A.pick(["in the shoulder","in the meat of the thigh","under the collarbone"])}. The head is barbed. {mate} drags you behind a cart.`,
        choices: [
          {
            t: "Have {mate} push it through",
            check: {s:"sta",s2:"wil",d:45},
            win: {
              r: "Through and out the other side, clean. {mate} binds it with your own shirt.",
              fx: {wound:"arrow_wound",health:-8,wil:1.5,them:{op:8}},
            },
            lose: {
              r: "It snaps inside you. The surgeon digs for the head that night.",
              fx: {wound:"arrow_wound",health:-20,wil:2,cause:"an arrowhead left in the wound"},
            },
          },
          {
            t: "Wait for the surgeon",
            r: "You wait three hours with it in you. The surgeon draws it with a spoon-tool and a great deal of swearing.",
            fx: {wound:"arrow_wound",health:-12,wil:1,coin:-2},
          },
          {
            t: "Rip it out yourself",
            check: {s:"str",s2:"wil",d:55},
            win: {
              r: "You rip it out with a roar. The file talks about it for weeks.",
              fx: {wound:"arrow_wound",health:-10,fame:2,wil:1},
            },
            lose: {
              r: "The barbs tear. You pass out in your own blood.",
              fx: {wound:"arrow_wound",health:-28,cause:"bleeding from an arrow wound"},
            },
          },
        ],
      },
      {
        id: "wr_last_request",
        cond: (p,C)=>C.soldier(p)&&mates(p)&&camp(p),
        w: .6,
        setup: (p,ctx)=>{prep(p,ctx),ctx.kin=A.pick(["mother","sister","sweetheart","little brother"]),ctx.token=A.pick(["ring","knife","last pay","medal"])},
        title: "A last request",
        text: '{mate} has a wound under the arm that will not stop bleeding. Everyone knows what that means. {Mhe} grips your hand. "My {kin}, in {mhome}. Tell them. Take my {token} to them. Promise me."',
        choices: [
          {
            t: "Promise, and mean it",
            r: "You promise. {mate} smiles, and then is gone.",
            fx: both({wil:2,honor:3,flag:"wr_promise"},die1("bled out from a wound under the arm, holding your hand")),
          },
          {
            t: "Tell {mhim} the surgeon is coming",
            r: "You tell {mhim} help is on its way. {Mhe} believes you, at the end.",
            fx: both({wil:1.5,happy:-3},die1("bled out waiting for a surgeon who was never coming")),
          },
          {
            t: "Try to stop the bleeding",
            check: {s:"medicine",s2:"int",d:60},
            win: {
              r: "You jam your fist into the wound and shout until the surgeon comes. Against all odds, {mate} lives.",
              fx: {skill:{medicine:4},them:{op:30},merit:3,fame:1},
            },
            lose: {
              r: "You try. There is too much blood.",
              fx: both({wil:2,skill:{medicine:2}},die1("bled out under your hands")),
            },
          },
        ],
      },
      {
        id: "wr_promise_kept",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"wr_promise"),
        once: !0,
        title: "A promise to the dead",
        text: ()=>`You still carry a dead friend's ${A.pick(["ring","knife","last pay","medal"])}, and a promise. The village is out of your way, and the family does not know you.`,
        choices: [
          {
            t: "Make the journey and keep your word",
            r: "You find the house. You tell them how it was, the kind version and then, when they ask, the true one. They feed you and weep, and you leave lighter.",
            fx: {coin:-5,honor:6,wil:2,happy:4,piety:2,unflag:"wr_promise"},
          },
          {
            t: "Send it with a carter and a letter",
            r: "A carter and a few lines. It is not what you promised, but it gets there.",
            fx: {coin:-2,honor:1,unflag:"wr_promise"},
          },
          {
            t: "Sell it. The dead don't need it.",
            r: "Eight suns. You never quite look at yourself the same way.",
            fx: {coin:8,honor:-8,happy:-4,unflag:"wr_promise"},
          },
        ],
      },
      {
        id: "wr_burial",
        cond: (p,C)=>camp(p)&&p.mil.battles>0,
        setup: prep,
        title: "The burial detail",
        text: p=>`After the fight, the burial details. You dig a long pit in the rain. ${p.faith==="REL-01"?"The Temple forbids burning the dead, so you dig deep.":p.faith==="REL-10"?"The Ranpuri men build pyres for their own; the rest go in the ground.":"You dig deep, so the wolves and the crows get nothing."} Some of the faces you know.`,
        choices: [
          {
            t: "Say the words over them yourself",
            check: {s:"faith",s2:"wil",d:40},
            win: {
              r: "You remember the words. The men stand bareheaded, and some of them weep.",
              fx: {piety:4,wil:1.5,fame:1,rel:{who:"comrade",op:4,all:!0}},
            },
            lose: {r:"You lose the words halfway and have to stop. Someone else finishes.",fx:{wil:1,happy:-2}},
          },
          {
            t: "Take boots and coin from the dead first",
            r: "Dead men need no boots. You come away with 9 suns and a good pair, and the burial sergeant looks at you sideways.",
            fx: {coin:9,honor:-3},
          },
          {
            t: "Dig, and say nothing",
            r: "You dig until your hands blister and the pit is full. That is the whole of it.",
            fx: {wil:1.5,sta:.5,happy:-3},
          },
        ],
      },
      {
        id: "wr_knight_ransom",
        cond: (p,C)=>camp(p)&&rank(p)<=5,
        w: .5,
        setup: prep,
        title: "A knight yields",
        text: 'In the chaos of the rout a {foe} knight, unhorsed and with a broken leg, holds out his gauntlet to you. "I yield. My house will pay two thousand suns for me." All around, men are killing prisoners in hot blood.',
        choices: [
          {
            t: "Take him to your captain and claim the ransom",
            check: {s:"diplomacy",s2:"wil",d:50},
            win: {
              r: "Months later the ransom comes: two thousand suns, less a third to your captain. You are rich.",
              fx: {coin:1330,fame:3,merit:5,deed:"took a knight for ransom"},
            },
            lose: {
              r: 'A senior captain "takes charge" of your prisoner. You get 100 suns and a pat on the back.',
              fx: {coin:100,happy:-6,wil:1},
            },
          },
          {
            t: "Sell your claim to the captain now for 300 suns",
            r: "Three hundred in your hand today beats two thousand promised next year.",
            fx: {coin:300,merit:2},
          },
          {
            t: "Let him go on his word to pay later",
            check: {s:"int",s2:"diplomacy",d:55},
            win: {
              r: 'A year later a rider brings a purse of 800 suns and a letter: "A knight pays his debts."',
              fx: {coin:800,honor:8,fame:2},
            },
            lose: {r:"You never see him or a sun again. But you hear he tells the story kindly.",fx:{honor:6,fame:1}},
          },
          {
            t: "Kill him like the others",
            r: "Hot blood. You will think about the two thousand suns, and about his face, for a long time.",
            fx: {honor:-8,wil:1,trait:"cruel"},
          },
        ],
      },
      {
        id: "wr_prisoners",
        cond: (p,C)=>camp(p)&&rank(p)>=1,
        setup: (p,ctx)=>{prep(p,ctx),ctx.np=A.ri(8,30)},
        title: "Prisoners",
        text: 'You have charge of {np} {foe} prisoners: farm boys mostly, levy men in padded coats. The column has no food to spare for them. The squad captain says, "Deal with it."',
        choices: [
          {
            t: "Release them on oath not to fight again",
            r: "They swear on everything holy and run. Some will keep the oath.",
            fx: {honor:6,piety:1,merit:-2},
          },
          {
            t: "Sell them to the slave-dealer following the army",
            req: p=>["well","pirate","other","east"].includes(law(p)),
            r: "The dealer pays by the head. You do not look at their faces.",
            fx: {coin:30,honor:-10},
          },
          {
            t: "March them to the rear on your own ration",
            check: {s:"sta",s2:"wil",d:50},
            win: {
              r: "You get them all to the rear alive. The exchange brings back six of your own men.",
              fx: {merit:6,honor:5,wil:1.5,health:-5},
            },
            lose: {
              r: "Two die on the road and the rest nearly riot from hunger. But most live.",
              fx: {merit:2,honor:3,wil:1,health:-6},
            },
          },
          {
            t: "Do what the captain means",
            r: "You do it. Afterward nobody in the section speaks of it, ever.",
            fx: {merit:3,honor:-12,happy:-8,wil:1},
          },
        ],
      },
      {
        id: "wr_merc_offer",
        cond: (p,C)=>C.soldier(p)&&p.mil.merc,
        setup: (p,ctx)=>{prep(p,ctx);const e=A.enemyRealmOf(R(p));ctx.rid=e||"",ctx.other=e?A.realmShort(e):"a richer prince"},
        title: "Double pay",
        text: "An agent of {other} finds you in a tavern. He offers double pay to any man of {unit} who crosses over with his arms before the month is out. Your contract still has a season to run.",
        choices: [
          {
            t: "Take the double pay",
            r: "You slip away with your kit. The new paymaster is generous, at first.",
            fx: (p,ctx)=>(p.mil&&ctx.rid&&A.realm(ctx.rid)&&(p.mil.contract=ctx.rid),p.coin+=40,p.honor=A.clamp(p.honor-10,0,100),""),
          },
          {
            t: "Tell your captain",
            r: "The captain has the agent thrown in the river and gives you a bonus.",
            fx: {coin:15,merit:5,honor:3},
          },
          {
            t: "Refuse. A contract is a contract.",
            r: "Since the Solen Code of 515, a company's written word binds it. So does yours.",
            fx: {honor:4},
          },
        ],
      },
      {
        id: "wr_merc_unpaid",
        cond: (p,C)=>C.soldier(p)&&p.mil.merc,
        setup: (p,ctx)=>{prep(p,ctx),ctx.days=A.pick([35,45,60,75])},
        title: "The pay chest is late",
        text: "The pay chest is {days} days late. By the contract, after thirty days the company may stop work; after sixty it may leave with its arms and take pledges. In the mess they talk about the Debtors' Wall: Madara, seized by unpaid Free Companies, and Lorino, sacked by the Grey Hand after fourteen months.",
        choices: [
          {
            t: "Speak for taking pledges from the town",
            check: {s:"command",s2:"diplomacy",d:50},
            win: {
              r: "The company takes the town gate and the council's silver as a pledge. Your share is 30 suns, and a name for boldness.",
              fx: {coin:30,fame:2,honor:-3,flag:"wr_mutineer"},
            },
            lose: {
              r: "The employer's men were ready. Two ringleaders hang. You stand third in line when the employer decides two is enough.",
              fx: {health:-10,wil:2,honor:-3},
            },
          },
          {
            t: "Wait. The silver always comes eventually.",
            r: "It comes. Half of it, in clipped coin.",
            fx: {coin:10,wil:.5},
          },
          {
            t: "Hand back your badge and walk",
            r: "You hand back the company badge and walk out of camp.",
            fx: p=>{const r=A.resign();return r&&r.ok?"":"They will not let you go."},
          },
        ],
      },
      {
        id: "wr_crown_unpaid",
        cond: (p,C)=>C.soldier(p)&&!p.mil.merc&&A.squad(p).length>=2,
        setup: prep,
        title: "Mutiny talk",
        text: `Quarter day came and went with no pay. Then another. The men of {unit} gather in knots, and {mate2} is talking loudly about marching on the paymaster's tent. "They can't hang all of us."`,
        choices: [
          {
            t: "Join the mutiny",
            check: {s:"command",s2:"diplomacy",d:55},
            win: {
              r: "The commander pays out of his own chest to end it before the general hears. Two quarters' pay.",
              fx: {coin:25,flag:"wr_mutineer",fame:1,honor:-2},
            },
            lose: {
              r: "They cannot hang all of you. A commander may hang one in ten.",
              fx: p=>(p.flags.wr_mutineer=A.S.year,A.chance(.3)?(gallows(p),"The lot falls on you."):(p.health=A.clamp(p.health-15,0,100),p.lastHurt="a flogging",A.willGrow(p,2),"The lot passes you by. You are flogged with the rest.")),
            },
          },
          {
            t: "Warn the officers",
            r: "The ringleaders are taken at night. Your name goes in the captain's good book, and in the men's bad one.",
            fx: both({merit:8,honor:-3,rel:{who:"comrade",op:-10,all:!0}},die2("hanged as a mutineer")),
          },
          {
            t: "Talk {mate2} down",
            check: {s:"diplomacy",s2:"wil",d:50},
            win: {
              r: "You talk {mate2} out of it over a jug. The fever passes, and the pay comes a week later.",
              fx: {coin:8,honor:2,merit:2},
            },
            lose: {r:"{mate2} calls you a coward in front of everyone.",fx:{happy:-4}},
          },
          {
            t: "Keep your head down",
            r: "You stay by your fire. In the end the pay comes, a quarter late and a fifth short.",
            fx: {coin:8},
          },
        ],
      },
      {
        id: "wr_siege_hunger",
        cond: (p,C)=>C.soldier(p)&&war(p),
        w: .7,
        setup: prep,
        title: "The siege lines",
        text: ()=>`The siege is in its ${A.pick(["tenth","fourteenth","twentieth"])} week. The country for fifteen kilometers around has been eaten bare. Today the cooks are boiling ${A.pick(["the last of the draft oxen","the baggage mules","the officers' spare horses"])}, and the men are snaring rats.`,
        choices: [
          {
            t: "Eat what there is and say nothing",
            r: "Rat tastes like rat. You live.",
            fx: {wil:1.5,health:-5,cause:"siege hunger"},
          },
          {
            t: "Go on a long forage with {mate}",
            check: {s:"survival",s2:"command",d:50},
            win: {
              r: "Thirty kilometers out you find a valley nobody has stripped. You come back with four carts of grain and a reputation.",
              fx: {merit:6,fame:1,health:2,skill:{survival:3}},
            },
            lose: {
              r: "Enemy horse catch the party in the open. You get back on foot.",
              fx: both({health:-15,wil:2,wound:"deep_cut",cause:"a sabre cut"}, (p,ctx)=>A.chance(.5)?die1("ridden down by enemy horse on a forage")(p,ctx):""),
            },
          },
          {
            t: "Trade across the ditch with the besieged at night",
            check: {s:"intrigue",s2:"stealth",d:55},
            win: {
              r: "Your salt for their wine. Everyone on both sides does it; you just do it better.",
              fx: {coin:20,skill:{intrigue:2}},
            },
            lose: {
              r: "Caught by your own side. Trading with the enemy: flogged and fined.",
              fx: {health:-12,coin:-10,merit:-6,cause:"a flogging"},
            },
          },
        ],
      },
      {
        id: "wr_mine_gallery",
        cond: (p,C)=>C.soldier(p)&&war(p),
        w: .7,
        setup: prep,
        title: "The mine",
        text: "You are told off to the mine: a gallery a meter wide and barely taller, propped with timber, crawling toward the wall's footings. Today you hear picks on the other side of the earth. The defenders are counter-mining toward you.",
        choices: [
          {
            t: "Volunteer for the knife-party in the dark",
            r: "You crawl forward with a short knife and a shuttered lamp.",
            fx: {
              merit: 4,
              duel: {
                tier: 2,
                title: "a counter-miner",
                troop: "LI",
                opts: {kind:"duel",place:"a mine gallery",light:"night",title:"Knives in the dark"},
              },
            },
          },
          {
            t: "Keep digging and pray the props hold",
            check: {s:"sta",s2:"str",d:50},
            win: {
              r: "Twelve days later the props are packed with brushwood and fat and fired. The wall cracks. You dug that.",
              fx: {merit:6,str:.8,sta:.8},
            },
            lose: {
              r: "A prop gives. The earth closes over you. They dig you out choking.",
              fx: {health:-18,wound:"lungs",wil:2,cause:"buried in a mine"},
            },
          },
          {
            t: "Smoke them out with burning straw and feathers",
            check: {s:"int",s2:"craft",d:45},
            win: {r:"The smoke rolls into their gallery. The picking stops.",fx:{merit:5,int:.5}},
            lose: {
              r: "The draft is wrong. The smoke rolls back over you.",
              fx: {health:-10,wound:"lungs",cause:"smoke in a mine"},
            },
          },
        ],
      },
      {
        id: "wr_siege_flux",
        cond: (p,C)=>C.soldier(p)&&war(p)&&mates(p),
        w: .7,
        setup: prep,
        title: "The flux",
        text: "The flux runs through the siege lines. Men squat by the latrine trenches all day and die thin as sticks. Now {mate} is down with it, shivering in a tent that smells of death.",
        choices: [
          {
            t: "Nurse {mhim}: clean water, broth, warmth",
            check: {s:"medicine",s2:"sta",d:50},
            win: {
              r: "{mate} lives. You never catch it yourself, which the priests call a blessing.",
              fx: {skill:{medicine:4},them:{op:20},honor:3},
            },
            lose: {
              r: "You nurse {mhim}, and catch it yourself.",
              fx: both({health:-15,skill:{medicine:2},wil:1,cause:"the flux"},(p,ctx)=>A.chance(.5)?die1("wasted by the flux")(p,ctx):""),
            },
          },
          {
            t: "Move your tent upwind, onto the high ground",
            r: "You drag your gear up onto the windy ridge, away from the marsh and the bad air. Whatever it is, you stay well.",
            fx: both({health:3,int:.4},(p,ctx)=>A.chance(.5)?die1("the flux, alone in a tent by the marsh")(p,ctx):""),
          },
          {
            t: "Pray over {mhim}",
            r: p=>`You pray to ${A.godWord(p)||"the gods"} over {mate} every night.`,
            fx: both({piety:4,wil:.5},(p,ctx)=>A.chance(.5)?die1("wasted by the flux")(p,ctx):"{mate} pulls through."),
          },
        ],
      },
      {
        id: "wr_forlorn_hope",
        cond: (p,C)=>C.soldier(p)&&war(p)&&rank(p)<=1,
        w: .7,
        setup: prep,
        title: "The forlorn hope",
        text: `The captain wants twenty volunteers for the first ladders. "The forlorn hope," the men call it. Double pay, and a file-leader's staff for any man who lives. Most do not.`,
        choices: [
          {
            t: "Step forward",
            check: {s:"ins",s2:"str",d:55},
            win: {
              r: "You are on the wall, then over it. When it is done you are alive, and a name in the company.",
              fx: {merit:20,fame:4,coin:20,wil:2,deed:"went up the first ladder"},
            },
            lose: {
              r: "A stone takes the ladder. You fall into the ditch and wake among the dead.",
              fx: {health:-30,wound:"broken_ribs",wil:3,merit:6,cause:"a fall from a siege ladder"},
            },
          },
          {
            t: "Go up beside {mate}",
            check: {s:"ins",s2:"str",d:55},
            win: {
              r: "You and {mate} go up together and stand on the wall together. Brothers now.",
              fx: {merit:20,fame:4,coin:20,them:{op:20},deed:"went up the first ladder"},
            },
            lose: {
              r: "Halfway up, the ladder is pushed off with a fork.",
              fx: both({health:-20,wil:3,merit:6,cause:"a fall from a siege ladder"},die1("thrown from the ladder beside you")),
            },
          },
          {t:"Stay in line",r:"You let braver or more desperate men go. Six come back.",fx:{happy:-2}},
        ],
      },
      {
        id: "wr_sergeant_section",
        cond: (p,C)=>C.soldier(p)&&rank(p)>=2&&rank(p)<=3&&mates(p),
        setup: prep,
        title: "Your section",
        text: 'Your section held the ford for six hours. Now the squad captain wants a man flogged because the section "gave ground" at the end, and he wants you to name him. {mate} was the one at the end of the line.',
        choices: [
          {
            t: "Take the blame yourself",
            r: "You say the order to step back was yours. You lose a month's pay. Your section would follow you into a fire now.",
            fx: {coin:-10,rel:{who:"comrade",op:12,all:!0},merit:-3,honor:5,wil:1},
          },
          {
            t: "Argue the section did its duty",
            check: {s:"command",s2:"diplomacy",d:50},
            win: {
              r: "You lay it out: six hours, two attacks, one step back. The captain lets it go.",
              fx: {merit:3,rel:{who:"comrade",op:8,all:!0},skill:{command:3}},
            },
            lose: {
              r: "The captain decides you need a lesson too. You are fined, and {mate} is flogged anyway.",
              fx: {coin:-6,them:{op:-5}},
            },
          },
          {
            t: "Name {mate}",
            r: "{mate} takes six strokes. {Mhe} looks at you differently afterward. So does everyone.",
            fx: {merit:2,them:{op:-30},rel:{who:"comrade",op:-6,all:!0}},
          },
        ],
      },
      {
        id: "wr_captain_errand",
        cond: (p,C)=>C.soldier(p)&&rank(p)>=4&&rank(p)<=6&&A.squad(p).length>=2,
        setup: prep,
        title: "Who holds the bridge",
        text: "The commander needs a party to hold the bridge until the column is across. It will not come back. You must choose: {mate}, your oldest hand, who {quirk}, and the veterans; or {mate2} and the new men, who are green and may break.",
        choices: [
          {
            t: "Send {mate} and the veterans",
            r: "They hold the bridge until the last wagon is across. {mate} does not come back.",
            fx: both({merit:8,wil:2,happy:-8},die1("held the bridge to the last")),
          },
          {
            t: "Send {mate2} and the green men",
            check: {s:"command",s2:"tactics",d:55},
            win: {
              r: "The green men surprise everyone. They hold, then run, and most of them live.",
              fx: {merit:6,skill:{command:3}},
            },
            lose: {
              r: "They break in an hour. The column loses its wagons, and the commander loses patience with you.",
              fx: both({merit:-6,wil:1.5},die2("cut down when the green men broke at the bridge")),
            },
          },
          {
            t: "Lead the party yourself",
            check: {s:"tactics",s2:"ins",d:60},
            win: {
              r: "You hold the bridge with twenty men and come back with eleven. The army sings about it for a month.",
              fx: {merit:15,fame:5,wil:2,deed:"held the bridge with twenty men",epithet:"the Bridge-Holder"},
            },
            lose: {
              r: "You hold it. You do not come back whole.",
              fx: {health:-35,wound:"limp",merit:10,fame:3,wil:3,cause:"wounds taken holding the bridge"},
            },
          },
        ],
      },
      {
        id: "wr_general_supply",
        cond: (p,C)=>C.soldier(p)&&rank(p)>=7,
        setup: (p,ctx)=>{prep(p,ctx);const men=(GD.MIL[rank(p)]||GD.MIL[7]).leads;ctx.men=A.fmt?A.fmt(men):String(men),ctx.tons=Math.max(10,Math.round(men*1.1/1e3)),ctx.days=A.ri(4,7)},
        title: "Supply or speed",
        text: "The {foe} army is {days} days ahead and falling back on its fortresses. Your carts hold ten days' food; {men} men eat about {tons} tonnes of grain a day, and the horses more. Force the march and catch them before the walls, or wait for the river barges and the siege train.",
        choices: [
          {
            t: "Force the march: 35 kilometers a day",
            check: {s:"tactics",s2:"command",d:60},
            win: {
              r: "You catch them strung out at a river. A short, sharp fight, and the road beyond lies open.",
              fx: {merit:30,fame:5,skill:{tactics:4},favor:5},
            },
            lose: {
              r: "You catch them, but your men arrive half-starved and the horses founder. A bloody draw, then a hungry retreat.",
              fx: {merit:-15,fame:-2,wil:2,favor:-5},
            },
          },
          {
            t: "Wait for the barges and the engines",
            r: "Slow and sure. The enemy reaches its walls, and you settle in for a siege the treasury will feel.",
            fx: {merit:6,skill:{stewardship:3}},
          },
          {
            t: "Forage forward and strip the country",
            r: "The army eats well and moves fast. Behind it, the villages starve. The chronicles will remember.",
            fx: {merit:12,honor:-8,fame:2},
          },
          {
            t: "Fall back and draw them after you",
            check: {s:"tactics",s2:"int",d:55},
            win: {
              r: "They follow you onto ground of your choosing, and it costs them dearly.",
              fx: {merit:15,skill:{tactics:3}},
            },
            lose: {r:"They do not follow. The crown asks why its army is marching backward.",fx:{favor:-8,merit:-5}},
          },
        ],
      },
      {
        id: "wr_general_quarters",
        cond: (p,C)=>C.soldier(p)&&rank(p)>=5,
        setup: prep,
        title: "Winter quarters",
        text: "Winter is coming, and the troops must go into quarters. Billet them on the townsfolk of {town}, who will hate you for it, or build a hut camp on open ground, where cold and fever will take their share.",
        choices: [
          {
            t: "Billet them on the town",
            r: "The men are warm. The town petitions the crown against you every week until spring.",
            fx: {merit:4,favor:-3,honor:-2},
          },
          {
            t: "Hut camp on high, windy ground, latrines downwind",
            check: {s:"stewardship",s2:"command",d:50},
            win: {
              r: "Cold, but healthy. In spring you march out with nearly every man you had.",
              fx: {merit:10,skill:{stewardship:3},fame:1},
            },
            lose: {
              r: "Fever gets into the camp anyway. A tenth of the men are under the snow by spring.",
              fx: {merit:-5,wil:2,happy:-5},
            },
          },
          {
            t: "Pay the town for quartering from your own purse (200 suns)",
            req: p=>p.coin>=200,
            r: "It costs you two hundred suns. {town} remembers your name kindly.",
            fx: {coin:-200,fame:3,honor:5,favor:2},
          },
        ],
      },
      {
        id: "wr_file_blow",
        cond: (p,C)=>C.soldier(p)&&rank(p)===1&&A.squad(p).length>=2,
        setup: prep,
        title: "The file-leader's staff",
        text: "A new man in your file, {mate2}, drops his spear for the third time at drill, and the squad captain is watching. A file-leader may strike a soldier with hand or staff. Everyone waits to see if you will.",
        choices: [
          {
            t: "Strike him, once, hard",
            r: "One blow with the staff. {mate2} never drops the spear again, and never quite looks you in the eye.",
            fx: both({merit:3,skill:{command:2}},op2(-15)),
          },
          {
            t: "Drill him yourself after dark",
            check: {s:"command",s2:"wil",d:40},
            win: {
              r: "By the end of the week {mate2} has the drill down cold.",
              fx: both({skill:{command:3},merit:2},op2(15)),
            },
            lose: {r:"He is hopeless. But he loves you for trying.",fx:both({skill:{command:1}},op2(10))},
          },
          {
            t: "Laugh it off in front of the captain",
            check: {s:"diplomacy",s2:"ins",d:45},
            win: {r:`"Green as grass, sir. He'll ripen." The captain snorts and rides on.`,fx:{happy:2}},
            lose: {r:"The captain is not amused. Your file digs latrines for a week.",fx:{merit:-3}},
          },
        ],
      },
      {
        id: "wr_comrade_jilted",
        cond: (p,C)=>C.soldier(p)&&mates(p),
        setup: prep,
        title: "A letter for {mate}",
        text: "A letter comes for {mate}. {Mhe} reads it twice and walks out of camp without a word. You find {mhim} by the river later. {Mhis} sweetheart in {mhome} has married a miller.",
        choices: [
          {
            t: "Sit with {mhim} and say nothing",
            r: "You sit until dark. Sometimes that is all a friend can do.",
            fx: {them:{op:12},wil:.5},
          },
          {
            t: "Get {mhim} roaring drunk",
            r: "You both get blind drunk and sing rude songs about millers. The sergeant fines you both. Worth it.",
            fx: {them:{op:15},coin:-3,happy:3},
          },
          {
            t: "Tell {mhim} to toughen up",
            r: "{mate} goes quiet. For weeks after, {mhe} volunteers for every dangerous duty.",
            fx: {them:{op:-8}},
          },
          {
            t: "Write a dignified reply for {mhim}",
            req: p=>p.literate,
            check: {s:"learning",s2:"diplomacy",d:40},
            win: {
              r: "The letter is so fine that {mate} reads it aloud to the whole mess. {Mhe} stands taller after.",
              fx: {them:{op:15},skill:{learning:2}},
            },
            lose: {r:"It comes out bitter. {mate} burns it.",fx:{them:{op:3}}},
          },
        ],
      },
      {
        id: "wr_ford_rescue",
        cond: (p,C)=>C.soldier(p)&&mates(p),
        setup: prep,
        title: "The ford",
        text: p=>`Crossing a swollen ford, the current takes your feet and your kit drags you under${p.race==="dwarf"?" like a stone; dwarves do not swim":""}. A hand grabs your collar. {mate} hauls you out coughing, then laughs. "You owe me a life, {name}."`,
        choices: [
          {
            t: "Swear a life-debt",
            r: "You swear it on your blade. {mate} pretends it means nothing. It means everything.",
            fx: {them:{op:25},honor:2,flag:"wr_lifedebt"},
          },
          {
            t: "Learn to swim, finally",
            req: p=>p.race!=="dwarf"&&p.race!=="giant",
            check: {s:"sta",s2:"str",d:40},
            win: {
              r: "You badger {mate} into teaching you in still water. By summer you can swim.",
              fx: {sta:1,skill:{survival:2},them:{op:10}},
            },
            lose: {r:"You flail, sink, and give up. You will just have to stay away from rivers.",fx:{them:{op:5}}},
          },
          {
            t: "Pay {mhim} back in coin (10 suns)",
            req: p=>p.coin>=10,
            r: "{mate} takes the coin and looks a little hurt. Some debts are not paid in suns.",
            fx: {coin:-10,them:{op:3}},
          },
          {
            t: "Laugh it off",
            r: `"I'd have made it." {mate} grins. You both know you would not.`,
            fx: {them:{op:6}},
          },
        ],
      },
      {
        id: "wr_veteran",
        cond: (p,C)=>C.soldier(p)&&rank(p)<=2,
        setup: (p,ctx)=>{prep(p,ctx);const w=LORE.wars&&LORE.wars.length?A.pick(LORE.wars):null;ctx.oldwar=w&&w[1]?w[1]:"the old wars"},
        title: "An old soldier",
        text: "Old {sarge} has thirty years in the ranks and no teeth. He talks about the {oldwar} as if it were yesterday. Tonight he is in a teaching mood.",
        choices: [
          {
            t: "Ask how to survive a rout",
            r: '"Never drop your shield, never show your back, and run for the wood, not the open." Most of the dead, he says, die after the line breaks.',
            fx: {skill:{shield:3,tactics:2},int:.3},
          },
          {
            t: "Ask how to stay fed on campaign",
            r: "He shows you how to find grain buried under a farmhouse floor, and how to make biscuit last a week.",
            fx: {skill:{survival:4}},
          },
          {
            t: "Ask for a sparring lesson",
            check: {s:"ins",s2:"spear",d:40},
            win: {r:"He puts you on your back three times, then shows you why.",fx:{skill:{spear:4,sword:2},ins:.8}},
            lose: {
              r: 'He breaks two of your fingers "by accident" and apologizes for a week.',
              fx: {skill:{spear:2},health:-5},
            },
          },
        ],
      },
      {
        id: "wr_muster_test",
        cond: (p,C)=>C.soldier(p),
        setup: prep,
        title: "Muster day",
        text: p=>{const t=p.mil?p.mil.troop:"";return`Muster day. The paymaster's clerk and a sergeant of his choosing test one man in ten against the company's claims. The finger points at you: ${t==="XB"?"span with the belt hook and put four of six bolts into a shield at a hundred paces in two minutes":t==="AR"||t==="LB"||t==="EA"?"put six of ten arrows into a man-sized mark at a hundred meters":t==="HC"||t==="MC"||t==="LC"?"carry off a ring on the lance point at a canter, three runs of four":"march thirty kilometers a day with twenty-five kilos, three days running"}.`},
        choices: [
          {
            t: "Shoot for your pay",
            req: p=>p.mil&&["XB","AR","LB","EA"].includes(p.mil.troop),
            check: {s:"ins",s2:"bow",d:45,bonus:p=>Math.max(0,A.skill(p,"xbow")-A.skill(p,"bow"))*.4},
            win: {r:"Every shot in the mark. Double base pay for the season.",fx:{coin:20,merit:3,fame:1}},
            lose: {
              r: "You miss the count. You lose the pay for that claim, and the company is fined.",
              fx: {coin:-10,merit:-4},
            },
          },
          {
            t: "Ride the ring",
            req: p=>p.mil&&["HC","MC","LC"].includes(p.mil.troop),
            check: {s:"riding",s2:"lance",d:45},
            win: {r:"Three rings of four. The clerk writes you down for double pay.",fx:{coin:20,merit:3,fame:1}},
            lose: {r:"The ring bounces off your point. Pay docked, company fined.",fx:{coin:-10,merit:-4}},
          },
          {
            t: "March the test",
            check: {s:"sta",s2:"wil",d:45},
            win: {
              r: "Three days, ninety kilometers, and you finish ahead of the sergeant.",
              fx: {coin:15,merit:3,sta:.8},
            },
            lose: {
              r: "You fall out on the third day. Pay docked, and the captain hears of it.",
              fx: {coin:-8,merit:-3,wil:1},
            },
          },
          {
            t: "Slip the clerk five suns",
            req: p=>p.coin>=5,
            check: {s:"intrigue",s2:"diplomacy",d:40},
            win: {r:"The clerk's eyes are suddenly very bad. You pass.",fx:{coin:-5,merit:1}},
            lose: {r:"This clerk is honest. You are fined, and laughed at.",fx:{coin:-12,merit:-5}},
          },
        ],
      },
      {
        id: "wr_booty",
        cond: (p,C)=>camp(p),
        setup: prep,
        title: "The share-book",
        text: p=>`Booty is shared by contract: a tenth to the captain, a tenth to the employer${["POL-01","POL-08"].includes(R(p))?", the gods' tenth to the halls":""}, the rest by shares. Tonight the quartermaster reads out the share-book, and your share is half what it should be.`,
        choices: [
          {
            t: "Demand to see the share-book",
            check: {s:"learning",s2:"int",d:50,bonus:p=>p.literate?8:-10},
            win: {
              r: "The sums do not add up, and you can prove it. The captain pays you out of his own tenth to keep it quiet.",
              fx: {coin:25,skill:{learning:2}},
            },
            lose: {r:"You cannot make the figures say anything. The quartermaster smiles.",fx:{happy:-3}},
          },
          {
            t: "Rally the file to complain together",
            check: {s:"command",s2:"diplomacy",d:50},
            win: {
              r: "Twenty men complaining at once are hard to ignore. The shares are counted again.",
              fx: {coin:18,rel:{who:"comrade",op:5,all:!0},fame:1},
            },
            lose: {
              r: "The captain calls it mutiny talk and fines the lot of you.",
              fx: {coin:-5,rel:{who:"comrade",op:-3,all:!0}},
            },
          },
          {t:"Take what you get",r:"Fourteen suns. Better than nothing, worse than fair.",fx:{coin:14}},
        ],
      },
      {
        id: "wr_billet_widow",
        cond: (p,C)=>C.soldier(p)&&rank(p)<=3,
        setup: (p,ctx)=>{prep(p,ctx),ctx.host=nm(p,"F")},
        title: "Billeted",
        text: "Winter quarters. You and {mate} are billeted on a widow named {host} and her three children in a two-room house. She did not ask for you. She has to feed you anyway.",
        choices: [
          {
            t: "Work her fields and chop her wood in return",
            r: "By spring her woodpile is the biggest in the village and the children follow you everywhere. She cries when you leave.",
            fx: {honor:4,happy:5,str:.6,skill:{husbandry:2}},
          },
          {
            t: "Pay her for your keep (8 suns)",
            req: p=>p.coin>=8,
            r: "Eight suns is more than the crown will ever pay her. She feeds you better than the army ever did.",
            fx: {coin:-8,health:5,honor:3},
          },
          {
            t: "Eat her out of house and home. It's your right.",
            r: "You eat well. The village spits when you march out in spring.",
            fx: {health:4,honor:-6},
          },
        ],
      },
      {
        id: "wr_mud_march",
        cond: (p,C)=>C.soldier(p),
        setup: prep,
        title: "Mud",
        text: "Rain for nine days. The road is knee-deep mud, the carts sink to their axles, and your boots are rotting off your feet. The column makes six kilometers a day instead of twenty.",
        choices: [
          {
            t: "Put your shoulder to the wagons",
            r: "You push wagons until your back screams. The squad captain notices who works.",
            fx: {str:1,sta:.8,merit:3,health:-3},
          },
          {
            t: "Wrap your feet in greased rags and look after them",
            check: {s:"survival",s2:"int",d:35},
            win: {
              r: "Your feet stay whole while half the file's are raw and bleeding.",
              fx: {skill:{survival:2},health:2},
            },
            lose: {r:"The rags rot too. Your feet crack and bleed.",fx:{health:-8,wil:1}},
          },
          {
            t: "Sing to keep the file going",
            check: {s:"music",s2:"diplomacy",d:40},
            win: {
              r: "An old marching song, then a rude one. The file takes it up, and the kilometers go faster.",
              fx: {skill:{music:3},rel:{who:"comrade",op:4,all:!0},happy:3},
            },
            lose: {r:"Nobody joins in. You sing alone in the rain like a fool.",fx:{happy:-2}},
          },
        ],
      },
      {
        id: "wr_truce_pickets",
        cond: (p,C)=>camp(p),
        setup: prep,
        title: "Across the stream",
        text: 'Across the stream the {foe} pickets have fires too. At dusk one calls over in a thick accent: "Salt? Bread? We have wine!" It is the kind of truce that happens in every war, and that every officer hates.',
        choices: [
          {
            t: "Wade over and trade",
            check: {s:"diplomacy",s2:"ins",d:40},
            win: {
              r: "Wine for salt pork. For an hour you and a stranger in the wrong colors laugh about your officers.",
              fx: {happy:5,skill:{diplomacy:2}},
            },
            lose: {
              r: "An officer sees you wade back. Flogged for trading with the enemy.",
              fx: {health:-10,merit:-5,cause:"a flogging"},
            },
          },
          {
            t: "Shoot at the voice",
            r: "You loose at the voice. The fires across the stream go dark, and someone over there will remember.",
            fx: {merit:2,honor:-2},
          },
          {
            t: "Report it",
            r: "The captain thanks you and posts crossbowmen. The next night nobody calls over.",
            fx: {merit:3},
          },
          {
            t: "Listen to them sing",
            r: "You wrap yourself in your cloak and listen to them singing a song you almost know.",
            fx: {happy:1},
          },
        ],
      },
      {
        id: "wr_pay_day",
        cond: (p,C)=>C.soldier(p),
        setup: prep,
        title: "Pay day",
        text: "Pay day, for once on time: a quarter's coin in a leather bag. The camp turns into a fair. Dice, ale, sutlers, ribbon-sellers, and the priest rattling the poor box.",
        choices: [
          {
            t: "Drink it",
            r: "A glorious night. You remember perhaps a third of it.",
            fx: {coin:-6,happy:6,health:-2},
          },
          {
            t: "Send it home",
            r: "You send it home with a carter you half trust. Months later a letter says it arrived.",
            fx: {coin:-10,rel:{who:"mother",op:8},honor:2,happy:2},
          },
          {
            t: "Buy a good helmet off a dead knight's squire (25 suns)",
            req: p=>p.coin>=25,
            r: "A proper helm. One day it will save your life, and you will never know which day.",
            fx: {coin:-25,gear:{helm:"helm"}},
          },
          {
            t: "Save it",
            r: "Into your boot it goes. A soldier with savings is a soldier with a future.",
            fx: {happy:1},
          },
        ],
      },
      {
        id: "wr_orc_wave",
        cond: (p,C)=>C.soldier(p)&&C.race(p,"orc","halforc")&&mates(p),
        setup: prep,
        title: "The third wave",
        text: `The drums count the waves: two minutes in, thirty breaths out, two minutes in. You are gasping in the rest-line when {mate} says, "I can't go back in. My chest is bursting." A rider who leaves his wave loses his deed-name.`,
        choices: [
          {
            t: "Go in with {mhim}, shoulder to shoulder",
            check: {s:"sta",s2:"wil",d:50},
            win: {
              r: "You go in together and come out together. The drum-masters see it.",
              fx: {merit:5,them:{op:15},sta:.8},
            },
            lose: {
              r: "You go in. {mate} falls behind in the press.",
              fx: both({merit:3,wil:2},die1("fell behind in the third wave")),
            },
          },
          {
            t: "Take {mhis} place in the next wave",
            check: {s:"sta",s2:"str",d:55},
            win: {r:"Two waves back to back. Even the old warriors whistle.",fx:{merit:8,fame:2,sta:1,them:{op:12}}},
            lose: {
              r: "You go down in the second wave and are dragged out by the ankles.",
              fx: {health:-20,wil:2,cause:"wounds from the press"},
            },
          },
          {
            t: "Let {mhim} drop back",
            r: "{mate} drops back. The clan-mothers take {mhis} deed-name, and {mhe} never forgives you for watching.",
            fx: {them:{op:-10}},
          },
        ],
      },
      {
        id: "wr_ashmere_fingers",
        cond: (p,C)=>C.soldier(p)&&R(p)==="POL-05",
        setup: prep,
        title: "Two fingers",
        text: "The bowmen of Ashmere tell new men about the deserter caught on the road: they cut off his two drawing fingers and sent him home. He still comes to the butts every feast day, they say, and watches.",
        choices: [
          {
            t: "Practice at the butts until your fingers bleed",
            r: "Twelve aimed arrows in a minute at two hundred meters is the royal test. You get closer every week.",
            fx: {skill:{bow:5},str:.6},
          },
          {
            t: "Try for the King's Bowmen",
            check: {s:"bow",s2:"str",d:55},
            win: {
              r: "You draw the seventy-kilo stave ten times. Your name goes on the King's Bowmen list, at a sun and a half a day.",
              fx: {merit:10,coin:20,skill:{bow:3},fame:1},
            },
            lose: {r:"Your arm shakes on the eighth draw. Next year.",fx:{skill:{bow:2},wil:1}},
          },
          {
            t: "Ask an old bowman what he thinks of it",
            r: 'He holds up his own hand, every finger there. "Keep them," he says.',
            fx: {wil:1,int:.3},
          },
        ],
      },
      {
        id: "wr_hf_army_passes",
        cond: homeFront,
        setup: prepH,
        title: "An army on the road",
        text: "An army is coming down the {home} road: a column three kilometers long, dust, drums, carts and camp followers. By evening there are soldiers in every barn, and the hens are vanishing.",
        choices: [
          {
            t: "Hide your food and valuables in the woods",
            check: {s:"stealth",s2:"int",d:40},
            win: {
              r: "You bury the grain sacks and the good pot under the woodpile. They find nothing worth taking.",
              fx: {skill:{stealth:2},happy:2},
            },
            lose: {
              r: "They find the hiding place in an hour, take everything, and laugh about it.",
              fx: {coinPct:-.3,happy:-6,wil:1},
            },
          },
          {
            t: "Sell them bread and ale at war prices",
            check: {s:"trade",s2:"diplomacy",d:40},
            win: {
              r: "Soldiers pay anything for fresh bread. You clear 30 suns in two days.",
              fx: {coin:30,skill:{trade:3}},
            },
            lose: {r:"They eat and drink and leave without paying. A file-leader shrugs.",fx:{coin:-8,happy:-4}},
          },
          {
            t: "Complain to the officers about the thieving",
            check: {s:"diplomacy",s2:"wil",d:50},
            win: {
              r: "A soldier who robs a farmer on the march is tried by his own captain. This captain hangs one in the square. After that, nobody steals.",
              fx: {fame:1,honor:2},
            },
            lose: {r:"The captain hears you out and does nothing at all.",fx:{happy:-3}},
          },
        ],
      },
      {
        id: "wr_hf_requisition",
        cond: homeFront,
        setup: prepH,
        title: "Requisition",
        text: 'A clerk with the {mr} seal and ten spearmen at his back reads out the requisition: every household in {home} gives a third of its grain to the army. He pays in tally sticks the crown "will honor after the war".',
        choices: [
          {
            t: "Hand it over",
            r: "You hand it over and keep the tally stick. It might be worth something one day.",
            fx: {coinPct:-.15,wil:.5,favor:2},
          },
          {
            t: "Hide half before they count",
            check: {s:"stealth",s2:"int",d:45},
            win: {
              r: "Half your grain sleeps at the bottom of the old well. Your household eats this winter.",
              fx: {happy:3},
            },
            lose: {
              r: "A neighbor tells the clerk. They take it all, and a fine on top.",
              fx: {coinPct:-.3,happy:-6,wil:1},
            },
          },
          {
            t: "Bribe the clerk (10 suns)",
            req: p=>p.coin>=10,
            check: {s:"intrigue",s2:"diplomacy",d:40},
            win: {r:"Ten suns, and the clerk counts your sacks very badly.",fx:{coin:-10}},
            lose: {r:"He takes your coin and your grain both.",fx:{coin:-10,coinPct:-.15}},
          },
        ],
      },
      {
        id: "wr_hf_horses",
        cond: homeFront,
        setup: prepH,
        title: "The horse-buyers",
        text: "The army's horse-buyers are taking every animal that can pull: plough horses, mules, the old mare. The price is set by them, and it is low.",
        choices: [
          {
            t: "Sell at their price",
            r: "Twenty suns for a beast worth sixty. Better than having it taken.",
            fx: {coin:20,happy:-3},
          },
          {
            t: "Lame it with a stone in the hoof the night before",
            check: {s:"husbandry",s2:"int",d:45},
            win: {
              r: "The buyer sees a limp and passes by. You take the stone out the next morning.",
              fx: {skill:{husbandry:2},happy:2},
            },
            lose: {r:"The buyer finds the stone and takes the horse for nothing.",fx:{happy:-6,honor:-2}},
          },
          {
            t: "Hide the horse in the forest",
            check: {s:"stealth",s2:"survival",d:50},
            win: {r:"Three days in a forest clearing, and then the buyers are gone.",fx:{happy:3}},
            lose: {r:"Deserters find your horse in the forest before the army does.",fx:{happy:-5,wil:.5}},
          },
        ],
      },
      {
        id: "wr_hf_refugees",
        cond: homeFront,
        setup: prepH,
        title: "Refugees",
        text: "Refugees from the burned country stream through {home}: carts piled with bedding, old women walking, children without shoes. A family asks to sleep in your shed.",
        choices: [
          {
            t: "Take them in",
            r: "They stay a month. The father mends your roof, and the grandmother tells stories you will remember all your life.",
            fx: {honor:5,piety:3,happy:3,coin:-5},
          },
          {
            t: "Give them bread and send them on",
            r: "A loaf, and directions to the next town.",
            fx: {coin:-1,piety:1},
          },
          {
            t: "Hire them for bread and a roof",
            r: "They work hard for their bread. You try not to think too much about whether it is fair.",
            fx: {coin:10,honor:-1},
          },
          {
            t: "Bar the door",
            r: "You bar the door. In the morning they are gone, and so is your woodpile.",
            fx: {happy:-2},
          },
        ],
      },
      {
        id: "wr_hf_levy",
        cond: (p,C)=>homeFront(p,C)&&C.hasKids(p)&&C.age(p)>=34,
        setup: (p,ctx)=>{prepH(p,ctx);const kids=(p.children||[]).map(A.P).filter(k=>k&&k.alive&&A.isAdult(k));ctx.kid=kids.length?A.pick(kids).given:"your eldest"},
        title: "The levy list",
        text: "The levy: one fighter from so many hearths, and the reeve has written {kid}'s name on the list. The column leaves for the war in three days.",
        choices: [
          {
            t: "Pay for a substitute (60 suns)",
            req: p=>p.coin>=60,
            r: "A landless man will go for sixty suns. {kid} stays home. Someone else's child goes.",
            fx: {coin:-60,happy:3},
          },
          {
            t: "Bribe the reeve to change the list",
            check: {s:"intrigue",s2:"diplomacy",d:45},
            win: {r:"Fifteen suns, and the reeve finds a mistake in his list.",fx:{coin:-15,happy:3,honor:-2}},
            lose: {r:"The reeve takes your money and keeps the name.",fx:{coin:-15,happy:-6,wil:1}},
          },
          {
            t: "Let {kid} go with your blessing",
            r: "You give {kid} your old knife and a sack of bread. You watch the road for a long time after the dust settles.",
            fx: {wil:1.5,happy:-6,honor:3},
          },
          {
            t: "Go in {kid}'s place",
            req: p=>A.age(p)<55&&!p.flags.unfree,
            r: "You tell the reeve to take you instead.",
            fx: p=>{const r=A.enlist(p,!1);return r&&r.ok?"":r&&r.msg||""},
          },
        ],
      },
      {
        id: "wr_hf_burned",
        cond: homeFront,
        setup: prepH,
        title: "Burned fields",
        text: ()=>`Raiders came in the night. Your ${A.pick(["fields are black stubble and smoke","barley is ash","orchard is charred stumps"])}, and the ${A.pick(["barn","byre","granary"])} is a ring of embers.`,
        choices: [
          {
            t: "Rebuild, beam by beam",
            r: "It takes the year. Your hands blister and your back aches, and by winter there is a roof again.",
            fx: {coinPct:-.25,str:.6,wil:2},
          },
          {
            t: "Go to the lord for relief",
            check: {s:"diplomacy",s2:"wil",d:45},
            win: {r:"The lord remits a year's rent and sends seed.",fx:{coin:15,happy:3}},
            lose: {r:"The lord has a hundred burned tenants. He has nothing for you.",fx:{happy:-4,wil:1}},
          },
          {
            t: "Ride after the raiders with the village men",
            r: "You follow the tracks with a borrowed spear and a dozen angry neighbors.",
            fx: {
              duel: {
                tier: 2,
                title: "a raider",
                troop: "LC",
                opts: {kind:"duel",place:"the burned fields",title:"After the raiders"},
              },
            },
          },
        ],
      },
      {
        id: "wr_hf_raiders",
        cond: homeFront,
        setup: prepH,
        title: "Smoke on the hill",
        text: "Smoke on the hill: raiders, {foe} outriders or just bandits using the war for cover. They will be in {home} by noon.",
        choices: [
          {
            t: "Gather the neighbors behind the churchyard wall",
            check: {s:"command",s2:"ins",d:50},
            win: {
              r: "Twenty farmers with pitchforks behind a wall. The raiders take one look and ride on.",
              fx: {fame:3,skill:{command:3},honor:3},
            },
            lose: {
              r: "They come over the wall. You fight and live. Others do not.",
              fx: {health:-15,wil:2,wound:"deep_cut",cause:"a raider's blade"},
            },
          },
          {
            t: "Flee to the woods with what you can carry",
            r: "You lie in the bracken and listen to them loot your house.",
            fx: {coinPct:-.3,wil:1},
          },
          {
            t: "Fight them at your own door",
            r: "You bar the door, then think better of it and step outside with an axe.",
            fx: {
              duel: {tier:2,title:"a raider",opts:{kind:"duel",place:"your own doorstep",title:"At your own door"}},
            },
          },
          {
            t: "Offer them food to pass by",
            check: {s:"diplomacy",s2:"wil",d:45},
            win: {r:"They take the food and spare the houses.",fx:{coin:-5,honor:1}},
            lose: {r:"They take the food, and then everything else.",fx:{coinPct:-.4,happy:-5}},
          },
        ],
      },
      {
        id: "wr_hf_prices",
        cond: homeFront,
        setup: prepH,
        title: "War prices",
        text: ()=>`War prices: bread has doubled, salt has tripled, and iron cannot be had at any price. ${A.pick(["The baker has a guard at his door.","Women queue at the mill before dawn.","Men fight over a cartload of turnips in the market."])}`,
        choices: [
          {
            t: "Tighten belts",
            r: "Thinner soup, smaller loaves. You get through it.",
            fx: {health:-4,wil:1,happy:-2},
          },
          {
            t: "Buy salt early and sell it dear",
            req: p=>p.coin>=20,
            check: {s:"trade",s2:"int",d:45},
            win: {
              r: "You sell at triple what you paid. Some call you clever. Some call you worse.",
              fx: {coin:40,honor:-3,skill:{trade:3}},
            },
            lose: {r:"Prices fall the week after you buy. You eat your mistake.",fx:{coin:-20}},
          },
          {
            t: "Share what you have with the neighbors",
            r: "Your table is thin, but it is never empty, and neither are theirs.",
            fx: {coin:-8,honor:4,happy:2,piety:2},
          },
        ],
      },
      {
        id: "wr_hf_deserter",
        cond: homeFront,
        setup: (p,ctx)=>{prepH(p,ctx),ctx.des=nm(p)},
        title: "A deserter in the barn",
        text: `You find a young man in your barn: thin, filthy, in the torn coat of the {mr} army. "Please. I'm {des}. I couldn't go back. They hang deserters." Hiding a deserter is a crime too.`,
        choices: [
          {
            t: "Hide and feed him",
            check: {s:"stealth",s2:"intrigue",d:45},
            win: {
              r: "He stays a week, then slips away one night. Years later a stranger leaves a sack of flour at your door.",
              fx: {honor:3,piety:2,coin:-3},
            },
            lose: {
              r: "A patrol finds him in the hay. They hang him at the crossroads and fine you heavily.",
              fx: {coin:-30,happy:-8,wil:1.5},
            },
          },
          {
            t: "Turn him in for the bounty",
            r: "Five suns. They hang him at the crossroads. You walk the long way round after that.",
            fx: {coin:5,honor:-6,happy:-4},
          },
          {
            t: "Give him bread and send him on",
            r: "He takes the bread and goes. You never learn what became of him.",
            fx: {coin:-1,honor:1},
          },
          {
            t: "Run him off your land",
            r: "He is desperate, and he has a knife.",
            fx: {
              duel: {
                tier: 1,
                title: "a desperate deserter",
                opts: {kind:"brawl",lethal:!1,toYield:!0,place:"your barn",title:"In the barn"},
              },
            },
          },
        ],
      },
      {
        id: "wr_hf_spy",
        cond: homeFront,
        setup: (p,ctx)=>{prepH(p,ctx),ctx.spy=nm(p)},
        title: "The peddler",
        text: "A peddler named {spy} has been in {home} a week. He sells little, asks a lot about the bridge and the garrison, and writes things down at night. Nobody else seems to notice.",
        choices: [
          {
            t: "Report him to the garrison",
            check: {s:"ins",s2:"int",d:45},
            win: {
              r: "They search his pack and find drawings of the bridge. Twenty suns and the thanks of the crown.",
              fx: {coin:20,favor:5,fame:2},
            },
            lose: {r:"They find only needles and ribbons. He looks at you very hard as he leaves.",fx:{happy:-2}},
          },
          {
            t: "Follow him at night",
            check: {s:"stealth",s2:"ins",d:50},
            win: {
              r: "You watch him meet a rider in the woods. Your report sends cavalry after both.",
              fx: {skill:{stealth:3},favor:6,fame:2,coin:15},
            },
            lose: {
              r: "He catches you following. A knife comes out.",
              fx: {
                duel: {
                  tier: 2,
                  title: "the spy",
                  opts: {kind:"duel",place:"the woods at night",light:"night",title:"A knife in the woods"},
                },
              },
            },
          },
          {
            t: "Sell him what you know",
            r: "He pays fifteen suns for what you know about the bridge. You tell yourself it was nothing important.",
            fx: {coin:15,honor:-10,flag:"wr_traitor"},
          },
          {t:"Mind your own business",r:"Two weeks later, the bridge burns.",fx:{}},
        ],
      },
      {
        id: "wr_hf_billeted",
        cond: homeFront,
        setup: prepH,
        title: "Soldiers at your hearth",
        text: "Two soldiers of the {mr} army are billeted on your household for the winter. They eat for four, drink for six, and the loud one has started helping himself to whatever he likes.",
        choices: [
          {
            t: "Make the best of it",
            r: "The quiet one turns out to be a decent sort. He mends your roof before they march.",
            fx: {coin:-10,happy:-1},
          },
          {
            t: "Complain to their sergeant",
            check: {s:"diplomacy",s2:"wil",d:45},
            win: {r:"The sergeant moves the loud one to the next village.",fx:{happy:3}},
            lose: {r:"The sergeant laughs. Things get worse.",fx:{coin:-10,happy:-5}},
          },
          {
            t: "Throw the loud one out",
            r: "You take him by the collar.",
            fx: {
              duel: {
                tier: 2,
                title: "a billeted soldier",
                troop: "SP",
                opts: {kind:"brawl",lethal:!1,toYield:!0,place:"your own kitchen",title:"Out of my house"},
              },
            },
          },
        ],
      },
      {
        id: "wr_hf_fallen",
        cond: homeFront,
        setup: (p,ctx)=>{prepH(p,ctx),ctx.nf=A.ri(3,14)},
        title: "The list of the fallen",
        text: "A rider brings the list of the fallen. It is read out at the market cross: {nf} names from {home}. {npcw} screams at the third name.",
        choices: [
          {
            t: "Help the families",
            r: "You dig a widow's garden and carry water for an old man whose only son is gone. It does not fix anything. It helps.",
            fx: {honor:3,piety:2,wil:.5,coin:-3},
          },
          {t:"Go to the temple and pray for them",r:"You light a candle for every name.",fx:{piety:4,wil:.5}},
          {
            t: "Curse the war and the crown, out loud",
            r: "You say it in the alehouse. Half the room agrees. Somebody writes your name down.",
            fx: {happy:1,favor:-4},
          },
        ],
      },
      {
        id: "wr_hf_press",
        cond: (p,C)=>homeFront(p,C)&&A.age(p)<45&&!p.flags.unfree,
        setup: prepH,
        title: "The recruiting party",
        text: "A recruiting party is sweeping {home}. The crown wants fighters, and it is not asking politely. A sergeant with a list stops at your door.",
        choices: [
          {
            t: "Join willingly and take the bounty",
            r: "The bounty is five suns and a cup of bad wine.",
            fx: p=>{const r=A.enlist(p,!1);return r&&r.ok?(p.coin+=5,""):r&&r.msg||""},
          },
          {
            t: "Hide in the loft",
            check: {s:"stealth",s2:"spd",d:45},
            win: {r:"They search the house and miss you by an arm's length.",fx:{happy:2}},
            lose: {
              r: "They drag you down by the ankle.",
              fx: p=>{const r=A.enlist(p,!1);return r&&r.ok?"You are a soldier now, like it or not.":r&&r.msg||""},
            },
          },
          {
            t: 'Show them your "exemption" (20 suns)',
            req: p=>p.coin>=20,
            r: "Twenty suns buys a very convincing exemption.",
            fx: {coin:-20},
          },
        ],
      },
      {
        id: "wr_hf_profiteer",
        cond: (p,C)=>homeFront(p,C)&&(C.job(p,"merchant")||p.coin>=100),
        setup: prepH,
        title: "The quartermaster's order",
        text: "A quartermaster of the {mr} army wants a hundred barrels of salt pork by the new moon, and pays in silver. The only pork to be had quickly is old and going green.",
        choices: [
          {
            t: "Sell him the bad pork",
            check: {s:"trade",s2:"intrigue",d:45},
            win: {r:"You sell it at triple the price. Somewhere a company eats green meat.",fx:{coin:120,honor:-8}},
            lose: {
              r: "The quartermaster sniffs a barrel and has you arrested for cheating the crown.",
              fx: {coin:-40,punish:"theft"},
            },
          },
          {
            t: "Find good pork and sell it honestly",
            check: {s:"trade",s2:"diplomacy",d:50},
            win: {
              r: "Honest meat at a fair war price. The army asks for you by name next time.",
              fx: {coin:60,fame:1,favor:2},
            },
            lose: {r:"You find too little, too late. The contract goes to someone else.",fx:{coin:-5}},
          },
          {t:"Stay out of it",r:"War money has a smell. You leave it alone.",fx:{}},
        ],
      },
      {
        id: "wr_fence",
        cond: crook,
        setup: (p,ctx)=>{prepH(p,ctx),ctx.uncle=nm(p),ctx.loot=A.pick(["a silver cup with a lord's mark","a bolt of dyed wool off a cart","a merchant's seal ring","a reliquary of a doubtful saint"])},
        title: "The uncle",
        text: `You have {loot} and you need it gone. {uncle}, a second-hand clothier who buys anything and asks nothing, turns it over in his hands. "A quarter of its worth. It's marked." On the docks they call a fence an "uncle". He is a good one.`,
        choices: [
          {t:"Take his price",r:"Twelve suns for a thing worth fifty. That is the trade.",fx:{coin:12}},
          {
            t: "Haggle hard",
            check: {s:"trade",s2:"diplomacy",d:50},
            win: {r:"You get a third instead of a quarter. He respects you for it.",fx:{coin:18,skill:{trade:2}}},
            lose: {r:"He shrugs and offers less. You take it.",fx:{coin:8}},
          },
          {
            t: "Break off the marks and sell it yourself",
            check: {s:"craft",s2:"int",d:45},
            win: {r:"Without the marks it fetches 25 suns at an honest-looking stall.",fx:{coin:25,skill:{craft:2}}},
            lose: {r:"You botch it, and someone at the stall knows the piece.",fx:{punish:"theft"}},
          },
        ],
      },
      {
        id: "wr_gang_boss",
        cond: (p,C)=>civ(p,C)&&C.town(p)&&!C.flag(p,"wr_gang")&&(C.poor(p)||crook(p,C)),
        setup: prepH,
        title: "An offer of work",
        text: '{boss}, who runs {gang} in the market quarter, buys you a cup of wine. "I need someone with an honest face to carry messages. A sun a day, no questions. Most of the time."',
        choices: [
          {
            t: "Take the work",
            r: "Messages, then packages, then things you do not ask about. You are one of {gang} now.",
            fx: {coin:15,flag:"wr_gang",skill:{intrigue:3}},
          },
          {t:"Refuse politely",r:`He smiles. "The offer stands. Until it doesn't."`,fx:{}},
          {
            t: "Tell the watch-captain",
            check: {s:"intrigue",s2:"wil",d:50},
            win: {r:"The watch raids {gang}'s warehouse. {boss} never learns who talked.",fx:{coin:10,honor:3}},
            lose: {
              r: `The watch-captain is a "wet" one: he takes {boss}'s money. Two nights later you are beaten in an alley.`,
              fx: {health:-15,wound:"broken_nose",wil:1,cause:"a beating"},
            },
          },
        ],
      },
      {
        id: "wr_protection",
        cond: (p,C)=>civ(p,C)&&C.town(p)&&!!p.job&&["smith","weaver","brewer","merchant","carpenter","bowyer","healer","mason","scribe"].includes(p.job.c),
        setup: prepH,
        title: "Protection",
        text: `Two men from {gang} lounge in your doorway, picking their teeth. "Nice shop. Shame if it caught fire. Two suns a week, and it won't."`,
        choices: [
          {
            t: "Pay",
            r: "You pay, every week. It is a tax like any other, only more honest about what it is.",
            fx: {coin:-25,happy:-3},
          },
          {
            t: "Throw them out",
            r: "You reach for the cudgel under the counter.",
            fx: {
              duel: {
                tier: 2,
                title: "a gang bruiser",
                opts: {kind:"brawl",lethal:!1,toYield:!0,place:"your shop",title:"Protection money"},
              },
            },
          },
          {
            t: "Organize the other shopkeepers",
            check: {s:"command",s2:"diplomacy",d:55},
            win: {
              r: "Twelve shopkeepers with cudgels, and a hue and cry every neighbor must answer. {gang} decides your street is not worth it.",
              fx: {fame:2,skill:{command:3},honor:3},
            },
            lose: {r:"The others are too scared. Your shutters burn one night.",fx:{coinPct:-.2,happy:-6,wil:1.5}},
          },
        ],
      },
      {
        id: "wr_heist",
        cond: crook,
        setup: (p,ctx)=>{prepH(p,ctx),ctx.target=A.pick(["the toll-house strongbox","a wool merchant's counting room","the abbot's summer plate","a moneychanger's back room"])},
        title: "The job",
        text: '{boss} lays it out on a tavern table with crumbs for walls: {target}, a night with no moon, four of you, one window, one dog. "Your share is a hundred suns. In?"',
        choices: [
          {
            t: "In. You take the window.",
            check: {s:"stealth",s2:"spd",d:55},
            win: {
              r: "In and out, the dog asleep, the window shut behind you. A hundred suns, and a name in the right taverns.",
              fx: {coin:100,fame:1,skill:{stealth:4},flag:"wr_gang"},
            },
            lose: {
              r: "The dog wakes. The hue and cry goes up, and every neighbor turns out.",
              fx: {punish:"theft",health:-8,cause:"a beating"},
            },
          },
          {
            t: "In, but you plan it",
            check: {s:"intrigue",s2:"int",d:50},
            win: {
              r: "You change the night, the window and the dog. It goes like a song, and you take a planner's share.",
              fx: {coin:130,skill:{intrigue:4},flag:"wr_gang"},
            },
            lose: {
              r: "Your plan is good. Your crew is not. Two are caught, and they talk.",
              fx: {coin:30,punish:"theft"},
            },
          },
          {
            t: "Sell the plan to the target",
            check: {s:"diplomacy",s2:"intrigue",d:45},
            win: {
              r: "The owner pays forty suns for a warning. {boss} never finds out.",
              fx: {coin:40,flag:"wr_boss_enemy"},
            },
            lose: {
              r: "{boss} finds out. You leave town that week with a split lip.",
              fx: {coin:10,health:-10,flag:"wr_boss_enemy",cause:"a beating"},
            },
          },
          {t:"Out",r:"{boss} shrugs. The next week two of the crew hang. You sleep badly anyway.",fx:{}},
        ],
      },
      {
        id: "wr_betrayal",
        cond: (p,C)=>civ(p,C)&&C.flag(p,"wr_gang"),
        setup: (p,ctx)=>{prepH(p,ctx),ctx.partner=nm(p)},
        title: "A lamp in the dark",
        text: "{partner}, whom you trusted with your share and your neck, has been seen drinking with the watch-captain. The next job is tomorrow night.",
        choices: [
          {
            t: "Call it off and lie low",
            r: "You stay home. The next night the watch raids an empty warehouse, and {partner} is gone from the city by morning.",
            fx: {wil:1,int:.4},
          },
          {
            t: "Feed {partner} a false plan",
            check: {s:"intrigue",s2:"int",d:55},
            win: {
              r: "The watch raids the wrong street. {partner} takes the blame from both sides and is never seen again.",
              fx: {skill:{intrigue:4},fame:1},
            },
            lose: {r:"{partner} sees through it. The watch comes to the right street after all.",fx:{punish:"theft"}},
          },
          {
            t: "Confront {partner}",
            r: "You find {partner} in a back alley. A knife comes out before a word does.",
            fx: {
              duel: {
                tier: 2,
                title: "a turncoat partner",
                opts: {kind:"duel",place:"a back alley",light:"night",title:"The turncoat"},
              },
            },
          },
          {
            t: "Go through with the job",
            check: {s:"stealth",s2:"ins",d:60},
            win: {r:"It works. Maybe {partner} was only drinking.",fx:{coin:60}},
            lose: {r:"It was a trap.",fx:{punish:"theft",unflag:"wr_gang"}},
          },
        ],
      },
      {
        id: "wr_rival_gang",
        cond: (p,C)=>crook(p,C)&&C.town(p),
        setup: prepH,
        title: "Rivals",
        text: "{gang2} have moved onto your streets: their cutpurses in your market, their uncle buying your goods. Last night they knifed a boy who ran messages for your crew.",
        choices: [
          {
            t: "Hit them back at their tavern",
            r: "You walk into their tavern with three friends and a grudge.",
            fx: {
              duel: {
                tier: 3,
                title: "a rival gang bruiser",
                opts: {kind:"brawl",lethal:!1,toYield:!0,place:"a dockside tavern",title:"Tavern war"},
              },
            },
          },
          {
            t: "Tip off the watch about their warehouse",
            check: {s:"intrigue",s2:"int",d:45},
            win: {
              r: "The watch hangs two of theirs. Your streets are your own again.",
              fx: {skill:{intrigue:3},coin:10},
            },
            lose: {
              r: "They learn who talked. Your own crew is not grateful either.",
              fx: {health:-10,happy:-4,cause:"a beating"},
            },
          },
          {
            t: "Make peace and split the market",
            check: {s:"diplomacy",s2:"wil",d:50},
            win: {
              r: "A handshake over a cup on neutral ground. Half the market each, and no more boys knifed.",
              fx: {skill:{diplomacy:3},coin:5},
            },
            lose: {r:"They take your offer as weakness.",fx:{coin:-15,happy:-4}},
          },
          {
            t: "Get out of the life",
            r: "You stop. Some things are not worth a knife in the dark.",
            fx: {unflag:"wr_gang",honor:2},
          },
        ],
      },
      {
        id: "wr_informer",
        cond: crook,
        setup: (p,ctx)=>{prepH(p,ctx),ctx.lamp=nm(p)},
        title: "The lamp",
        text: 'Three jobs in a row have gone wrong. The watch was waiting every time. Somebody in the crew is a "lamp", an informer, and you are fairly sure it is {lamp}, who always has new boots.',
        choices: [
          {
            t: "Watch {lamp} until you are sure",
            check: {s:"ins",s2:"intrigue",d:50},
            win: {
              r: "You follow {lamp} to the watch-captain's back door. Now you know, and knowing is worth something.",
              fx: {skill:{intrigue:3},coin:10},
            },
            lose: {r:"You watch the wrong person for a month. The next job goes wrong too.",fx:{punish:"theft"}},
          },
          {
            t: "Accuse {lamp} before the crew",
            check: {s:"diplomacy",s2:"ins",d:50},
            win: {r:"The crew believes you. {lamp} leaves the city that night with a cut face.",fx:{fame:1}},
            lose: {r:"The crew believes {lamp}. Now they are watching you.",fx:{happy:-5,health:-6,cause:"a beating"}},
          },
          {
            t: "Become a lamp yourself and sell the crew first",
            r: "The watch-captain pays twenty suns and forgets your face. The crew hangs.",
            fx: {coin:20,honor:-10,unflag:"wr_gang",flag:"wr_informer"},
          },
          {
            t: "Quit the crew",
            r: "You walk away. Two weeks later they are all in the ledger.",
            fx: {unflag:"wr_gang"},
          },
        ],
      },
      {
        id: "wr_corrupt_reeve",
        cond: (p,C)=>civ(p,C)&&(crook(p,C)||C.poor(p)),
        setup: (p,ctx)=>{prepH(p,ctx),ctx.reeve=nm(p)},
        title: "The reeve needs a name",
        text: p=>`The lord's mill was robbed, and Reeve {reeve} needs a name for the court. He has picked yours, unless you find five suns. ${law(p)==="north"?"Here a man clears himself with twelve oath-helpers who swear on the iron ring.":law(p)==="sun"?"Here the court hears witnesses at noon, when lying is a sin, and two witnesses outweigh one.":"Here the court hears whoever the lord believes."}`,
        choices: [
          {
            t: "Pay him (5 suns)",
            req: p=>p.coin>=5,
            r: "Five suns. The reeve finds another name. You wonder whose.",
            fx: {coin:-5,honor:-1},
          },
          {
            t: "Find neighbors to swear for you",
            check: {s:"diplomacy",s2:"wil",d:50},
            win: {
              r: "Your neighbors stand with you. The court clears you, and the reeve looks a fool.",
              fx: {honor:4,fame:1},
            },
            lose: {
              r: "Not enough of them will swear. If your neighbors will not stand for you, the court says, they have judged you already.",
              fx: {punish:"theft"},
            },
          },
          {
            t: "Go over his head to the lord",
            check: {s:"diplomacy",s2:"intrigue",d:55},
            win: {
              r: "The lord has suspected his reeve for years. The reeve is dismissed; you are thanked.",
              fx: {favor:2,fame:1,honor:3},
            },
            lose: {
              r: "The lord trusts his reeve. You are flogged for slander.",
              fx: {health:-12,wil:1,cause:"a flogging"},
            },
          },
        ],
      },
      {
        id: "wr_gallows_crowd",
        cond: (p,C)=>civ(p,C)&&C.town(p),
        setup: prepH,
        title: "The tall widow",
        text: ()=>`A hanging in the market square. The whole town is out: pie-sellers, priests, children on their fathers' shoulders. The one on the cart is ${A.pick(["a horse thief","a coin-clipper","a highway robber","a deserter"])}. On the docks they call the gallows "the tall widow".`,
        choices: [
          {
            t: "Work the crowd while every eye is on the rope",
            check: {s:"stealth",s2:"spd",d:45},
            win: {r:"Three fat purses while the crowd gasps.",fx:{coin:18,skill:{stealth:3}}},
            lose: {r:'A hand closes on your wrist. "Thief!" Under the gallows, of all places.',fx:{punish:"theft"}},
          },
          {
            t: "Watch, and pray for the condemned",
            r: p=>`You pray to ${A.godWord(p)||"the gods"} for a stranger. The cart moves. The crowd goes very quiet, then very loud.`,
            fx: {piety:2,wil:.5},
          },
          {
            t: "Toss the condemned a cup of wine",
            check: {s:"spd",s2:"diplomacy",d:35},
            win: {
              r: "The condemned catches it and drinks to the crowd. They cheer like it is a feast day.",
              fx: {fame:1,happy:2},
            },
            lose: {r:"A guard knocks it away and cuffs you.",fx:{health:-3}},
          },
          {t:"Go home",r:"You do not need to see this. You go home.",fx:{}},
        ],
      },
      {
        id: "wr_outlaw_hunted",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"outlaw"),
        setup: prepH,
        title: "Hunted",
        text: "You are outside the law: anyone may rob or kill you, and nobody may shelter you. Two men with a crossbow and a dog have been on your trail for three days. There is a price on your head.",
        choices: [
          {
            t: "Turn and ambush them",
            r: "You double back and wait on the trail above them.",
            fx: {
              duel: {
                tier: 3,
                title: "a bounty hunter",
                troop: "XB",
                opts: {kind:"duel",place:"a forest track",title:"The hunters"},
              },
            },
          },
          {
            t: "Lose them in the river",
            check: {s:"survival",s2:"stealth",d:50},
            win: {
              r: "You wade the river for an hour. The dog loses the scent.",
              fx: {skill:{survival:3,stealth:2},wil:1},
            },
            lose: {
              r: "The dog finds you. A bolt takes you in the leg before you break away.",
              fx: {wound:"arrow_wound",health:-15,wil:1.5,cause:"a crossbow bolt"},
            },
          },
          {
            t: "Buy them off (30 suns)",
            req: p=>p.coin>=30,
            r: "Thirty suns is more than your head is worth to them. They turn back.",
            fx: {coin:-30},
          },
        ],
      },
      {
        id: "wr_outlaw_marches",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"outlaw"),
        once: !0,
        setup: prepH,
        title: "The Free Marches",
        text: "The Free Marches are a long walk away. Nobody there asks where you came from or what you did. It is where outlaws go when they have run out of everywhere else. Most outlaws die within a few years; the ones who live mostly live there.",
        choices: [
          {
            t: "Go to the Marches and start again",
            r: "You walk out of the realm and into a country without lords. A new name, a new start.",
            fx: p=>(delete p.flags.outlaw,p.flags.wr_marches=A.S.year,A.exile(p),A.willGrow(p,2,"outlaw"),""),
          },
          {
            t: "Stay and live in the woods",
            r: "You stay near home, in the woods, on the edge of everything.",
            fx: {skill:{survival:4},wil:1,happy:-3},
          },
          {
            t: "Take the recruiting sergeant's coin",
            req: p=>!p.flags.unfree,
            r: "The recruiting sergeant looks at your face and decides not to recognize it.",
            fx: p=>{const r=A.enlist(p,!1);return r&&r.ok?(delete p.flags.outlaw,"A soldier's oath washes off an outlaw's name. Mostly."):r&&r.msg||""},
          },
        ],
      },
      {
        id: "wr_outlaw_shelter",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"outlaw"),
        setup: (p,ctx)=>{prepH(p,ctx),ctx.farmer=nm(p,"F")},
        title: "A light in the window",
        text: "Rain, hunger and a farmhouse with a light in the window. Sheltering an outlaw is a crime. {farmer} opens the door a crack and looks at you for a long time.",
        choices: [
          {
            t: "Beg for one night by the fire",
            check: {s:"diplomacy",s2:"wil",d:45},
            win: {
              r: "{farmer} lets you in, feeds you and asks nothing. You leave before dawn with bread in your pocket.",
              fx: {health:6,happy:4},
            },
            lose: {
              r: "The door shuts. You hear the bar drop, and then a boy running for the reeve.",
              fx: {health:-5,wil:1},
            },
          },
          {
            t: "Force your way in",
            r: "You take bread and a dry cloak at knifepoint. They will tell everyone. You are what they say you are now.",
            fx: {health:6,honor:-8},
          },
          {
            t: "Sleep in the ditch",
            r: "You sleep in a ditch under your cloak. Outlaws who live, live like this.",
            fx: {health:-6,wil:1.5},
          },
        ],
      },
      {
        id: "wr_sanctuary",
        cond: (p,C)=>civ(p,C)&&(C.flag(p,"outlaw")||C.job(p,"thief")||C.flag(p,"wr_gang"))&&A.lawOf(p.realm)==="sun",
        setup: prepH,
        title: "The bell-rope",
        text: "The hue and cry is at your heels: a dozen men with staves and a reeve. Ahead stands a temple of the Returning Sun, its door open. Grip the bell-rope at the altar and you may claim forty days of sanctuary, to confess, to pay, or to leave the realm by the nearest road carrying a white wand.",
        choices: [
          {
            t: "Run for the bell-rope",
            check: {s:"spd",s2:"sta",d:45},
            win: {
              r: "Your hand closes on the rope and the bell booms. The men stop at the door, cursing. Forty days later you walk out of the realm with a white wand, and nobody lays a finger on you.",
              fx: p=>(delete p.flags.outlaw,delete p.flags.wr_gang,p.piety=A.clamp(p.piety+4,0,100),A.willGrow(p,1,"sanctuary"),A.exile(p),""),
            },
            lose: {r:"They catch you on the temple steps, three strides short.",fx:{punish:"theft"}},
          },
          {
            t: "Turn and fight",
            r: "You turn at the temple steps with your back to the door.",
            fx: {
              duel: {
                tier: 2,
                title: "the reeve's man",
                opts: {kind:"brawl",lethal:!1,toYield:!0,place:"the temple steps",title:"On the temple steps"},
              },
            },
          },
          {t:"Give yourself up",r:"You stop running and hold out your hands.",fx:{punish:"theft",wil:.5}},
        ],
      },
      {
        id: "wr_law_fire",
        cond: (p,C)=>C.adult(p)&&A.lawOf(p.realm)==="orc"&&(C.flag(p,"outlaw")||C.job(p,"thief")||C.flag(p,"wr_gang")||C.poor(p)),
        setup: prepH,
        title: "The Law of the Fire",
        text: "You are hungry and hunted, and the only fire for a day's ride belongs to a clan of the {mr}. Under the Law of the Fire, a guest may not be harmed or given up, and an orc who refuses a guest food becomes clanless.",
        choices: [
          {
            t: "Walk into the firelight and ask to be a guest",
            r: "The clan-mother hands you a bowl of mare's milk without a word. When your hunters ride up, she sends them away.",
            fx: {health:5,happy:4,wil:1},
          },
          {
            t: "Steal a horse from their herd and ride",
            check: {s:"riding",s2:"stealth",d:55},
            win: {
              r: "You ride off on a good horse. Horse theft here is half a sport; they will settle it in horses later, if they find you.",
              fx: {skill:{riding:3},coin:20},
            },
            lose: {
              r: "The herd boys catch you. Horse theft is settled in horses, and you have none.",
              fx: {punish:"theft"},
            },
          },
          {t:"Keep running",r:"You go round the fire in the dark and keep moving.",fx:{health:-6,wil:1}},
        ],
      },
      {
        id: "wr_water_law",
        cond: (p,C)=>C.adult(p)&&(C.realm(p,"POL-19")||C.terr(p,"desert")&&A.lawOf(p.realm)==="well"),
        setup: prepH,
        title: "Water",
        text: "A rider comes out of the dunes, half dead of thirst. You know his face: a man of a clan in blood feud with your kin. If you give him water, the law of the Sand Clans puts him under your protection, even from your own brothers.",
        choices: [
          {
            t: "Give him water",
            r: "He drinks. Now he is your guest, and your brothers must swallow it.",
            fx: {honor:6,piety:3},
          },
          {
            t: "Give him water, then name a price",
            check: {s:"diplomacy",s2:"intrigue",d:45},
            win: {r:"He pays in camels, and his clan owes yours a favor.",fx:{coin:60,honor:2}},
            lose: {r:"He drinks and calls you a merchant. Your clan is shamed.",fx:{honor:-4}},
          },
          {
            t: "Let the desert take him",
            r: "You turn your back. The desert does what deserts do.",
            fx: {honor:-4,wil:.5},
          },
        ],
      },
      {
        id: "wr_smuggle_run",
        cond: (p,C)=>civ(p,C)&&(crook(p,C)||C.poor(p)||C.flag(p,"wr_smuggler")),
        setup: (p,ctx)=>{prepH(p,ctx);const s=smuggle(p);ctx.goods=s[0],ctx.toll=s[1]},
        title: "A run on the back roads",
        text: "A carter offers you a place on a run: {goods}, past {toll}. Two nights on back roads, thirty suns at the end. Get caught, and it is the realm's law for smugglers.",
        choices: [
          {
            t: "Ride with the cart",
            check: {s:"stealth",s2:"survival",d:50},
            win: {
              r: "Back roads, a ford in the dark, a barn at dawn. Thirty suns.",
              fx: {coin:30,skill:{stealth:2},flag:"wr_smuggler"},
            },
            lose: {r:"The toll-clerks were waiting.",fx:{punish:"smuggling"}},
          },
          {
            t: "Put money in instead of your neck (20 suns)",
            req: p=>p.coin>=20,
            check: {s:"trade",s2:"int",d:45},
            win: {r:"Your twenty suns come back as fifty.",fx:{coin:30,flag:"wr_smuggler"}},
            lose: {r:"The cart is seized. Your money is gone.",fx:{coin:-20}},
          },
          {t:"Refuse",r:"You tell the carter you never saw him.",fx:{}},
        ],
      },
      {
        id: "wr_toll_house",
        cond: (p,C)=>civ(p,C)&&(C.flag(p,"wr_smuggler")||C.job(p,"merchant")||crook(p,C)),
        setup: (p,ctx)=>{prepH(p,ctx),ctx.clerk=nm(p)},
        title: "The toll-house",
        text: 'The toll-house at the bridge. Your cart holds more than the tally says. The clerk, {clerk}, is new. Is he a "wet" one who takes a coin, or a "dry" one who will not?',
        choices: [
          {
            t: "Slip him a coin with the toll",
            check: {s:"ins",s2:"intrigue",d:45},
            win: {r:"Wet as a fish. He waves you through.",fx:{coin:-3}},
            lose: {r:"Dry as a bone. He calls the guard.",fx:{punish:"smuggling"}},
          },
          {
            t: "Brazen it out",
            check: {s:"diplomacy",s2:"wil",d:50},
            win: {
              r: "You complain about the weather and the roads until he waves you through to be rid of you.",
              fx: {coin:10},
            },
            lose: {r:"He finds the false bottom.",fx:{punish:"smuggling"}},
          },
          {
            t: "Take the ford instead",
            check: {s:"survival",s2:"sta",d:40},
            win: {r:"The ford is cold and the cart nearly tips, but you save the toll.",fx:{coin:5}},
            lose: {r:"The cart tips. Half the load floats away downstream.",fx:{coin:-15}},
          },
          {t:"Pay the full toll",r:"You pay every penny. It hurts, but you sleep tonight.",fx:{coin:-12}},
        ],
      },
      {
        id: "wr_tempt_purse",
        cond: (p,C)=>civ(p,C)&&!C.rich(p),
        setup: prepH,
        title: "A fraying string",
        text: ()=>`In the crowd at the ${A.pick(["market","horse fair","temple steps","harbor"])}, a fat merchant's purse hangs from his belt by a single fraying string. Nobody is looking. It would be so easy.`,
        choices: [
          {
            t: "Cut it",
            check: {s:"stealth",s2:"spd",d:45},
            win: {r:"One flick. Eleven suns and a lucky charm.",fx:{coin:11,honor:-2,skill:{stealth:2}}},
            lose: {r:'He turns at the wrong moment. "Thief!" The hue and cry goes up.',fx:{punish:"theft"}},
          },
          {
            t: "Tell him his string is fraying",
            r: "He stares, then laughs and gives you a sun for your honesty.",
            fx: {coin:1,honor:2},
          },
          {t:"Walk on",r:"You walk on. Your hand is shaking a little.",fx:{}},
        ],
      },
      {
        id: "wr_harbor_cant",
        cond: (p,C)=>civ(p,C)&&C.coast(p)&&C.town(p)&&(crook(p,C)||C.job(p,"sailor")||C.poor(p)),
        setup: prepH,
        title: "Harbor cant",
        text: "In the dockside taverns they talk Harbor cant: a purse is a fish, an informer a lamp, a sun a face, prison the ledger, the gallows the tall widow, and to drink with the Queen is to drown. Nobody is born to it, but everybody who matters here speaks it.",
        choices: [
          {
            t: "Learn it from an old docker",
            check: {s:"int",s2:"diplomacy",d:40},
            win: {
              r: `"Mind the lamp, or you'll dance with the widow." You understand every word.`,
              fx: {skill:{intrigue:3},int:.3},
            },
            lose: {
              r: 'You get a word wrong and call a watchman "wet" to his face.',
              fx: {health:-5,cause:"a watchman's staff"},
            },
          },
          {
            t: "Use it to listen in on the thieves",
            check: {s:"intrigue",s2:"ins",d:50},
            win: {r:"Two men plan to rob a warehouse. You sell the warning for fifteen suns.",fx:{coin:15}},
            lose: {r:"They notice you listening.",fx:{health:-8,cause:"a beating"}},
          },
          {t:"Ignore it",r:"You drink your ale and keep your own tongue.",fx:{}},
        ],
      },
      {
        id: "wr_hired_knife",
        cond: (p,C)=>civ(p,C)&&(C.poor(p)||crook(p,C)),
        setup: (p,ctx)=>{prepH(p,ctx),ctx.victim=nm(p)},
        title: "A man in a good cloak",
        text: 'A man in a good cloak finds you in a cheap tavern. "{victim} owes my master money and will not pay. Fifteen suns to see him knifed in the dark." Most hired knives are caught within a month, and most of them talk.',
        choices: [
          {t:"Refuse",r:"You refuse. He leaves a sun on the table for your silence.",fx:{coin:1,honor:2}},
          {
            t: "Take the money and warn {victim} instead",
            check: {s:"intrigue",s2:"ins",d:50},
            win: {
              r: "{victim} pays you ten suns more and leaves the city. You keep both purses.",
              fx: {coin:25,honor:1},
            },
            lose: {
              r: "The man in the cloak hears of it. You are beaten half to death.",
              fx: {health:-25,wil:1.5,wound:"broken_ribs",cause:"a beating in an alley"},
            },
          },
          {
            t: "Do it",
            check: {s:"stealth",s2:"ins",d:55},
            win: {
              r: "It is done. The fifteen suns weigh more than they should.",
              fx: {coin:15,honor:-15,trait:"cruel",wil:1},
            },
            lose: {r:"You are seen.",fx:{punish:"murder"}},
          },
          {
            t: "Report it to the watch",
            r: "The watch thanks you and does nothing. Two weeks later {victim} is pulled out of the river.",
            fx: {honor:2,happy:-3},
          },
        ],
      },
      {
        id: "wr_hue_and_cry",
        cond: (p,C)=>civ(p,C)&&C.town(p),
        setup: prepH,
        title: "Hue and cry",
        text: '"Thief! Thief!" The hue and cry goes up in the street, and by law every neighbor must answer it or be fined. A boy of fifteen runs past you with a loaf under each arm.',
        choices: [
          {
            t: "Tackle him",
            check: {s:"spd",s2:"str",d:40},
            win: {
              r: "You bring him down. The baker thanks you. The boy looks at you with pure hatred.",
              fx: {fame:1,honor:1},
            },
            lose: {r:"He slips past you. The watch fines you for not trying harder.",fx:{coin:-2}},
          },
          {
            t: "Trip the pursuers instead",
            check: {s:"stealth",s2:"spd",d:45},
            win: {
              r: "A foot in the right place. Three men go down in the mud, and the boy is gone.",
              fx: {honor:2,happy:3,skill:{stealth:2}},
            },
            lose: {r:"A neighbor saw. You are fined for hindering the hue and cry.",fx:{coin:-5}},
          },
          {
            t: "Pay the baker for the bread",
            req: p=>p.coin>=2,
            r: "The baker takes your coin, grumbling. The hue and cry ends in a shrug.",
            fx: {coin:-2,honor:3,piety:1},
          },
          {t:"Stand aside",r:"You stand aside, and the watch fines you a penny for it.",fx:{coin:-1}},
        ],
      },
      {
        id: "wr_coin_clipping",
        cond: (p,C)=>civ(p,C)&&(crook(p,C)||C.job(p,"smith")||C.job(p,"merchant")),
        setup: prepH,
        title: "Clipped silver",
        text: p=>`A man shows you how to shave a sliver of silver from the edge of every sun that passes through your hands. Melt the clippings down, and every hundred coins makes you two more. ${p.realm==="POL-03"?"In Varenna, they hang coin-clippers.":"The courts call it theft from the crown."}`,
        choices: [
          {
            t: "Try it",
            check: {s:"craft",s2:"stealth",d:50},
            win: {
              r: "Slow and careful. A year of clipping makes you forty suns.",
              fx: {coin:40,honor:-4,skill:{craft:2}},
            },
            lose: {
              r: "A moneychanger weighs your coins and calls the watch.",
              fx: p=>p.realm==="POL-03"?(gallows(p),"In Varenna, clippers hang."):(A.punish(p,"theft"),""),
            },
          },
          {t:"Report him",r:"The man is taken. You get five suns from the mint-master.",fx:{coin:5,honor:2}},
          {t:"Have nothing to do with it",r:"You tell him to take his little knife elsewhere.",fx:{}},
        ],
      },
    ]);
  })();
})();
