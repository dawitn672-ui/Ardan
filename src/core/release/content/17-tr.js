// The release's event pack 17 of 30 (170 events, mostly tr_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-027). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const J = (p,...ks)=>!!(p.job&&ks.includes(p.job.c)),
      rk = p=>p.job?p.job.r:0,
      free = p=>!p.flags.unfree,
      nm = (p,sex)=>{try{return A.givenName(p.cult,sex||(A.chance(.5)?"M":"F"))||"Tam"}catch{return"Tam"}},
      rs = p=>A.realmShort(p.realm),
      capOf = p=>{const r=A.realm(p.realm);return r&&r.capital?r.capital:"the capital"},
      homeOf = p=>A.provName(p.home),
      war = p=>{try{return A.atWar(p.realm).length>0}catch{return!1}},
      foe = p=>{try{const e=A.enemyRealmOf(p.realm);return e?A.realmShort(e):"the enemy"}catch{return"the enemy"}},
      fest = ()=>A.pick(["May Fair","Harvest Home","Sea Opening","Sea Closing","First Loaf","the Slaughter Feast","the Spring Equinox","the Midwinter Vigil"]),
      mk = (p,ctx,occ,opt)=>{const o=opt||{},t=A.makeAcquaintance(p,"acquaint",!!o.child);if(o.sex&&t.sex!==o.sex){t.sex=o.sex;try{t.given=A.givenName(t.cult,o.sex)||t.given}catch{}}return occ&&(t.occ=occ),ctx.pid=t.id,ctx.They=A.cap(A.he(t)),ctx.Their=A.cap(A.his(t)),ctx.self=A.him(t)+"self",t},
      GRP = {
        "POL-01": "north",
        "POL-05": "north",
        "POL-08": "north",
        "POL-13": "north",
        "POL-14": "north",
        "POL-02": "sun",
        "POL-03": "sun",
        "POL-04": "sun",
        "POL-15": "sun",
        "POL-16": "sun",
        "POL-31": "sun",
        "POL-25": "east",
        "POL-26": "east",
        "POL-11": "steppe",
        "POL-12": "steppe",
        "POL-34": "steppe",
        "POL-17": "well",
        "POL-19": "well",
        "POL-24": "well",
        "POL-18": "flood",
        "POL-20": "south",
        "POL-21": "south",
        "POL-22": "south",
        "POL-30": "monsoon",
        "POL-32": "monsoon",
        "POL-27": "roof",
        "POL-10": "hold",
        "POL-28": "hold",
        "POL-29": "hold",
        "POL-06": "forest",
        "POL-07": "forest",
        "POL-09": "giant",
        "POL-23": "giant",
        "POL-33": "pirate",
      },
      grp = p=>GRP[p.realm]||"north",
      PATRON = {
        "POL-01": ["Jarl","Lord","Lady"],
        "POL-02": ["Luminary","Lord"],
        "POL-03": ["Baron","Lord","Dame"],
        "POL-04": ["Ser","Councillor"],
        "POL-05": ["Lord","Lady"],
        "POL-06": ["Warden","Elder"],
        "POL-07": ["Fleet-Warden","Captain"],
        "POL-08": ["Jarl","Thane"],
        "POL-09": ["Eldest"],
        "POL-10": ["Thane","Master-Smith"],
        "POL-11": ["Clan-Chief","Clan-Mother"],
        "POL-12": ["Chief","Khatun"],
        "POL-13": ["Speaker","Elder"],
        "POL-14": ["Lord","Lady"],
        "POL-15": ["Lord","Dame"],
        "POL-16": ["Lord","Banker"],
        "POL-17": ["Emir","Vizier"],
        "POL-18": ["Nome lord","Vizier"],
        "POL-19": ["Chief","Well-Mother"],
        "POL-20": ["Governor","Lord"],
        "POL-21": ["Merchant prince","Captain"],
        "POL-22": ["Lord","Lady"],
        "POL-23": ["Eldest"],
        "POL-24": ["Lord","Oil-Master"],
        "POL-25": ["Lord","Lady"],
        "POL-26": ["Lake lord","Lady"],
        "POL-27": ["Herd-lord","Abbess"],
        "POL-28": ["Thane"],
        "POL-29": ["Forge-Master","Road-Warden"],
        "POL-30": ["Lord","Chief Minister"],
        "POL-31": ["Lord","Dame"],
        "POL-32": ["Harbor lord","Vizier"],
        "POL-33": ["Captain","Quartermaster"],
        "POL-34": ["War-Captain","Clan-Mother"],
      },
      FEMT = /Lady|Dame|Mother|Khatun|Abbess/,
      patron = p=>{const t=A.pick(PATRON[p.realm]||["Lord","Lady"]);return t+" "+nm(p,FEMT.test(t)?"F":A.chance(.75)?"M":"F")},
      patronM = p=>{const l=(PATRON[p.realm]||["Lord"]).filter(x=>!FEMT.test(x));return A.pick(l.length?l:["Lord"])+" "+nm(p,"M")},
      mkLord = (p,ctx)=>{const l=PATRON[p.realm]||["Lord","Lady"],title=A.pick(l),t=mk(p,ctx,"a great patron",{sex:FEMT.test(title)?"F":A.chance(.75)?"M":"F"});return ctx.lord=title+" "+t.given,t},
      TEMPLE = {
        "REL-01": "temple",
        "REL-02": "church",
        "REL-03": "hall",
        "REL-04": "grove-house",
        "REL-05": "Carving Hall",
        "REL-06": "monastery",
        "REL-07": "house of prayer",
        "REL-08": "flood temple",
        "REL-09": "ancestor house",
        "REL-10": "temple",
        "REL-11": "shrine",
        "REL-12": "hall",
        "REL-14": "shrine",
      },
      temple = p=>TEMPLE[p.faith]||"temple",
      ELDERS = {
        "REL-01": "the dawnkeepers",
        "REL-02": "the priests of the Dawn Church",
        "REL-03": "the hall-priests",
        "REL-04": "the Grove Keepers",
        "REL-05": "the Law-Carvers",
        "REL-06": "the abbot and his monks",
        "REL-07": "the Well-Keepers",
        "REL-08": "the flood-priests",
        "REL-09": "the Rememberers",
        "REL-10": "the temple families",
        "REL-11": "the shamans",
        "REL-12": "the eldest of the hall",
        "REL-14": "the shamans",
      },
      elders = p=>ELDERS[p.faith]||"the priests",
      DRINK = {
        north: "ale",
        sun: "ale and watered wine",
        east: "mead and rye beer",
        steppe: "fermented mare's milk",
        well: "date beer",
        flood: "barley beer",
        south: "honey wine",
        monsoon: "palm toddy",
        roof: "barley beer",
        hold: "dark beer",
        forest: "honey drink",
        giant: "ale",
        pirate: "ale",
      },
      drink = p=>DRINK[grp(p)]||"ale",
      FOOD = {
        north: "pork and beef",
        sun: "kid roasted with garlic and rosemary",
        east: "smoked sturgeon and honey cakes",
        steppe: "mutton and mare's milk",
        well: "goat and dates",
        flood: "duck and fresh fish",
        south: "beef in pepper",
        monsoon: "rice and sugar sweets",
        roof: "yak and butter",
        hold: "goat and cave mushrooms",
        forest: "venison and honey",
        giant: "seal and whale fat",
        pirate: "salt fish and goat",
      },
      food = p=>FOOD[grp(p)]||"pork and beef",
      W = {
        smith: {
          shop: "forge",
          craft: "smith",
          guild: "the smiths' guild",
          work: "blades and locks",
          secret: "how you harden an edge in brine and then in oil",
          feat: "forged a knife with a wavy grain that bends and springs back true",
        },
        mason: {
          shop: "yard",
          craft: "mason",
          guild: "the masons' lodge",
          work: "carved stone",
          secret: "the lime mortar you make that sets even under water",
          feat: "carved a capital of oak leaves so deep you can put a finger behind the stems",
        },
        weaver: {
          shop: "workshop",
          craft: "weaver",
          guild: "the weavers' guild",
          work: "cloth",
          secret: "your fast madder red that does not run in the wash",
          feat: "wove a band of patterned cloth with birds in it, each with a different eye",
        },
        bowyer: {
          shop: "workshop",
          craft: "bowyer",
          guild: "the bowyers' guild",
          work: "bows",
          secret: "the sinew glue you boil that holds in the wet",
          feat: "tillered a yew stave so evenly that it bends like a drawn line of ink",
        },
        carpenter: {
          shop: "yard",
          craft: "carpenter",
          guild: "the shipwrights' guild",
          work: "joinery",
          secret: "how you steam oak planks so they bend without cracking",
          feat: "cut a dovetailed chest where you cannot find the joints with your fingernail",
        },
        brewer: {
          shop: "brewhouse",
          craft: "brewer",
          guild: "the brewers' guild",
          work: "ale",
          secret: "the mix of herbs and the slow mash that make your ale famous",
          feat: "brewed a dark ale that the old drinkers in the corner fell silent over",
        },
        artist: {
          shop: "studio",
          craft: "painter",
          guild: "the painters' guild",
          work: "panels",
          secret: "the egg-and-oil glaze that keeps your colors bright for years",
          feat: "painted a beggar's face on a scrap of board that makes customers stop talking",
        },
        cook: {
          shop: "kitchen",
          craft: "cook",
          guild: "the cooks of the great houses",
          work: "dishes",
          secret: "your black pepper sauce that the lord asks for by name",
          feat: "made a pie of six birds, one inside the other, that came out whole",
        },
        engineer: {
          shop: "works",
          craft: "engineer",
          guild: "the engine yard",
          work: "engines",
          secret: "your drawings for a throwing arm that does not split",
          feat: "drew a lifting frame that two men can work where you used six",
        },
      },
      w = (p,k)=>{const o=W[p.job&&p.job.c]||W.smith;return o[k]!=null?o[k]:W.smith[k]},
      CRAFT = ["smith","mason","weaver","bowyer","carpenter","artist","engineer"],
      TRADES = ["smith","mason","weaver","bowyer","carpenter","artist","engineer","cook","brewer"],
      GUILDS = ["smith","mason","weaver","bowyer","carpenter","brewer"],
      pay = (n,o)=>(p,ctx)=>{const v=typeof n=="function"?n(p,ctx||{}):n;return p.coin=Math.max(0,p.coin+Math.round(v||0)),o&&A.applyFx(p,o,ctx||{})||""},
      up = p=>{if(!p.job||p.flags.unfree)return"";const C=GD.CAREERS[p.job.c],nx=C&&C.ranks[p.job.r+1];return nx?(p.job.r++,p.job.y=Math.max(p.job.y||0,nx[1]),p.happy=A.clamp(p.happy+6,0,100),`(You are now ${nx[0]}.)`):""},
      fee = (c,d)=>c&&c.fee||d||50,
      andUp = (o,ranks,note)=>(p,ctx)=>{const s=A.applyFx(p,o,ctx||{})||"",u=ranks.includes(rk(p))?up(p):"";return[s,u?(note?note+" ":"")+u:""].filter(Boolean).join(" ")},
      O = list=>list.map(e=>{const c0=e.cond;return Object.assign({},e,{trigger:!0,cond:(p,C)=>!!p.job&&e.opp.includes(p.job.c)&&(!c0||!!c0(p,C))})}),
      ROAD = {
        smith: [
          "Kingsmere, where the bell-founders of Bell Ward cast for half the north",
          "Tessar, where the war trades never sleep",
          "the human forges in the carters' camp outside the Deep Gate of Irondeep",
        ],
        mason: [
          "Solenne, where the great Temple has the first pointed arches in the west",
          "the marble quarries of Venina in Varenna",
          "Kingsmere, where they are always adding to the Oath Hall",
        ],
        weaver: [
          "the Palella towns of Varenna, where the spinners work on wheels",
          "Linen Street in Tamar",
          "the Dyers' Quarter of Ostra, where the murex vats stink of money",
        ],
        bowyer: [
          "Ashmere, where every boy draws a bow from seven",
          "Roseham in the Highland League, where the crossbow-makers work",
          "Silverbough, where the elves sell Keeper-marked yew on the Strangers' Shelf",
        ],
        carpenter: [
          "the Arsenal of Lucerna, which can build a war galley in twenty days",
          "the Royal Yards of Varenna",
          "the shipwrights of Brookhurst in Greyhaven",
        ],
        artist: [
          "Solenne, where gold-leaf panels hang in every chapel",
          "Lamp Street in Velgrad, where the icon-painters work",
          "Ostra, where every banker wants his portrait",
        ],
        cook: [
          "Lucerna, where the great houses keep trained food-tasters",
          "Ostra, where the bankers feast on lamb and almond cakes",
          "the Pilgrims' Quarter of Solenne, whose cook-shops feed thousands a day",
        ],
        engineer: [
          "the Engine Yard of Tessar, where the first counterweight engine was built",
          "the engine yard of Kingsmere",
          "the walled Arsenal of Lucerna",
        ],
      };
    A.defEvents(O([{id:"tr_road",opp:["smith","mason","weaver","bowyer","carpenter","artist","cook","engineer"],minRank:1,maxRank:1,time:2,cool:8,w:1.2,title:"The journeyman's road",cond:(p,C)=>!C.flag(p,"tr_wandered")&&free(p),setup:(p,ctx)=>{ctx.city=A.pick(ROAD[p.job.c]||ROAD.smith),ctx.craft=w(p,"craft")},text:"Journeymen are meant to travel. The old saying goes that a {craft} who has seen only one town has learned only one trade, and the best work on Ardan is done in {city}. It is weeks on the road, and you would arrive with nothing but your tools and your hands.",choices:[{t:"Go, and work for the hardest master who will have you",check:{s:"craft",s2:"wil",d:48},win:{r:'Two years under a master who never once said "good". You come home with new tricks and a name that people in the trade have heard.',fx:{skill:{craft:6},rep:6,int:.5,flag:"tr_wandered",happy:3}},lose:{r:"The masters there have journeymen enough. You sweep floors, sleep in a loft with nine others and come home thinner and a little wiser.",fx:{skill:{craft:2},wil:1,coin:-5,flag:"tr_wandered"}}},{t:"Go, and keep your eyes open wider than your mouth",check:{s:"int",s2:"stealth",d:52},win:{r:"You watch the way they work when they think nobody is watching. You bring home three of their secrets and none of their debts.",fx:{skill:{craft:5,intrigue:2},rep:4,flag:"tr_wandered"}},lose:{r:"A master catches you copying his patterns by lamplight. His sons walk you to the town gate, and not gently.",fx:{health:-8,cause:"a beating",wil:1,flag:"tr_wandered"}}},{t:"Stay home, save, and build a life here",r:"You stay. The money is steady and the faces are friendly. Sometimes you wonder.",fx:{coin:15,happy:2}}]},{id:"tr_better_apprentice",opp:["smith","mason","weaver","bowyer","carpenter","artist","cook","engineer","brewer"],minRank:2,cool:8,title:"Better than the master",setup:(p,ctx)=>{mk(p,ctx,"your apprentice"),ctx.feat=w(p,"feat")},text:'{them} has been in your house four years. This winter {theyHe} {feat}. It is better than anything you made at that age. It may be better than anything you make now. A good customer has noticed and asked, politely, for "the young one".',choices:[{t:"Put {theirHis} name on it and say so loudly",r:"{them} goes red to the ears. The customer comes back and brings friends. A master who can make masters is worth knowing.",fx:{rep:4,honor:3,happy:2,them:{type:"student",op:30}}},{t:"Your house, your name",r:"The customer pays you, and praises you. {them} says nothing, and looks at you differently from that day.",fx:{rep:5,coin:15,honor:-3,them:{type:"rival",op:-25}}},{t:"Free {themHim} from the indenture to set up alone",r:"You tear up the last years of the indenture in front of witnesses. {them} opens a shop across town and sends you every job too big for one pair of hands.",fx:{rep:4,honor:4,coin:-10,them:{type:"friend",op:45}}},{t:"Teach {themHim} the one thing you never taught anyone",check:{s:"craft",s2:"wil",d:45},win:{r:"You show {themHim} the trick your own master took years to give you. Teaching it, you find two ways to do it better.",fx:{skill:{craft:3},rep:4,them:{type:"student",op:40}}},lose:{r:"Teaching it shows you how much you had forgotten. You both learn something, and you learn it twice.",fx:{skill:{craft:2},wil:1,them:{type:"student",op:15}}}}]},{id:"tr_steward_tenth",opp:TRADES,minRank:1,cool:5,title:"The steward's tenth",setup:(p,ctx)=>{ctx.lord=patron(p),ctx.fee=A.ri(40,90)+rk(p)*40,ctx.cut=Math.round(ctx.fee/10),ctx.work=w(p,"work")},text:"The house of {lord} buys {work} by the cartload, and its steward has sent word: the year's order is yours, worth {fee} suns — if one sun in ten finds its way back to him. Everybody pays him. That is how he can afford two horses on a steward's wage.",choices:[{t:"Pay his tenth like everyone else",r:"The order comes, the steward smiles, and you feel a little dirtier counting the coin.",fx:pay((p,c)=>fee(c)-(c.cut||5),{rep:3,honor:-2})},{t:"Go over his head to {lord}",check:{s:"etiquette",s2:"persuasion",d:55},win:{r:"{lord} listens, frowns and has the steward's accounts read aloud. The order is yours at full price, and the next steward is careful around you.",fx:pay((p,c)=>fee(c),{rep:6,honor:2,newRel:{type:"enemy",op:-35}})},lose:{r:"{lord} does not see tradesmen. The steward hears you tried. The house buys elsewhere for years.",fx:{rep:-3,happy:-3,newRel:{type:"enemy",op:-30}}}},{t:"Pay, and keep a tally of every bribe for later",check:{s:"intrigue",s2:"int",d:50},win:{r:"Three years of notched sticks later, you lay them before the house. The steward is turned out, and you are paid back every sun he took.",fx:pay((p,c)=>fee(c),{rep:5,skill:{intrigue:3}})},lose:{r:"The steward finds your tally sticks in the ash pit and laughs. The order goes to someone who does not count.",fx:{rep:-4,honor:-1}}},{t:"Refuse. Your work does not need a bribe",r:"The order goes to a worse craftsman who pays. The honest men of the trade nod to you in the street.",fx:{honor:3,rep:1}}]},{id:"tr_secret_stolen",opp:TRADES,minRank:1,cool:7,title:"A secret walks out the door",setup:(p,ctx)=>{mk(p,ctx,"your journeyman"),ctx.secret=w(p,"secret"),ctx.work=w(p,"work")},text:"Your journeyman {them} has been drinking with your rival's people every night this month. Last week your rival's {work} suddenly got better. Only three people alive know {secret}, and one of them is {them}.",choices:[{t:"Throw {themHim} out of your house",r:"You put {theirHis} tools in the street. Your rival hires {themHim} the next morning.",fx:{rep:1,them:{type:"enemy",op:-40}}},{t:"Let {themHim} carry home a false secret",check:{s:"intrigue",s2:"int",d:50},win:{r:`You let {themHim} overhear the "real" method. Your rival ruins a whole season's work trying it. The trade laughs for a year.`,fx:{rep:7,skill:{intrigue:3},them:{type:"enemy",op:-30}}},lose:{r:"{They} sees through it and tells the whole quarter you are a liar who hides bad work behind tricks.",fx:{rep:-4,them:{type:"enemy",op:-30}}}},{t:"Take it before the guild wardens",check:{s:"persuasion",s2:"learning",d:52},win:{r:"The wardens fine your rival and bar {them} from the trade for a year. The method is written in the guild book under your name.",fx:{coin:20,rep:6,them:{type:"enemy",op:-40}}},lose:{r:'"Prove it," say the wardens. You cannot. Your rival buys them all a drink.',fx:{rep:-2,happy:-3,them:{type:"enemy",op:-20}}}},{t:"Talk to {themHim}, honestly, over a jug",check:{s:"diplomacy",s2:"wil",d:45},win:{r:"It comes out: a debt to a moneylender, a sick child, and your rival's purse. You pay the debt. {them} never betrays you again.",fx:{coin:-15,honor:3,them:{type:"friend",op:40}}},lose:{r:"{They} swears {theyHe} said nothing, and is gone by dawn with two of your best tools.",fx:{coin:-6,them:{type:"enemy",op:-25}}}}]},{id:"tr_widow_shop",opp:["smith","mason","weaver","bowyer","carpenter","artist","cook","brewer"],minRank:1,maxRank:2,cool:10,title:"The master's widow",cond:(p,C)=>free(p)&&!C.ownShop(p),setup:(p,ctx)=>{const t=mk(p,ctx,"a master's widow",{sex:p.sex==="M"?"F":"M"});ctx.dead=nm(p,t.sex==="F"?"M":"F"),ctx.shop=w(p,"shop"),ctx.wid=t.sex==="F"?"widow":"widower"},text:"Master {dead} has been in the ground three weeks. By guild custom the {wid}, {them}, may keep the {shop}, but {theyHe} needs skilled hands at the bench, and has made you an offer over the funeral ale: run the {shop} for half the profit. Or marry, and have all of it.",choices:[{t:"Run the {shop} for half",r:"You work your own hours for the first time in your life. The customers stay. So does the {wid}'s good opinion.",fx:{coin:30,rep:5,perf:5,them:{type:"friend",op:30}}},{t:"Marry {themHim}",req:(p,C)=>!C.married(p),r:"A small wedding, a large shop. The guild drinks to you both.",fx:(p,ctx)=>{const t=ctx&&ctx.pid?A.P(ctx.pid):null;let s="";return t&&t.alive&&(A.marry(p,t),s=`(You marry ${t.given}.)`),p.job&&(p.job.own=A.S.year,p.job.staff=p.job.staff||0),A.addRep(p,6),s+" (The "+(ctx.shop||"shop")+" is yours to run.)"}},{t:"Buy the tools and stock (60 suns)",req:p=>p.coin>=60,r:"The {wid} sells gladly and moves to a sister's house. Your work shows the better tools within a month.",fx:{coin:-60,perf:10,rep:2}},{t:"Refuse kindly",r:"You help carry the tools to a buyer and wish {themHim} well.",fx:{honor:1}}]},{id:"tr_pageant",opp:TRADES,cool:5,w:.8,title:"The guild pageant",setup:(p,ctx)=>{ctx.fest=fest(),ctx.guild=w(p,"guild"),ctx.role=rk(p)===0?"handed the wagon to its apprentices, and they have put you in charge":"put you in charge",ctx.At=A.cap("at "+ctx.fest)},text:"{At} every guild in {home} drags its wagon through the streets and plays a scene on it: the shipwrights do the Flood, the bakers the Loaves. This year {guild} has {role}. The rival guild has spent a fortune on a painted dragon.",choices:[{t:"Spend big: costumes, music, a painted sky (20 suns)",req:p=>p.coin>=20,r:"The crowd roars at your wagon and throws flowers. The dragon loses its head on a corner.",fx:{coin:-20,rep:5,fame:1,happy:3}},{t:"Play the lead yourself",check:{s:"music",s2:"persuasion",d:45},win:{r:"You sing, you weep, you die beautifully. Strangers buy you drinks for a week.",fx:{rep:5,fame:2,skill:{music:2},happy:4}},lose:{r:"You forget your lines in front of the whole town. A child repeats them for you.",fx:{rep:-2,happy:-4,wil:.5}}},{t:"Loosen a wheel on the rival guild's wagon",check:{s:"stealth",s2:"craft",d:50},win:{r:"The dragon's wagon sheds a wheel in the market square. Your wagon rolls past it in glory.",fx:{rep:4,honor:-3}},lose:{r:"A rival's apprentice sees you under the wagon. The town talks of nothing else for a month.",fx:{rep:-6,honor:-5,newRel:{type:"rival",op:-30}}}}]},{id:"tr_guild_fee",opp:GUILDS,minRank:3,cool:8,title:"The price of a mastership",setup:(p,ctx)=>{mk(p,ctx,"a journeyman with no money"),ctx.guild=w(p,"guild")},text:"The rich masters of {guild} want to raise the fee to become a master from 30 suns to 80, and the feast with it. Their own sons will pay it easily. Poor journeymen like {them}, who walked here barefoot, never will. The vote turns on what you say.",choices:[{t:"Raise it. Fewer masters, better prices",r:"The fee goes up. The masters toast you. In the journeymen's alehouse they toast something else.",fx:{coin:40,rep:5,honor:-3,them:{type:"enemy",op:-30}}},{t:"Keep it as it is",r:"The rich masters grumble. The journeymen remember who stood up for them.",fx:{rep:-2,honor:4,them:{type:"friend",op:30}}},{t:"Raise it, but let the guild lend the fee to poor journeymen",check:{s:"diplomacy",s2:"stewardship",d:52},win:{r:"A loan chest, repaid from a new master's first two years. Both halls drink to you, which never happens.",fx:{rep:8,honor:3,fame:1,them:{type:"friend",op:25}}},lose:{r:"The masters call it charity, the journeymen call it a trap. Nobody drinks to you.",fx:{rep:-3}}}]},{id:"tr_town_council",opp:GUILDS,minRank:3,minRep:50,cool:10,title:"A seat on the council",cond:(p,C)=>!C.flag(p,"tr_council"),setup:(p,ctx)=>{ctx.Guild=A.cap(w(p,"guild")),mk(p,ctx,"a master of the wool merchants")},text:"The guilds of {home} elect two masters to sit with the merchants on the town council, where the tolls, the watch and the price of bread are decided. {Guild} wants you to stand. Your opponent is {them}, whose purse is deeper and whose friends are older.",choices:[{t:"Stand, and argue for the craftsmen",check:{s:"persuasion",s2:"intrigue",d:55},win:{r:"You win by eleven voices. The council chamber smells of old wax and older grudges. Now it smells of you.",fx:{flag:"tr_council",rep:8,fame:3,honor:2,them:{type:"rival",op:-25}}},lose:{r:"{them} wins by buying the dyers a feast. You lose by six voices and gain a rival.",fx:{rep:-2,happy:-4,them:{type:"rival",op:-25}}}},{t:"Buy the votes, as {them} does (60 suns)",req:p=>p.coin>=60,check:{s:"intrigue",s2:"trade",d:45},win:{r:"Sixty suns of ale and favors. You take your seat with clean hands and an empty purse.",fx:{coin:-60,flag:"tr_council",rep:5,fame:2,honor:-3}},lose:{r:"{them} simply pays more. You are poorer, and everyone knows why.",fx:{coin:-60,rep:-4,honor:-3}}},{t:"Back {them}, for a price",r:"{them} wins and remembers who stepped aside. Your guild's tolls fall a little. Your own fall more.",fx:{coin:20,rep:-1,them:{type:"friend",op:30}}}]}]));
    A.defEvents(O([{id:"tr_master_sick",opp:TRADES,maxRank:1,cool:6,title:"The master is sick",cond:(p,C)=>!C.ownShop(p),setup:(p,ctx)=>{mk(p,ctx,"your master"),ctx.shop=w(p,"shop")},text:"Your master, {them}, has the fever and has taken to bed for a month. The orders keep coming. The {shop} needs someone at the bench, and the only one left who knows the work is you.",choices:[{t:"Run the {shop} yourself",check:{s:"craft",s2:"stewardship",d:44},win:{r:"A month of orders done right and every penny written down. When {them} gets up, {theyHe} finds a full purse and a customer asking for you by name.",fx:andUp({rep:8,perf:10,coin:4,skill:{craft:3,stewardship:2},them:{type:"mentor",op:25}},[0],"Your master releases you from the last years of your indenture.")},lose:{r:"Two orders late, one ruined, and the accounts in a tangle. {them} gets up early to save the business from you.",fx:{rep:-3,perf:-4,wil:1}}},{t:"Shut the {shop} and nurse {themHim}",r:"Broth, cold cloths and long nights in a chair. {They} lives, and does not forget who sat with {themHim}.",fx:{honor:3,rep:-1,skill:{medicine:2},them:{type:"mentor",op:40}}},{t:"Take the orders, and keep some of the coin back",check:{s:"deception",s2:"int",d:42},win:{r:"Ten suns that never reach the strongbox. {them} is too sick to count.",fx:{coin:10,honor:-3}},lose:{r:"{them} is never too sick to count.",fx:{perf:-10,honor:-3,them:{type:"mentor",op:-30}}}}]},{id:"tr_apprentice_night",opp:TRADES,maxRank:0,cool:3,title:"Apprentices' night",setup:(p,ctx)=>{ctx.fest=fest()},text:"On the eve of {fest} the apprentices of every trade in {home} own the streets until the curfew bell. This year the word is that the apprentices of {town} are coming over the bridge to settle an old score, with cudgels.",choices:[{t:"Hold the bridge with the lads of your trade",r:"Cudgels, torches and a great deal of shouting.",fx:{fame:1,wil:.5,duel:{tier:1,title:"an apprentice from across the bridge",troop:"SP",opts:{kind:"brawl",place:"the bridge",lethal:!1,toYield:!0,title:"Apprentices' night"}}}},{t:"Talk both sides into a drinking match instead",check:{s:"persuasion",s2:"wil",d:40},win:{r:"Forty apprentices, two barrels and a bench across the middle of the bridge. By midnight they are singing each other's songs.",fx:{happy:5,fame:1,newRel:{type:"friend",op:30}}},lose:{r:"The drinking match turns into a fight halfway through the first barrel, which is worse.",fx:{health:-6,cause:"a thrown jug",happy:-1}}},{t:"Stay in and work while the master is out",r:"A quiet shop and a whole evening at the bench. You hear the shouting from the bridge and get better at your trade.",fx:{perf:4,skill:{craft:2}}}]},{id:"tr_master_child",opp:TRADES,maxRank:1,cool:10,title:"The master's child",cond:(p,C)=>!C.married(p)&&free(p),setup:(p,ctx)=>{const l=A.makeLoveInterest(p);ctx.child=l.sex==="F"?"daughter":"son",l.occ="your master's "+ctx.child,ctx.pid=l.id,ctx.They=A.cap(A.he(l)),ctx.shop=w(p,"shop")},text:"Your master's {child}, {them}, has started bringing your supper up to the loft and staying to talk. Everybody in the house can see where this is going, including your master, who has no other heir to leave the {shop} to.",choices:[{t:"Court {themHim}, and ask the master's leave",check:{s:"etiquette",s2:"persuasion",d:40},win:{r:"Your master gives his blessing over supper: wed when your years are served, and the {shop} will come to you both.",fx:{happy:6,rep:3,them:{type:"lover",op:45}}},lose:{r:"Your master finds out before you ask. A week of cold suppers, then a grudging nod.",fx:{happy:3,perf:-4,them:{type:"lover",op:35}}}},{t:"Marry now, indenture or no",r:"Apprentices are not supposed to marry. Your master shouts for a day, then pours the wine.",fx:(p,ctx)=>{const t=ctx&&ctx.pid?A.P(ctx.pid):null;return t&&t.alive?(A.marry(p,t),p.job&&(p.job.perf=A.clamp(p.job.perf-5,0,100)),`(You marry ${t.given}.)`):""}},{t:"Keep it friendly",r:"{They} understands, a little sadly. You stay friends for life.",fx:{them:{type:"friend",op:25}}}]}]));
    A.defEvents(O([{id:"tr_smith_mules",opp:["smith"],maxRank:1,cool:3,title:"Twenty mules before dawn",setup:(p,ctx)=>{mk(p,ctx,"a mule-train master")},text:"A mule train comes in from {town} at dusk: twenty beasts, half of them shoeless after the stony road, and the train must leave at first light. Your master is drunk upstairs. The muleteer, {them}, slaps six suns on the anvil.",choices:[{t:"Shoe them all yourself, by forge-light in the yard",check:{s:"craft",s2:"sta",d:36},win:{r:"Eighty shoes by dawn. Your arms are dead and your purse is full. {them} tells every inn on the road about the young smith who never sleeps.",fx:{coin:6,rep:3,sta:.5,skill:{craft:3},them:{type:"friend",op:20}}},lose:{r:"A mule kicks you into the water trough at midnight. You finish late and {them} pays half.",fx:{coin:3,health:-6,cause:"a mule's kick",skill:{craft:2}}}},{t:"Wake the master",r:"He curses, shoes them, and pockets the silver. He remembers that you woke him for money, which is something.",fx:{coin:1,perf:3}},{t:"Use the soft scrap iron and charge full price",check:{s:"deception",s2:"craft",d:40},win:{r:"The train leaves at dawn and you are six suns richer. Somewhere in the hills, the shoes are wearing thin.",fx:{coin:6,honor:-2}},lose:{r:"Three mules go lame on the pass. {them} comes back with a cudgel and a story for the whole road.",fx:{rep:-5,health:-5,cause:"a muleteer's cudgel",them:{type:"enemy",op:-30}}}}]},{id:"tr_smith_bars",opp:["smith"],maxRank:1,cool:5,title:"Slag in the bars",setup:(p,ctx)=>{mk(p,ctx,"an iron carter"),ctx.road=["POL-01","POL-10"].includes(p.realm)?"down the Iron Road from the dwarves":"from the smelters"},text:`The carter who brings the forge's iron {road} makes you an offer while the master is out: sign for twenty sound bars when three of them are slag under a skin of iron, and four suns are yours. "Everyone does it," says {them}. "They weigh the bars. Nobody looks inside."`,choices:[{t:"Sign, and take the four suns",check:{s:"deception",s2:"int",d:42},win:{r:"The bars go on the rack and the coins go in your boot. Nobody notices. This time.",fx:{coin:4,honor:-3}},lose:{r:"Your master breaks a bar on the anvil a week later and sees grey slag. He finds out who signed. You eat standing up for a while.",fx:{perf:-10,health:-6,cause:"a beating",honor:-3,them:{type:"acquaint",op:-10}}}},{t:"Break a bar in front of {themHim}",check:{s:"craft",s2:"str",d:40},win:{r:"The bar snaps and shows grey slag inside. {them} goes pale and gives your master three good bars for silence.",fx:{rep:4,perf:6,coin:2,them:{type:"enemy",op:-20}}},lose:{r:"You pick the one sound bar in the cart. {them} laughs all the way out of the yard.",fx:{happy:-2}}},{t:"Tell the master tonight",r:"Your master throws the carter's bars into the street. The carter's friends remember your face.",fx:{perf:5,honor:2,them:{type:"enemy",op:-25}}}]},{id:"tr_smith_spearheads",opp:["smith"],minRank:1,minRep:25,time:2,cool:4,title:"Three hundred spearheads",setup:(p,ctx)=>{ctx.n=300+rk(p)*100,ctx.fee=60+rk(p)*45,ctx.why=war(p)?"for the war with "+foe(p):"for the border garrisons"},text:"The quartermaster of the {realmShort} muster wants {n} spearheads {why}, delivered in forty days. He pays {fee} suns on delivery and nothing for late iron. A spearhead is a morning's work for a good smith. You will need a great many mornings.",choices:[{t:"Take it, and live at the anvil",check:{s:"craft",s2:"sta",d:50},win:{r:"Forty days of fire and noise. The quartermaster counts every head, bends three of them over his knee, and pays in full.",fx:pay((p,c)=>fee(c),{rep:6,sta:.5,skill:{craft:3}})},lose:{r:"Day forty comes and you are sixty heads short. He pays for what you made, less a fine for the rest.",fx:pay((p,c)=>fee(c)/3,{rep:-3,wil:1})}},{t:"Share it out among the journeymen of the quarter",check:{s:"stewardship",s2:"trade",d:48},win:{r:"Five forges, one tally stick, and every head delivered on the day. You keep the biggest share for the least sweat.",fx:pay((p,c)=>fee(c)*.7,{rep:4,skill:{stewardship:2}})},lose:{r:"Somebody's heads are as soft as lead. The quartermaster finds out whose name is on the contract: yours.",fx:pay((p,c)=>fee(c)/4,{rep:-6})}},{t:"Haggle him up first",check:{s:"trade",s2:"persuasion",d:55},win:{r:"He grumbles and pays a third more. War is a seller's market.",fx:pay((p,c)=>fee(c)*1.35,{rep:4,skill:{trade:2}})},lose:{r:"He finds a smith in {town} who does not haggle.",fx:{happy:-2}}},{t:"Turn it down",r:"Spearheads are not what you want to be remembered for.",fx:{}}]},{id:"tr_smith_knight_sword",opp:["smith"],minRank:1,cool:4,title:"Better than his lord's",setup:(p,ctx)=>{mk(p,ctx,"a hedge knight"),ctx.blade=A.pick(["Greywater","Brightwake","the Last Word","Hearthguard","Widowmaker","Saltfang"]),ctx.fest=fest()},text:"{themFull}, a hedge knight with more pride than land, lays 100 suns in silver on your bench: everything {theyHe} owns. {They} wants a sword better than {theirHis} lord's, ready for the tourney at {fest}.",choices:[{t:"Forge it honestly, fold by fold",check:{s:"craft",s2:"int",d:55},win:{r:"A plain grey blade that rings like a bell. At the tourney {them} breaks two swords with it and tells anyone who asks your name.",fx:{coin:100,rep:7,skill:{craft:4},them:{type:"friend",op:35}}},lose:{r:"It cracks in the quench two days before the tourney. You give back half the silver and hand over a plainer blade.",fx:{coin:50,rep:-2,wil:1,them:{type:"acquaint",op:-5}}}},{t:"Pattern-weld it, layer on layer",req:(p,C)=>C.prof(p,"craft",55),check:{s:"craft",s2:"wil",d:62},win:{r:"Iron and steel twisted together until the blade shows ripples like water. {them} names it {blade}, and lords ask to hold it.",fx:andUp({coin:100,rep:12,masterwork:"the pattern-welded sword {blade}",them:{type:"friend",op:45}},[1],"The guild wardens accept it as your masterpiece.")},lose:{r:"The welds open like the pages of a book. You have burned a month and the knight's patience.",fx:{coin:40,rep:-3,wil:1}}},{t:"Sell {themHim} a reworked old blade",check:{s:"deception",s2:"trade",d:48},win:{r:"New grip, new polish, old steel. {They} rides off delighted. You hope {theyHe} draws second at the tourney.",fx:{coin:100,honor:-4}},lose:{r:"{They} bends it across a knee in your yard and demands the silver back, loudly, in front of the street.",fx:{rep:-8,honor:-4,them:{type:"enemy",op:-40}}}}]},{id:"tr_smith_lock",opp:["smith"],minRank:1,cool:6,title:"The strongroom lock",setup:(p,ctx)=>{ctx.client=A.pick(["A money-changer","A wool merchant","A grain factor","A moneylender"])+" named "+nm(p),mk(p,ctx,"a stranger with soft hands")},text:"{client} paid you 40 suns for a strongroom lock with three hidden wards and a key nobody could copy. A week after you hung it, a stranger, {them}, finds you in the tavern. {They} wants a wax copy of that key, and puts 60 suns on the table to show {theyHe} is serious.",choices:[{t:"Take the 60 and press the key in wax",r:"You do it at night with the key from your pattern box. The stranger pays and is gone before the candle burns down.",fx:{coin:100,honor:-10,flag:"tr_smith_key",skill:{intrigue:1}}},{t:"Refuse, and warn your client",r:"The client changes the wards and sends you a cask of wine. The stranger is never seen again, though for a while you feel watched.",fx:{coin:40,rep:6,honor:3,them:{type:"enemy",op:-20}}},{t:"Agree, then tell the watch",check:{s:"intrigue",s2:"wil",d:52},win:{r:"The watch takes {them} with the wax in {theirHis} hand. Your client pays a reward, and the whole town hears that your locks bite back.",fx:{coin:60,rep:8,fame:1,them:{type:"enemy",op:-50}}},lose:{r:"{They} smells the trap and vanishes. A week later your shop door is forced and your best tools are gone.",fx:{coin:25,rep:2,them:{type:"enemy",op:-40}}}}]},{id:"tr_smith_bell",opp:["smith"],minRank:2,minRep:40,time:2,cool:10,title:"The great bell",setup:(p,ctx)=>{ctx.temple=temple(p),ctx.fee=200+rk(p)*60,ctx.Elders=A.cap(elders(p))},text:"The {temple} of {home} wants a bell that will be heard in the next valley: two tonnes of bronze, cast in a pit dug in the yard. The bell-founders want a master smith to run the furnaces. A cracked bell is a bad omen and a worse name. The fee is {fee} suns.",choices:[{t:"Pour it all in one heat",check:{s:"craft",s2:"int",d:60},win:{r:"The bronze runs into the mould bright as the sun. When they hang it and strike it, old women weep in the street.",fx:pay((p,c)=>fee(c),{rep:12,masterwork:"the great bell of {home}"})},lose:{r:"It comes out of the pit with a crack like a seam of frost. They melt it down, and the lost bronze is charged to you.",fx:{coin:-60,rep:-8,wil:1.5,happy:-6}}},{t:"Pour it in two heats, carefully",check:{s:"craft",s2:"wil",d:48},win:{r:"A sound bell, a little flat. Nobody but the founders can hear it, and they keep quiet.",fx:pay((p,c)=>fee(c)*.8,{rep:6})},lose:{r:"The second heat goes in too cold. The bell rings like a dropped pot, and will for a hundred years.",fx:pay((p,c)=>fee(c)*.4,{rep:-4})}},{t:"Have the pit blessed first, before the whole town",check:{s:"faith",s2:"craft",d:45},win:{r:"{Elders} bless the pit, the crowd prays, and the bell comes out whole. They credit the blessing. You credit the dry clay.",fx:pay((p,c)=>fee(c)*.8,{rep:5,piety:3})},lose:{r:"Prayers do not dry clay. A bubble in the lip, a cracked tone, and a crowd that saw it all.",fx:pay((p,c)=>fee(c)*.3,{rep:-4,piety:1})}}]},{id:"tr_smith_crucible",opp:["smith"],minRank:2,minRep:50,cool:8,title:"A cake of crucible steel",setup:(p,ctx)=>{mk(p,ctx,"a Ranpuri merchant")},text:"A merchant from Ranpur unwraps a cake of steel no bigger than a loaf. Crucible steel from Chanari, where the smiths teach only their own sons and hunt down any who leave. Forge it right and the finished blade shows water moving in the metal. Forge it wrong and it crumbles like a biscuit. {They} wants 120 suns, or a share of the blade.",choices:[{t:"Buy it and forge it yourself (120 suns)",req:p=>p.coin>=120,check:{s:"craft",s2:"int",d:65},win:{r:"Low heat, slow blows and a week of nerves. The finished blade shows grey water running under the polish. A count's agent buys it for 300 suns before the grip is wrapped.",fx:{coin:180,rep:12,masterwork:"a watered-steel blade forged from Chanari crucible steel",skill:{craft:4}}},lose:{r:"Too hot, just once. The cake crumbles on the anvil like dry cheese.",fx:{coin:-120,wil:1.5,happy:-6}}},{t:"Forge it for a share of the sale",check:{s:"craft",s2:"trade",d:60},win:{r:"You split 240 suns down the middle. {They} swears to bring you another cake next year.",fx:{coin:120,rep:8,them:{type:"friend",op:30}}},lose:{r:"You ruin it. {They} is gracious about it. {Their} friends are not.",fx:{rep:-4,them:{type:"enemy",op:-40}}}},{t:"Ask where {theyHe} got it",check:{s:"intrigue",s2:"persuasion",d:50},win:{r:"From a dead smith's chest at Chanari, it turns out. You send word to the Steel-Smiths' factor, who pays well for a thief's name.",fx:{coin:50,honor:2,them:{type:"enemy",op:-50}}},lose:{r:"{They} wraps the cake, smiles, and leaves without another word.",fx:{}}},{t:"Send {themHim} away",r:"Steel like that brings men with knives behind it.",fx:{}}]},{id:"tr_smith_mail",opp:["smith"],minRank:2,minRep:35,time:2,cool:5,title:"Twelve hauberks",setup:(p,ctx)=>{mkLord(p,ctx),ctx.fee=280+rk(p)*80},text:"{lord} wants twelve mail shirts for the household before Sea Opening: thirty thousand riveted rings in each one. The fee is {fee} suns for the work, iron found. That is a winter of drawing wire, punching and riveting for every pair of hands you can hire.",choices:[{t:"Hire every idle hand in the quarter and rivet every ring",check:{s:"stewardship",s2:"craft",d:55},win:{r:"Twelve shirts, every ring riveted, delivered a week early. {lord}'s knights try them on and stop making jokes about smiths.",fx:pay((p,c)=>fee(c),{rep:10,skill:{stewardship:3,craft:2},them:{type:"friend",op:20}})},lose:{r:"Only seven are ready by Sea Opening. {lord} pays for seven and grumbles about the rest.",fx:pay((p,c)=>fee(c)/2,{rep:-4})}},{t:"Butt the inner rings instead of riveting them",check:{s:"deception",s2:"craft",d:50},win:{r:"Nobody counts the inner rings. You deliver early and pocket the saved weeks.",fx:pay((p,c)=>fee(c)*1.3,{honor:-5,flag:"tr_smith_butted_mail"})},lose:{r:"A squire pulls a ring apart with his fingers in front of {lord}. You are paid nothing and talked about everywhere.",fx:{rep:-12,honor:-6,them:{type:"enemy",op:-40}}}},{t:"Take only six, and make them perfect",r:"Six shirts as good as dwarven work, nearly. {lord} orders six more for next year.",fx:pay((p,c)=>fee(c)*.5,{rep:6,skill:{craft:3}})}]},{id:"tr_smith_heir_sword",opp:["smith"],minRank:3,minRep:60,time:2,cool:12,title:"A sword for the heir",cond:(p,C)=>!C.flag(p,"tr_smith_heirsword"),setup:(p,ctx)=>{ctx.fest=fest(),ctx.fee=400},text:"Word comes from {capital}: the heir of {ruler} is to be girded with a sword at {fest}, and the court wants it from your forge. It must be beautiful, and it must not break on the day an enemy tests it. They will pay 400 suns, and every lord in the hall will see your mark on the blade.",choices:[{t:"Spend the winter on it, alone",check:{s:"craft",s2:"wil",d:65},win:{r:"When the heir draws it in the hall, the room goes quiet. The blade is plain, perfect and very sharp. Your mark is on it forever.",fx:{coin:400,rep:15,favor:10,masterwork:"the heir's sword of {realmShort}",flag:"tr_smith_heirsword",epithet:"Swordwright"}},lose:{r:"A good sword. Not a great one. The court is polite about it, which is worse.",fx:{coin:150,rep:-3,flag:"tr_smith_heirsword"}}},{t:"Bring in the best smith you know and share the glory",check:{s:"craft",s2:"diplomacy",d:52},win:{r:"Two masters, one anvil and no shouting, which surprises everyone. The sword is magnificent, and both your marks are on it.",fx:{coin:250,rep:10,favor:6,masterwork:"the heir's sword of {realmShort}, made with a brother smith",flag:"tr_smith_heirsword",newRel:{type:"friend",op:40}}},lose:{r:"Two masters, one anvil and endless argument. The sword is late and nobody's best.",fx:{coin:120,rep:2,flag:"tr_smith_heirsword",newRel:{type:"rival",op:-20}}}},{t:"Gild and jewel it. Nobody tests a prince's sword",check:{s:"craft",s2:"etiquette",d:50},win:{r:"The court gasps at the gold. Nobody asks about the steel. You are paid handsomely.",fx:{coin:450,rep:6,favor:6,flag:"tr_smith_heirsword"}},lose:{r:"The heir waves it at the feast and the guard bends against a table. The laughter is worse than any fine.",fx:{coin:100,rep:-12,favor:-10,flag:"tr_smith_heirsword"}}}]},{id:"tr_smith_iron_company",opp:["smith"],minRank:3,cool:8,title:"All the iron in town",setup:(p,ctx)=>{ctx.co=p.realm==="POL-01"?"The Iron Road Company of Kingsmere":"A company of iron merchants from "+capOf(p)},text:"{co} offers the smiths of {home} a bargain: all their iron through the company, at a fixed price, for five years. Cheap this year. When the five years are up, every forge in town will have forgotten any other seller. You sign for the guild, or you do not. The company's man has mentioned a gift of 120 suns for your trouble.",choices:[{t:"Sign, and take the gift",r:"The iron is cheap and the masters are happy. For now. The gift buys a fine cloak you do not enjoy wearing.",fx:{coin:120,rep:-3,honor:-4}},{t:"Sign, but for two years only",check:{s:"trade",s2:"diplomacy",d:55},win:{r:"Two years, a fair price and a clause for bad iron. The masters call it the best bargain the guild ever made.",fx:{coin:30,rep:7,skill:{trade:2}}},lose:{r:"The company's man walks out. The next week, iron in {home} costs a third more.",fx:{rep:-4}}},{t:"Refuse, and buy from the dwarves directly",check:{s:"trade",s2:"etiquette",d:55,bonus:p=>p.race==="dwarf"?15:0},win:{r:"The dwarven factors respect a guild that pays on the day and reads its contracts. Better iron, a fair price, and no company.",fx:{rep:9,skill:{trade:3}}},lose:{r:"The dwarves want payment in advance, in metal, and a written contract with penalties you cannot meet.",fx:{rep:-3,coin:-20}}},{t:"Put it to a vote of every master",r:"They vote for cheap iron, as you knew they would. But nobody can say you sold them.",fx:{rep:3,honor:2}}]}]));
    A.defEvents([
      {
        id: "tr_smith_key_robbery",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"tr_smith_key"),
        w: 2,
        title: "Opened with a key",
        text: "The strongroom you made the lock for has been emptied. Nothing was forced. The watch-captain stands in your forge, turns a horseshoe over in his fingers, and asks, mildly, who else knows the wards.",
        choices: [
          {
            t: "Say nothing. Lock-picks exist",
            check: {s:"deception",s2:"wil",d:55},
            win: {
              r: "He has no proof, only a look. He leaves with the look.",
              fx: {unflag:"tr_smith_key",honor:-2,wil:.5},
            },
            lose: {
              r: "The stranger was taken in {town} with a wax key in a purse, and named you to save a hand.",
              fx: {unflag:"tr_smith_key",punish:"theft",rep:-15},
            },
          },
          {
            t: "Confess, and name the stranger",
            r: "You pay back what you can. The whole quarter learns that the word of your locks is worth exactly some wax.",
            fx: {unflag:"tr_smith_key",rep:-12,coin:-40,honor:2},
          },
          {
            t: "Leave {home} before he comes back",
            r: "You leave the forge, the anvil and your name in {home}, and walk.",
            fx: p=>(delete p.flags.tr_smith_key,p.job=null,A.willGrow(p,1,"flight"),""),
          },
        ],
      },
      {
        id: "tr_smith_butted",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"tr_smith_butted_mail"),
        w: 1.5,
        title: "The inner rings",
        text: "A knight rides into your yard with his arm in a sling and one of your hauberks thrown over the saddle. A spear went through the inner rings as if they were cloth. He wants to know why.",
        choices: [
          {
            t: "Pay him blood-money (40 suns)",
            req: p=>p.coin>=40,
            r: "He takes the silver and spits in your trough. The story stays between you, mostly.",
            fx: {coin:-40,unflag:"tr_smith_butted_mail",honor:1},
          },
          {
            t: "Remake every shirt for nothing",
            r: "A winter of work for no pay. Word gets round that you made it right, and that counts for something.",
            fx: {coin:-80,rep:3,honor:5,unflag:"tr_smith_butted_mail",wil:1},
          },
          {
            t: "Deny it. Spears go through anything",
            check: {s:"deception",s2:"intimidation",d:55},
            win: {
              r: "He cannot prove the ring was butted and not broken. He rides off cursing.",
              fx: {unflag:"tr_smith_butted_mail",honor:-3},
            },
            lose: {
              r: "He pulls a butted ring open in front of your apprentices, then knocks you into the slack tub.",
              fx: {unflag:"tr_smith_butted_mail",rep:-10,health:-8,cause:"a knight's fist",honor:-4},
            },
          },
        ],
      },
      {
        id: "tr_smith_d_kick",
        cond: (p,C)=>C.adult(p)&&J(p,"smith"),
        title: "The kicking horse",
        text: "A lord's warhorse will not let anyone near its hind feet. It has already kicked one stable boy across the yard. The groom wants it shod by noon, and the horse is worth more than your forge.",
        choices: [
          {
            t: "Pick up the hoof and talk to it",
            check: {s:"husbandry",s2:"str",d:50},
            win: {
              r: "It leans its weight on you like a tired old man and lets you work. The groom pays and stares.",
              fx: {coin:2,rep:3,skill:{husbandry:2}},
            },
            lose: {
              r: "It waits until you bend, then lets fly.",
              fx: {health:-15,cause:"a horse's kick",wound:"broken_ribs",wil:1},
            },
          },
          {
            t: "Tie up a hind leg and twitch its lip",
            check: {s:"husbandry",s2:"int",d:42},
            win: {r:"Ugly, but it works. The horse goes home shod and furious.",fx:{coin:2,rep:1}},
            lose: {
              r: "It throws itself down in the ropes and cuts a knee. The groom blames you, loudly.",
              fx: {rep:-4,coin:-5},
            },
          },
          {t:"Send it back unshod",r:"The groom takes it to another forge, and tells them why.",fx:{rep:-2}},
        ],
      },
      {
        id: "tr_smith_d_hammer",
        cond: (p,C)=>C.adult(p)&&J(p,"smith")&&rk(p)>=1,
        title: "The hammer at dawn",
        text: "{npcM}, a wool merchant who has bought the house next door, has petitioned the town council to move your forge outside the walls. The hammer at dawn wakes his wife, he says, and your sparks will burn the street one night.",
        choices: [
          {
            t: "Fight it in the council",
            check: {s:"persuasion",s2:"learning",d:50},
            win: {
              r: "The council finds that the smiths were in that street before the wool trade was born. The petition fails.",
              fx: {rep:3,honor:1},
            },
            lose: {r:"You move outside the gate and lose half your passing trade.",fx:{coin:-30,rep:-2,happy:-4}},
          },
          {
            t: "Make him an iron gate, as a gift",
            check: {s:"craft",s2:"etiquette",d:45},
            win: {
              r: "A gate with curling vines. His wife loves it. The petition is withdrawn.",
              fx: {coin:-5,rep:2,newRel:{type:"friend",op:25}},
            },
            lose: {r:"He takes the gate and keeps the petition. You keep the forge, barely.",fx:{coin:-5,happy:-2}},
          },
          {
            t: "Start work an hour later",
            r: "Peace in the street, and an hour less at the anvil.",
            fx: {perf:-3,happy:-1},
          },
        ],
      },
    ]);
    A.defEvents(O([{id:"tr_mason_quarry",opp:["mason"],maxRank:1,cool:3,title:"Splitting the block",setup:(p,ctx)=>{ctx.what=A.pick(["a door lintel","a gate step","a window sill","a well cap"])},text:"The master sends you up to the quarry at {town} with a mallet, a row of iron wedges and orders to split a block for {what}: three metres long and not a crack in it. Stone has a grain, like wood, if you can read it. The quarrymen are betting against you.",choices:[{t:"Read the grain and set the wedges",check:{s:"craft",s2:"int",d:36},win:{r:"One clean split, straight as a rule. The quarrymen pay their bets to each other, grumbling, and one buys you a drink.",fx:{coin:2,rep:3,skill:{craft:3}}},lose:{r:"The block splits on the slant. The master docks your bread for a week and tells the story at supper.",fx:{happy:-3,wil:.5,skill:{craft:1}}}},{t:"Bet two suns on yourself",req:p=>p.coin>=2,check:{s:"craft",s2:"wil",d:40},win:{r:"Clean split. You walk home six suns richer and twice as tall.",fx:{coin:4,rep:3,skill:{craft:2}}},lose:{r:"Crack. Laughter. Two suns gone into a quarryman's boot.",fx:{coin:-2,happy:-2}}},{t:"Ask the oldest quarryman to show you",r:"He spits, taps the stone with a knuckle and listens like a physician. You learn more in an hour than in a year.",fx:{skill:{craft:4},newRel:{type:"friend",op:25}}}]},{id:"tr_mason_mark",opp:["mason"],maxRank:1,cool:10,title:"A mark to cut",cond:(p,C)=>!C.flag(p,"tr_mason_marked"),setup:(p,ctx)=>{mk(p,ctx,"an old master mason")},text:"The lodge gives every mason a mark to cut on each stone he dresses, so the master can count the work and find the mistakes. Old {them}, who has cut stone for fifty years and whose hands now shake, offers you {theirHis} own mark, so that it does not die with {themHim}.",choices:[{t:"Take {theirHis} mark, and the name that comes with it",r:"Strangers who see the mark on your stones think a fifty-year master cut them. You had better cut like one.",fx:{flag:"tr_mason_marked",rep:4,honor:2,them:{type:"mentor",op:40}}},{t:"Choose a mark of your own",r:"Three lines and a hook. Nobody else on Ardan cuts it. It will be on walls when your grandchildren are dead.",fx:{flag:"tr_mason_marked",happy:3,rep:2,them:{type:"mentor",op:10}}},{t:"Take the mark, and ask for {theirHis} secrets too",check:{s:"persuasion",s2:"wil",d:40},win:{r:"{They} laughs until {theyHe} coughs, then teaches you all winter: how to hang a true arch, how to hear a bad stone.",fx:{flag:"tr_mason_marked",skill:{craft:5},them:{type:"mentor",op:30}}},lose:{r:'"Greedy," {theyHe} says. "Take the mark. Earn the rest."',fx:{flag:"tr_mason_marked",them:{type:"mentor",op:-5}}}}]},{id:"tr_mason_wall",opp:["mason"],maxRank:1,cool:5,title:"Rubble in the core",setup:(p,ctx)=>{mk(p,ctx,"the wall foreman"),ctx.when=war(p)?"before "+foe(p)+" comes":"before the raiding season"},text:'The town wall of {home} has a breach the length of three carts, and the council wants it closed {when}. The foreman, {them}, tells the gang to fill the core with rubble and mud and face it with good stone. "The council pays for a wall, not for the inside of one." He keeps the difference.',choices:[{t:"Build your stretch true, all the way through",r:"You are slower than the others, and {them} docks your pay for it. But the stretch with your mark on it is solid stone to the core.",fx:{coin:4,rep:4,honor:2,them:{type:"rival",op:-15}}},{t:"Fill it, and take your share",r:"Mud and rubble, a fine face of ashlar, and twelve suns for keeping quiet.",fx:{coin:12,honor:-4,flag:"tr_mason_rubble_core"}},{t:"Tell the council",check:{s:"persuasion",s2:"learning",d:46},win:{r:"The council sends a man with a crowbar, who opens the face and finds the mud. {them} is turned off the works and you finish the stretch.",fx:{coin:8,rep:8,fame:1,them:{type:"enemy",op:-40}}},lose:{r:"Half the council are the foreman's cousins. Nobody listens, and now he knows.",fx:{perf:-5,happy:-3,them:{type:"enemy",op:-40}}}}]},{id:"tr_mason_bridge",opp:["mason"],minRank:2,minRep:40,time:2,cool:12,title:"A bridge of stone",setup:(p,ctx)=>{ctx.lord=patron(p),ctx.fee=260+rk(p)*40,ctx.river="the river below "+homeOf(p)},text:"{lord} wants a stone bridge across {river} to replace the ferry, with a toll-house at the far end. Five arches, two summers, {fee} suns for the master. The river is gentle in summer. The old men say that in a bad spring it comes down brown and fast enough to roll boulders.",choices:[{t:"Sink the piers deep, inside coffer dams",check:{s:"craft",s2:"int",d:58},win:{r:"Two summers of pumping, piling and cursing. The bridge stands as if it grew there, and {lord}'s toll-keeper grows fat.",fx:pay((p,c)=>fee(c),{rep:12,masterwork:"the five-arch bridge below {home}",flag:"tr_mason_bridge_stone"})},lose:{r:"A coffer dam bursts in the second summer and drowns a laborer. The bridge is finished late and over cost, and you carry the man's name.",fx:pay((p,c)=>fee(c)/2,{rep:-2,wil:1,honor:-1,flag:"tr_mason_bridge_stone"})}},{t:"Timber piles and a quick finish",r:"Done in one summer. {lord} is delighted. Nobody has asked the river.",fx:pay((p,c)=>fee(c)+80,{rep:5,flag:"tr_mason_bridge_timber"})},{t:"Refuse. The river is wrong for a bridge",r:"{lord} finds someone who will say yes. You hope you are wrong.",fx:{honor:1,rep:-1}}]},{id:"tr_mason_cathedral",opp:["mason"],minRank:3,minRep:60,time:3,cool:20,w:1.5,title:"The work of a lifetime",cond:(p,C)=>!C.flag(p,"tr_mason_cath"),setup:(p,ctx)=>{ctx.temple=temple(p),ctx.Elders=A.cap(elders(p)),ctx.style=grp(p)==="sun"?"pointed arches and colored glass, like the great Temple at Solenne":"a stone vault where there has only ever been timber",ctx.fest=fest()},text:"{Elders} of {capital} want a new {temple}, bigger than anything in {realmShort}: a nave of forty metres, {style}. It will take forty years. You will not live to see the roof go on. They want you as master of works.",choices:[{t:"Draw the boldest plan you can",check:{s:"craft",s2:"int",d:62},win:{r:"The plan is so bold that the priests argue over it for a month. Then they say yes. The first stone goes down at {fest} with your mark on its face.",fx:{coin:300,rep:15,fame:3,masterwork:"the plan of the great {temple} of {capital}",flag:"tr_mason_cath",epithet:"the Builder"}},lose:{r:"Your model of the vault cracks in front of the elders. They keep you on, but they make you build it lower.",fx:{coin:200,rep:5,flag:"tr_mason_cath",wil:1}}},{t:"Build it the old, safe way",r:"Thick walls, round arches, small windows. It will stand a thousand years and nobody will travel to see it.",fx:{coin:200,rep:8,flag:"tr_mason_cath"}},{t:"Demand your fee in writing, year by year",check:{s:"trade",s2:"learning",d:50},win:{r:"A contract on parchment, sealed, with a clause for your widow. The priests think you grasping. Your family will thank you.",fx:{coin:400,rep:10,flag:"tr_mason_cath",skill:{trade:2}}},lose:{r:"The priests take offense and give the work to a humbler man.",fx:{rep:-4,happy:-5}}},{t:"Decline. A lifetime is too much",r:"Someone else's mark goes on the first stone.",fx:{happy:-1}}]},{id:"tr_mason_tomb",opp:["mason"],minRank:1,cool:4,title:"Virtues in stone",setup:(p,ctx)=>{mk(p,ctx,"a rich widow",{sex:"F"}),ctx.fee=40+rk(p)*20,ctx.temple=temple(p)},text:"{themFull} wants a tomb for her husband in the {temple} yard: his likeness lying on the lid, his dog at his feet, and his virtues cut around the edge. He was, as the whole town knows, a drunk and a cheat. She will pay {fee} suns.",choices:[{t:"Carve him as she remembers him",check:{s:"craft",s2:"int",d:48},win:{r:"A handsome face, a noble dog, and six virtues nobody saw him practise. She weeps and pays in full.",fx:pay((p,c)=>fee(c),{rep:5,them:{type:"friend",op:25}})},lose:{r:"The face comes out like his brother's. She weeps, for the wrong reasons.",fx:pay((p,c)=>fee(c)/2,{rep:-1})}},{t:"Carve him as he was, with a wink",check:{s:"craft",s2:"deception",d:52},win:{r:"A noble face, if you do not look closely at the wine cup in his hand. She never notices. The town comes to look and laughs for a generation.",fx:pay((p,c)=>fee(c),{rep:7,fame:1,honor:-1})},lose:{r:"She notices.",fx:{rep:2,them:{type:"enemy",op:-40}}}},{t:"Cut every virtue she asks for, and charge by the letter",r:"Kind, sober, honest, faithful, generous and wise. Forty extra letters at a penny each, and she does not blink.",fx:pay((p,c)=>fee(c)*1.4,{honor:-1})}]},{id:"tr_mason_hidden_room",opp:["mason"],minRank:2,cool:8,title:"A room that is not there",setup:(p,ctx)=>{ctx.lord=patron(p)},text:"{lord} wants a strongroom behind the wine cellar of a town house: a door hidden in the wall, a stair inside the thickness of the stone, and nobody to know. The steward mentions that the last mason who built such a room talked too much in his cups and was found in the river. The fee is 120 suns.",choices:[{t:"Build it, and forget the way down",r:"You build it, take the purse, and forget everything as hard as you can. You hope {lord} believes you.",fx:{coin:120,rep:3,skill:{craft:2}}},{t:"Build it, and hide a drawing somewhere safe",check:{s:"intrigue",s2:"craft",d:52},win:{r:"The drawing goes behind a loose stone only you know. A secret is worth more when two people know you have it.",fx:{coin:120,skill:{intrigue:3},flag:"tr_mason_drawing"}},lose:{r:"The steward's men search your yard and find it. They make you burn it, and teach you a lesson on the way home.",fx:{coin:60,health:-10,cause:"a beating",wil:1}}},{t:"Refuse",r:"Some money costs too much. {lord} hires a mason from out of town, who is never seen again.",fx:{rep:-1,honor:1}}]},{id:"tr_mason_measure",opp:["mason"],minRank:1,cool:8,title:"The measure-stone",setup:(p,ctx)=>{mk(p,ctx,p.realm==="POL-18"?"a flood-priest":"the town reeve")},text:p=>p.realm==="POL-18"?"A flood-priest, {them}, comes to you at night. The cubit marks on a village flood stair are worn and must be re-cut, {theyHe} says. {They} shows you where. The new marks are a hand's breadth lower than the old ones. The flood height sets the year's tax.":"The market's measure-stone, the stone bushel and iron ell set in the market hall wall against which every trader's measure is checked, is worn smooth. The reeve, {them}, wants it re-cut and shows you exactly where. The new line is a finger's width short of the old one.",choices:[{t:"Cut it where {theyHe} says (10 suns)",r:"The chisel does not care. You do, a little, every market day after.",fx:{coin:10,honor:-5,them:{type:"friend",op:15}}},{t:"Cut it true and say nothing",r:"You cut it exactly where the old line ran. {them} measures it, says nothing, and never hires you again.",fx:{honor:3,rep:2,them:{type:"enemy",op:-20}}},{t:"Cut it true and tell the town why",check:{s:"persuasion",s2:"wil",d:55},win:{r:"The market crowd measures it themselves and roars. {them} has a hard year. You have friends in every stall.",fx:{fame:2,honor:5,rep:6,them:{type:"enemy",op:-50}}},lose:{r:"Nobody believes a mason over {them}. You are fined for slander.",fx:{coin:-10,rep:-5,them:{type:"enemy",op:-50}}}}]},{id:"tr_mason_keep",opp:["mason"],minRank:2,minRep:35,time:2,cool:6,title:"Stone before the grass",setup:(p,ctx)=>{ctx.lord=patron(p),ctx.fee=200+rk(p)*60},text:"{lord} wants the old timber hall at {town} rebuilt as a stone tower before the raiding season. Lime mortar takes months to cure, and walls raised too fast settle and crack. {lord} does not want to hear about lime. The fee is {fee} suns.",choices:[{t:"Build fast with hot lime, and hope",check:{s:"craft",s2:"sta",d:55},win:{r:"It stands. It even stands straight. {lord} sleeps behind stone before the first rider is seen.",fx:pay((p,c)=>fee(c),{rep:6,sta:.5})},lose:{r:"Cracks run up the north face by midsummer. {lord} pays half and calls you a cheat in every hall.",fx:pay((p,c)=>fee(c)/2,{rep:-8})}},{t:"Build it properly, and finish late",r:"{lord} rages all summer. Twenty years later {lord}'s grandson thanks your grandson.",fx:pay((p,c)=>fee(c)*.7,{rep:5,honor:2})},{t:"Talk {lord} into a ditch and palisade first",check:{s:"persuasion",s2:"siegecraft",d:50},win:{r:"A ring of stakes this year, stone next year, and a tower that will not crack. {lord} calls it {lord}'s own idea.",fx:pay((p,c)=>fee(c),{rep:8,skill:{siegecraft:2}})},lose:{r:'"I asked for a tower, mason." Someone else builds it.',fx:{rep:-2}}}]},{id:"tr_mason_dwarf_bid",opp:["mason"],minRank:2,cool:8,title:"The dwarven bid",text:"A company of dwarven stone-cutters has come down from the mountains and bid for the new guildhall of {home}: half your price, twice your speed, and a written contract with a penalty for every day late. The council is very tempted. Your masons are talking about putting stones through dwarven windows.",choices:[{t:"Match their price",r:"You win the hall and lose your profit. The dwarves shrug and go home. They will be back.",fx:{coin:-30,rep:3,perf:4}},{t:"Offer to work beside them, and learn",check:{s:"diplomacy",s2:"craft",d:52,bonus:p=>p.race==="dwarf"?15:0},win:{r:"They take you on for the season. You learn to cut stone with a saw and water, and to read a contract twice.",fx:{skill:{craft:6},rep:5,newRel:{type:"friend",op:30}}},lose:{r:'"We take no outside apprentices," says their master, and that is that.',fx:{happy:-2}}},{t:"Stir up the town against outsiders",check:{s:"intrigue",s2:"persuasion",d:48},win:{r:"A few broken windows and an ugly crowd at the inn. The dwarves leave. You get the hall, and a stain you cannot quite wash off.",fx:{rep:2,honor:-5,coin:20}},lose:{r:"The council sees what you did. The dwarves get the hall and you get a fine.",fx:{rep:-6,honor:-5,coin:-15}}},{t:"Let them have it",r:"You watch them build it, and grudgingly admire the joints.",fx:{happy:-2,skill:{craft:1}}}]}]));
    A.defEvents([
      {
        id: "tr_mason_rubble",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"tr_mason_rubble_core"),
        w: 1.5,
        title: "The bulge",
        text: "After a week of rain, the stretch of town wall you helped fill with rubble has begun to bulge like a full belly. The council has noticed. So has the foreman, who is telling everyone that the bad stones were cut by you.",
        choices: [
          {
            t: "Tell the council what the foreman ordered",
            check: {s:"persuasion",s2:"wil",d:50},
            win: {
              r: "The council fines the foreman and makes the whole gang rebuild it for nothing, you included. Fair enough.",
              fx: {unflag:"tr_mason_rubble_core",honor:2,rep:2},
            },
            lose: {
              r: "You both pay. Your word and his are worth the same now, which is not much.",
              fx: {unflag:"tr_mason_rubble_core",rep:-6,coin:-10},
            },
          },
          {
            t: "Rebuild it at night with your own hands",
            check: {s:"str",s2:"craft",d:48},
            win: {
              r: "Three nights of wet stone and torchlight. When the council comes to look, the bulge is gone.",
              fx: {unflag:"tr_mason_rubble_core",honor:3,sta:.5,rep:3},
            },
            lose: {
              r: "The wet stones slide in the dark and take you with them.",
              fx: {unflag:"tr_mason_rubble_core",health:-12,cause:"falling stones",wound:"bad_knee"},
            },
          },
          {
            t: "Keep quiet and let the foreman take it",
            r: "The foreman is fined and turned off. He knows who could have spoken.",
            fx: {unflag:"tr_mason_rubble_core",honor:-4,newRel:{type:"enemy",op:-40}},
          },
        ],
      },
      {
        id: "tr_mason_bridge_flood",
        cond: (p,C)=>C.adult(p)&&(C.flag(p,"tr_mason_bridge_stone")||C.flag(p,"tr_mason_bridge_timber")),
        w: 1.2,
        cool: 10,
        title: "The river comes down",
        text: "Spring melt. The river comes down brown and roaring, carrying whole trees, and they are piling up against the piers of your bridge. A cart and a dozen people are halfway across, and the stones are groaning.",
        choices: [
          {
            t: "Run out onto the bridge and get them off",
            check: {s:"spd",s2:"wil",d:48},
            win: {
              fx: p=>{const weak=!!p.flags.tr_mason_bridge_timber;return delete p.flags.tr_mason_bridge_timber,delete p.flags.tr_mason_bridge_stone,p.honor=A.clamp(p.honor+5,0,100),A.fame(p,2),weak?(A.addRep(p,-10),"You drag the last child off by the collar. Behind you the middle arch goes into the river with a sound like the world ending. Everyone lives. Nobody forgets whose bridge it was."):(A.addRep(p,6),"You drag the last child off by the collar. The bridge shudders, groans and holds. You stood on it when it mattered.")},
            },
            lose: {
              r: "A tree trunk sweeps the parapet as you run. You are pulled from the water a mile downstream.",
              fx: {health:-18,cause:"the flood",wound:"concussion",honor:3,wil:1.5},
            },
          },
          {
            t: "Get men with hooks and clear the trees",
            check: {s:"command",s2:"str",d:50},
            win: {
              fx: p=>{const weak=!!p.flags.tr_mason_bridge_timber;return delete p.flags.tr_mason_bridge_timber,delete p.flags.tr_mason_bridge_stone,A.fame(p,1),weak?(A.addRep(p,-6),"You clear the trees, but the timber piles have been rotting for years. A pier sags a hand's breadth and the bridge is closed for a summer of repairs at your cost."):(A.addRep(p,7),"Twenty men with boat-hooks and ropes. The trees go through the arches one by one, and the bridge stands.")},
            },
            lose: {
              r: "A trunk rolls on its hook and throws you against the pier.",
              fx: {health:-12,cause:"the flood",wound:"broken_ribs"},
            },
          },
          {
            t: "Watch from the bank, and pray",
            fx: p=>{const weak=!!p.flags.tr_mason_bridge_timber;return delete p.flags.tr_mason_bridge_timber,delete p.flags.tr_mason_bridge_stone,weak?(A.addRep(p,-12),p.honor=A.clamp(p.honor-2,0,100),"The middle arch goes, cart and all. The people are pulled out downstream, all but one. The toll-keeper says your name at the inquest."):(A.addRep(p,4),"The water rises to the springing of the arches and stops there. The bridge holds. You did nothing, and it was enough.")},
          },
        ],
      },
      {
        id: "tr_mason_cath_money",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"tr_mason_cath"),
        cool: 8,
        title: "The money stops",
        setup: (p,ctx)=>{ctx.temple=temple(p),ctx.stage=A.pick(["the walls stand three men high, roofed with sky","the nave walls are up and the first vaults are closing","the west towers stand half-built in their scaffolds","the choir is roofed and the nave is still a field of stones"])},
        text: "Years into the work on the new {temple}, {stage}. Now the money has stopped: a bad harvest, a war tax, a donor who died. Three hundred masons and laborers are waiting to be paid.",
        choices: [
          {
            t: "Go to court and ask {ruler} for help",
            check: {s:"etiquette",s2:"persuasion",d:58},
            win: {
              r: "A royal gift, and a royal name carved over the west door. The cranes turn again.",
              fx: {favor:8,rep:6,fame:2},
            },
            lose: {
              r: "You wait nine days in an antechamber and are seen for a minute. The answer is no.",
              fx: {favor:-3,rep:-2,wil:1},
            },
          },
          {
            t: "Open the half-built nave to pilgrims, for a fee",
            check: {s:"trade",s2:"faith",d:48},
            win: {
              r: "Pilgrims pay a penny to stand under the open sky inside the walls of a holy place being born. It is enough to keep half the masons.",
              fx: {coin:40,rep:4,piety:2},
            },
            lose: {
              r: "The priests call it a market in a holy place. The pilgrims call it a building site. Both are right.",
              fx: {honor:-2,rep:-2},
            },
          },
          {
            t: "Pay the masons from your own purse for a season",
            req: p=>p.coin>=150,
            r: "You will not be rich now. The masons will never forget it.",
            fx: {coin:-150,honor:5,rep:8,wil:1},
          },
          {
            t: "Stop the work and send them home",
            r: "The cranes stand still and the scaffolds grey in the rain. It may be ten years before they turn again.",
            fx: {rep:-6,happy:-6,wil:1},
          },
        ],
      },
      {
        id: "tr_mason_cath_vault",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"tr_mason_cath")&&C.jobRank(p,2),
        cool: 12,
        title: "A hair in the keystone",
        setup: (p,ctx)=>{ctx.temple=temple(p),ctx.bay=A.pick(["first","second","third","fifth","last"])},
        text: "They strike the timber centering from under the {bay} bay of the great vault of your {temple}. In the silence after, you hear it: a tick, like a nail in a cooling hearth. A crack the width of a hair runs across the keystone.",
        choices: [
          {
            t: "Put the centering back and rebuild the bay",
            r: "A year lost and sixty suns of stone. Nobody dies. You tell yourself that is the only thing that matters.",
            fx: {coin:-60,rep:2,wil:1},
          },
          {
            t: "Prop the walls from outside with flying arches",
            check: {s:"craft",s2:"int",d:62},
            win: {
              r: "Half-arches leaping from buttress to wall, holding the vault like hands holding a bowl. The crack never grows. Masons come from three realms to see it.",
              fx: {rep:12,fame:3,masterwork:"the flying arches of the {temple} of {capital}",skill:{craft:4}},
            },
            lose: {
              r: "The props push too hard. The bay comes down at night, on nobody, thank {god}.",
              fx: {rep:-8,coin:-40,wil:1.5},
            },
          },
          {
            t: "Blame the carpenters' centering",
            check: {s:"deception",s2:"persuasion",d:50},
            win: {
              r: "The carpenters pay for the repair. They know, and you know, and they will never work for you again.",
              fx: {honor:-3,coin:10},
            },
            lose: {
              r: "The master carpenter shows the chapter your own drawings. Everyone sees the mistake was yours.",
              fx: {rep:-6,honor:-3,newRel:{type:"enemy",op:-35}},
            },
          },
        ],
      },
      {
        id: "tr_mason_d_dust",
        cond: (p,C)=>C.adult(p)&&J(p,"mason")&&rk(p)>=1,
        title: "Stone dust",
        text: "You cough in the mornings now, and spit grey. Every mason over forty does. The physicians say it is bad air from the quarries. The old masons say it is the dust, and that it never leaves you.",
        choices: [
          {
            t: "Wet the stone as you cut, even if it is slower",
            r: "Slower work, cleaner lungs. The younger masons laugh. The older ones copy you.",
            fx: {perf:-2,health:4},
          },
          {
            t: "Work on. Everyone coughs",
            check: {s:"sta",s2:"wil",d:45},
            win: {r:"The cough comes and goes with the seasons. You are tougher than most.",fx:{wil:.5}},
            lose: {
              r: "One winter the cough settles in your chest and stays.",
              fx: {wound:"lungs",health:-8,cause:"stone-lung"},
            },
          },
          {
            t: "Ask to set stones on the wall, where the wind blows",
            r: "Less carving, more lifting. Your chest thanks you. Your hands miss the chisel.",
            fx: {perf:-1,health:3,str:.5},
          },
        ],
      },
      {
        id: "tr_mason_d_hoard",
        cond: (p,C)=>C.adult(p)&&J(p,"mason"),
        cool: 12,
        title: "A pot in the foundations",
        setup: (p,ctx)=>{ctx.n=A.ri(20,60),ctx.who=grp(p)==="sun"?"old Solen":"old"},
        text: "Digging out the foundations for a new house, your spade rings on clay. A pot, sealed with wax, full of {who} coins, green with age and worth perhaps {n} suns. The other diggers are at their bread on the far side of the trench.",
        choices: [
          {
            t: "Report it to the lord, as the law says",
            r: "The lord takes it and gives you a fifth, which is more than you expected.",
            fx: pay((p,c)=>(c.n||30)/5,{honor:2}),
          },
          {
            t: "Slip it into your tool bag",
            check: {s:"stealth",s2:"deception",d:45},
            win: {
              r: "Home under your tools. You sell the coins one at a time to a silversmith in {town} over a year.",
              fx: pay((p,c)=>c.n||30,{honor:-2}),
            },
            lose: {r:"A digger sees the bag clink. By evening the reeve knows.",fx:{punish:"theft"}},
          },
          {
            t: "Share it out among the diggers there and then",
            r: "Each man gets a handful. Every one of them will work for you, any day you ask.",
            fx: pay((p,c)=>(c.n||30)/6,{honor:1,rep:2,newRel:{type:"friend",op:30}}),
          },
        ],
      },
    ]);
    const HANGING = {
        "POL-01": "the wars of Harald Ironside, as every great hall in Aldmark shows them",
        "POL-03": "Roderic the Lionheart at the Coast Road",
        "POL-14": "the Diver cutting the chain",
        "POL-15": "the great siege of 895 to 897",
      };
    A.defEvents(O([{id:"tr_weaver_warp",opp:["weaver"],maxRank:0,cool:3,title:"The crossed thread",text:"You have spent three days setting up the master's broad loom: eight hundred warp threads, each through its heddle and reed in the right order. On the last night you see that you crossed two threads near the very start. Undoing it means another day. The master wants to begin weaving at dawn.",choices:[{t:"Unpick it all by the light of the fire",check:{s:"sta",s2:"wil",d:40},win:{r:"By dawn the warp is perfect. The master runs a thumb along it and says nothing, which from him is praise.",fx:{perf:5,skill:{craft:3},wil:.5}},lose:{r:"You fall asleep at the loom. The master finds you there at dawn, and the work half undone.",fx:{perf:-4,happy:-3}}},{t:"Say nothing. It will hardly show",check:{s:"deception",s2:"craft",d:40},win:{r:"It hardly shows. You notice it in every ell for a month, and nobody else does.",fx:{perf:1,honor:-1}},lose:{r:"The flaw runs the length of the bolt. The guild searcher finds it and fines the master, who finds you.",fx:{perf:-8,health:-4,cause:"the strap"}}},{t:"Tell the master",r:"He curses, then shows you a trick to cross them back without undoing the lot. You will never forget it.",fx:{perf:2,honor:2,skill:{craft:3}}}]},{id:"tr_weaver_fuller",opp:["weaver"],maxRank:1,cool:4,title:"Stretched on the tenters",setup:(p,ctx)=>{mk(p,ctx,"the fuller")},text:"You take the master's cloth to the fulling mill. The fuller, {them}, winks: a few more hours on the tenter frames will stretch every bolt a whole ell longer, and it can be sold as full measure. It shrinks back at the first rain, but by then the buyer is far away. {They} wants two suns for the favor.",choices:[{t:"Stretch it, for the master's profit",check:{s:"deception",s2:"int",d:40},win:{r:"The master sells the long bolts and gives you a sun from the profit without asking how.",fx:{perf:5,coin:1,honor:-2}},lose:{r:"The guild searchers measure the bolts wet. The master is fined, and so is the youth who carried them.",fx:{perf:-8,coin:-2,honor:-2}}},{t:"Refuse, and say why",r:'{them} shrugs. "Your master asked for it last year." You never quite look at your master the same way.',fx:{honor:2,perf:-1,them:{type:"acquaint",op:-10}}},{t:"Tell the guild searchers about the fuller",check:{s:"persuasion",s2:"wil",d:40},win:{r:"The searchers catch {them} at it within the month. The guild remembers a sharp-eyed apprentice.",fx:{rep:4,honor:2,them:{type:"enemy",op:-30}}},lose:{r:"The searchers drink with {them}. Nothing happens, except that {theyHe} now knows your face.",fx:{them:{type:"enemy",op:-30}}}}]},{id:"tr_weaver_bride",opp:["weaver"],minRank:1,maxRank:2,cool:3,title:"Linen for a bride",setup:(p,ctx)=>{mk(p,ctx,"the bride's mother",{sex:"F"})},text:"{them} wants a bride's linen for her daughter by May Fair: sheets, shifts and a tablecloth with the family's sign woven into the border. The groom's mother will count every thread. {them} can pay 18 suns, and she is frightened of the groom's mother.",choices:[{t:"Weave the sign into the border, fine and true",check:{s:"craft",s2:"int",d:45},win:{r:"A border of little oak trees, crisp as a carving. The groom's mother turns the cloth over twice and finds nothing to say.",fx:{coin:18,rep:4,them:{type:"friend",op:25}}},lose:{r:"The family sign, an oak, comes out looking like a duck. The wedding guests are kind about it, mostly.",fx:{coin:10,rep:-2}}},{t:"Weave more than she asked for, at your own cost",r:"The groom's mother is silenced at the wedding. Half the brides of {home} come to you that spring.",fx:{coin:10,rep:6,honor:2,them:{type:"friend",op:40}}},{t:"Use cheaper thread for the sheets and keep the margin",r:"Nobody looks closely at sheets. You make 24 suns and a small bad feeling.",fx:{coin:24,honor:-2}}]},{id:"tr_weaver_hanging",opp:["weaver"],minRank:2,minRep:45,time:2,cool:10,title:"The hanging of the victory",setup:(p,ctx)=>{mkLord(p,ctx),ctx.subject=HANGING[p.realm]||"the battle where "+ctx.lord+"'s grandfather won the family lands",ctx.front=HANGING[p.realm]?", with "+ctx.lord+"'s own ancestor in the front rank":""},text:"{lord} wants a hanging twelve metres long for the great hall, showing {subject}{front}: horses, banners, the dead, the glory. It is two years of work for you and four journeymen, and 350 suns. The trouble is that the family remembers that day very differently from everyone else.",choices:[{t:"Weave it as the family remembers it",check:{s:"craft",s2:"etiquette",d:55},win:{r:"The ancestor is a head taller than his king and twice as brave. {lord} weeps at the unveiling and pays in full.",fx:{coin:350,rep:10,masterwork:"the great hanging of {lord}'s hall",them:{type:"friend",op:30}}},lose:{r:"{lord} pays, but complains to every guest that your horses look like dogs.",fx:{coin:200,rep:2}}},{t:"Weave it as it happened, and let the threads speak",check:{s:"craft",s2:"int",d:60},win:{r:"{lord} is furious for a week, then proud: travelers ride out of their way to see the only honest hanging in {realmShort}.",fx:{coin:250,rep:12,fame:3,honor:3,masterwork:"the true hanging of {subject}"}},lose:{r:"{lord} refuses it, and refuses to pay. It hangs in your workshop, the finest thing you ever made, unsold.",fx:{coin:-40,rep:4,honor:3,them:{type:"enemy",op:-30}}}},{t:"Promise it in one year, not two",check:{s:"stewardship",s2:"craft",d:58},win:{r:"Six looms, double shifts, and your eyes ruined for a season. Done in a year. {lord} pays a bonus for the speed.",fx:{coin:420,rep:8,skill:{stewardship:3}}},lose:{r:"It is rushed and it shows. {lord} pays less than half and hangs it in a corridor.",fx:{coin:150,rep:-6}}}]},{id:"tr_weaver_army",opp:["weaver"],minRank:1,cool:4,title:"Grey wool for the muster",setup:(p,ctx)=>{ctx.fee=70+rk(p)*40,ctx.why=war(p)?"for the war with "+foe(p):"for the garrisons"},text:"The quartermaster wants two thousand ells of grey wool {why}, for cloaks and the padding of gambesons, in two months. He will pay {fee} suns. Army wool is coarse, dull work, but the coin is good and comes all at once.",choices:[{t:"Hire every spinner in the lanes",check:{s:"stewardship",s2:"trade",d:48},win:{r:"Forty spinners, six looms and a carter. The wool goes out on the day, and the quartermaster asks for you next year.",fx:pay((p,c)=>fee(c),{rep:5,skill:{stewardship:2}})},lose:{r:"The spinners cannot keep up. Half the order goes out late.",fx:pay((p,c)=>fee(c)/2,{rep:-3})}},{t:"Weave it thin and stretch it to length",check:{s:"deception",s2:"craft",d:48},win:{r:"Thin wool, full length, full price. The quartermaster does not wear the cloaks.",fx:pay((p,c)=>fee(c)*1.3,{honor:-4})},lose:{r:"Soldiers on the border shiver in your cloth and curse your name, which is woven into the selvage.",fx:{honor:-6,rep:-8,favor:-5}}},{t:"Turn it down. Your looms are for fine cloth",r:"Fine cloth pays less and later. But it is yours.",fx:{rep:1}}]},{id:"tr_weaver_silk",opp:["weaver"],minRank:2,minRep:50,time:2,cool:8,title:"Silk for a wedding",setup:(p,ctx)=>{ctx.patron=patron(p)},text:"Silk comes from beyond the eastern edge of the world, along the Silk Road through the Tusk Clans, and costs 300 suns a bolt. {patron} has bought enough raw silk thread for a wedding mantle and wants it woven with a border of gold thread. Nobody in {home} has ever woven silk. Neither have you.",choices:[{t:"Practise on cheap thread for a month first",check:{s:"craft",s2:"wil",d:55},win:{r:"A mantle that moves like water and catches every candle. The bride's mother touches it as if it might fly away.",fx:{coin:200,rep:10,masterwork:"the silk wedding mantle of {patron}",skill:{craft:4}}},lose:{r:"Good, not great. The gold border puckers at one corner, and {patron} pays less.",fx:{coin:80,rep:-2,skill:{craft:3}}}},{t:"Start at once. Silk forgives nothing, and time forgives less",check:{s:"craft",s2:"int",d:62},win:{r:"You find the feel of it on the first day. The mantle is done early, and perfect.",fx:{coin:260,rep:12,masterwork:"the silk wedding mantle of {patron}"}},lose:{r:"A snag runs through the gold border on the last day. You pay for the thread.",fx:{coin:-50,rep:-8,wil:1}}},{t:"Keep back a little of the silk for yourself",check:{s:"stealth",s2:"deception",d:55},win:{r:"The mantle is lovely. So is the purse you sell the spare silk for, in another town.",fx:{coin:260,honor:-4}},lose:{r:"{patron}'s steward weighs the thread before and after. You pay it back, and everyone hears why.",fx:{coin:-40,rep:-12,honor:-6}}}]},{id:"tr_weaver_widow_bench",opp:["weaver"],minRank:2,cool:6,title:"The widow's looms",setup:(p,ctx)=>{mk(p,ctx,"a dead master's journeyman"),ctx.dead=nm(p,"M")},text:"Master {dead} died at Harvest Home. By guild custom his widow keeps his looms. His journeyman {them} says the master promised {themHim} the shop, and {theyHe} has friends among the wardens. The widow has three children and no friends at all. The wardens want your voice.",choices:[{t:"Speak for the widow",check:{s:"persuasion",s2:"learning",d:48},win:{r:"You read the custom aloud from the guild book. The wardens find for the widow. Her eldest brings you bread every feast day for ten years.",fx:{honor:4,rep:6,newRel:{type:"friend",op:35},them:{type:"enemy",op:-30}}},lose:{r:"The wardens vote for {them}. The widow's eldest spits at your door, as if it were your fault.",fx:{honor:2,rep:-2,them:{type:"enemy",op:-30}}}},{t:"Speak for {them}",r:"{them} gets the looms and sends you a cask of wine. The widow moves in with her sister in {town}.",fx:{coin:20,honor:-4,them:{type:"friend",op:30}}},{t:"Buy the looms yourself (80 suns)",req:p=>p.coin>=80,r:"The widow gets a fair price and the journeyman gets nothing. Your workshop gets four more looms.",fx:{coin:-80,perf:10,rep:2,them:{type:"rival",op:-20}}}]},{id:"tr_weaver_strike",opp:["weaver"],minRank:2,cool:6,title:"The spinners stop",text:p=>`The spinners and journeymen of ${homeOf(p)} have put down their spindles. ${p.realm==="POL-03"?"In the Palella towns a spinner on a wheel earns a sun and a half a day, and every spinner here knows it.":"Bread is up a third since summer and piece rates have not moved in ten years."} They want a penny more on every hank. Every master in the guild is waiting to see what you do.`,choices:[{t:"Pay the penny",r:"Your looms run all winter while the other masters stand idle and curse you.",fx:{coin:-20,perf:6,rep:3,honor:3,newRel:{type:"friend",op:25}}},{t:"Hire country spinners and break the strike",check:{s:"intimidation",s2:"stewardship",d:52},win:{r:"Carts of village yarn roll in under guard. The strike breaks in a month. Nobody in the lanes says good morning to you after that.",fx:{coin:20,rep:2,honor:-5,newRel:{type:"enemy",op:-35}}},lose:{r:"Your carts of country yarn are tipped into the river at the bridge.",fx:{coin:-25,rep:-4,newRel:{type:"enemy",op:-35}}}},{t:"Get masters and spinners into one room",check:{s:"diplomacy",s2:"persuasion",d:55},win:{r:"Half a penny now, half at Harvest Home, and a promise in the guild book. Both sides grumble, which means it is fair.",fx:{rep:8,fame:1,honor:3,skill:{diplomacy:2}}},lose:{r:"The meeting ends with a thrown stool. The strike drags on into winter.",fx:{rep:-3,coin:-10}}}]},{id:"tr_weaver_putting_out",opp:["weaver"],minRank:1,maxRank:2,cool:5,title:"Wool from the villages",setup:(p,ctx)=>{mk(p,ctx,"a cloth merchant")},text:"{them}, a cloth merchant, offers you steady work outside the guild. {They} puts out wool to spinners in the villages, where no guild can reach, and wants you to weave the yarn at night in your back room. Twice the work, and the guild never sees a thread of it.",choices:[{t:"Take the work",check:{s:"stealth",s2:"trade",d:45},win:{r:"A winter of night looms and quiet carts. Thirty suns, and nobody the wiser.",fx:{coin:30,skill:{trade:2},honor:-2,them:{type:"friend",op:20}}},lose:{r:"The guild searchers find twenty bolts of unsealed cloth in your back room.",fx:{coin:-20,rep:-8,perf:-5}}},{t:"Take the offer to the guild wardens",r:"The wardens thank you. {them} does not.",fx:{rep:5,honor:2,them:{type:"enemy",op:-30}}},{t:"Refuse quietly",r:"Somebody else will take it. The guild will not last forever, and you know it.",fx:{}}]},{id:"tr_weaver_banner",opp:["weaver"],minRank:3,minRep:60,time:2,cool:15,title:"The banner of the realm",cond:(p,C)=>!C.flag(p,"tr_weaver_banner"),text:"The great banner of {realmShort}, carried at every crowning and every war since your grandmother's day, is in rags. The court wants a new one woven, by the best hand in the realm. That hand, they say, is yours. They offer 500 suns.",choices:[{t:"Weave it yourself, every thread",check:{s:"craft",s2:"wil",d:62},win:{r:"A year with your eyes an inch from the cloth. When it is raised over {capital}, a crowd that cannot read knows exactly what it means.",fx:{coin:500,rep:15,fame:3,favor:10,masterwork:"the great banner of {realmShort}",flag:"tr_weaver_banner"}},lose:{r:"It is fine work, and it is not the banner of anyone's dreams. The court pays, politely.",fx:{coin:250,rep:4,flag:"tr_weaver_banner"}}},{t:"Weave it with the whole workshop, and share the credit",check:{s:"craft",s2:"command",d:52},win:{r:"Twelve weavers, one design, no mistakes. Every one of them will tell their grandchildren they wove the banner.",fx:{coin:400,rep:12,masterwork:"the great banner of {realmShort}",flag:"tr_weaver_banner",newRel:{type:"friend",op:30}}},lose:{r:"Too many hands. The colors do not quite match from one side to the other.",fx:{coin:200,rep:2,flag:"tr_weaver_banner"}}},{t:"Weave threads of the old banner into the new",check:{s:"craft",s2:"faith",d:55},win:{r:"The old soldiers who see it say they can feel the old wars in it. The court is moved. So, a little, are you.",fx:{coin:500,rep:14,piety:3,favor:12,masterwork:"the great banner of {realmShort}, rewoven from the old",flag:"tr_weaver_banner"}},lose:{r:"The old threads are rotten and pull loose. You have to start again, and the court notices the delay.",fx:{coin:250,rep:3,flag:"tr_weaver_banner"}}}]}]));
    A.defEvents([
      {
        id: "tr_weaver_d_bee",
        cond: (p,C)=>C.adult(p)&&J(p,"weaver"),
        cool: 5,
        title: "The spinning bee",
        setup: (p,ctx)=>{const l=A.makeLoveInterest(p);ctx.pid=l.id,ctx.Their=A.cap(A.his(l))},
        text: "Winter evenings, and the spinners and weavers of the lane bring their wool to the biggest kitchen to work by one fire and save candles. The talk is better than the light. Tonight {them} keeps glancing at you over the distaff.",
        choices: [
          {
            t: "Sit beside {themHim}",
            req: (p,C)=>!C.married(p),
            check: {s:"persuasion",s2:"wil",d:40},
            win: {
              r: "You talk until the fire dies and walk {themHim} home through the snow.",
              fx: {happy:6,them:{type:"lover",op:40}},
            },
            lose: {
              r: "You tangle {theirHis} yarn, then your own. Everyone laughs, including {them}, kindly.",
              fx: {happy:2,them:{type:"friend",op:15}},
            },
          },
          {
            t: "Tell the old stories and keep the room laughing",
            r: "Your tale of the miller and the bishop's cat goes round the lane for a month.",
            fx: {happy:4,skill:{persuasion:1},them:{type:"friend",op:10}},
          },
          {
            t: "Spin, listen, and learn who owes whom",
            r: "By spring you know which master is in debt, whose son is courting whom, and who is about to sell their looms.",
            fx: {skill:{intrigue:2},rep:1},
          },
        ],
      },
      {
        id: "tr_weaver_d_searchers",
        cond: (p,C)=>C.adult(p)&&J(p,"weaver")&&rk(p)>=1,
        title: "The searchers",
        text: "The guild's searchers come down the lane with their ell-rods and lead seals. Every bolt that passes gets the guild's seal. Every bolt that fails is cut in half in the street for all to see. Your best bolt this month has a thin place in the weft, near the middle.",
        choices: [
          {
            t: "Show it honestly",
            r: "They cut it. It hurts. The searchers note in their book that you showed them the flaw yourself.",
            fx: {coin:-6,honor:2,rep:1},
          },
          {
            t: "Fold it so the thin place is on the inside",
            check: {s:"deception",s2:"craft",d:48},
            win: {r:"Lead seal, full price. You sleep a little worse.",fx:{coin:8,honor:-1}},
            lose: {
              r: "The old searcher unfolds every bolt, as he has for thirty years. Cut, and fined.",
              fx: {coin:-10,rep:-4},
            },
          },
          {
            t: "Offer the searcher a drink first",
            check: {s:"persuasion",s2:"etiquette",d:42},
            win: {
              r: "He drinks, chats, and seals without looking. Everyone does it. That is what you tell yourself.",
              fx: {coin:7,honor:-1},
            },
            lose: {r:"He is new, keen, and offended. Cut, fined, and written up for bribery.",fx:{coin:-12,rep:-5}},
          },
        ],
      },
    ]);
    const bowBuyer = p=>p.realm==="POL-05"?"The Master of the King's Bowmen":p.realm==="POL-13"?"The Captain-General of the League":"The quartermaster of the "+rs(p)+" muster",
      bowWord = p=>p.realm==="POL-05"?"yew longbows":A.C.terr(p,"steppe")?"horn bows":"war bows";
    A.defEvents(O([{id:"tr_bow_fletch",opp:["bowyer"],maxRank:1,cool:3,title:"A thousand arrows",text:"The master sets you to fletch a thousand arrows for the butts at {town}: grey goose feathers, glued and bound. The feather-seller has run out of goose. A boy at the door offers a sack of crow and chicken feathers for half the price.",choices:[{t:"Walk to the next villages for goose feathers",r:"Two days of walking and haggling with goose-girls. The arrows fly true and the master grunts.",fx:{perf:3,sta:.4,skill:{craft:2}}},{t:"Use the chicken feathers",check:{s:"deception",s2:"craft",d:38},win:{r:"They fly well enough at the butts. You pocket the difference.",fx:{coin:2,honor:-1}},lose:{r:"The arrows fly like drunk bees. The master hears the archers laughing from the street.",fx:{rep:-3,perf:-5}}},{t:"Trim and bind every feather perfectly, fast",check:{s:"craft",s2:"spd",d:38},win:{r:"A thousand arrows by Sunday, every one straight. The master gives you three suns, which he has never done before.",fx:{coin:3,skill:{craft:3},perf:4}},lose:{r:"Fast, yes. Perfect, no. Two hundred have to be redone.",fx:{perf:-2,skill:{craft:1}}}}]},{id:"tr_bow_butts",opp:["bowyer"],maxRank:2,cool:3,title:"Sunday at the butts",text:p=>p.realm==="POL-05"?"Under the Butts Law every Ashmere boy over seven shoots at the village butts on Sunday, and every boy needs a bow. Twenty of them crowd the workshop door with a penny each and their fathers behind them.":"The lord has ordered archery at the butts after the holy day for every man under forty, and every man needs a bow by Sunday. Twenty of them crowd the workshop door, holding out coppers.",choices:[{t:"Fit each bow to the shooter's arm",check:{s:"craft",s2:"int",d:36},win:{r:"A light stave for the thin boy, a heavier one for the smith's son. By the next Sunday they are hitting the mark, and their fathers know whose bows they are.",fx:{coin:5,rep:4,skill:{craft:2}}},lose:{r:"Two bows break on the first Sunday. Two fathers come to see you on Monday.",fx:{coin:3,rep:-2}}},{t:"Sell them anything that bends",r:"Coin today. Complaints tomorrow.",fx:{coin:8,rep:-3,honor:-1}},{t:"Give the poorest boy a bow for nothing",r:"He stares at it as if it were gold. Years later a famous archer tells people where he got his first bow.",fx:{coin:3,honor:3,rep:2,newRel:{type:"friend",op:25}}}]},{id:"tr_bow_war",opp:["bowyer"],minRank:1,minRep:30,time:2,cool:4,title:"Bows for the muster",setup:(p,ctx)=>{ctx.buyer=bowBuyer(p),ctx.bows=bowWord(p),ctx.fee=80+rk(p)*50,ctx.why=war(p)?"for the war with "+foe(p):"to fill the armories"},text:"{buyer} wants five hundred {bows} and twenty thousand arrows {why}, before the grass comes. The fee is {fee} suns. Your rack holds a hundred seasoned staves. The rest must be cut, dried, shaped and strung, and drying takes time nobody has.",choices:[{t:"Use green staves and dry them over slow fires",check:{s:"craft",s2:"int",d:55},win:{r:"A smoky month and every stave watched like a sick child. They hold. The muster marches with your bows.",fx:pay((p,c)=>fee(c),{rep:8,skill:{craft:3}})},lose:{r:"Half of them crack in the first frost of the march. The complaints come back faster than the bows went out.",fx:pay((p,c)=>fee(c)/3,{rep:-6})}},{t:"Buy staves from every bowyer in the realm",check:{s:"trade",s2:"stewardship",d:50},win:{r:"Staves come in by every road. You finish on time and keep the biggest share.",fx:pay((p,c)=>fee(c)*.7,{rep:6,skill:{trade:2}})},lose:{r:"Everyone else is selling to the muster too. You buy late and dear.",fx:pay((p,c)=>fee(c)/4,{rep:1})}},{t:"Deliver only what you can make well",r:"A hundred and twenty good bows. The muster grumbles, and then the men who carry them stop grumbling.",fx:pay((p,c)=>fee(c)/3,{rep:3,honor:2})}]},{id:"tr_bow_horn",opp:["bowyer"],minRank:2,cool:6,title:"The horn bow",setup:(p,ctx)=>{mk(p,ctx,"a rider of the steppe")},text:"{themFull}, a rider from the steppe, lays a short bow on your bench: horn on the belly, sinew on the back, wood between, glued and lacquered, and cracked at one tip. {They} can shoot it from the saddle faster than any longbow. {They} wants it mended in ten days. You have never seen one opened.",choices:[{t:"Open it up and learn how it is made",check:{s:"craft",s2:"int",d:58},win:{r:"Horn to push, sinew to pull, glue boiled from fish bladders. You mend it, and you understand it. {They} pays and shakes your forearm like a brother.",fx:{coin:15,rep:6,skill:{craft:6,bow:2},them:{type:"friend",op:30}}},lose:{r:"You open it and it never closes right again. {They} takes the pieces and your apology, and not much else.",fx:{coin:-15,wil:1,them:{type:"enemy",op:-20}}}},{t:"Ask {themHim} to teach you, in return for the work",check:{s:"diplomacy",s2:"etiquette",d:48},win:{r:"{They} stays a month, drinks your ale and shows you everything, laughing at your clumsy hands.",fx:{skill:{craft:5},them:{type:"mentor",op:35}}},lose:{r:'{They} laughs. "The secret of the horn bow is fifty years and a grandmother."',fx:{happy:-1}}},{t:"Refuse. You do not touch what you do not know",r:"{They} rides on to {town}. You wonder about that bow for years.",fx:{rep:1}}]},{id:"tr_bow_crossbow",opp:["bowyer"],minRank:1,cool:8,title:"The crossbow-maker",cond:(p,C)=>!C.flag(p,"tr_bow_xbow"),setup:(p,ctx)=>{mk(p,ctx,"a crossbow-maker's journeyman"),ctx.lead=p.realm==="POL-13"?"The Crossbow-Makers of Roseham guard their trade like a vault.":"Every army now hires crossbowmen at 35 suns a month, and every crossbow needs a maker."},text:"{lead} {them}, a crossbow-maker's journeyman down on {theirHis} luck, offers to teach you the trade: the stock, the nut, the trigger and the steel bow, for 25 suns and a bed. The bowyers' guild says a bowyer who makes crossbows is no bowyer at all.",choices:[{t:"Learn it (25 suns)",req:p=>p.coin>=25,check:{s:"craft",s2:"int",d:48},win:{r:"A winter of springs and triggers. By spring you can make a crossbow that would pass in any armory.",fx:{coin:-25,skill:{craft:4,xbow:3},flag:"tr_bow_xbow",rep:2,them:{type:"friend",op:25}}},lose:{r:"The trigger mechanism defeats you. You learn enough to repair one, no more.",fx:{coin:-25,skill:{craft:2,xbow:1}}}},{t:"Learn it by night, where the guild cannot see",check:{s:"stealth",s2:"craft",d:50},win:{r:"Shutters closed, candles hidden, a new trade learned. Soldiers start coming to your back door.",fx:{skill:{craft:3,xbow:3},flag:"tr_bow_xbow",coin:15}},lose:{r:"A warden smells the oil and sees the light. You are fined, and {them} is run out of town.",fx:{coin:-15,rep:-5,them:{type:"friend",op:10}}}},{t:"Report {themHim} to the guild",r:"The wardens thank you. {them} walks on to the next town with {theirHis} tools on {theirHis} back.",fx:{rep:3,them:{type:"enemy",op:-20}}}]},{id:"tr_bow_staves",opp:["bowyer"],minRank:2,time:2,cool:6,title:"To the Strangers' Shelf",text:"The best bow yew grows in Eldergrove, marked and counted by the Grove Keepers under the Yew Compact. Each spring the Keepers sell marked staves to human bowyers at Silverbough, on the Strangers' Shelf, and the best staves go to whoever the elves like. You could go yourself this year.",choices:[{t:"Go, and choose every stave by eye",check:{s:"craft",s2:"etiquette",d:52,bonus:p=>["elf","halfelf"].includes(p.race)?12:0},win:{r:"Ten days of elven courtesy and long silences. You come home with the straightest yew in {home}, and an elf who nods to you.",fx:{coin:-30,perf:15,rep:6,skill:{craft:3}}},lose:{r:"You offend a Keeper by knocking on a stave with your knuckle, as you would at home. You get what is left.",fx:{coin:-30,perf:3,happy:-3}}},{t:"Send a factor with your coin",r:"The factor brings back decent staves and a long bill.",fx:{coin:-30,perf:6}},{t:"Buy local wood and save the journey",r:"Elm and ash. Honest bows, but you can feel the difference in the draw.",fx:{coin:10,perf:-2}}]},{id:"tr_bow_champion",opp:["bowyer"],minRank:2,minRep:45,cool:5,title:"A bow for the great shoot",setup:(p,ctx)=>{mk(p,ctx,"a famous archer"),ctx.shoot="the great shoot at "+fest()},text:"{themFull}, the best archer in three counties, wants a bow for {shoot}. If {theyHe} wins with it, every archer in {realmShort} will want your mark. If {theyHe} loses, {theyHe} will say it was the bow.",choices:[{t:"A heavy bow. Distance wins shoots",check:{s:"craft",s2:"str",d:55},win:{r:"{They} wins by a hand's breadth at three hundred paces, and holds your bow over {theirHis} head for the crowd.",fx:{coin:40,rep:12,fame:2,masterwork:"the bow that won {shoot}",them:{type:"friend",op:30}}},lose:{r:"Too heavy for {themHim} by the tenth shot. {They} comes third and blames the bow, loudly.",fx:{coin:20,rep:-6,them:{type:"rival",op:-20}}}},{t:"Measure {themHim} and build to {theirHis} draw",check:{s:"craft",s2:"int",d:52},win:{r:"A bow that fits like a glove. {They} wins, and tells everyone it was made for {themHim} alone.",fx:{coin:30,rep:10,fame:1,them:{type:"friend",op:35}}},lose:{r:"It fits perfectly and shoots a little low. {They} comes second.",fx:{coin:20,rep:-2}}},{t:"Sell {themHim} the best bow on your rack",r:"A good bow, not a great one. {They} comes fourth and buys you a drink anyway.",fx:{coin:25,rep:2}}]},{id:"tr_bow_poacher",opp:["bowyer"],maxRank:2,cool:5,title:"A short, quiet bow",setup:(p,ctx)=>{mk(p,ctx,"a quiet man from the forest edge")},text:"{them} wants a short bow that comes apart in two pieces to hide under a coat, and pays in fresh venison and silver. Everyone knows what such a bow is for. The forest is the lord's, and the lord hangs poachers.",choices:[{t:"Make it, and ask nothing",check:{s:"stealth",s2:"deception",d:42},win:{r:"A clever little bow with a brass sleeve at the grip. Twelve suns, a haunch of venison and a friend in the forest.",fx:{coin:12,honor:-2,skill:{craft:2},them:{type:"friend",op:25}}},lose:{r:"{them} is taken by the lord's foresters with your bow in pieces under {theirHis} coat. They come asking who made it.",fx:{coin:-15,rep:-5,honor:-2,them:{type:"friend",op:10}}}},{t:"Refuse",r:"{They} nods and leaves without a word. The venison would have been nice.",fx:{}},{t:"Tell the lord's forester",r:"The forester gives you a penny and a nod. {them} is not seen in {home} again.",fx:{coin:1,rep:2,honor:1,them:{type:"enemy",op:-40}}}]},{id:"tr_bow_proof",opp:["bowyer"],minRank:3,cool:6,title:"The proof of the bows",setup:(p,ctx)=>{mk(p,ctx,"your old master")},text:"Every spring the guild proves the bows: each master's work drawn to the ear and held, and any bow that cracks is broken over the warden's knee. This spring it is {them}'s bows that crack. {them} taught you everything. {They} is old, {theirHis} eyes are going, and the guild mark is all {theyHe} has left.",choices:[{t:"Break them, as the law says",r:"The guild trusts your mark more than ever. {them} does not come to the feast, or ever speak to you again.",fx:{rep:6,honor:2,them:{type:"mentor",op:-40}}},{t:"Pass them, and remake {theirHis} bows yourself at night",check:{s:"stealth",s2:"craft",d:45},win:{r:"Every bow in {theirHis} rack is quietly yours now. {They} never knows, or never says.",fx:{honor:-1,wil:.5,them:{type:"mentor",op:40}}},lose:{r:"A warden sees the light in {theirHis} workshop and finds you there. You are both shamed.",fx:{rep:-10,honor:-2,them:{type:"mentor",op:20}}}},{t:"Persuade {themHim} to lay down {theirHis} tools with honor",check:{s:"diplomacy",s2:"etiquette",d:48},win:{r:"The guild gives {them} a feast, a pension and the old men's bench by the fire. {They} cries, and thanks you.",fx:{rep:4,honor:3,them:{type:"mentor",op:20}}},lose:{r:'"Retire? I will be buried with a stave in my hand." {They} storms out.',fx:{them:{type:"mentor",op:-20}}}}]},{id:"tr_bow_royal",opp:["bowyer"],minRank:3,minRep:60,time:2,cool:15,title:"A gift for a king",cond:(p,C)=>!C.flag(p,"tr_bow_royal"),setup:(p,ctx)=>{ctx.bows=bowWord(p)},text:"{ruler} means to send a foreign king a gift worth remembering, and the court has decided it will be a bow from {realmShort}: the finest ever made here, in a case of carved wood. They want it from your workshop. 400 suns, and your mark under the grip.",choices:[{t:"Choose the stave of a lifetime and work it yourself",check:{s:"craft",s2:"wil",d:62},win:{r:"A year of patience. When the foreign king draws it, his own bowyers ask who made it. Your name goes across a border.",fx:{coin:400,rep:15,fame:3,favor:10,masterwork:"the king's gift bow of {realmShort}",flag:"tr_bow_royal",epithet:"Yewhand"}},lose:{r:"A fine bow. Not the bow of a lifetime. Nobody at court can tell. You can.",fx:{coin:300,rep:4,flag:"tr_bow_royal"}}},{t:"Inlay it with horn and silver, for a king's eye",check:{s:"craft",s2:"etiquette",d:52},win:{r:"It dazzles. The foreign king hangs it on a wall and never draws it. Your fee is paid in full.",fx:{coin:450,rep:8,favor:6,flag:"tr_bow_royal"}},lose:{r:"The silver lifts in the damp of the long journey. An envoy brings back polite words.",fx:{coin:200,rep:-4,favor:-4,flag:"tr_bow_royal"}}},{t:"Make a pair, one for each king",check:{s:"craft",s2:"diplomacy",d:58},win:{r:"Two bows from one stave, split down the heart. The two kings are delighted by the idea. So is the court.",fx:{coin:500,rep:12,favor:12,masterwork:"the twin bows of the two kings",flag:"tr_bow_royal"}},lose:{r:"The stave splits wrong. One good bow, one firewood.",fx:{coin:250,rep:2,flag:"tr_bow_royal"}}}]}]));
    A.defEvents([
      {
        id: "tr_bow_d_snap",
        cond: (p,C)=>C.adult(p)&&J(p,"bowyer"),
        title: "The snapped bow",
        setup: (p,ctx)=>{mk(p,ctx,"an archer")},
        text: "{them} limps into your workshop with a cut across the cheek and two halves of a bow you sold {themHim} last year. It snapped at full draw at the butts. {They} wants a new one, and {theirHis} surgeon's fee, and an apology in front of the street.",
        choices: [
          {
            t: "Give {themHim} a new bow, and the apology",
            r: "The street watches you say sorry. It costs you pride and a good stave, and earns you something harder to buy.",
            fx: {coin:-4,honor:3,rep:2,them:{type:"friend",op:20}},
          },
          {
            t: "Show {themHim} where {theyHe} overdrew it",
            check: {s:"persuasion",s2:"craft",d:48},
            win: {
              r: "You point to the crushed fibres on the belly: drawn far past its mark. {They} goes red and leaves without the fee.",
              fx: {rep:1},
            },
            lose: {
              r: "Nobody in the street believes the bowyer over the bleeding man.",
              fx: {rep:-4,them:{type:"enemy",op:-25}},
            },
          },
          {
            t: "Pay the surgeon and say nothing",
            r: "Two suns to the barber-surgeon. {They} grumbles, and goes elsewhere for bows.",
            fx: {coin:-2,rep:-1},
          },
        ],
      },
      {
        id: "tr_bow_d_last_bow",
        cond: (p,C)=>C.adult(p)&&J(p,"bowyer")&&rk(p)>=1,
        cool: 10,
        title: "An old archer's last bow",
        setup: (p,ctx)=>{mk(p,ctx,"an old archer")},
        text: "Old {them} has bought arrows from your workshop since before you were born. {Their} shoulders are gone now, and {theyHe} cannot draw a war bow. {They} wants something light enough to take {theirHis} grandchild hunting before winter.",
        choices: [
          {
            t: "Make it, and refuse payment",
            r: "A light, sweet little bow. {They} comes back with a brace of rabbits and the grandchild, both grinning.",
            fx: {honor:3,happy:5,them:{type:"friend",op:40}},
          },
          {
            t: "Make it, and teach the grandchild to shoot",
            r: "A whole autumn of Sundays. The child has a good eye. You have a new friend, and so does the trade.",
            fx: {happy:4,skill:{bow:2},them:{type:"friend",op:35},newRel:{type:"student",op:30}},
          },
          {t:"Make it for the usual price",r:"{They} pays without a word. It is a good bow.",fx:{coin:2}},
        ],
      },
    ]);
    A.defEvents(O([{id:"tr_carp_sawpit",opp:["carpenter"],maxRank:1,cool:3,title:"The sawpit",setup:(p,ctx)=>{mk(p,ctx,"the top-sawyer")},text:"You are the pit-man: down in the sawpit under the log, pulling the long saw from below while sawdust rains into your eyes. The top-sawyer, {them}, has been drinking since noon, and the saw is wandering off the chalk line. A beam cut crooked is a beam wasted.",choices:[{t:"Shout up, and steer the cut from below",check:{s:"craft",s2:"wil",d:36},win:{r:"You fight the blade back onto the line stroke by stroke. The beam comes out true, and {them} claims the credit.",fx:{perf:4,skill:{craft:3},them:{type:"acquaint",op:5}}},lose:{r:"{them} lets go of the handle to argue. It comes down on your head.",fx:{health:-5,cause:"a saw handle",perf:-2}}},{t:"Climb out and take the top yourself",check:{s:"persuasion",s2:"str",d:40},win:{r:"Top-sawyer for an afternoon, with the line in your eye and the master watching. You do not get sent back down.",fx:{perf:6,skill:{craft:3},rep:2}},lose:{r:"{them} does not like being told. Now you have a rival with a saw.",fx:{them:{type:"rival",op:-20}}}},{t:"Keep pulling and say nothing",r:"The beam comes out like a dog's leg. The master blames the pit-man, as masters do.",fx:{perf:-3,wil:.5}}]},{id:"tr_carp_coffins",opp:["carpenter"],maxRank:1,cool:6,title:"Coffins",text:"Fever in the lanes again. The priests cannot bury them fast enough, and every family that can afford it wants a coffin, not a shroud. The master says sickness is good for the trade and has doubled his price. Wood is wood, he says.",choices:[{t:"Work every hour, and charge the old price for yours",r:"Your coffins cost half the master's. People remember who was fair in a bad year.",fx:{coin:6,honor:4,rep:4,sta:.5,health:-3,cause:"fever"}},{t:"Work every hour at the master's price",r:"Twelve suns of other people's grief in your purse.",fx:{coin:12,honor:-2,health:-3,cause:"fever"}},{t:"Make coffins for the poorest at cost, at night",r:"Plain boxes of pine for those who cannot pay. A priest blesses your door.",fx:{coin:1,honor:6,rep:5,piety:2,health:-4,cause:"fever"}}]},{id:"tr_carp_galley",opp:["carpenter"],minRank:1,minRep:30,time:2,cool:5,title:"A galley in twenty days",setup:(p,ctx)=>{ctx.boast=p.realm==="POL-04"?"The Arsenal of Lucerna boasts it can build a war galley in twenty days, and today it has been asked to prove it.":"In Lucerna, they say, the Arsenal can build a war galley in twenty days. The royal yards of "+rs(p)+" have been ordered to do the same.",ctx.fee=30+rk(p)*20},text:"{boast} Every carpenter on the slips from dawn bell to dusk bell, at double pay, and a bonus of {fee} suns for every man if the hull is wet on the twentieth day.",choices:[{t:"Work the frames with the best gang",check:{s:"craft",s2:"sta",d:50},win:{r:"Twenty days of oak, pitch and shouting. She slides into the water on the morning of the twentieth, and you are paid like a lord.",fx:pay((p,c)=>fee(c),{rep:6,sta:.5})},lose:{r:"A frame slips while you are under it. You spend the twentieth day in bed.",fx:pay((p,c)=>fee(c)/2,{health:-8,cause:"a slipping frame"})}},{t:"Organize the gangs so nobody waits for anybody",check:{s:"stewardship",s2:"command",d:55},win:{r:"You chalk the order of work on a plank and make the gang-masters follow it. The yard has never moved so fast. The master of the yard learns your name.",fx:(p,ctx)=>(p.coin+=Math.round(fee(ctx)*1.3),andUp({rep:10,skill:{stewardship:3}},[1],"The master of the yard gives you a slip of your own.")(p,ctx))},lose:{r:"Three gang-masters ignore your plank. The yard is a mess and someone has to be blamed.",fx:pay((p,c)=>fee(c)/3,{rep:-3})}},{t:"Cut corners where the inspectors will not look",check:{s:"deception",s2:"craft",d:45},win:{r:"Short trenails and thin caulking below the waterline. She floats on the twentieth day. What happens after is the navy's business.",fx:pay((p,c)=>fee(c),{honor:-3})},lose:{r:"She leaks on her first day. The inspectors find your mark on the worst seam.",fx:{rep:-8,honor:-3}}}]},{id:"tr_carp_cog",opp:["carpenter"],minRank:2,minRep:45,time:2,cool:8,title:"A keel for a cog",setup:(p,ctx)=>{mk(p,ctx,"a merchant"),ctx.ship="the "+A.pick(["Grey Goose","Fair Wind","Second Chance","Merry Widow","Salt Daughter","Long Purse","Good Hope"]),ctx.fee=360+rk(p)*40},text:"{themFull} wants a cog of a hundred tonnes, to be called {ship}: twelve thousand suns of ship when she is rigged, and {fee} suns for you as master. Seasoned oak from Greyhaven costs half again what local oak costs. Local oak is green, and green oak works on the sea like a bad tooth.",choices:[{t:"Seasoned oak, and no shortcuts",check:{s:"craft",s2:"int",d:55},win:{r:"She takes eighteen months and comes off the slip as sweet as a cradle. {them} sails her to Lucerna and back without a pump stroke.",fx:pay((p,c)=>fee(c),{rep:12,masterwork:"the cog {ship}",them:{type:"friend",op:30}})},lose:{r:"The Greyhaven oak is late, then the stem is wrong. She launches half a year behind.",fx:pay((p,c)=>fee(c)*.6,{rep:3})}},{t:"Local oak, and a faster launch",r:"Built in a year. {them} is thrilled. The timber is still weeping sap when she sails.",fx:pay((p,c)=>fee(c)+100,{rep:4,flag:"tr_carp_green_oak"})},{t:"Build her lighter and faster than any cog in the harbor",check:{s:"craft",s2:"sea",d:60},win:{r:"Finer lines, a deeper keel. She outsails every cog on the coast, and captains come to your yard with their purses open.",fx:pay((p,c)=>fee(c),{rep:15,fame:2,masterwork:"the swift cog {ship}"})},lose:{r:"Too fine. She rolls like a drunk in any sea, and the crew call her the Cradle.",fx:pay((p,c)=>fee(c)*.5,{rep:-6})}}]},{id:"tr_carp_tower",opp:["carpenter"],minRank:1,minRep:25,cool:5,title:"The tower",setup:(p,ctx)=>{ctx.foe=war(p)?"a town of "+foe(p):"a rebel lord's town"},text:"The {realmShort} army sits before the walls of {foe}, and the engineers want a siege tower three storeys high, with wet hides hung against fire. Carpenters are paid soldier's wages, 25 suns a month, and they work inside bowshot.",choices:[{t:"Build it in the open, fast",check:{s:"craft",s2:"wil",d:52},win:{r:"Three days of hammering while arrows thud into the hides. The tower rolls on the fourth morning. You are paid, and alive.",fx:{coin:25,rep:6,wil:1}},lose:{r:"An arrow finds the gap between two hides, and you.",fx:{coin:15,health:-14,cause:"an arrow",wound:"arrow_wound",wil:1}}},{t:"Build it in pieces behind the hill; roll it up by night",check:{s:"craft",s2:"siegecraft",d:55},win:{r:"The defenders wake to a tower against their wall. The engineers ask your name and write it down.",fx:{coin:30,rep:10,skill:{siegecraft:3}}},lose:{r:"The pieces do not quite fit in the dark. It goes up crooked and late, but it goes up.",fx:{coin:20,rep:-2}}},{t:"Refuse to work under the arrows",r:"The captain calls you a coward and sends you to dig latrines for the same wage.",fx:{coin:10,rep:-4,honor:-2}}]},{id:"tr_carp_wreck",opp:["carpenter"],maxRank:2,cool:6,title:"The wreck at the point",setup:(p,ctx)=>{ctx.law=p.realm==="POL-08"?"In Northreach men still strip stranded ships, and the village is already running down with axes.":p.realm==="POL-14"?"Greyhaven hangs wreckers, but the oak on that beach is worth a year of wages.":"The lord claims every wreck on his shore."},text:"A cog has gone onto the rocks below {home} in the night. {law} Her planking and her cargo lie in the surf. Somebody on board is still shouting.",choices:[{t:"Get the people off first",check:{s:"sea",s2:"str",d:48},win:{r:"A rope, a plank and a wave you will remember all your life. Four sailors come ashore alive because of you.",fx:{honor:5,fame:2,newRel:{type:"friend",op:40}}},lose:{r:"The sea throws you back onto the rocks twice. You save one man and nearly lose yourself.",fx:{honor:4,health:-12,cause:"the surf",wound:"broken_ribs"}}},{t:"Salvage the timber for the lord, for a share",r:"You strip her frames and planking for the lord's steward, who gives you a tenth. Good seasoned oak, too.",fx:{coin:10,rep:2,skill:{craft:1}}},{t:"Strip her yourself before the steward arrives",check:{s:"stealth",s2:"str",d:48},win:{r:"A cartload of copper fittings and oak knees, hidden under hay by dawn.",fx:{coin:30,honor:-3}},lose:{r:"The steward's men arrive while you are still on the beach with an axe.",fx:{punish:"theft"}}}]},{id:"tr_carp_chest",opp:["carpenter"],minRank:1,maxRank:2,cool:3,title:"A wedding chest",setup:(p,ctx)=>{ctx.lead=p.realm==="POL-03"?"In Varenna every bride brings a painted wedding chest to her new house.":"A bride of good family needs a wedding chest."},text:"{lead} A cloth merchant wants one for his daughter: carved front, iron corners, a good lock, and a lid wide enough for a painter to show the family's story. Twenty-five suns, by May Fair.",choices:[{t:"Carve the front as finely as you can",check:{s:"craft",s2:"int",d:45},win:{r:"Vines, birds and the bride's initials hidden in the leaves. Every merchant in the street wants one for his own daughter.",fx:{coin:25,rep:5,skill:{craft:2}}},lose:{r:"The walnut splits along one vine. You patch it well, but you know it is there.",fx:{coin:18,rep:1}}},{t:"Bring in a painter friend for the lid and share the fee",r:"Your carving, a friend's brush. The chest is talked about at the wedding, and so are you both.",fx:{coin:15,rep:6,newRel:{type:"friend",op:30}}},{t:"Make it of pine and stain it like walnut",check:{s:"deception",s2:"craft",d:48},win:{r:"It looks like walnut. It weighs like pine. Nobody lifts a wedding chest before the wedding.",fx:{coin:32,honor:-2}},lose:{r:"The merchant knocks on the lid, listens, and asks for his money back in front of your apprentices.",fx:{rep:-5,honor:-2}}}]},{id:"tr_carp_hall",opp:["carpenter"],minRank:2,minRep:45,time:2,cool:10,title:"The long hall",setup:(p,ctx)=>{ctx.lord=patron(p),ctx.size=grp(p)==="giant"?"sixty metres of timber, doors five metres high and fire-pits the size of a human room":"forty metres of oak, with a roof that spans the whole width without a single post in the middle"},text:"{lord} wants a great hall: {size}. It is the largest roof anyone in {realmShort} has tried in a generation. If it stands, every hall-builder for a hundred years will copy it. If it falls, it falls on a feast.",choices:[{t:"Hang the roof on great braced beams, a new way",check:{s:"craft",s2:"int",d:60},win:{r:"Beams braced on beams, the weight carried out to the walls like water down a hill. The first feast under it goes on for three days.",fx:{coin:300,rep:14,fame:2,masterwork:"the great hall of {lord}"}},lose:{r:"The roof sags a hand's breadth in its first winter. Two ugly posts go in down the middle, and your name with them.",fx:{coin:150,rep:-6,wil:1}}},{t:"Build it the old way, with two rows of posts",r:"A fine hall with a forest of posts down the middle. Safe, warm, and quickly forgotten.",fx:{coin:220,rep:5}},{t:"Ask for a year to build a model first",check:{s:"persuasion",s2:"craft",d:52},win:{r:"A model the size of a cart, loaded with sacks of sand until it creaks. {lord} watches every test. When the real roof goes up, nobody is afraid.",fx:{coin:260,rep:10,skill:{craft:3},masterwork:"the great hall of {lord}"}},lose:{r:'"A year? For a toy?" {lord} gives the work to a builder in a hurry.',fx:{rep:-2}}}]},{id:"tr_carp_launch",opp:["carpenter"],minRank:2,cool:5,title:"She will not move",setup:(p,ctx)=>{ctx.Elders=A.cap(elders(p))},text:"The ship on your slip is finished. Half of {home} has come to see her launched. {Elders} are there to bless her, and the owner has brought his whole family in their best clothes. The last shores are knocked away. She does not move.",choices:[{t:"Grease the ways and put every man to the ropes",check:{s:"command",s2:"str",d:50},win:{r:"Forty men, one chant, one heave, and she slides into the water with a roar from the crowd that you will hear in your sleep.",fx:{rep:6,fame:1,skill:{command:2}}},lose:{r:"She moves a foot, sticks again and lists. The crowd goes home. You launch her at midnight, with nobody watching.",fx:{rep:-4,happy:-4}}},{t:"Wait for the evening tide to lift her",check:{s:"int",s2:"sea",d:45},win:{r:"You tell the crowd to eat and drink. At dusk the tide lifts her stern and she slides off like a seal. The owner thinks you planned it.",fx:{rep:7,happy:3}},lose:{r:"The tide is too low. The crowd drinks the owner's wine and goes home laughing.",fx:{rep:-3}}},{t:"Break a jug of wine on her bow and pray loudly",check:{s:"faith",s2:"persuasion",d:45},win:{r:"Whether it is the prayer or the forty men leaning on her while everyone looks at the priest, she moves. A lucky ship, they say.",fx:{rep:5,piety:2,fame:1}},lose:{r:"The jug bounces off the bow without breaking. The sailors cross themselves. Nobody wants to crew her now.",fx:{rep:-5,happy:-3}}}]},{id:"tr_carp_press",opp:["carpenter"],minRank:3,cool:8,title:"The crown's order",text:"{ruler} needs a war fleet by Sea Opening. A royal order comes to your yard: every shipwright, sawyer and caulker in {home} is to go to the royal yards at the crown's wage, two-thirds of what they earn now, until the fleet is built. As master of the yard, you are to send them.",choices:[{t:"Send them all, as ordered",r:"The crown is pleased. The men go, cursing your name on the road.",fx:{favor:8,rep:-6,honor:1}},{t:"Bargain for full wages",check:{s:"diplomacy",s2:"etiquette",d:58},win:{r:"You argue that unpaid men build leaking ships. The crown's man agrees, sourly. Full wages, and your men cheer you at the yard gate.",fx:{favor:2,rep:10,fame:1,skill:{diplomacy:2}}},lose:{r:"The crown's man writes your name down in a little book. The men go at two-thirds anyway.",fx:{favor:-8,rep:2}}},{t:"Offer to build the ships in your yard at a fixed price",check:{s:"trade",s2:"stewardship",d:55},win:{r:"Six galleys built at home, by your own men, on your own terms. The crown pays late but it pays.",fx:{coin:300,rep:8,favor:6,skill:{stewardship:3}}},lose:{r:"Your price is too high, and the crown has a long memory for merchants.",fx:{favor:-4}}},{t:"Hide your best men in the timber sheds",check:{s:"intrigue",s2:"stealth",d:52},win:{r:"The crown gets the clumsy and the old. You keep your yard running. Nobody can prove a thing.",fx:{rep:8,favor:-3,honor:-2}},lose:{r:"A sawyer you passed over talks. You pay a heavy fine, and the crown remembers.",fx:{coin:-60,favor:-12,rep:-3}}}]}]));
    A.defEvents([
      {
        id: "tr_carp_green_leak",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"tr_carp_green_oak"),
        w: 1.5,
        title: "Green oak",
        text: "The merchant you built the cog for comes back salt-stained and shaking. The ship of green oak opened her seams in a squall off {town}. Half her cargo is on the seabed, and he wants to know whose fault that is.",
        choices: [
          {
            t: "Pay a share of the loss (100 suns)",
            req: p=>p.coin>=100,
            r: "It hurts. He shakes your hand at the end of it, and your name stays good on the waterfront.",
            fx: {coin:-100,honor:3,unflag:"tr_carp_green_oak"},
          },
          {
            t: "Blame the captain",
            check: {s:"deception",s2:"persuasion",d:50},
            win: {
              r: "The captain was carrying too much sail in a squall, everybody knows that. The merchant goes after him instead.",
              fx: {honor:-3,unflag:"tr_carp_green_oak"},
            },
            lose: {
              r: "The waterfront knows green oak when it sees it. Nobody orders a hull from you for a year.",
              fx: {rep:-12,unflag:"tr_carp_green_oak"},
            },
          },
          {
            t: "Recaulk and refasten her for nothing",
            r: "A winter of free work on your own mistake. She sails again, and so does your name, a little lower.",
            fx: {rep:-3,honor:2,skill:{craft:3},unflag:"tr_carp_green_oak",wil:1},
          },
        ],
      },
      {
        id: "tr_carp_d_adze",
        cond: (p,C)=>C.adult(p)&&J(p,"carpenter"),
        title: "The last hour",
        text: "It is the last hour of a long day, shaping a keel timber with the adze, swinging it down between your own feet as every carpenter does. Your arms are heavy and the light is going.",
        choices: [
          {
            t: "Finish the timber tonight",
            check: {s:"sta",s2:"craft",d:45},
            win: {
              r: "The last chip flies as the bell rings. A clean timber and an early start tomorrow.",
              fx: {perf:3,skill:{craft:1}},
            },
            lose: {
              r: "The adze glances off a knot and into your foot.",
              fx: {health:-10,cause:"an adze",wound:"limp",wil:1},
            },
          },
          {t:"Stop, and finish at dawn",r:"The timber waits. So do your toes, all ten of them.",fx:{perf:-1}},
          {
            t: "Let the apprentice finish it",
            check: {s:"command",s2:"craft",d:40},
            win: {
              r: "You stand over the lad and talk him through it. He does well, and stands taller for it.",
              fx: {perf:2,skill:{command:1}},
            },
            lose: {
              r: "He takes a slice off the timber that was meant to be there. Five suns of oak, gone.",
              fx: {coin:-5,perf:-2},
            },
          },
        ],
      },
      {
        id: "tr_carp_d_timber",
        cond: (p,C)=>C.adult(p)&&J(p,"carpenter")&&rk(p)>=1,
        cool: 8,
        title: "Timber is dear",
        setup: (p,ctx)=>{ctx.why=p.realm==="POL-01"?"No Aldmark axe has crossed the Oak Line since the Blood-price of Rinael in 1080, and good oak has doubled in price.":["POL-05","POL-06","POL-07"].includes(p.realm)?"The Grove Keepers have marked fewer trees this year, and good oak has doubled in price.":"The lord has closed his forest to cutting, and good oak has doubled in price.",mk(p,ctx,"a timber man with no questions")},
        text: "{why} {them} has a raft of fine oak on the river: unmarked, uncounted, and half the price.",
        choices: [
          {
            t: "Buy the raft",
            check: {s:"intrigue",s2:"trade",d:48},
            win: {
              r: "Good oak in your yard and money in your purse. You do not ask where it grew.",
              fx: {coin:15,perf:4,honor:-2},
            },
            lose: {
              r: "The lord's forester traces the raft to your yard by the marks of the axe. You pay a fine the size of the savings.",
              fx: {coin:-25,rep:-5,honor:-3},
            },
          },
          {t:"Pay the honest price",r:"Thin profit this year. Your timber is clean.",fx:{coin:-10,perf:3}},
          {
            t: "Build smaller, with pine and ash",
            r: "Lighter work for lighter pay. Some customers go elsewhere.",
            fx: {perf:-3},
          },
        ],
      },
    ]);
    A.defEvents(O([{id:"tr_brew_cellar",opp:["brewer"],maxRank:0,cool:3,title:"Down in the cellar",setup:(p,ctx)=>{ctx.drink=drink(p)},text:"The innkeeper sends you down to the cellar to stretch the festival cask: one bucket of well water to every three of {drink}. On your way back up you find a purse under a bench in the common room. A knight's, by the badge stitched on it, and heavy.",choices:[{t:"Water the cask, and give the purse back",r:"The knight gives you a penny and calls you an honest lad. The innkeeper calls you a fool when he hears.",fx:{coin:1,honor:2,perf:2}},{t:"Water the cask, and keep the purse",check:{s:"stealth",s2:"deception",d:40},win:{r:"Fifteen suns under your straw mattress. The knight shouts at everyone and rides off poorer.",fx:{coin:15,honor:-3}},lose:{r:"The knight counts heads, then searches the pot-boy first.",fx:{punish:"theft"}}},{t:"Refuse to water the cask",r:"The innkeeper boxes your ears and does it himself. A guest who saw it all tips you a penny.",fx:{honor:2,perf:-3,coin:1}}]},{id:"tr_brew_wedding",opp:["brewer"],minRank:1,maxRank:2,cool:3,title:"Twenty casks for a wedding",setup:(p,ctx)=>{mk(p,ctx,"the bride's father",{sex:"M"}),ctx.drink=drink(p)},text:"{them} is marrying off his eldest at May Fair and wants twenty casks of {drink} for the feast. He can pay half now and half after the harvest, he says. Every brewer in {home} has heard that before.",choices:[{t:"Brew your best and trust him",r:"The wedding is talked about for a year, and so is your {drink}. He pays the second half at Harvest Home, mostly.",fx:{coin:12,rep:5,them:{type:"friend",op:30}}},{t:"Half the casks now, half when he pays",r:"Ten casks, a dry wedding by midnight, and a father who never buys from you again.",fx:{coin:8,rep:-1,them:{type:"acquaint",op:-10}}},{t:"Brew it small, and charge full",check:{s:"deception",s2:"trade",d:45},win:{r:"Wedding guests are drunk by the second cask whatever is in it.",fx:{coin:16,honor:-2}},lose:{r:"The groom's family complain that the {drink} was water. The whole valley hears it.",fx:{coin:8,rep:-6}}}]},{id:"tr_brew_hops",opp:["brewer"],minRank:1,cool:8,title:"Bitter flowers",cond:(p,C)=>!C.flag(p,"tr_brew_hopped"),setup:(p,ctx)=>{ctx.holder="the "+temple(p),ctx.drink=drink(p)},text:"A traveler from the east swears by hops: bitter green flowers that keep ale from souring for months instead of days. But in {home} every brewer must buy gruit, the herb mix for ale, from {holder}, which holds the gruit right and takes a fee on every brew. Ale brewed with hops pays no gruit.",choices:[{t:"Brew with hops openly, and argue it out",check:{s:"craft",s2:"persuasion",d:55},win:{r:"Your hopped ale keeps all summer and travels by cart to {town}. Customers come from three villages. The gruit-keepers sulk but cannot stop you.",fx:{coin:20,rep:8,skill:{craft:3},flag:"tr_brew_hopped"}},lose:{r:"Fined for brewing without gruit, and the first batch tastes like a bitter hedge.",fx:{coin:-15,rep:-3,newRel:{type:"enemy",op:-25}}}},{t:"Brew a hopped batch quietly for your best customers",check:{s:"stealth",s2:"trade",d:48},win:{r:"A cask behind the cask, for those who know to ask. The word spreads, quietly.",fx:{coin:15,rep:4,flag:"tr_brew_hopped"}},lose:{r:"A gruit-keeper's clerk orders it, tastes it and smiles.",fx:{coin:-10,rep:-2}}},{t:"Stick with gruit, as your mother did",r:"The old way. The holy fee. The {drink} sours by midsummer, as it always has.",fx:{piety:1}}]},{id:"tr_brew_brawl",opp:["brewer"],minRank:1,cool:4,title:"Soldiers in the common room",text:"Eight soldiers back from the border have been drinking since noon. By dusk one has thrown a bench through the shutter and another has a pot-boy by the collar. The rest of your customers are edging towards the door without paying.",choices:[{t:"Throw the loudest one out yourself",r:"You roll up your sleeves.",fx:{rep:3,duel:{tier:2,title:"a drunk soldier",troop:"SP",opts:{kind:"brawl",place:"your common room",lethal:!1,toYield:!0,title:"A brawl in the common room"}}}},{t:"Send for the watch",r:"The watch comes, eventually. The soldiers leave a broken shutter, three broken pots and no money.",fx:{coin:-8,rep:1}},{t:"Stand a round on the house and start a song",check:{s:"music",s2:"persuasion",d:45},win:{r:"By the third verse they are singing along, and by the fifth they are crying about home. They pay for the shutter.",fx:{coin:-3,rep:4,fame:1,skill:{music:1}}},lose:{r:"They do not like your song. The brawl now has music.",fx:{coin:-15,health:-5,cause:"a thrown pot"}}}]},{id:"tr_brew_whispers",opp:["brewer"],minRank:2,cool:6,title:"The guest in the back room",setup:(p,ctx)=>{mk(p,ctx,"a guest who pays in advance")},text:"{themFull} has taken your back room for a month, pays in advance and meets strangers there after curfew. This morning the reeve's man came by, bought a cup he did not drink and asked you who comes and goes, and when. He hinted that the crown pays for good ears.",choices:[{t:"Listen at the door, and sell what you hear",check:{s:"intrigue",s2:"stealth",d:52},win:{r:"Names, dates and a sealed letter you were not supposed to see. The reeve's man pays thirty suns and asks you to keep listening.",fx:{coin:30,skill:{intrigue:3},honor:-2,favor:3,them:{type:"acquaint",op:-10}}},lose:{r:"{They} opens the door while you are bent at the keyhole. {They} leaves that night, and somebody slashes your water barrels.",fx:{coin:-10,them:{type:"enemy",op:-40}}}},{t:"Warn {themHim}",r:"{They} thanks you with a purse and is gone by dawn. The reeve's man is less pleased.",fx:{coin:15,favor:-3,them:{type:"friend",op:30}}},{t:"See nothing. Hear nothing. Pour",r:"An innkeeper who knows nothing lives longest.",fx:{wil:.5}}]},{id:"tr_brew_camp",opp:["brewer"],minRank:1,cool:4,title:"Ale for the camp",setup:(p,ctx)=>{ctx.drink=drink(p),ctx.fee=30+rk(p)*25},text:"The {realmShort} army is camped two days' march from {home}, and an army drinks like a river. The quartermaster will take every cask you can cart to the camp, at {fee} suns for the lot, and he does not taste it before he pays.",choices:[{t:"Brew double and cart it yourself",check:{s:"logistics",s2:"sta",d:45},win:{r:"Four carts, two days, one broken axle and a camp that cheers when it sees you coming.",fx:pay((p,c)=>fee(c),{rep:5,skill:{logistics:2}})},lose:{r:"A cart overturns in a ford. You arrive with half the casks.",fx:pay((p,c)=>fee(c)/2,{rep:1})}},{t:"Water it. Soldiers will drink anything",check:{s:"deception",s2:"trade",d:45},win:{r:"They drink it, and want more. You are paid well for well water.",fx:pay((p,c)=>fee(c)*1.4,{honor:-3})},lose:{r:"The sergeants taste it and pour the first cask over your head.",fx:{rep:-5,honor:-3,happy:-3}}},{t:"Sell to the camp-followers instead, at a higher price",r:"Less coin, less trouble, and you are home in a day.",fx:pay((p,c)=>fee(c)/2,{})}]},{id:"tr_brew_assize",opp:["brewer"],minRank:3,cool:6,title:"The assize of ale",setup:(p,ctx)=>{ctx.drink=drink(p)},text:"The town council sets the price of {drink} each year by the price of barley. This year barley has doubled after a wet harvest, but the council will not let the price of a pint move: the poor drink it with their bread, and the poor riot. Every brewer in the guild is losing money on every cask.",choices:[{t:"Argue the guild's case before the council",check:{s:"persuasion",s2:"learning",d:55},win:{r:"You bring barley prices from three markets and the guild's books. The council allows half a penny more. The guild calls it a victory.",fx:{rep:8,skill:{persuasion:2}}},lose:{r:"The council will not move. The masters say a stronger voice would have moved them.",fx:{rep:-4}}},{t:"Have the guild brew it weaker, quietly",check:{s:"intrigue",s2:"deception",d:50},win:{r:"Same price, thinner {drink}. The ale-tasters are guild men. Nobody complains but the drunks.",fx:{coin:30,rep:3,honor:-4}},lose:{r:"A council ale-taster from outside the guild catches it. The guild is fined, and so are you.",fx:{coin:-40,rep:-8,honor:-4}}},{t:"Shut every brewhouse for a week",check:{s:"intimidation",s2:"command",d:55},win:{r:"A dry week in {home}. The council gives way on the eighth day.",fx:{rep:10,fame:1,coin:20}},lose:{r:"The council lets in brewers from {town} to sell at the old price. The guild breaks.",fx:{rep:-10,coin:-20}}},{t:"Hold the price and swallow the loss",r:"A lean year for every brewer. The poor drink, and nobody riots, and nobody thanks you.",fx:{coin:-25,honor:3,piety:1}}]},{id:"tr_brew_pilgrims",opp:["brewer"],minRank:2,cool:4,title:"A hundred pilgrims",setup:(p,ctx)=>{ctx.fest=fest(),ctx.temple=temple(p),ctx.guild=p.realm==="POL-02"?"The Pilgrim Innkeepers' Guild has fixed the price of a bed at three pence.":"The town has fixed no price at all."},text:"It is {fest}, and a hundred pilgrims are on the road to the great {temple} at {capital}. Your inn is the last one before the hill. You have beds for twenty. {guild}",choices:[{t:"Pack them in the common room and the hayloft",check:{s:"stewardship",s2:"sta",d:45},win:{r:"Straw everywhere, pilgrims everywhere, and not one candle knocked over. A full purse and a blessing at every door.",fx:{coin:25,rep:5,piety:1}},lose:{r:"A candle in the hayloft. You put it out with your own blankets and the pilgrims' prayers. Nobody pays for that night.",fx:{coin:-10,health:-5,cause:"smoke",rep:-2}}},{t:"Charge what the road will bear",r:"A sun a head for straw. The pilgrims pay, and pray for your soul with feeling.",fx:{coin:45,honor:-3,rep:-2}},{t:"Let the poorest sleep in the stable for nothing",r:"A family with a sick child, an old soldier, two nuns. They bless your door. Your purse is lighter and your heart is not.",fx:{coin:10,honor:4,piety:3,rep:3}}]},{id:"tr_brew_dead_guest",opp:["brewer"],minRank:1,cool:8,title:"The guest who did not wake",setup:(p,ctx)=>{ctx.temple=temple(p)},text:"A traveler took your best room three nights ago and paid in advance. This morning he did not come down. He is cold in the bed, with a full purse under the pillow, a good horse in your stable, and nobody in {home} who knows his name.",choices:[{t:"Send for the reeve, as the law says",r:'The reeve takes the purse and the horse "for the heirs". You get two suns for the burial and the room back.',fx:{coin:2,honor:2,rep:2}},{t:"Bury him quietly and keep the purse",check:{s:"stealth",s2:"deception",d:48},win:{r:"A quiet grave behind the {temple}, a prayer you mean, and forty suns you do not talk about.",fx:{coin:40,honor:-5}},lose:{r:"His brother comes looking a month later and finds the horse in your stable.",fx:{punish:"theft",rep:-8}}},{t:"Read his letters and find his family",check:{s:"learning",s2:"int",d:45},win:{r:"A wife in {town}. You send the purse and the horse with a carter you trust. She sends a letter you keep for the rest of your life.",fx:{honor:5,rep:4,fame:1}},lose:{r:"The letters are in a hand or a tongue you cannot read. In the end you send for the reeve.",fx:{coin:2,honor:1}}}]},{id:"tr_brew_buy_inn",opp:["brewer"],minRank:1,maxRank:1,cool:6,title:"The old inn",cond:(p,C)=>free(p)&&!C.ownShop(p),setup:(p,ctx)=>{mk(p,ctx,"an old innkeeper"),ctx.inn="the "+A.pick(["Green Man","Three Herrings","Laughing Ox","Bell and Bucket","Drowned Bishop","Grey Mare"])},text:"Old {them} has kept {inn} on the road out of {home} for forty years. {Their} knees are gone and {theirHis} children are dead or far away. {They} will sell you the inn, the brewhouse and the sign for 300 suns, half its worth, if you swear to keep the name and let {themHim} sit by the fire until the end.",choices:[{t:"Buy it, and swear (300 suns)",req:p=>p.coin>=300,r:"You swear on the hearthstone. The sign stays. So does {them}, telling your guests how much better it was in {theirHis} day.",fx:(p,ctx)=>{p.coin-=300,p.assets.push({k:"inn",name:GD.PROPERTY.inn.name,y:A.S.year});const s=up(p);p.job&&(p.job.own=A.S.year,p.job.staff=p.job.staff||0),A.addRep(p,6);const t=ctx&&ctx.pid?A.P(ctx.pid):null;return t&&p.rel[t.id]?A.addOp(p,t,30):t&&A.link(p,t,"friend",40,"friend"),s}},{t:"Offer to run it for {themHim}, for a share",check:{s:"persuasion",s2:"trade",d:45},win:{r:"{They} agrees. You run {inn} as your own, and pay {themHim} a third of the takings until the end.",fx:p=>{const s=up(p);return A.addRep(p,4),p.coin+=20,s}},lose:{r:"{They} wants a buyer, not a partner. The inn goes to a stranger from {town}.",fx:{happy:-3}}},{t:"Refuse. It is too much",r:"The inn goes to a stranger who paints over the sign.",fx:{}}]},{id:"tr_brew_royal",opp:["brewer"],minRank:2,minRep:50,cool:8,title:"For the royal table",setup:(p,ctx)=>{ctx.drink=drink(p),ctx.fest=fest()},text:"The steward of {ruler}'s household is buying {drink} for the court's feast at {fest}, and has asked five brewers to send a cask for tasting. Whoever wins supplies the court for a year, and can paint the royal arms over the door.",choices:[{t:"Send your best, brewed with all your care",check:{s:"craft",s2:"trade",d:55},win:{r:"The steward drinks yours, then drinks it again. The court's carts come every month, and the royal arms go up over your door.",fx:{coin:120,rep:12,fame:2,favor:4,masterwork:"the court {drink} of {home}"}},lose:{r:"Second of five. A good {drink}. Not a royal one, this year.",fx:{coin:10,rep:2}}},{t:"Brew something new for the occasion",check:{s:"craft",s2:"int",d:60},win:{r:"Dark, strong, with a taste of honey and smoke. The court talks of nothing else at the feast. They name it after you.",fx:{coin:150,rep:15,fame:3,favor:5,masterwork:"the dark {drink} named for you at court"}},lose:{r:"New is not always better. The steward's face says so before his mouth does.",fx:{rep:-4}}},{t:"Find out what the steward likes, and bribe his taster",check:{s:"intrigue",s2:"persuasion",d:50},win:{r:"The taster drinks your cask first and talks of nothing else. The contract is yours.",fx:{coin:90,rep:6,honor:-3}},lose:{r:"The taster takes your coin and votes for someone else. You cannot exactly complain.",fx:{coin:-20,honor:-3}}}]}]));
    A.defEvents([
      {
        id: "tr_brew_d_sour",
        cond: (p,C)=>C.adult(p)&&J(p,"brewer"),
        title: "The batch turns",
        setup: (p,ctx)=>{ctx.drink=drink(p)},
        text: "A week of thunder heat, and three casks of {drink} have turned sour as a widow's tongue. Your regulars will taste it in one sip. The soldiers' tavern by the gate will not.",
        choices: [
          {
            t: "Pour it away",
            r: "Six suns into the gutter. The pigs in the lane are happy for a day.",
            fx: {coin:-6,rep:1,honor:1},
          },
          {t:"Sell it to the vinegar-maker",r:"Two suns back, and a lesson about cellars.",fx:{coin:-3}},
          {
            t: "Sell it to the soldiers' tavern as fresh",
            check: {s:"deception",s2:"trade",d:45},
            win: {r:"The soldiers drink it and complain about everything, as usual.",fx:{coin:4,honor:-2}},
            lose: {r:"The tavern-keeper sends the casks back with two sergeants.",fx:{rep:-4,honor:-2,coin:-6}},
          },
        ],
      },
      {
        id: "tr_brew_d_slate",
        cond: (p,C)=>C.adult(p)&&J(p,"brewer")&&rk(p)>=1,
        cool: 6,
        title: "The slate",
        setup: (p,ctx)=>{mk(p,ctx,"a regular with a long slate")},
        text: "{them} has drunk at your fire every night for six years, and {theirHis} slate behind the bar now says twelve suns. Tonight {theirHis} family is at your door, asking you, please, to stop serving {themHim}.",
        choices: [
          {
            t: "Forgive the slate and stop serving {themHim}",
            r: "{They} is furious for a month, then sober for a year. The family brings you eggs and bread on every feast day.",
            fx: {coin:-4,honor:4,them:{type:"friend",op:10}},
          },
          {
            t: "Keep serving, and take {theirHis} tools for the debt",
            r: "Twelve suns of tools. {They} drinks at the other alehouse now, and the family will not look at you.",
            fx: {coin:8,honor:-3,them:{type:"enemy",op:-30}},
          },
          {
            t: "Make {themHim} work off the slate in the brewhouse",
            check: {s:"persuasion",s2:"wil",d:42},
            win: {
              r: "Six months of hauling sacks. {They} is better at it than you expected, and stays on for wages.",
              fx: {coin:6,perf:3,them:{type:"friend",op:25}},
            },
            lose: {r:"Two days of hauling, then {theyHe} is gone, and so is a sack of malt.",fx:{coin:-3}},
          },
        ],
      },
    ]);
    const ART_RULE = {
        "REL-01": "No artist of the Temple may paint a face on the sun.",
        "REL-02": "Icons are painted on wooden boards and always hung facing east.",
        "REL-03": "In the Seven Halls the gods are painted along the hall beams, in red and black and gold.",
        "REL-06": "The monks want a painted scroll wheel of rebirth, every soul in its place.",
        "REL-07": "No image of a person may stand in a holy place, so the panel must be patterned tile and the sayings of Samar in calligraphy.",
        "REL-08": "Holy figures are painted strictly from the side, as on the walls of Tamar.",
        "REL-09": "The ancestors are painted on wooden boards, one face for every generation.",
        "REL-10": "The temple wants painted cloth, bright enough to be seen from the river.",
      },
      artRule = p=>ART_RULE[p.faith]||"The priests will want it to look like every other panel they have ever seen.";
    A.defEvents(O([{id:"tr_art_lapis",opp:["artist"],maxRank:0,cool:3,title:"The blue",text:"The master trusts you to grind the blue today: ultramarine, made from lapis stone carried from beyond the mountains, worth more than its weight in silver. One careless sweep of the sleeve, and a year of your keep is on the floor.",choices:[{t:"Grind it slowly, and never take your eyes off it",check:{s:"craft",s2:"wil",d:34},win:{r:"A pure, deep blue, ground fine as flour. The master holds it to the window and nods.",fx:{perf:4,skill:{craft:3}}},lose:{r:"A cat, a sleeve, a scream. Blue dust in the floorboards that the master scrapes up with a knife for an hour.",fx:{perf:-6,happy:-5,wil:1}}},{t:"Keep back a pinch for your own work",check:{s:"stealth",s2:"deception",d:40},win:{r:"A pinch of the finest blue, folded in paper under your mattress. Your first real painting will have a sky in it.",fx:{skill:{craft:2},honor:-1,happy:3}},lose:{r:"The master weighs the stone before and the powder after. He beats you with the measuring stick.",fx:{perf:-10,health:-5,cause:"a beating",wil:1}}},{t:"Ask him to show you how to wash it pure",r:"He shows you the old trick with wax and lye that pulls the blue out of the grey. You will use it all your life.",fx:{skill:{craft:4},perf:1}}]},{id:"tr_art_sign",opp:["artist"],maxRank:1,cool:3,title:"The inn sign",setup:(p,ctx)=>{ctx.inn="the "+A.pick(["Green Man","Drowned Bishop","Three Herrings","Laughing Ox","Golden Wheel","Bear and Bucket"])},text:"The innkeeper of {inn} wants a new sign, and your master cannot be bothered with signs. Four suns and a free supper every Sunday for a year, if the sign brings in custom.",choices:[{t:"Paint it bold and funny",check:{s:"craft",s2:"persuasion",d:36},win:{r:"Travelers stop under it and laugh, then go in. You eat well every Sunday for a year.",fx:{coin:4,rep:4,happy:3}},lose:{r:"The ox looks like a sad priest. People stop, stare, and go to the next inn.",fx:{coin:2,rep:-1}}},{t:"Paint it exactly as he describes",r:"He gets the sign he imagined. It is very ordinary.",fx:{coin:4,rep:1}},{t:"Give the beast the innkeeper's face",check:{s:"craft",s2:"deception",d:45},win:{r:"The whole town comes to see it, and drinks while it laughs. The innkeeper pretends to be furious, and doubles your supper.",fx:{coin:6,rep:6,fame:1}},lose:{r:"He does not pretend. You are never paid, and never fed.",fx:{rep:2,newRel:{type:"enemy",op:-20}}}}]},{id:"tr_art_panel",opp:["artist"],minRank:1,maxRank:2,cool:4,title:"A panel for the village",setup:(p,ctx)=>{ctx.temple=temple(p),ctx.rule=artRule(p)},text:"The village of {town} has saved for nine years to buy a painted panel for its {temple}: thirty suns in a leather bag, counted out on your table in pennies. {rule}",choices:[{t:"Paint it exactly as the priest asks",r:"A proper panel, properly done. The village is proud of it. You are paid in pennies, every one.",fx:{coin:30,rep:4}},{t:"Paint the villagers' own faces among the holy figures",req:p=>p.faith!=="REL-07",check:{s:"craft",s2:"persuasion",d:50},win:{r:"The baker's wife as a saint, the miller as a shepherd. The village weeps and laughs and comes every holy day to look at itself.",fx:{coin:30,rep:8,piety:2,fame:1}},lose:{r:"The priest thinks it vain. The panel is hung in a side chapel, facing the wall.",fx:{coin:30,rep:-2}}},{t:"Hide the names of the village's dead in the calligraphy",req:p=>p.faith==="REL-07",check:{s:"craft",s2:"learning",d:48},win:{r:"Every family finds its dead woven into the saying of Samar. The Well-Keeper finds nothing to object to.",fx:{coin:30,rep:8,piety:2}},lose:{r:"A letter out of place, and a saying of Samar that now means something rude. You repaint it for free.",fx:{coin:15,rep:-2}}},{t:"Use cheap pigments and keep the difference",r:"It looks splendid for ten years. Then the red goes brown and the gold goes green. By then you are far away.",fx:{coin:40,honor:-3,rep:-2}}]},{id:"tr_art_portrait",opp:["artist"],minRank:1,cool:3,title:"A face for the wall",setup:(p,ctx)=>{mk(p,ctx,"a rich merchant"),ctx.fee=30+rk(p)*30,ctx.lead=p.realm==="POL-16"?"In Ostra every banker wants to be painted holding his ledger.":p.realm==="POL-04"?"In Lucerna every great man is painted holding a cup, in honor of Silvio the Taster.":"Every rich family wants a face on the wall for its grandchildren to look up at."},text:"{lead} {themFull} wants a portrait for {fee} suns, and wants to look ten years younger, a head taller and a good deal less like {self}.",choices:[{t:"Flatter shamelessly",check:{s:"craft",s2:"persuasion",d:45},win:{r:"{They} stares at the young, tall stranger in the frame and loves {themHim}. {Their} friends ask for your name.",fx:pay((p,c)=>fee(c),{rep:4,them:{type:"friend",op:25}})},lose:{r:"It looks like someone else entirely. {Their} own mother asks who it is.",fx:pay((p,c)=>fee(c)/2,{rep:-1})}},{t:"Paint the truth, but kindly",check:{s:"craft",s2:"int",d:55},win:{r:'Every line is there, and every line is forgiven. {They} looks at it a long time and says, "That is me." The best likeness in {home}.',fx:pay((p,c)=>fee(c),{rep:8,fame:1,skill:{craft:2}})},lose:{r:"The truth wins and the kindness loses. {They} pays half and hangs it in the stairwell.",fx:pay((p,c)=>fee(c)/3,{them:{type:"acquaint",op:-20}})}},{t:"Paint the truth, unkindly",r:"A masterpiece of greed and double chins. {They} refuses to pay. The whole town comes to your studio to see it anyway.",fx:{rep:4,fame:1,honor:-1,them:{type:"enemy",op:-40}}}]},{id:"tr_art_fresco",opp:["artist"],minRank:2,minRep:45,time:2,cool:8,title:"Wet plaster",setup:(p,ctx)=>{ctx.lord=patron(p),ctx.subject={"POL-15":"the siege of 895 to 897","POL-14":"the Diver cutting the chain","POL-18":"the king at the rising river","POL-02":"the crowning of Corvan, the sun breaking through the ash","POL-03":"Roderic the Lionheart on the Coast Road"}[p.realm]||"the story of "+ctx.lord+"'s family",ctx.fee=220+rk(p)*40},text:"{lord} wants the walls of the great hall painted with {subject}: thirty metres of wall, painted into wet plaster a patch at a time, each patch finished before it dries by evening. {fee} suns, and a year on the scaffold.",choices:[{t:"Paint every patch yourself, day after day",check:{s:"craft",s2:"sta",d:58},win:{r:"Three hundred days of plaster and pigment. When the scaffold comes down, {lord}'s guests forget to eat.",fx:pay((p,c)=>fee(c),{rep:12,masterwork:"the painted hall of {lord}",sta:.5})},lose:{r:"Too many patches dried before you finished them. The seams show like scars across the battle.",fx:pay((p,c)=>fee(c)/2,{rep:-3,wil:1})}},{t:"Train journeymen to paint the backgrounds",check:{s:"command",s2:"craft",d:50},win:{r:"They paint skies and hills; you paint faces and hands. Done in half the time, and three new painters learn their trade.",fx:pay((p,c)=>fee(c),{rep:10,masterwork:"the painted hall of {lord}",skill:{command:2}})},lose:{r:"One journeyman paints the sky green. It cannot be undone in fresco.",fx:pay((p,c)=>fee(c)*.6,{rep:-2})}},{t:"Paint on dry plaster and save months",r:"Quick, bright and cheap. It will start to flake in twenty years, and {lord} will be dead by then.",fx:pay((p,c)=>fee(c)*.9,{rep:3,honor:-1})}]},{id:"tr_art_forgery",opp:["artist"],minRank:1,cool:8,title:"An old Solen panel",setup:(p,ctx)=>{mk(p,ctx,"a dealer in old things")},text:"{themFull}, who deals in old things, wants a panel in the old Solen manner: cracked varnish, a saint in the old blue, a little smoke damage. {They} will sell it as five hundred years old to a count who collects such things, and pay you 80 suns. {They} never says the word forgery. Neither do you.",choices:[{t:"Paint it, and age it well",check:{s:"craft",s2:"deception",d:55},win:{r:"Baked in an oven, cracked with a roller, rubbed with soot and spit. The count pays a fortune and hangs it in his chapel.",fx:{coin:80,skill:{craft:3},honor:-5,flag:"tr_art_forged"}},lose:{r:"The varnish cracks in all the wrong ways. {They} refuses it, and tells other dealers you are clumsy.",fx:{rep:-4,honor:-2,them:{type:"enemy",op:-15}}}},{t:"Paint it, and hide your name in the saint's hem",check:{s:"craft",s2:"intrigue",d:48},win:{r:"Your name, tiny and upside down in the gold of the hem. A joke for some future scholar, and a way out if anyone ever asks.",fx:{coin:80,honor:-1,skill:{craft:2}}},lose:{r:"{They} finds your name before the sale, and burns the panel in front of you.",fx:{them:{type:"enemy",op:-30}}}},{t:"Refuse",r:"{They} shrugs. There are hungrier painters in {town}.",fx:{honor:1}}]},{id:"tr_art_dead_patron",opp:["artist"],minRank:2,cool:6,title:"The patron's heir",setup:(p,ctx)=>{ctx.lord=patronM(p),mk(p,ctx,"a patron's heir")},text:"{lord} died halfway through your commission: a family portrait of eleven people and two dogs. The heir, {them}, walks through your studio, looks at the half-finished panel and says {theyHe} never ordered it and will not pay for it. You have spent four months and thirty suns of pigment.",choices:[{t:"Finish it, and sell it to the widow",check:{s:"persuasion",s2:"etiquette",d:48},win:{r:"The widow sees her husband's face and pays you double, to spite her stepchild.",fx:{coin:80,rep:4,them:{type:"enemy",op:-15}}},lose:{r:"The widow has no money of her own. She cries over it, and you give it to her.",fx:{honor:3,rep:1}}},{t:"Paint the heir out, and the dogs bigger",check:{s:"craft",s2:"deception",d:45},win:{r:"Ten people and two very large dogs. The family's rivals buy it to hang in their hall. All {home} knows why.",fx:{coin:50,rep:6,fame:1,them:{type:"enemy",op:-40}}},lose:{r:"The family's rivals do not want it either. It goes in your loft.",fx:{happy:-3}}},{t:"Sue the estate in the town court",check:{s:"learning",s2:"persuasion",d:55},win:{r:"The court reads your contract and finds for you. The heir pays every sun, and glares.",fx:{coin:90,rep:3,them:{type:"enemy",op:-30}}},lose:{r:"No contract in writing. The court laughs, and you pay the court.",fx:{coin:-10,rep:-2}}}]},{id:"tr_art_betrothal",opp:["artist"],minRank:3,minRep:55,time:2,cool:10,title:"The betrothal portrait",setup:(p,ctx)=>{const t=mk(p,ctx,"a royal niece",{sex:"F"});ctx.niece=t.given},text:"A foreign prince is weighing a marriage with {ruler}'s niece, {niece}, and wants to see her face first. The court sends you to paint her. She is clever, kind and plain, and she has asked you, privately, to paint her exactly as she is. Her uncle has asked you, not privately at all, to paint her beautiful.",choices:[{t:"Paint her beautiful",r:"A stranger with her name. The prince agrees to the match. You hope he likes surprises.",fx:{coin:200,favor:8,rep:6,honor:-2}},{t:"Paint her exactly as she is",check:{s:"craft",s2:"int",d:60},win:{r:"You catch the wit in her eyes and the half-smile she gives when someone is being a fool. The prince writes back: he wants to meet the woman in that picture.",fx:{coin:300,favor:10,rep:12,masterwork:"the betrothal portrait of {niece}",them:{type:"friend",op:30}}},lose:{r:"Plain on the panel, plain in the prince's reply. Her uncle does not forgive you. She does.",fx:{coin:100,favor:-10,rep:2,them:{type:"friend",op:35}}}},{t:"Paint her as she is on her best day",check:{s:"craft",s2:"persuasion",d:55},win:{r:"True, and lit like a summer morning. Everybody is pleased, which almost never happens at court.",fx:{coin:250,favor:6,rep:10,masterwork:"the betrothal portrait of {niece}"}},lose:{r:"Neither true nor beautiful. Both of them are polite to you about it.",fx:{coin:150,rep:2}}}]},{id:"tr_art_altarpiece",opp:["artist"],minRank:2,minRep:55,time:3,cool:15,w:1.3,title:"The work above the altar",cond:(p,C)=>!C.flag(p,"tr_art_altar"),setup:(p,ctx)=>{ctx.temple=temple(p),ctx.Elders=A.cap(elders(p));const scr=p.faith==="REL-07";ctx.what=scr?"a great screen of carved and painted calligraphy":"an altarpiece of nine panels in gold leaf",ctx.mw="the "+homeOf(p)+(scr?" screen":" altarpiece")},text:"{Elders} of the great {temple} at {capital} want {what}: the whole story of the faith, and the great donors kneeling small at the bottom. Five hundred suns and three years of your life. It will be there for five hundred years, if nobody burns the {temple} down.",choices:[{t:"Give it everything, and paint it alone",check:{s:"craft",s2:"wil",d:64},win:{r:"Three years. When the cloth comes off, the whole chapter falls silent, and an old priest sits down on the floor. It is the best thing you will ever make.",fx:{coin:500,rep:15,fame:4,piety:3,masterwork:"{mw}",flag:"tr_art_altar",epithet:"the Gilder"}},lose:{r:"It is good. Everyone says so. You know where it fails, and you will see it every time you pass the door.",fx:{coin:400,rep:5,flag:"tr_art_altar",wil:1}}},{t:"Make the donors larger, and the price higher",check:{s:"persuasion",s2:"etiquette",d:52},win:{r:"The donors kneel a little bigger and pay a lot more. The priests pretend not to notice.",fx:{coin:650,rep:8,honor:-2,masterwork:"{mw}",flag:"tr_art_altar"}},lose:{r:"The priests notice. You are told to paint the donors smaller, at your own cost.",fx:{coin:380,rep:2,flag:"tr_art_altar"}}},{t:"Run it as a workshop: your design, many hands",check:{s:"command",s2:"craft",d:55},win:{r:"Eight painters, one vision. Done in two years, and four of your pupils become masters on the strength of it.",fx:{coin:500,rep:12,masterwork:"{mw}",flag:"tr_art_altar",newRel:{type:"student",op:35}}},lose:{r:"Too many hands. The panels do not quite agree with each other about what heaven looks like.",fx:{coin:400,rep:3,flag:"tr_art_altar"}}}]},{id:"tr_art_forbidden",opp:["artist"],minRank:1,cool:8,title:"What may not be painted",setup:(p,ctx)=>{mk(p,ctx,"a rich patron"),ctx.ask=p.faith==="REL-01"?"wants the sun on the ceiling of {theirHis} private chapel to have a face: {theirHis} dead father's. No artist of the Temple may paint a face on the sun.":p.faith==="REL-07"?"wants {theirHis} father's likeness painted in the family's house of prayer, where no image of a person may stand.":"wants the old gods of the hills painted under the new saints in {theirHis} chapel, hidden in the plaster where only the family will know.",ctx.ask=A.T(ctx.ask,A.ctxTokens(p,ctx))},text:"{themFull} {ask} {They} offers three times your usual fee.",choices:[{t:"Paint it, and hide it well",check:{s:"stealth",s2:"craft",d:52},win:{r:"A face that only shows when the evening light comes in at the west window. The family weeps every sunset. Nobody else ever sees it.",fx:{coin:90,skill:{craft:3},honor:-1,them:{type:"friend",op:35}}},lose:{r:"A visiting priest sees it on the first day. The patron swears you did it without asking.",fx:{coin:-20,rep:-8,piety:-3,them:{type:"enemy",op:-20}}}},{t:"Paint it openly, and dare them",check:{s:"wil",s2:"persuasion",d:60},win:{r:"The priests rage, the town talks, and young painters come from far away to see the thing that cannot be painted.",fx:{coin:90,rep:6,fame:3,piety:-4}},lose:{r:"The priests have it plastered over and you thrown in a cell to think about it.",fx:{prison:1,why:"painting what the faith forbids",rep:-5,piety:-4}}},{t:"Refuse",r:"Some lines are not worth crossing for money. {They} finds a hungrier painter.",fx:{piety:2}}]},{id:"tr_art_statue",opp:["artist"],minRank:2,cool:8,title:"The flaw in the marble",setup:(p,ctx)=>{ctx.hero=nm(p,"M")+" the "+A.pick(["Founder","Ferryman","Bold","Wall-Holder"]),ctx.fee=160+rk(p)*40},text:"The council of {home} wants a statue for the market fountain: {hero}, who saved the town once, in marble. The block from the quarry cost them dearly. As you start to rough it out, you find a grey flaw running through it like a vein through a leaf, right where the neck must be. Fee: {fee} suns.",choices:[{t:"Change the pose so the flaw falls outside the figure",check:{s:"craft",s2:"int",d:58},win:{r:"You turn the head to look over the shoulder, as if hearing the town call. The flaw ends up in the cloak. People say it is the most alive statue they have ever seen.",fx:pay((p,c)=>fee(c),{rep:12,masterwork:"the statue of {hero} in the market of {home}"})},lose:{r:"The pose is awkward and the flaw shows anyway. The town calls it the Stiff-Neck.",fx:pay((p,c)=>fee(c)/2,{rep:-4})}},{t:"Tell the council and ask for a new block",r:"They grumble about the cost, then thank you. A statue that loses its head in the first frost is worse.",fx:pay((p,c)=>fee(c)*.7,{rep:4,honor:2})},{t:"Carve on and hope the flaw holds",check:{s:"craft",s2:"wil",d:50},win:{r:"It holds. Probably it will hold for a long time. Probably.",fx:pay((p,c)=>fee(c),{rep:6})},lose:{r:"The head cracks off at the last polishing. The council wants its marble money back.",fx:{coin:-40,rep:-8,wil:1.5}}}]}]));
    A.defEvents([
      {
        id: "tr_art_forger_found",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"tr_art_forged"),
        w: 1.2,
        title: "A close look at the varnish",
        text: "The count who bought your 'five-hundred-year-old' saint has a new chaplain, who studied old panels at Solenne. He has been looking very closely at the cracks in the varnish, and asking which painters in {home} know how to bake a panel.",
        choices: [
          {
            t: "Confess to the count before the chaplain does",
            check: {s:"persuasion",s2:"etiquette",d:52},
            win: {
              r: "The count laughs until he wheezes, then hires you to paint the real thing. He keeps the fake as a joke on his guests.",
              fx: {unflag:"tr_art_forged",rep:4,coin:30},
            },
            lose: {
              r: "The count does not laugh. You pay back your share and leave his lands quickly.",
              fx: {unflag:"tr_art_forged",coin:-80,rep:-6},
            },
          },
          {
            t: "Blame the dealer",
            r: "The dealer is long gone. The chaplain is not satisfied, but he cannot prove it.",
            fx: {unflag:"tr_art_forged",honor:-2},
          },
          {
            t: "Paint a second, better forgery for the chaplain to find",
            check: {s:"craft",s2:"intrigue",d:60},
            win: {
              r: 'The chaplain "discovers" an even older panel in a monastery store-room and is too pleased with himself to doubt the first one.',
              fx: {unflag:"tr_art_forged",skill:{craft:3,intrigue:2},honor:-3},
            },
            lose: {
              r: "Two forgeries, one painter. The chaplain is not stupid.",
              fx: {unflag:"tr_art_forged",rep:-12,punish:"theft"},
            },
          },
        ],
      },
      {
        id: "tr_art_d_colic",
        cond: (p,C)=>C.adult(p)&&J(p,"artist"),
        cool: 8,
        title: "The painter's colic",
        text: "Cramps in the belly, a grey line along your gums, and hands that shake in the morning. The physician says it is bad air from the river. An old painter down the street says it is the lead white, and that you should stop licking your brushes to a point.",
        choices: [
          {
            t: "Listen to the old painter",
            r: "You wash your hands, stop licking brushes and grind the white wet. In a month the shaking stops.",
            fx: {health:5,perf:-1},
          },
          {
            t: "Have the physician bleed it out",
            r: "Two suns and a basin of your blood. You feel weaker, and the cramps go on.",
            fx: {coin:-2,health:-3,cause:"the painter's colic"},
          },
          {
            t: "Work through it",
            check: {s:"sta",s2:"wil",d:45},
            win: {r:"It passes, as it often does. For now.",fx:{wil:.5}},
            lose: {
              r: "It does not pass. You spend a month in bed with your knees drawn up.",
              fx: {health:-10,cause:"the painter's colic",perf:-4},
            },
          },
        ],
      },
      {
        id: "tr_art_d_lean",
        cond: (p,C)=>C.adult(p)&&J(p,"artist")&&rk(p)<=2,
        cool: 6,
        title: "A lean season",
        text: "No commissions since the last feast. The rent is due on the quarter day, the pigment-seller wants paying, and there is one onion in the house.",
        choices: [
          {
            t: "Paint inn signs and cart wheels",
            r: "Bread on the table. Your hand gets faster and your pride gets thinner.",
            fx: {coin:5,rep:-1,skill:{craft:1}},
          },
          {
            t: "Sell your sketchbook to a collector",
            r: "Fifteen suns for ten years of drawings. You buy food and try not to think about it.",
            fx: {coin:15,happy:-5},
          },
          {
            t: "Borrow from a moneylender",
            r: "Twenty suns now. More later. Much more.",
            fx: p=>(p.coin+=20,p.debt=Math.round((p.debt||0)+26),""),
          },
        ],
      },
    ]);
    const fastText = p=>p.faith==="REL-07"?"The Breaking of the Dry on 1 September: a month of daylight fasting ends at sunset, and the whole household, sixty mouths, will sit down at the same moment, starving, and expect goat and dates and sweet things on the table before the call has finished.":p.faith==="REL-02"?"The Dawn Feast, after four meatless Dark Weeks: the household has lived on cabbage and buckwheat for a month and will sit down to smoked sturgeon and honey cakes, sixty of them, all at once.":"The Slaughter Feast on 11 November, when every beast that cannot be fed through the winter is killed and all that will not salt must be eaten: sixty mouths, a whole ox, and one kitchen.";
    A.defEvents(O([{id:"tr_cook_sauce",opp:["cook"],maxRank:0,cool:3,title:"Who burned the sauce",setup:(p,ctx)=>{mk(p,ctx,"the master cook's nephew")},text:"The sauce for the high table has caught on the bottom of the pot, and the whole kitchen smells of it. {them}, the master cook's nephew, was meant to be stirring it. When the master cook comes roaring in, {them} points at you.",choices:[{t:"Say nothing and take the ladle across the ear",r:"It rings for an hour. {them} owes you, and you both know it.",fx:{wil:1,health:-3,cause:"a ladle",them:{type:"friend",op:15}}},{t:"Tell the truth, loudly",check:{s:"persuasion",s2:"wil",d:40},win:{r:"The scullion backs you up. The master cook clouts his own nephew for once, and looks at you with new eyes.",fx:{perf:5,honor:2,them:{type:"rival",op:-20}}},lose:{r:"Blood is thicker than sauce. You get the ladle, and a week of onions.",fx:{perf:-4,health:-3,cause:"a ladle",them:{type:"rival",op:-20}}}},{t:"Save the sauce before anyone tastes it",check:{s:"craft",s2:"int",d:42},win:{r:"Into a clean pot without scraping the bottom, a knob of butter, a cup of wine. The master cook tastes it, frowns, and says nothing. That night he shows you how he does it himself.",fx:{perf:6,skill:{craft:4}}},lose:{r:"You make it worse. Everyone agrees it was your fault now.",fx:{perf:-5}}}]},{id:"tr_cook_wedding",opp:["cook"],minRank:1,maxRank:2,cool:3,title:"A wedding for sixty",setup:(p,ctx)=>{ctx.food=food(p)},text:"A farmer marrying off his eldest wants a feast for sixty: {food}, bread, and enough to drink to float a barge. He has twenty suns, a third of a farmhand's year, and he wants it to look like forty.",choices:[{t:"Make the cheap cuts taste dear",check:{s:"craft",s2:"int",d:45},win:{r:"Slow fires, sharp herbs, and bread to soak up everything. The groom's family eat until they cannot stand. The farmer tells the whole valley.",fx:{coin:8,rep:5,newRel:{type:"friend",op:25}}},lose:{r:"Tough meat and thin stew. Nobody goes hungry, and nobody talks about the food.",fx:{coin:4,rep:-2}}},{t:"Tell him plainly what twenty suns will buy",r:"He is disappointed, then grateful. The feast is honest and so are you.",fx:{coin:6,rep:2,honor:2}},{t:"Pad the stew with things he will not ask about",check:{s:"deception",s2:"craft",d:45},win:{r:"Nobody asks. Nobody wants to know.",fx:{coin:12,honor:-2}},lose:{r:"Half the wedding is sick the next morning. The farmer comes to your door with his brothers.",fx:{coin:4,rep:-8,honor:-3}}}]},{id:"tr_cook_vial",opp:["cook"],minRank:2,minRep:40,cool:10,title:"The vial",setup:(p,ctx)=>{ctx.lord=patron(p),ctx.guest="a great lord of "+foe(p),mk(p,ctx,"a stranger in good boots")},text:`Tomorrow {lord} feasts {guest}. Tonight {them}, a stranger in good boots, finds you in the kitchen yard, presses two hundred suns and a little clay vial into your hands, and says only, "The guest's dish. Nobody else's." Then {theyHe} is gone, and you are standing there with a death in one hand and a fortune in the other.`,choices:[{t:"Take it all straight to the steward",r:"The steward goes pale, doubles the guard and gives you twenty suns of the two hundred. The stranger is never found.",fx:{coin:20,rep:6,honor:4,favor:4,them:{type:"enemy",op:-50}}},{t:"Keep the coin, and pour the vial into the slops",check:{s:"deception",s2:"wil",d:55},win:{r:"The feast passes. The guest lives. Somewhere, a stranger in good boots learns that a cook has robbed {themHim}.",fx:{coin:200,honor:-3,flag:"tr_cook_vial_coin",them:{type:"enemy",op:-30}}},lose:{r:"{They} was watching from the gate. The next night a knife finds you in the dark of the larder.",fx:{coin:200,health:-18,cause:"a knife in the dark",wound:"deep_cut",them:{type:"enemy",op:-60}}}},{t:"Play along, and help the steward's men take {themHim}",check:{s:"intrigue",s2:"ins",d:55},win:{r:`You meet {themHim} at the gate to "confirm". The steward's men take {themHim} with the rest of the coin on {themHim}. {lord} remembers your name.`,fx:{coin:60,rep:10,fame:2,favor:8,them:{type:"enemy",op:-60}}},lose:{r:"{They} slips the net in the dark. Now your name is known to the wrong people.",fx:{rep:3,them:{type:"enemy",op:-60},flag:"tr_cook_vial_coin"}}},{t:"Throw purse and vial down the well and say nothing",r:"You do not sleep that night, or the next. The feast is fine. You never find out what it was.",fx:{honor:1,wil:1}}]},{id:"tr_cook_taster",opp:["cook"],minRank:2,cool:8,title:"The taster is sick",setup:(p,ctx)=>{ctx.lead=p.realm==="POL-04"?"In Lucerna every great house keeps a Doravelli taster, who eats first from every dish.":"Since the poison scares, every great house keeps a taster who eats first from every dish."},text:"{lead} Last night the taster ate your fish in saffron and was sick before the sweet course. The household is whispering. The steward wants to know exactly what was in that fish, and who touched it.",choices:[{t:"Show them every pot, jar and knife",check:{s:"int",s2:"craft",d:50},win:{r:"You find it yourself: one bad oyster in the sauce, from the bottom of the barrel. Bad luck, not poison. The steward believes you.",fx:{rep:4,perf:3}},lose:{r:"Nothing is found, and nothing is proved. That is enough to lose you the high table.",fx:{perf:-15,rep:-8}}},{t:"Find out who else went near the dish",check:{s:"intrigue",s2:"ins",d:55},win:{r:"An under-cook with new boots and a cousin in a rival house. The steward takes it from there.",fx:{rep:8,favor:3,newRel:{type:"enemy",op:-40}}},lose:{r:"You accuse the wrong scullion. The kitchen turns against you.",fx:{rep:-4,honor:-2}}},{t:"Eat the leftovers in front of them all",check:{s:"sta",s2:"wil",d:45},win:{r:"You eat every scrap and ask for bread to mop the plate. You are fine. The household believes in you more than in any proof.",fx:{rep:10,fame:1,wil:1}},lose:{r:"You are sick for three days. It was only a bad oyster, but you are believed, and you are thinner.",fx:{health:-15,cause:"bad fish",rep:4,wil:1}}}]},{id:"tr_cook_fastbreak",opp:["cook"],minRank:1,cool:4,title:"Sixty at once",setup:(p,ctx)=>{ctx.feast=fastText(p)},text:"{feast} You have four kitchen hands, two fires and one oven.",choices:[{t:"Plan it like a battle, hour by hour",check:{s:"logistics",s2:"craft",d:50},win:{r:"Every dish out on time and hot. The household eats in silence, which is the highest praise there is.",fx:andUp({rep:6,perf:6,skill:{logistics:3}},[1],"The steward gives you the great kitchen.")},lose:{r:"The roast is late, the bread is early, and the sweet things never come. Nobody starves, but everyone notices.",fx:{rep:-3,perf:-4}}},{t:"Make one dish they will never forget",check:{s:"craft",s2:"int",d:55},win:{r:"The rest is plain, but the one great dish is talked about until the next feast. The lord asks for you by name.",fx:{rep:8,fame:1,skill:{craft:3}}},lose:{r:"The great dish collapses on the way to the table. It is talked about until the next feast.",fx:{rep:-4,happy:-4}}},{t:"Hire extra hands from the town (6 suns)",req:p=>p.coin>=6,r:"Six more pairs of hands, and everything comes out right. The steward grumbles about the cost and eats three helpings.",fx:{coin:-6,rep:3,perf:3}}]},{id:"tr_cook_hungry",opp:["cook"],minRank:1,cool:5,title:"Twenty loaves and a sheep",setup:(p,ctx)=>{const g=grp(p);ctx.who=g==="steppe"||g==="giant"?"a company of Highland crossbowmen, who will eat only chestnut bread and cheese and complain about everything else":A.chance(.5)?"two giants from the north at six hundred suns a month each, and the contract says the house feeds them: twenty loaves and a sheep a day, apiece":"thirty orc mercenaries on double rations, who have been a month on the road"},text:"Your lord has hired {who}. The kitchen has never fed anything so hungry. The steward has given you the stores and a warning: hungry soldiers in a castle are worse than enemies outside it.",choices:[{t:"Work out the stores to the last sack",check:{s:"logistics",s2:"int",d:48},win:{r:"Bread baked at night, broth that never empties, meat on the right days. They eat, and they behave.",fx:{rep:6,perf:5,skill:{logistics:3}}},lose:{r:"The stores run out in the third week. There is a fight in the yard over the last of the cheese.",fx:{rep:-4,perf:-5}}},{t:"Feed them first, with honor, as guests are fed",r:"You serve them at their own fire with the best you have and bow as you do it. Their captain sends you a gift when they leave.",fx:{coin:10,rep:3,honor:2,newRel:{type:"friend",op:30}}},{t:"Thin gruel. They are hired swords, not guests",check:{s:"intimidation",s2:"wil",d:52},win:{r:"They grumble, and they eat it. You save the house a great deal of money.",fx:{coin:12,perf:3,honor:-1}},lose:{r:"They break into the kitchen at night and eat everything, including your dinner, and leave you sitting in it.",fx:{health:-6,cause:"a hungry mercenary",rep:-5,perf:-6}}}]},{id:"tr_cook_poached",opp:["cook"],minRank:2,cool:8,title:"An offer across the river",setup:(p,ctx)=>{mkLord(p,ctx),ctx.rival=patron(p)},text:"{rival}, who has eaten at your lord's table twice this year and talked of nothing but the food, sends a man with an offer: double your wage, a room of your own and a kitchen twice the size. Your own master, {lord}, will take it as an insult if you go.",choices:[{t:"Go",r:"A bigger kitchen, a bigger purse, and an enemy in the house you left.",fx:{coin:60,rep:4,them:{type:"enemy",op:-30}}},{t:"Use the offer to win a raise",check:{s:"persuasion",s2:"trade",d:50},win:{r:"{lord} matches it, sourly, and tells everyone you were never going to leave.",fx:{coin:40,rep:3,them:{type:"acquaint",op:-5}}},lose:{r:'"Then go," says {lord}. You go, but the offer has cooled by the time you arrive.',fx:{coin:15,rep:-2}}},{t:"Stay, out of loyalty",r:"{lord} hears of it, and of what you turned down. You eat at the steward's table now.",fx:{honor:3,perf:5,them:{type:"friend",op:25}}}]},{id:"tr_cook_subtlety",opp:["cook"],minRank:2,minRep:50,time:2,cool:8,title:"The sugar castle",setup:(p,ctx)=>{ctx.lord=patron(p)},text:"{lord} wants a subtlety for the great feast: a castle of sugar paste, with towers, banners and a moat of jelly, carried in on a board by four men. Sugar comes from Ranpur at eight suns a kilogram and the castle needs twenty. {lord} pays for the sugar. The glory or the shame is all yours.",choices:[{t:"Build it tower by tower, a month of nights",check:{s:"craft",s2:"int",d:58},win:{r:"It comes in to trumpets. The guests stand up. A visiting prince asks to meet the cook, which no prince has ever done in that house.",fx:{coin:60,rep:12,fame:2,masterwork:"the sugar castle of {lord}'s feast"}},lose:{r:"It is the steam from the soup that does it. The west tower sags, then the gate, then the whole castle bows to the high table like a drunk.",fx:{rep:-6,happy:-6,wil:1}}},{t:"Make it smaller, and perfect",check:{s:"craft",s2:"wil",d:48},win:{r:"A small castle, but every window glazed with clear sugar. The ladies keep pieces of it as keepsakes.",fx:{coin:40,rep:8}},lose:{r:"Small and cracked. Nobody is impressed by a small cracked thing.",fx:{rep:-3}}},{t:"Keep back five kilograms of sugar to sell",check:{s:"stealth",s2:"deception",d:52},win:{r:"The castle has fewer towers than planned. Nobody counts towers. Forty suns of sugar go out the kitchen door.",fx:{coin:40,honor:-4,rep:4}},lose:{r:"The steward weighs the castle afterward, which nobody does, except this steward.",fx:{rep:-10,honor:-4,perf:-10}}}]},{id:"tr_cook_pies",opp:["cook"],minRank:1,maxRank:2,cool:5,title:"Pies for the road",cond:(p,C)=>free(p),text:"Every pilgrim, carter and drover on the road through {home} wants something hot that fits in a hand. A cookshop stall by the gate would cost you twelve suns for the first season's rent. Meat is dear. Other things are cheaper, and nobody can see inside a pie.",choices:[{t:"Rent the stall and bake honest pies",req:p=>p.coin>=12,check:{s:"craft",s2:"trade",d:45},win:{r:"Mutton, onion and pepper. The queue reaches the gate by noon. You clear thirty suns over the season.",fx:{coin:18,rep:5,skill:{trade:2}}},lose:{r:"Too dear for the drovers, too plain for the pilgrims. You make your rent back, just.",fx:{coin:0,rep:1}}},{t:"Rent the stall and bake cheap pies",req:p=>p.coin>=12,check:{s:"deception",s2:"trade",d:45},win:{r:"Mostly onion, some of it meat, all of it hot. The coin rolls in.",fx:{coin:30,honor:-2}},lose:{r:"A drover finds something in his pie that has a tail. The whole gate hears him.",fx:{coin:-12,rep:-8,honor:-2}}},{t:"Leave it. You have work enough",r:"Somebody else rents the stall. You eat their pies on the way home.",fx:{}}]},{id:"tr_cook_great_feast",opp:["cook"],minRank:3,minRep:60,time:2,cool:10,title:"The feast of a reign",cond:(p,C)=>!C.flag(p,"tr_cook_greatfeast"),setup:(p,ctx)=>{ctx.fest=fest(),ctx.food=food(p)},text:"{ruler} will hold the greatest feast in living memory at {fest}: two thousand guests, envoys from five realms, forty dishes over three days, and {food} enough to feed a town. Every cook in {capital} will answer to you. If it goes well, the songs will remember the food. If it goes badly, the envoys will.",choices:[{t:"Plan it for half a year, down to the last spoon",check:{s:"logistics",s2:"command",d:60},win:{r:"Three days, forty dishes and not one late. An envoy writes home that the court of {realmShort} eats better than his king.",fx:{coin:300,rep:15,fame:3,favor:10,masterwork:"the great feast of {year} at {capital}",flag:"tr_cook_greatfeast"}},lose:{r:"The second day collapses: a fire in the bake-house, cold roasts, a fight between two kitchens. The third day saves it, almost.",fx:{coin:150,rep:-4,favor:-4,flag:"tr_cook_greatfeast"}}},{t:"Build the feast around one dish nobody has seen",check:{s:"craft",s2:"int",d:62},win:{r:"A peacock roasted and sewn back into its feathers, breathing smoke from a wick in its beak. Envoys stand on benches to see. It is copied for a hundred years.",fx:{coin:300,rep:14,fame:4,favor:8,masterwork:"the smoking peacock of the feast of {year}",flag:"tr_cook_greatfeast"}},lose:{r:"The wick sets fire to the feathers in front of the high table. Some envoys laugh. The wrong ones.",fx:{coin:150,rep:-6,favor:-6,flag:"tr_cook_greatfeast"}}},{t:"Farm the work out to the great houses' cooks; take the credit",check:{s:"diplomacy",s2:"intrigue",d:55},win:{r:"Every house's cook does what they do best, and the whole feast is yours. Twenty cooks hate you, and the court loves you.",fx:{coin:250,rep:10,favor:8,masterwork:"the great feast of {year} at {capital}",flag:"tr_cook_greatfeast",newRel:{type:"rival",op:-20}}},lose:{r:"The cooks of the great houses feud through the whole feast. Their food is excellent. It just never arrives together.",fx:{coin:150,rep:-3,flag:"tr_cook_greatfeast"}}}]},{id:"tr_cook_camp",opp:["cook"],minRank:1,maxRank:2,cool:5,title:"The army's pot",setup:(p,ctx)=>{ctx.fee=25+rk(p)*10},text:"The {realmShort} army needs cooks for a summer on the march, at {fee} suns a month. Camp cooking is beans, salt meat and whatever the foragers bring in, for men who stand in their own filth. Camp fever kills more soldiers than the enemy does. You have noticed that the messes which boil their water get less fever. Nobody on Ardan knows why.",choices:[{t:"Go, and boil every drop the mess drinks",check:{s:"int",s2:"wil",d:48},win:{r:"The men laugh at your boiling pots. By midsummer they stop laughing: your mess has two sick when the next has twenty.",fx:pay((p,c)=>fee(c)*2,{rep:8,skill:{medicine:2,logistics:2}})},lose:{r:"The fever comes through the camp anyway, and through you.",fx:pay((p,c)=>fee(c),{health:-15,cause:"camp fever",wil:1})}},{t:"Go, and sell the officers' rations on the side",check:{s:"deception",s2:"trade",d:50},win:{r:"A little wine here, a ham there. You come home richer than any sergeant.",fx:pay((p,c)=>fee(c)*3,{honor:-3})},lose:{r:"The quartermaster catches you selling his ham. You are flogged at the wagon wheel.",fx:{health:-12,cause:"a flogging",honor:-3,wil:1.5}}},{t:"Stay home",r:"The army finds other cooks. Some of them come back.",fx:{}}]}]));
    A.defEvents([
      {
        id: "tr_cook_boots",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"tr_cook_vial_coin"),
        w: 1.5,
        title: "Good boots",
        setup: (p,ctx)=>{mk(p,ctx,"a stranger in good boots")},
        text: "The stranger in good boots is back. {They} sits at the end of your kitchen table as if {theyHe} belonged there, eating your bread, and says quietly that two hundred suns is a great deal of money to take for nothing.",
        choices: [
          {
            t: "Pay it back (200 suns)",
            req: p=>p.coin>=200,
            r: "{They} counts it, smiles, and goes. You hope that is the end of it.",
            fx: {coin:-200,unflag:"tr_cook_vial_coin",wil:1},
          },
          {
            t: "Reach for the cleaver",
            r: "You will not be frightened in your own kitchen.",
            fx: {
              unflag: "tr_cook_vial_coin",
              duel: {
                foe: "them",
                tier: 3,
                title: "the stranger in good boots",
                opts: {kind:"duel",place:"your kitchen",lethal:!0,toYield:!0,title:"Blood in the kitchen"},
              },
            },
          },
          {
            t: "Run to the steward and tell everything",
            check: {s:"persuasion",s2:"wil",d:50},
            win: {
              r: "The steward's men take {themHim} in the yard. You lose your purse and keep your place, and your life.",
              fx: {coin:-100,unflag:"tr_cook_vial_coin",favor:3,rep:2,them:{type:"enemy",op:-60}},
            },
            lose: {
              r: "The steward hears that you took the coin. You lose your place, and {theyHe} slips away in the fuss.",
              fx: p=>(delete p.flags.tr_cook_vial_coin,p.honor=A.clamp(p.honor-5,0,100),p.job&&(p.job=null),""),
            },
          },
        ],
      },
      {
        id: "tr_cook_d_grease",
        cond: (p,C)=>C.adult(p)&&J(p,"cook","brewer"),
        title: "Fire in the pan",
        text: "A pan of goose fat catches with a whoomp, and the flame climbs the wall towards the drying herbs and the smoke-hood. A kitchen boy freezes with a bucket of water in his hands.",
        choices: [
          {
            t: "Smother it with a wet sack",
            check: {s:"spd",s2:"ins",d:45},
            win: {r:"Sack, lid, done. The boy is still holding the bucket, open-mouthed.",fx:{perf:3,rep:1}},
            lose: {
              r: "You smother it, and the fat smothers your forearm.",
              fx: {health:-10,cause:"burning fat",wound:"burn"},
            },
          },
          {
            t: "Knock the bucket out of his hands",
            r: "Water on burning fat makes it worse. Everyone in a kitchen knows that, except the boy, who learns it now. The fire burns out in the pan.",
            fx: {perf:1},
          },
          {
            t: "Get everyone out of the kitchen",
            r: "The herbs go up, then the hood. The kitchen is black for a week, but nobody is hurt.",
            fx: {coin:-8,perf:-3},
          },
        ],
      },
      {
        id: "tr_cook_d_rats",
        cond: (p,C)=>C.adult(p)&&J(p,"cook","brewer")&&rk(p)>=1,
        cool: 6,
        title: "Rats in the larder",
        text: "Two days before the feast, you open the larder and something runs over your foot. The rats have been at the flour, the cheeses and the hanging hams. There is no time to buy everything again.",
        choices: [
          {
            t: "Cut away the gnawed parts and cook on",
            r: "A little less of everything, served with a little more sauce. Nobody notices. You notice.",
            fx: {perf:2,honor:-1},
          },
          {
            t: "Buy fresh at market prices (10 suns)",
            req: p=>p.coin>=10,
            r: "Ten suns out of your own pocket, and a clear conscience.",
            fx: {coin:-10,perf:4,honor:1},
          },
          {
            t: "Borrow a terrier and a boy and clear the house",
            check: {s:"husbandry",s2:"spd",d:40},
            win: {r:"Forty rats in a night. The steward pays for the dog's dinner and yours.",fx:{perf:4,coin:3}},
            lose: {
              r: "The terrier eats a ham and the boy is bitten. The rats watch from the rafters.",
              fx: {perf:-3,coin:-4},
            },
          },
        ],
      },
    ]);
    A.defEvents(O([{id:"tr_eng_countermine",opp:["engineer"],maxRank:1,cool:4,title:"Picks in the dark",text:"You are digging a mine under an enemy wall by candlelight, propping the roof with timber as you go. You stop to rest, and in the silence you hear it: other picks, through the earth ahead. The defenders are digging towards you.",choices:[{t:"Break through and fight them in the tunnel",r:"You put down the pick and pick up the short axe. The candle gutters.",fx:{wil:1,skill:{siegecraft:2},duel:{tier:2,title:"an enemy sapper",troop:"SP",opts:{kind:"brawl",place:"the mine tunnel",lethal:!1,toYield:!0,title:"Fight in the tunnel"}}}},{t:"Crawl back and warn the engineer",r:"The engineer has wet straw lit in your gallery and the smoke drawn into theirs. Their digging stops by noon.",fx:{rep:4,perf:4,skill:{siegecraft:2}}},{t:"Listen, count, and map their gallery",check:{s:"ins",s2:"int",d:44},win:{r:"Two picks, one basket, a little to the left and below. The engineer collapses their gallery onto it at dawn. He asks your name.",fx:andUp({rep:8,skill:{siegecraft:4},perf:5},[0],"He does not forget it.")},lose:{r:"You lean closer to listen and the earth between you gives way.",fx:{health:-14,cause:"a tunnel collapse",wound:"broken_ribs",wil:1}}}]},{id:"tr_eng_mill",opp:["engineer"],minRank:1,maxRank:2,cool:5,title:"Whose water",setup:(p,ctx)=>{ctx.temple=p.faith==="REL-06"?"monastery":temple(p),mkLord(p,ctx)},text:"The {temple} at {town} wants a water mill on its stream: a wheel to grind grain and a second shaft to work fulling hammers. {lord} says every mill on that stream belongs to the lord of the land by old right, and every sack ground in it owes a toll. Both sides want you to build the mill. Each wants it built for them.",choices:[{t:"Build it for the priests",check:{s:"craft",s2:"faith",d:45},win:{r:"An overshot wheel that turns in the driest summer. The priests grind for the whole valley and pray for you by name.",fx:{coin:40,rep:5,piety:2,them:{type:"enemy",op:-20}}},lose:{r:"The wheel is too small for the head of water. It turns, grudgingly. {lord} laughs.",fx:{coin:25,rep:-2}}},{t:"Build it for {lord}",r:"{lord} pays well, and the priests preach about greed on the next holy day, looking at you.",fx:{coin:60,rep:3,piety:-2,them:{type:"friend",op:20}}},{t:"Design one mill that pays both",check:{s:"diplomacy",s2:"siegecraft",d:55},win:{r:"Two wheels on one race: the priests grind free, the lord takes the toll from the fulling. Both sides think they won.",fx:{coin:55,rep:8,skill:{diplomacy:2}}},lose:{r:"Both sides think they lost. Neither pays in full.",fx:{coin:20,rep:-2}}}]},{id:"tr_eng_trebuchet",opp:["engineer"],minRank:2,minRep:45,time:2,cool:6,title:"The counterweight engine",setup:(p,ctx)=>{ctx.engine=A.pick(["Bad Neighbor","the Grey Mule","Wall-Breaker","Old Patience","the Bishop's Fist"]),ctx.town=war(p)?"a walled town of "+foe(p):"the walled town of a rebel lord"},text:"Silas Vane built the first counterweight engine at Tessar in 1065 and threw ninety-kilogram stones two hundred and fifty metres. Now every army wants one. The {realmShort} army wants one from you, before {town}. Built, an engine costs five thousand suns. Your fee is three hundred.",choices:[{t:"Build it to your own design, bigger",check:{s:"siegecraft",s2:"int",d:60},win:{r:"A longer arm, a heavier box, a sling released by a hook you designed in your head at night. The soldiers name it {engine}. On the ninth day the gate tower comes down.",fx:{coin:300,rep:14,fame:2,masterwork:"the great engine called {engine}",skill:{siegecraft:4}}},lose:{r:"The arm snaps on the third shot and kills a carpenter. You finish the siege with a smaller engine and a heavier heart.",fx:{coin:150,rep:-8,wil:1.5}}},{t:"Copy the proportions of Vane's engine exactly",check:{s:"siegecraft",s2:"craft",d:50},win:{r:"Not new, but true. It throws all summer and the wall comes down in the autumn.",fx:{coin:300,rep:8,skill:{siegecraft:3}}},lose:{r:"Your timber is not Vane's timber. The engine throws short and the defenders jeer.",fx:{coin:150,rep:-3}}},{t:"Build two small traction engines instead",r:"Forty men on the ropes of each, stones the size of a man's head. The wall is scratched. The siege drags on into winter.",fx:{coin:200,rep:2}}]},{id:"tr_eng_old_bridge",opp:["engineer"],minRank:1,cool:8,title:"The old bridge",setup:(p,ctx)=>{mkLord(p,ctx)},text:"The old bridge at {town} carries the market road and pays {lord} a penny a cart. You go under it in a boat and find what you feared: the pier footings are scoured hollow, and one pier has dropped a hand's breadth since spring. {lord} does not want to hear that a toll bridge must close.",choices:[{t:"Tell {lord} to close it, and why",check:{s:"persuasion",s2:"learning",d:50},win:{r:"You bring a plumb line and a drawing. {lord} closes the bridge and gives you the repair, grumbling about the lost tolls.",fx:{coin:40,rep:8,honor:2}},lose:{r:"{lord} calls you a coward and an alarmist, and keeps it open. You did your duty. You hope that will be enough.",fx:{rep:-2,flag:"tr_eng_bridge_doom",them:{type:"enemy",op:-20}}}},{t:"Shore it quietly with timber and say it will hold",r:"A few props, a fat fee, and a bridge that is open for market day. It will hold for a while.",fx:{coin:30,flag:"tr_eng_bridge_doom"}},{t:"Close it yourself with a chain and a sign",check:{s:"intimidation",s2:"wil",d:55},win:{r:"The whole market sees you lock the chain. {lord} is furious and cannot open it now without looking like a murderer.",fx:{rep:10,honor:4,fame:1,them:{type:"enemy",op:-35}}},lose:{r:"{lord}'s men take your chain off and you with it.",fx:{prison:1,why:"closing a lord's toll bridge",honor:3,flag:"tr_eng_bridge_doom"}}}]},{id:"tr_eng_pumps",opp:["engineer"],minRank:1,cool:5,title:"Water in the deep levels",text:"The mine at {town} has flooded below the third level, and the richest ore is under the water. The mine-master wants it pumped dry by autumn: a waterwheel on the stream, a shaft down into the dark, and a chain of buckets going round forever. He will pay well if it works and nothing if it does not.",choices:[{t:"A great wheel and a chain of buckets",check:{s:"siegecraft",s2:"craft",d:52},win:{r:"The wheel turns, the buckets clank, and by Harvest Home the miners are standing on wet rock again. The mine-master buys you a horse.",fx:{coin:80,rep:8,skill:{siegecraft:3}}},lose:{r:"The chain breaks every third day. The water wins.",fx:{coin:10,rep:-4}}},{t:"Drive a drainage tunnel out through the hillside",check:{s:"int",s2:"stewardship",d:58},win:{r:"A year of digging, and then the water runs out of the hill by itself, forever. They call it by your name.",fx:{coin:120,rep:12,fame:1,masterwork:"the drainage adit at {town}"}},lose:{r:"Your tunnel comes out three metres too high. The mine-master stops paying.",fx:{coin:20,rep:-6}}},{t:"Tell him the honest truth: it cannot be done cheaply",r:"He does not like it. He remembers it the next year, when the man who said yes has failed.",fx:{rep:3,honor:2}}]},{id:"tr_eng_their_engine",opp:["engineer"],minRank:2,cool:5,title:"Their engine",setup:(p,ctx)=>{ctx.enemy=war(p)?"The army of "+foe(p):"A rebel lord's army"},text:"{enemy} has built an engine out of bowshot and is throwing stones at the walls of {home} from dawn to dusk. One section of wall is cracking. The garrison captain wants an answer from you before the next stone.",choices:[{t:"Build an engine of your own and duel theirs",check:{s:"siegecraft",s2:"int",d:58},win:{r:"Four days of building on the wall walk, then six stones to find the range. The seventh smashes their throwing arm. The whole wall cheers.",fx:{rep:12,fame:2,skill:{siegecraft:4},favor:4}},lose:{r:"Their engine finds yours first.",fx:{rep:-4,health:-10,cause:"a flying stone",wound:"concussion"}}},{t:"Lead a night sally to burn it",check:{s:"stealth",s2:"ins",d:55},win:{r:"Pitch, rags and twenty brave men in the dark. Their engine burns like a festival bonfire.",fx:{rep:10,fame:3,honor:3,wil:1}},lose:{r:"Their sentries are awake. Half of you come back.",fx:{health:-16,cause:"a spear in the dark",wound:"deep_cut",rep:-2,wil:1.5}}},{t:"Build a second wall behind the crack",check:{s:"command",s2:"craft",d:48},win:{r:"Every man, woman and cart in {home} carrying stone. When the old wall falls, the enemy finds a new one behind it.",fx:{rep:8,skill:{command:3}}},lose:{r:"The new wall is not finished when the old one falls. The fighting in the breach is bad.",fx:{rep:-3,health:-8,cause:"fighting in the breach"}}},{t:"Break open the hidden jar of fire-oil",req:(p,C)=>C.flag(p,"tr_eng_fireoil"),r:"One pot of fire-oil, thrown by your own engine at night. Their engine burns on the grass, and so does the grass, and the water poured on it only spreads the fire. Nobody on the wall will ever forget the sight.",fx:{unflag:"tr_eng_fireoil",rep:12,fame:3,favor:6,skill:{siegecraft:2}}}]},{id:"tr_eng_fen",opp:["engineer"],minRank:1,cool:8,title:"Draining the fen",setup:(p,ctx)=>{ctx.lord=patron(p)},text:"{lord} wants the fen below {home} drained: dykes, ditches and a sluice to the river, and four hundred acres of black earth where there is now reed and water. The fowlers and eel-men who live in the fen will lose everything they have. The marsh fever will go with the water, if the physicians are right.",choices:[{t:"Drain it",check:{s:"craft",s2:"stewardship",d:52},win:{r:"Three summers of mud. The water goes, the wheat comes, and {lord} is very rich. The fen-folk are not.",fx:{coin:150,rep:8,honor:-2,newRel:{type:"enemy",op:-30}}},lose:{r:"The sluice fails in the first flood and the fen comes back as if it had never left.",fx:{coin:40,rep:-6}}},{t:"Persuade {lord} to give the fen-folk land in it",check:{s:"diplomacy",s2:"persuasion",d:55},win:{r:"Every fen family gets ten acres of the new earth. They dig your ditches for nothing.",fx:{coin:120,rep:10,honor:4,newRel:{type:"friend",op:35}}},lose:{r:"{lord} says the fen-folk are not your concern. They become your concern when they cut your dykes at night.",fx:{coin:60,rep:-2}}},{t:"Refuse the work",r:"Somebody else drains it. The fen-folk move to the town and work as day laborers.",fx:{honor:1}}]},{id:"tr_eng_fire_oil",opp:["engineer"],minRank:2,cool:8,title:"Lamp oil from the south",setup:(p,ctx)=>{mk(p,ctx,"a merchant with a sealed cart"),ctx.law=["POL-24","POL-12"].includes(p.realm)?"Here it is the crown's own weapon, and only the crown may buy it.":"It is illegal everywhere outside Sabra and the Nine Winds."},text:"{them} draws back a tarpaulin: six jars marked lamp oil from the south. It is fire-oil, that burns on water and cannot be put out, and it sells for two hundred suns a jar. {law} {They} thinks the defenders of {home} could use it, and that you are the one who knows how.",choices:[{t:"Buy a jar for the town's engines (200 suns)",req:p=>p.coin>=200,check:{s:"intrigue",s2:"siegecraft",d:52},win:{r:"One jar, hidden in the engine store and known to three men. If {home} is ever stormed, the attackers will burn.",fx:{coin:-200,skill:{siegecraft:3},flag:"tr_eng_fireoil",favor:3}},lose:{r:"A clerk talks. You are taken for smuggling.",fx:{coin:-200,punish:"smuggling"}}},{t:"Report {themHim} to the garrison",r:"The garrison seizes the cart. The captain thanks you, and quietly keeps two jars.",fx:{rep:4,honor:2,favor:2,them:{type:"enemy",op:-50}}},{t:"Refuse. That fire burns whoever holds it",r:"{They} shrugs and drives on to {town}.",fx:{}}]},{id:"tr_eng_plans",opp:["engineer"],minRank:2,cool:10,title:"An envoy's offer",setup:(p,ctx)=>{mk(p,ctx,"an envoy's secretary"),ctx.foe=foe(p)},text:"{themFull}, secretary to the envoy of {foe}, buys you dinner and asks friendly questions about the walls of {capital}: where they are thin, where the engines stand, how the water reaches the citadel. At the end of the meal {theyHe} slides a purse across the table. Three hundred suns, for drawings nobody would miss.",choices:[{t:"Take the purse and draw for {themHim}",check:{s:"intrigue",s2:"deception",d:58},win:{r:"Three hundred suns. You will lie awake every night the realm is at war.",fx:{coin:300,honor:-12,skill:{intrigue:2}}},lose:{r:"The secretary was being watched. So, now, are you. Then you are not being watched, because you are in chains.",fx:{punish:"treason"}}},{t:"Draw false plans and sell those",check:{s:"deception",s2:"siegecraft",d:55},win:{r:"Thick walls where they are thin, thin walls where they are thick. Three hundred suns, and an enemy that will one day attack the wrong place.",fx:{coin:300,rep:3,skill:{deception:3}}},lose:{r:"{They} checks your drawing against something {theyHe} already has. {They} smiles and leaves. You wonder who else is talking.",fx:{them:{type:"enemy",op:-40},wil:1}}},{t:"Report it to the crown",r:"The crown thanks you. The secretary is expelled, and the envoy's table goes cold for you.",fx:{favor:8,rep:5,honor:3,them:{type:"enemy",op:-50}}},{t:"Push the purse back and leave",r:"You leave without a word. You do not sleep well, but you sleep.",fx:{honor:2}}]},{id:"tr_eng_great_work",opp:["engineer"],minRank:3,minRep:60,time:3,cool:15,title:"The work of the realm",cond:(p,C)=>!C.flag(p,"tr_eng_greatwork"),setup:(p,ctx)=>{const sea=A.C.coast(p);ctx.work=sea?"an iron chain across the harbor mouth of {capital}, raised and lowered between two towers, so that no enemy fleet can ever enter":"a dam and sluices above {capital}, so that the spring floods never again drown the lower town",ctx.work=A.T(ctx.work,{}),ctx.mw=sea?"the harbor chain of "+capOf(p):"the great sluice of "+capOf(p)},text:"{ruler} wants {work}. It is the greatest work the realm has attempted in a hundred years: thousands of men, years of labor, and a treasury that will want to know where every sun went. As master of the realm's engines, it is yours.",choices:[{t:"Build it to last a thousand years",check:{s:"siegecraft",s2:"stewardship",d:64},win:{r:"Seven years. When it is finished, {ruler} comes to see it with the whole court and stands a long time without speaking. Your name is cut into the stone.",fx:{coin:500,rep:15,fame:5,favor:12,masterwork:"{mw}",flag:"tr_eng_greatwork",epithet:"the Engineer"}},lose:{r:"It is built, late and over cost, and it works. The treasurer never forgives you.",fx:{coin:250,rep:5,favor:-4,flag:"tr_eng_greatwork"}}},{t:"Build it fast, for a king who wants to see it finished",check:{s:"command",s2:"logistics",d:58},win:{r:"Three years of driving men like a general. It is finished in {ruler}'s lifetime, and {ruler} does not forget who did it.",fx:{coin:400,rep:12,favor:15,masterwork:"{mw}",flag:"tr_eng_greatwork"}},lose:{r:"Too fast. Men die on the works, and a section fails in its first year.",fx:{coin:200,rep:-6,honor:-3,flag:"tr_eng_greatwork",wil:1}}},{t:"Skim the treasury's money as it passes",check:{s:"intrigue",s2:"stewardship",d:60},win:{r:"A little from every cart of stone. The work is finished, a little thinner than drawn, and you are very rich.",fx:{coin:900,rep:6,honor:-8,masterwork:"{mw}",flag:"tr_eng_greatwork"}},lose:{r:"The treasurer's clerks are better at sums than you are at hiding them.",fx:{flag:"tr_eng_greatwork",favor:-20,rep:-15,prison:2,why:"robbing the crown's works"}}}]},{id:"tr_eng_crane",opp:["engineer"],minRank:1,maxRank:2,cool:5,title:"The treadwheel",setup:(p,ctx)=>{ctx.temple=temple(p)},text:"The master of works on the new {temple} at {home} wants a crane: a great treadwheel that two men walk in like squirrels, lifting a tonne of stone to the top of the walls. If it works, the walls will rise twice as fast. If the rope breaks, a tonne of stone falls on the masons below.",choices:[{t:"Build it with a ratchet, so the load cannot fall",check:{s:"siegecraft",s2:"craft",d:52},win:{r:"A wooden pawl that drops into the teeth of the wheel at every step. The rope breaks in the second month, and the stone stays exactly where it was.",fx:{coin:50,rep:8,skill:{siegecraft:3}}},lose:{r:"The pawl jams the wheel twice a day. The masons curse it and use it anyway.",fx:{coin:30,rep:1}}},{t:"Build it quick and plain",r:"It works. The masons stand well back when it lifts.",fx:{coin:40,rep:3}},{t:"Walk the wheel yourself on the first lift",check:{s:"sta",s2:"wil",d:45},win:{r:"Up goes the first stone, and the masons cheer the engineer who trusts his own work.",fx:{coin:45,rep:6,sta:.5}},lose:{r:"The other walker slips, the wheel runs back, and you are thrown out of it like a pea from a pod.",fx:{coin:40,health:-10,cause:"the treadwheel",wound:"bad_knee"}}}]}]));
    A.defEvents([
      {
        id: "tr_eng_bridge_falls",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"tr_eng_bridge_doom"),
        w: 1.5,
        title: "Market day",
        text: "Market day at {town}. You hear it from the far end of the street: a crack like a lightning stroke, a long rumble, and then screaming. The old bridge you warned about, or shored, has gone into the river with two carts and a crowd on it.",
        choices: [
          {
            t: "Into the river after them",
            check: {s:"sea",s2:"str",d:50},
            win: {
              r: "You pull out three people and a child. The town sees who went into the water first.",
              fx: {unflag:"tr_eng_bridge_doom",honor:5,fame:3,wil:1},
            },
            lose: {
              r: "The current takes you under the wreck. They pull you out on the third try.",
              fx: {unflag:"tr_eng_bridge_doom",honor:4,health:-15,cause:"drowning",wil:1.5},
            },
          },
          {
            t: "Take charge on the bank: ropes, boats, a line of men",
            check: {s:"command",s2:"int",d:48},
            win: {
              r: "You throw ropes, send boats and build a human chain. Most of them live because of it.",
              fx: {unflag:"tr_eng_bridge_doom",rep:6,honor:3,skill:{command:3}},
            },
            lose: {
              r: "Too many people shouting, and none of them listening to you.",
              fx: {unflag:"tr_eng_bridge_doom",wil:1,happy:-6},
            },
          },
          {
            t: "Go to the inquest and tell the truth about the bridge",
            r: "You tell them what you saw under the bridge, and what you were paid to say. Your name suffers. Your sleep improves.",
            fx: {unflag:"tr_eng_bridge_doom",rep:-6,honor:4,newRel:{type:"enemy",op:-30}},
          },
        ],
      },
      {
        id: "tr_eng_d_scroll",
        cond: (p,C)=>C.adult(p)&&(J(p,"engineer")||J(p,"mason","carpenter")&&rk(p)>=1),
        cool: 8,
        title: "An old Solen book",
        text: "A book-seller at the market has a crumbling copy of an old Solen book on engines, aqueducts and the lifting of weights, with drawings in faded red ink. He wants forty suns. He has no idea what it is.",
        choices: [
          {
            t: "Buy it (40 suns)",
            req: p=>p.coin>=40,
            r: "You read it every night for a year, the parts you can make out. Half of it is wrong. The other half is gold.",
            fx: {coin:-40,skill:{siegecraft:4,learning:3},int:.5},
          },
          {
            t: "Copy the drawings at the stall while he haggles with others",
            check: {s:"int",s2:"stealth",d:48},
            win: {
              r: "Two hours, a stub of charcoal and the back of a bill. You get the three drawings that matter.",
              fx: {skill:{siegecraft:3}},
            },
            lose: {r:'"Buy it or go," he says, and shuts the book on your fingers.',fx:{happy:-1}},
          },
          {
            t: "Tell him what it is worth to the right buyer",
            r: "He sells it to a scholar for two hundred suns and sends you a cask of wine.",
            fx: {honor:2,happy:2},
          },
        ],
      },
    ]);
    const ORE = {
        "POL-13": "silver",
        "POL-31": "copper",
        "POL-05": "copper",
        "POL-10": "iron",
        "POL-28": "iron",
        "POL-29": "iron",
        "POL-08": "tin",
        "POL-09": "tin",
        "POL-17": "copper",
        "POL-20": "gold",
        "POL-25": "iron",
        "POL-19": "rock salt",
        "POL-22": "iron",
        "POL-26": "iron",
        "POL-01": "copper",
      },
      ore = p=>ORE[p.realm]||"silver",
      MINEOWN = {
        "POL-13": "the Silver Chest of Highcastle",
        "POL-31": "the Copper Miners of Albina",
        "POL-05": "the Copper Guild of Mossreach",
        "POL-10": "the Mine-Masters of Irondeep",
        "POL-28": "the Mine-Masters' Guild",
        "POL-29": "the Mine-Masters of Emberdeep",
        "POL-08": "the Tin Reeves of Wolfhaven",
      },
      mineOwner = p=>MINEOWN[p.realm]||"the mine's owners";
    A.defEvents(O([{id:"tr_mine_door",opp:["miner"],maxRank:0,cool:3,title:"The air door",text:"Your work is a door. You sit alone in the dark beside it all day, and when a cart comes you open it, and when the cart has passed you shut it fast, so that the air the fires draw through the mine goes where it must. If you sleep, men further in will breathe bad air. Your candle has just gone out.",choices:[{t:"Sit in the dark and count the carts by sound",check:{s:"wil",s2:"ins",d:38},win:{r:"Eleven hours in the black. You learn the voice of every cart and every carter. At the end of the shift the boss pats your head.",fx:{wil:1,perf:4}},lose:{r:"You doze. The door stands open an hour. Somebody comes out coughing, and you get the strap.",fx:{perf:-5,health:-4,cause:"the strap",wil:1}}},{t:"Leave the door and go for a light",r:"You come back with a candle to find the shift boss holding the door himself. He does not say anything. He does not need to.",fx:{perf:-3}},{t:"Sing, loud, to stay awake",r:"The carters start singing back from the dark. By the end of the week half the level knows your song.",fx:{perf:2,skill:{music:2},happy:2}}]},{id:"tr_mine_vein",opp:["miner"],maxRank:1,cool:5,title:"A fat vein",setup:(p,ctx)=>{ctx.ore=ore(p),mk(p,ctx,"your shift boss")},text:"Your pick opens a seam of {ore} as thick as your arm, running back into the rock further than your lamp can show. By custom the finder gets a bonus. {them}, the shift boss, has seen it too, and is already talking as if {theyHe} found it.",choices:[{t:"Claim it loudly in front of the whole gang",check:{s:"persuasion",s2:"wil",d:48},win:{r:"The gang backs you. The finder's bonus is yours, and so is the gang's respect.",fx:{coin:25,rep:5,them:{type:"rival",op:-20}}},lose:{r:"The gang looks at its boots. {them} takes the bonus, and you get the wet face next week.",fx:{coin:2,happy:-4,them:{type:"rival",op:-25}}}},{t:"Let {themHim} have it, for a share and a favor",r:"{They} takes the credit and slips you half. You have a friend in the boss's chair.",fx:{coin:12,them:{type:"friend",op:25}}},{t:"Hide the best of it and work it alone at night",check:{s:"stealth",s2:"craft",d:52},win:{r:"Two weeks of night shifts and a sack of rich ore sold to a man in {town}. Better than any bonus.",fx:{coin:40,honor:-3,sta:.5}},lose:{r:"The night watchman follows your lamp down the ladder.",fx:{punish:"theft"}}}]},{id:"tr_mine_prospect",opp:["miner"],minRank:1,cool:6,title:"Color in the stream",cond:(p,C)=>free(p),setup:(p,ctx)=>{ctx.ore=ore(p),ctx.hills=["POL-10","POL-28","POL-29"].includes(p.realm)?"the dwarves' own hills, where prospecting gets strangers killed":"the hills above {town}, which belong to nobody anyone can name",ctx.hills=A.T(ctx.hills,{}),ctx.owner=mineOwner(p)},text:"On your day off you find bright grains of {ore} in a stream bed in {hills}. Where there is color in the stream there is a lode somewhere above it. A lode of your own would change everything.",choices:[{t:"Follow the stream up into the hills",check:{s:"survival",s2:"craft",d:52},win:{r:"Three days of climbing and there it is, in a rock face under a thorn bush. You sell the claim to a mining company for a small fortune.",fx:{coin:120,rep:6,skill:{survival:2,craft:2}}},lose:{r:"The color peters out in a bog. You come home with wet feet and a story.",fx:{happy:-2,sta:.5}}},{t:"Sell the secret to {owner}",r:"They pay you thirty suns to forget the stream, then send their own men.",fx:{coin:30,rep:2}},{t:"Leave it. Somebody owns those hills",r:"Somebody always does.",fx:{}}]},{id:"tr_mine_water",opp:["miner"],cool:5,title:"The water breaks in",text:"A pick goes through into an old flooded working nobody knew was there. Black water bursts out of the face at chest height, roaring, and fills the gallery faster than a man can walk. Five men are further in than you.",choices:[{t:"Go back for them",check:{s:"sta",s2:"wil",d:55},win:{r:"Up to your neck in black water, a rope in your teeth. You bring out four. The fifth is never found.",fx:{honor:5,fame:2,wil:1.5,rep:5,newRel:{type:"friend",op:40}}},lose:{r:"The water knocks you down and rolls you along the floor. The others pull you out by your hair.",fx:{health:-18,cause:"drowning",wound:"lungs",wil:1.5,honor:3}}},{t:"Run for the shaft and sound the alarm",r:"The bell rings, the pumps start, and men come down with ropes. Three of the five come up alive.",fx:{rep:2,wil:1,happy:-4}},{t:"Climb to the old gallery above and break through to them",check:{s:"craft",s2:"int",d:52},win:{r:"You know this rock. Twenty minutes with a pick and you open a hole above the water. All five crawl out through it.",fx:andUp({honor:4,rep:10,fame:2,skill:{craft:3}},[0,1],"The owners give you men of your own to lead.")},lose:{r:"You break through into the wrong place. By the time you find them, two are gone.",fx:{wil:1.5,happy:-6}}}]},{id:"tr_mine_wage_cut",opp:["miner"],minRank:1,maxRank:1,cool:5,title:"The new rate",cond:(p,C)=>free(p),setup:(p,ctx)=>{ctx.Owner=A.cap(mineOwner(p))},text:"{Owner} have cut the rate per basket by a sixth, and fined every man who complains. The men are meeting tonight in the old working, by candlelight, to talk about putting down their picks.",choices:[{t:"Speak at the meeting, and lead them out",check:{s:"persuasion",s2:"wil",d:52},win:{r:"Two weeks with the picks down. The owners give back the old rate. The men give you their trust.",fx:{coin:5,rep:8,fame:1,newRel:{type:"friend",op:30}}},lose:{r:"The owners bring in men from {town}. You are named as a troublemaker and lose your place.",fx:p=>(p.job&&(p.job=null),A.willGrow(p,1.5,"defeat"),p.happy=A.clamp(p.happy-6,0,100),"")}},{t:"Go to the meeting, say nothing, and tell the owners",r:"Five suns and a better face to work. The men never learn who told, but some of them wonder.",fx:{coin:5,perf:5,honor:-6}},{t:"Stay away and keep digging",r:"Less money, the same work. You keep your place, and your head down.",fx:{coin:-3,wil:.5}}]},{id:"tr_mine_highgrade",opp:["miner"],minRank:2,cool:5,title:"Rich ore in the boots",setup:(p,ctx)=>{ctx.ore=ore(p),mk(p,ctx,"a miner of your shift")},text:"The richest {ore} from the new face is going missing: lumps the size of a walnut, carried up the ladders in boots and under tongues. You know who is doing it. {them} has five children and a wife coughing in the cold, and is the best hand with a pick on your shift.",choices:[{t:"Search the shift at the shaft head",r:"You find it in {them}'s boot. The owners take {theirHis} pay for a month and {theirHis} place for good.",fx:{rep:5,perf:6,them:{type:"enemy",op:-40}}},{t:"Warn {themHim} quietly, once",r:"{They} stops, and works for you like two men from then on.",fx:{honor:2,them:{type:"friend",op:40}}},{t:"Take a cut and look the other way",check:{s:"deception",s2:"intrigue",d:50},win:{r:"A share of every walnut. The owners never notice.",fx:{coin:30,honor:-4,them:{type:"friend",op:10}}},lose:{r:"The owners' assayer notices the yield is down, and works out where.",fx:{rep:-10,coin:-20,honor:-4}}}]},{id:"tr_mine_dwarf_contract",opp:["miner"],minRank:2,cool:8,title:"A dwarven contract",setup:(p,ctx)=>{mk(p,ctx,"a dwarven sapper-master")},text:"The owners want the new shaft sunk faster than any human gang can manage, and have sent for dwarven sappers. Their master, {them}, lays a contract on the table in the counting house: carved, witnessed and three pages long. Break a dwarven contract, they say, and you pay threefold and are remembered for three hundred years.",choices:[{t:"Read every line before you sign",check:{s:"learning",s2:"int",d:50,bonus:p=>p.race==="dwarf"?15:0},win:{r:"You find the clause about who pays for flooding, and have it changed. {them} looks at you with something like respect.",fx:{rep:8,skill:{learning:2},them:{type:"friend",op:25}}},lose:{r:"You miss the clause about flooding. The shaft floods. The owners pay, and remember who signed.",fx:{rep:-6,coin:-20}}},{t:"Work beside the dwarves and learn",r:"They work in silence and never waste a blow. You come away with a dozen tricks and a sore back.",fx:{skill:{craft:5},them:{type:"acquaint",op:15}}},{t:"Tell the owners your own men can do it",check:{s:"command",s2:"craft",d:58},win:{r:"Your gang, stung by the very idea, sinks the shaft in record time. The owners save a fortune.",fx:{coin:40,rep:10,skill:{command:2}}},lose:{r:"Your men cannot match the pace. The dwarves come anyway, and charge more for the delay.",fx:{rep:-5}}}]},{id:"tr_mine_shaft",opp:["miner"],minRank:2,minRep:40,time:2,cool:10,title:"A new shaft",setup:(p,ctx)=>{ctx.ore=ore(p),ctx.name=A.pick(["Long Hope","Widow's Luck","Deep Maren","Fortune","Old Grudge"])},text:"The old workings are worked out. The owners will put up the money for a new shaft on the hill, three hundred feet down to where you think the {ore} lode runs, if you will stake your name on where to dig. If you are right, the town lives another fifty years. If you are wrong, it is your name on the hole.",choices:[{t:"Read the rock and choose the place yourself",check:{s:"craft",s2:"int",d:58},win:{r:"Two years down, and at three hundred and ten feet, the lode. The men call the shaft {name} and drink to you every Saturday.",fx:{coin:150,rep:14,fame:2,masterwork:"the {name} shaft"}},lose:{r:"Three hundred feet of nothing. The owners stop paying. The shaft becomes a well for the town.",fx:{coin:-20,rep:-10,wil:1.5}}},{t:"Ask the old miners where their fathers would have dug",r:"You dig where the old men point. It is a good lode, not a great one, and the old men are proud.",fx:{coin:80,rep:6,newRel:{type:"friend",op:25}}},{t:"Sink a test pit first, and wait a year",r:"The owners grumble at the delay. The test pit shows the lode further east than anyone thought.",fx:{coin:60,rep:8,skill:{craft:2}}}]},{id:"tr_mine_sappers",opp:["miner"],minRank:1,cool:4,title:"Sappers wanted",cond:(p,C)=>free(p),setup:(p,ctx)=>{ctx.town=war(p)?"a town of "+foe(p):"a rebel lord's castle"},text:"The {realmShort} army is besieging {town}, and the engineers want miners to dig under the walls: twenty-five suns a month, soldier's pay, and a share of the plunder. Sapping is mining with the enemy listening on the other side of the rock.",choices:[{t:"Go, and dig",check:{s:"craft",s2:"wil",d:50},win:{r:"Six weeks under the wall. You fire the props, the corner of the tower drops into the ditch, and the army goes in over it. Your share of the plunder is fat.",fx:{coin:70,rep:6,skill:{siegecraft:4},wil:1}},lose:{r:"The defenders dig a countermine and come through into your gallery with knives.",fx:{coin:25,health:-16,cause:"a knife in a mine",wound:"deep_cut",wil:1.5}}},{t:"Go, and stay at the back of the gallery",r:"You dig, you listen, you live. The pay is soldier's pay.",fx:{coin:25,skill:{siegecraft:2}}},{t:"Stay. Your own mine needs you",r:"Half your gang goes. The ones who come back have money and nightmares.",fx:{perf:3}}]},{id:"tr_mine_inquest",opp:["miner"],minRank:3,cool:8,title:"The inquest",setup:(p,ctx)=>{ctx.Owner=A.cap(mineOwner(p)),ctx.n=A.pick(["three","four","five","seven","nine"])},text:"A roof fall in the east level has killed {n} men. As mine-warden you must hold the inquest and say why. You know why: the owners stopped paying for timber props last year. {Owner} would like the inquest to find that the dead men were careless.",choices:[{t:"Find the truth, and write it down",check:{s:"wil",s2:"learning",d:55},win:{r:"The finding is read out in the square. The owners pay blood-money to every widow and props go back in every level.",fx:{rep:10,honor:6,fame:2,newRel:{type:"enemy",op:-30}}},lose:{r:"You write the truth. The owners have you replaced as warden, and the next warden writes something else.",fx:{rep:2,honor:6,coin:-30,wil:1.5}}},{t:"Find that the men were careless",r:"The widows get nothing. The owners give you a silver cup. You never drink from it.",fx:{coin:60,honor:-8,rep:-3}},{t:"Find for the owners, but make them pay the widows quietly",check:{s:"intrigue",s2:"diplomacy",d:52},win:{r:"No blame in public, blood-money in private, and new props in every level. The widows will never know who arranged it.",fx:{rep:5,honor:1}},lose:{r:"The owners agree, then forget. The widows remember only the finding.",fx:{rep:-4,honor:-3}}}]},{id:"tr_mine_ore_fair",opp:["miner"],minRank:1,cool:4,title:"The ore fair",setup:(p,ctx)=>{ctx.ore=ore(p),ctx.fair=["POL-08","POL-09"].includes(p.realm)?"the Tin Fair at Skarfell, where giants weigh the ore in scales as big as boats":"the ore fair at "+capOf(p)},text:"Your gang has a share of {ore} to sell at {fair}. The buyer's scales look honest. The buyer's weights look a little light, and his assayer has a thumb like a ham.",choices:[{t:"Demand the town's weights",check:{s:"trade",s2:"intimidation",d:48},win:{r:"The town's weights come out, and so does the truth: a sixth short. The gang gets every sun it is owed.",fx:{coin:20,rep:5,skill:{trade:2}}},lose:{r:"The buyer is the town's weigher's brother-in-law. You sell short anyway.",fx:{coin:8,happy:-3}}},{t:"Sell to a rival buyer at a lower price but honest weights",r:"Fewer suns per basket, more baskets per sun. It comes out about even, and nobody is cheated.",fx:{coin:14}},{t:"Damp the ore the night before to make it heavier",check:{s:"deception",s2:"craft",d:45},win:{r:"A cheat for a cheat. The gang drinks well that night.",fx:{coin:22,honor:-2}},lose:{r:"The assayer squeezes a handful and water runs out between his fingers.",fx:{coin:5,rep:-5,honor:-2}}}]}]));
    A.defEvents([
      {
        id: "tr_mine_d_knocking",
        cond: (p,C)=>C.adult(p)&&J(p,"miner"),
        title: "The knocking",
        text: "In the far level, in the quiet between shifts, you hear it: knock, knock, knock, from inside the rock. The old miners say it is the dead men of old falls, knocking to warn the living. The young ones say it is the rock settling. Either way, the gang wants to go home.",
        choices: [
          {
            t: "Heed it. Everyone out",
            r: "The gang follows you out. Two nights later the far level comes down with nobody in it. Ghosts or rock, you were right.",
            fx: {rep:5,honor:2,newRel:{type:"friend",op:25}},
          },
          {
            t: "Mock it and work on",
            check: {s:"wil",s2:"ins",d:50},
            win: {
              r: "The knocking stops. Water, dripping on a loose board. The young miners laugh at the old ones for a month.",
              fx: {perf:4,wil:.5},
            },
            lose: {
              r: "The roof sags, groans and drops a slab the size of a cart just behind you.",
              fx: {health:-12,cause:"a rockfall",wound:"back",wil:1.5},
            },
          },
          {
            t: "Go and look for the source alone",
            check: {s:"craft",s2:"int",d:45},
            win: {
              r: "A cracked prop, flexing with every breath of the mine. You replace it before the shift comes back. The knocking stops. The old men nod.",
              fx: {rep:4,skill:{craft:2}},
            },
            lose: {
              r: "You find nothing, and come back up white-faced. The gang does not go down that night.",
              fx: {perf:-2,happy:-2},
            },
          },
        ],
      },
      {
        id: "tr_mine_d_sunday",
        cond: (p,C)=>C.adult(p)&&J(p,"miner")&&free(p),
        cool: 6,
        title: "A day in the light",
        text: "A day off, and the sun on your face for the first time in a week. You cough in the clean air, as every miner does. Your knees ache. Your family wants you at the fair, and the alehouse wants you more.",
        choices: [
          {
            t: "Take the children to the fair",
            r: "Honey cakes, a juggler and a bear on a chain. The children talk about it all winter.",
            fx: {happy:6,coin:-2},
          },
          {
            t: "Lie in the meadow and sleep",
            r: "You sleep for six hours in the grass with your mouth open. The best day of the year.",
            fx: {health:4,happy:3},
          },
          {
            t: "Drink with the gang until dark",
            r: "Songs of the deep levels, old jokes, and a head like a rockfall in the morning.",
            fx: {happy:4,coin:-2,health:-2,newRel:{type:"friend",op:20}},
          },
        ],
      },
    ]);
    A.defEvents(O([{id:"tr_labor_harvest",opp:["labor"],maxRank:1,cool:2,title:"Harvest wages",text:"First Loaf to Harvest Home: the only weeks of the year when a laborer's back is worth a sun and a half a day, and ale at noon. A big farmer outside {home} wants reapers for his wheat before the weather breaks. His fields are long, and so are his days.",choices:[{t:"Reap in the front line with the strongest",check:{s:"sta",s2:"str",d:45},win:{r:"Six weeks with a sickle, dawn to dark. Your hands are leather, your back is iron, and your purse has never been so full.",fx:{coin:30,str:.8,sta:.8,rep:3}},lose:{r:"You fall behind the line in the second week and are put to binding sheaves for half pay.",fx:{coin:14,sta:.5,health:-4,cause:"sunstroke"}}},{t:"Bind sheaves behind the reapers",r:"Steady work for steady pay. You sing with the binders and eat the farmer's bread.",fx:{coin:18,happy:2}},{t:"Glean the stubble at night as well",check:{s:"stealth",s2:"sta",d:40},win:{r:"The dropped ears add up. A sack of wheat for the winter, and nobody the poorer for it.",fx:{coin:22,sta:.5}},lose:{r:"The farmer's dogs think gleaning by moonlight is stealing. So does the farmer.",fx:{coin:12,health:-5,cause:"a dog bite",wound:"bite"}}}]},{id:"tr_labor_split_sack",opp:["labor"],maxRank:1,cool:3,title:"The split sack",setup:(p,ctx)=>{ctx.quay=p.realm==="POL-04"?"the Staple quays of Lucerna, where every grain ship pays one bushel in twenty":"the grain quay"},text:"You are carrying sacks off a grain ship on {quay} when one splits on your shoulder, and wheat pours across the stones. The weigher's men are at the far end of the quay arguing with the captain. A dozen beggar children are already creeping closer.",choices:[{t:"Sweep it into your shirt",check:{s:"stealth",s2:"spd",d:40},win:{r:"Ten pounds of wheat in your shirt and the rest swept into the harbor. Bread for a week.",fx:{coin:2,honor:-1}},lose:{r:"The weigher's man turns round at the wrong moment. You lose a day's pay as a fine.",fx:{coin:-1,perf:-4}}},{t:"Call the weigher and own it",r:"He docks you for the sack and writes you down as honest, which is worth something on the quay.",fx:{coin:-1,perf:4,honor:2}},{t:"Let the children have it",r:"They swarm the stones like sparrows. The weigher's men come shouting, but there is nothing left to shout at.",fx:{honor:3,piety:1,perf:-2}}]},{id:"tr_labor_chest",opp:["labor"],minRank:1,cool:4,title:"A heavy chest",setup:(p,ctx)=>{mk(p,ctx,"a merchant who pays in advance")},text:"{themFull} pays you three suns, three days' wages, to carry an iron-bound chest across {home} after curfew, to a house by the river, and to forget the house. The chest is heavier than it should be, and something inside clinks like plate.",choices:[{t:"Carry it and ask nothing",r:"You carry it, you forget it, and you are three suns richer. In your trade, that is a good night.",fx:{coin:3,str:.4,them:{type:"acquaint",op:10}}},{t:"Look inside on the way",check:{s:"stealth",s2:"int",d:48},win:{r:"Silver cups with a temple's sun on them. You deliver it, and sell what you saw to the temple's men for ten suns.",fx:{coin:13,skill:{intrigue:2},them:{type:"enemy",op:-20}}},lose:{r:"The lock is noisy. Two men step out of a doorway: the merchant does not trust porters either.",fx:{coin:3,health:-10,cause:"a beating",them:{type:"enemy",op:-30}}}},{t:"Carry it straight to the watch-house",check:{s:"persuasion",s2:"wil",d:45},win:{r:"The watch opens it: stolen plate from a merchant's house. The reward is ten suns, and the watch-captain remembers you.",fx:{coin:13,rep:5,honor:3,them:{type:"enemy",op:-50}}},lose:{r:"The watch takes the chest, and the three suns, and you, for being out after curfew.",fx:{coin:-3,honor:1,them:{type:"enemy",op:-50}}}}]},{id:"tr_labor_dyke",opp:["labor"],maxRank:2,cool:5,title:"The dyke",setup:(p,ctx)=>{ctx.lead=p.realm==="POL-18"?"Every man of Tamar owes a month of dyke work a year, and dodgers are branded. This year the flood is high.":"The river has been rising for three days."},text:"{lead} Tonight the reeve's men are banging on every door: the dyke above {home} is leaking, and if it goes, the lower town goes with it. Your own house is in the lower town.",choices:[{t:"Fill sacks at the breach all night",check:{s:"sta",s2:"str",d:48},win:{r:"Mud to the waist and rain in your eyes until dawn. The leak is plugged. The reeve writes your name in his book.",fx:{coin:3,sta:1,honor:3,rep:4}},lose:{r:"The bank slumps under you and you go into the water. They pull you out with a hook.",fx:{health:-12,cause:"the flood",honor:2,wil:1}}},{t:"Save your own house first",r:"You carry your family and your pot up to the church. The dyke holds without you. The reeve notices who was missing.",fx:{happy:2,rep:-3,honor:-1}},{t:"Organize the sack-line",check:{s:"command",s2:"wil",d:46},win:{r:"Forty frightened people and one loud voice. By dawn the sack-line is a machine and the dyke holds. The reeve marks you down as someone who can lead men.",fx:andUp({coin:5,rep:8,fame:1,skill:{command:3}},[0,1])},lose:{r:"Nobody listens to a laborer. You fill sacks with the rest.",fx:{coin:2,sta:.5}}}]},{id:"tr_labor_gang",opp:["labor"],minRank:2,cool:3,title:"Your own gang",setup:(p,ctx)=>{ctx.job=A.pick(["dig the new ditch outside the north gate","clear the burned street after the fire","cart stone for the new town wall","deepen the harbor mud at low tide"]),ctx.fee=A.ri(40,70)},text:"The council wants a gang of thirty to {job}. They pay the foreman {fee} suns for the job and let him pay the men as he likes. Every foreman in {home} keeps a water penny or two out of every man's sun.",choices:[{t:"Pay the men fairly, and keep a fair share",r:"Your gang works hard for a foreman who pays. The job is done early and the council notices.",fx:pay((p,c)=>fee(c)/4,{rep:6,honor:2,newRel:{type:"friend",op:25}})},{t:"Keep the water penny like everyone else",r:"The men grumble and work slow. You make a good deal more.",fx:pay((p,c)=>fee(c)/2,{honor:-2,rep:-1})},{t:"Bid low, win the job, and drive them hard",check:{s:"command",s2:"intimidation",d:50},win:{r:"Finished in half the time. The council gives you the next three jobs. Your men hate you and come back anyway.",fx:pay((p,c)=>fee(c)/2,{rep:8,skill:{command:2}})},lose:{r:"The men walk off the job at noon on the third day. The council fines you for the delay.",fx:{coin:-10,rep:-6}}}]},{id:"tr_labor_walkout",opp:["labor"],minRank:1,cool:5,title:"The porters' rate",cond:(p,C)=>free(p),text:"The merchants of {home} have agreed among themselves to cut the porters' rate by a penny a load. The porters are gathering at the fountain at dawn, and somebody has to speak. Every eye has turned to you.",choices:[{t:"Speak, and lead them out",check:{s:"persuasion",s2:"wil",d:50},win:{r:"Three days with no porters on the quays. Ships wait, goods rot, merchants shout. On the fourth day the old rate is back, and your name is known on every quay.",fx:{coin:3,rep:8,fame:2,newRel:{type:"friend",op:30}}},lose:{r:"The merchants hire men from {town} and the watch breaks up the fountain with staves.",fx:{health:-8,cause:"a watchman's stave",rep:2,wil:1,newRel:{type:"enemy",op:-25}}}},{t:"Work for the merchants while the others stand",r:"Double pay for a week, and nobody on the quay will share a jug with you after that.",fx:{coin:8,honor:-4,rep:-4}},{t:"Stay home until it is over",r:"You lose a week's work and keep your head down. Whatever happens happens without you.",fx:{coin:-4}}]},{id:"tr_labor_baggage",opp:["labor"],maxRank:2,cool:4,title:"The baggage train",setup:(p,ctx)=>{ctx.why=war(p)?"for the war with "+foe(p):"for the summer march along the border"},text:"The army wants carters and porters for the baggage train {why}: a sun a day, bread, and a place behind the soldiers where the arrows usually do not reach. Usually.",choices:[{t:"Sign on for the summer",check:{s:"sta",s2:"ins",d:48},win:{r:"A summer of dust, mud and mules. Riders hit the train once, and you are under a wagon when they do. You come home with a full purse.",fx:{coin:40,sta:1,wil:.5}},lose:{r:"Riders hit the train in a gully. You get a spear-cut and lose the wagon you were paid to guard.",fx:{coin:15,health:-14,cause:"raiders on the road",wound:"scar_arm",wil:1.5}}},{t:"Sign on, and sell army stores on the side",check:{s:"deception",s2:"stealth",d:50},win:{r:"A sack of oats here, a cask of salt pork there. You come home richer than a sergeant.",fx:{coin:60,honor:-3}},lose:{r:"The quartermaster counts the casks. You are flogged at the wagon wheel and sent home without pay.",fx:{health:-12,cause:"a flogging",wil:1.5,honor:-3}}},{t:"Stay. The town still needs backs",r:"Fewer laborers in town means better pay for those who stay. Not a bad summer.",fx:{coin:15}}]},{id:"tr_labor_night_soil",opp:["labor"],maxRank:1,cool:5,title:"Night-soil",setup:(p,ctx)=>{ctx.lady=patron(p)},text:"Night-carters empty the town's cesspits after curfew for double pay, and nobody wants to stand near them. Tonight, at the bottom of {lady}'s pit, your shovel turns up a gold ring with a seal on it. The whole street has heard that {lady} lost a ring, and wept.",choices:[{t:"Wash it and take it to the door",r:"The steward holds his nose, then holds out a purse. Ten suns, and {lady} sends a message of thanks to a night-carter, which has never happened before.",fx:{coin:10,honor:3,rep:3}},{t:"Sell it to a goldsmith in another town",check:{s:"stealth",s2:"trade",d:44},win:{r:"Twenty-five suns from a goldsmith in {town} who asks no questions.",fx:{coin:25,honor:-3}},lose:{r:"The goldsmith knows the seal and sends for the watch.",fx:{punish:"theft"}}},{t:"Keep it as a charm",r:"You wear it on a string round your neck under your shirt. It is the finest thing you will ever own.",fx:{happy:4,honor:-1}}]},{id:"tr_labor_press",opp:["labor"],maxRank:1,cool:5,title:"The press-gang",cond:(p,C)=>C.coast(p)&&free(p),text:"A galley captain is short of oarsmen, and his men are working the waterfront with clubs and a rope. A hired oarsman earns twelve suns a month, and a pressed one earns whatever the captain feels like. They are coming down your alley.",choices:[{t:"Run for it over the roofs",check:{s:"spd",s2:"athletics",d:44},win:{r:"Up a drainpipe, across three roofs and down into the tannery yard. You lose a shoe and keep your freedom.",fx:{spd:.5,skill:{athletics:2}}},lose:{r:"A loose tile, a fall, and a rope round your wrists before you can stand.",fx:{health:-6,cause:"a fall",coin:20,str:1,sta:1,wil:1.5}}},{t:"Stand and fight",r:"You pick up a plank.",fx:{duel:{tier:2,title:"a press-gang bully",troop:"SP",opts:{kind:"brawl",place:"a waterfront alley",lethal:!1,toYield:!0,title:"The press-gang"}}}},{t:"Go quietly and row the season",r:"A season on the bench, a sore back, salt in every cut, and twenty suns at Sea Closing. You come home harder.",fx:{coin:20,str:1,sta:1,health:-6,cause:"the oar bench",wil:1}}]},{id:"tr_labor_sack_race",opp:["labor"],maxRank:2,cool:3,title:"The porters' race",setup:(p,ctx)=>{ctx.At=A.cap("at "+fest())},text:"{At} the porters race with full sacks of wheat on their backs from the fountain to the church door and back. The prize is five suns and a ham. The favorite is a half-giant of a man from the tannery who has won four years running.",choices:[{t:"Run it to win",check:{s:"str",s2:"sta",d:52},win:{r:"You pass him at the church door and do not look back. Five suns, a ham, and every girl and boy in the square cheering.",fx:{coin:5,fame:1,str:.5,happy:5}},lose:{r:"Halfway back your legs turn to water. You finish fifth and are carried to the alehouse anyway.",fx:{sta:.5,happy:1}}},{t:"Bet your week's wage on the favorite",check:{s:"gambling",s2:"int",d:40},win:{r:"He wins, as he always does. You drink to him with his own money.",fx:{coin:4,skill:{gambling:1}}},lose:{r:"A young porter from the quay beats him. Your week's wage is gone.",fx:{coin:-5}}},{t:"Enter with a sack that is half sawdust",check:{s:"deception",s2:"spd",d:45},win:{r:"You fly. Five suns and a ham, and nobody weighs the winner's sack.",fx:{coin:5,honor:-2}},lose:{r:"The sack splits at the church door in a cloud of sawdust. The whole fair laughs for a year.",fx:{honor:-3,rep:-3,happy:-4}}}]}]));
    A.defEvents([
      {
        id: "tr_labor_d_back",
        cond: (p,C)=>C.adult(p)&&J(p,"labor"),
        title: "The back",
        text: "You bend for a sack you have lifted ten thousand times, and something low in your back goes with a click and a white flash. You cannot stand straight. Tomorrow's work will not wait for you.",
        choices: [
          {
            t: "Rest it for two weeks",
            r: "Two weeks of no pay and lying on the floor. It heals, mostly.",
            fx: {coin:-8,health:4},
          },
          {
            t: "See the bone-setter (1 sun)",
            req: p=>p.coin>=1,
            check: {s:"sta",s2:"wil",d:40},
            win: {
              r: "He kneels on you, pulls your leg and something goes back with a clunk. You walk out straight.",
              fx: {coin:-1,health:6},
            },
            lose: {
              r: "He kneels on you, pulls your leg, and nothing gets better except his purse.",
              fx: {coin:-1,health:-4,cause:"a bad back"},
            },
          },
          {
            t: "Work through it",
            check: {s:"sta",s2:"wil",d:50},
            win: {
              r: "You work bent for a week, then less bent, then straight. Tougher than you look.",
              fx: {wil:1,sta:.5},
            },
            lose: {
              r: "It never quite comes right. Every porter over forty walks like you do now.",
              fx: {wound:"back",health:-8,cause:"a bad back",wil:1},
            },
          },
        ],
      },
      {
        id: "tr_labor_d_winter",
        cond: (p,C)=>C.adult(p)&&J(p,"labor")&&free(p),
        cool: 4,
        title: "No work in winter",
        setup: (p,ctx)=>{ctx.elders=elders(p)},
        text: "Snow on the quays and ice on the river. No ships, no building, no harvest. Two hundred laborers crowd the gate at dawn for twenty days of work. Your children are hungry, and so are you.",
        choices: [
          {
            t: "Pawn your cloak",
            r: "Four suns for the cloak, bread for a month, and a winter colder than any you remember.",
            fx: {coin:4,health:-5,cause:"the cold",wil:1},
          },
          {
            t: "Queue for the temple bread",
            r: "A loaf a day from {elders}, and a sermon with it. You eat both.",
            fx: {piety:2,happy:-2,wil:.5},
          },
          {
            t: "Cut wood in the lord's forest for a share",
            check: {s:"str",s2:"sta",d:45},
            win: {
              r: "Ten days of axe-work in the snow. The lord gets the wood and you get a cartload of your own. A warm house and a little to sell.",
              fx: {coin:6,str:.5,sta:.5},
            },
            lose: {
              r: "Frost in your fingers by the third day.",
              fx: {wound:"frostbite",health:-6,cause:"the cold",coin:2},
            },
          },
        ],
      },
    ]);
    // [X1 baked patch core/02-content-fixes EVT-TEXT-DIET] The text diet (event text <= 80 words, choices <= 12) had
    // three misses: two 13-word choices, and rl_sec_calf, whose 59-word intro plus the public story it pulls from the
    // lore rendered at about 83 words.
    A.defEvents(O([{id:"tr_serv_dish",opp:["servant"],maxRank:0,cool:3,title:"The silver dish",text:"Scrubbing pots in the scullery, elbow-deep in grease and sand, you knock the master's silver dish off the bench. It hits the flagstones with a sound like a bell, and when you pick it up there is a dent in the rim the size of your thumb.",choices:[{t:"Take it to the steward and confess",r:"The steward takes the cost out of your wage for three months. He also tells the cook you are honest, which matters more.",fx:{coin:-3,perf:3,honor:2}},{t:"Beat the dent out yourself, at night",check:{s:"craft",s2:"stealth",d:40},win:{r:"A wooden spoon, a folded cloth and an hour of tapping by the banked fire. The dent is gone. Nobody ever knows.",fx:{skill:{craft:2}}},lose:{r:"You make it worse, and the cook catches you at it.",fx:{coin:-4,perf:-5,honor:-1}}},{t:"Slide it to the back of the shelf and say nothing",check:{s:"deception",s2:"wil",d:38},win:{r:"It is a month before anyone uses it, and by then three people have touched it.",fx:{honor:-2}},lose:{r:"The steward counts the plate every Saturday. He finds it, and finds you.",fx:{perf:-8,health:-4,cause:"a boxed ear",honor:-2}}}]},{id:"tr_serv_guest",opp:["servant"],minRank:1,maxRank:2,cool:4,title:"A guest's questions",setup:(p,ctx)=>{mk(p,ctx,"a guest of the house")},text:"{themFull}, who is staying three nights, tips you a whole sun for warming the bed. Then {theyHe} asks, very lightly, who has visited your master this month, and whether your master sleeps well, and where he keeps his letters.",choices:[{t:"Answer, for another sun or two",check:{s:"intrigue",s2:"deception",d:45},win:{r:"You tell {themHim} enough to earn five suns and nothing that could be traced to you.",fx:{coin:6,honor:-3,skill:{intrigue:2},them:{type:"acquaint",op:15}}},lose:{r:"The steward sees the coins change hands and wants to know what for.",fx:{coin:1,perf:-8,honor:-3}}},{t:"Smile, know nothing, and tell the steward",r:"The steward tells the master. The master watches his guest very carefully for the rest of the visit, and remembers your name.",fx:{coin:1,perf:6,honor:2,them:{type:"acquaint",op:-15}}},{t:"Keep the sun and keep your mouth shut",r:"Servants who know nothing keep their places longest.",fx:{coin:1}}]},{id:"tr_serv_letter",opp:["servant"],maxRank:2,cool:5,title:"A sealed letter",setup:(p,ctx)=>{ctx.mistress=A.pick(["your mistress","your master's sister","the young lady of the house"]),ctx.Mistress=A.cap(ctx.mistress)},text:"{Mistress} gives you a letter sealed with plain wax, not the house seal, and a penny, and asks you to take it to a house in {town} and give it into no hand but the one who opens the door. The steward is watching from the stair.",choices:[{t:"Deliver it, and ask nothing",r:"A tired young man opens the door, reads it on the step and goes white. You never learn why. {Mistress} smiles at you for a year.",fx:{coin:1,perf:3,newRel:{type:"friend",op:25}}},{t:"Open it on the road and read it",req:p=>p.literate,check:{s:"stealth",s2:"intrigue",d:48},win:{r:"A plan to leave the house forever on the night of the next feast. You reseal it with a warm knife. Now you know something.",fx:{coin:1,skill:{intrigue:3},flag:"tr_serv_knows"}},lose:{r:"The seal cracks wrong. The young man at the door sees it at once.",fx:{perf:-8,honor:-3}}},{t:"Give it to the steward",r:"The steward reads it and takes it upstairs. There is shouting in the house all night. You are not thanked, exactly.",fx:{perf:4,honor:-2,coin:2}}]},{id:"tr_serv_books",opp:["servant"],minRank:2,cool:6,title:"The steward's books",setup:(p,ctx)=>{mk(p,ctx,p.job&&p.job.r>=3?"your under-steward":"the steward")},text:"Going through the house accounts for the quarter day, you find it: thirty suns a year paid for candles nobody burned, oats no horse ate and a carpenter who does not exist. The hand is {them}'s. You could tell the master. You could also make the same thing happen in your own column.",choices:[{t:"Lay the books before the master",check:{s:"learning",s2:"persuasion",d:50},win:{r:"The master reads every page you show him. {them} is gone by noon, and you have {theirHis} keys.",fx:{rep:8,perf:8,coin:10,them:{type:"enemy",op:-50}}},lose:{r:"{them} has served the family twenty years. The master believes {themHim}, and wonders about you.",fx:{perf:-10,rep:-4,them:{type:"enemy",op:-50}}}},{t:"Let {themHim} know you know",check:{s:"intrigue",s2:"wil",d:52},win:{r:"A quiet word on the back stair. A purse appears under your pillow every quarter day after.",fx:{coin:30,honor:-5,them:{type:"acquaint",op:-20}}},lose:{r:"{They} strikes first, and finds a silver spoon in your box that you never put there.",fx:p=>(p.honor=A.clamp(p.honor-6,0,100),A.addRep(p,-10),p.flags.unfree?"You are flogged in the yard for a theft you never did.":(p.job=null,"You are turned out without a reference."))}},{t:"Start a phantom carpenter of your own",check:{s:"deception",s2:"stewardship",d:55},win:{r:"A man named Hob who mends gates that are never broken. He earns you twenty suns a year.",fx:{coin:20,honor:-5,skill:{stewardship:2}}},lose:{r:"The master's new clerk asks to meet Hob.",fx:{punish:"theft",rep:-10}}}]},{id:"tr_serv_great_guest",opp:["servant"],minRank:1,cool:4,title:"A great guest",setup:(p,ctx)=>{ctx.guest=patron(p),ctx.food=food(p)},text:"{guest} is coming to dine, and the whole house is mad with it: {food}, the good linen, every candle in the store. Your master's future may turn on this dinner. You have been put in charge of the high table.",choices:[{t:"Every cup, every course, every bow exactly right",check:{s:"etiquette",s2:"int",d:50},win:{r:"Not a drop spilled, not a word out of place. {guest} asks your master where he found such a servant.",fx:andUp({perf:8,rep:6,skill:{etiquette:3}},[1],"The steward takes you on as his own man.")},lose:{r:"You serve the wine from the wrong side. Your master turns red. {guest} pretends not to notice, which is worse.",fx:{perf:-6,rep:-3}}},{t:"Listen to everything said at the table",check:{s:"intrigue",s2:"ins",d:48},win:{r:"By the sweet course you know what {guest} wants from your master, and what {guest} fears. That is worth knowing.",fx:{skill:{intrigue:3},flag:"tr_serv_knows"}},lose:{r:"You stand too close to listen. The steward moves you to the far end.",fx:{perf:-3}}},{t:"Make friends with {guest}'s own servants in the kitchen",check:{s:"persuasion",s2:"etiquette",d:42},win:{r:"Two of them are your sort. You will hear from that house for years.",fx:{newRel:{type:"friend",op:30},skill:{persuasion:2}}},lose:{r:"They are proud and you are a country servant to them.",fx:{happy:-2}}}]},{id:"tr_serv_heir_dice",opp:["servant"],cool:6,title:"The heir's dice",setup:(p,ctx)=>{mk(p,ctx,"the heir of the house"),ctx.n=A.ri(30,60)},text:"{them}, heir to the house, finds you alone in the pantry. {They} owes {n} suns in dice debts to a man from the docks who has started sending friends. {They} wants you to take two silver candlesticks to a pawnbroker in {town}, and swear to {theirHis} father that they were stolen.",choices:[{t:"Do it",check:{s:"deception",s2:"stealth",d:48},win:{r:"The candlesticks are pawned, the debt is paid, and the master blames a hired carter. The heir owes you now, and remembers it.",fx:{honor:-4,them:{type:"friend",op:35}}},lose:{r:"The pawnbroker knows the house's mark. The master hears it from him, and you are the one who carried them.",fx:{punish:"theft",them:{type:"friend",op:10}}}},{t:"Refuse, and say nothing",r:"{They} goes to someone else. The candlesticks go anyway. You keep your hands clean.",fx:{honor:2,them:{type:"acquaint",op:-15}}},{t:"Tell the master, gently",check:{s:"diplomacy",s2:"etiquette",d:50},win:{r:"The master pays the debt, beats nobody, and sends his son to the country for a year. He gives you a sun and a look of something like gratitude.",fx:{coin:1,perf:8,rep:4,them:{type:"enemy",op:-30}}},lose:{r:"The master does not want to hear it from a servant. You are moved to the stables.",fx:{perf:-6,them:{type:"enemy",op:-30}}}}]},{id:"tr_serv_great_house",opp:["servant"],minRank:1,maxRank:2,cool:6,title:"A great house",cond:(p,C)=>free(p),setup:(p,ctx)=>{ctx.lord=patron(p)},text:"The steward of {lord}'s castle, where a hundred servants eat in the lower hall, has heard good things about you. He offers a place: better coat, better food, better wages, and a hundred people above you instead of five. Your own master is old and kind, and pays late.",choices:[{t:"Take the place in the great house",check:{s:"etiquette",s2:"persuasion",d:45},win:{r:"You find your feet in a month and your friends in two. The steward marks you for advancement.",fx:{coin:10,rep:6,perf:3,newRel:{type:"friend",op:20}}},lose:{r:"A great house is a small town full of knives. You keep your place, barely, and learn who to avoid.",fx:{coin:5,rep:1,wil:1,newRel:{type:"rival",op:-20}}}},{t:"Stay with your old master",r:"He weeps when you tell him, and writes you into his will.",fx:{honor:3,happy:3,flag:"tr_serv_loyal"}},{t:"Use the offer to get a better wage at home",check:{s:"persuasion",s2:"trade",d:45},win:{r:"Your old master matches it, sighing. You get the wage and the kindness both.",fx:{coin:8}},lose:{r:'"Then go," he says, hurt. You go.',fx:{coin:5,happy:-4}}}]},{id:"tr_serv_rents",opp:["servant"],minRank:3,cool:5,title:"Rents after a bad harvest",setup:(p,ctx)=>{ctx.lord=patron(p)},text:"A wet summer, a thin harvest, and the tenants of {lord}'s estate cannot pay the rents due on the September quarter day in full. {lord} is at court, spending as if the harvest had been fat, and has written to you: every penny, on the day, or the tenants go.",choices:[{t:"Collect every penny",check:{s:"intimidation",s2:"stewardship",d:48},win:{r:"You collect it all. Three families go on the road. {lord} writes to praise you.",fx:{rep:6,perf:6,honor:-4,favor:1,newRel:{type:"enemy",op:-30}}},lose:{r:"You cannot get blood from a stone. The rents come in short, and so does {lord}'s temper.",fx:{rep:-4,perf:-5}}},{t:"Take half now, half after the next harvest",check:{s:"stewardship",s2:"persuasion",d:52},win:{r:"You write to {lord} with figures that prove it is the only way to get anything at all. {lord} grumbles and agrees. No family goes on the road.",fx:{rep:8,honor:4,skill:{stewardship:3}}},lose:{r:"{lord} does not read figures. {lord} reads disobedience.",fx:{rep:-6,honor:3}}},{t:"Make up the gap from the estate's woods and fishponds",check:{s:"stewardship",s2:"trade",d:55},win:{r:"Timber sold, carp sold, a stand of old oak sold to a shipwright. The rents are full and the tenants stay. {lord} never knows how close it was.",fx:{rep:10,perf:8,skill:{stewardship:3,trade:2}}},lose:{r:"You sell the oaks too cheap and the fish too late. Nobody is happy, least of all you.",fx:{rep:-3}}}]},{id:"tr_serv_keys",opp:["servant"],minRank:2,cool:10,title:"The keys",setup:(p,ctx)=>{mk(p,ctx,"the elder heir")},text:"Your master died in the night. Before dawn the two heirs are in the hall, each with friends, each saying the will favors them, and the will is in the strongbox. You hold the keys to the strongbox, the plate room and the wine cellar. {them}, the elder, holds out {theirHis} hand for them.",choices:[{t:"Keep the keys until the reeve and a priest come",check:{s:"wil",s2:"etiquette",d:52},win:{r:"You stand in front of the strongbox until the reeve comes. The will is read in front of witnesses. Both heirs hate you a little, and both trust you.",fx:{rep:10,honor:5,fame:1,them:{type:"acquaint",op:-10}}},lose:{r:"{them}'s friends take the keys from you, not gently.",fx:{health:-6,cause:"a scuffle",honor:4,them:{type:"enemy",op:-30}}}},{t:"Give them to {them}",r:"The will says what {them} says it says. You keep your place, and the younger heir never forgives you.",fx:{perf:6,honor:-2,them:{type:"friend",op:30},newRel:{type:"enemy",op:-30}}},{t:"Take your back wages from the strongbox first",check:{s:"stealth",s2:"deception",d:48},win:{r:"Exactly what you are owed and not a penny more. Nobody ever counts that closely.",fx:{coin:20,honor:-1}},lose:{r:"The younger heir walks in while the strongbox is open.",fx:{punish:"theft"}}},{t:"Ask for the will to be read now: the master trusted you",req:(p,C)=>C.flag(p,"tr_serv_loyal")||C.flag(p,"tr_serv_saved"),r:"The will is read in the hall with both heirs glaring. It names you: twenty suns and the cottage by the orchard, for faithful service. Nobody can argue with a dead man.",fx:{coin:20,asset:"cottage",honor:3,unflag:"tr_serv_loyal",rep:4}}]},{id:"tr_serv_cup",opp:["servant"],minRank:1,cool:8,title:"Something in the cup",setup:(p,ctx)=>{mk(p,ctx,"a guest at your master's table")},text:"Pouring at the high table, you see it from behind: {them}'s hand passes over your master's cup, and something small drops into the wine. Nobody else saw. Your master is reaching for the cup now, laughing at a joke.",choices:[{t:"Stumble and spill it",check:{s:"spd",s2:"deception",d:45},win:{r:"Wine across the linen, your master's lap and your own face. You are cursed and sent to the kitchens. Your master lives to curse you again.",fx:{perf:-3,honor:2,flag:"tr_serv_saved"}},lose:{r:"You stumble too late. Your master drinks. He is sick for three days, and lives, and you never know if you should have shouted.",fx:{wil:1.5,happy:-6}}},{t:"Shout it out before the whole table",check:{s:"wil",s2:"persuasion",d:50},win:{r:"{them} goes for the door and is caught by the guards. Your master looks at you as if he had never seen you before. You are never just a servant in that house again.",fx:{rep:12,fame:2,honor:4,perf:10,coin:20,them:{type:"enemy",op:-60}}},lose:{r:"The cup is tested on a dog, which lives. {them} is a great guest and you are a servant who shouted. You are dismissed.",fx:p=>(p.honor=A.clamp(p.honor+1,0,100),A.addRep(p,-8),p.flags.unfree||(p.job=null),"")}},{t:"Say nothing. It is not your house",r:"Your master drinks. He is ill all winter. You never tell anyone what you saw.",fx:{honor:-4,wil:1}}]},{id:"tr_serv_royal",opp:["servant"],minRank:2,maxRank:2,minRep:55,cool:10,title:"The royal household",cond:(p,C)=>free(p),text:"A household officer of {ruler} came to dine with your master and watched you run the hall. Now a letter comes: a place in the royal household at {capital}, keeping a wing of the palace, under a steward who has the {rulerTitle}'s ear. A palace eats servants and spits out stewards, they say.",choices:[{t:"Go to court",check:{s:"etiquette",s2:"intrigue",d:55},win:{r:"You learn the palace in a season: whose door to knock on, whose to pass, which cook to bribe. The steward makes you steward of the east wing.",fx:p=>{const s=up(p);return A.addRep(p,10),A.fame(p,2),s}},lose:{r:"You last a year, make three enemies, and come home wiser.",fx:{rep:2,wil:1,newRel:{type:"enemy",op:-25}}}},{t:"Stay. Your master needs you",r:"Your master hears what you turned down and raises your wage without being asked.",fx:{coin:15,honor:3,perf:5}},{t:"Go, and report what you overheard at your master's table",req:(p,C)=>C.flag(p,"tr_serv_knows"),r:"A palace runs on knowing things. You arrive already useful, and the steward gives you a wing of your own in your first month.",fx:p=>{delete p.flags.tr_serv_knows;const s=up(p);return A.addRep(p,8),A.trainSkill(p,"intrigue",3),p.honor=A.clamp(p.honor-2,0,100),s}}]}]));
    A.defEvents([
      {
        id: "tr_serv_d_spoon",
        cond: (p,C)=>C.adult(p)&&J(p,"servant"),
        title: "The missing spoon",
        setup: (p,ctx)=>{mk(p,ctx,"another servant of the house")},
        text: "A silver spoon is missing from the plate chest, and the mistress has every servant lined up in the kitchen. {them} is standing next to you, sweating, and you saw {themHim} by the plate chest last night.",
        choices: [
          {
            t: "Say what you saw",
            r: "{them} is searched, and the spoon is in {theirHis} shoe. {They} is turned out before dinner. The rest of the kitchen is quiet with you for a while.",
            fx: {perf:5,honor:1,them:{type:"enemy",op:-50}},
          },
          {
            t: "Say nothing",
            r: "Everyone's wages are docked a penny until the spoon is paid for. {them} looks at you sideways for a month, then brings you an apple.",
            fx: {coin:-1,them:{type:"friend",op:20}},
          },
          {
            t: "Find the spoon yourself and put it back",
            check: {s:"stealth",s2:"int",d:45},
            win: {
              r: 'You find it under the mattress in the loft and slip it into the chest. "Found!" says the cook. {them} weeps on your shoulder that night.',
              fx: {honor:2,them:{type:"friend",op:40}},
            },
            lose: {
              r: "The housekeeper catches you with the spoon in your hand.",
              fx: {perf:-10,honor:-3,health:-4,cause:"a beating"},
            },
          },
        ],
      },
      {
        id: "tr_serv_d_below",
        cond: (p,C)=>C.adult(p)&&J(p,"servant")&&!C.married(p),
        cool: 6,
        title: "Below stairs",
        setup: (p,ctx)=>{const l=A.makeLoveInterest(p);l.occ="a servant of the house",ctx.pid=l.id,ctx.They=A.cap(A.he(l))},
        text: "{them} works in the same house, and has started saving you the warm end of the bench at supper and the last of the cream. Below stairs everyone knows everything, and the cook is already smiling at you both.",
        choices: [
          {
            t: "Walk out with {themHim} on your half-day",
            r: "A fair, a ribbon, a walk home the long way. The cook says I told you so.",
            fx: {happy:6,them:{type:"lover",op:40}},
          },
          {
            t: "Be kind, but keep your distance",
            r: "{They} understands. The warm end of the bench goes to someone else, and that is fair.",
            fx: {them:{type:"friend",op:15}},
          },
          {
            t: "Ask the steward's leave first, properly",
            check: {s:"etiquette",s2:"persuasion",d:40},
            win: {
              r: "The steward gives his blessing and a half-day for you both. The whole servants' hall drinks your health.",
              fx: {happy:7,perf:2,them:{type:"lover",op:45}},
            },
            lose: {
              r: "The steward forbids it. Servants who court make bad servants, he says. You court anyway, carefully.",
              fx: {happy:3,perf:-2,them:{type:"lover",op:35}},
            },
          },
        ],
      },
    ]);
  })();
})();
