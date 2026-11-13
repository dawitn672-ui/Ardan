// The release's event pack 15 of 30 (193 events, mostly lf_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-027). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const C = A.C,
      EV = [],
      add = list=>{for(const e of list)EV.push(e)},
      live = (p,types)=>A.relsOf(p,types).filter(x=>x.p&&x.p.alive),
      relP = (p,types)=>{const l=live(p,types);return l.length?A.pick(l).p:null},
      spouseOf = p=>{const s=p&&p.spouse?A.P(p.spouse):null;return s&&s.alive?s:null},
      kidsOf = (p,lo,hi)=>(p.children||[]).map(A.P).filter(c=>c&&c.alive&&(lo==null||C.ageAdj(c)>=lo)&&(hi==null||C.ageAdj(c)<hi)),
      hasKid = (p,lo,hi)=>(p.children||[]).some(id=>{const c=A.P(id);if(!c||!c.alive)return!1;const a=C.ageAdj(c);return(lo==null||a>=lo)&&(hi==null||a<hi)}),
      kid = (p,lo,hi)=>{const l=kidsOf(p,lo,hi);return l.length?A.pick(l):null},
      T = ctx=>ctx&&ctx.pid?A.P(ctx.pid):null,
      opOf = (p,t)=>t&&p.rel[t.id]?p.rel[t.id].op:0,
      words = (ctx,x)=>{if(!x)return;const m=x.sex==="M";ctx.sd=m?"son":"daughter",ctx.bs=m?"brother":"sister",ctx.hw=m?"husband":"wife",ctx.mf=m?"man":"woman",ctx.bg=m?"boy":"girl",ctx.mfa=m?"father":"mother",ctx.lw=m?"lord":"lady"},
      mk = (p,o)=>{o=o||{};const race=o.race||p.race,R2=GD.RACES[race]||GD.RACES.human,sex=o.sex||(A.chance(.5)?"M":"F"),cult=race===p.race?p.cult:A.cultureFor(race,p.realm)||p.cult,faith=o.faith||(race===p.race?p.faith:A.faithFor(race,p.realm)||p.faith),adj=o.ageAdj!=null?o.ageAdj:C.ageAdj(p)+A.ri(-4,4),age=Math.max(o.minAge!=null?o.minAge:1,Math.round(adj*R2.adult/16)),status=o.status||p.status,x=A.newPerson({given:A.givenName(cult,sex),sex,race,realm:p.realm,cult,faith,born:A.S.year-age,status,home:p.home}),fn=A.familyName({cult,realm:p.realm,status,home:p.home,sex});return x.sur=fn.sur,x.surMode=fn.mode,x.occ=o.occ||(A.isAdult(x)?A.pick(A.OCC[status]||A.OCC.peasant):"a child of "+A.provName(p.home)),x},
      setPid = (p,ctx,t)=>{const x=t||mk(p);return ctx.pid=x.id,words(ctx,x),x},
      linkNew = (p,x,type,op,back)=>(x&&!p.rel[x.id]&&A.link(p,x,type,op??20,back||type),x),
      known = (p,types,type,op,o)=>relP(p,types)||linkNew(p,mk(p,o),type,op),
      bump = (p,t,op,type,back)=>{if(t){if(!p.rel[t.id]){A.link(p,t,type||"acquaint",op||0,back||type||"acquaint");return}op&&A.addOp(p,t,op),type&&(p.rel[t.id].type=type,t.rel[p.id]&&(t.rel[p.id].type=back||type))}},
      loveSex = p=>p.flags.likes||(p.sex==="M"?"F":"M"),
      recentDead = (p,types,yrs)=>A.relsOf(p,types).some(x=>x.p&&!x.p.alive&&x.p.died!=null&&A.S.year-x.p.died<=(yrs||1)),
      deadOf = (p,types,yrs)=>{const l=A.relsOf(p,types).filter(x=>x.p&&!x.p.alive&&x.p.died!=null&&A.S.year-x.p.died<=(yrs||1));return l.length?A.pick(l).p:null},
      relWord = (p,x)=>x&&p.rel[x.id]?A.relLabel(x,p.rel[x.id]).toLowerCase():"kin",
      slave = p=>p.flags.unfree?p.flags.unfree==="slave":p.status==="slave",
      serf = p=>p.flags.unfree?p.flags.unfree==="serf":p.status==="serf",
      unfree = p=>!!p.flags.unfree||p.status==="slave"||p.status==="serf",
      free = p=>!unfree(p),
      low = p=>["slave","serf","peasant"].includes(p.status),
      middling = p=>["artisan","merchant"].includes(p.status),
      high = p=>["gentry","noble","royal"].includes(p.status),
      frac = p=>{const R=GD.RACES[p.race];return(A.age(p)-R.adult)/Math.max(1,R.old-R.adult)},
      youngA = p=>C.adult(p)&&frac(p)<.3,
      prime = p=>C.adult(p)&&!C.old(p),
      midA = p=>C.adult(p)&&!C.old(p)&&frac(p)>=.45,
      purse = p=>({slave:1,serf:1,peasant:2,artisan:3,merchant:6,gentry:12,noble:40,royal:100})[p.status]||2,
      pay = (p,n)=>{const v=Math.min(p.coin,Math.max(0,Math.round(n)));return p.coin-=v,v},
      hp = (p,v)=>{p.happy=A.clamp(p.happy+v,0,100)},
      hon = (p,v)=>{p.honor=A.clamp(p.honor+v,0,100)},
      pie = (p,v)=>{p.piety=A.clamp(p.piety+v,0,100)},
      hurt = (p,v,cause)=>{p.health=A.clamp(p.health-v,0,A.maxHealth(p)),p.lastHurt=cause||p.lastHurt||"an injury"},
      addDebt = (p,n)=>{p.debt=Math.max(0,Math.round((p.debt||0)+n))},
      setFree = (p,how)=>(delete p.flags.unfree,(p.status==="slave"||p.status==="serf")&&(p.status="peasant"),how&&(p.flags[how]=A.S.year),A.ach("freed"),A.willGrow(p,2.5,"freedom"),hp(p,20),"(You are free.)"),
      law = p=>A.lawOf(p.realm),
      coins = p=>{const r=LORE.realms[p.realm],n=r&&r.coin&&r.coin.coin;return!n||/none|any|horses|reference|^sun$/.test(n)?"suns":/silver$|weight$/.test(n)?n:/(sh|ch|s)$/.test(n)?n+"es":n+"s"},
      clergy = p=>({"REL-01":"dawnkeeper","REL-02":"priest","REL-03":"hall-priest","REL-04":"Grove Keeper","REL-05":"Law-Carver","REL-06":"lama","REL-07":"Well-Keeper","REL-08":"flood-priest","REL-09":"Rememberer","REL-10":"temple priest","REL-11":"shaman","REL-12":"Mother","REL-14":"shaman","REL-19":"quartermaster"})[p.faith]||"priest",
      fname = p=>(A.faith(p.faith)||{}).name||"the old gods",
      DRINK = {
        "POL-01": "ale",
        "POL-05": "cider",
        "POL-08": "mead",
        "POL-13": "herb spirits",
        "POL-14": "ale",
        "POL-09": "ale",
        "POL-23": "ale",
        "POL-02": "watered wine",
        "POL-03": "wine",
        "POL-04": "wine",
        "POL-15": "wine",
        "POL-16": "wine",
        "POL-31": "sour wine",
        "POL-25": "mead",
        "POL-26": "rye beer",
        "POL-18": "barley beer",
        "POL-20": "honey wine",
        "POL-21": "palm wine",
        "POL-22": "honey wine",
        "POL-30": "palm toddy",
        "POL-06": "honey drink",
        "POL-07": "honey drink",
        "POL-10": "dark beer",
        "POL-28": "dark beer",
        "POL-29": "dark beer",
        "POL-11": "fermented mare's milk",
        "POL-12": "fermented mare's milk",
        "POL-34": "fermented mare's milk",
        "POL-33": "stolen wine",
      },
      drink = p=>DRINK[p.realm]||"ale",
      dry = p=>["POL-17","POL-19","POL-24","POL-32","POL-27"].includes(p.realm),
      food = p=>({north:"rye bread and herring",sun:"bread, olives and sheep cheese",east:"buckwheat porridge and smoked fish",well:"dates and barley bread",deep:"barley bread and cave mushrooms",orc:"meat and milk",elf:"nuts, honey and smoked fish",pirate:"salt fish and ship's biscuit"})[law(p)]||{"POL-18":"bread, onions and dried perch","POL-20":"sorghum porridge and sour milk","POL-21":"peppered rice and fish","POL-22":"flatbread and spiced stew","POL-30":"rice and lentils","POL-27":"barley flour and butter","POL-12":"mutton and curd"}[p.realm]||"bread and broth",
      home = p=>p.race==="elf"?"grove-house":p.race==="dwarf"?"family rooms off the clan gallery":p.race==="giant"?"hall":["POL-11","POL-12","POL-34","POL-19"].includes(p.realm)?"tent":(C.town(p),"house"),
      healer = p=>p.race==="dwarf"?"the clan bone-setter":p.race==="elf"?"an elven healer":["POL-11","POL-12","POL-34"].includes(p.realm)?"the clan healer":law(p)==="well"?"a well-house healer":"the herbwife",
      lender = p=>p.realm==="POL-16"?"a black-cap banker's clerk":p.realm==="POL-04"?"a canal-side moneylender":law(p)==="well"?'a lender who calls his interest "fees", since the Book forbids interest':law(p)==="deep"?"a clan factor with a weigh-book":law(p)==="orc"?"a rich herd-mother":"a moneylender",
      judge = p=>({sun:"the lord's court, which sits at noon because lying at noon is a sin",north:"the Thing, where a man of good name clears himself with twelve oath-helpers on the iron ring",east:"the lord's court, with a priest present",well:"the Well-Keeper, who hears two washed witnesses beside the well",deep:"the Law-Carvers, who trust the weigh-book over any spoken word",orc:"the clan-mothers at the fire",elf:"the grove elders of the Moot",pirate:"the crew, by show of hands"})[law(p)]||"the local court",
      judgeShort = p=>({sun:"the lord's court",north:"the Thing",east:"the lord's court",well:"the Well-Keeper",deep:"the Law-Carvers",orc:"the clan-mothers",elf:"the grove elders",pirate:"the crew"})[law(p)]||"the court",
      rite = p=>({"REL-01":"buried at dawn facing east, so the soul rises into the sun at the next noon","REL-02":"washed, dressed in white linen and buried facing east before the third sunrise, with honey porridge eaten at the grave","REL-03":"laid in the hall-yard, and the family brews a grave-ale so the village can drink to the name","REL-04":"buried under a sapling, whose growth will carry the life of the dead","REL-05":"laid in the rock vault with their tools, to join the Ancestors' Hall","REL-06":"carried to the high platform for the vultures, with butter lamps lit for a good rebirth","REL-07":"washed, wrapped in linen and buried within the day facing the Well of Samar","REL-08":"dried in natron for forty days and wrapped in linen for the voyage down the Night River","REL-09":"buried under the floor of the house, so the dead stay near while their name is spoken","REL-10":"burned on the river bank, and the ashes given to the river","REL-11":"laid on a high platform on the hill, and painted into the clan's winter-count","REL-12":"given to the sea, to go down under the ice to the Mother","REL-14":"burned, so the dead ride into the sky on the smoke","REL-19":"sewn into sailcloth with a stone and a gold earring for the Drowned Queen, and sunk"})[p.faith]||"buried with the old words said over them",
      festOf = p=>{const f=A.faith(p.faith),l=f&&f.festivals?String(f.festivals).split(";").map(s=>s.replace(/\(.*$/,"").trim()).filter(s=>s&&s.length<40):[];return l.length?A.pick(l):A.pick(GD.FESTIVALS)[0]},
      saying = (p,fallback)=>{const l=(LORE.sayings||[]).filter(s=>s&&s[0]&&s[1]&&/^"/.test(s[0])&&new RegExp(A.culture(p.cult)?A.culture(p.cult).name.split(" ")[0]:"zzz","i").test(s[1]));return l.length?A.pick(l)[0]:fallback||'"Hold fast."'},
      court = p=>p.race==="dwarf"?"Among the holds, courting is clan business: a contract proposed, metal weighed, two names to be poured into one bar.":p.race==="elf"?"Elves court for decades: a seed given, a song without words, a great deal of patience.":p.race==="giant"?"Giant matches are fixed at the Thing between the halls, but a giant may still make eyes across the fire-pit.":["CUL-22","CUL-23"].includes(p.cult)?"The clan-mothers arrange most matches at the fire. A youngster who wants a say had better bring a horse.":["CUL-04","CUL-05","CUL-07"].includes(p.cult)?"In the Well lands a match goes through the families: a go-between, a visit, water offered and accepted.":p.cult==="CUL-01"?"Solen courting is done in public: a walk after the Sunday rite with a mother three steps behind.":p.cult==="CUL-03"?"Wind Riders court on horseback, racing across the grass, and a rider caught is a rider kissed.":p.cult==="CUL-02"?"In the north a suitor brings a gift to the family hearth and drinks with the household until someone says yes.":p.cult==="CUL-11"?"Eastfolk court over honey cakes after the Sunday rite, under the eyes of every aunt in the parish.":"Courting here is done the old way: gifts, family visits and a great deal of gossip.";
    add([
      {
        id: "lf_court_custom",
        cond: p=>C.adult(p)&&!C.married(p)&&!C.old(p)&&!slave(p),
        cool: 6,
        title: "Courting, the proper way",
        setup: (p,ctx)=>{setPid(p,ctx,A.makeLoveInterest(p)),ctx.custom=court(p)},
        text: "{custom} You have your eye on {themFull}, {themOcc}. So far you have managed one nod and half a smile.",
        choices: [
          {
            t: "Do it by custom, with every step observed",
            check: {s:"etiquette",s2:"wil",d:35},
            win: {
              r: "Every aunt approves. {them} watches you go through it all with a straight face, then laughs with you afterwards.",
              fx: {them:{type:"lover",op:30,back:"lover"},honor:2,happy:6},
            },
            lose: {
              r: "You get one step wrong, loudly, in front of everybody. The story will outlive you both. {them} is kind about it.",
              fx: {them:{type:"friend",op:10,back:"friend"},happy:-3,wil:.4},
            },
          },
          {
            t: "Skip the custom and speak to {themHim} straight",
            check: {s:"persuasion",s2:"int",d:40,bonus:p=>p.looks/5-10},
            win: {
              r: "{them} likes plain speaking. You meet again, and again, and stop counting.",
              fx: {them:{type:"lover",op:35,back:"lover"},happy:7},
            },
            lose: {
              r: "{them} is startled and a little offended. Word reaches {theirHis} family before you reach home.",
              fx: {them:{type:"acquaint",op:-5},honor:-2,happy:-3},
            },
          },
          {
            t: "Send a gift through a go-between (2 suns)",
            req: p=>p.coin>=2,
            r: "The go-between earns her fee. {them} keeps the gift, and sends back word that you may call.",
            fx: {coin:-2,them:{type:"friend",op:20,back:"friend"},skill:{etiquette:1}},
          },
        ],
      },
      {
        id: "lf_love_status",
        cond: p=>C.adult(p)&&!C.married(p)&&!C.old(p)&&!p.ruler,
        w: .8,
        cool: 10,
        title: "Above, or below",
        setup: (p,ctx)=>{const up=!high(p),x=setPid(p,ctx,A.makeLoveInterest(p));x.status=up?low(p)?"artisan":"gentry":A.pick(["peasant","serf"]),x.occ=A.pick(A.OCC[x.status]||A.OCC.peasant),ctx.dir=up?"far above you":"far below you",ctx.gap=up?"{them}'s family would sooner see {themHim} dead than married to you":"your family would sooner see you in the river than married to {themHim}"},
        text: "{themFull}, {themOcc}, is {dir}. Everyone knows it, the two of you best of all. {gap}. And still {them} keeps finding reasons to pass your way.",
        choices: [
          {
            t: "Love {themHim} in secret",
            check: {s:"stealth",s2:"intrigue",d:40},
            win: {
              r: "Stolen hours by the river and a code of knocks. Nobody knows. It is the happiest year of your life.",
              fx: {them:{type:"lover",op:40,back:"lover"},happy:12,flag:"lf_secret_love"},
            },
            lose: {
              r: "A servant sees. Within a week the whole district knows, and {them} is sent away to relatives in {town}.",
              fx: {them:{type:"lover",op:25,back:"lover"},honor:-5,happy:-8,wil:1},
            },
          },
          {
            t: "Ask the families openly",
            check: {s:"diplomacy",s2:"persuasion",d:55},
            win: {
              r: "It takes a winter of talk, a pile of gifts and one furious grandmother. But they agree.",
              fx: {them:{type:"betrothed",op:40,back:"betrothed"},happy:10,fame:2},
            },
            lose: {
              r: "The answer is no, delivered with a door. {them} weeps at the window.",
              fx: {them:{type:"friend",op:15,back:"friend"},happy:-10,wil:1.5},
            },
          },
          {
            t: "End it before it starts",
            r: "You stop taking the road past {theirHis} door. It is the sensible thing. Sensible things can hurt.",
            fx: {wil:1,happy:-5},
          },
        ],
      },
      {
        id: "lf_rival_suitor_lies",
        cond: p=>C.adult(p)&&!C.old(p)&&(C.hasRel(p,"lover","betrothed")||!C.married(p)&&youngA(p)),
        cool: 8,
        title: "Whispers about you",
        setup: (p,ctx)=>{setPid(p,ctx,relP(p,["lover","betrothed"])||linkNew(p,A.makeLoveInterest(p),"lover",30));const rv=mk(p,{sex:p.sex,ageAdj:C.ageAdj(p)+A.ri(-3,4)});ctx.rvid=rv.id,ctx.rv=rv.given,ctx.lie=A.pick(["you owe money in three towns","you have a sweetheart in {town}","your grandfather died mad","you were flogged for theft as a youth","you drink in the mornings"])},
        text: "{rv} wants {them} for a sweetheart, and has been telling anyone who will listen that {lie}. {them} has heard. {them} has not asked you about it, which is worse.",
        choices: [
          {
            t: "Find out who started it and shame {rv} in public",
            check: {s:"intrigue",s2:"persuasion",d:43},
            win: {
              r: "You trace the tale back to {rv} through three gossips and lay it out at the well. {rv} slinks off. {them} laughs with relief.",
              fx: (p,ctx)=>{const rv=A.P(ctx.rvid);rv&&A.link(p,rv,"rival",-40,"rival"),bump(p,T(ctx),12),hon(p,3)},
            },
            lose: {
              r: "You cannot prove it, and now it looks as if you protest too much.",
              fx: (p,ctx)=>{const rv=A.P(ctx.rvid);rv&&A.link(p,rv,"rival",-30,"rival"),bump(p,T(ctx),-8),hon(p,-2)},
            },
          },
          {
            t: "Tell {them} the plain truth and let {themHim} judge",
            check: {s:"persuasion",s2:"wil",d:35},
            win: {
              r: '{them} believes you. "I wanted to hear it from you." The lie dies of neglect.',
              fx: {them:{op:15},happy:5},
            },
            lose: {
              r: "{them} says {theyHe} believes you. A small doubt stays in {theirHis} eyes for a long time.",
              fx: {them:{op:-6},happy:-3},
            },
          },
          {
            t: "Catch {rv} alone on the road home",
            r: "Words first, then fists. Nobody else is there to see.",
            fx: (p,ctx)=>{const rv=A.P(ctx.rvid);return rv&&A.link(p,rv,"enemy",-50,"enemy"),A.startDuelFront(p,rv||A.makeFoe({tier:2,realm:p.realm}),{kind:"brawl",place:"the road home",lethal:!1,toYield:!0,title:"A liar on the road"}),""},
          },
        ],
      },
      {
        id: "lf_betrothal_broken",
        cond: p=>C.adult(p)&&!C.married(p)&&(C.hasRel(p,"betrothed")||!low(p)&&!C.old(p)&&A.chance(.4)),
        w: .7,
        cool: 12,
        title: "The match is off",
        setup: (p,ctx)=>{const b=relP(p,["betrothed"])||linkNew(p,A.makeLoveInterest(p),"betrothed",10);setPid(p,ctx,b),ctx.why=A.pick(["a richer offer came from {town}","your family's debts became known","{theirHis} father has quarrelled with yours over a boundary","a priest found the two of you are too near in blood","a cousin of {theirHis} is now heir to a mill, and that changes everything"])},
        text: "A letter, a messenger and an embarrassed uncle: the betrothal between you and {themFull} is broken. The reason given is that {why}. The gifts are sent back in a cart for the whole street to see.",
        choices: [
          {
            t: "Demand compensation for the insult",
            check: {s:"intimidation",s2:"diplomacy",d:43},
            win: {
              r: "They pay to keep it quiet, with an apology in front of witnesses.",
              fx: (p,ctx)=>{const v=6*purse(p);return p.coin+=v,bump(p,T(ctx),-20,"ex","ex"),hon(p,3),`(+${v} suns)`},
            },
            lose: {
              r: "They laugh at you. Now you are the jilted one and the grasping one.",
              fx: (p,ctx)=>{bump(p,T(ctx),-25,"ex","ex"),hon(p,-4),hp(p,-6)},
            },
          },
          {
            t: "Go to {them} yourself and ask if {theyHe} wanted this",
            check: {s:"persuasion",s2:"wil",d:37},
            win: {
              r: "{them} did not. You both agree to wait, and to wear the families down.",
              fx: (p,ctx)=>{bump(p,T(ctx),20,"lover","lover"),hp(p,4),A.willGrow(p,.8,"love")},
            },
            lose: {
              r: '{them} will not meet your eye. "It is better this way." It is not, but it is over.',
              fx: (p,ctx)=>{bump(p,T(ctx),-10,"ex","ex"),hp(p,-10),A.willGrow(p,1.5,"grief")},
            },
          },
          {
            t: "Shrug it off at the alehouse",
            r: "You drink to your freedom with friends who are kind enough to pretend you mean it.",
            fx: (p,ctx)=>{bump(p,T(ctx),-10,"ex","ex"),hp(p,-3),A.willGrow(p,.8,"pride")},
          },
        ],
      },
      {
        id: "lf_serenade",
        cond: p=>C.adult(p)&&!C.married(p)&&!C.old(p),
        cool: 7,
        title: "Music under the window",
        setup: (p,ctx)=>{setPid(p,ctx,A.makeLoveInterest(p)),ctx.inst=A.pick(["a fiddle","a lute with one bad string","a reed flute","a frame drum","nothing but a cracked voice"])},
        text: "Someone is singing under your window with {inst}. You lean out: it is {themFull}, {themOcc}, red to the ears, halfway through a love song. The neighbors are leaning out too.",
        choices: [
          {
            t: "Come down and sing the next verse with {themHim}",
            check: {s:"music",s2:"wil",d:33},
            win: {
              r: "The street applauds. {them} looks at you as if you had hung the moon.",
              fx: {them:{type:"lover",op:35,back:"lover"},happy:8,fame:1,skill:{music:1}},
            },
            lose: {
              r: "You both sing badly, together, and laugh so hard you have to sit on the step. It counts.",
              fx: {them:{type:"lover",op:25,back:"lover"},happy:6},
            },
          },
          {
            t: "Throw down a flower",
            r: "{them} catches it and nearly drops the instrument. The neighbors cheer.",
            fx: {them:{type:"friend",op:25,back:"friend"},happy:4},
          },
          {
            t: "Throw down a bucket of water",
            r: "{them} goes home wet and wiser. The neighbors talk about it for a month.",
            fx: {them:{type:"rival",op:-20,back:"rival"},happy:2,honor:-1},
          },
        ],
      },
      {
        id: "lf_love_potion",
        cond: p=>C.adult(p)&&!C.married(p)&&!C.old(p)&&!p.race.includes("elf"),
        cool: 10,
        w: .7,
        title: "A love philtre",
        setup: (p,ctx)=>{setPid(p,ctx,A.makeLoveInterest(p)),ctx.price=2+A.ri(0,3)},
        text: 'The old woman at the edge of {home} sells "a philtre to turn any heart", {price} suns a vial. You know exactly whose heart: {themFull}, who has never looked at you twice. The vial smells of honey and cheap wine.',
        choices: [
          {
            t: "Buy it and slip it in {theirHis} cup",
            req: (p,C2,ctx)=>p.coin>=ctx.price,
            r: (p,ctx)=>A.chance(.35)?"{them} drinks, coughs, and then, by pure chance, actually talks to you. You will believe in that philtre forever.":"{them} drinks it, says the wine is off, and goes home. Honey and cheap wine, exactly as it smelled.",
            fx: (p,ctx)=>{pay(p,ctx.price),A.chance(.35)?bump(p,T(ctx),20,"friend","friend"):hp(p,-2)},
          },
          {
            t: "Laugh at her and talk to {them} instead",
            check: {s:"persuasion",s2:"int",d:41,bonus:p=>p.looks/5-10},
            win: {
              r: "No philtre needed. {them} was only waiting to be asked.",
              fx: {them:{type:"lover",op:30,back:"lover"},happy:7},
            },
            lose: {
              r: "{them} is polite, and nothing more. Perhaps you should have bought the philtre. (You should not.)",
              fx: {them:{type:"acquaint",op:5},happy:-3},
            },
          },
          {
            t: "Ask what is really in it",
            check: {s:"medicine",s2:"int",d:30},
            win: {
              r: '"Honey, wine and a pinch of hope," she admits, and gives you a cup for free for being clever.',
              fx: {int:.4,skill:{medicine:1},happy:2},
            },
            lose: {r:"She swears by every god that it works. You leave none the wiser.",fx:{happy:-1}},
          },
        ],
      },
      {
        id: "lf_lovers_caught",
        cond: p=>C.adult(p)&&!C.married(p)&&!C.old(p)&&(C.hasRel(p,"lover")||youngA(p)),
        cool: 7,
        title: "Caught in the hayloft",
        setup: (p,ctx)=>{const l=setPid(p,ctx,relP(p,["lover"])||linkNew(p,A.makeLoveInterest(p),"lover",30));ctx.catcher=A.pick(["{theirHis} father","{theirHis} mother","{theirHis} older brother","the parish priest","a very nosy aunt"]),ctx.where=A.pick(["in the hayloft","behind the mill","in the orchard after dark","by the river at moonrise"])},
        text: "You and {them} are {where}, doing nothing worse than kissing, when {catcher} comes round the corner with a lantern.",
        choices: [
          {
            t: "Stand up and declare your honest intentions",
            check: {s:"persuasion",s2:"etiquette",d:40},
            win: {
              r: "It is a speech. A good one. {catcher} lowers the lantern and says you had better come to supper on Sunday.",
              fx: {them:{type:"betrothed",op:15,back:"betrothed"},honor:2,happy:6},
            },
            lose: {
              r: "The speech does not survive the first shout. You are chased off with the lantern swinging.",
              fx: {them:{op:-5},honor:-3,happy:-4},
            },
          },
          {
            t: "Run for it",
            check: {s:"athletics",s2:"spd",d:30},
            win: {
              r: "Over the fence and gone. {them} tells a long story about a fox. Nobody believes it, but nobody saw your face.",
              fx: {spd:.3,happy:2},
            },
            lose: {
              r: "You catch your shirt on the fence and hang there to be identified.",
              fx: {honor:-4,happy:-5,them:{op:-4}},
            },
          },
          {
            t: "Lie: you were looking for a lost goat",
            check: {s:"deception",s2:"int",d:40},
            win: {
              r: "There is, conveniently, a goat. Nobody quite believes it, but the goat saves everyone's face.",
              fx: {skill:{deception:1},happy:3},
            },
            lose: {
              r: "There is no goat. There has never been a goat. {catcher} will remember the goat forever.",
              fx: {honor:-3,them:{op:-6}},
            },
          },
        ],
      },
      {
        id: "lf_lover_faith",
        cond: p=>C.adult(p)&&C.hasRel(p,"lover","betrothed")&&!C.married(p),
        cool: 10,
        w: .8,
        title: "Two altars",
        setup: (p,ctx)=>{const l=setPid(p,ctx,relP(p,["lover","betrothed"])),other=Object.keys(LORE.faiths).filter(f=>f!==p.faith&&f!=="REL-15");l.faith===p.faith&&(l.faith=A.pick(other)),ctx.mine=fname(p),ctx.theirs=(A.faith(l.faith)||{}).name||"another faith"},
        text: "{them} keeps {theirs}; you keep {mine}. It never mattered by the river. It matters now that the families have started asking where the wedding will be held, and before which god.",
        choices: [
          {
            t: "Take up {theirHis} faith",
            r: "You learn new prayers and new feasts. Your own family takes it hard. {them} weeps with gratitude.",
            fx: (p,ctx)=>{const t=T(ctx);return t&&(p.faith=t.faith),bump(p,t,25),pie(p,-5),A.addOp(p,A.P(p.parents[1])||null,-10),hp(p,3),`(You now keep ${ctx.theirs}.)`},
          },
          {
            t: "Ask {themHim} to take up yours",
            check: {s:"persuasion",s2:"faith",d:45},
            win: {
              r: '{them} agrees, after long nights of talk. "Your gods are welcome to me, if you are."',
              fx: (p,ctx)=>{const t=T(ctx);t&&(t.faith=p.faith),bump(p,t,15),pie(p,3)},
            },
            lose: {r:'"Would you give up yours?" {them} asks. You have no good answer.',fx:{them:{op:-12},happy:-4}},
          },
          {
            t: "Find a priest willing to bless you both",
            check: {s:"faith",s2:"diplomacy",d:47},
            win: {
              r: "An old priest with a soft heart and a deaf ear agrees. Two rites, one marriage, everyone grumbles and attends.",
              fx: {them:{type:"betrothed",op:20,back:"betrothed"},skill:{faith:2},happy:6},
            },
            lose: {
              r: "Every priest you ask turns you away. One reports you to your family.",
              fx: {them:{op:5},piety:-2,happy:-4},
            },
          },
        ],
      },
      {
        id: "lf_lover_to_war",
        cond: p=>C.adult(p)&&C.hasRel(p,"lover","betrothed","spouse")&&C.atWar(p)&&!C.soldier(p),
        cool: 8,
        title: "Called to the levy",
        setup: (p,ctx)=>{const x=relP(p,["lover","betrothed","spouse"]);setPid(p,ctx,x)},
        text: "The levy has called {them} against {enemy}. {theyHe} will march in three days with a spear and a borrowed helmet. Tonight {them} sits by your fire, trying very hard to look brave.",
        choices: [
          {
            t: "Pay for a substitute (30 suns)",
            req: p=>p.coin>=30,
            r: "A landless man takes the coin and the spear. {them} stays. You try not to think of the substitute's mother.",
            fx: {coin:-30,them:{op:25},honor:-1,happy:4},
          },
          {
            t: "Give {themHim} a keepsake and a promise",
            r: "A lock of hair in a twist of cloth. {them} puts it under {theirHis} shirt, against the heart.",
            fx: (p,ctx)=>{bump(p,T(ctx),15),A.willGrow(p,1,"waiting");const t=T(ctx);return t&&A.chance(.12)?(A.kill(t,"war against "+A.realmShort(A.enemyRealmOf(p.realm)||p.realm)),hp(p,-20),A.willGrow(p,2,"grief"),"(Months later the keepsake comes back alone, carried by a man from the same file. "+t.given+" fell in the war.)"):"(Months later, a letter in a stranger's hand: alive, cold, missing you.)"},
          },
          {
            t: "Hide {themHim} in the loft until the levy passes",
            check: {s:"deception",s2:"stealth",d:47},
            win: {
              r: "The reeve's men search the barn and not the loft. {them} owes you everything, and knows it.",
              fx: {them:{op:30},honor:-2,skill:{deception:1}},
            },
            lose: {
              r: "They find {themHim}. {them} is dragged off in the levy anyway, and you are fined for hiding a deserter.",
              fx: {coin:-10,honor:-5,them:{op:10},happy:-8},
            },
          },
        ],
      },
      {
        // [X1 baked patch events/97-first-life-fixes LF-TIER-GATES] Scenes written for a commoner or a private reached the
        // top of the ladder: a queen was told to "Flee to the woods" and "Turn him in for the bounty" (the home-front war
        // scenes), danced at Harvest Home to be married off by the village, and kept a scribe's duties ("it is only a
        // job"); a General of 62 leading 12,800 was asked "You. Name?" by a passing captain; a carpenter of 68 was offered
        // the dead captain's ring and a sellsword's contract. A reigning ruler or a general (A.lfTop, h-words.core.js) no
        // longer draws the home-front, harvest-dance or learned-duty scenes; the rank-and-file camp scenes stop at rank 3;
        // the mercenary scenes stop at 55 (human years) and the road offers at 60. The guards are helpers, not
        // C.ruler/p.mil in the cond text, so A.evAudience classes the scenes as before.
        id: "lf_harvest_dance",
        cond: p=>C.adult(p)&&!C.married(p)&&!C.old(p)&&!slave(p)&&!(A.lfTop&&A.lfTop(p)),
        cool: 5,
        title: "The last dance at Harvest Home",
        // [X1 baked patch core/02-content-fixes EVT-DANCE-NIECE] lf_harvest_dance offered "the reeve's handsome nephew or
        // niece", the setup's word for a partner whose sex it had just chosen (cycle 2, design A2). It now says niece or
        // nephew by the partner's sex.
        setup: (p,ctx)=>{const a=mk(p,{sex:loveSex(p),ageAdj:C.ageAdj(p)+A.ri(-2,3)}),b=mk(p,{sex:loveSex(p),ageAdj:C.ageAdj(p)+A.ri(-2,3)});ctx.a=a.given,ctx.aid=a.id,ctx.ad=A.pick(["the miller's quick-tongued child","a weaver who laughs too loud","a shy herder with good hands"]),ctx.b=b.given,ctx.bid=b.id,ctx.bd=A.pick([b.sex==="F"?"the reeve's handsome niece":"the reeve's handsome nephew","a carter just back from {town}","someone you have known since you were six"]),ctx.pid=a.id,words(ctx,a)},
        text: "The last dance at Harvest Home is the one that counts: whoever you dance it with, the village will marry you to by spring. Two people are drifting your way: {a}, {ad}, and {b}, {bd}.",
        choices: [
          {
            t: "Dance with {a}",
            r: "{a} dances like {theyHe} talks: fast and a bit off the beat. The whole green is grinning at you.",
            fx: (p,ctx)=>{const a=A.P(ctx.aid);a&&A.link(p,a,"lover",30,"lover"),hp(p,6)},
          },
          {
            t: "Dance with {b}",
            r: "{b} holds you as if you might break. Old friends become something else by the second turn.",
            fx: (p,ctx)=>{const b=A.P(ctx.bid);b&&A.link(p,b,"lover",30,"lover"),hp(p,6)},
          },
          {
            t: "Dance with both, one after the other, very badly",
            check: {s:"athletics",s2:"spd",d:35},
            win: {
              r: "You manage it, breathless, and make friends of both. The village has no idea what to think.",
              fx: (p,ctx)=>{for(const id of[ctx.aid,ctx.bid]){const x=A.P(id);x&&A.link(p,x,"friend",20,"friend")}hp(p,5),A.train(p,"sta",.3)},
            },
            lose: {r:"You tread on everyone. {a} and {b} end up dancing with each other.",fx:{happy:-3}},
          },
          {
            t: "Slip off before the last dance",
            r: "You watch from the wall with a cup. Safe, and a little sad.",
            fx: {wil:.3,happy:-1},
          },
        ],
      },
      {
        id: "lf_scribe_letter",
        cond: p=>C.adult(p)&&!p.literate&&!slave(p)&&(C.hasRel(p,"lover","betrothed")||!C.married(p)&&youngA(p)),
        cool: 8,
        title: "Love by the scribe's pen",
        setup: (p,ctx)=>{setPid(p,ctx,relP(p,["lover","betrothed"])||linkNew(p,A.makeLoveInterest(p),"lover",30));const s=mk(p,{status:"artisan",occ:"a market scribe"});ctx.sid=s.id,ctx.scr=s.given},
        text: "You cannot write, so you pay {scr}, the market scribe, six pence a letter to write to {them} for you. The letters {scr} writes are far better than anything you said. {them} has noticed the difference.",
        choices: [
          {
            t: "Confess that the fine words are the scribe's",
            r: `{them} laughs till {theyHe} cries. "I knew you never said 'my heart is a lantern' in your life." It brings you closer.`,
            fx: {them:{op:15},honor:2,happy:4},
          },
          {
            t: "Keep paying {scr} and say nothing",
            r: (p,ctx)=>A.chance(.5)?"The letters get better and better. Then {them} meets {scr} at the market and recognizes the voice. An awkward afternoon.":"It works. {them} keeps the letters in a box. You never tell.",
            fx: {coin:-2,them:{op:8},honor:-1},
          },
          {
            t: "Learn your letters from {scr} (8 suns)",
            req: p=>p.coin>=8,
            check: {s:"int",s2:"wil",d:40},
            win: {
              r: "A winter of slate and chalk. Your first letter is crooked and short and {them} likes it best of all.",
              fx: {coin:-8,literate:!0,skill:{learning:3},them:{op:15}},
            },
            lose: {
              r: "The letters will not stay in your head. {scr} keeps the coin and keeps writing.",
              fx: {coin:-8,skill:{learning:1},wil:.5},
            },
          },
        ],
      },
      {
        id: "lf_unrequited",
        cond: p=>C.adult(p)&&!C.old(p)&&!C.married(p),
        cool: 9,
        w: .8,
        title: "Loving the wrong person",
        setup: (p,ctx)=>{const x=setPid(p,ctx,A.makeLoveInterest(p)),fr=known(p,["friend","bestfriend"],"friend",30);ctx.fid=fr.id,ctx.fr=fr.given,linkNew(p,x,"acquaint",10)},
        text: "You have loved {themFull} for a year without a word. Today your friend {fr} told you, glowing, that {fr} and {them} are to be wed at {festival}. {fr} wants you to stand witness.",
        choices: [
          {
            t: "Stand witness, and smile",
            r: "You stand there through the whole rite and smile until your face aches. Nobody ever knows. {fr} thanks you, close to tears.",
            fx: (p,ctx)=>{const f=A.P(ctx.fid);f&&A.addOp(p,f,15),A.willGrow(p,2,"heartbreak"),hp(p,-6),hon(p,2)},
          },
          {
            t: "Tell {them} how you feel before the wedding",
            check: {s:"persuasion",s2:"wil",d:50},
            win: {
              r: "{them} goes pale and quiet. The wedding is called off. {fr} will never speak to you again, but {them} does, and more.",
              fx: (p,ctx)=>{const f=A.P(ctx.fid);f&&bump(p,f,-60,"enemy","enemy"),bump(p,T(ctx),35,"lover","lover"),hon(p,-6),hp(p,4)},
            },
            lose: {
              r: "{them} is kind and firm. Then {theyHe} tells {fr}. You lose a friend and gain nothing.",
              fx: (p,ctx)=>{const f=A.P(ctx.fid);f&&bump(p,f,-40,"rival","rival"),hon(p,-4),hp(p,-10),A.willGrow(p,1.5,"shame")},
            },
          },
          {
            t: "Find work in {town} for a season",
            r: "Distance does what it can. You come back for the wedding feast and dance with everybody except {them}.",
            fx: {wil:1,happy:-3,coin:6,sta:.3},
          },
        ],
      },
      {
        id: "lf_noble_eye",
        cond: p=>C.adult(p)&&!C.old(p)&&(low(p)||p.status==="artisan")&&!C.married(p),
        cool: 10,
        w: .6,
        title: "The young lord's eye",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{sex:loveSex(p),status:"gentry",ageAdj:C.ageAdj(p)+A.ri(-2,6)}));x.occ="heir to the manor"},
        text: "{themFull}, heir to the manor above {home}, has started riding past your door. Yesterday {theyHe} stopped, asked your name, and asked it again as if it tasted good. Your mother has gone very quiet.",
        choices: [
          {
            t: "Let {themHim} court you",
            r: p=>A.chance(.3)?"Against every expectation, {them} means it. {theyHe} speaks to {theirHis} family about you, and the manor is in uproar.":"Flowers, rides, a ribbon from the town. Then {them} is betrothed to a girl of {theirHis} own sort, and the visits stop. You learn something about the world.",
            fx: (p,ctx)=>{A.chance(.3)?(bump(p,T(ctx),40,"lover","lover"),hp(p,10)):(bump(p,T(ctx),10,"ex","ex"),hp(p,-8),A.willGrow(p,1.5,"heartbreak"))},
          },
          {
            t: "Keep your distance and your name",
            check: {s:"wil",s2:"etiquette",d:35},
            win: {
              r: "You are polite, brief and never alone with {themHim}. {them} gives up, with a kind of respect.",
              fx: {honor:3,wil:.8},
            },
            lose: {
              r: "{them} takes your coldness as a challenge, and the reeve starts finding fault with your family's dues.",
              fx: {honor:1,coin:-4,happy:-4},
            },
          },
          {
            t: "Ask {themHim} for a favor for your family",
            check: {s:"persuasion",s2:"int",d:40},
            win: {
              r: "Your father's rent is eased and your brother gets a place in the stables. {them} enjoys being generous.",
              fx: {family:20,coin:5,them:{type:"friend",op:15,back:"friend"}},
            },
            lose: {
              r: '{them} laughs. "So that is what you think of me." The rides past your door stop.',
              fx: {them:{op:-10},honor:-2},
            },
          },
        ],
      },
      {
        id: "lf_slave_love",
        cond: p=>C.adult(p)&&slave(p)&&!C.married(p),
        cool: 6,
        title: "A love that belongs to someone else",
        setup: (p,ctx)=>{const x=setPid(p,ctx,A.makeLoveInterest(p));x.status="slave",x.occ=A.pick(["a house slave","a field slave","a slave in the kitchens","a stable slave"])},
        text: "{themFull}, {themOcc}, sleeps three walls away. You share water at the well and a look at the end of each day. Your master owns you both, and he sells what he owns when the price is good.",
        choices: [
          {
            t: "Ask the master for leave to marry",
            check: {s:"persuasion",s2:"etiquette",d:45},
            win: {
              r: "He shrugs: married slaves run less. A cup of water, a few words, and you are wed under his roof.",
              fx: (p,ctx)=>{const t=T(ctx);if(t&&!spouseOf(t))return A.marry(p,t),"(You are married.)";bump(p,t,30,"lover","lover")},
            },
            lose: {
              r: "He laughs, and that autumn sells {them} to a buyer from {town}. You are not allowed to say goodbye.",
              fx: (p,ctx)=>{bump(p,T(ctx),20,"lover","lover"),hp(p,-15),A.willGrow(p,2.5,"loss")},
            },
          },
          {
            t: "Love in secret and hope",
            r: "Stolen minutes behind the store-house. You learn to say everything with your eyes.",
            fx: {them:{type:"lover",op:35,back:"lover"},happy:8,wil:.5},
          },
          {
            t: "Plan to buy both your freedoms",
            r: "You start a second hoard in a crack in the wall, a penny at a time. It will take years. It is something to live for.",
            fx: {them:{type:"lover",op:25,back:"lover"},flag:"lf_freedom_hoard",wil:1,happy:3},
          },
        ],
      },
      {
        id: "lf_proposal_fest",
        cond: p=>C.adult(p)&&!C.married(p)&&live(p,["lover"]).some(x=>!spouseOf(x.p)),
        cool: 6,
        title: "A question in front of everyone",
        setup: (p,ctx)=>{const l=live(p,["lover"]).filter(x=>!spouseOf(x.p));setPid(p,ctx,l.length?A.pick(l).p:null),ctx.fest=festOf(p)},
        text: "It is {fest}, and the whole of {home} is out. You have a ring, or a ribbon, or a good knife, in your pocket, and {them} beside you. If you ask now, everyone will hear the answer.",
        choices: [
          {
            t: "Ask {themHim} in front of everyone",
            check: {s:"persuasion",s2:"wil",d:30,bonus:p=>0},
            win: {
              r: "{them} says yes before you finish the question. The crowd roars. Somebody fetches a fiddler.",
              fx: (p,ctx)=>{const t=T(ctx);if(t&&!spouseOf(t)&&!spouseOf(p))return A.marry(p,t),A.fame(p,1),`(You are married ${A.weddingRite(p)} before the year is out.)`},
            },
            lose: {
              r: '{them} goes scarlet and says "Not here!" and runs off. Later, in private, {theyHe} says "Ask me again. Somewhere quiet."',
              fx: {them:{op:-3},happy:-5,honor:-1},
            },
          },
          {
            t: "Wait for a quiet hour by the water",
            r: "You ask by the river with nobody watching. {them} says yes, very softly.",
            fx: (p,ctx)=>{const t=T(ctx);if(t&&!spouseOf(t)&&!spouseOf(p))return A.marry(p,t),`(You are married ${A.weddingRite(p)}.)`},
          },
          {
            t: "Lose your nerve",
            r: "The thing stays in your pocket all night. {them} knows. {them} waits.",
            fx: {them:{op:-4},wil:.4},
          },
        ],
      },
      {
        id: "lf_love_rumor",
        cond: p=>C.adult(p)&&!C.old(p)&&C.married(p),
        cool: 9,
        title: "The gossips decide",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{sex:loveSex(p)}));linkNew(p,x,"acquaint",10)},
        text: "You have only ever talked about the price of wool with {themFull}. But the gossips at the well have decided otherwise, and the story has reached {spouse}.",
        choices: [
          {
            t: "Laugh it off with {spouse}",
            check: {s:"persuasion",s2:"wil",d:35},
            win: {
              r: "{spouse} laughs too, eventually. You buy wool from someone else for a while.",
              fx: {rel:{who:"spouse",op:4},happy:2},
            },
            lose: {
              r: "{spouse} does not laugh. A week of cold suppers follows.",
              fx: {rel:{who:"spouse",op:-10},happy:-4},
            },
          },
          {
            t: "Confront the chief gossip",
            check: {s:"intimidation",s2:"wil",d:37},
            win: {
              r: "You find her, and she finds the story suddenly uninteresting. It dies by Sunday.",
              fx: {honor:2,skill:{intimidation:1}},
            },
            lose: {r:"Now the story has a new chapter: how you shouted at an old woman.",fx:{honor:-3,happy:-3}},
          },
          {
            t: "Bring {them} to supper with {spouse}",
            r: "{them} is so plainly harmless, and so interested in wool, that {spouse} ends up friends with {themHim}.",
            fx: {them:{type:"friend",op:15,back:"friend"},rel:{who:"spouse",op:3}},
          },
        ],
      },
      {
        id: "lf_marriage_cold",
        cond: p=>C.adult(p)&&C.married(p)&&midA(p),
        cool: 10,
        title: "The cold years",
        setup: (p,ctx)=>{setPid(p,ctx,spouseOf(p)),ctx.food=food(p)},
        text: "You and {them} have not quarreled in a year. You have not laughed together either. You eat {food} across the same table and talk about the roof.",
        choices: [
          {
            t: "Take {themHim} somewhere you went when you were young",
            check: {s:"persuasion",s2:"int",d:33},
            win: {
              r: "The same hill, the same view. {them} remembers something you had both forgotten, and laughs. It is a start.",
              fx: {them:{op:18},happy:8},
            },
            lose: {
              r: "It rains. {them} complains of {theirHis} knees. You walk home in silence, but at least together.",
              fx: {them:{op:4}},
            },
          },
          {
            t: "Talk honestly, for once",
            check: {s:"wil",s2:"diplomacy",d:40},
            win: {
              r: "It takes all night and a jug. By dawn you know each other again.",
              fx: {them:{op:22},happy:6,wil:.6},
            },
            lose: {
              r: "Old wounds open. It gets worse before it gets better, if it gets better.",
              fx: {them:{op:-12},happy:-6,wil:.8},
            },
          },
          {
            t: "Leave it be: this is what marriage is",
            r: "Many marriages run on habit. Yours will too.",
            fx: {them:{op:-3},happy:-2},
          },
        ],
      },
      {
        id: "lf_widowed_love",
        cond: p=>C.adult(p)&&!C.married(p)&&p.widowed&&A.S.year-p.widowed>=2,
        cool: 8,
        w: .9,
        title: "A second spring",
        setup: (p,ctx)=>{const x=setPid(p,ctx,A.makeLoveInterest(p));x.occ=A.pick(["a widowed miller","a widowed weaver","a widowed boatman","a widowed herb-seller","a widowed carter"]),ctx.where=A.pick(["at the grave-yard, tending the graves on either side","at the market, where you both buy for one","at the well, where you are both the last to leave"])},
        text: "You keep meeting {themFull}, {themOcc}, {where}. You both know the weight of the empty chair. Lately you find you are looking forward to the meeting.",
        choices: [
          {
            t: "Invite {themHim} to share a meal",
            r: "A plain supper, two people who know what loss tastes like. You talk about your dead without tears, for the first time.",
            fx: {them:{type:"lover",op:30,back:"lover"},happy:10,wil:.5},
          },
          {
            t: "Ask your family what they think",
            check: {s:"diplomacy",s2:"persuasion",d:37},
            win: {
              r: `"About time," says the eldest. Even your late spouse's mother comes round, in the end.`,
              fx: {them:{type:"friend",op:20,back:"friend"},happy:6},
            },
            lose: {
              r: "Your children are scandalized: it is too soon, and what about the inheritance? You let it go, for now.",
              fx: {them:{type:"friend",op:10,back:"friend"},happy:-5,wil:.8},
            },
          },
          {
            t: "Stay true to the dead",
            r: "You decide your heart is buried, and leave it there. {them} understands better than anyone.",
            fx: {them:{type:"friend",op:15,back:"friend"},piety:2,wil:1},
          },
        ],
      },
      {
        id: "lf_late_love",
        cond: p=>C.old(p)&&!C.married(p),
        cool: 8,
        title: "Love, late",
        setup: (p,ctx)=>{const x=setPid(p,ctx,A.makeLoveInterest(p)),R=GD.RACES[x.race];x.born=Math.min(x.born,A.S.year-R.old),x.occ="a neighbor of many years"},
        text: "{themFull} brings you soup when you are poorly and argues with you about the weather when you are not. You realize you are both old and both alone, and that this is ridiculous.",
        choices: [
          {
            t: "Propose, at your age",
            check: {s:"persuasion",s2:"wil",d:32},
            win: {
              r: "{them} laughs so hard {theyHe} has to sit down, then says yes. The village throws you a wedding with more grandchildren than guests.",
              fx: (p,ctx)=>{const t=T(ctx);if(t&&!spouseOf(t)&&!spouseOf(p))return A.marry(p,t),hp(p,6),"(You are married, late and glad of it.)"},
            },
            lose: {
              r: '"At our age? Think of the gossip." But {theyHe} keeps bringing the soup.',
              fx: {them:{type:"friend",op:20,back:"friend"},happy:3},
            },
          },
          {
            t: "Keep it as it is: soup and arguments",
            r: "The best friendship of your old age. That is plenty.",
            fx: {them:{type:"friend",op:25,back:"friend"},happy:6},
          },
          {
            t: "Worry what your heirs will say",
            r: "Your heirs are relieved, and a little ashamed of being relieved. You let the matter drop.",
            fx: {happy:-4,wil:.5},
          },
        ],
      },
      {
        id: "lf_old_letters",
        cond: p=>C.adult(p)&&C.married(p)&&frac(p)>.25,
        cool: 15,
        w: .6,
        title: "Old letters in a chest",
        setup: (p,ctx)=>setPid(p,ctx,spouseOf(p)),
        text: p=>`${p.literate?"You find a bundle of letters":"You find a bundle of folded papers"} at the bottom of {them}'s chest, tied with a faded ribbon. They are from someone {them} loved before you, and some of them are dated after your wedding.`,
        choices: [
          {
            t: "Ask {themHim} about them",
            check: {s:"wil",s2:"diplomacy",d:40},
            win: {
              r: "{them} tells you the whole story. It was over long ago; {theyHe} kept them out of foolishness. You burn them together.",
              fx: {them:{op:15},happy:3,wil:.6},
            },
            lose: {
              r: "It turns into the worst quarrel of your marriage. Nobody is sure who is in the wrong.",
              fx: {them:{op:-18},happy:-8,wil:1},
            },
          },
          {
            t: "Put them back and say nothing",
            r: "You put them back exactly as they were. Some doors are better left shut.",
            fx: {wil:1,happy:-3},
          },
          {
            t: "Burn them, quietly",
            r: "Into the fire, one by one. If {them} notices, {theyHe} never says.",
            fx: {them:{op:-4},honor:-1,happy:1},
          },
        ],
      },
      {
        id: "lf_spouse_town",
        cond: p=>C.adult(p)&&C.married(p)&&!C.town(p)&&free(p)&&!high(p),
        cool: 12,
        title: '"Let us go to the town"',
        setup: (p,ctx)=>{setPid(p,ctx,spouseOf(p)),ctx.cap=(A.realm(p.realm)||{}).capital||"the capital"},
        text: '{them} has a cousin in {cap} who says there is work for anyone with two hands: carting, building, the docks. "We could be more than this," {them} says, looking round the smoky room.',
        choices: [
          {
            t: "Go: sell up and try the city",
            check: {s:"trade",s2:"int",d:40},
            win: {
              r: "Hard first year, then steady wages. {them} was right, and does not let you forget it.",
              fx: {coin:30,them:{op:15},happy:4,skill:{trade:2}},
            },
            lose: {
              r: "The cousin's work evaporates. Rent eats your savings. You come home in spring, poorer and wiser.",
              fx: {coinPct:-.35,them:{op:-6},wil:1.2,happy:-6},
            },
          },
          {
            t: "Refuse: your family's graves are here",
            r: "{them} goes quiet for a season. But the land is the land.",
            fx: {them:{op:-10},piety:1},
          },
          {
            t: "Let {themHim} go ahead and send for you",
            r: "You keep the house. {them} writes twice, then comes home for good at Midwinter, thinner and glad to be back.",
            fx: {them:{op:8},coin:8,wil:.6},
          },
        ],
      },
    ]);
    const friendOf=p=>known(p,["bestfriend","friend"],"friend",35);
    add([
      {
        id: "lf_friend_surety",
        cond: p=>C.adult(p)&&free(p),
        cool: 9,
        title: "Stand surety",
        setup: (p,ctx)=>{setPid(p,ctx,friendOf(p)),ctx.amt=10*purse(p),ctx.lend=lender(p)},
        text: "Your friend {them} has borrowed {amt} suns from {lend}, and the lender wants a second name on the tally: someone who pays if {them} cannot. {them} asks you, and cannot quite look at you while asking.",
        choices: [
          {
            t: "Put your name to it",
            r: (p,ctx)=>ctx.bad?"{them} cannot pay at Midsummer. The lender comes to your door instead, very politely.":"{them} pays every penny on time and brings you a ham at Midwinter.",
            fx: (p,ctx)=>{const t=T(ctx);if(bump(p,t,20),A.chance(.4)){ctx.bad=1;const v=pay(p,ctx.amt);return v<ctx.amt&&addDebt(p,ctx.amt-v),A.willGrow(p,.8,"debt"),`(You pay ${v} suns${v<ctx.amt?" and owe the rest":""}.)`}return hp(p,3),""},
          },
          {
            t: "Refuse, kindly",
            check: {s:"diplomacy",s2:"wil",d:35},
            win: {r:'{them} understands. "I should not have asked." The friendship survives.',fx:{them:{op:-3}}},
            lose: {r:"{them} says {theyHe} understands. {theyHe} does not.",fx:{them:{op:-15}}},
          },
          {
            t: "Look over the lender's terms first",
            check: {s:"trade",s2:"learning",d:40},
            win: {
              r: "The interest is a scandal. You find {them} a cheaper lender in {town} and nobody needs a surety.",
              fx: {them:{op:15},skill:{trade:1},int:.3},
            },
            lose: {
              r: "The figures defeat you. You sign anyway, with a bad feeling.",
              fx: (p,ctx)=>{if(bump(p,T(ctx),10),A.chance(.4))return`(The bad feeling was right: you pay ${pay(p,Math.round(ctx.amt/2))} suns.)`},
            },
          },
        ],
      },
      {
        id: "lf_friend_oath",
        cond: p=>C.adult(p)&&free(p),
        cool: 10,
        title: "A friend before the court",
        setup: (p,ctx)=>{setPid(p,ctx,friendOf(p)),ctx.what=A.pick(["stealing a ewe","moving a boundary stone","selling short weight","starting the fire that took a barn","striking a reeve"]),ctx.court=judge(p)},
        text: "{them} is accused of {what}, and the case goes before {court}. {them} swears {theyHe} is innocent and needs people of good name to stand with {themHim}.",
        choices: [
          {
            t: "Swear for {themHim}",
            check: {s:"persuasion",s2:"wil",d:37,bonus:p=>(p.honor-50)/5},
            win: {
              r: "Your word carries. The case is dismissed, and {them} weeps on your shoulder outside.",
              fx: {them:{op:25},honor:2,fame:1},
            },
            lose: {
              r: "It is not enough. {them} is fined heavily, and some say you swore too quickly.",
              fx: {them:{op:15},honor:-2},
            },
          },
          {
            t: "Find out the truth first",
            check: {s:"intrigue",s2:"int",d:40},
            win: {
              r: p=>A.chance(.6)?"You find the real culprit, a drunk cousin of the accuser. You bring it to court, and {them} walks free.":"You find {them} did it. You keep quiet about it, and do not swear.",
              fx: {them:{op:8},skill:{intrigue:2},int:.3},
            },
            lose: {r:"You learn nothing in time. The court sits without your help.",fx:{them:{op:-8}}},
          },
          {
            t: "Stay out of it",
            r: "{them} notices who stood with {themHim} and who did not.",
            fx: {them:{op:-20},honor:-1},
          },
        ],
      },
      {
        id: "lf_friend_forgets",
        cond: p=>C.adult(p)&&!high(p),
        cool: 12,
        w: .8,
        title: "A friend who rose",
        setup: (p,ctx)=>{const x=setPid(p,ctx,friendOf(p));ctx.rise=A.pick(["married a rich widow in {town}","won a master's place in the guild","been made a reeve","come home from the wars with a captain's purse","inherited a mill"])},
        text: "Your old friend {them} has {rise}. Today {them} rode past you in the market in a new cloak, and looked straight through you.",
        choices: [
          {
            t: "Call {themHim} out by name, loudly",
            check: {s:"intimidation",s2:"persuasion",d:37},
            win: {
              r: '{them} reins in, red-faced. "Forgive me. I did not see you." Then, quieter: "I did. I am a fool." You drink together that night.',
              fx: {them:{op:15},happy:4},
            },
            lose: {
              r: "{them} pretends not to hear. The whole market heard, though.",
              fx: {them:{type:"rival",op:-15,back:"rival"},honor:-2,happy:-4},
            },
          },
          {
            t: "Visit {themHim} with a gift from the old days",
            r: p=>A.chance(.6)?"A carved whistle from when you were eight. {them} turns it over and over, and asks you to stay to supper.":"A servant takes the gift at the door and says the master is busy.",
            fx: (p,ctx)=>{A.chance(.6)?bump(p,T(ctx),15):(bump(p,T(ctx),-10),A.willGrow(p,.8,"slight"))},
          },
          {
            t: "Let {themHim} go",
            r: "People rise and change. You have other friends. You tell yourself that more than once.",
            fx: {them:{op:-10},wil:.6,happy:-3},
          },
        ],
      },
      {
        id: "lf_friend_drowning",
        cond: p=>(C.adult(p)||C.teen(p))&&!C.old(p),
        cool: 10,
        w: .8,
        title: "Under the ice",
        setup: (p,ctx)=>{setPid(p,ctx,friendOf(p)),ctx.where=C.terr(p,"tundra","mountains")||A.chance(.5)?"goes through the ice on the millpond":"is swept off the ford by a spring flood"},
        text: "You are out with {them} when {them} {where}. One hand, then nothing. Nobody else is in shouting distance.",
        choices: [
          {
            t: "Go in after {themHim}",
            check: {s:"athletics",s2:"str",d:45},
            win: {
              r: "You drag {themHim} out by the hair, both of you blue and coughing. {them} will owe you a life for the rest of {theirHis} days.",
              fx: {
                them: {type:"bestfriend",op:40,back:"bestfriend"},
                health: -6,
                cause: "cold water",
                fame: 2,
                wil: 1,
                deed: "Pulled a friend out of the water",
              },
            },
            lose: {
              r: "You get {themHim} out, but the cold gets into your chest and stays all winter.",
              fx: {
                them: {type:"bestfriend",op:35,back:"bestfriend"},
                health: -18,
                cause: "a fever from the cold water",
                wound: "lungs",
                wil: 1.5,
              },
            },
          },
          {
            t: "Lie flat and reach with a branch",
            check: {s:"survival",s2:"int",d:37},
            win: {
              r: "Slow and careful. The branch holds. {them} comes out like a landed fish.",
              fx: {them:{type:"bestfriend",op:35,back:"bestfriend"},skill:{survival:2}},
            },
            lose: {
              r: "The branch snaps. You run for help. When the men come, they bring {themHim} out too late.",
              fx: (p,ctx)=>{const t=T(ctx);t&&A.kill(t,"drowning"),hp(p,-18),A.willGrow(p,2.5,"grief"),A.addTrait(p,"cautious")},
            },
          },
          {
            t: "Run for help",
            r: (p,ctx)=>ctx.lived?"You run faster than you have ever run. The miller and his sons get {themHim} out in time, just.":"By the time the men come with ropes, it is over.",
            fx: (p,ctx)=>{const t=T(ctx);return A.chance(.5)?(ctx.lived=1,bump(p,t,10),""):(t&&A.kill(t,"drowning"),hp(p,-15),A.willGrow(p,2,"guilt"),"")},
          },
        ],
      },
      {
        id: "lf_friend_drink",
        cond: p=>C.adult(p)&&!dry(p),
        cool: 9,
        title: "A friend and the jug",
        setup: (p,ctx)=>{setPid(p,ctx,friendOf(p)),ctx.drink=drink(p),ctx.loss=A.pick(["bereavement","failed harvest","broken betrothal","dismissal"]),ctx.boss=A.pick(["reeve","master","foreman"]),ctx.cl=clergy(p)},
        text: "{them} has been drinking {drink} from noon to night since {theirHis} {loss}. This morning {theyHe} was found asleep in a ditch, and the {boss} has warned {themHim} for the last time.",
        choices: [
          {
            t: "Take {themHim} in hand: work, food, no jug",
            check: {s:"wil",s2:"persuasion",d:43},
            win: {
              r: "A hard month, with shouting. Then {them} starts sleeping at night and working by day again.",
              fx: {them:{op:25},wil:1,happy:3},
            },
            lose: {
              r: "{them} slips away to the alehouse every time you turn your back. You cannot be a jailer.",
              fx: {them:{op:5},wil:.6,happy:-4},
            },
          },
          {
            t: "Ask the {cl} to talk to {themHim}",
            check: {s:"faith",s2:"diplomacy",d:35},
            win: {
              r: "The {cl} gives {themHim} a penance and a purpose. It works better than you expected.",
              fx: {them:{op:12},piety:2},
            },
            lose: {
              r: "The sermon bounces off. {them} is angry that you went behind {theirHis} back.",
              fx: {them:{op:-12}},
            },
          },
          {
            t: "Drink with {themHim}: a friend shares the jug",
            r: "A long, dark, funny night. Nothing is solved, but {them} knows you are there.",
            fx: {them:{op:10},health:-3,cause:"drink",happy:2},
          },
        ],
      },
      {
        id: "lf_friend_fugitive",
        cond: p=>C.adult(p)&&!C.prison(p),
        cool: 12,
        w: .7,
        title: "A knock at midnight",
        setup: (p,ctx)=>{setPid(p,ctx,friendOf(p)),ctx.deed=A.pick(["killed a man in a brawl over dice","struck a lord's steward who struck first","run from a debt-bond","deserted the levy after a flogging"]),ctx.sanct=law(p)==="sun"?"the temple bell-rope and forty days of sanctuary":law(p)==="orc"?"a stranger's fire, where a guest cannot be given":"the border"},
        text: '{them} is at your door, soaked and shaking. {theyHe} has {deed}, and the hue and cry is two villages behind. "One night. Just one night, and then I go for {sanct}."',
        choices: [
          {
            t: "Hide {themHim} in the loft",
            check: {s:"deception",s2:"stealth",d:43},
            win: {
              r: "The searchers come and go. At dawn {them} slips away with your old cloak and half your bread.",
              fx: {them:{type:"bestfriend",op:35,back:"bestfriend"},honor:2,skill:{deception:1}},
            },
            lose: {
              r: "The searchers find {themHim}. They find you, too, guilty of sheltering.",
              fx: {them:{op:20},punish:"theft",honor:-4},
            },
          },
          {
            t: "Give {themHim} food and a head start, but not your roof",
            r: "Bread, a few coins and directions. {them} is gone before the dogs arrive. You lie to nobody, which is something.",
            fx: {them:{op:15},coin:-2,honor:1},
          },
          {
            t: "Turn {themHim} in",
            r: "The reeve thanks you. {them} looks at you once, over the reeve's shoulder, and never again.",
            fx: {them:{type:"enemy",op:-60,back:"enemy"},coin:5,honor:-6,happy:-6},
          },
        ],
      },
      {
        id: "lf_friend_nurse",
        cond: p=>C.adult(p)&&!slave(p),
        cool: 8,
        title: "A friend with the fever",
        setup: (p,ctx)=>{setPid(p,ctx,friendOf(p)),ctx.ill=A.pick(["marsh fever","the summer flux","a winter cough that will not stop","a wound gone hot and red"]),ctx.heal=healer(p)},
        text: "{them} has {ill}, and nobody else in {theirHis} house can nurse {themHim}. {heal} has been and shaken {theirHis} head.",
        choices: [
          {
            t: "Nurse {themHim} yourself, day and night",
            check: {s:"medicine",s2:"sta",d:40},
            win: {
              r: "Broth, clean water, cool cloths, willow bark. On the ninth day the fever breaks, and {them} asks for bread.",
              fx: {them:{type:"bestfriend",op:30,back:"bestfriend"},skill:{medicine:3},sta:.4},
            },
            lose: {
              r: (p,ctx)=>ctx.died?"You do everything right, and it is not enough. {them} dies holding your hand.":"{them} lives, but you catch it too, and spend a month in bed yourself.",
              fx: (p,ctx)=>{const t=T(ctx);return A.chance(.4)&&t?(ctx.died=1,A.kill(t,ctx.ill),hp(p,-15),A.willGrow(p,2,"grief"),""):(bump(p,t,25),hurt(p,15,ctx.ill),A.willGrow(p,1,"sickness"),"")},
            },
          },
          {
            t: "Pay for a physician from town (2 suns a visit)",
            req: p=>p.coin>=6,
            r: p=>A.chance(.5)?"The physician bleeds {themHim} and charges three visits. {them} recovers anyway, and thanks you for the physician.":"The physician bleeds {themHim} white. {them} survives the physician, barely.",
            fx: {coin:-6,them:{op:15}},
          },
          {
            t: "Bring food, and keep your distance",
            r: "You leave a pot at the door every day. Prudent. {them} lives, and remembers the pots.",
            fx: {them:{op:6}},
          },
        ],
      },
      {
        id: "lf_friend_moves",
        cond: p=>C.adult(p),
        cool: 12,
        title: "Leaving for good",
        setup: (p,ctx)=>{setPid(p,ctx,friendOf(p));const r=A.pick(Object.keys(LORE.realms).filter(x=>x!==p.realm));ctx.far=A.realmShort(r)},
        text: '{them} is leaving for {far}, for good: a cousin, a trade, a fresh start. {theyHe} sails or rides at the end of the month. "Come with me," {theyHe} says, only half joking.',
        choices: [
          {
            t: "Give {themHim} a farewell feast (4 suns)",
            req: p=>p.coin>=4,
            r: "Everyone comes. The songs get worse as the night gets later. {them} cries at the gate.",
            fx: {coin:-4,them:{op:15},happy:6},
          },
          {
            t: "Go with {themHim}, at least for a season",
            req: p=>free(p)&&!C.soldier(p),
            check: {s:"survival",s2:"trade",d:40},
            win: {
              r: "A season in {far} that you will talk about for the rest of your life. You come home brown, broke and wiser.",
              fx: {them:{op:20},int:.5,happy:8,coin:-6,skill:{survival:1,trade:1}},
            },
            lose: {
              r: "Robbed on the road, sick in a strange inn, home by autumn with nothing but the story.",
              fx: {coinPct:-.3,health:-8,cause:"a fever on the road",wil:1.2,them:{op:10}},
            },
          },
          {
            t: "Say goodbye at the crossroads",
            r: "A hard hug, a promise to write that neither of you can keep. Then a dot on the road.",
            fx: {them:{op:5},happy:-4,wil:.5},
          },
        ],
      },
      {
        id: "lf_friend_quarrel",
        cond: p=>C.adult(p)||C.teen(p),
        cool: 7,
        title: "A stupid quarrel",
        setup: (p,ctx)=>{setPid(p,ctx,friendOf(p)),ctx.over=A.pick(["a borrowed knife returned blunt","who won a wrestling bout ten years ago","a joke about your mother","a dog that killed a hen","whose turn it was to pay"])},
        text: "You and {them} have not spoken for a month, over {over}. It was stupid then. It is stupider now. You see {themHim} across the square.",
        choices: [
          {
            t: "Walk over and apologize first",
            check: {s:"wil",s2:"diplomacy",d:30},
            win: {
              r: "{them} is so relieved {theyHe} apologizes too, and you both laugh about it.",
              fx: {them:{op:20},happy:4},
            },
            lose: {
              r: "{them} accepts the apology with a nod, and no apology back. It rankles.",
              fx: {them:{op:6},wil:.4},
            },
          },
          {
            t: "Wait for {themHim} to come to you",
            r: p=>A.chance(.5)?"{them} comes, eventually, with a jug. Neither of you mentions it again.":"Neither of you moves. A good friendship cools into nods in the street.",
            fx: (p,ctx)=>{bump(p,T(ctx),A.chance(.5)?8:-15)},
          },
          {
            t: "Have it out properly, fists and all",
            r: "You roll in the mud until someone throws a bucket over you. Then you are friends again, somehow.",
            fx: {them:{op:12},health:-4,cause:"a scuffle",skill:{unarmed:1},happy:2},
          },
        ],
      },
      {
        id: "lf_friend_ashen",
        cond: p=>C.adult(p)&&C.faith(p,"REL-01","REL-02"),
        cool: 15,
        w: .5,
        title: "The hidden altar",
        setup: (p,ctx)=>{setPid(p,ctx,friendOf(p))},
        text: "Late at night you follow a light into {them}'s cellar and find a hidden altar: grey ash, a black stone, a little litany scratched on a board. {them} is one of the Ashen, who pray to the darkness the Temple calls the Devourer. If the Temple court learns of it, {them} will be jailed for life.",
        choices: [
          {
            t: "Keep {theirHis} secret",
            r: '{them} grips your hand. "I harm nobody." You believe it. You also lie awake for weeks.',
            fx: {them:{type:"bestfriend",op:30,back:"bestfriend"},piety:-3,wil:.8,flag:"lf_knows_ashen"},
          },
          {
            t: "Try to bring {themHim} back to the Light",
            check: {s:"faith",s2:"persuasion",d:47},
            win: {
              r: "Many long talks. One morning the altar is gone and {them} comes with you to the dawn rite.",
              fx: {them:{op:20},piety:5,skill:{faith:2}},
            },
            lose: {
              r: "{them} listens politely and changes nothing. The cellar door now has a lock.",
              fx: {them:{op:-5},piety:1},
            },
          },
          {
            t: "Report {themHim} to the Temple",
            r: "The Temple court burns {theirHis} effigy in the square and takes {themHim} to a cell for life. The priests praise you. You never sleep well again.",
            fx: (p,ctx)=>{bump(p,T(ctx),-80,"enemy","enemy"),pie(p,6),hon(p,-4),hp(p,-10),A.willGrow(p,1,"betrayal"),A.fame(p,1)},
          },
        ],
      },
      {
        id: "lf_friend_dice_debt",
        cond: p=>C.adult(p)&&!dry(p),
        cool: 8,
        title: "Lost at the dice",
        setup: (p,ctx)=>{setPid(p,ctx,friendOf(p)),ctx.amt=5*purse(p)+A.ri(2,8)},
        text: "At the dice-house {them} has lost {amt} suns that {theyHe} does not have, to a man with a scar and two large friends. {them} looks round the room and finds your face.",
        choices: [
          {
            t: "Pay the debt ({amt} suns)",
            req: (p,C2,ctx)=>p.coin>=ctx.amt,
            r: "The scarred man counts it twice and smiles. {them} swears never to touch dice again. You both know what that is worth.",
            fx: (p,ctx)=>{pay(p,ctx.amt),bump(p,T(ctx),20)},
          },
          {
            t: "Win it back for {themHim}",
            check: {s:"gambling",s2:"int",d:45},
            win: {
              r: "Three good throws and a calm face. The debt is cleared, and you walk out with a little extra.",
              fx: (p,ctx)=>{p.coin+=4,bump(p,T(ctx),25),A.trainSkill(p,"gambling",2)},
            },
            lose: {
              r: "Now you both owe him.",
              fx: (p,ctx)=>{const v=pay(p,ctx.amt);return v<ctx.amt&&addDebt(p,ctx.amt-v),bump(p,T(ctx),10),hp(p,-5),`(It costs you ${v} suns${v<ctx.amt?" and a debt":""}.)`},
            },
          },
          {
            t: "Talk the scarred man down",
            check: {s:"intimidation",s2:"persuasion",d:47},
            win: {
              r: "The dice were loaded and you say so, loud enough for the room. He takes half and leaves.",
              fx: {them:{op:20},skill:{intimidation:2},honor:1},
            },
            lose: {
              r: "He does not like your tone. You both leave by the window, faster than you came in.",
              fx: {them:{op:10},health:-8,cause:"a beating at the dice-house"},
            },
          },
          {
            t: "Leave {themHim} to it",
            r: "{them} turns up a week later with a black eye and does not speak of it, or to you.",
            fx: {them:{op:-18}},
          },
        ],
      },
      {
        id: "lf_friend_feud_pick",
        cond: p=>C.adult(p),
        cool: 10,
        title: "Two friends, one quarrel",
        setup: (p,ctx)=>{const a=setPid(p,ctx,friendOf(p)),b=linkNew(p,mk(p),"friend",30);ctx.bid=b.id,ctx.b=b.given,ctx.over=A.pick(["a strip of meadow","a broken betrothal between their children","a cow that died after it changed hands","a debt of eleven suns"])},
        text: "{them} and {b}, both your friends, have fallen out over {over}. Each wants you on their side at the hearing. Neither will forgive you for standing in the middle.",
        choices: [
          {
            t: "Mediate between them",
            check: {s:"diplomacy",s2:"int",d:45},
            win: {
              r: "Two evenings, a jug and a split down the middle. They shake hands, and both think they won.",
              fx: (p,ctx)=>{bump(p,T(ctx),12),bump(p,A.P(ctx.bid),12),A.trainSkill(p,"diplomacy",2),A.fame(p,1)},
            },
            lose: {
              r: "They both decide you favor the other. You end up with two half-friends.",
              fx: (p,ctx)=>{bump(p,T(ctx),-12),bump(p,A.P(ctx.bid),-12)},
            },
          },
          {
            t: "Side with {them}",
            r: "{them} is grateful. {b} crosses the street when you pass.",
            fx: (p,ctx)=>{bump(p,T(ctx),15),bump(p,A.P(ctx.bid),-35,"rival","rival")},
          },
          {
            t: "Side with {b}",
            r: "{b} is grateful. {them} crosses the street when you pass.",
            fx: (p,ctx)=>{bump(p,A.P(ctx.bid),15),bump(p,T(ctx),-35,"rival","rival")},
          },
        ],
      },
      {
        id: "lf_friend_godparent",
        cond: p=>C.adult(p)&&!C.old(p),
        cool: 10,
        title: "Speak for the child",
        setup: (p,ctx)=>{setPid(p,ctx,friendOf(p)),ctx.custom={"REL-07":"drop well water on the baby's tongue on the eighth day","REL-04":"speak the name under the birth tree","REL-09":"speak the names of the ancestors over the cradle","REL-03":"hold the child at the hall fire while the hall-priest names it","REL-11":"hold the baby up to the sky before the clan"}[p.faith]||"hold the child at the naming and speak for it before the gods"},
        text: "{them} has a new baby, and asks you to {custom}. It means you will stand for the child if {them} cannot: food, a roof, a trade.",
        choices: [
          {
            t: "Accept, gladly",
            r: "The baby screams through the whole rite. You are told this is lucky. You have a new small person to worry about.",
            fx: (p,ctx)=>{bump(p,T(ctx),20);const c=mk(p,{ageAdj:0,minAge:0});c.occ="a baby",A.link(p,c,"acquaint",30,"acquaint"),hp(p,5),pie(p,2)},
          },
          {
            t: "Accept, and bring a silver spoon (5 suns)",
            req: p=>p.coin>=5,
            r: "A spoon for the child, a feast for the family. Everyone remembers who brought silver.",
            fx: {coin:-5,them:{op:28},fame:1,happy:5},
          },
          {
            t: "Decline: you could not keep such a promise",
            r: "{them} says {theyHe} understands, and asks someone else.",
            fx: {them:{op:-10},honor:1},
          },
        ],
      },
      {
        id: "lf_unlikely_friend",
        cond: p=>C.adult(p)||C.teen(p),
        cool: 12,
        title: "An unlikely friend",
        setup: (p,ctx)=>{const opts=[["a half-orc oarsman nobody will sit with","halforc"],["an old hermit who lives in the charcoal woods",null],["a dwarf trader stuck in town for the winter","dwarf"],["a widow the village calls a witch",null],["a one-armed veteran who sleeps in the church porch",null]],o=A.pick(opts.filter(x2=>!x2[1]||x2[1]!==p.race)),x=setPid(p,ctx,mk(p,{race:o[1]&&A.raceAllowed(o[1],p.realm)?o[1]:p.race,ageAdj:C.ageAdj(p)+A.ri(5,30)}));x.occ=o[0],ctx.who=o[0]},
        text: "You keep running into {them}, {who}. Everyone else avoids {themHim}. The more you talk, the more you find {theyHe} knows things nobody in {home} has ever bothered to ask about.",
        choices: [
          {
            t: "Make a habit of it",
            r: "Long evenings. You learn about the world beyond the hill, and something about yourself. The neighbors talk.",
            fx: {them:{type:"friend",op:35,back:"friend"},int:.6,honor:-1,happy:4},
          },
          {
            t: "Ask {themHim} to teach you something",
            check: {s:"int",s2:"wil",d:33},
            win: {
              r: p=>`${A.pick(["Herbs and how to set a bone","How to read the weather from the birds","How to fight dirty and win","How to count in three languages"])}. {them} is a good teacher, and a patient one.`,
              fx: {them:{type:"mentor",op:30,back:"student"},skill:{medicine:1,survival:2},int:.5},
            },
            lose: {
              r: "{them} tries, but you are a slow student and {theyHe} a gruff teacher. You stay friends anyway.",
              fx: {them:{type:"friend",op:15,back:"friend"}},
            },
          },
          {
            t: "Keep your distance: you have a name to keep",
            r: "You nod in passing, and nothing more. The village approves. You are not sure you do.",
            fx: {honor:1,happy:-1},
          },
        ],
      },
      {
        id: "lf_friend_widow",
        cond: p=>C.adult(p)&&!C.old(p),
        cool: 12,
        w: .7,
        title: "A promise at the graveside",
        setup: (p,ctx)=>{const f=friendOf(p);A.kill(f,A.pick(["a fall from a roof","a fever","a kick from a horse","a winter cough"]));const w=mk(p,{sex:f.sex==="M"?"F":"M",ageAdj:C.ageAdj(f)});w.occ="the widow of your friend",w.sex==="M"&&(w.occ="the widower of your friend"),setPid(p,ctx,w),ctx.dead=f.given,ctx.cause=f.cause||"a fever",ctx.rite=rite(p)},
        text: "Your friend {dead} is dead of {cause}, {rite}. At the grave, {themFull}, left with three children and a debt, asks what is going to become of them.",
        choices: [
          {
            t: "Promise to help the family through the winter",
            r: "Firewood, grain, a roof mended. It costs you, and you never regret it.",
            fx: (p,ctx)=>{pay(p,4*purse(p)),bump(p,T(ctx),30,"friend","friend"),hon(p,4),hp(p,-4),A.willGrow(p,1.2,"grief")},
          },
          {
            t: "Speak for them to {dead}'s creditors",
            check: {s:"persuasion",s2:"trade",d:43},
            win: {
              r: "You talk the debt down by half and the term up by two years. {them} weeps with relief.",
              fx: {them:{type:"friend",op:30,back:"friend"},skill:{persuasion:2},honor:2,wil:1},
            },
            lose: {
              r: "The creditors want their money. All you can do is stand with {them} while they take the cow.",
              fx: {them:{type:"friend",op:15,back:"friend"},wil:1.5,happy:-6},
            },
          },
          {
            t: "Grieve, and keep to your own house",
            r: "You have your own mouths to feed. You tell yourself so, often.",
            fx: {wil:1,happy:-6,honor:-1},
          },
        ],
      },
      {
        id: "lf_friend_secret_told",
        cond: p=>C.adult(p)||C.teen(p),
        cool: 10,
        title: "A secret on everyone's lips",
        setup: (p,ctx)=>{setPid(p,ctx,friendOf(p)),ctx.drink=dry(p)?"date wine":drink(p),ctx.sec=A.pick(["that you are in love with the smith's child","that your father drinks","that you cannot read","that you cried at your grandmother's grave for a week","about the money you hide in the thatch"])},
        text: "You told one person {sec}: {them}. Now the whole of {home} knows. {them} swears it was an accident, a slip after too much {drink}.",
        choices: [
          {
            t: "Forgive {themHim}",
            check: {s:"wil",s2:"diplomacy",d:35},
            win: {
              r: "You forgive {themHim}, and mean it. {them} spends a year trying to deserve it.",
              fx: {them:{op:10},wil:.8,happy:1},
            },
            lose: {r:"You say the words. Your trust does not follow them.",fx:{them:{op:-10},wil:.5}},
          },
          {
            t: "Tell one of {theirHis} secrets back",
            check: {s:"intrigue",s2:"deception",d:37},
            win: {
              r: "An eye for an eye. The village has something new to talk about, and {them} knows exactly why.",
              fx: {them:{type:"rival",op:-25,back:"rival"},skill:{intrigue:2}},
            },
            lose: {
              r: "Everybody knows where the second tale came from. You look petty, and worse.",
              fx: {them:{type:"rival",op:-20,back:"rival"},honor:-4},
            },
          },
          {
            t: "End the friendship",
            r: "You stop speaking. {them} tries twice, then stops trying.",
            fx: {them:{type:"acquaint",op:-30,back:"acquaint"},wil:.8,happy:-3},
          },
        ],
      },
      {
        id: "lf_friend_saved_you",
        cond: p=>C.adult(p)&&p.health<60,
        cool: 10,
        title: "Somebody came",
        setup: (p,ctx)=>setPid(p,ctx,friendOf(p)),
        text: "You have been poorly a long while. Today {them} came with a pot of broth, chopped your wood, fed your animals and sat with you till dark without being asked.",
        choices: [
          {
            t: "Thank {themHim} with a gift when you are well",
            r: "Your best knife, or your best hen. {them} protests and keeps it.",
            fx: {them:{type:"bestfriend",op:25,back:"bestfriend"},coin:-2,health:4,happy:6},
          },
          {
            t: "Tell {themHim} what it means to you",
            check: {s:"persuasion",s2:"wil",d:30},
            win: {
              r: "The words come out right for once. {them} looks at the floor, pleased.",
              fx: {them:{type:"bestfriend",op:30,back:"bestfriend"},health:5,happy:8},
            },
            lose: {r:"You mumble. {them} understands anyway.",fx:{them:{op:15},health:4,happy:4}},
          },
          {
            t: "Send {themHim} away: you are no charity case",
            r: "Pride. {them} goes. The broth stays, and you eat it.",
            fx: {them:{op:-8},wil:.8,health:2},
          },
        ],
      },
    ]);
    const rivalOf=p=>known(p,["rival","enemy"],"rival",-25);
    add([
      {
        id: "lf_rival_slander",
        cond: p=>C.adult(p),
        cool: 8,
        title: "Slander",
        setup: (p,ctx)=>{setPid(p,ctx,rivalOf(p)),ctx.court=judgeShort(p),ctx.tale=A.pick(["you water your ale","you short-weigh your grain","you were seen at the hidden altar of the Ashen","you beat your animals","your last apprentice ran away for good reason"])},
        text: "Your rival {them} has been telling the market that {tale}. Two customers have already crossed the street to avoid you.",
        choices: [
          {
            t: "Take {themHim} before {court}",
            check: {s:"persuasion",s2:"learning",d:45},
            win: {
              r: "You bring witnesses and win. {them} is fined and must unsay it in public, red to the ears.",
              fx: {them:{op:-15},honor:5,fame:1},
            },
            lose: {
              r: "The court finds nothing proven either way. Now everyone has heard the tale twice.",
              fx: {them:{op:-10},honor:-3,coin:-3},
            },
          },
          {
            t: "Answer with a better tale about {themHim}",
            check: {s:"deception",s2:"intrigue",d:40},
            win: {
              r: "Yours is funnier and spreads faster. Within a week nobody remembers what {them} said about you.",
              fx: {them:{op:-20},skill:{deception:2},honor:-1},
            },
            lose: {
              r: "Your tale is traced back to you, and now you are both liars in the eyes of {home}.",
              fx: {them:{op:-15},honor:-5},
            },
          },
          {
            t: "Let your work speak for itself",
            r: "It takes a season. Customers drift back. {them} looks for another target.",
            fx: {coin:-4,wil:.8,honor:2},
          },
        ],
      },
      {
        id: "lf_rival_contest",
        cond: p=>(C.adult(p)||C.teen(p))&&!C.old(p),
        cool: 6,
        title: "Beat {them} in front of everyone",
        setup: (p,ctx)=>{setPid(p,ctx,rivalOf(p));const c=A.pick([["a stone-throw at the fair","str","athletics"],["the race round the village bounds","spd","athletics"],["the archery butts","ins","bow"],["a wrestling bout on the green","str","unarmed"],["a ploughing match","sta","husbandry"]]);ctx.what=c[0],ctx.cs=c[1],ctx.ck=c[2]},
        text: "Your rival {them} has entered {what}, and so have you. The whole village is watching, and the betting is on {themHim}.",
        choices: [
          {
            t: "Give it everything",
            check: {s:"athletics",s2:"str",d:40},
            win: {
              r: "You win, by a hand. {them} has to shake your hand in front of everyone. The ale is free tonight.",
              fx: (p,ctx)=>{A.train(p,ctx.cs||"str",.6),A.trainSkill(p,ctx.ck||"athletics",2),A.fame(p,2),hp(p,6),bump(p,T(ctx),-8)},
            },
            lose: {
              r: "{them} wins. {theyHe} does not crow, which is worse.",
              fx: (p,ctx)=>{A.train(p,ctx.cs||"str",.4),hp(p,-4),A.willGrow(p,.8,"defeat")},
            },
          },
          {
            t: "Bet on yourself (5 suns)",
            req: p=>p.coin>=5,
            check: {s:"athletics",s2:"wil",d:43},
            win: {
              r: "Long odds, a good day. You win the contest and fifteen suns besides.",
              fx: {coin:15,fame:2,happy:8,skill:{gambling:1}},
            },
            lose: {r:"Lost the contest and the coin. {them} buys you a drink with it.",fx:{coin:-5,happy:-5,wil:.5}},
          },
          {
            t: "Cheat a little",
            check: {s:"deception",s2:"spd",d:45},
            win: {
              r: "A nudge at the right moment. Nobody sees. You win, and it tastes slightly off.",
              fx: {fame:1,honor:-2,them:{op:-10}},
            },
            lose: {
              r: "Everybody sees. You are thrown out of the contest and {them} wins by default.",
              fx: {honor:-8,happy:-6,them:{op:-10}},
            },
          },
        ],
      },
      {
        id: "lf_enemy_road",
        cond: p=>C.adult(p)&&!C.old(p)&&(C.hasRel(p,"enemy","rival")||A.chance(.25)),
        cool: 10,
        w: .7,
        title: "Waiting on the road",
        setup: (p,ctx)=>{setPid(p,ctx,relP(p,["enemy"])||rivalOf(p))},
        text: 'Coming home from {town} after dark, you find {them} waiting at the bridge with a cudgel and a friend. "We have things to settle," {theyHe} says.',
        choices: [
          {
            t: "Fight",
            r: "No witnesses, no judge. Just the bridge and the dark.",
            fx: {
              duel: {
                foe: "them",
                tier: 2,
                opts: {kind:"brawl",place:"the bridge at night",lethal:!1,toYield:!0,title:"At the bridge"},
              },
              them: {type:"enemy",op:-15},
            },
          },
          {
            t: "Talk {themHim} down",
            check: {s:"persuasion",s2:"wil",d:45},
            win: {
              r: "You make {themHim} think about the hanging tree. {them} spits, and lets you pass.",
              fx: {them:{op:5},skill:{persuasion:2}},
            },
            lose: {
              r: "Talk only makes {themHim} angrier. The cudgel comes up.",
              fx: {
                duel: {
                  foe: "them",
                  tier: 2,
                  opts: {kind:"brawl",place:"the bridge at night",lethal:!1,toYield:!0,title:"At the bridge"},
                },
              },
            },
          },
          {
            t: "Run back the way you came",
            check: {s:"athletics",s2:"spd",d:35},
            win: {
              r: "You lose them in the hedges and go home the long way, muddy and furious.",
              fx: {spd:.3,honor:-1,wil:.5},
            },
            lose: {
              r: "They catch you at the ditch. A beating, two kicks and laughter.",
              fx: {health:-12,cause:"a beating on the road",honor:-2,wil:1},
            },
          },
        ],
      },
      {
        id: "lf_rival_fire",
        cond: p=>C.adult(p),
        cool: 12,
        w: .7,
        title: "Your rival's roof is burning",
        setup: (p,ctx)=>setPid(p,ctx,rivalOf(p)),
        text: "Smoke over the lane: {them}'s house is on fire, and {theirHis} children are screaming in the yard. The hue and cry has gone up and every neighbor must answer it. But you could be slow.",
        choices: [
          {
            t: "Lead the bucket line",
            check: {s:"command",s2:"sta",d:35},
            win: {
              r: "You get them organized from the well to the roof. The fire is out by dawn and half the house still stands. {them} cannot look you in the eye.",
              fx: {them:{type:"friend",op:40,back:"friend"},honor:4,fame:1,skill:{command:1}},
            },
            lose: {
              r: "The house is lost, but nobody dies. {them} saw you there, black with soot.",
              fx: {them:{op:25},health:-6,cause:"smoke",wound:"burn",honor:3},
            },
          },
          {
            t: "Go into the smoke for the old grandmother",
            check: {s:"athletics",s2:"wil",d:47},
            win: {
              r: "You come out with her over your shoulder, both of you coughing. Old feuds do not survive a thing like that.",
              fx: {
                them: {type:"friend",op:50,back:"friend"},
                honor: 6,
                fame: 3,
                health: -5,
                cause: "smoke",
                deed: "Carried an old woman out of a burning house",
              },
            },
            lose: {
              r: "The smoke drives you back. Others get her out. You get the burns.",
              fx: {them:{op:20},health:-14,cause:"burns",wound:"burn",wil:1},
            },
          },
          {
            t: "Answer the cry, slowly",
            r: "You arrive with a bucket after the roof falls in. Nobody can prove a thing. {them} knows.",
            fx: {them:{type:"enemy",op:-20,back:"enemy"},honor:-4},
          },
        ],
      },
      {
        id: "lf_rival_peace",
        cond: p=>C.adult(p)&&frac(p)>.25,
        cool: 10,
        title: "An old rival comes to the door",
        setup: (p,ctx)=>setPid(p,ctx,rivalOf(p)),
        text: `{them} is at your door with a jug and {theirHis} hat in {theirHis} hand. "We are both getting old for this. I don't even remember how it started."`,
        choices: [
          {
            t: "Take the jug and let {themHim} in",
            r: "You remember how it started. So does {them}. You laugh about it anyway, which is new.",
            fx: {them:{type:"friend",op:40,back:"friend"},happy:6,wil:.5},
          },
          {
            t: "Accept the peace, but keep the door shut",
            r: "A handshake on the step. Cool, civil, final.",
            fx: {them:{type:"acquaint",op:25,back:"acquaint"},honor:1},
          },
          {
            t: "Slam the door",
            r: "Some grudges are worth keeping warm. {them} goes away with the jug.",
            fx: {them:{type:"enemy",op:-15,back:"enemy"},trait:"vengeful"},
          },
        ],
      },
      {
        id: "lf_rival_sabotage",
        cond: p=>C.adult(p)&&!!p.job&&!unfree(p),
        cool: 8,
        title: "Somebody did this",
        setup: (p,ctx)=>{setPid(p,ctx,rivalOf(p)),ctx.harm=A.pick(["your tools have been thrown in the millpond","sand has been tipped into your grain","someone has let your animals out onto the lord's wheat","your stall has been knocked flat in the night"])},
        text: "This morning {harm}. Nobody saw anything. Everybody looks at {them}.",
        choices: [
          {
            t: "Track down proof",
            check: {s:"tracking",s2:"int",d:41},
            win: {
              r: "A bootprint, a torn sleeve on a nail, a boy paid a penny to keep watch. You have {themHim}. The reeve makes {themHim} pay double.",
              fx: {coin:8,them:{op:-15},honor:2,skill:{tracking:2}},
            },
            lose: {r:"You find nothing you could put before a court. You replace what was lost.",fx:{coin:-6,wil:.6}},
          },
          {
            t: "Do the same back to {themHim}",
            check: {s:"stealth",s2:"int",d:43},
            win: {
              r: "A night visit, nothing traced. {them} wakes to the same mess. A grim kind of balance.",
              fx: {them:{type:"enemy",op:-20,back:"enemy"},honor:-3,skill:{stealth:2}},
            },
            lose: {
              r: "The watch catches you at {theirHis} gate.",
              fx: {punish:"theft",them:{type:"enemy",op:-25,back:"enemy"}},
            },
          },
          {
            t: "Shrug, repair, and go on",
            r: "You lose a few days and some coin. {them} loses interest when you do not react.",
            fx: {coin:-5,wil:1,perf:-2},
          },
        ],
      },
      {
        id: "lf_rival_dies",
        cond: p=>C.adult(p)&&frac(p)>.25,
        cool: 15,
        w: .6,
        title: "Your rival is dead",
        setup: (p,ctx)=>{const r=setPid(p,ctx,rivalOf(p)),cz=A.pick(["a fever","a fall from a horse","a winter cough","a bad heart"]);A.kill(r,cz),ctx.cause=cz,ctx.rite=rite(p)},
        text: "{them} is dead, of {cause}. You have hated {themHim}, or at least disliked {themHim} carefully, for most of your life. Tomorrow {theyHe} will be {rite}. Half the village is watching to see if you come.",
        choices: [
          {
            t: "Go, and grieve honestly",
            r: "You stand at the back. To your surprise your eyes sting. A good enemy is a part of your life too.",
            fx: {honor:3,wil:1,happy:-3},
          },
          {
            t: "Go, and speak well of {themHim}",
            check: {s:"persuasion",s2:"etiquette",d:35},
            win: {
              r: "You find true things to say. {them}'s family thanks you, and the feud dies with {themHim}.",
              fx: {honor:5,fame:1,skill:{etiquette:1}},
            },
            lose: {r:"It comes out sour. The family hears what you did not say.",fx:{honor:-2}},
          },
          {
            t: "Stay home and drink to it",
            r: "You raise a cup to the empty space where {them} used to be. It feels less good than you expected.",
            fx: {honor:-3,happy:2},
          },
        ],
      },
      {
        id: "lf_blood_price",
        cond: p=>C.adult(p)&&C.realm(p,"POL-01","POL-08","POL-13","POL-25","POL-19","POL-11","POL-34")&&!C.old(p),
        cool: 15,
        w: .6,
        title: "Blood-price",
        setup: (p,ctx)=>{const v=mk(p);A.kill(v,"a knife in a quarrel"),A.link(p,v,"cousin",30,"cousin"),ctx.vic=v.given;const k=setPid(p,ctx,mk(p,{sex:"M"}));ctx.price=law(p)==="orc"?"fifty horses":p.realm==="POL-25"?"sixty sables":p.realm==="POL-01"?"the price the law sets for a free man":p.realm==="POL-19"?"a price in camels set by the elders":"the price set at the Thing"},
        text: "Your cousin {vic} has been killed in a quarrel by {themFull}, {themOcc}. By the law of your people, {them}'s kin may pay the blood-price, {price}, or the feud is open. Your family looks to you.",
        choices: [
          {
            t: "Accept the blood-price",
            r: "The price is paid in front of witnesses. It does not bring {vic} back, but it ends things. Your share is real coin.",
            fx: p=>{const v=10*purse(p);return p.coin+=v,hon(p,1),A.willGrow(p,1,"grief"),`(Your share: ${v} suns.)`},
          },
          {
            t: "Refuse it: blood for blood",
            r: "You take the feud on yourself. Somewhere, {them} hears, and starts sleeping with a knife.",
            fx: {them:{type:"enemy",op:-80,back:"enemy"},trait:"vengeful",honor:2,flag:"lf_feud"},
          },
          {
            t: "Negotiate a higher price",
            check: {s:"diplomacy",s2:"intimidation",d:47},
            win: {
              r: "You argue {vic}'s worth up a third, with the whole kin-band behind you. The killer's family pays and hates you for it.",
              fx: p=>{const v=14*purse(p);return p.coin+=v,A.trainSkill(p,"diplomacy",2),`(Your share: ${v} suns.)`},
            },
            lose: {
              r: "They walk out of the talks. Now there is a feud, and you did not choose it.",
              fx: {them:{type:"enemy",op:-50,back:"enemy"},flag:"lf_feud",wil:.8},
            },
          },
        ],
      },
      {
        id: "lf_feud_strike",
        cond: p=>C.adult(p)&&C.flag(p,"lf_feud")&&C.hasRel(p,"enemy"),
        cool: 6,
        title: "The feud comes calling",
        setup: (p,ctx)=>setPid(p,ctx,relP(p,["enemy"])),
        text: "Your feud with {them}'s kin has gone on long enough that the children know the names. Tonight two of them are waiting by your door with knives.",
        choices: [
          {
            t: "Fight them off",
            r: "In the dark, with whatever is to hand.",
            fx: {
              duel: {
                tier: 3,
                title: "two feud-men",
                opts: {kind:"brawl",place:"your own doorway at night",lethal:!0,toYield:!1,title:"The feud"},
              },
            },
          },
          {
            t: "Bar the door and wait for the neighbors",
            check: {s:"wil",s2:"command",d:40},
            win: {
              r: "You shout the hue and cry through the shutters. Lanterns come. The feud-men melt away.",
              fx: {wil:1,happy:-2},
            },
            lose: {
              r: "They fire the thatch before the neighbors come. You get out. The roof does not.",
              fx: {coinPct:-.3,wound:"burn",health:-8,cause:"fire",wil:1.5},
            },
          },
          {
            t: "Send word: you will pay to end it",
            r: "The elders are called. It costs you dear, and it is over.",
            fx: p=>{const v=pay(p,15*purse(p));return delete p.flags.lf_feud,A.willGrow(p,1,"peace"),`(It costs ${v} suns. The feud is ended.)`},
          },
        ],
      },
      {
        id: "lf_rival_marries_well",
        cond: p=>C.adult(p)&&!C.old(p)&&!high(p),
        cool: 12,
        title: "Your rival marries money",
        setup: (p,ctx)=>setPid(p,ctx,rivalOf(p)),
        text: "{them} has married into the richest family in {home}. Now {theyHe} drives a cart with painted wheels and bows to you very, very politely.",
        choices: [
          {
            t: "Be gracious about it",
            check: {s:"etiquette",s2:"wil",d:35},
            win: {
              r: "You congratulate {themHim} so warmly that {theyHe} has no idea what to do. Your stock rises in {home}.",
              fx: {honor:3,wil:.6,them:{op:8}},
            },
            lose: {r:"It sounds like sarcasm even to you.",fx:{honor:-1,them:{op:-5}}},
          },
          {
            t: "Work twice as hard this year",
            r: "Envy is a fine whip. You earn more than ever, and sleep less.",
            fx: {coin:12,sta:.4,health:-3,cause:"overwork",perf:4,trait:"ambitious"},
          },
          {
            t: "Sulk at the alehouse",
            r: "Several evenings of telling anyone who will listen. Nobody will.",
            fx: {happy:-4,coin:-2},
          },
        ],
      },
    ]);
    const kidPid = (p,ctx,lo,hi)=>setPid(p,ctx,kid(p,lo,hi)),
      myCraft = p=>{const best=Object.keys(p.skills||{}).filter(k=>GD.SKILLS[k]).sort((a,b)=>(p.skills[b]||0)-(p.skills[a]||0))[0];return best&&p.skills[best]>=20?best:p.job?{farm:"husbandry",herd:"husbandry",fish:"sea",smith:"craft",mason:"craft",weaver:"craft",bowyer:"craft",carpenter:"craft",brewer:"craft",merchant:"trade",scribe:"learning",healer:"medicine",clergy:"faith",sailor:"sea",hunter:"tracking",minstrel:"music",thief:"stealth"}[p.job.c]||"craft":"husbandry"};
    add([
      {
        id: "lf_kid_other_life",
        cond: p=>C.adult(p)&&hasKid(p,13,20),
        cool: 8,
        title: "Not the life you planned",
        setup: (p,ctx)=>{kidPid(p,ctx,13,20);const o=A.pick([["go to sea","sea"],["take vows at the temple","faith"],["join a mercenary company","melee"],["learn letters from the scribe in {town}","learning"],["be a minstrel on the roads","music"],["be apprenticed to a healer","medicine"]]);ctx.dream=o[0],ctx.dsk=o[1],ctx.plan=p.job?"follow you into your trade":high(p)?"make the marriage your family has arranged":"work the family land after you"},
        text: "You always meant your {sd} {them} to {plan}. Tonight {them} told you, white-faced and stubborn, that {theyHe} means to {dream} instead.",
        choices: [
          {
            t: "Give your blessing",
            r: "{them} hugs you so hard your ribs creak. You pack {themHim} bread and your second-best knife.",
            fx: (p,ctx)=>{const t=T(ctx);bump(p,t,25),t&&(t.skills=t.skills||{},t.skills[ctx.dsk]=(t.skills[ctx.dsk]||0)+15),hp(p,-2),A.willGrow(p,.6,"letting go")},
          },
          {
            t: "Forbid it",
            check: {s:"intimidation",s2:"wil",d:40},
            win: {
              r: "{them} obeys. {theyHe} works beside you every day after, and never quite meets your eye.",
              fx: {them:{op:-20},perf:2},
            },
            lose: {
              r: "{them} is gone before dawn, with {theirHis} boots and your second-best knife.",
              fx: {them:{op:-35},happy:-10,wil:1.5},
            },
          },
          {
            t: "Strike a bargain: one more year, then go with your blessing",
            check: {s:"diplomacy",s2:"persuasion",d:35},
            win: {
              r: "{them} agrees. The year is the best you have had together. Then you keep your word.",
              fx: {them:{op:15},honor:2,happy:3},
            },
            lose: {
              r: "{them} agrees, then decides a year is too long and leaves at Midsummer.",
              fx: {them:{op:-5},happy:-5},
            },
          },
        ],
      },
      {
        id: "lf_kid_healer",
        cond: p=>C.adult(p)&&hasKid(p,0,12),
        cool: 6,
        title: "A child with the cough",
        setup: (p,ctx)=>{kidPid(p,ctx,0,12),ctx.heal=healer(p),ctx.ill=A.pick(["a barking cough that gets worse at night","the summer flux","a fever that comes and goes","a rash and a fever"])},
        text: "Your {sd} {them} has {ill}. Every mother in {home} has an opinion. You have to choose who to trust.",
        choices: [
          {
            t: "Fetch {heal} (a few pence)",
            r: (p,ctx)=>ctx.ok?"Willow bark, a steam tent, clean water boiled. In a week {them} is chasing hens again.":"The teas do what they can. It is a long, frightening month, but {them} comes through it thinner.",
            fx: (p,ctx)=>{ctx.ok=A.chance(.6),bump(p,T(ctx),6),A.willGrow(p,.6,"worry")},
          },
          {
            t: "Pay for the physician from town (4 suns)",
            req: p=>p.coin>=4,
            r: (p,ctx)=>A.chance(.5)?"He reads the urine, frowns at the stars and bleeds the child. {them} gets better anyway. You will never know why.":"He bleeds the child, which makes things worse, and charges for it. {them} pulls through in spite of him.",
            fx: {coin:-4,wil:.6},
          },
          {
            t: "Nurse {themHim} yourself",
            check: {s:"medicine",s2:"wil",d:35},
            win: {
              r: "Broth, warmth, clean water and no bleeding. You do not sleep for five nights. On the sixth, {them} asks for bread.",
              fx: {them:{op:15},skill:{medicine:2},wil:1},
            },
            lose: {
              r: (p,ctx)=>ctx.died?"You do everything you know. It is not enough. {them} dies at dawn, very small in your arms.":"It is the worst month of your life. {them} lives, but you look ten years older.",
              fx: (p,ctx)=>{const t=T(ctx);return t&&A.chance(.15)?(ctx.died=1,A.kill(t,ctx.ill),hp(p,-30),A.willGrow(p,3,"grief"),""):(hp(p,-5),A.willGrow(p,1.2,"fear"),"")},
            },
          },
        ],
      },
      {
        id: "lf_kid_school",
        cond: p=>C.adult(p)&&hasKid(p,6,13)&&!slave(p),
        cool: 8,
        title: "A place at the school",
        setup: (p,ctx)=>{kidPid(p,ctx,6,13),ctx.cost=6*Math.max(1,Math.round(purse(p)/2)),ctx.cl=clergy(p),ctx.school=p.faith==="REL-06"?"the monastery school":law(p)==="well"?"the well-house school, where paper is cheap and every child learns the Book":"the temple school in {town}"},
        text: "The {cl} says your {sd} {them} is quick: counts faster than you, remembers every story. There is a place at {school}, if you can pay {cost} suns a year and spare {themHim} from the work.",
        choices: [
          {
            t: "Pay, and send {themHim}",
            req: (p,C2,ctx)=>p.coin>=ctx.cost,
            r: "{them} comes home at the holy days full of words you do not know. One day {theyHe} will read your contracts for you.",
            fx: (p,ctx)=>{pay(p,ctx.cost);const t=T(ctx);t&&(t.literate=!0,t.skills=t.skills||{},t.skills.learning=(t.skills.learning||0)+20),bump(p,t,15),hp(p,4)},
          },
          {
            t: "Teach {themHim} what you can at night",
            req: p=>p.literate,
            r: "Letters chalked on the hearthstone by firelight. Slow, but {them} learns, and so do you.",
            fx: (p,ctx)=>{const t=T(ctx);t&&(t.literate=!0),bump(p,t,15),A.trainSkill(p,"learning",1)},
          },
          {
            t: "Ask the {cl} for charity",
            check: {s:"faith",s2:"persuasion",d:40},
            win: {
              r: "The {cl} finds a widow's bequest for poor scholars. {them} goes for nothing.",
              fx: (p,ctx)=>{const t=T(ctx);t&&(t.literate=!0),bump(p,t,15),pie(p,2)},
            },
            lose: {r:"There is no charity this year. {them} stays home and herds geese.",fx:{them:{op:-5},happy:-3}},
          },
          {
            t: "Keep {themHim} home: the work needs hands",
            r: "A sensible choice for a family like yours. {them} cries for a week, then forgets, mostly.",
            fx: {them:{op:-8},coin:3},
          },
        ],
      },
      {
        id: "lf_kid_teach_craft",
        cond: p=>C.adult(p)&&hasKid(p,8,16),
        cool: 5,
        title: "Teaching the trade",
        setup: (p,ctx)=>{kidPid(p,ctx,8,16),ctx.sk=myCraft(p),ctx.skn=String(typeof GD.SKILLS[ctx.sk]=="string"?GD.SKILLS[ctx.sk]:ctx.sk).toLowerCase()},
        text: "Your {sd} {them} has started hanging about while you work, watching your hands. Today {theyHe} asked to try. You know more {skn} than anyone {theyHe} will ever meet.",
        choices: [
          {
            t: "Teach {themHim} patiently",
            check: {s:"wil",s2:"int",d:33},
            win: {
              r: "Hours together over the work. {them} has your hands and {theirHis} own eye. Teaching makes you better too.",
              fx: (p,ctx)=>{const t=T(ctx);t&&(t.skills=t.skills||{},t.skills[ctx.sk]=(t.skills[ctx.sk]||0)+12),bump(p,t,18),A.trainSkill(p,ctx.sk,1.5),hp(p,5)},
            },
            lose: {
              r: "You lose your temper over a spoiled piece. {them} cries. You both try again next week, more carefully.",
              fx: (p,ctx)=>{bump(p,T(ctx),-4),A.willGrow(p,.4,"patience")},
            },
          },
          {
            t: "Teach {themHim} the way you were taught: hard",
            r: "Blows and shouting, the old way. {them} learns fast and loves the work less.",
            fx: (p,ctx)=>{const t=T(ctx);t&&(t.skills=t.skills||{},t.skills[ctx.sk]=(t.skills[ctx.sk]||0)+15),bump(p,t,-10)},
          },
          {
            t: "Send {themHim} off: you want better for {themHim}",
            r: '"Not this. You will do better than this." {them} looks hurt, then thoughtful.',
            fx: {them:{op:-3},wil:.3},
          },
        ],
      },
      {
        id: "lf_kid_first_fight",
        cond: p=>C.adult(p)&&hasKid(p,6,14),
        cool: 6,
        title: "A bloody nose",
        setup: (p,ctx)=>{kidPid(p,ctx,6,14),ctx.why=A.pick(["the reeve's boy called your family beggars","a bigger child was kicking a dog","somebody said your mother was a foreigner","nobody will say why"])},
        text: "Your {sd} {them} comes home with a bloody nose, a torn shirt and split knuckles. The other child is worse. The reason, eventually, is that {why}.",
        choices: [
          {
            t: "Teach {themHim} to fight properly",
            req: p=>C.prof(p,"unarmed",25)||C.prof(p,"melee",25)||C.stat(p,"str")>=30,
            r: "Feet planted, thumb outside the fist, never the first blow. {them} listens to every word.",
            fx: (p,ctx)=>{const t=T(ctx);t&&(t.skills=t.skills||{},t.skills.unarmed=(t.skills.unarmed||0)+10),bump(p,t,12),A.trainSkill(p,"unarmed",1)},
          },
          {
            t: "Make {themHim} apologize to the other family",
            check: {s:"etiquette",s2:"wil",d:33},
            win: {
              r: "A stiff apology, a basket of eggs. The parents shake hands. {them} learns what grace costs.",
              fx: {them:{op:-4},honor:3},
            },
            lose: {
              r: "The other family will not have it. The quarrel moves up a generation, to you.",
              fx: {newRel:{type:"rival",op:-20}},
            },
          },
          {
            t: "Tell {themHim} you are proud",
            r: "{them} straightens up like a little soldier. Your spouse is less pleased with you.",
            fx: {them:{op:15},rel:{who:"spouse",op:-4}},
          },
          {
            t: "Punish {themHim}",
            r: "No supper and a week of extra chores. {them} thinks the world is unjust. {theyHe} is not wrong.",
            fx: {them:{op:-10}},
          },
        ],
      },
      {
        id: "lf_kid_thief",
        cond: p=>C.adult(p)&&hasKid(p,5,14),
        cool: 7,
        title: "Something that is not ours",
        setup: (p,ctx)=>{kidPid(p,ctx,5,14),ctx.thing=A.pick(["a silver ribbon","a clasp knife","three honey cakes","a small brass bell","a coin with a king's face"])},
        text: "You find {thing} hidden under {them}'s bedding. It is not yours. {them} says {theyHe} found it. {theyHe} is a bad liar, which is something.",
        choices: [
          {
            t: "Take {themHim} to return it and confess",
            check: {s:"persuasion",s2:"etiquette",d:33},
            win: {
              r: "The stallholder is gruff but touched. {them} sweeps his stall for a week. A lesson that sticks.",
              fx: {them:{op:4},honor:2},
            },
            lose: {
              r: "The stallholder shouts for the reeve. It takes a sun and a lot of bowing to settle it.",
              fx: {coin:-1,honor:-2,them:{op:-4}},
            },
          },
          {
            t: "Return it yourself, quietly",
            r: "You slip it back where it came from. {them} gets a long talk instead of a public shame.",
            fx: {them:{op:6}},
          },
          {
            t: "Thrash {themHim}",
            r: "Your father did the same to you. {them} does not steal again, or does not get caught.",
            fx: {them:{op:-12}},
          },
          {
            t: "Let it go: children are children",
            r: "You put it back under the bedding. {them} learns that you will not look.",
            fx: {honor:-2,them:{op:4}},
          },
        ],
      },
      {
        id: "lf_kid_death_question",
        cond: p=>C.adult(p)&&hasKid(p,4,11),
        cool: 8,
        title: '"Where do the dead go?"',
        setup: (p,ctx)=>{kidPid(p,ctx,4,11),ctx.nb=A.givenName(p.cult,"F");const f=A.faith(p.faith);ctx.aft=f&&f.afterlife?String(f.afterlife).split(". ")[0].replace(/\.$/,""):"The dead go where the gods send them"},
        text: "Your {sd} {them} has been very quiet since old {nb} next door was buried. At bedtime {theyHe} asks where the dead go, and whether it hurts, and whether you will go too.",
        choices: [
          {
            t: "Tell {themHim} what the faith teaches",
            check: {s:"faith",s2:"persuasion",d:32},
            win: {
              r: '"{aft}." You say it so that you believe it yourself. {them} falls asleep holding your hand.',
              fx: {them:{op:12},piety:2},
            },
            lose: {
              r: "You recite it, and {them} asks a question you cannot answer. You sit up with {themHim} until dawn.",
              fx: {them:{op:8},wil:.4},
            },
          },
          {
            t: "Tell {themHim} a story about old {nb} instead",
            r: "The time she chased the reeve off with a broom. {them} laughs, then cries, then sleeps.",
            fx: {them:{op:15},happy:2},
          },
          {
            t: "Tell {themHim} the truth: nobody knows",
            r: '{them} thinks about that a long time. "Then we should be kind while we are here." Out of the mouths of children.',
            fx: {them:{op:8},int:.3,piety:-1},
          },
        ],
      },
      {
        id: "lf_kid_bad_match",
        cond: p=>C.adult(p)&&hasKid(p,15,30),
        cool: 9,
        title: "The one your child loves",
        setup: (p,ctx)=>{const c=kidPid(p,ctx,15,30),m=mk(p,{sex:c&&c.sex==="M"?"F":"M",ageAdj:17+A.ri(0,6)});ctx.mid=m.id,ctx.m=m.given,ctx.flaw=A.pick(["is a penniless fiddler","comes from the family your family has feuded with for three generations","keeps another faith","has a reputation for the dice-house","is a half-orc oarsman from the harbor"])},
        text: "Your {sd} {them} wants to marry {m}, who {flaw}. {them} has made up {theirHis} mind. {theyHe} is waiting to see if you will make it a war.",
        choices: [
          {
            t: "Bless the match",
            r: "A small wedding, a big argument with your relatives, and a happy {sd}. {m} turns out better than you feared.",
            fx: (p,ctx)=>{const c=T(ctx),m=A.P(ctx.mid);bump(p,c,25),c&&m&&!spouseOf(c)&&(c.spouse=m.id,m.spouse=c.id,A.link(c,m,"spouse",50,"spouse"),A.link(p,m,"inlaw",20,"inlaw")),hp(p,4)},
          },
          {
            t: "Meet {m} first, properly",
            check: {s:"int",s2:"etiquette",d:35},
            win: {
              r: "A long supper. You see what {them} sees. You give your blessing, and mean it.",
              fx: (p,ctx)=>{const m=A.P(ctx.mid);m&&A.link(p,m,"inlaw",30,"inlaw"),bump(p,T(ctx),20)},
            },
            lose: {r:"You see exactly what you feared. {them} sees only that you disapprove.",fx:{them:{op:-12}}},
          },
          {
            t: "Forbid it",
            check: {s:"intimidation",s2:"wil",d:45},
            win: {
              r: "It ends with tears. {them} marries someone suitable in time, and never mentions {m} again.",
              fx: {them:{op:-25},honor:1},
            },
            lose: {
              r: "{them} elopes to {town}. You hear about the wedding from a peddler.",
              fx: {them:{op:-40},happy:-12,wil:1.5},
            },
          },
        ],
      },
      {
        id: "lf_kid_lost_fair",
        cond: p=>C.adult(p)&&hasKid(p,2,9)&&!slave(p),
        cool: 6,
        title: "Lost at the fair",
        setup: (p,ctx)=>{kidPid(p,ctx,2,9),ctx.fest=festOf(p)},
        text: "At {fest} the crowd is ten deep, and one moment {them} is holding your hand, and the next {theyHe} is not.",
        choices: [
          {
            t: "Search methodically, stall by stall",
            check: {s:"tracking",s2:"int",d:33},
            win: {
              r: "You find {themHim} at the sweet-seller's, entirely calm and sticky to the elbows.",
              fx: {them:{op:8},skill:{tracking:1}},
            },
            lose: {
              r: "Two hours of terror. A cooper brings {themHim} back to the well, crying. You hug {themHim} until {theyHe} complains.",
              fx: {wil:1,happy:-3},
            },
          },
          {
            t: "Climb a cart and shout",
            check: {s:"command",s2:"wil",d:30},
            win: {
              r: "Half the fair joins the search. {them} is found in minutes, delighted by the attention.",
              fx: {fame:1,skill:{command:1}},
            },
            lose: {
              r: "Nobody pays attention to one more shouting parent. You find {themHim} anyway, eventually.",
              fx: {wil:.6,happy:-2},
            },
          },
          {
            t: "Ask the mummers, who see everything",
            r: "The juggler points without dropping a ball. {them} is watching a dancing bear with an expression of perfect bliss.",
            fx: {happy:2,them:{op:4}},
          },
        ],
      },
      {
        id: "lf_kid_cruel_master",
        cond: p=>C.adult(p)&&hasKid(p,11,18)&&!slave(p),
        cool: 8,
        title: "Bruises",
        setup: (p,ctx)=>{const c=kidPid(p,ctx,11,18),m=mk(p,{status:"artisan",ageAdj:40});ctx.mid=m.id,ctx.m=m.given,ctx.trade=A.pick(["cooper","tanner","smith","dyer","mason"])},
        text: "Your {sd} {them} is apprenticed to {m} the {trade} for seven years, paid, as apprentices are, in food and blows. But {them} came home at the feast with more bruises than an apprentice should have, and flinches when you lift your hand.",
        choices: [
          {
            t: "Go and have words with {m}",
            check: {s:"intimidation",s2:"str",d:40},
            win: {
              r: "{m} looks at your face and your fists and remembers the guild rules. The bruises stop.",
              fx: (p,ctx)=>{bump(p,T(ctx),20);const m=A.P(ctx.mid);m&&A.link(p,m,"rival",-20,"rival")},
            },
            lose: {
              r: "{m} threatens to break the indenture and keep your bond money. {them} begs you to let it be.",
              fx: {them:{op:6},coin:-3},
            },
          },
          {
            t: "Complain to the guild",
            check: {s:"diplomacy",s2:"learning",d:43},
            win: {
              r: "The guild fines {m} and moves {them} to a better master. You have made an enemy and saved your child.",
              fx: (p,ctx)=>{bump(p,T(ctx),25);const m=A.P(ctx.mid);m&&A.link(p,m,"enemy",-40,"enemy"),hon(p,2)},
            },
            lose: {
              r: "The guild masters protect their own. {m} is warned; {them} pays for it.",
              fx: {them:{op:5},happy:-6,wil:1},
            },
          },
          {
            t: "Bring {themHim} home and break the indenture (10 suns)",
            req: p=>p.coin>=10,
            r: "You lose the bond money and {them} loses a trade. You do not care. {them} sleeps without flinching.",
            fx: {coin:-10,them:{op:30},happy:2},
          },
        ],
      },
      {
        id: "lf_kid_gang",
        cond: p=>C.adult(p)&&hasKid(p,12,17)&&C.town(p),
        cool: 8,
        title: "Bad company",
        setup: (p,ctx)=>kidPid(p,ctx,12,17),
        text: "Your {sd} {them} has fallen in with a crew of older youths who run errands for a fence near the docks. {theyHe} came home last night with a new cloak and no explanation.",
        choices: [
          {
            t: "Follow {themHim} and see for yourself",
            check: {s:"stealth",s2:"int",d:37},
            win: {
              r: "You see the fence, the stolen goods and your child holding a lantern. You drag {themHim} home by the ear before anyone else sees.",
              fx: {them:{op:-5},skill:{stealth:1},wil:.6},
            },
            lose: {r:"The crew spots you. They laugh at {them}, and {theyHe} hates you for it.",fx:{them:{op:-15}}},
          },
          {
            t: "Have a word with the fence",
            check: {s:"intimidation",s2:"intrigue",d:47},
            win: {
              r: "He sees you mean it, and that you know the watch-captain. {them} is out of the crew by morning.",
              fx: {them:{op:-5},skill:{intimidation:2}},
            },
            lose: {
              r: "The fence smiles and says your child is free to choose. A week later your shutters are broken.",
              fx: {coin:-5,happy:-4},
            },
          },
          {
            t: "Find {themHim} honest work with a friend",
            r: "A carter who needs a quick pair of hands. {them} grumbles, but the cloak goes back.",
            fx: {them:{op:6},coin:-2},
          },
        ],
      },
      {
        id: "lf_kid_wet_nurse",
        cond: p=>C.adult(p)&&hasKid(p,0,1.5),
        cool: 10,
        title: "A weak baby",
        setup: (p,ctx)=>kidPid(p,ctx,0,1.5),
        text: "The baby, {them}, is weak and will not feed well. The midwife says plainly that many such babies do not see their first summer. A wet-nurse costs 2 suns a month.",
        choices: [
          {
            t: "Hire a wet-nurse for half a year (12 suns)",
            req: p=>p.coin>=12,
            r: "A big laughing woman from the next street. {them} feeds like a wolf cub, and grows.",
            fx: {coin:-12,them:{op:10},happy:6},
          },
          {
            t: "Goat's milk, warmth and prayer",
            check: {s:"husbandry",s2:"wil",d:37},
            win: {
              r: "Night after night, a rag dipped in milk. By midsummer {them} is fat and furious.",
              fx: {them:{op:10},wil:1.5,happy:5},
            },
            lose: {
              r: (p,ctx)=>ctx.died?"In the first heat of summer, the baby slips away. The midwife lays {themHim} out, as she lays out half of {home} in the end.":"It is close, desperately close, but {them} lives.",
              fx: (p,ctx)=>{const t=T(ctx);return t&&A.chance(.4)?(ctx.died=1,A.kill(t,"weakness as a baby"),hp(p,-25),A.willGrow(p,3,"grief"),""):(A.willGrow(p,1.5,"fear"),"")},
            },
          },
          {
            t: "Ask the women of the street for help",
            check: {s:"persuasion",s2:"diplomacy",d:30},
            win: {
              r: "Three nursing mothers take turns. The street raises your baby. You will owe them all your life, gladly.",
              fx: {them:{op:8},happy:4,honor:1},
            },
            lose: {r:"They have their own babies. You manage, somehow, alone.",fx:{wil:1.2}},
          },
        ],
      },
      {
        id: "lf_kid_rivalry",
        cond: p=>C.adult(p)&&kidsOf(p,4,30).length>=2,
        cool: 7,
        title: "Two children, one quarrel",
        setup: (p,ctx)=>{const l=A.shuffle(kidsOf(p,4,30)).slice();for(;l.length<2;)l.push(mk(p,{ageAdj:8+A.ri(0,6)}));setPid(p,ctx,l[0]),ctx.oid=l[1].id,ctx.o=l[1].given,ctx.over=A.pick(["who gets the bigger share of your love, which neither will say","a broken toy that was a broken heirloom","who will inherit the farm","who told on whom","a sweetheart they both wanted"])},
        text: "{them} and {o} have not spoken in a week. The quarrel is about {over}. Both are waiting to see whose side you take.",
        choices: [
          {
            t: "Sit them down together",
            check: {s:"diplomacy",s2:"wil",d:37},
            win: {
              r: "It takes all evening and a pot of honey. They end it red-eyed and friends again.",
              fx: (p,ctx)=>{bump(p,T(ctx),8),bump(p,A.P(ctx.oid),8),A.trainSkill(p,"diplomacy",1)},
            },
            lose: {
              r: "It ends in shouting, and both think you favored the other.",
              fx: (p,ctx)=>{bump(p,T(ctx),-6),bump(p,A.P(ctx.oid),-6)},
            },
          },
          {
            t: "Side with {them}",
            r: "{them} is triumphant. {o} remembers.",
            fx: (p,ctx)=>{bump(p,T(ctx),10),bump(p,A.P(ctx.oid),-15)},
          },
          {
            t: "Let them sort it out",
            r: "They do, eventually, in the way siblings do: forgetting it and remembering it forever.",
            fx: {wil:.3},
          },
        ],
      },
      {
        id: "lf_kid_comes_home",
        cond: p=>C.adult(p)&&hasKid(p,18,60),
        cool: 10,
        title: "Home with nothing",
        setup: (p,ctx)=>{kidPid(p,ctx,18,60),ctx.why=A.pick(["lost a job in {town}","lost everything at the dice","been widowed and cannot manage alone","come back from the wars with a limp and no pay","quarreled with a master and been turned out"])},
        text: "Your grown {sd} {them} is at the door with a bundle and red eyes. {theyHe} has {why}, and has nowhere else to go.",
        choices: [
          {
            t: "Take {themHim} in, no questions",
            r: "Your house is smaller now and fuller. You find you do not mind.",
            fx: (p,ctx)=>{bump(p,T(ctx),25),pay(p,3*purse(p)),hp(p,3)},
          },
          {
            t: "Take {themHim} in, with conditions",
            check: {s:"persuasion",s2:"wil",d:35},
            win: {
              r: "Work every day, no dice, look for a place by spring. {them} keeps every condition, and leaves stronger.",
              fx: {them:{op:15},coin:3},
            },
            lose: {
              r: "{them} breaks the conditions within a month. It becomes a long, bitter year.",
              fx: {them:{op:-10},coin:-5,happy:-5},
            },
          },
          {
            t: "Give {themHim} coin and send {themHim} on",
            r: "A purse, a hug, a closed door. Maybe it is what {theyHe} needs. You will never be sure.",
            fx: (p,ctx)=>{pay(p,4*purse(p)),bump(p,T(ctx),-8),A.willGrow(p,.8,"hard choice")},
          },
        ],
      },
      {
        id: "lf_kid_teen_love",
        cond: p=>C.adult(p)&&hasKid(p,13,17),
        cool: 6,
        title: "Mooning about",
        setup: (p,ctx)=>kidPid(p,ctx,13,17),
        text: "Your {sd} {them} has burnt the porridge twice, sighs at the window, and has started washing without being told. There is clearly someone. {them} would rather die than say who.",
        choices: [
          {
            t: "Tease {themHim} mercilessly",
            r: "{them} storms out, scarlet. Later you hear {themHim} laughing about it with {theirHis} friends.",
            fx: {them:{op:-3},happy:3},
          },
          {
            t: "Find out who, quietly",
            check: {s:"intrigue",s2:"int",d:30},
            win: {
              r: "It is the cooper's youngest, who is perfectly respectable and perfectly terrified of you. You say nothing.",
              fx: {skill:{intrigue:1},happy:2},
            },
            lose: {r:"{them} catches you asking around. Mortification on a grand scale.",fx:{them:{op:-10}}},
          },
          {
            t: "Tell {themHim} about your own first love",
            r: "{them} pretends not to listen, and listens to every word.",
            fx: {them:{op:12},happy:3},
          },
        ],
      },
      {
        id: "lf_kid_scared",
        cond: p=>C.adult(p)&&hasKid(p,3,10),
        cool: 7,
        title: "Something in the dark",
        setup: (p,ctx)=>{kidPid(p,ctx,3,10);const near=(A.beastsNear(p)||[]).map(id=>LORE.creatures.find(c2=>c2.id===id)).filter(c2=>c2&&c2.belief&&c2.truth),c=near.length?A.pick(near):null;ctx.beast=c?c.name:"the wolf-men",ctx.bel=c?String(c.belief).split(". ")[0].replace(/\.$/,""):"they are men who turn into wolves under the moon",ctx.tru=c?String(c.truth).split(". ")[0].replace(/\.$/,""):"they are sick wolves and bandits in pelts"},
        text: "Your {sd} {them} will not sleep. The older children have been telling stories about {beast}: that {bel}. {them} is sure one is under the bed.",
        choices: [
          {
            t: "Tell {themHim} the truth of it",
            check: {s:"learning",s2:"persuasion",d:32},
            win: {
              r: '"{tru}." {them} considers this, decides it is even more interesting, and falls asleep planning to see one.',
              fx: {them:{op:8},int:.2},
            },
            lose: {r:"The truth turns out to be scarier than the story. Now neither of you will sleep.",fx:{wil:.3}},
          },
          {
            t: "Check under the bed with a broom, very seriously",
            r: "You fight off the invisible beast, with sound effects. {them} laughs until {theyHe} hiccups, then sleeps.",
            fx: {them:{op:12},happy:3},
          },
          {
            t: "Teach {themHim} a prayer against it",
            r: "A prayer to {god}, said three times. It works as well as anything.",
            fx: {them:{op:6},piety:2},
          },
        ],
      },
      {
        id: "lf_kid_slave_sale",
        cond: p=>C.adult(p)&&slave(p)&&hasKid(p,4,16),
        cool: 8,
        title: "The buyer looks at your child",
        setup: (p,ctx)=>kidPid(p,ctx,4,16),
        text: "A buyer from {town} is walking the yard with your master, pinching arms, looking at teeth. He stops in front of your {sd} {them} and asks the price.",
        choices: [
          {
            t: "Throw yourself at your master's feet",
            check: {s:"persuasion",s2:"wil",d:45},
            win: {
              r: 'Something in your face reaches him. "Not that one." The buyer moves on. You shake for an hour.',
              fx: {them:{op:25},wil:1.5,honor:1},
            },
            lose: {
              r: "He kicks you aside. {them} is led away in a line of children. You are not allowed to say goodbye.",
              fx: (p,ctx)=>{const t=T(ctx);t&&(t.home=A.pick(A.S.prov.filter(x=>x.owner===p.realm).map(x=>x.id).concat([p.home]))),hp(p,-30),A.willGrow(p,3,"loss"),bump(p,t,10)},
            },
          },
          {
            t: "Offer your savings to keep {themHim}",
            req: p=>p.coin>=15,
            r: "Every coin you hid in the wall, into your master's hand. He laughs at the sum and takes it. {them} stays.",
            fx: {coin:-15,them:{op:30},wil:1},
          },
          {
            t: "Make {themHim} look sickly before the buyer comes close",
            check: {s:"deception",s2:"medicine",d:40},
            win: {
              r: "Ash under the eyes, a cough on cue. The buyer wrinkles his nose and passes on.",
              fx: {them:{op:15},skill:{deception:2}},
            },
            lose: {
              r: "The buyer is not fooled, and your master is furious at the trick. A flogging for you, and {them} goes anyway.",
              fx: {health:-15,cause:"a flogging",happy:-25,wil:2.5},
            },
          },
        ],
      },
      {
        id: "lf_kid_manor_service",
        cond: p=>C.adult(p)&&(serf(p)||p.status==="peasant")&&hasKid(p,9,15),
        cool: 9,
        title: "Wanted at the manor",
        setup: (p,ctx)=>kidPid(p,ctx,9,15),
        text: "The steward has noticed your {sd} {them}: quick, clean, polite. There is a place in the manor house: scullery to start, a coat at the Slaughter Feast, maybe a good place in the world. Or a life of being shouted at by cooks.",
        choices: [
          {
            t: "Let {themHim} go",
            r: "{them} goes up the hill with a bundle. At the holy days {theyHe} comes home with stories of silver forks and a lady who swears.",
            fx: (p,ctx)=>{const t=T(ctx);t&&(t.occ="a servant at the manor"),bump(p,t,5),p.coin+=2},
          },
          {
            t: "Bargain for better terms",
            check: {s:"trade",s2:"persuasion",d:37},
            win: {
              r: "Wages from the first year, and your rent eased a little. The steward is impressed despite himself.",
              fx: (p,ctx)=>{const t=T(ctx);t&&(t.occ="a servant at the manor"),p.coin+=6,A.trainSkill(p,"trade",1)},
            },
            lose: {
              r: "The steward takes offense and finds another child. And remembers your name at rent time.",
              fx: {coin:-3},
            },
          },
          {
            t: "Refuse: you need {themHim} in the fields",
            r: "The steward shrugs. {them} is glad, then sorry, then glad again.",
            fx: {them:{op:4}},
          },
        ],
      },
      {
        id: "lf_kid_fostering",
        cond: p=>C.adult(p)&&(high(p)||C.family(p))&&hasKid(p,7,13),
        cool: 10,
        title: "Sent to be fostered",
        setup: (p,ctx)=>{kidPid(p,ctx,7,13),ctx.court=C.noble(p)?"the court of {ruler}":"the household of {liege}"},
        text: "An offer comes, sealed and ribboned: your {sd} {them} may be fostered in {court}, to learn manners, arms and the faces of people who matter. {them} would leave within the month, and come back a stranger.",
        choices: [
          {
            t: "Accept: this is how houses rise",
            r: "{them} rides away very straight in the saddle. The letters home are formal, then fewer. But {theyHe} is in the right rooms now.",
            fx: (p,ctx)=>{const t=T(ctx);t&&(t.skills=t.skills||{},t.skills.etiquette=(t.skills.etiquette||0)+15),bump(p,t,-5),A.fame(p,1)},
          },
          {
            t: "Accept, but visit often",
            check: {s:"etiquette",s2:"riding",d:35},
            win: {
              r: "You make the long ride every season. {them} grows up both of the court and yours.",
              fx: {them:{op:15},fame:1,skill:{etiquette:1}},
            },
            lose: {
              r: "Your visits are noticed and mocked at court: the clinging parent. {them} begs you to stop.",
              fx: {them:{op:-6},honor:-1},
            },
          },
          {
            t: "Refuse, politely",
            check: {s:"diplomacy",s2:"etiquette",d:43},
            win: {
              r: "Your refusal is so graceful that it reads as a compliment. {them} stays home.",
              fx: {them:{op:10}},
            },
            lose: {r:"It is taken as an insult. You lose a friend in high places.",fx:{favor:-6,them:{op:8},fame:-1}},
          },
        ],
      },
      {
        id: "lf_kid_ledger",
        cond: p=>C.adult(p)&&(p.status==="merchant"||C.job(p,"merchant"))&&hasKid(p,11,20),
        cool: 9,
        title: "The counting-room",
        setup: (p,ctx)=>kidPid(p,ctx,11,20),
        text: "Your {sd} {them} is meant to be learning the ledgers. Instead you find {themHim} asleep on them, or drawing ships in the margins, or out on the quay talking to sailors.",
        choices: [
          {
            t: "Put {themHim} on a ship as a supercargo",
            check: {s:"trade",s2:"sea",d:35},
            win: {
              r: "{them} comes back from the first voyage sunburnt, full of prices and ports. The ledgers suddenly make sense to {themHim}.",
              fx: {them:{op:18},coin:10},
            },
            lose: {
              r: "The voyage loses money and {them} loses a tooth in a tavern in {town}. Still, {theyHe} loved it.",
              fx: {them:{op:10},coin:-10},
            },
          },
          {
            t: "Sit with {themHim} every evening until {theyHe} learns",
            check: {s:"learning",s2:"wil",d:35},
            win: {
              r: "Grinding work, but {them} has a head for figures after all. You see your trade passing into safe hands.",
              fx: {them:{op:6},skill:{learning:1,trade:1}},
            },
            lose: {r:"Two miserable people and one ledger. You give up before {them} does.",fx:{them:{op:-8}}},
          },
          {
            t: "Let {themHim} find {theirHis} own way",
            r: "{them} goes off to the quays for good. The business will go to a nephew. It hurts less than you expected.",
            fx: {them:{op:15},wil:.5},
          },
        ],
      },
      {
        id: "lf_kid_orc_deedname",
        cond: p=>C.adult(p)&&C.race(p,"orc","halforc")&&hasKid(p,11,16),
        cool: 8,
        title: "Wanting a deed-name",
        setup: (p,ctx)=>kidPid(p,ctx,11,16),
        text: "Your {sd} {them} wants a deed-name before the Great Ride, and means to earn it by stealing a horse from the next clan's herd. Horse theft between clans is half a sport, until someone is caught.",
        choices: [
          {
            t: "Teach {themHim} how it is done",
            req: p=>C.prof(p,"riding",25)||C.prof(p,"stealth",25),
            r: "Downwind, at the dark of the moon, never the stallion. {them} comes home at dawn with a grey mare and a grin like a split melon.",
            fx: (p,ctx)=>{const t=T(ctx);t&&!t.epithet&&(t.epithet=A.pick(["Grey-Mare","Night-Rider","Quickhand"])),bump(p,t,20),A.fame(p,1)},
          },
          {
            t: "Forbid it: the clan-mothers have enough feuds",
            r: "{them} sulks for a month and then earns a name the slow way, herding through a blizzard. The mothers approve.",
            fx: {them:{op:-6},honor:2},
          },
          {
            t: "Let {themHim} go, and pray to the Mare",
            r: (p,ctx)=>ctx.ok?"{them} comes home with two horses and a story the whole camp hears by noon.":"{them} is caught and sent home on foot, with a black eye and no name. Your clan owes theirs three horses.",
            fx: (p,ctx)=>(ctx.ok=A.chance(.5),ctx.ok?(A.fame(p,1),bump(p,T(ctx),10),""):(pay(p,20),hon(p,-2),"")),
          },
        ],
      },
      {
        id: "lf_kid_married_off",
        cond: p=>C.adult(p)&&kidsOf(p,15,22).some(c=>!spouseOf(c))&&free(p),
        cool: 8,
        title: "A match for your child",
        setup: (p,ctx)=>{const l=kidsOf(p,15,22).filter(c2=>!spouseOf(c2)),c=setPid(p,ctx,l.length?A.pick(l):null),m=mk(p,{sex:c&&c.sex==="M"?"F":"M",ageAdj:18+A.ri(0,8)});ctx.mid=m.id,ctx.m=m.given,ctx.mocc=m.occ||"of a decent family",ctx.gift=Math.max(5,8*purse(p))},
        text: "The family of {m}, {mocc}, has come to talk about a match with your {sd} {them}. They want {gift} suns in dowry and gifts. {them} has met {m} twice and blushed both times.",
        choices: [
          {
            t: "Agree, and pay what they ask",
            req: (p,C2,ctx)=>p.coin>=ctx.gift,
            r: "A wedding feast that eats a third of a year's earnings, and a {sd} who glows all day.",
            fx: (p,ctx)=>{pay(p,ctx.gift);const c=T(ctx),m=A.P(ctx.mid);c&&m&&!spouseOf(c)&&(c.spouse=m.id,m.spouse=c.id,A.link(c,m,"spouse",50,"spouse"),A.link(p,m,"inlaw",25,"inlaw")),bump(p,c,20),hp(p,8)},
          },
          {
            t: "Haggle the price down",
            check: {s:"trade",s2:"persuasion",d:40},
            win: {
              r: "You get it down by half, and both families feel they won. The wedding goes ahead at the next festival.",
              fx: (p,ctx)=>{pay(p,Math.round(ctx.gift/2));const c=T(ctx),m=A.P(ctx.mid);c&&m&&!spouseOf(c)&&(c.spouse=m.id,m.spouse=c.id,A.link(c,m,"spouse",50,"spouse"),A.link(p,m,"inlaw",20,"inlaw")),bump(p,c,12),A.trainSkill(p,"trade",1)},
            },
            lose: {
              r: "They take offense at the haggling and leave. {them} does not speak to you for a week.",
              fx: {them:{op:-15}},
            },
          },
          {
            t: "Ask {them} what {theyHe} wants",
            r: (p,ctx)=>ctx.yes?"{them} wants it with all {theirHis} heart. You find the money somehow.":"{them} wants to wait. You send the family away with honey cakes and no promise.",
            fx: (p,ctx)=>{ctx.yes=A.chance(.6);const c=T(ctx);if(bump(p,c,15),ctx.yes){pay(p,ctx.gift);const m=A.P(ctx.mid);c&&m&&!spouseOf(c)&&(c.spouse=m.id,m.spouse=c.id,A.link(c,m,"spouse",50,"spouse"))}return""},
          },
        ],
      },
    ]);
    const sibOf=p=>known(p,["sibling"],"sibling",20,{ageAdj:C.ageAdj(p)+A.ri(-6,6)});
    add([
      {
        id: "lf_sib_favored",
        cond: p=>(C.adult(p)||C.teen(p))&&C.parentsAlive(p)&&!C.old(p),
        cool: 9,
        title: "The favorite",
        setup: (p,ctx)=>{setPid(p,ctx,sibOf(p)),ctx.gift=A.pick(["the good plough-ox","the family's best room","the money for an apprenticeship","your grandmother's ring","the seat beside the fire"])},
        text: "Your parents have given {gift} to your {bs} {them}. Again. They say it is because {them} needs it more. You have heard that before.",
        choices: [
          {
            t: "Say what you have never said",
            check: {s:"persuasion",s2:"wil",d:40},
            win: {
              r: "Your mother listens. Really listens. Things change, a little, and you feel seen for once.",
              fx: {rel:{who:"mother",op:10},wil:.8,happy:4},
            },
            lose: {
              r: "It comes out as jealousy, because it is. Your father says you are ungrateful.",
              fx: {rel:{who:"father",op:-10},happy:-4},
            },
          },
          {
            t: "Take it out on {them}",
            r: "It is not {theirHis} fault, and you both know it. Things are cold between you for a long time.",
            fx: {them:{op:-18},happy:-2},
          },
          {
            t: "Swallow it",
            r: "You say nothing and work harder. One day it will be your turn. Probably.",
            fx: {wil:1,happy:-3},
          },
        ],
      },
      {
        id: "lf_sib_shelter",
        cond: p=>C.adult(p)&&!slave(p),
        cool: 10,
        title: "At your door with the children",
        setup: (p,ctx)=>{const s=setPid(p,ctx,sibOf(p));ctx.n=A.ri(2,4)},
        text: "Your {bs} {them} has been widowed, and {theirHis} late spouse's kin have taken the house. {them} is at your door with {n} children, a goat and a cooking pot.",
        choices: [
          {
            t: "Take them all in",
            r: "Your house becomes very loud and very crowded. It also becomes a home in a way it was not before.",
            fx: (p,ctx)=>{pay(p,3*purse(p)),bump(p,T(ctx),30),hp(p,2),hon(p,3),A.willGrow(p,.8,"burden")},
          },
          {
            t: "Fight the in-laws for {theirHis} house",
            check: {s:"persuasion",s2:"learning",d:47},
            win: {
              r: "You find the marriage contract and a witness. {them} gets the house back, and the in-laws get a lesson.",
              fx: {them:{op:35},honor:3,skill:{persuasion:1,learning:1}},
            },
            lose: {
              r: "The court sides with the in-laws. You take {them} in anyway.",
              fx: (p,ctx)=>{pay(p,2*purse(p)),bump(p,T(ctx),20),A.willGrow(p,1,"injustice")},
            },
          },
          {
            t: "Give {themHim} what coin you can spare",
            r: "{them} takes the coin and finds a room in {town}. You hear {theyHe} manages. You hear {theyHe} does not forget.",
            fx: (p,ctx)=>{pay(p,2*purse(p)),bump(p,T(ctx),-6)},
          },
        ],
      },
      {
        id: "lf_sib_crime",
        cond: p=>C.adult(p),
        cool: 12,
        w: .7,
        title: "A confession at night",
        setup: (p,ctx)=>{setPid(p,ctx,sibOf(p)),ctx.drink=dry(p)?"date wine":drink(p),ctx.cl=clergy(p),ctx.what=A.pick(["who set fire to the reeve's barn ten years ago","who took the church silver when you were children, for which another boy was flogged","who has been clipping the coins at the market","who knows where a dead man is buried, and why"])},
        text: "After too much {drink}, your {bs} {them} tells you that {theyHe} is the one {what}. Then {theyHe} falls asleep at the table and leaves you holding it.",
        choices: [
          {
            t: "Keep the secret",
            r: "Blood is blood. {them} never mentions that night again. Neither do you.",
            fx: {them:{op:15},honor:-2,wil:.6},
          },
          {
            t: "Make {themHim} put it right",
            check: {s:"persuasion",s2:"wil",d:45},
            win: {
              r: "{them} confesses to the {cl} and pays what can be paid. {theyHe} says {theyHe} sleeps better. So do you.",
              fx: {them:{op:5},honor:4,piety:2},
            },
            lose: {
              r: '{them} laughs it off in the morning: "I was drunk, it never happened." It did.',
              fx: {them:{op:-6}},
            },
          },
          {
            t: "Use it, quietly, the next time you need something",
            r: "You do not say it. You just let {them} know you remember. {theyHe} is very helpful after that, and very cold.",
            fx: {them:{op:-25},honor:-4,skill:{intrigue:2}},
          },
        ],
      },
      {
        id: "lf_sib_reunite_old",
        cond: p=>C.old(p),
        cool: 10,
        title: "The last two",
        setup: (p,ctx)=>{const s=setPid(p,ctx,sibOf(p)),R=GD.RACES[s.race];s.born=Math.min(s.born,A.S.year-R.old)},
        text: "You and your {bs} {them} are the last two of your parents' children still alive. {them} has walked over with a stick and a sack of apples to sit with you by the fire.",
        choices: [
          {
            t: "Remember the old days together",
            r: "The orchard, the flood year, your father's terrible singing. You laugh until you both have to sit very still.",
            fx: {them:{op:20},happy:10},
          },
          {
            t: "Finally settle the old quarrel",
            check: {s:"wil",s2:"diplomacy",d:33},
            win: {
              r: "Fifty years of a grudge over a pig, and it is over in an afternoon. You both feel very foolish and very light.",
              fx: {them:{op:30},happy:8,wil:.6},
            },
            lose: {
              r: "It turns out you both still mind about the pig. You agree not to talk about it.",
              fx: {them:{op:5},happy:2},
            },
          },
          {
            t: "Talk about who goes first",
            r: "Practical things: who gets the chest, who will say the words. Strange, how calm you both are.",
            fx: {them:{op:12},wil:.8,piety:2},
          },
        ],
      },
      {
        id: "lf_sib_cover",
        cond: p=>C.teen(p)||C.child(p)&&C.ageAdj(p)>=8,
        cool: 6,
        title: "Covering for your sibling",
        setup: (p,ctx)=>{setPid(p,ctx,sibOf(p)),ctx.what=A.pick(["out after curfew with a sweetheart","at the dice behind the stables","swimming in the forbidden millrace","at the fair without leave"])},
        text: "Your {bs} {them} is {what}, and your father is asking where {theyHe} is. {them} made you swear to cover for {themHim}.",
        choices: [
          {
            t: "Lie for {themHim}",
            check: {s:"deception",s2:"int",d:25},
            win: {
              r: '"Gone to bed early with a bellyache." Your father grunts and believes it. {them} owes you, and knows it.',
              fx: {them:{op:20},skill:{deception:1}},
            },
            lose: {
              r: "Your father sees through it at once. Now you are both in trouble.",
              fx: {them:{op:10},rel:{who:"father",op:-6},happy:-3},
            },
          },
          {
            t: "Tell the truth",
            r: "Your father goes out with a lantern and a face like thunder. {them} does not speak to you for a week.",
            fx: {them:{op:-18},rel:{who:"father",op:5},honor:2},
          },
          {
            t: "Go and fetch {themHim} back yourself",
            check: {s:"stealth",s2:"spd",d:28},
            win: {
              r: "In through the back window, both of you, just as the latch lifts. Nobody ever knows.",
              fx: {them:{op:15},spd:.3},
            },
            lose: {r:"You are both caught climbing in. Your father is almost impressed.",fx:{them:{op:5},happy:-2}},
          },
        ],
      },
      {
        id: "lf_inlaw_feast",
        cond: p=>C.adult(p)&&C.married(p),
        cool: 8,
        title: "Supper with the in-laws",
        setup: (p,ctx)=>{const s=spouseOf(p),f=mk(p,{sex:A.chance(.5)?"M":"F",ageAdj:C.ageAdj(p)+22,status:s?s.status:p.status});A.link(p,f,"inlaw",0,"inlaw"),setPid(p,ctx,f)},
        text: "Supper at the house of {spouse}'s {mfa}, {them}, who has never thought you good enough. {them} asks, in front of the whole table, what exactly you have done with your life.",
        choices: [
          {
            t: "Answer with perfect manners",
            check: {s:"etiquette",s2:"wil",d:37},
            win: {
              r: "You answer so graciously that {them} looks the boor. {spouse} squeezes your hand under the table.",
              fx: {them:{op:10},rel:{who:"spouse",op:6},honor:2},
            },
            lose: {r:"You try to be gracious and sound smug. {them} smiles like a cat.",fx:{them:{op:-5},happy:-3}},
          },
          {
            t: "Answer with a joke at {theirHis} expense",
            check: {s:"persuasion",s2:"int",d:40},
            win: {
              r: "The table roars. Even {them} laughs, eventually. You have earned something, maybe respect.",
              fx: {them:{op:12},fame:1},
            },
            lose: {
              r: "The table goes silent. {spouse} kicks you under it.",
              fx: {them:{op:-15},rel:{who:"spouse",op:-6}},
            },
          },
          {
            t: "Lose your temper",
            r: "Plates. Shouting. {spouse} drives you home in silence and does not speak for three days.",
            fx: {them:{op:-25,type:"rival"},rel:{who:"spouse",op:-10},wil:.5},
          },
        ],
      },
      {
        id: "lf_inlaw_moves_in",
        cond: p=>C.adult(p)&&C.married(p)&&!slave(p),
        cool: 12,
        title: "For a few weeks",
        setup: (p,ctx)=>{const f=mk(p,{sex:A.chance(.6)?"F":"M",ageAdj:C.ageAdj(p)+25});A.link(p,f,"inlaw",5,"inlaw"),setPid(p,ctx,f),ctx.food=food(p)},
        text: `{spouse}'s {mfa}, {them}, can no longer manage alone, and has moved in "for a few weeks" with a chest, a cat and many opinions about how you cook {food}.`,
        choices: [
          {
            t: "Make {themHim} genuinely welcome",
            check: {s:"wil",s2:"diplomacy",d:35},
            win: {
              r: "It is not easy. But {them} turns out to know the old stories, and the children adore {themHim}.",
              fx: {them:{op:25},rel:{who:"spouse",op:10},happy:2},
            },
            lose: {
              r: "You try. {them} criticizes your bread anyway. It becomes a long year.",
              fx: {them:{op:5},happy:-5,wil:.8},
            },
          },
          {
            t: "Put {themHim} to work",
            r: "{them} turns out to be a demon at the spindle and the herb garden. Grudging respect on both sides.",
            fx: {them:{op:10},coin:4},
          },
          {
            t: "Insist {spouse}'s siblings take a turn",
            check: {s:"persuasion",s2:"intrigue",d:40},
            win: {
              r: "A family council, and {them} moves on to a brother at Midsummer. Your kitchen is your own again.",
              fx: {rel:{who:"spouse",op:-3},happy:4},
            },
            lose: {
              r: "The siblings all have reasons. {them} stays, and has heard about the council.",
              fx: {them:{op:-15},happy:-4},
            },
          },
        ],
      },
      {
        id: "lf_inlaw_business",
        cond: p=>C.adult(p)&&C.married(p)&&free(p)&&!high(p),
        cool: 12,
        title: "A place in the family business",
        setup: (p,ctx)=>{const f=mk(p,{sex:"M",ageAdj:C.ageAdj(p)+25,status:"merchant"});f.occ=A.pick(["a wine merchant","a salt merchant","a cloth trader","a miller with three mills"]),A.link(p,f,"inlaw",10,"inlaw"),setPid(p,ctx,f)},
        text: "{spouse}'s kinsman {them}, {themOcc}, offers you a place in the business: steady pay, a share in time. All you have to give up is your own way of doing things, and to be grateful at every feast.",
        choices: [
          {
            t: "Take it",
            r: "Good money, and a seat at the bottom of his table. You learn a great deal about trade and about holding your tongue.",
            fx: {coin:20,skill:{trade:3},them:{op:15},happy:-2,job:"merchant"},
          },
          {
            t: "Negotiate a real share",
            check: {s:"trade",s2:"persuasion",d:50},
            win: {
              r: "He respects a hard bargain. You go in as a junior partner, not a clerk.",
              fx: {coin:40,skill:{trade:3},them:{op:20},job:"merchant"},
            },
            lose: {
              r: 'He withdraws the offer. "I wanted help, not a rival." Family suppers are colder now.',
              fx: {them:{op:-15}},
            },
          },
          {
            t: "Refuse: you will make your own way",
            r: "Pride is expensive, but it is yours. {spouse} is either proud of you or furious; it changes daily.",
            fx: {them:{op:-5},wil:.8,honor:1},
          },
        ],
      },
    ]);
    const neighbor=(p,o)=>known(p,["acquaint"],"acquaint",10,o);
    add([
      {
        id: "lf_nb_shouting",
        cond: p=>C.adult(p)&&!C.old(p),
        cool: 9,
        title: "Through the wall",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{sex:"F"}));linkNew(p,x,"acquaint",10),ctx.hb=A.givenName(p.cult,"M"),ctx.cl=clergy(p)},
        text: "Every night now you hear {hb} next door shouting at his wife {them}, and things breaking. This morning {them} had a bruise on {theirHis} cheek and said {theyHe} walked into a door.",
        choices: [
          {
            t: "Go round next time and stand in the doorway",
            check: {s:"intimidation",s2:"str",d:40},
            win: {
              r: "{hb} looks at you, and at the neighbors gathering behind you, and goes very quiet. It stays quiet, mostly.",
              fx: {them:{type:"friend",op:30,back:"friend"},honor:4,skill:{intimidation:1}},
            },
            lose: {
              r: "{hb} throws a punch and the night ends with both of you bloody in the lane.",
              fx: {
                them: {type:"friend",op:20,back:"friend"},
                health: -8,
                cause: "a brawl with a neighbor",
                newRel: {type:"enemy",op:-30},
              },
            },
          },
          {
            t: "Speak to {them} quietly, and offer a place to go",
            r: "{them} cries, and says no. But a month later {theyHe} comes to your door at midnight with a bundle, and you are ready.",
            fx: {them:{type:"friend",op:35,back:"friend"},honor:3,coin:-2},
          },
          {
            t: "Bring it to the {cl}",
            check: {s:"faith",s2:"persuasion",d:37},
            win: {
              r: "The {cl} has words with {hb} in front of the whole congregation. Shame works where fists might not.",
              fx: {them:{type:"friend",op:20,back:"friend"},piety:2,honor:2},
            },
            lose: {
              r: "The {cl} says a man's house is his own business. You will not forget that.",
              fx: {piety:-2,wil:.5},
            },
          },
          {
            t: "Stay out of it",
            r: "You close the shutters and turn over. The noise goes on.",
            fx: {honor:-2,happy:-3},
          },
        ],
      },
      {
        id: "lf_nb_hen",
        cond: p=>C.adult(p)&&!C.town(p),
        cool: 6,
        title: "The missing hen",
        setup: (p,ctx)=>setPid(p,ctx,neighbor(p)),
        text: "Your best laying hen is gone, and there are feathers by the fence, and {them} next door is having chicken stew. {them} says it was a hen {theyHe} bought at the market.",
        choices: [
          {
            t: "Ask to see the feathers in {theirHis} midden",
            check: {s:"tracking",s2:"int",d:33},
            win: {
              r: "Speckled, like yours. {them} goes red and pays you for two hens.",
              fx: {coin:2,them:{op:-10},honor:1},
            },
            lose: {r:"The feathers are brown. Yours was speckled. You apologize, badly.",fx:{them:{op:-8},honor:-2}},
          },
          {
            t: "Let it go and buy a dog",
            r: "A shaggy thing that barks at nothing. No more hens go missing.",
            fx: {coin:-2,happy:2},
          },
          {
            t: "Raise it at the village meeting",
            check: {s:"persuasion",s2:"diplomacy",d:37},
            win: {r:"The village decides you are owed. {them} pays with poor grace.",fx:{coin:2,them:{op:-15}}},
            lose: {r:"The village decides you are making a fuss about a hen.",fx:{honor:-2,them:{op:-10}}},
          },
        ],
      },
      {
        id: "lf_nb_raising",
        cond: p=>C.adult(p)&&!C.town(p)&&!slave(p),
        cool: 8,
        title: "Raising a roof",
        setup: (p,ctx)=>{setPid(p,ctx,neighbor(p)),ctx.what=A.pick(["a new house, since the old one fell in the storm","a barn","a byre for the cows","a house for a newly married couple"])},
        text: "{them} is building {what}. With neighbors' help a house costs twenty or forty suns; without them, a fortune. The whole lane is turning out on Saturday.",
        choices: [
          {
            t: "Work from dawn to dusk",
            r: "Timber, wattle, daub and a turf roof by sunset. Beer and stew after. Your back aches for a week.",
            fx: {them:{type:"friend",op:20,back:"friend"},str:.4,sta:.3,happy:4},
          },
          {
            t: "Bring your skill: you know how it is done",
            req: p=>C.prof(p,"craft",30),
            check: {s:"craft",s2:"int",d:35},
            win: {
              r: "You set the roof-tree yourself, true as a plumb line. The whole lane talks about it. {them} will never forget.",
              fx: {them:{type:"friend",op:30,back:"friend"},fame:1,skill:{craft:2}},
            },
            lose: {r:"A beam slips. Nobody is hurt, but you lose a morning and some pride.",fx:{them:{op:8},honor:-1}},
          },
          {
            t: "Bring the beer instead (2 suns)",
            req: p=>p.coin>=2,
            r: "The most popular person at the raising, without lifting a beam.",
            fx: {coin:-2,them:{op:12},happy:3},
          },
          {
            t: "Make an excuse",
            r: "Everyone notices. When your own roof leaks, they will remember.",
            fx: {them:{op:-10},honor:-2},
          },
        ],
      },
      {
        id: "lf_nb_widow_harvest",
        cond: p=>C.adult(p)&&!C.town(p)&&!C.old(p),
        cool: 7,
        title: "A widow's harvest",
        setup: (p,ctx)=>{const x=setPid(p,ctx,neighbor(p,{sex:"F",ageAdj:C.ageAdj(p)+25}));x.occ="a widow on the next strip"},
        text: "Old {them} on the next strip has no sons left and no money for harvest hands. {theirHis} barley is standing over-ripe, and the rain is coming.",
        choices: [
          {
            t: "Bring in {theirHis} harvest with your own",
            r: "Two harvests in one week. You are dead on your feet, and {them} weeps over the sheaves.",
            fx: {them:{type:"friend",op:35,back:"friend"},sta:.5,health:-3,cause:"overwork",honor:3,piety:2},
          },
          {
            t: "Organize the young people to do it",
            check: {s:"command",s2:"persuasion",d:35},
            win: {
              r: "A gang of youths with sickles and a cart, paid in {theirHis} cider. Done in a day.",
              fx: {them:{type:"friend",op:30,back:"friend"},fame:1,skill:{command:1}},
            },
            lose: {r:"They come late and leave early. Half of it rots.",fx:{them:{op:10}}},
          },
          {
            t: "Offer to buy the crop standing, cheap",
            r: "{them} takes the price, because what else can {theyHe} do. You profit. {theyHe} remembers.",
            fx: {coin:6,them:{op:-10},honor:-2},
          },
        ],
      },
      {
        id: "lf_nb_watch",
        cond: p=>C.adult(p)&&C.town(p)&&free(p)&&!C.old(p),
        cool: 6,
        title: "Your night on the watch",
        setup: (p,ctx)=>{ctx.what=A.pick(["two men carrying a heavy sack down an alley","a light where no light should be in a warehouse","a young lord, drunk, trying to climb a merchant's balcony","a woman running barefoot, looking back"])},
        text: "It is your turn on the watch: a lantern, a staff and the streets of {home} between curfew and dawn. Past midnight you see {what}.",
        choices: [
          {
            t: "Raise the hue and cry",
            check: {s:"command",s2:"wil",d:33},
            win: {
              r: "Doors bang, neighbors come with staves. Whatever it was, it is stopped, and the watch-captain notes your name.",
              fx: {honor:2,fame:1,coin:2},
            },
            lose: {r:"You wake half the street for nothing. You are not thanked.",fx:{honor:-1,happy:-2}},
          },
          {
            t: "Go and look yourself",
            check: {s:"melee",s2:"ins",d:40},
            win: {
              r: "You catch them in the act with your staff and your lantern. A reward from the grateful householder.",
              fx: {coin:6,fame:1,skill:{melee:1}},
            },
            lose: {
              r: "A cudgel out of the dark. You wake in the gutter with your lantern smashed.",
              fx: {health:-12,cause:"a blow on the night watch",wound:"concussion"},
            },
          },
          {
            t: "See nothing",
            r: "Whatever happened, happened. In the morning there is talk. You keep your face still.",
            fx: {honor:-2},
          },
        ],
      },
      {
        id: "lf_nb_strangers",
        cond: p=>C.adult(p),
        cool: 10,
        title: "New people in the lane",
        setup: (p,ctx)=>{const opts=["halforc","orc","dwarf","elf","halfelf","human"].filter(r=>r!==p.race&&A.raceAllowed(r,p.realm)),race=opts.length?A.pick(opts):p.race,x=setPid(p,ctx,mk(p,{race})),adj=GD.RACES[x.race].adj;ctx.fam=x.race===p.race?"A family from far away, with strange food and a strange god,":(/^[aeiou]/i.test(adj)?"An ":"A ")+adj+" family"},
        text: "{fam} has taken the empty house in your lane: {themFull} and three children. The lane is buzzing. Someone has already scratched a word on their door.",
        choices: [
          {
            t: "Bring them bread and salt",
            r: "{them} stands in the doorway a long moment before taking it. The next week a pot of something spicy and astonishing appears on your step.",
            fx: {them:{type:"friend",op:30,back:"friend"},honor:2,happy:3},
          },
          {
            t: "Scrub the word off their door in front of everybody",
            check: {s:"wil",s2:"intimidation",d:35},
            win: {
              r: "Nobody says anything. Nobody scratches anything again.",
              fx: {them:{type:"friend",op:25,back:"friend"},honor:4},
            },
            lose: {
              r: "The lane mutters. Next week your own door has a word on it.",
              fx: {them:{type:"friend",op:20,back:"friend"},honor:1,happy:-3},
            },
          },
          {
            t: "Keep away, like everyone else",
            r: "They keep to themselves. A year later they move on, and nobody learns their names.",
            fx: {honor:-1},
          },
        ],
      },
      {
        id: "lf_nb_borrowed",
        cond: p=>C.adult(p)&&!slave(p),
        cool: 7,
        title: "The axe that never came back",
        setup: (p,ctx)=>{setPid(p,ctx,neighbor(p)),ctx.thing=A.pick(["your good axe","your ladder","your best cooking pot","your handcart","your whetstone"])},
        text: "{them} borrowed {thing} at Midsummer. It is now nearly Midwinter. Yesterday you saw {themHim} using it.",
        choices: [
          {
            t: "Ask for it back, cheerfully",
            check: {s:"persuasion",s2:"etiquette",d:32},
            win: {
              r: "{them} goes scarlet and brings it back that afternoon, with a pot of honey for the delay.",
              fx: {them:{op:5},happy:2},
            },
            lose: {r:'"Oh, was that yours? I thought you gave it me." A long, chilly conversation.',fx:{them:{op:-8}}},
          },
          {
            t: "Take it back while {theyHe} is at market",
            check: {s:"stealth",s2:"spd",d:30},
            win: {
              r: "Back where it belongs. {them} never mentions it. Neither do you.",
              fx: {skill:{stealth:1},happy:2},
            },
            lose: {
              r: "{them} comes home to find you in {theirHis} shed. It looks exactly like what it is.",
              fx: {them:{op:-15},honor:-3},
            },
          },
          {
            t: "Let {themHim} keep it: good neighbors are worth more",
            r: "You buy another. {them} borrows that one too, eventually.",
            fx: {coin:-2,them:{op:8},happy:-1},
          },
        ],
      },
      {
        id: "lf_nb_hue_cry",
        cond: p=>C.adult(p)&&free(p)&&!C.old(p),
        cool: 7,
        title: "Hue and cry!",
        setup: (p,ctx)=>{ctx.what=A.pick([`"Thief! Thief! He took the priest's candlesticks!"`,'"Horse thief! Stop him!"','"Murder! At the inn!"',`"Stop him! He's cut a purse!"`])},
        text: "A shout goes up through {home}: {what} By law every neighbor must answer the hue and cry or be fined. A figure is running for the woods.",
        choices: [
          {
            t: "Run him down",
            check: {s:"athletics",s2:"spd",d:40},
            win: {
              r: "You bring him down at the hedge. The reeve claps you on the back and the owner gives you a reward.",
              fx: {coin:4,fame:2,honor:2,spd:.3},
            },
            lose: {r:"He is faster. You arrive at the woods blown, and he is gone.",fx:{sta:.3,happy:-1}},
          },
          {
            t: "Track him into the woods with the others",
            check: {s:"tracking",s2:"survival",d:37},
            win: {
              r: "Broken twigs, a dropped candlestick. You lead the search straight to him.",
              fx: {coin:3,fame:1,skill:{tracking:2}},
            },
            lose: {r:"You lose the trail at the stream. The search goes home in the dark.",fx:{skill:{tracking:1}}},
          },
          {
            t: "Bring him down with a throw or a shot",
            req: p=>C.prof(p,"bow",40)||C.prof(p,"throwing",40)||C.prof(p,"xbow",40),
            check: {s:"bow",s2:"ins",d:43},
            win: {
              r: "One shot in the leg at sixty paces. The village tells the story for years.",
              fx: {coin:5,fame:3,epithet:"the Sure-Eye"},
            },
            lose: {r:"You miss, and very nearly hit the miller. Nobody laughs until later.",fx:{honor:-1}},
          },
          {
            t: "Answer slowly, and arrive last",
            r: "You avoid the fine, and the danger, and the reward.",
            fx: {wil:.2},
          },
        ],
      },
      {
        id: "lf_nb_hearth_spirit",
        cond: p=>C.adult(p)&&(C.faith(p,"REL-18","REL-03")||C.cult(p,"CUL-02","CUL-11")),
        cool: 9,
        title: "Milk for the house-spirit",
        setup: (p,ctx)=>{setPid(p,ctx,neighbor(p,{ageAdj:C.ageAdj(p)+30,sex:"F"})),ctx.cl=clergy(p)},
        text: 'Old {them} next door swears your house-spirit is angry: the milk sours, the hearth smokes, the cat will not stay. "When did you last set out its saucer?" {theyHe} asks. The {cl} says such talk is foolishness.',
        choices: [
          {
            t: "Set out a saucer of milk by the hearth every night",
            r: "The milk is gone each morning (the cat comes back for it). The hearth draws better. Who is to say?",
            fx: {happy:3,piety:1,them:{op:10}},
          },
          {
            t: "Clean the chimney and the dairy instead",
            check: {s:"craft",s2:"int",d:30},
            win: {
              r: "A bird's nest in the flue, a dirty pail in the dairy. The house-spirit is mollified, or at least the milk is.",
              fx: {int:.3,happy:3},
            },
            lose: {r:"You get soot everywhere and change nothing. You set out the saucer after all.",fx:{happy:-1}},
          },
          {
            t: "Tell {them} it is nonsense",
            r: "{them} tells the whole lane your house is cursed. Nobody borrows from you for a while, which is not all bad.",
            fx: {them:{op:-12},honor:-1},
          },
        ],
      },
    ]);
    const mourned=p=>deadOf(p,["spouse","father","mother","child","sibling","bestfriend","friend","grandparent"],2);
    add([
      {
        id: "lf_mourn_rite",
        cond: p=>(C.adult(p)||C.teen(p))&&recentDead(p,["spouse","father","mother","child","sibling","grandparent"],1),
        cool: 3,
        w: 1.5,
        title: "The rites for the dead",
        setup: (p,ctx)=>{const d=deadOf(p,["spouse","father","mother","child","sibling","grandparent"],1);setPid(p,ctx,d),ctx.who=relWord(p,d),ctx.rite=rite(p),ctx.cost=3*Math.max(1,Math.round(purse(p)/2)),ctx.cl=clergy(p)},
        text: "Your {who}, {them}, is to be {rite}. The {cl} wants {cost} suns for the rite. The neighbors have brought food. Everyone is looking to you.",
        choices: [
          {
            t: "Do everything properly, whatever it costs",
            r: "Every word said, every custom kept. The village says {them} was sent off as {theyHe} deserved.",
            fx: (p,ctx)=>{const v=pay(p,ctx.cost);v<ctx.cost&&addDebt(p,ctx.cost-v),pie(p,3),hon(p,2),A.willGrow(p,1.2,"grief"),hp(p,-4)},
          },
          {
            t: "Speak at the grave",
            check: {s:"persuasion",s2:"wil",d:33},
            win: {
              r: "You tell the truth about {them}, the good and the funny. Half the mourners are crying and the other half laughing.",
              fx: {fame:1,honor:2,wil:1,happy:2},
            },
            lose: {
              r: "Your voice breaks on the first sentence and does not come back. Somebody finishes for you.",
              fx: {wil:1.5,happy:-3},
            },
          },
          {
            t: "Borrow for the rite",
            r: "A debt, but a decent rite. Many families do the same.",
            fx: (p,ctx)=>{addDebt(p,ctx.cost),pie(p,2),A.willGrow(p,1,"grief")},
          },
          {
            t: "Keep it simple: the dead do not count coins",
            r: "A few words, a shroud, the plain ground. Some neighbors purse their lips. You do not care.",
            fx: {piety:-2,wil:1,happy:-3},
          },
        ],
      },
      {
        id: "lf_ash_night",
        cond: p=>C.adult(p)&&C.faith(p,"REL-01","REL-02","REL-17")&&A.relsOf(p,["spouse","father","mother","child","sibling","grandparent"]).some(x=>x.p&&!x.p.alive),
        cool: 4,
        title: "A place at the table",
        setup: (p,ctx)=>{const l=A.relsOf(p,["spouse","father","mother","child","sibling","grandparent"]).filter(x=>x.p&&!x.p.alive),d=l.length?A.pick(l).p:null;setPid(p,ctx,d),ctx.who=relWord(p,d)},
        text: "It is Ash Night, the last night of October, when every family sets a place at the table for its dead. You set a bowl for your {who}, {them}, and the candle gutters as if somebody had sat down.",
        choices: [
          {
            t: "Talk to {themHim} as if {theyHe} were there",
            r: "You tell {them} the year's news: the harvest, the children, the roof. It is foolish and it helps.",
            fx: {happy:4,wil:.8,piety:2},
          },
          {
            t: "Put {theirHis} favorite food in the bowl",
            r: "The whole house smells of it. Everyone remembers something, and the stories go on past midnight.",
            fx: {coin:-1,happy:5,piety:1},
          },
          {
            t: "Let the bowl stay empty",
            r: "You sit with the empty bowl a long time. Some years grief needs no food.",
            fx: {wil:1.2,happy:-3},
          },
        ],
      },
      {
        id: "lf_grave_ale",
        cond: p=>C.adult(p)&&C.faith(p,"REL-03")&&recentDead(p,["spouse","father","mother","child","sibling","bestfriend","friend","grandparent"],2),
        cool: 4,
        title: "The grave-ale",
        setup: (p,ctx)=>{setPid(p,ctx,mourned(p))},
        text: "By the custom of the Seven Halls you must brew the grave-ale for {them}, so the whole village can drink to the name. A good brew honors the dead. A thin one is remembered.",
        choices: [
          {
            t: "Brew it strong and plenty (4 suns)",
            req: p=>p.coin>=4,
            r: "The village drinks to {them} until the hall-priest has to be carried home. They say it was a send-off fit for a jarl.",
            fx: {coin:-4,honor:3,fame:1,happy:3},
          },
          {
            t: "Brew it yourself, with care",
            check: {s:"craft",s2:"husbandry",d:35},
            win: {
              r: "Dark, sweet and strong. People ask for the recipe, and you tell them it was {them}'s.",
              fx: {honor:2,skill:{craft:1},happy:3},
            },
            lose: {r:"Sour. The village drinks it anyway, for {them}'s sake, making faces.",fx:{honor:-1,happy:-1}},
          },
          {
            t: "Stand at the hall fire and speak the name",
            check: {s:"music",s2:"wil",d:37},
            win: {
              r: "You chant {theirHis} deeds in the old way. The hall goes quiet, and then roars the name back.",
              fx: {fame:1,wil:1,skill:{music:1}},
            },
            lose: {r:"You forget the words halfway. The hall-priest finishes. Nobody minds but you.",fx:{wil:.8}},
          },
        ],
      },
      {
        id: "lf_names_spoken",
        cond: p=>C.adult(p)&&C.faith(p,"REL-09"),
        cool: 5,
        title: "A name not spoken fades",
        setup: (p,ctx)=>{ctx.n1=A.givenName(p.cult,"F"),ctx.n2=A.givenName(p.cult,"F"),ctx.n3=A.givenName(p.cult,"M")},
        text: 'Before the market, you pour a little milk on the floor of the house and speak the names: your grandmother {n1}, her mother {n2}, and {n3} before them. "Are you there? I am here." Today you cannot remember the fourth name.',
        choices: [
          {
            t: "Go to the oldest aunt and ask",
            check: {s:"etiquette",s2:"persuasion",d:30},
            win: {
              r: "She gives you the name, and three more besides, and a long lecture. You carve them on a board by the door.",
              fx: {piety:3,happy:3,skill:{learning:1}},
            },
            lose: {
              r: "She remembers, but makes you pay for it in a whole day of listening to her complaints.",
              fx: {piety:2,wil:.4},
            },
          },
          {
            t: "Pay a Rememberer to sing the line (2 suns)",
            req: p=>p.coin>=2,
            r: "The Rememberer sings your line back nine generations. Some of the names make you laugh. Some make you cry.",
            fx: {coin:-2,piety:4,happy:4},
          },
          {
            t: "Speak the three you have, and apologize to the fourth",
            r: "You feel the fourth one fading. It sits with you all day.",
            fx: {piety:-1,wil:.6,happy:-2},
          },
        ],
      },
      {
        id: "lf_grief_belongings",
        cond: p=>C.adult(p)&&recentDead(p,["father","mother","spouse","grandparent"],2),
        cool: 6,
        title: "What they left",
        setup: (p,ctx)=>{const d=deadOf(p,["father","mother","spouse","grandparent"],2);setPid(p,ctx,d),ctx.who=relWord(p,d),ctx.found=A.pick(["a purse of old coins sewn into the mattress","a love letter from someone you have never heard of","a tally stick showing a debt owed to {themHim} by a neighbor","a lock of a baby's hair, wrapped in linen, from a child you never knew existed","a carved toy you made for {themHim} when you were six"])},
        text: "Going through the things of your {who}, {them}, you find {found}.",
        choices: [
          {
            t: "Keep it and say nothing",
            r: "Some things belong to the dead and to you. You put it away safe.",
            fx: (p,ctx)=>{if(/coins/.test(ctx.found)){const v=3*purse(p);return p.coin+=v,`(${v} suns.)`}return hp(p,2),A.willGrow(p,.5,"grief"),""},
          },
          {
            t: "Ask the family what it means",
            check: {s:"persuasion",s2:"int",d:31},
            win: {
              r: "An aunt tells you a story you never knew. You understand {them} better dead than you did alive.",
              fx: {int:.3,wil:.8,happy:2},
            },
            lose: {r:"Nobody will say. A door shuts on the subject, firmly.",fx:{wil:.5}},
          },
          {
            t: "Burn it with the rest",
            r: "You let it go into the fire. Whatever it was, it is finished now.",
            fx: {wil:.8,happy:-1},
          },
        ],
      },
      {
        id: "lf_widow_blue",
        cond: p=>C.adult(p)&&p.sex==="F"&&C.realm(p,"POL-03","POL-02","POL-15","POL-16")&&p.widowed&&A.S.year-p.widowed<=2,
        cool: 5,
        title: "A year in blue",
        setup: (p,ctx)=>{const x=setPid(p,ctx,A.makeLoveInterest(p));x.occ=A.pick(["a widowed vintner","a cloth trader","a guild master"])},
        text: "In {realmShort} a widow wears blue for a year. You are still in blue when {themFull}, {themOcc}, begins calling, and the street is counting the days on its fingers.",
        choices: [
          {
            t: "Keep the year, and send {themHim} away until it is done",
            r: "The street approves. {them} waits, which tells you something.",
            fx: {honor:3,piety:2,them:{type:"friend",op:20,back:"friend"}},
          },
          {
            t: "Receive {themHim}, blue and all",
            check: {s:"etiquette",s2:"wil",d:40},
            win: {
              r: "You manage it with such dignity that even the gossips run out of things to say.",
              fx: {them:{type:"lover",op:25,back:"lover"},happy:6},
            },
            lose: {
              r: "The gossips have a wonderful year. You do not.",
              fx: {them:{type:"lover",op:20,back:"lover"},honor:-4,happy:-2},
            },
          },
          {
            t: "Take off the blue early",
            r: "You have mourned enough. The street is scandalized. You find you can breathe.",
            fx: {honor:-3,happy:5,wil:.6},
          },
        ],
      },
      {
        id: "lf_winter_dead",
        cond: p=>C.adult(p)&&C.realm(p,"POL-26")&&!C.town(p),
        cool: 6,
        title: "The winter shed",
        setup: (p,ctx)=>{ctx.n=A.ri(3,7)},
        text: "In Drevna the ground freezes too hard to dig, so the winter dead are stacked in a shed until spring. This year there are {n} of them, and the thaw has come. The whole village will bury them together.",
        choices: [
          {
            t: "Dig, with the other strong backs",
            r: "A long, cold, silent day. At the end, honey porridge at the graves, and a feeling of having done right.",
            fx: {str:.4,piety:2,wil:.8},
          },
          {
            t: "Sing the old hymn at the graves",
            check: {s:"music",s2:"faith",d:33},
            win: {
              r: "Your voice carries over the snowmelt. Old women cry. The priest asks you to sing every year.",
              fx: {piety:3,fame:1,skill:{music:1}},
            },
            lose: {r:"You crack on the high note. Everyone pretends not to notice.",fx:{piety:1}},
          },
          {
            t: "Keep your children away from it",
            r: "They watch from the fence anyway. Children always do.",
            fx: {wil:.3},
          },
        ],
      },
    ]);
    add([
      {
        id: "lf_loan_shark",
        cond: p=>C.adult(p)&&free(p)&&(p.coin<10*purse(p)||(p.debt||0)>0)&&!C.flag(p,"lf_shark"),
        cool: 8,
        title: "Easy money",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{status:"merchant",ageAdj:C.ageAdj(p)+10}));x.occ=lender(p),ctx.amt=15*purse(p),ctx.why=A.pick(["the roof that must be mended before winter","the rent, which is overdue","seed for the spring","a sick child's physician","a debt to a worse man"])},
        text: 'You need money for {why}, and {themFull}, {themOcc}, has it: {amt} suns today, "a penny on the sun each week, between friends." {theirHis} two large nephews nod along.',
        choices: [
          {
            t: "Take the money",
            r: "Coin in your hand, and a weight in your stomach.",
            fx: (p,ctx)=>(p.coin+=ctx.amt,addDebt(p,Math.round(ctx.amt*1.6)),p.flags.lf_shark=A.S.year,bump(p,T(ctx),0,"acquaint"),`(+${ctx.amt} suns; you owe ${Math.round(ctx.amt*1.6)}.)`),
          },
          {
            t: "Haggle the rate down",
            check: {s:"trade",s2:"intimidation",d:45},
            win: {
              r: "Half the rate, in writing. {them} looks at you with new respect, and a little dislike.",
              fx: (p,ctx)=>(p.coin+=ctx.amt,addDebt(p,Math.round(ctx.amt*1.2)),A.trainSkill(p,"trade",1),`(+${ctx.amt} suns; you owe ${Math.round(ctx.amt*1.2)}.)`),
            },
            lose: {r:'{them} smiles. "Then go elsewhere." There is nowhere else.',fx:{happy:-3}},
          },
          {
            t: "Do without: sell something instead",
            r: "Your best coat, the good pot, your father's knife. You get a third of their worth and keep your neck free.",
            fx: (p,ctx)=>{p.coin+=Math.round(ctx.amt/3),A.willGrow(p,.8,"want"),hp(p,-3)},
          },
        ],
      },
      {
        id: "lf_shark_collects",
        cond: p=>C.adult(p)&&C.flag(p,"lf_shark")&&A.S.year-p.flags.lf_shark>=1,
        cool: 3,
        w: 1.6,
        title: "The nephews come calling",
        setup: (p,ctx)=>{ctx.owed=Math.max(10,p.debt||20)},
        text: `The moneylender's two nephews are at your door. "Uncle says it has been a year, and you owe {owed} suns. Uncle is a patient man. We are not."`,
        choices: [
          {
            t: "Pay it all",
            req: (p,C2,ctx)=>p.coin>=ctx.owed,
            r: "You count it out on the table. They count it again. Then they are gone, and you can breathe.",
            fx: (p,ctx)=>{pay(p,ctx.owed),p.debt=0,delete p.flags.lf_shark,hp(p,8)},
          },
          {
            t: "Pay what you can and beg time",
            check: {s:"persuasion",s2:"wil",d:40},
            win: {
              r: "They take half and give you till spring. One of them even looks sorry.",
              fx: (p,ctx)=>{const v=pay(p,Math.round(ctx.owed/2));p.debt=Math.max(0,(p.debt||0)-v),p.flags.lf_shark=A.S.year},
            },
            lose: {
              r: "They take what you have and break two fingers so you will remember the rest.",
              fx: (p,ctx)=>{const v=pay(p,ctx.owed);p.debt=Math.max(0,(p.debt||0)-v),p.flags.lf_shark=A.S.year,A.addWound(p,"lost_fingers"),hurt(p,10,"a beating over debt"),A.willGrow(p,2,"fear")},
            },
          },
          {
            t: "Fight them",
            r: "Two of them, one of you, and a doorway.",
            fx: {
              duel: {
                tier: 2,
                title: "the moneylender's nephews",
                opts: {kind:"brawl",place:"your own doorway",lethal:!1,toYield:!0,title:"Debt collectors"},
              },
            },
          },
          {
            t: "Run: pack tonight and go to {town}",
            check: {s:"stealth",s2:"survival",d:40},
            win: {
              r: "Gone by dawn with what you can carry. The debt stays behind with your name on it.",
              fx: p=>(delete p.flags.lf_shark,p.debt=0,hon(p,-6),p.home=A.pick(A.S.prov.filter(x=>x.owner===p.realm).map(x=>x.id).concat([p.home])),A.willGrow(p,1.5,"flight"),"(You start again somewhere new.)"),
            },
            lose: {
              r: "They are waiting at the crossroads. You pay in blood instead of coin.",
              fx: {health:-20,cause:"a beating over debt",wound:"broken_ribs",wil:2},
            },
          },
        ],
      },
      {
        id: "lf_famine_ladder",
        cond: p=>C.adult(p)&&low(p)&&!C.town(p),
        cool: 10,
        w: .8,
        title: "The hungry spring",
        setup: (p,ctx)=>{ctx.food=food(p)},
        text: "The harvest came in short, and by Lent the bread has husks and chestnut flour in it, then acorns, then nettles. Wheat costs four times what it did. In the loft is the seed grain for next year, and in the byre the plough ox.",
        choices: [
          {
            t: "Eat the seed grain",
            r: "Bellies full for a month. Next year's field will lie half-sown. Your grandmother warned of this: it is how the Dimming taught people to starve twice.",
            fx: {health:4,coinPct:-.3,wil:1,happy:-4},
          },
          {
            t: "Tighten belts and wait for spring greens",
            check: {s:"wil",s2:"sta",d:43},
            win: {
              r: "Thin, hollow-eyed, alive. The seed goes into the ground. You remember this spring all your life.",
              fx: {wil:2.5,sta:.6,health:-6,cause:"hunger"},
            },
            lose: {
              r: "The hunger gets into your chest. A cough that will not go, and ribs like a ladder.",
              fx: {wil:2,health:-16,cause:"hunger",wound:"lungs"},
            },
          },
          {
            t: "Forage the woods and streams",
            check: {s:"survival",s2:"tracking",d:39},
            win: {
              r: "Mushrooms, crayfish, a hare in a snare, roots your grandmother showed you. Enough.",
              fx: {skill:{survival:2,tracking:1},wil:1},
            },
            lose: {
              r: "The woods are stripped already; half the village had the same idea. The reeve fines you for the hare.",
              fx: {coin:-2,wil:1,health:-6,cause:"hunger"},
            },
          },
          {
            t: "Sell the ox and buy grain",
            r: "Grain for the winter, and no ox for the spring ploughing. You will pull the plough yourself, with your family.",
            fx: {coin:10,str:.6,health:-4,cause:"hard labor",happy:-6},
          },
        ],
      },
      {
        id: "lf_house_robbed",
        cond: p=>C.adult(p)&&!slave(p)&&p.coin>10,
        cool: 8,
        title: "The door was open",
        setup: (p,ctx)=>{ctx.v=Math.max(5,Math.round(p.coin*.3)),ctx.fest=festOf(p)},
        text: 'You come home from {fest} to find the door forced and your hiding place empty. {v} suns, gone. A neighbor saw "a tall man with a limp" leave by the back lane.',
        choices: [
          {
            t: "Go after the tall man with the limp",
            check: {s:"tracking",s2:"int",d:43},
            win: {
              r: "You find him at an alehouse in {town}, spending your money. The reeve gets him; you get most of it back.",
              fx: (p,ctx)=>{const back=Math.round(ctx.v*.7);return pay(p,ctx.v-back),A.trainSkill(p,"tracking",2),`(You recover ${back} of the ${ctx.v} suns.)`},
            },
            lose: {
              r: "Every tall man in {town} limps, it seems. You come home with sore feet and nothing else.",
              fx: (p,ctx)=>{pay(p,ctx.v),A.willGrow(p,.8,"loss")},
            },
          },
          {
            t: "Raise the hue and cry",
            check: {s:"command",s2:"persuasion",d:37},
            win: {
              r: "The village turns out. They catch him by the ford with your purse in his boot.",
              fx: {fame:1,honor:1},
            },
            lose: {r:"By the time anyone moves, he is long gone.",fx:(p,ctx)=>{pay(p,ctx.v)}},
          },
          {
            t: "Accept it, and hide your money better",
            r: "Gone is gone. Next time you bury it under the hearthstone, where your grandmother kept hers.",
            fx: (p,ctx)=>{pay(p,ctx.v),A.willGrow(p,1,"loss"),hp(p,-5)},
          },
        ],
      },
      {
        id: "lf_hoard",
        cond: p=>C.adult(p)&&!C.town(p)&&low(p),
        cool: 30,
        w: .3,
        once: !0,
        title: "Something under the plough",
        setup: (p,ctx)=>{ctx.cl=clergy(p),ctx.n=A.ri(30,90),ctx.face=A.pick(["an emperor of old Solen","a king nobody remembers","a queen with her hair in braids","a face worn smooth"])},
        text: "Your plough turns up a broken pot, and in it about {n} old silver coins stamped with {face}. By law a hoard belongs to the lord whose land it lies in.",
        choices: [
          {
            t: "Hand it to the lord's reeve",
            r: "The reeve gives you a sun for your honesty and keeps the rest for the lord. The {cl} praises you on Sunday.",
            fx: {coin:1,honor:6,piety:2,favor:3},
          },
          {
            t: "Keep it and spend it slowly",
            check: {s:"deception",s2:"trade",d:45},
            win: {
              r: "A coin here, a coin there, far from home. Nobody asks. You are, quietly, a little rich.",
              fx: (p,ctx)=>(p.coin+=ctx.n,hon(p,-2),`(+${ctx.n} suns, over time.)`),
            },
            lose: {r:"A moneychanger in {town} recognizes the old silver and calls the reeve.",fx:{punish:"theft"}},
          },
          {
            t: "Rebury it where only you know",
            r: "Back in the earth, under the old thorn. Something for a black year. You tell nobody.",
            fx: {flag:"lf_hoard_buried",wil:.5,happy:4},
          },
        ],
      },
      {
        id: "lf_hoard_dig",
        cond: p=>C.adult(p)&&C.flag(p,"lf_hoard_buried")&&(p.coin<5||(p.debt||0)>20||C.old(p)),
        cool: 5,
        once: !0,
        title: "Under the old thorn",
        text: "The black year has come, or your old age has. The pot is still under the thorn, if your memory holds.",
        choices: [
          {
            t: "Dig it up",
            r: "There it is, green with age. The silver goes to pay what must be paid.",
            fx: p=>{const v=A.ri(30,70);return p.coin+=v,delete p.flags.lf_hoard_buried,hp(p,8),`(+${v} suns.)`},
          },
          {
            t: "Leave it for your heirs",
            r: "You tell your eldest where it is, in a whisper. Let them have a black-year purse too.",
            fx: p=>{delete p.flags.lf_hoard_buried,A.willGrow(p,.6,"legacy"),hon(p,1)},
          },
        ],
      },
      {
        id: "lf_clipped_coin",
        cond: p=>C.adult(p)&&free(p)&&!C.race(p,"elf"),
        cool: 7,
        title: "Bad money",
        setup: (p,ctx)=>{ctx.coin=coins(p),ctx.v=4*purse(p)},
        text: `You were paid {v} suns' worth of {coin} last week. Today the moneychanger weighs them, bites one, and pushes half of them back. "Clipped. Shaved at the edges. Worth two-thirds, if that."`,
        choices: [
          {
            t: "Find the man who paid you",
            check: {s:"intimidation",s2:"persuasion",d:40},
            win: {
              r: "He swears he did not know, and makes it good in honest coin to keep you quiet.",
              fx: {skill:{intimidation:1}},
            },
            lose: {r:'He laughs: "Coin is coin. Take it up with the mint."',fx:(p,ctx)=>{pay(p,Math.round(ctx.v/3))}},
          },
          {
            t: "Pass the bad coins on at the market",
            check: {s:"deception",s2:"trade",d:35},
            win: {
              r: "A busy stall, a careless keeper. The problem is now someone else's.",
              fx: {honor:-3,skill:{deception:1}},
            },
            lose: {
              r: "The stallholder bites one and shouts. Coin-clipping is a hanging matter in some places. Here you are only fined and shamed.",
              fx: (p,ctx)=>{pay(p,ctx.v),hon(p,-6)},
            },
          },
          {
            t: 'Take the loss: "Bite the coin, not the banker"',
            r: "You learn to weigh every coin twice, like everybody else.",
            fx: (p,ctx)=>{pay(p,Math.round(ctx.v/3)),A.trainSkill(p,"trade",1)},
          },
        ],
      },
      {
        id: "lf_dice_night",
        cond: p=>C.adult(p)&&!slave(p)&&!C.faith(p,"REL-07"),
        cool: 5,
        title: "A night at the dice",
        setup: (p,ctx)=>{ctx.game=law(p)==="sun"?"Sun and Shadow":law(p)==="north"?"bone dice":law(p)==="orc"?"ankle-bones":"dice",ctx.stake=Math.max(3,2*purse(p))},
        text: "At the back of the alehouse they are playing {game}, and the stake is {stake} suns. A stranger with soft hands is winning every throw and buying everyone drinks.",
        choices: [
          {
            t: "Play, and watch his hands",
            req: (p,C2,ctx)=>p.coin>=ctx.stake,
            check: {s:"gambling",s2:"ins",d:43},
            win: {
              r: "Loaded dice, palmed and swapped. You call it out at the right moment and the table takes back its money, with interest.",
              fx: (p,ctx)=>{p.coin+=ctx.stake*2,A.fame(p,1),A.trainSkill(p,"gambling",2)},
            },
            lose: {
              r: "You never see how he does it. You only see your money go.",
              fx: (p,ctx)=>{pay(p,ctx.stake),hp(p,-3)},
            },
          },
          {
            t: "Play for fun, small stakes",
            r: (p,ctx)=>ctx.won?"A lucky streak. You go home with more than you came with, singing.":"You lose a few pennies and have a fine evening.",
            fx: (p,ctx)=>(ctx.won=A.chance(.45),ctx.won?p.coin+=2:pay(p,1),hp(p,2),""),
          },
          {
            t: "Cheat back",
            req: p=>C.prof(p,"gambling",35)||C.prof(p,"deception",40),
            check: {s:"deception",s2:"spd",d:47},
            win: {
              r: "He cheats, you cheat better. He leaves angry and poorer and cannot complain.",
              fx: (p,ctx)=>{p.coin+=ctx.stake*3,hon(p,-2)},
            },
            lose: {
              r: "He catches you. In the alley he and his friends explain the rules.",
              fx: {health:-12,cause:"a beating in an alley",honor:-3},
            },
          },
          {t:"Go home",r:"You finish your drink and go. Sensible. Dull. Richer.",fx:{wil:.2}},
        ],
      },
      {
        id: "lf_ship_share",
        cond: p=>C.adult(p)&&free(p)&&p.coin>=20&&(C.coast(p)||C.town(p)),
        cool: 9,
        title: "A share in a ship",
        setup: (p,ctx)=>{ctx.share=Math.max(20,Math.round(p.coin*.4)),ctx.to=A.pick(["the spice ports of the south","the grain lanes to Tamar","the tin coast of the north","the Middle Sea wine trade"])},
        text: "A captain at the quay is selling shares in a cog bound for {to}. {share} suns buys a share; if she comes home, it pays three times over. If not, the sea keeps it. Old Ironjaw has sunk four ships since 1088, they say.",
        choices: [
          {
            t: "Buy the share",
            req: (p,C2,ctx)=>p.coin>=ctx.share,
            r: (p,ctx)=>ctx.ok?"Seven months later she comes in low in the water, stinking of pepper. Your share pays nearly triple.":"She never comes home. Storm, pirates or the leviathan; nobody will ever know.",
            fx: (p,ctx)=>{if(pay(p,ctx.share),ctx.ok=A.chance(.55),ctx.ok){const v=Math.round(ctx.share*2.8);return p.coin+=v,A.trainSkill(p,"trade",2),`(+${v} suns.)`}return A.willGrow(p,1,"loss"),""},
          },
          {
            t: "Look into the captain first",
            check: {s:"trade",s2:"intrigue",d:40},
            win: {
              r: (p,ctx)=>ctx.good?"Sober, careful, never lost a ship. You buy in, and she comes home rich.":"Two wrecks and a debt in {town}. You keep your money, and are glad of it.",
              fx: (p,ctx)=>{if(ctx.good=A.chance(.5),A.trainSkill(p,"intrigue",1),ctx.good){pay(p,ctx.share);const v=Math.round(ctx.share*2.8);return p.coin+=v,`(+${v} suns.)`}return""},
            },
            lose: {r:"Nobody will tell you anything useful. You hesitate, and the shares are sold.",fx:{happy:-1}},
          },
          {t:"Keep your money in the ground",r:"The ground does not sink.",fx:{wil:.2}},
        ],
      },
      {
        id: "lf_lost_purse",
        cond: p=>C.adult(p)&&p.coin>=5&&!slave(p),
        cool: 7,
        title: "Your purse is gone",
        setup: (p,ctx)=>{ctx.v=Math.max(3,Math.round(p.coin*.2))},
        text: "In the crush at the market in {town} you put your hand to your belt and find only the cut strings. {v} suns, gone.",
        choices: [
          {
            t: "Look for the cutpurse in the crowd",
            check: {s:"ins",s2:"spd",d:41},
            win: {
              r: "A boy walking too calmly. You catch his collar. He gives it back, shaking, and you let him run.",
              fx: {spd:.2},
            },
            lose: {r:"Every face is innocent and every hand is busy.",fx:(p,ctx)=>{pay(p,ctx.v)}},
          },
          {
            t: "Ask the stallholders who works this market",
            check: {s:"intrigue",s2:"persuasion",d:39},
            win: {
              r: 'A word in the right ear, a sun to the right "uncle", and your purse comes back lighter but home.',
              fx: (p,ctx)=>{pay(p,Math.round(ctx.v/3)),A.trainSkill(p,"intrigue",2)},
            },
            lose: {r:"The stallholders know nothing, very firmly.",fx:(p,ctx)=>{pay(p,ctx.v)}},
          },
          {
            t: "Curse, and go home",
            r: "A lesson: a purse goes inside the shirt in a crowd.",
            fx: (p,ctx)=>{pay(p,ctx.v),A.willGrow(p,.5,"loss")},
          },
        ],
      },
      {
        id: "lf_rent_raised",
        cond: p=>C.adult(p)&&C.town(p)&&free(p)&&!high(p),
        cool: 8,
        title: "The rent goes up",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{status:"merchant",ageAdj:C.ageAdj(p)+15}));x.occ="your landlord",ctx.v=2*purse(p)},
        text: 'Your landlord {them} has raised the rent by {v} suns a quarter. "Times are hard." {theyHe} has a new fur collar.',
        choices: [
          {t:"Pay",r:"You pay, and eat a little less meat.",fx:(p,ctx)=>{pay(p,ctx.v*2),hp(p,-2)}},
          {
            t: "Organize the other tenants to refuse",
            check: {s:"persuasion",s2:"command",d:45},
            win: {
              r: "Twelve households, one voice. {them} backs down rather than empty the whole building.",
              fx: {them:{type:"rival",op:-20,back:"rival"},fame:1,skill:{persuasion:2}},
            },
            lose: {
              r: "The others lose their nerve. You alone are turned out at the quarter day.",
              fx: (p,ctx)=>{bump(p,T(ctx),-20,"enemy","enemy"),pay(p,ctx.v),hp(p,-8),A.willGrow(p,1,"injustice")},
            },
          },
          {
            t: "Find a cheaper room across town",
            check: {s:"trade",s2:"int",d:33},
            win: {r:"A smaller room with a better landlady and fewer fleas. A good trade.",fx:{coin:2,happy:2}},
            lose: {
              r: "The cheaper room is cheaper for good reasons. The roof leaks onto your bed.",
              fx: {health:-3,cause:"a damp room",happy:-3},
            },
          },
        ],
      },
      {
        id: "lf_inheritance_uncle",
        cond: p=>C.adult(p)&&!slave(p),
        cool: 30,
        w: .4,
        once: !0,
        title: "An uncle you never met",
        setup: (p,ctx)=>{ctx.unc=A.givenName(p.cult,"M"),ctx.v=25*purse(p),ctx.debt=Math.round(ctx.v*A.rf(.3,1.4))},
        text: "A letter reaches you: your father's brother {unc}, who went to {town} forty years ago and never wrote, is dead. He has left you everything, worth perhaps {v} suns. He has also left debts, nobody yet knows how many.",
        choices: [
          {
            t: "Accept the inheritance, debts and all",
            r: (p,ctx)=>ctx.debt<ctx.v?"When the creditors are paid, there is real money left. Uncle {unc}, wherever you are, thank you.":"The debts are worse than the estate. You are now poorer than before, and the owner of a broken cart.",
            fx: (p,ctx)=>{const net=ctx.v-ctx.debt;return net>=0?(p.coin+=net,`(+${net} suns.)`):(addDebt(p,-net),A.willGrow(p,1,"debt"),`(You owe ${-net} suns.)`)},
          },
          {
            t: "Go to {town} and examine the books first",
            check: {s:"learning",s2:"trade",d:43},
            win: {
              r: "You find two debts already paid and one creditor who is a fraud. The estate comes out well ahead.",
              fx: (p,ctx)=>{const net=Math.max(Math.round(ctx.v*.4),ctx.v-Math.round(ctx.debt*.6));return p.coin+=net,A.trainSkill(p,"learning",1),`(+${net} suns.)`},
            },
            lose: {
              r: "The books are a mess and the creditors are wolves. You refuse the inheritance to be safe.",
              fx: {wil:.4,coin:-2},
            },
          },
          {
            t: "Refuse it: a dead stranger's debts are not yours",
            r: "Prudence. You will always wonder.",
            fx: {wil:.3},
          },
        ],
      },
      {
        id: "lf_pawn_heirloom",
        cond: p=>C.adult(p)&&free(p)&&p.coin<5,
        cool: 8,
        title: "The pawn-lender's window",
        setup: (p,ctx)=>{ctx.thing=A.pick(["your mother's silver ring","your father's good knife","the wedding cup","your grandmother's amber beads"]),ctx.v=3*purse(p)+4},
        text: "You are short, badly. The pawn-lender in {home} will give {v} suns for {thing}, and hold it for a year. After that it goes in the window.",
        choices: [
          {
            t: "Pawn it",
            r: "It sits in his drawer, and you feel its absence like a missing tooth.",
            fx: (p,ctx)=>{p.coin+=ctx.v,p.flags.lf_pawned=A.S.year,hp(p,-3)},
          },
          {
            t: "Sell your labor instead: work nights",
            r: "Two months of carrying sacks after dark. You keep {thing}.",
            fx: {sta:.5,health:-4,cause:"overwork",coin:6,wil:.8},
          },
          {
            t: "Ask your family for help",
            check: {s:"persuasion",s2:"etiquette",d:33},
            win: {r:"An aunt helps, with a lecture. Worth it.",fx:{coin:5,happy:-1}},
            lose: {
              r: "Everyone is short this year. You pawn it after all.",
              fx: (p,ctx)=>{p.coin+=ctx.v,p.flags.lf_pawned=A.S.year},
            },
          },
        ],
      },
    ]);
    add([
      {
        id: "lf_health_chest",
        cond: p=>midA(p)||C.old(p),
        cool: 10,
        title: "A pain in the chest",
        setup: (p,ctx)=>{ctx.heal=healer(p)},
        text: "Climbing the hill with a load this morning, a fist closed round your heart and squeezed. You sat in the mud until it let go. It has happened twice more since.",
        choices: [
          {
            t: "Pay a physician in town (2 suns a visit)",
            req: p=>p.coin>=4,
            check: {s:"learning",s2:"int",d:30},
            win: {
              r: "A good one, for once: no bleeding, less salt, less weight on your back, willow bark and rest. The fist comes less often.",
              fx: {coin:-4,health:8,wil:.5},
            },
            lose: {
              r: "He bleeds you twice and charges for both. You feel worse, and poorer.",
              fx: {coin:-4,health:-6,cause:"a bad heart"},
            },
          },
          {
            t: "Ask {heal}",
            r: "Hawthorn tea, a charm, and orders to stop carrying so much. The tea is bitter. The advice is sound.",
            fx: {health:4,coin:-1,happy:1},
          },
          {
            t: "Ignore it and work on",
            r: (p,ctx)=>ctx.bad?"It comes back in the field and puts you on your back among the furrows. You live, but you are not the same.":"It passes, as such things do, for now.",
            fx: (p,ctx)=>(ctx.bad=A.chance(.35),ctx.bad?(hurt(p,18,"a bad heart"),A.train(p,"sta",-.5),A.willGrow(p,1.5,"mortality")):A.willGrow(p,.5,"stubbornness"),""),
          },
        ],
      },
      {
        id: "lf_health_bleeding",
        cond: p=>C.adult(p)&&!low(p)&&p.health<80,
        cool: 9,
        title: "The physician recommends bleeding",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{status:"merchant",ageAdj:C.ageAdj(p)+15}));x.occ="a physician trained from the old Solen books"},
        text: '{themFull}, {themOcc}, has read your pulse and your urine and pronounces a surfeit of blood. "A good bleeding, and you will be a new {manwoman}." The bowl is already out.',
        choices: [
          {
            t: "Bare your arm",
            r: "You feel faint and cold and grey for a week. Then slowly better, in spite of it.",
            fx: {health:-8,cause:"a physician's bleeding",coin:-2,wil:.5},
          },
          {
            t: "Refuse the bowl and ask for anything else",
            check: {s:"persuasion",s2:"medicine",d:35},
            win: {
              r: "Grumbling, {them} prescribes rest, broth and clean water instead. It is the best advice {theyHe} has given all year.",
              fx: {health:6,coin:-2,skill:{medicine:1}},
            },
            lose: {r:"{them} is offended and leaves, charging you for the visit anyway.",fx:{coin:-2}},
          },
          {
            t: "Send {themHim} away and go to the herbwife",
            r: "Willow bark and a stern talking-to about drink. Cheaper and kinder.",
            fx: {health:4,coin:-1},
          },
        ],
      },
      {
        id: "lf_health_relic",
        cond: p=>C.adult(p)&&p.health<75&&C.faith(p,"REL-01","REL-02","REL-17"),
        cool: 8,
        title: "A saint's dust",
        setup: (p,ctx)=>{ctx.cl=clergy(p),ctx.price=3+A.ri(0,5),ctx.relic=A.pick(["dust from a saint's grave in a twist of linen","a sun-cake blessed at noon in Solenne","a splinter of the True Altar","a vial of water from a holy well"])},
        text: "A pilgrim at the church door is selling {relic}, guaranteed against fevers, swellings and the evil eye, {price} suns. He has a brass sun badge on his hat and a very sincere face.",
        choices: [
          {
            t: "Buy it, and pray",
            req: (p,C2,ctx)=>p.coin>=ctx.price,
            r: "You keep it under your pillow. Whether it does anything, your faith does: you sleep better.",
            fx: (p,ctx)=>{pay(p,ctx.price),pie(p,3),hp(p,3),p.health=Math.min(A.maxHealth(p),p.health+2)},
          },
          {
            t: "Ask him which saint, and where",
            check: {s:"faith",s2:"int",d:37},
            win: {
              r: "He gets the saint's name wrong and the town wrong too. You show him the door. The {cl} thanks you.",
              fx: {piety:2,int:.3,honor:1},
            },
            lose: {r:"His answers are glib and you cannot fault them. You buy nothing, and wonder.",fx:{piety:1}},
          },
          {t:"Walk past",r:"Rest, broth and patience. Nothing holy about it.",fx:{health:2}},
        ],
      },
      {
        id: "lf_health_plague_near",
        cond: p=>C.adult(p)&&!C.race(p,"elf","dwarf"),
        cool: 15,
        w: .5,
        title: "Plague in {place}",
        setup: (p,ctx)=>{ctx.place=A.T("{town}"),ctx.cl=clergy(p)},
        text: "Word comes that plague has reached {place}: carts of dead going out to the lime pits, gates shut, the rich fleeing to the country. The road from {place} runs past your door.",
        choices: [
          {
            t: "Shut the door to everyone until it passes",
            check: {s:"wil",s2:"survival",d:37},
            win: {
              r: "Forty days of turning people away, of hard eyes and harder silences. Nobody in your house sickens.",
              fx: {wil:2,honor:-2,happy:-6},
            },
            lose: {
              r: "A cousin begs at the door, and you cannot refuse. The fever comes in with her.",
              fx: {health:-25,cause:"plague",wil:2,happy:-10},
            },
          },
          {
            t: "Flee to the hills with your family",
            req: p=>free(p),
            r: "A summer in a shepherd's hut, living on milk and fear. You come home to an empty village and a full churchyard.",
            fx: {coinPct:-.2,wil:1.5,sta:.5,happy:-8},
          },
          {
            t: "Help nurse the sick",
            check: {s:"medicine",s2:"sta",d:50},
            win: {
              r: "You work beside the sun-sisters through the worst of it and somehow never sicken. People will remember your face.",
              fx: {fame:3,honor:6,piety:3,skill:{medicine:4},wil:2.5,deed:"Nursed the sick through the plague"},
            },
            lose: {
              r: "It takes you as it takes everyone. You are a week in the dark, and wake thinner than a ghost.",
              fx: {health:-35,cause:"plague",wil:3,honor:4},
            },
          },
          {
            t: "Burn sulfur and pray to {god}",
            r: "The whole house stinks of rotten eggs. It does not help. You pray anyway, and the plague passes you by, this time.",
            fx: {piety:3,health:-2,cause:"sulfur smoke"},
          },
        ],
      },
      {
        id: "lf_health_mad_kin",
        cond: p=>C.adult(p)&&!slave(p),
        cool: 14,
        w: .5,
        title: "The storm in the head",
        setup: (p,ctx)=>{const x=setPid(p,ctx,known(p,["sibling","cousin","uncle","father","mother"],"cousin",20));ctx.rw=relWord(p,x),ctx.cl=clergy(p),ctx.what=A.pick(["talks to people who are not there","has stopped eating, sleeping or speaking","wanders the roads at night shouting","tried to set the thatch alight"])},
        text: "Your {rw} {them} {what}. The {cl} says it is the cold in the soul; the orcs say a storm has entered the head. The neighbors say it must be dealt with.",
        choices: [
          {
            t: "Keep {themHim} at home, gently",
            r: "Hard years. Good days and terrible ones. {them} knows you at the end, and that is something.",
            fx: {them:{op:30},wil:2,happy:-6,coin:-4,honor:3},
          },
          {
            t: "Pay for a place at a monastery infirmary",
            req: p=>p.coin>=15,
            r: "Quiet walls, kind brothers, a garden. You visit at the holy days. {them} seems almost at peace.",
            fx: {coin:-15,them:{op:15},happy:-2},
          },
          {
            t: "Chain {themHim} in the byre, as others do",
            r: "It is what people do. It is cruel. You do it, and it eats at you.",
            fx: {them:{op:-25},honor:-3,wil:1,happy:-10},
          },
        ],
      },
      {
        id: "lf_childbed",
        cond: p=>C.adult(p)&&C.married(p)&&!C.old(p)&&frac(p)<.6&&["human","halfelf","halforc","orc"].includes(p.race)&&spouseOf(p)&&spouseOf(p).sex!==p.sex,
        cool: 6,
        w: .8,
        title: "The birth",
        setup: (p,ctx)=>{const s=spouseOf(p),mom=p.sex==="F"?p:s;setPid(p,ctx,s),ctx.me=p.sex==="F",ctx.mw=A.givenName(p.cult,"F")},
        text: p=>p.sex==="F"?"Your time has come, early and hard. Old {mw} the midwife, who has brought half of {home} into the world, has her sleeves rolled up. One birth in sixty kills the mother, and this one is going badly.":"Your wife {them} has been in labor since dawn. Old {mw} the midwife comes out, wipes her hands, and says it is going badly. One birth in sixty kills the mother.",
        choices: [
          {
            t: p=>p.sex==="F"?"Fight through it":"Send for the barber-surgeon from town (5 suns)",
            req: p=>p.sex==="F"||p.coin>=5,
            check: {s:"wil",s2:"sta",d:35},
            win: {
              r: "Near dawn, a furious, healthy cry. Mother and child both live. {mw} says she has seen worse, which is a lie.",
              fx: p=>{p.sex==="M"&&pay(p,5);const x=mk(p,{ageAdj:0,minAge:0});x.sur=p.sur||x.sur,p.children.push(x.id),A.link(p,x,"child",50,p.sex==="M"?"father":"mother");const s=spouseOf(p);return s&&(s.children.push(x.id),A.link(s,x,"child",50,s.sex==="M"?"father":"mother")),hp(p,10),A.willGrow(p,1.5,"ordeal"),`(A ${x.sex==="M"?"son":"daughter"}: ${x.given}.)`},
            },
            lose: {
              r: (p,ctx)=>ctx.lost?"The child does not live. {mw} wraps the little body in linen while you hold on to each other.":"Mother and child live, but it was very close, and the mother is a long time recovering.",
              fx: (p,ctx)=>(p.sex==="M"&&pay(p,5),ctx.lost=A.chance(.5),p.sex==="F"?hurt(p,20,"childbed"):bump(p,spouseOf(p),10),hp(p,ctx.lost?-20:-4),A.willGrow(p,ctx.lost?3:1.5,"grief"),""),
            },
          },
          {
            t: "Trust old {mw} and pray",
            r: (p,ctx)=>ctx.ok?"{mw} turns the child with her own hands. A long night, and then a cry. You will never forget her face by the candle.":"The child comes still and silent. The mother lives. {mw} stays all night.",
            fx: (p,ctx)=>{if(ctx.ok=A.chance(.6),pie(p,2),ctx.ok){const x=mk(p,{ageAdj:0,minAge:0});x.sur=p.sur||x.sur,p.children.push(x.id),A.link(p,x,"child",50,p.sex==="M"?"father":"mother");const s=spouseOf(p);return s&&(s.children.push(x.id),A.link(s,x,"child",50,s.sex==="M"?"father":"mother")),hp(p,8),`(A ${x.sex==="M"?"son":"daughter"}: ${x.given}.)`}return hp(p,-18),A.willGrow(p,2.5,"grief"),""},
          },
        ],
      },
      {
        id: "lf_health_fall",
        cond: p=>C.adult(p)&&!C.old(p),
        cool: 9,
        title: "A bad fall",
        setup: (p,ctx)=>{ctx.from=A.pick(["the hayloft ladder","a wet roof you were mending","the back of a cart","the icy steps of the well","a tree you were pruning"])},
        text: "You fall from {from} and land badly. Something in your leg went with a crack you heard. The barber-surgeon in town sets bones for a sun; the herbwife for eggs and prayers.",
        choices: [
          {
            t: "Pay the barber-surgeon to set it (1 sun)",
            req: p=>p.coin>=1,
            check: {s:"wil",s2:"sta",d:30},
            win: {
              r: "He pulls, you scream, it clicks. Six weeks in splints and it heals straight.",
              fx: {coin:-1,health:-8,cause:"a fall",wil:1},
            },
            lose: {
              r: "Set, but not quite straight. You will walk with a hitch for the rest of your days.",
              fx: {coin:-1,health:-10,cause:"a fall",wound:"limp",wil:1},
            },
          },
          {
            t: "Set it yourself",
            req: p=>C.prof(p,"medicine",35),
            check: {s:"medicine",s2:"wil",d:40},
            win: {
              r: "Two neighbors to pull, you to guide. Teeth gritted. A clean set. Even the barber is impressed.",
              fx: {health:-8,cause:"a fall",skill:{medicine:2},wil:1.5},
            },
            lose: {r:"It goes wrong and stays wrong.",fx:{health:-12,cause:"a fall",wound:"limp",wil:1.5}},
          },
          {
            t: "Let the herbwife bind it",
            r: (p,ctx)=>ctx.ok?"Comfrey, splints and luck. It heals well enough.":"It heals crooked. Your knee aches whenever it rains.",
            fx: (p,ctx)=>(ctx.ok=A.chance(.5),hurt(p,10,"a fall"),ctx.ok||A.addWound(p,"bad_knee"),A.willGrow(p,1,"pain"),""),
          },
        ],
      },
    ]);
    add([
      {
        id: "lf_law_false_accused",
        cond: p=>C.adult(p)&&!C.prison(p),
        cool: 10,
        title: "Accused",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{ageAdj:C.ageAdj(p)+A.ri(-5,15)}));ctx.what=A.pick(["stealing a ewe","stealing a silver cup from the inn","moving a boundary stone","selling a lame horse as sound","taking wood from the lord's forest"]),ctx.court=judge(p),ctx.short=judgeShort(p)},
        text: "{themFull}, {themOcc}, has accused you of {what}. You did no such thing. The case goes before {court}.",
        choices: [
          {
            t: p=>law(p)==="north"?"Gather twelve oath-helpers":"Gather witnesses of good name",
            check: {s:"persuasion",s2:"diplomacy",d:40,bonus:p=>(p.honor-50)/4+p.fame/10},
            win: {
              r: "They come, one after another, and swear for you. The case falls apart. {them} slinks out of the hall.",
              fx: {them:{type:"enemy",op:-20,back:"enemy"},honor:3},
            },
            lose: {
              r: "Not enough of them come. Your neighbors have judged you already, and so does {short}.",
              fx: {them:{type:"enemy",op:-30,back:"enemy"},punish:"theft",wil:1.5},
            },
          },
          {
            t: "Find out why {them} is lying",
            check: {s:"intrigue",s2:"int",d:45},
            win: {
              r: p=>`${A.pick(["A grudge over a girl twenty years ago","A debt {theyHe} hoped to dodge","Someone paid {themHim}"])}. You lay it before {short}, and {them} is fined for false witness.`,
              fx: {them:{type:"enemy",op:-30,back:"enemy"},honor:4,coin:5,skill:{intrigue:2}},
            },
            lose: {r:"You learn nothing. You go before {short} with only your word.",fx:{honor:-2,coin:-6,wil:1}},
          },
          {
            t: "Settle with {themHim} privately",
            r: "You pay, and the accusation is withdrawn. It is cheaper than a court. It is also an admission, in the eyes of {home}.",
            fx: (p,ctx)=>{pay(p,4*purse(p)),hon(p,-4),bump(p,T(ctx),-15,"rival","rival")},
          },
        ],
      },
      {
        id: "lf_law_witness",
        cond: p=>C.adult(p)&&!C.prison(p)&&!high(p),
        cool: 10,
        title: "You saw it",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{status:"gentry",sex:"M",ageAdj:20}));x.occ="the son of the local lord",ctx.vic=A.givenName(p.cult,"M"),ctx.court=judge(p)},
        text: "You saw {themFull}, {themOcc}, ride down old {vic} the carter on the bridge and leave him in the road with a broken back. Now {vic}'s family is bringing a case before {court}, and they need a witness. A steward has already been round to suggest you saw nothing.",
        choices: [
          {
            t: "Testify to what you saw",
            check: {s:"wil",s2:"persuasion",d:45},
            win: {
              r: "Your voice shakes, but your story holds. The lord pays {vic}'s blood-price to keep it quiet. The family weeps with gratitude. The manor will remember your name.",
              fx: {honor:8,fame:2,favor:-5,them:{type:"enemy",op:-40,back:"enemy"},wil:1.5},
            },
            lose: {
              r: "The lord's men swear you were drunk. The case is thrown out, and your rent goes up.",
              fx: {honor:4,coin:-6,them:{type:"enemy",op:-30,back:"enemy"},wil:1.5},
            },
          },
          {
            t: "Take the steward's silver and forget",
            r: "Ten suns and a quiet life. Old {vic}'s family looks at you at the market. You look at the ground.",
            fx: {coin:10,honor:-8,happy:-6},
          },
          {
            t: "Tell {vic}'s family privately, but stay out of court",
            r: "They know the truth now, and you are not in it. It is a coward's half-measure, and you both know it.",
            fx: {honor:1,wil:.5},
          },
        ],
      },
      {
        id: "lf_law_jury",
        cond: p=>C.adult(p)&&free(p)&&["north","deep","orc","elf","pirate"].includes(law(p)),
        cool: 9,
        title: "Sitting in judgment",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p));ctx.what=A.pick(["breaking an oath to deliver a cart of rye","killing a neighbor's dog that killed his sheep","taking another man's horse from a common pasture","cheating at the weigh-scale"]),ctx.body={north:"the oath jury",deep:"the clan's witnesses before the Law-Carver",orc:"the circle at the fire",elf:"the grove elders",pirate:"the crew's vote"}[law(p)]||"the jury"},
        text: "You are called to sit on {body} that judges {themFull}, accused of {what}. You have known {themHim} since childhood. The evidence is thin, and the accuser is powerful.",
        choices: [
          {
            t: "Judge strictly on the evidence",
            check: {s:"int",s2:"learning",d:37},
            win: {
              r: "You argue the others round: not proven. {them} walks free. The accuser glares at you across the hall.",
              fx: {them:{type:"friend",op:25,back:"friend"},honor:4,newRel:{type:"rival",op:-20}},
            },
            lose: {r:"You argue, and lose. {them} is fined. At least you tried.",fx:{them:{op:10},honor:2}},
          },
          {
            t: "Side with the powerful accuser",
            r: "{them} is found guilty. The accuser sends you a ham at Midwinter. You do not enjoy it.",
            fx: {them:{type:"enemy",op:-30,back:"enemy"},honor:-5,coin:3},
          },
          {
            t: "Recuse yourself: you know {themHim} too well",
            r: "An honest step back. Nobody can fault it. Nobody thanks you either.",
            fx: {honor:1},
          },
        ],
      },
      {
        id: "lf_petty_lord",
        cond: p=>C.adult(p)&&low(p)&&!C.ruler(p),
        cool: 8,
        title: "A new fee",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{status:"gentry",sex:A.chance(.7)?"M":"F",ageAdj:C.ageAdj(p)+A.ri(-5,15)}));x.occ=A.pick(["the new steward","the lord's bailiff","the lord's younger son, newly given your village"]),ctx.fee=A.pick(["a fee for grinding at the lord's mill, though you have always used your own quern","a toll on the footbridge your grandfather built",'a "gift" of two hens at every feast day',"a fine for every pig in the lord's woods, though the acorns have always been common"]),ctx.v=2+purse(p)},
        text: "{themFull}, {themOcc}, has announced {fee}. It is not the custom. It has never been the custom. The bailiff's men are already at the end of the lane.",
        choices: [
          {
            t: "Pay, like everyone else",
            r: "You pay. It becomes the custom by next year.",
            fx: (p,ctx)=>{pay(p,ctx.v),hp(p,-3)},
          },
          {
            t: "Appeal to the old custom before the lord's court",
            check: {s:"learning",s2:"persuasion",d:45},
            win: {
              r: "The oldest man in the village swears to the custom. The court cancels the fee. {them} notes your name.",
              fx: {them:{type:"enemy",op:-25,back:"enemy"},honor:4,fame:2,skill:{learning:1}},
            },
            lose: {
              r: "The court is the lord's court. The fee stands, and you pay the costs.",
              fx: (p,ctx)=>{pay(p,ctx.v*2),bump(p,T(ctx),-15,"enemy","enemy"),A.willGrow(p,1,"injustice")},
            },
          },
          {
            t: "Rally the village to refuse",
            check: {s:"command",s2:"persuasion",d:50},
            win: {
              r: "Nobody pays. The bailiff cannot fine everybody. The fee quietly vanishes.",
              fx: {them:{type:"enemy",op:-30,back:"enemy"},fame:3,honor:3,skill:{command:2}},
            },
            lose: {
              r: "The village wavers. You are made an example: fined, and the stocks for a day.",
              fx: (p,ctx)=>{pay(p,ctx.v*3),hurt(p,5,"the stocks"),hon(p,-2),A.willGrow(p,2,"humiliation"),bump(p,T(ctx),-20,"enemy","enemy")},
            },
          },
          {
            t: "Flatter {themHim} into an exemption",
            check: {s:"etiquette",s2:"deception",d:40},
            win: {
              r: "A bow, a compliment, a small cheese. You are exempted. Your neighbors are not.",
              fx: {them:{op:15},honor:-2},
            },
            lose: {r:"{them} sees straight through you, and doubles your share.",fx:(p,ctx)=>{pay(p,ctx.v*2)}},
          },
        ],
      },
      {
        id: "lf_sanctuary",
        cond: p=>C.adult(p)&&C.faith(p,"REL-01")&&C.town(p),
        cool: 12,
        w: .6,
        title: "Forty days",
        setup: (p,ctx)=>{setPid(p,ctx,mk(p,{sex:"M"})),ctx.crime=A.pick(["killed a man in a fight he did not start","struck his master","run from a debt he cannot pay"])},
        text: 'A man stumbles past you with the hue and cry behind him. "Which way to the temple?" He has {crime}. If he grips the bell-rope at the altar, he can claim forty days of sanctuary. His pursuers are thirty yards back.',
        choices: [
          {
            t: "Point him the short way",
            r: "He runs. A moment later the bell rings once, hard. Nobody can touch him for forty days.",
            fx: {them:{type:"friend",op:20,back:"friend"},piety:2,honor:1},
          },
          {
            t: "Point him the wrong way",
            r: "They catch him at the dead end of the tanners' lane. You did your duty, the reeve says.",
            fx: {them:{type:"enemy",op:-40,back:"enemy"},honor:-3,coin:1},
          },
          {
            t: "Trip his pursuers",
            check: {s:"deception",s2:"spd",d:40},
            win: {
              r: "A cart pushed, a barrel rolled, an innocent face. He reaches the rope with a yard to spare.",
              fx: {them:{type:"friend",op:30,back:"friend"},skill:{deception:1}},
            },
            lose: {
              r: "They see you do it. You spend the night in the cells for hindering the hue and cry.",
              fx: {coin:-4,honor:-2,happy:-4},
            },
          },
        ],
      },
      {
        id: "lf_law_fence",
        cond: p=>C.adult(p)&&!slave(p),
        cool: 7,
        title: "Cheap, and no questions",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p));x.occ=A.pick(["a second-hand clothier","a pawn-lender","a carter who comes by night"]),ctx.thing=A.pick(["a fine wool cloak","a good knife with a family mark scratched off","a copper pot","a pair of almost-new boots"]),ctx.v=2+A.ri(1,4)},
        text: '{themFull}, {themOcc}, offers you {thing} for {v} suns, a quarter of its worth. "No questions," {theyHe} says. You do not need to ask any.',
        choices: [
          {
            t: "Buy it",
            req: (p,C2,ctx)=>p.coin>=ctx.v,
            r: (p,ctx)=>ctx.caught?"Three weeks later its owner sees it on you in the market. The reeve does not believe you bought it honestly.":"A bargain. You try not to think about where it came from.",
            fx: (p,ctx)=>(pay(p,ctx.v),ctx.caught=A.chance(.2),ctx.caught?(A.punish(p,"theft"),""):(p.coin+=ctx.v*2,hon(p,-1),"")),
          },
          {
            t: "Report {themHim}",
            r: "The reeve raids the shop and finds half the missing goods in {home}. You are thanked. {them} is flogged.",
            fx: {them:{type:"enemy",op:-40,back:"enemy"},honor:2,coin:2},
          },
          {t:"Decline",r:"You walk on. Somebody else will buy it.",fx:{honor:1}},
        ],
      },
      {
        id: "lf_curfew",
        cond: p=>(C.adult(p)||C.teen(p))&&C.town(p)&&!C.old(p),
        cool: 8,
        title: "After the bell",
        setup: (p,ctx)=>{ctx.why=A.pick(["a long night at the alehouse","walking a sweetheart home","a delivery that ran late","losing track of time at a cousin's"])},
        text: "The gates shut at nine and the curfew bell has gone, and you are still out after {why}. Round the corner comes the watch with a lantern.",
        choices: [
          {
            t: "Slip into an alley",
            check: {s:"stealth",s2:"spd",d:33},
            win: {r:"Shadows, a low wall, your own back door. The watch passes by.",fx:{skill:{stealth:1}}},
            lose: {r:"You knock over a stack of pails. The watch is delighted.",fx:{coin:-2,honor:-1}},
          },
          {
            t: "Bluff: you are on an errand for the watch-captain",
            check: {s:"deception",s2:"persuasion",d:37},
            win: {r:"They believe you, and even light you home.",fx:{skill:{deception:1},happy:2}},
            lose: {r:"The watch-captain is standing right behind them.",fx:{coin:-3,honor:-2}},
          },
          {t:"Own up and pay the fine",r:"A penny-fine and a lecture. Fair enough.",fx:{coin:-1,honor:1}},
        ],
      },
      {
        id: "lf_alehouse_brawl",
        cond: p=>C.adult(p)&&!C.old(p)&&!dry(p),
        cool: 6,
        title: "A brawl at the alehouse",
        setup: (p,ctx)=>{ctx.drink=drink(p),ctx.cause=A.pick(["a spilled cup of {drink}","a song about your home town","a cheat at the dice","a look at someone's sweetheart"])},
        text: "The alehouse is loud and full when it starts: {cause}. A big man with a red face is coming at you. Benches are already going over.",
        choices: [
          {
            t: "Fight",
            r: "Fists, elbows, the edge of a bench.",
            fx: {
              duel: {
                tier: 2,
                title: "a red-faced drunk",
                opts: {kind:"brawl",place:"the alehouse",lethal:!1,toYield:!0,title:"Alehouse brawl"},
              },
            },
          },
          {
            t: "Talk him down with a joke",
            check: {s:"persuasion",s2:"int",d:37},
            win: {
              r: "The joke lands. The big man laughs so hard he sits down. You buy him a cup and he tells you his life story.",
              fx: {newRel:{type:"friend",op:20},skill:{persuasion:1}},
            },
            lose: {r:"The joke does not land. His fist does.",fx:{health:-8,cause:"a brawl",wound:"broken_nose"}},
          },
          {
            t: "Stare him down",
            req: p=>C.prof(p,"intimidation",35)||C.stat(p,"str")>=50,
            check: {s:"intimidation",s2:"str",d:40},
            win: {
              r: "He stops a yard away, looks at you properly, and finds somewhere else to be.",
              fx: {fame:1,skill:{intimidation:2}},
            },
            lose: {
              r: "He is too drunk to be scared.",
              fx: {
                duel: {
                  tier: 2,
                  title: "a red-faced drunk",
                  opts: {kind:"brawl",place:"the alehouse",lethal:!1,toYield:!0,title:"Alehouse brawl"},
                },
              },
            },
          },
          {t:"Out the back door",r:"You leave your cup and your dignity on the table.",fx:{honor:-1}},
        ],
      },
      {
        id: "lf_outlaw_cousin",
        cond: p=>C.adult(p)&&!C.prison(p)&&C.realm(p,"POL-01","POL-08","POL-13","POL-14","POL-05","POL-25","POL-26","POL-31"),
        cool: 12,
        w: .6,
        title: "Outside the law",
        setup: (p,ctx)=>{const x=setPid(p,ctx,known(p,["cousin","sibling"],"cousin",25));ctx.rw=relWord(p,x)},
        text: "Your {rw} {them} has been declared outlaw: anyone may rob or kill {themHim}, and nobody may shelter {themHim}. {them} is in the woods above {home}, starving, and has sent a child to ask for bread.",
        choices: [
          {
            t: "Send bread and say nothing",
            r: "A loaf under a stone, every week, all winter. You never see {themHim}. In spring the bread stops being taken.",
            fx: {them:{op:25},honor:-1,wil:.6,coin:-2},
          },
          {
            t: "Go up yourself with food and a plan",
            check: {s:"stealth",s2:"survival",d:45},
            win: {
              r: "You lead {themHim} by night to the border, where nobody asks. {them} weeps and promises to send word. Someday.",
              fx: {them:{type:"bestfriend",op:40,back:"bestfriend"},skill:{stealth:2,survival:1}},
            },
            lose: {
              r: "The lord's men see your fire. {them} gets away. You do not.",
              fx: {them:{op:25},prison:1,why:"sheltering an outlaw"},
            },
          },
          {
            t: "Send the child back with nothing",
            r: "The law is the law, and you have children of your own.",
            fx: {them:{type:"enemy",op:-40,back:"enemy"},wil:.8,happy:-6},
          },
        ],
      },
      {
        id: "lf_hanging_crowd",
        cond: p=>(C.adult(p)||C.teen(p))&&!["elf","deep"].includes(law(p))&&!C.realm(p,"POL-27"),
        cool: 12,
        title: "A hanging in the square",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{sex:"M",ageAdj:22+A.ri(0,20)}));ctx.crime=A.pick(["horse theft","killing a man in a quarrel","clipping coin","robbery on the road"]),ctx.place=A.T("{town}")},
        text: 'The whole town has come out for a hanging. The condemned, {themFull}, is to swing for {crime}. As the cart passes, {theyHe} catches your eye and says, low, "Tell my mother in {place} I was not afraid."',
        choices: [
          {
            t: "Carry the message",
            r: "It takes you a week out of your way. His mother takes your hands in both of hers and says nothing at all.",
            fx: {honor:3,wil:1,piety:1,coin:-2},
          },
          {
            t: "Look away, and go home",
            r: "You do not watch. You hear it anyway. You do not go to {place}.",
            fx: {wil:.8,happy:-3},
          },
          {
            t: "Watch it to the end",
            r: "Everybody does. The crowd cheers. You do not feel like cheering.",
            fx: {wil:1.2,happy:-4,trait:"stoic"},
          },
        ],
      },
    ]);
    add([
      {
        id: "lf_amb_city",
        cond: p=>youngA(p)&&free(p)&&!C.town(p)&&!high(p)&&!C.married(p),
        cool: 10,
        title: "The road to the city",
        setup: (p,ctx)=>{ctx.cap=(A.realm(p.realm)||{}).capital||"the capital"},
        text: "A carter back from {cap} says there is work for anyone with two hands and no fear: building walls, unloading ships, carrying for the guilds, 1 sun a day and more. Your village is small, and getting smaller.",
        choices: [
          {
            t: "Go to {cap}",
            check: {s:"wil",s2:"trade",d:40},
            win: {
              r: "Hard months, a cold attic, then steady work. You learn the city's tricks and keep your purse inside your shirt.",
              fx: p=>(p.coin+=25,A.trainSkill(p,"trade",2),A.train(p,"int",.4),p.home=A.pick(A.S.prov.filter(x=>x.owner===p.realm&&x.town>=8e3).map(x=>x.id).concat([p.home])),"(You live in the city now.)"),
            },
            lose: {
              r: "The city eats your savings in a month and spits you out. You walk home in the rain, wiser.",
              fx: {coinPct:-.5,wil:1.5,happy:-6},
            },
          },
          {
            t: "Go for one season only",
            r: "A summer of carrying stones on a temple works. You come home with coin in your boot and stories for the alehouse.",
            fx: {coin:12,str:.4,sta:.3,happy:3},
          },
          {
            t: "Stay: the land is the land",
            r: "You watch the carter go. Somebody has to stay.",
            fx: {wil:.3,piety:1},
          },
        ],
      },
      {
        id: "lf_amb_patron",
        cond: p=>C.adult(p)&&!C.old(p)&&!high(p)&&free(p),
        cool: 12,
        w: .7,
        title: "A patron",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{status:"merchant",ageAdj:C.ageAdj(p)+20}));x.occ=A.pick(["a rich widow with three ships","a guild master with no sons","a banker's agent with an eye for talent","a retired captain with land to spare"]),ctx.sk=A.pick(["trade","learning","stewardship"])},
        text: '{themFull}, {themOcc}, has been watching you work. "You are wasted here. Come and work for me, and I will teach you everything I know. In return I want loyalty, and I mean all of it."',
        choices: [
          {
            t: "Accept, gratefully",
            r: "Years of learning at {theirHis} elbow. {them} is demanding, unfair, and the best thing that ever happened to you.",
            fx: (p,ctx)=>{bump(p,T(ctx),30,"mentor","student"),A.trainSkill(p,ctx.sk,5),A.train(p,"int",.5),p.coin+=10},
          },
          {
            t: "Accept, on your own terms",
            check: {s:"persuasion",s2:"trade",d:43},
            win: {
              r: "{them} laughs at your nerve and agrees. You learn, and you keep your own name.",
              fx: (p,ctx)=>{bump(p,T(ctx),25,"mentor","student"),A.trainSkill(p,ctx.sk,4),p.coin+=15},
            },
            lose: {r:'"Then you are not the one I want." The offer is gone.',fx:{them:{op:-10},happy:-4}},
          },
          {
            t: "Refuse: you belong to nobody",
            r: '{them} shrugs. "Few do." You wonder about it for years.',
            fx: {wil:.6,honor:1},
          },
        ],
      },
      {
        id: "lf_amb_letters",
        cond: p=>C.adult(p)&&!p.literate&&!C.old(p)&&!slave(p),
        cool: 8,
        title: "Letters by candlelight",
        setup: (p,ctx)=>{ctx.cl=clergy(p),ctx.cost=law(p)==="well"?1:4},
        text: "The {cl} offers lessons in letters after the evening bell, {cost} suns a season. You are a grown {manwoman} with callused hands. The children will laugh.",
        choices: [
          {
            t: "Pay and learn",
            req: (p,C2,ctx)=>p.coin>=ctx.cost,
            check: {s:"int",s2:"wil",d:37},
            win: {
              r: "Slate, chalk and aching eyes. By spring you can read the notices on the church door, and your own name.",
              fx: (p,ctx)=>(pay(p,ctx.cost),p.literate=!0,A.trainSkill(p,"learning",3),hp(p,6),"(You can read.)"),
            },
            lose: {
              r: "The letters will not stay still. You keep going, slower than the children.",
              fx: (p,ctx)=>{pay(p,ctx.cost),A.trainSkill(p,"learning",2),A.willGrow(p,1,"humility")},
            },
          },
          {
            t: "Trade your labor for lessons",
            r: "You mend the {cl}'s roof and dig the garden, and are taught your letters in return. Slow, but paid for.",
            fx: (p,ctx)=>(A.trainSkill(p,"learning",2),A.chance(.5)?(p.literate=!0,"(You can read, haltingly.)"):""),
          },
          {
            t: "Laugh it off: letters never fed anyone",
            r: "You keep your evenings. The notices on the church door stay a mystery.",
            fx: {happy:1},
          },
        ],
      },
      {
        id: "lf_amb_court",
        cond: p=>C.adult(p)&&["gentry","noble"].includes(p.status)&&!C.ruler(p)&&!C.old(p),
        cool: 10,
        title: "A place at court",
        setup: (p,ctx)=>{ctx.cap=(A.realm(p.realm)||{}).capital||"the capital",ctx.post=A.pick(["a gentleman of the chamber","a carver at the high table","a keeper of the hounds","a gentleman usher of the hall"])},
        text: "A cousin writes from {cap}: a post is open as {post} to {ruler}. It pays little, costs a fortune in clothes, and puts you in the same room as everyone who matters.",
        choices: [
          {
            t: "Go to court",
            check: {s:"etiquette",s2:"intrigue",d:47},
            win: {
              r: "You learn the dance: when to bow, when to laugh, when to say nothing. Doors begin to open.",
              fx: {coin:-30,favor:10,fame:3,skill:{etiquette:3,intrigue:2}},
            },
            lose: {
              r: "You wear the wrong colors to the wrong feast and become a joke for a season. You come home early.",
              fx: {coin:-30,honor:-3,fame:-1,wil:1},
            },
          },
          {
            t: "Send a gift and decline gracefully",
            check: {s:"etiquette",s2:"diplomacy",d:35},
            win: {
              r: "The gift is noticed. Your name is spoken kindly at a high table, which costs you nothing more.",
              fx: {coin:-10,favor:4},
            },
            lose: {r:"The gift is thought mean. Your cousin is mortified.",fx:{coin:-10,favor:-2}},
          },
          {
            t: "Stay on your own lands",
            r: "Court is for fools and climbers, you tell yourself. You run your estate instead.",
            fx: {skill:{stewardship:2},wil:.3},
          },
        ],
      },
      {
        id: "lf_amb_chartered_town",
        cond: p=>C.adult(p)&&serf(p)&&!C.old(p),
        cool: 10,
        title: "A year and a day",
        setup: (p,ctx)=>{ctx.place=A.T("{town}")},
        text: "Everybody knows the old saying: a bondman who lives a year and a day in a chartered town without being claimed is free. {place} has a charter. It is three days' walk, and the bailiff has dogs.",
        choices: [
          {
            t: "Run for {place}",
            check: {s:"stealth",s2:"survival",d:50},
            win: {
              r: "Three nights on the road, then a year and a day of keeping your head down in a dyer's yard. On the last day the town clerk writes your name in a book. You are free.",
              fx: p=>{const r=setFree(p,"lf_ran_to_town");return p.home=A.pick(A.S.prov.filter(x=>x.owner===p.realm&&x.town>=8e3).map(x=>x.id).concat([p.home])),p.job={c:"labor",r:0,y:0,perf:55},r},
            },
            lose: {
              r: "The dogs find you at the river. You are dragged home and flogged before the whole manor.",
              fx: {health:-18,cause:"a flogging",wil:2.5,happy:-15,honor:-3},
            },
          },
          {
            t: "Save to buy your freedom from the lord instead",
            r: "A penny at a time, in a pot under the floor. The lord names a price, and it is high. But it is a price.",
            fx: {flag:"lf_freedom_hoard",wil:1,happy:2},
          },
          {
            t: "Stay: your family is here",
            r: "Freedom is a fine word. So is mother, and home.",
            fx: {wil:.8,happy:-2},
          },
        ],
      },
      {
        id: "lf_amb_buy_freedom",
        cond: p=>C.adult(p)&&unfree(p)&&(C.flag(p,"lf_freedom_hoard")||p.coin>=40),
        cool: 5,
        title: "The price of a person",
        setup: (p,ctx)=>{ctx.price=slave(p)?100:60,ctx.mast=slave(p)?"your master":"the lord's steward"},
        text: "You have saved for years, a penny at a time. Today you stand before {mast} with your hoard in a cloth. A slave costs about 100 suns; a serf's release less. Your price is {price} suns.",
        choices: [
          {
            t: "Pay the full price",
            req: (p,C2,ctx)=>p.coin>=ctx.price,
            r: "The coins are counted twice. A witness is called. Words are said. You walk out through the gate on your own legs, owned by nobody.",
            fx: (p,ctx)=>(pay(p,ctx.price),delete p.flags.lf_freedom_hoard,setFree(p,"lf_bought_freedom")),
          },
          {
            t: "Bargain the price down",
            check: {s:"trade",s2:"persuasion",d:50},
            win: {
              r: "Years of service, a good harvest, a kind word from the mistress: the price comes down by a third. You are free.",
              fx: (p,ctx)=>{const v=Math.round(ctx.price*2/3);return p.coin<v?(A.willGrow(p,1,"waiting"),"(You are still short. Next year.)"):(pay(p,v),delete p.flags.lf_freedom_hoard,setFree(p,"lf_bought_freedom"))},
            },
            lose: {r:'The price goes up instead, "for your impudence."',fx:{wil:1.5,happy:-8}},
          },
          {
            t: "Wait one more year, to be sure",
            r: "Another year of pennies. Freedom can wait one more winter. It has waited this long.",
            fx: {wil:1,coin:3},
          },
        ],
      },
      {
        id: "lf_amb_storyteller",
        cond: p=>C.adult(p)&&free(p)&&C.stat(p,"int")>=25,
        cool: 9,
        title: "A good storyteller eats free",
        setup: (p,ctx)=>{const s=(LORE.songs||[]).filter(x=>x&&x[0]);ctx.song=s.length?A.pick(s)[0]:"the old lays"},
        text: 'At the inn the hall-singer is too drunk to stand, and the room is restless. The innkeeper looks at you: "You know {song}. Tell it, and you eat free tonight."',
        choices: [
          {
            t: "Stand up and tell it",
            check: {s:"music",s2:"persuasion",d:40},
            win: {
              r: "By the second verse the room is silent; by the end they are roaring. Supper, ale and an offer to come back every feast day.",
              fx: {fame:2,coin:3,happy:6,skill:{music:2}},
            },
            lose: {
              r: "You lose the thread in the middle and the room loses interest. You pay for your own supper.",
              fx: {happy:-3,coin:-1},
            },
          },
          {
            t: "Tell the true story behind the song",
            req: p=>C.prof(p,"learning",30),
            check: {s:"learning",s2:"persuasion",d:43},
            win: {
              r: "The truth is stranger and better than the song. The room argues about it until dawn, and you eat free all week.",
              fx: {fame:2,int:.4,coin:4},
            },
            lose: {
              r: "A patriot at the back takes offense and throws a cup. You leave by the side door.",
              fx: {honor:-1,happy:-2},
            },
          },
          {
            t: "Decline: you are no performer",
            r: "The room grumbles on. Somebody else tries, worse.",
            fx: {wil:.2},
          },
        ],
      },
      {
        id: "lf_amb_risky_venture",
        cond: p=>C.adult(p)&&free(p)&&p.coin>=15&&!C.old(p),
        cool: 10,
        title: "A scheme",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p));ctx.plan=A.pick(["buy up the whole valley's wool before the Varennan buyers come","open a second alehouse at the crossroads where the new road will run","carry salt past the tax-farmers by the old hill path","breed mules for the high passes"]),ctx.v=Math.max(15,Math.round(p.coin*.4))},
        text: `{themFull} has a plan: to {plan}. {theyHe} needs a partner with {v} suns. "Double it by next year, or I'm a liar."`,
        choices: [
          {
            t: "Go in with {themHim}",
            req: (p,C2,ctx)=>p.coin>=ctx.v,
            r: (p,ctx)=>ctx.ok?"It works, better than either of you dared hope. {them} buys the first round for a year.":"It fails, slowly and then all at once. {them} is very sorry. Your money is very gone.",
            fx: (p,ctx)=>{if(pay(p,ctx.v),ctx.ok=A.chance(.45),ctx.ok){const v=ctx.v*2;return p.coin+=v,bump(p,T(ctx),20,"friend","friend"),`(+${v} suns.)`}return bump(p,T(ctx),-15),A.willGrow(p,1,"loss"),""},
          },
          {
            t: "Look hard at the plan first",
            check: {s:"trade",s2:"int",d:43},
            win: {
              r: (p,ctx)=>ctx.good?"You fix two holes in it and go in. It pays handsomely.":"It has a hole you could drive a cart through. You stay out, and {them} goes bust alone.",
              fx: (p,ctx)=>(ctx.good=A.chance(.5),A.trainSkill(p,"trade",2),ctx.good?(p.coin+=ctx.v,bump(p,T(ctx),15,"friend","friend"),`(+${ctx.v} suns.)`):""),
            },
            lose: {r:"The numbers make your head swim. You stay out to be safe.",fx:{wil:.2}},
          },
          {
            t: "Wish {themHim} luck",
            r: "{them} finds another partner. You will hear how it went, one way or the other.",
            fx: {them:{type:"acquaint",op:5,back:"acquaint"}},
          },
        ],
      },
      {
        id: "lf_amb_second_trade",
        cond: p=>midA(p)&&free(p)&&!high(p),
        cool: 12,
        title: "Too late to change?",
        setup: (p,ctx)=>{const o=A.pick([["brewer","brewing","craft"],["healer","healing","medicine"],["minstrel","music","music"],["carpenter","joinery","craft"],["scribe","the scribe's trade","learning"],["merchant","trade","trade"]]);ctx.job=o[0],ctx.what=o[1],ctx.sk=o[2]},
        text: 'You are halfway through your life, and you have always wanted to try {what}. An old master in {home} says he would take an apprentice your age, "if you can stand being shouted at by a man younger than your father was."',
        choices: [
          {
            t: "Do it: start again",
            check: {s:"wil",s2:"int",d:40},
            win: {
              r: "Humbling, exhausting, and the best decision of your middle years. In two years you are as good as men half your age.",
              fx: (p,ctx)=>{p.job={c:ctx.job,r:0,y:0,perf:60},A.trainSkill(p,ctx.sk,6),hp(p,10),A.willGrow(p,1,"change")},
            },
            lose: {
              r: "Your hands are too set in their old ways. You go back to what you know, a little sad and a little relieved.",
              fx: (p,ctx)=>{A.trainSkill(p,ctx.sk,2),A.willGrow(p,1,"failure")},
            },
          },
          {
            t: "Learn it on the side, evenings only",
            r: "Slow progress, but your own. It becomes the joy of your later years.",
            fx: (p,ctx)=>{A.trainSkill(p,ctx.sk,3),hp(p,5)},
          },
          {
            t: "It is too late",
            r: "You thank the old man and walk home. Probably it is too late. Probably.",
            fx: {happy:-3,wil:.3},
          },
        ],
      },
      {
        id: "lf_amb_letter_passage",
        cond: p=>C.adult(p)&&free(p)&&!C.soldier(p)&&!C.old(p),
        cool: 12,
        w: .7,
        title: "A letter of passage",
        setup: (p,ctx)=>{const r=A.pick(Object.keys(LORE.realms).filter(x=>x!==p.realm));ctx.far=A.realmName(r),ctx.why=A.pick(["a cousin who sends word of good land going cheap","a pilgrimage you swore when you were sick","a merchant who wants a strong back on the road","nothing but wanting to see it"])},
        text: "You want to go to {far}, because of {why}. Most people never leave their lord's land. To be believed on the road you need a letter of passage: six pence to a scribe and a sun for the seal.",
        choices: [
          {
            t: "Get the letter and go",
            check: {s:"survival",s2:"persuasion",d:40},
            win: {
              r: "Inns at a day's walk, tolls at every bridge, a robber who thinks better of it. You see {far} and come home a different person.",
              fx: {coin:-8,int:.6,wil:1,happy:8,fame:1,skill:{survival:2}},
            },
            lose: {
              r: "Robbed on the third day. You come home on foot with your letter and nothing else.",
              fx: {coinPct:-.4,wil:1.5,health:-6,cause:"robbers on the road"},
            },
          },
          {
            t: "Go without a letter",
            check: {s:"deception",s2:"stealth",d:45},
            win: {
              r: "You talk your way past every toll and gate. A traveler needs a quick tongue more than a seal.",
              fx: {int:.4,skill:{deception:2},happy:6},
            },
            lose: {r:"Turned back at the first border post as a vagrant, and fined.",fx:{coin:-4,honor:-1}},
          },
          {t:"Stay home and dream",r:"Some roads are better in the head.",fx:{happy:-1}},
        ],
      },
    ]);
    add([
      {
        id: "lf_moral_purse",
        cond: p=>C.adult(p)||C.teen(p),
        cool: 8,
        title: "A purse in the road",
        setup: (p,ctx)=>{ctx.cl=clergy(p),ctx.v=A.ri(4,15)*(high(p)?3:1),ctx.mark=A.pick(["a merchant's mark stitched on it","a widow's initials","no mark at all","the seal of the lord's steward"])},
        text: "On the road home you find a leather purse in the mud with {v} suns in it and {mark}.",
        choices: [
          {
            t: "Keep it",
            r: "Found is found. It buys a good deal. Now and then you wonder whose rent it was.",
            fx: (p,ctx)=>{p.coin+=ctx.v,hon(p,-2)},
          },
          {
            t: "Find the owner",
            check: {s:"tracking",s2:"persuasion",d:33},
            win: {
              r: p=>A.chance(.6)?"A widow who had lost her rent. She cries and blesses you to every god she knows, and her son mends your roof for nothing.":"A fat merchant who counts it twice and gives you a single penny. Still, you sleep well.",
              fx: {honor:4,piety:2,happy:3},
            },
            lose: {
              r: "Nobody claims it. After a month the {cl} says it is yours.",
              fx: (p,ctx)=>{p.coin+=ctx.v,hon(p,2)},
            },
          },
          {
            t: "Give it to the {cl} for the poor",
            r: "The {cl} looks at you as if you had grown a halo. The poor box is fuller than it has been in years.",
            fx: {piety:4,honor:3},
          },
        ],
      },
      {
        id: "lf_moral_runaway",
        cond: p=>C.adult(p)&&!slave(p)&&["POL-11","POL-12","POL-17","POL-18","POL-19","POL-20","POL-21","POL-24","POL-30","POL-32","POL-33","POL-34","POL-15","POL-22","POL-03"].includes(p.realm),
        cool: 10,
        title: "A runaway",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{status:"slave",ageAdj:14+A.ri(0,14)}));x.occ="a runaway slave",ctx.brand=A.pick(["a brand on the shoulder","a slave-ring scar round one ankle","whip scars like ploughed furrows"]),ctx.reward=5+A.ri(0,10)},
        text: `In your woodshed, behind the stacks, you find {them}: thin, terrified, with {brand}. Notices in the market offer {reward} suns for a runaway of that description. "Please," {them} whispers. "Two nights, and I'm over the border."`,
        choices: [
          {
            t: "Hide {themHim} and feed {themHim}",
            check: {s:"deception",s2:"stealth",d:40},
            win: {
              r: "The catchers search the lane and not your shed. On the third night {them} goes, with bread and your old boots.",
              fx: {them:{type:"friend",op:40,back:"friend"},honor:4,piety:2,skill:{deception:1}},
            },
            lose: {
              r: "The catchers' dogs find the shed. {them} is dragged away. You are fined for harboring.",
              fx: {them:{type:"friend",op:25,back:"friend"},coin:-10,honor:2,happy:-10,wil:1.5},
            },
          },
          {
            t: "Show {themHim} the back way to the border",
            r: "You draw it in the dirt: the stream, the old mill, the shepherds who do not ask. {them} is gone before you can wish {themHim} luck.",
            fx: {them:{op:20},honor:2},
          },
          {
            t: "Turn {themHim} in for the reward",
            r: "The catchers pay you {reward} suns. {them} does not look at you as they take {themHim}.",
            fx: (p,ctx)=>{p.coin+=ctx.reward,hon(p,-6),hp(p,-4),bump(p,T(ctx),-60,"enemy","enemy")},
          },
          {
            t: "Pretend you saw nothing",
            r: "You close the woodshed door and go inside. In the morning the shed is empty.",
            fx: {wil:.3},
          },
        ],
      },
      {
        id: "lf_moral_bread_thief",
        cond: p=>C.adult(p)&&!slave(p),
        cool: 7,
        title: "A hungry thief",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{ageAdj:8+A.ri(0,4)}));x.occ="a hungry child",ctx.food=food(p)},
        text: "You catch a child with {theirHis} arm through your window, stealing {food}. {theyHe} is nothing but bones and eyes. The reeve is two doors down.",
        choices: [
          {
            t: "Give {themHim} the food, and more",
            r: "{them} eats like a wolf, says nothing, and vanishes. A week later there is a bundle of firewood on your step.",
            fx: {them:{type:"friend",op:25,back:"friend"},coin:-1,honor:2,piety:2,happy:3},
          },
          {
            t: "Find out where {theyHe} lives",
            check: {s:"persuasion",s2:"int",d:30},
            win: {
              r: "A mother sick with fever and four little ones in a lean-to by the tannery. You bring broth, and fetch the herbwife.",
              fx: {them:{type:"friend",op:30,back:"friend"},coin:-3,honor:4,piety:3},
            },
            lose: {r:"{them} bolts the moment you loosen your grip.",fx:{coin:-1}},
          },
          {
            t: "Call the reeve",
            r: "The reeve has {themHim} flogged in the market. You get your bread back, a little bloody.",
            fx: {them:{type:"enemy",op:-40,back:"enemy"},honor:-3,happy:-4},
          },
          {
            t: "Box {theirHis} ears and send {themHim} off",
            r: "A clout and a shout. {them} runs, empty-handed. You feel nothing much, then something.",
            fx: {them:{op:-10},happy:-1},
          },
        ],
      },
      {
        id: "lf_moral_water",
        cond: p=>C.adult(p)&&(law(p)==="well"||C.realm(p,"POL-19","POL-18")),
        cool: 7,
        title: "Water for a stranger",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{sex:"M",ageAdj:40}));ctx.who=A.pick(["a man of the clan your family has been at feud with","a Rider of the Sand Clans, armed and filthy","an old man in rags with a camel near death","a foreigner who speaks no word you know"])},
        text: 'At the hottest hour a traveler stops at your gate: {who}. "Is there water?" A household that refuses water to a traveler is cursed. A household that gives it to the wrong man may be something worse.',
        choices: [
          {
            t: "Give water, and shade",
            r: 'He drinks, and washes, and sits in your shade until the heat breaks. As he leaves he presses your hand. "The well does not lie." You are under his protection now, it seems.',
            fx: {them:{type:"friend",op:30,back:"friend"},piety:3,honor:3},
          },
          {
            t: "Give water, and ask his business",
            check: {s:"diplomacy",s2:"int",d:35},
            win: {
              r: "He tells you things about the road ahead, and about who is coming down it, that are worth more than water.",
              fx: {them:{type:"friend",op:20,back:"friend"},piety:2,int:.3,coin:3},
            },
            lose: {r:"He drinks and answers nothing. Your questions offend him.",fx:{piety:2,them:{op:-5}}},
          },
          {
            t: "Refuse him",
            r: "He looks at you a long moment and walks on. Your neighbors saw. Nobody speaks to you at the well for a month.",
            fx: {piety:-6,honor:-6,happy:-4},
          },
        ],
      },
      {
        id: "lf_moral_guest_law",
        cond: p=>C.adult(p)&&(C.race(p,"orc","halforc")||C.realm(p,"POL-11","POL-34")),
        cool: 10,
        title: "A guest is not given",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{sex:"M",ageAdj:C.ageAdj(p)+A.ri(-3,10)}));x.occ=A.pick(["a rider of a rival clan","a half-orc wanted by the Aldmark march","a horse thief who stole from your own herd"])},
        text: "{themFull}, {themOcc}, walks into the firelight unarmed and sits down. Under the Law of the Fire he is your guest: fed, unharmed, gone within three days. Your brothers are fingering their knives. Outside the fire, he is fair game.",
        choices: [
          {
            t: "Feed him the best meat, as the law demands",
            r: "Three days of sullen courtesy. On the third morning he leaves a gift: a silver bridle-ring. The Grey Mothers hear of it with approval.",
            fx: {them:{type:"acquaint",op:20,back:"acquaint"},honor:5,piety:3,coin:5},
          },
          {
            t: "Feed him, then follow him when he leaves",
            check: {s:"tracking",s2:"riding",d:43},
            win: {
              r: "Past the guest-ground he is fair game. You catch him at the river and take back what he owes your clan.",
              fx: {them:{type:"enemy",op:-30,back:"enemy"},coin:20,fame:1,honor:1},
            },
            lose: {
              r: "He is faster, and he expected you. He laughs at you across the river.",
              fx: {them:{type:"rival",op:-15,back:"rival"},happy:-3},
            },
          },
          {
            t: "Let your brothers have him",
            r: "It is done before the fire burns down. In the morning the clan-mothers name your whole kin-band. A clan that harms a guest is clanless.",
            fx: {honor:-20,piety:-8,fame:3,wil:1,happy:-10},
          },
        ],
      },
      {
        id: "lf_moral_deserter",
        cond: p=>C.adult(p)&&C.atWar(p)&&!C.soldier(p),
        cool: 8,
        title: "A boy in the barn",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{sex:"M",ageAdj:16+A.ri(0,3)}));x.occ="a deserter from the levy"},
        text: "A boy is hiding in your barn: {themFull}, sixteen if a day, a deserter from the levy against {enemy}. He has a festering cut on his arm and the look of someone who has seen a battle. Deserters hang.",
        choices: [
          {
            t: "Clean his wound and hide him",
            check: {s:"medicine",s2:"deception",d:40},
            win: {
              r: "The cut heals. The search passes. In a month he is a hired hand on a farm two valleys over, under another name.",
              fx: {them:{type:"friend",op:35,back:"friend"},honor:2,skill:{medicine:2}},
            },
            lose: {
              r: "The fever takes his arm, then the recruiting sergeant takes him.",
              fx: {them:{op:15},happy:-8,wil:1,coin:-5},
            },
          },
          {
            t: "Send him back to his company with a word",
            check: {s:"persuasion",s2:"wil",d:37},
            win: {
              r: "You talk him into going back before he is missed. He goes white-faced and alive.",
              fx: {them:{op:10},honor:2},
            },
            lose: {r:"He runs that night instead, and you never learn what became of him.",fx:{wil:.4}},
          },
          {
            t: "Hand him over",
            r: "The sergeant thanks you. Two days later you hear the drum at the crossroads.",
            fx: {them:{type:"enemy",op:-60,back:"enemy"},honor:-4,happy:-10,favor:2},
          },
        ],
      },
      {
        id: "lf_moral_short_weight",
        cond: p=>C.adult(p)&&(middling(p)||C.job(p,"merchant","brewer","smith","weaver","farm")),
        cool: 7,
        title: "A thumb on the scale",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p));x.occ=A.pick(["an old woman who cannot see well","a foreign sailor who cannot count in your coin","a hurried steward from the manor","a child sent with a basket"]),ctx.v=2*purse(p)},
        text: "Your customer is {themFull}, {themOcc}. You could give short weight today and {theyHe} would never know. Everybody does it a little, they say.",
        choices: [
          {
            t: "Give honest weight",
            r: "Honest weight, and a little over. Word gets round, slowly, the way good things do.",
            fx: {honor:2,perf:2},
          },
          {
            t: "A little short, just this once",
            r: (p,ctx)=>ctx.caught?"The market warden checks your weights that very afternoon. A fine, and your scales broken in front of everyone.":"A few pence extra. Nobody knows. You know.",
            fx: (p,ctx)=>(ctx.caught=A.chance(.25),ctx.caught?(pay(p,ctx.v*3),hon(p,-8),""):(p.coin+=ctx.v,hon(p,-2),"")),
          },
          {
            t: "Give over-weight on purpose",
            r: "{them} notices and comes back every week, with friends.",
            fx: {coin:-1,them:{type:"friend",op:15,back:"friend"},honor:3,perf:3},
          },
        ],
      },
      {
        id: "lf_moral_false_witness",
        cond: p=>C.adult(p)&&!C.prison(p),
        cool: 10,
        title: "Paid to remember",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{status:high(p)?"noble":"merchant",ageAdj:C.ageAdj(p)+10}));ctx.vic=A.givenName(p.cult,A.chance(.5)?"M":"F"),ctx.v=10*purse(p),ctx.short=judgeShort(p)},
        text: "{themFull}, {themOcc}, wants you to swear before {short} that you saw {vic} move a boundary stone. You saw nothing of the kind. The fee is {v} suns.",
        choices: [
          {
            t: "Take the money and swear",
            r: p=>law(p)==="north"?'You swear on the iron ring and lie. "Iron does not lie," they say. You do. {vic} loses the field.':law(p)==="sun"?"You lie at noon, before the court, which the Temple calls a sin. {vic} loses the field.":"You swear to what you never saw. {vic} loses the field.",
            fx: (p,ctx)=>{p.coin+=ctx.v,hon(p,-10),pie(p,-5),bump(p,T(ctx),15,"friend","friend")},
          },
          {
            t: "Refuse to his face",
            r: '{them} smiles thinly. "As you like." You have made a powerful enemy for nothing but your own soul.',
            fx: {them:{type:"enemy",op:-30,back:"enemy"},honor:3},
          },
          {
            t: "Warn {vic}",
            check: {s:"intrigue",s2:"stealth",d:37},
            win: {
              r: "{vic} finds a true witness and the scheme collapses. Nobody knows you were behind it.",
              fx: {honor:4,skill:{intrigue:2}},
            },
            lose: {
              r: "Word gets back to {them}. You find your well fouled a week later.",
              fx: {them:{type:"enemy",op:-40,back:"enemy"},honor:3,happy:-4},
            },
          },
        ],
      },
      {
        id: "lf_moral_dying_stranger",
        cond: p=>C.adult(p),
        cool: 12,
        w: .7,
        title: "A dying man's errand",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{sex:"M",ageAdj:40}));x.occ="a traveler on the road",ctx.place=A.T("{town}"),ctx.v=10+A.ri(0,20)},
        text: 'You find a traveler in the ditch, stabbed and dying. He presses a purse of {v} suns into your hand. "My daughter. In {place}. The house with the blue door." Then he is gone.',
        choices: [
          {
            t: "Take it to his daughter",
            r: "Four days out of your way. A young woman opens the blue door, sees the purse in your hand, and knows.",
            fx: (p,ctx)=>{const t=T(ctx);t&&A.kill(t,"a knife on the road"),hon(p,5),pie(p,3),A.willGrow(p,.8,"duty")},
          },
          {
            t: "Keep it: who would know?",
            r: "Nobody would know. You would.",
            fx: (p,ctx)=>{const t=T(ctx);t&&A.kill(t,"a knife on the road"),p.coin+=ctx.v,hon(p,-6),pie(p,-3)},
          },
          {
            t: "Raise the hue and cry after his killers",
            check: {s:"tracking",s2:"command",d:45},
            win: {
              r: "The killers are caught at the ford with his horse. Then you take the purse to the blue door, as you promised.",
              fx: (p,ctx)=>{const t=T(ctx);t&&A.kill(t,"a knife on the road"),hon(p,6),A.fame(p,2),A.trainSkill(p,"tracking",2)},
            },
            lose: {
              r: "The killers are long gone. You take the purse to the blue door with nothing else to give.",
              fx: (p,ctx)=>{const t=T(ctx);t&&A.kill(t,"a knife on the road"),hon(p,4)},
            },
          },
        ],
      },
      {
        id: "lf_moral_lost_child",
        cond: p=>C.adult(p),
        cool: 8,
        title: "A child alone",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{ageAdj:5+A.ri(0,3)}));x.occ="a lost child",ctx.cl=clergy(p)},
        text: "At dusk on the road you find a small child, {themFull}, sitting on a milestone and crying. {theyHe} does not know the name of {theirHis} village, only that it has a mill and a big dog.",
        choices: [
          {
            t: "Take {themHim} from village to village until you find it",
            check: {s:"survival",s2:"persuasion",d:33},
            win: {
              r: "The fourth village has a mill and a very big dog, and a mother who screams and runs and does not stop thanking you.",
              fx: {honor:4,fame:1,happy:6},
            },
            lose: {
              r: "Three days of searching. You leave {themHim} with the {cl} at last, who promises to keep asking.",
              fx: {honor:2,wil:.6},
            },
          },
          {
            t: "Take {themHim} home for the night",
            r: "Supper, a blanket, and in the morning a frantic father at your door who heard from a carter. You are invited to every feast in his village.",
            fx: {them:{type:"friend",op:20,back:"friend"},honor:3,happy:4},
          },
          {
            t: "Point {themHim} toward the nearest village",
            r: "You have your own troubles. You watch the small figure trudge off into the dusk.",
            fx: {honor:-3,happy:-3},
          },
        ],
      },
    ]);
    const teen=p=>C.teen(p),teenish=p=>C.teen(p)||C.adult(p)&&C.ageAdj(p)<18.5;
    add([
      {
        id: "lf_teen_hiring_fair",
        cond: p=>(teen(p)||youngA(p))&&["peasant","serf"].includes(p.status)&&!C.job(p)&&!unfree(p),
        cool: 6,
        title: "The hiring fair",
        setup: (p,ctx)=>{ctx.fair=A.pick(["May Fair","the Slaughter Feast"])},
        text: "At {fair} the young people stand in rows in the market with a token of their trade: a wisp of straw for a farmhand, a mop for a servant, a crook for a shepherd. Masters walk the rows feeling arms. A farmhand gets 60 suns a year and board.",
        choices: [
          {
            t: "Stand with the straw and look strong",
            check: {s:"str",s2:"sta",d:30},
            win: {
              r: "A prosperous farmer from {town} hires you for the year, and gives you a sun as earnest money on the spot.",
              fx: {coin:1,job:"farm",skill:{husbandry:1},happy:4},
            },
            lose: {
              r: "The good masters pass you by. You are hired at dusk by a mean-faced man nobody else would work for.",
              fx: {job:"labor",happy:-3,wil:.6},
            },
          },
          {
            t: "Stand with the mop and hope for the manor",
            check: {s:"etiquette",s2:"int",d:32},
            win: {
              r: "A steward picks you for the manor house: a coat at the Slaughter Feast and the chance to rise.",
              fx: {job:"servant",skill:{etiquette:1},happy:3},
            },
            lose: {r:"Nobody wants a servant with your manners. Back home, for another year.",fx:{happy:-2}},
          },
          {
            t: "Spend the day at the fair instead",
            r: "Gingerbread, a dancing bear, a wrestling bout, and a girl or boy who laughs at your jokes. No job, but what a day.",
            fx: {happy:6,coin:-1},
          },
        ],
      },
      {
        id: "lf_teen_first_drink",
        cond: p=>teenish(p)&&!dry(p)&&!C.race(p,"elf"),
        cool: 20,
        once: !0,
        title: "Your first real drink",
        setup: (p,ctx)=>{ctx.drink=drink(p)},
        text: `The older youths have a jug of {drink} behind the barn and, for once, they wave you over. "Go on. Unless you're still a baby."`,
        choices: [
          {
            t: "Drink like a grown-up",
            check: {s:"sta",s2:"wil",d:25},
            win: {
              r: "Warm, then dizzy, then very funny. You hold it well enough that nobody laughs at you, which is the point.",
              fx: {happy:5,sta:.2},
            },
            lose: {
              r: "Warm, then dizzy, then very sick behind the barn. Your mother knows at a glance.",
              fx: {health:-3,cause:"drink",happy:-3,rel:{who:"mother",op:-4}},
            },
          },
          {
            t: "Sip, and pass it on",
            r: "Nobody notices that you only sip. You are the only one who walks home straight.",
            fx: {int:.2,happy:2},
          },
          {
            t: "Say no",
            r: "They call you a baby. You go home. Later you hear one of them fell in the millpond.",
            fx: {wil:.5,happy:-1},
          },
        ],
      },
      {
        id: "lf_teen_first_kiss",
        cond: p=>teenish(p)&&C.ageAdj(p)>=13,
        cool: 20,
        once: !0,
        title: "Behind the bonfire",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{sex:loveSex(p),ageAdj:C.ageAdj(p)+A.ri(-1,1)}));ctx.fire=A.pick(["the Return Day fires","the Harvest Home bonfire","the Lantern Night lamps","the midsummer fires"])},
        text: "Behind {fire}, while everyone else is dancing, you find yourself alone with {them}. {them} has smoke in {theirHis} hair and is looking at you in a new way.",
        choices: [
          {
            t: "Kiss {themHim}",
            check: {s:"wil",s2:"spd",d:22,bonus:p=>p.looks/6-6},
            win: {
              r: "Clumsy, quick and unforgettable. You both run back to the dancing and cannot stop grinning.",
              fx: {them:{type:"friend",op:30,back:"friend"},happy:10},
            },
            lose: {
              r: "You lean in just as {theyHe} turns, and kiss {theirHis} ear. You both die of shame and then laugh until you cry.",
              fx: {them:{type:"friend",op:20,back:"friend"},happy:4},
            },
          },
          {
            t: "Talk until the fire burns down",
            r: "You talk about everything and nothing. It is better than a kiss, nearly.",
            fx: {them:{type:"friend",op:25,back:"friend"},happy:5},
          },
          {
            t: "Panic and run back to the dancing",
            r: "You spend the next week avoiding {themHim} and thinking about nothing else.",
            fx: {them:{type:"acquaint",op:5},happy:-1},
          },
        ],
      },
      {
        id: "lf_teen_runaway",
        cond: p=>teen(p)&&C.ageAdj(p)>=13&&!slave(p),
        cool: 8,
        title: "Running away",
        // [X1 baked patch events/99999-v2-content V2C-RUNAWAY-BETROTHAL] lf_teen_runaway picks a reason to run from a list
        // that includes "a betrothal to a man twice your age", so a boy of 14 ran from a betrothal to a man (playtest 2,
        // old #11). A boy is betrothed to a widow. The list keeps its length, so the pick draws the same.
        setup: (p,ctx)=>{ctx.why=A.pick(["your father's belt",(p.sex==="F"?"a betrothal to a man twice your age":"a betrothal to a widow twice your age"),"the endless work and no word of thanks","a quarrel that went too far","the itch to see what is past the hill"]),ctx.to=A.pick(["the coast, to go to sea","the city","the mercenary camp at the border","an uncle in {town}"])},
        text: "You have had enough of {why}. You have bread in a cloth and a plan: {to}. The household is asleep.",
        choices: [
          {
            t: "Go",
            check: {s:"survival",s2:"wil",d:30},
            win: {
              r: "You make it. Hungry, scared and free, you find work and a corner to sleep in. Home will never be quite home again.",
              fx: p=>{A.willGrow(p,2,"independence"),A.trainSkill(p,"survival",2),A.addTrait(p,"brave"),hp(p,3);const pa=A.relsOf(p,["father","mother"]);for(const x of pa)A.addOp(p,x.p,-15)},
            },
            lose: {
              r: "Two days later a carter brings you home, starved and soaked. Your mother cries. Your father says nothing at all, which is worse.",
              fx: {wil:1,health:-4,cause:"cold",rel:{who:"father",op:-8}},
            },
          },
          {
            t: "Go as far as the crossroads, then turn back",
            r: "You sit on the milestone until dawn. Then you go home and do the milking. Nobody ever knows.",
            fx: {wil:1,happy:-2},
          },
          {
            t: "Tell someone how bad it is instead",
            check: {s:"persuasion",s2:"wil",d:28},
            win: {
              r: "An aunt listens, and has words with your parents. Something changes, a little.",
              fx: {happy:5,wil:.6},
            },
            lose: {r:"Nobody listens. You stay, and stew.",fx:{happy:-4}},
          },
        ],
      },
      {
        id: "lf_teen_gang",
        cond: p=>teenish(p)&&C.town(p),
        cool: 8,
        title: "The lads by the docks",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{ageAdj:C.ageAdj(p)+2}));x.occ="the leader of a gang of dock youths"},
        text: '{themFull} runs the youths who hang about the docks: running errands for the fences, lifting a purse now and then, never caught. {them} says you have quick hands. "Come in with us."',
        choices: [
          {
            t: "Join",
            r: "Nights on the rooftops, easy money, a gang that would bleed for you. You learn things your parents would weep to know.",
            fx: {
              them: {type:"friend",op:30,back:"friend"},
              skill: {stealth:3,intrigue:1},
              coin: 3,
              honor: -3,
              flag: "lf_gang",
            },
          },
          {
            t: "Prove you are quick, then say no",
            check: {s:"stealth",s2:"spd",d:32},
            win: {
              r: 'You lift {theirHis} own knife from {theirHis} belt and hand it back. "Not for me." {them} laughs and respects you for it.',
              fx: {them:{type:"friend",op:15,back:"friend"},skill:{stealth:1}},
            },
            lose: {
              r: "You fumble it. {them} laughs at you, not with you.",
              fx: {them:{type:"rival",op:-10,back:"rival"}},
            },
          },
          {
            t: "Walk away",
            r: "Two of them follow you home to remind you to keep your mouth shut. You do.",
            fx: {wil:.4},
          },
        ],
      },
      {
        id: "lf_teen_future",
        cond: p=>teenish(p)&&C.parentsAlive(p),
        cool: 8,
        title: "What will you be?",
        setup: (p,ctx)=>{ctx.plan=p.status==="noble"||p.status==="gentry"?"serve at court and marry well":p.status==="merchant"?"take over the counting-room":p.status==="artisan"?"follow your father's craft":"work the land, like everyone before you"},
        text: "At supper your father announces your future: you will {plan}. Your mother nods. Nobody has asked you. You have been thinking about something else entirely.",
        choices: [
          {
            t: "Argue for your own way",
            check: {s:"persuasion",s2:"wil",d:30},
            win: {
              r: `It takes a week of arguments. But at last your father grumbles, "We'll see," which is nearly yes.`,
              fx: {wil:1,happy:4,rel:{who:"father",op:3}},
            },
            lose: {
              r: "The argument ends with a slap and a slammed door.",
              fx: {wil:.8,rel:{who:"father",op:-10},happy:-4},
            },
          },
          {
            t: "Agree, and keep your dream for later",
            r: "You nod. Underneath, the dream goes on growing, in the dark.",
            fx: {wil:.6,rel:{who:"father",op:5}},
          },
          {
            t: "Ask your mother to plead for you",
            check: {s:"persuasion",s2:"int",d:26},
            win: {
              r: "Your mother wins the argument for you in a single evening, as she wins most arguments.",
              fx: {rel:{who:"mother",op:8},happy:3},
            },
            lose: {
              r: "Your mother takes your father's side. You are on your own.",
              fx: {rel:{who:"mother",op:-4},happy:-2},
            },
          },
        ],
      },
      {
        id: "lf_teen_insult",
        cond: p=>teenish(p),
        cool: 7,
        title: "An insult to your family",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{ageAdj:C.ageAdj(p)+1,sex:"M"}));ctx.ins=A.pick(["your mother was a camp-follower","your father is a drunk and a thief","your sister is no better than she should be","your family are beggars who eat grass"])},
        text: "In front of everyone at the well, {themFull} says that {ins}. Everybody turns to see what you will do.",
        choices: [
          {
            t: "Hit {themHim}",
            r: "You do not think. You just hit.",
            fx: {
              duel: {
                foe: "them",
                tier: 1,
                opts: {kind:"brawl",place:"the village well",lethal:!1,toYield:!0,title:"For your family's name"},
              },
              them: {type:"rival",op:-20,back:"rival"},
            },
          },
          {
            t: "Answer with something cleverer",
            check: {s:"persuasion",s2:"int",d:28},
            win: {
              r: "Your answer is so cutting that the whole well laughs at {themHim}, not you. {them} goes red and stalks off.",
              fx: {them:{type:"rival",op:-15,back:"rival"},fame:1,int:.2},
            },
            lose: {
              r: "You stammer. {them} laughs. Everyone laughs.",
              fx: {them:{type:"rival",op:-10,back:"rival"},wil:.8,happy:-4},
            },
          },
          {
            t: "Walk away with your head high",
            r: "It burns. Your grandmother hears of it and says you did right. It still burns.",
            fx: {wil:1,honor:1,happy:-2},
          },
        ],
      },
      {
        id: "lf_teen_ballgame",
        cond: p=>(teen(p)||youngA(p))&&C.cult(p,"CUL-02","CUL-01","CUL-11","CUL-18")&&!slave(p),
        cool: 5,
        title: "Parish against parish",
        setup: (p,ctx)=>{ctx.rival=A.T("{town}")},
        text: "On the Plough-Wife's Day the whole parish plays the ball game against {rival}: a pig's bladder, two miles of fields between the churches, and no rules anyone can remember. Last year two boys broke legs. You are picked.",
        choices: [
          {
            t: "Charge into the scrum",
            check: {s:"str",s2:"athletics",d:32},
            win: {
              r: "You come out of the heap with the bladder under your arm and run until your lungs burn. Your parish wins. You are a hero until harvest.",
              fx: {fame:1,str:.4,happy:8,health:-3,cause:"the ball game"},
            },
            lose: {
              r: "Someone treads on you. You watch the rest from the ditch, holding your ribs.",
              fx: {health:-8,cause:"the ball game",wound:"broken_ribs",wil:.6},
            },
          },
          {
            t: "Hang back and wait for a clear run",
            check: {s:"spd",s2:"ins",d:32},
            win: {
              r: "The bladder squirts loose and you are the only one there. A clear run to the church door. They will talk about it for years.",
              fx: {fame:2,spd:.4,happy:8},
            },
            lose: {r:"The ball never comes your way. You are muddy and unhurt and slightly ashamed.",fx:{happy:-1}},
          },
          {
            t: "Bet on the other parish",
            r: "Your own parish wins. You lose your money and, when they find out, your reputation.",
            fx: {coin:-2,honor:-2},
          },
        ],
      },
      {
        id: "lf_teen_secret_practice",
        cond: p=>teenish(p),
        cool: 6,
        title: "Practicing in secret",
        setup: (p,ctx)=>{const o=A.pick([["the sword, with a stick, against a tree","sword"],["the fiddle you found in the loft","music"],["your letters, from an old psalter","learning"],["the bow, at a target in the woods","bow"],["throwing knives at a fence post","throwing"]]);ctx.what=o[0],ctx.sk=o[1]},
        text: "Nobody knows that every evening you slip away to practice {what}. Your family would call it a waste of time. You are getting good.",
        choices: [
          {
            t: "Keep at it, every night",
            check: {s:"wil",s2:"int",d:25},
            win: {
              r: "Months of blisters and stolen hours. One day you realize you are better than anyone you know.",
              fx: (p,ctx)=>(A.trainSkill(p,ctx.sk,4),A.willGrow(p,.8,"discipline"),A.chance(.15)?(p.apt=p.apt||{},p.apt[ctx.sk]=Math.max(p.apt[ctx.sk]||1,1.25),"(You have a gift for it.)"):""),
            },
            lose: {
              r: "You practice, but it is slow going. Still, you keep at it.",
              fx: (p,ctx)=>{A.trainSkill(p,ctx.sk,2)},
            },
          },
          {
            t: "Show your family what you can do",
            check: {s:"persuasion",s2:"wil",d:28},
            win: {
              r: 'Your father watches with his arms folded. Then, gruffly: "Again." It is the best thing he has ever said to you.',
              fx: (p,ctx)=>{A.trainSkill(p,ctx.sk,2),A.addOp(p,A.P(p.parents[0]),8),hp(p,6)},
            },
            lose: {
              r: "They laugh, or worse, they shrug. You go on practicing, but angrier.",
              fx: (p,ctx)=>{A.trainSkill(p,ctx.sk,1),A.willGrow(p,.8,"scorn")},
            },
          },
          {
            t: "Give it up: there is work to do",
            r: "You put it away. Sometimes, for years after, your hands remember.",
            fx: {happy:-2},
          },
        ],
      },
      {
        id: "lf_teen_mirror",
        cond: p=>teenish(p),
        cool: 10,
        title: "A face in the water",
        text: "You catch your face in the still water of the trough and stop. When did that happen? Your nose has gone its own way, your voice cracks when you least want it, and everybody seems to be looking at you.",
        choices: [
          {
            t: "Take some care: wash, comb, mend your shirt",
            r: "Your mother notices and says nothing, which is high praise. So do certain other people.",
            fx: {looks:2,happy:2},
          },
          {t:"Decide you do not care what anyone thinks",r:"It is a lie, but a useful one.",fx:{wil:.6}},
          {
            t: "Ask your older cousin for advice",
            r: "Your cousin tells you a great many things, some of them true, and laughs a lot.",
            fx: {happy:3,looks:1},
          },
        ],
      },
      {
        id: "lf_teen_orc_ride",
        cond: p=>teenish(p)&&C.race(p,"orc","halforc")&&C.realm(p,"POL-11","POL-34"),
        cool: 6,
        title: "Not too young to ride",
        setup: (p,ctx)=>{const x=setPid(p,ctx,known(p,["sibling"],"sibling",30,{ageAdj:C.ageAdj(p)}))},
        text: "Your twin {them} has ridden off with the young men to watch the river, without you. The clan-mother says you are needed with the mares. You are, in the eyes of the law, an adult since the first snow.",
        choices: [
          {
            t: "Saddle up and follow",
            check: {s:"riding",s2:"survival",d:30},
            win: {
              r: "You catch them at the second camp. The young men laugh, then make room at the fire. {them} pretends to be annoyed.",
              fx: {them:{op:15},skill:{riding:2},fame:1,rel:{who:"mother",op:-5}},
            },
            lose: {
              r: "You lose the trail in sleet and have to come home. The clan-mother says nothing, which is a lesson.",
              fx: {wil:1,health:-4,cause:"cold"},
            },
          },
          {
            t: "Stay, and do the work well",
            r: "The mares foal well under your eye. The clan-mother notices. Some deeds are quiet.",
            fx: {skill:{husbandry:2},honor:2,rel:{who:"mother",op:6}},
          },
          {
            t: "Steal a horse from the next clan to show them",
            check: {s:"stealth",s2:"riding",d:34},
            win: {
              r: "A grey mare, at the dark of the moon. When {them} comes home, you are waiting with her.",
              fx: {fame:2,coin:20,skill:{stealth:1}},
            },
            lose: {
              r: "Caught, and sent home on foot. Your clan pays three horses for your pride.",
              fx: {honor:-3,happy:-5},
            },
          },
        ],
      },
      {
        id: "lf_teen_dwarf_restless",
        cond: p=>C.race(p,"dwarf")&&(teen(p)||youngA(p)),
        cool: 10,
        title: "Twenty years to go",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{ageAdj:40,sex:"M"}));x.occ="your master in the forge"},
        text: 'You have been apprenticed to {them} for ten years. There are twenty more before your name-carving. Today you spoiled a piece and {them} said, "Again," as {theyHe} has said ten thousand times. You want to scream.',
        choices: [
          {
            t: "Do it again, and again",
            r: "Hold fast. The piece comes out right on the ninth try. {them} grunts. From {themHim}, that is a song.",
            fx: {them:{type:"mentor",op:15,back:"student"},skill:{craft:3},wil:1},
          },
          {
            t: "Ask to learn something new",
            check: {s:"persuasion",s2:"craft",d:30},
            win: {
              r: "{them} looks at you a long time. Then {theyHe} shows you a technique {theyHe} learned from {theirHis} own master's master.",
              fx: {them:{type:"mentor",op:20,back:"student"},skill:{craft:4}},
            },
            lose: {
              r: '"When you can do the old thing, I will show you a new one." Fair, and maddening.',
              fx: {them:{op:-5},wil:.5},
            },
          },
          {
            t: "Walk out to the human towns for a season",
            r: "The humans live so fast. Everything is badly made and wonderful. You come back, eventually, a little ashamed and a little wiser.",
            fx: {them:{op:-15},int:.5,happy:5,lang:"Northfolk"},
          },
        ],
      },
      {
        id: "lf_teen_elf_patience",
        cond: p=>C.race(p,"elf","halfelf")&&(teen(p)||C.child(p)&&C.ageAdj(p)>=9),
        cool: 10,
        title: "Vael, vael",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{ageAdj:60,sex:"F"}));x.occ="your teacher of trees and herbs"},
        text: "Forty years of lessons: trees, herbs, the bow, the chants. {them} says you will be ready in another dozen. Your human friend at the forest edge is already married, with a child.",
        choices: [
          {
            t: "Learn the slow way",
            r: '"Slowly, slowly." The forest teaches patience, or it teaches nothing. You begin, at last, to hear what the trees are saying.',
            fx: {them:{type:"mentor",op:15,back:"student"},skill:{survival:2,medicine:2},wil:1},
          },
          {
            t: "Ask to learn the bow sooner",
            check: {s:"bow",s2:"wil",d:28},
            win: {
              r: '{them} sighs and puts a bow in your hands. "Show me." You do. The lessons speed up, a little.',
              fx: {skill:{bow:4},them:{op:10}},
            },
            lose: {
              r: "Your arrows find everything but the mark. {them} says nothing, very eloquently.",
              fx: {skill:{bow:1},wil:.5},
            },
          },
          {
            t: "Spend a summer with the humans at the edge",
            r: "Everything they do is so quick and loud and brief. You come home wiser about mortals, and sadder.",
            fx: {int:.5,happy:3,them:{op:-6}},
          },
        ],
      },
      {
        id: "lf_teen_wage_spend",
        cond: p=>(teen(p)||youngA(p))&&p.coin>=5&&p.coin<60&&!unfree(p),
        once: !0,
        title: "Coin of your own",
        text: "For the first time in your life you have a few suns of your own, earned with your own back. Your mother has ideas. So does the alehouse. So does the peddler with the red boots.",
        choices: [
          {
            t: "Give it to your mother for the house",
            r: "She looks at the coins, then at you, and has to turn away. The roof gets mended.",
            fx: {coin:-4,rel:{who:"mother",op:10},honor:2,happy:3},
          },
          {
            t: "Buy the red boots",
            r: "Too tight, too red, and the best thing you have ever owned.",
            fx: {coin:-4,looks:2,happy:6},
          },
          {
            t: "Save it in a pot under the floor",
            r: "The beginning of something. You check the pot every night.",
            fx: {wil:.5},
          },
          {
            t: "Stand drinks for your friends",
            r: "One glorious night. The coins are gone by midnight, and everyone loves you until noon.",
            fx: {coin:-4,happy:5,newRel:{type:"friend",op:25}},
          },
        ],
      },
    ]);
    add([
      {
        id: "lf_mid_regret",
        cond: p=>midA(p),
        cool: 12,
        title: "The road not taken",
        setup: (p,ctx)=>{ctx.drink=dry(p)?"coffee and bitterness":drink(p),ctx.what=A.pick(["the ship you did not sail on at twenty","the sweetheart you let go","the apprenticeship you turned down","the quarrel with your father that you never mended","the night you could have spoken and did not"])},
        text: "Lying awake, you think about {what}. Your life would have been entirely different. Better, maybe. Maybe not.",
        choices: [
          {
            t: "Make peace with it",
            check: {s:"wil",s2:"faith",d:35},
            win: {
              r: "This is your life, and it has been a real one. You fall asleep at last, lighter.",
              fx: {happy:6,wil:1,untrait:"vengeful"},
            },
            lose: {r:"The thought follows you for weeks, gnawing.",fx:{happy:-5,wil:.8}},
          },
          {
            t: "Do something about it, even now",
            r: "You write the letter, or take the journey, or say the words. It is not the same as then. It is not nothing.",
            fx: {happy:4,wil:1,coin:-3},
          },
          {
            t: "Drown it in {drink}",
            r: "A week of evenings at the alehouse. The thought drowns, and floats back up.",
            fx: {happy:-2,health:-3,cause:"drink"},
          },
        ],
      },
      {
        id: "lf_mid_crisis",
        cond: p=>midA(p)&&!C.soldier(p)&&free(p),
        cool: 15,
        title: "Not dead yet",
        text: "One morning you look at your grey hairs and your soft hands and think: is this all? You want a horse. Or a sword. Or a journey. Or something you cannot name.",
        choices: [
          {
            t: "Buy a horse you do not need (60 suns)",
            req: p=>p.coin>=60,
            r: "A tall bay with a wicked eye. You ride out every evening like a young lord. Your family rolls its eyes. You do not care.",
            fx: {coin:-60,gear:{mount:"horse"},happy:10,skill:{riding:2}},
          },
          {
            t: "Take up the sword with the youngsters",
            check: {s:"sword",s2:"sta",d:35},
            win: {
              r: "Stiff and slow at first, then not bad at all. The young ones stop laughing.",
              fx: {skill:{sword:4},sta:.5,happy:6},
            },
            lose: {
              r: "You pull something in your back on the first day and spend a week in bed.",
              fx: {health:-6,cause:"foolishness",wound:"back",happy:-3},
            },
          },
          {
            t: "Go on a pilgrimage",
            r: "Weeks on the road, sore feet, strangers' kindness. You come home thinner and happier.",
            fx: {piety:6,sta:.4,happy:6,coin:-6,wil:.8},
          },
          {
            t: "Shrug: this is all, and it is enough",
            r: "You go back to work. Strange how much better the bread tastes today.",
            fx: {happy:2,wil:.6,trait:"content"},
          },
        ],
      },
      {
        id: "lf_mid_body",
        cond: p=>midA(p)&&p.race!=="elf",
        cool: 12,
        title: "The body keeps count",
        text: "You lift a sack you have lifted ten thousand times, and something in your back says no. The younger ones are faster now. Your knees ache before rain.",
        choices: [
          {
            t: "Work smarter, not harder",
            check: {s:"int",s2:"wil",d:33},
            win: {
              r: "You let the young ones carry and you do the thinking. Your work gets better, not worse.",
              fx: {int:.5,perf:3,happy:2},
            },
            lose: {
              r: "Pride keeps you lifting. Your back makes you pay.",
              fx: {health:-6,cause:"a bad back",wound:"back"},
            },
          },
          {
            t: "Keep strong: walk, lift, never stop",
            r: "Every morning, cold water and a hard walk. You will not go soft. Not yet.",
            fx: {str:.4,sta:.5,wil:.6},
          },
          {
            t: "Accept it with grace",
            r: "Everyone gets old who is lucky. You start sitting in the sun at noon, and find you like it.",
            fx: {happy:3,wil:.4},
          },
        ],
      },
      {
        id: "lf_mid_student",
        cond: p=>midA(p)&&Object.values(p.skills||{}).some(v=>v>=40),
        cool: 10,
        title: "A young one at your elbow",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{ageAdj:14+A.ri(0,4)}));ctx.sk=Object.keys(p.skills||{}).filter(k=>GD.SKILLS[k]).sort((a,b)=>p.skills[b]-p.skills[a])[0]||"craft",ctx.skn=String(GD.SKILLS[ctx.sk]||ctx.sk).toLowerCase()},
        text: "{themFull}, a youngster of {home}, has been following you about for weeks, watching how you work. Today {theyHe} asked you straight out to teach {themHim} {skn}.",
        choices: [
          {
            t: "Take {themHim} on",
            r: "Teaching turns out to be its own skill. You learn as much as {them} does, and you have someone to pass it to.",
            fx: (p,ctx)=>{bump(p,T(ctx),30,"student","mentor"),A.trainSkill(p,ctx.sk,2),hp(p,6),A.fame(p,1)},
          },
          {
            t: "Test {themHim} first",
            check: {s:"int",s2:"wil",d:30},
            win: {
              r: "You set {themHim} an impossible task. {them} fails at it with such stubbornness that you take {themHim} on.",
              fx: (p,ctx)=>{bump(p,T(ctx),25,"student","mentor"),A.trainSkill(p,ctx.sk,1)},
            },
            lose: {r:"{them} gives up on the first day. You were right to test.",fx:{wil:.3}},
          },
          {
            t: "Send {themHim} away: you learned alone",
            r: "{them} goes. You hear later that {theyHe} found another master, and is good.",
            fx: {them:{op:-10}},
          },
        ],
      },
      {
        id: "lf_mid_elders",
        cond: p=>midA(p)&&free(p)&&p.honor>=45,
        cool: 12,
        title: "A seat among the elders",
        setup: (p,ctx)=>{ctx.body=law(p)==="north"?"the Thing":law(p)==="orc"?"the circle at the fire":law(p)==="deep"?"the clan council":C.town(p)?"the ward council":"the village elders"},
        text: "You are asked to sit with {body}: settling boundaries, sharing out the common grazing, deciding who mends the bridge. It is an honor. It is also a great deal of listening to fools.",
        choices: [
          {
            t: "Accept, and do it well",
            check: {s:"diplomacy",s2:"int",d:37},
            win: {
              r: "Your judgments are fair and your words are few. People start bringing you their quarrels before they reach the court.",
              fx: {fame:3,honor:4,skill:{diplomacy:3}},
            },
            lose: {
              r: "You make enemies on both sides of the first quarrel you judge. It is a long apprenticeship.",
              fx: {fame:1,newRel:{type:"rival",op:-20},skill:{diplomacy:1}},
            },
          },
          {
            t: "Accept, and push for a change you want",
            check: {s:"persuasion",s2:"intrigue",d:43},
            win: {
              r: "You get the new well dug, or the bridge mended, or the tithe barn opened in the hungry month. They will remember your name for it.",
              fx: {fame:4,honor:3,skill:{persuasion:2}},
            },
            lose: {r:"The old men block you at every turn. You learn how things really work.",fx:{int:.4,wil:.6}},
          },
          {t:"Decline: you have enough to do",r:"They are disappointed. You are relieved.",fx:{honor:-1}},
        ],
      },
      {
        id: "lf_mid_pilgrimage",
        cond: p=>midA(p)&&free(p)&&p.piety>=40,
        cool: 15,
        title: "The pilgrim road",
        setup: (p,ctx)=>{ctx.where={"REL-01":"Solenne, to stand under the Needle at noon on Return Day","REL-07":"the Well of Samar, to drink where Samar dug","REL-06":"the 280-kilometer circuit of Lake Bluespire","REL-02":"the great monastery at Velgrad","REL-03":"the old mound of the first jarl","REL-08":"the Flood Stairs at Tamar","REL-09":"the Ancestor Hill","REL-10":"the river temples of Ranpur","REL-17":"the graves of the Marchland Saints"}[p.faith]||"the holiest place your faith knows"},
        text: "You have always meant to make the pilgrimage to {where}. You are not getting younger. The roads are long, and the inns are full of fleas and thieves and other pilgrims.",
        choices: [
          {
            t: "Go, on foot, as is proper",
            check: {s:"sta",s2:"wil",d:37},
            win: {
              r: "Weeks of road, then the place itself. Whatever you believed before, you stand there and weep. You come home changed, and everyone can see it.",
              fx: {piety:10,wil:1.5,sta:.5,coin:-10,fame:1,deed:"Made the pilgrimage"},
            },
            lose: {
              r: "A fever on the road puts you in a monastery infirmary for a month. You never reach it. The monks are kind.",
              fx: {piety:4,health:-12,cause:"a fever on the pilgrim road",coin:-8,wil:1},
            },
          },
          {
            t: "Go with a merchant caravan, in comfort",
            req: p=>p.coin>=30,
            r: "Comfortable, safe, and somehow less holy. Still, you stood there.",
            fx: {coin:-30,piety:6,happy:4},
          },
          {t:"Pray at home instead",r:"The gods are everywhere, the priests say. You hope so.",fx:{piety:1}},
        ],
      },
      {
        id: "lf_mid_old_friend_rich",
        cond: p=>midA(p)&&!high(p),
        cool: 12,
        title: "Comparing lives",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{status:"merchant",ageAdj:C.ageAdj(p)}));x.occ="an old schoolfellow, now rich"},
        text: 'At the fair you meet {themFull}, who you used to beat at wrestling. {theyHe} is fat, rich, and has three ships. {theyHe} looks at your hands and your coat and says, kindly, "And how has life treated you?"',
        choices: [
          {
            t: "Tell the truth, proudly",
            r: 'You tell {themHim} about your family, your work, your small good life. {them} is quiet for a long moment. "I envy you," {theyHe} says, and seems to mean it.',
            fx: {them:{type:"friend",op:20,back:"friend"},happy:6,wil:.5},
          },
          {
            t: "Exaggerate a little",
            check: {s:"deception",s2:"persuasion",d:35},
            win: {
              r: "By the end {them} thinks you are doing very well indeed. You feel slightly worse.",
              fx: {them:{type:"friend",op:10,back:"friend"},honor:-1},
            },
            lose: {r:"{them} sees straight through it, and is too kind to say so.",fx:{happy:-4}},
          },
          {
            t: "Ask {themHim} for a place in {theirHis} business",
            check: {s:"persuasion",s2:"trade",d:40},
            win: {
              r: `"For old times' sake." A real job, with real pay.`,
              fx: {coin:20,job:"merchant",them:{type:"friend",op:15,back:"friend"}},
            },
            lose: {r:"{them} goes vague and remembers an appointment.",fx:{happy:-3}},
          },
        ],
      },
      {
        id: "lf_mid_spouse_rekindle",
        cond: p=>midA(p)&&C.married(p)&&hasKid(p,16,60)&&!hasKid(p,0,12),
        cool: 12,
        title: "An empty house",
        setup: (p,ctx)=>setPid(p,ctx,spouseOf(p)),
        text: "The children are grown and gone. For the first time in twenty years, you and {them} sit at the table alone, and the house is very quiet.",
        choices: [
          {
            t: "Court {themHim} again, like when you were young",
            check: {s:"persuasion",s2:"int",d:30},
            win: {
              r: "A ribbon from the market, a walk by the river. {them} laughs at you, and then takes your arm.",
              fx: {them:{op:20},happy:10},
            },
            lose: {
              r: "{them} thinks you have gone soft in the head. Still, it was nice to try.",
              fx: {them:{op:5},happy:2},
            },
          },
          {
            t: "Take in a lodger for the company and the coin",
            r: "A young journeyman with terrible jokes. The house is noisy again.",
            fx: {coin:6,happy:3},
          },
          {
            t: "Enjoy the quiet",
            r: "Quiet suppers, early nights, nobody shouting for their boots. You find you have earned this.",
            fx: {happy:4,them:{op:6}},
          },
        ],
      },
      {
        id: "lf_mid_debt_old_friend",
        cond: p=>midA(p)&&free(p)&&p.coin>=20,
        cool: 15,
        w: .7,
        title: "An old debt remembered",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{ageAdj:C.ageAdj(p)+20}));ctx.v=10+A.ri(0,10)},
        text: "You remember, suddenly and sharply, that {themFull} lent you {v} suns when you were young and desperate, and you never paid it back. {them} is old now, and poor.",
        choices: [
          {
            t: "Pay it back, with interest",
            r: '{them} stares at the coins, then at you. "I had forgotten." "I had not," you lie.',
            fx: (p,ctx)=>{pay(p,ctx.v*2),bump(p,T(ctx),30,"friend","friend"),hon(p,4),hp(p,5)},
          },
          {
            t: "Pay it back, exactly",
            r: "A debt is a debt. {them} nods and pockets it. Square.",
            fx: (p,ctx)=>{pay(p,ctx.v),bump(p,T(ctx),15,"friend","friend"),hon(p,2)},
          },
          {
            t: "Let it lie: {theyHe} has surely forgotten",
            r: "Probably {theyHe} has. You have not.",
            fx: {honor:-2,happy:-2},
          },
        ],
      },
    ]);
    add([
      {
        id: "lf_old_will",
        cond: p=>C.old(p)&&!C.flag(p,"lf_will_made"),
        cool: 6,
        title: "Who gets what",
        setup: (p,ctx)=>{ctx.how=law(p)==="deep"?"carved in stone by a Law-Carver":C.town(p)||law(p)==="well"||law(p)==="sun"?"written down by a notary and sealed":"spoken before witnesses, as the law of your people allows"},
        text: "You are old, and the young ones have started being very kind to you, which is suspicious. It is time to decide who gets what, {how}.",
        choices: [
          {
            t: "Divide it fairly among all your kin",
            check: {s:"diplomacy",s2:"learning",d:33},
            win: {
              r: "Every child, every grandchild, a fair share and a small keepsake. There is grumbling, but no war.",
              fx: {flag:"lf_will_made",honor:3,happy:4,rel:{who:"child",op:8,all:!0}},
            },
            lose: {
              r: "Fair to you; unfair to everyone else. Three of them stop visiting.",
              fx: {flag:"lf_will_made",rel:{who:"child",op:-6,all:!0},happy:-4},
            },
          },
          {
            t: "Leave it all to the one who cared for you",
            r: "One child, who stayed. The others will be furious. The one who stayed weeps.",
            fx: {flag:"lf_will_made",honor:1,happy:3},
          },
          {
            t: "Leave a large gift to the temple",
            r: 'A gift "to cover any sins". The priests will pray for you for a hundred years. Your heirs will not.',
            fx: p=>{p.flags.lf_will_made=A.S.year,pie(p,10),pay(p,Math.round(p.coin*.3)),A.fame(p,1)},
          },
          {t:"Refuse to think about it",r:"You will live forever, out of spite.",fx:{wil:.5}},
        ],
      },
      {
        id: "lf_old_stories",
        cond: p=>C.old(p),
        cool: 4,
        w: 1.3,
        title: "Tell us a story",
        setup: (p,ctx)=>{const gc=relP(p,["grandchild"]);ctx.who=gc?`your grandchild ${gc.given} and a crowd of small friends`:"a crowd of the village children";const s=(LORE.songs||[]).filter(x=>x&&x[0]);ctx.song=s.length?A.pick(s)[0]:"the old songs"},
        text: 'Every evening now {who} sits at your feet by the fire. "Tell us about when you were young." "Tell us {song}." "Tell us about the war."',
        choices: [
          {
            t: "Tell them about your own life, honestly",
            r: "The hungry years, the good years, the stupid things you did. They laugh in the right places. One of them will tell your story when you are gone.",
            fx: {happy:8,fame:1,wil:.4},
          },
          {
            t: "Tell them the old song, and the truth behind it",
            check: {s:"learning",s2:"music",d:30},
            win: {
              r: "They argue about it for days. You have taught them the most important thing: songs are not always what happened.",
              fx: {happy:6,int:.3},
            },
            lose: {r:"You lose the thread and they fall asleep. Well, that is one use for a story.",fx:{happy:3}},
          },
          {
            t: "Make up something wild",
            r: "Dragons, sea-maidens and a talking horse. Pure invention. They demand it every night for a year.",
            fx: {happy:7,skill:{music:1}},
          },
        ],
      },
      {
        id: "lf_old_failing",
        cond: p=>C.old(p)&&p.race!=="elf",
        cool: 8,
        title: "The stairs get steeper",
        text: "The stairs have got steeper, the needle's eye smaller, and the names of people you have known all your life keep slipping out of reach.",
        choices: [
          {
            t: "Let the family help you",
            r: "A grandchild reads to you; a son carries the water. It is humbling. It is also kind.",
            fx: {happy:3,wil:.6},
          },
          {
            t: "Refuse help: you will manage",
            check: {s:"wil",s2:"sta",d:35},
            win: {r:"Slower, but your own. You manage, out of pure stubbornness.",fx:{wil:1.2,sta:.2}},
            lose: {
              r: "A fall on the stairs. A long winter in bed. The help comes anyway.",
              fx: {health:-12,cause:"a fall",wound:"bad_knee",wil:1},
            },
          },
          {
            t: "Keep your mind sharp: games, stories, puzzles",
            r: "You play Captains with the blacksmith every evening and beat him more often than not.",
            fx: {int:.3,happy:3},
          },
        ],
      },
      {
        id: "lf_old_last_wish",
        cond: p=>C.old(p)&&!C.flag(p,"lf_last_wish"),
        cool: 6,
        title: "One more time",
        setup: (p,ctx)=>{ctx.wish=A.pick(["see the sea once before you die","visit the village where you were born","stand on the hill where you first kissed someone","hear the great bells at {capital}","eat a feast like the one at your wedding"])},
        text: "You want to {wish}. Your family says it is too far, too much, too dangerous at your age. They are probably right.",
        choices: [
          {
            t: "Go anyway",
            check: {s:"wil",s2:"sta",d:33},
            win: {
              r: "It takes everything you have. You stand there, and it is exactly as you remembered, or better. Now you can go when the gods call.",
              fx: {flag:"lf_last_wish",happy:15,wil:1,health:-5,cause:"a hard journey in old age"},
            },
            lose: {
              r: "You get halfway and your body says no. You turn back. Still, you tried.",
              fx: {flag:"lf_last_wish",health:-10,cause:"a hard journey in old age",happy:2,wil:1},
            },
          },
          {
            t: "Ask a grandchild to take you",
            r: "A cart, a grandchild, slow roads. You talk the whole way. It is the best journey of your life.",
            fx: {flag:"lf_last_wish",happy:12,coin:-4},
          },
          {t:"Let it go",r:"Some wishes are better kept than spent.",fx:{flag:"lf_last_wish",happy:-2,wil:.5}},
        ],
      },
      {
        id: "lf_old_score",
        cond: p=>C.old(p),
        cool: 10,
        title: "An old score",
        setup: (p,ctx)=>{const x=setPid(p,ctx,relP(p,["rival","enemy"])||linkNew(p,mk(p,{ageAdj:C.ageAdj(p)+A.ri(-3,5)}),"rival",-30))},
        text: "{them} is old too now, and ill, and has sent word: {theyHe} wants to see you before the end. Forty years ago {theyHe} did you a wrong you have never forgiven.",
        choices: [
          {
            t: "Go, and forgive",
            check: {s:"wil",s2:"faith",d:37},
            win: {
              r: "Two old people by a fire. You say what needs to be said, and so does {them}. You walk home lighter than you have been in years.",
              fx: {them:{type:"friend",op:50,back:"friend"},happy:8,wil:1,untrait:"vengeful",piety:2},
            },
            lose: {
              r: "You go meaning to forgive, and the old anger rises in your throat. You leave without the words.",
              fx: {them:{op:-5},wil:.8,happy:-3},
            },
          },
          {
            t: "Go, and tell {themHim} exactly what {theyHe} did",
            r: "Forty years of it, at last, said out loud. {them} weeps. You are not sure if you feel better.",
            fx: {them:{op:10},wil:1,happy:2},
          },
          {
            t: "Refuse to go",
            r: "{them} dies the next winter. You have won. It does not feel like winning.",
            fx: (p,ctx)=>{const t=T(ctx);t&&A.kill(t,"old age"),A.willGrow(p,.6,"grudge"),hp(p,-3)},
          },
        ],
      },
      {
        id: "lf_old_confession",
        cond: p=>C.old(p)&&p.health<70,
        cool: 10,
        title: "Before the priest",
        setup: (p,ctx)=>{ctx.cl=clergy(p),ctx.sin=A.pick(["the hen you stole as a child, and blamed on a fox","the lie that cost a friend his place","the night you could have helped and walked on","the money in the road you kept","the person you loved who was not your spouse"])},
        text: "The {cl} has come, because your family thinks it is time, which is rude of them. You find there is one thing you want to say before you go: {sin}.",
        choices: [
          {
            t: "Say it, all of it",
            r: "The {cl} listens without a word. When you have finished you feel as if a stone you did not know you carried has gone.",
            fx: {piety:6,happy:6,wil:.6},
          },
          {
            t: "Say it to the person you wronged, if they live",
            check: {s:"wil",s2:"persuasion",d:35},
            win: {
              r: 'They are old too. They take your hand. "I knew," they say. "I forgave you years ago."',
              fx: {happy:10,honor:3,wil:1},
            },
            lose: {r:"They are dead, or they will not see you. You say it to the {cl} instead.",fx:{piety:3,happy:2}},
          },
          {
            t: "Take it with you",
            r: "Some things are yours alone. You smile at the {cl} and talk about the weather.",
            fx: {wil:.8},
          },
        ],
      },
      {
        id: "lf_old_burial_wish",
        cond: p=>C.old(p),
        cool: 12,
        title: "How you will be sent off",
        setup: (p,ctx)=>{ctx.rite=rite(p),ctx.things=p.race==="dwarf"?"your tools to lie beside you in the vault":C.faith(p,"REL-03")?"a mound and a grave-ale strong enough to remember":C.faith(p,"REL-04")?"an oak sapling, not a birch":C.faith(p,"REL-01")?"a grave by the temple wall, facing east":"everything done properly"},
        text: "You will be {rite}. That much is settled. But you have opinions: you want {things}, and you want your family to know it.",
        choices: [
          {
            t: "Gather the family and tell them plainly",
            r: "They are embarrassed and then, slowly, grateful. Nobody will have to guess.",
            fx: {happy:4,wil:.4},
          },
          {
            t: "Put coin aside for it",
            r: "A purse in the chest, marked for the rite. Nobody will have to borrow for you.",
            fx: p=>{pay(p,6*Math.max(1,Math.round(purse(p)/2))),pie(p,3),hp(p,3)},
          },
          {
            t: "Tell them to throw you in the river and save the money",
            r: "They are scandalized, which was the point. They will do it properly anyway.",
            fx: {happy:3,piety:-1},
          },
        ],
      },
      {
        id: "lf_old_outlived",
        cond: p=>C.old(p),
        cool: 10,
        title: "The last of your year",
        setup: (p,ctx)=>{const x=setPid(p,ctx,relP(p,["friend","bestfriend"])||linkNew(p,mk(p,{ageAdj:C.ageAdj(p)}),"friend",40));A.kill(x,A.pick(["old age","a winter cough","a fever","a fall"])),ctx.rite=rite(p)},
        text: "{them} is dead, the last of the children you grew up with. You stand at the graveside as {theyHe} is {rite}, and realize there is nobody left alive who remembers you young.",
        choices: [
          {
            t: "Tell {theirHis} grandchildren what {theyHe} was like at ten",
            r: "The day you both stole the priest's plums. They laugh, then cry. Now someone remembers.",
            fx: {happy:2,wil:1,fame:1},
          },
          {
            t: "Grieve alone",
            r: "You sit by the grave after the others leave. The wind is cold. You do not mind.",
            fx: {wil:1.5,happy:-6},
          },
          {
            t: "Make a new friend, out of spite",
            r: "You find the oldest person left in {home} who is not you, and start an argument. It is the beginning of something.",
            fx: {happy:4,newRel:{type:"friend",op:20}},
          },
        ],
      },
      {
        id: "lf_old_advice_ignored",
        cond: p=>C.old(p),
        cool: 8,
        title: "Nobody listens to the old",
        setup: (p,ctx)=>{ctx.what=A.pick(["the river will flood this year, as it did when you were nine","the new reeve is a thief","that bridge will not take a loaded cart","the young lord's war will go badly"])},
        text: "You have told them that {what}. They nod and smile and pat your hand and do nothing. You are old, not stupid.",
        choices: [
          {
            t: "Make them listen",
            check: {s:"persuasion",s2:"wil",d:40},
            win: {
              r: "You go on at them until they do something, mostly to make you stop. A month later you are proved right, and they bring you honey cakes.",
              fx: {fame:2,honor:2,happy:6},
            },
            lose: {r:"They humor you. You are proved right anyway, and nobody says sorry.",fx:{happy:-3,wil:.6}},
          },
          {
            t: "Act on it yourself",
            r: "You move your own grain to the high loft, or hide your own coin. When it happens, you are ready, and you are kind enough not to gloat. Much.",
            fx: {coin:3,int:.2,happy:3},
          },
          {t:"Let them learn the hard way",r:"You were young once, too. They will learn.",fx:{wil:.4}},
        ],
      },
      {
        id: "lf_old_grandchild_secret",
        cond: p=>C.old(p),
        cool: 8,
        title: "A grandchild's secret",
        setup: (p,ctx)=>{const x=setPid(p,ctx,relP(p,["grandchild"])||linkNew(p,mk(p,{ageAdj:14}),"grandchild",40,(p.sex==="M","grandparent")));ctx.sec=A.pick(["is in love with someone the family will hate","wants to run away to sea","broke the family's best jug and hid the pieces","has stopped believing in the gods","owes money at the dice"])},
        text: `{them} comes to you, not to {theirHis} parents, and confesses that {theyHe} {sec}. "Please don't tell."`,
        choices: [
          {
            t: "Keep the secret, and give advice",
            r: "You listen, and say a few true things. {them} hugs you so hard your bones creak.",
            fx: {them:{op:25},happy:6},
          },
          {
            t: "Help {themHim} put it right",
            check: {s:"persuasion",s2:"int",d:30},
            win: {
              r: "Together you find a way through. {them} will remember this when {theyHe} is old.",
              fx: {them:{op:30},happy:8,honor:1},
            },
            lose: {r:"Your help makes things more complicated. Still, {them} came to you.",fx:{them:{op:15}}},
          },
          {
            t: "Tell the parents: it is for the best",
            r: "It probably is. {them} does not come to you again.",
            fx: {them:{op:-20},honor:1},
          },
        ],
      },
      {
        id: "lf_old_elf_fade",
        cond: p=>C.old(p)&&C.race(p,"elf"),
        cool: 20,
        title: "The slow fade",
        text: "After three and a half centuries, you are fading. Not sick, not hurt: thinning, like light at dusk. You remember the Black Cough years, and the human traders weeping at the stones, and the faces of humans who died of old age while you were still young.",
        choices: [
          {
            t: "Choose the sapling you will lie under",
            r: "An oak on the hill, facing the morning. You visit it every day. It will carry your life when you are gone.",
            fx: {piety:5,happy:5,wil:1},
          },
          {
            t: "Sing the long songs to the young",
            r: "Wordless, the way your mother sang them. The young elves listen, and the sound carries a long way across the snow.",
            fx: {fame:2,happy:6,skill:{music:2}},
          },
          {
            t: "Visit the humans one last time",
            r: "The great-great-grandchildren of people you knew. They have their ancestors' faces. You weep, and they do not know why.",
            fx: {happy:2,wil:1.5},
          },
        ],
      },
      {
        id: "lf_old_dwarf_vault",
        cond: p=>C.old(p)&&C.race(p,"dwarf"),
        cool: 20,
        title: "The tools you will take",
        text: "You will lie in the rock vault with your tools, to join the Ancestors' Hall. Your hammer, surely. But which chisel? Your master's, or the one you made at your name-carving? It matters. In the holds, everything that is carved matters.",
        choices: [
          {
            t: "Your master's chisel: honor the line",
            r: "The line goes back through your master to the First Hall. You will carry it down to them.",
            fx: {piety:5,honor:3},
          },
          {
            t: "Your own: what you made is what you were",
            r: "A good chisel, made true. The Ancestors will know you by it.",
            fx: {piety:3,happy:4},
          },
          {
            t: "Give both to your apprentice, and take nothing",
            r: "A scandal in the gallery. But your apprentice weeps, and the clan-elder nods slowly. Hold fast.",
            fx: {honor:5,fame:2,piety:-2},
          },
        ],
      },
    ]);
    add([
      {
        id: "lf_slave_new_master",
        cond: p=>C.adult(p)&&slave(p),
        cool: 10,
        title: "Sold",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{status:A.pick(["merchant","gentry"]),ageAdj:C.ageAdj(p)+A.ri(0,20)}));x.occ="your new master",ctx.place=A.T("{town}")},
        text: "Your master has debts, and you are one of the things that pays them. You are walked to {place} on a rope and handed to {themFull}, who looks you over like a horse and says nothing at all.",
        choices: [
          {
            t: "Make yourself useful from the first hour",
            check: {s:"wil",s2:"int",d:35},
            win: {
              r: "You learn the house in a week and the master's moods in a month. {them} gives you the keys to the store-room. It is something.",
              fx: (p,ctx)=>{bump(p,T(ctx),20,"master","servant"),p.home=A.pick(A.S.prov.filter(x=>x.owner===p.realm).map(x=>x.id).concat([p.home])),A.willGrow(p,1,"endurance")},
            },
            lose: {
              r: "Nothing you do is right. The new overseer has a stick and uses it.",
              fx: {health:-10,cause:"beatings",wil:2,happy:-10},
            },
          },
          {
            t: "Grieve for the people you left",
            r: "The friends of twenty years, the shared mat, the songs at night. Gone in a morning. You carry them in your head.",
            fx: {wil:2,happy:-12},
          },
          {
            t: "Watch for a way out",
            check: {s:"int",s2:"stealth",d:40},
            win: {
              r: "The new house has a back gate and a lazy porter. You note it, and wait.",
              fx: {flag:"lf_way_out",skill:{stealth:1},wil:1},
            },
            lose: {r:"The new house is a fortress. You will have to be patient.",fx:{wil:1.2}},
          },
        ],
      },
      {
        id: "lf_slave_gate",
        cond: p=>C.adult(p)&&slave(p)&&C.flag(p,"lf_way_out"),
        cool: 4,
        title: "The back gate",
        text: "The porter is drunk again. The back gate is on the latch. It is the dark of the moon. You have been waiting for exactly this night for a year.",
        choices: [
          {
            t: "Go now",
            check: {s:"stealth",s2:"spd",d:45},
            win: {
              r: "Through the gate, down the lane, into the dark. By dawn you are a stranger on a road where nobody knows your face.",
              fx: p=>(delete p.flags.lf_way_out,A.ach("escaped"),setFree(p,"runaway")),
            },
            lose: {
              r: "The porter wakes. The dogs are loosed. You are dragged back and branded so every buyer will know.",
              fx: p=>{delete p.flags.lf_way_out,A.addWound(p,"brand"),hurt(p,15,"a flogging"),A.willGrow(p,3,"defeat"),hp(p,-15)},
            },
          },
          {
            t: "Not yet: one more year of savings",
            r: "You lie awake listening to the porter snore. Next year. Next year.",
            fx: {wil:1,coin:2},
          },
          {
            t: "Give up the idea: you have people here now",
            r: "A friend on the next mat, a child in the kitchen who calls you aunt or uncle. You stay.",
            fx: p=>{delete p.flags.lf_way_out,hp(p,2),A.willGrow(p,.8,"choice")},
          },
        ],
      },
      {
        id: "lf_slave_kind_child",
        cond: p=>C.adult(p)&&slave(p),
        cool: 8,
        title: "The master's child",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{status:"merchant",ageAdj:10+A.ri(0,4)}));x.occ="your master's child"},
        text: "{themFull}, your master's child, follows you about all day asking questions: where you were born, what your mother was called, why you have that scar. Nobody has asked you those things in years.",
        choices: [
          {
            t: "Answer honestly",
            r: "{them} goes very quiet when you tell {themHim} about the slave market. The next day {theyHe} brings you an apple and does not say why.",
            fx: {them:{type:"friend",op:30,back:"friend"},happy:4},
          },
          {
            t: "Teach {themHim} a song from your homeland",
            check: {s:"music",s2:"wil",d:30},
            win: {
              r: "{them} sings it badly all over the house. The master frowns. The kitchen smiles.",
              fx: {them:{type:"friend",op:30,back:"friend"},happy:6,skill:{music:1}},
            },
            lose: {r:"You find you cannot sing it. Your voice will not come.",fx:{wil:1,them:{op:10}}},
          },
          {
            t: "Keep your distance: that child will own you one day",
            r: "You give short answers until {theyHe} stops asking. It is safer. It is lonelier.",
            fx: {wil:.8,happy:-2},
          },
        ],
      },
      {
        id: "lf_serf_new_year",
        cond: p=>C.adult(p)&&serf(p),
        cool: 5,
        title: "New Year's reckoning",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{status:"peasant",sex:"M",ageAdj:C.ageAdj(p)+10}));x.occ="the lord's reeve",ctx.dues=A.pick(["the hearth tax, a share of the rye and two hens","three days a week on the lord's fields and a cartload of firewood","the hearth tax and a heriot for your father's death"])},
        text: "It is New Year's Day, when rents are reckoned. At the village hall {themFull}, the reeve, counts what each hearth owes: for yours, {dues}. The harvest was thin.",
        choices: [
          {
            t: "Pay in full, whatever it leaves you",
            r: "Paid. The winter will be lean, but your name is clean in the reeve's tally.",
            fx: p=>{pay(p,3+purse(p)),hon(p,2),A.willGrow(p,.6,"want")},
          },
          {
            t: "Plead the thin harvest",
            check: {s:"persuasion",s2:"etiquette",d:37},
            win: {
              r: "The reeve grunts and lets the hens go until spring. A small mercy, but a mercy.",
              fx: {them:{op:8},skill:{persuasion:1}},
            },
            lose: {
              r: `"Everyone's harvest was thin." He takes the hens and a sack of rye besides.`,
              fx: p=>{pay(p,4+purse(p)),hp(p,-4)},
            },
          },
          {
            t: "Hide a sack of rye from the count",
            check: {s:"deception",s2:"stealth",d:40},
            win: {
              r: "Under the floor of the byre. The reeve never looks there. Your children eat through March.",
              fx: {skill:{deception:1},happy:3,health:2},
            },
            lose: {
              r: "The reeve's boy finds it. A fine, and the stocks for a morning, and the whole village watching.",
              fx: {coin:-4,honor:-4,wil:1.5,happy:-6},
            },
          },
        ],
      },
      {
        id: "lf_serf_woods",
        cond: p=>C.adult(p)&&(serf(p)||p.status==="peasant")&&C.terr(p,"forest","hills","plains"),
        cool: 7,
        title: "The lord's wood",
        setup: (p,ctx)=>{ctx.law=C.realm(p,"POL-05")?"In the royal forests of Ashmere a poacher loses a hand.":"The lord's court fines a first offense and brands a second."},
        text: "Winter is hard and your woodpile is gone. The lord's forest is full of deadwood, and there are deer tracks in the snow by the stream. {law}",
        choices: [
          {
            t: "Gather deadwood only: that is the old right",
            r: 'By old custom a bondman may take what he can pull down "by hook or by crook". You fill your cart. The forester glares, and lets it go.',
            fx: {health:2,happy:2},
          },
          {
            t: "Take a deer",
            check: {s:"tracking",s2:"stealth",d:45},
            win: {
              r: "One clean shot at dusk, carried home in the dark. Your family eats meat for a fortnight and asks no questions.",
              fx: {health:6,happy:6,skill:{tracking:2}},
            },
            lose: {
              r: "The forester's men find you with the carcass.",
              fx: p=>C.realm(p,"POL-05")&&A.chance(.5)?(A.addWound(p,"lost_hand"),A.willGrow(p,3,"maimed"),"(They take your hand.)"):(A.punish(p,"theft"),""),
            },
          },
          {
            t: "Burn the old fence posts instead",
            r: "Cold comfort and a smoky fire. You will mend the fence in spring. Probably.",
            fx: {health:-2,cause:"cold",wil:.6},
          },
        ],
      },
      {
        id: "lf_peasant_ox",
        cond: p=>C.adult(p)&&low(p)&&!C.town(p)&&!unfree(p),
        cool: 8,
        title: "The ox is down",
        setup: (p,ctx)=>{ctx.v=40},
        text: "Your plough-ox lies in the byre and will not get up. Without it, the spring ploughing is three times the work. A new ox costs about {v} suns, which you do not have.",
        choices: [
          {
            t: "Nurse it yourself",
            check: {s:"husbandry",s2:"medicine",d:37},
            win: {
              r: "Warm mash, a poultice, three nights in the straw beside it. On the fourth morning it heaves itself up and bellows for breakfast.",
              fx: {skill:{husbandry:3},happy:6,wil:.6},
            },
            lose: {
              r: "It dies at dawn. You sell the hide and the meat, and pull the plough yourself with your family.",
              fx: {coin:8,str:.6,health:-5,cause:"hard labor",happy:-6,wil:1},
            },
          },
          {
            t: "Share a neighbor's ox, for your labor",
            check: {s:"persuasion",s2:"diplomacy",d:30},
            win: {
              r: "Two days of your work for one day of his ox. A fair trade, and a friendship.",
              fx: {newRel:{type:"friend",op:20},sta:.4},
            },
            lose: {
              r: "Everybody needs their ox in spring. You pull the plough yourself.",
              fx: {str:.5,health:-4,cause:"hard labor",wil:.8},
            },
          },
          {
            t: "Borrow to buy a new one",
            r: "A new ox and a new debt. The ploughing gets done.",
            fx: (p,ctx)=>{addDebt(p,ctx.v+10),A.willGrow(p,.4,"debt")},
          },
        ],
      },
      {
        id: "lf_art_widow_shop",
        cond: p=>C.adult(p)&&p.sex==="F"&&(p.status==="artisan"||C.job(p,"smith","weaver","brewer","carpenter","bowyer","mason"))&&(p.widowed||A.chance(.3)),
        cool: 15,
        w: .6,
        title: "The widow keeps the shop",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{sex:"M",status:"artisan",ageAdj:C.ageAdj(p)+10}));x.occ="a guild master"},
        text: "By guild law a master's widow may keep his shop. {themFull}, {themOcc}, would very much like it otherwise: he says a woman cannot meet the guild's standard, and offers to buy you out for a song.",
        choices: [
          {
            t: "Show the guild your work",
            check: {s:"craft",s2:"wil",d:43},
            win: {
              r: "You put a piece before the guild that silences the hall. The masters vote. The shop is yours, and so is their grudging respect.",
              fx: {them:{type:"rival",op:-20,back:"rival"},fame:2,skill:{craft:3},coin:10,asset:"workshop"},
            },
            lose: {
              r: "The piece is good, not great. The guild lets you keep the shop, on probation, and watches every stitch.",
              fx: {them:{type:"rival",op:-10,back:"rival"},wil:1},
            },
          },
          {
            t: "Quote the guild's own law at him",
            check: {s:"learning",s2:"persuasion",d:37},
            win: {
              r: "Chapter and verse, in front of the wardens. He has no answer. The law is the law.",
              fx: {them:{type:"rival",op:-15,back:"rival"},honor:3,skill:{learning:1}},
            },
            lose: {
              r: "The wardens are his friends. The law bends, slowly, in his direction.",
              fx: {coin:-6,wil:1,happy:-4},
            },
          },
          {
            t: "Sell, and take the money",
            r: "A song, but a song in coin. You are free of the guild and its feasts and its fines.",
            fx: {coin:25,happy:-2},
          },
        ],
      },
      {
        id: "lf_art_candle",
        cond: p=>C.adult(p)&&(p.status==="artisan"||C.job(p,"smith","weaver","carpenter","bowyer","mason","brewer"))&&C.town(p),
        cool: 8,
        title: "Work by candlelight",
        text: "A rich customer wants his order by the feast, which means working after dark. The guild forbids work by candlelight, for fear of fire and bad work, and fines any master caught at it.",
        choices: [
          {
            t: "Work by candlelight with the shutters closed",
            check: {s:"craft",s2:"stealth",d:40},
            win: {
              r: "Three nights, the shutters tight. The order is done, and done well. The customer pays double.",
              fx: {coin:12,skill:{craft:2},perf:3},
            },
            lose: {
              r: "A warden sees the light under the door. A fine, and your name read out at the guild feast.",
              fx: {coin:-8,honor:-3},
            },
          },
          {
            t: "Tell the customer he must wait",
            check: {s:"persuasion",s2:"etiquette",d:35},
            win: {r:"He grumbles, and waits, and likes the work so much he forgives you.",fx:{coin:6,honor:1}},
            lose: {r:"He takes his custom to a master who is less particular.",fx:{perf:-3,happy:-2}},
          },
          {
            t: "Hire a journeyman to help by day (4 suns)",
            req: p=>p.coin>=4,
            r: "Two pairs of hands, the dawn bell to the dusk bell. Done on time, honestly.",
            fx: {coin:4,perf:2,skill:{stewardship:1}},
          },
        ],
      },
      {
        id: "lf_merc_partner",
        cond: p=>C.adult(p)&&(p.status==="merchant"||C.job(p,"merchant")),
        cool: 9,
        title: "Your partner's ledger",
        setup: (p,ctx)=>{const x=setPid(p,ctx,known(p,["friend","acquaint"],"friend",20,{status:"merchant"}));x.occ="your partner",ctx.v=6*purse(p)},
        text: "Going over the books with your partner {them}, you find a page that does not add up: about {v} suns, moved quietly into {theirHis} share over two years.",
        choices: [
          {
            t: "Confront {themHim} with the page",
            check: {s:"intimidation",s2:"trade",d:40},
            win: {
              r: "{them} goes white, then pays it back in full. The partnership survives, with you holding the keys.",
              fx: (p,ctx)=>{p.coin+=ctx.v,bump(p,T(ctx),-15),A.trainSkill(p,"trade",1)},
            },
            lose: {
              r: "{them} says it was your mistake, and has a clerk to swear to it. You end the partnership poorer.",
              fx: (p,ctx)=>{bump(p,T(ctx),-40,"enemy","enemy"),pay(p,Math.round(ctx.v/2))},
            },
          },
          {
            t: "Watch quietly and gather proof",
            check: {s:"intrigue",s2:"learning",d:43},
            win: {
              r: "In three months you have enough to hang {themHim}. You do not. You take the business instead, and {them} leaves town.",
              fx: (p,ctx)=>{p.coin+=ctx.v*2,bump(p,T(ctx),-50,"enemy","enemy"),A.trainSkill(p,"intrigue",2)},
            },
            lose: {
              r: "{them} notices you watching and empties the strong-box first.",
              fx: (p,ctx)=>{pay(p,ctx.v),bump(p,T(ctx),-40,"enemy","enemy"),A.willGrow(p,1,"betrayal")},
            },
          },
          {
            t: "Let it go: a good partner is worth a little theft",
            r: "You say nothing. {them} goes on, a little greedier each year.",
            fx: {wil:.4,coin:-2},
          },
        ],
      },
      {
        id: "lf_merc_host_cup",
        cond: p=>C.adult(p)&&(p.status==="merchant"||high(p))&&C.realm(p,"POL-04","POL-16","POL-03","POL-02"),
        cool: 9,
        title: "The host drinks first",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{status:"merchant",ageAdj:C.ageAdj(p)+8}));x.occ="a rival trading house's head"},
        text: "You are dining at the house of {themFull}, {themOcc}. By Lucernan custom a host drinks first from every guest's cup. Tonight {them} forgets, or seems to, and waves you on to drink.",
        choices: [
          {
            t: "Smile, and hand the cup back first",
            check: {s:"etiquette",s2:"intrigue",d:40},
            win: {
              r: '"The custom, my friend." {them} laughs, drinks, and nothing happens. Perhaps it was only forgetfulness. Perhaps not.',
              fx: {them:{op:5},skill:{etiquette:2},honor:1},
            },
            lose: {
              r: "The table goes silent at the insult. {them} drinks, coldly. You have lost a friend, if {theyHe} was one.",
              fx: {them:{type:"rival",op:-20,back:"rival"}},
            },
          },
          {
            t: "Drink",
            r: (p,ctx)=>ctx.bad?"Bitter. By midnight you are sweating and shaking. You live, barely, and never dine there again.":"Good wine, and nothing else. You feel slightly foolish for worrying.",
            fx: (p,ctx)=>(ctx.bad=A.chance(.15)&&!A.hasBlood(p,"unpoisoned"),ctx.bad&&(hurt(p,30,"poison"),bump(p,T(ctx),-50,"enemy","enemy"),A.willGrow(p,2,"fear")),""),
          },
          {
            t: "Bring your own taster",
            req: p=>p.coin>=10,
            r: "A grey little man who drinks from your cup with a face like a priest. Expensive, insulting, and alive.",
            fx: {coin:-10,them:{op:-5}},
          },
        ],
      },
      {
        id: "lf_gent_tenant",
        cond: p=>C.adult(p)&&["gentry","noble"].includes(p.status)&&!C.ruler(p),
        cool: 7,
        title: "A tenant at the gate",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{status:"peasant",ageAdj:C.ageAdj(p)+A.ri(-5,20)}));ctx.plea=A.pick(["the rent cannot be paid after the hail",'the steward has been taking a "fee" on top of the rent',"a son was taken by the levy and the farm cannot be worked","the mill has been charging double"])},
        text: "{themFull}, one of your tenants, is at the gate with {theirHis} cap in both hands. {them} says {plea}. Your steward stands behind you with a look that says not to believe a word.",
        choices: [
          {
            t: "Look into it yourself",
            check: {s:"stewardship",s2:"int",d:40},
            win: {
              r: "You ride out, look at the fields, look at the books. The tenant was telling the truth, and your steward was not. You have learned something about your own house.",
              fx: {them:{type:"acquaint",op:30,back:"acquaint"},honor:4,skill:{stewardship:3},fame:1},
            },
            lose: {r:"The books are a maze. You cannot tell who is lying.",fx:{skill:{stewardship:1}}},
          },
          {
            t: "Forgive the rent this year",
            r: "The tenant weeps on your boots. The tale goes round your lands. Your rents fall this year; your name rises.",
            fx: p=>{pay(p,2*purse(p)),hon(p,5),A.fame(p,1)},
          },
          {
            t: "Trust your steward",
            r: "The tenant is turned away. You never find out the truth. Your steward does well this year.",
            fx: {coin:10,honor:-2},
          },
        ],
      },
      {
        id: "lf_gent_precedence",
        cond: p=>C.adult(p)&&high(p)&&!C.ruler(p),
        cool: 8,
        title: "Below the salt",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{status:p.status,ageAdj:C.ageAdj(p)+A.ri(-5,10)}));x.occ=A.pick(["a newly made knight","a rich merchant just ennobled","a cousin from a junior branch"])},
        text: "At the feast the steward seats {themFull}, {themOcc}, above you at the high table. By every rule of precedence your place is higher. The whole hall noticed.",
        choices: [
          {
            t: "Take it up with the steward, quietly",
            check: {s:"etiquette",s2:"diplomacy",d:40},
            win: {
              r: "A word, a cited precedent, a bow. Places are changed before the second course. Nobody can say you made a scene.",
              fx: {honor:3,skill:{etiquette:2},them:{type:"rival",op:-10,back:"rival"}},
            },
            lose: {
              r: "The steward says the lord himself made the seating. You must swallow it.",
              fx: {honor:-2,happy:-4},
            },
          },
          {
            t: "Make a scene",
            check: {s:"intimidation",s2:"wil",d:45},
            win: {
              r: "The hall watches as {them} gives up the seat. You have your place, and a reputation for pride.",
              fx: {honor:2,fame:1,them:{type:"enemy",op:-30,back:"enemy"},trait:"proud"},
            },
            lose: {
              r: "The lord himself tells you to sit down. You do. The hall will remember it for years.",
              fx: {honor:-6,favor:-4,happy:-6},
            },
          },
          {
            t: "Laugh it off and enjoy the food",
            r: "You sit where you are put and charm everyone around you. By the end of the night, the low end of the table is the merry end.",
            fx: {happy:4,them:{op:5},skill:{diplomacy:1}},
          },
        ],
      },
      {
        id: "lf_noble_poor_relation",
        cond: p=>C.adult(p)&&C.noble(p),
        cool: 10,
        title: "The poor relation",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{status:"gentry",ageAdj:C.ageAdj(p)+A.ri(-10,10)}));x.occ="a cousin of a poorer branch"},
        text: "Your cousin {themFull} has arrived with two thin horses, a patched cloak and a great deal of family pride. {theyHe} needs a place in your household, and cannot quite bring {themHim}self to ask.",
        choices: [
          {
            t: "Find {themHim} a post worthy of the name",
            r: "Master of your horse, or keeper of your hall. {them} serves you with fierce loyalty for the rest of {theirHis} life.",
            fx: (p,ctx)=>{bump(p,T(ctx),35,"councillor","lord"),pay(p,20),hon(p,2)},
          },
          {
            t: "Give {themHim} money to go away",
            r: "A purse and a smile. {them} takes it and goes, and tells everyone what kind of kin you are.",
            fx: (p,ctx)=>{pay(p,15),bump(p,T(ctx),-20,"rival","rival")},
          },
          {
            t: "Test {theirHis} mettle first",
            check: {s:"int",s2:"etiquette",d:37},
            win: {
              r: "Under the patched cloak is a sharp mind and a good sword arm. You have found a treasure in your own family.",
              fx: (p,ctx)=>{bump(p,T(ctx),30,"councillor","lord"),A.trainSkill(p,"command",1)},
            },
            lose: {
              r: "{them} is proud and lazy in equal parts. You find {themHim} a small post far away.",
              fx: {coin:-8},
            },
          },
        ],
      },
      {
        id: "lf_noble_steward_theft",
        cond: p=>C.adult(p)&&(C.noble(p)||p.status==="gentry"&&p.coin>200),
        cool: 10,
        title: "The steward's new cloak",
        setup: (p,ctx)=>{const x=setPid(p,ctx,mk(p,{status:"gentry",ageAdj:C.ageAdj(p)+10}));x.occ="your steward",ctx.v=8*purse(p)},
        text: "Your steward {themFull} has a new fur cloak, a new horse and a daughter with a very large dowry. Your rents, oddly, have fallen three years running.",
        choices: [
          {
            t: "Audit the books yourself",
            check: {s:"stewardship",s2:"learning",d:45},
            win: {
              r: "It takes a month of candles. You find it all: false tallies, ghost tenants, a second mill. {them} pays back what {theyHe} can and leaves your service in disgrace.",
              fx: (p,ctx)=>(p.coin+=ctx.v,bump(p,T(ctx),-50,"enemy","enemy"),A.trainSkill(p,"stewardship",3),`(+${ctx.v} suns recovered.)`),
            },
            lose: {
              r: "The books are cleverly done. You cannot prove it. {them} smiles at you over the accounts.",
              fx: {wil:.8,coin:-5},
            },
          },
          {
            t: "Have {themHim} watched",
            check: {s:"intrigue",s2:"int",d:41},
            win: {
              r: "A groom sees {themHim} meet a grain-buyer at night. That is enough. {them} is gone by the quarter-day.",
              fx: (p,ctx)=>{p.coin+=Math.round(ctx.v/2),bump(p,T(ctx),-40,"enemy","enemy"),A.trainSkill(p,"intrigue",2)},
            },
            lose: {
              r: "Your watcher is bought by the steward. Now {them} knows you suspect.",
              fx: {them:{type:"enemy",op:-20,back:"enemy"},coin:-5},
            },
          },
          {
            t: "Ignore it: good stewards are hard to find",
            r: "Every steward takes a little. This one takes a lot, but the estate runs.",
            fx: (p,ctx)=>{pay(p,Math.round(ctx.v/3))},
          },
        ],
      },
    ]);
    for(const e of EV){if(!e.setup)continue;const s0=e.setup;e.setup=(p,ctx)=>{s0(p,ctx);const tok=A.ctxTokens(p,ctx);for(const k in ctx)typeof ctx[k]=="string"&&ctx[k].indexOf("{")>=0&&(ctx[k]=A.T(ctx[k],tok))}}
    A.defEvents(EV);
  })();
})();
