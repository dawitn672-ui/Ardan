// The release's event pack 12 of 30 (190 events, mostly ww_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-028). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const R = (p,...ids)=>ids.includes(p.realm),
      free = p=>!["slave","serf"].includes(p.status)&&!p.flags.unfree,
      low = p=>["slave","serf","peasant"].includes(p.status),
      is = (p,...s)=>s.includes(p.status),
      SEX = (p,m,f)=>p.sex==="F"?f:m,
      hm = p=>A.provName(p.home)||"home",
      kid = (p,C)=>C.child(p)&&C.ageAdj(p)>=6,
      grown = (p,C)=>C.adult(p)&&!C.old(p),
      unwed = (p,C)=>C.adult(p)&&!C.old(p)&&!C.married(p),
      early = ()=>!!(A.S&&A.S.year<=1107),
      pid = (p,ctx,type)=>{const q=A.makeAcquaintance(p,type||"friend");return ctx.pid=q.id,q},
      setFree = p=>(delete p.flags.unfree,(p.status==="slave"||p.status==="serf")&&(p.status="peasant"),A.willGrow(p,2,"freedom"),p.happy=A.clamp(p.happy+15,0,100),"(You are free.)");
    A.defEvents([
      {
        id: "ww_ald_ringgame",
        title: "The Ring Game",
        cond: (p,C)=>R(p,"POL-01")&&kid(p,C),
        w: 1,
        cool: 4,
        text: p=>`Winter in ${hm(p)}. The children have scratched the Ring Game into a hall bench: a king and his sworn men in the middle, raiders all round. The king wins if he reaches the edge. ${A.pick(["The smith's boy","The reeve's girl","Your cousin"])} wants to be king. Everyone wants to be king.`,
        choices: [
          {
            t: "Play the raiders and break the ring",
            check: {s:"int",s2:"ins",d:20},
            win: {
              r: "You slip a raider through a gap nobody saw and take the king. The old men by the fire laugh and call you a little Ravenscar.",
              fx: {int:.4,ins:.4,happy:3},
            },
            lose: {
              r: "Your raiders are picked off one by one. The king walks to the edge and the whole bench cheers.",
              fx: {wil:.3,happy:-1},
            },
          },
          {
            t: "Be a sworn man and guard the king to the last",
            r: 'You lose every piece but the king, and the king gets out. A hall-priest watching nods. "Iron does not lie," he says.',
            fx: {honor:2,happy:2},
          },
          {
            t: "Carve a better board with your father's knife",
            check: {s:"craft",s2:"int",d:18},
            win: {
              r: "Your board has a proper ring of holes and a groove for the dead pieces. The other children fight over it.",
              fx: {skill:{craft:2},happy:3},
            },
            lose: {
              r: "The knife slips into your thumb. You bleed on the bench and get a clout for the knife.",
              fx: {health:-3,wil:.3},
            },
          },
        ],
      },
      {
        id: "ww_ald_hearthtax",
        title: "The hearth tax",
        cond: (p,C)=>R(p,"POL-01")&&C.adult(p)&&is(p,"serf","peasant"),
        w: 1.1,
        cool: 6,
        text: "The reeve comes with his tally stick and two spearmen. The hearth tax is one Ironside mark a household a year, a sun and a half, and he wants it now, before snow closes the road to {capital}.",
        choices: [
          {
            t: "Pay the mark",
            req: p=>p.coin>=2,
            r: "He notches the stick, bites the coin and moves on to the next door.",
            fx: {coin:-2},
          },
          {
            t: "Ask for time until the Hunter's Feast",
            check: {s:"persuasion",s2:"wil",d:40},
            win: {
              r: `"Hunter's Feast," he grumbles, notching the stick a different way. "Not a day after."`,
              fx: {skill:{persuasion:2}},
            },
            lose: {r:"He takes your best pot instead, and a hen for his trouble.",fx:{coin:-3,happy:-4,wil:.5}},
          },
          {
            t: "Hide the coin and swear you have none",
            check: {s:"deception",s2:"int",d:45},
            win: {
              r: "He looks at your bare hearth and believes it. Some other hearth pays more this year.",
              fx: {skill:{deception:2},honor:-2},
            },
            lose: {
              r: "He finds the purse under the straw. A false oath in Aldmark is no small thing: the hall-priest fines you, and neighbors look away at the well.",
              fx: {coin:-4,honor:-6,happy:-5},
            },
          },
        ],
      },
      {
        id: "ww_ald_horse",
        title: "The Hunter's animal",
        cond: (p,C)=>R(p,"POL-01")&&C.adult(p)&&C.poor(p),
        w: .8,
        cool: 12,
        text: "A bad winter. The stores ran out before Midwinter and the children cry at night. In the ditch by the road lies a carter's horse, dead of cold, still fresh under the snow. Horse is the Hunter's animal in Aldmark. Nobody eats horse. Nobody.",
        choices: [
          {
            t: "Leave it. Some things you do not do",
            r: "You eat bark bread and boiled straw until spring. You grow thin, but you can look the hall-priest in the eye.",
            fx: {health:-6,wil:1.5,piety:2,cause:"hunger"},
          },
          {
            t: "Cut meat by night and tell no one",
            check: {s:"stealth",s2:"wil",d:40},
            win: {
              r: "Your family eats. Nobody asks where the meat came from, and you never say.",
              fx: {health:4,piety:-4,wil:1},
            },
            lose: {
              r: "A neighbor sees the blood on the snow. By spring the whole village calls you horse-eater, and at the Hunter's Feast you must stand outside the hall door.",
              fx: {piety:-6,honor:-8,happy:-6,wil:1},
            },
          },
          {
            t: "Sell the hide and shoes to a tanner in {town}",
            r: "Hide and iron fetch a few coppers. Bread, not meat, but bread.",
            fx: {coin:2,health:-2},
          },
        ],
      },
      {
        id: "ww_ald_lanceyard",
        title: "The Lance Yard",
        cond: (p,C)=>R(p,"POL-01")&&grown(p,C)&&(is(p,"gentry","noble","royal")||C.prof(p,"lance",30)||C.famKind(p,"gentry_mil","horse")),
        w: 1,
        cool: 6,
        text: 'The Lance Yard of Kingsmere holds its public runs, and the crowd stands three deep to bet. Sir Roland Ashby walks the line of young riders like a dealer at the Horsefair. "Close order," he says. "Knee to knee. A lance alone is a stick."',
        choices: [
          {
            t: "Ride in the close-order charge",
            check: {s:"riding",s2:"lance",d:48},
            win: {
              r: "Your knee stays against your neighbor's all the way to the quintain. Ashby says nothing, which from him is praise.",
              fx: {skill:{riding:3,lance:3},fame:2},
            },
            lose: {
              r: "Your horse shies and you take the rider beside you off his saddle. Ashby makes you walk the yard leading both horses.",
              fx: {skill:{riding:2,lance:1},health:-5,happy:-3},
            },
          },
          {
            t: "Run a single tilt against a Greymane cousin",
            req: (p,C)=>C.mounted(p)||C.prof(p,"lance",45),
            check: {s:"lance",s2:"ins",d:56},
            win: {
              r: "Your point takes him square on the shield and he goes over his horse's tail. The Greymanes have long memories, but the crowd roars your name.",
              fx: {skill:{lance:3},fame:4,honor:2},
            },
            lose: {
              r: "His lance finds the gap under your shield. You wake up on the sand with Ashby looking down at you.",
              fx: {wound:"broken_ribs",health:-14,wil:1,cause:"a tilting accident"},
            },
          },
          {
            t: "Watch from the rail and learn",
            r: "You watch how the good riders sit back before the strike. You go home and try it on a fence post.",
            fx: {skill:{lance:1,riding:1},int:.3},
          },
        ],
      },
      {
        id: "ww_ald_amber",
        title: "Amber on the shore",
        cond: (p,C)=>R(p,"POL-01")&&C.adult(p)&&C.coast(p),
        w: 1,
        cool: 6,
        text: "After the winter storms the Cold Bay shore is heaped with weed, and in the weed lies a lump of amber as big as a hen's egg, with a fly caught inside. The Kingsmere Amber Guild buys every piece by law, at the Guild's price. A smuggler called Garr Whitlock pays three times as much and asks nothing.",
        choices: [
          {
            t: "Take it to the Guild clerk",
            r: "The clerk weighs it, writes your name and pays you 6 suns. He will sell it south for sixty. You are honest and poor.",
            fx: {coin:6,honor:2},
          },
          {
            t: "Sell it to Whitlock at night",
            check: {s:"stealth",s2:"trade",d:42},
            win: {
              r: 'Whitlock bites it, grins and pays 18 suns. "Bring me more," he says. "And forget my face."',
              fx: {coin:18,skill:{trade:1,stealth:1}},
            },
            lose: {
              r: "Guild men are watching Whitlock's boat that night. They take the amber, and the reeve takes you.",
              fx: {honor:-4,punish:"smuggling"},
            },
          },
          {
            t: "Keep it for a daughter's wedding bead",
            r: "You wrap it in wool and hide it in the roof. Some things are worth more than suns.",
            fx: {happy:4},
          },
        ],
      },
      {
        id: "ww_ald_levy",
        title: "Five hearths, one man",
        cond: (p,C)=>R(p,"POL-01")&&grown(p,C)&&C.male(p)&&free(p)&&is(p,"peasant","artisan")&&!C.soldier(p),
        w: 1,
        cool: 8,
        text: p=>`The Emperor needs men on the Gordush. Every five hearths of ${hm(p)} must send one armed man to Lord Harrow's line, and the five householders draw straws in the hall. You draw the short one.`,
        choices: [
          {
            t: "Take down the old spear and go",
            r: "You spend the season in the mud behind the stakes at Crossmarch, watching the river for orcs. You come home with a cough and a story.",
            fx: {skill:{spear:2,xbow:1},wil:1,honor:3,health:-3,cause:"camp fever"},
          },
          {
            t: "Pay a landless man to go in your place",
            req: p=>p.coin>=15,
            r: "A landless man from the forest edge takes 15 suns and your spear. You hope he comes back.",
            fx: {coin:-15,honor:-1},
          },
          {
            t: "Argue that your father counts as this hearth's man",
            check: {s:"persuasion",s2:"int",d:45},
            win: {
              r: "The hall agrees, laughing. Your father, who is seventy, is very proud, and the reeve finds him a job guarding the grain barn instead.",
              fx: {skill:{persuasion:2}},
            },
            lose: {
              r: "Nobody believes a word. You go anyway, and late, and the sergeant remembers it.",
              fx: {honor:-2,wil:1,health:-3,skill:{spear:1}},
            },
          },
        ],
      },
      {
        id: "ww_ald_ojury",
        title: "The oath jury",
        cond: (p,C)=>R(p,"POL-01")&&C.adult(p)&&C.male(p)&&free(p),
        w: 1,
        cool: 8,
        setup: (p,ctx)=>{pid(p,ctx,"acquaint")},
        text: "You are called to sit on an oath jury in the hall. {them} of the next village swore on the iron ring to repay four sacks of seed corn after harvest. {theyHe} paid two, and says the hail took the rest. In Aldmark a broken oath can make a man an outlaw, and anyone may kill an outlaw.",
        choices: [
          {
            t: "Call it a broken oath. Iron does not lie",
            r: "{them} is outlawed and walks into the forest with nothing. {theirHis} family curses your name at the well.",
            fx: {piety:2,happy:-3,wil:1,them:{type:"enemy",op:-40}},
          },
          {
            t: "Argue the hail was the gods' doing, not the man's",
            check: {s:"persuasion",s2:"faith",d:45},
            win: {
              r: "The jury rules the rest be paid next year, sworn again on iron. {them} grips your hand at the door and cannot speak.",
              fx: {honor:3,skill:{persuasion:2},them:{type:"friend",op:35}},
            },
            lose: {
              r: "The hall-priest calls it soft and outvotes you. {them} is outlawed anyway.",
              fx: {wil:.5,happy:-2},
            },
          },
          {
            t: "Ask the lender how many sacks he sold that spring",
            check: {s:"intrigue",s2:"int",d:40},
            win: {
              r: "It comes out that the lender sold the same seed twice. The case falls apart and the lender pays the fine.",
              fx: {int:.5,skill:{intrigue:2},fame:1,them:{type:"friend",op:25}},
            },
            lose: {
              r: "The lender has his answers ready. The jury looks at you as if you were the one on trial.",
              fx: {happy:-2},
            },
          },
        ],
      },
      {
        id: "ww_ald_stakeyard",
        title: "The Stake Yard",
        cond: (p,C)=>R(p,"POL-01")&&grown(p,C)&&(C.soldier(p)||C.prof(p,"xbow",25)),
        w: 1,
        cool: 6,
        text: 'At the Stake Yard of Crossmarch, Captain Hilda Rook runs the drill that won Hartgate: plant the stake, kneel, shoot, reload behind the man beside you. Every Stake-Man carries a sharpened stake and thirty bolts. "Stand by the stake," she says. "The horse will not."',
        choices: [
          {
            t: "Shoot in the line until dark",
            check: {s:"xbow",s2:"sta",d:44},
            win: {
              r: "Thirty bolts, and most of them in the straw orc. Rook moves you to the front rank.",
              fx: {skill:{xbow:3},sta:.4,merit:2},
            },
            lose: {
              r: "Your windlass jams twice. Rook makes you strip and oil it in the snow while the others eat.",
              fx: {skill:{xbow:1},wil:.6},
            },
          },
          {
            t: "Learn to cut and plant stakes fast",
            r: "By the end of the week you can drive a stake in four blows at the right slope. Your shoulders scream.",
            fx: {skill:{siegecraft:2},str:.4},
          },
          {
            t: "Ask Rook about Hartgate",
            r: "Her grandmother stood there. Eighteen thousand orcs came at noon, and few rode home by moonlight. Rook makes you learn the Lay of Hartgate by heart.",
            fx: {skill:{tactics:2},int:.3},
          },
        ],
      },
      {
        id: "ww_ald_owls",
        title: "An owl in the corner",
        cond: (p,C)=>R(p,"POL-01")&&C.adult(p),
        w: .9,
        cool: 8,
        text: ()=>`In the ${A.pick(["Barge and Bell","Hunter's Mead","Iron Ring"])} a drunk carter says the old thing out loud: "An Ironside will fall into the water, and the empire with him." The room goes quiet. In the corner a quiet drinker with ink on the fingers sets down a cup. Everyone knows Lady Ravenscar's owls drink everywhere.`,
        choices: [
          {
            t: "Hustle the carter out before the owl moves",
            check: {s:"persuasion",s2:"str",d:40},
            win: {
              r: "You get him out the back and onto a barge before he says it twice. He will not remember you tomorrow. Someone else might.",
              fx: {honor:2,flag:"ww_ald_owlseen"},
            },
            lose: {
              r: "The owl follows you both out. Next week the carter is gone from the quays, and a reeve asks your name.",
              fx: {favor:-3,wil:1,happy:-3},
            },
          },
          {
            t: "Tell a loud, filthy joke over it",
            check: {s:"deception",s2:"int",d:38},
            win: {
              r: "The room laughs with relief and talks about something else. The owl watches you a moment longer than you like.",
              fx: {skill:{deception:2},happy:1},
            },
            lose: {r:"Nobody laughs. The carter says it again, louder.",fx:{happy:-2}},
          },
          {
            t: "Finish your ale. You heard nothing",
            r: "You heard nothing. In Kingsmere that is a skill.",
            fx: {skill:{intrigue:1}},
          },
          {
            t: "Sell the carter's name to the owl",
            r: "Three suns slide across the table. The carter is not on the quays next week.",
            fx: {coin:3,honor:-6},
          },
        ],
      },
      {
        id: "ww_ald_serfleave",
        title: "Leave to travel",
        cond: (p,C)=>R(p,"POL-01")&&C.adult(p)&&(p.status==="serf"||!!p.flags.unfree),
        w: 1.1,
        cool: 8,
        text: "Your sister marries at May Fair in the next shire, two days' walk away. But a serf of Aldmark may not leave the lord's land without leave, and the reeve is a sour man who wants a sack of oats for every favor.",
        choices: [
          {
            t: "Give the reeve his sack of oats",
            req: p=>p.coin>=2,
            r: "The oats buy a scrap of parchment with the lord's mark. You dance at the wedding until your feet bleed.",
            fx: {coin:-2,happy:6},
          },
          {
            t: "Ask him properly, cap in hand",
            check: {s:"persuasion",s2:"etiquette",d:40},
            win: {
              r: 'He makes you wait an hour, then waves you off. "Back by the Monday plough."',
              fx: {happy:5,skill:{persuasion:1}},
            },
            lose: {r:'"No." He does not even look up.',fx:{happy:-4,wil:.6}},
          },
          {
            t: "Go anyway by the forest path",
            check: {s:"stealth",s2:"survival",d:42},
            win: {
              r: "You dance at the wedding and are back at the plough before anyone misses you.",
              fx: {happy:6,skill:{stealth:2}},
            },
            lose: {
              r: "The reeve's men are waiting at the boundary stone when you come home. The lord's court has you flogged.",
              fx: {health:-8,wil:1.5,happy:-6,cause:"a flogging"},
            },
          },
          {
            t: "Stay, and send a ribbon with a carter",
            r: "The carter brings back a crust of wedding bread. It tastes of dust and longing.",
            fx: {happy:-3,wil:.4},
          },
        ],
      },
      {
        id: "ww_ald_oakline",
        title: "The Oak Line stones",
        cond: (p,C)=>R(p,"POL-01")&&C.adult(p)&&C.terr(p,"forest"),
        w: .9,
        cool: 10,
        setup: (p,ctx)=>{pid(p,ctx,"acquaint")},
        text: 'Your neighbor {them} stands at the Oak Line stones with an axe on {theirHis} shoulder. Beyond them the Evenwood oaks are thick and old, worth a fortune in beams. Since the blood-price of 1080 no Aldmark axe crosses the stones, and the elves shoot after three warnings. "Who will know?"',
        choices: [
          {
            t: "Talk {themHim} out of it",
            check: {s:"persuasion",s2:"wil",d:40},
            win: {
              r: `{them} spits, shoulders the axe and walks home with you. "Twenty thousand marks," {theyHe} mutters. "And we can't touch a twig."`,
              fx: {honor:2,skill:{persuasion:1},them:{type:"friend",op:10}},
            },
            lose: {
              r: "{them} crosses anyway. You hear the first warning, a voice in the trees, then the second. {theyHe} comes back white-faced and without the axe.",
              fx: {wil:.5},
            },
          },
          {
            t: "Go with {themHim} and cut fast",
            check: {s:"stealth",s2:"str",d:55},
            win: {
              r: "One young oak, down and limbed and dragged back over the line before dark. A shipwright pays 12 suns for it, no questions.",
              fx: {coin:12,honor:-3,skill:{stealth:2}},
            },
            lose: {
              r: "The third warning is an arrow.",
              fx: {wound:"arrow_wound",health:-15,honor:-3,cause:"an elven arrow"},
            },
          },
          {
            t: "Report {themHim} to the reeve",
            r: "{them} is fined five marks and never speaks to you again.",
            fx: {favor:1,them:{type:"enemy",op:-30}},
          },
        ],
      },
      {
        id: "ww_ald_hartgate",
        title: "The Lay of Hartgate",
        cond: (p,C)=>R(p,"POL-01")&&C.old(p),
        w: 1,
        cool: 8,
        text: p=>`Snow on the roof and the hall full of bored young people. "${SEX(p,"Grandfather","Grandmother")}, the Lay of Hartgate!" It runs to two hundred lines, and you learned it from a hall-priest a lifetime ago. "Stand, said the Iron King, stand by the stake..."`,
        choices: [
          {
            t: "Chant it all, every line",
            check: {s:"learning",s2:"wil",d:32},
            win: {
              r: "Every line, every name, the eighteen thousand at noon. When you finish the hall is silent, then stamps the benches.",
              fx: {fame:1,happy:5,skill:{music:1}},
            },
            lose: {
              r: "You lose the thread at the eighteen thousand. A girl of ten finishes it for you, word for word. You are not sure whether to be proud or ashamed.",
              fx: {happy:-1,wil:.5},
            },
          },
          {
            t: "Tell them what the lay leaves out",
            r: "The mud, the screaming horses, the cousin who never came home. The young ones are quiet a long time.",
            fx: {wil:1,honor:1},
          },
          {
            t: "Teach the smallest one the first ten lines",
            r: "She has it by supper and shouts it at the dog all week.",
            fx: {happy:4,skill:{music:1}},
          },
        ],
      },
      {
        id: "ww_ald_gordush",
        title: "Night on the Gordush",
        cond: (p,C)=>R(p,"POL-01")&&C.adult(p)&&C.soldier(p),
        w: 1.1,
        cool: 5,
        text: "Night on the Gordush line. Sixteen thousand men watch the river between Crossmarch and the fords, because War-Chief Vrag will not hand over Tarn Halfblood, who burned Lord Harrow's tax barns. Your post is a stake and a fire you may not light. Something splashes at the ford.",
        choices: [
          {
            t: "Shout the alarm",
            check: {s:"ins",s2:"int",d:40},
            win: {
              r: "Riders, a dozen, testing the ford. The crossbows drive them back into the dark, and the captain asks who called it.",
              fx: {merit:2,fame:1},
            },
            lose: {
              r: "A deer. The whole line stands to arms for a deer, and the sergeant never lets you forget it.",
              fx: {happy:-3,wil:.5},
            },
          },
          {
            t: "Creep down to the water and look first",
            check: {s:"stealth",s2:"ins",d:48},
            win: {
              r: "Three orc scouts, watering their horses and laughing softly. You count them, mark the place and slip back.",
              fx: {merit:3,skill:{stealth:2,tracking:1}},
            },
            lose: {
              r: "A twig cracks under your boot, and a scout is on you before you can shout.",
              fx: {
                duel: {
                  tier: 2,
                  race: "orc",
                  title: "an orc scout",
                  opts: {kind:"duel",place:"the Gordush ford",lethal:!0,toYield:!1,title:"Fight at the ford"},
                },
              },
            },
          },
          {
            t: "Hold your stake and keep still",
            r: "You hold your post till dawn with your heart in your throat. Whatever it was, it did not cross. Stand by the stake.",
            fx: {wil:1,merit:1},
          },
        ],
      },
      {
        id: "ww_ald_mayfair",
        title: "Iron at May Fair",
        cond: (p,C)=>R(p,"POL-01")&&unwed(p,C)&&!is(p,"noble","royal"),
        w: 1,
        cool: 5,
        text: p=>`May Fair in ${hm(p)}: ring dances on the green, ale in the hall, and couple after couple stepping up to swear on the hall's iron ring. In Aldmark a marriage sworn on iron is an oath, and leaving it is oath-breaking. ${SEX(p,"{npcF}","{npcM}")} has watched you all afternoon.`,
        choices: [
          {
            t: "Ask for the next ring dance",
            check: {s:"persuasion",s2:"wil",d:32},
            win: {
              r: "One dance, then three, then a walk to the river. Some things start without asking leave.",
              fx: {lover:!0,happy:6},
            },
            lose: {r:"You tread on every foot in the ring. The laughter is kind, mostly.",fx:{happy:-2,wil:.3}},
          },
          {
            t: "Keep your hands off iron for now",
            r: "You drink, dance with your cousins and walk home free. Iron does not lie, and you are not ready to promise it anything.",
            fx: {happy:2},
          },
        ],
      },
      {
        id: "ww_sol_noonlie",
        title: "Don't lie at noon",
        cond: (p,C)=>R(p,"POL-02")&&kid(p,C),
        w: 1,
        cool: 5,
        text: "The noon bell is still ringing when the jar slips out of your hands and breaks on the step: a whole jar of olive oil. Every child in Solenne knows the saying. Don't lie at noon. Your mother is coming up the street.",
        choices: [
          {
            t: "Tell her the truth before she asks",
            r: "She is angry about the oil and proud about the truth, in that order. You still get no supper.",
            fx: {honor:2,piety:1,happy:-2},
          },
          {
            t: "Blame the neighbor's cat",
            check: {s:"deception",s2:"int",d:20},
            win: {
              r: "She believes it. The cat is chased for a week. You feel the sun on the back of your neck every noon after.",
              fx: {skill:{deception:1},piety:-2},
            },
            lose: {
              r: '"At noon," she says, white with shock. "You lie at noon." That is worse than any oil.',
              fx: {piety:-2,happy:-4,wil:.4},
            },
          },
          {
            t: "Scoop up what oil you can with your hands",
            check: {s:"int",s2:"spd",d:18},
            win: {
              r: "You save half a bowl with a crust and quick fingers. She laughs despite herself.",
              fx: {int:.3,happy:1},
            },
            lose: {r:"You slip in it and cut your knee on the shards.",fx:{health:-3,happy:-2}},
          },
        ],
      },
      {
        id: "ww_sol_choir",
        title: "The dawn choir",
        cond: (p,C)=>R(p,"POL-02")&&kid(p,C)&&C.male(p),
        w: 1,
        once: !0,
        text: "A dawnkeeper from the Temple walks through the streets listening to boys sing. The boys' choirs sing plainsong in Old Solen at dawn and noon, and a good voice means bread, school and perhaps one day the priesthood. He stops at your door.",
        choices: [
          {
            t: "Sing for him",
            check: {s:"music",s2:"wil",d:20},
            win: {
              r: "He takes you. You rise in the dark to sing the sun up, and you learn your letters in Old Solen between the hours.",
              fx: {skill:{music:3,learning:2,faith:2},lang:"Old Solen",piety:2},
            },
            lose: {
              r: "Your voice cracks on the high note. He pats your head and moves on.",
              fx: {happy:-2,skill:{music:1}},
            },
          },
          {
            t: "Hide behind your mother",
            r: "He laughs and goes on down the street. Your mother sighs about bread.",
            fx: {happy:1},
          },
        ],
      },
      {
        id: "ww_sol_sunsister",
        title: "The sun-sisters",
        cond: (p,C)=>R(p,"POL-02")&&C.female(p)&&(C.teen(p)||grown(p,C)),
        w: 1,
        cool: 10,
        text: "Only men may be priests in the Holy See, but women run the Temple's hospitals and girls' schools as sun-sisters. A sister in a white wimple from the Sun-Sisters' Hostel in the Saltings asks if you will come and help with the fever ward. No pay. Bread and broth.",
        choices: [
          {
            t: "Work the fever ward through the winter",
            check: {s:"medicine",s2:"sta",d:35},
            win: {
              r: "You learn to wash wounds with wine and honey, to give willow bark for fever, and to keep the windows open whatever the priests say. Some you lose. More live.",
              fx: {skill:{medicine:4},piety:3,wil:1},
            },
            lose: {
              r: "The fever takes hold of you too. For a week the sisters nurse you instead.",
              fx: {health:-12,skill:{medicine:2},wil:1,cause:"a ward fever"},
            },
          },
          {
            t: "Teach letters in the girls' school instead",
            req: (p,C)=>C.literate(p),
            r: "Twenty girls, one slate each, and the Book of Ash. You go home hoarse and happy.",
            fx: {skill:{learning:2},happy:3,piety:2},
          },
          {
            t: "Thank her, and say no",
            r: "She bows and walks on. There are always more hands in the Saltings.",
            fx: {},
          },
        ],
      },
      {
        id: "ww_sol_badgemen",
        title: "The Brass Badge men",
        cond: (p,C)=>R(p,"POL-02")&&C.adult(p),
        w: 1,
        cool: 6,
        text: `The Pilgrims' Quarter by the Lantern Gate. A cheerful man offers you a pilgrim's brass sun badge and a stamped receipt for the 5-sun pilgrim fee, both for 2 suns. "Saves you the queue," he says. Everyone knows the Brass Badge men of Nico of the Saltings pay the gate clerks a cut.`,
        choices: [
          {
            t: "Buy the cheap badge and receipt",
            req: p=>p.coin>=2,
            check: {s:"intrigue",s2:"int",d:35},
            win: {
              r: "The gate clerk glances at the stamp and waves you through. You saved three suns and lost a little piety.",
              fx: {coin:-2,piety:-2,skill:{intrigue:1}},
            },
            lose: {
              r: "A Lantern Guard who is not on Nico's list looks twice. Fourfold for the fee, and a lecture in Old Solen.",
              fx: {coin:-20,happy:-4,honor:-3},
            },
          },
          {
            t: "Pay the real fee at the gate",
            req: p=>p.coin>=5,
            r: "Five suns into a Temple chest, and a real badge pinned to your coat by a bored dawnkeeper.",
            fx: {coin:-5,piety:2},
          },
          {
            t: "Call the watch on him",
            check: {s:"intimidation",s2:"wil",d:42},
            win: {
              r: "The watchman takes him by the collar. Nico's men will remember your face, but today the Quarter is a little cleaner.",
              fx: {honor:3,fame:1},
            },
            lose: {
              r: "The watchman takes Nico's coin instead. The badge-seller winks at you as he leaves.",
              fx: {happy:-3,wil:.5},
            },
          },
        ],
      },
      {
        id: "ww_sol_tenant",
        title: "Rent and tithe",
        cond: (p,C)=>R(p,"POL-02")&&C.adult(p)&&low(p),
        w: 1.1,
        cool: 6,
        text: "Half the farmers of the Holy See are Temple tenants, and they pay rent and tithe to the same master. This year the hail flattened your wheat. The Temple steward has come with his clerk and his scales, and he is looking at your last sacks.",
        choices: [
          {
            t: "Pay it all and go hungry",
            r: "The cart rolls away full. You eat chickpeas and prayer until spring.",
            fx: {health:-5,piety:3,wil:1.2,cause:"hunger"},
          },
          {
            t: "Plead with him in the name of the sun",
            check: {s:"faith",s2:"persuasion",d:44},
            win: {
              r: "You quote the Book of Ash on mercy to the poor, and the clerk, a young man, blushes. The steward takes the tithe and lets the rent wait.",
              fx: {skill:{faith:2,persuasion:1},piety:1},
            },
            lose: {r:'"The sun gave you hail," the steward says. "Take it up with the sun."',fx:{happy:-4,wil:.6}},
          },
          {
            t: "Hide two sacks in the dry well",
            check: {s:"stealth",s2:"int",d:40},
            win: {
              r: "The scales never see them. Your children eat bread this winter.",
              fx: {health:2,honor:-2,skill:{stealth:1}},
            },
            lose: {
              r: "The clerk counts your sheaves against last year's and finds the gap. Theft from the Temple pays back fourfold.",
              fx: {coin:-12,honor:-5,happy:-5},
            },
          },
        ],
      },
      {
        id: "ww_sol_saltpan",
        title: "The salt tax",
        cond: (p,C)=>R(p,"POL-02")&&C.adult(p)&&C.coast(p),
        w: 1,
        cool: 7,
        text: "The salt pans of the Clarente Plain glitter white. The Temple taxes every basket of salt that leaves them. A boatman you know is running untaxed salt along the coast at night, and he needs one more pair of arms for a share.",
        choices: [
          {
            t: "Row for him one night",
            check: {s:"sea",s2:"stealth",d:40},
            win: {
              r: "Black water, muffled oars, forty baskets landed in a cove near Lorina. Your share is 6 suns.",
              fx: {coin:6,skill:{sea:2,stealth:1}},
            },
            lose: {
              r: "A Temple patrol boat shows a lantern. You dump the salt in the sea and row for your life, and the boatman blames you for the lot.",
              fx: {happy:-3,wil:.5,skill:{sea:1}},
            },
          },
          {
            t: "Work the pans honestly, raking in the sun",
            r: "A week of raking salt in the white glare. Your eyes ache and your purse grows by two suns.",
            fx: {coin:2,sta:.4},
          },
          {
            t: "Tell a dawnkeeper about the boatman",
            r: "The boatman is branded with a small sun on the hand. Nobody on the shore drinks with you after.",
            fx: {piety:2,honor:-2,happy:-3},
          },
        ],
      },
      {
        id: "ww_sol_burning",
        title: "Fire belongs to the sun",
        cond: (p,C)=>R(p,"POL-02")&&C.adult(p),
        w: .8,
        cool: 12,
        text: "A stranger died of a spotted fever in the inn stable, and nobody will touch the body. Some of the neighbors want to burn it, stable and all, before the fever spreads. But in the Holy See fire belongs to the sun: burning a body is a crime, and the dead go into the ground at dawn, facing east.",
        choices: [
          {
            t: "Bury the stranger at dawn yourself",
            check: {s:"sta",s2:"medicine",d:36},
            win: {
              r: "You wrap the body in vinegar-soaked sacking and dig the grave yourself, facing east. You wash in the sea after, and the fever passes you by.",
              fx: {piety:3,honor:3,wil:1},
            },
            lose: {
              r: "You bury him properly. The fever finds you three days later.",
              fx: {piety:3,honor:2,health:-15,wil:1,cause:"a spotted fever"},
            },
          },
          {
            t: "Help them burn it before dawn",
            r: "The stable goes up like straw. Two days later a dawnkeeper names every man who carried a torch. You pay a heavy fine and the street will not look at you.",
            fx: {coin:-10,piety:-6,honor:-2},
          },
          {
            t: "Run for a dawnkeeper and let the Temple decide",
            r: "The dawnkeeper sends two lay brothers with spades and lime. Proper, slow, and nobody burns.",
            fx: {piety:1},
          },
        ],
      },
      {
        id: "ww_sol_noonhall",
        title: "Noon Hall",
        cond: (p,C)=>R(p,"POL-02")&&grown(p,C)&&C.male(p)&&(is(p,"gentry","noble")||C.prof(p,"riding",35)),
        w: 1,
        cool: 8,
        text: "At Noon Hall, the chapter house of the Knights of the Sun, Sir Garin Solis teaches mace and shield from the saddle with the sun behind you, so the enemy rides into the glare. The Grand Master is looking for young men to take the vows: for life, no wife, no land of your own.",
        choices: [
          {
            t: "Ride the Noon Charge with the novices",
            check: {s:"riding",s2:"shield",d:46},
            win: {
              r: "You keep the sun at your back through every turn. Solis says you ride like a man who listened.",
              fx: {skill:{riding:3,shield:2,mounted:2},fame:1},
            },
            lose: {
              r: "You turn the wrong way and charge straight into the glare, blind as a mole. The novices still laugh about it at supper.",
              fx: {skill:{riding:1,shield:1},happy:-3},
            },
          },
          {
            t: "Take the vows for life",
            req: (p,C)=>!C.married(p),
            r: "You kneel at noon and rise a Knight of the Sun, with a white surcoat and no future but the order's.",
            fx: {piety:8,honor:4,fame:3,skill:{faith:2},trait:"zealous",flag:"ww_sol_noonknight"},
          },
          {
            t: "Watch, and keep your freedom",
            r: "You learn a trick or two with the shield and ride home a free man.",
            fx: {skill:{shield:1}},
          },
        ],
      },
      {
        id: "ww_sol_mirona",
        title: "The Mirona November",
        cond: (p,C)=>R(p,"POL-02")&&(C.adult(p)||C.teen(p)),
        w: .9,
        cool: 9,
        text: "Every November the Mirona Hills remember the granary fire of 3 BR. The procession winds past the black stones while the old women wail. This year a carter from Lorina, whose town still carries the blame after eleven hundred years, has stopped his wagon in the road, and boys are picking up stones.",
        choices: [
          {
            t: "Stand between the boys and the carter",
            check: {s:"intimidation",s2:"str",d:40},
            win: {
              r: "The boys drop their stones and slink back into the procession. The carter whips up his mules and nods to you once.",
              fx: {honor:4,fame:1},
            },
            lose: {
              r: "A stone meant for him takes you over the eye.",
              fx: {health:-8,honor:3,wil:1,cause:"a thrown stone"},
            },
          },
          {
            t: "Remind them the fire was eleven centuries ago",
            check: {s:"persuasion",s2:"learning",d:42},
            win: {
              r: "An old woman laughs, then another. The boys feel foolish. The procession moves on.",
              fx: {skill:{persuasion:2},honor:2},
            },
            lose: {r:`"And Lorina still hasn't paid," a man shouts. Nobody listens to you.`,fx:{happy:-2}},
          },
          {
            t: "Walk on with the procession",
            r: "Behind you there are shouts and the crack of stone on wood. You do not look back.",
            fx: {piety:1,honor:-1},
          },
        ],
      },
      {
        id: "ww_sol_heresy",
        title: "Six years short",
        cond: (p,C)=>R(p,"POL-02")&&C.adult(p),
        w: .7,
        cool: 15,
        setup: (p,ctx)=>{pid(p,ctx,"friend")},
        text: "Over wine, {them}, a scrivener of the Needle Court, leans close and whispers that the year count is wrong, short by six years, and that the old granary beams of Clarente would prove it. In the Holy See that is Needle Heresy, and Needle Heretics are walled up for life in a dark cell under the Needle.",
        choices: [
          {
            t: "Tell {themHim} to never say it again",
            r: "{them} goes pale, then laughs it off. You both drink too fast. Neither of you mentions it again.",
            fx: {them:{type:"friend",op:10},wil:.5},
          },
          {
            t: "Ask to see the proof",
            check: {s:"learning",s2:"int",d:50},
            win: {
              r: "Rows of eclipse dates, copied from something under the Needle. You understand just enough to be frightened. Now you know.",
              fx: {int:.8,skill:{learning:2},flag:"ww_sol_sixyears",them:{type:"friend",op:20}},
            },
            lose: {r:"Numbers, numbers. You cannot follow it, and {them} looks at you with pity.",fx:{int:.3}},
          },
          {
            t: "Report {themHim} to the Keepers of the Count",
            r: "The Keepers thank you warmly. You never see {them} again. Some nights you think of a cell with no window.",
            fx: {favor:2,piety:2,honor:-6,wil:1,them:{type:"enemy",op:-60}},
          },
        ],
      },
      {
        id: "ww_sol_dorata",
        title: "The Crossbow Yard of Dorata",
        cond: (p,C)=>R(p,"POL-02")&&grown(p,C)&&free(p)&&!C.soldier(p)&&C.male(p),
        w: .9,
        cool: 8,
        text: 'A sergeant of the Dorata Crossbows sets up a barrel at the market cross. The See pays its own shooters to man the Valerian Wall, and Captain Hugo Varr wants men who can shoot from towers in ranks. "One bolt at the board. Hit the sun, and you eat on the Temple."',
        choices: [
          {
            t: "Take the shot",
            check: {s:"xbow",s2:"ins",d:40},
            win: {
              r: "Right in the painted sun. The sergeant writes your name and gives you a coin of earnest.",
              fx: {skill:{xbow:3},coin:2,job:"mercenary"},
            },
            lose: {
              r: "The bolt goes into the barrel. A small boy fetches it back and hands it to you with great ceremony.",
              fx: {skill:{xbow:1},happy:-2},
            },
          },
          {
            t: "Shoot for fun, not for the Temple",
            check: {s:"xbow",s2:"int",d:38},
            win: {
              r: "A clean hit, and you walk away while the sergeant is still talking.",
              fx: {skill:{xbow:2},happy:2},
            },
            lose: {r:"Wide. The crowd jeers good-naturedly.",fx:{skill:{xbow:1}}},
          },
          {t:"Keep walking",r:"Other men line up behind you. Bread is dear in Solenne.",fx:{}},
        ],
      },
      {
        id: "ww_sol_votes",
        title: "Four votes",
        cond: (p,C)=>R(p,"POL-02")&&C.adult(p)&&early()&&(C.literate(p)||C.job(p,"clergy")||C.job(p,"scribe")||is(p,"gentry","noble","merchant")),
        w: 1,
        once: !0,
        text: `High Luminary Severin III is 73 and slowing, and the Luminaries are already counting votes. A clerk of Treasurer Crispin Dorn asks you to carry a sealed letter to a Luminary's house in Lorina. "He needs cheap bread and four votes," the clerk says. "Help with either and he forgets nothing."`,
        choices: [
          {
            t: "Carry the letter, and do not open it",
            r: "The Luminary's steward takes it at the back gate and hands you a gold luminary. Twenty-three suns for a walk.",
            fx: {coin:23,favor:2,skill:{intrigue:1}},
          },
          {
            t: "Steam open the seal on the road",
            check: {s:"intrigue",s2:"craft",d:52},
            win: {
              r: "Grain prices, a promise of a Temple farm, and a name you know. You reseal it so well nobody ever guesses. Knowledge is a coin too.",
              fx: {coin:23,int:.5,skill:{intrigue:3},flag:"ww_sol_dornletter"},
            },
            lose: {
              r: "The wax cracks. The steward looks at the seal, then at you, and shuts the gate. You are never asked to carry anything again.",
              fx: {favor:-4,happy:-3,wil:.5},
            },
          },
          {
            t: "Refuse. You want no part of it",
            r: "The clerk shrugs. There are always willing feet in Solenne.",
            fx: {honor:1},
          },
        ],
      },
      {
        id: "ww_sol_grave",
        title: "A grave by the Temple wall",
        cond: (p,C)=>R(p,"POL-02")&&C.old(p),
        w: 1,
        once: !0,
        text: "You are old, and you have begun to think about the grave. In Solenne the dead are buried at dawn facing east, and the rich pay for graves close to the Temple wall, where the noon shadow of the great Temple falls on them. A plot by the wall costs 40 suns.",
        choices: [
          {
            t: "Buy the plot by the wall",
            req: p=>p.coin>=40,
            r: "The sexton marks the place with a peg. You visit it on fine days and sit in the sun.",
            fx: {coin:-40,piety:4,happy:4},
          },
          {
            t: "Give the money to the sun-sisters' hospital",
            req: p=>p.coin>=20,
            r: 'The sisters will pray for you anyway. "The sun warms every grave alike," the old abbess says.',
            fx: {coin:-20,piety:5,honor:3},
          },
          {
            t: "Leave it all to the family",
            r: "The hall-yard at the edge of town will do. Let the young have the coin.",
            fx: {happy:2,wil:.5},
          },
        ],
      },
      {
        id: "ww_sol_halfelf",
        title: "Never a Luminary",
        cond: (p,C)=>R(p,"POL-02")&&C.race(p,"halfelf")&&(C.teen(p)||grown(p,C)),
        w: 1.2,
        once: !0,
        text: 'The Temple teaches that other peoples were shaped at dusk from colder clay. Half-elves may be priests here, but never Luminaries. A teacher who likes you says it plainly: "You could be the cleverest priest in Solenne. You will still kneel to duller men all your life."',
        choices: [
          {
            t: "Enter the priesthood anyway",
            r: "You take the tonsure. If you cannot rise, you will go deep: the archive, the calendar, the old books.",
            fx: {job:"clergy",piety:4,skill:{faith:3,learning:2},wil:1.5},
          },
          {
            t: "Turn your back on the Temple",
            r: "You find work in the Blue Ward where they need envoys who look both ways at once. Half-elves are trusted as envoys everywhere else.",
            fx: {skill:{diplomacy:3},piety:-3,trait:"cynical"},
          },
          {
            t: "Argue with the teacher",
            check: {s:"learning",s2:"wil",d:45},
            win: {
              r: "You quote the Book of Ash back at him until he laughs and gives up. He lends you his own books after that.",
              fx: {skill:{learning:3},int:.6},
            },
            lose: {r:'He sighs. "You are right. It does not matter." That is worse.',fx:{wil:1,happy:-3}},
          },
        ],
      },
      {
        id: "ww_va_clipped",
        title: "The Shears",
        cond: (p,C)=>R(p,"POL-03")&&C.adult(p),
        w: 1,
        cool: 6,
        text: "Payday, and your suns look thin. Varennan suns have been clipped since the Corsair War, but these are shaved like a monk. Everyone in Bluewater knows the Shears, a ring of clippers and false moneychangers, pass them to the galley crews and anyone else who cannot refuse their pay. Clippers hang at the mint gate.",
        choices: [
          {
            t: "Weigh each coin and refuse the worst",
            check: {s:"trade",s2:"int",d:40},
            win: {
              r: "You pick out four shaved coins and slap them on the paymaster's table. He swaps them without a word. He knows.",
              fx: {skill:{trade:2},coin:2},
            },
            lose: {
              r: "You cannot tell the clipped from the merely worn. You take what you are given.",
              fx: {coin:-2,happy:-2},
            },
          },
          {
            t: "Pass the light coins on at the market",
            check: {s:"deception",s2:"spd",d:38},
            win: {
              r: "The fishwife takes them without looking. Somebody always loses, and today it is not you.",
              fx: {skill:{deception:1},honor:-2},
            },
            lose: {
              r: "A Lucernan factor weighs your coin on a pocket scale, laughs and calls the watch. You talk your way out, barely, and lose the coins.",
              fx: {coin:-3,honor:-3,happy:-3},
            },
          },
          {
            t: "Find out who is clipping and tell the mint",
            check: {s:"intrigue",s2:"int",d:50},
            win: {
              r: "A moneychanger with a too-new house. The mint guard takes him at dawn. There is a reward, and you get half.",
              fx: {coin:10,favor:2,skill:{intrigue:2},flag:"ww_va_shears_enemy"},
            },
            lose: {
              r: "You ask the wrong man the wrong question. Someone breaks your shutter that night with a brick.",
              fx: {happy:-4,wil:.6},
            },
          },
        ],
      },
      {
        id: "ww_va_gatebout",
        title: "Outside the gate",
        cond: (p,C)=>R(p,"POL-03")&&grown(p,C)&&(is(p,"gentry","noble")||C.prof(p,"sword",35)||C.trait(p,"proud")),
        w: 1,
        cool: 6,
        setup: (p,ctx)=>{pid(p,ctx,"rival")},
        text: 'In the Laughing Captain on Galley Row, a Montaro cousin named {them} spills wine on you and laughs, the way Montaros laugh at everything. Duels have been banned inside the walls since 1071, so young men of Varenna fight outside the gates and call it a bout. "Dawn," {theyHe} says. "The Galley Row gate."',
        choices: [
          {
            t: "Meet {themHim} at dawn, blades drawn",
            r: "Mist on the field, a judge with a staff, and a crowd that has already placed its bets.",
            fx: {
              duel: {
                foe: "them",
                opts: {
                  kind: "duel",
                  place: "the field outside the Galley Row gate",
                  lethal: !1,
                  toYield: !0,
                  title: "A bout outside the walls",
                },
              },
            },
          },
          {
            t: "Laugh back louder and buy {themHim} a drink",
            check: {s:"persuasion",s2:"wil",d:42},
            win: {
              r: "{them} roars, slaps your back and decides you are a fine fellow. Montaro friendship is loud and lasts until the next spill.",
              fx: {them:{type:"friend",op:30},skill:{persuasion:2}},
            },
            lose: {
              r: `"Coward's wine," {theyHe} says, and pours it on the floor. The tavern laughs at you, not with you.`,
              fx: {honor:-4,happy:-4,them:{type:"rival",op:-10}},
            },
          },
          {
            t: "Walk out",
            r: "You go. Galley Row will call you dull for a month. You will be alive for longer than that.",
            fx: {honor:-2,wil:.5},
          },
        ],
      },
      {
        id: "ww_va_lionfair",
        title: "The Lion Fair",
        cond: (p,C)=>R(p,"POL-03")&&(kid(p,C)||C.teen(p)),
        w: 1,
        cool: 4,
        text: "The Lion Fair on 14 April remembers the Coast Road. In the square a man in a lion mask pretends to be Roderic the Lionheart, and the knights of the Lion Guard ride past, chosen for height and reach. Every boy on the street is stooping like a Valdane, because the courtiers do.",
        choices: [
          {
            t: "Push to the front to see the Lion Guard",
            check: {s:"athletics",s2:"spd",d:20},
            win: {
              r: "You get under the rope just as they pass. A tall knight looks down and winks. You will remember it all your life.",
              fx: {happy:5,fame:1},
            },
            lose: {r:"You get trodden on, lose a shoe and see only horse rumps.",fx:{happy:-2,health:-1}},
          },
          {
            t: "Watch the sword bouts at the Hall of the Lion",
            r: "Blunted blades, a judge with a staff, the long-armed Valdane thrust. You practice it with a stick for a month.",
            fx: {skill:{sword:2},happy:2},
          },
          {
            t: "Sell roasted chickpeas to the crowd",
            check: {s:"trade",s2:"int",d:18},
            win: {r:"By noon your sack is empty and your mother is amazed.",fx:{family:2,skill:{trade:2}}},
            lose: {r:"A bigger boy steals half your stock. You eat the rest.",fx:{happy:-1}},
          },
        ],
      },
      {
        id: "ww_va_runaway",
        title: "Any slave who reaches Varenna",
        cond: (p,C)=>R(p,"POL-03")&&C.adult(p)&&C.coast(p),
        w: .8,
        cool: 12,
        setup: (p,ctx)=>{pid(p,ctx,"acquaint")},
        text: "A thin {themRace} with chain sores on {theirHis} ankles hides in your shed: {them}, a galley slave who swam ashore from a Corsair ship. Any slave who reaches Varenna is free under the Lion Laws, and slavers who try to take one back are hanged. But the ship's men are already walking the shore with clubs, asking questions.",
        choices: [
          {
            t: "Hide {themHim} and send for the watch",
            check: {s:"wil",s2:"persuasion",d:40},
            win: {
              r: "The crossbowmen of the watch arrive in their blue surcoats. The ship's men run for their boat. {them} weeps into your shoulder.",
              fx: {honor:5,fame:1,them:{type:"friend",op:50}},
            },
            lose: {
              r: "The ship's men get to your door before the watch does. You hold them off, but they hurt you doing it.",
              fx: {health:-10,honor:5,wil:1.5,them:{type:"friend",op:50},cause:"a beating by slavers"},
            },
          },
          {
            t: "Take {themHim} to the harbor temple yourself",
            r: "The Luminary's clerk writes {theirHis} name in the free book. It takes all day. {them} has never had a name written down before.",
            fx: {honor:4,piety:2,them:{type:"friend",op:40}},
          },
          {
            t: "Sell {themHim} back to the ship's men",
            r: "They pay 10 suns and drag {them} off. If the watch ever hears, you hang beside them.",
            fx: {coin:10,honor:-12,trait:"cruel",them:{type:"enemy",op:-80}},
          },
        ],
      },
      {
        id: "ww_va_chest",
        title: "The spinning chest",
        cond: (p,C)=>R(p,"POL-03")&&C.female(p)&&(C.teen(p)||unwed(p,C)),
        w: 1,
        cool: 10,
        text: "In the Palella valley a bride brings a spinning chest, and since the wheel came the spinning wives of Dorium earn more than their husbands, which many men dislike. Your family is getting yours ready: painted, carved, filled with spindles and good blue cloth. Your mother wants a carpenter's son. You have other ideas.",
        choices: [
          {
            t: "Paint the chest yourself",
            check: {s:"craft",s2:"int",d:30},
            win: {
              r: "A lion, a ship and a spinning wheel, all in Palella blue. Women come from the next street to look.",
              fx: {skill:{craft:3},happy:4,fame:1},
            },
            lose: {
              r: "The lion looks like a sheep. Your little brother names it Fluffy.",
              fx: {happy:-1,skill:{craft:1}},
            },
          },
          {
            t: "Say you will choose your own husband",
            check: {s:"persuasion",s2:"wil",d:40},
            win: {
              r: 'Your mother argues for a week and gives in. "You earn your own bread at the wheel," she says. "I suppose you can choose who eats it."',
              fx: {wil:1,happy:4,trait:"stubborn"},
            },
            lose: {
              r: "Your father settles it with a shout. The carpenter's son is a decent boy, at least.",
              fx: {happy:-4,wil:1},
            },
          },
          {
            t: "Let them arrange it",
            r: "They are pleased. The chest is fine. The carpenter's son brings you figs.",
            fx: {lover:!0,happy:1},
          },
        ],
      },
      {
        id: "ww_va_breakwheel",
        title: "Breaking the wheel",
        cond: (p,C)=>R(p,"POL-03")&&(kid(p,C)||C.teen(p))&&C.terr(p,"plains","hills"),
        w: .8,
        once: !0,
        text: "Your grandmother, the best spinner on the street, has died. By Palella custom her family must break her wheel and bury the pieces with her: no wheel may be sold or given to anyone outside the valley. Your uncle has the axe. You spent your whole childhood at the foot of that wheel.",
        choices: [
          {
            t: "Hand him the axe yourself",
            r: "It breaks easily, which seems wrong. You put the spindle in her hands in the grave.",
            fx: {wil:1.2,happy:-3,piety:1},
          },
          {
            t: "Hide the little drive pulley as a keepsake",
            check: {s:"stealth",s2:"spd",d:20},
            win: {
              r: "Nobody counts the pieces. You keep it under your straw for years, and never show anyone.",
              fx: {happy:2,flag:"ww_va_pulley"},
            },
            lose: {
              r: 'Your uncle sees, takes it gently out of your hand and drops it in the grave. "That is how they hang people," he says quietly.',
              fx: {wil:.6,happy:-2},
            },
          },
          {
            t: "Sing her spinning song as they fill the grave",
            check: {s:"music",s2:"wil",d:18},
            win: {
              r: "The women join in, one after another, keeping time with no wheel. Even your uncle cries.",
              fx: {skill:{music:2},wil:1},
            },
            lose: {r:"Your voice cracks after one line. Your mother holds you.",fx:{wil:.8}},
          },
        ],
      },
      {
        id: "ww_va_galleyrower",
        title: "The Lion Fleet wants rowers",
        cond: (p,C)=>R(p,"POL-03")&&grown(p,C)&&(C.race(p,"halforc","orc")||C.poor(p))&&C.coast(p),
        w: 1,
        cool: 7,
        text: "A recruiter of the Lion Fleet stands on the Fish Steps. Ninety galleys need about twenty thousand rowers and marines, and convicts only fill so many benches. Half-orcs row and work the docks in Varenna; it is honest pay, and nobody looks at your face on a bench.",
        choices: [
          {
            t: "Sign on for the season",
            check: {s:"sta",s2:"str",d:40},
            win: {
              r: "A season of oars, salt sores and sardines. You come home with hands like hooves and 20 suns.",
              fx: {coin:20,skill:{sea:3},sta:.6,str:.5,job:"sailor"},
            },
            lose: {
              r: "The stroke is too fast for you at first. The bench-master's rope finds your back until it isn't.",
              fx: {coin:12,health:-8,wil:1.5,skill:{sea:2},cause:"the bench-master's rope"},
            },
          },
          {
            t: "Ask about marine pay instead",
            req: (p,C)=>C.prof(p,"xbow",30)||C.prof(p,"spear",30),
            r: "A marine eats better and rows less. You sign with the crossbowmen of a galley out of Tibata.",
            fx: {coin:15,skill:{sea:2,xbow:1},job:"mercenary"},
          },
          {
            t: "Walk on. You know what galleys do to men",
            r: "You find a day's work hauling nets instead.",
            fx: {coin:1},
          },
        ],
      },
      {
        id: "ww_va_beacon",
        title: "Sails off Tibata",
        cond: (p,C)=>R(p,"POL-03")&&(C.adult(p)||C.teen(p))&&C.coast(p),
        w: 1,
        cool: 7,
        text: "From the cliff path at dusk you see sails low on the water toward the Strait of Hael: three, then five. The watchtowers of the Strait March light fires when Blackreef sails appear. The nearest tower is dark. Its watchman is probably drunk.",
        choices: [
          {
            t: "Run for the tower and light the beacon",
            check: {s:"athletics",s2:"sta",d:38},
            win: {
              r: "You reach the tower with your lungs on fire and get the pitch burning. Down the coast, one by one, the other beacons answer.",
              fx: {fame:3,honor:3,sta:.5,favor:2},
            },
            lose: {
              r: "You twist an ankle on the path. By the time you limp to the tower the next one along has lit anyway.",
              fx: {wound:"bad_knee",health:-6,honor:1},
            },
          },
          {
            t: "Look again. Fishing boats run that course too",
            check: {s:"sea",s2:"int",d:35},
            win: {
              r: "Square sails, high sterns: Lucernan grain cogs, late in the season. A false alarm would have cost someone an eye in Morhaven. Here it only costs you a laugh.",
              fx: {skill:{sea:2},int:.3},
            },
            lose: {
              r: "You cannot tell. By morning there is smoke from a fishing village down the coast.",
              fx: {happy:-5,wil:1},
            },
          },
          {
            t: "Go home and bar the door",
            r: "You sleep badly. In the morning the sails are gone and nobody knows whose they were.",
            fx: {happy:-1},
          },
        ],
      },
      {
        id: "ww_va_terrace",
        title: "The Terrace School",
        cond: (p,C)=>R(p,"POL-03")&&grown(p,C)&&(C.soldier(p)||C.prof(p,"xbow",25)),
        w: 1,
        cool: 6,
        text: 'At the Terrace School of Castella, Captain Ilario Monti drills crossbowmen behind stone terraces cut into the hillside. "Varenna does not fight on open ground," he says. "We make the ground fight for us. Ditch, stakes, terrace. Knights wait. Then knights."',
        choices: [
          {
            t: "Shoot volleys from the terrace",
            check: {s:"xbow",s2:"int",d:44},
            win: {
              r: "Load, step up, loose, step down, a hundred times. By evening you can do it half asleep, which is the point.",
              fx: {skill:{xbow:3,tactics:1},merit:2},
            },
            lose: {
              r: "You step up when you should step down and take a bolt-butt in the ear from the man behind.",
              fx: {skill:{xbow:1},health:-3},
            },
          },
          {
            t: "Help dig the ditches and set stakes",
            r: "Backbreaking, and Monti watches every angle. You learn why a stake leans toward the horse.",
            fx: {skill:{siegecraft:2,tactics:1},str:.4},
          },
          {
            t: "Ask Monti why knights must wait",
            r: '"Because Montaros feel no pain and charge too soon," he says, too quietly for anyone else to hear.',
            fx: {skill:{tactics:2},int:.3},
          },
        ],
      },
      {
        id: "ww_va_kingsheart",
        title: "The king's health",
        cond: (p,C)=>R(p,"POL-03")&&C.adult(p)&&early(),
        w: .9,
        once: !0,
        text: "King Roderic is 42, the age when Valdane hearts fail, and they say his collapsed in November. In Varenna, asking about the king's health can get a stranger killed. Now a well-dressed stranger with a Lucernan accent buys you wine and asks, lightly, whether the king has been seen riding since winter.",
        choices: [
          {
            t: "Shrug and talk about the weather",
            r: "He tries twice more and gives up. When he leaves, a man at the next table follows him out.",
            fx: {skill:{intrigue:1}},
          },
          {
            t: "Tell him a lie for a coin",
            check: {s:"deception",s2:"int",d:44},
            win: {
              r: "You tell him the king hunted boar last week. He pays 3 suns and writes it down. Somewhere a spymaster will be very confused.",
              fx: {coin:3,skill:{deception:2}},
            },
            lose: {
              r: "He sees through you, smiles and leaves. A week later a sergeant of the watch asks why you were drinking with a Lucernan spy.",
              fx: {favor:-3,happy:-3},
            },
          },
          {
            t: "Report him to the watch",
            check: {s:"intrigue",s2:"persuasion",d:40},
            win: {
              r: "The watch takes him at the gate. Lady Oria Vantes's people thank you without telling you their names.",
              fx: {favor:3,coin:4},
            },
            lose: {
              r: "The watch captain has never heard of any Lucernan. Then he asks why you know so much about the king's health.",
              fx: {happy:-3,wil:.5},
            },
          },
        ],
      },
      {
        id: "ww_va_hellboar",
        title: "A hell boar in the vines",
        cond: (p,C)=>R(p,"POL-03")&&grown(p,C)&&C.terr(p,"hills","forest"),
        w: .9,
        cool: 8,
        text: "Something has torn up three rows of vines on the terraces and killed a dog: a hell boar, the great black boar of the Sunland hills, as heavy as a horse and twice as angry. The village wants it dead before the harvest. Nobody wants to be first.",
        choices: [
          {
            t: "Hunt it with a boar spear",
            req: (p,C)=>C.prof(p,"spear",30)||C.prof(p,"tracking",30)||C.trait(p,"brave"),
            r: "You find it at dusk in the scrub above the vines. It sees you at the same moment.",
            fx: {beast:{id:"CRE-23",place:"the vine terraces",title:"The hell boar"}},
          },
          {
            t: "Dig a pit trap on its path",
            check: {s:"survival",s2:"int",d:42},
            win: {
              r: "Three nights later it is in the pit, screaming. The men finish it with spears from above. The tusks hang over your door.",
              fx: {skill:{survival:2,tracking:1},fame:2,coin:4},
            },
            lose: {
              r: "It walks around your pit as if it read your mind, and eats another row of vines.",
              fx: {happy:-2,skill:{survival:1}},
            },
          },
          {
            t: "Leave it to braver people",
            r: "A Montaro cousin kills it the following week and talks about nothing else for a year.",
            fx: {},
          },
        ],
      },
      {
        id: "ww_va_hounds",
        title: "The Ashland March",
        cond: (p,C)=>R(p,"POL-03")&&grown(p,C)&&C.terr(p,"hills","plains","desert"),
        w: .7,
        cool: 12,
        text: "You are carrying salt west toward Albano when the howling starts at dusk: Hael Hounds, the lean grey dogs of the Ashlands that killed the royal surveyors in 1099. The carters say they are the ghosts of the dead of Mount Cinder. Ghosts or not, they are circling the mules.",
        choices: [
          {
            t: "Stand by the mules with a torch and a blade",
            r: "The lead hound comes in low and fast.",
            fx: {beast:{id:"CRE-56",place:"the Ashland road",light:"dusk",title:"Hael Hounds"}},
          },
          {
            t: "Build the fire high and wait for morning",
            check: {s:"survival",s2:"wil",d:40},
            win: {
              r: "You burn half the cart's wood. The hounds circle all night and slink off at dawn.",
              fx: {skill:{survival:2},wil:1},
            },
            lose: {
              r: "At the darkest hour they take a mule and drag it screaming into the night.",
              fx: {coin:-15,wil:1.2,happy:-4},
            },
          },
          {
            t: "Cut the mules loose and run",
            r: "You reach Albano alive and alone. The salt and the mules are gone.",
            fx: {coin:-20,wil:1,happy:-5},
          },
        ],
      },
      {
        id: "ww_va_cousin",
        title: "A Temple license",
        cond: (p,C)=>R(p,"POL-03")&&unwed(p,C),
        w: .7,
        cool: 15,
        text: "You have fallen for your cousin, and your cousin for you. In Varenna cousins may marry only with a Temple license, which costs money: 30 suns, they say, and more if the Luminary's clerk smells feeling.",
        choices: [
          {
            t: "Pay for the license",
            req: p=>p.coin>=30,
            r: "The clerk takes your 30 suns, adds a fee for haste, and stamps the paper. The family pretends it was their idea all along.",
            fx: {coin:-32,lover:!0,happy:7},
          },
          {
            t: "Argue the price down with the clerk",
            check: {s:"trade",s2:"persuasion",d:46},
            win: {
              r: "Twenty suns, and a promise to buy his brother's olives. Love is cheaper than it looks.",
              fx: {coin:-20,lover:!0,happy:6,skill:{trade:2}},
            },
            lose: {r:"He raises the price. You walk out with nothing.",fx:{happy:-4,wil:.6}},
          },
          {
            t: "Let it go",
            r: "You see each other at every family feast for the rest of your lives. It does not get easier.",
            fx: {happy:-5,wil:1},
          },
        ],
      },
      {
        id: "ww_va_laughing",
        title: "The Laughing Company",
        cond: (p,C)=>R(p,"POL-03")&&grown(p,C)&&C.male(p)&&free(p)&&!C.soldier(p)&&(C.stat(p,"str")>=30||C.trait(p,"brave","reckless")),
        w: .9,
        cool: 8,
        text: "A Montaro captain is hiring for the Laughing Company, the foot soldiers who charge first. Many of its men are Montaro cousins who feel little pain, and the rest are men who want to be thought so. The pay is good. The graves are many.",
        choices: [
          {
            t: "Sign and charge first",
            r: "You take the coin of earnest and a scarlet sash. The Montaros laugh at you, then with you. They die laughing too.",
            fx: {coin:5,job:"mercenary",skill:{spear:2,melee:2},trait:"brave"},
          },
          {
            t: "Wrestle a Montaro for a bigger signing coin",
            check: {s:"unarmed",s2:"str",d:50},
            win: {
              r: "You put him on his back. He laughs, which is unnerving, and pays you double to join.",
              fx: {coin:10,skill:{unarmed:2},fame:2},
            },
            lose: {
              r: "He breaks your nose and does not notice that you broke his finger.",
              fx: {wound:"broken_nose",health:-6,wil:1},
            },
          },
          {
            t: "Decline. You like feeling pain; it keeps you alive",
            r: "The captain laughs. Of course he does.",
            fx: {int:.2},
          },
        ],
      },
      {
        id: "ww_lu_zero",
        title: "The counting school",
        cond: (p,C)=>R(p,"POL-04")&&kid(p,C)&&!low(p),
        w: 1,
        cool: 5,
        text: `At the counting school, Mistress Chiara Benn chalks a strange round mark on the board. "Nothing," she says. "The most useful nothing in the world." Lucernan merchants' sons and daughters learn place-value numbers with zero here, so that one day they can insure a cargo or catch a cheat.`,
        choices: [
          {
            t: "Work the sums until you understand nothing",
            check: {s:"int",s2:"wil",d:22},
            win: {
              r: "Suddenly the columns make sense: tens, hundreds, the empty place that holds them up. You add up your father's ledger at supper and find his mistake.",
              fx: {int:.8,skill:{learning:2,trade:2}},
            },
            lose: {
              r: "The columns swim. Mistress Benn keeps you after school, patiently, until the lamps are lit.",
              fx: {int:.3,skill:{learning:1},wil:.4},
            },
          },
          {
            t: "Draw ships in the margin instead",
            r: "Very good ships. Mistress Benn confiscates them and keeps one, which you take as a compliment.",
            fx: {skill:{craft:1},happy:2},
          },
        ],
      },
      {
        id: "ww_lu_foundling",
        title: "A child named Marin",
        cond: (p,C)=>R(p,"POL-04")&&C.adult(p),
        w: .7,
        cool: 15,
        text: `In a fish basket on the Harbor Quarter steps: a baby, a week old, wrapped in sailcloth. Harbor foundlings in Lucerna are named Marin, "of the sea". The watch will take it to the Temple's foundling house, where many do not see their first winter.`,
        choices: [
          {
            t: "Take the baby home and raise it",
            r: "Your house is louder and poorer. Little Marin grows up on the quays and calls you by name.",
            fx: {happy:4,honor:4,coin:-5,flag:"ww_lu_marin"},
          },
          {
            t: "Pay a wet-nurse for the first year",
            req: p=>p.coin>=24,
            r: "Two suns a month to a salt-worker's wife in the Marsh Quarter. Every month you go to see the child.",
            fx: {coin:-24,honor:3,piety:2},
          },
          {
            t: "Carry it to the foundling house",
            r: 'The sisters write "Marin" in the book. There are three other Marins on the same page.',
            fx: {piety:1,wil:.4},
          },
        ],
      },
      {
        id: "ww_lu_lot",
        title: "Marines by lot",
        cond: (p,C)=>R(p,"POL-04")&&grown(p,C)&&C.male(p)&&free(p)&&!C.soldier(p),
        w: 1,
        cool: 7,
        text: "Lucerna's citizens serve as marines by lot, and the lot has fallen on you. The Lagoon Marines are citizen crossbowmen and boarders, and a galley sails from the Arsenal at Sea Opening with twenty manned beside it. A rich neighbor's son, also drawn, is looking for someone to take his place.",
        choices: [
          {
            t: "Serve your season on the galleys",
            check: {s:"xbow",s2:"sea",d:40},
            win: {
              r: "Crossbow drill on a pitching deck under Iacopo Rizzo's eye, and one real boarding off Tibenza. You come home tanned and harder.",
              fx: {skill:{xbow:2,sea:2,melee:1},honor:3,wil:.6},
            },
            lose: {
              r: "Seasick for six weeks. You learn to shoot leaning over the rail between heaves.",
              fx: {skill:{xbow:1,sea:2},health:-4,wil:1},
            },
          },
          {
            t: "Serve in the rich boy's place too, for his gold",
            r: "His father pays you a gold Lucernan crown, 24 suns, and you do two men's turns at the oars and the rail.",
            fx: {coin:24,skill:{sea:3,xbow:1},health:-5,sta:.5},
          },
          {
            t: "Pay someone to take your own place",
            req: p=>p.coin>=20,
            r: "A half-orc rower from the docks takes your 20 suns and your turn. Lucerna does not mind who stands on the deck, only that someone does.",
            fx: {coin:-20,honor:-2},
          },
        ],
      },
      {
        id: "ww_lu_fortyday",
        title: "The Forty-Day Law",
        cond: (p,C)=>R(p,"POL-04")&&C.adult(p),
        w: .9,
        cool: 10,
        text: "A cog from a plague port rides at anchor beyond the Lagoon Chain. Under the Forty-Day Law of 917, nobody may land for forty days. Your cousin is aboard, and at dusk a boy rows in with a message: bring a boat tonight, nobody aboard is sick.",
        choices: [
          {
            t: "Row out at night and bring him in",
            check: {s:"sea",s2:"stealth",d:46},
            win: {
              r: "You land him at the Isle of Graves and walk him home by the back canals. He was not sick. This time.",
              fx: {skill:{sea:2,stealth:2},happy:3,honor:-2},
            },
            lose: {
              r: "The Night Watch boat finds you halfway. Forty days on the ship for both of you, among the coughing.",
              fx: {health:-10,wil:1.5,happy:-5,cause:"ship fever"},
            },
          },
          {
            t: "Send food and a letter instead",
            r: "A basket on a line, bread and figs and wine. Thirty-nine days later he walks off the ship thin and cursing, and alive.",
            fx: {coin:-2,honor:2},
          },
          {
            t: "Stay away. The law is there for a reason",
            r: "Plague took a quarter of the city in the old days. You light a candle for him and wait.",
            fx: {wil:.6},
          },
        ],
      },
      {
        id: "ww_lu_seal",
        title: "A sea maiden in the net",
        cond: (p,C)=>R(p,"POL-04")&&C.adult(p)&&(C.job(p,"fish","sailor")||low(p)),
        w: 1,
        cool: 8,
        text: 'A lagoon monk seal, a "sea maiden" as the sailors call them, is tangled in your net and thrashing. It has torn half the mesh already. Killing a sea maiden has been fined since 922, and the old sailors say it brings worse than a fine.',
        choices: [
          {
            t: "Cut her free and lose the net",
            check: {s:"husbandry",s2:"spd",d:34},
            win: {
              r: "She slides off into the green water and looks back once. The old men on the quay nod at you all week.",
              fx: {coin:-3,piety:2,happy:3},
            },
            lose: {r:"She bites your hand to the bone before she goes.",fx:{coin:-3,wound:"bite",health:-6,piety:1}},
          },
          {
            t: "Club her and sell the skin quietly",
            check: {s:"stealth",s2:"str",d:44},
            win: {
              r: "A furrier in the Harbor Quarter pays 5 suns and asks no questions. The old men would.",
              fx: {coin:5,piety:-4,honor:-2},
            },
            lose: {
              r: "A Night Watch boat sees the blood. The fine is 15 suns, and every sailor on the quay spits when you pass.",
              fx: {coin:-15,honor:-4,happy:-4},
            },
          },
          {
            t: "Wait for her to tire, then untangle her",
            check: {s:"survival",s2:"wil",d:40},
            win: {
              r: "An hour of patience, and you save the net and the seal both.",
              fx: {skill:{survival:1,sea:1},wil:.5,happy:2},
            },
            lose: {r:"She tears the net to rags in her panic and escapes anyway.",fx:{coin:-3}},
          },
        ],
      },
      {
        id: "ww_lu_staple",
        title: "One bushel in twenty",
        cond: (p,C)=>R(p,"POL-04")&&C.adult(p)&&(is(p,"merchant")||C.job(p,"merchant")||C.prof(p,"trade",30)),
        w: 1,
        cool: 6,
        text: "Every grain ship crossing the Middle Sea lands at Lucerna and pays the Staple: one bushel in twenty, weighed by the Staple Weighers of House Bassan. Your cargo of Tamari wheat is on the weigh-house floor, and the weigher's thumb is resting very close to the scale.",
        choices: [
          {
            t: "Watch his thumb and say so, politely",
            check: {s:"trade",s2:"etiquette",d:44},
            win: {
              r: 'He lifts the thumb and re-weighs with a smile. "The Staple is honest," he says. It is now.',
              fx: {coin:8,skill:{trade:2}},
            },
            lose: {
              r: "He takes offense, and your grain waits two days in the rain for a second weighing.",
              fx: {coin:-6,happy:-3},
            },
          },
          {
            t: "Slip him a coin to lean the other way",
            req: p=>p.coin>=3,
            check: {s:"intrigue",s2:"trade",d:40},
            win: {
              r: "Three suns to him, fifteen saved for you. Fraud with weights costs a ship in Lucerna, so nobody says a word.",
              fx: {coin:12,honor:-3,skill:{intrigue:1}},
            },
            lose: {
              r: "He is a Bassan man, and proud. The Harbor Court fines you, and the story gets around the Wet Crown.",
              fx: {coin:-20,honor:-5,fame:-1},
            },
          },
          {
            t: "Pay and say nothing",
            r: "It is only a bushel or two. The Staple has been weighing since 358, and it will outlast you.",
            fx: {coin:-4},
          },
        ],
      },
      {
        id: "ww_lu_insure",
        title: "Old Ironjaw's price",
        cond: (p,C)=>R(p,"POL-04")&&C.adult(p)&&(is(p,"merchant","gentry","noble")||p.coin>=80),
        w: 1,
        cool: 6,
        text: 'Your cargo of salt and wine sails west next month. Sea insurance costs a fortieth of the cargo, but the underwriters say Old Ironjaw, the Blackreef captain, has been seen on the western approach, and the price has doubled to a twentieth. "Every lamp has its oil," the underwriter says, and does not explain.',
        choices: [
          {
            t: "Pay the double price",
            req: p=>p.coin>=10,
            r: "You pay 10 suns and sleep well. The ship comes home, which is how insurance always feels like a waste.",
            fx: {coin:-10,wil:.2},
          },
          {
            t: "Sail uninsured and pray",
            check: {s:"gambling",s2:"sea",d:45},
            win: {
              r: "The ship comes home with a fair wind and a fat profit. You buy the underwriter a drink and he does not laugh.",
              fx: {coin:30,skill:{gambling:2}},
            },
            lose: {
              r: "The ship comes home with an empty hold. The pirates took the wine and left the sailors, which is something.",
              fx: {coinPct:-.25,wil:1.5,happy:-6},
            },
          },
          {
            t: "Ask around the Wet Crown about Ironjaw's course",
            check: {s:"intrigue",s2:"sea",d:48},
            win: {
              r: "A pilot who drinks too much tells you where Ironjaw is not. Your ship takes that course, uninsured, and arrives.",
              fx: {coin:25,skill:{intrigue:2,sea:1}},
            },
            lose: {
              r: "Nobody in the Wet Crown knows anything, loudly. You pay the double price in the end.",
              fx: {coin:-10},
            },
          },
        ],
      },
      {
        id: "ww_lu_taster",
        title: "The host drinks first",
        cond: (p,C)=>R(p,"POL-04")&&grown(p,C)&&!is(p,"noble","royal"),
        w: .9,
        cool: 10,
        text: "A council family needs a second taster. The Doravellis train the best, and they cannot bear strong food themselves, but a taster need not be a Doravelli: only someone with a careful tongue and a strong stomach who eats first at every meal. The pay is 4 suns a month. Poison is the city's favorite crime.",
        choices: [
          {
            t: "Take the post",
            check: {s:"medicine",s2:"wil",d:40},
            win: {
              r: "You learn the taste of bitter almond and the tingle of aconite in a wine. Twice you send a cup back. Twice nobody dies.",
              fx: {coin:12,job:"servant",skill:{medicine:3,etiquette:2},wil:1},
            },
            lose: {
              r: "Something in the fish. You live, barely, and the cook vanishes the same night.",
              fx: {coin:8,health:-25,wil:2,cause:"poisoned fish"},
            },
          },
          {
            t: "Say no. Your tongue is not for sale",
            r: "Someone else will eat first in that house. You eat bread and figs and sleep sound.",
            fx: {},
          },
        ],
      },
      {
        id: "ww_lu_masks",
        title: "The Lagoon Festival",
        cond: (p,C)=>R(p,"POL-04")&&(C.teen(p)||grown(p,C)),
        w: 1,
        cool: 4,
        text: "After Sea Closing comes the Lagoon Festival of masks. For three nights everyone is a stranger on the canals. A figure in a silver fish mask has followed your boat across two bridges and is laughing at something you said.",
        choices: [
          {
            t: "Follow the silver fish into the crowd",
            req: (p,C)=>C.adult(p)&&!C.married(p),
            r: "You never take the masks off, not that night. The next week you find the same laugh in the fish market.",
            fx: {lover:!0,happy:6},
          },
          {
            t: "Keep a hand on your purse",
            check: {s:"ins",s2:"stealth",d:36},
            win: {
              r: "You catch the second hand in your coat, a small one. The silver fish vanishes into the dark. Your purse stays home.",
              fx: {skill:{stealth:1},int:.3},
            },
            lose: {
              r: "By the time you reach home your purse is lighter by everything in it. A lovely laugh, though.",
              fx: {coinPct:-.15,happy:-2},
            },
          },
          {
            t: "Dance on the bridges until dawn",
            r: "Rowing songs, harbor bells, and a mask you lose in the canal. Best night of the year.",
            fx: {happy:5,sta:.2},
          },
        ],
      },
      {
        id: "ww_lu_pilerats",
        title: "The Pile-Rats",
        cond: (p,C)=>R(p,"POL-04")&&C.adult(p)&&(C.poor(p)||C.trait(p,"greedy","reckless")),
        w: .9,
        cool: 8,
        text: "Old Benno Marin, a harbor foundling grown grey, runs the Pile-Rats: thieves who work by flat boat under the houses on their piles and come up through the floors of warehouses. He needs someone slim to go up through a floor tonight. A warehouse of figs and Lucernan wine.",
        choices: [
          {
            t: "Go up through the floor",
            check: {s:"stealth",s2:"spd",d:46},
            win: {
              r: "You saw through the boards in the dark, pass up six jars of wine and are gone before the bells. Benno pays you 9 suns, laughing.",
              fx: {coin:9,skill:{stealth:3},honor:-3,flag:"ww_lu_rat"},
            },
            lose: {r:"The warehouse watchman is awake with a boathook.",fx:{honor:-4,punish:"theft"}},
          },
          {
            t: "Hold the boat and keep watch",
            check: {s:"sea",s2:"ins",d:36},
            win: {
              r: "You hear the Night Watch oars before anyone else and get everyone away. Benno thinks you are lucky. You are.",
              fx: {coin:4,skill:{sea:1,stealth:1},honor:-2},
            },
            lose: {r:"You doze. The boy inside barely gets out. Benno does not ask you again.",fx:{happy:-2}},
          },
          {
            t: "Tell Benno to find another rat",
            r: 'He shrugs. "There are always more rats in Lucerna."',
            fx: {honor:1},
          },
        ],
      },
      {
        id: "ww_lu_grainday",
        title: "Grain Day",
        cond: (p,C)=>R(p,"POL-04")&&(C.teen(p)||grown(p,C)),
        w: 1,
        cool: 5,
        text: "Grain Day in August: the first Tamari ships come round the Lagoon Chain towers, low in the water with wheat from the Monuti. The whole city eats Tamari grain, and the whole city turns out to cheer. The weigh-house needs every strong back it can get, at double pay.",
        choices: [
          {
            t: "Carry sacks from dawn to dusk",
            check: {s:"str",s2:"sta",d:34},
            win: {
              r: "Two hundred sacks up the ramp. You fall asleep in the weigh-house with 4 suns in your fist.",
              fx: {coin:4,str:.5,sta:.4},
            },
            lose: {r:"Your back goes on the hundredth sack.",fx:{coin:2,wound:"back",health:-6}},
          },
          {
            t: "Sell figs and water to the porters",
            check: {s:"trade",s2:"int",d:28},
            win: {r:"Thirsty men pay anything in August. You sell out twice.",fx:{coin:5,skill:{trade:2}}},
            lose: {r:"The figs go soft in the heat. You eat a great many figs.",fx:{coin:-1,health:-1}},
          },
          {
            t: "Just watch the ships come in",
            r: "Every ship gets a cheer, the last ship the loudest. The bread will be cheaper next week.",
            fx: {happy:3},
          },
        ],
      },
      {
        id: "ww_lu_drowned",
        title: "Drinking with the Queen",
        cond: (p,C)=>R(p,"POL-04")&&C.adult(p),
        w: .7,
        cool: 15,
        text: "Late at night on a back canal you see a Night Watch boat with no lantern. Two men lift something long and heavy and roll it over the side. It does not float. In harbor cant, to drink with the Queen is to drown. In Lucerna, people who betray the Republic simply vanish.",
        choices: [
          {
            t: "Back away. You saw nothing",
            check: {s:"stealth",s2:"ins",d:36},
            win: {
              r: "They never see you. You never speak of it, and you never use that canal again.",
              fx: {wil:.8,skill:{stealth:1}},
            },
            lose: {
              r: "One of them turns his head toward you. Nothing happens. Nothing happens for a whole year, and you think about it every day.",
              fx: {wil:1.2,happy:-4,trait:"paranoid"},
            },
          },
          {
            t: "Find out who it was",
            check: {s:"intrigue",s2:"int",d:55},
            win: {
              r: "A clerk of the Hall of Records, missing since Tuesday. He had been asking about the toll ledgers. You put the knowledge away very carefully.",
              fx: {skill:{intrigue:2},int:.5,flag:"ww_lu_clerk"},
            },
            lose: {
              r: "Your questions are noticed. Ser Marco Vanni's men stop you on a bridge and suggest, kindly, that you take up fishing.",
              fx: {happy:-4,wil:1,favor:-2},
            },
          },
          {
            t: "Say a prayer for whoever it was",
            r: "Every lamp has its oil. You pray for the lamp.",
            fx: {piety:2},
          },
        ],
      },
      {
        id: "ww_lu_pilots",
        title: "The Pilots' Hall",
        cond: (p,C)=>R(p,"POL-04")&&grown(p,C)&&C.male(p)&&(C.prof(p,"sea",30)||C.job(p,"sailor")),
        w: .9,
        once: !0,
        text: "Pilot-Master Stefano Marin has watched you bring a cog through the lagoon mouth in fog. The Pilots' Hall teaches stars, shoals and the floating lodestone needle, but only after an oath on your life: a pilot who sells the needle's secret is hanged. Pilots are called by the name of the first ship they steer.",
        choices: [
          {
            t: "Swear the oath and become a pilot",
            check: {s:"sea",s2:"int",d:46},
            win: {
              r: "You learn the needle in a shuttered room and steer the Gull out on your first night run. From now on the harbor calls you Gull.",
              fx: {skill:{sea:5,learning:1},coin:10,fame:2,epithet:"Gull",flag:"ww_lu_pilot"},
            },
            lose: {
              r: "You swear, and then you fail the stars. Marin sends you back to the cogs. You keep the oath anyway, for the rest of your life.",
              fx: {skill:{sea:2},wil:1},
            },
          },
          {
            t: "Refuse. An oath on your life is too much",
            r: 'Marin nods as if he expected it. "Most men think so," he says. "That is why there are only ninety of us."',
            fx: {},
          },
        ],
      },
      {
        id: "ww_lu_race",
        title: "The galley race",
        cond: (p,C)=>R(p,"POL-04")&&(C.teen(p)||grown(p,C))&&C.male(p),
        w: 1,
        cool: 4,
        text: "Sea Opening: the Doge throws a gold crown into the lagoon to wed the sea, and then the galley crews race. The winning lagoon crew drinks free in every tavern until Sea Closing. Your quarter's crew is a rower short, and they are looking at your shoulders.",
        choices: [
          {
            t: "Take the empty bench",
            check: {s:"sta",s2:"sea",d:40},
            win: {
              r: "Your galley crosses the line half a length ahead of the Arsenal crew. Six months of free wine. You may never drink it all.",
              fx: {fame:2,happy:6,sta:.6,skill:{sea:2}},
            },
            lose: {
              r: "You catch a crab on the turn and the oar handle cracks your ribs. Fourth place.",
              fx: {wound:"broken_ribs",health:-8,skill:{sea:1}},
            },
          },
          {
            t: "Bet on your quarter instead",
            req: p=>p.coin>=5,
            check: {s:"gambling",s2:"sea",d:45},
            win: {r:"You win 15 suns and drink with the crew anyway.",fx:{coin:15,happy:3}},
            lose: {r:"Your quarter comes in last. Five suns into the lagoon with the Doge's crown.",fx:{coin:-5}},
          },
          {
            t: "Watch from the bridge",
            r: "Silver trumpets, bells and a thousand boats. You cheer yourself hoarse.",
            fx: {happy:3},
          },
        ],
      },
      {
        id: "ww_ash_arrowtax",
        title: "The arrow tax",
        cond: (p,C)=>R(p,"POL-05")&&C.adult(p)&&free(p)&&!is(p,"noble","royal"),
        w: 1.1,
        cool: 5,
        text: "Every hearth in Ashmere owes 24 arrows a year to the royal stores, and the Arrow Wain comes to {home} next week. You have nine finished, a bundle of shafts and no goose feathers.",
        choices: [
          {
            t: "Fletch them yourself, all night",
            check: {s:"craft",s2:"wil",d:36},
            win: {
              r: "Goose feathers from three neighbors, pitch, thread and patience. The clerk sights down each one and grunts approval.",
              fx: {skill:{craft:3,bow:1},wil:.4},
            },
            lose: {
              r: "Half your fletchings are crooked. The clerk rejects eleven and fines you an ember.",
              fx: {coin:-1,skill:{craft:1},happy:-2},
            },
          },
          {
            t: "Buy the missing arrows from the fletcher",
            req: p=>p.coin>=3,
            r: "Three embers to old Fletcher, who grins. Every hearth tax day is a good day for Fletcher.",
            fx: {coin:-3},
          },
          {
            t: "Bundle in a few warped shafts and hope",
            check: {s:"deception",s2:"spd",d:40},
            win: {r:"The clerk counts, not sights. Twenty-four. Next!",fx:{honor:-1}},
            lose: {
              r: 'The clerk pulls a warped one out and snaps it under your nose. "In battle, this kills a yeoman instead of a Varennan." Double tax.',
              fx: {coin:-4,honor:-3,happy:-3},
            },
          },
        ],
      },
      {
        id: "ww_ash_poach",
        title: "A deer in the royal forest",
        cond: (p,C)=>R(p,"POL-05")&&C.adult(p)&&(C.poor(p)||C.prof(p,"bow",35))&&C.terr(p,"hills","forest","mountains"),
        w: 1,
        cool: 7,
        text: "Late winter, and the barley is gone. In the royal forest above the village a red deer is browsing at the edge of the trees, sixty paces away. A poacher in Ashmere's royal forests loses a hand. Your bow is in your hand already.",
        choices: [
          {
            t: "Shoot, gut it and get out fast",
            check: {s:"bow",s2:"stealth",d:46},
            win: {
              r: "One arrow behind the shoulder. By dark the meat is salted in your loft and the hide sold to Old Tib Marrow, who asks nothing.",
              fx: {health:4,coin:3,skill:{bow:2,stealth:2},honor:-2},
            },
            lose: {r:"The forester's men heard the deer fall.",fx:{punish:"theft",honor:-4,wil:1}},
          },
          {
            t: "Lower the bow and set snares for rabbits outside the pale",
            check: {s:"survival",s2:"tracking",d:34},
            win: {
              r: "Four rabbits in two days, all on common land. Thin soup, honest soup.",
              fx: {health:2,skill:{survival:2}},
            },
            lose: {r:"A fox gets to your snares first.",fx:{health:-2,wil:.4}},
          },
          {
            t: "Watch it go. A hand is worth more than a deer",
            r: "It lifts its head, looks at you and walks into the trees. You go home hungry and whole.",
            fx: {wil:.8,health:-2},
          },
        ],
      },
      {
        id: "ww_ash_silverarrow",
        title: "The silver arrow",
        cond: (p,C)=>R(p,"POL-05")&&grown(p,C)&&C.prof(p,"bow",40),
        w: 1.2,
        cool: 3,
        text: "Return Day at the King's Butts below the castle rock. The best archers of Ashmere shoot for the silver arrow, and Perrin Hollowell, who holds it, is stringing his bow with a bored face. Princess Rowena watches from the stand in royal red. Twelve aimed arrows a minute at 200 paces is the King's Bowmen's standard. Today's mark is further.",
        choices: [
          {
            t: "Shoot for the silver arrow",
            check: {s:"bow",s2:"wil",d:62},
            win: {
              r: "Your last shaft splits Hollowell's in the clout. The Butts go silent, then roar. Rowena herself hands you the silver arrow.",
              fx: {
                fame: 8,
                honor: 4,
                happy: 10,
                skill: {bow:3},
                epithet: "Silverarrow",
                deed: "won the silver arrow at the King's Butts on Return Day",
                favor: 4,
              },
            },
            lose: {
              r: 'Close, very close. Hollowell keeps his arrow and shakes your hand. "Next year," he says, and means it.',
              fx: {fame:2,skill:{bow:2},wil:.8},
            },
          },
          {
            t: "Shoot in the volley match instead",
            check: {s:"bow",s2:"sta",d:48},
            win: {
              r: "Your village team drops forty shafts into the target circle in a minute and wins a barrel of cider.",
              fx: {fame:2,happy:5,skill:{bow:2,command:1}},
            },
            lose: {
              r: "Your string breaks on the third volley. Your team blames you all the way home.",
              fx: {happy:-3,skill:{bow:1}},
            },
          },
        ],
      },
      {
        id: "ww_ash_moot",
        title: "The Yeomen's Moot",
        cond: (p,C)=>R(p,"POL-05")&&C.adult(p)&&free(p)&&is(p,"peasant","artisan","merchant","gentry"),
        w: .9,
        cool: 8,
        text: `On Moot Green beside the Common Hall, the Yeomen's Moot argues a new war tax. Ashmere's free yeomen are hard to push, because every one of them can draw a war bow, and no war tax passes without their say. The Chancellor's man wants an ember a hearth for "the defense of the Palella". Your neighbors want you to speak.`,
        choices: [
          {
            t: "Speak for the tax: Varenna is coming",
            check: {s:"persuasion",s2:"int",d:46},
            win: {
              r: "You remind them of Stagley's four-month siege. The Moot grumbles and votes it through. The Chancellor's man takes your name, kindly.",
              fx: {skill:{persuasion:2,diplomacy:1},favor:3,fame:1},
            },
            lose: {r:`You are shouted down. "Let the court pay for the court's wedding!"`,fx:{happy:-3,favor:1}},
          },
          {
            t: "Speak against it: let the lords pay",
            check: {s:"persuasion",s2:"wil",d:42},
            win: {
              r: `"Seven years and the field is yours!" you finish, and the green roars. The tax fails. The Chancellor's man looks at you for a long time.`,
              fx: {skill:{persuasion:2},fame:2,favor:-3,honor:2},
            },
            lose: {r:"You stumble on your words, and someone laughs. The tax passes anyway.",fx:{happy:-2,wil:.5}},
          },
          {
            t: "Keep quiet and vote with the crowd",
            r: "The vote is close. Nobody remembers how you voted, which suits you.",
            fx: {},
          },
        ],
      },
      {
        id: "ww_ash_charter",
        title: "A year and a day",
        cond: (p,C)=>R(p,"POL-05")&&C.adult(p)&&!C.old(p)&&(p.status==="serf"||!!p.flags.unfree),
        w: 1.2,
        cool: 10,
        text: "Tenant farmers in Ashmere owe light labor to their lord, a gentle sort of serfdom, but under the old charters a tenant who lives a year and a day in a chartered town is free. Stagley and Brightkeep have walls and charters, and both need hands. Your lord's steward counts heads only at harvest.",
        choices: [
          {
            t: "Walk to Brightkeep and start the year",
            check: {s:"wil",s2:"survival",d:42},
            win: {
              r: "A year and a day sweeping a tanner's yard, sleeping in the loft, keeping your head down. On the hundred-and-sixty-sixth day after Midwinter the town clerk writes your name in the burgess roll.",
              fx: p=>setFree(p),
            },
            lose: {
              r: "The steward finds you in the Wool Market after five months and walks you home on a rope. The lord fines your family.",
              fx: {family:-3,coin:-3,wil:1.5,happy:-6},
            },
          },
          {
            t: "Stay. Your family needs you on the land",
            r: "You plough the lord's strip on Mondays and your own the rest of the week. It is not so bad, in Ashmere.",
            fx: {wil:.5},
          },
        ],
      },
      {
        id: "ww_ash_tworites",
        title: "Two rites",
        cond: (p,C)=>R(p,"POL-05")&&unwed(p,C),
        w: 1,
        cool: 8,
        text: ()=>`${A.pick(["A miller's","A Temple clerk's","A copper factor's"])} child from the Temple side of town has been courting you. In Ashmere the court follows the Temple and the villages keep the Seven Halls, and couples who marry across the two faiths hold both rites: a Sun rite at dawn in the chapel and the iron ring in the hall the same afternoon. Both families are already arguing about the feast.`,
        choices: [
          {
            t: "Marry with both rites, and both feasts",
            req: p=>p.coin>=8,
            r: "Dawn in the chapel, iron in the hall, cider for half the town. Your grandmother complains about the chapel all day and dances all night.",
            fx: {coin:-8,lover:!0,happy:8,piety:2},
          },
          {
            t: "Make them choose one rite",
            check: {s:"diplomacy",s2:"persuasion",d:46},
            win: {
              r: "You talk both families round to the hall-ring, with a priest's blessing at the door. Cheaper, and everyone claims it was their idea.",
              fx: {lover:!0,happy:5,skill:{diplomacy:2}},
            },
            lose: {
              r: "The families quarrel so badly that the match is off. You meet your love by the Butts in secret instead.",
              fx: {happy:-3,lover:!0,wil:.5},
            },
          },
          {
            t: "Break it off. Too much trouble",
            r: "It is easier, they say. It does not feel easier.",
            fx: {happy:-4},
          },
        ],
      },
      {
        id: "ww_ash_cinder",
        title: "The Cinder Watch",
        cond: (p,C)=>R(p,"POL-05")&&(C.teen(p)||C.adult(p)),
        w: .9,
        cool: 10,
        text: "The ground shudders at supper and the cups walk across the table. Up on Mount Cinder the Cinder Watch has kept beacon fires since the burying of the Ashwater in 776. Tonight the beacon is lit, red against the cloud. Ash Night is weeks away, and already the old women are hanging rowan on the doors.",
        choices: [
          {
            t: "Load the cart and take the family to the hills",
            r: "You spend three cold nights on a hillside. Nothing comes down the mountain but a little ash. You feel foolish and alive.",
            fx: {wil:.6,happy:-1},
          },
          {
            t: "Climb up to help the Watch",
            check: {s:"athletics",s2:"wil",d:44},
            win: {
              r: "You carry pitch and water for the watchmen all night. At dawn the mountain settles and the captain offers you a place.",
              fx: {skill:{athletics:2,survival:1},honor:3,fame:1},
            },
            lose: {
              r: "Sulfur gas in a hollow drops you like a stone. The watchmen drag you out by the ankles.",
              fx: {wound:"lungs",health:-12,wil:1,cause:"sulfur gas"},
            },
          },
          {
            t: "Stay. Your house is built low and thick for this",
            r: "The cups stop walking by midnight. Your house was built for the shaking, as all Ashmere houses are.",
            fx: {wil:.3},
          },
        ],
      },
      {
        id: "ww_ash_brokenarrow",
        title: "A broken arrow",
        cond: (p,C)=>R(p,"POL-05")&&(C.old(p)||C.adult(p)&&C.hasRel(p,"friend","bestfriend")),
        w: .8,
        cool: 10,
        text: "Your oldest friend is buried in the hall-yard, and the hall-keeper hands you the arrow. In Ashmere a commoner's grave gets a broken arrow laid across it. It is one of the friend's own shafts, with the fletching you watched being bound fifty Sundays at the Butts.",
        choices: [
          {
            t: "Break it cleanly and lay it down",
            r: "It snaps over your knee like a dry stick. You stand there until everyone else has gone.",
            fx: {wil:1.5,happy:-5},
          },
          {
            t: "Shoot it first, one last time, then break it",
            check: {s:"bow",s2:"wil",d:30},
            win: {
              r: "It flies true over the hall roof into the clout at the village butts. Then you fetch it back and break it, and the old men nod.",
              fx: {wil:1.2,honor:2,happy:-2},
            },
            lose: {
              r: "Your hands shake. It goes into the hedge. You leave it there and break one of your own.",
              fx: {wil:1.5,happy:-4},
            },
          },
          {
            t: "Keep the arrow whole and break one of yours",
            r: "The hall-keeper raises an eyebrow and says nothing. The arrow hangs over your hearth for the rest of your life.",
            fx: {wil:1,happy:-3},
          },
        ],
      },
      {
        id: "ww_ash_deserter",
        title: "Two fingers",
        cond: (p,C)=>R(p,"POL-05")&&C.adult(p),
        w: .7,
        cool: 12,
        setup: (p,ctx)=>{pid(p,ctx,"friend")},
        text: `{them} is at your back door at midnight in a torn red coat: a deserter from the King's Bowmen. Deserters from the Bowmen have the two drawing fingers of the right hand cut off, so they can never shoot again. "My mother is dying," {theyHe} says. "They would not let me go."`,
        choices: [
          {
            t: "Hide {themHim} in the loft",
            check: {s:"stealth",s2:"deception",d:44},
            win: {
              r: "The sergeant searches the village and leaves. {them} sees {theirHis} mother before she dies, and goes back to the Bowmen a week later to take the flogging instead of the knife.",
              fx: {honor:3,them:{type:"bestfriend",op:40},skill:{stealth:1}},
            },
            lose: {
              r: "The sergeant finds the ladder. {them} loses the fingers; you are fined 10 embers for the loft.",
              fx: {coin:-10,wil:1.5,happy:-6,them:{type:"friend",op:20}},
            },
          },
          {
            t: "Take {themHim} to the sergeant and plead for mercy",
            check: {s:"persuasion",s2:"wil",d:50},
            win: {
              r: "Sir Hugh Fletcher himself hears the case and calls it absence, not desertion. A flogging, and a week's leave after it.",
              fx: {honor:4,skill:{persuasion:2},them:{type:"friend",op:25}},
            },
            lose: {
              r: "The law is the law. You hear the knife come down through the guardhouse wall.",
              fx: {wil:2,happy:-8,them:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Turn {themHim} away",
            r: "{them} goes into the dark. You do not ask what became of {themHim}.",
            fx: {happy:-3,them:{type:"enemy",op:-25}},
          },
        ],
      },
      {
        id: "ww_ash_bowhouse",
        title: "The Yewhurst Bow-House",
        cond: (p,C)=>R(p,"POL-05")&&C.teen(p)&&!C.job(p),
        w: 1,
        once: !0,
        text: "Master Tamsin Yewhurst of the Bowyers and Fletchers takes two apprentices a year at the Bow-House in Mossreach. Seven years, food and blows, and at the end you can make a war bow from an elven yew stave that will throw an arrow 300 paces. She makes every boy and girl bend a stave in front of her.",
        choices: [
          {
            t: "Bend the stave",
            check: {s:"craft",s2:"str",d:22},
            win: {
              r: 'She watches your hands, not the stave. "You feel where it wants to break," she says. "Sign here."',
              fx: {job:"bowyer",skill:{craft:3,bow:1},apt:{craft:1.25}},
            },
            lose: {
              r: 'The stave snaps with a crack like a whip. "Elven yew," she sighs. "Three suns of it." She does not take you.',
              fx: {happy:-3,wil:.5},
            },
          },
          {
            t: "Ask to learn arrows instead of bows",
            r: "Fletching is quicker to learn and there is always work. She puts you with the fletchers.",
            fx: {job:"bowyer",skill:{craft:2}},
          },
        ],
      },
      {
        id: "ww_ash_nightmarch",
        title: "Sleep is for Varennans",
        cond: (p,C)=>R(p,"POL-05")&&kid(p,C),
        w: 1,
        cool: 5,
        text: `Grandmother sings Elsbeth's Night March by the fire: the queen who never closed her eyes, the bowmen who walked all night to the Brightwash ford and shot the lions at break of day. "Sleep is for Varennans," the bowmen say. Your brother bets you cannot stay awake until dawn.`,
        choices: [
          {
            t: "Stay awake until the cock crows",
            check: {s:"wil",s2:"sta",d:20},
            win: {
              r: "You see the sky go grey over the Butts. You win your brother's best marble and sleep through the whole next day.",
              fx: {wil:.8,happy:3},
            },
            lose: {r:"You wake up with your face in the ashes and your brother laughing.",fx:{happy:-2,wil:.3}},
          },
          {
            t: "Ask grandmother to sing it again",
            r: "She sings it three times. You fall asleep in the third verse and dream of red coats on a ford.",
            fx: {skill:{music:1},happy:3},
          },
        ],
      },
      {
        id: "ww_ash_weddingrite",
        title: "Iron ring or Sun rite",
        cond: (p,C)=>R(p,"POL-05")&&C.adult(p)&&early(),
        w: 1,
        once: !0,
        text: "The princess weds Prince Harald of Aldmark on Return Day. The Luminary wants a Sun rite; Aldmark wants the iron ring and its Emperor as head of the halls. Hall-Keeper Gudrun Ashdown has sent riders to every village: sign the Common Halls' petition to keep the village halls free of any emperor's priests, whatever the crown marries.",
        choices: [
          {
            t: "Make your mark on the petition",
            r: "Your mark goes beside four hundred others from this valley alone. The court will not like it.",
            fx: {piety:2,favor:-2,honor:2,flag:"ww_ash_petition"},
          },
          {
            t: "Argue for the Sun rite and peace with the court",
            check: {s:"persuasion",s2:"faith",d:44},
            win: {
              r: 'A few listen. "Let the princess marry how she likes; our halls are ours either way." Some sign, some do not, and nobody fights.',
              fx: {skill:{persuasion:2},favor:1},
            },
            lose: {
              r: "They call you a chapel creeper. The hall-keeper strikes your name off the feast list.",
              fx: {happy:-4,piety:-1},
            },
          },
          {t:"Stay out of it",r:"Kings marry, halls argue, the barley grows.",fx:{}},
        ],
      },
      {
        id: "ww_ash_copper",
        title: "The Brightwash mines",
        cond: (p,C)=>R(p,"POL-05")&&grown(p,C)&&(C.poor(p)||C.job(p,"miner"))&&C.male(p),
        w: 1,
        cool: 7,
        text: "The copper mines of the Brightwash pay a third of the crown's silver, and the Copper Guild of Mossreach always needs diggers. Underground, by lamplight, the timbers creak. Today they creak more than usual, and the old miners have gone quiet.",
        choices: [
          {
            t: "Keep digging. Pay is by the basket",
            check: {s:"sta",s2:"ins",d:42},
            win: {
              r: "The timbers hold. You fill twelve baskets and come up with 3 embers and green hands.",
              fx: {coin:3,str:.4,job:"miner"},
            },
            lose: {
              r: "The roof comes down two paces behind you. They dig you out in an hour, by which time your leg is broken.",
              fx: {wound:"limp",health:-18,wil:2,cause:"a mine collapse"},
            },
          },
          {
            t: "Shore up the timbers before working",
            check: {s:"craft",s2:"int",d:38},
            win: {
              r: "The old miners help when they see what you are doing. The roof cracks that afternoon and holds.",
              fx: {skill:{craft:2,siegecraft:1},honor:2,coin:1},
            },
            lose: {r:"You spend the day shoring and earn nothing. The roof holds anyway.",fx:{skill:{craft:1}}},
          },
          {
            t: "Go up and take a day's loss",
            r: "You lose a day's pay. Nothing falls. Nobody laughs; miners never do.",
            fx: {coin:-1},
          },
        ],
      },
      {
        id: "ww_nr_skis",
        title: "The ski race",
        cond: (p,C)=>R(p,"POL-08")&&kid(p,C),
        w: 1,
        cool: 4,
        text: "Children in Northreach learn sailing, skis and the law-verses by ear, in that order. Today the children of {home} race on skis from the boathouses to the hall and back, and the winner gets a walrus-ivory game piece carved by the old jarl's carver.",
        choices: [
          {
            t: "Race flat out down the long hill",
            check: {s:"spd",s2:"athletics",d:20},
            win: {
              r: "You fly past the others on the long hill and nearly into the fjord. The ivory piece is a little wolf. You keep it all your life.",
              fx: {spd:.5,skill:{athletics:2},happy:4},
            },
            lose: {
              r: "You fall on the long hill and slide on your back the rest of the way. Everyone agrees it was the best fall ever seen.",
              fx: {health:-2,happy:1},
            },
          },
          {
            t: "Take the woods path everyone forgets",
            check: {s:"survival",s2:"int",d:22},
            win: {
              r: "Through the pines, over the frozen stream, back before anyone else. The older children call it cheating. The old men call it Ice Walker thinking.",
              fx: {int:.4,skill:{survival:2},happy:3},
            },
            lose: {r:"The stream ice cracks. You come home wet to the waist and blue.",fx:{health:-4,wil:.5}},
          },
        ],
      },
      {
        id: "ww_nr_lawverse",
        title: "The law-verses",
        cond: (p,C)=>R(p,"POL-08")&&(kid(p,C)||C.teen(p))&&C.ageAdj(p)>=9,
        w: 1,
        once: !0,
        text: "The law in Northreach is spoken at the Thing, not written, and the whole of it lives in the Lawspeaker's head. Old Einar Greyhand trains three apprentices at a time, and one place is open. He asks each child to repeat after him the verse on stolen boats. It is forty lines long.",
        choices: [
          {
            t: "Repeat it word for word",
            check: {s:"int",s2:"wil",d:26},
            win: {
              r: 'Every line. Greyhand raises a white eyebrow. "Again tomorrow," he says, which means yes.',
              fx: {int:1,skill:{learning:3,diplomacy:1},apt:{learning:1.25},flag:"ww_nr_lawpupil"},
            },
            lose: {
              r: 'You lose it at line twelve. He smiles. "Ask the Lawspeaker," he says, "is what people say. Not everyone can be asked."',
              fx: {int:.3,skill:{learning:1}},
            },
          },
          {
            t: "Say you would rather learn ships",
            r: 'Greyhand laughs. "So would I, at your age. Go and learn ships."',
            fx: {skill:{sea:1}},
          },
        ],
      },
      {
        id: "ww_nr_longship",
        title: "The district longship",
        cond: (p,C)=>R(p,"POL-08")&&grown(p,C)&&C.male(p)&&free(p),
        w: 1.1,
        cool: 5,
        text: 'Every district of Northreach must keep a longship and its crew of forty, and free men bring their own shield, spear and axe. Your turn has come round. The steersman wants to take the ship along the coast on the ebb, as far as the ice allows, "to show the plains men we can still row".',
        choices: [
          {
            t: "Row and keep your shield on the rail",
            check: {s:"sea",s2:"sta",d:40},
            win: {
              r: "Ten days of hard rowing, fog and herring, and you see the Amber Capes from the sea. You come home salt-bearded.",
              fx: {skill:{sea:3,axe:1},sta:.5,honor:2},
            },
            lose: {
              r: "A squall on the third day. You spend it bailing and vomiting, and lose your shield overboard.",
              fx: {skill:{sea:2},health:-4,wil:1,coin:-4},
            },
          },
          {
            t: "Train the young ones in the shield wall",
            req: (p,C)=>C.prof(p,"shield",30)||C.prof(p,"axe",30),
            r: "You teach six farm boys to lock shields and step together. By the end they flinch less.",
            fx: {skill:{command:2,shield:1},fame:1},
          },
          {
            t: "Pay the steersman to row without you",
            req: p=>p.coin>=8,
            r: "Eight suns of hacksilver. The crew calls you a plains man behind your back.",
            fx: {coin:-8,honor:-3},
          },
        ],
      },
      {
        id: "ww_nr_thrall",
        title: "A year and a day",
        cond: (p,C)=>R(p,"POL-08")&&C.adult(p)&&p.coin<10&&!is(p,"noble","royal","gentry"),
        w: 1,
        cool: 10,
        text: "You owe the boatwright 30 suns' weight of silver for a hull you will never finish paying. Under Eirik II's Thrall Law of 880 a debtor may bind himself to work off a debt for a year and a day, but never be sold. The boatwright is a fair man, as such men go.",
        choices: [
          {
            t: "Bind yourself for a year and a day",
            r: `A year of planing oak and tarring seams in the boatwright's shed. On the last day he hands you an adze. "Keep it," he says. "You earned more than the hull."`,
            fx: {skill:{craft:4,sea:1},wil:1.5,str:.4,flag:"ww_nr_thrallyear"},
          },
          {
            t: "Ask the Lawspeaker for time to pay",
            check: {s:"diplomacy",s2:"persuasion",d:44},
            win: {
              r: "The law gives you until the next Thing. You pay it with a summer's herring.",
              fx: {skill:{diplomacy:2},coin:-2},
            },
            lose: {r:"The Lawspeaker recites the verse on debts. It is not on your side.",fx:{wil:.8,happy:-3}},
          },
          {
            t: "Cut up your arm-ring to pay what you can",
            r: "The silver ring your father gave you, hacked into pieces on the boatwright's scale. It pays a third.",
            fx: {happy:-5,wil:1},
          },
        ],
      },
      {
        id: "ww_nr_balance",
        title: "Hacksilver and a balance",
        cond: (p,C)=>R(p,"POL-08")&&C.adult(p)&&C.coast(p),
        w: 1,
        cool: 6,
        text: "At the Tin Wharf in Wolfhaven, silver goes by weight: arm-rings are cut and the pieces weighed on the reeve's clerk's balance. Today you are selling a winter's seal oil. The clerk's balance swings oddly, as if it remembers being heavier on one side.",
        choices: [
          {
            t: "Ask to weigh on your own little balance",
            check: {s:"trade",s2:"int",d:44},
            win: {
              r: "Yours says one thing, his says another. A crowd gathers. He re-weighs with a sour face, and you walk away with a fifth more.",
              fx: {coin:6,skill:{trade:2},flag:"ww_nr_balance"},
            },
            lose: {
              r: "Your balance is worse than his. The crowd laughs, and he pays what he likes.",
              fx: {coin:2,happy:-2},
            },
          },
          {
            t: "Take what he gives",
            r: "Salt in the beard, silver in the hand. Less silver than there should be.",
            fx: {coin:4},
          },
          {
            t: "Mention, quietly, that giants trade here too",
            check: {s:"intrigue",s2:"ins",d:50},
            win: {
              r: "His face goes white. He pays you well over the weight and asks you never to say that word near the Tin Wharf again.",
              fx: {coin:10,skill:{intrigue:2},honor:-1},
            },
            lose: {r:"He looks at you blankly. Then, an hour later, a hird-man asks your name.",fx:{coin:4,happy:-3}},
          },
        ],
      },
      {
        id: "ww_nr_brideprice",
        title: "The bride-price",
        cond: (p,C)=>R(p,"POL-08")&&unwed(p,C),
        w: 1,
        cool: 7,
        text: p=>`In Northreach a marriage is a bargain between families, sealed with a bride-price in silver or boats. ${SEX(p,"Your family has found you a fisher's daughter from the next fjord; her father wants a six-oar boat for her.","A fisher's son from the next fjord has asked for you; your father wants a six-oar boat for you, and the boy's father is laughing.")} The bargaining is in the hall tonight.`,
        choices: [
          {
            t: "Do the bargaining yourself",
            check: {s:"trade",s2:"persuasion",d:40},
            win: {
              r: "A four-oar boat and a barrel of herring, and both fathers think they won. The wedding is at the first ship launch after the ice.",
              fx: {lover:!0,happy:6,skill:{trade:2}},
            },
            lose: {
              r: "You argue so hard that the other father walks out. Your mother does not speak to you for a week.",
              fx: {happy:-4},
            },
          },
          {
            t: "Let the fathers haggle and go out to meet {npcF}",
            req: p=>p.sex==="M",
            r: "You meet behind the boathouse while your fathers shout. By the time they agree, you already had.",
            fx: {lover:!0,happy:5},
          },
          {
            t: "Let the fathers haggle and go out to meet {npcM}",
            req: p=>p.sex==="F",
            r: "You meet behind the boathouse while your fathers shout. By the time they agree, you already had.",
            fx: {lover:!0,happy:5},
          },
          {
            t: "Refuse the match",
            r: "Women own their dowry and choose more than outsiders think, in Northreach. You keep yours.",
            fx: {wil:.5},
          },
        ],
      },
      {
        id: "ww_nr_seal",
        title: "On the drift ice",
        cond: (p,C)=>R(p,"POL-08")&&grown(p,C)&&C.coast(p),
        w: 1,
        cool: 6,
        text: "Late winter: seals have hauled out on the drift ice off the capes, and every boat goes out for oil and skins. The ice is grey and soft at the edges. The others are already spread out across the floe with their clubs.",
        choices: [
          {
            t: "Go far out where the big seals lie",
            check: {s:"survival",s2:"spd",d:44},
            win: {
              r: "Three fat seals and a skin worth a good knife. You get back to the boat as the floe starts to crack.",
              fx: {coin:7,skill:{survival:2}},
            },
            lose: {
              r: "The floe splits under you. The cold is a hammer. They haul you out with a boathook.",
              fx: {wound:"frostbite",health:-14,wil:1.5,cause:"the drift ice"},
            },
          },
          {
            t: "Work the edge near the boat",
            r: "Small seals, safe ice. Enough oil for the lamp all winter.",
            fx: {coin:3},
          },
          {
            t: "Keep watch for a bear from the boat",
            check: {s:"ins",s2:"tracking",d:38},
            win: {
              r: "A white bear on the next floe. You shout in time and everyone gets back to the boat.",
              fx: {honor:2,fame:1,skill:{tracking:1}},
            },
            lose: {r:"You see nothing, and there is nothing to see. A cold day for no oil.",fx:{}},
          },
        ],
      },
      {
        id: "ww_nr_launch",
        title: "The first launch",
        cond: (p,C)=>R(p,"POL-08")&&(kid(p,C)||C.teen(p)||C.adult(p)),
        w: .9,
        cool: 5,
        text: "The ice has broken at last, and the first ship of the year slides down the rollers into the harbor while the horns blow. By custom the youngest crew-member stands in the prow as she touches water. This year that is you.",
        choices: [
          {
            t: "Stand tall in the prow",
            check: {s:"athletics",s2:"wil",d:22},
            win: {
              r: "The ship hits the water with a slap and a wave. You keep your feet, arms up, soaked and shouting. The whole shore cheers.",
              fx: {happy:5,fame:1},
            },
            lose: {
              r: "You go headfirst into the harbor. It is considered very lucky. It does not feel lucky.",
              fx: {health:-3,happy:2},
            },
          },
          {
            t: "Pour ale to the Sea King from the prow",
            r: "The ale goes over the side. Somewhere under the fog the Sea King drinks, the old men say.",
            fx: {piety:2,happy:2},
          },
        ],
      },
      {
        id: "ww_nr_shipfire",
        title: "A jarl's burning",
        cond: (p,C)=>R(p,"POL-08")&&C.adult(p)&&C.coast(p),
        w: .7,
        cool: 12,
        text: "An old jarl has died, and great dead in Northreach are burned in their ships on the harbor. Someone must row the ship out on the ebb, set the fire and swim back through water cold enough to stop a heart. The jarl's widow is looking at you.",
        choices: [
          {
            t: "Row her out and set the fire",
            check: {s:"sea",s2:"sta",d:44},
            win: {
              r: "The ship burns on the dark water while the horns sound. You swim back blue and shaking, and the widow puts her own fur on your shoulders.",
              fx: {honor:5,fame:3,wil:1,skill:{sea:1}},
            },
            lose: {
              r: "The cold takes your legs halfway back. A boat fishes you out barely breathing.",
              fx: {health:-15,honor:3,wil:1.5,wound:"lungs",cause:"the winter sea"},
            },
          },
          {
            t: "Bow and say you are not worthy",
            r: "A hird-man does it instead. Nobody blames you. Everyone notices.",
            fx: {honor:-1},
          },
        ],
      },
      {
        id: "ww_nr_tinwharf",
        title: "Short bars",
        cond: (p,C)=>R(p,"POL-08")&&C.adult(p)&&(C.poor(p)||C.prof(p,"stealth",30)),
        w: .8,
        cool: 9,
        text: "Hakon Gull keeps a net-loft on the Boathouse Strand and buys wreck goods. He also runs short tin bars to the Coldhaven boats, past the crown's tenth on all tin bound for Kingsmere. He needs someone to carry a sack of bars along the shore at night.",
        choices: [
          {
            t: "Carry the sack",
            check: {s:"stealth",s2:"str",d:42},
            win: {
              r: "Heavy as a dead man and twice as quiet. Hakon pays 6 suns in hacksilver.",
              fx: {coin:6,skill:{stealth:2},honor:-2},
            },
            lose: {
              r: "A Tin Reeve's man with a lantern. You drop the sack and run, and Hakon wants you to pay for it.",
              fx: {coin:-5,happy:-4,punish:"smuggling"},
            },
          },
          {
            t: "Say no and keep your mouth shut",
            r: "Hakon nods. He likes people who keep their mouths shut.",
            fx: {},
          },
          {
            t: "Tell the Tin Reeves",
            r: "Hakon is fined twice the value and sails for Ragvik. Somebody puts a dead gull on your doorstep.",
            fx: {favor:2,honor:1,happy:-2},
          },
        ],
      },
      {
        id: "ww_nr_feud",
        title: "Ask the Lawspeaker",
        cond: (p,C)=>R(p,"POL-08")&&C.adult(p)&&C.male(p),
        w: .9,
        cool: 10,
        setup: (p,ctx)=>{pid(p,ctx,"acquaint")},
        text: "A man of the next district killed your cousin in a drunken brawl over a net. Under the law the killer must pay blood-price or be outlawed. But {them}, the killer's brother, has come to your door alone, and says the family cannot pay, and asks what you mean to do.",
        choices: [
          {
            t: "Take it to the spring Thing",
            check: {s:"diplomacy",s2:"learning",d:42},
            win: {
              r: "The Lawspeaker sets the price and gives them two years to pay. The feud ends at the Thing, as feuds should.",
              fx: {honor:3,skill:{diplomacy:2},them:{type:"friend",op:15}},
            },
            lose: {
              r: "The Thing outlaws the killer. Somebody from your family kills him in the forest within the month. It does not end there.",
              fx: {wil:1,happy:-5,them:{type:"enemy",op:-40}},
            },
          },
          {
            t: "Take a boat in payment and swear peace",
            r: "A six-oar boat for a cousin. It is the law, and it is not enough, and you swear anyway on iron.",
            fx: {coin:30,honor:2,wil:1,them:{type:"acquaint",op:10}},
          },
          {
            t: "Fight the brother here and now",
            r: "{them} expected this. {theyHe} draws an axe.",
            fx: {
              honor: -2,
              duel: {
                foe: "them",
                opts: {kind:"duel",place:"the shore below your house",lethal:!0,toYield:!1,title:"Blood feud"},
              },
            },
          },
        ],
      },
      {
        id: "ww_nr_wintercrossing",
        title: "The Winter Crossing",
        cond: (p,C)=>R(p,"POL-08")&&C.old(p),
        w: 1,
        cool: 8,
        text: `"Over the ice in the dark of the year, eight hundred went and none knew fear." The young ones sing the Lay of the Winter Crossing at the hall fire as if it were a story. You remember the real one: the night of 1092 when the Ice Walkers burned the emperor's barns, and the friends who went through the ice.`,
        choices: [
          {
            t: "Tell them how it really was",
            r: 'The cold, the dark, the sound the ice made. The hall is silent. A boy asks if you were afraid. "All of us," you say. "The song is wrong."',
            fx: {wil:1,honor:2,fame:1},
          },
          {
            t: "Sing the lay with them, louder than all",
            check: {s:"music",s2:"wil",d:26},
            win: {
              r: "Your old voice cracks on the high line and nobody minds. The hall stamps and roars. For one verse you are young.",
              fx: {happy:6,skill:{music:1}},
            },
            lose: {
              r: "You run out of breath in the second verse and sit down coughing. The young ones finish it for you.",
              fx: {happy:-1,health:-2},
            },
          },
          {
            t: "Go outside and look at the ice alone",
            r: "The fjord is white under the moon. You say their names, one by one.",
            fx: {wil:1.5,happy:-3,piety:1},
          },
        ],
      },
      {
        id: "ww_nr_oarless",
        title: "The oarless boat",
        cond: (p,C)=>R(p,"POL-08")&&C.adult(p),
        w: .6,
        cool: 15,
        setup: (p,ctx)=>{pid(p,ctx,"acquaint")},
        text: "An oath-breaker is set adrift. In Northreach that means a boat without oars on the open sea, leaving the Sea King to judge. It is {them}, who swore on iron to stand by {theirHis} crew and ran when the hird came. The boat drifts past the end of your jetty in the dusk.",
        choices: [
          {
            t: "Throw {themHim} an oar when nobody is looking",
            check: {s:"stealth",s2:"throwing",d:44},
            win: {
              r: "It lands in the boat with a clatter. {them} stares at you, then picks it up. The Sea King can judge a man with one oar just as well.",
              fx: {honor:-2,piety:-1,them:{type:"friend",op:50},flag:"ww_nr_oar"},
            },
            lose: {
              r: "A neighbor sees you. The Thing fines you heavily for meddling with the Sea King's judgment.",
              fx: {coin:-15,honor:-4,happy:-4},
            },
          },
          {
            t: "Watch until the fog takes the boat",
            r: "You stand on the jetty until you cannot see it. That is what the law asks: that someone watches.",
            fx: {wil:1,piety:2},
          },
          {t:"Turn your back",r:"Iron does not lie, and neither did the law.",fx:{piety:1}},
        ],
      },
      {
        id: "ww_nr_fogfish",
        title: "Fog on the banks",
        cond: (p,C)=>R(p,"POL-08")&&grown(p,C)&&(C.job(p,"fish","sailor")||C.coast(p)),
        w: 1,
        cool: 5,
        text: "Fog comes down on the herring banks so thick you cannot see your own bow. The herring are running under you; you can hear them. Somewhere out there the other boats are calling to each other with horns.",
        choices: [
          {
            t: "Fish blind and fill the boat",
            check: {s:"sea",s2:"ins",d:42},
            win: {
              r: "The net comes up silver and heavy, three times. You steer home by the sound of the surf. Salt in the beard, silver in the hand.",
              fx: {coin:8,skill:{sea:2,husbandry:1}},
            },
            lose: {
              r: "You drift onto a skerry and stave in a plank. You bail all the way home with an empty hold.",
              fx: {coin:-4,wil:1,skill:{sea:1}},
            },
          },
          {
            t: "Blow your horn and wait for the fog to lift",
            r: "Three hours of grey nothing and horn calls. When it lifts, the herring are gone. So is nobody, which is the point.",
            fx: {wil:.4},
          },
        ],
      },
      {
        id: "ww_hl_climbname",
        title: "A name from the rock",
        cond: (p,C)=>R(p,"POL-13")&&(kid(p,C)||C.teen(p)),
        w: 1,
        once: !0,
        text: "Highland children are often named for a famous climb or deed. The older children dare you up the Raven's Chimney, a crack in the cliff above the summer huts, with the whole valley spread out below like a cloth. Nobody your age has done it this year.",
        choices: [
          {
            t: "Climb the Chimney to the top",
            check: {s:"athletics",s2:"wil",d:26},
            win: {
              r: "Hands raw, knees bleeding, the wind in your ears at the top. From now on the valley calls you Raven.",
              fx: {skill:{athletics:3},wil:1,fame:1,epithet:"Raven",happy:5},
            },
            lose: {
              r: "Halfway up a hold breaks. You slide, catch, and hang there until a herder comes with a rope.",
              fx: {health:-6,wil:1,happy:-3},
            },
          },
          {
            t: "Climb halfway and come down slow",
            r: "Halfway is higher than most. Nobody names you for it, but nobody laughs either.",
            fx: {skill:{athletics:1}},
          },
        ],
      },
      {
        id: "ww_hl_eagle",
        title: "The Crown Eagle",
        cond: (p,C)=>R(p,"POL-13")&&(C.teen(p)||C.adult(p)),
        w: 1,
        cool: 6,
        text: "Driving the cattle up to the high pastures in May, you see the shadow first: a Crown Eagle, wings as wide as a cart, dropping on a calf at the edge of the herd. The First Speaker herself once saved a child from one. The calf is bawling.",
        choices: [
          {
            t: "Shoot at it",
            req: (p,C)=>C.prof(p,"xbow",25)||C.prof(p,"bow",25),
            check: {s:"xbow",s2:"ins",d:48},
            win: {
              r: "Your bolt takes it through the wing. It flaps off over the ridge, crippled, and the calf staggers back to its mother.",
              fx: {fame:2,skill:{xbow:2},honor:2},
            },
            lose: {
              r: "You miss. The eagle lifts the calf a little way, drops it on the rocks and feeds.",
              fx: {coin:-6,happy:-3},
            },
          },
          {
            t: "Run at it shouting and throwing stones",
            check: {s:"throwing",s2:"spd",d:40},
            win: {
              r: "A stone cracks off its beak. It lets go and beats away, screaming.",
              fx: {skill:{throwing:2},honor:2,happy:3},
            },
            lose: {
              r: "It turns on you instead of the calf. Talons like hooks rake your arm.",
              fx: {wound:"scar_arm",health:-10,wil:1,cause:"a Crown Eagle"},
            },
          },
          {
            t: "Drive the rest of the herd into the gully",
            r: "You lose the calf and save the herd. The eagle eats on the ridge, watching you.",
            fx: {coin:-6,skill:{husbandry:2}},
          },
        ],
      },
      {
        id: "ww_hl_rustle",
        title: "Fourfold",
        cond: (p,C)=>R(p,"POL-13")&&C.adult(p),
        w: 1,
        cool: 8,
        setup: (p,ctx)=>{pid(p,ctx,"acquaint")},
        text: "Coming down at Harvest Home, you find three heifers in your herd with the Redford brand on their flanks. {them} of the Redford valley is coming down the same track with a face like thunder. Cattle theft between valleys is paid back fourfold; a second offense means exile over the passes.",
        choices: [
          {
            t: "Show {themHim} at once, and give them back",
            r: '{them} counts them twice, then laughs. "They wandered. Cows are fools." You share a flask of herb spirit on the track.',
            fx: {honor:3,them:{type:"friend",op:25}},
          },
          {
            t: "Say they were sold to you honestly",
            check: {s:"deception",s2:"persuasion",d:48},
            win: {
              r: "{them} does not believe you, but cannot prove it. The heifers stay in your byre and {theyHe} stays your enemy.",
              fx: {coin:18,honor:-4,them:{type:"enemy",op:-30}},
            },
            lose: {
              r: "The valley council hears it. Fourfold: twelve cattle. Your herd is ruined.",
              fx: {coin:-60,honor:-6,wil:1.5,them:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Find out who drove them into your herd",
            check: {s:"tracking",s2:"int",d:44},
            win: {
              r: "The tracks show a third herd, a third brand. You and {them} go together to the valley council and two cattle thieves go over the passes.",
              fx: {skill:{tracking:2},honor:3,them:{type:"friend",op:30}},
            },
            lose: {
              r: "Rain washed the tracks. {them} takes the heifers back and looks at you sideways for a year.",
              fx: {them:{type:"rival",op:-10}},
            },
          },
        ],
      },
      {
        id: "ww_hl_vote",
        title: "The Gordush contract",
        cond: (p,C)=>R(p,"POL-13")&&C.adult(p)&&early(),
        w: 1,
        once: !0,
        text: "In March the Council of Valleys votes on Aldmark's contract: 4,000 League crossbowmen on the Gordush by May Fair, for good silver. Twenty thousand has already changed hands, they say. A yes angers Northreach; a no leaves Aldmark's line without crossbows. Your valley meeting must tell its Speaker which way to vote.",
        choices: [
          {
            t: "Speak for the contract: silver keeps the valleys fed",
            check: {s:"persuasion",s2:"trade",d:44},
            win: {
              r: '"We cannot eat Free Hall sermons," you finish. Your valley votes yes. The hire-captains drink to you.',
              fx: {skill:{persuasion:2},fame:1,coin:3},
            },
            lose: {
              r: "A hall-keeper tears your speech to pieces with the Edict of the Halls. Your valley votes no.",
              fx: {happy:-2},
            },
          },
          {
            t: "Speak against it: Aldmark tried to rule our halls",
            check: {s:"persuasion",s2:"faith",d:42},
            win: {
              r: "You remind them of 1089 and the Edict. The hall cheers and the valley votes no. Northreach will hear of it.",
              fx: {skill:{persuasion:2},piety:2,fame:1},
            },
            lose: {
              r: "A Greycloak captain asks who will pay for the grain. Nobody has an answer, least of all you.",
              fx: {happy:-2},
            },
          },
          {
            t: "Let the older ones talk",
            r: "The meeting goes on till dark. In the end the valley sends its Speaker with no instructions at all, which is very Highland.",
            fx: {},
          },
        ],
      },
      {
        id: "ww_hl_herbspirit",
        title: "Herb spirit",
        cond: (p,C)=>R(p,"POL-13")&&C.adult(p),
        w: .9,
        cool: 7,
        text: "Highland herb spirit is strong enough to strip paint, and it is sold in the lowlands as medicine. Your aunt's recipe uses gentian, juniper and something she will only tell you on her deathbed. A mule-man from Roseham wants twenty flasks to carry to the Sunland fairs.",
        choices: [
          {
            t: "Distill the twenty flasks",
            check: {s:"craft",s2:"medicine",d:38},
            win: {
              r: "Clear as water, bitter as a widow. The mule-man pays 12 silver and asks for forty next year.",
              fx: {coin:12,skill:{craft:2,medicine:1,trade:1}},
            },
            lose: {
              r: "The still boils over and singes your eyebrows off. The batch tastes of smoke and failure.",
              fx: {coin:-2,wound:"burn",health:-4},
            },
          },
          {
            t: "Sell him your aunt's old stock and keep the recipe",
            check: {s:"trade",s2:"persuasion",d:36},
            win: {
              r: 'Aged spirit fetches more. "Twelve years in the barrel," you tell him, which is nearly true.',
              fx: {coin:14,skill:{trade:2}},
            },
            lose: {
              r: "Your aunt finds out. She does not speak to you until the cattle come down.",
              fx: {coin:8,happy:-3},
            },
          },
          {
            t: "Drink a flask with him to seal the deal",
            r: "You wake under the hay with no memory and a signed bargain in your pocket. It seems to be a good bargain.",
            fx: {coin:6,health:-2,happy:2},
          },
        ],
      },
      {
        id: "ww_hl_mulechest",
        title: "A mule's fee",
        cond: (p,C)=>R(p,"POL-13")&&grown(p,C)&&!is(p,"noble","royal"),
        w: 1,
        cool: 6,
        text: `At the Mule Gate Inn, pass smugglers will carry anything for a mule's fee. A soft-handed Sunlander offers you 10 silver to take a small locked chest over the high pass to the Sunland side. "No questions," he says. Highland law throws anyone who guides an enemy army from the Traitor's Rock. A chest is not an army.`,
        choices: [
          {
            t: "Take it over the pass",
            check: {s:"survival",s2:"sta",d:44},
            win: {
              r: "Three days of ice and goat paths. A man in Ostran black takes the chest at the far side and pays you the other half.",
              fx: {coin:10,skill:{survival:2},sta:.4},
            },
            lose: {
              r: "A snowstorm on the high pass. You come down alive, with frostbitten fingers and no chest.",
              fx: {wound:"frostbite",health:-10,wil:1.5,cause:"a storm on the high pass"},
            },
          },
          {
            t: "Open the chest at the first camp",
            check: {s:"stealth",s2:"craft",d:45},
            win: {
              r: "Letters in cipher and a silver seal: a hire contract, and a bribe. You close it again, carefully, and remember the names.",
              fx: {coin:10,skill:{intrigue:2},flag:"ww_hl_chest"},
            },
            lose: {
              r: "The lock jams open and will not close. You throw the whole thing in a gorge and never go back to the Mule Gate.",
              fx: {happy:-3},
            },
          },
          {t:"Refuse",r:"He finds another mule-man before you finish your cheese.",fx:{}},
        ],
      },
      {
        id: "ww_hl_drakes",
        title: "White shapes in the clouds",
        cond: (p,C)=>R(p,"POL-13")&&grown(p,C)&&(C.prof(p,"tracking",25)||C.prof(p,"survival",25)||C.job(p,"hunter","herd")),
        w: .8,
        cool: 12,
        text: `A man who works for Speaker Tomas Redford offers you 30 silver to guide him into the Stonefoot kin's closed valleys above Highcastle, where no hunter may go. Over the door of the Council Hall hangs a Snow Drake hide, "the last of its kind since 704". Herders whisper about white shapes in the clouds. Guiding strangers there can get you killed.`,
        choices: [
          {
            t: "Guide him in for the silver",
            check: {s:"survival",s2:"stealth",d:52},
            win: {
              r: "High above the glacier you see them: white, winged, the size of large dogs, a dozen at least. The Redford man goes pale with greed. You take his silver and wish you had not.",
              fx: {coin:30,honor:-6,flag:"ww_hl_drakeseen",skill:{survival:2}},
            },
            lose: {
              r: "Stonefoot Cliff Runners find you on the ridge. They break your guide's leg and yours, very calmly, and carry you both down.",
              fx: {wound:"limp",health:-15,honor:-6,wil:1.5,cause:"the Cliff Runners"},
            },
          },
          {
            t: "Go up alone, just to see",
            check: {s:"stealth",s2:"survival",d:50},
            win: {
              r: "From a crag you watch a Snow Drake drift down the wind like a scrap of cloud. You tell nobody. Ever.",
              fx: {wil:1,happy:5,flag:"ww_hl_drakeseen"},
            },
            lose: {
              r: "Something white and fast comes down at you out of the glare.",
              fx: {beast:{id:"CRE-06",place:"a closed valley above Highcastle",title:"The Snow Drake"}},
            },
          },
          {
            t: "Refuse him and warn the Stonefoots",
            r: "A Cliff Runner comes to thank you, says nothing about drakes, and leaves a round of cheese the size of a cartwheel.",
            fx: {honor:4,favor:3},
          },
        ],
      },
      {
        id: "ww_hl_charterday",
        title: "Charter Day",
        cond: (p,C)=>R(p,"POL-13")&&C.ageAdj(p)>=9&&!C.old(p),
        w: 1,
        cool: 4,
        text: "Charter Day, 21 June, the anniversary of 336. In every valley the hall-priest reads the Charter of Highcastle, and children who can recite the first article get honey cakes: the highland clans rule themselves; no outside king may tax them; no one may be king.",
        choices: [
          {
            t: "Recite the whole Charter, not just the first article",
            check: {s:"learning",s2:"wil",d:28},
            win: {
              r: "Every article, including the bit about mule tolls. The hall-priest gives you two honey cakes and a very long look.",
              fx: {skill:{learning:2,diplomacy:1},int:.4,happy:3},
            },
            lose: {
              r: `You get stuck on the article about fixed sums. "A fixed sum can't be cheated," the old men chant, helping you.`,
              fx: {skill:{learning:1}},
            },
          },
          {
            t: "Join the long horns on the ridge",
            r: "The horns call from valley to valley until the whole League is booming. You cannot hear for an hour.",
            fx: {happy:4,skill:{music:1}},
          },
        ],
      },
      {
        id: "ww_hl_finery",
        title: "Home from contract",
        cond: (p,C)=>R(p,"POL-13")&&C.adult(p),
        w: 1,
        cool: 6,
        setup: (p,ctx)=>{pid(p,ctx,"friend")},
        text: "Young highlanders serve two or three hire contracts abroad before they marry, and they always come home in foreign finery. {them} has come back from Ostra in a slashed purple-and-yellow doublet and a hat with a feather, with Greycloak silver in {theirHis} purse and stories in {theirHis} mouth.",
        choices: [
          {
            t: "Drink with {themHim} and hear the stories",
            r: 'Ostran bankers, Sunland wine, a siege in the Neck. "Hire the cloak, not the crown," {theyHe} says, and buys the next round.',
            fx: {happy:4,them:{type:"friend",op:15},int:.2},
          },
          {
            t: "Ask how to sign with the Greycloaks",
            req: (p,C)=>!C.soldier(p)&&!C.old(p),
            r: "{them} walks you to Roseham and introduces you to a captain. You are on the next contract roll.",
            fx: {job:"mercenary",skill:{xbow:2},them:{type:"friend",op:10}},
          },
          {
            t: "Mock the feather",
            check: {s:"persuasion",s2:"int",d:30},
            win: {
              r: "The whole hall laughs, {them} hardest of all. The feather ends up on the goat.",
              fx: {happy:3,them:{type:"friend",op:10}},
            },
            lose: {r:"{them} is not amused. Silver makes some people tender.",fx:{them:{type:"rival",op:-15}}},
          },
        ],
      },
      {
        id: "ww_hl_yodel",
        title: "Calls between valleys",
        cond: (p,C)=>R(p,"POL-13")&&(C.teen(p)||C.adult(p))&&!C.old(p),
        w: .9,
        cool: 6,
        text: "A yodel carries over the ridge from the next valley, faster than any runner: fire in the hay barns at the summer huts, and the men away with the herds. In the Highlands, news goes by voice. Somebody must call it on to the valley beyond, and somebody must go.",
        choices: [
          {
            t: "Call it on to the next valley",
            check: {s:"music",s2:"sta",d:30},
            win: {
              r: "Your call bounces off the far wall clear as a bell. An answer comes back within a minute. Help is on its way.",
              fx: {skill:{music:2},honor:2},
            },
            lose: {
              r: "Your voice breaks. The call is garbled, and the next valley sends men to the wrong hut.",
              fx: {happy:-2},
            },
          },
          {
            t: "Run over the ridge to help",
            check: {s:"athletics",s2:"sta",d:40},
            win: {
              r: "You arrive first and save the byre and the calves with a bucket line of three.",
              fx: {sta:.5,honor:3,fame:1},
            },
            lose: {r:"You arrive half dead and too late. The barns are ash.",fx:{sta:.3,wil:.6}},
          },
        ],
      },
      {
        id: "ww_hl_dwarfcrew",
        title: "The dwarves' tallies",
        cond: (p,C)=>R(p,"POL-13")&&grown(p,C)&&(C.job(p,"miner")||C.poor(p)||C.race(p,"dwarf")),
        w: 1,
        cool: 7,
        text: `About 8,400 dwarves work the League's deep silver by contract under Master Borin Flintaxe. "He sells work, never secrets," the miners say. A dwarf crew-master in Amberhurst needs a human clerk to keep the tally of baskets, and mine-clerks learn their figures from the dwarves' tallies.`,
        choices: [
          {
            t: "Take the tally stick",
            check: {s:"int",s2:"learning",d:38},
            win: {
              r: "Notches by the ten, knots by the hundred, a rune for the Warden's tenth. In a month the crew-master trusts your count over his own.",
              fx: {skill:{learning:2,trade:2,stewardship:1},coin:6,job:"miner"},
            },
            lose: {
              r: "You miscount by a whole cart on the first day. The dwarves are very polite about it, which is worse.",
              fx: {coin:2,happy:-3},
            },
          },
          {
            t: "Ask to dig instead, for the better pay",
            check: {s:"str",s2:"sta",d:44},
            win: {
              r: "The dwarves work you hard and pay you exactly what the contract says, to the penny.",
              fx: {coin:8,str:.6,job:"miner"},
            },
            lose: {r:"Deep silver is no place for soft hands. You last a week.",fx:{coin:2,health:-4}},
          },
        ],
      },
      {
        id: "ww_hl_cairn",
        title: "A cairn facing home",
        cond: (p,C)=>R(p,"POL-13")&&C.old(p),
        w: 1,
        once: !0,
        text: "In the Highlands the dead are buried in stone cairns on the slopes, facing their home valley. You are old, and you have begun choosing your stones. Your grandchildren think it is morbid. You think it is good sense.",
        choices: [
          {
            t: "Build it high, where you can see the whole valley",
            check: {s:"str",s2:"wil",d:30},
            win: {
              r: "A summer of carrying stones to the shoulder of the mountain. When it is done you sit on it and eat cheese and look at everything you ever loved.",
              fx: {wil:1,happy:5,str:.3},
            },
            lose: {
              r: "You hurt your back on the third day. Your grandson finishes it, grumbling, and becomes very proud of it.",
              fx: {wound:"back",health:-5,happy:2},
            },
          },
          {
            t: "Choose a place by the cattle track",
            r: "Low, where the herds go up in May and down at Harvest Home. You will hear the bells.",
            fx: {happy:4,wil:.5},
          },
        ],
      },
      {
        id: "ww_hl_contract",
        title: "A broken contract",
        cond: (p,C)=>R(p,"POL-13")&&grown(p,C)&&(C.soldier(p)||C.job(p,"mercenary")),
        w: 1,
        cool: 7,
        text: "Abroad on a hire contract, your captain is three months behind with pay, and the town you guard is talking about opening its gates to the other side. In the League a man who breaks his contract forfeits his pay and is barred from the companies forever. Half the company wants to walk home.",
        choices: [
          {
            t: "Stay to the end of the contract",
            r: "You stay. When the money comes it comes in full, because a League contract is a League contract. The company that walked is never hired again.",
            fx: {wil:1.5,honor:4,coin:20,fame:1},
          },
          {
            t: "Talk the company into staying",
            check: {s:"command",s2:"persuasion",d:48},
            win: {
              r: "You remind them of fixed sums and of what happens to companies that break. They stay. The captain promotes you.",
              fx: {skill:{command:3,persuasion:1},merit:3,fame:2,coin:20},
            },
            lose: {
              r: "They walk anyway. You stay with a dozen others and hold a gate for a week on bread and water.",
              fx: {wil:2,honor:3,health:-6,coin:15},
            },
          },
          {
            t: "Walk home with the others",
            r: "You are home by Harvest Home with empty pockets and your name struck off the roll at Roseham.",
            fx: {honor:-6,happy:-2,flag:"ww_hl_barred"},
          },
        ],
      },
      {
        id: "ww_gh_coindive",
        title: "Count to ten",
        cond: (p,C)=>R(p,"POL-14")&&kid(p,C),
        w: 1,
        cool: 4,
        text: `"Down, down, the Diver's crown, under the chain where the riders drown." The harbor children are diving for a copper penny a sailor has tossed off the steps. Hold your breath and count to ten, the rhyme says. The penny is a lot deeper than ten.`,
        choices: [
          {
            t: "Dive for the penny",
            check: {s:"sta",s2:"wil",d:22},
            win: {
              r: "Green dark, cold, your chest burning, and then the penny in your fist. You come up gasping to cheers and spend it on a honey cake.",
              fx: {sta:.6,wil:.5,happy:4,coin:1},
            },
            lose: {
              r: "You come up too soon, coughing salt water, with a handful of mud. Someone else gets the penny.",
              fx: {sta:.3,health:-2},
            },
          },
          {
            t: "Count for the others on the steps",
            r: "You count out loud for every diver, slowly. Everyone wants you to count for them. Some children are born to be divers, some to be toll clerks.",
            fx: {int:.3,happy:2},
          },
        ],
      },
      {
        id: "ww_gh_wreck",
        title: "A ship on the rocks",
        cond: (p,C)=>R(p,"POL-14")&&C.adult(p)&&C.coast(p),
        w: .9,
        cool: 9,
        text: "A storm, and at dawn a Sunland cog lies on the rocks below the village, her back broken. Barrels are washing up in the surf. In Greyhaven wreckers are hanged at the harbor mouth, and taking from a wreck before the king's men come counts as wrecking. There are still men alive on her deck.",
        choices: [
          {
            t: "Get a line out to the survivors",
            check: {s:"sea",s2:"str",d:46},
            win: {
              r: "You swim a rope out through the breakers and bring off seven men. The owner pays you 15 tides when he hears.",
              fx: {honor:5,fame:3,coin:13,skill:{sea:2}},
            },
            lose: {
              r: "A wave throws you against the hull. Others finish the rescue while you lie on the shingle coughing blood.",
              fx: {wound:"broken_ribs",health:-14,honor:4,wil:1,cause:"the surf"},
            },
          },
          {
            t: "Roll a barrel or two into the dunes",
            check: {s:"stealth",s2:"str",d:42},
            win: {
              r: "Two barrels of Sunland wine, buried in the sand. The king's men count the rest and never miss them.",
              fx: {coin:10,honor:-4},
            },
            lose: {r:"The king's men arrive while you are still rolling.",fx:{honor:-6,punish:"theft"}},
          },
          {
            t: "Run for the harbor reeve",
            r: "The reeve comes with a boat and men. The cargo is saved for its owners, and you get a tide for your trouble.",
            fx: {coin:1,honor:2},
          },
        ],
      },
      {
        id: "ww_gh_needlegold",
        title: "The pilots' secret",
        cond: (p,C)=>R(p,"POL-14")&&grown(p,C)&&(C.job(p,"sailor")||C.prof(p,"sea",35)),
        w: .9,
        cool: 10,
        text: "A soft-spoken man with a Velgradan lilt buys you drinks in the Tapper's House on the Galley Strand, and asks about the floating lodestone needle that Greyhaven pilots use to find north in fog. He has a purse of gold on the table. Any pilot who shows the lodestone to an outsider is drowned.",
        choices: [
          {
            t: "Tell him a sailor's tale for his gold",
            check: {s:"deception",s2:"sea",d:46},
            win: {
              r: "A needle floating on wine, magnetized by a priest's blessing at full moon. He pays 10 tides and hurries off. Somewhere in Sevany a captain will be very disappointed.",
              fx: {coin:9,skill:{deception:2}},
            },
            lose: {
              r: "He knows enough to know you are lying. He leaves without paying, and you notice the Admiral's rope merchant watching you from the next table.",
              fx: {happy:-3,favor:-2},
            },
          },
          {
            t: "Report him to Master Pilot Garth Ferris",
            r: "Ferris thanks you with a hard handshake. The soft-spoken man is not seen on the Galley Strand again.",
            fx: {favor:3,honor:2,coin:3},
          },
          {
            t: "Drink his wine and say nothing useful",
            r: "You talk about fish for two hours. He pays for everything.",
            fx: {happy:2},
          },
        ],
      },
      {
        id: "ww_gh_rowers",
        title: "Coast rowers",
        cond: (p,C)=>R(p,"POL-14")&&grown(p,C)&&C.male(p)&&C.coast(p)&&!C.soldier(p),
        w: 1,
        cool: 7,
        text: "Coast districts of Greyhaven owe rowers for the 58 galleys, and your district's quota is short. The Galley Yard at Brookhurst trains new crews in rowing drill, ramming and boarding under Admiral Rolf Brightwater, and the Admiral's men are walking the beach with a list.",
        choices: [
          {
            t: "Take your bench for the season",
            check: {s:"sta",s2:"sea",d:40},
            win: {
              r: "Ramming drill in the channel tides until you dream of the stroke. You come home with 12 tides and shoulders like a bull.",
              fx: {coin:10,skill:{sea:3},sta:.6,str:.4},
            },
            lose: {
              r: "You catch a crab in ramming drill and the oar loom breaks your nose.",
              fx: {wound:"broken_nose",health:-6,skill:{sea:2}},
            },
          },
          {
            t: "Volunteer for the Chain Guard marines instead",
            req: (p,C)=>C.prof(p,"spear",25)||C.prof(p,"xbow",25)||C.prof(p,"melee",25),
            r: "Paid all year from the tolls, a tower to sleep in, and toll-runners to board. Better than an oar.",
            fx: {job:"mercenary",coin:6,skill:{sea:1,spear:1}},
          },
          {
            t: "Hide in the dunes until the list moves on",
            check: {s:"stealth",s2:"survival",d:38},
            win: {r:"They take your cousin instead. He never quite forgives you.",fx:{honor:-2,skill:{stealth:1}}},
            lose: {r:"They find you, and the reeve fines your family for the trouble.",fx:{coin:-5,honor:-3}},
          },
        ],
      },
      {
        id: "ww_gh_smokewell",
        title: "The gas hollows",
        cond: (p,C)=>R(p,"POL-14")&&C.adult(p)&&(low(p)||C.job(p,"herd","farm")),
        w: .9,
        cool: 8,
        text: "In the Smokewell March, gas from the volcano's vents pools in the hollows on still days and kills sheep where they stand. This morning your flock has drifted into the Long Hollow, and three ewes are already down. There is no wind.",
        choices: [
          {
            t: "Hold your breath and drag them out",
            check: {s:"sta",s2:"wil",d:42},
            win: {
              r: "Down, grab, drag, up, breathe. Over and over. You save all but the three. Your head pounds until supper.",
              fx: {coin:4,sta:.5,wil:.6},
            },
            lose: {
              r: "The gas takes you in the middle of the hollow. A neighbor hooks you out with a crook.",
              fx: {wound:"lungs",health:-15,wil:1,cause:"volcano gas"},
            },
          },
          {
            t: "Send the dog round and whistle them up",
            check: {s:"husbandry",s2:"int",d:36},
            win: {
              r: "Good dog. The flock streams up the slope. You lose the three that were down and no more.",
              fx: {skill:{husbandry:2},coin:2},
            },
            lose: {
              r: "The dog goes down in the hollow too. You lose him and half the flock.",
              fx: {coin:-10,happy:-6,wil:1},
            },
          },
          {
            t: "Leave them. No sheep is worth a life",
            r: "You lose eleven sheep. You do not lose yourself.",
            fx: {coin:-12,wil:.8},
          },
        ],
      },
      {
        id: "ww_gh_dragonyear",
        title: "The dragon year",
        cond: (p,C)=>R(p,"POL-14")&&C.adult(p)&&early()&&(C.job(p,"sailor","merchant")||C.coast(p)),
        w: 1,
        once: !0,
        text: "The whole city believes the Black Dragon will rise from the channel this year, thirty-four years after the black serpent was seen off Smokewell in 1071. Sailors are hiring out of Greyhaven, and toll income has fallen by a fifth. Half your crew has already signed on with a Lucernan cog.",
        choices: [
          {
            t: "Hire half-orc sailors from the Horse Quay to fill the benches",
            check: {s:"trade",s2:"command",d:40},
            win: {
              r: "Steppe half-orcs who never heard of the dragon. They row well and laugh at the priests. You sail on time.",
              fx: {coin:6,skill:{command:2,trade:1}},
            },
            lose: {
              r: "They take your earnest money and vanish into the steppe trade. You sail late and short-handed.",
              fx: {coin:-8,happy:-3},
            },
          },
          {
            t: "Tell the crew: the dragon comes every 34 years, the toll daily",
            check: {s:"persuasion",s2:"wil",d:44},
            win: {r:"They laugh. The ones who stay are the ones worth having.",fx:{skill:{persuasion:2},honor:2}},
            lose: {
              r: "A grizzled bosun says he saw the serpent with his own eyes in 1071. Two more sign off.",
              fx: {happy:-3},
            },
          },
          {
            t: "Leave the sea for the year",
            r: "You find work on the ropewalks. If the dragon rises, you will not be on the water.",
            fx: {coin:-4,wil:.4},
          },
        ],
      },
      {
        id: "ww_gh_horsequay",
        title: "The Horse Quay",
        cond: (p,C)=>R(p,"POL-14")&&grown(p,C),
        w: 1,
        cool: 6,
        text: "Steppe horses from the Nine Winds come ashore at the Horse Quay, bought for grain and cloth under the old compact. They come off the ships wild-eyed after the voyage, and the half-orc grooms need help with a dun stallion who has already kicked one man into the harbor.",
        choices: [
          {
            t: "Ride him until he quits",
            check: {s:"riding",s2:"str",d:50},
            win: {
              r: "Up, down, round the quay twice, through a stack of fish baskets. Then he stands, blowing. The dealer offers you a cut on the next shipload.",
              fx: {skill:{riding:3,husbandry:1},fame:1,coin:5},
            },
            lose: {r:"He throws you into the harbor too.",fx:{health:-6,happy:-2,skill:{riding:1}}},
          },
          {
            t: "Calm him the steppe way, by voice",
            check: {s:"husbandry",s2:"wil",d:42},
            win: {
              r: "An old half-orc groom shows you the low hum the Wind Riders use. The stallion drops his head. The groom grins with all his tusks.",
              fx: {skill:{husbandry:3},newRel:{type:"friend",op:30}},
            },
            lose: {r:"He bites your shoulder through your coat.",fx:{wound:"bite",health:-5}},
          },
          {
            t: "Hold the rope and leave the brave work to grooms",
            r: "You earn two tides and keep your teeth.",
            fx: {coin:2},
          },
        ],
      },
      {
        id: "ww_gh_tollclerk",
        title: "The Toll-House ledgers",
        cond: (p,C)=>R(p,"POL-14")&&C.adult(p)&&(C.literate(p)||C.job(p,"scribe")),
        w: .9,
        cool: 12,
        text: "You copy the channel ledgers at the Toll-House, where the through-toll is split in half with Velgrad under the Treaty of the Two Shores. Tonight, totting up the year, you see that Velgrad's half is always a little smaller than half. Eleven years of a little smaller. The Toll-Mistress, Beatrix Hollin, signs every page.",
        choices: [
          {
            t: "Correct nothing and copy faithfully",
            r: "It is not your toll and not your treaty. You copy the numbers as they are, and sleep badly.",
            fx: {wil:.5,skill:{stewardship:1}},
          },
          {
            t: "Make a quiet copy of the true sums",
            check: {s:"stealth",s2:"learning",d:44},
            win: {
              r: "You keep the copy sewn into a cushion. One day someone will want it very badly.",
              fx: {skill:{stealth:1,intrigue:2},flag:"ww_gh_tollcopy"},
            },
            lose: {
              r: `The Toll-Mistress's clerk, Edith Quill, catches you at it, looks at you a long moment and says, "So you have one too."`,
              fx: {skill:{intrigue:1},flag:"ww_gh_tollcopy"},
            },
          },
          {
            t: "Ask the Toll-Mistress about it",
            check: {s:"persuasion",s2:"etiquette",d:50},
            win: {
              r: `She smiles. "Velgrad burned Sevina's neighbors and would burn ours. Every tide we keep is a galley." She raises your pay.`,
              fx: {coin:12,favor:2},
            },
            lose: {r:"She smiles. The next week you are copying fish dues in Beaconstone.",fx:{happy:-4,coin:-3}},
          },
        ],
      },
      {
        id: "ww_gh_stone",
        title: "A stone in the harbor",
        cond: (p,C)=>R(p,"POL-14")&&C.adult(p)&&C.coast(p),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{ctx.dname=A.givenName(p.cult,A.chance(.7)?"M":"F")},
        text: "{dname}, who grew up three doors down, went over the side in a squall off Beaconstone and was never found. In Greyhaven drowned sailors are mourned with a stone thrown into the harbor, because there is nobody to bury. The family has asked you to choose the stone.",
        choices: [
          {
            t: "Choose a stone from the beach where you played",
            r: "A round grey stone with a white band. You throw it far out, and the whole street watches it go.",
            fx: {wil:1.5,happy:-4,piety:1},
          },
          {
            t: "Dive to set the stone on the harbor floor",
            check: {s:"sta",s2:"sea",d:44},
            win: {
              r: "You carry it down in your arms and lay it on the mud among a thousand others. Coming up, you feel lighter.",
              fx: {wil:1,sta:.5,honor:2},
            },
            lose: {
              r: "You drop it halfway and come up gasping. It finds its own place, as stones do.",
              fx: {wil:1,health:-2},
            },
          },
          {
            t: "Get drunk in the Tapper's House instead",
            r: "Sailors understand. Hawise Tapper puts you to bed under the bar.",
            fx: {happy:-2,health:-2,wil:.5},
          },
        ],
      },
      {
        id: "ww_gh_shipoak",
        title: "Wrendale oak",
        cond: (p,C)=>R(p,"POL-14")&&grown(p,C)&&C.terr(p,"forest","hills")&&!is(p,"noble","royal"),
        w: 1,
        cool: 7,
        text: "Ship oak from the Wrendale forests goes to every fleet in the north, and to Aldmark since the elves refused it in 1080. Lady Elinor Wren's foresters are felling a great oak for a galley keel, and they need men on the ropes when it falls.",
        choices: [
          {
            t: "Work the ropes",
            check: {s:"str",s2:"ins",d:38},
            win: {
              r: "It falls where the forester said it would, with a sound like the world ending. Two tides and a new respect for trees.",
              fx: {coin:2,str:.5},
            },
            lose: {
              r: "A branch whips back and lays your arm open.",
              fx: {wound:"deep_cut",health:-10,coin:1,cause:"a falling oak"},
            },
          },
          {
            t: "Ask the shipwright's man to take you on",
            check: {s:"craft",s2:"int",d:40},
            win: {
              r: "He watches you square a beam with an adze and nods. You leave for the Brookhurst yards next week.",
              fx: {job:"carpenter",skill:{craft:3}},
            },
            lose: {r:'"Come back when you can tell oak from ash," he says.',fx:{skill:{craft:1}}},
          },
          {
            t: "Gather the bark for the tanners",
            r: "Oak bark sells by the cart to the tanneries. Slow money, safe money.",
            fx: {coin:1},
          },
        ],
      },
      {
        id: "ww_gh_marry",
        title: "A ship-owner's match",
        cond: (p,C)=>R(p,"POL-14")&&unwed(p,C)&&is(p,"merchant","gentry","noble"),
        w: 1,
        cool: 8,
        text: p=>`In Greyhaven ship-owners marry into noble houses freely, and nobody sneers. ${is(p,"merchant")?"A poor knightly house of the Redley Plain has offered you a son or daughter, an old name for your new money.":"A Brookhurst ship-owner with nine cogs has offered a child in marriage: new money for your old name."} The match would make both families stronger. Love is not mentioned.`,
        choices: [
          {
            t: "Agree to the match",
            r: "Iron ring, Sea King's hall, a feast on the Terraces. You find you like your spouse more than you expected.",
            fx: {lover:!0,coin:20,happy:3},
          },
          {
            t: "Meet them first, alone",
            check: {s:"etiquette",s2:"persuasion",d:36},
            win: {
              r: "An awkward walk on the harbor wall becomes an easy one. By the end you are laughing at your parents together.",
              fx: {lover:!0,happy:6,skill:{etiquette:1}},
            },
            lose: {
              r: "You discover you cannot stand each other within an hour. The families are furious.",
              fx: {happy:-3},
            },
          },
          {t:"Refuse",r:"Your family sighs. There will be other cogs, and other names.",fx:{happy:1}},
        ],
      },
      {
        id: "ww_gh_deafdiver",
        title: "An old diver",
        cond: (p,C)=>R(p,"POL-14")&&C.old(p)&&C.coast(p),
        w: 1,
        cool: 8,
        text: "You dived for the harbor ring as a youngster and cut ship ropes underwater for twenty years. Now your ears are full of the sea's silence, like the king's, and your grandchildren talk to you in divers' hand-signs. One of them wants to try for the Diving School.",
        choices: [
          {
            t: "Teach her to hold her breath properly",
            r: `Breathe slow, empty out, fill up, go down calm. "Count to ten" is a children's rhyme. You teach her to count to a hundred.`,
            fx: {happy:5,skill:{sea:1}},
          },
          {
            t: "Tell her what it costs",
            r: "You sign it slowly: the deafness, the headaches, the friends who did not come up. She listens with her whole face. She tries anyway. Of course she does.",
            fx: {wil:1,happy:2},
          },
        ],
      },
      {
        id: "ww_gh_quake",
        title: "The ground moves",
        cond: (p,C)=>R(p,"POL-14")&&C.ageAdj(p)>=8&&C.coast(p),
        w: .8,
        cool: 12,
        text: "The ground heaves at night. Greyhaven's harbor towns are built low against earthquakes, but the old warehouse on the quay has come down, and someone is shouting under the beams.",
        choices: [
          {
            t: "Dig with your hands",
            check: {s:"str",s2:"wil",d:36},
            win: {
              r: "You and two fishermen lift a beam enough to drag out a rope-maker's boy, whole and howling.",
              fx: {honor:4,fame:2,str:.4},
            },
            lose: {
              r: "An aftershock brings down more of the wall. You get out with a broken hand; the boy does not.",
              fx: {wound:"lost_fingers",health:-10,wil:2,happy:-5,cause:"a collapsing warehouse"},
            },
          },
          {
            t: "Run for the reeve and a lever",
            r: "The reeve brings men and a ship's spar. It takes an hour, and the boy lives.",
            fx: {honor:2},
          },
          {
            t: "Get your own family up the hill",
            r: "There may be a wave. Your family sits on the hill until dawn. The wave never comes.",
            fx: {wil:.5},
          },
        ],
      },
      {
        id: "ww_mh_miracleday",
        title: "Miracle Day",
        cond: (p,C)=>R(p,"POL-15")&&C.ageAdj(p)>=8,
        w: 1,
        cool: 5,
        text: `Miracle Day, 2 October. The procession winds down from the Sun Temple singing: "The Hawk came down with a thousand wings, the walls were thin and the wells ran dry; our king knelt down and the noon sun rose, and the Hawk lay down to die." Beside you an old miner mutters that it wasn't the sun, it was dead cattle in the stream.`,
        choices: [
          {
            t: "Sing louder and ignore him",
            r: "Your voice joins a thousand others. Whatever happened in 897, the walls held.",
            fx: {piety:2,happy:2},
          },
          {
            t: "Ask the old man what he means",
            check: {s:"persuasion",s2:"int",d:40},
            win: {
              r: `"My great-grandfather's grandfather was paid to carry carrion," he says. "It's in the chancery roll, if anyone looked." He spits and sings the next verse anyway.`,
              fx: {int:.5,flag:"ww_mh_carrion",piety:-1},
            },
            lose: {r:"He looks at you as if you were a Temple spy and shuffles away.",fx:{}},
          },
          {
            t: "Report him to a priest",
            r: "A dawnkeeper takes his name. The old man pays a fine to the Temple court, and the Temple courts favor the Temple.",
            fx: {piety:2,honor:-3},
          },
        ],
      },
      {
        id: "ww_mh_minelanes",
        title: "The listening galleries",
        cond: (p,C)=>R(p,"POL-15")&&grown(p,C)&&(low(p)||C.job(p,"miner","labor")),
        w: 1,
        cool: 7,
        text: "Under the Deep Walls of Morhaven run counter-mine galleries, twelve meters below the ditch. The miners who keep them were the ones who broke the Khan's tunnels in 895, and they still listen with a cup of water on the floor. Today the water in your cup is trembling.",
        choices: [
          {
            t: "Listen and follow the sound",
            check: {s:"ins",s2:"craft",d:42},
            win: {
              r: "It is not an enemy. It is a smuggler's tunnel from a cellar outside the walls. The Chancellor's men are very interested, and very generous.",
              fx: {coin:8,favor:2,skill:{siegecraft:2}},
            },
            lose: {
              r: "You follow it into an old gallery and the roof gives. They dig you out in the evening.",
              fx: {health:-10,wil:1,cause:"a gallery collapse"},
            },
          },
          {
            t: "Report it to the mine-master and let him decide",
            r: "Master Otto Deepgrave goes down himself with a lamp and a cup. He says nothing to you afterward, but your pay goes up.",
            fx: {coin:3,job:"miner"},
          },
          {
            t: "Say nothing. It's not your gallery",
            r: "The trembling stops after a week. Somebody, somewhere, finished something.",
            fx: {},
          },
        ],
      },
      {
        id: "ww_mh_lanternlads",
        title: "The Lantern Lads",
        cond: (p,C)=>R(p,"POL-15")&&grown(p,C)&&C.coast(p)&&!is(p,"noble","royal"),
        w: .9,
        cool: 9,
        text: `The Lantern Lads of the Harbor Town unload "lamp oil" by night for a share and keep their mouths shut. The jars are heavy, sealed and smell of pitch. One of them asks if you want a night's work. "Bound for the Neck," he says. "Don't drop one. Ever."`,
        choices: [
          {
            t: "Carry jars all night",
            check: {s:"str",s2:"ins",d:40},
            win: {
              r: "Thirty jars, each one handled like a newborn. Five Morhaven suns, and a nod from the harbor clerk who signs the false bills.",
              fx: {coin:5,honor:-1,flag:"ww_mh_oil"},
            },
            lose: {
              r: "A jar slips and cracks on the quay. Everyone goes very still. The oil does not catch, but you are paid nothing and never asked again.",
              fx: {happy:-3,wil:1},
            },
          },
          {
            t: "Ask where the oil really goes",
            check: {s:"intrigue",s2:"persuasion",d:46},
            win: {
              r: "A Lad who drinks too much says it: the Khan's fire-oil, through Felano under false bills, to Queen Livia. And the king takes a cut.",
              fx: {skill:{intrigue:2},flag:"ww_mh_oil",int:.3},
            },
            lose: {
              r: "Questions are not what the Lads are paid for. You find your boat holed the next morning.",
              fx: {coin:-5,happy:-3},
            },
          },
          {t:"Say no",r:'He shrugs. "Lamp oil," he says, and grins.',fx:{}},
        ],
      },
      {
        id: "ww_mh_horsethief",
        title: "A cheap horse",
        cond: (p,C)=>R(p,"POL-15")&&C.adult(p),
        w: 1,
        cool: 7,
        text: "At the Horse Gate a man offers you a fine steppe mare for 20 suns, a third of her worth. Her brand has been burned over with a hot iron. Horse thieves hang at the city gate in Morhaven, and the last three are still there.",
        choices: [
          {
            t: "Buy her and ask nothing",
            req: p=>p.coin>=20,
            check: {s:"intrigue",s2:"riding",d:46},
            win: {
              r: "Nobody ever claims her. She is the best horse you will ever own.",
              fx: {coin:-20,gear:{mount:"horse"},honor:-2},
            },
            lose: {
              r: "A Santora horse-lord recognizes her at the next fair. You lose the mare, and come very close to the gate.",
              fx: {coin:-20,honor:-5,punish:"theft"},
            },
          },
          {
            t: "Call the gate guard",
            r: "The man runs, leaving the mare. The guard returns her to a weeping Santora rider who gives you 5 suns and a hug that smells of horse.",
            fx: {coin:5,honor:3},
          },
          {t:"Walk away",r:"Next week there is a fourth man hanging at the gate.",fx:{}},
        ],
      },
      {
        id: "ww_mh_fareyes",
        title: "The Tower of Far Eyes",
        cond: (p,C)=>R(p,"POL-15")&&(C.teen(p)||grown(p,C))&&C.ageAdj(p)<=24,
        w: 1,
        once: !0,
        text: "The Tower of Far Eyes in Morhaven trains lookouts and signalers for the towers every 10 km along coast and steppe. Dame Serena Falcone, who can read a banner at three kilometers, holds up flags on the far wall and asks recruits to read the signal. Every lookout swears to go blind rather than lie.",
        choices: [
          {
            t: "Read the signal",
            check: {s:"int",s2:"ins",d:30},
            win: {
              r: '"Riders, east, many, at dusk." Dame Serena nods. You will spend years in a tower with a horn and a flag, and you will see everything first.',
              fx: {skill:{tactics:2,learning:1},int:.5,job:"mercenary",flag:"ww_mh_lookout"},
            },
            lose: {r:'You read "fire" for "fleet". She is kind about it. Not kind enough to take you.',fx:{happy:-2}},
          },
          {
            t: "Ask about the oath before you try",
            r: '"A false alarm costs an eye," she says. "A missed alarm costs a city." You decide to try for something else.',
            fx: {int:.2},
          },
        ],
      },
      {
        id: "ww_mh_maresmilk",
        title: "Blue cloth on the cairn",
        cond: (p,C)=>R(p,"POL-15")&&C.adult(p),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{pid(p,ctx,"acquaint")},
        text: "At Santora, where the Horse Road ends, a Wind Rider dealer named {them} offers you a bowl of fermented mare's milk and invites you to tie a strip of blue cloth to the hill cairn with {themHim}, the steppe way. Horse traders here do both: the Temple on Sunday, the cairn on the road.",
        choices: [
          {
            t: "Drink and tie the cloth",
            check: {s:"diplomacy",s2:"sta",d:30},
            win: {
              r: "The milk is sour and fizzy and strong. You keep it down, and {them} roars and slaps your back. You have a friend on the Horse Road.",
              fx: {them:{type:"friend",op:35},lang:"Wind Rider",skill:{diplomacy:2}},
            },
            lose: {
              r: "The milk comes straight back up. {them} laughs until {theyHe} cries, but kindly.",
              fx: {them:{type:"friend",op:15},health:-2},
            },
          },
          {
            t: "Drink, but leave the cairn to the steppe folk",
            r: '{them} shrugs. "Your sun, my sky." You trade a good knife for a felt cap.',
            fx: {them:{type:"acquaint",op:10}},
          },
          {
            t: "Refuse both politely",
            r: "A Luminary's clerk nods approvingly from across the square. {them} does not.",
            fx: {piety:1,them:{type:"acquaint",op:-10}},
          },
        ],
      },
      {
        id: "ww_mh_templedebt",
        title: "The Temple court",
        cond: (p,C)=>R(p,"POL-15")&&C.adult(p)&&(C.poor(p)||p.coin<20),
        w: 1,
        cool: 8,
        text: "In Morhaven debt goes to the Temple courts, and the Temple courts favor the Temple. You owe a Temple farm-steward 25 suns for seed and a plough-ox, and his case is heard on Thursday by a dawnkeeper who is his cousin.",
        choices: [
          {
            t: "Argue your case from the Book of Ash",
            check: {s:"faith",s2:"persuasion",d:48},
            win: {
              r: "You quote the passage on the sun shining on the debtor and the creditor alike. The dawnkeeper, embarrassed, gives you two years.",
              fx: {skill:{faith:2,persuasion:2}},
            },
            lose: {r:"The cousin rules for the cousin. Your ox goes to the Temple farm.",fx:{coin:-10,happy:-5,wil:1}},
          },
          {
            t: "Pay a gift to the Temple first",
            req: p=>p.coin>=6,
            r: 'Six suns "for the noon candles". The hearing goes remarkably well.',
            fx: {coin:-6,honor:-1},
          },
          {
            t: "Work it off on the Temple farm",
            r: "A season of digging the Temple's vines. The steward is not cruel, only exact.",
            fx: {sta:.5,wil:1,health:-3},
          },
        ],
      },
      {
        id: "ww_mh_santorariders",
        title: "The Santora Riders",
        cond: (p,C)=>R(p,"POL-15")&&grown(p,C)&&(C.prof(p,"riding",30)||C.prof(p,"bow",30)||C.race(p,"halforc")),
        w: 1,
        cool: 8,
        text: `Dame Oriana Sabine's Santora Riders are 3,000 light horse archers of the steppe edge, many of mixed blood, and they serve for pay. A sergeant has a straw target on a post and a horse ready. "Ride past at a gallop. Three arrows. Two in the straw, and you eat with us."`,
        choices: [
          {
            t: "Gallop and shoot",
            check: {s:"mounted",s2:"bow",d:46},
            win: {
              r: "Three arrows, three hits, and you nearly lose your seat on the turn showing off. The sergeant spits and writes your name.",
              fx: {skill:{mounted:3,bow:2,riding:1},job:"mercenary",coin:4},
            },
            lose: {
              r: "One arrow in the straw, one in the post, one in a goat. The goat's owner wants paying.",
              fx: {coin:-3,skill:{mounted:1,bow:1}},
            },
          },
          {
            t: "Ask to ride as a scout, not an archer",
            check: {s:"riding",s2:"tracking",d:40},
            win: {
              r: "They test you on the steppe for a day and night. You find their hidden riders twice. Scout's pay is less, and the work is better.",
              fx: {skill:{riding:2,tracking:2},job:"mercenary"},
            },
            lose: {r:"You get lost on the steppe and they have to come and find you.",fx:{happy:-3}},
          },
          {
            t: "Just watch them ride",
            r: "They shoot backward over their horses' tails at a gallop. You have never seen anything like it.",
            fx: {happy:2},
          },
        ],
      },
      {
        id: "ww_mh_felano",
        title: "Felano wants a charter",
        cond: (p,C)=>R(p,"POL-15")&&C.adult(p)&&is(p,"artisan","merchant"),
        w: 1,
        cool: 10,
        text: "Felano is the largest city and busiest port in Morhaven, richer than the capital, and it knows it. Mistress Adela Corso's Felano Merchants are collecting marks for a petition to the king: a charter of self-rule and a merchant seat on the Crown Council. Every shop on your street has signed.",
        choices: [
          {
            t: "Sign the petition",
            r: "Your mark goes beside the others. If the king says yes, Felano rules itself. If he says no, he knows your name.",
            fx: {favor:-2,honor:2,flag:"ww_mh_felano"},
          },
          {
            t: "Carry the petition to other streets",
            check: {s:"persuasion",s2:"trade",d:40},
            win: {
              r: "Two hundred more marks from the fish quay alone. Mistress Corso remembers people who are useful.",
              fx: {skill:{persuasion:2},fame:1,favor:-2,coin:3},
            },
            lose: {
              r: "A royal sergeant takes your list off you on the third street and tears it up.",
              fx: {happy:-3,favor:-1},
            },
          },
          {
            t: "Refuse. The king has long eyes",
            r: "Literally. Falcones can read a banner at three kilometers. Your neighbors call you a Heights man.",
            fx: {favor:1,happy:-1},
          },
        ],
      },
      {
        id: "ww_mh_horsedowry",
        title: "A dowry on four legs",
        cond: (p,C)=>R(p,"POL-15")&&C.female(p)&&(C.teen(p)||unwed(p,C)),
        w: 1,
        cool: 10,
        text: "In Morhaven sons inherit land and daughters get dowries in horses. Your father has bought your dowry mare at the Santora fair: a grey steppe mare with a white blaze, wild as the wind. She will be yours when you marry, and your husband's after.",
        choices: [
          {
            t: "Break her to ride yourself",
            check: {s:"riding",s2:"husbandry",d:34},
            win: {
              r: "By midsummer she comes to your whistle and no one else's. Whoever marries you will have to deal with both of you.",
              fx: {skill:{riding:3,husbandry:2},gear:{mount:"horse"},happy:5},
            },
            lose: {
              r: "She throws you into a hedge, twice. Your brothers break her instead, badly.",
              fx: {health:-4,happy:-3},
            },
          },
          {
            t: "Ask your father to put the mare in your own name",
            check: {s:"persuasion",s2:"wil",d:46},
            win: {
              r: "He grumbles about the Pertena Judgment and does it anyway. You may be the only woman in the street who owns a horse outright.",
              fx: {wil:1,coin:10,trait:"stubborn"},
            },
            lose: {r:'"That is not how it is done." It is not how it is done.',fx:{happy:-3,wil:.5}},
          },
        ],
      },
      {
        id: "ww_mh_leontines",
        title: "Coins of the corsair dead",
        cond: (p,C)=>R(p,"POL-15")&&C.old(p),
        w: 1,
        cool: 10,
        text: "In the harbor temple hang the debased Leontines found on the corsair dead of 1011, black with age. Your grandmother told you about the sack when you were small, as hers told her. Today your grandchildren want the story, and they want to know why a pirate would carry Tessarian coin.",
        choices: [
          {
            t: "Tell it as your grandmother told it",
            r: "Aurelio the Far-Eyed seeing the sails at thirty kilometers, the bells, the fight on the field below the walls. The children have nightmares and love you for it.",
            fx: {happy:4,fame:1},
          },
          {
            t: "Tell them your own guess about the coins",
            check: {s:"intrigue",s2:"learning",d:40},
            win: {
              r: '"Somebody paid them," you say. "Somebody in Tessar." The oldest grandchild goes quiet, then asks very sharp questions. That one will go far.',
              fx: {int:.4,skill:{intrigue:1},happy:3},
            },
            lose: {
              r: "You lose the thread and start talking about horse prices. The children wander off.",
              fx: {happy:-1},
            },
          },
        ],
      },
      {
        id: "ww_mh_nagoth",
        title: "Orcs at the Horse Gate",
        cond: (p,C)=>R(p,"POL-15")&&C.adult(p)&&(is(p,"merchant","artisan")||C.prof(p,"trade",25)),
        w: 1,
        cool: 7,
        text: "Morhaven sells oil, wine and grain to the Nagoth clans of the Horde, and three Nagoth orcs with copper-capped tusks are at the Horse Gate today with felt and hides to trade. Most of the market is pretending not to see them. Orcs are feared here. Their silver is as good as anyone's.",
        choices: [
          {
            t: "Trade with them fairly",
            check: {s:"trade",s2:"diplomacy",d:40},
            win: {
              r: "Wine for felt, oil for hides, and a long silence while they decide whether to trust you. They do. They will come to your stall first next year.",
              fx: {coin:12,skill:{trade:2,diplomacy:1},newRel:{type:"friend",op:20}},
            },
            lose: {
              r: "You misread a gesture and they leave insulted. Nobody else sells to them that day either.",
              fx: {happy:-2},
            },
          },
          {
            t: "Cheat them on the weight",
            check: {s:"deception",s2:"trade",d:50},
            win: {
              r: "They do not notice. You make 20 suns. Somewhere on the steppe, you suspect, they will notice.",
              fx: {coin:20,honor:-4},
            },
            lose: {
              r: "The oldest orc puts his thumb on your scale and looks at you. You give them double weight and your apologies.",
              fx: {coin:-6,honor:-3,happy:-3},
            },
          },
          {
            t: "Keep your stall shut until they leave",
            r: "You lose a morning's trade to fear. So does half the market.",
            fx: {coin:-2},
          },
        ],
      },
      {
        id: "ww_mh_castina",
        title: "Castina iron",
        cond: (p,C)=>R(p,"POL-15")&&grown(p,C)&&C.terr(p,"hills","forest")&&!is(p,"noble","royal"),
        w: 1,
        cool: 7,
        text: "In the Castina hills, House Castor owns the iron workings and the beech forests that feed the smelters. A bloom-smith needs a striker for the season: twelve hours a day swinging a sledge on glowing iron while he turns it with tongs.",
        choices: [
          {
            t: "Take the sledge",
            check: {s:"str",s2:"sta",d:40},
            win: {
              r: "By autumn you can strike in rhythm without thinking, and the smith lets you shape a knife of your own.",
              fx: {coin:8,str:.8,skill:{craft:2},job:"smith"},
            },
            lose: {r:"A spark takes you in the face on the second week.",fx:{wound:"burn",health:-8,coin:3}},
          },
          {
            t: "Burn charcoal in the beech woods instead",
            r: "Quiet work, smoky work. You come home black to the elbows with 5 suns.",
            fx: {coin:5,skill:{survival:1}},
          },
        ],
      },
      {
        id: "ww_os_murex",
        title: "Purple hands",
        cond: (p,C)=>R(p,"POL-16")&&(kid(p,C)||C.teen(p))&&!is(p,"noble","royal","gentry"),
        w: 1,
        cool: 5,
        text: "On the Murex Shore around Felena the children gather murex shells for the dye vats: ten thousand shells for a scrap of purple, and the vats stink like a battlefield. The dyers are nicknamed Purplehand, because their hands stay purple for life. The vat-master is short of children this week.",
        choices: [
          {
            t: "Gather shells on the rocks",
            check: {s:"sta",s2:"spd",d:18},
            win: {
              r: "Two full baskets before the tide turns. The vat-master pays a copper penny and pats your head with a purple hand.",
              fx: {family:1,sta:.4},
            },
            lose: {r:"You slip on the weed and cut your foot on a shell.",fx:{health:-3}},
          },
          {
            t: "Watch how the dyers work the vats",
            r: "Crush, salt, steep, heat, and the color comes from green to red to purple like a sunset. You never forget the smell.",
            fx: {skill:{craft:2},int:.3},
          },
          {
            t: "Hold your nose and run away",
            r: "The smell follows you home anyway. It always does in Felena.",
            fx: {happy:1},
          },
        ],
      },
      {
        id: "ww_os_bill",
        title: "A bill of exchange",
        cond: (p,C)=>R(p,"POL-16")&&C.adult(p)&&(is(p,"merchant","gentry")||C.prof(p,"trade",30)),
        w: 1,
        cool: 7,
        text: "A factor from the Free Marches offers you a bill of exchange drawn on a Lucernan house for 60 suns, at a good discount. Ostran bills are honored in every port of the Middle Sea. But the hand looks a little too careful, and everyone knows the forger Lazzaro Fenn cuts dies in the city. Forging bills hangs.",
        choices: [
          {
            t: "Study the bill under a lamp",
            check: {s:"trade",s2:"learning",d:46},
            win: {
              r: "The house seal is right, but the clerk's mark is a year out of date. You hand it back with a smile. He leaves the Broken Bench very fast.",
              fx: {skill:{trade:2,learning:1},int:.4},
            },
            lose: {r:"It looks perfect. It is not. Lucerna refuses it six weeks later.",fx:{coin:-45,happy:-6,wil:1}},
          },
          {
            t: "Buy it and pass it on quickly",
            check: {s:"deception",s2:"trade",d:44},
            win: {
              r: "You sell it on to a wine-buyer within the hour at a small profit. Somebody downstream will hang, or pay.",
              fx: {coin:8,honor:-4},
            },
            lose: {
              r: "The wine-buyer's clerk knows Fenn's work. The Exchange Guard wants to talk to you.",
              fx: {honor:-6,punish:"theft"},
            },
          },
          {
            t: "Turn the factor over to the Exchange Guard",
            r: "He is taken at the door. The bank whose seal he forged sends you a cask of Isle wine.",
            fx: {honor:3,coin:4,favor:1},
          },
        ],
      },
      {
        id: "ww_os_buckler",
        title: "Buckler Hall",
        cond: (p,C)=>R(p,"POL-16")&&grown(p,C),
        w: 1,
        cool: 6,
        text: `At Buckler Hall, Master Rico Ambro teaches sword and buckler to merchants and guards: fighting in streets and on stairs, where Ostra's money actually gets robbed. Today's lesson is on the hall's practice stair. "Uphill, you die," he says. "Downhill, you also die, but slower."`,
        choices: [
          {
            t: "Fight your way up the stair",
            check: {s:"sword",s2:"shield",d:44},
            win: {
              r: 'Buckler high, short cuts low, one step at a time. You reach the top. Ambro tosses you a battered buckler. "Keep it."',
              fx: {skill:{sword:3,shield:2},gear:{shield:"buckler"}},
            },
            lose: {
              r: "You fall backward down six steps and land on a merchant's son.",
              fx: {skill:{sword:1,shield:1},health:-5},
            },
          },
          {
            t: "Learn the dirty tricks for alleys",
            check: {s:"dagger",s2:"ins",d:40},
            win: {
              r: 'Cloak in the face, buckler rim to the jaw, knee to the knee. Ambro grins: "Bankers pay for this lesson more than any other."',
              fx: {skill:{dagger:2,unarmed:1},ins:.4},
            },
            lose: {r:"You learn mostly how it feels to be on the receiving end.",fx:{health:-4,skill:{dagger:1}}},
          },
          {
            t: "Pay and watch from the bench",
            r: "You learn a lot from watching. Your purse learns more.",
            fx: {coin:-1,skill:{sword:1}},
          },
        ],
      },
      {
        id: "ww_os_purple",
        title: "A purple cloak",
        cond: (p,C)=>R(p,"POL-16")&&C.adult(p)&&!is(p,"noble","royal"),
        w: .8,
        cool: 12,
        text: "A dyer friend gives you a cloak of murex purple, a spoiled piece with a streak in it that the guild could not sell. In Ostra purple is allowed only for the Twelve and Temple envoys; everyone else wears blue, brown and green. It is the most beautiful thing you have ever owned.",
        choices: [
          {
            t: "Wear it to the Purple Fair",
            check: {s:"deception",s2:"etiquette",d:46},
            win: {
              r: "People make way for you all day, assuming you are somebody. A Twelve house's steward bows to you. You go home dizzy.",
              fx: {happy:6,fame:1,skill:{deception:1}},
            },
            lose: {
              r: "A city sergeant stops you before noon. The fine is twice the cloak's worth, and the cloak goes to the Temple.",
              fx: {coin:-15,happy:-5,honor:-2},
            },
          },
          {
            t: "Sell it quietly to a Sabena tailor",
            r: "He cuts it into collars for the Twelve's servants. You get 12 suns.",
            fx: {coin:12},
          },
          {t:"Wear it at home, by the fire, alone",r:"Nobody sees. You see. It is enough.",fx:{happy:3}},
        ],
      },
      {
        id: "ww_os_debtor",
        title: "A name read in church",
        cond: (p,C)=>R(p,"POL-16")&&C.adult(p),
        w: .8,
        cool: 12,
        setup: (p,ctx)=>{pid(p,ctx,"friend")},
        text: "On New Year's Day, the great reckoning, the priest reads the names of fled debtors in every church in Ostra. One of them is {them}, who ran for the Free Marches owing House Pell 200 suns. A debtor's children may not borrow in the city for twenty years. A Debt-Hound has been asking where {theyHe} went.",
        choices: [
          {
            t: "Tell the Debt-Hound nothing",
            check: {s:"deception",s2:"wil",d:42},
            win: {
              r: "He watches your face a long time and leaves. {them} sends a letter from Madara in spring with no return mark.",
              fx: {honor:2,them:{type:"friend",op:20},skill:{deception:1}},
            },
            lose: {
              r: "He reads you like a ledger, and finds {them} within the month. A black cap never forgets a penny.",
              fx: {happy:-5,wil:1,them:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Sell {themHim} out for the reward",
            r: "Ten suns. The Debt-Hound brings {them} back in chains to the Debtors' Tower.",
            fx: {coin:10,honor:-8,them:{type:"enemy",op:-60}},
          },
          {
            t: "Help the family pay something toward the debt",
            req: p=>p.coin>=20,
            r: "Twenty suns toward 200 does not clear the name, but House Pell agrees to stop the hunt. The children can look up in church again.",
            fx: {coin:-20,honor:4,piety:2,them:{type:"bestfriend",op:30}},
          },
        ],
      },
      {
        id: "ww_os_bench",
        title: "A broken bench",
        cond: (p,C)=>R(p,"POL-16")&&C.adult(p)&&(is(p,"merchant","gentry","artisan")||p.coin>=50),
        w: .8,
        cool: 15,
        text: "A small banking house has failed, and its bench is broken in the Exchange square in front of a jeering crowd, as Carrano's was in 1083. Some of your savings were on deposit there. The banker's clerks are carrying ledgers out of the back door.",
        choices: [
          {
            t: "Push through and claim your deposit now",
            check: {s:"intimidation",s2:"str",d:46},
            win: {
              r: "You grab the clerk who owes you and do not let go until he counts out half your money. Half is more than anyone else gets.",
              fx: {coinPct:-.1,skill:{intimidation:2}},
            },
            lose: {
              r: "The Exchange Guard drives the crowd back with staves. You get a bruise and nothing else.",
              fx: {coinPct:-.2,health:-4},
            },
          },
          {
            t: "Follow the clerks with the ledgers",
            check: {s:"stealth",s2:"intrigue",d:48},
            win: {
              r: "The ledgers go to a cellar under the Purple Hand. A word to the creditors' lawyer and your claim is first in line.",
              fx: {coinPct:-.05,skill:{intrigue:2,stealth:1}},
            },
            lose: {r:"You lose them in the Dyers' Quarter, and your money with them.",fx:{coinPct:-.2}},
          },
          {
            t: "Write it off and learn the lesson",
            r: "Bite the coin, not the banker. You keep your money in a pot under the floor from now on.",
            fx: {coinPct:-.2,wil:1,int:.3},
          },
        ],
      },
      {
        id: "ww_os_vines",
        title: "Harvest Home on the Isle of Vines",
        cond: (p,C)=>R(p,"POL-16")&&(C.teen(p)||grown(p,C)),
        w: 1,
        cool: 5,
        text: "Harvest Home on the Isle of Vines, Lord Enzo Sarto's wine island. Everyone who can stand treads grapes in the great vats at Calente, and everyone who cannot stand anymore is carried to the shade. The tread-masters want strong legs.",
        choices: [
          {
            t: "Tread the vats until sundown",
            check: {s:"sta",s2:"wil",d:30},
            win: {
              r: "Purple to the thighs, singing the old treading songs, you last until the last vat. Sarto's steward gives you a bottle from last year's press.",
              fx: {coin:2,sta:.5,happy:5},
            },
            lose: {
              r: "You slip and go under. The vat crew fishes you out laughing. You smell of must for a week.",
              fx: {happy:2,health:-1},
            },
          },
          {
            t: "Dance with whoever is next to you in the vat",
            req: (p,C)=>C.adult(p)&&!C.married(p),
            r: "Treading turns into dancing turns into a walk among the vines at dusk.",
            fx: {lover:!0,happy:6},
          },
          {
            t: "Bargain for a cask to sell in the city",
            req: p=>p.coin>=10,
            check: {s:"trade",s2:"persuasion",d:38},
            win: {r:"You sell it in Ostra for twice what you paid.",fx:{coin:10,skill:{trade:2}}},
            lose: {r:"The cask leaks in the boat. You arrive with a damp hold and an empty barrel.",fx:{coin:-10}},
          },
        ],
      },
      {
        id: "ww_os_militia",
        title: "Militia day",
        cond: (p,C)=>R(p,"POL-16")&&grown(p,C)&&C.male(p)&&free(p)&&!C.soldier(p),
        w: 1,
        cool: 4,
        text: "Ostra hires its soldiers, but citizens still drill in the town militias once a month, crossbows on the Sea Walls. The captain is a Greycloak veteran who thinks Ostran shopkeepers are a joke, and says so.",
        choices: [
          {
            t: "Shoot to wipe the smile off his face",
            check: {s:"xbow",s2:"int",d:40},
            win: {
              r: 'Five bolts, five hits on the wall target. The Greycloak grunts. "Hire the cloak, not the crown," he says. "You might be a cloak."',
              fx: {skill:{xbow:3},honor:1},
            },
            lose: {
              r: "Your bolt skips off the parapet into the harbor. The Greycloak does not even sigh.",
              fx: {skill:{xbow:1},happy:-2},
            },
          },
          {
            t: "Organize your street's men into a proper squad",
            check: {s:"command",s2:"persuasion",d:40},
            win: {
              r: "By evening your shopkeepers can load and shoot in two ranks. The captain asks your name.",
              fx: {skill:{command:3},fame:1},
            },
            lose: {r:"It turns into an argument about who is in charge. You lose.",fx:{happy:-2}},
          },
          {
            t: "Pay the fine and skip it",
            req: p=>p.coin>=2,
            r: "Two suns. Ostra understands paying instead of fighting better than anywhere.",
            fx: {coin:-2},
          },
        ],
      },
      {
        id: "ww_os_ledgerschool",
        title: "The Ledger School",
        cond: (p,C)=>R(p,"POL-16")&&kid(p,C),
        w: 1,
        cool: 5,
        text: "The counting schools of Ostra teach bookkeeping with zero, and the best children are tested for the Ledger School of House Lunetti. Lunetti children are tested for the family memory; everyone else just for sense. Today the examiner reads out twenty debts and asks you to say who owes what.",
        choices: [
          {
            t: "Repeat them all back",
            check: {s:"int",s2:"wil",d:24},
            win: {
              r: "All twenty, with sums. The examiner writes your name in a ledger, which in Ostra is the highest honor a child can get.",
              fx: {int:.8,skill:{learning:2,trade:2},flag:"ww_os_ledger"},
            },
            lose: {
              r: "You remember fourteen. The examiner says fourteen is respectable. It does not feel respectable.",
              fx: {int:.3,skill:{trade:1}},
            },
          },
          {
            t: "Ask why anyone owes anything at all",
            r: "The examiner stares at you, then laughs so hard he has to sit down. He gives you an almond cake.",
            fx: {happy:3,int:.2},
          },
        ],
      },
      {
        id: "ww_os_holdbank",
        title: "Dwarf crowns",
        cond: (p,C)=>R(p,"POL-16")&&C.adult(p)&&(is(p,"merchant","gentry")||C.prof(p,"trade",35)),
        w: 1,
        cool: 8,
        text: "At the Broken Bench a dwarf factor of the Hold Bank of Stonehold offers you a loan at 9 in 100, three less than any Ostran bank. Ostra and Stonehold are rivals; dwarf crowns undercut Ostran bills, and the Lunetti do not forgive people who borrow from the Hold. And the dwarves never forgive a debt at all.",
        choices: [
          {
            t: "Take the dwarf loan",
            r: "Fifty dwarf crowns in a leather bag, and a contract you must read three times. Your Ostran banker stops greeting you in the street.",
            fx: {coin:50,flag:"ww_os_holddebt",favor:-2},
          },
          {
            t: "Use the offer to squeeze your Ostran banker",
            check: {s:"trade",s2:"intrigue",d:46},
            win: {
              r: "You mention the dwarf, casually. Your banker drops his rate to 10 in 100 and buys the spiced wine.",
              fx: {coin:15,skill:{trade:2,intrigue:1}},
            },
            lose: {r:"Your banker smiles thinly and raises your rate for disloyalty.",fx:{coin:-8,happy:-3}},
          },
          {
            t: "Decline both",
            r: "Bite the coin, not the banker. You stay out of debt, which in Ostra makes you a curiosity.",
            fx: {int:.2},
          },
        ],
      },
      {
        id: "ww_os_northmen",
        title: "Questions in the Dyers' Quarter",
        cond: (p,C)=>R(p,"POL-16")&&C.adult(p)&&early(),
        w: .8,
        once: !0,
        text: "Two big fair-haired men from Northreach have been asking questions in the Dyers' Quarter, buying drinks at the Purple Hand. They want a cook: a man from the north, about fifty, who came to Ostra around 1090 and works quietly in somebody's kitchen. You think you know exactly who they mean.",
        choices: [
          {
            t: "Tell them where to find him",
            r: "They pay 20 suns in hacksilver and leave at once. You never see the cook again. Something terrible has started, far away.",
            fx: {coin:20,flag:"ww_os_cook",honor:-2},
          },
          {
            t: "Warn the cook first",
            check: {s:"stealth",s2:"persuasion",d:42},
            win: {
              r: `He goes grey, packs one bag and is gone by the evening tide. "You don't know what you saved," he says. "Or what you didn't."`,
              fx: {honor:1,wil:.5,flag:"ww_os_cookwarned"},
            },
            lose: {
              r: "The northmen are watching his door when you get there. They take him, and they look at you very hard.",
              fx: {happy:-4,wil:1},
            },
          },
          {
            t: "Know nothing",
            r: "You drink your wine and keep your mouth shut. In Ostra, that is often the most profitable thing.",
            fx: {},
          },
        ],
      },
      {
        id: "ww_os_will",
        title: "For loans not forgiven",
        cond: (p,C)=>R(p,"POL-16")&&C.old(p)&&(C.rich(p)||p.coin>=60),
        w: 1,
        once: !0,
        text: "Ostran bankers leave a gift to the Temple in their wills, to cover any sin of interest. You have charged interest all your life, as everyone here does, and the Temple courts fine anything over 12 in 100. Your lawyer is waiting with a blank line in your will and a pointed look.",
        choices: [
          {
            t: "Leave a fat gift to the Temple",
            req: p=>p.coin>=40,
            r: "Forty suns for loans not forgiven. The Luminary will say a mass for you every New Year's Day for a hundred years.",
            fx: {coin:-40,piety:6,honor:2},
          },
          {
            t: "Leave it to the Sabena poor instead",
            req: p=>p.coin>=40,
            r: "The dockers and dyers will drink to you in the Purple Hand. The Temple will not.",
            fx: {coin:-40,honor:5,fame:2,piety:-1},
          },
          {
            t: "Leave everything to the family, every penny",
            r: "Your lawyer writes it down without comment. Your children will be very grateful, and the Temple will remember.",
            fx: {happy:2},
          },
        ],
      },
      {
        id: "ww_os_changer",
        title: "A penny in fifty",
        cond: (p,C)=>R(p,"POL-16")&&(C.teen(p)||C.adult(p)),
        w: 1,
        cool: 6,
        text: 'Ostra takes a penny in fifty on every exchange of coin, and the money-changers on the Exchange steps take a little more. You have a fistful of mixed coin to change into Ostran suns: Varennan suns, an Aldmark mark, a bent Leontine. "Bite the coin, not the banker," your father used to say.',
        choices: [
          {
            t: "Bite every coin and argue every rate",
            check: {s:"trade",s2:"int",d:38},
            win: {
              r: "You catch the changer weighing the mark light and the Leontine heavy. He sighs and gives you a fair rate to make you go away.",
              fx: {coin:2,skill:{trade:2}},
            },
            lose: {r:"He talks faster than you think. You walk away poorer and unsure how.",fx:{coin:-1}},
          },
          {
            t: "Change it at a little shop away from the Exchange",
            r: "No tax, a worse rate, and nobody asks where the coins came from.",
            fx: {coin:-1,skill:{trade:1}},
          },
          {
            t: "Hand it over and trust him",
            r: "He is honest enough. In Ostra, the cheats work for the big banks.",
            fx: {},
          },
        ],
      },
      {
        id: "ww_vg_redcollar",
        title: "Red at the collar",
        cond: (p,C)=>R(p,"POL-25")&&kid(p,C),
        w: 1,
        cool: 6,
        text: "In Velgrad every good linen shirt is embroidered in red at the collar and cuffs against bad luck. Your mother sat up three nights stitching yours, and you have just torn the collar climbing the monastery fence after apples.",
        choices: [
          {
            t: "Sew it yourself before she sees",
            check: {s:"craft",s2:"int",d:18},
            win: {
              r: "Your stitches are crooked but red. She notices, says nothing, and smiles at supper.",
              fx: {skill:{craft:1},happy:2},
            },
            lose: {r:"You sew the collar to your own sleeve. Everyone laughs, especially your mother.",fx:{happy:1}},
          },
          {
            t: "Confess and ask her to teach you the pattern",
            r: 'She scolds you first, then teaches you. The pattern has a name: "the lamp in the window". You never forget it.',
            fx: {skill:{craft:2},happy:3},
          },
          {
            t: "Blame a monastery dog",
            check: {s:"deception",s2:"int",d:20},
            win: {
              r: "She believes you and goes to complain to the brothers. You feel awful all week.",
              fx: {skill:{deception:1},piety:-1},
            },
            lose: {r:'"The dog climbed the fence too, did it?"',fx:{happy:-2}},
          },
        ],
      },
      {
        id: "ww_vg_fourthday",
        title: "The fourth day",
        cond: (p,C)=>R(p,"POL-25")&&C.adult(p)&&is(p,"serf","peasant"),
        w: 1.1,
        cool: 6,
        text: `Bound tenants in Velgrad owe three days a week on the lord's land, but cannot be sold. At harvest the steward wants a fourth day "for the king's war money", and your own rye is standing ripe and the rain is coming.`,
        choices: [
          {
            t: "Refuse. Three days is the Code",
            check: {s:"learning",s2:"wil",d:44},
            win: {
              r: "You quote the Code of Radoslav, word for word, in front of the priest who sits with the lord's court. The steward backs down.",
              fx: {skill:{learning:1,persuasion:1},wil:1,honor:2},
            },
            lose: {
              r: "The lord's court finds some other law. You work the fourth day and lose a third of your rye to rain.",
              fx: {coin:-5,wil:1.5,happy:-5},
            },
          },
          {
            t: "Work the fourth day and your own field at night",
            check: {s:"sta",s2:"wil",d:40},
            win: {
              r: "You reap by moonlight for a week. The rye is in before the rain. You sleep for two days after.",
              fx: {sta:.8,wil:1.5,health:-4},
            },
            lose: {
              r: "You collapse in the furrow on the fifth night. The neighbors bring in your rye.",
              fx: {health:-10,wil:1.5,cause:"exhaustion"},
            },
          },
          {
            t: "Bribe the steward with a sable pelt",
            req: p=>p.coin>=3,
            r: "One sable, three suns of silver. The steward finds he can spare you after all.",
            fx: {coin:-3},
          },
        ],
      },
      {
        id: "ww_vg_pelts",
        title: "Graded and ungraded",
        cond: (p,C)=>R(p,"POL-25")&&grown(p,C)&&C.terr(p,"forest","tundra","hills"),
        w: 1,
        cool: 6,
        text: 'Back from a winter trapping in the North Woods with a bundle of sable and marten. In the north a sable pelt is money: one sable, three suns. At the Fur Staple in Velgrad the graders sort pelts into graded and ungraded, and the Marten Boys of the Lower Town sell stolen graded pelts back to trappers as "ungraded".',
        choices: [
          {
            t: "Sell at the Staple and watch the grader",
            check: {s:"trade",s2:"tracking",d:42},
            win: {
              r: 'You know every one of your pelts by its fur. When the grader tries to slip one into the wrong pile, you take it back. "Koliko za sobol?" he sighs, and pays fair.',
              fx: {coin:24,skill:{trade:2}},
            },
            lose: {r:'Half your best pelts end up "ungraded". You suspect where they go next.',fx:{coin:12,happy:-3}},
          },
          {
            t: "Sell to a Drevnan trader on the road",
            r: "Lower price, no tax, no graders. He pays in wax and silver.",
            fx: {coin:16},
          },
          {
            t: "Catch the Marten Boys at it",
            check: {s:"stealth",s2:"intimidation",d:48},
            win: {
              r: "You catch Ivo Shortcoat's boy with your marten pelt in his coat. The Staple master pays you a reward, and the boy is branded on the cheek.",
              fx: {coin:20,honor:2,fame:1},
            },
            lose: {
              r: "They catch you instead, in an alley behind the Rye Market.",
              fx: {coin:10,health:-8,cause:"a beating in the Lower Town"},
            },
          },
        ],
      },
      {
        id: "ww_vg_bearhall",
        title: "The Hall of the Bear",
        cond: (p,C)=>R(p,"POL-25")&&grown(p,C)&&C.male(p)&&(C.stat(p,"str")>=35||C.prof(p,"axe",30)||C.race(p,"halforc","orc","giant")),
        w: 1,
        cool: 7,
        text: 'The Bear Guard chooses the tallest men in the realm and arms them with long-hafted great-axes. At the Hall of the Bear, Ruslan Hardhand, who has taught the king since 1088, runs a trial for big men in mail. "The king is two hundred and ten centimeters," he says. "His guard should not look like children beside him."',
        choices: [
          {
            t: "Take the great-axe and stand the trial",
            check: {s:"axe",s2:"str",d:50},
            win: {
              r: 'An hour of cuts at the post in full mail. Hardhand walks round you twice and says, "You will do." The Bear Guard has a new man.',
              fx: {skill:{axe:4},str:.6,job:"mercenary",fame:2,favor:2},
            },
            lose: {
              r: 'Your arms give out before the hour. Hardhand is not unkind: "Eat more. Come back."',
              fx: {skill:{axe:2},str:.4},
            },
          },
          {
            t: "Ask Hardhand for a single lesson",
            req: p=>p.coin>=3,
            r: "Three suns for an hour with the best great-axe in the east. He fixes your grip in the first minute.",
            fx: {coin:-3,skill:{axe:3}},
          },
          {
            t: "Watch, and leave the axe to giants",
            r: "They swing those things like hay rakes. You are content to watch.",
            fx: {skill:{axe:1}},
          },
        ],
      },
      {
        id: "ww_vg_redcrown",
        title: "The Lamp's embers",
        cond: (p,C)=>R(p,"POL-25")&&(C.teen(p)||C.adult(p)),
        w: 1,
        cool: 7,
        text: "In August pilgrims camp below Redcrown to watch its glow at night, which the Dawn Church calls the Lamp's embers. House Belak takes a fee from every pilgrim on the road. Thousands of fires are lit on the slope, and the priests chant without instruments as the mountain glows red.",
        choices: [
          {
            t: "Keep the vigil all night",
            r: "Chant, glow, silence, chant. At dawn you feel scoured clean.",
            fx: {piety:4,wil:.5},
          },
          {
            t: "Climb closer than the pilgrims are allowed",
            check: {s:"athletics",s2:"survival",d:46},
            win: {
              r: "Up past the last fire to where the rock is warm under your hands and the air smells of sulfur. You see the glow up close: a crack of fire in the mountain. Not a lamp. Something older.",
              fx: {wil:1,skill:{survival:2},int:.4,piety:-1},
            },
            lose: {
              r: "The gas from a vent drops you. Two pilgrims drag you down by your feet, praying loudly.",
              fx: {wound:"lungs",health:-10,cause:"sulfur gas"},
            },
          },
          {
            t: "Sell mead to the pilgrims",
            check: {s:"trade",s2:"persuasion",d:32},
            win: {r:"Pilgrims get thirsty. You sell out by midnight.",fx:{coin:6,skill:{trade:1},piety:-1}},
            lose: {r:`Belak's men take a "fee" from you too, bigger than your profits.`,fx:{coin:-2}},
          },
        ],
      },
      {
        id: "ww_vg_sulfur",
        title: "The Redcrown pits",
        cond: (p,C)=>R(p,"POL-25")&&grown(p,C)&&(C.poor(p)||C.job(p,"miner","labor")),
        w: 1,
        cool: 8,
        text: "House Belak's sulfur pits in the Redcrown Heights pay well because nobody lasts there long. This season they are hiring every pair of hands they can find; the Lady Belak has a great order, they say, for barrels of sulfur shipped to Sevany. Nobody says what for.",
        choices: [
          {
            t: "Dig for the season",
            check: {s:"sta",s2:"wil",d:44},
            win: {
              r: "Yellow dust in your hair, your mouth, your bread. You come out with 15 suns and a cough that lasts until spring.",
              fx: {coin:15,wil:1,health:-3,job:"miner"},
            },
            lose: {
              r: "The fumes get into your chest and stay there.",
              fx: {coin:8,wound:"lungs",health:-10,cause:"sulfur fumes"},
            },
          },
          {
            t: "Drive the barrels to Sevany instead",
            check: {s:"husbandry",s2:"ins",d:36},
            win: {
              r: "Ten days on the road with oxen and yellow barrels. At Sevany they go into a cove below Mount Dobava, beside old hulls stacked with pitch. Odd.",
              fx: {coin:10,flag:"ww_vg_sulfurcove"},
            },
            lose: {r:"An ox goes lame. You arrive late and are paid less.",fx:{coin:4}},
          },
          {t:"Find other work",r:"You work the rye harvest for half the pay and keep your lungs.",fx:{coin:5}},
        ],
      },
      {
        id: "ww_vg_brideprice",
        title: "Pelts for a bride",
        cond: (p,C)=>R(p,"POL-25")&&unwed(p,C),
        w: 1,
        cool: 7,
        text: p=>`In Velgrad marriages are set by parents and sealed with a bride-price in pelts. ${SEX(p,"Your father has found you a girl from the next village; her father wants forty sables, which is a fortune.","Your father has found you a husband from the next village; the boy's father is offering forty sables, and your father is pretending to be insulted.")} Nobody has asked what you think.`,
        choices: [
          {
            t: "Meet the match at the church door after liturgy",
            check: {s:"etiquette",s2:"persuasion",d:30},
            win: {
              r: "Shy at first, then easy. By the Dawn Feast your parents and theirs agree on thirty-two sables and a cow.",
              fx: {lover:!0,happy:6},
            },
            lose: {
              r: "You say something stupid about bears. The match goes ahead anyway, frostily.",
              fx: {lover:!0,happy:-1},
            },
          },
          {
            t: "Trap the pelts yourself to speed things up",
            req: p=>p.sex==="M",
            check: {s:"tracking",s2:"survival",d:44},
            win: {
              r: "A winter in the North Woods and forty sables of your own. Her father is very impressed.",
              fx: {lover:!0,skill:{tracking:3,survival:2},happy:6},
            },
            lose: {
              r: "Eighteen pelts and frozen toes. Your father makes up the rest and grumbles about it for years.",
              fx: {lover:!0,wound:"frostbite",health:-6},
            },
          },
          {
            t: "Refuse the match",
            r: "Your father does not speak to you for a month. The bride-price goes to your cousin's wedding instead.",
            fx: {happy:-2,wil:1},
          },
        ],
      },
      {
        id: "ww_vg_monasteryschool",
        title: "Letters in Eastfolk",
        cond: (p,C)=>R(p,"POL-25")&&(kid(p,C)||C.teen(p))&&!C.literate(p),
        w: 1,
        once: !0,
        text: "Monastery schools in Velgrad teach letters in Eastfolk to priests' sons and merchants. Priests marry here, and their sons often become priests. Brother Mead, who keeps the guesthouse on Lamp Street, says the abbot will take one more child this winter, if the child can sit still through the morning liturgy.",
        choices: [
          {
            t: "Sit through the liturgy without moving",
            check: {s:"wil",s2:"int",d:22},
            win: {
              r: "Three hours of chant and incense, and you do not even scratch. By spring you can read the icons' names.",
              fx: {literate:!0,skill:{learning:2,faith:2},piety:2},
            },
            lose: {
              r: "You fidget, then sneeze during the Lamp prayer. The abbot sends you home with a honey cake and no place.",
              fx: {happy:-2},
            },
          },
          {
            t: "Ask to learn the bells instead",
            r: "The bell-brothers take you up the tower. Velgrad's bells ring in patterns, and now you know them all.",
            fx: {skill:{music:3},happy:3},
          },
        ],
      },
      {
        id: "ww_vg_honeyporridge",
        title: "Before the third sunrise",
        cond: (p,C)=>R(p,"POL-25")&&C.adult(p)&&(C.old(p)||C.hasKids(p)||C.married(p)),
        w: .8,
        cool: 12,
        setup: (p,ctx)=>{ctx.dname=A.pick(["your old uncle","the neighbor who taught you to fish","your mother's sister","an old friend from the rye fields"])},
        text: "{dname} has died. In Velgrad the dead are washed, dressed in white linen and buried facing east before the third sunrise, and the mourners eat honey porridge at the grave. The ground is frozen hard, and the priest is waiting with a short temper.",
        choices: [
          {
            t: "Dig the grave yourself through the frost",
            check: {s:"str",s2:"wil",d:40},
            win: {
              r: "Fire on the ground all night to soften it, then the pick at dawn. Done before the third sunrise. The porridge tastes of honey and smoke.",
              fx: {wil:1.5,str:.4,honor:2},
            },
            lose: {
              r: "The ground beats you. The priest blesses a shallow grave and the neighbors heap stones over it.",
              fx: {wil:1.5,happy:-3},
            },
          },
          {
            t: "Cook the honey porridge for everyone",
            r: "You make enough for the whole village. People talk about the dead and about your porridge, in that order.",
            fx: {wil:1,happy:-1,honor:1},
          },
          {
            t: "Pay men to dig",
            req: p=>p.coin>=3,
            r: "Three suns, and the grave is ready. You stand and sing with the others.",
            fx: {coin:-3,wil:1},
          },
        ],
      },
      {
        id: "ww_vg_tenthman",
        title: "One man in ten",
        cond: (p,C)=>R(p,"POL-25")&&grown(p,C)&&C.male(p)&&free(p)&&!C.soldier(p),
        w: 1,
        cool: 8,
        text: "When the king calls, every free village of Velgrad sends one man in ten. This time the call is for the Dawn Volunteers, Velgrad's pledged force serving Prince Andros at Coreria in the Neck, under Lord Anton Koren. The village elders are drawing lots, and the priest says it is holy work.",
        choices: [
          {
            t: "Volunteer before the lots are drawn",
            r: "The priest blesses you at dawn. You march south toward a war that is not yours, for a prince crowned by your church.",
            fx: {honor:4,piety:3,skill:{spear:2,axe:1},job:"mercenary",wil:1},
          },
          {
            t: "Draw your lot and trust the Lamp",
            check: {s:"gambling",s2:"wil",d:40},
            win: {r:"Long straw. The miller's son goes. You buy him a drink and a good pair of boots.",fx:{coin:-2}},
            lose: {
              r: "Short straw. You march south in a week with a borrowed axe.",
              fx: {skill:{axe:2},wil:1,job:"mercenary"},
            },
          },
          {
            t: "Pay a landless man to take your place",
            req: p=>p.coin>=20,
            r: "Twenty suns to a trapper with nothing to lose. You are not proud of it.",
            fx: {coin:-20,honor:-2},
          },
        ],
      },
      {
        id: "ww_vg_sevina",
        title: "Pirates among the fishing boats",
        cond: (p,C)=>R(p,"POL-25")&&grown(p,C)&&C.coast(p),
        w: 1,
        cool: 7,
        text: "The Sevina coast has no harbor chain and was burned by Greyhaven in 1009. Channel pirates hide among its fishing boats, and the Sevany Hooks, galley marines trained to board with grapnels and short axes, are searching every boat. Your neighbor's boat came home last night with a new sail and no fish.",
        choices: [
          {
            t: "Tell the Hooks about your neighbor",
            r: "They take him and his new sail. Toll cheats lose their cargo; pirates hang. The village goes quiet around you.",
            fx: {favor:2,honor:-2,happy:-3},
          },
          {
            t: "Warn your neighbor",
            check: {s:"stealth",s2:"ins",d:38},
            win: {
              r: "He takes his boat out before dawn and does not come back. He leaves you his nets.",
              fx: {coin:4,honor:1},
            },
            lose: {
              r: "The Hooks see you running to his door. You spend a day explaining yourself in the toll fort.",
              fx: {happy:-4,favor:-2},
            },
          },
          {
            t: "Ask the Hooks for work",
            req: (p,C)=>C.prof(p,"axe",25)||C.prof(p,"sea",25),
            r: "The Channel-Master always needs boarders. You learn grapnel work in a week.",
            fx: {job:"mercenary",skill:{sea:2,axe:1}},
          },
        ],
      },
      {
        id: "ww_vg_height",
        title: "A joke about the king",
        cond: (p,C)=>R(p,"POL-25")&&C.adult(p),
        w: .9,
        cool: 9,
        setup: (p,ctx)=>{pid(p,ctx,"friend")},
        text: "In the Red Lamp in the Rye Market, {them}, three mugs of mead deep, starts a joke about the king's height and a low doorway. In Velgrad, mocking the king's height or asking about his health can get you killed, and Vera Belak's informers sit in every alehouse.",
        choices: [
          {
            t: "Shut {themHim} up fast",
            check: {s:"intimidation",s2:"str",d:36},
            win: {
              r: "A hand over the mouth and a hiss in the ear. {them} goes pale and finishes the joke as a joke about a bear instead.",
              fx: {them:{type:"friend",op:15},skill:{intimidation:1}},
            },
            lose: {
              r: "{them} shakes you off and shouts the punchline. A man by the stove gets up and leaves.",
              fx: {happy:-3,them:{type:"friend",op:-5},flag:"ww_vg_joke"},
            },
          },
          {
            t: "Turn it into a toast to the king",
            check: {s:"persuasion",s2:"int",d:40},
            win: {
              r: '"...and he never once bent for any man! To the king!" The whole alehouse drinks. The man by the stove drinks too.',
              fx: {skill:{persuasion:2},favor:1,them:{type:"friend",op:10}},
            },
            lose: {r:"Nobody drinks. The man by the stove writes something.",fx:{favor:-2}},
          },
          {
            t: "Leave before the punchline",
            r: "You are out the door before the laughter. Two days later {them} is fined 30 sables by a lord's court.",
            fx: {them:{type:"friend",op:-15}},
          },
        ],
      },
      {
        id: "ww_vg_icon",
        title: "An icon facing east",
        cond: (p,C)=>R(p,"POL-25")&&C.adult(p)&&(is(p,"artisan")||C.prof(p,"craft",30)),
        w: 1,
        cool: 8,
        text: "A merchant of the Fur Staple wants an icon of the Lamp-Bearer for his new house: painted on a board, always hung facing east, with gold leaf if you can get it. He will pay 15 suns. The monastery painters say laymen paint icons badly. You mean to prove them wrong.",
        choices: [
          {
            t: "Paint it the old way, egg and gold",
            check: {s:"craft",s2:"faith",d:44},
            win: {
              r: "The face comes out calm and grave, the flame above it real enough to warm your hands. The merchant's wife weeps when she sees it.",
              fx: {coin:15,skill:{craft:3},piety:2,fame:1},
            },
            lose: {
              r: "The gold leaf flakes and the face looks puzzled. He pays you half and hangs it in the kitchen.",
              fx: {coin:7,skill:{craft:1}},
            },
          },
          {
            t: "Ask a monastery painter to teach you",
            r: "Brother Pavel makes you grind pigments for a month before you touch a brush. It is the best month of your working life.",
            fx: {skill:{craft:2,faith:1},piety:1},
          },
        ],
      },
      {
        id: "ww_dv_skate",
        title: "Bone runners",
        cond: (p,C)=>R(p,"POL-26")&&kid(p,C),
        w: 1,
        cool: 4,
        text: "The lake is frozen black and clear, and the children of {home} are racing on bone runners, skates cut from cow shin-bones and strapped to their boots. The course goes out to the fishing holes and back. Near the reeds, where the spring runs in, the ice is thin.",
        choices: [
          {
            t: "Race the straight line past the reeds",
            check: {s:"spd",s2:"ins",d:22},
            win: {
              r: "You hear the ice sing under you and do not slow down. First back to shore, by a whole length.",
              fx: {spd:.5,happy:5},
            },
            lose: {
              r: "The ice gives by the reeds. Your friends pull you out with a sled rope, blue and shrieking.",
              fx: {health:-6,wil:.8,cause:"the lake ice"},
            },
          },
          {
            t: "Go the long way round",
            r: "You come in third, dry and smug. The boy who went past the reeds is still sneezing a week later.",
            fx: {happy:2,int:.2},
          },
          {
            t: "Pull the little ones on the sled instead",
            r: "Six small children, one sled, a great deal of screaming. The mothers on the shore remember who was kind.",
            fx: {honor:1,str:.3,happy:3},
          },
        ],
      },
      {
        id: "ww_dv_steam",
        title: "Speak low",
        cond: (p,C)=>R(p,"POL-26")&&C.adult(p),
        w: 1,
        cool: 6,
        text: `In the steam-bath hut by the jetty, a neighbor beats his back with birch twigs and talks: the Lord Marshal is holding back the queen's rye, the heir fainted at a drum, the Prince-Consort wants her set aside. "Speak low, the queen is listening," someone says, half joking. In Drevna it is never entirely a joke.`,
        choices: [
          {
            t: "Hush him and change the subject",
            r: "Steam, birch, silence. Listening at a neighbor's wall is only fined, but spying on the crown is treason, and the Queen's Ear has many friends.",
            fx: {skill:{intrigue:1}},
          },
          {
            t: "Add what you have heard",
            check: {s:"intrigue",s2:"int",d:40},
            win: {
              r: "You trade rumor for rumor and come out knowing more than you went in with: the rye carts are at Sevmir, and the Tusk riders are gathering.",
              fx: {skill:{intrigue:2},int:.3,happy:2},
            },
            lose: {
              r: "The next week a quiet woman from the Still Hall asks you, politely, where you heard what you said in the steam house.",
              fx: {happy:-4,wil:.8},
            },
          },
          {
            t: "Run cold water over him and laugh",
            r: "He howls and chases you into the snow. Everyone rolls in it. The talk is forgotten.",
            fx: {happy:4,sta:.3},
          },
        ],
      },
      {
        id: "ww_dv_deadhouse",
        title: "The spring burying",
        cond: (p,C)=>R(p,"POL-26")&&C.ageAdj(p)>=10,
        w: .9,
        cool: 6,
        text: p=>`In winter the ground is frozen, so the dead of ${hm(p)} wait in the cold house at the end of the village, stacked and wrapped. Now the thaw has come, and the whole village buries its winter dead in one day. There are ${A.ri(6,14)} this year, wrapped in linen and frost.`,
        choices: [
          {
            t: "Help carry the dead out",
            check: {s:"str",s2:"wil",d:28},
            win: {
              r: "Light as kindling, most of them. You carry six, and do not let your hands shake.",
              fx: {wil:1.5,honor:2},
            },
            lose: {
              r: "You make it halfway with the first one and have to sit down in the mud. Nobody blames you.",
              fx: {wil:1,happy:-3},
            },
          },
          {
            t: "Sing the dawn hymn at the graves",
            check: {s:"music",s2:"faith",d:26},
            win: {
              r: "Soft and steady, the old Dawn chant with no drum. The mothers stop crying to listen.",
              fx: {piety:2,skill:{music:1},wil:.8},
            },
            lose: {r:"Your voice goes. The priest carries on alone.",fx:{wil:.8}},
          },
          {
            t: "Dig graves until dark",
            r: "Spade after spade in the half-frozen earth. By evening every grave faces east.",
            fx: {sta:.5,wil:1,honor:1},
          },
        ],
      },
      {
        id: "ww_dv_drum",
        title: "No drum within a league",
        cond: (p,C)=>R(p,"POL-26")&&C.adult(p),
        w: .9,
        cool: 9,
        text: "A wedding party of half-orc rivermen from the south is coming up the shore road with pipes, fiddles, and a big drum, beating it as they come. They are strangers, and they do not know that no drum may sound within a league of the Listening Tower. The Tower is less than a league away. The Listener's Guard will not ask questions.",
        choices: [
          {
            t: "Run out and stop the drummer",
            check: {s:"persuasion",s2:"spd",d:38},
            win: {
              r: "You grab the drummer's arm and explain, fast. He goes grey and hides the drum under a cloak. The wedding goes on with pipes, and you are invited.",
              fx: {honor:3,happy:4,newRel:{type:"friend",op:25}},
            },
            lose: {
              r: "He shakes you off, laughing. Ten minutes later the Guard arrives with wax in their ears and crossbows.",
              fx: {happy:-4,wil:1},
            },
          },
          {
            t: "Grab the drum and throw it in the lake",
            check: {s:"str",s2:"spd",d:42},
            win: {
              r: "It floats, booming hollowly as it bobs. The rivermen are furious until someone explains. Then they buy you mead.",
              fx: {honor:2,fame:1},
            },
            lose: {
              r: "The drummer hits you with the drumstick, which is a big drumstick.",
              fx: {health:-6,wil:.5,cause:"a drumstick"},
            },
          },
          {
            t: "Stay out of it",
            r: "By evening the drum is in the Still Hall, and the drummer is in a cell. You hear the wedding was very quiet.",
            fx: {},
          },
        ],
      },
      {
        id: "ww_dv_steppemarch",
        title: "A crossbow on the wall",
        cond: (p,C)=>R(p,"POL-26")&&grown(p,C)&&(C.terr(p,"steppe","plains")||C.prof(p,"xbow",30)),
        w: 1,
        cool: 6,
        text: "On the Steppe March farmers keep crossbows at home by law, women too, since the Lakeland War. Tonight the dogs are barking at the edge of the rye, and you hear hooves on the frozen ground: Tusk riders, a raiding party, testing the grazing line.",
        choices: [
          {
            t: "Shoot from the loft window",
            check: {s:"xbow",s2:"ins",d:44},
            win: {
              r: "You shoot for the horse and the knee, the Zorin way. One horse goes down screaming and the riders wheel off into the dark.",
              fx: {skill:{xbow:3},fame:2,honor:2},
            },
            lose: {
              r: "Your bolt flies wide. They take two cows and burn the haystack, laughing.",
              fx: {coin:-12,wil:1.2,skill:{xbow:1}},
            },
          },
          {
            t: "Ring the alarm for the whole village",
            check: {s:"command",s2:"spd",d:36},
            win: {
              r: "Twenty crossbows at twenty windows. The riders think better of it.",
              fx: {skill:{command:2},honor:2},
            },
            lose: {r:"By the time the village is up, they are gone with a cow.",fx:{coin:-5}},
          },
          {
            t: "Bar the door and keep the children quiet",
            r: "They take what they want from the byre and leave. You hate yourself a little, and your children are alive.",
            fx: {coin:-10,wil:1,happy:-3},
          },
        ],
      },
      {
        id: "ww_dv_rye",
        title: "The rye carts",
        cond: (p,C)=>R(p,"POL-26")&&grown(p,C)&&early()&&!is(p,"noble","royal"),
        w: 1,
        once: !0,
        text: `You are a carter on the rye carts: 2,000 bushels owed to the Tusk Clans each winter under the Treaty of Thardush. Drevna calls it a gift; the clan-mothers say, "Count the rye before you thank the Drevnan." The Lord Marshal's men have stopped the carts at Sevmir, saying the roads are unsafe. They are not unsafe.`,
        choices: [
          {
            t: "Wait at Sevmir with the carts",
            r: "Weeks of cold and boredom, and the Marshal's men drinking your mead. If the Tusk riders come for their rye, you will be the first to meet them.",
            fx: {wil:1,coin:3},
          },
          {
            t: "Take your cart on to the grazing line yourself",
            check: {s:"stealth",s2:"husbandry",d:48},
            win: {
              r: "You slip out at night with forty bushels and deliver them to an astonished clan-mother. Someone in Drevna will hear of it. So will Zorac.",
              fx: {honor:3,fame:2,favor:2,flag:"ww_dv_ryerun"},
            },
            lose: {
              r: "The Marshal's riders bring you back with your hands tied. Zorac himself looks at you, and does not have to say anything.",
              fx: {happy:-5,wil:1.5,favor:-2},
            },
          },
          {
            t: "Send word to the queen's Ear",
            check: {s:"intrigue",s2:"persuasion",d:42},
            win: {
              r: "A message goes to Nadia Lark through a wax-buyer. Within the week the queen knows exactly where her rye is sitting.",
              fx: {favor:3,skill:{intrigue:2}},
            },
            lose: {r:"Your message goes to the wrong wax-buyer, who works for Zorac.",fx:{favor:-1,happy:-3}},
          },
        ],
      },
      {
        id: "ww_dv_bees",
        title: "The wax tithe",
        cond: (p,C)=>R(p,"POL-26")&&C.adult(p)&&(low(p)||C.job(p,"farm","herd")),
        w: 1,
        cool: 6,
        text: "Your bee-trees in the forest gave a good harvest: honey for the family and a great block of yellow wax. In Drevna the hearth-tax is paid in furs or wax, and the monasteries take a tithe partly in wax for their candles. The monastery cellarer is coming, and he has a good eye for wax.",
        choices: [
          {
            t: "Pay the tithe in your best wax",
            r: `The cellarer sniffs it and smiles. "Good wax, good prayers." The monastery's candles will burn your bees' summer.`,
            fx: {coin:-3,piety:3},
          },
          {
            t: "Keep the best wax back and sell it at the Wax Market",
            check: {s:"trade",s2:"stealth",d:38},
            win: {
              r: "The chandlers in Drevna pay well. The cellarer gets the second-best wax and does not know the difference.",
              fx: {coin:6,skill:{trade:1},piety:-1},
            },
            lose: {
              r: "The cellarer knows your bees too well. He takes the tithe twice and a sermon.",
              fx: {coin:-6,piety:1,happy:-2},
            },
          },
          {
            t: "Split a hive to make more bee-trees",
            check: {s:"husbandry",s2:"wil",d:40},
            win: {
              r: "A new swarm settles in a hollow birch. Next year, twice the wax.",
              fx: {skill:{husbandry:3},coin:2},
            },
            lose: {r:"The bees disagree with the plan.",fx:{health:-5,skill:{husbandry:1}}},
          },
        ],
      },
      {
        id: "ww_dv_forestfire",
        title: "Smoke in summer",
        cond: (p,C)=>R(p,"POL-26")&&C.adult(p)&&C.terr(p,"forest","marsh","plains","hills"),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{pid(p,ctx,"acquaint")},
        text: "A dry August. {them}, who farms the next clearing, was burning stumps when the wind changed, and now there is smoke in the pines. In Drevna setting a forest fire in summer is punished by drowning. {them} is running toward you with a wet sack, white with terror.",
        choices: [
          {
            t: "Help beat it out",
            check: {s:"sta",s2:"wil",d:40},
            win: {
              r: "An hour of smoke and wet sacks and burning eyes. The fire dies in a patch of moss. {them} kneels in the ash and cries.",
              fx: {honor:2,wil:1,them:{type:"friend",op:40}},
            },
            lose: {
              r: "It takes the whole village and half a day, and an acre of pine is gone. The lord's men want to know whose fire it was.",
              fx: {wound:"burn",health:-8,wil:1,them:{type:"friend",op:20},cause:"a forest fire"},
            },
          },
          {
            t: "Run for the village",
            r: "The whole village turns out with buckets and sacks. The fire is out by dusk. The lord's men are not far behind.",
            fx: {honor:1},
          },
          {
            t: "Report {themHim} to the lord's reeve",
            r: "The fire is put out. {them} is taken to the lake. You did what the law asks.",
            fx: {favor:2,honor:-4,wil:1,them:{type:"enemy",op:-80}},
          },
        ],
      },
      {
        id: "ww_dv_whaleboats",
        title: "The Dobin boats",
        cond: (p,C)=>R(p,"POL-26")&&grown(p,C)&&p.coin<15&&!is(p,"noble","royal","gentry"),
        w: .9,
        cool: 10,
        text: "Bad debtors in Drevna are sent to work the Dobin whaling boats on Whale Sound. You owe a river merchant of House Lubec 40 bears, and his clerk has the judgment in his hand. Since the Truce of Dobin, the whalers may not kill Frost Leviathans, and the giants of Hrimfell leave the boats alone. Mostly.",
        choices: [
          {
            t: "Go to Dobin and work it off",
            check: {s:"sea",s2:"sta",d:42},
            win: {
              r: "A season of harpoons, blubber and freezing spray. Once a Frost Leviathan surfaces beside the boat, white and vast, and everyone holds their breath. Debt cleared.",
              fx: {skill:{sea:3},sta:.6,wil:1.5},
            },
            lose: {
              r: "A line runs and takes two fingers with it. Debt cleared all the same.",
              fx: {wound:"lost_fingers",health:-10,skill:{sea:2},wil:2,cause:"a whale line"},
            },
          },
          {
            t: "Beg the merchant for time",
            check: {s:"persuasion",s2:"trade",d:46},
            win: {
              r: "The Lubecs lend to half the river towns, and they know a debtor at sea earns them nothing. Two years, at a higher rate.",
              fx: {skill:{persuasion:2}},
            },
            lose: {r:"The clerk folds the judgment and points north.",fx:{skill:{sea:2},wil:1.5,health:-5}},
          },
        ],
      },
      {
        id: "ww_dv_stillhall",
        title: "The Still Hall",
        cond: (p,C)=>R(p,"POL-26")&&(C.teen(p)||grown(p,C))&&C.ageAdj(p)<=25,
        w: 1,
        once: !0,
        text: "Lev Hollis, master of the Still Hall in Drevna, trains night watchmen, listeners and the queen's guard: silent movement and fighting by hand signals. He has heard you are quiet. His test is to cross the hall's wooden floor at night to the door where he sits listening.",
        choices: [
          {
            t: "Cross the floor",
            check: {s:"stealth",s2:"wil",d:38},
            win: {
              r: "Heel, edge, toe, breathe. Your hand is on the door before he turns his head. He laughs, very softly. You learn the hand signs that winter.",
              fx: {skill:{stealth:4,intrigue:1},apt:{stealth:1.25},flag:"ww_dv_still"},
            },
            lose: {
              r: 'The third board creaks. "Again next year," he whispers. "The floor is patient."',
              fx: {skill:{stealth:1}},
            },
          },
          {t:"Decline. Listening is not for you",r:'He nods. "Then speak low," he says.',fx:{}},
        ],
      },
      {
        id: "ww_dv_dawnwed",
        title: "At the lake shore at dawn",
        cond: (p,C)=>R(p,"POL-26")&&unwed(p,C),
        w: 1,
        cool: 6,
        text: p=>`In Drevna a marriage is by the couple's own choice with the parents' blessing, sealed at the lake shore at dawn. You have been meeting ${SEX(p,"{npcF}","{npcM}")} at the beehives for a year, and your mother has started baking honey cakes for no reason.`,
        choices: [
          {
            t: "Ask for the parents' blessing",
            check: {s:"etiquette",s2:"persuasion",d:30},
            win: {
              r: "The blessing is given over mead. At dawn on the shore, with the mist on the water, you are married, and the steam-bath is heated for the whole village.",
              fx: {lover:!0,happy:8},
            },
            lose: {
              r: "The other family wants a richer match. You wait a year. Then they give in.",
              fx: {lover:!0,happy:2,wil:.5},
            },
          },
          {
            t: "Go to the shore at dawn and decide there",
            r: "The lake is pink and grey and still. You decide.",
            fx: {lover:!0,happy:6},
          },
          {t:"Let it go",r:"Your mother eats the honey cakes herself, grimly.",fx:{happy:-3}},
        ],
      },
      {
        id: "ww_dv_iceroad",
        title: "The Ice Road",
        cond: (p,C)=>R(p,"POL-26")&&grown(p,C),
        w: 1,
        cool: 6,
        text: "Every winter the Ice Road is staked across the lake, and goods move by sled from one shore to the other. In winter the frozen lakes are Drevna's roads. You are driving a sled of salt and iron across when the ice ahead groans and a black crack runs across the staked way.",
        choices: [
          {
            t: "Whip the horse and jump the crack",
            check: {s:"riding",s2:"ins",d:44},
            win: {
              r: "The sled leaps, slews, and runs on. Behind you the crack opens into black water. You do not stop until the far shore.",
              fx: {skill:{riding:2},coin:5,wil:.5},
            },
            lose: {
              r: "The back runners go through. You cut the horse free and lose the sled and the iron.",
              fx: {coin:-20,health:-6,wil:1.5,cause:"the lake ice"},
            },
          },
          {
            t: "Unload and walk the goods round the crack",
            check: {s:"survival",s2:"sta",d:38},
            win: {r:"Three hours of carrying in the cold. Every sack arrives.",fx:{coin:3,sta:.5,skill:{survival:2}}},
            lose: {r:"You go through to the knee. Frost takes two toes.",fx:{wound:"frostbite",health:-8}},
          },
          {
            t: "Turn back and wait for the Sled Riders' scouts",
            r: "They come at dusk with poles and planks, and restake the road a hundred paces north. You arrive a day late.",
            fx: {coin:-2},
          },
        ],
      },
      {
        id: "ww_dv_rivermen",
        title: "Pirates on the Dromir",
        cond: (p,C)=>R(p,"POL-26")&&C.adult(p)&&(is(p,"merchant","artisan")||C.job(p,"sailor","merchant","fish")),
        w: 1,
        cool: 7,
        text: "Your barge of furs and wax is coming down the middle Dromir toward Lubany when two long boats slide out of the reeds. River pirates. Stas of Korov's men, by the look of them; they rob Velgradan fur barges for the rivermen's master, and lately they have not been picky about whose barge it is.",
        choices: [
          {
            t: "Fight them off the barge",
            r: "They grapple on. The first of them comes over the side with a hatchet.",
            fx: {
              duel: {
                tier: 2,
                title: "a Dromir river pirate",
                troop: "SP",
                opts: {kind:"duel",place:"a barge on the Dromir",lethal:!0,toYield:!0,title:"River pirates"},
              },
            },
          },
          {
            t: "Tell them you are Drevnan, not Velgradan",
            check: {s:"persuasion",s2:"deception",d:42},
            win: {
              r: '"Drevnan wax?" Their leader shrugs. "Pay the river toll, then." Five bears, and they paddle back into the reeds.',
              fx: {coin:-5,skill:{persuasion:2}},
            },
            lose: {
              r: '"Wax burns the same either side of the border." They take a third of the cargo.',
              fx: {coinPct:-.15,happy:-4},
            },
          },
          {
            t: "Run the barge onto the far bank and flee",
            check: {s:"sea",s2:"spd",d:40},
            win: {
              r: "You beach her in the shallows and they cannot follow in their long boats. You lose a day pushing her off.",
              fx: {skill:{sea:2}},
            },
            lose: {r:"You run aground in midstream. They take everything.",fx:{coinPct:-.3,wil:1.5}},
          },
        ],
      },
      {
        id: "ww_dv_earcuff",
        title: "The Lake Council",
        cond: (p,C)=>R(p,"POL-26")&&C.adult(p)&&is(p,"gentry","noble","royal"),
        w: 1,
        cool: 6,
        text: "New Year's Day: the great lords meet the queen as the Lake Council in the Listening Tower. Nobles wear silver ear-cuffs to honor the Listener, voices are kept low, and there are no drums for a league in any direction. This year the Council will hear the Lord Marshal on the rye, and the Prince-Consort on the heir.",
        choices: [
          {
            t: "Speak for the queen's daughter",
            check: {s:"diplomacy",s2:"etiquette",d:50},
            win: {
              r: "You speak softly, as one should here, about Ludmila's training with wax in her ears. The queen looks at you, once. That look is worth more than land.",
              fx: {favor:5,skill:{diplomacy:2},fame:2},
            },
            lose: {
              r: "Your voice rises in the heat of it, and the whole council winces. Raising your voice in the Listening Tower is a kind of insult.",
              fx: {favor:-3,honor:-2},
            },
          },
          {
            t: "Side with the Prince-Consort",
            check: {s:"intrigue",s2:"diplomacy",d:46},
            win: {
              r: "Pavel Brodar notes your support, and so does the queen. You will be rewarded by one of them.",
              fx: {skill:{intrigue:2},coin:20,favor:-2},
            },
            lose: {r:"The queen hears every word you say, because she always does.",fx:{favor:-5,happy:-3}},
          },
          {
            t: "Say nothing and watch",
            r: "You learn more by watching than any speaker learns by speaking. Zorac does not look at the queen once.",
            fx: {skill:{intrigue:1,etiquette:1},int:.3},
          },
        ],
      },
      {
        id: "ww_ts_sixth",
        title: "A sixth finger",
        cond: (p,C)=>R(p,"POL-31")&&kid(p,C),
        w: .8,
        once: !0,
        text: "Your mother has had a baby, and the baby has six fingers on one hand. In Tessaria the six-fingered hand is royal blood, and commoners call it a curse. In the north some midwives cut off a newborn's sixth finger at birth, so the child can never be taken for royal blood. The midwife has her little knife out.",
        choices: [
          {
            t: "Beg them to leave the baby's hand alone",
            check: {s:"persuasion",s2:"wil",d:18},
            win: {
              r: "Your mother looks at you, then at the baby, and tells the midwife to put the knife away. Your sibling grows up with six fingers and a quick temper.",
              fx: {wil:.8,honor:2,flag:"ww_ts_sixsib"},
            },
            lose: {
              r: "The midwife is quick. The baby screams, then sleeps. Nobody speaks of it again.",
              fx: {wil:1,happy:-4},
            },
          },
          {
            t: "Hold the baby's other hand while it is done",
            r: "Tiny fingers grip yours hard. You do not let go.",
            fx: {wil:1.2,happy:-3},
          },
        ],
      },
      {
        id: "ww_ts_badge",
        title: "Sun or dawn",
        cond: (p,C)=>R(p,"POL-31")&&C.adult(p),
        w: 1.1,
        cool: 5,
        text: "On the Neck road a traveler must guess whose country he is in. Livia's soldiers wear a gold sun badge; Andros's wear a red dawn. Each claimant hangs the other's spies, and a road station fort charges what it likes. There is a fort ahead, and you cannot see its banner yet.",
        choices: [
          {
            t: "Wear no badge and play the simple traveler",
            check: {s:"deception",s2:"persuasion",d:40},
            win: {
              r: "The sergeant decides you are too dull to be a spy. You pay the toll, three times the Ostran price for bread, and go on.",
              fx: {coin:-3,skill:{deception:2}},
            },
            lose: {
              r: "A man without a badge is a spy for both sides. They keep you two days and take your boots.",
              fx: {coin:-8,happy:-4,wil:1},
            },
          },
          {
            t: "Carry both badges and switch at the last bend",
            check: {s:"stealth",s2:"ins",d:46},
            win: {
              r: "Red dawn on your chest. The fort flies a red dawn. You go through like a cousin.",
              fx: {skill:{stealth:1,intrigue:2}},
            },
            lose: {
              r: "They search you and find the other badge.",
              fx: {health:-10,coin:-10,wil:1.5,cause:"a road-fort beating"},
            },
          },
          {
            t: "Go round through the hills",
            check: {s:"survival",s2:"sta",d:38},
            win: {r:"A long, cold day on goat tracks. No toll, no questions.",fx:{skill:{survival:2},sta:.3}},
            lose: {
              r: "Deserters live in those hills too. They rob you and let you go, which is the kind version.",
              fx: {coinPct:-.2,happy:-3},
            },
          },
        ],
      },
      {
        id: "ww_ts_forcedloan",
        title: "A forced loan",
        cond: (p,C)=>R(p,"POL-31")&&C.adult(p)&&(is(p,"artisan","merchant","gentry")||p.coin>=40),
        w: 1,
        cool: 7,
        text: `Both claimants levy forced loans on towns. A captain of the queen's hired companies has come with a list, a clerk and twenty men, and your name is on the list for 30 suns, "to be repaid from the Neck road tolls after the victory". Her hired men are owed 90,000 suns a month.`,
        choices: [
          {
            t: "Pay and get a receipt",
            req: p=>p.coin>=30,
            r: "The clerk writes you a receipt sealed with the queen's sun. It is worth exactly what the war is worth.",
            fx: {coin:-30,favor:2},
          },
          {
            t: "Hide your coin and plead poverty",
            check: {s:"deception",s2:"stealth",d:44},
            win: {
              r: "They search the shop and find a few coppers. The captain takes a bolt of cloth instead and moves on.",
              fx: {coin:-4,skill:{deception:2}},
            },
            lose: {
              r: "They find the pot under the floor. They take it all and call it the fine.",
              fx: {coinPct:-.4,happy:-6,wil:1},
            },
          },
          {
            t: "Offer the captain a private gift instead",
            req: p=>p.coin>=10,
            check: {s:"intrigue",s2:"persuasion",d:40},
            win: {
              r: "Ten suns into his own pocket, and your name is somehow crossed out. Unpaid soldiers are cheap to buy.",
              fx: {coin:-10,skill:{intrigue:1}},
            },
            lose: {r:"He takes the ten, then the thirty.",fx:{coin:-40,happy:-5}},
          },
        ],
      },
      {
        id: "ww_ts_refugees",
        title: "One in sixteen",
        cond: (p,C)=>R(p,"POL-31")&&C.adult(p),
        w: 1,
        cool: 6,
        text: "One person in sixteen in Tessaria is a refugee. A family from Lorino, sacked by the queen's Grey Hand in 1071 and never recovered, is sitting at your gate: a grandmother, a mother, three children, a goat. They are not begging. They are just very tired.",
        choices: [
          {
            t: "Take them in for the winter",
            r: "The house is crowded, the bread is short, and the children's laughter is loud. In spring they move on toward Albina and leave you the goat.",
            fx: {coin:-6,honor:4,piety:2,happy:2},
          },
          {
            t: "Feed them and send them to the Refugee Field",
            r: "Bread, lentils and directions. The Refugee Field outside Tessar has a thousand families and a forger in every tent.",
            fx: {coin:-1,honor:1},
          },
          {
            t: "Hire the mother to work your field",
            check: {s:"stewardship",s2:"persuasion",d:30},
            win: {
              r: "She works harder than anyone you have hired, and her children learn to read from your old psalter.",
              fx: {coin:2,honor:2,newRel:{type:"friend",op:30}},
            },
            lose: {r:"Your neighbors complain about Lorino people. She leaves after a month.",fx:{happy:-2}},
          },
          {t:"Close the gate",r:"They move on. Everyone has their own war.",fx:{honor:-1}},
        ],
      },
      {
        id: "ww_ts_doublepay",
        title: "Double pay",
        cond: (p,C)=>R(p,"POL-31")&&grown(p,C)&&C.soldier(p),
        w: 1.1,
        cool: 5,
        text: "Your company has not been paid in four months. Tonight a stranger in a plain cloak sits at your fire and says the other side will pay double, in Ostran silver, if the company opens the gate it guards. Unpaid soldiers change sides in this war all the time. Deserters are hanged at the road stations.",
        choices: [
          {
            t: "Refuse and report him to the captain",
            r: "The captain hangs the stranger at dawn and finds a month's pay from somewhere. Loyalty is cheaper than a gate.",
            fx: {honor:4,merit:3,coin:6},
          },
          {
            t: "Take the offer to your comrades",
            check: {s:"intrigue",s2:"persuasion",d:50},
            win: {
              r: "The company votes, the gate opens, the silver is real. You wear a different badge now and nobody here trusts you.",
              fx: {coin:40,honor:-8,trait:"fickle"},
            },
            lose: {r:"Someone tells the captain.",fx:{honor:-6,punish:"desertion"}},
          },
          {
            t: "Tell him to come back when the money is on the table",
            check: {s:"trade",s2:"ins",d:42},
            win: {
              r: "He never comes back. But the rumor of the offer gets around, and suddenly your captain finds a month's pay.",
              fx: {coin:8,skill:{trade:1}},
            },
            lose: {r:"He comes back with the money, and now you have to decide all over again.",fx:{wil:1}},
          },
        ],
      },
      {
        id: "ww_ts_engineyard",
        title: "The Engine Yard",
        cond: (p,C)=>R(p,"POL-31")&&grown(p,C)&&(is(p,"artisan")||C.prof(p,"craft",30)||C.prof(p,"siegecraft",20)||C.job(p,"carpenter","smith")),
        w: 1,
        cool: 8,
        text: "Master Silas Vane, sixty-eight, who built the first counterweight trebuchet in 1065 and smashed both of Andros's siege towers with it, is hiring carpenters and smiths for the Engine Yard of Tessar. He asks every man to look at a drawing and tell him what is wrong with it.",
        choices: [
          {
            t: "Study the drawing",
            check: {s:"int",s2:"siegecraft",d:44},
            win: {
              r: "The pivot is too far forward; the arm would snap. Vane grins with half his teeth. You are hired, and you learn more in a season than in your life before.",
              fx: {skill:{siegecraft:4,craft:2},int:.6,coin:10,flag:"ww_ts_engine"},
            },
            lose: {r:'You find nothing wrong. "Everything is wrong," he says. "Next."',fx:{int:.2}},
          },
          {
            t: "Ask what is in the sealed cellar by the yard",
            r: 'Vane stops smiling. "Lamp oil," he says. A Six-Fingers guard walks you out of the yard.',
            fx: {happy:-2,flag:"ww_ts_cellar"},
          },
          {
            t: "Hire on as a common carpenter",
            r: "You plane beams for engines that throw ninety kilo stones. The pay is late, but it comes.",
            fx: {coin:5,job:"carpenter",skill:{craft:2,siegecraft:1}},
          },
        ],
      },
      {
        id: "ww_ts_cedar",
        title: "Feleria cedars",
        cond: (p,C)=>R(p,"POL-31")&&grown(p,C)&&C.terr(p,"forest","hills","mountains")&&!is(p,"noble","royal"),
        w: 1,
        cool: 7,
        text: "The cedar forests of Feleria, where the Truce of the Cedars was signed in 1087 and broken in 1096. Cedar timber still sells, war or no war, and a cutting crew is short a man. Both armies' foragers pass through the forest, and both like cedar for their fires.",
        choices: [
          {
            t: "Cut with the crew",
            check: {s:"str",s2:"sta",d:38},
            win: {
              r: "Red, sweet-smelling wood, and a season's pay in queen's Leontines, which you change into Ostran suns as fast as you can.",
              fx: {coin:8,str:.5},
            },
            lose: {
              r: "An axe glances off a knot and into your shin.",
              fx: {wound:"deep_cut",health:-10,coin:3,cause:"a cedar axe"},
            },
          },
          {
            t: "Sell cedar to both armies' foragers",
            check: {s:"trade",s2:"deception",d:44},
            win: {
              r: "Gold-sun men on Monday, red-dawn men on Thursday. Nobody asks where the other half of your wood went.",
              fx: {coin:14,skill:{trade:2},honor:-2},
            },
            lose: {
              r: "A sergeant finds red-dawn coin in your purse while wearing a gold sun.",
              fx: {coin:-6,health:-6,happy:-4},
            },
          },
        ],
      },
      {
        id: "ww_ts_churchline",
        title: "Across the church line",
        cond: (p,C)=>R(p,"POL-31")&&unwed(p,C),
        w: 1,
        cool: 7,
        text: "Before 1061 Tessarians married across the church line all the time. Now a Temple family and a Dawn family marrying is suspect, as if the bride were a spy. Your sweetheart's family goes to the other church, and lives on the other side of the war.",
        choices: [
          {
            t: "Marry anyway, with whichever priest will do it",
            check: {s:"persuasion",s2:"faith",d:42},
            win: {
              r: "An old priest who remembers the days before the war marries you in a barn with the door shut, and blesses you in both tongues.",
              fx: {lover:!0,happy:8,piety:1},
            },
            lose: {
              r: "No priest will touch it. You live together unmarried, and both churches mutter.",
              fx: {lover:!0,happy:3,piety:-3},
            },
          },
          {
            t: "Change churches for love",
            r: "You kneel at the other altar. Changing church in Tessaria is changing sides, and your own family will not come to the wedding.",
            fx: {lover:!0,happy:4,piety:-2,wil:1},
          },
          {
            t: "Wait for the war to end",
            r: "The war has lasted forty-four years. You wait anyway.",
            fx: {happy:-4,wil:1},
          },
        ],
      },
      {
        id: "ww_ts_foragers",
        title: "Foragers",
        cond: (p,C)=>R(p,"POL-31")&&C.adult(p)&&low(p),
        w: 1.1,
        cool: 5,
        text: "Both claimants take grain for their armies. A troop of foragers is coming up the valley with carts, and you can see from here that they wear no badge at all, which means they belong to whoever pays them this week. Your grain is in the loft.",
        choices: [
          {
            t: "Hide the grain in the old cistern",
            check: {s:"stealth",s2:"int",d:40},
            win: {
              r: "They take two hens and a broken plough and go. Your children will eat this winter.",
              fx: {skill:{stealth:2},health:2},
            },
            lose: {
              r: "A forager who grew up on a farm checks the cistern first.",
              fx: {coin:-8,health:-5,wil:1.5,cause:"hunger"},
            },
          },
          {
            t: "Offer them a third if they leave the rest",
            check: {s:"persuasion",s2:"trade",d:42},
            win: {
              r: "Their sergeant is a farmer's son too. He takes a third and makes his men leave the rest.",
              fx: {coin:-3,skill:{persuasion:2}},
            },
            lose: {r:"They take your third and then the rest.",fx:{coin:-8,happy:-5}},
          },
          {
            t: "Let them take it and ask for a receipt",
            r: "A receipt for grain, signed by nobody, for an army with no name. You frame it and hang it over the door.",
            fx: {coin:-8,wil:1.5,trait:"cynical"},
          },
        ],
      },
      {
        id: "ww_ts_pits",
        title: "Burial pits",
        cond: (p,C)=>R(p,"POL-31")&&grown(p,C),
        w: .8,
        cool: 10,
        text: "After a skirmish near your village the dead go into pits, as they always do in this war, and each side refuses the other's priests. Both churches bury facing east. There is a pit for the sun-badges and a pit for the dawn-badges, and three dead with no badge at all lying in the field between.",
        choices: [
          {
            t: "Bury the three yourself, facing east",
            check: {s:"faith",s2:"wil",d:32},
            win: {
              r: "You dig them a grave of their own between the pits and say the words you know. A priest from each church watches and neither says anything.",
              fx: {piety:4,honor:3,wil:1},
            },
            lose: {r:"You cannot remember the words. You say what you can.",fx:{piety:2,wil:1}},
          },
          {
            t: "Strip the dead of boots and coats",
            r: "Good boots, two coats and a knife. The dead do not need them. You are not proud of it, but your children are warm.",
            fx: {coin:6,honor:-3,piety:-2},
          },
          {
            t: "Stay away from the field",
            r: "Crows, then dogs, then nothing. By spring there is only long grass.",
            fx: {},
          },
        ],
      },
      {
        id: "ww_ts_mosaic",
        title: "The emperor's face",
        cond: (p,C)=>R(p,"POL-31")&&kid(p,C),
        w: 1,
        cool: 6,
        text: "In the ruined bathhouse at the edge of town, where you are not supposed to play, there is an old imperial mosaic of the Neck Empire, its faces chipped off by both sides. Under a fallen tile you find a coin with a man's head and the word LEONTIVS: an old coin of the emperors, good silver, not like the bad Leontines in the market.",
        choices: [
          {
            t: "Take it home to your parents",
            r: "Your father weighs it in his hand a long time. Good old silver is worth more than three new coins. Bread for a week.",
            fx: {family:2,happy:3},
          },
          {
            t: "Keep it secret, for luck",
            r: "You carry it in your shoe for years. When you are grown you still do.",
            fx: {happy:2,flag:"ww_ts_oldcoin"},
          },
          {
            t: "Look for more under the other tiles",
            check: {s:"int",s2:"spd",d:22},
            win: {
              r: "Two more coins and a bronze pin shaped like a six-fingered hand. A pawnbroker pays very well and asks where you found them.",
              fx: {family:4,int:.3},
            },
            lose: {r:"A wall gives way. You get out with a cut head.",fx:{health:-5}},
          },
        ],
      },
      {
        id: "ww_ts_copper",
        title: "Copper going north",
        cond: (p,C)=>R(p,"POL-31")&&grown(p,C)&&!is(p,"noble","royal"),
        w: .9,
        cool: 10,
        text: "A carter of the Neck Road Carters' Guild offers you good pay to drive a wagon of Albina copper bars. The bills say Ostra. The road he gives you goes north, toward Andros's country and his mint. The Albina copper belongs to Lord Marshal Corvin Asterio, Queen Livia's own commander.",
        choices: [
          {
            t: "Drive the wagon and ask nothing",
            check: {s:"husbandry",s2:"ins",d:36},
            win: {
              r: "Ten days on the road, red-dawn soldiers waving you through at every fort as if they expected you. They did. You are paid 15 suns.",
              fx: {coin:15,flag:"ww_ts_copper"},
            },
            lose: {
              r: "Bandits take the wagon on the fourth day. The guild master says you owe him the copper.",
              fx: {coin:-10,happy:-5,wil:1},
            },
          },
          {
            t: "Take the bills to the queen's spy-master",
            check: {s:"intrigue",s2:"persuasion",d:52},
            win: {
              r: "Simeon Hark reads them twice and pays you 20 suns to forget you ever saw a wagon. What he does with it is the queen's business.",
              fx: {coin:20,favor:3,skill:{intrigue:2}},
            },
            lose: {
              r: "Hark's man works for Asterio. You are told, very kindly, to drive the wagon or leave Tessar.",
              fx: {happy:-5,wil:1},
            },
          },
          {t:"Refuse the job",r:"The carter finds someone else by noon.",fx:{}},
        ],
      },
      {
        id: "ww_ts_envoy",
        title: "Between the two crowns",
        cond: (p,C)=>R(p,"POL-31")&&C.adult(p)&&(C.race(p,"halfelf")||C.prof(p,"diplomacy",40)),
        w: 1.1,
        cool: 7,
        text: "Half-elves serve as envoys between the two sides in Tessaria, because nobody can quite decide which church a half-elf belongs to. A lord of the south needs a letter carried to a lord of the north about the exchange of prisoners, and he asks you.",
        choices: [
          {
            t: "Carry the letter under a white cloth",
            check: {s:"diplomacy",s2:"etiquette",d:42},
            win: {
              r: "The northern lord reads it, argues, and agrees: twenty prisoners for twenty. You bring two men home to mothers who thought them dead.",
              fx: {skill:{diplomacy:3},honor:4,fame:2,coin:6},
            },
            lose: {
              r: "The northern lord keeps you a week as a guest who may not leave, then sends you back with no answer.",
              fx: {wil:1,happy:-3,skill:{diplomacy:1}},
            },
          },
          {
            t: "Add a private message of your own",
            check: {s:"intrigue",s2:"diplomacy",d:50},
            win: {
              r: "A merchant who wants a safe road pays you to whisper a price. Both lords like it. You are now part of the Neck's trade, the oldest trade there is.",
              fx: {coin:20,skill:{intrigue:2,diplomacy:1}},
            },
            lose: {
              r: "The northern lord hears the merchant's name and turns to ice. You are lucky to leave.",
              fx: {happy:-4,honor:-2},
            },
          },
          {
            t: "Refuse. You belong to neither side",
            r: "The lord looks at you as if you had said something holy, or stupid.",
            fx: {},
          },
        ],
      },
      {
        id: "ww_ts_bentleontine",
        title: "The Bent Leontine",
        cond: (p,C)=>R(p,"POL-31")&&C.adult(p)&&C.ageAdj(p)<=50,
        w: 1,
        cool: 6,
        text: "In the Bent Leontine in Soldiers' Town, nobody takes the new coin at face. A veteran of the old Grey Hand company is selling a sealed paper he swears is the queen's written leave for the sack of Lorino in 1071, and the dice are rolling at the next table.",
        choices: [
          {
            t: "Throw dice with the soldiers",
            req: p=>p.coin>=5,
            check: {s:"gambling",s2:"int",d:42},
            win: {
              r: "The soldiers' dice are loaded, and you can tell which way. You win 15 suns and leave before they notice.",
              fx: {coin:15,skill:{gambling:2}},
            },
            lose: {r:"The dice are loaded the other way.",fx:{coin:-5,skill:{gambling:1}}},
          },
          {
            t: "Ask what the veteran wants for his paper",
            check: {s:"intrigue",s2:"trade",d:48},
            win: {
              r: "He wants more than you have. But you have seen the seal, and it is the queen's. You will know it again.",
              fx: {skill:{intrigue:2},flag:"ww_ts_lorino"},
            },
            lose: {
              r: "He decides you are a spy. Three of his friends walk you out the back.",
              fx: {health:-8,cause:"a beating in Soldiers' Town"},
            },
          },
          {
            t: "Drink your sour wine and listen",
            r: "Two companies are unpaid, a third is thinking about it, and a man in the corner has new Leontines that bend when you bite them.",
            fx: {int:.3},
          },
        ],
      },
      {
        id: "ww_ai_pearls",
        title: "The shallow banks",
        cond: (p,C)=>R(p,"POL-32")&&(kid(p,C)||C.teen(p)),
        w: 1,
        cool: 4,
        text: "On the Pearl Banks the women dive for pearls in shallow water, and the children dive beside them with a little basket and a stone. Your aunt says there is a bed of old oysters under the ledge at the reef's edge, where the water turns from green to blue.",
        choices: [
          {
            t: "Dive under the ledge",
            check: {s:"sta",s2:"wil",d:20},
            win: {
              r: "Three oysters, and in the third a pearl the size of a lentil, pink as dawn. Your aunt shrieks and the whole beach comes running.",
              fx: {family:5,sta:.6,happy:6},
            },
            lose: {
              r: "You scrape your back on the coral coming up and bleed into the water. Your aunt hauls you out fast. Things come to blood.",
              fx: {health:-4,sta:.3},
            },
          },
          {
            t: "Work the near beds with the others",
            r: "A basket of ordinary oysters, and one tiny seed pearl. Your aunt says it is a start.",
            fx: {family:1,sta:.3,skill:{sea:1}},
          },
        ],
      },
      {
        id: "ww_ai_seedling",
        title: "Seedlings mean death",
        cond: (p,C)=>R(p,"POL-32")&&C.adult(p),
        w: .9,
        cool: 10,
        text: "A Keshi captain at the Keshi House on the harbor front offers you 12 amber dinars, more than three hundred suns, for six clove seedlings in wet moss. Smuggling clove or nutmeg seedlings off the isles is death, and the Sultan's men have been known to search the moss in a sailor's sea-chest.",
        choices: [
          {
            t: "Refuse him to his face",
            r: "He laughs and raises the price. You walk out. He finds someone hungrier the next day.",
            fx: {honor:2},
          },
          {
            t: "Report him to the Grand Vizier's men",
            check: {s:"intrigue",s2:"persuasion",d:40},
            win: {
              r: "The Keshi ship is searched at the chain. Seedlings in a water jar. The Vizier's man presses a gold dinar into your hand.",
              fx: {coin:27,favor:3},
            },
            lose: {
              r: "The Vizier's man is in the Keshi captain's pay. Somebody burns your boat that night.",
              fx: {coin:-20,happy:-5,wil:1},
            },
          },
          {
            t: "Dig up the seedlings for him",
            check: {s:"stealth",s2:"husbandry",d:60},
            win: {
              r: "Six seedlings out of a clove lord's garden at night, wrapped in moss, delivered. A fortune in gold, and a secret you will carry to the grave.",
              fx: {coin:320,honor:-10,flag:"ww_ai_seedling",trait:"paranoid"},
            },
            lose: {r:"The garden watchman has a dog.",fx:{die:"executed for smuggling clove seedlings"}},
          },
        ],
      },
      {
        id: "ww_ai_creekboys",
        title: "Past the scales",
        cond: (p,C)=>R(p,"POL-32")&&C.adult(p)&&(low(p)||is(p,"artisan")),
        w: 1,
        cool: 6,
        text: "All spice must be sold on Amberport's scales, where a fifth belongs to the Sultan and harbor dues take another fifth. The Creek Boys, boatmen of the back channels, run sacks out by night to Keshi captains beyond the chain. Your nutmeg trees gave a good crop, and a Creek Boy is sitting on your steps.",
        choices: [
          {
            t: "Sell to the Creek Boys",
            check: {s:"stealth",s2:"sea",d:42},
            win: {
              r: "Your sacks go out through the mangroves in a flat boat. The Keshi pay almost half again what the scales would.",
              fx: {coin:12,skill:{stealth:1},honor:-2},
            },
            lose: {r:"The harbor guard is waiting at the chain.",fx:{honor:-4,punish:"smuggling"}},
          },
          {
            t: "Sell honestly on the scales",
            r: "Two fifths gone before you are paid. The Well-Keepers audit the market roll every January, and your name is clean in it.",
            fx: {coin:6},
          },
          {
            t: "Bargain with the scale clerk for a better weight",
            check: {s:"trade",s2:"etiquette",d:44},
            win: {
              r: "Respect, patience and a gift of cloves for his wife. The weight comes out kinder than usual.",
              fx: {coin:9,skill:{trade:2}},
            },
            lose: {r:"He takes the cloves and the usual fifth.",fx:{coin:5}},
          },
        ],
      },
      {
        id: "ww_ai_rowroll",
        title: "The rowing rolls",
        cond: (p,C)=>R(p,"POL-32")&&grown(p,C)&&C.male(p)&&C.coast(p)&&!C.soldier(p),
        w: 1,
        cool: 7,
        text: "Coastal villages owe rowers, and this year the Sultan's fleet is sailing for the Isle of Pearls with Keshi ships, and the rowing rolls are 1,100 men short. The admiral's men are going house to house in the Stilt Town with a list and a drum.",
        choices: [
          {
            t: "Go with the fleet",
            check: {s:"sta",s2:"sea",d:40},
            win: {
              r: "Weeks of rowing in the heat, a beach landing at the Isle of Pearls, and a share of pearls when it is taken.",
              fx: {coin:15,skill:{sea:3},sta:.6,wil:1},
            },
            lose: {
              r: "Fever on the galley. Half the bench is sick, and you are one of them.",
              fx: {health:-15,skill:{sea:2},wil:1.5,cause:"galley fever"},
            },
          },
          {
            t: "Hide in the rafters until they pass",
            check: {s:"stealth",s2:"athletics",d:40},
            win: {r:"They search below the stilts and never look up.",fx:{skill:{stealth:1}}},
            lose: {r:"They find you and put you on the list first.",fx:{skill:{sea:2},wil:1,health:-6}},
          },
          {
            t: "Volunteer as a marine instead of a rower",
            req: (p,C)=>C.prof(p,"spear",30)||C.prof(p,"bow",30),
            r: "The Sultan's Marines take you gladly: boarding troops, better rations, first onto the beach.",
            fx: {job:"mercenary",skill:{sea:1,spear:2}},
          },
        ],
      },
      {
        id: "ww_ai_ribut",
        title: "Ribut datang",
        cond: (p,C)=>R(p,"POL-32")&&C.ageAdj(p)>=8,
        w: 1,
        cool: 4,
        text: '"Ribut datang," people are saying in the market: the storm is coming. The news is that the Sultan has a headache, and the Maruang feel a cyclone a day before it strikes. The sky is perfectly blue. It is September, the middle of the cyclone season.',
        choices: [
          {
            t: "Haul the boats up and tie down the roof",
            check: {s:"str",s2:"sea",d:32},
            win: {
              r: "By nightfall your boat is lashed to a palm and your roof is weighted with stones. The cyclone comes at midnight. In the morning your house is still standing.",
              fx: {str:.4,skill:{sea:1},happy:3},
            },
            lose: {
              r: "You run out of rope. The roof goes in the night, and half your things with it.",
              fx: {coin:-6,wil:1,happy:-4},
            },
          },
          {
            t: "Laugh. A headache is a headache",
            r: "The cyclone comes at midnight. Your boat is found three days later in a mangrove a mile inland.",
            fx: {coin:-12,wil:1.5,happy:-5},
          },
          {
            t: "Help the old woman next door",
            r: "Her shutters, her goats, her grandson's boat. Your own roof leaks all night. She sends you rice cakes for a month.",
            fx: {honor:3,coin:-2,happy:2},
          },
        ],
      },
      {
        id: "ww_ai_beachpyre",
        title: "Ashes to the sea",
        cond: (p,C)=>R(p,"POL-32")&&C.adult(p),
        w: .8,
        cool: 12,
        setup: (p,ctx)=>{ctx.dname=A.pick(["your father's brother","the old pearl diver who taught you to swim","your best friend from the Stilt Town","your grandmother"])},
        text: "{dname} has died. Court families bury their dead facing the Well of Samar, but commoners of the Isles burn their dead on the beach and give the ashes to the sea, and the Thousand Names receive them. The pyre is built at the tide line, and the family looks to you to light it.",
        choices: [
          {
            t: "Light the pyre and sing the sea-song",
            check: {s:"music",s2:"wil",d:28},
            win: {
              r: "Your voice holds through the whole song while the gongs beat slow. At dawn you carry the ashes out to the reef in a little boat.",
              fx: {wil:1.5,piety:2,happy:-3},
            },
            lose: {r:"Your voice breaks. Your cousin finishes the song with you.",fx:{wil:1.5,happy:-4}},
          },
          {
            t: "Light it in silence",
            r: "The fire takes, the sea takes, the night takes. You sit until the tide comes in.",
            fx: {wil:1.5,happy:-4},
          },
          {
            t: "Ask a Well-Keeper to say words too",
            r: "The court's faith and the village's, side by side on the sand. The Well-Keeper is kind, and nobody minds.",
            fx: {wil:1,piety:2,skill:{faith:1}},
          },
        ],
      },
      {
        id: "ww_ai_toddy",
        title: "Palm toddy",
        cond: (p,C)=>R(p,"POL-32")&&C.adult(p),
        w: .9,
        cool: 6,
        text: "At Mother Ayu's Stilts the palm toddy is sweet and strong, and the evening is long. Under the Book of Wells drunkenness is flogged, though in the Stilt Town people mostly follow the Thousand Names and the Well-Keepers mostly do not look. Tonight a new Well-Keeper's clerk is walking the lanes.",
        choices: [
          {
            t: "Have one cup, and walk home straight",
            r: "Sweet, cool, one cup. You nod politely to the clerk on the way home.",
            fx: {happy:2},
          },
          {
            t: "Drink with the sailors until the lamps are out",
            check: {s:"sta",s2:"stealth",d:38},
            win: {
              r: "Songs, stories, a fight about a girl from Tekook. You get home along the back walkways without meeting anyone.",
              fx: {happy:5,health:-2},
            },
            lose: {
              r: "The clerk finds you singing in a canal. Ten strokes in the Well Quarter in the morning, with a headache.",
              fx: {health:-8,honor:-3,wil:1,cause:"a flogging"},
            },
          },
          {
            t: "Warn the sailors that the clerk is coming",
            r: "The whole place goes very quiet and very sober. Mother Ayu gives you a free cup next time.",
            fx: {honor:1,newRel:{type:"friend",op:15}},
          },
        ],
      },
      {
        id: "ww_ai_water",
        title: "Water for a stranger",
        cond: (p,C)=>R(p,"POL-32")&&C.adult(p),
        w: .9,
        cool: 9,
        text: "A Cloudfolk hillman from the Amber Wilds comes out of the forest to your well, thin and painted, a spear across his back. The hill tribes raid the amber-gum tappers. But in the Isles, refusing water to a traveler is a grave crime under the Book of Wells, and fouling water is worse.",
        choices: [
          {
            t: "Draw him water and give him rice",
            r: "He drinks, bows, eats, and goes. Three weeks later a bundle of wild honey is left at your door with a single feather.",
            fx: {piety:3,honor:2,lang:"Cloudfolk"},
          },
          {
            t: "Give him water and send for the Highland Spears",
            r: "He drinks. By the time the soldiers come he is gone into the forest, and he will never trust a lowlander again.",
            fx: {piety:1,favor:1},
          },
          {
            t: "Drive him away from the well",
            check: {s:"intimidation",s2:"str",d:44},
            win: {
              r: "He backs off into the trees without his water. Your neighbors look at you as if you had spat in the well.",
              fx: {piety:-5,honor:-4},
            },
            lose: {
              r: "He does not back off.",
              fx: {
                piety: -5,
                duel: {
                  tier: 2,
                  title: "a Cloudfolk hillman",
                  troop: "SP",
                  opts: {kind:"duel",place:"your well",lethal:!1,toYield:!0,title:"At the well"},
                },
              },
            },
          },
        ],
      },
      {
        id: "ww_ai_amberpap",
        title: "Tapping the amber trees",
        cond: (p,C)=>R(p,"POL-32")&&grown(p,C)&&(C.terr(p,"forest","hills","mountains","marsh")||C.job(p,"labor","hunter")),
        w: 1,
        cool: 6,
        text: "In the Highland March around Aming, tappers cut the amber-gum trees and collect the sap in bamboo cups. House Batu pays by the cup. The Cloudfolk hill tribes raid the tappers, and the Amber Wyrms hunt in the same forest. Tappers die every season.",
        choices: [
          {
            t: "Tap deep in the forest where the trees are old",
            check: {s:"survival",s2:"ins",d:44},
            win: {
              r: "Old trees bleed thick gold sap. You fill twice the cups and come out before dark with your skin whole.",
              fx: {coin:9,skill:{survival:2}},
            },
            lose: {
              r: "Arrows from the trees. You run, dropping everything, and one arrow follows you a long way.",
              fx: {wound:"arrow_wound",health:-12,coin:-2,cause:"a Cloudfolk arrow"},
            },
          },
          {
            t: "Tap near the Aming Stockade",
            r: "Young trees, thin sap, safe ground. Half the pay and all of your blood.",
            fx: {coin:4},
          },
          {
            t: "Learn Cloudfolk words from an old tapper",
            check: {s:"learning",s2:"diplomacy",d:40},
            win: {
              r: 'He married a hill woman years ago. "Talk first," he says. "They kill tappers who never talk." You learn enough to talk.',
              fx: {lang:"Cloudfolk",skill:{diplomacy:2}},
            },
            lose: {r:'The words are all clicks and breath. You manage "hello" and "please".',fx:{skill:{diplomacy:1}}},
          },
        ],
      },
      {
        id: "ww_ai_wyrm",
        title: "The Wyrm Spears",
        cond: (p,C)=>R(p,"POL-32")&&grown(p,C)&&(C.prof(p,"spear",35)||C.trait(p,"brave","reckless")),
        w: .9,
        cool: 8,
        text: "At the Spear Yard of Aming, Bakar the Wyrm-Killer trains the Wyrm Spears: hunters who kill Amber Wyrms with heavy spears driven into the neck. The wyrms are as long as a galley and twice as patient. Bakar has a wyrm in a gully above the tappers' camp, and he wants one more spear.",
        choices: [
          {
            t: "Take a spear and go into the gully",
            r: "It is lying in the mud like a fallen tree, until it is not.",
            fx: {beast:{id:"CRE-05",place:"a gully above Aming",mod:.6,title:"The Amber Wyrm"}},
          },
          {
            t: "Train in the Spear Yard first",
            check: {s:"spear",s2:"str",d:46},
            win: {
              r: "A month of driving a spear into a stuffed wyrm's neck from every angle. Bakar says you might live through a real one.",
              fx: {skill:{spear:4},str:.5},
            },
            lose: {r:"You learn mostly how heavy a wyrm spear is.",fx:{skill:{spear:2},wound:"back",health:-4}},
          },
          {
            t: "Carry spears for the hunters and watch",
            r: "You see four men kill a wyrm and one man die doing it. You understand the bounty now.",
            fx: {wil:1,skill:{spear:1,tracking:1}},
          },
        ],
      },
      {
        id: "ww_ai_batik",
        title: "Wax and dye",
        cond: (p,C)=>R(p,"POL-32")&&C.adult(p)&&(is(p,"artisan")||C.female(p)),
        w: 1,
        cool: 7,
        text: "Batik cloth: hot wax drawn on cotton with a little copper pen, dyed, boiled, waxed again, dyed again, until the pattern blooms. A Lucernan factor at the Keshi House is paying well for batik with the old island patterns, the ones the grandmothers know.",
        choices: [
          {
            t: "Draw the old wave pattern from memory",
            check: {s:"craft",s2:"wil",d:40},
            win: {
              r: "Six colors, nine baths. The Lucernan holds it up to the light and pays a whole dinar without bargaining.",
              fx: {coin:27,skill:{craft:3},fame:1},
            },
            lose: {
              r: "The wax cracks in the third dye. The cloth is beautiful in a broken sort of way. He pays for a broken sort of cloth.",
              fx: {coin:5,skill:{craft:1}},
            },
          },
          {
            t: "Ask your grandmother to teach you her pattern",
            r: 'She teaches you slowly, scolding, through a whole monsoon. The pattern is called "the storm the Sultan felt".',
            fx: {skill:{craft:2},happy:3},
          },
          {t:"Sell plain cloth to the factor",r:"Plain cloth, plain price.",fx:{coin:3}},
        ],
      },
      {
        id: "ww_ai_bound",
        title: "Seven years",
        cond: (p,C)=>R(p,"POL-32")&&C.adult(p)&&C.poor(p),
        w: 1,
        cool: 10,
        text: `In the Amber Isles a debtor can be bound to labor for up to seven years. Your debt to a clove lord's steward has grown with "fees", since the Book forbids interest and lenders call it something else. The steward offers terms: five years in the clove gardens of Luesa.`,
        choices: [
          {
            t: "Accept the five years",
            r: "Five years of picking cloves before they open, drying them on mats, carrying them to the boats. You come out with clove-brown hands and no debt.",
            fx: {wil:2.5,sta:.8,skill:{husbandry:3},happy:-6},
          },
          {
            t: "Appeal to the Well-Keepers about the fees",
            check: {s:"faith",s2:"persuasion",d:46},
            win: {
              r: 'The Well-Keeper reads the contract and frowns at the word "fees". Your debt is cut by half and the years to two.',
              fx: {skill:{faith:2,persuasion:1},wil:1},
            },
            lose: {
              r: "The Well-Keeper finds the contract proper. Five years, and a sermon on prudence.",
              fx: {wil:2,happy:-6},
            },
          },
          {
            t: "Run for the hills",
            check: {s:"survival",s2:"stealth",d:50},
            win: {
              r: "You live with the tappers in the Highland March, where nobody asks about debts. You will never see the harbor again.",
              fx: {skill:{survival:3},wil:1.5,happy:-3},
            },
            lose: {r:"They catch you at the Aming road. Seven years now, not five.",fx:{wil:2.5,happy:-8,health:-5}},
          },
        ],
      },
      {
        id: "ww_ai_coconut",
        title: "The tallest palm",
        cond: (p,C)=>R(p,"POL-32")&&kid(p,C),
        w: 1,
        cool: 4,
        text: "The children of the Stilt Town climb palms for coconuts with a loop of rope around their ankles. The tallest palm on the beach leans out over the water, and nobody has climbed it this year. Your cousin says you are too small.",
        choices: [
          {
            t: "Climb the leaning palm",
            check: {s:"athletics",s2:"wil",d:20},
            win: {
              r: "Up and up, the trunk swaying over the sea. You throw down six coconuts and the whole beach cheers your name.",
              fx: {skill:{athletics:2},happy:5,fame:1},
            },
            lose: {r:"You slip halfway and drop into the sea. Better than the sand.",fx:{happy:-1,health:-1}},
          },
          {
            t: "Climb a small palm and share the nuts",
            r: "Smaller nuts, but you share them all. Your cousin stops saying you are too small.",
            fx: {happy:3,honor:1},
          },
        ],
      },
      {
        id: "ww_ai_bowl",
        title: "The pilot's bowl",
        cond: (p,C)=>R(p,"POL-32")&&grown(p,C)&&(C.job(p,"sailor")||C.prof(p,"sea",35)),
        w: 1,
        cool: 8,
        text: `"The pilot's bowl is not for looking," say the sailors. Only House Karang's sworn pilots may carry the needle bowl, and the pilots would sink a ship before showing a Keshi the floating needle. A Keshi pilot in the joint fleet buys you rice wine and asks, very casually, how your pilot finds north in fog.`,
        choices: [
          {
            t: "Say you have no idea, which is true",
            r: "He does not believe you, and tries again the next night. Then he tries somebody else.",
            fx: {},
          },
          {
            t: "Tell him a sailors' tale",
            check: {s:"deception",s2:"sea",d:40},
            win: {
              r: "A sea spirit whispers in the pilot's ear, you say, and only a Maruang can hear it. He writes it down very seriously.",
              fx: {skill:{deception:2},happy:2},
            },
            lose: {r:"He laughs at your tale. You have the feeling he already knows more than you.",fx:{happy:-1}},
          },
          {
            t: "Report his questions to the needle-guard",
            r: "Arif Senyap listens without blinking and thanks you. The Keshi pilot is moved to another ship the next day.",
            fx: {favor:2,honor:1},
          },
        ],
      },
    ]);
  })();
})();
