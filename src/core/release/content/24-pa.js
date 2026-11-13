// The release's event pack 24 of 30 (37 events, mostly pa_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-028). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const AM = (p,C,k)=>C.adult(p)&&C.ambition(p,k),
      unseen = p=>Object.values(A.S.realms).filter(r=>r.alive&&!r.isRebel&&!(p.seen||[]).includes(r.id)&&A.raceAllowed(p.race,r.id)),
      nb = p=>A.neighbors(p.ruler||p.realm),
      webC = p=>Object.values(A.S.realms).filter(r=>r.alive&&!r.isRebel&&r.id!==p.ruler&&!A.realm(p.ruler).allies.includes(r.id)&&!A.hostile(p.ruler,r.id));
    A.defEvents([
      {
        id: "pa_blade_master_lesson",
        cond: (p,C)=>AM(p,C,"blade"),
        w: 1.2,
        cool: 4,
        title: "A master passing through",
        setup: (p,ctx)=>{const m=A.makeAcquaintance(p,"acquaint");m.born=Math.min(m.born,A.S.year-50),m.skills.sword=90,m.skills.melee=85,m.occ="a famous swordmaster",ctx.pid=m.id,ctx.fee=A.ri(40,90)},
        text: "{themFull}, a swordmaster whose name you have heard in songs, is staying at the inn for three days. {theyHe} will teach one private lesson a day, to whoever pays {fee} suns.",
        choices: [
          {
            t: "Pay for all three days",
            req: (p,C)=>p.coin>=120,
            r: "Three days that change how you stand, breathe and see. Worth every coin.",
            fx: {coin:-120,styleXp:45,skill:{melee:4,sword:3},ins:1},
          },
          {
            t: "Pay for one lesson",
            req: (p,C)=>p.coin>=45,
            r: "One hour. One correction to your guard. It was worth it.",
            fx: {coin:-45,styleXp:15,skill:{melee:2}},
          },
          {
            t: "Watch from the window and steal what you can",
            check: {s:"int",s2:"ins",d:50},
            win: {
              r: "You see enough to copy one trick. {theyHe} sees you seeing, and smiles.",
              fx: {styleXp:12,them:{op:10}},
            },
            lose: {r:"You learn nothing from a window.",fx:{}},
          },
        ],
      },
      {
        id: "pa_blade_famous_duel",
        cond: (p,C)=>AM(p,C,"blade")&&C.styleRank(p)>=2,
        w: 1,
        cool: 5,
        title: "A known blade",
        text: p=>`A duelist with a name — ${A.pick(["the Red Knife of Ostra","Silent Bertil","the Widow's Son","Malka of the Seven Cuts"])} — is offering to cross blades with anyone who thinks they are good enough, for a purse of silver. To blood, not to death.`,
        choices: [
          {
            t: "Step up",
            r: "The crowd parts. Steel comes out.",
            fx: {
              duel: {
                tier: 4,
                title: "a famous duelist",
                opts: {kind:"duel",place:"a ring of shouting people",lethal:!1,toYield:!0,title:"A blade with a name"},
              },
              fame: 2,
            },
          },
          {
            t: "Watch closely and learn",
            check: {s:"int",s2:"ins",d:45},
            win: {r:"Three fights in, you see the trick everyone falls for. You will not.",fx:{styleXp:20}},
            lose: {r:"Too fast to follow.",fx:{styleXp:5}},
          },
        ],
      },
      {
        id: "pa_blade_rival_school",
        cond: (p,C)=>AM(p,C,"blade")&&C.styled(p,1),
        w: .8,
        cool: 8,
        title: "Another school's secret",
        text: p=>`A rival school in ${A.realm(p.realm).capital} guards a technique like treasure. One of their students drinks too much and talks too loud. He would show you the form for a jug — or you could challenge him and take it from his body's memory.`,
        choices: [
          {
            t: "Buy him the jug",
            req: p=>p.coin>=10,
            check: {s:"persuasion",s2:"int",d:40},
            win: {r:"He shows you, badly, drunkenly. Badly is enough.",fx:{coin:-10,styleXp:25,honor:-2}},
            lose: {r:"He passes out halfway. You got half.",fx:{coin:-10,styleXp:8}},
          },
          {
            t: "Challenge him openly",
            r: "Honest steel. If you learn the trick, you learn it the hard way.",
            fx: {
              duel: {
                tier: 2,
                title: "a rival school's student",
                opts: {kind:"duel",place:"the school yard",lethal:!1,toYield:!0,title:"School against school"},
              },
            },
          },
          {t:"Leave their secrets to them",r:"Your own style is enough to master.",fx:{honor:2,styleXp:5}},
        ],
      },
      {
        id: "pa_soldier_volunteer",
        cond: (p,C)=>AM(p,C,"soldier")&&C.soldier(p),
        w: 1.1,
        cool: 3,
        title: "Volunteers wanted",
        text: p=>`Your captain asks for volunteers: ${A.pick(["a night raid on the enemy's horse lines","holding a bridge for a day","scouting a forest nobody has come back from","escorting a paymaster through bandit country"])}. Merit for those who come back.`,
        choices: [
          {t:"Volunteer",r:"You step forward. Your mates step forward behind you.",fx:{mission:"any",merit:4}},
          {
            t: "Volunteer, and plan it yourself",
            check: {s:"tactics",s2:"command",d:45},
            win: {
              r: "Your plan works cleanly. The captain writes your name in the dispatch.",
              fx: {merit:12,skill:{tactics:3},fame:2},
            },
            lose: {
              r: "The plan goes wrong at the first step. You get out, barely.",
              fx: {merit:3,health:-10,cause:"a raid gone wrong"},
            },
          },
          {t:"Stay back this time",r:"Others go. Others get the merit.",fx:{}},
        ],
      },
      {
        id: "pa_soldier_staff",
        cond: (p,C)=>AM(p,C,"soldier")&&C.soldier(p)&&p.mil.rank>=3&&C.literate(p),
        w: .9,
        cool: 5,
        title: "A place on the staff",
        text: "The general's staff needs an officer who can read maps, write orders and keep his mouth shut. Staff officers rise fast — and are hated by the line.",
        choices: [
          {
            t: "Take the staff post",
            r: "Maps, orders, late nights, the general's ear.",
            fx: {merit:10,skill:{tactics:4,logistics:4},flag:"pa_staff"},
          },
          {
            t: "Stay with your men",
            r: "Your men cheer when they hear. Loyalty runs both ways.",
            fx: {honor:3,skill:{command:3}},
          },
        ],
      },
      {
        id: "pa_knight_hedge",
        cond: (p,C)=>AM(p,C,"knight")&&(!p.noble||p.noble.rung<2),
        w: 1,
        cool: 4,
        title: "A road to spurs",
        text: p=>`An old hedge knight, Ser ${A.givenName(p.cult,"M")}, needs a squire. No pay, a lame horse and a lot of mud — but he can knight you, by the old law, if you earn it.`,
        choices: [
          {
            t: "Serve him for a year",
            r: 'Mud, saddles, polishing. Then a tourney, and he says: "Kneel."',
            fx: p=>(A.trainSkill(p,"riding",4),A.trainSkill(p,"lance",4),A.chance(.55+p.fame/200)?(p.noble={rung:Math.max(2,p.noble?p.noble.rung:0),realm:p.realm,holding:p.noble?p.noble.holding:null},p.title=p.sex==="F"?"Dame":"Sir",A.ach("knighted"),A.fame(p,5),"He dubs you on the tourney field. You are a knight."):"A year of mud. He dies in the spring before he can dub you. You learned a lot, at least."),
          },
          {t:"Say no — you want a better patron",r:"He shrugs and rides on, whistling.",fx:{}},
        ],
      },
      {
        id: "pa_knight_quest",
        cond: (p,C)=>AM(p,C,"knight")&&C.prof(p,"riding",20),
        w: .9,
        cool: 6,
        title: "A quest worthy of the name",
        text: p=>`${A.pick(["A village","A convent","A widow's manor"])} near ${A.provName(p.home)} has been terrorized for a month by ${A.pick(["a band of brigands in an old tower","a beast that takes sheep and dogs","a knight gone bad, who taxes the road"])}. The local lord does nothing.`,
        choices: [
          {
            t: "Ride out alone",
            r: "Songs are made of days like this. So are graves.",
            fx: {
              duel: {
                tier: 3,
                title: "the scourge of the road",
                opts: {kind:"duel",place:"the old tower road",lethal:!0,toYield:!1,title:"A knight's quest"},
              },
              fame: 4,
              honor: 3,
            },
          },
          {
            t: "Gather three friends and do it properly",
            check: {s:"command",s2:"tactics",d:45},
            win: {
              r: "Four riders, one plan, done by noon. The village rings its bell for you.",
              fx: {fame:6,honor:3,skill:{command:2}},
            },
            lose: {r:"It goes messily. You win, but one friend is badly hurt.",fx:{fame:3,happy:-4}},
          },
        ],
      },
    ]);
    A.defEvents([
      {
        id: "pa_trade_big_client",
        cond: (p,C)=>AM(p,C,"trade")&&C.job(p),
        w: 1.1,
        cool: 4,
        title: "The client who could make you",
        text: p=>`A ${A.pick(["duke's steward","rich abbess","foreign merchant prince","royal quartermaster"])} wants work from you — more than you have ever done, faster than you have ever done it. Do it well and your name is made. Do it badly and it is ruined.`,
        choices: [
          {
            t: "Take it and work day and night",
            check: {s:"sta",s2:"wil",d:50},
            win: {r:"Delivered, on time, perfect. Your reputation jumps.",fx:{rep:12,coin:120,perf:8}},
            lose: {r:"Late, and it shows. Word spreads.",fx:{rep:-6,coin:40,health:-6}},
          },
          {
            t: "Take it and hire help",
            req: p=>p.coin>=40,
            check: {s:"stewardship",s2:"trade",d:45},
            win: {r:"Good hands, good management. Done well.",fx:{coin:80,rep:9}},
            lose: {r:"Your hired help botches part of it.",fx:{coin:20,rep:-3}},
          },
          {t:"Turn it down — too big, too soon",r:"Safe. Slow. You keep doing small work well.",fx:{rep:1}},
        ],
      },
      {
        id: "pa_trade_guild_seat",
        cond: (p,C)=>AM(p,C,"trade")&&C.jobRank(p,2),
        w: .8,
        cool: 8,
        title: "A seat in the guild hall",
        text: "A seat on the guild council has opened. The election is decided by thirty old men, a feast and some quiet purses.",
        choices: [
          {
            t: "Campaign honestly on your work",
            check: {s:"persuasion",s2:"trade",d:50},
            win: {r:"Elected. Your word now carries weight in every workshop in town.",fx:{rep:10,fame:3,promote:!0}},
            lose: {r:"They choose an older man. Next time.",fx:{rep:2}},
          },
          {
            t: "Buy the votes",
            req: p=>p.coin>=150,
            r: "Purses change hands. You win. Everyone knows how.",
            fx: {coin:-150,rep:6,promote:!0,honor:-4},
          },
          {t:"Stay out of guild politics",r:"You keep your hands on your work and off the council.",fx:{}},
        ],
      },
      {
        id: "pa_wealth_venture",
        cond: (p,C)=>AM(p,C,"wealth")&&p.coin>=100,
        w: 1.2,
        cool: 3,
        title: "A venture",
        text: p=>`A ship's captain needs investors for a voyage to ${A.pick(["the Amber Isles for spice","Qadir for silk","the northern ports for furs","Tamar for linen"])}. Half come back rich. Half never come back.`,
        choices: [
          {
            t: "Put in a third of what you have",
            r: "The ship sails. You wait.",
            fx: p=>{const stake=Math.round(p.coin/3);p.coin-=stake;const roll=A.rand();return A.trainSkill(p,"trade",3),roll<.45?(p.coin+=stake*3,`The ship returns low in the water. You triple your stake: ${A.coin(stake*3)}.`):roll<.7?(p.coin+=Math.round(stake*1.2),"The ship returns. A small profit."):"The ship is lost in a storm. So is your stake."},
          },
          {
            t: "Put in everything",
            r: "Fortune favors the bold, they say. They also say other things.",
            fx: p=>{const stake=p.coin;return p.coin=0,A.rand()<.42?(p.coin+=stake*3,A.fame(p,3),`The ship comes in. You are suddenly rich: ${A.coin(stake*3)}.`):"The ship never comes back. You are suddenly poor."},
          },
          {t:"Pass",r:"You keep your silver in your chest, where silver belongs.",fx:{}},
        ],
      },
      {
        id: "pa_wealth_land_cheap",
        cond: (p,C)=>AM(p,C,"wealth")&&p.coin>=400,
        w: .9,
        cool: 6,
        title: "A ruined lord sells",
        text: p=>`A ruined lord near ${A.provName(p.home)} must sell his best farmland fast to pay his debts. Half the price it is worth. His sons are furious and swear the sale will not stand.`,
        choices: [
          {
            t: "Buy it",
            r: "Rich land, angry neighbors.",
            fx: {coin:-400,asset:"farm",newRel:{type:"enemy",op:-35}},
          },
          {
            t: "Buy it, and give the sons a share",
            check: {s:"diplomacy",s2:"trade",d:45},
            win: {r:"The sons accept, sulking. A fair deal and no feud.",fx:{coin:-450,asset:"farm"}},
            lose: {
              r: "They take the share and still hate you.",
              fx: {coin:-450,asset:"farm",newRel:{type:"rival",op:-20}},
            },
          },
          {t:"Let someone else profit from his ruin",r:"You have no stomach for vultures' work.",fx:{honor:2}},
        ],
      },
      {
        id: "pa_wealth_bank",
        cond: (p,C)=>AM(p,C,"wealth")&&p.coin>=2e3,
        w: .8,
        once: !0,
        title: "Partners in a bank",
        text: "Two merchants invite you into a partnership: a counting-house that lends to lords and shippers. Your silver, their contacts. Lords repay late, or never — but they repay in favors.",
        choices: [
          {
            t: "Become a partner",
            r: "Your name goes over the door of a counting-house.",
            fx: p=>(p.coin-=2e3,p.assets.push({k:"workshop",name:"A share in a counting-house",where:A.provName(p.home),y:A.S.year}),p.flags.banker=A.S.year,A.trainSkill(p,"trade",5),"(A share in a counting-house. Its profits come every year.)"),
          },
          {t:"Lend to them, but stay out",r:"Interest without risk. Mostly.",fx:{coin:200,skill:{trade:2}}},
        ],
      },
      {
        id: "pa_teacher_orphan",
        cond: (p,C)=>AM(p,C,"teacher"),
        w: 1.1,
        cool: 5,
        title: "A gifted orphan",
        setup: (p,ctx)=>{const k=A.makeAcquaintance(p,"student",!0);k.born=A.S.year-Math.round(GD.RACES[k.race].adult*.7),ctx.pid=k.id},
        text: "A ragged child, {them}, has been watching you work for a week from behind a wall. Today {theyHe} copied what you do — almost perfectly.",
        choices: [
          {
            t: "Take {themHim} as your student",
            r: "A student with nothing to lose learns twice as fast.",
            // [X1 baked patch events/33-no-obvious-choices CHOICE-PA-TEACHER-ORPHAN] pa_teacher_orphan: a student with nothing
            // has to be fed.
            fx: {them:{type:"student",op:40},happy:4,coin:-10},
          },
          {
            t: "Give {themHim} a coin and send {themHim} off",
            r: "{theyHe} takes it and vanishes. Maybe someone else will teach {themHim}.",
            fx: {coin:-1},
          },
        ],
      },
      {
        id: "pa_teacher_class",
        cond: (p,C)=>AM(p,C,"teacher")&&C.hasRel(p,"student"),
        w: 1,
        cool: 4,
        title: "A test for your students",
        text: p=>`Your students face their first public test: ${A.pick(["a guild examination","a tourney for youngsters","a disputation before the masters","a day running a workshop alone"])}. Their failure is yours. Their success is yours too.`,
        choices: [
          {
            t: "Drill them hard before it",
            check: {s:"command",s2:"persuasion",d:45},
            win: {r:"They shine. People ask who taught them.",fx:{fame:4,rel:{who:"student",op:10,all:!0}}},
            lose: {r:"They freeze. You learn as much as they do.",fx:{wil:1}},
          },
          {
            t: "Let them go in as they are",
            r: "Some do well, some do not. All of them learn.",
            fx: {rel:{who:"student",op:6,all:!0}},
          },
        ],
      },
    ]);
    A.defEvents([
      {
        id: "pa_scholar_manuscript",
        cond: (p,C)=>AM(p,C,"scholar")&&C.literate(p),
        w: 1.1,
        cool: 5,
        title: "A lost manuscript",
        text: p=>`A peddler sells old parchment for wrapping fish. One bundle is a ${A.pick(["treatise on the stars older than the Concord","lost book of an ancient physician","chronicle of a war nobody remembers","grammar of a dead tongue"])}, damaged but readable.`,
        choices: [
          {
            t: "Buy it all and spend the winter on it",
            req: p=>p.coin>=20,
            r: "A winter of candles and squinting. What you find is real.",
            fx: {coin:-20,skill:{learning:6},int:1,flag:"pa_manuscript"},
          },
          {
            t: "Sell it to the academy",
            r: "The academy pays well and puts your name in the catalogue.",
            fx: {coin:40,fame:2},
          },
        ],
      },
      {
        id: "pa_scholar_chair",
        cond: (p,C)=>AM(p,C,"scholar")&&C.prof(p,"learning",50),
        w: .8,
        cool: 8,
        title: "A chair at the academy",
        text: "The academy needs a lecturer. The masters want someone with a diploma and gray hair. You have neither, but your work is better than theirs.",
        choices: [
          {
            t: "Apply and dazzle them in the disputation",
            check: {s:"learning",s2:"persuasion",d:55},
            win: {r:"They give you the chair. Students crowd your lectures.",fx:{job:"teacher",promote:!0,fame:5}},
            lose: {r:"They pick an old master. You were too sharp for their taste.",fx:{fame:1,wil:1}},
          },
          {
            t: "Teach for free in the market instead",
            r: "Your lectures under the plane tree draw bigger crowds than the academy.",
            fx: {fame:3,skill:{persuasion:3}},
          },
        ],
      },
      {
        id: "pa_faith_dream",
        cond: (p,C)=>AM(p,C,"faith"),
        w: 1,
        cool: 6,
        title: "A dream you cannot shake",
        text: p=>`You dream of ${A.godWord(p)} — or something like it — standing on the hill above ${A.provName(p.home)}, pointing at the old ${A.pick(["ruined shrine","dry well","fallen standing stone"])}. You wake certain. Your priest says dreams are just dreams.`,
        choices: [
          {
            t: "Restore the old shrine",
            req: p=>p.coin>=30,
            r: "You clear the brambles and set the stones. People begin to leave flowers.",
            fx: {coin:-30,piety:8,fame:2,flag:"chapel"},
          },
          {
            t: "Pray there every night for a month",
            r: "Whatever was or was not there, you come back steadier.",
            fx: {piety:5,wil:1},
          },
          {t:"Your priest is right",r:"Just a dream. You go back to work.",fx:{}},
        ],
      },
      {
        id: "pa_faith_corrupt_priest",
        cond: (p,C)=>AM(p,C,"faith")&&C.prof(p,"faith",15),
        w: .9,
        cool: 8,
        title: "A corrupt priest",
        text: 'The priest of your temple sells blessings, takes "gifts" for burials, and keeps the alms box key on his own belt. Everybody knows. Nobody says.',
        choices: [
          {
            t: "Report him to the bishop",
            check: {s:"persuasion",s2:"faith",d:50},
            win: {r:"He is removed. The new priest is honest. The village is grateful.",fx:{piety:6,fame:2,honor:3}},
            lose: {
              r: "The bishop is his cousin. You are now the troublemaker.",
              fx: {piety:2,newRel:{type:"enemy",op:-40}},
            },
          },
          {
            t: "Shame him publicly at the feast",
            check: {s:"intimidation",s2:"persuasion",d:45},
            win: {r:"The crowd turns on him. He leaves town that week.",fx:{fame:3,piety:3}},
            lose: {r:"The crowd turns on YOU for shaming a priest.",fx:{fame:-2}},
          },
          {t:"Leave him to the gods",r:"The gods will deal with him. Probably.",fx:{}},
        ],
      },
      {
        id: "pa_renown_deed",
        cond: (p,C)=>AM(p,C,"renown"),
        w: 1.1,
        cool: 4,
        title: "A chance at a deed",
        text: p=>`${A.pick(["A house is burning with a child inside.","A runaway horse with a merchant's daughter on it is heading for the river.","A bear has wandered into the market.","A boat has capsized in the harbor mouth."])} Everyone is standing and staring.`,
        choices: [
          {
            t: "Go in",
            check: {s:"str",s2:"wil",d:50},
            win: {
              r: "You do it. The whole town saw. By night there is a song.",
              fx: {fame:8,honor:4,deed:"Saved a life in front of the whole town"},
            },
            lose: {
              r: "You try and it goes badly. Still — you tried, and they saw.",
              fx: {fame:3,health:-18,cause:"a rescue gone wrong",wil:1},
            },
          },
          {
            t: "Organize the crowd to help",
            check: {s:"command",s2:"persuasion",d:40},
            win: {r:"Your shouting turns a mob into a rescue team. It works.",fx:{fame:4,skill:{command:2}}},
            lose: {r:"Nobody listens. It ends badly.",fx:{happy:-4}},
          },
        ],
      },
      {
        id: "pa_renown_minstrel",
        cond: (p,C)=>AM(p,C,"renown")&&p.fame>=20,
        w: .8,
        cool: 6,
        title: "The minstrel",
        text: 'A traveling minstrel wants to make a song about you. "Tell me your story. I will make it better." For a fee, of course.',
        choices: [
          {
            t: "Pay well and tell it big",
            req: p=>p.coin>=25,
            r: "The song is mostly lies, beautifully sung. It spreads to three realms.",
            fx: {coin:-25,fame:5},
          },
          {
            t: "Tell it true and pay little",
            r: "An honest song. Not as catchy. People who hear it believe it.",
            fx: {coin:-5,fame:2,honor:1},
          },
        ],
      },
      {
        id: "pa_explorer_road",
        cond: (p,C)=>AM(p,C,"explorer")&&!C.unfree(p)&&unseen(p).length>0,
        w: 1.2,
        cool: 3,
        title: "A road you have never taken",
        setup: (p,ctx)=>{const u=unseen(p),n=u.filter(r=>A.neighbors(p.realm).includes(r.id));ctx.rid=(n.length?A.pick(n):A.pick(u)).id},
        text: "A caravan leaves at dawn for {otherName}. You have never set foot there. The caravan master says there is room for one more who can carry a spear.",
        choices: [
          {
            t: "Go with the caravan",
            r: "Weeks on the road. A new realm, new food, new words.",
            fx: (p,ctx)=>(A.markSeen(p,ctx.rid),A.S.time=Math.max(0,A.S.time-1),A.trainSkill(p,"survival",3),A.trainSkill(p,"riding",2),p.happy=Math.min(100,p.happy+5),A.chance(.25)&&A.queue({type:"event",ev:A.pick(["road_pilgrim","hunt_beast","insult_fight"].filter(e=>A.EV[e]))}),`(You have now seen ${(p.seen||[]).length} realms.)`),
          },
          {
            t: "Go as the caravan's guide and get paid",
            check: {s:"tracking",s2:"survival",d:45},
            win: {
              r: "You earn your keep and the caravan master's respect.",
              fx: (p,ctx)=>{A.markSeen(p,ctx.rid),p.coin+=30,A.trainSkill(p,"tracking",3)},
            },
            lose: {
              r: "You lose the road twice. They still get there, no thanks to you.",
              fx: (p,ctx)=>{A.markSeen(p,ctx.rid)},
            },
          },
          {t:"Not this time",r:"The caravan leaves without you.",fx:{}},
        ],
      },
      {
        id: "pa_explorer_map",
        cond: (p,C)=>AM(p,C,"explorer")&&(p.seen||[]).length>=3&&C.literate(p),
        w: .8,
        cool: 6,
        title: "A map-maker's commission",
        text: "A cartographer in the capital wants first-hand notes on the roads, rivers and wells of the places you have seen. Real notes, not tavern stories.",
        choices: [
          {
            t: "Write it all down carefully",
            check: {s:"learning",s2:"survival",d:40},
            win: {
              r: "Your notes go into a great map. Your name is in the corner.",
              fx: {coin:60,fame:3,skill:{learning:2}},
            },
            lose: {r:"Your memory is worse than you thought. He pays less.",fx:{coin:15}},
          },
          {
            t: "Sell your notes to a merchant house instead",
            r: "Merchants pay more for roads than scholars do.",
            fx: {coin:90,skill:{trade:2}},
          },
        ],
      },
    ]);
    A.defEvents([
      {
        id: "pa_freedom_buy",
        cond: (p,C)=>C.adult(p)&&C.unfree(p)&&C.ambition(p,"freedom"),
        w: 1.3,
        cool: 3,
        title: "The price of freedom",
        text: p=>`Your ${p.flags.unfree==="slave"?"owner":"lord"} has named a price for your freedom: ${A.coin(p.flags.unfree==="slave"?120:60)}. It may as well be the moon. Unless.`,
        choices: [
          {
            t: "Pay it",
            req: p=>p.coin>=(p.flags.unfree==="slave"?120:60),
            r: "You count the coins out one by one. Then you walk out the gate, free.",
            fx: p=>(p.coin-=p.flags.unfree==="slave"?120:60,delete p.flags.unfree,["slave","serf"].includes(p.status)&&(p.status="peasant"),A.ach("freed"),A.willGrow(p,2,"freedom"),p.happy=Math.min(100,p.happy+15),"Free."),
          },
          {
            t: "Work extra nights to earn it",
            r: "Every night, a little more. The pile grows.",
            fx: {coin:12,sta:.5,health:-4},
          },
          {
            t: "Run",
            check: {s:"stealth",s2:"survival",d:55},
            win: {
              r: "Three nights through the marsh. Then a road, a town, a new name.",
              fx: p=>(delete p.flags.unfree,p.flags.outlaw=A.S.year,A.ach("escaped"),A.willGrow(p,2,"escape"),"(You are free — and wanted.)"),
            },
            lose: {r:"The dogs find you on the second day.",fx:{health:-20,cause:"the dogs",wil:2,happy:-10}},
          },
        ],
      },
      {
        id: "pa_freedom_kind_master",
        cond: (p,C)=>C.adult(p)&&C.unfree(p)&&C.ambition(p,"freedom"),
        w: .6,
        cool: 10,
        title: "A kind word",
        text: `Your master's old mother, who runs the household, watches you work. "You are wasted here," she says. "I could speak to my son."`,
        choices: [
          {
            t: "Ask her to speak for you",
            check: {s:"persuasion",s2:"etiquette",d:45},
            win: {
              r: "She speaks. He listens. At midwinter, he signs your freedom.",
              fx: p=>{delete p.flags.unfree,["slave","serf"].includes(p.status)&&(p.status="peasant"),A.ach("freed"),p.happy=Math.min(100,p.happy+15)},
            },
            lose: {r:"He refuses her. She apologizes to you, which no one has ever done.",fx:{wil:1,happy:2}},
          },
          {t:"Thank her, but rely on yourself",r:"You keep saving. Every coin.",fx:{wil:.5}},
        ],
      },
      {
        id: "pa_family_match",
        cond: (p,C)=>AM(p,C,"family")&&!C.married(p)&&C.ageAdj(p)<50,
        w: 1.2,
        cool: 3,
        title: "A matchmaker",
        text: p=>`The ${A.pick(["village matchmaker","temple's widow-aunt","family's busybody cousin"])} has a list and you are on it. Three candidates: one rich, one kind, one beautiful.`,
        choices: [
          {
            t: "Meet the rich one",
            r: "Comfortable, sensible, a good house. Love may come later.",
            fx: {lover:!0,coin:20},
          },
          {t:"Meet the kind one",r:"You laugh together the whole first evening.",fx:{lover:!0,happy:5}},
          {
            t: "Meet the beautiful one",
            r: "Breathtaking. Also exhausting. But breathtaking.",
            fx: {lover:!0,happy:3},
          },
        ],
      },
      {
        id: "pa_house_arms",
        cond: (p,C)=>C.adult(p)&&!!p.house&&!!(A.S.houses[p.house]||{}).founded&&!C.flag(p,"houseWords"),
        w: 1.3,
        once: !0,
        title: "Words for your house",
        text: "The herald who painted your arms asks the last question: what are the words of your house? The words go under the shield, on every banner, for every generation.",
        choices: [
          {
            t: '"We Made Ourselves"',
            r: "Proud and true.",
            fx: p=>{p.flags.houseWords="We Made Ourselves";const h=A.S.houses[p.house];h&&(h.words=p.flags.houseWords)},
          },
          {
            t: '"Steady Hands"',
            r: "Quiet and strong.",
            fx: p=>{p.flags.houseWords="Steady Hands";const h=A.S.houses[p.house];h&&(h.words=p.flags.houseWords)},
          },
          {
            t: '"Nothing Given, All Earned"',
            r: "Every heir will feel it.",
            fx: p=>{p.flags.houseWords="Nothing Given, All Earned";const h=A.S.houses[p.house];h&&(h.words=p.flags.houseWords)},
          },
          {
            t: '"Remember the Road"',
            r: "For where you came from.",
            fx: p=>{p.flags.houseWords="Remember the Road";const h=A.S.houses[p.house];h&&(h.words=p.flags.houseWords)},
          },
        ],
      },
      {
        id: "pa_house_mocked",
        cond: (p,C)=>C.adult(p)&&!!p.house&&!!(A.S.houses[p.house]||{}).founded,
        w: .8,
        cool: 8,
        title: "Upstarts",
        text: p=>`At a feast, an old lord asks loudly how many generations ${A.S.houses[p.house].name} has. "One? How charming." The table titters.`,
        choices: [
          {
            t: '"One more than yours will have, at this rate."',
            check: {s:"persuasion",s2:"int",d:45},
            win: {r:"The table roars. The old lord goes purple.",fx:{fame:3,newRel:{type:"rival",op:-30}}},
            lose: {r:"It comes out wrong. More tittering.",fx:{fame:-1}},
          },
          {
            t: "Smile. Old houses envy new money.",
            r: "You smile and drink his wine. He hates that more.",
            fx: {wil:.5},
          },
          {
            t: "Challenge him to settle it in the lists",
            r: "Old blood against new steel.",
            fx: {
              duel: {
                tier: 3,
                title: "the sneering old lord",
                opts: {kind:"duel",place:"the feast-hall lists",lethal:!1,toYield:!0,title:"Old house, new house"},
              },
            },
          },
        ],
      },
      {
        id: "pa_court_scandal",
        cond: (p,C)=>AM(p,C,"court"),
        w: 1,
        cool: 5,
        title: "A scandal to use",
        text: p=>`You learn that the ${A.pick(["Treasurer","Chancellor","Marshal"])} of ${A.realm(p.realm).short} is ${A.pick(["skimming the mint","in love with the queen's sister","secretly in debt to a foreign bank","selling army contracts"])}. A seat might open — if someone told the right person.`,
        choices: [
          {
            t: "Tell the crown",
            check: {s:"intrigue",s2:"persuasion",d:50},
            win: {
              r: "The crown is grateful. A seat opens. Your name is mentioned.",
              fx: p=>{const r=A.realm(p.realm),ru=r&&A.P(r.ruler);if(ru&&(p.rel[ru.id]||A.link(p,ru,"lord",0,"acquaint"),A.addOp(ru,p,15)),A.chance(.4)&&r){const seat=A.pick(Object.keys(A.COUNCIL));return r.council=r.council||{},r.council[seat]=p.id,p.office=seat,A.fame(p,5),`You are named ${A.COUNCIL[seat].name}!`}return""},
            },
            lose: {r:"The minister finds out who talked. A powerful enemy.",fx:{newRel:{type:"enemy",op:-50}}},
          },
          {
            t: "Blackmail the minister",
            check: {s:"intrigue",s2:"deception",d:55},
            win: {r:"The minister pays, and owes you, and hates you.",fx:{coin:150,honor:-6}},
            lose: {r:"The minister has friends with knives.",fx:{health:-15,cause:"hired knives",honor:-4}},
          },
          {t:"Keep it to yourself",r:"Knowledge kept is a coin unspent.",fx:{flag:"pa_secret_minister"}},
        ],
      },
      {
        id: "pa_throne_general",
        cond: (p,C)=>AM(p,C,"throne")&&(p.fame>=30||C.noble(p)||p.mil&&p.mil.rank>=5),
        w: .9,
        cool: 6,
        title: "A disgruntled general",
        text: p=>`A general of ${A.realm(p.realm).short}, passed over for the third time, drinks with you late and says: "If someone with a name moved, my men would follow." He is not joking.`,
        choices: [
          {
            t: "Bind him to you with an oath",
            check: {s:"persuasion",s2:"intrigue",d:50},
            win: {
              r: "He swears. You have an army in your pocket, if the day comes.",
              fx: {newRel:{type:"friend",op:40},fame:2,flag:"pa_general_sworn"},
            },
            lose: {r:"He sobers up and becomes very careful around you.",fx:{}},
          },
          {t:"Report him",r:"The crown rewards loyalty. The general hangs.",fx:{favor:15,honor:-3}},
          {t:"Change the subject",r:"Some words are better never heard.",fx:{}},
        ],
      },
      {
        id: "pa_expand_petition",
        cond: (p,C)=>C.ruler(p)&&C.ambition(p,"expand")&&nb(p).length>0,
        w: 1.1,
        cool: 5,
        title: "A province wants to join",
        setup: (p,ctx)=>{const n=nb(p).map(A.realm).filter(r2=>r2&&r2.alive&&!r2.isRebel&&A.realmProvs(r2.id).length>1),r=n.length?A.pick(n):A.realm(A.pick(nb(p)));ctx.rid=r.id;const pr=A.pick(A.realmProvs(r.id).filter(x=>x.id!==r.capitalProv&&x.adj.some(j=>A.S.prov[j].owner===p.ruler)))||A.pick(A.realmProvs(r.id).filter(x=>x.id!==r.capitalProv));ctx.prov=pr?pr.name:"",ctx.provId=pr?pr.id:-1},
        text: p=>"The burghers of {prov}, a province of {otherName}, send a secret delegation. They hate their lord's taxes. If your army appeared at their gates, they would open them.",
        choices: [
          {
            t: "Promise them your protection and march",
            r: "You come as a liberator. {other} calls it theft.",
            fx: (p,ctx)=>{const pr=A.prov(ctx.provId),r=A.realm(p.ruler);return pr&&pr.owner===ctx.rid?(A.transferProv(pr,r.id,!1),r.infamy=Math.min(100,(r.infamy||0)+8),A.addRel(r.id,ctx.rid,-40),A.chance(.6)&&A.startWar(ctx.rid,r.id,null,"reconquest"),`${pr.name} is yours.`):"By the time you arrive, the plot has been crushed."},
          },
          {
            t: "Buy the province from {otherRuler}",
            req: p=>(A.realm(p.ruler)||{}).treasury>=8e3,
            check: {s:"diplomacy",s2:"trade",d:55},
            win: {
              r: "Gold instead of blood. {otherRuler} needs the money more than the land.",
              fx: (p,ctx)=>{const pr=A.prov(ctx.provId),r=A.realm(p.ruler);pr&&pr.owner===ctx.rid&&(r.treasury-=8e3,A.transferProv(pr,r.id,!1),r.infamy=Math.max(0,(r.infamy||0)-4))},
            },
            lose: {r:"{otherRuler} is insulted by the offer.",fx:{realmRel:-10}},
          },
          {
            t: "Send them home — you keep your treaties",
            r: "The burghers leave disappointed. {otherRuler} hears of your honesty.",
            fx: {realmRel:12,honor:3},
          },
        ],
      },
      {
        id: "pa_golden_harvest",
        cond: (p,C)=>C.ruler(p)&&C.ambition(p,"golden"),
        w: 1,
        cool: 5,
        title: "A golden harvest",
        text: p=>`The best harvest in living memory. Barns overflow across ${A.realm(p.ruler).short}. What you do with a surplus decides what kind of ruler you are.`,
        choices: [
          {
            t: "Fill royal granaries against bad years",
            r: "Next famine will find the realm ready.",
            fx: {stability:5,treasury:-500,flag:"pa_granaries"},
          },
          {
            t: "Sell the surplus abroad",
            check: {s:"trade",s2:"stewardship",d:40},
            win: {r:"Foreign silver pours in.",fx:{treasury:4e3}},
            lose: {r:"Everyone had a good harvest. Prices crash.",fx:{treasury:800}},
          },
          {
            t: "Throw a festival for the whole realm",
            r: "A week of feasting. People will talk about it for twenty years.",
            fx: {stability:7,legit:4,fame:3,treasury:-1500},
          },
        ],
      },
      {
        id: "pa_web_marriage",
        cond: (p,C)=>C.ruler(p)&&C.ambition(p,"web")&&webC(p).length>0,
        w: 1,
        cool: 5,
        title: "An offer of friendship",
        setup: (p,ctx)=>{ctx.rid=A.pick(webC(p)).id},
        text: "{otherRuler} writes: an alliance with {otherName}, if you will send your heir to foster at their court for three years.",
        choices: [
          {
            t: "Send your heir",
            r: "A hostage and an ambassador at once. The alliance is sealed.",
            fx: {ally:!0,realmRel:20,legit:-2},
          },
          {
            t: "Counter-offer: gold instead of your heir",
            req: p=>(A.realm(p.ruler)||{}).treasury>=3e3,
            check: {s:"diplomacy",s2:"trade",d:50},
            win: {r:"They take the gold. Alliance sealed, heir at home.",fx:{ally:!0,treasury:-3e3}},
            lose: {r:"They are insulted. No alliance.",fx:{realmRel:-8}},
          },
          {t:"Decline",r:"You keep your heir and your freedom of action.",fx:{}},
        ],
      },
    ]);
    A.defEvents([
      {
        id: "pa_emigrant_homesick",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"emigrated")&&!!p.flags.homeland&&A.S.year-p.flags.emigrated<=8,
        w: 1,
        cool: 4,
        title: "Homesick",
        setup: (p,ctx)=>{ctx.home0=A.realmShort(p.flags.homeland)},
        text: p=>`A trader from {home0} sets up a stall in the market. The smell of ${A.pick(["the bread","the smoked fish","the spice cakes","the wool"])} from home hits you like a fist.`,
        choices: [
          {
            t: "Buy everything and talk until dark",
            r: "Old words in your mouth. You feel more yourself than you have in months.",
            fx: {coin:-5,happy:6},
          },
          {t:"Walk past — this is home now",r:"It hurts a little. Then less.",fx:{wil:1}},
          {
            t: "Ask about going back",
            r: "He says nothing has changed. You decide nothing has changed for you either: you are staying.",
            fx: {happy:2},
          },
        ],
      },
      {
        id: "pa_emigrant_foreigner",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"emigrated")&&A.S.year-p.flags.emigrated<=10,
        w: 1,
        cool: 5,
        title: "The foreigner",
        text: 'At the guild hall, at the temple, at the well: "Where are you from, again?" Your accent gives you away every time. Some are curious. Some are not friendly.',
        choices: [
          {
            t: "Learn the local tongue properly",
            check: {s:"int",s2:"wil",d:40},
            win: {
              r: "A year of practice. Now they only notice when you are tired.",
              fx: p=>{const L=GD.LANG_LIST.filter(l=>!p.langs.includes(l));if(L.length){const l=A.pick(L);return p.langs.push(l),`(You learn ${l}.)`}return""},
            },
            lose: {r:"Still the accent. Still the questions.",fx:{wil:.5}},
          },
          {
            t: "Wear your origins proudly",
            r: "You cook your own food and sing your own songs. Some neighbors start asking for the recipes.",
            fx: {happy:3,newRel:{type:"friend",op:25}},
          },
        ],
      },
      {
        id: "pa_retired_advice",
        cond: (p,C)=>C.flag(p,"retired"),
        w: 1,
        cool: 3,
        title: "The old one is consulted",
        text: "Your heir, who runs things now, comes to you at night with a problem they will not mention at the table. They still ask you. Of course they do.",
        choices: [
          {
            t: "Give your advice, then let them decide",
            r: "They take half your advice and do better than you would have. That is right.",
            fx: {happy:4,wil:.5},
          },
          {
            t: "Tell them exactly what to do",
            // [X1 baked patch events/33-no-obvious-choices CHOICE-PA-RETIRED-ADVICE] pa_retired_advice: telling them exactly
            // what to do ("It works") now earns the credit.
            r: "They do it. It works. They resent it a little.",
            fx: {happy:2,fame:1},
          },
        ],
      },
      {
        id: "pa_tourney_aftermath",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"hostTourney")&&A.S.year-p.flags.hostTourney<=1,
        w: 1,
        once: !0,
        title: "After the tourney",
        setup: (p,ctx)=>{const k=A.makeAcquaintance(p,"acquaint");k.occ="a young tourney knight",ctx.pid=k.id},
        text: "The tourney is over. The meadow is churned to mud, the stands are coming down, and a young knight who did very well is waiting outside your door, hoping for a place in your household.",
        choices: [
          {
            t: "Take {themHim} into your service",
            r: "A sword sworn to you. Loyal, hungry, talented.",
            fx: {them:{type:"friend",op:40},fame:1},
          },
          {
            t: "Send {themHim} to your liege with a letter",
            r: "A good word for a good knight. The liege notes your judgment.",
            fx: {favor:6,them:{op:15},owed:1},
          },
        ],
      },
      {
        id: "pa_academy_first_year",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"foundedAcademy")&&A.S.year-p.flags.foundedAcademy<=3,
        w: 1.2,
        once: !0,
        title: "The academy's first year",
        text: "Your academy's first year: the roof leaks, the lecturers quarrel about chairs, the students quarrel about everything. And yet. Every candle in the place is lit late.",
        choices: [
          {
            t: "Fix the roof and pay the lecturers more",
            req: p=>p.coin>=300,
            r: "Good teachers stay where they are treated well. The second year will be better.",
            fx: {coin:-300,fame:3,skill:{stewardship:2}},
          },
          {
            t: "Lecture yourself once a week",
            r: "The founder at the lectern. Students come from three towns to hear you.",
            fx: {fame:4,skill:{learning:3,persuasion:2}},
          },
        ],
      },
    ]);
  })();
})();
