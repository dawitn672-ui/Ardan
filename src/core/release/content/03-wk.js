// The release's event pack 3 of 30 (95 events, mostly wk_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-028). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const COMMON = ["slave","serf","peasant","artisan","merchant"],
      com = p=>!p.ruler&&COMMON.includes(p.status),
      free = p=>!p.flags.unfree,
      J = (p,...ks)=>!!(p.job&&ks.includes(p.job.c)),
      rk = p=>p.job?p.job.r:-1,
      slave = p=>p.flags.unfree==="slave",
      serf = p=>p.flags.unfree==="serf",
      bonded = p=>p.flags.unfree==="debt",
      guildJob = p=>J(p,"smith","mason","weaver","bowyer","carpenter"),
      farmer = p=>J(p,"farm")||!p.job&&!p.mil&&["serf","peasant"].includes(p.status),
      herder = p=>J(p,"herd")||!p.job&&!p.mil&&p.status==="peasant"&&A.C.terr(p,"steppe","tundra"),
      trader = p=>J(p,"merchant")||!p.job&&p.status==="merchant"&&!p.ruler,
      rankName = p=>p.job?GD.CAREERS[p.job.c].ranks[p.job.r][0].toLowerCase():"worker",
      craftWord = p=>({smith:"smith",mason:"mason",weaver:"weaver",bowyer:"bowyer",carpenter:"carpenter",brewer:"brewer"})[p.job&&p.job.c]||"craftsman",
      coins = p=>{const r=LORE.realms[p.realm],n=r&&r.coin&&r.coin.coin;return!n||/none|any|horses|reference|^sun$/.test(n)?"suns":/silver$|weight$/.test(n)?n:/(sh|ch|s)$/.test(n)?n+"es":n+"s"},
      clergy = p=>({"REL-01":"dawnkeeper","REL-02":"priest","REL-03":"hall-priest","REL-04":"Grove Keeper","REL-05":"Law-Carver","REL-06":"abbot","REL-07":"Well-Keeper","REL-08":"flood-priest","REL-09":"Rememberer","REL-10":"temple priest","REL-11":"shaman","REL-14":"shaman"})[p.faith]||"priest",
      god = p=>{const f=A.faith(p.faith);return f&&f.name?f.name:"the gods"},
      promote = p=>{const j=p.job;if(!j)return"";const C=GD.CAREERS[j.c],nx=C&&C.ranks[j.r+1];return nx?(j.r++,j.y=nx[1],p.happy=A.clamp(p.happy+8,0,100),`(You are now ${nx[0]}.)`):""},
      setFree = (p,how)=>(delete p.flags.unfree,(p.status==="slave"||p.status==="serf")&&(p.status="peasant"),how&&(p.flags[how]=A.S.year),A.ach("freed"),A.willGrow(p,2.5,"freedom"),p.happy=A.clamp(p.happy+20,0,100),"(You are free.)"),
      addDebt = (p,n)=>{p.debt=Math.max(0,Math.round((p.debt||0)+n))},
      npc = (p,occ,child)=>{const t=A.makeAcquaintance(p,"acquaint",child);return occ&&(t.occ=occ),t.id},
      lordName = p=>`${A.pick(["Lord","Ser","Lady","Dame"])} ${A.givenName(p.cult,A.chance(.6)?"M":"F")}`,
      hasAsset = (p,...ks)=>(p.assets||[]).some(a=>ks.includes(a.k)),
      firstFriend = p=>{const f=A.relsOf(p,["bestfriend","friend"]).filter(x=>x.p.alive);return f.length?f[0].p.id:null},
      livingParent = p=>{const l=(p.parents||[]).map(A.P).filter(x=>x&&x.alive);return l.length?l[0]:null},
      WELL_COAST = ["POL-24","POL-32","POL-21","POL-17"];
    A.defEvents([
      {
        id: "wk_slave_house",
        cond: (p,C)=>C.adult(p)&&slave(p)&&(J(p,"servant")||C.town(p)||!p.job),
        w: 1.3,
        title: "What the walls hear",
        setup: (p,ctx)=>{ctx.secret=A.pick(["your master means to sell the cook's children at the next market","a guest is paying your master to foul a rival's well","your master cannot pay what he owes the moneylenders","the steward has robbed the house for years"])},
        text: "You pour the wine and nobody sees you. That is what a house slave is for. Tonight, between the second jug and the third, you learn that {secret}.",
        choices: [
          {
            t: "Keep it behind your teeth",
            r: "You hear nothing. You see nothing. You live another year.",
            fx: {wil:.5},
          },
          {
            t: "Sell it to the right ear",
            check: {s:"intrigue",s2:"int",d:50},
            win: {
              r: "A rival household pays 12 suns for what you heard, and nobody guesses where it came from.",
              fx: {coin:12,skill:{intrigue:3}},
            },
            lose: {
              r: "The buyer talks. Your master has you flogged in the yard until you cannot stand.",
              fx: {health:-15,cause:"a flogging",wound:"back",wil:1.5},
            },
          },
          {
            t: "Use it to win your mistress's favor",
            check: {s:"diplomacy",s2:"int",d:45},
            win: {
              r: "She remembers who warned her. Your bread gets whiter and your work lighter.",
              fx: {happy:5,coin:5,flag:"wk_favored"},
            },
            lose: {
              r: "She does not want to know. By evening you are sent out to the fields.",
              fx: {happy:-6,job:"farm",wil:1},
            },
          },
        ],
      },
      {
        id: "wk_slave_field",
        cond: (p,C)=>C.adult(p)&&slave(p)&&!J(p,"servant","miner"),
        w: 1.3,
        title: "The long row",
        text: p=>`Noon heat over the ${A.pick(["date gardens","pepper gardens","cane rows","millet fields","cotton fields"])}. Old ${A.givenName(p.cult,"F")}, who has worked this ground since before you were born, falls in the furrow and does not get up. The overseer uncoils his whip.`,
        choices: [
          {
            t: "Work her row as well as your own",
            r: "You work until your hands bleed. That night she shares her onion with you and calls you child.",
            fx: {sta:1,str:.5,health:-5,wil:1,honor:3,newRel:{type:"friend",op:35}},
          },
          {
            t: "Keep your head down",
            r: "The lash falls on her, not you. You hate yourself a little, and you live.",
            fx: {happy:-4},
          },
          {
            t: "Stare the overseer down",
            check: {s:"wil",s2:"str",d:55},
            win: {r:"He looks away first. The whole row sees it.",fx:{fame:1,wil:1.5,honor:3}},
            lose: {
              r: "He gives the lash to you instead, twice over.",
              fx: {health:-14,cause:"the overseer's lash",wound:"back",wil:2},
            },
          },
        ],
      },
      {
        id: "wk_slave_mine",
        cond: (p,C)=>C.adult(p)&&slave(p)&&(J(p,"miner")||C.terr(p,"mountains","hills")),
        title: "Gold in the dark",
        text: p=>`Deep in the ${C2(p)} your pick opens a pocket that glitters in the lamplight. A nugget the size of a thumbnail lies loose in your palm. The guard is at the far end of the gallery.`,
        choices: [
          {
            t: "Swallow it and walk out with the shift",
            check: {s:"stealth",s2:"wil",d:50},
            win: {r:"Two unpleasant days later you are 25 suns closer to buying yourself.",fx:{coin:25,wil:.5}},
            lose: {
              r: "They make every slave drink salt water at the gate. They find it.",
              fx: {health:-15,cause:"a beating",wound:"brand",wil:1.5},
            },
          },
          {
            t: "Show the overseer the pocket",
            r: "He takes the credit, but you get meat for a week and the dry gallery.",
            fx: {happy:4,health:4},
          },
          {
            t: "Leave it in the rock",
            r: "Somebody else finds it next month. You never learn what became of them.",
            fx: {},
          },
        ],
      },
      {
        id: "wk_slave_pearl",
        cond: (p,C)=>C.adult(p)&&slave(p)&&C.coast(p)&&C.realm(p,...WELL_COAST),
        w: 1.5,
        title: "The pearl banks",
        text: p=>`${p.realm==="POL-24"?"The Emir takes the best pearl of every boat; the master takes the rest.":"The master takes every pearl the bank gives up."} You go down on a rope with a stone between your feet and a turtle-shell clip on your nose. The deep bank is richer. It is also where divers stop coming up.`,
        choices: [
          {
            t: "Dive the deep bank",
            check: {s:"sta",s2:"sea",d:55},
            win: {
              r: "Down where the light goes green you find a pearl as big as a chickpea. The master gives you a coin and a day of rest.",
              fx: {coin:6,sta:1,skill:{sea:4}},
            },
            lose: {
              r: "Your ears burst at the bottom. You come up bleeding from the nose and deaf on one side.",
              fx: {health:-15,cause:"drowning",wound:"ear",wil:1},
            },
          },
          {
            t: "Palm a small pearl",
            check: {s:"stealth",s2:"spd",d:50},
            win: {
              r: "A seed pearl rides home in your cheek. A dockside broker gives you 20 suns and asks no questions.",
              fx: {coin:20},
            },
            lose: {
              r: "They find it under your tongue. Twenty strokes on the beach.",
              fx: {health:-12,cause:"the lash",wil:1.5},
            },
          },
          {
            t: "Work the shallows and live",
            r: "The shallows give little. But you come up every time.",
            fx: {sta:.5,skill:{sea:2}},
          },
        ],
      },
      {
        id: "wk_slave_galley",
        cond: (p,C)=>C.adult(p)&&slave(p)&&C.coast(p),
        title: "The oar bench",
        text: "Chained at the ankle to the bench, you pull to the drum. A sail on the horizon, then another. By noon the galley is grappled, the deck above is all screaming and smoke, and the overseer has run to fight.",
        choices: [
          {
            t: "Pull and pray",
            r: "You row, and the galley breaks free. The overseer forgets you were ever there. Your back does not.",
            fx: {str:1,sta:1,wil:1},
          },
          {
            t: "Work the pin loose while the deck burns",
            check: {s:"str",s2:"ins",d:55},
            win: {
              r: "The pin comes free. You go over the side in the smoke and swim for the shore. You stagger up a beach with nothing at all.",
              fx: p=>setFree(p,"runaway"),
            },
            lose: {
              r: "The overseer comes back and finds you half-loose. He uses the knotted rope.",
              fx: {health:-18,cause:"the knotted rope",wound:"scar_chest",wil:2},
            },
          },
          {
            t: "Help the wounded oarsman beside you",
            r: "You bind his arm with your own shirt. He never forgets it.",
            fx: {honor:3,newRel:{type:"friend",op:40},skill:{medicine:2}},
          },
        ],
      },
      {
        id: "wk_slave_price",
        cond: (p,C)=>C.adult(p)&&slave(p)&&p.coin>=40,
        w: 1.5,
        cool: 4,
        title: "The price of a body",
        setup: (p,ctx)=>{ctx.law=p.realm==="POL-21"?"The law of the Spice Coast says a slave may buy freedom for two kilograms of pepper.":p.realm==="POL-30"?"In Ranpur a slave who serves twelve years goes free by law. You cannot wait twelve years.":p.realm==="POL-18"?"Flood law frees a debt-slave after seven years. Your master says that is a long time.":"Where slaves are sold, a grown one fetches about a hundred suns."},
        text: "You have saved. Copper by copper, under the floor stone. Your master knows, of course. Today he names a price: 100 suns. {law}",
        choices: [
          {
            t: "Count out 100 suns",
            req: p=>p.coin>=100,
            r: "You count it into his hand, coin by coin, and walk out of his gate.",
            fx: p=>(p.coin-=100,setFree(p)),
          },
          {
            t: "Haggle him down",
            check: {s:"trade",s2:"diplomacy",d:55},
            win: {
              r: "You remind him how old you are getting, and how much you eat. He settles on 75.",
              fx: p=>p.coin>=75?(p.coin-=75,setFree(p)):(p.flags.wk_price75=A.S.year,"You do not have 75 yet. But he has given his word in front of witnesses."),
            },
            lose: {r:"He laughs and raises the price to 120 for your cheek.",fx:{happy:-5,wil:1}},
          },
          {t:"Not yet",r:"You put the purse back under the floor stone. One more year.",fx:{wil:.5}},
        ],
      },
      {
        id: "wk_slave_runaway",
        cond: (p,C)=>C.adult(p)&&slave(p),
        title: "A whisper at the well",
        setup: (p,ctx)=>{ctx.pid=npc(p,A.pick(["a field slave","a house slave","a stable slave"]))},
        text: `{them}, who sleeps two mats from you, whispers at the well: the moon is dark in four nights, the dogs are old, and the border is two days' walk. "Come with me."`,
        choices: [
          {
            t: "Run together",
            check: {s:"stealth",s2:"spd",d:55},
            win: {
              r: "Two nights of marsh and thorn, and then a road where nobody knows your face.",
              fx: (p,ctx)=>{const t=ctx&&ctx.pid?A.P(ctx.pid):null;return t&&(p.rel[t.id]?A.addOp(p,t,30):A.link(p,t,"friend",40,"friend")),setFree(p,"runaway")},
            },
            lose: {
              r: "The dogs find you at the ford. The brand on your cheek tells every buyer what you did.",
              fx: {health:-15,cause:"the dogs",wound:"brand",wil:2,them:{type:"friend",op:15}},
            },
          },
          {
            t: "Tell the master",
            r: "Your master gives you a coin and a smile. {them} is taken that night. Nobody at the well speaks to you again.",
            fx: {coin:5,honor:-8,happy:-3,them:{type:"enemy",op:-60}},
          },
          {
            t: "Wish {themHim} luck and stay",
            r: "{them} goes alone. You never hear if the road was kind.",
            fx: {them:{type:"friend",op:10},happy:-2},
          },
        ],
      },
      {
        id: "wk_slave_master_dies",
        cond: (p,C)=>C.adult(p)&&slave(p),
        once: !0,
        title: "The master is dying",
        text: "Your master lies coughing in the upper room. The heirs circle like crows. In the Southland and the Well lands a dying man often frees a few slaves to ease his road — if someone reminds him.",
        choices: [
          {
            t: "Nurse him with care to the end",
            check: {s:"medicine",s2:"wil",d:45},
            win: {r:"In his last clear hour he calls a witness and frees you, and two others.",fx:p=>setFree(p)},
            lose: {r:"He dies cursing everyone. His son keeps every slave in the house.",fx:{wil:1,happy:-6}},
          },
          {
            t: "Steal from the house in the confusion",
            check: {s:"stealth",s2:"int",d:50},
            win: {r:"A silver cup goes under your mat. It is worth 30 suns.",fx:{coin:30}},
            lose: {r:"The son catches you with the cup.",fx:{punish:"theft"}},
          },
          {
            t: "Take the Path of the Well",
            req: (p,C)=>C.realm(p,"POL-32")&&p.faith!=="REL-07",
            r: "In the Amber Isles the Path of the Well frees any slave who converts. You wash, you say the words, and you walk out free.",
            fx: p=>(p.faith="REL-07",p.piety=A.clamp(p.piety+6,0,100),setFree(p)),
          },
        ],
      },
      {
        id: "wk_serf_demesne",
        cond: (p,C)=>C.adult(p)&&serf(p),
        w: 1.4,
        title: "The lord's days",
        text: "Three days a week belong to the lord's demesne. This week it is harvest, and the reeve wants every back on the lord's wheat while your own barley stands overripe, shedding grain at every gust.",
        choices: [
          {
            t: "Lord first, as the law says",
            r: "By the time you reach your own strip, the rain has flattened half of it.",
            fx: {sta:.8,happy:-4,wil:.8},
          },
          {
            t: "Slip off to your own field at dusk",
            check: {s:"stealth",s2:"spd",d:45},
            win: {r:"You reap by moonlight. Your barley is in before the rain.",fx:{coin:6,happy:3,sta:.5}},
            lose: {r:"The reeve marks you absent. Fined 3 suns and two days' extra work.",fx:{coin:-3,happy:-4}},
          },
          {
            t: "Pay a landless man to stand in for you (2 suns)",
            req: p=>p.coin>=2,
            r: "He works the lord's rows. Your own harvest comes in dry.",
            fx: {coin:4},
          },
        ],
      },
      {
        id: "wk_serf_bailiff",
        cond: (p,C)=>C.adult(p)&&serf(p),
        title: "The bailiff's bushel",
        setup: (p,ctx)=>{ctx.pid=npc(p,"the lord's bailiff")},
        text: "{them}, the lord's bailiff, measures your rent-grain with a bushel that looks a fifth too big. He smiles while he does it.",
        choices: [
          {t:"Pay and say nothing",r:"You pay. He will do it again next year.",fx:{coin:-5,happy:-2}},
          {
            t: "Take it to the manor court",
            check: {s:"diplomacy",s2:"learning",d:50},
            win: {
              r: "The steward fills the bushel with water and measures it. A fifth too large. The bailiff is fined, and he will remember you.",
              fx: {honor:3,fame:1,coin:3,them:{type:"enemy",op:-30}},
            },
            lose: {
              r: "It is the lord's court. You pay the fine and the bailiff's smile.",
              fx: {coin:-8,happy:-4,them:{type:"enemy",op:-15}},
            },
          },
          {
            t: "Slip him a bribe to look away (2 suns)",
            req: p=>p.coin>=2,
            r: "His measure grows honest, for you.",
            fx: {coin:-2,honor:-1,them:{type:"acquaint",op:10}},
          },
        ],
      },
      {
        id: "wk_serf_heriot",
        cond: (p,C)=>C.adult(p)&&serf(p),
        once: !0,
        title: "Heriot",
        text: p=>{const f=A.P(p.parents[0]);return(f&&!f.alive?`Your father ${f.given} is in the ground, and his holding passes to you.`:`Old ${A.givenName(p.cult,"M")}, who held the strip beside yours, dies without sons, and the reeve gives you his holding.`)+" Before the grave is cold the reeve comes for the heriot: the best beast in the byre, by custom the lord's. That is your plough-ox."},
        choices: [
          {
            t: "Give the reeve the ox",
            r: "The ox goes to the lord's byre. This spring you pull the plough yourself.",
            fx: {str:1,sta:1,happy:-6,wil:1.5},
          },
          {
            t: "Hide the ox in the woods and show him the old cow",
            check: {s:"stealth",s2:"int",d:50},
            win: {
              r: "The reeve takes the cow and grumbles that it is a poor house. Your ox comes home at night.",
              fx: {happy:4,skill:{stealth:2}},
            },
            lose: {
              r: "His boy finds the ox tethered in the hazel. The reeve takes it, and fines you for the lie.",
              fx: {coin:-10,honor:-3,happy:-6},
            },
          },
          {
            t: "Pay the heriot in coin (15 suns)",
            req: p=>p.coin>=15,
            r: "The reeve prefers coin anyway. The ox stays.",
            fx: {coin:-15},
          },
        ],
      },
      {
        id: "wk_serf_marry",
        cond: (p,C)=>C.adult(p)&&serf(p)&&!C.married(p)&&C.ageAdj(p)<40,
        once: !0,
        title: "Leave to marry",
        text: "You want to marry. A serf needs the lord's leave for that, and leave costs the merchet — a fee to the lord, because your children will be his serfs too.",
        choices: [
          {
            t: "Pay the merchet (3 suns) and wed",
            req: p=>p.coin>=3,
            r: "You wed at the church door with the lord's leave and half the village drunk.",
            fx: p=>{p.coin-=3;const l=A.makeLoveInterest(p);return A.marry(p,l),`(You marry ${l.given}.)`},
          },
          {
            t: "Ask the lord to waive the fee",
            check: {s:"diplomacy",s2:"wil",d:45},
            win: {
              r: 'He is in a good mood after the hunt. He waves you away: "Wed, and breed me good ploughmen."',
              fx: p=>{const l=A.makeLoveInterest(p);return A.marry(p,l),`(You marry ${l.given}.)`},
            },
            lose: {r:"He laughs and doubles the fee for asking.",fx:{happy:-4,wil:1}},
          },
          {t:"Wait for a better year",r:"Love waits, sometimes.",fx:{happy:-2}},
        ],
      },
      {
        id: "wk_serf_charter",
        cond: (p,C)=>C.adult(p)&&serf(p),
        w: 1.2,
        cool: 8,
        title: "A year and a day",
        text: p=>p.realm==="POL-05"?`Everyone in Ashmere knows the custom: a serf who lives a year and a day in a chartered town is free. ${A.provName(p.home)} is not a chartered town. {town} is.`:"The towns pay good wages and ask few questions. The lord's men ride after runaways, but not forever. {town} is three days' walk.",
        choices: [
          {
            t: "Walk to {town} and keep your head down",
            check: {s:"stealth",s2:"wil",d:50,bonus:p=>p.realm==="POL-05"?12:0},
            win: {
              r: "You carry sacks on the quay and give a false name. A year and a day pass. Nobody comes.",
              fx: p=>{const s=setFree(p,"runaway");return p.job={c:"labor",r:0,y:0,perf:55},s},
            },
            lose: {
              r: "The bailiff's men drag you home behind a horse.",
              fx: {health:-10,cause:"being dragged",happy:-10,wil:2},
            },
          },
          {
            t: "Stay. The land is yours too, in a way",
            r: "You stay with the strips your grandfather ploughed.",
            fx: {happy:1},
          },
          {
            t: "Buy your freedom (60 suns)",
            req: p=>p.coin>=60,
            r: "The lord's steward takes the coin and writes your name out of the roll.",
            fx: p=>(p.coin-=60,setFree(p)),
          },
        ],
      },
      {
        id: "wk_debt_bond",
        cond: (p,C)=>C.adult(p)&&(bonded(p)||C.realm(p,"POL-25","POL-26")&&com(p)&&(p.debt||0)>20),
        w: 1.5,
        title: "Bound for debt",
        text: p=>`${bonded(p)?"Three days a week you work your creditor's land.":"Your creditor reminds you that in "+A.realmShort(p.realm)+" a debtor and his family can be bound to the creditor's land until the debt is paid."} ${p.realm==="POL-26"?"In Drevna the Dawn Church frees the bondsmen on its own lands every seventh year — but this is not church land.":"The debt shrinks slower than the seasons pass."}`,
        choices: [
          {
            t: "Pay 30 suns and beg release",
            req: p=>p.coin>=30,
            r: "Your creditor takes the coin and tears the tally stick.",
            fx: p=>(p.coin-=30,p.debt=0,bonded(p)?setFree(p):"(Your debt is cleared.)"),
          },
          {
            t: "Work double days",
            r: "Dawn to dusk, six days. Your body pays what your purse cannot.",
            fx: p=>(p.debt=Math.round((p.debt||0)*.5),A.train(p,"sta",1),p.health=Math.max(1,p.health-6),A.willGrow(p,1.5,"toil"),"(Your debt is halved.)"),
          },
          {
            t: "Petition the Dawn Church",
            check: {s:"faith",s2:"diplomacy",d:50},
            win: {
              r: "A priest buys out your debt as a work of mercy.",
              fx: p=>(p.debt=0,p.piety=A.clamp(p.piety+4,0,100),bonded(p)?setFree(p):"(Your debt is cleared.)"),
            },
            lose: {r:"The priest prays with you. That is all he can give.",fx:{piety:2}},
          },
        ],
      },
      {
        id: "wk_tamar_dyke",
        cond: (p,C)=>C.adult(p)&&C.male(p)&&(C.realm(p,"POL-18")||C.cult(p,"CUL-06"))&&!p.ruler&&!C.noble(p),
        w: 1.5,
        cool: 3,
        title: "The month of mud",
        text: "Every man of Tamar owes a month of dyke work a year. The flood-priests have read the Flood Stair, the overseers have their reed rods, and the river is coming. Men who dodge are branded on the hand.",
        choices: [
          {
            t: "Haul mud for the Flood Mother",
            r: "A month of baskets and mud to the thigh. The dyke holds, and your shoulders are like oak.",
            fx: {str:1,sta:1,piety:2,health:-3},
          },
          {
            t: "Pay a poorer man to go in your place (6 suns)",
            req: p=>p.coin>=6,
            r: "He hauls your baskets. The overseers count heads, not faces.",
            fx: {coin:-6,honor:-1},
          },
          {
            t: "Hide in the reeds until it is over",
            check: {s:"stealth",s2:"survival",d:50},
            win: {r:"A month of mosquitoes and fishing. Nobody misses you.",fx:{happy:3,skill:{survival:2}}},
            lose: {
              r: "They find you. The iron hisses on the back of your hand, like every dodger's.",
              fx: {wound:"brand",honor:-5,wil:1.5},
            },
          },
        ],
      },
      {
        id: "wk_thrall_steppe",
        cond: (p,C)=>C.adult(p)&&slave(p)&&C.realm(p,"POL-11","POL-34","POL-12"),
        w: 1.5,
        title: "Herd-thrall",
        text: p=>`${p.realm==="POL-12"?"Captives herd for their captors until they are ransomed.":"Captives herd for seven winters, then a clan may adopt them."} Tonight a blizzard drives the mares toward the ravine, and you are the only rider awake.`,
        choices: [
          {
            t: "Ride after the mares",
            check: {s:"riding",s2:"sta",d:50},
            win: {
              r: "You bring every mare home at dawn, half-frozen. The clan-mother cuts your thrall-braid and names you one of the clan.",
              fx: p=>(A.fame(p,2),setFree(p,"adopted")),
            },
            lose: {r:"You lose three mares and two toes.",fx:{wound:"frostbite",health:-10,cause:"the cold",wil:2}},
          },
          {
            t: "Count the winters and keep your head down",
            r: "One more winter gone. You learn their songs.",
            fx: {wil:1,skill:{husbandry:3}},
          },
          {
            t: "Take the best horse and ride for the border",
            check: {s:"riding",s2:"spd",d:58},
            win: {
              r: "Three days of snow and stolen cheese, and you are across the border.",
              fx: p=>setFree(p,"runaway"),
            },
            lose: {
              r: "They run you down. A thrall who runs is hamstrung so he walks slow.",
              fx: {wound:"limp",health:-15,cause:"the knife",wil:2},
            },
          },
        ],
      },
    ]);
    function C2(p){return{"POL-20":"gold pits of Zanara","POL-30":"temple mines","POL-33":"salt workings","POL-17":"copper galleries"}[p.realm]||"mine"}
    A.defEvents([
      {
        id: "wk_farm_bumper",
        cond: (p,C)=>C.adult(p)&&farmer(p)&&!slave(p),
        title: "A fat year",
        text: p=>`The ${A.pick(["barley","wheat","rye","millet","oats"])} stands chest-high and heavy. Every field in the valley is the same, which means the price will fall like a stone the day the carts reach market.`,
        choices: [
          {
            t: "Sell at once, before the price falls further",
            r: "You sell quick and cheap. Still more than last year.",
            fx: {coin:12},
          },
          {
            t: "Store it and sell in spring",
            check: {s:"stewardship",s2:"int",d:45},
            win: {
              r: "Dry loft, cats in the rafters. In spring the price has doubled.",
              fx: {coin:30,skill:{stewardship:3}},
            },
            lose: {r:"Damp and rats get into the loft. Half of it is fit only for pigs.",fx:{coin:3,happy:-3}},
          },
          {
            t: "Brew some and feast the neighbors",
            r: "A harvest ale under the stars. The neighbors will remember who fed them.",
            fx: {happy:6,coin:4,newRel:{type:"friend",op:30}},
          },
        ],
      },
      {
        id: "wk_farm_blight",
        cond: (p,C)=>C.adult(p)&&farmer(p),
        title: "A wet summer",
        text: "It rains from May Fair to First Loaf. The grain rots black in the ear. By autumn the price of bread has doubled, and your loft is nearly empty — except for the seed grain.",
        choices: [
          {
            t: "Eat the seed grain",
            r: "You eat this winter. Next spring will be worse.",
            fx: {wil:1,happy:-3,flag:"wk_ate_seed"},
          },
          {
            t: "Sell the pig and buy grain at double price",
            r: "Bread with chestnut flour and bean husks in it. But the seed stays in its sack.",
            fx: {coin:-10,health:-3,wil:.8},
          },
          {
            t: "Gather acorns and nettles in the woods",
            check: {s:"survival",s2:"int",d:40},
            win: {
              r: "Soaked acorns, nettle soup, a rabbit when the gods allow. You get through.",
              fx: {skill:{survival:4},wil:1},
            },
            lose: {r:"You go hungry most nights. The winter carves you thin.",fx:{health:-10,cause:"hunger",wil:1.5}},
          },
          {
            t: "Queue at the temple dole",
            r: "You stand with the beggars for a bowl of pottage. Neighbors see you.",
            fx: {piety:2,happy:-3,honor:-1},
          },
        ],
      },
      {
        id: "wk_farm_seedless",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"wk_ate_seed"),
        w: 2,
        title: "Spring with no seed",
        text: "Ploughing time, and the seed sack is empty because you ate it in the hungry months. A field without seed is just mud.",
        choices: [
          {
            t: "Borrow seed from the lord's barn at a third on top",
            r: "You sow. At harvest you will owe a third more than you borrowed.",
            fx: p=>(addDebt(p,25),delete p.flags.wk_ate_seed,"(You owe 25 suns.)"),
          },
          {
            t: "Hire out as a day laborer instead",
            r: "You leave the field fallow and sell your back by the day.",
            fx: p=>(delete p.flags.wk_ate_seed,p.job={c:"labor",r:0,y:0,perf:55},p.happy=A.clamp(p.happy-4,0,100),""),
          },
          {
            t: "Beg seed from your kin",
            check: {s:"diplomacy",s2:"wil",d:40},
            win: {r:"Your cousin grumbles, but fills your sack.",fx:{unflag:"wk_ate_seed",happy:2}},
            lose: {
              r: "Your kin are as hungry as you. You sow half a field from scraps.",
              fx: {unflag:"wk_ate_seed",coin:-5,wil:1},
            },
          },
        ],
      },
      {
        id: "wk_farm_tithe",
        cond: (p,C)=>C.adult(p)&&farmer(p)&&!slave(p),
        title: "The tenth sheaf",
        text: p=>p.realm==="POL-18"?"The flood-priests read the river on the Flood Stair and set the grain tax: a fifth of the harvest in a fair year. Their scribes are in your field before the sheaves are dry.":`The ${clergy(p)}'s tithe-man walks your stubble counting sheaves: one in ten for ${god(p)}. He counts slowly, and he counts twice.`,
        choices: [
          {t:"Pay it in full",r:"You pay. The gods, or someone, are fed.",fx:{coin:-4,piety:3}},
          {
            t: "Bind the best sheaves small",
            check: {s:"stealth",s2:"int",d:45},
            win: {r:"His tenth is light and yours is heavy.",fx:{coin:4}},
            lose: {
              r: "He weighs a sheaf in each hand and smiles. You pay double, and the whole parish hears.",
              fx: {coin:-8,honor:-3,piety:-2},
            },
          },
          {
            t: "Argue the count",
            check: {s:"diplomacy",s2:"learning",d:50},
            win: {r:"You count with him, sheaf by sheaf. He miscounted, and admits it.",fx:{coin:2,honor:1}},
            lose: {r:"He adds a sheaf for the trouble.",fx:{coin:-5,happy:-2}},
          },
        ],
      },
      {
        id: "wk_farm_ox",
        cond: (p,C)=>C.adult(p)&&(farmer(p)||J(p,"herd")),
        title: "The sick ox",
        text: "Two weeks before ploughing, your ox lies down in the byre and will not rise. Its belly is drum-tight and its eyes are dull. An ox costs more than you earn in half a year.",
        choices: [
          {
            t: "Fetch the cunning man (a few pence and eggs)",
            check: {s:"husbandry",s2:"int",d:40},
            win: {
              r: "He pours oil and something worse down its throat and mutters over it. By morning it is grazing.",
              fx: {coin:-1,skill:{husbandry:3}},
            },
            lose: {
              r: "The charm does nothing. The ox dies, and you pull the plough yourself.",
              fx: {coin:-1,happy:-6,str:1,wil:1.5},
            },
          },
          {
            t: "Pierce its flank to let the wind out",
            check: {s:"husbandry",s2:"ins",d:52},
            win: {r:"A hiss like a bellows, a terrible smell, and the ox lives.",fx:{skill:{husbandry:5},happy:4}},
            lose: {r:"You strike wrong. It dies in an hour.",fx:{happy:-8,wil:1.5}},
          },
          {
            t: "Slaughter it and sell the meat while it is good",
            r: "Eight suns of beef. Now you must borrow a neighbor's ox and owe him for it.",
            fx: {coin:8,happy:-4},
          },
          {
            t: "Pray at the shrine",
            check: {s:"faith",s2:"wil",d:55},
            win: {
              r: "When you come home, the ox is standing. You will tell this story for years.",
              fx: {piety:5,happy:4},
            },
            lose: {r:"The gods have other oxen to see to.",fx:{piety:2,happy:-6}},
          },
        ],
      },
      {
        id: "wk_farm_boundary",
        cond: (p,C)=>C.adult(p)&&farmer(p)&&!slave(p),
        title: "The boundary stone",
        setup: (p,ctx)=>{ctx.pid=npc(p,"your neighbor")},
        text: p=>`Your boundary stone has walked two paces into your strip overnight. {them} next door is very busy looking at the sky. ${p.realm==="POL-18"?"In Tamar, moving a boundary stone after the flood earns a hundred blows and the loss of the field.":""}`,
        choices: [
          {
            t: "Move it back by night",
            check: {s:"stealth",s2:"str",d:40},
            win: {
              r: "In the morning the stone is home. {them} says nothing. Neither do you.",
              fx: {them:{type:"rival",op:-10}},
            },
            lose: {
              r: '{them} catches you at it, and now {theyHe} is the one shouting "thief".',
              fx: {honor:-2,them:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Take {themHim} before the reeve",
            check: {s:"diplomacy",s2:"learning",d:45},
            win: {
              r: "Old men walk the bounds and swear to the old line. The stone goes back, and {them} pays a fine.",
              fx: {honor:3,coin:3,them:{type:"enemy",op:-25}},
            },
            lose: {
              r: "The reeve drinks with {them}. The stone stays.",
              fx: {coin:-3,happy:-4,them:{type:"rival",op:-15}},
            },
          },
          {
            t: "Settle it with fists",
            r: "You meet at the ditch.",
            fx: {
              them: {type:"rival",op:-20},
              duel: {
                foe: "them",
                opts: {kind:"brawl",lethal:!1,toYield:!0,place:"the boundary ditch",title:"Over a stone"},
              },
            },
          },
          {
            t: "Let {themHim} have two paces",
            r: "Two paces of mud is not worth a feud. {them} brings you a cheese at the Slaughter Feast.",
            fx: {happy:-2,them:{type:"friend",op:15}},
          },
        ],
      },
      {
        id: "wk_farm_flood",
        cond: (p,C)=>C.adult(p)&&farmer(p)&&(C.terr(p,"marsh","plains")||C.coast(p)),
        title: "The water rises",
        text: p=>p.realm==="POL-18"?"The Flood Mother is generous this year — too generous. The river tops the dykes in the night and pours across the fields.":"Three days of rain, and in the night the river leaves its bed. By dawn the water is at your door and still rising.",
        choices: [
          {
            t: "Save the animals",
            r: "You drive the beasts to the churchyard hill. The grain loft floods.",
            fx: {coin:-8,skill:{husbandry:2}},
          },
          {
            t: "Save the grain loft",
            check: {s:"str",s2:"sta",d:45},
            win: {r:"You haul sacks up to the roof beams all night. The grain stays dry.",fx:{str:.6,sta:.6}},
            lose: {
              r: "The current takes your legs. You lose the grain and nearly yourself.",
              fx: {coin:-15,health:-10,cause:"drowning",wil:1},
            },
          },
          {
            t: "Help the old widow next door first",
            r: "You carry her out on your back. Your own losses are heavy, but the village sees.",
            fx: {coin:-10,honor:4,fame:1,newRel:{type:"friend",op:40}},
          },
        ],
      },
      {
        id: "wk_farm_drought",
        cond: (p,C)=>C.adult(p)&&(farmer(p)||herder(p))&&C.terr(p,"plains","hills","steppe","desert"),
        title: "No rain",
        text: "Not a drop since spring. The well bucket comes up half mud. The leaves on the beans curl like burned paper.",
        choices: [
          {
            t: "Dig the well deeper",
            check: {s:"str",s2:"sta",d:45},
            win: {
              r: "Twenty feet down, cold water seeps in. You and three neighbors drink all summer.",
              fx: {str:.8,honor:2,newRel:{type:"friend",op:25}},
            },
            lose: {
              r: "Dry rock, and a crushed hand when the side gives way.",
              fx: {health:-10,cause:"a cave-in",wound:"lost_fingers",wil:1},
            },
          },
          {
            t: "Carry water from the river every dawn",
            r: "Two yokes of buckets, a mile each way, all summer. You save half the crop.",
            fx: {sta:1.2,health:-4,coin:3},
          },
          {
            t: "Sell the beasts now, before everyone does",
            r: "You get a fair price, the last fair price of the year.",
            fx: {coin:15,happy:-3},
          },
          {
            t: "Pray for rain",
            check: {s:"faith",s2:"wil",d:60},
            win: {r:"On the third night of prayer, thunder.",fx:{piety:5,happy:5}},
            lose: {r:"The sky stays brass.",fx:{piety:2,coin:-6}},
          },
        ],
      },
      {
        id: "wk_farm_locusts",
        cond: (p,C)=>C.adult(p)&&(farmer(p)||herder(p))&&C.terr(p,"desert","steppe","plains"),
        w: .7,
        cool: 10,
        title: "The cloud",
        text: "A brown cloud comes over the horizon at noon and does not move like a cloud. Then you hear it: a dry hiss like rain on straw. Locusts.",
        choices: [
          {
            t: "Smoke fires and beat pots along the field edge",
            check: {s:"sta",s2:"wil",d:50},
            win: {r:"The swarm lifts and moves on to someone else's field.",fx:{sta:.6}},
            lose: {r:"By dusk the field is bare stalks.",fx:{coin:-12,happy:-6,wil:1.5}},
          },
          {t:"Reap it green, now",r:"Half a harvest of unripe grain. Better than none.",fx:{coin:-5}},
          {
            t: "Roast the locusts and eat them",
            r: "Crunchy, salty, and plentiful. The children love it. The field is gone.",
            fx: {coin:-10,health:3,happy:1},
          },
        ],
      },
      {
        id: "wk_farm_buy_land",
        cond: (p,C)=>C.adult(p)&&free(p)&&com(p)&&p.coin>=150&&!hasAsset(p,"farm","manor"),
        w: .8,
        title: "Land for sale",
        text: p=>`A widow in ${A.provName(p.home)} is selling up to go and live with her daughter in {town}: thirty acres freehold, a house, a barn. She wants 300 suns, and she wants it quickly.`,
        choices: [
          {
            t: "Buy at her price (300 suns)",
            req: p=>p.coin>=300,
            r: "You walk the bounds with the reeve and three witnesses. The land is yours.",
            fx: {coin:-300,asset:"farm",happy:10},
          },
          {
            t: "Haggle her down",
            req: p=>p.coin>=220,
            check: {s:"trade",s2:"diplomacy",d:55},
            win: {r:"She takes 220 and a cart to carry her things to {town}.",fx:{coin:-220,asset:"farm",happy:10}},
            lose: {r:"While you haggle, a merchant's son pays her full price.",fx:{happy:-4}},
          },
          {
            t: "Buy a cottage and garden plot instead (60 suns)",
            req: p=>p.coin>=60,
            r: "A cottage, a garden, a pear tree. Small, and yours.",
            fx: {coin:-60,asset:"cottage",happy:5},
          },
          {t:"Let it go",r:"Land is a chain as well as a fortune.",fx:{}},
        ],
      },
      {
        id: "wk_herd_wolves",
        cond: (p,C)=>C.adult(p)&&herder(p),
        title: "Night at the fold",
        text: p=>`The dogs start barking at midnight, then stop. ${C3(p)} are at the fold.`,
        choices: [
          {
            t: "Go out with a torch and a staff",
            check: {s:"ins",s2:"str",d:45},
            win: {
              r: "You burn one, beat another, and the rest melt into the dark.",
              fx: {fame:1,ins:.6,skill:{husbandry:2}},
            },
            lose: {
              r: "One goes for your arm. You keep the flock and lose some skin.",
              fx: {wound:"bite",health:-12,cause:"a wolf bite",wil:1},
            },
          },
          {
            t: "Set the dogs on them and guard the gate",
            check: {s:"husbandry",s2:"ins",d:40},
            win: {r:"Good dogs. You lose nothing but sleep.",fx:{skill:{husbandry:3}}},
            lose: {r:"Dawn shows three dead ewes and a lame dog.",fx:{coin:-8,happy:-4}},
          },
          {t:"Let them have one and save the rest",r:"A ewe for the dark. The rest live.",fx:{coin:-4}},
        ],
      },
      {
        id: "wk_herd_white",
        cond: (p,C)=>C.adult(p)&&herder(p)&&C.terr(p,"steppe","tundra","mountains"),
        title: "The white death",
        text: "A thaw, then a hard freeze. The snow wears a crust of ice the beasts cannot break. They stand over the grass they cannot reach, and starve on top of it.",
        choices: [
          {
            t: "Drive the herd south through strangers' pastures",
            check: {s:"riding",s2:"survival",d:50},
            win: {
              r: "Ten days of hard riding. You find open ground and pay its clan with a mare.",
              fx: {skill:{riding:3,survival:3},coin:-5},
            },
            lose: {
              r: "The clan whose grass you take meets you with bows. You lose beasts and blood.",
              fx: {coin:-20,health:-12,cause:"arrows",wil:1.5},
            },
          },
          {
            t: "Break the crust with poles, day and night",
            r: "Your arms go numb. Half the herd lives.",
            fx: {coin:-12,sta:1,wound:"frostbite"},
          },
          {
            t: "Bleed the horses and eat the weakest",
            r: "The old famine way. You live, and so do most of the mares.",
            fx: {coin:-10,wil:1.5,skill:{husbandry:2}},
          },
        ],
      },
      {
        id: "wk_herd_camel",
        cond: (p,C)=>C.adult(p)&&C.terr(p,"desert")&&(J(p,"herd","merchant")||!p.job&&com(p)),
        title: "The caravan master",
        text: p=>`A caravan master is gathering camels for the ${p.realm==="POL-19"||p.realm==="POL-20"?"Salt Road — eight hundred beasts, traveling by night in summer":"Gold Road north to the coast"}. A camel fetches 80 suns in the Southland. He wants yours, or he wants you.`,
        choices: [
          {
            t: "Sell him two of your best she-camels",
            r: "A fat purse of silver. Next year's calves go with them.",
            fx: {coin:120,perf:-10,happy:3},
          },
          {
            t: "Hire on as a camel-puller for the season",
            check: {s:"survival",s2:"sta",d:48},
            win: {
              r: "Two months of night marches and well-stops. You come home lean, rich in stories and 30 suns.",
              fx: {coin:30,skill:{survival:4,husbandry:3,trade:2}},
            },
            lose: {
              r: "A dry well and a sandstorm. You come home with nothing but cracked lips.",
              fx: {health:-12,cause:"thirst",wil:1.5},
            },
          },
          {t:"Keep the herd whole",r:"Camels are wealth that walks. You let it keep walking.",fx:{perf:5}},
        ],
      },
      {
        id: "wk_herd_yak",
        cond: (p,C)=>C.adult(p)&&(herder(p)||farmer(p))&&(C.terr(p,"mountains")||C.realm(p,"POL-27")),
        title: "The high pasture",
        text: p=>`${p.realm==="POL-27"?"The monastery wants its butter and its days of labor, as every family of Skyhold owes.":"Up on the summer grazing the air is thin and the nights are cruel."} A yak bull has gone mad with the rut and is goring the herd.`,
        choices: [
          {
            t: "Rope it and wrestle it down",
            check: {s:"str",s2:"husbandry",d:55},
            win: {
              r: "It drags you fifty paces, then lies down, blowing. You are a legend at the tents.",
              fx: {fame:2,str:1,skill:{husbandry:4}},
            },
            lose: {r:"A horn opens your thigh.",fx:{health:-18,cause:"a goring",wound:"deep_cut",wil:1}},
          },
          {
            t: "Drive the herd away and let it calm",
            r: "You lose a calf and a day. The bull settles by dusk.",
            fx: {coin:-4,skill:{husbandry:2}},
          },
          {t:"Spear it and sell the meat",r:"Good meat, good hide, and no more bull.",fx:{coin:10,perf:-5}},
        ],
      },
      {
        id: "wk_herd_horsefair",
        cond: (p,C)=>C.adult(p)&&free(p)&&(herder(p)||C.terr(p,"steppe")&&com(p)),
        title: "The horse fair",
        text: 'Horses everywhere, dust, shouting. The Nine Winds sell twenty thousand horses a year to the west, and half of them seem to be here. A Wind Rider dealer offers you a dun colt for 40 suns. "Steppe price," he grins. "For a friend."',
        choices: [
          {
            t: "Buy the colt (40 suns)",
            req: p=>p.coin>=40,
            check: {s:"husbandry",s2:"riding",d:45},
            win: {
              r: "Sound wind, good hooves. In two years he is worth five times the price.",
              fx: {coin:-40,skill:{riding:4},happy:6,flag:"wk_good_horse"},
            },
            lose: {r:"Broken-winded and painted to hide the grey. The dealer is gone by noon.",fx:{coin:-40,happy:-5}},
          },
          {
            t: "Enter the race",
            check: {s:"riding",s2:"spd",d:50},
            win: {
              r: "You win by a neck. A purse and a crowd chanting your name.",
              fx: {coin:20,fame:2,skill:{riding:3}},
            },
            lose: {r:"Thrown at the turn, in front of everyone.",fx:{health:-6,happy:-3}},
          },
          {
            t: "Sell your spare horses to a western buyer",
            r: "Morhaven gold for steppe ponies. A good day.",
            fx: {coin:25,perf:5},
          },
        ],
      },
      {
        id: "wk_herd_raid",
        cond: (p,C)=>C.adult(p)&&free(p)&&(herder(p)||farmer(p))&&C.terr(p,"hills","mountains"),
        title: "Cattle gone",
        text: p=>`${p.realm==="POL-13"?"In the Highland League wealth is counted in cattle and silver, and cattle walk.":"Cattle walk, and some men help them."} At dawn your byre is empty and the tracks lead up toward the next glen.`,
        choices: [
          {
            t: "Rouse the neighbors and follow the trail",
            check: {s:"survival",s2:"command",d:50},
            win: {
              r: "You catch them at the ford, outnumbered. They leave the cattle and run.",
              fx: {fame:2,honor:2,skill:{survival:3}},
            },
            lose: {
              r: "They were waiting. A stone opens your scalp and the cattle are gone.",
              fx: {coin:-20,health:-10,cause:"a sling stone",wil:1},
            },
          },
          {
            t: "Raid them back, cow for cow",
            check: {s:"stealth",s2:"riding",d:52},
            win: {
              r: "You come home with more than you lost. The glen will sing about it, and want revenge.",
              fx: {coin:25,fame:2,honor:-1,newRel:{type:"enemy",op:-30}},
            },
            lose: {
              r: "Their dogs wake. You run, and you leave blood on the heather.",
              fx: {health:-14,cause:"a raid gone wrong",wound:"arrow_wound",wil:1.5},
            },
          },
          {
            t: "Demand payment at the valley council",
            check: {s:"diplomacy",s2:"learning",d:45},
            win: {r:"The council makes them pay in silver for every cow.",fx:{coin:12,honor:2}},
            lose: {r:"The council shrugs. Nobody saw anything.",fx:{coin:-15,happy:-5}},
          },
        ],
      },
    ]);
    function C3(p){const pr=A.prov(p.home),t=pr?pr.terr:"plains";return t==="steppe"||t==="plains"?"Hyenas":t==="desert"?"Jackals":"Wolves"}
    A.defEvents([
      {
        id: "wk_craft_beating",
        cond: (p,C)=>C.adult(p)&&guildJob(p)&&rk(p)===0,
        w: 1.4,
        title: "Food and blows",
        setup: (p,ctx)=>{ctx.pid=npc(p,`a master ${craftWord(p)}`),ctx.spoil={smith:"a spoiled horseshoe",mason:"a cracked lintel",weaver:"a bolt with a slubbed weft",bowyer:"a stave you cut against the grain",carpenter:"a split joint"}[p.job.c]||"a spoiled piece"},
        text: "An apprentice is paid in food and blows, and this week it is mostly blows. Master {them} takes the strap to you for {spoil}, in front of the journeymen.",
        choices: [
          {
            t: "Take it, and learn",
            r: "You take it. Next time the work is right, and he grunts. From him, that is praise.",
            fx: {wil:1.5,skill:{craft:3},them:{type:"mentor",op:5}},
          },
          {
            t: "Complain to the guild wardens",
            check: {s:"diplomacy",s2:"wil",d:50},
            win: {
              r: "The wardens fine him for beating past custom. The strap stays on its nail. So does his warmth.",
              fx: {honor:2,them:{type:"mentor",op:-15}},
            },
            lose: {
              r: "The wardens send you back with a lecture about insolent apprentices. He hears of it.",
              fx: {health:-6,happy:-5,wil:1,them:{type:"mentor",op:-20}},
            },
          },
          {
            t: "Break your indenture and run",
            r: "You run. No guild in the realm will take a runaway apprentice, but the road is free.",
            fx: p=>(p.job=null,p.honor=A.clamp(p.honor-3,0,100),p.happy=A.clamp(p.happy+3,0,100),""),
          },
          {
            t: "Catch the strap",
            check: {s:"str",s2:"wil",d:52},
            win: {
              r: 'You hold it. He stares, then laughs. "Good. Now make it right." He never beats you again.',
              fx: {str:.5,them:{type:"mentor",op:10}},
            },
            lose: {
              r: "He beats you twice as hard for daring.",
              fx: {health:-10,cause:"a beating",wil:1.5,them:{type:"mentor",op:-10}},
            },
          },
        ],
      },
      {
        id: "wk_craft_masterpiece",
        cond: (p,C)=>C.adult(p)&&guildJob(p)&&rk(p)===1&&free(p),
        w: 1.5,
        cool: 3,
        title: "The masterpiece",
        setup: (p,ctx)=>{ctx.piece={smith:"a lock with three hidden wards",mason:"a carved capital of acanthus leaves",weaver:"a bolt of fine broadcloth, even as water",bowyer:"a yew bow of a hundred pounds' draw",carpenter:"a chest jointed without a single nail"}[p.job.c]||"a perfect piece",ctx.fee=A.ri(20,50)},
        text: "To become a master you must show the guild your masterpiece — {piece} — then pay the entry fee of {fee} suns and give the masters a feast. After that you may open a shop, take apprentices and vote.",
        choices: [
          {
            t: "Make something bold",
            req: (p,C,ctx)=>p.coin>=(ctx.fee||50)+10,
            check: {s:"craft",s2:"int",d:55},
            win: {
              r: "The wardens turn it in their hands for a long time. Then the eldest stands and drinks to you.",
              fx: (p,ctx)=>(p.coin-=(ctx.fee||30)+10,A.fame(p,2),promote(p)),
            },
            lose: {
              r: "The eldest warden finds the flaw with one fingernail. Try again next year.",
              fx: {coin:-10,wil:1.5,happy:-5},
            },
          },
          {
            t: "Make something safe and sound",
            req: (p,C,ctx)=>p.coin>=(ctx.fee||50)+10,
            check: {s:"craft",s2:"wil",d:42},
            win: {
              r: "Plain, true work. They pass you with a nod, eat your feast and go home.",
              fx: (p,ctx)=>(p.coin-=(ctx.fee||30)+10,promote(p)),
            },
            lose: {r:'"Competent," says the warden, "and dull." Next year.',fx:{coin:-5,happy:-3}},
          },
          {
            t: "Not yet. Save for the fee and feast",
            r: "Another year as a journeyman. Another year of other men's orders.",
            fx: {wil:.5,skill:{craft:2}},
          },
        ],
      },
      {
        id: "wk_craft_candle",
        cond: (p,C)=>C.adult(p)&&(guildJob(p)||J(p,"brewer"))&&rk(p)>=1,
        title: "Work by candlelight",
        text: p=>"A rich customer wants his order by the feast — three days' work in two. The guild forbids work by candlelight, for fear of fire and of bad work done in bad light.",
        choices: [
          {
            t: "Work through the night behind shutters",
            check: {s:"craft",s2:"sta",d:45},
            win: {r:"Done by dawn, and good. He pays double for the speed.",fx:{coin:18,perf:4,sta:.4}},
            lose: {
              r: "A warden sees light under your shutter. Fined 5 suns, and the work is poor besides.",
              fx: {coin:-5,perf:-4},
            },
          },
          {
            t: "Tell him the truth: it will be late",
            r: "He grumbles, but he comes back. The wardens nod at you in the street.",
            fx: {honor:2,perf:-1},
          },
          {
            t: "Hire a journeyman for the day (6 suns)",
            req: p=>p.coin>=6,
            r: "Two pairs of hands in daylight. You make it, just.",
            fx: {coin:8,perf:2},
          },
        ],
      },
      {
        id: "wk_craft_fire",
        cond: (p,C)=>C.adult(p)&&(guildJob(p)||J(p,"brewer")),
        w: .8,
        cool: 10,
        title: "Fire!",
        text: p=>`A spark from the ${p.job.c==="smith"?"forge":p.job.c==="brewer"?"brewing fire":"brazier"} catches the shavings, then the thatch. Smoke pours from the eaves${hasAsset(p,"workshop")?" of your own workshop":""}. Somewhere inside, the youngest apprentice is shouting.`,
        choices: [
          {
            t: "Run in for the boy",
            check: {s:"sta",s2:"wil",d:50},
            win: {
              r: "You come out with the boy over your shoulder and your hair smoking. The street cheers.",
              fx: {honor:5,fame:2,health:-4},
            },
            lose: {
              r: "You get him out. The burning beam gets you.",
              fx: {honor:5,fame:1,wound:"burn",health:-16,cause:"burns"},
            },
          },
          {
            t: "Save the tools and the stock",
            r: "You drag out the anvil, the chests, the finished work. A journeyman goes in for the boy.",
            fx: {coin:-5,honor:-2},
          },
          {
            t: "Organize a bucket line",
            check: {s:"command",s2:"diplomacy",d:45},
            win: {
              r: "Thirty neighbors, sixty buckets. The fire dies before it jumps the lane.",
              fx: {coin:-6,fame:2,skill:{command:3}},
            },
            lose: {r:"Too slow. The shop burns to its stone footings.",fx:{coin:-30,happy:-8,wil:1.5}},
          },
        ],
      },
      {
        id: "wk_craft_lord_unpaid",
        cond: (p,C)=>C.adult(p)&&(guildJob(p)||J(p,"brewer"))&&rk(p)>=1&&free(p),
        title: "A lord's word",
        setup: (p,ctx)=>{ctx.lord=lordName(p),ctx.owed=A.ri(40,120)},
        text: "{lord} took your best work a year ago and promised payment by the Slaughter Feast. Two Slaughter Feasts have passed. The debt is {owed} suns.",
        choices: [
          {
            t: "Go to the castle, cap in hand",
            check: {s:"diplomacy",s2:"int",d:50},
            win: {
              r: "The steward pays you half and swears the rest will follow.",
              fx: (p,ctx)=>(p.coin+=Math.round((ctx.owed||60)/2),""),
            },
            lose: {r:"You wait all day in the yard and leave with nothing but cold feet.",fx:{happy:-3}},
          },
          {
            t: "Sue in the town court",
            check: {s:"learning",s2:"diplomacy",d:60},
            win: {
              r: "The court finds for you. The steward counts out every coin, glaring.",
              fx: (p,ctx)=>(p.coin+=ctx.owed||60,p.honor=A.clamp(p.honor+2,0,100),""),
            },
            lose: {
              r: "The court costs you 5 suns. The lord's steward tells the town your work was shoddy.",
              fx: {coin:-5,perf:-5},
            },
          },
          {
            t: "Forgive the debt and keep his goodwill",
            r: "A lord who owes you a favor may be worth more than coin. Or not.",
            fx: {honor:1,fame:1,flag:"wk_lord_owes"},
          },
          {
            t: "Refuse him any more work",
            r: "His steward goes to your rival. Your pride is intact.",
            fx: {perf:-3,honor:1},
          },
        ],
      },
      {
        id: "wk_lord_repays",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"wk_lord_owes"),
        w: 1.5,
        title: "An old debt remembered",
        text: "A rider in livery stops at your door. The lord whose debt you forgave has not forgotten.",
        choices: [
          {
            t: "Hear him out",
            r: "He sends a purse, and a word in the right ears. Orders come from the castle all year.",
            fx: {unflag:"wk_lord_owes",coin:40,perf:8,fame:2},
          },
          {
            t: "Ask for a place for your nephew instead",
            r: "The boy goes to the castle as a page's servant. Your family will remember.",
            fx: {unflag:"wk_lord_owes",honor:2,happy:5},
          },
        ],
      },
      {
        id: "wk_craft_rival",
        cond: (p,C)=>C.adult(p)&&(guildJob(p)||J(p,"brewer"))&&rk(p)>=1,
        title: "A rival master",
        setup: (p,ctx)=>{ctx.pid=npc(p,`a master ${craftWord(p)}`),ctx.slander={smith:"your iron is brittle",mason:"your mortar is half sand",weaver:"your cloth shrinks in the rain",bowyer:"your bows crack in winter",carpenter:"your joints spring in a year",brewer:"you water your ale"}[p.job.c]||"your work is shoddy"},
        text: "Master {them}, who opened a shop across the lane, is telling every customer that {slander}, and charging a tenth less than you.",
        choices: [
          {
            t: "Cut your prices to match",
            r: "You keep your customers and lose your margin.",
            fx: {coin:-10,perf:4,them:{type:"rival",op:-10}},
          },
          {
            t: "Demand a trial of work before the guild",
            check: {s:"craft",s2:"int",d:50},
            win: {
              r: "Side by side before the wardens, your work is plainly better. {them} pays the guild a fine and stops talking.",
              fx: {fame:2,perf:8,them:{type:"rival",op:-20}},
            },
            lose: {
              r: "The wardens judge it even. Even is a loss when you asked for the trial.",
              fx: {perf:-6,happy:-4,them:{type:"rival",op:-10}},
            },
          },
          {
            t: "Spread a better rumor about {themHim}",
            check: {s:"intrigue",s2:"int",d:45},
            win: {
              r: "Soon the whole quarter knows {them} buys cheap stock from smugglers. Maybe it is even true.",
              fx: {perf:5,honor:-3,them:{type:"enemy",op:-30}},
            },
            lose: {
              r: "The rumor comes back to you, with your name on it.",
              fx: {honor:-5,perf:-5,them:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Make peace over a jug",
            check: {s:"diplomacy",s2:"int",d:42},
            win: {
              r: "Two masters, one jug, and an agreement on prices. The customers lose. You both win.",
              fx: {coin:8,them:{type:"friend",op:25}},
            },
            lose: {r:"{them} drinks your wine and keeps talking.",fx:{coin:-1,them:{type:"rival",op:-5}}},
          },
        ],
      },
      {
        id: "wk_craft_apprentice",
        cond: (p,C)=>C.adult(p)&&(guildJob(p)||J(p,"brewer"))&&rk(p)>=2,
        title: "A new apprentice",
        setup: (p,ctx)=>{ctx.pid=npc(p,"your apprentice",!0)},
        text: "A widow brings her child {them} to your door and begs you to take {themHim} as apprentice for seven years. The child stares at your tools as if they were holy relics.",
        choices: [
          {
            t: "Take {themHim} and teach kindly",
            r: "Food, a straw bed in the attic, and very few blows. {them} learns slowly and worships you.",
            fx: {happy:3,perf:3,honor:2,them:{type:"friend",op:35}},
          },
          {
            t: "Take {themHim} and work {themHim} hard",
            r: "The old way: dawn to dusk and the strap. {them} learns fast and fears you.",
            fx: {perf:6,coin:4,them:{type:"acquaint",op:-10}},
          },
          {t:"Refuse. You have mouths enough",r:"The widow goes to your rival across the lane.",fx:{happy:-1}},
        ],
      },
      {
        id: "wk_dwarf_contract",
        cond: (p,C)=>C.adult(p)&&C.race(p,"dwarf")&&(guildJob(p)||J(p,"miner"))&&rk(p)>=1,
        title: "A human lord's offer",
        setup: (p,ctx)=>{ctx.lord=lordName(p)},
        text: "{lord}'s agent climbs to the hold gate. His master wants a dwarven smith for a season at his castle forge, at 15 suns a day — the wage a dwarven master can name, if he will work for humans at all.",
        choices: [
          {
            t: "Take the contract, written and witnessed",
            r: "A season among humans: bad beer, worse iron, and a fat purse. They watch you like a conjurer.",
            fx: {coin:60,perf:4,happy:-2,skill:{craft:3}},
          },
          {
            t: "Demand payment in metal, not coin",
            check: {s:"trade",s2:"int",d:50},
            win: {r:"Silver bars, weighed in the gate. Coin lies; metal does not.",fx:{coin:80,perf:4}},
            lose: {r:"The agent takes offense and leaves. The clan elders say you were right.",fx:{honor:2}},
          },
          {
            t: "Refuse. The Law says work for kin first",
            r: "The Law-Carvers approve. Your purse does not.",
            fx: {honor:3,piety:2},
          },
        ],
      },
      {
        id: "wk_dwarf_kindling",
        cond: (p,C)=>C.adult(p)&&C.race(p,"dwarf")&&free(p),
        cool: 10,
        title: "The Kindling",
        text: "21 December. Every forge in the hold goes cold, and every one is relit from the First Hall's fire. This year your clan gallery names you to carry the flame home through the long dark passages.",
        choices: [
          {
            t: "Carry the flame with care",
            check: {s:"sta",s2:"wil",d:45},
            win: {
              r: "Three hours of cold rock and one guttering lamp. You walk into the clan gallery to a roar.",
              fx: {fame:2,piety:4,honor:3},
            },
            lose: {
              r: "A draught in the stair, and the flame dies. You walk back to the First Hall in shame.",
              fx: {honor:-4,wil:1.5},
            },
          },
          {
            t: "Give the honor to an elder",
            r: "Old Thrain carries it, weeping. He has waited forty years.",
            fx: {honor:2,newRel:{type:"friend",op:30}},
          },
        ],
      },
      {
        id: "wk_craft_meet_dwarf",
        cond: (p,C)=>C.adult(p)&&J(p,"smith")&&!C.race(p,"dwarf"),
        title: "The dwarven smith",
        text: "A dwarven smith has taken a contract in the castle forge for the season, at fifteen suns a day — three times what a human master earns. The ring of his hammer is different. Everything he makes is better.",
        choices: [
          {
            t: "Offer to pay him to teach you (30 suns)",
            req: p=>p.coin>=30,
            check: {s:"diplomacy",s2:"craft",d:50},
            win: {
              r: "He takes the coin and shows you how he reads heat by the color of the scale. It is worth ten years.",
              fx: {coin:-30,skill:{craft:8},newRel:{type:"mentor",op:25}},
            },
            lose: {
              r: "He takes the coin, shows you how to sweep a floor, and says that is the first lesson.",
              fx: {coin:-30,skill:{craft:2}},
            },
          },
          {
            t: "Watch from the doorway",
            check: {s:"stealth",s2:"int",d:45},
            win: {r:"You learn how he quenches in oil, not water.",fx:{skill:{craft:5}}},
            lose: {r:"He catches you and slams the door. The castle steward is not pleased.",fx:{perf:-3}},
          },
          {t:"Mind your own forge",r:"You hammer on. Good enough was good enough for your master.",fx:{}},
        ],
      },
      {
        id: "wk_craft_dye",
        cond: (p,C)=>C.adult(p)&&J(p,"weaver"),
        title: "True purple",
        text: p=>`${p.realm==="POL-16"?"The murex beds of Felena send their dye up to the Sabena vats.":"Murex purple comes only from the Ostran coast, and costs its weight in silver."} A dye merchant offers you one jar of true purple: enough for one bolt that a lord would buy for 60 suns. The jar costs 35.`,
        choices: [
          {
            t: "Buy the jar and dye the bolt (35 suns)",
            req: p=>p.coin>=35,
            check: {s:"craft",s2:"int",d:50},
            win: {
              r: "The cloth comes out the color of old wine. A lord's steward buys it on sight.",
              fx: {coin:25,fame:1,skill:{craft:3}},
            },
            lose: {r:"The vat is too hot. The purple streaks brown.",fx:{coin:-35,happy:-4}},
          },
          {
            t: "Dye it with madder and woad, and call it purple",
            check: {s:"intrigue",s2:"craft",d:48},
            win: {r:"The buyer cannot tell the difference. Yet.",fx:{coin:25,honor:-3}},
            lose: {
              r: "The buyer licks his thumb and rubs the cloth. The guild hears by evening.",
              fx: {coin:-5,honor:-8,perf:-10},
            },
          },
          {t:"Stick to honest wool",r:"Grey wool feeds you. Purple feeds lords.",fx:{}},
        ],
      },
      {
        id: "wk_ostra_commons",
        cond: (p,C)=>C.adult(p)&&C.realm(p,"POL-16")&&com(p)&&free(p)&&!C.rich(p),
        w: 1.5,
        title: "The Purple Fair",
        text: "June, and Mora Purplehand marches the Sabena Commons on the Exchange Hall: dockers and dyers with cudgels, wanting a seat on the council and bread at a fair price. Ever since the Leontine crashed in 1083, Sabena's poor have hated the council.",
        choices: [
          {
            t: "March with the Commons",
            check: {s:"sta",s2:"ins",d:50},
            win: {
              r: "You shout yourself hoarse on Ledger Street. The council promises cheaper bread. Promises.",
              fx: {fame:2,honor:2,happy:4,flag:"wk_commons"},
            },
            lose: {
              r: "The Purple Company men break the march with staves. You wake in the cells.",
              fx: {health:-12,cause:"a stave",prison:1,why:"rioting at the Purple Fair"},
            },
          },
          {
            t: "Stay at your work",
            r: "You hear the shouting from across the city and keep your head down.",
            fx: {perf:2},
          },
          {
            t: "Sell names to the council's men",
            r: "Fifteen suns for six names. You avoid the docks for a while.",
            fx: {coin:15,honor:-8},
          },
        ],
      },
      {
        id: "wk_craft_wheel",
        cond: (p,C)=>C.adult(p)&&(J(p,"weaver")||C.female(p)&&C.realm(p,"POL-03")&&com(p)),
        title: "The spinning wheel",
        text: p=>p.realm==="POL-03"?"In the Palella valley the weavers have the spinning wheel, learned from Ranpuri cotton traders twenty years ago. A spinner on a wheel earns three times what a spindle earns. The guild keeps it from the rest of the north. A northern cloth merchant is asking how it is built.":"A Varennan journeyman, drunk in your tavern, swears he can draw you the Palella spinning wheel — the guild secret that lets a spinner earn three times what a spindle earns. For 40 suns.",
        choices: [
          {
            t: "Sell the merchant a drawing (40 suns)",
            req: (p,C)=>C.realm(p,"POL-03"),
            check: {s:"intrigue",s2:"int",d:50},
            win: {r:"He pays, and nobody knows. Somewhere north, a wheel starts turning.",fx:{coin:40,honor:-4}},
            lose: {r:"The guild finds out. You are fined and shunned.",fx:{coin:-15,honor:-8,perf:-15}},
          },
          {
            t: "Buy his drawing (40 suns)",
            req: (p,C)=>!C.realm(p,"POL-03")&&p.coin>=40,
            check: {s:"craft",s2:"int",d:50},
            win: {
              r: "It works. Within a season your thread is finer and faster than anyone's.",
              fx: {coin:-40,skill:{craft:6},perf:12,flag:"wk_wheel"},
            },
            lose: {r:"A drunk's doodle. The wheel spins once and falls apart.",fx:{coin:-40,happy:-4}},
          },
          {t:"Want nothing to do with it",r:"Guild secrets get people knifed in alleys.",fx:{}},
        ],
      },
      {
        id: "wk_craft_mason",
        cond: (p,C)=>C.adult(p)&&J(p,"mason","carpenter"),
        title: "On the temple works",
        text: p=>`You are on the scaffold of the new ${A.pick(["temple","bell tower","town wall","bridge"])} at two suns a day. The master of works earns four and never climbs. Above you, a rope creaks. A beam the size of a tree begins to swing loose.`,
        choices: [
          {
            t: "Shout and shove the men below clear",
            check: {s:"spd",s2:"ins",d:45},
            win: {
              r: "The beam smashes the boards where three men stood. They buy you drinks for a month.",
              fx: {honor:3,fame:1,newRel:{type:"friend",op:35}},
            },
            lose: {
              r: "You push one clear. The beam clips your knee.",
              fx: {honor:3,wound:"bad_knee",health:-14,cause:"a falling beam"},
            },
          },
          {
            t: "Grab the rope and hold",
            check: {s:"str",s2:"wil",d:55},
            win: {
              r: "The rope burns your palms raw, but the beam stops. The master of works sees it.",
              fx: {str:1,perf:8,fame:1},
            },
            lose: {r:"The rope drags you off the scaffold.",fx:{health:-20,cause:"a fall",wound:"broken_ribs",wil:1}},
          },
          {
            t: "Jump clear yourself",
            r: "You land on the lower boards. The beam falls. Luckily, nobody is under it.",
            fx: {spd:.4},
          },
        ],
      },
      {
        id: "wk_craft_yew",
        cond: (p,C)=>C.adult(p)&&J(p,"bowyer"),
        title: "Yew staves",
        text: p=>`${p.realm==="POL-05"?"Ashmere boys draw the bow from the age of seven, and the yew for their bows comes from Eldergrove under the Yew Compact.":"The best bow yew comes from Eldergrove, under the Yew Compact."} This year the Grove Keepers marked fewer trees. Stave prices have doubled.`,
        choices: [
          {t:"Pay the price for marked yew",r:"Good wood, honest bows, thin profit.",fx:{coin:-15,perf:5}},
          {
            t: "Use local elm and ash",
            r: "Cheaper bows for poorer archers. The good customers go elsewhere.",
            fx: {perf:-5,coin:5},
          },
          {
            t: "Buy unmarked yew from a smuggler",
            check: {s:"intrigue",s2:"trade",d:48},
            win: {
              r: "Cheap, straight and nobody asks. The elves do not count every tree. You hope.",
              fx: {coin:12,perf:4,honor:-2},
            },
            lose: {
              r: "An elven factor traces the staves to your shop. Your guild pays a fine in your name, and you repay it.",
              fx: {coin:-25,honor:-5,perf:-6},
            },
          },
        ],
      },
      {
        id: "wk_brewer_taster",
        cond: (p,C)=>C.adult(p)&&J(p,"brewer"),
        title: "The ale-taster",
        text: p=>`The town's ale-taster is coming down the street, cup on his belt, checking every brewhouse's measures and strength. ${p.realm==="POL-05"?"In Ashmere women brew and inherit, and the best brewster wins the taster's ribbon.":""} Your last batch was thin.`,
        choices: [
          {
            t: "Pour him the thin batch honestly",
            r: "He fines you two pence and praises your honesty louder than your ale.",
            fx: {coin:-1,honor:2},
          },
          {
            t: "Pour him the good cask kept for festivals",
            check: {s:"trade",s2:"int",d:40},
            win: {r:"He drinks, smacks his lips, and marks you best in the street.",fx:{perf:6,fame:1}},
            lose: {
              r: "He tastes from the tap in the yard as well. Fined for false measure.",
              fx: {coin:-6,honor:-3,perf:-4},
            },
          },
          {
            t: "Slip a coin into his cup",
            r: "The cup comes back empty and the coin is gone. Your ale is splendid, officially.",
            fx: {coin:-3,honor:-2,perf:3},
          },
        ],
      },
      {
        id: "wk_inn_guest",
        cond: (p,C)=>C.adult(p)&&(J(p,"brewer")&&rk(p)>=1||hasAsset(p,"inn")),
        title: "A guest who cannot pay",
        setup: (p,ctx)=>{ctx.pid=npc(p,"a knight with two squires")},
        text: "{themFull}, a knight with two hungry squires, has eaten and drunk for a week under your roof: 30 suns. This morning {theyHe} admits the purse is empty and offers {theirHis} sword as a pledge.",
        choices: [
          {
            t: "Take the sword as pledge",
            r: "A good blade, worth more than the bill. {them} rides off red-faced and swears to come back for it.",
            fx: {coin:30,them:{type:"acquaint",op:-10}},
          },
          {
            t: "Let {themHim} go on {theirHis} word",
            r: "{them} clasps your hand. A knight's word is worth something — sometimes.",
            fx: {honor:3,them:{type:"friend",op:30},flag:"wk_knight_owes"},
          },
          {
            t: "Have the town watch hold {themHim}",
            check: {s:"diplomacy",s2:"wil",d:50},
            win: {
              r: "The watch hold the squires until a letter comes from home with the money.",
              fx: {coin:30,them:{type:"enemy",op:-30}},
            },
            lose: {
              r: "The watch will not lay hands on a knight. Now you have an enemy, and an empty till.",
              fx: {them:{type:"enemy",op:-40}},
            },
          },
        ],
      },
      {
        id: "wk_knight_returns",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"wk_knight_owes"),
        w: 1.2,
        title: "The knight returns",
        text: "Hooves in the yard. The knight who left on a promise years ago swings down, older and richer, and tosses a heavy purse on your counter.",
        choices: [
          {
            t: "Count it",
            r: "30 suns, and 30 more for the faith you showed.",
            fx: {unflag:"wk_knight_owes",coin:60,honor:2,happy:5},
          },
          {
            t: 'Push it back: "Drink with me instead"',
            r: "He laughs and drinks, and tells every lord in the county where to stay.",
            fx: {unflag:"wk_knight_owes",coin:30,fame:3,perf:6},
          },
        ],
      },
    ]);
    A.defEvents([
      {
        id: "wk_trade_caravan",
        cond: (p,C)=>C.adult(p)&&trader(p)&&free(p),
        title: "A share in the caravan",
        setup: (p,ctx)=>{ctx.route=["POL-17","POL-19","POL-20","POL-24","POL-22"].includes(p.realm)?"the Salt Road, by night, with eight hundred camels":["POL-25","POL-26","POL-34","POL-12"].includes(p.realm)?"the Silk Road east, through the Tusk Clans who tax every caravan":["POL-30","POL-29","POL-28"].includes(p.realm)?"the Nagora road with crucible steel and pepper":"the Sun Road, with wine, oil and cloth"},
        text: "A caravan master is selling shares in a venture along {route}. Fifty suns a share; he promises double if the road is kind. Roads are seldom kind.",
        choices: [
          {
            t: "Buy a share (50 suns)",
            req: p=>p.coin>=50,
            check: {s:"trade",s2:"int",d:50},
            win: {
              r: "The caravan comes back fat. Your fifty comes home as a hundred and ten.",
              fx: {coin:60,skill:{trade:3}},
            },
            lose: {
              r: "Bandits, a dead well and a broken axle. Your share comes home as a dented cup.",
              fx: {coin:-50,wil:1},
            },
          },
          {
            t: "Go with the caravan yourself",
            check: {s:"survival",s2:"trade",d:50},
            win: {
              r: "Months of dust and haggling. You come home browner, harder and 40 suns richer.",
              fx: {coin:40,sta:1,skill:{trade:4,survival:3}},
            },
            lose: {
              r: "Fever on the road. You come home thin and empty-handed.",
              fx: {health:-15,cause:"road fever",coin:-10,wil:1.5},
            },
          },
          {t:"Keep your coin at home",r:"The safest venture is the one you never make.",fx:{}},
        ],
      },
      {
        id: "wk_trade_toll",
        cond: (p,C)=>C.adult(p)&&(trader(p)||J(p,"herd"))&&free(p),
        title: "The toll bridge",
        setup: (p,ctx)=>{ctx.toll=A.ri(4,12)},
        text: p=>`The toll-keeper at the bridge into {town} wants {toll} suns for your cart — double last year. "The ${A.pick(["count","bishop","town council","abbot"])} has new expenses," he says, and spits.`,
        choices: [
          {
            t: "Pay it",
            r: "You pay and add it to your prices.",
            fx: (p,ctx)=>(p.coin=Math.max(0,p.coin-(ctx.toll||6)),""),
          },
          {
            t: "Offer him half in his own pocket",
            check: {s:"intrigue",s2:"diplomacy",d:42},
            win: {
              r: "He pockets it and waves you through.",
              fx: (p,ctx)=>(p.coin=Math.max(0,p.coin-Math.round((ctx.toll||6)/2)),p.honor=A.clamp(p.honor-1,0,100),""),
            },
            lose: {
              r: "He is honest, or watched. You pay the full toll and a fine.",
              fx: (p,ctx)=>(p.coin=Math.max(0,p.coin-(ctx.toll||6)-4),""),
            },
          },
          {
            t: "Take the ford upstream",
            check: {s:"survival",s2:"str",d:45},
            win: {r:"Wet to the waist, but free.",fx:{skill:{survival:2}}},
            lose: {r:"The cart tips in the current. Half your goods float away.",fx:{coin:-15,happy:-5}},
          },
        ],
      },
      {
        id: "wk_trade_partner",
        cond: (p,C)=>C.adult(p)&&trader(p)&&rk(p)>=1,
        title: "A bad partner",
        setup: (p,ctx)=>{ctx.pid=npc(p,"your trading partner")},
        text: "{them}, your partner in a cargo of cloth worth eighty suns, has vanished with the cloth. {theirHis} lodgings are empty and {theirHis} debts are many.",
        choices: [
          {
            t: "Ride after {themHim}",
            check: {s:"ins",s2:"survival",d:55},
            win: {
              r: "You find {them} in an inn two towns away, selling your cloth. You take back what is left.",
              fx: {coin:40,them:{type:"enemy",op:-50}},
            },
            lose: {
              r: "The trail goes cold at the coast. A ship sailed yesterday.",
              fx: {coin:-10,wil:1,them:{type:"enemy",op:-50}},
            },
          },
          {
            t: "Take {themHim} to the merchants' court",
            check: {s:"learning",s2:"diplomacy",d:50},
            win: {
              r: "The court seizes {theirHis} goods in town and pays you from them.",
              fx: {coin:35,honor:2,them:{type:"enemy",op:-40}},
            },
            lose: {r:"The court has many creditors ahead of you.",fx:{coin:-5,them:{type:"enemy",op:-40}}},
          },
          {
            t: "Write it off",
            r: "A hard lesson: choose partners by their past, not their smile.",
            fx: {wil:1.5,skill:{trade:2},them:{type:"enemy",op:-30}},
          },
        ],
      },
      {
        id: "wk_trade_banker",
        cond: (p,C)=>C.adult(p)&&trader(p)&&rk(p)>=1&&free(p),
        title: "The banker",
        setup: (p,ctx)=>{ctx.bank=["POL-28","POL-10","POL-29"].includes(p.realm)||p.race==="dwarf"?"The Hold Bank of Stonehold, which lends only against metal or land and never forgives a debt":p.faith==="REL-07"?"The Water Endowment of Qadira, which charges a fee instead of the interest the Book of Wells forbids":p.realm==="POL-30"?"A temple bank of Ranpur, at twelve in the hundred a year":p.realm==="POL-04"?"House Doravelli of Lucerna":"House Lunetti of Ostra"},
        text: "{bank} will lend you 300 suns against your goods for a venture of your choosing. A man in a dark cap waits for your answer.",
        choices: [
          {
            t: "Borrow 300 and buy a big cargo",
            check: {s:"trade",s2:"int",d:55},
            win: {
              r: "The cargo sells high. You repay with a smile and keep the rest.",
              fx: p=>(p.coin+=180,A.fame(p,1),A.trainSkill(p,"trade",3),"(Profit: 180 suns.)"),
            },
            lose: {
              r: "The market turns. You sell at a loss and owe the bank most of it.",
              fx: p=>(addDebt(p,220),A.willGrow(p,1.5,"debt"),"(You owe 220 suns.)"),
            },
          },
          {
            t: "Borrow a little (100) and play safe",
            r: "Small cargo, small profit, and the debt is paid by winter.",
            fx: {coin:30,skill:{trade:2}},
          },
          {t:"Refuse. Debt is a chain",r:"The man in the dark cap shrugs. Others will borrow.",fx:{}},
        ],
      },
      {
        id: "wk_trade_debased",
        cond: (p,C)=>C.adult(p)&&(trader(p)||p.job&&["craft","trade"].includes(GD.CAREERS[p.job.c].cat))&&free(p),
        title: "Bad coin",
        text: p=>p.realm==="POL-31"?"A buyer pays you in Queen Livia's new Leontines. Tessaria has cut the silver in its coin twice, and nobody outside Tessar takes the queen's money at face value.":"A buyer pays you in Tessarian Leontines and coins with suspiciously smooth edges. Clipped, or debased, or both. When the Leontine crashed in 1083, House Carrano of Ostra went down with it.",
        choices: [
          {
            t: "Accept it at face value",
            r: "The moneychanger gives you two-thirds of what you thought you had.",
            fx: {coin:-12,happy:-2},
          },
          {
            t: "Weigh every coin on your own scale",
            check: {s:"trade",s2:"int",d:45},
            win: {
              r: "You weigh, you reject, you demand good silver. He pays in good silver.",
              fx: {coin:3,skill:{trade:3}},
            },
            lose: {r:"He storms off with the goods unpaid for. No sale today.",fx:{perf:-3}},
          },
          {
            t: "Pass the bad coin on to someone else",
            r: "Everybody does it. That is why the coin is bad.",
            fx: {honor:-3},
          },
        ],
      },
      {
        id: "wk_trade_ship",
        cond: (p,C)=>C.adult(p)&&trader(p)&&rk(p)>=1&&free(p),
        title: "Overdue",
        text: "You hold a share in a cog bound for the western ports. She is three weeks overdue. Since Old Ironjaw began sinking ships, insurance on the western approach has doubled — and you never paid for any.",
        choices: [
          {t:"Sell your share now, at a third",r:"Somebody else can lose sleep over it.",fx:{coin:20}},
          {
            t: "Wait, and pray to every god of the sea",
            check: {s:"trade",s2:"wil",d:50},
            win: {
              r: "She limps in with a cracked mast and a full hold. Your share pays fourfold.",
              fx: {coin:80,happy:6},
            },
            lose: {r:"A spar washes up at Felano with her name on it.",fx:{coin:-40,happy:-6,wil:1.5}},
          },
          {
            t: "Buy up others' shares cheap",
            req: p=>p.coin>=60,
            check: {s:"trade",s2:"int",d:55},
            win: {
              r: "You buy at a quarter from frightened men. She comes in. You are rich, and hated.",
              fx: {coin:140,fame:2,honor:-2},
            },
            lose: {r:"You bought the shares of a wreck.",fx:{coin:-60,wil:2}},
          },
        ],
      },
      {
        id: "wk_trade_lucky",
        cond: (p,C)=>C.adult(p)&&trader(p)&&free(p)&&p.coin>=40,
        title: "A captain in a hurry",
        text: p=>`A ship's captain must sail before the tide and cannot wait to sell his cargo: ${A.pick(["six sacks of pepper","a bale of Kesh cloves","a crate of Qadiri rag paper","twenty bolts of Ranpuri cotton","amber from the Cold Bay shore"])}. He will take 40 suns for the lot.`,
        choices: [
          {
            t: "Buy it (40 suns)",
            check: {s:"trade",s2:"ins",d:45},
            win: {r:"You sell it on in a week for twice the price.",fx:{coin:45,skill:{trade:3}}},
            lose: {
              r: "Wet at the bottom of every sack. Why else would he be in a hurry?",
              fx: {coin:-20,skill:{trade:2}},
            },
          },
          {
            t: "Ask why he is really in a hurry",
            check: {s:"ins",s2:"intrigue",d:45},
            win: {
              r: "The cargo is stolen. You walk away, and later watch the harbor-master's men go aboard.",
              fx: {int:.5,skill:{intrigue:2}},
            },
            lose: {r:"He laughs, and sells to the next man, who does very well.",fx:{}},
          },
          {t:"Let it pass",r:"Fortune knocks, and you are busy.",fx:{}},
        ],
      },
      {
        id: "wk_trade_smuggle",
        cond: (p,C)=>C.adult(p)&&free(p)&&com(p)&&(trader(p)||C.coast(p)),
        title: "Untaxed",
        setup: (p,ctx)=>{ctx.goods=A.pick(["wine","salt","Sabran fire-oil","Kesh pepper","furs","raw silk"])},
        text: "A man in a quayside tavern needs one more pair of hands and one more cart to bring {goods} past the customs house by night. Forty suns for one night's work.",
        choices: [
          {
            t: "Take the job",
            check: {s:"stealth",s2:"trade",d:50},
            win: {r:"A dark lane, a quiet cart, forty suns. Easy, this time.",fx:{coin:40,skill:{stealth:3}}},
            lose: {r:"Lanterns at both ends of the lane.",fx:{punish:"smuggling"}},
          },
          {t:"Refuse",r:"Forty suns is a lot. A rope is more.",fx:{}},
          {
            t: "Tip off the customs men",
            r: "Ten suns from the customs house. A smuggler with a good memory.",
            fx: {coin:10,honor:-2,newRel:{type:"enemy",op:-40}},
          },
        ],
      },
      {
        id: "wk_trade_guild",
        cond: (p,C)=>C.adult(p)&&trader(p)&&rk(p)>=1&&free(p),
        title: "Guild politics",
        text: "The merchants' guild is electing a new warden. The warden sets the fees, sits with the town council and, quietly, decides who gets the best stalls. A vote can be bought for a good dinner.",
        choices: [
          {
            t: "Stand yourself, and buy dinners (40 suns)",
            req: p=>p.coin>=40,
            check: {s:"diplomacy",s2:"intrigue",d:55},
            win: {
              r: "Warden of the guild. The best stall, the council's ear, and a chain to wear.",
              fx: {coin:-40,fame:3,perf:12,skill:{diplomacy:3}},
            },
            lose: {r:"They eat your dinners and vote for the old warden's son.",fx:{coin:-40,happy:-5}},
          },
          {
            t: "Back the likely winner",
            check: {s:"intrigue",s2:"int",d:45},
            win: {r:"Your man wins. Your stall moves to the market cross.",fx:{perf:6,newRel:{type:"friend",op:25}}},
            lose: {r:"Your man loses. Your stall moves next to the tannery.",fx:{perf:-5}},
          },
          {t:"Stay out of it",r:"You sell cloth, not votes.",fx:{}},
        ],
      },
      {
        id: "wk_trade_wells",
        cond: (p,C)=>C.adult(p)&&trader(p)&&C.faith(p,"REL-07"),
        w: 1.4,
        title: "The Book of Wells",
        text: "A Lucernan partner offers a loan at a tenth a year for your next venture. The Book of Wells forbids interest; the Water Endowment of Qadira charges a fee instead, and the Well-Keepers argue about the difference.",
        choices: [
          {
            t: "Take it. A tenth is a tenth",
            r: "The venture prospers. Your conscience itches.",
            fx: {coin:30,piety:-6},
          },
          {
            t: "Insist on a fixed fee instead",
            check: {s:"trade",s2:"diplomacy",d:50},
            win: {
              r: "He thinks you mad, then agrees. A fee is lawful. The Well-Keepers nod.",
              fx: {coin:20,piety:2,skill:{trade:2}},
            },
            lose: {r:"He will not change his terms. You walk away clean and poorer.",fx:{piety:3}},
          },
          {t:"Refuse him",r:"Water first, and clean money after.",fx:{piety:4}},
        ],
      },
    ]);
    A.defEvents([
      {
        id: "wk_sea_payoff",
        cond: (p,C)=>C.adult(p)&&J(p,"sailor"),
        w: 1.3,
        cool: 3,
        title: "Sea Closing",
        text: p=>`1 October. Sea Closing. The crews are paid off on the quay, six months' wages in a lump. ${p.realm==="POL-04"?"The Lagoon Festival of masks is about to begin.":"Every tavern in port has hung out fresh garlands."}`,
        choices: [
          {
            t: "Drink and dice the winter in",
            r: "Glorious, and over by Ash Night.",
            fx: {coinPct:-.4,happy:8,health:-3},
          },
          {
            t: "Sign on for coastal hops through the winter",
            check: {s:"sea",s2:"sta",d:50},
            win: {
              r: "Short hops port to port in bitter weather. Extra pay and hard learning.",
              fx: {coin:20,skill:{sea:4}},
            },
            lose: {
              r: "A winter gale off the headland. You live, the cargo does not, and nor does the pay.",
              fx: {health:-10,cause:"a winter gale",wil:1.5},
            },
          },
          {
            t: "Sew the purse into your shirt and go home",
            r: "Your family eats well this winter.",
            fx: {happy:4,rel:{who:"mother",op:8}},
          },
        ],
      },
      {
        id: "wk_sea_storm",
        cond: (p,C)=>C.adult(p)&&J(p,"sailor","pirate","fish"),
        title: "Storm",
        text: "The sky goes green, then black. The sea rises in grey walls, and the mainsail cracks like a whip. The master is shouting, but the wind takes his words.",
        choices: [
          {
            t: "Climb and cut the sail free",
            check: {s:"spd",s2:"sea",d:50},
            win: {
              r: "You hang from the yard with a knife in your teeth. The sail goes, and the ship rights.",
              fx: {fame:2,perf:6,skill:{sea:4}},
            },
            lose: {
              r: "The yard throws you onto the deck.",
              fx: {health:-16,cause:"a fall in a storm",wound:"broken_ribs",wil:1},
            },
          },
          {
            t: "Bail and pray to the Drowned Queen",
            r: "Bucket after bucket, prayer after prayer. By dawn the sea lies down.",
            fx: {sta:1,piety:3},
          },
          {t:"Lash yourself to the mast",r:"You live. Some of the others do not.",fx:{wil:1.5,happy:-4}},
        ],
      },
      {
        id: "wk_sea_corsairs",
        cond: (p,C)=>C.adult(p)&&J(p,"sailor","merchant","fish")&&C.coast(p),
        title: "Sails astern",
        text: "Two low red sails come up fast from the south, oars flashing. Blackreef galleys, or someone who wants to be mistaken for them.",
        choices: [
          {
            t: "Grab a pike and stand at the rail",
            r: "Grapnels bite the rail. Here they come.",
            fx: {
              duel: {
                tier: 3,
                title: "a corsair boarder",
                opts: {kind:"duel",place:"a rolling deck",lethal:!0,toYield:!0,title:"Boarders"},
              },
            },
          },
          {
            t: "Surrender and hope for ransom",
            r: "They take the cargo, your purse and your boots, and leave you the ship.",
            fx: {coinPct:-.4,happy:-6,wil:1},
          },
          {
            t: "Crowd on sail and run for the shallows",
            check: {s:"sea",s2:"ins",d:50},
            win: {r:"You skim over a sandbar the galleys dare not cross.",fx:{fame:1,skill:{sea:4}}},
            lose: {
              r: "They are faster. Arrows first, then grapnels.",
              fx: {health:-12,cause:"an arrow",wound:"arrow_wound",coinPct:-.3},
            },
          },
        ],
      },
      {
        id: "wk_sea_toll",
        cond: (p,C)=>C.adult(p)&&J(p,"sailor","merchant","pirate")&&C.coast(p),
        title: "The dragon toll",
        text: p=>J(p,"pirate")?"You row out to a fat Lucernan cog to collect the dragon toll: twenty suns a ship, in Lucernan crowns. Her master swears he already paid at the Ostran house.":"Off the Strait of Hael, a Blackreef boat comes alongside for the dragon toll: twenty suns a ship, in Lucernan crowns. Your captain mutters about running the strait by night next time.",
        choices: [
          {
            t: "Keep your mouth shut and haul ropes",
            r: "Toll paid or taken, the sea goes on.",
            fx: {skill:{sea:1}},
          },
          {
            t: "Back the captain: run the strait by night",
            req: p=>!J(p,"pirate"),
            check: {s:"sea",s2:"ins",d:55},
            win: {r:"No lights, muffled oars, a lucky fog. You are through.",fx:{coin:12,fame:1,skill:{sea:3}}},
            lose: {
              r: "Blackreef galleys catch you at dawn and take double for the insult.",
              fx: {coin:-10,health:-10,cause:"a corsair cudgel"},
            },
          },
          {
            t: "Search the hold anyway",
            req: p=>J(p,"pirate"),
            check: {s:"ins",s2:"intrigue",d:45},
            win: {
              r: "Under the grain: Sabran oil jars with no stamp. The master pays you to forget them.",
              fx: {coin:25,perf:3},
            },
            lose: {
              r: "His receipt was real. The Captain-General fines you for insulting a paying ship.",
              fx: {coin:-10,perf:-5},
            },
          },
        ],
      },
      {
        id: "wk_sea_lodestone",
        cond: (p,C)=>C.adult(p)&&J(p,"sailor")&&rk(p)>=2,
        once: !0,
        title: "The pilot's secret",
        setup: (p,ctx)=>{ctx.pid=npc(p,"an old pilot")},
        text: '{them}, an old pilot with no son, shows you a bowl of water with a needle floating on a straw. The floating lodestone: pilots pass the secret from father to son. "I have no son," {theyHe} says. "Swear the oath."',
        choices: [
          {
            t: "Swear the pilot's oath and learn",
            check: {s:"int",s2:"sea",d:50},
            win: {
              r: "Months of stars, soundings and the needle. You can find north in fog now.",
              fx: {skill:{sea:8},int:1,perf:8,flag:"wk_lodestone",them:{type:"mentor",op:35}},
            },
            lose: {
              r: "You learn the trick but not the art. Still worth knowing.",
              fx: {skill:{sea:3},them:{type:"mentor",op:20}},
            },
          },
          {
            t: "Learn it, then sell it to a rival house",
            check: {s:"intrigue",s2:"int",d:55},
            win: {
              r: "A merchant house pays you 80 suns. The pilots will never know. You hope.",
              fx: {coin:80,honor:-10,them:{type:"mentor",op:-10}},
            },
            lose: {
              r: "The pilots find out. Nobody in this port will ship with you.",
              fx: {honor:-12,perf:-20,them:{type:"enemy",op:-60}},
            },
          },
          {
            t: "Refuse. Some oaths bind too tight",
            r: "{them} nods, disappointed, and takes the secret to another.",
            fx: {them:{type:"friend",op:5}},
          },
        ],
      },
      {
        id: "wk_sea_catch",
        cond: (p,C)=>C.adult(p)&&J(p,"fish"),
        w: 1.3,
        title: "The shoal",
        text: p=>`Gulls screaming over silver water: a great shoal of ${A.pick(["herring","sardines","mackerel","tunny"])} far out beyond the headland. The weather is turning.`,
        choices: [
          {
            t: "Follow it out",
            check: {s:"sea",s2:"sta",d:50},
            win: {
              r: "The boat comes home low in the water. Every barrel in the village is full.",
              fx: {coin:15,skill:{sea:3}},
            },
            lose: {
              r: "The weather comes in. You cut away your nets to save the boat.",
              fx: {coin:-8,health:-6,cause:"cold seas",wil:1},
            },
          },
          {t:"Fish the bay and come home safe",r:"A fair catch, a dry bed.",fx:{coin:4}},
          {
            t: "Signal the other boats",
            r: "Every boat shares the catch. Every boat remembers.",
            fx: {coin:6,honor:2,newRel:{type:"friend",op:25}},
          },
        ],
      },
      {
        id: "wk_sea_overboard",
        cond: (p,C)=>C.adult(p)&&J(p,"fish","sailor"),
        title: "Man overboard",
        setup: (p,ctx)=>{ctx.pid=npc(p,"a shipmate")},
        text: "A wave takes {them} over the side. Sailors on Ardan seldom learn to swim — the sea takes who it takes. {them} comes up once, mouth open, ten yards off.",
        choices: [
          {
            t: "Go in after {themHim}",
            check: {s:"sta",s2:"sea",d:52},
            win: {
              r: "You get an arm around {themHim} and a rope around you both.",
              fx: {fame:2,honor:4,them:{type:"friend",op:50}},
            },
            lose: {
              r: "The cold grips your chest. The crew drags you both out, half-drowned.",
              fx: {health:-15,cause:"drowning",wil:1,them:{type:"friend",op:30}},
            },
          },
          {
            t: "Throw a rope",
            check: {s:"ins",s2:"spd",d:40},
            win: {r:"The rope lands across {theirHis} shoulders. {theyHe} holds on.",fx:{them:{type:"friend",op:35}}},
            lose: {
              r: "Short. Another boat pulls {them} out, blue and choking.",
              fx: {happy:-4,them:{type:"acquaint",op:-5}},
            },
          },
          {
            t: "It is too rough. Let the sea decide",
            r: "Another boat finds {them} clinging to a spar. {theyHe} never looks at you the same way.",
            fx: {wil:.8,them:{type:"acquaint",op:-20}},
          },
        ],
      },
      {
        id: "wk_sea_share",
        cond: (p,C)=>C.adult(p)&&J(p,"pirate"),
        w: 1.5,
        cool: 3,
        title: "Share Day",
        text: "Share Day at Blackreef: the crews meet under the Articles to share the year's take and vote. Ima Redsail wants to vote out Captain-General Nell Brine and go back to open raiding. Both sides are buying drinks.",
        choices: [
          {
            t: "Vote with Redsail",
            r: "You shout for prizes and blood. Nell Brine remembers faces.",
            fx: {fame:1,happy:3,coin:10,flag:"wk_redsail"},
          },
          {
            t: "Vote with Nell Brine",
            r: "The dragon toll is steady money. Brine nods to you across the cave.",
            fx: {honor:2,perf:6},
          },
          {
            t: "Sell your vote to both sides",
            check: {s:"intrigue",s2:"diplomacy",d:55},
            win: {r:"Two purses, one vote, and nobody counts hands that closely.",fx:{coin:30,skill:{intrigue:3}}},
            lose: {
              r: "Both sides find out. The crew votes to maroon you on a rock for a week.",
              fx: {health:-15,cause:"thirst on a rock",honor:-6,wil:2},
            },
          },
        ],
      },
    ]);
    A.defEvents([
      {
        id: "wk_mine_air",
        cond: (p,C)=>C.adult(p)&&J(p,"miner"),
        w: 1.3,
        title: "Bad air",
        text: p=>`In the new drift your candle flame shrinks, turns blue and leans away from the face. The old ${p.race==="dwarf"?"shift-wardens":"miners"} call it the choke-damp. Your head starts to pound.`,
        choices: [
          {
            t: "Run and shout the warning",
            r: "You stumble out with the whole gang behind you. The drift is sealed for a month. Nobody dies.",
            fx: {honor:3,perf:-2,newRel:{type:"friend",op:30}},
          },
          {
            t: "Finish the face. The ore is good",
            check: {s:"sta",s2:"wil",d:55},
            win: {r:"You fill the basket and crawl out dizzy, with the richest load of the week.",fx:{coin:6,perf:6}},
            lose: {
              r: "They drag you out by the ankles. You cough for a year.",
              fx: {health:-20,cause:"bad air",wound:"lungs",wil:1},
            },
          },
          {
            t: "Send the mine boy ahead to test it",
            r: "The boy comes back gasping. The men look at you differently after that.",
            fx: {honor:-5,perf:2},
          },
        ],
      },
      {
        id: "wk_mine_fall",
        cond: (p,C)=>C.adult(p)&&J(p,"miner"),
        title: "Rockfall",
        setup: (p,ctx)=>{ctx.pid=npc(p,"a miner of your gang")},
        text: "A crack like a thunderclap, then dust. When the lamps find each other again, the gallery behind you is a wall of rubble. Somewhere under it {them} is calling your name.",
        choices: [
          {
            t: "Dig with your hands",
            check: {s:"str",s2:"sta",d:50},
            win: {
              r: "Four hours, bleeding fingers, and then {theirHis} hand in yours.",
              fx: {honor:4,fame:1,them:{type:"friend",op:50}},
            },
            lose: {
              r: "A second fall. The props crack around you both. Others dig you out at dawn.",
              fx: {health:-18,cause:"a rockfall",wound:"broken_ribs",wil:1.5,them:{type:"friend",op:30}},
            },
          },
          {
            t: "Shore it up first, then dig",
            check: {s:"craft",s2:"int",d:45},
            win: {
              r: "Slow, careful props. You reach {them} without bringing the roof down.",
              fx: {perf:6,skill:{craft:3},them:{type:"friend",op:40}},
            },
            lose: {
              r: "By the time you reach {themHim}, {theirHis} leg is crushed. {theyHe} will walk with a stick.",
              fx: {happy:-6,them:{type:"friend",op:15}},
            },
          },
          {
            t: "Run for the shift boss",
            r: "The boss brings ropes and men. It takes all night. {them} lives, barely.",
            fx: {them:{type:"acquaint",op:5}},
          },
        ],
      },
      {
        id: "wk_labor_gate",
        cond: (p,C)=>C.adult(p)&&free(p)&&com(p)&&(J(p,"labor")||!p.job&&!p.mil),
        w: 1.2,
        title: "The dawn bell",
        text: `At the dawn bell, men crowd the town gate to be hired: a sun a day for your back, dawn to dusk. Today's foreman says he will dock a penny a man "for water".`,
        choices: [
          {
            t: "Take the work, penny and all",
            r: "A day of sacks and stones. You eat tonight.",
            fx: {coin:3,str:.4},
          },
          {
            t: "Rally the others to demand full pay",
            check: {s:"diplomacy",s2:"wil",d:50},
            win: {
              r: "Forty men refuse together. The foreman finds he has no water penny after all.",
              fx: {coin:5,fame:1,newRel:{type:"friend",op:25}},
            },
            lose: {r:"The foreman marks your face. No work from him again.",fx:{perf:-8,happy:-4}},
          },
          {
            t: "Shove to the front for the best gang",
            check: {s:"str",s2:"ins",d:40},
            win: {r:"The quay gang pays a sun and a half. You get the last place.",fx:{coin:6}},
            lose: {r:"A docker's elbow in your ribs. You go home with nothing.",fx:{health:-5,cause:"a scuffle"}},
          },
        ],
      },
      {
        id: "wk_serv_secret",
        cond: (p,C)=>C.adult(p)&&J(p,"servant"),
        w: 1.3,
        title: "Servants know everything",
        // [X1 baked patch core/02-content-fixes EVT-SERV-SECRET] wk_serv_secret: one of its four secrets contains {enemy},
        // which this pack never filled, so the event was dropped 1 time in 4.
        setup: (p,ctx)=>{ctx.secret=A.T(A.pick(["the steward has been selling the master's wine and refilling the casks with vinegar","the heir owes forty suns in dice debts to a man from the docks","the master is writing to a lord of {enemy}","the mistress has a lover among the household knights"]))},
        text: "Servants know everything. You sweep, you carry, you listen — and now you know that {secret}.",
        choices: [
          {
            t: "Tell the master, quietly",
            check: {s:"diplomacy",s2:"int",d:50},
            win: {r:"He thanks you with a purse and a better place in the house.",fx:{coin:10,perf:10}},
            lose: {r:"He does not like the news, or the messenger. You are watched now.",fx:{perf:-8,happy:-4}},
          },
          {
            t: "Let the guilty one know you know",
            check: {s:"intrigue",s2:"wil",d:55},
            win: {
              r: "A purse finds its way under your pillow every quarter.",
              fx: {coin:25,honor:-5,skill:{intrigue:3}},
            },
            lose: {
              r: "The guilty strike first. You are accused of theft and turned out.",
              fx: p=>(p.honor=A.clamp(p.honor-6,0,100),p.flags.unfree||(p.job=null),"You are turned out without a character."),
            },
          },
          {
            t: "Keep it, and remember",
            r: "You fold it away like a good linen. One day it may be worth something.",
            fx: {skill:{intrigue:2},flag:"wk_knows_secret"},
          },
        ],
      },
      {
        id: "wk_serv_martinmas",
        cond: (p,C)=>C.adult(p)&&J(p,"servant")&&free(p),
        title: "Contract day",
        text: "11 November. Servants' contracts end, and you have had your coat at the Slaughter Feast. Your master offers another year at the same wage. A rich household across town offers a third more.",
        choices: [
          {
            t: "Stay. Better the devil you know",
            r: "Your master is pleased. The cook saves you the best scraps.",
            fx: {perf:5,happy:2},
          },
          {
            t: "Move to the rich house",
            r: "Better wages, colder people.",
            fx: {coin:10,perf:-5,newRel:{type:"friend",op:20}},
          },
          {
            t: "Use the offer to haggle",
            check: {s:"diplomacy",s2:"int",d:45},
            win: {r:"Your master matches it, grumbling.",fx:{coin:8,perf:2}},
            lose: {r:'"Then go," he says. You go.',fx:{coin:5,perf:-6,happy:-3}},
          },
        ],
      },
    ]);
    A.defEvents([
      {
        id: "wk_heal_fever",
        cond: (p,C)=>C.adult(p)&&J(p,"healer"),
        w: 1.3,
        title: "Fever in the lanes",
        text: "Fever runs through the poor lanes by the tannery. The physicians blame bad air. You have noticed something odd: the houses where they boil the water and wash the sick get fewer deaths. Nobody on Ardan knows why.",
        choices: [
          {
            t: "Wash, boil, and dress with honey and vinegar",
            check: {s:"medicine",s2:"int",d:50},
            win: {
              r: "Your lanes bury fewer than any other. People start to say your name with respect.",
              fx: {fame:2,int:1,skill:{medicine:5},flag:"wk_washes"},
            },
            lose: {r:"You catch the fever yourself.",fx:{health:-15,cause:"fever",skill:{medicine:3},wil:1}},
          },
          {
            t: "Bleed them, as the books say",
            r: "The books are old and respected. You are paid. Many die anyway.",
            fx: {coin:10,skill:{medicine:1}},
          },
          {
            t: "Keep away from the lanes",
            r: "You live. The lanes remember who did not come.",
            fx: {honor:-3,perf:-4},
          },
        ],
      },
      {
        id: "wk_heal_cut",
        cond: (p,C)=>C.adult(p)&&J(p,"healer")&&rk(p)>=1,
        title: "The leg",
        text: "A carter's leg was crushed under his own wheel a week ago. Now it is black to the knee and stinks. A barber-surgeon takes 5 suns to amputate. Half the men you cut die anyway.",
        choices: [
          {
            t: "Take the leg off",
            check: {s:"medicine",s2:"wil",d:55},
            win: {
              r: "Saw, hot iron, and his screaming. He lives, and hobbles to your door to thank you.",
              fx: {coin:5,fame:2,skill:{medicine:4},newRel:{type:"friend",op:30}},
            },
            lose: {r:"He dies on the table. His widow pays you anyway.",fx:{coin:5,happy:-6,wil:1.5}},
          },
          {
            t: "Poultice it and hope",
            check: {s:"medicine",s2:"int",d:65},
            win: {r:"Against all sense, the black recedes.",fx:{fame:3,skill:{medicine:5}}},
            lose: {r:"He dies in three days, slowly.",fx:{happy:-6,honor:-2}},
          },
          {
            t: "Send them to the physician (2 suns a visit)",
            r: "The physician reads his urine and prescribes powdered pearl. The carter's family is ruined.",
            fx: {honor:-1},
          },
        ],
      },
      {
        id: "wk_scribe_forgery",
        cond: (p,C)=>C.adult(p)&&C.literate(p)&&free(p)&&(J(p,"scribe")||com(p)&&!p.job),
        w: 1.2,
        title: "A charter that never was",
        setup: (p,ctx)=>{ctx.lord=lordName(p)},
        text: `Few on Ardan can read, and fewer can write; you earn your bread at six pence a letter. Now {lord}'s man wants an old charter "found", granting his master the village mill and the common grazing. Fifty suns, and nobody will check the wax.`,
        choices: [
          {
            t: "Forge it",
            check: {s:"learning",s2:"intrigue",d:55},
            win: {
              r: "Old ink, a scraped seal, a little dust. It passes. The village loses its common.",
              fx: {coin:50,honor:-8,skill:{learning:3}},
            },
            lose: {
              r: "A monk at the hearing spots the wrong spelling of an old word.",
              fx: {honor:-10,prison:2,why:"forging a charter"},
            },
          },
          {
            t: "Refuse",
            r: "The man smiles thinly. Someone else will do it. You will not get work from that castle again.",
            fx: {honor:3,newRel:{type:"enemy",op:-25}},
          },
          {
            t: "Warn the village",
            check: {s:"intrigue",s2:"diplomacy",d:45},
            win: {
              r: "The village elders bring their own old charter to the hearing. The forgery fails.",
              fx: {honor:6,fame:2,newRel:{type:"friend",op:40}},
            },
            lose: {
              r: "The lord learns who warned them.",
              fx: {honor:4,health:-8,cause:"a beating in an alley",newRel:{type:"enemy",op:-40}},
            },
          },
        ],
      },
      {
        id: "wk_minstrel_song",
        cond: (p,C)=>C.adult(p)&&J(p,"minstrel"),
        w: 1.3,
        title: "A song for a lord",
        setup: (p,ctx)=>{const s=A.pick(LORE.songs);ctx.song=s?s[0]:"The Lay of the Ford",ctx.lord=lordName(p)},
        text: '{lord} pays well for a song of the battle where he "held the ford". You were there. He held it for about as long as it takes to turn a horse. Songs are rarely what happened: think of "{song}".',
        choices: [
          {
            t: "Sing what he wants",
            r: "Trumpets, glory and a cloak of gold. He weeps and fills your cup with silver.",
            fx: {coin:25,fame:2,honor:-2,skill:{music:2}},
          },
          {
            t: "Sing a sting only the wise will hear",
            check: {s:"music",s2:"int",d:55},
            win: {
              r: "The lord beams. The old soldiers at the back laugh into their beer. Both pay you.",
              fx: {coin:18,fame:3,skill:{music:4}},
            },
            lose: {
              r: "His steward hears the joke. You leave by the window.",
              fx: {health:-5,cause:"a fall from a window",fame:1},
            },
          },
          {
            t: "Sing the truth",
            check: {s:"music",s2:"wil",d:60},
            win: {
              r: "The hall goes silent. Then a one-armed veteran stands and toasts you. The song spreads to every tavern.",
              fx: {fame:5,honor:4},
            },
            lose: {
              r: "His men throw you down the steps with your lute after you.",
              fx: {health:-12,cause:"being thrown down steps",honor:3},
            },
          },
        ],
      },
      {
        id: "wk_hunt_poach",
        cond: (p,C)=>C.adult(p)&&free(p)&&(J(p,"hunter")||com(p)&&C.poor(p))&&C.terr(p,"forest","hills","marsh"),
        title: "The lord's deer",
        text: "A hart stands in the mist at the edge of the lord's forest, a hundred pounds of meat on four legs. The forest law is plain: the deer is the lord's, and so is anyone caught with it.",
        choices: [
          {
            t: "Take the shot",
            check: {s:"stealth",s2:"survival",d:50},
            win: {
              r: "Venison in the pot, the hide under the floor, and nobody the wiser.",
              fx: {coin:6,health:4,skill:{bow:2,survival:2}},
            },
            lose: {r:"The forester's men find the blood trail to your door.",fx:{punish:"theft"}},
          },
          {
            t: "Set snares for rabbits on the common",
            r: "A rabbit is not a hart. It is also not a hanging.",
            fx: {coin:1,skill:{survival:2}},
          },
          {
            t: "Tell the forester about the other poachers",
            r: "Five suns and a nod from the castle. The village goes quiet when you pass.",
            fx: {coin:5,honor:-4,newRel:{type:"enemy",op:-30}},
          },
        ],
      },
      {
        id: "wk_hunt_beast",
        cond: (p,C)=>C.adult(p)&&J(p,"hunter"),
        w: 1.2,
        title: "The bounty",
        setup: (p,ctx)=>{const n=A.beastsNear(p).filter(id=>A.BEASTS[id]&&A.BEASTS[id].hp<=200);ctx.beast=n.length?A.pick(n):"CRE-21"},
        text: 'Something is taking sheep. The village has scraped together 20 suns for whoever kills {beast}. The old women say: "{beastBelief}"',
        choices: [
          {
            t: "Hunt it",
            r: "You take your spear and go to meet it.",
            fx: {beast:{place:"the high pasture"},coin:20},
          },
          {
            t: "Track it and learn what it really is first",
            check: {s:"survival",s2:"int",d:50},
            win: {
              r: "Three days on its trail. You learn the truth of it: {beastTruth}",
              fx: {skill:{survival:5},int:.5},
            },
            lose: {r:"You lose the trail in the rocks. Two more sheep die.",fx:{happy:-3}},
          },
          {
            t: "Refuse. Twenty suns is not your life",
            r: "Someone else goes. Someone else does not come back.",
            fx: {},
          },
        ],
      },
      {
        id: "wk_clergy_vows",
        cond: (p,C)=>C.adult(p)&&J(p,"clergy")&&rk(p)===0,
        once: !0,
        w: 1.5,
        title: "The vows",
        text: p=>`Your years as a novice are done. Tomorrow you take the vows of ${god(p)}. ${p.faith==="REL-01"?"Priests of the Temple may not marry.":p.faith==="REL-02"?"Dawn Church priests may marry; the monks may not.":p.faith==="REL-06"?"Most families give one child to the monasteries. Yours gave you.":"Once sworn, you belong to the faith before your kin."}`,
        choices: [
          {
            t: "Take the vows with your whole heart",
            r: "You lie face down on the cold stone while the old ones sing over you. You rise someone else.",
            fx: p=>(A.willGrow(p,1,"vows"),p.piety=A.clamp(p.piety+8,0,100),promote(p)),
          },
          {
            t: "Take them, with doubts",
            r: "You say the words. Your mouth believes them more than your heart.",
            fx: p=>(p.piety=A.clamp(p.piety+2,0,100),promote(p)),
          },
          {
            t: "Walk away from the faith's service",
            r: "You hand back the novice's robe. Your mother weeps. The world is very wide.",
            fx: p=>(p.job=null,p.happy=A.clamp(p.happy+2,0,100),p.piety=A.clamp(p.piety-4,0,100),""),
          },
        ],
      },
      {
        id: "wk_clergy_prior",
        cond: (p,C)=>C.adult(p)&&J(p,"clergy")&&rk(p)>=1,
        title: "A corrupt superior",
        setup: (p,ctx)=>{ctx.pid=npc(p,`your superior, a ${clergy(p)}`),ctx.sin=A.pick(["selling false relics to pilgrims","keeping the alms for the poor in his own chest","renting the house's land to his brother for a penny","selling blessings to men who have not repented"])},
        text: "{them}, your superior, is {sin}. Everybody in the house knows. Nobody says anything.",
        choices: [
          {
            t: "Write to the bishop",
            check: {s:"diplomacy",s2:"intrigue",d:55},
            win: {
              r: "An inspector comes. {them} is sent to a far house to pray. You are given more to do.",
              fx: p=>(p.piety=A.clamp(p.piety+3,0,100),p.honor=A.clamp(p.honor+4,0,100),promote(p)||"(Your standing rises.)"),
            },
            lose: {
              r: "The bishop is {theirHis} cousin. You are sent to a cold house on a hill.",
              fx: {perf:-15,wil:1.5,them:{type:"enemy",op:-50}},
            },
          },
          {
            t: "Take a share for your silence",
            r: "Thirty suns a year to see nothing. Your prayers go flat.",
            fx: {coin:30,piety:-6,honor:-4,them:{type:"friend",op:15}},
          },
          {
            t: "Confront {themHim} alone",
            check: {s:"wil",s2:"faith",d:50},
            win: {
              r: "{them} goes white, then quiet. The selling stops.",
              fx: {honor:3,piety:2,them:{type:"rival",op:-20}},
            },
            lose: {
              r: "{them} laughs. You get the worst duties for a year.",
              fx: {perf:-6,wil:1,them:{type:"enemy",op:-30}},
            },
          },
        ],
      },
      {
        id: "wk_clergy_miracle",
        cond: (p,C)=>C.adult(p)&&J(p,"clergy"),
        title: "A miracle?",
        text: p=>`A ${A.pick(["shepherd girl","blind widow","lame boy"])} says the old image in your shrine ${A.pick(["wept","spoke","moved its hand"])}, and now ${A.pick(["she sees","he walks","the fever has left the village"])}. Pilgrims arrive by the cartload, and so does their money.`,
        choices: [
          {
            t: "Proclaim it a miracle",
            r: "The shrine grows rich. The bishop sends a letter of praise.",
            fx: {coin:20,fame:3,perf:5},
          },
          {
            t: "Look into it quietly",
            check: {s:"learning",s2:"int",d:50},
            win: {
              r: "A cracked roof tile drips rainwater down the image's face. You fix the tile and keep the girl's faith out of it.",
              fx: {int:1,honor:3,skill:{learning:3}},
            },
            lose: {r:"You find nothing. Perhaps there is nothing to find. Perhaps there is.",fx:{piety:3}},
          },
          {
            t: "Denounce it as a fraud",
            r: "The pilgrims curse you and the village stops tithing for a season.",
            fx: {honor:2,perf:-6,happy:-4},
          },
        ],
      },
      {
        id: "wk_clergy_heresy",
        cond: (p,C)=>C.adult(p)&&J(p,"clergy")&&rk(p)>=1,
        title: "The preacher",
        setup: (p,ctx)=>{ctx.pid=npc(p,"a wandering preacher"),ctx.claim=A.pick(["the year count is wrong","the priests are thieves","the poor need no priest to speak to the gods","the ruler was never truly anointed"])},
        text: "A wandering preacher, {them}, draws crowds in the market saying {claim}. Your superiors want names: who listens, who feeds {themHim}, who believes.",
        choices: [
          {
            t: "Give them the names",
            r: "Your superiors are pleased. Some of the names are your neighbors.",
            fx: {perf:10,honor:-5,them:{type:"enemy",op:-40}},
          },
          {
            t: "Debate {themHim} before the crowd",
            check: {s:"faith",s2:"learning",d:55},
            win: {
              r: "You answer every point. The crowd drifts home thoughtful, and {them} leaves town.",
              fx: {fame:3,piety:3,skill:{faith:3},them:{type:"rival",op:-10}},
            },
            lose: {
              r: "{them} wins the crowd. Some laugh at you in the street.",
              fx: {fame:-1,happy:-4,them:{type:"rival",op:-10}},
            },
          },
          {
            t: "Warn {themHim} to leave tonight",
            r: "{them} is gone by morning. Nobody knows who warned {themHim}. You hope.",
            fx: {honor:3,perf:-4,them:{type:"friend",op:35}},
          },
        ],
      },
    ]);
    A.defEvents([
      {
        id: "wk_gen_rent",
        cond: (p,C)=>C.adult(p)&&com(p)&&free(p)&&C.town(p)&&!hasAsset(p,"townhouse","inn","manor","castle","hovel","cottage"),
        title: "The rent",
        text: 'A town room rents for 3 suns a month. Your landlord has decided yours is now worth 4. "Times are hard," he says, from inside a new fur collar.',
        choices: [
          {t:"Pay it",r:"You pay. You eat less meat.",fx:{coin:-12,happy:-2}},
          {
            t: "Move to a worse room by the tannery",
            r: "Cheaper, damper, and it smells. You get used to it. Mostly.",
            fx: {coin:6,happy:-4,health:-3},
          },
          {
            t: "Argue him down",
            check: {s:"diplomacy",s2:"wil",d:45},
            win: {r:"You remind him who fixed his roof. He grumbles, and the rent stays at 3.",fx:{happy:2}},
            lose: {r:"He raises it to 5 for your trouble.",fx:{coin:-20,happy:-4}},
          },
          {
            t: "Buy a hovel of your own (15 suns)",
            req: p=>p.coin>=15,
            r: "Four walls of your own, leaning slightly. Nobody can raise the rent on it.",
            fx: {coin:-15,asset:"hovel",happy:5},
          },
        ],
      },
      {
        id: "wk_gen_stolen",
        cond: (p,C)=>C.adult(p)&&com(p)&&p.coin>=20,
        title: "The floor stone",
        setup: (p,ctx)=>{ctx.amt=Math.max(5,Math.round(p.coin*.4))},
        text: "You lift the loose floor stone. The purse is gone: {amt} suns of savings. The lodger who left before dawn left the door open behind him.",
        choices: [
          {
            t: "Chase him down the road",
            check: {s:"spd",s2:"ins",d:50},
            win: {
              r: "You catch him at the ferry, still counting. You take back every coin and a little skin.",
              fx: {spd:.5,fame:1},
            },
            lose: {
              r: "The road splits three ways. You choose wrong.",
              fx: (p,ctx)=>(p.coin=Math.max(0,p.coin-(ctx.amt||10)),A.willGrow(p,1,"loss"),""),
            },
          },
          {
            t: "Go to the reeve",
            check: {s:"diplomacy",s2:"learning",d:55},
            win: {
              r: "The reeve's men find him drunk in {town}. Half the money is left.",
              fx: (p,ctx)=>(p.coin=Math.max(0,p.coin-Math.round((ctx.amt||10)/2)),""),
            },
            lose: {
              r: "The reeve writes it down. That is all.",
              fx: (p,ctx)=>(p.coin=Math.max(0,p.coin-(ctx.amt||10)),""),
            },
          },
          {
            t: "Let it go",
            r: "Gone is gone. You start again, copper by copper.",
            fx: (p,ctx)=>(p.coin=Math.max(0,p.coin-(ctx.amt||10)),A.willGrow(p,1.5,"loss"),""),
          },
        ],
      },
      {
        id: "wk_gen_windfall",
        cond: (p,C)=>C.adult(p)&&com(p),
        w: .7,
        title: "A windfall",
        setup: (p,ctx)=>{ctx.amt=A.ri(25,70)},
        text: (p,ctx)=>`${A.pick(["An uncle you barely remember dies in {town} and leaves you {amt} suns","Mending a wall, you find a clay pot of old Solen coins worth {amt} suns","A merchant you once helped on the road sends you {amt} suns and a letter of thanks"])}. It is more money than you have seen in one place for a long time.`,
        choices: [
          {t:"Keep it all",r:"Under the floor stone it goes.",fx:(p,ctx)=>(p.coin+=ctx.amt||30,"")},
          {
            t: "Share it with your family",
            r: "Half to your kin. They will remember it longer than you would have spent it.",
            fx: (p,ctx)=>{p.coin+=Math.round((ctx.amt||30)/2);for(const x of A.relsOf(p,["mother","father","sibling","spouse"]))A.addOp(p,x.p,8);return p.honor=A.clamp(p.honor+2,0,100),""},
          },
          {
            t: "Give a tenth to the gods and feast the street",
            r: "Ale for the street, a candle for the gods, and the rest for you.",
            fx: (p,ctx)=>(p.coin+=Math.round((ctx.amt||30)*.6),p.piety=A.clamp(p.piety+3,0,100),p.happy=A.clamp(p.happy+5,0,100),""),
          },
        ],
      },
      {
        id: "wk_gen_fire",
        cond: (p,C)=>C.adult(p)&&com(p)&&C.town(p),
        w: .8,
        title: "Fire in the street",
        text: "Somebody's chimney catches, then their thatch, then the next roof. The wind is from the west. Your street is east.",
        choices: [
          {
            t: "Join the bucket chain",
            check: {s:"sta",s2:"wil",d:40},
            win: {
              r: "Hours of buckets from the well. The fire stops two houses from yours.",
              fx: {honor:3,sta:.6,newRel:{type:"friend",op:25}},
            },
            lose: {r:"A falling rafter catches your arm.",fx:{honor:3,wound:"burn",health:-12,cause:"burns"}},
          },
          {
            t: "Pull down the next house to make a firebreak",
            check: {s:"command",s2:"str",d:50},
            win: {
              r: "You rally men with hooks and ropes. The house comes down and the fire starves.",
              fx: {fame:3,skill:{command:3}},
            },
            lose: {
              r: "Too slow. The fire jumps the gap, and the owner of the pulled-down house wants your blood.",
              fx: {coin:-10,newRel:{type:"enemy",op:-40}},
            },
          },
          {
            t: "Save your own things",
            r: "You carry out your chest and bedding. Your house survives. Not everyone's does.",
            fx: {honor:-1},
          },
        ],
      },
      {
        id: "wk_gen_plague",
        cond: (p,C)=>C.adult(p)&&com(p)&&C.town(p),
        w: .6,
        cool: 12,
        title: "Plague",
        text: "Plague comes up from the port. The priests say bad air, the physicians say bad blood. Carts go round at dawn for the dead. Those who can, flee.",
        choices: [
          {
            t: "Flee to the countryside",
            r: "You sleep in barns and pay too much for bread. You live.",
            fx: {coin:-10,happy:-4,perf:-5},
          },
          {
            t: "Stay and work: wages are tripled",
            check: {s:"sta",s2:"wil",d:50},
            win: {
              r: "With half the town dead or fled, every pair of hands is gold. You come through richer.",
              fx: {coin:25,wil:1},
            },
            lose: {r:"The swellings come. You live, barely.",fx:{health:-30,cause:"plague",wil:2}},
          },
          {
            t: "Nurse the sick",
            check: {s:"sta",s2:"medicine",d:55},
            win: {
              r: "You carry water and bury the dead and somehow never sicken. People call you blessed.",
              fx: {honor:6,piety:4,fame:3,skill:{medicine:3}},
            },
            lose: {r:"You catch it from the third house you nurse.",fx:{health:-35,cause:"plague",honor:5,wil:2}},
          },
        ],
      },
      {
        id: "wk_gen_tax",
        cond: (p,C)=>C.adult(p)&&com(p)&&free(p),
        title: "The tax-collector",
        text: p=>`The ${A.pick(["tax-farmer","royal collector","reeve","count's receiver"])} comes down the street with two spearmen and a book. ${A.cap(A.pick(["the hearth tax","the war levy","a new tax on salt","the head tax"]))} is due — for ${A.realmShort(p.realm)}, he says, and for the ruler.`,
        choices: [
          {t:"Pay what he asks",r:"You pay. The realm goes on.",fx:{coinPct:-.1}},
          {
            t: "Hide your coin and plead poverty",
            check: {s:"stealth",s2:"int",d:45},
            win: {
              r: "He finds a cracked pot with three coppers in it and moves on, disgusted.",
              fx: {skill:{stealth:2}},
            },
            lose: {r:"The spearmen pull up the floor. He takes a quarter, and a fine.",fx:{coinPct:-.25,honor:-2}},
          },
          {
            t: "Slip him a sweetener",
            check: {s:"intrigue",s2:"diplomacy",d:40},
            win: {r:"Your name is written very small in his book.",fx:{coin:-3}},
            lose: {r:"An honest collector, of all the luck. You pay double.",fx:{coinPct:-.2,honor:-2}},
          },
        ],
      },
      {
        id: "wk_gen_feud",
        cond: (p,C)=>C.adult(p)&&com(p)&&free(p),
        title: "The neighbor",
        setup: (p,ctx)=>{ctx.pid=npc(p,"your neighbor")},
        text: p=>`{them} next door has always been ${A.pick(["loud","sharp-tongued","an old enemy of your family","quick to take offense"])}. And now ${A.pick(["{theirHis} pigs have rooted up your garden again","{theirHis} son has called your family thieves at the well","{theyHe} is suing you over a cart you damaged — or did not","{theyHe} has dug a ditch that floods your yard"])}.`,
        choices: [
          {
            t: "Talk it out over the fence",
            check: {s:"diplomacy",s2:"int",d:45},
            win: {
              r: "You both say your piece, then laugh about the old reeve. Something mends.",
              fx: {them:{type:"friend",op:25}},
            },
            lose: {
              r: "The talk turns into a shouting match the whole street enjoys.",
              fx: {happy:-3,them:{type:"rival",op:-20}},
            },
          },
          {
            t: "Take it to the court",
            check: {s:"learning",s2:"diplomacy",d:50},
            win: {
              r: "The court finds for you, and {them} pays damages.",
              fx: {coin:8,honor:2,them:{type:"enemy",op:-30}},
            },
            lose: {
              r: "The court finds for {themHim}. You pay the costs.",
              fx: {coin:-10,happy:-4,them:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Settle it with fists",
            r: "You go next door with your sleeves rolled up.",
            fx: {
              them: {type:"enemy",op:-25},
              duel: {
                foe: "them",
                opts: {kind:"brawl",lethal:!1,toYield:!0,place:"the lane between your houses",title:"Neighbors"},
              },
            },
          },
          {t:"Let it go",r:"Life is short and neighbors are long.",fx:{wil:.5,them:{type:"acquaint",op:5}}},
        ],
      },
      {
        id: "wk_gen_property",
        cond: (p,C)=>C.adult(p)&&com(p)&&free(p)&&p.coin>=50,
        w: .8,
        title: "A chance to buy",
        setup: (p,ctx)=>{const opts=[];(guildJob(p)||J(p,"brewer")||p.status==="artisan")&&opts.push(["workshop",250,"a workshop with a shop on the street"]),(J(p,"fish")||A.C.coast(p)&&p.status==="peasant")&&opts.push(["fishboat",150,"a sound fishing boat with nets"]),(J(p,"merchant")||p.status==="merchant")&&opts.push(["townhouse",400,"a narrow town house with a counting room"]),opts.push(["cottage",60,"a cottage with a garden plot"]);const o=A.pick(opts);ctx.ak=o[0],ctx.price=o[1],ctx.what=o[2],ctx.cheap=Math.round(o[1]*.8)},
        text: "A widow is selling up after her husband's death: {what}. The fair price is {price} suns. She looks tired of haggling already.",
        choices: [
          {
            t: "Pay her fair price ({price} suns)",
            req: (p,C,ctx)=>p.coin>=(ctx.price||9999),
            r: "You shake hands before witnesses. It is yours.",
            fx: (p,ctx)=>!ctx.ak||p.coin<ctx.price?"The sale falls through.":(p.coin-=ctx.price,p.assets.push({k:ctx.ak,name:GD.PROPERTY[ctx.ak].name,y:A.S.year}),p.honor=A.clamp(p.honor+1,0,100),`(You own: ${GD.PROPERTY[ctx.ak].name}.)`),
          },
          {
            t: "Squeeze her down to {cheap}",
            req: (p,C,ctx)=>p.coin>=(ctx.cheap||9999),
            check: {s:"trade",s2:"diplomacy",d:50},
            win: {
              r: "She takes it, with a look you will remember.",
              fx: (p,ctx)=>!ctx.ak||p.coin<ctx.cheap?"The sale falls through.":(p.coin-=ctx.cheap,p.assets.push({k:ctx.ak,name:GD.PROPERTY[ctx.ak].name,y:A.S.year}),p.honor=A.clamp(p.honor-2,0,100),`(You own: ${GD.PROPERTY[ctx.ak].name}.)`),
            },
            lose: {r:"She sells it to a kinder buyer that afternoon.",fx:{happy:-3}},
          },
          {t:"Not now",r:"Property is a fine thing to own and a heavy thing to keep.",fx:{}},
        ],
      },
      {
        id: "wk_gen_parent",
        cond: (p,C)=>C.adult(p)&&C.parentsAlive(p)&&C.ageAdj(p)>=26&&!p.ruler,
        cool: 10,
        title: "Old hands",
        setup: (p,ctx)=>{const par=livingParent(p);ctx.par=par?par.given:"your mother",ctx.parId=par?par.id:""},
        text: "{par} can no longer work. The hands that fed you shake too much to hold a spindle or a hoe. Someone must give {par} a place by the fire and bread every day.",
        choices: [
          {
            t: "Take {par} into your home",
            r: "Another mouth, another voice by the fire. Some nights it is a comfort.",
            fx: (p,ctx)=>{const t=A.P(ctx.parId);return t&&A.addOp(p,t,20),p.coin=Math.max(0,p.coin-15),p.honor=A.clamp(p.honor+3,0,100),""},
          },
          {
            t: "Pay a neighbor woman to look in",
            r: "A few coppers a week buy porridge and a check at dusk.",
            fx: (p,ctx)=>{const t=A.P(ctx.parId);return t&&A.addOp(p,t,5),p.coin=Math.max(0,p.coin-8),""},
          },
          {
            t: "Leave it to your brothers and sisters",
            r: "You have your own troubles. {par} understands, or says so.",
            fx: (p,ctx)=>{const t=A.P(ctx.parId);return t&&A.addOp(p,t,-15),p.honor=A.clamp(p.honor-2,0,100),""},
          },
        ],
      },
      {
        id: "wk_gen_lost_job",
        cond: (p,C)=>C.adult(p)&&free(p)&&com(p)&&p.job&&!J(p,"clergy","pirate","thief","courtier","mercenary")&&p.job.perf<45,
        w: .8,
        title: "Let go",
        text: p=>`Trade is bad and your work has been worse. Your ${p.job.r>=2?"customers have drifted away":"master calls you in"}: as of the quarter-day, there is no more place for you as ${rankName(p)}.`,
        choices: [
          {
            t: "Beg for one more season",
            check: {s:"diplomacy",s2:"wil",d:50},
            win: {r:"One more season. You will not waste it.",fx:{perf:18,wil:1}},
            lose: {
              r: "The door closes.",
              fx: p=>(p.job=null,p.happy=A.clamp(p.happy-8,0,100),A.willGrow(p,1.5,"loss"),""),
            },
          },
          {
            t: "Take day labor at the gate",
            r: "A sun a day for your back. It is honest, and it is something.",
            fx: {job:"labor",happy:-4},
          },
          {
            t: "Go into service in a great house",
            r: "Fetch, carry, listen. A roof and food.",
            fx: {job:"servant",happy:-3},
          },
          {
            t: "Hire on as a farmhand",
            r: "Sixty suns a year with board, and dirt under your nails again.",
            fx: {job:"farm",happy:-2},
          },
        ],
      },
      {
        id: "wk_gen_old_friend",
        cond: (p,C)=>C.adult(p)&&!p.ruler&&!C.prison(p),
        title: "An old friend in trouble",
        setup: (p,ctx)=>{ctx.pid=firstFriend(p)||npc(p,"a friend from your youth"),ctx.trouble=A.pick(["owes 40 suns to a moneylender who breaks fingers","is wanted by the watch for a fight that ended badly","has lost everything at dice and has nowhere to sleep"])},
        text: "A knock after dark. It is {them}, your old friend, soaked and shaking. {theyHe} {trouble}.",
        choices: [
          {
            t: "Give {themHim} the money (40 suns)",
            req: p=>p.coin>=40,
            r: "{them} weeps on your shoulder and swears to repay you. Maybe {theyHe} will.",
            fx: {coin:-40,honor:3,them:{op:35}},
          },
          {
            t: "Hide {themHim} for a few days",
            check: {s:"stealth",s2:"intrigue",d:45},
            win: {
              r: "The watch, the lender, whoever it was, they pass by. {them} slips away when it is safe.",
              fx: {honor:2,them:{op:30}},
            },
            lose: {
              r: "They find {themHim} in your loft and fine you for sheltering {themHim}.",
              fx: {coin:-15,honor:-1,them:{op:15}},
            },
          },
          {
            t: "Turn {themHim} away",
            r: "You close the door. You hear {themHim} walk off in the rain.",
            fx: {them:{op:-40},happy:-4},
          },
        ],
      },
    ]);
  })();
})();
