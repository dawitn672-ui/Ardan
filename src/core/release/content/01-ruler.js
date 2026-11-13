// The release's event pack 1 of 30 (57 events, mostly ruler_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-027). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  const huntOfficer=p=>p.mil&&!p.mil.merc&&p.mil.rank>=3||!!p.ruler||p.noble&&p.noble.rung>=3;
  A.defEvents([
    {
      id: "deed_name",
      trigger: !0,
      title: "A name of your own",
      text: p=>`Among your people a grown ${p.sex==="F"?"woman":"man"} needs a deed-name. The ${p.race==="orc"||p.race==="halforc"?"clan-mothers":"elders"} gather at the fire. What deed will you lay before them?`,
      choices: [
        {
          t: "Ride down a wild stallion and break it bare-handed",
          check: {s:"riding",s2:"str",d:40},
          win: {
            r: "The stallion throws you four times. The fifth time, it stays under you. The fire roars your new name.",
            fx: p=>(p.epithet=A.pick(["Mareborn","Hoofbreaker","Redmare","Dustrider"]),A.ach("epithet"),`You are ${A.fullName(p)}.`),
          },
          lose: {
            r: "The stallion breaks two of your ribs and runs off. The clan-mothers give you a name anyway — a mocking one.",
            fx: p=>(p.epithet=A.pick(["Mudfall","Brokenrib","Twice-Thrown"]),A.addWound(p,"broken_ribs"),A.willGrow(p,2),`You are ${A.fullName(p)}. Earn a better one.`),
          },
        },
        {
          t: "Hunt a cave hyena alone and bring back its head",
          check: {s:"survival",s2:"ins",d:45},
          win: {
            r: "You come back with the head and a bite on your arm. A good name for a good hunt.",
            fx: p=>(p.epithet=A.pick(["Wolfrider","Steadyhand","Ashbrow","Smokehide"]),A.addWound(p,"bite"),A.ach("epithet"),`You are ${A.fullName(p)}.`),
          },
          lose: {
            r: "The hyenas hunt you instead. You come back bloody and empty-handed.",
            fx: p=>(p.health-=15,p.epithet="Hyena-Fed",A.willGrow(p,2),`They call you ${p.epithet}. It stings.`),
          },
        },
        {
          t: "Win the wrestling ring at the clan gathering",
          check: {s:"unarmed",s2:"str",d:42},
          win: {
            r: "You throw six opponents in a row.",
            fx: p=>(p.epithet=A.pick(["Stonefist","Bonecount","Thirdwave","Drumheart"]),A.ach("epithet"),`You are ${A.fullName(p)}.`),
          },
          lose: {
            r: "A girl half your size throws you on your back in front of everyone.",
            fx: p=>(p.epithet="Flatback",A.willGrow(p,1.5),"The name sticks. For now."),
          },
        },
        {
          t: "Ask the drum-masters to name you for your mother's deeds",
          r: "They name you for your line. Not your own glory, but no shame either.",
          fx: p=>(p.epithet=A.culture(p.cult).epi.length?A.pick(A.culture(p.cult).epi):"Steadyhand",`You are ${A.fullName(p)}.`),
        },
      ],
    },
    {
      id: "tavern_brawl",
      trigger: !0,
      title: "A tavern brawl",
      text: "A big drunk with a broken nose spills your ale and laughs about it. The room goes quiet, waiting.",
      choices: [
        {
          t: "Break his nose again",
          check: {s:"unarmed",s2:"str",d:42},
          win: {
            r: "One punch. He goes down like a sack of turnips. Someone buys you a drink.",
            fx: {fame:1,str:.4,happy:4},
          },
          lose: {
            r: "He hits like a mule. You wake up in the gutter.",
            fx: {health:-10,wil:1,happy:-4,wound:"broken_nose"},
          },
        },
        {
          t: "Laugh it off and buy him a drink",
          check: {s:"diplomacy",s2:"int",d:35},
          win: {
            r: "He roars with laughter. By midnight you are singing together.",
            fx: {newRel:{type:"friend",op:25}},
          },
          lose: {r:"He takes your drink and your dignity.",fx:{happy:-3}},
        },
        {t:"Walk out",r:"You leave. Some fights are not worth having.",fx:{}},
      ],
    },
    {
      id: "tavern_stranger",
      trigger: !0,
      title: "A stranger at the inn",
      text: ()=>`A traveler in a dusty cloak sits alone, nursing wine. ${A.pick(["A sword hangs at his hip, wrapped in old leather.","He has the hands of a scribe and the eyes of a soldier.","She speaks with a far-off accent and watches the door."])}`,
      choices: [
        {
          t: "Sit down and ask for news",
          check: {s:"diplomacy",s2:"int",d:35},
          win: {
            r: p=>{const n=A.S.news[A.ri(0,Math.min(6,A.S.news.length-1))];return`The stranger talks of far places. ${n?"News: "+n.t:"War in the south, plague in the ports."}`},
            fx: {int:.5},
          },
          lose: {r:"The stranger looks at you and says nothing at all.",fx:{}},
        },
        {
          t: "Ask about the sword",
          check: {s:"ins",s2:"diplomacy",d:45},
          win: {
            r: "An old mercenary. He shows you a trick with the wrist that nobody in your town knows.",
            fx: {skill:{sword:4},ins:.6},
          },
          lose: {r:'"Ask again and see it closer." You do not ask again.',fx:{happy:-2}},
        },
        {t:"Ignore them",r:"You keep to your own table.",fx:{}},
      ],
    },
    {
      id: "tavern_song",
      trigger: !0,
      title: "Songs at the inn",
      text: p=>{const s=A.pick(LORE.songs);return s?`The singer strikes up "${s[0]}" (${s[1]})

“${s[2]}”`:"The singer strikes up an old song."},
      choices: [
        {
          t: "Sing along at the top of your lungs",
          r: "Everyone sings. For one evening the world is good.",
          fx: {happy:6,skill:{music:2}},
        },
        {
          t: "Ask the singer what really happened",
          check: {s:"learning",s2:"int",d:35},
          win: {
            r: '"The songs are rarely what happened," the singer says, and tells you the truth of it. You understand your world a little better.',
            fx: {int:.8},
          },
          lose: {r:`The singer shrugs. "It's a song, not a chronicle."`,fx:{}},
        },
        {
          t: "Learn the tune",
          check: {s:"music",s2:"int",d:30},
          win: {r:"You learn the tune by heart.",fx:{skill:{music:5}}},
          lose: {r:"You hum it wrong all the way home.",fx:{skill:{music:1}}},
        },
      ],
    },
    {
      id: "tavern_dice",
      trigger: !0,
      title: "Dice in the back room",
      text: 'In the back room, men throw dice for real money. One of them waves you over. "Ten suns to sit."',
      choices: [
        {
          t: "Sit and play (10 suns)",
          req: p=>p.coin>=10,
          check: {s:"int",s2:"ins",d:50},
          win: {r:"The dice love you tonight. You walk out 30 suns richer.",fx:{coin:30,happy:5}},
          lose: {r:"You lose your stake and then some.",fx:{coin:-15,happy:-5}},
        },
        {
          t: "Watch for cheats",
          check: {s:"ins",s2:"intrigue",d:45},
          win: {r:"You spot loaded dice. The house man pays you to keep quiet.",fx:{coin:12,skill:{intrigue:3}}},
          lose: {r:"You see nothing but other men's money changing hands.",fx:{}},
        },
        {t:"Decline",r:"You keep your purse closed.",fx:{}},
      ],
    },
    {
      id: "tavern_rumor",
      trigger: !0,
      title: "Rumors",
      text: ()=>`Two men whisper over their cups: "${A.pick(LORE.secrets).pub}" One snorts. "That's what they want you to think. The truth is something else."`,
      setup: (p,ctx)=>{ctx.sec=A.ri(0,LORE.secrets.length-1)},
      choices: [
        {
          t: "Lean in and listen",
          check: {s:"intrigue",s2:"ins",d:55},
          win: {
            r: (p,ctx)=>{const s=LORE.secrets[ctx.sec||0];return p.flags.knows=p.flags.knows||{},`You hear more than you should. ${s.title}: ${s.truth}`},
            fx: {skill:{intrigue:3}},
          },
          lose: {r:"They notice you and change the subject.",fx:{}},
        },
        {t:"Mind your own business",r:"Secrets get people killed.",fx:{}},
      ],
    },
    {
      id: "tavern_recruit",
      trigger: !0,
      title: "The recruiting sergeant",
      text: p=>`A recruiting sergeant buys drinks for every young ${p.sex==="F"?"woman and man":"man"} in the room. "The pay is a sun a day and all the glory you can carry. Who's for ${A.realmShort(p.realm)}?"`,
      choices: [
        {
          t: "Take the coin and enlist",
          req: p=>!p.mil&&A.isAdult(p)&&!p.flags.unfree,
          r: "You drink the sergeant's ale and put your mark on the roll.",
          fx: p=>{const r=A.enlist(p,!1);return r.ok?"":r.msg},
        },
        {
          t: "Drink his ale and slip away",
          check: {s:"stealth",s2:"spd",d:35},
          win: {r:"Free ale, no oath. A good night.",fx:{happy:4}},
          lose: {
            r: "You wake up in a wagon with a spear in your lap. Somebody put your mark on the roll for you.",
            fx: p=>!p.mil&&A.isAdult(p)&&!p.flags.unfree?(A.enlist(p,!1),"You are a soldier now, like it or not."):"",
          },
        },
        {t:"Refuse",r:"The sergeant shrugs and moves on to the next table.",fx:{}},
      ],
    },
    {
      id: "festival_day",
      trigger: !0,
      title: "Feast day",
      text: ()=>`It is ${A.pick(GD.FESTIVALS)[0]}. ${A.pick(["Bonfires, music and roasting meat.","The whole town is in the square.","Garlands on every door, ale in every hand.","Priests parade, children run wild, everyone is a little drunk."])}`,
      choices: [
        {
          t: "Dance",
          check: {s:"spd",s2:"diplomacy",d:30},
          win: {
            r: "You dance until the stars come out. Someone catches your eye.",
            fx: {happy:6,newRel:{type:"friend",op:25}},
          },
          lose: {r:"You tread on every foot in the square.",fx:{happy:2,looks:-1}},
        },
        {
          t: "Enter the wrestling",
          check: {s:"unarmed",s2:"str",d:40},
          win: {r:"You win a ham and the crowd's cheers.",fx:{fame:2,happy:5,str:.4}},
          lose: {r:"You eat dirt in front of the whole town.",fx:{happy:-2,wil:.6}},
        },
        {t:"Light a candle and pray",r:"The old rites calm you.",fx:{piety:4,happy:3}},
        {t:"Eat and drink too much",r:"Glorious. You regret nothing until morning.",fx:{happy:7,health:-3}},
      ],
    },
    {
      id: "meet_love",
      trigger: !0,
      setup: (p,ctx)=>{if(!ctx.pid||!A.P(ctx.pid)){const l=A.makeLoveInterest(p);ctx.pid=l.id}},
      title: "Someone catches your eye",
      text: (p,ctx)=>{const t=A.P(ctx.pid);return t?`${A.fullName(t)}, ${A.age(t)}, ${t.occ}. ${GD.RACES[t.race].adj!==GD.RACES[p.race].adj?"A "+GD.RACES[t.race].adj+" "+A.manWoman(t)+". ":""}${t.looks>75?"Beautiful — the kind of face that stops conversations.":t.looks>50?"A warm face and a quick smile.":"Not handsome, but something in the eyes holds you."} ${A.cap(A.he(t))} ${A.pick(["is laughing with friends at the well.","is haggling hard at the market.","is reading — reading! — on a bench.","is mending a net by the shore.","is fixing a cart wheel with grim determination."])}`:"Someone catches your eye."},
      choices: [
        {
          t: "Walk over and talk",
          check: {s:"diplomacy",s2:"int",d:40,bonus:p=>p.looks/4-12},
          win: {
            r: "The talk is easy. You arrange to meet again.",
            fx: {them:{type:"lover",op:35,back:"lover"},happy:8},
          },
          lose: {
            r: "You say something stupid. They smile politely and leave.",
            fx: {them:{type:"acquaint",op:5},happy:-3},
          },
        },
        {
          t: "Ask a friend to introduce you",
          check: {s:"diplomacy",s2:"wil",d:32},
          win: {r:"A proper introduction. They seem pleased.",fx:{them:{type:"friend",op:25}}},
          lose: {r:"Your friend makes a mess of it.",fx:{them:{type:"acquaint",op:0}}},
        },
        {t:"Admire them from afar",r:"You watch, and they never know.",fx:{happy:1}},
      ],
    },
    {
      id: "dice_cheat",
      trigger: !0,
      title: "Caught cheating?",
      text: 'The man across from you grabs your wrist. "These bones are loaded." They are not — but everyone is staring.',
      choices: [
        {
          t: "Stay calm and prove it",
          check: {s:"int",s2:"diplomacy",d:45},
          win: {r:"You roll the bones again and again. They are honest. The accuser slinks off.",fx:{honor:3}},
          lose: {r:"Nobody believes you. You are thrown out and your stake kept.",fx:{coin:-10,honor:-4}},
        },
        {
          t: "Punch him",
          check: {s:"unarmed",s2:"str",d:45},
          win: {r:"He goes down. Nobody else accuses you of anything.",fx:{fame:1}},
          lose: {r:"His friends join in.",fx:{health:-12,wil:.8}},
        },
      ],
    },
    {
      id: "explore_ruin",
      trigger: !0,
      title: "A ruin in the wilds",
      text: ()=>`You find ${A.pick(["the broken walls of a Solen road station, choked with ivy","a burned manor nobody remembers","a ring of standing stones","an old watchtower with its stair half gone","a temple of a god nobody prays to anymore"])}.`,
      choices: [
        {
          t: "Search it carefully",
          check: {s:"ins",s2:"int",d:45},
          win: {
            r: p=>{const g=A.ri(8,60);return p.coin+=g,`Under a fallen stone: a clay pot of old coins, ${A.coin(g)}.`},
            fx: {int:.3},
          },
          lose: {r:"A floor gives way. You fall into a cellar and twist a knee.",fx:{health:-12}},
        },
        {
          t: "Copy the inscriptions",
          req: p=>p.literate,
          r: "Old Solen letters, half worn away. A scholar would pay for this.",
          fx: {skill:{learning:4},coin:15},
        },
        {t:"Leave it alone",r:"Some places are better left.",fx:{}},
      ],
    },
    {
      id: "explore_cave",
      trigger: !0,
      title: "A cave",
      text: "A cave mouth breathes cold air at you. Bones at the entrance. Not all of them are old.",
      choices: [
        {
          t: "Go in with a torch",
          check: {s:"wil",s2:"ins",d:48},
          win: {
            r: p=>{const g=A.ri(10,80);return p.coin+=g,`Deep inside you find a dead traveler's pack: ${A.coin(g)} and a good knife.`},
            fx: {wil:.6},
          },
          lose: {r:"Something lives in there. You run.",fx:{health:-10,wil:1}},
        },
        {
          t: "Wait outside to see what comes out",
          check: {s:"ins",s2:"survival",d:40},
          win: {
            r: p=>A.beastsNear(p).length?"At dusk, a shape. You note its tracks and leave before it notices you.":"Nothing comes out but bats.",
            fx: {skill:{survival:3}},
          },
          lose: {r:"You fall asleep. You wake to breath on your neck — and run.",fx:{happy:-4}},
        },
      ],
    },
    {
      id: "explore_road",
      trigger: !0,
      title: "An old road",
      text: "An overgrown road of fitted stones runs where no road should be, straight as an arrow into the hills.",
      choices: [
        {
          t: "Follow it",
          check: {s:"sta",s2:"survival",d:40},
          win: {
            r: "It leads to a hidden valley with a spring and a shepherd who has never seen a tax-man. You mark it on your memory.",
            fx: {skill:{survival:4},happy:4},
          },
          lose: {r:"It leads into a bog. You lose a boot.",fx:{health:-5}},
        },
        {t:"Turn back",r:"The road will be there another day.",fx:{}},
      ],
    },
    {
      id: "explore_lair",
      trigger: !0,
      title: "A lair",
      // [X1 baked patch events/79-beast-scenes BEAST-LAIR] explore_lair drew one beast for its text and another for its
      // fight, so the signs could be a wyrm's and the fight a bear's; the text's draw also ran while the screen was
      // drawn. The text now names the beast the setup chose. With no beast near (the setup fell back to a cave bear,
      // CRE-25, wherever it was) the scene is skipped.
      text: (p,ctx)=>{const id=ctx&&ctx.beast,c=id?LORE.creatures.find(x=>x.id===id):null;return c?`Scat, scratch marks, a stink like a butcher's yard. The signs of ${c.name}. Locals say: "${c.belief}"`:"Bones and a stink like a butcher's yard. Something big lives here."},
      // [X1 baked patch events/79-beast-scenes BEAST-LAIR] explore_lair drew one beast for its text and another for its
      // fight, so the signs could be a wyrm's and the fight a bear's; the text's draw also ran while the screen was
      // drawn. The text now names the beast the setup chose. With no beast near (the setup fell back to a cave bear,
      // CRE-25, wherever it was) the scene is skipped.
      setup: (p,ctx)=>{const n=A.beastsNear(p);n.length?ctx.beast=A.pick(n):ctx.skip=1},
      choices: [
        {t:"Wait for it and fight",r:"You wait in the brush, weapon ready.",fx:{beast:{place:"its lair"}}},
        {
          t: "Study it from hiding",
          check: {s:"stealth",s2:"ins",d:48},
          win: {
            r: (p,ctx)=>{const c=LORE.creatures.find(x=>x.id===ctx.beast);return`You watch it for a day. ${c&&c.weak?"You learn: "+c.weak:""}`},
            fx: {skill:{survival:5},ins:.6},
          },
          lose: {r:"It smells you. You run for your life.",fx:{health:-8,spd:.4}},
        },
        {t:"Get away from here",r:"You leave quietly.",fx:{}},
      ],
    },
    {
      id: "explore_battlefield",
      trigger: !0,
      title: "An old battlefield",
      text: ()=>{const w=A.pick(LORE.wars);return`Bones in the grass, rusted mail, a broken standard. The locals say men died here in ${w[1]} (${w[4]}).`},
      choices: [
        {
          t: "Search for anything worth taking",
          check: {s:"ins",s2:"str",d:40},
          win: {
            r: p=>{const g=A.ri(10,50);return p.coin+=g,`A ring, a buckle, an old sword worth ${A.coin(g)} to a smith.`},
            fx: {},
          },
          lose: {r:"Only rust and bones.",fx:{}},
        },
        {t:"Bury what bones you can",r:"It takes all day. It feels right.",fx:{honor:3,piety:3,wil:.5}},
      ],
    },
    {
      id: "child_fight",
      trigger: !0,
      title: "A fight in the lane",
      text: ()=>`A bigger child, ${A.pick(["the tanner's son","the reeve's daughter","a bully from the next street","the miller's boy"])}, pushes you into the mud and laughs.`,
      choices: [
        {
          t: "Fight back",
          check: {s:"str",s2:"wil",d:25},
          win: {r:"You knock the bully flat. Nobody pushes you again.",fx:{wil:1.2,fame:1,trait:"brave"}},
          lose: {r:"You get a bloody nose and a lesson.",fx:{wil:1.5,health:-5}},
        },
        {t:"Tell an adult",r:"The bully gets a whipping. You get a name as a tattler.",fx:{happy:-2}},
        {t:"Walk away",r:"You go home muddy, and think about it for a long time.",fx:{wil:.4}},
      ],
    },
    {
      id: "child_dare",
      trigger: !0,
      title: "A dare",
      text: ()=>`The other children dare you to ${A.pick(["climb the old church tower","swim across the millpond","steal an apple from the reeve's orchard","touch the hanged man at the crossroads","spend a night in the haunted barn"])}.`,
      choices: [
        {
          t: "Do it",
          check: {s:"wil",s2:"spd",d:22},
          win: {r:"You do it, and the others look at you differently now.",fx:{wil:1,fame:1,happy:4}},
          lose: {r:"It goes wrong. You are hurt and in trouble.",fx:{health:-10,wil:1,rel:{who:"father",op:-4}}},
        },
        {t:"Refuse",r:'"Coward," they chant. It stings for weeks.',fx:{happy:-4}},
      ],
    },
    {
      id: "child_lost",
      trigger: !0,
      title: "Lost",
      text: "Following a butterfly, then a stream, then nothing: you are lost in the woods, and it is getting dark.",
      choices: [
        {
          t: "Follow the stream downhill",
          check: {s:"int",s2:"survival",d:20},
          win: {r:"The stream leads to the mill. Home by supper, in trouble but alive.",fx:{skill:{survival:2}}},
          lose: {r:"You spend a terrible night under a tree before the dogs find you.",fx:{wil:1.5,health:-6}},
        },
        {
          t: "Stay put and shout",
          r: "Your father finds you at midnight. He holds you very tight.",
          fx: {rel:{who:"father",op:6}},
        },
      ],
    },
    {
      id: "insult_fight",
      trigger: !0,
      setup: (p,ctx)=>{(!ctx.pid||!A.P(ctx.pid))&&(ctx.pid=A.makeAcquaintance(p,"rival").id)},
      title: "Words have a price",
      text: (p,ctx)=>`${(A.P(ctx.pid)||{}).given||"They"} will not let your insult go. Fists are coming up.`,
      choices: [
        {
          t: "Fight",
          r: "So be it.",
          fx: (p,ctx)=>{const t=A.P(ctx.pid);t&&A.startDuelFront(p,t,{kind:"brawl",place:"the street",lethal:!1,toYield:!0,title:"Brawl"})},
        },
        {t:"Back down and apologize",r:"You eat your words. They taste bad.",fx:{honor:-3,them:{op:8}}},
      ],
    },
    {
      id: "gallows",
      trigger: !0,
      title: "The gallows",
      text: "Dawn. A cart, a crowd, a rope. A priest mumbles. The hangman checks the knot.",
      choices: [
        {
          t: "Plead for mercy",
          check: {s:"diplomacy",s2:"wil",d:55},
          win: {
            r: "At the last moment a messenger rides in: your sentence is commuted to years in the cells.",
            fx: {prison:5,why:"a commuted death sentence",wil:3},
          },
          lose: {r:"The crowd jeers. The cart moves.",fx:{die:"hanging"}},
        },
        {
          t: "Break free and run",
          check: {s:"spd",s2:"str",d:62},
          win: {
            r: "You smash the guard's nose with your head and run through the crowd. You are an outlaw now — but a living one.",
            fx: p=>{p.flags.outlaw=!0,A.ach("outlaw"),A.ach("escaped"),A.exile(p),A.willGrow(p,4)},
          },
          lose: {r:"They catch you in ten steps.",fx:{die:"hanging"}},
        },
        {
          t: "Bribe the hangman",
          req: p=>p.coin>=80,
          check: {s:"intrigue",s2:"int",d:40},
          win: {
            r: 'The knot is tied wrong. They cut down a "dead" man and your friends carry the body away.',
            fx: p=>{p.coin-=80,p.flags.outlaw=!0,A.exile(p)},
          },
          lose: {r:"The hangman takes your silver and ties the knot right.",fx:{die:"hanging"}},
        },
        {
          t: "Face it with dignity",
          r: "You say a few words. People will remember them.",
          fx: {fame:5,die:"hanging"},
        },
      ],
    },
    {
      id: "prison_escape",
      trigger: !0,
      cond: p=>!!p.prison,
      title: "A chance to escape",
      text: "A loose bar. A drunk guard. A storm loud enough to hide footsteps. Tonight, maybe.",
      choices: [
        {
          t: "Try it",
          check: {s:"stealth",s2:"spd",d:55,bonus:p=>A.hasBlood(p,"boneless")?25:0},
          win: {
            r: "You squeeze through and run into the rain. Free — and hunted.",
            fx: p=>{p.prison=null,p.flags.outlaw=!0,A.ach("escaped"),A.exile(p),A.willGrow(p,2)},
          },
          lose: {
            r: "They catch you on the wall. More years, and a beating.",
            fx: p=>{p.prison.until+=2,p.health-=15,A.willGrow(p,1.5)},
          },
        },
        {t:"Wait out your sentence",r:"Patience. The door opens one day.",fx:{wil:.8}},
      ],
    },
    {
      id: "prison_fight",
      trigger: !0,
      cond: p=>!!p.prison,
      title: "Trouble in the cells",
      text: "A hulking prisoner wants your bread. And your boots. And your respect.",
      choices: [
        {
          t: "Fight him",
          r: "In the cells, you fight or you starve.",
          fx: {
            duel: {
              tier: 2,
              title: "a prisoner",
              opts: {kind:"brawl",lethal:!1,place:"the cells",ground:"passage",title:"Cell fight"},
            },
          },
        },
        {t:"Give him the bread",r:"You go hungry. He leaves you alone. For now.",fx:{health:-6,happy:-5}},
      ],
    },
    {
      id: "prison_friend",
      trigger: !0,
      cond: p=>!!p.prison,
      title: "A cellmate",
      text: ()=>`Your cellmate is ${A.pick(["an old forger who knows every trick","a heretic who claims the year count is wrong","a deserter with a wild story","a poisoner who swears she is innocent","a minstrel jailed for a rude song about a lord"])}.`,
      choices: [
        {
          t: "Learn from them",
          r: "Long nights, long talks. You learn things no school teaches.",
          fx: {skill:{intrigue:4,learning:2},int:.6,newRel:{type:"friend",op:30}},
        },
        {t:"Keep to yourself",r:"You keep your own counsel.",fx:{wil:.6}},
      ],
    },
    {
      id: "prison_guard",
      trigger: !0,
      cond: p=>!!p.prison,
      title: "The guard",
      text: `A guard lingers by your door. "Life's hard on a guard's wage," he says. "Some men make it easier."`,
      choices: [
        {
          t: "Offer a bribe for your release (100 suns)",
          req: p=>p.coin>=100,
          check: {s:"intrigue",s2:"diplomacy",d:40},
          win: {
            r: "The door is left unlocked one night.",
            fx: p=>{p.coin-=100,p.prison=null,p.flags.outlaw=!0,A.ach("escaped")},
          },
          lose: {r:"He takes the money and reports you.",fx:p=>{p.coin-=100,p.prison.until+=1}},
        },
        {
          t: "Ask only for better food (5 suns)",
          req: p=>p.coin>=5,
          r: "Bread without weevils. A luxury.",
          fx: {coin:-5,health:6},
        },
        {t:"Say nothing",r:"He moves on.",fx:{}},
      ],
    },
    {
      id: "road_bandits",
      trigger: !0,
      title: "Bandits!",
      text: 'Men step out of the trees ahead and behind. Rusty swords, hungry faces. "Purse, boots, and walk away."',
      choices: [
        {
          t: "Fight",
          r: "You draw.",
          fx: {duel:{tier:2,title:"a bandit captain",opts:{kind:"brawl",place:"a forest road",title:"Bandits"}}},
        },
        {
          t: "Pay them",
          r: p=>{const g=Math.round(p.coin*.3);return p.coin-=g,`You hand over ${A.coin(g)}. They let you pass.`},
          fx: {},
        },
        {
          t: "Run",
          check: {s:"spd",s2:"sta",d:45},
          win: {r:"You outrun them all.",fx:{spd:.4}},
          lose: {
            r: "They catch you, beat you and take everything.",
            fx: p=>{p.coin=Math.round(p.coin*.4),p.health-=15},
          },
        },
        {
          t: "Talk your way out",
          check: {s:"diplomacy",s2:"int",d:50},
          win: {r:"You talk. They laugh. You share bread. They let you go.",fx:{skill:{diplomacy:3}}},
          lose: {r:"They are not in a talking mood.",fx:p=>{p.coin=Math.round(p.coin*.5),p.health-=8}},
        },
      ],
    },
    {
      id: "road_inn",
      trigger: !0,
      title: "A night at a roadside inn",
      text: "A smoky common room, three pence a night. A crowd of carters, a pilgrim, a man who will not take off his hood.",
      choices: [
        {
          t: "Share a table with the carters",
          r: "They tell you about tolls, roads and which lords hang travelers.",
          fx: {skill:{trade:2},int:.3},
        },
        {
          t: "Talk to the hooded man",
          check: {s:"ins",s2:"diplomacy",d:45},
          win: {
            r: "A spy, you are almost sure, going somewhere in a hurry. He pays you to forget his face.",
            fx: {coin:20,skill:{intrigue:3}},
          },
          lose: {r:"He stares at you until you look away.",fx:{}},
        },
        {
          t: "Sleep with your hand on your purse",
          r: "Uneventful. The best kind of night on the road.",
          fx: {health:3},
        },
      ],
    },
    {
      id: "road_beast",
      trigger: !0,
      title: "Something on the road",
      text: (p,ctx)=>`At dusk, something big crosses the road ahead and stops. It has seen you. ${ctx.beast?"("+(LORE.creatures.find(c=>c.id===ctx.beast)||{}).name+")":""}`,
      setup: (p,ctx)=>{const n=A.beastsNear(p);ctx.beast=n.length?A.pick(n):"CRE-21"},
      choices: [
        {t:"Stand and fight",r:"You set your feet.",fx:{beast:{place:"the road at dusk",light:"dusk"}}},
        {
          t: "Back away slowly",
          check: {s:"wil",s2:"ins",d:45},
          win: {r:"You hold its eyes and back away. It lets you go.",fx:{wil:.8}},
          lose: {r:"It charges. You run for a tree and climb.",fx:{health:-12,wil:1}},
        },
      ],
    },
    {
      id: "road_stranger",
      trigger: !0,
      title: "A fellow traveler",
      text: ()=>`${A.pick(["A Rememberer of Zanara walking home","a dwarf smith carrying his anvil on a mule","an elf who looks twenty and talks like she is five hundred","a half-orc mercenary between contracts","a pilgrim with bleeding feet","a peddler of relics, half of them fake"])} falls into step beside you.`,
      choices: [
        {
          t: "Travel together",
          r: "The miles go quicker. You part as friends.",
          fx: {newRel:{type:"friend",op:30},happy:4},
        },
        {t:"Keep your distance",r:"You walk on alone.",fx:{}},
      ],
    },
    {
      id: "road_storm",
      trigger: !0,
      title: "Caught in the storm",
      text: "The sky goes black. Rain like thrown gravel, then hail. No shelter for miles.",
      choices: [
        {
          t: "Push on through",
          check: {s:"sta",s2:"wil",d:45},
          win: {r:"Soaked, frozen, alive. You make the town by night.",fx:{sta:.6,wil:.6}},
          lose: {r:"You catch a chill that becomes a fever.",fx:{health:-18}},
        },
        {t:"Shelter under a cart",r:"Miserable, but safe.",fx:{happy:-2}},
      ],
    },
    {
      id: "school_trial",
      trigger: !0,
      cond: p=>!!p.school,
      title: "A trial at the school",
      text: p=>`${p.school&&p.school.master?p.school.master:"The master"} sets you a trial in front of the whole school: ${A.pick(["three bouts against the senior students","a day and a night without sleep, then a bout","blindfolded drills while others watch","teaching the youngest students for a season"])}.`,
      choices: [
        {
          t: "Give everything",
          check: {s:"wil",s2:"ins",d:52},
          win: {
            r: "You pass. The master nods once. From that man, a nod is a feast.",
            fx: p=>{p.school&&A.trainSkill(p,p.school.skill,6),A.fame(p,2),A.willGrow(p,1)},
          },
          lose: {
            r: "You fail in front of everyone. You train twice as hard after.",
            fx: p=>{A.willGrow(p,2),p.school&&A.trainSkill(p,p.school.skill,3)},
          },
        },
        {
          t: "Find a clever way around it",
          check: {s:"int",s2:"ins",d:50},
          win: {r:"Unorthodox. The master laughs for the first time anyone can remember.",fx:{int:.8,ins:.6}},
          lose: {r:'"Cleverness is not what I asked for." Extra drills for a month.',fx:{sta:.8}},
        },
      ],
    },
    {
      id: "hunt_beast",
      trigger: !0,
      setup: (p,ctx)=>{ctx.beast||(ctx.beast="CRE-25")},
      title: p=>"The hunt",
      text: (p,ctx)=>{const c=LORE.creatures.find(x=>x.id===ctx.beast)||{},B=A.BEASTS[ctx.beast]||{},info=GD.TIER_INFO&&GD.TIER_INFO[A.beastTier(ctx.beast)];return`${ctx.famous?"After weeks of tracking you":"You"} find ${c.name||"the beast"} in ${B.where||"the wilds"}. ${c.size?"Size: "+c.size+".":""} ${c.behavior?c.behavior:""}`+(info?` [${info.name}: ${info.who}]`:"")},
      choices: [
        {
          t: "Attack it head-on",
          r: "You go straight at it.",
          fx: (p,ctx)=>{A.startDuelFront(p,{beastId:ctx.beast},{kind:"beast",place:(A.BEASTS[ctx.beast]||{}).where||"the wilds",title:"The hunt"})},
        },
        {
          t: "Set a trap or use the ground",
          check: {s:"survival",s2:"int",d:50},
          win: {
            r: "Your trap works. It is hurt before the fight begins.",
            fx: (p,ctx)=>{A.startDuelFront(p,{beastId:ctx.beast,mod:.6},{kind:"beast",place:"your trap",title:"The hunt"})},
          },
          lose: {
            r: "It springs the trap and comes for you angry.",
            fx: (p,ctx)=>{A.startDuelFront(p,{beastId:ctx.beast,mod:1.1},{kind:"beast",place:"the wilds",title:"The hunt"})},
          },
        },
        {
          t: "Shoot from cover",
          req: p=>!!p.gear.ranged,
          check: {s:"bow",s2:"ins",d:52},
          win: {
            r: "Your arrows find it again and again before it reaches you.",
            fx: (p,ctx)=>{A.startDuelFront(p,{beastId:ctx.beast,mod:.5},{kind:"beast",place:"the wilds",title:"The hunt"})},
          },
          lose: {
            r: "Your arrows only anger it.",
            fx: (p,ctx)=>{A.startDuelFront(p,{beastId:ctx.beast},{kind:"beast",place:"the wilds",title:"The hunt"})},
          },
        },
        {
          party: !0,
          t: p=>`Gather a hunting party first${huntOfficer(p)?" (your own men)":" (hire six hunters and dogs: 24 suns)"}`,
          req: p=>huntOfficer(p)||p.coin>=24,
          r: "It takes a week to gather spears, dogs and men who know the ground.",
          fx: (p,ctx)=>(huntOfficer(p)||(p.coin-=Math.min(p.coin,24)),A.startDuelFront(p,{beastId:ctx.beast,mod:.9},{kind:"beast",place:(A.BEASTS[ctx.beast]||{}).where||"the wilds",title:"The hunt",party:{n:A.ri(6,10)}}),""),
        },
        {t:"Let it go",r:"Not today. Maybe not ever.",fx:{wil:-.2}},
      ],
    },
    {
      id: "poach_caught",
      trigger: !0,
      title: "The lord's forest",
      text: 'A forester steps out of the trees. "That deer belonged to the lord."',
      choices: [
        {
          t: "Bribe him (5 suns)",
          req: p=>p.coin>=5,
          r: "He pockets the coin and forgets your face.",
          fx: {coin:-5},
        },
        {
          t: "Run",
          check: {s:"spd",s2:"survival",d:42},
          win: {r:"You lose him in the thickets.",fx:{}},
          lose: {
            r: "Caught. A lord's court for poaching.",
            fx: p=>{if(p.realm==="POL-05"&&A.chance(.4))return A.addWound(p,"lost_hand"),"Ashmere's forest law takes a poacher's hand.";const f=Math.min(p.coin,15);return p.coin-=f,p.health-=8,`Fined ${A.coin(f)} and flogged.`},
          },
        },
        {
          t: "Argue that the deer was on common land",
          check: {s:"diplomacy",s2:"int",d:50},
          win: {r:"He scratches his head and lets you go.",fx:{}},
          lose: {r:"He does not care about common land.",fx:{coin:-10}},
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
      id: "camp_brawl",
      trigger: !0,
      cond: p=>!!p.mil&&!(A.lfRank&&A.lfRank(p)>3),
      title: "Trouble in the mess",
      text: p=>{const s=A.squad(p),a=s[0],b=s[1];return a&&b?`${a.given} and ${b.given} are at each other's throats over ${A.pick(["a stolen ration","a woman in the village","a dice debt","an old insult","who shirked the last watch"])}. Knives are out.`:"Two men in your mess are at each other's throats."},
      choices: [
        {
          t: "Step between them",
          check: {s:"wil",s2:"command",d:40},
          win: {
            r: "They back down. The mess respects you more.",
            fx: p=>{for(const c of A.squad(p).slice(0,3))A.addOp(p,c,4);A.trainSkill(p,"command",2)},
          },
          lose: {r:"You catch a knife-cut for your trouble.",fx:{health:-8,wound:"scar_arm"}},
        },
        {t:"Let them fight it out",r:"One of them ends up in the surgeon's tent.",fx:{}},
        {
          t: "Report it to the sergeant",
          r: "Both are flogged. Neither forgives you.",
          fx: p=>{for(const c of A.squad(p).slice(0,2))A.addOp(p,c,-10);p.mil&&(p.mil.merit+=2)},
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
      id: "camp_drill",
      trigger: !0,
      cond: p=>!!p.mil&&!(A.lfRank&&A.lfRank(p)>3),
      title: "Drill",
      text: "The sergeant has the company drilling until men drop: wheel, halt, close up, wheel again.",
      choices: [
        {
          t: "Throw yourself into it",
          r: "Your body learns what your mind forgets.",
          fx: {sta:1,skill:{shield:3,command:1},merit:3},
        },
        {
          t: "Help a struggling recruit",
          r: "He drills better beside you. He will remember.",
          fx: {newRel:{type:"comrade",op:30},skill:{command:2}},
        },
        {
          t: "Shirk at the back",
          check: {s:"stealth",s2:"int",d:40},
          win: {r:"Nobody notices. A rest is a rest.",fx:{happy:3}},
          lose: {r:"Caught. Extra watches for a month.",fx:{merit:-3,health:-4}},
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
      id: "camp_dice",
      trigger: !0,
      cond: p=>!!p.mil&&!(A.lfRank&&A.lfRank(p)>3),
      title: "Dice by the fire",
      text: 'Around the fire, soldiers throw dice for their pay. "In or out?"',
      choices: [
        {
          t: "In",
          check: {s:"int",s2:"ins",d:48},
          win: {r:"You win a month's pay off a corporal.",fx:{coin:25,happy:4}},
          lose: {r:"You lose a month's pay.",fx:{coin:-20,happy:-3}},
        },
        {t:"Out",r:"You watch and sharpen your blade.",fx:{}},
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
      id: "camp_letter",
      trigger: !0,
      cond: p=>!!p.mil&&!(A.lfRank&&A.lfRank(p)>3),
      title: "A letter",
      text: p=>{const s=A.squad(p)[0];return s?`${s.given} cannot read. ${A.cap(A.he(s))} asks you to read ${A.his(s)} letter from home, and to write the answer.`:"A comrade who cannot read asks you to read a letter from home."},
      choices: [
        {
          t: "Read it and write the answer",
          req: p=>p.literate,
          r: p=>{const s=A.squad(p)[0];return s&&A.addOp(p,s,15),"Good news and bad news from home. You write the reply with care. A bond is made."},
          fx: {},
        },
        {
          t: "Admit you cannot read either",
          req: p=>!p.literate,
          r: "You both stare at the marks. Later, a priest reads it for a penny.",
          fx: {},
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
      id: "camp_officer",
      trigger: !0,
      cond: p=>!!p.mil&&!(A.lfRank&&A.lfRank(p)>3),
      title: "An officer's eye",
      text: 'A captain rides past during drill and stops. "You. Name?"',
      choices: [
        {
          t: "Answer crisply and stand tall",
          check: {s:"wil",s2:"diplomacy",d:38},
          win: {r:"He remembers your name. That matters in an army.",fx:{merit:8}},
          lose: {r:"You stammer. He rides on.",fx:{}},
        },
        {
          t: "Ask for a harder posting",
          r: `"We'll see." Three weeks later you get one.`,
          fx: {merit:4,mission:"any"},
        },
      ],
    },
    {
      id: "camp_fever",
      trigger: !0,
      cond: p=>!!p.mil,
      title: "Camp fever",
      text: "Camp fever runs through the lines. Men shiver, sweat and die in rows.",
      choices: [
        {
          t: "Nurse the sick",
          check: {s:"sta",s2:"medicine",d:45},
          win: {r:"You save some of them and do not catch it.",fx:{honor:4,skill:{medicine:4}}},
          lose: {r:"You catch it yourself.",fx:{health:-25,cause:"camp fever"}},
        },
        {
          t: "Keep away from the sick tents",
          check: {s:"sta",s2:"int",d:35},
          win: {r:"You stay healthy.",fx:{}},
          lose: {r:"It finds you anyway.",fx:{health:-20,cause:"camp fever"}},
        },
      ],
    },
    {
      id: "plot_throne",
      trigger: !0,
      setup: (p,ctx)=>{ctx.odds==null&&(ctx.odds=30),ctx.rid||(ctx.rid=p.realm)},
      title: "A crown in reach",
      text: (p,ctx)=>{const r=A.realm(ctx.rid),ru=r?A.P(r.ruler):null;return`Your conspirators are ready: lords, captains, a gate-keeper. ${ru?A.rulerStyle(ru,r):"The ruler"} suspects nothing. Your chance of success, by your own count: about ${ctx.odds} in a hundred. If it fails, it is treason.`},
      choices: [
        {
          t: "Strike now",
          r: "",
          // [X1 baked patch events/994-careers CAR-USURPER] plot_throne awarded the "Usurper" achievement ("Seize a throne
          // that was not yours") when the coup only half-succeeded and started a civil war, so a claimant who was crushed a
          // year later still held it. It is now awarded when the claimant wins that war and is crowned (careers.core.js,
          // A.endWar).
          fx: (p,ctx)=>{const r=A.realm(ctx.rid);if(!r)return"The moment passes.";if(A.chance(ctx.odds/100)){const ru=A.P(r.ruler);return ru&&A.chance(.6)?(A.kill(ru,"a coup",!0),A.makeRuler(p,r.id),r.legit=25,r.stability=Math.max(10,r.stability-15),A.ach("usurper"),A.ach("ruler"),p.deeds.push({y:A.S.year,t:`Seized the throne of ${r.name}`}),A.news(`${A.fullName(p)} seizes the throne of ${r.name}!`,"crown"),"The palace falls in a night. By morning, the crown is yours."):(A.successionWar(r,p),"The coup half-succeeds: the old ruler escapes. Now it is civil war — and you lead one side.")}return A.punish(p,"treason"),"Someone talked. The guards come for you at dawn."},
        },
        {
          t: "Wait for a better moment",
          r: "You let the plot cool. Some of your friends drift away.",
          fx: {skill:{intrigue:2}},
        },
        {
          t: "Betray your fellow plotters to the crown",
          r: "You name names. The crown rewards loyalty.",
          fx: {favor:30,honor:-15,fame:3},
        },
      ],
    },
    {
      id: "ruler_revolt",
      trigger: !0,
      cond: p=>!!p.ruler,
      title: "The realm boils",
      text: "Peasants burn a tax-collector's house. Lords mutter at your table. The realm is close to breaking.",
      choices: [
        {
          t: "Cut taxes and open the granaries",
          r: "The fires die down. The treasury bleeds.",
          fx: p=>{const r=A.realm(p.ruler);r.stability+=12,r.treasury-=Math.round(r.income*.1),r.laws.tax=.85},
        },
        {
          t: "Send the soldiers",
          check: {s:"command",s2:"wil",d:50},
          win: {
            r: "Order is restored. The gibbets creak in the wind.",
            fx: p=>{const r=A.realm(p.ruler);r.stability+=8,p.honor-=5},
          },
          lose: {
            r: "The soldiers join the rioters.",
            fx: p=>{const r=A.realm(p.ruler);r.stability-=10,r.army=Math.round(r.army*.9)},
          },
        },
        {
          t: "Ride out and speak to them yourself",
          check: {s:"diplomacy",s2:"wil",d:52},
          win: {
            r: "They cheer you. They never cheered anyone before.",
            fx: p=>{const r=A.realm(p.ruler);r.stability+=15,A.fame(p,4)},
          },
          lose: {r:"A stone hits you in the head.",fx:p=>{p.health-=15;const r=A.realm(p.ruler);r.stability-=4}},
        },
      ],
    },
    {
      id: "ruler_petition",
      trigger: !0,
      cond: p=>!!p.ruler,
      title: "Petitioners",
      text: ()=>`A petitioner kneels: ${A.pick(["a widow whose land a lord has taken","a village whose well the dyers have poisoned","a guild that wants a monopoly","a monk who wants a heretic burned","a farmer whose son was hanged by mistake"])}.`,
      choices: [
        {
          t: "Judge for the weak",
          r: "The common folk bless your name. Some lords do not.",
          fx: p=>{const r=A.realm(p.ruler);r.stability+=3,p.honor+=4},
        },
        {
          t: "Judge for the powerful",
          r: "The lords are pleased. The people remember.",
          fx: p=>{for(const h of Object.values(A.S.houses))h.realm===p.ruler&&(h.op=A.clamp((h.op||50)+3,0,100));p.honor-=3},
        },
        {t:"Take a bribe and judge for whoever paid",r:"Profitable. Not admirable.",fx:{coin:200,honor:-8}},
      ],
    },
    {
      id: "ruler_embassy",
      trigger: !0,
      cond: p=>!!p.ruler,
      title: "An embassy",
      text: p=>{const o=A.pick(Object.values(A.S.realms).filter(r=>r.alive&&r.id!==p.ruler));return p.flags.embassyFrom=o.id,`Envoys from ${o.name} arrive with gifts and a proposal of friendship.`},
      choices: [
        {t:"Receive them warmly",r:"Relations improve.",fx:p=>{A.addRel(p.ruler,p.flags.embassyFrom,15)}},
        {t:"Insult them",r:"They leave in a fury.",fx:p=>{A.addRel(p.ruler,p.flags.embassyFrom,-25)}},
        {
          t: "Have your spymaster search their baggage",
          check: {s:"intrigue",s2:"int",d:50},
          win: {r:"You find letters that reveal their true aims.",fx:{skill:{intrigue:4}}},
          lose: {r:"They catch your men. A diplomatic scandal.",fx:p=>{A.addRel(p.ruler,p.flags.embassyFrom,-20)}},
        },
      ],
    },
    {
      id: "ruler_famine",
      trigger: !0,
      cond: p=>!!p.ruler,
      title: "A hungry year",
      text: "The harvest fails. Bread prices triple. The poor eat bark and grass.",
      choices: [
        {
          t: "Buy grain abroad for the poor",
          r: "It costs a fortune. It saves thousands.",
          fx: p=>{const r=A.realm(p.ruler);r.treasury-=Math.round(r.income*.15),r.stability+=6,p.honor+=5},
        },
        {
          t: "Let the market sort it out",
          r: "Thousands die. The realm remembers.",
          fx: p=>{const r=A.realm(p.ruler);r.stability-=10;for(const pr of A.realmProvs(r.id))pr.pop=Math.round(pr.pop*.97);A.updateRealmPops()},
        },
        {
          t: "Seize the grain of the rich houses",
          r: "The poor eat. The rich hate you.",
          fx: p=>{const r=A.realm(p.ruler);r.stability+=3;for(const h of Object.values(A.S.houses))h.realm===r.id&&(h.op=A.clamp((h.op||50)-10,0,100))},
        },
      ],
    },
    {
      id: "ruler_plot",
      trigger: !0,
      cond: p=>!!p.ruler,
      title: "A plot",
      text: "Your spymaster brings word: someone at court is plotting your death.",
      choices: [
        {
          t: "Investigate quietly",
          check: {s:"intrigue",s2:"int",d:48,bonus:p=>A.councilSkill(A.realm(p.ruler),"spymaster")/4},
          win: {
            r: "You find the plotters and deal with them before they strike.",
            fx: p=>{const r=A.realm(p.ruler);r.stability+=4,A.fame(p,2)},
          },
          lose: {
            r: "You find nothing — until the poisoned cup.",
            fx: p=>A.hasBlood(p,"unpoisoned")||A.hasBlood(p,"taster")?"Poison in your wine — your blood tastes it and shrugs it off. The poisoner flees.":(p.health-=35,p.lastHurt="poison","Poison in your wine. You live, barely."),
          },
        },
        {
          t: "Arrest everyone suspicious",
          r: "The cells fill. The court hates you, but fears you more.",
          fx: p=>{const r=A.realm(p.ruler);r.stability-=3;for(const h of Object.values(A.S.houses))h.realm===r.id&&(h.op=A.clamp((h.op||50)-6,0,100))},
        },
        {
          t: "Ignore it",
          r: "There is always a plot.",
          fx: p=>A.chance(.3)?(p.health-=30,p.lastHurt="an assassin's knife","An assassin's knife finds you in the corridor."):"",
        },
      ],
    },
    {
      id: "ruler_feast",
      trigger: !0,
      cond: p=>!!p.ruler,
      title: "The great feast",
      text: "Your lords expect a feast. A good one.",
      choices: [
        {
          t: "Spare no expense",
          r: "Swans, peacocks, rivers of wine. They talk about it for years.",
          fx: p=>{const r=A.realm(p.ruler);r.treasury-=2e3;for(const h of Object.values(A.S.houses))h.realm===r.id&&(h.op=A.clamp((h.op||50)+8,0,100));A.fame(p,2)},
        },
        {t:"A modest feast",r:"Nobody remembers it.",fx:{}},
        {
          t: "Use the feast to watch your enemies drink",
          check: {s:"intrigue",s2:"ins",d:45},
          win: {r:"Loose tongues tell you who hates you.",fx:{skill:{intrigue:4}}},
          lose: {r:"You drink too much yourself.",fx:{health:-4}},
        },
      ],
    },
    {
      id: "ruler_heresy",
      trigger: !0,
      cond: p=>!!p.ruler,
      title: "Heresy",
      text: ()=>`Preachers in the market say ${A.pick(["the year count is wrong","the priests are thieves","the sun is just a fire in the sky","the old gods are coming back","the king is not anointed"])}. Crowds listen.`,
      choices: [
        {
          t: "Let them preach",
          r: "The priests are furious. The people are curious.",
          fx: p=>{const r=A.realm(p.ruler);r.stability-=3,p.piety-=5},
        },
        {
          t: "Silence them",
          r: "The preachers vanish into cells.",
          fx: p=>{const r=A.realm(p.ruler);r.stability+=2,p.piety+=4,p.honor-=2},
        },
        {
          t: "Debate them in public",
          check: {s:"learning",s2:"faith",d:55},
          win: {
            r: "You out-argue them before the crowd.",
            fx: p=>{const r=A.realm(p.ruler);r.stability+=6,A.fame(p,3)},
          },
          lose: {r:"They make a fool of you.",fx:p=>{const r=A.realm(p.ruler);r.legit-=6}},
        },
      ],
    },
    {
      id: "ruler_bandits",
      trigger: !0,
      cond: p=>!!p.ruler,
      title: "Outlaws on the roads",
      text: "Outlaws rob merchants on the king's road. Trade is choking.",
      choices: [
        {
          t: "Lead the hunt yourself",
          r: "You ride out at the head of your guard.",
          fx: {
            duel: {tier:3,title:"the outlaw chief",opts:{kind:"duel",place:"a forest road",title:"The outlaw chief"}},
            fame: 2,
          },
        },
        {
          t: "Send soldiers",
          r: "The roads are cleared, mostly.",
          fx: p=>{const r=A.realm(p.ruler);r.treasury-=500,r.stability+=2},
        },
        {
          t: "Offer the outlaws a pardon for service",
          r: "Half of them join your army.",
          fx: p=>{const r=A.realm(p.ruler);r.army+=300},
        },
      ],
    },
    {
      id: "ruler_bank",
      trigger: !0,
      cond: p=>!!p.ruler,
      title: "The bankers",
      text: `A banker in a black cap bows. "Your Majesty's debts are... considerable. We propose new terms."`,
      choices: [
        {
          t: "Accept their terms",
          r: "The loans roll over. The interest grows.",
          fx: p=>{const r=A.realm(p.ruler);r.debt=Math.round(r.debt*1.1),r.treasury+=3e3},
        },
        {
          t: "Refuse to pay",
          r: "Default! The banks close their doors to you.",
          fx: p=>{const r=A.realm(p.ruler);r.debt=0,r.stability-=8,r.legit-=5},
        },
        {
          t: "Negotiate",
          check: {s:"trade",s2:"diplomacy",d:52},
          win: {
            r: "Better terms. The banker looks unhappy. Good.",
            fx: p=>{const r=A.realm(p.ruler);r.debt=Math.round(r.debt*.85)},
          },
          lose: {r:"He out-talks you.",fx:p=>{const r=A.realm(p.ruler);r.debt=Math.round(r.debt*1.05)}},
        },
      ],
    },
    {
      id: "ruler_marriage_offer",
      trigger: !0,
      cond: p=>!!p.ruler,
      title: "A marriage offer",
      text: p=>{const o=A.pick(Object.values(A.S.realms).filter(r=>r.alive&&r.id!==p.ruler&&r.ruler));return p.flags.offerFrom=o.id,`${o.name} offers a marriage alliance: a prince or princess of their house for your family.`},
      choices: [
        {
          t: "Accept",
          r: "A royal wedding. Two realms bound.",
          fx: p=>{A.addRel(p.ruler,p.flags.offerFrom,30);const r=A.realm(p.ruler),o=A.realm(p.flags.offerFrom);o&&!r.allies.includes(o.id)&&(r.allies.push(o.id),o.allies.push(r.id))},
        },
        {t:"Decline politely",r:"They are disappointed.",fx:p=>{A.addRel(p.ruler,p.flags.offerFrom,-5)}},
      ],
    },
    {
      id: "ruler_border",
      trigger: !0,
      cond: p=>!!p.ruler,
      title: "Border trouble",
      text: p=>{const n=A.neighbors(p.ruler),o=n.length?A.pick(n):null;return p.flags.borderWith=o,o?`Raiders from ${A.realmName(o)} burn villages across your border.`:"Raiders burn villages on your border."},
      choices: [
        {
          t: "Demand compensation",
          r: "Envoys ride. Answers come slowly.",
          fx: p=>{p.flags.borderWith&&A.addRel(p.ruler,p.flags.borderWith,-8)},
        },
        {
          t: "Raid them back",
          r: "Your riders burn their villages in turn.",
          fx: p=>{p.flags.borderWith&&A.addRel(p.ruler,p.flags.borderWith,-20);const r=A.realm(p.ruler);r.stability+=2},
        },
        {
          t: "Declare war",
          req: p=>!!p.flags.borderWith,
          r: "You will have a war, then.",
          fx: p=>{A.startWar(p.ruler,p.flags.borderWith,null,"border")},
        },
      ],
    },
    {
      id: "ruler_plague",
      trigger: !0,
      cond: p=>!!p.ruler,
      title: "Plague",
      text: "Plague in the ports. The priests say bad air; the physicians say bad blood. People die in the streets.",
      choices: [
        {
          t: "Close the gates and the ports",
          r: "Trade stops. The plague slows.",
          fx: p=>{const r=A.realm(p.ruler);r.treasury-=Math.round(r.income*.08);for(const pr of A.realmProvs(r.id))pr.pop=Math.round(pr.pop*.99);A.updateRealmPops()},
        },
        {
          t: "Do nothing — trade must flow",
          r: "The plague spreads.",
          fx: p=>{const r=A.realm(p.ruler);for(const pr of A.realmProvs(r.id))pr.pop=Math.round(pr.pop*.95);r.stability-=6,A.updateRealmPops()},
        },
        {
          t: "Fund hospitals and pray",
          r: "The faith is grateful; the dead are many anyway.",
          fx: p=>{const r=A.realm(p.ruler);r.treasury-=1500,r.stability+=3,p.piety+=5},
        },
      ],
    },
    {
      id: "ruler_champion",
      trigger: !0,
      cond: p=>!!p.ruler,
      title: "A champion's challenge",
      text: 'A foreign champion stands in your hall: "I challenge the best blade of this court. Or is there none?"',
      choices: [
        {
          t: "Fight him yourself",
          r: "The court gasps. You draw.",
          fx: {
            duel: {
              tier: 4,
              title: "a foreign champion",
              opts: {kind:"duel",place:"your own hall",lethal:!1,toYield:!0,title:"The champion"},
            },
          },
        },
        {t:"Send your best knight",r:"Your knight wins. The court cheers you anyway.",fx:{fame:1}},
        {t:"Laugh and send him away",r:"Some at court think you are afraid.",fx:{fame:-2}},
      ],
    },
    {
      id: "court_whisper",
      trigger: !0,
      title: "Whispers at court",
      text: "Behind a tapestry you overhear two councillors discussing who will fall next.",
      choices: [
        {
          t: "Warn the person they named",
          r: "You make a grateful friend at court.",
          fx: {newRel:{type:"friend",op:40},skill:{intrigue:2}},
        },
        {t:"Sell the information",r:"Information is coin.",fx:{coin:60,honor:-3,skill:{intrigue:3}}},
        {t:"Forget you heard anything",r:"Wise, perhaps.",fx:{}},
      ],
    },
    {
      id: "court_duel",
      trigger: !0,
      title: "An insult at court",
      text: "A young lord mocks your house in front of the whole court.",
      choices: [
        {
          t: "Challenge him",
          r: "At dawn, then.",
          fx: {
            duel: {
              tier: 3,
              title: "an insolent lord",
              opts: {kind:"duel",place:"the castle meadow at dawn",toYield:!0,title:"Affair of honor"},
            },
          },
        },
        {
          t: "Answer with wit",
          check: {s:"diplomacy",s2:"int",d:48},
          win: {r:"The court laughs — at him.",fx:{fame:2,favor:3}},
          lose: {r:"Your answer falls flat.",fx:{fame:-1}},
        },
        {t:"Ignore him",r:"Some call it dignity. Some call it fear.",fx:{honor:-2}},
      ],
    },
    {
      id: "court_favor",
      trigger: !0,
      title: "A royal errand",
      text: "The ruler asks a personal favor of you: a delicate letter to carry, a quarrel to settle, a secret to keep.",
      choices: [
        {
          t: "Do it well",
          check: {s:"diplomacy",s2:"int",d:45},
          win: {r:"It is done, quietly. The ruler smiles at you at supper.",fx:{favor:15,fame:2}},
          lose: {r:"You make a mess of it.",fx:{favor:-10}},
        },
        {t:"Refuse politely",r:"The ruler's smile cools.",fx:{favor:-5}},
      ],
    },
    {
      id: "court_lady",
      trigger: !0,
      title: "An admirer at court",
      text: "Someone at court has been watching you across the hall all season.",
      choices: [
        {t:"Return the attention",r:"A dangerous, delightful game begins.",fx:{lover:!0,happy:5}},
        {t:"Keep your distance",r:"Court romances end badly.",fx:{}},
      ],
    },
    {
      id: "court_poison",
      trigger: !0,
      title: "The wine",
      text: "Your wine tastes strange. Bitter, very faintly.",
      choices: [
        {
          t: "Spit it out",
          check: {s:"ins",s2:"int",d:40,bonus:p=>A.hasBlood(p,"taster")?60:0},
          win: {r:"Poison. Someone at court wants you dead.",fx:{wil:1,skill:{intrigue:3}}},
          lose: {r:"Too late. You are sick for a month.",fx:{health:-30,cause:"poison"}},
        },
        {
          t: "Drink — you are imagining things",
          r: "",
          fx: p=>A.hasBlood(p,"unpoisoned")?"It was arsenic. Your blood laughs at arsenic.":A.chance(.5)?(p.health-=40,p.lastHurt="poison","You were not imagining things."):"Just a bad vintage.",
        },
      ],
    },
    {
      id: "road_pilgrim",
      trigger: !0,
      title: "The pilgrim road",
      text: p=>{const F=A.faith(p.faith);return`The pilgrim road is long. ${F&&F.holy_sites,""}${F?"You walk toward the holy places of "+F.name+".":"You walk with other pilgrims."} Blisters, hymns, beggars and miracles for sale.`},
      choices: [
        {
          t: "Walk barefoot, as the old penitents did",
          check: {s:"wil",s2:"sta",d:40},
          win: {r:"You arrive bleeding and blessed. Something in you is changed.",fx:{piety:10,wil:2}},
          lose: {r:"Your feet go bad. You finish the road on a cart.",fx:{health:-10,piety:4}},
        },
        {
          t: "Help the sick pilgrims",
          r: "You carry a child half the way. Her mother weeps her thanks.",
          fx: {honor:5,piety:5,newRel:{type:"friend",op:35}},
        },
        {
          t: "Buy a holy relic",
          req: p=>p.coin>=10,
          check: {s:"int",s2:"ins",d:50},
          win: {r:"A genuine relic (probably). It hangs at your neck from now on.",fx:{coin:-10,piety:6,happy:4}},
          lose: {r:"A pig's knucklebone. You realize it only weeks later.",fx:{coin:-10}},
        },
      ],
    },
  ]);
})();
