// The release's event pack 23 of 30 (47 events, mostly bd_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-027). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const rel = (p,types,f)=>A.relsOf(p,types).filter(x=>x.p.alive&&(!f||f(x))),
      pickRel = (p,ctx,types,f)=>{const l=rel(p,types,f),x=l.length?A.pick(l):null;return ctx.pid=x?x.p.id:null,x},
      hasR = (p,types,f)=>rel(p,types,f).length>0,
      boss = (p,ctx)=>{const b=A.superior(p);ctx.pid=b?b.id:null},
      work = p=>p.mil?"the drill yard":"the workshop",
      sworn = p=>A.relsOf(p).filter(x=>x.r.sworn&&x.p.alive);
    A.defEvents([
      {
        id: "bd_boss_test",
        trigger: !0,
        needsPid: !0,
        title: "A test",
        text: p=>p.mil?`{bossTitle} {boss} hands you a task nobody wants: ${A.pick(["take ten men and hold the ford until dawn","find out who is stealing from the stores","march the new recruits forty miles in two days","deliver a message through country full of enemy scouts"])}. "Let us see what you are," {theyHe} says.`:`{bossTitle} {boss} gives you a job ${A.pick(["the best journeyman failed at last year","for the most demanding client in town","with half the time it needs","with materials you have never worked"])}. "Do this well and we will talk about your future."`,
        choices: [
          {
            t: "Throw everything you have at it",
            check: {s:"wil",s2:"sta",d:45},
            win: {
              r: "It is done, and done well. {boss} says nothing — then gives you the next hard job too. That is praise.",
              fx: {bossOp:12,merit:6,perf:8,wil:.5},
            },
            lose: {r:"You give everything and it is not enough. {boss} saw the effort, at least.",fx:{bossOp:2,wil:1}},
          },
          {
            t: "Do it the clever way",
            check: {s:"int",s2:"tactics",d:50},
            win: {
              r: "Your shortcut works. {boss} narrows {theirHis} eyes, then nods slowly.",
              fx: {bossOp:10,merit:5,perf:6,int:.5},
            },
            lose: {r:"The shortcut fails, and now you look lazy as well as wrong.",fx:{bossOp:-8}},
          },
          {
            t: "Ask for help from your comrades",
            check: {s:"persuasion",s2:"command",d:40},
            win: {r:"Together you manage. {boss} notes you can lead.",fx:{bossOp:6,skill:{command:2},merit:3}},
            lose: {r:"Nobody wants to share your trouble.",fx:{bossOp:-3}},
          },
        ],
      },
      {
        id: "bd_boss_favor",
        trigger: !0,
        needsPid: !0,
        title: "A personal favor",
        text: p=>`{bossTitle} {boss} takes you aside. ${A.pick(["A debt of {theirHis} must be paid quietly, and {theyHe} cannot be seen doing it.","A letter must reach a woman in town without {theirHis} wife knowing.",'Some supplies must "go missing" from the ledger.',"{theirHis} nephew needs a job, and you are to make room."])} "You understand me," {theyHe} says. It is not a question.`,
        choices: [
          {
            t: "Do it, no questions",
            r: "It is done. {boss} owes you now, and you both know it.",
            fx: {bossOp:15,owed:1,honor:-2},
          },
          {
            t: "Do it, but make sure you have proof of what you did",
            check: {s:"intrigue",s2:"int",d:45},
            win: {
              r: "You keep a copy of everything. {boss} owes you, and can never forget it.",
              fx: {bossOp:10,owed:1,skill:{intrigue:2}},
            },
            lose: {r:"{boss} notices you keeping notes. A chill.",fx:{bossOp:-6}},
          },
          {
            t: "Refuse politely",
            r: '{boss} smiles thinly. "Of course." You will pay for that, slowly.',
            fx: {bossOp:-12,honor:3},
          },
        ],
      },
      {
        id: "bd_boss_blame",
        trigger: !0,
        needsPid: !0,
        title: "The blame",
        text: p=>p.mil?"A patrol was ambushed and three men are dead. {bossTitle} {boss} reports to the high command that it was your scouting that failed. It was not.":"A big order went wrong and the client is furious. {bossTitle} {boss} tells the client it was your work. It was not.",
        choices: [
          {
            t: "Take the blame quietly",
            r: "You eat it. {boss} knows what you did for {themHim}.",
            fx: {bossOp:14,merit:-6,perf:-6,owed:1,wil:1},
          },
          {
            t: "Prove the truth",
            check: {s:"learning",s2:"persuasion",d:50},
            win: {
              r: "The truth comes out. You are cleared; {boss} is embarrassed and will not forgive you.",
              fx: {bossOp:-20,merit:5,perf:5,fame:1},
            },
            lose: {r:"Nobody believes you. Now you are a liar too.",fx:{bossOp:-12,merit:-8,perf:-8}},
          },
          {
            t: "Go over {theirHis} head",
            check: {s:"diplomacy",s2:"intrigue",d:55},
            win: {
              r: "The higher-ups listen. {boss} is quietly moved aside. Someone new will lead you.",
              fx: (p,ctx)=>{const b=A.P(ctx.pid);return b&&p.rel[b.id]&&(p.rel[b.id].type="enemy",p.rel[b.id].op=-40),p.mil?(p.mil.cmdr=null,p.mil.merit+=6):p.job&&(p.job.boss=null,p.job.perf=Math.min(100,p.job.perf+6)),"(You have a new enemy.)"},
            },
            lose: {r:"They close ranks. You are the troublemaker now.",fx:{bossOp:-25,merit:-6,perf:-6}},
          },
        ],
      },
      {
        id: "bd_boss_rival",
        trigger: !0,
        needsPid: !0,
        title: "A rival for favor",
        setup: (p,ctx)=>{const r=A.makeAcquaintance(p,"rival");ctx.rival=r.given,ctx.rivalId=r.id},
        text: "{rival}, new and polished, has become {boss}'s favorite overnight. Laughs at the right jokes. Takes credit at the right moments. Your work starts going to {rival}.",
        choices: [
          {
            t: "Outwork {rival}",
            check: {s:"sta",s2:"wil",d:50},
            win: {
              r: "Hard work is loud if you keep at it. {boss} notices who stays late.",
              fx: (p,ctx)=>{const r=A.P(ctx.rivalId);r&&A.link(p,r,"rival",-20,"rival"),A.applyFx(p,{bossOp:10,merit:4,perf:6},ctx)},
            },
            lose: {
              r: "{rival} is better at being seen than you are at working.",
              fx: (p,ctx)=>{const r=A.P(ctx.rivalId);r&&A.link(p,r,"rival",-25,"rival"),A.applyFx(p,{bossOp:-4},ctx)},
            },
          },
          {
            t: "Make {rival} a friend instead",
            check: {s:"persuasion",s2:"etiquette",d:45},
            win: {
              r: "Two favorites are better than one. You rise together.",
              fx: (p,ctx)=>{const r=A.P(ctx.rivalId);r&&A.link(p,r,"friend",35,"friend"),A.applyFx(p,{bossOp:4},ctx)},
            },
            lose: {
              r: "{rival} smiles and keeps climbing over you.",
              fx: (p,ctx)=>{const r=A.P(ctx.rivalId);r&&A.link(p,r,"rival",-15,"rival")},
            },
          },
          {
            t: "Dig up dirt on {rival}",
            check: {s:"intrigue",s2:"deception",d:50},
            win: {
              r: "{rival} lied about a past post. {boss} hates liars. Goodbye, {rival}.",
              fx: (p,ctx)=>{const r=A.P(ctx.rivalId);r&&A.link(p,r,"enemy",-50,"enemy"),A.applyFx(p,{bossOp:6,honor:-2},ctx)},
            },
            lose: {
              r: "Caught digging. {boss} likes snoops even less than liars.",
              fx: (p,ctx)=>{const r=A.P(ctx.rivalId);r&&A.link(p,r,"enemy",-40,"enemy"),A.applyFx(p,{bossOp:-12},ctx)},
            },
          },
        ],
      },
      {
        id: "bd_enemy_strikes",
        trigger: !0,
        needsPid: !0,
        title: "Your enemy moves",
        text: p=>`{them} has been busy. ${A.pick(["A rumor is going round that you cheat your clients and beat your servants.","Someone has fouled your well and cut your fences.","A lawsuit lands at your door: an old debt, invented but well-documented.","Your name has been whispered to your lord as a troublemaker.","Three hired toughs are waiting outside the tavern you drink in."])} Everyone knows who is behind it.`,
        choices: [
          {
            t: "Confront {themHim} face to face",
            check: {s:"intimidation",s2:"wil",d:50},
            win: {r:"{them} backs down in front of witnesses. For now.",fx:{them:{op:10},fame:1,honor:2}},
            lose: {r:"{them} laughs in your face. Witnesses laugh too.",fx:{them:{op:-10},fame:-1,happy:-3}},
          },
          {
            t: "Answer in kind",
            check: {s:"intrigue",s2:"deception",d:50},
            win: {
              r: "You give as good as you got. {them} spends a bad year cleaning up.",
              fx: {them:{op:-10},skill:{intrigue:2},honor:-2},
            },
            lose: {r:"Your counter-move backfires. Now people believe the rumors.",fx:{fame:-2,honor:-3}},
          },
          {
            t: "Fight {themHim} openly",
            r: "There is only one way to end this.",
            fx: {
              duel: {
                foe: "them",
                tier: 2,
                opts: {kind:"duel",place:"the square at dusk",lethal:!1,toYield:!0,title:"Settling it"},
              },
            },
          },
          {
            t: "Rise above it — let your work speak",
            r: "You ignore it. It hurts, then fades. You grow harder to wound.",
            fx: {wil:1.5,happy:-2},
          },
        ],
      },
      {
        id: "bd_rival_scheme",
        trigger: !0,
        needsPid: !0,
        title: "A rival's scheme",
        text: p=>`A friend warns you: {them} is ${A.pick(["courting your best client","telling your superior you plan to leave","trying to buy the house you have saved for","spreading the story of your worst day","entering the same contest you have trained all year for"])}.`,
        choices: [
          {
            t: "Beat {themHim} to it",
            check: {s:"spd",s2:"int",d:45},
            win: {r:"You move first. {them} arrives to find it done.",fx:{them:{op:-8},coin:20,happy:3}},
            lose: {r:"{them} was faster.",fx:{them:{op:-5},happy:-4}},
          },
          {
            t: "Go and talk to {themHim} — maybe this can end",
            check: {s:"diplomacy",s2:"persuasion",d:50},
            win: {
              r: "An awkward drink, then a real one. Rivals who respect each other.",
              fx: {them:{type:"friend",op:40},happy:4},
            },
            lose: {r:"{them} takes your offer as weakness.",fx:{them:{op:-10}}},
          },
          {t:"Let {themHim} have this one",r:"Some fights are not worth the blood.",fx:{wil:.5}},
        ],
      },
    ]);
    A.defEvents([
      {
        id: "bd_sup_favorite",
        cond: (p,C)=>C.adult(p)&&C.superior(p),
        w: 1,
        cool: 5,
        title: "Favorites",
        setup: boss,
        text: p=>`{bossTitle} {boss} plays favorites, and you are not one of them. The easy posts and the praise go to ${A.pick(["a cousin of {theirHis}","a smooth talker from the capital","whoever brings the best wine"])}.`,
        choices: [
          {
            t: "Earn it the hard way",
            check: {s:"wil",s2:"sta",d:45},
            win: {r:"A year of doing more than anyone. {boss} finally sees it.",fx:{bossOp:12,merit:4,perf:5}},
            lose: {r:"A year of doing more than anyone, and nobody noticed. You are tougher, at least.",fx:{wil:1.5}},
          },
          {
            t: "Learn what {boss} likes and give it",
            check: {s:"persuasion",s2:"etiquette",d:40},
            win: {r:"Hunting talk, a good hound, a well-timed laugh. You are in.",fx:{bossOp:15,honor:-1}},
            lose: {r:"{boss} sees through the flattery.",fx:{bossOp:-5}},
          },
          {
            t: "Ask for a transfer",
            r: "You put in for another post. It may come, it may not. {boss} is not pleased.",
            fx: p=>(p.mil?p.mil.cmdr=null:p.job&&(p.job.boss=null),"(A new superior will be appointed.)"),
          },
        ],
      },
      {
        id: "bd_sup_stolen_credit",
        cond: (p,C)=>C.adult(p)&&C.superior(p)&&!C.soldier(p),
        w: 1,
        cool: 6,
        title: "Your design, his name",
        setup: boss,
        text: p=>`The ${A.pick(["new lock","clever joint","better recipe","faster ledger","cure for the rot"])} you worked out over the winter is being praised all over town — as {boss}'s idea.`,
        choices: [
          {
            t: "Say nothing; {theyHe} owes you",
            r: "You keep quiet. {boss} knows. {theyHe} will pay it back — probably.",
            fx: {bossOp:12,owed:1},
          },
          {
            t: "Make your next work so good nobody can doubt whose it is",
            check: {s:"craft",s2:"int",d:50},
            win: {r:"Clients start asking for YOU by name.",fx:{rep:6,perf:6,fame:1}},
            lose: {r:"Good work, but {boss} takes that too.",fx:{wil:1}},
          },
          {
            t: "Tell the guild",
            check: {s:"persuasion",s2:"learning",d:50},
            win: {r:"The guild believes your sketches. {boss} is fined and furious.",fx:{rep:8,bossOp:-25}},
            lose: {r:"Your word against a master's. You lose.",fx:{rep:-4,bossOp:-20}},
          },
        ],
      },
      {
        id: "bd_sup_drunk",
        cond: (p,C)=>C.adult(p)&&C.superior(p),
        w: .8,
        cool: 7,
        title: "The bottle",
        setup: boss,
        text: p=>`{boss} drinks. Everyone knows. Today {theyHe} is too drunk to stand, and ${p.mil?"the inspection is in an hour":"the guild master is coming to see the work"}.`,
        choices: [
          {
            t: "Cover for {themHim}",
            check: {s:"deception",s2:"command",d:40},
            win: {
              r: "You run the whole thing yourself and say {boss} is ill. It goes well. {theyHe} is grateful, and ashamed.",
              fx: {bossOp:18,owed:1,skill:{command:2}},
            },
            lose: {r:"The inspector smells the wine. You both get the blame.",fx:{bossOp:5,merit:-4,perf:-4}},
          },
          {
            t: "Sober {themHim} up fast",
            check: {s:"medicine",s2:"str",d:40},
            win: {r:"Cold water, salt, a walk. {boss} gets through it, barely.",fx:{bossOp:10}},
            lose: {r:"It does not work. Disaster.",fx:{bossOp:3}},
          },
          {
            t: "Let {themHim} be found",
            r: "The truth comes out. {boss} is disgraced. You are not blamed, but not trusted either.",
            fx: {bossOp:-20,honor:1},
          },
        ],
      },
      {
        id: "bd_sup_unjust_order",
        cond: (p,C)=>C.adult(p)&&C.superior(p)&&C.soldier(p),
        w: .8,
        cool: 8,
        title: "An order you cannot obey",
        setup: boss,
        text: p=>`{bossTitle} {boss} orders you to ${A.pick(["burn a village that sheltered enemy scouts","hang a deserter who is barely sixteen","take the grain of a farm with six children","leave the wounded behind to move faster"])}.`,
        choices: [
          {
            t: "Obey",
            r: "You do it. You will see it at night for years.",
            fx: {bossOp:8,merit:3,honor:-6,happy:-6},
          },
          {
            t: "Refuse to {themHim} face",
            check: {s:"wil",s2:"persuasion",d:50},
            win: {
              r: "{boss} stares, then rescinds the order. Your men look at you differently now.",
              fx: {bossOp:-6,honor:6,fame:2},
            },
            lose: {
              r: "{boss} has you flogged and does it anyway.",
              fx: {bossOp:-15,health:-15,cause:"a flogging",honor:4,wil:2},
            },
          },
          {
            t: "Obey, but slowly and badly",
            check: {s:"deception",s2:"int",d:45},
            win: {r:'By the time you "finish", the danger has passed and the people are gone.',fx:{honor:3}},
            lose: {r:"{boss} sees exactly what you did.",fx:{bossOp:-12,merit:-4}},
          },
        ],
      },
      {
        id: "bd_sup_last_message",
        cond: (p,C)=>C.adult(p)&&C.superior(p)&&C.atWar(p)&&C.soldier(p),
        w: .6,
        once: !0,
        title: "The last message",
        setup: boss,
        text: '{bossTitle} {boss} is dying of a wound, in a tent that smells of blood and vinegar. {theyHe} presses a sealed letter into your hand. "For my family. And — tell them I was not afraid."',
        choices: [
          {
            t: "Promise, and keep it",
            r: "You ride three days to deliver it. The family takes you in like a son.",
            fx: (p,ctx)=>{const b=A.P(ctx.pid);b&&A.kill(b,"a battle wound"),p.honor=Math.min(100,p.honor+6),A.willGrow(p,1.5,"grief");const f=A.makeAcquaintance(p,"friend");return A.link(p,f,"friend",50,"friend"),A.addFavor(p,f.id,1),`${f.given}, of the dead man's family, swears to repay your kindness.`},
          },
          {
            t: "Promise — then read the letter first",
            r: "It is a list of debts and an apology to a woman not his wife. You deliver it anyway.",
            fx: (p,ctx)=>{const b=A.P(ctx.pid);b&&A.kill(b,"a battle wound"),A.willGrow(p,1,"grief"),p.honor=Math.max(0,p.honor-2)},
          },
        ],
      },
      {
        id: "bd_sup_recommend",
        cond: (p,C)=>C.adult(p)&&C.superior(p),
        w: .7,
        cool: 6,
        title: "A word in the right ear",
        setup: boss,
        text: p=>`{bossTitle} {boss} calls you in. "You have done well. There is ${p.mil?"a post in the royal guard":"a better position in the capital"} — I could write for you. Or I could keep you here, where I need you."`,
        choices: [
          {
            t: "Ask for the letter",
            r: '{boss} writes it with a sigh. "Go and be great, then."',
            fx: {letter:!0,bossOp:-3},
          },
          {
            t: "Stay — loyalty matters",
            r: "{boss} grips your shoulder. You have a protector for life.",
            fx: {bossOp:20,owed:1},
          },
        ],
      },
      {
        id: "bd_sup_child",
        cond: (p,C)=>C.adult(p)&&C.superior(p)&&C.young(p)===!1&&!C.married(p),
        w: .6,
        cool: 10,
        title: "The superior's child",
        setup: (p,ctx)=>{boss(p,ctx);const k=A.makeLoveInterest(p);ctx.kid=k.given,ctx.kidId=k.id},
        text: "{boss}'s {kid} has started appearing wherever you are. Bringing water. Asking questions. Laughing at your jokes. {boss} has noticed too.",
        choices: [
          {
            t: "Court {kid} openly, and ask {boss}'s blessing",
            check: {s:"persuasion",s2:"etiquette",d:50},
            win: {
              r: "{boss} grunts, then pours two cups. You are courting {kid} now.",
              fx: (p,ctx)=>{const k=A.P(ctx.kidId);k&&A.link(p,k,"lover",45,"lover"),A.applyFx(p,{bossOp:10},ctx)},
            },
            lose: {r:"{boss} says no, and means it.",fx:{bossOp:-8,happy:-4}},
          },
          {
            t: "Meet {kid} in secret",
            check: {s:"stealth",s2:"deception",d:45},
            win: {
              r: "Stolen hours. Nobody knows. Yet.",
              fx: (p,ctx)=>{const k=A.P(ctx.kidId);k&&A.link(p,k,"lover",50,"lover")},
            },
            lose: {r:"{boss} finds out. It is bad.",fx:{bossOp:-25}},
          },
          {t:"Keep your distance",r:"Wise, maybe. {kid} stops bringing water.",fx:{}},
        ],
      },
    ]);
    A.defEvents([
      {
        id: "bd_favor_returned",
        cond: (p,C)=>C.adult(p)&&C.favors(p)>0,
        w: 1,
        cool: 5,
        title: "A favor returned unasked",
        setup: (p,ctx)=>{const ks=Object.keys(p.favors||{}).filter(k=>A.P(k)&&A.P(k).alive);ctx.pid=ks.length?A.pick(ks):null,ctx.pid||(ctx.pid=A.makeAcquaintance(p,"friend").id)},
        text: p=>`{them} turns up at your door with ${A.pick(["a purse","news you badly needed","a horse you could not afford","a word about a job nobody else has heard of"])}. "I told you I would not forget."`,
        choices: [
          {
            t: "Accept it gratefully",
            r: "Debts paid in kind are the best kind. You are square.",
            fx: (p,ctx)=>{A.addFavor(p,ctx.pid,-1),p.coin+=A.ri(30,120),A.addOp(p,A.P(ctx.pid),8)},
          },
          {
            t: "Tell {themHim} to keep it — you are friends",
            r: "{them} looks at you a long time. You are more than square now.",
            fx: {them:{type:"friend",op:20}},
          },
        ],
      },
      {
        id: "bd_favor_asked",
        cond: (p,C)=>C.adult(p)&&C.hasRel(p,"friend","bestfriend","comrade","cousin","sibling"),
        w: 1.1,
        cool: 4,
        title: "Can you help?",
        setup: (p,ctx)=>pickRel(p,ctx,["friend","bestfriend","comrade","cousin","sibling"]),
        text: p=>`{them} needs help: ${A.pick(["a loan until the harvest","a place to sleep for a month","someone to speak for {themHim} before the magistrate","a hand moving a whole household across the river","a sword at {theirHis} side when {theyHe} goes to collect a debt"])}.`,
        choices: [
          {
            t: "Help, whatever it costs",
            r: "It costs you. {them} will remember.",
            fx: {coin:-25,owed:1,them:{op:12}},
          },
          {
            t: "Help a little",
            r: "Something is better than nothing. {them} thanks you.",
            fx: {coin:-5,them:{op:4}},
          },
          {t:"Say no",r:'{them} nods slowly. "I see."',fx:{them:{op:-15}}},
        ],
      },
      {
        id: "bd_favor_worst_time",
        cond: (p,C)=>C.adult(p)&&C.owes(p),
        w: 1,
        cool: 5,
        title: "The worst moment",
        setup: (p,ctx)=>{const ks=Object.keys(p.owes||{}).filter(k=>A.P(k)&&A.P(k).alive);ctx.pid=ks.length?A.pick(ks):A.makeAcquaintance(p,"friend").id},
        text: p=>`You owe {them}, and {theyHe} picks today to collect: ${A.pick(["the day of your own wedding feast","the morning you were to leave on a long journey","the week your purse is emptiest","the very hour your superior wants you"])}.`,
        choices: [
          {
            t: "Pay the debt anyway",
            r: "Your own plans suffer. Your word does not.",
            fx: (p,ctx)=>{A.addOwe(p,ctx.pid,-1),p.honor=Math.min(100,p.honor+3),p.happy=Math.max(0,p.happy-4),A.addOp(p,A.P(ctx.pid),10)},
          },
          {
            t: "Ask {themHim} to wait",
            check: {s:"persuasion",s2:"diplomacy",d:45},
            win: {r:'{them} sighs. "A month. Not a day more."',fx:{them:{op:-2}}},
            lose: {
              r: "{them} walks off. The whole town will know you welched.",
              fx: (p,ctx)=>{A.addOwe(p,ctx.pid,-1),A.addOp(p,A.P(ctx.pid),-25),p.honor=Math.max(0,p.honor-5)},
            },
          },
        ],
      },
      {
        id: "bd_sworn_trouble",
        cond: (p,C)=>C.adult(p)&&C.sworn(p),
        w: 1.2,
        cool: 4,
        title: "Your sworn sibling needs you",
        setup: (p,ctx)=>{const s=A.pick(sworn(p));ctx.pid=s.p.id},
        text: p=>`A rider brings word: {them}, your sworn sibling, is ${A.pick(["in a debtors' prison in the next town","besieged by a feud of three brothers","sick with fever and no one to tend {themHim}","accused of a theft {theyHe} did not do"])}. The oath you swore did not say "when it is convenient".`,
        choices: [
          {
            t: "Drop everything and ride",
            check: {s:"riding",s2:"sta",d:40},
            win: {
              r: "You arrive in time. Together you set it right. Blood-oaths are made of days like this.",
              fx: {them:{op:15},owed:1,honor:4,coin:-30},
            },
            lose: {
              r: "You arrive late, but you arrive. {them} will never forget you came.",
              fx: {them:{op:10},honor:3,coin:-20},
            },
          },
          {
            t: "Send money and a letter",
            r: "It helps. It is not the same as being there.",
            fx: {coin:-40,them:{op:3}},
          },
          {
            t: "You cannot go — not now",
            r: "You break the oath a little. Both of you feel it.",
            fx: {them:{op:-30},honor:-8},
          },
        ],
      },
      {
        id: "bd_letter_door",
        cond: (p,C)=>C.adult(p)&&C.letter(p),
        w: .8,
        cool: 6,
        title: "The letter opens a door",
        text: p=>`A ${A.pick(["guild master","castellan","abbot","banker","magistrate"])} reads your letter of recommendation, then reads it again. "You know {from}? Well. Come to supper on Sunday."`,
        setup: (p,ctx)=>{ctx.from=p.letters&&p.letters[0]&&p.letters[0].from||"my old master"},
        choices: [
          {
            t: "Go to supper and make the most of it",
            check: {s:"etiquette",s2:"persuasion",d:40},
            win: {
              r: "A new patron. Doors open that you did not know were there.",
              fx: {newRel:{type:"patron",op:35,back:"protege"},fame:2},
            },
            lose: {r:"A pleasant supper. Nothing more.",fx:{happy:2}},
          },
          {t:"Keep the letter for something bigger",r:"You thank them politely and save the letter.",fx:{}},
        ],
      },
      {
        id: "bd_swear_offer",
        cond: (p,C)=>C.adult(p)&&!C.sworn(p)&&C.hasRel(p,"bestfriend","friend","comrade"),
        w: .7,
        cool: 8,
        title: "Blood and salt",
        setup: (p,ctx)=>{const x=pickRel(p,ctx,["bestfriend","friend","comrade"],y=>y.r.op>=50)||pickRel(p,ctx,["bestfriend","friend","comrade"])},
        text: 'Late at night, by a dying fire, {them} pulls out a knife and a pinch of salt. "We have been through enough. Swear with me. Brothers — no, more than brothers. Sworn."',
        choices: [
          {
            t: "Cut your palm and swear",
            r: "Blood and salt. You are sworn: {theirHis} enemies are yours, yours are {theirHis}.",
            fx: {them:{op:25},sworn:!0,owed:1},
          },
          {
            t: "Not yet — but you love {themHim} for asking",
            r: '{them} laughs, a little hurt. "Next year, then."',
            fx: {them:{op:5}},
          },
        ],
      },
      {
        id: "bd_patron_expect",
        cond: (p,C)=>C.adult(p)&&C.hasRel(p,"patron"),
        w: 1,
        cool: 5,
        title: "What patrons want",
        setup: (p,ctx)=>pickRel(p,ctx,["patron"]),
        text: p=>`Your patron {them} has been generous. Now {theyHe} wants something back: ${A.pick(["your vote in the guild","your presence at a feast with {theirHis} enemies","a quiet word against a rival","your eldest to serve in {theirHis} household"])}.`,
        choices: [
          {t:"Give it",r:"Patronage is a two-way road. {them} is pleased.",fx:{them:{op:15},coin:30,honor:-1}},
          {
            t: "Negotiate something smaller",
            check: {s:"diplomacy",s2:"persuasion",d:45},
            win: {r:"A smaller favor, a happy patron.",fx:{them:{op:6}}},
            lose: {r:"{them} is not used to bargaining with protégés.",fx:{them:{op:-10}}},
          },
          {
            t: "Refuse — you are no one's creature",
            r: "{them} withdraws {theirHis} favor. Freedom has a price.",
            fx: {them:{type:"acquaint",op:-20},honor:3},
          },
        ],
      },
    ]);
    A.defEvents([
      {
        id: "bd_drift",
        cond: (p,C)=>C.adult(p)&&C.hasRel(p,"friend","bestfriend"),
        w: 1,
        cool: 6,
        title: "Drifting apart",
        setup: (p,ctx)=>pickRel(p,ctx,["friend","bestfriend"]),
        text: p=>`You realize you have not really talked to {them} in a year. ${A.pick(["{theyHe} has new friends.","Your lives went different ways.","Something small was said and never fixed.","You were busy. So was {theyHe}."])}`,
        choices: [
          {
            t: "Go and find {themHim}",
            r: "An awkward hour, then a good evening. Old friends are hard to make new.",
            fx: {them:{op:15},happy:4},
          },
          {
            t: "Write a long letter",
            check: {s:"learning",s2:"persuasion",d:30},
            win: {r:"{theyHe} writes back four pages. You are friends again.",fx:{them:{op:12}}},
            lose: {r:"No answer. Maybe the letter got lost. Maybe not.",fx:{them:{op:-2},happy:-2}},
          },
          {
            t: "Let it go — people change",
            r: "Some friendships are for a season. This one was.",
            fx: {them:{type:"acquaint",op:-5},wil:.3},
          },
        ],
      },
      {
        id: "bd_friend_wedding",
        cond: (p,C)=>C.adult(p)&&C.hasRel(p,"friend","bestfriend","comrade"),
        w: .9,
        cool: 5,
        title: "A friend's wedding",
        setup: (p,ctx)=>pickRel(p,ctx,["friend","bestfriend","comrade"],x=>!x.p.spouse),
        text: "{them} is getting married and asks you to stand beside {themHim} at the temple. There will be a speech. You are expected to give it.",
        choices: [
          {
            t: "Give a speech that makes the hall cry",
            check: {s:"persuasion",s2:"music",d:40},
            win: {
              r: "Tears, then laughter, then a roar. {them} hugs you so hard your ribs hurt.",
              fx: {them:{op:20},fame:1,happy:5},
            },
            lose: {r:"You tell the story about the goat. Nobody else thinks it is funny.",fx:{them:{op:4},happy:-2}},
          },
          {
            t: "Keep it short and true",
            r: "Four sentences. The right four. {them} squeezes your hand.",
            fx: {them:{op:12}},
          },
          {
            t: "Bring a gift worth remembering",
            req: p=>p.coin>=40,
            r: "They will use it for thirty years and think of you.",
            fx: {coin:-40,them:{op:18}},
          },
        ],
      },
      {
        id: "bd_friend_debt",
        cond: (p,C)=>C.adult(p)&&C.hasRel(p,"friend","bestfriend"),
        w: .9,
        cool: 6,
        title: "A friend drowning in debt",
        setup: (p,ctx)=>pickRel(p,ctx,["friend","bestfriend"]),
        text: p=>`{them} owes ${A.coin(A.ri(60,200))} to a man who breaks fingers. {theyHe} has not asked you for anything. {theyHe} is too proud. But you see it in {theirHis} face.`,
        choices: [
          {
            t: "Pay the debt quietly",
            req: p=>p.coin>=60,
            r: "The man with the hammer finds his debt paid by a stranger. {them} finds out anyway.",
            fx: {coin:-60,them:{op:25},owed:1},
          },
          {
            t: "Go with {themHim} to face the lender",
            check: {s:"intimidation",s2:"trade",d:45},
            win: {r:"You talk the lender into a fair schedule. Nobody loses a finger.",fx:{them:{op:15},owed:1}},
            lose: {
              r: "The lender does not like being talked at.",
              fx: {them:{op:8},health:-8,cause:"a debt collector's fists"},
            },
          },
          {
            t: "Stay out of it",
            r: "{them} loses two fingers and keeps {theirHis} pride. You keep your coin.",
            fx: {them:{op:-8}},
          },
        ],
      },
      {
        id: "bd_betrayal",
        cond: (p,C)=>C.adult(p)&&C.hasRel(p,"friend","bestfriend"),
        w: .6,
        cool: 12,
        title: "Betrayed",
        setup: (p,ctx)=>pickRel(p,ctx,["friend","bestfriend"]),
        text: p=>`You learn that {them} ${A.pick(["sold your secret to a rival","took the job you were promised, behind your back","has been laughing about you at the tavern for years","slept with your betrothed","stole from you, a little at a time"])}.`,
        choices: [
          {
            t: "Confront {themHim}",
            check: {s:"wil",s2:"persuasion",d:40},
            win: {
              r: "{theyHe} breaks and confesses. The friendship is over, but at least it ends honestly.",
              fx: {them:{type:"acquaint",op:-40},wil:1.5},
            },
            lose: {
              r: "{theyHe} denies everything and calls you mad. Now you are the enemy.",
              fx: {them:{type:"enemy",op:-60},wil:1.5,happy:-6},
            },
          },
          {
            t: "Say nothing, and plan",
            r: "You smile at {themHim} and start keeping a ledger.",
            fx: {them:{type:"rival",op:-40},skill:{intrigue:2}},
          },
          {
            t: "Forgive {themHim}",
            r: "You forgive. It costs more than revenge, and frees you more.",
            fx: {them:{op:10},wil:2,happy:-3,honor:3},
          },
        ],
      },
      {
        id: "bd_old_enemy_peace",
        cond: (p,C)=>C.adult(p)&&C.hasRel(p,"enemy","rival"),
        w: .8,
        cool: 8,
        title: "An old enemy, older",
        setup: (p,ctx)=>pickRel(p,ctx,["enemy","rival"]),
        text: p=>`{them} looks older than you remember. ${A.pick(["{theyHe} lost a son this winter.","{theyHe} is selling everything to pay debts.","{theyHe} limps now.","{theyHe} found religion."])} {theyHe} walks up to you in the market and stops, as if waiting.`,
        choices: [
          {
            t: "Offer your hand",
            r: "A long pause. Then {theyHe} takes it. Twenty years of hate end in a market.",
            fx: {them:{type:"acquaint",op:20},wil:1,honor:3,happy:4},
          },
          {t:"Nod and walk on",r:"Not friends. Not enemies anymore. Just two old people.",fx:{them:{op:15}}},
          {
            t: "Remind {themHim} of what {theyHe} did",
            // [X1 baked patch events/33-no-obvious-choices CHOICE-BD-OLD-ENEMY-PEACE] bd_old_enemy_peace: reminding an old
            // enemy of what they did ("You feel better for one minute") now steadies you.
            r: "{theyHe} flinches and leaves. You feel better for one minute.",
            fx: {them:{op:-10},wil:1.5},
          },
        ],
      },
      {
        id: "bd_childhood_friend",
        cond: (p,C)=>C.adult(p)&&C.ageAdj(p)>=22,
        w: .7,
        once: !0,
        title: "A face from childhood",
        setup: (p,ctx)=>{const f=A.makeAcquaintance(p,"friend");f.born=p.born+A.ri(-1,1);const up=A.chance(.5);ctx.up=up?1:0,f.status=up?"gentry":"peasant",f.occ=up?A.pick(["a knight of the royal household","a rich wool merchant","a magistrate"]):A.pick(["a beggar on the temple steps","a one-armed veteran","a day laborer"]),up&&(f.fame=30),ctx.pid=f.id},
        text: p=>"You know that laugh. {them} — you stole apples together as children. Now {theyHe} is {themOcc}.",
        choices: [
          {
            t: "Embrace {themHim} like no time has passed",
            r: "Old friends are rare treasures. You pick it up right where you left it.",
            fx: (p,ctx)=>{const f=A.P(ctx.pid);return f&&A.link(p,f,"friend",45,"friend"),ctx.up?A.addFavor(p,ctx.pid,1):p.coin=Math.max(0,p.coin-5),ctx.up?"(A friend in a high place.)":"(You press a few coins into {theirHis} hand.)"},
          },
          {
            t: "Greet {themHim} politely and move on",
            r: "The past stays in the past.",
            fx: (p,ctx)=>{const f=A.P(ctx.pid);f&&A.link(p,f,"acquaint",5,"acquaint")},
          },
        ],
      },
      {
        id: "bd_bestfriend_rival",
        cond: (p,C)=>C.adult(p)&&C.hasRel(p,"bestfriend","friend")&&(C.job(p)||C.soldier(p)),
        w: .6,
        cool: 10,
        title: "One post, two friends",
        setup: (p,ctx)=>pickRel(p,ctx,["bestfriend","friend"]),
        text: p=>`There is one ${p.mil?"promotion":"master's place"} open, and both you and {them} want it. Everyone knows only one of you will get it.`,
        choices: [
          {
            t: "Compete fairly and may the best win",
            check: {s:"wil",s2:"int",d:45},
            win: {
              r: "You win it. {them} shakes your hand. It hurts {themHim}, but {theyHe} shakes it.",
              fx: {merit:8,perf:8,them:{op:-5}},
            },
            lose: {r:"{them} wins it. You shake {theirHis} hand. It hurts.",fx:{wil:1,them:{op:5}}},
          },
          {
            t: "Step aside for {themHim}",
            r: "{them} gets it and knows why. A debt of the best kind.",
            fx: {them:{op:25},owed:1},
          },
          {
            t: "Undercut {themHim} quietly",
            check: {s:"intrigue",s2:"deception",d:45},
            win: {r:"You get the post. {them} never learns how. You know.",fx:{merit:8,perf:8,honor:-6}},
            lose: {r:"{them} learns exactly how. The friendship dies.",fx:{them:{type:"enemy",op:-60},honor:-6}},
          },
        ],
      },
    ]);
    A.defEvents([
      {
        id: "bd_inheritance_siblings",
        cond: (p,C)=>C.adult(p)&&C.hasRel(p,"sibling")&&!C.parentsAlive(p),
        w: 1,
        cool: 15,
        title: "The will",
        setup: (p,ctx)=>pickRel(p,ctx,["sibling"]),
        text: p=>`The will is read. ${A.pick(["The house goes to you, the land to {them}.","Everything goes to {them}, except the old sword, which goes to you.","It is split evenly — except the one thing you both wanted."])} {them} is already arguing with the notary.`,
        choices: [
          {
            t: "Let {them} have the bigger share",
            r: "Things are things. {them} is your blood.",
            fx: {them:{op:20},coin:-20,honor:2},
          },
          {
            t: "Fight for what is fair",
            check: {s:"learning",s2:"persuasion",d:45},
            win: {r:"The notary agrees with you. {them} sulks for a year.",fx:{coin:60,them:{op:-15}}},
            lose: {r:"The notary agrees with {them}. And now you are the greedy one.",fx:{them:{op:-20}}},
          },
          {
            t: "Sell everything and split the coin",
            r: "Cold, but fair. Nobody gets the house. Nobody fights over it.",
            fx: {coin:40,them:{op:0}},
          },
        ],
      },
      {
        id: "bd_parent_failing",
        cond: (p,C)=>C.adult(p)&&hasR(p,["mother","father"],x=>A.stage(x.p)==="old"),
        w: 1,
        cool: 8,
        title: "An aging parent",
        setup: (p,ctx)=>pickRel(p,ctx,["mother","father"],x=>A.stage(x.p)==="old"),
        text: p=>`{them} is failing. ${A.pick(["{theyHe} forgets names now.","{theyHe} cannot climb the stairs.","{theyHe} fell in the yard and lay there half a day.","{theyHe} does not eat unless someone sits with {themHim}."])} Someone has to take care of {themHim}.`,
        choices: [
          {
            t: "Take {themHim} into your home",
            r: "Hard years. Good years. {theyHe} tells you stories you never heard.",
            fx: {them:{op:20},coin:-20,happy:-2,wil:1,honor:3},
          },
          {
            t: "Pay for a good nurse",
            req: p=>p.coin>=50,
            r: "The nurse is kind and competent. You visit on feast days.",
            fx: {coin:-50,them:{op:5}},
          },
          {
            t: "Leave it to your siblings",
            r: "Your siblings remember who did not come.",
            fx: {rel:{who:"sibling",op:-15,all:!0},them:{op:-10}},
          },
        ],
      },
      {
        id: "bd_inlaws",
        cond: (p,C)=>C.adult(p)&&C.married(p),
        w: .9,
        cool: 6,
        title: "The in-laws",
        text: p=>`Your spouse's family arrives for ${A.pick(["the harvest feast",'a "short visit" of a month',"a christening"])}. Your ${A.pick(["mother-in-law","father-in-law"])} has opinions about your house, your cooking, your work and your face.`,
        choices: [
          {
            t: "Charm them into submission",
            check: {s:"persuasion",s2:"etiquette",d:45},
            win: {
              r: "By the end of the visit they are telling everyone you are a treasure.",
              fx: {rel:{who:"spouse",op:10},happy:3},
            },
            lose: {r:"They leave unconvinced. Your spouse is caught in the middle.",fx:{rel:{who:"spouse",op:-5}}},
          },
          {
            t: "Bite your tongue for a month",
            r: "You bite it so hard it bleeds. Your spouse is grateful.",
            fx: {rel:{who:"spouse",op:10},wil:1,happy:-3},
          },
          {
            t: "Tell them what you think",
            r: "Silence at the table. A short visit after all. Your spouse is furious.",
            fx: {rel:{who:"spouse",op:-12},happy:2},
          },
        ],
      },
      {
        id: "bd_child_career",
        cond: (p,C)=>C.adult(p)&&p.children.some(c=>A.P(c)&&A.P(c).alive&&A.isAdult(A.P(c))),
        w: .9,
        cool: 8,
        title: "Your child's choice",
        setup: (p,ctx)=>{const k=p.children.map(A.P).filter(c=>c&&c.alive&&A.isAdult(c));ctx.pid=A.pick(k).id,ctx.path=A.pick(["run off to join a mercenary company","become a traveling player","enter the temple and take vows","marry someone you have never met","sail with the next ship to anywhere"])},
        text: "{them} has decided to {path}. {theyHe} is telling you, not asking you.",
        choices: [
          {
            t: "Give your blessing",
            r: "{them} cries and holds you. Whatever happens, {theyHe} knows you are behind {themHim}.",
            fx: {them:{op:25},happy:-2},
          },
          {
            t: "Forbid it",
            check: {s:"intimidation",s2:"wil",d:50},
            win: {r:"{theyHe} stays. Resentfully. For now.",fx:{them:{op:-15}}},
            lose: {r:"{theyHe} goes anyway, and does not write.",fx:{them:{op:-35},happy:-6,wil:1}},
          },
          {
            t: "Argue, then help anyway",
            r: "You shout, then pack {theirHis} bag with food and a good knife.",
            fx: {them:{op:12},coin:-10},
          },
        ],
      },
      {
        id: "bd_child_money",
        cond: (p,C)=>C.adult(p)&&p.children.some(c=>A.P(c)&&A.P(c).alive&&A.isAdult(A.P(c)))&&p.coin>=50,
        w: .9,
        cool: 6,
        title: "A grown child asks for money",
        setup: (p,ctx)=>{const k=p.children.map(A.P).filter(c=>c&&c.alive&&A.isAdult(c));ctx.pid=A.pick(k).id},
        text: p=>`{them} needs ${A.coin(A.ri(40,150))}: ${A.pick(["for a workshop of {theirHis} own","to pay a debt {theyHe} will not explain","for a wedding","to buy a commission in the army"])}.`,
        choices: [
          {t:"Give it freely",r:"Of course. What is coin for?",fx:{coin:-60,them:{op:15}}},
          {
            t: "Lend it, with terms",
            r: "Business is business, even in a family. {them} signs, a little hurt.",
            fx: {coin:-60,them:{op:-2},oweThem:0},
          },
          {
            t: "Refuse — {theyHe} must learn to stand alone",
            r: "{them} leaves without a word. Maybe {theyHe} will learn. Maybe {theyHe} will remember.",
            fx: {them:{op:-18}},
          },
        ],
      },
      {
        id: "bd_family_feast",
        cond: (p,C)=>C.adult(p)&&C.hasKids(p)&&C.ageAdj(p)>=35,
        w: .8,
        cool: 5,
        title: "The family feast",
        text: p=>`Everyone comes home for ${A.pick(["midwinter","the harvest","your name-day"])}: children, their spouses, small grandchildren underfoot, a cousin nobody invited. The table bends under the food.`,
        choices: [
          {
            t: "Tell the old stories",
            r: "The children have heard them a hundred times. The grandchildren have not. Everyone laughs in the same places.",
            fx: {rel:{who:"child",op:8,all:!0},happy:8},
          },
          {
            t: "Make peace between two quarreling children",
            check: {s:"diplomacy",s2:"wil",d:45},
            win: {
              r: "By the end of the night they are hugging. Your best work this year.",
              fx: {rel:{who:"child",op:10,all:!0},happy:5},
            },
            lose: {r:"A door slams. Somebody leaves early.",fx:{rel:{who:"child",op:-4,all:!0}}},
          },
          {
            t: "Announce how you will divide your estate",
            r: "Silence. Then arguments. Then some kind of peace.",
            fx: {rel:{who:"child",op:-3,all:!0},wil:.5},
          },
        ],
      },
      {
        id: "bd_black_sheep",
        cond: (p,C)=>C.adult(p)&&C.hasRel(p,"cousin","sibling","nephew"),
        w: .8,
        cool: 8,
        title: "The black sheep",
        setup: (p,ctx)=>pickRel(p,ctx,["cousin","sibling","nephew"]),
        text: p=>`{them}, the family's black sheep, turns up at your door ${A.pick(["with a black eye and no money","with a wagon of goods that are clearly stolen",'with a scheme that "cannot fail"',"running from someone"])}.`,
        choices: [
          {
            t: "Take {themHim} in, again",
            r: "Family is family. {them} sleeps in your barn and eats your bread.",
            fx: {coin:-15,them:{op:15}},
          },
          {
            t: "Listen to the scheme",
            check: {s:"int",s2:"trade",d:50},
            win: {r:"Unbelievably, it works. You both make money.",fx:{coin:80,them:{op:15}}},
            lose: {r:"It fails, as it always does. You lose your stake.",fx:{coin:-40,them:{op:5}}},
          },
          {t:"Shut the door",r:"You hear {themHim} curse you down the lane.",fx:{them:{op:-25}}},
        ],
      },
      {
        id: "bd_family_secret",
        cond: (p,C)=>C.adult(p)&&!C.parentsAlive(p),
        w: .5,
        once: !0,
        title: "A box in the attic",
        text: p=>`Clearing your parents' house, you find a box of letters. They reveal ${A.pick(["a half-sibling your father never spoke of","that your mother was once betrothed to a lord","a debt your family has owed a neighbor for forty years","that you were born a year earlier than you were told"])}.`,
        choices: [
          {
            t: "Follow the trail",
            r: "It leads to a stranger who has your eyes. A new relative, and a lot of questions.",
            fx: {newRel:{type:"cousin",op:20},int:.3},
          },
          {t:"Burn the letters",r:"Some things belong to the dead.",fx:{wil:.5}},
          {
            t: "Read them all, slowly, and keep them",
            r: "Your parents become people to you, not just parents. It hurts and it helps.",
            fx: {wil:1,happy:-2,int:.3},
          },
        ],
      },
      {
        id: "bd_grandparent_story",
        cond: (p,C)=>C.ageAdj(p)>=8&&C.ageAdj(p)<20&&C.hasRel(p,"grandparent"),
        w: .9,
        once: !0,
        title: "The last story",
        setup: (p,ctx)=>pickRel(p,ctx,["grandparent"]),
        text: p=>`{them} calls you to sit by the fire. "I am going to tell you something I never told your parents." It is about ${A.pick(["the war {theyHe} fought in","how {theyHe} met your grandparent","a crime {theyHe} got away with","a treasure {theyHe} buried and never dug up"])}.`,
        choices: [
          {
            t: "Listen to every word",
            r: "You will remember this story your whole life. You will tell it to your own grandchildren.",
            fx: {them:{op:20},int:.5,happy:4,flag:"bd_grand_story"},
          },
          {
            t: "Ask questions until late",
            r: "{them} laughs and answers all of them. The fire burns down. Neither of you moves.",
            fx: {them:{op:25},skill:{learning:1}},
          },
        ],
      },
      {
        id: "bd_spouse_ambition",
        cond: (p,C)=>C.adult(p)&&C.married(p),
        w: .8,
        cool: 8,
        title: "Two ambitions, one house",
        setup: (p,ctx)=>{ctx.pid=p.spouse},
        text: p=>`{them} has a chance of ${A.pick(["a post in another town","a partnership that needs all your savings","a long voyage","a place at court far from home"])}. It would mean giving up your plans for a while.`,
        choices: [
          {
            t: "Support {themHim} fully",
            r: "You pack up your life for {theirHis}. {theyHe} will not forget it.",
            fx: {them:{op:25},happy:-2,perf:-4},
          },
          {
            t: "Ask {themHim} to wait a few years",
            check: {s:"persuasion",s2:"diplomacy",d:45},
            win: {r:"{theyHe} agrees. Your turn first; {theirHis} next.",fx:{them:{op:2}}},
            lose: {r:"{theyHe} agrees, but something cold enters the house.",fx:{them:{op:-15}}},
          },
          {
            t: "Find a way for both",
            check: {s:"int",s2:"stewardship",d:55},
            win: {r:"It takes cleverness and some luck. It works.",fx:{them:{op:15},happy:5}},
            lose: {r:"Both plans half-fail.",fx:{them:{op:-5},happy:-3}},
          },
        ],
      },
      {
        id: "bd_jealousy",
        cond: (p,C)=>C.adult(p)&&C.married(p)&&C.ageAdj(p)<50,
        w: .6,
        cool: 10,
        title: "Jealousy",
        setup: (p,ctx)=>{ctx.pid=p.spouse,ctx.rv=A.givenName(p.cult,A.chance(.5)?"M":"F")},
        text: "{them} has been spending a lot of time with {rv}. {theyHe} says it is nothing. The neighbors say it is not nothing.",
        choices: [
          {
            t: "Trust {themHim}",
            r: "You trust. It was nothing. {them} loves you more for not asking.",
            fx: {them:{op:10},wil:.5},
          },
          {
            t: "Ask {themHim} straight out",
            check: {s:"persuasion",s2:"wil",d:40},
            win: {r:"An honest conversation. Old hurts aired. Closer for it.",fx:{them:{op:12}}},
            lose: {r:"A fight that goes on for weeks.",fx:{them:{op:-15},happy:-5}},
          },
          {
            t: "Follow {themHim}",
            check: {s:"stealth",s2:"int",d:40},
            win: {r:"{theyHe} was planning a surprise for you. You feel very small.",fx:{them:{op:4},happy:-2}},
            lose: {r:"{theyHe} sees you. Trust is hard to glue back.",fx:{them:{op:-25}}},
          },
        ],
      },
      {
        id: "bd_marriage_repair",
        cond: (p,C)=>C.adult(p)&&C.married(p)&&A.opinion(p,A.P(p.spouse))<10,
        w: 1.2,
        cool: 6,
        title: "A cold house",
        setup: (p,ctx)=>{ctx.pid=p.spouse},
        text: "You and {them} speak only about bread and bills now. You sleep with your backs to each other. It was not always like this.",
        choices: [
          {
            t: "Take {themHim} away for a few days, just the two of you",
            req: p=>p.coin>=20,
            r: "A cottage by the sea, rain on the roof. You remember why.",
            fx: {coin:-20,them:{op:25},happy:6},
          },
          {
            t: "Ask a priest or an elder to help",
            check: {s:"faith",s2:"persuasion",d:35},
            win: {r:"Hard talking with a wise third voice. It helps.",fx:{them:{op:18}}},
            lose: {r:"The priest takes {theirHis} side. Of course.",fx:{them:{op:-5}}},
          },
          {
            t: "Accept it — many marriages are like this",
            r: "You build a quiet wall and live on your own side of it.",
            fx: {happy:-5,wil:.5},
          },
        ],
      },
      {
        id: "bd_anniversary",
        cond: (p,C)=>C.adult(p)&&C.married(p)&&A.opinion(p,A.P(p.spouse))>=40,
        w: .7,
        cool: 6,
        title: "An anniversary",
        setup: (p,ctx)=>{ctx.pid=p.spouse},
        text: "It is the anniversary of the day you married {them}. You nearly forgot. {theyHe} did not.",
        choices: [
          {
            t: "Make up for it with a grand gesture",
            req: p=>p.coin>=15,
            r: "A feast, music, the dress or doublet {theyHe} wanted. Forgiven.",
            fx: {coin:-15,them:{op:15},happy:4},
          },
          {
            t: "Admit you forgot, and laugh about it together",
            check: {s:"persuasion",s2:"int",d:30},
            win: {r:'{theyHe} laughs. "Twenty years and you still cannot count."',fx:{them:{op:10}}},
            lose: {r:"{theyHe} does not laugh.",fx:{them:{op:-8}}},
          },
        ],
      },
    ]);
    A.defEvents([
      {
        id: "bd_mentor_last",
        cond: (p,C)=>C.adult(p)&&C.hasRel(p,"mentor","master"),
        w: .7,
        cool: 15,
        title: "The last lesson",
        setup: (p,ctx)=>pickRel(p,ctx,["mentor","master"]),
        text: '{them} is old now and asks you to visit. "I have one more thing to teach you. I saved it for last." {theyHe} makes you wait a whole day before saying what it is.',
        choices: [
          {
            t: "Wait patiently",
            r: "The lesson is about patience. Of course it is. Then the real one, which you will use the rest of your life.",
            fx: (p,ctx)=>{const m=A.P(ctx.pid),sk=m&&m.flags.mentorOf||A.bestSkillOf(p).k;A.trainSkill(p,sk,8),A.willGrow(p,1,"lesson"),m&&A.addOp(p,m,15)},
          },
          {
            t: "Demand it now",
            r: '{them} laughs. "Still you. Fine." The lesson is shorter, and still good.',
            fx: (p,ctx)=>{const m=A.P(ctx.pid),sk=m&&m.flags.mentorOf||A.bestSkillOf(p).k;A.trainSkill(p,sk,4)},
          },
        ],
      },
      {
        id: "bd_student_surpasses",
        cond: (p,C)=>C.adult(p)&&C.hasRel(p,"student","protege"),
        w: .8,
        cool: 8,
        title: "The student surpasses",
        setup: (p,ctx)=>pickRel(p,ctx,["student","protege"]),
        text: "In front of witnesses, {them} beats you at the thing you taught {themHim}. {theyHe} looks horrified at {theirHis} own win.",
        choices: [
          {
            t: "Laugh and embrace {themHim}",
            r: "The best thing a teacher can see. Everyone watching respects you more, not less.",
            fx: {them:{op:20},fame:2,honor:2},
          },
          {
            t: "Demand a rematch",
            check: {s:"wil",s2:"ins",d:50},
            win: {r:"You win the rematch. Both of you grin like fools.",fx:{them:{op:8},wil:1}},
            lose: {r:"You lose again. Time comes for everyone.",fx:{them:{op:4},wil:1.5,happy:-3}},
          },
          {t:"Leave without a word",r:"Pride is a poor teacher.",fx:{them:{op:-15}}},
        ],
      },
      {
        id: "bd_rival_success",
        cond: (p,C)=>C.adult(p)&&C.hasRel(p,"rival"),
        w: .9,
        cool: 6,
        title: "Your rival's triumph",
        setup: (p,ctx)=>pickRel(p,ctx,["rival"]),
        text: p=>`{them} has ${A.pick(["been honored by the crown","won the biggest commission of the year","married rich","been promoted over everyone"])}. The whole town is talking about it. You are hearing about it everywhere you go.`,
        choices: [
          {
            t: "Congratulate {themHim} publicly",
            r: "It costs you to do it. People notice the grace.",
            fx: {them:{op:12},honor:3,wil:1},
          },
          {
            t: "Use it as fuel",
            r: "You work twice as hard all year.",
            fx: {wil:1,skill:{[["melee","trade","learning","craft"][A.ri(0,3)]]:3}},
          },
          {
            t: "Spread doubts about how {theyHe} got it",
            check: {s:"deception",s2:"intrigue",d:45},
            win: {r:"The shine fades a little.",fx:{them:{op:-15},honor:-2}},
            lose: {r:"People see your jealousy, not {theirHis} faults.",fx:{fame:-2,honor:-3}},
          },
        ],
      },
      {
        id: "bd_rival_saves",
        cond: (p,C)=>C.adult(p)&&C.hasRel(p,"rival","enemy"),
        w: .4,
        once: !0,
        title: "Saved by your rival",
        setup: (p,ctx)=>pickRel(p,ctx,["rival","enemy"]),
        text: p=>`${A.pick(["A runaway cart","A knife in an alley","The river in flood","A fall from scaffolding"])} — and it is {them}, of all people, who grabs you and pulls you clear.`,
        choices: [
          {
            t: "Thank {themHim} — and mean it",
            r: '"Do not get used to it," {theyHe} says. Something changed, though.',
            fx: {them:{type:"acquaint",op:30},oweThem:1,wil:.5},
          },
          {
            t: "Ask {themHim} why",
            r: '"Because I want to beat you myself." A strange kind of respect.',
            // [X1 baked patch events/33-no-obvious-choices CHOICE-BD-RIVAL-SAVES] bd_rival_saves: asking a rival why they
            // saved you now teaches you something about them.
            fx: {them:{op:20},oweThem:1,ins:.5},
          },
        ],
      },
      {
        id: "bd_duel_challenge",
        cond: (p,C)=>C.adult(p)&&C.hasRel(p,"enemy")&&C.ageAdj(p)<55,
        w: .6,
        cool: 8,
        title: "A glove at your feet",
        setup: (p,ctx)=>pickRel(p,ctx,["enemy"]),
        text: '{them} throws a glove at your feet in front of half the town. "Tomorrow. Dawn. The field by the mill."',
        choices: [
          {
            t: "Accept the challenge",
            r: "Dawn, mist, the mill wheel turning.",
            fx: {
              duel: {
                foe: "them",
                tier: 3,
                opts: {kind:"duel",place:"the field by the mill",lethal:!0,toYield:!0,title:"The challenge at dawn"},
              },
            },
          },
          {
            t: "Name a champion to fight for you",
            req: p=>p.coin>=40,
            r: "You pay a hard man to stand for you. He wins. People whisper you were afraid.",
            fx: {coin:-40,them:{op:-10},honor:-3},
          },
          {
            t: "Refuse",
            r: "You refuse. Some call it wisdom. More call it something else.",
            fx: {fame:-2,honor:-4,wil:.5},
          },
        ],
      },
      {
        id: "bd_rival_reconcile",
        cond: (p,C)=>C.adult(p)&&C.hasRel(p,"rival")&&C.ageAdj(p)>=40,
        w: .7,
        cool: 10,
        title: "Too old for this",
        setup: (p,ctx)=>pickRel(p,ctx,["rival"]),
        text: '{them} sends a jug of wine with a note: "We have been at this for too long. Shall we stop?"',
        choices: [
          {
            t: "Drink with {themHim}",
            r: "You laugh about the old fights. You were both fools. Good fools.",
            fx: {them:{type:"friend",op:40},happy:6},
          },
          // [X1 baked patch events/33-no-obvious-choices CHOICE-BD-RIVAL-RECONCILE] bd_rival_reconcile: sending the jug back
          // ("Old habits") is pride, and now counts as will.
          {t:"Send the jug back unopened",r:"Old habits.",fx:{them:{op:-10},wil:1}},
        ],
      },
      {
        id: "bd_neighbor_help",
        cond: (p,C)=>C.adult(p)&&!C.ruler(p),
        w: .9,
        cool: 5,
        title: "The neighbor",
        setup: (p,ctx)=>{const n=A.makeAcquaintance(p,"acquaint");n.occ="your neighbor",ctx.pid=n.id},
        text: p=>`Your neighbor {them} ${A.pick(["has a cow stuck in the ditch","needs a roof raised before the rain","lost {theirHis} purse on the road to market","is sick and {theirHis} fields need cutting"])}.`,
        choices: [
          {
            t: "Help",
            r: "A long day. A grateful neighbor. Neighbors remember.",
            fx: {them:{type:"friend",op:25},owed:1,sta:.3},
          },
          {
            t: "Help — for a fair price",
            r: "Business between neighbors. Fair, if a little cold.",
            fx: {coin:8,them:{op:5}},
          },
          {
            t: "You have your own troubles",
            r: "Next time you need a hand, you will remember this.",
            fx: {them:{op:-10}},
          },
        ],
      },
    ]);
  })();
})();
