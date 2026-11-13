// The release's event pack 14 of 30 (192 events, mostly pp_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-028). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const rs = p=>A.realmShort(p.realm),
      where = p=>A.provName(p.home),
      early = ()=>!!(A.S&&A.S.year<=1110),
      free = p=>!["slave","serf"].includes(p.status)&&!(p.flags&&p.flags.unfree),
      SEX = (p,m,f)=>p.sex==="F"?f:m,
      ELFR = ["POL-06","POL-07"],
      DWR = ["POL-10","POL-28","POL-29"],
      ORCR = ["POL-11","POL-34"],
      GIR = ["POL-09","POL-23"],
      inR = (p,L)=>L.includes(p.realm),
      elfHome = p=>p.race==="elf"&&inR(p,ELFR),
      elfish = p=>(p.race==="elf"||p.race==="halfelf")&&inR(p,ELFR),
      dwHold = p=>p.race==="dwarf"&&inR(p,DWR),
      orcGrass = p=>(p.race==="orc"||p.race==="halforc")&&inR(p,ORCR),
      orcAny = p=>p.race==="orc",
      giHall = p=>p.race==="giant"&&inR(p,GIR),
      halfling = p=>p.race==="halfelf"||p.race==="halforc",
      jobIn = (p,...k)=>!!(p.job&&k.includes(p.job.c)),
      fx2 = (o,f)=>(p,ctx)=>{const a=A.applyFx(p,o,ctx)||"";return((f&&f(p,ctx)||"")+" "+a).trim()},
      epi = (key,o)=>fx2(o,(p,ctx)=>{const n=ctx&&ctx[key];return n&&!p.epithet?(p.epithet=n,A.ach("epithet"),`They call you ${n} now.`):""});
    function mk(p,race,o){o=o||{},race=race&&GD.RACES[race]?race:p.race;let cult=p.cult;try{race!==p.race&&(cult=A.cultureFor(race,p.realm)||p.cult)}catch{cult=p.cult}const R=GD.RACES[race],yrs=o.age!=null?o.age:Math.round(R.adult*(o.frac||1.2)+A.ri(0,Math.max(1,Math.round(R.adult*.5)))),sex=o.sex||(A.chance(.5)?"M":"F"),status=o.status||A.pick(["peasant","artisan","merchant",p.status||"peasant"]);let faith=p.faith;try{faith=A.faithFor(race,p.realm)||p.faith}catch{faith=p.faith}const q=A.newPerson({given:A.givenName(cult,sex),sex,race,realm:p.realm,cult,faith,born:A.S.year-Math.max(1,yrs),status:status==="royal"?"noble":status,home:p.home});try{const fn=A.familyName({cult,realm:p.realm,status:q.status,home:p.home,sex});q.sur=fn.sur,q.surMode=fn.mode}catch{}return q.occ=o.occ||(A.isAdult(q)?A.pick(A.OCC[q.status]||A.OCC.peasant):"a child"),q}
    function setPid(p,ctx,race,o){const q=mk(p,race,o);return ctx.pid=q.id,ctx.tHe=A.cap(A.he(q)),ctx.tWord=q.sex==="F"?"woman":"man",q}
    const nm = (p,sex)=>{try{return A.givenName(p.cult,sex||(A.chance(.5)?"M":"F"))}catch{return"Old Brand"}},
      humanName = (p,sex)=>{let c="CUL-02";try{c=A.cultureFor("human",p.realm)||"CUL-02"}catch{c="CUL-02"}try{return A.givenName(c,sex||(A.chance(.5)?"M":"F"))}catch{return"Godric"}},
      hall = p=>p.realm==="POL-23"?A.pick(["Jotunhall","Valdhall","Torholm","Valdgard"]):A.pick(["Skarfell","Torvik","Haugberg","Helstad","Ragvik"]),
      hold = p=>p.realm==="POL-28"?A.pick(["Kelfast","Mormund","Dramhall","Morhall"]):p.realm==="POL-29"?A.pick(["Kardeep","Gorhall","Tharmund","Maghelm"]):"Irondeep",
      clanO = ()=>A.pick(["Coalheart","Runecut","Slatebrow","Orehand","Stonebraid","Granitejaw","Shaftdelve","Copperbraid","Duskdelve","Mallethand"]),
      grove = p=>p.realm==="POL-07"?A.pick(["Ithira","Aerdor","Mirandor","Nimion","Fenandor"]):A.pick(["Lirith","Mirlas","Rinael","Fenali","Lirthil","Eridor","Aressa"]),
      orcClan = p=>p.realm==="POL-34"?A.pick(["Whitehorn","Harrak","Gorak","Dushdush","Krarog"]):A.pick(["Gashmar","Vrakoth","Goroth","Salt Edge","Skardush","Nagoth","Redhand"]),
      humanTown = p=>{try{const r=A.realm(p.realm);return r&&r.capital||where(p)}catch{return where(p)}};
    A.defEvents([
      {
        id: "pp_elf_greening",
        title: "The Greening",
        cond: (p,C)=>(elfish(p)||C.race(p,"elf")&&C.faith(p,"REL-04"))&&C.adult(p),
        w: 1,
        cool: 20,
        setup: (p,ctx)=>{ctx.dead=nm(p),ctx.how=A.pick(["a limb that came down in an ice storm","a fall from a wet branch","a cart that overturned on the road","a fever caught at a human market"])},
        text: p=>inR(p,ELFR)?"20 March, the Greening. Every household of {home} plants saplings over the year's dead. This year there is only one grave in the grove: {dead}, killed by {how}, the first death in eleven years. The whole grove has mourned since autumn. The Keeper hands you the sapling.":"20 March, the Greening, even here in {home}, far from any grove. The few elves of the town plant a sapling in a walled garden over {dead}, killed by {how}, the first of you to die here in a human lifetime. There is no Keeper. They hand the sapling to you.",
        choices: [
          {
            t: "Plant it and lead the wordless song",
            check: {s:"music",s2:"wil",d:36},
            win: {
              r: "Your voice carries across the snowmelt, and the grove answers from the branches. The Keeper touches the sapling and nods: it has taken.",
              fx: {piety:4,skill:{music:3,faith:1},honor:2},
            },
            lose: {
              r: "Your voice cracks on the long note. Nobody says anything. Elves will remember it for a century, kindly.",
              fx: {piety:2,wil:1,happy:-2},
            },
          },
          {
            t: "Ask the Keeper if {dead} is really in the tree now",
            check: {s:"faith",s2:"int",d:38},
            win: {
              r: '"Something of them," the Keeper says. "A child born near it may carry it. That is all the Covenant promises, and it is a great deal." You walk home lighter.',
              fx: {piety:3,int:.4,skill:{faith:2}},
            },
            lose: {
              r: 'The Keeper looks at you for a long time. "You have been listening to humans." The question follows you round the grove for years.',
              fx: {piety:-2,trait:"cynical"},
            },
          },
          {
            t: "Carry saplings to the burned ground at the Edge instead",
            check: {s:"sta",s2:"survival",d:34},
            win: {
              r: "Forty saplings on your back over two days, set in the black earth where the loggers burned. In three hundred years nobody will know there was a fire.",
              fx: {sta:.5,piety:3,honor:2},
            },
            lose: {
              r: "The load is too much for elven shoulders. You drop half on the way, and the Keeper sends a cart after you.",
              fx: {health:-4,wil:.8},
            },
          },
        ],
      },
      {
        id: "pp_elf_silentnight",
        title: "Silent Night",
        cond: (p,C)=>(elfish(p)||C.race(p,"elf")&&C.faith(p,"REL-04")&&C.terr(p,"forest","hills"))&&C.ageAdj(p)>=12,
        w: 1,
        cool: 20,
        setup: (p,ctx)=>{ctx.who=A.pick(["a party of human honey-buyers","two human pilgrims who lost the road","a human trader and his frightened son","a pair of human surveyors with a chain"]),ctx.Who=A.cap(ctx.who)},
        text: "21 June, the Silent Night. No lamp is lit anywhere in the forest, and every elf of {home} sits in the dark singing without words. Then you see it through the trunks: a lantern. {Who}, camped under the oaks, have lit a lamp on the one night of the year when nobody may.",
        choices: [
          {
            t: "Walk out of the dark and ask them to put it out",
            check: {s:"diplomacy",s2:"wil",d:34},
            win: {
              r: "They nearly die of fright when you speak at their shoulder. Then they blow out the lamp, and you sit with them in the dark until dawn and teach them the song.",
              fx: {honor:3,skill:{diplomacy:2},happy:3},
            },
            lose: {
              r: '"It is our lamp," says the man, and keeps it lit. You walk back to the grove with the light behind you like an insult.',
              fx: {happy:-3,wil:1},
            },
          },
          {
            t: "Put an arrow through the lantern from the dark",
            check: {s:"bow",s2:"ins",d:48},
            win: {
              r: "The glass bursts and the flame dies. In the black silence you hear them praying to their own gods. They leave at first light.",
              fx: {skill:{bow:3},fame:1},
            },
            lose: {
              r: "The arrow skips off the iron and into the fire. Sparks go up into the leaves, and you spend the rest of the night stamping them out with the humans.",
              fx: {skill:{bow:1},health:-3,honor:-1},
            },
          },
          {
            t: "Leave them. Keep singing",
            r: "The old ones notice that you let it be. Some think it kindness. Some think it is how the forest dies, one lamp at a time.",
            fx: {piety:1,trait:"patient"},
          },
        ],
      },
      {
        id: "pp_elf_leaffall_bouts",
        title: "The Leaf Fall bouts",
        cond: (p,C)=>C.realm(p,"POL-06")&&C.race(p,"elf","halfelf")&&C.adult(p)&&!C.old(p),
        w: 1,
        cool: 18,
        text: "22 September, Leaf Fall. In the bout-court at Evenglade the sword schools cross blunt blades to the first touch while the leaves come down. The bouts stop at dusk; no bout is ever fought by torchlight, and nobody will say why. A young blade of the Quickened looks along the rail and points his blunt sword at you.",
        choices: [
          {
            t: "Step into the court",
            check: {s:"sword",s2:"ins",d:54},
            win: {
              r: "He moves first, and you are not where his blade arrives. Your touch lands on his collarbone. The court goes quiet, then the Keepers call it.",
              fx: {skill:{sword:4},fame:3,happy:5,ins:.4},
            },
            lose: {
              r: "You never see the parry. The blunt point is on your throat a quarter second after you commit. He bows, kindly. You will dream about it for years.",
              fx: {skill:{sword:3},ins:.4,wil:1},
            },
          },
          {
            t: "Ask an old blade why there are never torches",
            check: {s:"intrigue",s2:"int",d:46},
            win: {
              r: "He tells you, very low: Sethril the Unwounded did not die in his sleep. He fought by torchlight in 877, the flicker took him with a fit, and he fell on a stone stair. The Quickened blood has a price.",
              fx: {skill:{intrigue:3},int:.5,flag:"pp_elf_torch"},
            },
            lose: {r:'"Because it is the custom," he says, and that is all you will ever get from him.',fx:{}},
          },
          {
            t: "Watch Vaelor the Unhurried stand in his low guard",
            r: "Three minutes without moving. When his man finally commits, the parry and the touch are one motion. You go home and stand in the yard until your legs shake.",
            fx: {ins:.6,skill:{sword:2},trait:"patient"},
          },
        ],
      },
      {
        id: "pp_elf_moot",
        title: "The Moot of Leaves",
        cond: (p,C)=>C.realm(p,"POL-06")&&C.race(p,"elf")&&C.age(p)>=100,
        w: 1,
        cool: 30,
        text: ()=>early()?"The Moot of Leaves sits under the First Oak at Evenglade. Queen Ithrien is 586 and the last Oakborn but one, and that one is her half-elf grandson Thalion. The law says a half-elf may not sit in the Moot, let alone wear the crown. The vote comes at Leaf Fall. Your grove has sent you to speak.":"The Moot of Leaves has argued for nine years over whether to reopen the forest edge to human traders, shut since the Black Cough. Nothing is decided quickly under the First Oak. Your grove has sent you to speak at last.",
        choices: [
          {
            t: "Speak for the old law, slowly and well",
            check: {s:"diplomacy",s2:"learning",d:48},
            win: {
              r: "You speak for two hours and quote the law back to the Dimming. The eldest nod. Your words will be repeated in the Moot for decades.",
              fx: {honor:4,fame:2,skill:{diplomacy:3,learning:1}},
            },
            lose: {
              r: "You speak for two hours. The Moot listens politely, and the Eldest Keeper thanks you for your youth.",
              fx: {happy:-3,wil:1,skill:{diplomacy:1}},
            },
          },
          {
            t: "Speak for change: the forest must bend or break",
            check: {s:"persuasion",s2:"wil",d:52},
            win: {
              r: '"Even an oak floats once it is cut," you say, and the young ones of the Moot stamp their feet on the roots. You have made friends, and enemies who will live four hundred years.',
              fx: {fame:3,honor:1,skill:{persuasion:3},newRel:{type:"rival",op:-20}},
            },
            lose: {
              r: "They hear a human argument in an elven mouth. The old ones turn their faces away, which in the Moot is a loud thing.",
              fx: {honor:-3,wil:1.5},
            },
          },
          {
            t: "Say nothing, and listen for ten years",
            r: "You sit at every session. You learn who speaks for whom, and why, and how slowly a forest makes up its mind.",
            fx: {skill:{learning:3,intrigue:2},int:.5,trait:"patient"},
          },
        ],
      },
      {
        id: "pp_elf_tithe",
        title: "The grove tithe",
        cond: (p,C)=>C.realm(p,"POL-06")&&C.race(p,"elf","halfelf")&&C.adult(p)&&free(p),
        w: 1,
        cool: 15,
        setup: (p,ctx)=>{ctx.days=A.ri(9,14)},
        text: "Every household of the grove owes the Keepers wax, honey, arrows and twenty days of work a year. The cold took half your hives this winter, and you have given only {days} days. Leaf Fall is a month away, and the Keeper of {home} has started counting.",
        choices: [
          {
            t: "Make up the honey in arrows instead",
            check: {s:"craft",s2:"bow",d:36},
            win: {
              r: "Two hundred shafts, straight as reeds, grey goose on every one. The Keeper weighs a handful and says the honey can wait.",
              fx: {skill:{craft:3},honor:2},
            },
            lose: {
              r: "Half warp in the damp. The Keeper hands them back one by one, without a word.",
              fx: {skill:{craft:1},honor:-2,happy:-2},
            },
          },
          {
            t: "Work the rest of your days on a cutting crew",
            check: {s:"sta",s2:"str",d:36},
            win: {
              r: "Deadfall and marked trees only, every stump thanked. You finish with a day to spare and shoulders like a human's.",
              fx: {str:.4,sta:.4,honor:2},
            },
            lose: {
              r: "A limb comes down wrong and opens your forearm. The Keeper counts the day anyway.",
              fx: {health:-6,wound:"deep_cut",wil:.8,cause:"a falling limb"},
            },
          },
          {
            t: "Pay in human silver from the edge-fair (12 suns)",
            req: p=>p.coin>=12,
            r: 'The Keeper takes it as if it were wet. "The grove cannot eat coin." It is accepted, and remembered.',
            fx: {coin:-12,honor:-1},
          },
        ],
      },
      {
        id: "pp_elf_edge_call",
        title: "Rangers of the Edge",
        cond: (p,C)=>C.realm(p,"POL-06")&&C.race(p,"elf","halfelf")&&C.adult(p)&&C.ageAdj(p)<50&&!C.flag(p,"pp_ranger"),
        w: 1.2,
        once: !0,
        text: "A grey-cloaked ranger walks into {home} with a bow on her back and a list in her head. Ranger-Captain Calithil Lightfoot wants more bows on the Oak Line, where human axes come every spring. Thirty years' service on the Edge, she says. A short term. You would be home before your mother noticed.",
        choices: [
          {
            t: "Swear thirty years to the Edge",
            r: "You learn the Eastern Edge tree by tree, and the long silence of a stand twelve metres up. The human side of the line is very loud.",
            fx: {flag:"pp_ranger",skill:{bow:4,stealth:3,survival:2},honor:2,gear:{ranged:"elfbow"}},
          },
          {
            t: "Ask for the Lightfoot Scouts, who fight from the branches",
            check: {s:"athletics",s2:"spd",d:46},
            win: {
              r: 'You drop eight metres from a branch, land rolling and come up with an arrow on the string. The Scout-captain says, "Again." You are one of them.',
              fx: {flag:"pp_ranger",skill:{athletics:4,bow:3,stealth:2},spd:.5,fame:1},
            },
            lose: {
              r: 'You land wrong and hear your ankle go. "Rangers, then," says the captain, not unkindly, while the healer binds it.',
              fx: {flag:"pp_ranger",health:-8,skill:{bow:2,athletics:1},wil:1},
            },
          },
          {
            t: "Decline. The grove needs hands more than the Edge needs bows",
            r: "She nods; she has heard it before. The nut gardens of {home} have never been better tended.",
            fx: {skill:{husbandry:3,survival:1},happy:2},
          },
        ],
      },
      {
        id: "pp_elf_edge_watch",
        title: "Axes at the stones",
        cond: (p,C)=>C.realm(p,"POL-06")&&C.race(p,"elf","halfelf")&&C.adult(p)&&(C.flag(p,"pp_ranger")||C.prof(p,"bow",45)),
        w: 1.2,
        cool: 10,
        setup: (p,ctx)=>{ctx.n=A.ri(8,14),ctx.stones=A.pick(["the Foxhurst stones","the stones below Aeravel","the old boundary stones at Oakreach"])},
        text: "Dawn mist at {stones}. There are {n} men of Aldmark on the wrong side of the Oak Line with axes, ropes and an ox team, and their foreman is already marking an oak a thousand years old. Three warnings have been given this spring. Nobody outside the rangers knows what the seventh clause of 1079 allows.",
        choices: [
          {
            t: "Shadow them through the branches and wait for the signal",
            check: {s:"stealth",s2:"bow",d:46},
            win: {
              r: "The signal never comes; the foreman sees a grey shape in every tree and loses his nerve. They leave the ox and run. Not one arrow was loosed.",
              fx: {skill:{stealth:3,bow:1},honor:2,fame:1},
            },
            lose: {
              r: "A branch cracks under you. The men scatter for the trees, and someone throws an axe that misses you by a hand.",
              fx: {skill:{stealth:1},wil:1,health:-3},
            },
          },
          {
            t: "Shoot the foreman before the first cut",
            check: {s:"bow",s2:"ins",d:50},
            win: {
              r: "One arrow at a hundred and forty paces. The others drop their axes and back away over the stones, dragging him. The line holds, and Aldmark will hear of it.",
              fx: {skill:{bow:4},fame:3,honor:-2,merit:2},
            },
            lose: {
              r: "The mist moves and your arrow takes a man beside him in the leg. Now they know where you are.",
              fx: {
                duel: {
                  tier: 2,
                  title: "an Aldmark woodsman with an axe",
                  opts: {kind:"duel",place:"the Oak Line",lethal:!0,toYield:!1,title:"Under the oaks"},
                },
              },
            },
          },
          {
            t: "Walk out of the trees and give the fourth warning",
            check: {s:"intimidation",s2:"wil",d:44},
            win: {
              r: "One elf in the open, and forty bows they cannot see. The foreman counts the trees, takes his men and goes.",
              fx: {honor:4,skill:{intimidation:3},wil:1},
            },
            lose: {
              r: "The foreman laughs at one elf in the open. Then the rangers in the branches begin to shoot, and it is very quick.",
              fx: {honor:1,happy:-6,wil:2},
            },
          },
        ],
      },
      {
        id: "pp_elf_starlight",
        title: "The Starlight Range",
        cond: (p,C)=>C.realm(p,"POL-06")&&C.race(p,"elf","halfelf")&&C.adult(p)&&(C.prof(p,"bow",30)||C.flag(p,"pp_ranger")),
        w: 1,
        once: !0,
        text: "A moonless night on the Starlight Range of Lirith. The mark is a pale disc a hundred and fifty paces off between the trunks, and you can barely see it. Aelar the Silent stands behind you and says nothing, as he has said nothing in the Moot for sixty-eight years. Three arrows.",
        choices: [
          {
            t: "Breathe out, and loose in the stillness between heartbeats",
            check: {s:"bow",s2:"wil",d:56},
            win: {
              r: "Three soft knocks out in the dark. Aelar touches your shoulder once and walks away. Next week you are on the Range again, by his choice.",
              fx: {skill:{bow:5,stealth:1},fame:2,flag:"pp_elf_silent",apt:{bow:1.25}},
            },
            lose: {
              r: "One knock. Two arrows somewhere in the night forest. Aelar hands you a fourth arrow without a word, which is the kindest thing anyone has done for you this year.",
              fx: {skill:{bow:3},wil:1},
            },
          },
          {
            t: "Shoot fast, by instinct, before your eyes can doubt",
            check: {s:"bow",s2:"ins",d:54},
            win: {
              r: 'Three arrows in ten heartbeats, all three on the disc. Aelar makes a small sign with his hand. The Silent use it for "yes".',
              fx: {skill:{bow:4},ins:.6,fame:1},
            },
            lose: {
              r: "Too fast. The first arrow hits; the others go into a beech. The tree, you suspect, will hold it against you.",
              fx: {skill:{bow:2}},
            },
          },
          {
            t: "Lower the bow. You will not shoot at what you cannot see",
            r: 'Aelar nods slowly. It is his own rule. "Come back on a night with stars," he signs.',
            fx: {trait:"cautious",skill:{bow:1},honor:1},
          },
        ],
      },
      {
        id: "pp_elf_grandson",
        title: "A face from the edge-fair",
        cond: (p,C)=>elfHome(p)&&C.age(p)>=120,
        w: 1,
        cool: 35,
        setup: (p,ctx)=>{setPid(p,ctx,"human",{frac:1.2,sex:"M"}),ctx.old=humanName(p,"M"),ctx.gift=A.pick(["the bone-handled knife","the little yew bow","the honey-crock with the leaf on its lid"])},
        text: 'A young human waits at the boundary stones, cap in hand, asking for you by name. He is {themFull}, and his great-grandfather {old} traded salt with you "when he was young". He carries {gift} you gave the old man. To you it was the spring before last.',
        choices: [
          {
            t: "Sit with him at the stones and tell him about {old}",
            r: "{old} was loud, and generous, and terrible at haggling. You tell it all. {them} laughs and cries at once, and comes back every Leaf Fall after.",
            fx: {happy:4,wil:1,them:{type:"friend",op:35}},
          },
          {
            t: "Trade with him as you traded with {old}",
            check: {s:"trade",s2:"int",d:36},
            win: {
              r: "He haggles exactly like his great-grandfather, badly. You let him win, as you let {old} win, and you both go home pleased.",
              fx: {coin:10,skill:{trade:2},them:{type:"friend",op:25}},
            },
            lose: {
              r: "He haggles nothing like {old}. He cheats you a little, and you only notice afterwards. Humans change between generations; it is easy to forget.",
              fx: {coin:-4,them:{type:"acquaint",op:5}},
            },
          },
          {
            t: "Send him away. You cannot love a fourth generation of them",
            r: "He goes. You stand at the stones until dark. It was the right thing, you tell yourself, for the next three hundred years.",
            fx: {wil:1.5,happy:-4,trait:"stoic"},
          },
        ],
      },
      {
        id: "pp_elf_teacher_return",
        title: '"Vael, vael"',
        cond: (p,C)=>C.race(p,"elf")&&C.age(p)>=90&&C.adult(p),
        w: .9,
        cool: 40,
        setup: (p,ctx)=>{ctx.girl=humanName(p,"F"),ctx.yrs=A.ri(35,50),ctx.skill=A.pick(["to draw a bow from the back, not the shoulder","to find honey by watching the bees","to set a snare for hare","to read the weather in the leaves"])},
        text: `You go back to the human village at the forest's edge, meaning to see {girl}, the girl you taught {skill}. It has been "a little while". It has been {yrs} years. An old woman with her eyes answers the door, and three children behind her are doing it your way.`,
        choices: [
          {
            t: "Stay a season, and teach the grandchildren",
            r: '"Vael, vael," you tell them: slowly, slowly. They think it means "well done". {girl} watches from the doorway and says nothing, and that is enough.',
            fx: {happy:5,wil:1,newRel:{type:"friend",op:30}},
          },
          {
            t: "Sit with {girl} and remember",
            r: "She remembers the day far better than you do. Humans keep their few years close. You envy her, a little, for the first time.",
            fx: {wil:1.5,happy:1,int:.3},
          },
          {
            t: "Leave before she sees your young face",
            r: "You go back into the trees. Some things are crueller to the short-lived than to you.",
            fx: {happy:-3,wil:1,trait:"shy"},
          },
        ],
      },
      {
        id: "pp_elf_fade",
        title: "The fade",
        cond: (p,C)=>C.race(p,"elf")&&C.age(p)>=340,
        w: 1.5,
        once: !0,
        text: "At the butts this morning a ranger of ninety beat you, three shafts to two. It is not luck. Your draw has come down a hand's weight this decade, your fingers are a shade slower on the string, and the cold sits in your joints after the Greening. The slow fade comes to every elf past three hundred and fifty. It has come to you.",
        choices: [
          {
            t: "Train harder. The fade can be slowed",
            check: {s:"wil",s2:"sta",d:48},
            win: {
              r: "Every dawn at the butts, every dusk on the climbing rope. It costs you, but you are winning three in five again. For now.",
              fx: {wil:2,sta:.6,skill:{bow:2,athletics:2}},
            },
            lose: {
              r: "You tear something in your shoulder. The healer says what everyone is thinking: rest, old one.",
              fx: {health:-8,wound:"back",wil:1.5},
            },
          },
          {
            t: "Take students. Pass it on while the hands remember",
            r: "You find two young ones with good eyes and bad habits. Everything you know goes into them, one patient correction at a time.",
            fx: {skill:{learning:3},honor:3,happy:3,newRel:{type:"friend",op:35}},
          },
          {
            t: "Hide it. Nobody needs to know",
            check: {s:"deception",s2:"wil",d:42},
            win: {
              r: "You shoot fewer arrows, slower, and choose your marks. Nobody notices. You notice every day.",
              fx: {trait:"proud",wil:1},
            },
            lose: {r:"The young ones notice. They are very kind about it, which is worse.",fx:{happy:-5,wil:1.5}},
          },
        ],
      },
      {
        id: "pp_elf_lastgrove",
        title: "Where your tree will grow",
        cond: (p,C)=>C.race(p,"elf")&&C.age(p)>=375&&!C.flag(p,"pp_elf_chosen"),
        w: 1.4,
        once: !0,
        text: 'The Keeper of your grove comes with a basket of acorns and beechmast and sits beside you without hurrying. Stone burial is forbidden; you will lie under a sapling, and your life will pass into the tree. "Where?" the Keeper asks. "There is no hurry. But there is less hurry than there was."',
        choices: [
          {
            t: "Beside your birth tree, where you were named",
            r: "The Keeper marks the place with a cut of bark. Your name is still on the old tree, grown deep into it. It will have company.",
            fx: {piety:4,happy:3,flag:"pp_elf_chosen"},
          },
          {
            t: "At the Edge, where you stood against the axes",
            r: 'An oak on the Oak Line, facing the human farms. "So they will see it," you say. The Keeper writes it down.',
            fx: {honor:3,fame:1,wil:1,flag:"pp_elf_chosen"},
          },
          {
            t: "Outside the line, near the graves of human friends",
            r: 'The Keeper is silent a long time. "It is allowed," at last. "It is not done." You do not mind being the first.',
            fx: {honor:-2,happy:4,trait:"kind",flag:"pp_elf_chosen"},
          },
          {
            t: "On a hill facing the sea, as Eldergrove does",
            req: (p,C)=>C.realm(p,"POL-07"),
            r: 'A fir on the headland above the ship-houses. Some day, perhaps, a keel. "Sail on me," you tell your grandchildren, and they laugh.',
            fx: {piety:3,happy:4,flag:"pp_elf_chosen"},
          },
        ],
      },
      {
        id: "pp_elf_chronicle",
        title: "The chronicler asks",
        cond: (p,C)=>elfHome(p)&&C.age(p)>=150,
        w: .9,
        cool: 40,
        setup: (p,ctx)=>{ctx.who=p.realm==="POL-07"?"Lirael the Archivist of Silverbough":"Faelwen the Chronicler of Evenglade";const a=A.age(p);ctx.what=a>=200&&A.chance(.5)?"the year the Moot shut the forest edge against the Black Cough, and the human traders wept at the stones":a>=80&&A.chance(.5)?"the death of Prince Caelan, gored by an aurochs near Lirthil in 1036":"the night of 23 September 1078, when the rangers dropped into the logging camps"},
        text: '{who} comes with wax tablets and a great deal of patience. Elves remember in millennia, but only if someone writes it down. She wants your memory of {what}. "Exactly as you saw it," she says. "Not as the songs have it."',
        choices: [
          {
            t: "Tell it exactly, even the parts that shame your own kin",
            check: {s:"int",s2:"learning",d:38},
            win: {
              r: "Three days of careful remembering. She reads it back to you, and it is true. In a thousand years someone will know.",
              fx: {int:.6,skill:{learning:3},honor:3},
            },
            lose: {
              r: "You find you remember less than you thought, and some of it from songs. She is gentle about it.",
              fx: {int:.3,wil:.8},
            },
          },
          {
            t: "Shade it to flatter your line",
            check: {s:"deception",s2:"int",d:44},
            win: {
              r: "Your grandmother comes out of it braver than she was. The tablets will be read for centuries.",
              fx: {skill:{deception:2},honor:-2,fame:1},
            },
            lose: {
              r: "The chronicler has heard three other versions already. Yours is noted, with a comment in the margin.",
              fx: {honor:-4},
            },
          },
          {
            t: "Refuse. Some things should be allowed to die",
            r: '"Nothing is allowed to die here," she says, and goes away disappointed. You sleep better than you expected.',
            fx: {wil:1,trait:"stubborn"},
          },
        ],
      },
      {
        id: "pp_elf_grudge",
        title: "A grudge two centuries old",
        cond: (p,C)=>C.race(p,"elf")&&C.adult(p),
        w: .9,
        cool: 40,
        setup: (p,ctx)=>{setPid(p,ctx,"human",{status:"merchant",sex:"M"}),ctx.yr=A.ri(860,940),ctx.wrong=A.pick(["burned your grandmother's grove-garden to clear a pasture","shot your great-uncle for a deer thief","cheated the grove of a whole year's wax and laughed about it"])},
        text: "At the market a cheerful human merchant, {themFull}, wants your honey. You know the name. In {yr} his great-great-grandfather {wrong}. The man has no idea; to him it is ancient history. Elves hold grudges longer than human kingdoms last.",
        choices: [
          {
            t: "Refuse to trade with his line, and tell him why",
            r: "He listens, baffled, then angry, then oddly ashamed. He leaves without your honey. Somewhere in the grove, your grandmother is satisfied.",
            fx: {honor:2,trait:"vengeful",them:{type:"rival",op:-15}},
          },
          {
            t: "Trade, but squeeze him for every sun the grove lost",
            check: {s:"trade",s2:"int",d:42},
            win: {
              r: "He pays half again what the honey is worth and thanks you for it. The debt is paid, a little, and he will never know.",
              fx: {coin:25,skill:{trade:3}},
            },
            lose: {
              r: "He is a better haggler than his ancestor was a woodsman. You sell at a loss, and the grudge grows another ring.",
              fx: {coin:-5,happy:-3},
            },
          },
          {
            t: "Let it go. He is not the man who did it",
            r: "It takes everything you have. You sell him the honey at a fair price, and the old weight lifts a little for the first time in two hundred years.",
            fx: {trait:"forgiving",wil:2,happy:2,them:{type:"acquaint",op:10}},
          },
        ],
      },
      {
        id: "pp_elf_edgefair",
        title: "The edge-fair at Rinael",
        cond: (p,C)=>C.realm(p,"POL-06")&&C.race(p,"elf","halfelf")&&C.adult(p),
        w: 1,
        cool: 15,
        setup: (p,ctx)=>{ctx.champ=humanName(p,"M"),ctx.fair=A.pick(["Rinael","Fenali"])},
        text: 'The edge-fair at {fair}: elven honey, wax and arrows set out on the stones, human iron, salt and wool across the line. A big human swordsman, {champ}, has come up from the Marches to try the Oak Line, as they have for centuries. "First blood, a purse of twenty suns. Any elf."',
        choices: [
          {
            t: "Take the bout",
            r: "The crowd forms a ring on both sides of the stones.",
            fx: {
              duel: {
                tier: 2,
                title: "a Marches sword champion",
                opts: {kind:"duel",place:"the edge-fair",lethal:!1,toYield:!0,title:"First blood at the stones"},
              },
            },
          },
          {
            t: "Work the honey stall while everyone watches the bout",
            check: {s:"trade",s2:"int",d:36},
            win: {
              r: "Humans spend freely when they are excited. You sell the whole season's honey before the first touch.",
              fx: {coin:20,skill:{trade:2}},
            },
            lose: {r:"Someone lifts two crocks of honey while you watch the fight too.",fx:{coin:-4}},
          },
          {
            t: "Interpret for the human traders and the Keepers",
            check: {s:"diplomacy",s2:"learning",d:34},
            win: {
              r: "You settle three quarrels about weights and one about a dog. Both sides tip you, which elves do not usually do.",
              fx: {coin:8,skill:{diplomacy:2},lang:"Northfolk"},
            },
            lose: {
              r: "You get a word wrong, and a salt merchant thinks a Keeper called him a pig. It takes an hour to unwind.",
              fx: {skill:{diplomacy:1}},
            },
          },
        ],
      },
      {
        id: "pp_elf_honey",
        title: "The Wax Circle",
        cond: (p,C)=>C.realm(p,"POL-06")&&C.race(p,"elf","halfelf")&&C.adult(p)&&free(p),
        w: .9,
        cool: 20,
        setup: (p,ctx)=>{ctx.buyer=A.pick(["a Varennan chandler","a Solenne church factor buying candle wax","an Aldmark merchant with a Kingsmere seal"]),ctx.Buyer=A.cap(ctx.buyer)},
        text: "The Wax Circle of Evenglade, under Caerwen Honeyhand, sets how much wax and honey leaves the forest and at what price. {Buyer} meets you in the dusk at the edge and offers double the Circle's price for forty pounds of wax, no questions, no Circle.",
        choices: [
          {
            t: "Sell to him quietly",
            check: {s:"stealth",s2:"trade",d:42},
            win: {
              r: "Forty pounds of wax across the line under a load of firewood. You are richer, and the Circle never knows.",
              fx: {coin:45,honor:-3,skill:{trade:2}},
            },
            lose: {
              r: "Caerwen's people are watching that path. The Circle fines you a year's wax, and everyone in the grove hears.",
              fx: {coin:-15,honor:-6,happy:-3},
            },
          },
          {
            t: "Tell him to go through the Circle like everyone else",
            r: "He curses in Solen and goes. Caerwen Honeyhand hears of it, and nods to you at the Greening.",
            fx: {honor:3,favor:2},
          },
          {
            t: "Bargain him into the Circle, for a finder's share",
            check: {s:"persuasion",s2:"trade",d:44},
            win: {
              r: "He buys through the Circle at a fair price, and Caerwen pays you a tenth for bringing him. Everyone wins but the smugglers.",
              fx: {coin:18,skill:{persuasion:2,trade:2},honor:1},
            },
            lose: {r:"He thinks you are angling for a bribe, and goes off to find a cheaper elf.",fx:{}},
          },
        ],
      },
      {
        id: "pp_elf_aurochs",
        title: "The aurochs in the gardens",
        cond: (p,C)=>elfish(p)&&C.adult(p)&&!C.old(p),
        w: .9,
        cool: 20,
        text: "At dawn you hear wood breaking in the nut gardens below the grove-houses. An aurochs bull, black, as tall at the shoulder as a man, is tearing down the hazels. Humans think the last of them died around 700. Prince Caelan was gored by one near Lirthil in 1036, and the queen has not hunted since.",
        choices: [
          {
            t: "Take your spear down to it",
            r: "It lifts its head. It has seen you.",
            fx: {beast:{id:"CRE-20",place:"the nut gardens",mod:.75}},
          },
          {
            t: "Shoot from the grove-house balcony",
            req: (p,C)=>C.prof(p,"bow",35),
            check: {s:"bow",s2:"ins",d:50},
            win: {
              r: "Two arrows behind the shoulder, and it goes down in the hazels. The whole grove eats well, and they carve the horns for you.",
              fx: {skill:{bow:3},fame:2,happy:4,coin:6},
            },
            lose: {
              r: "Your arrows only anger it. It smashes two hives and crashes off into the deep wood, bleeding. Somewhere out there is now a wounded bull.",
              fx: {happy:-4,skill:{bow:1}},
            },
          },
          {
            t: "Stay up the tree, bang a pot and wait",
            check: {s:"wil",s2:"int",d:30},
            win: {
              r: "It takes an hour, but the noise wears on it and it wanders off. You lose a row of hazels, not a life.",
              fx: {trait:"cautious",happy:-1},
            },
            lose: {
              r: "It strips the whole garden while you bang the pot. The grove will eat thin this winter.",
              fx: {happy:-4,coin:-5,wil:.6},
            },
          },
        ],
      },
      {
        id: "pp_elf_greystag",
        title: "The Grey Stag",
        cond: (p,C)=>elfish(p)&&C.ageAdj(p)>=14,
        w: .7,
        cool: 40,
        text: "Deep in the old-growth, where few even of your people walk, you see it: the Grey Stag, pale as ash, antlers like a dead oak. Humans think it extinct and sell its shed antlers in Kingsmere as giant bones. Beside its track in the moss you find another: a human boot, and the scrape of a crossbow butt.",
        choices: [
          {
            t: "Track the poacher",
            check: {s:"tracking",s2:"stealth",d:46},
            win: {
              r: "You find him at dusk, waiting in a blind. He never hears you until your knife is at his ear. He walks south without his crossbow, and very fast.",
              fx: {skill:{tracking:3,stealth:2},honor:3,fame:1},
            },
            lose: {
              r: "The trail goes cold in a stream. Two days later you hear a crossbow in the distance, once.",
              fx: {happy:-5,wil:1,skill:{tracking:1}},
            },
          },
          {
            t: "Follow the Stag instead, and watch it until dark",
            r: "It never once looks at you, and you never once breathe loudly. Some things are worth having seen, and telling nobody.",
            fx: {happy:6,piety:3,skill:{stealth:2}},
          },
          {
            t: "Run for the rangers",
            check: {s:"athletics",s2:"spd",d:38},
            win: {
              r: "The rangers are there by nightfall. The poacher is taken with a sack of antler and a shocked expression.",
              fx: {honor:2,favor:2,sta:.3},
            },
            lose: {r:"By the time you find the rangers the trail is a day old.",fx:{wil:.5}},
          },
        ],
      },
      {
        id: "pp_elf_wolves",
        title: "Wolves at the hives",
        cond: (p,C)=>elfish(p)&&C.ageAdj(p)>=14&&!C.old(p),
        w: .8,
        cool: 20,
        text: "Deep winter. The Evenwood wolves, the size the Northfolk tales say, have come down to the hive-stands wrapped in straw. They are not after honey. A human woodcutter's child from the edge farms wandered in after them, and is up a beech, crying, with three grey shapes circling below.",
        choices: [
          {
            t: "Drop down between the wolves and the tree",
            r: "The biggest turns its yellow eyes to you.",
            fx: {honor:3,beast:{id:"CRE-21",place:"the hive-stands",mod:.8}},
          },
          {
            t: "Shoot from the next tree over",
            check: {s:"bow",s2:"ins",d:46},
            win: {
              r: "The lead wolf falls; the others melt into the snow. You walk the child home to the edge farm, and the father kneels in the snow.",
              fx: {skill:{bow:3},honor:4,fame:2},
            },
            lose: {
              r: "You wound one, and the pack scatters for now. The child is safe. The wolves will remember the hives.",
              fx: {skill:{bow:1},honor:2},
            },
          },
          {
            t: "Climb up to the child and wait for dawn together",
            check: {s:"sta",s2:"wil",d:36},
            win: {
              r: "A long freezing night, singing to a human child in the dark. At dawn the wolves give up. So, very nearly, do your fingers.",
              fx: {wil:1.5,honor:3,newRel:{type:"friend",op:20}},
            },
            lose: {
              r: "The cold gets into your hands before dawn. The child lives; two of your fingers do not feel right again.",
              fx: {wound:"frostbite",wil:1.5,honor:3},
            },
          },
        ],
      },
      {
        id: "pp_elf_fire",
        title: "Open fire in the deep forest",
        cond: (p,C)=>C.realm(p,"POL-06")&&C.race(p,"elf","halfelf")&&C.adult(p),
        w: .8,
        cool: 25,
        setup: (p,ctx)=>{ctx.who=A.pick(["a half-elf hunter who should know better","three human mercenaries going north","a young elf back from the human towns, showing off"]),ctx.Who=A.cap(ctx.who)},
        text: "You smell it at a hundred paces downwind: woodsmoke, deep inside the forest where no fire may burn. {Who} have built a campfire in a hollow of dry leaves. An elf who lights an open fire in the deep forest is exiled for a hundred years.",
        choices: [
          {
            t: "Kick the fire apart and bury it, then deal with them",
            check: {s:"intimidation",s2:"str",d:42},
            win: {
              r: "You bury the coals with your hands and look at them until they pack up. Nobody argues with an elf who has just put out a fire barehanded.",
              fx: {honor:3,skill:{intimidation:2},wound:"burn"},
            },
            lose: {
              r: "They laugh at you, and one shoves you into the leaves. The fire spreads a little before you finally smother it.",
              fx: {health:-6,wil:1,honor:1},
            },
          },
          {
            t: "Report it to the Keepers and let the law work",
            r: "The Keepers come at dawn with rangers. You never learn the sentence. You hear only that a century is a long time even for an elf.",
            fx: {piety:2,favor:2},
          },
          {
            t: "Sit down at their fire and talk them into putting it out",
            check: {s:"persuasion",s2:"int",d:40},
            win: {
              r: "An hour later they are cold, sullen and alive, and so is the forest. They will not light another.",
              fx: {skill:{persuasion:2},honor:2},
            },
            lose: {
              r: "They think you want their supper. You leave hungry, and the fire burns until dawn.",
              fx: {happy:-3},
            },
          },
        ],
      },
      {
        id: "pp_elf_keepermark",
        title: "A room for the child",
        cond: (p,C)=>C.realm(p,"POL-06")&&C.race(p,"elf")&&C.adult(p)&&(C.married(p)||C.hasKids(p)),
        w: .9,
        cool: 40,
        text: `Your grove-house is timber laid across the limbs of three living oaks, and it needs a fourth room. That means planks, and planks mean a Keeper's mark on a living tree. You asked six years ago. The Keeper of {home} is "still listening to the trees". Cutting without a mark is a hundred years' exile.`,
        choices: [
          {
            t: "Wait. The trees are in no hurry, and neither are you",
            r: "In the ninth year the mark comes: an old beech, already half dead. The room is beautiful. The child who needed it is grown.",
            fx: {trait:"patient",wil:1,happy:1},
          },
          {
            t: "Build from deadfall and storm-wood only",
            check: {s:"craft",s2:"int",d:40},
            win: {
              r: "It takes two winters of hauling fallen limbs, but the room is sound, and no tree had to forgive you.",
              fx: {skill:{craft:4},piety:2},
            },
            lose: {
              r: "The deadfall planks warp, and the floor sags. The child loves it anyway.",
              fx: {skill:{craft:2},happy:-1},
            },
          },
          {
            t: "Cut a young ash at night, and hope",
            check: {s:"stealth",s2:"craft",d:52},
            win: {
              r: "Nobody sees, and the room goes up. You never stop looking at the stump when you pass it.",
              fx: {happy:2,piety:-5,trait:"deceitful"},
            },
            lose: {
              r: "The Keeper reads the stump like a letter. You are exiled from the forest for a hundred years.",
              fx: {piety:-8,honor:-10,happy:-15,wil:3,flag:"pp_elf_exiled"},
            },
          },
        ],
      },
      {
        id: "pp_elf_century_child",
        title: "A child ninety years after the first",
        cond: (p,C)=>elfHome(p)&&C.adult(p)&&C.hasKids(p)&&C.age(p)>=140,
        w: 1,
        once: !0,
        text: "A second child, born ninety years after your first. Your elder is a ranger at the Oak Line who comes home once a decade and holds the baby like a strange bird. Elven numbers have barely grown in a thousand years; the whole grove comes to see, and the Keeper plants the birth tree.",
        choices: [
          {
            t: "Ask your elder to stay home for the child's first decade",
            check: {s:"persuasion",s2:"wil",d:40},
            win: {
              r: "Ten years at home. The two of them become something like siblings, and something like strangers who are fond of each other.",
              fx: {happy:6,honor:1},
            },
            lose: {r:'"The Edge needs me," says your elder. They write. It is something.',fx:{happy:-2,wil:1}},
          },
          {
            t: "Choose the tree yourself: an oak above the stream",
            r: "The Keeper agrees. The child's name is cut in the bark, and the bark will grow round it, as yours did.",
            fx: {piety:3,happy:5},
          },
          {
            t: "Give the grove a feast of honey and venison",
            req: p=>p.coin>=15,
            r: "Every household comes, and the Silent Night songs are sung early. A child is the rarest thing in the Evenwood.",
            fx: {coin:-15,honor:3,happy:5,fame:1},
          },
        ],
      },
      {
        id: "pp_elf_petition",
        title: "The Moot answers",
        cond: (p,C)=>C.realm(p,"POL-06")&&C.race(p,"elf")&&C.age(p)>=80,
        w: .8,
        cool: 40,
        setup: (p,ctx)=>{ctx.y=A.ri(12,18),ctx.miller=humanName(p,"M")},
        text: "It is {y} years since you petitioned the Moot of Leaves: a human mill upstream of {home} was fouling your stream with flax-water. Today a warden of the Moot arrives with the answer: the Moot agrees, and the miller must stop. The miller, {miller}, died three winters ago. His son runs the mill, and has five children.",
        choices: [
          {
            t: "Enforce it. The law is the law",
            check: {s:"intimidation",s2:"diplomacy",d:40},
            win: {
              r: "The son stops retting flax in the stream and digs a pond, cursing elves. Your stream runs clear by summer.",
              fx: {honor:2,happy:3,skill:{intimidation:2}},
            },
            lose: {
              r: "He takes it to Aldmark's reeve, who takes it to a lord, who mentions it at court. Now it is a quarrel between realms, and it will outlive you.",
              fx: {happy:-3,wil:1},
            },
          },
          {
            t: "Go and talk to the son yourself",
            check: {s:"diplomacy",s2:"int",d:38},
            win: {
              r: 'He did not know there was a petition. You dig the retting pond together in a week. His youngest calls you "the tall aunt".',
              fx: {honor:3,skill:{diplomacy:2},newRel:{type:"friend",op:25}},
            },
            lose: {
              r: "He is his father's son. Nothing changes but the name of the man you are angry with.",
              fx: {wil:.8},
            },
          },
          {
            t: "Withdraw the petition. It was for a dead man",
            r: "The warden looks at you as if you had spat in the First Oak. Seventeen years of the Moot's time, wasted. Nobody will forget it.",
            fx: {honor:-2,trait:"forgiving"},
          },
        ],
      },
      {
        id: "pp_elf_quickened",
        title: "Lightning through the leaves",
        cond: (p,C)=>C.race(p,"elf","halfelf")&&C.blood(p,"quickened")&&C.ageAdj(p)>=10,
        w: 1.3,
        cool: 12,
        text: "A summer storm over the forest. Lightning flickers through the leaves, white, black, white, and something tightens behind your eyes. It is the price of the Quickened blood: the fastest nerves on two legs, and fits in flickering light. Sethril the Unwounded died of one. You are on a high walkway, forty feet up.",
        choices: [
          {
            t: "Shut your eyes, sit down on the walkway and wait",
            check: {s:"wil",s2:"ins",d:40},
            win: {
              r: "You sit with your face in your hands while the storm walks over. The tightness passes. You do not tell anyone, as carriers never do.",
              fx: {wil:2},
            },
            lose: {
              r: "It takes you anyway. You wake on the planks with a bitten tongue and a split brow, a hand's breadth from the edge.",
              fx: {health:-10,wound:"concussion",wil:2,cause:"a Quickened fit"},
            },
          },
          {
            t: "Climb down fast before it gets worse",
            check: {s:"athletics",s2:"spd",d:44},
            win: {
              r: "Down the rope in the dark between flashes. On the ground, under the thick canopy, the flicker cannot reach you.",
              fx: {skill:{athletics:2},spd:.3},
            },
            lose: {
              r: "A flash catches you halfway down. You fall the last fifteen feet.",
              fx: {health:-15,wound:"broken_ribs",wil:1.5,cause:"a fall during a Quickened fit"},
            },
          },
          {
            t: "Ask your kin how they live with it",
            r: "Your aunt tells you the rules of the line: no night patrols, no torchlit halls, no lightning on high places. Nobody outside the School knows them.",
            fx: {int:.4,trait:"cautious",flag:"pp_elf_qrules"},
          },
        ],
      },
      {
        id: "pp_elf_oakborn",
        title: "The last of the Oakborn",
        cond: (p,C)=>C.race(p,"elf","halfelf")&&C.blood(p,"oakborn")&&C.adult(p),
        w: 1.3,
        once: !0,
        text: 'You carry the Deep Years: the Oakborn blood that slows the clock, so an Oakborn of six hundred has the body of an elf of four. The cost is children: one in two hundred years at best. The line was seventeen once. The Keepers say, "When the last Oakborn dies, the forest will burn." They are looking at you.',
        choices: [
          {
            t: "Accept the Keepers' match and try for an heir",
            r: "A careful marriage, arranged like a treaty. Whether a child comes is up to the slow blood. The Keepers plant an oak in hope.",
            fx: {piety:3,honor:3,happy:-2,lover:!0},
          },
          {
            t: "Refuse. You will not be a seed-store for a prophecy",
            check: {s:"wil",s2:"diplomacy",d:46},
            win: {
              r: "The Keepers bow and withdraw. You are free, and very alone with it.",
              fx: {wil:2.5,trait:"stubborn"},
            },
            lose: {
              r: "They do not argue. They simply keep coming back, one Keeper after another, for twenty years.",
              fx: {wil:1.5,happy:-5},
            },
          },
          {
            t: "Ask the Keepers whether the prophecy is even true",
            check: {s:"faith",s2:"int",d:50},
            win: {
              r: 'An old Keeper admits it was first spoken in the Deep Years by a frightened queen. "Prophecies are what we fear, written down." You keep that.',
              fx: {int:.6,piety:-2,skill:{faith:3}},
            },
            lose: {r:'"It is true because we believe it," they say, which settles nothing.',fx:{piety:1}},
          },
        ],
      },
      {
        id: "pp_elf_lightfoot",
        title: "Light bones",
        cond: (p,C)=>C.race(p,"elf","halfelf")&&C.blood(p,"lightfoot")&&C.ageAdj(p)>=12,
        w: 1.3,
        cool: 12,
        text: "The Lightfoot blood gives you bones a fifth lighter than other elves': higher leaps, softer landings, an inner ear that never lies. A blow that bruises another elf breaks a Lightfoot's arm. Today a big human at {home} wants to wrestle you, in front of everyone, for a bet.",
        choices: [
          {
            t: "Wrestle him. You will not hide behind your blood",
            check: {s:"unarmed",s2:"spd",d:52},
            win: {
              r: "You never let him get a grip. Three times he lunges, three times you are behind him, and the third time he goes face-first into the mud.",
              fx: {skill:{unarmed:3},fame:2,spd:.4},
            },
            lose: {
              r: "He gets you once, the way the Lightfoot fear. Your forearm snaps like a dry stick.",
              fx: {health:-16,wil:2,cause:"a wrestling bout that broke Lightfoot bones"},
            },
          },
          {
            t: "Offer a climbing race instead",
            check: {s:"athletics",s2:"spd",d:38},
            win: {
              r: "You are at the top of the oak before he reaches the first branch. The bet is yours.",
              fx: {coin:6,skill:{athletics:3},happy:3},
            },
            lose: {
              r: "Wet bark. You slip, catch yourself, and lose by a breath. Your collarbone aches all week.",
              fx: {health:-4,wil:.6},
            },
          },
          {
            t: "Laugh it off and walk away",
            r: "The line hides its weakness from every enemy. That is not cowardice, your mother said; it is arithmetic.",
            fx: {trait:"cautious",happy:-1},
          },
        ],
      },
      {
        id: "pp_elf_mistwalker",
        title: "The noon sun",
        cond: (p,C)=>C.race(p,"elf","halfelf")&&C.blood(p,"mistwalker")&&C.ageAdj(p)>=12,
        w: 1.3,
        cool: 12,
        text: "The Mistwalker blood gives you true night sight: you see under full cloud as other elves see by starlight. The price is the noon sun. Today the Fleet-Warden needs a lookout on an open deck at midday, and every other lookout is sick with a fever from Ithira.",
        choices: [
          {
            t: "Take the watch with a grey veil over your eyes",
            check: {s:"wil",s2:"sea",d:44},
            win: {
              r: "Through the veil the sea is a white blaze, but you call the reef in time. The Fleet-Warden does not know what it cost you.",
              fx: {wil:2,skill:{sea:3},honor:2},
            },
            lose: {
              r: "Half-blind by noon, you call a gull for a sail. The captain takes you off the mast, gently.",
              fx: {happy:-4,wil:1,health:-3},
            },
          },
          {
            t: "Ask for the dusk and night watches instead",
            r: "You stand all night, and at dusk you see a pirate cog without lights a league off. The whole crew owes you its sleep.",
            fx: {skill:{sea:2},fame:1,honor:2},
          },
          {
            t: "Tell the Fleet-Warden the truth about the blood",
            r: "She has guessed it already; the Queen veils her own eyes. You are never put on a noon watch again.",
            fx: {favor:2,happy:2},
          },
        ],
      },
      {
        id: "pp_elf_sea_opening",
        title: "Sea Opening",
        cond: (p,C)=>C.realm(p,"POL-07")&&C.race(p,"elf","halfelf")&&C.ageAdj(p)>=14,
        w: 1,
        cool: 15,
        setup: (p,ctx)=>{ctx.ship=A.pick(["Foamcrest","Longwake","Tidemark","Stormleaf","Moonwake"])+" "+A.pick(["the Younger","of Ithira","the Third"])},
        text: "1 April, Sea Opening, when Eldergrove blesses its ships. The new longship {ship} slides down the ways at {home}, her keel cut from a dead captain's fir. Her shipmaster is selling a few last shares and hiring a crew for the summer run to Frostholm's tin fair.",
        choices: [
          {
            t: "Sign on for the summer run",
            check: {s:"sea",s2:"sta",d:38},
            win: {
              r: "Grey seas, giants on the shore, ivory and whale oil in the hold. You come home in September brown, salt-stiff and paid.",
              fx: {coin:25,skill:{sea:4},sta:.4,happy:3},
            },
            lose: {
              r: "Seasick for a fortnight, and a rope burn that lays your palm open. You come home paid, and thinner.",
              fx: {coin:12,skill:{sea:2},health:-5,wil:1},
            },
          },
          {
            t: "Buy a share in her (40 suns)",
            req: p=>p.coin>=40,
            check: {s:"trade",s2:"int",d:36},
            win: {r:"She comes home heavy with ivory. Your share pays back half again.",fx:{coin:20,skill:{trade:2}}},
            lose: {
              r: "She loses a mast off the Cold Coast and limps home empty. Your share is worth a plank.",
              fx: {coin:-40,wil:1},
            },
          },
          {
            t: "Lay your hand on the keel at the blessing",
            r: "The old fir is warm in the sun. The Sea Keeper says the captain under it was a fine sailor and a terrible singer. You hum anyway.",
            fx: {piety:3,happy:2},
          },
        ],
      },
      {
        id: "pp_elf_parting",
        title: "The Parting Song",
        cond: (p,C)=>C.realm(p,"POL-07")&&C.race(p,"elf","halfelf")&&C.ageAdj(p)>=12,
        w: .9,
        cool: 25,
        text: 'Leaf Fall at Silverbough, the day the city was founded. Everyone on the quays sings the Parting Song: "We left the oaks that never move / for the grey road and the sea we love." Your cousin from Sylvaran, visiting for the first time in a century, stands with her mouth shut. Sylvaran never sings it.',
        choices: [
          {
            t: "Sing louder, right beside her",
            check: {s:"music",s2:"wil",d:32},
            win: {
              r: "On the last verse, very quietly, she joins in. Neither of you ever mentions it.",
              fx: {skill:{music:2},happy:4},
            },
            lose: {
              r: "She walks off the quay. The Sea Covenant of 340 is still an open wound in some families.",
              fx: {happy:-2,wil:.5},
            },
          },
          {
            t: "Walk with her up to the fir hills and talk",
            check: {s:"diplomacy",s2:"int",d:38},
            win: {
              r: "She tells you what the inland groves really say about you sea-elves. You tell her what the sea is like. You part friends, which is rare across that line.",
              fx: {skill:{diplomacy:2},newRel:{type:"friend",op:25}},
            },
            lose: {
              r: "It turns into the old argument about ship timber and dead captains. You part coldly, for another century.",
              fx: {happy:-2},
            },
          },
          {
            t: `Tease her: "Even an oak floats once it's cut"`,
            r: "She laughs despite herself and throws a fir cone at your head. Some quarrels are old enough to be family.",
            fx: {happy:3,trait:"witty"},
          },
        ],
      },
      {
        id: "pp_elf_deckarcher",
        title: "The Sea-Archers' Yard",
        cond: (p,C)=>C.realm(p,"POL-07")&&C.race(p,"elf","halfelf")&&C.adult(p)&&!C.old(p)&&(C.prof(p,"bow",25)||C.prof(p,"sea",25)),
        w: 1,
        once: !0,
        text: `The Sea-Archers' Yard at Nimthil teaches what no forest archer knows: shooting from a pitching deck in a sea wind. The old archer Taeron Windward stands on the rolling practice-deck, reads the gulls and the spray, and says, "Not where the mark is. Where it will be."`,
        choices: [
          {
            t: "Shoot the moving mark off the rolling deck",
            check: {s:"bow",s2:"sea",d:52},
            win: {
              r: "You lead the mark by what looks like a miss, and the arrow and the mark meet. Taeron says nothing, and puts you on a longship.",
              fx: {skill:{bow:4,sea:3},fame:2,apt:{bow:1.25}},
            },
            lose: {
              r: 'The deck drops as you loose, and the arrow goes to the gulls. "The sea is not a forest," says Taeron. "Again."',
              fx: {skill:{bow:2,sea:2}},
            },
          },
          {
            t: "Watch his feet, not his bow",
            r: "His weight rides the deck like a gull on a wave, and his left calf never quite stretches. You learn more in a day than in ten years at the forest butts.",
            fx: {skill:{sea:3,bow:1},ins:.4},
          },
          {
            t: "Ask him about the Mistwood road in 1067",
            check: {s:"intrigue",s2:"diplomacy",d:52},
            win: {
              r: 'He is quiet a long while. "I shot a man who had not drawn," he says. "I am still not sure he was what the Queen said." You never ask again.',
              fx: {skill:{intrigue:2},int:.4,flag:"pp_elf_taeron"},
            },
            lose: {r:"He turns back to the gulls. You are not invited to the Yard again.",fx:{happy:-2}},
          },
        ],
      },
      {
        id: "pp_elf_shelf",
        title: "The Strangers' Shelf",
        cond: (p,C)=>C.realm(p,"POL-07")&&C.race(p,"elf","halfelf")&&C.adult(p),
        w: .9,
        cool: 15,
        setup: (p,ctx)=>{ctx.trader=A.pick(["a Solenne wine-factor","a Varennan scholar with ink on his cuffs","an Ostran moneychanger","a Lucernan glass-seller"])},
        text: "Human traders at Silverbough sleep on the Strangers' Shelf by the queen's guest hall, and may not leave it after dark. You are on the night watch when {trader} slips off the Shelf and up the alleys toward the archive, where Lirael the Archivist keeps the Temple's worst secret.",
        choices: [
          {
            t: "Follow him without a sound",
            check: {s:"stealth",s2:"tracking",d:44},
            win: {
              r: "You watch him try the archive door with a bent wire, then step out of the shadow beside him. He drops the wire. The Council of the Grey Veil is very interested in who sent him.",
              fx: {skill:{stealth:3},favor:4,fame:1,coin:10},
            },
            lose: {
              r: "You lose him in the fog. In the morning he is asleep on the Shelf, smiling.",
              fx: {happy:-3,skill:{stealth:1}},
            },
          },
          {
            t: "Raise the watch with the horn",
            r: 'Torches, shouting, half of Silverbough awake. He is found "lost" two streets from the archive. Nothing can be proved.',
            fx: {honor:1,favor:1},
          },
          {
            t: "Let him go. A bribe was offered at supper",
            r: "Ten suns of Solenne gold. Whatever he wanted, he did not get it, you tell yourself. Probably.",
            fx: {coin:10,honor:-5},
          },
        ],
      },
      {
        id: "pp_elf_westrand",
        title: "Ship-shares or the West Strand",
        cond: (p,C)=>C.realm(p,"POL-07")&&C.race(p,"elf","halfelf")&&C.adult(p),
        w: .7,
        cool: 40,
        setup: (p,ctx)=>{setPid(p,ctx,"human",{status:"peasant",sex:"M",occ:"a sailor of a Northreach cog"}),ctx.kin=A.pick(["cousin","nephew","younger sister"])},
        text: "A drunk human sailor, {themFull}, killed your {kin} in a quay brawl at {home}. Elves die so rarely that the whole city is in mourning. Eldergrove law lets the family choose: a blood-price in ship-shares, or twenty years alone on the empty West Strand, which few humans survive.",
        choices: [
          {
            t: "Take the ship-shares",
            r: "His captain pays in shares of the cog. Your family will draw on them for a century. The man is gone by the next tide, and so, mostly, is your grief.",
            fx: {coin:40,wil:1.5,happy:-4},
          },
          {
            t: "The West Strand. Twenty years",
            r: "He is put ashore with a knife and a sack of meal. Twenty years is nothing to you. To him it is everything left.",
            fx: {wil:2,trait:"vengeful",happy:-3,them:{type:"enemy",op:-50}},
          },
          {
            t: "Ask to speak with him before you choose",
            check: {s:"wil",s2:"diplomacy",d:42},
            win: {
              r: "He weeps the whole time, a boy of twenty-two. You choose the shares, and ask that he never sail to Eldergrove again. It is the hardest mercy you will ever give.",
              fx: {wil:3,honor:4,coin:25,trait:"forgiving"},
            },
            lose: {
              r: "He is sullen and blames the drink. You walk out and choose the Strand without looking back.",
              fx: {wil:1.5,happy:-4},
            },
          },
        ],
      },
      {
        id: "pp_elf_yew",
        title: "Yew for Ashmere",
        cond: (p,C)=>C.realm(p,"POL-06")&&C.race(p,"elf","halfelf")&&C.adult(p),
        w: .9,
        cool: 20,
        text: "Deep in a yew stand above Lirith you find six fresh stumps, each with a Keeper's mark cut into the bark. The marks are wrong, made by someone who has seen them but never been taught. The staves are gone. Rumor says Mirel the Bowyer's yard is filling with yew it cannot account for, and Ashmere pays in silver for elven yew.",
        choices: [
          {
            t: "Follow the drag-marks to the yard",
            check: {s:"tracking",s2:"int",d:46},
            win: {
              r: "The marks lead not to Mirel but to a riverbank landing, and an Ashmere barge with a false bottom. The rangers take it at dawn.",
              fx: {skill:{tracking:3},honor:3,fame:2,favor:3},
            },
            lose: {
              r: "The trail ends in a river. Whoever it was knows the forest as well as you.",
              fx: {skill:{tracking:1},wil:.5},
            },
          },
          {
            t: "Take the forged mark to the Keepers",
            r: "The Keepers go very quiet. Forging a mark is worse than cutting without one. You are asked never to speak of it, and you notice new faces at the yew stands.",
            fx: {piety:3,honor:2},
          },
          {
            t: "Find out who is buying, and ask for a cut",
            check: {s:"intrigue",s2:"deception",d:50},
            win: {
              r: "A middleman in Fenali pays you twenty suns a season to forget the stand. You are a smuggler now.",
              fx: {coin:20,honor:-6,flag:"pp_elf_yewcut",skill:{intrigue:2}},
            },
            lose: {
              r: "The middleman sends two men to discourage you instead.",
              fx: {
                duel: {
                  tier: 2,
                  title: "a yew smuggler's hired blade",
                  opts: {kind:"brawl",place:"a Fenali back-lane",lethal:!1,toYield:!0,title:"Yew and knives"},
                },
              },
            },
          },
        ],
      },
      {
        id: "pp_elf_archive",
        title: "Serra's proof",
        cond: (p,C)=>early()&&C.realm(p,"POL-07")&&C.race(p,"elf","halfelf")&&C.adult(p),
        w: .9,
        once: !0,
        text: "The elven chronicles record the sun's return in Grove year 4,206 and Corvan's crowning in 4,212. Six years apart. The Temple says they happened together, and its whole Common Reckoning rests on it. A soft-spoken knight from the Temple's envoy asks you, over wine, whether you have ever seen the copy in the Silverbough archive.",
        choices: [
          {
            t: "Tell him nothing, and report him",
            r: "The Council of the Grey Veil thanks you. The knight is watched every hour he spends in Silverbough. Queen Saelith sells her silence by the decade, and it is not yours to give away.",
            fx: {favor:4,honor:2},
          },
          {
            t: "Feed him a false story about where it is kept",
            check: {s:"deception",s2:"int",d:46},
            win: {
              r: "He spends three nights searching an empty net-loft. Lirael the Archivist hears of it and laughs out loud, which nobody has seen her do.",
              fx: {skill:{deception:3},favor:3,fame:1},
            },
            lose: {
              r: 'He sees through it, and smiles. "You know where it is, then." He becomes very friendly.',
              fx: {newRel:{type:"rival",op:-10},wil:.5},
            },
          },
          {
            t: "Ask him what the Temple would pay",
            r: "He names a sum that would buy a ship. Then he names a punishment, gently. You realize you are in deep water, and swim back to shore.",
            fx: {int:.4,skill:{intrigue:2}},
          },
        ],
      },
      {
        id: "pp_elf_wander",
        title: "Too slow",
        cond: (p,C)=>elfHome(p)&&C.age(p)>=45&&C.age(p)<=90,
        w: 1,
        once: !0,
        text: "You are young, by elven count, and everything around you moves like sap in winter. The Moot takes ten years over a stream. Your elders plan for three centuries. Lirien Duskwater left the Evenwood at sixty and has fought for pay in human lands ever since. Out there, the humans run everywhere.",
        choices: [
          {
            t: "Leave for a few decades and see the human world",
            r: "You take a bow and a cloak and walk south. Human cities are loud, quick, filthy and wonderful. Your mother does not even worry; to her you will be back in a moment.",
            fx: {flag:"pp_elf_wandered",happy:6,skill:{survival:2,persuasion:2},lang:"Northfolk",trait:"curious"},
          },
          {
            t: "Stay, and learn patience from the oldest Keeper",
            r: "She teaches you to sit beside a tree from dawn to dusk and notice what it does. It is maddening, then interesting, then something else.",
            fx: {trait:"patient",piety:3,skill:{faith:2},wil:1},
          },
          {
            t: "Throw yourself into the bow instead",
            check: {s:"bow",s2:"wil",d:36},
            win: {
              r: "Ten thousand arrows in ten years. The hurry goes into the string, where elves can use it.",
              fx: {skill:{bow:5},wil:1},
            },
            lose: {
              r: "You shoot badly and angrily for a decade. Then, one day, you do not.",
              fx: {skill:{bow:3},wil:1.5},
            },
          },
        ],
      },
      {
        id: "pp_elf_city_quarter",
        title: "The elven quarter",
        cond: (p,C)=>C.race(p,"elf")&&C.adult(p)&&!inR(p,ELFR),
        w: 1,
        cool: 20,
        setup: (p,ctx)=>{ctx.gen=A.pick(["four","five","six"]),ctx.city=humanTown(p)},
        text: `You live in the small elven quarter of {city}, where the gardens are better than the houses. Your landlord's family has rented to you for {gen} generations; the new heir is a sharp young man who has done arithmetic. He wants to raise the rent by half, "since you will be here forever anyway".`,
        choices: [
          {
            t: "Bargain with him, slowly, as only an elf can",
            check: {s:"trade",s2:"wil",d:40},
            win: {
              r: "You simply outwait him. By the third month of talks he settles for a tenth more, and thinks he won.",
              fx: {skill:{trade:2},trait:"patient"},
            },
            lose: {r:"He is quicker than you, as they always are. You pay the half.",fx:{coin:-15,happy:-3}},
          },
          {
            t: "Buy the house outright (60 suns)",
            req: p=>p.coin>=60,
            r: "His great-great-grandfather would have laughed. You will own it when his great-great-grandson is born.",
            fx: {coin:-60,asset:"townhouse",happy:4},
          },
          {
            t: "Remind him what his great-grandmother promised",
            check: {s:"persuasion",s2:"int",d:44},
            win: {
              r: "You quote her words exactly, from sixty years back, and the dinner where she said them. He is so unsettled he lets it drop.",
              fx: {skill:{persuasion:2},int:.3},
            },
            lose: {
              r: '"She is dead," he says. "Promises die with humans." He is right, in his world.',
              fx: {wil:1,happy:-2},
            },
          },
        ],
      },
      {
        id: "pp_elf_brittle",
        title: "A shove in a tavern",
        cond: (p,C)=>C.race(p,"elf")&&C.adult(p)&&!inR(p,ELFR),
        w: .9,
        cool: 15,
        text: "A crowded tavern in {home}. A big carter, drunk and loud, decides your pointed ears are the funniest thing he has seen all year, and shoves you into a bench. On a human it would leave a bruise. Elven bone is lighter, and you feel something in your wrist give.",
        choices: [
          {
            t: "Hit him before he can do it again",
            check: {s:"unarmed",s2:"spd",d:46},
            win: {
              r: "Elves are faster than they are strong. Three blows before he lifts his hands, and he sits down in a puddle of ale. Then the pain in your wrist arrives.",
              fx: {skill:{unarmed:2},fame:1,health:-6},
            },
            lose: {
              r: "He is slower, but there is twice as much of him. You leave by the door, without your dignity.",
              fx: {health:-12,wound:"broken_nose",wil:1.5,cause:"a tavern brawl"},
            },
          },
          {
            t: "Walk out, holding your wrist",
            r: "The wrist takes six weeks to set, as elven bones do. You learn which taverns not to drink in.",
            fx: {health:-6,wil:1,trait:"cautious"},
          },
          {
            t: 'Draw your knife and say, very quietly, "Again"',
            check: {s:"intimidation",s2:"ins",d:42},
            win: {
              r: "He looks into elven eyes and sees something four hundred years deep. He apologizes, and pays for your drink.",
              fx: {skill:{intimidation:2},wil:.5},
            },
            lose: {r:"The watch is called. A drawn knife in a tavern is your fault, here.",fx:{coin:-10,honor:-2}},
          },
        ],
      },
      {
        id: "pp_elf_smoke",
        title: "Smoke on the wind",
        cond: (p,C)=>C.race(p,"elf","halfelf")&&C.ageAdj(p)>=12&&C.terr(p,"forest","hills","marsh"),
        w: .9,
        cool: 25,
        text: "You smell it long before anyone else: smoke, a hundred paces downwind and more, the wrong kind. A human charcoal-burner's mound at the forest edge has broken open in a dry wind, and fire is running into the leaf-litter toward the old oaks.",
        choices: [
          {
            t: "Run for the grove and raise everyone",
            check: {s:"command",s2:"spd",d:40},
            win: {
              r: "In an hour there are two hundred elves on the line with wet sacks and spades. The fire dies at a stream you chose. They talk about it for a generation.",
              fx: {skill:{command:3},fame:3,honor:3},
            },
            lose: {
              r: "By the time the grove arrives it has taken a whole slope. It will be green again in a human lifetime, and old again in three of yours.",
              fx: {happy:-5,wil:1.5},
            },
          },
          {
            t: "Cut a firebreak yourself, now",
            check: {s:"sta",s2:"str",d:44},
            win: {
              r: "You dig and drag and beat until your hands bleed. The fire comes to your break and stops.",
              fx: {sta:.6,str:.4,honor:4,fame:1},
            },
            lose: {
              r: "The smoke takes your breath. Someone drags you out by the ankles.",
              fx: {health:-12,wil:1.5,cause:"smoke from a forest fire"},
            },
          },
          {
            t: "Find the charcoal-burner first",
            check: {s:"tracking",s2:"ins",d:36},
            win: {
              r: "He is beating at the flames with his coat. Together you turn the fire toward the bare ground he cleared. He swears he will never burn so close again, and means it.",
              fx: {honor:2,newRel:{type:"friend",op:20}},
            },
            lose: {r:"He has already run. The fire runs too.",fx:{happy:-4}},
          },
        ],
      },
      {
        id: "pp_elf_newtool",
        title: "A dwarven saw",
        cond: (p,C)=>C.race(p,"elf")&&C.adult(p),
        w: .8,
        cool: 30,
        text: p=>`${inR(p,ELFR)?"At the edge-fair an Irondeep dwarf, there for the old honey-for-iron trade,":"In the market of {home} a dwarf smith"} shows you a bow-saw of springing steel. It cuts in an hour what your bronze-backed saw does in a day. Elves are the keepers of old knowledge, and the last to take up a better tool. ${inR(p,ELFR)?"Your elders are already frowning.":"You can already hear what your elders would say."}`,
        choices: [
          {
            t: "Buy it (15 suns)",
            req: p=>p.coin>=15,
            r: "The elders call it a tunnel-digger's toy. Within ten years every carpenter in {home} has borrowed it.",
            fx: {coin:-15,skill:{craft:3},trait:"curious",happy:2},
          },
          {
            t: "Trade him honey for it, as your grandmother would",
            check: {s:"trade",s2:"diplomacy",d:40},
            win: {
              r: "Three crocks of honey for the saw. The dwarf grunts that it is the best trade he has made since Leaf Fall. Coming from a dwarf, that is a sonnet.",
              fx: {skill:{trade:3},newRel:{type:"friend",op:15}},
            },
            lose: {
              r: "He wants coin, not honey. Dwarves have changed, says your grandmother. In three centuries.",
              fx: {},
            },
          },
          {
            t: "Refuse. The old saw thanks the tree; this one does not",
            r: "The dwarf shrugs. Your elders nod. Somewhere a human carpenter buys it instead.",
            fx: {piety:2,trait:"stubborn"},
          },
        ],
      },
      {
        id: "pp_elf_lostchild",
        title: "Starlight eyes",
        cond: (p,C)=>C.race(p,"elf","halfelf")&&C.ageAdj(p)>=12&&C.terr(p,"forest","hills","marsh","mountains"),
        w: .8,
        cool: 20,
        setup: (p,ctx)=>{ctx.kid=humanName(p)},
        text: "Night, and the human village at the forest's edge is out with torches. A child, {kid}, wandered into the trees at dusk. The humans can see nothing past their own flames. By starlight you can see every root, and you can hear something small crying far off to the east.",
        choices: [
          {
            t: "Go into the dark alone, and follow the sound",
            check: {s:"tracking",s2:"ins",d:38},
            win: {
              r: "You find the child in a hollow under a beech, cold and furious, and carry {kid} back into the torchlight. The mother will not let go of your hand.",
              fx: {skill:{tracking:3},honor:4,fame:2,newRel:{type:"friend",op:30}},
            },
            lose: {
              r: "The sound stops. You search until dawn. The humans find the child at noon, alive, three valleys away, and look at you oddly.",
              fx: {wil:1,happy:-3},
            },
          },
          {
            t: "Tell the humans to put out their torches and be silent",
            check: {s:"command",s2:"diplomacy",d:42},
            win: {
              r: "They are frightened, but they do it. In the dark and quiet, the child's voice is easy to find.",
              fx: {skill:{command:2},honor:3},
            },
            lose: {
              r: "They will not put out the light in the forest at night. You understand; it is not their place.",
              fx: {},
            },
          },
          {
            t: "It is not your village. Go home",
            r: "In the morning you hear they found the child. You were not needed. You feel no better.",
            fx: {happy:-2},
          },
        ],
      },
      {
        id: "pp_elf_teen",
        title: "Not yet fifty",
        cond: (p,C)=>C.race(p,"elf")&&C.teen(p),
        w: 1.3,
        once: !0,
        setup: (p,ctx)=>{ctx.hf=humanName(p)},
        text: "You are forty-five, and under elven law still a child for five more years. Your body has been grown for a while. {hf}, the human you played with at the edge when you were both small, is a grandparent now, and you are not allowed to sit at the grove council.",
        choices: [
          {
            t: "Visit {hf} and the grandchildren",
            r: 'It is strange to be called "the elf who is still a child" by a toddler. {hf} laughs until coughing. You come home thoughtful.',
            fx: {wil:1,happy:2,int:.3},
          },
          {
            t: "Sneak into the grove council anyway",
            check: {s:"stealth",s2:"spd",d:30},
            win: {
              r: "You sit in the branches above the council for three hours. It is mostly about honey. You are bitterly disappointed and very pleased with yourself.",
              fx: {skill:{stealth:2,diplomacy:1},happy:3},
            },
            lose: {
              r: 'A Keeper looks straight up at you halfway through. "Five years," she says. "Come down."',
              fx: {happy:-2,wil:.5},
            },
          },
          {
            t: "Spend the five years mastering one thing",
            r: "You choose the bow, and do almost nothing else. Elves keep what they learn for centuries.",
            fx: {skill:{bow:4},wil:.6},
          },
        ],
      },
      {
        id: "pp_dw_badair",
        title: "The flame turns blue",
        cond: (p,C)=>C.race(p,"dwarf")&&C.adult(p)&&(dwHold(p)||C.job(p,"miner")),
        w: 1.1,
        cool: 10,
        setup: (p,ctx)=>{const fire=A.chance(.5);ctx.sign=fire?"the flame stretches tall and thin and burns blue at the tip":"the flame shrinks to a bead and gutters, and the air tastes of old pennies",ctx.kind=fire?"firedamp, the air that burns":"blackdamp, the air that smothers"},
        text: "At the head of the drift you hold the lamp up to test the air, as every shift begins, and {sign}. It is {kind}. Your crew of six is already swinging picks fifty paces behind you, and the tally is behind for the month.",
        choices: [
          {
            t: "Shout them all back, now, and seal the drift",
            check: {s:"command",s2:"wil",d:36},
            win: {
              r: "They grumble, and they go. The Mine-Master tests it himself the next morning and orders the drift closed for a season. Six dwarves live to grumble again.",
              fx: {skill:{command:3},honor:3,fame:1},
            },
            lose: {
              r: "Two of them want the tally more than they fear the air, and you have to drag one out by his belt. He is sick for a week. He thanks you, eventually.",
              fx: {skill:{command:1},honor:2,health:-4,wil:1},
            },
          },
          {
            t: "Push on quickly and finish the seam face",
            check: {s:"sta",s2:"ins",d:52},
            win: {
              r: "You work fast and shallow-breathed, and pull out before it thickens. A fat tally, and a headache that lasts three days.",
              fx: {coin:12,health:-4,trait:"reckless"},
            },
            lose: {
              r: "The world goes grey at the edges. You wake in the gallery with your crew slapping your face. The tally is the least of what you lost.",
              fx: {health:-16,wil:1.5,cause:"bad air in the mine"},
            },
          },
          {
            t: "Send a runner for the Mine-Master and wait at the shaft",
            r: "The Mine-Master comes, sniffs, curses, and closes the drift. Your crew loses a month of tally. Nobody dies, which is not written on any tally stone.",
            fx: {coin:-4,honor:1,trait:"cautious"},
          },
        ],
      },
      {
        id: "pp_dw_collapse",
        title: "The roof comes down",
        cond: (p,C)=>C.race(p,"dwarf")&&C.adult(p)&&(dwHold(p)||C.job(p,"miner")),
        w: .9,
        cool: 15,
        setup: (p,ctx)=>{setPid(p,ctx,"dwarf",{occ:"a miner of your shift"})},
        text: "A creak overhead, the one the humans call knockers, and then the roof of the gallery comes down behind you in a roar of dust. When it settles you are in the dark with {themFull}, one lamp, a water skin and perhaps a day of oil. The way out is under thirty feet of broken rock.",
        choices: [
          {
            t: "Dig toward the shaft, stone by stone",
            check: {s:"str",s2:"sta",d:46},
            win: {
              r: "Eighteen hours of lifting and bracing. You break through into the lamplight of the rescue crew digging from the other side, and they cheer like a festival.",
              fx: {str:.6,sta:.6,fame:2,wil:1.5,them:{type:"friend",op:40}},
            },
            lose: {
              r: "A second fall catches your leg. {them} drags you back and you wait in the dark for the rescuers, who come on the third day.",
              fx: {health:-18,wound:"limp",wil:2.5,them:{type:"friend",op:30},cause:"a rockfall in the mine"},
            },
          },
          {
            t: "Douse the lamp, tap the signal on the rock and wait",
            check: {s:"wil",s2:"int",d:40},
            win: {
              r: "Three taps, a pause, three taps, every hour, in perfect dark. On the second day the rock taps back. You save the oil, the air and your sanity.",
              fx: {wil:2.5,int:.4,them:{type:"friend",op:35}},
            },
            lose: {
              r: "Two days in the dark with no answer. When the rescuers reach you, {them} is raving and you are not much better.",
              fx: {wil:3,happy:-6,health:-6},
            },
          },
          {
            t: "Squeeze through the gap near the roof",
            check: {s:"athletics",s2:"spd",d:50},
            win: {
              r: "Dwarf shoulders are not made for it, but you scrape through and bring the crew to the right spot. They pull {them} out by nightfall.",
              fx: {skill:{athletics:3},honor:3,fame:1,health:-4},
            },
            lose: {
              r: "You stick halfway, and the rock shifts. They cut you free on the second day with two cracked ribs.",
              fx: {health:-14,wound:"broken_ribs",wil:2,cause:"a gallery collapse"},
            },
          },
        ],
      },
      {
        id: "pp_dw_flood",
        title: "Old water",
        cond: (p,C)=>C.race(p,"dwarf")&&C.adult(p)&&(dwHold(p)||C.job(p,"miner")),
        w: .8,
        cool: 18,
        text: "Your pick goes through the face into nothing, and black water spits out of the hole, then gushes. You have broken into a forgotten working full of old water. Dwarves sink like anvils; every child of the holds knows it. The gallery floor is already ankle deep, and the up-shaft is two hundred paces back.",
        choices: [
          {
            t: "Run for the up-shaft",
            check: {s:"spd",s2:"sta",d:44},
            win: {
              r: "Short legs and a long gallery, but you reach the ladder with the water at your waist and climb with it at your heels.",
              fx: {spd:.4,wil:1.5},
            },
            lose: {
              r: "The water takes your feet two paces from the ladder. Someone above hauls you out by the hair, half drowned.",
              fx: {health:-15,wil:2,cause:"drowning in a flooded mine"},
            },
          },
          {
            t: "Ram timbers into the hole and plug it",
            check: {s:"craft",s2:"str",d:50},
            win: {
              r: "A prop, a wedge, a coat stuffed into the crack and a second prop on top. It holds. The Mine-Masters send a pump crew and buy you a barrel of dark beer.",
              fx: {skill:{craft:3},fame:2,honor:2},
            },
            lose: {
              r: "The timbers wash back at you. You run, and the gallery is lost for a year.",
              fx: {health:-6,coin:-6,wil:1},
            },
          },
          {
            t: "Climb onto the ore-cart and ride the surge out",
            check: {s:"ins",s2:"athletics",d:48},
            win: {
              r: "The flood picks up the cart and sends it down the rails like a sled. You arrive at the shaft wet, mad with laughter and alive.",
              fx: {fame:2,happy:4,trait:"reckless"},
            },
            lose: {
              r: "The cart jumps the rails at the bend.",
              fx: {health:-14,wound:"concussion",wil:1.5,cause:"a flooded gallery"},
            },
          },
        ],
      },
      {
        id: "pp_dw_wyrm",
        title: "The White Wyrm",
        cond: (p,C)=>C.race(p,"dwarf")&&C.adult(p)&&!C.old(p)&&(C.realm(p,"POL-10","POL-28","POL-29")||C.terr(p,"mountains")),
        w: .7,
        cool: 25,
        text: "Something has been taking goats from the lowest galleries, where the old workings run into flooded caves. Tonight you see it in your lamplight: pale as a corpse, long as three dwarves, blind, with a mouth full of needles. Dwarves say the White Wyrm is a dragon's larva. The old ones say never fight it in the water.",
        choices: [
          {
            t: "Fight it on the dry rock with your axe",
            r: "It turns its eyeless head toward your lamp.",
            fx: {beast:{id:"CRE-26",place:"the flooded galleries",mod:.8}},
          },
          {
            t: "Wall up the cave mouth with the masons",
            check: {s:"craft",s2:"siegecraft",d:40},
            win: {
              r: "Three days of fitted stone and mortar. The goats stop vanishing, and the Mine-Masters carve the date on the new wall.",
              fx: {skill:{craft:2,siegecraft:2},honor:2},
            },
            lose: {
              r: "The wall is sound, but the wyrm finds another way in through the old water. It takes a dog next.",
              fx: {skill:{craft:1},wil:.5},
            },
          },
          {
            t: "Watch it from the ledge and learn what it really is",
            check: {s:"learning",s2:"stealth",d:42},
            win: {
              r: "It eats, sleeps and sheds its skin like a newt. Not a larva of anything. Just a great blind beast of the deep water. Nobody believes you.",
              fx: {int:.6,skill:{learning:3},trait:"curious"},
            },
            lose: {
              r: "It hears your boot on the ledge. You get away with a gash on the calf and no answers.",
              fx: {health:-8,wound:"bite"},
            },
          },
        ],
      },
      {
        id: "pp_dw_cavebear",
        title: "A bear in the vaults",
        cond: (p,C)=>C.race(p,"dwarf")&&C.adult(p)&&!C.old(p)&&C.realm(p,"POL-10"),
        w: 1,
        cool: 20,
        text: "A cave bear has come in through a weathered vent and is sleeping in the ancestor vaults, among the stone shelves where your dead lie with their tools. The skull of the bear Hauk Stonejaw speared in 612 still hangs over the Deep Gate. Some of the old ones say cave bears guard the vaults, and should be left alone.",
        choices: [
          {
            t: "Take a gate spear and go in",
            r: "It wakes. It is very large.",
            fx: {beast:{id:"CRE-25",place:"the ancestor vaults",mod:.8}},
          },
          {
            t: "Leave it. The old ones may be right",
            r: "It sleeps the winter among your dead and leaves in spring. Nothing is disturbed. You almost believe it.",
            fx: {piety:3,trait:"cautious"},
          },
          {
            t: "Drive it out with drums and smoke from the vent side",
            check: {s:"husbandry",s2:"command",d:44},
            win: {
              r: "A grumbling mountain of fur shambles out into the snow and away. Not one shelf disturbed.",
              fx: {skill:{husbandry:2,command:2},honor:2},
            },
            lose: {
              r: "It goes the wrong way, deeper, and knocks down a whole shelf of bones. The Law-Carvers spend a week sorting your ancestors.",
              fx: {honor:-3,piety:-2,wil:1},
            },
          },
        ],
      },
      {
        id: "pp_dw_quench",
        title: "The second quench",
        cond: (p,C)=>C.race(p,"dwarf")&&C.adult(p)&&(C.job(p,"smith")||C.prof(p,"craft",35)),
        w: 1.1,
        cool: 12,
        setup: (p,ctx)=>{ctx.buyer=A.pick(["a Varennan duke","an Aldmark marcher lord","a Sabran emir's steward","a Tessarian general"]),ctx.Buyer=A.cap(ctx.buyer)},
        text: "{Buyer} has paid two hundred suns in advance for a blade from your forge, and sent a man to wait at the gate until it is done. It is at the second quench now, the one no human knows, and the color of the steel is not quite right.",
        choices: [
          {
            t: "Quench now and trust your hands",
            check: {s:"craft",s2:"int",d:50},
            win: {
              r: "The steel sings when you strike it. The human weeps a little when he sees it. Your master, if alive, would grunt.",
              fx: {skill:{craft:4},coin:40,fame:2},
            },
            lose: {
              r: "A hairline crack, invisible to anyone but you. You know. You break it and start again, and the human waits another month.",
              fx: {skill:{craft:2},wil:1.5,coin:-10},
            },
          },
          {
            t: "Start the blade again from the bloom",
            r: "A month lost, and the human furious. But nothing leaves your forge that is not true, and your clan mark is on it.",
            fx: {honor:3,skill:{craft:3},trait:"patient"},
          },
          {
            t: "It is only for a human. Finish and send it",
            r: "He will never know. In twenty years, in some battle, the blade will break, and someone will curse dwarven steel.",
            fx: {coin:30,honor:-4,trait:"greedy"},
          },
        ],
      },
      {
        id: "pp_dw_mastery",
        title: "Before the Council of Masters",
        cond: (p,C)=>C.race(p,"dwarf")&&C.age(p)>=60&&!C.flag(p,"pp_dw_master")&&(C.prof(p,"craft",40)||jobIn(p,"smith","miner","mason")),
        w: 1.2,
        once: !0,
        setup: (p,ctx)=>{ctx.trade=p.job&&p.job.c==="miner"?"the mines":p.job&&p.job.c==="mason"?"stone":"the forge",ctx.council=p.realm==="POL-29"?"the Guild of the Breath Forges":p.realm==="POL-28"?"the Guild of Crucible Smiths":"the Council of Master-Smiths"},
        text: "Thirty years an apprentice, thirty more a journeyman. Today you stand before {council} with your master-piece in {trade}, and every master who will judge it has been doing this for a century. If they pass it, you may take apprentices of your own, and vote.",
        choices: [
          {
            t: "Show them the piece, and say nothing",
            check: {s:"craft",s2:"wil",d:54},
            win: {
              r: "They pass it hand to hand in silence for an hour. Then the eldest strikes the table once with her hammer. You are a master.",
              fx: {
                flag: "pp_dw_master",
                fame: 3,
                honor: 5,
                skill: {craft:4},
                deed: "Was made a master before the Council",
                ach: "master_craft",
              },
            },
            lose: {
              r: '"Ten more years," says the eldest, and hands it back. It is not unkind. It is just very, very long.',
              fx: {wil:2.5,skill:{craft:2},happy:-6},
            },
          },
          {
            t: "Explain every choice you made in it",
            check: {s:"learning",s2:"craft",d:50},
            win: {
              r: "You talk for two hours about grain and heat and the stone of the hold. They pass you, and ask you to teach.",
              fx: {
                flag: "pp_dw_master",
                fame: 2,
                honor: 4,
                skill: {learning:3,craft:2},
                deed: "Was made a master before the Council",
              },
            },
            lose: {
              r: `The masters stop listening halfway through. "The piece speaks, or it doesn't," says one.`,
              fx: {wil:1.5,happy:-4},
            },
          },
          {
            t: "Withdraw. It is not ready, and you know it",
            r: "Your master looks at you with something like respect. Another ten years, then. Dwarves are good at that.",
            fx: {trait:"patient",wil:1,honor:1},
          },
        ],
      },
      {
        id: "pp_dw_slow",
        title: "A human master at twenty-one",
        cond: (p,C)=>C.race(p,"dwarf")&&C.age(p)>=35&&C.age(p)<=100&&!C.flag(p,"pp_dw_master"),
        w: .9,
        cool: 30,
        setup: (p,ctx)=>{ctx.boy=humanName(p,"M")},
        text: "{boy}, a human you remember as a twelve-year-old carrying coal to the gate, has finished his seven years and opened his own smithy in the town below. He is twenty-one, a master, and very proud. You are a journeyman of {age}, with twenty years to go before the Council will look at your work.",
        choices: [
          {
            t: "Go down and look at his work",
            check: {s:"craft",s2:"int",d:34},
            win: {
              r: "It is quick, rough and honest. You show him one thing about the weld. He is so grateful it embarrasses you both.",
              fx: {skill:{craft:2},newRel:{type:"friend",op:25},happy:2},
            },
            lose: {
              r: "You cannot help yourself. You tell him everything wrong with it, at length. He does not invite you back.",
              fx: {happy:-2,trait:"proud"},
            },
          },
          {
            t: "Remind yourself what twenty years buy",
            r: "His blades will be forgotten in a century. Yours will be hung in halls. You go back to the forge and hit the iron with great patience.",
            fx: {wil:1.5,skill:{craft:2},trait:"patient"},
          },
          {
            t: "Envy him, quietly, for a whole winter",
            r: "A whole life in sixty years, start to finish. It is a terrible way to live, and a fast one. You drink more dark beer than usual.",
            fx: {happy:-4,wil:1},
          },
        ],
      },
      {
        id: "pp_dw_grudge",
        title: "Carved in stone",
        cond: (p,C)=>C.race(p,"dwarf")&&C.adult(p),
        w: 1,
        cool: 30,
        setup: (p,ctx)=>{ctx.clan=clanO(),ctx.left=A.ri(9,41),ctx.what=A.pick(["a contract for forty mail shirts, half delivered","a gallery rent unpaid in the Hungry Winter","a forge secret they swore to keep and sold"])},
        text: "On the clan wall of your gallery a line of runes records a grudge: Clan {clan} broke {what} with your great-grandfather. A broken contract is remembered for 300 years. This one has {left} years left. Today a young {clan} journeyman comes to your door asking to buy ore from your clan.",
        choices: [
          {
            t: "Point at the wall, and shut the door",
            r: "He reads the runes, goes red to the beard and leaves. Your grandmother pours you a beer.",
            fx: {honor:2,trait:"vengeful",newRel:{type:"rival",op:-15}},
          },
          {
            t: "Demand the old debt threefold, carved law",
            check: {s:"learning",s2:"trade",d:46},
            win: {
              r: "You cite the clause exactly. His clan pays, threefold, to the ounce. The grudge is ground off the wall with a feast.",
              fx: {coin:45,honor:4,skill:{learning:2,trade:2}},
            },
            lose: {
              r: "His clan's Law-Carver finds a flaw in your wording. The grudge stays, and now there are two.",
              fx: {honor:-2,wil:1},
            },
          },
          {
            t: "Sell to him. He was not born when it was carved",
            r: "Your elders call it soft. He pays on time, every season, and in {left} years nobody will remember the wall was ever angry.",
            fx: {coin:10,trait:"forgiving",newRel:{type:"friend",op:20}},
          },
        ],
      },
      {
        id: "pp_dw_humandebt",
        title: "A human's promise",
        cond: (p,C)=>C.race(p,"dwarf")&&C.adult(p)&&free(p),
        w: 1,
        cool: 15,
        setup: (p,ctx)=>{setPid(p,ctx,"human",{status:"gentry",sex:"M",occ:"a young knight"}),ctx.sum=A.ri(60,120)},
        text: `Six years ago you sold a mail shirt to a human knight on a carved contract: half then, half within three years. He died in a war, unpaid. His son, {themFull}, wears the shirt at the tourney, and when you show him the contract he laughs. "My father's debts died with him." By carved law, {sum} suns are owed.`,
        choices: [
          {
            t: "Take it before a human court",
            check: {s:"persuasion",s2:"learning",d:46},
            win: {
              r: "The judge reads the carved contract twice and finds for you. The son pays, and hates you very politely.",
              fx: {coin:50,skill:{persuasion:2},them:{type:"rival",op:-20}},
            },
            lose: {
              r: "The judge plays dice with the young knight's uncle. You lose, and pay the court fee.",
              fx: {coin:-6,wil:1.5,them:{type:"enemy",op:-20}},
            },
          },
          {
            t: "Write his name in your clan's book of debts",
            r: "It will sit there for three hundred years. His grandsons will meet a dwarf at a gate one day and wonder why the price doubled.",
            fx: {honor:2,trait:"vengeful"},
          },
          {
            t: "Walk up and take the shirt off his back",
            check: {s:"intimidation",s2:"str",d:50},
            win: {
              r: "He looks at your hands and the hammer at your belt, and unlaces it himself in front of the whole tourney.",
              fx: {coin:30,fame:2,skill:{intimidation:2}},
            },
            lose: {
              r: "His friends close in.",
              fx: {
                duel: {
                  foe: "them",
                  tier: 2,
                  opts: {kind:"brawl",place:"the tourney field",lethal:!1,toYield:!0,title:"The mail shirt"},
                },
              },
            },
          },
        ],
      },
      {
        id: "pp_dw_holdbank",
        title: "The Hold Bank",
        cond: (p,C)=>C.race(p,"dwarf")&&C.adult(p)&&free(p)&&!C.flag(p,"pp_dw_loan")&&p.coin<150,
        w: .9,
        cool: 25,
        text: "The Hold Bank of Stonehold lends to kings and emperors; three Tessarian emperors are carved on its Debtors' Wall. A clerk of House Goldvein, in a coat of black wool, offers you a hundred suns to open a workshop of your own: one in ten a year, all of it back in five. The contract is carved, not written.",
        choices: [
          {
            t: "Take the loan and open the workshop",
            r: "You lay your hand on the carved contract. The hundred suns are in your hands by evening, and the Wall is in your thoughts every night after.",
            fx: {coin:100,flag:"pp_dw_loan",asset:"workshop",skill:{stewardship:2}},
          },
          {
            t: "Bargain the terms down",
            check: {s:"trade",s2:"learning",d:50},
            win: {
              r: "One in fifteen and seven years. The clerk looks at you as a cat looks at a mouse that has bitten it.",
              fx: {coin:100,flag:"pp_dw_loan",asset:"workshop",skill:{trade:3}},
            },
            lose: {
              r: "The clerk smiles, closes the book, and leaves. The Bank does not haggle with journeymen.",
              fx: {happy:-2},
            },
          },
          {
            t: "Refuse. Better poor than carved on a wall",
            r: "Your grandmother approves. You work for others, and owe nobody a crumb.",
            fx: {trait:"cautious",honor:1},
          },
        ],
      },
      {
        id: "pp_dw_loandue",
        title: "The Bank comes to collect",
        cond: (p,C)=>C.race(p,"dwarf")&&C.adult(p)&&C.flag(p,"pp_dw_loan")&&A.S.year-p.flags.pp_dw_loan>=4,
        w: 2,
        once: !0,
        text: 'The clerk of House Goldvein is back, in the same black coat, with the same carved contract. The loan is due: one hundred and fifty suns, all of it. "A black cap never forgets a penny," they say in Ostra; the Hold Bank does not even wear a cap. Names of debtors go on the Wall, and their heirs inherit the debt for 300 years.',
        choices: [
          {
            t: "Pay it in full (150 suns)",
            req: p=>p.coin>=150,
            r: "The clerk strikes the contract through with a chisel and gives you the stone. You keep it on your mantel for the rest of your life.",
            fx: {coin:-150,unflag:"pp_dw_loan",honor:3,happy:4},
          },
          {
            t: "Pay what you have and ask for a year",
            check: {s:"persuasion",s2:"trade",d:48},
            win: {
              r: 'The clerk takes your coin, a pledge on the workshop and another year. "We are patient," he says. "We are very, very patient."',
              fx: {coinPct:-.6,flag:"pp_dw_loan",wil:1},
            },
            lose: {
              r: "The clerk takes your coin, and your workshop, and carves your name low on the Wall anyway.",
              fx: {coinPct:-.8,unflag:"pp_dw_loan",flag:"pp_dw_wall",honor:-10,happy:-10,wil:2.5},
            },
          },
          {
            t: "Refuse. Let them carve it",
            r: "They do. Your name, near the floor of the First Hall, below three emperors. Every dwarf of every hold will know it in a year.",
            fx: {unflag:"pp_dw_loan",flag:"pp_dw_wall",honor:-15,happy:-8,wil:2},
          },
        ],
      },
      {
        id: "pp_dw_tally",
        title: "The weigh-book",
        cond: (p,C)=>C.race(p,"dwarf")&&C.adult(p)&&(dwHold(p)||C.job(p,"miner")),
        w: 1,
        cool: 12,
        setup: (p,ctx)=>{setPid(p,ctx,"dwarf",{occ:"your shift partner"})},
        text: "The weigh-master checks your shift's ore against the carved weights and frowns. Your tally marks say forty loads; the weigh-book says thirty-six. Someone has been moving your marks. {themFull}, your shift partner for twelve years, does not meet your eye.",
        choices: [
          {
            t: "Accuse {them} before the weigh-master",
            check: {s:"intrigue",s2:"int",d:44},
            win: {
              r: "You show the scratch where your mark was ground out and recut as {theirHis}. {them} confesses. A contract-breaker pays double and is remembered for 300 years.",
              fx: {coin:12,honor:2,them:{type:"enemy",op:-40}},
            },
            lose: {
              r: "You cannot prove it, and now everyone knows you tried. Your shift goes very quiet.",
              fx: {honor:-3,them:{type:"rival",op:-25}},
            },
          },
          {
            t: "Talk to {them} alone first",
            check: {s:"diplomacy",s2:"wil",d:40},
            win: {
              r: "{tHe} owes money to a human gambler at the gate. You work out a plan together, and the marks go back where they belong.",
              fx: {honor:2,them:{type:"friend",op:25},skill:{diplomacy:2}},
            },
            lose: {
              r: "{tHe} denies it, and takes another partner the next season.",
              fx: {them:{type:"rival",op:-15},happy:-2},
            },
          },
          {
            t: "Ask the weigh-master for a full recount",
            check: {s:"learning",s2:"int",d:38},
            win: {
              r: "Two days of weighing and the carved weights tell the truth: thirty-nine, not thirty-six. Someone at the weigh-house was skimming. Not {them}. You feel ashamed, and relieved.",
              fx: {coin:6,int:.4,them:{type:"friend",op:10}},
            },
            lose: {
              r: "Thirty-six. The weights do not lie, and you cannot prove your marks. You let it go.",
              fx: {coin:-4,wil:.6},
            },
          },
        ],
      },
      {
        id: "pp_dw_gems",
        title: "The lower gate",
        cond: (p,C)=>dwHold(p)&&C.adult(p),
        w: 1,
        cool: 12,
        setup: (p,ctx)=>{setPid(p,ctx,"human",{status:"peasant",sex:"M",occ:"a porter of the lower gate",frac:3})},
        text: "Your turn on the lower gate, where every human porter leaving the hold is searched for gems. Old {themFull} has carried for your clan for thirty years and always shares his bread. Tonight he talks too carefully, and one cheek is fuller than the other.",
        choices: [
          {
            t: "Make him open his mouth",
            r: "A ruby the size of a pea, wet on your palm. He weeps. The gate wardens take him away, and your clan finds another porter.",
            fx: {honor:2,favor:2,them:{type:"enemy",op:-30},happy:-3},
          },
          {
            t: "Look away. Wave him through",
            r: "He goes out into the dark without a word. You never see him at the gate again. You hope he bought a farm.",
            fx: {honor:-4,happy:1,them:{type:"friend",op:20}},
          },
          {
            t: "Take him aside and hold out your hand",
            check: {s:"persuasion",s2:"ins",d:38},
            win: {
              r: "He spits it out and you put it back in the sorting tray yourself, unremarked. He carries for you for another ten years, and never again with a full cheek.",
              fx: {honor:2,them:{type:"friend",op:30},skill:{persuasion:2}},
            },
            lose: {
              r: "He panics and runs for the gate. The wardens bring him down in the snow.",
              fx: {happy:-4,them:{type:"enemy",op:-20}},
            },
          },
        ],
      },
      {
        id: "pp_dw_livingwall",
        title: "The Living Wall",
        cond: (p,C)=>C.realm(p,"POL-28")&&C.race(p,"dwarf")&&C.adult(p)&&!C.old(p),
        w: 1,
        once: !0,
        text: 'The Gate Wardens of Kelfast have held their passage the same way since the hold was cut: the Living Wall. Shield Elder Eyvind Graywall sets you alone in a practice gallery two metres wide. Padded rams come at you, one after another, for a quarter of an hour. "Set your feet," he says. "Then do nothing. Then do one thing."',
        choices: [
          {
            t: "Set your feet and hold",
            check: {s:"shield",s2:"sta",d:52},
            win: {
              r: "Rams, shoulders, a man with a hook for your rim. A quarter of an hour, and your feet have not moved a hand. Eyvind nods once. You are a Gate Warden.",
              fx: {skill:{shield:5},sta:.6,fame:2,flag:"pp_dw_warden"},
            },
            lose: {
              r: 'The fourth ram takes you off your feet. Eyvind helps you up. "Again," he says, as he will for the next ten years.',
              fx: {skill:{shield:3},health:-5,wil:1.5},
            },
          },
          {
            t: "Strike back over the rim with the pick",
            check: {s:"axe",s2:"ins",d:50},
            win: {
              r: 'You wait until the weight lands on your shield, then the pick comes over. The man with the hook sits down hard. Eyvind says, "Better. Too early."',
              fx: {skill:{axe:3,shield:2},ins:.4},
            },
            lose: {
              r: 'You strike too early, the rim lifts, and the ram comes through. "Nothing, then one thing," says Eyvind. "Not one thing, then nothing."',
              fx: {skill:{shield:2},health:-6},
            },
          },
          {
            t: "Ask him about the door of 1084",
            check: {s:"intrigue",s2:"diplomacy",d:56},
            win: {
              r: 'He is quiet for a long time. "Forty on the wrong side. Six hundred on the right. I gave the order." Nobody else alive has heard him say it.',
              fx: {flag:"pp_dw_door1084",skill:{intrigue:2},wil:1},
            },
            lose: {r:'"The door was shut," he says. "Set your feet."',fx:{skill:{shield:1}}},
          },
        ],
      },
      {
        id: "pp_dw_darktest",
        title: "The dark test",
        cond: (p,C)=>C.realm(p,"POL-10")&&C.race(p,"dwarf")&&C.adult(p)&&!C.old(p),
        w: 1,
        once: !0,
        text: "The Shield Gallery of Irondeep has a test that no other school uses: a sealed gallery with no light at all, and ten spearmen sent at you one by one. A master blocks nine thrusts in ten by ear: the breath, the scrape of a sole, the moment the weight lands. Gate-Warden Harrek Stonejaw seals the door behind you.",
        choices: [
          {
            t: "Listen, and thrust when the weight lands",
            check: {s:"shield",s2:"wil",d:56},
            win: {
              r: "Seven of ten blocked, and two of your own thrusts home in the black. When the door opens Harrek grunts, which from him is a song.",
              fx: {skill:{shield:5,spear:2},ins:.6,fame:2},
            },
            lose: {
              r: "Four of ten. The blunt spears find you again and again. You come out bruised from boot to beard, with one sense sharper than before.",
              fx: {skill:{shield:3},health:-8,ins:.4,wil:1.5},
            },
          },
          {
            t: "Make yourself small and still, and let them hunt you",
            check: {s:"stealth",s2:"ins",d:52},
            win: {
              r: "They cannot hear you, and you hear them. Harrek is annoyed: it is not the test. He also writes your name down.",
              fx: {skill:{stealth:3,shield:2},ins:.5},
            },
            lose: {r:"Your mail chinks. Ten spearmen know exactly where you are.",fx:{health:-8,wil:1}},
          },
          {
            t: "Ask Harrek who the boy is in the carters' camp",
            req: (p,C)=>C.skill(p,"intrigue")>=30,
            r: 'He goes white under his crooked jaw. "Go home," he says. The test is cancelled. You have made a dangerous friend, or a dangerous enemy.',
            fx: {skill:{intrigue:3},flag:"pp_dw_tofi"},
          },
        ],
      },
      {
        id: "pp_dw_axehall",
        title: "Hook before cut",
        cond: (p,C)=>C.realm(p,"POL-28","POL-29")&&C.race(p,"dwarf")&&C.adult(p)&&!C.old(p),
        w: .9,
        once: !0,
        text: "The Axe Hall of Mormund teaches one thing above all: hook before you cut. The beard of the axe takes a shield rim or an ankle, and the cut comes on the pull. Torvald Rockcleaver, who stood still before five war elephants at Tiravi and cut their heel cords, puts a practice axe in your hands.",
        choices: [
          {
            t: "Hook the shield and cut on the pull",
            check: {s:"axe",s2:"str",d:50},
            win: {
              r: 'The rim comes down, the man comes with it, and your practice blade taps his helm. Torvald roars with laughter. "Again! Faster!"',
              fx: {skill:{axe:5},str:.4,fame:1},
            },
            lose: {
              r: "The hook catches nothing and you overbalance into the sand. Torvald hauls you up by the collar.",
              fx: {skill:{axe:3},health:-4},
            },
          },
          {
            t: "Go low and take the ankle",
            check: {s:"axe",s2:"ins",d:48},
            win: {
              r: 'The hook takes him above the heel and he folds. "That is how you drop an elephant," says Torvald, "only bigger."',
              fx: {skill:{axe:4},ins:.5},
            },
            lose: {r:"He steps over your axe and taps your head with his.",fx:{skill:{axe:2},happy:-2}},
          },
          {
            t: "Ask him about the blade in his chest",
            check: {s:"intrigue",s2:"diplomacy",d:58},
            win: {
              r: 'Drunk, late, he shows it to you: a Chanari blade with an Emberhand rune on the tang. "Proof," he says. "Of what, I have not decided."',
              fx: {flag:"pp_dw_rune",skill:{intrigue:3}},
            },
            lose: {r:'"What blade?" says Torvald, very loudly, and the hall goes quiet.',fx:{honor:-1}},
          },
        ],
      },
      {
        id: "pp_dw_countermine",
        title: "Digging under the wall",
        cond: (p,C)=>dwHold(p)&&C.adult(p)&&!C.old(p)&&(C.atWar(p)||C.prof(p,"siegecraft",30)||C.soldier(p)),
        w: 1,
        cool: 12,
        text: "In the lowest gallery under the outer wall, a bowl of water on the floor shivers. Tap. Tap. Scrape. Someone is digging toward the hold from outside, or the mountain is moving, and both are bad. Dwarves mine under walls better than anyone; it is a strange thing to be on the other end of it.",
        choices: [
          {
            t: "Lay your ear on the rock and find the line",
            check: {s:"siegecraft",s2:"int",d:46},
            win: {
              r: "You plot it to a hand's width: a human sap, timbered badly, aimed at the gate tower. The sappers dig a countermine to meet it.",
              fx: {skill:{siegecraft:4},fame:2,merit:2},
            },
            lose: {
              r: "You put it under the wrong tower. The sappers dig for a week into nothing.",
              fx: {skill:{siegecraft:2},wil:.8},
            },
          },
          {
            t: "Break into their tunnel with axe and lamp",
            r: "The last wall of rock falls in. A frightened human sapper with a pick stares at you in the lamplight.",
            fx: {
              merit: 1,
              duel: {
                tier: 2,
                title: "a sapper in the dark",
                opts: {kind:"duel",place:"a tunnel under the wall",lethal:!0,toYield:!0,title:"Under the wall"},
              },
            },
          },
          {
            t: "Flood their sap from the old water channel",
            check: {s:"craft",s2:"siegecraft",d:48},
            win: {
              r: "You open the sluice. The scraping stops, and a long time later you hear shouting on the far side of the mountain.",
              fx: {skill:{siegecraft:3,craft:1},merit:2,honor:-1},
            },
            lose: {
              r: "The water goes the wrong way and floods your own gallery. Nobody dies. Everyone remembers.",
              fx: {honor:-2,wil:1},
            },
          },
        ],
      },
      {
        id: "pp_dw_stonebairn",
        title: "The stonebairn",
        cond: (p,C)=>C.race(p,"dwarf")&&C.adult(p)&&(C.realm(p,"POL-10")||!dwHold(p)),
        w: .8,
        cool: 30,
        setup: (p,ctx)=>{ctx.kid=humanName(p,A.chance(.6)?"M":"F")},
        text: "At the carters' camp outside the gate a broad, short youth called {kid} waits for you every evening. Human mother, dwarf father: a stonebairn, sterile, barred from every hold by the Deep Law. {kid} wants to learn the forge. Teaching an outsider breaks the Judgment of 904.",
        choices: [
          {
            t: "Teach {kid} in secret, in a human smithy",
            r: "Two evenings a week, under a human's roof. The youth has dwarf hands and a human hurry. You have never had a better student, and never been in more danger.",
            fx: {flag:"pp_dw_bairn",skill:{craft:2,learning:2},honor:-2,newRel:{type:"friend",op:40}},
          },
          {
            t: "Refuse, gently, and give the youth a good knife",
            r: '"The law is carved," you say. {kid} takes the knife and walks off without a word. You hear later that {kid} went south to the Marches.',
            fx: {honor:1,happy:-3,wil:1},
          },
          {
            t: "Take the case to the Law-Carvers",
            check: {s:"learning",s2:"persuasion",d:56},
            win: {
              r: 'You find a clause from the year 700 allowing a hold to hire "those of no hold" as carters and porters. {kid} gets a contract and a cot inside the outer gate. A small door, opened a crack.',
              fx: {honor:4,fame:2,skill:{learning:3}},
            },
            lose: {
              r: "The Law-Carver reads your petition and puts your name on a list. It is not a good list.",
              fx: {honor:-2,favor:-3},
            },
          },
        ],
      },
      {
        id: "pp_dw_lowfever",
        title: "Lowland fever",
        cond: (p,C)=>C.race(p,"dwarf")&&C.ageAdj(p)>=10&&!inR(p,DWR),
        w: 1,
        cool: 12,
        text: "The hold's cold rock keeps fevers away; human towns breed them. The damp summer in {home} has given you a lowland fever that shakes your whole body, and the human physician wants to bleed you. Dwarves die of lowland fevers when they live among humans. Your clan is a month's walk away.",
        choices: [
          {
            t: "Let the physician bleed you",
            check: {s:"sta",s2:"wil",d:44},
            win: {
              r: "Whether it is the bleeding or your dwarf constitution, the fever breaks on the ninth day.",
              fx: {health:-6,wil:1,sta:.3},
            },
            lose: {
              r: "Weak from the fever and weaker from the bleeding, you lie a month in the dark. You live.",
              fx: {health:-20,wil:2,cause:"a lowland fever"},
            },
          },
          {
            t: "Find the dwarf bone-setter in the smith quarter",
            check: {s:"medicine",s2:"int",d:38},
            win: {
              r: "She makes you sweat it out in a cellar at hold temperature, with beer and willow bark. Ten days, and you are back at the forge.",
              fx: {health:-4,skill:{medicine:2}},
            },
            lose: {r:"The cellar is damp, not cold. It helps a little.",fx:{health:-12,wil:1,cause:"a lowland fever"}},
          },
          {
            t: "Walk up into the hills, sick or not",
            check: {s:"sta",s2:"survival",d:50},
            win: {
              r: "Three days of climbing, and at the snowline the fever lifts like a weight. You come back down a new dwarf.",
              fx: {sta:.6,wil:1.5,health:-3},
            },
            lose: {
              r: "You collapse at the second milestone and wake in a shepherd's hut. He nurses you, puzzled, for two weeks.",
              fx: {health:-16,wil:2,newRel:{type:"friend",op:20},cause:"a lowland fever"},
            },
          },
        ],
      },
      {
        id: "pp_dw_smithquarter",
        title: "The guild price",
        cond: (p,C)=>C.race(p,"dwarf")&&C.adult(p)&&!inR(p,DWR)&&free(p),
        w: 1,
        cool: 15,
        text: "You keep a forge in the dwarf smith quarter of {home}. Your mail is better than any human's and costs less, and the human smiths' guild has noticed. Their warden comes with two apprentices and a parchment: dwarves may sell only at the guild price, or not at all.",
        choices: [
          {
            t: "Raise your price to the guild rate",
            r: "You sell less, and earn more on each. The guild warden nods to you in the street. Your customers grumble, and come anyway.",
            fx: {coin:10,honor:1},
          },
          {
            t: "Ask to join the guild instead",
            check: {s:"persuasion",s2:"craft",d:48},
            win: {
              r: "You pay the 40 suns and show a master-piece. They cannot refuse it, and they know it. You are the first dwarf on their rolls.",
              fx: {coin:-40,fame:2,skill:{persuasion:2},flag:"pp_dw_guildhuman"},
            },
            lose: {
              r: "They make you pay the entry fee, then find a reason to refuse. The fee is not returned.",
              fx: {coin:-20,wil:1.5},
            },
          },
          {
            t: "Refuse. You keep contracts, not their parchments",
            check: {s:"wil",s2:"intimidation",d:46},
            win: {
              r: "They break your shutters twice that winter. In spring the guild warden orders a coat of your mail, quietly. You charge him the guild price.",
              fx: {wil:1.5,coin:15,trait:"stubborn"},
            },
            lose: {
              r: "The town council backs the guild. You pay a fine and sell at their price after all.",
              fx: {coin:-15,honor:-1},
            },
          },
        ],
      },
      {
        id: "pp_dw_sink",
        title: "The ferry",
        cond: (p,C)=>C.race(p,"dwarf")&&C.ageAdj(p)>=12&&(!inR(p,DWR)||C.terr(p,"hills","plains","tundra")),
        w: .8,
        cool: 20,
        text: "The ferry over the swollen river at {home} is a raft on a rope, and halfway across a tree-trunk comes down the flood and slams into it. The raft tips. Humans in the water are swimming already. Dwarves sink: dense bones, every child of the holds knows it.",
        choices: [
          {
            t: "Grab the ferry rope and hold on",
            check: {s:"str",s2:"wil",d:40},
            win: {
              r: "Dwarf grip: half again a human's. You hang on the rope with the river trying to pull your boots off, and haul yourself hand over hand to the bank.",
              fx: {str:.5,wil:1.5},
            },
            lose: {
              r: "The rope burns through your hands. You go under like an anvil. A human fisherman gaffs you by the belt.",
              fx: {health:-15,wil:2,cause:"drowning"},
            },
          },
          {
            t: "Grab a floating barrel",
            check: {s:"ins",s2:"spd",d:38},
            win: {
              r: "You ride it a mile downstream, swearing in Holdspeech the whole way, and wash up on a gravel bar.",
              fx: {happy:2,wil:1},
            },
            lose: {
              r: "The barrel rolls. You sink. You walk out of the river on the bottom, which nobody believes afterward, and nearly die doing it.",
              fx: {health:-12,wil:2.5,fame:1,cause:"drowning"},
            },
          },
          {
            t: "Grab the human child beside you and the rope together",
            check: {s:"str",s2:"sta",d:50},
            win: {
              r: "One arm on the rope, one round a screaming child. The whole bank cheers when you come out of the water. Humans do not expect it of a dwarf.",
              fx: {honor:5,fame:3,str:.4},
            },
            lose: {
              r: "You hold the child above the water while you go under. Someone takes the child. Someone else takes you, eventually.",
              fx: {honor:4,health:-16,wil:2,cause:"drowning"},
            },
          },
        ],
      },
      {
        id: "pp_dw_porters",
        title: "Forty kilos up the pass",
        cond: (p,C)=>C.race(p,"dwarf")&&C.adult(p)&&(C.terr(p,"mountains","tundra","hills")||dwHold(p)),
        w: 1,
        cool: 12,
        setup: (p,ctx)=>{setPid(p,ctx,"human",{status:"peasant",occ:"a hired porter"})},
        text: "You lead a string of human porters up to the hold with forty kilos each: barley, salt, Ranpuri sugar. Above four thousand metres the humans sicken, as they always do. {themFull} sits down in the snow, grey-lipped and wheezing, and says {theyHe} cannot go on.",
        choices: [
          {
            t: "Shoulder {theirHis} load on top of yours",
            check: {s:"sta",s2:"str",d:46},
            win: {
              r: "Eighty kilos to the gate. Dwarven endurance is half again a human's, and today you spend all of it. {them} walks behind you, light-headed and grateful.",
              fx: {sta:.7,str:.4,honor:3,them:{type:"friend",op:30}},
            },
            lose: {
              r: "You make it, but your knees will remember. Dwarves are not made for eighty.",
              fx: {wound:"bad_knee",honor:3,them:{type:"friend",op:25}},
            },
          },
          {
            t: "Walk {themHim} back down below the sickness",
            r: "A day lost, and the barley late. At three thousand metres the colour comes back to {theirHis} face, and {theyHe} shakes your hand for a long time.",
            fx: {honor:2,coin:-5,them:{type:"friend",op:25}},
          },
          {
            t: "Leave {themHim} water and press on",
            r: "The barley arrives on time. {them} comes down off the mountain alone two days later and never carries for a dwarf again.",
            fx: {coin:5,honor:-3,them:{type:"enemy",op:-20}},
          },
        ],
      },
      {
        id: "pp_dw_unburied",
        title: "Under open sky",
        cond: (p,C)=>C.race(p,"dwarf")&&C.adult(p),
        w: .8,
        cool: 30,
        setup: (p,ctx)=>{ctx.kin=A.pick(["your uncle","your cousin","your old master","your brother-in-law"]),ctx.Kin=A.cap(ctx.kin),ctx.where=A.pick(["under an avalanche on the high road","on a battlefield in human lands","at the bottom of a gorge below the trade road"])},
        text: "Word comes that {kin} died {where}, and the body is still lying out under the open sky. For a dwarf there is no worse fate: the unburied wander in the cold forever, and never reach the Ancestors' Hall. Nobody else from the clan can go.",
        choices: [
          {
            t: "Go yourself, and carry {kin} home",
            check: {s:"survival",s2:"sta",d:46},
            win: {
              r: "Nine days out, nine back, the body wrapped in sailcloth on a sled. {Kin} is laid in the rock vault with the tools of a lifetime. The whole clan stands for you.",
              fx: {honor:6,piety:4,wil:2,fame:1},
            },
            lose: {
              r: "You reach the place and bring {kin} home, but the cold takes two of your toes on the way.",
              fx: {honor:5,piety:3,wound:"frostbite",wil:2},
            },
          },
          {
            t: "Pay humans to fetch the body (30 suns)",
            req: p=>p.coin>=30,
            r: "They bring back a sealed box. You open it in the vault, because you must know. It is {kin}. Mostly.",
            fx: {coin:-30,piety:2,happy:-3},
          },
          {
            t: "You cannot go. Carve the name and grieve",
            r: "The Law-Carver carves the name in the vault over an empty shelf. It is not the same, and everyone knows it is not the same.",
            fx: {piety:-2,happy:-6,wil:1.5},
          },
        ],
      },
      {
        id: "pp_dw_turnedstone",
        title: "The stone that faces the wall",
        cond: (p,C)=>C.race(p,"dwarf")&&C.adult(p)&&C.realm(p,"POL-28","POL-10"),
        w: .8,
        cool: 40,
        text: "In the ancestor vaults, among the shelves of your clan, there is a stone turned to face the wall. That is where the Deep Law carves the names of smiths who leaked a forge secret: their names are not ground out, only turned away forever. Cleaning the vault, you see your own clan mark cut into its back.",
        choices: [
          {
            t: "Ask the Law-Carver whose name it is",
            check: {s:"learning",s2:"persuasion",d:44},
            win: {
              r: "The Carver opens the old roll: your great-great-grandfather, who taught a human prince the wire-draw for mail in the year 802. She tells you the prince paid in grain during a famine. You do not know what to feel.",
              fx: {int:.5,skill:{learning:2},wil:1.5,trait:"curious"},
            },
            lose: {r:'"It faces the wall so nobody asks," she says. That is all.',fx:{wil:.5}},
          },
          {
            t: "Turn it around to read it, alone",
            check: {s:"str",s2:"stealth",d:46},
            win: {
              r: 'It takes everything you have. A name, a date, a single word: "Hunger." You turn it back and never tell anyone.',
              fx: {piety:-3,wil:2,flag:"pp_dw_stone"},
            },
            lose: {
              r: "It slips and cracks against the shelf. You cannot hide it. The Law-Carvers are not forgiving.",
              fx: {honor:-8,piety:-4,coin:-20},
            },
          },
          {
            t: "Leave it as the law wants",
            r: "You dust it like all the others, the back of it too. Somebody should.",
            fx: {piety:2,trait:"humble"},
          },
        ],
      },
      {
        id: "pp_dw_drieddead",
        title: "The drying galleries",
        cond: (p,C)=>C.realm(p,"POL-29")&&C.race(p,"dwarf")&&C.ageAdj(p)>=10,
        w: 1,
        cool: 15,
        setup: (p,ctx)=>{ctx.who=A.pick(["grandmother","grandfather","aunt","old master"])},
        text: "Emberdeep dries its dead for a year in the hot galleries before they go into the rock, and families visit them there. You bring dark beer to your {who}, as is done, and sit in the steam among the still shapes. Then you notice the shelf beside {who}: a stranger, and someone has taken the tools that should lie with them.",
        choices: [
          {
            t: "Find out who robbed the dead",
            check: {s:"intrigue",s2:"tracking",d:46},
            win: {
              r: 'A human porter with debts, and a Ranpuri trader who buys "antique dwarf tools". The Carvers wall the porter out of the hold in winter. The tools go back on the shelf.',
              fx: {honor:4,skill:{intrigue:2},piety:2,fame:1},
            },
            lose: {
              r: "The trail goes cold at the road gate. The stranger lies in the steam without a hammer.",
              fx: {happy:-3,wil:.8},
            },
          },
          {
            t: "Lay your own spare hammer beside the stranger",
            r: "Nobody should go to the Ancestors' Hall empty-handed. You will never know whose kin they were.",
            fx: {piety:4,honor:2,trait:"kind"},
          },
          {
            t: "Sit with your {who}, and tell the old jokes",
            r: "You stay until the beer is gone. The steam hisses through the springs, hotter than it was in your childhood. Everyone says so.",
            fx: {happy:3,piety:2},
          },
        ],
      },
      {
        id: "pp_dw_dagna",
        title: "The missing verse",
        cond: (p,C)=>C.realm(p,"POL-29")&&C.race(p,"dwarf")&&C.ageAdj(p)>=10,
        w: 1,
        cool: 20,
        text: "Dagna's Day, in autumn: the whole hold sings the founding chant of Emberdeep, and at one place the singers stop for exactly one breath and go on. Every year. Every child asks why. Nobody answers. This year you decide to find out.",
        choices: [
          {
            t: "Ask the oldest Carver directly",
            check: {s:"diplomacy",s2:"learning",d:46},
            win: {
              r: 'She sighs. "Dagna Hammerhand and her people did not leave Stonehold. They were exiled from it, for a killing. That verse names the dead." She sings it once, very low.',
              fx: {int:.5,skill:{learning:3},flag:"pp_dw_verse"},
            },
            lose: {r:'"It is sung by being left out," she says, and smiles, and that is all.',fx:{wil:.5}},
          },
          {
            t: "Search the oldest carvings in the founding hall",
            check: {s:"learning",s2:"int",d:50},
            win: {
              r: 'Behind a forge-screen, worn almost smooth: a name, the word "struck", and a Stonehold clan mark. Now you know why the holds bicker like brothers.',
              fx: {skill:{learning:3},int:.6,flag:"pp_dw_verse"},
            },
            lose: {r:"You find a great deal of old soot and nothing else.",fx:{}},
          },
          {
            t: "Hold the silence with everyone else",
            r: "One breath, held by a whole mountain. It is the most beautiful moment of the year, and you decide you do not need to know.",
            fx: {piety:3,happy:2},
          },
        ],
      },
      {
        id: "pp_dw_durek",
        title: "Durek's Road",
        cond: (p,C)=>C.race(p,"dwarf")&&C.ageAdj(p)>=12&&(C.realm(p,"POL-29")||!dwHold(p)),
        w: .8,
        cool: 25,
        text: `A human minstrel in the tavern of the lower halls strikes up "Durek's Road": "Forty-one went up the road, / forty-one with the iron load." He sings it cheerfully, for a coin. Everyone from Emberdeep at the tables has gone very still. In Emberdeep no child is ever named Durek, after the heir who died in 612.`,
        choices: [
          {
            t: "Take his lute and sing it the Emberdeep way",
            check: {s:"music",s2:"wil",d:40},
            win: {
              r: "Slow, low, and with the last verse spoken, not sung. The minstrel listens with his mouth open, and nobody in the tavern says a word for a long time.",
              fx: {skill:{music:3},honor:3,fame:1},
            },
            lose: {r:"You forget the third verse halfway, and the silence becomes something else.",fx:{happy:-3}},
          },
          {
            t: "Tell him quietly why it is not sung here",
            check: {s:"diplomacy",s2:"int",d:34},
            win: {
              r: "He goes pale, apologizes to the room and buys a round. He will never sing it cheerfully again.",
              fx: {skill:{diplomacy:2},honor:2},
            },
            lose: {
              r: `"It's just a song," he says, and that is the wrong thing to say.`,
              fx: {
                duel: {
                  tier: 1,
                  title: "a minstrel's bodyguard",
                  opts: {kind:"brawl",place:"the tavern",lethal:!1,toYield:!0,title:"Durek's Road"},
                },
              },
            },
          },
          {
            t: "Ask him who taught him the eggs verse",
            check: {s:"intrigue",s2:"learning",d:50},
            win: {
              r: "A Red Stair monk in Skyhold, he says. The song he knows says Durek's party had robbed a dragon's nest. The holds never sing that part.",
              fx: {skill:{intrigue:3},int:.4},
            },
            lose: {r:"He shrugs. He learned it from another minstrel, who learned it from another.",fx:{}},
          },
        ],
      },
      {
        id: "pp_dw_escape",
        title: "The long gallery east",
        cond: (p,C)=>C.realm(p,"POL-29")&&C.race(p,"dwarf")&&C.adult(p)&&free(p),
        w: 1,
        once: !0,
        text: `You are taken on for a digging crew at triple wages, sworn to silence by a Forge-Master you have never met. The gallery runs east, wide enough for carts, far beyond any seam, toward Balmund. The springs, the Smith-Father's breath, have grown hotter for fifty years. "The mountain will open and the old fire will return," says the prophecy.`,
        choices: [
          {
            t: "Dig, take the wages and ask nothing",
            check: {s:"str",s2:"sta",d:40},
            win: {
              r: "A season of hard rock and good pay. You know exactly what it is for, and you sleep with your boots on.",
              fx: {coin:40,str:.5,sta:.4},
            },
            lose: {
              r: "A season of hard rock. A fall cracks your ribs in the last week.",
              fx: {coin:25,health:-10,wound:"broken_ribs"},
            },
          },
          {
            t: "Find out who is paying",
            check: {s:"intrigue",s2:"int",d:50},
            win: {
              r: "Ranpuri temple-bank lotus, forty thousand of them, borrowed by the Forge-Queen herself. She is digging a way out for her people, and lying to them to keep them calm.",
              fx: {skill:{intrigue:3},flag:"pp_dw_escape",int:.5},
            },
            lose: {
              r: "A foreman sees you counting the pay-chests. You are dismissed with half wages and a warning.",
              fx: {coin:10,favor:-3},
            },
          },
          {
            t: "Tell your clan to be ready to leave",
            r: "Your clan elders listen, then argue for a month, then start quietly packing tools into crates. Panic, or prudence. Time will tell which.",
            fx: {honor:2,skill:{stewardship:2},flag:"pp_dw_escape"},
          },
        ],
      },
      {
        id: "pp_dw_trial",
        title: "The Founding trial",
        cond: (p,C)=>early()&&dwHold(p)&&C.adult(p),
        w: 1.2,
        once: !0,
        text: p=>p.realm==="POL-29"?"3 March, the Founding, and the Eldest Carver in Stonehold calls Emberdeep to answer: did your forges teach the Chanari humans crucible steel? If so, the Judgment of 904 says exile or blood-price. You are in Stonehold's lower halls on clan business, and a Stonehold smith spits on your boots.":"3 March, the Founding. The Eldest Carver calls Emberdeep to answer for teaching the Chanari humans crucible steel; a verdict could crack the Judgment of 904 that binds the three holds. A Stonehold clerk is asking every smith who has seen a Chanari blade to testify to the rune on its tang.",
        choices: [
          {
            t: p=>p.realm==="POL-29"?"Wipe your boot on his apron and walk on":"Testify to what you have seen",
            check: {s:"wil",s2:"diplomacy",d:42},
            win: {
              r: p=>p.realm==="POL-29"?'He stares, then laughs despite himself. "Brothers," he says. "We fight like brothers." He buys you a beer.':"You describe the rune exactly, and nothing more. The Carvers thank you for not guessing.",
              fx: {honor:3,wil:1},
            },
            lose: {
              r: p=>p.realm==="POL-29"?"It becomes a brawl, and a Gate Warden throws you both out of the hall.":"The Emberdeep delegation marks your face. You will not be welcome at the Kardeep road gate again.",
              fx: {health:-4,honor:-1,newRel:{type:"rival",op:-20}},
            },
          },
          {
            t: "Keep your head down and your mouth shut",
            r: "The trial grinds on, clause by clause. Holds have quarreled before and been brothers afterward. Probably.",
            fx: {trait:"cautious"},
          },
          {
            t: "Listen to every word of the trial",
            r: "Three days of law spoken from memory. You understand the Deep Law better than you ever did, and like it less.",
            fx: {skill:{learning:3},int:.4},
          },
        ],
      },
      {
        id: "pp_dw_ironfort",
        title: "Humans at the lower fort",
        cond: (p,C)=>early()&&C.realm(p,"POL-10")&&C.race(p,"dwarf")&&C.adult(p),
        w: 1.2,
        once: !0,
        text: "1 March. Four hundred Aldmark soldiers march up the Iron Road to garrison the lower fort, by a secret agreement of Queen Brynja's for six thousand bushels of grain. Harrek Stonejaw has argued at every Council since 1091 that the forts must stay in dwarven hands. The hold is hungry, and the hold is furious.",
        choices: [
          {
            t: "Stand with Harrek's wardens at the fort gate",
            check: {s:"intimidation",s2:"wil",d:44},
            win: {
              r: "Four hundred humans file in under the eyes of forty dwarves who do not move. Every one of them knows whose fort it still is.",
              fx: {honor:3,fame:1,favor:-3,skill:{intimidation:2}},
            },
            lose: {
              r: "An Aldmark sergeant shoves a warden, and it nearly becomes a war. The queen's men take your name.",
              fx: {favor:-6,wil:1},
            },
          },
          {
            t: "Sign Thane Korrin's petition to set the queen aside",
            r: "Your mark goes in the wax. In Irondeep wax becomes stone, and stone is remembered, whichever way this goes.",
            fx: {flag:"pp_dw_korrin",favor:-4,skill:{intrigue:2}},
          },
          {
            t: "Say the queen did right: grain or famine",
            check: {s:"persuasion",s2:"int",d:46},
            win: {
              r: "In the tavern you count the bushels against the mouths, out loud. Some come round. More stop talking to you.",
              fx: {favor:4,honor:-1,skill:{persuasion:2}},
            },
            lose: {r:"They call you the queen's mouse, and it sticks for a decade.",fx:{honor:-3,happy:-3}},
          },
        ],
      },
      {
        id: "pp_dw_gates",
        title: "A very long game",
        cond: (p,C)=>C.race(p,"dwarf")&&C.ageAdj(p)>=10,
        w: .9,
        cool: 25,
        setup: (p,ctx)=>{ctx.who=A.pick(["your grandfather","your grandmother","old Snorri of the next gallery","your old master"]),ctx.Who=A.cap(ctx.who)},
        text: 'Gates, the war game of horse, foot and engines, carved in stone. {Who} and you have had one game going on a stone board in the clan gallery for most of your life, one move a night. Tonight {who} leans back and says, "Your move will end it. One way or the other."',
        choices: [
          {
            t: "Study the board for a week, then move",
            check: {s:"tactics",s2:"int",d:46},
            win: {
              r: "Your engine takes the gate. {Who} stares at the board for an hour, then laughs until coughing and pours you the good beer.",
              fx: {skill:{tactics:4},int:.6,happy:4},
            },
            lose: {
              r: "You see the trap a heartbeat after you move. {Who} closes it with great slowness and enormous pleasure.",
              fx: {skill:{tactics:3},int:.4,wil:.5},
            },
          },
          {
            t: "Play the bold move, tonight",
            check: {s:"tactics",s2:"ins",d:50},
            win: {
              r: "Horse through the breach, no hesitation. A game of decades ends in a night. {Who} says your grandmother would have done the same.",
              fx: {skill:{tactics:3},trait:"brave",happy:3},
            },
            lose: {
              r: "Decades of evenings, lost in a night. Everyone in the gallery has an opinion about it for a month.",
              fx: {skill:{tactics:2},happy:-2},
            },
          },
          {
            t: "Make a move that keeps the game going",
            r: '"Coward," says {who}, delighted. The game will go on another ten years, and that was the point.',
            fx: {happy:3,trait:"patient"},
          },
        ],
      },
      {
        id: "pp_dw_seam",
        title: "Silver across the line",
        cond: (p,C)=>C.race(p,"dwarf")&&C.adult(p)&&(dwHold(p)||C.job(p,"miner")),
        w: .9,
        cool: 20,
        setup: (p,ctx)=>{ctx.clan=clanO()},
        text: "Your pick opens a seam of silver as thick as your wrist, the richest you have ever seen. It runs east, straight across the carved boundary stone, into the gallery of Clan {clan}. In the holds a boundary is law, and the law is carved.",
        choices: [
          {
            t: "Report it to the Mine-Masters and share by the law",
            r: "The Mine-Masters measure, argue, and give you a third. A third of a great seam is a fortune. Clan {clan} sends a barrel of beer.",
            fx: {coin:40,honor:3,skill:{stewardship:1}},
          },
          {
            t: "Mine your side fast, and say nothing",
            check: {s:"stealth",s2:"str",d:48},
            win: {
              r: "A season of quiet night shifts. Your side of the seam is gone before anyone else notices it. You are rich and never quite comfortable.",
              fx: {coin:70,honor:-3,trait:"greedy"},
            },
            lose: {
              r: "Clan {clan} hears your picks through the rock. It goes to the Law-Carvers, and the law is not on your side.",
              fx: {coin:-20,honor:-8,newRel:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Go to Clan {clan} and offer a joint contract",
            check: {s:"trade",s2:"diplomacy",d:44},
            win: {
              r: "Two names, one bar. The molten-metal oath is poured, and both clans grow rich on it for a century.",
              fx: {coin:50,honor:4,skill:{trade:3},newRel:{type:"friend",op:30}},
            },
            lose: {
              r: "They take the offer to their own Mine-Master, who finds the seam is mostly theirs.",
              fx: {coin:10,wil:1},
            },
          },
        ],
      },
      {
        id: "pp_dw_oath",
        title: "Two names, one bar",
        cond: (p,C)=>C.race(p,"dwarf")&&C.adult(p)&&free(p),
        w: 1,
        cool: 25,
        setup: (p,ctx)=>{setPid(p,ctx,"dwarf",{occ:A.pick(["a mail-maker","a gem-cutter","a trader of the Iron Road","a brewer of dark beer"])})},
        text: '{themFull}, {themOcc}, proposes a partnership. Among dwarves that is sealed the old way: molten metal poured into a mold with both your names cut in it, so that the bar holds both names forever. "Two names, one bar," as the smiths say. The contract is forty clauses long.',
        choices: [
          {
            t: "Pour the metal",
            r: "The bar cools with your names fused in it. You hang it over the door. For better and worse, you are bound.",
            fx: {coin:25,skill:{trade:2},them:{type:"friend",op:35},flag:"pp_dw_partner"},
          },
          {
            t: "Read every clause first, aloud, with a Law-Carver",
            check: {s:"learning",s2:"int",d:44},
            win: {
              r: "Clause thirty-one gives {them} your workshop if you die. You strike it out; {theyHe} laughs and agrees. The bar is poured. Now you trust each other.",
              fx: {coin:25,skill:{learning:3},them:{type:"friend",op:40}},
            },
            lose: {
              r: "You miss clause thirty-one. You will find it in twenty years.",
              fx: {coin:15,them:{type:"friend",op:20}},
            },
          },
          {
            t: "Refuse. You work alone",
            r: "{them} shrugs, and pours a bar with someone else. Your workshop stays small, and entirely yours.",
            fx: {trait:"stubborn",them:{type:"acquaint",op:-5}},
          },
        ],
      },
      {
        id: "pp_dw_levy",
        title: "Pike, axe and crossbow",
        cond: (p,C)=>C.realm(p,"POL-28","POL-29","POL-10")&&C.race(p,"dwarf")&&C.adult(p)&&!C.old(p)&&!C.soldier(p),
        w: 1,
        cool: 12,
        text: "In {realmShort} every adult trains with pike, axe and crossbow, and the levy can stand in the gate within hours. Today is your clan's drill: crossbows on the wall, bolts at a mark below on the snow, and the sergeant has a bet with another clan's sergeant.",
        choices: [
          {
            t: "Shoot for the clan",
            check: {s:"xbow",s2:"int",d:40},
            win: {
              r: "Five bolts, five in the ring. Your sergeant collects his bet and pours you half of it in beer.",
              fx: {skill:{xbow:4},happy:3,fame:1},
            },
            lose: {
              r: "A bolt skips off the snow toward the other clan's sergeant, who is not amused.",
              fx: {skill:{xbow:2},honor:-1},
            },
          },
          {
            t: "Drill in the pike block instead",
            check: {s:"spear",s2:"sta",d:38},
            win: {
              r: "Step, level, thrust, hold. You hold the line with men who have done this since before your grandfather.",
              fx: {skill:{spear:3},sta:.4},
            },
            lose: {
              r: "You step on the pike-butt of the dwarf behind you and the whole rank wobbles.",
              fx: {skill:{spear:2}},
            },
          },
          {
            t: "Mend the old crossbows for the drill",
            check: {s:"craft",s2:"int",d:34},
            win: {
              r: "Six bows that would not span now shoot true. The armory-master writes your name on the slate.",
              fx: {skill:{craft:3},honor:1},
            },
            lose: {
              r: "A lath snaps in your hands. The armory-master writes your name on a different slate.",
              fx: {coin:-4},
            },
          },
        ],
      },
      {
        id: "pp_dw_hammer",
        title: "The Hammerhand appetite",
        cond: (p,C)=>C.race(p,"dwarf")&&C.blood(p,"hammer")&&C.ageAdj(p)>=12,
        w: 1.3,
        cool: 12,
        text: "You carry the Hammer Arms of Clan Hammerhand: shoulders that can swing a forge-hammer from dawn to dusk. The price is an appetite of five thousand a day, stiff shoulders, and a weak heart; twenty-two carriers have died of the heart before 190. Today, at the anvil, your chest goes tight like a band of iron.",
        choices: [
          {
            t: "Put down the hammer and sit",
            r: "It passes. The apprentices pretend not to notice. You eat more slowly that night, and the night after.",
            fx: {health:-3,trait:"temperate",wil:1},
          },
          {
            t: "Finish the piece. The iron is hot",
            check: {s:"sta",s2:"wil",d:50},
            win: {
              r: "You finish it with your teeth clenched. The pain goes. The piece is the best you have made this year.",
              fx: {skill:{craft:3},wil:1.5,health:-5},
            },
            lose: {
              r: "You wake on the floor of the forge with your apprentice crying. The healer says your heart has had its first warning.",
              fx: {health:-22,wil:2.5,cause:"a Hammerhand heart"},
            },
          },
          {
            t: "See a dwarven healer about it",
            check: {s:"medicine",s2:"wil",d:36},
            win: {
              r: "Less fat mutton, less beer, more walking in the upper galleries. You grumble, and live longer.",
              fx: {health:6,trait:"temperate",skill:{medicine:1}},
            },
            lose: {r:"The healer tells you to eat less. You do not.",fx:{trait:"gluttonous"}},
          },
        ],
      },
      {
        id: "pp_dw_deepeye",
        title: "Above ground by day",
        cond: (p,C)=>C.race(p,"dwarf")&&C.blood(p,"deepeye")&&C.adult(p),
        w: 1.3,
        cool: 12,
        text: "The Deepeye blood lets you see by the glow of a coal. The sun brings crushing headaches, and snow-glare can blind you. Carriers travel above ground only by night, in hooded veils. Today a contract must be signed at the Aldmark camp at noon, and nobody else in the clan has the authority.",
        choices: [
          {
            t: "Go, veiled to the chin",
            check: {s:"wil",s2:"trade",d:44},
            win: {
              r: "You sign it through a slit in black wool, with your head splitting. The humans think you rude. The contract is excellent.",
              fx: {coin:20,wil:2,skill:{trade:2}},
            },
            lose: {
              r: "Halfway across the snowfield the glare takes your sight. A carter leads you back by the hand. The contract is signed by someone else, badly.",
              fx: {health:-6,happy:-4,wil:1.5},
            },
          },
          {
            t: "Ask the humans to come to the gate at dusk",
            check: {s:"diplomacy",s2:"int",d:40},
            win: {
              r: "They grumble, and come. The lamplight in the gate-hall suits you, and you bargain like a king.",
              fx: {coin:15,skill:{diplomacy:2}},
            },
            lose: {r:"They take it as an insult and sign with another clan.",fx:{coin:-5}},
          },
          {
            t: "Send your apprentice with full authority",
            r: "It is terrifying to trust. The apprentice comes back with a good contract and a sunburn, and grows two inches in your eyes.",
            fx: {skill:{command:2},newRel:{type:"friend",op:20}},
          },
        ],
      },
      {
        id: "pp_dw_stonelung",
        title: "No nose for it",
        cond: (p,C)=>C.race(p,"dwarf")&&C.blood(p,"stonelung")&&C.ageAdj(p)>=12,
        w: 1.3,
        cool: 12,
        text: "You are of the Stonelungs: deep lungs that work the high galleries without tiring, and almost no sense of smell. Thirty-one of your line have died in gas pockets since 812, because they could not smell what killed them. Your new shift partner does not know this. Should you tell?",
        choices: [
          {
            t: "Tell your partner everything",
            r: "Your partner sniffs every drift-head like a hound from then on, and you test with the flame twice. Nothing gets past the two of you.",
            fx: {honor:1,newRel:{type:"friend",op:25},trait:"honest"},
          },
          {
            t: "Carry two lamps, always, and say nothing",
            check: {s:"int",s2:"wil",d:36},
            win: {
              r: "The flame never lies, if you remember to look. You remember. Every time.",
              fx: {wil:1,int:.3,trait:"cautious"},
            },
            lose: {
              r: "Once, tired, you forget. You wake at the shaft-foot with your partner pumping your chest.",
              fx: {health:-14,wil:2,cause:"bad air"},
            },
          },
          {
            t: "Volunteer for the high, thin galleries no one else wants",
            check: {s:"sta",s2:"str",d:36},
            win: {
              r: "Where others gasp, you swing. The Mine-Masters pay a premium for Stonelung wind.",
              fx: {coin:15,sta:.5},
            },
            lose: {r:"The air is thin, and so is your luck: a rock shifts.",fx:{health:-8,wil:1}},
          },
        ],
      },
      {
        id: "pp_dw_deepbreath",
        title: "Lowland air",
        cond: (p,C)=>C.race(p,"dwarf")&&C.blood(p,"deepbreath")&&C.adult(p),
        w: 1.3,
        cool: 15,
        text: "The Bardun blood, the Deep Breath, gives you lungs and blood made for the heights. Below a thousand metres carriers sicken within weeks, and the thick blood strains the heart in old age. The Hold Bank needs someone of your rank at Ostra for a season, at the edge of the sea.",
        choices: [
          {
            t: "Go to Ostra anyway",
            check: {s:"sta",s2:"wil",d:50},
            win: {
              r: "A season of headaches and thick air, and the Ostran bankers outfoxed at every table. You come home grey-faced and honored.",
              fx: {fame:2,honor:3,skill:{trade:3},health:-6},
            },
            lose: {
              r: "By the sixth week you cannot climb the stair of the Exchange. They carry you home in a litter.",
              fx: {health:-18,wil:2,cause:"lowland sickness"},
            },
          },
          {
            t: "Refuse, and send a cousin without the blood",
            r: "The cousin does well enough. The Bank notes that a Bardun stayed in the mountain, as they always do.",
            fx: {honor:-1,health:2},
          },
          {
            t: "Do the business by letter, from the hold",
            check: {s:"learning",s2:"trade",d:46},
            win: {
              r: "Forty letters over the passes in a season. Slow, exact and binding. The Ostrans hate it, and sign.",
              fx: {skill:{learning:2,trade:2},coin:15},
            },
            lose: {r:"The letters are too slow. The deal goes to a human bank.",fx:{coin:-5}},
          },
        ],
      },
      {
        id: "pp_dw_hammersong",
        title: "The hammer song",
        cond: (p,C)=>C.race(p,"dwarf")&&C.ageAdj(p)>=12&&(jobIn(p,"smith","miner","mason")||dwHold(p)),
        w: .8,
        cool: 20,
        setup: (p,ctx)=>{ctx.min=humanName(p)},
        text: `Every forge gallery has its hammer songs, and the rhythm of the song is the rhythm of the strikes: a slow one for the big hammer, a fast one for wire. A human minstrel, {min}, has paid the gate fee to sit by your forge and learn one. "For a lord's feast," {min} says. "It will be a sensation."`,
        choices: [
          {
            t: "Teach the song, strike by strike",
            check: {s:"music",s2:"craft",d:36},
            win: {
              r: "By evening {min} can sing it and keep time with a spoon. Next year you hear it sung in a human market, almost right.",
              fx: {skill:{music:3},coin:5,newRel:{type:"friend",op:20}},
            },
            lose: {
              r: "{min} cannot keep the beat to save a life. You give up and teach a drinking song instead.",
              fx: {happy:2},
            },
          },
          {
            t: "Sing it, but not the real one",
            r: "You give {min} a hammer song so slow it would take a week to forge a nail. The lords will love it.",
            fx: {trait:"witty",happy:3},
          },
          {
            t: "Send {min} away. The forge is not a stage",
            r: "The minstrel goes, disappointed. Your forge keeps its rhythm, and its quiet.",
            fx: {trait:"proud"},
          },
        ],
      },
      {
        id: "pp_dw_teen",
        title: "Six years to the carving",
        cond: (p,C)=>C.race(p,"dwarf")&&C.teen(p),
        w: 1.3,
        once: !0,
        setup: (p,ctx)=>{ctx.master=nm(p),ctx.hf=humanName(p)},
        text: `You are twenty-four. Your master, {master}, has bad-air sickness and coughs black every morning, and the name-carving is six years off. {hf}, the human carter's child you grew up with at the gate, is married with two children. You are still "{name}, {master}'s apprentice".`,
        choices: [
          {
            t: "Stay with {master} to the end",
            r: "You do the work of two and learn from the bed, the way {master} wants it done. When the end comes, your hands are {master}'s hands.",
            fx: {skill:{craft:4},wil:2,honor:3},
          },
          {
            t: "Ask the clan for a second master now",
            check: {s:"persuasion",s2:"int",d:28},
            win: {
              r: "A second master takes you on, and lets you visit {master} every evening. You learn two ways of doing everything.",
              fx: {skill:{craft:3,learning:1}},
            },
            lose: {
              r: "The clan says you are disloyal. You stay, and they are right that you wanted to go.",
              fx: {wil:1,happy:-2},
            },
          },
          {
            t: "Go down to visit {hf} and the children",
            r: "They climb on you like a tree. {hf} looks old already. Humans are a strange, quick, warm people.",
            fx: {happy:4,wil:.6},
          },
        ],
      },
      {
        id: "pp_dw_honeyiron",
        title: "Honey for iron",
        cond: (p,C)=>C.realm(p,"POL-10")&&C.race(p,"dwarf")&&C.adult(p),
        w: .9,
        cool: 25,
        text: `The oldest trade either people keeps: Irondeep iron for Sylvaran honey and wax. You ride with the iron carts to the Oak Line stones. The elves appear out of the trees without a sound, and their trader looks at your clan mark and says, "Your grandmother's grandmother cheated us on the weight in 862."`,
        choices: [
          {
            t: '"Then weigh it twice"',
            check: {s:"trade",s2:"wil",d:40},
            win: {
              r: `Weighed twice, on both scales, to the grain. The elf nods. "Your grandmother's grandmother would be ashamed of you. Good."`,
              fx: {coin:15,skill:{trade:3},honor:2},
            },
            lose: {
              r: "The scales disagree by a hair. The argument takes all afternoon, as the elves have plenty of afternoons.",
              fx: {coin:5,wil:.6},
            },
          },
          {
            t: "Throw in an extra bar, for 862",
            r: "The elf is so startled that she smiles. Elves hold grudges for centuries; they also remember payment.",
            fx: {coin:-5,honor:3,newRel:{type:"friend",op:20}},
          },
          {
            t: "Tell her the carved tally says otherwise",
            check: {s:"learning",s2:"persuasion",d:46},
            win: {
              r: "You quote the weigh-book of 862 from memory. She quotes the elven count back. For an hour, two peoples argue about a dead dwarf's scales, and both enjoy it.",
              fx: {skill:{learning:2},int:.3,coin:10},
            },
            lose: {r:"She remembers it better than your book does. She was there.",fx:{happy:-2}},
          },
        ],
      },
      {
        id: "pp_orc_deedname",
        title: "Earning a name",
        cond: (p,C)=>(orcGrass(p)||C.race(p,"orc"))&&(C.teen(p)||C.adult(p)&&C.ageAdj(p)<24)&&!p.epithet&&!C.flag(p,"pp_orc_deed"),
        w: 1.8,
        once: !0,
        setup: (p,ctx)=>{ctx.clan=orcClan(p),ctx.n1=p.realm==="POL-34"?"Horsethief":"Ravenhorse",ctx.n2=p.realm==="POL-34"?"Ironbit":"Hoofbreaker",ctx.n3=p.realm==="POL-34"?"Coldsteppe":"Dustrider",ctx.enemy=p.realm==="POL-34"?"Drevnan farm-forts":"Nine Winds camps"},
        text: 'Among the clans you have no name of your own until you earn one. Until then you are "{name} of the {clan}", and the clan-mothers say it with a little smile. The Great Ride is coming. Every young one of your age is going out to earn a deed-name before it.',
        choices: [
          {
            t: "Steal horses from the {enemy}",
            check: {s:"stealth",s2:"riding",d:44},
            win: {
              r: "Nine horses at dawn, and not one dog barked. The clan-mother ties a red cord in the lead mare's mane and says your new name to the fire.",
              fx: epi("n1",{flag:"pp_orc_deed",fame:3,skill:{stealth:3,riding:2},happy:6}),
            },
            lose: {
              r: "A dog barks, then forty. You come home with one lame mare, an arrow in your saddle and no name.",
              fx: {wil:1.5,health:-6,skill:{riding:1},happy:-3},
            },
          },
          {
            t: "Break the grey stallion nobody can ride",
            check: {s:"riding",s2:"str",d:48},
            win: {
              r: "He throws you nine times. The tenth time he stands, blowing, and lets you sit. The whole camp has been watching. You have a name.",
              fx: epi("n2",{flag:"pp_orc_deed",fame:3,skill:{riding:4,husbandry:2},str:.4}),
            },
            lose: {
              r: "The ninth throw breaks your collarbone. The stallion goes to someone else, and so does the name.",
              fx: {health:-12,wound:"broken_ribs",wil:2,cause:"a wild stallion"},
            },
          },
          {
            t: "Ride the long circuit of the clan's grass alone, in winter",
            check: {s:"survival",s2:"sta",d:46},
            win: {
              r: "Twenty days of snow and wind and dried meat, every camp of the clan visited and its fire-count brought home. Orcs are not made for long efforts. You did it anyway.",
              fx: epi("n3",{flag:"pp_orc_deed",fame:2,skill:{survival:4},sta:.6,wil:1.5}),
            },
            lose: {
              r: "On the ninth day the cold beats you, and a herder brings you home across his saddle.",
              fx: {wound:"frostbite",wil:2,health:-8},
            },
          },
          {
            t: "Hunt the hyenas that take the foals",
            r: "They come at dusk, laughing. Orcs say hyenas carry the souls of the unburied.",
            fx: {flag:"pp_orc_hyena",beast:{id:"CRE-35",place:"the foal pens",mod:.75}},
          },
        ],
      },
      {
        id: "pp_orc_deedlost",
        title: "He left his wave",
        cond: (p,C)=>orcGrass(p)&&C.adult(p),
        w: 1,
        cool: 8,
        setup: (p,ctx)=>{setPid(p,ctx,"orc",{frac:1.4,occ:"a rider of your kin-band"}),ctx.dn=p.realm==="POL-34"?A.pick(["Threespear","Stonefist","Wolfskin"]):A.pick(["Grassfire","Thirdwave","Longspear"])},
        text: "In the summer fight on the border, {them} {dn} broke from the third wave before the drums called it back. A rider who leaves the wave loses the deed-name. The council sits at the fire tonight, and {them} has asked you, of all people, to speak.",
        choices: [
          {
            t: "Speak for {themHim}: {theyHe} carried a wounded rider out",
            check: {s:"persuasion",s2:"wil",d:46},
            win: {
              r: "You make them see it: the rider over the saddle-bow, the arrow in the horse. The council lets {themHim} keep the name. {them} will die for you, gladly, someday.",
              fx: {honor:3,skill:{persuasion:3},them:{type:"friend",op:45}},
            },
            lose: {
              r: 'The clan-mothers have heard every excuse. The name is taken. {them} rides at the back now, "of the {dn} that was".',
              fx: {wil:1,them:{type:"friend",op:20}},
            },
          },
          {
            t: "Tell the truth: {theyHe} ran",
            r: "The name is taken. It is the law of the waves, and the waves only work if everyone believes in it. {them} does not look at you again.",
            fx: {honor:2,trait:"honest",them:{type:"enemy",op:-40}},
          },
          {
            t: "Say nothing, and let the council decide",
            r: "The council takes the name. Your silence was heard too.",
            fx: {them:{type:"rival",op:-20},wil:.5},
          },
        ],
      },
      {
        id: "pp_orc_wintercount",
        title: "The Winter Count",
        cond: (p,C)=>(orcGrass(p)||C.faith(p,"REL-11")&&C.race(p,"orc","halforc"))&&C.ageAdj(p)>=10,
        w: 1.1,
        cool: 6,
        setup: (p,ctx)=>{ctx.ev1=A.pick(["the winter the lake froze to the bottom","the winter of the iron men on the river","the winter the old clan-mother died","the winter the mares foaled twins"])},
        text: `First snow. The shaman unrolls the clan-mother's painted hide, one picture for every winter since the clan began, and dips the brush. Everyone at the fire has an opinion about what this winter will be called forever. The old ones want "{ev1}".`,
        choices: [
          {
            t: "Argue that it should be your deed",
            req: p=>!!p.epithet,
            check: {s:"persuasion",s2:"wil",d:50},
            win: {
              r: "The shaman paints you, very small, on a horse. In a hundred winters children will point at it and ask who that was.",
              fx: {fame:3,happy:6,skill:{persuasion:2}},
            },
            lose: {
              r: 'They laugh, not unkindly. "When you are dead, maybe." The old ones get their picture.',
              fx: {happy:-2,wil:.5},
            },
          },
          {
            t: "Offer to paint it yourself",
            check: {s:"craft",s2:"int",d:40},
            win: {
              r: "Your hand is steady and the shaman lets it stay. Your picture will hang beside the Grey Mothers' hides.",
              fx: {skill:{craft:3},piety:2,honor:2},
            },
            lose: {
              r: "The ochre runs. The shaman fixes it, sighing, and the winter is remembered with a smudge.",
              fx: {happy:-2},
            },
          },
          {
            t: "Ask the shaman to read the oldest pictures aloud",
            r: "Back and back, winter by winter, to a picture of a woman and a mare under lightning. You fall asleep at the fire with the whole clan inside your head.",
            fx: {skill:{learning:2},piety:2,int:.3},
          },
        ],
      },
      {
        id: "pp_orc_storm",
        title: "Storm Coming",
        cond: (p,C)=>C.faith(p,"REL-11")&&C.race(p,"orc","halforc")&&C.ageAdj(p)>=12,
        w: 1,
        cool: 6,
        text: "The first thunder of spring rolls over the grass, and every camp runs out into it. Storm Coming: the drums answer the sky, the shamans build the sweat lodges, and mare's milk is poured on the ground for the Storm-Father and the Mare-Mother. The young ones go into the lodges to see what the ancestors show them.",
        choices: [
          {
            t: "Go into the sweat lodge and stay until you see",
            check: {s:"wil",s2:"sta",d:44},
            win: {
              r: "Heat, drums, darkness. Then a horse made of rain, running beside you over the grass of the Beyond. The shaman listens to your telling and nods slowly.",
              fx: {piety:5,wil:1.5,skill:{faith:3}},
            },
            lose: {
              r: "Orcs overheat. You stagger out after an hour and throw up in the rain. The children laugh. The shaman does not.",
              fx: {health:-4,wil:1,piety:1},
            },
          },
          {
            t: "Drum with the shamans until the storm passes",
            check: {s:"music",s2:"sta",d:40},
            win: {
              r: "Your hands find the rhythm of your clan and hold it for two hours. The drum-master taps your shoulder twice: come back.",
              fx: {skill:{music:3,faith:1},piety:3},
            },
            lose: {
              r: "You lose the beat in the first hour, and the drum-master takes the stick out of your hand.",
              fx: {happy:-2},
            },
          },
          {
            t: "Ride out into the thunder",
            check: {s:"riding",s2:"ins",d:42},
            win: {
              r: "Lightning on the horizon, rain in your teeth, your mare flying. It is the closest you have ever come to the ancestors.",
              fx: {skill:{riding:3},happy:5,piety:2},
            },
            lose: {
              r: "A thunderclap, a shying mare, and you land in a gully.",
              fx: {health:-8,wil:1,cause:"a fall in a storm"},
            },
          },
        ],
      },
      {
        id: "pp_orc_milk",
        title: "Spilled milk",
        cond: (p,C)=>(orcGrass(p)||C.race(p,"orc"))&&C.adult(p),
        w: 1,
        cool: 7,
        setup: (p,ctx)=>{setPid(p,ctx,"human",{status:"merchant",occ:"a human trader"})},
        text: "{themFull}, a human trader you have brought to your fire, stumbles over the tent rope and knocks a full skin of mare's milk into the dust. Spilling mare's milk carelessly is taboo; the Mare-Mother sees it. Every orc at the fire has stopped breathing. {them} has no idea what {theyHe} has done.",
        choices: [
          {
            t: "Kneel and pour your own cup into the dust after it",
            r: "A libation, not a spill: you turn it into an offering. The clan-mother looks at you for a long moment and nods. {them} never finds out how close it was.",
            fx: {piety:3,honor:3,them:{type:"friend",op:25}},
          },
          {
            t: "Make {themHim} pay the clan a sheep for it",
            check: {s:"intimidation",s2:"trade",d:38},
            win: {
              r: "{them} pays, white-faced. The clan-mother is satisfied. You keep a guest and a reputation.",
              fx: {honor:2,coin:4,them:{type:"acquaint",op:-5}},
            },
            lose: {
              r: "{them} argues about the price of a sheep. At your fire. Over spilled milk. It takes the clan-mother herself to end it.",
              fx: {honor:-2,happy:-3},
            },
          },
          {
            t: "Laugh. Humans cannot help it",
            r: "The young ones laugh with you. The old ones do not. A guest's clumsiness is the host's shame, and you made it a joke.",
            fx: {honor:-3,happy:2},
          },
        ],
      },
      {
        id: "pp_orc_relay",
        title: "Two minutes in, thirty breaths out",
        cond: (p,C)=>(orcGrass(p)||C.race(p,"orc"))&&C.adult(p)&&!C.old(p),
        w: 1.1,
        cool: 5,
        text: "Relay drill on the summer grass. The drum-master beats the waves: two minutes in at full charge, thirty breaths out in the rest line while the next wave strikes, then in again. Orcs recover from a burst faster than anyone and tire faster too. Today the war-captain is watching to pick riders for the first wave.",
        choices: [
          {
            t: "Ride every wave at full fury",
            check: {s:"mounted",s2:"str",d:48},
            win: {
              r: "Four waves, and your lance hits the straw man every time. The war-captain says your name to the drum-master.",
              fx: {skill:{mounted:4,riding:2},fame:2,flag:"pp_orc_firstwave"},
            },
            lose: {
              r: "By the third wave your arms are lead and your horse is blowing. You miss twice.",
              fx: {skill:{mounted:2},wil:1},
            },
          },
          {
            t: "Ride the waves, but pace your horse in the rest line",
            check: {s:"riding",s2:"int",d:42},
            win: {
              r: "Your mare is the freshest in the line at the end. The war-captain notices that too. Not every rider thinks with his horse.",
              fx: {skill:{riding:3,husbandry:2},int:.3},
            },
            lose: {
              r: "You hold back too much and the drum-master shouts at you in front of everyone.",
              fx: {happy:-2,skill:{riding:1}},
            },
          },
          {
            t: "Shoot from the saddle on the flank instead",
            check: {s:"bow",s2:"riding",d:46},
            win: {
              r: 'You keep the straw "enemy" busy from the flank while the waves change. The war-captain likes clever.',
              fx: {skill:{bow:3,riding:2}},
            },
            lose: {
              r: "An arrow goes into the drum-master's drum. You will hear about it for years.",
              fx: {happy:-3,fame:1},
            },
          },
        ],
      },
      {
        id: "pp_orc_heat",
        title: "The heat",
        cond: (p,C)=>C.race(p,"orc","halforc")&&C.adult(p)&&!C.terr(p,"tundra","mountains"),
        w: 1,
        cool: 6,
        text: "High summer, the hottest day in years, and you are three hours from water with a herd of horses. Orcs overheat and need more water than humans; a human trader riding with you is merely uncomfortable. Your head is pounding and your vision has started to sparkle at the edges.",
        choices: [
          {
            t: "Stop in the shade of the horses and wait for dusk",
            check: {s:"wil",s2:"survival",d:38},
            win: {
              r: "You lie in the shadow of your own mare until the sun goes down, wetting your lips from the last skin. You reach the well at midnight.",
              fx: {wil:1.5,skill:{survival:2}},
            },
            lose: {
              r: "The shade moves faster than you do. By dusk you are sick and shaking.",
              fx: {health:-10,wil:1.5,cause:"heat sickness"},
            },
          },
          {
            t: "Push on to the well",
            check: {s:"sta",s2:"riding",d:48},
            win: {
              r: "You arrive half-blind and put your whole head in the trough. Alive, and the herd with you.",
              fx: {sta:.5,skill:{riding:1}},
            },
            lose: {
              r: "You fall from the saddle a mile short. The human trader drags you to the well and saves your life.",
              fx: {health:-18,wil:2,newRel:{type:"friend",op:30},cause:"heat sickness"},
            },
          },
          {
            t: "Bleed a horse a little and drink",
            check: {s:"husbandry",s2:"survival",d:40},
            win: {
              r: "The old way, a nick in the neck vein and a cup. It is enough. The horse is none the worse.",
              fx: {skill:{husbandry:2,survival:2}},
            },
            lose: {r:"You cut too deep. The horse is weak for a week, and so are you.",fx:{health:-6,coin:-5}},
          },
        ],
      },
      {
        id: "pp_orc_hunger",
        title: "A hungry winter",
        cond: (p,C)=>(orcGrass(p)||C.race(p,"orc"))&&C.adult(p),
        w: 1,
        cool: 7,
        text: "The herds are thin and the snow is deep. An orc eats twice what a human does, and the clan-mothers ration every bowl. You have bled the horses as much as they can bear. The next step on the ladder is to eat the herd, which ruins next year too.",
        choices: [
          {
            t: "Give your bowl to the children",
            check: {s:"wil",s2:"sta",d:44},
            win: {
              r: "Half a bowl a day for a month. You get thin and grey and very calm. Every child in the tent lives to spring.",
              fx: {wil:3,honor:4,health:-8},
            },
            lose: {
              r: "You faint in the snow fetching water. The clan-mother orders you to eat, and you are too weak to argue.",
              fx: {wil:2,honor:2,health:-15,cause:"hunger"},
            },
          },
          {
            t: "Ride out to hunt antelope on the frozen grass",
            check: {s:"bow",s2:"riding",d:46},
            win: {
              r: "Three antelope in four days. The camp eats meat and fat for a week.",
              fx: {skill:{bow:3,riding:2},fame:2,honor:2},
            },
            lose: {r:"Nothing but snow and wolves. You come back thinner than you left.",fx:{health:-8,wil:1.5}},
          },
          {
            t: "Go and buy grain from the human villages (20 suns)",
            req: p=>p.coin>=20,
            check: {s:"trade",s2:"diplomacy",d:40},
            win: {
              r: "A human headman sells you twenty sacks, at a robber's price, but sells. The clan remembers who fed them.",
              fx: {coin:-20,honor:4,fame:1},
            },
            lose: {r:"They sell you rotten grain at a robber's price.",fx:{coin:-20,happy:-4,wil:1}},
          },
        ],
      },
      {
        id: "pp_orc_fury",
        title: "The blood fury",
        cond: (p,C)=>C.race(p,"orc","halforc")&&C.blood(p,"fury")&&C.ageAdj(p)>=12,
        w: 1.4,
        cool: 6,
        setup: (p,ctx)=>{setPid(p,ctx,p.race,{occ:"your wrestling partner"})},
        text: "You carry the blood of the Line of Gorath: the blood fury. In a fight the world goes red and slow, and you cannot stop. Today, wrestling {them} at the fire for a joke, someone laughs at the wrong moment and you feel it start: the roar in your ears, the heat in your arms.",
        choices: [
          {
            t: "Let go of {themHim} and walk into the cold",
            check: {s:"wil",s2:"ins",d:50},
            win: {
              r: "You walk until the red goes. Your lips are grey and your hands shake for an hour, but nobody is hurt.",
              fx: {wil:3,trait:"calm"},
            },
            lose: {
              r: "You cannot let go. When the red clears {them} is on the ground with a broken arm, and you are on the ground beside {themHim}, fainting.",
              fx: {wil:2,health:-6,honor:-4,them:{type:"rival",op:-30}},
            },
          },
          {
            t: "Shout for them to hold you down",
            r: "Four of your kin sit on you until it passes. It is humiliating and it works. {them} brings you milk afterwards and says nothing.",
            fx: {wil:1.5,them:{type:"friend",op:15},happy:-2},
          },
          {
            t: "Let it come",
            r: "Everyone at the fire scatters. {them} gets away with a bloody mouth. Afterward you lie grey-lipped in the tent for a day, heart hammering. Carriers die young of this.",
            fx: {str:.6,health:-10,honor:-3,them:{type:"enemy",op:-25},cause:"the blood fury"},
          },
        ],
      },
      {
        id: "pp_orc_stormhead",
        title: "The storm in the head",
        cond: (p,C)=>(orcGrass(p)||C.race(p,"orc"))&&C.adult(p),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{setPid(p,ctx,"orc",{occ:"your cousin"})},
        text: 'Your cousin {them} has stopped sleeping, talks to the wind and rode a horse into the river at night. "The storm has entered the head," the shaman says. Orcs treat the mad gently. But the human traders at the post want {themHim} chained, after {theyHe} broke a stall.',
        choices: [
          {
            t: "Take {themHim} home to the clan, away from the post",
            check: {s:"persuasion",s2:"wil",d:40},
            win: {
              r: "You talk {themHim} onto a horse and ride slowly home. At the clan fire, among drums and kin, {them} sleeps for the first time in a month.",
              fx: {honor:3,them:{type:"friend",op:35},wil:1},
            },
            lose: {
              r: "{tHe} will not come. You sit beside {themHim} at the post for three days, and keep the humans away by standing there.",
              fx: {wil:1.5,coin:-6,them:{type:"friend",op:25}},
            },
          },
          {
            t: "Pay for the broken stall and calm the traders",
            check: {s:"trade",s2:"diplomacy",d:38},
            win: {
              r: "Ten suns and a long talk about weather and horses. Nobody is chained.",
              fx: {coin:-10,skill:{diplomacy:2},them:{type:"friend",op:20}},
            },
            lose: {
              r: 'They take the money and chain {themHim} anyway, "for safety". You break the chain that night.',
              fx: {coin:-10,honor:2,favor:-2},
            },
          },
          {
            t: "Ask the shaman to drum for {themHim}",
            check: {s:"faith",s2:"music",d:42},
            win: {
              r: "Three nights of drumming in the sweat lodge. On the fourth morning {them} asks for food, which is a beginning.",
              fx: {piety:4,skill:{faith:2}},
            },
            lose: {r:"The drums do nothing that you can see. The storm stays.",fx:{piety:1,wil:1}},
          },
        ],
      },
      {
        id: "pp_orc_grey",
        title: "Grey in the braids",
        cond: (p,C)=>C.race(p,"orc")&&C.age(p)>=36,
        w: 1.4,
        once: !0,
        text: 'There is grey in your braids, and your knees speak in the mornings. You are {age}. Among orcs that is old; few see sixty. Your grandchild climbs into your lap at the fire and asks for the story of your deed, and then, without warning: "Grandmother says you will ride with the storm soon. Is that true?"',
        choices: [
          {
            t: "Tell the story of your deed, every word",
            r: "The fire falls quiet while you tell it, and the young ones lean in. Your grandchild falls asleep in the middle, and you finish it anyway, for the rest.",
            fx: {happy:5,fame:1,skill:{music:1}},
          },
          {
            t: '"Not before I have taught you to ride the grey"',
            r: "You get up the next morning and teach. It takes the whole summer, and it is the best summer you can remember.",
            fx: {happy:6,skill:{riding:1},wil:1},
          },
          {
            t: "Choose the hill for your platform",
            r: "You ride out alone and pick it: high, windy, in sight of the Drum Stones. When the time comes, the clan will lay you there under the sky and the storm will find you.",
            fx: {piety:4,wil:1.5},
          },
        ],
      },
      {
        id: "pp_orc_platform",
        title: "The high platform",
        cond: (p,C)=>(orcGrass(p)||C.race(p,"orc"))&&C.adult(p),
        w: .9,
        cool: 12,
        setup: (p,ctx)=>{ctx.who=A.pick(["your old war-captain","your mother's brother","the clan's best horse-breaker","your grandmother"]),ctx.Who=A.cap(ctx.who)},
        text: "{Who} has gone to ride with the storm. The clan builds the high platform on the hilltop, and lays {who} on it under the sky, facing the Grass Beyond. For a great death a horse goes with the dead, and the clan-mother turns to you: it was your kin, so it is your horse.",
        choices: [
          {
            t: "Give your best mare",
            r: "She goes quietly, and the drums answer. Everyone on the hill knows what that mare was worth. {Who} rides well in the Beyond.",
            fx: {piety:5,honor:5,coin:-30,wil:1.5},
          },
          {
            t: "Give the old gelding",
            r: "A good horse, once. The clan-mother says nothing, which says enough. The dead do not complain.",
            fx: {piety:1,honor:-2},
          },
          {
            t: "Ask the shaman for a lock of mane, not the whole horse",
            check: {s:"faith",s2:"persuasion",d:46},
            win: {
              r: "The shaman agrees: an old custom from the hungry years. A braid of mane on the platform, and your mare lives.",
              fx: {piety:2,skill:{faith:2}},
            },
            lose: {
              r: '"These are not the hungry years," says the shaman. You give the mare after all, in front of everyone, and late.',
              fx: {piety:2,honor:-1,coin:-30},
            },
          },
        ],
      },
      {
        id: "pp_orc_horsetheft",
        title: "The piebald",
        cond: (p,C)=>orcGrass(p)&&(C.teen(p)||C.adult(p)&&C.ageAdj(p)<40),
        w: 1,
        cool: 5,
        setup: (p,ctx)=>{ctx.clan=orcClan(p)},
        text: "The {clan} camp is two hills away, and its chief has a piebald mare he loves more than his children. Among the clans, horse theft between friends is a sport: if the thief is caught, everyone laughs at him; if not, they sing about him. Your friends are already saddled.",
        choices: [
          {
            t: "Go in at moonset and take the piebald",
            check: {s:"stealth",s2:"riding",d:44},
            win: {
              r: "You ride her into your own camp at dawn. Within a week the song has three verses, and the chief comes to buy her back, laughing.",
              fx: {skill:{stealth:3,riding:2},fame:2,coin:10,happy:5},
            },
            lose: {
              r: "The chief himself is sitting up with her. He laughs so hard he has to sit down. So does everyone, for a year.",
              fx: {happy:-3,wil:.8,fame:1},
            },
          },
          {
            t: "Steal the chief's saddle instead, while he guards the mare",
            check: {s:"stealth",s2:"int",d:40},
            win: {
              r: "Cleverer than a horse. The song about it is better too.",
              fx: {skill:{stealth:2},int:.3,fame:2,happy:4},
            },
            lose: {
              r: "You trip over the saddle in the dark and land in the dung pile. There is a song after all.",
              fx: {happy:-2},
            },
          },
          {
            t: "Warn the chief, and watch your friends get caught",
            r: "They are caught, and laughed at, and they know exactly who told. It is a long summer.",
            fx: {honor:1,happy:-3,newRel:{type:"rival",op:-15}},
          },
        ],
      },
      {
        id: "pp_orc_fords",
        title: "Counting the fires",
        cond: (p,C)=>C.realm(p,"POL-11")&&C.race(p,"orc","halforc")&&(C.teen(p)||C.adult(p)&&C.ageAdj(p)<40),
        w: 1,
        cool: 5,
        text: "Every spring the young riders of the Gashmar clans cross the Gordush fords at night to count the fires of the Aldmark forts on the far bank. It has been done since before Gorath. The river is high and black, and the Aldmark sentries have crossbows.",
        choices: [
          {
            t: "Swim your horse across and count",
            check: {s:"riding",s2:"stealth",d:44},
            win: {
              r: "Thirty-one fires where there were twenty last spring. You bring the number back wet to the skin. The war-captain goes very quiet, and sends riders to Urgol.",
              fx: {skill:{riding:2,stealth:3},fame:2,honor:2},
            },
            lose: {
              r: "A sentry sees your horse's head in the water. A bolt hums past your ear. You count nothing, and lose your saddle in the river.",
              fx: {health:-5,coin:-8,wil:1},
            },
          },
          {
            t: "Count from the reeds on your own bank",
            check: {s:"int",s2:"tracking",d:38},
            win: {
              r: "From the reeds you can see the glow over the bank and count by the smoke. Not as brave, and nearly as right.",
              fx: {int:.4,skill:{tracking:2}},
            },
            lose: {r:"Fog. You count the same fire four times.",fx:{}},
          },
          {
            t: "Cross further, and look inside the fort",
            check: {s:"stealth",s2:"ins",d:54},
            win: {
              r: "Stake lines, wagons, and four hundred new crossbows still in their crates. You come back with news worth a herd.",
              fx: {skill:{stealth:3},fame:4,honor:2,merit:2},
            },
            lose: {
              r: "A dog. Then many dogs. You get back across with a bolt through your arm.",
              fx: {health:-14,wound:"arrow_wound",wil:2,cause:"an Aldmark crossbow"},
            },
          },
        ],
      },
      {
        id: "pp_orc_captive",
        title: "A new brother",
        cond: (p,C)=>orcGrass(p)&&C.adult(p),
        w: .8,
        cool: 15,
        setup: (p,ctx)=>{setPid(p,ctx,"human",{status:"peasant",sex:"M",occ:"a captured Aldmark spearman",frac:1.3})},
        text: 'The Gashmar clans adopt captives more often than any others; Mother Grisha once adopted the spearman who killed her son. Today your own clan-mother sets a captured Aldmark spearman, {themFull}, at your fire. "He is your brother now," she says. He killed one of your kin at the fords last spring.',
        choices: [
          {
            t: "Share your bowl with him",
            r: "He does not understand a word, and eats like a wolf. In a year he speaks Orcish badly and rides worse. In five he is the uncle your children run to.",
            fx: {honor:4,trait:"forgiving",them:{type:"friend",op:40},wil:1.5},
          },
          {
            t: "Teach him to ride, hard",
            check: {s:"riding",s2:"wil",d:40},
            win: {
              r: "He falls a hundred times and gets up a hundred and one. You start to like him against your will.",
              fx: {skill:{riding:2},them:{type:"friend",op:30},wil:1},
            },
            lose: {
              r: "He breaks a leg. Your clan-mother looks at you as if you did it on purpose. Did you?",
              fx: {honor:-3,them:{type:"rival",op:-20}},
            },
          },
          {
            t: "Refuse him",
            r: "You may refuse. The clan-mother gives him to another fire. He lives two tents away from you for the rest of your life.",
            fx: {honor:-2,them:{type:"rival",op:-25}},
          },
        ],
      },
      {
        id: "pp_orc_tarn",
        title: "The rider of two peoples",
        cond: (p,C)=>early()&&C.realm(p,"POL-11")&&C.race(p,"orc","halforc")&&C.adult(p),
        w: 1.2,
        once: !0,
        text: "Every fire in the Horde talks of Tarn Halfblood, the half-orc who burned House Harrow's barns and fled across the Gordush with six hundred families. War-Chief Vrag will not hand him to Aldmark. The prophecy says a rider born of two peoples will unite all the grass. At the Great Ride, Harkun the Drum-Master must judge whether Tarn is that rider.",
        choices: [
          {
            t: "Ride to the Gashmar guest camp to see him yourself",
            check: {s:"diplomacy",s2:"ins",d:42},
            win: {
              r: "He is younger than the songs and tireder. He asks you about your clan's grass, and listens to the answer. You come home with an opinion.",
              fx: {skill:{diplomacy:2},flag:"pp_orc_tarnmet",fame:1},
            },
            lose: {r:"His riders turn you back at the camp edge. Too many have come to stare.",fx:{happy:-2}},
          },
          {
            t: "Side with Skarn Redhand: no half-blood leads the grass",
            r: "At the fire you say it plainly. Half the clan agrees. The other half stops passing you the milk.",
            fx: {honor:-1,skill:{intrigue:2},newRel:{type:"rival",op:-20}},
          },
          {
            t: "Wait for the drums. The shamans will say",
            r: "The prophecy is a belief, not a fact, the old ones say; and beliefs ride horses too. You wait.",
            fx: {piety:2,trait:"patient"},
          },
        ],
      },
      {
        id: "pp_orc_redhand",
        title: "Counting clans",
        cond: (p,C)=>C.realm(p,"POL-11")&&C.race(p,"orc","halforc")&&C.adult(p)&&C.ageAdj(p)>=22,
        w: .9,
        cool: 10,
        text: 'A rider with a red hand painted on his shield comes to your fire with a gift: a three-year-old bay of the Magak herds, the best horses in the Horde. Skarn Redhand is counting clans for the staff of the war-chief. "When the councils speak," says the rider, "speak for the Redhand."',
        choices: [
          {
            t: "Take the horse and promise your voice",
            r: "A beautiful horse. Now you are counted. The Line of Gorath has long memories, and so does Skarn.",
            fx: {coin:40,gear:{mount:"horse"},honor:-2,flag:"pp_orc_redhand"},
          },
          {
            t: "Refuse the horse. Your voice is not for sale",
            check: {s:"wil",s2:"diplomacy",d:40},
            win: {
              r: "The rider leaves with his horse and a new respect for your fire. The clan-mother hears of it.",
              fx: {honor:4,trait:"honest"},
            },
            lose: {
              r: "He takes it as an insult to the Redhand. Your herds are watched closely after that.",
              fx: {honor:2,newRel:{type:"enemy",op:-20}},
            },
          },
          {
            t: "Take the horse and promise nothing",
            check: {s:"deception",s2:"int",d:46},
            win: {
              r: "You thank him so warmly and so vaguely that he rides off believing whatever he wants to. You have a new horse.",
              fx: {coin:40,gear:{mount:"horse"},skill:{deception:3}},
            },
            lose: {
              r: "He sees through it, and takes the horse back. The story travels faster than he does.",
              fx: {honor:-3,happy:-2},
            },
          },
        ],
      },
      {
        id: "pp_orc_herdsick",
        title: "The coughing foals",
        cond: (p,C)=>orcGrass(p)&&C.adult(p),
        w: .9,
        cool: 10,
        text: "Three foals in your herd are coughing a wet, ugly cough, and one has a swelling under its jaw. If it is the sickness, it will go through the whole herd and the neighbors' too. If you tell the clan-mother, every horse you own will be driven apart and some will be killed. If you say nothing, maybe it is a cold.",
        choices: [
          {
            t: "Tell the clan-mother now",
            r: "She has the sick foals cut out and killed, and your herd grazed alone for a season. It costs you dearly. The sickness goes no further.",
            fx: {coin:-20,honor:4,skill:{husbandry:2},wil:1},
          },
          {
            t: "Nurse the foals yourself, apart from the herd",
            check: {s:"husbandry",s2:"medicine",d:48},
            win: {
              r: "Steam, herbs, warm milk and no sleep. Two of the three live, and the sickness never reaches the herd.",
              fx: {skill:{husbandry:4,medicine:2},honor:2},
            },
            lose: {
              r: "They die, and two more start coughing. You tell the clan-mother, late.",
              fx: {coin:-30,honor:-2,wil:1.5},
            },
          },
          {
            t: "Say nothing and hope",
            check: {s:"ins",s2:"husbandry",d:52},
            win: {r:"It was a cold. They recover. Nobody ever knows how scared you were.",fx:{happy:2}},
            lose: {
              r: "It was not a cold. Half the clan's foals die that spring, and they find out where it started.",
              fx: {coin:-30,honor:-10,happy:-8,wil:2},
            },
          },
        ],
      },
      {
        id: "pp_orc_felt",
        title: "The felt-makers",
        cond: (p,C)=>(orcGrass(p)||C.race(p,"orc"))&&C.ageAdj(p)>=12,
        w: .9,
        cool: 8,
        text: "Felt is everything on the grass: tents, saddle-cloths, boots, the hides the clans paint. At the summer felting the whole camp rolls wet wool in reed mats behind the horses, and Mother Rasha of the Felt-Makers walks the lines judging. A saddle-cloth with a clan's sign sells for a horse.",
        choices: [
          {
            t: "Make a saddle-cloth with your clan's sign",
            check: {s:"craft",s2:"int",d:40},
            win: {
              r: "The sign comes out crisp and the felt is tight. Mother Rasha fingers it and buys it on the spot.",
              fx: {skill:{craft:4},coin:20,fame:1},
            },
            lose: {r:"The colors bleed into each other. It will make a good blanket for a dog.",fx:{skill:{craft:2}}},
          },
          {
            t: "Ride the felting horses all day",
            check: {s:"riding",s2:"sta",d:36},
            win: {
              r: "Up and down the lines from dawn to dusk, dragging the rolls. The best felt of the summer is yours, and nobody can say otherwise.",
              fx: {skill:{riding:2},sta:.4,happy:2},
            },
            lose: {r:"Orcs tire. By noon you are useless and the old women send you to fetch water.",fx:{happy:-2}},
          },
          {
            t: "Sing the felting songs with the old women",
            r: "Each roll has a song, and each song has a story older than the Horde. You learn more about your clan in a day than in a year.",
            fx: {skill:{music:2,learning:1},happy:3},
          },
        ],
      },
      {
        id: "pp_orc_greymothers",
        title: "Before the Grey Mothers",
        cond: (p,C)=>orcGrass(p)&&C.adult(p),
        w: .9,
        cool: 10,
        setup: (p,ctx)=>{ctx.clan=orcClan(p),ctx.case=A.pick(["grazing a hill your grandmothers grazed for forty winters","watering at a well your grandmother dug","cutting hay on the river bottoms"])},
        text: "The {clan} kin say your clan has no right to be {case}. The case goes to the fire of the Grey Mothers, who hold the Law of the Grass by heart, every word of it, back to the first clan. War-chiefs fear them; they can overrule even the staff. You must speak.",
        choices: [
          {
            t: "Recite the law of your clan's grass, from memory",
            check: {s:"learning",s2:"wil",d:48},
            win: {
              r: "You give them the winters, the grandmothers and the hills, in the old words. The eldest Grey Mother nods and speaks the judgment: the grass is yours.",
              fx: {skill:{learning:3,diplomacy:2},honor:4,fame:2},
            },
            lose: {
              r: "You stumble over a grandmother's name. The Grey Mothers notice. The grass is shared, for now.",
              fx: {wil:1,honor:-1},
            },
          },
          {
            t: "Offer the {clan} kin a horse-price and a marriage",
            check: {s:"diplomacy",s2:"trade",d:42},
            win: {
              r: "Five horses and a promise of a daughter for their son. The Grey Mothers approve: a feud avoided is a clan kept.",
              fx: {coin:-15,honor:3,skill:{diplomacy:3}},
            },
            lose: {
              r: "They take the horses and still want the grass. Now it is a feud.",
              fx: {coin:-15,newRel:{type:"enemy",op:-25}},
            },
          },
          {
            t: "Say plainly that you will fight for it",
            check: {s:"intimidation",s2:"str",d:44},
            win: {
              r: "The Grey Mothers frown at you, but the {clan} kin decide the hill is not worth your axe.",
              fx: {skill:{intimidation:2},honor:-1},
            },
            lose: {
              r: 'The eldest Grey Mother looks at you as at a child who has wet the felt. "Speak law at this fire, or leave it."',
              fx: {honor:-4,happy:-3},
            },
          },
        ],
      },
      {
        id: "pp_orc_shaman",
        title: "The storm speaks in you",
        cond: (p,C)=>C.race(p,"orc","halforc")&&C.faith(p,"REL-11")&&C.ageAdj(p)>=12&&C.ageAdj(p)<40&&!C.flag(p,"pp_orc_shaman"),
        w: .8,
        once: !0,
        text: 'An old drummer-shaman has watched you for three winters, at the fire, in the storms, at the platforms. Tonight she sits beside you. "The storm speaks in you," she says. "Not loudly. But it speaks." To become a shaman takes years of drumming, fasting and sweat lodges. And killing a shaman makes the killer clanless forever.',
        choices: [
          {
            t: "Go with her and learn the drum",
            r: "Years of it: the rhythms of every clan, the herbs, the long nights in the lodge. You come out of it a different person, with a different seat at every fire.",
            fx: {flag:"pp_orc_shaman",skill:{faith:5,music:3,medicine:2},piety:8,honor:3},
          },
          {
            t: "Ask her to test you first",
            check: {s:"faith",s2:"wil",d:46},
            win: {
              r: "Three days fasting in the lodge. On the third night you drum until dawn and do not remember stopping. She takes you.",
              fx: {flag:"pp_orc_shaman",skill:{faith:4,music:2},piety:6,wil:1.5},
            },
            lose: {
              r: 'You break on the second day and eat. She is not angry. "Some hear the storm and are not meant to answer."',
              fx: {piety:2,wil:1},
            },
          },
          {
            t: "Refuse. You want a horse and a wave, not a drum",
            r: 'She nods. "Then ride well. The storm will still be there." You never quite stop hearing it.',
            fx: {skill:{riding:1}},
          },
        ],
      },
      {
        id: "pp_orc_merc",
        title: "Forty suns a month",
        cond: (p,C)=>C.race(p,"orc","halforc")&&C.adult(p)&&!C.old(p)&&!C.soldier(p)&&free(p),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{ctx.lord=A.pick(["a Tessarian prince","a Sabran emir","the free companies of the Marches","a Varennan duke at war with his cousin"])},
        text: 'A human recruiter rides into the camp with a mule loaded with silver. He is hiring for {lord}: orc riders at forty suns a month and double rations, three times what a human spearman gets. "The human princes all want orcs now," he says. "Two minutes of you is worth a day of them."',
        choices: [
          {
            t: "Sign on for a season",
            check: {s:"mounted",s2:"ins",d:44},
            win: {
              r: "One season of other people's war. You come home with a purse of silver, a southern sunburn and a long story.",
              fx: {coin:90,skill:{mounted:3,tactics:1},fame:2,flag:"pp_orc_merc"},
            },
            lose: {
              r: "The prince runs out of silver in the third month, and you walk home with a wound and a promise.",
              fx: {coin:15,health:-12,wound:"scar_chest",wil:2,cause:"a southern war"},
            },
          },
          {
            t: "Bargain for more than forty",
            check: {s:"trade",s2:"intimidation",d:46},
            win: {
              r: "Fifty, and a horse at the end of it. You do not even go; you sell your place in line to a cousin for ten.",
              fx: {coin:10,skill:{trade:2}},
            },
            lose: {r:"He shrugs and hires your cousin at forty.",fx:{}},
          },
          {
            t: "Send him away. Orcs fight for the clan",
            r: "He rides on to the next camp. Half your age-mates go with him. Not all come back.",
            fx: {honor:2,wil:.5},
          },
        ],
      },
      {
        id: "pp_orc_market",
        title: "The wool market",
        cond: (p,C)=>C.race(p,"orc","halforc")&&C.adult(p),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{ctx.town=inR(p,ORCR)?p.realm==="POL-34"?"Kraoth":"Morhaven's border market":humanTown(p)},
        text: `At the wool market in {town}, the human buyer weighs your clan's fleeces on a scale that is plainly crooked, and the crowd around the stall watches you with that look. Most humans believe orcs were made from cursed men. "Take it or leave it, tusk," says the buyer.`,
        choices: [
          {
            t: "Weigh it again on the market master's scale",
            check: {s:"trade",s2:"wil",d:40},
            win: {
              r: "The market master's scale says a fifth more. The buyer pays, with a face like sour milk. The crowd goes back to its business, a little disappointed.",
              fx: {coin:18,skill:{trade:3}},
            },
            lose: {r:"The market master is the buyer's brother-in-law.",fx:{coin:8,wil:1,happy:-3}},
          },
          {
            t: "Put your fist through his scale",
            check: {s:"intimidation",s2:"str",d:40},
            win: {
              r: "The scale is kindling. The next buyer's scale is suddenly very honest.",
              fx: {coin:14,skill:{intimidation:2},honor:-1},
            },
            lose: {
              r: "The town watch, a fine and a night in the stocks, while children throw dung. Every human there will tell the story of the savage orc.",
              fx: {coin:-10,honor:-3,happy:-5,wil:1.5},
            },
          },
          {
            t: "Take your wool to another buyer, smiling",
            r: "You walk the whole market, fleece by fleece. It takes all day and you get a fair price at sundown, from a half-orc dyer.",
            fx: {coin:14,trait:"patient"},
          },
        ],
      },
      {
        id: "pp_orc_twins",
        title: "Two at once",
        cond: (p,C)=>C.race(p,"orc")&&C.adult(p)&&C.married(p),
        w: 1,
        once: !0,
        text: 'Twins: one birth in three among orcs, and this time it is yours. Two small, loud, tusked bundles, a boy and a girl, and an orc child eats twice what a human child does. The clan-mother comes to look and says, "Two mouths, two riders. A good winter will make them, a bad one will choose."',
        choices: [
          {
            t: "Sell a horse to buy grain for the winter",
            r: "Your best gelding goes to a human trader. The twins grow fat and furious, and the gelding is never mentioned again.",
            fx: {coin:-20,happy:6,honor:2},
          },
          {
            t: "Ask the clan to share the feeding",
            check: {s:"diplomacy",s2:"persuasion",d:36},
            win: {
              r: "Three aunts and a grandmother take turns. The twins grow up belonging to everyone, which is how orcs like it.",
              fx: {happy:5,skill:{diplomacy:2}},
            },
            lose: {r:"It is a lean year for everyone. You manage, barely.",fx:{happy:2,wil:1.5,health:-4}},
          },
          {
            t: "Name them after your grandparents",
            r: "Short names, old names. The shaman paints them on the winter hide, two little figures on one horse.",
            fx: {piety:3,happy:5},
          },
        ],
      },
      {
        id: "pp_orc_nochief",
        title: '"No chief is holy"',
        cond: (p,C)=>C.realm(p,"POL-34")&&C.race(p,"orc","halforc")&&C.adult(p),
        w: 1,
        cool: 10,
        text: "A Horde envoy sits at your clan's fire, eating your mutton, and talks of War-Chief Vrag, grandson of Gorath, Son of the Storm, whom the Mare-Mother herself chose. The Tusk Clans would not follow Gorath and call no living chief holy. Your clan-mother is watching to see who will answer him.",
        choices: [
          {
            t: '"No chief is holy." Say it to his face',
            check: {s:"wil",s2:"diplomacy",d:40},
            win: {
              r: "He is your guest and cannot strike you, and he knows it. He finishes his mutton very quietly. The clan-mother gives you the marrow bone.",
              fx: {honor:4,fame:1,skill:{diplomacy:2}},
            },
            lose: {
              r: "He laughs and quotes the Grey Mothers back at you. You lose the argument, at your own fire.",
              fx: {happy:-3,wil:1},
            },
          },
          {
            t: "Ask him how many clans Vrag can really count",
            check: {s:"intrigue",s2:"int",d:44},
            win: {
              r: "He boasts, then says too much: the Redhands count clans of their own. You carry it to the War-Mother's people at Grakmar.",
              fx: {skill:{intrigue:3},favor:3},
            },
            lose: {r:"He sees what you are doing and talks only about horses.",fx:{}},
          },
          {
            t: "Feed him well and say nothing. He is a guest",
            r: "The Law of the Fire is older than any war-chief. He leaves with a full belly and nothing else.",
            fx: {honor:2,piety:2},
          },
        ],
      },
      {
        id: "pp_orc_rye",
        title: "The rye that did not come",
        cond: (p,C)=>early()&&C.realm(p,"POL-34")&&C.race(p,"orc","halforc")&&C.adult(p)&&!C.old(p),
        w: 1.2,
        once: !0,
        text: 'Drevna owes the League two thousand bushels of rye under the Treaty of Thardush, and it has not come. "Count the rye before you thank the Drevnan," the clan-mothers say. Hrok Whitehorn has five thousand riders waiting at Thardush, and if the rye does not come by the thaw, the War-Mother will let him loose on the farms east of Sevmir.',
        choices: [
          {
            t: "Ride to Thardush and join Hrok",
            check: {s:"mounted",s2:"riding",d:42},
            win: {
              r: "Hrok looks you over and puts you in the second wave. Whatever comes at the thaw, you will be in it.",
              fx: {skill:{mounted:2,riding:2},flag:"pp_orc_thardush",fame:1},
            },
            lose: {
              r: "Your horse goes lame on the road. You arrive late and are set to guarding remounts.",
              fx: {skill:{husbandry:2},happy:-2},
            },
          },
          {
            t: "Ride to the Drevnan border-fort and ask where the rye is",
            check: {s:"diplomacy",s2:"wil",d:50},
            win: {
              r: "A tired Drevnan captain shows you the empty granaries: blight in the north. You carry the truth back. It does not feed anyone, but it might save some farms.",
              fx: {skill:{diplomacy:3},honor:3,fame:2},
            },
            lose: {r:"They shut the gate on you and shoot over your head.",fx:{wil:1,happy:-2}},
          },
          {
            t: "Stay with the herds. Farms burning feeds nobody",
            r: "The clan-mother agrees with you, quietly. Many do not.",
            fx: {trait:"cautious",honor:-1},
          },
        ],
      },
      {
        id: "pp_orc_ironhide",
        title: "Thick hide",
        cond: (p,C)=>C.race(p,"orc","halforc")&&C.blood(p,"hide")&&C.ageAdj(p)>=12,
        w: 1.3,
        cool: 6,
        text: "The Ironhide blood gives you skin that turns a glancing blade. It also means you sweat badly and overheat faster than other orcs, who already overheat. Two clan-mothers of the line died of heat at summer gatherings. It is the Great Ride at midsummer, noon, and you are expected in the wrestling ring.",
        choices: [
          {
            t: "Wrestle anyway, fast, before the heat takes you",
            check: {s:"unarmed",s2:"str",d:46},
            win: {
              r: "Three throws in three breaths each. You leave the ring before your head starts to spin, to roaring approval.",
              fx: {skill:{unarmed:3},fame:2},
            },
            lose: {
              r: "The fourth bout goes long. You come round in the shade with water on your face and a shaman muttering.",
              fx: {health:-12,wil:1.5,cause:"heat on the Ironhide blood"},
            },
          },
          {
            t: "Ask to wrestle at dusk instead",
            check: {s:"diplomacy",s2:"wil",d:38},
            win: {
              r: "The drum-master knows the line. Your bouts move to dusk, and you win two of them in the cool.",
              fx: {skill:{unarmed:2}},
            },
            lose: {r:"They call it fear. You wrestle at dusk anyway, and nobody comes to watch.",fx:{happy:-3}},
          },
          {
            t: "Sit out the summer games",
            r: "You watch from the shade with the old women, who tell you which young ones cheat. Useful, in its way.",
            fx: {skill:{intrigue:2}},
          },
        ],
      },
      {
        id: "pp_orc_zorek",
        title: "The drums of Zorek",
        cond: (p,C)=>C.realm(p,"POL-34")&&C.race(p,"orc","halforc")&&C.ageAdj(p)>=12,
        w: 1,
        cool: 8,
        text: "11 May, the anniversary of Zorek, 1064, when the Ironhide riders went in at the first wave and the Drum Storm knocked both Dravic princes from their saddles. Every camp drums from dusk to dawn. The Drum Band's master is looking for young hands for the great drums.",
        choices: [
          {
            t: "Take a great drum for the night",
            check: {s:"music",s2:"sta",d:44},
            win: {
              r: "Dusk to dawn, the Zorek beat, until your hands bleed and the ground shakes. The master marks you for the Drum Band.",
              fx: {skill:{music:4},sta:.5,fame:1,piety:2},
            },
            lose: {
              r: "You lose the beat in the black hours before dawn, and an old drummer takes over, without a word.",
              fx: {skill:{music:2},wil:.8},
            },
          },
          {
            t: "Ask an old rider what Zorek was really like",
            r: '"Short," he says. "Two minutes. Then the drums, and the princes falling, and their horses going mad. Then the long dying." He drinks, and does not say more.',
            fx: {skill:{tactics:2},int:.3},
          },
          {
            t: "Dance until dawn",
            check: {s:"sta",s2:"athletics",d:36},
            win: {
              r: "You and half the camp, around the fires, until the sun comes up red. You remember it when you are old.",
              fx: {happy:6,sta:.3},
            },
            lose: {r:"Orcs tire. You sleep in the grass by midnight.",fx:{happy:2}},
          },
        ],
      },
      {
        id: "pp_orc_caravan",
        title: "Guarding the silk",
        cond: (p,C)=>C.realm(p,"POL-34")&&C.race(p,"orc","halforc")&&C.adult(p)&&!C.old(p),
        w: 1,
        cool: 6,
        text: "You ride guard on a silk caravan that has paid its toll at Kraoth. Robbing a caravan that has paid is the gravest crime in the League, because the silver feeds every clan. On the third night out, near the cairns, riders come out of a gully: steppe raiders who do not care what the League thinks.",
        choices: [
          {
            t: "Charge them before they reach the camels",
            check: {s:"mounted",s2:"ins",d:46},
            win: {
              r: "Two minutes of fury and they are scattered into the dark. The caravan master gives you a bolt of red silk.",
              fx: {skill:{mounted:3},coin:20,fame:2,honor:2},
            },
            lose: {
              r: "They are more than you thought.",
              fx: {
                duel: {
                  tier: 2,
                  title: "a steppe raider",
                  troop: "LC",
                  opts: {kind:"duel",place:"the cairns of the silk road",lethal:!0,toYield:!0,title:"Raiders at the cairns"},
                },
              },
            },
          },
          {
            t: "Circle the camels and shoot from the ring",
            check: {s:"bow",s2:"command",d:44},
            win: {
              r: "The camels kneel, the guards shoot over them, and the raiders lose three men and their nerve.",
              fx: {skill:{bow:2,command:2},coin:12,honor:2},
            },
            lose: {r:"They take two camels before they break off.",fx:{coin:4,wil:1}},
          },
          {
            t: "Ride out to talk: this caravan has paid Gurz",
            check: {s:"intimidation",s2:"diplomacy",d:48},
            win: {
              r: "The name of Gurz the Toll-Keeper is enough. They ride back into the gully, cursing.",
              fx: {skill:{intimidation:2,diplomacy:2},fame:1},
            },
            lose: {r:"They laugh, and an arrow takes your horse.",fx:{coin:-20,health:-6,wil:1}},
          },
        ],
      },
      {
        id: "pp_orc_hyena",
        title: "Laughing in the dark",
        cond: (p,C)=>(orcGrass(p)||C.race(p,"orc"))&&C.terr(p,"steppe","plains","hills")&&C.ageAdj(p)>=12&&!C.old(p),
        w: 1,
        cool: 8,
        text: "At night the cave hyenas come to the foal pens, giggling in the dark. Three foals are gone this month. Orcs believe hyenas carry the souls of the unburied, and the old women will not go near them. Tonight the laughter is very close.",
        choices: [
          {
            t: "Take a spear and a torch and go out",
            r: "Yellow eyes in the torchlight, and that laugh.",
            fx: {beast:{id:"CRE-35",place:"the foal pens",mod:.75}},
          },
          {
            t: "Shoot from the pen wall",
            check: {s:"bow",s2:"ins",d:44},
            win: {
              r: "Two arrows, one hyena dead in the grass, the pack gone. The old women burn it far from camp, to be safe.",
              fx: {skill:{bow:3},honor:2,fame:1},
            },
            lose: {r:"You hit nothing, and one more foal is gone by morning.",fx:{coin:-6,wil:.6}},
          },
          {
            t: "Build the thorn fence higher and sit up all night",
            check: {s:"sta",s2:"husbandry",d:36},
            win: {
              r: "Three nights awake, and the pens hold. The hyenas go to a lazier camp.",
              fx: {sta:.4,skill:{husbandry:2}},
            },
            lose: {r:"You fall asleep on the second night.",fx:{coin:-6}},
          },
        ],
      },
      {
        id: "pp_orc_wrestle",
        title: "Paid to lose",
        cond: (p,C)=>(orcGrass(p)||C.race(p,"orc"))&&C.adult(p)&&!C.old(p),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{ctx.champ=A.pick(["a Redhand champion","a huge Nagoth woman","the war-captain's nephew"])},
        text: "You have won your way to the last round of the wrestling at the Great Ride. Tonight, behind the horse lines, a man you do not know offers you twenty suns of silver to lose tomorrow to {champ}. Everyone remembers that Durk Ironarms, four times champion, was paid to lose in 1102.",
        choices: [
          {
            t: "Take the silver and lose",
            r: "You go down in the second throw, convincingly. The silver is heavy in your boot and heavier on your mind.",
            fx: {coin:20,honor:-5,trait:"deceitful"},
          },
          {
            t: "Take the silver, and win anyway",
            check: {s:"unarmed",s2:"str",d:52},
            win: {
              r: "You throw {champ} flat in front of every clan. The man behind the horse lines wants his silver back. You suggest he ask the Grey Mothers.",
              fx: {coin:20,fame:4,skill:{unarmed:3},newRel:{type:"enemy",op:-30}},
            },
            lose: {r:"You lose honestly, which nobody will believe.",fx:{coin:20,honor:-3}},
          },
          {
            t: "Refuse, and tell the drum-master",
            r: "The drum-master listens, and watches the betting all night. You lose the final the next day, honestly, and everyone knows it was honest.",
            fx: {honor:5,skill:{unarmed:1}},
          },
        ],
      },
      {
        id: "pp_orc_dushka",
        title: '"Dush ka?"',
        cond: (p,C)=>C.race(p,"orc","halforc")&&C.adult(p),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{setPid(p,ctx,"human",{occ:"a lost human traveler"})},
        text: 'A human traveler, {themFull}, rides up to your fire at dusk, thirsty and lost. You give the old greeting: "Dush ka?" Is there water? The answer is "Dush ha", there is water. {them} panics, and says the only Orcish word {theyHe} knows: "Nakh." No. It is the worst insult an orc can give.',
        choices: [
          {
            t: "Laugh, and teach {themHim} the right answer",
            r: '"Dush ha," {them} repeats, terrified, and you hand over the water skin. By morning {theyHe} can say five words, and you have a friend in a strange town.',
            fx: {honor:3,trait:"witty",them:{type:"friend",op:30}},
          },
          {
            t: "Give {themHim} water anyway, in cold silence",
            r: "The Law of the Fire does not care what a fool says. {them} drinks, eats and leaves before dawn, sensing something. Your kin approve.",
            fx: {honor:2,piety:2},
          },
          {
            t: "Let the insult stand, and turn your back",
            r: "A guest who refuses you at your own fire is no guest. {them} rides away thirsty. Some will say you broke the Law of the Fire; some will say {theyHe} did.",
            fx: {honor:-3,them:{type:"enemy",op:-15}},
          },
        ],
      },
      {
        id: "pp_orc_longwind",
        title: "Run like Tukar",
        cond: (p,C)=>C.race(p,"orc","halforc")&&C.blood(p,"longwind")&&C.ageAdj(p)>=12,
        w: 1.3,
        cool: 6,
        text: "You are of the Longwind line: you can run all day like a human, and hit in a charge only as hard as a strong human. For a hundred and forty years the clans have mocked the line as half-human. Then Aldmark riders are seen on the river, and the summer camps are a day away. Tukar of your line once ran three hundred kilometres in three days.",
        choices: [
          {
            t: "Run",
            check: {s:"athletics",s2:"sta",d:44},
            win: {
              r: "Dusk to dawn across the grass, no fire, no bread. The camps are gone into the hills when the riders come, and they burn empty tents. Nobody laughs at your blood that summer.",
              fx: {skill:{athletics:4},sta:.8,fame:4,honor:4,epithet:"Longrun"},
            },
            lose: {
              r: "You reach the camps an hour behind the riders. The clan-mothers saved most of the herds anyway. You will run that night in your dreams for years.",
              fx: {skill:{athletics:2},sta:.4,wil:2.5},
            },
          },
          {
            t: "Run, and take a relay of horses",
            check: {s:"riding",s2:"sta",d:40},
            win: {
              r: "Three horses ridden into the ground and your own legs for the last stretch. The camps are warned in time.",
              fx: {skill:{riding:3},fame:2,honor:3},
            },
            lose: {
              r: "The second horse breaks a leg in a marmot hole. You run the rest, and arrive in time, barely.",
              fx: {coin:-20,skill:{athletics:2},honor:2},
            },
          },
          {
            t: "Let a stronger rider go",
            r: "A burst-rider of another line takes the message. He tires at midnight, as orcs do, and arrives late. You do not say anything. You do not have to.",
            fx: {wil:1,happy:-4},
          },
        ],
      },
      {
        id: "pp_orc_abroad",
        title: "An orc in town",
        cond: (p,C)=>C.race(p,"orc")&&C.adult(p)&&!inR(p,ORCR)&&p.realm!=="POL-12",
        w: 1,
        cool: 6,
        text: "In the market of {home} children run when they see your tusks, and a mother pulls her son behind her skirts. Most humans believe orcs were made from cursed men. Today the town watch-captain stops you at the well with four men: someone's sheep went missing in the night, and you are the only orc in town.",
        choices: [
          {
            t: "Find the sheep yourself",
            check: {s:"tracking",s2:"int",d:40},
            win: {
              r: "Wool on a bramble, a drag-mark, a butcher's back gate. The watch-captain is not grateful, but he lets you go.",
              fx: {skill:{tracking:3},honor:2,fame:1},
            },
            lose: {
              r: 'The trail goes nowhere. They put you in the stocks for a day "to be safe".',
              fx: {happy:-6,honor:-2,wil:2},
            },
          },
          {
            t: "Stand very still and let them search you",
            check: {s:"wil",s2:"diplomacy",d:38},
            win: {
              r: "They find nothing, and the sheep turns up in a neighbour's barley by noon. A few people nod to you after that.",
              fx: {wil:1.5,honor:1},
            },
            lose: {r:'They take your knife "for safety" and keep it.',fx:{coin:-5,happy:-3,wil:1}},
          },
          {
            t: "Bare your tusks and walk through them",
            check: {s:"intimidation",s2:"str",d:48},
            win: {
              r: "Four men step aside. The town talks about it for a week, and nobody ever accuses you of anything again. Nobody speaks to you either.",
              fx: {skill:{intimidation:3},happy:-2},
            },
            lose: {
              r: "Four men and clubs.",
              fx: {
                duel: {
                  tier: 2,
                  title: "the town watch",
                  opts: {kind:"brawl",place:"the town well",lethal:!1,toYield:!0,title:"The missing sheep"},
                },
              },
            },
          },
        ],
      },
      {
        id: "pp_orc_refused",
        title: "No bread at the gate",
        cond: (p,C)=>C.race(p,"orc","halforc")&&C.adult(p)&&!inR(p,ORCR),
        w: .9,
        cool: 8,
        text: "You arrive at a lord's manor near {home} at dusk in a storm, soaked, with the message you were hired to carry. The steward reads it, takes it, and shuts the gate in your face without offering bread or a corner of the barn. To refuse food to a guest is the worst insult an orc knows.",
        choices: [
          {
            t: "Hammer on the gate and demand guest-right",
            check: {s:"intimidation",s2:"wil",d:44},
            win: {
              r: "The lord himself comes down, embarrassed, and sends you to the kitchen fire. The steward glares at you all night. You eat for two.",
              fx: {skill:{intimidation:2},happy:3},
            },
            lose: {r:"They set the dogs on you.",fx:{health:-8,wound:"bite",wil:1.5,cause:"a lord's dogs"}},
          },
          {
            t: "Sleep in the ditch, and remember",
            r: "You remember the name of the house, and the face of the steward. Orcs keep long spoken epics. This will be a short, bitter verse.",
            fx: {wil:2,trait:"vengeful",health:-3},
          },
          {
            t: "Walk to the village and find a half-orc household",
            check: {s:"persuasion",s2:"survival",d:34},
            win: {
              r: 'A half-orc wheelwright takes you in without a word, feeds you, and laughs at the story. "Humans," he says. "They do not know what they are refusing."',
              fx: {happy:4,newRel:{type:"friend",op:30}},
            },
            lose: {r:"The village is shut and dark. You sleep under a cart.",fx:{health:-3,wil:1}},
          },
        ],
      },
      {
        id: "pp_orc_clanless",
        title: "The clanless one",
        cond: (p,C)=>(orcGrass(p)||C.race(p,"orc"))&&C.adult(p),
        w: .8,
        cool: 10,
        text: "At the edge of your camp's firelight sits a thin orc with no clan sign on anything. Clanless: someone who harmed a guest, killed a shaman, or refused food at a fire. No fire may feed him. He does not ask. He only sits where the light ends, and looks at the meat.",
        choices: [
          {
            t: "Leave a bowl at the edge of the light, and look away",
            r: "It is not feeding him if nobody sees. In the morning the bowl is clean and the stranger is gone. Your clan-mother says nothing, which is a kind of permission.",
            fx: {trait:"kind",piety:-1,honor:1},
          },
          {
            t: "Ask him what he did",
            check: {s:"diplomacy",s2:"ins",d:40},
            win: {
              r: "He refused food to a Redhand chief who had killed his mother. You do not know what you think. You tell him the way to the Free Marches, where nobody asks.",
              fx: {int:.4,wil:1,honor:1},
            },
            lose: {r:"He will not say. He gets up and walks into the dark.",fx:{}},
          },
          {
            t: "Drive him off. The law is the law",
            r: "He goes without a word. It is the law. You sleep badly anyway.",
            fx: {honor:1,wil:.5,trait:"just"},
          },
        ],
      },
      {
        id: "pp_orc_firstraid",
        title: "The first raid",
        cond: (p,C)=>orcGrass(p)&&(C.teen(p)||C.adult(p)&&C.ageAdj(p)<30),
        w: 1.2,
        once: !0,
        setup: (p,ctx)=>{ctx.target=p.realm==="POL-34"?"a Drevnan farm east of Sevmir":"an Aldmark farm across the Glenwash fords"},
        text: "Your first raid: twenty young riders across the line at night, to drive off the cattle of {target}. It is a bad year for grass, and the farm has fat cattle and a palisade of thin stakes. Your war-captain has said: cattle, not blood. The young ones around you are not so sure.",
        choices: [
          {
            t: "Do as the captain said: cattle, and gone",
            check: {s:"riding",s2:"husbandry",d:42},
            win: {
              r: "Forty head across the ford before the farm wakes. Nobody dies. The clan-mothers are very pleased, and you get a share.",
              fx: {skill:{riding:2,husbandry:2},coin:15,fame:1,honor:1},
            },
            lose: {
              r: "The cattle scatter in the dark and the farm wakes. You get away with six head and a bolt in your saddle.",
              fx: {coin:4,wil:1},
            },
          },
          {
            t: "Burn the barn to cover the escape",
            check: {s:"stealth",s2:"ins",d:40},
            win: {
              r: "The farm runs to the fire, and the cattle run with you. It works. Somewhere a family will be hungry this winter, as yours was.",
              fx: {coin:20,honor:-3,skill:{stealth:2},trait:"cruel"},
            },
            lose: {
              r: "The fire spreads to the house. You see a child at a window before you ride away. You never tell anyone.",
              fx: {wil:2,happy:-10,honor:-5},
            },
          },
          {
            t: "Hold back the hothead who wants to kill the farmer",
            check: {s:"command",s2:"str",d:44},
            win: {
              r: "You knock him off his horse. The farmer lives, the cattle come home, and the war-captain looks at you differently.",
              fx: {skill:{command:3},honor:3,newRel:{type:"rival",op:-15}},
            },
            lose: {
              r: "He shakes you off. The farmer dies in his own yard. It will be sung, and not by orcs.",
              fx: {wil:1.5,honor:-2,happy:-5},
            },
          },
        ],
      },
      {
        id: "pp_orc_warning",
        title: "Riders on the river",
        cond: (p,C)=>orcGrass(p)&&C.adult(p)&&!C.old(p)&&!C.blood(p,"longwind"),
        w: .9,
        cool: 8,
        text: 'At dawn you see them from the ridge: Aldmark riders, two hundred at least, fording the river toward the summer camps, where the herds and the children are. The camps are half a day away. You have one horse, and orcs tire after ten minutes of hard effort. "Run like Tukar," they say.',
        choices: [
          {
            t: "Ride, and save the horse for the last stretch",
            check: {s:"riding",s2:"int",d:44},
            win: {
              r: "Trot, walk, trot, and a gallop over the last hill. The clan-mothers have the herds moving before you finish shouting. The riders burn empty tents.",
              fx: {skill:{riding:3},fame:3,honor:3},
            },
            lose: {
              r: "Your horse is blown by noon. You arrive with the riders an hour behind you, and the camps lose half the herd.",
              fx: {wil:2,coin:-10,honor:1},
            },
          },
          {
            t: "Shoot the scouts, to slow the column",
            check: {s:"bow",s2:"stealth",d:50},
            win: {
              r: "Two scouts down at the ford. The column halts for an hour, searching the reeds. An hour is enough.",
              fx: {skill:{bow:3,stealth:2},fame:2,merit:1},
            },
            lose: {
              r: "They see you. A dozen riders peel off after you.",
              fx: {
                duel: {
                  tier: 2,
                  title: "an Aldmark rider",
                  troop: "HC",
                  opts: {kind:"duel",place:"the river ridge",lethal:!0,toYield:!0,title:"Riders on the river"},
                },
              },
            },
          },
          {
            t: "Light the signal fire on the ridge",
            r: "The smoke goes up, black. Across the grass, one by one, the camps answer with their own. Old ways work.",
            fx: {honor:2,skill:{survival:1}},
          },
        ],
      },
      {
        id: "pp_gi_pair",
        title: "Paired for life",
        cond: (p,C)=>giHall(p)&&C.adult(p)&&C.age(p)<=45&&!C.flag(p,"pp_gi_paired"),
        w: 1.6,
        once: !0,
        setup: (p,ctx)=>{setPid(p,ctx,"giant",{frac:1.05,occ:"a young giant of the halls"}),ctx.yard=p.realm==="POL-23"?"the Pair Hall of Valdgard":"the Pair-Yard of Skarfell, under Thrand the Broad"},
        text: "A giant cannot turn fast; it takes three seconds to face an enemy behind you. So giants fight in pairs, back to back, and are paired for life. Your years at {yard} are ending. The masters have watched you for four winters and they name {themFull} for you. Your two names will be cut together into a beam of the hall.",
        choices: [
          {
            t: "Stand back to back with {them} and take the oath",
            r: "Your shoulders touch. You feel {themHim} breathe. The names are cut into the beam that night, side by side, for as long as the hall stands.",
            fx: {flag:"pp_gi_paired",them:{type:"friend",op:50},honor:3,happy:4},
          },
          {
            t: "Ask to be tested together in the yard first",
            check: {s:"ins",s2:"unarmed",d:40},
            win: {
              r: "Six human spearmen come at you from every side. You turn as one. Not one padded spear touches either back. The masters cut the names with a nod.",
              fx: {flag:"pp_gi_paired",skill:{unarmed:3},ins:.6,them:{type:"friend",op:45},fame:1},
            },
            lose: {
              r: "You both turn the same way and a spear taps your spine. The masters laugh. You pair anyway; you will learn.",
              fx: {flag:"pp_gi_paired",them:{type:"friend",op:35},wil:1},
            },
          },
          {
            t: "Ask for your childhood friend instead",
            check: {s:"persuasion",s2:"wil",d:46},
            win: {
              r: "The masters argue a whole evening, slowly. Then they agree. A pair that loves each other turns faster, says the eldest.",
              fx: {flag:"pp_gi_paired",newRel:{type:"friend",op:50},happy:5},
            },
            lose: {
              r: "Custom is a glacier. You are paired with {them}, and {theyHe} knows you asked for someone else.",
              fx: {flag:"pp_gi_paired",them:{type:"friend",op:15},happy:-3},
            },
          },
        ],
      },
      {
        id: "pp_gi_pairfight",
        title: "Back to back",
        cond: (p,C)=>giHall(p)&&C.adult(p)&&!C.old(p),
        w: 1,
        cool: 10,
        text: "On the walrus beach in the winter dark, a white bear the size of a human hut comes out of the ice-hummocks, starving, and goes for the human harpooners. You and your pair-mate set your backs together and step between them and it. The bear circles. A bear is quicker than a giant; it is looking for the side you cannot turn to.",
        choices: [
          {
            t: "Hold the pair and wait for it to commit",
            check: {s:"ins",s2:"wil",d:44},
            win: {
              r: "It goes for your back and meets your pair-mate's maul. Then yours. The humans skin it on the beach and give you the hide.",
              fx: {ins:.6,fame:2,honor:3,gear:{cloak:"furcloak"}},
            },
            lose: {
              r: "It gets inside the turn. Claws rake your chest before your pair-mate breaks its back.",
              fx: {health:-15,wound:"scar_chest",wil:2,fame:1,cause:"a white bear"},
            },
          },
          {
            t: "Throw a cape stone before it closes",
            check: {s:"throwing",s2:"str",d:46},
            win: {
              r: "Fifty kilos of sea-rounded stone, twenty paces, and the bear goes down in the snow and does not get up.",
              fx: {skill:{throwing:4},fame:2},
            },
            lose: {r:"The stone skips off the ice. The bear flinches, and comes on.",fx:{health:-8,wil:1}},
          },
          {
            t: "Shout the humans back and let it take a seal carcass",
            r: "It takes the seal and goes back into the dark. Nobody is hurt. The harpooners say giants are getting soft. They are alive to say it.",
            fx: {trait:"cautious",honor:1},
          },
        ],
      },
      {
        id: "pp_gi_stonering",
        title: "The Stone Ring",
        cond: (p,C)=>giHall(p)&&C.ageAdj(p)>=14&&!C.old(p),
        w: 1,
        cool: 10,
        text: "The young giants throw for the hall's honor in the Stone Ring: a sea-rounded stone of fifty kilos, from the hips and one leg, as far as it will go. Hroa of Torvik threw thirty-four metres at the Thing of 1064, a mark no giant has matched. Vermund Farcast threw thirty-two in 1099. Today it is your turn in front of the hall.",
        choices: [
          {
            t: "Throw for distance",
            check: {s:"throwing",s2:"str",d:46},
            win: {
              r: p=>`${A.ri(28,31)} metres. The hall thumps the ground until the humans' cups jump. Not Hroa's mark, but your name is chanted that night.`,
              fx: {skill:{throwing:4},str:.5,fame:2,happy:4},
            },
            lose: {
              r: "Twenty-two metres, and the stone rolls into the sea. The old ones say your hips are lazy.",
              fx: {skill:{throwing:2},happy:-2},
            },
          },
          {
            t: "Throw at the mark: a barrel at twenty-five metres",
            check: {s:"throwing",s2:"ins",d:44},
            win: {
              r: "Staves everywhere. The Stone Ring is not only for distance; a stone that hits is worth two that fly.",
              fx: {skill:{throwing:4},ins:.4,fame:1},
            },
            lose: {r:"Wide by a metre. The barrel survives, smugly.",fx:{skill:{throwing:2}}},
          },
          {
            t: "Ask old Hroa how she did it",
            r: "She will not throw in front of the hall any more, and will not say why. But she shows you the half-turn on the left leg, very slowly, with her dead right knee stiff as a post.",
            fx: {skill:{throwing:3},int:.3,newRel:{type:"mentor",op:25}},
          },
        ],
      },
      {
        id: "pp_gi_walrus",
        title: "The bull walrus",
        cond: (p,C)=>giHall(p)&&C.adult(p)&&!C.old(p),
        w: 1,
        cool: 8,
        text: "August on the capes, and the walrus are hauled out on the beach in their thousands. Your hall needs fat for the winter. The biggest bull, four tonnes of tusk and temper, is between you and the cows. A bull like this rolled Hroa of Torvik in 1047 and crushed her knee for life.",
        choices: [
          {
            t: "Harpoon the bull from the rocks",
            check: {s:"throwing",s2:"str",d:46},
            win: {
              r: "The harpoon goes in behind the head. The bull roars, thrashes and dies on the shingle. The hall eats fat all winter, and the tusks are yours.",
              fx: {skill:{throwing:3},coin:25,fame:2,honor:2},
            },
            lose: {
              r: "It turns into the harpoon and comes at you over the rocks. You get away, but your ankle twists under all your weight.",
              fx: {health:-12,wound:"bad_knee",wil:1.5,cause:"a bull walrus"},
            },
          },
          {
            t: "Take a cow from the edge instead",
            check: {s:"survival",s2:"ins",d:36},
            win: {
              r: "A fat cow, quietly, while the bull roars at nothing. Less glory, a full larder.",
              fx: {coin:12,skill:{survival:2}},
            },
            lose: {r:"The whole herd panics into the sea. Nothing today.",fx:{happy:-2}},
          },
          {
            t: "Let the human harpooners in skin boats take it",
            check: {s:"command",s2:"diplomacy",d:38},
            win: {
              r: "They take it from the water side while you hold the beach. Giants and humans, as it should be. Everyone eats.",
              fx: {skill:{command:2},honor:2,coin:10},
            },
            lose: {
              r: "A skin boat overturns. You wade in to pull them out, up to your chest in the freezing sea.",
              fx: {honor:3,health:-5,wil:1},
            },
          },
        ],
      },
      {
        id: "pp_gi_nowhale",
        title: "No whale this winter",
        cond: (p,C)=>giHall(p)&&C.adult(p),
        w: 1,
        cool: 10,
        text: "No whale has stranded on your shore since summer, and the seal stores are low. A giant needs fifteen to twenty-five thousand a day, more than a human household of five. The halls still sing of Grom's whale and the Famine Winter. The eldest asks what the hall should do.",
        choices: [
          {
            t: "Go out on the sea ice for seals, day after day",
            check: {s:"survival",s2:"sta",d:44},
            win: {
              r: "Weeks in the dark on the ice, breathing-hole by breathing-hole. You bring the hall through to spring, thin and alive.",
              fx: {skill:{survival:4},sta:.6,honor:3,wil:1.5},
            },
            lose: {
              r: "The ice cracks under your weight far out. You crawl back to shore with nothing but your life.",
              fx: {health:-12,wound:"frostbite",wil:2,cause:"the sea ice"},
            },
          },
          {
            t: "Buy grain and ale from the Northreach ships",
            req: p=>p.coin>=30,
            r: "Thirty suns of barley and ale. A giant does not live well on grain, but lives. The Northreach factor smiles; giants pay in ivory next year.",
            fx: {coin:-30,honor:2},
          },
          {
            t: "Demand more grain from the humans below the hall",
            r: "They pay it, and go hungry themselves. The hall eats. The turf huts below are very quiet that winter, and remember.",
            fx: {honor:-4,trait:"cruel",favor:2},
          },
        ],
      },
      {
        id: "pp_gi_heat",
        title: "A hot day",
        cond: (p,C)=>giHall(p)&&C.ageAdj(p)>=12,
        w: 1,
        cool: 10,
        text: "A summer day of rare warmth, twenty-two degrees, and you are stuck bargaining in the sun at the shore market. A giant's body sheds heat slowly; above twenty degrees you start to cook. Your head pounds, your face is scarlet, and the human trader across the scale is happily taking his time.",
        choices: [
          {
            t: "Walk into the sea up to your chest and bargain from there",
            r: "The trader has to shout across the water. The whole market laughs. You are cool, he is hoarse, and you get the better price.",
            fx: {happy:4,coin:8,trait:"witty"},
          },
          {
            t: "Bargain fast and get out of the sun",
            check: {s:"trade",s2:"wil",d:42},
            win: {
              r: "Three offers, done. Not the best deal of your life, but you are in the shade of the hall before the dizziness takes you.",
              fx: {coin:5,skill:{trade:2}},
            },
            lose: {
              r: "The world spins. You sit down on the shingle, which shakes the whole market, and a human pours seawater on your head.",
              fx: {health:-8,happy:-3,cause:"heat"},
            },
          },
          {
            t: "Leave a human of the hall to bargain for you",
            r: "An old human of the hall bargains like a fox. The hall gets a better price than you would have, and you nap in a cold cellar.",
            fx: {coin:6,newRel:{type:"friend",op:15}},
          },
        ],
      },
      {
        id: "pp_gi_fall",
        title: "The ice on the steps",
        cond: (p,C)=>giHall(p)&&C.ageAdj(p)>=12,
        w: 1,
        cool: 12,
        text: "Freezing rain overnight has glazed the stone steps down from the hall. A fall from a giant's own height can break a hip or kill; a giant cannot catch itself the way a human can. Your foot slides on the third step, and the whole world tilts.",
        choices: [
          {
            t: "Sit down hard, on purpose, before you fall",
            check: {s:"ins",s2:"wil",d:40},
            win: {
              r: "You land on your backside with a thump that cracks the ice and frightens the dogs. Bruised, laughing, unbroken.",
              fx: {ins:.4,happy:2},
            },
            lose: {
              r: "You go down sideways onto the edge of a step.",
              fx: {health:-18,wound:"back",wil:2,cause:"a fall on ice"},
            },
          },
          {
            t: "Grab the door frame",
            check: {s:"str",s2:"spd",d:44},
            win: {r:"The frame groans, and holds. So do you.",fx:{str:.3}},
            lose: {
              r: "The frame comes away in your hand. You land on it, and on your knee.",
              fx: {health:-12,wound:"bad_knee",wil:1.5,cause:"a fall on ice"},
            },
          },
          {
            t: "Shout for the humans to throw ash on the steps",
            r: "They come running with buckets from the fire-pits. You stand very, very still for a long time. It is undignified and wise.",
            fx: {trait:"cautious"},
          },
        ],
      },
      {
        id: "pp_gi_scream",
        title: "The screaming child",
        cond: (p,C)=>giHall(p)&&C.adult(p),
        w: 1,
        cool: 10,
        text: "At the shore, a human trader's child, fresh off a ship from the south, sees you and screams, and keeps screaming. The father puts himself in front of the child with a knife in his hand, shaking. To him you are a legend he half believed in, four metres tall and walking toward him.",
        choices: [
          {
            t: "Kneel slowly, and hold out your open hand",
            check: {s:"diplomacy",s2:"wil",d:36},
            win: {
              r: "Kneeling, you are still taller than the father. But the child stops screaming, and after a long time puts one finger on your thumb.",
              fx: {honor:2,happy:4,skill:{diplomacy:2}},
            },
            lose: {
              r: "The father backs away up the gangplank with the child and does not come ashore again.",
              fx: {happy:-3},
            },
          },
          {
            t: "Hum the low chant the hall sings to its children",
            check: {s:"music",s2:"int",d:34},
            win: {
              r: "It is felt in the chest more than heard. The child goes quiet and stares, and the father slowly lowers the knife.",
              fx: {skill:{music:2},happy:3},
            },
            lose: {r:"The ground hums. The child screams louder.",fx:{happy:-2}},
          },
          {
            t: "Walk away. They are not your people",
            r: "Quick, clever, many and fragile. You go back up to the hall and do not think about it. Mostly.",
            fx: {trait:"shy"},
          },
        ],
      },
      {
        id: "pp_gi_door",
        title: "A human door",
        cond: (p,C)=>giHall(p)&&C.adult(p),
        w: .9,
        cool: 15,
        text: "You are sent with your hall's ivory to a Northreach jarl's hall across the water. The door is a little over two metres. A giant's hall door is five. The jarl and his whole household are waiting inside to see what you will do. Some halls are proud: the giants of Haugberg refuse to stoop for any door.",
        choices: [
          {
            t: "Get down on your knees and crawl in",
            r: "The jarl's household laughs, then stops laughing when you stand up inside and your head is in the smoke of the roof. The deal is good. Your knees are not.",
            fx: {coin:15,honor:-1,skill:{diplomacy:1}},
          },
          {
            t: "Refuse to stoop. Do business at the door",
            check: {s:"wil",s2:"trade",d:44},
            win: {
              r: "The jarl comes out into the rain to bargain, which he will tell as a story for the rest of his life. You get the best price your hall has had in years.",
              fx: {coin:25,honor:3,skill:{trade:2},trait:"proud"},
            },
            lose: {r:"The jarl will not come out in the rain. You sail home with the ivory.",fx:{happy:-3}},
          },
          {
            t: "Lift the door off its hinges, politely",
            check: {s:"str",s2:"diplomacy",d:40},
            win: {
              r: "You hand the door to two astonished thralls and duck in. The jarl roars with laughter and has the doorway widened by spring, in your honor.",
              fx: {coin:20,fame:2,newRel:{type:"friend",op:25}},
            },
            lose: {
              r: "The frame comes too, and half the wall. It is the start of a long negotiation about damages.",
              fx: {coin:-15,happy:-2},
            },
          },
        ],
      },
      {
        id: "pp_gi_tinfair",
        title: "The summer tin fair",
        cond: (p,C)=>C.realm(p,"POL-09")&&C.race(p,"giant")&&C.adult(p),
        w: 1,
        cool: 7,
        text: "The beacon at Lindholm says the first Northreach sail is in, and the summer tin fair opens on the shore below Skarfell Hall. Black tin from the hall's streams, walrus ivory and mammoth wool, against grain, ale and iron. The Northreach factor has a new scale and an old smile.",
        choices: [
          {
            t: "Bargain for your hall's tin",
            check: {s:"trade",s2:"int",d:42},
            win: {
              r: "Slow, exact and patient. You weigh his scale against the hall's own beam and find it light. He laughs, apologizes and pays properly.",
              fx: {coin:30,skill:{trade:3}},
            },
            lose: {r:"You realize at dusk that his scale was light all day.",fx:{coin:10,wil:.6}},
          },
          {
            t: "Sell mammoth wool to the southern merchants",
            check: {s:"trade",s2:"persuasion",d:38},
            win: {
              r: '"Wool of a beast your grandfathers thought extinct!" They pay double, out of wonder.',
              fx: {coin:25,skill:{persuasion:2}},
            },
            lose: {r:"They think it is goat. You do not sell much.",fx:{coin:5}},
          },
          {
            t: "Watch which human boats load at night",
            check: {s:"intrigue",s2:"ins",d:46},
            win: {
              r: "A Ragvik cove, no lights, an Aldmark cog. Tin is going somewhere the Tin Compact forbids. You keep it for the Thing.",
              fx: {skill:{intrigue:3},flag:"pp_gi_ragvik"},
            },
            lose: {r:"You see nothing but fog and fishing boats.",fx:{}},
          },
        ],
      },
      {
        id: "pp_gi_thing1106",
        title: "Bergthor's visitor",
        cond: (p,C)=>early()&&C.realm(p,"POL-09")&&C.race(p,"giant")&&C.adult(p),
        w: 1.2,
        once: !0,
        text: `A runner from Haugberg comes to your hall with Eldest Bergthor's greeting and a gift of mammoth wool. Chieftain Skarvi let an Aldmark cog load tin at Ragvik last August, against the Tin Compact. At the Thing of 1106 Bergthor will stand against Skarvi, and he wants your voice. "Aldmark pays in rye," says the runner. "Northreach pays in excuses."`,
        choices: [
          {
            t: "Promise your voice to Bergthor",
            r: "The runner bows and goes. Somewhere at Skarfell, someone will hear of it before the snow.",
            fx: {flag:"pp_gi_bergthor",coin:10,skill:{intrigue:2}},
          },
          {
            t: "Refuse: a broken compact is a lie told at the Thing",
            check: {s:"wil",s2:"diplomacy",d:40},
            win: {
              r: "You say it slowly, so the runner can carry every word. Skarvi's people will know you are no one's, which is worth something.",
              fx: {honor:4,fame:1},
            },
            lose: {r:"The runner smiles and leaves the wool anyway. Gifts bind, among giants.",fx:{honor:-1}},
          },
          {
            t: "Ask what the Lindholm watch saw",
            check: {s:"intrigue",s2:"int",d:46},
            win: {
              r: "A Lindholm watcher tells you: they saw the cog, and Skarvi's son Arni told them to forget it. You now know more than either side wants you to.",
              fx: {flag:"pp_gi_ragvik",skill:{intrigue:3}},
            },
            lose: {r:"The watch-hall has forgotten, as ordered.",fx:{}},
          },
        ],
      },
      {
        id: "pp_gi_harpoon",
        title: "Drevnan iron",
        cond: (p,C)=>early()&&giHall(p)&&C.adult(p),
        w: 1.1,
        once: !0,
        text: p=>p.realm==="POL-09"?"A young hunter of Torvik, Solvei, shows you something she should not have kept: a harpoon head of Drevnan iron, pulled from a dead Frost Leviathan on the capes. Hroa ordered silence. If it is carried to Hrimfell, the Walking Halls will say Drevna broke the Truce of Dobin, and the raids will start again after the first frost.":"A young Frostholm hunter, Solvei of Torvik, has crossed Whale Sound on a Northreach cog with something wrapped in sealskin: a harpoon head of Drevnan iron, pulled from a dead Frost Leviathan. She means to show it at the Thing. If she does, Torvald's Walking Halls will say Drevna broke the Truce of Dobin, and the raids will start again after the first frost.",
        choices: [
          {
            t: p=>p.realm==="POL-09"?"Help her carry it to the Hrimfell Thing":"Help her show it at the Thing",
            r: "The iron is unwrapped in front of the halls. Whatever happens on the whaling grounds now happens partly because of you.",
            fx: {flag:"pp_gi_harpoonborne",fame:2,honor:1,skill:{sea:2}},
          },
          {
            t: "Persuade her to keep Hroa's silence",
            check: {s:"persuasion",s2:"wil",d:48},
            win: {
              r: "She hates it, and agrees. The truce holds another winter. Children on both sides of the whaling grounds live who might not have.",
              fx: {honor:2,skill:{persuasion:3},wil:1},
            },
            lose: {r:'"The halls should know," she says, and goes alone.',fx:{wil:.5}},
          },
          {
            t: "Take it and drop it in the sea",
            check: {s:"stealth",s2:"str",d:44},
            win: {
              r: "One throw from the capes. The iron goes down to the Mother. Solvei will never forgive you; perhaps nobody else will ever know.",
              fx: {trait:"cautious",newRel:{type:"enemy",op:-30}},
            },
            lose: {r:"She sees it coming and keeps it from you. Now she does not trust you.",fx:{happy:-2}},
          },
        ],
      },
      {
        id: "pp_gi_mammoth",
        title: "The mammoth calf",
        cond: (p,C)=>C.realm(p,"POL-09")&&C.race(p,"giant")&&C.adult(p),
        w: 1,
        cool: 10,
        text: "A Thunder Mammoth cow of the hall's herd is calving in a blizzard, out on the north pasture. Mammoth calves are named and counted like children; humans across the sea think mammoths died out long ago. The herdsman, a human, is waist-deep in snow and frightened. The calf is coming wrong.",
        choices: [
          {
            t: "Turn the calf yourself",
            check: {s:"husbandry",s2:"str",d:46},
            win: {
              r: "Arm to the shoulder, in a blizzard. The calf comes out steaming and furious. The hall names it after you.",
              fx: {skill:{husbandry:4},fame:1,happy:5,honor:2},
            },
            lose: {
              r: "The calf comes dead. The cow mourns it for days, as mammoths do, and so does the hall.",
              fx: {skill:{husbandry:2},wil:1.5,happy:-4},
            },
          },
          {
            t: "Build a windbreak of your body and wait",
            check: {s:"sta",s2:"wil",d:38},
            win: {
              r: "Six hours with your back to the storm. The cow manages on her own, sheltered. The herdsman says nobody else would have thought of it.",
              fx: {sta:.5,honor:2,newRel:{type:"friend",op:20}},
            },
            lose: {r:"The calf lives; your ears freeze.",fx:{wound:"frostbite",wil:1}},
          },
          {
            t: "Send for the Haugberg herd-masters",
            r: "They come by morning. Calf and cow live. The Haugberg giants mention it at every Thing for the next forty years.",
            fx: {honor:-1,coin:-5},
          },
        ],
      },
      {
        id: "pp_gi_musth",
        title: "The mad bull",
        cond: (p,C)=>C.realm(p,"POL-09")&&C.race(p,"giant")&&C.adult(p)&&!C.old(p),
        w: .8,
        cool: 15,
        text: "A Thunder Mammoth bull in his madness season has broken out of the Haugberg pastures and is tearing apart a tribute village. Huts are kindling. Humans are running. He is the only thing on the island that can look a giant in the eye.",
        choices: [
          {
            t: "Face him with your maul",
            r: "He swings his head toward you, trumpeting.",
            fx: {honor:3,beast:{id:"CRE-33",place:"the tribute village",mod:.6}},
          },
          {
            t: "Get the humans out of the huts first",
            check: {s:"command",s2:"spd",d:40},
            win: {
              r: "You carry children four at a time and shout the rest into the stone byre. The bull wrecks the village and nobody dies in it.",
              fx: {honor:5,fame:2,skill:{command:2}},
            },
            lose: {r:"You are too slow. Two humans are crushed before the bull wanders off.",fx:{wil:2,happy:-6}},
          },
          {
            t: "Lead him away with a cow's scent",
            check: {s:"husbandry",s2:"ins",d:48},
            win: {
              r: "A sack of the cow-pen straw on your back and a long, terrifying walk into the hills. He follows you, not the village.",
              fx: {skill:{husbandry:3},fame:2,honor:3},
            },
            lose: {
              r: "He follows you, and catches you.",
              fx: {health:-18,wound:"broken_ribs",wil:2,cause:"a Thunder Mammoth"},
            },
          },
        ],
      },
      {
        id: "pp_gi_child",
        title: "Shown to the hall",
        cond: (p,C)=>giHall(p)&&C.adult(p)&&C.hasKids(p),
        w: 1.3,
        once: !0,
        text: "Sixteen months of carrying, and a giant child is born to your hall: one every six or eight years, and every one counted. In its first winter the child is shown to the whole hall so the halls know its size. The eldest holds it up by the fire-pit, and every giant in the hall leans in.",
        choices: [
          {
            t: "Chant the child's line back to the first hall",
            check: {s:"music",s2:"learning",d:40},
            win: {
              r: "Every Mother, every name, and the child's at the end. The hall thumps the floor so hard the human servants' cups jump.",
              fx: {skill:{music:2,learning:2},piety:4,happy:6},
            },
            lose: {r:"You swap two grandmothers. The eldest finishes it for you, kindly.",fx:{happy:3,piety:2}},
          },
          {
            t: "Give a whale share to the humans of the hall in thanks",
            r: "A feast for the turf huts. The humans come up to see the child, and the child sees them, and laughs. A good beginning.",
            fx: {honor:3,coin:-10,happy:5},
          },
          {
            t: "Ask a human woman of the hall to help nurse",
            r: "As Helstad has always done. She is delighted and terrified. The child will grow up with two kinds of lullaby.",
            fx: {happy:4,newRel:{type:"friend",op:25}},
          },
        ],
      },
      {
        id: "pp_gi_count",
        title: "The count of the halls",
        cond: (p,C)=>giHall(p)&&C.ageAdj(p)>=14,
        w: .9,
        cool: 20,
        text: p=>`The eldest counts the giants of the hall at midwinter, as every hall does. Fewer again: two old ones carried to the sea, one child born. ${p.realm==="POL-23"?"Jotunhall is in the time of the 52nd Mother, and the chant says the sixtieth will be the last.":"The last crossing to the Hrimfell halls was in 1019; nobody has crossed since."} The hall sits in silence after the count, as it does every year.`,
        choices: [
          {
            t: "Break the silence with Grom's Whale",
            check: {s:"music",s2:"wil",d:36},
            win: {
              r: '"Slow, slow, the ice is wide." One voice, then the whole hall. A long task is done by steady work. Even this one.',
              fx: {skill:{music:2},happy:4,wil:1},
            },
            lose: {r:"Your voice cracks. Nobody joins. The silence wins this year.",fx:{happy:-3,wil:1}},
          },
          {
            t: "Speak of a match across the sea",
            check: {s:"diplomacy",s2:"persuasion",d:46},
            win: {
              r: "The eldest agrees to send word on the next Northreach ship. A marriage across Whale Sound, the first in eighty years. Hope is slow too.",
              fx: {honor:3,fame:2,skill:{diplomacy:2}},
            },
            lose: {r:'"Too far, too cold, too late," says the eldest.',fx:{wil:1}},
          },
          {
            t: "Walk out into the snow alone",
            r: "You stand on the shore under the stars until your beard freezes. The Mother is under the ice somewhere. She is very quiet tonight.",
            fx: {wil:2,happy:-3,piety:1},
          },
        ],
      },
      {
        id: "pp_gi_hire",
        title: "Six hundred suns a month",
        cond: (p,C)=>giHall(p)&&C.adult(p)&&!C.old(p)&&free(p),
        w: .9,
        cool: 15,
        setup: (p,ctx)=>{ctx.prince=A.pick(["a Velgradan prince","an Aldmark marcher lord","a Drevnan boyar","the Ostran banks' company"]),ctx.Prince=A.cap(ctx.prince)},
        text: "A southern agent climbs to your hall with a chest of silver. {Prince} wants a giant to break gates and shield walls: six hundred suns a month, twenty loaves and a sheep a day. Human princes have hired giants for that since before the Dimming. The south is warm, and giants cook in warm weather.",
        choices: [
          {
            t: "Go south for one campaign",
            check: {s:"str",s2:"sta",d:48},
            win: {
              r: "A gate falls in a single morning, and the prince's army pours through. You come home before the summer with a fortune and a dread of the sun.",
              fx: {coin:300,fame:5,skill:{siegecraft:3},health:-5,deed:"Broke a gate for a southern prince"},
            },
            lose: {
              r: "A July siege. You collapse in the heat at the foot of the wall, and they carry you off in a cart. Paid for half a month.",
              fx: {coin:120,health:-22,wil:2,cause:"southern heat"},
            },
          },
          {
            t: "Only for a winter campaign. Bargain for it",
            check: {s:"trade",s2:"diplomacy",d:46},
            win: {
              r: "Winter only, and a sheep and a half a day. The prince agrees. Cold sieges suit you.",
              fx: {coin:200,skill:{trade:2},fame:3},
            },
            lose: {r:"The agent goes off to the next hall.",fx:{}},
          },
          {
            t: "Refuse. There are too few of us to spend on human wars",
            r: "The eldest nods slowly. Every giant matters. The agent goes home with his chest of silver.",
            fx: {honor:2,trait:"cautious"},
          },
        ],
      },
      {
        id: "pp_gi_ache",
        title: "The joints",
        cond: (p,C)=>giHall(p)&&C.age(p)>=45&&!C.old(p),
        w: 1,
        cool: 12,
        text: "Most giants have joint pain by fifty, and yours has come: hands that will not close on the harpoon in the cold mornings, hips that grind on the stairs. A human healer of the tribute-folk offers willow bark and a hot stone poultice, and looks terrified to be offering anything to a giant.",
        choices: [
          {
            t: "Take the willow bark, a sackful of it",
            check: {s:"medicine",s2:"int",d:34},
            win: {
              r: "A giant needs a giant's dose, and the healer works it out. The mornings are easier. You send her a seal.",
              fx: {health:8,skill:{medicine:1},newRel:{type:"friend",op:20}},
            },
            lose: {r:"Too much, too fast. You spend a day with your stomach in knots.",fx:{health:-4}},
          },
          {
            t: "Sit in the hot spring at the shore every day",
            r: "It is an hour's walk, and the walk hurts. The water helps more than anything.",
            fx: {health:5,wil:1},
          },
          {
            t: "Ignore it. The young ones are watching",
            check: {s:"wil",s2:"sta",d:42},
            win: {
              r: "You hunt with the young ones all season and never once show it. It costs you every night.",
              fx: {wil:2,honor:1},
            },
            lose: {r:"Your knee gives on the ice in front of everyone.",fx:{wound:"bad_knee",health:-6,wil:1}},
          },
        ],
      },
      {
        id: "pp_gi_lie",
        title: "A lie in the hall",
        cond: (p,C)=>giHall(p)&&C.adult(p),
        w: .9,
        cool: 15,
        setup: (p,ctx)=>{setPid(p,ctx,"giant",{occ:"a giant of a neighboring hall"})},
        text: "At the gathering of the halls, {themFull} swears that the whale stranded on the boundary beach came ashore on {theirHis} side of the stream. You were there. It did not. A lie spoken at the Thing is the worst crime a giant can commit; a liar is made hall-less, and every hall's door shuts against {themHim}.",
        choices: [
          {
            t: "Stand up and say what you saw",
            check: {s:"wil",s2:"diplomacy",d:44},
            win: {
              r: "The eldests hear you, and the human witnesses after you. {them} is made hall-less. You were right, and it is terrible.",
              fx: {honor:5,fame:2,wil:1.5,them:{type:"enemy",op:-60}},
            },
            lose: {
              r: "Your word against {theirHis}, and {theyHe} is older. The whale is split. You have made an enemy for life.",
              fx: {honor:2,them:{type:"enemy",op:-40},wil:1},
            },
          },
          {
            t: "Speak to {themHim} privately first",
            check: {s:"persuasion",s2:"wil",d:42},
            win: {
              r: "{tHe} goes very still, then stands and says {theyHe} misremembered. A correction, not a lie. The whale goes where it should, and {them} owes you {theirHis} hall.",
              fx: {honor:3,skill:{persuasion:2},them:{type:"friend",op:20}},
            },
            lose: {
              r: "{tHe} says you are the liar. Now it is your word that is on trial.",
              fx: {honor:-2,them:{type:"enemy",op:-30},wil:1},
            },
          },
          {
            t: "Say nothing. It is only a whale",
            r: "It is only a whale. You keep telling yourself that for years.",
            fx: {honor:-3,happy:-2},
          },
        ],
      },
      {
        id: "pp_gi_step",
        title: "A careless step",
        cond: (p,C)=>giHall(p)&&C.ageAdj(p)>=12,
        w: .9,
        cool: 15,
        setup: (p,ctx)=>{ctx.kid=humanName(p)},
        text: "In the dark of a winter morning, coming down to the turf huts, you step back without looking and feel something give under your heel. A cry. {kid}, a hunter's child, was sitting in the snow behind you, and the leg is broken. A giant who kills a human pays the family in ivory and meat. This child is alive. Just.",
        choices: [
          {
            t: "Carry {kid} to the healer, running as giants run",
            check: {s:"sta",s2:"medicine",d:38},
            win: {
              r: "You hold the leg still the whole way. The healer sets it clean. {kid} will walk, and will tell the story of riding a giant all their life.",
              fx: {honor:3,wil:1.5,newRel:{type:"friend",op:30}},
            },
            lose: {r:"The leg heals crooked. {kid} will limp. The family will not meet your eye.",fx:{wil:2,happy:-6}},
          },
          {
            t: "Pay the family in ivory and meat, as if for a death",
            r: "It is more than the law asks. The father takes it, shaking. The humans talk about it in the turf huts all winter, and not unkindly.",
            fx: {coin:-25,honor:4,piety:2},
          },
          {
            t: "Blame the child for sitting there",
            r: "The family says nothing. The other humans say a great deal, quietly, to each other.",
            fx: {honor:-5,trait:"cruel"},
          },
        ],
      },
      {
        id: "pp_gi_raft",
        title: "Two giants fighting",
        cond: (p,C)=>giHall(p)&&C.adult(p),
        w: .8,
        cool: 20,
        text: "Two young giants of your hall have been drinking Northreach ale and are fighting over a pair-mate in the middle of the hall, mauls in their hands. The whole building shakes. A giant who kills a giant is sent out to sea on a raft, never to come back, and there are too few of you already.",
        choices: [
          {
            t: "Step between them and take the blows",
            check: {s:"str",s2:"wil",d:50},
            win: {
              r: "One maul on your shoulder, one on your raised arm, and then they both stop, horrified. You have bruises the size of human children, and the hall has two giants instead of none.",
              fx: {honor:5,fame:2,health:-10,wil:2},
            },
            lose: {
              r: "The blow catches you on the side of the head. When you wake, they have stopped. You will not hear well on that side again.",
              fx: {health:-20,wound:"ear",honor:5,wil:2,cause:"a maul blow in a hall brawl"},
            },
          },
          {
            t: "Roar the eldest's chant at them",
            check: {s:"music",s2:"intimidation",d:46},
            win: {
              r: "The deep voice of the lineage, the names of their own mothers. They lower the mauls. Neither can raise a weapon to that chant.",
              fx: {skill:{music:2,intimidation:2},honor:3},
            },
            lose: {r:"They do not hear you over each other. The eldest has to wade in.",fx:{wil:.5}},
          },
          {
            t: "Throw the ale barrel out of the door",
            r: "Without the barrel, the fight goes out of them in a while. They sit on the floor and weep together, as drunk giants do.",
            fx: {trait:"temperate",happy:1},
          },
        ],
      },
      {
        id: "pp_gi_tribute",
        title: "A thin harvest below",
        cond: (p,C)=>C.realm(p,"POL-09")&&C.race(p,"giant")&&C.adult(p)&&C.ageAdj(p)>=22,
        w: 1,
        cool: 10,
        text: `The barley has failed in the tribute villages below your hall, and the human headman climbs up to the giants' fire, cap in hand, to ask for a lighter grain tribute this year. Humans who flee without leave are brought back and lose their land. The eldest turns to you: "You speak. You know them better."`,
        choices: [
          {
            t: "Halve the tribute this year",
            r: "The headman nearly weeps. The hall eats seal and less bread. Down in the turf huts nobody runs for the Northreach boats that winter.",
            fx: {honor:4,coin:-10,trait:"generous",favor:-1},
          },
          {
            t: "Take the tribute in fish and labor instead of grain",
            check: {s:"stewardship",s2:"int",d:42},
            win: {
              r: "Dried fish for the hall, timber hauled for the roof, and the humans keep their barley. Everyone loses a little and nobody starves.",
              fx: {skill:{stewardship:3},honor:3},
            },
            lose: {r:"The fish is bad and the labor is sullen. Better than nothing.",fx:{skill:{stewardship:1}}},
          },
          {
            t: "The tribute is the tribute",
            r: "The headman goes back down the hill. Two families take a smuggler's boat to the Amber Cape before spring.",
            fx: {coin:10,honor:-3,trait:"stubborn"},
          },
        ],
      },
      {
        id: "pp_gi_nurse",
        title: "Your old nurse",
        cond: (p,C)=>giHall(p)&&C.adult(p),
        w: .9,
        once: !0,
        setup: (p,ctx)=>{ctx.nurse=humanName(p,"F")},
        text: "{nurse}, the human woman who nursed you as a baby and carried you on her hip until you were heavier than she was, is dying in her turf hut below the hall. She is seventy and you are barely grown. When she dies, you carry her coffin up to the cape alone, and it is the size of a cradle in your arms.",
        choices: [
          {
            t: "Sing her the giant lullaby she taught you to sing back",
            r: "The one she learned from your mother, and taught you in a human voice. The humans of the hall come out of their huts to listen.",
            fx: {piety:3,wil:2,happy:-3,skill:{music:1}},
          },
          {
            t: "Give her to the sea, as giants are given",
            r: "Her family agrees, after a long silence. She goes down to the Mother with the giants' dead, the first human to do it in living memory.",
            fx: {piety:4,honor:2,wil:1.5},
          },
          {
            t: "Pay for her grandchildren's land",
            r: "Three generations of her family will hunt and farm free of any due to the hall. It is the only thing you can think of that is big enough.",
            fx: {coin:-30,honor:4,wil:1.5},
          },
        ],
      },
      {
        id: "pp_gi_chantkeeper",
        title: "The Keeper of the Chant",
        cond: (p,C)=>giHall(p)&&C.adult(p)&&C.age(p)<=60&&!C.flag(p,"pp_gi_chanter"),
        w: .9,
        once: !0,
        setup: (p,ctx)=>{ctx.keeper=p.realm==="POL-09"?"Sva the Long-Voiced of Helstad, Keeper of the Mothers' Chant":"Grani the Rememberer of Jotunhall"},
        text: `{keeper} has heard you chant at the midwinter fire, and comes to your hall. The whole Mothers' Chant, every hall's line, a hundred generations deep, takes twenty-five years to learn. "I am old," the Keeper says. "Someone must carry it, or it goes down to the Mother with me."`,
        choices: [
          {
            t: "Give twenty-five years to the chant",
            r: "Year after year, name after name. When you finish, the whole history of your people lives in your chest, and you are older than you meant to be.",
            fx: {flag:"pp_gi_chanter",skill:{music:5,learning:5},piety:6,honor:4,int:.6},
          },
          {
            t: "Ask to learn only your own hall's line",
            check: {s:"learning",s2:"wil",d:40},
            win: {
              r: "A smaller task, done perfectly. Your hall will never need to borrow a chanter again.",
              fx: {skill:{learning:3,music:2},piety:3},
            },
            lose: {
              r: "The Keeper says the lines cannot be pulled apart like that, and goes to another hall.",
              fx: {happy:-2},
            },
          },
          {
            t: "Refuse. You are a hunter",
            r: 'The Keeper nods slowly. "The sea will feed you. Someone must remember you." The words stay with you.',
            fx: {wil:1,skill:{survival:1}},
          },
        ],
      },
      {
        id: "pp_gi_ivory",
        title: "Fingers too big",
        cond: (p,C)=>C.realm(p,"POL-23")&&C.race(p,"giant")&&C.ageAdj(p)>=14,
        w: 1,
        cool: 12,
        text: "In Jotunhall the human women of Grete Tuskcutter's workshop carve the walrus ivory your hall brings in, and it sells south for silver. You want to carve too. Your fingers are as thick as their wrists, and the fine knives vanish in your hand like needles.",
        choices: [
          {
            t: "Carve big: a whole tusk into a single walrus",
            check: {s:"craft",s2:"int",d:42},
            win: {
              r: 'Grete turns it in her hands for a long time. "No human could have done the curve," she says. It sells to a Velgrad boyar for a small fortune.',
              fx: {skill:{craft:4},coin:30,fame:1},
            },
            lose: {r:"It cracks along the grain. Ivory forgives nothing.",fx:{skill:{craft:2},coin:-5}},
          },
          {
            t: "Draw the designs for the human carvers",
            check: {s:"craft",s2:"learning",d:36},
            win: {
              r: "Your charcoal sketches of whales and seals, drawn from life, become the workshop's most popular pieces. Grete pays you a share.",
              fx: {skill:{craft:3},coin:15,newRel:{type:"friend",op:20}},
            },
            lose: {r:"They are good drawings. Nobody can carve them.",fx:{skill:{craft:1}}},
          },
          {
            t: "Haul tusks for the workshop instead",
            r: "A whole season's tusks carried up from the shore in a morning. The women bring you ale. It is a kind of art, being useful.",
            fx: {str:.3,happy:3},
          },
        ],
      },
      {
        id: "pp_gi_dobin",
        title: "Whalers in the grounds",
        cond: (p,C)=>C.realm(p,"POL-23")&&C.race(p,"giant")&&C.adult(p)&&!C.old(p),
        w: 1,
        cool: 10,
        text: "Three Drevnan whaling boats are working inside your hall's grounds, past the line set by the Truce of Dobin in 1098. Torvald of Torholm, who leads the Walking Halls, wants a reason to break the truce, and this is one. Your pair-mate is already picking up stones.",
        choices: [
          {
            t: "Sink one boat from the cliffs with thrown stones",
            check: {s:"throwing",s2:"str",d:48},
            win: {
              r: "The stone goes through the bottom boards. The Drevnans swim for the other boats and row home very fast. Torvald sends you a whale tooth.",
              fx: {skill:{throwing:3},fame:3,honor:-1,flag:"pp_gi_dobinstone"},
            },
            lose: {
              r: "Short. The boats turn and row out of range, and somebody on them makes a note.",
              fx: {skill:{throwing:1},wil:.5},
            },
          },
          {
            t: "Row out with human harpooners and warn them off",
            check: {s:"intimidation",s2:"diplomacy",d:42},
            win: {
              r: "A giant standing up in a skin boat is a persuasive sight. They go. The truce holds.",
              fx: {skill:{intimidation:2},honor:3},
            },
            lose: {
              r: "They laugh at the giant in the little boat. You come home soaked and furious.",
              fx: {happy:-3,wil:1},
            },
          },
          {
            t: "Report it to the Jotunhall eldest, and wait",
            r: "The eldest sends a runner to Dobin with a complaint, slow and exact. The boats are gone by the time anyone answers. The Walking Halls call you soft.",
            fx: {honor:1,newRel:{type:"rival",op:-15}},
          },
        ],
      },
      {
        id: "pp_gi_sledge",
        title: "The king on the ice",
        cond: (p,C)=>early()&&C.realm(p,"POL-23")&&C.race(p,"giant")&&C.adult(p),
        w: 1.1,
        once: !0,
        text: "King Hraldr of Jotunhall, who led the raids from a sledge and made the Truce of Dobin, is dying, and still goes down to the shore every month on his sledge, dragged by human hunters. Today a runner snaps on the sea ice, the sledge lurches, and the dying king slides toward open water.",
        choices: [
          {
            t: "Throw yourself flat on the ice and grab the sledge",
            check: {s:"str",s2:"ins",d:44},
            win: {
              r: 'You catch the rope a body-length from the black water. The king looks down at you from the furs. "Slow, slow, the ice is wide," he says, and laughs.',
              fx: {fame:4,honor:4,favor:8,str:.4},
            },
            lose: {
              r: "You catch it, and the ice under you cracks. The hunters drag you both back, half drowned.",
              fx: {fame:2,honor:3,favor:5,health:-12,wil:1.5},
            },
          },
          {
            t: "Shout the human hunters onto the rope",
            check: {s:"command",s2:"wil",d:40},
            win: {
              r: "Twelve humans on one rope, heaving to your count. The sledge comes back from the edge.",
              fx: {skill:{command:3},honor:3,favor:4},
            },
            lose: {r:"They panic. You end up hauling it alone.",fx:{health:-6,honor:2,favor:3}},
          },
          {
            t: "Carry him to the shore yourself afterward",
            r: "He is lighter than a seal now. He talks the whole way about the Thing and who should be king. You remember every word.",
            fx: {favor:4,flag:"pp_gi_hraldr",skill:{intrigue:1}},
          },
        ],
      },
      {
        id: "pp_gi_trappers",
        title: "Above the tree line",
        cond: (p,C)=>C.realm(p,"POL-23")&&C.race(p,"giant")&&C.adult(p),
        w: .9,
        cool: 10,
        text: "On watch above the passes you find three Velgradan trappers far above the tree line, where the white foxes run, with full packs. The custom of the watch-halls is old: trappers caught above the line are fed, shamed, and sent back down without their furs.",
        choices: [
          {
            t: "Feed them, shame them, take the furs",
            r: "You give them seal broth and a long, slow speech about whose mountain this is. They go down the pass in their shirts. The furs pay for the hall's ale for a year.",
            fx: {coin:20,honor:2},
          },
          {
            t: "Let them keep half, if they carry a message south",
            check: {s:"diplomacy",s2:"trade",d:40},
            win: {
              r: "The message reaches the Ostmir fair. Next year a Velgradan factor comes north to buy furs properly.",
              fx: {coin:10,skill:{diplomacy:2,trade:1}},
            },
            lose: {r:"They take their half and the message goes nowhere.",fx:{coin:5}},
          },
          {
            t: "Take the furs and do not feed them",
            r: "The custom says feed them. You do not. Two of them make it down. The hall is quiet when you tell them.",
            fx: {coin:25,honor:-5,trait:"cruel"},
          },
        ],
      },
      {
        id: "pp_gi_beacon",
        title: "A sail without lights",
        cond: (p,C)=>giHall(p)&&C.adult(p),
        w: .9,
        cool: 10,
        text: "Your turn on the watch, in pairs, as always. Out on the black water a boat without lights is rowing for the open sea. Smugglers taking tin, or tribute-folk running for the south with everything they own. From the cliff you could sink it with a stone.",
        choices: [
          {
            t: "Light the beacon",
            r: "The fire goes up. The boat is stopped at dawn by a patrol: a family of six and a sack of tin. You do not watch what happens to them.",
            fx: {honor:1,favor:3,happy:-2},
          },
          {
            t: "Throw a stone across its bow, as a warning",
            check: {s:"throwing",s2:"ins",d:44},
            win: {
              r: "The stone lands three oar-lengths ahead in a tower of spray. The boat turns back to shore. Nobody is hurt, and everyone knows.",
              fx: {skill:{throwing:3},honor:2},
            },
            lose: {
              r: "The stone lands too close. The boat capsizes. You and your pair-mate wade in to the neck to pull them out.",
              fx: {health:-5,honor:2,wil:1.5},
            },
          },
          {
            t: "Watch it go, and say nothing",
            check: {s:"deception",s2:"wil",d:36},
            win: {
              r: "Your pair-mate looks at you. You look at the sea. Neither of you ever mentions it.",
              fx: {trait:"kind",honor:-1},
            },
            lose: {r:"Your pair-mate lights the beacon. Now there is a thing between you.",fx:{happy:-3}},
          },
        ],
      },
      {
        id: "pp_gi_skarfell",
        title: "Small for a giant",
        cond: (p,C)=>C.race(p,"giant")&&C.blood(p,"skarfell")&&C.ageAdj(p)>=10,
        w: 1.3,
        cool: 10,
        text: "You are of the Skarfell line: small for a giant, three times a human's strength instead of five, always cold under twice the furs. The big Haugberg giants laugh at you at every gathering. But a small Skarfell can do what no other giant can: run. Word must go to the chieftain, at once, across the island.",
        choices: [
          {
            t: "Run it, as the Skarfell Runners do",
            check: {s:"athletics",s2:"sta",d:42},
            win: {
              r: "Across the island in a day and a night. The chieftain has the word before any human boat could carry it. Nobody laughs at your size that winter.",
              fx: {skill:{athletics:4},sta:.6,fame:3},
            },
            lose: {
              r: "The cold gets into you on the high moor and you have to stop at a human village to thaw.",
              fx: {wound:"frostbite",wil:1.5},
            },
          },
          {
            t: "Answer the Haugberg laughter with a joke",
            check: {s:"persuasion",s2:"int",d:38},
            win: {
              r: '"At least I can get through your door." The hall roars. Even Haugberg laughs, which they rarely do.',
              fx: {trait:"witty",fame:1,happy:3},
            },
            lose: {r:"The joke falls flat on the floor of the hall.",fx:{happy:-2}},
          },
          {
            t: "Wear the furs and keep your counsel",
            r: "Skarvi the Small founded the chieftains' line. Size is not everything. You think it, and say nothing.",
            fx: {wil:1,trait:"patient"},
          },
        ],
      },
      {
        id: "pp_gi_jotun",
        title: "A giant among giants",
        cond: (p,C)=>C.race(p,"giant")&&C.blood(p,"jotun")&&C.adult(p),
        w: 1.3,
        cool: 10,
        text: "You are of the Jotunhall line, a giant among giants, and you eat thirty thousand a day, more than a human household of five. The price is knees and hips that fail by forty and a heart that fails by sixty. The Walking Halls say Hrimfell needs a king who can walk to the shore. You are starting to feel your knees.",
        choices: [
          {
            t: "Walk to the shore every day, to show you can",
            check: {s:"wil",s2:"sta",d:46},
            win: {r:"Every morning, in front of everyone. It hurts. It is noticed.",fx:{wil:2,fame:1,honor:2}},
            lose: {r:"In the third month your hip goes on the shingle.",fx:{wound:"limp",health:-12,wil:2}},
          },
          {
            t: "Eat less, and grow less",
            check: {s:"wil",s2:"int",d:44},
            win: {
              r: "Hungry all winter, every winter. The knees ease a little. The hall thinks you are sick.",
              fx: {health:6,trait:"temperate",wil:1.5},
            },
            lose: {r:"The hunger wins. It always does, in your blood.",fx:{trait:"gluttonous"}},
          },
          {
            t: "Accept it, and learn the sledge",
            r: "Hraldr ruled from a sledge. So can anyone, if the halls agree. You start learning the names of every human hunter who might drag one.",
            fx: {skill:{diplomacy:2},wil:1},
          },
        ],
      },
      {
        id: "pp_gi_blizzard",
        title: "Lost in the white",
        cond: (p,C)=>giHall(p)&&C.ageAdj(p)>=14,
        w: 1,
        cool: 10,
        setup: (p,ctx)=>{ctx.kid=humanName(p)},
        text: "A blizzard that would kill a human in an hour, and you are comfortable in it. Below the hall a mother is screaming: {kid}, her boy, went out to check the seal-nets before it hit and has not come back. No human can go out in this. A giant can.",
        choices: [
          {
            t: "Go out and find him",
            check: {s:"tracking",s2:"survival",d:42},
            win: {
              r: "You find him curled in a snowdrift by the nets, nearly gone, and carry him back inside your coat against your chest. He lives. His mother kisses your hand.",
              fx: {honor:5,fame:2,skill:{tracking:2},newRel:{type:"friend",op:30}},
            },
            lose: {r:"You find him at dawn. Too late. You carry him home anyway.",fx:{wil:2.5,happy:-8,honor:2}},
          },
          {
            t: "Rope yourself to the hall and walk the shore in circles",
            check: {s:"sta",s2:"int",d:38},
            win: {
              r: "Slow, careful, and you never lose the rope. The boy is at the end of the third circle.",
              fx: {honor:4,int:.3},
            },
            lose: {
              r: "Hours in the white and nothing. The boy walks into a fisher's hut at dawn on his own, by luck.",
              fx: {wil:1},
            },
          },
          {
            t: "Bang the hall's great drum so he can follow the sound",
            r: "Boom, boom, for hours. Near midnight a small frozen shape stumbles out of the white toward the sound. You keep drumming long after, just in case.",
            fx: {honor:3,skill:{music:1}},
          },
        ],
      },
      {
        id: "pp_gi_grom",
        title: "A whale on the far ice",
        cond: (p,C)=>giHall(p)&&C.adult(p)&&!C.old(p),
        w: .9,
        cool: 15,
        text: 'Human hunters bring word: a dead whale is frozen into the sea ice, twenty kilometres out. The halls still sing of Grom, who in the Famine Winter dragged a frozen whale twenty kilometres over four days and fed three halls. "Slow, slow, the ice is wide."',
        choices: [
          {
            t: "Go out with your pair-mate and drag it home",
            check: {s:"str",s2:"sta",d:52},
            win: {
              r: "Four days on the ice, the rope cutting your shoulders, the humans singing Grom's Whale beside you. The hall eats till spring and adds a verse.",
              fx: {str:.8,sta:.6,fame:4,honor:4,epithet:"Whale-Dragger"},
            },
            lose: {
              r: "On the second day the ice opens. You let the rope go, and the whale goes down to the Mother. You come home with nothing but your life.",
              fx: {wil:2.5,health:-10,cause:"the sea ice"},
            },
          },
          {
            t: "Cut it up where it lies and sled it home in pieces",
            check: {s:"survival",s2:"command",d:42},
            win: {
              r: "Twenty sleds, forty humans, a week of work. Less glory than Grom. Just as fed.",
              fx: {skill:{survival:2,command:2},honor:3,coin:15},
            },
            lose: {r:"A storm comes in and you get a third of it home.",fx:{coin:5,wil:1}},
          },
          {
            t: "Leave it. The ice is too thin this year",
            r: "The young ones call it fear. The old ones say it is how a giant lives to be old.",
            fx: {trait:"cautious"},
          },
        ],
      },
      {
        id: "pp_gi_ale",
        title: "Northreach ale",
        cond: (p,C)=>giHall(p)&&C.adult(p),
        w: .9,
        cool: 10,
        text: "A Northreach crew in from the tin run bets a whole cask of ale that their bosun can drink more than a giant. The bosun is enormous, for a human. The whole shore has gathered, and the tribute-folk are betting their winter boots.",
        choices: [
          {
            t: "Drink the cask",
            check: {s:"sta",s2:"wil",d:30},
            win: {
              r: "The bosun is under the table by the second jug. You finish the cask, sing the lineage of your hall, and fall asleep on the beach like a beached whale. The tribute-folk win their boots.",
              fx: {fame:2,happy:6,coin:5},
            },
            lose: {
              r: "Northreach ale is stronger than you thought. You win, and are sick in the sea for an hour in front of everyone.",
              fx: {happy:2,health:-3},
            },
          },
          {
            t: "Arm-wrestle the bosun instead",
            check: {s:"str",s2:"unarmed",d:20},
            win: {
              r: "You use one finger. The crew howls. The bosun takes it well and buys the first round.",
              fx: {fame:1,happy:4,newRel:{type:"friend",op:20}},
            },
            lose: {
              r: "You hold back too much and he slips out. A draw, everyone agrees, out of kindness.",
              fx: {happy:2},
            },
          },
          {
            t: "Decline. You know what ale does to giants",
            r: "Somebody has to carry the drunk humans home afterward. That is you, four at a time.",
            fx: {trait:"temperate",honor:1},
          },
        ],
      },
      {
        id: "pp_gi_roof",
        title: "Raising the roof-tree",
        cond: (p,C)=>giHall(p)&&C.adult(p)&&!C.old(p),
        w: .9,
        cool: 15,
        text: "The hall's great roof-tree, sixty metres of timber, has rotted at one end, and a new one has been hauled from the valleys by Haugberg's mammoths. Raising it takes every giant of the hall, ropes, and a hundred humans on the guy-lines. You take the end that matters.",
        choices: [
          {
            t: "Take the weight on your shoulders",
            check: {s:"str",s2:"sta",d:48},
            win: {
              r: "It goes up on your count, and settles into its notch with a boom that shakes the turf huts. They carve your name on it.",
              fx: {str:.6,fame:2,honor:3},
            },
            lose: {
              r: "It slips. You hold it, barely, while the others recover, and your back is never quite right again.",
              fx: {wound:"back",honor:3,wil:1.5},
            },
          },
          {
            t: "Run the guy-lines with the humans",
            check: {s:"command",s2:"int",d:40},
            win: {
              r: "A hundred humans and twelve giants pulling as one. Nobody is crushed, which is the real triumph.",
              fx: {skill:{command:3},honor:2},
            },
            lose: {
              r: "A line goes slack at the wrong moment and two humans are thrown. Broken arms, nothing worse.",
              fx: {wil:1,happy:-2},
            },
          },
          {
            t: "Chant the work-song for the lift",
            check: {s:"music",s2:"wil",d:36},
            win: {
              r: "Slow, slow. Every hand and shoulder moves on the beat. The roof-tree rises as if it wanted to.",
              fx: {skill:{music:3},happy:3},
            },
            lose: {r:"You start too fast, and the lift goes ragged.",fx:{happy:-1}},
          },
        ],
      },
      {
        id: "pp_gi_teen",
        title: "The human children grew up",
        cond: (p,C)=>C.race(p,"giant")&&C.teen(p)&&inR(p,GIR),
        w: 1.3,
        once: !0,
        setup: (p,ctx)=>{ctx.hf=humanName(p)},
        text: `You are twenty-two, still years from being grown, and you have finally stopped breaking the hall's benches. {hf}, the human child who rode on your shoulders when you were both small, is a grandparent now, grey and stooped, and still calls you "little one".`,
        choices: [
          {
            t: "Carry {hf} on your shoulders, one more time",
            r: "Up the cape to see the walrus, as when you were children. {hf} laughs the whole way, and cries a little at the top.",
            fx: {happy:5,wil:1,newRel:{type:"friend",op:30}},
          },
          {
            t: "Ask {hf} what the humans say about the giants",
            check: {s:"diplomacy",s2:"int",d:26},
            win: {
              r: "Honestly, as an old friend: the young hunters want a seat at the Thing, and some talk of leaving. You carry it up to the hall like a stone.",
              fx: {int:.4,skill:{diplomacy:2}},
            },
            lose: {r:"{hf} only smiles and says everyone is well. Humans protect you, too, in their way.",fx:{}},
          },
          {
            t: "Throw stones at the Stone Ring until dark",
            r: "Easier than thinking about it. Your arm grows. Your heart does what it does.",
            fx: {skill:{throwing:2},str:.3},
          },
        ],
      },
      {
        id: "pp_gi_seal",
        title: "Thin ice",
        cond: (p,C)=>giHall(p)&&C.adult(p),
        w: .9,
        cool: 8,
        text: "Seal hunting on the spring ice with the human harpooners. They walk where they like. You weigh as much as twenty of them, and the ice is grey and soft at the edges. A big bearded seal is up on a floe fifty paces out. The humans look back at you to see what you will do.",
        choices: [
          {
            t: "Crawl out on your belly to spread the weight",
            check: {s:"ins",s2:"survival",d:44},
            win: {
              r: "The ice creaks and holds. You reach the floe and club the seal before it can slide off. The humans cheer a giant on its belly.",
              fx: {skill:{survival:3},coin:8,happy:3},
            },
            lose: {
              r: "The ice gives. You are in the sea up to the neck, and it takes all the humans on a rope to get you out.",
              fx: {health:-10,wil:1.5,cause:"the spring ice"},
            },
          },
          {
            t: "Throw the harpoon from the thick ice",
            check: {s:"throwing",s2:"ins",d:46},
            win: {
              r: "Fifty paces, and the harpoon goes home. You haul the seal in on the line like a fish.",
              fx: {skill:{throwing:3},coin:8},
            },
            lose: {
              r: "The seal slides into the water with your harpoon. The humans pretend not to laugh.",
              fx: {coin:-3},
            },
          },
          {
            t: "Let the humans take it, and hold the line",
            r: "They take it in five minutes. You haul it back over the ice with one hand. Giants and humans, each doing what they do.",
            fx: {coin:5,honor:1},
          },
        ],
      },
      {
        id: "pp_he_twolaws",
        title: "Grown, and not grown",
        cond: (p,C)=>C.race(p,"halfelf")&&C.age(p)>=20&&C.age(p)<40&&!C.married(p),
        w: 1.2,
        cool: 15,
        setup: (p,ctx)=>{setPid(p,ctx,"human",{frac:1.4,occ:"a young human of the town",sex:p.flags.likes||(p.sex==="M"?"F":"M")}),ctx.tOcc=A.pick(["a miller's child","a young carter","a weaver's apprentice"])},
        text: 'Human law says you were grown at twenty. Elven law says you will be grown at forty. {themFull}, {tOcc}, wants to marry you this spring. Your human kin are delighted. Your elven grandmother says, "Wait twenty years and see if you still want it." In twenty years {them} will be middle-aged.',
        choices: [
          {
            t: "Marry {themHim} this spring",
            r: "A human wedding, quick and loud. Your grandmother comes, sits at the back and says nothing, and dances once, beautifully, with the oldest human at the feast.",
            fx: fx2({them:{type:"lover",op:50},happy:6}, (p,ctx)=>{const t=A.P(ctx.pid);return t&&t.alive&&!(p.spouse&&A.P(p.spouse)&&A.P(p.spouse).alive)?(A.marry(p,t),`(You marry ${t.given}.)`):""}),
          },
          {
            t: "Wait, as your grandmother asks",
            r: "You wait. {them} waits three years, then marries a baker. You still have forty years of youth ahead. It does not feel like a gift.",
            fx: {wil:2,happy:-5,trait:"patient"},
          },
          {
            t: "Ask your grandmother why she married a human, then",
            check: {s:"diplomacy",s2:"int",d:34},
            win: {
              r: 'A long silence. "Because I did not wait," she says. "And I would not change it." She gives you her blessing, and a ring from a man sixty years dead.',
              fx: {happy:4,int:.3,them:{type:"lover",op:40}},
            },
            lose: {
              r: '"That is not your business," she says, and does not speak to you until Leaf Fall.',
              fx: {happy:-3},
            },
          },
        ],
      },
      {
        id: "pp_he_envoy",
        title: "Between two tongues",
        cond: (p,C)=>C.race(p,"halfelf")&&C.adult(p)&&!C.flag(p,"pp_he_envoy"),
        w: 1,
        once: !0,
        setup: (p,ctx)=>{ctx.lord=A.pick(["a lord of the forest march","an Ashmere bowyers' factor","an Aldmark border count","a Lucernan trading house"]),ctx.Lord=A.cap(ctx.lord)},
        text: "{Lord} needs someone to speak to the elves at the edge-fairs: someone with an elven ear and a human patience, which is to say no patience at all. In human lands half-elves are admired and mistrusted in equal measure, and many serve as envoys and interpreters. The pay is good. The work is lying politely in two languages.",
        choices: [
          {
            t: "Take the post",
            check: {s:"diplomacy",s2:"learning",d:42},
            win: {
              r: "Your first negotiation at the stones goes well enough that the elves ask for you by name. That has never happened to a human envoy.",
              fx: {flag:"pp_he_envoy",coin:30,skill:{diplomacy:4,etiquette:2},lang:"Sylvari",fame:1},
            },
            lose: {
              r: "You translate a Keeper's joke literally, and the lord takes offence. You keep the post, on probation.",
              fx: {flag:"pp_he_envoy",coin:10,skill:{diplomacy:2},lang:"Sylvari"},
            },
          },
          {
            t: "Take it, and quietly serve the elves too",
            check: {s:"intrigue",s2:"deception",d:48},
            win: {
              r: "You tell each side what the other means instead of what it says. Both trust you, wrongly and rightly. You are paid twice.",
              fx: {flag:"pp_he_envoy",coin:45,skill:{intrigue:3,diplomacy:2},honor:-2},
            },
            lose: {
              r: "The lord's steward reads one of your letters. You are dismissed, and the elves do not want you either.",
              fx: {honor:-6,happy:-4},
            },
          },
          {
            t: "Refuse. You will not be a bridge people walk on",
            r: "The lord hires a half-elf from the next town. You go on being simply yourself, which is harder than it sounds.",
            fx: {wil:1,trait:"stubborn"},
          },
        ],
      },
      {
        id: "pp_he_priest",
        title: "Never a bishop",
        cond: (p,C)=>C.race(p,"halfelf")&&C.adult(p)&&!C.faith(p,"REL-04")&&(C.job(p,"clergy")||p.piety>=55),
        w: 1,
        cool: 20,
        text: "You have served the faith longer and better than anyone in the chapter, and everyone knows it. When the senior seat falls vacant it goes to a human of thirty-two, the dean's nephew. The rule is not written anywhere you can find, but it is older than you: the Holy See will not raise a half-elf to the high priesthood.",
        choices: [
          {
            t: "Serve under him, and serve well",
            r: "He leans on you for everything. In ten years the chapter runs on your word, whoever wears the ring.",
            fx: {piety:4,honor:3,wil:1.5,trait:"humble"},
          },
          {
            t: "Petition the Holy See itself",
            check: {s:"learning",s2:"persuasion",d:54},
            win: {
              r: "A year later a letter comes: not the seat, but a dispensation to preach anywhere in the province. It is the first ever granted. People come from three towns to hear you.",
              fx: {fame:3,piety:3,skill:{learning:3,persuasion:2}},
            },
            lose: {r:"The petition comes back unopened, with a note about humility.",fx:{wil:2,happy:-5}},
          },
          {
            t: "Leave the chapter",
            r: "You walk out with a satchel and your faith, which nobody can take. A village with no priest is glad of you.",
            fx: {piety:2,happy:2,trait:"stubborn"},
          },
        ],
      },
      {
        id: "pp_he_noland",
        title: "The garden you cannot own",
        cond: (p,C)=>C.realm(p,"POL-06")&&C.race(p,"halfelf")&&C.age(p)>=50,
        w: 1,
        once: !0,
        setup: (p,ctx)=>{ctx.cousin=nm(p)},
        text: "For forty years you have tended the hazel and bramble gardens below your elven mother's grove-house. In Sylvaran a half-elf may live in the forest but may not own land or sit in the Moot. Your mother has gone to her tree, and the Keepers say the garden passes to your elven cousin {cousin}, who has never pruned a hazel in a hundred years of life.",
        choices: [
          {
            t: "Ask {cousin} to let you keep tending it",
            check: {s:"diplomacy",s2:"wil",d:40},
            win: {
              r: "{cousin} is relieved, frankly, and grants you the tending for life. It is not ownership. It is the garden, which is what you wanted.",
              fx: {happy:4,skill:{diplomacy:2,husbandry:2}},
            },
            lose: {r:"{cousin} has plans for it. You are thanked for your work.",fx:{happy:-6,wil:2}},
          },
          {
            t: "Take your case to the Moot",
            check: {s:"persuasion",s2:"learning",d:58},
            win: {
              r: 'You cannot speak in the Moot, but an old Keeper speaks for you. After nine years it grants you the tending, "in light of the work". A crack in a very old wall.',
              fx: {fame:2,honor:3,wil:1.5,happy:3},
            },
            lose: {
              r: "Nine years later the Moot declines to consider it. The cousin has dug up half the hazels for a bee-yard.",
              fx: {wil:2.5,happy:-6},
            },
          },
          {
            t: "Leave the forest for Eldergrove, where you are a citizen",
            r: "You walk west to the sea-elves, who let a half-elf own land and sail ships. The hazels you leave behind will outlive you anyway.",
            fx: {flag:"pp_he_westward",happy:2,wil:1.5,trait:"stubborn"},
          },
        ],
      },
      {
        id: "pp_he_burial",
        title: "Where to bury them",
        cond: (p,C)=>C.race(p,"halfelf")&&C.adult(p)&&C.age(p)<=90,
        w: .9,
        once: !0,
        setup: (p,ctx)=>{ctx.par=A.chance(.5)?"father":"mother"},
        text: "Your human {par} has died, old and white-haired, while your elven parent looks barely older than you. Human custom wants a grave in the churchyard. Elven custom wants a sapling over the body, and a human in Sylvaran is buried outside the Oak Line like a stranger. Both families are in the room, waiting for you to say.",
        choices: [
          {
            t: "The churchyard, with the human kin",
            r: "A stone, a priest, the human prayers. Your elven parent stands at the back of the church and is the last to leave the grave.",
            fx: {piety:2,happy:-3,wil:1.5},
          },
          {
            t: "A sapling, at the edge of the forest",
            r: "An oak just outside the line, where both families can come. In three hundred years it will be enormous. You will still be alive to see some of that.",
            fx: {piety:2,wil:2,happy:-2},
          },
          {
            t: "Ask your elven parent what they want",
            check: {s:"diplomacy",s2:"wil",d:36},
            win: {
              r: '"Bury my love where my love wanted," your parent says. "I will plant a tree beside it." There is a churchyard in {home} now with an oak in it.',
              fx: {happy:2,wil:2,honor:2},
            },
            lose: {
              r: 'Your elven parent only says, "I will remember either way." It does not help.',
              fx: {wil:1.5,happy:-3},
            },
          },
        ],
      },
      {
        id: "pp_he_thalion",
        title: "The half-elf heir",
        cond: (p,C)=>early()&&C.race(p,"halfelf")&&C.adult(p)&&C.realm(p,"POL-06","POL-07","POL-05","POL-01"),
        w: 1.1,
        once: !0,
        text: "Every half-elf you know is talking about Thalion Halfleaf: Queen Ithrien's only grandchild, half human, heir to a crown that elven law says no half-elf may wear. The Moot of Leaves votes at Leaf Fall. Someone is collecting the marks of half-elves to send to the Moot, saying: we are watching.",
        choices: [
          {
            t: "Make your mark",
            r: "Your mark goes on a long roll, with thousands of others. The Moot will not count it. It will see it.",
            fx: {flag:"pp_he_thalion",honor:2,happy:2},
          },
          {
            t: "Refuse. You will not be counted by anyone",
            r: "You have spent your whole life being sorted into one side or another. Not this time.",
            fx: {wil:1,trait:"stubborn"},
          },
          {
            t: "Find out what Thalion himself wants",
            check: {s:"intrigue",s2:"diplomacy",d:46},
            win: {
              r: "An Eldergrove sailor who knows him says it simply: Thalion does not want the crown. He wants to be left alone with his bow. You understand him better than any elf could.",
              fx: {skill:{intrigue:2},int:.4,wil:1},
            },
            lose: {r:"Nobody who knows will say.",fx:{}},
          },
        ],
      },
      {
        id: "pp_he_citizen",
        title: "A citizen of the coast",
        cond: (p,C)=>C.realm(p,"POL-07")&&C.race(p,"halfelf")&&C.adult(p),
        w: 1,
        cool: 15,
        text: 'In Eldergrove a half-elf is a full citizen: you may own land, hold ship-shares and stand in the ship-houses like anyone. On the quay at {home} an elf trader from Sylvaran, inland-pale and haughty, looks at your ears and your human jaw and says to his companion, in Sylvari, "They let them vote here."',
        choices: [
          {
            t: "Answer him in perfect Sylvari",
            check: {s:"persuasion",s2:"wil",d:38},
            win: {
              r: '"We also let them sail, own ships and buy your honey. How much is it?" The quay laughs. He sells to you at a loss, to get away.',
              fx: {coin:8,fame:1,happy:4,skill:{persuasion:2}},
            },
            lose: {
              r: "Your Sylvari comes out with a sea accent, and he smiles thinly. You have made his point for him.",
              fx: {happy:-3},
            },
          },
          {
            t: "Buy a ship-share in front of him",
            req: p=>p.coin>=30,
            r: "Thirty suns at the ship-house, in full view. The shipmaster shakes your hand. The Sylvaran trader looks away first.",
            fx: {coin:-30,honor:2,happy:4,flag:"pp_he_share"},
          },
          {
            t: "Ignore him. He is a guest here",
            r: "The Sea Covenant of 340 was about exactly this, the old ones say. The sea does not care what your ears look like.",
            fx: {trait:"calm"},
          },
        ],
      },
      {
        id: "pp_he_parents",
        title: "One parent ages",
        cond: (p,C)=>C.race(p,"halfelf")&&C.ageAdj(p)>=14&&C.age(p)<=60&&C.parentsAlive(p),
        w: 1,
        once: !0,
        text: 'Your human parent is grey now, and slow on the stairs. Your elven parent looks exactly as on your first birthday. One evening the human one takes you aside: "When I am gone, look after them. They will grieve for a generation, and they will not let anyone see it."',
        choices: [
          {
            t: "Promise",
            r: "You promise. Your elven parent, listening from the next room, says nothing, and that night sings without words until dawn.",
            fx: {wil:1.5,honor:2,happy:-2},
          },
          {
            t: "Ask your elven parent how they bear it",
            check: {s:"diplomacy",s2:"int",d:36},
            win: {
              r: '"I chose it," says your elven parent. "I knew. I chose it anyway. You were part of the choosing." You do not cry until you are alone.',
              fx: {wil:2,int:.3,happy:1},
            },
            lose: {
              r: '"Vael, vael," says your elven parent. Slowly. You do not understand until much later.',
              fx: {wil:1},
            },
          },
          {
            t: "Take your human parent on the journey they always wanted",
            req: p=>p.coin>=20,
            r: "The sea, finally, at seventy-one. Your parent stands in the surf like a child. Your elven parent watches you both from the dunes and smiles.",
            fx: {coin:-20,happy:6,honor:2},
          },
        ],
      },
      {
        id: "pp_he_fertility",
        title: "No child yet",
        cond: (p,C)=>C.race(p,"halfelf")&&C.adult(p)&&C.married(p)&&!C.hasKids(p),
        w: 1,
        once: !0,
        text: "Years of marriage, and no child. Half-elves are fertile with humans and elves alike, but rarely: one child, two at most, in a long life. Your human mother-in-law prays loudly at every feast. Your elven grandmother says that a century is a short time to wait. Your spouse says nothing, which is worse.",
        choices: [
          {
            t: "Go to an elven healer at the forest edge",
            check: {s:"medicine",s2:"diplomacy",d:44},
            win: {
              r: "Honey, herbs, patience and a list of things not to eat. Within two years there is a child. Coincidence, the human priest says.",
              fx: {happy:8,skill:{medicine:1}},
            },
            lose: {
              r: 'The healer is kind and can do nothing. "Wait," she says. Elves always say wait.',
              fx: {happy:-3,wil:1.5},
            },
          },
          {
            t: "Make peace with it, together",
            r: "You stop counting the months. You teach your nieces and nephews the bow and the songs of both sides. It is a family, of a kind.",
            fx: {wil:2,happy:2,trait:"content"},
          },
          {
            t: "Ask the human priest for a blessing",
            check: {s:"faith",s2:"persuasion",d:40},
            win: {
              r: "He blesses you both at the altar, and does not mention your ears once. That alone is a kind of miracle.",
              fx: {piety:4,happy:3},
            },
            lose: {r:"He hesitates over the blessing, and everyone sees him hesitate.",fx:{piety:-2,happy:-4}},
          },
        ],
      },
      {
        id: "pp_he_mob",
        title: '"Elf-blood"',
        cond: (p,C)=>C.race(p,"halfelf")&&C.adult(p)&&!inR(p,ELFR),
        w: 1,
        cool: 12,
        setup: (p,ctx)=>{ctx.news=A.pick(["elven rangers shot three loggers at the Oak Line","the elves closed the edge-fair and the honey price has doubled","an elf archer killed a Kingsmere knight in a border quarrel"])},
        text: 'Word comes to {home} that {news}. By evening a crowd of drinkers outside the alehouse has found the nearest thing to an elf in town: you. "Elf-blood," somebody says, and somebody else picks up a cobblestone.',
        choices: [
          {
            t: "Face them and talk",
            check: {s:"persuasion",s2:"wil",d:44},
            win: {
              r: '"My father is a cooper of this town. I have never seen the Oak Line. Who wants to throw first?" Nobody does. The crowd breaks up muttering.',
              fx: {skill:{persuasion:3},wil:1.5,honor:2},
            },
            lose: {
              r: "The first stone opens your eyebrow. Your neighbors pull you inside.",
              fx: {health:-10,wound:"scar_face",wil:2,cause:"a mob"},
            },
          },
          {
            t: "Slip away through the back lanes",
            check: {s:"stealth",s2:"spd",d:36},
            win: {
              r: "Elven ears hear them coming two streets off. You are home with the door barred before they find the lane.",
              fx: {skill:{stealth:2}},
            },
            lose: {r:"They catch you at the bridge.",fx:{health:-12,wil:1.5,cause:"a mob"}},
          },
          {
            t: "Stand in the doorway of the church",
            r: "They will not stone you on holy ground. The priest stands with you until midnight, and you both pretend it is a conversation about the weather.",
            fx: {piety:2,wil:1,newRel:{type:"friend",op:20}},
          },
        ],
      },
      {
        id: "pp_he_ears",
        title: "Across a crowded room",
        cond: (p,C)=>C.race(p,"halfelf")&&C.adult(p),
        w: 1,
        cool: 10,
        setup: (p,ctx)=>{ctx.plot=A.pick(["rob the toll-house on the north road on Sunday night","poison the miller's new mastiff before they break in","sell a stolen horse to the reeve's own brother","set fire to a rival's warehouse at the turn of the tide"])},
        text: "Half-elves hear sounds a human would miss. In a loud alehouse in {home}, across the whole room and under the singing, two men are whispering a plan to {plot}. They have no idea you can hear every word.",
        choices: [
          {
            t: "Go to the reeve with it",
            r: "The reeve is skeptical until Sunday night proves you right. After that he buys you a drink whenever he sees you, and watches your ears warily.",
            fx: {honor:3,favor:2,coin:5},
          },
          {
            t: "Let them know you heard",
            check: {s:"intimidation",s2:"ins",d:42},
            win: {
              r: "You walk over and repeat their plan back to them, word for word, softly. They leave town that night.",
              fx: {skill:{intimidation:2},fame:1},
            },
            lose: {
              r: "They take it badly.",
              fx: {
                duel: {
                  tier: 1,
                  title: "a cornered thief",
                  opts: {kind:"brawl",place:"the alehouse yard",lethal:!1,toYield:!0,title:"Big ears"},
                },
              },
            },
          },
          {
            t: "Sell the plan to the victim",
            check: {s:"intrigue",s2:"trade",d:40},
            win: {
              r: "The intended victim pays you ten suns, and the thieves walk into a trap.",
              fx: {coin:10,skill:{intrigue:2}},
            },
            lose: {r:"The victim thinks you are part of it and calls the watch on you.",fx:{honor:-3,coin:-5}},
          },
        ],
      },
      {
        id: "pp_he_passing",
        title: "A hood over the ears",
        cond: (p,C)=>C.race(p,"halfelf")&&C.adult(p)&&!inR(p,ELFR)&&!C.flag(p,"pp_he_passing"),
        w: .9,
        once: !0,
        setup: (p,ctx)=>{ctx.post=A.pick(["a clerk's post in the town treasury","a place in the city guard","a mastership in the weavers' guild","a marriage into a merchant family"]),ctx.Post=A.cap(ctx.post)},
        text: "{Post} is open, and the people who decide have made clear, without ever saying it, that they want a human. With your hair worn long, a hood in bad weather and a little care about how you hear things, you could be one. Plenty of half-elves do it.",
        choices: [
          {
            t: "Pass. Wear the hood",
            check: {s:"deception",s2:"wil",d:40},
            win: {
              r: "You get it. Nobody looks twice. Every morning you check your hair in the water barrel before you go out.",
              fx: {flag:"pp_he_passing",coin:20,skill:{deception:3},happy:-2},
            },
            lose: {
              r: "The wind takes your hood at the worst moment. You do not get it, and now everyone knows you tried.",
              fx: {honor:-3,happy:-5,wil:1.5},
            },
          },
          {
            t: "Apply openly, ears and all",
            check: {s:"persuasion",s2:"learning",d:50},
            win: {
              r: "You are so plainly the best that they cannot refuse you without looking foolish. They hate it. You do the work.",
              fx: {coin:20,honor:3,fame:1,wil:1},
            },
            lose: {r:"It goes to a human with half your skill. You knew it would.",fx:{wil:2,happy:-4}},
          },
          {
            t: "Let it go",
            r: "There will be other posts. You are going to live a hundred and fifty years; you can outwait a good many committees.",
            fx: {trait:"patient",wil:.5},
          },
        ],
      },
      {
        id: "pp_he_found",
        title: "Found out",
        cond: (p,C)=>C.race(p,"halfelf")&&C.adult(p)&&C.flag(p,"pp_he_passing"),
        w: 1.4,
        once: !0,
        text: "Years of passing, and it ends with a sneeze. You put your hand up, your hair falls back, and the person across the table is looking straight at the tip of a pointed ear. Then at your face. Then at the door.",
        choices: [
          {
            t: 'Say it out loud: "Yes. Half."',
            check: {s:"wil",s2:"persuasion",d:42},
            win: {
              r: 'There is a long, strange silence. Then: "Well, you are still the best clerk we have." It spreads, and nothing much changes. You stop checking the water barrel.',
              fx: {unflag:"pp_he_passing",wil:2,happy:6,honor:2},
            },
            lose: {
              r: 'Within a month you are out, for "dishonesty". It is the hiding they cannot forgive, they say. It was never the hiding.',
              fx: {unflag:"pp_he_passing",coin:-20,wil:2.5,happy:-6},
            },
          },
          {
            t: "Pay for silence",
            req: p=>p.coin>=15,
            r: "Fifteen suns. And next year, fifteen more. You are passing now and paying for it.",
            fx: {coin:-15,honor:-2,wil:1},
          },
          {
            t: "Laugh it off as a childhood injury",
            check: {s:"deception",s2:"int",d:48},
            win: {
              r: '"A dog bit it when I was five." They laugh. You do not sleep for a week.',
              fx: {skill:{deception:2},wil:1},
            },
            lose: {
              r: "Nobody believes it, and now you are a liar as well.",
              fx: {unflag:"pp_he_passing",honor:-4,happy:-5},
            },
          },
        ],
      },
      {
        id: "pp_he_name",
        title: "Whose name",
        cond: (p,C)=>C.race(p,"halfelf")&&C.adult(p)&&C.hasKids(p),
        w: 1,
        once: !0,
        setup: (p,ctx)=>{ctx.ln=A.pick(["Evenleaf","Starbough","Mistbrook","Driftleaf","Saltbough","Yewheart"])},
        text: "Your child must be written in the parish book, and the clerk wants a surname. Your elven line name, {ln}, comes from a birth tree you were never given. Your human name is your other parent's family's. The clerk is waiting, quill dripping.",
        choices: [
          {
            t: "The elven line: {ln}",
            r: "The clerk writes it slowly, mouthing the letters. One day the child will ask why, and you will tell them about a grandmother in a tree-house.",
            fx: {happy:3,piety:1},
          },
          {
            t: "The human name, plain and easy",
            r: "One less thing for the child to explain in the schoolyard. Your elven kin say nothing. They will outlive the name anyway.",
            fx: {happy:1,trait:"humble"},
          },
          {
            t: "Both, joined",
            r: "The clerk runs out of room on the line and writes it up the margin. The child will have the longest name in the parish and be proud of it.",
            fx: {happy:4,trait:"stubborn"},
          },
        ],
      },
      {
        id: "pp_he_outlive",
        title: "Grandchildren older than you",
        cond: (p,C)=>C.race(p,"halfelf")&&C.age(p)>=90,
        w: 1.2,
        once: !0,
        text: 'You are past ninety, and look perhaps thirty-five. Your human spouse is long gone, and most of your friends. Your grandson has a grey beard and calls you "mother" or "father" in the market when he forgets, and the market stares. You will live another century, perhaps. Nobody you started with will.',
        choices: [
          {
            t: "Go to the elves, who will still be there",
            r: "You spend a decade at the forest edge, with kin who remember your childhood as last week. It helps more than you expected.",
            fx: {happy:4,wil:1.5,lang:"Sylvari"},
          },
          {
            t: "Stay, and be the family's long memory",
            r: "Five generations at one table at the harvest feast, and only you remember all of them. You start writing it down.",
            fx: {skill:{learning:3},honor:3,happy:2},
          },
          {
            t: "Start again somewhere new",
            check: {s:"wil",s2:"persuasion",d:40},
            win: {
              r: "A new town, a new trade, new friends who think you are thirty-five. For a while, you are.",
              fx: {happy:5,wil:1.5},
            },
            lose: {r:"It is the same everywhere. You are always the one who stays.",fx:{wil:2,happy:-3}},
          },
        ],
      },
      {
        id: "pp_he_gift",
        title: "A gift from the forest",
        cond: (p,C)=>C.race(p,"halfelf")&&C.age(p)>=20&&C.age(p)<=30&&!inR(p,ELFR),
        w: 1.2,
        once: !0,
        text: 'On your twentieth birthday a package arrives from the forest, carried by an elf who will not come into town. Inside is a yew bow from the Bowyers of Lirith, older than your human grandparents, and a note from the elven side of your family: "For when you are grown. We know that by your other law you already are."',
        choices: [
          {
            t: "String it and shoot",
            check: {s:"bow",s2:"ins",d:38},
            win: {
              r: "It draws like silk. Your first arrow goes where you looked. Something in your blood knows this bow.",
              fx: {gear:{ranged:"elfbow"},skill:{bow:4},apt:{bow:1.25},happy:4},
            },
            lose: {r:"It is stronger than you are. You will grow into it.",fx:{gear:{ranged:"elfbow"},skill:{bow:2}}},
          },
          {
            t: "Walk to the forest edge to thank them",
            r: "They meet you at the stones, three elves with your grandmother's eyes, and speak to you for an hour as if you had always been theirs.",
            fx: {gear:{ranged:"elfbow"},happy:6,lang:"Sylvari"},
          },
          {
            t: "Sell it. You have rent to pay",
            r: "A Kingsmere collector pays forty suns without haggling. You feel sick about it for a year, and pay the rent.",
            fx: {coin:40,happy:-4,honor:-1},
          },
        ],
      },
      {
        id: "pp_he_twofeasts",
        title: "Leaf Fall and the harvest fair",
        cond: (p,C)=>C.race(p,"halfelf")&&C.ageAdj(p)>=12,
        w: .9,
        cool: 12,
        text: 'Leaf Fall falls in the same week as the harvest fair this year. Your elven kin expect you under the trees for the singing. Your human kin expect you at the long tables for the roast and the dancing. Both have said, separately, "Of course you will come."',
        choices: [
          {
            t: "The elves",
            r: "Wordless song under the falling leaves, and your grandmother's hand on your shoulder. Your human cousins will tease you about it for a month.",
            fx: {piety:2,happy:3},
          },
          {
            t: "The humans",
            r: "Roast pork, cider, a fiddler and a fight. It is loud, and warm, and very short, like everything human.",
            fx: {happy:4},
          },
          {
            t: "Both. Ride between them",
            check: {s:"riding",s2:"sta",d:34},
            win: {
              r: "Singing at dusk, dancing by midnight, singing again at dawn. You are exhausted and absurdly happy.",
              fx: {happy:6,sta:.3},
            },
            lose: {r:"You arrive late to both, with mud to the knees. Everyone forgives you, mostly.",fx:{happy:1}},
          },
        ],
      },
      {
        id: "pp_ho_tarn",
        title: "The two-horse sign",
        cond: (p,C)=>C.race(p,"halforc")&&C.adult(p)&&!C.old(p)&&!C.flag(p,"pp_ho_tarn"),
        w: 1.1,
        once: !0,
        text: ()=>early()?`A half-orc horse-trader passes through with news: Tarn Halfblood, who burned House Harrow's barns at Hazelhollow, rides at the Gashmar fords with twelve hundred half-orcs under the two-horse sign. Any half-orc may join by swearing on the prophecy of the rider born of two peoples. "He is your brother," says the trader. "Even if you never met him."`:'A half-orc horse-trader passes through with talk of the Two-Peoples Riders, the half-orc war-band that rides under the two-horse sign, one grey horse and one bay. Any half-orc may join by swearing on the prophecy of the rider born of two peoples. "They are your kin," says the trader. "Even if you never met them."',
        choices: [
          {
            t: "Ride east and swear on the sign",
            r: "You sell what you cannot carry and go. For the first time in your life you are in a camp where nobody looks twice at your tusks.",
            fx: {flag:"pp_ho_tarn",happy:6,skill:{riding:3,mounted:2},honor:1},
          },
          {
            t: "Send silver for their horses",
            req: p=>p.coin>=15,
            r: "Fifteen suns, sewn into the trader's saddle. You stay. Part of you rides with them anyway.",
            fx: {coin:-15,honor:2,flag:"pp_ho_tarn"},
          },
          {
            t: "Refuse. Prophecies get people killed",
            r: 'The trader shrugs. "So does being nobody." You think about that for a long time.',
            fx: {wil:1,trait:"cautious"},
          },
        ],
      },
      {
        id: "pp_ho_seekers",
        title: "The Seekers of the Rider",
        cond: (p,C)=>C.race(p,"halforc")&&C.adult(p)&&C.realm(p,"POL-34","POL-12","POL-11","POL-26"),
        w: 1,
        once: !0,
        text: "Three riders of Uzka Twoblood's Seekers of the Rider come to your fire. They are watching every half-orc on the steppe for the signs of the prophecy: a rider born of two peoples, who will unite all the grass. They want to see you ride, hear you speak, and look at your hands.",
        choices: [
          {
            t: "Ride for them",
            check: {s:"riding",s2:"mounted",d:48},
            win: {
              r: "They watch in silence and then talk among themselves for an hour. They leave without a word to you, but they leave a red cord on your saddle.",
              fx: {fame:3,skill:{riding:2},flag:"pp_ho_seen"},
            },
            lose: {
              r: "Your horse stumbles. They thank you politely and ride on to the next fire.",
              fx: {happy:-2,wil:.5},
            },
          },
          {
            t: "Tell them plainly you are not the rider",
            r: "They nod, as if that too were a sign. The prophecy is a belief, not a fact; but beliefs, you notice, keep coming to your fire.",
            fx: {wil:1,trait:"humble"},
          },
          {
            t: "Ask them what they will do if they find the rider",
            check: {s:"intrigue",s2:"ins",d:44},
            win: {
              r: "The eldest says it plainly: follow, or kill, depending on what the rider wants. You are very glad not to be chosen.",
              fx: {int:.4,skill:{intrigue:2}},
            },
            lose: {r:'"Follow," they say, and smile, and you do not believe them.',fx:{}},
          },
        ],
      },
      {
        id: "pp_ho_docks",
        title: "Half pay for half-orcs",
        cond: (p,C)=>C.race(p,"halforc")&&C.adult(p)&&C.coast(p)&&!inR(p,ORCR)&&free(p),
        w: 1,
        cool: 8,
        text: 'On the docks of {home}, half the oarsmen and dockers are half-orcs: stronger than humans, longer-winded than orcs, and hired because of it. Looked down on, and hired. Today the foreman pays the humans of your gang their full day and hands you two-thirds. "Your kind eat more," he says. "It comes out of the wage."',
        choices: [
          {
            t: "Get the half-orcs of the gang to down tools",
            check: {s:"command",s2:"persuasion",d:46},
            win: {
              r: "Twenty half-orcs sit down on the quay with a cog half unloaded and the tide turning. The foreman pays full, cursing.",
              fx: {coin:6,skill:{command:3},fame:2,newRel:{type:"enemy",op:-20}},
            },
            lose: {
              r: "Half sit down, half are too scared. The ones who sat are not hired tomorrow.",
              fx: {coin:-4,wil:2,happy:-4},
            },
          },
          {
            t: "Take it, and look for a better quay",
            r: "You take the two-thirds, and by the end of the month you are on a Lucernan galley that pays by the stroke, not the face.",
            fx: {coin:3,job:"sailor",skill:{sea:2}},
          },
          {
            t: "Lift the foreman by his collar and ask again",
            check: {s:"intimidation",s2:"str",d:42},
            win: {r:"He finds the rest of your wage very quickly.",fx:{coin:6,skill:{intimidation:2},honor:-1}},
            lose: {r:"The harbor watch is closer than you thought.",fx:{coin:-10,wil:1.5,punish:"theft"}},
          },
        ],
      },
      {
        id: "pp_ho_endurance",
        title: "An hour, not ten minutes",
        cond: (p,C)=>C.race(p,"halforc")&&C.adult(p)&&!C.old(p),
        w: 1,
        cool: 10,
        setup: (p,ctx)=>{ctx.cap=inR(p,ORCR)?"An orc war-captain":"A human captain of a free company"},
        text: '{cap} has watched you work: stronger than a human, and still swinging after an hour, when an orc would have been spent in ten minutes. "I need someone in the line who does not tire," the captain says. "Two minutes of orc is a storm. You are a wall."',
        choices: [
          {
            t: "Take the place in the line",
            check: {s:"sta",s2:"shield",d:44},
            win: {
              r: "Drill after drill, you are the one still standing at the end. The captain makes you the anchor of the line and pays you a third more.",
              fx: {sta:.6,skill:{shield:3,melee:2},coin:20,fame:1},
            },
            lose: {
              r: "You hold, but the drill shows a flaw in your guard. The captain keeps you on anyway, at the back.",
              fx: {skill:{shield:2},coin:8},
            },
          },
          {
            t: "Ask for double pay",
            check: {s:"trade",s2:"intimidation",d:46},
            win: {
              r: "The captain laughs and pays it. Endurance is rare and he knows it.",
              fx: {coin:35,skill:{trade:2}},
            },
            lose: {r:"He hires another half-orc at the normal price.",fx:{}},
          },
          {
            t: "Decline. You are a working hand, not a soldier",
            r: "The captain shrugs. You go back to the field, which also needs someone who does not tire.",
            fx: {trait:"content"},
          },
        ],
      },
      {
        id: "pp_ho_funeral",
        title: "Not at the graveside",
        cond: (p,C)=>C.race(p,"halforc")&&C.adult(p)&&!inR(p,ORCR),
        w: .9,
        once: !0,
        setup: (p,ctx)=>{ctx.who=A.pick(["your human grandmother","your mother's mother","your human aunt who raised you"]),ctx.Who=A.cap(ctx.who)},
        text: '{Who} has died. The human side of your family is gathered at the church, and your uncle meets you at the lychgate. "Better if you stay outside," he says. "The village talks." {Who} held you on her knee and called you her little bear.',
        choices: [
          {
            t: "Walk past him into the church",
            check: {s:"wil",s2:"intimidation",d:40},
            win: {
              r: "You stand at the back, head bowed. Nobody says anything. At the end the old priest shakes your hand first.",
              fx: {wil:2,honor:3},
            },
            lose: {
              r: "Your uncle blocks the door, and it becomes a scuffle at a funeral. You leave before it gets worse.",
              fx: {happy:-6,wil:1.5,honor:-1},
            },
          },
          {
            t: "Wait outside, and visit the grave alone at night",
            r: "You sit by the fresh earth until dawn, and tell her everything. She always listened.",
            fx: {wil:2,piety:2,happy:-3},
          },
          {
            t: "Go to the orc side of your family instead",
            r: "They do not know her, but they build a small fire and pour milk on the ground for her anyway. You did not expect to be comforted. You are.",
            fx: {happy:2,piety:2,wil:1},
          },
        ],
      },
      {
        id: "pp_ho_adopt",
        title: "An orc grandmother",
        cond: (p,C)=>C.race(p,"halforc")&&C.adult(p)&&!C.flag(p,"pp_ho_adopted")&&!inR(p,ORCR),
        w: .9,
        once: !0,
        text: `An old orc woman with copper on her tusks finds you at the market. She is your orc parent's mother; she has been looking for years. Among the clans a half-orc is adopted as full kin, no questions. "Come to the grass," she says. "You have a clan. You have a fire. You have a name to earn."`,
        choices: [
          {
            t: "Go with her to the grass",
            r: "A long ride east. At the clan fire they give you milk and a place, and the clan-mothers look at you as at a horse they are fond of. It is the strangest homecoming of your life.",
            fx: {flag:"pp_ho_adopted",happy:6,lang:"Orcish",skill:{riding:3,husbandry:2}},
          },
          {
            t: "Ask her to stay a while with you instead",
            check: {s:"persuasion",s2:"diplomacy",d:40},
            win: {
              r: "She stays a season in your human house, sleeping on the floor, scandalizing the neighbors. You learn more about yourself in a season than in your whole life.",
              fx: {happy:5,lang:"Orcish",newRel:{type:"mentor",op:40}},
            },
            lose: {r:"She cannot bear walls. She leaves you a copper tusk-cap and rides away.",fx:{happy:-2,wil:1}},
          },
          {
            t: "Refuse. Your life is here",
            r: "She does not argue. She touches your face, once, and says your name in Orcish. You did not know you had one.",
            fx: {wil:1.5,happy:-2},
          },
        ],
      },
      {
        id: "pp_ho_tusks",
        title: "The barber's file",
        cond: (p,C)=>C.race(p,"halforc")&&C.ageAdj(p)>=12&&!inR(p,ORCR),
        w: .9,
        once: !0,
        text: 'A barber-surgeon in {home} offers, kindly enough, to file down your tusks. "Half an hour, two suns, and nobody will ever look at you twice." Plenty of half-orcs in the towns have done it. Your tusks are small. It would work.',
        choices: [
          {
            t: "Have them filed",
            r: "It hurts like nothing else for a week. Afterward, people stop staring. You catch yourself running your tongue over the flat stumps for the rest of your life.",
            fx: {coin:-2,looks:4,happy:-2,wil:1,flag:"pp_ho_filed"},
          },
          {
            t: "Cap them with copper instead, as the Hearth Guard do",
            req: p=>p.coin>=6,
            r: "Two shining copper caps. Now people stare for a different reason. You find you like it.",
            fx: {coin:-6,looks:2,happy:4,trait:"proud"},
          },
          {t:"Refuse",r:"They are your teeth. People can look.",fx:{wil:1.5,trait:"stubborn"}},
        ],
      },
      {
        id: "pp_ho_blamed",
        title: "The first one they look at",
        cond: (p,C)=>C.race(p,"halforc")&&C.ageAdj(p)>=12&&!inR(p,ORCR),
        w: 1,
        cool: 8,
        setup: (p,ctx)=>{ctx.what=A.pick(["the church's silver candlesticks","the miller's purse","a ham from the reeve's smokehouse","two of the blacksmith's chickens"]),ctx.What=A.cap(ctx.what)},
        text: "{What} went missing overnight in {home}, and by breakfast half the village is looking at you. Nobody says it. Everybody thinks it. The reeve walks over with his thumbs in his belt.",
        choices: [
          {
            t: "Find the real thief",
            check: {s:"tracking",s2:"int",d:42},
            win: {
              r: "Footprints, a dropped button, a boy who cannot stop talking. It was the reeve's own nephew. The reeve does not thank you.",
              fx: {skill:{tracking:2},int:.4,honor:3,fame:1},
            },
            lose: {
              r: "You cannot find anything. The reeve searches your house, finds nothing, and apologizes to nobody.",
              fx: {happy:-4,wil:1.5},
            },
          },
          {
            t: "Ask your neighbors to swear for you",
            check: {s:"persuasion",s2:"diplomacy",d:44},
            win: {
              r: "Five neighbors stand up, then seven. You were mending their fences all night. The reeve goes away.",
              fx: {honor:2,happy:3},
            },
            lose: {
              r: "Two neighbors stand up. It is not enough. You pay a fine for something you did not do.",
              fx: {coin:-8,wil:2,happy:-5},
            },
          },
          {
            t: "Say nothing and let them search",
            r: "They find nothing. They also find nothing to apologize for. It is always like this.",
            fx: {wil:1.5,happy:-2},
          },
        ],
      },
      {
        id: "pp_ho_priest",
        title: "Cursed men",
        cond: (p,C)=>C.race(p,"halforc")&&C.adult(p)&&C.hasKids(p)&&!C.faith(p,"REL-11"),
        w: 1,
        once: !0,
        text: `You bring your child to be named and blessed, as everyone in {home} does. The priest looks at the baby's little tusks and hesitates. Most humans believe orcs were made from cursed men, and some priests believe it of half-orcs too. "Perhaps," he says, "a private blessing. Later."`,
        choices: [
          {
            t: "Demand the blessing now, in front of everyone",
            check: {s:"wil",s2:"persuasion",d:44},
            win: {
              r: "The whole congregation is watching. He gives it, stiffly. Your child sleeps through the whole thing.",
              fx: {piety:2,wil:1.5,honor:2},
            },
            lose: {
              r: "He refuses, and the congregation stays silent. You walk out with your child, and do not come back.",
              fx: {piety:-5,wil:2,happy:-5},
            },
          },
          {
            t: "Find a priest in the next town who will",
            r: "An old priest who has buried half-orc soldiers. He blesses the child without blinking and asks the name twice so he gets it right.",
            fx: {piety:3,happy:3},
          },
          {
            t: "Name the child at a fire, the orc way",
            r: "Milk poured on the earth, the name spoken to the sky. Your human neighbors gossip. Your child has a name either way.",
            fx: {piety:1,happy:2,trait:"stubborn"},
          },
        ],
      },
      {
        id: "pp_ho_bouncer",
        title: "Hired for the face",
        cond: (p,C)=>C.race(p,"halforc")&&C.adult(p)&&!C.old(p)&&!inR(p,ORCR)&&free(p),
        w: 1,
        cool: 10,
        text: 'The owner of the roughest tavern in {home} hires you to stand at the door, "because of your face". Six suns a week. On your first night, three drovers decide to find out whether a half-orc is as dangerous as he looks.',
        choices: [
          {
            t: "Stand in the doorway and do not move",
            check: {s:"intimidation",s2:"wil",d:42},
            win: {
              r: "They come close, look up at you, and find somewhere else to drink. The owner raises your wage.",
              fx: {coin:10,skill:{intimidation:3}},
            },
            lose: {
              r: "They try anyway.",
              fx: {
                duel: {
                  tier: 1,
                  title: "a drunk drover",
                  opts: {kind:"brawl",place:"the tavern door",lethal:!1,toYield:!0,title:"The door"},
                },
              },
            },
          },
          {
            t: "Talk them down with a joke and a free round",
            check: {s:"persuasion",s2:"int",d:38},
            win: {
              r: "By midnight they are your friends, and drinking more than they meant to. The owner does not know whether to fire you or promote you.",
              fx: {coin:6,skill:{persuasion:2},newRel:{type:"friend",op:15}},
            },
            lose: {r:"They drink the free round and start the fight anyway.",fx:{health:-6,coin:3}},
          },
          {
            t: "Quit. You will not be hired for your face",
            r: "The owner calls you ungrateful. You find work at a tannery, where the smell is bad and nobody looks at anyone.",
            fx: {wil:1,trait:"proud"},
          },
        ],
      },
      {
        id: "pp_ho_child",
        title: "Tusks or not",
        cond: (p,C)=>C.race(p,"halforc")&&C.adult(p)&&C.hasKids(p),
        w: 1,
        once: !0,
        text: "Your child's first teeth are coming in, and the whole family is watching. If the little tusks come, the child will be marked as you were, in every market and schoolyard. If they do not, the child might pass. You find you do not know which you are hoping for.",
        choices: [
          {
            t: "Tusks. Teach the child to be proud of them",
            r: "Two little white points by the first winter. You teach the child to grin with them. The schoolyard will be hard; the child will be harder.",
            fx: {happy:3,wil:1,trait:"proud"},
          },
          {
            t: "No tusks. Do not tell the child what you are",
            r: 'The child grows up passing. Someday someone will say "half-orc" in front of you both, and you will have to choose.',
            fx: {happy:1,wil:1,trait:"deceitful"},
          },
          {
            t: "It does not matter. Love the child",
            r: "And it does not, at your table. You make sure of it every single day.",
            fx: {happy:5,trait:"kind"},
          },
        ],
      },
      {
        id: "pp_ho_east",
        title: '"Nobody looks twice"',
        cond: (p,C)=>C.race(p,"halforc")&&C.adult(p)&&!inR(p,ORCR)&&p.realm!=="POL-12",
        w: .9,
        once: !0,
        text: 'A Nine Winds horse-trader at the fair looks you over and laughs. "Come east. In the Khanate the steppe peoples have mixed for centuries. My grandmother had tusks. Nobody there looks twice at you; they look at your horse." He is going home after the fair.',
        choices: [
          {
            t: "Go east with him",
            r: "Grass to the edge of the world, and a yurt where nobody stares. You have to learn to ride all over again, properly this time.",
            fx: {flag:"pp_ho_east",happy:6,skill:{riding:3},lang:"Wind Rider"},
          },
          {
            t: "Buy a horse from him and stay",
            req: p=>p.coin>=40,
            r: "A steppe horse, ugly and tireless. Whenever you ride it you think of a country where nobody looks twice.",
            fx: {coin:-40,gear:{mount:"horse"},skill:{riding:2}},
          },
          {
            t: "Stay. You will make them stop looking here",
            r: "It is a harder road. You are a stubborn person, which helps.",
            fx: {wil:1.5,trait:"stubborn"},
          },
        ],
      },
      {
        id: "pp_ho_border",
        title: "Both sides of the river",
        cond: (p,C)=>C.race(p,"halforc")&&C.adult(p)&&C.realm(p,"POL-01","POL-13","POL-26","POL-12","POL-11","POL-34"),
        w: 1,
        cool: 10,
        text: p=>inR(p,ORCR)?'The human border-forts across the river are burning again, and the clan war-captain looks at you over the fire. "Your other half lives over there," he says. "When we ride, where will you be?" The young riders are listening.':'The orc clans are raiding across the river again, and the reeve looks at you over the alehouse table. "Your other half lives over there," he says. "When they come, where will you be?" The whole room is listening.',
        choices: [
          {
            t: '"Where my neighbors are"',
            check: {s:"wil",s2:"persuasion",d:42},
            win: {
              r: "You say it without blinking. Most of the room believes you. The rest will believe you after the next raid, when they see where you stood.",
              fx: {honor:3,wil:1.5},
            },
            lose: {r:"They hear what they expected to hear. Your house is watched.",fx:{happy:-4,wil:1.5}},
          },
          {
            t: "Offer to go across and talk",
            check: {s:"diplomacy",s2:"learning",d:50},
            win: {
              r: "Both sides let you through, warily. You come back with a cattle-price and a truce until harvest. Nobody on either side thanks you. Both use you again.",
              fx: {skill:{diplomacy:4},fame:3,honor:3},
            },
            lose: {r:"Both sides think you are a spy for the other.",fx:{health:-8,wil:2,cause:"a border beating"}},
          },
          {
            t: "Walk out. You owe them no answer",
            r: "You are tired of being asked. Leaving is an answer too, and they will read it however they like.",
            fx: {trait:"proud",happy:-2},
          },
        ],
      },
      {
        id: "pp_ho_mowing",
        title: "The mowing match",
        cond: (p,C)=>C.race(p,"halforc")&&C.adult(p)&&!C.old(p)&&!inR(p,ORCR),
        w: .9,
        cool: 8,
        text: "Harvest at {home}, and the young men have a mowing match: a scythe each, a strip of the lord's barley each, and the best mower gets a ham. They did not ask you. A half-orc has the strength of an orc and nearly the wind of a human. They have forgotten that, or never knew.",
        choices: [
          {
            t: "Pick up a scythe and join in",
            check: {s:"sta",s2:"str",d:40},
            win: {
              r: "By noon you are two strips ahead. By dusk the crowd is cheering for you. You share the ham with the losers, which makes it hard for them to stay angry.",
              fx: {sta:.5,str:.3,fame:2,happy:5,honor:2},
            },
            lose: {
              r: "Strong, but your swing is clumsy. You come third, and the winner is very gracious about it.",
              fx: {sta:.3,happy:1},
            },
          },
          {
            t: "Bind sheaves behind the mowers for all of them",
            r: "Nobody can mow faster than the binders tie. You keep up with all six. At the end, the old farmers buy you the ale, not the winner.",
            fx: {honor:2,happy:3,newRel:{type:"friend",op:15}},
          },
          {
            t: "Watch, and keep your arms folded",
            r: "Better not to win, maybe. Better not to lose. You watch the human boys show off and feel a hundred years old.",
            fx: {wil:.5},
          },
        ],
      },
      {
        id: "pp_hb_meet",
        title: "The other kind of half",
        cond: (p,C)=>halfling(p)&&C.adult(p),
        w: .9,
        once: !0,
        setup: (p,ctx)=>{setPid(p,ctx,p.race==="halfelf"?"halforc":"halfelf",{occ:A.pick(["a drover","a sellsword","a ferryman","a cook on a river barge"])})},
        text: p=>`At a crossroads inn you share a bench with {themFull}, {themOcc}: ${p.race==="halfelf"?"tusks, grey-green skin, a voice like gravel":"pointed ears, a too-young face, a voice like water"}. Half one thing, half another, the opposite of you. You look at each other for a long moment, and both start laughing.`,
        choices: [
          {
            t: "Trade stories till dawn",
            r: '"Your kind." "No, YOUR kind." By midnight you have found every insult you have both ever heard and are weeping with laughter. You part at dawn as old friends.',
            fx: {happy:6,them:{type:"friend",op:45}},
          },
          {
            t: "Ask how {theyHe} lives with it",
            check: {s:"diplomacy",s2:"int",d:32},
            win: {
              r: '"I stopped asking which half I am," says {them}. "I am the whole of something nobody has a word for." You carry that home like a stone in your pocket.',
              fx: {wil:2,int:.3,them:{type:"friend",op:35}},
            },
            lose: {r:'{tHe} shrugs. "Badly. Like you." It is still comforting.',fx:{wil:1,them:{type:"friend",op:20}}},
          },
          {
            t: "Travel together for a season",
            r: "Nobody bothers two half-bloods on the road; they cannot decide whom to insult first. It is the easiest season of your life.",
            fx: {happy:5,skill:{survival:2},them:{type:"friend",op:40}},
          },
        ],
      },
      {
        id: "pp_hb_tally",
        title: "What are you?",
        cond: (p,C)=>halfling(p)&&C.adult(p)&&!inR(p,ELFR)&&!inR(p,ORCR),
        w: .9,
        cool: 15,
        text: p=>`The lord's clerk is making a new tax roll for {home}, house by house. He has a column for "human" and a column for "other", and a long pause when he reaches you. ${p.race==="halforc"&&p.realm==="POL-01"?`In Aldmark's march, "other" means no land and no arms without a license.`:'"Other" pays a higher hearth-tax.'} "Well?" he says.`,
        choices: [
          {
            t: '"Human. My mother was born in this street"',
            check: {s:"persuasion",s2:"wil",d:44},
            win: {
              r: 'He looks at you a long time, then writes "human" in a small hand. Your neighbors nod. The column is a little wider than it was.',
              fx: {coin:5,wil:1,happy:3},
            },
            lose: {r:'He writes "other" and underlines it.',fx:{coin:-8,wil:1.5,happy:-3}},
          },
          {
            t: '"Write both"',
            r: "There is no column for both. He writes it in the margin. In two hundred years some scholar will find it and wonder.",
            fx: {trait:"stubborn",coin:-4,happy:1},
          },
          {
            t: "Pay him to write what you like (5 suns)",
            req: p=>p.coin>=5,
            r: "Five suns, and you are whatever is cheapest. The roll is a lie, and so is every roll.",
            fx: {coin:-5,honor:-1},
          },
        ],
      },
      {
        id: "pp_hb_summers",
        title: "Two summers",
        cond: (p,C)=>halfling(p)&&(C.teen(p)||C.child(p)&&C.ageAdj(p)>=11),
        w: 1.3,
        once: !0,
        setup: (p,ctx)=>{ctx.other=p.race==="halfelf"?"your elven kin in the forest":"your orc kin on the grass",ctx.feel=p.race==="halfelf"?"slow, and quiet, and kind, and they treat you like a small child":"loud, and fierce, and warm, and they want you to ride and fight"},
        text: "This summer you may go to stay with {other}, for the first time on your own. They are {feel}. Your human friends are staying home for the fair and the swimming. Your parents say it is your choice.",
        choices: [
          {
            t: "Go to {other}",
            r: "It is strange and wonderful and lonely. You come home taller in some way nobody can see, and with words in a second language.",
            fx: fx2({happy:4,skill:{survival:2},wil:1}, p=>{const l=p.race==="halfelf"?"Sylvari":"Orcish";return p.langs.includes(l)?"":(p.langs.push(l),`(You learn ${l}.)`)}),
          },
          {
            t: "Stay home with your friends",
            r: "A summer of swimming, fighting and fruit-stealing. Next year, you tell yourself. Next year.",
            fx: {happy:5},
          },
          {
            t: "Ask {other} to visit you instead",
            r: "One of them comes, for a week, and causes a sensation in the village. Your friends are impressed. So, secretly, are you.",
            fx: {happy:4,fame:1},
          },
        ],
      },
    ]);
  })();
})();
