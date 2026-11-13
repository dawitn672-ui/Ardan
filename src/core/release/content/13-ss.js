// The release's event pack 13 of 30 (184 events, mostly ss_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-027). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const free = p=>!["slave","serf"].includes(p.status)&&!p.flags.unfree,
      bond = p=>!free(p),
      SEX = (p,m,f)=>p.sex==="F"?f:m,
      early = ()=>!!(A.S&&A.S.year<=1108),
      capOf = p=>{const r=A.realm(p.realm);return r&&r.capital?r.capital:"the capital"},
      home = p=>A.provName(p.home),
      kid = (p,C,lo,hi)=>C.child(p)&&C.ageAdj(p)>=(lo||6)&&C.ageAdj(p)<(hi||13),
      grown = (p,C)=>C.adult(p)||C.teen(p),
      prime = (p,C)=>C.adult(p)&&!C.old(p),
      CULT = {
        "POL-12": "CUL-03",
        "POL-17": "CUL-04",
        "POL-18": "CUL-06",
        "POL-19": "CUL-05",
        "POL-20": "CUL-08",
        "POL-21": "CUL-10",
        "POL-22": "CUL-09",
        "POL-24": "CUL-07",
        "POL-27": "CUL-12",
        "POL-30": "CUL-13",
        "POL-33": "CUL-15",
      },
      loc = (p,sex)=>{try{return A.givenName(CULT[p.realm]||p.cult,sex||A.pick(["M","F"]))}catch{return sex==="F"?"Ama":"Tano"}},
      C_OLDER = p=>A.age(p)-(A.S.year-1088)>=8,
      C_RICH = p=>["artisan","merchant","gentry","noble","royal"].includes(p.status),
      divorce = p=>{const s=p.spouse?A.P(p.spouse):null;s&&(p.spouse=null,s.spouse=null,p.rel[s.id]&&(p.rel[s.id].type="ex"),s.rel[p.id]&&(s.rel[p.id].type="ex"),A.addOp(p,s,-40),p.exSpouses&&p.exSpouses.push(s.id))},
      setFree = (p,how)=>(delete p.flags.unfree,(p.status==="slave"||p.status==="serf")&&(p.status="peasant"),how&&(p.flags[how]=A.S.year),A.ach("freed"),A.willGrow(p,2.5,"freedom"),p.happy=A.clamp(p.happy+20,0,100),"(You are free.)");
    A.defEvents([
      {
        id: "ss_nw_blood",
        title: "Blood from the saddle",
        cond: (p,C)=>C.realm(p,"POL-12")&&grown(p,C)&&!C.old(p),
        w: 1,
        cool: 7,
        text: ()=>`Three days out from the last yam, the well at ${A.pick(["Sartobe","the dry wadi","the old salt fort"])} is choked with sand. Your water skin is empty and your lips are splitting. Your horse is strong. The old riders do it on every long ride: open a vein in the horse's neck, drink, and close it again with a pinch of hair and spit.`,
        choices: [
          {
            t: "Open the vein, the way your grandfather showed you",
            check: {s:"husbandry",s2:"ins",d:38},
            win: {
              r: "Warm, salt, and enough. You press the vein shut and the mare does not even stamp. You reach water on the fourth day, both of you alive.",
              fx: {skill:{husbandry:3,survival:2},wil:1,sta:.4},
            },
            lose: {
              r: "You cut too deep. The mare bleeds a long time before it stops, and she carries you slowly after that. You both live, barely.",
              fx: {health:-10,wil:1.5,skill:{husbandry:1},cause:"thirst on the steppe"},
            },
          },
          {
            t: "Ride on through the night, dry",
            check: {s:"sta",s2:"riding",d:44},
            win: {
              r: "By dawn you smell water and the horse finds it before you do. The steppe tests and lets you pass.",
              fx: {sta:.6,wil:1.5,skill:{riding:2}},
            },
            lose: {
              r: "You fall out of the saddle in the dark. A Dust Wind herder finds you at noon and pours milk into your mouth.",
              fx: {health:-18,wil:2,cause:"thirst on the steppe"},
            },
          },
          {
            t: "Dig in the choked well with your hands",
            check: {s:"survival",s2:"str",d:40},
            win: {
              r: "Two arm-lengths down the sand turns dark, then wet. You drink muddy water and laugh at the sky.",
              fx: {skill:{survival:3},str:.3},
            },
            lose: {
              r: "Only dry sand, all the way down. You ride on with torn nails and a worse thirst.",
              fx: {health:-8,wil:1,cause:"thirst on the steppe"},
            },
          },
        ],
      },
      {
        id: "ss_nw_horsefeast",
        title: "The Horse Feast",
        cond: (p,C)=>C.realm(p,"POL-12")&&grown(p,C)&&!C.old(p)&&free(p),
        w: 1.2,
        cool: 4,
        text: p=>`21 June, the Horse Feast. On the grass ${p.home&&home(p)?"outside "+home(p):"by the camp"} the tribes race, wrestle and shoot, and whole herds go into the cooking pits. The shaman has tied fresh blue cloth on the cairn. Everyone who can ride is expected to try something.`,
        choices: [
          {
            t: "Ride the long race across the open steppe",
            check: {s:"riding",s2:"sta",d:44},
            win: {
              r: "Thirty kilometers, and you come in third, horse lathered white. The chief gives you a silver bridle ring.",
              fx: {skill:{riding:3},fame:2,coin:10,happy:4},
            },
            lose: {
              r: "Your horse goes lame halfway. You walk it home in the dusk, leading it gently.",
              fx: {skill:{riding:1},wil:.6},
            },
          },
          {
            t: "Wrestle in the ring",
            check: {s:"unarmed",s2:"str",d:42},
            win: {
              r: "You throw a Grey Wind herder twice your weight. The crowd chants your name and your tribe.",
              fx: {skill:{unarmed:3},str:.4,fame:2},
            },
            lose: {
              r: "He folds you up like a felt blanket. Your ribs ache for a week. Nobody remembers losers at the Horse Feast.",
              fx: {health:-6,skill:{unarmed:1},cause:"a wrestling throw"},
            },
          },
          {
            t: "Shoot at the hanging targets from the gallop",
            check: {s:"mounted",s2:"bow",d:46},
            win: {
              r: "Three passes, three hits, one of them the backward shot. Old riders spit and nod, which is high praise.",
              fx: {skill:{mounted:3,bow:2},fame:3},
            },
            lose: {
              r: "Two misses and a lost arrow in the grass. Children run to find it and keep it.",
              fx: {skill:{mounted:1,bow:1}},
            },
          },
          {
            t: "Eat, drink kumis and listen to the long songs",
            r: "Mutton fat, sour mare's milk, horse-head fiddles until dawn. The sky is blue and the horse is fat.",
            fx: {happy:5,skill:{music:1}},
          },
        ],
      },
      {
        id: "ss_nw_firstshot",
        title: "The first marmot",
        cond: (p,C)=>C.realm(p,"POL-12")&&kid(p,C,7,13),
        w: 1.3,
        once: !0,
        text: p=>`You rode before you walked well. Now ${SEX(p,"your uncle","your aunt")} gives you a little horn bow and points at a marmot standing by its hole. "From the saddle," ${SEX(p,"he","she")} says. "Every rider of the Nine Winds shoots from the saddle by ten. You are late."`,
        choices: [
          {
            t: "Kick the pony to a trot and shoot",
            check: {s:"riding",s2:"spd",d:22},
            win: {
              r: "The arrow takes the marmot through the body. You hold it up by the tail and the whole camp cheers.",
              fx: {skill:{mounted:3,bow:2},happy:5,fame:1},
            },
            lose: {
              r: "The pony shies, you shoot the sky, and you land on your backside. Everybody laughs, you most of all, later.",
              fx: {skill:{riding:2},wil:.5},
            },
          },
          {
            t: "Get down and stalk it on foot",
            check: {s:"stealth",s2:"ins",d:20},
            win: {
              r: "You crawl close and shoot. A clean kill, but your uncle says a rider who gets down is a rider who walks home.",
              fx: {skill:{stealth:2,bow:2}},
            },
            lose: {r:"It whistles and vanishes. So does your dignity.",fx:{skill:{stealth:1}}},
          },
          {
            t: "Ask to learn the backward shot first",
            r: "The adults roar with laughter, but that evening your uncle shows you how a rider twists in the saddle. You practice on the dog.",
            fx: {skill:{mounted:2},trait:"ambitious"},
          },
        ],
      },
      {
        id: "ss_nw_threshold",
        title: "The threshold",
        cond: (p,C)=>C.realm(p,"POL-12")&&C.ageAdj(p)>=9&&free(p),
        w: .9,
        cool: 10,
        text: ()=>`A Sunland cloth trader ducks into your tent to sell a bolt of ${A.pick(["red wool","Varennan blue","striped cotton"])}, and plants his boot square on the threshold. Your grandmother goes white. Stepping on the threshold of a Wind Rider's tent is a terrible insult, and bad luck for the whole family.`,
        choices: [
          {
            t: "Throw him out by the collar",
            check: {s:"str",s2:"intimidation",d:36},
            win: {
              r: "He lands in the dust and his bolts of cloth roll after him. Your grandmother nods. The luck is defended.",
              fx: {honor:2,str:.3,rel:{who:"grandmother",op:6}},
            },
            lose: {
              r: "He is heavier than he looks and swings back. You both end up bloody in the doorway, which is worse luck still.",
              fx: {health:-6,honor:1,cause:"a doorway brawl"},
            },
          },
          {
            t: "Explain the custom and make him buy his luck back",
            check: {s:"persuasion",s2:"trade",d:38},
            win: {
              r: "Pale and sorry, he gives a bolt of cloth for the shaman to tie on the cairn and sells you the rest cheap.",
              fx: {coin:6,skill:{trade:2,persuasion:1}},
            },
            lose: {
              r: "He thinks it is a trick to cheat him and leaves in a huff, stepping on the threshold again on the way out.",
              fx: {happy:-3},
            },
          },
          {
            t: "Pour milk for the sky and forget it",
            r: "You pour a cup of mare's milk on the grass and say the words. Foreigners cannot help being foreigners.",
            fx: {piety:2,trait:"calm"},
          },
        ],
      },
      {
        id: "ss_nw_seeps",
        title: "A question about the seeps",
        cond: (p,C)=>C.realm(p,"POL-12")&&C.adult(p),
        w: .9,
        cool: 9,
        text: ()=>`At the channel fair a smiling man with a Greyhaven accent buys you a cup of tea and lays ${A.pick(["80","100","120"])} suns of silver on the felt. "The fire-oil," he says softly. "Just the direction from Kyzai. North? East?" Anyone who tells an outsider where the seeps lie is put to death, and his family is sent out of the tribe.`,
        choices: [
          {
            t: "Push the silver back and leave",
            r: "You leave the tea half drunk. Some silver is heavier than it looks.",
            fx: {honor:3,wil:.6},
          },
          {
            t: "Sell him a confident lie",
            check: {s:"deception",s2:"int",d:46},
            win: {
              r: "You describe a salt flat two hundred kilometers from anywhere useful. He pays, thanks you warmly, and rides off to die of thirst, or learn.",
              fx: {coin:80,skill:{deception:3},honor:-2},
            },
            lose: {
              r: "He checks your story with someone else the same day. A Greyhaven man with a grudge now knows your face.",
              fx: {newRel:{type:"enemy",op:-30},coin:20},
            },
          },
          {
            t: "Take his silver, then tell the Keepers of the Seeps",
            check: {s:"intrigue",s2:"ins",d:42},
            win: {
              r: "The Keepers take him at dusk. He is never seen again, and the khan's men remember who pointed.",
              fx: {coin:40,favor:6,honor:-1,skill:{intrigue:2}},
            },
            lose: {
              r: "The Keepers wonder why you took the silver first. You spend a long, bad night answering their questions.",
              fx: {health:-10,favor:-3,wil:1.5,cause:"questioning by the Keepers of the Seeps"},
            },
          },
        ],
      },
      {
        id: "ss_nw_horsethief",
        title: "Nine for one",
        cond: (p,C)=>C.realm(p,"POL-12")&&grown(p,C)&&!C.old(p),
        w: 1,
        cool: 6,
        text: ()=>`Before dawn you catch a rider of the ${A.pick(["Black Wind","Red Wind","Salt Wind"])} cutting a mare out of your family's herd. He is young, his own horse is thin, and he has already been seen. Under the Saddle Law a horse thief pays nine horses for one, or loses a hand.`,
        choices: [
          {
            t: "Rope him and drag him to your chief",
            check: {s:"riding",s2:"str",d:40},
            win: {
              r: "Your lasso drops over his shoulders at the gallop. His family pays nine horses rather than see his hand cut off. Your herd is richer by eight.",
              fx: {coin:60,skill:{riding:2},fame:1,newRel:{type:"enemy",op:-20}},
            },
            lose: {r:"He slips the rope and is gone over the rise, with the mare.",fx:{coin:-40,wil:1}},
          },
          {
            t: "Shoot his horse from under him",
            req: (p,C)=>C.prof(p,"mounted",35)||C.prof(p,"bow",40),
            check: {s:"mounted",s2:"bow",d:44},
            win: {
              r: "One arrow at full gallop. He tumbles into the grass and you have him and the mare. The camp tells it for a month.",
              fx: {skill:{mounted:3},fame:2,coin:40},
            },
            lose: {r:"You miss twice in the dawn light. He rides off laughing.",fx:{coin:-40,skill:{mounted:1}}},
          },
          {
            t: "Let him go with a warning and the thin horse",
            r: "He stares at you, then rides away on his own nag. A month later a good colt turns up in your herd with no brand on it.",
            fx: {honor:2,coin:15,trait:"forgiving"},
          },
        ],
      },
      {
        id: "ss_nw_youngest",
        title: "The hearth goes to the youngest",
        cond: (p,C)=>C.realm(p,"POL-12")&&C.adult(p)&&C.ageAdj(p)<24&&free(p)&&C.male(p),
        w: 1,
        once: !0,
        text: "Among the Wind Riders the youngest son keeps the family hearth and tent; the older sons take a share of the herd and go. Your father has counted the herd out on the grass. Your share is twelve horses and forty sheep, and the summer grass is wide.",
        choices: [
          {
            t: "Take your herd to the channel fairs and sell well",
            check: {s:"trade",s2:"husbandry",d:40},
            win: {
              r: "A Greyhaven buyer pays before the ship sails, as they always do. The khan takes his tenth. The rest is yours, and it is a lot.",
              fx: {coin:180,skill:{trade:3}},
            },
            lose: {
              r: "The price falls the week you arrive. You sell anyway and ride home poorer and wiser.",
              fx: {coin:80,wil:.8,skill:{trade:1}},
            },
          },
          {
            t: "Ride to Kharsa and ask for a place among the yam riders",
            check: {s:"riding",s2:"sta",d:46},
            win: {
              r: "The Yam Keepers test you on a stage of 150 kilometers. You make it before dark and they give you the token.",
              fx: {coin:20,skill:{riding:4},sta:.6,flag:"ss_nw_yam",fame:1},
            },
            lose: {
              r: 'You arrive after dark, half dead. "Come back next year," says the Yam Keeper.',
              fx: {skill:{riding:2},wil:1},
            },
          },
          {
            t: "Graze your herd beside your brother's, as one family",
            r: "You stay close to the hearth fire. Your brother is glad of you. The herd grows slowly.",
            fx: {skill:{husbandry:3},coin:30,honor:1,rel:{who:"brother",op:10}},
          },
        ],
      },
      {
        id: "ss_nw_bride",
        title: "Horses for a bride",
        cond: (p,C)=>C.realm(p,"POL-12")&&C.adult(p)&&!C.married(p)&&!C.old(p)&&free(p),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{ctx.n=loc(p,p.sex==="F"?"M":"F"),ctx.w=A.pick(["Morning Wind","Grey Wind","Reed Wind","Sea Wind"])},
        text: p=>`At the summer camp you keep meeting {n} of the {w} at the well. Marriages bind tribes here, and a bride-price is paid in horses. ${SEX(p,`{n}'s father has said "three good horses" loudly enough for you to hear`,"Your mother says {n}'s family will come with horses if you smile at them once more")}.`,
        choices: [
          {
            t: "Pay the horses (about 120 suns)",
            req: p=>p.coin>=120,
            r: "The horses change hands, the shamans tie the cords, and the two tribes feast for three days. You are not lonely in your tent anymore.",
            fx: {coin:-120,lover:!0,happy:6},
          },
          {
            t: "Win the family over with a horse race",
            check: {s:"riding",s2:"spd",d:45},
            win: {
              r: "You beat {n}'s brother by a neck. The family laughs and halves the price. Love and a cheap bargain.",
              fx: {lover:!0,coin:-40,fame:1,skill:{riding:2}},
            },
            lose: {
              r: "The brother wins by three lengths and tells everyone. {n} still smiles at you, but the price goes up.",
              fx: {happy:-3,skill:{riding:1}},
            },
          },
          {
            t: "Sing a long song outside the tent at night",
            check: {s:"music",s2:"wil",d:40},
            win: {
              r: "Throat singing under the stars. {n} comes out to listen and does not go back in until dawn.",
              fx: {lover:!0,skill:{music:3}},
            },
            lose: {r:"The dogs join in. So do the neighbors, laughing.",fx:{happy:-2,skill:{music:1}}},
          },
          {
            t: "Not yet. The steppe is wide",
            r: "You ride off with the herd. There are other wells.",
            fx: {trait:"content"},
          },
        ],
      },
      {
        id: "ss_nw_seals",
        title: "The drowned horsemen",
        cond: (p,C)=>C.realm(p,"POL-12")&&kid(p,C,5,13),
        w: 1,
        once: !0,
        text: "On a sandbar of the Salt Sea, fat grey seals have hauled out to sleep in the sun. The other children whisper that they are drowned horsemen from the Salt Shore battle, who come up to look for their horses. One of them lifts its head and looks right at you.",
        choices: [
          {
            t: "Whistle for them like a herder calls a horse",
            r: "The seal barks back. You decide it is a very old horseman, and you visit it all summer.",
            fx: {happy:4,skill:{husbandry:1},trait:"curious"},
          },
          {
            t: "Throw stones to prove they are only animals",
            check: {s:"throwing",s2:"str",d:20},
            win: {
              r: "Plop, splash, and they slide into the water. Only seals. The other children do not believe you anyway.",
              fx: {skill:{throwing:2},int:.3},
            },
            lose: {
              r: "Your stone falls short and you slip into the cold salt mud. The seals watch you with great interest.",
              fx: {happy:-2,sta:.2},
            },
          },
          {
            t: "Ask the shaman if it is true",
            r: "The shaman says spirits live in springs, hills and the Salt Sea, and nobody counts what shape they choose. That is not a no.",
            fx: {piety:3,int:.3},
          },
        ],
      },
      {
        id: "ss_nw_whiskers",
        title: "Old Whiskers",
        cond: (p,C)=>C.realm(p,"POL-12")&&C.adult(p)&&(C.coast(p)||C.job(p,"fish")),
        w: .9,
        cool: 8,
        text: "You are crewing a Reed Wind sturgeon boat off Kultau when the line goes taut and the whole boat swings round. Something longer than the boat rolls under you, grey and whiskered. Old Whiskers, the Salt Sea monster that swallows horses, they say. Its roe is worth a fortune, and some swear its eggs give long life.",
        choices: [
          {
            t: "Hold the line and play it in",
            check: {s:"sea",s2:"str",d:50},
            win: {
              r: "Two hours, three men, and a sturgeon of six meters lies along the gunwale. The caviar traders of Kultau pay like princes.",
              fx: {coin:90,skill:{sea:3},str:.5,fame:2},
            },
            lose: {
              r: "It rolls, the boat goes over, and you come up in freezing water with the line round your leg.",
              fx: {health:-18,wil:2,skill:{sea:1},cause:"the Salt Sea"},
            },
          },
          {
            t: "Cut the line before it drags you under",
            r: "The fish is gone. The boat stays the right way up. The old fisherman beside you says you have sense, and that is rare in a young rider.",
            fx: {int:.3,trait:"cautious"},
          },
          {
            t: 'Later, sell jars of "Whiskers roe" to Sunland traders as long-life medicine',
            check: {s:"deception",s2:"trade",d:40},
            win: {
              r: "Ordinary roe in little jars. A Morhaven merchant buys six for his old father. The khan takes no tenth of lies.",
              fx: {coin:35,honor:-2,skill:{deception:2}},
            },
            lose: {
              r: "A Kultau caviar trader recognizes his own roe and makes you pay him back, and more.",
              fx: {coin:-15,honor:-3},
            },
          },
        ],
      },
      {
        id: "ss_nw_cords",
        title: "The tally cords",
        cond: (p,C)=>C.realm(p,"POL-12")&&kid(p,C,7,13),
        w: .9,
        once: !0,
        text: `A yam keeper's wife at the station teaches the children the tally cords: a knot for every horse, a twist for every rider, a color for every tribe. "A tally cord forgets nothing," she says. "That is why khans fear them."`,
        choices: [
          {
            t: "Learn every knot",
            check: {s:"int",s2:"wil",d:22},
            win: {
              r: "By winter you can read a cord of a hundred horses with your fingers in the dark. She says you could keep the khan's own tallies one day.",
              fx: {skill:{learning:3,stewardship:2},int:.6},
            },
            lose: {r:"Your knots come out like birds' nests. You are better at untying them.",fx:{skill:{learning:1}}},
          },
          {
            t: "Ask what the khans are afraid of",
            r: 'She hums a few lines of "The Forty Silent Days" and stops. "Some cords are older than the songs about them," she says, and sends you to fetch dung for the fire.',
            fx: {int:.4,trait:"curious"},
          },
          {
            t: "Slip off to watch the yam horses being changed",
            r: "Three riders come in and three go out in the time it takes to boil tea. You decide you will be a yam rider.",
            fx: {skill:{riding:2},happy:3},
          },
        ],
      },
      {
        id: "ss_nw_backshot",
        title: "The Arrow Field",
        cond: (p,C)=>C.realm(p,"POL-12")&&grown(p,C)&&!C.old(p)&&free(p),
        w: .9,
        cool: 6,
        text: "At the Kharsa Arrow Field the half-orc master Dorin Swiftarrow is teaching the backward shot: ride away at the gallop, twist in the saddle, and loose at the man chasing you. He watches you ride one pass and says nothing at all, which could mean anything.",
        choices: [
          {
            t: "Ride the pass again and loose backward",
            check: {s:"mounted",s2:"bow",d:50},
            win: {
              r: 'The arrow hits the straw rider behind you in the chest. Dorin grunts. "Again," he says, and you know you have been taken on.',
              fx: {skill:{mounted:4,bow:2},flag:"ss_nw_arrowfield",fame:1},
            },
            lose: {
              r: 'You twist, lose a stirrup and nearly go under the hooves. "You ride like a Sunlander," says Dorin.',
              fx: {health:-5,skill:{mounted:2},wil:.8,cause:"a fall at the Arrow Field"},
            },
          },
          {
            t: "Ask him how a half-orc came to teach the khan's riders",
            r: `"My grandfather herded with the Blue Wind before Ozbek's grandfather was born," he says. "On the steppe we mixed long ago. Ride."`,
            fx: {skill:{mounted:1},int:.3,newRel:{type:"mentor",op:15}},
          },
          {
            t: "Bet on the other students instead",
            check: {s:"gambling",s2:"ins",d:38},
            win: {
              r: "You back the quiet girl from the Grey Wind. She hits all three. Easy money.",
              fx: {coin:15,skill:{gambling:2}},
            },
            lose: {r:"You back the loud boy from the Red Wind. He hits a spectator's hat.",fx:{coin:-10}},
          },
        ],
      },
      {
        id: "ss_nw_ten",
        title: "Your ten",
        cond: (p,C)=>C.realm(p,"POL-12")&&C.adult(p)&&!C.old(p)&&(C.soldier(p)||C.male(p))&&free(p),
        w: 1,
        cool: 7,
        text: ()=>`The Saddle Law still orders every rider in tens, hundreds and thousands. Your ten's leader ${A.pick(["broke his neck in a fall","took a herd west and did not come back","has gone blind with the sugar sickness"])}, and the nine of you must agree on a new one before the hundred-leader rides by. Two of them are looking at you.`,
        choices: [
          {
            t: "Put yourself forward and drill them hard",
            check: {s:"command",s2:"riding",d:44},
            win: {
              r: "By autumn your ten wheels and feigns flight like one horse. The hundred-leader knows your name now.",
              fx: {skill:{command:3,riding:1},fame:2,merit:3,honor:2},
            },
            lose: {
              r: "Two riders will not take orders from you. The ten splits, and the hundred-leader sighs.",
              fx: {skill:{command:1},wil:1,happy:-3},
            },
          },
          {
            t: "Back the oldest rider instead",
            r: "Old Bars has ridden in more ring hunts than you have years. He is slow and wise, and you learn from him.",
            fx: {skill:{tactics:2},honor:1},
          },
          {
            t: "Dice for it, as the luckiest way",
            check: {s:"gambling",s2:"ins",d:36},
            win: {
              r: "Five sixes. The ten laughs and follows you, for luck.",
              fx: {skill:{gambling:1,command:1},happy:3},
            },
            lose: {r:"You throw ones. The ten laughs and follows somebody else.",fx:{happy:-1}},
          },
        ],
      },
      {
        id: "ss_nw_hyenas",
        title: "Night followers",
        cond: (p,C)=>C.realm(p,"POL-12")&&grown(p,C)&&!C.old(p),
        w: .8,
        cool: 8,
        text: "On the winter pasture a pack of cave hyenas has started following your herd, whooping in the dark just outside the firelight. Last night they took a foal. The orc herders in the next camp say hyenas carry the souls of the unburied, and will not go near them.",
        choices: [
          {
            t: "Ride out after the biggest one",
            r: "You take a torch and a spear and go after it.",
            fx: {beast:{id:"CRE-35",place:"the winter pasture",mod:.9}},
          },
          {
            t: "Build fires around the herd all night",
            check: {s:"survival",s2:"sta",d:38},
            win: {
              r: "Four fires and no sleep, three nights running. The hyenas lose patience and drift off after a weaker herd.",
              fx: {skill:{survival:2,husbandry:2},sta:.4,wil:.8},
            },
            lose: {r:"A fire goes out in the small hours. They take two sheep.",fx:{coin:-8,wil:1}},
          },
          {
            t: "Shoot from the dark, where they cannot see you",
            req: (p,C)=>C.prof(p,"bow",35),
            check: {s:"bow",s2:"ins",d:46},
            win: {
              r: "Three shafts in the moonlight. Two hyenas down, and the rest gone by dawn. The orc herders stare at you.",
              fx: {skill:{bow:3},fame:2},
            },
            lose: {r:"You waste a quiver on shadows.",fx:{skill:{bow:1},coin:-4}},
          },
        ],
      },
      {
        id: "ss_nw_fair",
        title: "The channel fair",
        cond: (p,C)=>C.realm(p,"POL-12")&&C.adult(p)&&free(p),
        w: 1,
        cool: 6,
        text: "At the channel fair at Ozlun Greyhaven buyers walk the horse lines with silver in their belts, and the khan's tally-men take a tenth of every horse sold. Your cousin has a better idea: walk six horses past the tally tent in the dust of a big herd, and sell them at the far end of the beach.",
        choices: [
          {
            t: "Sell honestly and pay the tenth",
            check: {s:"trade",s2:"persuasion",d:38},
            win: {
              r: "You talk a Greyhaven captain up to fifty suns a head for your best two. Even after the tenth it is a fine day.",
              fx: {coin:45,skill:{trade:3}},
            },
            lose: {r:"The buyers have seen better horses today. You sell low.",fx:{coin:15,skill:{trade:1}}},
          },
          {
            t: "Drive the six past the tally tent in the dust",
            check: {s:"stealth",s2:"riding",d:44},
            win: {
              r: "Dust, noise, three hundred horses, and six that nobody counted. You split sixty suns with your cousin.",
              fx: {coin:60,skill:{stealth:2},honor:-2},
            },
            lose: {
              r: "A tally-man counts by ear and catches it. The khan takes all six, and a fine besides.",
              fx: {coin:-60,favor:-3,honor:-3},
            },
          },
          {
            t: "Tell your cousin the khan already has enough enemies",
            r: "He sulks. Next year the tally-men catch his neighbor at it, and he buys you tea.",
            fx: {honor:2,rel:{who:"cousin",op:4}},
          },
        ],
      },
      {
        id: "ss_nw_kurultai",
        title: "Before the kurultai",
        cond: (p,C)=>early()&&C.realm(p,"POL-12")&&C.adult(p)&&free(p),
        w: 1,
        once: !0,
        text: "Everyone knows that at the Horse Feast the nine chiefs will meet in kurultai and raise Serik Kharsan as heir. Everyone also knows that Yesun of the Red Wind is counting votes, and that five votes are enough. In the camp tonight a Red Wind rider asks you, very politely, which way your chief will lean.",
        choices: [
          {
            t: "Say loudly that the Kharsan line keeps the Compact",
            r: "The rider smiles and leaves. The next morning Serik's men give your camp a sheep, which in this season means a great deal.",
            fx: {favor:4,honor:1},
          },
          {
            t: "Tell him, for a price, what your chief has said",
            check: {s:"intrigue",s2:"ins",d:44},
            win: {
              r: "Twenty suns of Red Wind silver for some tent gossip. Nobody will ever know it was you.",
              fx: {coin:20,skill:{intrigue:3},honor:-2},
            },
            lose: {
              r: "Your chief learns who talked. You ride last in the ring hunt for a year.",
              fx: {coin:20,honor:-5,favor:-3},
            },
          },
          {
            t: "Say you are only a herder and the sky decides",
            r: '"Kun kok, at semiz," you say: the sky is blue, the horse is fat. He laughs and lets you be.',
            fx: {trait:"cautious",wil:.4},
          },
        ],
      },
      {
        id: "ss_nw_jars",
        title: "Camels going west",
        cond: (p,C)=>early()&&C.realm(p,"POL-12")&&C.adult(p)&&!C.old(p)&&free(p),
        w: .9,
        once: !0,
        text: "A string of camels is being loaded at night near Bekar, each with two sealed jars packed in felt and straw. The camel master is hiring riders for the long road to Morhaven, good pay and no questions. Everyone in the Dust Wind knows what the jars are, and that the khan's heir wants the sale stopped.",
        choices: [
          {
            t: "Ride with the camels for the pay",
            check: {s:"survival",s2:"riding",d:44},
            win: {
              r: "Forty days of dry roads and nervous camels. You hand the jars to Morhaven men at a border inn and ride home with sixty suns and a closed mouth.",
              fx: {coin:60,skill:{survival:2,riding:2},flag:"ss_nw_oilroad"},
            },
            lose: {
              r: "A camel kicks a jar loose in the dark and it cracks. The stink alone makes men retch. Nobody lights a fire for three days, and your pay is docked.",
              fx: {coin:15,health:-6,wil:1,cause:"fire-oil fumes"},
            },
          },
          {
            t: "Carry word of the convoy to Serik's men",
            check: {s:"intrigue",s2:"riding",d:46},
            win: {
              r: "Serik's rider listens, gives you a silver ring and tells you to forget his face. The convoy is delayed a month.",
              fx: {coin:12,favor:-2,honor:3,skill:{intrigue:2}},
            },
            lose: {
              r: "The camel master's men see you ride off toward the Silver Tablet camp. You hear later that they asked about you.",
              fx: {newRel:{type:"enemy",op:-25}},
            },
          },
          {
            t: "Stay home. Fire is the khan's business",
            r: "You watch the dust of the camels go west. Some things are better heard about than seen.",
            fx: {trait:"content"},
          },
        ],
      },
      {
        id: "ss_nw_hordeguest",
        title: "A rider from the Horde",
        cond: (p,C)=>C.realm(p,"POL-12")&&C.adult(p)&&C.race(p,"orc","halforc","human")&&free(p),
        w: .7,
        cool: 10,
        text: p=>`A wounded orc rider of the Horde stumbles into your camp at night, his horse dead behind him. The Horde has been the Nine Winds' enemy since the Salt Shore. ${p.race==="human"?"But your half-orc neighbors say":"Your own grandmother would have said"} that a man at your fire is a guest before he is an enemy.`,
        choices: [
          {
            t: "Bind his wound and feed him",
            check: {s:"medicine",s2:"int",d:38},
            win: {
              r: `He lives. In the morning he gives you a bone knife carved with a running horse and rides off on your worst nag. "When Vrag's riders come," he says, "show them this."`,
              fx: {honor:3,skill:{medicine:2},flag:"ss_nw_hordeknife",newRel:{type:"friend",op:25}},
            },
            lose: {
              r: "The fever takes him before dawn. You burn him so he can ride the smoke, as you would your own.",
              fx: {piety:2,wil:1},
            },
          },
          {
            t: "Hand him to the hundred-leader",
            r: "The hundred-leader gives you a sheep and a pat on the back. The orc looks at you once and says nothing.",
            fx: {favor:3,honor:-2,coin:5},
          },
          {
            t: "Take his weapons and send him back east on foot",
            r: "He walks off into the dark without a word. Maybe the steppe will spare him. Maybe not.",
            fx: {coin:8,wil:.5},
          },
        ],
      },
      {
        id: "ss_qd_naming",
        title: "The eighth day",
        cond: (p,C)=>C.realm(p,"POL-17")&&C.adult(p),
        w: .8,
        cool: 9,
        setup: (p,ctx)=>{ctx.n=loc(p)},
        text: "Your sister's baby is eight days old, and the family gathers in the courtyard by the cistern for the naming. In Qadir a child is named on the eighth day with a drop of well water on the tongue. The honor of the drop has fallen to you.",
        choices: [
          {
            t: "Let the drop fall and say the name: {n}",
            r: "The baby screws up its face at the cold water and howls. Everyone cheers. That is how it is meant to go.",
            fx: {piety:3,happy:3,honor:1},
          },
          {
            t: "Recite a saying of Samar over the child",
            check: {s:"faith",s2:"int",d:34},
            win: {
              r: '"Water first, then words." Your voice does not shake. The old women nod and say you were raised properly.',
              fx: {piety:4,skill:{faith:2},fame:1},
            },
            lose: {r:"You muddle the saying and an uncle corrects you, loudly, twice.",fx:{piety:1,happy:-2}},
          },
          {
            t: "Give a gift of a water share (15 suns)",
            req: p=>p.coin>=15,
            r: "A small share in the street cistern, written on good Qadiri paper. Your sister cries. The child will never be thirsty.",
            fx: {coin:-15,honor:3,rel:{who:"sibling",op:12}},
          },
        ],
      },
      {
        id: "ss_qd_rags",
        title: "The south gate heaps",
        cond: (p,C)=>C.realm(p,"POL-17")&&grown(p,C)&&(C.poor(p)||C.job(p,"labor")),
        w: 1.1,
        cool: 5,
        text: "Before dawn the refuse heaps outside Qadira's south gate. Rags are paper here: the thirty-two mills buy every scrap of linen by weight, and a good morning is worth four or five pence. Today the best heap is fat with old linen, and three of the Sieve's people are walking toward you with their hands in their sleeves.",
        choices: [
          {
            t: "Hold your heap",
            check: {s:"unarmed",s2:"wil",d:42},
            win: {
              r: "You break one nose and they decide your heap is not worth it. You sell twelve pence of rags by noon.",
              fx: {coin:2,skill:{unarmed:2},wil:.8,fame:1},
            },
            lose: {
              r: "A knife flicks across your arm. They take your sack and your morning.",
              fx: {health:-10,wound:"deep_cut",wil:1.5,cause:"a rag-gang knife"},
            },
          },
          {
            t: "Pay them a penny a week and pick in peace",
            r: "Samira the Sieve's people keep a list. Now you are on it, on the right side.",
            fx: {coin:-1,skill:{intrigue:1}},
          },
          {
            t: "Read the scraps before you sell them",
            req: (p,C)=>C.literate(p),
            check: {s:"int",s2:"learning",d:36},
            win: {
              r: "One scrap is a merchant's letter about a ship due at Miruma. You sell the news to a rival merchant for two suns.",
              fx: {coin:2,skill:{intrigue:2},int:.3},
            },
            lose: {
              r: "Prayers, bills, a child's writing lesson. Paper is cheap in Qadir, and so are words.",
              fx: {int:.2},
            },
          },
        ],
      },
      {
        id: "ss_qd_water",
        title: "The Saman water",
        cond: (p,C)=>C.realm(p,"POL-17")&&C.adult(p)&&free(p),
        w: 1,
        cool: 7,
        text: ()=>`Your family's garden lives on its share of the stream in the Saman valley, the most fought-over water in the realm. This week a mill family has cut a new channel above you to turn ${A.pick(["a second stamper","a new wheel","their washing vats"])}, and your date palms are drinking dust.`,
        choices: [
          {
            t: "Take it to the Well-Keepers' court",
            check: {s:"learning",s2:"persuasion",d:44},
            win: {
              r: `You bring your grandfather's water deed on paper older than the mill. The Well-Keeper reads it twice and orders the channel filled. "The well does not lie," he says.`,
              fx: {coin:15,honor:3,skill:{learning:2},newRel:{type:"enemy",op:-20}},
            },
            lose: {
              r: "The mill family brings a deed of their own, and better lawyers. The court splits the water, badly for you.",
              fx: {coin:-12,wil:1},
            },
          },
          {
            t: "Break their channel wall at night",
            check: {s:"stealth",s2:"str",d:40},
            win: {
              r: "One loose stone, and the water finds its old way home. The mill blames bad masonry.",
              fx: {coin:8,skill:{stealth:2}},
            },
            lose: {
              r: "A mill watchman with a lantern of oiled paper catches you with your hands in the water. Water theft is a real crime here.",
              fx: {punish:"theft"},
            },
          },
          {
            t: "Sell them your share and plant less",
            r: "Thirty suns, paid in silver qadr. The garden shrinks to a few palms. The mill hums.",
            fx: {coin:30,happy:-3},
          },
        ],
      },
      {
        id: "ss_qd_wellschool",
        title: "The well-school",
        cond: (p,C)=>C.realm(p,"POL-17")&&kid(p,C,6,12),
        w: 1.2,
        once: !0,
        text: "Every morning the boys and many of the girls of your street sit on mats at the well-school while a Well-Keeper reads the Book of Wells and draws the letters on cheap Qadiri paper. Paper costs so little here that even the rag-pickers' children learn to read a little.",
        choices: [
          {
            t: "Learn your letters properly",
            check: {s:"int",s2:"wil",d:22},
            win: {
              r: "By the Breaking of the Dry you can read a whole saying of Samar aloud without stopping. Your mother tells the neighbors.",
              fx: {literate:!0,skill:{learning:3,faith:1},int:.5},
            },
            lose: {
              r: "The letters swim. You learn to write your name and a few sayings, and that is something.",
              fx: {skill:{learning:1}},
            },
          },
          {
            t: "Copy the calligraphy, beautifully",
            check: {s:"craft",s2:"int",d:20},
            win: {
              r: "The Well-Keeper holds your page up to the class. You read badly, but you write like a court scribe.",
              fx: {literate:!0,skill:{craft:3,learning:1}},
            },
            lose: {
              r: "Ink everywhere, on the mat, on your face, on the Keeper's sleeve.",
              fx: {skill:{craft:1},happy:-1},
            },
          },
          {
            t: "Skip school and watch the galleys in the Sea Keep slips",
            r: "Oars, pitch, shouting shipwrights. You learn every part of a galley and none of the alphabet.",
            fx: {skill:{sea:2},happy:3,family:-1},
          },
        ],
      },
      {
        id: "ss_qd_drunk",
        title: "Flogged at the well",
        cond: (p,C)=>C.realm(p,"POL-17")&&C.adult(p),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{ctx.n=loc(p,"M")},
        text: "Your friend {n} has been drinking foreign wine in the back room of the Paper Lantern, and now he is singing in the street outside the cistern of your quarter. Drunkards are flogged at the well they shamed. The watch is coming round the corner with their paper lanterns.",
        choices: [
          {
            t: "Haul him into a doorway and hold his mouth",
            check: {s:"stealth",s2:"str",d:38},
            win: {
              r: "The watch passes. {n} goes to sleep on your feet. In the morning he swears off wine, again.",
              fx: {honor:1,skill:{stealth:2},newRel:{type:"friend",op:20}},
            },
            lose: {
              r: "He bites your hand and bursts into song. The watch takes you both for a night in the cell.",
              fx: {honor:-2,happy:-3,wil:.5},
            },
          },
          {
            t: "Let the law take him",
            r: "Ten lashes at the cistern in the morning. He does not look at you afterward, and he does not drink again.",
            fx: {piety:2,honor:-1},
          },
          {
            t: "Talk the watch out of it",
            check: {s:"persuasion",s2:"etiquette",d:42},
            win: {
              r: '"He is mourning his father," you say, and the watch-captain, who knew his father, lets it go with a warning.',
              fx: {skill:{persuasion:2},newRel:{type:"friend",op:25}},
            },
            lose: {
              r: "The captain says mourning is done with water. Ten lashes for {n}, five for you for arguing.",
              fx: {health:-6,wil:1,cause:"a flogging at the well"},
            },
          },
        ],
      },
      {
        id: "ss_qd_oar",
        title: "One man in forty",
        cond: (p,C)=>C.realm(p,"POL-17")&&C.adult(p)&&C.male(p)&&!C.noble(p)&&!C.old(p)&&!C.soldier(p),
        w: 1,
        cool: 6,
        text: "The province owes one man in forty for a season, and the lot has fallen on you. Grand Admiral Jalal's new galleys need rowers: a hundred and fifty to a ship, chained to nothing, paid little. The shipwrights at Miruma say quietly that some of the hulls were built of green timber and leak.",
        choices: [
          {
            t: "Row the season",
            check: {s:"sta",s2:"sea",d:42},
            win: {
              r: "Blisters, then calluses, then shoulders like a bull. You come home brown, hard and paid.",
              fx: {sta:.8,str:.5,skill:{sea:3},coin:12},
            },
            lose: {
              r: "Your galley leaks so badly you spend more time bailing than rowing, and a fever takes half the benches.",
              fx: {health:-14,wil:1.5,skill:{sea:1},cause:"galley fever"},
            },
          },
          {
            t: "Pay a substitute (20 suns)",
            req: p=>p.coin>=20,
            r: "A landless boy from the rag heaps rows in your place, glad of the bread.",
            fx: {coin:-20,honor:-1},
          },
          {
            t: "Ask for the marines instead",
            check: {s:"melee",s2:"athletics",d:44},
            win: {
              r: "The Sea Keep sergeant watches you climb a rope with a grapple in your teeth and puts you with the boarders.",
              fx: {skill:{melee:2,athletics:2},flag:"ss_qd_marine"},
            },
            lose: {
              r: "You fall off the practice hull into the harbor. To the oars with you.",
              fx: {skill:{sea:2},sta:.4},
            },
          },
        ],
      },
      {
        id: "ss_qd_seakeep",
        title: "Fighting fire at sea",
        cond: (p,C)=>C.realm(p,"POL-17")&&C.adult(p)&&(C.soldier(p)||C.flag(p,"ss_qd_marine")||C.job(p,"sailor")),
        w: 1,
        cool: 7,
        text: "At the School of the Sea Keep, Faris Bahri drills the marines with grapples and wet-hide shields, and makes them practice putting out burning pitch with sand. Everyone knows he has never seen Sabran fire-oil burn. Neither has anyone else in the fleet.",
        choices: [
          {
            t: "Throw yourself into the boarding drill",
            check: {s:"melee",s2:"athletics",d:44},
            win: {
              r: "Grapple, climb, shield up, over the rail. Faris names you first over the side in his own boat.",
              fx: {skill:{melee:3,athletics:2,shield:1},merit:2},
            },
            lose: {
              r: "The grapple slips and you hang by one hand over the slip. You learn to check your hooks.",
              fx: {health:-5,skill:{athletics:1},cause:"a fall in the boarding drill"},
            },
          },
          {
            t: "Ask how you put out a fire that burns on water",
            check: {s:"int",s2:"sea",d:40},
            win: {
              r: `Faris is quiet a long moment. "You don't," he says. "You keep away from it." He starts teaching you to steer upwind.`,
              fx: {int:.5,skill:{sea:2,tactics:1}},
            },
            lose: {r:'"With sand and courage," he says, and the drill goes on. You are not reassured.',fx:{wil:.5}},
          },
          {
            t: "Drill the slow men behind the hall at night",
            check: {s:"command",s2:"wil",d:40},
            win: {
              r: "In a month your slow men are fast men. The sergeants notice.",
              fx: {skill:{command:3},merit:2,fame:1},
            },
            lose: {r:"The slow men would rather sleep. So, it turns out, would you.",fx:{skill:{command:1}}},
          },
        ],
      },
      {
        id: "ss_qd_wyvern",
        title: "Wyvern eggs",
        cond: (p,C)=>C.realm(p,"POL-17")&&grown(p,C)&&!C.old(p),
        w: .8,
        cool: 9,
        text: "Your grandmother's eyes are clouding over. The herders in the Sunwall say wyvern eggs cure blindness, and there is a colony of Sunwall wyverns on the cliffs above the Basim road: twenty of them, spraying anyone who comes near their nests.",
        choices: [
          {
            t: "Climb for an egg in the noon heat, when they fly badly",
            check: {s:"athletics",s2:"ins",d:48},
            win: {
              r: "In the dead noon air they cannot rise. You come down with an egg the size of a melon. It does nothing for her eyes, but she eats it and says it was the best omelet of her life.",
              fx: {skill:{athletics:3},spd:.4,rel:{who:"grandmother",op:10},int:.2},
            },
            lose: {
              r: "A wyvern drops on you from the ledge, spitting. You come down much faster than you went up.",
              fx: {health:-18,wound:"burn",wil:1.5,cause:"a Sunwall wyvern"},
            },
          },
          {
            t: "Fight the wyvern that guards the lowest nest",
            req: (p,C)=>C.adult(p),
            r: "You climb with a spear and wait for it to come.",
            fx: {beast:{id:"CRE-03",place:"the Sunwall cliffs",mod:.9}},
          },
          {
            t: "Take her to a well-house physician instead",
            check: {s:"medicine",s2:"int",d:34},
            win: {
              r: "The physician reads from an old Qadiri book and couches the cloud from one eye with a needle. She sees your face again and cries.",
              fx: {coin:-6,skill:{medicine:2},rel:{who:"grandmother",op:12},happy:4},
            },
            lose: {r:"He takes six suns and says it is the will of the Giver. It may be.",fx:{coin:-6}},
          },
        ],
      },
      {
        id: "ss_qd_basilisk",
        title: "In the garden wall",
        cond: (p,C)=>C.realm(p,"POL-17")&&C.ageAdj(p)>=12&&!C.old(p),
        w: .8,
        cool: 9,
        text: "Something is living in the dry-stone wall of the date garden. The gardener's boy saw its eyes and swears it is a basilisk that kills with a look. It is a basilisk, but it kills with its bite, and it spits when cornered.",
        choices: [
          {
            t: "Pull the stones down and kill it",
            r: "You wrap your arms in leather and start pulling stones.",
            fx: {beast:{id:"CRE-38",place:"the garden wall",mod:.8}},
          },
          {
            t: "Smoke it out with wet palm fronds",
            check: {s:"survival",s2:"ins",d:38},
            win: {
              r: "It slides out coughing and away over the wall into the scrub. Nobody looked anybody in the eye.",
              fx: {skill:{survival:2,husbandry:1}},
            },
            lose: {
              r: "It comes out spitting, straight at you. Your eyes burn for a day.",
              fx: {health:-8,wil:.8,cause:"basilisk spit"},
            },
          },
          {
            t: "Pay a snake-man from the market (3 suns)",
            req: p=>p.coin>=3,
            r: "He whistles, catches it with a forked stick, and sells it the same afternoon to a physician for venom. Everyone wins but the basilisk.",
            fx: {coin:-3,int:.3},
          },
        ],
      },
      {
        id: "ss_qd_shroud",
        title: "The linen shroud",
        cond: (p,C)=>C.realm(p,"POL-17")&&C.adult(p)&&(C.poor(p)||bond(p)),
        w: .9,
        cool: 12,
        text: ()=>`Your ${A.pick(["uncle","old neighbor who raised you half your life","father-in-law"])} dies in the night. The dead are washed, wrapped in linen and buried within a day, facing the Well of Samar. The rag-buyer is already at the door: a good linen shroud is worth more than a week's bread, and the poor of Qadira bury their dead in plain sand and sell it.`,
        choices: [
          {
            t: "Bury him in the linen",
            r: "He goes into the ground wrapped and facing the Well, as the Book says a believer should. You go hungry for a week and do not regret it.",
            fx: {piety:3,honor:2,wil:1,coin:-2},
          },
          {
            t: "Sell the shroud to the rag-buyer",
            r: "Plain sand, a cup of water poured, a short prayer. The Keepers allow it, because the paper will carry the Book. The coins feel heavy anyway.",
            fx: {coin:4,wil:1,happy:-3},
          },
          {
            t: "Haggle the rag-buyer up, then bury him in it anyway",
            check: {s:"deception",s2:"trade",d:40},
            win: {
              r: "He pays a deposit for tomorrow. Tomorrow the shroud is in the ground, and the rag-buyer swears at your door for an hour.",
              fx: {coin:2,skill:{deception:2},honor:-1},
            },
            lose: {r:'He is no fool. "Linen first, coin after," he says, and walks away.',fx:{happy:-2}},
          },
        ],
      },
      {
        id: "ss_qd_howpaper",
        title: "How is paper made?",
        cond: (p,C)=>C.realm(p,"POL-17")&&C.adult(p),
        w: .9,
        cool: 9,
        text: ()=>`A friendly ${A.pick(["Ranpuri cotton broker","Lucernan factor","Keshi ship captain"])} buys you dinner at the Seven Cisterns and, over the dates, asks how the mills turn rags into paper. Asking a mill worker how paper is made earns a visit from the Master of Doors. Answering him earns a good deal worse.`,
        choices: [
          {
            t: "Say you have no idea, and change the subject",
            r: "He smiles and pays for dinner anyway. A wise man knows when he is being tested, and when he is being bought.",
            fx: {honor:1,int:.3},
          },
          {
            t: "Describe a long, wrong process for a fee",
            check: {s:"deception",s2:"int",d:44},
            win: {
              r: "Boiled seaweed, crushed pearls, secret prayers. He writes it all down and pays twenty suns. Somewhere in Ranpur a mill will one day make very bad soup.",
              fx: {coin:20,skill:{deception:3}},
            },
            lose: {
              r: "He knows enough to see you are lying, and he knows people who do not like being lied to.",
              fx: {newRel:{type:"enemy",op:-20}},
            },
          },
          {
            t: "Report him to the Master of Doors",
            check: {s:"intrigue",s2:"persuasion",d:40},
            win: {
              r: "Rafiq the Quiet's man thanks you in a voice like dry leaves and gives you ten silver qadr. The broker sails the next week.",
              fx: {coin:20,favor:3,skill:{intrigue:2}},
            },
            lose: {
              r: "Rafiq's man asks why the broker chose you to ask. It takes you three days to answer well enough.",
              fx: {wil:1,happy:-4},
            },
          },
        ],
      },
      {
        id: "ss_qd_headtax",
        title: "Two qadr a head",
        cond: (p,C)=>C.realm(p,"POL-17")&&C.adult(p)&&!C.faith(p,"REL-07"),
        w: 1,
        cool: 6,
        text: p=>`The tax collector of the quarter is at your door with his book. In Qadir non-believers pay two silver qadr a head every year, and you are not of the Path of the Well. ${p.faith?"He glances at the "+((A.faith(p.faith)||{}).name||"foreign")+" sign by your door and adds a mark in his book.":""}`,
        choices: [
          {
            t: "Pay the two qadr (4 suns)",
            r: "He writes a receipt on good paper. The cost of being yourself in Qadir.",
            fx: {coin:-4,wil:.3},
          },
          {
            t: "Go to the Friday reading at the Water Hill gate and listen",
            check: {s:"faith",s2:"int",d:36},
            win: {
              r: "You listen to the Book read aloud. Some of it is wise. The Well-Keeper notices you and the collector does not come back this year.",
              fx: {piety:2,skill:{faith:2},int:.3},
            },
            lose: {r:"You fidget through the reading. The collector comes back anyway, with interest.",fx:{coin:-5}},
          },
          {
            t: "Argue that you were born here and are no foreigner",
            check: {s:"persuasion",s2:"learning",d:46},
            win: {
              r: "He finds an old clause about the children of Solen garrison families. You do not quite qualify. He decides you do.",
              fx: {skill:{persuasion:2},coin:2},
            },
            lose: {r:"He adds a fine for wasting his morning.",fx:{coin:-7}},
          },
        ],
      },
      {
        id: "ss_qd_pilot",
        title: "The pilots of Miruma",
        cond: (p,C)=>C.realm(p,"POL-17")&&grown(p,C)&&C.ageAdj(p)<30&&free(p)&&(C.coast(p)||C.job(p,"sailor","fish")),
        w: .9,
        once: !0,
        text: 'Salim the Pilot of the Brotherhood of Pilots of Miruma is looking for an apprentice. He takes you out in a small boat at night and asks you to name every light along the coast and say where the shoals lie. "A pilot who guesses," he says, "drowns other people."',
        choices: [
          {
            t: "Read the coast for him",
            check: {s:"sea",s2:"int",d:42},
            win: {
              r: "You name eleven of fourteen lights and smell the shoal before you see the surf. Salim takes you on for seven years.",
              fx: {skill:{sea:4,survival:1},job:"sailor",flag:"ss_qd_pilot",int:.4},
            },
            lose: {
              r: "You call a fishing boat's lamp the Sea Keep. Salim laughs until he coughs and rows you home.",
              fx: {skill:{sea:2}},
            },
          },
          {
            t: "Ask him about the Strait of Hael and the dragon",
            r: `"I have sailed past it twice," he says. "I saw fire. I did not see a dragon. Don't tell anyone I said so."`,
            fx: {int:.4,skill:{sea:1}},
          },
          {
            t: "Say you would rather fish with your father",
            r: 'Salim shrugs. "The sea takes the ones who want it most anyway."',
            fx: {skill:{sea:1}},
          },
        ],
      },
      {
        id: "ss_qd_sabun",
        title: "Copper on the Sabun road",
        cond: (p,C)=>C.realm(p,"POL-17")&&C.adult(p)&&(C.soldier(p)||C.terr(p,"hills","mountains")),
        w: .9,
        cool: 8,
        text: "Night on the Sabun Pass, 2,600 meters up, and a mule train is coming down toward Sabra with no torches. Under the sacking: copper ingots stamped with the mark of the Basim mines. Everyone in the West March says House Qasimi sells copper to the enemy. Now you have seen it.",
        choices: [
          {
            t: "Stop the train and seize the copper",
            check: {s:"tactics",s2:"ins",d:44},
            win: {
              r: "You block the narrow turn and the muleteers give up without a blow. The Wardens' captain is delighted, until he reads the stamp. Then he is very quiet.",
              fx: {merit:3,honor:3,favor:2,newRel:{type:"enemy",op:-25}},
            },
            lose: {
              r: "The muleteers have crossbows. One bolt takes you in the leg before they vanish down the pass.",
              fx: {health:-16,wound:"arrow_wound",wil:1.5,cause:"a smuggler's bolt"},
            },
          },
          {
            t: "Take the muleteers' silver and look the other way",
            r: "Thirty silver qadr in a leather bag. The copper goes to Sabra. Probably it becomes nails.",
            fx: {coin:60,honor:-5},
          },
          {
            t: "Count the mules and write a report",
            req: (p,C)=>C.literate(p),
            r: "You write it down on paper, carefully, with the date and the stamp. One day a report like that is worth more than copper.",
            fx: {skill:{intrigue:2},flag:"ss_qd_qasimi",int:.3},
          },
        ],
      },
      {
        id: "ss_qd_horncup",
        title: "Does whale ivory sweat?",
        cond: (p,C)=>early()&&C.realm(p,"POL-17")&&C.adult(p)&&(C.literate(p)||C.prof(p,"medicine",30)),
        w: .8,
        once: !0,
        text: 'A palace physician in a good robe finds you in the House of the First Cup and asks a strange question, very quietly: how would one test a cup of horn for poison, and does whale ivory sweat? The Sultan drinks only from a "unicorn horn" cup bought from Zanara.',
        choices: [
          {
            t: "Tell him what you know: the horn tale is a fraud",
            check: {s:"learning",s2:"medicine",d:44},
            win: {
              r: "You explain that no horn sweats poison, and that northern traders sell whale tusks as unicorn horn. He goes grey, thanks you, and leaves very fast.",
              fx: {int:.6,skill:{learning:2},flag:"ss_qd_horn",fame:1},
            },
            lose: {r:"You talk for an hour and he leaves no wiser than he came. Neither are you.",fx:{int:.2}},
          },
          {
            t: "Say you know nothing about the Sultan's cups",
            r: "He nods, relieved, and pays for your water anyway. Some questions get people killed.",
            fx: {trait:"cautious"},
          },
          {
            t: "Sell the question to someone who would want it",
            check: {s:"intrigue",s2:"ins",d:48},
            win: {
              r: "A Sabran broker pays you twenty suns to know the palace doubts its own cup. What he does with it is his sin.",
              fx: {coin:20,honor:-3,skill:{intrigue:3}},
            },
            lose: {
              r: "The man you try to sell it to works for the Master of Doors.",
              fx: {prison:1,why:"trading palace secrets"},
            },
          },
        ],
      },
      {
        id: "ss_qd_breaking",
        title: "The Breaking of the Dry",
        cond: (p,C)=>C.realm(p,"POL-17")&&C.ageAdj(p)>=8,
        w: 1,
        cool: 5,
        text: "1 September, the Breaking of the Dry. A month of fasting from dawn to dusk is over, and at sunset every courtyard in Qadira smells of roast goat and cumin. The great houses open their gates and give food to anyone who comes. House Hassani's courtyard is the richest, and the busiest.",
        choices: [
          {
            t: "Feast with your family until you cannot move",
            r: "Dates, goat, honeyed barley, and stories nobody believes. The month was worth it.",
            fx: {happy:6,piety:2},
          },
          {
            t: "Serve at the gate of a great house",
            check: {s:"etiquette",s2:"sta",d:34},
            win: {
              r: "You carry platters until midnight. Nadira Hassani's steward notes your quick hands and asks your name.",
              fx: {skill:{etiquette:2},newRel:{type:"friend",op:15},piety:2},
            },
            lose: {
              r: "You drop a whole goat on the steps. The beggars are delighted.",
              fx: {happy:-2,skill:{etiquette:1}},
            },
          },
          {
            t: "Slip extra food to the rag-pickers outside the south gate",
            r: "You carry a sack of bread through the dark to the heaps. The children there have never eaten so well.",
            fx: {honor:3,piety:3,trait:"generous"},
          },
        ],
      },
    ]);
    A.defEvents([
      {
        id: "ss_tm_tears",
        title: "The Tears",
        cond: (p,C)=>C.realm(p,"POL-18")&&C.ageAdj(p)>=8,
        w: 1.1,
        cool: 5,
        text: "15 August, the Tears: the Monuti's first rise. The whole village goes down to the bank with bread and beer for the Flood Mother. It is a flood-day, so nobody may fish, on pain of death. But the water is thick with perch, and your family has eaten nothing but onions for a week.",
        choices: [
          {
            t: "Lay your bread on the water and pray",
            r: 'The brown water takes the loaf and turns it slowly. "Moy en Mut," the old women say: water of the Mother. You feel it in your chest.',
            fx: {piety:4,happy:2},
          },
          {
            t: "Set a basket trap in the reeds after dark",
            check: {s:"stealth",s2:"survival",d:44},
            win: {
              r: "Six perch by morning and nobody saw. Your family eats well and says nothing. The Mother, you hope, looks the other way.",
              fx: {coin:2,skill:{stealth:2,survival:1},piety:-3,happy:3},
            },
            lose: {
              r: "A flood-priest's boy finds the basket with your mark on it. On a flood-day that is not a fine. That is the river.",
              fx: {punish:"theft",piety:-5,wil:1.5},
            },
          },
          {
            t: "Help a Delta Wells neighbor who fasts for the Dry Month",
            r: "Your Well-believing neighbor will not eat till dusk, though the Tears are a feast. You carry her water jars all afternoon. At dusk she shares her dates with you.",
            fx: {honor:2,newRel:{type:"friend",op:20},trait:"kind"},
          },
        ],
      },
      {
        id: "ss_tm_opening",
        title: "The Opening of the Dykes",
        cond: (p,C)=>C.realm(p,"POL-18")&&C.ageAdj(p)>=8,
        w: 1,
        cool: 6,
        text: p=>`1 September. On the bank below ${capOf(p)} the King, son of the Flood Mother, lifts a gilded hoe and cuts the first dyke himself, and the brown water pours into the basins. Half the kingdom has come to see a living god dig.`,
        choices: [
          {
            t: "Push to the front to see his face",
            check: {s:"athletics",s2:"str",d:36},
            win: {
              r: "For a moment you are close enough to see the sweat on his shaved head. He looks tired. He looks like a man. You tell nobody that part.",
              fx: {happy:4,int:.3,fame:1},
            },
            lose: {
              r: "The Sons of the Mother push the crowd back with their tall shields. You see a lot of shield.",
              fx: {health:-3,happy:-1,cause:"a crush in the crowd"},
            },
          },
          {
            t: "Work the crowd for purses",
            req: (p,C)=>C.prof(p,"stealth",25)||C.poor(p),
            check: {s:"stealth",s2:"spd",d:44},
            win: {
              r: "Copper rings, a silver kite, a scarab charm. Every eye is on the god.",
              fx: {coin:9,skill:{stealth:2},honor:-2},
            },
            lose: {r:"The vizier's constables are watching the crowd, not the god.",fx:{punish:"theft"}},
          },
          {
            t: "Sing the boatmen's chant with the crowd",
            r: "Ten thousand voices naming every bend of the river, from Talim to the sea. You know all of them by the end.",
            fx: {skill:{music:2},piety:2,happy:3},
          },
        ],
      },
      {
        id: "ss_tm_boil",
        title: "A boil in the dyke",
        cond: (p,C)=>C.realm(p,"POL-18")&&C.adult(p)&&!C.noble(p),
        w: 1.1,
        cool: 5,
        text: "The flood is cresting. You are on night watch on the dyke above your village when you see it by the lamp: a bubbling spring of muddy water on the land side, at the foot of the bank. A boil. If it opens, the dyke goes, and the village with it.",
        choices: [
          {
            t: "Ring it with sandbags and your own body",
            check: {s:"str",s2:"sta",d:44},
            win: {
              r: "You build a ring of baskets around the boil until the water stands as high inside as out, and it stops. At dawn the overseer looks at your hands and says nothing, which is a lot from him.",
              fx: {str:.5,sta:.5,honor:4,fame:2,wil:1},
            },
            lose: {
              r: "The bank slumps under you. You are in the water to the neck before the others drag you out. The boil is plugged, but you will feel that cold for a long time.",
              fx: {health:-15,wil:2,honor:2,cause:"a collapsing dyke"},
            },
          },
          {
            t: "Run for the Dyke Corps and the overseer",
            check: {s:"spd",s2:"sta",d:36},
            win: {
              r: "You bring forty men with baskets at the run. The dyke holds. The overseer writes your name on his tally.",
              fx: {spd:.4,honor:2,coin:3},
            },
            lose: {
              r: "By the time you are back, the boil has torn open and a field is under water. Not yours, thank the Mother.",
              fx: {wil:1,happy:-4},
            },
          },
          {
            t: "Cut a relief channel into the next nome's field",
            check: {s:"craft",s2:"int",d:40},
            win: {
              r: "The water drops a hand's breadth and the boil dies. The next nome's farmers wake up to a lake and a quarrel that will last ten years.",
              fx: {skill:{craft:2},honor:-2,newRel:{type:"enemy",op:-20}},
            },
            lose: {r:"Your channel goes the wrong way and floods your own lane.",fx:{coin:-6,happy:-4}},
          },
        ],
      },
      {
        id: "ss_tm_croc",
        title: "The Mother's guard",
        cond: (p,C)=>C.realm(p,"POL-18")&&C.ageAdj(p)>=12&&!C.old(p),
        w: .9,
        cool: 8,
        text: p=>"During the flood a great crocodile has taken up the canal behind your house. This morning it took a goat, and now the children of the lane play by the water. The Tamari say crocodiles are the Flood Mother's guards and must not be killed while the flood is up.",
        choices: [
          {
            t: "Noose it and bind its snout shut",
            check: {s:"ins",s2:"unarmed",d:50},
            win: {
              r: "You drop the rope from the bank and haul. A crocodile cannot open its jaws against a bound snout. You float it downriver on a reed raft, alive, and the priests bless you.",
              fx: {skill:{husbandry:2,unarmed:2},fame:3,piety:2,epithet:"Croc-Binder"},
            },
            lose: {
              r: "The tail catches you across the legs and knocks you into the canal. You get out. You will not forget how fast it turned.",
              fx: {health:-18,wound:"bite",wil:2,cause:"a great crocodile"},
            },
          },
          {
            t: "Kill it and say nothing",
            r: "You take a spear down to the canal at night.",
            fx: {beast:{id:"CRE-44",place:"the flooded canal",mod:1},piety:-4},
          },
          {
            t: "Fence the canal bank with thorn and keep the children in",
            r: "A week of cutting acacia. The crocodile leaves when the water falls, as the priests said it would.",
            fx: {sta:.4,skill:{craft:1},piety:2},
          },
        ],
      },
      {
        id: "ss_tm_riverhorse",
        title: "The Mother's cattle",
        cond: (p,C)=>C.realm(p,"POL-18")&&C.adult(p)&&!C.old(p),
        w: .8,
        cool: 9,
        text: "You are poling a grain barge downriver when a river horse surfaces beside you, huge and grunting, and opens a mouth like a doorway. The Tamari call them the Flood Mother's cattle. They overturn more boats than storms do.",
        choices: [
          {
            t: "Pole hard for the shallows",
            check: {s:"sea",s2:"str",d:42},
            win: {
              r: "You run the barge onto a sandbank with the beast snorting behind you. The grain is dry. Your heart is not.",
              fx: {skill:{sea:3},str:.3},
            },
            lose: {
              r: "It hits the barge from below. Half the grain goes into the river and you nearly follow it.",
              fx: {coin:-15,health:-8,wil:1,cause:"a river horse"},
            },
          },
          {
            t: "Beat the water with the pole and shout",
            r: "You stand on the gunwale and fight it with a pole.",
            fx: {beast:{id:"CRE-45",place:"the Monuti",mod:.9}},
          },
          {
            t: "Throw it a sack of grain and pray",
            r: "It sniffs the sack, ignores it, and sinks out of sight. You lose a sack and keep a boat. A fair trade with the Mother.",
            fx: {coin:-3,piety:2},
          },
        ],
      },
      {
        id: "ss_tm_debt",
        title: "The lean year",
        cond: (p,C)=>C.realm(p,"POL-18")&&C.adult(p)&&free(p)&&C.poor(p),
        w: 1,
        cool: 10,
        text: "The flood was lean. The flood-priests set the tax at a tenth, but the temple takes its rent on top, and your granary jar is empty by midwinter. The temple steward offers bread for the whole family, against your body: debt-slavery, free again after seven years by flood law.",
        choices: [
          {
            t: "Put your mark on the temple roll",
            r: "Seven years of temple fields. Your family eats. You count the floods, one by one.",
            fx: p=>(p.flags.unfree="debt",p.status="serf",p.flags.ss_tm_debt=A.S.year,A.willGrow(p,2,"debt"),p.happy=A.clamp(p.happy-10,0,100),""),
          },
          {
            t: "Hire out to the Dyke Corps for bread instead",
            check: {s:"sta",s2:"str",d:42},
            win: {
              r: "Mud to the knees from dawn to dark, paid in bread. You stay free, and so do your children.",
              fx: {coin:6,sta:.6,str:.4,wil:1.5},
            },
            lose: {
              r: "You last a month before the fever takes you. The family borrows from a cousin, and the cousin remembers.",
              fx: {health:-14,wil:2,coin:4,cause:"fever on the dykes"},
            },
          },
          {
            t: "Glean the temple fields at night",
            check: {s:"stealth",s2:"survival",d:40},
            win: {
              r: "Fallen ears, dropped sacks, a basket of onions. You get through to the Harvest of the Mother.",
              fx: {coin:4,skill:{stealth:2},wil:1},
            },
            lose: {
              r: "The temple guards catch you with a sack. Grain theft is the common crime of Tamar, and the courts are bored of it.",
              fx: {punish:"theft"},
            },
          },
        ],
      },
      {
        id: "ss_tm_seven",
        title: "Seven floods",
        cond: (p,C)=>C.realm(p,"POL-18")&&C.adult(p)&&p.flags.unfree==="debt",
        w: 1.5,
        cool: 3,
        text: p=>`Another flood comes and goes. Debt-slaves in Tamar go free after seven years by flood law, and you have been counting: ${p.flags.ss_tm_debt?Math.max(1,A.S.year-p.flags.ss_tm_debt)+" floods so far":"more floods than you like"}. This year the steward says a broken hoe and a dead ox have been added to your debt.`,
        choices: [
          {
            t: "Demand your freedom before the flood-priests",
            req: p=>!p.flags.ss_tm_debt||A.S.year-p.flags.ss_tm_debt>=7,
            check: {s:"persuasion",s2:"wil",d:36},
            win: {
              r: 'The priest reads the roll and the date. "Seven floods," he says. "The law is the law." You walk out of the temple gate with nothing but your name.',
              fx: p=>setFree(p,"ss_tm_freed"),
            },
            lose: {r:"The steward produces witnesses for the ox. One more year.",fx:{wil:2,happy:-6}},
          },
          {
            t: "Keep your head down and work",
            r: "Wheat, barley, linen, mud. The ox debt is a lie and everyone knows it, but the river keeps rising and falling and so do you.",
            fx: {str:.4,sta:.4,wil:1.2},
          },
          {
            t: "Run for the Delta and the Lucernan ships",
            check: {s:"stealth",s2:"sea",d:48},
            win: {
              r: "Three nights in the reeds, a bribe to a Marira boatman, and a Lucernan cog that needs hands. You are free, and a long way from home.",
              fx: p=>{const t=setFree(p,"ss_tm_ran");return p.flags.runaway=A.S.year,A.trainSkill(p,"sea",2),t},
            },
            lose: {
              r: "The temple sends men with dogs. You are brought back and branded on the hand.",
              fx: {wound:"brand",wil:2.5,health:-8,cause:"a beating by temple guards"},
            },
          },
        ],
      },
      {
        id: "ss_tm_natron",
        title: "Forty days of natron",
        cond: (p,C)=>C.realm(p,"POL-18")&&C.adult(p),
        w: .8,
        cool: 12,
        text: ()=>`Your ${A.pick(["mother's brother","grandmother","old master"])} has died. The dead sail west on the Night River and need their bodies in the next life. On the Night Bank the Embalmers of the Night River quote you a price: forty days in natron and good linen, or a quick natron bath and a reed mat for the poor.`,
        choices: [
          {
            t: "Pay for the forty days (30 suns)",
            req: p=>p.coin>=30,
            r: "Natron from the Burning Waste, linen wrappings, a painted scroll of the Night River journey. The family will speak of this burial for a generation.",
            fx: {coin:-30,piety:4,honor:3,fame:1},
          },
          {
            t: "The bath and the reed mat (3 suns)",
            r: "It is quick and it is decent. The poor of Tamar sail the Night River on reed mats, and they get there too, the priests say.",
            fx: {coin:-3,piety:1,wil:.5},
          },
          {
            t: "Bargain hard with the embalmer",
            check: {s:"trade",s2:"persuasion",d:42},
            win: {
              r: "You get the forty days for twelve suns and a promise of linen rags after the next harvest. The embalmer grumbles. You suspect where the rags will go.",
              fx: {coin:-12,piety:3,skill:{trade:2}},
            },
            lose: {
              r: "The embalmer names a price, then a higher one. The body waits in the heat while you argue.",
              fx: {coin:-20,happy:-4},
            },
          },
        ],
      },
      {
        id: "ss_tm_hungry",
        title: "The Hungry Year Stone",
        cond: (p,C)=>C.realm(p,"POL-18")&&C.ageAdj(p)>=10,
        w: .8,
        cool: 9,
        text: p=>`New Year's Day. At the Hungry Year Stone by the Stair Precinct gate the temple scribes read aloud the names of the dead of 1088, as they do every year: eighty thousand names, read in shifts until dark. ${C_OLDER(p)?"You remember that year: the bark bread, the silent villages.":"Your parents still will not talk about that year."}`,
        choices: [
          {
            t: "Stand and listen for your family's names",
            r: "When the scribe reaches your village, you hear them: a grandfather, two little cousins. You stand until the end, and the sun goes down.",
            fx: {wil:1.5,piety:3,happy:-2},
          },
          {
            t: "Ask an old scribe what caused the famine",
            check: {s:"int",s2:"learning",d:38},
            win: {
              r: '"Three low floods," he says, very quietly, "and nobody honest enough to say so." He walks off before you can ask what he means.',
              fx: {int:.6,flag:"ss_tm_lowfloods"},
            },
            lose: {r:'"The Mother turned away," he says, the official answer, and goes back to his roll.',fx:{int:.2}},
          },
          {
            t: "Give bread to the beggars at the stone",
            r: "A loaf, then another. In Tamar nobody forgets how hunger tastes.",
            fx: {honor:2,coin:-1,trait:"generous"},
          },
        ],
      },
      {
        id: "ss_tm_mice",
        title: "The Granary Mice",
        cond: (p,C)=>C.realm(p,"POL-18")&&C.adult(p)&&(C.job(p,"labor","scribe","servant")||C.poor(p)),
        w: .9,
        cool: 8,
        text: "A tally-clerk you drink with at the House of the Fair Flood makes you an offer. The Granary Mice, porters and clerks of the royal granaries, skim a few sacks from every dome and sell them at night on the Boatmen's Quay. They need someone with a strong back and a short memory.",
        choices: [
          {
            t: "Carry sacks for the Mice",
            check: {s:"stealth",s2:"str",d:42},
            win: {
              r: "Four nights, forty sacks, eight suns in silver. The domes are fuller on paper than in fact, but they always were.",
              fx: {coin:8,skill:{stealth:2},honor:-3,flag:"ss_tm_mice"},
            },
            lose: {
              r: "The Granary and Wall Watch are waiting on the quay. The clerk gives them your name first.",
              fx: {punish:"theft"},
            },
          },
          {
            t: "Turn him down, and keep your own counsel",
            r: 'He shrugs. "More bread for the rest of us." The next year the royal granaries have less in them than the king believes. That is not your sin.',
            fx: {honor:1},
          },
          {
            t: "Report the clerk to the vizier's constables",
            check: {s:"intrigue",s2:"persuasion",d:44},
            win: {
              r: "The constables pay you in grain and take him in. The Mice lose a clerk. They do not know who talked.",
              fx: {coin:4,favor:3,skill:{intrigue:2}},
            },
            lose: {
              r: "The constable you tell is a Mouse. You find a dead rat on your doorstep next morning.",
              fx: {newRel:{type:"enemy",op:-30},happy:-4},
            },
          },
        ],
      },
      {
        id: "ss_tm_nightbank",
        title: "A spade on the Night Bank",
        cond: (p,C)=>C.realm(p,"POL-18")&&C.adult(p)&&!C.noble(p),
        w: .8,
        cool: 9,
        text: "A man with dry, cracked hands finds you at the beer-house. He knows a tomb on the Night Bank, west of the city: an old scribe's, not a king's, with grave goods nobody has touched in three hundred years. He needs one more pair of hands and a lamp. Tomb robbers are drowned when caught.",
        choices: [
          {
            t: "Dig with him by moonlight",
            check: {s:"stealth",s2:"str",d:48},
            win: {
              r: "A painted box, a bronze mirror, a necklace of blue faience. You split forty suns at a Marira fence. The dead scribe does not complain. You dream of him for a month.",
              fx: {coin:40,honor:-5,piety:-5,skill:{stealth:2}},
            },
            lose: {
              r: "The embalmers' night watch sees your lamp. You run, and he does not. They drown him at dawn. You hear his name for years.",
              fx: {wil:2,happy:-8,piety:-3,newRel:{type:"enemy",op:-15}},
            },
          },
          {
            t: "Refuse and warn the embalmers' watch",
            r: "The watch catches him two nights later with a spade. You do not go to see the drowning.",
            fx: {honor:2,piety:3,wil:.6},
          },
          {
            t: "Refuse and forget his face",
            r: "Some doors are best left sealed. You drink your beer and go home early.",
            fx: {trait:"cautious"},
          },
        ],
      },
      {
        id: "ss_tm_scribe",
        title: "The temple scribe-school",
        cond: (p,C)=>C.realm(p,"POL-18")&&kid(p,C,6,12),
        w: 1.1,
        once: !0,
        text: p=>`Farmers' children in Tamar do not read. But a scribe of the temple has watched you count the flood marks on the canal wall and says you have a scribe's eye. ${C_RICH(p)?"Your family can pay the temple a gift for your place.":"Your family cannot pay. He says the temple might take you anyway, if you prove quick."}`,
        choices: [
          {
            t: "Prove you are quick",
            check: {s:"int",s2:"wil",d:24},
            win: {
              r: "You learn the first forty signs of the Tamari script in a month. You sit with the scribes' sons, who look at your bare feet and then at your work, and stop laughing.",
              fx: {literate:!0,skill:{learning:4},int:.6,flag:"ss_tm_scribe"},
            },
            lose: {
              r: "Too slow. The scribe pats your head and goes back to his own pupils. You can still count to a hundred.",
              fx: {skill:{learning:1},wil:.4},
            },
          },
          {
            t: "Beg your father to pay the gift",
            req: (p,C)=>C_RICH(p),
            r: "A jar of oil, a bolt of linen, and you are a scribe's pupil. The reed pen is lighter than a hoe.",
            fx: {literate:!0,skill:{learning:3},family:-4},
          },
          {
            t: "Stay with the fields and the canals",
            r: "You learn the river instead: its colors, its moods, the smell of a rising flood. That is a kind of reading too.",
            fx: {skill:{survival:2,husbandry:1}},
          },
        ],
      },
      {
        id: "ss_tm_ibis",
        title: "The Ibis Archers",
        cond: (p,C)=>C.realm(p,"POL-18")&&C.adult(p)&&C.male(p)&&!C.old(p)&&!C.noble(p)&&free(p),
        w: 1,
        cool: 7,
        text: "March, when the levy is raised: never in flood or harvest, only from March to July. The Reed School of Marira sends a man to the village looking for boys who can shoot. The Ibis Archers fight from reed beds and boats, and Hapu the Reed trains them himself.",
        choices: [
          {
            t: "Shoot for him at fifty paces from a rocking boat",
            check: {s:"bow",s2:"sea",d:44},
            win: {
              r: "Three arrows into a bundle of reeds while the boat bobs under you. He gives you a bow of horn and a place at the Reed School.",
              fx: {skill:{bow:4,sea:1},gear:{ranged:"compbow"},flag:"ss_tm_ibis"},
            },
            lose: {
              r: "You fall in. The village laughs for a season. You go to the spear levy instead.",
              fx: {skill:{bow:1,spear:2}},
            },
          },
          {
            t: "Go to the spear levy like your father",
            r: "Spear drill on the dykes until July. You learn to hold a line and to curse in three nomes' accents.",
            fx: {skill:{spear:3,shield:1},sta:.4},
          },
          {
            t: "Hide in the reeds until the levy-men leave",
            check: {s:"stealth",s2:"survival",d:38},
            win: {
              r: "Mosquitoes, mud and silence for three days. The levy-men count you as sick.",
              fx: {skill:{stealth:2},honor:-2},
            },
            lose: {
              r: "The levy-men know every reed bed. They know this one. You go to the spear levy, last in line.",
              fx: {skill:{spear:2},honor:-2},
            },
          },
        ],
      },
      {
        id: "ss_tm_whisper",
        title: '"Three low floods"',
        cond: (p,C)=>C.realm(p,"POL-18")&&C.adult(p),
        w: .9,
        cool: 8,
        text: `October, when the flood-priests read the mark on the Flood Stairs and set the grain tax. At the beer-house your neighbor, drunk, says it aloud: "Three low floods, no king." A flood-priest's clerk is sitting two tables away, and has stopped drinking.`,
        choices: [
          {
            t: "Laugh loudly and say he means the beer",
            check: {s:"deception",s2:"persuasion",d:40},
            win: {
              r: '"Three low cups, no king of the beer-house!" The room laughs. The clerk goes back to his drink. Your neighbor owes you more than he knows.',
              fx: {skill:{deception:2},newRel:{type:"friend",op:25}},
            },
            lose: {
              r: "The clerk writes something down. Your neighbor is taken in the morning for questioning, and comes back quieter.",
              fx: {happy:-4,wil:.5},
            },
          },
          {
            t: "Walk him home before he says more",
            r: "He sings all the way, but nothing that hangs a man. You put him to bed and tell his wife.",
            fx: {honor:1,rel:{who:"friend",op:4}},
          },
          {
            t: "Ask him, quietly, what he knows about the mark",
            check: {s:"intrigue",s2:"ins",d:46},
            win: {
              r: '"My cousin was a mason," he whispers. "In 1089 they plastered the Stairs at night." Then he is asleep on the table.',
              fx: {flag:"ss_tm_lowfloods",skill:{intrigue:2},int:.4},
            },
            lose: {r:"He sobers up enough to be frightened, and leaves.",fx:{}},
          },
        ],
      },
      {
        id: "ss_tm_wifefield",
        title: "Her own field",
        cond: (p,C)=>C.realm(p,"POL-18")&&C.adult(p)&&C.female(p)&&free(p),
        w: .8,
        cool: 10,
        text: `In Tamar a wife keeps her own field, and it stays hers if the marriage ends. Your husband's family wants to sell your strip by the canal to a Lucernan grain factor who is buying up next year's wheat. "It is for the family," they say. It is your field.`,
        choices: [
          {
            t: "Refuse, and say so often",
            r: "You say it in the market, at the well, at dinner. The field stays yours. So does the argument.",
            fx: {trait:"stubborn",honor:2,wil:.8},
          },
          {
            t: "Sell it yourself to the factor, at your price",
            check: {s:"trade",s2:"persuasion",d:42},
            win: {
              r: "The Lucernan pays in silver kites by weight, and pays well. The money is yours too, by the same law.",
              fx: {coin:70,skill:{trade:3}},
            },
            lose: {r:"He has bought every field on the canal already and pays you what he likes.",fx:{coin:30}},
          },
          {
            t: "Take it to the nome lord's court",
            check: {s:"learning",s2:"persuasion",d:38},
            win: {
              r: "The court confirms your right in writing. A scribe reads it out at the well, and the family stops asking.",
              fx: {honor:3,skill:{persuasion:2}},
            },
            lose: {
              r: "The nome lord's court is slow. Two harvests later you still have the field and a pile of papyrus.",
              fx: {coin:-5,wil:1},
            },
          },
        ],
      },
      {
        id: "ss_tm_merman",
        title: "The merman of the Delta",
        cond: (p,C)=>C.realm(p,"POL-18")&&C.ageAdj(p)>=9,
        w: .7,
        cool: 12,
        text: `On the Boatmen's Quay a showman has a tent and a crowd. Inside, for one copper ring, a "merman of the Delta": half man, half fish, dried and grinning in a glass box. Sailors swear the delta holds a race of fish-men.`,
        choices: [
          {
            t: "Pay a ring and look closely",
            check: {s:"int",s2:"ins",d:30},
            win: {
              r: "You see the stitches. The top half is a monkey, the bottom half a big perch, sewn together and dried in natron. You laugh out loud and the showman glares.",
              fx: {int:.5,happy:3},
            },
            lose: {
              r: "In the lamplight it looks horribly real. You do not swim in the canal for a month.",
              fx: {happy:-1,piety:1},
            },
          },
          {
            t: "Tell the crowd it is a fake",
            check: {s:"persuasion",s2:"int",d:38},
            win: {
              r: "You point out the stitches. The crowd demands its rings back. The showman packs his tent that night.",
              fx: {fame:1,skill:{persuasion:2},newRel:{type:"enemy",op:-15}},
            },
            lose: {
              r: "Nobody wants to hear it. The showman's big friend walks you out.",
              fx: {health:-3,cause:"a showman's friend"},
            },
          },
          {
            t: "Offer to go into business with him",
            check: {s:"trade",s2:"deception",d:40},
            win: {
              r: "You take the merman upriver to Talim, where nobody has seen it. Twelve suns in copper rings.",
              fx: {coin:12,skill:{trade:2,deception:1},honor:-1},
            },
            lose: {r:"Upriver they have already seen a better merman.",fx:{coin:-2}},
          },
        ],
      },
      {
        id: "ss_tm_faruq",
        title: "The preacher on the Stairs",
        cond: (p,C)=>early()&&C.realm(p,"POL-18")&&C.adult(p)&&!C.old(p),
        w: .9,
        once: !0,
        text: "Before the Harvest of the Mother, a Delta preacher called Faruq the Lamp is drawing crowds near the Flood Stairs, hinting that the flood marks lie. He offers you two silver kites to stand beside him with a stick while he preaches. A temple guard has already offered someone else money to see that he falls in the river.",
        choices: [
          {
            t: "Guard Faruq",
            check: {s:"melee",s2:"ins",d:46},
            win: {
              r: "When the push comes, you are ready. The man who meant to shove him into the Monuti goes in himself. Faruq preaches on, and you are paid.",
              fx: {coin:13,skill:{melee:2},fame:1,favor:-3,flag:"ss_tm_faruq"},
            },
            lose: {
              r: "Three men come at once. You both end up in the river. Faruq swims better than you.",
              fx: {health:-10,wil:1,coin:6,cause:"a riverside brawl"},
            },
          },
          {
            t: "Refuse. The flood-priests are not men to cross",
            r: "You watch from a distance. He is still preaching when you leave. Whether he is still breathing the next week, you do not ask.",
            fx: {trait:"cautious"},
          },
          {
            t: "Tell the temple who hired guards",
            check: {s:"intrigue",s2:"persuasion",d:42},
            win: {
              r: "A priest's clerk gives you grain and a smile with no warmth in it. You feel that you have joined something.",
              fx: {coin:5,favor:3,honor:-2,skill:{intrigue:2}},
            },
            lose: {r:"The temple already knew. They wonder why you are trading in what they know.",fx:{favor:-2}},
          },
        ],
      },
      {
        id: "ss_sc_saddle",
        title: "The saddle outside the tent",
        cond: (p,C)=>C.realm(p,"POL-19")&&C.adult(p)&&C.married(p),
        w: .8,
        cool: 12,
        text: p=>SEX(p,"You come back from a long guiding job to find your saddle sitting outside the tent in the sand. Among the Sand Clans a wife divorces her husband by putting his saddle outside, and the tent, the herds and the water shares are hers. {spouse} is inside, and not coming out.","Your husband {spouse} has come home from the salt road with a Zanari woman's bracelet in his pack, and a story about it that does not fit together. The tent is yours, and the water shares, and the herd. His saddle is right there by the door."),
        choices: [
          {
            t: p=>SEX(p,"Sit by the saddle and plead until dawn","Put his saddle outside"),
            r: p=>SEX(p,'You sit there all night reciting her favorite poem, the whole of "The Thirst of Mirah", twice. At dawn she brings the saddle back in, sighing.',"You set it outside in the sand, gently. The whole camp knows by noon. He rides off to his mother's clan. The tent is quiet and yours."),
            fx: p=>{if(p.sex==="F")return divorce(p),A.willGrow(p,1,"divorce"),p.honor=A.clamp(p.honor+2,0,100),"";A.trainSkill(p,"music",2),A.willGrow(p,1,"humbled");const sp=A.P(p.spouse);return sp&&A.addOp(p,sp,15),""},
          },
          {
            t: p=>SEX(p,"Pick up your saddle and ride away","Give him a chance to explain"),
            check: {s:"persuasion",s2:"wil",d:40},
            win: {
              r: p=>SEX(p,"You ride to your brother's camp with your head high. She sends word in a month: come back and talk. You do.","His story makes sense once he stops lying: it was payment for guiding a Zanari merchant's wife. You keep the bracelet."),
              fx: {wil:1,happy:2},
            },
            lose: {
              r: p=>SEX(p,"You ride off. Nobody asks you back. The clan gossips for a season.","The second story is worse than the first. The saddle goes outside after all."),
              fx: {wil:1.5,happy:-6},
            },
          },
          {
            t: "Ask the clan-mother to settle it",
            r: "The old woman listens to both of you, says something sharp to each, and sends you to water the camels together. It works, mostly.",
            fx: {honor:1,happy:1},
          },
        ],
      },
      {
        id: "ss_sc_stars",
        title: "Stars and wells",
        cond: (p,C)=>C.realm(p,"POL-19")&&kid(p,C,6,13),
        w: 1.2,
        once: !0,
        text: 'Sandfolk children learn three things by heart: the wells, the stars and their genealogy. Tonight your grandmother lies beside you on a dune and points: that star over the Well of Samar, that one over Mirah. "A Rider counts stars," she says. "A Well counts coins."',
        choices: [
          {
            t: "Learn the stars until you can find the Well blindfold",
            check: {s:"int",s2:"wil",d:22},
            win: {
              r: "By the end of winter you can name forty stars and the well under each. The guides start talking to you as if you were a person.",
              fx: {skill:{survival:4},int:.5},
            },
            lose: {
              r: "You fall asleep counting. She covers you with her shawl and keeps counting for you.",
              fx: {skill:{survival:1}},
            },
          },
          {
            t: "Recite your genealogy back to Hazir the Rider",
            check: {s:"int",s2:"music",d:22},
            win: {
              r: "Twenty-two names, father to father, back to the companion of the Rider. Your grandmother kisses your forehead.",
              fx: {skill:{learning:3},piety:2},
            },
            lose: {
              r: "You put your great-grandfather in the wrong century. She laughs till she coughs.",
              fx: {skill:{learning:1}},
            },
          },
          {
            t: "Ask why the town folk count coins",
            r: '"Because they forgot," she says. "They let a Well-Keeper tell them what water means. We remember." You do not understand. You will.',
            fx: {piety:2,trait:"proud"},
          },
        ],
      },
      {
        id: "ss_sc_shortcut",
        title: "Sworn by water",
        cond: (p,C)=>C.realm(p,"POL-19")&&C.adult(p)&&free(p),
        w: 1,
        cool: 7,
        text: ()=>`You are guiding a ${A.pick(["Qadiri date merchant","Zanari gold buyer","Tamari natron caravan"])} across the Red Waste, sworn to the caravan by water as the Brotherhood of Guides demands. The master wants to cut three days by the old route past the Dry Wells. Three wells on the Salt Road failed last summer, and nobody has checked that route since.`,
        choices: [
          {
            t: "Take the short route, carefully",
            check: {s:"survival",s2:"tracking",d:48},
            win: {
              r: "One well is dead, but you find water under the second by the color of the sand. Three days saved, and a bonus in gold.",
              fx: {coin:25,skill:{survival:3},fame:2},
            },
            lose: {
              r: "Both wells are dry. You turn back on the third day and lose two camels and nearly a man. The master pays you nothing and curses your clan.",
              fx: {health:-12,wil:2,honor:-2,cause:"thirst in the Red Waste"},
            },
          },
          {
            t: "Refuse: your oath is to their lives, not their profit",
            check: {s:"persuasion",s2:"wil",d:40},
            win: {
              r: "The master grumbles, then agrees. The long way is long, but every man and camel arrives.",
              fx: {honor:3,coin:12,skill:{persuasion:1}},
            },
            lose: {
              r: "He hires another guide at the next oasis and goes the short way. You never hear of that caravan again.",
              fx: {coin:6,wil:1},
            },
          },
          {
            t: "Send to Khalid the Star for word on the old wells",
            r: "A rider comes back in two days: the second well lives. The master pays for the news. Old Khalid's word is better than gold.",
            fx: {coin:15,skill:{survival:1},newRel:{type:"mentor",op:15}},
          },
        ],
      },
      {
        id: "ss_sc_noon",
        title: "The Noon Lances",
        cond: (p,C)=>C.realm(p,"POL-19")&&C.adult(p)&&!C.old(p)&&(C.soldier(p)||C.male(p))&&free(p),
        w: .9,
        cool: 7,
        text: p=>`The Noon Lances of Bahar charge at noon with the sun behind them. Clan Bahar's riders are sand-eyed: their eyes are not dazzled in the glare, while the enemy's are. ${A.C.blood(p,"sandeye")?"You have the gift. You squint less than anyone in the camp.":"You are not of their blood, but their captain is short of riders this season."}`,
        choices: [
          {
            t: "Ride the noon drill with them",
            check: {s:"mounted",s2:"riding",d:46},
            win: {
              r: "At full gallop on a camel, lance level, white sun on your back. The captain says you ride like a Bahar. That is the best thing he says to anyone.",
              fx: {skill:{mounted:3,lance:2,riding:1},merit:2,fame:1},
            },
            lose: {
              r: "The glare blinds you on the turn and your camel throws you. Sand in your mouth for a week.",
              fx: {health:-8,skill:{riding:1},cause:"a fall from a camel"},
            },
          },
          {
            t: "Train your eyes in the glare, like a Bahar boy",
            check: {s:"wil",s2:"sta",d:44},
            win: {
              r: "Every noon for a month you stare at the white dunes until your eyes stream. Then one day they stop streaming.",
              fx: {wil:1.5,skill:{survival:2}},
            },
            lose: {
              r: "You give yourself sun blindness for three days. The Bahar boys find it very funny.",
              fx: {health:-5,happy:-3,cause:"sun blindness"},
            },
          },
          {
            t: "Ask about their weakness on moonless nights",
            r: 'The captain goes quiet. "Sand-eyes are almost blind in the dark," he says at last. "Which is why we never fight at night. And why you will never repeat this."',
            fx: {int:.5,skill:{tactics:1}},
          },
        ],
      },
      {
        id: "ss_sc_petmarket",
        title: "A baby dragon",
        cond: (p,C)=>C.realm(p,"POL-19")&&C.ageAdj(p)>=8&&!C.old(p),
        w: .9,
        cool: 9,
        text: "At the Pet Market in Zarak, rich children's parents pay good gold for sand dragons, which children believe are baby dragons. They are big hissing lizards with whip tails, and their teeth are very real. A dealer says he will pay five suns for every live one brought in from the rocky margins.",
        choices: [
          {
            t: "Catch one with a noose and a sack",
            check: {s:"husbandry",s2:"spd",d:38},
            win: {
              r: "It hisses, whips and bites the sack, but it is yours. The dealer pays five suns and sells it for thirty to a Zanari merchant's son.",
              fx: {coin:5,skill:{husbandry:2,tracking:1}},
            },
            lose: {
              r: "The tail catches you across the face like a whip.",
              fx: {health:-6,wound:"scar_face",cause:"a sand dragon's tail"},
            },
          },
          {
            t: "Fight the big one sunning on the rocks",
            req: (p,C)=>C.adult(p)||C.teen(p),
            r: "You go for the biggest one, with a stick.",
            fx: {beast:{id:"CRE-43",place:"the rocky margin of the Waste",mod:.8}},
          },
          {
            t: "Tell the children what it really is",
            r: "They do not believe you. One of them tells you that you are just jealous. You are, a little.",
            fx: {int:.3,happy:1},
          },
        ],
      },
      {
        id: "ss_sc_boots",
        title: "Shake out your boots",
        cond: (p,C)=>C.realm(p,"POL-19")&&C.ageAdj(p)>=8,
        w: .8,
        cool: 10,
        text: "Dawn in the camp. Every Sandfolk child is taught to shake out boots and bedding before touching them: deathstalkers, the yellow scorpions of the Waste, hide in anything warm. Caravan men swear they grow as big as horses in the deep desert. You are tired and the caravan is already moving.",
        choices: [
          {
            t: "Shake them out properly, as you were taught",
            r: "A yellow scorpion the length of your finger drops into the sand and scuttles off. You put your boots on and say a thanks to the Giver.",
            fx: {piety:1,skill:{survival:1}},
          },
          {
            t: "Pull them on in a hurry",
            check: {s:"sta",s2:"wil",d:36},
            win: {r:"Nothing in them this time. The old guide sees what you did and shakes his head.",fx:{happy:1}},
            lose: {
              r: "Fire runs up your foot. Its venom is rarely fatal to the healthy, which is not the same as painless. You ride a day and a night with a leg like a log.",
              fx: {health:-14,wil:1.5,cause:"a deathstalker's sting"},
            },
          },
          {
            t: "Catch the scorpion for a Zarak physician",
            check: {s:"husbandry",s2:"ins",d:40},
            win: {
              r: "You trap it in a cup. A physician pays a sun for venom to test his remedies on.",
              fx: {coin:1,skill:{husbandry:1,medicine:1}},
            },
            lose: {r:"It stings you through the cup handle. Somehow.",fx:{health:-10,cause:"a deathstalker's sting"}},
          },
        ],
      },
      {
        id: "ss_sc_unicorn",
        title: "The Sand Clans' unicorns",
        cond: (p,C)=>C.realm(p,"POL-19")&&C.adult(p),
        w: .8,
        cool: 10,
        text: `A herd of white oryx crosses the dunes at dusk. Seen from the side, the two long horns line up as one: the Sand Clans' unicorns. In the camp a Zanari gold buyer is offering a fortune for a single "unicorn horn", because southern courts believe a horn cup sweats near poison.`,
        choices: [
          {
            t: "Hunt an oryx and sell him one horn",
            check: {s:"bow",s2:"tracking",d:46},
            win: {
              r: "One horn, polished and mounted on silver. He pays forty suns in gold dust. Somewhere a king will drink from it and feel safe.",
              fx: {coin:40,skill:{bow:2,tracking:2},honor:-2},
            },
            lose: {r:"The herd runs before you are in range. They always do.",fx:{skill:{tracking:1}}},
          },
          {
            t: "Tell him the truth about the horns",
            r: 'He laughs at you. "Then I shall tell the truth to nobody," he says, and buys one from your cousin the next day.',
            fx: {honor:2,int:.3},
          },
          {
            t: "Just watch them go, white against the red sand",
            r: "Some things should not be sold. The herd goes over the ridge, and the stars come out.",
            fx: {happy:3,piety:2},
          },
        ],
      },
      {
        id: "ss_sc_lastwell",
        title: "The Preachers of the Last Well",
        cond: (p,C)=>C.realm(p,"POL-19")&&C.adult(p),
        w: .9,
        cool: 8,
        text: 'Three wells on the Salt Road failed last summer. Now ragged preachers are walking the camps, quoting the old prophecy: "The Well-Finder will return when the last well runs dry." One of them is in your camp tonight, telling the young men to stop digging and wait for the Finder.',
        choices: [
          {
            t: "Listen to the preacher",
            check: {s:"faith",s2:"wil",d:38},
            win: {
              r: "He is half mad and half wise. You leave with a prayer and a firm belief that the Finder helps those who dig.",
              fx: {piety:4,skill:{faith:2}},
            },
            lose: {
              r: "His words get under your skin. For a month you see dry wells in your sleep.",
              fx: {piety:3,happy:-3},
            },
          },
          {
            t: "Go and dig out the dead well yourself",
            check: {s:"craft",s2:"str",d:46},
            win: {
              r: "Four meters down, wet sand. Eight down, water. Prophecy can wait another year. The clan gives you a new name: the Well-Finder, half as a joke.",
              fx: {skill:{craft:3,survival:2},str:.5,fame:3,epithet:"the Well-Finder"},
            },
            lose: {
              r: "Ten meters of dry sand, and a collapse that nearly buries you.",
              fx: {health:-12,wil:1.5,cause:"a well collapse"},
            },
          },
          {
            t: "Throw him out of the camp",
            check: {s:"intimidation",s2:"str",d:36},
            win: {
              r: "He goes, cursing your clan to thirst. The old men are relieved. The young men are angry with you.",
              fx: {honor:1,skill:{intimidation:2}},
            },
            lose: {r:"The young men stand with him. You are the one who walks out.",fx:{honor:-2,happy:-3}},
          },
        ],
      },
      {
        id: "ss_sc_register",
        title: "The Well-Mother's register",
        cond: (p,C)=>C.realm(p,"POL-19")&&C.adult(p)&&free(p),
        w: 1,
        cool: 7,
        text: "At Zarak the Well-Mother keeps the knotted register of which clan may water at which well, and when. Your clan's day at the Halai well has been given to Clan Sayf, and your camels are bellowing for water. Blood feud is lawful among the clans, but never within sight of a well.",
        choices: [
          {
            t: "Ride to Zarak and argue before Salma Bahar",
            check: {s:"diplomacy",s2:"learning",d:44},
            win: {
              r: "You recite the knots of your clan's right back three generations. The Well-Mother checks her cords and gives you your day back, and a second one for the trouble.",
              fx: {honor:3,skill:{diplomacy:3},fame:1},
            },
            lose: {
              r: "Salma listens, then shows you the knot. It is real. Your clan gave the day away in a bad year, and someone forgot to tell you.",
              fx: {int:.3,wil:.8},
            },
          },
          {
            t: "Water at night, quietly",
            check: {s:"stealth",s2:"husbandry",d:42},
            win: {
              r: "Forty camels, no moon, not a sound. Clan Sayf finds the trough wet in the morning and shrugs.",
              fx: {skill:{stealth:2,husbandry:1},honor:-1},
            },
            lose: {
              r: "Sayf riders are camped in the dunes. There is shouting, and blades out, and everyone stops at once, because the well is right there.",
              fx: {honor:-3,newRel:{type:"enemy",op:-25},wil:1},
            },
          },
          {
            t: "Trade Clan Sayf a camel for a day",
            check: {s:"trade",s2:"diplomacy",d:36},
            win: {
              r: "One old camel for one day of water. Everyone drinks, and nobody draws a blade.",
              fx: {coin:-10,skill:{trade:2},honor:1},
            },
            lose: {r:"They want three camels. You pay two and owe one.",fx:{coin:-25}},
          },
        ],
      },
      {
        id: "ss_sc_saltcut",
        title: "Short weight",
        cond: (p,C)=>C.realm(p,"POL-19")&&C.adult(p)&&!C.noble(p),
        w: .9,
        cool: 8,
        text: "At the salt pans you cut rock salt into slabs of 25 kilograms, six suns each here and twelve at Zanara's markets. One of the fee clerks has a scheme: slabs that go out short-weight past the tally, and the difference split between the cutters and the clerks. Nasr the Cutter would break any man he caught at it.",
        choices: [
          {
            t: "Cut honest slabs",
            r: "Your slabs are full weight, and the Zanari buyers learn to ask for your mark. Slow money, clean hands.",
            fx: {str:.4,honor:2,coin:4},
          },
          {
            t: "Join the clerk's scheme",
            check: {s:"craft",s2:"deception",d:42},
            win: {
              r: "A finger's width off every slab, and a fat purse by Well Day.",
              fx: {coin:25,honor:-3,skill:{deception:2}},
            },
            lose: {
              r: "Nasr weighs one of your slabs himself. He does not shout. He simply takes your saw and points at the desert.",
              fx: {coin:-5,honor:-5,happy:-5},
            },
          },
          {
            t: "Steal the clerk's tally and take it to the Speaker",
            check: {s:"stealth",s2:"intrigue",d:46},
            win: {
              r: "The tally reaches the Bahar tents. The clerk is gone the next day, and Hamza Bahar the Salt-Master remembers your name.",
              fx: {favor:4,coin:10,skill:{intrigue:2}},
            },
            lose: {
              r: "The clerk catches you in his tent. Now he has a story about you, and a friend among the clerks to tell it.",
              fx: {honor:-3,newRel:{type:"enemy",op:-25}},
            },
          },
        ],
      },
      {
        id: "ss_sc_poetry",
        title: "The poetry night",
        cond: (p,C)=>C.realm(p,"POL-19")&&grown(p,C),
        w: 1,
        cool: 5,
        text: ()=>`A wedding between two clans, and after the goat comes the poetry, which among the Sand Clans matters more than the goat. A poet of the ${A.pick(["Sayf","Yasiri","Hazari","Marad"])} has just mocked your clan in sixteen beautiful lines. Everybody is looking at you.`,
        choices: [
          {
            t: "Answer him in verse, on the spot",
            check: {s:"music",s2:"int",d:44},
            win: {
              r: "Your answer rhymes his camel with his mother-in-law. The tent roars. Your lines are recited in every camp by the Dry Month.",
              fx: {skill:{music:3},fame:3,happy:4},
            },
            lose: {r:"You lose the rhyme in the third line and everyone hears it die.",fx:{happy:-4,fame:-1,wil:.6}},
          },
          {
            t: 'Recite "The Thirst of Mirah" instead',
            check: {s:"learning",s2:"wil",d:34},
            win: {
              r: "Hazir the Blind's great poem, all of it. Nobody can mock a clan after that, not for a night.",
              fx: {skill:{learning:2,music:1},honor:2},
            },
            lose: {r:"You forget the middle. An old woman finishes it for you, kindly, which is worse.",fx:{happy:-2}},
          },
          {
            t: "Laugh, and praise his lines",
            r: "Generous in the face of mockery is its own poem. The bride's family nods. The poet buys you tea.",
            fx: {honor:2,newRel:{type:"friend",op:15}},
          },
        ],
      },
      {
        id: "ss_sc_burial",
        title: "A cup on the sand",
        cond: (p,C)=>C.realm(p,"POL-19")&&C.ageAdj(p)>=10,
        w: .7,
        cool: 12,
        text: ()=>`${A.pick(["Your grandfather","Your uncle, the guide","An old woman of your tent who sang to you as a child"])} dies in the night. Among the Sand Clans the dead are buried in the sand the same day, unmarked, and a cup of water is poured on the grave. By tomorrow the wind will have smoothed the place away.`,
        choices: [
          {
            t: "Pour the cup yourself",
            r: "The water darkens the sand and is gone in a breath. That is how it should be. You walk back to the tents without looking round.",
            fx: {wil:1.5,piety:3},
          },
          {
            t: "Mark the place secretly with a stone you will know",
            r: "A small black stone, set just so. Not a grave marker, only a memory. You come back to it for years.",
            fx: {wil:1,happy:1,trait:"romantic"},
          },
          {
            t: "Recite the genealogy over the grave",
            check: {s:"learning",s2:"int",d:30},
            win: {
              r: "Every name back to the Rider, and the new one added last. The old men weep.",
              fx: {piety:3,honor:2,skill:{learning:1}},
            },
            lose: {
              r: "You falter, and another voice takes it up. The names are said. That is what matters.",
              fx: {piety:2,wil:1},
            },
          },
        ],
      },
      {
        id: "ss_sc_blackveil",
        title: "Ashes on the tents",
        cond: (p,C)=>early()&&C.realm(p,"POL-19")&&C.adult(p)&&!C.old(p),
        w: .9,
        once: !0,
        text: "A caravan comes into camp with ashes still on its tents. The Zanari are cutting a gold road east, and someone is burning the new road's well-camps. The guide names the outlaw Zayd Blackveil, of Harith Sayf's own line. The next night a veiled rider finds you at the fire and offers gold to ride with Zayd.",
        choices: [
          {
            t: "Ride with Zayd and burn the road",
            check: {s:"stealth",s2:"riding",d:46},
            win: {
              r: "One night raid, one well-camp in flames, no one killed. Harith Sayf's gold is heavy and real. If the gold goes east, your clan starves. That is what you tell yourself.",
              fx: {coin:40,honor:-3,skill:{stealth:2,riding:1},flag:"ss_sc_blackveil"},
            },
            lose: {
              r: "Zanari runners are waiting. You flee with an arrow in your shoulder and nothing to show for it.",
              fx: {health:-16,wound:"arrow_wound",wil:1.5,cause:"a Zanari arrow"},
            },
          },
          {
            t: "Refuse. Fire near wells is a fool's war",
            r: "He rides off into the dark. Fouling water is the one crime nobody forgives, and burning a well-camp is too close to it for you.",
            fx: {honor:2,piety:2},
          },
          {
            t: "Carry word to the Speaker's tents",
            check: {s:"intrigue",s2:"riding",d:44},
            win: {
              r: "Tariq Bahar wants the Salt Road open and the treaty kept. He thanks you in person. Harith Sayf, they say, asked who rode to Zarak that night.",
              fx: {favor:5,fame:1,newRel:{type:"enemy",op:-20}},
            },
            lose: {
              r: "By the time you get there, the Speaker already knows. Everyone knows. You have only made yourself known.",
              fx: {newRel:{type:"enemy",op:-15}},
            },
          },
        ],
      },
      {
        id: "ss_sc_marad",
        title: "The Marad children",
        cond: (p,C)=>C.realm(p,"POL-19")&&C.adult(p)&&!C.old(p)&&free(p),
        w: .9,
        once: !0,
        text: "In the western camps by Sabra's border, children have been going missing: about thirty of Clan Marad's young ones over two years. A Sandfolk may never be enslaved; that is the oldest law of the clans. Now a Marad mother says she saw her son on a Sabran pearling boat at Azara, weighted with stones.",
        choices: [
          {
            t: "Ride to Azara and find the boy",
            check: {s:"tracking",s2:"stealth",d:50},
            win: {
              r: "You find him in the pens behind the Pearl Quay, thin and burned by salt. You cut the rope at night and ride hard for the desert with him on your saddle. His mother's cry when she sees him is the best sound you have ever heard.",
              fx: {
                honor: 8,
                fame: 4,
                skill: {tracking:2,stealth:2},
                deed: "Brought a Marad child home from the Sabran pearl pens",
                flag: "ss_sc_marad",
              },
            },
            lose: {
              r: "The Sabran pens are guarded by House Zarani's slave-riders. You escape with your life and nothing else.",
              fx: {health:-20,wil:2,wound:"scar_chest",cause:"Sabran slave-riders"},
            },
          },
          {
            t: "Carry the mother's word to the Well-Mother at Zarak",
            r: 'Salma Bahar listens and goes white with anger. "A blood feud is one proof away," she says. "Bring me the proof." The clans begin to stir.',
            fx: {honor:3,favor:2},
          },
          {
            t: "Stay out of it. Sabra buys our camels",
            r: "You keep your head down. The mother walks from camp to camp asking. You avoid her eyes.",
            fx: {honor:-3,happy:-3},
          },
        ],
      },
      {
        id: "ss_sc_escort",
        title: "The pilgrim road",
        cond: (p,C)=>C.realm(p,"POL-19")&&C.adult(p)&&!C.old(p)&&free(p),
        w: .9,
        cool: 6,
        text: "Before Well Day you ride with the escort on the pilgrim road to the Well of Samar. Under the Well Truce any believer may walk unarmed to the Well, and the clans guard the road. One pilgrim walks strangely stiff, and you are fairly sure there is a blade under his robe.",
        choices: [
          {
            t: "Search him, politely and firmly",
            check: {s:"ins",s2:"intimidation",d:40},
            win: {
              r: "A long Qadiri knife strapped to his back. He says it is for bread. The Riders of the Well take it and him, and thank you.",
              fx: {honor:3,favor:2,skill:{intimidation:2}},
            },
            lose: {
              r: "He draws before you finish asking.",
              fx: {
                duel: {
                  tier: 2,
                  title: "an armed pilgrim",
                  troop: "LI",
                  opts: {kind:"duel",place:"the pilgrim road",lethal:!1,toYield:!0,title:"On the pilgrim road"},
                },
              },
            },
          },
          {
            t: "Ride beside him and watch, all the way to the Well",
            check: {s:"ins",s2:"sta",d:38},
            win: {
              r: "Nine days of watching. At the Well he kneels, weeps, and leaves the knife at the gate. Some men carry their sin a long way.",
              fx: {piety:3,wil:1},
            },
            lose: {
              r: "You lose him in the crowd at the last cistern. Nothing happens. You never learn why.",
              fx: {wil:.5},
            },
          },
          {t:"Tell yourself the robe is just badly sewn",r:"Nothing happens. It probably was the robe.",fx:{}},
        ],
      },
      {
        id: "ss_sc_smith",
        title: "The smith's daughter",
        cond: (p,C)=>C.realm(p,"POL-19")&&C.adult(p)&&!C.married(p)&&!C.old(p),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{ctx.n=loc(p,p.sex==="F"?"M":"F")},
        text: p=>`{n} works the bellows at the camp forge, of the bonded smith clans who mend the herders' blades and may not marry herders. You have been finding reasons to have your ${SEX(p,"spear","knife")} sharpened every week, and {n} has noticed.`,
        choices: [
          {
            t: "Ask the clan elders for an exception",
            check: {s:"diplomacy",s2:"persuasion",d:50},
            win: {
              r: "It takes a winter, three camels and a very old poem about Hazir's smith. The elders give in. You marry by the forge fire.",
              fx: {lover:!0,honor:-1,happy:8,skill:{diplomacy:2}},
            },
            lose: {
              r: "The elders say no, kindly. The smiths say no, less kindly. {n} is sent to another camp.",
              fx: {happy:-8,wil:1.5},
            },
          },
          {
            t: "Meet in secret, and let the stars keep it",
            r: "Long nights behind the camel lines. Nobody says anything, which in a camp means everybody knows.",
            fx: {lover:!0,honor:-2},
          },
          {
            t: "Let it go. The law is older than you",
            r: "You stop going to the forge. Your spear gets dull.",
            fx: {wil:1,happy:-3},
          },
        ],
      },
    ]);
    A.defEvents([
      {
        id: "ss_zn_dust",
        title: "Dust on your head",
        cond: (p,C)=>C.realm(p,"POL-20")&&C.adult(p)&&(C.noble(p)||p.status==="gentry"||C.famKind(p,"noble","royal","gentry","merchant")),
        w: 1,
        cool: 8,
        text: "You are presented at the emperor's court on the Ancestor Hill. Mosi III sits on a stool of gold on a mat, because nobody may see the emperor's feet touch bare earth. When he speaks to a courtier, the courtier pours dust on his own head. He is about to speak to you, and your bowl of dust is in your hand.",
        choices: [
          {
            t: "Pour the dust and answer humbly",
            check: {s:"etiquette",s2:"wil",d:40},
            win: {
              r: "Dust in your hair, in your eyes, in your mouth, and a perfect answer. The Master of the Scales looks at you with interest.",
              fx: {skill:{etiquette:3},favor:5,fame:1},
            },
            lose: {
              r: "You sneeze in the middle of your answer. Somebody behind you laughs, and is struck for it. You are not invited back soon.",
              fx: {favor:-2,happy:-4},
            },
          },
          {
            t: "Watch his left hand while he talks",
            check: {s:"ins",s2:"int",d:44},
            win: {
              r: "It lies in his lap and never moves. The rumors are true: the emperor's left hand has gone numb. Kanemba emperors die young of strokes, and you know something about this one.",
              fx: {int:.5,flag:"ss_zn_hand",skill:{intrigue:2}},
            },
            lose: {r:"You stare a moment too long. A Runner Guard steps between you and the stool.",fx:{favor:-3}},
          },
          {
            t: "Praise his line with the praise-singers' words",
            check: {s:"music",s2:"etiquette",d:42},
            win: {
              r: '"Who is the wind? Mosi is the wind." The court answers you. The emperor smiles behind his hand.',
              fx: {favor:6,fame:2,skill:{music:2}},
            },
            lose: {
              r: "You put the wrong Mosi in the wrong verse. A Rememberer winces like a man struck.",
              fx: {favor:-3,honor:-1},
            },
          },
        ],
      },
      {
        id: "ss_zn_salt",
        title: "A sun a kilo",
        cond: (p,C)=>C.realm(p,"POL-20")&&C.adult(p),
        w: 1,
        cool: 6,
        text: "Salt costs a sun a kilo in Zanara this year, twelve times the coast price, and the Sand Clans are threatening to close the Salt Road altogether. Ekon Saltfoot's Salt Cats, the gate porters of the East Gate, smuggle it in hidden in grain sacks. One of them is asking whether you have a cart.",
        choices: [
          {
            t: "Drive the cart for the Salt Cats",
            check: {s:"stealth",s2:"deception",d:42},
            win: {
              r: "Forty kilos under the millet, past the gate tax-men, who are paid to look the other way and do. Your cut is ten suns.",
              fx: {coin:10,honor:-2,skill:{deception:2}},
            },
            lose: {
              r: "A new tax-man, not yet paid, opens the third sack. The cart is gone, and you are in trouble.",
              fx: {punish:"smuggling"},
            },
          },
          {
            t: "Cook sour, as the Zanari do, and buy no salt",
            r: "Sour milk, baobab leaf, okra. Zanari cooking is sour, not salty, for good reason. Your family grumbles and stays healthy.",
            fx: {coin:3,sta:.2},
          },
          {
            t: "Buy a whole slab now, before the price rises",
            req: p=>p.coin>=15,
            check: {s:"trade",s2:"ins",d:40},
            win: {
              r: "Two months later salt is a sun and a half a kilo. You sell half the slab and keep the rest.",
              fx: {coin:12,skill:{trade:2}},
            },
            lose: {
              r: "A Sand Clan caravan gets through the next week and the price falls back. You have a lot of salt.",
              fx: {coin:-6},
            },
          },
        ],
      },
      {
        id: "ss_zn_dustrunner",
        title: "The walking stick",
        cond: (p,C)=>C.realm(p,"POL-20")&&C.adult(p)&&!C.noble(p),
        w: .9,
        cool: 8,
        text: 'At the North Gate a nervous old man asks you to carry his walking stick out of the city for him, "for my bad hip". It is very heavy for a stick. Dust-runners carry gold dust out of Zanara in hollow sticks and robe hems, to sell to Well Quarter buyers below the Scale price.',
        choices: [
          {
            t: "Carry it for a share",
            check: {s:"deception",s2:"wil",d:42},
            win: {
              r: "You limp past the gate guard with a pained face. Outside the walls the old man unscrews the stick and gives you a pinch of dust worth twelve suns.",
              fx: {coin:12,skill:{deception:2},honor:-2},
            },
            lose: {
              r: "The guard taps the stick on the stone and it rings like a bell. Gold smuggling is the common crime of Zanara, and the courts punish it hard.",
              fx: {punish:"smuggling"},
            },
          },
          {
            t: "Hand the stick to the gate guard",
            r: "The guard weighs it, grins, and pays you a reward in cowries. The old man is dragged away weeping. You do not watch.",
            fx: {coin:3,favor:2,honor:-1},
          },
          {
            t: "Refuse and walk on",
            r: "He finds someone else within the hour. You see the stick later, going through the gate.",
            fx: {},
          },
        ],
      },
      {
        id: "ss_zn_floor",
        title: "Names under the floor",
        cond: (p,C)=>C.realm(p,"POL-20")&&kid(p,C,5,12),
        w: 1.2,
        once: !0,
        text: p=>`Before market every morning ${SEX(p,"your mother","your mother")} pours a little milk on the floor of the house and speaks her grandmother's name, and her grandmother's mother's, so they stay near. The dead are buried under the floor here. Today she asks you to say the names.`,
        choices: [
          {
            t: "Say all seven names without a mistake",
            check: {s:"int",s2:"wil",d:20},
            win: {
              r: 'Seven names, in order, and you add your baby brother who died, whom she never names. She cries and hugs you. "A name not spoken fades," she says. "Not his, now."',
              fx: {piety:4,skill:{learning:2},rel:{who:"mother",op:10}},
            },
            lose: {r:"You forget the fourth. Your mother says it for you, and asks you to practice.",fx:{piety:2}},
          },
          {
            t: "Ask whether the ancestors can hear you",
            r: '"As long as you speak," she says. "When nobody speaks your name, you fade into nothing. That is why we have children." It is a lot to think about before breakfast.',
            fx: {int:.4,piety:2},
          },
          {
            t: "Make up a funny ancestor",
            r: "She is not amused. Neither, you suspect, are the real ones. You sweep the floor all week.",
            fx: {happy:-1,wil:.3},
          },
        ],
      },
      {
        id: "ss_zn_masks",
        title: "The Night of Masks",
        cond: (p,C)=>C.realm(p,"POL-20")&&C.ageAdj(p)>=8,
        w: 1.1,
        cool: 4,
        text: "1 October, the Night of Masks, the end of the rains. The mask societies dance the ancestors through the streets by torchlight, and nobody may say who wears the mask. A tall dancer in a horned ancestor mask spins past you, and you know that limp. It is your uncle.",
        choices: [
          {
            t: "Say nothing, and dance after him",
            r: "You follow the ancestors till dawn. Whoever is under the mask, tonight it is your great-grandfather, and he dances well.",
            fx: {piety:3,happy:5,skill:{music:1}},
          },
          {
            t: "Shout his name for a laugh",
            r: "The drums stop. The crowd stares. Your mother drags you home by the ear and your family pays a fine to the society.",
            fx: {family:-2,honor:-3,happy:-4},
          },
          {
            t: "Ask him afterward to join the society",
            req: (p,C)=>grown(p,C),
            check: {s:"athletics",s2:"music",d:40},
            win: {
              r: "He makes you dance the fast steps for an hour, then nods. You will carry a mask next year, and never tell anyone.",
              fx: {skill:{athletics:2,music:2},flag:"ss_zn_mask",piety:2},
            },
            lose: {r:'"Masks? What masks?" he says, and limps away.',fx:{happy:-1}},
          },
        ],
      },
      {
        id: "ss_zn_bloodcattle",
        title: "Cattle, or death",
        cond: (p,C)=>C.realm(p,"POL-20")&&C.adult(p),
        w: .8,
        cool: 12,
        setup: (p,ctx)=>{ctx.n=loc(p,"M")},
        text: "Your cousin {n} has killed a man in a fight over a heifer at the market. In Zanara a murderer pays blood-price in cattle, set by the governor, or dies. The dead man's family wants twenty head. Your family has eleven.",
        choices: [
          {
            t: "Give your own share of cattle to make up the price",
            req: p=>p.coin>=60,
            r: "Nine cattle walk out of your pen and into theirs. {n} lives. Your family remembers it at every rite.",
            fx: {coin:-60,honor:4,newRel:{type:"friend",op:40}},
          },
          {
            t: "Plead before the governor for a lower price",
            check: {s:"persuasion",s2:"diplomacy",d:46},
            win: {
              r: "You bring witnesses who say the dead man drew first. The governor sets the price at twelve head. Everyone hates it a little, which is justice.",
              fx: {skill:{persuasion:3},honor:2,fame:1},
            },
            lose: {
              r: "The governor is a friend of the dead man's family. Twenty head, or the rope.",
              fx: {wil:1.5,happy:-6},
            },
          },
          {
            t: "Help {n} run for the Abari border",
            check: {s:"stealth",s2:"survival",d:44},
            win: {
              r: "You get him over the hills at Atani at night. He sends word from Abara that he is alive and herding for a lord.",
              fx: {skill:{stealth:2},honor:-2,favor:-2},
            },
            lose: {
              r: "The governor's runners catch you both. {n} hangs. You are fined for your trouble.",
              fx: {coin:-20,wil:2.5,happy:-10},
            },
          },
        ],
      },
      {
        id: "ss_zn_runners",
        title: "The House of Runners",
        cond: (p,C)=>C.realm(p,"POL-20")&&(C.teen(p)||C.adult(p)&&C.ageAdj(p)<24)&&free(p),
        w: 1,
        once: !0,
        text: "The House of Runners is taking trials. Sefu the Runner, the first since Mosi the Runner to run a horseman down in a day, watches from the shade. The trial is simple: run from the Runners' Ground to the river and back, forty kilometers, before the drums sound noon.",
        choices: [
          {
            t: "Run it",
            check: {s:"sta",s2:"athletics",d:50},
            win: {
              r: "Your feet bleed and your heart hammers, and you touch the post as the noon drums start. Sefu nods once. You are a runner of the empire.",
              fx: {sta:1,spd:.6,skill:{athletics:4},fame:2,flag:"ss_zn_runner",apt:{athletics:1.25}},
            },
            lose: {
              r: "You are still on the river road when the drums sound. You finish anyway, at a walk, and Sefu notes that too.",
              fx: {sta:.6,skill:{athletics:2},wil:1.5},
            },
          },
          {
            t: "Run it the clever way, pacing yourself like a relay",
            check: {s:"int",s2:"sta",d:44},
            win: {
              r: "Slow, slow, then fast, the way relay men run. You beat two faster boys who burned out by the river.",
              fx: {sta:.6,skill:{athletics:3},int:.3,flag:"ss_zn_runner"},
            },
            lose: {r:"Too slow, too long. Clever is not enough when the drum sounds.",fx:{skill:{athletics:1},wil:.8}},
          },
          {
            t: "Watch the runners instead and learn the relay calls",
            r: "Drum-language, the relay posts, the way a message is passed hand to hand at a run. You learn more about the empire in a morning than in a year.",
            fx: {skill:{command:1,learning:2},int:.3},
          },
        ],
      },
      {
        id: "ss_zn_hundred",
        title: "The village hundred",
        cond: (p,C)=>C.realm(p,"POL-20")&&C.adult(p)&&C.male(p)&&!C.old(p)&&!C.noble(p)&&free(p),
        w: 1,
        cool: 6,
        text: p=>`The governor's quota has come: your village must send spearmen and archers to the field army. The talking drums carry news from ${early()?"Atani, where the Marshal's spearmen are gathering against Abara":"the border"}. You are of age, and the village hundred is mustering under the baobab.`,
        choices: [
          {
            t: "Take a spear and march",
            r: "You learn the Bull's Horns attack, the drum calls and how to sleep standing up. The army is paid in gold, a little of it.",
            fx: {skill:{spear:3,command:1},coin:8,sta:.4},
          },
          {
            t: "Volunteer as an archer",
            check: {s:"bow",s2:"ins",d:40},
            win: {
              r: "The captain watches you hit a gourd at sixty paces and puts you in the archers, who march behind the spears and eat first.",
              fx: {skill:{bow:3},coin:10},
            },
            lose: {r:"You miss the gourd and hit the captain's goat. Spears for you.",fx:{skill:{spear:2}}},
          },
          {
            t: "Bribe the headman to send someone else (15 suns)",
            req: p=>p.coin>=15,
            r: "Gold dust in a twist of cloth. Another man's son goes. You carry that a long time.",
            fx: {coin:-15,honor:-3,wil:.5},
          },
        ],
      },
      {
        id: "ss_zn_kabale",
        title: "The Kabale shafts",
        cond: (p,C)=>C.realm(p,"POL-20")&&C.adult(p)&&bond(p),
        w: 1.3,
        cool: 4,
        text: "In the deep gold mines of the Southern Hills, about nine thousand slaves dig for House Kabale. You go down the shaft at dawn on a rope ladder and come up after dark. Today the gallery groans, and a fist-sized nugget glitters in the rock by your lamp. Every nugget is the emperor's.",
        choices: [
          {
            t: "Hand it to the overseer",
            r: "He weighs it and gives you an extra bowl of porridge. The emperor's gold buys the emperor's armies, and slaves.",
            fx: {honor:1,sta:.3,wil:.6},
          },
          {
            t: "Hide it and plan to buy your freedom",
            check: {s:"stealth",s2:"wil",d:50},
            win: {
              r: "You swallow it, wait three days, and sell it through a Well Quarter carter for a fortune in gold dust. Enough to buy yourself out of the pits.",
              fx: p=>(p.coin+=60,setFree(p,"ss_zn_bought")),
            },
            lose: {
              r: "The overseers search everyone who comes up. Hiding a nugget means the loss of a hand.",
              fx: {wound:"lost_hand",wil:3,health:-15,cause:"the Kabale overseers"},
            },
          },
          {
            t: "Shout a warning: the gallery is going",
            check: {s:"ins",s2:"spd",d:40},
            win: {
              r: "Thirty men scramble out before the roof comes down. The overseer, who was one of them, lightens your work for a month.",
              fx: {honor:4,wil:1,newRel:{type:"friend",op:30}},
            },
            lose: {
              r: "You run, but not fast enough. The rock catches your leg.",
              fx: {health:-20,wound:"limp",wil:2,cause:"a collapse in the Kabale mines"},
            },
          },
        ],
      },
      {
        id: "ss_zn_ivory",
        title: "Ivory",
        cond: (p,C)=>C.realm(p,"POL-20")&&C.adult(p)&&!C.old(p),
        w: .8,
        cool: 9,
        text: "Ivory is one of Zanara's great exports, and an ivory party is forming at Tefude to hunt the elephant herds along the river. The hunt-master wants spears and bowmen who can stand still when a bull elephant charges. Few can.",
        choices: [
          {
            t: "Join as a spearman",
            check: {s:"spear",s2:"wil",d:50},
            win: {
              r: "When the bull comes, you stand. The spears go in together. You come back with a share of the tusks and a story you will never tell well enough.",
              fx: {coin:45,skill:{spear:3},wil:1.5,fame:2},
            },
            lose: {
              r: "You run. Everybody runs. The bull kills the man beside you and you carry him home.",
              fx: {wil:2.5,happy:-8,health:-6,cause:"an elephant hunt"},
            },
          },
          {
            t: "Join as a tracker",
            check: {s:"tracking",s2:"survival",d:42},
            win: {
              r: "You read the dung, the broken branches, the wind. The hunt finds its herd, and you get a tracker's share without ever standing in front of a bull.",
              fx: {coin:25,skill:{tracking:3}},
            },
            lose: {
              r: "You lead them in a circle for two days. The hunt-master sends you home.",
              fx: {skill:{tracking:1}},
            },
          },
          {
            t: "Carve ivory in town instead",
            check: {s:"craft",s2:"int",d:40},
            win: {
              r: "An ancestor mask in miniature, out of a broken tusk. A Gold House merchant buys it for his wife.",
              fx: {coin:18,skill:{craft:3}},
            },
            lose: {r:"The ivory cracks along the grain.",fx:{coin:-5,skill:{craft:1}}},
          },
        ],
      },
      {
        id: "ss_zn_stones",
        title: "Stones",
        cond: (p,C)=>C.realm(p,"POL-20")&&kid(p,C,5,13),
        w: 1,
        once: !0,
        text: "In the shade of the compound wall the children play Stones: pits scooped in the dirt and pebbles moved round in handfuls. Zanari children learn to count on it before anything else. A big girl from the next compound has never lost, and she is waiting for you.",
        choices: [
          {
            t: "Play her, and count every pit",
            check: {s:"int",s2:"ins",d:20},
            win: {
              r: 'You see it six moves ahead: the empty pit, the capture. She stares at the board, then laughs and says, "Again." You are friends after that.',
              fx: {int:.6,skill:{gambling:1,learning:1},newRel:{type:"friend",op:25}},
            },
            lose: {
              r: "She takes every stone you own in nine moves. You learn more from losing than she does from winning.",
              fx: {int:.4,wil:.4},
            },
          },
          {
            t: "Play for cowries",
            check: {s:"gambling",s2:"int",d:22},
            win: {
              r: "A handful of cowries, about a penny's worth. You feel very rich.",
              fx: {coin:1,skill:{gambling:2}},
            },
            lose: {r:"Your cowries become her cowries.",fx:{coin:-1}},
          },
          {
            t: "Teach the little ones instead",
            r: "You draw the pits for them and explain slowly. You find you like teaching better than winning.",
            fx: {trait:"patient",skill:{learning:1}},
          },
        ],
      },
      {
        id: "ss_zn_tedana",
        title: "The silent song at Tandi",
        cond: (p,C)=>C.realm(p,"POL-20")&&C.adult(p),
        w: .9,
        cool: 9,
        text: "At the Remembering of a dead emperor, the Rememberers of the Tedana gravels should sing the Kanemba line. This year at Tandi they stand silent, and the crowd shuffles. Everyone knows what it means: the vassal king Kato Tedani resents the Kanemba, and a song not sung is a step toward revolt.",
        choices: [
          {
            t: "Begin the song yourself",
            check: {s:"music",s2:"wil",d:46},
            win: {
              r: "Your voice cracks on the first name, then holds. Others join. The Tedana Rememberers stand silent through all of it. You are noticed by both sides.",
              fx: {favor:4,fame:2,newRel:{type:"enemy",op:-20}},
            },
            lose: {
              r: "Nobody joins you. You stop after six names, red-faced, into a silence you made worse.",
              fx: {happy:-4,wil:1},
            },
          },
          {
            t: "Ask a Tedana Rememberer why",
            check: {s:"diplomacy",s2:"ins",d:42},
            win: {
              r: '"The old kings of the Tedana panned this gold before any Kanemba was born," she says. "We sing what is owed." You understand more than you would like.',
              fx: {int:.5,skill:{diplomacy:2}},
            },
            lose: {r:"She looks through you as if you were a stranger's ancestor.",fx:{}},
          },
          {
            t: "Slip away before the governor's men arrive",
            r: "You are home before the drums start talking. The next day there are arrests.",
            fx: {trait:"cautious"},
          },
        ],
      },
      {
        id: "ss_zn_flies",
        title: "The fly sickness",
        cond: (p,C)=>C.realm(p,"POL-20")&&C.adult(p)&&C.mounted(p),
        w: 1,
        cool: 8,
        text: "Your horse is drooping. Its eyes run and it will not eat. Northern horses die of fly sickness in the Golden Plains, which is why the Golden Horse imports them at such cost. The farrier shakes his head. The cattle-keepers say a horse kept in smoke at dusk sometimes lives.",
        choices: [
          {
            t: "Keep it in smoke every dusk and nurse it",
            check: {s:"husbandry",s2:"medicine",d:46},
            win: {
              r: "Dung fires, wet blankets, millet gruel. It lives, thin and wary. A Zanari horse-coper offers you double what you paid for it.",
              fx: {skill:{husbandry:3,medicine:1},wil:.8},
            },
            lose: {r:"It dies on the ninth night with its head in your lap.",fx:{gear:{mount:null},wil:1.5,happy:-6}},
          },
          {
            t: "Sell it at once to a fool",
            check: {s:"deception",s2:"trade",d:40},
            win: {
              r: 'A young noble of the Golden Horse buys it as "a little tired from the road". You buy a mule.',
              fx: {coin:35,honor:-3,gear:{mount:"mule"}},
            },
            lose: {r:"Every buyer in the market knows the signs.",fx:{coin:5,gear:{mount:null},happy:-3}},
          },
          {
            t: "Let it go and buy a local mule",
            r: "A Zanari mule is ugly, stubborn and alive. That is three more virtues than a dead horse.",
            fx: {gear:{mount:"mule"},coin:-10},
          },
        ],
      },
      {
        id: "ss_zn_letter",
        title: "A letter to Atani",
        cond: (p,C)=>early()&&C.realm(p,"POL-20")&&C.adult(p)&&!C.old(p),
        w: .8,
        once: !0,
        text: "A merchant of the Well Quarter, which follows the Path of the Well while still honoring the ancestors, asks you to carry a sealed letter to Atani, where the Marshal's army waits facing Abara. He wants it carried by someone who is not a runner, so the Old Voices' runners cannot read it on the way.",
        choices: [
          {
            t: "Carry it, fast and quiet",
            check: {s:"sta",s2:"stealth",d:42},
            win: {
              r: "Ten days of hills and rivers, and you hand it to a merchant's factor in the camp at Atani. You are paid in gold dust, and asked nothing.",
              fx: {coin:25,sta:.5,skill:{stealth:2}},
            },
            lose: {
              r: "Two men from the Old Voices stop you on the road and read the letter in front of you. They keep it. The merchant does not hire you again.",
              fx: {coin:5,wil:.8,happy:-3},
            },
          },
          {
            t: "Read it first, carefully, and reseal it",
            req: (p,C)=>C.literate(p),
            check: {s:"intrigue",s2:"craft",d:46},
            win: {
              r: "It is about gold and the east road, and about which side the merchants will back if the Marshal and the heir ever quarrel. You reseal it perfectly.",
              fx: {coin:25,skill:{intrigue:3},flag:"ss_zn_letter"},
            },
            lose: {
              r: "The seal cracks. You deliver it anyway and pretend. The factor looks at the seal for a long time.",
              fx: {coin:10,newRel:{type:"enemy",op:-15}},
            },
          },
          {
            t: "Decline. Letters get men killed",
            r: "He smiles and finds a less careful carrier. You hear later that letters are being opened on every road.",
            fx: {trait:"cautious"},
          },
        ],
      },
      {
        id: "ss_zn_firstmillet",
        title: "First Millet",
        cond: (p,C)=>C.realm(p,"POL-20")&&C.ageAdj(p)>=8,
        w: 1,
        cool: 5,
        text: "15 September, First Millet. The first grain of the harvest goes to the ancestors, porridge is cooked in every compound, and women who own the grain they grow sell it in the market for the best prices of the year. The first heads of your family's millet are ready.",
        choices: [
          {
            t: "Pound the first millet for the ancestors",
            r: "You pound it till your arms burn, and the porridge goes under the house floor with a little sour milk. The house feels full of people.",
            fx: {piety:3,str:.3,happy:2},
          },
          {
            t: "Take the harvest to market early",
            check: {s:"trade",s2:"persuasion",d:38},
            win: {
              r: "First Millet prices. The market women look at your stall with grudging respect.",
              fx: {coin:12,skill:{trade:2}},
            },
            lose: {r:"Everyone else had the same idea.",fx:{coin:3}},
          },
          {
            t: "Wrestle at the harvest feast",
            check: {s:"unarmed",s2:"str",d:40},
            win: {
              r: "You throw the champion of the next village into the millet chaff. A girl from the well brings you a gourd of beer.",
              fx: {skill:{unarmed:3},fame:1,happy:3},
            },
            lose: {
              r: "He throws you into the millet chaff. A girl from the well brings him the beer.",
              fx: {skill:{unarmed:1},happy:-1},
            },
          },
        ],
      },
      {
        id: "ss_zn_canoe",
        title: "The war canoes",
        cond: (p,C)=>C.realm(p,"POL-20")&&grown(p,C)&&!C.old(p),
        w: .8,
        cool: 8,
        text: "The emperor keeps about two hundred war canoes and barges on the Tedana and the Mosawa. Today the canoe crews are racing for the governor, forty paddlers to a hull, and one crew is a paddler short. A river horse has been seen at the bend.",
        choices: [
          {
            t: "Take the empty seat and paddle",
            check: {s:"sta",s2:"sea",d:42},
            win: {
              r: "You find the stroke and the drum finds you. Your canoe wins by a hull length, and the governor throws gold rings into the water for the crew to dive for.",
              fx: {coin:6,skill:{sea:2},sta:.6,fame:1},
            },
            lose: {
              r: "You catch a crab with your paddle and nearly go over. Your crew comes last and blames you, correctly.",
              fx: {skill:{sea:1},happy:-2},
            },
          },
          {
            t: "Watch for the river horse from the bank and shout warnings",
            check: {s:"ins",s2:"int",d:34},
            win: {
              r: "You see the ripple first and shout. The canoes swing wide. The governor's steward asks your name.",
              fx: {honor:2,favor:2},
            },
            lose: {r:"You shout at a log.",fx:{happy:-1}},
          },
          {
            t: "Bet on the long canoe from Nuzeko",
            check: {s:"gambling",s2:"ins",d:38},
            win: {r:"It wins by a nose. A pile of cowries.",fx:{coin:8,skill:{gambling:2}}},
            lose: {r:"It sinks. Not entirely its fault: the river horse.",fx:{coin:-5}},
          },
        ],
      },
      {
        id: "ss_ks_ropehall",
        title: "The Rope Hall",
        cond: (p,C)=>C.realm(p,"POL-21")&&(C.teen(p)||kid(p,C,10,13))&&free(p),
        w: 1.1,
        once: !0,
        text: 'The Rope Hall of Kesh, founded by a Keshari princess, teaches climbing, roofs, ropes and falling. Tumaini the Rope, one of the best climbers alive, takes a few town children each year. He hangs a knotted rope from the rafters and says, "Up. Then down. The down is harder."',
        choices: [
          {
            t: "Climb to the rafters",
            check: {s:"athletics",s2:"spd",d:26},
            win: {
              r: "Up, a breath at the top, and down without burning your hands. Tumaini grunts. You are in.",
              fx: {skill:{athletics:4,stealth:1},spd:.5,flag:"ss_ks_rope"},
            },
            lose: {
              r: 'You make the top and freeze. He talks you down one knot at a time. "Come back next year," he says, not unkindly.',
              fx: {skill:{athletics:2},wil:.6},
            },
          },
          {
            t: "Learn the falling first",
            check: {s:"ins",s2:"athletics",d:24},
            win: {
              r: "You learn to roll off a wall and land like a cat. Tumaini says that is the lesson most climbers learn too late.",
              fx: {skill:{athletics:3},ins:.5,flag:"ss_ks_rope"},
            },
            lose: {
              r: "You land like a sack of pepper. A bruise the size of a plate.",
              fx: {health:-4,skill:{athletics:1},cause:"a fall at the Rope Hall"},
            },
          },
          {
            t: "Ask him about Kito the Gecko",
            r: 'His face goes still. "Gecko climbs too well and listens too little," he says. Then he makes you do the rope ten times.',
            fx: {skill:{athletics:2},int:.3},
          },
        ],
      },
      {
        id: "ss_ks_nightswim",
        title: "The Night Swimmers",
        cond: (p,C)=>C.realm(p,"POL-21")&&C.adult(p)&&!C.old(p)&&free(p),
        w: .9,
        cool: 8,
        text: "The Night Swimmers of Kesh, four hundred harbor raiders who swim in at night to cut cables and fire ships, are testing new men in the harbor. The test: swim out in the dark to a moored hull, cut a marked rope with a knife in your teeth, and swim back unseen by the guard boat.",
        choices: [
          {
            t: "Take the test",
            check: {s:"sea",s2:"stealth",d:48},
            win: {
              r: "Black water, a slick hull, the rope parts under your knife. The guard boat's lamp passes over your head twice. The Swimmers take you on.",
              fx: {skill:{sea:3,stealth:3},flag:"ss_ks_swimmer",fame:1,sta:.4},
            },
            lose: {
              r: "The guard boat's lamp finds you. In a real raid you would be dead. Here you are laughed at, which is nearly as bad.",
              fx: {skill:{sea:2},wil:.8},
            },
          },
          {
            t: "Ask what a Night Swimmer does in wartime",
            r: '"The Amber fleet burned twenty-two of our ships at Kioya Water in 1068," the captain says. "We do not fight big fleets in daylight. We wait for the night." A cold answer for a warm sea.',
            fx: {skill:{tactics:2},int:.3},
          },
          {
            t: "Stay on the quay and hold the lamps",
            r: "Someone has to. You learn the signals, and who comes back.",
            fx: {skill:{sea:1}},
          },
        ],
      },
      {
        id: "ss_ks_firstpepper",
        title: "First Pepper",
        cond: (p,C)=>C.realm(p,"POL-21")&&C.ageAdj(p)>=8,
        w: 1,
        cool: 5,
        text: "The rains have come to the Kioya hills, and with them First Pepper, the first picking of the green spikes. Women run the spice gardens and often the weighing. The terraces are slippery, the vines are high, and the garden-mother wants every hand on a ladder.",
        choices: [
          {
            t: "Climb and pick until dark",
            check: {s:"athletics",s2:"sta",d:36},
            win: {
              r: "Baskets of green pepper, your fingers stinging, your back singing. The garden-mother pays you in pepper, which in Kesh is better than coin.",
              fx: {coin:6,sta:.4,skill:{husbandry:2}},
            },
            lose: {
              r: "A wet ladder, a slip, a long slide down the terrace into the mud.",
              fx: {health:-6,cause:"a fall in the pepper gardens"},
            },
          },
          {
            t: "Work the drying mats and the sorting",
            r: "Green to black under the sun, turned every hour. You learn which peppercorns are fat and which are hollow, a thing the Pepper Hall pays for.",
            fx: {skill:{trade:2,craft:1},coin:3},
          },
          {
            t: "Sing the picking songs to keep the line moving",
            check: {s:"music",s2:"wil",d:32},
            win: {
              r: "Call and answer down the terraces. The pickers work faster, and the garden-mother gives you a double share.",
              fx: {coin:5,skill:{music:2},happy:3},
            },
            lose: {r:"Your voice cracks in the rain and the pickers groan.",fx:{happy:-1}},
          },
        ],
      },
      {
        id: "ss_ks_cyclone",
        title: "Cyclone season",
        cond: (p,C)=>C.realm(p,"POL-21")&&C.adult(p),
        w: .9,
        cool: 8,
        text: "September, and the sky over the Spice Coast goes the color of a bruise. Cyclones strike from August to October. The harbor-master has hoisted the black basket. Your ship, or the ship you are owed wages on, is still riding at anchor outside the chain.",
        choices: [
          {
            t: "Row out and bring her inside the chain",
            check: {s:"sea",s2:"str",d:48},
            win: {
              r: "Wind like a wall, rain like stones. You get her inside the Harbor Towers as the chain goes up. The owner pays you a bonus in pepper and silver.",
              fx: {coin:25,skill:{sea:3},fame:2,str:.4},
            },
            lose: {
              r: "The boat swamps halfway. You cling to an oar in the black water and wash up on Stilt Town's mud at dawn.",
              fx: {health:-18,wil:2,cause:"a cyclone at Kesh"},
            },
          },
          {
            t: "Tie down your house and wait it out",
            r: "The wind takes half your roof and all your hens. In the morning the harbor is full of broken masts, but your family is whole.",
            fx: {coin:-5,wil:1},
          },
          {
            t: "Help the Stilt Town families up to the coral houses",
            check: {s:"sta",s2:"command",d:38},
            win: {
              r: "You carry children through waist-deep water till dawn. Stilt Town will remember your name longer than any merchant house would.",
              fx: {honor:5,fame:2,sta:.4},
            },
            lose: {
              r: "The water rises faster than you can carry. You save some. You count the others for years.",
              fx: {honor:3,wil:2,happy:-5},
            },
          },
        ],
      },
      {
        id: "ss_ks_anaconda",
        title: "In the coils of the river",
        cond: (p,C)=>C.realm(p,"POL-21")&&C.ageAdj(p)>=12&&!C.old(p),
        w: .8,
        cool: 9,
        text: "In the swamp below the cinnamon forests a green anaconda has taken a goat, and now it lies half in the water, thick as a man's thigh, digesting. The Keshi believe the rivers are held in its coils, and the old men will not touch it. The goat's owner wants its skin.",
        choices: [
          {
            t: "Go in after it",
            r: "You wade in with a spear and a rope.",
            fx: {beast:{id:"CRE-47",place:"the cinnamon swamp",mod:.8}},
          },
          {
            t: "Leave it. The river keeps its own",
            r: "The old men nod at you. The goat's owner curses. The anaconda sleeps for a month and then is gone.",
            fx: {piety:2,trait:"cautious"},
          },
          {
            t: "Noose its head while it sleeps",
            check: {s:"husbandry",s2:"stealth",d:48},
            win: {
              r: "One loop, pulled tight to a palm trunk. Six men drag it out. The skin hangs in the Pepper Hall for a year with your name under it.",
              fx: {fame:3,coin:15,skill:{husbandry:2}},
            },
            lose: {
              r: "It wakes. You learn how fast a fat snake can move.",
              fx: {health:-16,wound:"broken_ribs",wil:1.5,cause:"a green anaconda"},
            },
          },
        ],
      },
      {
        id: "ss_ks_contract",
        title: "A marriage in pepper weights",
        cond: (p,C)=>C.realm(p,"POL-21")&&C.adult(p)&&!C.married(p)&&!C.old(p)&&free(p),
        w: .9,
        cool: 9,
        setup: (p,ctx)=>{ctx.n=loc(p,p.sex==="F"?"M":"F"),ctx.h=A.pick(["Kioyani","Monuri","Madami","Zetuni"])},
        text: "In Kesh, houses marry to join ships and gardens, and marriage contracts are written in pepper weights. The {h} family has sent a broker with a contract for you and {n}: so many kilos of pepper from them, so many from you, a share of a ship, and a clause about the children's gardens.",
        choices: [
          {
            t: "Haggle the contract in your favor",
            check: {s:"trade",s2:"persuasion",d:44},
            win: {
              r: "Four kilos more on their side and a clause about the ship you will be glad of later. The broker calls you a true Keshi. {n} seems to like you anyway.",
              fx: {lover:!0,coin:30,skill:{trade:3}},
            },
            lose: {
              r: "You push too hard. The {h} broker rolls up the contract and leaves for a better-mannered house.",
              fx: {happy:-3,skill:{trade:1}},
            },
          },
          {
            t: "Sign it as written, for {n}'s sake",
            r: "A fair contract and a pepper-seed necklace. You are betrothed, and the two houses feast.",
            fx: {lover:!0,happy:5},
          },
          {
            t: "Ask to meet {n} first, without brokers",
            check: {s:"persuasion",s2:"etiquette",d:36},
            win: {
              r: "A walk on the harbor wall, cardamom tea, a lot of laughing. The contract can wait. Love, it turns out, cannot.",
              fx: {lover:!0,skill:{etiquette:1}},
            },
            lose: {r:"The meeting is stiff and both families are listening behind the door.",fx:{happy:-2}},
          },
        ],
      },
      {
        id: "ss_ks_naming",
        title: "Named at the harbor mouth",
        cond: (p,C)=>C.realm(p,"POL-21")&&C.ageAdj(p)>=8,
        w: .8,
        cool: 8,
        text: ()=>`Once a year the drowned sailors of Kesh are named at the harbor mouth. This year the list includes ${A.pick(["your uncle, lost with his whole crew off Monuro","the ship's boy who taught you knots","your neighbor, who went out in the cyclone for his nets"])}. Families throw flowers and pepper on the water. Drowned men have no floor to be buried under.`,
        choices: [
          {
            t: "Throw your flowers and say the name loud",
            r: "The name goes out over the water and the gulls carry it. A name spoken does not fade.",
            fx: {piety:3,wil:1},
          },
          {
            t: "Carve the name on a ship's prow instead",
            check: {s:"craft",s2:"wil",d:36},
            win: {
              r: "Small letters under the eye of a new prow at Monuro. That name will sail again.",
              fx: {skill:{craft:2},piety:2,happy:3},
            },
            lose: {
              r: `The shipwright makes you plane it off. "A ship with a dead man's name sinks," he says. Superstition, but his ship.`,
              fx: {happy:-2},
            },
          },
          {
            t: "Sit with the widows on the sea wall afterward",
            r: "You say almost nothing. It is the right amount.",
            fx: {honor:2,trait:"kind"},
          },
        ],
      },
      {
        id: "ss_ks_auger",
        title: "A plugged hole",
        cond: (p,C)=>early()&&C.realm(p,"POL-21")&&C.adult(p)&&(C.job(p,"carpenter","labor","sailor")||C.prof(p,"craft",25)),
        w: 1,
        once: !0,
        text: "In Rehema the Shipwright's yards at Monuro the new ships promised to the Amber Isles are nearly done, though some say four hulls are green timber. Caulking below the waterline, you find an auger hole bored right through the planking and neatly plugged with a peg of soft wood. In a seaway that peg would pop out.",
        choices: [
          {
            t: "Show Rehema at once",
            r: "Rehema looks at it for a long time. Then she has every hull checked plank by plank. They find two more. She gives you a silver kesh and a long, thoughtful look.",
            fx: {coin:5,honor:3,newRel:{type:"friend",op:25}},
          },
          {
            t: "Plug it properly and say nothing",
            check: {s:"craft",s2:"int",d:38},
            win: {
              r: "Oak peg, pitch, and the hole is gone. Whoever bored it will wonder why the ship did not sink.",
              fx: {skill:{craft:2},int:.3},
            },
            lose: {r:"You miss a second hole three planks along.",fx:{flag:"ss_ks_holes",wil:.5}},
          },
          {
            t: "Watch the yards at night to see who comes",
            check: {s:"stealth",s2:"ins",d:46},
            win: {
              r: "On the third night a man in a Monuri sash slips into the yard with an auger. You follow him to a house on Amber Row, which tells you a great deal.",
              fx: {skill:{stealth:2,intrigue:3},flag:"ss_ks_auger"},
            },
            lose: {
              r: "Nobody comes. You fall asleep on a pile of oakum and get bitten by everything in Monuro.",
              fx: {health:-3,happy:-2,cause:"bad nights in the shipyard"},
            },
          },
        ],
      },
      {
        id: "ss_ks_wethands",
        title: "The Wet Hands",
        cond: (p,C)=>C.realm(p,"POL-21")&&grown(p,C)&&!C.old(p)&&!C.noble(p),
        w: .9,
        cool: 8,
        text: "Old Mwita of Stilt Town runs the Wet Hands, harbor thieves who swim out to moored ships at night and cut purses and cargo nets. He has watched you swim and offers you a place. Tonight's ship is an Amber cog full of cloves.",
        choices: [
          {
            t: "Swim out with them",
            check: {s:"sea",s2:"stealth",d:44},
            win: {
              r: "A net cut, a sack of cloves floating home on a reed float. Mwita pays you in coin and in respect. Among the cloves, someone finds a sealed letter.",
              fx: {coin:15,skill:{stealth:2,sea:2},honor:-2,flag:"ss_ks_wethands"},
            },
            lose: {
              r: "Amber marines with lanterns and boathooks. You get away with a gash and nothing else.",
              fx: {health:-10,wound:"deep_cut",cause:"an Amber marine's boathook"},
            },
          },
          {
            t: "Say no, politely",
            r: 'Mwita shrugs. "The tide comes in for everyone," he says. You are not sure what he means.',
            fx: {},
          },
          {
            t: "Sell the plan to the harbor guards",
            check: {s:"intrigue",s2:"deception",d:44},
            win: {
              r: "The guards catch two Wet Hands in the water and pay you a silver kesh. Mwita never learns how.",
              fx: {coin:4,honor:-2,skill:{intrigue:2}},
            },
            lose: {r:"Mwita learns how.",fx:{newRel:{type:"enemy",op:-35},health:-8,cause:"a beating in Stilt Town"}},
          },
        ],
      },
      {
        id: "ss_ks_smuggle",
        title: "Pepper by night",
        cond: (p,C)=>C.realm(p,"POL-21")&&C.adult(p)&&free(p),
        w: 1,
        cool: 7,
        text: "Pepper sells low this year, because Ranpur sends its pepper north by the Nagora road. The Pepper Hall still takes one part in ten at its scales. An Amber captain in the Tide-Table offers a better price for pepper that never touches the scales: carried out to his ship by night.",
        choices: [
          {
            t: "Row the pepper out",
            check: {s:"stealth",s2:"sea",d:44},
            win: {
              r: "Ten sacks, two trips, no lights. The captain pays in Amber silver. The Pepper Hall's tenth stays in your pocket.",
              fx: {coin:30,skill:{stealth:2},honor:-2},
            },
            lose: {
              r: "The Pepper Guard's boat is waiting in the dark. Smuggling past the Pepper Hall costs your trading rights.",
              fx: {punish:"smuggling"},
            },
          },
          {
            t: "Weigh it honestly and take the low price",
            r: "Ranpuri pepper, Amber ships, low prices. The Pepper Hall takes its tenth. You take what is left and grumble with everyone else.",
            fx: {coin:10,honor:1},
          },
          {
            t: "Hold your pepper till prices rise",
            check: {s:"trade",s2:"ins",d:42},
            win: {
              r: "The Neck road stays shut and the long way up the Monuti gets longer. By spring your pepper is worth half again.",
              fx: {coin:25,skill:{trade:2}},
            },
            lose: {r:"Weevils. Pepper does not rot, they say. They lie.",fx:{coin:-10}},
          },
        ],
      },
      {
        id: "ss_ks_forest",
        title: "Fight from the forest",
        cond: (p,C)=>C.realm(p,"POL-21")&&C.adult(p)&&!C.old(p),
        w: .8,
        cool: 9,
        text: ()=>`A landing party has come ashore below the cinnamon forests: ${A.pick(["raiders from an Amber ship gone rogue","Ranpuri pepper smugglers who burned a drying shed","pirates from the Monsoon Coast"])}. The hill levies of spice gardeners fight only in defense, and they fight from the trees. Your headman hands out bows.`,
        choices: [
          {
            t: "Shoot from the trees",
            check: {s:"bow",s2:"stealth",d:44},
            win: {
              r: "Arrows from nowhere, three volleys and gone. The raiders run back to their boats without seeing one of you.",
              fx: {skill:{bow:3,stealth:2},fame:2,honor:2},
            },
            lose: {
              r: "You loose too early and give away the line. A raider's javelin finds you in the undergrowth.",
              fx: {health:-14,wound:"deep_cut",wil:1,cause:"a raider's javelin"},
            },
          },
          {
            t: "Lead them into the fever swamp",
            check: {s:"survival",s2:"tactics",d:46},
            win: {
              r: "You show yourself and run. They follow you into the swamp. Half of them are shaking with fever within a week. The forest fights for Kesh.",
              fx: {skill:{tactics:3,survival:2},fame:2},
            },
            lose: {r:"They do not follow. They burn another shed instead.",fx:{coin:-5,wil:.8}},
          },
          {
            t: "Carry the wounded back to the village",
            r: "Back and forth all afternoon with the injured on your shoulders. Nobody sings about it, but they remember.",
            fx: {honor:3,sta:.4,skill:{medicine:1}},
          },
        ],
      },
      {
        id: "ss_ks_elves",
        title: "The Eldergrove traders",
        cond: (p,C)=>C.realm(p,"POL-21")&&C.adult(p)&&(C.race(p,"elf","halfelf")||C.job(p,"merchant")),
        w: .8,
        cool: 9,
        text: p=>`${p.race==="elf"||p.race==="halfelf"?"A handful of Eldergrove elves live in Kesh, and you are one of the few who speak both tongues well.":"Eldergrove elf traders are welcome in Kesh, and a few live here."} A tall elf trader at the Coral Town gate wants to buy cardamom and sell a crate of rare woods from the Leaf People, and does not trust the Pepper Hall brokers.`,
        choices: [
          {
            t: "Broker the deal yourself",
            check: {s:"trade",s2:"diplomacy",d:42},
            win: {
              r: "Rare woods for the carvers of Kesh, cardamom for the elf, and a fat fee for you. The elf bows, which elves rarely do to traders.",
              fx: {coin:30,skill:{trade:3,diplomacy:1}},
            },
            lose: {
              r: "The elf thinks you are cheating him and you think he is cheating you. Possibly you are both right.",
              fx: {coin:-5},
            },
          },
          {
            t: "Take the elf to the Pepper Hall and vouch for the weighers",
            r: "Zawadi Kioyani's clerks are delighted with you. The elf less so. Honest weight is still honest.",
            fx: {favor:2,honor:2},
          },
          {
            t: "Ask about the Leaf People and the deep forest",
            r: "The elf talks of a forest so deep the sun is a rumor. You learn three words of Grover and a great deal of respect.",
            fx: {int:.5,skill:{diplomacy:1}},
          },
        ],
      },
      {
        id: "ss_ks_storm",
        title: "The child who wakes before the storm",
        cond: (p,C)=>early()&&C.realm(p,"POL-21")&&C.adult(p)&&(C.job(p,"servant")||C.town(p)||C.noble(p)),
        w: .8,
        once: !0,
        text: "In Kesh they whisper that the infant prince Nuru screams the whole night before a storm, even one the harbor-master did not foresee. The Maruang of the Amber Isles have a storm-sense in the blood. A palace servant who heard it offers to sell you the story, and says two other people are already asking.",
        choices: [
          {
            t: "Buy the story and sell it to the Monuri",
            check: {s:"intrigue",s2:"trade",d:46},
            win: {
              r: "House Monuri pays twenty silver kesh for a crying baby. In Kesh even a cry has a price.",
              fx: {coin:17,honor:-2,skill:{intrigue:3}},
            },
            lose: {
              r: "The servant sells it to you, and to Faraji Keshari's man, and to the Monuri. Faraji's man remembers you.",
              fx: {coin:-5,newRel:{type:"enemy",op:-20}},
            },
          },
          {
            t: "Tell the servant to hold their tongue",
            r: "A baby is a baby, even a prince. The servant looks ashamed and goes back inside.",
            fx: {honor:2},
          },
          {
            t: "Watch the sky yourself the next time the prince cries",
            check: {s:"sea",s2:"int",d:40},
            win: {
              r: "The palace window lights up, a baby wails, and two days later a squall breaks over the harbor. You get your boat in first.",
              fx: {int:.5,skill:{sea:2},flag:"ss_ks_storm"},
            },
            lose: {r:"Babies cry. It rains. You cannot tell which caused which.",fx:{}},
          },
        ],
      },
      {
        id: "ss_ks_mast",
        title: "The mast-climbers",
        cond: (p,C)=>C.realm(p,"POL-21")&&kid(p,C,7,13),
        w: 1,
        once: !0,
        text: "At the festival in the harbor, acrobats climb ships' masts to the drums and lyres, standing on the yards with their arms out. After dark, when the grown-ups are drinking cardamom tea, the harbor children dare each other to climb the smallest mast.",
        choices: [
          {
            t: "Climb to the top and wave",
            check: {s:"athletics",s2:"wil",d:22},
            win: {
              r: "The harbor lamps spin below you like stars. You wave. Someone on the quay waves back. You will remember this all your life.",
              fx: {skill:{athletics:3},happy:5,trait:"brave"},
            },
            lose: {
              r: "Halfway up your hands decide they are done. A sailor plucks you off the rigging like a monkey and carries you down to your mother.",
              fx: {happy:-3,wil:.5},
            },
          },
          {
            t: "Hold the ladder and count for the others",
            r: "You count everyone up and everyone down. Nobody falls. Somebody has to be the sensible one.",
            fx: {trait:"cautious",skill:{command:1}},
          },
          {
            t: "Beg the acrobats to teach you",
            r: "A laughing acrobat girl shows you how to stand on a rail without falling. You practice on the garden wall for a year.",
            fx: {skill:{athletics:2},spd:.3},
          },
        ],
      },
    ]);
    A.defEvents([
      {
        id: "ss_ab_coffee",
        title: "Three cups",
        cond: (p,C)=>C.realm(p,"POL-22")&&C.adult(p),
        w: 1,
        cool: 6,
        text: ()=>`A ${A.pick(["lord's steward","Rememberer on her rounds","cattle buyer from Mandi"])} comes to your round house on business. In Abara, coffee is brewed three times over, bitter, and a guest who leaves before the third cup insults the house. The business is urgent. So is the coffee.`,
        choices: [
          {
            t: "Roast, grind and pour all three cups properly",
            check: {s:"etiquette",s2:"wil",d:32},
            win: {
              r: "Smoke, incense, three tiny cups and an hour of talk. By the third cup the business is done, and done in your favor.",
              fx: {skill:{etiquette:2,persuasion:1},coin:5,honor:1},
            },
            lose: {
              r: "You burn the beans and the guest sips politely through three bitter cups of charcoal. The business goes elsewhere.",
              fx: {happy:-2,skill:{etiquette:1}},
            },
          },
          {
            t: "Skip to business after the first cup",
            r: "The guest drinks, sets the cup down and leaves without a word. Your mother will not speak to you till evening.",
            fx: {honor:-2,happy:-2},
          },
          {
            t: "Ask the guest's news over the second cup",
            check: {s:"ins",s2:"persuasion",d:36},
            win: {
              r: "Over the second cup the guest tells you which lords are wearing green borders this year and which are quietly buying blue thread. Useful.",
              fx: {skill:{intrigue:2},int:.3},
            },
            lose: {r:"The guest talks about cattle. Only cattle. For an hour.",fx:{wil:.3}},
          },
        ],
      },
      {
        id: "ss_ab_raid",
        title: "Sevenfold",
        cond: (p,C)=>C.realm(p,"POL-22")&&grown(p,C)&&!C.old(p),
        w: 1,
        cool: 6,
        text: ()=>`Cattle raiding between the valleys is the oldest sport of the Abari highlands, and the law that cattle theft is repaid sevenfold has never stopped it. Young men of ${A.pick(["the next valley","a Mandari village","a Tsega lord's herd-camp"])} took four of your family's cows at dawn. Your cousins are already sharpening spears.`,
        choices: [
          {
            t: "Raid them back by night",
            check: {s:"stealth",s2:"husbandry",d:42},
            win: {
              r: "You bring back six cows, two of them theirs, singing all the way. The valley elders call it even and everybody drinks honey wine.",
              fx: {coin:20,skill:{stealth:2,husbandry:1},fame:1},
            },
            lose: {
              r: "Their herd boys were awake. Spears in the dark, and you limp home without a cow.",
              fx: {health:-12,wound:"deep_cut",wil:1,cause:"a cattle raid"},
            },
          },
          {
            t: "Take it to the lord for sevenfold",
            check: {s:"persuasion",s2:"learning",d:40},
            win: {
              r: "The lord finds for you. Twenty-eight cows, or their worth. The other valley will hate you for a generation, but you will be rich in that generation.",
              fx: {coin:60,newRel:{type:"enemy",op:-30}},
            },
            lose: {r:"The lord follows the other king this year. So does his judgment.",fx:{wil:1,happy:-4}},
          },
          {
            t: "Track the cows and buy them back at the market",
            check: {s:"tracking",s2:"trade",d:38},
            win: {
              r: "The hides from your own cows turn up in Tanners' Lane. Live ones too. You buy back three for less than they are worth.",
              fx: {coin:-6,skill:{tracking:2,trade:1}},
            },
            lose: {r:"The trail ends at a river.",fx:{coin:-15}},
          },
        ],
      },
      {
        id: "ss_ab_pike",
        title: "The Spear Yard of Zutati",
        cond: (p,C)=>C.realm(p,"POL-22")&&C.adult(p)&&!C.old(p)&&(C.soldier(p)||C.male(p))&&free(p),
        w: 1,
        cool: 7,
        text: p=>`At the Spear Yard of Zutati, Kebede the Pike drills the highland spearmen in the pike hedge: five meters of ash, held level, a wall of points on the terraces. ${early()?"Eight thousand pikes are holding Tamowa against the Zanari, and every hand is wanted.":"The northern host is short of men again."}`,
        choices: [
          {
            t: "Stand in the front rank and hold",
            check: {s:"spear",s2:"wil",d:44},
            win: {
              r: 'Kebede sends a man on a horse straight at the hedge. You hold your point. The horse turns. "That," says Kebede, "is the whole of war."',
              fx: {skill:{spear:3,shield:1},wil:1,merit:2,gear:{weapon:"pike"}},
            },
            lose: {
              r: "You flinch, the hedge opens, and the horse goes through. You do drill alone for a week.",
              fx: {skill:{spear:2},wil:1.5},
            },
          },
          {
            t: "Learn the terrace defense from the old sergeants",
            r: "Where to stand on a terrace wall, where the ground favors you, how to make an enemy climb. The highlands are a fortress if you read them.",
            fx: {skill:{tactics:3},int:.3},
          },
          {
            t: "Volunteer for Tamowa",
            req: ()=>early(),
            check: {s:"sta",s2:"spear",d:40},
            win: {
              r: "A month at Tamowa, watching the Zanari campfires multiply across the valley. Nobody attacks. You come home a veteran of nothing, which is the best kind.",
              fx: {merit:3,skill:{spear:2},coin:8,fame:1},
            },
            lose: {
              r: "Fever in the camp at Tamowa. You come home thin and shaking.",
              fx: {health:-14,wil:1.5,cause:"camp fever at Tamowa"},
            },
          },
        ],
      },
      {
        id: "ss_ab_source",
        title: "The Source rite",
        cond: (p,C)=>C.realm(p,"POL-22")&&C.ageAdj(p)>=10,
        w: .9,
        cool: 7,
        text: p=>`In May, at the headwaters of the Monuti near Mazezi, the Keeper of the Source performs the rite that Tamar believes keeps its flood coming. ${early()?"This year Dawit Mekonen has threatened to put it off unless Tamar pays its river gift in silver.":"Tamari envoys watch every gesture."} You have come with your village to carry offerings.`,
        choices: [
          {
            t: "Carry the honey and butter to the spring",
            r: "The water comes out of the rock clear and cold. You pour the honey. Somewhere far downriver, a kingdom of millions waits on this little spring.",
            fx: {piety:4,happy:2},
          },
          {
            t: "Talk to the Tamari envoys",
            check: {s:"diplomacy",s2:"ins",d:40},
            win: {
              r: "A flood-priest's clerk, nervous and far from home, tells you the Tamari blame the Abari terraces for their low floods. You tell him about the rains. You part as something like friends.",
              fx: {skill:{diplomacy:2},int:.4,newRel:{type:"friend",op:15}},
            },
            lose: {r:"They treat you like a goatherd, which you may be.",fx:{}},
          },
          {
            t: "Slip a coin into the spring and wish",
            r: "An old Abari habit the priests pretend not to see. You wish for rain. You suspect half of Tamar is wishing the same thing.",
            fx: {coin:-1,piety:1,happy:1},
          },
        ],
      },
      {
        id: "ss_ab_clay",
        title: "Bones in the rift clay",
        cond: (p,C)=>C.realm(p,"POL-22")&&C.adult(p)&&!C.noble(p),
        w: .8,
        cool: 9,
        text: "Hailu the Digger of the Diggers of the Rift Clay is hiring strong backs. In the red clay of the rift they dig up skulls, strange heavy-browed skulls the Rememberers say belong to the first ancestors. Digging the ancestors is holy work, and well paid.",
        choices: [
          {
            t: "Dig carefully with Hailu",
            check: {s:"craft",s2:"int",d:40},
            win: {
              r: "Your trowel finds a jaw with every tooth in it. Hailu sits back on his heels and says nothing for a long time. Then he writes your name in his book beside it.",
              fx: {coin:12,skill:{craft:2,learning:2},fame:1,int:.4},
            },
            lose: {
              r: "Your pick goes straight through a skull. Hailu does not shout. He just looks.",
              fx: {coin:4,happy:-3},
            },
          },
          {
            t: "Sell a skull to a foreign collector",
            check: {s:"trade",s2:"deception",d:44},
            win: {
              r: 'A dwarf iron-buyer pays twenty suns in gold for a skull "for his studies". The Rememberers would call it selling your grandmother.',
              fx: {coin:20,piety:-4,honor:-2},
            },
            lose: {r:"Hailu catches you wrapping it. You never dig in the rift again.",fx:{honor:-4,piety:-3}},
          },
          {
            t: "Ask the Rememberers who they were",
            r: '"The first ones," says an old Rememberer. "Before the names. Before the High One withdrew." She pours a libation on the clay.',
            fx: {piety:3,int:.3},
          },
        ],
      },
      {
        id: "ss_ab_deadking",
        title: "Forty salt bars",
        cond: (p,C)=>C.realm(p,"POL-22")&&C.ageAdj(p)>=12,
        w: .8,
        cool: 9,
        setup: (p,ctx)=>{ctx.n=loc(p,"M")},
        text: "At the honey-wine house a drunk singer named {n} starts a song about the Twin War and bellows the name of a dead king, right there, outside any rite. Speaking a dead king's name outside a rite costs forty salt bars. A lord's man is drinking by the door, and he is smiling.",
        choices: [
          {
            t: "Drown him out with a louder song",
            check: {s:"music",s2:"wil",d:38},
            win: {
              r: "You launch into a Green Court praise song and the whole house joins in. The lord's man cannot swear what he heard.",
              fx: {skill:{music:2},newRel:{type:"friend",op:25},happy:2},
            },
            lose: {
              r: "Your song is worse than his and twice as loud. The lord's man fines you both.",
              fx: {coin:-10,happy:-2},
            },
          },
          {
            t: "Pay half his fine",
            req: p=>p.coin>=5,
            r: "Twenty salt bars. {n} weeps on your shoulder and swears you a brother. He is still a terrible singer.",
            fx: {coin:-5,honor:1,newRel:{type:"friend",op:30}},
          },
          {
            t: "Say nothing and finish your wine",
            r: "The lord's man takes {n} outside. The wine tastes thinner after that.",
            fx: {},
          },
        ],
      },
      {
        id: "ss_ab_honey",
        title: "Cliff honey",
        cond: (p,C)=>C.realm(p,"POL-22")&&grown(p,C)&&!C.old(p),
        w: .9,
        cool: 7,
        text: "Wild bees have built a great comb on the cliff above the terraces. Abara's honey and wax sell well, and honey wine sells better. Your uncle has a rope, a smoking torch of grass and no wish to climb it himself.",
        choices: [
          {
            t: "Climb down on the rope with the smoke",
            check: {s:"athletics",s2:"wil",d:40},
            win: {
              r: "Smoke, buzzing, and a comb the size of a shield in your basket. Your uncle brews honey wine, and the whole village owes you a cup.",
              fx: {coin:12,skill:{athletics:2},happy:3},
            },
            lose: {
              r: "The smoke blows the wrong way. You come down covered in stings and without the honey.",
              fx: {health:-8,wil:1,cause:"bee stings"},
            },
          },
          {
            t: "Build hives on the terraces and lure a swarm",
            check: {s:"husbandry",s2:"craft",d:38},
            win: {
              r: "Clay pots, a little old comb, and patience. By autumn three hives hum by the coffee bushes.",
              fx: {skill:{husbandry:3,craft:1},coin:6},
            },
            lose: {r:"The swarm takes one look at your pots and goes to the neighbor's.",fx:{happy:-1}},
          },
          {
            t: "Let the bees be",
            r: "Your uncle calls you a coward. The bees call you nothing, which suits you fine.",
            fx: {trait:"cautious"},
          },
        ],
      },
      {
        id: "ss_ab_terrace",
        title: "The terrace wall",
        cond: (p,C)=>C.realm(p,"POL-22")&&C.adult(p)&&!C.noble(p),
        w: 1,
        cool: 7,
        text: "The long rains have brought down a terrace wall above your fields, and a slope of red mud has buried two rows of barley. Fikru the Terrace-Maker, who builds the walls the Tamari priests fear, says a wall built wrong will come down again next year.",
        choices: [
          {
            t: "Rebuild it with your own hands",
            check: {s:"str",s2:"craft",d:40},
            win: {
              r: "Stone by stone, angled into the hill as Fikru showed you. It stands. Your grandchildren will farm behind it.",
              fx: {str:.6,skill:{craft:3},honor:1},
            },
            lose: {
              r: "It comes down in the next storm. Fikru shakes his head and starts showing you again.",
              fx: {str:.3,wil:1,coin:-4},
            },
          },
          {
            t: "Hire Fikru's crew (15 suns)",
            req: p=>p.coin>=15,
            r: "They build it in four days, singing. It will outlast you.",
            fx: {coin:-15,happy:2},
          },
          {
            t: "Ask Fikru why the Tamari fear the terraces",
            r: '"They think our walls drink their flood," he says. "Every terrace holds a little water back. A thousand terraces hold a little more." He grins. "Maybe they are right."',
            fx: {int:.5,skill:{craft:1}},
          },
        ],
      },
      {
        id: "ss_ab_pedlar",
        title: "The pedlar's question",
        cond: (p,C)=>C.realm(p,"POL-22")&&C.adult(p),
        w: .9,
        cool: 9,
        text: "A friendly pedlar called Desta, who sells needles and blue thread in every village, asks you whether anyone in your valley has been sending letters south to Mandi, or further, to Tessar. Plotting between the courts is treason. Everyone knows the southern lords write to the exiled Prince Tekle.",
        choices: [
          {
            t: "Tell him about the lord's steward's letters",
            check: {s:"intrigue",s2:"ins",d:40},
            win: {
              r: "He pays you in salt bars and goes away whistling. A month later the steward vanishes. You do not ask where.",
              fx: {coin:8,honor:-4,skill:{intrigue:2}},
            },
            lose: {
              r: "He pays you and then sells what you said to the steward, too. Desta sells everything twice.",
              fx: {coin:8,newRel:{type:"enemy",op:-25}},
            },
          },
          {
            t: "Buy a needle and say nothing",
            r: "A very expensive needle. He shrugs and moves on. Desta always comes back.",
            fx: {coin:-1,trait:"cautious"},
          },
          {
            t: "Ask him who pays him",
            check: {s:"ins",s2:"persuasion",d:46},
            win: {
              r: `He laughs, and for a moment drops the pedlar's face. "The Marshal of the North pays well," he says, "and so do others." You have learned something dangerous.`,
              fx: {int:.5,flag:"ss_ab_desta",skill:{intrigue:1}},
            },
            lose: {r:'"My mother pays me, in scolding," he says, and that is that.',fx:{}},
          },
        ],
      },
      {
        id: "ss_ab_hides",
        title: "Forty hides with a brand",
        cond: (p,C)=>C.realm(p,"POL-22")&&C.adult(p)&&(C.job(p,"merchant","labor","herd")||C.town(p)),
        w: .8,
        cool: 9,
        text: "In Tanners' Lane, where the hide-buyers ask no questions about brands, you are offered forty hides cheap. They carry the brand of House Tsega, whose lord is the Marshal of the Northern Host. Meron the Red Cow's people steal Tsega cattle, everyone says, and pass the skins through here.",
        choices: [
          {
            t: "Buy them and scrape the brands",
            check: {s:"craft",s2:"stealth",d:42},
            win: {
              r: "Forty clean hides, sold to a Koyako salt carrier for twice what you paid. The brand is gone; so is your conscience, for a week.",
              fx: {coin:25,honor:-3,skill:{craft:1}},
            },
            lose: {
              r: "Gebre Tsega's men find a hide with half a brand in your yard. They hang the seller, and fine you heavily.",
              fx: {coin:-30,honor:-4,favor:-3},
            },
          },
          {
            t: "Tell the Tsega steward where the hides are",
            r: "The steward's men take the hides and the seller. The seller swears he bought them at Mandi. You get a cow for your trouble.",
            fx: {coin:20,favor:2,newRel:{type:"enemy",op:-20}},
          },
          {
            t: "Walk away from Tanners' Lane",
            r: "You never saw any hides. You are getting very good at not seeing things in Abara.",
            fx: {},
          },
        ],
      },
      {
        id: "ss_ab_toast",
        title: "The wrong toast",
        cond: (p,C)=>C.realm(p,"POL-22")&&C.adult(p)&&free(p),
        w: .9,
        cool: 8,
        text: p=>`A lord's feast: raw beef with spiced butter, honey wine in horns, the long horns blowing. The lord wears a ${early()?"green":A.pick(["green","blue"])} border on his white shawl. A drunk guest rises and toasts the other twin king, loudly. "Two crowns, one land," someone mutters into the silence.`,
        choices: [
          {
            t: "Raise your horn to both kings and laugh",
            check: {s:"diplomacy",s2:"etiquette",d:40},
            win: {
              r: '"To both kings, and to the Queen Mother who keeps them!" The hall laughs with relief. The lord sends you the best cut of beef.',
              fx: {skill:{diplomacy:3},favor:2,fame:1},
            },
            lose: {
              r: "Half the hall thinks you mocked the lord, the other half thinks you mocked the guest.",
              fx: {honor:-2,happy:-3},
            },
          },
          {
            t: "Shout down the guest for the lord's king",
            check: {s:"intimidation",s2:"str",d:38},
            win: {
              r: "The guest sits. The lord nods at you. You have chosen a side in Abara, out loud.",
              fx: {favor:4,honor:1,newRel:{type:"enemy",op:-20}},
            },
            lose: {
              r: "The guest throws his horn at you, then a fist. The feast becomes a brawl.",
              fx: {
                duel: {
                  tier: 2,
                  title: "a drunk guest",
                  troop: "LI",
                  opts: {kind:"brawl",place:"the feast hall",lethal:!1,toYield:!0,title:"A brawl at the feast"},
                },
              },
            },
          },
          {
            t: "Eat your beef and watch who cheers",
            check: {s:"ins",s2:"intrigue",d:38},
            win: {
              r: "Three guests drink to the other king, quietly. You remember their faces. In Abara that is a kind of wealth.",
              fx: {skill:{intrigue:2},int:.3},
            },
            lose: {r:"Everyone drinks to everything. It is a long feast.",fx:{happy:2}},
          },
        ],
      },
      {
        id: "ss_ab_monundi",
        title: "The Horsemen of the Monundi",
        cond: (p,C)=>C.realm(p,"POL-22")&&C.adult(p)&&!C.old(p)&&(C.mounted(p)||C.prof(p,"riding",30)||C.famKind(p,"horse","gentry","gentry_mil")),
        w: .9,
        cool: 9,
        text: p=>`Riders of House Mandari are recruiting in the southern horse country for the Horsemen of the Monundi, six thousand cavalry who fought for Prince Kiros in the Twin War and still remember him. ${early()?"Gossip says the gold for new horses comes from Zanara.":"They pay well, and ask where your heart lies."}`,
        choices: [
          {
            t: "Ride the trial at Mandi",
            check: {s:"riding",s2:"mounted",d:46},
            win: {
              r: "Down a terrace, across a ford, up the far slope at the gallop. Yohannes Mandari himself gives you a horse and a place.",
              fx: {skill:{riding:3,mounted:2},gear:{mount:"horse"},flag:"ss_ab_monundi",fame:1},
            },
            lose: {
              r: "Your horse refuses the ford and you go in alone.",
              fx: {skill:{riding:1},happy:-3,health:-3,cause:"a fall in a ford"},
            },
          },
          {
            t: "Ask who the Horsemen would follow if the crown fell",
            check: {s:"intrigue",s2:"ins",d:44},
            win: {
              r: 'A drunk old rider answers before his captain can stop him: "Tekle." The word hangs in the air like smoke.',
              fx: {int:.5,flag:"ss_ab_tekle"},
            },
            lose: {
              r: "The captain asks who sent you. It is not a friendly question.",
              fx: {newRel:{type:"enemy",op:-15}},
            },
          },
          {
            t: "Decline. Southern lords who write to exiles end badly",
            r: "You go home. Plotting between the courts is treason, and you like your neck.",
            fx: {trait:"cautious"},
          },
        ],
      },
      {
        id: "ss_ab_grain",
        title: "The grain store",
        cond: (p,C)=>C.realm(p,"POL-22")&&C.adult(p)&&C.married(p),
        w: .8,
        cool: 9,
        text: p=>`In Abara women own the house and the grain store, and men own the cattle. Buyers from the Zanari camp across the valley are paying high for grain and cattle, enemy army or not. ${SEX(p,"{spouse} says the grain is staying in the store, and it is hers to say.","Your husband {spouse} wants to sell the grain along with his cattle. It is your grain.")}`,
        choices: [
          {
            t: "Sell to the Zanari for the high price",
            check: {s:"trade",s2:"ins",d:40},
            win: {
              r: "Gold dust for grain. The family eats well this year. What the Zanari army does with your barley is the Zanari army's business.",
              fx: {coin:30,honor:-2,skill:{trade:2}},
            },
            lose: {
              r: "The lord's men stop the cart at the ford. Selling to the enemy camp is not treason this month, but it costs a fine.",
              fx: {coin:-10,favor:-2},
            },
          },
          {
            t: "Keep the grain. Armies make hungry winters",
            r: "The store stays full. When the war season comes and the prices go mad, your family does not go hungry.",
            fx: {honor:1,wil:.5,rel:{who:"spouse",op:5}},
          },
          {
            t: "Sell half, quietly, to Abari soldiers instead",
            r: "Gebre Tsega's quartermaster pays less than the Zanari, but in good salt bars, and with thanks.",
            fx: {coin:12,favor:2},
          },
        ],
      },
      {
        id: "ss_ab_smith",
        title: "Land for a smith",
        cond: (p,C)=>C.realm(p,"POL-22")&&C.adult(p)&&(C.job(p,"smith","mason","carpenter")||p.status==="artisan"),
        w: 1,
        cool: 10,
        text: "The smith and potter clans of Abara may not own land, however good their iron. A farmer whose sons died of fever wants to sell you his terrace field quietly, written down in some other man's name. Dwarf smiths who come for Abari iron are welcome; Abari smiths stay in the Round Town.",
        choices: [
          {
            t: "Buy it in a cousin's name (40 suns)",
            req: p=>p.coin>=40,
            check: {s:"intrigue",s2:"persuasion",d:40},
            win: {
              r: "Your cousin farms it and you take half. Nobody looks too closely. You have land, after a fashion.",
              fx: {coin:-40,asset:"farm",honor:-1},
            },
            lose: {
              r: "The lord hears of it. The field is confiscated and so is your money.",
              fx: {coin:-40,honor:-3,wil:1},
            },
          },
          {
            t: "Forge the lord a blade and ask his leave",
            check: {s:"craft",s2:"persuasion",d:50},
            win: {
              r: 'The lord turns the blade in the light and laughs. "A smith with land. Why not?" A charter in his hand, and a field in yours.',
              fx: {asset:"farm",skill:{craft:3},fame:2},
            },
            lose: {r:"He keeps the blade and refuses the field.",fx:{coin:-10,happy:-4}},
          },
          {
            t: "Stay a smith, landless and proud",
            r: "Iron is your field. The farmer sells to a lord, who never pays him the full price.",
            fx: {trait:"proud"},
          },
        ],
      },
      {
        id: "ss_ab_sealed",
        title: "The sealed house",
        cond: (p,C)=>early()&&C.realm(p,"POL-22")&&C.adult(p)&&C.town(p),
        w: .8,
        once: !0,
        text: "At dawn on New Year's Day the Rememberers sealed the Blue House, King Yonas's hall, until next year. Now a servant sealed inside by mistake has slipped a message out under the door: she has seen papers about Tamowa that King Yonas left behind, and she wants out before King Yared's men find her.",
        choices: [
          {
            t: "Get her out over the back wall",
            check: {s:"stealth",s2:"athletics",d:48},
            win: {
              r: "A rope at midnight, a frightened woman, and a fast walk to the Round Town. She thanks you and tells you what she saw: a secret clause about Tamowa in Yonas's promise to Zanara.",
              fx: {honor:4,skill:{stealth:2},flag:"ss_ab_clause",newRel:{type:"friend",op:30}},
            },
            lose: {
              r: "The Green Twin Guard is watching the wall. You run. She does not get out.",
              fx: {wil:1.5,happy:-6},
            },
          },
          {
            t: "Tell the Rememberers; they keep the peace between the courts",
            r: "Selam the Knot-Keeper's people unseal the door for an hour, take the servant out, and seal it again. Nobody speaks of papers.",
            fx: {honor:2,piety:2},
          },
          {
            t: "Leave it alone. That door is a king's business",
            r: "You never learn what happened to her. You do not want to.",
            fx: {trait:"cautious",happy:-2},
          },
        ],
      },
      {
        id: "ss_ab_queenmother",
        title: "The Queen Mother's summons",
        cond: (p,C)=>C.realm(p,"POL-22")&&C.adult(p)&&(C.noble(p)||p.status==="gentry"),
        w: .8,
        cool: 9,
        text: 'Saba Asfari, the Queen Mother, is the only person both courts obey. She summons you to the Crown Yard and asks you, with great courtesy, to carry a gift of honey and a silver neck-ring to the twin who does not hold the crown this year, at Nusalo. "Brothers forget they are brothers," she says.',
        choices: [
          {
            t: "Carry it faithfully",
            check: {s:"diplomacy",s2:"etiquette",d:40},
            win: {
              r: "The king at Nusalo receives you, the honey and his mother's message, and asks after her health for an hour. Both courts note your name, kindly.",
              fx: {skill:{diplomacy:3},favor:3,fame:2},
            },
            lose: {
              r: "The king at Nusalo thinks the gift is a slight from his twin. You are sent home without a meal.",
              fx: {favor:-2,happy:-3},
            },
          },
          {
            t: "Ask her what she really wants said",
            check: {s:"ins",s2:"etiquette",d:46},
            win: {
              r: 'She smiles. "That his mother is watching both of them," she says. "That is all, and it is enough." You deliver it word for word.',
              fx: {int:.5,skill:{intrigue:2},favor:4},
            },
            lose: {r:'"Only the honey," she says coldly. You have been too clever.',fx:{favor:-1}},
          },
          {
            t: "Beg off with an illness",
            r: "She looks at you for a long moment and chooses someone else. You are not summoned again.",
            fx: {favor:-3},
          },
        ],
      },
      {
        id: "ss_sb_nightfire",
        title: "The Night of Fire",
        cond: (p,C)=>C.realm(p,"POL-24")&&C.ageAdj(p)>=8,
        w: 1.1,
        cool: 4,
        text: "19 August, the Night of Fire, for the burning of the Qadiri fleet in 1024. Bonfires on the harbor, the black towers lit from below, and at the naming wall the names of divers lost at sea this year are read out one by one. The fire-boat crews march past with torches, singing.",
        choices: [
          {
            t: "Stand at the naming wall for the divers",
            r: "Forty names this year, most of them slaves, read out the same as the free. The sea makes no difference between them. Neither, tonight, does Sabra.",
            fx: {wil:1,piety:3},
          },
          {
            t: "March with the fire-boat crews",
            check: {s:"sta",s2:"music",d:30},
            win: {
              r: 'Torch high, voice hoarse, you march to the black towers. A fire-boat captain slaps your shoulder: "Come and see us in the spring."',
              fx: {happy:4,fame:1,flag:"ss_sb_fireboat"},
            },
            lose: {
              r: "Your torch drips burning pitch on your arm. The crews laugh. Fire is like that.",
              fx: {health:-4,cause:"a pitch burn"},
            },
          },
          {
            t: "Ask an old man what he remembers of 1024",
            check: {s:"persuasion",s2:"int",d:32},
            win: {
              r: '"I was six," he says. "The sea burned. The Qadiri sailors screamed as they jumped into fire. We cheered." He is not cheering now.',
              fx: {int:.5,wil:.6},
            },
            lose: {r:"He tells you about his knees instead.",fx:{}},
          },
        ],
      },
      {
        id: "ss_sb_bestpearl",
        title: "The best pearl of the boat",
        cond: (p,C)=>C.realm(p,"POL-24")&&C.adult(p)&&!C.noble(p),
        w: 1,
        cool: 6,
        text: "The Emir takes the best pearl of every boat each week. This week your boat's best is a rose-colored pearl the size of a chickpea, the finest anyone has seen since spring. The Emir's weigher comes to the Pearl Quay at noon. The Ropewalk Brothers, harbor boys who speak Corsair cant, buy stolen pearls at a quarter of their worth.",
        choices: [
          {
            t: "Hand the rose pearl to the Emir's weigher",
            r: "He holds it to the light and whistles. Your boat is noted as a lucky one. Next week the Pearl-Master sends you to the richest bank.",
            fx: {honor:2,favor:3,coin:4},
          },
          {
            t: "Swap it for the second-best before he comes",
            check: {s:"stealth",s2:"deception",d:46},
            win: {
              r: "The weigher takes a good white pearl and never knows. The rose pearl sits in your cheek for a week, then sells in Sabra for a small fortune.",
              fx: {coin:50,honor:-3,skill:{stealth:2}},
            },
            lose: {
              r: "The boat's master saw the swap and wants half. Then the weigher hears. Pearl theft is a hand at the third offense, and a beating at the first.",
              fx: {punish:"theft"},
            },
          },
          {
            t: "Sell it to the Ropewalk Brothers fast",
            check: {s:"trade",s2:"intrigue",d:38},
            win: {
              r: "A quarter of its worth is still a lot of silver. The boys vanish into the alleys with it.",
              fx: {coin:18,honor:-2,skill:{intrigue:1}},
            },
            lose: {r:'They pay you in a "pearl" of their own, glass with a good shine.',fx:{coin:-2,happy:-4}},
          },
        ],
      },
      {
        id: "ss_sb_wetconvert",
        title: "The wet converts",
        cond: (p,C)=>C.realm(p,"POL-24")&&C.adult(p)&&bond(p),
        w: 1.4,
        cool: 4,
        text: `A believer may not be enslaved, but the law is unclear on a slave who converts. Mahmud the Just, the Chief Well-Keeper, has begun freeing slave divers who take the Path of the Well. The Pearl-Master Jamila Sabrani's men are hiding converts from his count. Tonight a Well-Keeper's boy whispers through the pen fence: "Do you believe?"`,
        choices: [
          {
            t: "Recite the water-prayer to the Well-Keepers",
            check: {s:"faith",s2:"wil",d:40},
            win: {
              r: "You wash your hands and speak the prayer at the Well-house, in front of Mahmud himself. He writes your name. The next morning the pen gate opens for you.",
              fx: p=>(p.faith="REL-07",p.piety=A.clamp(p.piety+8,0,100),setFree(p,"ss_sb_freed")),
            },
            lose: {
              r: "Jamila's men move you to Azara before the Keepers reach the pens. Your name is not on any list.",
              fx: {wil:2.5,happy:-10},
            },
          },
          {
            t: "Say you believe, to get out",
            check: {s:"deception",s2:"faith",d:46},
            win: {
              r: "The words come out right. The Well-Keepers free you. The Giver, the Keepers say, judges hearts, not mouths. You hope so.",
              fx: p=>(p.faith="REL-07",setFree(p,"ss_sb_freed")),
            },
            lose: {
              r: 'Mahmud looks into your face and sees nothing there. "Come back when you mean it," he says, not unkindly.',
              fx: {wil:1.5,piety:1},
            },
          },
          {
            t: "Keep your own gods and keep diving",
            r: "You will not trade your gods for a door. The sea is cold and the stones are heavy. Your pride is warm.",
            fx: {wil:2,trait:"stubborn",sta:.4},
          },
        ],
      },
      {
        id: "ss_sb_heat",
        title: "The heat chase",
        cond: (p,C)=>C.realm(p,"POL-24")&&C.adult(p)&&!C.old(p)&&(C.soldier(p)||C.prof(p,"riding",25)),
        w: .9,
        cool: 7,
        text: p=>`At the Camel School of Hazim, Nuri Hazimi drills the Emir's camel riders to fight at noon, when the heat is a weapon. Sabrani officers, salt-skinned, outlast anyone in the heat, as long as they have salt and water. ${A.C.blood(p,"saltskin")?"You have that blood. The heat feels like a warm bath.":"You do not have their blood. You have a water skin."}`,
        choices: [
          {
            t: "Ride the noon chase across the flats",
            check: {s:"sta",s2:"riding",d:48},
            win: {
              r: "Two hours at a run, lance in hand, the white sun on your neck. Nuri says you would make a camel lancer of the Emir's guard.",
              fx: {sta:.8,skill:{riding:3,lance:1},merit:2,gear:{mount:"camel"}},
            },
            lose: {
              r: "You go down from the saddle in the second hour, white-faced, and wake with a wet cloth on your head.",
              fx: {health:-12,wil:1.5,cause:"heat sickness"},
            },
          },
          {
            t: "Eat salt, drink, and pace yourself",
            check: {s:"survival",s2:"int",d:40},
            win: {
              r: "Salt, water, slow at first. By the end you are the freshest rider on the flats.",
              fx: {skill:{survival:2,riding:1},int:.3},
            },
            lose: {
              r: "Too much salt, too little water. You spend the afternoon being sick behind a dune.",
              fx: {health:-5,cause:"heat sickness"},
            },
          },
          {
            t: "Ask how Sabra means to fight Qadir",
            r: 'Nuri points north. "We never meet their fleet head-on," he says. "We burn it. And on land, we wait for noon." He does not smile.',
            fx: {skill:{tactics:2}},
          },
        ],
      },
      {
        id: "ss_sb_token",
        title: "The dead cook's token",
        cond: (p,C)=>C.realm(p,"POL-24")&&C.adult(p)&&(C.coast(p)||C.town(p)),
        w: .8,
        once: !0,
        text: "Rima the Water-Seller, who carries the Well-Keepers' water to the pens, takes you aside. She has a dead cook's token that opens the Oil Shore gate, and she wants passage off the coast before anyone learns she has it. Entering the Oil Shore without the Emir's token is death. A Varennan sailor buys water from her every day.",
        choices: [
          {
            t: "Buy the token from her (20 suns)",
            req: p=>p.coin>=20,
            r: "A small bronze tag with the Emir's flame. Rima is gone on the next dhow. You have a death sentence in your purse, and a key.",
            fx: {coin:-20,flag:"ss_sb_token"},
          },
          {
            t: "Find her a berth on a ship, and refuse the token",
            check: {s:"persuasion",s2:"sea",d:38},
            win: {
              r: "A Blackreef half-orc captain owes you a favor. Rima sails at dawn. She throws the token into the harbor from the deck.",
              fx: {honor:3,newRel:{type:"friend",op:20}},
            },
            lose: {r:"No captain will take a woman the Emir's men might be looking for.",fx:{happy:-2}},
          },
          {
            t: "Tell the Oil Shore Watch",
            r: "The Watch takes the token, and Rima. The Emir's men pay well for silence. You hear nothing of her again.",
            fx: {coin:25,favor:4,honor:-5},
          },
        ],
      },
      {
        id: "ss_sb_notebook",
        title: "The Varennan's notebook",
        cond: (p,C)=>C.realm(p,"POL-24")&&C.adult(p)&&C.coast(p),
        w: .8,
        once: !0,
        text: 'A Varennan sailor who asked too many questions about "lamp oil" is found drowned in the harbor. Asking about lamp oil is what gets strangers killed in Sabra. You saw him yesterday hide a little oilcloth packet under a loose stone by the Pearl Quay.',
        choices: [
          {
            t: "Take the packet and read it",
            check: {s:"stealth",s2:"int",d:42},
            win: {
              r: "A notebook in Varennan: smoke at Zariya, jar marks, ship names, dates. It is a rope to hang a whole emirate. You hide it somewhere very safe.",
              fx: {flag:"ss_sb_notebook",int:.5,skill:{stealth:2}},
            },
            lose: {r:"Someone else is watching the stone. You walk past as if you were never interested.",fx:{wil:.5}},
          },
          {
            t: "Take it to the Emir's house",
            check: {s:"persuasion",s2:"etiquette",d:40},
            win: {
              r: 'A steward takes it without opening it and gives you a gold dinar. "You found nothing," he says. You agree.',
              fx: {coin:27,favor:4},
            },
            lose: {
              r: "The steward asks whether you read it. You did not. He does not believe you.",
              fx: {coin:10,newRel:{type:"enemy",op:-20}},
            },
          },
          {
            t: "Leave it where it is",
            r: "Some stones should stay unturned. You stop walking past the Pearl Quay.",
            fx: {trait:"cautious"},
          },
        ],
      },
      {
        id: "ss_sb_goldroad",
        title: "The spring gold caravan",
        cond: (p,C)=>C.realm(p,"POL-24")&&C.adult(p)&&!C.old(p)&&free(p),
        w: 1,
        cool: 7,
        text: "Each spring the Gold Road caravan comes down the Bahesh from Zanara, and Faisal the Broker's caravan brokers buy the gold and sell it north. This year they want extra guards to meet the caravan upriver, because war may close the river and the Sand Clans are angry about something.",
        choices: [
          {
            t: "Ride guard for the brokers",
            check: {s:"ins",s2:"riding",d:42},
            win: {
              r: "Three weeks on the river road, no trouble but flies. The brokers pay in gold dust off the top of the weights.",
              fx: {coin:30,skill:{riding:2},sta:.4},
            },
            lose: {
              r: "Raiders hit the caravan at the Bahesh crossing. You keep your life and lose your pay.",
              fx: {health:-12,wound:"scar_arm",cause:"caravan raiders"},
            },
          },
          {
            t: "Clerk for the brokers, weighing the gold",
            req: (p,C)=>C.literate(p)||C.prof(p,"trade",25),
            check: {s:"trade",s2:"int",d:42},
            win: {
              r: "You notice the Zanari weights run a little light, one part in fifty. Faisal pays you a bonus to say nothing and keep noticing.",
              fx: {coin:25,skill:{trade:3},flag:"ss_sb_weights"},
            },
            lose: {r:"You get the sums wrong and the brokers dock your pay.",fx:{coin:5}},
          },
          {
            t: "Stay home. Gold draws knives",
            r: "You hear later that the caravan arrived safe. Next year, maybe.",
            fx: {},
          },
        ],
      },
      {
        id: "ss_sb_pens",
        title: "Moving the divers",
        cond: (p,C)=>early()&&C.realm(p,"POL-24")&&C.adult(p)&&free(p),
        w: .9,
        once: !0,
        text: "Jamila Sabrani, the Pearl-Master and the Emir's sister, owns most of the slave divers. Before Well Day she is hiring guards to move forty divers out of the pens behind the Pearl Quay, before the Chief Well-Keeper can count them. They have converted, and Mahmud the Just would free them.",
        choices: [
          {
            t: "Take her silver and guard the move",
            r: "Forty silent men and women walked to Azara by night. You are paid well. You do not sleep well.",
            fx: {coin:30,honor:-5,wil:.5},
          },
          {
            t: "Tell the Well-Keepers when the move will be",
            check: {s:"intrigue",s2:"stealth",d:44},
            win: {
              r: "Mahmud's men are waiting on the Azara road with lanterns and the Book. Forty divers walk free. Jamila Sabrani does not know your name. Yet.",
              fx: {honor:6,piety:4,fame:2,deed:"Betrayed the Pearl-Master's move to the Well-Keepers"},
            },
            lose: {
              r: "The move happens a night early. Jamila's men wonder who talked, and look at the new guards.",
              fx: {newRel:{type:"enemy",op:-30},honor:2},
            },
          },
          {
            t: "Turn her down",
            r: "There are plenty of hungry men on the Pearl Quay. Someone else takes the silver.",
            fx: {honor:1},
          },
        ],
      },
      {
        id: "ss_sb_towers",
        title: "The black towers",
        cond: (p,C)=>C.realm(p,"POL-24")&&kid(p,C,6,13),
        w: 1,
        once: !0,
        text: "The harbor towers of Sabra are black with old soot from 1024, and are never washed. Your grandfather says that is so nobody forgets the night the Qadiri fleet burned and Sabra became free. The harbor children dare each other to climb the black stones and touch the soot.",
        choices: [
          {
            t: "Climb and touch the soot",
            check: {s:"athletics",s2:"wil",d:22},
            win: {
              r: "Black fingers, wild heart. You wave them at the harbor from halfway up. The guards shout and laugh.",
              fx: {skill:{athletics:2},happy:4,trait:"brave"},
            },
            lose: {
              r: "You slip and slide down the blackened stone into a heap of nets. Your mother scrubs you for an hour.",
              fx: {happy:-2,health:-2,cause:"a fall from the harbor tower"},
            },
          },
          {
            t: "Ask your grandfather to tell it again",
            r: "The fire-boats in the night, the oil on the water, the screaming. He tells it every time as if it were new. You learn it by heart.",
            fx: {int:.3,skill:{learning:1},rel:{who:"grandfather",op:6}},
          },
          {
            t: "Ask why Sabra and Qadir still hate each other",
            r: '"Because they think we are theirs," your grandfather says. "And because we sell something they want to know about." He stops there.',
            fx: {int:.4,trait:"curious"},
          },
        ],
      },
      {
        id: "ss_sb_dates",
        title: "The date climbers",
        cond: (p,C)=>C.realm(p,"POL-24")&&grown(p,C)&&!C.old(p),
        w: 1,
        cool: 6,
        text: "Harvest in the date gardens of the Hazim uplands. The climbers go up the tall trunks with a loop of rope round their hips and a knife, cutting the heavy bunches down to the women below. A good climber earns three times a picker's pay. A bad one breaks his neck.",
        choices: [
          {
            t: "Climb the tall palms",
            check: {s:"athletics",s2:"str",d:40},
            win: {
              r: "Thirty trees a day by the end of the harvest. The garden owner pays you in dates and dinars, and offers you next year.",
              fx: {coin:12,skill:{athletics:3},str:.4},
            },
            lose: {
              r: "The rope slips on the fourth day. You fall into a pile of fronds, which saves your life but not your knee.",
              fx: {health:-14,wound:"bad_knee",wil:1,cause:"a fall from a date palm"},
            },
          },
          {
            t: "Pick and sort on the ground",
            r: "Hot, sticky, honest. You eat so many dates you cannot look at one till spring.",
            fx: {coin:5,sta:.3},
          },
          {
            t: "Buy a share of the harvest to sell in Sabra",
            req: p=>p.coin>=15,
            check: {s:"trade",s2:"ins",d:38},
            win: {r:"Good Hazim dates sell high on the Pearl Quay. Double your money.",fx:{coin:15,skill:{trade:2}}},
            lose: {r:"The caravans flood the market with Basir dates the same week.",fx:{coin:-6}},
          },
        ],
      },
      {
        id: "ss_sb_slavetaker",
        title: "The South March",
        cond: (p,C)=>C.realm(p,"POL-24")&&C.adult(p)&&!C.old(p)&&free(p),
        w: .8,
        cool: 10,
        text: 'House Zarani, lords of the South March, buy and catch divers in the Western Veld, and their six hundred slave-riders are always short of men. A Zarani captain is hiring riders for a season of "trading" in the veld: good pay, a camel, and a share of every head brought back to the pens.',
        choices: [
          {
            t: "Ride with the slave-takers",
            r: "A season in the veld. You come back with a camel, a purse, and faces you will see in your sleep for the rest of your life.",
            fx: {coin:50,honor:-8,trait:"cruel",gear:{mount:"camel"},wil:.5},
          },
          {
            t: "Refuse, and say why",
            r: `The captain laughs at you. "The pearls in your mother's ears were dived by veld men," he says. He may be right. You still refuse.`,
            fx: {honor:3,trait:"just"},
          },
          {
            t: "Sign on, then warn the veld villages",
            check: {s:"stealth",s2:"riding",d:50},
            win: {
              r: "You slip away the night before the raid and ride ahead. The village is empty when the riders come. Nobody ever proves it was you.",
              fx: {honor:6,skill:{stealth:2,riding:2},fame:1},
            },
            lose: {
              r: "The captain catches you saddling at night. You fight your way out and never go south again.",
              fx: {health:-18,wound:"scar_chest",honor:4,cause:"Zarani slave-riders"},
            },
          },
        ],
      },
      {
        id: "ss_sb_cant",
        title: "The Ropewalk Brothers",
        cond: (p,C)=>C.realm(p,"POL-24")&&(C.teen(p)||kid(p,C,10,13))&&C.coast(p),
        w: 1,
        once: !0,
        text: 'The Ropewalk Brothers, harbor boys of Sabra, speak Corsair cant among themselves so the grown-ups cannot follow: a purse is a fish, an informer a lamp, a watchman a "dry" if he will not take a bribe. They are teaching a new boy the words, and they look at you.',
        choices: [
          {
            t: "Learn the cant with them",
            r: "Fish, lamp, dry, wet, uncle. By summer you can talk to any Blackreef sailor in the harbor, and they talk back.",
            fx: {lang:"Corsair cant",skill:{deception:1}},
          },
          {
            t: "Help them lift a fish from a fat broker",
            check: {s:"stealth",s2:"spd",d:26},
            win: {
              r: "A purse of copper and a broker who never noticed. The Brothers make you one of them.",
              fx: {coin:2,skill:{stealth:2},lang:"Corsair cant",honor:-1},
            },
            lose: {r:"The broker grabs your wrist and hauls you to your father, who pays.",fx:{family:-2,happy:-4}},
          },
          {
            t: "Tell them you are going to be a diver, not a thief",
            r: `They laugh. "The diver comes up, or he doesn't," one says, the pearl divers' saying. It sounds braver from you.`,
            fx: {trait:"honest",wil:.4},
          },
        ],
      },
      {
        id: "ss_sb_hazimi",
        title: "A rider going north",
        cond: (p,C)=>early()&&C.realm(p,"POL-24")&&C.adult(p)&&!C.old(p),
        w: .8,
        once: !0,
        text: "House Hazimi of the uplands fought for Qadir in 1022 and changed sides in 1024, and some of them still look north. A Hazimi steward asks you to carry a sealed letter over the Sabun road to Qadir, to a camel lord's friend. He does not say what it is. In Sabra, some say Walid Hazimi would rather be Qadir's vassal than burn.",
        choices: [
          {
            t: "Carry it north",
            check: {s:"stealth",s2:"survival",d:46},
            win: {
              r: "Past the Camel Guard of the Emir, over the pass, into a Qadiri tent. You never learn what was in it. It was peace, or treason, or both.",
              fx: {coin:30,skill:{stealth:2,survival:1},flag:"ss_sb_hazimi"},
            },
            lose: {
              r: "The Emir's camel guard catches you on the road. The letter is opened. You are not.",
              fx: {prison:2,why:"carrying letters to Qadir"},
            },
          },
          {
            t: "Take it to Tahir Sabrani instead",
            check: {s:"intrigue",s2:"persuasion",d:42},
            win: {
              r: "The Emir's son reads it, goes white with rage, and gives you a gold dinar. House Hazimi has a bad month.",
              fx: {coin:27,favor:5,newRel:{type:"enemy",op:-30}},
            },
            lose: {
              r: "Tahir's men think you are part of it until you prove otherwise. It takes a while.",
              fx: {health:-8,wil:1,cause:"questioning by the Emir's men"},
            },
          },
          {
            t: "Refuse and forget the steward's face",
            r: "He finds another rider. You hope never to see that letter again.",
            fx: {trait:"cautious"},
          },
        ],
      },
      {
        id: "ss_sb_brawl",
        title: "Half-orcs on the quay",
        cond: (p,C)=>C.realm(p,"POL-24")&&C.adult(p)&&!C.old(p)&&C.coast(p),
        w: .8,
        cool: 8,
        text: p=>`Half-orc sailors from Blackreef are common in Sabra's harbor and seen as useful, until they drink. Tonight three of them are tossing a Qadiri date-seller's baskets into the water${p.race==="halforc"?", and one of them calls you cousin and invites you to join in":""}.`,
        choices: [
          {
            t: "Stop them with your fists",
            check: {s:"unarmed",s2:"str",d:46},
            win: {
              r: "One goes in the harbor after the dates, and the other two help him out and leave. The date-seller kisses your hand.",
              fx: {skill:{unarmed:3},honor:3,fame:1},
            },
            lose: {
              r: "Three half-orc sailors, one of you. You wake up under the nets.",
              fx: {health:-14,wound:"broken_nose",wil:1,cause:"a harbor brawl"},
            },
          },
          {
            t: "Talk to them in Corsair cant",
            req: (p,C)=>(p.langs||[]).includes("Corsair cant"),
            r: "You call them fish and uncles and something ruder. They laugh, buy you a drink, and pay the date-seller. Words are cheaper than fists.",
            fx: {skill:{persuasion:2},newRel:{type:"friend",op:20}},
          },
          {
            t: "Fetch the harbor watch",
            r: "The watch comes, slowly. The baskets are gone. The date-seller is grateful anyway.",
            fx: {honor:1},
          },
        ],
      },
      {
        id: "ss_sb_fireboat",
        title: "The fire-boat crews",
        cond: (p,C)=>C.realm(p,"POL-24")&&C.adult(p)&&!C.old(p)&&(C.soldier(p)||C.flag(p,"ss_sb_fireboat")||C.job(p,"sailor","fish")),
        w: 1,
        cool: 7,
        text: "Tahir Sabrani, Captain of the Fire-Boats, is training new crews: small boats that drift burning oil-pots down on enemy ships, as in 1024. Fire-oil from the Oil Shore is handled only under the eyes of Saad the Burnt of the Oil Yard, whose face tells you why he is called that.",
        choices: [
          {
            t: "Learn to handle the pots",
            check: {s:"craft",s2:"ins",d:46},
            win: {
              r: "Seal, wrap, fuse, throw, and never let it splash. Saad nods at you, which he does to nobody. You are on a fire-boat crew.",
              fx: {skill:{craft:2,sea:2,throwing:2},merit:2,flag:"ss_sb_crew"},
            },
            lose: {
              r: "A drop on your sleeve, and the sleeve is gone, and some of the arm.",
              fx: {health:-16,wound:"burn",wil:2,cause:"fire-oil"},
            },
          },
          {
            t: "Learn to steer upwind of the fire",
            check: {s:"sea",s2:"int",d:42},
            win: {
              r: "The secret is not the fire, it is the wind. You learn to set the boat drifting and get out before it catches.",
              fx: {skill:{sea:3,tactics:1},merit:1},
            },
            lose: {r:"You steer the practice boat straight into the harbor wall.",fx:{happy:-2,skill:{sea:1}}},
          },
          {
            t: "Ask Saad what is really in the jars",
            r: 'He looks at you with his burned face. "Lamp oil," he says, and walks away. It is the only answer anyone in Sabra ever gives.',
            fx: {int:.3},
          },
        ],
      },
    ]);
    A.defEvents([
      {
        id: "ss_sk_skyburial",
        title: "The body-breakers",
        cond: (p,C)=>C.realm(p,"POL-27")&&C.ageAdj(p)>=12,
        w: 1,
        cool: 9,
        text: ()=>`${A.pick(["Your grandmother","Your old uncle who shared the herd","A monk who taught you your letters"])} has died. On the high platform above the monastery the body-breakers will cut the body and give it to the vultures and the lammergeiers, so that nothing is wasted and the soul goes on clean. The family must walk up with the body at dawn.`,
        choices: [
          {
            t: "Climb to the platform and watch the birds come",
            r: "It is terrible and then, slowly, it is not. The great birds lift away over the valley, and something in you lifts with them.",
            fx: {wil:1.5,piety:4},
          },
          {
            t: "Help the body-breakers with their work",
            check: {s:"wil",s2:"faith",d:42},
            win: {
              r: "Your hands do not shake. The head body-breaker says the dead go lighter when family helps. You go home quiet and strangely calm.",
              fx: {wil:2.5,piety:5,trait:"stoic"},
            },
            lose: {
              r: "You last a minute and are sick behind the cairn. The body-breakers are kind about it. They always are.",
              fx: {wil:1,piety:2},
            },
          },
          {
            t: "Light butter lamps below for a good rebirth",
            r: "A hundred little flames in the monastery hall. A monk chants with you through the night. You hope the turning is kind to her.",
            fx: {piety:3,coin:-2,happy:1},
          },
        ],
      },
      {
        id: "ss_sk_brothers",
        title: "One wife for two brothers",
        cond: (p,C)=>C.realm(p,"POL-27")&&C.adult(p)&&!C.married(p)&&!C.old(p)&&!C.flag(p,"rl_sk_monk")&&!C.flag(p,"ch_monastery"),
        w: .8,
        once: !0,
        setup: (p,ctx)=>{ctx.n=loc(p,p.sex==="F"?"M":"F")},
        text: p=>SEX(p,"On the Roof, brothers often share one wife so the family herd is never divided. Your mother has arranged a match: {n}, a herd-girl from the next valley, to marry you and your elder brother together. Every child will call both of you father.","On the Roof, brothers often share one wife so the family herd is never divided. A herding family from the next valley has asked for you, to marry their two sons, {n} and his brother, so their yaks stay in one herd."),
        choices: [
          {
            t: "Agree. The herd stays whole",
            r: "A wedding of butter and barley beer, the prayer flags snapping. It is a crowded tent, and a warm one.",
            fx: {lover:!0,coin:20,happy:3,skill:{husbandry:1}},
          },
          {
            t: "Ask for a match of your own",
            check: {s:"persuasion",s2:"wil",d:42},
            win: {
              r: "It takes a winter of arguing, but your mother gives in. You will have a smaller herd and a quieter tent.",
              fx: {wil:1,trait:"stubborn"},
            },
            lose: {r:"Your mother does not give in. Neither do you. The match goes to a cousin.",fx:{happy:-4}},
          },
          {
            t: "Say you would rather go to the monastery",
            r: "The family is not sorry: one more child given to the Stair is merit for everyone. You shave your head in the spring.",
            fx: {piety:6,literate:!0,skill:{faith:3,learning:2},flag:"ss_sk_monk"},
          },
        ],
      },
      {
        id: "ss_sk_lampnight",
        title: "Lamp Night",
        cond: (p,C)=>C.realm(p,"POL-27")&&C.ageAdj(p)>=6,
        w: 1.1,
        cool: 4,
        text: "The full moon of October: Lamp Night. Every roof of the monastery-city burns with butter lamps, and the White Stair seems to climb into the stars. Families bring butter for the lamps, as much as they can spare, and some more than they can.",
        choices: [
          {
            t: "Give a whole season's butter",
            r: "Your lamps burn till dawn. The family eats dry barley for a month and feels rich.",
            fx: {piety:5,coin:-4,happy:2},
          },
          {
            t: "Carve a butter sculpture for the festival",
            check: {s:"craft",s2:"int",d:34},
            win: {
              r: "A butter lammergeier with wings spread, colored with saffron and soot. A monk puts it on the third landing for the pilgrims to see.",
              fx: {skill:{craft:3},fame:1,piety:2},
            },
            lose: {
              r: "It melts in the lamp heat into something like a yak with a headache.",
              fx: {skill:{craft:1},happy:-1},
            },
          },
          {
            t: "Climb the Stair by lamplight and pray for the Abbot",
            r: "Every landing, a prayer. At the top, the window of the sickroom is lit too. You pray he lives one more year.",
            fx: {piety:3,sta:.3,wil:.5},
          },
        ],
      },
      {
        id: "ss_sk_newyear",
        title: "The seventh step",
        cond: (p,C)=>C.realm(p,"POL-27")&&C.ageAdj(p)>=6,
        w: 1,
        cool: 5,
        text: "The Sky New Year, at the new moon near mid-February, and extra butter for everyone. Pilgrims crowd the court below the seventh step of the White Stair, where the Abbot is shown each year. This year he is carried out in a chair, wrapped in wool, coughing.",
        choices: [
          {
            t: "Push close for his blessing",
            check: {s:"athletics",s2:"etiquette",d:34},
            win: {
              r: "His hand passes over your head. It is thin and cold, and you feel, absurdly, blessed.",
              fx: {piety:5,happy:3},
            },
            lose: {r:"A Stair Guard's iron-shod staff gently, firmly, puts you back in the crowd.",fx:{piety:1}},
          },
          {
            t: "Watch the Steward beside the chair",
            check: {s:"ins",s2:"int",d:40},
            win: {
              r: "Sonam the Steward never looks at the crowd. He looks east, toward the High Wastes, the whole time. You understand that he is afraid.",
              fx: {int:.5,skill:{intrigue:1}},
            },
            lose: {r:"Robes, butter, chanting. You see what everyone sees.",fx:{}},
          },
          {
            t: "Eat your extra butter and dance",
            r: "Barley flour and butter, salted tea, long horns and cymbals. The Roof knows how to make a cold month warm.",
            fx: {happy:5},
          },
        ],
      },
      {
        id: "ss_sk_stillhands",
        title: "The Hall of Still Hands",
        cond: (p,C)=>C.realm(p,"POL-27")&&grown(p,C)&&!C.old(p),
        w: 1,
        cool: 6,
        text: 'At the Hall of Still Hands, Nima, who has disarmed four hundred men and killed none, teaches staff, sling, rope and binding. "Anyone can kill," he says. "That is easy. Bring a man down and let him get up again a better man. That is the art." He hands you an iron-shod staff.',
        choices: [
          {
            t: "Spar with him",
            check: {s:"melee",s2:"ins",d:50},
            win: {
              r: "You touch his sleeve once in twenty passes. He bows to you. In the Hall of Still Hands that is a great thing.",
              fx: {skill:{melee:3,unarmed:2},ins:.5,flag:"ss_sk_still",fame:1},
            },
            lose: {
              r: "You are on the floor eleven times, unhurt every time, which is somehow worse.",
              fx: {skill:{melee:2,unarmed:1},wil:1},
            },
          },
          {
            t: "Learn the binding ropes",
            check: {s:"unarmed",s2:"spd",d:42},
            win: {
              r: 'A loop, a twist, a man on his face with his hands behind him. Nima nods. "Now let him up," he says.',
              fx: {skill:{unarmed:3},spd:.3},
            },
            lose: {
              r: "You tie yourself to your practice partner. The whole hall laughs, Nima loudest.",
              fx: {skill:{unarmed:1},happy:1},
            },
          },
          {
            t: "Ask him about the forty blades the Steward bought",
            r: 'His face does not change at all. "A blade is only a heavy staff," he says, "unless you mean to kill." Then he makes you run the Stair three times.',
            fx: {sta:.5,int:.3},
          },
        ],
      },
      {
        id: "ss_sk_debate",
        title: "Debate in the cold hall",
        cond: (p,C)=>C.realm(p,"POL-27")&&(C.flag(p,"rl_sk_monk")||C.flag(p,"ch_monastery")||C.flag(p,"ss_sk_monk")||C.job(p,"clergy"))&&C.ageAdj(p)>=10,
        w: 1.4,
        cool: 4,
        text: ()=>`In the cold debating court the monks pace and clap, one questioning, one answering. Today you must defend a hard point before an older monk who loves to win: ${A.pick(['"If all life turns through rebirth, why should a monk fear death?"','"Is kindness to a robber kindness or foolishness?"','"If the Abbot is reborn, who is the boy before he is found?"'])}`,
        choices: [
          {
            t: "Answer boldly and clap back",
            check: {s:"persuasion",s2:"int",d:42},
            win: {
              r: "He stamps, you clap, he questions, you answer, and in the end he laughs and sits down. The younger monks look at you differently.",
              fx: {skill:{persuasion:2,faith:2},int:.5,fame:1},
            },
            lose: {
              r: "He catches you in your own words in three moves. Everyone laughs, even you, eventually.",
              fx: {skill:{faith:1},wil:.8},
            },
          },
          {
            t: "Answer slowly, from the scriptures",
            check: {s:"learning",s2:"faith",d:40},
            win: {
              r: "You quote the old teachers until he runs out of objections. Not exciting. Correct.",
              fx: {skill:{learning:3},piety:2},
            },
            lose: {
              r: "You quote the wrong teacher. The old monk quotes the right one, with relish.",
              fx: {skill:{learning:1}},
            },
          },
          {
            t: "Ask the forbidden third question",
            r: '"Who is the boy before he is found?" The court goes silent. An old monk looks at you for a long time and tells you to sweep the storerooms for a month.',
            fx: {int:.4,piety:-1,flag:"ss_sk_doubt"},
          },
        ],
      },
      {
        id: "ss_sk_three",
        title: "Three and one",
        cond: (p,C)=>C.realm(p,"POL-27")&&kid(p,C,5,11),
        w: 1,
        once: !0,
        text: 'Counting yaks with your father, you say "four". He goes very still. Among the Skyfolk "four" is the same word as "death", and people say "three and one" instead. Your grandmother is already reaching for the prayer wheel.',
        choices: [
          {
            t: 'Say "three and one" quickly, three times',
            r: "Your grandmother spins the wheel and the danger passes. You never say the word again without thinking.",
            fx: {piety:2,int:.2},
          },
          {
            t: "Ask why a number can be dangerous",
            r: '"Words go out into the world and find things," your father says. "Some words find the wrong things." It is the most he has ever said to you at once.',
            fx: {int:.4,trait:"curious"},
          },
          {
            t: "Laugh and say it again",
            r: "That night a yak calf dies. It was sick already. Nobody in your family believes that.",
            fx: {happy:-3,wil:.5,piety:-1},
          },
        ],
      },
      {
        id: "ss_sk_saltlight",
        title: "A load light",
        cond: (p,C)=>C.realm(p,"POL-27")&&C.adult(p),
        w: .9,
        cool: 8,
        text: `A yak caravan of House Windmane comes down from the dry lakes a load of salt light. The caravan master blames the monks of a monastery on the trail, who took "the abbey's toll" twice. The monks say they took it once. Someone is lying, and the salt is worth more than silver on the Roof.`,
        choices: [
          {
            t: "Count the loads and the tally sticks yourself",
            check: {s:"stewardship",s2:"int",d:40},
            win: {
              r: "The tally sticks say one toll. The yaks say one load short. A herder's boy has been selling salt to Red Stair herders on the side. Mystery solved; nobody pleased.",
              fx: {skill:{stewardship:3},int:.4,favor:2},
            },
            lose: {r:"The numbers make no sense to you. They make no sense to anyone.",fx:{wil:.3}},
          },
          {
            t: "Side with the caravan master",
            r: "House Windmane owns more yaks than any family outside the monasteries. Siding with them is not wrong. It is just convenient.",
            fx: {coin:6,newRel:{type:"friend",op:15},piety:-1},
          },
          {
            t: "Make the thief pay threefold, as the law says",
            check: {s:"persuasion",s2:"faith",d:42},
            win: {
              r: "Skyhold never kills: thieves pay back threefold in butter or silver. The guilty one pays, grumbling, and nobody bleeds.",
              fx: {honor:3,piety:2,skill:{persuasion:2}},
            },
            lose: {r:"Nobody admits anything, and nobody pays.",fx:{happy:-2}},
          },
        ],
      },
      {
        id: "ss_sk_blades",
        title: "Forty blades",
        cond: (p,C)=>early()&&C.realm(p,"POL-27")&&C.adult(p),
        w: .9,
        once: !0,
        text: "Word goes around the Yak Yards in whispers: the Steward has sent gold from the lamp treasury south to Ranpur, to buy forty Chanari blades for men sworn never to kill. A crate came up the salt trail last week, too heavy for barley, and it went into a storeroom under the Stair. You know which one.",
        choices: [
          {
            t: "Tell Nima of the Still Hands",
            r: "Nima listens and says nothing. The next morning he is seen walking down to that storeroom alone.",
            fx: {honor:3,piety:2,flag:"ss_sk_blades"},
          },
          {
            t: "Tell the Steward's men you know, and offer silence",
            check: {s:"intrigue",s2:"ins",d:46},
            win: {
              r: "A Stair Guard officer gives you a measure of silver by weight and tells you you saw barley. You saw barley.",
              fx: {coin:15,honor:-2,skill:{intrigue:2}},
            },
            lose: {
              r: "The officer asks how you knew. You spend a cold week walking a penance circuit you did not deserve.",
              fx: {wil:1.5,sta:.5},
            },
          },
          {
            t: "Keep it to yourself and pray",
            r: "Swords on the Roof. You spin your prayer wheel faster than you have in years.",
            fx: {piety:2,trait:"cautious"},
          },
        ],
      },
      {
        id: "ss_sk_redstair",
        title: "Robbers on the circuit",
        cond: (p,C)=>C.realm(p,"POL-27")&&C.adult(p)&&!C.old(p)&&(C.poor(p)||C.job(p,"herd")),
        w: .9,
        cool: 8,
        text: `A herder of the High Wastes edge, in the red robe and grey sash of the Red Stair, comes to your fire. Norbu's herders rob pilgrims on the Bluespire circuit, and the silver buys barley. He needs someone who knows the western passes. "No blood," he says. "The Truce of the Circuit. Just butter and silver."`,
        choices: [
          {
            t: "Ride with them to the pass",
            check: {s:"stealth",s2:"survival",d:42},
            win: {
              r: "A pilgrim party, a lot of shouting, butter and silver changing hands, and nobody hurt. Your share is a fat bag of silver by weight.",
              fx: {coin:18,honor:-4,piety:-3,skill:{stealth:2}},
            },
            lose: {
              r: "The pilgrims are guarded by Stair Guards with slings this year. A stone takes you on the temple.",
              fx: {health:-12,wound:"concussion",wil:1,cause:"a sling-stone"},
            },
          },
          {
            t: "Refuse, and warn the Stair Guard",
            r: "Tsering Snowborn's guards are waiting at the pass. No blood is shed. The Red Stair know who talked, though.",
            fx: {honor:3,favor:2,newRel:{type:"enemy",op:-25}},
          },
          {
            t: "Ask him why he follows Norbu",
            check: {s:"diplomacy",s2:"ins",d:38},
            win: {
              r: '"Because the search found him first," he says simply. "Everyone in the east knows. Only the Stair pretends not to." He believes it entirely.',
              fx: {int:.5,skill:{diplomacy:2},flag:"ss_sk_doubt"},
            },
            lose: {r:"He says the sky-kings will judge, and leaves before dawn.",fx:{}},
          },
        ],
      },
      {
        id: "ss_sk_snowborn",
        title: "The Snowborn Guides",
        cond: (p,C)=>C.realm(p,"POL-27")&&C.adult(p)&&!C.old(p)&&free(p),
        w: .9,
        once: !0,
        text: "The Snowborn Guides, three hundred scouts who work at five thousand meters and know every path of the Roof, are looking for new men. The test is simple: cross the pass above Bellcrest in a day, alone, find the cairn with the blue flag, and come back with its stone.",
        choices: [
          {
            t: "Make the crossing",
            check: {s:"survival",s2:"sta",d:50},
            win: {
              r: "Snow to the thigh, air like thin water, a white sky. You find the cairn by the flag's snapping before you see it. They give you a felt hat with a white band.",
              fx: {skill:{survival:4,tracking:2},sta:.8,flag:"ss_sk_guide",fame:1},
            },
            lose: {
              r: "The cloud comes down. You dig in for the night and walk out with blackened toes.",
              fx: {health:-14,wound:"frostbite",wil:2,cause:"cold on the high pass"},
            },
          },
          {
            t: "Read the sky before you go, and wait a day",
            check: {s:"survival",s2:"int",d:42},
            win: {
              r: "You wait out a storm the others walked into, and cross on a clear morning. The Guides like that better than speed.",
              fx: {skill:{survival:3},int:.3,flag:"ss_sk_guide"},
            },
            lose: {r:"You wait, and wait, and the season ends.",fx:{skill:{survival:1}}},
          },
          {
            t: "Ask the Guides about the dragon at Kardeep",
            r: '"We showed the dwarves the way," a Guide says, very low. "We did not shoot. They did." He does not look at you again that day.',
            fx: {int:.4},
          },
        ],
      },
      {
        id: "ss_sk_lowlander",
        title: "A lowlander on the Stair",
        cond: (p,C)=>C.realm(p,"POL-27")&&C.ageAdj(p)>=10,
        w: .9,
        cool: 8,
        text: ()=>`A ${A.pick(["Ranpuri salt trader","Drevnan wool buyer","Stonehold toll clerk"])} has climbed too fast. He is grey-faced, gasping, and talking nonsense on the third landing of the White Stair. Skyfolk pity lowlanders as heavy-breathing and short of patience. This one may die of it.`,
        choices: [
          {
            t: "Carry him down a thousand meters, now",
            check: {s:"str",s2:"sta",d:44},
            win: {
              r: "Down the trail on your back, step by step. By the time you reach the Yak Yards he can say his own name. He pays you in Ranpuri silver and tears.",
              fx: {coin:10,str:.4,honor:3,newRel:{type:"friend",op:30}},
            },
            lose: {
              r: "You carry him as far as you can. A Stair Guard takes over. You do not learn if he lived.",
              fx: {sta:.5,wil:.8},
            },
          },
          {
            t: "Brew salted butter tea with herbs from the infirmary",
            check: {s:"medicine",s2:"int",d:40},
            win: {
              r: "Butter, salt, herbs, rest. By morning he is sitting up and complaining about the tea, which is a good sign.",
              fx: {skill:{medicine:3},honor:2},
            },
            lose: {r:"The tea does nothing. The monks carry him down.",fx:{skill:{medicine:1}}},
          },
          {
            t: "Tell him to breathe slowly and leave him to the monks",
            r: "The monks know what to do. Probably. You have yaks to see to.",
            fx: {},
          },
        ],
      },
      {
        id: "ss_sk_sunring",
        title: "The serpent of light",
        cond: (p,C)=>C.realm(p,"POL-27")&&kid(p,C,5,13),
        w: .9,
        once: !0,
        text: "High on the summer pasture you look up and see a great ring of light around the sun, pale rainbow colors in the thin cold air. The Skyfolk say it is the Sky Serpent of the Roof, a serpent of light that coils round the sun to guard it.",
        choices: [
          {
            t: "Pray to the serpent",
            r: "You fold your hands and pray it keeps the sun safe. The ring fades by noon. The sun seems fine.",
            fx: {piety:3,happy:2},
          },
          {
            t: "Ask a monk what it really is",
            r: '"Ice in the high air," says a monk who has read the old books, "bending the light like a crystal." Then he adds: "But it is also very beautiful." You keep both answers.',
            fx: {int:.5,trait:"curious"},
          },
          {
            t: "Stare at it until your eyes hurt",
            r: "You see spots for an hour and get a scolding. Worth it.",
            fx: {happy:1,wil:.2},
          },
        ],
      },
      {
        id: "ss_sk_wolf",
        title: "Wolves on monastery land",
        cond: (p,C)=>C.realm(p,"POL-27")&&grown(p,C)&&!C.old(p),
        w: .9,
        cool: 7,
        text: "Wolves have taken two yak calves from the monastery's herd, which you keep. Killing any animal on monastery land is forbidden. The monks say drive them off. The other herders say the monks do not lose sleep over calves.",
        choices: [
          {
            t: "Drive them off with a sling, unkilled",
            check: {s:"throwing",s2:"ins",d:42},
            win: {
              r: "Stones whistling in the dark, a yelp, a retreat. The wolves learn that this herd bites back. Nothing dies.",
              fx: {skill:{throwing:3},piety:2,honor:1},
            },
            lose: {r:"The wolves are not impressed by stones. Another calf.",fx:{coin:-6,wil:.8}},
          },
          {
            t: "Set snares just past the monastery boundary stone",
            check: {s:"survival",s2:"stealth",d:40},
            win: {
              r: "A wolf dies a stride outside monastery land. The monks look at the boundary stone, then at you, and say nothing.",
              fx: {skill:{survival:2},coin:3,piety:-1},
            },
            lose: {r:"The snare catches a monastery goat.",fx:{happy:-3,piety:-1}},
          },
          {
            t: "Sleep among the calves with a staff",
            check: {s:"sta",s2:"wil",d:38},
            win: {
              r: "Five cold nights. On the third, a wolf comes close and you roar at it like a yak. It goes, and does not come back.",
              fx: {wil:1,sta:.4,skill:{husbandry:2}},
            },
            lose: {r:"You sleep through the attack. Of course you do.",fx:{coin:-6}},
          },
        ],
      },
      {
        id: "ss_sk_dragonpilgrim",
        title: "To the warm ground",
        cond: (p,C)=>C.realm(p,"POL-27")&&C.adult(p)&&!C.old(p),
        w: .7,
        cool: 12,
        text: "Red Stair monks are walking east to the warm ground above Kardeep, to honor a nesting pair of Great Ash Dragons they call the sky-kings. The dwarves of Emberdeep shoot at the dragons with crossbows. A Red Stair pilgrim invites you along. Dragons are big real animals, and they guard their ground.",
        choices: [
          {
            t: "Go with the pilgrims",
            check: {s:"survival",s2:"wil",d:46},
            win: {
              r: "From a ridge a day's walk away you see it: a vast grey shape on the hot rocks, wings folded like tents. It lifts its head. You fall on your face with everyone else, and are not sorry.",
              fx: {
                piety: 4,
                fame: 2,
                wil: 1.5,
                flag: "ss_sk_dragon",
                deed: "Saw a Great Ash Dragon on the warm ground above Kardeep",
              },
            },
            lose: {
              r: "A dwarf patrol of the Dragon Watch turns the pilgrims back at crossbow point.",
              fx: {wil:1,happy:-3},
            },
          },
          {
            t: "Refuse. Even monks get eaten",
            r: "You stay home. Two of the pilgrims do not come back, and the others will not say why.",
            fx: {trait:"cautious"},
          },
          {
            t: "Go to watch, not to pray",
            check: {s:"stealth",s2:"survival",d:50},
            win: {
              r: "You see it hunt: it drives a herd of wild sheep off a cliff with a blast of flame and eats them below. Not a god. A very big animal. That is somehow worse, and better.",
              fx: {int:.6,skill:{stealth:2,tracking:2},flag:"ss_sk_dragon"},
            },
            lose: {
              r: "It sees you. You do not remember the run down the mountain.",
              fx: {health:-20,wound:"burn",wil:2.5,cause:"a Great Ash Dragon"},
            },
          },
        ],
      },
      {
        id: "ss_sk_exile",
        title: "Below the edge",
        cond: (p,C)=>C.realm(p,"POL-27")&&C.adult(p),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{ctx.n=loc(p,"M")},
        text: "Skyhold never kills and never jails. But {n}, a herder of your valley, has done something terrible: he killed a man in a fight over a yak. The abbot's judgment is the worst Skyhold has: exile below the Roof's edge, where few Skyfolk survive the lowland heat. His mother asks you to speak for him.",
        choices: [
          {
            t: "Speak for him: let him walk the circuit instead",
            check: {s:"persuasion",s2:"faith",d:48},
            win: {
              r: "You speak of the dead man's cruelty and {n}'s grief. The abbot changes the sentence to three times round the Bluespire circuit, measured by the body. He may live.",
              fx: {honor:3,skill:{persuasion:2},newRel:{type:"friend",op:35}},
            },
            lose: {r:"The abbot hears you out, and does not change a word.",fx:{wil:1,happy:-4}},
          },
          {
            t: "Walk him down to the edge yourself",
            r: "You walk him down past the last prayer flags into air thick and hot as soup. He is already sweating. You give him your water and turn back.",
            fx: {wil:1.5,honor:2,sta:.4},
          },
          {
            t: "Say nothing. The judgment is just",
            r: "A man is dead. {n}'s mother does not speak to you again.",
            fx: {piety:2,trait:"just"},
          },
        ],
      },
      {
        id: "ss_sk_salttrail",
        title: "The salt trail south",
        cond: (p,C)=>C.realm(p,"POL-27")&&C.adult(p)&&!C.old(p)&&free(p),
        w: .9,
        cool: 8,
        text: "The salt trail to Ranpur has run since 521: down from the dry lakes, through the passes, to the hot green lands where Skyfolk salt buys rice, cotton and iron. The yaks cannot go below the forest, so loads change to mules at the last monastery. The caravan needs a herder who can stand the heat.",
        choices: [
          {
            t: "Go all the way down to the rice country",
            check: {s:"sta",s2:"survival",d:46},
            win: {
              r: "Heat like a wet blanket, air so thick you could drink it, and a Ranpuri market full of noise and color. You come back up with silver, a cotton shirt and a bad cough that goes away at altitude.",
              fx: {coin:25,skill:{trade:2,survival:2},lang:"Ranpuri",sta:.5},
            },
            lose: {
              r: "The heat lays you flat at the first lowland town. You go back up on a mule, ashamed and alive.",
              fx: {health:-12,wil:1.5,cause:"lowland heat"},
            },
          },
          {
            t: "Trade at the change-over monastery only",
            check: {s:"trade",s2:"persuasion",d:38},
            win: {
              r: "Salt for rice and iron at the border, and back home before the yaks get homesick.",
              fx: {coin:14,skill:{trade:2}},
            },
            lose: {r:"The lowland traders are sharper than you thought.",fx:{coin:3}},
          },
          {
            t: "Stay with the herd",
            r: "Someone has to watch the yaks. They are good company and never haggle.",
            fx: {skill:{husbandry:2}},
          },
        ],
      },
      {
        id: "ss_rp_monsoon",
        title: "Monsoon Welcome",
        cond: (p,C)=>C.realm(p,"POL-30")&&C.ageAdj(p)>=6,
        w: 1.1,
        cool: 4,
        text: '15 June, Monsoon Welcome. The first great rain comes in off the sea like a wall, and the whole kingdom runs out to dance in it. The war season is over until the rice is in. "Svapna chale," people shout: the dream goes on.',
        choices: [
          {
            t: "Dance in the rain until you drop",
            r: "Mud to the knees, drums, laughing strangers. Every bad thing of the dry season washes away for one afternoon.",
            fx: {happy:7,sta:.2},
          },
          {
            t: "Plant the first rice seedlings in the flooded paddy",
            check: {s:"husbandry",s2:"sta",d:30},
            win: {
              r: "Row after row in the warm mud. The temple says the first planting of the monsoon is the luckiest.",
              fx: {skill:{husbandry:2},piety:2,coin:3},
            },
            lose: {
              r: "A leech the size of your thumb. Then another. You learn to love salt.",
              fx: {health:-2,cause:"leeches"},
            },
          },
          {
            t: "Make offerings of flowers at the river shrine",
            r: "Jasmine and marigolds on the brown water. The river god of the Thousand Names is fat and pleased this year, the priests say.",
            fx: {piety:4},
          },
        ],
      },
      {
        id: "ss_rp_chanari",
        title: "Chanari steel",
        cond: (p,C)=>C.realm(p,"POL-30")&&C.adult(p),
        w: .9,
        cool: 9,
        text: `In the walled smiths' quarter of Chanari the only human crucible steel in the world is made, patterned like water. The smiths teach only their sons, under oath, and House Varma guards the secret. A drunk journeyman outside the Smiths' Wall offers to sell you a blade "that fell off a cart", or the secret itself.`,
        choices: [
          {
            t: "Buy a true Chanari blade at the Steel Hall (400 suns)",
            req: p=>p.coin>=400,
            r: "Steel with ripples like a river under ice. It cuts a falling silk scarf. You will never own anything finer.",
            fx: {coin:-400,gear:{weapon:"chanari"},fame:1},
          },
          {
            t: 'Buy the "fallen" blade cheap (60 suns)',
            req: p=>p.coin>=60,
            check: {s:"craft",s2:"ins",d:46},
            win: {
              r: "It is real, a second from the forge with a flaw in the guard. The blade itself is perfect. You hide it well.",
              fx: {coin:-60,gear:{weapon:"chanari"},honor:-2},
            },
            lose: {
              r: "Etched iron with acid ripples. It bends on the first cut. The journeyman is long gone.",
              fx: {coin:-60,happy:-5},
            },
          },
          {
            t: "Report him to the Steel-Warden's men",
            r: "House Varma's guards take him behind the wall. You get a lotus for your trouble. You never learn what happens to journeymen who talk.",
            fx: {coin:8,favor:3,honor:-1},
          },
        ],
      },
      {
        id: "ss_rp_bladehall",
        title: "The Blade Hall",
        cond: (p,C)=>C.realm(p,"POL-30")&&grown(p,C)&&!C.old(p)&&(C.prof(p,"sword",20)||C.soldier(p)||C.noble(p)||p.status==="gentry"),
        w: 1,
        cool: 7,
        text: `At the Blade Hall of Chanari, Kavi Rane teaches sword fighting with crucible-steel blades, which are lighter and faster than any iron and will cut a careless student's own leg. He watches you swing once and sighs. "You fight like a man with a club," he says. "Steel wants a dancer."`,
        choices: [
          {
            t: "Dance with the steel",
            check: {s:"sword",s2:"spd",d:48},
            win: {
              r: "Wrist, not arm. Step, not lunge. By the end of the month Kavi lets you spar with a real Chanari blade, which is an honor and a terror.",
              fx: {skill:{sword:4},spd:.5,flag:"ss_rp_bladehall"},
            },
            lose: {
              r: "You nick your own thigh on the second day. Kavi says that is the usual first lesson.",
              fx: {health:-6,wound:"deep_cut",skill:{sword:2},cause:"a practice cut"},
            },
          },
          {
            t: "Ask him to teach you to fight against elephants",
            r: '"Nobody fights against elephants," he says. "You fight beside them, or you run. At Tiravi we ran." He teaches you to cut a howdah rope from below.',
            fx: {skill:{sword:2,tactics:1}},
          },
          {
            t: "Pay for private lessons (20 suns)",
            req: p=>p.coin>=20,
            r: "An hour a day with Kavi alone. Your blade starts to sing, a little.",
            fx: {coin:-20,skill:{sword:5}},
          },
        ],
      },
      {
        id: "ss_rp_tiger",
        title: "The man-eater",
        cond: (p,C)=>C.realm(p,"POL-30")&&C.adult(p)&&!C.old(p),
        w: .9,
        cool: 8,
        text: "A tiger has taken two woodcutters from your village at the forest edge. The Ranpuri believe man-eaters carry the souls of murderers. The headman is organizing a tiger beat: a line of men with drums and torches driving through the tall grass toward the archers.",
        choices: [
          {
            t: "Take a bow and wait at the end of the beat",
            check: {s:"bow",s2:"wil",d:50},
            win: {
              r: "It comes out of the grass at a run, orange and enormous. Your arrow takes it behind the shoulder, then another. The village carries you on their shoulders.",
              fx: {skill:{bow:3},fame:4,wil:1.5,epithet:"Tiger-Bane"},
            },
            lose: {
              r: "It comes out to your left, and the man beside you shoots. You hear his scream for years.",
              fx: {wil:2.5,happy:-8},
            },
          },
          {
            t: "Face it with a spear",
            r: "You stand in the line with a spear when the grass parts.",
            fx: {beast:{id:"CRE-49",place:"the tall grass",mod:1}},
          },
          {
            t: "Drum in the beating line",
            check: {s:"sta",s2:"wil",d:36},
            win: {
              r: "Noise, sweat, tall grass, and a roar that stops your heart for a beat. You keep drumming. The beat works.",
              fx: {honor:2,wil:1},
            },
            lose: {r:"You hear it close in the grass and run. So do others. The beat fails.",fx:{honor:-2,wil:.8}},
          },
        ],
      },
      {
        id: "ss_rp_nagita",
        title: "The Elephant Hills",
        cond: (p,C)=>C.realm(p,"POL-30")&&C.adult(p)&&!C.old(p),
        w: .9,
        cool: 9,
        text: "In the Elephant Hills around Nagita, House Mallik's catchers drive wild elephants into stockades and train them for war. A trained war elephant sells for six thousand suns, and killing any elephant without the Raja's leave is a heavy fine. The catchers need hands for the drive.",
        choices: [
          {
            t: "Ride a tame elephant in the drive",
            check: {s:"riding",s2:"husbandry",d:48},
            win: {
              r: "High on a tame cow's neck, you help steer a young bull into the stockade. Bala Mallik offers you a place at the Elephant School.",
              fx: {skill:{riding:2,husbandry:4},coin:15,flag:"ss_rp_mahout"},
            },
            lose: {
              r: "The wild bull turns. Your elephant runs. You hold on, which is the only thing you do right.",
              fx: {health:-8,wil:1,skill:{riding:1},cause:"a runaway elephant"},
            },
          },
          {
            t: "Work the ropes on the ground",
            check: {s:"str",s2:"ins",d:42},
            win: {
              r: "Hauling ropes, dodging feet, singing to calm them. Hard, dangerous work, and paid in silver lotus.",
              fx: {coin:10,str:.5,skill:{husbandry:2}},
            },
            lose: {
              r: "A rope burns through your hands as a young bull pulls.",
              fx: {health:-6,coin:5,cause:"a rope burn"},
            },
          },
          {
            t: "Ask what the temples hide in the hills",
            check: {s:"intrigue",s2:"ins",d:48},
            win: {
              r: "A catcher, drunk, mentions a pale young elephant kept apart in a temple estate, fed by temple boys, shown to nobody. He sobers up and swears he said nothing.",
              fx: {flag:"ss_rp_calf",int:.5,skill:{intrigue:2}},
            },
            lose: {
              r: "The catchers stop talking when you come near. Temple estates hide more than elephants, they say.",
              fx: {},
            },
          },
        ],
      },
      {
        id: "ss_rp_debtfield",
        title: "Twelve in the hundred",
        cond: (p,C)=>C.realm(p,"POL-30")&&C.adult(p)&&free(p)&&C.poor(p),
        w: 1,
        cool: 8,
        text: "The temple banks lend at twelve in the hundred a year, and your family's loan for last year's seed has grown fat. Debtors work temple fields until paid. The temple steward comes with his book. In the delta, a band called Dev the Unbound's men rob temple granaries and give the rice to the poor, and they are recruiting.",
        choices: [
          {
            t: "Work the temple fields",
            r: "A season in the temple paddies, bent double, paying off rice with rice. The steward's book shrinks, slowly.",
            fx: {sta:.6,wil:1.5,coin:2,happy:-4},
          },
          {
            t: "Join Dev the Unbound for one raid",
            check: {s:"stealth",s2:"str",d:46},
            win: {
              r: "A temple granary at night, sacks over the wall, rice to the Mud Ward's poor. Your own share pays the debt. The temples want heads.",
              fx: {coin:20,honor:1,piety:-3,skill:{stealth:2},flag:"ss_rp_unbound"},
            },
            lose: {r:"The temple guards were waiting. A thief loses a hand in Ranpur.",fx:{punish:"theft"}},
          },
          {
            t: "Ask the One Face merchants for a loan at lower interest",
            check: {s:"persuasion",s2:"trade",d:42},
            win: {
              r: "Amar Sethi's brokers lend at six in the hundred, glad to take a debtor from the temples. You pay off the steward with a smile.",
              fx: {coin:5,skill:{persuasion:2},piety:-1},
            },
            lose: {r:"The merchants say they cannot be seen to steal the temples' debtors. Not yet.",fx:{wil:.5}},
          },
        ],
      },
      {
        id: "ss_rp_lotusknives",
        title: "Gold leaf",
        cond: (p,C)=>C.realm(p,"POL-30")&&C.adult(p)&&!C.noble(p),
        w: .8,
        cool: 9,
        text: `The Lotus Knives, a band of temple-thieves, strip gold leaf and offerings from small shrines and sell them through goldsmiths in the Cotton Bazaar. One of them, a cheerful boy with a knife on a string, needs a lookout for a little roadside shrine tonight. "The god has a thousand faces," he says. "He won't miss one."`,
        choices: [
          {
            t: "Keep watch for a share",
            check: {s:"stealth",s2:"ins",d:40},
            win: {
              r: "A whistle, a scrape, and gold leaf in a twist of cloth. Your share is a lotus and a bad dream about elephants.",
              fx: {coin:8,honor:-3,piety:-4,skill:{stealth:2}},
            },
            lose: {
              r: "A temple guard and a royal watchman arrive together, then argue over who gets to arrest you. You run while they argue.",
              fx: {health:-5,piety:-2,cause:"a chase through the bazaar"},
            },
          },
          {
            t: "Refuse, and leave a flower at the shrine",
            r: "You leave a marigold on the bare stone the next morning. Someone has already stripped it. The god looks at you, patient.",
            fx: {piety:3},
          },
          {
            t: "Tip off the temple guards",
            r: "The guards catch the boy. They pay you nothing and suspect you of everything. Temples, they say, do not need help.",
            fx: {honor:1,newRel:{type:"enemy",op:-20}},
          },
        ],
      },
      {
        id: "ss_rp_oneface",
        title: "The One Face",
        cond: (p,C)=>C.realm(p,"POL-30")&&C.adult(p),
        w: .9,
        cool: 8,
        text: "On the River Steps a woman preacher of the One Face is teaching that the thousand gods are one god, that the temples should give up their land and courts, and that twelve in the hundred is theft. A crowd of thousands listens. In the crowd you see a man with his hand inside his shirt, moving toward her.",
        choices: [
          {
            t: "Grab his arm",
            check: {s:"spd",s2:"unarmed",d:44},
            win: {
              r: "A knife clatters on the steps. The crowd takes him. The preacher looks at you once and nods, and keeps preaching.",
              fx: {honor:5,fame:3,skill:{unarmed:2},newRel:{type:"friend",op:25}},
            },
            lose: {
              r: "He twists free and slashes your arm, then vanishes. The preacher is safe. You are bleeding.",
              fx: {health:-12,wound:"deep_cut",honor:3,cause:"a knife on the River Steps"},
            },
          },
          {
            t: "Shout a warning",
            r: "Heads turn, the man melts away, and the preacher's friends close round her. Nobody knows whose man he was.",
            fx: {honor:2},
          },
          {
            t: "Leave. Temple quarrels are deadly",
            r: "You hear that evening that nothing happened. This time.",
            fx: {trait:"cautious"},
          },
        ],
      },
      {
        id: "ss_rp_poison",
        title: "A pinch in the curry",
        cond: (p,C)=>C.realm(p,"POL-30")&&C.adult(p)&&(C.job(p,"servant")||C.town(p)),
        w: .8,
        cool: 10,
        text: "A well-dressed stranger finds you at the Sugar House and offers twenty lotus, half a year's wages, to drop a pinch of white powder into a lord's dish at a feast where you serve. Poisoning at court is the great crime of Ranpur, and a poisoner is made to swallow his own poison.",
        choices: [
          {
            t: "Refuse and walk out",
            r: "You leave the sugar cake on the plate. On the way home you look behind you a great deal.",
            fx: {honor:3,trait:"honest"},
          },
          {
            t: "Take the powder to the palace tasters",
            check: {s:"persuasion",s2:"intrigue",d:44},
            win: {
              r: "The chief taster takes it, tests it on a cat, and goes very pale. You are paid, quietly, and given a place in the palace kitchens.",
              fx: {coin:30,favor:5,job:"servant",flag:"ss_rp_taster"},
            },
            lose: {
              r: "The tasters think you are the poisoner, losing your nerve. It takes a terrible week to clear your name.",
              fx: {health:-10,wil:2,cause:"questioning by palace guards"},
            },
          },
          {
            t: "Take the money and throw the powder in the river",
            check: {s:"deception",s2:"wil",d:48},
            win: {
              r: "Twenty lotus, a clean dish, and a stranger who will be very puzzled. You leave town for a month.",
              fx: {coin:150,honor:-2,skill:{deception:3}},
            },
            lose: {
              r: "The stranger is still watching when you empty the powder. You are found in an alley the next morning, alive, barely.",
              fx: {health:-25,wound:"scar_chest",wil:2,cause:"a poisoner's men"},
            },
          },
        ],
      },
      {
        id: "ss_rp_dowry",
        title: "The dowry",
        cond: (p,C)=>C.realm(p,"POL-30")&&C.adult(p),
        w: .8,
        cool: 10,
        text: ()=>`Your ${A.pick(["younger sister","niece","cousin"])} is to marry, and Ranpuri families arrange marriages with a dowry of cloth and gold. The groom's family is asking for more than your family has: four bolts of silk-bordered cotton, a gold necklace, and two silver lamps. The women of the house, who keep the household gold, look at you.`,
        choices: [
          {
            t: "Pay your share of the gold (40 suns)",
            req: p=>p.coin>=40,
            r: "The wedding goes ahead, drums and lamps and three days of sweets. Your sister weeps on your neck.",
            fx: {coin:-40,honor:3,rel:{who:"sibling",op:15}},
          },
          {
            t: "Bargain the groom's family down",
            check: {s:"trade",s2:"diplomacy",d:44},
            win: {
              r: "Three bolts, a smaller necklace, one lamp, and a promise of indigo cloth next year. Both families feel cheated, which is how you know it was fair.",
              fx: {coin:-15,skill:{trade:2,diplomacy:1}},
            },
            lose: {
              r: "They take offense and the match is off. Your sister does not speak to you for a long time.",
              fx: {happy:-6,rel:{who:"sibling",op:-15}},
            },
          },
          {
            t: "Spin and weave the cloth yourself",
            check: {s:"craft",s2:"sta",d:40},
            win: {
              r: "A month at the hand spindle and the loom, late into the nights. The cloth is good. The cotton brokers would buy it.",
              fx: {coin:-8,skill:{craft:3},sta:.3},
            },
            lose: {r:"Uneven thread, crooked weave. The groom's mother sniffs.",fx:{coin:-20,happy:-2}},
          },
        ],
      },
      {
        id: "ss_rp_levy",
        title: "After the rice harvest",
        cond: (p,C)=>C.realm(p,"POL-30")&&C.adult(p)&&C.male(p)&&!C.old(p)&&!C.noble(p)&&free(p),
        w: 1,
        cool: 6,
        text: "The levy is called after the rice harvest and never in the monsoon. This year the Warden of the Nagora March wants men for the road forts, and the Miners of Tirpur, who brought down a tower of the Dwarf's Gate in 1084, are looking for strong backs who are not afraid of the dark.",
        choices: [
          {
            t: "Join the Miners of Tirpur",
            check: {s:"str",s2:"wil",d:44},
            win: {
              r: "Tunnels, props, candles that tell you when the air is bad. The old miners call you a mole and mean it kindly.",
              fx: {skill:{siegecraft:4},str:.6,merit:2},
            },
            lose: {
              r: "A prop gives way in a practice gallery. They dig you out.",
              fx: {health:-15,wound:"broken_ribs",wil:1.5,cause:"a tunnel collapse"},
            },
          },
          {
            t: "Serve with the archers at the road forts",
            check: {s:"bow",s2:"sta",d:40},
            win: {
              r: "A season on the Nagora road, watching dwarf caravans and toll books. You shoot well and learn a great deal about tolls.",
              fx: {skill:{bow:3},coin:10,merit:1},
            },
            lose: {
              r: "The cold up near the pass gives you a fever all season.",
              fx: {health:-8,wil:1,cause:"mountain fever"},
            },
          },
          {
            t: "Pay the headman to strike your name (10 lotus)",
            req: p=>p.coin>=77,
            r: "Seventy-seven suns of silver. Your name is struck. Someone else's is written in.",
            fx: {coin:-77,honor:-2},
          },
        ],
      },
      {
        id: "ss_rp_python",
        title: "In the paddy",
        cond: (p,C)=>C.realm(p,"POL-30")&&C.ageAdj(p)>=12&&!C.old(p),
        w: .8,
        cool: 9,
        text: "Something huge is lying in the flooded paddy under the water, and a goat has gone missing. A world python, longer than three men, thick as a tree, believed by some to be the root of the world. The farmers have climbed onto the dyke. Somebody has to do something.",
        choices: [
          {
            t: "Wade in with a spear",
            r: "You step down into the warm water.",
            fx: {beast:{id:"CRE-51",place:"a flooded paddy",mod:.8}},
          },
          {
            t: "Rope it with the other farmers",
            check: {s:"str",s2:"command",d:44},
            win: {
              r: "Six men, two ropes, a great deal of shouting. You drag it to the forest edge and let it go. The temple says that was the right thing.",
              fx: {str:.5,skill:{command:2},piety:2,fame:1},
            },
            lose: {
              r: "It wraps round the farmer next to you. You all pull him free, bruised and gasping.",
              fx: {health:-6,wil:1,cause:"a world python"},
            },
          },
          {
            t: "Drain the paddy and wait",
            r: "It leaves on its own, two days later, and so does a lot of rice.",
            fx: {coin:-5,trait:"patient"},
          },
        ],
      },
      {
        id: "ss_rp_pirates",
        title: "Pirates at the river mouth",
        cond: (p,C)=>C.realm(p,"POL-30")&&C.adult(p)&&!C.old(p)&&(C.coast(p)||C.job(p,"sailor","fish","merchant")),
        w: .9,
        cool: 8,
        text: "Pirates at the river mouths are one of Ranpur's oldest troubles. A fast boat with a dozen men in it is coming up behind your cotton barge at dusk, and the barge master is shouting for anyone who can hold a weapon.",
        choices: [
          {
            t: "Fight them at the rail",
            check: {s:"melee",s2:"ins",d:46},
            win: {
              r: "The first man over the rail goes into the river. The second thinks better of it. The boat drops back into the dark.",
              fx: {skill:{melee:3},coin:15,fame:2},
            },
            lose: {
              r: "They come over the rail in a rush. You go into the water and swim for the reeds. The cargo is gone.",
              fx: {health:-14,wound:"deep_cut",coin:-10,cause:"river pirates"},
            },
          },
          {
            t: "Shoot from the stern",
            req: (p,C)=>C.prof(p,"bow",30)||C.prof(p,"xbow",30),
            check: {s:"bow",s2:"xbow",d:44},
            win: {
              r: "Three shots, two hits, and their steersman down. The pirate boat wallows and falls behind.",
              fx: {skill:{bow:3},coin:15,fame:2},
            },
            lose: {r:"Your shots go wide in the dusk.",fx:{coin:-8,skill:{bow:1}}},
          },
          {
            t: "Steer for the shallows where their keel will catch",
            check: {s:"sea",s2:"int",d:42},
            win: {
              r: "Your flat barge skims the mud bank; their keeled boat grounds with a crunch. You wave as you pass.",
              fx: {skill:{sea:3},int:.3,coin:10},
            },
            lose: {r:"You ground the barge instead. A long night.",fx:{coin:-12,happy:-3}},
          },
        ],
      },
      {
        id: "ss_rp_cotton",
        title: "The cotton brokers",
        cond: (p,C)=>C.realm(p,"POL-30")&&C.adult(p)&&C.female(p),
        w: .9,
        cool: 8,
        text: "In Ranpur women keep the household gold and run much of the cotton trade. The broker houses of the Cotton Bazaar, led by Amar Sethi, buy hand-spun thread from a thousand villages. A broker's agent says your thread is the finest in the district, and offers a contract for a year's spinning.",
        choices: [
          {
            t: "Sign, and organize the village spinners under you",
            check: {s:"stewardship",s2:"trade",d:42},
            win: {
              r: "Twenty spinners, one contract, and your mark on the bales. By the Festival of Lamps you are the richest woman in the village.",
              fx: {coin:45,skill:{stewardship:2,trade:2},fame:1},
            },
            lose: {
              r: "Half the spinners go back to their own brokers mid-season. You fill the contract alone, spinning till your fingers bleed.",
              fx: {coin:12,wil:1.5},
            },
          },
          {
            t: "Sign for yourself alone",
            r: "A steady price for good thread. Not a fortune; a living.",
            fx: {coin:15,skill:{craft:2}},
          },
          {
            t: "Hold out for a better price",
            check: {s:"trade",s2:"wil",d:46},
            win: {r:"The agent comes back twice. The third time he pays your price.",fx:{coin:25,skill:{trade:3}}},
            lose: {r:"He signs your neighbor instead.",fx:{happy:-3}},
          },
        ],
      },
      {
        id: "ss_rp_journeymen",
        title: "Two quiet passengers",
        cond: (p,C)=>early()&&C.realm(p,"POL-30")&&C.adult(p)&&(C.coast(p)||C.job(p,"sailor","fish","merchant")||C.prof(p,"sea",25)),
        w: .9,
        once: !0,
        text: "At Jaya's Landing a Keshi captain wants a river pilot to take two quiet passengers and a crate of rags upriver, no questions. The passengers are pale young men with paper-pulp in the creases of their hands. Qadir would kill to get them back. A paper mill on the Chanpur would make Ranpur rich.",
        choices: [
          {
            t: "Pilot them upriver",
            check: {s:"sea",s2:"stealth",d:44},
            win: {
              r: "Five nights on the river, the young men silent under sacking. You hand them to a merchant's factor at a landing above the city. You are paid in gold.",
              fx: {coin:40,skill:{sea:2},flag:"ss_rp_paper"},
            },
            lose: {
              r: "A Qadiri ship's boat follows you upriver for two days. You land the passengers in the reeds and run.",
              fx: {coin:10,wil:1,newRel:{type:"enemy",op:-20}},
            },
          },
          {
            t: "Refuse. Qadir has long arms",
            r: "Another pilot takes them. You hear he was found in the river a month later, without his purse.",
            fx: {trait:"cautious"},
          },
          {
            t: "Sell the news to a Qadiri merchant at the harbor",
            check: {s:"intrigue",s2:"ins",d:46},
            win: {
              r: "The Qadiri pays in silver qadr and leaves at a run. You do not want to know the rest.",
              fx: {coin:25,honor:-3,skill:{intrigue:2}},
            },
            lose: {
              r: "The Qadiri merchant is a cloth merchant and has no idea what you are talking about. The Keshi captain hears you tried.",
              fx: {newRel:{type:"enemy",op:-25}},
            },
          },
        ],
      },
      {
        id: "ss_rp_moonpearl",
        title: "Moon-Pearl did not eat",
        cond: (p,C)=>early()&&C.realm(p,"POL-30")&&C.ageAdj(p)>=10,
        w: .8,
        once: !0,
        text: "A temple boy of the White Stable runs past you in the Temple City, white-faced, and blurts it out: Moon-Pearl, the white elephant, did not eat this morning. She is 58 and half blind and has no calf, and the Thousand Names teaches that when she dies without one, the dream ends.",
        choices: [
          {
            t: "Calm the boy and tell him to say nothing",
            r: "He nods, shaking. By evening the news is all over the city anyway. Rumor in Ranpur runs faster than any elephant.",
            fx: {honor:1,trait:"calm"},
          },
          {
            t: "Run to the Great Temple and pray for her",
            r: "The temple is already full of people praying. Flowers pile up at the White Stable gate. Two days later she eats again, and the city breathes.",
            fx: {piety:4,happy:2},
          },
          {
            t: "Sell the news to the Raja's cousin's men",
            check: {s:"intrigue",s2:"spd",d:44},
            win: {
              r: "Lord Kiran Ranavir's steward pays you a lotus for being first. Kiran wants to know everything before the temples do.",
              fx: {coin:8,honor:-2,skill:{intrigue:2}},
            },
            lose: {
              r: "Kiran's steward already knew. He looks at you as if you were selling him water in the monsoon.",
              fx: {},
            },
          },
        ],
      },
    ]);
    A.defEvents([
      {
        id: "ss_br_articles",
        title: "Signing the Articles",
        cond: (p,C)=>C.realm(p,"POL-33")&&C.adult(p)&&!C.flag(p,"ss_br_signed")&&!C.noble(p),
        w: 1.3,
        once: !0,
        text: p=>`Anyone who can row or fight may sign the Articles and take a share. At the Shrine of the Dice the quartermaster holds out the share-book and a pen${p.literate?"":", and shows you where to make your mark"}. The Articles are read aloud: harm a crew-mate at sea and you are marooned on Wreck Isle; cheat at the share-out and the Drowning Post waits; tell the dragon's secret and you are drowned with a stone.`,
        choices: [
          {
            t: "Sign, and take your share-book",
            r: "Your name, or your mark, in the book. A crew-family name for now, until a deed earns you a better one. You are crew.",
            fx: p=>(p.flags.ss_br_signed=A.S.year,p.job||(p.job={c:"pirate",r:0,y:0,perf:55}),A.trainSkill(p,"sea",2),p.happy=A.clamp(p.happy+4,0,100),""),
          },
          {
            t: "Sign, and throw the dice at the shrine for luck",
            check: {s:"gambling",s2:"ins",d:36},
            win: {
              r: "Double sixes in the painted cave. The crew roars. A lucky hand on the first day is a lucky hand for the whole voyage.",
              fx: {flag:"ss_br_signed",skill:{gambling:2,sea:1},fame:2,happy:4},
            },
            lose: {
              r: "Snake eyes. The old pirates look at each other. You sign anyway, and the cook spits over his shoulder every time you pass.",
              fx: {flag:"ss_br_signed",skill:{sea:1},happy:-2},
            },
          },
          {
            t: "Say you will work the Caulkers' Strand instead",
            r: "Pitch, oakum and hammers. Somebody has to keep the ships afloat. The caulkers sign nothing, and take no share, and sleep at night.",
            fx: {flag:"ss_br_signed",skill:{craft:3},coin:5},
          },
        ],
      },
      {
        id: "ss_br_dice",
        title: "Dice before the raid",
        cond: (p,C)=>C.realm(p,"POL-33")&&C.adult(p)&&!C.old(p)&&(C.flag(p,"ss_br_signed")||C.job(p,"pirate","sailor")||C.soldier(p)),
        w: 1.1,
        cool: 4,
        text: ()=>`Before every raid the dice are thrown at the Shrine of the Dice. Tonight your captain throws for a ${A.pick(["fat Lucernan cog that slipped the toll","Qadiri merchantman that refuses to pay","Morhaven grain ship running late in the season"])}, and they come up ones: the laughing god's worst throw. The captain wants to sail anyway.`,
        choices: [
          {
            t: "Speak up for waiting a night",
            check: {s:"persuasion",s2:"faith",d:40},
            win: {
              r: "The crew agrees: no fool sails on snake eyes. The next night the dice come up fives, and the prize is taken without a drop of blood.",
              fx: {coin:25,skill:{persuasion:2},honor:2},
            },
            lose: {
              r: "The captain says the luck-gods can drown. You sail. You should not have.",
              fx: {health:-10,coin:5,wil:1,cause:"an unlucky raid"},
            },
          },
          {
            t: "Sail with him and fight well",
            check: {s:"melee",s2:"ins",d:46},
            win: {
              r: "The gods were joking. The prize strikes its sail at the first hook. Your share is fat.",
              fx: {coin:35,skill:{melee:2},fame:1},
            },
            lose: {
              r: "The cog has marines aboard. You come home with a wound and no share.",
              fx: {health:-15,wound:"scar_arm",wil:1,cause:"a raid gone wrong"},
            },
          },
          {
            t: "Throw the dice again yourself",
            check: {s:"gambling",s2:"spd",d:44},
            win: {
              r: "Your throw comes up sixes, and nobody saw the little twist of the wrist. The crew sails singing.",
              fx: {coin:25,skill:{gambling:3},honor:-1},
            },
            lose: {r:"Ones again. Now the crew looks at you as if you were the bad luck.",fx:{happy:-4}},
          },
        ],
      },
      {
        id: "ss_br_maroon",
        title: "Wreck Isle",
        cond: (p,C)=>C.realm(p,"POL-33")&&C.adult(p),
        w: .9,
        cool: 9,
        setup: (p,ctx)=>{ctx.n=loc(p,"M"),ctx.m=loc(p,"F")},
        text: "At sea, in a quarrel over a stolen ration of wine, {n} stabbed {m} in the arm. Harming a crew-mate at sea means marooning on Wreck Isle, with goats, a water skin and the lookouts' contempt. You saw it. The crew will vote, and they want to hear what you saw.",
        choices: [
          {
            t: "Tell it straight",
            r: "You tell it as it happened. {n} is set ashore on Wreck Isle with a skin of water. He does not curse you. That is worse.",
            fx: {honor:4,wil:.8},
          },
          {
            t: "Say {m} drew first",
            check: {s:"deception",s2:"persuasion",d:44},
            win: {
              r: "The crew splits and nobody is marooned. {n} owes you his life. {m} knows you lied.",
              fx: {newRel:{type:"friend",op:30},honor:-4,skill:{deception:2}},
            },
            lose: {r:"Two others saw it too. Now you are voted on with him.",fx:{honor:-6,coin:-15,happy:-5}},
          },
          {
            t: "Say you were looking at the sea",
            r: "Nobody believes you, and nobody blames you. The vote goes against {n} anyway.",
            fx: {honor:-1},
          },
        ],
      },
      {
        id: "ss_br_earring",
        title: "The gold earring",
        cond: (p,C)=>C.realm(p,"POL-33")&&C.ageAdj(p)>=10,
        w: .8,
        cool: 10,
        text: ()=>`${A.pick(["Old Hob, who taught you knots","Your crew-mate Tansy","The one-eyed caulker who fed you as a child"])} is dead. Corsairs are sewn into sailcloth with a stone and sunk, and the gold earring goes with them to pay the Drowned Queen. But this earring is heavy gold, and there are debts.`,
        choices: [
          {
            t: "Sew the earring into the sailcloth",
            r: "The last stitch goes through the nose, as the old way says. Over the side. The Drowned Queen is paid, and the dead drink in her hall.",
            fx: {piety:3,honor:2,wil:1},
          },
          {
            t: "Keep the earring for the debts",
            r: "Nobody says anything. Somebody spits. You pay the debts. You do not sleep well on the water after that.",
            fx: {coin:12,piety:-4,honor:-3},
          },
          {
            t: "Throw a coin of your own after it",
            req: p=>p.coin>=5,
            r: "Gold earring and your own silver crown. The crew sees it and nods. Generous to the dead is generous to the living.",
            fx: {coin:-5,piety:3,honor:3},
          },
        ],
      },
      {
        id: "ss_br_wheresleeps",
        title: "Where does the dragon sleep?",
        cond: (p,C)=>C.realm(p,"POL-33")&&C.adult(p),
        w: .9,
        cool: 8,
        text: ()=>`In the Upturned Queen a ${A.pick(["Varennan sailor with clean hands","Qadiri merchant who drinks water","Lucernan factor's clerk"])} buys you rum and, very casually, asks where the dragon sleeps. Asking that question gets strangers killed in Blackreef. Anyone who tells the dragon's secret is drowned with a stone.`,
        choices: [
          {
            t: "Tell him the dragon sleeps under the Strait, and eats the curious",
            r: "He laughs, a little nervously. You finish his rum and leave. The story you told is the story everyone tells.",
            fx: {skill:{deception:1},happy:1},
          },
          {
            t: "Report him to the Forty",
            check: {s:"intrigue",s2:"ins",d:40},
            win: {
              r: "Sten the Quiet listens and nods once. The stranger takes a boat at dawn and is not seen again. You get a share and a look from Sten.",
              fx: {coin:20,favor:3,honor:-1,skill:{intrigue:2}},
            },
            lose: {
              r: "The Forty want to know why he picked you. That is a long night.",
              fx: {wil:1,health:-5,cause:"questioning by the Forty"},
            },
          },
          {
            t: "Sell him the truth",
            check: {s:"stealth",s2:"deception",d:56},
            win: {
              r: "Oil, rafts, sulfur, Ratrock caves. He pays sixty suns in gold. You leave the Reef the next week, rich and hunted.",
              fx: {coin:60,honor:-8,flag:"ss_br_told",newRel:{type:"enemy",op:-40}},
            },
            lose: {
              r: "The man at the next table is one of the Forty.",
              fx: {die:"drowned with a stone for telling the dragon's secret"},
            },
          },
        ],
      },
      {
        id: "ss_br_beach",
        title: "Fists on the beach",
        cond: (p,C)=>C.realm(p,"POL-33")&&grown(p,C)&&!C.old(p),
        w: 1,
        cool: 5,
        setup: (p,ctx)=>{ctx.n=loc(p,"M")},
        text: "On the Reef, brawls are settled with fists on the beach, never with blades ashore. {n}, a big oarsman from another crew, says you short-changed him at dice, in front of everyone. The crews are already drawing a ring in the sand.",
        choices: [
          {
            t: "Fight him on the beach",
            r: "You step into the ring with your fists up.",
            fx: {
              duel: {
                tier: 2,
                title: "a big oarsman",
                troop: "MR",
                opts: {kind:"brawl",place:"the beach at Blackreef",lethal:!1,toYield:!0,title:"Fists on the beach"},
              },
            },
          },
          {
            t: "Throw the dice again before the crowd",
            check: {s:"gambling",s2:"wil",d:40},
            win: {
              r: "Fair dice, fair throw, and you win again. The crowd laughs at {n}. He buys you a drink, scowling.",
              fx: {skill:{gambling:2},fame:1},
            },
            lose: {r:"You lose, pay double, and still have to buy the drinks.",fx:{coin:-8,happy:-2}},
          },
          {
            t: "Pay him what he says, and walk away",
            r: "The crowd jeers. Your coin is lighter. Your face is unbroken.",
            fx: {coin:-5,honor:-2},
          },
        ],
      },
      {
        id: "ss_br_tollboat",
        title: "The toll boat",
        cond: (p,C)=>C.realm(p,"POL-33")&&C.adult(p)&&!C.old(p)&&(C.flag(p,"ss_br_signed")||C.job(p,"pirate","sailor")||C.soldier(p)),
        w: 1.1,
        cool: 5,
        text: "You crew one of Wystan Coyle's toll boats on the Western Approach lane, meeting ships that have cleared the Strait of Hael. One in forty of cargo value, in Lucernan gold crowns. This one is a big Qadiri merchantman, and Qadiri ships refuse the toll. Her rail is lined with men.",
        choices: [
          {
            t: "Board her with the hooks",
            check: {s:"melee",s2:"athletics",d:48},
            win: {
              r: "Hooks over, short blades out, and the Qadiri crew gives way. You take the toll, and a bit more for the trouble.",
              fx: {coin:30,skill:{melee:2,athletics:2},fame:2},
            },
            lose: {
              r: "They cut the hooks and throw you back. You swim for the toll boat with a gash in your side.",
              fx: {health:-16,wound:"deep_cut",wil:1,cause:"a Qadiri cutlass"},
            },
          },
          {
            t: "Shoot their steersman from the toll boat",
            req: (p,C)=>C.prof(p,"xbow",30)||C.gear(p,"ranged","xbow"),
            check: {s:"xbow",s2:"ins",d:44},
            win: {
              r: "One bolt and the big ship yaws into the wind. Her captain pays the toll with a face like thunder.",
              fx: {coin:25,skill:{xbow:3},fame:1},
            },
            lose: {
              r: "Your bolt hits the mast. Their crossbows answer.",
              fx: {health:-10,wound:"arrow_wound",cause:"a Qadiri crossbow bolt"},
            },
          },
          {
            t: "Point at the smoke on the horizon and talk about the dragon",
            check: {s:"intimidation",s2:"deception",d:42},
            win: {
              r: `"It is hungry this year," you shout across the water, and point at a fire-raft's smoke. The Qadiri captain pays. The dragon is worth more than any battle.`,
              fx: {coin:25,skill:{intimidation:3}},
            },
            lose: {
              r: "The Qadiri captain laughs and keeps sailing. Qadir does not believe in your dragon.",
              fx: {happy:-3},
            },
          },
        ],
      },
      {
        id: "ss_br_oars",
        title: "The Freed Oars",
        cond: (p,C)=>C.realm(p,"POL-33")&&C.adult(p),
        w: 1,
        cool: 7,
        text: p=>bond(p)?"You pull an oar on a Reef galley, taken from a prize like most of the rowers. Tam Oarsman, a freed galley slave, leads the Freed Oars, who want galley slavery ended and a seat at the Table for freedmen. Tonight one of his people whispers to you on the bench: there will be a vote, and a share-book for any oar who fights at the next prize.":"Galley slaves taken from prizes pull most of the Reef's oars. Tam Oarsman, a freed galley slave, leads the Freed Oars, who want galley slavery ended and a seat at the Captains' Table for freedmen. He asks you to speak for them at the next crew vote.",
        choices: [
          {
            t: p=>bond(p)?"Fight at the next prize for a share-book":"Speak for the Freed Oars",
            check: {s:"melee",s2:"persuasion",d:44},
            win: {
              r: (p,ctx)=>ctx.wasBond?"You come over the rail with the boarders and fight like a free man. The crew votes: a share-book for you. You are crew now, not cargo.":"You speak plainly: a man who rows and bleeds is crew. The vote goes your way, narrowly, and three freedmen get share-books.",
              fx: (p,ctx)=>{if(bond(p)){ctx.wasBond=1;const t=setFree(p,"ss_br_freed");return p.flags.ss_br_signed=A.S.year,t}return p.honor=A.clamp(p.honor+4,0,100),A.fame(p,2),""},
            },
            lose: {
              r: p=>bond(p)?"You fight, you bleed, and the crew votes no. Next time, maybe.":"The old captains laugh you down. Ima Redsail's people take note of your name.",
              fx: {wil:1.5,health:-6,cause:"a boarding fight"},
            },
          },
          {
            t: "Keep your head down",
            r: p=>bond(p)?"Pull, rest, pull. The Freed Oars will win or lose without you.":"You stay away from the vote. It fails by one hand.",
            fx: {wil:.6},
          },
          {
            t: p=>bond(p)?"Tell the oar-master about the whispers":"Tell the captains what Tam plans",
            r: "The captains are grateful in silver. The Freed Oars are not grateful at all.",
            fx: {coin:10,honor:-4,newRel:{type:"enemy",op:-30}},
          },
        ],
      },
      {
        id: "ss_br_handfast",
        title: "Handfast before the crew",
        cond: (p,C)=>C.realm(p,"POL-33")&&C.adult(p)&&!C.married(p)&&!C.old(p),
        w: .9,
        cool: 9,
        setup: (p,ctx)=>{ctx.n=loc(p,p.sex==="F"?"M":"F")},
        text: "On the Reef, couples handfast before the crew: hands tied with a bit of rigging on the beach, the crew as witness, and a bottle of stolen wine. {n} of your crew has been sitting next to you at every meal for a month and has finally asked you, in front of everyone, to tie the knot.",
        choices: [
          {
            t: "Hold out your hand for the rope",
            r: "A bowline round both wrists, the crew cheering, rum poured over the knot. Children of crew are crew, the quartermaster says, and winks.",
            fx: {lover:!0,happy:7},
          },
          {
            t: "Say yes, after the next voyage",
            check: {s:"persuasion",s2:"etiquette",d:34},
            win: {r:"{n} laughs and agrees. The waiting makes it sweeter.",fx:{lover:!0,happy:3}},
            lose: {r:"{n} takes it as a no. So does the crew, loudly.",fx:{happy:-4}},
          },
          {
            t: "Say no, kindly",
            r: "The crew groans. {n} shrugs and sits somewhere else at dinner. The sea is full of fish.",
            fx: {happy:-1},
          },
        ],
      },
      {
        id: "ss_br_crossbows",
        title: "Pay owed at Tessar",
        cond: (p,C)=>early()&&C.realm(p,"POL-33")&&C.adult(p)&&!C.old(p)&&(C.soldier(p)||C.prof(p,"xbow",25)||C.gear(p,"ranged","xbow")),
        w: 1,
        once: !0,
        text: "Eight hundred Reef Crossbows under Brann Hollow serve Queen Livia of Tessaria for all of 1105, and half their pay is owed. A letter reaches the Reef: Prince Andros, Livia's enemy, offers double. You have a brother in the Crossbows, and a boat leaving for Tessar tomorrow.",
        choices: [
          {
            t: "Sail to Tessar and join the Crossbows",
            check: {s:"xbow",s2:"sta",d:42},
            win: {
              r: "You shoot your way into Brann Hollow's company on the first day. The pay is owed, the war is real, and you are good at it.",
              fx: {skill:{xbow:3},coin:15,merit:2,flag:"ss_br_tessar"},
            },
            lose: {
              r: "Fever on the voyage. You arrive too sick to stand, and sail home.",
              fx: {health:-12,wil:1,cause:"ship fever"},
            },
          },
          {
            t: "Carry the prince's offer to the Crossbows",
            check: {s:"intrigue",s2:"persuasion",d:46},
            win: {
              r: "Half the company listens. Brann Hollow hears of it and pays them out of his own chest to stay. Either way, you are paid for the letter.",
              fx: {coin:25,honor:-3,skill:{intrigue:2}},
            },
            lose: {
              r: "Queen Livia's men catch you with the letter. Nell Brine has to buy you back.",
              fx: {prison:1,why:"carrying the prince's letters at Tessar"},
            },
          },
          {
            t: "Stay on the Reef. Other people's wars",
            r: "The boat leaves without you. Your brother sends word that he is alive and unpaid.",
            fx: {},
          },
        ],
      },
      {
        id: "ss_br_vote",
        title: "A message for Ima Redsail",
        cond: (p,C)=>early()&&C.realm(p,"POL-33")&&C.adult(p),
        w: .9,
        once: !0,
        text: "Ima Redsail, nine ships strong, wants to vote Nell Brine out at Share Day and go back to open raiding. Grusk Tallyman, a clerk at Nell's own table, needs a stranger to carry Ima a message that Nell's sworn men must not see. He offers you a full share.",
        choices: [
          {
            t: "Carry it to Ratrock",
            check: {s:"stealth",s2:"sea",d:44},
            win: {
              r: "A small boat at night across to the Redsails' caves. Ima reads it, laughs, and gives you a gold ring. You have chosen a side, quietly.",
              fx: {coin:25,skill:{stealth:2},flag:"ss_br_redsail"},
            },
            lose: {
              r: "Nell's sworn men stop your boat. You toss the message overboard. They know anyway.",
              fx: {newRel:{type:"enemy",op:-30},health:-6,cause:"a beating by Nell's men"},
            },
          },
          {
            t: "Take it to Nell Brine instead",
            check: {s:"intrigue",s2:"persuasion",d:44},
            win: {
              r: "Nell reads it on the deck of her ship, where she spends more and more days. She thanks you and pays double. Grusk Tallyman has a bad week.",
              fx: {coin:40,favor:6,honor:-2},
            },
            lose: {r:"Nell suspects you of carrying for both sides. She is not wrong to wonder.",fx:{favor:-3}},
          },
          {
            t: "Refuse. Captains' quarrels drown little people",
            r: "Grusk finds someone else. On Share Day you watch the vote from the back of the crowd.",
            fx: {trait:"cautious"},
          },
        ],
      },
      {
        id: "ss_br_crab",
        title: "The crab pots",
        cond: (p,C)=>C.realm(p,"POL-33")&&kid(p,C,6,13),
        w: 1,
        once: !0,
        text: "You are helping an old fisherwoman haul crab pots in the cold water off the isles, when one pot comes up with a giant spider crab clinging to it, legs as long as your arms. The fisherfolk say they drown men by dragging them down.",
        choices: [
          {
            t: "Grab it by the back and pull it off",
            check: {s:"ins",s2:"str",d:20},
            win: {
              r: 'It waves its legs very slowly and does nothing at all. "Harmless," the old woman says. "Slow as a quartermaster." You eat it that night.',
              fx: {int:.3,happy:3,trait:"brave"},
            },
            lose: {
              r: "It pinches your thumb, gently, and you drop it overboard. The old woman laughs till she coughs.",
              fx: {happy:1},
            },
          },
          {
            t: "Scream and hide in the bilge",
            r: 'The old woman pulls you out by the collar. "That thing has never drowned anyone," she says. "Neither will you, if you stop shouting."',
            fx: {happy:-2,int:.2},
          },
          {
            t: "Ask her how she knows the shoals so well",
            r: "She names every rock from Gull Isle to Wreck Isle, and which ones show at low water. You know a dozen by the end of the day.",
            fx: {skill:{sea:2,survival:1}},
          },
        ],
      },
      {
        id: "ss_br_shoalpilot",
        title: "The shoals by night",
        cond: (p,C)=>C.realm(p,"POL-33")&&(C.teen(p)||C.adult(p)&&C.ageAdj(p)<26)&&free(p),
        w: 1,
        once: !0,
        text: `The Shoal Pilots, sixty of them, know every rock around the isles by night. Lark Shoalwise, a young pilot whose father drowned at the Drowning Post, takes you out in a skiff on a moonless night and says, "Take us home. Don't touch a rock."`,
        choices: [
          {
            t: "Steer by the sound of the surf",
            check: {s:"sea",s2:"ins",d:40},
            win: {
              r: "Surf left, surf right, a long smooth swell. You bring the skiff into the harbor channel without a scrape. Lark grins in the dark.",
              fx: {skill:{sea:4},ins:.4,flag:"ss_br_pilot",newRel:{type:"friend",op:20}},
            },
            lose: {
              r: 'A crunch, a lurch, and you are both bailing. Lark sighs. "Again next week," she says.',
              fx: {skill:{sea:2},health:-3,cause:"a skiff on the rocks"},
            },
          },
          {
            t: "Steer by the stars",
            check: {s:"survival",s2:"int",d:42},
            win: {
              r: "You hold a course by the Ship star until the harbor fire shows. Slow and sure.",
              fx: {skill:{sea:3,survival:1}},
            },
            lose: {r:"Clouds. Of course clouds.",fx:{skill:{sea:1}}},
          },
          {
            t: "Ask her why she hates the Drowning Post",
            r: '"Because the tide does not judge," she says. "Men do, and then they say it was the tide." She rows the rest of the way in silence.',
            fx: {int:.4},
          },
        ],
      },
      {
        id: "ss_br_strand",
        title: "Paid double",
        cond: (p,C)=>C.realm(p,"POL-33")&&C.adult(p)&&(C.race(p,"dwarf")||C.job(p,"smith","carpenter")||C.prof(p,"craft",35)),
        w: 1,
        cool: 7,
        text: p=>`On the Caulkers' Strand, slips, rope walks and forges climb the harbor terraces. Dwarf smiths are paid double here, ${p.race==="dwarf"?"which suits you very well,":"which makes the human smiths sour,"} and Old Bett Tarhand of the Caulkers wants a hundred grappling hooks and new chain links before the Lion Fleet sails.`,
        choices: [
          {
            t: "Forge the hooks fast",
            check: {s:"craft",s2:"str",d:42},
            win: {
              r: "A hundred hooks in ten days, every one tested on a beam. Old Bett pays in Lucernan gold and asks if you will stay.",
              fx: {coin:40,skill:{craft:3},str:.4},
            },
            lose: {
              r: "Three hooks snap in the test. Old Bett pays for ninety-seven, sourly.",
              fx: {coin:20,skill:{craft:1}},
            },
          },
          {
            t: "Forge the chain for the harbor mouth",
            check: {s:"craft",s2:"sta",d:48},
            win: {
              r: "Links as thick as your wrist. The harbor chain of old anchor links gets new ones, and your mark is on them.",
              fx: {coin:50,skill:{craft:4},fame:1},
            },
            lose: {
              r: "A cold-shut link. You find it before it fails, which is the only good thing about it.",
              fx: {coin:10,wil:.5},
            },
          },
          {
            t: "Ask for triple",
            check: {s:"trade",s2:"intimidation",d:46},
            win: {
              r: "Old Bett swears at you in three languages and pays it. The Lion Fleet is coming.",
              fx: {coin:60,skill:{trade:2}},
            },
            lose: {r:'She hires a half-orc smith instead. "Double is generous," she says.',fx:{happy:-2}},
          },
        ],
      },
      {
        id: "ss_br_varennan",
        title: "Too many questions",
        cond: (p,C)=>C.realm(p,"POL-33")&&C.adult(p)&&!C.old(p),
        w: .8,
        cool: 9,
        text: `A Varennan sailor in the Upturned Queen asks too many questions about the fire-rafts. The Forty, the oil crews who stage the dragon, want him gone, quietly. Sten the Quiet's man sits down beside you and lays a purse on the table. "Not killed," he says. "Gone. On a ship, far, tonight."`,
        choices: [
          {
            t: "Get him drunk and onto a ship to the Bone Coast",
            check: {s:"deception",s2:"sea",d:42},
            win: {
              r: "Rum, a song, a friendly walk to the harbor, and a salt-fish boat for the Bone Coast. He wakes up a long way from any fire-raft.",
              fx: {coin:20,skill:{deception:2},favor:2},
            },
            lose: {
              r: "He sobers up on the quay and runs. The Forty are not pleased with you.",
              fx: {coin:5,newRel:{type:"enemy",op:-20}},
            },
          },
          {
            t: "Warn the Varennan to leave on his own",
            r: "He is gone by morning on the first boat out. The Forty get what they wanted. You keep the purse anyway. Nobody complains.",
            fx: {coin:20,honor:2},
          },
          {
            t: "Refuse the purse",
            r: "Sten's man shrugs and takes it back. The Varennan is not at the Upturned Queen the next night. You do not ask.",
            fx: {honor:1,wil:.5},
          },
        ],
      },
      {
        id: "ss_br_lionfleet",
        title: "The Lion Fleet",
        cond: (p,C)=>early()&&C.realm(p,"POL-33")&&C.adult(p)&&!C.old(p),
        w: 1,
        once: !0,
        text: "After Sea Opening, word comes from the lookout on Gull Isle: Varenna's Lion Fleet is at sea, and its admiral has sworn to end the dragon toll. The Brotherhood never fights a fleet in the open. The plan is the old one: lure them into the shoals at dusk, and let the fire-rafts and the dragon do the rest.",
        choices: [
          {
            t: "Crew a lure boat into the shoals",
            check: {s:"sea",s2:"wil",d:50},
            win: {
              r: "You run a little galley right under the Lion Fleet's bows and into the shoals, with the warships chasing. Two of them strike rocks. The rafts come alight behind them. The dragon wakes.",
              fx: {skill:{sea:4},fame:4,merit:3,coin:30,deed:"Lured the Lion Fleet into the shoals of Blackreef"},
            },
            lose: {
              r: "A Varennan bolt takes your steersman. You run your own boat onto the rocks and swim for it.",
              fx: {health:-18,wound:"arrow_wound",wil:2,cause:"the Lion Fleet"},
            },
          },
          {
            t: "Work the fire-rafts at Ratrock",
            check: {s:"craft",s2:"spd",d:44},
            win: {
              r: "Oil, sulfur, pitch, and a long burning line across the water. From the mainland it looks exactly like a dragon's breath.",
              fx: {skill:{craft:3},coin:20,flag:"ss_br_forty"},
            },
            lose: {
              r: "A jar splashes. Burns are the Forty's trade mark.",
              fx: {health:-14,wound:"burn",cause:"fire-oil"},
            },
          },
          {
            t: "Hide in the caves with the children",
            r: "You listen to the night from the dark. In the morning the sea is full of wreckage and nobody tells you whose.",
            fx: {trait:"cautious",wil:.5},
          },
        ],
      },
      {
        id: "ss_br_widow",
        title: "A widow's share",
        cond: (p,C)=>C.realm(p,"POL-33")&&C.adult(p),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{ctx.n=loc(p,"F")},
        text: `Under the Articles a widow keeps her husband's share for a year. {n}'s husband drowned in the spring, and now the quartermaster says the year is up a month early, because the old share-book was "copied wrong". {n} has three children and a sharp tongue, and she asks you to stand with her at the crew vote.`,
        choices: [
          {
            t: "Stand with her and show the old share-book",
            check: {s:"learning",s2:"persuasion",d:42},
            win: {
              r: "You read the date out loud from the old book. The crew votes for {n}. The quartermaster smiles like a shark and writes your name in his head.",
              fx: {honor:4,skill:{persuasion:2},newRel:{type:"friend",op:30}},
            },
            lose: {
              r: "The crew believes the quartermaster. {n} takes in washing. She does not blame you.",
              fx: {honor:2,wil:1},
            },
          },
          {
            t: "Give her a little of your own share",
            req: p=>p.coin>=10,
            r: "Ten suns and a bag of dates. Not justice, but bread.",
            fx: {coin:-10,honor:2,trait:"generous"},
          },
          {
            t: "Stay out of the quartermaster's way",
            r: "He keeps the book. Nobody who wants a share crosses the man who keeps the book.",
            fx: {honor:-1},
          },
        ],
      },
      {
        id: "ss_br_urka",
        title: "A seat at the Table",
        cond: (p,C)=>C.realm(p,"POL-33")&&C.adult(p),
        w: .7,
        cool: 12,
        text: "The orc rower Urka Saltjaw has won a captain's share-book at dice, fair and square, and now she wants to sit at the Captains' Table. Anyone who can row or fight is welcome on the Reef. Nobody has ever said anything about a seat at the Table, and nobody wants to be the one to tell her no.",
        choices: [
          {
            t: "Back her: the Articles say a book is a book",
            check: {s:"persuasion",s2:"learning",d:44},
            win: {
              r: "You read the Articles aloud. Nothing in them about orcs. The Table, grumbling, makes room. Urka slaps you on the back and nearly breaks it.",
              fx: {honor:3,fame:2,newRel:{type:"friend",op:35}},
            },
            lose: {
              r: 'The old captains find a clause about "crew of three years". Urka has two. She takes it well. Mostly.',
              fx: {honor:1,wil:.5},
            },
          },
          {
            t: "Offer to buy the share-book from her",
            req: p=>p.coin>=50,
            check: {s:"trade",s2:"persuasion",d:50},
            win: {
              r: "She laughs, names a price, and you pay it. A captain's share-book, in your name. Now you have to find a ship.",
              fx: {coin:-50,flag:"ss_br_book",fame:1},
            },
            lose: {r:"She laughs and says no. Then she laughs some more.",fx:{happy:-1}},
          },
          {t:"Watch the fun from the back",r:"It is the best evening on the Reef in a year.",fx:{happy:3}},
        ],
      },
      {
        id: "ss_ks_pinch",
        title: "A pinch of pepper",
        cond: (p,C)=>C.realm(p,"POL-21")&&C.ageAdj(p)>=10,
        w: .8,
        cool: 12,
        text: ()=>`${A.pick(["Your grandmother","Your father's old mother","The great-aunt who ran the family garden"])} has died. In Kesh the dead are buried under the house floor with a pinch of pepper in the mouth, and a Rememberer comes to add the name to the family's line. The floor must be lifted, and someone must place the pepper.`,
        choices: [
          {
            t: "Place the pepper yourself",
            r: "One black peppercorn on her tongue, the way she would have weighed it. The Rememberer sings her name. She is under your feet now, close.",
            fx: {piety:4,wil:1},
          },
          {
            t: "Pay the Rememberer to sing the whole line (5 suns)",
            req: p=>p.coin>=5,
            r: "Thirty-one names, back to the first pepper garden. The neighbors stand in the doorway to listen.",
            fx: {coin:-5,piety:3,honor:2},
          },
          {
            t: "Lift the floor stones and lay them again",
            check: {s:"str",s2:"craft",d:32},
            win: {
              r: "The coral slabs go back as if never moved. Your mother says it is the best floor in the street now.",
              fx: {str:.3,skill:{craft:2},piety:2},
            },
            lose: {r:"A slab cracks. You will step over that crack every day of your life.",fx:{wil:.8}},
          },
        ],
      },
      {
        id: "ss_ks_gecko",
        title: "A second pair of hands",
        cond: (p,C)=>early()&&C.realm(p,"POL-21")&&grown(p,C)&&!C.old(p)&&(C.prof(p,"athletics",30)||C.prof(p,"stealth",30)||C.flag(p,"ss_ks_rope")),
        w: 1,
        once: !0,
        text: "Kito the Gecko, the best climbing thief in Kesh, needs a second pair of hands on a wet roof for one night. The house is an Amber merchant's, guarded by Amber marines, and what he wants inside is not gold but a paper: the pledge of the harbor dues of 1105.",
        choices: [
          {
            t: "Climb with Kito",
            check: {s:"athletics",s2:"stealth",d:50},
            win: {
              r: 'Wet tiles, a rope, a shuttered window, a strongbox. Kito takes the paper and gives you a handful of Amber gold. "Never tell," he says, and is gone over the roofs.',
              fx: {coin:40,skill:{athletics:3,stealth:3},flag:"ss_ks_kito",honor:-2},
            },
            lose: {
              r: "A tile goes. You slide, catch the gutter, and the marines' lanterns swing up. You drop and run. Kito, of course, gets away.",
              fx: {health:-10,wound:"bad_knee",wil:1,cause:"a fall from a Kesh roof"},
            },
          },
          {
            t: "Hold the rope below and watch the street",
            check: {s:"ins",s2:"stealth",d:40},
            win: {
              r: "You whistle once when the marine patrol turns the corner. Kito comes down a minute later, grinning.",
              fx: {coin:20,skill:{stealth:2}},
            },
            lose: {
              r: "The patrol sees you holding a rope in the dark. You talk your way out, but not your share.",
              fx: {happy:-2},
            },
          },
          {
            t: "Say no. Paper is worse trouble than gold",
            r: "He shrugs and climbs alone. A week later the whole of Kesh is talking about a theft, and nobody knows what was stolen.",
            fx: {trait:"cautious"},
          },
        ],
      },
      {
        id: "ss_ks_pepperguard",
        title: "The Pepper Guard",
        cond: (p,C)=>C.realm(p,"POL-21")&&C.adult(p)&&!C.old(p)&&free(p),
        w: .9,
        cool: 9,
        text: "Asha Redvine, captain of the Pepper Guard, the Prince's guard and the Pepper Hall watch, is short of men. The work is guarding the scales, the sacks and the weighers from thieves who climb, smugglers who swim and merchants who cheat, which in Kesh is everyone.",
        choices: [
          {
            t: "Join the Pepper Guard",
            check: {s:"ins",s2:"melee",d:42},
            win: {
              r: "On your third night you catch a weigher with filed weights in his sash. He swears the Mistress's own clerks gave them to him. Asha writes it all down.",
              fx: {coin:12,skill:{melee:2,intrigue:1},favor:3,merit:1},
            },
            lose: {
              r: "A climber goes over the Pepper Hall roof right above you with a sack. Asha is not pleased.",
              fx: {coin:4,happy:-3},
            },
          },
          {
            t: "Guard the night shift on the harbor chain",
            check: {s:"sta",s2:"ins",d:38},
            win: {
              r: "Long nights between the Harbor Towers, six hundred crossbowmen and you. Quiet pay, and a fine view.",
              fx: {coin:10,sta:.4,skill:{xbow:1}},
            },
            lose: {r:"You fall asleep. The chain is fine. Your pay is not.",fx:{coin:2}},
          },
          {
            t: "Decline. Guards get blamed",
            r: "In Kesh, guards are blamed for every missing peppercorn. You go back to your own work.",
            fx: {},
          },
        ],
      },
      {
        id: "ss_sb_boiler",
        title: "The runaway boiler",
        cond: (p,C)=>early()&&C.realm(p,"POL-24")&&C.adult(p)&&!C.old(p),
        w: .8,
        once: !0,
        text: 'At Azara, among the pearling boats, a woman with burned hands is hiding: Salwa Ropecutter, who ran from the boiling-sheds at Zariya after the fire that killed eleven slaves. She knows exactly what "lamp oil" is and who buys it. Several people would pay a great deal for her, alive or otherwise.',
        choices: [
          {
            t: "Hide her on your boat and get her out to sea",
            check: {s:"sea",s2:"stealth",d:48},
            win: {
              r: "Three nights among the pearl banks and a transfer to a Keshi trader far out. She presses your hand with her ruined one. You never see her again.",
              fx: {honor:5,skill:{sea:2,stealth:2},flag:"ss_sb_salwa"},
            },
            lose: {
              r: "The Oil Shore Watch searches every boat at Azara. You throw her a rope and she swims for the shore alone.",
              fx: {wil:1.5,favor:-3},
            },
          },
          {
            t: "Sell her location to the Oil-Master's men",
            r: "Qasim Nafari's men pay in gold dinars. They find her the next day. You do not ask what happened.",
            fx: {coin:55,honor:-8,favor:3},
          },
          {
            t: "Look away",
            r: "You never saw a woman with burned hands. In Sabra that is the safest thing a person can see.",
            fx: {trait:"cautious"},
          },
        ],
      },
      {
        id: "ss_rp_tollbooks",
        title: "Two toll books",
        cond: (p,C)=>C.realm(p,"POL-30")&&C.adult(p)&&(C.literate(p)||C.prof(p,"trade",30)||C.soldier(p)),
        w: .8,
        cool: 10,
        text: "At Tirpur, the road fort on the Nagora road, the Treaty of Tirpur gives Stonehold one part in twenty of the tolls. You are copying the toll accounts for the Warden's clerk, and you notice there are two books: one fat, one thin. The thin one is the one Stonehold sees.",
        choices: [
          {
            t: "Copy what you are given and say nothing",
            r: "You copy the thin book in your neatest hand. The Warden's clerk pays you extra for neatness.",
            fx: {coin:8,honor:-1,skill:{learning:1}},
          },
          {
            t: "Make a copy of the fat book for yourself",
            check: {s:"stealth",s2:"learning",d:46},
            win: {
              r: "Three nights of copying by a shaded lamp. You now hold something that could start a war at the Nagora Gate. It sits under your floor like a snake.",
              fx: {flag:"ss_rp_tollbook",skill:{intrigue:3,stealth:1}},
            },
            lose: {
              r: "The clerk finds your copy. You are dismissed, and lucky to be only dismissed.",
              fx: {happy:-5,favor:-3},
            },
          },
          {
            t: "Ask the clerk, innocently, why there are two",
            check: {s:"ins",s2:"deception",d:42},
            win: {
              r: '"One for the gods and one for the dwarves," he says, and laughs, and then stops laughing. He doubles your pay.',
              fx: {coin:15,int:.3},
            },
            lose: {r:"He takes the thin book away and gives the work to someone less curious.",fx:{happy:-2}},
          },
        ],
      },
    ]);
  })();
})();
