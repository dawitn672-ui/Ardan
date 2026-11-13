// The release's event pack 10 of 30 (185 events, mostly rk_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-027). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const R = p=>p.mil&&(p.mil.merc?p.mil.contract:p.mil.realm)||p.realm,
      rk = p=>p.mil?p.mil.rank:-1,
      war = p=>{const r=R(p);return!!r&&A.atWar(r).length>0},
      mates = p=>A.squad(p).length>0,
      two = p=>A.squad(p).length>=2,
      band = (p,C,lo,hi)=>C.soldier(p)&&rk(p)>=lo&&rk(p)<=hi,
      low = (p,C)=>band(p,C,0,1),
      mid = (p,C)=>band(p,C,2,3),
      cpt = (p,C)=>band(p,C,4,6),
      gen = (p,C)=>band(p,C,7,9),
      crown = p=>!!p.mil&&!p.mil.merc,
      peace = (p,C)=>C.soldier(p)&&!war(p),
      vet = (p,C)=>C.adult(p)&&!p.mil&&!!p.veteran,
      vrank = p=>p.veteran?p.veteran.rank:0,
      battles = p=>p.mil?p.mil.battles||0:p.veteran&&p.veteran.battles||0,
      troop = (p,...t)=>!!p.mil&&t.includes(p.mil.troop),
      hurt = (p,...k)=>(p.wounds||[]).some(w=>k.includes(w.k)&&(!w.until||w.until>=A.S.year)),
      lowborn = p=>["slave","serf","peasant","artisan"].includes(p.status),
      highborn = p=>["gentry","noble","royal"].includes(p.status)||!!(p.noble&&p.noble.rung>=2),
      nm = (p,sex)=>{try{return A.givenName(p.cult,sex||"M")||"Tam"}catch{return"Tam"}},
      prov = id=>{try{return A.provName(id)||"home"}catch{return"home"}},
      foeId = p=>{const r=R(p);return r?A.enemyRealmOf(r):null},
      foeOf = p=>{const e=foeId(p);return e?A.realmShort(e):A.pick(["the enemy","the other side"])},
      faithName = p=>{const f=A.faith(p.faith);return f&&f.name?f.name:"the old gods"},
      kingOf = p=>{const r=A.realm(R(p)),ru=r?A.P(r.ruler):null;return ru&&ru.id!==p.id?A.rulerStyle(ru,r):"the crown"},
      capOf = p=>{const r=A.realm(R(p));return r&&r.capital?r.capital:"the capital"},
      ELITE = {
        "POL-01": "the Iron Guard",
        "POL-02": "the Knights of the Sun",
        "POL-03": "the Lion Guard",
        "POL-04": "the Lagoon Marines",
        "POL-05": "the King's Bowmen",
        "POL-06": "the Rangers of the Edge",
        "POL-07": "the Night Rangers of the Veil",
        "POL-08": "the King's Hird",
        "POL-09": "the Hall Pairs",
        "POL-10": "the Deep Gate Wardens",
        "POL-11": "Gorath's Hearth Guard",
        "POL-12": "the Silver Tablet Guard",
        "POL-13": "the Greycloak Companies",
        "POL-16": "the Purple Company",
        "POL-17": "the Guard of the Water Jar",
        "POL-20": "the Golden Horse",
        "POL-25": "the Bear Guard",
        "POL-26": "the Zorin Crossbows",
        "POL-28": "the Gate Wardens",
        "POL-29": "the Hammer Guard",
        "POL-30": "the Steel Guard",
        "POL-31": "the Queen's Six-Fingers",
        "POL-34": "the Ironhide Hearth Band",
      },
      elite = p=>{const o=Object.values(GD.ORDERS||{}).find(x=>x.realm===R(p));return o?o.name:ELITE[R(p)]||"the household guard"},
      drillOf = p=>{const r=R(p);return r==="POL-05"?"at the butts after the temple bell: twelve aimed arrows in a minute, or the sergeant wants to know why":r==="POL-01"?"planting stakes in a line, pulling them up and planting them again, until you can do it in the dark":["POL-02","POL-03","POL-15","POL-16","POL-31"].includes(r)?"spanning crossbows behind pavises, loose, duck, span again, to the sergeant's count":["POL-11","POL-34"].includes(r)?"running the two-minute waves to the drum: strike, fall back, breathe thirty breaths, strike again":r==="POL-12"?"riding the ring-hunt by flag on the open grass until the horses steam":["POL-10","POL-28","POL-29"].includes(r)?"gate drill in the shield-file, six to a rank, in torchlight, until the iron feels like skin":["POL-06","POL-07"].includes(r)?"moving through the trees a leaf of five at a time, without a sound":r==="POL-08"?"shield drill on the ice and rowing drill in the fjord":"changing the front rank on the horn call, again and again, until it happens without thinking"};
    function prep(p,ctx){const sq=A.shuffle(A.squad(p)),a=sq[0],b=sq[1],c=sq[2];a?ctx.pid=a.id:delete ctx.pid,ctx.m2=b?b.id:"",ctx.m3=c?c.id:"",ctx.mate=a?a.given:nm(p),ctx.mhe=a?A.he(a):"he",ctx.Mhe=A.cap(ctx.mhe),ctx.mhim=a?A.him(a):"him",ctx.mhis=a?A.his(a):"his",ctx.Mhis=A.cap(ctx.mhis),ctx.quirk=a&&a.quirk?a.quirk:"never says much",ctx.mhome=prov(a?a.home:p.home),ctx.mate2=b?b.given:nm(p),ctx.m2he=b?A.he(b):"he",ctx.M2he=A.cap(ctx.m2he),ctx.m2him=b?A.him(b):"him",ctx.m2his=b?A.his(b):"his",ctx.mate3=c?c.given:nm(p),ctx.foe=foeOf(p),ctx.unit=p.mil?p.mil.unit:"the company",ctx.rkt=p.mil?A.milTitle(p):"soldier",ctx.mr=A.realmShort(R(p)),ctx.uw=A.milUnitWord(Math.max(0,rk(p))),ctx.men=A.fmt((GD.MIL[Math.max(0,rk(p))]||GD.MIL[0]).leads),ctx.capt=nm(p),ctx.sarge=nm(p),ctx.lord=nm(p),ctx.npcw=nm(p,"F"),ctx.boy=nm(p),ctx.elite=elite(p),ctx.king=kingOf(p),ctx.cap2=capOf(p),ctx.drill=drillOf(p)}
    const fam = p=>A.family(p),
      fmil = p=>{const f=A.family(p);return f&&f.military?f.military:null},
      dyn = (p,C)=>C.famMil(p)||C.famKind(p,"gentry_mil"),
      unitShort = p=>{const m=fmil(p);if(!m||!m.unit)return"the family company";let u=String(m.unit).split(",")[0].trim();return/^a /i.test(u)&&(u="the "+u.slice(2)),/^the /i.test(u)||(u="the "+u),u};
    function prepF(p,ctx){const f=fam(p),m=fmil(p);ctx.fam=f&&f.name?f.name:"your family",ctx.Fam=A.cap(ctx.fam),ctx.fsur=f&&f.sur?f.sur:p.sur||"your",ctx.office=m&&m.office?m.office:"the family's old command",ctx.funit=unitShort(p),ctx.funitLong=m&&m.unit?m.unit:"the family company",ctx.words=f&&f.words?f.words:"Hold the Line",ctx.seat=f&&f.seat?f.seat:prov(p.home),ctx.since=f&&f.since?String(f.since):"time out of mind",ctx.ties=m&&m.ties?m.ties:"Every child of the family learns the roll of its dead before learning to read.",ctx.uncle=nm(p,"M"),ctx.aunt=nm(p,"F"),ctx.cousin=nm(p,A.chance(.7)?"M":"F"),ctx.old=nm(p,"M");const hp=f&&f.headPid?A.P(f.headPid):null;ctx.head=hp&&hp.id!==p.id?A.fullName(hp):"the head of the family",ctx.Head=A.cap(ctx.head);const lh=f&&f.liege?A.house(f.liege):null;ctx.lg=lh&&lh.name?lh.name:"your liege lord",ctx.Lg=A.cap(ctx.lg),ctx.foe=foeOf(p),ctx.mr=A.realmShort(p.realm)}
    const enlistFam = p=>{if(p.mil)return"";const r=A.enlist(p,!1);if(!r||!r.ok)return r&&r.msg||"The rolls are closed to you.";const u=unitShort(p);return p.mil&&u&&(p.mil.unit=u),p.mil&&(p.mil.merit+=15),`You are entered on the roll of ${u}.`},
      // [X1 baked patch events/99999-v2-content V2C-FX-PARTS] The soldier packs build 227 choices as both({ honor: 2,
      // ... }, op2(-30)): a closure whose source shows only "applyFx(p, obj, ctx)", so the card could read none of what
      // they do (playtest 2, old 18 and 19: "It will be remembered", "• changes regard" naming nobody). The closures now
      // carry their parts (A.V2C.parts: f.v2parts, and op2's regard and messmate as f.v2meta), which the chips read as
      // written. Nothing they do changes. In the source: write these effects as data, or give the helpers a way to say
      // what they hold.
      both = (obj,fn)=>(A.V2C&&A.V2C.parts||(f=>f))((p,ctx)=>{const a=A.applyFx(p,obj,ctx),b=fn(p,ctx);return[a,b].filter(x=>typeof x=="string"&&x).join(" ")},[obj,fn]),
      die1 = how=>(p,ctx)=>A.comradeDies(p,A.P(ctx.pid),how)||"",
      die2 = how=>(p,ctx)=>A.comradeDies(p,A.P(ctx.m2),how)||"",
      // [X1 baked patch events/99999-v2-content V2C-FX-PARTS] The soldier packs build 227 choices as both({ honor: 2,
      // ... }, op2(-30)): a closure whose source shows only "applyFx(p, obj, ctx)", so the card could read none of what
      // they do (playtest 2, old 18 and 19: "It will be remembered", "• changes regard" naming nobody). The closures now
      // carry their parts (A.V2C.parts: f.v2parts, and op2's regard and messmate as f.v2meta), which the chips read as
      // written. Nothing they do changes. In the source: write these effects as data, or give the helpers a way to say
      // what they hold.
      op2 = d=>(A.V2C&&A.V2C.parts||(f=>f))((p,ctx)=>{const c=A.P(ctx.m2);return c&&A.addOp(p,c,d),""},null,{op:d,who:"m2"}),
      gone2 = (p,ctx)=>{const c=A.P(ctx.m2);return c&&p.mil&&(p.mil.squad=p.mil.squad.filter(id=>id!==c.id)),""},
      desert = ()=>(A.desert(),"");
    A.defEvents([
      {
        id: "rk_first_kill",
        cond: (p,C)=>low(p,C)&&war(p),
        once: !0,
        w: 1.3,
        setup: prep,
        title: "The first one",
        text: ()=>`It happens fast. A ${A.pick(["levy man in a padded coat","boy with a hand-axe","bearded spearman","crossbowman who stood up too soon"])} comes at you out of the press, and your {weapon} goes in before you think. He sits down in the mud and looks surprised. Then he is dead, and you are someone who has killed a man.`,
        choices: [
          {
            t: "Look at his face. Remember it.",
            r: "You look until {mate} pulls you back into the line. You will see that face for the rest of your life, and you decided to.",
            fx: {wil:2.5,happy:-5,honor:2},
          },
          {
            t: "Take his purse and boots before someone else does",
            r: ()=>`${A.pick(["Four suns","Six suns and a bone comb","Three suns and a lucky stone"])} and boots a size too big. The second time is easier. That is what frightens you.`,
            fx: {coin:5,wil:1,honor:-2},
          },
          {
            t: "Say a prayer over him",
            r: p=>`You say the words ${faithName(p)} keeps for the dead, for a man whose gods you do not know. {mate} waits without a word.`,
            fx: {piety:4,wil:1.5,them:{op:5}},
          },
          {
            t: "Shrug it off and get back in line",
            check: {s:"wil",s2:"ins",d:45},
            win: {
              r: "You step over him and close up the file. The sergeant nods. Inside, something is locked away for later.",
              fx: {merit:3,wil:1.5,ins:.5},
            },
            lose: {
              r: "You step back into line and throw up on your own boots. Nobody laughs. Half of them did the same once.",
              fx: {wil:1.5,happy:-3},
            },
          },
        ],
      },
      {
        id: "rk_kit_inspection",
        cond: (p,C)=>low(p,C),
        setup: prep,
        title: "Kit inspection",
        text: ()=>`Kit inspection at dawn. The file-leader walks the line with a stick, and your ${A.pick(["spear-head has a bloom of rust on it","shield strap is split through","water flask is missing","helmet liner has rotted away"])}. Lost or ruined arms come out of your pay. Three men down the line, the stick stops.`,
        choices: [
          {
            t: "Own up and take the stoppage",
            r: "Two suns from your pay and a long look. But the file-leader remembers who told the truth.",
            fx: {coin:-2,merit:1,honor:1},
          },
          {
            t: "Borrow from {mate} for the morning",
            check: {s:"spd",s2:"deception",d:40},
            win: {
              r: "{mate} slips it to you behind your back as the stick comes. You pass. {Mhe} grins.",
              fx: {them:{op:6}},
            },
            lose: {
              r: "The file-leader sees the swap. Now you both scrub the latrine trench.",
              fx: {them:{op:-4},merit:-2,happy:-3},
            },
          },
          {
            t: "Fix it in the night with what you can find",
            check: {s:"craft",s2:"int",d:40},
            win: {
              r: "Sand, grease and a strip of harness. It looks better than new. You learn something about keeping things.",
              fx: {skill:{craft:3},merit:2},
            },
            lose: {
              r: "Your mending falls apart in the file-leader's hand. He holds it up for the whole file to see.",
              fx: {coin:-2,happy:-3},
            },
          },
        ],
      },
      {
        id: "rk_weevils",
        cond: (p,C)=>low(p,C),
        setup: prep,
        title: "Biscuit and worse",
        text: ()=>`The biscuit is so full of weevils that it moves. The salt pork is ${A.pick(["green at the edges","mostly fat and bristle","older than the youngest man in the file"])}. The mess of ten looks at the pot, and then at you, because it is your week to cook.`,
        choices: [
          {
            t: "Tap out the weevils and boil it all into a stew",
            check: {s:"survival",s2:"int",d:35},
            win: {
              r: "Biscuit, pork, a fistful of wild garlic and patience. The mess eats every scrap and calls you a genius.",
              fx: {skill:{survival:2},rel:{who:"comrade",op:4,all:!0},happy:2},
            },
            lose: {
              r: "It tastes like boiled boot. Half the mess is sick by morning.",
              fx: {health:-4,rel:{who:"comrade",op:-2,all:!0}},
            },
          },
          {
            t: "Take it back to the quartermaster's cart",
            check: {s:"persuasion",s2:"wil",d:50},
            win: {
              r: "You stand there holding the moving biscuit until he swaps the sack. The mess eats well for a week.",
              fx: {rel:{who:"comrade",op:6,all:!0},fame:1},
            },
            lose: {r:'"Eat it or starve, soldier." He swaps nothing, and he remembers your face.',fx:{happy:-3}},
          },
          {
            t: "Buy onions and dripping from a farm wife (3 suns)",
            req: p=>p.coin>=3,
            r: "Three suns, and the stew is fit for a captain. The mess will remember it longer than you will.",
            fx: {coin:-3,rel:{who:"comrade",op:5,all:!0},health:2},
          },
          {
            t: "Eat it. Meat is meat.",
            r: "You eat it with your eyes shut. Your stomach is tougher than it was a year ago.",
            fx: {sta:.4,wil:.5,health:-2},
          },
        ],
      },
      {
        id: "rk_blisters",
        cond: (p,C)=>low(p,C)&&p.mil.years<=3,
        setup: prep,
        title: "Raw feet",
        text: 'Thirty kilometers a day with twenty-five kilos on your back. By the third day your heels are raw meat and your socks are stuck to them. An old sweat in the file says, "Feet first, lad. A soldier is his feet."',
        choices: [
          {
            t: "Do what the old sweat says: grease, clean rags, air",
            r: "Every halt you take off your boots while the others laugh. A week later, they are limping and you are not.",
            fx: {sta:.6,skill:{survival:2},health:2},
          },
          {
            t: "March through it",
            check: {s:"wil",s2:"sta",d:45},
            win: {
              r: "The blisters burst, bleed and harden. By the end of the month your feet are leather.",
              fx: {sta:1,wil:1.5},
            },
            lose: {
              r: "The heels fester. You finish the march on a baggage cart, and the file does not let you forget it.",
              fx: {health:-8,wil:1,merit:-1,cause:"festering feet"},
            },
          },
          {
            t: "Trade your ration of ale for {mate}'s spare socks",
            r: "{mate} drives a hard bargain: three days' ale. Worth it.",
            fx: {them:{op:4},health:3,happy:-1},
          },
        ],
      },
      {
        id: "rk_horn_calls",
        cond: (p,C)=>low(p,C)&&p.mil.years<=4,
        setup: prep,
        title: "Twelve calls",
        text: `An army knows about twelve horn calls: advance, halt, wheel left and right, close up, loose, charge, rally to the banner, change the front rank, withdraw, and the commander's own. At drill today you heard "withdraw" and stepped back. It was "close up". The whole file walked into you.`,
        choices: [
          {
            t: "Hum the calls under your breath until you know them",
            check: {s:"music",s2:"int",d:35},
            win: {
              r: "A week of humming and you could blow them yourself. In a fight, that is the difference between living and not.",
              fx: {skill:{music:2,tactics:2},merit:2},
            },
            lose: {r:"They all sound the same to you. You learn to watch the file-leader's back instead.",fx:{int:.3}},
          },
          {
            t: "Pay the drummer boy to drill you at night (2 suns)",
            req: p=>p.coin>=2,
            r: "The drummer boy is ten and merciless. By the end of the week you have every call.",
            fx: {coin:-2,skill:{tactics:2},merit:2},
          },
          {
            t: "Laugh it off with the file",
            r: '"{name} the Wheeler," they call you for a month. You laugh too. It is better than the alternative.',
            fx: {happy:1,rel:{who:"comrade",op:2,all:!0}},
          },
        ],
      },
      {
        id: "rk_drill_realm",
        cond: (p,C)=>low(p,C),
        setup: prep,
        title: "Drill",
        text: "Drill, every day the weather allows and some days it does not: {drill}. Today the squad captain is watching, and so is a rider from {elite}.",
        choices: [
          {
            t: "Put everything into it",
            check: {s:"sta",s2:"ins",d:45},
            win: {
              r: "You finish first and cleanest. The rider asks the squad captain your name.",
              fx: {merit:5,sta:.6,ins:.5,fame:1},
            },
            lose: {
              r: "You push too hard and go down on the last turn. The squad captain sighs.",
              fx: {sta:.6,health:-3,wil:.5},
            },
          },
          {
            t: "Help the slowest man in the file keep up",
            r: "You bully and coax {mate2} through it. The file finishes together, which is the whole point, though nobody says so.",
            fx: both({skill:{command:2},merit:2},op2(10)),
          },
          {
            t: "Do enough and no more",
            r: "Not first, not last. The secret of a long life in the ranks.",
            fx: {sta:.3},
          },
        ],
      },
      {
        id: "rk_mess_pot",
        cond: (p,C)=>low(p,C)&&two(p),
        setup: prep,
        title: "The pot",
        text: 'Ten men eat from one pot, and someone in your mess is fishing out the meat before the rest get their spoons in. Everyone suspects {mate2}. {mate} wants to "have a word" with {m2him} behind the wagons.',
        choices: [
          {
            t: "Set a watch on the pot and catch the thief",
            check: {s:"ins",s2:"stealth",d:40},
            win: {
              r: ()=>`It is not {mate2}. It is ${A.pick(["the cook's dog","the file-leader's servant boy","a man from the next mess"])}. {mate2} buys you a drink for clearing {m2his} name.`,
              fx: both({rel:{who:"comrade",op:4,all:!0}},op2(12)),
            },
            lose: {
              r: "You fall asleep on watch. The meat is gone again, and now they suspect you.",
              fx: {happy:-3,rel:{who:"comrade",op:-2,all:!0}},
            },
          },
          {
            t: "Let {mate} have the word",
            r: "{mate} comes back with skinned knuckles. The meat stops vanishing. {mate2} stops talking to either of you.",
            fx: both({them:{op:4}},op2(-20)),
          },
          {
            t: "Make a rule: the cook serves, nobody dips",
            check: {s:"persuasion",s2:"command",d:40},
            win: {
              r: "The mess agrees. Fair shares, ladled out. It is the first time anyone has done what you said.",
              fx: {skill:{command:2},merit:2,rel:{who:"comrade",op:3,all:!0}},
            },
            lose: {r:'"Who made you file-leader?" Nobody listens.',fx:{happy:-2}},
          },
        ],
      },
      {
        id: "rk_underage",
        cond: (p,C)=>low(p,C)&&mates(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.kidage=A.ri(13,14),ctx.kid=nm(p)},
        title: "Too young",
        text: "The new boy in the mess, {kid}, says he is seventeen. He has no beard, his voice cracks, and at night he cries for his mother quietly so nobody hears. You hear. He told the recruiting sergeant a lie for the bounty. He is {kidage}.",
        choices: [
          {
            t: "Tell the squad captain and get him sent home",
            r: "The boy hates you for a week. Then a letter comes from his mother, and you are not hated any more.",
            fx: {honor:4,merit:1,happy:2},
          },
          {
            t: "Keep his secret and keep him alive",
            r: "You put him behind you in the file and teach him everything you know. It is not much, but it is something.",
            fx: {honor:2,wil:1,skill:{command:2},flag:"rk_kid"},
          },
          {
            t: "Mind your own business",
            r: "Every soldier is somebody's boy. Some are younger than others.",
            fx: {happy:-1},
          },
        ],
      },
      {
        id: "rk_kid_fate",
        cond: (p,C)=>C.soldier(p)&&C.flag(p,"rk_kid")&&war(p),
        once: !0,
        title: "The boy",
        setup: prep,
        text: "The boy you kept hidden in the file has been in two fights now. Today, at the edge of a wood, a rider comes at him, and you are the only one close enough.",
        choices: [
          {
            t: "Throw yourself in the way",
            check: {s:"ins",s2:"shield",d:50},
            win: {
              r: "The blow lands on your shield and the rider goes past. The boy lives. He will name his first son after you.",
              fx: {honor:5,fame:1,wil:1,unflag:"rk_kid"},
            },
            lose: {
              r: "You take the blow instead of him. He drags you back to the surgeon himself.",
              fx: {health:-18,wound:"scar_chest",honor:5,wil:2,unflag:"rk_kid",cause:"a rider's sword"},
            },
          },
          {
            t: "Shout a warning",
            check: {s:"ins",s2:"int",d:45},
            win: {
              r: "He ducks. The rider misses. You both laugh like madmen that night.",
              fx: {happy:4,unflag:"rk_kid"},
            },
            lose: {
              r: "He hears you a breath too late. You carry him to the wagons with a cut to the bone, and you never learn if he lived.",
              fx: {wil:2,happy:-8,unflag:"rk_kid"},
            },
          },
        ],
      },
      {
        id: "rk_froze",
        cond: (p,C)=>low(p,C)&&mates(p)&&p.mil.battles>0,
        setup: prep,
        title: "He froze",
        text: `In the last fight {mate} froze. Shield down, spear still, staring, while the line held around {mhim}. Nobody died for it, by luck. Tonight {mhe} comes to you and says, very quietly, "Don't tell them."`,
        choices: [
          {
            t: "Promise, and stand next to {mhim} next time",
            r: "Next time {mate} stands at your shoulder and does not freeze. Maybe because you are there.",
            fx: {them:{op:18},honor:2,wil:.5},
          },
          {
            t: "Tell {mhim} it happens to everyone once",
            r: '"Once," you say. "Not twice." {mate} nods like a man who has been handed his life back.',
            fx: {them:{op:10},skill:{command:1}},
          },
          {
            t: "Report it. The file's lives depend on it.",
            r: "{mate} is moved to the baggage guard. The file is safer. {Mhe} never speaks to you again.",
            fx: {merit:3,them:{op:-35}},
          },
        ],
      },
      {
        id: "rk_loaded_dice",
        cond: (p,C)=>low(p,C)&&two(p),
        setup: prep,
        title: "Loaded dice",
        text: "{mate2} wins at dice every pay day. Every single one. Tonight you pick up {m2his} dice when {m2he} goes to piss, and one of them is heavier on the six side.",
        choices: [
          {
            t: "Call it out in front of the whole file",
            r: "The file goes silent. {mate2} goes for {m2his} knife.",
            fx: both({
              honor: 2,
              duel: {
                tier: 2,
                title: "a dice cheat",
                opts: {kind:"brawl",lethal:!1,toYield:!0,place:"the dice blanket",title:"Over the dice"},
              },
            }, op2(-30)),
          },
          {
            t: "Quietly demand a cut",
            check: {s:"intimidation",s2:"deception",d:45},
            win: {
              r: "{mate2} pays you two suns a pay day to keep your mouth shut. You are a partner in crime now.",
              fx: both({coin:12,honor:-4,skill:{gambling:2}},op2(-5)),
            },
            lose: {r:'{mate2} laughs. "Prove it." By morning the heavy die is gone.',fx:op2(-10)},
          },
          {
            t: "Ask {m2him} to teach you the trick",
            r: "{mate2} looks at you a long time, then grins. You learn how to palm, switch and roll. You also learn never to sit down at {m2his} blanket.",
            fx: both({skill:{gambling:4,deception:2},honor:-2},op2(10)),
          },
          {
            t: "Put it back and stop playing with {m2him}",
            r: "You keep your pay. That is more than most of the file can say.",
            fx: {int:.3},
          },
        ],
      },
      {
        id: "rk_all_in",
        cond: (p,C)=>low(p,C)&&p.coin>=10,
        setup: (p,ctx)=>{prep(p,ctx),ctx.pot=Math.max(10,Math.round(p.coin*.5))},
        title: "The big game",
        text: ()=>`A big game in the ${A.pick(["quartermaster's tent","back of the sutler's wagon","barn the company sleeps in"])}: knucklebones, then dice, then cards painted on scraps of leather. By midnight it is you and two cavalrymen, and the pot is {pot} suns.`,
        choices: [
          {
            t: "Push in everything you have",
            check: {s:"gambling",s2:"ins",d:50},
            win: {
              r: "The bones fall your way. You walk out with your pockets full and two cavalrymen who want to kill you.",
              fx: (p,ctx)=>(p.coin+=ctx.pot||10,A.trainSkill(p,"gambling",3),p.happy=A.clamp(p.happy+6,0,100),""),
            },
            lose: {
              r: "The bones fall theirs. You walk out with nothing but a story.",
              fx: {coinPct:-.8,happy:-6,wil:1,skill:{gambling:2}},
            },
          },
          {
            t: "Read the cavalrymen and fold at the right moment",
            check: {s:"gambling",s2:"int",d:40},
            win: {
              r: "You fold twice, win once, and leave ahead. A small win is still a win.",
              fx: {coin:6,skill:{gambling:3}},
            },
            lose: {r:"You read them wrong all night and leave lighter.",fx:{coinPct:-.25,skill:{gambling:1}}},
          },
          {t:"Walk away from the table",r:"They jeer as you go. You sleep with a full purse.",fx:{wil:.5}},
        ],
      },
      {
        id: "rk_bad_news",
        cond: (p,C)=>low(p,C)&&C.parentsAlive(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.news=A.pick(["your father has fallen ill and cannot work the land","the reeve has taken the family plough-ox for a debt","the roof fell in over the winter","your mother has the coughing sickness"])},
        title: "A letter from home",
        text: 'A letter from {home}, written by the village priest because nobody there can write: {news}. It ends: "Come home if you can." It took two months to reach you.',
        choices: [
          {
            t: "Ask the captain for leave",
            check: {s:"persuasion",s2:"diplomacy",d:50,bonus:p=>war(p)?-12:4},
            win: {
              r: "A month's leave. You walk home and do what can be done. It is not enough, but you were there.",
              fx: {happy:4,rel:{who:"mother",op:10},honor:2,wil:1},
            },
            lose: {r:'"Everyone has a letter, soldier." Leave refused.',fx:{happy:-6,wil:1.5}},
          },
          {
            t: "Send home everything you have saved",
            req: p=>p.coin>=10,
            r: "You send home your savings with a carter and a prayer. Later a letter says it arrived. Mostly.",
            fx: p=>{const amt=Math.round(p.coin*.7);return p.coin-=amt,A.applyFx(p,{rel:{who:"father",op:10},honor:3,happy:1},{}),`${amt} suns go home.`},
          },
          {t:"Go anyway, without leave",r:"You slip out of camp with your boots and your guilt.",fx:desert},
          {
            t: "Fold it away and carry on",
            r: "You carry it in your shirt for a year. Nothing you can do from here, and you know it.",
            fx: {wil:2,happy:-5},
          },
        ],
      },
      {
        id: "rk_scribe",
        cond: (p,C)=>low(p,C)&&p.literate&&mates(p),
        setup: prep,
        title: "The letter-writer",
        text: "Word has gone round that you can write. Now there is a queue at your fire every rest day: men with a penny and a sweetheart, a debt, a dead brother to explain. {mate} is at the front, turning {mhis} cap in {mhis} hands.",
        choices: [
          {
            t: "Write for anyone, for free",
            r: "You write until your fingers ache. In a month, half the company would do anything for you.",
            fx: {rel:{who:"comrade",op:6,all:!0},skill:{learning:2,persuasion:1},honor:2},
          },
          {
            t: "Charge a penny a letter",
            r: "A penny a letter adds up. By the end of the season you have eight suns and a nickname: the Clerk.",
            fx: {coin:8,skill:{learning:2}},
          },
          {
            t: "Write {mate}'s letter and keep what you learn to yourself",
            r: "{mate} tells you things {mhe} has never said aloud: about a farm, a fight, a girl. You write it plain and true and never repeat a word.",
            fx: {them:{op:15},skill:{learning:1}},
          },
          {
            t: "Teach them to write their own",
            check: {s:"learning",s2:"persuasion",d:45},
            win: {
              r: "Three men in the file can sign their names by winter. One can write a whole letter. They will never forget who taught them.",
              fx: {skill:{learning:3,command:2},rel:{who:"comrade",op:8,all:!0}},
            },
            lose: {
              r: "Charcoal on a board, night after night. They give up. You do not blame them.",
              fx: {skill:{learning:1}},
            },
          },
        ],
      },
      {
        id: "rk_deserters_hang",
        cond: (p,C)=>low(p,C)&&crown(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.dname=nm(p),ctx.dage=A.ri(17,24)},
        title: "The hanging tree",
        text: "The whole company is drawn up in a square to watch. Three deserters, caught on the road home. The drummer reads their names, and the second one, {dname}, aged {dage}, is from {home}. You used to see him at the mill.",
        choices: [
          {
            t: "Watch, and promise yourself it will never be you",
            r: "You watch. That night, for the first time, you understand what the army is.",
            fx: {wil:2,happy:-5,merit:1},
          },
          {
            t: "Ask for his body, to bury it",
            check: {s:"persuasion",s2:"faith",d:45},
            win: {
              r: "The captain shrugs and says yes. You dig the grave yourself and take his knife home to his mother one day.",
              fx: {honor:5,piety:3,wil:1.5},
            },
            lose: {
              r: `"Deserters feed the crows. That's the point." You are sent back to the line.`,
              fx: {wil:1.5,happy:-3},
            },
          },
          {
            t: "Look at your boots",
            r: "You count the drumbeats and look at your boots. It is what most of the company does.",
            fx: {wil:1},
          },
        ],
      },
      {
        id: "rk_desert_road",
        cond: (p,C)=>low(p,C)&&crown(p),
        setup: prep,
        title: "Alone on the road",
        text: "You are a picket alone at a crossroads, three kilometers from camp, and nobody will come to relieve you until dawn. The left road goes back toward {home}. Nobody would know you were gone for nine hours. Nine hours is a long way.",
        choices: [
          {t:"Walk",r:"You lay your spear in the ditch and take the left road.",fx:desert},
          {
            t: "Stay at your post",
            r: "You stand all night looking at the road home. At dawn the relief comes, and you are still there.",
            fx: {wil:2,merit:2,honor:1},
          },
          {
            t: "Walk a kilometer down it, then turn back",
            r: "You walk until you can smell a farm, then turn around. You will never tell anyone about that kilometer.",
            fx: {wil:2.5,happy:-2},
          },
        ],
      },
      {
        id: "rk_sweetheart_leave",
        cond: (p,C)=>low(p,C)&&two(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.vil=prov(p.home)},
        title: "One night",
        text: `{mate2} has a sweetheart in a village eight kilometers off and wants one night. "Tell the file-leader I've got the flux. I'll be back for muster." If the file-leader checks, you both pay.`,
        choices: [
          {
            t: "Cover for {m2him}",
            check: {s:"deception",s2:"int",d:40},
            win: {
              r: "The file-leader takes one sniff toward the latrine and does not look further. {mate2} is back for muster, grinning.",
              fx: both({happy:2},op2(20)),
            },
            lose: {
              r: "The file-leader checks the latrines. Both of you dig them for a week.",
              fx: both({merit:-3,happy:-3},op2(8)),
            },
          },
          {
            t: "Refuse. If {m2he} goes, {m2he} goes alone.",
            r: "{mate2} goes anyway. {M2he} comes back before dawn and never asks you for anything again.",
            fx: op2(-12),
          },
          {
            t: "Go with {m2him}",
            check: {s:"stealth",s2:"spd",d:45},
            win: {
              r: "A night of cider, music and a barn dance. You are back before the horn and nobody is the wiser.",
              fx: both({happy:7},op2(15)),
            },
            lose: {
              r: "You are caught coming back through the pickets. Six strokes each, and the story follows you for a year.",
              fx: both({health:-10,merit:-4,wil:1,cause:"a flogging"},op2(10)),
            },
          },
        ],
      },
      {
        id: "rk_eve_of_battle",
        cond: (p,C)=>low(p,C)&&war(p)&&p.mil.battles===0,
        setup: prep,
        title: "The night before",
        text: "Tomorrow there will be a battle. You can see the enemy's fires on the far ridge, more of them than stars. Around you men sharpen blades, pray, write wills with charcoal, or lie looking at nothing. {mate} cannot sleep either.",
        choices: [
          {
            t: "Pray",
            r: p=>`You pray to ${A.godWord(p)} for courage, then for {mate}, then for your mother. It helps more than you expected.`,
            fx: {piety:4,wil:1},
          },
          {
            t: "Sit with {mate} and talk about home",
            r: "You talk about home until the fires burn low: food, girls, rivers. Whatever happens tomorrow, you will not be alone in it.",
            fx: {them:{op:12},happy:3},
          },
          {
            t: "Find the oldest soldier and ask what to expect",
            r: `"It comes in pushes," he says. "A minute of hell, then everyone stands back and pants. Keep your shield up when you're panting. That's when they get you."`,
            fx: {skill:{shield:2,tactics:1},ins:.5},
          },
          {
            t: "Sharpen your blade until it is perfect",
            r: "The stone goes back and forth for hours. Your hands stop shaking somewhere around midnight.",
            fx: {wil:1,skill:{craft:1}},
          },
        ],
      },
      {
        id: "rk_horse_bolts",
        cond: (p,C)=>low(p,C),
        setup: prep,
        title: "The captain's horse",
        text: `"Hold this." The captain throws you the reins of his grey and walks into the commander's tent. A dog runs under its belly, and the grey goes straight up on its hind legs, then bolts toward the horse lines dragging you behind.`,
        choices: [
          {
            t: "Hang on and get it under control",
            check: {s:"riding",s2:"str",d:45},
            win: {
              r: "You get your feet under you, then a hand on its neck, then a word in its ear. When the captain comes out, the grey is eating from your hand.",
              fx: {skill:{riding:3,husbandry:2},merit:3},
            },
            lose: {
              r: "You lose the reins in the horse lines and the grey kicks a sutler's cart to pieces. You pay for the cart.",
              fx: {coin:-5,health:-5,merit:-2},
            },
          },
          {
            t: "Let go before it kills you",
            r: "You let go. The grey runs a kilometer and is brought back by a groom who looks at you with scorn.",
            fx: {merit:-1,happy:-2},
          },
        ],
      },
      {
        id: "rk_rich_recruit",
        cond: (p,C)=>low(p,C)&&lowborn(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.lad=nm(p)},
        title: "The merchant's son",
        text: `A rich man's son, {lad}, has joined your mess "to see what soldiering is". He has a horse he is not allowed to ride, three shirts, and a purse he keeps under his pillow. He cannot light a fire. The mess smells money.`,
        choices: [
          {
            t: "Teach him properly",
            r: "You teach him the fire, the pot, the shield and the march. By winter he is almost a soldier, and he writes his father about you.",
            fx: {newRel:{type:"friend",op:35},skill:{command:2},flag:"rk_patron"},
          },
          {
            t: "Charge him for every lesson",
            r: "A sun for the fire, two for the boots, five for keeping the mess off his purse. You eat well all season.",
            fx: {coin:15,honor:-2},
          },
          {
            t: "Let the mess have its fun with him",
            r: "They steal his shirts, salt his bed and dunk him in the ford. He goes home in a month. Nobody misses the shirts.",
            fx: {coin:4,honor:-3,rel:{who:"comrade",op:3,all:!0}},
          },
        ],
      },
      {
        id: "rk_patron",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"rk_patron"),
        once: !0,
        title: "A friend at the top",
        setup: prep,
        text: `A letter, sealed with wax: the merchant's son you once taught to light a fire has his father's business now, and has not forgotten. "If ever you need a friend with money, you have one."`,
        choices: [
          {
            t: "Ask for a loan to buy proper kit (60 suns)",
            r: `Sixty suns, and "pay me back when you're a captain".`,
            fx: {coin:60,unflag:"rk_patron"},
          },
          {
            t: "Ask for his father's grain at fair prices for the company",
            r: "The company eats well for a year, and your name is attached to every sack.",
            fx: {merit:8,fame:1,unflag:"rk_patron"},
          },
          {
            t: "Thank him and ask for nothing",
            r: "You write back that the fire was payment enough. He likes you better for it.",
            fx: {honor:3,happy:3,unflag:"rk_patron"},
          },
        ],
      },
      {
        id: "rk_section_fund",
        cond: (p,C)=>low(p,C)&&mates(p),
        setup: prep,
        title: "The section fund",
        text: `Sergeant {sarge} takes a penny in every sun of your pay "for the section fund". There is no section fund. Everyone knows it buys the sergeant's wine and the sergeant's women. {mate} says the last man who complained got the worst duties for a year.`,
        choices: [
          {t:"Pay, like everyone else",r:"You pay. It is a tax on being at the bottom.",fx:{coin:-3}},
          {
            t: "Get the mess to refuse together",
            check: {s:"persuasion",s2:"command",d:50},
            win: {
              r: "Ten men refuse at once. The sergeant blusters, then decides the fund is full for this year.",
              fx: {coin:3,rel:{who:"comrade",op:6,all:!0},skill:{command:2}},
            },
            lose: {
              r: "The others back down at the last moment. You stand alone, and the sergeant notes it.",
              fx: {coin:-3,merit:-3,happy:-4,wil:1},
            },
          },
          {
            t: "Complain to the squad captain",
            check: {s:"diplomacy",s2:"wil",d:55},
            win: {
              r: "The squad captain is honest, for once. The sergeant is fined and the fund vanishes.",
              fx: {merit:3,honor:3,rel:{who:"comrade",op:4,all:!0}},
            },
            lose: {
              r: "The squad captain and the sergeant drink together. You have a hard year.",
              fx: {merit:-4,health:-5,wil:2,happy:-4},
            },
          },
          {
            t: "Meet the sergeant behind the latrines",
            r: "You tell him you are done paying. He takes off his belt.",
            fx: {
              duel: {
                tier: 2,
                title: "a sergeant with a grudge",
                troop: "SP",
                opts: {kind:"brawl",lethal:!1,toYield:!0,place:"behind the latrines",title:"Behind the latrines"},
              },
            },
          },
        ],
      },
      {
        id: "rk_scapegoat",
        cond: (p,C)=>low(p,C)&&two(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.thing=A.pick(["a silver cup","a purse of twelve suns","a good pair of riding boots","a flask of the commander's brandy"])},
        title: "Someone has to hang for it",
        text: "{thing} has gone from the captain's tent, and the sergeant needs a name by sunset. He picks yours, because you were on the tent guard. You did not take it. You think you know who did: {mate2} has new boots and a smile.",
        choices: [
          {
            t: "Prove you did not take it",
            check: {s:"int",s2:"persuasion",d:50},
            win: {
              r: "You walk the sergeant through the guard roll, the hours, the tracks in the mud. He believes you, sourly, and goes looking elsewhere.",
              fx: {merit:2,int:.5},
            },
            lose: {
              r: "He does not believe a word. Ten strokes, and a stoppage for the price.",
              fx: {health:-12,coin:-6,wil:2,cause:"a flogging"},
            },
          },
          {
            t: "Name {mate2}",
            r: "They find it in {mate2}'s pack. {M2he} is flogged half to death and looks at you the whole time.",
            fx: both({merit:2,rel:{who:"comrade",op:-3,all:!0}},op2(-50)),
          },
          {
            t: "Take the punishment and say nothing",
            r: "Ten strokes on the wheel. The company knows you did not do it. {mate2} brings you water in the night and cannot meet your eye.",
            fx: both({health:-12,wil:2.5,honor:3,rel:{who:"comrade",op:5,all:!0},cause:"a flogging"},op2(15)),
          },
        ],
      },
      {
        id: "rk_lucky_stone",
        cond: (p,C)=>low(p,C)&&mates(p),
        setup: prep,
        title: "A lucky stone",
        text: ()=>`Before the fight {mate} presses something into your hand: ${A.pick(["a stone with a hole worn through it","a copper coin from a drowned town","a knot of red thread","a tooth from a wolf {mhe} says {mhe} killed"])}. "Kept me alive four years. Your turn."`,
        choices: [
          {
            t: "Take it, and give {mhim} something back",
            r: "You give {mhim} your mother's knot of ribbon. Both of you live through the day. Neither of you will ever say it was luck.",
            fx: {them:{op:15},happy:3,wil:.5},
          },
          {
            t: "Make {mhim} keep it",
            r: '"You need it more." {mate} laughs and puts it back. It is the kindest thing anyone has said to {mhim} in years.',
            // [X1 baked patch events/33-no-obvious-choices CHOICE-RK-LUCKY-STONE] rk_lucky_stone: refusing the stone ("You
            // need it more") is generous, and now counts as honour.
            fx: {them:{op:10},honor:1},
          },
          {
            t: "Laugh at it",
            r: `"Stones don't stop spears." {mate} looks hurt. You keep it anyway, in the end. Just in case.`,
            fx: {them:{op:-3}},
          },
        ],
      },
      {
        id: "rk_lame_horse",
        cond: (p,C)=>low(p,C)&&troop(p,"LC","MC","HA","HC","CM"),
        setup: prep,
        title: "A lame horse",
        text: `Your horse comes up lame on the march, hot in the near fore. A horse lost through the rider's fault comes out of the rider's pay, and a remount costs more than you earn in a season. The farrier shrugs. "Stone bruise, or worse."`,
        choices: [
          {
            t: "Nurse it yourself, poultice and cold water",
            check: {s:"husbandry",s2:"riding",d:45},
            win: {
              r: "Three nights of poultices and walking. The heat goes out of the hoof. You march on with a sound horse and a new respect for farriers.",
              fx: {skill:{husbandry:3,riding:1},merit:2},
            },
            lose: {
              r: "It gets worse. The horse is led away, and the cost is stopped from your pay.",
              fx: {coin:-20,happy:-5},
            },
          },
          {
            t: "Swap it with a sound horse from the spare string",
            check: {s:"deception",s2:"husbandry",d:50},
            win: {
              r: "By morning your horse is in the spare string and a sound one has your saddle. Nobody can prove a thing.",
              fx: {honor:-3,skill:{deception:2}},
            },
            lose: {
              r: "The horse-master knows every horse by its face. You pay for both, and for the insult.",
              fx: {coin:-25,merit:-4},
            },
          },
          {
            t: "Pay the farrier to do it properly (6 suns)",
            req: p=>p.coin>=6,
            r: "Six suns, a hot iron and a lot of swearing. The horse lives to carry you another year.",
            fx: {coin:-6},
          },
        ],
      },
      {
        id: "rk_wet_strings",
        cond: (p,C)=>low(p,C)&&troop(p,"AR","LB","EA","XB","HA"),
        setup: prep,
        title: "Rain on the strings",
        text: "Rain since dawn, and the enemy is somewhere in the mist ahead. A wet string loses its cast; a wet crossbow string can snap. The old hands are already stuffing spare strings under their caps.",
        choices: [
          {
            t: "Keep your strings under your cap and your stave under your cloak",
            check: {s:"int",s2:"bow",d:35,bonus:p=>A.skill(p,"xbow")*.2},
            win: {
              r: "When the mist lifts, your string is dry and your shooting is the best in the file.",
              fx: {skill:{bow:2,xbow:2},merit:3},
            },
            lose: {
              r: "Your cap leaks. You shoot half as far as you should, and the file-leader notices.",
              fx: {merit:-1},
            },
          },
          {
            t: "Wax every string in the file with your own candle-end",
            r: "Your candle is gone, but every string in the file holds. Men owe you, and they know it.",
            fx: {rel:{who:"comrade",op:4,all:!0},merit:2},
          },
          {t:"Hope it stops",r:"It does not stop. Nobody shoots well that day.",fx:{}},
        ],
      },
      {
        id: "rk_stolen_hen",
        cond: (p,C)=>low(p,C)&&mates(p),
        setup: prep,
        title: "The hen",
        text: `{mate} comes back from "fetching water" with a live hen under {mhis} cloak. At that moment the provost and two men walk into the lines, looking for a farmer's hen, and the farmer is with them.`,
        choices: [
          {
            t: "Sit on the cooking pot with the hen inside it",
            check: {s:"deception",s2:"wil",d:45},
            win: {
              r: "The hen keeps still. You keep still. The provost leaves. The mess eats like captains that night.",
              fx: {them:{op:10},happy:4},
            },
            lose: {
              r: "The hen clucks. Loudly. You and {mate} both pay the farmer and dig latrines.",
              fx: {coin:-2,merit:-2,them:{op:5}},
            },
          },
          {
            t: "Pay the farmer before the provost finds it (2 suns)",
            req: p=>p.coin>=2,
            r: "You press two suns into the farmer's hand. He decides he was mistaken. The mess eats his hen with a clear conscience.",
            fx: {coin:-2,honor:2,them:{op:6}},
          },
          {
            t: "Hand the hen over",
            r: "The provost takes the hen and {mate}'s name. {Mhe} is flogged, and the mess thinks you could have done better.",
            fx: {merit:1,them:{op:-12}},
          },
        ],
      },
      {
        id: "rk_frost_march",
        cond: (p,C)=>low(p,C)&&(C.terr(p,"mountains","tundra","hills","steppe")||A.chance(.3)),
        setup: prep,
        title: "The cold march",
        text: "A winter march over high ground. The wind cuts through two cloaks. Last night a man in the next file sat down to rest and did not get up. {mate} is shaking too hard to tie {mhis} boots.",
        choices: [
          {
            t: "Share your blanket and body heat with {mate}",
            r: "You sleep back to back, two blankets over both. In the morning you both get up.",
            fx: {them:{op:15},wil:1,sta:.5},
          },
          {
            t: "Keep moving all night, and keep {mhim} moving",
            check: {s:"sta",s2:"wil",d:50},
            win: {
              r: "You stamp, slap and swear at each other till dawn. You both keep your toes.",
              fx: {sta:1,wil:1.5,them:{op:10}},
            },
            lose: {
              r: "You keep {mhim} moving. Your own feet go white and then black at the tips.",
              fx: {wound:"frostbite",wil:2,them:{op:12},health:-6,cause:"frostbite"},
            },
          },
          {
            t: "Look after yourself first",
            r: "You wrap up and say nothing. {mate} lives anyway, and remembers.",
            fx: {them:{op:-10},health:2},
          },
        ],
      },
      {
        id: "rk_lice",
        cond: (p,C)=>low(p,C),
        setup: prep,
        title: "Lice",
        text: "The company has lice. Everyone scratches, all day and all night. The camp priest says it is a judgment. The surgeon says boil everything. The old soldiers say smoke your shirt over a fire of green wood.",
        choices: [
          {
            t: "Boil every stitch you own",
            r: "Your shirt shrinks two sizes, but it is clean. You sleep for the first time in a week.",
            fx: {health:3,int:.2},
          },
          {
            t: "Shave your head and smoke your clothes",
            r: "Bald as an egg and smelling of a smokehouse. Lice-free, though.",
            fx: {health:3,looks:-1},
          },
          {
            t: "Scratch and bear it like everyone else",
            r: "You scratch until you bleed. The itch stays all winter.",
            fx: {health:-3,wil:.5,happy:-2},
          },
        ],
      },
      {
        id: "rk_wrong_shape",
        cond: (p,C)=>low(p,C)&&war(p)&&mates(p),
        w: .6,
        setup: prep,
        title: "In the dark",
        text: "A night alarm. Shouting, torches, nobody knows where the enemy is. A shape comes at you between the tents and you strike first. When the torch comes, it is a man from your own company: {mate3}, cut across the arm, shouting the password you did not hear.",
        choices: [
          {
            t: "Get him to the surgeon yourself",
            r: "You carry {mate3} to the surgeon and hold the lamp while he is stitched. He forgives you sooner than you forgive yourself.",
            fx: {wil:2,honor:2,happy:-4},
          },
          {
            t: "Learn every password, every night, from now on",
            r: "You never miss a password again. It is a small thing to learn at the price of a friend's blood.",
            fx: {wil:1.5,int:.5,skill:{tactics:1}},
          },
          {
            t: "Say it was too dark and anyone would have done it",
            r: "It was too dark, and anyone would have. The file agrees. You do not sleep well for a while.",
            fx: {wil:1,happy:-3},
          },
        ],
      },
      {
        id: "rk_begging_boy",
        cond: (p,C)=>low(p,C)&&war(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.bage=A.ri(14,16)},
        title: "A boy with a spear",
        text: "After the rout you corner one of them in a cowshed: a {foe} boy of about {bage}, his spear broken, crying and begging in a language you half know. Behind you, the file is killing everyone it catches. Nobody is watching this corner.",
        choices: [
          {
            t: "Let him go out the back",
            r: "You point at the back door. He runs. You hope somebody somewhere does the same for someone you love.",
            fx: {honor:5,wil:1,piety:2},
          },
          {
            t: "Take him prisoner",
            r: "You march him back with a rope round his wrists. He is worth nothing in ransom, but he is alive.",
            fx: {honor:3,merit:2},
          },
          {
            t: "Do what the file is doing",
            r: "It is war. You will tell yourself that for years.",
            fx: {honor:-6,happy:-6,wil:1,merit:1},
          },
        ],
      },
      {
        id: "rk_wrestle",
        cond: (p,C)=>low(p,C),
        setup: (p,ctx)=>{prep(p,ctx),ctx.champ=nm(p)},
        title: "The wrestling ring",
        text: "Rest day, and the company's champion, a big man called {champ}, stands in a chalk ring offering two suns to any man who can put him down. Nobody has for a year. Your file pushes you forward.",
        choices: [
          {
            t: "Step into the ring",
            r: "The file cheers. {champ} spits on his hands.",
            fx: {
              duel: {
                tier: 2,
                title: "the company champion",
                opts: {kind:"brawl",lethal:!1,toYield:!0,place:"the chalk ring",title:"The chalk ring"},
              },
            },
          },
          {
            t: "Study how he moves first",
            check: {s:"int",s2:"unarmed",d:45},
            win: {
              r: "He always leads with his left foot. You go in under it and he goes over like a felled tree. Two suns and a name.",
              fx: {coin:2,fame:1,skill:{unarmed:3},rel:{who:"comrade",op:4,all:!0}},
            },
            lose: {
              r: "You study him so long that he picks you up and throws you out of the ring.",
              fx: {health:-3,skill:{unarmed:1},happy:-1},
            },
          },
          {
            t: "Take bets instead",
            check: {s:"gambling",s2:"int",d:40},
            win: {
              r: "Every fool bets against {champ}. You hold the purse and take a cut. Four suns.",
              fx: {coin:4,skill:{gambling:2}},
            },
            lose: {r:"Someone finally wins, and you cannot cover the bets.",fx:{coin:-4}},
          },
        ],
      },
      {
        id: "rk_feast_mess",
        cond: (p,C)=>low(p,C)&&mates(p),
        setup: prep,
        title: "Festival in camp",
        text: "It is {festival}, and the company is in camp with nothing to do. The mess pools its pennies for a feast: a pig, a barrel, and whatever {mate} can talk out of the sutler.",
        choices: [
          {
            t: "Put in a whole sun",
            req: p=>p.coin>=1,
            r: "It is the best night of the year. {mate} sings, the file-leader dances, and nobody talks about the war.",
            fx: {coin:-1,happy:6,rel:{who:"comrade",op:4,all:!0}},
          },
          {
            t: "Cook the pig yourself",
            check: {s:"survival",s2:"craft",d:40},
            win: {
              r: "Crackling like glass, meat falling off the bone. The mess talks about it for years.",
              fx: {happy:5,rel:{who:"comrade",op:6,all:!0}},
            },
            lose: {
              r: "Raw in the middle, black on the outside. They eat it anyway and laugh at you all night.",
              fx: {happy:3,rel:{who:"comrade",op:2,all:!0}},
            },
          },
          {
            t: "Stand guard so the others can drink",
            r: "You stand guard all night listening to them sing. In the morning there is a cup of ale left out for you, and a cold rib.",
            fx: {merit:2,honor:2,rel:{who:"comrade",op:3,all:!0}},
          },
        ],
      },
      {
        id: "rk_file_standard",
        cond: (p,C)=>C.soldier(p)&&rk(p)===1,
        setup: prep,
        title: "The file's rag",
        text: "As file-leader you carry the file's standard: a stick with a colored rag on it. This morning it is gone from beside your blanket. Across the camp, another file is laughing loudly, and the rag is flying from their cook-pot.",
        choices: [
          {
            t: "Take it back in the night",
            check: {s:"stealth",s2:"spd",d:45},
            win: {
              r: "You come back with your rag and theirs. Your file flies both for a week, and the company laughs at the other one.",
              fx: {merit:3,rel:{who:"comrade",op:6,all:!0},skill:{stealth:2}},
            },
            lose: {
              r: "Caught in their lines. They throw you in the horse trough, and your rag stays on the pot.",
              fx: {happy:-4,rel:{who:"comrade",op:-3,all:!0}},
            },
          },
          {
            t: "Walk over and ask for it, file-leader to file-leader",
            check: {s:"persuasion",s2:"intimidation",d:45},
            win: {
              r: 'Their file-leader grins and hands it over. "Had to try." You share a jug that night.',
              fx: {newRel:{type:"friend",op:25}},
            },
            lose: {
              r: '"Come and take it." So you do.',
              fx: {
                duel: {
                  tier: 2,
                  title: "another file-leader",
                  opts: {kind:"brawl",lethal:!1,toYield:!0,place:"the other file's fire",title:"For the rag"},
                },
              },
            },
          },
          {
            t: "Tie a new rag on a new stick",
            r: "A rag is a rag. Your file grumbles that it is not the same. They are right.",
            fx: {rel:{who:"comrade",op:-2,all:!0}},
          },
        ],
      },
      {
        id: "rk_file_count",
        cond: (p,C)=>C.soldier(p)&&rk(p)===1&&war(p)&&two(p),
        setup: prep,
        title: "Counting heads",
        text: "After the fight a file-leader counts heads. You count nineteen, then nineteen again. {mate2} is missing. The field is dark, the enemy's horse is still out there, and the squad captain says the file will move at first light.",
        choices: [
          {
            t: "Go back out and look for {m2him}",
            check: {s:"stealth",s2:"tracking",d:50},
            win: {
              r: "You find {mate2} in a ditch with a broken leg, swearing quietly. You carry {m2him} back on your shoulders before dawn.",
              fx: both({merit:6,fame:1,wil:1,rel:{who:"comrade",op:6,all:!0}},op2(30)),
            },
            lose: {
              r: "You search till the stars fade and find nothing but the dead. You come back alone.",
              fx: both({wil:2,happy:-5,health:-3},die2("lost in the dark on the field and never found")),
            },
          },
          {
            t: "Send two volunteers",
            r: "Two men go out, and two come back carrying {mate2}. They are heroes for a week. You are the file-leader who sent them.",
            fx: both({skill:{command:3},merit:3},op2(10)),
          },
          {
            t: "Write {m2him} down as missing",
            r: '"Missing" goes on the roll. Missing usually means dead. You do not sleep.',
            fx: both({wil:1.5,happy:-4},gone2),
          },
        ],
      },
      {
        id: "rk_file_oldhand",
        cond: (p,C)=>C.soldier(p)&&rk(p)===1&&mates(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.yrs=A.ri(12,25)},
        title: "The oldest man",
        text: "A file-leader is usually the oldest steady man in the file. You are not. {mate} has {yrs} years in the ranks and expected the staff. Now {mhe} obeys you slowly, with a little smile, and the file watches to see what you will do.",
        choices: [
          {
            t: "Ask {mhim} for advice, openly",
            r: '"What would you do?" {mate} is so surprised that {mhe} tells you. The file sees two leaders who agree. That is better than one.',
            fx: {them:{op:15},skill:{command:2},merit:2},
          },
          {
            t: "Strike {mhim} with the staff for slowness",
            r: "One blow, in front of the file. {mate} obeys at once after that. The smile is gone, and so is something else.",
            fx: {them:{op:-25},skill:{command:2,intimidation:2},merit:2},
          },
          {
            t: "Out-march and out-dig {mhim}",
            check: {s:"sta",s2:"str",d:50},
            win: {
              r: 'For a month you are first up, last down, deepest in the ditch. One morning {mate} calls you "file-leader" without the smile.',
              fx: {them:{op:10},sta:1,merit:3},
            },
            lose: {r:"{mate} out-marches you without trying. Years count.",fx:{sta:.8,wil:1,happy:-2}},
          },
        ],
      },
      {
        id: "rk_file_wake",
        cond: (p,C)=>C.soldier(p)&&rk(p)===1&&two(p),
        setup: prep,
        title: "Up, up",
        text: "The file-leader wakes the file. {mate2} will not get up: says {m2he} has a fever, and {m2he} is hot to the touch, but {m2he} also has a jug under the blanket and a pay-day headache. The march leaves in a quarter of an hour.",
        choices: [
          {
            t: "Look closer before you decide",
            check: {s:"medicine",s2:"ins",d:40},
            win: {
              r: ()=>A.pick(["Real fever: glassy eyes, a rash on the chest. You get {m2him} on a wagon and keep the rest of the file away from {m2his} blanket.","Ale, not fever. You pour the jug over {m2his} head, and {m2he} is up in a breath."]),
              fx: {skill:{medicine:2,command:2},merit:2},
            },
            lose: {r:"You guess wrong. The file never quite agrees about which way.",fx:op2(-6)},
          },
          {
            t: "Kick {m2him} up. The march waits for nobody.",
            r: "{mate2} marches, grey and sweating. {M2he} makes it, just. The file learns that you do not take excuses.",
            fx: both({merit:2,skill:{command:1}},op2(-10)),
          },
          {
            t: "Put {m2him} on a wagon, just in case",
            r: "On the wagon {mate2} sleeps it off in comfort. Next time, half the file has a fever.",
            fx: both({merit:-2},op2(8)),
          },
        ],
      },
      {
        id: "rk_file_pressed",
        cond: (p,C)=>C.soldier(p)&&rk(p)===1&&crown(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.lad=nm(p)},
        title: "Taken by mistake",
        text: "The press party brought in a new man for your file: {lad}, a weaver's apprentice dragged out of an alehouse. He swears he is the only son of a widow, and the law says only sons are exempt. The sergeant says everybody says that.",
        choices: [
          {
            t: "Take his case to the squad captain",
            check: {s:"persuasion",s2:"learning",d:45},
            win: {
              r: "You find a priest who knows the widow. {lad} goes home with a paper, and you have one man fewer and a good name in the town.",
              fx: {honor:5,fame:1},
            },
            lose: {r:"The squad captain is short of men and does not care about widows. {lad} stays.",fx:{happy:-2}},
          },
          {
            t: "Make a soldier of him",
            r: "He is hopeless, then less hopeless, then a decent man in a file. He never forgives the army. He forgives you.",
            fx: {skill:{command:3},newRel:{type:"friend",op:25}},
          },
          {
            t: "Shrug. Everyone says that.",
            r: "He is gone within a month. Deserted, or drowned, nobody knows.",
            fx: {},
          },
        ],
      },
      {
        id: "rk_sgt_thief",
        cond: (p,C)=>mid(p,C)&&two(p),
        setup: prep,
        title: "A thief in the section",
        text: ()=>`Things are going missing in your section: ${A.pick(["a dead man's ring","two weeks' pay from a sleeping man's boot","a good knife, then a good cloak, then a purse","the section's salt ration"])}. Men are starting to sleep with their hands on their kit and eye each other at the pot. A section that does not trust itself will break the first time it is pushed.`,
        choices: [
          {
            t: "Search every pack in the section, starting with your own",
            r: "You empty your own pack first, in front of everyone. Then the rest. It is in {mate2}'s bedroll. Six strokes, the most a sergeant may give, and the section breathes again.",
            fx: both({skill:{command:3},merit:4,rel:{who:"comrade",op:3,all:!0}},op2(-30)),
          },
          {
            t: "Set a trap: a marked coin in an open purse",
            check: {s:"int",s2:"intrigue",d:45},
            win: {
              r: "The marked coin turns up in {mate2}'s hand at the sutler's. You deal with it quietly, and {m2he} pays it all back. Nobody else ever learns who it was.",
              fx: both({skill:{intrigue:3,command:2},merit:3,honor:2},op2(-10)),
            },
            lose: {r:"The thief is not fooled. The thefts stop for a month, then start again.",fx:{happy:-3}},
          },
          {
            t: "Let the section deal with it",
            r: "They find out who on their own and beat {mate2} bloody under a blanket. The thefts stop. So does a little of your authority.",
            fx: both({merit:-1,rel:{who:"comrade",op:2,all:!0}},op2(-20)),
          },
          {
            t: "Fine the whole section until someone talks",
            r: "A week's fines and the thief is named by noon on the third day. The men hate the fines more than the thief.",
            fx: both({skill:{command:2},rel:{who:"comrade",op:-4,all:!0},merit:2},op2(-25)),
          },
        ],
      },
      {
        id: "rk_sgt_point",
        cond: (p,C)=>mid(p,C)&&two(p)&&war(p),
        setup: prep,
        title: "Who takes point",
        text: "A patrol through close woods, the kind of ground the enemy loves. Someone must walk point, thirty paces ahead, and the man on point is the first to die in an ambush. {mate}, who {quirk}, has the best eyes. {mate2} volunteers loudly. Both are looking at you.",
        choices: [
          {
            t: "Send {mate}, the best eyes",
            check: {s:"tactics",s2:"ins",d:45},
            win: {
              r: "{mate} spots the ambush from eighty paces: a glint of a helmet in a holly bush. You go round it and take them from behind.",
              fx: {merit:6,them:{op:6},skill:{tactics:2}},
            },
            lose: {
              r: "{mate} sees it a heartbeat too late.",
              fx: both({merit:2,wil:2,happy:-6},die1("an arrow from a holly bush, walking point")),
            },
          },
          {
            t: "Let {mate2} have the honor",
            check: {s:"command",s2:"ins",d:55},
            win: {
              r: "{mate2} is loud but lucky. There is no ambush, and {m2he} swaggers about it for a month.",
              fx: both({merit:2},op2(10)),
            },
            lose: {
              r: "{mate2} walks straight into them. The section fights its way out.",
              fx: both({merit:-2,wil:1.5,health:-8,cause:"an ambush in the woods"},die2("walked point into an ambush")),
            },
          },
          {
            t: "Take point yourself",
            check: {s:"stealth",s2:"ins",d:55},
            win: {
              r: "You find them first. The section never forgets that its sergeant walked in front.",
              fx: {merit:8,fame:1,rel:{who:"comrade",op:8,all:!0},skill:{stealth:2}},
            },
            lose: {
              r: "The first arrow finds you, not one of them.",
              fx: {wound:"arrow_wound",health:-18,merit:4,rel:{who:"comrade",op:8,all:!0},cause:"an arrow on point"},
            },
          },
        ],
      },
      {
        id: "rk_sgt_carry",
        cond: (p,C)=>mid(p,C)&&mates(p)&&war(p),
        setup: prep,
        title: "Ten kilometers",
        text: "The retreat. {mate} has a spear wound in the thigh and cannot walk. The column will not stop, the wagons are full, and the enemy's horse is three kilometers behind. The next ford is ten kilometers away.",
        choices: [
          {
            t: "Carry {mhim} on your back",
            check: {s:"str",s2:"sta",d:55},
            win: {
              r: "Ten kilometers. You do not remember the last four. At the ford you put {mate} down and {mhe} is alive, and so are you.",
              fx: {
                them: {op:30},
                str: 1,
                sta: 1,
                wil: 2,
                fame: 2,
                merit: 5,
                deed: "carried a wounded man ten kilometers in a retreat",
              },
            },
            lose: {
              r: "Your legs give out at the seventh kilometer. Two men from the section take {mate} the rest of the way. They should never have had to.",
              fx: {them:{op:20},health:-10,wil:2,sta:.6},
            },
          },
          {
            t: "Rig a litter from two spears and a cloak and take turns",
            check: {s:"command",s2:"craft",d:45},
            win: {
              r: "Four men, turn and turn about. The section carries {mate} to the ford together and is a section ever after.",
              fx: {them:{op:20},rel:{who:"comrade",op:6,all:!0},skill:{command:3},merit:4},
            },
            lose: {
              r: "The litter breaks twice. You are the last over the ford, with horsemen on the bank behind you.",
              fx: {health:-8,wil:1.5,them:{op:12}},
            },
          },
          {
            t: "Leave {mhim} in a farmhouse with water and hope",
            r: "You leave {mate} in a farmhouse with a flask, a knife and a promise you cannot keep.",
            fx: both({wil:2.5,happy:-10}, (p,ctx)=>A.chance(.6)?die1("left behind wounded in a farmhouse during the retreat")(p,ctx):(()=>{const c=A.P(ctx.pid);return c&&p.mil&&(p.mil.squad=p.mil.squad.filter(id=>id!==c.id)),"Years later you hear a rumor that a lame soldier walked home from that war."})()),
          },
        ],
      },
      {
        id: "rk_sgt_rations",
        cond: (p,C)=>mid(p,C),
        setup: prep,
        title: "Short weight",
        text: "The section's rations come up a fifth short for the third week running. Your cook shows you why: the quartermaster's sergeant has a thumb on every scale, and a cousin who sells bread to the town.",
        choices: [
          {
            t: "Weigh the next issue in front of him",
            check: {s:"logistics",s2:"intimidation",d:45},
            win: {
              r: "You bring your own scale and your biggest man. The next issue is full weight, and so is every one after.",
              fx: {skill:{logistics:3},rel:{who:"comrade",op:5,all:!0},merit:3},
            },
            lose: {
              r: "He shouts louder than you. The issue stays short, and now he shorts you on purpose.",
              fx: {happy:-3,health:-2},
            },
          },
          {
            t: "Report him to the squad captain with the cook as witness",
            check: {s:"persuasion",s2:"learning",d:50},
            win: {
              r: "The quartermaster's sergeant is broken to the ranks. Your section eats properly, and the other sergeants buy you drinks.",
              fx: {merit:5,honor:3,fame:1},
            },
            lose: {
              r: "His cousin is the squad captain's cousin too. Nothing happens, except to your duties.",
              fx: {merit:-3,wil:1},
            },
          },
          {
            t: "Go short on your own ration so the men do not",
            r: "You eat a fifth less so the section does not. Nobody says anything. Everybody notices.",
            fx: {health:-4,honor:3,rel:{who:"comrade",op:6,all:!0},wil:1},
          },
        ],
      },
      {
        id: "rk_sgt_deadpay",
        cond: (p,C)=>mid(p,C),
        setup: (p,ctx)=>{prep(p,ctx),ctx.dead=nm(p)},
        title: "A dead man's pay",
        text: "A sergeant keeps the section's roll. {dead} died of the flux a month ago, and his name is still on it. Nobody has checked. Every quarter day, a dead man's pay will come to you, and you will be the only one who knows.",
        choices: [
          {
            t: "Strike his name off",
            r: 'You strike the name and write "dead of the flux" beside it, in your best hand. It is the honest thing. Nobody thanks you for it.',
            fx: {honor:3,skill:{learning:1}},
          },
          {
            t: "Keep him on and send his pay to his widow",
            r: "For a year, a dead man's pay goes home to a widow in a village you will never see. It is theft, of a sort. You sleep fine.",
            fx: {honor:2,piety:2,happy:2,flag:"rk_deadpay"},
          },
          {
            t: "Keep him on and keep the pay",
            r: "A ghost in the section, and his pay in your purse. Every sergeant does it, they say.",
            fx: {coin:25,honor:-5,flag:"rk_deadpay"},
          },
        ],
      },
      {
        id: "rk_sgt_deadpay_found",
        cond: (p,C)=>C.soldier(p)&&C.flag(p,"rk_deadpay"),
        once: !0,
        setup: prep,
        title: "The muster roll",
        text: "Muster day. The paymaster's clerk reads the roll aloud and every man must answer to his name. He reaches the dead man's name. Silence. The clerk looks up from the roll, straight at you.",
        choices: [
          {
            t: "Answer for him in a different voice",
            check: {s:"deception",s2:"wil",d:55},
            win: {
              r: '"Here!" from the back rank, in a voice that is not yours. The clerk moves on. Your heart does not slow down until night.',
              fx: {wil:1,unflag:"rk_deadpay"},
            },
            lose: {
              r: "The clerk walks down the line to find the voice. He finds you. A heavy fine and the squad captain's contempt.",
              fx: {coin:-30,merit:-10,honor:-3,unflag:"rk_deadpay"},
            },
          },
          {
            t: "Tell the truth: he is dead",
            r: `"Dead of the flux. I kept him on." The clerk writes something long. You pay it all back and lose a season's merit.`,
            fx: {coin:-20,merit:-6,honor:2,wil:1,unflag:"rk_deadpay"},
          },
        ],
      },
      {
        id: "rk_sgt_drunk_watch",
        cond: (p,C)=>mid(p,C)&&two(p),
        setup: prep,
        title: "Drunk on watch",
        text: "You find {mate2} drunk on watch, snoring against a cart wheel with an empty skin beside {m2him}. A sentry asleep can hang. A sergeant may fine, or flog up to six, with the captain's leave. {mate2} has a wife and three children. {M2he} also nearly got the camp killed.",
        choices: [
          {
            t: "Six strokes, at morning muster",
            r: "Six strokes. {mate2} takes them without a sound. No one in the section sleeps on watch again.",
            fx: both({merit:3,skill:{command:2}},op2(-15)),
          },
          {
            t: "Fine {m2him} a month's pay for the man who covered",
            r: "The money moves from {mate2} to the man who stood double watch. It is a kind of justice the section understands.",
            fx: both({skill:{command:3},rel:{who:"comrade",op:3,all:!0}},op2(-8)),
          },
          {
            t: "Wake {m2him}, and keep it between you",
            r: "You kick {mate2} awake and stand the rest of the watch with {m2him}. {M2he} never drinks on duty again, and never forgets.",
            fx: both({wil:.5},op2(25)),
          },
          {
            t: "Report it to the captain",
            r: "The captain decides the camp needs a lesson. {mate2} hangs at dawn.",
            fx: both({merit:5,happy:-8,wil:2,rel:{who:"comrade",op:-6,all:!0}},die2("hanged for sleeping on watch")),
          },
        ],
      },
      {
        id: "rk_sgt_old_friend",
        cond: (p,C)=>mid(p,C)&&mates(p),
        setup: prep,
        title: "Old friends, new stripes",
        text: `{mate} was beside you in the ranks for years. Now you are {mhis} sergeant, and {mhe} cannot get used to it: "Come on, {name}, it's me." {Mhe} takes the dry billet, skips the dig, and laughs at your orders. The section is watching.`,
        choices: [
          {
            t: "Take {mhim} aside and tell {mhim} straight",
            check: {s:"persuasion",s2:"command",d:45},
            win: {
              r: `"In front of them, I'm the sergeant. Behind the wagons, I'm still me." {mate} understands. It costs you both something.`,
              fx: {them:{op:5},skill:{command:3},merit:2},
            },
            lose: {r:"{mate} laughs it off. Nothing changes, and the section notices.",fx:{merit:-2,them:{op:3}}},
          },
          {
            t: "Give {mhim} the worst duty, publicly",
            r: "Latrines, a week of them. {mate} stops laughing. {Mhe} stops talking to you as well.",
            fx: {them:{op:-25},skill:{command:2},merit:3},
          },
          {
            t: "Let it go. Friendship matters more.",
            r: "You let it go. {mate} is happy. The rest of the section starts taking the dry billet too.",
            fx: {them:{op:10},merit:-3},
          },
        ],
      },
      {
        id: "rk_sgt_straggler",
        cond: (p,C)=>mid(p,C)&&war(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.str=nm(p)},
        title: "At the back of the column",
        text: "A sergeant marches at the back to keep stragglers moving. Today the straggler is {str}, a quiet man with bleeding feet who sits down on the verge and says he cannot go on. Enemy riders have been seen on the hills behind.",
        choices: [
          {
            t: "Carry his pack and his spear",
            r: "Twenty-five kilos more. You catch the column at dusk with {str} hobbling beside you, and a back that aches for a week.",
            fx: {sta:1,honor:3,wil:1,health:-3},
          },
          {
            t: "Bully him onto his feet",
            check: {s:"intimidation",s2:"command",d:40},
            win: {
              r: "You shout until he is more afraid of you than of his feet. He makes it. He will hate you until he is old enough to thank you.",
              fx: {skill:{intimidation:2,command:2},merit:2},
            },
            lose: {
              r: "He will not move. You leave him. You do not look back, and later you wish you had.",
              fx: {wil:1.5,happy:-5},
            },
          },
          {
            t: "Bribe a carter to take him (2 suns)",
            req: p=>p.coin>=2,
            r: "Two suns and he rides on a sack of oats. He is back in the line in a week.",
            fx: {coin:-2,honor:2},
          },
        ],
      },
      {
        id: "rk_sgt_first_blow",
        cond: (p,C)=>mid(p,C)&&war(p),
        setup: prep,
        title: "At the front",
        text: "The sergeant takes the first blow. Today the enemy comes out of the morning mist at a run, and your section is the point of the line. A big man with a {foe} badge is coming straight at you.",
        choices: [
          {
            t: "Meet him head on",
            r: "You plant your feet.",
            fx: {
              merit: 4,
              duel: {
                tier: 3,
                title: "a big man in the mist",
                opts: {kind:"duel",place:"the front of the line",title:"The first blow"},
              },
            },
          },
          {
            t: "Lock shields and let the section take him together",
            check: {s:"command",s2:"shield",d:50},
            win: {
              r: "Three shields, three spears, one man. He never reaches you. Neither does the charge behind him.",
              fx: {merit:6,skill:{command:2,shield:2}},
            },
            lose: {
              r: "The shields are slow. He breaks through, and you take a cut stopping him.",
              fx: {merit:3,wound:"deep_cut",health:-12,cause:"a cut in the line"},
            },
          },
        ],
      },
      {
        id: "rk_sgt_bad_order",
        cond: (p,C)=>mid(p,C)&&war(p),
        setup: prep,
        title: "A stupid order",
        text: "The squad captain orders your section across three hundred paces of open meadow to take a hedge full of crossbowmen. There is a sunken lane that runs round to the same hedge. He did not look at the map. He is not here.",
        choices: [
          {
            t: "Obey to the letter",
            r: "You take the hedge across the open meadow. It costs four men. The squad captain calls it a fine attack.",
            fx: {merit:4,happy:-6,wil:1.5},
          },
          {
            t: "Take the sunken lane instead",
            check: {s:"tactics",s2:"stealth",d:50},
            win: {
              r: "You come out of the lane behind the hedge. The crossbowmen run. The squad captain takes credit, and the section knows the truth.",
              fx: {merit:6,skill:{tactics:3},rel:{who:"comrade",op:8,all:!0}},
            },
            lose: {
              r: "The lane is watched too. You take the hedge, late and bloody, and the squad captain wants to know why you disobeyed.",
              fx: {merit:-4,health:-6,wil:1},
            },
          },
          {
            t: "Send a runner back to argue",
            r: "By the time the runner returns, the chance is gone. The squad captain is furious with everyone.",
            fx: {merit:-2},
          },
        ],
      },
      {
        id: "rk_sgt_fever",
        cond: (p,C)=>mid(p,C)&&mates(p),
        setup: prep,
        title: "Hiding the sick",
        text: "Fever in the section. The order is that sick men go to the fever-barn, and the men know what the fever-barn is: a place to die among strangers. {mate} is sick, and {mhe} is begging you not to send {mhim}.",
        choices: [
          {
            t: "Hide {mhim} and nurse {mhim} in the section",
            check: {s:"medicine",s2:"sta",d:50},
            win: {
              r: "Broth, clean water and a blanket. {mate} lives, and nobody else catches it.",
              fx: {them:{op:25},skill:{medicine:3}},
            },
            lose: {
              r: "{mate} lives. Two other men catch it, and one does not.",
              fx: {them:{op:20},happy:-6,wil:1.5,merit:-3},
            },
          },
          {
            t: "Send {mhim} to the fever-barn",
            r: "You send {mhim}. It was the right order. You know that. It does not help.",
            fx: both({wil:1.5,merit:2}, (p,ctx)=>A.chance(.5)?die1("the camp fever, in the fever-barn")(p,ctx):`${ctx.mate} comes back a month later, thin as a rake.`),
          },
          {
            t: "Go with {mhim} and see the barn cleaned",
            r: "You spend two days in the fever-barn hauling out straw and bullying the orderlies. It is a little less of a place to die after that.",
            fx: {health:-6,honor:4,them:{op:15},fame:1,cause:"camp fever"},
          },
        ],
      },
      {
        id: "rk_sgt_feud",
        cond: (p,C)=>mid(p,C),
        setup: (p,ctx)=>{prep(p,ctx),ctx.rsg=nm(p)},
        title: "The other section",
        text: "Sergeant {rsg}'s section keeps stealing your section's firewood, then the dry corner of the barn, then your water turn at the well. It is a game. It is also starting to turn into knives.",
        choices: [
          {
            t: "Raid them back, better",
            check: {s:"stealth",s2:"command",d:45},
            win: {
              r: "By morning you have their firewood, their dry corner and their cook-pot. {rsg} laughs and calls a truce over a jug.",
              fx: {rel:{who:"comrade",op:6,all:!0},skill:{command:2},newRel:{type:"friend",op:15}},
            },
            lose: {
              r: "They were waiting. Two of your men take a beating and the squad captain fines both sections.",
              fx: {coin:-4,rel:{who:"comrade",op:-2,all:!0}},
            },
          },
          {
            t: "Challenge {rsg} to settle it with staves",
            r: "Two sergeants, two staves, two sections cheering.",
            fx: {
              duel: {
                tier: 2,
                title: "a rival sergeant",
                opts: {kind:"brawl",lethal:!1,toYield:!0,place:"the barn floor",title:"Sergeant against sergeant"},
              },
            },
          },
          {
            t: "Take it to the squad captain",
            r: "He separates the sections by a field and tells you both to grow up. Your men think you ran to the teacher.",
            fx: {rel:{who:"comrade",op:-3,all:!0},merit:1},
          },
        ],
      },
      {
        id: "rk_sgt_dirty_job",
        cond: (p,C)=>C.soldier(p)&&rk(p)===2,
        setup: (p,ctx)=>{prep(p,ctx),ctx.debtor=nm(p)},
        title: "A small favor",
        text: '"A sergeant who rises to captain is a story people tell," the captain says, pouring you wine. "I could make that story yours." He wants a small favor: a wine-merchant called {debtor} owes him money and needs persuading. With a stick, in the dark.',
        choices: [
          {
            t: "Do it",
            r: "You do it. The merchant pays. Your name goes on the captain's list, and something goes off yours.",
            fx: {merit:15,honor:-8,happy:-3},
          },
          {
            t: "Persuade the merchant with words instead",
            check: {s:"persuasion",s2:"intimidation",d:50},
            win: {
              r: "You sit with the merchant and explain the facts of life. He pays, unbroken. The captain is pleased, and so are you.",
              fx: {merit:10,skill:{persuasion:2}},
            },
            lose: {r:"The merchant laughs you out of his shop. The captain decides you are not useful.",fx:{merit:-3}},
          },
          {
            t: "Refuse",
            r: `"I'm a soldier, sir. Not a bailiff." The captain smiles, puts the wine away, and never offers again.`,
            fx: {honor:4,merit:-2},
          },
        ],
      },
      {
        id: "rk_sgt_recommend",
        cond: (p,C)=>mid(p,C)&&two(p),
        setup: prep,
        title: "A file-leader's staff",
        text: "The squad captain wants a name for file-leader, and he will take yours. {mate} is your friend, steady, slow and liked. {mate2} is sharp and brave and nobody can stand {m2him}.",
        choices: [
          {
            t: "Name {mate}",
            r: "{mate} gets the staff and leads a quiet, steady file. Nobody dies who need not have.",
            fx: both({them:{op:15}},op2(-10)),
          },
          {
            t: "Name {mate2}",
            check: {s:"command",s2:"int",d:45},
            win: {
              r: "{mate2} is a good file-leader, which surprises everyone but you. The squad captain notices your eye for men.",
              fx: both({merit:5,skill:{command:2},them:{op:-5}},op2(25)),
            },
            lose: {
              r: "{mate2} drives the file so hard that two men desert. You picked {m2him}.",
              fx: both({merit:-4,them:{op:-5}},op2(10)),
            },
          },
          {
            t: "Let the file vote",
            r: "Not the custom, but the file likes it. They choose {mate}, and they feel they own the choice.",
            fx: {them:{op:10},rel:{who:"comrade",op:4,all:!0},skill:{command:1}},
          },
        ],
      },
      {
        id: "rk_sgt_mother",
        cond: (p,C)=>mid(p,C),
        setup: (p,ctx)=>{prep(p,ctx),ctx.son=nm(p)},
        title: "A mother at the gate",
        text: "A woman has walked from her village to the camp gate with a basket of bread and a pair of new socks. She is looking for her son, {son}, of your section. {son} died of a crossbow bolt six weeks ago. Nobody wrote to her.",
        choices: [
          {
            t: "Tell her the truth, gently, and how he died",
            r: "You sit with her on a log and tell her everything. She asks to see his grave. You take her there yourself.",
            fx: {wil:2,honor:4,piety:2,happy:-4},
          },
          {
            t: "Give her his back pay and his things",
            r: "Eleven suns and a wooden spoon he carved. She holds the spoon, not the coins.",
            fx: {coin:-5,honor:4,wil:1.5,happy:-3},
          },
          {
            t: "Say he has been moved to another company",
            r: "She goes home with her bread to wait. You will think of her waiting for a long time.",
            fx: {honor:-3,happy:-5,wil:1},
          },
        ],
      },
      {
        id: "rk_sqc_warrant",
        cond: (p,C)=>C.soldier(p)&&rk(p)===3&&crown(p),
        once: !0,
        setup: prep,
        title: "The warrant",
        text: `A squad captain is the first rung with a written warrant from a lord, and the first who can be hanged for a mistake that kills his squad. Yours is waiting at the steward's office of Lord {lord}. The steward's clerk says there is "a small fee for the seal". Twenty suns.`,
        choices: [
          {
            t: "Pay the fee (20 suns)",
            req: p=>p.coin>=20,
            r: "Twenty suns, and the warrant is in your hand with a red seal on it. The date is written on it. That date will matter for the rest of your career.",
            fx: {coin:-20,merit:2},
          },
          {
            t: "Go over the clerk's head",
            check: {s:"persuasion",s2:"etiquette",d:50},
            win: {
              r: "You ask to see the steward himself. The fee vanishes, and so, a week later, does the clerk.",
              fx: {merit:3,honor:2,skill:{etiquette:2}},
            },
            lose: {
              r: `The steward is the clerk's uncle. Your warrant is "delayed" by three months, and dated three months later.`,
              fx: {merit:-6,wil:1},
            },
          },
          {
            t: "Wait it out",
            r: "You wait. The warrant comes in the end, dated late. Two men who started after you now outrank you.",
            fx: {merit:-3,wil:.5},
          },
        ],
      },
      {
        id: "rk_sqc_sergeants",
        cond: (p,C)=>C.soldier(p)&&rk(p)===3&&two(p),
        setup: prep,
        title: "Left hand, right hand",
        text: "A squad captain has two sergeants, his left hand and his right. Yours, {mate} and {mate2}, hate each other over something that happened before you came. Today each refuses to march behind the other's section.",
        choices: [
          {
            t: "Make them march together, at the head, all day",
            r: "A whole day side by side at the front, eating each other's dust. By evening they are united in hating you. It is a start.",
            fx: {skill:{command:3},merit:2},
          },
          {
            t: "Find out what happened between them",
            check: {s:"diplomacy",s2:"int",d:50},
            win: {
              r: "A dead brother, a lie, an old debt. You make {mate2} pay it and {mate} accept it. They never become friends. They stop being enemies.",
              fx: both({skill:{diplomacy:3,command:2},merit:4,them:{op:10}},op2(10)),
            },
            lose: {r:"Each tells a different story, and both are lies. You are no wiser.",fx:{}},
          },
          {
            t: "Break one of them back to file-leader",
            r: "You break {mate2}. The squad is quieter. {mate2} is a dangerous man to have behind you.",
            fx: both({merit:2,skill:{command:1}},op2(-40)),
          },
        ],
      },
      {
        id: "rk_sqc_knights",
        cond: (p,C)=>C.soldier(p)&&rk(p)===3&&lowborn(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.kn=nm(p)},
        title: "A banner of knights",
        text: `A knight's banner, twenty lances, is put under your command for a raid. A banner is a squad captain's command by the book. Sir {kn}, who leads them, looks at your boots and says, "My lances do not take orders from a ploughboy."`,
        choices: [
          {
            t: "Show him the warrant and the book",
            check: {s:"etiquette",s2:"wil",d:55},
            win: {
              r: "You quote the rule word for word, calmly, in front of his men. He obeys, stiffly. He also fights well, and says so at supper.",
              fx: {merit:6,skill:{etiquette:2,command:2},honor:2},
            },
            lose: {
              r: "He laughs and leads his lances wherever he likes. The raid is a mess.",
              fx: {merit:-4,happy:-4,wil:1},
            },
          },
          {
            t: "Let him lead the charge and you lead everything else",
            check: {s:"tactics",s2:"diplomacy",d:45},
            win: {
              r: "He gets his glory, you get your raid. Both of you get what you want, and the commander sees who planned it.",
              fx: {merit:8,skill:{tactics:3}},
            },
            lose: {r:"He charges too early. You get the blame.",fx:{merit:-3}},
          },
          {
            t: "Challenge him, here and now",
            r: `"Then dismount, sir knight, and we'll see who gives orders."`,
            fx: {
              duel: {
                tier: 3,
                title: "a proud knight",
                troop: "HC",
                opts: {kind:"duel",lethal:!1,toYield:!0,place:"the horse lines",title:"Ploughboy and knight"},
              },
            },
          },
        ],
      },
      {
        id: "rk_sqc_fine",
        cond: (p,C)=>C.soldier(p)&&rk(p)===3,
        setup: (p,ctx)=>{prep(p,ctx),ctx.sold=nm(p)},
        title: "A week's pay",
        text: "{sold} sold his issued cloak to a farmer for bread money. A squad captain can fine a soldier up to a week's pay. His wife and two children are living in a lean-to behind the baggage carts, and they are the ones who ate the bread.",
        choices: [
          {
            t: "Fine him the full week. Rules are rules.",
            r: "A week's pay. His children are hungrier. The squad stops selling its kit.",
            fx: {merit:3,skill:{command:2},happy:-2},
          },
          {
            t: "Fine him a penny, then buy him a new cloak (6 suns)",
            req: p=>p.coin>=6,
            r: "A penny fine and a new cloak from your own purse. The squad knows exactly what you did. They would follow you a long way.",
            fx: {coin:-6,honor:4,rel:{who:"comrade",op:6,all:!0}},
          },
          {
            t: "Put the family on the company's ration roll",
            check: {s:"persuasion",s2:"logistics",d:50},
            win: {
              r: 'You talk the quartermaster into feeding them as "washers". Nobody steals cloaks for bread any more.',
              fx: {honor:3,skill:{logistics:2},merit:2},
            },
            lose: {r:"The quartermaster refuses. You fine the man anyway, and hate it.",fx:{happy:-3}},
          },
        ],
      },
      {
        id: "rk_sqc_inquiry",
        cond: (p,C)=>C.soldier(p)&&rk(p)===3&&war(p),
        w: .7,
        setup: prep,
        title: "The court of inquiry",
        text: "Your squad was caught in its camp at dawn and lost eleven men. The commander has called an inquiry: did you post pickets? You did, but the picket on the north side was {mate2}, and {m2he} was asleep. {M2he} is dead now.",
        choices: [
          {
            t: "Tell the truth, all of it",
            r: "The court finds the fault was the sentry's. You keep your warrant. {mate2}'s family never learns why he died.",
            fx: {merit:-2,honor:3,wil:1.5},
          },
          {
            t: "Take the blame yourself",
            r: '"I posted them. I should have walked the line myself." The court fines you and lets you keep your warrant. The squad heard every word.',
            fx: {merit:-6,coin:-20,honor:6,rel:{who:"comrade",op:8,all:!0},wil:2},
          },
          {
            t: "Blame the captain who chose the camp ground",
            check: {s:"intrigue",s2:"persuasion",d:55},
            win: {
              r: "The camp was in a hollow. You prove it. The captain is reprimanded. You have an enemy for life.",
              fx: {merit:2,newRel:{type:"enemy",op:-40}},
            },
            lose: {
              r: "Nobody believes it. The captain is the commander's friend. You lose a year's seniority.",
              fx: {merit:-12,wil:2},
            },
          },
        ],
      },
      {
        id: "rk_sqc_old_sgt",
        cond: (p,C)=>C.soldier(p)&&rk(p)===3&&C.ageAdj(p)<26,
        setup: (p,ctx)=>{prep(p,ctx),ctx.os=nm(p),ctx.oy=A.ri(22,34)},
        title: "Too young for this",
        text: `Squad captains are young. Your senior sergeant, {os}, has {oy} years of service and grey in his beard. He calls you "sir" in a tone that means "boy". In the first week he tests you: the squad's kit list comes to you with three deliberate mistakes.`,
        choices: [
          {
            t: "Find all three and hand it back without a word",
            check: {s:"logistics",s2:"int",d:45},
            win: {
              r: 'He reads your marks, grunts, and from then on he says "sir" as if he means it.',
              fx: {merit:4,skill:{logistics:2},newRel:{type:"mentor",op:30}},
            },
            lose: {r:"You find one. He smiles very slightly. The test goes on for a year.",fx:{skill:{logistics:1}}},
          },
          {
            t: "Ask him to teach you",
            r: `"First sensible thing an officer's said to me in ten years." He teaches you the squad: who drinks, who lies, who will stand.`,
            fx: {skill:{command:3,logistics:2},newRel:{type:"mentor",op:35}},
          },
          {
            t: "Remind him who holds the warrant",
            r: "He does exactly what he is told, no more, for a year. You learn how much a sergeant does that he is not told.",
            fx: {merit:-2,wil:1,skill:{command:1}},
          },
        ],
      },
      {
        id: "rk_sqc_horse_raid",
        cond: (p,C)=>C.soldier(p)&&rk(p)===3&&war(p),
        setup: prep,
        title: "The horse lines",
        text: "Your scouts have found the {foe} horse lines, a kilometer from their camp and guarded by a handful of grooms. A hundred horses. A squad could run them off in the dark, if nothing goes wrong. Nobody ordered it.",
        choices: [
          {
            t: "Take the squad and run the horses off",
            check: {s:"stealth",s2:"command",d:55},
            win: {
              r: "You come back at dawn with sixty horses and every man. The commander, who did not order it, decides he did.",
              fx: {merit:14,fame:3,coin:40,deed:"ran off the enemy horse lines by night"},
            },
            lose: {
              r: "The grooms raise the alarm. You get out with a dozen horses and leave three men behind.",
              fx: {merit:2,wil:1.5,health:-8,cause:"a night raid"},
            },
          },
          {
            t: "Report it and ask for leave to try",
            r: "By the time leave comes, the horse lines have moved. The commander says it was a good thought.",
            fx: {merit:3},
          },
          {
            t: "Go alone with two picked men",
            check: {s:"stealth",s2:"riding",d:60},
            win: {
              r: "Three of you, a hundred horses, one stampede through the enemy camp. They talk about it in both armies.",
              fx: {merit:18,fame:4,deed:"stampeded the enemy horse through their own camp"},
            },
            lose: {
              r: "A groom with a pitchfork finds you first.",
              fx: {
                duel: {
                  tier: 2,
                  title: "a horse-guard",
                  opts: {kind:"duel",place:"the horse lines",light:"night",title:"Among the horses"},
                },
              },
            },
          },
        ],
      },
      {
        id: "rk_sqc_wounded_enemy",
        cond: (p,C)=>mid(p,C)&&war(p),
        setup: prep,
        title: "Water",
        text: "After the skirmish a {foe} soldier lies in the ditch with a broken leg, asking for water in a voice like paper. Your men have just buried two of their own. One of them already has his knife out.",
        choices: [
          {
            t: "Give him water and send him to the surgeon",
            r: "You hold the flask yourself. The men mutter. Later, one of them says he is glad you did.",
            fx: {honor:5,piety:2,rel:{who:"comrade",op:-2,all:!0}},
          },
          {
            t: "Let the men have him",
            r: "You walk away. Behind you there is a short sound, then nothing.",
            fx: {honor:-5,rel:{who:"comrade",op:3,all:!0},happy:-3},
          },
          {
            t: "Question him first",
            check: {s:"intimidation",s2:"persuasion",d:45},
            win: {
              r: "For water and a promise, he tells you where his company is camped. The promise you keep.",
              fx: {merit:6,skill:{intimidation:2}},
            },
            lose: {r:"He tells you nothing but his mother's name, over and over.",fx:{happy:-2}},
          },
        ],
      },
      {
        id: "rk_sqc_fog",
        cond: (p,C)=>mid(p,C),
        setup: prep,
        title: "Lost in the fog",
        text: "A patrol, a fog thick as wool, and somewhere along the way you lost the road. Your men are looking at you. Every direction looks the same, and somewhere out there is the enemy, or a river, or a bog.",
        choices: [
          {
            t: "Read the ground: moss, slope, running water",
            check: {s:"survival",s2:"tracking",d:45},
            win: {
              r: "You follow the water downhill to the mill you passed at dawn. The men think you have a compass in your head.",
              fx: {skill:{survival:3},merit:3,rel:{who:"comrade",op:3,all:!0}},
            },
            lose: {
              r: "You walk the squad into a bog to the knees. You get out, wet and cursing, at dusk.",
              fx: {health:-4,merit:-2,happy:-2},
            },
          },
          {
            t: "Halt, form a ring, and wait for it to lift",
            r: "Three cold hours in a ring of spears. When the fog lifts, you are two hundred paces from the road. Nobody laughs. Everybody is alive.",
            fx: {skill:{tactics:1},wil:.5},
          },
          {
            t: "Send scouts in four directions",
            check: {s:"command",s2:"int",d:40},
            win: {r:"One comes back with the road. All four come back. Good.",fx:{skill:{command:2},merit:2}},
            lose: {r:"Three come back. The fourth turns up the next day, starving and ashamed.",fx:{happy:-2}},
          },
        ],
      },
      {
        id: "rk_cpt_letters",
        cond: (p,C)=>cpt(p,C)&&war(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.nd=A.ri(6,19)},
        title: "Letters to the dead men's homes",
        text: "A captain knows most of his men by name and signs for their pay, their rations and their wounds. After the last fight he signs for {nd} dead. Tonight, by a tallow candle, there are {nd} families who should hear it from you.",
        choices: [
          {
            t: "Write every letter yourself, and say something true in each",
            req: p=>p.literate,
            r: "It takes until dawn. You find one true thing to say about every man. Some of the letters come back years later, kept in chests, read to grandchildren.",
            fx: {wil:2,honor:5,fame:1,skill:{learning:1}},
          },
          {
            t: "Have the clerk write them and sign them all",
            r: "The clerk writes the same letter {nd} times. You sign them. It is what most captains do.",
            fx: {wil:.5},
          },
          {
            t: "Send the dead men's pay with a sergeant who knows the villages",
            r: "A sergeant walks the villages for a month with the pay and the news. It costs the company a sergeant for a month. The villages send recruits next spring.",
            fx: {merit:4,honor:3},
          },
        ],
      },
      {
        id: "rk_cpt_quartermaster",
        cond: (p,C)=>cpt(p,C),
        setup: (p,ctx)=>{prep(p,ctx),ctx.qm=nm(p)},
        title: "Sand in the sacks",
        text: ()=>`Your quartermaster, {qm}, signs for full sacks and the men get ${A.pick(["three parts flour and one part sand","oats meant for horses","salt pork that was condemned in the spring","boots that fall apart in the first rain"])}. You have counted. The difference is going somewhere, and his wife has a new house in {town}.`,
        choices: [
          {
            t: "Audit the books yourself and prove it",
            check: {s:"logistics",s2:"stewardship",d:55},
            win: {
              r: "Three nights with the ledgers and you have him: two hundred suns over two years. He is broken, the money comes back, and the commander starts asking your opinion on supply.",
              fx: {merit:15,skill:{logistics:4,stewardship:2},fame:1},
            },
            lose: {
              r: "The books are clean. Too clean. You know he did it and cannot prove it.",
              fx: {skill:{logistics:2},happy:-3},
            },
          },
          {
            t: "Make him repay it quietly, or else",
            check: {s:"intimidation",s2:"intrigue",d:45},
            win: {
              r: "He repays half in a month and the sacks are full ever after. Nobody else needs to know.",
              fx: {merit:6,coin:30,skill:{intimidation:2}},
            },
            lose: {
              r: "He goes over your head to the commander's clerk, who is his cousin. Now you are the troublemaker.",
              fx: {merit:-6,wil:1},
            },
          },
          {
            t: "Take a cut and say nothing",
            r: "Thirty suns a quarter, and your men eat sand. Every time you see them chew, you remember.",
            fx: {coin:60,honor:-10,happy:-3},
          },
          {
            t: "Report him to the commander",
            r: "The commander takes it seriously. A court of three captains strips {qm} and puts him in the ranks. The men cheer.",
            fx: {merit:8,honor:3,rel:{who:"comrade",op:4,all:!0}},
          },
        ],
      },
      {
        id: "rk_cpt_strength",
        cond: (p,C)=>cpt(p,C),
        setup: (p,ctx)=>{prep(p,ctx),ctx.str=A.ri(118,148)},
        title: "Under strength",
        text: "A good captain is judged by how near to two hundred he keeps his company. Yours stands at {str}: sickness, desertion, leave and the dead. The commander's inspection is next month.",
        choices: [
          {
            t: "Pay a bounty from your own purse (60 suns)",
            req: p=>p.coin>=60,
            r: "A sun a head and a drink, and the farm boys come. Thirty of them, green as grass. The company stands at near full strength.",
            fx: {coin:-60,merit:8},
          },
          {
            t: "Take convicts from the town gaol",
            check: {s:"command",s2:"intimidation",d:50},
            win: {
              r: "Thieves, brawlers and one forger. Hard men make hard soldiers, under a hard captain. They do well.",
              fx: {merit:7,skill:{command:3,intimidation:2}},
            },
            lose: {r:"A third of them desert in a month and take the company's mules.",fx:{merit:-4,coin:-20}},
          },
          {
            t: "Get the sick back on their feet",
            check: {s:"medicine",s2:"stewardship",d:45},
            win: {
              r: "Clean water, a camp on high ground, a latrine downwind and a surgeon you pay yourself. Twenty men walk out of the fever-tents.",
              fx: {merit:8,skill:{medicine:2,stewardship:2},honor:2},
            },
            lose: {r:"The fever does not care about inspections.",fx:{wil:1}},
          },
          {
            t: "Report the true number",
            r: "The commander raises an eyebrow at the number and writes it down. Honest, and on the record.",
            fx: {merit:-3,honor:2},
          },
        ],
      },
      {
        id: "rk_cpt_noble_rival",
        cond: (p,C)=>cpt(p,C)&&lowborn(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.nb=nm(p)},
        title: "Sir {nb}",
        text: `Captain Sir {nb} has the company beside yours. His grandfather was a count. In the officers' mess he calls you "the sergeant" and asks loudly whether you eat with a knife. The other officers laugh, carefully.`,
        choices: [
          {
            t: "Out-soldier him, every day, in front of the commander",
            check: {s:"command",s2:"tactics",d:55},
            win: {
              r: "By the end of the season your company is the best in the regiment and his is the worst. Nobody laughs at his jokes any more.",
              fx: {merit:15,skill:{command:2,tactics:2},fame:1},
            },
            lose: {
              r: "He has the commander's ear and better horses. The season goes to him.",
              fx: {merit:2,wil:1.5,happy:-3},
            },
          },
          {
            t: "Answer him in the mess with something sharp",
            check: {s:"persuasion",s2:"int",d:50},
            win: {
              r: ()=>`"${A.pick(["I eat with a knife, sir. I also fight with one.","Your grandfather was a count. What are you?","The sergeant would be happy to show the count's grandson how to hold a line."])}" The mess roars. Even he smiles, sourly.`,
              fx: {fame:1,happy:4,skill:{persuasion:2}},
            },
            lose: {
              r: "You stumble over the words. He finishes your sentence for you, to great applause.",
              fx: {happy:-4,wil:1},
            },
          },
          {
            t: "Call him out",
            r: `"Swords, at dawn, behind the mess tent. If the count's grandson can be bothered."`,
            fx: {
              duel: {
                tier: 3,
                title: "a count's grandson",
                troop: "HC",
                opts: {kind:"duel",lethal:!1,toYield:!0,place:"behind the mess tent",title:"Birth against merit"},
              },
            },
          },
          {
            t: "Let it go. You know what you are.",
            r: "You eat with a knife and say nothing. Your men know who leads them better.",
            fx: {wil:1.5},
          },
        ],
      },
      {
        id: "rk_cpt_highborn",
        cond: (p,C)=>cpt(p,C)&&highborn(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.sm=nm(p)},
        title: "The sergeant-major",
        text: 'Your sergeant-major, {sm}, has no men of his own, which is why he is trusted. He may speak plainly to an officer in private. Tonight he does: "Your orders today nearly got the second squad killed, sir. With respect, you were born to command. You were not born knowing how."',
        choices: [
          {
            t: "Listen, and ask what he would have done",
            r: "He tells you, at length, with diagrams in the dirt. From then on you ask him every night. Your company becomes a good one.",
            fx: {skill:{command:3,tactics:3},merit:5,newRel:{type:"mentor",op:35}},
          },
          {
            t: "Remind him of his place",
            r: '"Sir." He salutes and goes. He never speaks plainly again, and you lose the most useful man in the company without anyone noticing.',
            fx: {merit:-3,honor:-1},
          },
          {
            t: "Thank him, and do it your own way anyway",
            check: {s:"tactics",s2:"int",d:55},
            win: {
              r: "Your way works. He grunts and says nothing, which from a sergeant-major is applause.",
              fx: {skill:{tactics:2},merit:4},
            },
            lose: {r:"Your way does not work. He says nothing. He does not need to.",fx:{merit:-2,wil:1}},
          },
        ],
      },
      {
        id: "rk_cpt_scouts",
        cond: (p,C)=>cpt(p,C)&&war(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.sc1=nm(p),ctx.sc2=nm(p)},
        title: "Two scouts",
        text: "Two scouts ride in within an hour of each other. {sc1}, a hunter's son, says the {foe} column is on the river road, two thousand strong. {sc2}, a veteran rider, says it is on the hill road and half that. You must tell the commander which by noon.",
        choices: [
          {
            t: "Question them both again, separately and hard",
            check: {s:"int",s2:"tactics",d:50},
            win: {
              r: ()=>`${A.pick(["{sc1} counted the baggage, not the men. {sc2} saw the van.","{sc2} saw a feint: a few hundred men and many fires. {sc1} saw the real column."])} You send the true picture. It is right.`,
              fx: {merit:12,skill:{tactics:3}},
            },
            lose: {
              r: "Both stories hold up, and both cannot be true. You choose one. It is wrong.",
              fx: {merit:-6,wil:1},
            },
          },
          {
            t: "Ride out and look for yourself",
            check: {s:"riding",s2:"stealth",d:55},
            win: {
              r: "From a church tower you see both roads. It is the hill road, and it is a feint. The commander hears it from your own mouth.",
              fx: {merit:15,fame:1,skill:{riding:2,tactics:2}},
            },
            lose: {
              r: "Enemy riders chase you off before you see anything. You come back late, with a cut and nothing to report.",
              fx: {health:-10,wound:"deep_cut",merit:-2,cause:"enemy riders"},
            },
          },
          {
            t: "Report both, and let the commander decide",
            r: "The commander curses you for a coward and sends his own scouts. He decides. If he is wrong, it is not your fault.",
            fx: {merit:-2},
          },
        ],
      },
      {
        id: "rk_cpt_mutiny",
        cond: (p,C)=>cpt(p,C)&&two(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.sm=nm(p)},
        title: "Something in the air",
        text: 'Your sergeant-major, {sm}, asks for a private word. "Pay is two quarters late, sir. {mate2} is talking in the night, and the men are listening. If it goes, it goes in the next three days." A commander may hang one man in ten after a mutiny.',
        choices: [
          {
            t: "Pay the men a quarter out of your own purse",
            req: p=>p.coin>=150,
            r: "A hundred and fifty suns, counted out on a drumhead. The talk dies. You may get it back from the crown. You may not.",
            fx: {coin:-150,rel:{who:"comrade",op:10,all:!0},honor:4,merit:6,fame:1},
          },
          {
            t: "Talk to the men yourself, all of them, tonight",
            check: {s:"command",s2:"persuasion",d:55},
            win: {
              r: "You stand on a wagon and tell them the truth: the pay is late, you are owed too, and a mutiny gets one man in ten hanged. You promise to ride to the paymaster yourself. They give you a week. It is enough.",
              fx: {merit:10,skill:{command:3,persuasion:2},fame:1},
            },
            lose: {
              r: "Someone throws a clod of earth. Then a stone. You get down off the wagon with blood in your hair and a mutiny on your hands.",
              fx: both({health:-10,merit:-10,wil:2,cause:"a stone from a mutinous crowd"},(p,ctx)=>(p.flags.rk_mutiny=A.S.year,"")),
            },
          },
          {
            t: "Arrest {mate2} tonight, quietly",
            check: {s:"intrigue",s2:"command",d:50},
            win: {
              r: "{mate2} is in irons before midnight. Without a voice, the talk goes nowhere.",
              fx: both({merit:6,skill:{intrigue:2}},op2(-50)),
            },
            lose: {
              r: "The arrest is botched. The men see {mate2} dragged off and it starts there and then.",
              fx: both({merit:-8,wil:1.5,health:-6,cause:"a mutiny"},(p,ctx)=>(p.flags.rk_mutiny=A.S.year,"")),
            },
          },
          {
            t: "Report it to the commander",
            r: "The commander marches a loyal company into your lines at dawn. Three men hang. The pay comes a week later.",
            fx: both({merit:5,rel:{who:"comrade",op:-8,all:!0},happy:-6},die2("hanged as a ringleader of a mutiny that never happened")),
          },
        ],
      },
      {
        id: "rk_cpt_mutiny_after",
        cond: (p,C)=>C.soldier(p)&&C.flag(p,"rk_mutiny"),
        once: !0,
        setup: prep,
        title: "The reckoning",
        text: "The mutiny burned out in two days. Now the commander has come to sort it. He wants a list of names from you, and he will hang one man in ten from the list.",
        choices: [
          {
            t: "Give him a list with only the true ringleaders",
            r: "Four names. Four men hang. The company never forgives you, and never mutinies again.",
            fx: {merit:4,wil:2,happy:-6,unflag:"rk_mutiny"},
          },
          {
            t: "Put your own name at the top",
            check: {s:"wil",s2:"persuasion",d:55},
            win: {
              r: '"If anyone hangs, start with me. I failed them." The commander stares a long time, then tears up the list.',
              fx: {honor:8,fame:3,rel:{who:"comrade",op:15,all:!0},merit:-5,unflag:"rk_mutiny"},
            },
            lose: {
              r: "He takes your warrant away for a season and hangs three men anyway.",
              fx: {honor:6,merit:-25,wil:2,unflag:"rk_mutiny"},
            },
          },
          {
            t: "Refuse to give any names",
            r: "The commander draws lots himself. One man in ten. Your company watches you watch.",
            fx: {merit:-8,honor:3,wil:2,unflag:"rk_mutiny"},
          },
        ],
      },
      {
        id: "rk_cpt_massacre",
        cond: (p,C)=>cpt(p,C)&&war(p),
        w: .8,
        setup: (p,ctx)=>{prep(p,ctx),ctx.vil=A.pick(["Ash","Mill","Brook","Thorn","Elm","Stone","Wolf","Red"])+A.pick(["ford","wick","by","stead","holm","field"])},
        title: "The village of {vil}",
        text: `The commander's order comes by runner with a knotted cord for a token: the village of {vil} sheltered the raiders who ambushed the supply train. "Burn it. Let none go free to tell the next village it can be done." There are perhaps two hundred people in {vil}, most of them children and old.`,
        choices: [
          {
            t: "Refuse the order in writing",
            r: 'You write: "I will not." The commander sends another company, strikes your name from the list for promotion and calls you a coward in his dispatches. In {vil}, two hundred people never know your name.',
            fx: {honor:12,merit:-45,wil:3,fame:2,deed:"refused an order to burn a village with its people in it"},
          },
          {
            t: "Warn them first, then burn it empty",
            check: {s:"intrigue",s2:"stealth",d:50},
            win: {
              r: "A boy runs ahead with your message. By the time your company arrives, {vil} is empty. You burn it. The smoke can be seen for twenty kilometers, and nobody dies.",
              fx: {honor:6,merit:6,skill:{intrigue:2},wil:1},
            },
            lose: {
              r: "Someone sees the boy. The commander hears that a captain of his warned the enemy.",
              fx: {honor:6,merit:-30,wil:2},
            },
          },
          {
            t: "Obey",
            r: "You obey. You will dream of it for the rest of your life, and so will some of your men.",
            fx: {merit:15,honor:-20,happy:-15,wil:2,trait:"cruel"},
          },
          {
            t: "Ride to the commander and argue",
            check: {s:"persuasion",s2:"diplomacy",d:60},
            win: {
              r: "You argue that a burned village makes ten more raiders. He hangs the headman instead and lets the rest go. It is not good. It is less bad.",
              fx: {honor:6,merit:4,skill:{persuasion:3}},
            },
            lose: {
              r: "He listens, then sends another captain. {vil} burns anyway, and you are on his list.",
              fx: {honor:3,merit:-15,wil:2,happy:-6},
            },
          },
        ],
      },
      {
        id: "rk_cpt_exchange",
        cond: (p,C)=>cpt(p,C)&&war(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.ec=nm(p),ctx.ours=A.ri(8,25)},
        title: "An exchange",
        text: "You hold a {foe} captain, {ec}, taken in the last fight. Their commander sends a herald under a white branch: he will give back {ours} of your men, taken in the same fight, for {ec} alone. Your own commander says a captain is worth a ransom, not a swap.",
        choices: [
          {
            t: "Make the exchange on your own authority",
            r: "{ours} of your men walk back across the field. They know who brought them home. Your commander makes his displeasure known.",
            fx: {merit:-6,honor:5,rel:{who:"comrade",op:10,all:!0},fame:2},
          },
          {
            t: "Hold out for the exchange and a ransom",
            check: {s:"diplomacy",s2:"persuasion",d:55},
            win: {
              r: "{ours} men and two hundred suns. Everyone is pleased, even the herald.",
              fx: {merit:6,coin:200,skill:{diplomacy:3}},
            },
            lose: {r:"The herald rides away insulted. Your men stay prisoners another season.",fx:{merit:-2,happy:-4}},
          },
          {
            t: "Do as the commander says: ransom only",
            r: "You send the herald back. {ec}'s family pays a ransom in the end. Your own men come back in spring, thinner.",
            fx: {merit:4,coin:120},
          },
        ],
      },
      {
        id: "rk_cpt_breach",
        cond: (p,C)=>cpt(p,C)&&war(p),
        setup: prep,
        title: "The breach",
        text: 'The engines have made a breach in the wall, the width of a cart. Your company is told off to storm it at dawn. "An escalade succeeds in hours or not at all," the old saying goes. The rubble slope is steep, and you can see the defenders building a second wall behind the gap.',
        choices: [
          {
            t: "Go at dawn as ordered, at the head",
            check: {s:"ins",s2:"command",d:60},
            win: {
              r: "You are first up the rubble and first over the inner wall. The town falls by noon. They will name a gate after you.",
              fx: {merit:30,fame:5,wil:2,deed:"led the storm of a breach",epithet:"the Breach-Taker"},
            },
            lose: {
              r: "The inner wall holds. You come back down the rubble on two men's shoulders, and half your company does not come back at all.",
              fx: {merit:6,health:-30,wound:"broken_ribs",wil:3,happy:-10,cause:"the storm of a breach"},
            },
          },
          {
            t: "Ask for a day to build mantlets and a ramp of fascines",
            check: {s:"siegecraft",s2:"persuasion",d:50},
            win: {
              r: "One more day. You go up a ramp of brushwood bundles behind wooden shields, and the second wall is not finished yet. You lose eleven men instead of eighty.",
              fx: {merit:18,skill:{siegecraft:4},fame:2},
            },
            lose: {
              r: "The commander refuses. You go at dawn, unready, and pay for it.",
              fx: {merit:4,health:-15,wil:2,cause:"the storm of a breach"},
            },
          },
          {
            t: "Send your sappers to undermine the second wall",
            check: {s:"siegecraft",s2:"int",d:55},
            win: {
              r: "Your sappers fire the props at dawn and the inner wall drops into its own cellar. You walk in over the dust.",
              fx: {merit:20,skill:{siegecraft:4}},
            },
            lose: {
              r: "Water fills the gallery. Two days lost, and the commander sends another company in your place.",
              fx: {merit:-5},
            },
          },
        ],
      },
      {
        id: "rk_cpt_gate_offer",
        cond: (p,C)=>cpt(p,C)&&war(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.gc=nm(p)},
        title: "A voice at the postern",
        text: 'At midnight a voice calls from the postern gate your company is watching. It is the gate captain, {gc}: he will open it before dawn if you swear safe conduct for him and his forty men. "A bribe takes a night," the saying goes. A captain may not make treaties. A commander may.',
        choices: [
          {
            t: "Swear it, and send to the commander at once",
            check: {s:"diplomacy",s2:"command",d:50},
            win: {
              r: "The gate opens at the hour. The town falls without a ladder raised. The commander confirms your oath, grumbling about captains who make treaties.",
              fx: {merit:25,fame:3,honor:3,skill:{diplomacy:3}},
            },
            lose: {
              r: "The commander's men arrive too loud, too late. The gate captain's treachery is discovered, and he hangs on his own wall.",
              fx: {merit:-4,honor:-2,happy:-4},
            },
          },
          {
            t: "Suspect a trap and say no",
            r: "You keep your company back from the gate. At dawn you see the crossbows on the gatehouse roof. It was a trap.",
            fx: {merit:6,skill:{tactics:2}},
          },
          {
            t: "Swear it, take the town, and let the men loot",
            r: "The gate opens. You keep your word to {gc}. You keep no word to the town.",
            fx: {merit:15,coin:150,honor:-8,rel:{who:"comrade",op:5,all:!0}},
          },
        ],
      },
      {
        id: "rk_cpt_supply",
        cond: (p,C)=>cpt(p,C),
        setup: prep,
        title: "The carts are gone",
        text: ()=>`The company's carts were ${A.pick(["lost in a river crossing","taken by raiders on the road","commandeered by a general's baggage master","stuck in a bog twenty kilometers back"])}. You have two days' food for two hundred men and five days of march ahead.`,
        choices: [
          {
            t: "Cut rations to half and march on",
            check: {s:"command",s2:"wil",d:50},
            win: {
              r: "Half bread, full march, and you walk beside them on half bread too. You arrive thin and whole.",
              fx: {merit:8,wil:1.5,skill:{command:2}},
            },
            lose: {
              r: "Men fall out. Twenty are missing by the end. Some will turn up, some will not.",
              fx: {merit:-6,wil:1.5,happy:-4},
            },
          },
          {
            t: "Seize grain from the villages and leave crown receipts",
            r: "Grain for paper that will never be paid. Your men eat. The villages remember your face.",
            fx: {merit:6,honor:-5},
          },
          {
            t: "Find the carts",
            check: {s:"logistics",s2:"tracking",d:50},
            win: {
              r: "You ride back with ten men and find them: most of the food, some of the mules, and a quartermaster who is very glad to see you.",
              fx: {merit:8,skill:{logistics:3}},
            },
            lose: {r:"Two days lost searching, and nothing to show.",fx:{merit:-3,happy:-2}},
          },
          {
            t: "Buy on your own credit from the sutlers",
            req: p=>p.coin>=80,
            r: "Eighty suns for bread at robber prices. The company eats and marches. The crown may repay you. Ha.",
            fx: {coin:-80,merit:7,rel:{who:"comrade",op:5,all:!0}},
          },
        ],
      },
      {
        id: "rk_cpt_deserter_boy",
        cond: (p,C)=>cpt(p,C)&&crown(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.db=nm(p),ctx.dbage=A.ri(16,19)},
        title: "One witness",
        text: 'They bring {db} back in a cart: {dbage}, caught on the road home. A captain may hang a deserter caught in the act on one witness, and there are three. He does not deny it. "My mother was dying, sir. They would not give me leave. She died before I got there anyway."',
        choices: [
          {
            t: "Hang him. Desertion in wartime.",
            r: "You give the order. The company is silent. Nobody deserts that season.",
            fx: {merit:8,wil:2,happy:-8},
          },
          {
            t: "Flog him and put him back in the ranks",
            r: "Twelve strokes and back in the file. Some officers call you soft. {db} fights like a lion at the next battle.",
            fx: {merit:2,honor:4},
          },
          {
            t: "Write it down as absence, not desertion",
            check: {s:"intrigue",s2:"learning",d:45},
            win: {
              r: `A clerk's word, changed. "Absent without leave, returned." A fine and a flogging. He lives.`,
              fx: {honor:5,skill:{intrigue:2}},
            },
            lose: {
              r: "The commander's clerk notices. You are fined, and the boy hangs anyway on the commander's order.",
              fx: {coin:-30,merit:-8,honor:3,wil:2},
            },
          },
        ],
      },
      {
        id: "rk_cpt_spy",
        cond: (p,C)=>cpt(p,C)&&war(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.spy=nm(p)},
        title: "A man with a charcoal stick",
        text: 'Your sergeants catch a soldier of your own company, {spy}, behind the horse lines drawing the camp on a scrap of linen: the gates, the guard posts, your tent. He says he was "just passing the time".',
        choices: [
          {
            t: "Hang him as a spy",
            r: "He hangs at noon. The company sleeps better. You are not sure he was a spy.",
            fx: {merit:6,wil:1},
          },
          {
            t: "Turn him: let him send a map you draw",
            check: {s:"intrigue",s2:"deception",d:55},
            win: {
              r: "Your map shows a weak gate where your best crossbowmen are waiting. The {foe} raiders come to it two nights later.",
              fx: {merit:20,fame:2,skill:{intrigue:4}},
            },
            lose: {r:"He slips away in the night with your map and the real one.",fx:{merit:-8}},
          },
          {
            t: "Send him to the commander in chains",
            r: "The commander's men take him. Whatever he is, he is somebody else's problem now.",
            fx: {merit:4},
          },
        ],
      },
      {
        id: "rk_cpt_bridge",
        cond: (p,C)=>cpt(p,C)&&war(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.oc=nm(p)},
        title: "Burn the bridge",
        text: "The retreat crosses the river by one wooden bridge. Your company holds this bank. Captain {oc}'s company is still on the far side, fighting its way toward you, and the {foe} horse is right behind them. The commander's order: burn the bridge when the enemy reaches it.",
        choices: [
          {
            t: "Wait for {oc}'s men, then burn it",
            check: {s:"tactics",s2:"wil",d:55},
            win: {
              r: "{oc}'s last man runs across with flames licking his heels. The enemy horse pulls up at the burning bank. You saved a company.",
              fx: {
                merit: 15,
                fame: 3,
                newRel: {type:"friend",op:50},
                deed: "held a burning bridge for another man's company",
              },
            },
            lose: {
              r: "You wait too long. Enemy riders get across before the fire takes, and it costs your company dearly.",
              fx: {merit:-8,health:-15,wil:2,cause:"a fight at a burning bridge"},
            },
          },
          {
            t: "Burn it now, as ordered",
            r: "You burn it with {oc}'s company still on the far bank. Some swim. Most do not. The order was clear.",
            fx: {merit:6,happy:-10,wil:2,honor:-3},
          },
          {
            t: "Cross over yourself with half the company and bring them out",
            check: {s:"command",s2:"ins",d:60},
            win: {
              r: "You cross, form a hedge of spears, and walk both companies back over the bridge together. Then you burn it.",
              fx: {merit:25,fame:5,deed:"brought two companies back over a burning bridge"},
            },
            lose: {
              r: "You get them over, but not all of your own.",
              fx: {merit:6,health:-20,wound:"scar_arm",wil:3,cause:"a rearguard at the bridge"},
            },
          },
        ],
      },
      {
        id: "rk_cpt_horn",
        cond: (p,C)=>cpt(p,C)&&war(p),
        setup: prep,
        title: "No signal",
        text: "In the middle of the battle the horn calls stop. Smoke, noise, a hill between you and the commander. An order across a field takes five to ten minutes to come, and the enemy line in front of you has just opened a gap, right now.",
        choices: [
          {
            t: "Go through the gap on your own judgement",
            check: {s:"tactics",s2:"ins",d:55},
            win: {
              r: "Your company pours through and rolls up their flank. When the commander's runner finally arrives, the order is to do what you have already done.",
              fx: {merit:25,fame:3,skill:{tactics:4}},
            },
            lose: {
              r: "The gap was bait. You get out with half your company and a court of inquiry waiting.",
              fx: {merit:-15,wil:2,health:-10,cause:"a trap in the line"},
            },
          },
          {
            t: "Hold your ground and send a runner",
            r: "You hold. The gap closes. Nobody can say you did wrong, and nobody will sing about it either.",
            fx: {merit:3},
          },
          {
            t: "Send a squad to probe the gap",
            check: {s:"command",s2:"tactics",d:45},
            win: {
              r: "The squad finds it real. You follow them in. A good day.",
              fx: {merit:15,skill:{command:2,tactics:2}},
            },
            lose: {
              r: "The squad is cut off. You lose a hundred men to learn it was a trap.",
              fx: {merit:-5,wil:2,happy:-6},
            },
          },
        ],
      },
      {
        id: "rk_cpt_lords_horse",
        cond: (p,C)=>cpt(p,C),
        setup: (p,ctx)=>{prep(p,ctx),ctx.lordn=nm(p)},
        title: "A gift of a horse",
        text: 'Lord {lordn}, whose lands lie behind the lines, sends you a fine grey destrier and a letter. He asks only that your company be "posted to protect his villages" for the season. The posting is quiet. The front is not. Your men would live.',
        choices: [
          {
            t: "Accept the horse and arrange the posting",
            check: {s:"intrigue",s2:"persuasion",d:50},
            win: {
              r: "A quiet word with the commander's clerk. Your company spends the season guarding sheep. Nobody dies. You ride the best horse in the regiment.",
              fx: {gear:{mount:"destrier"},merit:-5,honor:-4,rel:{who:"comrade",op:6,all:!0}},
            },
            lose: {
              r: "The commander hears of the horse before the posting. He keeps the horse and sends your company to the worst post on the line.",
              fx: {merit:-12,honor:-3},
            },
          },
          {
            t: "Send the horse back with thanks",
            r: "You send it back. The lord is offended. Your honor is intact, and so is your posting at the front.",
            fx: {honor:4},
          },
          {
            t: "Keep the horse and do nothing",
            r: "You keep the horse. The lord writes to the commander. It becomes a story about you, and not a good one.",
            fx: {gear:{mount:"destrier"},honor:-8,merit:-6,newRel:{type:"enemy",op:-30}},
          },
        ],
      },
      {
        id: "rk_cpt_surgeon",
        cond: (p,C)=>cpt(p,C),
        setup: (p,ctx)=>{prep(p,ctx),ctx.sur=nm(p)},
        title: "A surgeon for the company",
        text: "The best armies keep a surgeon for every thousand men. Yours does not keep one for three thousand. A wandering barber-surgeon called {sur}, sober most days, offers to follow your company for thirty suns a season.",
        choices: [
          {
            t: "Hire him out of your own purse (30 suns)",
            req: p=>p.coin>=30,
            r: "By the end of the season he has drawn twenty arrows, set nine bones and saved more men than any sword. Your company has the lowest losses in the regiment.",
            fx: {coin:-30,merit:10,honor:2,rel:{who:"comrade",op:6,all:!0}},
          },
          {
            t: "Ask the commander to pay for him",
            check: {s:"persuasion",s2:"stewardship",d:50},
            win: {
              r: "You show him the numbers. He pays. Soon every company in the regiment wants one.",
              fx: {merit:8,skill:{stewardship:2}},
            },
            lose: {r:'"Surgeons cost money. Soldiers are free." He says it as a joke.',fx:{happy:-3}},
          },
          {
            t: "Learn what you can from him yourself",
            r: "You buy him wine and watch him work for a month. You learn to stanch, stitch and splint.",
            fx: {skill:{medicine:5},coin:-4},
          },
        ],
      },
      {
        id: "rk_cpt_credit",
        cond: (p,C)=>cpt(p,C)&&war(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.rc=nm(p)},
        title: "Stolen credit",
        text: "Your company took the mill and held it through the night. In the morning, Captain {rc}, whose company arrived at dawn, sends his report to the commander first. In it, the mill is his.",
        choices: [
          {
            t: "Send your own report, with witnesses",
            check: {s:"persuasion",s2:"intrigue",d:50},
            win: {
              r: "Three sergeants and a miller swear to it. The commander reads both reports, then looks at {rc} for a long time.",
              fx: {merit:12,newRel:{type:"rival",op:-30}},
            },
            lose: {r:"{rc} is a better liar than you are a writer. The mill is his.",fx:{merit:-2,wil:1,happy:-4}},
          },
          {
            t: "Confront {rc} in front of the officers",
            r: '"Captain, your report is a lie." Everyone hears it. He draws his sword.',
            fx: {
              duel: {
                tier: 3,
                title: "a captain who lies",
                opts: {kind:"duel",lethal:!1,toYield:!0,place:"outside the commander's tent",title:"For the mill"},
              },
            },
          },
          {
            t: "Let it go. Your men know who took the mill.",
            r: "Your men know, and that is enough. Almost.",
            fx: {wil:1,rel:{who:"comrade",op:3,all:!0}},
          },
        ],
      },
      {
        id: "rk_cpt_new_sm",
        cond: (p,C)=>cpt(p,C)&&two(p),
        setup: prep,
        title: "A new sergeant-major",
        text: "Your sergeant-major died of the flux. You need another: the man who keeps the roll, the pay-book and the drill, and tells you the truth. {mate} is the oldest sergeant, loyal and slow. {mate2} is sharp, ambitious and probably honest.",
        choices: [
          {
            t: "Choose {mate}, the oldest",
            r: "{mate} runs things the way they have always been run. The company is steady. Nothing improves. Nothing breaks.",
            fx: {them:{op:15},merit:2},
          },
          {
            t: "Choose {mate2}, the sharp one",
            check: {s:"command",s2:"int",d:50},
            win: {
              r: "{mate2} tightens everything in a month: the pay, the drill, the roll. The commander notices your company.",
              fx: both({merit:10},op2(20)),
            },
            lose: {
              r: "{mate2} uses the post to settle old scores. You spend a season cleaning up.",
              fx: both({merit:-4},op2(5)),
            },
          },
          {
            t: "Ask the sergeants to choose among themselves",
            r: "They choose {mate}, after a long night and a short fight. They respect the choice because it was theirs.",
            fx: {them:{op:10},skill:{command:2},rel:{who:"comrade",op:3,all:!0}},
          },
        ],
      },
      {
        id: "rk_sen_court",
        cond: (p,C)=>C.soldier(p)&&rk(p)===5,
        setup: (p,ctx)=>{prep(p,ctx),ctx.acc=nm(p)},
        title: "The court of three",
        text: "A senior captain may try a soldier before a court of three captains. Today it is an officer: Captain {acc}, accused of cowardice. He pulled his company back from a ridge without orders. He says he would have lost every man. The ridge fell an hour later anyway.",
        choices: [
          {
            t: "Acquit him: he saved two hundred men",
            r: "The court acquits. Half the wing says you are soft. {acc}'s two hundred men say otherwise, and they say it loudly.",
            fx: {honor:4,merit:-3,rel:{who:"comrade",op:6,all:!0}},
          },
          {
            t: "Break him to the ranks: orders are orders",
            r: "He goes back to the ranks with a branded wrist. The wing learns that a ridge is held until you are told otherwise.",
            fx: {merit:6,wil:1},
          },
          {
            t: "Find the truth first",
            check: {s:"int",s2:"tactics",d:50},
            win: {
              r: ()=>`You walk the ridge. ${A.pick(["There was no way to hold it. You say so and acquit him, and the commander reads your reasons and agrees.","He ran before the enemy was close. You break him, and nobody can say it was unjust."])}`,
              fx: {merit:6,skill:{tactics:2},honor:2},
            },
            lose: {r:"The witnesses all say different things. You decide, and you are never sure.",fx:{wil:1}},
          },
        ],
      },
      {
        id: "rk_sen_clerk",
        cond: (p,C)=>C.soldier(p)&&rk(p)>=5&&rk(p)<=6,
        setup: (p,ctx)=>{prep(p,ctx),ctx.clk=nm(p)},
        title: "Your clerk",
        text: "At your rank orders are written by a clerk. Yours, {clk}, has a neat hand and a cousin on the staff of a rival officer. Lately your plans are known to the rival before they are known to your own captains.",
        choices: [
          {
            t: "Feed him a false plan and watch where it goes",
            check: {s:"intrigue",s2:"int",d:50},
            win: {
              r: "The false plan turns up in your rival's mouth at the council. You let him finish, then show the real one.",
              fx: {merit:15,skill:{intrigue:3},fame:1},
            },
            lose: {r:"{clk} is too clever for the bait. You are left with suspicions and no proof.",fx:{wil:1}},
          },
          {
            t: "Dismiss him and write your own orders",
            req: p=>p.literate,
            r: "Your hand is worse and your nights are longer. But your plans stay yours.",
            fx: {skill:{learning:2},merit:2,health:-2},
          },
          {
            t: "Have him thrown in the stocks",
            r: "He goes in the stocks and swears he did nothing. Maybe he did not. Your rival knows that you know.",
            fx: {merit:2,newRel:{type:"rival",op:-25}},
          },
        ],
      },
      {
        id: "rk_sen_quarrel",
        cond: (p,C)=>C.soldier(p)&&rk(p)>=5&&rk(p)<=6,
        setup: (p,ctx)=>{prep(p,ctx),ctx.c1=nm(p),ctx.c2=nm(p)},
        title: "Captains at dawn",
        text: "Two of your captains, {c1} and {c2}, have arranged to fight at dawn over a woman, or a horse, or an insult; the story changes depending on who tells it. Both are good officers. One of them will be dead by breakfast.",
        choices: [
          {
            t: "Stand between them at dawn",
            check: {s:"command",s2:"wil",d:50},
            win: {
              r: "You stand between the blades and say you will hang the survivor. They put up their swords, and later they even shake hands.",
              fx: {merit:8,skill:{command:3},fame:1},
            },
            lose: {r:"They fight anyway, around you. {c2} dies in the wet grass.",fx:{merit:-5,wil:1.5,happy:-4}},
          },
          {
            t: "Post them to opposite ends of the wing",
            r: "A hundred kilometers between them. Problem solved, for now.",
            fx: {merit:3,skill:{command:1}},
          },
          {
            t: "Let them fight. Officers are gentlemen.",
            r: "{c1} wins. You lose a captain, and the wing learns that honor matters more to you than men.",
            fx: {merit:-2,happy:-2},
          },
        ],
      },
      {
        id: "rk_cmd_staff",
        cond: (p,C)=>C.soldier(p)&&rk(p)===6,
        once: !0,
        setup: (p,ctx)=>{prep(p,ctx),ctx.q1=nm(p),ctx.q2=nm(p)},
        title: "Your staff",
        text: "A commander has a staff: a quartermaster, a master of signals, a surgeon, and a band of runners. For quartermaster you have two names: {q1}, honest and slow, who has never lost a cart; and {q2}, quick and brilliant, who has twice been accused of skimming and never convicted.",
        choices: [
          {
            t: "Take {q1}, the honest one",
            r: "Your regiment always eats, a day late. Nobody ever steals from it.",
            fx: {merit:5,skill:{logistics:2},honor:2},
          },
          {
            t: "Take {q2} and watch him",
            check: {s:"stewardship",s2:"intrigue",d:55},
            win: {
              r: "{q2} feeds the regiment faster than anyone thought possible, and he knows that you count every sack. A fine partnership.",
              fx: {merit:15,skill:{logistics:3,stewardship:2}},
            },
            lose: {
              r: "He feeds the regiment brilliantly and steals brilliantly. You find out a year too late.",
              fx: {merit:4,coin:-100,honor:-2},
            },
          },
          {
            t: "Be your own quartermaster",
            check: {s:"logistics",s2:"stewardship",d:60},
            win: {
              r: "You do two jobs and do both well. You also stop sleeping.",
              fx: {merit:12,skill:{logistics:4},health:-5},
            },
            lose: {
              r: "You do two jobs and both badly. The regiment goes hungry while you count carts.",
              fx: {merit:-8,health:-5},
            },
          },
        ],
      },
      {
        id: "rk_cmd_decimate",
        cond: (p,C)=>C.soldier(p)&&rk(p)>=6&&rk(p)<=7,
        w: .7,
        setup: (p,ctx)=>{prep(p,ctx),ctx.mc=nm(p)},
        title: "One in ten",
        text: "A company in your regiment mutinied, killed its captain and barricaded itself in a monastery. Now it has surrendered. A commander judges whole companies and may decimate: one in ten, chosen by lot, hanged in front of the rest. The other companies are watching to see what mutiny costs.",
        choices: [
          {
            t: "Decimate them",
            r: "Nineteen men draw the short straw. The regiment never mutinies again. Some of your officers never look at you the same way.",
            fx: {merit:15,wil:2,happy:-8,honor:-4,fame:2},
          },
          {
            t: "Hang the men who killed the captain, spare the rest",
            check: {s:"int",s2:"command",d:50},
            win: {
              r: "You find the five who did it. They hang. The rest go back to the ranks, and fight well for you, as if to pay a debt.",
              fx: {merit:12,honor:3,skill:{command:2}},
            },
            lose: {r:"Nobody will name names. You hang five you are not sure of.",fx:{merit:6,wil:2,happy:-5}},
          },
          {
            t: "Disband the company and scatter the men",
            r: "The company's name is struck from the roll and its men are scattered among the others. It is a punishment soldiers understand.",
            fx: {merit:8,skill:{command:2}},
          },
          {
            t: "Hear their grievance first",
            check: {s:"diplomacy",s2:"wil",d:55},
            win: {
              r: "Their captain had been selling their rations. You hang the two who struck him and pay the rest from his estate. The regiment talks about justice.",
              fx: {merit:10,honor:6,fame:2},
            },
            lose: {r:"Your officers call it weakness. The general hears of it.",fx:{merit:-10,honor:3}},
          },
        ],
      },
      {
        id: "rk_cmd_march",
        cond: (p,C)=>C.soldier(p)&&rk(p)===6&&war(p),
        setup: prep,
        title: "An independent march",
        text: "A commander is the first rung trusted with a march of a day or more on his own. Your orders: take your regiment to seize the bridge at {town} before the enemy does. The direct road runs through forest. The open road is a day longer.",
        choices: [
          {
            t: "Take the forest road, with scouts well out",
            check: {s:"tactics",s2:"command",d:55},
            win: {
              r: "Your scouts flush an ambush at the second ford. You go round it and take the bridge a day early.",
              fx: {merit:25,skill:{tactics:3},fame:2},
            },
            lose: {
              r: "The ambush comes in the forest. You fight through, and reach the bridge late and bloody.",
              fx: {merit:-10,wil:2,health:-10,cause:"an ambush in the forest"},
            },
          },
          {
            t: "Take the open road and force the pace",
            check: {s:"logistics",s2:"sta",d:55},
            win: {
              r: "Thirty-five kilometers a day. Your men curse you every step, and they reach the bridge first.",
              fx: {merit:20,skill:{logistics:3}},
            },
            lose: {
              r: "Men fall out by hundreds. You arrive with half a regiment to find the enemy on the bridge.",
              fx: {merit:-12,wil:2},
            },
          },
          {
            t: "Send your horse ahead to hold the bridge",
            check: {s:"tactics",s2:"riding",d:50},
            win: {
              r: "Your horse takes the bridge and holds it until the foot arrive. A textbook day.",
              fx: {merit:20,skill:{tactics:2}},
            },
            lose: {r:"The horse arrives alone and is driven off. The bridge is the enemy's.",fx:{merit:-8}},
          },
        ],
      },
      {
        id: "rk_cmd_surrender",
        cond: (p,C)=>C.soldier(p)&&rk(p)>=6&&war(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.cast=nm(p)},
        title: "Terms",
        text: "A commander may make treaties of surrender in the field. The castellan of a castle you have besieged for nine weeks, {cast}, offers terms: the castle, if his garrison may march out with their arms and banners. Your general wants them all as prisoners. The castle still has water.",
        choices: [
          {
            t: "Accept his terms",
            r: "They march out with drums beating. The castle is yours without another day of siege. Your general sulks. The crown is pleased.",
            fx: {merit:15,honor:4,favor:3,fame:2},
          },
          {
            t: "Bargain: arms yes, banners no",
            check: {s:"diplomacy",s2:"persuasion",d:55},
            win: {
              r: "They march out without their banners, which hang in your capital's temple a year later. Your general is satisfied.",
              fx: {merit:22,fame:3,skill:{diplomacy:3}},
            },
            lose: {r:"{cast} is insulted and shuts the gate. The siege goes on a month longer.",fx:{merit:-6,wil:1}},
          },
          {
            t: "Refuse: unconditional surrender",
            check: {s:"siegecraft",s2:"wil",d:60},
            win: {
              r: "You show him your mine gallery under his tower. He surrenders on your terms the next day.",
              fx: {merit:25,skill:{siegecraft:3}},
            },
            lose: {
              r: "He holds out three more months. Fever takes more of your men than his walls.",
              fx: {merit:-10,wil:2,happy:-6},
            },
          },
        ],
      },
      {
        id: "rk_cmd_levy_lord",
        cond: (p,C)=>C.soldier(p)&&rk(p)>=5&&rk(p)<=6&&crown(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.ll=nm(p)},
        title: "A lord and his second",
        text: 'A levy lord who raises a regiment from his own lands is a commander by right, whatever his skill. Lord {ll} has brought three thousand farm boys and his hunting hounds. The crown has made you his "second". He thinks a battle is a kind of hunt.',
        choices: [
          {
            t: "Run the regiment from behind him, politely",
            check: {s:"diplomacy",s2:"command",d:50},
            win: {
              r: "Every order is his, and every order is yours. By autumn his levy is a regiment, and he believes he did it.",
              fx: {merit:15,skill:{diplomacy:2,command:2},newRel:{type:"friend",op:35}},
            },
            lose: {
              r: "He notices what you are doing and is offended. He gives the orders himself.",
              fx: {merit:-6,happy:-3},
            },
          },
          {
            t: "Tell him straight what a battle is",
            check: {s:"persuasion",s2:"wil",d:55},
            win: {
              r: "You tell him what a rout looks like. He goes pale, and then he listens.",
              fx: {merit:10,skill:{persuasion:2}},
            },
            lose: {r:"He laughs and calls for his hounds.",fx:{merit:-3}},
          },
          {
            t: "Let him lead and save what you can",
            r: "He leads his regiment into a marsh. You get two thirds of it out. The crown blames him. Mostly.",
            fx: {merit:4,wil:1.5,happy:-4},
          },
        ],
      },
      {
        id: "rk_cpt_baggage",
        cond: (p,C)=>cpt(p,C),
        setup: prep,
        title: "The tail",
        text: "Behind your column marches a second army: wives, children, sutlers, washerwomen, priests, pedlars, thieves and three hundred carts. The column makes twelve kilometers a day because of them. The general wants twenty.",
        choices: [
          {
            t: "Send the camp followers back to the last town",
            r: "Wailing, cursing, children crying. The column makes twenty kilometers. Your men are angry and hungry for a month.",
            fx: {merit:8,rel:{who:"comrade",op:-4,all:!0}},
          },
          {
            t: "Organize them: their own column, their own captain",
            check: {s:"logistics",s2:"command",d:50},
            win: {
              r: "You put a hard old sergeant in charge of the tail and give it its own road. Eighteen kilometers a day, and nobody left behind.",
              fx: {merit:12,skill:{logistics:3}},
            },
            lose: {r:"The tail ignores its captain and clogs the road worse than before.",fx:{merit:-4}},
          },
          {
            t: "Leave them be: they feed and nurse the army",
            r: "You tell the general they are worth the kilometers. He disagrees, loudly. Your men are grateful.",
            fx: {merit:-3,rel:{who:"comrade",op:5,all:!0}},
          },
        ],
      },
      {
        id: "rk_cpt_courier",
        cond: (p,C)=>cpt(p,C)&&war(p),
        setup: prep,
        title: "A strange order",
        text: "A rider brings a written order: withdraw from the ford at once and march north. The token is right, a piece of a broken tally. But the seal is smudged, the rider is a stranger, and withdrawing would open the whole flank.",
        choices: [
          {
            t: "Obey. Orders are orders.",
            check: {s:"ins",s2:"int",d:50},
            win: {r:"It was real. The commander needed you north, and you came in time.",fx:{merit:10}},
            lose: {
              r: "It was false. The enemy crosses the ford an hour after you leave.",
              fx: {merit:-20,wil:2,happy:-6},
            },
          },
          {
            t: "Hold the rider and send your own man to check",
            r: 'Your man comes back in four hours: the order was forged. The "rider" hangs. You held the ford.',
            fx: {merit:15,skill:{tactics:2}},
          },
          {
            t: "Split the difference: send half north",
            check: {s:"tactics",s2:"command",d:50},
            win: {r:"Half holds the ford, half goes north. Both halves are enough, just.",fx:{merit:8}},
            lose: {r:"Half is not enough anywhere.",fx:{merit:-8}},
          },
        ],
      },
      {
        id: "rk_gen_council",
        cond: (p,C)=>gen(p,C)&&war(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.g1=nm(p),ctx.g2=nm(p)},
        title: "The council of war",
        text: "The council of war meets in a farmhouse kitchen with the map spread on the table and the farmer's family sent to the barn. General {g1} wants to attack tomorrow while the {foe} army is still crossing the river. General {g2} wants to wait for the siege train and the second levy. Everyone turns to you.",
        choices: [
          {
            t: "Attack while they are astride the river",
            check: {s:"tactics",s2:"command",d:60},
            win: {
              r: "You catch half their army on your bank and drive it into the water. The chronicles will call it by the river's name.",
              fx: {merit:60,fame:6,skill:{tactics:4},favor:5,deed:"caught an enemy army astride a river"},
            },
            lose: {
              r: "Their half on your bank fights like cornered wolves. A bloody draw, and the crossing completed anyway.",
              fx: {merit:-25,wil:2,favor:-4},
            },
          },
          {
            t: "Wait for the siege train and the levy",
            r: "You wait. The enemy finishes crossing and digs in. The war will be longer, and you will have more men to fight it.",
            fx: {merit:10,skill:{logistics:2}},
          },
          {
            t: "Propose a third plan: a night march to their rear",
            check: {s:"tactics",s2:"int",d:65},
            win: {
              r: "By dawn you are across their road home. They have to fight on your ground or starve. They fight. They lose.",
              fx: {merit:80,fame:8,skill:{tactics:5},favor:6,deed:"cut an enemy army from its road home"},
            },
            lose: {
              r: "The night march loses its way. Half your army arrives at dawn, the other half at noon.",
              fx: {merit:-40,fame:-2,wil:2},
            },
          },
          {
            t: "Let {g1} and {g2} fight it out, and support the winner",
            r: "You say little and agree last. Nobody can blame you. Nobody will remember you either.",
            fx: {merit:5,skill:{diplomacy:2}},
          },
        ],
      },
      {
        id: "rk_gen_favorite",
        cond: (p,C)=>gen(p,C)&&crown(p)&&!C.ruler(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.fav=nm(p),ctx.fage=A.ri(19,26)},
        title: "The king's favorite",
        text: '{king} has given the command of the van to {fav}, a courtier of {fage} who plays the lute beautifully and has never seen a battle. The van was promised to you. {fav} sends a friendly note asking for "a few tips".',
        choices: [
          {
            t: "Protest to the throne",
            check: {s:"diplomacy",s2:"etiquette",d:60},
            win: {
              r: "You protest so gracefully that {king} gives you the van and {fav} a new horse. Both are pleased.",
              fx: {merit:20,favor:2,skill:{etiquette:3}},
            },
            lose: {
              r: "{king} does not enjoy being told. The van stays with {fav}, and you are sent to guard the baggage.",
              fx: {merit:-15,favor:-10,wil:2},
            },
          },
          {
            t: "Teach {fav} properly",
            r: "You give {fav} a month of lessons and your best captain as a second. {fav} does well, says so to {king}, and names you as the teacher.",
            fx: {merit:15,favor:6,newRel:{type:"friend",op:35}},
          },
          {
            t: "Give {fav} enough rope",
            r: "You give {fav} exactly what was asked for: a few tips. The van is mauled. {fav} is disgraced. Two thousand men are dead.",
            fx: {merit:10,honor:-10,happy:-6,wil:1},
          },
          {
            t: "Woo the favorite and through {fav}, the throne",
            check: {s:"intrigue",s2:"persuasion",d:55},
            win: {
              r: "By midsummer, {fav} says nothing at court without asking you first. You have a voice at the king's ear that plays the lute.",
              fx: {favor:10,skill:{intrigue:3},merit:10},
            },
            lose: {
              r: "{fav} sees through you and laughs about it at supper, in front of the king.",
              fx: {favor:-6,happy:-4},
            },
          },
        ],
      },
      {
        id: "rk_gen_rival",
        cond: (p,C)=>gen(p,C)&&war(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.rg=nm(p)},
        title: "He did not come",
        text: "At the height of the battle you sent three riders to General {rg} on your left, asking for his reserve. He did not move. You held, just, at a price you will be paying in widows' pensions for years. He says your riders never arrived. Two of them are standing outside your tent.",
        choices: [
          {
            t: "Accuse him before the council",
            check: {s:"persuasion",s2:"intrigue",d:60},
            win: {
              r: "Your riders tell it plain. {rg} is relieved of his command and sent home in disgrace.",
              fx: {merit:30,fame:2,newRel:{type:"enemy",op:-60}},
            },
            lose: {
              r: "{rg} has more friends at court than you have riders. The council calls it a misunderstanding. He smiles at you across the table.",
              fx: {merit:-10,wil:2,newRel:{type:"enemy",op:-50}},
            },
          },
          {
            t: "Challenge him to settle it with swords",
            r: "Generals do not duel. You do.",
            fx: {
              duel: {
                tier: 3,
                title: "a general who did not come",
                troop: "HC",
                opts: {kind:"duel",lethal:!0,toYield:!0,place:"a meadow behind the camp",title:"Between generals"},
              },
            },
          },
          {
            t: "Say nothing, and never rely on him again",
            r: "You say nothing. In the next battle you put {rg} where he must fight, with your best troops behind him. He fights.",
            fx: {merit:10,skill:{tactics:2},wil:1},
          },
        ],
      },
      {
        id: "rk_gen_plan",
        cond: (p,C)=>gen(p,C)&&war(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.army=A.fmt((GD.MIL[rk(p)]||GD.MIL[7]).leads),ctx.carts=Math.round((GD.MIL[rk(p)]||GD.MIL[7]).leads/250)},
        title: "The road to the enemy",
        text: "The plan for the season must be fixed before May Fair, when grass can feed the horses. {army} men need about {carts} ox-carts of food a day. Three roads lead into {foe}: the river valley, where barges can follow; the mountain pass, short and narrow; or the coast, if the fleet will carry your supplies.",
        choices: [
          {
            t: "Follow the river, with barges",
            check: {s:"logistics",s2:"tactics",d:55},
            win: {
              r: "One barge carries what two hundred carts carry. Your army arrives fed, healthy and fast, and the enemy's border towns fall one by one.",
              fx: {merit:50,skill:{logistics:4},fame:3},
            },
            lose: {
              r: "The river is low this year. The barges ground on the shoals and your army waits for rain.",
              fx: {merit:-20,wil:1},
            },
          },
          {
            t: "Take the pass and strike at their heart",
            check: {s:"tactics",s2:"command",d:65},
            win: {
              r: "Through the pass before they know you have left. You are at the gates of their capital in three weeks.",
              fx: {
                merit: 80,
                fame: 6,
                skill: {tactics:4},
                deed: "took an army through a mountain pass into the enemy's heart",
              },
            },
            lose: {
              r: "They hold the pass with a few hundred men. You lose a month and a thousand men to rockfalls and crossbows.",
              fx: {merit:-40,wil:3,happy:-6},
            },
          },
          {
            t: "Go by the coast with the fleet",
            check: {s:"logistics",s2:"diplomacy",d:55},
            win: {
              r: "The admirals agree, for once. Your army walks along a coast where every cove holds a supply ship.",
              fx: {merit:45,skill:{logistics:3,diplomacy:2}},
            },
            lose: {r:"A storm scatters the supply fleet. Your army eats its horses.",fx:{merit:-30,wil:2}},
          },
        ],
      },
      {
        id: "rk_gen_lost",
        cond: (p,C)=>gen(p,C)&&war(p),
        w: .4,
        cool: 15,
        setup: (p,ctx)=>{prep(p,ctx),ctx.army=A.fmt((GD.MIL[rk(p)]||GD.MIL[7]).leads)},
        title: "The army is gone",
        text: ()=>`It went wrong in an afternoon: ${A.pick(["a flank that broke and took the centre with it","a river at your back and the enemy horse in front","a fog, a wrong road and an enemy waiting on the right one","a bridge that collapsed under the baggage while the rearguard was still across"])}. Of {army} men, a third are dead, a third are prisoners and a third are running. You are alive. Not everyone thinks you should be.`,
        choices: [
          {
            t: "Rally what you can and fight on",
            check: {s:"command",s2:"wil",d:65},
            win: {
              r: "You gather the runners at a walled town and turn them into an army again by autumn. Nobody forgets the defeat. Some remember the rally.",
              fx: {merit:20,wil:4,fame:3,skill:{command:4}},
            },
            lose: {
              r: "Nobody stops running for you. You reach the capital with a few hundred men and a face nobody wants to look at.",
              fx: {merit:-150,wil:4,fame:-5,favor:-15,happy:-15},
            },
          },
          {
            t: "Take the blame, all of it, before the throne",
            r: '"The plan was mine. The fault is mine." The court is stunned. Some respect it. {king} does not need to forgive you, but you have made it possible.',
            fx: {merit:-100,honor:10,wil:4,favor:-5,happy:-10},
          },
          {
            t: "Blame the generals who broke",
            check: {s:"intrigue",s2:"persuasion",d:55},
            win: {
              r: "Two generals are broken for cowardice. You keep your command. You know the truth, and so do they.",
              fx: {merit:-30,honor:-8,wil:2,newRel:{type:"enemy",op:-60}},
            },
            lose: {
              r: "Nobody believes you. Now you have lost an army and your honor both.",
              fx: {merit:-200,honor:-10,favor:-15,wil:3},
            },
          },
          {
            t: "Resign your command",
            r: "You hand back your warrant and ride home. Behind you, every family that lost a son knows your name.",
            fx: p=>{const r=A.resign();return A.willGrow(p,4),p.happy=A.clamp(p.happy-15,0,100),r&&r.ok?"":"The crown refuses to accept your resignation while the war lasts. You must fight on."},
          },
        ],
      },
      {
        id: "rk_gen_treaty",
        cond: (p,C)=>C.soldier(p)&&rk(p)>=8&&war(p)&&crown(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.env=nm(p),ctx.eid=foeId(p)||""},
        title: "An armistice for the theatre",
        text: "A high general may sign an armistice for his theatre of war. The {foe} envoy, {env}, comes to your tent with a white staff: a truce until next Harvest Home, each side to keep what it holds. Your men are tired. So are theirs. {king} wants victory, not a truce.",
        choices: [
          {
            t: "Sign it",
            r: "You sign. The fighting stops along a hundred kilometers of front. Your men cheer you. The court does not.",
            fx: (p,ctx)=>(ctx.eid&&p.mil&&A.addRel(p.mil.realm,ctx.eid,15),A.applyFx(p,{merit:10,favor:-8,fame:3,honor:2},ctx),"Along the front, men put down their spears."),
          },
          {
            t: "Demand better terms: a fortress and a ransom",
            check: {s:"diplomacy",s2:"intimidation",d:60},
            win: {
              r: "{env} gives you the border fortress and two thousand suns for the prisoners. The court is delighted.",
              fx: (p,ctx)=>(ctx.eid&&p.mil&&A.addRel(p.mil.realm,ctx.eid,8),A.applyFx(p,{merit:40,favor:8,fame:4,coin:300,skill:{diplomacy:4}},ctx),""),
            },
            lose: {
              r: "{env} rides away. The war goes on, and {king} hears you tried to make peace.",
              fx: {merit:-10,favor:-5},
            },
          },
          {
            t: "Refuse and fight on",
            r: "You send {env} back with your compliments. The war goes on, as {king} wishes.",
            fx: {merit:5,favor:4},
          },
        ],
      },
      {
        id: "rk_gen_triumph",
        cond: (p,C)=>gen(p,C)&&crown(p)&&p.mil.battles>=2,
        cool: 10,
        setup: prep,
        title: "Through the gates of {cap2}",
        text: "You ride into {cap2} at the head of the army, with captured banners carried behind you and the crowd throwing flowers and bread. Children are sitting on the walls. Somebody has written a song. {king} waits at the palace steps.",
        choices: [
          {
            t: "Dismount and walk in with your soldiers",
            r: "You walk beside your men, not ahead of them. The crowd loves it. So do the men. {king} is less sure.",
            fx: {fame:6,rel:{who:"comrade",op:10,all:!0},favor:-2,honor:3},
          },
          {
            t: "Ride ahead in your best armor and take the cheers",
            r: "For one afternoon, you are the most famous person in the realm. {king} notices that too.",
            fx: {fame:8,favor:-5,happy:8},
          },
          {
            t: "Lay the banners at the temple: the glory is the gods'",
            r: p=>`You lay the banners before ${A.godWord(p)}. The priests bless your name from every pulpit. {king} is pleased that the glory went somewhere safe.`,
            fx: {fame:4,piety:6,favor:5},
          },
          {
            t: "Give the glory to {king}",
            r: "You kneel on the steps and hand the first banner to the throne. {king} raises you up in front of everyone.",
            fx: {fame:3,favor:10},
          },
        ],
      },
      {
        id: "rk_gen_coup",
        cond: (p,C)=>gen(p,C)&&crown(p)&&!C.ruler(p),
        w: .5,
        cool: 12,
        setup: (p,ctx)=>{prep(p,ctx),ctx.plotter=nm(p)},
        title: "A quiet supper",
        text: `A quiet supper with General {plotter} and two senior officers. Over the second jug they say it: {king} is a fool, the treasury is empty, the army is unpaid, and the army is in your hands. "Say the word, and we march on {cap2}. You'd make a better sovereign than the one we have."`,
        choices: [
          {
            t: "Say the word",
            r: "You say it. There is no going back now.",
            fx: p=>{const r=A.plotThrone(p);return r&&r.msg?r.msg:""},
          },
          {
            t: "Report them to the throne",
            r: "{plotter} and the others are arrested before dawn. {king} thanks you in person. You will never again have a friend in the officers' mess.",
            fx: {favor:15,merit:20,honor:-2,newRel:{type:"enemy",op:-70}},
          },
          {
            t: "Refuse, and say nothing to anyone",
            r: `"I'll forget I heard that." They look at each other. You will sleep with a guard for a year.`,
            fx: {honor:3,wil:1,flag:"rk_coup_heard"},
          },
          {
            t: "Tell them to wait, and remember who they are",
            check: {s:"intrigue",s2:"int",d:55},
            win: {
              r: "You keep them talking and find out who else is in it. You now hold a lot of men's lives in your hand.",
              fx: {skill:{intrigue:4},flag:"rk_coup_heard"},
            },
            lose: {
              r: "They sense you are fishing and go quiet. Now they fear you.",
              fx: {flag:"rk_coup_heard",newRel:{type:"enemy",op:-40}},
            },
          },
        ],
      },
      {
        id: "rk_gen_coup_echo",
        cond: (p,C)=>C.soldier(p)&&C.flag(p,"rk_coup_heard"),
        once: !0,
        setup: prep,
        title: "The plot is found",
        text: 'The plot you heard over supper has been found out. The plotters are in chains, and one of them, hoping to save his neck, has given the questioners your name: "The general knew, and said nothing."',
        choices: [
          {
            t: "Go to the throne before you are sent for",
            check: {s:"persuasion",s2:"diplomacy",d:55},
            win: {
              r: "You tell {king} everything, including that you said no. You are believed. Barely.",
              fx: {favor:-3,wil:2,unflag:"rk_coup_heard"},
            },
            lose: {
              r: "You are believed enough not to hang. Not enough to keep your command this season.",
              // [X1 baked patch events/33-no-obvious-choices CHOICE-RK-GEN-COUP-ECHO] rk_gen_coup_echo: going to the throne was
              // safer and better than denying in every outcome. A denial that holds now wins the king's trust (favor +10), one
              // that fails costs a little less favour (-20), and both failures cost the same command (merit -150), so it is a
              // real gamble between honesty and nerve.
              fx: {favor:-15,merit:-150,wil:3,unflag:"rk_coup_heard"},
            },
          },
          {
            t: "Deny everything",
            check: {s:"deception",s2:"wil",d:55},
            // [X1 baked patch events/33-no-obvious-choices CHOICE-RK-GEN-COUP-ECHO] rk_gen_coup_echo: going to the throne was
            // safer and better than denying in every outcome. A denial that holds now wins the king's trust (favor +10), one
            // that fails costs a little less favour (-20), and both failures cost the same command (merit -150), so it is a
            // real gamble between honesty and nerve.
            win: {r:"It is your word against a traitor's. Yours wins.",fx:{favor:10,unflag:"rk_coup_heard"}},
            lose: {
              r: "The questioners find a second witness.",
              // [X1 baked patch events/33-no-obvious-choices CHOICE-RK-GEN-COUP-ECHO] rk_gen_coup_echo: going to the throne was
              // safer and better than denying in every outcome. A denial that holds now wins the king's trust (favor +10), one
              // that fails costs a little less favour (-20), and both failures cost the same command (merit -150), so it is a
              // real gamble between honesty and nerve.
              fx: {favor:-20,merit:-150,honor:-5,unflag:"rk_coup_heard"},
            },
          },
        ],
      },
      {
        id: "rk_gen_hang_officer",
        cond: (p,C)=>C.soldier(p)&&rk(p)>=8,
        setup: (p,ctx)=>{prep(p,ctx),ctx.nep=nm(p)},
        title: "A duke's nephew",
        text: "A high general may hang an officer up to senior captain. Senior Captain {nep} let his wing loot a temple and kill the priests who stood in the door. The witnesses are many. He is also the nephew of the most powerful duke at court, who has already written to you.",
        choices: [
          {
            t: "Hang him",
            r: "{nep} hangs. The army learns that the rope is the same for everyone. The duke never forgives you.",
            fx: {merit:20,honor:6,fame:3,newRel:{type:"enemy",op:-70},favor:-3},
          },
          {
            t: "Strip him and send him home in disgrace",
            r: "Stripped of his rank, sent home on a mule. The duke is angry, but not murderous. The army thinks you were bought.",
            fx: {merit:5,honor:-2},
          },
          {
            t: "Pardon him for a price from the duke",
            r: `The duke pays the temple's rebuilding and you a "consideration". {nep} goes free. You are richer and smaller.`,
            fx: {coin:800,honor:-12,favor:2},
          },
        ],
      },
      {
        id: "rk_mar_pardon",
        cond: (p,C)=>C.soldier(p)&&rk(p)===9,
        setup: (p,ctx)=>{prep(p,ctx),ctx.cond=nm(p)},
        title: "The marshal pardons",
        text: "A marshal pardons. A woman has walked two hundred kilometers to kneel in your doorway. Her son, {cond}, a sergeant, struck his captain and is to hang on Friday. She says the captain was drunk and beating a boy. Your clerks say the law is clear.",
        choices: [
          {
            t: "Pardon him",
            r: "You write the pardon in your own hand. The army will say the marshal is soft. The mother will say other things, for the rest of her life.",
            fx: {honor:6,piety:3,fame:2,merit:-10},
          },
          {
            t: "Look into it before Friday",
            check: {s:"int",s2:"diplomacy",d:50},
            win: {
              r: "The captain was drunk, and the boy was his servant. You pardon the sergeant and break the captain.",
              fx: {honor:8,fame:3,merit:5},
            },
            lose: {r:"The witnesses contradict each other. You let the law stand. You are not sure.",fx:{wil:2}},
          },
          {
            t: "Let the law take its course",
            r: "He hangs on Friday. Discipline holds. The woman walks home.",
            fx: {merit:5,wil:1.5,happy:-4},
          },
        ],
      },
      {
        id: "rk_gen_chest",
        cond: (p,C)=>gen(p,C)&&crown(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.bank=A.pick(["House Lunetti of Ostra","House Doravelli of Lucerna","the Hold Bank of Stonehold","the Temple Banks of Ranpur","the Gold Houses of Zanara"])},
        title: "The army chest is empty",
        text: `The army chest is empty, and the crown's next payment is "on its way". Your men have not been paid for two quarters. An agent of {bank} offers you a loan in your own name, against your own lands and your own neck, at a rate that would make a pirate blush.`,
        choices: [
          {
            t: "Borrow, and pay the army",
            r: "The army is paid. The crown will repay you, someday. The bank will not wait that long.",
            fx: {coin:-400,merit:30,rel:{who:"comrade",op:10,all:!0},fame:2,honor:3},
          },
          {
            t: "Ride to court and shame the treasurer",
            check: {s:"persuasion",s2:"intimidation",d:60},
            win: {
              r: "In front of the whole court you ask the treasurer whether he would like to explain to fifty thousand armed men why they are not paid. The silver arrives in a week.",
              fx: {merit:25,favor:-5,fame:3},
            },
            lose: {
              r: "The treasurer has friends. You come back with promises and an enemy.",
              fx: {merit:-5,newRel:{type:"enemy",op:-40}},
            },
          },
          {
            t: "Let the army live off the country",
            r: "The army pays itself from the farms around it. The province will hate your name for a generation.",
            fx: {merit:10,honor:-12,favor:-3},
          },
        ],
      },
      {
        id: "rk_gen_defector",
        cond: (p,C)=>gen(p,C)&&war(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.def=nm(p)},
        title: "A man from the other side",
        text: "A {foe} officer, {def}, comes over at night with a satchel he says holds his commander's plans for the campaign. He wants two thousand suns and a manor. He could be a gift from the gods, or a gift from the enemy.",
        choices: [
          {
            t: "Pay him and use the plans",
            check: {s:"intrigue",s2:"tactics",d:60},
            win: {
              r: "The plans are real. You know where they will march before their own captains do.",
              fx: {merit:60,fame:3,coin:-300,skill:{intrigue:3}},
            },
            lose: {
              r: "The plans are a fake, and a good one. You march to a battle that is not there, and miss the one that is.",
              fx: {merit:-40,coin:-300,wil:2},
            },
          },
          {
            t: "Test him first: check one detail you can verify",
            check: {s:"int",s2:"intrigue",d:50},
            win: {
              r: "One detail checks out, then another. You pay him half and use the plans carefully. A good season.",
              fx: {merit:35,coin:-150,skill:{intrigue:3}},
            },
            lose: {r:"Nothing can be checked in time. You do not dare use them.",fx:{merit:2}},
          },
          {
            t: "Hang him. A traitor once is a traitor twice.",
            r: "He hangs. You will never know if the plans were real.",
            fx: {merit:3,honor:2},
          },
        ],
      },
      {
        id: "rk_gen_standard",
        cond: (p,C)=>gen(p,C)&&war(p),
        setup: prep,
        title: "The standard",
        text: "A general is the first rung seen from the other side of the field: he carries a standard and has a horn to himself. This morning the {foe} archers are shooting at your standard, and your bodyguard is falling around it. Your staff begs you to move it back two hundred paces.",
        choices: [
          {
            t: "Stay where the army can see you",
            check: {s:"wil",s2:"ins",d:60},
            win: {
              r: "Arrows hiss past all morning. You never move. The army sees its general standing, and the army stands.",
              fx: {merit:40,fame:5,wil:2,deed:"stood under the standard through the arrow-storm"},
            },
            lose: {
              r: "An arrow takes you in the shoulder. You stay standing until noon, then fall off your horse.",
              fx: {wound:"arrow_wound",health:-25,merit:25,fame:4,wil:2,cause:"an arrow at the standard"},
            },
          },
          {
            t: "Move back, and send the standard forward with a bearer",
            r: "The army sees the standard, not you. The bearer dies. The army does not know the difference.",
            fx: {merit:10,wil:1},
          },
          {
            t: "Move back with your standard",
            r: "The army sees the standard go back. For a terrible minute, the centre wavers.",
            fx: {merit:-10,wil:1},
          },
        ],
      },
      {
        id: "rk_gen_king_charge",
        cond: (p,C)=>gen(p,C)&&crown(p)&&war(p)&&!C.ruler(p),
        setup: prep,
        title: "The sovereign in the field",
        text: "{king} has come to the army, in gilded armor, with a household of young knights. Under the royal standard, the sovereign commands. {king} wants to lead the charge personally, today, against an enemy that has not yet been shaken.",
        choices: [
          {
            t: "Talk {king} out of it",
            check: {s:"diplomacy",s2:"persuasion",d:60},
            win: {
              r: "You suggest the charge should come at the turning point, and only the sovereign can judge it, from the hill. {king} agrees. The charge comes later, and wins.",
              fx: {merit:30,favor:8,skill:{diplomacy:3}},
            },
            lose: {r:'"Are you afraid, general?" The charge goes in.',fx:{favor:-3,merit:-10}},
          },
          {
            t: "Ride beside {king} and keep the sovereign alive",
            check: {s:"mounted",s2:"ins",d:60},
            win: {
              r: "You ride knee to knee with {king} into the enemy line. A blow meant for the crown hits your shield. You both come back.",
              fx: {merit:40,favor:15,fame:5,deed:"rode beside the sovereign in the charge"},
            },
            lose: {
              r: "{king} comes back. You are carried back.",
              fx: {health:-30,wound:"scar_face",favor:15,merit:20,cause:"a charge beside the sovereign"},
            },
          },
          {
            t: "Obey, and plan for the charge to fail",
            r: "You hold the reserve ready. When the charge breaks, your reserve saves {king} and the day. The sovereign never quite forgives you for being right.",
            fx: {merit:25,favor:-2,skill:{tactics:3}},
          },
        ],
      },
      {
        id: "rk_gen_old_mess",
        cond: (p,C)=>gen(p,C),
        setup: (p,ctx)=>{prep(p,ctx),ctx.om=nm(p)},
        title: "From the old mess",
        text: "A ragged old soldier is stopped by your guards at the tent door, shouting your given name, the name nobody has called you in years. It is {om}, who shared a pot with you when you were a soldier in the ranks. He has one leg and a begging bowl.",
        choices: [
          {
            t: "Bring him in, feed him, and give him a post",
            r: "He keeps your horses and tells your staff stories about you that make them laugh for weeks. You never regret it.",
            fx: {happy:6,honor:4,newRel:{type:"friend",op:50}},
          },
          {
            t: "Give him a purse and send him on his way (50 suns)",
            req: p=>p.coin>=50,
            r: `He takes the purse and looks at you a long time. "You've changed, {name}." Then he goes.`,
            fx: {coin:-50,honor:1,happy:-2},
          },
          {
            t: "Have the guards move him on",
            r: "The guards move him on. You do not look out of the tent.",
            fx: {honor:-5,happy:-4},
          },
        ],
      },
      {
        id: "rk_gen_contracts",
        cond: (p,C)=>gen(p,C),
        setup: (p,ctx)=>{prep(p,ctx),ctx.mer=nm(p)},
        title: "The bread contract",
        text: "The contract to bake the army's bread for a year is worth more than a duchy. {mer}, a merchant with flour on his sleeves and rings on every finger, leaves a small chest in your tent and suggests that his bread is the best in the realm.",
        choices: [
          {
            t: "Send the chest back and put the contract to tender",
            r: "You put it to sealed bids and pick the cheapest honest baker. The army eats well. {mer} spreads stories about you.",
            fx: {honor:5,merit:10,skill:{stewardship:2}},
          },
          {
            t: "Keep the chest and give him the contract",
            r: "The chest holds two thousand suns. His bread is not the best in the realm. Your men eat it anyway.",
            fx: {coin:2e3,honor:-12,merit:-5},
          },
          {
            t: "Keep the chest and give the contract to someone else",
            check: {s:"intrigue",s2:"deception",d:55},
            win: {
              r: "You keep the money and the honest baker gets the work. {mer} cannot complain without confessing.",
              fx: {coin:2e3,honor:-4,skill:{intrigue:3}},
            },
            lose: {r:"{mer} complains anyway, loudly, to everyone who matters.",fx:{coin:2e3,honor:-10,favor:-8}},
          },
        ],
      },
      {
        id: "rk_gen_successors",
        cond: (p,C)=>gen(p,C)&&two(p),
        once: !0,
        setup: prep,
        title: "Three names on the roll",
        text: "Every command names three successors on its roll, in order, in case its commander falls. Your clerk waits with the pen. The obvious names are {mate}, your oldest officer, and a duke's son the court wants promoted. There is also {mate2}, a commoner, the best soldier you have.",
        choices: [
          {
            t: "Put {mate2} first",
            r: "The court is offended. The army hears of it and every commoner in the ranks stands a little straighter.",
            fx: both({favor:-5,fame:2,honor:3,merit:5},op2(30)),
          },
          {
            t: "Put the duke's son first",
            r: "The court is pleased and the duke sends you a hawk. Your officers say nothing.",
            fx: {favor:6,merit:5,rel:{who:"comrade",op:-4,all:!0}},
          },
          {
            t: "Put {mate} first, by seniority",
            r: "Seniority is the custom, and nobody can argue with custom. {mate} is moved.",
            fx: {them:{op:20},merit:3},
          },
        ],
      },
      {
        id: "rk_gen_scorched",
        cond: (p,C)=>gen(p,C)&&war(p)&&crown(p),
        w: .7,
        setup: prep,
        title: "Our own fields",
        text: "The {foe} army is advancing into your own realm faster than you can stop it. Your staff says: burn our own fields and villages ahead of them, foul the wells, drive off the herds. An army that cannot eat cannot advance. The people whose fields they are have not been asked.",
        choices: [
          {
            t: "Burn it all",
            r: "The {foe} army starves in a black land and turns back. So does the province, for three years.",
            fx: {merit:50,honor:-10,favor:5,happy:-8,wil:2},
          },
          {
            t: "Evacuate the people and herds first, then burn",
            check: {s:"logistics",s2:"command",d:60},
            win: {
              r: "A great column of carts, herds and families goes west ahead of you. Then the smoke goes up. The enemy finds nothing, and the people live.",
              fx: {merit:60,honor:4,fame:4,skill:{logistics:4}},
            },
            lose: {
              r: "Too slow. You burn some villages full and the enemy catches the column.",
              fx: {merit:10,honor:-6,wil:3,happy:-10},
            },
          },
          {
            t: "Refuse. Fight for the fields instead.",
            check: {s:"tactics",s2:"command",d:65},
            win: {
              r: "You find ground that suits you and fight there. The enemy turns back, and the harvest is saved.",
              fx: {merit:70,fame:6,honor:4},
            },
            lose: {r:"You fight and lose. The enemy burns the fields for you.",fx:{merit:-40,wil:3,happy:-8}},
          },
        ],
      },
      {
        id: "rk_mar_budget",
        cond: (p,C)=>C.soldier(p)&&rk(p)===9&&crown(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.chan=nm(p)},
        title: "The chancellor's knife",
        text: `A marshal answers to nobody but the sovereign, and the sovereign must receive him standing. The chancellor, {chan}, receives you sitting, and tells you that the army's money for next year will be cut by a third. "Peace is cheaper than soldiers, marshal."`,
        choices: [
          {
            t: "Go to the sovereign directly",
            check: {s:"diplomacy",s2:"persuasion",d:60},
            win: {
              r: "{king} hears you out, and the chancellor's knife is put away for a year.",
              fx: {favor:5,merit:20,newRel:{type:"rival",op:-40}},
            },
            lose: {r:"{king} sides with the chancellor. You must cut.",fx:{favor:-5,merit:-10}},
          },
          {
            t: "Cut the army wisely: the paper men first",
            check: {s:"stewardship",s2:"logistics",d:55},
            win: {
              r: "You strike off every dead man still drawing pay and every captain's servant on the rolls. A third of the money, and almost none of the men.",
              fx: {merit:25,skill:{stewardship:4},fame:2},
            },
            lose: {r:"You cut, and the cuts go where they hurt.",fx:{merit:-15,wil:1}},
          },
          {
            t: "Let a few garrisons go unpaid and see how peace holds",
            r: "Three border forts go unpaid. Two months later a raid comes through one of them. The chancellor finds the money.",
            fx: {merit:10,honor:-4},
          },
        ],
      },
      {
        id: "rk_mar_ally",
        cond: (p,C)=>C.soldier(p)&&rk(p)>=8&&war(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.am=nm(p)},
        title: "Two marshals",
        text: "An allied army has joined yours. When two crowns join a host, each marshal commands his own men, and the senior by warrant date leads the council. Marshal {am}'s warrant is a month older than yours. His plan is bad, and he knows you know it.",
        choices: [
          {
            t: "Accept his lead and make the best of it",
            r: "You follow his plan and fix its worst parts quietly. The campaign is mediocre and nobody is blamed.",
            fx: {merit:10,skill:{diplomacy:2}},
          },
          {
            t: "Refuse to send your men beyond the pass",
            r: "The rule allows it. You keep your army out of his plan. His plan fails without you. The alliance does not survive the winter.",
            fx: {merit:15,favor:-3,honor:2},
          },
          {
            t: "Win him over in his own tent",
            check: {s:"diplomacy",s2:"tactics",d:60},
            win: {
              r: "You let him believe your plan was his idea. It works, and he thanks you in his dispatches.",
              fx: {merit:40,fame:3,skill:{diplomacy:4}},
            },
            lose: {r:"He is offended and complains to your sovereign.",fx:{favor:-6}},
          },
        ],
      },
      {
        id: "rk_mar_arsenal",
        cond: (p,C)=>C.soldier(p)&&rk(p)>=8,
        setup: (p,ctx)=>{prep(p,ctx),ctx.am=nm(p)},
        title: "The arsenal",
        text: "Your master of the arsenal, {am}, reports at last what the inventory shows: half the crossbows in the royal arsenal have rotted strings and warped stocks, the pikes are wormy, and the stone shot has been sold to builders. Someone has been selling the realm's war, piece by piece, for ten years.",
        choices: [
          {
            t: "Rebuild it properly, whatever it costs",
            check: {s:"stewardship",s2:"logistics",d:55},
            win: {
              r: "Two years, new contracts, honest masters. The arsenal is the best it has been in a generation.",
              fx: {merit:40,skill:{stewardship:4},favor:4},
            },
            lose: {r:"The money runs out halfway. Better than it was. Not good.",fx:{merit:10}},
          },
          {
            t: "Find who sold it and hang him",
            check: {s:"intrigue",s2:"int",d:55},
            win: {
              r: "The trail leads to a dead master and a living clerk. The clerk hangs. Some of the money comes back.",
              fx: {merit:25,coin:200,skill:{intrigue:3}},
            },
            lose: {r:"The trail leads to a powerful lord. You are told to stop looking.",fx:{merit:5,wil:1}},
          },
          {
            t: "Keep it quiet so the enemy does not learn",
            r: "Silence. Only you and {am} know how hollow the realm's arsenal is. You sleep badly.",
            fx: {merit:5,wil:1},
          },
        ],
      },
      {
        id: "rk_gen_heir",
        cond: (p,C)=>gen(p,C)&&crown(p)&&!C.ruler(p),
        once: !0,
        setup: (p,ctx)=>{prep(p,ctx),ctx.heir=nm(p,A.chance(.5)?"M":"F")},
        title: "The royal pupil",
        text: "{king} asks you to teach the heir, {heir}, the art of war. {heir} is fourteen, clever, bored, and has never slept on the ground. Whatever you teach will matter for forty years.",
        choices: [
          {
            t: "Teach the real thing: mud, march and burial details",
            r: "{heir} comes back thin, filthy and changed. One day, as sovereign, {heir} will remember what a war costs.",
            fx: {favor:-2,honor:4,newRel:{type:"friend",op:40},fame:2},
          },
          {
            t: "Teach glory, banners and charges",
            r: "{heir} loves it, and loves you. One day there will be a sovereign who thinks war is a parade.",
            fx: {favor:8,newRel:{type:"friend",op:50}},
          },
          {
            t: "Teach the maps, the supply and the money",
            check: {s:"logistics",s2:"learning",d:50},
            win: {
              r: "{heir} has a head for numbers and learns that wars are won by carts. A rare gift for a future sovereign.",
              fx: {favor:5,skill:{learning:2},newRel:{type:"friend",op:35}},
            },
            lose: {r:"{heir} falls asleep over the cart tables, every single time.",fx:{favor:1}},
          },
        ],
      },
      {
        id: "rk_gen_prisoners",
        cond: (p,C)=>gen(p,C)&&war(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.np=A.fmt(A.ri(12,40)*100)},
        title: "{np} prisoners",
        text: "After the victory you hold {np} {foe} prisoners in a meadow under guard. They are eating your army's bread. The knights among them will pay ransom. The rest will not. Your officers have opinions.",
        choices: [
          {
            t: "Release the common soldiers on oath",
            r: "They swear not to fight again this war and walk home. Some keep the oath. All of them tell their villages they were spared.",
            fx: {merit:10,honor:6,fame:2},
          },
          {
            t: "March them to the rear for exchange",
            check: {s:"logistics",s2:"command",d:55},
            win: {
              r: "Every one of them reaches the rear alive. They come back to you as your own men, in exchange.",
              fx: {merit:30,skill:{logistics:3},honor:3},
            },
            lose: {r:"Hunger and fever on the road. Many die. It is not what you meant.",fx:{merit:5,honor:-3,wil:2}},
          },
          {
            t: "Put them to work digging your siege lines",
            r: "A thousand ditches dug by enemy hands. It is lawful in most armies. They hate it, and they live.",
            fx: {merit:20,honor:-2},
          },
          {
            t: "Kill them. You cannot feed them.",
            r: "It is done in an afternoon. The chronicles of both realms will remember your name for this, and never kindly.",
            fx: {merit:10,honor:-25,fame:4,happy:-12,trait:"cruel"},
          },
        ],
      },
      {
        id: "rk_gen_assassin",
        cond: (p,C)=>gen(p,C),
        w: .6,
        setup: prep,
        title: "The cup",
        text: ()=>`The unseen kills the best. A ${A.pick(["new servant","wine-seller from the town","priest you have never seen before"])} brings your evening cup to your tent. Something about the way he backs out of the tent is wrong.`,
        choices: [
          {
            t: "Make him drink first",
            check: {s:"ins",s2:"int",d:50},
            win: {
              r: "He will not drink. He runs. Your guards catch him at the horse lines with a purse of {foe} gold.",
              fx: {merit:10,skill:{intrigue:2},wil:1},
            },
            lose: {
              r: "He drinks it, smiling. Nothing happens. You have humiliated an innocent man in front of your staff.",
              fx: {happy:-3,honor:-1},
            },
          },
          {
            t: "Pour it on the ground and say nothing",
            r: "The grass where you poured it is yellow by morning. You change all your servants.",
            fx: {wil:1,trait:"paranoid"},
          },
          {
            t: "Drink it. You are tired of fearing.",
            check: {s:"sta",s2:"wil",d:60},
            win: {r:"Only wine. You laugh at yourself and sleep well.",fx:{happy:2}},
            lose: {
              r: "By midnight you are writhing on the floor. The surgeon saves you, barely.",
              fx: {health:-40,wil:3,cause:"poison in a cup of wine"},
            },
          },
        ],
      },
      {
        id: "rk_gen_land_promise",
        cond: (p,C)=>gen(p,C)&&crown(p)&&!war(p),
        setup: prep,
        title: "The promised land",
        text: "When the war began, the crown promised every soldier who served three years twenty acres of land. The war is over. The land has gone to the court's friends. Two thousand veterans are camped outside {cap2} waiting, and they are looking to you.",
        choices: [
          {
            t: "Stand with them before the throne",
            check: {s:"persuasion",s2:"diplomacy",d:60},
            win: {
              r: "{king} finds the land, from the crown's own estates. The veterans cheer your name in the street.",
              fx: {fame:6,favor:-4,honor:6,merit:20},
            },
            lose: {
              r: "{king} sees a general leading a mob. You are sent to a distant fortress for a year.",
              fx: {favor:-15,honor:4,merit:-30},
            },
          },
          {
            t: "Give them land from your own estates (600 suns)",
            req: p=>p.coin>=600,
            r: "You settle a hundred families on your own land. It is not enough, but it is a beginning, and the realm sees who began it.",
            fx: {coin:-600,fame:5,honor:8},
          },
          {
            t: "Disperse them before it turns into a riot",
            r: "Your soldiers break up the camp of their old comrades. Nobody dies. Nobody forgets either.",
            fx: {favor:8,honor:-8,happy:-6},
          },
        ],
      },
      {
        id: "rk_pow_taken",
        cond: (p,C)=>band(p,C,0,6)&&war(p),
        w: .6,
        cool: 10,
        setup: prep,
        title: "Taken",
        text: ()=>`${A.pick(["A patrol gone wrong","A rout in the rain","A foraging party caught in the open","A night raid that met a waiting company"])}, and now you sit in a {foe} barn with your hands tied and a dozen other prisoners. Common soldiers are released on oath, held for exchange, killed in hot blood, or sold where the law allows. Nobody has told you which.`,
        choices: [
          {
            t: "Work your bonds loose and get out in the night",
            check: {s:"stealth",s2:"str",d:55},
            win: {
              r: "A loose board, a dark ditch and two nights of walking. You stagger into your own lines with a story the whole army wants to hear.",
              fx: {merit:10,fame:2,wil:2,skill:{stealth:3},deed:"escaped from an enemy barn"},
            },
            lose: {
              r: "The guard hears the board creak. They beat you and tie you tighter.",
              fx: {health:-15,wil:2,cause:"a beating as a prisoner"},
            },
          },
          {
            t: "Give your oath not to fight again this year",
            r: "They let you go on your oath. You walk back to your own army and sit out the season in garrison, as an honest man must.",
            fx: {honor:3,merit:-5,wil:1},
          },
          {
            t: "Keep your head down and wait for an exchange",
            check: {s:"sta",s2:"wil",d:45},
            win: {
              r: "Two months of thin soup and boredom, and then you are traded at a ford for one of theirs.",
              fx: {wil:2,health:-5,sta:.5},
            },
            lose: {
              r: "Months of thin soup, fever and boredom. You come back a skeleton.",
              fx: {wil:3,health:-20,cause:"a prisoner's fever"},
            },
          },
          {
            t: "Offer to serve them instead",
            r: "They take your oath and put you in a labor gang. When the chance comes, you slip home. You keep that part of the story to yourself.",
            fx: {honor:-8,merit:-8,wil:1,flag:"rk_turncoat"},
          },
        ],
      },
      {
        id: "rk_pow_march",
        cond: (p,C)=>band(p,C,0,4)&&war(p)&&mates(p),
        w: .5,
        cool: 10,
        setup: prep,
        title: "The prisoners' road",
        text: "Prisoners, roped in a line, marched to the enemy's rear. {mate} was taken with you. On the third day {mhe} stumbles and cannot get up. A guard starts walking back toward {mhim} with a spear held low.",
        choices: [
          {
            t: "Haul {mhim} up and carry {mhim}",
            check: {s:"str",s2:"sta",d:50},
            win: {
              r: "You get {mate} onto your back before the guard arrives. You carry {mhim} two days. {Mhe} lives.",
              fx: {them:{op:30},wil:2,str:.8,health:-6},
            },
            lose: {
              r: "You get {mhim} up. You cannot keep {mhim} up.",
              fx: both({wil:3,happy:-10,health:-6},die1("speared by a guard on the prisoners' road")),
            },
          },
          {
            t: "Beg the guard in his own tongue",
            check: {s:"persuasion",s2:"int",d:50},
            win: {
              r: "A few words of his language, and the guard is a man again for a moment. {mate} rides in the baggage cart.",
              fx: {them:{op:20},skill:{persuasion:2}},
            },
            lose: {
              r: "He does not understand you, or does not care.",
              fx: both({wil:2.5,happy:-8},die1("speared by a guard on the prisoners' road")),
            },
          },
          {
            t: "Keep walking",
            r: "You keep walking and do not turn around. You hear it anyway.",
            fx: both({wil:2,happy:-12,honor:-3},die1("left behind on the prisoners' road")),
          },
        ],
      },
      {
        id: "rk_pow_officer",
        cond: (p,C)=>band(p,C,3,7)&&war(p),
        w: .5,
        cool: 12,
        setup: (p,ctx)=>{prep(p,ctx),ctx.ransom=A.fmt(rk(p)>=6?2e3:rk(p)>=4?600:200)},
        title: "An officer's ransom",
        text: "You are a prisoner in a {foe} castle, taken unhorsed at the end of a bad day. As an officer you get a room, a bed and a ransom: {ransom} suns. The castellan suggests that if you were to describe your army's dispositions, the sum might become very small.",
        choices: [
          {
            t: "Write home and pay the ransom",
            r: "It takes months and most of what you own. You ride home on a borrowed horse.",
            fx: p=>{const amt=rk(p)>=6?2e3:rk(p)>=4?600:200;return p.coin=Math.max(0,p.coin-amt),A.willGrow(p,1.5),""},
          },
          {
            t: "Escape over the wall on knotted sheets",
            check: {s:"athletics",s2:"stealth",d:60},
            win: {
              r: "Over the wall, into the moat, and away before the dawn bell. The castellan's report must have been a pleasure to write.",
              fx: {merit:25,fame:4,deed:"escaped from an enemy castle on knotted sheets"},
            },
            lose: {
              r: "The sheets tear. You break a leg in the moat and the ransom doubles for the trouble.",
              fx: {wound:"limp",health:-20,coinPct:-.5,wil:2,cause:"a fall from a castle wall"},
            },
          },
          {
            t: "Describe the dispositions, falsely",
            check: {s:"deception",s2:"tactics",d:55},
            win: {
              r: "You give them a lie so detailed that their army marches the wrong way for a week. You are home in a month, ransom-free.",
              fx: {merit:30,skill:{deception:3}},
            },
            lose: {
              r: "They check the first detail and catch the lie. The ransom doubles and you get a cell instead of a room.",
              fx: {coinPct:-.6,health:-10,wil:2},
            },
          },
          {
            t: "Describe the dispositions, truly",
            r: "You talk. You go home free. Men die for it, and you know which ones.",
            fx: {honor:-15,happy:-10,merit:-20,flag:"rk_turncoat"},
          },
        ],
      },
      {
        id: "rk_pow_turncoat",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"rk_turncoat"),
        once: !0,
        title: "Someone remembers",
        text: 'In a tavern a stranger with one eye looks at you for a long time, then sits down. "I was in that barn. In that castle. I know what you did to get out." He wants twenty suns a year to forget it.',
        choices: [
          {
            t: "Pay him (20 suns)",
            req: p=>p.coin>=20,
            r: "You pay. He will be back next year. Men like him always are.",
            fx: {coin:-20,happy:-4},
          },
          {
            t: "Tell him to say what he likes",
            check: {s:"wil",s2:"intimidation",d:50},
            win: {
              r: "He searches your face for fear and finds none. He leaves. You never see him again.",
              fx: {wil:2,unflag:"rk_turncoat"},
            },
            lose: {
              r: "He says it, loudly, to the whole tavern. It follows you after that.",
              fx: {honor:-6,fame:-2,wil:1,unflag:"rk_turncoat"},
            },
          },
          {
            t: "Confess it yourself, publicly, at the temple",
            r: p=>`You confess before ${A.godWord(p)} and anyone who will listen. It costs you. It also sets you free.`,
            fx: {piety:6,honor:2,wil:2,unflag:"rk_turncoat"},
          },
        ],
      },
      {
        id: "rk_pow_guard",
        cond: (p,C)=>band(p,C,0,3)&&war(p),
        setup: (p,ctx)=>{prep(p,ctx),ctx.pw=nm(p)},
        title: "A face from home",
        text: "You are guarding prisoners: hired men from a Free Company that fought for {foe}. One of them, {pw}, stares at you and says your name. He grew up three houses from you in {home}. He went south for the pay. Now he is behind your rope.",
        choices: [
          {
            t: "Bring him extra bread and news of home",
            r: "You share your bread and the news, such as it is. He is exchanged in spring. He sends a letter to your mother.",
            fx: {honor:3,happy:3,rel:{who:"mother",op:3}},
          },
          {
            t: "Let him slip away in the night",
            check: {s:"stealth",s2:"deception",d:50},
            win: {
              r: "A loose knot and a turned back. He is gone by morning. Nobody knows but the two of you.",
              fx: {honor:3,newRel:{type:"friend",op:40}},
            },
            lose: {
              r: "The sergeant finds the knot. You are flogged for it, and he is put in irons.",
              fx: {health:-12,merit:-8,wil:2,cause:"a flogging"},
            },
          },
          {
            t: "Treat him like any other prisoner",
            r: "He is a prisoner. You are a guard. You both know how the world works.",
            fx: {wil:.5},
          },
        ],
      },
      {
        id: "rk_pow_hostage",
        cond: (p,C)=>gen(p,C),
        w: .3,
        once: !0,
        setup: (p,ctx)=>{prep(p,ctx),ctx.host=nm(p)},
        title: "An honored guest",
        text: "Taken in a cavalry clash, you are now the most valuable prisoner in the {foe} realm. Lord {host} keeps you in his own castle: good wine, hawks, a library. He asks only your word that you will not try to escape. A king's ransom is two hundred thousand suns. Yours will be less, but not much.",
        choices: [
          {
            t: "Give your word, and keep it",
            r: "A year of hawks, books and long talks with {host}, who becomes something like a friend. Your realm pays. You go home rested and wiser about the enemy.",
            fx: {honor:6,skill:{diplomacy:3,learning:3},newRel:{type:"friend",op:40},coinPct:-.3,merit:-50},
          },
          {
            t: "Refuse your word, and try to escape",
            check: {s:"stealth",s2:"riding",d:65},
            win: {
              r: "Down the garderobe chute, onto a stolen horse, and across the border in three days. Your army cheers you into camp.",
              fx: {merit:80,fame:6,deed:"escaped from captivity as a general"},
            },
            lose: {
              r: "Caught at the border. Now it is a cell, and a higher ransom.",
              fx: {health:-15,coinPct:-.5,wil:3,merit:-80},
            },
          },
          {
            t: "Use the year to learn everything about them",
            check: {s:"intrigue",s2:"int",d:55},
            win: {
              r: "By the time you are ransomed you know their roads, their forts and their quarrels. It will be worth a campaign.",
              fx: {merit:60,skill:{intrigue:3},coinPct:-.3},
            },
            lose: {r:"{host} is no fool, and shows you nothing that matters.",fx:{coinPct:-.3,merit:-50}},
          },
        ],
      },
      {
        id: "rk_pow_exchange",
        cond: (p,C)=>band(p,C,0,5)&&war(p),
        w: .6,
        setup: (p,ctx)=>{prep(p,ctx),ctx.ec=nm(p)},
        title: "The exchange at the ford",
        text: "An exchange of prisoners at a ford, under white branches. You are in charge of your side's line of thirty. Across the water, their sergeant {ec} counts his thirty. Halfway across, one of your prisoners breaks and runs for the trees, back toward his own army.",
        choices: [
          {
            t: "Let him go. It is a day of peace.",
            r: "He reaches the trees. {ec} grins and lets one of his men run too. Thirty for thirty, and nobody died at a ford today.",
            fx: {honor:4,happy:3},
          },
          {
            t: "Have him shot down",
            r: "A crossbow, a body in the ford. {ec}'s men go for their weapons, and the exchange becomes a fight.",
            fx: {
              merit: 2,
              honor: -4,
              duel: {
                tier: 2,
                title: "an enemy sergeant",
                opts: {kind:"duel",lethal:!1,toYield:!0,place:"the middle of the ford",title:"Exchange at the ford"},
              },
            },
          },
          {
            t: "Run him down yourself",
            check: {s:"spd",s2:"athletics",d:50},
            win: {
              r: "You catch him at the treeline and walk him back. {ec} salutes you across the water. The exchange goes on.",
              fx: {merit:4,spd:.5},
            },
            lose: {
              r: "He is faster. The exchange is twenty-nine for thirty, and your captain is not pleased.",
              fx: {merit:-3},
            },
          },
        ],
      },
      {
        id: "rk_wd_one_hand",
        cond: (p,C)=>C.adult(p)&&hurt(p,"lost_hand")&&(C.soldier(p)||!!p.veteran),
        once: !0,
        title: "One hand",
        text: "You have learned to tie a knot with your teeth and to eat with your left hand. Now you have to learn to fight with one. An old soldier tells you about a northern captain who lost two fingers to an axe and holds his shield with a strap round the forearm.",
        choices: [
          {
            t: "Have a shield strapped to the stump and train",
            check: {s:"wil",s2:"shield",d:50},
            win: {
              r: "Months of bruises. Then one day the shield moves where you want it, and you laugh out loud.",
              fx: {wil:3,skill:{shield:4},str:.6},
            },
            lose: {
              r: "The strap chafes the stump raw. You learn slowly, and it costs you.",
              fx: {wil:2,health:-5,skill:{shield:2}},
            },
          },
          {
            t: "Learn the other side of war: maps and orders",
            r: "If you cannot hold a sword and a shield, you can hold a pen and a map. You study at night.",
            fx: {skill:{tactics:4,logistics:3},int:.6,wil:1},
          },
          {
            t: "Grieve for it first",
            r: "You let yourself grieve: for the hand, for the man who had it. Then you get up.",
            fx: {wil:2.5,happy:2},
          },
        ],
      },
      {
        id: "rk_wd_limp",
        cond: (p,C)=>C.soldier(p)&&hurt(p,"limp","bad_knee"),
        setup: prep,
        title: "The bad leg",
        text: "Your leg has never been right since the wound. On the march you fall behind by a hundred paces every hour, and catch up at the halt when the others are resting. The squad's surgeon says it will not get better. The captain says nothing, yet.",
        choices: [
          {
            t: "March on it anyway, every step",
            check: {s:"wil",s2:"sta",d:55},
            win: {
              r: "You never fall out. Not once. The men stop noticing the limp and start noticing the man.",
              fx: {wil:3,sta:.8,merit:4},
            },
            lose: {r:"The leg gives out on a hill. You finish the march in a cart.",fx:{wil:2,health:-6,merit:-2}},
          },
          {
            t: "Ask for a mounted post",
            check: {s:"riding",s2:"persuasion",d:45},
            win: {
              r: "A horse and a post as a galloper carrying orders. Your leg does not matter in the saddle.",
              fx: {skill:{riding:3},merit:3},
            },
            lose: {r:"No horses to spare for a lame soldier.",fx:{happy:-3}},
          },
          {
            t: "Ask for garrison duty",
            r: "A fort, a wall, a gate. Your leg can manage that. You miss the march more than you thought you would.",
            fx: {happy:-2,health:4,merit:-2},
          },
        ],
      },
      {
        id: "rk_wd_eye",
        cond: (p,C)=>C.adult(p)&&hurt(p,"lost_eye")&&(C.soldier(p)||!!p.veteran),
        once: !0,
        setup: (p,ctx)=>{ctx.epi=A.pick(["One-Eye","the Patch","Half-Sight"])},
        title: "One eye",
        text: 'With one eye, the world is flat. You misjudge every step, every cup, every blade coming at you from the blind side. Children stare at the patch. Soldiers have already started calling you "{epi}".',
        choices: [
          {
            t: "Train the blind side until you can feel it",
            check: {s:"ins",s2:"wil",d:55},
            win: {
              r: "You learn to turn your head, to listen, to feel the air move. Old fighters say a one-eyed man who survives is the most dangerous kind.",
              fx: {ins:1,wil:2,skill:{melee:2}},
            },
            lose: {r:"It comes slowly. Too slowly for comfort.",fx:{wil:1.5}},
          },
          {
            t: "Wear the name with pride",
            r: '"{epi}," they call you, and you grin with the face that is left. A name made in a fight is a weapon.',
            fx: (p,ctx)=>A.applyFx(p,{fame:2,wil:1,epithet:ctx.epi||"One-Eye"},ctx),
          },
          {
            t: "Hide it under a hood and a hat",
            r: "You keep to the shade. People forget. You do not.",
            fx: {happy:-3,wil:1},
          },
        ],
      },
      {
        id: "rk_wd_arrowhead",
        cond: (p,C)=>C.adult(p)&&hurt(p,"arrow_wound")&&(C.soldier(p)||!!p.veteran),
        once: !0,
        title: "The old arrowhead",
        text: "Years ago the surgeon could not find the head of the arrow and closed the wound over it. Now, on a cold morning, the old scar is hot and swollen, and something hard is moving under the skin.",
        choices: [
          {
            t: "Have a surgeon cut it out (5 suns)",
            req: p=>p.coin>=5,
            r: "He cuts, probes and pulls out a rusty barbed head the length of your finger. You keep it on a string round your neck.",
            fx: {coin:-5,health:6,wil:1},
          },
          {
            t: "Cut it out yourself",
            check: {s:"medicine",s2:"wil",d:50},
            win: {
              r: "A hot knife, a strap between your teeth, and there it is. You keep it, and show it off for years.",
              fx: {health:4,wil:2,skill:{medicine:2}},
            },
            lose: {r:"You get it out. The wound festers anyway.",fx:{health:-15,wil:2,cause:"a festering old wound"}},
          },
          {
            t: "Leave it and let it work its way out",
            r: "It works its way out on its own, in a month of aches. Your body does what it must.",
            fx: {health:-5,wil:1},
          },
        ],
      },
      {
        id: "rk_wd_head",
        cond: (p,C)=>C.adult(p)&&hurt(p,"concussion")&&(C.soldier(p)||!!p.veteran),
        setup: prep,
        title: "The headaches",
        text: "Since the blow to the head, there are days when the light hurts, when you forget a word in the middle of a sentence, when your hands shake for no reason. The surgeon says rest. The army does not know the word.",
        choices: [
          {
            t: "Rest, properly, for a month",
            r: "A month in the dark, with cold cloths. It helps. It does not cure.",
            fx: {health:8,merit:-2,int:.2},
          },
          {
            t: "Hide it and carry on",
            check: {s:"wil",s2:"int",d:50},
            win: {r:"You learn the signs and work around them. Nobody knows but you.",fx:{wil:2}},
            lose: {
              r: "You forget an order in front of your captain. Now everyone knows.",
              fx: {wil:1.5,merit:-4,happy:-4},
            },
          },
          {
            t: "Ask the priest for a blessing",
            r: p=>`The priest of ${faithName(p)} prays over you. The headaches do not stop, but you are less afraid of them.`,
            fx: {piety:4,wil:1,happy:2},
          },
        ],
      },
      {
        id: "rk_wd_face",
        cond: (p,C)=>C.adult(p)&&hurt(p,"scar_face","broken_nose")&&(C.soldier(p)||!!p.veteran),
        once: !0,
        title: "The face in the water",
        text: "You catch sight of yourself in a still pool and do not know the face for a moment. The scar has pulled your mouth into a sideways smile. A child at the well points and asks her mother what happened to you.",
        choices: [
          {
            t: "Kneel down and tell her the truth",
            r: '"A man with an axe," you say. "I was luckier than him." She thinks about it and decides you are a hero. Her mother is less sure.',
            fx: {happy:4,wil:1},
          },
          {
            t: "Grow a beard and keep your hood up",
            r: "It hides most of it. You stop looking in pools.",
            fx: {happy:-2,looks:1},
          },
          {
            t: "Make a joke of it before anyone else can",
            r: '"Should see the other fellow." You say it a hundred times in your life. It gets a laugh about half of them.',
            fx: {happy:2,skill:{persuasion:1}},
          },
        ],
      },
      {
        id: "rk_wd_back",
        cond: (p,C)=>C.adult(p)&&hurt(p,"back","broken_ribs")&&(C.soldier(p)||!!p.veteran),
        setup: prep,
        title: "The old back",
        text: "The old injury to your back and ribs has come back with the rain. You cannot lift a pack without a gasp, and some mornings you cannot get out of your blanket at all without help.",
        choices: [
          {
            t: "Find a bonesetter who knows the trade (6 suns)",
            req: p=>p.coin>=6,
            r: "The bonesetter pulls, pushes and cracks you like a walnut. You can stand straight for the first time in a month.",
            fx: {coin:-6,health:10},
          },
          {
            t: "Strengthen it with work, slowly",
            check: {s:"sta",s2:"wil",d:50},
            win: {
              r: "A little more every day. By summer the back is stronger than before the wound.",
              fx: {str:.8,sta:.8,wil:1.5},
            },
            lose: {r:"You push it too hard and it locks for a week.",fx:{health:-6,wil:1}},
          },
          {t:"Live with it",r:"You learn which ways not to bend. Pain is just weather.",fx:{wil:1.5}},
        ],
      },
      {
        id: "rk_vt_land",
        cond: (p,C)=>vet(p,C)&&!C.rich(p),
        setup: (p,ctx)=>{ctx.stw=nm(p),ctx.yrs=p.veteran?p.veteran.years:3},
        title: "The land you were promised",
        text: "{yrs} years of service, and the crown's recruiting sergeant promised you a soldier's holding at the end of it: twenty acres free of rent. The steward, {stw}, has a ledger that does not have your name in it.",
        choices: [
          {
            t: "Bring witnesses from your old unit",
            check: {s:"persuasion",s2:"learning",d:50},
            win: {
              r: "Three old comrades and your discharge paper. The steward finds your name after all. Twenty acres of stony ground, and it is yours.",
              fx: {asset:"farm",happy:8,wil:1},
            },
            lose: {r:"The steward finds a reason. There is always a reason.",fx:{happy:-6,wil:2}},
          },
          {
            t: "Pay the steward to find your name (25 suns)",
            req: p=>p.coin>=25,
            r: "Twenty-five suns, and the ledger is suddenly in order. Twenty acres for the price of a sword.",
            fx: {coin:-25,asset:"farm",honor:-1,happy:5},
          },
          {
            t: "Let it go and find work",
            r: "You let it go and find work. It is what most old soldiers do.",
            fx: {wil:1.5,happy:-3},
          },
        ],
      },
      {
        id: "rk_vt_stories",
        cond: (p,C)=>vet(p,C),
        setup: (p,ctx)=>{ctx.lad=nm(p)},
        title: "War stories",
        text: 'At the alehouse the young men gather round you, as they always do, eyes shining. "Tell us about the war." One of them, {lad}, is going to enlist at the next fair. He wants a reason.',
        choices: [
          {
            t: "Tell the glorious version",
            r: "Banners, charges, comrades, glory. They buy you ale all night. {lad} enlists with stars in his eyes.",
            fx: {happy:4,fame:1,honor:-1},
          },
          {
            t: "Tell them the truth: flux, mud and the screaming",
            r: "You tell them the truth. Most of them stop listening. {lad} does not. He thinks hard about it, and enlists anyway, knowing.",
            fx: {wil:1.5,honor:3,happy:-2},
          },
          {
            t: "Tell them nothing and drink your ale",
            r: '"Nothing to tell." They leave you alone after a while. That is what you wanted.',
            fx: {wil:.5},
          },
        ],
      },
      {
        id: "rk_vt_comrade",
        cond: (p,C)=>vet(p,C),
        setup: (p,ctx)=>{ctx.oc=nm(p)},
        title: "An old comrade",
        text: ()=>`A knock at the door, and it is {oc}, who stood next to you in the line for years. ${A.pick(["He has done well: a mill, a wife, a belly. He has brought a ham.","He has done badly: thin, shaking, and with a look you have seen on men about to break.","He is a sergeant still, passing through with a recruiting party, and he wants a bed for the night."])}`,
        choices: [
          {
            t: "Sit up all night talking about the old days",
            r: "You talk until the candle dies: the names, the places, the jokes only the two of you understand. In the morning you both feel lighter.",
            fx: {happy:6,wil:1,newRel:{type:"friend",op:40}},
          },
          {
            t: "Help him with whatever he needs",
            req: p=>p.coin>=15,
            r: "You give what he needs: money, a bed, a word to someone. Old debts from the line are the only debts that matter.",
            fx: {coin:-15,honor:4,newRel:{type:"friend",op:50}},
          },
          {
            t: "Give him a meal and send him on",
            r: "A meal and a handshake. Some doors are better left closed.",
            fx: {happy:-1},
          },
        ],
      },
      {
        id: "rk_vt_recall",
        cond: (p,C)=>vet(p,C)&&C.atWar(p)&&!C.old(p),
        setup: (p,ctx)=>{ctx.foe=foeOf(p)},
        title: "The recall",
        text: "A crier reads the recall in the square: every man who has served, to the colors again, for the war against {foe}. Old soldiers are worth two new ones. Your old unit has sent your name.",
        choices: [
          {
            t: "Answer the call",
            r: "You take your old sword down from the wall.",
            fx: p=>{if(p.mil)return"";const r=A.enlist(p,!1);if(!r||!r.ok)return r&&r.msg||"The sergeant shakes his head.";if(p.mil&&p.veteran){const nr=Math.max(p.mil.rank,Math.min(4,p.veteran.rank-1));p.mil.rank=nr,p.mil.merit=Math.max(p.mil.merit,GD.MIL[nr].merit)}return"You are back in the ranks, with your old rank or near it."},
          },
          {
            t: "Pay for a substitute (40 suns)",
            req: p=>p.coin>=40,
            r: "Forty suns buys a farm boy to go in your place. You try not to think about him.",
            fx: {coin:-40,honor:-2},
          },
          {
            t: "Hide when the sergeant comes",
            check: {s:"stealth",s2:"deception",d:45},
            win: {r:"Your wife tells the sergeant you died of a fever. He writes it down.",fx:{honor:-4}},
            lose: {
              r: "The sergeant finds you in the hayloft. You are marched off with the rest.",
              fx: p=>{if(p.mil)return"";const r=A.enlist(p,!1);return r&&r.ok?"Back in the ranks, the hard way.":"In the end they let you go: too old, too slow."},
            },
          },
        ],
      },
      {
        id: "rk_vt_militia",
        cond: (p,C)=>vet(p,C),
        setup: (p,ctx)=>{ctx.vil=prov(p.home)},
        title: "The village wants a sergeant",
        text: "Bandits have burned two farms in the hills above {vil}. The headman comes to you with his hat in his hands: you are the only one who has ever been a soldier. Will you train the young men?",
        choices: [
          {
            t: "Drill them properly, as you were drilled",
            check: {s:"command",s2:"tactics",d:45},
            win: {
              r: "A month of drill, a palisade and a horn. When the bandits come, the village is ready, and they go away again.",
              fx: {fame:3,honor:4,skill:{command:3},happy:5},
            },
            lose: {
              r: "They are farmers, not soldiers. When the bandits come, half of them run. But half of them stand.",
              fx: {fame:1,wil:1.5,health:-5,cause:"a bandit raid"},
            },
          },
          {
            t: "Lead them against the bandit camp yourself",
            r: "You lead a dozen farm boys into the hills.",
            fx: {
              fame: 2,
              duel: {
                tier: 2,
                title: "the bandit leader",
                opts: {kind:"duel",place:"a bandit camp in the hills",title:"The bandit camp"},
              },
            },
          },
          {
            t: "Tell them to hire real soldiers",
            r: `"I'm done with all that." The headman goes away disappointed. You do not sleep well that night.`,
            fx: {happy:-2},
          },
        ],
      },
      {
        id: "rk_vt_son",
        cond: (p,C)=>vet(p,C)&&C.hasKids(p),
        setup: (p,ctx)=>{const k=A.relsOf(p,["child"]).filter(x=>x.p.alive)[0];ctx.kid=k?k.p.given:nm(p)},
        title: "My child wants to enlist",
        text: `{kid} wants to enlist, because of you: because of the scars, the stories, the sword on the wall. "You did it. Why shouldn't I?"`,
        choices: [
          {
            t: "Give your blessing and your best advice",
            r: "You teach {kid} everything you know in a month: feet, shields, horn calls, who to trust. Then you watch the road for a long time.",
            fx: {rel:{who:"child",op:10},wil:1,happy:-2},
          },
          {
            t: "Forbid it",
            check: {s:"persuasion",s2:"wil",d:50},
            win: {
              r: "You tell {kid} what you never told anyone. {kid} stays home, and looks at you differently after.",
              fx: {rel:{who:"child",op:5},wil:1.5},
            },
            lose: {r:"{kid} goes anyway, without your blessing.",fx:{rel:{who:"child",op:-15},happy:-6}},
          },
          {
            t: "Find {kid} a place in a garrison, not the field",
            check: {s:"persuasion",s2:"intrigue",d:45},
            win: {
              r: "An old comrade owes you. {kid} gets a gate in a quiet fort.",
              fx: {rel:{who:"child",op:8},happy:3},
            },
            lose: {r:"Your old comrade is dead. {kid} goes where the army sends {kid}.",fx:{happy:-3}},
          },
        ],
      },
      {
        id: "rk_vt_reunion",
        cond: (p,C)=>vet(p,C),
        setup: (p,ctx)=>{ctx.days=A.pick(["Return Day","Harvest Home","New Year's Day"])},
        title: "The old company",
        text: "On {days} the veterans of your old unit gather at an inn, as they do every year. Fewer each time. They read the names of the dead, drink to them, and then tell the same stories louder and louder.",
        choices: [
          {
            t: "Go, and read the names",
            r: "You read the names, every one, without your voice breaking. Then you get very drunk with the living.",
            fx: {happy:6,wil:1,coin:-3},
          },
          {
            t: "Go, and pay for the whole night (30 suns)",
            req: p=>p.coin>=30,
            r: "You pay for everything. The old company toasts you until dawn.",
            fx: {coin:-30,fame:2,happy:7},
          },
          {t:"Stay home this year",r:"You stay home and think about them anyway.",fx:{happy:-2,wil:.5}},
        ],
      },
      {
        id: "rk_vt_sword",
        cond: (p,C)=>vet(p,C)&&C.poor(p),
        title: "The sword on the wall",
        text: "It is a hard winter. The only thing of value in your house is the sword on the wall: the one you carried through every fight, or one you took from a dead man in one of them. A dealer in {town} would give you twenty suns for it.",
        choices: [
          {t:"Sell it",r:"Twenty suns and a full larder. The wall looks very bare.",fx:{coin:20,happy:-4}},
          {
            t: "Keep it and go hungry",
            r: "You keep it. Some things are not for sale, even in winter.",
            fx: {health:-6,wil:2,honor:2,cause:"a hungry winter"},
          },
          {
            t: "Hire it out: teach the reeve's son swordwork",
            check: {s:"sword",s2:"persuasion",d:40},
            win: {
              r: "The reeve pays a sun a lesson. You keep the sword and fill the larder.",
              fx: {coin:15,skill:{sword:1,persuasion:1}},
            },
            lose: {r:"The reeve's son is hopeless and the reeve blames you.",fx:{happy:-2}},
          },
        ],
      },
      {
        id: "rk_vt_bandits",
        cond: (p,C)=>vet(p,C)&&!C.old(p),
        setup: (p,ctx)=>{ctx.oc=nm(p)},
        title: "Easy money",
        text: `{oc}, who served with you, comes by with two other old soldiers. They have no land, no work and no patience left. "The merchants' road is wide open, and we know how to hold a road. Come with us."`,
        choices: [
          {
            t: "Join them",
            r: "You take your old sword and go. On the road, nobody asks for a discharge paper.",
            fx: {coin:30,honor:-10,flag:"outlaw",job:"thief"},
          },
          {
            t: "Talk them out of it",
            check: {s:"persuasion",s2:"wil",d:50},
            win: {
              r: "You find them work guarding a merchant's carts instead. The same road, from the other side.",
              fx: {honor:4,newRel:{type:"friend",op:30}},
            },
            lose: {r:"They go anyway. You hear later that two of them hanged.",fx:{wil:1,happy:-3}},
          },
          {
            t: "Warn the reeve",
            r: "The reeve's men are waiting on the road. Your old comrades will not forgive you, those who live.",
            fx: {honor:-2,fame:1,newRel:{type:"enemy",op:-40}},
          },
        ],
      },
      {
        id: "rk_vt_field",
        cond: (p,C)=>vet(p,C)&&battles(p)>0,
        once: !0,
        title: "The field",
        text: "Years later, your road takes you past the field where you fought. It is wheat now. A farmer is ploughing, and his plough turns up an old buckle and the white edge of a bone. There is no marker.",
        choices: [
          {
            t: "Raise a cairn, stone by stone",
            r: "You spend the day raising a cairn at the edge of the field. The farmer helps after the first hour. Neither of you says much.",
            fx: {piety:4,wil:2,honor:3},
          },
          {
            t: "Pay the temple to say the rites (10 suns)",
            req: p=>p.coin>=10,
            r: p=>`Ten suns, and a priest of ${faithName(p)} says the rites over the wheat. It is the funeral they never had.`,
            fx: {coin:-10,piety:5,happy:3},
          },
          {t:"Ride on",r:"You ride on. They are not there anymore. You are.",fx:{wil:1}},
        ],
      },
      {
        id: "rk_vt_enemy",
        cond: (p,C)=>vet(p,C)&&battles(p)>0,
        setup: (p,ctx)=>{ctx.foe=foeOf(p),ctx.ov=nm(p)},
        title: "The other side",
        text: "At a market you get talking with a grey-haired horse-trader, {ov}. It comes out slowly: he fought for {foe}, in the same war, perhaps in the same battle. You were trying to kill each other twenty paces apart.",
        choices: [
          {
            t: "Buy him a drink",
            r: "You drink till evening and find you agree about everything: the officers, the food, the mud, the waste of it.",
            fx: {happy:5,newRel:{type:"friend",op:30},wil:1},
          },
          {t:"Walk away",r:"You cannot. Not yet. Maybe not ever.",fx:{wil:.5}},
          {
            t: "Ask him what it was like on his side",
            r: "He tells you: the same hunger, the same fear, a different flag. It changes how you remember it.",
            fx: {int:.5,wil:1.5,happy:2},
          },
        ],
      },
      {
        id: "rk_vt_grandchildren",
        cond: (p,C)=>vet(p,C)&&C.old(p),
        title: "What happened to your hand?",
        text: ()=>`The grandchildren of the village gather round your bench in the sun. The smallest one points at ${A.pick(["your scars","the old wound on your arm","the sword above your door","the medal on a string"])}. "Were you a hero?"`,
        choices: [
          {
            t: '"No. I was lucky."',
            r: "They are disappointed. One of them, the quiet one, remembers it all her life.",
            fx: {wil:1,happy:3},
          },
          {
            t: "Tell them a story, a good one",
            r: "You tell them about the bridge, the horses, the night march. They sit with their mouths open until their mothers call them.",
            fx: {happy:6,fame:1},
          },
          {
            t: "Teach them a marching song",
            r: "By evening the whole village is singing it, children marching up and down with sticks for spears.",
            fx: {happy:5,skill:{music:1}},
          },
        ],
      },
      {
        id: "rk_gar_farm",
        cond: (p,C)=>peace(p,C)&&crown(p)&&rk(p)<=3,
        setup: prep,
        title: "Harvest or the wall",
        text: "Most soldiers in a standing army are soldier-farmers: drill on set days, a month in three on garrison, and the field in war. Your turn on the wall falls in the very month your oats need cutting.",
        choices: [
          {
            t: "Pay a neighbor to bring in your harvest (6 suns)",
            req: p=>p.coin>=6,
            r: "Six suns and your neighbor's sons bring it in. You stand your month on the wall.",
            fx: {coin:-6,merit:2},
          },
          {
            t: "Swap turns with {mate}",
            check: {s:"persuasion",s2:"diplomacy",d:40},
            win: {
              r: "{mate} takes your turn in harvest month and you take {mhis} in winter. Everyone gets their oats in.",
              fx: {them:{op:6}},
            },
            lose: {r:"{mate} has oats of {mhis} own.",fx:{happy:-2}},
          },
          {
            t: "Go home and cut it anyway",
            check: {s:"stealth",s2:"deception",d:50},
            win: {r:"Three days home, three days back, and the captain never notices.",fx:{coin:8,happy:3}},
            lose: {r:"The captain notices. A fine larger than the harvest.",fx:{coin:-12,merit:-5}},
          },
        ],
      },
      {
        id: "rk_gar_bored",
        cond: (p,C)=>peace(p,C)&&rk(p)<=4,
        setup: prep,
        title: "Garrison",
        text: ()=>`Months on a quiet wall. Nothing happens. Nothing will happen. The garrison plays ${A.pick(["dice","Captains on a scratched board","knucklebones","cards"])}, drinks and fights about nothing. {mate} says if {mhe} has to look at that hill one more day {mhe} will walk into it.`,
        choices: [
          {
            t: "Learn a trade on the side",
            r: ()=>`You find a ${A.pick(["cobbler","saddler","carpenter","smith"])} in town who will teach you for your help. Soldiers who can mend things are never poor.`,
            fx: {skill:{craft:4},coin:3},
          },
          {
            t: "Organize a shooting match against the town",
            check: {s:"command",s2:"bow",d:40},
            win: {
              r: "The garrison beats the town by two arrows. The town buys the beer. Everyone is happier.",
              fx: {skill:{bow:2,command:2},happy:4,rel:{who:"comrade",op:4,all:!0}},
            },
            lose: {r:"The town wins. The garrison buys the beer and sulks.",fx:{coin:-3,happy:1}},
          },
          {
            t: "Study the old maps in the castellan's room",
            req: p=>p.literate,
            r: "You read every map and dispatch in the fort. You know this border better than anyone alive.",
            fx: {skill:{tactics:3,learning:2},int:.5},
          },
          {
            t: "Drink and play like everyone else",
            r: "A pleasant, wasted season.",
            fx: {happy:3,coin:-5,health:-2},
          },
        ],
      },
      {
        id: "rk_gar_smugglers",
        cond: (p,C)=>peace(p,C)&&rk(p)<=4,
        setup: (p,ctx)=>{prep(p,ctx),ctx.smg=nm(p)},
        title: "The toll fort",
        text: 'Your garrison holds a toll fort on the road. A carter called {smg} comes through every week with a load of "turnips" that clinks. Tonight he slips a purse into your hand as you lift the bar.',
        choices: [
          {
            t: "Keep the purse and lift the bar",
            r: "Ten suns a week for not looking at turnips. The whole garrison does it.",
            fx: {coin:20,honor:-4},
          },
          {
            t: "Search the cart",
            check: {s:"ins",s2:"intimidation",d:45},
            win: {
              r: "Under the turnips, untaxed silver and salt. The castellan gets the cargo and you get a share of the fine.",
              fx: {coin:15,merit:6,honor:2},
            },
            lose: {
              r: "{smg} has a knife in his boot and three friends in the trees.",
              fx: {
                duel: {
                  tier: 2,
                  title: "a smuggler",
                  opts: {kind:"duel",place:"the toll fort gate",light:"night",title:"At the toll bar"},
                },
              },
            },
          },
          {
            t: "Give back the purse and wave him through",
            r: "You do not take his money and you do not search his cart. A soldier's neutrality.",
            fx: {honor:1},
          },
        ],
      },
      {
        id: "rk_gar_paper_men",
        cond: (p,C)=>peace(p,C)&&band(p,C,1,4),
        setup: prep,
        title: "The inspection",
        text: `The crown's inspector arrives next week. The fort is supposed to hold a hundred men. It holds sixty-one. The castellan has been drawing pay for thirty-nine "paper men" for years, and he wants every man to stand in the line twice, in borrowed coats.`,
        choices: [
          {
            t: "Do it. Everyone does.",
            r: "You stand twice in two coats. The inspector counts a hundred and rides away. The castellan buys the garrison a pig.",
            fx: {honor:-3,coin:4},
          },
          {
            t: "Tell the inspector the truth",
            check: {s:"wil",s2:"persuasion",d:50},
            win: {
              r: "The inspector listens. The castellan is removed. The new one asks for you by name.",
              fx: {merit:12,honor:5,fame:1},
            },
            lose: {
              r: "The inspector is the castellan's friend. You are posted to the worst fort on the border.",
              fx: {merit:-6,wil:2,honor:4},
            },
          },
          {
            t: "Ask the castellan for a share of the paper pay",
            r: '"Clever lad." He gives you a share. Now you are in it too.',
            fx: {coin:30,honor:-6},
          },
        ],
      },
      {
        id: "rk_gar_beacon",
        cond: (p,C)=>peace(p,C)&&rk(p)<=3,
        setup: prep,
        title: "A fire on the next hill",
        text: 'You are on beacon watch. A chain of hilltop fires can carry one message, "invasion", hundreds of kilometers in under an hour. At midnight there is a light on the next hill. It might be the beacon. It might be shepherds.',
        choices: [
          {
            t: "Light the beacon",
            check: {s:"ins",s2:"int",d:50},
            win: {
              r: "It was the beacon. Raiders were crossing the border. Your fire set the whole march moving in time.",
              fx: {merit:12,fame:2},
            },
            lose: {
              r: "Shepherds. Your fire rouses the whole march for nothing. Ten thousand men lose a night's sleep and know your name.",
              fx: {merit:-8,happy:-5},
            },
          },
          {
            t: "Send a runner to look first",
            r: "The runner comes back in an hour: a real beacon. You light yours, an hour late. It is still in time, nearly.",
            fx: {merit:3},
          },
          {t:"Wait and watch",r:"The light burns out. Whatever it was, it is gone.",fx:{}},
        ],
      },
      {
        id: "rk_gar_town",
        cond: (p,C)=>peace(p,C)&&rk(p)<=2,
        setup: prep,
        title: "Soldiers and the town watch",
        text: 'The garrison and the town watch hate each other. Last night the watch beat {mate} for being drunk. Tonight the whole garrison is planning to "visit" the watch-house.',
        choices: [
          {
            t: "Go with them",
            r: "It is a glorious brawl. Nobody dies. Everybody pays a fine.",
            fx: {
              coin: -5,
              happy: 4,
              rel: {who:"comrade",op:5,all:!0},
              duel: {
                tier: 1,
                title: "a watchman",
                opts: {kind:"brawl",lethal:!1,toYield:!0,place:"the watch-house",title:"Garrison against watch"},
              },
            },
          },
          {
            t: "Talk to the watch captain first",
            check: {s:"diplomacy",s2:"persuasion",d:45},
            win: {
              r: "The watch captain sends {mate} a jug and an apology. The brawl is called off.",
              fx: {merit:4,skill:{diplomacy:2}},
            },
            lose: {
              r: "The watch captain spits at your feet. The brawl goes ahead, without you.",
              fx: {rel:{who:"comrade",op:-3,all:!0}},
            },
          },
          {
            t: "Warn your officers",
            r: "The garrison is confined to quarters. The men know who talked.",
            fx: {merit:3,rel:{who:"comrade",op:-5,all:!0}},
          },
        ],
      },
      {
        id: "rk_gar_parade",
        cond: (p,C)=>peace(p,C)&&crown(p),
        setup: prep,
        title: "The parade",
        text: "{festival} in {cap2}, and the army parades before {king}. Your {uw} has been chosen to march past the royal stand. The drill must be perfect. A single man out of step will be seen by the whole court.",
        choices: [
          {
            t: "Drill them every day for a month",
            check: {s:"command",s2:"sta",d:45},
            win: {
              r: "Not one man out of step. {king} raises a glove as you pass. Your name is mentioned at court.",
              fx: {merit:6,favor:3,fame:1},
            },
            lose: {r:"Someone trips at the royal stand. Laughter from the court.",fx:{merit:-2,happy:-4}},
          },
          {
            t: "Carry the standard yourself",
            check: {s:"str",s2:"wil",d:45},
            win: {
              r: "Three hours with the standard upright in a gusting wind. Nobody in the city forgets the sight.",
              fx: {fame:2,merit:4},
            },
            lose: {r:"The wind takes the standard sideways. It does not fall. Nearly.",fx:{happy:-2}},
          },
          {
            t: "Enjoy the day",
            r: "You march, wave, eat a sausage and kiss someone in the crowd. A good day.",
            fx: {happy:5},
          },
        ],
      },
      {
        id: "rk_gar_tourney",
        cond: (p,C)=>peace(p,C),
        setup: (p,ctx)=>{prep(p,ctx),ctx.prize=A.ri(20,60)},
        title: "The prize",
        text: ()=>`In peacetime the army keeps its edge with contests. This year there is a prize of {prize} suns for ${A.pick(["the best archer in the regiment","the best rider at the ring","the last man standing with practice staves"])}. Half the regiment has entered. So could you.`,
        choices: [
          {
            t: "Enter the shooting",
            check: {s:"bow",s2:"ins",d:50,bonus:p=>A.skill(p,"xbow")*.3},
            win: {
              r: "Your last arrow splits the peg. The prize is yours.",
              fx: (p,ctx)=>(p.coin+=ctx.prize||20,A.fame(p,2),p.mil&&(p.mil.merit+=5),A.trainSkill(p,"bow",2),""),
            },
            lose: {r:"Fourth place. Not bad. Not enough.",fx:{skill:{bow:2}}},
          },
          {
            t: "Ride at the ring",
            check: {s:"riding",s2:"lance",d:50},
            win: {
              r: "Three rings, three runs. The crowd roars.",
              fx: (p,ctx)=>(p.coin+=ctx.prize||20,A.fame(p,2),p.mil&&(p.mil.merit+=5),A.trainSkill(p,"lance",2),""),
            },
            lose: {r:"Your lance-point misses the last ring by a finger.",fx:{skill:{riding:2}}},
          },
          {
            t: "Fight with staves",
            r: "You step onto the sand.",
            fx: {
              duel: {
                tier: 2,
                title: "the regiment champion",
                opts: {kind:"brawl",lethal:!1,toYield:!0,place:"the contest sand",title:"The regiment contest"},
              },
            },
          },
          {
            t: "Run the betting instead",
            check: {s:"gambling",s2:"int",d:45},
            win: {r:"Everybody bets on the favorite. The favorite loses. You win.",fx:{coin:25,skill:{gambling:2}}},
            lose: {r:"The favorite wins. You cannot cover.",fx:{coin:-15}},
          },
        ],
      },
      {
        id: "rk_gar_strongarm",
        cond: (p,C)=>peace(p,C)&&rk(p)>=4&&rk(p)<=6,
        setup: (p,ctx)=>{prep(p,ctx),ctx.lordn=nm(p)},
        title: "A local quarrel",
        text: 'Lord {lordn}, who owns the land around your garrison town, asks you as a favor to "help" him settle a quarrel with his tenants over grazing rights: march a company through their village, nothing more. He hints at a gift.',
        choices: [
          {
            t: "March the company through",
            r: "The tenants give way. The lord sends a cask of wine and a purse. The tenants send nothing.",
            fx: {coin:60,honor:-6},
          },
          {
            t: "Refuse: soldiers are not bailiffs",
            r: '"Civil lords never command soldiers they did not raise," you remind him. He does not like it, but he cannot argue.',
            fx: {honor:4,newRel:{type:"rival",op:-25}},
          },
          {
            t: "Offer to judge the quarrel fairly instead",
            check: {s:"diplomacy",s2:"learning",d:50},
            win: {
              r: "You walk the boundaries with both sides and find the old markers. Neither side is happy. Both accept it.",
              fx: {fame:2,honor:4,skill:{diplomacy:3}},
            },
            lose: {r:"Both sides hate your judgement and complain to the crown.",fx:{merit:-3}},
          },
        ],
      },
      {
        id: "rk_fm_sword",
        cond: (p,C)=>dyn(p,C)&&C.child(p)&&C.ageAdj(p)>=5,
        once: !0,
        setup: prepF,
        title: "The sword above the hearth",
        text: "Above the hearth at {seat} hangs a sword. Nobody touches it. It belonged to the first of {fam} to hold the office: {office}. Today the hall is empty, and the stool is just tall enough.",
        choices: [
          {
            t: "Take it down and hold it",
            check: {s:"str",s2:"wil",d:20},
            win: {
              r: "It is heavier than anything you have ever held. You stand in the empty hall with the point wobbling and feel, for one moment, like the founder.",
              fx: {str:.4,wil:1,happy:4,flag:"rk_fm_sword"},
            },
            lose: {
              r: "It slips. The point nicks the flagstone, and the clang brings the whole household running.",
              fx: {happy:-4,rel:{who:"father",op:-5},wil:.5},
            },
          },
          {
            t: "Ask your father to tell you its story",
            r: "He takes it down himself and tells you: whose blood is on it, which ford, which year. You fall asleep with his voice in your head.",
            fx: {rel:{who:"father",op:8},int:.3,flag:"rk_fm_sword"},
          },
          {
            t: "Leave it. It frightens you a little.",
            r: "You leave it where it is. At night you dream of the man who carried it.",
            fx: {wil:.5},
          },
        ],
      },
      {
        id: "rk_fm_stick_drill",
        cond: (p,C)=>dyn(p,C)&&C.child(p)&&C.ageAdj(p)>=6,
        setup: prepF,
        title: "Sticks in the yard",
        text: "In {fam} the children drill with sticks in the yard every morning, like the soldiers they will be. Your cousin {cousin}, two years older and twice as big, knocks you flat for the third time and laughs.",
        choices: [
          {
            t: "Get up and go again",
            check: {s:"wil",s2:"ins",d:20},
            win: {
              r: `The fourth time you duck and rap {cousin}'s knuckles. The old sergeant who watches says, "That one."`,
              fx: {wil:1,ins:.5,skill:{melee:2},happy:3},
            },
            lose: {
              r: "Down again. And again. You get up every time, which is what the old sergeant was watching for.",
              fx: {wil:1.5,health:-2},
            },
          },
          {
            t: "Ask the old sergeant to show you a trick",
            r: "He shows you how to step inside a swing. Tomorrow {cousin} gets a surprise.",
            fx: {skill:{melee:2,shield:1},int:.2},
          },
          {
            t: "Go and cry behind the stables",
            r: "You cry behind the stables. Your aunt {aunt} finds you there and tells you that the founder cried too, at your age. You do not quite believe her.",
            fx: {happy:-2,wil:.5},
          },
        ],
      },
      {
        id: "rk_fm_custom",
        cond: (p,C)=>dyn(p,C)&&(C.child(p)||C.teen(p))&&C.ageAdj(p)>=8,
        once: !0,
        setup: prepF,
        title: "The family custom",
        text: "Every soldier family has its customs. Yours is this: {ties} This year it is your turn to take part, in front of the whole family and the old soldiers who come to watch.",
        choices: [
          {
            t: "Do it properly, solemnly",
            r: "You do it the way it has always been done. The oldest man there nods at you, and it is the best moment of your year.",
            fx: {wil:1,honor:2,happy:3,rel:{who:"father",op:6}},
          },
          {
            t: "Ask why the family does it",
            r: "Your grandmother tells you the whole story, including the parts that are not in the songs. You understand your family a little better, and like it a little less.",
            fx: {int:.5,wil:.5},
          },
          {
            t: "Make a mess of it",
            check: {s:"wil",s2:"spd",d:20},
            win: {
              r: "You stumble halfway, then finish it anyway, red-faced. The old soldiers like that better than perfection.",
              fx: {wil:1,happy:1},
            },
            lose: {
              r: "You make a mess of it, and everyone remembers. It becomes a family story, told at every feast, forever.",
              fx: {happy:-4,wil:1},
            },
          },
        ],
      },
      {
        id: "rk_fm_stories",
        cond: (p,C)=>dyn(p,C)&&C.child(p)&&C.ageAdj(p)>=5,
        setup: (p,ctx)=>{prepF(p,ctx),ctx.oldwar=A.pick(LORE.wars&&LORE.wars.length?LORE.wars.slice(-12).map(w=>w[1]):["the old wars"])},
        title: "Grandfather's war",
        text: "Old {old}, who served the family's office for forty years, has no teeth and one ear. On winter nights he tells the children about the {oldwar}: the banners, the charges, and the men of {funit} who held when everyone else ran.",
        choices: [
          {
            t: "Ask about the glory",
            r: "He tells you about banners and charges until your eyes shine. You play at war all the next day.",
            fx: {happy:4,skill:{tactics:1}},
          },
          {
            t: "Ask about the friends he lost",
            r: "He goes very quiet. Then he tells you their names, all of them, and you are the only child still listening when he finishes.",
            fx: {wil:1.5,int:.3},
          },
          {
            t: "Ask how they ate on campaign",
            r: "He laughs till he coughs. Then he tells you about biscuit, rats and turnips under farmhouse floors. It is the most useful thing anyone tells you for years.",
            fx: {skill:{survival:2},int:.3},
          },
        ],
      },
      {
        id: "rk_fm_away",
        cond: (p,C)=>dyn(p,C)&&C.child(p)&&C.parentsAlive(p),
        setup: prepF,
        title: "Waiting at the gate",
        text: "Your father is away with {funit}, and no letter has come for three months. Every evening you go and stand at the gate of {seat} and watch the road. The servants have stopped teasing you about it.",
        choices: [
          {
            t: "Keep watching, every night",
            r: "Every night for a month. Then one evening there is dust on the road, and a horse, and him. You are the first to see.",
            fx: {happy:8,wil:1,rel:{who:"father",op:10}},
          },
          {
            t: "Pray at the shrine instead",
            r: p=>`You pray to ${A.godWord(p)} every night. When he comes home, you are sure it was the prayers.`,
            fx: {piety:4,happy:4},
          },
          {
            t: "Ask your mother the truth about where he is",
            r: "She tells you more than you wanted to know about the war. You stop going to the gate. You lie awake instead.",
            fx: {wil:1.5,happy:-3,rel:{who:"mother",op:5}},
          },
        ],
      },
      {
        id: "rk_fm_coffin",
        cond: (p,C)=>dyn(p,C)&&(C.child(p)||C.teen(p))&&C.ageAdj(p)>=7,
        once: !0,
        setup: prepF,
        title: "Brought home",
        text: "They bring {uncle} home in a cart under the family's colors: one of {fam}, killed serving with {funit}. At the burial, the eldest child of the family holds the dead man's shield. This year that is you.",
        choices: [
          {
            t: "Hold it without trembling",
            check: {s:"wil",s2:"str",d:25},
            win: {
              r: "Your arms ache and you do not let it dip. Afterward the soldiers who carried him each shake your hand, like a grown man's.",
              fx: {wil:2,honor:2,rel:{who:"father",op:6}},
            },
            lose: {
              r: "The shield shakes. You do not drop it. Nobody says anything, and you hate yourself for a month.",
              fx: {wil:2,happy:-3},
            },
          },
          {
            t: "Ask the soldiers how he died",
            r: "They tell you the kind version. Years later, as a soldier yourself, you understand what they left out.",
            fx: {wil:1,int:.3},
          },
        ],
      },
      {
        id: "rk_fm_afraid",
        cond: (p,C)=>dyn(p,C)&&C.child(p)&&C.ageAdj(p)>=6,
        setup: prepF,
        title: "Afraid",
        text: ()=>`In {fam}, fear is shameful. You are afraid of ${A.pick(["horses","the dark under the stairs","the big dogs in the kennel","deep water"])}, and today your uncle {uncle} found out. "A {fsur} afraid?" he says, loud enough for the stable boys.`,
        choices: [
          {
            t: "Face it, right now, in front of him",
            check: {s:"wil",d:22},
            win: {
              r: "Shaking, you walk straight up to it. {uncle} says nothing, which from him is praise.",
              fx: {wil:2,happy:3,trait:"brave"},
            },
            lose: {r:"You try. You cannot. {uncle} turns away in disgust.",fx:{wil:1.5,happy:-5}},
          },
          {
            t: "Tell him everyone is afraid of something",
            r: '"Not in this family." But later you see him flinch at a lightning bolt, and you keep that to yourself, carefully, like a coin.',
            fx: {int:.4,wil:1},
          },
          {
            t: "Run away and hide",
            r: "You hide in the hayloft until dark. Your mother finds you and says nothing to anyone.",
            fx: {happy:-3,rel:{who:"mother",op:4}},
          },
        ],
      },
      {
        id: "rk_fm_letters",
        cond: (p,C)=>dyn(p,C)&&C.child(p)&&C.ageAdj(p)>=7&&!p.literate,
        setup: prepF,
        title: "A captain who cannot read",
        text: `"A captain who cannot read is half a captain," your aunt {aunt} says, and sits you down with the family's old order-book: a hundred years of commands written in faded ink for {funit}.`,
        choices: [
          {
            t: "Work at it every evening",
            check: {s:"int",s2:"wil",d:22},
            win: {
              r: "By midwinter you can read the old orders aloud, every one, and you know the history of the family better than your father does.",
              fx: {literate:!0,skill:{learning:3},int:.5},
            },
            lose: {
              r: "The letters swim. It takes two years instead of one. But you get there.",
              fx: {skill:{learning:2},wil:1},
            },
          },
          {
            t: "Skip lessons and go riding",
            r: "You ride every day instead. You become a good rider and a poor reader.",
            fx: {skill:{riding:3},rel:{who:"father",op:-3}},
          },
        ],
      },
      {
        id: "rk_fm_expect",
        cond: (p,C)=>dyn(p,C)&&C.teen(p),
        once: !0,
        setup: prepF,
        title: "Expected",
        text: 'At the family table your uncles talk about you as if you were not there. "Old enough in a year or two. A place in {funit} is waiting, of course. Every {fsur} serves." Nobody has asked what you want.',
        choices: [
          {
            t: "Say you will serve, proudly",
            r: "The table cheers and your uncle {uncle} gives you his own belt-knife. Your road is set.",
            fx: {happy:4,honor:2,flag:"rk_fm_promised",rel:{who:"father",op:8}},
          },
          {
            t: "Say you want something else",
            check: {s:"wil",s2:"persuasion",d:30},
            win: {
              r: 'The table goes silent. Then your grandmother says, "Let the child speak." For the first time, they listen.',
              fx: {wil:2,flag:"rk_fm_free"},
            },
            lose: {
              r: "They laugh, then they stop laughing. It becomes a long cold winter in {seat}.",
              fx: {wil:1.5,happy:-5,rel:{who:"father",op:-10}},
            },
          },
          {
            t: "Say nothing, and decide later",
            r: "You eat your soup. There is time. There is always time, until there is not.",
            fx: {wil:.5},
          },
        ],
      },
      {
        id: "rk_fm_proving",
        cond: (p,C)=>dyn(p,C)&&C.teen(p),
        once: !0,
        setup: prepF,
        title: "The proving",
        text: "Before a child of {fam} may ride with {funit}, there is a proving: a day of marching, a bout with staves against one of the family's old soldiers, and a night alone on watch at the edge of the family's land. The whole household is watching.",
        choices: [
          {
            t: "Go through all of it",
            check: {s:"sta",s2:"wil",d:30},
            win: {
              r: "You march, fight, and stand all night with your eyes open. At dawn your father hands you the family badge.",
              fx: {sta:1,wil:2,skill:{spear:2,shield:2},rel:{who:"father",op:12},fame:1,flag:"rk_fm_proved"},
            },
            lose: {r:"You fall asleep on the night watch. Next year, they say. Next year.",fx:{wil:1.5,happy:-6}},
          },
          {
            t: "Fight the bout like your life depends on it",
            check: {s:"ins",s2:"melee",d:30},
            win: {
              r: `The old soldier goes down on one knee, laughing. "That's a {fsur}," he says to the yard.`,
              fx: {ins:.8,skill:{melee:3},fame:1,flag:"rk_fm_proved"},
            },
            lose: {
              r: "He puts you down three times and then shows you why. You will win next year.",
              fx: {skill:{melee:2},wil:1},
            },
          },
          {
            t: "Refuse to take part",
            r: "You refuse. The family will talk about it for years. So will you.",
            fx: {wil:2,rel:{who:"father",op:-15},flag:"rk_fm_free"},
          },
        ],
      },
      {
        id: "rk_fm_summer",
        cond: (p,C)=>dyn(p,C)&&C.teen(p)&&C.ageAdj(p)>=13,
        setup: prepF,
        title: "A summer with the company",
        text: "For a summer you ride as a runner with {funit}, carrying messages and water. Everyone knows whose child you are. One afternoon, on patrol near the border, the company runs into raiders.",
        choices: [
          {
            t: "Do your job: carry the message to the reserve",
            check: {s:"riding",s2:"spd",d:30},
            win: {
              r: `You ride through a hedge, across a stream and into the reserve's camp, shouting. The reserve comes in time. Nobody calls you "the child" after that.`,
              fx: {skill:{riding:3},wil:1,fame:1},
            },
            lose: {r:"Your horse falls at the stream. Another runner gets there first.",fx:{health:-5,happy:-3}},
          },
          {
            t: "Grab a spear and stand in the line",
            check: {s:"ins",s2:"wil",d:32},
            win: {
              r: "You stand in the line for ten minutes that last a year. You live. You are not a child anymore.",
              fx: {wil:2,ins:1,skill:{spear:2},fame:1},
            },
            lose: {
              r: "A raider's club catches you on the head. You wake in a cart, and your father is furious and proud in equal parts.",
              fx: {health:-12,wound:"concussion",wil:2,cause:"a raider's club"},
            },
          },
          {
            t: "Stay with the baggage, as ordered",
            r: "You stay with the baggage. The sergeant tells your father you obeyed orders. Your father says that is the most important thing. You are not sure he means it.",
            fx: {wil:.5},
          },
        ],
      },
      {
        id: "rk_fm_rival_boy",
        cond: (p,C)=>dyn(p,C)&&C.teen(p),
        setup: (p,ctx)=>{prepF(p,ctx),ctx.rb=nm(p)},
        title: "What your grandfather did",
        text: `At the fair a boy from a rival family, {rb}, says loudly that everyone knows the truth about your family's founding: "Your great-grandfather ran at the ford and lied about it after." His friends laugh.`,
        choices: [
          {
            t: "Hit him",
            r: "You hit him. His friends join in. So do yours.",
            fx: {
              duel: {
                tier: 1,
                title: "a boy from a rival family",
                opts: {kind:"brawl",lethal:!1,toYield:!0,place:"the fair",title:"For the family name"},
              },
            },
          },
          {
            t: "Tell the real story, louder",
            check: {s:"persuasion",s2:"int",d:28},
            win: {
              r: "You tell it so well that the crowd turns on {rb}. He slinks off. The story of the ford is told at three alehouses that night.",
              fx: {fame:1,happy:4,skill:{persuasion:2}},
            },
            lose: {r:"You get the dates wrong. {rb} corrects you, smiling.",fx:{happy:-4}},
          },
          {
            t: "Walk away",
            r: "You walk away. That night you ask your father whether it is true. He takes a long time to answer.",
            fx: {wil:1,int:.3},
          },
        ],
      },
      {
        id: "rk_fm_words",
        cond: (p,C)=>dyn(p,C)&&C.teen(p),
        once: !0,
        setup: prepF,
        title: '"{words}"',
        text: 'At {festival} the young of {fam} swear on the family words before the household: "{words}". Your cousin {cousin} has already sworn. It is your turn, and you are not sure you believe them.',
        choices: [
          {
            t: "Swear, and mean every word",
            r: "You swear. The words go into you like a nail into wood. You will hear them in your head at the worst moments of your life, and they will help.",
            fx: {wil:1.5,honor:3,piety:1},
          },
          {
            t: "Swear, with your fingers crossed behind your back",
            r: "You swear and do not mean it. Nobody knows. You do.",
            fx: {honor:-1,int:.3},
          },
          {
            t: "Refuse to swear what you do not believe",
            r: "The household goes silent. Your grandmother smiles very slightly. She refused too, once.",
            fx: {wil:2,rel:{who:"father",op:-8}},
          },
        ],
      },
      {
        id: "rk_fm_cousin_shame",
        cond: (p,C)=>dyn(p,C)&&(C.teen(p)||C.adult(p)),
        once: !0,
        setup: prepF,
        title: "The coward",
        text: "Your cousin {cousin} ran. In {funit}'s last fight, {cousin} dropped spear and shield and ran for the trees. Now the whole march knows, and the name of {fam} is a joke in every alehouse. The family council wants {cousin} cast out, and wants you to say it first.",
        choices: [
          {
            t: "Say it: cast {cousin} out",
            r: "You say it. The family closes ranks. {cousin} leaves {seat} that night and is not spoken of again.",
            fx: {honor:2,wil:1,happy:-4,rel:{who:"father",op:6}},
          },
          {
            t: "Defend {cousin}: everyone runs once",
            check: {s:"persuasion",s2:"wil",d:45},
            win: {
              r: "You remind them that the founder ran too, at his first fight. Old {old} confirms it. {cousin} is given a second chance, and does not waste it.",
              fx: {honor:3,wil:1.5,newRel:{type:"friend",op:40}},
            },
            lose: {r:"They cast {cousin} out anyway, and look at you as if you might run too.",fx:{wil:1.5,happy:-4}},
          },
          {
            t: "Wipe out the shame yourself",
            check: {s:"ins",s2:"wil",d:50},
            win: {
              r: "You take {cousin}'s place in {funit} at the next muster and are first into the next fight. The alehouses find a new joke.",
              fx: {fame:3,honor:4,wil:1.5},
            },
            lose: {
              r: "You try too hard, too early, and get hurt doing it. The jokes go on.",
              fx: {health:-12,wound:"scar_arm",wil:2,cause:"trying to wipe out a family shame"},
            },
          },
        ],
      },
      {
        id: "rk_fm_join",
        cond: (p,C)=>dyn(p,C)&&!C.famHead(p)&&C.adult(p)&&!C.soldier(p)&&!C.old(p)&&!p.veteran,
        cool: 5,
        setup: prepF,
        title: "A place on the roll",
        text: 'A letter from {head}, sealed with the family arms: a place has fallen vacant in {funit}. "Every {fsur} serves. The roll has waited long enough for your name."',
        choices: [
          {t:"Take your place on the roll",r:"You ride to the muster.",fx:(p,ctx)=>enlistFam(p,ctx)},
          {
            t: "Write back: not yet",
            r: "You write back, carefully. The answer, when it comes, is three cold lines.",
            fx: {rel:{who:"father",op:-6},wil:.5},
          },
          {
            t: "Refuse for good",
            r: "You refuse. There is a family feast that winter to which you are not invited.",
            fx: {wil:1.5,happy:-4,flag:"rk_fm_refused"},
          },
        ],
      },
      {
        id: "rk_fm_feast_shame",
        cond: (p,C)=>dyn(p,C)&&C.adult(p)&&!C.soldier(p)&&C.flag(p,"rk_fm_refused"),
        once: !0,
        setup: prepF,
        title: "Below the salt",
        text: "At the great feast at {seat}, the ones who served sit at the high table under the old banners of {funit}. You are seated at the far end, with the children and the stewards. Your cousin {cousin} raises a cup to you, mockingly.",
        choices: [
          {
            t: "Sit, eat and keep your dignity",
            r: "You eat your meal with perfect manners and leave early. Some of the old soldiers nod to you as you go. They understand more than the family does.",
            fx: {wil:2,honor:2},
          },
          {
            t: "Stand up and say why you refused",
            check: {s:"persuasion",s2:"wil",d:50},
            win: {
              r: "You speak plainly about what the family's wars cost. The hall goes quiet. Afterward, two of your young cousins come to talk to you.",
              fx: {fame:1,wil:2,unflag:"rk_fm_refused"},
            },
            lose: {
              r: "You get tangled in your own words. {cousin} laughs, and the hall laughs with {cousin}.",
              fx: {happy:-6,wil:1.5},
            },
          },
          {
            t: "Walk out",
            r: "You walk out into the cold. It is a long ride home, and a good one.",
            fx: {happy:-2,wil:1},
          },
        ],
      },
      {
        id: "rk_fm_slander",
        cond: (p,C)=>dyn(p,C)&&C.adult(p),
        setup: (p,ctx)=>{prepF(p,ctx),ctx.sl=nm(p)},
        title: "An old lie",
        text: "A minstrel in {town} is singing a new song about an old battle, and in it {fam} comes off badly: slow to march, quick to run. The crowd loves it. A lord called {sl} paid for the song. His family and yours have hated each other for three generations.",
        choices: [
          {
            t: "Pay the minstrel to sing a better verse (10 suns)",
            req: p=>p.coin>=10,
            r: "Ten suns and a new verse in which {fam} saves the day. The minstrel is a professional. Both versions go round, and yours is catchier.",
            fx: {coin:-10,fame:1,happy:2},
          },
          {
            t: "Challenge {sl}",
            r: "You find {sl} at his inn and throw your glove at his feet.",
            fx: {
              duel: {
                tier: 3,
                title: "a slandering lord",
                opts: {kind:"duel",lethal:!1,toYield:!0,place:"an inn yard",title:"For the family's honor"},
              },
            },
          },
          {
            t: "Find the old records that prove the truth",
            check: {s:"learning",s2:"intrigue",d:45},
            win: {
              r: "A dusty order-book in a temple archive proves exactly where your family stood. You have it read aloud in the square.",
              fx: {fame:2,honor:3,skill:{learning:2}},
            },
            lose: {r:"The records are lost, or never existed.",fx:{happy:-2}},
          },
          {
            t: "Laugh at it",
            r: '"Good tune." You laugh and buy the minstrel a drink. The song dies in a month, as songs do.',
            fx: {wil:.5},
          },
        ],
      },
      {
        id: "rk_fm_ransom",
        cond: (p,C)=>dyn(p,C)&&!C.famHead(p)&&C.adult(p),
        setup: prepF,
        title: "The family must pay",
        text: "Your kinsman {uncle} has been taken prisoner leading {funit} against {foe}. The ransom is set at six hundred suns. {Head} writes to every member of {fam}: each must give what they can.",
        choices: [
          {
            t: "Give generously (60 suns)",
            req: p=>p.coin>=60,
            r: "Sixty suns. {uncle} comes home in spring, thin and grateful, and remembers exactly who gave what.",
            fx: {coin:-60,honor:3,newRel:{type:"friend",op:40}},
          },
          {
            t: "Give what you can spare (10 suns)",
            req: p=>p.coin>=10,
            r: "Ten suns. It is noted.",
            fx: {coin:-10,honor:1},
          },
          {
            t: "Ride to the enemy and negotiate yourself",
            check: {s:"diplomacy",s2:"persuasion",d:55},
            win: {
              r: "You talk the ransom down to four hundred and ride home with {uncle} at your side. The family will not forget.",
              fx: {fame:2,honor:4,skill:{diplomacy:3},newRel:{type:"friend",op:50}},
            },
            lose: {r:"The enemy captain doubles the ransom for your trouble.",fx:{happy:-4}},
          },
          {
            t: "Give nothing",
            r: "You give nothing. The family pays without you, and remembers that too.",
            fx: {honor:-3,rel:{who:"father",op:-6}},
          },
        ],
      },
      {
        id: "rk_fm_widows",
        cond: (p,C)=>dyn(p,C)&&C.adult(p)&&(C.famHead(p)||C.rich(p)||C.age(p)>=30),
        setup: prepF,
        title: "The widows of the company",
        text: "A delegation at the gate of {seat}: widows of men who died serving in {funit}, the family's own unit. The crown's pensions have not been paid for a year. They have come to the family, as widows always have.",
        choices: [
          {
            t: "Pay them from your own purse (40 suns)",
            req: p=>p.coin>=40,
            r: "Forty suns, shared out at the gate. Word goes round the villages that {fam} looks after its own.",
            fx: {coin:-40,honor:5,fame:2},
          },
          {
            t: "Ride to the crown's paymaster and demand the pensions",
            check: {s:"persuasion",s2:"intimidation",d:50},
            win: {
              r: "You stand in the paymaster's office until he finds the money. The widows are paid, and your family's name goes up in the villages.",
              fx: {fame:2,honor:4,skill:{persuasion:2}},
            },
            lose: {r:"The paymaster has no money and no shame. You come back empty-handed.",fx:{wil:1,happy:-3}},
          },
          {
            t: "Send them to the family head",
            r: "You send them on. Somebody else's problem, for now.",
            fx: {honor:-2},
          },
        ],
      },
      {
        id: "rk_fm_papers",
        cond: (p,C)=>dyn(p,C)&&!C.famHead(p)&&C.adult(p)&&p.literate,
        once: !0,
        setup: prepF,
        title: "The family papers",
        text: "Clearing an old chest at {seat}, you find a bundle of letters from the year {since}, the year your family won its office. In the founder's own hand, the story is not quite the one in the songs: less courage, more luck, and one inconvenient detail about who really held the line.",
        choices: [
          {
            t: "Burn them",
            r: "The letters curl in the fire. The song is the truth now, and nobody alive knows otherwise except you.",
            fx: {honor:-2,wil:1,flag:"rk_fm_secret"},
          },
          {
            t: "Keep them hidden",
            r: "You put them back in the chest under a false bottom. Some day someone may need them. Some day someone may use them against you.",
            fx: {int:.5,flag:"rk_fm_secret"},
          },
          {
            t: "Show them to the family",
            check: {s:"persuasion",s2:"diplomacy",d:50},
            win: {
              r: `There is shouting, then a long silence, then laughter. Old {old} says, "Luck and a stubborn man. That's every family's founding."`,
              fx: {wil:2,honor:3,int:.5},
            },
            lose: {
              r: "{Head} takes the letters and burns them in front of you, and does not speak to you for a year.",
              fx: {happy:-6,wil:1.5},
            },
          },
        ],
      },
      {
        id: "rk_fm_in_unit",
        cond: (p,C)=>dyn(p,C)&&C.soldier(p)&&rk(p)<=4,
        setup: (p,ctx)=>{prepF(p,ctx),prep(p,ctx)},
        title: "The heir in the ranks",
        text: "Everyone in {unit} knows you are of {fam}. The sergeants are careful with you. The dry billet appears without your asking. The men are polite to your face, and you can guess what they say behind it.",
        choices: [
          {
            t: "Refuse every favor, loudly",
            r: "You take the wet billet, the night watch and the latrine digging. After a season, the men start calling you by your name instead of your family's.",
            fx: {merit:5,rel:{who:"comrade",op:8,all:!0},wil:1.5},
          },
          {
            t: "Accept the favors. It is your birthright.",
            r: "You sleep dry and eat well. The men keep their distance, and when the arrows come, you notice they are not standing very close to you.",
            fx: {health:3,happy:3,rel:{who:"comrade",op:-6,all:!0}},
          },
          {
            t: "Use the name to help the men",
            check: {s:"persuasion",s2:"etiquette",d:45},
            win: {
              r: "A word from a {fsur} gets the company new boots and its back pay. The men decide your family is good for something.",
              fx: {merit:6,rel:{who:"comrade",op:8,all:!0},fame:1},
            },
            lose: {r:"The quartermaster has never heard of {fam}. You look foolish.",fx:{happy:-3}},
          },
        ],
      },
      {
        id: "rk_fm_name_elsewhere",
        cond: (p,C)=>dyn(p,C)&&C.soldier(p)&&rk(p)>=1&&rk(p)<=6,
        setup: (p,ctx)=>{prepF(p,ctx),ctx.oc=nm(p)},
        title: "Your father's enemy",
        text: `Your new superior, {oc}, served with your father years ago, and they hated each other. Today, in front of the other officers, he says, "Another {fsur}. Let's see if this one can follow an order."`,
        choices: [
          {
            t: "Prove him wrong by doing everything right",
            check: {s:"command",s2:"wil",d:55},
            win: {
              r: `A season of perfect service. At the end of it {oc} says, grudgingly, "You're not your father." You decide to take it as praise.`,
              fx: {merit:12,wil:1.5},
            },
            lose: {r:"He finds fault with everything you do. It is a long, hard season.",fx:{merit:-4,wil:2,happy:-5}},
          },
          {
            t: "Ask him what happened between them",
            check: {s:"diplomacy",s2:"int",d:50},
            win: {
              r: 'Over a jug, the story comes out: a woman, a duel, an old wound. By the end he is laughing. "Your father was a bastard. So was I."',
              fx: {merit:6,newRel:{type:"mentor",op:30}},
            },
            lose: {r:'"None of your business, {fsur}." That door is shut.',fx:{happy:-2}},
          },
          {
            t: "Write to the family for a transfer",
            r: "The family arranges it within a month. {oc} smiles as you leave, and you know he will tell the story his way.",
            fx: {merit:-2,honor:-1},
          },
        ],
      },
      {
        id: "rk_fm_inherit",
        cond: (p,C)=>dyn(p,C)&&!C.famHead(p)&&C.soldier(p)&&rk(p)>=1&&!C.flag(p,"rk_fm_office"),
        once: !0,
        w: .7,
        setup: prepF,
        title: "The office passes",
        text: "{Head} sends for you. The holder of the family's office, {office}, is too old or too broken to hold it, and the family has chosen you to take it up. With the office comes {funitLong}, and every eye in the march.",
        choices: [
          {
            t: "Take up the office",
            r: "You kneel in the hall at {seat} and are handed the old sword and the order-book. The office is yours. So is the weight of it.",
            fx: (p,ctx)=>{if(A.applyFx(p,{fame:4,honor:3,wil:1,flag:"rk_fm_office",deed:"took up the family office: "+(ctx.office||"the family command")},ctx),p.mil){const m=fmil(p),r=m&&typeof m.rank=="number"?Math.min(6,p.mil.rank+2,Math.max(p.mil.rank,m.rank)):p.mil.rank;r>p.mil.rank&&(p.mil.rank=r,p.mil.merit=Math.max(p.mil.merit,GD.MIL[r].merit)),p.mil.unit=unitShort(p)}return""},
          },
          {
            t: "Ask that it go to {cousin} instead",
            r: "{cousin} takes it, astonished and grateful. The family thinks you a fool. {cousin} never forgets.",
            fx: {honor:2,newRel:{type:"friend",op:50},flag:"rk_fm_office"},
          },
          {
            t: "Ask for a year to prove yourself first",
            check: {s:"wil",s2:"command",d:50},
            win: {r:"The family agrees. In a year you have earned it, and everyone knows it.",fx:{merit:15,honor:2}},
            lose: {r:"The family does not wait. The office goes to {cousin}.",fx:{flag:"rk_fm_office",happy:-4}},
          },
        ],
      },
      {
        id: "rk_fm_hopeless",
        cond: (p,C)=>dyn(p,C)&&C.soldier(p)&&C.flag(p,"rk_fm_office")&&war(p),
        setup: (p,ctx)=>{prepF(p,ctx),prep(p,ctx)},
        title: "The family's men",
        text: "The marshal's order: {funit} is to hold the ford for a day while the army withdraws. Every man in it comes from your family's villages. You know their mothers. A day at that ford means most of them will not come home.",
        choices: [
          {
            t: "Hold the ford",
            check: {s:"tactics",s2:"command",d:60},
            win: {
              r: "You hold it a day and a night with stakes and water and every trick the family ever learned. Two thirds come home. The ford gets a new song.",
              fx: {merit:30,fame:5,wil:2,deed:"held the ford with the family's own men"},
            },
            lose: {
              r: "You hold it. You bring back a third of them. You visit every mother yourself.",
              fx: {merit:20,wil:4,happy:-15,fame:2},
            },
          },
          {
            t: "Hold it half a day, then withdraw",
            r: "Half a day is enough for most of the army. The marshal is angry. The villages are not.",
            fx: {merit:-10,honor:2,rel:{who:"comrade",op:8,all:!0}},
          },
          {
            t: "Ask the marshal for a different post",
            check: {s:"persuasion",s2:"etiquette",d:55},
            win: {
              r: "The marshal sends a hired company instead. Your family's villages never learn how close it was.",
              fx: {merit:-3},
            },
            lose: {r:'"Your family has held fords before, I believe." The order stands.',fx:{merit:-5,wil:1}},
          },
        ],
      },
      {
        id: "rk_fm_cousin_deserts",
        cond: (p,C)=>dyn(p,C)&&C.soldier(p)&&rk(p)>=2,
        once: !0,
        setup: prepF,
        title: "Bring him back",
        text: "Your cousin {cousin} has deserted from {funit}. Because you are family, the captain sends you to bring {cousin} back, and everyone knows what happens after that.",
        choices: [
          {
            t: "Find {cousin} and bring {cousin} back",
            check: {s:"tracking",s2:"persuasion",d:50},
            win: {
              r: "You find {cousin} at an inn two days away and talk {cousin} into coming back. You stand beside {cousin} at the court and speak for {cousin}. A flogging, not the rope.",
              fx: {merit:8,honor:3,wil:1.5},
            },
            lose: {
              r: "You find {cousin}. {cousin} will not come. You bring {cousin} back in irons, and {cousin} hangs.",
              fx: {merit:5,wil:3,happy:-12},
            },
          },
          {
            t: "Find {cousin} and let {cousin} go",
            check: {s:"deception",s2:"tracking",d:50},
            win: {
              r: "You find {cousin}, give {cousin} your purse, and report the trail went cold.",
              fx: {coin:-10,honor:-2,newRel:{type:"friend",op:40}},
            },
            lose: {
              r: "Someone saw you together. The captain does not believe the trail went cold.",
              fx: {merit:-15,honor:-2},
            },
          },
          {
            t: "Refuse to hunt your own blood",
            r: "You refuse. The captain sends someone else and writes your name in his book.",
            fx: {merit:-8,honor:2},
          },
        ],
      },
      {
        id: "rk_fm_sword_breaks",
        cond: (p,C)=>dyn(p,C)&&C.soldier(p)&&C.flag(p,"rk_fm_sword")&&war(p),
        once: !0,
        setup: prepF,
        title: "The old sword",
        text: "You carried the founder's sword from the hearth at {seat} into your first real fight. Today, against a {foe} mace, it broke a hand's width above the guard. You stand in the mud holding a hilt and a hundred years.",
        choices: [
          {
            t: "Have it reforged around the old steel",
            r: "A smith folds the broken blade into a new one. It is the same sword, and it is not. It is yours now, not the founder's.",
            fx: {coin:-20,wil:1,honor:2,unflag:"rk_fm_sword"},
          },
          {
            t: "Take it home and hang it back up, broken",
            r: "It hangs broken above the hearth. The family says it is the most honest thing in the house.",
            fx: {wil:1.5,unflag:"rk_fm_sword"},
          },
          {
            t: "Bury it with the men who died that day",
            r: "You lay it in the pit with them. Your family will be angry. The dead deserve it more.",
            fx: {piety:4,honor:4,rel:{who:"father",op:-8},unflag:"rk_fm_sword"},
          },
        ],
      },
      {
        id: "rk_fm_banner",
        cond: (p,C)=>dyn(p,C)&&C.soldier(p)&&war(p),
        once: !0,
        w: .6,
        setup: prepF,
        title: "The family banner",
        text: "In the rout yesterday, {funit} lost its banner: the family colors, carried in every fight since {since}. Now it flies over the {foe} camp across the valley, upside down, and their soldiers jeer at it every morning.",
        choices: [
          {
            t: "Take it back by night",
            check: {s:"stealth",s2:"ins",d:60},
            win: {
              r: "You come back at dawn with the banner wrapped round your chest under your coat. The whole army cheers you along the lines.",
              fx: {merit:20,fame:5,deed:"took back the family banner from the enemy camp",epithet:"the Banner-Thief"},
            },
            lose: {
              r: "They were waiting.",
              fx: {
                duel: {
                  tier: 3,
                  title: "the banner guard",
                  opts: {kind:"duel",place:"the enemy camp",light:"night",title:"For the banner"},
                },
              },
            },
          },
          {
            t: "Win it back in the next battle",
            r: "You swear it before the family's men. At the next fight, they follow you straight at the enemy's center.",
            fx: {merit:10,wil:2,honor:3},
          },
          {
            t: "Have a new one sewn",
            r: "A new banner. It is not the same, and every old soldier of the family knows it.",
            fx: {honor:-3,happy:-4},
          },
        ],
      },
      {
        id: "rk_fm_succession",
        cond: (p,C)=>dyn(p,C)&&C.adult(p)&&(C.soldier(p)||!!p.veteran),
        once: !0,
        w: .6,
        setup: prepF,
        title: "Two branches",
        text: "The family's office has fallen vacant, and two branches of {fam} claim it: yours, and your cousin {cousin}'s. The liege will confirm one. The men of {funit} are already taking sides in the alehouses.",
        choices: [
          {
            t: "Press your claim before the liege",
            check: {s:"persuasion",s2:"etiquette",d:55},
            win: {
              r: "The liege confirms your branch. {cousin} bows stiffly. The office is your family's again.",
              fx: {fame:3,honor:2,flag:"rk_fm_office",newRel:{type:"rival",op:-30}},
            },
            lose: {r:"The liege chooses {cousin}. Your branch will wait a generation.",fx:{happy:-6,wil:2}},
          },
          {
            t: "Settle it between you, as soldiers",
            r: "You meet {cousin} with practice blades in the old yard where you both learned.",
            fx: {
              duel: {
                tier: 2,
                title: "your cousin",
                opts: {kind:"brawl",lethal:!1,toYield:!0,place:"the old yard",title:"For the office"},
              },
            },
          },
          {
            t: "Step aside for the good of the family",
            r: "You step aside. {cousin} holds the office. The family stays whole, and that was what mattered.",
            fx: {honor:4,newRel:{type:"friend",op:30}},
          },
        ],
      },
      {
        id: "rk_fm_child_roll",
        cond: (p,C)=>dyn(p,C)&&!C.famHead(p)&&C.adult(p)&&C.hasKids(p)&&C.age(p)>=30,
        setup: (p,ctx)=>{prepF(p,ctx);const k=A.relsOf(p,["child"]).filter(x=>x.p.alive)[0];ctx.kid=k?k.p.given:nm(p)},
        title: "The next name on the roll",
        text: "{Head} writes: it is time {kid}'s name went on the roll of {funit}. Every {fsur} serves. You remember the day it was your name.",
        choices: [
          {
            t: "Put {kid}'s name down, with pride",
            r: "You take {kid} to the muster yourself and introduce {kid} to the sergeants. Then you ride home very slowly.",
            fx: {honor:2,rel:{who:"child",op:6},happy:-2},
          },
          {
            t: "Let {kid} decide",
            r: "You ask {kid}. {kid} has an answer ready; children always do. Whatever it is, you stand by it, and the family grumbles.",
            fx: {rel:{who:"child",op:12},wil:1},
          },
          {
            t: "Refuse. {kid} will have another life.",
            check: {s:"wil",s2:"persuasion",d:50},
            win: {
              r: "You stand up to the whole family. {kid} goes to the scholars instead. The family will get over it, in a generation or two.",
              fx: {wil:2,rel:{who:"child",op:8}},
            },
            lose: {r:"The family is too strong. {kid}'s name goes on the roll anyway.",fx:{wil:1.5,happy:-5}},
          },
        ],
      },
      {
        id: "rk_fm_liege_call",
        cond: (p,C)=>dyn(p,C)&&C.adult(p)&&C.atWar(p)&&!C.old(p),
        setup: prepF,
        title: "The liege calls",
        text: "The war has come, and {lg} has called on {fam} to bring {funit} to the muster. The family owes the service by old oath. It falls to you to see it done: men, horses, carts and the family's honor, all at once.",
        choices: [
          {
            t: "Raise the full muster, on time",
            check: {s:"logistics",s2:"command",d:50},
            win: {
              r: "Every man, every horse, every cart, at the muster field on the appointed day. {Lg} notes it. So does the whole march.",
              fx: {fame:3,honor:3,skill:{logistics:3},favor:2},
            },
            lose: {
              r: "A third of the men are late and half the carts are broken. {Lg} notes that too.",
              fx: {fame:-1,happy:-4},
            },
          },
          {
            t: "Pay for hired men to fill the gaps (80 suns)",
            req: p=>p.coin>=80,
            r: "Eighty suns of hired crossbows fill the gaps. The muster is full. The family's old soldiers sneer at the hirelings.",
            fx: {coin:-80,honor:1,fame:1},
          },
          {
            t: "Send the bare minimum",
            r: "The minimum the oath requires, and no more. Lawful, and remembered.",
            fx: {honor:-3},
          },
        ],
      },
    ]);
  })();
})();
