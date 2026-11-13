// The release's event pack 18 of 30 (165 events, mostly cm_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-028). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const J = (p,...ks)=>!!(p.job&&ks.includes(p.job.c)),
      rk = p=>p.job?p.job.r:-1,
      inR = (p,...ids)=>ids.includes(p.realm),
      nm = (p,sex)=>{try{return A.givenName(p.cult,sex||(A.chance(.5)?"M":"F"))||"Tam"}catch{return"Tam"}},
      cap = p=>{const r=A.realm(p.realm);return r&&r.capital?r.capital:"the capital"},
      rs = p=>A.realmShort(p.realm),
      terr = p=>{const pr=A.prov(p.home);return pr?pr.terr:"plains"},
      war = p=>A.atWar(p.realm).length>0,
      com = p=>!p.ruler&&["slave","serf","peasant","artisan","merchant"].includes(p.status),
      free = p=>!p.flags.unfree,
      since = (p,f)=>p.flags[f]?A.S.year-p.flags[f]:-1,
      addDebt = (p,n)=>{p.debt=Math.max(0,Math.round((p.debt||0)+n))},
      who = (p,ctx,occ,kind)=>{const q=A.makeAcquaintance(p,kind||"acquaint");return occ&&(q.occ=occ),ctx.pid=q.id,ctx.They=A.cap(A.he(q)),ctx.Their=A.cap(A.his(q)),q},
      OPP = (careers,e)=>{const extra=e.cond,young=e.young;return delete e.young,e.trigger=!0,e.opp=careers,e.cond=(p,C)=>J(p,...careers)&&(young?C.ageAdj(p)>=10:C.adult(p))&&(!extra||extra(p,C)),e},
      plain = p=>!p.job&&!p.mil&&!p.ruler&&free(p),
      trader = p=>J(p,"merchant")||!p.job&&!p.mil&&p.status==="merchant"&&!p.ruler,
      dealer = p=>trader(p)||free(p)&&!p.mil&&!p.ruler&&A.skill(p,"trade")>=45,
      seaman = p=>J(p,"sailor")||plain(p)&&A.C.coast(p)&&A.skill(p,"sea")>=40,
      fisher = p=>J(p,"fish")||plain(p)&&A.C.coast(p)&&(["peasant","serf"].includes(p.status)||A.skill(p,"sea")>=40),
      corsair = p=>J(p,"pirate")||plain(p)&&p.realm==="POL-33",
      farmer = p=>J(p,"farm")||!p.job&&!p.mil&&["serf","peasant"].includes(p.status)&&!A.C.coast(p)&&["plains","forest","hills","marsh"].includes(terr(p)),
      herder = p=>J(p,"herd")||J(p,"farm")&&["hills","mountains","steppe","tundra"].includes(terr(p))||!p.job&&!p.mil&&p.status==="peasant"&&["steppe","tundra","mountains","hills"].includes(terr(p)),
      woodsman = p=>J(p,"hunter")||plain(p)&&com(p)&&A.skill(p,"survival")>=45&&["forest","hills","tundra","mountains","marsh"].includes(terr(p)),
      horseman = p=>J(p,"horsemaster")||J(p,"herd")&&(inR(p,"POL-11","POL-12","POL-34")||terr(p)==="steppe")||plain(p)&&A.skill(p,"husbandry")>=40&&A.skill(p,"riding")>=40,
      horseOwner = p=>horseman(p)||free(p)&&!p.mil&&!p.ruler&&A.C.mounted(p),
      pathfinder = p=>J(p,"explorer")||plain(p)&&com(p)&&A.skill(p,"tracking")>=45&&A.skill(p,"survival")>=45,
      manhunter = p=>J(p,"bounty")||plain(p)&&com(p)&&A.skill(p,"tracking")>=45&&A.skill(p,"intimidation")>=45,
      LORD = {
        "POL-08": "The jarl",
        "POL-11": "The clan-mother",
        "POL-34": "The clan-mother",
        "POL-12": "The tribe's chief",
        "POL-19": "The clan sheikh",
        "POL-18": "The nome lord",
        "POL-27": "The abbot's steward",
        "POL-13": "The valley council",
        "POL-17": "The Sultan's tax-farmer",
        "POL-24": "The Emir's tax-farmer",
        "POL-32": "The Sultan's tax-farmer",
        "POL-30": "The temple steward",
        "POL-20": "The governor",
        "POL-06": "The grove council",
        "POL-07": "The grove council",
        "POL-33": "The Captains' Table",
        "POL-04": "The council",
        "POL-16": "The council",
      },
      lordT = p=>LORD[p.realm]||"Your lord",
      lordt = p=>{const s=lordT(p);return s.charAt(0).toLowerCase()+s.slice(1)},
      ROUTE = {
        "POL-01": ["the Amber Road","amber, furs and iron for the south","Varenna"],
        "POL-02": ["the Sun Road","wine, oil and pilgrims' cloth","Ostra"],
        "POL-03": ["the Sun Road","grain, wine and oil","Solenne"],
        "POL-04": ["the Monuti grain road","Tamari wheat and flax","Tamar"],
        "POL-05": ["the coast roads","wool, hides and cheese","Varenna"],
        "POL-06": ["the forest-edge markets","honey, wax and herbs bartered for dwarf crowns","Ashmere"],
        "POL-07": ["the Strangers' Shelf at Silverbough","licensed timber and yew","Ashmere"],
        "POL-08": ["the Tin Road","tin, walrus ivory and whale oil","Kingsmere"],
        "POL-09": ["the Tin Road","tin bars","Wolfhaven"],
        "POL-10": ["the Iron Road","iron, steel tools and mail","Kingsmere"],
        "POL-11": ["the caravanserai roads","horses, sheep and felt","the Aldmark march"],
        "POL-12": ["the Horse Road","horses, felt and caviar","Morhaven"],
        "POL-13": ["the high passes","cattle, cheese and crossbows","Kingsmere"],
        "POL-14": ["the Grey Channel","wine, oil and cloth","Velgrad"],
        "POL-15": ["the Horse Road","steppe horses from the Santora fair","Greyhaven"],
        "POL-16": ["the Middle Sea lanes","murex purple and Isle of Vines wine","Lucerna"],
        "POL-17": ["the Gold Road","paper, cloth and copper","Zanara"],
        "POL-18": ["the Monuti grain road","wheat, flax and papyrus","Lucerna"],
        "POL-19": ["the Salt Road","salt slabs","Zanara"],
        "POL-20": ["the Gold Road","gold, ivory and hides","Qadira"],
        "POL-21": ["the Spice Sea","pepper, cardamom and pearls","Tessar"],
        "POL-22": ["the Salt Road","hides and ivory","Zanara"],
        "POL-23": ["the Tin Road","walrus ivory and seal oil","Wolfhaven"],
        "POL-24": ["the Gold Road","pearls and dates","Qadira"],
        "POL-25": ["the Fur Road","sable, marten and wax","Greyhaven"],
        "POL-26": ["the Silk Road","silver and amber","the Toll of Kraoth"],
        "POL-27": ["the Worldspine passes","yak wool, butter and salt","Stonehold"],
        "POL-28": ["the Worldspine passes","metalwork and gems","Ranpur"],
        "POL-29": ["the Worldspine passes","steel and gems","Ranpur"],
        "POL-30": ["the Nagora road","crucible steel, cotton and sugar","the Free Marches"],
        "POL-31": ["the Neck road","spice and cloth","Kesh"],
        "POL-32": ["the Spice Sea","cloves and nutmeg","Kesh"],
        "POL-33": ["the Western Approach","resold cargo and salt fish","Lucerna"],
        "POL-34": ["the Silk Road","silk, jade and horses","Velgrad"],
      },
      route = p=>{const r=ROUTE[p.realm]||["the Middle Sea lanes","wine, oil and cloth","Lucerna"];return{n:r[0],g:r[1],to:r[2]}},
      bank = p=>inR(p,"POL-28","POL-10","POL-29")||p.race==="dwarf"?"The Hold Bank of Stonehold":inR(p,"POL-17","POL-19","POL-24","POL-32")?"The Water Endowment of Qadira":inR(p,"POL-30")?"A temple bank of Ranpur":inR(p,"POL-20","POL-22","POL-21")?"One of the Gold Houses of Zanara":inR(p,"POL-04","POL-14","POL-33")?"House Doravelli of Lucerna":"House Lunetti of Ostra",
      PORT = {
        "POL-01": "Kingsmere",
        "POL-02": "Solenne",
        "POL-03": "Varenna",
        "POL-04": "Lucerna",
        "POL-07": "Silverbough",
        "POL-08": "Wolfhaven",
        "POL-14": "Greyhaven",
        "POL-15": "Felano",
        "POL-16": "Ostra",
        "POL-17": "Qadira",
        "POL-18": "Tamar",
        "POL-21": "Kesh",
        "POL-24": "Sabra",
        "POL-25": "Velgrad",
        "POL-30": "Ranpur",
        "POL-31": "Tessar",
        "POL-32": "Amberport",
        "POL-33": "Blackreef",
      },
      port = p=>PORT[p.realm]||(A.C.coast(p)?A.provName(p.home):"Lucerna"),
      FAR = ["Amberport","Kesh","Tamar","Wolfhaven","Qadira","Sabra","Lucerna","Ostra","Greyhaven","Felano"],
      farPort = p=>A.pick(FAR.filter(x=>x!==port(p))),
      SHIPS = {
        sun: [
          "the Lagoon Star",
          "the Sun's Daughter",
          "the Golden Fig",
          "the Lady of Felano",
          "the Bright Morning",
          "the Doravelli Rose",
        ],
        north: [
          "the Sea-Wolf",
          "the Grey Goose",
          "the Tin Maiden",
          "the Cold Bay Lass",
          "the Tidewell Gift",
          "the Northern Star",
        ],
        well: ["the Mercy of the Well","the Pearl of Sabra","the White Dove","the Gift of Water"],
        spice: ["the Clove Wind","the Pepper Queen","the Golden Gecko","the Monsoon Bride"],
        reef: ["the Lucky Dice","the Redsail Wench","the Drowned Queen's Kiss","the Black Gull"],
      },
      ship = p=>A.pick(inR(p,"POL-33")?SHIPS.reef:inR(p,"POL-17","POL-24","POL-19")?SHIPS.well:inR(p,"POL-21","POL-32","POL-30","POL-20","POL-22")?SHIPS.spice:inR(p,"POL-01","POL-08","POL-09","POL-14","POL-23","POL-25","POL-26","POL-13","POL-05")?SHIPS.north:SHIPS.sun),
      BN = {
        "CRE-03": ["a Sunwall wyvern","the wyvern"],
        "CRE-05": ["an amber wyrm","the wyrm"],
        "CRE-21": ["a great grey wolf","the wolf"],
        "CRE-23": ["a hell boar","the boar"],
        "CRE-25": ["a cave bear","the bear"],
        "CRE-31": ["a snow ape","the ape"],
        "CRE-34": ["a woolly rhino","the rhino"],
        "CRE-35": ["a cave hyena","the hyena"],
        "CRE-38": ["a basilisk","the basilisk"],
        "CRE-44": ["a great crocodile","the crocodile"],
        "CRE-45": ["a river horse","the river horse"],
        "CRE-47": ["a green anaconda","the snake"],
        "CRE-49": ["a tiger","the tiger"],
        "CRE-56": ["a Hael hound","the hound"],
      },
      killer = p=>{let n=[];try{n=A.beastsNear(p).filter(id=>BN[id]&&A.BEASTS[id])}catch{n=[]}if(n.length)return A.pick(n);const t=terr(p);return t==="mountains"?"CRE-25":t==="steppe"?"CRE-35":t==="desert"?"CRE-38":t==="marsh"?"CRE-44":t==="forest"?"CRE-23":"CRE-21"},
      setBeast = (ctx,id)=>{const b=BN[id]||["a beast","the beast"];ctx.beast=id,ctx.aBeast=b[0],ctx.theBeast=b[1];const c=LORE.creatures.find(x=>x.id===id);return ctx.lore=c&&c.belief?String(c.belief).replace(/[.\s]+$/,""):"nobody agrees what it is",id},
      WILDS = {
        marches: ["the Free Marches","forest plateau in twenty-three pieces that nine realms claim and none hold"],
        frostfells: ["the Frostfells","tundra, ice caps and fjords where only Miransk stays open all year"],
        whale: [
          "the Whale Woods",
          "good oak country that giants, orcs and Eastfolk all forbid each other to plough",
        ],
        wastes: [
          "the High Wastes",
          "cold high steppe and the Worldspine passes, where the air itself sickens lowlanders",
        ],
        amber: ["the Amber Wilds","cloud forest held by the Cloudfolk against every sultan"],
        bone: ["the Bone Coast","a fog-bound shore of wrecks and fishing camps with no water at all"],
        burning: ["the Burning Waste","salt pans, lava fields and wells that turn salty in a season"],
        green: ["the Deep Green","rainforest that kills outsiders with fever"],
        western: ["the Western Highlands","wet fells under Mount Brand, where the clans pay tax to nobody"],
        ash: ["the Ashlands","good ash soil that every faith in the west calls cursed"],
        pinewild: ["the Pinewild","endless taiga and bog where trappers winter and nobody rules"],
        thorn: ["the Thornveld","thorn scrub on the army road south of the Neck"],
      },
      WILD_OF = {
        "POL-31": "marches",
        "POL-14": "marches",
        "POL-28": "wastes",
        "POL-29": "wastes",
        "POL-27": "wastes",
        "POL-30": "wastes",
        "POL-25": "frostfells",
        "POL-23": "frostfells",
        "POL-26": "whale",
        "POL-34": "whale",
        "POL-32": "amber",
        "POL-17": "bone",
        "POL-24": "bone",
        "POL-19": "bone",
        "POL-18": "burning",
        "POL-20": "burning",
        "POL-22": "green",
        "POL-21": "green",
        "POL-05": "western",
        "POL-06": "western",
        "POL-07": "western",
        "POL-03": "ash",
        "POL-01": "pinewild",
        "POL-08": "pinewild",
        "POL-10": "pinewild",
        "POL-11": "pinewild",
        "POL-12": "pinewild",
        "POL-09": "frostfells",
        "POL-15": "marches",
        "POL-16": "burning",
        "POL-13": "pinewild",
      },
      wild = p=>WILDS[WILD_OF[p.realm]||"marches"],
      fair = p=>inR(p,"POL-15")?"The Horse Fair at Santora":inR(p,"POL-12")?"The channel-shore horse fair":inR(p,"POL-21")?"Market day at the Pepper Hall":inR(p,"POL-17","POL-24","POL-19")?"The caravan market":`May Fair at ${A.provName(p.home)}`;
    A.defEvents([
      OPP(["merchant"], {
        id: "cm_merchant_fair_pitch",
        young: !0,
        maxRank: 1,
        w: 1.3,
        cool: 3,
        title: "A pitch at the fair",
        setup: (p,ctx)=>{ctx.fair=fair(p),ctx.trinket=A.pick(["bone combs","tin sun-badges","cheap Qadiri paper","horn spoons","ribbons dyed almost purple"])},
        text: "{fair}. The fair-warden wants 2 suns for a pitch by the gate, where every buyer passes. Behind the tannery the pitches are free, and nobody goes there. Your pack holds needles, salt, thread and {trinket}.",
        choices: [
          {
            t: "Pay for the gate pitch (2 suns)",
            req: p=>p.coin>=2,
            check: {s:"trade",s2:"persuasion",d:35},
            win: {
              r: "By noon the {trinket} are gone and the salt is going. You clear 10 suns over the pitch.",
              fx: {coin:10,rep:3,skill:{trade:2}},
            },
            lose: {
              r: "A rival pedlar spreads his cloth beside yours and sells a penny cheaper. You barely cover the pitch.",
              fx: {coin:-1,rep:1,wil:.3},
            },
          },
          {
            t: "Take the free pitch and shout louder",
            check: {s:"persuasion",s2:"sta",d:40},
            win: {
              r: "You sing the prices like a ballad. People come round the tannery just to hear you, and they buy.",
              fx: {coin:6,rep:2,skill:{persuasion:2}},
            },
            lose: {
              r: "Nobody comes past the tannery. By dusk your voice is gone and your pack is as full as it was.",
              fx: {happy:-2,wil:.3},
            },
          },
          {
            t: "Walk the crowd with the pack on your back",
            check: {s:"spd",s2:"persuasion",d:38},
            win: {
              r: "You go where the buyers are instead of waiting for them. 8 suns, and no pitch to pay.",
              fx: {coin:8,rep:1,sta:.3},
            },
            lose: {r:"The warden catches you selling without a pitch and fines you 3 suns.",fx:{coin:-3}},
          },
          {
            t: "Buy out a desperate stallholder at noon",
            req: (p,C)=>C.prof(p,"trade",40)&&p.coin>=10,
            r: "A widow who must catch a cart home sells you her whole table for 10 suns. You sell it on by dusk for 25.",
            fx: {coin:15,rep:3,skill:{trade:2}},
          },
        ],
      }),
      OPP(["merchant"], {
        id: "cm_merchant_hill_round",
        young: !0,
        maxRank: 1,
        cool: 4,
        title: "The hill round",
        setup: (p,ctx)=>{ctx.path=A.pick(["washed out in two places","haunted, the carters say","watched by men who are not shepherds"])},
        text: "The hill villages above {home} see a pedlar twice a year, if that. They pay in eggs, wool and copper, and they remember who came in the bad months. The path up is {path}.",
        choices: [
          {
            t: "Go the long round, all twelve villages",
            check: {s:"survival",s2:"sta",d:40},
            win: {
              r: "Three weeks of mud and dogs. You come down with an empty pack, a fat purse and a widow's promise to buy from nobody else.",
              fx: {coin:14,rep:4,newRel:{type:"friend",op:20}},
            },
            lose: {
              r: "You turn an ankle on the second day and limp home with half your stock unsold.",
              fx: {coin:3,health:-6,cause:"a fall on the hill path",wil:.5},
            },
          },
          {t:"Do the three near villages only",r:"Safe, quick and thin: 5 suns.",fx:{coin:5,rep:1}},
          {
            t: "Take the short way through the gorge",
            check: {s:"ins",s2:"spd",d:45},
            win: {r:"You save a week and sell to the high farms before anyone else has been.",fx:{coin:12,rep:3}},
            lose: {
              r: "A man steps out of the rocks with a cudgel and wants your pack.",
              fx: {
                coin: -4,
                duel: {
                  tier: 1,
                  title: "a hill robber",
                  troop: "SL",
                  opts: {kind:"brawl",place:"the gorge path",lethal:!1,toYield:!0,title:"The gorge path"},
                },
              },
            },
          },
          {
            t: "Give the poorest village credit till spring",
            r: "You notch their debts on a tally stick. In spring they pay, every one, and buy twice as much.",
            fx: {coin:8,rep:3,honor:2},
          },
        ],
      }),
      OPP(["merchant"], {
        id: "cm_merchant_relics",
        young: !0,
        maxRank: 1,
        cool: 5,
        title: "Pilgrim trinkets",
        setup: (p,ctx)=>{ctx.shrine=p.faith==="REL-01"?"Solenne":p.faith==="REL-07"?"the Well of Samar":p.faith==="REL-17"?"the graves of the Marchland Saints":p.faith==="REL-06"?"the Bluespire circuit":`the holy places of ${cap(p)}`},
        text: 'Pilgrims crowd the road to {shrine}. A man with a cart sells you a crate of brass pilgrim badges at a penny each, then opens a second crate: chips of bone and splinters of old wood, "from the holy dead", 2 suns the lot.',
        choices: [
          {
            t: "Sell the badges and leave the bones",
            r: "Honest work. The badges go fast at three pence each. 6 suns.",
            fx: {coin:6,rep:2},
          },
          {
            t: "Buy the bones and sell them as relics",
            check: {s:"deception",s2:"persuasion",d:45},
            win: {
              r: "A weeping widow pays a sun for a finger-bone. By the end of the week you are 25 suns richer and feel it in your stomach.",
              fx: {coin:25,honor:-3,piety:-3,skill:{deception:2}},
            },
            lose: {
              r: "A priest asks, loudly, which saint had three left shinbones. You run, and leave the crate.",
              fx: {coin:-2,honor:-5,happy:-3},
            },
          },
          {
            t: "Warn the pilgrims that the bones are pig",
            r: "They do not believe you. A few buy badges out of pity.",
            fx: {coin:2,honor:2,piety:2},
          },
        ],
      }),
      OPP(["merchant"], {
        id: "cm_merchant_venture",
        minRank: 1,
        maxRank: 2,
        time: 2,
        cool: 3,
        title: "A venture on the road",
        setup: (p,ctx)=>{const R=route(p);ctx.route=R.n,ctx.goods=R.g,ctx.dest=R.to},
        text: "A cargo is for sale on {route}: {goods}, bound for {dest}. Buy it all for 120 suns and it might sell there for twice that. Might.",
        choices: [
          {
            t: "Buy it and travel with it yourself",
            req: p=>p.coin>=120,
            check: {s:"trade",s2:"survival",d:50},
            win: {
              r: "Weeks on {route}, a broken axle, a toll-keeper bribed with a ham. In {dest} you sell for 260.",
              fx: {coin:140,rep:6,skill:{trade:4,survival:2}},
            },
            lose: {
              r: "Bandits, a dead well or a falling price: on {route} it is always one of the three. You sell for 70.",
              fx: {coin:-50,rep:-1,wil:1},
            },
          },
          {
            t: "Buy it and send a factor with it",
            req: p=>p.coin>=120,
            check: {s:"trade",s2:"ins",d:55},
            win: {
              r: "Your factor sells well and brings home every penny. You clear 100 suns without leaving your chair.",
              fx: {coin:100,rep:4},
            },
            lose: {
              r: "Your factor sells well and comes home with a sad story instead of your money.",
              fx: {coin:-120,wil:1,newRel:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Take a quarter share with a bigger house (30 suns)",
            req: p=>p.coin>=30,
            r: "A quarter of the risk and a quarter of the gain. The cargo arrives; your share clears 30.",
            fx: {coin:30,rep:2},
          },
          {
            t: "Let it go",
            r: "Somebody else buys it. You never learn how it went, and you try not to ask.",
            fx: {},
          },
        ],
      }),
      OPP(["merchant"], {
        id: "cm_merchant_partnership",
        minRank: 1,
        maxRank: 3,
        cool: 4,
        title: "A sea-partnership",
        setup: (p,ctx)=>{who(p,ctx,"a young captain without a ship"),ctx.dest=farPort(p),ctx.law=inR(p,"POL-04")?"Under Lucerna's sea-partnership law of 726":"Under the sea-partnership law that every Middle Sea port copied from Lucerna"},
        text: "{law}, one partner puts in the money and the other makes the voyage; the money takes three parts of the profit and the voyage one. {them}, a young captain with good hands and no ship, wants your money for a run to {dest}.",
        choices: [
          {
            t: "Put in 80 suns and shake hands",
            req: p=>p.coin>=80,
            check: {s:"trade",s2:"ins",d:45},
            win: {
              r: "{them} comes home brown and grinning, with your 80 and 90 more. {They} wants to go again next year.",
              fx: {coin:90,rep:5,them:{type:"friend",op:30}},
            },
            lose: {
              r: "The ship comes home. The cargo comes home wet and is sold for nothing. {them} weeps and swears to make it good.",
              fx: {coin:-60,wil:.5,them:{type:"friend",op:10}},
            },
          },
          {
            t: "Make the voyage with {themHim} yourself",
            check: {s:"sea",s2:"trade",d:50},
            win: {
              r: "You haggle in {dest} while {them} handles the ship. Two good partners, one good profit.",
              fx: {coin:45,rep:4,skill:{sea:3,trade:3},them:{type:"friend",op:25}},
            },
            lose: {
              r: "Fever in {dest}. You spend the profit on a physician and come home thin.",
              fx: {coin:5,health:-8,cause:"a fever in a far port"},
            },
          },
          {
            t: "Ask around the quay about {themHim} first",
            check: {s:"intrigue",s2:"int",d:40},
            win: {
              r: "Two old sailors vouch for {themHim}; one tavern-keeper does not. You put in half. It pays.",
              fx: {coin:40,rep:3,them:{type:"friend",op:15}},
            },
            lose: {r:"You learn nothing, and {them} hears you were asking.",fx:{them:{type:"rival",op:-10}}},
          },
          {t:"Say no",r:"{them} finds another partner by evening.",fx:{}},
        ],
      }),
      OPP(["merchant"], {
        id: "cm_merchant_caravan_toll",
        minRank: 1,
        maxRank: 3,
        cool: 4,
        title: "The toll of the road",
        setup: (p,ctx)=>{ctx.toll=inR(p,"POL-26","POL-34","POL-25")?"The Tusk Clans take the Toll of Kraoth, one part in ten since 1103, and robbing a paying caravan is death among them":inR(p,"POL-19","POL-20","POL-24","POL-17","POL-22")?"The Brotherhood of Guides wants 2 suns a camel to cross the Red Waste, and swears the guide to you by water":inR(p,"POL-28","POL-29","POL-27","POL-30")?"Stonehold takes one part in ten at the Zardeep Pass, weighed on dwarven scales that never lie":inR(p,"POL-31")?"Both claimants tax the Neck road, and the road stations charge what they like":inR(p,"POL-12","POL-15","POL-11")?"Morhaven takes a toll on every horse and camel on the Horse Road":"Every lord with a bridge wants a penny a cart for each ten kilometres",ctx.route=route(p).n},
        text: "Your carts are on {route}. {toll}. Paid honestly, the road eats a tenth of your profit. There is a side track the toll-takers do not watch, the carters say.",
        choices: [
          {t:"Pay the toll in full",r:"Your goods arrive. So does the profit, smaller.",fx:{coin:20,rep:2}},
          {
            t: "Take the side track",
            check: {s:"survival",s2:"stealth",d:50},
            win: {
              r: "Two days of goat paths and dry camps. You arrive untaxed and 40 suns the better.",
              fx: {coin:40,skill:{survival:2}},
            },
            lose: {
              r: "The toll riders find you in a dry gully. They take the toll, a fine for the insult and your best mule.",
              fx: {coin:-40,health:-6,cause:"a toll rider's whip",rep:-2},
            },
          },
          {
            t: "Hire an orc sellsword for the road (40 suns a month)",
            req: p=>p.coin>=40,
            r: "Nobody troubles a caravan with an orc on the lead mule. Nearly nobody.",
            fx: {
              coin: -10,
              duel: {
                tier: 2,
                title: "a road bandit",
                troop: "LI",
                opts: {kind:"duel",place:"the caravan road",lethal:!1,toYield:!0,title:"Bandits on the road"},
              },
            },
          },
          {
            t: "Bargain with the toll-master",
            check: {s:"trade",s2:"diplomacy",d:50},
            win: {
              r: "A cup of wine, a bolt of cloth for his wife, and he counts your carts very badly.",
              fx: {coin:35,newRel:{type:"friend",op:20}},
            },
            lose: {r:"He counts very well. You pay in full, and he remembers your face.",fx:{coin:10}},
          },
        ],
      }),
      OPP(["merchant"], {
        id: "cm_merchant_bank_loan",
        minRank: 2,
        maxRank: 3,
        cool: 4,
        title: "The bank's terms",
        setup: (p,ctx)=>{ctx.bank=bank(p),ctx.goods=A.pick(["a whole season's wool clip from three valleys","two hundred bales of Ranpuri cotton","the year's alum off the Ostra docks","every sable pelt of the Velgrad winter fair","a thousand jars of Isle of Vines wine","a shipload of Tamari flax"])},
        text: "{bank} will lend you 1,000 suns to buy {goods}, at a twelfth a year with your warehouse as the pledge. The clerk has already written your name in the margin. He only needs your seal.",
        choices: [
          {
            t: "Borrow the thousand and buy it all",
            check: {s:"trade",s2:"int",d:55},
            win: {
              r: "The price climbs all summer. You repay the bank by Harvest Home and keep 600 suns. The clerk bows lower now.",
              fx: {coin:600,rep:8,fame:1,skill:{trade:3}},
            },
            lose: {
              r: "The price falls the week you buy. You sell at a loss and still owe the bank 800 suns.",
              fx: p=>(addDebt(p,800),A.addRep(p,-4),A.willGrow(p,1.5,"debt"),"(You owe 800 suns.)"),
            },
          },
          {
            t: "Borrow half and buy half",
            check: {s:"trade",s2:"stewardship",d:45},
            win: {r:"Half the risk, most of the profit. 220 suns clear.",fx:{coin:220,rep:4}},
            lose: {r:"A middling year. You lose 80 suns and some sleep.",fx:{coin:-80}},
          },
          {
            t: "Pay in coin, not credit (400 suns)",
            req: p=>p.coin>=400,
            r: "You buy what you can pay for outright. No bank sleeps in your house. You clear 160.",
            fx: {coin:160,rep:3},
          },
          {t:"Refuse. Debt is a chain",r:"The clerk scratches out your name. Somebody else's goes in.",fx:{}},
        ],
      }),
      OPP(["merchant"], {
        id: "cm_merchant_corner",
        minRank: 2,
        minRep: 45,
        time: 2,
        cool: 6,
        title: "Cornering the market",
        setup: (p,ctx)=>{ctx.thing=inR(p,"POL-16","POL-03")?"alum for the dye-vats":inR(p,"POL-21","POL-32")?"pepper":inR(p,"POL-01","POL-08")?"amber":inR(p,"POL-19","POL-20","POL-22")?"salt":inR(p,"POL-25","POL-26")?"beeswax":inR(p,"POL-04","POL-18")?"seed wheat":inR(p,"POL-17","POL-24")?"rag paper":"salt",ctx.where=cap(p)},
        text: "For one month this spring, nobody in {where} will have {thing} but whoever buys it first. The ships are late, the carts are few, and you have a list of every seller. Buy it all, and you set the price until the ships come.",
        choices: [
          {
            t: "Buy every last measure",
            req: p=>p.coin>=300,
            check: {s:"trade",s2:"intrigue",d:60},
            win: {
              r: "For a month the whole town pays your price. You clear 700 suns, and the buyers curse your name in the street.",
              fx: {coin:700,rep:10,fame:2,honor:-4,newRel:{type:"enemy",op:-40}},
            },
            lose: {
              r: "The ships come in a week early. You are left holding a warehouse of {thing} at a price nobody will pay.",
              fx: {coin:-250,rep:-6,wil:1.5},
            },
          },
          {
            t: "Buy half, and sell at a fair price",
            req: p=>p.coin>=150,
            r: "You sell steady and fair while the others gouge. {where} remembers who did not.",
            fx: {coin:120,rep:6,honor:3},
          },
          {
            t: "Warn the guild that a rival is trying it",
            check: {s:"intrigue",s2:"diplomacy",d:45},
            win: {
              r: "The guild breaks the corner before it closes. Every member owes you a drink and a favour.",
              fx: {rep:5,newRel:{type:"friend",op:25}},
            },
            lose: {r:"Nobody believes you until it is too late.",fx:{rep:-1}},
          },
          {t:"Stay out of it",r:"Corners break men as often as they make them.",fx:{}},
        ],
      }),
      OPP(["merchant"], {
        id: "cm_merchant_rival_house",
        minRank: 2,
        maxRank: 4,
        cool: 8,
        title: "A rival house",
        setup: (p,ctx)=>{who(p,ctx,"a rival merchant")},
        text: "{themFull} has opened a house across the square from yours. {They} undercuts you by a tenth on everything, pays your best carter double to leave you, and smiles at you in the temple. {They} can afford a year of this. Can you?",
        choices: [
          {
            t: "Match every price and outlast {themHim}",
            check: {s:"trade",s2:"wil",d:55},
            win: {
              r: "{They} breaks first. By winter the shutters are up across the square.",
              fx: {coin:-60,rep:10,wil:1,flag:"cm_rival",them:{type:"rival",op:-30}},
            },
            lose: {
              r: "You bleed silver all year. {They} is still smiling.",
              fx: {coin:-150,rep:-5,flag:"cm_rival",them:{type:"rival",op:-20}},
            },
          },
          {
            t: "Buy up {theirHis} debts from the bank",
            req: p=>p.coin>=200,
            check: {s:"intrigue",s2:"trade",d:55},
            win: {
              r: "You own {theirHis} paper now. One letter and {theyHe} sleeps in the Debtors' Tower. {They} comes to terms, on yours.",
              fx: {coin:50,rep:8,flag:"cm_rival",them:{type:"enemy",op:-50}},
            },
            lose: {
              r: "The bank sells you the paper and tells {themHim} who bought it.",
              fx: {coin:-200,flag:"cm_rival",them:{type:"enemy",op:-40}},
            },
          },
          {
            t: "Propose a marriage between your houses",
            check: {s:"diplomacy",s2:"etiquette",d:50},
            win: {
              r: "A niece, a nephew, a contract and a feast. The two houses face the rest of the market as one.",
              fx: {coin:40,rep:6,them:{type:"friend",op:40}},
            },
            lose: {
              r: "{They} laughs in your face at the guild dinner.",
              fx: {happy:-3,flag:"cm_rival",them:{type:"rival",op:-20}},
            },
          },
          {
            t: "Move into a trade {theyHe} cannot follow",
            check: {s:"trade",s2:"int",d:50},
            win: {
              r: "You leave {themHim} the cloth and take up something stranger. By spring you are the only buyer in town for it.",
              fx: {coin:60,rep:4,skill:{trade:3}},
            },
            lose: {r:"The new trade is new for a reason. You lose 40 suns learning it.",fx:{coin:-40,skill:{trade:2}}},
          },
        ],
      }),
      OPP(["merchant"], {
        id: "cm_merchant_famine_grain",
        minRank: 2,
        minRep: 40,
        cool: 8,
        title: "Bread at any price",
        text: p=>`The Flood Stair at Tamar read low this year. ${inR(p,"POL-18")?"The flood-priests are rationing the temple granaries":"The grain ships come home half empty"}, and wheat has gone from 3 suns a bushel to 9 in ${cap(p)}. You hold grain. The bakers are at your door, and so is a mob.`,
        choices: [
          {
            t: "Sell to the highest bidder",
            r: "The rich buy. The poor watch. You make 400 suns and lose the street.",
            fx: {coin:400,rep:4,honor:-5,wil:.5},
          },
          {
            t: "Sell at last year's price to the town",
            r: "You make 60 suns and a name. The council thanks you in public, and the bakers bless you in private.",
            fx: {coin:60,rep:8,honor:5,fame:3,favor:5},
          },
          {
            t: "Send ships to Tamar for more",
            check: {s:"trade",s2:"logistics",d:55},
            win: {
              r: "Your cogs come home low in the water. You feed the town and still clear 500.",
              fx: {coin:500,rep:8,fame:2},
            },
            lose: {
              r: "Tamar has nothing to sell either. The voyage costs you 200 suns for empty holds.",
              fx: {coin:-200,wil:1},
            },
          },
          {
            t: "Give bread at the temple door (100 suns)",
            req: p=>p.coin>=100,
            r: "A month of loaves, handed out by your own servants. Nobody in the poor quarter forgets it.",
            fx: {coin:-100,piety:4,honor:6,fame:2,rep:3},
          },
        ],
      }),
      OPP(["merchant"], {
        id: "cm_merchant_seedlings",
        minRank: 2,
        maxRank: 4,
        cool: 10,
        title: "Seedlings",
        text: "A Keshi boatman opens a wet sack in a back room: forty clove seedlings, smuggled off the Amber Isles, where carrying one off means death. Planted in the right soil, they would break the sultan's hold on cloves at 60 suns a kilogram. He wants 300 suns.",
        choices: [
          {
            t: "Buy them and find hot, wet soil to plant them",
            req: p=>p.coin>=300,
            check: {s:"husbandry",s2:"intrigue",d:65},
            win: {
              r: "Twelve of them live, in a walled garden nobody visits. In five years they will bear, if nobody talks.",
              fx: {coin:-300,rep:4,flag:"cm_cloves",skill:{husbandry:3}},
            },
            lose: {r:"They rot in the sack within a week. 300 suns of dead sticks.",fx:{coin:-300,wil:1}},
          },
          {
            t: "Buy them and sell them on to the Pepper Hall of Kesh",
            req: p=>p.coin>=300,
            check: {s:"trade",s2:"intrigue",d:55},
            win: {
              r: "The Pepper Hall pays double and asks no questions it wants answered.",
              fx: {coin:300,rep:4,honor:-2},
            },
            lose: {r:"The Pepper Hall's man is the sultan's man too.",fx:{coin:-300,punish:"smuggling"}},
          },
          {
            t: "Turn the boatman in to the sultan's agent",
            r: "The agent pays you 50 suns and takes the boatman away. You do not watch them go.",
            fx: {coin:50,honor:-3},
          },
          {t:"Close the sack and walk away",r:"Some fortunes come with a rope attached.",fx:{}},
        ],
      }),
      OPP(["merchant"], {
        id: "cm_merchant_council_seat",
        minRank: 3,
        minRep: 55,
        time: 2,
        cool: 10,
        cond: (p,C)=>!C.flag(p,"cm_council"),
        title: "A seat on the council",
        setup: (p,ctx)=>{ctx.council=inR(p,"POL-04")?"The Great Council of Lucerna":inR(p,"POL-16")?"The council of the Free City":inR(p,"POL-21")?"The merchant council of Kesh":inR(p,"POL-13")?"Your valley council":`The town council of ${cap(p)}`},
        text: "{council} has an empty seat. Nobody buys a seat, of course. But the men who vote like gifts: a horse here, a dowry there, a loan quietly forgotten. All told, about 2,000 suns.",
        choices: [
          {
            t: "Pay for the gifts (2,000 suns)",
            req: p=>p.coin>=2e3,
            r: "You sit at the long table in a fur-trimmed gown. Doors open that you did not know were there.",
            fx: {coin:-2e3,rep:12,fame:5,favor:5,flag:"cm_council",deed:"Took a seat on the council"},
          },
          {
            t: "Win the votes with favours, not coin",
            check: {s:"diplomacy",s2:"intrigue",d:65},
            win: {
              r: "Debts called in, promises made, one old man flattered into tears. You win by two votes.",
              fx: {coin:-300,rep:14,fame:5,flag:"cm_council",deed:"Took a seat on the council"},
            },
            lose: {
              r: "You lose by one vote, bought by somebody richer.",
              fx: {coin:-300,rep:-4,newRel:{type:"rival",op:-30}},
            },
          },
          {
            t: "Back another man, and be owed",
            r: "He wins. He owes you. Councillors pay their debts in contracts.",
            fx: {coin:150,rep:4,newRel:{type:"friend",op:30}},
          },
          {t:"You have no time for councils",r:"You go back to your ledgers. They at least add up.",fx:{}},
        ],
      }),
      OPP(["merchant"], {
        id: "cm_merchant_crown_loan",
        minRank: 4,
        minRep: 55,
        cool: 6,
        title: "The crown wants money",
        text: p=>`{ruler} needs 5,000 suns before May Fair${war(p)?" to pay the army":", for a wedding, a war or a palace; the messenger will not say which"}. Crowns borrow easily and repay slowly. The Tessarian crown's debts to Ostra are a century old.`,
        choices: [
          {
            t: "Lend it, on the crown's bond",
            check: {s:"trade",s2:"diplomacy",d:50},
            win: {
              r: "The crown pays its interest in toll rights instead of coin. In five years you have earned 1,200 suns and a place at the {rulerTitle}'s table.",
              fx: {coin:1200,favor:10,rep:8,fame:3},
            },
            lose: {
              r: "The crown pays the first year's interest and then stops. Your bond is worth its wax.",
              fx: {coin:-2500,favor:5,wil:1.5},
            },
          },
          {
            t: "Lend against the bridge tolls of {town} for ten years",
            check: {s:"stewardship",s2:"trade",d:55},
            win: {
              r: "Your own men sit at the toll-house. The pennies become a river.",
              fx: {coin:1800,rep:10,favor:6,skill:{stewardship:3}},
            },
            lose: {
              r: "The tolls were already pledged to someone else. You get a third of what you were promised.",
              fx: {coin:300,favor:3},
            },
          },
          {
            t: "Refuse, with great courtesy",
            check: {s:"etiquette",s2:"diplomacy",d:50},
            win: {r:"The messenger leaves smiling. Somehow, so does the {rulerTitle}.",fx:{rep:2}},
            lose: {r:"The {rulerTitle} remembers who said no.",fx:{favor:-15}},
          },
          {
            t: "Lend to the crown's enemies instead, quietly",
            check: {s:"intrigue",s2:"deception",d:65},
            win: {
              r: "Gold goes out through three cousins and a monastery. It comes back with interest, and nobody learns the road.",
              fx: {coin:1500,rep:6,honor:-6},
            },
            lose: {
              r: "The letters are found. The {rulerTitle} does not hang bankers, but he stops paying them.",
              fx: {coin:-800,favor:-30,honor:-5},
            },
          },
        ],
      }),
      OPP(["merchant","sailor","pirate"], {
        id: "cm_sea_fire_oil",
        minRank: 1,
        cool: 10,
        title: "Sealed jars",
        setup: (p,ctx)=>{who(p,ctx,"a dealer in jars","acquaint")},
        text: "{them} wants forty jars carried from Sabra, sealed, unopened, no questions: Sabran fire-oil. Outside Sabra and the Nine Winds it is a hanging cargo. A jar sells for 200 suns on the black market, and {them} pays a carrier a tenth of that.",
        choices: [
          {
            t: "Carry them",
            check: {s:"stealth",s2:"sea",d:55},
            win: {
              r: "Forty jars under forty sacks of dates. Nobody looks under dates. You are 800 suns richer and you sleep badly.",
              fx: {coin:800,honor:-4,rep:3,them:{type:"friend",op:20}},
            },
            lose: {
              r: "A customs officer smells the pitch on the seals.",
              fx: {punish:"smuggling",them:{type:"enemy",op:-20}},
            },
          },
          {
            t: "Carry them and keep one jar back for yourself",
            check: {s:"intrigue",s2:"deception",d:60},
            win: {
              r: "Thirty-nine jars arrive. The fortieth sits under your floor, worth 200 suns to anyone, and worth a war to some.",
              fx: {coin:1e3,honor:-6},
            },
            lose: {
              r: "{them} counts the jars. Then {theyHe} counts you among {theirHis} enemies.",
              fx: {coin:300,them:{type:"enemy",op:-60},newRel:{type:"enemy",op:-40}},
            },
          },
          {
            t: "Inform the harbor-master",
            r: "The harbor-master pays 40 suns and smiles a strange smile. You wonder whose jars they really were.",
            fx: {coin:40,honor:2,them:{type:"enemy",op:-50}},
          },
          {t:"Refuse",r:"{them} shrugs and goes looking for a hungrier ship.",fx:{}},
        ],
      }),
    ]);
    A.defEvents([
      {
        id: "cm_merchant_ship_lost",
        cond: (p,C)=>C.adult(p)&&(trader(p)&&(rk(p)>=2||p.coin>=300)||C.rich(p)&&!p.ruler&&!p.mil&&C.coast(p)&&C.prof(p,"trade",40)),
        w: .8,
        cool: 8,
        title: "Lost with all hands",
        setup: (p,ctx)=>{ctx.ship=ship(p),ctx.where=inR(p,"POL-14","POL-25","POL-08","POL-01")?"in the Grey Channel tide-race":inR(p,"POL-32","POL-21")?"on the reefs of the Isle of Pearls":inR(p,"POL-17","POL-24","POL-19")?"in a Bone Coast fog":"off the Strait of Hael, where Old Ironjaw hunts"},
        text: "A spar comes ashore with the name {ship} cut into it. She went down {where}, with your cargo and nineteen men. Their widows are already at your door.",
        choices: [
          {
            t: "Pay each widow a sailor's wage for a year (180 suns)",
            req: p=>p.coin>=180,
            r: "It costs you dearly, on top of the cargo. The quay remembers it; good crews ask to sail for you.",
            fx: {coin:-330,rep:8,honor:6,wil:1},
          },
          {
            t: "Claim on the underwriters at Lucerna",
            check: {s:"learning",s2:"trade",d:50},
            win: {
              r: "For once you paid the eight in a hundred. The underwriters pay, slowly and with complaints.",
              fx: {coin:150,rep:2},
            },
            lose: {
              r: "The underwriters find a clause: she sank east of the line you insured. You lose it all.",
              fx: {coin:-200,wil:1.5},
            },
          },
          {
            t: "Bear the loss and say nothing",
            r: "You shut the door on the widows. You lose the cargo, and the quay's good opinion.",
            fx: {coin:-150,rep:-4,honor:-3,wil:1},
          },
        ],
      },
      {
        id: "cm_merchant_debtor_flees",
        cond: (p,C)=>C.adult(p)&&free(p)&&(trader(p)||C.rich(p)&&!p.ruler&&!p.mil),
        cool: 7,
        title: "A debtor runs",
        setup: (p,ctx)=>{who(p,ctx,"your debtor")},
        text: "{them} owes you 60 suns and has run for the Free Marches, where nobody asks questions. A Debt-Hound from Ostra, who fetches fled debtors for the banks, offers to bring {themHim} back for a third of the debt.",
        choices: [
          {
            t: "Hire the Debt-Hound",
            r: "{them} comes back in a chain, thin and terrified. You get 40 suns and a feeling you do not like.",
            fx: {coin:40,honor:-2,them:{type:"enemy",op:-50}},
          },
          {
            t: "Ride after {themHim} yourself",
            check: {s:"tracking",s2:"survival",d:50},
            win: {
              r: "You catch {themHim} at a ferry and talk until {theyHe} pays most of it.",
              fx: {coin:50,skill:{tracking:2},them:{type:"rival",op:-20}},
            },
            lose: {
              r: "The trail ends at the Tirana. You come home wet and empty-handed.",
              fx: {coin:-5,health:-4,cause:"a cold river"},
            },
          },
          {
            t: "Write it off",
            r: "Sixty suns is a lesson. Perhaps {theyHe} needed it more than you.",
            fx: {honor:2,piety:1,wil:.5,them:{type:"friend",op:10}},
          },
        ],
      },
      {
        id: "cm_merchant_scales",
        cond: (p,C)=>C.adult(p)&&dealer(p),
        cool: 7,
        title: "The market warden",
        text: p=>`The market warden comes down the row with his own weights in a box, testing every scale. ${inR(p,"POL-21")?"At the Pepper Hall of Kesh, a false scale costs a merchant his stall for life.":"A false weight means a fine, and in some towns the pillory."} Your scale is honest. Your neighbour's is not, and he is sweating.`,
        choices: [
          {
            t: "Say nothing",
            r: "The warden finds it. Your neighbour pays a fine and spends the afternoon in the stocks.",
            fx: {},
          },
          {
            t: "Swap scales with him for an hour",
            check: {s:"deception",s2:"spd",d:50},
            win: {
              r: "Your honest scale passes twice. He owes you, and he pays it back twice over.",
              fx: {coin:8,honor:-1,newRel:{type:"friend",op:30}},
            },
            lose: {
              r: "The warden sees the swap. You are both fined, and both in the stocks.",
              fx: {coin:-10,rep:-3,honor:-3,happy:-4},
            },
          },
          {
            t: "Point him out to the warden",
            r: "The warden thanks you. The rest of the row does not.",
            fx: {rep:2,honor:1,newRel:{type:"enemy",op:-25}},
          },
        ],
      },
      {
        id: "cm_merchant_inn",
        cond: (p,C)=>C.adult(p)&&free(p)&&(dealer(p)||pathfinder(p)||manhunter(p)),
        cool: 5,
        title: "A night at the inn",
        setup: (p,ctx)=>{ctx.goods=A.pick(["raw wool","Ranpuri cotton","Tamari flax","river salt","tanned hides"])},
        text: "The common room is full: twenty strangers on straw at 3 pence a head. A private room is a whole sun. A man by the fire is talking too loudly about a cargo of {goods} going cheap in {town}.",
        choices: [
          {
            t: "Pay for a private room",
            r: "A bed, a lock and fleas. You wake rested, and the loud man is gone.",
            fx: {coin:-1,health:2},
          },
          {
            t: "Sleep in the common room and listen",
            check: {s:"intrigue",s2:"ins",d:45},
            win: {
              r: "Half the room are drovers, and their gossip is better than gold. You buy cheap in {town} a week later.",
              fx: {coin:25,skill:{intrigue:2}},
            },
            lose: {r:"You wake without your purse.",fx:{coinPct:-.15,happy:-3}},
          },
          {
            t: "Buy the loud man a drink",
            check: {s:"persuasion",s2:"int",d:40},
            win: {
              r: "He tells you the seller's name and the price, and asks for nothing but a second cup.",
              fx: {coin:15,newRel:{type:"friend",op:20}},
            },
            lose: {r:"He talks all night about his dead wife and nothing about cargo.",fx:{coin:-1}},
          },
        ],
      },
      {
        id: "cm_merchant_rumor",
        cond: (p,C)=>C.adult(p)&&trader(p)&&C.flag(p,"cm_rival"),
        w: 1.5,
        cool: 8,
        title: "A rumor of ruin",
        text: "Somebody is telling the whole exchange that your house cannot pay its debts. Every creditor you have wants their money this week. You can guess who started it.",
        choices: [
          {
            t: "Pay every creditor on the spot, in public",
            check: {s:"stewardship",s2:"trade",d:55},
            win: {
              r: "You pay in good coin, in the square, smiling. The rumor dies. Your credit is better than before.",
              fx: {rep:8,unflag:"cm_rival"},
            },
            lose: {r:"You pay, but it strips the house to the bone.",fx:{coin:-200,rep:-5,wil:1}},
          },
          {
            t: "Find the source and make them eat it",
            check: {s:"intrigue",s2:"intimidation",d:55},
            win: {
              r: "A clerk confesses who paid him to talk. You make sure the whole exchange hears that too.",
              fx: {rep:5,unflag:"cm_rival",newRel:{type:"enemy",op:-40}},
            },
            lose: {r:"You chase whispers for a month and catch none.",fx:{rep:-4}},
          },
          {
            t: "Close your doors for a week",
            r: "Closed doors look like ruin. Some creditors never come back.",
            fx: {coin:-80,rep:-8,wil:1},
          },
        ],
      },
      {
        id: "cm_merchant_cloves_bear",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"cm_cloves")&&since(p,"cm_cloves")>=5,
        once: !0,
        w: 3,
        title: "The walled garden",
        text: "The clove trees in your walled garden have flowered. Dried, the buds are worth 60 suns a kilogram, and you are the only grower in the Known World outside the Amber Isles. The sultan's agents have long ears.",
        choices: [
          {
            t: "Sell quietly, a little at a time",
            check: {s:"intrigue",s2:"trade",d:50},
            win: {
              r: "A little here, a little there, mixed into honest cargoes. 1,500 suns a year, and nobody wonders.",
              fx: {coin:1500,rep:6},
            },
            lose: {
              r: "A buyer wonders aloud where your cloves come from. You burn the trees before anyone else can.",
              fx: {coin:300,unflag:"cm_cloves",wil:1.5},
            },
          },
          {
            t: "Proclaim it, and be famous",
            r: "The first clove garden outside the Amber Isles. Princes write to you. So, you suspect, does someone in Amberport.",
            fx: {
              coin: 800,
              rep: 12,
              masterwork: "the first clove garden outside the Amber Isles",
              unflag: "cm_cloves",
              newRel: {type:"enemy",op:-50},
            },
          },
          {
            t: "Sell the whole garden to the Pepper Hall",
            r: "They pay 3,000 suns and take the trees, the gardener and the secret.",
            fx: {coin:3e3,unflag:"cm_cloves"},
          },
        ],
      },
    ]);
    const seaRite = p=>p.faith==="REL-01"?"Priests bless the ships with salt and the first light.":p.faith==="REL-03"?"A hall-priest throws a stone into the harbor for the drowned.":p.faith==="REL-19"?"Dice rattle at the Shrine of the Dice.":p.faith==="REL-07"?"The Well-Keepers pour sweet water into the salt.":p.faith==="REL-13"?"Old women throw bread to the Drowned Queen.":"The ships are blessed and the season begins.";
    A.defEvents([
      OPP(["sailor"], {
        id: "cm_sailor_sea_opening",
        young: !0,
        maxRank: 1,
        cool: 3,
        title: "Sea Opening",
        setup: (p,ctx)=>{ctx.rite=seaRite(p),ctx.port=port(p)},
        text: "1 April at {port}. {rite} The quay is full of masters hiring. Three ships want hands: a grain cog bound for Tamar, a coaster that works the channel ports, and a galley short of oarsmen.",
        choices: [
          {
            t: "The grain cog: long voyages, steady pay",
            r: "Fifteen suns a month and food, and a long way to go. You learn the open sea.",
            fx: {coin:20,rep:2,skill:{sea:3}},
          },
          {
            t: "The coaster: hard tides, hard master",
            check: {s:"sea",s2:"sta",d:35},
            win: {
              r: "One season of tide-races teaches more than three of open water.",
              fx: {coin:12,rep:4,skill:{sea:5}},
            },
            lose: {
              r: "A wet deck, a loose sheet, a fall. You learn, but slower.",
              fx: {health:-6,cause:"a fall on a wet deck",skill:{sea:3}},
            },
          },
          {
            t: "The galley bench: 12 suns a month",
            r: "You pull to the drum all summer. Your back becomes a door.",
            fx: {coin:15,str:1,sta:1},
          },
          {
            t: "Ask for a topman's berth",
            req: (p,C)=>C.prof(p,"sea",35),
            r: "The mate watches you go up the shrouds and nods. Topman's pay.",
            fx: {coin:25,rep:3,skill:{athletics:2}},
          },
        ],
      }),
      OPP(["sailor"], {
        id: "cm_sailor_aloft",
        young: !0,
        maxRank: 1,
        cool: 4,
        title: "Aloft",
        text: "The mate bets a silver penny that no ship's boy can touch the masthead before the bell stops ringing. The others look at the mast, then at you.",
        choices: [
          {
            t: "Race up the shrouds",
            check: {s:"spd",s2:"athletics",d:35},
            win: {
              r: "You slap the masthead with the bell still going. The crew cheers and the mate pays up.",
              fx: {rep:3,spd:.5,coin:1},
            },
            lose: {
              r: "Your foot slips at the top. You hang by your hands over the deck, then climb down shaking.",
              fx: {health:-4,cause:"a fall from the rigging",wil:.5},
            },
          },
          {
            t: "Climb slow and sure",
            check: {s:"sea",s2:"sta",d:30},
            win: {
              r: "Not first, but nobody climbs cleaner. The old hands notice that more than speed.",
              fx: {rep:2,skill:{sea:2}},
            },
            lose: {r:"Slow, and not very sure either.",fx:{skill:{sea:1}}},
          },
          {
            t: "Let someone else make a fool of himself",
            r: "Another boy falls and breaks his wrist. The mate looks at you with something like respect.",
            fx: {int:.2},
          },
        ],
      }),
      OPP(["sailor"], {
        id: "cm_sailor_long_voyage",
        minRank: 1,
        maxRank: 3,
        time: 2,
        cool: 3,
        title: "A long voyage",
        setup: (p,ctx)=>{ctx.dest=A.pick(["Amberport for cloves","Kesh for pepper","Tamar for grain","Wolfhaven for tin and ivory","Qadira for rag paper","Sabra for dates and pearls"])},
        text: "A master is signing hands for a run to {dest}: four months out and back, double pay, and a little cargo space for each man to trade on his own. Ships come back from that run rich, or not at all.",
        choices: [
          {
            t: "Sign on, and trade your share of the hold",
            check: {s:"sea",s2:"trade",d:50},
            win: {
              r: "You sell a sack of salt where salt is dear and buy where your goods are cheap. Home with 70 suns and a tan.",
              fx: {coin:70,rep:4,skill:{sea:4,trade:2}},
            },
            lose: {
              r: "Fever in a far port. You spend your pay on a bed and a physician.",
              fx: {coin:10,health:-12,cause:"a fever in a far port",wil:1},
            },
          },
          {
            t: "Sign on and keep your head down",
            r: "Four months of watches and weather. Double pay.",
            fx: {coin:35,rep:2,skill:{sea:3}},
          },
          {t:"Stay with the coasting trade",r:"Home every week. Poor every week.",fx:{coin:8}},
          {
            t: "Sign on as the master's second navigator",
            req: (p,C)=>C.prof(p,"sea",50),
            check: {s:"sea",s2:"int",d:55},
            win: {
              r: "Off a strange coast, in fog, you bring her in by soundings and stars. The master tells everyone.",
              fx: {coin:90,rep:8,skill:{sea:4}},
            },
            lose: {r:"You put her a day off course. The master tells everyone that too.",fx:{coin:30,rep:-2}},
          },
        ],
      }),
      OPP(["sailor"], {
        id: "cm_sailor_helm_storm",
        minRank: 2,
        maxRank: 4,
        cool: 4,
        title: "Your watch, your helm",
        text: p=>`${inR(p,"POL-14","POL-25")?"In the Grey Channel the tide runs like a river and the sandbanks move every winter.":"A lee shore, and the wind rising every hour."} The master is below with a broken arm and a bottle. The crew is looking at you.`,
        choices: [
          {
            t: "Take the helm and claw off the shore",
            check: {s:"sea",s2:"ins",d:60},
            win: {
              r: "Six hours on the helm with the rocks close enough to spit on. Dawn finds you in open water. The owners hear of it.",
              fx: {rep:10,fame:2,sta:.5,skill:{sea:4}},
            },
            lose: {
              r: "She strikes, grinds, and comes off leaking. Nobody dies. Nobody forgets.",
              fx: {rep:-4,health:-8,cause:"a wreck",wil:1},
            },
          },
          {
            t: "Anchor and ride it out",
            check: {s:"sea",s2:"wil",d:50},
            win: {r:"Both anchors hold. Barely. You do not sleep for two days.",fx:{rep:5,wil:.5}},
            lose: {
              r: "The anchors drag. You cut the cables and run for it, and the deck cargo goes over the side.",
              fx: {rep:-2,coin:-20},
            },
          },
          {
            t: "Beach her in the nearest cove",
            r: "The ship is safe and so is everyone. The cargo is half ruined, and the owners grumble.",
            fx: {rep:1,coin:-10},
          },
        ],
      }),
      OPP(["sailor"], {
        id: "cm_sailor_pilot_fee",
        minRank: 3,
        maxRank: 4,
        cool: 3,
        title: "The pilot's fee",
        setup: (p,ctx)=>{ctx.shoals=inR(p,"POL-18","POL-04")?"The Monuti mouths shift every flood, and the bars are never where last year's pilots left them":inR(p,"POL-14","POL-25")?"The Grey Channel sandbanks move every winter":inR(p,"POL-33")?"The reef channel at Blackreef has one way in, closed with a chain of anchor links":inR(p,"POL-32","POL-21")?"The reefs off the Amber Isles have eaten more ships than the sultans have built":inR(p,"POL-08","POL-23","POL-09")?"The skerries off the north coast hide under every tide":"The harbor bar has silted since spring"},
        text: "{shoals}. A master who does not know this water offers you 60 suns to take his ship through tonight. Pilots get paid. Pilots who wreck ships get remembered.",
        choices: [
          {
            t: "Take her through by night",
            check: {s:"sea",s2:"int",d:55},
            win: {
              r: "Lead line, stars and the feel of the current under the keel. She glides in on the last of the flood.",
              fx: {coin:60,rep:6,skill:{sea:3}},
            },
            lose: {
              r: "You touch the bar. She floats off on the tide, but the master tells every tavern on the quay.",
              fx: {coin:-20,rep:-8},
            },
          },
          {
            t: "Wait for the morning tide and daylight",
            r: "Slower and surer. The master grumbles and pays.",
            fx: {coin:40,rep:3},
          },
          {
            t: "Charge double for a night passage",
            check: {s:"trade",s2:"sea",d:55},
            win: {r:"He pays 120. You earn every penny of it.",fx:{coin:120,rep:3}},
            lose: {r:"He goes to another pilot, who charges less and does it worse.",fx:{coin:0,rep:-1}},
          },
        ],
      }),
      OPP(["sailor"], {
        id: "cm_sailor_mutiny",
        minRank: 2,
        maxRank: 3,
        cool: 10,
        title: "Mutiny",
        setup: (p,ctx)=>{who(p,ctx,"master of a merchant ship"),ctx.ship=ship(p)},
        text: "Four months unpaid, short rations, and the master of {ship}, {them}, flogged a boy to death on Tuesday. The crew comes to you on the night watch. They want the ship, and they want you to lead them.",
        choices: [
          {
            t: "Lead them. Take the ship",
            check: {s:"command",s2:"intimidation",d:60},
            win: {
              r: "{them} is put ashore in a boat with water and bread. The crew elects you master by a show of hands.",
              fx: {promote:!0,rep:6,fame:3,honor:-2,flag:"cm_mutineer",them:{type:"enemy",op:-80}},
            },
            lose: {
              r: "The master's men were ready. You are in irons by dawn, and before a harbor court within the week.",
              fx: {prison:3,why:"mutiny",health:-10,cause:"irons and beatings",them:{type:"enemy",op:-60}},
            },
          },
          {
            t: "Speak for the crew to the master",
            check: {s:"diplomacy",s2:"persuasion",d:55},
            win: {
              r: "No knives, no blood: back pay at the next port and no more floggings. Both sides trust you, a little.",
              fx: {rep:8,honor:3,them:{type:"acquaint",op:20}},
            },
            lose: {
              r: "{They} calls it mutiny talk and has you flogged at the mast.",
              fx: {health:-12,cause:"a flogging",wound:"back",wil:1.5,them:{type:"enemy",op:-40}},
            },
          },
          {
            t: "Warn the master",
            r: "The ringleaders hang from the yard. {them} gives you a purse and a long look.",
            fx: {coin:40,honor:-6,them:{type:"acquaint",op:30},newRel:{type:"enemy",op:-50}},
          },
          {
            t: "Stay out of it",
            r: "Without a leader the crew loses its nerve. Nothing changes, except that the boy is still dead.",
            fx: {wil:.5,happy:-3},
          },
        ],
      }),
      OPP(["sailor"], {
        id: "cm_sailor_command",
        minRank: 3,
        maxRank: 3,
        minRep: 50,
        cool: 6,
        title: "A ship to command",
        setup: (p,ctx)=>{ctx.ship=ship(p)},
        text: "The owners of {ship} have lost their master to drink. They offer you command: a master's pay of 120 suns a month and a share of every cargo. They also want you to carry a quarter of the risk: 300 suns as your stake.",
        choices: [
          {
            t: "Take command and put in the stake (300 suns)",
            req: p=>p.coin>=300,
            r: "Your ship. Your crew. Your name on the harbor-master's roll.",
            fx: {coin:-300,promote:!0,rep:8,fame:2,happy:6},
          },
          {
            t: "Take command on wages alone",
            check: {s:"persuasion",s2:"sea",d:55},
            win: {
              r: "They want you more than your money. You take {ship} out on the next tide.",
              fx: {promote:!0,rep:5},
            },
            lose: {r:"They give her to a man with money instead.",fx:{rep:-2}},
          },
          {t:"Not yet",r:"There will be other ships. Probably.",fx:{}},
        ],
      }),
      OPP(["sailor"], {
        id: "cm_sailor_ironjaw",
        minRank: 1,
        cool: 10,
        cond: (p,C)=>!inR(p,"POL-08","POL-09","POL-23","POL-25","POL-26"),
        title: "Old Ironjaw",
        text: "A grey back as long as the ship breaks water off the bow, scarred white along one side. Old Ironjaw: he has sunk four ships off the Strait of Hael since 1088, and sailors say the leviathans are the souls of drowned kings. He turns, slowly, and comes back.",
        choices: [
          {
            t: "Put the helm hard over and run downwind",
            check: {s:"sea",s2:"ins",d:55},
            win: {
              r: "He follows for a mile, then sounds and is gone. Nobody aboard speaks until land.",
              fx: {rep:6,fame:3,skill:{sea:3}},
            },
            lose: {
              r: "He strikes the stern a glancing blow. The rudder is gone, and you limp into port under sweeps.",
              fx: {coin:-20,health:-8,cause:"a leviathan's blow",wil:1.5},
            },
          },
          {
            t: "Throw the deck cargo over to lighten her",
            r: "Oil jars bob in your wake. He noses them, curious, and you get away poorer.",
            fx: {coin:-30,wil:.5},
          },
          {
            t: "Take a harpoon to the bow",
            check: {s:"spear",s2:"str",d:70},
            win: {
              r: "Your iron sinks into the scarred side. He rolls, blows red, and does not come back. Every port on the Middle Sea will hear of it.",
              fx: {fame:8,rep:12,epithet:"Ironjaw's Bane",deed:"Drove off Old Ironjaw with a harpoon"},
            },
            lose: {
              r: "The iron glances off. He strikes, and you go over the rail into cold green water.",
              fx: {health:-25,cause:"drowning",wound:"broken_ribs",wil:2},
            },
          },
          {
            t: "Pray to the Drowned Queen",
            check: {s:"faith",s2:"wil",d:50},
            win: {r:"He passes under the keel so close you could touch him, and is gone.",fx:{piety:4,fame:1}},
            lose: {r:"He takes the ship's boat and half the rail. The Queen was busy.",fx:{coin:-15,piety:1,wil:1}},
          },
        ],
      }),
      OPP(["sailor"], {
        id: "cm_sailor_passenger",
        minRank: 2,
        maxRank: 4,
        cool: 6,
        title: "A passenger who pays in gold",
        setup: (p,ctx)=>{who(p,ctx,"a passenger with no name"),ctx.dest=farPort(p)},
        text: "{them} pays twenty Lucernan crowns, near five hundred suns, for passage to {dest} and no questions. {Their} hands are soft, {theirHis} accent is wrong, and two men on the quay are watching your ship.",
        choices: [
          {
            t: "Take the gold. Ask nothing",
            check: {s:"sea",s2:"ins",d:50},
            win: {
              r: "You slip out on the night tide. At {dest} the passenger vanishes into the crowd. The crowns are real.",
              fx: {coin:480,rep:2,them:{type:"friend",op:20}},
            },
            lose: {
              r: "A galley stops you at the harbor mouth. They take {them}, and they take your ship's papers for a month.",
              fx: {coin:-60,rep:-6,favor:-10},
            },
          },
          {
            t: "Hand {themHim} to the harbor-master",
            r: "The men on the quay were the harbor-master's. He pays a reward and asks your name, and writes it down.",
            fx: {coin:50,favor:5,them:{type:"enemy",op:-60}},
          },
          {
            t: "Find out who {theyHe} really is",
            check: {s:"intrigue",s2:"persuasion",d:55},
            win: {
              r: "A banker's clerk, fleeing with a ledger that would hang three councillors. You carry {themHim} for double, and you keep a copy of a page.",
              fx: {coin:900,honor:-2,skill:{intrigue:3}},
            },
            lose: {r:"Wrong question. {They} takes {theirHis} gold to another ship.",fx:{rep:-1}},
          },
        ],
      }),
      OPP(["sailor"], {
        id: "cm_sailor_press",
        minRank: 1,
        cool: 6,
        title: "The press",
        text: p=>`${war(p)?"There is a war on.":"The crown is building galleys."} The {rulerTitle}'s fleet needs oarsmen and marines, and the press officers are on the quay with a list and clubs.`,
        choices: [
          {
            t: "Serve the crown at sea for a season",
            check: {s:"sea",s2:"melee",d:50},
            win: {
              r: "A season of drills and one sharp fight off a headland. You come home paid, praised and whole.",
              fx: {coin:40,fame:3,rep:3,favor:5},
            },
            lose: {
              r: "In the first boarding a pike finds you.",
              fx: {coin:20,health:-15,cause:"a boarding pike",wound:"deep_cut",wil:1},
            },
          },
          {
            t: "Hide in the ropewalk until they go",
            check: {s:"stealth",s2:"int",d:45},
            win: {r:"They walk past the hemp three times. You hold your breath three times.",fx:{skill:{stealth:2}}},
            lose: {
              r: "They find you under the hemp. You serve anyway, with a black eye.",
              fx: {coin:15,health:-5,cause:"a press-gang club",skill:{sea:2}},
            },
          },
          {
            t: "Bribe the press officer (5 suns)",
            req: p=>p.coin>=5,
            r: "Your name slides off the list like water off a sail.",
            fx: {coin:-5,honor:-1},
          },
          {
            t: "Offer the fleet your services as a pilot",
            req: (p,C)=>C.jobRank(p,3),
            r: "The admiral needs men who know the shoals more than he needs oarsmen. Good pay, and a letter with a seal.",
            fx: {coin:100,favor:8,rep:6},
          },
        ],
      }),
      OPP(["sailor"], {
        id: "cm_sailor_last_run",
        minRank: 4,
        cool: 4,
        title: "The last run",
        setup: (p,ctx)=>{ctx.dest=farPort(p)},
        text: "The last week of September. A rich cargo waits at {dest}, and its owner will pay 600 suns to have it home before winter. Sea Closing is 1 October for a reason: the autumn gales.",
        choices: [
          {
            t: "Run it, and race the gales",
            check: {s:"sea",s2:"command",d:60},
            win: {
              r: "You come home on 30 September with a split sail and a full hold. The quay cheers you in.",
              fx: {coin:600,rep:10,fame:3},
            },
            lose: {
              r: "The gale catches you two days out. You live. The cargo and three men do not.",
              fx: {coin:-300,rep:-6,health:-15,cause:"an autumn gale",wil:2},
            },
          },
          {
            t: "Run it halfway, then winter in a safe port",
            check: {s:"sea",s2:"logistics",d:50},
            win: {
              r: "You winter in a strange town and deliver in April. Half the fee, all of the crew.",
              fx: {coin:300,rep:5},
            },
            lose: {r:"The cargo spoils in a damp winter warehouse.",fx:{coin:50,rep:-2}},
          },
          {
            t: "Lay her up for the winter",
            r: "You sleep ashore and lose the fee. Your ship is there in spring.",
            fx: {},
          },
        ],
      }),
      OPP(["sailor"], {
        id: "cm_sailor_record_run",
        minRank: 4,
        minRep: 60,
        time: 2,
        cool: 8,
        title: "A record passage",
        setup: (p,ctx)=>{ctx.ship=ship(p),ctx.leg=A.pick(["Lucerna to Tamar in nine days","Greyhaven to Wolfhaven in five days","Qadira to Lucerna in eight days","Amberport to Kesh in six days"])},
        text: "The merchants of {capital} are betting on whether any ship can run {leg}. The record has stood for thirty years. Your ship, {ship}, is fast, and her crew would follow you over a waterfall.",
        choices: [
          {
            t: "Crowd on every sail and go for it",
            check: {s:"sea",s2:"command",d:65},
            win: {
              r: "You beat the old record by most of a day. They cut your ship's name into the harbor stone.",
              fx: {coin:200,rep:12,fame:4,masterwork:"the record run of {ship}, {leg}"},
            },
            lose: {
              r: "A sprung mast off the cape ends it. You limp in a day slow.",
              fx: {rep:-2,coin:-40,health:-5,cause:"a falling spar"},
            },
          },
          {
            t: "Bet on yourself, then sail it safe",
            check: {s:"gambling",s2:"sea",d:55},
            win: {r:"You win your wager by an hour and lose nothing but sleep.",fx:{coin:300,rep:4}},
            lose: {r:"Safe is slow. You lose your wager.",fx:{coin:-100}},
          },
          {t:"Leave the betting to fools",r:"The sea does not care about records.",fx:{}},
        ],
      }),
      OPP(["fish","sailor"], {
        id: "cm_sea_wreck",
        cool: 6,
        title: "Wreck on the bar",
        text: p=>`A cog has struck the bar in the night and lies on her side, crew in the rigging, cargo in the surf. ${inR(p,"POL-14")?"In Greyhaven, wreckers hang.":inR(p,"POL-08")?"In Northreach a stranded ship is still fair game, whatever the king says.":"Wreck law is plain: the cargo belongs to the owner, if he lives."}`,
        choices: [
          {
            t: "Row out and take the crew off",
            check: {s:"sea",s2:"str",d:50},
            win: {
              r: "Eleven men come down the rigging into your boat. The owner sends you a purse from Lucerna.",
              fx: {coin:30,fame:2,honor:4,rep:6},
            },
            lose: {
              r: "A sea throws your boat against the hull. You lose an oar, some skin and nearly your life.",
              fx: {health:-10,cause:"the surf",honor:2,wil:1},
            },
          },
          {
            t: "Salvage the cargo on the beach",
            r: "Wine, oil, a chest of nails. You claim salvage, a third by custom. The owner pays it, sourly.",
            fx: {coin:25,rep:1},
          },
          {
            t: "Strip her before anyone else does",
            check: {s:"stealth",s2:"str",d:45},
            win: {
              r: "By dawn the hold is lighter and your shed is fuller. Nobody saw anything.",
              fx: {coin:60,honor:-5},
            },
            lose: {r:"The owner's men saw everything.",fx:{punish:"theft"}},
          },
        ],
      }),
    ]);
    A.defEvents([
      {
        id: "cm_sailor_shore_leave",
        cond: (p,C)=>C.adult(p)&&seaman(p),
        cool: 4,
        title: "Shore leave",
        text: p=>`Shore leave in ${port(p)}. ${inR(p,"POL-04","POL-16","POL-33")?"The dockside speaks harbor cant: a purse is a fish, a watchman a dry or a wet, prison the ledger.":"The taverns by the quay take any coin and give back very little."} Your mates are heading for the dice tables.`,
        choices: [
          {
            t: "Go with them",
            check: {s:"gambling",s2:"ins",d:45},
            win: {
              r: "The dice love you till dawn. You come back aboard 20 suns richer and singing.",
              fx: {coin:20,happy:5},
            },
            lose: {
              r: "The dice hate you, and a docker hates you more. You come back with a black eye and an empty purse.",
              fx: {coinPct:-.3,health:-5,cause:"a tavern brawl"},
            },
          },
          {
            t: "Walk the town alone",
            r: "Strange food, a temple you have never seen, a girl selling figs who laughs at your accent. A good day.",
            fx: {happy:6,int:.3},
          },
          {
            t: "Stay aboard and mend your gear",
            r: "Quiet, cheap, dull. The bosun notices.",
            fx: {coin:2,skill:{sea:1},perf:3},
          },
        ],
      },
      {
        id: "cm_sailor_fever",
        cond: (p,C)=>C.adult(p)&&seaman(p),
        cool: 7,
        title: "Fever aboard",
        setup: (p,ctx)=>{who(p,ctx,"a shipmate")},
        text: "{them} has the sweating fever, three days out from land. The others want {themHim} put in the boat and towed astern, or worse, before it spreads. Lucerna's Forty-Day Law would keep the whole ship out of harbor if anyone there knew.",
        choices: [
          {
            t: "Nurse {themHim} in the forepeak",
            check: {s:"medicine",s2:"sta",d:45},
            win: {
              r: "Water, willow bark, wet cloths. The fever breaks on the fourth night, and nobody else takes it.",
              fx: {honor:4,skill:{medicine:3},them:{type:"friend",op:50}},
            },
            lose: {
              r: "{They} lives. You take the fever yourself and lose a week to it.",
              fx: {health:-12,cause:"ship fever",them:{type:"friend",op:40},wil:1},
            },
          },
          {
            t: "Side with the crew: tow {themHim} astern",
            r: "A boat, a cask of water, a rope. {They} lives, just. {They} never speaks to you again.",
            fx: {honor:-3,them:{type:"enemy",op:-40}},
          },
          {
            t: "Ask the master to make for the nearest port",
            check: {s:"persuasion",s2:"sea",d:45},
            win: {
              r: "He turns her for land. A physician there knows the fever. Everyone lives.",
              fx: {rep:3,them:{type:"friend",op:30}},
            },
            lose: {r:"He will not lose the days. The crew mutters at you all the way home.",fx:{rep:-1}},
          },
        ],
      },
      {
        id: "cm_sailor_old_salt",
        cond: (p,C)=>C.adult(p)&&seaman(p)&&!C.old(p),
        cool: 10,
        title: "The old salt",
        setup: (p,ctx)=>{who(p,ctx,"an old sailor","acquaint")},
        text: "{them} has sailed forty years and lost two fingers, a wife and a ship to the sea. On the night watch {theyHe} starts teaching you things nobody writes down: the smell of land, the colour of shoal water, the wind that comes before the wind.",
        choices: [
          {
            t: "Listen, every watch, all season",
            r: "By autumn you can feel weather coming in your teeth.",
            fx: {skill:{sea:5},int:.3,them:{type:"mentor",op:35}},
          },
          {
            t: "Ask about the wife",
            r: "{They} talks about her until dawn. You learn nothing about the sea and a great deal about grief.",
            fx: {wil:1,them:{type:"friend",op:40}},
          },
          {t:"Sleep instead",r:"You sleep. {They} tells the boy instead.",fx:{health:2}},
        ],
      },
      {
        id: "cm_sailor_letters",
        cond: (p,C)=>C.adult(p)&&seaman(p)&&(C.married(p)||C.hasKids(p)),
        cool: 6,
        title: "Long absence",
        text: "Seven months at sea. In every port you look for a ship going home that might carry a letter, and in every port there is none. At home they will be counting the days, or they will have stopped.",
        choices: [
          {
            t: "Pay a scribe and a captain to carry a letter (2 suns)",
            req: p=>p.coin>=2,
            r: "Six pence for the scribe, a sun and a half for the captain. Months later you learn it arrived, and was read aloud at supper.",
            fx: {coin:-2,happy:4,rel:{who:"spouse",op:8}},
          },
          {
            t: "Sign off at the next port and go home",
            r: "You lose the voyage pay and gain a winter by your own fire.",
            fx: {coin:-15,happy:8,rel:{who:"spouse",op:10}},
          },
          {
            t: "Bear it",
            r: "You stand your watches and say nothing. The sea teaches that too.",
            fx: {wil:1,happy:-3},
          },
        ],
      },
    ]);
    const fishOf = p=>inR(p,"POL-08","POL-09","POL-23","POL-14","POL-25","POL-01","POL-26")?"herring":inR(p,"POL-17","POL-24","POL-19","POL-33")?"sardine":inR(p,"POL-21","POL-32","POL-30")?"mackerel":inR(p,"POL-12","POL-11")?"sturgeon":A.pick(["tunny","sardine","mackerel"]),
      NORTHSEA = ["POL-08","POL-09","POL-14","POL-23","POL-25","POL-26","POL-01"];
    A.defEvents([
      OPP(["fish"], {
        id: "cm_fish_season_share",
        young: !0,
        maxRank: 1,
        cool: 3,
        title: "A share in the boat",
        setup: (p,ctx)=>{who(p,ctx,"an old boat-owner"),ctx.fish=fishOf(p)},
        text: "The {fish} season is starting. Old {them} needs a hand on {theirHis} boat for the whole run: a share of the catch, a place by the fire, and every job nobody else wants.",
        choices: [
          {
            t: "Take the share",
            r: "Gutting, salting, baling, rowing. By the end of the run you can do all of it half asleep, and often do.",
            fx: {coin:8,rep:2,skill:{sea:3},them:{type:"mentor",op:20}},
          },
          {
            t: "Hold out for a bigger share",
            check: {s:"trade",s2:"persuasion",d:40},
            win: {
              r: "{They} spits, grumbles and agrees. You are worth it, and you prove it.",
              fx: {coin:12,rep:1,them:{type:"acquaint",op:5}},
            },
            lose: {r:"{They} hires your cousin instead.",fx:{happy:-2}},
          },
          {
            t: "Sign on with the big fleet boats",
            r: "Less to learn, more to haul. Your share is smaller and steadier.",
            fx: {coin:10,skill:{sea:2},str:.3},
          },
        ],
      }),
      OPP(["fish"], {
        id: "cm_fish_own_boat",
        minRank: 1,
        maxRank: 1,
        time: 2,
        cool: 4,
        title: "A boat of your own",
        setup: (p,ctx)=>{ctx.old=nm(p,"M")},
        text: "Old {old}'s hands have gone, and his sons went for soldiers. He is selling his boat: clinker-built, tarred last spring, with nets and two oars. A fishing boat costs 150 suns. That is two years of your share.",
        choices: [
          {
            t: "Buy her outright (150 suns)",
            req: p=>p.coin>=150,
            r: "You paint an eye on her bow for luck. Your boat, your catch, your name on the beach.",
            fx: {coin:-150,asset:"fishboat",promote:!0,rep:6,happy:8},
          },
          {
            t: "Buy her on credit from the salt merchant",
            check: {s:"trade",s2:"persuasion",d:45},
            win: {
              r: "He lends the money against your next three seasons of salt fish. The boat is yours, mostly.",
              fx: p=>{addDebt(p,130),p.assets.push({k:"fishboat",name:GD.PROPERTY.fishboat.name,y:A.S.year}),A.addRep(p,4);const C=GD.CAREERS[p.job.c];return C&&C.ranks[p.job.r+1]&&p.job.r++,"(You owe 130 suns.)"},
            },
            lose: {r:"He wants a third of every catch for five years. You walk away.",fx:{wil:.5}},
          },
          {
            t: "Build one with the carpenter over the winter (60 suns)",
            req: p=>p.coin>=60,
            check: {s:"craft",s2:"sta",d:50},
            win: {
              r: "A winter of steamed planks and split knuckles. She floats, and she is yours down to the last nail.",
              fx: {coin:-60,asset:"fishboat",promote:!0,rep:5,skill:{craft:3}},
            },
            lose: {
              r: "She leaks like a basket. You burn her on the beach at the Slaughter Feast.",
              fx: {coin:-60,wil:1,happy:-4},
            },
          },
          {t:"Stay on another man's boat",r:"No debt, no boat, no change.",fx:{}},
        ],
      }),
      OPP(["fish"], {
        id: "cm_fish_far_grounds",
        minRank: 1,
        maxRank: 2,
        time: 2,
        cool: 3,
        title: "The far grounds",
        setup: (p,ctx)=>{ctx.ground=inR(p,"POL-17","POL-24","POL-19","POL-33")?"the Bone Coast, where the cold current brings sardines by the million and there is no water at all":inR(p,...NORTHSEA)?"the walrus shores and seal beaches of the Frostfells":inR(p,"POL-21","POL-32")?"the reef banks off the Isle of Pearls":"the far banks, three days out"},
        text: "Every summer the crews go to {ground}. The fish are certain. The good beaches are not: they go to whoever holds them, and the crews from three realms fight over every one.",
        choices: [
          {
            t: "Fight for the best beach",
            r: "Fists on the sand, as the custom is.",
            fx: {
              coin: 25,
              duel: {
                tier: 2,
                title: "a rival fisherman",
                troop: "SL",
                opts: {kind:"brawl",place:"a fishing beach",lethal:!1,toYield:!0,title:"The beach"},
              },
            },
          },
          {
            t: "Take a poor beach and work twice as hard",
            r: "Long days, short sleep, salt in every cut. You come home with a full share and hands like rope.",
            fx: {coin:15,sta:1,skill:{sea:2}},
          },
          {
            t: "Share a beach with a rival crew",
            check: {s:"diplomacy",s2:"trade",d:45},
            win: {
              r: "One beach, two crews, one big catch. You share their water and they share your salt.",
              fx: {coin:25,rep:3,newRel:{type:"friend",op:25}},
            },
            lose: {
              r: "Quarrels over the racks every day. You go home early, with half a share.",
              fx: {coin:8,newRel:{type:"rival",op:-20}},
            },
          },
        ],
      }),
      OPP(["fish"], {
        id: "cm_fish_whale",
        minRank: 1,
        maxRank: 2,
        cool: 8,
        cond: (p,C)=>inR(p,...NORTHSEA)||C.terr(p,"tundra"),
        title: "Stranded",
        setup: (p,ctx)=>{ctx.lev=inR(p,"POL-23","POL-25","POL-26","POL-09")?1:0,ctx.kind=ctx.lev?"a young Frost Leviathan, pale as ice":"a grey whale"},
        text: p=>`At dawn {kind} lies stranded in the shallows of the fjord, still breathing. Oil, meat and bone enough for a village winter. ${inR(p,"POL-23","POL-25","POL-26","POL-09")?"The Truce of Dobin forbids killing Frost Leviathans, and the giants of Hrimfell take revenge for every one.":"In Hrimfell, wasting any part of a whale is fined in seal oil. Here, nobody fines anyone."}`,
        choices: [
          {
            t: "Kill it and render the oil",
            r: "Three days of flensing knives and smoke. The village eats, and your share is 80 suns.",
            fx: (p,ctx)=>(p.coin+=80,A.addRep(p,2),ctx.lev?(p.honor=A.clamp(p.honor-4,0,100),A.applyFx(p,{newRel:{type:"enemy",op:-60}},ctx)+" In winter, a giant walks down the shore asking whose boat found the leviathan."):""),
          },
          {
            t: "Help it back to deep water at high tide",
            check: {s:"str",s2:"sea",d:55},
            win: {
              r: "Every boat in the village pulls on the ropes. It rolls once in deep water, and blows.",
              fx: {honor:4,piety:3,fame:2,rep:3},
            },
            lose: {r:"It dies on the ebb anyway, and you have hauled for nothing.",fx:{wil:.5,sta:.5}},
          },
          {
            t: "Send word to the giants",
            req: (p,C,ctx)=>!!(ctx&&ctx.lev),
            r: "Two giants walk down the shore at dawn and sing over it until it dies. They leave you a walrus tusk worth 15 suns a kilogram, and a nod.",
            fx: {coin:30,honor:3,rep:3,newRel:{type:"friend",op:30}},
          },
        ],
      }),
      OPP(["fish"], {
        id: "cm_fish_pearl_bank",
        young: !0,
        maxRank: 2,
        cool: 4,
        cond: (p,C)=>inR(p,"POL-24","POL-32","POL-21","POL-17","POL-19","POL-30")&&free(p),
        title: "The deep bank",
        text: p=>`${inR(p,"POL-24")?"The Emir takes the best pearl of every boat; a free diver keeps a share of the rest.":"A free diver keeps a share of whatever the bank gives up."} A boat-owner wants you for the deep bank, past the shallows, where the pearls are big and the sharks are bigger.`,
        choices: [
          {
            t: "Dive the deep bank",
            check: {s:"sta",s2:"sea",d:55},
            win: {
              r: "Down where the light goes green you prise open an oyster with a pearl like a chickpea. Your share is 60 suns.",
              fx: {coin:60,rep:4,fame:1,skill:{sea:4}},
            },
            lose: {
              r: "A grey shape turns below you. You come up with a pearl in one hand and a bite in your calf.",
              fx: {coin:10,health:-14,cause:"a shark",wound:"bite",wil:1},
            },
          },
          {
            t: "Work the shallows",
            r: "Seed pearls and sore ears. 12 suns for the season.",
            fx: {coin:12,skill:{sea:2}},
          },
          {
            t: "Haul the ropes for the divers",
            r: "Somebody has to stay dry. Six suns and a sunburn.",
            fx: {coin:6,str:.5},
          },
          {
            t: "Stay down where nobody else can",
            req: (p,C)=>C.blood(p,"deeplung")||C.blood(p,"deepbreath")||C.blood(p,"saltskin"),
            r: "You stay under so long that the boat starts to pray. You come up with three pearls in your fist.",
            fx: {coin:150,fame:3,rep:6},
          },
        ],
      }),
      OPP(["fish"], {
        id: "cm_fish_weir",
        minRank: 1,
        maxRank: 2,
        cool: 6,
        title: "The weir",
        setup: (p,ctx)=>{ctx.owner=inR(p,"POL-02","POL-03","POL-15","POL-25","POL-26")?"the abbey":inR(p,"POL-18")?"the temple":"the manor",ctx.Owner=A.cap(ctx.owner)},
        text: "{Owner} has built a fish weir of stakes and wicker across the river mouth, and its steward says the fishing rights there are older than your grandfather. Since then your nets come up empty and its traps come up full.",
        choices: [
          {
            t: "Pull down a stretch of the weir at night",
            check: {s:"stealth",s2:"str",d:50},
            win: {r:"The fish come back for a month before anyone mends it.",fx:{coin:15,skill:{stealth:2}}},
            lose: {
              r: "The steward's men are waiting. A beating, and a fine for the wicker.",
              fx: {coin:-15,health:-6,cause:"a beating",honor:-2},
            },
          },
          {
            t: "Take {owner} to court with the old fishers as witnesses",
            check: {s:"learning",s2:"diplomacy",d:55},
            win: {
              r: "Three old men swear the river mouth was always common. The weir comes down by order. The village drinks to you for a year.",
              fx: {coin:30,rep:6,fame:2,honor:3},
            },
            lose: {r:"It is the steward's court. You pay the costs.",fx:{coin:-10,rep:-1}},
          },
          {
            t: "Pay a fee to fish above the weir",
            r: "A tenth of the catch to the steward. Less fish, no trouble.",
            fx: {coin:4},
          },
          {
            t: "Fish farther out",
            r: "Longer days, rougher water, the same fish.",
            fx: {coin:3,sta:.5,skill:{sea:1}},
          },
        ],
      }),
      OPP(["fish"], {
        id: "cm_fish_night_crossing",
        maxRank: 2,
        cool: 5,
        title: "A crossing by night",
        setup: (p,ctx)=>{who(p,ctx,"a stranger with a bundle")},
        text: "{them} finds you mending nets at dusk and offers 10 suns to be rowed across the bay tonight, no lantern. {They} does not say why. {Their} hands are shaking.",
        choices: [
          {
            t: "Row {themHim} across",
            check: {s:"sea",s2:"stealth",d:45},
            win: {
              r: "On the far shore {theyHe} kisses your hand and runs into the dark. Next week the lord's men come asking about a runaway.",
              fx: {coin:10,honor:2,them:{type:"friend",op:40}},
            },
            lose: {
              r: "Lanterns on the water. The lord's boat takes you both.",
              fx: {coin:-15,health:-5,cause:"a beating",them:{type:"friend",op:15}},
            },
          },
          {
            t: "Turn {themHim} in",
            r: "Five suns from the reeve. You do not sleep well.",
            fx: {coin:5,honor:-4,them:{type:"enemy",op:-50}},
          },
          {
            t: "Refuse, and forget you saw {themHim}",
            r: "In the morning {theirHis} bundle is gone from the beach, and so is your neighbour's skiff.",
            fx: {},
          },
        ],
      }),
      OPP(["fish"], {
        id: "cm_fish_squall",
        minRank: 1,
        maxRank: 2,
        cool: 5,
        title: "Boats caught out",
        text: "A squall comes down the coast faster than a horse. Your boat is safe in the lee of the point. Two others are not: you can see them black against the white water, and one has lost her mast.",
        choices: [
          {
            t: "Go out for them",
            check: {s:"sea",s2:"sta",d:55},
            win: {
              r: "You take four men off the dismasted boat and tow the other home. The whole beach is waiting.",
              fx: {fame:2,honor:5,rep:8,newRel:{type:"friend",op:40}},
            },
            lose: {
              r: "You reach them, and lose your own nets and nearly your boat doing it. Everyone lives.",
              fx: {coin:-20,health:-12,cause:"the squall",honor:3,rep:3},
            },
          },
          {
            t: "Throw lines from the point",
            check: {s:"ins",s2:"str",d:45},
            win: {
              r: "Your line lands across the gunwale. You haul them into the lee hand over hand.",
              fx: {honor:3,rep:3},
            },
            lose: {r:"The wind throws your lines back in your face.",fx:{happy:-2}},
          },
          {
            t: "Stay in the lee",
            r: "One boat comes home. The other does not. At the burial nobody looks at you.",
            fx: {wil:1,rep:-3,happy:-4},
          },
        ],
      }),
      OPP(["fish"], {
        id: "cm_fish_fleet",
        minRank: 2,
        minRep: 40,
        time: 2,
        cool: 6,
        title: "Three boats",
        text: "You own one boat. A widow is selling her husband's, and the salt merchant would buy every barrel three boats could fill. Three boats need crews, nets, salt and a head for numbers.",
        choices: [
          {
            t: "Buy the widow's boat (150 suns)",
            req: p=>p.coin>=150,
            r: "Two boats now, and your mark on both. The widow's son crews the second.",
            fx: {coin:-150,asset:"fishboat",rep:6,newRel:{type:"friend",op:25}},
          },
          {
            t: "Bind the village boats into one compact",
            check: {s:"diplomacy",s2:"trade",d:55},
            win: {
              r: "Five boats sell as one. The salt merchant must pay what you ask, and you ask a fair price.",
              fx: {coin:60,rep:10,fame:2},
            },
            lose: {r:"Old grudges sink the compact before it floats.",fx:{rep:-2}},
          },
          {t:"Stay small and safe",r:"One boat is enough to drown in.",fx:{}},
        ],
      }),
      OPP(["fish"], {
        id: "cm_fish_caviar",
        minRank: 1,
        maxRank: 2,
        cool: 4,
        cond: (p,C)=>inR(p,"POL-12","POL-11","POL-34"),
        title: "Black gold",
        text: "A great sturgeon, longer than you are tall, thrashes in your net on the Salt Sea. Her belly is full of roe. Old Bora of the Caviar Traders of Kultau pays well, in silver. The Morhaven buyers pay twice as much, if you can get it there before it turns.",
        choices: [
          {
            t: "Sell the roe to Old Bora",
            r: "Bora weighs it, sniffs it and pays in honest silver. 40 suns.",
            fx: {coin:40,rep:3},
          },
          {
            t: "Salt it yourself and carry it west",
            check: {s:"craft",s2:"trade",d:55},
            win: {
              r: "Packed in salt and ice, it reaches Morhaven sweet. 90 suns, and a buyer who wants more.",
              fx: {coin:90,rep:4,skill:{trade:3}},
            },
            lose: {r:"It turns on the Horse Road. You sell it to a tavern for fish-paste.",fx:{coin:5}},
          },
          {
            t: "Let her go to spawn",
            r: "Bora would call you a fool. The old fishers nod.",
            fx: {piety:2,honor:1,rep:1},
          },
        ],
      }),
      OPP(["fish"], {
        id: "cm_fish_stone_tongue",
        maxRank: 2,
        cool: 8,
        title: "A stone tongue",
        text: "Your net comes up with a tooth in it: black stone, as long as your hand, edged like a saw. The old men call them stone tongues, teeth of the Black Maw that everybody knows died out long ago. Charm-sellers pay for them. Scholars pay more.",
        choices: [
          {
            t: "Sell it to the charm-seller",
            r: "Eight suns, and it will hang round some merchant's neck against drowning.",
            fx: {coin:8},
          },
          {
            t: "Carry it to a scholar in {capital}",
            check: {s:"learning",s2:"persuasion",d:45},
            win: {
              r: "The scholar turns it in the light and pays 30 suns. Then he asks, very quietly, whether you have seen anything big in the water.",
              fx: {coin:30,int:.3,rep:2},
            },
            lose: {r:"The scholar's servant gives you 5 suns at the back door.",fx:{coin:5}},
          },
          {
            t: "Sell it as a dragon's tooth, with a story",
            check: {s:"deception",s2:"persuasion",d:50},
            win: {
              r: "A story about a burning ship and a dying captain. A Lucernan pays 45 suns and weeps.",
              fx: {coin:45,honor:-2,skill:{deception:2}},
            },
            lose: {
              r: "The buyer has seen a dozen dragon's teeth this year. He laughs, and pays 3 suns for the cheek.",
              fx: {coin:3,honor:-2},
            },
          },
          {
            t: "Keep it for luck",
            r: "It hangs over your door. Nobody in your boat drowns that year.",
            fx: {happy:3},
          },
        ],
      }),
    ]);
    A.defEvents([
      {
        id: "cm_fish_empty_nets",
        cond: (p,C)=>C.adult(p)&&fisher(p),
        cool: 6,
        title: "Empty nets",
        setup: (p,ctx)=>{ctx.fish=fishOf(p)},
        text: "Three weeks and the {fish} have not come. The nets come up with weed and crabs. The salt merchant, who advanced you salt and barrels, has started walking past your house slowly.",
        choices: [
          {
            t: "Go farther out than anyone",
            check: {s:"sea",s2:"wil",d:50},
            win: {
              r: "Two days out you find them, a whole sea of silver. You come home last and lowest in the water.",
              fx: {coin:15,rep:3,skill:{sea:3}},
            },
            lose: {r:"Two days out you find nothing but weather.",fx:{health:-6,cause:"cold and wet",wil:1}},
          },
          {
            t: "Mend nets and wait",
            r: "They come back in the fourth week, as they always do. Almost always.",
            fx: {coin:3,wil:.5},
          },
          {
            t: "Ask the salt merchant for more time",
            check: {s:"persuasion",s2:"trade",d:40},
            win: {r:"He grunts, and gives you till the Slaughter Feast.",fx:{happy:2}},
            lose: {r:"He takes your second-best net instead.",fx:{coin:-5,happy:-3}},
          },
        ],
      },
      {
        id: "cm_fish_red_sky",
        cond: (p,C)=>C.adult(p)&&fisher(p),
        cool: 6,
        title: "A red morning",
        setup: (p,ctx)=>{ctx.crone=nm(p,"F")},
        text: "Red sky at dawn, and the gulls are walking inland. Old {crone} stands at the top of the beach and tells every boat to stay ashore. Last year she was right twice and wrong once. The fish are running.",
        choices: [
          {
            t: "Go out anyway",
            check: {s:"sea",s2:"ins",d:50},
            win: {
              r: "The weather holds till noon. You are home with a full boat before the first gust.",
              fx: {coin:8,skill:{sea:2}},
            },
            lose: {
              r: "The weather does not hold. You run for the beach with the sea chasing you.",
              fx: {coin:-6,health:-8,cause:"a sudden storm",wil:1},
            },
          },
          {
            t: "Stay ashore",
            r: "By noon the sea is white. {crone} says nothing, which is worse than saying something.",
            fx: {wil:.3},
          },
          {t:"Fish the bay inside the point",r:"Small fish, safe water.",fx:{coin:3}},
        ],
      },
      {
        id: "cm_fish_seals",
        cond: (p,C)=>C.adult(p)&&fisher(p),
        cool: 7,
        title: "Seals at the nets",
        text: p=>`A bull seal has learned that your nets are a larder. Every morning there are bitten fish and torn mesh. ${inR(p,"POL-04")?"In Lucerna, killing a lagoon seal is fined.":"The other boats laugh at you, until he finds theirs."}`,
        choices: [
          {
            t: "Wait for him with a club",
            check: {s:"ins",s2:"str",d:45},
            win: {
              r: "One blow. Oil, skin, and a quiet net.",
              fx: (p,ctx)=>(p.coin+=6,p.realm==="POL-04"?(p.coin=Math.max(0,p.coin-10),"(The harbor fines you 10 suns for the seal.)"):""),
            },
            lose: {
              r: "He bites your hand and takes the club with him.",
              fx: {health:-8,cause:"a seal bite",wound:"bite"},
            },
          },
          {
            t: "Move your nets",
            r: "He finds them again within the week, but he is slower about it.",
            fx: {coin:-2},
          },
          {
            t: "Leave him a fish a day at the rocks",
            r: "He takes the gift and leaves the nets. The village thinks you are mad. The nets are whole.",
            fx: {coin:-1,happy:2,piety:1},
          },
        ],
      },
    ]);
    A.defEvents([
      OPP(["pirate"], {
        id: "cm_pirate_articles",
        young: !0,
        maxRank: 0,
        cool: 6,
        title: "Signing the Articles",
        text: "You sign the Articles with a cross and a thumbprint in the share-book that Jonas Keel keeps at the Shrine of the Dice. Anyone who can row or fight may sign. Now you need a ship, and three crews are short of hands.",
        choices: [
          {
            t: "The Redsails, Ima Redsail's raiders",
            r: "Young crews, loud songs, and talk of the old days before the toll made the Brotherhood soft.",
            fx: {flag:"cm_redsail",rep:2,happy:3,skill:{sea:2,melee:2}},
          },
          {
            t: "A toll boat of Wystan Coyle's",
            r: "Steady work meeting cogs on the Western Approach. Dull, safe and paid in Lucernan gold.",
            fx: {coin:10,rep:2,skill:{sea:2}},
          },
          {
            t: "A raft crew at Ratrock, under Sten the Quiet",
            check: {s:"wil",s2:"int",d:40},
            win: {
              r: "Sten looks at you a long time and says nothing. You are in. Nobody tells you what the rafts are for.",
              fx: {flag:"cm_ratrock",rep:4,skill:{craft:2}},
            },
            lose: {r:"Sten shakes his head once. That is all the answer you get.",fx:{happy:-2}},
          },
        ],
      }),
      OPP(["pirate"], {
        id: "cm_pirate_grapnels",
        maxRank: 1,
        cool: 3,
        title: "Grapnels",
        setup: (p,ctx)=>{ctx.prey=A.pick(["a Qadiri ship heavy with rag paper","a Varennan cog that refused the toll","a Morhaven wine ship","a Tamari grain ship blown off her course"])},
        text: "Off the bow: {prey}. Her master has run up his colours instead of paying. The grapnels are ready, and so is the crew.",
        choices: [
          {
            t: "First over the rail",
            r: "You go over with a hook in one hand and a blade in the other.",
            fx: {
              coin: 25,
              fame: 1,
              duel: {
                tier: 2,
                title: "a sailor of the prize",
                troop: "SP",
                opts: {kind:"duel",place:"a pitching deck",lethal:!0,toYield:!0,title:"Boarding"},
              },
            },
          },
          {
            t: "Go for the cabin and the master's purse",
            check: {s:"stealth",s2:"spd",d:50},
            win: {r:"The purse goes into the common pile, as the Articles say. Mostly.",fx:{coin:40,rep:2}},
            lose: {
              r: "The cabin boy has a knife and no sense of fair play.",
              fx: {health:-10,cause:"a cabin boy's knife",wound:"deep_cut"},
            },
          },
          {
            t: "Work the grapnel lines and hold the ships together",
            r: "Unglamorous and vital. The quartermaster marks it in the book.",
            fx: {coin:15,rep:2,skill:{sea:2}},
          },
          {
            t: "Shoot their helmsman from the yard",
            req: (p,C)=>C.prof(p,"xbow",40)||C.prof(p,"bow",40),
            r: "One shot. The prize falls off the wind, and the boarding is easy.",
            fx: {coin:30,rep:5,fame:1},
          },
        ],
      }),
      OPP(["pirate"], {
        id: "cm_pirate_share_out",
        minRank: 1,
        maxRank: 2,
        cool: 3,
        title: "The share-out",
        setup: (p,ctx)=>{who(p,ctx,"a crew-mate")},
        text: "Share Day after a fat prize. Jonas Keel reads the shares from the book: one to a deckhand, a share and a half to a raider, a tenth of all to the Table. You saw {them} hide a purse of Lucernan crowns before the count. Cheating at the share-out means the Drowning Post at low tide.",
        choices: [
          {
            t: "Say nothing",
            r: "The share-out goes on. Later {them} buys you a drink, and you both know why.",
            fx: {coin:30,honor:-2,them:{type:"friend",op:20}},
          },
          {
            t: "Tell the quartermaster",
            r: "{them} is tied to the Drowning Post at low tide. The crew stands and watches the water come in. Your share grows by a crown.",
            fx: {coin:54,rep:6,wil:1,them:{type:"enemy",op:-80}},
          },
          {
            t: "Make {themHim} put it back quietly",
            check: {s:"intimidation",s2:"persuasion",d:50},
            win: {
              r: "The purse is back in the pile before Keel turns the page. {They} will not forget that you could have hanged {themHim}.",
              fx: {coin:35,rep:5,honor:2,them:{type:"rival",op:-10}},
            },
            lose: {
              r: "Words, then fists, on the beach where brawls are settled.",
              fx: {
                coin: 30,
                duel: {
                  foe: "them",
                  opts: {kind:"brawl",place:"the beach below the Shrine",lethal:!1,toYield:!0,title:"Settled on the beach"},
                },
              },
            },
          },
          {
            t: "Ask for half",
            check: {s:"intrigue",s2:"deception",d:45},
            win: {r:"Half a purse of crowns, and a secret shared.",fx:{coin:80,honor:-5,them:{type:"friend",op:10}}},
            lose: {
              r: "Keel sees you both counting. The Drowning Post has room for two.",
              fx: {coin:10,health:-20,cause:"the Drowning Post",honor:-6,wil:2,rep:-6},
            },
          },
        ],
      }),
      OPP(["pirate"], {
        id: "cm_pirate_dragon_night",
        minRank: 1,
        maxRank: 3,
        cool: 8,
        cond: (p,C)=>!C.flag(p,"cm_forty"),
        title: "Dragon Night",
        text: "12 July. Fire-rafts burn in the harbor, and on the mainland the watchers swear the dragon has fed. Sten the Quiet stops you on the beach. One of the Forty is dead. The Forty know the dragon's secret, and anyone who tells it is drowned with a stone. He wants you.",
        choices: [
          {
            t: "Swear the oath of the Forty",
            r: "You learn how oil, smoke and a painted raft make a dragon that has frightened kings for fifty years. You will never tell. You will never be allowed to.",
            fx: {flag:"cm_forty",rep:10,coin:40,wil:1,skill:{craft:2,sea:2}},
          },
          {
            t: "Refuse. Some secrets are anchors",
            r: "Sten nods and walks on. For a month you notice men watching you.",
            fx: {wil:.5},
          },
          {
            t: "Swear, and keep your own counsel about it",
            check: {s:"deception",s2:"wil",d:55},
            win: {
              r: "You swear with a straight face and a crooked heart. You are one of the Forty, and you are thinking about what that is worth.",
              fx: {flag:"cm_forty",rep:8,honor:-3},
            },
            lose: {
              r: "Sten looks into you and sees it. You are not chosen, and you are watched.",
              fx: {rep:-6,newRel:{type:"enemy",op:-40}},
            },
          },
        ],
      }),
      OPP(["pirate"], {
        id: "cm_pirate_stamped_jar",
        minRank: 2,
        cool: 10,
        cond: (p,C)=>C.flag(p,"cm_forty")||C.jobRank(p,3),
        title: "The stamped jars",
        setup: (p,ctx)=>{who(p,ctx,"a buyer of dried fish")},
        text: "{them}, who claims to buy dried fish, offers 5,000 suns for one jar from the Ratrock caves: one stamped with Sabra's well-mark. One jar would prove the dragon is oil, and give Qadir and Varenna a cause for war. Whoever betrays the dragon is drowned with a stone.",
        choices: [
          {
            t: "Steal a jar and sell it",
            check: {s:"stealth",s2:"intrigue",d:70},
            win: {
              r: "The jar goes to Qadira in a crate of salt fish. You go somewhere far away with your gold, and pray the Forty never learn how.",
              fx: {coin:5e3,honor:-10,flag:"cm_traitor",wil:1},
            },
            lose: {
              r: "They catch you at the cave mouth with the jar in your arms. The Table does not take long. A stone, a rope, the harbor.",
              fx: {die:"drowned with a stone for betraying the dragon's secret"},
            },
          },
          {
            t: "Take {themHim} to Nell Brine",
            r: "The buyer goes into the sea with a stone. Nell Brine remembers your face, kindly, and your share-book grows.",
            fx: {coin:200,rep:12,fame:2,favor:10,them:{type:"enemy",op:-80}},
          },
          {
            t: "Sell {themHim} a fake",
            check: {s:"deception",s2:"craft",d:60},
            win: {
              r: "A jar of lamp oil with a well-mark cut by your own hand. Let Qadir try to prove anything with that.",
              fx: {coin:800,rep:4,skill:{deception:3}},
            },
            lose: {
              r: "{They} knows a fake when {theyHe} sees one. Two weeks later someone tries to knife you on the quay.",
              fx: {
                duel: {
                  tier: 3,
                  title: "a hired knife",
                  troop: "LI",
                  opts: {kind:"duel",place:"the quay at night",lethal:!0,toYield:!1,title:"A knife in the dark"},
                },
                them: {type:"enemy",op:-60},
              },
            },
          },
          {t:"Walk away",r:"Five thousand suns is a lot of money. A stone is a lot of stone.",fx:{}},
        ],
      }),
      OPP(["pirate"], {
        id: "cm_pirate_quartermaster",
        minRank: 1,
        maxRank: 1,
        minRep: 40,
        cool: 5,
        title: "The share-book",
        text: "Your ship's quartermaster drank himself over the side. The crew needs someone who can count shares, settle quarrels and keep the book honest. Few corsairs can read; quartermasters must. The crew is looking at you.",
        choices: [
          {
            t: "Stand for quartermaster",
            req: (p,C)=>C.literate(p),
            check: {s:"persuasion",s2:"learning",d:50},
            win: {
              r: "Hands go up all down the deck. The book is yours, and so is every quarrel.",
              fx: {promote:!0,rep:6},
            },
            lose: {r:"They pick an older hand. You keep the slate for him.",fx:{rep:1,skill:{learning:2}}},
          },
          {
            t: "Learn your letters this winter",
            req: (p,C)=>!C.literate(p),
            r: "A winter with an old quartermaster, a slate and a lot of swearing. You can read the book now. Next time.",
            fx: {literate:!0,skill:{learning:3},wil:.5},
          },
          {
            t: "Throw your support behind a friend",
            r: "He wins and remembers. A quartermaster's friend eats well.",
            fx: {coin:15,newRel:{type:"friend",op:30}},
          },
        ],
      }),
      OPP(["pirate"], {
        id: "cm_pirate_captain_vote",
        minRank: 2,
        maxRank: 2,
        minRep: 50,
        time: 2,
        cool: 6,
        title: "A ship of your own",
        setup: (p,ctx)=>{ctx.ship=A.pick(["the Varennan Pride","the Count of Ostra","the Honest Miller","the Morning Bell"])},
        text: "The crew has taken a Varennan cog, {ship}, and she is too good to sell. By the Articles a prize crew elects its own captain at the Shrine of the Dice. Two names are being shouted. One of them is yours.",
        choices: [
          {
            t: "Stand, and promise fat prizes",
            check: {s:"persuasion",s2:"command",d:55},
            win: {
              r: "The dice are thrown, the hands go up, and the ship is yours. You rename her before the paint is dry.",
              fx: {promote:!0,rep:8,fame:3},
            },
            lose: {r:"The other man promises fatter ones. He wins.",fx:{rep:-3,newRel:{type:"rival",op:-30}}},
          },
          {
            t: "Stand, and promise fair shares",
            check: {s:"diplomacy",s2:"command",d:55},
            win: {
              r: "The old hands vote for fairness, and the old hands are the most hands.",
              fx: {promote:!0,rep:8,honor:3},
            },
            lose: {r:"Fair shares lose to fat ones. They usually do.",fx:{rep:-2}},
          },
          {
            t: "Throw your vote to the other man",
            r: "He owes you now. In Blackreef that is worth more than a ship.",
            fx: {coin:20,newRel:{type:"friend",op:40}},
          },
        ],
      }),
      OPP(["pirate"], {
        id: "cm_pirate_freed_oars",
        minRank: 1,
        cool: 8,
        title: "The Freed Oars",
        setup: (p,ctx)=>{who(p,ctx,"a freed oarsman")},
        text: "Your galley's rowers are slaves taken from prizes, chained to the bench. {them}, a freed oarsman who speaks for Tam Oarsman's Freed Oars, asks you to speak at the Table for freeing your ship's bench. The captains say free men will not row for a share.",
        choices: [
          {
            t: "Speak for them at the Table",
            check: {s:"persuasion",s2:"diplomacy",d:60},
            win: {
              r: "Your ship's bench goes free. They row anyway, for shares, and row better.",
              fx: {honor:8,fame:3,rep:4,them:{type:"friend",op:50}},
            },
            lose: {
              r: "The captains laugh you down. The Freed Oars remember that you tried.",
              fx: {honor:4,rep:-4,them:{type:"friend",op:30},newRel:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Free the oarsmen on your own ship",
            req: (p,C)=>C.jobRank(p,3),
            r: "You buy out the crew's share of them, 200 suns, and strike the chains yourself. Half of them sign the Articles that night.",
            fx: {coin:-200,honor:10,fame:3,rep:2,them:{type:"friend",op:60}},
          },
          {
            t: "Sell the bench to a dealer in Sabra",
            req: (p,C)=>C.jobRank(p,3),
            r: "Three hundred suns in Sabran gold. {them} spits on your deck and walks off it.",
            fx: {coin:300,honor:-8,them:{type:"enemy",op:-70}},
          },
          {t:"Stay out of it",r:"The bench rows on. So do you.",fx:{}},
        ],
      }),
      OPP(["pirate"], {
        id: "cm_pirate_reef_crossbows",
        minRank: 1,
        maxRank: 3,
        cool: 6,
        title: "Crossbows for the queen",
        text: "Captain Brann Hollow's Reef Crossbows serve Queen Livia at Tessar for all of 1105, and she pays above the usual 35 suns a month. He needs men for dead men's places. If Prince Andros ever takes a Reef Crossbow alive, he learns who pays Blackreef, and why.",
        choices: [
          {
            t: "Go to Tessar for a season",
            check: {s:"xbow",s2:"ins",d:50},
            win: {
              r: "A season on the walls and in the ditches. You come home with Livia's silver and a crossbowman's eye.",
              fx: {coin:140,fame:2,rep:3,skill:{xbow:4}},
            },
            lose: {
              r: "A Dawn arrow finds you in the ditch at Coreria. You come home paid and limping.",
              fx: {coin:60,health:-15,cause:"an arrow at Tessar",wound:"arrow_wound",wil:1},
            },
          },
          {
            t: "Go, and sell what you see to the Dawn side",
            check: {s:"intrigue",s2:"deception",d:65},
            win: {
              r: "Andros's agents pay in Velgradan silver for the names of the queen's officers. Nobody suspects the quiet crossbowman.",
              fx: {coin:400,honor:-8,skill:{intrigue:3}},
            },
            lose: {
              r: "Hollow finds the letter. He hands you to the Articles, and the Articles hand you to Wreck Isle.",
              fx: {health:-25,cause:"marooning on Wreck Isle",wil:2.5,rep:-10,honor:-6},
            },
          },
          {t:"Stay home. Let landsmen kill landsmen",r:"The sea pays less and buries fewer.",fx:{}},
        ],
      }),
      OPP(["pirate"], {
        id: "cm_pirate_burning_boat",
        minRank: 2,
        cool: 6,
        title: "A captain who will not pay",
        setup: (p,ctx)=>{who(p,ctx,"a captive captain")},
        text: "{them}, master of a Varennan cog, has refused ransom for three months. Dragon Night is coming. By custom, a captain who will not pay is set adrift in a burning boat, and the watchers on the mainland swear the dragon has fed.",
        choices: [
          {
            t: "Keep the custom",
            r: "The boat burns well. Across the water, the watchers pray. Next year three captains pay at once.",
            fx: {coin:30,fame:3,rep:6,honor:-10},
          },
          {
            t: "Squeeze a smaller ransom out of {themHim}",
            check: {s:"intimidation",s2:"trade",d:50},
            win: {
              r: "Faced with the boat, {theyHe} finds a cousin with money after all. 200 suns.",
              fx: {coin:200,rep:4,them:{type:"enemy",op:-30}},
            },
            lose: {
              r: "{They} would rather burn than pay a pirate. {They} says so, to your face, in front of the crew.",
              fx: {rep:-2},
            },
          },
          {
            t: "Burn an empty boat, and send {themHim} home on a promise",
            check: {s:"deception",s2:"intrigue",d:55},
            win: {
              r: "The empty boat burns just as bright. {them} goes home in a fishing smack, and a year later a purse arrives from Varenna.",
              fx: {coin:120,honor:3,them:{type:"friend",op:50}},
            },
            lose: {
              r: "A boy on the beach sees the empty boat. The crew sees you differently after that.",
              fx: {rep:-8,honor:2,them:{type:"friend",op:40}},
            },
          },
          {
            t: "Put {themHim} ashore on the mainland at night",
            r: "Nobody sees. Almost nobody.",
            fx: {honor:6,rep:-4,them:{type:"friend",op:60}},
          },
        ],
      }),
      OPP(["pirate"], {
        id: "cm_pirate_shoal_lure",
        minRank: 2,
        cool: 5,
        title: "Shoal-luring",
        text: "Two Varennan war galleys are hunting your ship along the isles. The Brotherhood's rule is old: never fight a fleet in the open. Lure them onto the shoals and let the night do the rest. The Shoal Pilots know every rock by night. You know most of them.",
        choices: [
          {
            t: "Lead them over the Gull Isle shoals at dusk",
            check: {s:"sea",s2:"tactics",d:60},
            win: {
              r: "One galley strikes and sticks fast. The other stops to save her. You do not stop at all.",
              fx: {coin:100,fame:5,rep:10,skill:{tactics:3}},
            },
            lose: {
              r: "You misjudge a rock yourself. You get off it under crossbow fire.",
              fx: {coin:-50,health:-15,cause:"a Varennan crossbow",wound:"arrow_wound",rep:-4},
            },
          },
          {
            t: "Run for the reef channel and the chain",
            check: {s:"sea",s2:"spd",d:50},
            win: {r:"The chain rises behind you. The galleys stand off, outside, all night.",fx:{rep:4}},
            lose: {
              r: "They catch your stern at the channel mouth before the chain is up.",
              fx: {coin:-30,health:-10,cause:"a boarding fight"},
            },
          },
          {
            t: "Fight them in the open",
            r: "Brave, and against every rule the Brotherhood has.",
            fx: {
              fame: 2,
              rep: -2,
              duel: {
                tier: 3,
                title: "a Varennan marine",
                troop: "HI",
                opts: {kind:"duel",place:"a burning deck",lethal:!0,toYield:!0,title:"Galleys in the open"},
              },
            },
          },
        ],
      }),
      OPP(["pirate"], {
        id: "cm_pirate_contract_1011",
        minRank: 3,
        minRep: 60,
        time: 2,
        cool: 12,
        title: "The contract of 1011",
        text: "The Brotherhood's chest holds a sealed contract from 1011: Tessarian agents paid Blackreef 30,000 Leontines to sack Morhaven and never paid the rest. King Aurelio II of Morhaven would pay a fortune to see it. Nell Brine wants a captain she trusts to carry the offer to Felano. Someone else wants it stolen.",
        choices: [
          {
            t: "Carry Nell's offer to Morhaven",
            check: {s:"diplomacy",s2:"etiquette",d:60},
            win: {
              r: "Aurelio pays in Morhaven gold and swears the Coast Road Knights will never hunt your flag. Nell pays you a captain's tenth.",
              fx: {coin:1500,fame:4,rep:10,deed:"Sold the contract of 1011 to the King of Morhaven"},
            },
            lose: {
              r: "Aurelio's men seize the copy and put you on the next boat out of Felano. Nell is not pleased.",
              fx: {rep:-6,health:-8,cause:"a beating in Felano"},
            },
          },
          {
            t: "Steal it for the other buyer",
            check: {s:"stealth",s2:"intrigue",d:70},
            win: {
              r: "The contract leaves the chest in a coil of rope. Four thousand suns, and a name you must never say aloud again.",
              fx: {coin:4e3,honor:-12,flag:"cm_traitor"},
            },
            lose: {
              r: "Theft from your own Brotherhood. The Table sends you to Wreck Isle with a jug of water.",
              fx: {health:-35,cause:"marooning on Wreck Isle",wil:3,rep:-20,honor:-10},
            },
          },
          {t:"Refuse both",r:"Old paper, new blood. You want neither.",fx:{}},
        ],
      }),
      OPP(["pirate"], {
        id: "cm_pirate_captains_table",
        minRank: 3,
        maxRank: 3,
        minRep: 70,
        time: 3,
        cool: 10,
        title: "The Captains' Table",
        text: "Nell Brine is sick with the land-sickness and spends more days at sea than ashore. Ima Redsail is counting hands for a vote. Some captains want a third name shouted at the Shrine of the Dice. Yours.",
        choices: [
          {
            t: "Stand for Captain-General",
            check: {s:"persuasion",s2:"command",d:70},
            win: {
              r: "The dice are thrown, and then the hands go up like a forest. Captain-General of the Brotherhood of Blackreef.",
              fx: {
                promote: !0,
                fame: 10,
                rep: 15,
                deed: "Elected Captain-General of the Brotherhood of Blackreef",
                newRel: {type:"enemy",op:-50},
              },
            },
            lose: {
              r: "Redsail's hands go up like a forest instead. She will not forget your name.",
              fx: {rep:-8,newRel:{type:"enemy",op:-40}},
            },
          },
          {
            t: "Back Nell Brine",
            r: "Nell keeps her seat. She does not forget the captains who stood by her.",
            fx: {coin:300,rep:6,honor:3},
          },
          {
            t: "Back Ima Redsail",
            r: "Redsail wins nothing this year, but she counts you among the Old Articles now.",
            fx: {coin:200,rep:4,fame:1,flag:"cm_redsail"},
          },
        ],
      }),
    ]);
    A.defEvents([
      {
        id: "cm_pirate_wreck_isle",
        cond: (p,C)=>C.adult(p)&&corsair(p),
        cool: 7,
        title: "Wreck Isle",
        setup: (p,ctx)=>{who(p,ctx,"a crew-mate")},
        text: "{them} is accused of stealing from a crew-mate at sea: the worst crime under the Articles. The punishment is marooning on Wreck Isle. You were on watch with {themHim} that night, and the crew wants to hear what you saw.",
        choices: [
          {
            t: "Tell the truth: you saw nothing",
            r: "Without a witness the crew argues all night. {them} is let go, with every eye on {themHim}.",
            fx: {honor:2,them:{type:"friend",op:20}},
          },
          {
            t: "Swear you saw {themHim} do it",
            r: "Wreck Isle, a jug of water and the goats. You did not see a thing, and you will think about that for years.",
            fx: {coin:10,honor:-8,them:{type:"enemy",op:-80}},
          },
          {
            t: "Find the real thief",
            check: {s:"intrigue",s2:"ins",d:50},
            win: {
              r: "The missing coins turn up in the cook's spare boots. The crew roars, {them} weeps, and the cook goes to the goats.",
              fx: {rep:6,honor:3,them:{type:"friend",op:50}},
            },
            lose: {r:"You ask too many questions of the wrong men and find nothing.",fx:{rep:-2}},
          },
        ],
      },
      {
        id: "cm_pirate_dice",
        cond: (p,C)=>C.adult(p)&&corsair(p),
        cool: 5,
        title: "The dice before the raid",
        text: "Before every raid the dice are thrown at the Shrine of the Dice, for the luck-gods. Tonight they come up snake-eyes twice. The captain wants to sail anyway. The old hands are muttering.",
        choices: [
          {
            t: "Sail. Dice are bone",
            check: {s:"ins",s2:"wil",d:45},
            win: {r:"The raid goes well. You tell the old hands so, at length.",fx:{coin:20,piety:-2}},
            lose: {
              r: 'Everything goes wrong that can. Nobody says "the dice", but everyone thinks it.',
              fx: {health:-8,cause:"a raid gone wrong",wil:1},
            },
          },
          {
            t: "Throw a third time, for the crew",
            check: {s:"gambling",s2:"ins",d:50},
            win: {
              r: "Double sixes. The crew howls and the raid goes off as smooth as oil.",
              fx: {coin:25,rep:3,piety:2},
            },
            lose: {r:"Snake-eyes a third time. Even the captain goes pale and stays in port.",fx:{piety:2}},
          },
          {
            t: "Stay ashore this once",
            r: "The luck-gods reward caution, sometimes. The crew calls you careful, which is not a compliment.",
            fx: {rep:-1,piety:1},
          },
        ],
      },
      {
        id: "cm_pirate_earring",
        cond: (p,C)=>C.adult(p)&&corsair(p),
        cool: 8,
        title: "The gold earring",
        setup: (p,ctx)=>{ctx.dead=nm(p)},
        text: "{dead}, who rowed beside you three summers, died of a crossbow bolt off Ratrock. A gold earring pays for a burial: sewn into sailcloth with a stone, sunk, and the earring goes with the dead to the Drowned Queen. A widow keeps her husband's share for a year.",
        choices: [
          {
            t: "Sew the sailcloth yourself",
            r: "Every stitch through the last one goes through the nose, as the old way says. The sea takes {dead} cleanly.",
            fx: {piety:3,wil:1,honor:2},
          },
          {
            t: "Make sure the widow gets the share",
            check: {s:"persuasion",s2:"intimidation",d:45},
            win: {
              r: 'The quartermaster finds the share was "forgotten" in the book. Then he remembers it.',
              fx: {honor:4,rep:3,newRel:{type:"friend",op:35}},
            },
            lose: {r:"The book says what the book says.",fx:{honor:2,happy:-3}},
          },
          {
            t: "Keep the earring. The Queen has enough gold",
            r: "It buys a month of drink. You wake up some nights hearing water.",
            fx: {coin:12,piety:-5,honor:-4},
          },
        ],
      },
    ]);
    const WARM = [
        "POL-02",
        "POL-03",
        "POL-04",
        "POL-15",
        "POL-16",
        "POL-31",
        "POL-17",
        "POL-24",
        "POL-18",
        "POL-21",
        "POL-30",
        "POL-32",
        "POL-20",
        "POL-22",
      ],
      orchard = p=>inR(p,"POL-17","POL-24","POL-18","POL-19")?["date palms","dates","seven years"]:inR(p,"POL-21","POL-30","POL-32","POL-20","POL-22")?["pepper vines","pepper","four years"]:["vines","wine","five years"];
    A.defEvents([
      OPP(["farm"], {
        id: "cm_farm_hiring_day",
        young: !0,
        maxRank: 0,
        cool: 3,
        title: "Hiring day",
        setup: (p,ctx)=>{ctx.when=inR(p,"POL-05","POL-01","POL-14","POL-13","POL-08")?"May Fair":"Hiring day"},
        text: "{when} at {town}. Farmhands stand in a row with a wisp of straw in their hats, the sign of a hand for hire. Sixty suns a year and board is the going rate. Three masters are walking the row.",
        choices: [
          {
            t: "A rich yeoman who works his hands hard",
            r: "Dawn to dusk, and his wife feeds you like a lord. Your arms thicken by the week.",
            fx: {coin:15,rep:2,str:1,sta:1},
          },
          {
            t: "The abbey grange: easy work, pious company",
            r: "Prayers at dawn, light work, thin soup. The lay brothers know a great deal about cattle.",
            fx: {coin:8,rep:1,piety:3,skill:{husbandry:2}},
          },
          {
            t: "A widow on a farm that is failing",
            r: "She cannot pay much. She teaches you everything about running a holding, because she has nobody else to teach.",
            fx: {coin:6,rep:3,skill:{stewardship:2,husbandry:1},newRel:{type:"friend",op:30}},
          },
          {
            t: "Haggle with all three",
            check: {s:"trade",s2:"persuasion",d:40},
            win: {r:"You play them off each other and go to the yeoman for 70 a year.",fx:{coin:20,rep:2}},
            lose: {
              r: "While you haggle, they all hire someone else. You take what is left: a mean old man with a bad dog.",
              fx: {coin:5,happy:-2},
            },
          },
        ],
      }),
      OPP(["farm"], {
        id: "cm_farm_harvest_gang",
        young: !0,
        maxRank: 1,
        cool: 2,
        title: "First Loaf",
        text: "1 August, First Loaf, and the harvest gangs go out at dawn: a sun and a half a day and all the ale you can drink at noon. The fastest reaper leads the row, and the row is watching who it will be.",
        choices: [
          {
            t: "Lead the row",
            check: {s:"sta",s2:"str",d:40},
            win: {
              r: "Your row reaches the hedge first, every day for a week. The farmer gives you the last sheaf to carry home, which is an honour.",
              fx: {coin:12,rep:4,sta:.5},
            },
            lose: {r:"You go too fast and lay the sickle into your own shin.",fx:{coin:6,health:-6,cause:"a sickle"}},
          },
          {t:"Work steady in the middle of the row",r:"Steady pay for steady work.",fx:{coin:8,sta:.3}},
          {
            t: "Glean the stubble after, for your own pot",
            r: "The old right of the poor: what the reapers drop is yours. A sack of grain for the winter.",
            fx: {coin:4,piety:1,health:2},
          },
        ],
      }),
      OPP(["farm"], {
        id: "cm_farm_holding",
        maxRank: 0,
        cool: 4,
        cond: (p,C)=>!inR(p,"POL-06","POL-07","POL-11","POL-34","POL-12"),
        title: "A holding falls empty",
        setup: (p,ctx)=>{ctx.old=nm(p,"M"),ctx.lord=lordT(p)},
        text: "Old {old} has died without a son, and his holding stands empty: a cottage, a garden and a dozen strips in the open fields. {lord} will let it to a hand who can pay 12 suns entry and half the grain every year.",
        choices: [
          {
            t: "Pay the entry (12 suns)",
            req: p=>p.coin>=12,
            r: "Your own hearth, your own strips, your own mud.",
            fx: {coin:-12,promote:!0,rep:4,happy:6},
          },
          {
            t: "Ask to pay the entry after harvest",
            check: {s:"persuasion",s2:"diplomacy",d:45},
            win: {
              r: "The steward looks at your hands and agrees. You will pay in barley.",
              fx: {promote:!0,rep:3,happy:4},
            },
            lose: {r:"A man with coin in his hand gets it.",fx:{happy:-3}},
          },
          {t:"Stay a hired hand",r:"No rent, no roof of your own. Another year.",fx:{}},
        ],
      }),
      OPP(["farm"], {
        id: "cm_farm_freehold",
        minRank: 1,
        maxRank: 1,
        time: 2,
        cool: 5,
        title: "A freehold for sale",
        setup: (p,ctx)=>{ctx.lord=lordT(p),ctx.why=war(p)?"The war":"The Great Arming"},
        text: "{lord} needs coin. {why} was paid for on credit, and the creditors are at the gate. The steward is selling freeholds to the tenants who work them: your holding, yours and your children's forever, for 200 suns.",
        choices: [
          {
            t: "Buy it (200 suns)",
            req: p=>p.coin>=200,
            r: "The reeve, three witnesses and a sod of turf put in your hand. The land is yours.",
            fx: {coin:-200,asset:"farm",promote:!0,rep:6,happy:10},
          },
          {
            t: "Borrow from the moneylender and buy it",
            check: {s:"trade",s2:"stewardship",d:50},
            win: {
              r: "The moneylender lends against the harvests. The land is yours; the next few harvests are his.",
              fx: p=>{addDebt(p,200),p.assets.push({k:"farm",name:GD.PROPERTY.farm.name,y:A.S.year}),A.addRep(p,4);const C=GD.CAREERS[p.job.c];return C&&C.ranks[p.job.r+1]&&p.job.r++,"(You owe 200 suns.)"},
            },
            lose: {r:"He wants your harvests for ten years and your cow as well. You say no.",fx:{wil:.5}},
          },
          {
            t: "Club together with two neighbours for the whole furlong",
            check: {s:"diplomacy",s2:"stewardship",d:55},
            win: {
              r: "Three families, one purse, one furlong of freehold split three ways. Nobody quarrels. Yet.",
              fx: {coin:-100,asset:"farm",promote:!0,rep:5,newRel:{type:"friend",op:30}},
            },
            lose: {
              r: "The neighbours quarrel over the boundaries before the purse is full.",
              fx: {coin:-10,newRel:{type:"rival",op:-20}},
            },
          },
          {t:"Stay a tenant",r:"Land is a chain as well as a fortune.",fx:{}},
        ],
      }),
      OPP(["farm","herd"], {
        id: "cm_land_purveyance",
        minRank: 1,
        cool: 4,
        cond: (p,C)=>!inR(p,"POL-13","POL-06","POL-07"),
        title: "The lord's demands",
        setup: (p,ctx)=>{ctx.lord=lordT(p),ctx.for=war(p)?"the army":"the great household and its guests"},
        text: "Purveyors have come to the village with a cart, a list and a fixed price: grain, cheese and beasts for {for}, at half what the market pays. {lord} will settle the rest later, they say. Later never comes.",
        choices: [
          {
            t: "Hand it over",
            r: "You watch your best wether go up the road in their cart.",
            fx: {coin:-12,wil:.5,favor:2},
          },
          {
            t: "Hide the best of it in the woods",
            check: {s:"stealth",s2:"int",d:50},
            win: {
              r: "They take the thin beasts and the old cheese and leave grumbling.",
              fx: {happy:2,skill:{stealth:1}},
            },
            lose: {r:"They find the cheeses in the hollow oak, and fine you for hiding them.",fx:{coin:-20,honor:-2}},
          },
          {
            t: "Demand a tally for what they take",
            check: {s:"learning",s2:"diplomacy",d:50},
            win: {
              r: "A notched tally stick, split, half for you. Two years later the steward even pays it.",
              fx: {coin:5,rep:4},
            },
            lose: {r:"The purveyor writes your name on a different list.",fx:{coin:-12,newRel:{type:"enemy",op:-25}}},
          },
          {
            t: "Bribe the purveyor (3 suns)",
            req: p=>p.coin>=3,
            r: "He finds your farm very poor this year.",
            fx: {coin:-3,honor:-1},
          },
        ],
      }),
      OPP(["farm"], {
        id: "cm_farm_heavy_plough",
        minRank: 1,
        maxRank: 3,
        cool: 6,
        title: "The heavy plough",
        text: "A wheelwright in {town} builds heavy ploughs with an iron share and a mouldboard that turns the wet clay over like the page of a book. It needs a team of eight oxen, more than any one family owns. Your neighbours are talking about pooling their teams.",
        choices: [
          {
            t: "Pay your part (15 suns) and yoke your ox in",
            req: p=>p.coin>=15,
            check: {s:"stewardship",s2:"diplomacy",d:45},
            win: {
              r: "Eight oxen, one plough, the whole furlong turned in a week. Your yield rises by a third.",
              fx: {coin:10,rep:5,perf:8},
            },
            lose: {
              r: "The team ploughs everyone else's strip first. By the time it reaches yours the rain has come.",
              fx: {coin:-15,happy:-3},
            },
          },
          {
            t: "Buy a plough yourself and hire it out (60 suns)",
            req: p=>p.coin>=60,
            check: {s:"trade",s2:"husbandry",d:50},
            win: {
              r: "Every farm in the parish rents your plough. It pays for itself in two seasons.",
              fx: {coin:40,rep:6},
            },
            lose: {r:"The share breaks on a buried stone in the first week.",fx:{coin:-40,wil:.5}},
          },
          {t:"Stick with the old scratch plough",r:"Your grandfather fed ten children with it.",fx:{}},
        ],
      }),
      OPP(["farm"], {
        id: "cm_farm_swarm",
        minRank: 1,
        maxRank: 3,
        cool: 5,
        title: "The swarm",
        text: p=>`A swarm hangs from your apple tree like a brown beard. ${inR(p,"POL-25","POL-26")?"In the Lakeland, wax is as good as coin.":"Honey sells at half a sun a kilogram, and the church buys wax for its candles."}`,
        choices: [
          {
            t: "Shake it into a straw skep",
            check: {s:"husbandry",s2:"wil",d:40},
            win: {
              r: "One sharp shake, and they pour into the skep like smoke. By autumn: honey for the house and wax for the church.",
              fx: {coin:10,rep:2,skill:{husbandry:3}},
            },
            lose: {
              r: "They sting you half blind and fly off over the hedge.",
              fx: {health:-5,cause:"bee stings",happy:-2},
            },
          },
          {
            t: "Call the old bee-woman",
            r: "She talks to them, calls them by name, and takes half the honey for the trouble.",
            fx: {coin:4,newRel:{type:"friend",op:20}},
          },
          {t:"Leave it be",r:"By morning it is gone to somebody else's tree.",fx:{}},
        ],
      }),
      OPP(["farm"], {
        id: "cm_farm_drain_fen",
        minRank: 2,
        time: 2,
        cool: 10,
        cond: (p,C)=>!C.flag(p,"cm_fen"),
        title: "The fen",
        setup: (p,ctx)=>{ctx.lordt=lordt(p)},
        text: "Below your fields lies a fen: reeds, geese and fever. Dyked and ditched, it would be the best black soil in {home}. It needs a dyke, a sluice, three summers and every strong back in the parish.",
        choices: [
          {
            t: "Lead the work and pay the diggers (120 suns)",
            req: p=>p.coin>=120,
            check: {s:"stewardship",s2:"str",d:55},
            win: {
              r: "Three summers of mud. Then barley where the geese were, and your name on the sluice-stone.",
              fx: {coin:-120,asset:"farm",rep:12,flag:"cm_fen",masterwork:"the dyke and sluice of the {home} fen"},
            },
            lose: {
              r: "Fen fever comes before the dyke is done. The diggers go home, and so do you, shaking.",
              fx: {coin:-120,health:-10,cause:"fen fever",wil:1.5},
            },
          },
          {
            t: "Ask {lordt} to pay, and share the new land",
            check: {s:"diplomacy",s2:"persuasion",d:50},
            win: {
              r: "They pay for the sluice. You get a third of the new land for the labour.",
              fx: {coin:30,rep:8,flag:"cm_fen"},
            },
            lose: {r:"The answer is no. Somebody up there likes geese.",fx:{}},
          },
          {t:"Leave the geese their fen",r:"Some land is better wet.",fx:{}},
        ],
      }),
      OPP(["farm"], {
        id: "cm_farm_army_grain",
        minRank: 2,
        cool: 4,
        title: "Grain for the army",
        text: p=>`${war(p)?"The army is marching, and an army eats the land it crosses.":`The garrison at ${cap(p)} is buying for the winter.`} A quartermaster offers 5 suns a bushel for a hundred bushels, near twice the market price, paid in ${A.pick(["silver","the crown's paper","silver, mostly"])}.`,
        choices: [
          {
            t: "Sell him a hundred bushels",
            check: {s:"trade",s2:"ins",d:45},
            win: {r:"He pays in good silver. 250 suns, the best price you have ever had.",fx:{coin:250,rep:4}},
            lose: {r:"The crown's paper is worth half its face, and the moneychanger knows it.",fx:{coin:60,wil:.5}},
          },
          {
            t: "Hold the grain for the hungry months",
            check: {s:"stewardship",s2:"int",d:50},
            win: {r:"In spring bread costs three times as much, and you have grain.",fx:{coin:320,rep:3}},
            lose: {r:"Rats and damp take a third of it.",fx:{coin:40,happy:-3}},
          },
          {
            t: "Give a share to the soldiers' families",
            r: "Their men are gone with the army. You fill their bins first and sell the rest.",
            fx: {coin:100,honor:4,rep:4,newRel:{type:"friend",op:30}},
          },
        ],
      }),
      OPP(["farm"], {
        id: "cm_farm_orchard",
        minRank: 2,
        maxRank: 3,
        cool: 10,
        cond: (p,C)=>inR(p,...WARM)&&!C.flag(p,"cm_vines"),
        title: "The south slope",
        setup: (p,ctx)=>{const o=orchard(p);ctx.crop=o[0],ctx.yield=o[1],ctx.wait=o[2]},
        text: "The south slope above your house is too stony for wheat. A buyer from the coast says it is perfect for {crop}: {wait} before the first good crop of {yield}, and after that, money every autumn for the rest of your life.",
        choices: [
          {
            t: "Plant the slope (40 suns of cuttings)",
            req: p=>p.coin>=40,
            r: "You plant, water, curse the goats and wait.",
            fx: {coin:-40,rep:2,flag:"cm_vines",skill:{husbandry:2}},
          },
          {
            t: "Plant half and keep half for barley",
            req: p=>p.coin>=20,
            r: "Half a gamble. You plant and wait.",
            fx: {coin:-20,rep:1,flag:"cm_vines"},
          },
          {t:"Leave the slope to the goats",r:"Goats are a crop too.",fx:{}},
        ],
      }),
      OPP(["farm"], {
        id: "cm_farm_red_wheat",
        minRank: 2,
        cool: 8,
        title: "New seed",
        text: "The lay brothers of the grange have a red-eared wheat that stands up in the wind and shrugs off rust. They will trade you a sack of it for two sacks of yours, if you swear before the altar to share it with your neighbours after.",
        choices: [
          {
            t: "Trade, and share the seed",
            r: "Within three years the whole valley sows red wheat, and everyone knows where it came from.",
            fx: {coin:20,rep:8,honor:3,newRel:{type:"friend",op:25}},
          },
          {
            t: "Trade, and keep it for yourself",
            r: "Your yield rises; your neighbours' does not. They notice.",
            fx: {coin:60,rep:2,honor:-4,piety:-2},
          },
          {
            t: "Breed it on with your own best ears",
            req: (p,C)=>C.prof(p,"husbandry",45),
            check: {s:"husbandry",s2:"int",d:60},
            win: {
              r: "Five years of choosing the best ears by hand. The wheat that comes of it is known three counties away by your name.",
              fx: {coin:40,rep:12,masterwork:"the {home} red wheat"},
            },
            lose: {r:"Your crosses lodge in the first storm. Back to the grange seed.",fx:{skill:{husbandry:2}}},
          },
          {t:"Your own seed is good enough",r:"Your father's seed, his father's before.",fx:{}},
        ],
      }),
      OPP(["farm"], {
        id: "cm_farm_reeve",
        minRank: 3,
        minRep: 50,
        cool: 6,
        title: "The reeve's staff",
        text: "At the Slaughter Feast the village chooses a reeve: to collect the dues, call the ploughing days, settle the boundaries and take the blame. Nobody wants the staff. Everybody wants you to have it.",
        choices: [
          {
            t: "Take the staff",
            check: {s:"stewardship",s2:"diplomacy",d:55},
            win: {
              r: "A year of quarrels, fines and tally sticks. The dues come in, the fields are sown on time, and nobody starves.",
              fx: {coin:30,rep:12,fame:2},
            },
            lose: {
              r: "You fine a neighbour's son for letting his pigs into the wheat, and the village splits down the middle.",
              fx: {rep:-4,newRel:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Take it, and make it pay",
            check: {s:"intrigue",s2:"stewardship",d:55},
            win: {
              r: "A penny on this fine, a sheaf off that tally. Nobody can prove a thing.",
              fx: {coin:80,rep:2,honor:-5},
            },
            lose: {r:"The steward audits the tallies.",fx:{punish:"theft"}},
          },
          {t:"Refuse it",r:"Another man takes the staff. Within a month he fines you.",fx:{coin:-3}},
        ],
      }),
    ]);
    A.defEvents([
      {
        id: "cm_farm_harvest_home",
        cond: (p,C)=>C.adult(p)&&farmer(p)&&free(p),
        cool: 4,
        title: "Harvest Home",
        text: "The last load is in. Harvest Home: the last sheaf is plaited into a corn maiden, the barn is swept for dancing, and the fiddler has been drinking since noon. Someone has to carry the maiden in.",
        choices: [
          {
            t: "Carry the corn maiden",
            r: "You carry her in on your shoulders to a roar. Whoever carries the maiden is lucky in love, they say.",
            fx: (p,ctx)=>(p.happy=A.clamp(p.happy+6,0,100),!A.C.married(p)&&A.chance(.5)?A.applyFx(p,{lover:!0},ctx):""),
          },
          {
            t: "Dance until the fiddler falls over",
            r: "He falls over at midnight. You dance on without music.",
            fx: {happy:8,sta:.3},
          },
          {
            t: "Slip away and count the barn",
            r: "The village dances. You know to the bushel what the winter holds.",
            fx: {skill:{stewardship:2},happy:-1},
          },
        ],
      },
      {
        id: "cm_farm_army_passes",
        cond: (p,C)=>C.adult(p)&&farmer(p)&&C.atWar(p),
        w: 1.2,
        cool: 5,
        title: "The army passes",
        text: "An army marches down the valley road, your own side's. It camps for two nights on your stubble, burns your fences for firewood and eats everything that cannot run. An army eats the land it crosses. A captain is handing out chits.",
        choices: [
          {
            t: "Take the chit",
            r: "A scrap of parchment promising 20 suns. You nail it to the door, where it will stay.",
            fx: {coin:-15,wil:1},
          },
          {
            t: "Drive the beasts into the woods before they come",
            check: {s:"husbandry",s2:"stealth",d:45},
            win: {
              r: "The beasts spend two nights in the hazel. The army eats your neighbour's.",
              fx: {coin:-5,skill:{husbandry:1}},
            },
            lose: {
              r: "A foraging party finds them, and you, and is not amused.",
              fx: {coin:-25,health:-6,cause:"a soldier's fist"},
            },
          },
          {
            t: "Sell them food at a fair price before they take it",
            check: {s:"trade",s2:"persuasion",d:50},
            win: {
              r: "The quartermaster pays you in silver to keep his men from looting. Everyone is surprised, you most of all.",
              fx: {coin:15,rep:2},
            },
            lose: {r:"He takes it anyway and laughs.",fx:{coin:-20}},
          },
        ],
      },
      {
        id: "cm_farm_slaughter_feast",
        cond: (p,C)=>C.adult(p)&&farmer(p),
        cool: 5,
        title: "The Slaughter Feast",
        setup: (p,ctx)=>{who(p,ctx,"a drover")},
        text: "November: the Slaughter Feast, when the beasts that cannot be fed through winter are killed and salted. {them}, a drover, offers to buy your two pigs live for 5 suns, saving you the work. Pigs are 3 suns each at market.",
        choices: [
          {
            t: "Kill and salt them yourself",
            r: "Blood pudding, bacon in the chimney, lard in the crock. The winter smells of smoke and salt.",
            fx: {health:3,happy:3,coin:2},
          },
          {t:"Sell to the drover",r:"Five suns and no blood on your hands.",fx:{coin:5}},
          {
            t: "Haggle him up",
            check: {s:"trade",s2:"ins",d:40},
            win: {r:"Seven suns, and he respects you for it.",fx:{coin:7,them:{type:"acquaint",op:10}}},
            lose: {r:"He walks off and buys from your neighbour for four.",fx:{}},
          },
        ],
      },
      {
        id: "cm_farm_vintage",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"cm_vines")&&since(p,"cm_vines")>=5,
        w: 2,
        cool: 3,
        title: "The first good crop",
        setup: (p,ctx)=>{const o=orchard(p);ctx.crop=o[0],ctx.yield=o[1]},
        text: "The {crop} on the south slope have come into their own. This year's {yield} is good, the buyer from the coast says, better than good. He will take all of it.",
        choices: [
          {
            t: "Sell it all to the buyer",
            r: "Silver every autumn, as he promised. 60 suns this year, more next.",
            fx: {coin:60,rep:3},
          },
          {
            t: "Make your own name with it",
            check: {s:"craft",s2:"trade",d:55},
            win: {
              r: "You sell under your own mark in {town}. By the third year innkeepers ask for it by name.",
              fx: {coin:90,rep:10,masterwork:"the {yield} of {home}",unflag:"cm_vines"},
            },
            lose: {r:"Your first batch goes bad in the cask. The buyer takes the rest at a lower price.",fx:{coin:25}},
          },
          {
            t: "Give the first of it to the temple",
            r: "The first fruits to the gods, as is right. The rest sells well.",
            fx: {coin:40,piety:4},
          },
        ],
      },
      {
        id: "cm_farm_hunt_trample",
        cond: (p,C)=>C.adult(p)&&farmer(p)&&!inR(p,"POL-13","POL-06","POL-07","POL-11","POL-34","POL-12"),
        cool: 7,
        title: "The hunt rides through",
        text: "A hunt comes over the hedge in full cry: twenty horses, forty hounds and a lord's son who has never paid for a thing in his life. They go straight across your green wheat, and the field behind them looks like a ploughed road.",
        choices: [
          {
            t: "Stand in the gap and shout",
            check: {s:"wil",s2:"intimidation",d:55},
            win: {
              r: "The lord's son reins in, red-faced, and throws you a purse to make you stop shouting.",
              fx: {coin:15,honor:2,rep:2},
            },
            lose: {
              r: "A riding whip across your face is the only answer.",
              fx: {health:-6,cause:"a riding whip",wound:"scar_face",wil:1.5},
            },
          },
          {
            t: "Go to the manor court for damages",
            check: {s:"learning",s2:"diplomacy",d:60},
            win: {
              r: "The old steward is honest. You get 10 suns and a dirty look from the son.",
              fx: {coin:10,rep:3,newRel:{type:"enemy",op:-20}},
            },
            lose: {r:"The court is the lord's court. You pay the costs.",fx:{coin:-5,happy:-4}},
          },
          {t:"Resow and say nothing",r:"Late seed, thin crop. The lords ride on.",fx:{coin:-6,wil:1}},
        ],
      },
    ]);
    const stock = p=>inR(p,"POL-11","POL-12","POL-34")||terr(p)==="steppe"?["horses","mares","foals","stallion","dun mares"]:inR(p,"POL-19","POL-24","POL-17")||terr(p)==="desert"?["camels","she-camels","calves","bull camel","racing camels"]:inR(p,"POL-27")||terr(p)==="mountains"&&!inR(p,"POL-13")?["yaks","yak cows","calves","yak bull","white yaks"]:inR(p,"POL-13","POL-20","POL-22","POL-05")||terr(p)==="hills"?["cattle","cows","calves","bull","red cattle"]:["sheep","ewes","lambs","ram","longwool sheep"],
      setStock = (p,ctx)=>{const s=stock(p);ctx.herd=s[0],ctx.mothers=s[1],ctx.young=s[2],ctx.sire=s[3],ctx.line=s[4]};
    A.defEvents([
      OPP(["herd"], {
        id: "cm_herd_shielings",
        young: !0,
        maxRank: 0,
        cool: 3,
        title: "Up to the high pasture",
        setup: (p,ctx)=>{setStock(p,ctx)},
        text: "Midsummer, and the village {herd} go up to the high grazing for three months. Somebody has to go with them and sleep in a stone hut with the wind for company. The headman looks at you.",
        choices: [
          {
            t: "Go up alone",
            check: {s:"survival",s2:"wil",d:35},
            win: {
              r: "Three months of wind, stars and your own voice. You bring every beast down fat in September, and the village sees it.",
              fx: {rep:5,coin:4,wil:1,skill:{survival:3,husbandry:2}},
            },
            lose: {
              r: "A storm scatters them. You find all but two, and you come down thin and quiet.",
              fx: {rep:1,wil:1.5,health:-4,cause:"cold nights on the hill"},
            },
          },
          {
            t: "Go up with your cousin",
            r: "Two can keep a fire going. You come down with the herd and a hundred new songs.",
            fx: {rep:2,coin:3,happy:4,skill:{husbandry:2}},
          },
          {t:"Beg off",r:"Somebody else goes. Somebody else gets the credit.",fx:{rep:-1}},
        ],
      }),
      OPP(["herd"], {
        id: "cm_herd_birthing",
        young: !0,
        maxRank: 1,
        cool: 2,
        title: "A night of births",
        setup: (p,ctx)=>{setStock(p,ctx)},
        text: "Late snow, and the {mothers} have picked tonight to give birth, all of them, one after another. One is in trouble: a breech, legs first, and the mother is tiring.",
        choices: [
          {
            t: "Turn the young one inside her",
            check: {s:"husbandry",s2:"sta",d:40},
            win: {
              r: "Arm to the elbow, eyes shut, by feel. It comes out the right way round and stands within the hour.",
              fx: {rep:4,coin:3,skill:{husbandry:4}},
            },
            lose: {
              r: "You save the mother. The young one does not live to see the morning.",
              fx: {rep:1,wil:1,skill:{husbandry:2}},
            },
          },
          {
            t: "Run for the herd-master",
            r: "He comes cursing in his nightshirt, saves both and tells everyone you had the sense to fetch him.",
            fx: {rep:2,skill:{husbandry:1}},
          },
          {t:"Let nature decide",r:"Nature decides badly.",fx:{rep:-2,happy:-3}},
        ],
      }),
      OPP(["herd"], {
        id: "cm_herd_dog",
        maxRank: 2,
        cool: 5,
        cond: (p,C)=>stock(p)[0]==="sheep"||stock(p)[0]==="cattle",
        title: "A dog worth a cow",
        setup: (p,ctx)=>{ctx.dog=A.pick(["Fly","Bess","Ash","Moss","Tam","Nell"]),setStock(p,ctx)},
        text: "Your young dog {dog} has the eye: she holds the {herd} with a look. At the fair in {town} there is a trial: twelve dogs, three {herd}, one pen. The prize is a silver collar and the right to boast all winter. A farmer has already offered 10 suns for her.",
        choices: [
          {
            t: "Run her in the trial",
            check: {s:"husbandry",s2:"int",d:45},
            win: {
              r: "Whistle, drop, come by. The {herd} walk into the pen like guests. Silver collar, and twice the offers.",
              fx: {coin:8,rep:5,fame:1,skill:{husbandry:3}},
            },
            lose: {r:"She splits the {herd} and chases one into the beer tent.",fx:{happy:-2,rep:-1}},
          },
          {t:"Sell her for 10 suns",r:"A good price. The farm feels empty without her.",fx:{coin:10,happy:-3}},
          {
            t: "Keep her working at home",
            r: "Better a good dog at home than a famous one at a fair.",
            fx: {perf:4,skill:{husbandry:1}},
          },
        ],
      }),
      OPP(["herd"], {
        id: "cm_herd_drove",
        minRank: 1,
        maxRank: 2,
        time: 2,
        cool: 3,
        title: "The long drove",
        setup: (p,ctx)=>{setStock(p,ctx),ctx.road=inR(p,"POL-13")?"down the drove roads and over the passes to Kingsmere, paying the League's toll on every head":inR(p,"POL-12","POL-11","POL-34")?"west along the Horse Road to the channel-shore fairs, where Greyhaven buyers pay before the horses sail":inR(p,"POL-19","POL-24","POL-17")?"to the caravan market, where camels fetch 80 suns a head":inR(p,"POL-27")?"down from the Roof to the monastery markets":`down the old roads to ${cap(p)}`},
        text: "Two hundred {herd} must go {road}. It is weeks of walking, river crossings, thieves and tolls. The man who brings them in fat gets a share; the man who loses them gets a reputation.",
        choices: [
          {
            t: "Drive them the long safe way",
            check: {s:"husbandry",s2:"sta",d:45},
            win: {
              r: "Every beast arrives, and fat. You walk home with 50 suns and a name among the dealers.",
              fx: {coin:50,rep:6,sta:.5,skill:{husbandry:3}},
            },
            lose: {r:"They lose condition on the bad grass. The buyers pay for bones.",fx:{coin:15,rep:-2}},
          },
          {
            t: "Swim them across the river to save a week",
            check: {s:"riding",s2:"husbandry",d:52},
            win: {
              r: "You go in first on a good horse and the herd follows you across. A week saved, a week of grass gained.",
              fx: {coin:70,rep:8,skill:{riding:3}},
            },
            lose: {
              r: "The current takes a dozen beasts and nearly you.",
              fx: {coin:-30,health:-10,cause:"drowning",rep:-4,wil:1},
            },
          },
          {
            t: "Sell at the first market and come home early",
            r: "A smaller price, a shorter walk, no stories.",
            fx: {coin:25,rep:1},
          },
        ],
      }),
      OPP(["herd"], {
        id: "cm_herd_flock_sale",
        minRank: 1,
        maxRank: 2,
        cool: 4,
        title: "A herd for sale",
        setup: (p,ctx)=>{setStock(p,ctx),ctx.old=nm(p,"M")},
        text: "{old}, who has kept {herd} on the next hill for fifty years, is too old to climb it. His sons are dead or gone. He will sell the whole herd, dogs and all, to someone who will not let them go to strangers.",
        choices: [
          {
            t: "Buy the whole herd (200 suns)",
            req: p=>p.coin>=200,
            r: "Twice the beasts, twice the work, and an old man who comes to watch you every evening and tell you what you are doing wrong.",
            fx: {coin:-200,rep:8,perf:10,newRel:{type:"mentor",op:40}},
          },
          {
            t: "Buy the best third (70 suns)",
            req: p=>p.coin>=70,
            r: "You pick the best. The rest go to a dealer. The old man does not watch that.",
            fx: {coin:-70,rep:3,perf:5},
          },
          {
            t: "Offer to keep them on shares while he lives",
            check: {s:"persuasion",s2:"husbandry",d:50},
            win: {
              r: "Half the increase for him, half for you, till he dies. When he dies, he leaves you the lot.",
              fx: {rep:6,coin:20,newRel:{type:"friend",op:40}},
            },
            lose: {r:"He wants coin, not promises.",fx:{}},
          },
          {t:"Let a dealer have them",r:"You watch them go down the valley in a dealer's hands.",fx:{}},
        ],
      }),
      OPP(["herd"], {
        id: "cm_herd_wool_buyer",
        minRank: 1,
        maxRank: 3,
        cool: 4,
        cond: (p,C)=>["sheep","yaks","camels"].includes(stock(p)[0]),
        title: "Next year's fleece",
        setup: (p,ctx)=>{setStock(p,ctx),ctx.buyer=inR(p,"POL-27")?"A Stonehold buyer of yak wool":inR(p,"POL-19","POL-24","POL-17")?"A tent-maker from the coast":inR(p,"POL-03","POL-16","POL-02")?"A buyer for the Palella weavers":"A wool buyer from the cloth towns"},
        text: "{buyer} wants to buy next year's clip now, at this year's price, coin in hand today. If the price rises he wins; if your {herd} die over the winter, you owe him wool you do not have.",
        choices: [
          {
            t: "Sell next year's clip now",
            check: {s:"trade",s2:"husbandry",d:45},
            win: {r:"A mild winter, a heavy clip, and his money already spent on a new barn.",fx:{coin:40,rep:4}},
            lose: {
              r: "A hard winter. You buy wool from your neighbours at a loss to fill his bales.",
              fx: {coin:-20,wil:1},
            },
          },
          {t:"Sell half now, half later",r:"Half a gamble. Half a profit.",fx:{coin:20,rep:2}},
          {
            t: "Wait and sell at shearing",
            r: "You take what the market gives you at the time. This year it gives a fair price.",
            fx: {coin:15},
          },
        ],
      }),
      OPP(["herd"], {
        id: "cm_herd_murrain",
        minRank: 1,
        cool: 7,
        title: "Murrain",
        setup: (p,ctx)=>{setStock(p,ctx)},
        text: "Murrain in the next valley: {herd} coughing, swelling and dying in a week. Nobody on Ardan knows what carries it, but every herder knows that herds which never meet do not share it. The cattle market at {town} opens on Monday.",
        choices: [
          {
            t: "Shut your herd away from every other",
            check: {s:"husbandry",s2:"wil",d:50},
            win: {
              r: "Walls, ditches, no visitors, no market. A hard month. Your herd is the only one in the valley untouched.",
              fx: {rep:8,skill:{husbandry:3},fame:1},
            },
            lose: {
              r: "A stray from the next valley jumps your wall. You lose a third of the herd.",
              fx: {coin:-40,wil:1.5,rep:-2},
            },
          },
          {
            t: "Sell everything at Monday's market, quick",
            r: "You sell before the news arrives. Somebody else's herd dies of yours.",
            fx: {coin:60,honor:-6,rep:-3},
          },
          {
            t: "Ask the shaman or the priest for a blessing",
            check: {s:"faith",s2:"wil",d:55},
            win: {
              r: "Smoke, prayers, a charm on the gatepost. The murrain passes your door, and you are not sure why.",
              fx: {piety:4},
            },
            lose: {r:"The charm does nothing. The murrain does a great deal.",fx:{coin:-50,piety:1,wil:1}},
          },
        ],
      }),
      OPP(["herd"], {
        id: "cm_herd_grazing",
        minRank: 1,
        maxRank: 3,
        cool: 6,
        title: "Whose grass",
        text: p=>inR(p,"POL-11","POL-34")?"A clan from the north has driven its herds onto your winter grazing. The Law of the Grass is old and clear, and the clan-mothers keep it; it is also very long, and everyone remembers a different part of it.":inR(p,"POL-12")?"Since the Compact of 925 every tribe has its own pastures, and another tribe's herds are on yours. The chiefs will meet. The herds are already eating.":`${lordT(p)} has fenced half the common grazing for private pasture. Your beasts have nowhere to go, and the fence posts are still wet.`,
        choices: [
          {
            t: "Plead your case at the council or the fire",
            check: {s:"diplomacy",s2:"learning",d:50},
            win: {
              r: "You know the old law better than they do, and you say it calmly. The grazing is given back.",
              fx: {rep:8,honor:2,skill:{diplomacy:2}},
            },
            lose: {r:"The older voice wins. You graze the poor ground this year.",fx:{coin:-15,rep:-2}},
          },
          {
            t: "Drive your herd onto it anyway",
            check: {s:"riding",s2:"intimidation",d:55},
            win: {r:"Nobody wants to fight over grass this year. Your herd eats.",fx:{coin:10,rep:3}},
            lose: {
              r: "They do want to fight over grass.",
              fx: {
                coin: -10,
                duel: {
                  tier: 2,
                  title: "an angry herdsman",
                  troop: "SL",
                  opts: {kind:"brawl",place:"the disputed pasture",lethal:!1,toYield:!0,title:"Whose grass"},
                },
              },
            },
          },
          {
            t: "Pay for grazing elsewhere",
            r: "A herd that eats is better than a herd that is right.",
            fx: {coin:-12},
          },
        ],
      }),
      OPP(["herd"], {
        id: "cm_herd_famous_line",
        minRank: 2,
        minRep: 45,
        time: 2,
        cool: 10,
        cond: (p,C)=>!C.flag(p,"cm_line"),
        title: "A line to be proud of",
        setup: (p,ctx)=>{setStock(p,ctx)},
        text: "One {sire} in a generation is like this one: deep-chested, sound, gentle, and every one of his young takes after him. Breed him to your best {mothers} for ten years, keep only the best, and your {line} could be known across {realmShort}. It will cost you the best grazing and every spare sun.",
        choices: [
          {
            t: "Give your life to the line",
            check: {s:"husbandry",s2:"int",d:60},
            win: {
              r: "Ten years of choosing, culling and hoping. Buyers come from three realms to see them now.",
              fx: {coin:150,rep:14,flag:"cm_line",masterwork:"the {line} of {home}"},
            },
            lose: {
              r: "The line throws weak young in the third year. You go back to plain stock, poorer and wiser.",
              fx: {coin:-40,skill:{husbandry:3},wil:1},
            },
          },
          {
            t: "Sell the {sire} to a great house (120 suns)",
            r: "A lord's steward pays 120 suns and takes him away in a painted cart.",
            fx: {coin:120,rep:3},
          },
          {
            t: "Hire him out to the neighbours",
            r: "Stud fees, a little every season. Half the valley's {young} look like him within five years.",
            fx: {coin:40,rep:5,newRel:{type:"friend",op:20}},
          },
        ],
      }),
      OPP(["herd"], {
        id: "cm_herd_raiders_gold",
        minRank: 2,
        cool: 6,
        title: "A buyer from far away",
        setup: (p,ctx)=>{setStock(p,ctx),ctx.buyer=A.pick(["a quartermaster of the Golden Horse of Zanara","an agent of the Morhaven Coast Road Knights","a steward of House Redley of Greyhaven","a Sabran emir's stablemaster"]),ctx.lordt=lordt(p),ctx.Buyer=A.cap(ctx.buyer)},
        text: "{Buyer} has ridden a long way to see your {herd}. He wants forty of the best, and he pays in gold. He also asks a great many questions about water, roads and how many riders the next valley could raise.",
        choices: [
          {
            t: "Sell him forty of the best",
            r: "Heavy gold, good beasts, a long cloud of dust going away. You try not to think about the questions.",
            fx: {coin:180,rep:6},
          },
          {
            t: "Sell, but answer none of his questions",
            check: {s:"trade",s2:"intrigue",d:50},
            win: {
              r: "He pays, and gets nothing but {herd}. Later you hear he was a spy, and that he went home empty-handed.",
              fx: {coin:160,rep:6,favor:3},
            },
            lose: {r:"Offended, he buys from your neighbour.",fx:{rep:-1}},
          },
          {
            t: "Report him to {lordt}",
            r: "Men ride out to ask him their own questions. You get a small reward and no sale.",
            fx: {coin:15,favor:5,honor:1},
          },
        ],
      }),
      OPP(["herd"], {
        id: "cm_herd_judgement",
        minRank: 3,
        minRep: 50,
        cool: 5,
        title: "The herd-lord's fire",
        setup: (p,ctx)=>{setStock(p,ctx)},
        text: "Two families have quarrelled for a year over a spring and the {herd} that drink from it. Now there is blood on a cousin's head, and both sides have come to your fire to be judged. Whatever you decide, half of them will hate you.",
        choices: [
          {
            t: "Split the water by days, and fine the one who struck first",
            check: {s:"diplomacy",s2:"wil",d:55},
            win: {
              r: "Grumbling on both sides, which is how you know it was fair. The valley talks of your judgement for years.",
              fx: {rep:12,fame:2,honor:3},
            },
            lose: {
              r: "The family you fined leaves your fire cursing. That winter someone opens your fold gate.",
              fx: {rep:-4,coin:-20,newRel:{type:"enemy",op:-40}},
            },
          },
          {
            t: "Give the spring to the richer family",
            r: "Peace, of a kind. The poorer family moves away, and takes its daughters' dowries with it.",
            fx: {coin:30,rep:2,honor:-4},
          },
          {
            t: "Make them wrestle for it, as the old way allows",
            check: {s:"command",s2:"intimidation",d:45},
            win: {
              r: "One fall, in front of everyone. The loser accepts it because everyone saw it.",
              fx: {rep:6,fame:1},
            },
            lose: {r:"The wrestling becomes a brawl, and the brawl becomes a feud.",fx:{rep:-6}},
          },
        ],
      }),
    ]);
    A.defEvents([
      {
        id: "cm_herd_fog",
        cond: (p,C)=>C.adult(p)&&herder(p),
        cool: 6,
        title: "Lost in the fog",
        setup: (p,ctx)=>{setStock(p,ctx)},
        text: "The cloud comes down onto the hill in an hour, thick as wool. You cannot see your own hand, let alone the {herd}. Somewhere below there is a cliff.",
        choices: [
          {
            t: "Sit still and call them to you",
            check: {s:"husbandry",s2:"wil",d:45},
            win: {
              r: "Hours of calling. They come out of the white one by one, to your voice, and lie down round you.",
              fx: {wil:1,skill:{husbandry:2}},
            },
            lose: {r:"When the fog lifts, three are at the bottom of the cliff.",fx:{coin:-12,wil:1}},
          },
          {
            t: "Walk the hill by memory",
            check: {s:"survival",s2:"ins",d:50},
            win: {
              r: "Every stone in the right place. You bring them down at dusk, not one missing.",
              fx: {skill:{survival:3}},
            },
            lose: {
              r: "You find the cliff edge with your foot.",
              fx: {health:-10,cause:"a fall in the fog",wound:"bad_knee"},
            },
          },
          {t:"Let the dog do it",r:"The dog knows. The dog has always known.",fx:{happy:2}},
        ],
      },
      {
        id: "cm_herd_spring_gathering",
        cond: (p,C)=>C.adult(p)&&herder(p),
        cool: 4,
        title: "The spring gathering",
        setup: (p,ctx)=>{setStock(p,ctx),ctx.contest=ctx.herd==="sheep"?"who can shear the most fleeces by noon":ctx.herd==="horses"?"who can break a yearling bareback":ctx.herd==="camels"?"whose camel wins the race to the well":"who can throw a yearling bull"},
        text: "Every family in the valley brings its {herd} down for the spring count, the marking and the gossip. By afternoon the young men and women are arguing about {contest}.",
        choices: [
          {
            t: "Enter the contest",
            check: {s:"husbandry",s2:"str",d:50},
            win: {
              r: "You win, with dust in your teeth and the valley cheering. Three families invite you to supper.",
              fx: {fame:1,happy:6,rep:3,newRel:{type:"friend",op:25}},
            },
            lose: {
              r: "You lose, badly and in public. Everyone is very kind about it, which is worse.",
              fx: {happy:-3,health:-3,cause:"a bruising",wil:.5},
            },
          },
          {
            t: "Trade beasts on the side",
            check: {s:"trade",s2:"husbandry",d:45},
            win: {r:"You swap two plain beasts for one good one. The best trade of the year.",fx:{coin:10,perf:4}},
            lose: {r:"You swap two plain beasts for one that limps by evening.",fx:{coin:-6}},
          },
          {
            t: "Sit with the old people and listen",
            r: "Who married whom, which spring dried up in 1061, where the wolves den. Worth more than a contest.",
            fx: {int:.3,skill:{husbandry:1,survival:1}},
          },
        ],
      },
      {
        id: "cm_herd_stranger",
        cond: (p,C)=>C.adult(p)&&herder(p),
        cool: 7,
        title: "A stranger at the fire",
        setup: (p,ctx)=>{who(p,ctx,"a stranger on the hill"),ctx.law=inR(p,"POL-11","POL-34")?"Under the Law of the Fire a guest who comes in peace may not be harmed or given up.":inR(p,"POL-19")?"A traveller who accepts water is under the clan's protection, even a blood enemy.":"Hospitality on the hill is older than any lord's law."},
        text: "{them} comes out of the dark to your fire, soaked, with a cut on {theirHis} arm and no pack. {law} At dawn, two riders come up the track asking about a fugitive with a cut arm.",
        choices: [
          {
            t: "Shelter your guest",
            check: {s:"deception",s2:"wil",d:45},
            win: {
              r: "You send the riders the wrong way with a straight face. {them} leaves at noon, and swears {theyHe} will repay it.",
              fx: {honor:4,them:{type:"friend",op:50}},
            },
            lose: {
              r: "They do not believe you, and they search. They find {themHim} and give you a beating for the lie.",
              fx: {health:-10,cause:"a beating",honor:3,them:{type:"friend",op:30}},
            },
          },
          {
            t: "Give {themHim} up",
            r: "The riders take {themHim} away. One of them throws you a coin. The fire feels colder after.",
            fx: {coin:3,honor:-6,them:{type:"enemy",op:-60}},
          },
          {
            t: "Wake {themHim} before the riders arrive",
            r: "{They} is gone over the ridge before the riders reach the top of the track. You tell them the truth: nobody is here.",
            fx: {honor:2,them:{type:"friend",op:30}},
          },
        ],
      },
      {
        id: "cm_herd_blood_ride",
        cond: (p,C)=>C.adult(p)&&herder(p)&&(inR(p,"POL-11","POL-12","POL-34")||C.terr(p,"steppe")),
        cool: 6,
        title: "Three days without a fire",
        text: "A message must reach the summer camp before the tribe moves: three days' ride across open steppe, with no wells you can count on. The old way is to drink from your horse: open a vein in the neck, drink, close it again. Sunland buyers faint when they see it done.",
        choices: [
          {
            t: "Ride the old way",
            check: {s:"riding",s2:"sta",d:50},
            win: {
              r: "Three days, two horses, one message delivered. The chief gives you a silver cup.",
              fx: {coin:10,rep:5,fame:1,sta:1,skill:{riding:3}},
            },
            lose: {
              r: "Your horse goes lame on the second day. You walk the last day, and arrive late.",
              fx: {health:-8,cause:"thirst",wil:1.5,rep:-1},
            },
          },
          {
            t: "Take the longer way by the wells",
            r: "You arrive a day late. The tribe has waited, unhappily.",
            fx: {rep:-1,skill:{survival:2}},
          },
          {
            t: "Send your younger cousin",
            r: "The boy rides like the wind and comes back a man. You are proud, and a little jealous.",
            fx: {happy:2},
          },
        ],
      },
    ]);
    const NORTH=["POL-08","POL-09","POL-23","POL-25","POL-26","POL-01","POL-14","POL-12","POL-11","POL-34"];
    A.defEvents([
      OPP(["hunter"], {
        id: "cm_hunter_trapline",
        young: !0,
        maxRank: 0,
        cool: 2,
        title: "The trapline",
        setup: (p,ctx)=>{ctx.fur=inR(p,...NORTH)?"marten, fox and sable":inR(p,"POL-17","POL-24","POL-19","POL-20")?"fox, hare and the odd jackal":"fox, otter and beaver"},
        text: "Winter, and the fur is thick. A trapline of thirty sets through the woods above {home}: {fur}. Every one must be walked every day, in any weather, before the crows and the other trappers get there.",
        choices: [
          {
            t: "Walk the full line every day",
            check: {s:"survival",s2:"sta",d:35},
            win: {
              r: "Frozen fingers, a full pack, a name with the fur buyers. 15 suns of pelts by the thaw.",
              fx: {coin:15,rep:4,skill:{survival:3,tracking:2}},
            },
            lose: {
              r: "A blizzard keeps you in for a week. The crows eat half your catch.",
              fx: {coin:5,wil:1,health:-4,cause:"the cold"},
            },
          },
          {
            t: "Set fewer traps, better",
            check: {s:"tracking",s2:"int",d:40},
            win: {
              r: "Ten sets on the right runs beat thirty on the wrong ones.",
              fx: {coin:10,rep:3,skill:{tracking:3}},
            },
            lose: {r:"The right runs were someone else's idea of right.",fx:{coin:3}},
          },
          {
            t: "Raid another trapper's line",
            check: {s:"stealth",s2:"survival",d:45},
            win: {r:"His marten, your pack. Nobody saw.",fx:{coin:12,honor:-3}},
            lose: {
              r: "He was waiting in the spruce with a cudgel.",
              fx: {health:-8,cause:"a cudgel",honor:-3,newRel:{type:"enemy",op:-40}},
            },
          },
        ],
      }),
      OPP(["hunter"], {
        id: "cm_hunter_fur_buyer",
        maxRank: 1,
        cool: 3,
        title: "The fur buyer",
        setup: (p,ctx)=>{ctx.toll=inR(p,"POL-25","POL-26")?"In the north a sable pelt is money in itself, worth 3 suns, and the Velgrad toll forts take their cut of every bale.":"The buyer at the river landing takes a tenth for the lord before he pays you a penny."},
        text: "Your winter's pelts are baled and ready. {toll} A man in a river boat with no colours says he will pay more, now, in silver, and that the toll-takers never need to know.",
        choices: [
          {
            t: "Sell at the landing, honestly",
            r: "Weighed, taxed and paid. 20 suns for the winter's work.",
            fx: {coin:20,rep:2},
          },
          {
            t: "Sell to the man in the boat",
            check: {s:"trade",s2:"stealth",d:45},
            win: {
              r: "Thirty suns, no tax, and a boat that is gone round the bend before the bailiff looks up.",
              fx: {coin:30,honor:-1,skill:{trade:2}},
            },
            lose: {
              r: "The man in the boat is a river pirate. He takes the bales and pays you with a laugh.",
              fx: {coin:-5,happy:-5,wil:1},
            },
          },
          {
            t: "Carry the best pelts to {capital} yourself",
            check: {s:"trade",s2:"survival",d:50},
            win: {
              r: "A furrier in {capital} pays double for prime pelts, and asks for you by name next winter.",
              fx: {coin:40,rep:4},
            },
            lose: {r:"A long walk, a glutted market, a poor price.",fx:{coin:15}},
          },
        ],
      }),
      OPP(["hunter"], {
        id: "cm_hunter_wolf_heads",
        maxRank: 2,
        cool: 4,
        cond: (p,C)=>!inR(p,"POL-17","POL-24","POL-19","POL-20","POL-21","POL-22","POL-30","POL-32"),
        title: "Wolf heads",
        setup: (p,ctx)=>{setBeast(ctx,"CRE-21")},
        text: p=>`${lordT(p)} pays a sun a head for wolves this winter, after a pack took a child on the road to {town}. ${inR(p,"POL-01","POL-08","POL-14","POL-10")?"The trappers whisper that some of these are wolf-men of the Pinewild: men who ate wolf meat and turned.":"The old women say wolves that have tasted people never stop."}`,
        choices: [
          {
            t: "Hunt the pack down",
            r: "You find the pack's den under a fallen spruce. The big grey one stands.",
            fx: {coin:8,rep:3,beast:{id:"CRE-21",place:"a den under a fallen spruce",mod:1}},
          },
          {
            t: 'Track the "wolf-men" first',
            check: {s:"tracking",s2:"int",d:50},
            win: {
              r: "The wolf-men leave boot prints. Two outlaws in wolf pelts, robbing carts and letting wolves take the blame. You bring the lord their names.",
              fx: {coin:25,rep:8,fame:2,skill:{tracking:3}},
            },
            lose: {r:"The tracks vanish in the snow. Whatever it was, it laughs at night.",fx:{wil:1}},
          },
          {
            t: "Poison a carcass",
            r: "Ugly work. Six heads by the new moon, and two dead dogs from the village.",
            fx: {coin:6,rep:1,honor:-2,newRel:{type:"enemy",op:-20}},
          },
        ],
      }),
      OPP(["hunter"], {
        id: "cm_hunter_lords_hunt",
        minRank: 1,
        maxRank: 2,
        cool: 4,
        cond: (p,C)=>!inR(p,"POL-13","POL-06","POL-07"),
        title: "The lord's hunt",
        setup: (p,ctx)=>{setBeast(ctx,C_huntBeast(p))},
        text: "You are huntsman to a lord's hunt: twenty riders, a pack of hounds, and the lord's fourteen-year-old son, who has never killed anything bigger than a hare. The hounds put up {aBeast}. It goes straight for the boy's horse.",
        choices: [
          {
            t: "Put yourself between them",
            r: "You run in with the boar-spear, shouting.",
            fx: {rep:8,favor:4,honor:3,beast:{place:"the lord's chase",mod:.9}},
          },
          {
            t: "Shout the boy down off his horse and into a tree",
            check: {s:"command",s2:"ins",d:50},
            win: {
              r: "He goes up the oak like a squirrel. The hounds hold {theBeast} till the lord's men finish it. His mother sends you a gold ring.",
              fx: {coin:30,rep:6,favor:6,newRel:{type:"friend",op:40}},
            },
            lose: {
              r: "He freezes, and {theBeast} takes his horse and him with it. He lives, with a scar to boast of. The lord does not thank you.",
              fx: {rep:-6,favor:-8,wil:1},
            },
          },
          {
            t: "Shoot from where you stand",
            req: (p,C)=>C.prof(p,"bow",40)||C.prof(p,"xbow",40),
            check: {s:"bow",s2:"ins",d:55},
            win: {
              r: "Two arrows behind the shoulder, and {theBeast} drops a horse-length from the boy.",
              fx: {coin:20,rep:8,fame:2,favor:6},
            },
            lose: {
              r: "Your arrow takes the boy's horse in the rump. He comes off. Everyone lives; nobody laughs.",
              fx: {rep:-5,favor:-6},
            },
          },
        ],
      }),
      OPP(["hunter"], {
        id: "cm_hunter_man_eater",
        minRank: 1,
        minRep: 35,
        time: 2,
        cool: 6,
        title: "The village that died",
        setup: (p,ctx)=>{setBeast(ctx,killer(p)),ctx.village=A.pick(["Low Hollin","Three Wells","the charcoal camp at Brakemoor","the hamlet by the ford","the salt-carters' camp"]),ctx.dead=A.ri(5,11),ctx.Village=A.cap(ctx.village)},
        text: "{Village} is empty: {dead} dead in a month, the rest fled. The tracks say {aBeast}, a big one, that has learned people are easy. The lord has put 60 suns on its head, and nobody has claimed them. Around the fires they tell the old stories: {lore}.",
        choices: [
          {
            t: "Track it to its lair and kill it there",
            check: {s:"tracking",s2:"survival",d:55},
            win: {
              r: "Four days on its trail. You find it asleep and fight it on your ground, not its own.",
              fx: {coin:60,rep:12,fame:4,epithet:"the Beast-Bane",beast:{place:"its lair",mod:.7}},
            },
            lose: {
              r: "It has been tracking you, too. It comes out of the dark on the third night.",
              fx: {coin:60,rep:6,fame:2,beast:{place:"your night camp",mod:1.2}},
            },
          },
          {
            t: "Dig a pit with stakes on its path",
            check: {s:"craft",s2:"survival",d:55},
            win: {
              r: "Two days digging. On the third night it falls in. Even so, someone has to go down and finish it.",
              fx: {coin:60,rep:10,fame:3,beast:{place:"the stake pit",mod:.5}},
            },
            lose: {
              r: "It walks round the pit as if it had read your mind. Then it comes for the digger.",
              fx: {coin:60,rep:4,beast:{place:"the edge of your pit",mod:1}},
            },
          },
          {
            t: "Raise the villages and drive it with fire and noise",
            check: {s:"command",s2:"tactics",d:55},
            win: {
              r: "Two hundred men with torches and pans drive it out onto open ground, where your spear is waiting.",
              fx: {coin:50,rep:12,fame:3,skill:{command:3},beast:{place:"open ground before the beaters",mod:.8}},
            },
            lose: {
              r: "The beaters panic and scatter. Two are hurt, and {theBeast} slips away into the hills.",
              fx: {rep:-4,wil:1},
            },
          },
          {
            t: "Decline. Some prices are too low",
            r: "Someone else takes the contract. You hear how it ended for him.",
            fx: {rep:-2},
          },
        ],
      }),
      OPP(["hunter"], {
        id: "cm_hunter_falcons",
        minRank: 1,
        maxRank: 3,
        cool: 5,
        cond: (p,C)=>C.terr(p,"mountains","hills","tundra")||inR(p,"POL-25","POL-23","POL-08","POL-09"),
        title: "The eyrie",
        text: p=>`High on the cliff above the gorge, a pair of falcons have three chicks in the eyrie. A trained hunting falcon sells for 150 suns${inR(p,"POL-25")?", and Velgrad taxes every one at market":""}. The ledge is two hundred feet up, and the parents have talons like knives.`,
        choices: [
          {
            t: "Climb down on a rope and take two",
            check: {s:"athletics",s2:"wil",d:55},
            win: {
              r: "Two chicks in a padded bag, a slashed scalp and a rope burn. A falconer pays you 120 suns for the pair, untrained.",
              fx: {coin:120,rep:6,skill:{athletics:3}},
            },
            lose: {
              r: "The mother falcon hits you on the ledge. You swing into the rock face and lose your grip.",
              fx: {health:-18,cause:"a fall from a cliff",wound:"broken_ribs",wil:1.5},
            },
          },
          {
            t: "Take one, and leave the pair their brood",
            check: {s:"athletics",s2:"survival",d:45},
            win: {
              r: "One chick, and the falcons come back to that cliff every spring for you.",
              fx: {coin:60,rep:4,flag:"cm_eyrie"},
            },
            lose: {r:"You come up with nothing but scratches.",fx:{health:-5,cause:"falcon talons"}},
          },
          {
            t: "Train a falcon yourself before you sell it",
            req: (p,C)=>C.prof(p,"husbandry",40),
            r: "A winter of jesses, gloves and patience. The trained bird sells for the full 150.",
            fx: {coin:150,rep:6,skill:{husbandry:3}},
          },
          {
            t: "Leave them",
            r: "The falcons wheel over the gorge, crying. You watch them for an hour.",
            fx: {happy:2},
          },
        ],
      }),
      OPP(["hunter"], {
        id: "cm_hunter_ranger_badge",
        minRank: 1,
        maxRank: 1,
        minRep: 40,
        cool: 5,
        title: "The forester's horn",
        text: p=>`${lordT(p)} needs a new ranger for the forest: a green cloak, a horn, a cottage, and the forest law to keep. ${inR(p,"POL-05")?"In Ashmere's royal forests, a poacher loses a hand.":"A poacher pays a fine the first time and is branded the second."} The poachers are your neighbours. Some of them taught you to set a snare.`,
        choices: [
          {
            t: "Take the horn and keep the law",
            r: "You are the forest's now. The tavern goes quiet when you come in.",
            fx: {promote:!0,rep:6,honor:2,newRel:{type:"rival",op:-20}},
          },
          {
            t: "Take the horn and look away from your friends",
            check: {s:"intrigue",s2:"diplomacy",d:50},
            win: {
              r: "You catch strangers and miss neighbours. Everyone understands, and the steward never learns.",
              fx: {promote:!0,rep:5,honor:-1,newRel:{type:"friend",op:25}},
            },
            lose: {r:"A neighbour boasts in the wrong tavern. The steward takes the horn back.",fx:{rep:-6}},
          },
          {
            t: "Refuse. You will not hunt your own",
            r: "The horn goes to a stranger from {town}, who hunts your own instead.",
            fx: {honor:2},
          },
        ],
      }),
      OPP(["hunter"], {
        id: "cm_hunter_rich_guest",
        minRank: 1,
        maxRank: 3,
        cool: 4,
        title: "A rich man's trophy",
        setup: (p,ctx)=>{who(p,ctx,"a rich merchant"),ctx.prize=inR(p,"POL-30")?"a tiger skin for his hall":C_huntBeast(p)==="CRE-23"?"a boar's head for his hall":"a great stag's antlers for his hall"},
        text: "{them}, a merchant with a new house and soft boots, pays 40 suns for a week of your time and {prize}. {They} has a new bow {theyHe} cannot draw and a great deal to say about how hunting should be done.",
        choices: [
          {
            t: "Find the beast, then let {themHim} take the shot",
            check: {s:"tracking",s2:"persuasion",d:50},
            win: {
              r: "A week of whispers and wet feet, and you put {themHim} where {theyHe} cannot miss. {They} tells everyone {theyHe} did it alone. {They} also comes back every year.",
              fx: {coin:40,rep:6,them:{type:"friend",op:30}},
            },
            lose: {
              r: "{They} misses, the beast runs, and {theyHe} blames you to everyone in {capital}.",
              fx: {coin:40,rep:-4,them:{type:"rival",op:-20}},
            },
          },
          {
            t: "Make the kill yourself and let {themHim} claim it",
            r: "Your arrow, {theirHis} trophy, everybody happy. {They} pays double.",
            fx: {coin:80,rep:3,honor:-1,them:{type:"friend",op:20}},
          },
          {
            t: "Tell {themHim} the truth about {theirHis} bow",
            r: "{They} goes red, then laughs. You spend the week teaching {themHim} to draw it.",
            fx: {coin:40,rep:2,honor:2,them:{type:"friend",op:40}},
          },
        ],
      }),
      OPP(["hunter"], {
        id: "cm_hunter_mammoth_ivory",
        minRank: 1,
        maxRank: 3,
        cool: 8,
        cond: (p,C)=>C.terr(p,"tundra")||inR(p,"POL-23","POL-25","POL-09","POL-26","POL-08"),
        title: "Out of the ice",
        text: "A summer thaw has opened the riverbank, and a mammoth is coming out of the frozen ground: hair, hide and two tusks as long as a man. In the south they sell such tusks as 'dragon-kin' ivory, at a price walrus ivory never reaches.",
        choices: [
          {
            t: "Dig the tusks out and sell them as dragon-kin",
            check: {s:"deception",s2:"trade",d:50},
            win: {
              r: "A Kingsmere dealer pays 200 suns and a dragon story you had to invent on the spot.",
              fx: {coin:200,rep:3,honor:-2},
            },
            lose: {
              r: "The dealer knows mammoth from dragon. He pays ivory price and tells the story at your expense.",
              fx: {coin:60},
            },
          },
          {
            t: "Sell them honestly, as old ivory",
            r: "Old ivory at old prices: 60 suns. A carver will turn it into saints and chessmen.",
            fx: {coin:60,rep:2},
          },
          {
            t: "Send word to a scholar",
            check: {s:"learning",s2:"persuasion",d:45},
            win: {
              r: "A scholar from {capital} comes north with three servants and a box of chalks, and draws the whole beast. Your name goes in his book.",
              fx: {coin:40,fame:2,rep:4,int:.5},
            },
            lose: {r:"By the time anyone answers, the wolves have had the rest of it.",fx:{coin:30}},
          },
        ],
      }),
      OPP(["hunter"], {
        id: "cm_hunter_drake_egg",
        minRank: 1,
        maxRank: 3,
        cool: 12,
        cond: (p,C)=>inR(p,"POL-13")||C.terr(p,"mountains")&&inR(p,"POL-01","POL-03","POL-05"),
        title: "White shapes in the cloud",
        text: "In a high valley above Highcastle you see them: white shapes in the cloud, long-necked, the size of ponies. Snow drakes, which everyone says are long gone from the Crown Range. A drake egg would sell for a fortune in the south. The Stonefoot herders who graze this valley do not want anyone to know.",
        choices: [
          {
            t: "Climb to the nests and take an egg",
            check: {s:"stealth",s2:"athletics",d:60},
            win: {
              r: "A warm white egg in your shirt and the cloud closing behind you. A southern buyer pays 400 suns and asks nothing.",
              fx: {coin:400,honor:-4,rep:4,newRel:{type:"enemy",op:-40}},
            },
            lose: {
              r: "The drake on the nest hisses and strikes. You come down the scree a great deal faster than you went up.",
              fx: {health:-16,cause:"a snow drake",wound:"bite",wil:1},
            },
          },
          {
            t: "Keep the secret, and tell the Stonefoot herders you know it",
            r: "They give you salt, cheese and a promise. In Highland, a promise is worth more than either.",
            fx: {honor:4,rep:4,newRel:{type:"friend",op:40}},
          },
          {
            t: "Sell the secret to Speaker Redford's men",
            r: "Redford wants proof of anything that will embarrass the First Speaker. 50 suns.",
            fx: {coin:50,honor:-3,skill:{intrigue:2}},
          },
        ],
      }),
      OPP(["hunter"], {
        id: "cm_hunter_master_post",
        minRank: 2,
        maxRank: 2,
        minRep: 55,
        cool: 5,
        title: "Master of the hunt",
        text: "The old Master of the hunt has been gored, and the {rulerTitle}'s court needs another before the winter hunting. The post is yours if you can show the marshal a hunt worth the name: thirty hounds, a hundred beaters, and the court in velvet watching.",
        choices: [
          {
            t: "Run a great ring hunt",
            check: {s:"command",s2:"tracking",d:60},
            win: {
              r: "Beaters in a ring a league wide, closing like a fist. The court kills more game in a day than in the whole last year.",
              fx: {promote:!0,rep:10,fame:3,favor:6},
            },
            lose: {
              r: "The ring breaks on a river. The game goes through the gap, and so does the post.",
              fx: {rep:-4,favor:-3},
            },
          },
          {
            t: "Run a small, perfect hunt for the {rulerTitle} alone",
            check: {s:"tracking",s2:"etiquette",d:55},
            win: {
              r: "One stag, one shot, one royal smile. The marshal hands you the silver horn.",
              fx: {promote:!0,rep:8,favor:8},
            },
            lose: {r:"The stag does not come. The royal smile does not either.",fx:{rep:-3}},
          },
          {
            t: "Recommend the old master's deputy instead",
            r: "He gets the horn and owes you everything.",
            fx: {rep:2,newRel:{type:"friend",op:40}},
          },
        ],
      }),
      OPP(["hunter"], {
        id: "cm_hunter_great_hunt",
        minRank: 3,
        cool: 4,
        title: "The prince's kill",
        setup: (p,ctx)=>{setBeast(ctx,killer(p))},
        text: "The great winter hunt. The court is out in furs, and your hounds have brought {aBeast} to bay in a ravine. A young prince of the blood insists on the kill himself, on foot, with a spear he has never used in earnest. Everyone is watching you.",
        choices: [
          {
            t: "Let him, and stand at his shoulder",
            check: {s:"spear",s2:"ins",d:55},
            win: {
              r: "He thrusts; it turns; your spear is there before its teeth. He takes the kill and the glory. He knows whose spear it was.",
              fx: {rep:12,fame:3,favor:10,deed:"Saved a prince at the great winter hunt"},
            },
            lose: {
              r: "You save him, but it opens your arm to the bone doing it.",
              fx: {rep:8,favor:8,health:-18,cause:"a hunted beast",wound:"scar_arm"},
            },
          },
          {
            t: "Refuse him: the beast is too dangerous",
            check: {s:"etiquette",s2:"wil",d:55},
            win: {
              r: "You say it so well that he thanks you for it. The hounds and the huntsmen finish {theBeast}.",
              fx: {rep:6,favor:3},
            },
            lose: {
              r: "He calls you a coward in front of the court and goes in anyway. He lives. Your standing does not.",
              fx: {rep:-8,favor:-10},
            },
          },
          {
            t: "Make the kill yourself before he can",
            r: "You go into the ravine first.",
            fx: {rep:5,fame:3,favor:-5,beast:{place:"a ravine",mod:1}},
          },
        ],
      }),
      OPP(["hunter","explorer","bounty"], {
        id: "cm_land_young_lord",
        minRank: 1,
        cool: 6,
        title: "A young lord wants adventure",
        setup: (p,ctx)=>{who(p,ctx,"a young lordling","acquaint");const w=wild(p);ctx.wild=w[0]},
        text: "{themFull}, a lord's younger child with a new sword and an old name, pays 60 suns for you to take {themHim} into {wild} for a month. {They} wants to see something nobody at court has seen. {Their} mother wants {themHim} home alive and has said so, in writing.",
        choices: [
          {
            t: "Take {themHim}, and teach {themHim} the wild",
            check: {s:"survival",s2:"persuasion",d:50},
            win: {
              r: "A month of cold camps, one real fright and a sunrise {theyHe} will tell grandchildren about. {They} comes home thinner, browner and your friend for life.",
              fx: {coin:60,rep:6,fame:1,them:{type:"friend",op:50}},
            },
            lose: {
              r: "{They} wanders off on the tenth day and you find {themHim} with a broken leg in a gully. {Their} mother writes again.",
              fx: {coin:20,rep:-6,them:{type:"friend",op:10}},
            },
          },
          {
            t: "Give {themHim} a safe, stage-managed adventure",
            check: {s:"deception",s2:"survival",d:45},
            win: {
              r: 'A "bandit" camp of your cousins, a "bear" that is a cow in the fog. {They} goes home thrilled and never knows.',
              fx: {coin:60,rep:3,them:{type:"friend",op:30}},
            },
            lose: {
              r: "{They} finds your cousin's bandit mask in the baggage.",
              fx: {coin:30,rep:-3,them:{type:"rival",op:-20}},
            },
          },
          {
            t: "Refuse",
            r: "{They} finds someone less careful. You hear later that {theyHe} came home anyway, missing two toes.",
            fx: {},
          },
        ],
      }),
    ]);
    function C_huntBeast(p){const t=terr(p);return t==="forest"||t==="hills"?"CRE-23":t==="mountains"?"CRE-25":t==="steppe"?"CRE-35":t==="marsh"?"CRE-44":"CRE-21"}
    A.defEvents([
      {
        id: "cm_hunter_snowblind",
        cond: (p,C)=>C.adult(p)&&woodsman(p)&&(C.terr(p,"tundra","mountains","forest")||inR(p,...NORTH)),
        cool: 7,
        title: "Snow-blind",
        text: "Three days of sun on fresh snow, and on the fourth morning your eyes are full of sand and fire. You are two days from home, alone, and you can barely see your own hands.",
        choices: [
          {
            t: "Bind your eyes and walk out by feel",
            check: {s:"survival",s2:"wil",d:50},
            win: {
              r: "Two days blind, following the stream by its sound. You walk into your own village at dusk.",
              fx: {wil:2,skill:{survival:3}},
            },
            lose: {
              r: "You walk in circles for a day and freeze two toes before a charcoal burner finds you.",
              fx: {health:-12,cause:"the cold",wound:"frostbite",wil:2},
            },
          },
          {
            t: "Build a shelter and wait for your eyes",
            check: {s:"survival",s2:"sta",d:45},
            win: {
              r: "Three days in a snow hole, eating your catch. Your eyes clear. You walk home.",
              fx: {wil:1,skill:{survival:2}},
            },
            lose: {
              r: "Three days are too many. You come home thin and coughing.",
              fx: {health:-10,cause:"exposure",wil:1},
            },
          },
          {
            t: "Cut slits in birch bark to see through",
            req: (p,C)=>C.prof(p,"survival",45),
            r: "An old trapper's trick. Through the narrow slits the glare is bearable. You walk home slowly but surely.",
            fx: {skill:{survival:2}},
          },
        ],
      },
      {
        id: "cm_hunter_old_hound",
        cond: (p,C)=>C.adult(p)&&woodsman(p),
        once: !0,
        title: "The old hound",
        setup: (p,ctx)=>{ctx.dog=A.pick(["Gelert","Brindle","Old Bran","Soot","Talla","Grip"])},
        text: "{dog} has been at your heel for twelve years. This winter she cannot keep up, and her back legs give way on the ice. She still looks at you every morning as if today is a hunting day.",
        choices: [
          {
            t: "Carry her on the easy days",
            r: "You carry her in a sack on your back like a child. The other hunters stop laughing after the first week.",
            fx: {happy:3,honor:1,sta:.5},
          },
          {
            t: "Do the kind thing yourself",
            r: "One morning, quickly, in the sun, by her favourite stream. You bury her under a rowan.",
            fx: {wil:2,happy:-6},
          },
          {
            t: "Raise one of her pups in her place",
            check: {s:"husbandry",s2:"int",d:40},
            win: {
              r: "The pup has her nose and her temper. The old dog teaches it the rest before she goes.",
              fx: {happy:4,skill:{husbandry:2,tracking:1}},
            },
            lose: {r:"The pup is all bark and no nose. You keep it anyway.",fx:{happy:1}},
          },
        ],
      },
      {
        id: "cm_hunter_oak_line",
        cond: (p,C)=>C.adult(p)&&woodsman(p)&&inR(p,"POL-01","POL-05","POL-14"),
        cool: 8,
        title: "The Oak Line",
        text: "Your arrow is in a hart's shoulder, and the hart is running north. North is the Oak Line, the border of the elves of Sylvaran. Humans who cut trees beyond it are shot after three warnings. Humans who chase deer beyond it get no warnings at all, they say.",
        choices: [
          {
            t: "Follow your hart across",
            check: {s:"stealth",s2:"tracking",d:55},
            win: {
              r: "You find it dead in a hollow, gut it fast and get back across before anything moves in the trees.",
              fx: {coin:8,skill:{stealth:2}},
            },
            lose: {
              r: "An arrow thuds into the oak by your head. Then a second. You leave the hart.",
              fx: {health:-6,cause:"an elven arrow",wil:1},
            },
          },
          {
            t: "Call out and ask leave",
            check: {s:"diplomacy",s2:"etiquette",d:55},
            win: {
              r: "A grey shape steps out of the trees, looks at you a long time, and drags the hart to the line for you.",
              fx: {honor:3,fame:1,newRel:{type:"friend",op:25}},
            },
            lose: {r:"Nothing answers. The silence is worse than an arrow.",fx:{wil:.5}},
          },
          {t:"Let it go",r:"A wasted arrow, a wasted day, a long life.",fx:{}},
        ],
      },
      {
        id: "cm_hunter_neighbour_poacher",
        cond: (p,C)=>C.adult(p)&&J(p,"hunter")&&rk(p)>=2,
        cool: 6,
        title: "A snare on the lord's land",
        setup: (p,ctx)=>{who(p,ctx,"a neighbour's boy")},
        text: "A wire snare on the lord's deer run, and a familiar figure coming back to check it: {them}, your neighbour's boy, all elbows and hunger. Their family has had a bad year. The forest law is the forest law.",
        choices: [
          {
            t: "Take {themHim} to the steward",
            r: "The steward fines the family half its winter grain. Your neighbour does not speak to you again.",
            fx: {rep:4,honor:-2,them:{type:"enemy",op:-50},rel:{who:"friend",op:-10}},
          },
          {
            t: "Take the wire, give {themHim} a rabbit, send {themHim} home",
            r: '"Next time it is the steward." You both know there will be a next time.',
            fx: {honor:3,happy:2,them:{type:"friend",op:40}},
          },
          {
            t: "Teach {themHim} to snare on the common instead",
            check: {s:"survival",s2:"persuasion",d:40},
            win: {
              r: "Rabbits on the common are nobody's. The family eats all winter, and the boy wants to be a hunter.",
              fx: {honor:3,skill:{survival:1},them:{type:"student",op:40}},
            },
            lose: {r:"The boy goes back to the deer run, because deer are bigger.",fx:{them:{type:"acquaint",op:10}}},
          },
        ],
      },
    ]);
    const cavalry = p=>({"POL-01":"the Iron Guard","POL-15":"the Coast Road Knights","POL-20":"the Golden Horse","POL-22":"the Horsemen of the Monundi","POL-25":"the Ostec Lances","POL-12":"the Silver Tablet Guard","POL-03":"the Varennan knights","POL-14":"the Greyhaven knights","POL-11":"the war-bands","POL-34":"the war-bands"})[p.realm]||"the crown's horsemen",
      studOf = p=>({"POL-01":"the Horse-Breeders of the Millrun","POL-15":"the royal stud at Santora","POL-12":"the khan's herds at Kharsa","POL-22":"the Horse School of Mandi","POL-20":"the stables of the Golden Horse"})[p.realm]||`the royal stud at ${cap(p)}`;
    A.defEvents([
      OPP(["horsemaster"], {
        id: "cm_horse_colic",
        young: !0,
        maxRank: 0,
        cool: 3,
        title: "Colic",
        text: "Midnight. A lady's palfrey, a grey worth 200 suns, is down in her stall, sweating and looking at her own belly. If she rolls, her gut can twist, and she dies. The horse-master is drunk at a wedding in {town}.",
        choices: [
          {
            t: "Walk her all night and keep her up",
            check: {s:"husbandry",s2:"sta",d:40},
            win: {
              r: "Up and down the yard till dawn, talking to her. At first light she drops dung, sighs, and eats. The lady sends you a silver penny and remembers your face.",
              fx: {coin:2,rep:5,sta:.5,skill:{husbandry:3}},
            },
            lose: {
              r: "She goes down twice, and twice you get her up. She lives, but the horse-master takes the credit.",
              fx: {rep:1,wil:.5,skill:{husbandry:2}},
            },
          },
          {
            t: "Ride to {town} for the horse-master",
            check: {s:"riding",s2:"spd",d:40},
            win: {
              r: "You drag him out of the wedding and he sobers on the ride. Together you save her.",
              fx: {rep:3,skill:{riding:2}},
            },
            lose: {
              r: "By the time you are back she has rolled. It is a long night, and a bad morning.",
              fx: {rep:-3,wil:1},
            },
          },
          {
            t: "Give her the old remedy: oil and a warm mash",
            r: "It is what your grandfather did. Tonight it works, more or less.",
            fx: {rep:2,skill:{husbandry:1}},
          },
        ],
      }),
      OPP(["horsemaster"], {
        id: "cm_horse_thrown_shoe",
        young: !0,
        maxRank: 1,
        cool: 4,
        title: "Lame before the lists",
        setup: (p,ctx)=>{who(p,ctx,"a hedge knight")},
        text: "{them}'s destrier is lame on the morning of the tourney, and you are the groom who saw to it last night. {They} is shouting. The farrier says it is your fault. The horse stands with one hoof just touching the straw.",
        choices: [
          {
            t: "Find the real cause",
            check: {s:"husbandry",s2:"int",d:45},
            win: {
              r: "You pick out the hoof: a nail driven too close by the farrier. Pull it, pack it, and the horse walks sound by noon. The farrier stops talking.",
              fx: {rep:6,skill:{husbandry:3},them:{type:"friend",op:30}},
            },
            lose: {
              r: "You find nothing. The knight rides a borrowed horse and loses, and blames you for that too.",
              fx: {rep:-4,them:{type:"rival",op:-20}},
            },
          },
          {
            t: "Lend {themHim} your master's spare horse without asking",
            check: {s:"riding",s2:"persuasion",d:45},
            win: {
              r: "The spare is a good horse. {They} rides well, and your master never finds out whose horse won.",
              fx: {coin:5,rep:3,them:{type:"friend",op:25}},
            },
            lose: {r:"Your master finds out exactly whose horse lost.",fx:{rep:-5,coin:-3}},
          },
          {
            t: "Take the blame and keep your head down",
            r: "You take the knight's curses and the farrier's smirk. The horse-master says nothing, which means he knows.",
            fx: {wil:1,honor:1},
          },
        ],
      }),
      OPP(["horsemaster"], {
        id: "cm_horse_colt",
        maxRank: 1,
        cool: 4,
        title: "The unbroken colt",
        setup: (p,ctx)=>{ctx.from=inR(p,"POL-12","POL-11","POL-34")?"off the open steppe":"bought at the Horse Fair at Santora"},
        text: "A dun colt {from}: all wire and fury, and he has thrown three riders this month. The last one is still in bed. Your master says whoever breaks him can ride him, and he is worth 60 suns as he is, ten times that made.",
        choices: [
          {
            t: "Break him gently, a little every day",
            check: {s:"husbandry",s2:"wil",d:50},
            win: {
              r: "Weeks of standing near him, then touching him, then leaning on him. One morning you are simply on his back, and he lets you.",
              fx: {rep:6,skill:{husbandry:4,riding:2},promote:!0},
            },
            lose: {
              r: "Gentleness takes longer than your master will wait. He sells the colt to a dealer.",
              fx: {rep:1,skill:{husbandry:2}},
            },
          },
          {
            t: "Get on and stay on",
            check: {s:"riding",s2:"str",d:55},
            win: {
              r: "He bucks across the paddock and into the river and out again. You are still on. The whole yard cheers.",
              fx: {rep:8,fame:1,skill:{riding:4},promote:!0},
            },
            lose: {r:"You land on the fence.",fx:{health:-12,cause:"a fall from a colt",wound:"broken_ribs",wil:1}},
          },
          {t:"Leave him to the horse-breakers",r:"Somebody else's ribs.",fx:{}},
        ],
      }),
      OPP(["horsemaster"], {
        id: "cm_horse_painted",
        minRank: 1,
        maxRank: 2,
        cool: 4,
        title: "A dealer's horse",
        setup: (p,ctx)=>{who(p,ctx,"a horse dealer"),ctx.price=A.pick([60,80,120])},
        text: "Your master sends you to buy a riding horse. {them}, a dealer with a smile you could pour on bread, shows you a bay mare for {price} suns: bright eye, high tail, young teeth. Too bright, too high, too young.",
        choices: [
          {
            t: "Look at her very closely",
            check: {s:"husbandry",s2:"ins",d:50},
            win: {
              r: "Teeth filed to look young, ginger under the tail to lift it, a fever-bright eye from something in her feed. You walk away, and tell every buyer at the fair why.",
              fx: {rep:8,skill:{husbandry:3},them:{type:"enemy",op:-40}},
            },
            lose: {r:"You buy her. By the next morning she is twelve years old and lame.",fx:{coin:-20,rep:-6,wil:.5}},
          },
          {
            t: "Make {themHim} ride her first, at the gallop",
            check: {s:"riding",s2:"int",d:45},
            win: {
              r: "She blows like a bellows after half a mile. Broken wind. The price drops by half, and you still do not buy.",
              fx: {rep:4,skill:{riding:2}},
            },
            lose: {r:"{They} rides her well enough to fool you.",fx:{coin:-15,rep:-3}},
          },
          {
            t: "Strike a quiet deal: buy her cheap, sell her on",
            check: {s:"deception",s2:"trade",d:50},
            win: {
              r: "You know the tricks now, and you use them yourself, on someone else.",
              fx: {coin:25,honor:-4,them:{type:"friend",op:20}},
            },
            lose: {
              r: "The buyer finds the ginger. So does his brother, who is bigger than you.",
              fx: {health:-8,cause:"an angry buyer",honor:-4},
            },
          },
        ],
      }),
      OPP(["horsemaster"], {
        id: "cm_horse_race",
        minRank: 1,
        maxRank: 3,
        cool: 3,
        title: "The race",
        setup: (p,ctx)=>{ctx.race=inR(p,"POL-12")?"the race at the Horse Feast, three leagues across open steppe":inR(p,"POL-15")?"the race at the Horse Fair at Santora":inR(p,"POL-19","POL-24","POL-17")?"the camel and horse races at the caravan market":`the races at ${A.pick(GD.FESTIVALS)[0]} in ${A.provName(p.home)}`},
        text: "Your stable's best young horse is entered for {race}, and the jockey has broken his collarbone. The purse is 30 suns. The bets are a great deal more.",
        choices: [
          {
            t: "Ride him yourself",
            check: {s:"riding",s2:"spd",d:50},
            win: {
              r: "Last at the turn, first at the post. The purse is yours and the dealers want to buy the horse.",
              fx: {coin:30,rep:6,fame:2,skill:{riding:3}},
            },
            lose: {
              r: "Squeezed against the rail at the turn. You finish, bruised, in the middle of the pack.",
              fx: {health:-5,cause:"a crush at the rail",rep:-1},
            },
          },
          {
            t: "Ride him, and bet on yourself",
            req: p=>p.coin>=20,
            check: {s:"riding",s2:"gambling",d:55},
            win: {r:"The purse and your bet at four to one. A very good day.",fx:{coin:110,rep:5,fame:1}},
            lose: {r:"The purse goes to someone else, and so does your bet.",fx:{coin:-20}},
          },
          {
            t: "Put up a stable-boy who weighs nothing",
            r: "He weighs nothing and rides like it. Second place, and a lesson for the boy.",
            fx: {coin:10,rep:2},
          },
        ],
      }),
      OPP(["horsemaster"], {
        id: "cm_horse_tourney_mount",
        minRank: 1,
        maxRank: 3,
        cool: 5,
        title: "A horse for the lists",
        setup: (p,ctx)=>{who(p,ctx,"a hedge knight with more courage than coin")},
        text: "{them}, a hedge knight, needs a horse trained to the lance in three months: steady at the gallop, straight down the barrier, not shying at the crash of wood on shield. {They} cannot pay until {theyHe} wins. If {theyHe} wins.",
        choices: [
          {
            t: "Train the horse on {theirHis} promise",
            check: {s:"riding",s2:"husbandry",d:55},
            win: {
              r: "Straight as a bowshot, deaf to the crash. {They} wins two tourneys on it and pays you double, with a gold cup thrown in.",
              fx: {coin:80,rep:8,fame:1,them:{type:"friend",op:50}},
            },
            lose: {
              r: "The horse shies at the first crash and {theyHe} goes into the barrier. {They} never pays.",
              fx: {rep:-4,them:{type:"rival",op:-20}},
            },
          },
          {
            t: "Train it for coin up front (40 suns)",
            check: {s:"trade",s2:"persuasion",d:45},
            win: {
              r: "{They} sells {theirHis} mother's ring to pay you. You train the horse well, because you have seen the ring.",
              fx: {coin:40,rep:4},
            },
            lose: {r:"{They} rides off to find a cheaper trainer.",fx:{}},
          },
          {
            t: "Ride in the lists on it yourself",
            req: (p,C)=>C.prof(p,"lance",35),
            r: "You show {themHim} how it is done, at the next tourney, under a borrowed shield.",
            fx: {
              coin: 20,
              fame: 2,
              rep: 4,
              skill: {lance:3},
              duel: {
                tier: 2,
                title: "a tourney rider",
                troop: "HC",
                opts: {kind:"duel",place:"the lists",lethal:!1,toYield:!0,title:"The lists"},
              },
            },
          },
        ],
      }),
      OPP(["horsemaster"], {
        id: "cm_horse_remounts",
        minRank: 1,
        maxRank: 3,
        time: 2,
        cool: 4,
        title: "Remounts for the cavalry",
        setup: (p,ctx)=>{ctx.cav=cavalry(p),ctx.Cav=A.cap(ctx.cav),ctx.mart=inR(p,"POL-12","POL-11","POL-34")?"your own herds and your neighbours'":inR(p,"POL-15","POL-14")?"the channel-shore fairs of the Nine Winds":"every fair from here to the steppe"},
        text: "{Cav} need three hundred remounts by May Fair, when the grass comes up for war horses. The marshal's clerk will pay 50 suns a head for sound horses. You can find them at {mart}, if you start now and nobody else has bought them first.",
        choices: [
          {
            t: "Buy carefully, horse by horse",
            check: {s:"husbandry",s2:"logistics",d:55},
            win: {
              r: "Three hundred sound horses in a line half a league long. The marshal's clerk pays, and asks if you would do it again next year.",
              fx: {coin:300,rep:10,skill:{logistics:3}},
            },
            lose: {
              r: "You buy too fast and some are broken-winded. The clerk refuses forty of them.",
              fx: {coin:40,rep:-4},
            },
          },
          {
            t: "Buy cheap and pass off the poor ones",
            check: {s:"deception",s2:"trade",d:55},
            win: {r:"Bad horses in good company. The clerk counts heads, not hooves.",fx:{coin:600,honor:-6,rep:2}},
            lose: {
              r: "The marshal rides down the line himself. He knows a broken horse when he sees one.",
              fx: {coin:-100,rep:-10,favor:-10},
            },
          },
          {
            t: "Take only a third of the contract",
            r: "A hundred horses, no risks, a fair profit.",
            fx: {coin:100,rep:4},
          },
        ],
      }),
      OPP(["horsemaster"], {
        id: "cm_horse_war_mares",
        minRank: 1,
        cool: 5,
        cond: (p,C)=>C.atWar(p),
        title: "The marshal's men",
        setup: (p,ctx)=>{ctx.stud=studOf(p)},
        text: "War. A destrier that cost 800 suns in peace fetches 1,500 this summer. The marshal's men have come to {stud} with a list: every horse fit to carry a man in mail, at the crown's price, which is the peace price. Your best brood mares are on the list.",
        choices: [
          {
            t: "Hand over the horses, mares too",
            r: "The stud is empty by evening. You will be ten years building it back. The marshal writes your name in his good book.",
            fx: {coin:200,favor:10,rep:2,wil:1},
          },
          {
            t: "Give them the geldings and hide the mares",
            check: {s:"stealth",s2:"husbandry",d:55},
            win: {
              r: "The mares spend the summer in a forest clearing. The stud survives the war.",
              fx: {coin:150,rep:6},
            },
            lose: {
              r: "A groom talks. The marshal takes the mares and fines you for the trouble.",
              fx: {coin:-50,favor:-10,rep:-4},
            },
          },
          {
            t: "Sell privately to a captain at the war price",
            check: {s:"trade",s2:"intrigue",d:55},
            win: {
              r: "A captain who wants a good horse more than he fears the marshal pays 1,200 for your best.",
              fx: {coin:1200,honor:-3,rep:3},
            },
            lose: {r:"The captain is the marshal's cousin.",fx:{coin:-100,favor:-15}},
          },
        ],
      }),
      OPP(["horsemaster"], {
        id: "cm_horse_orc_traders",
        minRank: 1,
        maxRank: 3,
        cool: 6,
        title: "Horses from the Horde",
        setup: (p,ctx)=>{who(p,ctx,"an orc horse-trader")},
        text: p=>`{them}, an orc of the Old Clans, has brought forty steppe horses to trade: tough, sure-footed, unshod, cheap. Among orcs a riding horse is coin, about 40 suns. ${inR(p,"POL-01")?"In Aldmark the License Law makes everyone nervous of anything that comes from across the Gordush.":"Your neighbours mutter that orc horses are stolen horses."}`,
        choices: [
          {
            t: "Trade fairly, at {theirHis} fire, by orc custom",
            check: {s:"diplomacy",s2:"husbandry",d:50},
            win: {
              r: "Salt, a knife as a guest-gift, three days of bargaining by the fire. Forty good horses at a fair price, and an orc who will come back.",
              fx: {coin:60,rep:6,them:{type:"friend",op:40},skill:{diplomacy:2}},
            },
            lose: {
              r: "You give insult without knowing how. {They} rides off with the horses and a story about you.",
              fx: {rep:-3,them:{type:"rival",op:-20}},
            },
          },
          {
            t: "Beat the price down hard",
            check: {s:"trade",s2:"intimidation",d:55},
            win: {
              r: "You get them for a song. {They} smiles with all {theirHis} tusks and does not come back.",
              fx: {coin:100,them:{type:"enemy",op:-30}},
            },
            lose: {r:"Orcs bargain in horses and patience, and {theyHe} has more of both.",fx:{coin:-10}},
          },
          {
            t: "Send {themHim} away",
            r: "Your neighbours approve. Your stable stays half empty.",
            fx: {them:{type:"acquaint",op:-10}},
          },
        ],
      }),
      OPP(["horsemaster"], {
        id: "cm_horse_royal_destrier",
        minRank: 1,
        minRep: 45,
        time: 2,
        cool: 8,
        title: "The king's destrier",
        setup: (p,ctx)=>{ctx.horse=A.pick(["Thunder","the Black Bishop","Grief","Iron Mary","Old Night","the Widowmaker"]),ctx.stud=studOf(p),ctx.Horse=A.cap(ctx.horse)},
        text: "{Horse} is the finest destrier in {stud}, bred for the {rulerTitle}'s own saddle: eight hundred suns of horse, and he has killed a groom. No one has sat him in a year. The marshal wants him ready for the spring muster.",
        choices: [
          {
            t: "Win him slowly, by trust",
            check: {s:"husbandry",s2:"wil",d:62},
            win: {
              r: "A summer of sleeping in his stall. In autumn he lowers his head to you. In spring the {rulerTitle} rides him before the whole army.",
              fx: {rep:12,fame:4,favor:10,deed:"Gentled a killer destrier for the royal saddle",skill:{husbandry:4}},
            },
            lose: {
              r: "One summer is not enough. He bites your shoulder to the bone in August.",
              fx: {health:-15,cause:"a destrier's teeth",wound:"scar_arm",rep:-2},
            },
          },
          {
            t: "Master him in the saddle",
            check: {s:"riding",s2:"str",d:65},
            win: {
              r: "An hour in the yard that nobody who watched will forget. When it is over he stands, blowing, and so do you.",
              fx: {rep:12,fame:5,favor:8,skill:{riding:4}},
            },
            lose: {
              r: "He throws you, then turns to finish it. The grooms drag you out under the rail.",
              fx: {health:-25,cause:"a killer destrier",wound:"broken_ribs",wil:2},
            },
          },
          {
            t: "Advise the marshal to geld him",
            r: "Sensible, and unforgivable. The marshal does it, and never quite trusts your judgement again.",
            fx: {rep:-2,favor:-2},
          },
        ],
      }),
      OPP(["horsemaster"], {
        id: "cm_horse_royal_stud",
        minRank: 2,
        maxRank: 2,
        minRep: 60,
        cool: 6,
        title: "The royal stud",
        setup: (p,ctx)=>{ctx.stud=studOf(p)},
        text: "The Master of {stud} is old and half blind. The {rulerTitle}'s marshal is choosing a successor, and has asked three horse-masters to show him three horses each. One of them is you.",
        choices: [
          {
            t: "Show him your three best, honestly",
            check: {s:"husbandry",s2:"riding",d:60},
            win: {
              r: "The marshal walks round your three horses for an hour without speaking. Then he gives you the keys.",
              fx: {promote:!0,rep:10,fame:3,favor:6},
            },
            lose: {r:"Another master's horses are better this year. You know it, and so does he.",fx:{rep:-2}},
          },
          {
            t: "Find out what the marshal likes",
            check: {s:"intrigue",s2:"etiquette",d:55},
            win: {
              r: "Greys. He likes greys, tall and quiet. You show him three. He gives you the keys.",
              fx: {promote:!0,rep:8,favor:4},
            },
            lose: {r:"You show him greys. He hates greys.",fx:{rep:-3}},
          },
          {
            t: "Speak for the old master's daughter instead",
            r: "She knows every horse in the stud by name. She gets the keys, and you get a friend at court.",
            fx: {rep:3,honor:3,newRel:{type:"friend",op:40}},
          },
        ],
      }),
      OPP(["horsemaster"], {
        id: "cm_horse_bloodline",
        minRank: 2,
        minRep: 55,
        time: 3,
        cool: 10,
        cond: (p,C)=>!C.flag(p,"cm_horseline"),
        title: "A bloodline",
        setup: (p,ctx)=>{ctx.cav=cavalry(p),ctx.line=A.pick(["Ironmane","Greywind","Starfoot","Long Dun","Red Morrow","Silverback"])},
        text: "A grey mare of the Nine Winds, tough as a nail and tireless. A heavy destrier stallion bred for {cav}. Cross them, and cross the best of their foals again, for ten years, and you might have a war horse that runs all day and still breaks a line. Or a lot of very expensive mistakes.",
        choices: [
          {
            t: "Begin the line",
            check: {s:"husbandry",s2:"int",d:62},
            win: {
              r: "Ten years, two hundred foals, forty kept. The {line} horses are the talk of every stable, and {cav} want nothing else.",
              fx: {coin:400,rep:15,flag:"cm_horseline",masterwork:"the {line} line of war horses"},
            },
            lose: {
              r: "The foals have the steppe mare's wildness and the destrier's weak hocks. You sell them as plough horses.",
              fx: {coin:-150,rep:-2,wil:1.5,skill:{husbandry:3}},
            },
          },
          {
            t: "Buy into an older line instead (300 suns)",
            req: p=>p.coin>=300,
            r: "A share in someone else's famous horses. Safe, profitable, not yours.",
            fx: {coin:-300,rep:5,perf:10},
          },
          {t:"Not in this lifetime",r:"Lines are for the young.",fx:{}},
        ],
      }),
    ]);
    A.defEvents([
      {
        id: "cm_horse_kick",
        cond: (p,C)=>C.adult(p)&&horseOwner(p),
        cool: 6,
        title: "A kick in the dark",
        text: "Evening feed, a dark stall, and a new horse in it that nobody told you about. You feel him shift his weight and know, half a heartbeat too late, what comes next.",
        choices: [
          {
            t: "Dive for the corner",
            check: {s:"spd",s2:"ins",d:45},
            win: {
              r: "The hoof cracks the board where your head was. You lie in the straw laughing like a fool.",
              fx: {ins:.5},
            },
            lose: {
              r: "It takes you in the thigh. You limp for a month and walk round every horse in the world after.",
              fx: {health:-12,cause:"a horse's kick",wil:1},
            },
          },
          {
            t: "Step in close to his flank",
            check: {s:"husbandry",s2:"ins",d:45},
            win: {
              r: "Close in, a kick only shoves. You stand pressed to his side talking nonsense until he calms.",
              fx: {skill:{husbandry:2}},
            },
            lose: {
              r: "He squeezes you against the wall instead. Two ribs.",
              fx: {health:-10,cause:"a crushing",wound:"broken_ribs"},
            },
          },
          {t:"Shout and back out",r:"He kicks the bucket instead of you. The bucket does not survive.",fx:{}},
        ],
      },
      {
        id: "cm_horse_foal",
        cond: (p,C)=>C.adult(p)&&horseOwner(p),
        cool: 7,
        title: "A foal at midnight",
        text: "A mare foals in the night: a black colt with a white star and four white feet. The old grooms say one white foot buy him, two try him, three doubt him, four do without him. A dealer who saw him at dawn offers 30 suns.",
        choices: [
          {
            t: "Keep him and raise him yourself",
            check: {s:"husbandry",s2:"int",d:50},
            win: {
              r: "The grooms were wrong. Four years later he is the best horse you own.",
              fx: {rep:5,coin:30,skill:{husbandry:2},happy:4},
            },
            lose: {r:"The grooms were right. Soft white hooves, always lame.",fx:{coin:-5,happy:-2}},
          },
          {
            t: "Sell him to the dealer",
            r: "Thirty suns for a horse that cannot yet stand straight.",
            fx: {coin:30},
          },
          {
            t: "Give him to your youngest to raise",
            r: "Your child sleeps in the stable for a month. The foal follows the child like a dog.",
            fx: {happy:5,rel:{who:"child",op:10}},
          },
        ],
      },
      {
        id: "cm_horse_thieves",
        cond: (p,C)=>C.adult(p)&&horseOwner(p),
        cool: 6,
        title: "Horse thieves",
        text: p=>`Hoofbeats in the night, going the wrong way. The stable gate is open, the best horses are gone, and the tracks head for the hills. ${inR(p,"POL-15")?"In Morhaven they hang horse thieves at the town gate.":inR(p,"POL-12")?"Among the Nine Winds the price is nine horses for one, or a hand.":inR(p,"POL-11","POL-34")?"Among orcs, horse theft is half a sport, and settled in horses.":"Horse theft is the oldest crime there is."}`,
        choices: [
          {
            t: "Ride after them now",
            check: {s:"riding",s2:"tracking",d:50},
            win: {
              r: "You catch them at dawn, watering at a stream. They leave the horses and run.",
              fx: {rep:5,fame:1,skill:{tracking:2}},
            },
            lose: {
              r: "They wait for you in the trees.",
              fx: {
                duel: {
                  tier: 2,
                  title: "a horse thief",
                  troop: "LC",
                  opts: {kind:"duel",place:"a stream at dawn",lethal:!1,toYield:!0,title:"Horse thieves"},
                },
              },
            },
          },
          {
            t: "Send word to every fair and dealer",
            check: {s:"intrigue",s2:"persuasion",d:45},
            win: {
              r: "A dealer in {town} recognises your brand on a bay mare. The thieves are taken at the fair.",
              fx: {rep:3,coin:5},
            },
            lose: {r:"Your horses are sold three valleys away before anyone reads your message.",fx:{coin:-60,wil:1}},
          },
          {
            t: "Let them go and buy new locks",
            r: "Horses lost, locks bought. The thieves will be back.",
            fx: {coin:-60,wil:.5},
          },
        ],
      },
    ]);
    const passOf = p=>inR(p,"POL-01","POL-03")?["the Albora Pass","shut from November to April"]:inR(p,"POL-28","POL-29")?["the Zardeep Pass","open June to September, when Stonehold takes one part in ten"]:inR(p,"POL-30","POL-27")?["the Hazdeep Pass","at 3,758 metres, open only from June to September"]:inR(p,"POL-05","POL-06","POL-07")?["the Dunmere Pass","with only Thorncester Inn between you and the snow"]:inR(p,"POL-13")?["the high passes","where Highland mule men charge a sun a day and keep"]:["the pass above "+A.provName(p.home),"where the snow comes early"],
      DESERT = ["POL-17","POL-19","POL-20","POL-24","POL-22"];
    A.defEvents([
      OPP(["explorer"], {
        id: "cm_explorer_pass",
        maxRank: 1,
        cool: 2,
        title: "Over the pass",
        setup: (p,ctx)=>{const ps=passOf(p);ctx.pass=ps[0],ctx.note=ps[1],ctx.Pass=A.cap(ps[0])},
        text: "A merchant train of twenty mules wants a guide over {pass}, {note}. It is late in the season, and the merchant will pay 15 suns to be on the far side before the weather turns. The clouds on the peaks have a grey belly.",
        choices: [
          {
            t: "Push over today, fast",
            check: {s:"survival",s2:"sta",d:45},
            win: {
              r: "You crest the pass as the first snow starts and come down the far side in a white roar. Nobody lost. The merchant pays double.",
              fx: {coin:30,rep:5,skill:{survival:3}},
            },
            lose: {
              r: "The storm catches you at the top. You lose two mules and the feeling in your toes.",
              fx: {coin:10,rep:-3,health:-10,cause:"the cold of the pass",wound:"frostbite"},
            },
          },
          {
            t: "Wait a day at the inn and watch the sky",
            check: {s:"survival",s2:"int",d:40},
            win: {
              r: "The storm blows through in the night. You cross in clean cold sun the next morning.",
              fx: {coin:15,rep:4,int:.3},
            },
            lose: {
              r: "The storm settles in for a week. The merchant pays you to wait and swears the whole time.",
              fx: {coin:8,rep:-1},
            },
          },
          {
            t: "Take the old herders' path round the shoulder",
            req: (p,C)=>C.prof(p,"tracking",40),
            r: "A way only the goats remember. Lower, longer, out of the wind. The merchant thinks you are a wizard.",
            fx: {coin:20,rep:5,skill:{tracking:2}},
          },
        ],
      }),
      OPP(["explorer"], {
        id: "cm_explorer_pilgrims",
        maxRank: 1,
        cool: 4,
        title: "Lost pilgrims",
        setup: (p,ctx)=>{ctx.road=inR(p,"POL-27","POL-28","POL-29","POL-30")?"on the Bluespire circuit, high on the Roof":inR(p,"POL-02","POL-03","POL-31")?"on the hill road to Solenne":inR(p,"POL-17","POL-24","POL-19")?"on the desert road to the Well of Samar":"on the high road to the shrine"},
        text: "A party of twelve pilgrims has not come down {road}. Their families pay you 6 suns to find them. You find them on the second day: sitting in the snow by the path, vomiting, heads splitting, sure that the gods are testing them.",
        choices: [
          {
            t: "Get them down, now, all of them",
            check: {s:"survival",s2:"command",d:45},
            win: {
              r: "You know what thin air does to lowlanders. Down is the only cure. A thousand feet lower they are laughing and weeping and kissing your hands.",
              fx: {coin:6,rep:6,honor:3,piety:2},
            },
            lose: {
              r: "Two will not move. You carry one and lose the other in the night.",
              fx: {coin:6,rep:2,wil:1.5,happy:-4},
            },
          },
          {
            t: "Let them finish the circuit, slowly",
            r: "They insist. You walk them round slowly, and one of them dies of it on the far side. The rest call it holy.",
            fx: {coin:6,piety:3,wil:1,rep:-1},
          },
          {
            t: "Ask their pardon and take the money home",
            r: "You found them. Someone else can carry them.",
            fx: {coin:6,honor:-5},
          },
        ],
      }),
      OPP(["explorer"], {
        id: "cm_explorer_wells",
        minRank: 1,
        maxRank: 2,
        cool: 3,
        cond: (p,C)=>inR(p,...DESERT)||C.terr(p,"desert"),
        title: "Water three digs in four",
        text: "A caravan of two hundred camels must cross the Red Waste by night. The Brotherhood of Guides charges 2 suns a camel and swears its guide to the caravan by water. The well at the halfway camp has gone salty. Khalid the Star, they say, knows of another, but he tells no one.",
        choices: [
          {
            t: "Find water where the old signs point",
            check: {s:"survival",s2:"tracking",d:55},
            win: {
              r: "Green in a dry wadi, a darker sand, birds at dusk. You dig, and at a man's depth the sand turns wet. The caravan master gives you a share.",
              fx: {coin:60,rep:8,fame:1,skill:{survival:4}},
            },
            lose: {
              r: "Three dry holes. You lead them on to the next well on half rations, and three camels die.",
              fx: {coin:15,rep:-3,health:-8,cause:"thirst",wil:1.5},
            },
          },
          {
            t: "Seek out Khalid the Star and ask",
            check: {s:"diplomacy",s2:"etiquette",d:55},
            win: {
              r: "You find him at Zarak and sit with him three nights. On the fourth he draws a line in the sand and wipes it away. It is enough.",
              fx: {coin:40,rep:6,newRel:{type:"mentor",op:30}},
            },
            lose: {r:"He serves you coffee, talks of stars, and tells you nothing at all.",fx:{int:.3}},
          },
          {
            t: "Turn back to the last good well",
            r: "Two days lost, no lives lost. The caravan master grumbles all the way to market.",
            fx: {coin:20,rep:1},
          },
        ],
      }),
      OPP(["explorer"], {
        id: "cm_explorer_blank",
        minRank: 1,
        maxRank: 3,
        time: 2,
        cool: 6,
        cond: (p,C)=>!p.flags["cm_map_"+(WILD_OF[p.realm]||"marches")],
        title: "The blank on the map",
        setup: (p,ctx)=>{const w=wild(p);ctx.wild=w[0],ctx.what=w[1],ctx.wk=WILD_OF[p.realm]||"marches"},
        text: "The best map of {wild} in {capital} is a sheet of parchment with three rivers in the wrong places and 'here be bears' written across the middle. Out there lies {wild}: {what}. A season with a compass needle, a knotted cord and good boots could change that.",
        choices: [
          {
            t: "Walk it, measure it, draw it",
            check: {s:"tracking",s2:"learning",d:58},
            win: {
              r: "A summer of pacing, sighting and sleeping cold. Your map has the rivers where they are. Every captain and merchant who goes there wants a copy.",
              fx: (p,ctx)=>(p.flags["cm_map_"+(ctx.wk||"marches")]=A.S.year,p.coin+=150,A.applyFx(p,{rep:12,masterwork:"the first true map of {wild}",skill:{tracking:3,learning:3}},ctx)),
            },
            lose: {
              r: "Fever, a lost notebook and a river that would not be crossed. You come home with half a map and a cough.",
              fx: {coin:20,health:-10,cause:"a fever in the wilds",wil:1.5,rep:2},
            },
          },
          {
            t: "Hire local guides and draw what they know",
            check: {s:"diplomacy",s2:"learning",d:50},
            win: {
              r: "Herders, trappers and outlaws each know a piece. Put together, the pieces make a map, and a good one.",
              fx: {coin:80,rep:8,skill:{diplomacy:2}},
            },
            lose: {r:"Every guide draws his own valley twice the size it is.",fx:{coin:-10,rep:-1}},
          },
          {
            t: "Copy the old map neatly and sell it",
            r: "A handsome map, wrong in every particular. It sells.",
            fx: {coin:25,honor:-2},
          },
        ],
      }),
      OPP(["explorer"], {
        id: "cm_explorer_widow_gold",
        minRank: 2,
        minRep: 50,
        time: 3,
        cool: 10,
        cond: (p,C)=>!C.flag(p,"cm_tirana"),
        title: "The Widow's gold",
        text: "Three expeditions to the gold streams of the upper Tirana have died under the Red Widow: 1062, 1079, 1097. The bankers of Ostra and Lucerna are planning a fourth, and want a pathfinder. In a Madara tavern, a burn-scarred survivor named Jory Flint is drinking himself to death on a second map, watched by a Debt-Hound.",
        choices: [
          {
            t: "Lead the expedition, the bankers' way",
            check: {s:"survival",s2:"tracking",d:68},
            win: {
              r: "You learn her dawn flights and move only in the afternoons. You come back with gold dust in a goose-quill and a map of every stream. The bankers make you rich.",
              fx: {coin:900,fame:8,rep:15,flag:"cm_tirana",masterwork:"the map of the upper Tirana gold streams"},
            },
            lose: {
              r: "She comes at noon, out of the sun. You live because you were at the back. Most of the others were not.",
              fx: {health:-35,cause:"dragon-fire",wound:"burn",wil:3,rep:-4,flag:"cm_tirana"},
            },
          },
          {
            t: "Buy Jory Flint out of his debts, and his map with him",
            req: p=>p.coin>=300,
            check: {s:"persuasion",s2:"intrigue",d:55},
            win: {
              r: "Three hundred suns to the Debt-Hound, and Jory weeps on your shoulder. He tells you what he has told no one: a bolt tore her right wing, and she turns slowly to the left.",
              fx: {coin:-300,rep:6,flag:"cm_tirana",skill:{intrigue:2},newRel:{type:"friend",op:40}},
            },
            lose: {r:"The Debt-Hound takes your money and keeps Jory too.",fx:{coin:-300,wil:1}},
          },
          {
            t: "Sell the bankers your advice, not your life",
            r: "Fifty suns for an evening telling them how expeditions die. They do not listen.",
            fx: {coin:50,rep:2},
          },
        ],
      }),
      OPP(["explorer"], {
        id: "cm_explorer_isle_pearls",
        minRank: 2,
        maxRank: 3,
        cool: 10,
        title: "The Isle of Pearls",
        text: "The Amber Isles mean to land on the Isle of Pearls when the sea opens in April. Nobody knows the interior: reefs outside, fever on the shore, cloud forest inside, and a flightless bird as tall as a horse. A castaway named Corwin Saltmarsh claims to have mapped it, and is selling the same map to two courts at once.",
        choices: [
          {
            t: "Go and map it yourself before April",
            check: {s:"survival",s2:"tracking",d:60},
            win: {
              r: "Six weeks under dripping trees, half of them with fever. Your map is better than Saltmarsh's, and the sultan's admiral pays for it.",
              fx: {coin:400,rep:10,fame:3,masterwork:"the map of the Isle of Pearls"},
            },
            lose: {
              r: "Coast fever takes you in the second week. You are carried back to the boat by divers.",
              fx: {health:-25,cause:"coast fever",wil:2,coin:-30},
            },
          },
          {
            t: "Buy Saltmarsh's map and check it",
            check: {s:"trade",s2:"learning",d:50},
            win: {
              r: "His map is half true. You know which half, and sell your corrections to the Keshi.",
              fx: {coin:150,rep:5},
            },
            lose: {r:"His map is a third true, and you cannot tell which third.",fx:{coin:-60}},
          },
          {
            t: "Bring back a roc egg instead",
            check: {s:"stealth",s2:"athletics",d:62},
            win: {
              r: "Ten litres of egg in a basket of moss. Amberport's market goes silent when you set it down.",
              fx: {coin:600,fame:4,rep:4},
            },
            lose: {r:"The roc cannot fly. It can kick.",fx:{health:-20,cause:"a roc's kick",wound:"broken_ribs"}},
          },
        ],
      }),
      OPP(["explorer"], {
        id: "cm_explorer_old_road",
        minRank: 1,
        maxRank: 3,
        cool: 6,
        title: "The old road",
        setup: (p,ctx)=>{ctx.ruin=inR(p,"POL-31","POL-14","POL-15","POL-25")?"Castra Aquena, a Solen fort in the Free Marches":inR(p,"POL-01","POL-08","POL-10")?"the fallen giant hall of Old Torberg in the Pinewild":inR(p,"POL-03","POL-05")?"the buried towns of Hael under the ash":"a road station of the old Neck Empire"},
        text: "An old shepherd swears he knows the way to {ruin}: a road that has not been walked in two hundred years, under moss and fallen trees. Scholars in {capital} would pay for what is there. So, perhaps, would treasure hunters.",
        choices: [
          {
            t: "Find it and record everything",
            check: {s:"tracking",s2:"learning",d:55},
            win: {
              r: "Inscriptions, milestones, a gate still standing. Your drawings go to the scholars, and your name with them.",
              fx: {coin:60,rep:8,fame:2,int:.5},
            },
            lose: {
              r: "The shepherd's way leads to a bog. The ruin keeps its secrets.",
              fx: {health:-5,cause:"a bog",rep:-1},
            },
          },
          {
            t: "Find it and dig for coin",
            check: {s:"survival",s2:"str",d:50},
            win: {
              r: "Under a fallen wall, a jar of old silver. You sell it by weight in three different towns.",
              fx: {coin:120,honor:-2},
            },
            lose: {r:"A wall comes down on your leg.",fx:{health:-14,cause:"a falling wall",wound:"limp"}},
          },
          {
            t: "Sell the shepherd's directions to a scholar",
            r: "Twenty suns, and the scholar's thanks. Somebody else gets the mud.",
            fx: {coin:20,rep:1},
          },
        ],
      }),
      OPP(["explorer"], {
        id: "cm_explorer_border",
        minRank: 2,
        maxRank: 3,
        cool: 8,
        title: "The boundary commission",
        setup: (p,ctx)=>{const e=A.enemyRealmOf(p.realm)||((LORE.realms[p.realm]||{}).rivals||[])[0];ctx.enemyR=e&&e!==p.realm?A.realmShort(e):"its oldest neighbour"},
        text: "{realmShort} and {enemyR} have argued for forty years over a river that has moved twice. Both sides have agreed to accept a survey. Yours. Two men have already called on you: one with a purse, the other with a smile you did not like.",
        choices: [
          {
            t: "Survey it honestly, whoever loses",
            check: {s:"learning",s2:"wil",d:55},
            win: {
              r: "The old riverbed is plain to an honest eye. Both sides grumble, which proves the line is fair. It holds for a generation.",
              fx: {coin:100,rep:12,fame:3,honor:5},
            },
            lose: {
              r: "Your honest line pleases no one, and both sides call you bought.",
              fx: {coin:100,rep:-2,newRel:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Take the purse and draw the line your way",
            r: "A few hundred paces of meadow move to {realmShort}. The {rulerTitle} is pleased. The other side is not, and remembers.",
            fx: {coin:300,favor:8,honor:-6,newRel:{type:"enemy",op:-50}},
          },
          {
            t: "Take both purses and draw it straight down the middle",
            check: {s:"deception",s2:"intrigue",d:60},
            win: {
              r: "Each side thinks the other paid more. You are rich, and they are equally unhappy.",
              fx: {coin:600,honor:-8},
            },
            lose: {r:"The two men compare notes.",fx:{coin:100,rep:-10,honor:-8,favor:-10}},
          },
        ],
      }),
      OPP(["explorer"], {
        id: "cm_explorer_farstep",
        minRank: 1,
        maxRank: 3,
        once: !0,
        cond: p=>!(p.flags.ev&&p.flags.ev.cm_explorer_farstep),
        title: "The elf with the map-case",
        text: "Caelan Farstep is an elf of two hundred and twenty-four years who has spent a century mapping the passes and salt lakes of the High Wastes. He is going over the Hazdeep Pass to Skyhold in June with a diary he will not let out of his hands, and he wants a younger pair of legs. He sketches you while he asks.",
        choices: [
          {
            t: "Go with him",
            check: {s:"survival",s2:"sta",d:55},
            win: {
              r: "Three weeks on the Roof. He teaches you to see a mountain the way a mason sees a wall. At Skyhold he gives the diary to someone in a sickroom and weeps, once.",
              fx: {rep:8,int:.5,skill:{tracking:4,survival:3,learning:2},newRel:{type:"mentor",op:50}},
            },
            lose: {
              r: "The thin air flattens you at the top of the pass. He carries your pack and does not say a word about it.",
              fx: {health:-12,cause:"the thin air",rep:2,newRel:{type:"mentor",op:30}},
            },
          },
          {
            t: "Ask to copy his maps instead",
            check: {s:"persuasion",s2:"learning",d:60},
            win: {
              r: "He lets you copy one. It is worth more than anything you own.",
              fx: {rep:6,skill:{learning:3},coin:50},
            },
            lose: {r:'"Maps are walked, not copied," he says, kindly, and rolls them up.',fx:{int:.3}},
          },
          {
            t: "Decline",
            r: "He nods and goes on sketching. You are in the sketch, a little smaller than life.",
            fx: {},
          },
        ],
      }),
      OPP(["explorer"], {
        id: "cm_explorer_sealed_delve",
        minRank: 1,
        maxRank: 3,
        cool: 8,
        title: "A sealed door",
        setup: (p,ctx)=>{ctx.where=inR(p,"POL-01","POL-08","POL-10","POL-11","POL-12")?"deep in the Pinewild":inR(p,"POL-27","POL-28","POL-29","POL-30")?"under the Worldspine":"in the hills beyond the last village",ctx.Where=A.cap(ctx.where)},
        text: "{Where} you find a door in the rock, eight feet high, cut with dwarven runes and sealed with poured metal. A sealed delve. The dwarves sealed it for a reason, and the reason is carved on the door in a script you cannot read.",
        choices: [
          {
            t: "Take a rubbing of the runes to a dwarven hold",
            check: {s:"diplomacy",s2:"learning",d:50},
            win: {
              r: "A Law-Carver reads it and goes pale under his beard. The hold pays you well, makes you swear never to return, and carves your name on a stone that faces outward.",
              fx: {coin:150,rep:8,honor:3,newRel:{type:"friend",op:30}},
            },
            lose: {r:"The dwarves at the gate will not even look at the rubbing.",fx:{rep:-1}},
          },
          {
            t: "Break the seal",
            check: {s:"str",s2:"craft",d:60},
            win: {
              r: "Dust, cold air, empty galleries and one chest the dwarves forgot. You take it and leave fast.",
              fx: {coin:200,honor:-4,newRel:{type:"enemy",op:-40}},
            },
            lose: {
              r: "Bad air pours out of the dark. You come to an hour later, outside, with no memory of crawling.",
              fx: {health:-18,cause:"bad air in a sealed delve",wound:"lungs",wil:1},
            },
          },
          {
            t: "Mark it on your map, and leave it be",
            r: "Some doors are on maps so that people know not to open them.",
            fx: {rep:2,int:.3},
          },
        ],
      }),
      OPP(["explorer"], {
        id: "cm_explorer_royal_charter",
        minRank: 2,
        maxRank: 2,
        minRep: 60,
        cool: 6,
        title: "A royal charter",
        text: "The {rulerTitle}'s chancellor wants every claim {realmShort} makes on unclaimed land written down, walked and mapped before a rival realm does it first. The charter needs a name at the top: Royal Explorer, with an escort, a stipend and a seal.",
        choices: [
          {
            t: "Lay your maps before the chancellor",
            check: {s:"learning",s2:"persuasion",d:58},
            win: {
              r: "He turns your maps over for an hour, saying nothing. Then he sends for the seal.",
              fx: {promote:!0,rep:10,fame:3,favor:8},
            },
            lose: {r:"He prefers a nobleman's son who has never left the capital.",fx:{rep:-3}},
          },
          {
            t: "Promise him the moon",
            check: {s:"deception",s2:"persuasion",d:55},
            win: {r:"He believes you. Now you must find the moon.",fx:{promote:!0,rep:6,favor:4}},
            lose: {r:"He has heard promises before.",fx:{rep:-4,favor:-3}},
          },
          {
            t: "Recommend your old mentor",
            r: "The old explorer gets the seal and makes you his deputy in all but name.",
            fx: {rep:4,coin:50,newRel:{type:"friend",op:35}},
          },
        ],
      }),
      OPP(["explorer"], {
        id: "cm_explorer_edge",
        minRank: 3,
        minRep: 55,
        time: 3,
        cool: 10,
        title: "The edge of the map",
        setup: (p,ctx)=>{ctx.edge=inR(p,"POL-25","POL-26","POL-34","POL-12","POL-11")?"east along the Silk Road, past the Tusk Clans, to where the silk comes from":inR(p,"POL-21","POL-22","POL-20","POL-32")?"south off the edge of the map, beyond the Deep Green":"west across the Western Ocean, past the Strait of Hael, where no chart goes"},
        text: "Every map of the Known World ends somewhere. The {rulerTitle} will pay for an expedition {edge}: three years, forty people, and very possibly no return. Your name would be on it either way.",
        choices: [
          {
            t: "Lead the expedition",
            check: {s:"survival",s2:"command",d:68},
            win: {
              r: "Three years. Eleven of the forty dead. You come home with maps, seeds, a language nobody has heard and a story that will outlive you.",
              fx: {
                coin: 1200,
                fame: 12,
                rep: 15,
                favor: 10,
                masterwork: "the Royal Atlas of {realmShort}",
                deed: "Led an expedition beyond the edge of the known map",
              },
            },
            lose: {
              r: "A year in, half the company dead, you turn back. Nobody blames you to your face.",
              fx: {health:-25,cause:"hardship beyond the map",wil:3,fame:3,rep:-4},
            },
          },
          {
            t: "Plan it, and send your best pupil",
            r: "You equip it, chart it and wave it off. Your pupil comes back famous, and thanks you in the first line of the book.",
            fx: {coin:300,rep:8,fame:3},
          },
          {t:"Turn it down",r:"The edge of the map will still be there. So will you.",fx:{}},
        ],
      }),
    ]);
    A.defEvents([
      {
        id: "cm_explorer_frost",
        cond: (p,C)=>C.adult(p)&&pathfinder(p),
        cool: 7,
        title: "The high camp",
        text: "A night camp on a bare shoulder of mountain, with no wood and a wind that finds every seam in your coat. By midnight you cannot feel your feet.",
        choices: [
          {
            t: "Walk down in the dark",
            check: {s:"survival",s2:"ins",d:50},
            win: {
              r: "Two hours of careful feet, and you reach the trees. A fire, and pain coming back into your toes like wasps.",
              fx: {wil:1,skill:{survival:2}},
            },
            lose: {
              r: "A misstep in the dark. You lie on the scree till dawn.",
              fx: {health:-12,cause:"a fall in the dark",wound:"bad_knee",wil:1.5},
            },
          },
          {
            t: "Dig in and wait for dawn",
            check: {s:"sta",s2:"wil",d:50},
            win: {
              r: "A trench in the snow, your pack over your feet. You come out at dawn stiff and whole.",
              fx: {wil:1.5,sta:.5},
            },
            lose: {r:"You live. Two toes do not.",fx:{health:-10,cause:"frostbite",wound:"frostbite",wil:2}},
          },
          {
            t: "Burn your spare notebook for a fire",
            r: "A season of notes, for one hour of warmth. You live, and you remember most of it.",
            fx: {wil:.5,int:-.2},
          },
        ],
      },
      {
        id: "cm_explorer_notebooks",
        cond: (p,C)=>C.adult(p)&&pathfinder(p)&&C.literate(p),
        cool: 7,
        title: "Rain on the ink",
        text: "A river crossing goes wrong, and your pack goes under. Your notebooks come out as a grey pulp: three months of bearings, distances and sketches, gone.",
        choices: [
          {
            t: "Rewrite everything from memory, tonight",
            check: {s:"int",s2:"wil",d:50},
            win: {
              r: "By dawn you have most of it back, and some of it is better than before.",
              fx: {int:.5,wil:1,skill:{learning:2}},
            },
            lose: {r:"Memory is a liar. You walk the last month again.",fx:{wil:1,sta:.5}},
          },
          {
            t: "Go back and walk it again",
            r: "Three more weeks. The second map is better than the first would have been.",
            fx: {sta:1,skill:{tracking:2}},
          },
          {t:"Give it up as a bad season",r:"Some seasons belong to the river.",fx:{happy:-4}},
        ],
      },
      {
        id: "cm_explorer_tavern_tale",
        cond: (p,C)=>C.adult(p)&&pathfinder(p),
        cool: 6,
        title: "A drunk with a secret",
        setup: (p,ctx)=>{who(p,ctx,"a drunk old trapper"),ctx.secret=A.pick(["a pass nobody uses, that saves nine days","a spring in the dry country that never fails","a cave full of old paintings","a lake that is not on any map"])},
        text: "{them}, very drunk, swears {theyHe} knows {secret}. {They} will draw you the way for a jug of wine. Half the men in the tavern have heard this before. The other half are listening.",
        choices: [
          {
            t: "Buy the jug and get the drawing",
            check: {s:"ins",s2:"tracking",d:50},
            win: {
              r: "The drawing is crude, and true. You walk it the next season and it is exactly where {theyHe} said.",
              fx: {coin:-1,rep:5,skill:{tracking:2},them:{type:"friend",op:25}},
            },
            lose: {r:"The drawing leads to a sheep-fold and a very surprised shepherd.",fx:{coin:-1,happy:-2}},
          },
          {
            t: "Buy the jug, and keep {themHim} talking",
            check: {s:"persuasion",s2:"int",d:45},
            win: {
              r: "By midnight you have the drawing, three other secrets and {theirHis} life story.",
              fx: {coin:-1,rep:3,int:.3,them:{type:"friend",op:30}},
            },
            lose: {r:"{They} falls asleep mid-sentence. The innkeeper charges you for the jug.",fx:{coin:-1}},
          },
          {t:"Laugh with the rest",r:"You laugh. Someone else buys the jug.",fx:{}},
        ],
      },
    ]);
    const outlawCrime = ()=>A.pick(["killed a reeve over a fine","robbed the tithe cart and beat the priest","burned a mill with the miller inside","broke an oath on the iron ring and fled","held up three carts on the high road","knifed a man at a fair and ran"]);
    A.defEvents([
      OPP(["bounty"], {
        id: "cm_bounty_debtor",
        maxRank: 1,
        cool: 3,
        title: "A small debt",
        setup: (p,ctx)=>{who(p,ctx,"a runaway debtor")},
        text: "A cloth merchant pays 5 suns to have {them} brought back: {theyHe} owes him 30 and ran in the night. You find {themHim} in two days, in a hut in the woods, with three children and a cooking pot with nothing in it.",
        choices: [
          {
            t: "Bring {themHim} in",
            r: "The merchant has {themHim} thrown in the debtors' cell. The children go to a cousin. Five suns.",
            fx: {coin:5,rep:4,wil:.5,them:{type:"enemy",op:-40}},
          },
          {
            t: "Tell the merchant you could not find {themHim}",
            r: "No pay, and a merchant who thinks you are useless. The children eat, for now.",
            fx: {rep:-3,honor:3,them:{type:"friend",op:40}},
          },
          {
            t: "Make {themHim} a deal: pay a little each month",
            check: {s:"persuasion",s2:"trade",d:45},
            win: {
              r: "The merchant would rather have his money than a man in a cell. You get your 5 suns and a share of the payments.",
              fx: {coin:8,rep:4,honor:2,them:{type:"friend",op:20}},
            },
            lose: {
              r: "The merchant wants {themHim} in a cell as a lesson to others.",
              fx: {coin:5,rep:1,them:{type:"enemy",op:-20}},
            },
          },
        ],
      }),
      OPP(["bounty"], {
        id: "cm_bounty_hue_and_cry",
        maxRank: 1,
        cool: 2,
        title: "Hue and cry",
        text: '"Thief! Thief!" A cutpurse goes through the market at {town} like a hare, and the hue and cry goes up behind him: every neighbour must answer it or be fined. The watch-captain pays a sun to whoever brings him down.',
        choices: [
          {
            t: "Run him down",
            check: {s:"spd",s2:"athletics",d:40},
            win: {
              r: "Over a fish stall, through a tannery, and you have him by the collar at the river steps.",
              fx: {coin:2,rep:4,spd:.3},
            },
            lose: {r:"He is faster. You arrive at the river steps alone and wet.",fx:{rep:-1}},
          },
          {
            t: "Cut him off by the back lanes",
            check: {s:"int",s2:"tracking",d:42},
            win: {
              r: "You know where every lane comes out. So, it turns out, does he, but you get there first.",
              fx: {coin:2,rep:4,skill:{tracking:2}},
            },
            lose: {r:"He knows one lane you do not.",fx:{}},
          },
          {
            t: "Let the crowd do it, and claim him after",
            r: "The crowd catches him and kicks him. You take him to the watch-captain. Everyone knows who did the running.",
            fx: {coin:1,rep:-1},
          },
        ],
      }),
      OPP(["bounty"], {
        id: "cm_bounty_horse_thief",
        minRank: 1,
        maxRank: 2,
        cool: 4,
        title: "The horse thief",
        setup: (p,ctx)=>{who(p,ctx,"a horse thief"),ctx.law=inR(p,"POL-15")?"In Morhaven they hang horse thieves at the town gate.":inR(p,"POL-12")?"Among the Nine Winds it is nine horses for one, or a hand.":"Horse thieves hang in most realms, sooner or later."},
        text: "A lord's grey mare is gone, and the lord pays 20 suns for the thief. {law} You track the mare to a ravine. The thief is {them}, a hungry youth who is holding the mare's head and crying.",
        choices: [
          {
            t: "Bring in the thief and the mare",
            r: "The lord pays. What happens at the gate is the law's business. You do not stay to watch.",
            fx: {coin:20,rep:6,wil:1,them:{type:"enemy",op:-60}},
          },
          {
            t: "Bring in the mare, and let the youth run",
            r: "The lord pays half for the mare and nothing for the thief. The youth is over the hill before you change your mind.",
            fx: {coin:10,rep:2,honor:3,them:{type:"friend",op:40}},
          },
          {
            t: "Say the thief fought, and you killed him",
            check: {s:"deception",s2:"wil",d:50},
            win: {
              r: "The lord pays in full for a dead thief. The youth walks east with a new name.",
              fx: {coin:20,rep:4,honor:1,them:{type:"friend",op:50}},
            },
            lose: {
              r: "The lord's huntsman finds the youth a week later. Now there are two liars to deal with.",
              fx: {rep:-8,favor:-5},
            },
          },
        ],
      }),
      OPP(["bounty"], {
        id: "cm_bounty_outlaw",
        minRank: 1,
        maxRank: 3,
        time: 2,
        cool: 3,
        title: "Wanted",
        setup: (p,ctx)=>{who(p,ctx,"an outlaw with a price on his head"),ctx.crime=outlawCrime(),ctx.price=A.pick([40,60,80])},
        text: "{themFull} {crime}, and has been declared outlaw: outside the law, so that anyone may take or kill {themHim} and nobody may shelter {themHim}. The price is {price} suns. Most outlaws die within a few years or reach the Free Marches. This one is still close.",
        choices: [
          {
            t: "Track {themHim} down and take {themHim} alive",
            check: {s:"tracking",s2:"intimidation",d:55},
            win: {
              r: "Three days on the trail. You walk into {theirHis} camp at dawn, and {theyHe} looks at you and puts the knife down.",
              fx: {coin:60,rep:8,skill:{tracking:3},them:{type:"enemy",op:-40}},
            },
            lose: {
              r: "{They} will not come quietly.",
              fx: {
                coin: 30,
                rep: 3,
                duel: {
                  foe: "them",
                  opts: {kind:"duel",place:"an outlaw's camp",lethal:!0,toYield:!0,title:"Taking an outlaw"},
                },
              },
            },
          },
          {
            t: "Find {theirHis} kin, and wait",
            check: {s:"intrigue",s2:"stealth",d:50},
            win: {
              r: "Every outlaw comes home once. You are in the byre when {theyHe} does.",
              fx: {coin:60,rep:6,them:{type:"enemy",op:-40}},
            },
            lose: {r:"{Their} kin warn {themHim}. {They} is in the Free Marches by the new moon.",fx:{rep:-2}},
          },
          {
            t: "Go in hard and kill {themHim}",
            r: "The law says you may. You find {themHim} at a ford.",
            fx: {
              coin: 40,
              rep: 4,
              honor: -2,
              duel: {foe:"them",opts:{kind:"duel",place:"a ford",lethal:!0,toYield:!1,title:"Outlaw"}},
            },
          },
          {
            t: "Hear {theirHis} side first",
            check: {s:"ins",s2:"persuasion",d:50},
            win: {
              r: "The reeve {theyHe} killed had hanged {theirHis} brother on a false oath. You bring {themHim} in alive, and you bring the witnesses too. {They} hangs anyway; the reeve's son is fined.",
              fx: {coin:40,rep:6,honor:4,them:{type:"acquaint",op:20}},
            },
            lose: {
              r: "The side {theyHe} tells you is a lie, and the knife is real.",
              fx: {health:-12,cause:"an outlaw's knife",wound:"deep_cut",rep:-2},
            },
          },
        ],
      }),
      OPP(["bounty"], {
        id: "cm_bounty_deserters",
        minRank: 1,
        maxRank: 2,
        cool: 4,
        title: "Deserters on the road",
        setup: (p,ctx)=>{ctx.road=inR(p,"POL-31","POL-18","POL-21","POL-22")?"the Neck road, where Tessaria hangs deserters at the road stations":"the high road"},
        text: "A band of six deserters has turned bandit on {road}. The captain they ran from pays 8 suns a head, alive. Two of them, the carters say, are boys of fifteen who were pressed off their fathers' farms.",
        choices: [
          {
            t: "Take the whole band",
            check: {s:"tactics",s2:"intimidation",d:58},
            win: {
              r: "You wait for them to get drunk on a stolen cask and walk into their camp with a crossbow and a loud voice. Six heads, 48 suns.",
              fx: {coin:48,rep:8,fame:1},
            },
            lose: {
              r: "They are not as drunk as you thought.",
              fx: {
                coin: 8,
                duel: {
                  tier: 2,
                  title: "a deserter",
                  troop: "SP",
                  opts: {kind:"duel",place:"a bandit camp",lethal:!0,toYield:!0,title:"Deserters"},
                },
              },
            },
          },
          {
            t: "Take the four men and let the boys go",
            check: {s:"tactics",s2:"command",d:52},
            win: {
              r: "Four for the rope, two sent home with a warning and a crust. You sleep fine.",
              fx: {coin:32,rep:6,honor:3},
            },
            lose: {r:"The boys run to warn the men. The band is gone by morning.",fx:{rep:-2}},
          },
          {t:"Leave this one to the captain",r:"Not every price is worth collecting.",fx:{}},
        ],
      }),
      OPP(["bounty"], {
        id: "cm_bounty_debt_hounds",
        minRank: 1,
        maxRank: 3,
        cool: 6,
        title: "The banks' work",
        text: "Ostra's banks send Debt-Hounds after fled debtors, and one of them, Lupo Varga, needs a second pair of hands. A banker's clerk ran to Madara in the Free Marches with a ledger and the bank's money. Varga pays 50 suns for help bringing the clerk home, and says the ledger matters more than the man.",
        choices: [
          {
            t: "Ride with Varga",
            check: {s:"tracking",s2:"intimidation",d:50},
            win: {
              r: "Madara's free town has no law but its own. You take the clerk out of a bathhouse at night. Varga pays, and remembers your name.",
              fx: {coin:50,rep:6,honor:-2,newRel:{type:"friend",op:20}},
            },
            lose: {
              r: "The clerk has friends in Madara. You leave town faster than you came, with Varga cursing you.",
              fx: {coin:10,health:-10,cause:"a Madara alley",rep:-3},
            },
          },
          {
            t: "Ride with Varga, and read the ledger yourself",
            check: {s:"intrigue",s2:"learning",d:58},
            win: {
              r: "Three councillors of Ostra have been robbing their own bank. You keep a copy of one page. It is worth more than Varga's 50 suns, for years.",
              fx: {coin:50,rep:3,flag:"cm_ledger",skill:{intrigue:3}},
            },
            lose: {
              r: "Varga catches you reading. He does not say anything. He does not have to.",
              fx: {coin:20,newRel:{type:"enemy",op:-40}},
            },
          },
          {t:"Turn him down",r:"Varga shrugs. He has hounds enough.",fx:{}},
        ],
      }),
      OPP(["bounty"], {
        id: "cm_bounty_thief_taker",
        minRank: 1,
        maxRank: 1,
        minRep: 40,
        cool: 5,
        title: "The thief-taker's game",
        text: "The merchants' guild of {capital} wants its stolen silver back, and will pay a fifth of its value to whoever returns it, no questions. You know which fence has it. A thief-taker either arrests the fence, or arranges the return and takes a cut from both ends. The first is law. The second is a living.",
        choices: [
          {
            t: "Arrest the fence and his thieves",
            check: {s:"intimidation",s2:"tactics",d:55},
            win: {
              r: "The fence, two thieves and the silver, in one morning. The guild makes you its thief-taker, with a staff and a stipend.",
              fx: {coin:60,promote:!0,rep:8,honor:2,newRel:{type:"enemy",op:-40}},
            },
            lose: {r:"The fence has a back door and the silver goes with him.",fx:{rep:-3}},
          },
          {
            t: "Arrange the return, quietly, for both cuts",
            check: {s:"intrigue",s2:"trade",d:55},
            win: {
              r: "The guild gets its silver, the fence gets his fee, and you get yours twice. Within the year, half the stolen goods in town come back through you.",
              fx: {coin:120,promote:!0,rep:6,honor:-5},
            },
            lose: {r:"The guild finds out who you paid.",fx:{rep:-8,honor:-5}},
          },
          {t:"Leave it",r:"The silver stays gone.",fx:{}},
        ],
      }),
      OPP(["bounty"], {
        id: "cm_bounty_wrong_man",
        minRank: 1,
        maxRank: 3,
        cool: 6,
        title: "The wrong man",
        setup: (p,ctx)=>{who(p,ctx,"a prisoner"),ctx.lord=lordT(p)},
        text: "You brought in {them} for a killing, and you were paid. Now, in the cell, the story does not hold: wrong height, wrong hand, and a tavern of witnesses who say {theyHe} was drunk under their table that night. The hanging is at noon tomorrow. {lord} wants it to go ahead; a hanging calms a town.",
        choices: [
          {
            t: "Bring the witnesses before the court",
            check: {s:"persuasion",s2:"learning",d:55},
            win: {
              r: "Noon comes and goes without a hanging. {them} walks out into the sun, and the real killer starts running.",
              fx: {rep:6,honor:6,coin:-10,them:{type:"friend",op:60}},
            },
            lose: {
              r: "The court hears them and hangs {themHim} anyway. You will never take that fee off your conscience.",
              fx: {honor:2,wil:2,happy:-8,rep:-2},
            },
          },
          {
            t: "Find the real killer before noon",
            check: {s:"tracking",s2:"intrigue",d:62},
            win: {
              r: "A night of doors and threats. At dawn you bring in the real one, with blood still in the seams of his boots.",
              fx: {coin:30,rep:12,fame:2,honor:5,them:{type:"friend",op:60}},
            },
            lose: {r:"Noon comes first.",fx:{wil:2,happy:-8,rep:-1}},
          },
          {
            t: "Keep the fee and your mouth shut",
            r: "It is the court's business. You stay away from the square at noon.",
            fx: {honor:-8,wil:.5,them:{type:"enemy",op:-80}},
          },
        ],
      }),
      OPP(["bounty"], {
        id: "cm_bounty_black_manes",
        minRank: 2,
        minRep: 50,
        time: 2,
        cool: 8,
        title: "The Black Manes",
        text: "The Black Manes, two hundred orcs and half-orcs under Rakka Blackmane, rob the March Road near Calella. The free towns of the Marches will pay 200 suns for the head of Rakka's best rider, who killed a magistrate's son. Grena Mossfoot, a half-orc huntress, offers to guide you. She is said to trade news with everyone, Rakka included.",
        choices: [
          {
            t: "Hire Grena, and feed her false news",
            check: {s:"deception",s2:"tracking",d:60},
            win: {
              r: "She tells Rakka you are going north. You go south and find the rider alone at a spring.",
              fx: {
                coin: 100,
                rep: 6,
                duel: {
                  tier: 4,
                  title: "a rider of the Black Manes",
                  troop: "LC",
                  race: "orc",
                  opts: {kind:"duel",place:"a spring by the March Road",lethal:!0,toYield:!0,title:"The Black Manes"},
                },
              },
            },
            lose: {
              r: "Grena is cleverer than you. Six riders are waiting where you meant to be alone.",
              fx: {health:-20,cause:"Black Mane spears",wound:"deep_cut",rep:-4,wil:1.5},
            },
          },
          {
            t: "Go without a guide",
            check: {s:"tracking",s2:"survival",d:62},
            win: {
              r: "A week in the March forests. You find the rider watering horses at dusk.",
              fx: {
                coin: 100,
                rep: 6,
                duel: {
                  tier: 4,
                  title: "a rider of the Black Manes",
                  troop: "LC",
                  race: "orc",
                  opts: {kind:"duel",place:"a ford in the March forest",lethal:!0,toYield:!0,title:"The Black Manes"},
                },
              },
            },
            lose: {
              r: "The forest is theirs. You come home with nothing but a story about how lucky you were.",
              fx: {rep:-2,wil:1},
            },
          },
          {
            t: "Parley with Rakka instead",
            check: {s:"diplomacy",s2:"intimidation",d:65},
            win: {
              r: "Rakka hands over the rider herself: he was a fool who brought the towns down on her. The towns pay. Rakka sends you a horse.",
              fx: {coin:200,rep:12,fame:3,newRel:{type:"friend",op:20}},
            },
            lose: {
              r: "Rakka laughs and sends you back down the road with your boots tied round your neck.",
              fx: {rep:-6,happy:-5},
            },
          },
        ],
      }),
      OPP(["bounty"], {
        id: "cm_bounty_cook",
        minRank: 2,
        minRep: 45,
        cool: 12,
        cond: (p,C)=>!C.flag(p,"cm_cook"),
        title: "The cook in the dyers' quarter",
        text: "Men of Jarl Halvard Stagg of Northreach are asking in every inn: they want a cook who fled a great house fifteen years ago and hides now in the dyers' quarter of Ostra. They do not say why. They pay 500 suns to whoever finds him. In the dyers' quarter, people say the cook knows how King Bjorn of Northreach really died.",
        choices: [
          {
            t: "Find him and give him to Stagg's men",
            check: {s:"tracking",s2:"intrigue",d:62},
            win: {
              r: "An old man with purple hands and a hunted face. Stagg's men pay and take him north. Within a year there is talk of war between Northreach and Aldmark.",
              fx: {coin:500,rep:10,fame:3,flag:"cm_cook",honor:-2},
            },
            lose: {
              r: "The cook has friends in the dyers' quarter. You wake up in the river.",
              fx: {health:-15,cause:"the dye-vats of Ostra",wil:1},
            },
          },
          {
            t: "Find him, and sell the news to the other side",
            check: {s:"intrigue",s2:"deception",d:65},
            win: {
              r: "A lady's steward pays you more than Stagg would, to forget the cook's face. You forget it.",
              fx: {coin:800,honor:-8,flag:"cm_cook"},
            },
            lose: {
              r: "Both sides learn what you tried. Neither is forgiving.",
              fx: {rep:-8,newRel:{type:"enemy",op:-60}},
            },
          },
          {
            t: "Find him, and warn him",
            r: "He looks at you a long time, packs a bag and is gone by dawn. Nobody pays you for that.",
            fx: {honor:5,flag:"cm_cook",newRel:{type:"friend",op:40}},
          },
          {
            t: "Stay out of kings' business",
            r: "Kings' business has a way of finding the people who stay out of it. Not this time.",
            fx: {},
          },
        ],
      }),
      OPP(["bounty"], {
        id: "cm_bounty_knight_killer",
        minRank: 2,
        maxRank: 2,
        minRep: 60,
        cool: 6,
        title: "A killer in spurs",
        setup: (p,ctx)=>{who(p,ctx,"a knight turned murderer")},
        text: "A lord's daughter is dead, and the man who did it is a knight: {themFull}, with friends at court and a sword he knows how to use. No sheriff will touch {themHim}. Her father pays 300 suns, and asks you to bring {themHim} alive to stand trial, if you can.",
        choices: [
          {
            t: "Take {themHim} alive",
            check: {s:"tactics",s2:"intimidation",d:60},
            win: {
              r: "You take {themHim} unarmoured, at a bathhouse, with four men and a net. {They} stands trial. Every lord in the realm learns your name.",
              fx: {coin:300,promote:!0,rep:12,fame:4,them:{type:"enemy",op:-80}},
            },
            lose: {
              r: "The net tears. {They} draws.",
              fx: {
                coin: 150,
                rep: 4,
                duel: {
                  foe: "them",
                  opts: {kind:"duel",place:"a bathhouse yard",lethal:!0,toYield:!0,title:"A knight at bay"},
                },
              },
            },
          },
          {
            t: "Challenge {themHim} openly",
            r: "In front of witnesses, with {theirHis} own sword.",
            fx: {
              coin: 150,
              promote: !0,
              rep: 8,
              fame: 3,
              duel: {
                foe: "them",
                opts: {kind:"duel",place:"a tourney field",lethal:!0,toYield:!0,title:"Justice for a dead girl"},
              },
            },
          },
          {
            t: "Refuse: knights are for knights",
            r: "The father finds somebody else. You hear the somebody else did not come back.",
            fx: {rep:-2},
          },
        ],
      }),
      OPP(["bounty"], {
        id: "cm_bounty_ferryman",
        minRank: 3,
        minRep: 60,
        time: 3,
        cool: 10,
        title: "The Ferryman's chain",
        text: "The bandit-lord Marek Ferryman has chained the Tirana at Ostessa and taxes every barge that comes down the river. Timber for Morhaven and Ostra rots in the booms upstream. The free towns of the Marches and the timber merchants offer 1,000 suns to whoever breaks his chain.",
        choices: [
          {
            t: "Raise a company and take the chain by night",
            check: {s:"command",s2:"tactics",d:65},
            win: {
              r: "Forty hired blades, three boats and a moonless night. The chain goes into the river with its anchor-stones. Marek escapes, but the river is open, and every bargeman on the Tirana knows your name.",
              fx: {
                coin: 1e3,
                rep: 15,
                fame: 8,
                epithet: "the Chainbreaker",
                deed: "Broke Marek Ferryman's chain across the Tirana",
              },
            },
            lose: {
              r: "Marek was ready. Half your company die on the chain, and you come home with a spear wound and debts.",
              fx: {coin:-200,health:-25,cause:"a spear at Ostessa",wound:"deep_cut",rep:-6,wil:2},
            },
          },
          {
            t: "Go for Marek's champion alone",
            r: "Kill his best man in front of his crew, and the rest may run.",
            fx: {
              coin: 400,
              rep: 8,
              fame: 4,
              duel: {
                tier: 4,
                title: "Marek Ferryman's champion",
                troop: "HI",
                opts: {kind:"duel",place:"the chain-landing at Ostessa",lethal:!0,toYield:!0,title:"The Ferryman's chain"},
              },
            },
          },
          {
            t: "Negotiate a lower toll for the merchants",
            check: {s:"diplomacy",s2:"trade",d:55},
            win: {
              r: "Marek likes being asked. He halves his toll for a year. The merchants pay you 300, grudgingly.",
              fx: {coin:300,rep:4},
            },
            lose: {r:"Marek likes being asked, and raises the toll.",fx:{rep:-4}},
          },
        ],
      }),
    ]);
    A.defEvents([
      {
        id: "cm_bounty_kin",
        cond: (p,C)=>C.adult(p)&&manhunter(p),
        cool: 7,
        title: "Kin",
        setup: (p,ctx)=>{who(p,ctx,"the brother of a man you hunted","enemy")},
        text: "{them}'s brother hanged because you brought him in. {They} has been drinking all afternoon across the inn, looking at you, and now {theyHe} stands up with {theirHis} hand on a knife.",
        choices: [
          {
            t: "Face {themHim}",
            r: "The common room clears a space.",
            fx: {
              them: {type:"enemy",op:-30},
              duel: {foe:"them",opts:{kind:"brawl",place:"the inn's common room",lethal:!1,toYield:!0,title:"Kin"}},
            },
          },
          {
            t: "Talk {themHim} down",
            check: {s:"persuasion",s2:"wil",d:50},
            win: {
              r: "You tell {themHim} the truth about {theirHis} brother, all of it. {They} sits down and cries.",
              fx: {honor:2,wil:1,them:{type:"acquaint",op:30}},
            },
            lose: {
              r: "Words do not help. {They} comes at you anyway.",
              fx: {duel:{foe:"them",opts:{kind:"brawl",place:"the inn yard",lethal:!1,toYield:!0,title:"Kin"}}},
            },
          },
          {t:"Leave by the back door",r:"You leave. {They} will be there next time.",fx:{happy:-2}},
        ],
      },
      {
        id: "cm_bounty_widow",
        cond: (p,C)=>C.adult(p)&&manhunter(p),
        cool: 7,
        title: "A widow with no money",
        setup: (p,ctx)=>{who(p,ctx,"a widow")},
        text: "The tavern goes quiet when you come in; it always does. Only {them} comes to your table: {theirHis} husband was killed on the road a month ago, the lord will not pay for a hunt, and {theyHe} has no money at all. {They} knows the killer's name.",
        choices: [
          {
            t: "Take the hunt for nothing",
            check: {s:"tracking",s2:"ins",d:50},
            win: {
              r: "Ten days, and you bring the killer to the lord's door, where he cannot be ignored. The widow sends you a cheese every year until she dies.",
              fx: {rep:6,honor:5,fame:1,them:{type:"friend",op:60}},
            },
            lose: {
              r: "The name was wrong, or the man is gone. You tell her so, and she thanks you anyway.",
              fx: {honor:3,wil:1,them:{type:"friend",op:30}},
            },
          },
          {
            t: "Tell her the price, and that you are sorry",
            r: "She nods; she knew. She leaves, and the tavern goes back to its noise.",
            fx: {happy:-3},
          },
          {
            t: "Give her a sun and the name of a cheaper man",
            r: "A cheaper man is a worse man. It is better than nothing.",
            fx: {coin:-1,honor:1},
          },
        ],
      },
      {
        id: "cm_bounty_sanctuary",
        cond: (p,C)=>C.adult(p)&&manhunter(p)&&(C.faith(p,"REL-01")||inR(p,"POL-02","POL-03","POL-04","POL-15","POL-16","POL-31")),
        cool: 8,
        title: "The bell-rope",
        setup: (p,ctx)=>{who(p,ctx,"a fugitive you were hunting")},
        text: "{them} beats you to the temple by twenty paces, runs up the nave and grips the bell-rope at the altar. Sanctuary: forty days, to confess, pay or leave the realm by the nearest road carrying a white wand. The priests close ranks at the door.",
        choices: [
          {
            t: "Wait the forty days on the steps",
            r: "Forty days of cold steps and priests' stares. On the forty-first, {them} walks out carrying a white wand toward the border, and the law lets {themHim} go. So must you.",
            fx: {wil:1.5,piety:2,honor:2},
          },
          {
            t: "Drag {themHim} out by night",
            check: {s:"stealth",s2:"str",d:55},
            win: {r:"Nobody sees. Your fee is paid. Your sleep is not.",fx:{coin:30,honor:-8,piety:-8}},
            lose: {
              r: "A priest sees. The Temple courts are not kind to men who break sanctuary.",
              fx: {prison:1,why:"breaking sanctuary",piety:-6,honor:-6},
            },
          },
          {
            t: "Talk to {themHim} through the priests",
            check: {s:"persuasion",s2:"faith",d:50},
            win: {
              r: "On the tenth day {theyHe} confesses, before the priest, and comes out to face the court of {theirHis} own will.",
              fx: {coin:20,rep:5,piety:3,honor:3},
            },
            lose: {r:"{They} will not speak to you.",fx:{wil:.5}},
          },
        ],
      },
      {
        id: "cm_bounty_lamp",
        cond: (p,C)=>C.adult(p)&&manhunter(p),
        cool: 6,
        title: "A lamp",
        setup: (p,ctx)=>{who(p,ctx,"an informer")},
        text: "{them} is a lamp, as harbor cant calls an informer: {theyHe} sells names. Tonight {theyHe} offers you three, men with prices on their heads, for 10 suns. Lamps are often right. Lamps also sell names to the men whose names they sell.",
        choices: [
          {
            t: "Buy the names",
            req: p=>p.coin>=10,
            check: {s:"ins",s2:"intrigue",d:50},
            win: {
              r: "Two of the three are good. One of them is worth 40 suns.",
              fx: {coin:30,rep:4,them:{type:"acquaint",op:15}},
            },
            lose: {
              r: "All three names are old, and one of them knows you are coming.",
              fx: {coin:-10,health:-6,cause:"an ambush in an alley"},
            },
          },
          {
            t: "Squeeze the names out of {themHim} for free",
            check: {s:"intimidation",s2:"wil",d:50},
            win: {
              r: "{They} gives you the names and a lot of sweat. {They} will also give your name to someone else, sooner or later.",
              fx: {rep:3,them:{type:"enemy",op:-30}},
            },
            lose: {r:"{They} laughs at you and walks out. Lamps have friends.",fx:{rep:-2}},
          },
          {
            t: "Make {themHim} your lamp, paid by the month",
            req: p=>p.coin>=10,
            r: "A sun a week for every whisper in the port. It is the best money you spend all year.",
            fx: {coin:-10,skill:{intrigue:3},rep:3,them:{type:"friend",op:25}},
          },
        ],
      },
    ]);
    const MYTRADES=["merchant","sailor","fish","pirate","farm","herd","hunter","horsemaster","explorer","bounty"];
    A.defEvents([
      {
        id: "cm_life_market",
        cond: (p,C)=>C.adult(p)&&free(p)&&(farmer(p)||herder(p)||fisher(p)||woodsman(p)),
        cool: 4,
        title: "Market day",
        setup: (p,ctx)=>{ctx.goods=J(p,"fish")||!p.job&&A.C.coast(p)?"salt fish":J(p,"hunter")?"pelts and smoked venison":J(p,"herd")?"cheeses and a fleece or two":"eggs, onions and a sack of barley",who(p,ctx,"a townsman at the market")},
        text: "Market day in {town}. You have a cart of {goods}, a stall between a knife-grinder and a woman selling ribbons, and a toll-penny already paid at the gate. {them}, a sharp townsman, offers to buy the whole cart at once for a price that is a little too round.",
        choices: [
          {
            t: "Sell him the cart and go home early",
            r: "An easy day, and a little too cheap. You are home by noon.",
            fx: {coin:5},
          },
          {
            t: "Sell piece by piece, all day",
            check: {s:"trade",s2:"persuasion",d:40},
            win: {
              r: "A long day of haggling. You sell every last onion and come home with 9 suns and a sore throat.",
              fx: {coin:9,skill:{trade:2}},
            },
            lose: {
              r: "Rain at noon empties the market. You sell half, and the cart comes home heavy.",
              fx: {coin:3,happy:-2},
            },
          },
          {
            t: "Weigh his coins before you take them",
            check: {s:"trade",s2:"ins",d:45},
            win: {
              r: "Clipped, every one. You hand them back with a smile and the ribbon woman laughs out loud. {They} buys at a fair price after that, in good coin.",
              fx: {coin:7,int:.3,them:{type:"acquaint",op:10}},
            },
            lose: {r:"You weigh them and find nothing. {They} takes offence and goes.",fx:{coin:2}},
          },
          {
            t: "Spend the day at the fair instead",
            r: "The ribbon woman minds your stall. You come back with less money and a better mood.",
            fx: {coin:2,happy:5,newRel:{type:"friend",op:15}},
          },
        ],
      },
      {
        id: "cm_life_road",
        cond: (p,C)=>C.adult(p)&&free(p)&&(trader(p)||herder(p)||horseman(p)||pathfinder(p)||manhunter(p)),
        cool: 5,
        title: "Out of sight of the tower",
        setup: (p,ctx)=>{ctx.who=inR(p,"POL-31","POL-18")?"unpaid soldiers who have stopped waiting for their pay":inR(p,"POL-03")?"Crown-foothill bandits":inR(p,"POL-11","POL-12","POL-34")?"riders from another clan":"men with their faces in scarves"},
        text: "Out of sight of any tower, a traveller is his own watch. Four {who} step out of the trees onto the road and ask, politely for now, what you are carrying.",
        choices: [
          {
            t: "Fight",
            r: "You draw first.",
            fx: {
              duel: {
                tier: 2,
                title: "a road bandit",
                troop: "LI",
                opts: {kind:"duel",place:"a lonely road",lethal:!0,toYield:!0,title:"Bandits"},
              },
            },
          },
          {
            t: "Pay them off",
            r: "A purse for the road. They tip their hats and melt back into the trees.",
            fx: {coinPct:-.2,wil:.5},
          },
          {
            t: "Bluff: tell them twenty riders are a mile behind you",
            check: {s:"deception",s2:"wil",d:50},
            win: {
              r: "They look down the road, then at each other, and decide not to wait to find out.",
              fx: {skill:{deception:2}},
            },
            lose: {r:'One of them laughs. "Then we had better hurry."',fx:{coinPct:-.3,health:-6,cause:"a cudgel"}},
          },
          {
            t: "Ride through them",
            req: (p,C)=>C.mounted(p)||C.prof(p,"riding",45),
            check: {s:"riding",s2:"spd",d:50},
            win: {
              r: "You put your heels in and go straight at them. They scatter like hens.",
              fx: {skill:{riding:2},fame:1},
            },
            lose: {
              r: "One grabs your bridle. You come off in the mud.",
              fx: {coinPct:-.25,health:-8,cause:"a fall from the saddle"},
            },
          },
        ],
      },
      {
        id: "cm_life_handover",
        cond: (p,C)=>C.old(p)&&C.hasKids(p)&&J(p,...MYTRADES)&&rk(p)>=1,
        once: !0,
        w: 1.5,
        title: "Handing it on",
        text: p=>`Your knees and your eyes have both started to argue with you. Your ${{merchant:"trading house",sailor:"ship",fish:"boat",pirate:"ship",farm:"land",herd:"herd",hunter:"craft",horsemaster:"stable",explorer:"craft",bounty:"trade"}[p.job.c]||"trade"} has kept you all your life, and your eldest has been doing more of the work each year, and doing it well, and pretending not to notice that you notice.`,
        choices: [
          {
            t: "Hand it all over, and sit by the fire",
            r: "You give your eldest your tools, your contacts and your secrets, and then you give advice nobody asked for. It is a good old age.",
            fx: p=>(p.job=null,p.happy=A.clamp(p.happy+10,0,100),A.applyFx(p,{rel:{who:"child",op:15}},{}),"(You leave your trade.)"),
          },
          {
            t: "Sell out to a younger rival",
            r: "A fat purse for a lifetime's name. Your eldest does not speak to you for a month.",
            fx: p=>{const v=60+rk(p)*120;return p.coin+=v,p.job=null,A.applyFx(p,{rel:{who:"child",op:-10}},{}),`(You sell up for ${v} suns.)`},
          },
          {
            t: "Keep working until you drop",
            r: "Your eldest sighs and goes on doing the work, and letting you think you are doing it.",
            fx: {wil:1,happy:-2,rel:{who:"child",op:-5}},
          },
        ],
      },
    ]);
  })();
})();
