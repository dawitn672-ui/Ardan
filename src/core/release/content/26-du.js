// The release's event pack 26 of 30 (85 events, mostly du_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-027). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  const J = (p,...k)=>!!p.job&&k.includes(p.job.c),
    RK = p=>p.job?p.job.r:-1,
    post = p=>p.job?GD.CAREERS[p.job.c].ranks[p.job.r][0]:"",
    cls = p=>A.classOf(p),
    myR = p=>A.realm(p.ruler||p.realm),
    rival = (p,ctx)=>{const rv=A.relsOf(p,["rival"]).filter(x=>x.p.alive)[0];if(rv){ctx.pid=rv.p.id;return}const n=A.makeAcquaintance(p,"rival");n.occ="a rival at your post",ctx.pid=n.id,ctx.newRival=1},
    stranger = (p,ctx,occ,minCls)=>{const n=A.makeAcquaintance(p,"acquaint");occ&&(n.occ=occ),minCls>=5&&(n.status="noble"),ctx.pid=n.id},
    nbRealm = (p,ctx)=>{const r=myR(p),n=r?A.neighbors(r.id).map(A.realm).filter(x=>x&&x.alive):[];ctx.rid=n.length?A.pick(n).id:null};
  A.defEvents([
    {
      id: "du_ct_forged_charter",
      duty: ["scribe","lawyer"],
      maxR: 3,
      title: "A seal that is not quite right",
      trigger: !0,
      setup: (p,ctx)=>{stranger(p,ctx,"a lord's factor")},
      text: "A land charter crosses your desk for registering. The wax is right, the hand is right — but the royal seal has eleven rays, not twelve. Someone forged it. {them}, the factor who brought it, watches you read and slides a purse half-way across the table.",
      choices: [
        {
          t: "Report the forgery to {bossTitle} {boss}",
          r: "There is an inquiry. A lord loses a valley he never owned, and {boss} remembers who caught it.",
          fx: {merit:14,bossOp:10,rep:4,skill:{learning:1}},
        },
        {
          t: "Copy the charter for yourself, then register it",
          check: {s:"intrigue",s2:"learning",d:40},
          win: {
            r: "You register the forgery and keep a perfect copy in your boots. One day it will be worth a great deal to someone.",
            fx: {secret:1,flag:"fl_forgery",skill:{intrigue:2}},
          },
          lose: {
            r: "The factor sees you copying it. His face goes very still. You have made an enemy who knows where you sleep.",
            fx: {newRel:{type:"enemy",op:-40}},
          },
        },
        {
          t: "Take the purse and say nothing",
          r: "Forty suns. The valley changes hands. You sleep worse than you expected.",
          fx: {coin:40,honor:-8,rep:-1},
        },
      ],
    },
    {
      id: "du_ct_fair_copy",
      duty: ["scribe","envoy"],
      maxR: 3,
      title: "A fair copy by dawn",
      trigger: !0,
      text: "The treaty with {other} must be copied fair by dawn — six copies, no blots, every clause exact — and the chancery is empty but for you and a guttering candle.",
      setup: nbRealm,
      choices: [
        {
          t: "Work through the night",
          check: {s:"learning",s2:"sta",d:40},
          win: {
            r: "Six copies, perfect, sanded and sealed as the sun comes up. The chancellor's own clerk takes them without a word, which is how you know they are good.",
            fx: {merit:12,rep:3,health:-4},
          },
          lose: {
            r: "A blot on the fifth copy. You fix it, but it is late, and late is noticed.",
            fx: {merit:3,health:-5},
          },
        },
        {
          t: "Read every clause while you copy",
          check: {s:"intrigue",s2:"int",d:35},
          win: {
            r: "Clause nine gives {other} the river tolls for twenty years. Somebody was paid for that. You remember who drafted it.",
            fx: {secret:1,merit:6,skill:{diplomacy:2}},
          },
          lose: {
            r: "You read too slowly and finish in a sweat. All you learn is that treaties are long.",
            fx: {merit:4},
          },
        },
        {
          t: "Wake a fellow clerk and split the work",
          r: "Two tired clerks are better than one. You owe each other now.",
          fx: {merit:6,newRel:{type:"friend",op:30}},
        },
      ],
    },
    {
      id: "du_ct_tax_roll",
      duty: ["scribe","steward"],
      minR: 1,
      maxR: 4,
      title: "A village that cannot pay",
      trigger: !0,
      text: "The tax roll says the village of Holloway owes ninety suns at Michaelmas. The headman, on his knees, says the blight took half the barley. The roll does not care. You are the one holding it.",
      choices: [
        {
          t: "Collect every coin. The law is the law.",
          r: "You collect it. Two families leave for the towns in winter. Your accounts are perfect, and {boss} likes perfect accounts.",
          fx: {merit:10,bossOp:6,honor:-6,rep:2},
        },
        {
          t: "Write it down as half, and take the blame",
          check: {s:"persuasion",s2:"stewardship",d:45},
          win: {
            r: "You argue the blight before your superiors and win the remission. Holloway will remember your name for a generation.",
            fx: {honor:8,fame:2,merit:4,skill:{stewardship:2}},
          },
          lose: {
            r: `"Who gave you leave to forgive the crown's money?" The remission stands; your standing does not.`,
            fx: {honor:5,merit:-8,bossOp:-10},
          },
        },
        {
          t: "Let them pay in barley seed next year, at your profit",
          check: {s:"trade",d:40},
          win: {
            r: "The village pays in seed at harvest, and the seed sells high. Everyone is half-content, and you are a little richer.",
            fx: {coin:30,merit:4,skill:{trade:2}},
          },
          lose: {r:"The harvest fails again. Now you owe the crown ninety suns of your own.",fx:{coin:-60}},
        },
      ],
    },
    {
      id: "du_ct_grain",
      duty: ["steward"],
      title: "Empty barns in March",
      trigger: !0,
      text: "The lord's barns will be empty a month before the harvest. The garrison eats first; the servants second; the villagers last. Unless you find grain.",
      choices: [
        {
          t: "Buy grain from the river merchants, on credit",
          check: {s:"trade",s2:"stewardship",d:45},
          win: {
            r: "The barges come in April. Nobody starves on your watch, and the price was fair.",
            fx: {merit:14,rep:5,skill:{stewardship:2}},
          },
          lose: {
            r: "The merchants smell the need and charge double. Nobody starves; the lord's purse bleeds.",
            fx: {merit:3,bossOp:-6},
          },
        },
        {
          t: "Ration everyone, the garrison included",
          r: "The soldiers grumble; the villages survive. The lord calls it hard but fair, which from him is praise.",
          fx: {merit:8,honor:4},
        },
        {
          t: `Seize the abbey's stores "on loan"`,
          r: "The abbot curses you from the pulpit. The barns are full.",
          fx: {merit:10,piety:-8,newRel:{type:"enemy",op:-30}},
        },
      ],
    },
    {
      id: "du_ct_crooked_bailiff",
      duty: ["steward","scribe"],
      maxR: 3,
      title: "Another man's thumb on the scales",
      trigger: !0,
      setup: (p,ctx)=>stranger(p,ctx,"a bailiff of the next manor"),
      text: "{themFull}, bailiff of the next manor, weighs the lord's wool at the market with a thumb on the scale — and he has noticed that you noticed. That evening he buys you a cup and talks about how much a man could save, if two bailiffs agreed on the weights.",
      choices: [
        {
          t: "Expose him to the steward",
          r: "He is turned out in disgrace. Some call you honest, some call you a snake. The steward calls you useful.",
          fx: {merit:12,honor:5,them:{type:"enemy",op:-50}},
        },
        {
          t: "Agree, and keep careful notes",
          check: {s:"intrigue",s2:"deception",d:45},
          win: {
            r: "A year of quiet profit, and a ledger of his sins in your own hand. You own him now.",
            fx: {coin:60,secret:1,them:{type:"acquaint",op:10},owed:2},
          },
          lose: {r:"He is caught, and he names you. You keep your post by begging.",fx:{merit:-15,honor:-10,rep:-6}},
        },
        {
          t: "Warn him off, privately",
          r: '"Stop, or I tell." He stops. He also owes you, and both of you know it.',
          fx: {honor:2,owed:1,them:{type:"acquaint",op:5}},
        },
      ],
    },
    {
      id: "du_ct_seating",
      duty: ["courtier"],
      maxR: 2,
      title: "Above or below the salt",
      trigger: !0,
      setup: rival,
      text: "You are charged with the seating for the spring feast: forty guests, eleven quarrels, and one silver salt cellar dividing the honored from the merely present. {them} expects to sit above the salt. By strict precedence, {theyHe} should not.",
      choices: [
        {
          t: "Seat by strict precedence",
          check: {s:"etiquette",d:40},
          win: {
            r: "Perfect. Not one lord feels slighted except {them}, who was wrong, and everyone knows it.",
            fx: {merit:12,rep:4,them:{type:"rival",op:-15}},
          },
          lose: {
            r: "You put a baroness below a knight. The hall goes quiet. You will hear about this for years.",
            fx: {merit:-6,rep:-5},
          },
        },
        {
          t: "Seat {them} above the salt as a kindness",
          r: "A small favor; {them} owes you now, and knows it.",
          fx: {owed:1,them:{op:20},merit:3},
        },
        {
          t: "Seat {them} at the far end, near the dogs",
          r: "Petty, delicious, and seen by everyone. {them} will not forget.",
          fx: {them:{type:"enemy",op:-40},fame:1},
        },
      ],
    },
    {
      id: "du_ct_favorite",
      duty: ["courtier"],
      minR: 1,
      maxR: 4,
      title: "The favorite's request",
      trigger: !0,
      setup: (p,ctx)=>stranger(p,ctx,"the ruler's favorite",5),
      text: "{themFull} has the ear of {ruler} in ways the council does not. {theyHe} asks you, sweetly, to see that a certain petition never reaches the throne. The petition is from a widow whose land {theyHe} wants.",
      choices: [
        {
          t: "Lose the petition",
          r: "It is lost. The favorite smiles on you at every banquet now. The widow does not know your name.",
          fx: {merit:8,honor:-10,them:{op:30},owed:1},
        },
        {
          t: "Put it at the top of the pile",
          check: {s:"intrigue",s2:"etiquette",d:50},
          win: {
            r: "The petition is read; the widow keeps her land; nobody can prove you meant it. The favorite merely suspects.",
            fx: {honor:8,rep:3,them:{op:-10}},
          },
          lose: {
            r: "The favorite knows exactly what you did. Your invitations dry up for a season.",
            fx: {honor:6,merit:-8,them:{type:"enemy",op:-40}},
          },
        },
        {
          t: "Tell the ruler what the favorite asked",
          check: {s:"persuasion",d:55},
          win: {
            r: "The ruler laughs, then stops laughing. The favorite is sent to the country. You are not.",
            fx: {merit:18,rulerOp:10,them:{type:"enemy",op:-60}},
          },
          lose: {
            r: "The ruler does not believe you. Love is blind and you have just poked it in the eye.",
            fx: {merit:-12,rulerOp:-10,them:{type:"enemy",op:-60}},
          },
        },
      ],
    },
    {
      id: "du_ct_rumor",
      duty: ["courtier","envoy","lawyer"],
      minR: 1,
      title: "A rumor with your name in it",
      trigger: !0,
      setup: rival,
      text: "They say at court that you take bribes, or that you are bedding someone you should not, or both — the story changes by the hour. It started, you are fairly sure, with {them}.",
      choices: [
        {
          t: "Spread a better rumor about {them}",
          check: {s:"intrigue",s2:"deception",d:45},
          win: {
            r: "By the end of the week the court is laughing at {them} instead. Nobody remembers what they said about you.",
            fx: {rep:3,them:{op:-20},skill:{intrigue:2}},
          },
          lose: {r:"Your rumor is traced back to you. Now there are two scandals, both yours.",fx:{rep:-6,merit:-6}},
        },
        {
          t: "Confront {them} in front of witnesses",
          check: {s:"intimidation",s2:"persuasion",d:45},
          win: {
            r: "{them} stammers and denies everything, which is as good as a confession.",
            fx: {rep:4,fame:1,them:{type:"enemy",op:-30}},
          },
          lose: {
            r: "You lose your temper; {them} keeps theirs. The court decides the rumor must be true.",
            fx: {rep:-5,them:{type:"enemy",op:-30}},
          },
        },
        {
          t: "Ignore it and do your work",
          r: "Rumors die of boredom. This one takes a season.",
          fx: {rep:-2,merit:4,wil:.5},
        },
      ],
    },
    {
      id: "du_ct_dispatch",
      duty: ["envoy"],
      maxR: 2,
      title: "The lost dispatch case",
      trigger: !0,
      text: "Your horse threw a shoe at a ford in the rain, and when you came up the bank the dispatch case was gone — sealed letters for the court of {other}. A day behind you, the river runs into the forest.",
      setup: nbRealm,
      choices: [
        {
          t: "Search the river and the forest",
          check: {s:"tracking",s2:"survival",d:45},
          win: {
            r: "A charcoal-burner's boy fished it out and could not read it. A silver piece and you ride on, a day late and unharmed.",
            fx: {merit:8,coin:-1,skill:{tracking:2}},
          },
          lose: {r:"Two days of mud and nothing. You ride on empty-handed and confess.",fx:{merit:-10,rep:-4}},
        },
        {
          t: "Confess at once and ask for copies",
          r: "Honest, slow, embarrassing. The chancellor sends copies and a note about rivers.",
          fx: {merit:-4,honor:3},
        },
        {
          t: "Write the letters again from memory",
          check: {s:"learning",s2:"deception",d:55},
          win: {
            r: "You remember them almost word for word. Nobody ever knows. You have a frightening memory.",
            fx: {merit:10,skill:{learning:2}},
          },
          lose: {
            r: "You remember them wrong. {other} receives a letter that says something no one in your realm intended.",
            fx: {merit:-15,realmRel:-10},
          },
        },
      ],
    },
    {
      id: "du_ct_envoy_insult",
      duty: ["envoy"],
      minR: 1,
      title: "An insult at a foreign table",
      trigger: !0,
      setup: nbRealm,
      text: 'At the high table of {other}, a duke raises his cup "to {realmShort}, the realm that keeps its courage in its treasury." The hall laughs. Everyone watches you.',
      choices: [
        {
          t: "Answer with a toast of your own",
          check: {s:"persuasion",s2:"etiquette",d:50},
          win: {
            r: '"To {other}, which keeps its wit in its wine — and has drunk most of it." The hall roars; even the duke laughs. They respect you here now.',
            fx: {merit:14,fame:2,realmRel:4,skill:{diplomacy:2}},
          },
          lose: {
            r: "Your answer comes a moment too late and a little too clumsy. The duke smiles. You have been measured.",
            fx: {merit:-4,rep:-3},
          },
        },
        {
          t: "Swallow it and smile",
          r: "You smile. Later, the duke's own envoy apologizes in private. A small victory, invisible to everyone but you.",
          fx: {merit:4,wil:.5},
        },
        {
          t: "Rise and walk out of the hall",
          r: "You walk out. The talks are broken off for a month. Some at home call you proud; some call you right.",
          fx: {realmRel:-8,honor:4,fame:1},
        },
      ],
    },
    {
      id: "du_ct_treaty_clause",
      duty: ["envoy"],
      minR: 2,
      title: "One clause",
      trigger: !0,
      setup: nbRealm,
      text: "The trade treaty with {other} is agreed, all but one clause: who pays the bridge tolls on the border river. Their ambassador has been told to concede nothing. So have you.",
      choices: [
        {
          t: "Hold firm until they break",
          check: {s:"diplomacy",s2:"wil",d:55},
          win: {
            r: "Nine days. On the tenth they concede. The tolls are yours for twenty years, and the chancellor hears your name at council.",
            fx: {merit:20,rep:5,realmRel:-3,rulerOp:6},
          },
          lose: {
            r: "They walk away from the whole treaty. You hold firm on a clause and lose a treaty.",
            fx: {merit:-10,realmRel:-5},
          },
        },
        {
          t: "Split the tolls and sign today",
          r: "A fair treaty, signed by Friday. Nobody sings about it; everyone uses the bridge.",
          fx: {merit:10,realmRel:8},
        },
        {
          t: "Concede the tolls for a secret favor from their ambassador",
          check: {s:"intrigue",d:45},
          win: {
            r: "The tolls go to {other}. Their ambassador owes you personally, which is worth more.",
            fx: {owed:2,merit:4,secret:1},
          },
          lose: {
            r: 'Your own side finds out about the "favor." It looks exactly like treason.',
            fx: {merit:-20,rep:-8},
          },
        },
      ],
    },
    {
      id: "du_ct_widow_case",
      duty: ["lawyer"],
      maxR: 3,
      title: "The widow and the baron",
      trigger: !0,
      setup: (p,ctx)=>stranger(p,ctx,"a baron with a long memory",5),
      text: "A widow brings you her case: {themFull} has moved his boundary stones onto her mill. She can pay you four suns. The baron, hearing you are asked, sends word that he can pay forty — to have you plead for him instead.",
      choices: [
        {
          t: "Plead for the widow",
          check: {s:"learning",s2:"persuasion",d:50},
          win: {
            r: "The stones go back. The widow kisses your hands; the baron sends no more messages, which is itself a message.",
            fx: {honor:8,rep:6,fame:2,merit:8,them:{type:"enemy",op:-40}},
          },
          lose: {
            r: "The court sides with the baron. The widow loses her mill, and the baron knows you tried.",
            fx: {honor:4,rep:-2,them:{type:"enemy",op:-30}},
          },
        },
        {
          t: "Plead for the baron",
          r: "Forty suns, and a baron who now sends his business to you. The widow becomes a servant in his kitchen.",
          fx: {coin:40,honor:-8,merit:6,them:{type:"acquaint",op:25}},
        },
        {
          t: "Broker a settlement out of court",
          check: {s:"diplomacy",d:45},
          win: {
            r: "She keeps the mill; he keeps a strip of meadow; you are paid by both.",
            fx: {coin:20,rep:4,merit:6},
          },
          lose: {r:"Neither will budge, and both blame you.",fx:{rep:-3}},
        },
      ],
    },
    {
      id: "du_ct_magistrate_bribe",
      duty: ["lawyer"],
      minR: 3,
      title: "A heavy purse at the bench",
      trigger: !0,
      text: "You sit as judge in a murder. The accused is the son of a guildmaster; the evidence is strong; and a purse heavier than a year's salary has appeared in your chambers with no note.",
      choices: [
        {
          t: "Return the purse and judge by the evidence",
          r: "He hangs. The guildmaster hates you; the town trusts your court. Both will last.",
          fx: {honor:10,rep:6,merit:10,newRel:{type:"enemy",op:-50}},
        },
        {
          t: "Keep it, and find a doubt",
          r: "There is always a doubt, if you look. The boy goes free; you buy a house.",
          fx: {coin:400,honor:-15,rep:-4,secret:1},
        },
        {
          t: "Hand the purse to the crown as evidence of bribery",
          check: {s:"persuasion",d:45},
          win: {
            r: "Two hangings, a disgraced guildmaster, and your name spoken at the council table as an honest judge.",
            fx: {merit:22,rulerOp:8,fame:3},
          },
          lose: {
            r: "The guildmaster has friends on the council. Somehow it is your conduct under review.",
            fx: {merit:-10,rep:-5},
          },
        },
      ],
    },
    {
      id: "du_ct_double_agent",
      duty: ["spy"],
      title: "The informant who sells both ways",
      trigger: !0,
      setup: (p,ctx)=>stranger(p,ctx,"your informant"),
      text: "{themFull}, the best informant you have, is also selling your questions to the other side. You are certain now. {theyHe} does not know you know.",
      choices: [
        {
          t: "Feed {them} lies to carry back",
          check: {s:"deception",s2:"intrigue",d:50},
          win: {
            r: "For a season the other side chases ghosts you invented. Your handler calls it the cleanest work in years.",
            fx: {merit:18,skill:{deception:2},secret:1},
          },
          lose: {
            r: "{them} realizes. One morning {theyHe} is gone, and so is one of your best sources.",
            fx: {merit:-8},
          },
        },
        {
          t: "Turn {them}: they work for you alone now, or hang",
          check: {s:"intimidation",d:45},
          win: {
            r: "Terror is loyal. {them} becomes your creature.",
            fx: {merit:10,them:{type:"servant",op:-10},owed:3},
          },
          lose: {r:"{theyHe} agrees, and runs that night.",fx:{merit:-5}},
        },
        {
          t: "Have {them} quietly removed",
          r: "It is done. The quiet trade is not a kind one. You are less kind for it.",
          fx: {honor:-12,merit:8,wil:1},
        },
      ],
    },
    {
      id: "du_ct_cipher",
      duty: ["spy","scribe"],
      minR: 1,
      title: "Numbers in the margin",
      trigger: !0,
      setup: nbRealm,
      text: "A letter taken from a {other} courier: a hymn to the Mother, and in the margins, rows of little numbers. A cipher. If you break it, you will know what {other} plans.",
      choices: [
        {
          t: "Break it yourself, night after night",
          check: {s:"learning",s2:"int",d:55},
          win: {
            r: "A substitution keyed to the hymn's verses. The message: {other} is hiring mercenaries for the summer. You carry it to the council yourself.",
            fx: {merit:20,skill:{learning:2,intrigue:2},rulerOp:5},
          },
          lose: {
            r: "Weeks of numbers and you are no wiser. Someone else breaks it later and gets the credit.",
            fx: {merit:-4,int:.5},
          },
        },
        {
          t: "Hand it to the old cipher-master and learn",
          r: "He breaks it in an afternoon and teaches you how. You will never look at a hymn the same way.",
          fx: {skill:{learning:3,intrigue:3},merit:6},
        },
      ],
    },
    {
      id: "du_ct_embezzler",
      duty: ["scribe","steward","lawyer"],
      minR: 3,
      title: "Where the money went",
      trigger: !0,
      setup: (p,ctx)=>stranger(p,ctx,"a man of the chancellor's household",5),
      text: "Your audit finds it: for six years, {themFull} — a man of the chancellor's own household — has been skimming the bridge money. Four thousand suns. The chancellor is the most powerful person on the council.",
      choices: [
        {
          t: "Lay it before the whole council",
          check: {s:"persuasion",s2:"learning",d:55},
          win: {
            r: "The council cannot ignore the ledgers. {them} hangs; the chancellor is wounded; and every faction at court learns your name.",
            fx: {merit:30,fame:5,rulerOp:10,newRel:{type:"enemy",op:-60}},
          },
          lose: {
            r: "The chancellor's friends call it a clerk's error. Your career becomes very cold for a while.",
            fx: {merit:-20,rep:-8},
          },
        },
        {
          t: "Show the chancellor privately",
          r: 'The chancellor reads it, closes the ledger, and looks at you for a long time. "I will remember this." It sounded like thanks. It might have been a threat.',
          fx: {merit:10,owed:3,secret:1},
        },
        {
          t: "Keep the ledger. Leverage keeps.",
          r: "You make a copy and lock it away. Some day you will need a chancellor's goodwill.",
          fx: {secret:2,flag:"fl_ledger",skill:{intrigue:2}},
        },
      ],
    },
    {
      id: "du_ct_reform",
      duty: ["scribe","lawyer","steward","courtier"],
      minR: 3,
      title: "A reform of your own",
      trigger: !0,
      cool: 6,
      text: "You have seen the same mess for years: the tolls, the courts, the way grain is stored. You could draft a reform and put it before the council — your name on it, for good or ill.",
      choices: [
        {
          t: "Draft it, and argue it before the council",
          check: {s:"learning",s2:"persuasion",d:55},
          win: {
            r: "It passes, mostly. The realm runs a little better, and people start calling it by your name.",
            fx: {merit:25,fame:4,realmStab:3,rulerOp:8,deed:"Wrote a reform adopted by the council"},
          },
          lose: {
            r: "The great lords tear it apart; they liked the old mess. You learn who your enemies are.",
            fx: {merit:4,rep:-3},
          },
        },
        {
          t: "Let a councillor present it as theirs",
          r: "It passes under someone else's name. They owe you, which may be worth more.",
          fx: {merit:10,owed:2,patronOp:15},
        },
        {t:"Not yet",r:"Not yet. There is always next year.",fx:{}},
      ],
    },
    {
      id: "du_ct_traitor",
      duty: ["spy","courtier"],
      minR: 2,
      title: "A councillor in a back room",
      trigger: !0,
      setup: nbRealm,
      text: "You follow a hooded figure from the palace to a back room in the river quarter, and see the face when the hood comes down: a member of the royal council, meeting an agent of {other}.",
      choices: [
        {
          t: "Report it to {ruler} directly",
          check: {s:"persuasion",d:50},
          win: {
            r: "An arrest at dawn, a confession by noon, a vacant council seat by evening. The crown thanks you in person.",
            fx: {merit:30,rulerOp:15,fame:3},
          },
          lose: {
            r: "The councillor has an answer for everything and friends for the rest. You are the one watched now.",
            fx: {merit:-10,newRel:{type:"enemy",op:-60}},
          },
        },
        {
          t: "Approach the councillor: your silence has a price",
          r: "Silence is expensive. The councillor pays, and will remember who sent the bill.",
          fx: {coin:300,secret:2,honor:-8,newRel:{type:"enemy",op:-40}},
        },
        {
          t: "Keep watching. Find out what they are selling.",
          check: {s:"stealth",s2:"intrigue",d:55},
          win: {
            r: "Troop counts and the date of the muster. When you finally report, you bring the whole web.",
            fx: {merit:40,rulerOp:15,fame:4},
          },
          lose: {
            r: "They see you. The councillor and the agent both disappear. So does your best chance.",
            fx: {merit:-5},
          },
        },
      ],
    },
    {
      id: "du_ct_petitions",
      duty: ["courtier","scribe"],
      minR: 1,
      maxR: 4,
      title: "Petitions at the gate",
      trigger: !0,
      text: 'You sort the petitions before they go up: three hundred this week. A miller cheated, a daughter stolen, a soldier unpaid, a lord asking for a market charter and offering you "a token of his esteem."',
      choices: [
        {
          t: "Send up the worst injustices first",
          r: "The crown hears of a stolen girl and a cheated miller before it hears of markets. Small mercies, your doing.",
          fx: {honor:5,merit:6,rep:2},
        },
        {
          t: "Send up the market charter, with the token in your pocket",
          r: "The lord gets his market; you get his token; the miller waits another month.",
          fx: {coin:50,honor:-5,merit:4},
        },
        {
          t: "Sort them by what will please the crown",
          check: {s:"etiquette",s2:"intrigue",d:40},
          win: {
            r: "The ruler has a pleasant week of easy decisions and asks who sorted them.",
            fx: {merit:12,rulerOp:4},
          },
          lose: {r:"You misjudge a mood. A dull petition lands on a bad day.",fx:{merit:-3}},
        },
      ],
    },
  ]);
  A.defEvents([
    {
      id: "du_ch_heretic",
      duty: ["clergy"],
      title: "A preacher in the market",
      trigger: !0,
      text: "A barefoot preacher draws crowds in the market: the priests are fat, he says, and the gods want the poor to keep their tithes. Your superiors want him silenced. Some of what he says is true.",
      choices: [
        {
          t: "Debate him before the crowd",
          check: {s:"faith",s2:"persuasion",d:50},
          win: {
            r: "You meet his scripture with scripture and his anger with kindness. The crowd drifts back to the temple. So, eventually, does he.",
            fx: {merit:15,fame:2,piety:3,skill:{faith:2}},
          },
          lose: {
            r: "He makes you look like the fat priest he described. The crowd jeers you out of the square.",
            fx: {merit:-6,rep:-4},
          },
        },
        {
          t: "Have the watch arrest him",
          r: "He is taken. The square is quiet. You do not sleep well, and the poor no longer greet you.",
          fx: {merit:8,honor:-5,piety:-2},
        },
        {
          t: "Bring his complaints to your bishop",
          r: "The bishop listens, sighs, and halves the tithe on the poorest parishes. The preacher moves on, robbed of his sermon.",
          fx: {honor:6,merit:6,piety:4},
        },
      ],
    },
    {
      id: "du_ch_tithe",
      duty: ["clergy"],
      minR: 1,
      title: "The lord will not pay",
      trigger: !0,
      setup: (p,ctx)=>stranger(p,ctx,"a lord who owes the temple",5),
      text: "{themFull} has not paid the temple's tithe in three years. {theyHe} says the war took it. The temple says the gods do not accept excuses. You are sent to collect.",
      choices: [
        {
          t: "Threaten the curse of the faith",
          check: {s:"intimidation",s2:"faith",d:50},
          win: {
            r: "The lord pays, pale, every coin. The temple is pleased with you.",
            fx: {merit:14,them:{type:"enemy",op:-30}},
          },
          lose: {
            r: "The lord laughs and sets his dogs on you. The temple is not pleased with you.",
            fx: {merit:-6,health:-6},
          },
        },
        {
          t: "Negotiate a payment over five years",
          check: {s:"diplomacy",d:40},
          win: {
            r: "A fair settlement. The lord respects you; the temple is paid slowly but surely.",
            fx: {merit:10,them:{op:20}},
          },
          lose: {r:"He agrees, then forgets. Again.",fx:{merit:-2}},
        },
        {
          t: "Forgive a year in exchange for a new chapel",
          r: "He builds the chapel and puts his name over the door. The faith gains a chapel, and you a friend among the lords.",
          fx: {merit:8,them:{type:"friend",op:30},piety:2},
        },
      ],
    },
    {
      id: "du_ch_plague",
      duty: ["clergy","healer"],
      title: "The sweating sickness",
      trigger: !0,
      text: "The sweating sickness is in the lower town. The rich have fled; the physicians have fled; the dying are asking for a priest, or anyone.",
      choices: [
        {
          t: "Go down among them",
          check: {s:"sta",s2:"medicine",d:45},
          win: {
            r: "You nurse the sick for six weeks and do not catch it. The lower town will name children after you.",
            fx: {fame:4,piety:8,honor:8,merit:15},
          },
          lose: {
            r: "You catch it. For two weeks you are one of the dying. Then, somehow, you are not.",
            fx: {health:-40,piety:6,honor:6,merit:10,cause:"the sweating sickness"},
          },
        },
        {
          t: "Pray for them from the temple steps",
          r: "You pray. The bells ring. It is not nothing, but it is not much.",
          fx: {piety:2},
        },
        {
          t: "Organize the healthy to carry food and water",
          check: {s:"command",s2:"stewardship",d:40},
          win: {
            r: "Wagons of bread and barrels of clean water, every day, at your order. Fewer die. The town council takes note.",
            fx: {merit:12,fame:2,skill:{command:2}},
          },
          lose: {r:"The carriers fall sick too. It is a bad month.",fx:{happy:-8}},
        },
      ],
    },
    {
      id: "du_ch_election",
      duty: ["clergy"],
      minR: 2,
      maxR: 3,
      title: "The bishop is dead",
      trigger: !0,
      cool: 8,
      setup: rival,
      text: "The old bishop is dead, and the chapter must choose a successor. You have a chance. So does {them}, who has more money and fewer scruples.",
      choices: [
        {
          t: "Campaign on your record",
          check: {s:"faith",s2:"persuasion",d:55},
          win: {
            r: "The chapter chooses you. You are lifted onto a chair and carried through the city.",
            fx: {promote:1,fame:4,merit:10},
          },
          lose: {
            r: "{them} wins by three votes. You kiss {theirHis} ring and swallow it.",
            fx: {merit:6,them:{op:-15}},
          },
        },
        {
          t: "Buy the votes you need",
          req: p=>p.coin>=300,
          check: {s:"intrigue",d:45},
          win: {
            r: "Three hundred suns, quietly spent. You are bishop. The gods saw, of course.",
            fx: {coin:-300,promote:1,piety:-10,honor:-8},
          },
          lose: {r:"The money goes, the votes do not, and the story gets out.",fx:{coin:-300,rep:-10,merit:-10}},
        },
        {
          t: "Support {them}, for a price",
          r: "Your votes win the mitre for {them}. In return you are made archdeacon, and {theyHe} owes you.",
          fx: {merit:14,owed:2,them:{type:"acquaint",op:20}},
        },
      ],
    },
    {
      id: "du_ch_confession",
      duty: ["clergy"],
      title: "Something said in confession",
      trigger: !0,
      text: "A frightened man tells you in confession that he was paid to poison a well in the next village, and did not, and now the men who paid him are looking for him.",
      choices: [
        {
          t: "Keep the seal of confession, and hide him",
          r: "The seal holds. You hide him in the bell-tower for a month, then send him north.",
          fx: {honor:6,piety:5,wil:.5},
        },
        {
          t: "Find out who paid him",
          check: {s:"intrigue",s2:"persuasion",d:45},
          win: {
            r: "A lord's steward, settling a feud with poison. You hold that knowledge like a coal in your hand.",
            fx: {secret:1,merit:6},
          },
          lose: {r:"He clams up and flees. You know only that someone, somewhere, wanted a village dead.",fx:{}},
        },
      ],
    },
    {
      id: "du_ch_relic",
      duty: ["clergy"],
      minR: 1,
      title: "A miracle for sale",
      trigger: !0,
      text: "A pilgrim offers the temple a finger-bone of a saint. It is almost certainly a pig's. A relic would bring pilgrims, and pilgrims bring alms.",
      choices: [
        {
          t: "Buy it and say nothing",
          r: "The pig's finger heals three people that year, or they believe it did. The alms box is never empty.",
          fx: {merit:10,piety:-4,coin:20},
        },
        {
          t: "Expose the fraud",
          r: "The pilgrim is whipped out of town. You are respected and poorer.",
          fx: {honor:4,merit:4},
        },
      ],
    },
  ]);
  A.defEvents([
    {
      id: "du_gd_masterpiece",
      duty: ["smith","mason","carpenter","weaver","bowyer","artist"],
      minR: 1,
      maxR: 1,
      title: "Your masterpiece",
      trigger: !0,
      cool: 4,
      text: "The guild will judge your masterpiece at the spring session: one perfect piece, made alone, to prove you a master. A great piece can make your name. A poor one can end it.",
      choices: [
        {
          t: "Attempt something bold",
          check: {s:"craft",s2:"int",d:55},
          win: {
            r: 'The masters pass it hand to hand in silence. Then the oldest says, "Well." You are a master of the guild.',
            fx: {merit:40,rep:10,fame:2,masterwork:"a masterpiece for the guild"},
          },
          lose: {r:'Bold, and flawed. "Next year," the masters say.',fx:{merit:6,rep:-3}},
        },
        {
          t: "Make something safe and perfect",
          check: {s:"craft",d:45},
          win: {
            r: "Faultless and dull. They pass you without a word of praise, which is still passing.",
            fx: {merit:30,rep:4},
          },
          lose: {r:"Even the safe piece has a flaw. A year more as a journeyman.",fx:{merit:4}},
        },
      ],
    },
    {
      id: "du_gd_undercut",
      // [X1 baked patch events/99999-v2-content V2C-UNDERCUT-MASTER] du_gd_undercut ("Someone is undercutting you ...
      // paying Hamo to ruin you") had no rank gate, so a 13-year-old apprentice with no shop of his own was told his
      // trade was being ruined. Selling at a price is a master's business: the scene now needs rank 2 (a master) of a
      // guild career.
      duty: ["guild"],
      minR: 2,
      title: "Someone is undercutting you",
      trigger: !0,
      setup: rival,
      text: "{them} is selling at a price that cannot pay for the materials. Either {theyHe} is cheating on quality, or someone is paying {them} to ruin you.",
      choices: [
        {
          t: "Prove the cheat to the guild wardens",
          check: {s:"craft",s2:"persuasion",d:45},
          win: {
            r: "Cracked iron, short measures, rotten wool. The wardens fine {them} heavily. Your customers come back.",
            fx: {rep:6,merit:8,them:{type:"enemy",op:-30}},
          },
          lose: {r:"The wardens find nothing. Your customers keep drifting.",fx:{rep:-4,coin:-20}},
        },
        {
          t: "Match the price and outlast {them}",
          req: p=>p.coin>=80,
          r: "A lean winter for both of you. You have deeper pockets. In spring, {them} closes.",
          fx: {coin:-80,rep:3,merit:6},
        },
        {
          t: "Offer {them} a partnership",
          check: {s:"persuasion",s2:"trade",d:45},
          win: {
            r: "Two shops, one price, twice the business. Your rival becomes your partner.",
            fx: {coin:40,them:{type:"friend",op:40}},
          },
          lose: {r:"{theyHe} laughs. The price war goes on.",fx:{coin:-15}},
        },
      ],
    },
    {
      id: "du_gd_commission",
      duty: ["guild"],
      minR: 2,
      title: "A great lord's commission",
      trigger: !0,
      setup: (p,ctx)=>stranger(p,ctx,"a great lord with expensive tastes",5),
      text: "{themFull} wants your best work, and wants it by the feast of St. Ermin — six weeks. The price is a year's earnings. The time is impossible.",
      choices: [
        {
          t: "Accept and work day and night",
          check: {s:"craft",s2:"sta",d:55},
          win: {
            r: "Delivered at dawn on the feast day. {them} shows it to every guest. Your name travels to the capital.",
            fx: {coin:400,fame:4,rep:8,merit:15,health:-8,them:{op:25}},
          },
          lose: {r:"Late, and not your best. {them} pays half and tells people why.",fx:{coin:150,rep:-6,health:-8}},
        },
        {
          t: "Accept, and hire journeymen to help",
          req: p=>p.coin>=80,
          r: "Your name, other hands. It is good enough, on time. Profitable, if not glorious.",
          fx: {coin:220,rep:2,merit:8},
        },
        {
          t: "Decline: good work takes time",
          r: "The lord goes elsewhere. You keep your name, and your nights.",
          fx: {honor:2},
        },
      ],
    },
    {
      id: "du_gd_election",
      duty: ["guild"],
      minR: 2,
      title: "The guild elects its wardens",
      trigger: !0,
      cool: 5,
      setup: rival,
      text: "The guild elects two wardens this year. Wardens set prices, judge disputes and sit with the town council. You could stand. So could {them}.",
      choices: [
        {
          t: "Stand on your reputation",
          check: {s:"persuasion",s2:"trade",d:50},
          win: {
            r: "Elected warden. You have a seat at the town council now, and a say in who rises in the guild.",
            fx: {rep:10,fame:2,merit:20,flag:"fl_warden"},
          },
          lose: {r:"You lose by four votes to {them}.",fx:{rep:-2,them:{op:-10}}},
        },
        {
          t: "Buy the feast that wins the vote",
          req: p=>p.coin>=120,
          r: "Roast swans and three barrels of wine. Elected warden — and a little poorer.",
          fx: {coin:-120,rep:6,merit:15,flag:"fl_warden"},
        },
      ],
    },
    {
      id: "du_gd_caravan",
      // [X1 baked patch events/99999-v2-content V2C-CARAVAN-MASTER] du_gd_caravan ("Your caravan from the south is ten
      // days late") came to an apprentice merchant, who owns no caravan. It needs rank 2 of the merchant career, as the
      // loan scene needs rank 3.
      duty: ["merchant"],
      minR: 2,
      title: "The caravan is late",
      trigger: !0,
      text: "Your caravan from the south is ten days late. Rumor says bandits on the Grey Road; rumor also says your factor sold the goods in the first town and ran.",
      choices: [
        {
          t: "Ride out with hired guards",
          req: p=>p.coin>=40,
          check: {s:"command",s2:"tracking",d:45},
          win: {
            r: "You find the wagons in a gully, guarded by your own men, a wheel broken. Everything arrives — late but whole.",
            fx: {coin:120,rep:4,merit:6},
          },
          lose: {r:"Bandits. You save half the cargo and lose two guards.",fx:{coin:-40,health:-10}},
        },
        {
          t: "Write it off and insure the next one",
          r: "A loss, written in the ledger. Next time you insure with the Ostran bankers.",
          fx: {coin:-80,skill:{trade:2}},
        },
      ],
    },
    {
      id: "du_gd_loan",
      duty: ["merchant"],
      minR: 3,
      title: "A lord wants a loan",
      trigger: !0,
      setup: (p,ctx)=>stranger(p,ctx,"a great lord short of silver",5),
      text: "{themFull} needs two thousand suns for his daughter's wedding and his son's war-horse. He offers his word as security, and a seat at his table.",
      choices: [
        {
          t: "Lend it, secured on his wool revenues",
          req: p=>p.coin>=400,
          check: {s:"trade",s2:"diplomacy",d:50},
          win: {
            r: 'Repaid in three years with interest, and the lord now talks of you at court as "my banker."',
            fx: {coin:300,them:{type:"friend",op:30},merit:15,fame:2},
          },
          lose: {r:"The wool fails. You get half back, and a lord who avoids your eye.",fx:{coin:-200}},
        },
        {t:"Refuse politely",r:"He finds the money elsewhere, and a banker elsewhere.",fx:{}},
      ],
    },
    {
      id: "du_gd_bridge",
      duty: ["engineer","mason"],
      minR: 1,
      title: "The bridge is cracking",
      trigger: !0,
      text: "The great stone bridge you helped repair has a crack running through the second pier. The council wants to hold the summer fair on it in a week.",
      choices: [
        {
          t: "Close the bridge and tell them why",
          check: {s:"craft",s2:"persuasion",d:45},
          win: {
            r: "The council grumbles, the fair moves, and in August the pier falls into an empty river. They stop grumbling.",
            fx: {rep:10,merit:14,fame:2},
          },
          lose: {
            r: "They overrule you. The fair goes ahead. The pier holds — this time. Your warning is remembered as fear.",
            fx: {rep:-4},
          },
        },
        {
          t: "Shore it up in secret, fast",
          check: {s:"craft",s2:"siegecraft",d:50},
          win: {
            r: "Timbers, wedges and iron bands at night. The fair goes ahead; the bridge holds; no one knows.",
            fx: {merit:10,skill:{craft:2}},
          },
          lose: {
            r: "It is not enough. People are hurt when a parapet goes. Your name is in the inquiry.",
            fx: {rep:-12,merit:-15},
          },
        },
      ],
    },
  ]);
  A.defEvents([
    {
      id: "du_ln_lord_wound",
      duty: ["healer"],
      minR: 1,
      title: "A lord's wound gone bad",
      trigger: !0,
      setup: (p,ctx)=>stranger(p,ctx,"a wounded lord",5),
      text: "{themFull}'s leg wound has turned black at the edges. His physicians want to bleed him. You think the leg must come off today or he dies by Sunday.",
      choices: [
        {
          t: "Insist on the saw",
          check: {s:"medicine",s2:"wil",d:50},
          win: {
            r: "He lives, one-legged and furious, and then grateful. His family will send you every rich patient in the province.",
            fx: {rep:12,merit:15,fame:3,them:{type:"friend",op:40}},
          },
          lose: {r:"He dies under the saw. His sons blame you, loudly.",fx:{rep:-10,them:{type:"enemy",op:-30}}},
        },
        {
          t: "Bleed him as the physicians say",
          r: "He dies on Sunday. No one blames you; no one remembers you.",
          fx: {rep:-2},
        },
      ],
    },
    {
      id: "du_ln_student",
      duty: ["teacher"],
      title: "A noble pupil",
      trigger: !0,
      setup: (p,ctx)=>stranger(p,ctx,"a duke's unruly son",5),
      text: "You are hired to tutor {themFull}, a duke's son who has driven off three tutors already. He bit the last one.",
      choices: [
        {
          t: "Win him with stories of war and history",
          check: {s:"learning",s2:"persuasion",d:45},
          win: {
            r: "He reads Varro's campaigns by candlelight now. The duke pays you double and recommends you at court.",
            fx: {coin:120,rep:8,merit:12,them:{type:"student",op:40}},
          },
          lose: {r:"He bites you too.",fx:{health:-3,rep:-2}},
        },
        {
          t: "Discipline, the old way",
          check: {s:"intimidation",d:45},
          win: {
            r: "He learns, and fears you, and in twenty years will be a duke who remembers.",
            fx: {coin:80,merit:8,them:{type:"student",op:-10}},
          },
          lose: {r:"The duke is told. You are dismissed.",fx:{rep:-6}},
        },
      ],
    },
    {
      id: "du_sea_storm",
      duty: ["sailor"],
      title: "Weather off the cape",
      trigger: !0,
      text: "The sky goes yellow off the cape and the swell comes in long and heavy. The captain wants to run for harbor through the reef passage. You know that passage.",
      choices: [
        {
          t: "Take the helm through the reef",
          check: {s:"sea",s2:"ins",d:50},
          win: {
            r: "You thread the reef by the color of the water. The ship is in harbor when the storm hits. The captain gives you his own cup of wine.",
            fx: {merit:15,rep:6,skill:{sea:2}},
          },
          lose: {r:"You scrape a reef. The ship lives; the cargo does not.",fx:{merit:-6,health:-8}},
        },
        {
          t: "Advise riding it out at sea",
          r: "Two days of hell, but you live. The captain grudgingly admits you were right.",
          fx: {merit:6,health:-6},
        },
      ],
    },
    {
      id: "du_sea_cargo",
      duty: ["sailor","pirate"],
      minR: 1,
      title: "A cargo that is not on the manifest",
      trigger: !0,
      text: "In the hold, behind the wine, are twelve crates that are not on the manifest. They are heavy, and they clink. The harbor inspectors come aboard at dawn.",
      choices: [
        {
          t: "Warn the captain and help hide them",
          r: "The inspectors see wine and nothing else. The captain pays you a share and remembers you.",
          fx: {coin:50,merit:8,honor:-3},
        },
        {
          t: "Tell the inspectors",
          r: "Contraband swords for rebels. The captain hangs; you get a reward and a reputation among sailors you would rather not have.",
          fx: {coin:80,honor:2,rep:-6},
        },
      ],
    },
    {
      id: "du_gl_rigged_joust",
      duty: ["knight"],
      title: "A purse to fall",
      trigger: !0,
      setup: (p,ctx)=>stranger(p,ctx,"a great lord's nephew",5),
      text: "Before the final tilt, a man brings you a heavy purse: {themFull}'s family would be grateful if you fell in the second course. The prize is smaller than the purse.",
      choices: [
        {
          t: "Ride to win",
          check: {s:"lance",s2:"riding",d:55},
          win: {
            r: "You unhorse {them} in the first course. The crowd goes wild. His family does not.",
            fx: {fame:5,coin:100,merit:15,honor:5,them:{type:"enemy",op:-30}},
          },
          lose: {
            r: "You ride honestly and lose honestly. The purse goes back. Nobody believes you refused it.",
            fx: {honor:4},
          },
        },
        {
          t: "Take the purse and fall",
          r: "You fall convincingly. The purse is heavy. The heralds will not sing of you.",
          fx: {coin:250,honor:-12,fame:-1},
        },
      ],
    },
    {
      id: "du_gl_pits",
      duty: ["pitfighter"],
      title: "Go down in the third",
      trigger: !0,
      text: "The pit-master tells you, smiling, that you will go down in the third round tonight. There is a lot of money on the other man.",
      choices: [
        {
          t: "Go down in the third",
          r: "You go down in the third. The pit-master pays you well and keeps you fed.",
          fx: {coin:80,honor:-6,fame:-1},
        },
        {
          t: "Win anyway",
          check: {s:"unarmed",s2:"str",d:55},
          win: {
            r: "You put him down in the second. The crowd loves you; the pit-master does not.",
            fx: {fame:4,merit:10,newRel:{type:"enemy",op:-40}},
          },
          lose: {r:"You try to win and lose anyway, badly.",fx:{health:-18,fame:-1}},
        },
      ],
    },
    {
      id: "du_gl_maneater",
      duty: ["hunter","explorer"],
      title: "Something is taking shepherds",
      trigger: !0,
      text: "Three shepherds dead in a month above the village, and tracks bigger than any wolf's. The village offers everything it has.",
      choices: [
        {
          t: "Hunt it",
          check: {s:"tracking",s2:"bow",d:55},
          win: {
            r: "A great grey wolf, old and lame, too slow for deer. You bring the head down to the square.",
            fx: {fame:4,coin:40,merit:12,honor:4},
          },
          lose: {
            r: "It finds you first. You live, and it does not, but you will limp.",
            fx: {health:-30,fame:2,wound:"limp",cause:"a great wolf"},
          },
        },
        {
          t: "Set traps and wait",
          check: {s:"survival",d:40},
          win: {r:"The trap holds it. Not glorious, but the shepherds sleep again.",fx:{coin:30,merit:6}},
          lose: {r:"It avoids every trap.",fx:{}},
        },
      ],
    },
    {
      id: "du_un_turf",
      duty: ["thief"],
      title: "Another crew on your streets",
      trigger: !0,
      setup: rival,
      text: "{them} and a new crew are working your streets — your marks, your fences, your watchmen on the take.",
      choices: [
        {
          t: "Run them off with knives",
          check: {s:"intimidation",s2:"melee",d:50},
          win: {
            r: "One night, three cut faces, no more trouble. The street is yours again.",
            fx: {merit:15,rep:6,them:{type:"enemy",op:-50}},
          },
          lose: {r:"They were ready. You crawl home bleeding.",fx:{health:-22,rep:-6,cause:"a knife in an alley"}},
        },
        {
          t: "Sell them to the watch",
          check: {s:"deception",d:45},
          win: {
            r: "A tip to the right sergeant. {them} hangs; you are a little more trusted by the watch, and a little less by your own.",
            fx: {merit:10,honor:-6},
          },
          lose: {r:"The sergeant takes your tip and your purse.",fx:{coin:-30}},
        },
        {
          t: "Offer them a share under you",
          check: {s:"persuasion",s2:"intimidation",d:50},
          win: {r:"Your crew is twice the size now, and {them} answers to you.",fx:{merit:18,rep:8,them:{op:10}}},
          lose: {r:"{theyHe} laughs in your face.",fx:{rep:-3}},
        },
      ],
    },
    {
      id: "du_un_score",
      duty: ["thief","pirate"],
      minR: 1,
      title: "The big one",
      trigger: !0,
      text: "A goldsmith's strongroom, the night of the guild feast, when every journeyman is drunk. Months of planning. One chance.",
      choices: [
        {
          t: "Do it yourself",
          check: {s:"stealth",s2:"dagger",d:55},
          win: {
            r: "In through the roof, out through the cellar, a sack of gold plate on your back. The city talks of nothing else.",
            fx: {coin:400,merit:20,rep:10,fame:2},
          },
          lose: {
            r: "A dog. Shouting. You run with nothing, and the watch has your description.",
            fx: {flag:"outlaw",rep:-6},
          },
        },
        {
          t: "Plan it, and let your crew do it",
          r: "You take the planner's share and none of the risk. Half the crew is taken; none of them names you.",
          fx: {coin:150,merit:10},
        },
        {
          t: "Too risky. Walk away.",
          r: "You walk away. Next week another crew tries it and hangs.",
          fx: {wil:.5},
        },
      ],
    },
    {
      id: "du_un_watch",
      duty: ["thief","bounty"],
      title: "A new captain of the watch",
      trigger: !0,
      text: "The new captain of the watch is honest, they say. Honest captains are bad for business — and for some, good.",
      choices: [
        {
          t: "Find his price anyway",
          check: {s:"persuasion",s2:"intrigue",d:55},
          win: {
            r: "Every man has a price. His was his sister's debts. You paid them.",
            fx: {coin:-80,merit:14,owed:2},
          },
          lose: {r:"He really is honest. Now he knows your name.",fx:{rep:-4,flag:"outlaw"}},
        },
        {t:"Lie low for a season",r:"A thin season. Your crew grumbles. You are all alive.",fx:{coin:-20}},
      ],
    },
    {
      id: "du_co_contract",
      duty: ["mercenary"],
      title: "Two employers, one war",
      trigger: !0,
      setup: nbRealm,
      text: "The company's contract runs out at midsummer, and both sides of the border war want you. {other} offers more. Your old employer offers honor and back pay.",
      choices: [
        {
          t: "Go to the highest bidder",
          r: "Gold is gold. You change colors by Saturday. Some of your old comrades will be across the field.",
          fx: {coin:120,honor:-6,merit:8},
        },
        {
          t: "Stay with your employer",
          r: "Your captain calls it a sound choice: companies that switch sides do not get the next contract.",
          fx: {honor:6,merit:10,rep:4},
        },
      ],
    },
  ]);
  A.defEvents([
    {
      id: "du_cm_harvest",
      duty: ["farm","herd"],
      title: "Blight in the barley",
      trigger: !0,
      text: "Black rust in the barley, field after field. If it spreads, your family goes hungry this winter. The old woman at the crossroads says to burn the worst fields now.",
      choices: [
        {
          t: "Burn the worst fields",
          check: {s:"husbandry",d:40},
          win: {
            r: "You lose a third of the crop and save the rest. Your neighbors, who did not burn, lose everything.",
            fx: {merit:10,rep:4,coin:10},
          },
          lose: {r:"You burned too late. A thin winter.",fx:{health:-6,happy:-6}},
        },
        {
          t: "Pray and wait",
          r: "The rust takes half. The lord takes his share of what is left. It is a hungry winter.",
          fx: {health:-8,happy:-8,piety:2},
        },
      ],
    },
    {
      id: "du_cm_sergeant",
      duty: ["common"],
      title: "The recruiting sergeant",
      trigger: !0,
      cool: 4,
      cond: (p,C)=>C.adult(p)&&!p.mil&&!C.unfree(p)&&!p.ruler,
      text: 'A recruiting sergeant sets up a table outside the inn: a drum, a flag, and a pile of silver coins. "Three meals a day, a coat, a spear, and pay every month! Who wants to see the world?"',
      choices: [
        {
          t: "Take the silver and enlist",
          r: "You put your mark on the roll. Tomorrow you march.",
          fx: p=>{const r=A.enlist(p,!1);return r&&r.ok?"":r&&r.msg||""},
        },
        {
          t: "Ask him about promotion",
          check: {s:"persuasion",d:35},
          win: {
            r: '"Can you read? Sergeants who read become captains." He winks. "Think on it." You do.',
            fx: {flag:"fl_sergeant_tip"},
          },
          lose: {r:'He laughs at you. "Promotion? Survive first."',fx:{}},
        },
        {
          t: "Stay with the plough",
          r: "You watch the drum go down the road with a dozen boys behind it.",
          fx: {},
        },
      ],
    },
    {
      id: "du_cm_priest_letters",
      duty: ["common"],
      title: "The priest's offer",
      trigger: !0,
      once: !0,
      cond: (p,C)=>!p.literate&&C.adult(p)&&!p.ruler,
      text: 'The village priest has noticed you at the back of the service, mouthing the words. "Come to me after vespers," he says. "I could teach you your letters, if you can bear the boredom."',
      choices: [
        {
          t: "Go every evening",
          check: {s:"int",d:35},
          win: {
            r: "A winter of candle-stubs and slate. By spring you can read. A whole world just opened its door.",
            fx: {literate:1,skill:{learning:4},int:1},
          },
          lose: {
            r: "The letters swim. You learn a little, and the priest says not to give up.",
            fx: {skill:{learning:2}},
          },
        },
        {t:"You have no time for letters",r:"You thank him and go back to work.",fx:{}},
      ],
    },
    {
      id: "du_cm_clerk_wanted",
      duty: ["common"],
      title: "A clerk who can count",
      trigger: !0,
      cool: 5,
      cond: p=>p.literate&&!p.ruler,
      setup: (p,ctx)=>stranger(p,ctx,"the lord's steward"),
      text: "{themFull}, the lord's steward, needs a clerk who can read the rent rolls and add a column without moving his lips. Someone told {them} you can read.",
      choices: [
        {
          t: "Take the post",
          r: "You leave the field for the counting-house. The pay is no better yet. The road ahead is.",
          fx: p=>{A.leaveRolesFor&&A.leaveRolesFor(p,"job",!0),p.job={c:"scribe",r:0,y:0,perf:55,rep:25,merit:0,since:A.absDay()},A.log("You become a copyist in the steward's office. The Court & Government path is open to you.","big")},
        },
        {t:"Stay where you are",r:"You stay. Someone else takes the post, and the road.",fx:{}},
      ],
    },
    {
      id: "du_cm_servant_eye",
      duty: ["servant","cook"],
      title: "Noticed in the great hall",
      trigger: !0,
      cool: 5,
      setup: (p,ctx)=>stranger(p,ctx,"the lord's chamberlain",4),
      text: 'You catch a falling platter at the high table without spilling a drop of sauce. {themFull}, the chamberlain, has seen. "Quick hands. Quick wits too?"',
      choices: [
        {
          t: "Make yourself useful to the chamberlain",
          check: {s:"etiquette",s2:"int",d:40},
          win: {
            r: "Within a year you serve in the lord's own chambers. You hear everything.",
            fx: {merit:20,rep:6,them:{type:"mentor",op:30}},
          },
          lose: {r:"You try too hard and spill wine on the chamberlain. Back to the kitchens.",fx:{merit:-4}},
        },
        {t:"Keep your head down",r:"You keep your head down. It is safer below stairs.",fx:{}},
      ],
    },
    {
      id: "du_cm_tax",
      duty: ["farm","herd","fish","labor","miner"],
      title: "A new tax",
      trigger: !0,
      text: "The lord's men read out a new tax: a sixth of every hearth's goods, for the war. The village meets in the church to decide what to do.",
      choices: [
        {t:"Pay, and grumble",r:"You pay. Everyone pays. The winter is thinner.",fx:{coin:-15,happy:-4}},
        {
          t: "Speak for the village to the lord's steward",
          check: {s:"persuasion",s2:"wil",d:50},
          win: {
            r: "The steward halves the tax for your village. Your neighbors look at you differently now — as someone who speaks.",
            fx: {fame:3,rep:6,honor:4},
          },
          lose: {r:"You are beaten for your insolence. The tax stands.",fx:{health:-12,honor:3}},
        },
        {
          t: "Hide the good grain in the church crypt",
          check: {s:"stealth",s2:"deception",d:45},
          win: {
            r: "The lord's men find thin sacks and lean pigs. The real harvest waits under the saints.",
            fx: {coin:10,honor:-1},
          },
          lose: {r:"Found. The fine is double the tax.",fx:{coin:-30}},
        },
      ],
    },
    {
      id: "du_cm_boundary",
      duty: ["farm","herd"],
      title: "The boundary stone moved",
      trigger: !0,
      setup: rival,
      text: "Your boundary stone has walked two yards onto your field overnight. {them}, your neighbor, swears it was always there.",
      choices: [
        {
          t: "Take it to the manor court",
          check: {s:"persuasion",d:40},
          win: {
            r: "The reeve has the old map. The stone goes back. {them} pays a fine and hates you.",
            fx: {rep:4,them:{type:"enemy",op:-20}},
          },
          lose: {r:"The reeve is {them}'s cousin.",fx:{coin:-10,them:{type:"enemy",op:-20}}},
        },
        {
          t: "Move it back at night",
          r: "It moves back. And forward. And back. This will go on for years.",
          fx: {them:{type:"rival",op:-10}},
        },
        {t:"Let it go",r:"Two yards. Not worth a feud.",fx:{honor:1}},
      ],
    },
  ]);
  A.defEvents([
    {
      id: "cn_war_vote",
      council: ["any"],
      title: "The council divides on war",
      trigger: !0,
      cool: 3,
      cond: p=>{const r=A.realm(p.realm);return r&&!A.atWar(r.id).length&&A.neighbors(r.id).length>0},
      setup: (p,ctx)=>{const r=A.realm(p.realm),n=A.neighbors(r.id).map(A.realm).filter(x=>x&&x.alive&&!r.allies.includes(x.id));n.sort((a,b)=>A.relBetween(r.id,a.id)-A.relBetween(r.id,b.id)),ctx.rid=n.length?n[0].id:null,ctx.ratio=n.length?(A.realmPower(r)/Math.max(1,A.realmPower(n[0]))).toFixed(1):"1"},
      text: 'At council, the marshal unrolls a map of the {other} border. "They are weak, and they insult us." Half the table nods. The other half looks at you. Our strength against theirs: about {ratio} to 1. Your voice may decide it.',
      choices: [
        {
          t: "Argue for war",
          check: {s:"persuasion",s2:"tactics",d:50},
          win: {
            r: "The crown declares war on {other}. Whatever comes now, it carries your name.",
            fx: (p,ctx)=>{const r=A.realm(p.realm);ctx.rid&&!A.hostile(r.id,ctx.rid)&&A.startWar(r.id,ctx.rid,null,A.claimsOn(r.id,ctx.rid).length?"reconquest":"conquest"),A.fame(p,2)},
          },
          lose: {r:"The crown hesitates. War is postponed — for now.",fx:{rulerOp:-2}},
        },
        {
          t: "Argue for peace and patience",
          check: {s:"diplomacy",s2:"persuasion",d:45},
          win: {
            r: "Envoys go instead of armies. The marshal glares at you across the table.",
            fx: {realmRel:10,rulerOp:3},
          },
          lose: {r:"They call you timid. The war party has the crown's ear.",fx:{rulerOp:-4}},
        },
        {
          t: "Say nothing and watch who speaks",
          r: "You learn a great deal about your colleagues and commit to nothing.",
          fx: {skill:{intrigue:2},secret:1},
        },
      ],
    },
    {
      id: "cn_budget",
      council: ["treasurer","chancellor","any"],
      title: "The treasury is empty",
      trigger: !0,
      cool: 4,
      cond: p=>{const r=A.realm(p.realm);return r&&r.treasury<r.income*.4},
      text: "The treasury chest echoes. The garrisons want pay, the bankers want interest, and the crown wants a new palace. At council, every eye turns to whoever might have an idea.",
      choices: [
        {
          t: "Propose a tax on the great lords",
          check: {s:"stewardship",s2:"persuasion",d:50},
          win: {
            r: "The lords pay, through their teeth. The treasury breathes.",
            fx: {realmGold:8e3,houseOp:-6,rulerOp:6},
          },
          lose: {r:"The lords refuse in a body. The crown blames you for the scene.",fx:{houseOp:-4,rulerOp:-6}},
        },
        {
          t: "Propose cutting the court's expenses",
          r: "Fewer feasts, fewer falcons. The crown sulks; the books balance.",
          fx: {realmGold:3e3,rulerOp:-3,realmStab:1},
        },
        {
          t: "Propose borrowing from the Ostran bankers",
          r: "Silver now, interest forever. The crown likes silver now.",
          fx: {realmGold:1e4,rulerOp:3},
        },
      ],
    },
    {
      id: "cn_rival_councillor",
      council: ["any"],
      title: "A colleague sharpens a knife",
      trigger: !0,
      cool: 4,
      setup: (p,ctx)=>{rival(p,ctx),nbRealm(p,ctx),ctx.rid||(ctx.skip=1)},
      text: "{them} wants your seat for a cousin. A story is going round that you favor {other} — that you have been paid.",
      choices: [
        {
          t: "Strike first: expose {them}'s own dealings",
          req: p=>(p.flags.secrets||0)>0,
          r: "You spend a secret. It is worth it: {them} leaves the council in disgrace.",
          fx: {secret:-1,rulerOp:5,them:{type:"enemy",op:-60}},
        },
        {
          t: "Go to the crown and swear your loyalty",
          check: {s:"persuasion",s2:"etiquette",d:50},
          win: {r:"The crown laughs and says it never believed a word.",fx:{rulerOp:6}},
          lose: {r:"The crown says it believes you. It does not look as if it does.",fx:{rulerOp:-8}},
        },
        {
          t: "Ride it out",
          r: "Stories die. This one takes a season and some of your standing with it.",
          fx: {rulerOp:-3},
        },
      ],
    },
    {
      id: "cn_foreign_bribe",
      council: ["any"],
      title: "A gift from abroad",
      trigger: !0,
      cool: 5,
      setup: nbRealm,
      text: 'A chest arrives at your house, unannounced: Ostran silver and a letter from the court of {other}, asking only that you "speak kindly of friendship between our crowns."',
      choices: [
        {
          t: "Return it publicly",
          r: "The whole court sees you send it back. Your honor shines; {other} is embarrassed.",
          fx: {honor:8,rulerOp:6,realmRel:-5},
        },
        {
          t: "Keep it, and speak kindly",
          r: "You keep it. You speak kindly. Relations warm, and your coffers with them.",
          fx: {coin:500,honor:-10,realmRel:10,secret:1},
        },
        {
          t: "Keep it, and tell the crown everything",
          check: {s:"intrigue",d:45},
          win: {
            r: "The crown lets you keep the silver as a reward and uses the letter as a lever on {other}.",
            fx: {coin:500,rulerOp:8},
          },
          lose: {r:"The crown wonders why you kept it at all.",fx:{coin:500,rulerOp:-10}},
        },
      ],
    },
    {
      id: "cn_famine",
      council: ["any"],
      title: "Famine in the provinces",
      trigger: !0,
      cool: 6,
      text: "The harvest failed in three provinces. Bread riots in the market towns. The council must choose: open the royal granaries, or keep them for the army.",
      choices: [
        {
          t: "Open the granaries",
          r: "The riots end. The army will be hungry if war comes this year.",
          fx: {realmStab:6,fame:2},
        },
        {
          t: "Keep them, and hang the rioters",
          r: "Order is restored. The provinces will remember.",
          fx: {realmStab:-4,rulerOp:2},
        },
        {
          t: "Buy grain abroad, whatever it costs",
          check: {s:"trade",s2:"diplomacy",d:45},
          win: {
            r: "Grain barges from the south, at a fair price you fought for. Riots end; granaries stay full.",
            fx: {realmStab:5,realmGold:-4e3,fame:3,rulerOp:5},
          },
          lose: {r:"The price is ruinous, and the grain arrives late.",fx:{realmStab:2,realmGold:-8e3}},
        },
      ],
    },
    {
      id: "cn_lord_rebellion",
      council: ["spymaster","marshal","any"],
      title: "A lord gathers men",
      trigger: !0,
      cool: 5,
      cond: p=>{const r=A.realm(p.realm);return r&&A.realmHouses(r.id).length>0},
      text: 'Reports say a great lord of the realm is gathering men at his castle "for hunting." Nobody hunts with siege engines.',
      choices: [
        {
          t: "Summon him to court to explain himself",
          check: {s:"diplomacy",s2:"intimidation",d:50},
          win: {
            r: "He comes, sweats, explains, and goes home with fewer men. The crown is pleased.",
            fx: {realmStab:4,rulerOp:5},
          },
          lose: {r:"He does not come. That is an answer.",fx:{realmStab:-5}},
        },
        {
          t: "Bribe his captains",
          req: p=>p.coin>=200,
          check: {s:"intrigue",d:45},
          win: {
            r: "His army melts away overnight. He is still a lord; he is no longer a threat.",
            fx: {coin:-200,realmStab:5,rulerOp:6},
          },
          lose: {r:"His captains take your money and stay.",fx:{coin:-200}},
        },
      ],
    },
  ]);
  A.defEvents([
    {
      id: "fl_adv_volunteer",
      flow: ["advance"],
      cond: p=>!!p.mil,
      title: "A dangerous errand",
      trigger: !0,
      text: "{bossTitle} {boss} needs a volunteer to carry orders through broken country to an outpost the enemy may already hold. Your hand goes up before your fear catches up.",
      choices: [
        {
          t: "Go alone, fast",
          check: {s:"riding",s2:"stealth",d:45},
          win: {
            r: "You ride three horses to death and arrive in time. The outpost holds. Your name goes up the chain.",
            fx: {merit:30,fame:2,bossOp:10},
          },
          lose: {r:"Ambushed. You get through, bleeding, and late.",fx:{merit:12,health:-18,cause:"an ambush"}},
        },
        {t:"Take two good men",r:"Slower, safer, done. Merit for you and for them.",fx:{merit:18,bossOp:5}},
      ],
    },
    {
      id: "fl_adv_court",
      flow: ["advance"],
      cond: p=>J(p,"scribe","courtier","envoy","steward","lawyer","spy"),
      title: "Someone discreet",
      trigger: !0,
      text: `Late in the evening the chancellor's secretary finds you still at your desk. "The chancellor needs someone discreet for a small matter. You are always here. Are you discreet?"`,
      choices: [
        {
          t: '"Very."',
          check: {s:"intrigue",s2:"etiquette",d:45},
          win: {
            r: "A letter delivered, a meeting arranged, nothing written down. The chancellor knows your face now.",
            fx: {merit:25,patronOp:10,secret:1,flag:"fl_chancellor_errand"},
          },
          lose: {r:"You are discreet, but slow. The chancellor finds someone faster next time.",fx:{merit:8}},
        },
        {
          t: '"I am honest, my lord. That is not the same."',
          r: 'The secretary laughs. "Honest is rarer." A different sort of door opens.',
          fx: {merit:12,honor:4},
        },
      ],
    },
    {
      id: "fl_adv_church",
      flow: ["advance"],
      cond: p=>J(p,"clergy"),
      title: "The cathedral pulpit",
      trigger: !0,
      text: "The bishop is ill. Someone must preach the Midsummer sermon in the cathedral, before the court. The dean looks around the chapter house, and his eyes stop on you.",
      choices: [
        {
          t: "Preach on justice",
          check: {s:"faith",s2:"persuasion",d:50},
          win: {
            r: "The court is silent at the end, then the crown nods. You are spoken of as a future bishop.",
            fx: {merit:30,fame:3,rulerOp:4},
          },
          lose: {r:"Too long, too dry. A great lord falls asleep.",fx:{merit:6}},
        },
        {
          t: "Preach on obedience",
          r: "Safe, elegant, flattering to the throne. The court likes you very much.",
          fx: {merit:20,rulerOp:6,honor:-2},
        },
      ],
    },
    {
      id: "fl_adv_guild",
      flow: ["advance"],
      cond: p=>!!p.job&&A.pathOfCareer(p.job.c)==="guild",
      title: "The wardens notice",
      trigger: !0,
      text: 'A warden of the guild stops at your bench. "You are always the last to leave. Good. We need someone to inspect the market weights this year. It is thankless, and everyone will hate you."',
      choices: [
        {
          t: "Accept",
          r: "Everyone hates you, and everyone respects you, and the wardens remember you at election time.",
          fx: {merit:25,rep:6},
        },
        // [X1 baked patch events/33-no-obvious-choices CHOICE-FL-ADV-GUILD] fl_adv_guild: declining ("Your evenings stay
        // your own") now keeps you happier.
        {t:"Decline politely",r:"Your evenings stay your own.",fx:{merit:5,happy:2}},
      ],
    },
    {
      id: "fl_adv_common",
      flow: ["advance"],
      cond: p=>!!p.job&&A.pathOfCareer(p.job.c)==="common",
      title: "The reeve's eye",
      trigger: !0,
      setup: (p,ctx)=>stranger(p,ctx,"the reeve"),
      text: "{themFull}, the reeve, watches you work for a week, then asks if you would oversee the lord's harvest gangs this year. More work, more pay, and every villager will blame you for everything.",
      choices: [
        {
          t: "Take it",
          r: "Foreman of the harvest. You learn how a manor really works — and who really runs it.",
          fx: {merit:30,rep:8,skill:{stewardship:3,command:2}},
        },
        {
          t: "Ask what it leads to",
          check: {s:"persuasion",d:35},
          win: {
            r: '"Bailiff, if you can read. Steward, if you can count. Who knows?" You start learning both.',
            fx: {merit:20,flag:"fl_reeve_road"},
          },
          lose: {r:'"Leads to sore feet." He walks off.',fx:{}},
        },
      ],
    },
    {
      id: "fl_adv_under",
      flow: ["advance"],
      cond: p=>J(p,"thief","pirate","bounty"),
      title: "The old man wants to see you",
      trigger: !0,
      text: "Word comes down: the old man who runs the river quarter wants to see you. People who are called to see him either rise or float.",
      choices: [
        {
          t: "Go",
          check: {s:"persuasion",s2:"wil",d:45},
          win: {r:"He offers you a street of your own. You accept. You are somebody now.",fx:{merit:30,rep:10}},
          lose: {r:"He decides you are not ready. You walk out alive, which is something.",fx:{merit:5}},
        },
        {
          t: "Send a gift instead",
          req: p=>p.coin>=50,
          r: "A gift is respectful and safe. He remembers the gift; he does not remember you.",
          fx: {coin:-50,merit:10},
        },
      ],
    },
    {
      id: "fl_wl_ship",
      flow: ["wealth"],
      title: "A share in a ship",
      trigger: !0,
      text: "A captain sells shares in his next voyage south: ten shares, fifty suns each. If the ship comes back, each share returns two hundred. If it does not, nothing.",
      choices: [
        {
          t: "Buy two shares",
          req: p=>p.coin>=100,
          check: {s:"trade",d:40},
          win: {r:"The ship comes home heavy with pepper. Four hundred suns.",fx:{coin:300,skill:{trade:2}}},
          lose: {r:"Lost with all hands off the Cape of Teeth.",fx:{coin:-100}},
        },
        {
          t: "Buy one",
          req: p=>p.coin>=50,
          check: {s:"trade",d:35},
          win: {r:"She comes back. Two hundred suns for fifty.",fx:{coin:150}},
          lose: {r:"She does not.",fx:{coin:-50}},
        },
        {
          t: "Keep your coin",
          r: "You keep it. Later you hear she came home rich. Or that she sank. Depending who tells it.",
          fx: {},
        },
      ],
    },
    {
      id: "fl_wl_grain",
      flow: ["wealth"],
      title: "Cheap grain, hungry spring",
      trigger: !0,
      text: "The harvest is huge and grain is dirt cheap. Every old farmer knows spring follows autumn and prices follow hunger.",
      choices: [
        {
          t: "Buy a barn's worth and sell in spring",
          req: p=>p.coin>=60,
          check: {s:"trade",s2:"husbandry",d:40},
          win: {
            r: "In April you sell at three times the price. Some call it smart; some call it greed.",
            fx: {coin:120,honor:-1},
          },
          lose: {r:"Rats. Half the barn.",fx:{coin:-30}},
        },
        {
          t: "Buy and give it out in spring at cost",
          req: p=>p.coin>=60,
          r: "You break even and the whole district loves you.",
          fx: {fame:3,honor:6},
        },
      ],
    },
    {
      id: "fl_wl_loan",
      flow: ["wealth"],
      cond: p=>A.classOf(p)<=5,
      title: "A knight short of silver",
      trigger: !0,
      setup: (p,ctx)=>stranger(p,ctx,"a knight short of silver",4),
      text: "{themFull} needs eighty suns for a new horse before the tourney season. He offers a hundred and twenty back at Michaelmas — on his honor.",
      choices: [
        {
          t: "Lend it",
          req: p=>p.coin>=80,
          check: {s:"trade",s2:"ins",d:40},
          win: {
            r: "He wins a purse at the tourney and pays you back with a flourish — and calls you his friend.",
            fx: {coin:40,them:{type:"friend",op:30}},
          },
          lose: {r:"He is killed in the lists. His heirs know nothing of any loan.",fx:{coin:-80}},
        },
        {t:"Refuse",r:"He rides off on his old horse.",fx:{}},
      ],
    },
    {
      id: "fl_rn_tourney",
      flow: ["renown"],
      cond: (p,C)=>C.adult(p)&&A.classOf(p)>=3,
      title: "An invitation to the lists",
      trigger: !0,
      text: "Your name has reached the heralds. A herald in a tabard brings an invitation: the great tourney at the capital, before the court.",
      choices: [
        {
          t: "Ride in the lists",
          check: {s:"lance",s2:"riding",d:55},
          win: {
            r: "You break three lances and unhorse a duke's son. The court cheers your name.",
            fx: {fame:6,coin:100,deed:"Won honor at the great tourney"},
          },
          lose: {r:"Unhorsed in the first course. The court laughs, kindly enough.",fx:{health:-10,fame:1}},
        },
        {
          t: "Fight in the mêlée",
          check: {s:"melee",s2:"str",d:50},
          win: {r:"Last on your feet in the mêlée. A lady throws you a ribbon.",fx:{fame:5,coin:60}},
          lose: {r:"A mace to the helm. You wake up in the physician's tent.",fx:{health:-15,cause:"the mêlée"}},
        },
        {
          t: "Go and watch, and meet people",
          r: "You meet a hundred people who matter, and one or two remember you.",
          fx: {fame:2,newRel:{type:"friend",op:25}},
        },
      ],
    },
    {
      id: "fl_rn_fire",
      flow: ["renown"],
      title: "Fire in the street",
      trigger: !0,
      text: "A house is burning in the next street, and a woman is screaming that her child is still inside.",
      choices: [
        {
          t: "Go in",
          check: {s:"athletics",s2:"wil",d:45},
          win: {
            r: "You come out black with smoke, the child coughing in your arms. The town will tell this story for years.",
            fx: {fame:6,honor:8,health:-8},
          },
          lose: {
            r: "You get the child out and leave half your hair and some skin behind.",
            fx: {fame:5,honor:8,health:-25,wound:"burn",cause:"a burning house"},
          },
        },
        {
          t: "Organize a bucket line",
          check: {s:"command",d:35},
          win: {
            r: "The fire is out before it spreads. The child is saved by a neighbor. Everyone saw who took charge.",
            fx: {fame:3,skill:{command:2}},
          },
          lose: {r:"Chaos. The house burns.",fx:{}},
        },
      ],
    },
    {
      id: "fl_rn_ballad",
      flow: ["renown"],
      cond: p=>p.fame>=25,
      title: "A song about you",
      trigger: !0,
      text: "A minstrel at the inn is singing a song about you. Some of it is true. Most of it is better than true.",
      choices: [
        {
          t: "Pay him to sing it everywhere",
          req: p=>p.coin>=20,
          r: "For twenty suns, the song goes on tour. You are more famous than you deserve.",
          fx: {coin:-20,fame:4},
        },
        {t:"Correct the details",r:"He takes your corrections and adds a dragon.",fx:{fame:2}},
      ],
    },
    {
      id: "fl_fa_calling",
      flow: ["faith"],
      cond: p=>!J(p,"clergy")&&!p.ruler&&!p.mil&&A.isAdult(p),
      title: "A calling",
      trigger: !0,
      text: 'After the vigil the old prior takes you aside. "You pray like someone who means it. The faith needs people like you. There is a place for you in the house, if you want it."',
      choices: [
        {
          t: "Take the novice's robe",
          r: "You leave your old life at the gate. A new ladder begins: novice, keeper, prior, bishop — and higher.",
          fx: p=>{A.leaveRolesFor(p,"job",!0),p.job={c:"clergy",r:0,y:0,perf:60,rep:30,merit:10,since:A.absDay()},p.flags.priest=!0,A.log("You enter the faith as a novice. The Faith path is open to you.","big")},
        },
        {
          t: "Serve the faith as a layman",
          r: "You stay in the world, but the temple has a friend in you.",
          fx: {piety:6,flag:"fl_lay_friend"},
        },
      ],
    },
    {
      id: "fl_fa_vision",
      flow: ["faith"],
      title: "Something in the dark",
      trigger: !0,
      text: "On the third night of your fast, something happens in the dark of the chapel. You will never be able to say exactly what. You are sure it happened.",
      choices: [
        {
          t: "Tell the priests",
          check: {s:"faith",d:45},
          win: {r:"They believe you. Pilgrims come to touch your sleeve.",fx:{piety:10,fame:4,wil:1}},
          lose: {r:"They think you mad. You know you are not.",fx:{piety:6,wil:1}},
        },
        {
          t: "Keep it to yourself",
          r: "You keep it. It keeps you, too, through bad years.",
          fx: {piety:8,wil:1.5,happy:6},
        },
      ],
    },
    {
      id: "fl_fm_child_gift",
      flow: ["family"],
      cond: p=>p.children.some(c=>A.P(c)&&A.P(c).alive&&A.age(A.P(c))<16),
      title: "Your child's gift",
      trigger: !0,
      setup: (p,ctx)=>{const c=A.pick(p.children.map(A.P).filter(c2=>c2&&c2.alive&&A.age(c2)<16));ctx.pid=c.id},
      text: "You spend a season with {them}, and see what you had not seen: a gift. A quickness with {theirHis} hands, or numbers, or words.",
      choices: [
        {
          t: "Find {them} the best teacher you can afford",
          req: p=>p.coin>=40,
          r: "An expensive tutor, and {them} blossoms.",
          fx: (p,ctx)=>{p.coin-=40;const c=A.P(ctx.pid);if(c){const k=A.pick(["learning","craft","music","sword","bow","trade"]);A.trainSkill(c,k,10),c.apt=c.apt||{},c.apt[k]=Math.max(c.apt[k]||1,1.4),A.addOp(p,c,15)}},
        },
        {
          t: "Teach {them} yourself",
          r: "Slower, but the time together binds you for life.",
          fx: (p,ctx)=>{const c=A.P(ctx.pid);c&&A.addOp(p,c,25),p.happy=Math.min(100,p.happy+6)},
        },
      ],
    },
    {
      id: "fl_fm_marriage_alliance",
      flow: ["family"],
      cond: p=>A.classOf(p)>=4&&p.children.some(c=>A.P(c)&&A.P(c).alive&&!A.P(c).spouse&&A.age(A.P(c))>=14),
      title: "A match for your child",
      trigger: !0,
      setup: (p,ctx)=>{const c=A.pick(p.children.map(A.P).filter(c2=>c2&&c2.alive&&!c2.spouse&&A.age(c2)>=14));ctx.pid=c.id},
      text: "A family above your own proposes a match for {them}. It would lift your house. {them} has, it seems, other ideas.",
      choices: [
        {
          t: "Arrange the match",
          r: "The match is made. Your house rises; {them} is cool to you for a long time.",
          fx: (p,ctx)=>{const c=A.P(ctx.pid);c&&A.addOp(p,c,-20),A.fame(p,3)},
        },
        {
          t: "Let {them} choose",
          r: "{them} chooses love. Your house does not rise, but your child loves you.",
          fx: (p,ctx)=>{const c=A.P(ctx.pid);c&&A.addOp(p,c,25)},
        },
      ],
    },
    {
      id: "fl_sc_plot",
      flow: ["scheme"],
      cond: p=>!p.ruler&&A.classOf(p)>=3,
      title: "A plot against the crown",
      trigger: !0,
      text: "You have been listening in the right places, and you have heard it: a ring of lords means to remove {ruler} before the year is out. They are looking for one more friend.",
      choices: [
        {
          t: "Report the plot to the crown",
          check: {s:"persuasion",s2:"intrigue",d:45},
          win: {
            r: "Arrests in the night. The crown remembers who saved it. A title, perhaps, will follow.",
            fx: {rulerOp:25,fame:5,merit:20,deed:"Uncovered a plot against the crown"},
          },
          lose: {
            r: "The plotters hear you have talked. You are looking over your shoulder now.",
            fx: {newRel:{type:"enemy",op:-60}},
          },
        },
        {
          t: "Join them",
          r: "You are in. If they win, you rise. If they lose, you hang.",
          fx: {flag:"fl_conspirator",secret:1},
        },
        {
          t: "Sell the names to the highest bidder",
          check: {s:"intrigue",s2:"deception",d:55},
          win: {
            r: "The plotters pay to keep their names quiet; the crown pays for half the names. You get rich on both.",
            fx: {coin:500,honor:-10},
          },
          lose: {r:"Both sides find out.",fx:{newRel:{type:"enemy",op:-60},rulerOp:-20}},
        },
      ],
    },
    {
      id: "fl_sc_blackmail",
      flow: ["scheme"],
      cond: p=>(p.flags.secrets||0)>0,
      title: "What you know",
      trigger: !0,
      setup: (p,ctx)=>stranger(p,ctx,"a lord with a past",5),
      text: "You know something about {themFull} — something that would ruin {themHim} at court. {theyHe} knows you know.",
      choices: [
        {
          t: "Ask for a favor in exchange for silence",
          r: "{them} owes you now, and hates you for it.",
          fx: {secret:-1,owed:3,them:{type:"rival",op:-20}},
        },
        {
          t: "Ask for gold",
          r: "A heavy purse, and an enemy for life.",
          fx: {secret:-1,coin:300,them:{type:"enemy",op:-50}},
        },
        {
          t: "Burn it. You are not that kind of person.",
          r: "You tell {them} it is gone. {theyHe} does not believe you, but {theyHe} is grateful.",
          fx: {secret:-1,honor:6,them:{op:20}},
        },
      ],
    },
    {
      id: "fl_sc_rival_fall",
      flow: ["scheme"],
      cond: p=>A.relsOf(p,["rival","enemy"]).some(x=>x.p.alive),
      title: "Your rival stumbles",
      trigger: !0,
      setup: (p,ctx)=>{const x=A.relsOf(p,["rival","enemy"]).find(y=>y.p.alive);ctx.pid=x.p.id},
      text: "{them} has made a mistake — debts, a lover, a lie to {theirHis} superiors. You could make sure everyone hears of it.",
      choices: [
        {
          t: "Make sure everyone hears",
          check: {s:"intrigue",d:45},
          win: {r:"{them} is ruined. You feel lighter. Mostly.",fx:{merit:15,honor:-4,them:{type:"enemy",op:-30}}},
          lose: {r:"Your hand in it shows. {them} recovers; you look petty.",fx:{rep:-5}},
        },
        {
          t: "Offer {them} help, and make a friend of an enemy",
          check: {s:"persuasion",d:50},
          win: {
            r: "Astonished, {them} accepts. Your old rival is now someone who owes you everything.",
            fx: {them:{type:"friend",op:50},owed:2,honor:4},
          },
          lose: {r:"{theyHe} suspects a trap and refuses.",fx:{}},
        },
      ],
    },
    {
      id: "fl_fr_escape",
      flow: ["freedom"],
      cond: p=>!!p.flags.unfree,
      title: "The night of the fair",
      trigger: !0,
      text: "The night of the fair, your master is drunk and the gate guard is your friend's cousin. The river road runs north to a free town where no one asks questions. A year and a day there and you are free by law.",
      choices: [
        {
          t: "Run tonight",
          check: {s:"stealth",s2:"survival",d:40,bonus:p=>p.flags.escapeReady?15:0},
          win: {
            r: "Over the wall, down the river road, into the free town by dawn of the fourth day. A year and a day later you are free.",
            fx: p=>{delete p.flags.unfree,(p.status==="slave"||p.status==="serf")&&(p.status="peasant"),p.job=null,A.ach("freed"),A.log("You are free.","big")},
          },
          lose: {r:"Dogs. You are dragged back and flogged.",fx:{health:-20,happy:-15,cause:"a flogging"}},
        },
        {t:"Not yet",r:"Not yet. You keep the plan, and the coin.",fx:{}},
      ],
    },
    {
      id: "fl_fr_buy",
      flow: ["freedom"],
      cond: p=>!!p.flags.unfree&&p.coin>=40,
      title: "A price for your freedom",
      trigger: !0,
      text: "Your master is short of money after a bad harvest, and in a mood to bargain. Freedom has a price this year, and it is almost within your reach.",
      choices: [
        {
          t: "Pay everything you have",
          r: "Every coin you saved. A paper with a seal. You are free.",
          fx: p=>{p.coin=0,delete p.flags.unfree,(p.status==="slave"||p.status==="serf")&&(p.status="peasant"),A.ach("freed"),A.log("You buy your freedom.","big")},
        },
        {
          t: "Haggle",
          check: {s:"persuasion",s2:"trade",d:45},
          win: {
            r: "You talk him down by a third. Free, and with coin left over.",
            fx: p=>{p.coin=Math.round(p.coin/3),delete p.flags.unfree,(p.status==="slave"||p.status==="serf")&&(p.status="peasant"),A.ach("freed")},
          },
          // [X1 baked patch events/33-no-obvious-choices CHOICE-FL-FR-BUY] fl_fr_buy: both choices bought your freedom, so
          // the event decided for you whenever it came. A third choice keeps the coin for now, and the event comes back
          // another year.
          lose: {r:"He is offended and withdraws the offer.",fx:{happy:-6}},
        },
        {
          t: "Not this year",
          r: "You keep your coin, and your chain. There will be another bad harvest.",
          fx: {wil:.5},
        },
      ],
    },
    {
      id: "fl_st_exam",
      flow: ["study"],
      cond: p=>p.literate&&!p.flags.dip_letters&&A.age(p)>=14,
      title: "The examination",
      trigger: !0,
      // [X1 baked patch events/99999-v2-content V2C-NO-LATIN] fl_st_exam named Latin, which Ardan does not have. Its
      // learned tongue is Old Solen (GD.LANG_LIST).
      text: "The College examines scholars twice a year: Old Solen, law, rhetoric and numbers, before six masters who have failed better people than you. A diploma opens every door in the chancery.",
      choices: [
        {
          t: "Sit the examination",
          check: {s:"learning",s2:"int",d:50},
          win: {
            r: "You pass. A diploma with a red seal. The chancery, the courts and the colleges will take you at a better rank now.",
            fx: {flag:"dip_letters",fame:2,skill:{learning:3}},
          },
          lose: {r:"You fail on rhetoric. Next year.",fx:{skill:{learning:2}}},
        },
        {t:"Not ready yet",r:"Another year of study.",fx:{skill:{learning:1}}},
      ],
    },
    {
      id: "fl_st_master",
      flow: ["study"],
      title: "An old scholar",
      trigger: !0,
      setup: (p,ctx)=>stranger(p,ctx,"an old scholar"),
      text: "{themFull}, an old scholar with a famous name and no money, offers to teach you for the price of his rent.",
      choices: [
        {
          t: "Pay his rent",
          req: p=>p.coin>=30,
          r: "Two years of evenings with a mind like a lamp. You will never think the same way again.",
          fx: {coin:-30,skill:{learning:6,tactics:2,diplomacy:2},int:1,them:{type:"mentor",op:40}},
        },
        // [X1 baked patch events/99999-v2-content V2C-SCHOLAR-WORK] fl_st_master ("An old scholar") left a student with
        // under 30 suns one live choice, "You cannot afford it", with the real one out of reach (playtest 1, #19). A poor
        // student may now work off part of the rent: less learning than paying, and it costs his evenings and some health.
        {
          t: "Offer to work off his rent instead",
          req: p=>p.coin<30,
          r: "You carry his water, sweep his stair and copy his letters, and in the gaps he teaches you. It is half a schooling, paid for in sleep.",
          fx: {skill:{learning:3},int:1,health:-3,need:{rest:-12},them:{type:"mentor",op:20}},
        },
        {t:"You cannot afford it",r:"He shrugs and goes back to his books.",fx:{}},
      ],
    },
    {
      id: "fl_gv_governor",
      flow: ["govern"],
      cond: (p,C)=>C.ruler(p),
      title: "A corrupt governor",
      trigger: !0,
      text: "Your progress through the provinces finds what the reports never said: a governor who has built himself a palace out of your taxes.",
      choices: [
        {
          t: "Hang him at his own gate",
          r: "The provinces see what the crown does to thieves. The other governors count their coins very carefully.",
          fx: {stability:4,treasury:3e3,houseOp:-3},
        },
        {
          t: "Make him pay it all back, and keep him",
          r: "He pays. He is grateful. He will steal more carefully now.",
          fx: {treasury:5e3},
        },
        {
          t: "Replace him with an honest clerk",
          check: {s:"stewardship",d:45},
          win: {r:"The new man is honest and able. The province flourishes.",fx:{stability:5,treasury:1500}},
          lose: {r:"The honest man is useless. Taxes fall.",fx:{treasury:-1e3}},
        },
      ],
    },
    {
      id: "fl_gv_town",
      flow: ["govern"],
      cond: (p,C)=>C.ruler(p),
      title: "A charter for a new town",
      trigger: !0,
      text: "Merchants beg a charter: a new market town at the crossing of two roads. It will cost the crown the land and bring the crown taxes for a century.",
      choices: [
        {
          t: "Grant the charter",
          r: "A town rises in ten years where there was a ford. The realm grows richer.",
          fx: p=>{const r=A.realm(p.ruler);if(r){r.baseIncome=Math.round(r.baseIncome*1.02);const pr=A.pick(A.realmProvs(r.id));pr&&(pr.dev=Math.min(10,(pr.dev||1)+1),pr.civ=(pr.civ||0)+1),A.updateRealmPops()}},
        },
        {t:"Refuse",r:"The land stays fields.",fx:{}},
      ],
    },
    {
      id: "fl_sx_marriage",
      flow: ["statecraft"],
      cond: (p,C)=>C.ruler(p),
      title: "A marriage proposal from abroad",
      trigger: !0,
      setup: (p,ctx)=>{const r=A.realm(p.ruler),n=A.neighbors(r.id).map(A.realm).filter(x=>x&&x.alive&&!A.hostile(r.id,x.id));ctx.rid=n.length?A.pick(n).id:null},
      text: "The court of {other} proposes a royal marriage between your houses — and with it, an alliance.",
      choices: [
        {
          t: "Accept the marriage and the alliance",
          r: "The marriage feast is the talk of two realms. You are allies now.",
          fx: (p,ctx)=>{const r=A.realm(p.ruler);ctx.rid&&(A.ally(r.id,ctx.rid),A.addRel(r.id,ctx.rid,25),r.marriages=r.marriages||{},r.marriages[ctx.rid]=A.S.year,A.callGathering&&A.callGathering(ctx.rid,"wedding",null,r.id))},
        },
        {
          t: "Accept the marriage, decline the alliance",
          r: "Kin, but not bound to their wars.",
          fx: (p,ctx)=>{const r=A.realm(p.ruler);ctx.rid&&(A.addRel(r.id,ctx.rid,20),r.marriages=r.marriages||{},r.marriages[ctx.rid]=A.S.year)},
        },
        {t:"Decline",r:"A cool letter goes back.",fx:{realmRel:-8}},
      ],
    },
    {
      id: "fl_sx_summit",
      flow: ["statecraft"],
      title: "A summit of crowns",
      trigger: !0,
      cond: p=>!!(p.ruler||p.office==="chancellor"),
      text: "Your letters have done their work: three courts would meet with yours, if you host. A summit costs a fortune in feasts and lodging, and can change the map.",
      choices: [
        {
          t: "Host the summit",
          r: "Invitations go out under your seal.",
          fx: p=>{const rid=p.ruler||p.realm;A.callGathering&&A.callGathering(rid,"summit",p.id)},
        },
        {t:"Not this year",r:"The letters will keep.",fx:{}},
      ],
    },
    {
      id: "fl_wp_strike_first",
      flow: ["warplan"],
      cond: p=>{const r=A.realm(p.ruler||p.mil&&p.mil.realm||p.realm);return r&&!A.atWar(r.id).length},
      title: "They are mobilizing",
      trigger: !0,
      setup: (p,ctx)=>{const r=A.realm(p.ruler||p.mil&&p.mil.realm||p.realm),n=A.neighbors(r.id).map(A.realm).filter(x=>x&&x.alive&&!r.allies.includes(x.id));n.sort((a,b)=>A.relBetween(r.id,a.id)-A.relBetween(r.id,b.id)),ctx.rid=n.length?n[0].id:null},
      text: "Your spies on the border report columns on the roads of {other}, wagons of arrows, smiths working through the night. They will strike before the harvest. Unless you strike first.",
      choices: [
        {
          t: "Strike first",
          req: p=>!!p.ruler,
          r: "Your armies cross the border before theirs are ready.",
          fx: (p,ctx)=>{const r=A.realm(p.ruler);if(ctx.rid&&!A.hostile(r.id,ctx.rid)&&A.declareWar(r.id,ctx.rid).w){const t=A.realm(ctx.rid);if(t&&t.forces)for(const d of t.forces.divs)d.org=Math.min(d.org,A.divMaxOrg(d)*.5)}},
        },
        {
          t: "Fortify the border and wait",
          r: "Your divisions dig in on the border. If they come, they will pay.",
          fx: p=>{const r=A.realm(p.ruler||p.mil&&p.mil.realm||p.realm);if(r&&r.forces)for(const d of r.forces.divs)d.dig=Math.max(d.dig||0,4)},
        },
        {
          t: "Send an envoy to ask what they want",
          r: "An envoy goes. Perhaps it was only exercises.",
          fx: {realmRel:6},
        },
      ],
    },
    {
      id: "fl_wp_veteran",
      flow: ["warplan"],
      title: "An old soldier's trick",
      trigger: !0,
      text: "An old sergeant asks to see you. In thirty years of war he has learned a way of moving spearmen at night that no manual describes. He would like to teach it, for a pension.",
      choices: [
        {
          t: "Grant the pension and spread the trick",
          r: "The host learns to march and fight in the dark.",
          fx: {armyXp:20,coin:-20,skill:{tactics:2}},
        },
        {t:"Send him away",r:"Old men and their stories.",fx:{}},
      ],
    },
  ]);
})();
