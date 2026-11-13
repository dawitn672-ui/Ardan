// The release's event pack 9 of 30 (193 events, mostly pf_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-028). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const nm = (p,sex)=>{try{return A.givenName(p.cult,sex||(A.chance(.5)?"M":"F"))||"Tam"}catch{return"Tam"}},
      inR = (p,...ids)=>ids.includes(p.realm),
      kid = (p,C)=>C.young(p)&&C.ageAdj(p)>=6,
      pro = (p,C,k,n)=>C.adult(p)&&C.prof(p,k,n);
    function who(p,ctx,kind){const q=A.makeAcquaintance(p,kind||"friend");return ctx.pid=q.id,ctx.They=A.cap(A.he(q)),ctx.Their=A.cap(A.his(q)),q}
    function school(p,ctx,re,fb){const all=(LORE.schools||[]).filter(s2=>s2&&re.test(s2.teaches+" "+s2.name)),own=all.filter(s2=>s2.realm===p.realm),s=own.length?A.pick(own):all.length?A.pick(all):null;return ctx.school=s?s.name:fb||"the old fighting school",ctx.splace=s?s.place:"the capital",ctx.smaster=s?s.master:"an old master",ctx.sown=own.length?"here at home":"far from "+A.realmShort(p.realm),s}
    const rs = p=>A.realmShort(p.realm),
      faithName = p=>{const f=A.faith(p.faith);return f&&f.name?f.name:"the old gods"},
      instrument = p=>inR(p,"POL-20")?"a twenty-one-string harp":inR(p,"POL-12","POL-11","POL-34")?"a horse-head fiddle":inR(p,"POL-13")?"a long horn":inR(p,"POL-17","POL-24","POL-19")?"a reed flute":inR(p,"POL-27")?"a conch":p.race==="dwarf"?"a hammer and an anvil":inR(p,"POL-01","POL-08","POL-14","POL-25","POL-26","POL-05")?"a fiddle":A.pick(["a lute","a pipe","a lute"]),
      diceGame = p=>inR(p,"POL-17","POL-18","POL-02","POL-03","POL-04","POL-16","POL-24","POL-21")?"Sun and Shadow":inR(p,"POL-11","POL-12","POL-34","POL-19")?"bones":"bone dice",
      // [X1 baked patch events/79-beast-scenes BEAST-SPEAR] C_beast picked the spear-hunt's beast by terrain alone (a
      // hell boar in any forest). Its pick stands where canon puts that beast; elsewhere it takes a beast that does live
      // near home, and the hunt is skipped where none does.
      C_beast0 = p=>{const t=(A.prov(p.home)||{}).terr;return t==="steppe"?"CRE-35":t==="mountains"?"CRE-25":t==="forest"||t==="tundra"?A.pick(["CRE-21","CRE-23"]):"CRE-23"},
      C_beast = p=>{const id=C_beast0(p);if(!A.BH||A.BH.suits(id,A.prov(p.home)))return id;const n=(A.beastsNear(p)||[]).filter(x=>A.beastTier(x)!=="legend");return n.length?A.pick(n):null},
      // [X1 baked patch events/99999-v2-content V2C-FX-PARTS] The soldier packs build 227 choices as both({ honor: 2,
      // ... }, op2(-30)): a closure whose source shows only "applyFx(p, obj, ctx)", so the card could read none of what
      // they do (playtest 2, old 18 and 19: "It will be remembered", "• changes regard" naming nobody). The closures now
      // carry their parts (A.V2C.parts: f.v2parts, and op2's regard and messmate as f.v2meta), which the chips read as
      // written. Nothing they do changes. In the source: write these effects as data, or give the helpers a way to say
      // what they hold.
      both = (obj,fn)=>(A.V2C&&A.V2C.parts||(f=>f))((p,ctx)=>{const a=A.applyFx(p,obj,ctx),b=fn(p,ctx);return[a,b].filter(x=>typeof x=="string"&&x).join(" ")},[obj,fn]);
    A.defEvents([
      {
        id: "pf_melee_sticks",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)<13,
        once: !0,
        w: .5,
        title: "Hazel sticks",
        text: ()=>`Behind ${A.pick(["the mill","the tithe barn","the smithy","the cattle pens"])} the children of {home} fight with hazel sticks. Big ones against small ones, as always. Someone throws you a stick.`,
        choices: [
          {
            t: "Wade in",
            check: {s:"ins",s2:"spd",d:20},
            win: {
              r: "You duck, step, and crack the biggest boy on the knuckles. Nobody taught you that. It was just there.",
              fx: {apt:{melee:1.25},skill:{melee:3},ins:.4,happy:3},
            },
            lose: {r:"You get a stick across the ear and a lesson in humility.",fx:{health:-3,skill:{melee:1},wil:.5}},
          },
          {
            t: "Watch the best fighter's feet first",
            check: {s:"int",s2:"ins",d:18},
            win: {
              r: "You see it: she never stands square. When your turn comes, neither do you.",
              fx: {skill:{melee:2},int:.3},
            },
            lose: {r:"All you see is sticks and shouting.",fx:{skill:{melee:1}}},
          },
          {t:"Go home",r:"You go home. The shouting follows you halfway up the lane.",fx:{}},
        ],
      },
      {
        id: "pf_melee_pell_yard",
        cond: (p,C)=>C.adult(p)&&!C.old(p)&&(C.soldier(p)||C.prof(p,"melee",10)||C.trait(p,"brave")),
        w: .7,
        cool: 10,
        setup: (p,ctx)=>{who(p,ctx,"mentor"),ctx.vet=A.pick(["lost an eye at the ford","served twenty years in the levies","fought in three wars and won one","once guarded a count"])},
        title: "The pell yard",
        text: "{them}, who {vet}, keeps a pell yard behind the alehouse in {town}: a post, a chalk circle and a barrel of blunted blades. Four suns a month, footwork first, steel later.",
        choices: [
          {
            t: "Pay for a season (12 suns)",
            req: p=>p.coin>=12,
            r: "Three months of footwork until you dream of chalk. Then the steel, and you are ready for it.",
            fx: {coin:-12,skill:{melee:4},ins:.5,spd:.3,them:{type:"mentor",op:20}},
          },
          {
            t: "Sweep the yard and carry water for lessons",
            r: "{them} works you like a mule and teaches you like family. Slower, but it sticks.",
            fx: {skill:{melee:3},sta:.5,happy:-1,them:{type:"mentor",op:25}},
          },
          {
            t: "Spar with {them} to see if it is worth it",
            check: {s:"melee",s2:"ins",d:45},
            win: {
              r: "You land a touch on the old fighter. {They} laughs and says you can come for half price.",
              fx: {skill:{melee:2},coin:-6,them:{type:"mentor",op:15},fame:1},
            },
            lose: {
              r: '{They} puts you on your back three times in a row. "Four suns. Footwork first."',
              fx: {health:-3,skill:{melee:1},wil:.5},
            },
          },
          {t:"You have no time for it",r:"You walk past the yard. The thud of the pell follows you.",fx:{}},
        ],
      },
      {
        id: "pf_melee_chalk_circle",
        cond: (p,C)=>pro(p,C,"melee",30),
        w: 1,
        title: "The chalk circle",
        text: ()=>`Feast-day bouts in the square at {home}: blunted blades, a judge with a staff, a stop at first blood. ${A.pick(["A tanner","A carter","A miller's son","A discharged sergeant"])} has won four in a row and the crowd is betting three deep.`,
        choices: [
          {
            t: "Step into the circle for the purse",
            check: {s:"melee",s2:"ins",d:50},
            win: {
              r: "Two passes and a touch to the ribs. The judge's staff comes down between you, and the purse is yours.",
              fx: {coin:15,fame:2,skill:{melee:2},happy:4},
            },
            lose: {
              r: "A blunt blade still breaks skin. You walk out with a split brow and an empty purse.",
              fx: {health:-6,coin:-2,wil:1,cause:"a bout gone wrong"},
            },
          },
          {
            t: "Fight the champion for real, no judge",
            r: "The judge washes his hands of it. The crowd loves it more.",
            fx: {
              duel: {
                tier: 2,
                title: "the feast-day champion",
                opts: {kind:"brawl",lethal:!1,toYield:!0,place:"the square",title:"The chalk circle"},
              },
            },
          },
          {
            t: "Bet on the champion and watch how he moves",
            check: {s:"gambling",s2:"melee",d:40},
            win: {
              r: "You read his feet and bet right. Six suns, and a few tricks worth stealing for your own fighting.",
              fx: {coin:6,skill:{melee:1,gambling:1}},
            },
            lose: {r:"He slips in the mud on the fifth bout. There goes your money.",fx:{coin:-4}},
          },
        ],
      },
      {
        id: "pf_melee_young_blood",
        cond: (p,C)=>pro(p,C,"melee",50),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{who(p,ctx,"rival")},
        title: "The young blood",
        text: "{themFull}, {themAge} years old and fast as a cat, has been telling every alehouse in {town} that you are past it. Today {theyHe} is standing in your road with a blade and a crowd.",
        choices: [
          {
            t: "Teach {themHim} manners",
            r: "You draw. The crowd makes a ring.",
            fx: {
              duel: {foe:"them",tier:2,opts:{kind:"duel",lethal:!1,toYield:!0,place:"the road",title:"The young blood"}},
            },
          },
          {
            t: "Disarm {themHim} with a word: offer to teach {themHim}",
            check: {s:"persuasion",s2:"melee",d:45},
            win: {
              r: "{They} expected a fight, not a compliment. By evening {theyHe} is sweeping your yard.",
              fx: {them:{type:"friend",op:25},honor:3,fame:1},
            },
            lose: {
              r: '"Afraid, old one?" {They} spits and walks off. Now the whole town knows you would not fight.',
              fx: {fame:-2,them:{type:"rival",op:-15},wil:1},
            },
          },
          {
            t: "Walk past {themHim} without a word",
            r: "You walk on. Some call it wisdom. {them} calls it cowardice, loudly, for a month.",
            fx: {them:{type:"rival",op:-10},fame:-1,wil:.5},
          },
        ],
      },
      {
        id: "pf_melee_old_knees",
        cond: (p,C)=>C.old(p)&&C.prof(p,"melee",40),
        once: !0,
        w: 1,
        title: "The knees go first",
        text: "You can still see the opening. You can still see where the blade should go. But your knees answer a heartbeat late now, and in a fight a heartbeat is a life.",
        choices: [
          {
            t: "Fight smarter: wait, and let them come",
            r: "You learn to stand still and let younger fools spend themselves. It is a whole new art at your age.",
            fx: {wil:2,ins:.5,skill:{melee:2}},
          },
          {
            t: "Push through it, as you always have",
            check: {s:"sta",s2:"wil",d:50},
            win: {
              r: "Cold baths, long walks, stubbornness. The knees grumble and obey for a few years more.",
              fx: {sta:.5,wil:1.5},
            },
            lose: {
              r: "Something in the left knee goes with a pop you hear across the yard.",
              fx: {wound:"bad_knee",health:-8,wil:2},
            },
          },
          {
            t: "Hang up the blade and teach the young",
            r: "You hang your blade over the hearth. The village youngsters come anyway, and you teach them what you know.",
            fx: {happy:4,fame:1,newRel:{type:"friend",op:35}},
          },
        ],
      },
      {
        id: "pf_sword_wall_blade",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)<14&&(C.famMil(p)||["gentry","noble","royal"].includes(p.status)||C.famKind(p,"gentry_mil","noble")),
        once: !0,
        w: .6,
        title: "The sword on the wall",
        text: "The old sword hangs over the hearth, too high to reach. You reach it anyway, with a stool on a bench. It is heavier than you thought, and it hums when you swing it.",
        choices: [
          {
            t: "Take it to the barn and practise",
            check: {s:"spd",s2:"ins",d:22},
            win: {
              r: "Cut, cut, thrust, until your arms shake. When they catch you, the old steward watches a moment too long before he scolds you.",
              fx: {apt:{sword:1.3},skill:{sword:3},happy:3},
            },
            lose: {
              r: "The edge catches your forearm. A lot of blood, a lot of shouting, a scar you keep.",
              fx: {health:-6,wound:"scar_arm",skill:{sword:1},wil:1,cause:"a child's cut"},
            },
          },
          {
            t: "Ask {father} to teach you properly",
            check: {s:"wil",s2:"int",d:20},
            win: {
              r: '{father} looks at you a long while, then takes down a wooden waster instead. "Every morning. Before chores."',
              fx: {skill:{sword:2},rel:{who:"father",op:10},wil:.5},
            },
            lose: {r:'"When you are older." It is always when you are older.',fx:{happy:-2}},
          },
          {t:"Put it back before anyone sees",r:"You hang it back. It hums in your dreams for a week.",fx:{}},
        ],
      },
      {
        id: "pf_sword_school",
        cond: (p,C)=>C.adult(p)&&C.ageAdj(p)<32&&(C.prof(p,"sword",15)||p.coin>=40||C.noble(p)),
        w: .6,
        once: !0,
        setup: (p,ctx)=>{school(p,ctx,/sword|blade|buckler|Lion/i,"the sword school"),ctx.inst=nm(p)},
        title: "A place in the school",
        text: "{inst}, who trained at {school} in {splace} ({sown}), takes six pupils a year at 30 suns a season. One place is open. Two other hopefuls are waiting at the door.",
        choices: [
          {
            t: "Pay for the place (30 suns)",
            req: p=>p.coin>=30,
            r: "A season of cuts at a straw man, the guards a thousand times, and {inst}'s cane on your wrist when it drops.",
            fx: {coin:-30,skill:{sword:5},spd:.5,ins:.4,newRel:{type:"mentor",op:30}},
          },
          {
            t: "Win the place in a bout with the others",
            check: {s:"sword",s2:"spd",d:45},
            win: {
              r: 'You beat both hopefuls before {inst} has finished a cup. "Free," {inst} says. "I want to see what you become."',
              fx: {skill:{sword:4},fame:1,newRel:{type:"mentor",op:35}},
            },
            lose: {
              r: "The second one is faster than you. You go home with a welt and a lesson.",
              fx: {health:-4,skill:{sword:1},wil:1,newRel:{type:"rival",op:-10}},
            },
          },
          {
            t: "Ask to watch from the wall for free",
            r: "{inst} lets you watch, so long as you sweep. You learn more than they think.",
            fx: {skill:{sword:2},int:.3},
          },
        ],
      },
      {
        id: "pf_sword_stumble",
        cond: (p,C)=>pro(p,C,"sword",45),
        w: 1,
        cool: 8,
        setup: (p,ctx)=>{ctx.bm=nm(p,"M"),ctx.foe=nm(p),ctx.bribe=A.pick([30,40,50])},
        title: "The price of a stumble",
        text: `The feast-day bouts are tomorrow, and you are drawn against {foe}, the crowd's darling. The bout-master {bm} finds you at the well. "{bribe} suns if you slip in the third pass. The betting is very heavy on you."`,
        choices: [
          {
            t: "Take the money and slip",
            r: "You slip in the third pass, and it looks real. {bm} pays. You feel the coins every time you lift your sword.",
            fx: (p,ctx)=>A.applyFx(p,{coin:ctx.bribe,honor:-6,flag:"pf_threw_bout",fame:-1},ctx),
          },
          {
            t: "Refuse, and win in front of everyone",
            check: {s:"sword",s2:"ins",d:55},
            win: {
              r: "You beat {foe} in two passes. Half the town lost money on that. {bm} will not forget it.",
              fx: {fame:3,skill:{sword:2},honor:3,coin:10,newRel:{type:"enemy",op:-30}},
            },
            lose: {r:"You lose honestly, and nobody believes it was honest.",fx:{fame:-1,health:-4,honor:2,wil:1}},
          },
          {
            t: "Tell the judge of the bouts",
            check: {s:"persuasion",s2:"wil",d:45},
            win: {
              r: "The judge believes you. {bm} is barred from the square and fined. Some fighters thank you. Some never speak to you again.",
              fx: {honor:5,fame:1,newRel:{type:"enemy",op:-40}},
            },
            lose: {
              r: "It is your word against his, and he has paid the judge longer than you have been fighting.",
              fx: {honor:2,happy:-3,newRel:{type:"enemy",op:-30}},
            },
          },
        ],
      },
      {
        id: "pf_sword_outside_gates",
        cond: (p,C)=>pro(p,C,"sword",40)&&!C.old(p),
        w: .9,
        setup: (p,ctx)=>{who(p,ctx,"rival"),ctx.where=p.realm==="POL-03"?"Varenna bans duels inside town walls, so it will be outside the gates at dawn, and you will both call it a bout":"It will be behind the tannery at dawn, where the watch does not walk"},
        title: "Outside the gates",
        text: "At supper {themFull} says your teacher was a fraud and your footwork belongs on a dance floor. Everyone hears it. {where}.",
        choices: [
          {
            t: "Meet {themHim} at dawn, to first blood",
            r: "Grey light, wet grass, two blades.",
            fx: {
              duel: {
                foe: "them",
                tier: 3,
                opts: {kind:"duel",lethal:!1,toYield:!0,place:"outside the gates",title:"To first blood"},
              },
            },
          },
          {
            t: "Answer with a sharper tongue instead",
            check: {s:"persuasion",s2:"int",d:45},
            win: {
              r: "Your answer gets the bigger laugh. {They} leaves the hall red-faced and the matter dies there.",
              fx: {fame:1,them:{type:"rival",op:-10},skill:{persuasion:1}},
            },
            lose: {r:"Your reply falls flat. Now you look like a coward and a bore.",fx:{fame:-1,happy:-3}},
          },
          {t:"Let it go",r:"You let it go. It costs you a little pride and nothing else.",fx:{wil:1,honor:-1}},
        ],
      },
      {
        id: "pf_sword_chanari",
        cond: (p,C)=>pro(p,C,"sword",50)&&p.coin>=150,
        w: .7,
        once: !0,
        setup: (p,ctx)=>{ctx.dealer=nm(p,"M"),ctx.price=A.pick([150,160,180])},
        title: "A blade from Chanari",
        text: `A trader called {dealer} unwraps oiled cloth at your table. Water-patterned steel. "Chanari crucible steel, from the Blade Hall in Ranpur. Worth 400. For you, {price}." Chanari blades are rare as hen's teeth this far from Ranpur.`,
        choices: [
          {
            t: "Test it: flex it, cut a nail, read the pattern",
            req: (p,C,ctx)=>p.coin>=(ctx.price||999),
            check: {s:"craft",s2:"sword",d:50},
            win: {
              r: "The edge bites the nail and keeps its line. It is real. You pay before he changes his mind.",
              fx: (p,ctx)=>A.applyFx(p,{coin:-ctx.price,gear:{weapon:"chanari"},happy:6,fame:1},ctx),
            },
            lose: {
              r: "It passes every test you know. Three months later the edge chips on a mail collar. Etched pattern, cheap iron. {dealer} is long gone.",
              fx: (p,ctx)=>A.applyFx(p,{coin:-ctx.price,gear:{weapon:"goodsword"},happy:-6,wil:1},ctx),
            },
          },
          {
            t: "Ask {dealer} where exactly he got it",
            check: {s:"ins",s2:"trade",d:45},
            win: {
              r: "His story changes twice in a minute. You wrap the cloth back up for him. He leaves fast.",
              fx: {skill:{trade:1},int:.3},
            },
            lose: {r:"His story sounds fine to you. You still cannot afford the risk, so you pass.",fx:{}},
          },
          {
            t: "Your blade has done well enough",
            r: "You send him on his way. Somewhere down the road someone else buys a legend.",
            fx: {},
          },
        ],
      },
      {
        id: "pf_sword_pupil",
        cond: (p,C)=>pro(p,C,"sword",70),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{who(p,ctx,"friend")},
        title: "A pupil at the door",
        text: '{themFull}, all elbows and hope, is at your door with a borrowed sword and a purse of coppers. "They say you are the best blade in {home}. Teach me."',
        choices: [
          {
            t: "Take {themHim} on for nothing",
            r: "You teach the guards and the footwork. Teaching shows you the holes in your own fighting.",
            fx: {skill:{sword:2},them:{type:"friend",op:30},happy:4,honor:2},
          },
          {
            t: "Charge a fair fee (10 suns a season)",
            r: "{They} scrapes the coins together somehow, and learns quickly.",
            fx: {coin:10,skill:{sword:1},them:{type:"friend",op:15}},
          },
          {
            t: "Test {themHim} first",
            check: {s:"sword",s2:"int",d:45},
            win: {
              r: "In three passes you see it: a natural. You take {themHim} on, and you will brag about it one day.",
              fx: {them:{type:"friend",op:25},fame:1,skill:{sword:1}},
            },
            lose: {
              r: "You test too hard and crack {theirHis} wrist. {They} goes home and does not come back.",
              fx: {them:{op:-20},honor:-2,happy:-3},
            },
          },
          {
            t: "Send {themHim} away",
            r: "{They} goes, head down. Maybe someone kinder will teach {themHim}.",
            fx: {them:{op:-10}},
          },
        ],
      },
      {
        id: "pf_axe_woodpile",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=8&&(C.terr(p,"forest","hills","tundra","mountains")||C.race(p,"dwarf","orc","halforc","giant")),
        once: !0,
        w: .5,
        title: "The woodpile",
        text: "Winter is coming and the woodpile is low. You are given the axe for the first time, and a stack of oak rounds as high as your chest.",
        choices: [
          {
            t: "Split until it is done",
            check: {s:"str",s2:"sta",d:20},
            win: {
              r: "By dusk the stack is split and stacked. The old woodcutter next door says he has never seen a child swing so true.",
              fx: {apt:{axe:1.25},skill:{axe:3},str:.5,family:2},
            },
            lose: {
              r: "Blisters, then blood, then {father} finishing it while you watch.",
              fx: {skill:{axe:1},wil:1,str:.3},
            },
          },
          {
            t: "Read the grain and split along it",
            check: {s:"int",s2:"ins",d:20},
            win: {
              r: "Hit where the cracks already are and the wood does the work. You finish fast and keep your hands.",
              fx: {skill:{axe:2,craft:1},int:.3},
            },
            lose: {r:"The grain lies to you. The axe bounces and nearly takes your toe.",fx:{skill:{axe:1},health:-2}},
          },
          {
            t: "Hide in the hayloft",
            r: "You are found by supper. Cold porridge and no stories tonight.",
            fx: {happy:-2},
          },
        ],
      },
      {
        id: "pf_axe_hall_trial",
        cond: (p,C)=>C.adult(p)&&C.ageAdj(p)<32&&(C.prof(p,"axe",20)||C.stat(p,"str")>=45),
        w: .6,
        once: !0,
        setup: (p,ctx)=>{school(p,ctx,/axe|hammer|maul|hird/i,"the axe hall"),ctx.inst=nm(p)},
        title: "Swing it all day",
        text: "Fighters who trained at {school} in {splace} have a saying: the axe is easy, the hundredth swing is hard. {inst}, one of them, sets up a trial in the market: a war axe, a log the width of a man, and the noon sun.",
        choices: [
          {
            t: "Take the trial",
            check: {s:"axe",s2:"sta",d:48},
            win: {
              r: "Through the log by mid-afternoon, still swinging true. {inst} claps you on the back and offers to teach you for nothing.",
              fx: {skill:{axe:4},str:.6,sta:.4,fame:1,newRel:{type:"mentor",op:30}},
            },
            lose: {
              r: "Your back gives out before the log does. You walk crooked for a month.",
              fx: {health:-8,wound:"back",wil:1.5,skill:{axe:1}},
            },
          },
          {
            t: "Watch, and copy the good ones at home",
            r: "You watch every swing, then go home and wear out a chopping block.",
            fx: {skill:{axe:2},str:.3},
          },
          {t:"Leave the axes to the axe-men",r:"There is a reason they all have bad backs.",fx:{}},
        ],
      },
      {
        id: "pf_axe_harvest_chop",
        cond: (p,C)=>pro(p,C,"axe",30)||C.adult(p)&&C.job(p,"labor")&&C.terr(p,"forest"),
        w: .8,
        title: "The log-chop at Harvest Home",
        setup: (p,ctx)=>{who(p,ctx,"rival")},
        text: "Harvest Home, and the log-chop: two standing logs, two axes, the first through wins a fat ram and the right to boast for a year. Your opponent is {themFull}, who has won it twice.",
        choices: [
          {
            t: "Chop for the ram",
            check: {s:"axe",s2:"str",d:48},
            win: {
              r: "Your log falls a breath before {theirHis}. The ram is yours and so is the boasting.",
              fx: {fame:2,coin:8,happy:5,skill:{axe:2},them:{type:"rival",op:-10}},
            },
            lose: {
              r: "{They} wins again, and buys you a cup after. Rivals can be friends.",
              fx: {happy:-1,them:{type:"rival",op:10},skill:{axe:1}},
            },
          },
          {
            t: "Loosen {theirHis} axe head the night before",
            req: (p,C)=>C.prof(p,"stealth",25)||C.trait(p,"deceitful"),
            check: {s:"stealth",s2:"deception",d:45},
            win: {
              r: "{Their} axe head flies off on the third swing. You win. It tastes like ash.",
              fx: {coin:8,fame:1,honor:-6},
            },
            lose: {
              r: "{They} finds the loose wedge and shows it to the whole green. Everyone looks at you.",
              fx: {honor:-8,fame:-2,them:{type:"enemy",op:-40}},
            },
          },
          {
            t: "Cheer for {themHim} instead",
            r: "You drink and cheer. It is a good day either way.",
            fx: {happy:3,them:{op:5}},
          },
        ],
      },
      {
        id: "pf_axe_mace_maker",
        cond: (p,C)=>pro(p,C,"axe",50)&&p.coin>=40,
        w: .6,
        cool: 12,
        setup: (p,ctx)=>{ctx.smith=nm(p,"M")},
        title: "The right weight",
        text: '{smith}, the weaponsmith in {town}, watches you swing three of his axes and frowns at all three. "You need the weight further forward. I can make it. It will not be cheap."',
        choices: [
          {
            t: "Order a war hammer (60 suns)",
            req: p=>p.coin>=60,
            r: "A month later it is ready: a hammer face and a beak behind it that opens helmets. It feels like part of your arm.",
            fx: {coin:-60,gear:{weapon:"warhammer"},skill:{axe:1},happy:4},
          },
          {
            t: "Order a great axe (40 suns)",
            req: p=>p.coin>=40,
            r: "A long-hafted axe, balanced just past the hand. It bites through a shield rim as if it were bread.",
            fx: {coin:-40,gear:{weapon:"greataxe"},happy:3},
          },
          {
            t: "Forge it with him and learn the trade",
            check: {s:"craft",s2:"str",d:45},
            win: {
              r: "Two weeks at his anvil. You leave with a morning star you helped make and the start of a smith's arms.",
              fx: {coin:-12,gear:{weapon:"morningstar"},skill:{craft:3},str:.4},
            },
            lose: {
              r: "You ruin two blanks and burn your wrist. {smith} charges you for the iron.",
              fx: {coin:-10,wound:"burn",skill:{craft:1}},
            },
          },
          {t:"Keep your {weapon}",r:"You know your old weapon's faults. That is worth something.",fx:{}},
        ],
      },
      {
        id: "pf_axe_door",
        cond: (p,C)=>pro(p,C,"axe",40),
        w: .8,
        title: "The burning house",
        text: ()=>`A fire in ${A.pick(["the weaver's house","the baker's loft","the widow's cottage","the alehouse stable"])} at {home}. Someone is screaming behind a barred oak door, and the bucket line is too slow.`,
        choices: [
          {
            t: "Take an axe to the door",
            check: {s:"axe",s2:"str",d:45},
            win: {
              r: "Five blows and the oak gives. You drag out a child and her grandmother, both alive, both black with smoke.",
              fx: {fame:3,honor:5,happy:5,skill:{axe:1},health:-3,cause:"smoke"},
            },
            lose: {
              r: "The door gives too late for one of them. You burn your arms getting the other out.",
              fx: {wound:"burn",health:-10,honor:3,wil:2,cause:"burns"},
            },
          },
          {
            t: "Go through the thatch instead",
            check: {s:"athletics",s2:"spd",d:52},
            win: {
              r: "Up the wall, through the roof, out with the child. The thatch falls in behind you.",
              fx: {fame:3,honor:4,skill:{athletics:2},health:-5,cause:"a burning roof"},
            },
            lose: {
              r: "The roof gives under you. You fall into smoke and are pulled out by the legs.",
              fx: {wound:"lungs",health:-15,wil:2,cause:"smoke in the lungs"},
            },
          },
          {
            t: "Run the bucket line harder",
            r: "You bark the line into order. It is not enough, but it is something.",
            fx: {skill:{command:1},happy:-3},
          },
        ],
      },
      {
        id: "pf_spear_reeds",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)<13&&(C.terr(p,"marsh","plains")||C.coast(p)),
        once: !0,
        w: .5,
        title: "Fish in the shallows",
        text: ()=>`In the shallows ${A.pick(["of the river","below the weir","in the reed beds","by the old jetty"])}, the older children spear fish with sharpened hazel. They miss nine times in ten.`,
        choices: [
          {
            t: "Cut your own spear and try",
            check: {s:"ins",s2:"spd",d:20},
            win: {
              r: "You learn to aim below the fish, where it really is. By sunset you have three on a string.",
              fx: {apt:{spear:1.25},skill:{spear:2,survival:1},family:1,happy:3},
            },
            lose: {r:"You fall in. Twice. The fish are not impressed.",fx:{skill:{spear:1},happy:-1}},
          },
          {
            t: "Watch where the fish rest",
            r: "Fish like the shade of the jetty. You remember that for years.",
            fx: {skill:{survival:1},int:.2},
          },
          {t:"Too cold. Go home.",r:"Dry feet, empty hands.",fx:{}},
        ],
      },
      {
        id: "pf_spear_boar",
        cond: (p,C)=>pro(p,C,"spear",30)&&!C.terr(p,"desert"),
        w: .9,
        cool: 8,
        // [X1 baked patch events/79-beast-scenes BEAST-SPEAR] C_beast picked the spear-hunt's beast by terrain alone (a
        // hell boar in any forest). Its pick stands where canon puts that beast; elsewhere it takes a beast that does live
        // near home, and the hunt is skipped where none does.
        setup: (p,ctx)=>{(ctx.beast=C_beast(p))||(ctx.skip=1)},
        title: "Set the spear",
        text: "A {beast} has been killing stock around {home}, and the hunt is called. The beaters drive it toward the ditch where you stand with a hunting spear and its crossbar. Everyone knows the rule: set the butt, aim low, and do not let go.",
        choices: [
          {
            t: "Hold your ground and set the spear",
            check: {s:"spear",s2:"wil",d:50},
            win: {
              r: "It comes straight on. The spear takes it in the chest and the crossbar holds it off you. The village eats well, and you sit at the head of the table.",
              fx: {fame:2,skill:{spear:3},coin:5,wil:1,happy:4},
            },
            lose: {
              r: "It hits the spear, twists off it, and opens your leg to the bone.",
              fx: {wound:"limp",health:-18,wil:2,cause:"a beast on the hunt"},
            },
          },
          {
            t: "Go in after it into the thicket",
            r: "You leave the ditch and follow the blood into the brambles.",
            fx: {beast:{place:"the thicket by the fields",title:"Into the thicket"}},
          },
          {
            t: "Let someone else stand in the ditch",
            r: "Someone else stands there. You beat a pan and keep your legs.",
            fx: {fame:-1},
          },
        ],
      },
      {
        id: "pf_spear_pike_drill",
        cond: (p,C)=>C.adult(p)&&!C.old(p)&&!C.soldier(p)&&(C.prof(p,"spear",25)||C.town(p)),
        w: .6,
        cool: 10,
        setup: (p,ctx)=>{ctx.sarge=nm(p,"M")},
        title: "Pike drill",
        text: p=>`The ${p.realm==="POL-13"?"valley":"town"} muster: every able hand with a pike, two hours in the meadow, Sergeant {sarge} shouting. Most treat it as a holiday with beer at the end. The sergeant does not.`,
        choices: [
          {
            t: "Drill like it matters",
            check: {s:"spear",s2:"sta",d:40},
            win: {
              r: "Level, push, step, level. {sarge} puts you in the front rank and names you file-leader of the muster.",
              fx: {skill:{spear:3,command:1},sta:.4,fame:1},
            },
            lose: {
              r: "You step on the heels of the one in front, twice. The sergeant has words for you.",
              fx: {skill:{spear:1},happy:-2},
            },
          },
          {
            t: "Hang at the back and drink early",
            r: "It is a good afternoon. The sergeant writes your name in a little book.",
            fx: {happy:3,honor:-1},
          },
          {
            t: "Ask {sarge} to teach you the halberd after",
            r: "{sarge} grins and shows you hooking, cutting and the long thrust. Your shoulders ache for days.",
            fx: {skill:{spear:2},str:.3,newRel:{type:"friend",op:20}},
          },
        ],
      },
      {
        id: "pf_spear_wyrm",
        cond: (p,C)=>pro(p,C,"spear",50)&&(C.realm(p,"POL-32","POL-21")||C.coast(p)),
        w: .6,
        cool: 15,
        setup: (p,ctx)=>{ctx.beast="CRE-05",ctx.hunter=nm(p,"M")},
        title: "The wyrm hunt",
        text: p=>`${p.realm==="POL-32"?"A wyrm has come out of the scrub and taken goats.":"A trader back from the Amber Isles is hiring spears for a hunt there."} {hunter}, who learned at the Spear Yard of Aming, is gathering a party: long spears, nets, a share of the hide for each. The Amber Wyrm is a real lizard, three times a man's length, and it does not die easily.`,
        choices: [
          {
            t: "Join the hunt and take the front",
            r: "You go in front, spear low, as Aming teaches.",
            fx: {beast:{id:"CRE-05",place:"the scrub",title:"The wyrm hunt"}},
          },
          {
            t: "Join, but work the nets",
            check: {s:"spear",s2:"ins",d:50},
            win: {
              r: "The net holds, the spears go in, and you get a share of the hide worth 30 suns.",
              fx: {coin:30,skill:{spear:2},fame:1},
            },
            lose: {
              r: "The tail catches you as the net goes over. Ribs crack like kindling.",
              fx: {wound:"broken_ribs",health:-14,wil:1,cause:"a wyrm's tail"},
            },
          },
          {t:"Decline. You like your legs.",r:"{hunter} shrugs and finds another spear.",fx:{}},
        ],
      },
      {
        id: "pf_spear_halberd_rival",
        cond: (p,C)=>pro(p,C,"spear",45)&&!C.old(p),
        w: .8,
        cool: 8,
        setup: (p,ctx)=>{who(p,ctx,"rival")},
        title: "Reach",
        text: "{themFull} carries a glaive and tells everyone that reach beats skill every time. {They} has said it once too often near you, and now there are two poles, a ring of onlookers, and a bet.",
        choices: [
          {
            t: "Settle it with blunted poles",
            check: {s:"spear",s2:"ins",d:50},
            win: {
              r: "You get inside {theirHis} reach on the third thrust and tap {themHim} on the chest. The crowd roars.",
              fx: {fame:2,skill:{spear:2},coin:5,them:{type:"rival",op:-5}},
            },
            lose: {
              r: "Reach wins, this time. {They} cracks your knuckles and collects the bet.",
              fx: {health:-4,coin:-5,them:{type:"rival",op:-5},wil:1},
            },
          },
          {
            t: "Fight it out properly",
            r: "Poles up. The onlookers back away.",
            fx: {
              duel: {
                foe: "them",
                tier: 2,
                opts: {kind:"brawl",lethal:!1,toYield:!0,place:"the yard",title:"Pole against pole"},
              },
            },
          },
          {
            t: "Agree with {themHim}, and drink",
            r: '"Reach wins," you say, and buy the cup. {They} looks almost disappointed.',
            fx: {them:{type:"friend",op:15},coin:-1},
          },
        ],
      },
      {
        id: "pf_dagger_kid_knife",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=8&&(C.poor(p)||C.town(p)),
        once: !0,
        w: .5,
        title: "The older boy's knife",
        setup: (p,ctx)=>{ctx.bully=nm(p,"M")},
        text: "{bully}, three years older and twice your size, pulls a little knife on you behind the market stalls and wants your bread.",
        choices: [
          {
            t: "Grab his wrist and twist",
            check: {s:"spd",s2:"ins",d:24},
            win: {
              r: "The knife is suddenly in your hand and he is running. Your hands knew what to do before you did.",
              fx: {apt:{dagger:1.25},skill:{dagger:2,unarmed:1},wil:.5,happy:2},
            },
            lose: {
              r: "The blade nicks your palm. He takes the bread and the knife with him.",
              fx: {health:-4,wound:"deep_cut",wil:1,cause:"a knife"},
            },
          },
          {t:"Give him the bread",r:"You go hungry. He will come back, of course.",fx:{happy:-3,wil:.5}},
          {
            t: "Shout for the watch",
            r: "He runs. You keep your bread, and get a name as a squealer.",
            fx: {happy:-1},
          },
        ],
      },
      {
        id: "pf_dagger_alley",
        cond: (p,C)=>pro(p,C,"dagger",25)&&(C.town(p)||C.coast(p)),
        w: .9,
        title: "Purse or blood",
        text: ()=>`A dark lane off the ${A.pick(["harbor","fish market","tannery yard","temple steps"])}. A man steps out with a knife held low, like someone who has used one before. "Purse. Now."`,
        choices: [
          {
            t: "Draw your own knife",
            check: {s:"dagger",s2:"spd",d:48},
            win: {
              r: "Two feints, a cut to his forearm, and his knife is in the gutter. He runs bleeding into the dark.",
              fx: {skill:{dagger:2},ins:.4,fame:1},
            },
            lose: {
              r: "He is better at this than you. A slash across your ribs, and your purse goes with him.",
              fx: {health:-12,coinPct:-.2,wound:"deep_cut",cause:"a knife in an alley"},
            },
          },
          {
            t: "Fight him properly",
            r: "You step in close.",
            fx: {
              duel: {
                tier: 2,
                title: "a cutpurse with a knife",
                opts: {kind:"duel",lethal:!0,toYield:!0,place:"a dark lane",title:"Purse or blood"},
              },
            },
          },
          {
            t: "Throw him the purse",
            r: "He snatches it and is gone. You count the loss and your fingers, in that order.",
            fx: {coinPct:-.15,wil:.5},
          },
        ],
      },
      {
        id: "pf_dagger_still_hall",
        cond: (p,C)=>C.adult(p)&&C.ageAdj(p)<35&&(C.prof(p,"dagger",35)||C.prof(p,"stealth",40)),
        w: .6,
        once: !0,
        setup: (p,ctx)=>{school(p,ctx,/knife|silen|night/i,"the night school"),ctx.rec=nm(p)},
        title: "The quiet ones",
        text: '{rec} speaks very softly, and you have to lean in. "{school} in {splace} trains night-watchers. Silence, hand signs, the knife. We do not take many. Someone saw you, and told us."',
        choices: [
          {
            t: "Go and train with them for a season",
            r: "A season of silence. You learn to move without a sound and to put a knife exactly where it must go.",
            fx: {skill:{dagger:4,stealth:3},spd:.4,newRel:{type:"mentor",op:25},flag:"pf_quiet_school"},
          },
          {
            t: "Ask what they want in return",
            check: {s:"intrigue",s2:"int",d:45},
            win: {
              r: '{rec} smiles. "Ears, later. Not throats." You understand the price, and decide it is fair.',
              fx: {skill:{dagger:3,stealth:2,intrigue:1},flag:"pf_quiet_school"},
            },
            lose: {
              r: "{rec} does not answer, and is simply gone the next morning. You wonder what you missed.",
              fx: {int:.2},
            },
          },
          {t:"Decline",r:"{rec} nods as if it is all the same. Maybe it is.",fx:{}},
        ],
      },
      {
        id: "pf_dagger_hire",
        cond: (p,C)=>pro(p,C,"dagger",45)&&!C.noble(p),
        w: .7,
        cool: 10,
        setup: (p,ctx)=>{ctx.client=nm(p,"M"),ctx.mark=nm(p)},
        title: "Fifteen suns for a throat",
        text: '{client} buys you a cup and slides fifteen suns across the table. "{mark} owes me, and will not pay. Nobody needs to find {mark} in the morning." Most hired knives are caught within a month, and most of them talk.',
        choices: [
          {
            t: "Refuse him",
            r: "You push the coins back. He takes them, and the cup, and his business elsewhere.",
            fx: {honor:2},
          },
          {
            t: "Take the money and warn {mark} instead",
            check: {s:"deception",s2:"intrigue",d:50},
            win: {
              r: "{mark} leaves town that night. {client} thinks the job went wrong somewhere else. You keep fifteen suns.",
              fx: {coin:15,honor:2,skill:{deception:2}},
            },
            lose: {
              r: "{client} learns who warned {mark}. Now he wants your throat cut, and he can pay.",
              fx: {coin:15,newRel:{type:"enemy",op:-50}},
            },
          },
          {
            t: "Do the job",
            check: {s:"dagger",s2:"stealth",d:55},
            win: {
              r: "It is quick and ugly and done. The coins weigh more than they should.",
              fx: {coin:15,honor:-15,skill:{dagger:2},trait:"cruel",flag:"pf_hired_knife"},
            },
            lose: {
              r: "{mark} screams. The hue and cry comes running, and the whole street is after you.",
              fx: {honor:-12,punish:"murder"},
            },
          },
        ],
      },
      {
        id: "pf_dagger_mercy",
        cond: (p,C)=>pro(p,C,"dagger",55),
        w: .6,
        cool: 12,
        setup: (p,ctx)=>{who(p,ctx,"friend")},
        title: "The mercy stroke",
        text: "{themFull}, a knight's child with good mail and no idea how to lose in it, has heard you know where the gaps are: armpit, visor, the back of the knee. {They} offers 20 suns for a month of lessons.",
        choices: [
          {
            t: "Teach {themHim} everything",
            r: "A month on the floor with wooden knives. {They} learns, and so do you.",
            fx: {coin:20,skill:{dagger:2},them:{type:"friend",op:20}},
          },
          {
            t: "Teach {themHim} enough to be dangerous to others, not to you",
            check: {s:"intrigue",s2:"dagger",d:45},
            win: {r:"You keep the best tricks back. {They} pays and never notices.",fx:{coin:20,skill:{intrigue:1}}},
            lose: {r:'{They} notices. "You held back." {They} pays half and leaves cold.',fx:{coin:10,them:{op:-15}}},
          },
          {
            t: "Refuse. Knife-craft is not for knights.",
            r: "{They} goes away puzzled. You know too well what a knife is for.",
            fx: {them:{op:-5}},
          },
        ],
      },
      {
        id: "pf_dual_either_hand",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)<13,
        once: !0,
        w: .4,
        title: "The wrong hand",
        text: "The priest who teaches the children their letters keeps rapping your left hand. You keep switching back to it. Then he notices you can do it just as well with either.",
        choices: [
          {
            t: "Show off: write with both at once",
            check: {s:"spd",s2:"int",d:22},
            win: {
              r: "Two lines, two hands, one blot. The priest makes a sign against ill luck, then laughs. Either hand will do for you.",
              fx: {apt:{dualwield:1.4},spd:.4,happy:3},
            },
            lose: {r:"Two blots and a rap on each knuckle.",fx:{happy:-1,spd:.2}},
          },
          {
            t: "Use your right hand like you are told",
            r: "You learn to use your right. Your left stays clever anyway.",
            fx: {skill:{learning:1}},
          },
        ],
      },
      {
        id: "pf_dual_buckler_hall",
        cond: (p,C)=>C.adult(p)&&!C.old(p)&&(C.prof(p,"dualwield",25)||C.prof(p,"sword",40)||C.prof(p,"dagger",40)),
        w: .6,
        once: !0,
        setup: (p,ctx)=>{school(p,ctx,/buckler|dagger|sword/i,"Buckler Hall"),ctx.duel=nm(p,"M")},
        title: "Sword and dagger",
        text: '{duel}, an old duelist who sharpened his tricks at {school} in {splace}, shows you the second blade: a parrying dagger in the off hand. "Shields are for walls. This is for alleys."',
        choices: [
          {
            t: "Learn it, bruises and all (15 suns)",
            req: p=>p.coin>=15,
            r: "A month of rapped knuckles. Then one day the dagger catches a cut by itself and your sword answers.",
            fx: {
              coin: -15,
              skill: {dualwield:4,dagger:1},
              spd: .4,
              gear: {shield:"parrydagger"},
              newRel: {type:"mentor",op:25},
            },
          },
          {
            t: "Trade him a bout for a lesson",
            check: {s:"dualwield",s2:"ins",d:45},
            win: {
              r: "You hold him off long enough that he laughs and gives you the lesson for nothing.",
              fx: {skill:{dualwield:3},gear:{shield:"parrydagger"}},
            },
            lose: {
              r: "He takes you apart with a butter knife. You learn a great deal anyway.",
              fx: {skill:{dualwield:2},health:-3},
            },
          },
          {t:"Keep your shield",r:'"Alleys," you say, "are what walls are for."',fx:{}},
        ],
      },
      {
        id: "pf_dual_show",
        cond: (p,C)=>pro(p,C,"dualwield",45),
        w: .8,
        title: "Two blades for the crowd",
        text: "{festival} at {home}. A fair-master offers you 8 suns to give a display: two blades, turning together, cutting apples thrown from the crowd.",
        choices: [
          {
            t: "Give them a show",
            check: {s:"dualwield",s2:"spd",d:48},
            win: {
              r: "Apples in halves, quarters, eighths. The crowd throws coins as well as apples.",
              fx: {coin:14,fame:2,skill:{dualwield:2},happy:4},
            },
            lose: {
              r: "The left blade turns the wrong way and opens your own forearm. The crowd gasps, then laughs.",
              fx: {coin:8,wound:"deep_cut",health:-6,fame:-1,cause:"a display gone wrong"},
            },
          },
          {
            t: "Do something simpler and safer",
            r: "Plain cuts, no tricks. The crowd is polite. The coins are real.",
            fx: {coin:8,fame:1},
          },
          {t:"Refuse. Steel is not for juggling.",r:"The fair-master finds a fire-eater instead.",fx:{}},
        ],
      },
      {
        id: "pf_dual_shieldman",
        cond: (p,C)=>pro(p,C,"dualwield",35)&&!C.old(p),
        w: .8,
        cool: 8,
        setup: (p,ctx)=>{who(p,ctx,"rival")},
        title: "Two blades are for show",
        text: '{themFull}, a veteran of the shield wall, watches you practise and spits. "Two blades is for show. A shield keeps you alive." {They} picks up a shield and a waster. "Show me."',
        choices: [
          {
            t: "Show {themHim}",
            r: "Two blades against a shield. The yard goes quiet.",
            fx: {
              duel: {
                foe: "them",
                tier: 2,
                opts: {kind:"brawl",lethal:!1,toYield:!0,place:"the practice yard",title:"Two blades against a shield"},
              },
            },
          },
          {
            t: "Ask {themHim} to teach you the shield, too",
            r: "{They} blinks, then grins. You spend a month learning why {theyHe} is still alive.",
            fx: {skill:{shield:3},them:{type:"friend",op:25}},
          },
          {t:"Ignore {themHim}",r:"You keep practising. {They} keeps spitting.",fx:{them:{op:-5}}},
        ],
      },
      {
        id: "pf_dual_two_robbers",
        cond: (p,C)=>pro(p,C,"dualwield",60),
        w: .7,
        cool: 10,
        title: "Two of them",
        text: ()=>`On the road to {town}, two men step out of ${A.pick(["the hedge","the ruined toll-house","the birch wood","a dry ditch"])}, one on each side. Clubs and a rusty sword. "Toll."`,
        choices: [
          {
            t: "Draw both blades",
            check: {s:"dualwield",s2:"spd",d:52},
            win: {
              r: "One blade for each of them. It is over very fast. They run, leaving the rusty sword behind.",
              fx: {skill:{dualwield:2},fame:2,coin:2,epithet:"Two-Blades"},
            },
            lose: {
              r: "You take one down. The other's club takes you across the back of the head.",
              fx: {wound:"concussion",health:-14,coinPct:-.2,wil:1.5,cause:"robbers on the road"},
            },
          },
          {
            t: "Fight it out",
            r: "You step to the middle of the road.",
            fx: {
              duel: {
                tier: 3,
                title: "road robbers",
                opts: {kind:"duel",lethal:!0,toYield:!0,place:"the road",title:"Two of them"},
              },
            },
          },
          {
            t: "Pay the toll (5 suns)",
            r: "Five suns. They bow, mockingly. You remember their faces.",
            fx: {coin:-5,wil:.5},
          },
        ],
      },
      {
        id: "pf_shield_pot_lid",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)<13,
        once: !0,
        w: .4,
        title: "Holding the bridge",
        text: ()=>`A stone war between your lane and the ${A.pick(["tanners'","millers'","fishers'","smiths'"])} children. You hold the little footbridge with a pot lid, and the stones start flying.`,
        choices: [
          {
            t: "Hold the bridge",
            check: {s:"sta",s2:"wil",d:20},
            win: {
              r: "Stone after stone rings off the lid. You never step back. The bridge is yours, and they talk about it until winter.",
              fx: {apt:{shield:1.25},skill:{shield:2},wil:.5,happy:4},
            },
            lose: {r:"A stone over the rim. A cut eyebrow and a lot of blood.",fx:{health:-4,skill:{shield:1},wil:1}},
          },
          {
            t: "Throw stones back instead",
            check: {s:"str",s2:"ins",d:20},
            win: {r:"You hit the other side's leader on the shin. Glory.",fx:{skill:{throwing:2},happy:3}},
            lose: {r:"You hit your own side's leader on the head. Disgrace.",fx:{happy:-2}},
          },
          {
            t: "Bring a grown-up",
            r: "{mother} breaks up the war, and you are a traitor to the lane for a week.",
            fx: {happy:-2},
          },
        ],
      },
      {
        id: "pf_shield_muster",
        cond: (p,C)=>C.adult(p)&&!C.old(p)&&!C.soldier(p)&&(C.prof(p,"shield",25)||C.stat(p,"sta")>=45),
        w: .6,
        cool: 10,
        title: "The front rank",
        text: 'The muster at {home}, and the old sergeant walks along the line looking for shoulders. He stops at you. "Front rank. Shield up, hold the one next to you, do not step back."',
        choices: [
          {
            t: "Hold the line all afternoon",
            check: {s:"shield",s2:"sta",d:42},
            win: {
              r: "They push, you hold. The second rank leans on your back like a wall. The sergeant nods once, which is a lot from him.",
              fx: {skill:{shield:3},sta:.5,str:.3,fame:1},
            },
            lose: {r:"A shove knocks you flat and three people walk over you.",fx:{health:-5,skill:{shield:1},wil:1}},
          },
          {
            t: "Ask to be put in the back",
            r: "He snorts, and puts you behind a broad-shouldered smith.",
            fx: {skill:{shield:1}},
          },
          {
            t: "Teach your neighbors to lock rims",
            req: (p,C)=>C.prof(p,"shield",40),
            r: "You show them how the rims overlap. By evening your half of the line is the only half still standing.",
            fx: {skill:{shield:2,command:2},fame:1},
          },
        ],
      },
      {
        id: "pf_shield_gap",
        cond: (p,C)=>pro(p,C,"shield",45),
        w: .8,
        cool: 10,
        title: "The gap",
        text: ()=>`${A.pick(["A drunken mob from the fair","A band of deserters","Cattle raiders from the next valley"])} comes up the lane toward {home}. Between two stone walls there is a gap one body wide. Behind you, the women and children are getting out the far side.`,
        choices: [
          {
            t: "Stand in the gap with your shield",
            check: {s:"shield",s2:"str",d:55},
            win: {
              r: "You hold the gap until the last cart is out. Nobody gets past you. The story grows every time someone tells it.",
              fx: {fame:4,honor:5,skill:{shield:3},wil:1.5,epithet:"the Gate"},
            },
            lose: {
              r: "You hold long enough. Then a club finds your ribs and you go down under boots.",
              fx: {wound:"broken_ribs",health:-18,honor:4,fame:2,wil:2,cause:"a beating in the gap"},
            },
          },
          {
            t: "Hold it with two others, and shout orders",
            check: {s:"command",s2:"shield",d:48},
            win: {
              r: "Three shields, one wall. They break off and go looking for easier work.",
              fx: {fame:2,skill:{command:2,shield:2},honor:3},
            },
            lose: {
              r: "One of your two runs. The other is hurt. You get out with him on your back.",
              fx: {health:-8,honor:2,wil:1,cause:"a fight in a lane"},
            },
          },
          {t:"Run with the others",r:"You run. Behind you, someone's barn burns.",fx:{honor:-2,happy:-3}},
        ],
      },
      {
        id: "pf_shield_yard",
        cond: (p,C)=>C.adult(p)&&C.ageAdj(p)<35&&(C.prof(p,"shield",30)||C.soldier(p)),
        w: .5,
        once: !0,
        setup: (p,ctx)=>{school(p,ctx,/shield|wall/i,"the shield yard"),ctx.inst=nm(p)},
        title: "Two at once",
        text: "{school} in {splace} has one test, and {inst}, who trained there, runs it in your town: hold a shield while two fighters with staves try to get past it. Do not step back. Do not go to them. Let them come to you.",
        choices: [
          {
            t: "Take the test",
            check: {s:"shield",s2:"wil",d:48},
            win: {
              r: "They come, they tire, they stop. You have not moved a foot. {inst} offers to finish what the test began.",
              fx: {skill:{shield:4},sta:.5,wil:1,newRel:{type:"mentor",op:30}},
            },
            lose: {
              r: 'You step forward to hit back, the way you always do. A staff cracks your knee. "That," says {inst}, "is the lesson."',
              fx: {skill:{shield:2},health:-6,wil:1},
            },
          },
          {
            t: "Watch and learn",
            r: "You watch three fail and one pass. The difference is patience.",
            fx: {skill:{shield:1},wil:.5},
          },
        ],
      },
      {
        id: "pf_shield_split",
        cond: (p,C)=>pro(p,C,"shield",35)&&C.gear(p,"shield"),
        w: .6,
        cool: 8,
        title: "The split board",
        text: "Your shield has taken its last blow. The linden boards are split along the grain and the rim hangs loose. A shield is the most underrated thing a fighter owns, and you feel naked without it.",
        choices: [
          {
            t: "Buy a heater shield (5 suns)",
            req: p=>p.coin>=5,
            r: "A good heater, faced in leather, rim nailed tight. It sits on your arm as if it grew there.",
            fx: {coin:-5,gear:{shield:"heater"}},
          },
          {
            t: "Buy a tall pavise for holding a line (8 suns)",
            req: p=>p.coin>=8,
            r: "Heavy, ugly, and nothing comes through it.",
            fx: {coin:-8,gear:{shield:"tower"}},
          },
          {
            t: "Rebuild it yourself",
            check: {s:"craft",s2:"shield",d:40},
            win: {r:"New boards, new glue, the old boss. It is better than it was.",fx:{skill:{craft:2},happy:2}},
            lose: {r:"It looks like a shield. It does not act like one. You carry it anyway.",fx:{skill:{craft:1}}},
          },
        ],
      },
      {
        id: "pf_unarmed_harvest_ring",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=8,
        once: !0,
        w: .5,
        title: "The children's ring",
        setup: (p,ctx)=>{ctx.champ=nm(p)},
        text: "After the harvest the grown-ups wrestle in a ring of straw, and then the children get their turn. {champ} has thrown everyone your age. Now it is you.",
        choices: [
          {
            t: "Go low and hook a leg",
            check: {s:"str",s2:"ins",d:22},
            win: {
              r: "{champ} goes over your hip and lands flat on the straw. The grown-ups cheer as loud as for their own bouts.",
              fx: {apt:{unarmed:1.25},skill:{unarmed:3},str:.4,happy:4},
            },
            lose: {
              r: "You end up face-down in the straw with {champ} sitting on you. Everyone laughs, including you, eventually.",
              fx: {skill:{unarmed:1},wil:.5},
            },
          },
          {
            t: "Let {champ} tire first, then push",
            check: {s:"sta",s2:"wil",d:22},
            win: {
              r: "You give ground, give ground, and then shove. Down {champ} goes.",
              fx: {skill:{unarmed:2},sta:.3,happy:3},
            },
            lose: {r:"You tire first. Lesson learned.",fx:{skill:{unarmed:1}}},
          },
          {t:"Refuse to wrestle",r:'"Scared," says {champ}. You eat your harvest cake alone.',fx:{happy:-2}},
        ],
      },
      {
        id: "pf_unarmed_feast_wrestle",
        cond: (p,C)=>pro(p,C,"unarmed",35)&&!C.old(p),
        w: 1,
        setup: (p,ctx)=>{ctx.where=inR(p,"POL-11")?"the Horse Feast at the Drum Stones":inR(p,"POL-34")?"the Horse Feast at Grakmar":inR(p,"POL-12")?"the kurultai, standing, in hide jackets, a throw ends it":inR(p,"POL-08","POL-09","POL-23")?"the Thing, between the stone-throw and the feast":"the fair on the green at {festival}".replace("{festival}",A.pick(GD.FESTIVALS)[0]),who(p,ctx,"rival")},
        title: "The wrestling ring",
        text: "Wrestling at {where}. Your draw in the third round is {themFull}, built like a door and with a grin that says {theyHe} has seen your bouts.",
        choices: [
          {
            t: "Wrestle for the prize",
            check: {s:"unarmed",s2:"str",d:52},
            win: {
              r: "A hip throw and {theyHe} is on the ground. Two more rounds and the prize is yours: a fat sheep and a purse of 12 suns.",
              fx: {coin:12,fame:3,skill:{unarmed:3},happy:5,them:{type:"rival",op:-5}},
            },
            lose: {
              r: "{They} lifts you clean off the ground and drops you like a sack. Your shoulder is never quite right again.",
              fx: {health:-8,wound:"back",wil:1.5,them:{type:"rival",op:5},cause:"a wrestling fall"},
            },
          },
          {
            t: "Read {themHim} and use {theirHis} own weight",
            check: {s:"unarmed",s2:"int",d:50},
            win: {
              r: "{They} rushes. You turn. Physics does the rest. The crowd learns your name.",
              fx: {coin:12,fame:2,skill:{unarmed:2},int:.3},
            },
            lose: {r:"{They} does not rush. {They} just leans until you fold.",fx:{health:-5,skill:{unarmed:1}}},
          },
          {
            t: "Bet on yourself and lose on purpose",
            req: (p,C)=>C.prof(p,"gambling",25)||C.trait(p,"greedy"),
            r: "You bet heavy on {themHim} and go down in the first exchange. It pays. Nobody who watched believes it.",
            fx: {coin:25,honor:-6,fame:-1},
          },
        ],
      },
      {
        id: "pf_unarmed_paid_to_lose",
        cond: (p,C)=>pro(p,C,"unarmed",50)&&C.fame(p)>=3,
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{ctx.elder=nm(p,"M"),ctx.sum=A.pick([40,60,80])},
        title: "The price of a fall",
        text: `{elder}, who speaks for a rich family, visits your tent the night before the final. "The boy you wrestle tomorrow is my sister's grandson. {sum} suns, and you fall on the second hold." Durk Ironarms took the same kind of money in 1102, and the steppe has not forgotten it.`,
        choices: [
          {
            t: "Take the money",
            r: (p,ctx)=>`You fall on the second hold. It is a good fall. You are ${ctx.sum} suns richer and a little smaller inside.`,
            fx: (p,ctx)=>A.applyFx(p,{coin:ctx.sum,honor:-8,flag:"pf_threw_bout"},ctx),
          },
          {
            t: "Refuse, and throw the boy hard",
            check: {s:"unarmed",s2:"str",d:50},
            win: {
              r: "You throw the boy so hard the drums stop. {elder}'s family will remember your name, and not kindly.",
              fx: {fame:4,honor:4,coin:15,newRel:{type:"enemy",op:-40}},
            },
            lose: {
              r: "The boy is better than his grandmother's brother thought. You lose fairly, and nobody believes it.",
              fx: {fame:-1,honor:2,wil:1},
            },
          },
          {
            t: "Tell the judges",
            check: {s:"persuasion",s2:"wil",d:50},
            win: {
              r: "The judges bar {elder} from the ground. The crowd chants your name before you have even wrestled.",
              fx: {fame:3,honor:6,newRel:{type:"enemy",op:-50}},
            },
            lose: {
              r: "The judges drink with {elder}'s family. You are drawn against their strongest man instead.",
              fx: {health:-10,honor:3,wil:1.5,cause:"a rigged bout"},
            },
          },
        ],
      },
      {
        id: "pf_unarmed_still_hands",
        cond: (p,C)=>C.adult(p)&&!C.old(p)&&(C.prof(p,"unarmed",35)||C.realm(p,"POL-27")&&C.prof(p,"faith",20)),
        w: .6,
        once: !0,
        setup: (p,ctx)=>{school(p,ctx,/hold|throw|wrestl|staff/i,"the Hall of Still Hands"),ctx.monk=nm(p)},
        title: "Still hands",
        text: "A monk called {monk} is walking the roads, begging bread. A drunk swings at {monk} with a cudgel. Without hurry, the monk takes the cudgel, puts the man on the ground and helps him up again. Later {monk} tells you it was learned at {school}: stopping a man without killing him.",
        choices: [
          {
            t: "Beg to be taught",
            check: {s:"wil",s2:"unarmed",d:45},
            win: {
              r: "{monk} walks with you for a month. Throws, holds, and the hardest part: staying calm while someone tries to kill you.",
              fx: {skill:{unarmed:4},wil:1.5,trait:"calm",newRel:{type:"mentor",op:30}},
            },
            lose: {
              r: '{monk} teaches you one hold, then smiles. "You are still too angry. Come back when you are not."',
              fx: {skill:{unarmed:2},wil:.5},
            },
          },
          {
            t: "Give {monk} bread and a bed",
            r: "{monk} blesses your hearth in a tongue you do not know and leaves before dawn.",
            fx: {piety:2,happy:2},
          },
          {
            t: "Test the monk yourself",
            check: {s:"unarmed",s2:"str",d:65},
            win: {
              r: "You get a grip on {monk} for one whole heartbeat. {monk} looks delighted.",
              fx: {skill:{unarmed:3},fame:1},
            },
            lose: {
              r: "You are on the ground. You do not remember getting there.",
              fx: {skill:{unarmed:2},wil:1,happy:-1},
            },
          },
        ],
      },
      {
        id: "pf_unarmed_alehouse",
        cond: (p,C)=>pro(p,C,"unarmed",40)||C.adult(p)&&C.race(p,"giant","halforc")&&C.stat(p,"str")>=50,
        w: .7,
        cool: 8,
        setup: (p,ctx)=>{ctx.keep=nm(p)},
        title: "Keeping the peace",
        text: '{keep}, who keeps the alehouse in {home}, has had three fights this month and a broken window. "A sun a night, and all you can drink after closing, to stand by the door and look big."',
        choices: [
          {
            t: "Take the work for a season",
            check: {s:"unarmed",s2:"wil",d:45},
            win: {
              r: "You throw out a dozen drunks and break nobody's bones. {keep} pays you well and the street grows quiet.",
              fx: {coin:40,skill:{unarmed:3,intimidation:2},newRel:{type:"friend",op:20}},
            },
            lose: {
              r: "A sailor with a bottle teaches you that one man at a door is not enough.",
              fx: {coin:25,health:-10,wound:"broken_nose",wil:1,cause:"a bottle in an alehouse"},
            },
          },
          {
            t: "Take it, and break a few heads to make a name",
            r: "Your name gets around quickly. So does the fear. Nobody brawls at {keep}'s any more.",
            fx: {coin:40,skill:{intimidation:3},honor:-2,fame:1},
          },
          {t:"Decline",r:"{keep} hires a half-orc dock hand instead. The window stays mended.",fx:{}},
        ],
      },
      {
        id: "pf_unarmed_feud_bout",
        cond: (p,C)=>pro(p,C,"unarmed",50)&&(C.terr(p,"steppe")||C.race(p,"orc","halforc")),
        w: .8,
        cool: 12,
        setup: (p,ctx)=>{ctx.kin=nm(p,"M")},
        title: "One bout ends it",
        text: "A feud over stolen horses has run two winters between your kin and {kin}'s. Both sides are tired of burying people. The elders agree to the old way: one wrestler each, one bout, and the feud ends whatever happens. They choose you.",
        choices: [
          {
            t: "Wrestle for your kin",
            check: {s:"unarmed",s2:"sta",d:55},
            win: {
              r: "You throw their champion at the hour of noon. The horses come back, and the feud ends with a feast.",
              fx: {
                fame: 4,
                honor: 5,
                skill: {unarmed:3},
                rel: {who:"father",op:15},
                deed: "won a feud-ending bout for the kin",
              },
            },
            lose: {
              r: "You lose. The feud ends anyway, as agreed, and the horses stay where they are. Nobody says a word to you, which is worse than shouting.",
              fx: {happy:-8,wil:2.5,honor:3},
            },
          },
          {
            t: "Win it with a trick at the start",
            check: {s:"unarmed",s2:"deception",d:48},
            win: {
              r: "A feint at the head, a sweep at the ankle. It is over before the drums finish. Some elders frown at how you did it.",
              fx: {fame:2,honor:-1,skill:{unarmed:2}},
            },
            lose: {
              r: "Their champion has seen that trick before. You land on your back.",
              fx: {happy:-6,wil:2,health:-4},
            },
          },
          {
            t: "Refuse: let a younger cousin win glory",
            r: "Your cousin wrestles. You do not watch. They lose, and some say it would not have happened if you had wrestled.",
            fx: {honor:-2,happy:-4},
          },
        ],
      },
      {
        id: "pf_lance_quintain",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=8&&(["gentry","noble","royal"].includes(p.status)||C.famKind(p,"horse","gentry_mil","noble")),
        once: !0,
        w: .6,
        title: "The quintain",
        text: "The squires run at the quintain in the yard: a post with a turning arm, a shield on one end and a sandbag on the other. Hit the shield square or the sandbag swings round and hits you. They let you try on a pony with a broom handle.",
        choices: [
          {
            t: "Ride hard and hit it square",
            check: {s:"ins",s2:"riding",d:22},
            win: {
              r: "Crack, and the arm spins. You are past before the sandbag comes round. The master of horse writes your name on his slate.",
              fx: {apt:{lance:1.3},skill:{lance:3,riding:1},happy:4},
            },
            lose: {
              r: "The sandbag catches you in the back and you leave the pony in a heap.",
              fx: {health:-4,skill:{lance:1},wil:1},
            },
          },
          {
            t: "Go slow and aim carefully",
            r: "Too slow: the sandbag misses you, but the arm hardly moves. The squires snigger. You learn something anyway.",
            fx: {skill:{lance:1,riding:1}},
          },
          {
            t: "Watch the squires instead",
            r: "You watch them fall off and decide to be smarter than that.",
            fx: {int:.2},
          },
        ],
      },
      {
        id: "pf_lance_tilt",
        cond: (p,C)=>pro(p,C,"lance",35)&&(C.mounted(p)||C.noble(p))&&!C.old(p),
        w: 1,
        cool: 5,
        setup: (p,ctx)=>{who(p,ctx,"rival"),ctx.yard=p.realm==="POL-01"?"the Lance Yard of Kingsmere":p.realm==="POL-03"?"the Hall of the Lion in Varenna":p.realm==="POL-31"?"the Calossa Lance Yard":"the lists below the castle at {capital}".replace("{capital}",(A.realm(p.realm)||{}).capital||"the capital")},
        title: "The lance runs",
        text: "Feast-day lance runs at {yard}. Blunted lances, three passes, a herald counting broken lances and riders unhorsed. Your draw is {themFull}, whose colors the crowd is already waving.",
        choices: [
          {
            t: "Ride straight and trust the first shock",
            check: {s:"lance",s2:"riding",d:55},
            win: {
              r: "Your lance takes {themHim} on the shield's center and {theyHe} goes over the horse's tail. The herald shouts your name three times.",
              fx: {fame:4,coin:25,skill:{lance:3},happy:6,them:{type:"rival",op:-10}},
            },
            lose: {
              r: "{Their} lance finds your helm. You wake on the grass with the sky turning slowly.",
              fx: {wound:"concussion",health:-12,wil:1.5,cause:"a lance in the lists"},
            },
          },
          {
            t: "Ride for broken lances, not falls",
            check: {s:"lance",s2:"ins",d:45},
            win: {
              r: "Three passes, three broken lances, never a fall. Not glorious, but you win on points.",
              fx: {fame:2,coin:10,skill:{lance:2}},
            },
            lose: {
              r: "Two broken lances to {theirHis} three. Close, and not close enough.",
              fx: {skill:{lance:1},happy:-2},
            },
          },
          {
            t: "Withdraw, claiming a lame horse",
            r: "Your horse is perfectly sound, and everyone can see it.",
            fx: {fame:-2,honor:-2},
          },
        ],
      },
      {
        id: "pf_lance_ransom",
        cond: (p,C)=>pro(p,C,"lance",50),
        w: .7,
        cool: 10,
        setup: (p,ctx)=>{who(p,ctx,"acquaint")},
        title: "Horse and harness",
        text: "By the old custom of the lists, you have won the horse and the mail of {themFull}, the knight you unhorsed. {They} stands before you, bruised, holding the reins. A war horse is worth more than most farms.",
        choices: [
          {
            t: "Take the horse",
            r: "You take the horse. {They} walks home. Custom is custom, and it is a fine animal.",
            fx: {gear:{mount:"destrier"},them:{type:"enemy",op:-20},fame:1},
          },
          {
            t: "Let {themHim} buy them back (100 suns)",
            r: "{They} pays without arguing. The money is good, and you have not made an enemy.",
            fx: {coin:100,them:{op:5}},
          },
          {
            t: "Give it all back, with a bow",
            r: "The crowd sees it. So does every knight there. Courtesy makes a name as quickly as a lance.",
            fx: {honor:6,fame:2,them:{type:"friend",op:30}},
          },
        ],
      },
      {
        id: "pf_lance_squire",
        cond: (p,C)=>pro(p,C,"lance",45)&&(C.noble(p)||p.status==="gentry"||C.fame(p)>=10),
        w: .7,
        cool: 10,
        setup: (p,ctx)=>{who(p,ctx,"friend")},
        title: "A squire's plea",
        text: '{themFull}, a gentry son of fourteen, kneels in the mud by your horse. "Take me as your squire. I will clean the mail, feed the horse, carry the lances. I want to learn to ride as you do."',
        choices: [
          {
            t: "Take {themHim} on",
            r: "You get a squire, and with that a second pair of hands and a mouth to feed. {They} worships you, which is a weight of its own.",
            fx: {them:{type:"friend",op:35},coin:-10,happy:3,skill:{command:1}},
          },
          {
            t: "Make {themHim} ride the quintain first",
            check: {s:"lance",s2:"int",d:40},
            win: {
              r: "You see {theirHis} faults in one pass and correct them in three. {They} rides better at once. You take {themHim} on.",
              fx: {them:{type:"friend",op:30},skill:{lance:1}},
            },
            lose: {
              r: "{They} falls off twice. You are a poor judge of where to begin. You send {themHim} home.",
              fx: {them:{op:-10}},
            },
          },
          {
            t: "Send {themHim} home to {theirHis} mother",
            r: "{They} goes, red-eyed. Someone else will have a squire.",
            fx: {them:{op:-15}},
          },
        ],
      },
      {
        id: "pf_lance_inside_rim",
        cond: (p,C)=>pro(p,C,"lance",65),
        w: .6,
        once: !0,
        title: "Inside the rim",
        text: "Every lance-man has heard the story: a linden shield turns a lance, unless you lay the point just inside the rim along the grain, the way Roland Ashby of Kingsmere does. Nobody you know can do it. You start to wonder if you can.",
        choices: [
          {
            t: "Spend a season at the quintain chasing it",
            check: {s:"lance",s2:"int",d:60},
            win: {
              r: "On the forty-first day the shield on the quintain splits along the grain. You have it. The next time you ride in the lists, they will not know why their shields fail.",
              fx: {skill:{lance:5},fame:2,flag:"pf_rim_trick"},
            },
            lose: {
              r: "A season of splintered lances and a sore shoulder. You are better than you were, but you do not have it.",
              fx: {skill:{lance:3},wound:"back",wil:1},
            },
          },
          {
            t: "Pay a Kingsmere man to explain it (40 suns)",
            req: p=>p.coin>=40,
            r: "He explains it over three cups. Knowing is half the work. The other half takes your arm a year.",
            fx: {coin:-40,skill:{lance:3},int:.3},
          },
          {t:"Stories are stories",r:"You keep doing what works.",fx:{}},
        ],
      },
      {
        id: "pf_mounted_stakes",
        cond: (p,C)=>C.adult(p)&&!C.old(p)&&(C.prof(p,"mounted",20)||C.prof(p,"riding",40)),
        w: .6,
        cool: 10,
        setup: (p,ctx)=>{ctx.inst=nm(p),ctx.yard=school(p,ctx,/horse|riding|camel|gallop|saddle/i,"the riding yard")?ctx.school:"the riding yard"},
        title: "Stakes at the gallop",
        text: "{inst}, who learned at {school}, has a row of willow stakes on the common, each with a turnip on top. Gallop the line and cut every turnip. Half the young riders of {home} have tried. Most kept their horse.",
        choices: [
          {
            t: "Ride the line full tilt",
            check: {s:"mounted",s2:"riding",d:48},
            win: {
              r: "Eight stakes, eight turnips, and the horse never breaks stride. {inst} offers to teach you the rest.",
              fx: {skill:{mounted:4,riding:1},fame:1,newRel:{type:"mentor",op:25}},
            },
            lose: {
              r: "Third stake, you lean too far and meet the ground at a gallop.",
              fx: {health:-10,wound:"back",skill:{mounted:1},wil:1,cause:"a fall from a horse"},
            },
          },
          {
            t: "Learn at a trot first",
            r: "Slow, slow, then faster. By autumn you can cut at a canter without losing your seat.",
            fx: {skill:{mounted:3,riding:1}},
          },
          {t:"Watch others break their necks",r:"Two riders fall. You go home with all your bones.",fx:{}},
        ],
      },
      {
        id: "pf_mounted_raiders",
        cond: (p,C)=>pro(p,C,"mounted",40)&&C.mounted(p),
        w: .9,
        cool: 8,
        title: "Ride them down",
        text: ()=>`Shouts from the pasture: ${A.pick(["three riders","four riders","a handful of riders"])} are running off ${A.pick(["the village horses","a herd of cattle","your neighbor's mares"])} toward the ford. The village has one horse fit to chase them, and it is yours.`,
        choices: [
          {
            t: "Ride them down alone",
            check: {s:"mounted",s2:"riding",d:52},
            win: {
              r: "You catch the last one at the ford and knock him out of the saddle. The others drop the herd and run. The village owes you.",
              fx: {fame:3,honor:3,skill:{mounted:3},coin:10},
            },
            lose: {
              r: "They turn on you at the ford. You get away with a cut leg and no cattle.",
              fx: {health:-12,wound:"deep_cut",wil:1,cause:"raiders at the ford"},
            },
          },
          {
            t: "Catch the last one and fight",
            r: "You spur after them.",
            fx: {
              duel: {
                tier: 2,
                title: "a cattle raider",
                opts: {kind:"duel",lethal:!0,toYield:!0,place:"the ford",title:"At the ford"},
              },
            },
          },
          {
            t: "Shadow them back to their camp",
            check: {s:"tracking",s2:"riding",d:45},
            win: {
              r: "You find their camp and bring back the reeve's men. Every head of stock comes home.",
              fx: {fame:2,skill:{tracking:2},honor:2},
            },
            lose: {r:"You lose them in the hills.",fx:{happy:-3}},
          },
        ],
      },
      {
        id: "pf_mounted_backward_shot",
        cond: (p,C)=>pro(p,C,"mounted",45)&&C.prof(p,"bow",30),
        w: .7,
        once: !0,
        title: "The backward shot",
        text: p=>`${p.realm==="POL-12"?"Every rider of the Nine Winds learns it at Kharsa Arrow Field, in memory of Toghan Swift-Arrow, who shot 27 of 27 in 431, nine of them backward.":"A horse-trader from the Nine Winds shows it off for coppers at the fair: galloping away, turning in the saddle, an arrow back over the horse's tail into a straw target."} You want to learn it.`,
        choices: [
          {
            t: "Practise until you have it",
            check: {s:"mounted",s2:"bow",d:58},
            win: {
              r: "Weeks of misses, and then one evening the arrow goes back over the tail and into the straw. Then again. Then always.",
              fx: {skill:{mounted:3,bow:3},fame:2,ins:.5,flag:"pf_backward_shot"},
            },
            lose: {
              r: "You turn too far, the horse feels it and swerves, and you are on the ground with a sprained wrist.",
              fx: {health:-6,skill:{mounted:1,bow:1},wil:1,cause:"a fall from a horse"},
            },
          },
          {
            t: "Pay the rider to coach you (10 suns)",
            req: p=>p.coin>=10,
            r: "He shows you it is all in the knees and the breath. You learn half of it.",
            fx: {coin:-10,skill:{mounted:2,bow:2}},
          },
          {t:"It is a trick for show",r:"Maybe. It is a trick that won the steppe, though.",fx:{}},
        ],
      },
      {
        id: "pf_mounted_balking",
        cond: (p,C)=>pro(p,C,"mounted",35)&&C.mounted(p),
        w: .7,
        cool: 10,
        title: "The horse that balks",
        text: ()=>`Your horse has started to shy at ${A.pick(["the smell of blood","clashing steel","drums","camels","fire"])}. In a fight, a horse that shies is a horse that throws you into the enemy's arms.`,
        choices: [
          {
            t: "Work it through, day after day",
            check: {s:"riding",s2:"wil",d:45},
            win: {
              r: "A month of patience and the horse learns to trust you more than it fears the noise.",
              fx: {skill:{riding:2,mounted:2},wil:1},
            },
            lose: {
              r: "The horse throws you into a fence on the twentieth day.",
              fx: {health:-8,skill:{riding:1},wil:1,cause:"a fall from a horse"},
            },
          },
          {
            t: "Sell it and buy a steadier horse (net 15 suns)",
            req: p=>p.coin>=15,
            r: "You lose money and an old friend. The new horse does not flinch at anything.",
            fx: {coin:-15,gear:{mount:"horse"}},
          },
          {
            t: "Ask an old horse-wise herder",
            req: (p,C)=>C.prof(p,"husbandry",25)||C.terr(p,"steppe"),
            r: "She blows into the horse's nose, says a word you do not catch, and tells you to stop being afraid yourself. It works.",
            fx: {skill:{riding:2,husbandry:1}},
          },
        ],
      },
      {
        id: "pf_bow_butts",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=7&&(C.realm(p,"POL-05","POL-07","POL-06","POL-12","POL-18")||C.famKind(p,"hunt","horse")||C.race(p,"elf","halfelf")||C.terr(p,"forest")),
        once: !0,
        w: .7,
        title: "First arrows",
        text: p=>p.realm==="POL-05"?"Under the Butts Law every free boy from seven shoots at the village butts on Sunday. The constable puts a bow as tall as you into your hands and points at the straw target.":p.race==="elf"?"Every elf child learns the bow at home, but your aunt has been watching you lately with a strange look. Today she gives you a bow of your own.":"A hunter at {home} lets the children shoot his old bow at a sack of straw for a penny a turn.",
        choices: [
          {
            t: "Draw to the ear and loose",
            check: {s:"ins",s2:"str",d:22},
            win: {
              r: "Thock. Dead center. Then again. The grown-ups stop talking and look over.",
              fx: {apt:{bow:1.35},skill:{bow:3},happy:4},
            },
            lose: {
              r: "The string slaps your forearm raw and the arrow goes into the hedge.",
              fx: {skill:{bow:1},health:-1},
            },
          },
          {
            t: "Ask how to stand first",
            r: "Feet, hips, breathing. You shoot slowly and well.",
            fx: {skill:{bow:2},int:.2},
          },
          {t:"Hang back with the smaller children",r:"Next Sunday, maybe.",fx:{}},
        ],
      },
      {
        id: "pf_bow_silver_arrow",
        cond: (p,C)=>pro(p,C,"bow",45),
        w: 1,
        cool: 4,
        setup: (p,ctx)=>{who(p,ctx,"rival"),ctx.contest=p.realm==="POL-05"?"the silver arrow at the King's Butts on Return Day, the best archers of Ashmere at two hundred paces":p.realm==="POL-12"?"the arrow field at the kurultai, shooting from the gallop":"the fair's archery match at {festival}: a hundred paces, then two hundred, then the wand".replace("{festival}",A.pick(GD.FESTIVALS)[0])},
        title: "The butts",
        text: "You have made the last round of {contest}. Only {themFull} is left beside you, and {theyHe} has not missed all day.",
        choices: [
          {
            t: "Shoot for the center, all or nothing",
            check: {s:"bow",s2:"ins",d:58},
            win: {
              r: "Your last arrow splits the peg. The crowd goes wild and the prize is yours.",
              fx: {
                fame: 5,
                coin: 20,
                skill: {bow:3},
                happy: 6,
                them: {type:"rival",op:-10},
                deed: "won the archery at the butts",
              },
            },
            lose: {
              r: "A gust takes your last arrow a hand wide. {They} wins. {They} shakes your hand, and means it.",
              fx: {fame:1,skill:{bow:2},happy:-3,them:{type:"rival",op:10}},
            },
          },
          {
            t: "Read the wind and wait for a lull",
            check: {s:"bow",s2:"int",d:52},
            win: {
              r: "You wait so long the crowd jeers. Then the flags drop, and you loose. Center.",
              fx: {fame:4,coin:20,skill:{bow:2},int:.3},
            },
            lose: {r:"The lull never comes. You loose into the gust anyway and lose.",fx:{skill:{bow:1},happy:-2}},
          },
          {
            t: "Nick {theirHis} bowstring when nobody is looking",
            req: (p,C)=>C.prof(p,"stealth",30)||C.trait(p,"deceitful"),
            check: {s:"stealth",s2:"deception",d:50},
            win: {
              r: "{Their} string snaps on the draw. You win. You do not enjoy the silver as much as you thought you would.",
              fx: {coin:20,fame:2,honor:-8},
            },
            lose: {
              r: "{They} catches your hand on {theirHis} bow. The judges throw you out of the butts for a year.",
              fx: {honor:-10,fame:-3,them:{type:"enemy",op:-40}},
            },
          },
        ],
      },
      {
        id: "pf_bow_kings_deer",
        cond: (p,C)=>pro(p,C,"bow",30)&&!C.noble(p)&&C.terr(p,"forest","hills","plains"),
        w: .8,
        cool: 6,
        title: "The lord's deer",
        text: p=>`A hart stands in the clearing at dusk, sixty paces, broadside. This is ${p.realm==="POL-05"?"royal forest, and Ashmere hangs poachers":"the lord's chase, and the forester's men walk it at dusk"}. Your family has not had meat since {festival}.`,
        choices: [
          {
            t: "Take the shot",
            check: {s:"bow",s2:"stealth",d:50},
            win: {
              r: "One arrow, behind the shoulder. You butcher it in the dark and nobody ever knows.",
              fx: {health:4,happy:5,skill:{bow:2,stealth:1},honor:-1},
            },
            lose: {
              r: "The arrow takes the hart in the haunch and it crashes off bellowing. The forester's horn sounds.",
              fx: {punish:"theft",honor:-2},
            },
          },
          {
            t: "Let it go",
            r: "It looks at you a long moment, then melts into the trees. Turnips again.",
            fx: {happy:-2,wil:.5},
          },
          {
            t: "Shoot a hare on common land instead",
            check: {s:"bow",s2:"ins",d:40},
            win: {r:"A hare at forty paces. Not a hart, but no one hangs for a hare.",fx:{health:2,skill:{bow:1}}},
            lose: {r:"The hare is faster than your arrow.",fx:{}},
          },
        ],
      },
      {
        id: "pf_bow_elf_eye",
        cond: (p,C)=>pro(p,C,"bow",40)&&!C.race(p,"elf"),
        w: .6,
        once: !0,
        setup: (p,ctx)=>{school(p,ctx,/arch|bow/i,"the starlight range"),ctx.elf=A.givenName(A.cultureFor&&A.cultureFor("elf","POL-07")||p.cult,"F")||"Ilvara"},
        title: "An elf at the butts",
        text: 'An elf in a grey cloak is resting at the butts, a bow across her knees. Her name is {elf}, and she trained at {school}. She watches you shoot ten arrows without a word. Then she says, "You are holding your breath at the wrong time."',
        choices: [
          {
            t: "Ask her to show you",
            r: "She stays three days. She changes how you breathe, how you anchor, how you see the target. You shoot better for the rest of your life.",
            fx: {skill:{bow:5},ins:.6,newRel:{type:"mentor",op:30}},
          },
          {
            t: "Challenge her to a match",
            check: {s:"bow",s2:"ins",d:70},
            win: {
              r: 'You match her arrow for arrow for six ends. She laughs, a rare sound. "Not bad, for a short-lived one."',
              fx: {fame:3,skill:{bow:3},newRel:{type:"friend",op:30}},
            },
            lose: {r:"She wins without seeming to try. Then she shows you why.",fx:{skill:{bow:3},wil:.5}},
          },
          {
            t: "Bristle and keep shooting your own way",
            r: "She shrugs and walks off into the trees. Your next arrow misses.",
            fx: {happy:-1},
          },
        ],
      },
      {
        id: "pf_bow_wolves",
        cond: (p,C)=>pro(p,C,"bow",35)&&(C.job(p,"herd")||C.job(p,"farm")||C.terr(p,"hills","steppe","tundra","mountains")),
        w: .8,
        cool: 8,
        title: "Wolves at the fold",
        text: "Dusk in winter. Wolves are working the edge of the fold, three of them, grey shapes against the snow. The dogs are going mad. One sheep is already down.",
        choices: [
          {
            t: "Shoot from the wall",
            check: {s:"bow",s2:"ins",d:48},
            win: {
              r: "Two arrows, two wolves down, and the third flees into the dark. You nail the pelts to the barn door.",
              fx: {skill:{bow:2},coin:6,fame:1,happy:3},
            },
            lose: {r:"The light is too poor. You lose four sheep before dawn.",fx:{coin:-12,happy:-4,wil:1}},
          },
          {
            t: "Go out among them with a torch and a spear",
            r: "You climb down into the fold.",
            fx: {beast:{id:"CRE-21",place:"the snowy fold",title:"Wolves at the fold"}},
          },
          {
            t: "Bar the door and wait for day",
            r: "You lose three sheep, but nobody loses a leg.",
            fx: {coin:-8,happy:-2},
          },
        ],
      },
      {
        id: "pf_xbow_popinjay",
        cond: (p,C)=>C.adult(p)&&!C.old(p)&&(C.prof(p,"xbow",20)||C.realm(p,"POL-26","POL-13","POL-02","POL-01","POL-29")),
        w: .6,
        cool: 6,
        setup: (p,ctx)=>{who(p,ctx,"rival")},
        title: "The wooden bird",
        text: 'The crossbow guild of {home} shoots at the popinjay: a painted wooden bird on a tall pole. Whoever brings it down is "king of the bird" for a year, drinks free at guild feasts and pays no watch-tax. {themFull} has been king two years running.',
        choices: [
          {
            t: "Shoot for the bird",
            check: {s:"xbow",s2:"ins",d:50},
            win: {
              r: "Your bolt takes the bird's head clean off. Free beer for a year, and {them} is not pleased.",
              fx: {fame:3,coin:10,skill:{xbow:3},happy:5,them:{type:"rival",op:-10}},
            },
            lose: {
              r: "Your bolt goes into the church roof. The guild fines you a sun for the slate.",
              fx: {coin:-1,skill:{xbow:1},happy:-2},
            },
          },
          {
            t: "Join the guild and learn properly (5 suns)",
            req: p=>p.coin>=5,
            r: "The guild teaches spanning, shooting, cleaning, and drinking. All four are useful.",
            fx: {coin:-5,skill:{xbow:4},newRel:{type:"friend",op:20}},
          },
          {t:"Watch and drink",r:"{them} wins again. The beer is good.",fx:{happy:2}},
        ],
      },
      {
        id: "pf_xbow_company",
        cond: (p,C)=>pro(p,C,"xbow",40)&&!C.soldier(p)&&!C.noble(p)&&!C.old(p),
        w: .7,
        once: !0,
        setup: (p,ctx)=>{ctx.cap=nm(p,"M"),ctx.co=A.pick(["Greycloak's Bolts","the Highcastle Company","the Reef Crossbows","the Stake Yard men"])},
        title: "Thirty-five a month",
        text: '{cap}, captain of {co}, is hiring in the market square. "Crossbowmen at thirty-five suns a month, ten more than a spearman. Bring your own bow, keep your own bolts, share in the plunder." He has seen you shoot.',
        choices: [
          {
            t: "Sign on",
            r: "You make your mark and follow the company's wagon out of town.",
            fx: {job:"mercenary",skill:{xbow:2},happy:2},
          },
          {
            t: "Ask for forty, since you are worth it",
            check: {s:"trade",s2:"xbow",d:50},
            win: {
              r: "{cap} stares at you for a long moment, then says forty. You sign on.",
              fx: {job:"mercenary",coin:15,skill:{trade:1}},
            },
            lose: {r:'"Thirty-five or nothing." You decline. Pride is cheap until you try to eat it.',fx:{happy:-2}},
          },
          {
            t: "Decline",
            r: "{cap} shrugs. There are always more men with crossbows than captains who pay.",
            fx: {},
          },
        ],
      },
      {
        id: "pf_xbow_crates",
        cond: (p,C)=>pro(p,C,"xbow",35)&&(C.coast(p)||C.town(p)),
        w: .6,
        cool: 12,
        setup: (p,ctx)=>{ctx.smug=nm(p,"M")},
        title: "Surplus bows",
        text: '{smug} has twenty crates of crossbows in a warehouse, surplus from an arsenal yard, "surplus" being the important word. He needs someone who knows crossbows to test them before he sells them on down the river to the Reef. Ten suns for an afternoon.',
        choices: [
          {
            t: "Test them, take the coin",
            r: "Sixteen good, four with cracked prods. You take the ten suns and try not to think where they end up.",
            fx: {coin:10,skill:{xbow:1},honor:-2,flag:"pf_smuggler_contact"},
          },
          {
            t: "Report the warehouse to the watch",
            check: {s:"intrigue",s2:"wil",d:45},
            win: {
              r: "The watch takes the crates and you get a reward of eight suns. {smug} never learns who talked.",
              fx: {coin:8,honor:3},
            },
            lose: {
              r: "The watch-captain is on {smug}'s payroll. Now {smug} knows exactly who talked.",
              fx: {newRel:{type:"enemy",op:-40},honor:2},
            },
          },
          {
            t: "Steal one for yourself",
            check: {s:"stealth",s2:"xbow",d:45},
            win: {r:"The best one of the lot goes home under your cloak.",fx:{gear:{ranged:"xbow"},honor:-3}},
            lose: {
              r: "{smug}'s man catches you at the door. His fist leaves an impression.",
              fx: {health:-8,wound:"broken_nose",cause:"a smuggler's fist"},
            },
          },
          {t:"Walk away",r:"You know nothing. That is the safest thing to know.",fx:{}},
        ],
      },
      {
        id: "pf_xbow_night_wall",
        cond: (p,C)=>pro(p,C,"xbow",45)&&(C.town(p)||C.soldier(p)),
        w: .8,
        cool: 10,
        title: "A ladder in the dark",
        text: "Your turn on the town wall, a crossbow on the parapet. Below, in the dark, you hear wood scraping stone: a ladder. Whoever is coming up it does not want to be greeted.",
        choices: [
          {
            t: "Wait for the head to appear, and shoot",
            check: {s:"xbow",s2:"wil",d:50},
            win: {
              r: "One bolt, at arm's length. The ladder clatters down. The rest run. In the morning the town council wants to know your name.",
              fx: {fame:3,honor:2,skill:{xbow:2},coin:10,favor:3},
            },
            lose: {
              r: "You shoot early and miss. The man comes over the wall swinging.",
              fx: {
                duel: {
                  tier: 2,
                  title: "a man coming over the wall",
                  opts: {kind:"duel",lethal:!0,toYield:!1,place:"the town wall",title:"Over the wall"},
                },
              },
            },
          },
          {
            t: "Push the ladder off",
            check: {s:"str",s2:"athletics",d:45},
            win: {
              r: "Over it goes, men and all. Screams below, then nothing. The watch bell rings.",
              fx: {fame:2,honor:2},
            },
            lose: {r:"It is too heavy with men. You ring the bell instead, and they get away.",fx:{happy:-2}},
          },
          {
            t: "Ring the alarm bell",
            r: "The whole watch comes running. The ladder party melts away. Nobody gets the glory, nobody gets hurt.",
            fx: {honor:1},
          },
        ],
      },
      {
        id: "pf_xbow_lever",
        cond: (p,C)=>pro(p,C,"xbow",55),
        w: .5,
        once: !0,
        setup: (p,ctx)=>{ctx.dw=nm(p)},
        title: "The steel crossbow",
        text: "A dwarf porter called {dw} has a steel crossbow from Emberdeep, spanned with a lever, that shoots through a shield. He needs money more than the bow. The holds do not sell their steel to outsiders, and he is not supposed to have it either.",
        choices: [
          {
            t: "Buy it (90 suns)",
            req: p=>p.coin>=90,
            r: "You pay. It is the most beautiful thing you own. You do not ask questions.",
            fx: {coin:-90,gear:{ranged:"xbow"},skill:{xbow:2},happy:6,flag:"pf_hold_steel"},
          },
          {
            t: "Shoot it once for a few coppers",
            check: {s:"xbow",s2:"str",d:50},
            win: {
              r: "The lever, the click, the bolt clean through a plank. You learn more from one shot than from a season.",
              fx: {skill:{xbow:3}},
            },
            lose: {
              r: "The lever snaps back and takes the tip of your thumb with it.",
              fx: {health:-4,wound:"lost_fingers",cause:"a crossbow lever"},
            },
          },
          {
            t: "Leave it. Dwarven law has long arms.",
            r: "{dw} nods sadly and walks on to find another buyer.",
            fx: {},
          },
        ],
      },
      {
        id: "pf_throw_crows",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)<13,
        once: !0,
        w: .5,
        title: "Scaring crows",
        text: "Your job is to keep the crows off the new-sown field, all day, with a bag of stones and a rattle. The crows are bold and you are bored.",
        choices: [
          {
            t: "Make a sling from your belt and an old rag",
            check: {s:"ins",s2:"str",d:20},
            win: {
              r: "By noon you are knocking crows off fence posts at fifty paces. The farmer pays you an extra penny and tells everyone.",
              fx: {apt:{throwing:1.3},skill:{throwing:3},family:1,happy:3},
            },
            lose: {
              r: "The stone goes backwards and hits the farmer's dog. The dog forgives you. The farmer does not.",
              fx: {skill:{throwing:1},happy:-1},
            },
          },
          {
            t: "Use the rattle like you were told",
            r: "The crows laugh at you. The farmer is happy enough.",
            fx: {sta:.2},
          },
          {
            t: "Nap under the hedge",
            r: "The crows eat half the field. You get no supper.",
            fx: {happy:-3,family:-1},
          },
        ],
      },
      {
        id: "pf_throw_stone",
        cond: (p,C)=>C.adult(p)&&!C.old(p)&&(C.prof(p,"throwing",35)||C.race(p,"giant")),
        w: .8,
        cool: 5,
        setup: (p,ctx)=>{who(p,ctx,"rival"),ctx.where=inR(p,"POL-09","POL-23")?"the stone-throw at the Thing, where Vermund threw 32 meters in 1099":"the stone-throw at the fair, a river stone the weight of a sheep"},
        title: "The stone-throw",
        text: "{where}. {themFull} has thrown farthest so far, and is already accepting cups of ale.",
        choices: [
          {
            t: "Throw with everything",
            check: {s:"throwing",s2:"str",d:52},
            win: {
              r: "The stone flies past {theirHis} mark by a full stride. The crowd roars. The ale is yours.",
              fx: {fame:3,coin:6,skill:{throwing:2},str:.4,happy:4,them:{type:"rival",op:-5}},
            },
            lose: {
              r: "Something tears low in your back on the turn. The stone lands short.",
              fx: {wound:"back",health:-6,wil:1,cause:"a torn back"},
            },
          },
          {
            t: "Throw clean, not hard",
            check: {s:"throwing",s2:"ins",d:45},
            win: {
              r: "A clean throw, short of {theirHis}, but second place pays a fat goose.",
              fx: {fame:1,skill:{throwing:1},happy:2},
            },
            lose: {r:"Fourth. No goose.",fx:{}},
          },
          {
            t: "Drink with {them} instead",
            r: "{They} tells you how {theyHe} trains. It is mostly lifting cows.",
            fx: {them:{type:"friend",op:15},happy:2},
          },
        ],
      },
      {
        id: "pf_throw_knives_door",
        cond: (p,C)=>pro(p,C,"throwing",40),
        w: .8,
        setup: (p,ctx)=>{ctx.sailor=nm(p,"M")},
        title: "Knives at the door",
        text: 'In the alehouse, {sailor} and his shipmates are throwing knives at the back door for coin. The innkeeper is complaining. {sailor} slaps a sun on the table: "Anyone else want to lose money?"',
        choices: [
          {
            t: "Throw against him, sun for sun",
            check: {s:"throwing",s2:"ins",d:48},
            win: {
              r: "Five knives, five in the knot of the door. {sailor} pays up with a laugh and buys the next round.",
              fx: {coin:6,fame:1,skill:{throwing:2},newRel:{type:"friend",op:20}},
            },
            lose: {
              r: "{sailor} is better. You lose five suns and the innkeeper bans you both.",
              fx: {coin:-5,skill:{throwing:1}},
            },
          },
          {
            t: "Make it harder: an apple on the innkeeper's head",
            req: (p,C)=>C.prof(p,"throwing",60),
            check: {s:"throwing",s2:"wil",d:55},
            win: {
              r: "The innkeeper, purple with rage, holds still because he is too scared to move. The knife takes the apple. You are a legend in that alehouse forever.",
              fx: {fame:3,coin:10,skill:{throwing:2}},
            },
            lose: {
              r: "The knife takes the apple and a bit of ear. The innkeeper calls the watch.",
              fx: {coin:-10,fame:1,honor:-3},
            },
          },
          {t:"Side with the innkeeper",r:"You help him throw them out. Free supper.",fx:{happy:2}},
        ],
      },
      {
        id: "pf_throw_javelin_runner",
        cond: (p,C)=>pro(p,C,"throwing",45)&&!C.old(p),
        w: .5,
        once: !0,
        setup: (p,ctx)=>{school(p,ctx,/javelin|running|run/i,"the House of Runners"),ctx.runner=nm(p)},
        title: "Run and throw",
        text: "{runner}, who learned at {school} in {splace}, says a javelin is only worth what your legs are worth. The trial is a run of half a league in the heat and then three throws at a target the size of a shield.",
        choices: [
          {
            t: "Take the trial",
            check: {s:"throwing",s2:"sta",d:52},
            win: {
              r: "Your lungs are on fire, but all three javelins hit. {runner} hands you three javelins and promises to teach you.",
              fx: {gear:{ranged:"javelins"},skill:{throwing:3,athletics:2},sta:.6,newRel:{type:"mentor",op:25}},
            },
            lose: {
              r: "You arrive at the line seeing double. The javelins go everywhere except at the shield.",
              fx: {skill:{throwing:1,athletics:1},sta:.4,wil:1},
            },
          },
          {
            t: "Throw without running",
            r: '"That is not throwing," {runner} says. "That is gardening."',
            fx: {skill:{throwing:1}},
          },
        ],
      },
      {
        id: "pf_throw_mad_dog",
        cond: (p,C)=>pro(p,C,"throwing",30),
        w: .8,
        cool: 10,
        title: "The mad dog",
        text: ()=>`A dog with foam on its jaws comes down the lane at {home}, straight for ${A.pick(["a small boy with a hoop","a girl carrying eggs","an old man on a stick"])}. Everyone else is running the other way.`,
        choices: [
          {
            t: "Throw the nearest thing that is heavy",
            check: {s:"throwing",s2:"ins",d:45},
            win: {
              r: "A cobble, thrown hard, catches it behind the ear. The dog drops in the lane and the child runs home crying but whole.",
              fx: {fame:2,honor:4,skill:{throwing:2},happy:4},
            },
            lose: {
              r: "You miss. You have to get between the dog and the child yourself. You get bitten.",
              fx: {wound:"bite",health:-10,honor:4,wil:1.5,cause:"a mad dog's bite"},
            },
          },
          {
            t: "Shout and draw it to you",
            check: {s:"spd",s2:"athletics",d:45},
            win: {
              r: "It turns on you. You get up the wall of the tithe barn just in time, and men with pitchforks do the rest.",
              fx: {honor:3,fame:1},
            },
            lose: {
              r: "It turns on you and you are not fast enough.",
              fx: {wound:"bite",health:-12,honor:3,cause:"a mad dog's bite"},
            },
          },
          {
            t: "Run like everyone else",
            r: "Someone else saves the child. You are glad, and ashamed, in equal measure.",
            fx: {happy:-3},
          },
        ],
      },
      {
        id: "pf_ride_colt",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=8&&(C.terr(p,"steppe","plains")||C.famKind(p,"horse","clan")||C.race(p,"orc","halforc")),
        once: !0,
        w: .6,
        title: "The colt nobody rides",
        text: p=>`${inR(p,"POL-12","POL-11","POL-34")?"On the steppe children ride before they walk well, but":"In the paddock at {home}"} there is a grey colt that has thrown every rider who tried. The grown-ups have given up on it. It watches you over the fence.`,
        choices: [
          {
            t: "Climb on bareback",
            check: {s:"ins",s2:"wil",d:22},
            win: {
              r: "It bucks, spins, bucks again, and then stops. It turns its head and looks at you. After that it will let nobody else on its back.",
              fx: {apt:{riding:1.4},skill:{riding:3,husbandry:1},happy:5},
            },
            lose: {
              r: "You fly. You land. You climb on again. You fly again. Your arm is never quite straight after.",
              fx: {health:-6,skill:{riding:1},wil:1.5,cause:"a fall from a colt"},
            },
          },
          {
            t: "Bring it an apple every day for a month",
            r: "By the end of the month it follows you like a dog. Riding it comes later, and easily.",
            fx: {skill:{riding:2,husbandry:2},happy:3},
          },
          {t:"Leave it alone",r:"It gets sold at the next fair. You think about it for years.",fx:{}},
        ],
      },
      {
        id: "pf_ride_race",
        cond: (p,C)=>pro(p,C,"riding",35)&&!C.old(p),
        w: 1,
        cool: 4,
        setup: (p,ctx)=>{who(p,ctx,"rival"),ctx.race=inR(p,"POL-11","POL-34")?"the Great Ride at the Horse Feast, where Durgash Blood-Fist's heart burst in 1074":inR(p,"POL-12")?"the long race at the kurultai, a full day across the grass":inR(p,"POL-19")?"the camel race at the wells":"the horse race at {festival}, three times round the common and over the brook".replace("{festival}",A.pick(GD.FESTIVALS)[0])},
        title: "The race",
        text: "{race}. Twenty riders at the line. The one to beat is {themFull} on a long-legged bay, and {theyHe} knows it.",
        choices: [
          {
            t: "Ride flat out from the start",
            check: {s:"riding",s2:"sta",d:52},
            win: {
              r: "You lead from the line and never look back. The prize is yours, and the bay comes in second, blowing.",
              fx: {fame:3,coin:20,skill:{riding:3},happy:6,them:{type:"rival",op:-10}},
            },
            lose: {
              r: "Your horse goes down at the brook. You both get up, but you are last by a mile.",
              fx: {health:-8,skill:{riding:1},wil:1,cause:"a fall in a horse race"},
            },
          },
          {
            t: "Sit behind {themHim}, and go at the end",
            check: {s:"riding",s2:"int",d:50},
            win: {
              r: "You sit in {theirHis} dust until the last furlong, then go past like a hawk.",
              fx: {fame:3,coin:20,skill:{riding:2},int:.3},
            },
            lose: {
              r: "{They} knew exactly what you were doing and kept something back.",
              fx: {skill:{riding:1},happy:-2},
            },
          },
          {
            t: "Crowd {theirHis} horse into the brook",
            req: (p,C)=>C.prof(p,"riding",50)||C.trait(p,"cruel")||C.trait(p,"reckless"),
            check: {s:"riding",s2:"deception",d:48},
            win: {
              r: "The bay stumbles in the water. Nobody can say for sure you meant it. You win.",
              fx: {coin:20,fame:1,honor:-5,them:{type:"enemy",op:-30}},
            },
            lose: {
              r: "Everyone saw. The judges strip you of the race, and {them} swears revenge.",
              fx: {honor:-8,fame:-2,them:{type:"enemy",op:-50}},
            },
          },
        ],
      },
      {
        id: "pf_ride_night_ride",
        cond: (p,C)=>pro(p,C,"riding",40)&&C.mounted(p),
        w: .8,
        cool: 8,
        setup: (p,ctx)=>{ctx.why=A.pick(["the midwife from {town} for a birth gone wrong","warning to {town} that raiders are on the road","medicine for a dying child","word to the lord that the dyke is breaking"]).replace("{town}",A.provName(A.pick(A.S.prov.filter(x=>x.owner===p.realm).map(x=>x.id).concat([p.home]))))},
        title: "The night ride",
        text: "Somebody has to ride tonight: {why}. It is fifteen leagues in the dark and the rain, and yours is the only good horse.",
        choices: [
          {
            t: "Ride hard, all night",
            check: {s:"riding",s2:"sta",d:52},
            win: {
              r: "You arrive at dawn with the horse steaming and your thighs raw. You were in time. People will remember who rode.",
              fx: {fame:3,honor:4,skill:{riding:3},sta:.5,happy:4},
            },
            lose: {
              r: "The horse goes lame in the dark at the tenth league. You run the rest, too late.",
              fx: {wil:2,sta:.5,happy:-6,honor:2},
            },
          },
          {
            t: "Ride steady, and save the horse",
            check: {s:"riding",s2:"husbandry",d:45},
            win: {
              r: "Steady and sure. You arrive an hour later than you could have, and the horse lives to ride again.",
              fx: {honor:3,skill:{riding:2,husbandry:1}},
            },
            lose: {r:"Steady is too slow tonight.",fx:{happy:-5,wil:1.5}},
          },
          {
            t: "Lend the horse to a lighter rider",
            r: "A stable-girl half your weight takes it and rides like the wind. You wait by the fire, useless and proud.",
            fx: {honor:2,newRel:{type:"friend",op:20}},
          },
        ],
      },
      {
        id: "pf_ride_breaker",
        cond: (p,C)=>pro(p,C,"riding",40),
        w: .8,
        cool: 6,
        setup: (p,ctx)=>{ctx.owner=nm(p)},
        title: "Fifteen suns to break him",
        text: '{owner} has a three-year-old stallion that has put two grooms in bed with broken bones. "Fifteen suns if you can make him carry a saddle by the spring fair."',
        choices: [
          {
            t: "Break him the hard way",
            check: {s:"riding",s2:"str",d:50},
            win: {
              r: "Weeks of fights in the pen, but by spring he carries a saddle. He does not like you. He respects you.",
              fx: {coin:15,skill:{riding:3},str:.3},
            },
            lose: {
              r: "He wins. You spend the winter in bed with a cracked back.",
              fx: {wound:"back",health:-14,wil:2,cause:"a wild stallion"},
            },
          },
          {
            t: "Gentle him slowly",
            check: {s:"riding",s2:"husbandry",d:48},
            win: {
              r: "No ropes, no whip. By spring he walks up to you in the field. {owner} pays you twenty, not fifteen.",
              fx: {coin:20,skill:{riding:2,husbandry:2},fame:1},
            },
            lose: {
              r: "He is not ready by spring. {owner} pays you five for your trouble.",
              fx: {coin:5,skill:{husbandry:1}},
            },
          },
          {t:"Decline",r:"{owner} sells him to a carter, who sells him for meat.",fx:{happy:-1}},
        ],
      },
      {
        id: "pf_ride_horse_thief",
        cond: (p,C)=>C.adult(p)&&C.mounted(p)&&(C.prof(p,"riding",25)||C.prof(p,"tracking",30)),
        w: .6,
        cool: 10,
        title: "An empty stall",
        text: p=>`You wake at the inn to find your horse gone, the stall door swinging. ${inR(p,"POL-11","POL-34","POL-12")?"On the steppe, horse theft between clans is half a sport. Half.":"The ostler swears he heard nothing."}`,
        choices: [
          {
            t: "Follow the hoofprints on a borrowed mule",
            check: {s:"tracking",s2:"riding",d:48},
            win: {
              r: "The thief stopped to sleep. You take your horse back while he snores, and his saddle too.",
              fx: {skill:{tracking:2,riding:1},coin:5,fame:1},
            },
            lose: {r:"The prints vanish at a ford. Your horse is gone.",fx:{gear:{mount:"mule"},happy:-6,wil:1}},
          },
          {
            t: "Steal one of the thieves' horses in return",
            req: (p,C)=>C.prof(p,"stealth",35)||inR(p,"POL-11","POL-34","POL-12","POL-19"),
            check: {s:"stealth",s2:"riding",d:50},
            win: {
              r: "Their camp sleeps. You ride out on their best mare. That is how this game is played.",
              fx: {gear:{mount:"horse"},skill:{stealth:2},fame:1},
            },
            lose: {
              r: "Their dogs wake. You run for it on foot with arrows behind you.",
              fx: {gear:{mount:"mule"},health:-6,wound:"arrow_wound",cause:"an arrow in the dark"},
            },
          },
          {
            t: "Buy a mule and go on",
            r: "A mule. Slow, patient, and nobody will steal it.",
            fx: {gear:{mount:"mule"},coin:-6},
          },
        ],
      },
      {
        id: "pf_ath_dare",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=8,
        once: !0,
        w: .5,
        title: "The dare",
        text: ()=>`The older children dare you to climb ${A.pick(["the old watchtower","the temple bell-tower","the tallest elm in {home}","the cliff above the river"])} and bring back a feather from the crows' nest at the top.`,
        choices: [
          {
            t: "Climb it",
            check: {s:"spd",s2:"sta",d:22},
            win: {
              r: "Hand over hand, never looking down. You come back with the feather in your teeth and your knees shaking only afterward.",
              fx: {apt:{athletics:1.3},skill:{athletics:3},happy:4,fame:1},
            },
            lose: {
              r: "Halfway up, a handhold crumbles. You fall into the bushes and break your arm.",
              fx: {health:-10,skill:{athletics:1},wil:1.5,cause:"a fall"},
            },
          },
          {
            t: "Find an easier way up first",
            check: {s:"int",s2:"spd",d:20},
            win: {
              r: "There is a drainpipe nobody thought of. You are up and down while they are still arguing.",
              fx: {skill:{athletics:2},int:.3,happy:2},
            },
            lose: {r:"The easier way is a dead end. You come down with no feather.",fx:{}},
          },
          {
            t: "Refuse the dare",
            r: '"Chicken," they cluck. You have both arms. You can live with clucking.',
            fx: {happy:-1},
          },
        ],
      },
      {
        id: "pf_ath_roof_climb",
        cond: (p,C)=>pro(p,C,"athletics",40)&&!C.old(p),
        w: .9,
        cool: 5,
        setup: (p,ctx)=>{who(p,ctx,"rival"),ctx.climb=p.realm==="POL-21"?"the Pepper Hall roof at Harvest Home, thirty meters, no ropes, as the young of Kesh have done for generations":inR(p,"POL-13")?"the race up the rock above the valley, as Highlanders do on feast days":"the guildhall tower for a wager, a purse hung on the weathervane"},
        title: "The climb",
        text: "{climb}. Your rival in it is {themFull}, who climbs like a lizard and has been bragging about it for weeks.",
        choices: [
          {
            t: "Race {themHim} to the top",
            check: {s:"athletics",s2:"spd",d:52},
            win: {
              r: "You reach the top first and stand there with the wind in your face while the whole town shouts below.",
              fx: {fame:3,coin:10,skill:{athletics:3},happy:6,them:{type:"rival",op:-5}},
            },
            lose: {
              r: "A tile slides under your foot. You catch a gutter, but you are out of the race and your shoulder is torn.",
              fx: {health:-10,wound:"back",wil:1.5,cause:"a fall from a roof"},
            },
          },
          {
            t: "Climb slow and safe",
            check: {s:"athletics",s2:"sta",d:42},
            win: {
              r: "Not first, but you get up and down whole, and the crowd cheers every climber who does.",
              fx: {fame:1,skill:{athletics:2}},
            },
            lose: {
              r: "Halfway up, your arms give out and you have to be fetched down with a rope. Mortifying.",
              fx: {fame:-1,happy:-3},
            },
          },
          {
            t: "Watch from the ground",
            r: "{They} wins. You buy {themHim} a cup. {They} is insufferable all winter.",
            fx: {them:{op:5}},
          },
        ],
      },
      {
        id: "pf_ath_wall_run",
        cond: (p,C)=>pro(p,C,"athletics",40)&&(C.realm(p,"POL-13")||C.terr(p,"mountains"))&&!C.old(p),
        w: .8,
        cool: 12,
        setup: (p,ctx)=>{ctx.client=nm(p),ctx.other=nm(p)},
        title: "The wall-run",
        text: p=>`${p.realm==="POL-13"?"The old Highland custom: two champions race along the top of Highcastle's wall, and whoever falls loses the case.":"The valley still settles some quarrels the old Highland way: two champions race along the top of a high wall, and whoever falls loses the case."} {client} has a pasture dispute with {other}, and asks you to run.`,
        choices: [
          {
            t: "Run the wall",
            check: {s:"athletics",s2:"spd",d:55},
            win: {
              r: "You never look down. You touch the far tower first. {client} keeps the pasture and gives you a fat ewe.",
              fx: {fame:3,coin:15,skill:{athletics:3},honor:2,newRel:{type:"friend",op:30}},
            },
            lose: {
              r: "Your foot finds air. You fall onto the hay cart they put there for losers, and then off it.",
              fx: {health:-12,wound:"bad_knee",wil:1.5,cause:"a fall from a wall"},
            },
          },
          {
            t: "Ask for a fee first (10 suns)",
            r: "{client} grumbles and pays. You run well enough. Win or lose, you are paid.",
            fx: {coin:10,skill:{athletics:1}},
          },
          {
            t: "Refuse. It is not your quarrel.",
            r: "{client} finds another runner, and does not forget that you said no.",
            fx: {},
          },
        ],
      },
      {
        id: "pf_ath_river",
        cond: (p,C)=>pro(p,C,"athletics",30)&&!C.terr(p,"desert"),
        w: .9,
        cool: 8,
        title: "The river in spate",
        text: ()=>`Spring flood. The river is brown and fast and full of branches. ${A.pick(["A small boy","A girl chasing a goat","The miller's youngest"])} has fallen in at the ford and is being swept toward the weir.`,
        choices: [
          {
            t: "Dive in after the child",
            check: {s:"athletics",s2:"sta",d:50},
            win: {
              r: "The cold takes your breath. You grab a fistful of shirt and kick for the bank. You both come out alive.",
              fx: {fame:3,honor:5,skill:{athletics:3},happy:6,health:-3,cause:"cold water"},
            },
            lose: {
              r: "You reach the child, but the current smashes you both into the weir. You are pulled out half drowned. The child is not.",
              fx: {wound:"lungs",health:-18,wil:3,happy:-10,honor:3,cause:"drowning"},
            },
          },
          {
            t: "Run ahead and catch the child at the weir",
            check: {s:"spd",s2:"int",d:45},
            win: {
              r: "You reach the weir first, lie flat on the planks and catch an arm as the child goes by.",
              fx: {fame:2,honor:4,skill:{athletics:1}},
            },
            lose: {
              r: "You are a moment too late. The child goes over. Men find the body below the mill.",
              fx: {happy:-10,wil:2},
            },
          },
          {
            t: "Shout for help",
            r: "Others come running. A fisherman with a pole saves the child. You did not.",
            fx: {happy:-3},
          },
        ],
      },
      {
        id: "pf_ath_belfry",
        cond: (p,C)=>pro(p,C,"athletics",50),
        w: .7,
        cool: 10,
        title: "The child in the belfry",
        text: ()=>`A child has climbed the ${A.pick(["bell-tower","old keep","mill-sails","temple roof"])} at {home} and frozen at the top, too scared to move. The ladder does not reach. The mother is screaming.`,
        choices: [
          {
            t: "Climb the stones",
            check: {s:"athletics",s2:"wil",d:52},
            win: {
              r: "Up the gaps in the stonework, calm voice, slow hands. You bring the child down on your back.",
              fx: {fame:3,honor:4,skill:{athletics:2},happy:5},
            },
            lose: {
              r: "You reach the child, but on the way down you both fall the last stretch. The child lands on you. You take the worst of it.",
              fx: {wound:"broken_ribs",health:-15,honor:4,fame:2,cause:"a fall from a tower"},
            },
          },
          {
            t: "Talk the child down step by step",
            check: {s:"persuasion",s2:"wil",d:45},
            win: {
              r: "Your voice is steady. One step, then another. The child climbs down alone, and runs to its mother.",
              fx: {honor:3,skill:{persuasion:2},fame:1},
            },
            lose: {r:"The child panics. Someone else has to climb up.",fx:{happy:-2}},
          },
          {
            t: "Fetch a longer ladder",
            r: "By the time the ladder comes, the child has climbed down by itself. Children are like that.",
            fx: {},
          },
        ],
      },
      {
        id: "pf_ath_hue_cry",
        cond: (p,C)=>pro(p,C,"athletics",35)&&!C.old(p),
        w: .8,
        title: "Hue and cry",
        text: ()=>`"Stop, thief!" A boy with a ${A.pick(["silver cup","bolt of red cloth","baker's purse","brace of capons"])} runs past you through the market. The law says every neighbor must answer the hue and cry or be fined.`,
        choices: [
          {
            t: "Run him down",
            check: {s:"athletics",s2:"spd",d:45},
            win: {
              r: "Over a cart, through the fish stalls, into a dead-end alley. You hold him by the collar until the watch comes. The merchant gives you two suns.",
              fx: {coin:2,fame:1,skill:{athletics:2},sta:.3},
            },
            lose: {r:"He goes over a wall like a cat. You go into it like a cow.",fx:{health:-4,happy:-1}},
          },
          {
            t: "Run him down, then let him go",
            check: {s:"athletics",s2:"spd",d:45},
            win: {
              r: "You catch him. He is maybe ten, and starving. You let him go with the cup and say you lost him.",
              fx: {honor:2,skill:{athletics:2},piety:1},
            },
            lose: {r:"He gets away without your help.",fx:{}},
          },
          {t:"Stand still",r:"The constable writes down your name. A fine, if anyone remembers.",fx:{coin:-1}},
        ],
      },
      {
        id: "pf_stealth_orchard",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=7,
        once: !0,
        w: .5,
        title: "The priest's apples",
        text: "The priest at {home} has the best apple tree in the parish, behind a wall, with a dog. Every child knows it. Nobody has ever got an apple.",
        choices: [
          {
            t: "Go over the wall at dusk",
            check: {s:"spd",s2:"int",d:22},
            win: {
              r: "The dog sleeps. The priest snores. You come back with your shirt full of apples, and nobody ever finds out. You are good at this.",
              fx: {apt:{stealth:1.3},skill:{stealth:3},happy:4,piety:-1},
            },
            lose: {
              r: "The dog does not sleep. You leave a piece of your breeches on the wall.",
              fx: {health:-3,happy:-2,skill:{stealth:1}},
            },
          },
          {
            t: "Make friends with the dog first",
            r: "A week of crusts. Then the dog walks you to the tree itself.",
            fx: {skill:{stealth:2,husbandry:1},happy:3},
          },
          {
            t: "Just ask the priest for one",
            r: "The priest gives you two, and a little lecture on the sin of coveting.",
            fx: {piety:2,happy:1},
          },
        ],
      },
      {
        id: "pf_stealth_letter",
        cond: (p,C)=>pro(p,C,"stealth",45),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{ctx.agent=nm(p),ctx.mark=A.pick(["a wool merchant","the bishop's secretary","a banker's agent","a foreign envoy","the reeve"])},
        title: "A letter in a locked chest",
        text: '{agent} has a soft voice and good gloves, and serves someone who prefers not to be named. {mark} keeps a letter in a locked chest at the inn. "Copy it, put it back, and nobody is the wiser. Forty suns."',
        choices: [
          {
            t: "Do it",
            check: {s:"stealth",s2:"intrigue",d:55},
            win: {
              r: "In through the shutter, lock picked, letter copied by candlelight, everything back where it was. Forty suns. {agent} says there may be more work.",
              fx: {coin:40,skill:{stealth:3,intrigue:2},flag:"pf_spy_work",honor:-2},
            },
            lose: {
              r: "A floorboard. A shout. You go out of the window with nothing, and land badly.",
              fx: {health:-10,wound:"bad_knee",honor:-2,cause:"a fall from a window"},
            },
          },
          {
            t: "Do it, and read the letter yourself",
            req: p=>p.literate,
            check: {s:"stealth",s2:"learning",d:55},
            win: {
              r: "You copy it twice: one for {agent}, one for yourself. What it says is worth far more than forty suns, to the right person.",
              fx: {coin:40,skill:{stealth:2,intrigue:3},flag:"pf_knows_secret"},
            },
            lose: {r:"You read too long. The candle gives you away.",fx:{health:-8,honor:-3,punish:"theft"}},
          },
          {t:"Refuse",r:"{agent} smiles as if you have done exactly what was expected, and is gone.",fx:{}},
          {
            t: "Warn {mark}",
            r: "{mark} thanks you, moves the letter, and gives you five suns. Someone with good gloves now knows your face.",
            fx: {coin:5,honor:3,newRel:{type:"enemy",op:-25}},
          },
        ],
      },
      {
        id: "pf_stealth_crew",
        cond: (p,C)=>pro(p,C,"stealth",40)&&(C.town(p)||C.coast(p)),
        w: .8,
        cool: 8,
        setup: (p,ctx)=>{ctx.boss=nm(p),ctx.crew=p.realm==="POL-21"?"the climbing thieves of Kesh":p.realm==="POL-16"?"the pickpockets of the Exchange":p.realm==="POL-17"?"one of the rag gangs of Qadira":"a crew that owns the fish market"},
        title: "One job",
        text: `{boss}, who runs {crew}, has watched you move. "One job. The money-changer's strongroom, through the roof. Your share is a fifth." A fence pays a quarter of what a thing is worth, but a quarter of a strongroom is a lot.`,
        choices: [
          {
            t: "Do the job",
            check: {s:"stealth",s2:"athletics",d:55},
            win: {
              r: "Across the roofs, through the tiles, in and out before the watch's second round. Your fifth comes to sixty suns.",
              fx: {coin:60,skill:{stealth:3,athletics:1},honor:-5,flag:"pf_crew",newRel:{type:"friend",op:20}},
            },
            lose: {
              r: "The money-changer sleeps in the strongroom. With a crossbow.",
              fx: {wound:"arrow_wound",health:-15,punish:"theft",cause:"a crossbow bolt"},
            },
          },
          {
            t: "Sell {boss} out to the watch-captain",
            check: {s:"intrigue",s2:"deception",d:50},
            win: {
              r: "The crew is taken on the roof. The watch-captain pays you twenty suns. {boss} never learns who it was.",
              fx: {coin:20,honor:1},
            },
            lose: {
              r: "The watch-captain is a wet one, paid by {boss}. Now {boss} knows.",
              fx: {newRel:{type:"enemy",op:-60}},
            },
          },
          {t:"Say no",r:'{boss} shrugs. "Offer stands." It always will.',fx:{}},
        ],
      },
      {
        id: "pf_stealth_overheard",
        cond: (p,C)=>pro(p,C,"stealth",35),
        w: .8,
        cool: 8,
        setup: (p,ctx)=>{ctx.plot=A.pick(["rob the tithe barn tomorrow night","burn the new mill and blame the miller","drown the reeve's son over a dowry","sell the town's gate-watch to bandits"])},
        title: "Voices in the hayloft",
        text: "You are where you should not be, very quietly, when two voices come into the barn below. They are planning to {plot}. They do not know you are there.",
        choices: [
          {
            t: "Stay silent until they leave, then warn the reeve",
            check: {s:"stealth",s2:"wil",d:45},
            win: {
              r: "They never know. The reeve's men are waiting for them. Your name is kept out of it, as you asked.",
              fx: {honor:4,skill:{stealth:2},favor:2},
            },
            lose: {
              r: "Hay dust. A sneeze. They see your face before you get out the back.",
              fx: {honor:3,newRel:{type:"enemy",op:-40}},
            },
          },
          {
            t: "Make them pay for your silence",
            check: {s:"intimidation",s2:"intrigue",d:52},
            win: {
              r: "You drop down in front of them. They pay ten suns and call off the plan. You have made two very frightened enemies.",
              fx: {coin:10,honor:-3,skill:{intimidation:2},newRel:{type:"enemy",op:-30}},
            },
            lose: {
              r: "They are two, you are one, and they have knives.",
              fx: {
                duel: {
                  tier: 2,
                  title: "two plotters in a barn",
                  opts: {kind:"duel",lethal:!0,toYield:!1,place:"the barn",title:"In the barn"},
                },
              },
            },
          },
          {
            t: "Mind your own business",
            r: "You slip away. What happens next is not your fault. Probably.",
            fx: {happy:-2},
          },
        ],
      },
      {
        id: "pf_stealth_patrols",
        cond: (p,C)=>pro(p,C,"stealth",30)&&(C.atWar(p)||C.soldier(p)),
        w: .8,
        cool: 8,
        title: "Between the patrols",
        text: "Cut off behind {enemy}'s patrols, with the moon coming up. Your people are on the far side of a valley full of their campfires.",
        choices: [
          {
            t: "Crawl through in the dark",
            check: {s:"stealth",s2:"wil",d:50},
            win: {
              r: "Through the ditches, past two sentries close enough to smell their supper. You are home by dawn, and you saw where their horses are picketed.",
              fx: {skill:{stealth:3,tracking:1},merit:4,wil:1,fame:1},
            },
            lose: {
              r: "A sentry's dog. You run, an arrow in your shoulder, and only just make it.",
              fx: {wound:"arrow_wound",health:-15,wil:1.5,cause:"an arrow in the dark"},
            },
          },
          {
            t: "Go the long way round through the hills",
            check: {s:"survival",s2:"sta",d:45},
            win: {
              r: "Three days, no fire, little food. But you get back.",
              fx: {skill:{survival:2},sta:.5,wil:1.5,health:-4,cause:"hunger"},
            },
            lose: {
              r: "You get lost in the hills for a week. When you come back, they had given you up for dead.",
              fx: {health:-12,wil:2,cause:"cold and hunger"},
            },
          },
          {
            t: "Hide until they move on",
            r: "Two days in a badger hole. Cold, hungry and alive.",
            fx: {wil:1,health:-3,cause:"cold"},
          },
        ],
      },
      {
        id: "pf_surv_lost",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=8&&!C.town(p),
        once: !0,
        w: .5,
        title: "Lost in the woods",
        text: "You followed a fox too far, and now the trees all look the same and the light is going. You are alone, and it is getting cold.",
        choices: [
          {
            t: "Make a shelter of branches and wait for morning",
            check: {s:"int",s2:"sta",d:22},
            win: {
              r: "Leaves, branches, a hollow under a fallen tree. You sleep warm, and in the morning you follow the stream down to the valley. The searchers find you eating berries by the mill.",
              fx: {apt:{survival:1.3},skill:{survival:3},wil:1,happy:2},
            },
            lose: {
              r: "It is a long, cold, terrifying night. They find you blue at dawn.",
              fx: {health:-8,wil:2,skill:{survival:1},cause:"cold"},
            },
          },
          {
            t: "Walk downhill until you find water",
            check: {s:"ins",s2:"int",d:22},
            win: {
              r: "Downhill, then a stream, then the stream to the millrace. Home before full dark.",
              fx: {skill:{survival:2,tracking:1}},
            },
            lose: {
              r: "Downhill goes on forever. You end up in the next valley and someone's goatherd brings you home a day later.",
              fx: {health:-4,wil:1},
            },
          },
          {
            t: "Shout until someone comes",
            r: "You shout yourself hoarse. Your uncle finds you at midnight, and is not pleased.",
            fx: {happy:-2},
          },
        ],
      },
      {
        id: "pf_surv_blizzard",
        cond: (p,C)=>pro(p,C,"survival",35)&&C.terr(p,"mountains","tundra","hills","forest"),
        w: .8,
        cool: 8,
        title: "Caught in the snow",
        text: "You are two days from {home} when the sky turns white. The snow comes sideways. In an hour you cannot see your own feet, and the cold is coming through your boots.",
        choices: [
          {
            t: "Dig a snow cave and wait it out",
            check: {s:"survival",s2:"sta",d:50},
            win: {
              r: "Two nights in a hole in the drift, a candle stub for warmth. You walk out when it clears, hungry and whole.",
              fx: {skill:{survival:3},wil:2,sta:.5},
            },
            lose: {r:"You live. Two of your toes do not.",fx:{wound:"frostbite",health:-12,wil:2.5,cause:"cold"}},
          },
          {
            t: "Push on to the shepherds' hut you remember",
            check: {s:"tracking",s2:"sta",d:52},
            win: {
              r: "You find it by luck and memory, with a stack of dry wood inside. Shepherds are good people.",
              fx: {skill:{tracking:2,survival:1},wil:1},
            },
            lose: {
              r: "The hut is not where you remember. You stagger for hours, and then you are lying in the snow, and someone's dog finds you.",
              fx: {wound:"frostbite",health:-20,wil:3,cause:"cold"},
            },
          },
          {
            t: "Turn back at once",
            r: "You turn back early, and reach the last village with frost in your beard. Not brave. Alive.",
            fx: {wil:.5,health:-3,cause:"cold"},
          },
        ],
      },
      {
        id: "pf_surv_hungry_winter",
        cond: (p,C)=>pro(p,C,"survival",30)&&!C.town(p),
        w: .9,
        cool: 6,
        title: "The hungry months",
        text: "The harvest was thin and it is only midwinter. The village has eaten the seed corn's neighbors and is looking at the seed corn. Children are crying at night.",
        choices: [
          {
            t: "Hunt and snare for the whole village",
            check: {s:"survival",s2:"tracking",d:50},
            win: {
              r: "Rabbits, a hind, fish through the ice, roots nobody else knew could be eaten. Nobody dies in your village this winter. They will not forget it.",
              fx: {fame:3,honor:4,skill:{survival:3},happy:4,sta:.4},
            },
            lose: {
              r: "The snow is deep and the beasts are gone. You bring back enough for your own house, barely.",
              fx: {wil:1.5,health:-5,cause:"hunger"},
            },
          },
          {
            t: "Teach the young ones to snare",
            r: "You teach a dozen youngsters to set snares. Twelve snare lines catch more than one hunter.",
            fx: {skill:{survival:1,command:1},honor:2,happy:2},
          },
          {
            t: "Feed your own first",
            r: "You hunt, and you eat, and your family eats. You do not look your neighbors in the eye.",
            fx: {health:3,honor:-2},
          },
        ],
      },
      {
        id: "pf_surv_mushrooms",
        cond: (p,C)=>pro(p,C,"survival",30)||C.adult(p)&&C.prof(p,"medicine",30),
        w: .7,
        cool: 10,
        setup: (p,ctx)=>{ctx.nb=nm(p,"F")},
        title: "A basket of mushrooms",
        text: "{nb}'s children have come back from the woods with a basket of mushrooms, proud as kings. {nb} is about to put them in the pot. You glance in the basket, and look again.",
        choices: [
          {
            t: "Sort them, quickly",
            check: {s:"survival",s2:"medicine",d:40},
            win: {
              r: "Three of them are the pale kind that kills slowly over days. You throw them on the midden. {nb} hugs you, and her children sulk.",
              fx: {honor:3,skill:{survival:2},newRel:{type:"friend",op:30}},
            },
            lose: {
              r: "You miss one. Two of the children are very sick for a week. Both live, thanks to the herbwife.",
              fx: {happy:-4,skill:{survival:1}},
            },
          },
          {
            t: "Throw out the whole basket",
            r: "Better hungry than dead. The children cry. {nb} grumbles, and then thanks you.",
            fx: {honor:2},
          },
          {
            t: "Say nothing. They know their own woods.",
            r: "You hear the next day that the youngest is very sick.",
            fx: {happy:-5,wil:.5},
          },
        ],
      },
      {
        id: "pf_surv_dry_wells",
        cond: (p,C)=>pro(p,C,"survival",40)&&(C.terr(p,"desert","steppe")||C.realm(p,"POL-19","POL-24","POL-17")),
        w: .8,
        cool: 8,
        title: "The dry well",
        text: "The caravan reaches the well on the fourth day, and the well is dry. The next water is two days on, if the guide is right. The camels are groaning and the guide is not sure.",
        choices: [
          {
            t: "Find water yourself",
            check: {s:"survival",s2:"int",d:55},
            win: {
              r: "Birds at dusk, flying low and straight. You follow them to a seep in a wadi. The caravan master pays you ten suns and calls you a son of the sand.",
              fx: {coin:10,fame:2,skill:{survival:3},honor:2},
            },
            lose: {
              r: "You walk all night and find salt. You come back with cracked lips and nothing.",
              fx: {health:-10,wil:2,cause:"thirst"},
            },
          },
          {
            t: "Ration the water hard, and march by night",
            check: {s:"logistics",s2:"wil",d:45},
            win: {
              r: "A cup a day, marching by the stars. Everyone arrives, thin and furious and alive.",
              fx: {skill:{logistics:2,survival:1},wil:1.5},
            },
            lose: {
              r: "Two camels die and a driver goes mad with thirst. But most arrive.",
              fx: {wil:2,health:-8,cause:"thirst"},
            },
          },
          {
            t: "Trust the guide",
            r: "The guide is right, just. You will never trust a map again.",
            fx: {health:-5,wil:1,cause:"thirst"},
          },
        ],
      },
      {
        id: "pf_track_goat",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=8&&!C.town(p),
        once: !0,
        w: .5,
        title: "The lost goat",
        text: "The best nanny goat has broken her tether and gone. {father} is cursing. The ground around the pen is a mess of prints.",
        choices: [
          {
            t: "Read the prints and follow her",
            check: {s:"ins",s2:"int",d:22},
            win: {
              r: "Split hooves, a nibbled bramble, a tuft of hair on a thorn. You find her on a ledge above the stream before anyone else has their boots on.",
              fx: {apt:{tracking:1.3},skill:{tracking:3},rel:{who:"father",op:10},happy:4},
            },
            lose: {r:"You follow the wrong prints and find a very surprised deer.",fx:{skill:{tracking:1}}},
          },
          {
            t: "Think like a goat: where is the best grass?",
            r: "The best grass is in the priest's garden. So is the goat.",
            fx: {skill:{tracking:1},int:.2},
          },
          {t:"Let the grown-ups find her",r:"They find her by dusk. Nobody asks for your help.",fx:{}},
        ],
      },
      {
        id: "pf_track_missing_child",
        cond: (p,C)=>pro(p,C,"tracking",40),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{ctx.kid=nm(p),ctx.kage=A.ri(4,8)},
        title: "The search",
        text: "{kid}, aged {kage}, went into the forest after berries yesterday and has not come back. Half the village is crashing through the trees shouting, which is erasing every trail there was.",
        choices: [
          {
            t: "Send them all home and track alone",
            check: {s:"tracking",s2:"ins",d:52},
            win: {
              r: "A small heel-print in moss, a broken stem, berry juice on a rock. You find {kid} asleep in a hollow tree, cold and fine.",
              fx: {fame:3,honor:4,skill:{tracking:3},happy:5},
            },
            lose: {
              r: "The trails are churned to mud. Others find {kid} the next day, alive, but no thanks to you.",
              fx: {happy:-2,skill:{tracking:1}},
            },
          },
          {
            t: "Organize the search in lines",
            check: {s:"command",s2:"tracking",d:45},
            win: {
              r: "You put them in a long line, an arm apart, walking slow. {kid} is found before noon.",
              fx: {fame:2,honor:3,skill:{command:2}},
            },
            lose: {r:"Nobody listens. They shout and crash about until dark.",fx:{happy:-2}},
          },
          {t:"Bring the dogs",r:"The dogs find {kid} by evening. You held the leash.",fx:{honor:1}},
        ],
      },
      {
        id: "pf_track_scout",
        cond: (p,C)=>pro(p,C,"tracking",45)&&C.soldier(p),
        w: 1,
        cool: 5,
        setup: (p,ctx)=>{ctx.capt=nm(p,"M")},
        title: "Find their camp",
        text: `Captain {capt} needs to know where the enemy's main body is camped, how many, and where their horses are. "Before dawn. Take nobody. Be nobody."`,
        choices: [
          {
            t: "Go alone",
            check: {s:"tracking",s2:"stealth",d:55},
            win: {
              r: "You find them by their smoke and their latrines, count their fires, and see the horse lines. You are back before the cook-fires are lit.",
              fx: {merit:8,skill:{tracking:3,stealth:1},fame:1},
            },
            lose: {
              r: "Their outriders see you. You get back, but with an arrow through the arm and half the answer.",
              fx: {merit:2,wound:"arrow_wound",health:-14,cause:"an outrider's arrow"},
            },
          },
          {
            t: "Read it from the ground: tracks, dung, wheel ruts",
            check: {s:"tracking",s2:"int",d:50},
            win: {
              r: "Two thousand, with forty wagons and three hundred horse, heading for the ford. You are right to within a hundred.",
              fx: {merit:6,skill:{tracking:2},int:.4},
            },
            lose: {
              r: "The ground lies. You guess half their real strength. The captain finds out the hard way.",
              fx: {merit:-4,happy:-3},
            },
          },
          {
            t: "Report what you can see from the ridge",
            r: "You see smoke. You report smoke. The captain sighs.",
            fx: {merit:1},
          },
        ],
      },
      {
        id: "pf_track_wolfmen",
        cond: (p,C)=>pro(p,C,"tracking",45)&&!C.town(p),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{ctx.vic=nm(p)},
        title: "The wolf-man",
        text: "Sheep torn open, and now {vic}'s cow. The village says it is a wolf-man, a man who turns into a beast, and the priest is selling charms. You look at the tracks and think otherwise.",
        choices: [
          {
            t: "Follow the tracks to the truth",
            check: {s:"tracking",s2:"int",d:52},
            win: {
              r: p=>A.pick([`The tracks end at a cave with a wolf pelt hanging in it and a bandit's bedroll. You bring the reeve. The "wolf-man" hangs at the crossroads.`,"A wolf, a real one, foaming at the mouth and half mad. You put it down from a distance. No charms needed."]),
              fx: {fame:3,honor:2,skill:{tracking:3},int:.3},
            },
            lose: {
              r: "You lose the trail in the stony ground. The priest sells a lot of charms that month.",
              fx: {happy:-2},
            },
          },
          {
            t: "Tell the village what the tracks really say",
            check: {s:"persuasion",s2:"tracking",d:50},
            win: {
              r: "You show them: a man's foot inside the paw print. The fear turns to anger, and the hunt goes after a man, not a monster.",
              fx: {fame:2,skill:{persuasion:2}},
            },
            lose: {r:"They prefer their monster. The priest calls you a fool.",fx:{happy:-2,piety:-1}},
          },
          {
            t: "Buy a charm, just in case",
            r: "Two pennies for a little bag of herbs. The killing goes on.",
            fx: {coin:-1,piety:1},
          },
        ],
      },
      {
        id: "pf_track_forester",
        cond: (p,C)=>pro(p,C,"tracking",35)&&!C.job(p)&&!C.noble(p)&&C.terr(p,"forest","hills"),
        w: .6,
        once: !0,
        setup: (p,ctx)=>{ctx.fst=nm(p,"M")},
        title: "The forester's offer",
        text: `{fst}, the lord's forester, has caught you three times following deer in the chase and let you go three times. "You read the ground like a book. I need someone who can catch poachers, not be one. Bread, a hut, and a hunter's share."`,
        choices: [
          {
            t: "Take the post",
            r: "You get a green coat, a hut at the forest edge, and the job of hunting your own kind.",
            fx: {job:"hunter",skill:{tracking:2,survival:1},newRel:{type:"mentor",op:25}},
          },
          {
            t: "Take it, and quietly let the hungry ones go",
            r: "You catch the gangs who poach for sale, and miss the widows who take a rabbit. {fst} pretends not to notice.",
            fx: {job:"hunter",honor:2,skill:{tracking:2}},
          },
          {t:"Refuse",r:'"Then stay out of the chase," {fst} says. "Next time I will not see you."',fx:{}},
        ],
      },
      {
        id: "pf_sea_boy",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=8&&C.coast(p),
        once: !0,
        w: .6,
        title: "First time out",
        text: p=>`${p.realm==="POL-14"?"Greyhaven children go to sea at ten, and today it is your turn.":"A fisherman needs a child to bail and coil rope."} The boat is small and the sea is grey, and everyone else is very calm about it.`,
        choices: [
          {
            t: "Go out and work",
            check: {s:"sta",s2:"ins",d:22},
            win: {
              r: "You are not sick once. You coil, bail, and haul a net with them. The skipper says you have sea legs, and he does not say that often.",
              fx: {apt:{sea:1.3},skill:{sea:3},happy:4},
            },
            lose: {r:"You are sick nine times. On the tenth you haul a net anyway.",fx:{skill:{sea:1},wil:1.5}},
          },
          {
            t: "Ask the skipper to teach you the knots",
            r: "Bowline, sheet bend, clove hitch. Your fingers learn them faster than your head.",
            fx: {skill:{sea:2},int:.2},
          },
          {t:"Stay on the quay",r:"You watch the sails go out. Next time, maybe.",fx:{}},
        ],
      },
      {
        id: "pf_sea_storm",
        cond: (p,C)=>pro(p,C,"sea",40)&&C.coast(p),
        w: .9,
        cool: 6,
        setup: (p,ctx)=>{ctx.skip=nm(p,"M")},
        title: "The helm",
        text: "A squall off the headland, out of nowhere. The mast cracks, the skipper {skip} is thrown against the rail and lies there with blood in his hair, and the coaster is turning broadside to the waves.",
        choices: [
          {
            t: "Take the helm",
            check: {s:"sea",s2:"wil",d:55},
            win: {
              r: "You bring her head to the wind and hold it there for six hours. At dawn you limp into harbor. The owners give you twenty suns and a berth as mate.",
              fx: {coin:20,fame:3,skill:{sea:4},wil:1.5,newRel:{type:"friend",op:30}},
            },
            lose: {
              r: "She broaches. You cling to the wreck of the mast until a fishing boat finds you. The cargo is gone.",
              fx: {health:-15,wil:3,happy:-6,cause:"shipwreck"},
            },
          },
          {
            t: "Cut the broken mast away first",
            check: {s:"sea",s2:"str",d:50},
            win: {
              r: "Axe, rope, splinters. The mast goes over the side and the ship rights. You row her home under a rag of sail.",
              fx: {coin:10,fame:2,skill:{sea:3}},
            },
            lose: {
              r: "The mast takes you over the side with it. You come up gasping and they haul you in.",
              fx: {health:-12,wound:"broken_ribs",cause:"the sea"},
            },
          },
          {
            t: "Lash yourself to the mast and pray",
            r: "{god} is merciful, or the sea is bored. You live. So does the ship, barely.",
            fx: {piety:3,wil:2,health:-5,cause:"the storm"},
          },
        ],
      },
      {
        id: "pf_sea_galley_race",
        cond: (p,C)=>C.adult(p)&&C.coast(p)&&!C.old(p)&&(C.prof(p,"sea",30)||C.job(p,"sailor")||C.job(p,"fish")),
        w: .7,
        cool: 5,
        setup: (p,ctx)=>{ctx.prize=p.realm==="POL-04"?"The Lucerna lagoon crew that wins drinks free until Sea Closing.":"The winning crew splits a purse of fifty suns and drinks free all night."},
        title: "Sea Opening",
        text: "Sea Opening, 1 April, and the galley crews race across the harbor. {prize} Your crew needs a stroke oar, and they look at you.",
        choices: [
          {
            t: "Take the stroke oar and set the pace",
            check: {s:"sea",s2:"sta",d:50},
            win: {
              r: "Your stroke never breaks. You win by a boat's length and are carried up the quay on their shoulders.",
              fx: {fame:3,coin:10,skill:{sea:2},sta:.6,happy:6},
            },
            lose: {
              r: "You set the pace too fast. By halfway the crew is blown. Fourth.",
              fx: {skill:{sea:1},sta:.4,happy:-2},
            },
          },
          {
            t: "Steer instead",
            check: {s:"sea",s2:"int",d:48},
            win: {
              r: "You cut the turn so close you scrape the buoy. Nobody else dares. First.",
              fx: {fame:2,coin:10,skill:{sea:2}},
            },
            lose: {r:"You clip the buoy and spin out. The crowd laughs for a week.",fx:{fame:-1}},
          },
          {
            t: "Cheer from the quay",
            r: "You drink with the winners anyway. They are generous tonight.",
            fx: {happy:2},
          },
        ],
      },
      {
        id: "pf_sea_pilot",
        cond: (p,C)=>pro(p,C,"sea",55)&&C.coast(p),
        w: .6,
        once: !0,
        setup: (p,ctx)=>{ctx.mst=nm(p,"M")},
        title: "The pilot's berth",
        text: "{mst}, master of a fat cog, needs a pilot to bring her through the shoals at the river mouth, where sandbars move every winter. A pilot makes sixty suns a month and a share. A pilot who puts a cog on the sand makes nothing ever again.",
        choices: [
          {
            t: "Take her in",
            check: {s:"sea",s2:"int",d:58},
            win: {
              r: "Lead line, water color, the way the gulls sit. You bring her in without touching. {mst} hires you for the season.",
              fx: {coin:60,fame:2,skill:{sea:3},newRel:{type:"friend",op:25},flag:"pf_pilot"},
            },
            lose: {
              r: "The bar has moved. She grounds and you spend two days kedging her off. No pay, and the story follows you.",
              fx: {fame:-2,happy:-6,wil:1.5},
            },
          },
          {
            t: "Wait for the tide and sound the channel first",
            check: {s:"sea",s2:"logistics",d:48},
            win: {r:"A day lost, a channel found. {mst} grumbles, but pays.",fx:{coin:40,skill:{sea:2}}},
            lose: {r:"You sound it twice and still are not sure. {mst} hires someone else.",fx:{}},
          },
          {t:"Decline",r:"Better a fisherman with a good name than a pilot with a bad one.",fx:{}},
        ],
      },
      {
        id: "pf_sea_overboard",
        cond: (p,C)=>C.adult(p)&&C.coast(p)&&(C.prof(p,"sea",30)||C.prof(p,"athletics",40)),
        w: .7,
        cool: 8,
        setup: (p,ctx)=>{who(p,ctx,"friend")},
        title: "Man overboard",
        text: 'Rough water, a wet deck, and {themFull} goes over the rail. {They} cannot swim; few sailors can. "Drinking with the Queen," the old hands call it, and they say it calmly because it happens so often.',
        choices: [
          {
            t: "Go in after {themHim}",
            check: {s:"athletics",s2:"sea",d:52},
            win: {
              r: "Cold, grey, and {theyHe} is fighting you. You get an arm round {themHim} and they haul you both up on a rope.",
              fx: {fame:2,honor:5,them:{type:"friend",op:40},skill:{athletics:2,sea:1}},
            },
            lose: {
              r: "{They} drags you under in panic. They pull you up alone, coughing water. {They} is gone.",
              fx: {health:-12,wound:"lungs",happy:-10,wil:3,cause:"drowning"},
            },
          },
          {
            t: "Throw a line and talk {themHim} onto it",
            check: {s:"sea",s2:"ins",d:48},
            win: {
              r: "The line lands across {theirHis} chest. You haul. {They} lives.",
              fx: {honor:3,them:{type:"friend",op:30},skill:{sea:2}},
            },
            lose: {r:"The line falls short twice. The third time there is nobody to throw it to.",fx:{happy:-8,wil:2}},
          },
          {
            t: "Shout for the master",
            r: "By the time the ship comes about, the sea is empty.",
            fx: {happy:-6,wil:1},
          },
        ],
      },
      {
        id: "pf_pers_kid_tongue",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=8,
        once: !0,
        w: .5,
        title: "The broken window",
        setup: (p,ctx)=>{ctx.own=nm(p,"M")},
        text: "Your ball has gone through {own}'s new glass window, the only one on the street. {own} has you by the ear and is marching you home to {father}.",
        choices: [
          {
            t: "Talk, fast and well",
            check: {s:"int",s2:"wil",d:22},
            win: {
              r: "By the time you reach your door, {own} is laughing, has forgiven you, and has promised you a penny to run errands. {father} stares at you as if you were a stranger.",
              fx: {apt:{persuasion:1.35},skill:{persuasion:3},happy:4},
            },
            lose: {r:"{own} is not in the mood. Neither is {father}.",fx:{happy:-3,skill:{persuasion:1},family:-2}},
          },
          {
            t: "Offer to work off the cost",
            r: "A month of sweeping {own}'s shop. You learn a lot about glass, and about owning up.",
            fx: {honor:2,sta:.2,skill:{craft:1}},
          },
          {
            t: "Blame the neighbor's boy",
            check: {s:"int",s2:"ins",d:24},
            win: {
              r: "Somehow it works. The neighbor's boy gets the beating. You feel strange about it for a long time.",
              fx: {skill:{deception:2},honor:-2},
            },
            lose: {
              r: "Nobody believes you. Two beatings: one for the window, one for the lie.",
              fx: {health:-2,happy:-4},
            },
          },
        ],
      },
      {
        id: "pf_pers_mob",
        cond: (p,C)=>pro(p,C,"persuasion",45),
        w: 1,
        cool: 8,
        setup: (p,ctx)=>{ctx.acc=A.pick(["a foreign tinker","an old herbwife","a half-elf peddler","a stranger seen near the well"]),ctx.crime=A.pick(["poisoning the well","witching the cattle sick","bringing the fever","stealing a child"])},
        title: "The rope",
        text: "The square at {home} is full. They have {acc} on a cart with a rope over a beam, and the charge is {crime}. Nobody has asked for proof. Nobody is going to, unless you do.",
        choices: [
          {
            t: "Climb on the cart and speak",
            check: {s:"persuasion",s2:"wil",d:55},
            win: {
              r: "You talk about proof, about the reeve's court, about how it would feel to be the stranger. One by one they lower their eyes. The rope comes down.",
              fx: {fame:4,honor:6,skill:{persuasion:3},wil:1,deed:"talked a mob off a hanging"},
            },
            lose: {
              r: "A stone hits you in the mouth. They hang the stranger anyway, and they remember who stood with the stranger.",
              fx: {health:-8,wound:"scar_face",honor:4,happy:-8,wil:2,cause:"a stone from a mob"},
            },
          },
          {
            t: "Point them at the real culprit",
            req: (p,C)=>C.prof(p,"deception",30)||C.prof(p,"intrigue",30),
            check: {s:"persuasion",s2:"intrigue",d:48},
            win: {
              r: "You remind them that the dead rat in the well came from the tanner's yard upstream. The mob goes to shout at the tanner. The stranger slips away.",
              fx: {honor:3,skill:{persuasion:2,intrigue:1},fame:1},
            },
            lose: {r:"They do not want a dead rat. They want a hanging.",fx:{happy:-6,wil:1}},
          },
          {
            t: "Go and fetch the reeve",
            check: {s:"athletics",s2:"persuasion",d:45},
            win: {
              r: "You come back at a run with the reeve and his men. The stranger is taken to the lockup, alive.",
              fx: {honor:3,favor:1},
            },
            lose: {r:"By the time you come back with the reeve, it is over.",fx:{happy:-6}},
          },
          {t:"Stay out of it",r:"You go home and bar the door. You hear it anyway.",fx:{happy:-5,honor:-2}},
        ],
      },
      {
        id: "pf_pers_before_lord",
        cond: (p,C)=>pro(p,C,"persuasion",50)&&!C.noble(p),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{ctx.claim=A.pick(["the monastery's claim to the village common","a new toll on the bridge","a doubled labor-due at harvest","the lord's right to fell the village wood"]),ctx.lordn=nm(p,"M")},
        title: "The case before the lord",
        text: "Court day at the manor. The village has chosen you to speak against {claim}. Lord {lordn} sits in the great chair, bored, with the steward whispering at his ear.",
        choices: [
          {
            t: "Argue from custom and old charters",
            check: {s:"persuasion",s2:"learning",d:55},
            win: {
              r: "You cite the old custom and a charter nobody else remembered. The lord is amused, then convinced. The claim is dropped. The village carries you home.",
              fx: {fame:3,skill:{persuasion:3,learning:1},honor:3,happy:5},
            },
            lose: {
              r: "The steward has a better charter, or a better forger. The claim stands, and you are marked as a troublemaker.",
              fx: {happy:-4,favor:-3,wil:1},
            },
          },
          {
            t: "Appeal to the lord's pride",
            check: {s:"persuasion",s2:"etiquette",d:50},
            win: {
              r: '"A great lord does not need to take from his own people." He likes the sound of that. The claim is halved.',
              fx: {fame:2,skill:{persuasion:2},favor:2},
            },
            lose: {r:"He hears flattery and is insulted by it.",fx:{favor:-4,happy:-3}},
          },
          {
            t: "Bribe the steward instead (20 suns)",
            req: p=>p.coin>=20,
            r: "The steward finds an error in his own papers. The village never learns what it cost you.",
            fx: {coin:-20,honor:-1,fame:1},
          },
        ],
      },
      {
        id: "pf_pers_moot",
        cond: (p,C)=>pro(p,C,"persuasion",35)&&!C.ruler(p),
        w: .8,
        cool: 6,
        setup: (p,ctx)=>{who(p,ctx,"rival"),ctx.moot=inR(p,"POL-08","POL-09","POL-23","POL-01","POL-14")?"the Thing":inR(p,"POL-13")?"the valley council":inR(p,"POL-11","POL-12","POL-34","POL-19")?"the gathering of the clan":"the village moot"},
        title: "Speaking at the moot",
        text: "{moot} must choose a new reeve. {themFull} wants it, and has been buying ale for weeks. Someone shouts your name.",
        choices: [
          {
            t: "Stand and speak for yourself",
            check: {s:"persuasion",s2:"int",d:50},
            win: {
              r: "You speak plainly and well. When the hands go up, there are more for you. You are reeve for a year, and {them} will never forgive it.",
              fx: {fame:2,coin:10,skill:{persuasion:2,stewardship:1},them:{type:"rival",op:-20},flag:"pf_reeve"},
            },
            lose: {
              r: "The ale wins. {They} is reeve, and gives you the worst ditch to dig.",
              fx: {happy:-3,them:{type:"rival",op:-5}},
            },
          },
          {
            t: "Speak for a third candidate",
            check: {s:"persuasion",s2:"diplomacy",d:45},
            win: {
              r: "Your candidate wins. You did not need the job. You needed {them} not to have it.",
              fx: {skill:{persuasion:2},newRel:{type:"friend",op:25}},
            },
            lose: {r:"Nobody listens. {They} wins.",fx:{}},
          },
          {t:"Stay quiet",r:"{They} becomes reeve. The ale was good.",fx:{happy:1}},
        ],
      },
      {
        id: "pf_pers_bad_cloth",
        cond: (p,C)=>pro(p,C,"persuasion",40)||C.adult(p)&&C.prof(p,"trade",45),
        w: .7,
        cool: 8,
        setup: (p,ctx)=>{ctx.mer=nm(p,"M")},
        title: "Sand in the desert",
        text: "{mer} has a cartload of cloth dyed a sickly green by a drunk dyer. Nobody will touch it. He bets you a sun that you cannot sell a single bolt by market close. Half of anything you sell is yours.",
        choices: [
          {
            t: "Sell it as the newest color from the capital",
            check: {s:"persuasion",s2:"deception",d:48},
            win: {
              r: `"The color of spring at court." By noon the reeve's wife has bought two bolts, and then everybody wants it. You sell the cart.`,
              fx: {coin:25,skill:{persuasion:3},fame:1},
            },
            lose: {
              r: "People laugh. You sell one bolt to a blind man, and feel bad about it.",
              fx: {coin:-1,skill:{persuasion:1}},
            },
          },
          {
            t: "Sell it honestly, cheap, as work cloth",
            check: {s:"trade",s2:"persuasion",d:42},
            win: {
              r: "Cheap, strong, ugly. The farmhands buy it all for work smocks. {mer} breaks even, and grins.",
              fx: {coin:10,skill:{trade:2},honor:1},
            },
            lose: {r:"Even cheap, nobody wants it. You pay your sun.",fx:{coin:-1}},
          },
          {t:"Decline the bet",r:"{mer} goes off to find another fool. He does not find one.",fx:{}},
        ],
      },
      {
        id: "pf_dipl_kid_peace",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=8,
        once: !0,
        w: .4,
        title: "Two friends, one ball",
        text: "Your two best friends are rolling in the dust, fists flying, over who owns a leather ball. Everyone else is cheering them on.",
        choices: [
          {
            t: "Step between them and make them each say why",
            check: {s:"wil",s2:"int",d:22},
            win: {
              r: "It turns out they both lost a ball and found one. By the end, they agree to share it, and both think it was their idea.",
              fx: {apt:{diplomacy:1.3},skill:{diplomacy:3},happy:3},
            },
            lose: {
              r: "They both punch you instead. At least they stop punching each other.",
              fx: {health:-2,skill:{diplomacy:1},wil:.5},
            },
          },
          {
            t: "Take the ball and run",
            r: "Now they are both chasing you, and friends again. It works, in a way.",
            fx: {spd:.3,happy:2},
          },
          {t:"Cheer for one of them",r:"Your side wins. The other one stops speaking to you.",fx:{happy:-1}},
        ],
      },
      {
        id: "pf_dipl_boundary",
        cond: (p,C)=>pro(p,C,"diplomacy",40),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{ctx.f1=nm(p,"M"),ctx.f2=nm(p,"F")},
        title: "The boundary stone",
        text: p=>`${p.realm==="POL-18"?"In Tamar, moving a boundary stone is a crime nearly as old as the dykes.":"Somebody has moved the boundary stone between two fields."} {f1}'s family says {f2}'s did it, and {f2}'s family says the stone has always been there. There has already been one broken head. Both families say they will listen to you.`,
        choices: [
          {
            t: "Walk the bounds with the oldest folk in the village",
            check: {s:"diplomacy",s2:"learning",d:48},
            win: {
              r: "The old ones remember the old oak, the old ditch, the old line. The stone goes back to where it belongs, and both families can say they were right about something.",
              fx: {honor:4,fame:2,skill:{diplomacy:3}},
            },
            lose: {
              r: "The old ones disagree as well. Now four families are fighting.",
              fx: {happy:-3,skill:{diplomacy:1}},
            },
          },
          {
            t: "Split the strip down the middle",
            check: {s:"diplomacy",s2:"wil",d:45},
            win: {
              r: "Neither family is happy, which is how you know it is fair. The fighting stops.",
              fx: {honor:2,skill:{diplomacy:2}},
            },
            lose: {r:"Both families decide they hate you more than each other.",fx:{happy:-3}},
          },
          {
            t: "Take a gift from one side and rule for them",
            r: "{f1}'s family gives you a cask of ale. You find for them. {f2}'s family will remember it.",
            fx: {coin:4,honor:-4,newRel:{type:"enemy",op:-25}},
          },
        ],
      },
      {
        id: "pf_dipl_border_captain",
        cond: (p,C)=>pro(p,C,"diplomacy",55),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{ctx.bc=nm(p,"M")},
        title: "Across the border",
        text: "Raiders from across the border took forty head of cattle from your district, and your people want to ride over and take eighty back. The lord would rather not start a war over cows. He sends you to talk to the border captain on the other side, {bc}.",
        choices: [
          {
            t: "Negotiate the cattle back",
            check: {s:"diplomacy",s2:"persuasion",d:55},
            win: {
              r: "Three days of talk, two feasts and one hangover. Thirty-five head come back, and the raiders are fined by their own lord. Nobody dies.",
              fx: {fame:3,favor:5,skill:{diplomacy:3},coin:15,newRel:{type:"friend",op:20}},
            },
            lose: {
              r: "{bc} will not budge. You come home with nothing, and the young men ride anyway.",
              fx: {favor:-2,happy:-4,wil:1},
            },
          },
          {
            t: "Offer a marriage to end the raiding for good",
            req: (p,C)=>C.prof(p,"diplomacy",65),
            check: {s:"diplomacy",s2:"etiquette",d:55},
            win: {
              r: "A daughter of one valley for a son of the other. Raiding your in-laws is bad manners. It works for a generation.",
              fx: {fame:4,favor:6,honor:3,skill:{diplomacy:3},deed:"ended a border feud with a marriage"},
            },
            lose: {r:"{bc} takes it as an insult to his family. The talks end.",fx:{favor:-3}},
          },
          {
            t: "Threaten him",
            check: {s:"intimidation",s2:"diplomacy",d:52},
            win: {
              r: "He believes you. Twenty head come back. He will look for a chance to repay you.",
              fx: {favor:2,skill:{intimidation:2},newRel:{type:"enemy",op:-20}},
            },
            lose: {r:"He laughs you out of his hall.",fx:{favor:-3,happy:-3}},
          },
        ],
      },
      {
        id: "pf_dipl_match",
        cond: (p,C)=>pro(p,C,"diplomacy",45)&&(C.town(p)||C.rich(p)),
        w: .7,
        cool: 10,
        setup: (p,ctx)=>{ctx.h1=nm(p,"M"),ctx.h2=nm(p,"F")},
        title: "Two houses",
        text: "The houses of {h1} and {h2} have been in a trade war for ten years. Now {h1}'s son and {h2}'s daughter want to marry, and both parents want to stop it. Both families ask you, privately, to stop it on their behalf. The young pair ask you to make it happen.",
        choices: [
          {
            t: "Make the match, and make both houses think they won",
            check: {s:"diplomacy",s2:"trade",d:55},
            win: {
              r: "A dowry here, a shared warehouse there, a toast at the wedding where both fathers believe they outwitted the other. Both houses pay you a fee.",
              fx: {coin:40,fame:2,skill:{diplomacy:3},happy:4},
            },
            lose: {
              r: "Both houses work out what you were doing. Neither will have you in the door.",
              fx: {happy:-3,newRel:{type:"enemy",op:-20}},
            },
          },
          {
            t: "Do what the parents want",
            r: "You find reasons, and the match falls apart. The parents pay well. The young pair do not speak to you again.",
            fx: {coin:25,honor:-2},
          },
          {t:"Refuse to meddle",r:"They elope in the end. Love does what it wants.",fx:{}},
        ],
      },
      {
        id: "pf_dipl_hostage",
        cond: (p,C)=>pro(p,C,"diplomacy",50)&&(C.atWar(p)||C.soldier(p)||C.famMil(p)),
        w: .7,
        cool: 10,
        setup: (p,ctx)=>{ctx.hos=nm(p)},
        title: "An exchange of prisoners",
        text: "{enemy} holds a dozen of your people from a skirmish, and your side holds a few of theirs, including {hos}, a knight's heir worth more than all twelve. Someone has to carry the white branch across the field and agree the terms.",
        choices: [
          {
            t: "Carry the white branch",
            check: {s:"diplomacy",s2:"wil",d:52},
            win: {
              r: "Twelve for {hos}, plus the bodies of the dead returned for burial. The men who come home know your name.",
              fx: {fame:3,honor:4,skill:{diplomacy:3},merit:4},
            },
            lose: {
              r: "They want too much. You come back with six, and the other six wait another season.",
              fx: {honor:1,wil:1,skill:{diplomacy:1}},
            },
          },
          {
            t: "Hold out for gold as well",
            check: {s:"diplomacy",s2:"trade",d:58},
            win: {
              r: "Twelve, and a hundred suns of ransom besides. Your captain is delighted. Some think it unseemly.",
              fx: {coin:30,merit:5,fame:2,honor:-1},
            },
            lose: {r:"They break off the talks. Two of the twelve die in the meantime.",fx:{honor:-3,happy:-6,wil:1}},
          },
          {t:"Let someone braver go",r:"Someone else goes. They do fine.",fx:{}},
        ],
      },
      {
        id: "pf_etiq_page",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=8&&(["gentry","noble","royal","artisan","servant"].includes(p.status)||C.family(p)),
        once: !0,
        w: .4,
        title: "The great table",
        text: "You are serving at the lord's table for the first time: carry the ewer, pour the wine, stand still, say nothing. A guest's cup is empty and two lords are looking at you.",
        choices: [
          {
            t: "Pour for the higher-ranked one first",
            check: {s:"int",s2:"ins",d:22},
            win: {
              r: "You guess right, by the cut of the coat and the chair. The old steward notices, and from then on you serve at the high table.",
              fx: {apt:{etiquette:1.3},skill:{etiquette:3},happy:3},
            },
            lose: {
              r: "You pour for the wrong one. The other's face goes cold. The steward boxes your ear in the pantry.",
              fx: {skill:{etiquette:1},happy:-2},
            },
          },
          {t:"Freeze",r:"Another page pours. You are sent back to the kitchens to scrub pots.",fx:{happy:-2}},
        ],
      },
      {
        id: "pf_etiq_precedence",
        cond: (p,C)=>pro(p,C,"etiquette",35)&&(C.noble(p)||p.status==="gentry"||C.job(p,"courtier")||C.job(p,"servant")||C.rich(p)),
        w: .9,
        cool: 6,
        setup: (p,ctx)=>{ctx.b=nm(p,"M"),ctx.k=nm(p,"M")},
        title: "Below the salt",
        text: "At the great feast you notice it before anyone else: the steward has seated Baron {b} below Sir {k}. The baron has not seen yet. When he does, there will be a scene, and maybe a sword.",
        choices: [
          {
            t: "Fix it quietly with the steward",
            check: {s:"etiquette",s2:"int",d:45},
            win: {
              r: "A word, a swapped place-card, a cup of wine for the knight. Nobody knows anything happened, except the host, who sends you a gift.",
              fx: {skill:{etiquette:3},fame:1,coin:10,favor:2},
            },
            lose: {
              r: "Too late. The baron sees it and walks out. The host blames whoever was nearest: you.",
              fx: {happy:-3,favor:-2},
            },
          },
          {
            t: "Let it happen and watch",
            r: "The baron goes red, then white. The host spends a fortune making amends. Very entertaining.",
            fx: {happy:2,skill:{intrigue:1}},
          },
          {
            t: "Point it out loudly, to show your knowledge",
            r: "You are right, and everyone hates you for it.",
            fx: {skill:{etiquette:1},fame:-1,happy:-2},
          },
        ],
      },
      {
        id: "pf_etiq_elf_envoy",
        cond: (p,C)=>pro(p,C,"etiquette",50),
        w: .7,
        cool: 10,
        setup: (p,ctx)=>{ctx.guest=A.pick(["an elf envoy from the forest courts","a dwarf factor from the holds","a Sand Clan speaker","an envoy of the Abbot of Skyhold"])},
        title: "The foreign guest",
        text: "Your host is entertaining {guest}, and nobody in the house knows what is proper. Bow or not? Offer meat or not? Speak first or wait? They look at you, the one who knows these things.",
        choices: [
          {
            t: "Guide the whole evening",
            check: {s:"etiquette",s2:"learning",d:52},
            win: {
              r: "The right greeting, the right food, the right silences. The guest leaves pleased and the trade agreement is signed. Your host thinks you are a treasure.",
              fx: {skill:{etiquette:3},fame:2,coin:15,favor:3},
            },
            lose: {
              r: "You get the greeting right and the food very wrong. The guest leaves early, coldly polite.",
              fx: {favor:-3,happy:-3},
            },
          },
          {
            t: "Ask the guest's own servant quietly",
            check: {s:"persuasion",s2:"etiquette",d:45},
            win: {
              r: "The servant tells you everything, for a small gift. The evening goes smoothly.",
              fx: {skill:{etiquette:2},coin:-2},
            },
            lose: {r:"The servant tells you wrong on purpose. Servants have their own feuds.",fx:{happy:-2}},
          },
          {t:"Keep your head down",r:"It is not your feast to save. It is not saved.",fx:{}},
        ],
      },
      {
        id: "pf_etiq_upstart",
        cond: (p,C)=>pro(p,C,"etiquette",40),
        w: .7,
        cool: 10,
        setup: (p,ctx)=>{ctx.mer=nm(p,"M"),ctx.dau=nm(p,"F")},
        title: "Manners for money",
        text: '{mer}, a wool merchant richer than half the barons, has bought his daughter {dau} a place at court. She eats with her knife, laughs like a goose and calls everyone "sir". He offers 30 suns for a season of lessons.',
        choices: [
          {
            t: "Teach her well",
            check: {s:"etiquette",s2:"persuasion",d:45},
            win: {
              r: "By midsummer she can curtsey to a duke and snub a baron without a word. She marries a knight. {mer} pays double.",
              fx: {coin:60,skill:{etiquette:2},newRel:{type:"friend",op:25}},
            },
            lose: {r:"She learns the forms, but the court smells the wool on her. {mer} pays, sourly.",fx:{coin:30}},
          },
          {
            t: "Teach her, and use her to get into court yourself",
            req: (p,C)=>C.prof(p,"intrigue",30),
            r: "Where she goes, her teacher goes. You meet people you would never have met.",
            fx: {coin:30,skill:{intrigue:2},flag:"pf_court_door"},
          },
          {
            t: "Refuse. Some things cannot be bought.",
            r: '{mer} laughs. "Everything can be bought." He finds someone else.',
            fx: {},
          },
        ],
      },
      {
        id: "pf_etiq_slip",
        cond: (p,C)=>C.adult(p)&&(C.noble(p)||C.job(p,"courtier"))&&!C.prof(p,"etiquette",45),
        w: .7,
        cool: 6,
        setup: (p,ctx)=>{ctx.lady=nm(p,"F")},
        title: "The wrong title",
        text: "At court you greet Lady {lady} by a title she lost when her husband died. The ladies nearby go silent. In a court, a slip like this can follow you for years.",
        choices: [
          {
            t: "Turn it into a compliment",
            check: {s:"etiquette",s2:"persuasion",d:45},
            win: {
              r: '"Forgive me, my lady. I still think of you as you deserve to be." She smiles. The ladies relax. You may even have made a friend.',
              fx: {skill:{etiquette:2},newRel:{type:"friend",op:15}},
            },
            lose: {r:"You make it worse. Much worse.",fx:{fame:-2,happy:-4,skill:{etiquette:1}}},
          },
          {
            t: "Apologize humbly and at once",
            r: "It is clumsy, but honest. She forgives you, and the gossips find someone else by supper.",
            fx: {skill:{etiquette:2},honor:1},
          },
          {
            t: "Pretend it did not happen",
            r: "It happened. Everyone heard. You hear about it for a year.",
            fx: {fame:-1,happy:-3},
          },
        ],
      },
      {
        id: "pf_dec_jug",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=7,
        once: !0,
        w: .4,
        title: "The broken jug",
        text: "You broke {mother}'s good jug, the one from her own mother. The pieces are under the bench. The cat is asleep on the windowsill. {mother} is coming in.",
        choices: [
          {
            t: "The cat did it",
            check: {s:"int",s2:"ins",d:22},
            win: {
              r: "Your face is perfectly sad and perfectly innocent. The cat is thrown out. You are given a honey cake for being upset. Lies are easy, it turns out.",
              fx: {apt:{deception:1.3},skill:{deception:3},honor:-1},
            },
            lose: {
              r: "{mother} looks at the cat, then at you, and knows. The punishment is for the lie, not the jug.",
              fx: {happy:-3,rel:{who:"mother",op:-5}},
            },
          },
          {
            t: "Tell the truth",
            r: "She is sad, not angry, which is worse. But she hugs you after.",
            fx: {honor:2,rel:{who:"mother",op:5}},
          },
        ],
      },
      {
        id: "pf_dec_relics",
        cond: (p,C)=>pro(p,C,"deception",40)&&!C.trait(p,"honest"),
        w: .8,
        cool: 8,
        setup: (p,ctx)=>{ctx.mate=nm(p,"M")},
        title: "Saint's bones",
        text: p=>`${p.realm==="POL-02"?"Pilgrims crowd the roads to Solenne, and sellers of false relics work every inn.":"A pilgrim road passes through {home}, and pilgrims buy anything holy."} {mate} has a sack of chicken bones, a pot of grave-dust from the churchyard and a plan. "You do the talking. You are better at it."`,
        choices: [
          {
            t: "Do the talking",
            check: {s:"deception",s2:"faith",d:48},
            win: {
              r: "A finger-bone of a saint, a pinch of dust from a holy grave. The pilgrims weep with gratitude. You split forty suns.",
              fx: {coin:20,skill:{deception:3},honor:-5,piety:-4},
            },
            lose: {
              r: "A priest among the pilgrims knows his saints. You are both run out of town with rotten cabbages.",
              fx: {fame:-2,honor:-4,health:-2,punish:"theft"},
            },
          },
          {
            t: "Expose {mate} to the pilgrims",
            r: "The pilgrims thank you and give {mate} a beating. {mate} will want words with you.",
            fx: {honor:3,piety:2,newRel:{type:"enemy",op:-30}},
          },
          {t:"Refuse",r:"{mate} goes off alone. He is caught on the second day.",fx:{}},
        ],
      },
      {
        id: "pf_dec_messenger",
        cond: (p,C)=>pro(p,C,"deception",50),
        w: .8,
        cool: 8,
        setup: (p,ctx)=>{ctx.why=A.pick(["see a friend held in the castle lockup","get a cart of goods through the toll without paying","reach a lover locked in a merchant's house","get into the lord's feast"])},
        title: "A borrowed face",
        text: "You need to {why}. There is a gate and a guard. You have a good cloak, a wax seal you found, and a straight face.",
        choices: [
          {
            t: "Pose as the lord's messenger",
            check: {s:"deception",s2:"etiquette",d:52},
            win: {
              r: '"Urgent, from his lordship." You wave the seal, look bored, and walk in. Nobody ever asks.',
              fx: {skill:{deception:3},happy:4,fame:1},
            },
            lose: {
              r: "The guard has seen the real messenger. He is a short man with a limp. You are neither.",
              fx: {health:-6,punish:"theft",honor:-2},
            },
          },
          {
            t: "Pose as a priest bringing the last rites",
            check: {s:"deception",s2:"faith",d:48},
            win: {
              r: "Nobody stops a priest on the way to a deathbed. You are in.",
              fx: {skill:{deception:2,faith:1},piety:-2},
            },
            lose: {
              r: "The guard asks you a question about {faith} that any priest would know.",
              fx: {health:-4,piety:-2,happy:-3},
            },
          },
          {
            t: "Just bribe the guard (5 suns)",
            req: p=>p.coin>=5,
            r: "Five suns. Lies are cheaper, but this is surer.",
            fx: {coin:-5},
          },
        ],
      },
      {
        id: "pf_dec_unraveled",
        cond: (p,C)=>pro(p,C,"deception",35)&&(C.trait(p,"deceitful")||C.prof(p,"deception",55)),
        w: .7,
        cool: 10,
        setup: (p,ctx)=>{who(p,ctx,"friend")},
        title: "The lie comes home",
        text: "Years ago you told {themFull} a lie, a good one, about who you were and where you came from. Now someone from your past has come to {home}, and is talking to {themHim} right now, across the market square.",
        choices: [
          {
            t: "Get there first and spin a bigger story",
            check: {s:"deception",s2:"int",d:52},
            win: {
              r: "By the time they finish talking, {them} believes the stranger is a madman with a grudge. You are safe. For now.",
              fx: {skill:{deception:3},honor:-2},
            },
            lose: {
              r: "Your story has a hole in it, and {them} finds it. {They} looks at you as if you were a stranger.",
              fx: {them:{op:-40},happy:-6,wil:1},
            },
          },
          {
            t: "Tell {themHim} the truth yourself, before the stranger can",
            r: "It is the hardest thing you have done in years. {They} is hurt. But {theyHe} stays.",
            fx: {them:{op:-10},honor:4,wil:1.5,untrait:"deceitful"},
          },
          {
            t: "Leave town for a while",
            r: "You find business elsewhere for a season. When you come back, the stranger has gone, and so has some of {them}'s warmth.",
            fx: {them:{op:-15},happy:-3},
          },
        ],
      },
      {
        id: "pf_dec_card_sharp",
        cond: (p,C)=>pro(p,C,"deception",45)&&(C.prof(p,"gambling",25)||C.town(p)),
        w: .7,
        cool: 8,
        setup: (p,ctx)=>{ctx.mark=nm(p,"M")},
        title: "The country cousin",
        text: "{mark}, a fat farmer up from the country with his harvest money, is in the alehouse looking for a game. He has never seen the shell game in his life. Everyone at your table is looking at you.",
        choices: [
          {
            t: "Play the simple country lad yourself, and fleece him",
            check: {s:"deception",s2:"gambling",d:48},
            win: {
              r: "You lose small, then win big. He goes home lighter and never knows how.",
              fx: {coin:25,skill:{deception:2,gambling:1},honor:-4},
            },
            lose: {
              r: "He is not as simple as he looks. He catches the switch and breaks your nose.",
              fx: {wound:"broken_nose",health:-6,fame:-1,cause:"a farmer's fist"},
            },
          },
          {
            t: "Warn him off",
            r: "He looks at the table, at you, and buys you a drink instead. The table is not pleased.",
            fx: {honor:3,newRel:{type:"friend",op:15}},
          },
          {t:"Leave him to the others",r:"The others take him for twenty suns. You do not get a share.",fx:{}},
        ],
      },
      {
        id: "pf_intim_stare",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=8,
        once: !0,
        w: .4,
        title: "The bully",
        setup: (p,ctx)=>{ctx.bully=nm(p,"M")},
        text: "{bully} has taken every child's lunch in the lane for a month. Today he comes for yours, and you are too small to fight him.",
        choices: [
          {
            t: "Look him in the eye and say nothing",
            check: {s:"wil",s2:"str",d:22},
            win: {
              r: "You stare. He stares. He looks away first and leaves, muttering. Something in your face did that.",
              fx: {apt:{intimidation:1.3},skill:{intimidation:3},wil:1},
            },
            lose: {r:"He laughs and takes the bread, and cuffs you for staring.",fx:{happy:-3,wil:1}},
          },
          {
            t: "Get the other children to stand together",
            check: {s:"int",s2:"wil",d:22},
            win: {
              r: "Eight small children against one big one. He goes off to bully somewhere else.",
              fx: {skill:{command:2},happy:3},
            },
            lose: {r:"They all run when he raises his fist. You are left alone with him.",fx:{health:-3,wil:1}},
          },
          {t:"Hand over the bread",r:"You go hungry. He grows fat.",fx:{happy:-2}},
        ],
      },
      {
        id: "pf_intim_collector",
        cond: (p,C)=>pro(p,C,"intimidation",40),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{ctx.lender=nm(p,"M"),ctx.debtor=nm(p,"F")},
        title: "The debt",
        text: "{lender} the moneylender wants a debt collected from the widow {debtor}: eight suns, now fourteen with interest. Your share is a third. She has three children and a cow.",
        choices: [
          {
            t: "Collect it: the cow if you must",
            r: "She cries. The children cry. You take the cow. {lender} pays you, and the street looks at you differently.",
            fx: {coin:5,honor:-6,skill:{intimidation:2},trait:"cruel"},
          },
          {
            t: "Lean on {lender} instead",
            check: {s:"intimidation",s2:"wil",d:52},
            win: {
              r: "You tell {lender}, very quietly, that the debt is now eight again, and he will wait until harvest. He agrees, very quickly.",
              fx: {honor:4,skill:{intimidation:3},newRel:{type:"enemy",op:-25}},
            },
            lose: {
              r: "{lender} has bigger friends than you. They visit you that night.",
              fx: {health:-10,wound:"broken_ribs",honor:2,cause:"a beating"},
            },
          },
          {
            t: "Pay the debt yourself (14 suns)",
            req: p=>p.coin>=14,
            r: "You pay it, and tell {debtor} it was a mistake in the books. She will name a child after you.",
            fx: {coin:-14,honor:5,piety:2,newRel:{type:"friend",op:30}},
          },
          {t:"Refuse the work",r:"{lender} finds a harder man. The cow goes anyway.",fx:{}},
        ],
      },
      {
        id: "pf_intim_road",
        cond: (p,C)=>pro(p,C,"intimidation",55),
        w: .8,
        cool: 8,
        title: "One look",
        text: ()=>`${A.pick(["Four","Five","Six"])} ragged men block the road ahead with cudgels and a rusty bill-hook. "Toll," says the biggest. Then he gets a proper look at you, and something in his face changes.`,
        choices: [
          {
            t: "Walk straight at them, slowly",
            check: {s:"intimidation",s2:"wil",d:52},
            win: {
              r: 'You do not speak. You do not stop. They part like grass, and one of them says "sorry" as you pass.',
              fx: {skill:{intimidation:3},fame:1,wil:.5},
            },
            lose: {
              r: "The biggest one is too proud to back down in front of the others.",
              fx: {
                duel: {
                  tier: 2,
                  title: "a proud road-robber",
                  opts: {kind:"duel",lethal:!0,toYield:!0,place:"the road",title:"One look too few"},
                },
              },
            },
          },
          {
            t: "Tell them your name",
            req: (p,C)=>C.fame(p)>=10,
            r: "They know it. They are suddenly very busy elsewhere.",
            fx: {fame:1,skill:{intimidation:1}},
          },
          {t:"Pay them (3 suns)",r:"You pay. They cannot believe their luck.",fx:{coin:-3}},
        ],
      },
      {
        id: "pf_intim_protection",
        cond: (p,C)=>pro(p,C,"intimidation",45)&&(C.town(p)||C.job(p)),
        w: .8,
        cool: 8,
        setup: (p,ctx)=>{ctx.gang=A.pick(["the Lantern Boys","the Saltmen","the Gutter Dogs","the Wharf Rats","the Hooks"]),ctx.boss=nm(p,"M")},
        title: "Protection",
        text: `{gang} have started collecting "protection" on your street: a sun a week from every shop, or accidents happen. Their man {boss} is at your neighbor's door now, and the neighbor is shaking.`,
        choices: [
          {
            t: "Walk over and have a word with {boss}",
            check: {s:"intimidation",s2:"str",d:55},
            win: {
              r: "You stand very close and speak very quietly. {boss} decides this street is not worth the trouble. The whole street brings you gifts for a week.",
              fx: {fame:2,honor:3,skill:{intimidation:3},newRel:{type:"enemy",op:-30}},
            },
            lose: {
              r: "{boss} whistles. Five more come round the corner.",
              fx: {
                duel: {
                  tier: 3,
                  title: "the gang's enforcer",
                  opts: {kind:"brawl",lethal:!1,toYield:!0,place:"the street",title:"Protection"},
                },
              },
            },
          },
          {
            t: "Organize the street to refuse together",
            check: {s:"command",s2:"persuasion",d:50},
            win: {
              r: "Twenty shopkeepers with cudgels at their doors. {gang} goes looking for a softer street.",
              fx: {fame:2,skill:{command:2},honor:3},
            },
            lose: {r:"Half the street pays anyway. The other half gets their windows smashed.",fx:{happy:-4}},
          },
          {
            t: "Pay your sun a week, like everyone",
            r: "It is just another tax. They are all just another tax.",
            fx: {coin:-10,happy:-2},
          },
        ],
      },
      {
        id: "pf_intim_feared",
        cond: (p,C)=>pro(p,C,"intimidation",65),
        w: .6,
        once: !0,
        title: "Children run",
        text: "You notice it in the market: children run when you pass. Stallholders give you their best goods at a discount without being asked. Nobody meets your eye. Your name has become a thing to frighten people with.",
        choices: [
          {
            t: "Good. Fear is a wall around you.",
            r: "You lean into it. Fear opens doors that coin cannot. It also closes some that never reopen.",
            fx: {skill:{intimidation:3},trait:"cruel",happy:-2,fame:2},
          },
          {
            t: "Try to soften it: smile, give, listen",
            check: {s:"persuasion",s2:"wil",d:50},
            win: {
              r: "It takes a long time. A child laughs near you one day instead of running. It feels better than you expected.",
              fx: {honor:3,happy:5,trait:"kind",skill:{persuasion:2}},
            },
            lose: {r:"People think the smile is a trick. It makes them more afraid.",fx:{happy:-4,wil:1}},
          },
          {t:"Shrug",r:"They will think what they think.",fx:{wil:.5}},
        ],
      },
      {
        id: "pf_intr_door",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=8,
        once: !0,
        w: .4,
        title: "Behind the door",
        text: "You are not supposed to be awake. Through the crack in the door you hear {father} and {mother} talking in low voices about money, and about someone called Uncle Bran who is not really an uncle.",
        choices: [
          {
            t: "Listen to every word, and remember",
            check: {s:"int",s2:"ins",d:22},
            win: {
              r: "You remember everything. For years you know things about your family that nobody knows you know. You learn that knowing is a kind of power.",
              fx: {apt:{intrigue:1.3},skill:{intrigue:3},int:.3},
            },
            lose: {r:"A floorboard creaks. You are sent back to bed with a sore bottom and no secrets.",fx:{happy:-1}},
          },
          {t:"Go back to bed",r:"Some doors are better left closed. You sleep well.",fx:{happy:1}},
        ],
      },
      {
        id: "pf_intr_steward",
        cond: (p,C)=>pro(p,C,"intrigue",40),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{ctx.stew=nm(p,"M")},
        title: "Two sets of books",
        text: "You have pieced it together from a dozen small things: {stew}, steward of the manor, keeps two sets of books. The lord sees one. The other is in a box under {stew}'s bed, and it is worth a great deal to the right person.",
        choices: [
          {
            t: "Tell the lord",
            check: {s:"intrigue",s2:"persuasion",d:48},
            win: {
              r: "You bring proof, not gossip. {stew} is turned out, and the lord remembers who was useful.",
              fx: {favor:6,honor:3,fame:1,skill:{intrigue:2},newRel:{type:"enemy",op:-40}},
            },
            lose: {
              r: "You bring gossip, not proof. {stew} has the lord's ear, and now he knows your name.",
              fx: {favor:-3,newRel:{type:"enemy",op:-40}},
            },
          },
          {
            t: "Make {stew} pay you to keep quiet",
            check: {s:"intrigue",s2:"intimidation",d:50},
            win: {
              r: "A purse every quarter day. {stew} smiles at you in public and hates you in private.",
              fx: {coin:30,honor:-5,skill:{intrigue:3},flag:"pf_blackmailer"},
            },
            lose: {
              r: "{stew} goes to the lord first, with a story about you. You are lucky to keep your skin.",
              fx: {favor:-6,coinPct:-.1,honor:-2},
            },
          },
          {
            t: "Keep it in your pocket for later",
            r: "A secret kept is a weapon in the scabbard. You may need it one day.",
            fx: {flag:"pf_steward_secret",skill:{intrigue:1}},
          },
        ],
      },
      {
        id: "pf_intr_cup",
        cond: (p,C)=>pro(p,C,"intrigue",50)&&(C.noble(p)||C.job(p,"courtier")||C.job(p,"servant")||C.rich(p)||C.fame(p)>=15),
        w: .7,
        cool: 10,
        setup: (p,ctx)=>{ctx.host=nm(p,"M")},
        title: "The taster's pause",
        text: "At {host}'s feast you see what nobody else sees: the taster hesitates over the host's cup, the cook is standing in the doorway where cooks never stand, and the wine-boy's hands are shaking. A poisoning in a great house always needs someone from the inside.",
        choices: [
          {
            t: "Knock the cup over, clumsily",
            check: {s:"intrigue",s2:"spd",d:45},
            win: {
              r: "The cup goes over. A dog laps the wine later and dies in the yard. {host} knows what you did, and will never forget it.",
              fx: {favor:3,fame:2,honor:4,newRel:{type:"friend",op:40},skill:{intrigue:2}},
            },
            lose: {
              r: "You knock over the wrong cup. The host drinks. He is very sick for a month, but lives.",
              fx: {happy:-4,skill:{intrigue:1}},
            },
          },
          {
            t: "Follow the cook after the feast",
            check: {s:"stealth",s2:"intrigue",d:52},
            win: {
              r: "The cook meets a man in a hooded cloak behind the stables. You see the man's face. Now you know who wanted {host} dead, and they do not know you know.",
              fx: {skill:{stealth:1,intrigue:3},flag:"pf_knows_poisoner"},
            },
            lose: {
              r: "The cook sees you following. The next morning, the cook is gone, and someone has been in your room.",
              fx: {newRel:{type:"enemy",op:-30},happy:-3},
            },
          },
          {
            t: "Say nothing. It is not your house.",
            r: "The host is dead by morning. The cook is gone. The house is in uproar for a year.",
            fx: {happy:-3},
          },
        ],
      },
      {
        id: "pf_intr_listener",
        cond: (p,C)=>pro(p,C,"intrigue",45)&&!C.ruler(p),
        w: .6,
        once: !0,
        setup: (p,ctx)=>{ctx.ag=nm(p),ctx.whose=p.realm==="POL-26"?"the queen's listeners, who answer to Nadia Lark":p.realm==="POL-15"?"the Tower of Far Eyes in Morhaven":"the ruler's listeners, who have no name and need none"},
        title: "Ears for the crown",
        text: p=>`${p.realm==="POL-26"?'"Speak low, the queen is listening," they say in Drevna. ':""}{ag} serves {whose}. "We pay a sun a month for ears in {home}. Who meets whom. Who says what about whom. Nothing more."`,
        choices: [
          {
            t: "Become an informer",
            r: "A sun a month, a word now and then. You start to notice how much you notice.",
            fx: {coin:12,skill:{intrigue:3},favor:3,flag:"pf_informer",honor:-1},
          },
          {
            t: "Agree, and feed them what suits you",
            check: {s:"intrigue",s2:"deception",d:52},
            win: {
              r: "You tell the truth when it costs you nothing, and shade it when it helps your friends. The crown pays you to shape its view of {home}.",
              fx: {coin:12,skill:{intrigue:3,deception:2},flag:"pf_informer"},
            },
            lose: {
              r: "They catch you shading. Nobody says anything. You are simply no longer paid, and watched more closely.",
              fx: {favor:-4,flag:"pf_watched"},
            },
          },
          {t:"Refuse",r:'{ag} nods. "Of course." You wonder, after, who in {home} said yes.',fx:{}},
        ],
      },
      {
        id: "pf_intr_secret",
        cond: (p,C)=>pro(p,C,"intrigue",60)&&(LORE.secrets||[]).length>0,
        w: .5,
        once: !0,
        setup: (p,ctx)=>{const s=A.pick(LORE.secrets);ctx.sec=s&&s.title?s.title:"an old crime of a great house",ctx.secpub=s&&s.pub?String(s.pub).split(". ")[0].replace(/\.$/,""):"the story everyone knows"},
        title: "A thing that proves it",
        text: 'A dying clerk, a box of old letters, a name you recognize. The bundle is about what scholars call "{sec}". The world believes this: {secpub}. The letters say otherwise. On Ardan, a secret is only worth something when there is a thing that proves it, and now you hold one.',
        choices: [
          {
            t: "Sell it to the people it would hurt",
            check: {s:"intrigue",s2:"trade",d:58},
            win: {
              r: "They pay three hundred suns and burn the letters in front of you. You never speak of it. They watch you for the rest of your life.",
              fx: {coin:300,skill:{intrigue:3},flag:"pf_sold_secret",newRel:{type:"enemy",op:-20}},
            },
            lose: {
              r: "They agree to meet. They bring knives instead of coin.",
              fx: {
                duel: {
                  tier: 3,
                  title: "a great house's man",
                  opts: {kind:"duel",lethal:!0,toYield:!1,place:"a dark storehouse",title:"The price of a secret"},
                },
              },
            },
          },
          {
            t: "Hide it well and keep it",
            r: "You sew the letters into the lining of an old chest. A weapon for a bad day.",
            fx: {flag:"pf_holds_secret",skill:{intrigue:2}},
          },
          {
            t: "Burn it. Some things should stay buried.",
            r: "You burn every page. You sleep better than you would have.",
            fx: {wil:1,honor:2},
          },
        ],
      },
      {
        id: "pf_music_voice",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=6,
        once: !0,
        w: .5,
        title: "A voice in the field",
        text: "You are singing to yourself while you scare birds off the barley, an old song {mother} sings. You do not notice that the reapers in the next field have stopped working to listen.",
        choices: [
          {
            t: "Keep singing, louder",
            check: {s:"wil",s2:"int",d:20},
            win: {
              r: "When you stop, the reapers clap. One of them, an old woman, says she has not heard that song sung right since she was a girl. That night you are asked to sing at the harvest supper.",
              fx: {apt:{music:1.45},skill:{music:3},happy:5,fame:1},
            },
            lose: {r:"You notice them, go red and run away.",fx:{skill:{music:1},happy:-1}},
          },
          {
            t: "Stop, embarrassed",
            r: 'You stop. Somebody calls "more!" but you are already gone.',
            fx: {skill:{music:1}},
          },
        ],
      },
      {
        id: "pf_music_contest",
        cond: (p,C)=>pro(p,C,"music",40),
        w: 1,
        cool: 4,
        setup: (p,ctx)=>{who(p,ctx,"rival"),ctx.inst=instrument(p),ctx.fest=A.pick(GD.FESTIVALS)[0]},
        title: "The song contest",
        text: "{fest}, and the song contest in the market hall. A purse of 15 suns and a silver cup. You have {inst} and a song. {themFull}, a traveling singer with a famous voice, goes before you and the hall is in tears.",
        choices: [
          {
            t: "Sing the old song everyone loves",
            check: {s:"music",s2:"wil",d:52},
            win: {
              r: "The hall sings the last verse with you. The judges do not even confer.",
              fx: {coin:15,fame:3,skill:{music:2},happy:6,them:{type:"rival",op:-5}},
            },
            lose: {
              r: "It is good. {They} was better. You come second, and buy {themHim} a cup.",
              fx: {coin:3,fame:1,skill:{music:1},them:{type:"friend",op:10}},
            },
          },
          {
            t: "Sing a new song of your own",
            check: {s:"music",s2:"int",d:56},
            win: {
              r: "Nobody has heard it before. By the next fair, people are singing it in three towns.",
              fx: {coin:15,fame:4,skill:{music:3},happy:6,deed:"made a song that spread"},
            },
            lose: {r:"A new song is a risk. The hall shuffles its feet.",fx:{fame:-1,skill:{music:1},happy:-3}},
          },
          {
            t: "Make them laugh instead of cry",
            check: {s:"music",s2:"persuasion",d:48},
            win: {
              r: "A bawdy song about the reeve. The hall roars. The reeve less so. You win anyway.",
              fx: {coin:15,fame:2,skill:{music:2},favor:-1},
            },
            lose: {r:"The reeve is in the front row. Nobody laughs.",fx:{happy:-3,favor:-2}},
          },
        ],
      },
      {
        id: "pf_music_lords_hall",
        cond: (p,C)=>pro(p,C,"music",55),
        w: .8,
        cool: 8,
        setup: (p,ctx)=>{ctx.lord=nm(p,"M"),ctx.foe=nm(p,"M")},
        title: "A song for the feast",
        text: "Lord {lord} has heard you and wants you at his feast: 20 suns and a seat at the low table. He has one request. He wants a song mocking his neighbor, Lord {foe}, who will not be there. Songs are history, and history is remembered.",
        choices: [
          {
            t: "Sing the mocking song, and make it sharp",
            check: {s:"music",s2:"int",d:50},
            win: {
              r: "The hall howls. Lord {lord} pays you double. The song reaches Lord {foe} within a month.",
              fx: {coin:40,fame:3,skill:{music:2},newRel:{type:"enemy",op:-40}},
            },
            lose: {r:"The joke falls flat. Lord {lord} pays you the twenty with a sour face.",fx:{coin:20}},
          },
          {
            t: "Sing a song praising Lord {lord} instead",
            check: {s:"music",s2:"etiquette",d:48},
            win: {
              r: "Praise is safer than mockery and pays as well. Lord {lord} makes you a regular at his hall.",
              fx: {coin:25,skill:{music:2},newRel:{type:"friend",op:25},job:"minstrel"},
            },
            lose: {r:"He wanted blood, not praise. He pays you and does not ask you back.",fx:{coin:20}},
          },
          {t:"Refuse the commission",r:"You keep your honor and lose a good fee.",fx:{honor:2}},
        ],
      },
      {
        id: "pf_music_old_songs",
        cond: (p,C)=>pro(p,C,"music",40),
        w: .6,
        once: !0,
        setup: (p,ctx)=>{ctx.keeper=nm(p),ctx.what=inR(p,"POL-20","POL-22")?"a Rememberer, a praise-singer who knows every royal line back forty generations":inR(p,"POL-09","POL-23")||p.race==="giant"?"a giant Mother who can chant a lineage for a whole day":inR(p,"POL-11","POL-12","POL-34")?"a steppe singer who knows the long songs of Ulagan":inR(p,"POL-17")?"a poet who can recite all of Hazir the Blind":"an old hall-singer who knows the oath-lays by heart";const s=(LORE.songs||[]).length?A.pick(LORE.songs):null;ctx.song=s&&s[0]?s[0]:"the oldest song of your people"},
        title: "The keeper of songs",
        text: '{keeper} is {what}, and is dying. There is nobody left to teach. {keeper} has heard you sing, and sends for you. "Songs are history. Sit. We begin with {song}."',
        choices: [
          {
            t: "Sit at {keeper}'s bed every evening until the end",
            r: "A whole winter of evenings. When {keeper} dies, the songs do not. They live in you now.",
            fx: {skill:{music:5,learning:2},wil:1,fame:2,flag:"pf_song_keeper"},
          },
          {
            t: "Write the songs down",
            req: p=>p.literate,
            r: "You write until your fingers ache. The songs are safe on paper, though {keeper} says a song on paper is a bird in a box.",
            fx: {skill:{music:3,learning:3}},
          },
          {
            t: "You have no time for old songs",
            r: "{keeper} dies in spring, and a hundred songs die with {keeper}.",
            fx: {happy:-2},
          },
        ],
      },
      {
        id: "pf_music_satire",
        cond: (p,C)=>pro(p,C,"music",50)&&!C.ruler(p),
        w: .7,
        cool: 10,
        title: "The song that spread",
        text: "You made up a little song about {ruler}'s new tax, half joke and half anger. You sang it once, in one alehouse. Now carters are singing it on the roads, and someone says the {rulerTitle}'s men are asking who wrote it.",
        choices: [
          {
            t: "Own it, proudly",
            check: {s:"persuasion",s2:"music",d:52},
            win: {
              r: "You sing it again in the market square. The crowd is so big the {rulerTitle}'s men do not dare to take you. You are a voice of the people now.",
              fx: {fame:5,skill:{music:2},favor:-6,honor:3},
            },
            lose: {
              r: "They take you in the night. A month in the lockup, and a warning.",
              fx: {favor:-8,prison:1,why:"a seditious song"},
            },
          },
          {
            t: "Lie low and let it be anonymous",
            check: {s:"deception",s2:"intrigue",d:45},
            win: {
              r: "Nobody gives your name. The song lives on without you. That is how the best songs live.",
              fx: {fame:1,skill:{deception:1}},
            },
            lose: {r:"Someone gives your name for a sun. You pay a heavy fine.",fx:{coin:-20,favor:-4}},
          },
          {
            t: "Write a second verse, praising the {rulerTitle}",
            r: "Clever. The song becomes harmless. The carters stop singing it. Nobody arrests you.",
            fx: {favor:1,honor:-1},
          },
        ],
      },
      {
        id: "pf_cmd_kid_war",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=8,
        once: !0,
        w: .5,
        title: "The lane war",
        text: "The children of your lane are at war with the children of the next, with mud and sticks. Your side is losing badly. Everyone is running about shouting and nobody is listening to anyone.",
        choices: [
          {
            t: "Shout, and make them listen",
            check: {s:"wil",s2:"int",d:22},
            win: {
              r: '"Line up! Shields! On me!" To your own surprise, they do. You win the war of the lane, and for a year the others call you "Captain".',
              fx: {apt:{command:1.3},skill:{command:3},happy:4,wil:.5},
            },
            lose: {r:"Nobody listens. You are captured and made to eat mud.",fx:{happy:-2,wil:1}},
          },
          {
            t: "Sneak round behind them",
            check: {s:"int",s2:"spd",d:22},
            win: {
              r: "You come over the wall behind them with a bucket of slops. Victory.",
              fx: {skill:{tactics:2},happy:3},
            },
            lose: {r:"You get caught alone behind enemy lines. Mud.",fx:{happy:-1}},
          },
          {
            t: "Desert to the winning side",
            r: "They take you, laughing. You never quite live it down.",
            fx: {honor:-1},
          },
        ],
      },
      {
        id: "pf_cmd_militia",
        cond: (p,C)=>pro(p,C,"command",40)&&!C.soldier(p),
        w: .9,
        cool: 8,
        title: "Nobody in charge",
        text: ()=>`${A.pick(["Raiders","A band of deserters","Outlaws from the hills"])} are coming up the valley toward {home}. The reeve has run. Thirty frightened villagers stand in the square with flails and hunting bows, all looking at each other.`,
        choices: [
          {
            t: "Take command",
            check: {s:"command",s2:"wil",d:52},
            win: {
              r: "Bows on the church roof, flails behind the barricade, the old folk and children in the stone barn. The raiders take one look and go round. You are reeve now, whatever anyone says.",
              fx: {fame:4,honor:4,skill:{command:3,tactics:1},flag:"pf_reeve",deed:"saved the village from raiders"},
            },
            lose: {
              r: "They follow you, but not well enough. The raiders burn three houses before they are driven off.",
              fx: {fame:1,health:-8,wil:2,happy:-4,cause:"a raiders' blade"},
            },
          },
          {
            t: "Set an ambush at the ford",
            req: (p,C)=>C.prof(p,"tactics",35),
            check: {s:"tactics",s2:"command",d:50},
            win: {
              r: "They come across the ford in a bunch and meet thirty villagers rising out of the reeds. Not one gets across.",
              fx: {fame:4,skill:{tactics:2,command:2},honor:3},
            },
            lose: {
              r: "Someone shoots too soon. The raiders scatter and come at you from both sides.",
              fx: {health:-10,wil:2,cause:"a fight at the ford"},
            },
          },
          {
            t: "Get everyone into the woods",
            r: "Everyone lives. The village is looted. People argue for years about whether you were wise or a coward.",
            fx: {honor:1,happy:-3},
          },
        ],
      },
      {
        id: "pf_cmd_unpaid",
        cond: (p,C)=>pro(p,C,"command",45)&&C.soldier(p)&&!!p.mil&&p.mil.rank>=1,
        w: .9,
        cool: 8,
        title: "Four months unpaid",
        text: "Four months without pay. The men are muttering by the fires, and tonight the muttering has a shape. They talk about the Grey Hand, who went fourteen months unpaid in Tessaria and then sacked Lorino. They are waiting to see what you do.",
        choices: [
          {
            t: "Talk to them, man by man",
            check: {s:"command",s2:"persuasion",d:52},
            win: {
              r: "You eat with them, promise only what you can deliver, and go yourself to the paymaster. They hold. When the money comes, they remember who stood by them.",
              fx: {merit:6,skill:{command:3},fame:1,rel:{who:"comrade",op:8,all:!0}},
            },
            lose: {
              r: "Some hold. A dozen desert in the night with the company's mules.",
              fx: {merit:-4,wil:1.5,happy:-4},
            },
          },
          {
            t: "Pay them something from your own purse",
            req: p=>p.coin>=30,
            r: "Thirty suns, split among the men. It is not enough, but it is something, and it is yours. They will follow you anywhere now.",
            fx: {coin:-30,merit:5,honor:4,rel:{who:"comrade",op:15,all:!0}},
          },
          {
            t: "Hang the loudest one",
            r: "It works. They are quiet. They are also afraid of you, and fear is not loyalty.",
            fx: {merit:3,honor:-5,skill:{intimidation:2},rel:{who:"comrade",op:-10,all:!0}},
          },
        ],
      },
      {
        id: "pf_cmd_dyke",
        cond: (p,C)=>pro(p,C,"command",35)&&(C.terr(p,"marsh","plains")||C.realm(p,"POL-18")),
        w: .7,
        cool: 8,
        title: "The dyke is going",
        text: p=>`${p.realm==="POL-18"?"Every man in Tamar owes a month of dyke work, and this year the flood came early.":"Spring flood, and the river dyke above {home} is leaking."} Water is coming through in a dozen places. The work gang is two hundred strong and nobody is in charge.`,
        choices: [
          {
            t: "Organize them: sandbags here, stakes there",
            check: {s:"command",s2:"logistics",d:50},
            win: {
              r: "Three days and nights. The dyke holds. The fields are saved and the reeve gives you a cask of beer and your name in the parish book.",
              fx: {fame:3,honor:3,skill:{command:2,logistics:2},sta:.5},
            },
            lose: {
              r: "The dyke breaks at the weak place you did not see. Half the fields drown.",
              fx: {happy:-6,wil:2,sta:.4},
            },
          },
          {
            t: "Lead by example: first into the water",
            check: {s:"sta",s2:"command",d:45},
            win: {
              r: "They follow you into the cold water. Shoulders against the stakes, all night. It holds.",
              fx: {fame:2,sta:.6,wil:1,skill:{command:2},health:-4,cause:"cold water"},
            },
            lose: {r:"You catch a chill that becomes a fever.",fx:{health:-12,wil:1.5,cause:"a fever from the flood"}},
          },
          {
            t: "Do your share and no more",
            r: "You dig. Someone else gives the orders. The dyke mostly holds.",
            fx: {sta:.3},
          },
        ],
      },
      {
        id: "pf_cmd_old_soldier",
        cond: (p,C)=>pro(p,C,"command",60)&&(C.soldier(p)||C.fame(p)>=15),
        w: .6,
        cool: 12,
        setup: (p,ctx)=>{who(p,ctx,"friend"),ctx.vet=nm(p,"M")},
        title: "My father served with you",
        text: 'A young {themRace} with a bundle on {theirHis} back is waiting outside your door. "{vet} was my father. He served under you, years ago. He told me if I wanted to be a soldier I should only ever serve under you." {They} is {themAge}.',
        choices: [
          {
            t: "Take {themHim} on, and look after {themHim}",
            r: "You take {themHim} on, and keep a careful eye on {themHim}. A father's trust is a heavy thing to carry.",
            fx: {them:{type:"friend",op:35},honor:3,happy:3,skill:{command:1}},
          },
          {
            t: "Test {themHim} hard first",
            check: {s:"command",s2:"ins",d:45},
            win: {
              r: "{They} takes everything you throw and comes back for more. {vet} would be proud.",
              fx: {them:{type:"friend",op:25},skill:{command:2}},
            },
            lose: {r:"You push too hard. {They} leaves in the night, ashamed.",fx:{them:{op:-20},happy:-3}},
          },
          {
            t: "Send {themHim} home to learn a trade",
            r: '"Your father would want you alive." {They} goes, angry. Maybe one day {theyHe} will understand.',
            fx: {them:{op:-10},honor:1},
          },
        ],
      },
      {
        id: "pf_tac_board",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=8,
        once: !0,
        w: .4,
        setup: (p,ctx)=>{ctx.game=inR(p,"POL-10","POL-28","POL-29")||p.race==="dwarf"?"Gates, carved in stone":inR(p,"POL-01","POL-05","POL-08","POL-14","POL-09")?"the Ring Game, cut into the hall bench":"Captains, on a squared board",ctx.old=nm(p,"M")},
        title: "The board game",
        text: "Old {old}, who was a soldier once, plays {game} with anyone who will sit. He has never lost to a child. He nods at the empty stool.",
        choices: [
          {
            t: "Play to win",
            check: {s:"int",s2:"ins",d:24},
            win: {
              r: "You lose the first game. You win the third. Old {old} sets the pieces up again in silence, and then teaches you everything he knows.",
              fx: {apt:{tactics:1.3},skill:{tactics:3},int:.4,newRel:{type:"mentor",op:25}},
            },
            lose: {r:'He crushes you three times. "Again tomorrow," he says.',fx:{skill:{tactics:1},int:.2}},
          },
          {
            t: "Ask him about his real battles instead",
            r: "He tells you about a ford, a dawn, a flank no one was watching. You never forget it.",
            fx: {skill:{tactics:2}},
          },
        ],
      },
      {
        id: "pf_tac_veteran_game",
        cond: (p,C)=>pro(p,C,"tactics",30),
        w: .7,
        cool: 8,
        setup: (p,ctx)=>{who(p,ctx,"rival"),ctx.stake=A.pick([5,10,15])},
        title: "Captains",
        text: "{themFull} is the best Captains player in {home}: horse, foot, engines and a marshal on a squared board. {They} plays for {stake} suns a game and has a long line of losers.",
        choices: [
          {
            t: "Play for the stake",
            check: {s:"tactics",s2:"int",d:52},
            win: {
              r: (p,ctx)=>`You bait {theirHis} horse into the center and take the marshal from the flank. ${ctx.stake} suns, and a crowd asking for a rematch.`,
              fx: (p,ctx)=>A.applyFx(p,{coin:ctx.stake,fame:1,skill:{tactics:3},them:{type:"rival",op:-5}},ctx),
            },
            lose: {
              r: (p,ctx)=>`{They} sees your trap three moves before you spring it. ${ctx.stake} suns gone.`,
              fx: (p,ctx)=>A.applyFx(p,{coin:-ctx.stake,skill:{tactics:1}},ctx),
            },
          },
          {
            t: "Play for nothing, to learn",
            r: "You lose six games and learn six lessons. {They} enjoys teaching more than {theyHe} admits.",
            fx: {skill:{tactics:2},them:{type:"friend",op:10}},
          },
          {
            t: "Watch {themHim} play others",
            r: "You learn how {theyHe} thinks. That is worth more than one game.",
            fx: {skill:{tactics:1},int:.2},
          },
        ],
      },
      {
        id: "pf_tac_ambush",
        cond: (p,C)=>pro(p,C,"tactics",45)&&C.soldier(p),
        w: 1,
        cool: 5,
        setup: (p,ctx)=>{ctx.capt=nm(p,"M")},
        title: "The ground",
        text: "The column halts at a narrow valley with a stream at the bottom and woods on both sides. Captain {capt} wants to push straight through before dark. You have looked at the ground, and you do not like it, or you like it very much, depending on who gets there first.",
        choices: [
          {
            t: "Propose your own ambush on the ridge",
            check: {s:"tactics",s2:"persuasion",d:52},
            win: {
              r: "The captain listens. You lie on the ridge all night. At dawn the enemy column walks into your trap. The captain takes the credit and gives you the reward.",
              fx: {merit:10,coin:15,skill:{tactics:3},fame:2},
            },
            lose: {
              r: `"When I want a common soldier's opinion, I will ask for it." You push through. Nothing happens. This time.`,
              fx: {merit:-1,happy:-2},
            },
          },
          {
            t: "Warn the captain of a trap",
            check: {s:"tactics",s2:"tracking",d:48},
            win: {
              r: "You find the cut branches and the trampled grass. The column goes round. You never learn how many lives that saved.",
              fx: {merit:6,skill:{tactics:2,tracking:1}},
            },
            lose: {r:"There is nothing there. The captain is annoyed at the delay.",fx:{merit:-2}},
          },
          {
            t: "Keep your mouth shut",
            r: "You march through. Somewhere on the ridge, birds go up all at once.",
            fx: {wil:.5},
          },
        ],
      },
      {
        id: "pf_tac_old_field",
        cond: (p,C)=>pro(p,C,"tactics",35)&&(LORE.wars||[]).length>0,
        w: .6,
        cool: 15,
        setup: (p,ctx)=>{const w=A.pick(LORE.wars);ctx.war=w&&w[1]?w[1]:"an old war",ctx.vet=nm(p,"M")},
        title: "An old battlefield",
        text: '{vet}, a grey old soldier, offers to walk you over a field where a battle of {war} was fought. There is nothing there now but sheep and a stone. "Stand here," he says. "Now tell me where you would put the horse."',
        choices: [
          {
            t: "Walk the whole field with him",
            check: {s:"tactics",s2:"int",d:45},
            win: {
              r: "By evening you see it the way the generals saw it: the ground, the sun, the slope. You see why one side won. You see how the other could have.",
              fx: {skill:{tactics:4},int:.4,newRel:{type:"mentor",op:25}},
            },
            lose: {
              r: "You put the horse in the bog. He laughs until he coughs. You learn anyway.",
              fx: {skill:{tactics:2}},
            },
          },
          {
            t: "Ask him what it was like",
            r: "He talks about the noise and the smell and his brother. Not about tactics at all. That is a lesson too.",
            fx: {wil:1,skill:{tactics:1}},
          },
        ],
      },
      {
        id: "pf_tac_bandit_camp",
        cond: (p,C)=>pro(p,C,"tactics",50)&&!C.ruler(p),
        w: .7,
        cool: 10,
        setup: (p,ctx)=>{ctx.reeve=nm(p,"M")},
        title: "The camp in the quarry",
        text: "Outlaws have taken over an old quarry above {town}. There are twenty of them. {reeve} has forty farmers, a few hunters, and no idea what to do. He asks you to plan it.",
        choices: [
          {
            t: "Starve them out: block the two paths",
            check: {s:"tactics",s2:"logistics",d:50},
            win: {
              r: "Two weeks. They come down with their hands up, thin and furious. Nobody on your side dies.",
              fx: {fame:3,skill:{tactics:2,logistics:2},coin:10,honor:2},
            },
            lose: {
              r: "There is a third path you did not know. They are gone by the second night.",
              fx: {happy:-3,fame:-1},
            },
          },
          {
            t: "Attack at dawn from above",
            check: {s:"tactics",s2:"command",d:55},
            win: {
              r: "Hunters on the lip of the quarry, farmers at the mouth. It is over in an hour.",
              fx: {fame:4,skill:{tactics:3,command:1},coin:15},
            },
            lose: {
              r: "The farmers break at the first arrow. Three die. The outlaws laugh from the quarry.",
              fx: {happy:-8,wil:2,fame:-1},
            },
          },
          {
            t: "Say it cannot be done with farmers",
            r: "{reeve} sends to the lord for soldiers. It takes a year.",
            fx: {},
          },
        ],
      },
      {
        id: "pf_log_sacks",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=8,
        once: !0,
        w: .4,
        setup: (p,ctx)=>{ctx.mill=nm(p,"M")},
        title: "Counting sacks",
        text: "{mill} the miller lets you sit on the grain sacks while he works. He keeps losing count of whose sacks are whose. Notches on a stick, chalk on the wall, it is all a mess.",
        choices: [
          {
            t: "Count them all in your head",
            check: {s:"int",s2:"wil",d:22},
            win: {
              r: "Forty-two sacks, eleven farms, and who owes the miller's toll. You are right to the sack. {mill} gives you a penny a week to keep his tallies.",
              fx: {apt:{logistics:1.3},skill:{logistics:3},int:.4,coin:1},
            },
            lose: {r:"You lose count at twenty and give up.",fx:{skill:{logistics:1}}},
          },
          {
            t: "Climb the sacks and play instead",
            r: "You play. The miller loses count again. Everyone argues at harvest, as usual.",
            fx: {happy:2},
          },
        ],
      },
      {
        id: "pf_log_caravan",
        cond: (p,C)=>pro(p,C,"logistics",35)||pro(p,C,"trade",45)||C.adult(p)&&C.job(p,"merchant"),
        w: .8,
        cool: 8,
        setup: (p,ctx)=>{ctx.cm=nm(p,"M"),ctx.dest=A.pick(["over the mountains","across the steppe","along the coast road","through the forest roads"])},
        title: "Mules, sacks and days",
        text: "{cm} is taking forty mules {dest} to {town} and beyond. Last time he ran out of fodder on day twelve and lost nine mules. He wants someone to plan it: food, water, feed, spare shoes, days. Ten suns, and a share if it arrives whole.",
        choices: [
          {
            t: "Plan it to the last sack",
            check: {s:"logistics",s2:"int",d:48},
            win: {
              r: "Every stop, every well, every bale of fodder. The caravan arrives with every mule alive and a day to spare. {cm} pays you thirty suns.",
              fx: {coin:30,skill:{logistics:3},newRel:{type:"friend",op:25}},
            },
            lose: {
              r: "You forgot the river was in flood. Two weeks stuck at the ferry. {cm} pays you ten, grudgingly.",
              fx: {coin:10,skill:{logistics:1}},
            },
          },
          {
            t: "Go with them yourself and run it",
            check: {s:"logistics",s2:"sta",d:50},
            win: {
              r: "Two months on the road. You see the world and you come home with forty suns.",
              fx: {coin:40,skill:{logistics:3,riding:1},sta:.5},
            },
            lose: {
              r: "Bandits, then fever. You come home thin, with ten suns and a story.",
              fx: {coin:10,health:-10,wil:1.5,cause:"fever on the road"},
            },
          },
          {
            t: "Decline",
            r: "{cm} finds someone else. He loses six mules this time, which is an improvement.",
            fx: {},
          },
        ],
      },
      {
        id: "pf_log_forage",
        cond: (p,C)=>pro(p,C,"logistics",45)&&C.soldier(p),
        w: 1,
        cool: 5,
        setup: (p,ctx)=>{ctx.sut=nm(p,"M")},
        title: "The wagons are stuck",
        text: "The supply wagons are stuck in the mud a day behind, the villages ahead are stripped, and the men have one day of bread left. The sutler {sut} has plenty, at prices that would shame a moneylender.",
        choices: [
          {
            t: "Organize a forage the whole company can live on",
            check: {s:"logistics",s2:"survival",d:50},
            win: {
              r: "You send parties to three valleys nobody has stripped, with orders to pay where they can. Bread for a week. The commander asks your name.",
              fx: {merit:8,skill:{logistics:3},fame:1},
            },
            lose: {
              r: "The foragers find little and steal a lot. The villagers hate you, the men are still hungry.",
              fx: {merit:-2,honor:-2},
            },
          },
          {
            t: "Get the wagons out of the mud",
            check: {s:"logistics",s2:"command",d:48},
            win: {
              r: "Brushwood, ropes, oxen from a farm and fifty men on the wheels. The wagons are up by nightfall.",
              fx: {merit:6,skill:{logistics:2,command:1},sta:.4},
            },
            lose: {r:"An axle breaks. Then another. Then it rains.",fx:{merit:-1,wil:1}},
          },
          {
            t: "Lean on {sut} to sell at fair prices",
            check: {s:"intimidation",s2:"logistics",d:48},
            win: {
              r: "{sut} finds he has been overcharging by mistake. The men eat.",
              fx: {merit:4,skill:{intimidation:1},rel:{who:"comrade",op:5,all:!0}},
            },
            lose: {
              r: "{sut} complains to the captain, who is his cousin. You are on latrine duty for a month.",
              fx: {merit:-3,happy:-3},
            },
          },
        ],
      },
      {
        id: "pf_log_granary",
        cond: (p,C)=>(pro(p,C,"logistics",45)||pro(p,C,"stewardship",50))&&(C.town(p)||C.flag(p,"pf_reeve")||C.noble(p)||C.ruler(p)),
        w: .7,
        cool: 10,
        title: "The last granary",
        text: "Hungry year. The town granary holds enough for the poor until harvest, if it is shared exactly right. If it is not, people will die or riot, and probably both. The council asks you to run it.",
        choices: [
          {
            t: "Ration it exactly",
            check: {s:"logistics",s2:"stewardship",d:52},
            win: {
              r: "A loaf per mouth per two days, tallies on every door, and no favorites. It lasts until the first sheaf is cut. Nobody starves in your town that year.",
              fx: {fame:4,honor:5,skill:{logistics:3,stewardship:1},deed:"brought the town through a hungry year"},
            },
            lose: {
              r: "You get the count wrong. It runs out three weeks early. Those three weeks are very bad.",
              fx: {happy:-8,wil:2,fame:-1},
            },
          },
          {
            t: "Give the guild families a little extra, to keep the peace",
            r: "The guilds are content. The poor quarter is not. There is a riot in the end anyway, but a small one.",
            fx: {skill:{logistics:1},honor:-3,coin:10},
          },
          {
            t: "Refuse. Nobody thanks the one who shares out hunger.",
            r: "Someone else does it, badly.",
            fx: {happy:-2},
          },
        ],
      },
      {
        id: "pf_siege_model",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=8,
        once: !0,
        w: .4,
        title: "The little engine",
        text: "A traveling engineer once drew you a picture of a counterweight engine in the dust. You have been thinking about it for a month. You have a plank, a bucket of stones, a rope, and a lot of rotten apples.",
        choices: [
          {
            t: "Build it and throw apples at the hen-house",
            check: {s:"int",s2:"str",d:24},
            win: {
              r: "It works. A rotten apple sails clean over the hen-house and into the reeve's yard. You are beaten, and you have never been happier.",
              fx: {apt:{siegecraft:1.35},skill:{siegecraft:3,craft:1},happy:4,family:-1},
            },
            lose: {r:"The arm swings back and hits you in the face.",fx:{health:-3,skill:{siegecraft:1},wil:.5}},
          },
          {
            t: "Build it smaller and get it right first",
            r: "A tiny one, for pebbles. It works perfectly. Next year, a big one.",
            fx: {skill:{siegecraft:2,craft:1}},
          },
        ],
      },
      {
        id: "pf_siege_engineer",
        cond: (p,C)=>C.adult(p)&&!C.old(p)&&(C.prof(p,"siegecraft",35)||C.prof(p,"craft",50)&&C.prof(p,"learning",30)),
        w: .6,
        once: !0,
        setup: (p,ctx)=>{school(p,ctx,/engine|min|sapper|counter/i,"the engine yard"),ctx.eng=nm(p,"M")},
        title: "A hundred suns a month",
        text: "{eng}, an engineer trained at {school} in {splace}, is building engines for a lord's siege. A siege engineer earns a hundred suns a month, more than a captain. He needs an assistant who can count, carve and keep a cool head under a wall.",
        choices: [
          {
            t: "Go with him for a season",
            check: {s:"siegecraft",s2:"int",d:45},
            win: {
              r: "Counterweights, ropes, mines and arguments. When the wall falls, it is partly your engine that did it. {eng} pays you well and gives you his notes.",
              fx: {coin:50,skill:{siegecraft:5,craft:2},newRel:{type:"mentor",op:30},flag:"pf_engineer"},
            },
            lose: {
              r: "A rope parts and the arm comes down a hand's breadth from your head. You quit, wiser and a little deaf.",
              fx: {coin:15,skill:{siegecraft:2},wound:"ear"},
            },
          },
          {
            t: "Ask to learn mining and counter-mining",
            r: "Listening in the dark with a bowl of water on the floor, watching for ripples. Then digging. You learn the trade under the ground.",
            fx: {skill:{siegecraft:4},wil:1,sta:.4,coin:20},
          },
          {t:"Decline",r:"Walls are for other people to knock down.",fx:{}},
        ],
      },
      {
        id: "pf_siege_digging",
        cond: (p,C)=>pro(p,C,"siegecraft",45)&&(C.atWar(p)||C.soldier(p)),
        w: .9,
        cool: 6,
        title: "Ripples in the bowl",
        text: "Night in the gate tower. You set a bowl of water on the stone floor, as engineers do, and watch. There: tiny ripples, again and again. Someone is digging under the wall.",
        choices: [
          {
            t: "Dig a counter-mine and break into theirs",
            check: {s:"siegecraft",s2:"wil",d:55},
            win: {
              r: "Three days of digging. You break through into their gallery, smoke them out and collapse it. The wall stands. The commander knows your name.",
              fx: {merit:10,fame:3,skill:{siegecraft:3},wil:1},
            },
            lose: {
              r: "You break into their tunnel at the wrong place and it is a knife fight in the dark.",
              fx: {
                duel: {
                  tier: 3,
                  title: "an enemy miner",
                  opts: {kind:"brawl",lethal:!0,toYield:!1,place:"a tunnel under the wall",title:"In the dark"},
                },
              },
            },
          },
          {
            t: "Build an inner wall behind the weak spot",
            check: {s:"siegecraft",s2:"logistics",d:50},
            win: {
              r: "When the mine is fired and the wall comes down, there is a second wall behind it, and a lot of crossbows.",
              fx: {merit:8,skill:{siegecraft:2,logistics:1},fame:2},
            },
            lose: {
              r: "The inner wall is not finished in time. The fight in the breach is long and bloody.",
              fx: {health:-12,merit:2,wil:2,cause:"the fight in the breach"},
            },
          },
          {
            t: "Report it and let others decide",
            r: "The captain sends for an engineer. It takes too long.",
            fx: {merit:1},
          },
        ],
      },
      {
        id: "pf_siege_crack",
        cond: (p,C)=>pro(p,C,"siegecraft",35)&&C.town(p),
        w: .6,
        cool: 12,
        setup: (p,ctx)=>{ctx.mas=nm(p,"M")},
        title: "The new wall",
        text: "The council paid master mason {mas} two thousand suns for a new stretch of town wall. You walk along it and see what they did not: rubble fill, no tie-stones, a facing a hand thick. A ram would go through it in an afternoon.",
        choices: [
          {
            t: "Tell the council, with proof",
            check: {s:"siegecraft",s2:"persuasion",d:48},
            win: {
              r: "You knock a hole in it with a crowbar in front of them. {mas} is fined and made to rebuild it. The council pays you to oversee the work.",
              fx: {coin:25,fame:2,honor:3,skill:{siegecraft:2},newRel:{type:"enemy",op:-40}},
            },
            lose: {
              r: "{mas} is the mayor's brother-in-law. You are told to mind your own business.",
              fx: {happy:-3,newRel:{type:"enemy",op:-20}},
            },
          },
          {
            t: "Make {mas} pay you to keep quiet",
            r: "Twenty suns. The wall stays as it is. One day, someone may find out what it is made of.",
            fx: {coin:20,honor:-5},
          },
          {t:"Say nothing",r:"It is not your wall. Yet.",fx:{}},
        ],
      },
      {
        id: "pf_siege_gate",
        cond: (p,C)=>pro(p,C,"siegecraft",55)&&C.soldier(p),
        w: .8,
        cool: 6,
        setup: (p,ctx)=>{ctx.cmdr=nm(p,"M")},
        title: "How to take the gate",
        text: 'The siege has gone on two months. Commander {cmdr} is losing patience and men. He calls in everyone who knows anything about walls. "How do I get through that gate before winter?"',
        choices: [
          {
            t: "Mine under the gate tower",
            check: {s:"siegecraft",s2:"logistics",d:55},
            win: {
              r: "Six weeks of digging, a chamber full of pig fat and timber, and fire. The tower leans and falls. The town surrenders the next morning.",
              fx: {merit:12,fame:4,skill:{siegecraft:3},deed:"brought down a gate tower"},
            },
            lose: {r:"They counter-mine. Your tunnel floods. Twenty diggers drown.",fx:{merit:-4,wil:2,happy:-8}},
          },
          {
            t: "Build a counterweight engine and batter the gatehouse",
            check: {s:"siegecraft",s2:"craft",d:52},
            win: {
              r: "Your engine throws a stone the weight of a cow. On the tenth day the gatehouse cracks.",
              fx: {merit:10,fame:3,skill:{siegecraft:2,craft:2}},
            },
            lose: {r:"The engine's arm snaps on the third throw. Back to waiting.",fx:{merit:-2,happy:-3}},
          },
          {
            t: "Starve them. It is cheaper.",
            check: {s:"siegecraft",s2:"wil",d:45},
            win: {
              r: "You show where the last food is getting in. The ring is closed. They surrender at the first snow.",
              fx: {merit:6,skill:{siegecraft:2}},
            },
            lose: {r:"Winter comes for you before it comes for them.",fx:{health:-10,wil:2,cause:"a winter siege"}},
          },
        ],
      },
      {
        id: "pf_stew_widow",
        cond: (p,C)=>pro(p,C,"stewardship",40)&&!C.ruler(p),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{ctx.wid=nm(p,"F"),ctx.ree=nm(p,"M")},
        title: "The widow's accounts",
        text: "{wid}, a widow who inherited a good farm and a bad reeve, asks you to look at the accounts. The farm should make two hundred suns a year. It makes fifty. Her reeve, {ree}, is very helpful and very nervous.",
        choices: [
          {
            t: "Go through every tally stick",
            check: {s:"stewardship",s2:"int",d:48},
            win: {
              r: 'Short measures at the mill, a "lost" calf every spring, rents collected twice. {ree} is turned out. {wid} pays you a share of the first good year.',
              fx: {coin:40,skill:{stewardship:3},honor:2,newRel:{type:"friend",op:30}},
            },
            lose: {
              r: "The books are a maze. {ree} is better at lying than you are at reading.",
              fx: {coin:5,skill:{stewardship:1}},
            },
          },
          {
            t: "Run the farm yourself for a year",
            check: {s:"stewardship",s2:"husbandry",d:50},
            win: {
              r: "New rotation, honest measures, a new ditch. Two hundred and twenty suns. She offers to make it permanent.",
              fx: {coin:50,skill:{stewardship:3,husbandry:2},newRel:{type:"friend",op:35}},
            },
            lose: {
              r: "A wet summer ruins your plans. She pays you, but does not ask again.",
              fx: {coin:15,skill:{stewardship:1}},
            },
          },
          {
            t: "Take a cut from {ree} to say all is well",
            r: "{ree} pays you ten suns. The widow trusts you. You do not like what you see in the well.",
            fx: {coin:10,honor:-6},
          },
        ],
      },
      {
        id: "pf_stew_improve",
        cond: (p,C)=>(pro(p,C,"stewardship",35)||pro(p,C,"husbandry",50))&&(p.assets.length>0||C.noble(p)||p.status==="gentry"||C.job(p,"farm")),
        w: .8,
        cool: 8,
        title: "Making the land pay",
        text: "You walk your land with a slate in your hand. A wet field that could be drained, a stream that could turn a mill, tenants who would pay more if they had a reason. Every improvement costs money now and pays later, if you are right.",
        choices: [
          {
            t: "Build a mill on the stream (80 suns)",
            req: p=>p.coin>=80,
            check: {s:"stewardship",s2:"craft",d:48},
            win: {
              r: "The mill turns by autumn. Every farm for a league brings grain to it, and the miller's toll is yours. In two years it will have paid for itself.",
              fx: {coin:-20,skill:{stewardship:3},flag:"pf_mill",happy:3},
            },
            lose: {
              r: "The stream runs low in summer. The mill turns three months a year.",
              fx: {coin:-80,skill:{stewardship:2},happy:-4},
            },
          },
          {
            t: "Drain the wet field (30 suns)",
            req: p=>p.coin>=30,
            check: {s:"stewardship",s2:"husbandry",d:42},
            win: {
              r: "Ditches and willow drains. Next year it grows the best barley you have, and the ditches have paid for themselves.",
              fx: {coin:5,skill:{stewardship:2,husbandry:1}},
            },
            lose: {r:"The ditches silt up in the first winter.",fx:{coin:-30,skill:{stewardship:1}}},
          },
          {
            t: "Lower the rents to keep good tenants",
            r: "They stay, they work harder, and they speak well of you. Less money, better land.",
            fx: {honor:3,coin:-10,skill:{stewardship:2}},
          },
          {t:"Leave it as it is",r:"It has always been like this. It will be like this a while longer.",fx:{}},
        ],
      },
      {
        id: "pf_stew_assessor",
        cond: (p,C)=>(pro(p,C,"stewardship",45)||pro(p,C,"trade",50))&&p.coin>=60,
        w: .8,
        cool: 8,
        setup: (p,ctx)=>{ctx.ass=nm(p,"M")},
        title: "The assessor comes",
        text: "The crown's assessor {ass} is coming to {home} to count what everybody owns for the new tax. Everybody is burying silver in the garden. You know the law better than most, and you know how assessors think.",
        choices: [
          {
            t: "Arrange your affairs within the law",
            check: {s:"stewardship",s2:"learning",d:50},
            win: {
              r: "Gifts to the temple, debts called in, land in a cousin's name, all legal. You pay half what your neighbor pays.",
              fx: {coinPct:-.05,skill:{stewardship:3,learning:1}},
            },
            lose: {
              r: "The assessor knows the law better. You pay full, plus a fine for being clever.",
              fx: {coinPct:-.2,happy:-3},
            },
          },
          {
            t: "Bury it like everybody else",
            check: {s:"stealth",s2:"stewardship",d:45},
            win: {
              r: "The assessor finds a modest house with a modest purse. You pay little.",
              fx: {coinPct:-.05,honor:-1},
            },
            lose: {
              r: "His men have long iron rods and they know about gardens. You are fined a quarter of everything.",
              fx: {coinPct:-.25,honor:-2,wil:1},
            },
          },
          {
            t: "Pay what you owe",
            r: "You show everything and pay a tenth. The assessor is so surprised he shakes your hand.",
            fx: {coinPct:-.1,honor:3,favor:2},
          },
        ],
      },
      {
        id: "pf_stew_steward_post",
        cond: (p,C)=>pro(p,C,"stewardship",55)&&!C.noble(p)&&!C.ruler(p),
        w: .6,
        once: !0,
        setup: (p,ctx)=>{ctx.lrd=nm(p,"M")},
        title: "Steward of the manor",
        text: `Lord {lrd}'s steward has died, and the manor's accounts are a ruin. The lord has heard you can make land pay. "Steward of the manor: a house, a horse, forty suns a year and what you can save me. Do not steal more than your predecessor did."`,
        choices: [
          {
            t: "Accept, and run it honestly",
            r: "A house, a horse, and a hundred people's bread on your slate. It is the hardest work you have ever done, and you are good at it.",
            fx: {coin:40,gear:{mount:"palfrey"},skill:{stewardship:4},favor:4,fame:2,flag:"pf_steward"},
          },
          {
            t: "Accept, and skim a little like everyone",
            check: {s:"stewardship",s2:"deception",d:52},
            win: {
              r: "You make the land pay twice what it did, and keep a tenth of the difference. The lord is delighted. Everyone is happy, except your conscience.",
              fx: {coin:80,skill:{stewardship:3,deception:1},honor:-3,flag:"pf_steward"},
            },
            lose: {
              r: "The lord's lady counts better than the lord. You are dismissed, and lucky not to hang.",
              fx: {favor:-8,honor:-5,punish:"theft"},
            },
          },
          {t:"Decline",r:"You prefer to be your own master.",fx:{}},
        ],
      },
      {
        id: "pf_learn_letters",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=7&&!C.literate(p),
        once: !0,
        w: .6,
        title: "Letters in the dust",
        setup: (p,ctx)=>{ctx.tch=p.realm==="POL-27"?"the monk at the monastery school":p.realm==="POL-17"?"the old scribe by the paper market":"the priest, the only reader in the village,"},
        text: "{tch} scratches letters in the dust with a stick for any child who sits still long enough. Most of them wander off after a week. You keep coming back.",
        choices: [
          {
            t: "Learn every letter, then every word",
            check: {s:"int",s2:"wil",d:22},
            win: {
              r: "In a month you can read the inscription on the market cross. In a year, anything you can lay your hands on. The teacher starts lending you books.",
              fx: {apt:{learning:1.35},literate:!0,skill:{learning:4},int:.5},
            },
            lose: {r:"The letters will not stay still. You learn a few, and your name.",fx:{skill:{learning:1}}},
          },
          {
            t: "Learn your numbers instead",
            r: "Numbers make more sense to you than letters. Every market day proves it.",
            fx: {skill:{trade:2,logistics:1},int:.3},
          },
          {t:"Go and play",r:"Reading is for priests. You have a whole river to swim in.",fx:{happy:2}},
        ],
      },
      {
        id: "pf_learn_forged_deed",
        cond: (p,C)=>pro(p,C,"learning",40)&&C.literate(p),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{ctx.nb=nm(p,"M"),ctx.claimant=nm(p,"M"),ctx.flaw=A.pick(["dated in a year the old count was already dead","sealed with a seal that was not cut until ten years later","written on paper, though the old count only ever used parchment","using a title the lord did not hold until last spring"])},
        title: "The deed",
        text: "{claimant} has turned up with a deed saying the best meadow of your neighbor {nb} was sold to his grandfather sixty years ago. The reeve cannot read. {nb} cannot read. You can, and the deed is {flaw}.",
        choices: [
          {
            t: "Show it to the lord's court",
            check: {s:"learning",s2:"persuasion",d:48},
            win: {
              r: "You lay the deed beside a true one from the same year. The court sees it. {claimant} is fined and {nb} keeps the meadow. {nb} sends you a cheese every year until {nb} dies.",
              fx: {fame:2,honor:4,skill:{learning:3},newRel:{type:"friend",op:30}},
            },
            lose: {
              r: "The court cannot read either, and {claimant} has a good lawyer. {nb} loses the meadow.",
              fx: {happy:-4,honor:2,newRel:{type:"enemy",op:-20}},
            },
          },
          {
            t: "Find out who forged it",
            check: {s:"learning",s2:"intrigue",d:52},
            win: {
              r: "There is one man within thirty leagues who could cut a seal like that. He confesses for a lighter sentence. {claimant} hangs. Forgery of a land deed is no small thing.",
              fx: {fame:3,skill:{learning:2,intrigue:2},honor:3},
            },
            lose: {r:"The trail goes cold. But you have made {claimant} nervous.",fx:{newRel:{type:"enemy",op:-15}}},
          },
          {
            t: "Sell your silence to {claimant}",
            r: "Fifteen suns. {nb} loses the meadow. You read the deed wrong on purpose, and you will never read it right again.",
            fx: {coin:15,honor:-8},
          },
        ],
      },
      {
        id: "pf_learn_letter_writer",
        cond: (p,C)=>pro(p,C,"learning",30)&&C.literate(p)&&!C.noble(p),
        w: .8,
        cool: 6,
        title: "Six pence a letter",
        text: "Market day. You sit by the well with ink, quills and a board, and write letters for those who cannot: six pence a letter. A soldier's widow wants to tell her son his father is dead. A young man wants a love letter. A merchant wants something that sounds like a threat but is not quite one.",
        choices: [
          {
            t: "Write them all, and write them well",
            check: {s:"learning",s2:"persuasion",d:42},
            win: {
              r: "The widow cries and thanks you. The love letter works. The merchant's debtor pays. People come back next market day, and the one after.",
              fx: {coin:6,skill:{learning:2,persuasion:1},fame:1},
            },
            lose: {
              r: "You get the love letter and the threat mixed up. The merchant is delighted. The young man is not.",
              fx: {coin:2,happy:-1},
            },
          },
          {
            t: "Write the widow's letter for free",
            r: "You do not take her pennies. She blesses you in a way that makes you uncomfortable.",
            fx: {honor:2,piety:2,coin:3},
          },
          {t:"Refuse the merchant's threat",r:"He goes to someone less careful.",fx:{honor:1,coin:3}},
        ],
      },
      {
        id: "pf_learn_old_book",
        cond: (p,C)=>pro(p,C,"learning",45)&&C.literate(p),
        w: .6,
        cool: 12,
        setup: (p,ctx)=>{ctx.book=A.pick(["an Old Solen treatise on law","a Qadiri book of medicine on paper","a history of the old wars with half its pages missing","a book of star tables","a commentary on the scriptures of {faith}"]).replace("{faith}",faithName(p)),ctx.price=A.pick([30,40,60])},
        title: "A book for sale",
        text: "A monastery is selling off the library of a dead abbot to pay its debts. Most of it is prayer books. One is {book}, and the monk wants {price} suns for it. A book costs as much as a horse.",
        choices: [
          {
            t: "Buy it",
            req: (p,C,ctx)=>p.coin>=(ctx.price||999),
            r: "You carry it home like a newborn. You read it three times that winter.",
            fx: (p,ctx)=>A.applyFx(p,{coin:-ctx.price,skill:{learning:4},int:.6,happy:4},ctx),
          },
          {
            t: "Bargain the monk down",
            check: {s:"trade",s2:"learning",d:45},
            win: {
              r: "You point out the missing pages and the mould. Half price.",
              fx: (p,ctx)=>A.applyFx(p,{coin:-Math.round(ctx.price/2),skill:{learning:4,trade:1},int:.5},ctx),
            },
            lose: {r:"A richer scholar buys it while you are haggling.",fx:{happy:-3}},
          },
          {
            t: "Ask to read it there, for a week",
            check: {s:"persuasion",s2:"faith",d:42},
            win: {
              r: "The monk lets you sit in the cold library for a week. You copy what you can.",
              fx: {skill:{learning:3},int:.3},
            },
            lose: {r:'"Buy it or leave it." You leave it.',fx:{}},
          },
        ],
      },
      {
        id: "pf_learn_teach",
        cond: (p,C)=>pro(p,C,"learning",40)&&C.literate(p)&&!C.town(p),
        w: .6,
        cool: 15,
        setup: (p,ctx)=>{ctx.pr=nm(p,"M")},
        title: "The village school",
        text: "Nobody in {home} can read except you and the priest, {pr}. You think about teaching the children in the evenings. {pr} has made it clear that reading is the temple's business.",
        choices: [
          {
            t: "Teach them anyway",
            r: "A dozen children, a board, chalk. By spring six of them can read a little. {pr} preaches about pride and looks at you.",
            fx: {fame:2,honor:3,skill:{learning:2},newRel:{type:"enemy",op:-20},flag:"pf_school"},
          },
          {
            t: "Ask {pr} to teach with you",
            check: {s:"diplomacy",s2:"faith",d:45},
            win: {
              r: "You offer to read scripture with them first. {pr} agrees, warily, and then enthusiastically.",
              fx: {fame:2,honor:3,skill:{learning:1,diplomacy:2},newRel:{type:"friend",op:20},flag:"pf_school"},
            },
            lose: {r:"{pr} refuses, and tells the families that letters lead to heresy.",fx:{happy:-2}},
          },
          {
            t: "Leave it to the priest",
            r: "The children grow up as their parents did. It is not your fault. It feels a little like it is.",
            fx: {},
          },
        ],
      },
      {
        id: "pf_med_herbwife",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=8,
        once: !0,
        w: .5,
        setup: (p,ctx)=>{ctx.hw=nm(p,"F")},
        title: "The herbwife's basket",
        text: "Old {hw}, the herbwife, needs someone young to carry her basket and climb for things. She names every plant as she picks it: willow bark for fever, yarrow for bleeding, and the white flower that kills.",
        choices: [
          {
            t: "Learn every name she says",
            check: {s:"int",s2:"ins",d:22},
            win: {
              r: "By autumn you know more plants than her own daughter. When a boy cuts his foot, it is you who knows what to do. {hw} looks at you differently after that.",
              fx: {apt:{medicine:1.35},skill:{medicine:3,survival:1},newRel:{type:"mentor",op:25}},
            },
            lose: {r:"They all look green to you.",fx:{skill:{medicine:1}}},
          },
          {
            t: "Carry the basket and daydream",
            r: "A pleasant summer. You learn yarrow, at least.",
            fx: {skill:{medicine:1}},
          },
        ],
      },
      {
        id: "pf_med_leg",
        cond: (p,C)=>pro(p,C,"medicine",35),
        w: 1,
        cool: 5,
        setup: (p,ctx)=>{who(p,ctx,"acquaint")},
        title: "Under the wheel",
        text: "A loaded wagon has rolled over {themFull}'s leg in the lane. The bone is through the skin. The barber-surgeon is in {town}, a day away, and wants a sun for a set bone and five to cut. Everyone looks at you.",
        choices: [
          {
            t: "Set it here and now",
            check: {s:"medicine",s2:"str",d:50},
            win: {
              r: "Two men to pull, you to guide the bone home, wine to wash it, splints for six weeks. {They} walks again by harvest, with only a little limp.",
              fx: {skill:{medicine:3},fame:2,honor:3,them:{type:"friend",op:40}},
            },
            lose: {
              r: "The wound festers. You have to take the leg off above the knee. {They} lives.",
              fx: {skill:{medicine:2},happy:-5,wil:1.5,them:{op:10}},
            },
          },
          {
            t: "Take it off cleanly at once, before it festers",
            check: {s:"medicine",s2:"wil",d:45},
            win: {
              r: "A clean cut above the break, a hot iron, honey. {They} hates you for a month and thanks you for the rest of {theirHis} life.",
              fx: {skill:{medicine:3},wil:1,them:{type:"friend",op:20}},
            },
            lose: {r:"{They} dies of the shock that night.",fx:{happy:-8,wil:2,skill:{medicine:1}}},
          },
          {
            t: "Load {themHim} on a cart for the barber",
            r: "A day on a cart over ruts. {They} lives, barely, and limps for life.",
            fx: {them:{op:5}},
          },
        ],
      },
      {
        id: "pf_med_fever",
        cond: (p,C)=>pro(p,C,"medicine",45),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{ctx.phys=nm(p,"M")},
        title: "The fever house",
        text: "Fever has come to {home}. The priest wants a procession through the streets. The physician {phys} wants to bleed everyone. You have seen fevers before, and you think both are wrong.",
        choices: [
          {
            t: "Shut the sick in one house and nurse them yourself",
            check: {s:"medicine",s2:"wil",d:52},
            win: {
              r: "Clean water, broth, willow bark, rest, and no crowds. It burns out in a month. Fewer die in {home} than anywhere around.",
              fx: {fame:3,honor:4,skill:{medicine:3},wil:1.5,deed:"nursed a town through a fever"},
            },
            lose: {
              r: "You catch it yourself. You live. Many do not.",
              fx: {health:-20,wil:2.5,skill:{medicine:2},cause:"the fever"},
            },
          },
          {
            t: "Persuade them to stop the procession",
            check: {s:"persuasion",s2:"medicine",d:50},
            win: {
              r: "No procession, no crowds. The fever has fewer people to jump to. The priest is furious. The town lives.",
              fx: {honor:3,skill:{persuasion:2,medicine:1},piety:-1},
            },
            lose: {r:"The procession goes ahead. A week later the fever is in every street.",fx:{happy:-6,wil:1}},
          },
          {
            t: "Leave town until it passes",
            r: "You go to your cousin in {town}. When you come back, there are new graves.",
            fx: {happy:-4,honor:-2},
          },
        ],
      },
      {
        id: "pf_med_arrow",
        cond: (p,C)=>pro(p,C,"medicine",45)&&(C.soldier(p)||C.atWar(p)),
        w: 1,
        cool: 4,
        setup: (p,ctx)=>{who(p,ctx,"friend")},
        title: "The arrow",
        text: "After the skirmish, {themFull} sits against a cart with an arrow through the thigh, white as milk. The army surgeon is busy with the officers. A cut to the thigh kills in minutes if the big vessel is open, and this one is close.",
        choices: [
          {
            t: "Push it through and bind it",
            check: {s:"medicine",s2:"ins",d:52},
            win: {
              r: "Snap the shaft, push the head through, a strap above the wound, wine and honey. {They} lives. {They} will never forget whose hands those were.",
              fx: {skill:{medicine:3},them:{type:"friend",op:40},merit:3,fame:1},
            },
            lose: {
              r: "The vessel was open after all. You hold {themHim} as {theyHe} goes.",
              fx: {happy:-10,wil:3,skill:{medicine:1}},
            },
          },
          {
            t: "Drag the surgeon over by force",
            check: {s:"intimidation",s2:"command",d:50},
            win: {
              r: "The surgeon comes, swearing, and saves the leg. The officers complain about you.",
              fx: {merit:-1,them:{type:"friend",op:30},skill:{intimidation:1}},
            },
            lose: {r:"The surgeon has you dragged away instead.",fx:{merit:-3,happy:-4}},
          },
          {
            t: "Leave it in and wait for the surgeon",
            r: "By the time the surgeon comes, {theyHe} has a fever. {They} lives, just.".replace("{theyHe}","{theyHe}"),
            fx: {them:{op:5}},
          },
        ],
      },
      {
        id: "pf_med_birth",
        cond: (p,C)=>pro(p,C,"medicine",40),
        w: .8,
        cool: 8,
        setup: (p,ctx)=>{ctx.mom=nm(p,"F")},
        title: "A hard birth",
        text: "{mom} has been in labor two days. The midwife is snowed in on the far side of the valley. The child is lying wrong, and the women of the house are lighting candles and calling on {god}.",
        choices: [
          {
            t: "Turn the child",
            check: {s:"medicine",s2:"ins",d:55},
            win: {
              r: "Slow, gentle, patient hands. The child turns, and comes, and cries. Both live. You sit in the snow outside afterward and shake.",
              fx: {skill:{medicine:4},fame:2,honor:4,happy:6,newRel:{type:"friend",op:40}},
            },
            lose: {
              r: "The child comes, but too late. You save {mom}. That has to be enough.",
              fx: {skill:{medicine:2},happy:-6,wil:2},
            },
          },
          {
            t: "Go through the snow for the midwife",
            check: {s:"sta",s2:"survival",d:50},
            win: {
              r: "You bring her back across the pass by lantern-light. She saves them both.",
              fx: {honor:3,sta:.5,newRel:{type:"friend",op:25}},
            },
            lose: {
              r: "The pass is closed. You come back half frozen and too late.",
              fx: {wound:"frostbite",health:-10,happy:-5,cause:"cold"},
            },
          },
          {t:"Pray with the women",r:"{god} decides. This time, kindly. Mother and child live.",fx:{piety:3}},
        ],
      },
      {
        id: "pf_med_unicorn",
        cond: (p,C)=>pro(p,C,"medicine",40)||C.adult(p)&&C.prof(p,"learning",55),
        w: .6,
        cool: 15,
        setup: (p,ctx)=>{ctx.rich=nm(p,"M")},
        title: "The unicorn cup",
        text: "{rich}, a rich man who fears poison, shows you his treasure: a cup carved from unicorn horn, which turns black if poison touches it. He paid 400 suns. You have seen whale tusks on the docks. This is one.",
        choices: [
          {
            t: "Tell him the truth",
            check: {s:"persuasion",s2:"medicine",d:48},
            win: {
              r: "He goes red, then pale, then thanks you, and hires a food-taster instead. A food-taster actually works.",
              fx: {honor:3,coin:5,skill:{medicine:1},newRel:{type:"friend",op:15}},
            },
            lose: {r:"He throws you out for insulting his treasure.",fx:{happy:-2,newRel:{type:"enemy",op:-15}}},
          },
          {t:"Admire it and say nothing",r:"He is happy. You are fed. The whale does not mind.",fx:{coin:2}},
          {
            t: "Offer to sell him a second one",
            req: (p,C)=>C.prof(p,"deception",35),
            r: "You know a man on the docks with whale tusks. You split two hundred suns with him.",
            fx: {coin:100,honor:-6,skill:{deception:2}},
          },
        ],
      },
      {
        id: "pf_faith_kid_temple",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=7,
        once: !0,
        w: .5,
        title: "At the altar",
        text: p=>`You are sent to help at the ${faithName(p)==="the old gods"?"shrine":"temple of "+faithName(p)}: sweeping, trimming lamps, carrying water. The priest is old and tired. You find yourself staying long after you are needed, listening.`,
        choices: [
          {
            t: "Learn the rites by heart",
            check: {s:"wil",s2:"int",d:22},
            win: {
              r: "By the next festival you know every word of the rite, and the priest lets you speak a line of it. The village watches you with new eyes.",
              fx: {apt:{faith:1.3},skill:{faith:3},piety:4},
            },
            lose: {r:"The words slip away. The peace does not.",fx:{skill:{faith:1},piety:2}},
          },
          {
            t: "Ask the priest hard questions",
            r: '"Why does {god} let children die?" The priest has no answer, but he likes that you asked.',
            fx: {skill:{faith:2},int:.3},
          },
          {t:"Sweep and go home",r:"It is just a chore.",fx:{}},
        ],
      },
      {
        id: "pf_faith_debate",
        cond: (p,C)=>pro(p,C,"faith",50),
        w: .8,
        cool: 8,
        setup: (p,ctx)=>{who(p,ctx,"rival"),ctx.other=A.pick(["a wandering preacher of another faith","a priest who says your rites are corrupt","a learned skeptic from the city","a zealot who says the end is coming"])},
        title: "The debate",
        text: "{themFull}, {other}, has been drawing crowds in the market at {home}. The lord, bored, has invited you both to debate in his hall before the whole household. Whoever loses will not be welcome in {home} again.",
        choices: [
          {
            t: "Answer from scripture, line by line",
            check: {s:"faith",s2:"learning",d:55},
            win: {
              r: "You know the old texts better. By the end {theyHe} is stammering and the hall is with you. {They} leaves {home} at dawn.",
              fx: {fame:3,piety:3,skill:{faith:3},favor:2,them:{type:"rival",op:-20}},
            },
            lose: {
              r: "{They} quotes a line you did not know was there. The hall laughs at you.",
              fx: {fame:-2,happy:-4,wil:1.5},
            },
          },
          {
            t: "Answer from the heart, plainly",
            check: {s:"faith",s2:"persuasion",d:50},
            win: {
              r: "No quotations. Just what you have seen and believe. Half the hall is in tears.",
              fx: {fame:2,piety:4,skill:{faith:2,persuasion:1}},
            },
            lose: {r:"Plain is not enough against a trained tongue.",fx:{fame:-1,happy:-3}},
          },
          {
            t: "Find common ground with {themHim}",
            check: {s:"faith",s2:"diplomacy",d:48},
            win: {
              r: "By the end you are both explaining to the lord why the other is partly right. The lord is baffled. You and {them} go off to drink together.",
              fx: {them:{type:"friend",op:30},skill:{diplomacy:2,faith:1},honor:2},
            },
            lose: {r:"The lord wanted a fight. He is disappointed in you both.",fx:{favor:-2}},
          },
        ],
      },
      {
        id: "pf_faith_heresy",
        cond: (p,C)=>pro(p,C,"faith",40),
        w: .7,
        cool: 10,
        setup: (p,ctx)=>{ctx.acc=nm(p,"F")},
        title: "Heresy",
        text: '{acc}, a weaver, has been accused of secret worship: ash marks on her door, strange words at night. Folk whisper "the Ashen". The priest has asked you, who know the faith best after him, to examine her.',
        choices: [
          {
            t: "Examine her fairly",
            check: {s:"faith",s2:"int",d:50},
            win: {
              r: `Her "strange words" are a lullaby in her grandmother's tongue. The ash is from her hearth. You say so, clearly. She is freed.`,
              fx: {honor:5,skill:{faith:2},fame:1,newRel:{type:"friend",op:35}},
            },
            lose: {
              r: "You cannot tell for sure. You say so. The village decides for you, and it is not kind.",
              fx: {happy:-5,wil:1.5},
            },
          },
          {
            t: "Find her guilty: it is safer",
            r: "She is driven out of {home} with her children. You are thanked. You do not sleep well.",
            fx: {piety:2,honor:-6,happy:-4},
          },
          {
            t: "Warn her to leave tonight",
            r: "She is gone by dawn. The priest suspects you and never trusts you again.",
            fx: {honor:3,piety:-2},
          },
        ],
      },
      {
        id: "pf_faith_rites",
        cond: (p,C)=>pro(p,C,"faith",35),
        w: .8,
        cool: 8,
        setup: (p,ctx)=>{ctx.dy=nm(p,"M")},
        title: "No priest",
        text: '{dy}, an old shepherd, is dying in a hut far up the hill. The priest cannot come in time. {dy} grips your sleeve. "You know the words. Say them for me."',
        choices: [
          {
            t: "Say the rite as well as any priest",
            check: {s:"faith",s2:"wil",d:45},
            win: {
              r: "Every word, in order, in a steady voice. {dy} dies in peace, holding your hand.",
              fx: {piety:5,skill:{faith:3},wil:1,honor:2},
            },
            lose: {r:"You stumble on the words. {dy} does not seem to mind. You do.",fx:{piety:2,wil:1.5}},
          },
          {
            t: "Just hold his hand and talk",
            r: "You talk about sheep and weather and his wife, long dead. It is enough.",
            fx: {happy:-2,wil:1,honor:2},
          },
        ],
      },
      {
        id: "pf_faith_omen",
        cond: (p,C)=>pro(p,C,"faith",45),
        w: .7,
        cool: 12,
        setup: (p,ctx)=>{ctx.omen=A.pick(["a comet with a long tail","the sun going dark at noon","a calf born with two heads","a blood-red moon"]),ctx.prophet=nm(p,"M")},
        title: "The omen",
        text: "{omen}. By evening a wild-eyed man called {prophet} is preaching in the square that it is the end foretold, and that the faithful must give away everything they own, to him. People are listening.",
        choices: [
          {
            t: "Stand up and answer him from the scriptures",
            check: {s:"faith",s2:"persuasion",d:52},
            win: {
              r: "You remind them that prophecies have been read in a hundred skies, and the world has gone on. Nobody hands {prophet} their savings. He leaves town in the night.",
              fx: {fame:3,piety:2,skill:{faith:3},honor:2},
            },
            lose: {
              r: "Fear is louder than you. Three families give {prophet} everything they own.",
              fx: {happy:-4,wil:1},
            },
          },
          {
            t: "Have the reeve run him out of town",
            check: {s:"intimidation",s2:"faith",d:45},
            win: {r:"He goes. The fear goes slower.",fx:{skill:{intimidation:1},honor:1}},
            lose: {r:"The crowd protects him. Now he is a martyr.",fx:{happy:-3}},
          },
          {t:"Pray, and wait",r:"Nothing ends. In a week, everyone is a little embarrassed.",fx:{piety:1}},
        ],
      },
      {
        id: "pf_trade_eggs",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=8,
        once: !0,
        w: .5,
        title: "A basket of eggs",
        text: "You are sent to market with a basket of eggs and told to bring back a penny for every dozen. The stall next to you sells them for less.",
        choices: [
          {
            t: "Sell them for more anyway",
            check: {s:"int",s2:"wil",d:22},
            win: {
              r: '"Brown eggs, from hens fed on barley." It is not even a lie. You come home with half again what you were sent for. {mother} counts it twice.',
              fx: {apt:{trade:1.3},skill:{trade:3,persuasion:1},family:2,happy:3},
            },
            lose: {r:"Nobody buys. You sell them at noon for whatever you can get.",fx:{skill:{trade:1},family:-1}},
          },
          {
            t: "Undercut the stall next door",
            r: "You sell out in an hour and earn less than you should. Fast is not the same as good.",
            fx: {skill:{trade:2}},
          },
          {
            t: "Trade them for a kitten",
            r: "{mother} is speechless. The kitten is very nice.",
            fx: {happy:4,family:-1},
          },
        ],
      },
      {
        id: "pf_trade_caravan",
        cond: (p,C)=>pro(p,C,"trade",40),
        w: 1,
        cool: 5,
        setup: (p,ctx)=>{const r=p.realm;ctx.goods=r==="POL-21"||r==="POL-32"?"pepper and clove":r==="POL-24"||r==="POL-17"?"dates and paper":r==="POL-01"?"amber":r==="POL-09"||r==="POL-08"?"tin":r==="POL-25"||r==="POL-26"?"furs and beeswax":r==="POL-19"?"salt":A.pick(["wool","salt","wine","iron"]),ctx.trader=nm(p,"M")},
        title: "The caravan",
        text: "A caravan has come into {home} with forty mule-loads of {goods}, and its master {trader} wants to sell the lot fast and go home before the passes close. He is tired. He is not stupid.",
        choices: [
          {
            t: "Haggle for the whole load",
            req: p=>p.coin>=60,
            check: {s:"trade",s2:"persuasion",d:52},
            win: {
              r: "Three cups of wine and two walk-aways later, you buy the lot at a price that makes you want to sing. You sell it in {town} for half again what you paid.",
              fx: {coin:45,skill:{trade:3},fame:1,newRel:{type:"friend",op:10}},
            },
            lose: {
              r: "He sees through you. You pay a fair price, and the market in {town} is glutted when you get there.",
              fx: {coin:-15,skill:{trade:1}},
            },
          },
          {
            t: "Broker it to local buyers for a cut",
            check: {s:"trade",s2:"diplomacy",d:45},
            win: {
              r: "You know every buyer within ten leagues. Everyone is happy, and a tenth of everything is yours.",
              fx: {coin:20,skill:{trade:2,diplomacy:1}},
            },
            lose: {r:"The buyers do not trust you, and {trader} sells to someone else.",fx:{happy:-1}},
          },
          {
            t: "Buy a little for yourself",
            r: "A mule-load for your own shelf. A small, sure profit.",
            fx: {coin:5,skill:{trade:1}},
          },
        ],
      },
      {
        id: "pf_trade_scales",
        cond: (p,C)=>pro(p,C,"trade",45)&&(C.town(p)||C.coast(p)),
        w: .8,
        cool: 8,
        setup: (p,ctx)=>{ctx.mer=nm(p,"M"),ctx.place=p.realm==="POL-21"?"the Pepper Hall":p.realm==="POL-32"?"the scales of Amberport":p.realm==="POL-16"?"the Exchange":"the cloth hall"},
        title: "A thumb on the scale",
        text: "At {place} you watch {mer}, a big merchant, weighing for the small growers. Something about the way his scale sits is wrong. You buy a pound of his goods and weigh it at home. It is short by an eighth.",
        choices: [
          {
            t: "Expose him before the market wardens",
            check: {s:"trade",s2:"persuasion",d:50},
            win: {
              r: "You bring the wardens, a true weight and your pound. {mer} is fined and his scale is broken in the square. The growers buy you drinks for a month.",
              fx: {fame:3,honor:4,skill:{trade:2},newRel:{type:"enemy",op:-40}},
            },
            lose: {
              r: "The wardens dine with {mer}. They find nothing wrong. You are told to stop making trouble.",
              fx: {happy:-3,newRel:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Show {mer} privately that you know",
            check: {s:"trade",s2:"intrigue",d:48},
            win: {
              r: "{mer} offers you a share in his business for your silence. It is a very good share.",
              fx: {coin:40,honor:-5,skill:{intrigue:1},flag:"pf_partner_crook"},
            },
            lose: {
              r: "{mer} has you beaten in an alley as a warning.",
              fx: {health:-10,wound:"broken_ribs",cause:"a beating in an alley"},
            },
          },
          {
            t: "Warn the growers quietly",
            r: "They take their goods elsewhere. {mer} never knows why business is bad.",
            fx: {honor:3,skill:{trade:1}},
          },
        ],
      },
      {
        id: "pf_trade_venture",
        cond: (p,C)=>pro(p,C,"trade",45)&&p.coin>=100&&(C.coast(p)||C.town(p)),
        w: .8,
        cool: 6,
        setup: (p,ctx)=>{ctx.ship=A.pick(["the Grey Heron","the Good Hope","the Sun at Sea","the Fat Goose","the Seventh Daughter"])},
        title: "A share in a ship",
        text: "Sea Opening. {ship}, a sound cog with a sober master, is fitting out for a run down the coast and back before Sea Closing. Shares are 100 suns. A good run doubles your money. A wreck takes it all.",
        choices: [
          {
            t: "Buy a share and study the master's plan",
            check: {s:"trade",s2:"sea",d:50},
            win: {
              r: "You talk the master out of the cargo he wanted and into the one you knew would sell. {ship} comes home at Sea Closing riding low. You double your money.",
              fx: {coin:100,skill:{trade:3},fame:1},
            },
            lose: {
              r: "Pirates off the cape, or a storm, or both. {ship} never comes home.",
              fx: {coin:-100,wil:1.5,happy:-6},
            },
          },
          {
            t: "Buy a share and hope",
            r: (p,ctx)=>ctx.ventOk?"She comes home. You make sixty suns, and you did nothing to earn it.":"She does not come home. Sixty sailors drown with your hundred suns.",
            fx: (p,ctx)=>(ctx.ventOk=A.chance(.55),A.applyFx(p,ctx.ventOk?{coin:60,skill:{trade:1}}:{coin:-100,happy:-5,wil:1},ctx),""),
          },
          {t:"Keep your money in your boot",r:"Safe. Boring. Safe.",fx:{}},
        ],
      },
      {
        id: "pf_trade_corner",
        cond: (p,C)=>pro(p,C,"trade",60)&&p.coin>=200,
        w: .6,
        cool: 12,
        title: "The hungry year",
        text: "The harvest has failed across half the realm. You have the coin to buy every sack of grain in {home} and the two towns around it, and hold it until spring, when prices will be four times what they are now. It is legal. It is very profitable.",
        choices: [
          {
            t: "Buy it all and hold",
            check: {s:"trade",s2:"intrigue",d:52},
            win: {
              r: "By spring you are rich, and every family in three towns knows your name and spits it.",
              fx: {coinPct:.6,honor:-10,fame:2,trait:"greedy",skill:{trade:3}},
            },
            lose: {
              r: "The lord orders the granaries opened at last year's prices. You lose a quarter of your money and all of your name.",
              fx: {coinPct:-.25,honor:-8,favor:-5},
            },
          },
          {
            t: "Buy it, and sell it at a fair price all winter",
            r: "You make a small, honest profit, and the poor of three towns eat. People remember that kind of thing for a generation.",
            fx: {coin:20,honor:6,fame:3,skill:{trade:2},deed:"sold grain at a fair price in a hungry year"},
          },
          {t:"Leave it alone",r:"Someone else does it instead. Prices go up anyway.",fx:{}},
        ],
      },
      {
        id: "pf_trade_bad_coin",
        cond: (p,C)=>pro(p,C,"trade",35),
        w: .7,
        cool: 8,
        setup: (p,ctx)=>{ctx.cust=nm(p,"M"),ctx.coinname=p.realm==="POL-31"?"Leontines":"silver"},
        title: "Clipped coin",
        text: "{cust} pays for a big order with a heavy purse of {coinname}. You weigh one in your palm. Too light. You bite another. Too soft. Forgers and clippers are everywhere this year.",
        choices: [
          {
            t: "Check every coin in front of him",
            check: {s:"trade",s2:"wil",d:45},
            win: {
              r: "A third of them are bad. {cust} blusters, then pays in good coin. Word gets round that you cannot be cheated.",
              fx: {coin:10,skill:{trade:2},fame:1},
            },
            lose: {
              r: "{cust} takes offense, takes his order and leaves. Maybe they were good after all.",
              fx: {happy:-2},
            },
          },
          {
            t: "Take them, and pass them on to someone else",
            check: {s:"deception",s2:"trade",d:45},
            win: {r:"The bad coin goes out as fast as it came in. Somebody else is the loser.",fx:{coin:10,honor:-3}},
            lose: {r:"You pass one to a market warden. Passing bad coin is a crime.",fx:{punish:"theft",honor:-4}},
          },
          {
            t: "Take them and swallow the loss",
            r: "You lose eight suns. You learn to bite coins.",
            fx: {coin:-8,skill:{trade:1}},
          },
        ],
      },
      {
        id: "pf_craft_whittle",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=7,
        once: !0,
        w: .5,
        title: "A knife and a block of wood",
        text: "{father}'s old knife, a block of lime wood, and a long winter evening. Everyone else is telling stories by the fire. You are making something.",
        choices: [
          {
            t: "Carve a horse",
            check: {s:"int",s2:"spd",d:22},
            win: {
              r: "By spring the horse has a mane you can almost feel. A peddler offers you a penny for it. You say no. The next one you sell.",
              fx: {apt:{craft:1.35},skill:{craft:3},happy:4},
            },
            lose: {r:"It looks like a dog with a bad back. You keep it anyway.",fx:{skill:{craft:1},happy:1}},
          },
          {
            t: "Carve a spoon, something useful",
            r: "It is a good spoon. {mother} uses it for years.",
            fx: {skill:{craft:2},rel:{who:"mother",op:5}},
          },
        ],
      },
      {
        id: "pf_craft_masterpiece",
        cond: (p,C)=>C.adult(p)&&(pro(p,C,"craft",55)||C.prof(p,"craft",40)&&["smith","carpenter","mason","weaver","bowyer","brewer"].includes(p.job&&p.job.c)),
        w: .8,
        once: !0,
        setup: (p,ctx)=>{ctx.fee=A.pick([20,30,40])},
        title: "The masterpiece",
        text: "You have been a journeyman long enough. To become a master you must show a finished piece to the guild, pay an entry fee of {fee} suns and give a feast. Then you may open your own shop, take apprentices and vote.",
        choices: [
          {
            t: "Make the best thing you have ever made",
            req: (p,C,ctx)=>p.coin>=(ctx.fee||999)+10,
            check: {s:"craft",s2:"int",d:55},
            win: {
              r: "The guild masters turn it over in their hands for a long time. Then they bang the table. You are a master.",
              fx: (p,ctx)=>A.applyFx(p,{coin:-(ctx.fee+10),skill:{craft:4},fame:3,happy:8,asset:"workshop",ach:"master_craft",deed:"became a master of the guild"},ctx),
            },
            lose: {
              r: `"A good piece. Not a master's piece." You will try again in a year.`,
              fx: {skill:{craft:2},happy:-5,wil:1.5},
            },
          },
          {
            t: "Make something new nobody has seen",
            req: (p,C,ctx)=>p.coin>=(ctx.fee||999)+10,
            check: {s:"craft",s2:"wil",d:60},
            win: {
              r: "The old masters argue about it for an hour. The young ones are already copying it. You are a master, and a name.",
              fx: (p,ctx)=>A.applyFx(p,{coin:-(ctx.fee+10),skill:{craft:5},fame:5,happy:8,asset:"workshop",ach:"master_craft"},ctx),
            },
            lose: {
              r: '"This is not how it is done." They reject it. In ten years, it is how it is done.',
              fx: {skill:{craft:3},happy:-6,wil:2},
            },
          },
          {
            t: "Wait another year and save",
            r: "Another year at a master's bench, earning his money. Patience.",
            fx: {coin:20,skill:{craft:1}},
          },
        ],
      },
      {
        id: "pf_craft_dwarf",
        cond: (p,C)=>pro(p,C,"craft",45)&&!C.race(p,"dwarf"),
        w: .6,
        once: !0,
        setup: (p,ctx)=>{ctx.dw=nm(p,"M")},
        title: "The dwarf at the forge",
        text: "A dwarf smith called {dw} rents the forge next to yours for a month. Dwarves never teach outsiders. The Judgment of the First Hall, in 904, forbids it. But nobody can forbid you to watch through a crack in the wall.",
        choices: [
          {
            t: "Watch every day, and copy",
            check: {s:"craft",s2:"int",d:55},
            win: {
              r: "The way he folds the steel, the color he waits for, the water he quenches in. You do not learn the secret. You learn enough to be the best smith in {home}.",
              fx: {skill:{craft:5},int:.4,flag:"pf_dwarf_eye"},
            },
            lose: {
              r: "{dw} sees you watching and nails a board over the crack.",
              fx: {skill:{craft:1},newRel:{type:"rival",op:-10}},
            },
          },
          {
            t: "Ask him straight out to teach you",
            check: {s:"persuasion",s2:"craft",d:62},
            win: {
              r: "He refuses, of course. But he looks at your work and tells you, gruffly, three things wrong with it. Three things are a lot, from a dwarf.",
              fx: {skill:{craft:3},newRel:{type:"friend",op:20}},
            },
            lose: {r:'"No." That is the whole conversation.',fx:{}},
          },
          {
            t: "Leave him in peace",
            r: "He nods to you once, when he leaves. Dwarves remember courtesy.",
            fx: {honor:1},
          },
        ],
      },
      {
        id: "pf_craft_unpaid",
        cond: (p,C)=>pro(p,C,"craft",40),
        w: .8,
        cool: 8,
        setup: (p,ctx)=>{ctx.lrd=nm(p,"M"),ctx.what=A.pick(["a set of carved choir stalls","a gate with iron hinges","a cart and harness","a chest with a secret lock"])},
        title: "Payment on delivery",
        text: 'You made {what} for Sir {lrd}. Three months of work. He took it, praised it, and has not paid you. It has been a year. His steward says "soon".',
        choices: [
          {
            t: "Go to his hall and ask in front of his guests",
            check: {s:"persuasion",s2:"wil",d:50},
            win: {
              r: "In front of his guests he cannot refuse without looking poor. He pays in full and adds a tip to look generous.",
              fx: {coin:40,skill:{persuasion:2},newRel:{type:"enemy",op:-15}},
            },
            lose: {r:"He has you thrown out. In front of his guests.",fx:{happy:-5,fame:-1,wil:1}},
          },
          {
            t: "Take the guild to the lord's court",
            check: {s:"stewardship",s2:"learning",d:48},
            win: {
              r: "The guild stands behind you. Sir {lrd} is ordered to pay, with interest.",
              fx: {coin:45,skill:{learning:1}},
            },
            lose: {r:"The court sides with the knight. Of course.",fx:{happy:-4}},
          },
          {
            t: "Let it go. Knights do not pay.",
            r: "You write it off. You charge the next knight double, up front.",
            fx: {wil:1},
          },
        ],
      },
      {
        id: "pf_craft_candle",
        cond: (p,C)=>pro(p,C,"craft",30)&&C.town(p),
        w: .6,
        cool: 8,
        setup: (p,ctx)=>{ctx.wd=nm(p,"M")},
        title: "Working by candlelight",
        text: "You have an order due tomorrow and are working by candlelight, which the guild forbids for fear of fire and bad work. A knock at the shutter. It is {wd}, the guild's searcher.",
        choices: [
          {
            t: "Blow out the candle and keep very still",
            check: {s:"stealth",s2:"wil",d:45},
            win: {
              r: "{wd} knocks again, mutters, and moves on. You finish the order in the dark by feel.",
              fx: {skill:{craft:1,stealth:1},coin:5},
            },
            lose: {r:"{wd} saw the light go out. A fine of five suns, and the guild master's frown.",fx:{coin:-5}},
          },
          {
            t: "Let him in and show him the work",
            check: {s:"craft",s2:"persuasion",d:48},
            win: {
              r: '{wd} looks at the work a long time. "This is not bad work," he says, and pretends he saw nothing.',
              fx: {coin:5,skill:{craft:1},newRel:{type:"friend",op:15}},
            },
            lose: {r:'"Rules are rules." Five suns.',fx:{coin:-5}},
          },
          {
            t: "Pay him to forget (2 suns)",
            r: "He forgets. He will remember the next time he needs two suns.",
            fx: {coin:-2,honor:-1},
          },
        ],
      },
      {
        id: "pf_farm_lambs",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=8&&!C.town(p),
        once: !0,
        w: .5,
        title: "Lambing night",
        text: "Lambing season, a freezing night, and everyone else is busy in the far fold. A ewe is in trouble, and you are the only one there.",
        choices: [
          {
            t: "Help her, the way you have seen it done",
            check: {s:"ins",s2:"wil",d:22},
            win: {
              r: "Twins. Both alive, both steaming in the frost. When {father} comes, he finds you asleep in the straw with a lamb on each side.",
              fx: {apt:{husbandry:1.35},skill:{husbandry:3},happy:5,family:2},
            },
            lose: {
              r: "One lamb lives. You cry over the other, and {father} tells you that it happens to everyone.",
              fx: {skill:{husbandry:1},wil:1},
            },
          },
          {
            t: "Run for help",
            r: "You run. By the time help comes, the ewe has managed alone. One lamb.",
            fx: {skill:{husbandry:1}},
          },
        ],
      },
      {
        id: "pf_farm_sick_herd",
        cond: (p,C)=>pro(p,C,"husbandry",35)&&!C.town(p),
        w: .9,
        cool: 6,
        title: "The cows are sick",
        text: ()=>`${A.pick(["Two cows are off their feed and slobbering","The sheep are coughing in the fold","The pigs have red blotches on their skin"])}. If it is the bad sickness, it will go through the whole village herd. The priest has offered to bless them. The neighbors want them driven into the common pasture with the rest.`,
        choices: [
          {
            t: "Separate them at once and burn the bedding",
            check: {s:"husbandry",s2:"medicine",d:48},
            win: {
              r: "It stays in your two. Everyone else's herd is spared. Your neighbors grumble and, later, thank you.",
              fx: {skill:{husbandry:3},honor:3,coin:-5,fame:1},
            },
            lose: {r:"Too late. It is already in the herd. Half of your animals die.",fx:{coin:-30,happy:-6,wil:1.5}},
          },
          {
            t: "Treat them with what the old herders use",
            check: {s:"husbandry",s2:"int",d:45},
            win: {r:"Warm mash, a bitter herb, a dry stall. They recover.",fx:{skill:{husbandry:2}}},
            lose: {r:"You lose one. The other recovers.",fx:{coin:-15,skill:{husbandry:1}}},
          },
          {t:"Let the priest bless them",r:"They are blessed. One dies anyway.",fx:{coin:-15,piety:2}},
        ],
      },
      {
        id: "pf_farm_plough_match",
        cond: (p,C)=>pro(p,C,"husbandry",40)&&!C.town(p)&&!C.old(p),
        w: .8,
        cool: 5,
        setup: (p,ctx)=>{who(p,ctx,"rival")},
        title: "The straightest furrow",
        text: p=>`${inR(p,"POL-01","POL-05","POL-08","POL-14")?"The Plough-Wife's Day":"May Fair"}, and the ploughing match on the long field. A team of oxen each, a stake at the far end, and the straightest furrow wins a new plough-share. {themFull} has won three years running and is already polishing {theirHis} trophy.`,
        choices: [
          {
            t: "Plough for the prize",
            check: {s:"husbandry",s2:"str",d:50},
            win: {
              r: "Your furrow runs like a ruler to the stake. The judge sights along it twice and gives it to you. {They} congratulates you through gritted teeth.",
              fx: {fame:2,coin:8,skill:{husbandry:3},happy:5,them:{type:"rival",op:-10}},
            },
            lose: {
              r: "Your oxen decide halfway that they would rather visit the hedge.",
              fx: {happy:-2,skill:{husbandry:1},them:{type:"rival",op:5}},
            },
          },
          {
            t: "Ask {themHim} the secret",
            r: '"Look at the stake, not the oxen." {They} is pleased to be asked, and you become friends.',
            fx: {skill:{husbandry:2},them:{type:"friend",op:20}},
          },
          {
            t: "Sit with the old folk and judge the furrows",
            r: "You know a good furrow when you see one. The old folk are impressed.",
            fx: {happy:2},
          },
        ],
      },
      {
        id: "pf_farm_bull",
        cond: (p,C)=>pro(p,C,"husbandry",40)&&p.coin>=30,
        w: .7,
        cool: 8,
        setup: (p,ctx)=>{ctx.sell=nm(p,"M")},
        title: "The bull at the fair",
        text: "{sell} is selling a magnificent young bull at the fair for 40 suns. The crowd admires it. You walk all the way round it, twice, and look at its eyes and its feet.",
        choices: [
          {
            t: "Look it over properly before you buy",
            check: {s:"husbandry",s2:"ins",d:48},
            win: {
              r: p=>A.pick(["Sound from horn to hoof. You buy it, and in five years every good calf in the valley has its face.","Its feet are bad and it has been drugged to stand still. You walk away. A fool buys it."]),
              fx: {skill:{husbandry:3},coin:15},
            },
            lose: {r:"It looks sound. It is not. It dies in the spring.",fx:{coin:-40,happy:-5,wil:1}},
          },
          {
            t: "Haggle him down",
            check: {s:"trade",s2:"husbandry",d:45},
            win: {
              r: "Thirty suns, and it is a good bull. Your neighbors pay you to bring their cows.",
              fx: {coin:5,skill:{trade:1,husbandry:2}},
            },
            lose: {r:"He sells it to someone else while you are haggling.",fx:{}},
          },
          {t:"Walk on",r:"Bulls are trouble. You already have enough of it.",fx:{}},
        ],
      },
      {
        id: "pf_farm_hiring",
        cond: (p,C)=>C.adult(p)&&!C.job(p)&&(C.poor(p)||C.unfree(p))&&(C.prof(p,"husbandry",25)||C.terr(p,"plains","hills")),
        w: .7,
        cool: 6,
        setup: (p,ctx)=>{ctx.f1=nm(p,"M"),ctx.f2=nm(p,"F")},
        title: "The hiring fair",
        text: "May Fair, and the hiring fair in the square. Farmhands stand in a line with a wisp of straw in their hats. A farmhand earns sixty suns a year with board. Two farmers want you: {f1}, rich and known to be hard, and {f2}, poorer and known to be fair.",
        choices: [
          {
            t: "Go with {f1} and bargain for more",
            check: {s:"husbandry",s2:"trade",d:45},
            win: {
              r: "Seventy suns, board, and a coat at the Slaughter Feast. He works you hard. You earn it.",
              fx: {job:"farm",coin:10,skill:{husbandry:2,trade:1},sta:.4},
            },
            lose: {
              r: "Sixty, and he means to get every penny of it out of your back.",
              fx: {job:"farm",health:-3,sta:.5,cause:"overwork"},
            },
          },
          {
            t: "Go with {f2}",
            r: "Less coin, better food, kinder days. You learn more from her than from anyone.",
            fx: {job:"farm",skill:{husbandry:3},happy:3,newRel:{type:"friend",op:20}},
          },
          {
            t: "Try your luck in the town instead",
            r: "You take the straw out of your hat and walk to {town}.",
            fx: {happy:1},
          },
        ],
      },
      {
        id: "pf_gamb_bones",
        cond: (p,C)=>kid(p,C)&&C.ageAdj(p)>=8,
        once: !0,
        w: .4,
        title: "Knucklebones",
        text: p=>`The children play ${diceGame(p)==="bones"?"bones, sheep's ankle bones thrown and flicked, each face a beast":"knucklebones on the church step"} for buttons and bits of ribbon. You have been watching for a week. You think you have worked out how to win.`,
        choices: [
          {
            t: "Play, and count every throw",
            check: {s:"int",s2:"ins",d:22},
            win: {
              r: "By sunset you have every button in the lane. You have also worked out which bones land which way, and that most people never notice.",
              fx: {apt:{gambling:1.3},skill:{gambling:3},happy:4},
            },
            lose: {r:"You lose your own buttons, and then {mother}'s.",fx:{skill:{gambling:1},happy:-2}},
          },
          {
            t: "Give the buttons back afterward",
            r: "You win, and give them back. They like you better than any winner they have had.",
            fx: {skill:{gambling:1},honor:2},
          },
        ],
      },
      {
        id: "pf_gamb_cheat",
        cond: (p,C)=>pro(p,C,"gambling",40),
        w: 1,
        cool: 4,
        setup: (p,ctx)=>{who(p,ctx,"acquaint"),ctx.game=diceGame(p)},
        title: "Loaded",
        text: "{game} in the back room of the alehouse, for real money. {themFull} has won seven throws in nine. You have played long enough to know that does not happen. {Their} dice are loaded.",
        choices: [
          {
            t: "Call it out and demand the dice",
            check: {s:"gambling",s2:"wil",d:48},
            win: {
              r: "You split one die on the table with your knife. Lead. The table takes back its money, and a bit more, from {themHim}.",
              fx: {coin:12,fame:1,skill:{gambling:2},them:{type:"enemy",op:-40}},
            },
            lose: {
              r: "{They} switches the dice before you can grab them. Now you look like a sore loser, and {theyHe} has a knife.".replace("{theyHe}","{theyHe}"),
              fx: {
                duel: {
                  foe: "them",
                  tier: 2,
                  opts: {kind:"brawl",lethal:!1,toYield:!0,place:"the back room",title:"Loaded dice"},
                },
              },
            },
          },
          {
            t: "Bet with {themHim}, not against",
            check: {s:"gambling",s2:"ins",d:45},
            win: {
              r: "You side-bet on every throw {theyHe} makes. {They} cannot lose without losing too. You walk out twenty suns up.",
              fx: {coin:20,skill:{gambling:3},honor:-1},
            },
            lose: {r:"{They} notices and starts losing on purpose. Expensive lesson.",fx:{coin:-10}},
          },
          {
            t: "Tell {themHim} quietly you know, and want a share",
            req: (p,C)=>C.prof(p,"deception",30)||C.trait(p,"greedy"),
            r: "{They} grins and slides you a third of the night's take. You have a partner now, of sorts.",
            fx: {coin:15,honor:-4,them:{type:"friend",op:15},flag:"pf_cheat_partner"},
          },
          {
            t: "Leave the table",
            r: "You get up with what you have. It is the oldest winning move in the game.",
            fx: {},
          },
        ],
      },
      {
        id: "pf_gamb_debt",
        cond: (p,C)=>C.adult(p)&&(C.prof(p,"gambling",30)||C.flag(p,"pf_cheat_partner"))&&p.coin<60,
        w: .8,
        cool: 8,
        setup: (p,ctx)=>{ctx.lender=nm(p,"M"),ctx.owe=A.pick([40,60,80])},
        title: "What you owe",
        text: "A bad night. Then a worse one. You owe {lender}, who runs the dice-house, {owe} suns, and his men have started standing across the street from your door. Dice debts are not collected in court.",
        choices: [
          {
            t: "Win it back, one big night",
            check: {s:"gambling",s2:"wil",d:55},
            win: {
              r: "The dice love you, for one night only. You pay {lender} to the penny and never play at his house again.",
              fx: {skill:{gambling:3},wil:1,happy:4},
            },
            lose: {
              r: (p,ctx)=>`You lose another ${ctx.owe}. His men stop standing across the street and start knocking.`,
              fx: {health:-15,wound:"lost_fingers",wil:2,happy:-8,coinPct:-.5,cause:"a debt collector's hammer"},
            },
          },
          {
            t: "Work it off for {lender}",
            r: "A season of collecting other people's dice debts. It pays off yours. It changes you a little.",
            fx: {skill:{intimidation:3,gambling:1},honor:-3,flag:"pf_dicehouse_man"},
          },
          {
            t: "Leave town by night",
            r: "You go with what you can carry. {lender} has a long memory.",
            fx: {coinPct:-.3,newRel:{type:"enemy",op:-50},wil:1},
          },
          {
            t: "Sell what you own and pay",
            r: (p,ctx)=>`You sell everything that is not nailed down, and some things that are. ${ctx.owe} suns. Free and poor.`,
            fx: {coinPct:-.8,wil:1.5,happy:-4},
          },
        ],
      },
      {
        id: "pf_gamb_corsairs",
        cond: (p,C)=>pro(p,C,"gambling",45)&&(C.coast(p)||C.realm(p,"POL-33")),
        w: .7,
        cool: 8,
        setup: (p,ctx)=>{ctx.capn=nm(p,"M")},
        title: "Dice before the raid",
        text: p=>`${p.realm==="POL-33"?"In Blackreef every crew throws dice before a raid, for luck.":"A corsair crew is ashore, throwing dice for luck the way they do before every raid."} Their captain, {capn}, wants an outsider to throw against: "the luck of a stranger". The stake is a share of the raid.`,
        choices: [
          {
            t: "Throw against the captain",
            check: {s:"gambling",s2:"ins",d:52},
            win: {
              r: "You throw three sixes. The crew roars. A month later a corsair brings you your share: forty suns and a silver cup with someone else's crest on it.",
              fx: {coin:40,fame:2,skill:{gambling:3},honor:-2,newRel:{type:"friend",op:20}},
            },
            lose: {
              r: "You lose. They say you have given them bad luck. You leave before they decide what to do about it.",
              fx: {coin:-10,happy:-2},
            },
          },
          {
            t: "Throw, and lose on purpose to the captain",
            check: {s:"gambling",s2:"deception",d:48},
            win: {
              r: "Losing well is an art. The captain is delighted, the crew is happy, and the captain owes you a favor.",
              fx: {coin:-5,flag:"pf_corsair_favor",newRel:{type:"friend",op:30}},
            },
            lose: {r:"Too obvious. The captain is insulted.",fx:{newRel:{type:"enemy",op:-20}}},
          },
          {t:"Refuse. Their luck is their own.",r:"They laugh at you and throw among themselves.",fx:{}},
        ],
      },
      {
        id: "pf_gamb_fixed",
        cond: (p,C)=>pro(p,C,"gambling",50),
        w: .7,
        cool: 8,
        setup: (p,ctx)=>{ctx.bm=nm(p,"M"),ctx.fav=nm(p,"M")},
        title: "A sure thing",
        text: "You hear it in the stable yard: {fav}, the favorite in tomorrow's bout, has been paid to go down in the second round. Matches are fixed; every bout-master knows the price of a stumble. The odds against the other fighter are five to one.",
        choices: [
          {
            t: "Bet heavy on the outsider",
            check: {s:"gambling",s2:"intrigue",d:48},
            win: {
              r: "{fav} goes down in the second round, as promised. You collect five to one, and spread your bets so nobody notices.",
              fx: {coin:50,skill:{gambling:2,intrigue:1},honor:-3},
            },
            lose: {
              r: "{fav} changes his mind and wins. Or it was a lie meant for you. Either way, you lose.",
              fx: {coin:-25,happy:-4},
            },
          },
          {
            t: "Tell the bout-master",
            check: {s:"persuasion",s2:"wil",d:45},
            win: {
              r: "{bm} pulls {fav} from the card. The fixers lose money and want to know who talked.",
              fx: {honor:4,newRel:{type:"enemy",op:-30}},
            },
            lose: {r:"{bm} is in on it. He thanks you warmly, and suggests you leave town.",fx:{happy:-3}},
          },
          {
            t: "Stay out of it",
            r: "You watch the bout. {fav} goes down in the second round. It looks real.",
            fx: {},
          },
        ],
      },
      {
        id: "pf_gamb_house",
        cond: (p,C)=>pro(p,C,"gambling",60)&&p.coin>=150&&C.town(p),
        w: .6,
        once: !0,
        title: "The house always wins",
        text: p=>`You have played in every dice-house in {home}. You know what they get wrong. With 150 suns you could open your own: a back room, honest dice, and the house's cut. ${p.faith==="REL-01"?"The Temple forbids dice on Sundays, so Saturday nights will have to pay for the week.":"The town taxes the dice-houses, and the watch expects its share."}`,
        choices: [
          {
            t: "Open an honest house",
            check: {s:"gambling",s2:"stewardship",d:50},
            win: {
              r: "Honest dice draw the serious players. Within a year the house pays for itself and then some.",
              fx: {coin:50,skill:{gambling:2,stewardship:2},fame:2,flag:"pf_dicehouse"},
            },
            lose: {
              r: "The other houses send men to start fights in yours. You close in six months.",
              fx: {coin:-150,happy:-6,wil:1.5},
            },
          },
          {
            t: "Open a crooked house",
            check: {s:"gambling",s2:"deception",d:52},
            win: {
              r: "Loaded dice for the strangers, honest dice for the regulars. The money pours in. So does the risk.",
              fx: {coin:120,honor:-6,flag:"pf_dicehouse"},
            },
            lose: {
              r: "A sailor splits a die open. The riot burns your back room to the ground.",
              fx: {coin:-150,health:-8,honor:-5,cause:"a dice-house riot"},
            },
          },
          {
            t: "Keep playing, not running",
            r: "The house always wins, but someone has to run the house. Not you.",
            fx: {},
          },
        ],
      },
    ]);
  })();
})();
