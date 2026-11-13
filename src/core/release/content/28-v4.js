// The release's event pack 28 of 30 (15 events, mostly v4_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-027). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const arm = (p,k)=>!!p.mil&&p.mil.arm===k,
      doc = (p,k)=>!!p.mil&&p.mil.doctrine===k,
      mast = (p,k)=>!!p.job&&p.job.spec2===k,
      spec = p=>!!p.job&&!!p.job.spec;
    A.defEvents([
      {
        id: "v4_line_wall",
        cond: (p,C)=>C.adult(p)&&arm(p,"line")&&C.atWar(p),
        w: 1.2,
        cool: 4,
        title: "The shield wall",
        text: "Horsemen come at your company out of the morning mist, three ranks deep. The captain is down. Every man in the line is looking at you.",
        choices: [
          {
            t: '"Lock shields! Spears over!"',
            check: {s:"command",s2:"shield",d:48},
            win: {
              r: "The wall holds. Horses will not run onto a hedge of points; the charge breaks around you like water on a rock.",
              fx: {merit:14,fame:3,skill:{shield:3,command:2}},
            },
            lose: {
              r: "The wall bends but does not break. Barely. Men die on both sides of you.",
              fx: {merit:6,health:-12,cause:"a cavalry charge",wil:1.5},
            },
          },
          {
            t: "Fall back to the ditch behind you",
            check: {s:"tactics",s2:"int",d:42},
            win: {
              r: "Horses cannot cross the ditch. You can stab down at them. The ground does the work.",
              fx: {merit:10,skill:{tactics:3}},
            },
            lose: {
              r: "The retreat turns into a run. The run turns into a rout.",
              fx: {merit:-4,health:-10,cause:"a rout"},
            },
          },
        ],
      },
      {
        id: "v4_line_drill",
        cond: (p,C)=>C.adult(p)&&arm(p,"line")&&p.mil.rank>=2,
        w: .8,
        cool: 5,
        title: "Drill",
        text: "The new levy cannot keep step. In a real fight a line that cannot keep step dies. You have one month.",
        choices: [
          {
            t: "Drill them dawn to dusk",
            r: "They hate you. Then, one morning, they move like one animal.",
            fx: {skill:{command:3,spear:2},merit:5,sta:.5},
          },
          {
            t: "Teach them with songs",
            check: {s:"music",s2:"persuasion",d:35},
            win: {
              r: "A marching song with a filthy chorus. They will never forget the step now.",
              fx: {merit:6,skill:{command:2},happy:3},
            },
            lose: {r:"They sing badly and march worse.",fx:{merit:1}},
          },
        ],
      },
      {
        id: "v4_skirm_scout",
        cond: (p,C)=>C.adult(p)&&arm(p,"skirm")&&C.atWar(p),
        w: 1.2,
        cool: 4,
        title: "Eyes of the army",
        setup: (p,ctx)=>{const e=A.enemyRealmOf(p.mil.realm);ctx.enemy=e?A.realmShort(e):"the enemy"},
        text: "The general wants to know where {enemy}'s main body is camped. Three scouting parties went out. None came back.",
        choices: [
          {
            t: "Go yourself, at night, with two men",
            check: {s:"stealth",s2:"tracking",d:50},
            win: {
              r: "You count their fires from a hill until dawn and ride back with the numbers. The general looks at you differently.",
              fx: {merit:15,fame:2,skill:{stealth:3,tracking:2},bossOp:8},
            },
            lose: {
              r: "A picket sees you. You ride for your life with arrows in the dark.",
              fx: {health:-14,cause:"an arrow in the night",merit:4,wil:1},
            },
          },
          {
            t: "Take a prisoner and ask him",
            check: {s:"intimidation",s2:"stealth",d:45},
            win: {
              r: "A forager, alone at a stream. By noon he has told you everything.",
              fx: {merit:10,skill:{intimidation:2}},
            },
            lose: {r:"The forager fights. You have to kill him. He told you nothing.",fx:{merit:2,honor:-1}},
          },
        ],
      },
      {
        id: "v4_skirm_ambush",
        cond: (p,C)=>C.adult(p)&&arm(p,"skirm")&&p.mil.rank>=3&&C.atWar(p),
        w: 1,
        cool: 5,
        title: "The supply road",
        text: "An enemy supply column will pass through a wooded valley tomorrow. Forty wagons, a hundred guards. You have sixty skirmishers.",
        choices: [
          {t:"Ambush them in the narrows",r:"You set the trap.",fx:{mission:"war",merit:4}},
          {
            t: "Burn the bridge ahead of them instead",
            check: {s:"siegecraft",s2:"stealth",d:40},
            win: {
              r: "No fight, no losses. The column turns back. Their army goes hungry for a week.",
              fx: {merit:12,skill:{tactics:2}},
            },
            lose: {r:"The bridge only half burns. They fix it by noon.",fx:{merit:2}},
          },
        ],
      },
      {
        id: "v4_horse_charge",
        cond: (p,C)=>C.adult(p)&&arm(p,"horse")&&C.atWar(p),
        w: 1.2,
        cool: 4,
        title: "The moment",
        text: "From the hill you see it: the enemy's flank is open, their archers have no stakes in front of them. A charge now could break the whole wing. Nobody has ordered it.",
        choices: [
          {
            t: "Charge without orders",
            check: {s:"mounted",s2:"riding",d:50},
            win: {
              r: "You hit the archers like a hammer. Their wing collapses. The general does not know whether to hang you or knight you. He knights you — in his dispatch, at least.",
              fx: {merit:20,fame:5,skill:{mounted:3,lance:2}},
            },
            lose: {
              r: "The ground was softer than it looked. Horses go down. You come back with half your riders.",
              fx: {merit:-6,health:-16,cause:"a failed charge",wil:2},
            },
          },
          {
            t: "Send a rider for orders",
            r: "By the time the order comes, the moment is gone. Nobody blames you. Nobody remembers you either.",
            fx: {merit:2},
          },
        ],
      },
      {
        id: "v4_horse_remounts",
        cond: (p,C)=>C.adult(p)&&arm(p,"horse")&&p.mil.rank>=2,
        w: .8,
        cool: 6,
        title: "Lame horses",
        text: "Half your troop's horses are lame or sick. The quartermaster says there are no remounts. A horse-dealer in the village says there are — for a price.",
        choices: [
          {
            t: "Pay the dealer from your own purse",
            req: p=>p.coin>=60,
            r: "Fresh horses. Your men will ride through fire for you now.",
            fx: {coin:-60,merit:6,rel:{who:"comrade",op:10,all:!0}},
          },
          {
            t: "Requisition them in the realm's name",
            check: {s:"intimidation",s2:"etiquette",d:40},
            win: {r:"The dealer grumbles and hands them over against a paper promise.",fx:{merit:5}},
            lose: {
              r: "The dealer complains to your superior. You get the horses and a reprimand.",
              fx: {merit:2,bossOp:-6},
            },
          },
          {
            t: "Nurse the horses yourself",
            check: {s:"husbandry",s2:"riding",d:40},
            win: {r:"Hot poultices and patience. Most of them recover.",fx:{merit:4,skill:{husbandry:3}}},
            lose: {r:"Three die anyway.",fx:{merit:1}},
          },
        ],
      },
      {
        id: "v4_bow_volley",
        cond: (p,C)=>C.adult(p)&&arm(p,"bow")&&C.atWar(p),
        w: 1.2,
        cool: 4,
        title: "Range",
        text: "The enemy foot are advancing across the field at a slow walk, shields up. Your archers are nervous and want to loose now. They are still out of good range.",
        choices: [
          {
            t: '"Hold. Hold. Hold..."',
            check: {s:"command",s2:"bow",d:45},
            win: {
              r: "At sixty paces you give the word. The first volley lands like hail on a roof. Their advance falters and stops.",
              fx: {merit:14,skill:{bow:3,command:2},fame:2},
            },
            lose: {r:"Someone looses early and the whole line follows. Arrows wasted on mud.",fx:{merit:2,wil:1}},
          },
          {
            t: "Loose at long range to break their nerve",
            r: "Most arrows fall short. A few hit. It does not stop them.",
            fx: {merit:4,skill:{bow:1}},
          },
        ],
      },
      {
        id: "v4_bow_contest",
        cond: (p,C)=>C.adult(p)&&arm(p,"bow")&&!C.atWar(p),
        w: .7,
        cool: 6,
        title: "The butts",
        text: "The army holds an archery contest at the butts: a silver arrow for the best of a thousand bowmen.",
        choices: [
          {
            t: "Enter",
            check: {s:"bow",s2:"ins",d:55},
            win: {
              r: "Your last arrow splits the peg. The silver arrow is yours.",
              fx: {fame:4,merit:6,coin:20,skill:{bow:2}},
            },
            lose: {r:"You place in the twenties. Respectable. Forgettable.",fx:{skill:{bow:2}}},
          },
          {
            t: "Bet on the winner instead",
            check: {s:"gambling",s2:"int",d:45},
            win: {r:"You pick the quiet one from the north. He wins. So do you.",fx:{coin:30}},
            lose: {r:"Your man misses the last target.",fx:{coin:-10}},
          },
        ],
      },
      {
        id: "v4_eng_mine",
        cond: (p,C)=>C.adult(p)&&arm(p,"engineers")&&C.atWar(p),
        w: 1.2,
        cool: 4,
        title: "Under the wall",
        text: "The castle will not fall to stones. You propose a mine: a tunnel under the corner tower, propped with timber, then fired. It will take a month, if the defenders do not dig a counter-mine.",
        choices: [
          {
            t: "Dig the mine",
            check: {s:"siegecraft",s2:"craft",d:50},
            win: {
              r: "The props burn, the tower slumps, a breach opens. The storming parties go in over the rubble. Your name is in every dispatch.",
              fx: {merit:18,fame:4,skill:{siegecraft:4}},
            },
            lose: {
              r: "The defenders break into your tunnel. A brutal fight in the dark with knives and shovels.",
              fx: {
                duel: {
                  tier: 2,
                  title: "a counter-miner",
                  opts: {kind:"brawl",place:"a mine under the walls",lethal:!0,toYield:!1,title:"Fight in the tunnel"},
                },
                merit: 4,
              },
            },
          },
          {
            t: "Build a trebuchet instead — slower, safer",
            r: "Weeks of stone. The wall cracks eventually.",
            fx: {merit:7,skill:{siegecraft:2}},
          },
        ],
      },
      {
        id: "v4_doc_council",
        cond: (p,C)=>C.adult(p)&&!!p.mil&&p.mil.rank>=5&&!!p.mil.doctrine&&C.atWar(p),
        w: 1,
        cool: 4,
        title: "The war council",
        text: p=>`The war council argues late into the night. ${doc(p,"shock")?"You want to attack. The old marshal wants to wait.":doc(p,"shield")?"They want to attack. You want to make the enemy come to you.":doc(p,"supply")?"They argue about battle plans. You ask how the army will eat in three weeks.":"They want a battle in the field. You want the enemy's fortress and the roads it guards."} All eyes turn to you.`,
        choices: [
          {
            t: "Argue for your doctrine",
            check: {s:"tactics",s2:"persuasion",d:52},
            win: {
              r: "The council comes round. The plan is yours. If it fails, so do you.",
              fx: {merit:12,fame:2,skill:{tactics:3}},
            },
            lose: {r:"The marshal overrules you, coldly.",fx:{merit:2,bossOp:-4}},
          },
          {
            t: "Hold your tongue and watch",
            r: "You learn more about the council than about war.",
            fx: {skill:{intrigue:2}},
          },
        ],
      },
      {
        id: "v4_doc_supply",
        cond: (p,C)=>C.adult(p)&&doc(p,"supply"),
        w: .8,
        cool: 6,
        title: "Bread",
        text: "You find the army's grain contractor selling half the bread twice — once to the army, once to the town.",
        choices: [
          {t:"Hang him",r:"The bread arrives on time after that, every day.",fx:{merit:6,honor:-1}},
          {
            t: "Make him pay it all back — and keep him",
            check: {s:"stewardship",s2:"intimidation",d:45},
            win: {
              r: "He pays, and becomes the most honest contractor in the realm. Out of fear.",
              fx: {merit:8,coin:40,skill:{logistics:2}},
            },
            lose: {r:"He flees with the money.",fx:{merit:1}},
          },
        ],
      },
      {
        id: "v4_mast_name",
        cond: (p,C)=>C.adult(p)&&mast(p,"name"),
        w: 1,
        cool: 5,
        title: "Your name on other people's work",
        text: p=>`A ${A.pick(["workshop in the next town","rival in the guild","peddler at the fair"])} is selling cheap work stamped with your mark. Your name is your trade. This is theft.`,
        choices: [
          {
            t: "Take them before the guild court",
            check: {s:"persuasion",s2:"learning",d:45},
            win: {
              r: "The court fines them and breaks the false stamp in public. Your mark means more than ever.",
              fx: {rep:6,fame:1},
            },
            lose: {r:"The court shrugs. Copies keep coming.",fx:{rep:-3}},
          },
          {
            t: "License your mark to them — for a fee",
            r: "If they want your name, they can pay for it. They do.",
            fx: {coin:60,rep:-2},
          },
        ],
      },
      {
        id: "v4_mast_purse",
        cond: (p,C)=>C.adult(p)&&mast(p,"purse")&&p.coin>=200,
        w: 1,
        cool: 5,
        title: "Money makes money",
        text: "A banker offers to hold your savings and pay you a tenth a year — or you could buy into a ship, a mill, a mine share.",
        choices: [
          {
            t: "Bank it",
            r: "Safe, slow, sure. Mostly.",
            fx: p=>{const amt=Math.round(p.coin*.3);p.coin+=A.chance(.9)?Math.round(amt*.1):-Math.round(amt*.5)},
          },
          {
            t: "Buy a share in a mill",
            req: p=>p.coin>=300,
            r: "Flour every year, money every year.",
            fx: {coin:-300,asset:"workshop"},
          },
          {t:"Keep it in a chest",r:"Nobody can cheat a chest. Rats can, though.",fx:{}},
        ],
      },
      {
        id: "v4_mast_mentor",
        cond: (p,C)=>C.adult(p)&&mast(p,"mentor")&&((p.job&&p.job.apprentices||[]).length>0||C.hasRel(p,"student")),
        w: 1,
        cool: 5,
        title: "The best pupil",
        setup: (p,ctx)=>{const ids=(p.job.apprentices||[]).filter(id=>A.P(id)&&A.P(id).alive),s=A.relsOf(p,["student"]).find(x=>x.p.alive);ctx.pid=ids.length?ids[0]:s?s.p.id:A.makeAcquaintance(p,"student").id},
        text: "{them} has made something on {theirHis} own: better than anything you made at that age. {theyHe} waits for your verdict, not breathing.",
        choices: [
          {
            t: "Praise it to the whole guild",
            r: "{them} glows for a month and works twice as hard for a year.",
            fx: {them:{op:25},rep:3,happy:4},
          },
          {
            t: "Point out every flaw",
            r: "{them} goes white, then goes back to the bench. The next one is perfect.",
            // [X1 baked patch events/33-no-obvious-choices CHOICE-V4-MAST-MENTOR] v4_mast_mentor: pointing out every flaw
            // ("The next one is perfect") now shows in your own merit.
            fx: {them:{op:-5},rep:2,merit:4},
          },
        ],
      },
      {
        id: "v4_path_rival",
        cond: (p,C)=>C.adult(p)&&spec(p),
        w: .8,
        cool: 7,
        title: "Two masters",
        setup: (p,ctx)=>{const s=A.specOf(p);ctx.path=s?s.n.toLowerCase():"your line of work",ctx.pid=A.makeAcquaintance(p,"rival").id},
        text: "{themFull} has the same path as you — {path} — and the same clients. The town is not big enough for both of you, says everyone, loudly.",
        choices: [
          {
            t: "Outdo {themHim}",
            check: {s:"int",s2:"wil",d:48},
            win: {
              r: "A year of your best work. Clients drift your way. {them} moves to the next town.",
              fx: {rep:7,them:{type:"rival",op:-20}},
            },
            lose: {
              r: "{them} wins the big commission. You grind your teeth.",
              fx: {rep:-2,them:{type:"rival",op:-15},wil:1},
            },
          },
          {
            t: "Propose a partnership",
            check: {s:"persuasion",s2:"trade",d:45},
            win: {
              r: "Two masters, one shop, twice the work. It works, mostly.",
              fx: {rep:4,coin:50,them:{type:"friend",op:30}},
            },
            lose: {r:"{them} laughs you out of the door.",fx:{them:{type:"rival",op:-10}}},
          },
          {
            t: "Split the town: you take the rich, {theyHe} the rest",
            r: "An agreement over ale. It holds for years.",
            fx: {them:{type:"acquaint",op:10},rep:1},
          },
        ],
      },
    ]);
  })();
})();
