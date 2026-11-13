// The release's event pack 2 of 30 (88 events, mostly ch_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-027). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const AA = (p,C,lo,hi)=>{const a=C.ageAdj(p);return a>=lo&&a<hi},
      ST = (p,...s)=>s.includes(p.status),
      POOR = p=>["slave","serf","peasant"].includes(p.status),
      RICH = p=>["merchant","gentry","noble","royal"].includes(p.status),
      HIGH = p=>["noble","royal"].includes(p.status),
      live = (p,types)=>A.relsOf(p,types).filter(x=>x.p&&x.p.alive),
      hasPar = (p,t)=>live(p,t?[t]:["father","mother"]).length>0,
      kidSib = p=>live(p,["sibling"]).some(x=>!A.isAdult(x.p)),
      fam = ()=>A.S.family?A.S.family.wealth:0,
      pron = (ctx,t,pre)=>{ctx[pre+"he"]=A.he(t),ctx[pre+"He"]=A.cap(A.he(t)),ctx[pre+"his"]=A.his(t),ctx[pre+"him"]=A.him(t)},
      pronF = (ctx,pre)=>{ctx[pre+"he"]="she",ctx[pre+"He"]="She",ctx[pre+"his"]="her",ctx[pre+"him"]="her"},
      setPar = (p,ctx,t)=>{const l=live(p,t?[t]:["father","mother"]),x=l.length?A.pick(l):null;x?(ctx.pid=x.p.id,ctx.pw=x.r.type,ctx.pn=x.p.given,pron(ctx,x.p,"p")):(ctx.pw=t||"mother",ctx.pn="your "+ctx.pw,pronF(ctx,"p"))},
      setSib = (p,ctx,f)=>{let l=live(p,["sibling"]);f&&(l=l.filter(x2=>f(x2.p)));const x=l.length?A.pick(l):null;x?(ctx.pid=x.p.id,ctx.sw=x.p.sex==="F"?"sister":"brother",ctx.sn=x.p.given,ctx.sold=x.p.born<p.born?"older":"younger",pron(ctx,x.p,"s")):(ctx.sw="brother",ctx.sn="your brother",ctx.sold="younger",ctx.she="he",ctx.sHe="He",ctx.shis="his",ctx.shim="him")},
      setPal = (p,ctx,type,sex)=>{let k=ctx.pid?A.P(ctx.pid):null;if(!k){for(let i=0;i<8&&(k=A.makeAcquaintance(p,type||"friend",!0),!(!sex||k.sex===sex));i++);ctx.pid=k.id}ctx.kw=A.isAdult(k)?k.sex==="F"?"young woman":"young man":k.sex==="F"?"girl":"boy",pron(ctx,k,"k")},
      setMaster = (p,ctx)=>{let m=ctx.pid?A.P(ctx.pid):null;if(!m){for(let i=0;i<6&&(m=A.makeAcquaintance(p,"mentor"),m.race!==p.race);i++);ctx.pid=m.id}ctx.master=m.given,pron(ctx,m,"m")},
      fx2 = (o,f)=>(p,ctx)=>{const a=A.applyFx(p,o,ctx)||"";return((f&&f(p,ctx)||"")+" "+a).trim()},
      school = p=>{p.flags.school=A.S.year},
      sunland = p=>p.cult==="CUL-01",
      north = p=>p.cult==="CUL-02"||p.cult==="CUL-18",
      steppe = p=>["CUL-03","CUL-22","CUL-23"].includes(p.cult),
      orcLand = p=>["POL-11","POL-34","POL-12"].includes(p.realm),
      FOOD = {
        "CUL-01": "bread and oil",
        "CUL-02": "rye bread",
        "CUL-03": "mare's milk and mutton",
        "CUL-04": "dates and flatbread",
        "CUL-05": "dates and camel milk",
        "CUL-06": "barley bread and onions",
        "CUL-07": "dates and dried fish",
        "CUL-08": "millet porridge",
        "CUL-09": "millet porridge and sour milk",
        "CUL-10": "rice and fish",
        "CUL-11": "buckwheat porridge",
        "CUL-12": "barley flour and butter tea",
        "CUL-13": "rice",
        "CUL-14": "rice and fish",
        "CUL-15": "ship biscuit",
        "CUL-16": "roots and honey",
        "CUL-17": "yams",
        "CUL-18": "oat porridge",
        "CUL-19": "nut bread and honey",
        "CUL-20": "fish and nut bread",
        "CUL-21": "barley bread and cave mushrooms",
        "CUL-22": "meat and milk",
        "CUL-23": "meat and milk",
        "CUL-24": "seal fat",
      },
      food = p=>FOOD[p.cult]||"bread",
      game = p=>p.cult==="CUL-02"||p.cult==="CUL-18"?["the Ring Game","a king and his sworn men in the middle of a board cut into the hall bench, raiders all round"]:p.cult==="CUL-01"?["Sun and Shadow","a dice race round a board of hours, where the Devourer's square sends you back to dawn"]:["CUL-04","CUL-05","CUL-06","CUL-07"].includes(p.cult)?["Wells","pits and stones scooped in the sand"]:["CUL-08","CUL-09","CUL-10"].includes(p.cult)?["Stones","pits and pebbles on a plank, the game that teaches every child here to count"]:p.cult==="CUL-21"?["Gates","the war game of horse, foot and engines, carved in stone"]:steppe(p)||p.cult==="CUL-12"||p.cult==="CUL-24"?["bones","sheep's ankle bones, thrown and flicked, each face a beast"]:["Captains","a war game of horse, foot and a marshal on a squared board"],
      faithFest = p=>{const f=LORE.faiths[p.faith],s=f&&f.festivals?String(f.festivals).split(";").map(x=>x.split("(")[0].trim()).filter(Boolean):[];return s.length?A.pick(s):A.pick(GD.FESTIVALS)[0]},
      ritual = p=>{const f=LORE.faiths[p.faith],s=f&&f.rituals?String(f.rituals).split(";").map(x=>x.trim()).filter(Boolean):[];return s.length?A.pick(s):"the old prayers"},
      priestWord = p=>({"REL-01":"the dawnkeeper","REL-02":"the priest","REL-03":"the hall-priest","REL-04":"the Grove Keeper","REL-05":"the Law-Carver","REL-06":"the monk","REL-07":"the Well-Keeper","REL-08":"the flood-priest","REL-09":"the Rememberer","REL-10":"the temple priest","REL-11":"the drummer-shaman","REL-12":"the eldest of the hall","REL-13":"an old ship-captain","REL-14":"the shaman","REL-15":"a hidden Ash-priest","REL-16":"the healer-singer","REL-17":"a wandering preacher","REL-18":"your grandmother","REL-19":"an old corsair"})[p.faith]||"the priest",
      lord = p=>p.realm==="POL-27"?"the abbot":p.realm==="POL-11"||p.realm==="POL-34"?"the clan-mothers":"the lord";
    A.defEvents([
      {
        id: "ch_inf_first_word",
        once: !0,
        w: 1.3,
        cond: (p,C)=>AA(p,C,0,3.2),
        title: "A first word",
        text: p=>`You are very small, and the whole house leans in close: you are about to say your first word.${p.race==="elf"?" Among elves a first word is remembered for four hundred years.":p.race==="giant"?" In a giant's hall it will be chanted back to you on every feast day.":""}`,
        choices: [
          {
            t: '"Mama!"',
            req: p=>hasPar(p,"mother"),
            r: "{mother} bursts into tears and tells every neighbor before supper.",
            fx: {rel:{who:"mother",op:6},happy:3},
          },
          {
            t: '"Dada!"',
            req: p=>hasPar(p,"father"),
            r: "{father} pretends not to care, then carries you about on his shoulders all evening.",
            fx: {rel:{who:"father",op:6},happy:3},
          },
          {
            t: "Something else entirely",
            r: ()=>A.pick(['Your first word is "no". It will not be your last.','Your first word is "dog". The dog is delighted.','Your first word is "more". Everyone agrees it fits.',"Your first word is the name of the goat."]),
            fx: {int:.5,trait:"curious"},
          },
        ],
      },
      {
        id: "ch_inf_flux",
        cool: 3,
        w: 1.1,
        cond: (p,C)=>AA(p,C,0,3.6)&&!["elf","dwarf"].includes(p.race),
        title: "The summer flux",
        text: p=>`The first summers are the killers. ${A.pick(["Weaned onto bad water,","In the hot months,","After a week of heat,"])} you take the flux: hot, limp, far too quiet. Every family in ${A.provName(p.home)} knows the small graves at the edge of the burying ground.`,
        choices: [
          {
            t: "Your mother sits up with you, spooning boiled barley water",
            check: {s:"sta",s2:"wil",d:18},
            win: {
              r: "On the fourth night the fever breaks. You wake hungry, and your mother laughs out loud.",
              fx: {health:-5,wil:1,rel:{who:"mother",op:5}},
            },
            lose: {
              r: "You live, barely. You are a thin, quiet little thing for a year after.",
              fx: {health:-14,cause:"the summer flux",wil:2},
            },
          },
          {
            t: "The family pays a healer (3 suns)",
            req: ()=>fam()>=3,
            check: {s:"sta",d:14},
            win: {
              r: "The healer gives you willow bark and salted water. It works, or the fever was ready to break anyway.",
              fx: {health:-3,coin:-3},
            },
            lose: {
              r: "The healer bleeds you, which does not help. You pull through anyway.",
              fx: {health:-12,cause:"the summer flux",coin:-3,wil:1.5},
            },
          },
          {
            t: "They carry you to the shrine and pray",
            check: {s:"sta",s2:"wil",d:20},
            win: {r:"Your family thanks {god} for the rest of their lives.",fx:{health:-6,piety:5}},
            lose: {
              r: "The prayers do not seem to help. Slowly, you mend anyway.",
              fx: {health:-13,cause:"the summer flux",wil:2,piety:2},
            },
          },
        ],
      },
      {
        id: "ch_inf_hearth",
        cool: 4,
        cond: (p,C)=>AA(p,C,0,4.2),
        title: "The pretty fire",
        text: p=>`You can walk now, more or less, and you have found the most beautiful thing in the ${p.race==="giant"?"hall: a fire-pit as big as a room":steppe(p)?"tent: the fire in the middle":"house: the hearth"}. The flames dance. Nobody is looking.`,
        choices: [
          {
            t: "Reach for the fire",
            check: {s:"spd",s2:"ins",d:16},
            win: {
              r: ()=>A.pick(["A hand snatches you back by the collar. You howl with rage.","The heat stops you a hand short. You learn something about fire."]),
              fx: {ins:.4,wil:.3},
            },
            lose: {
              r: "You touch it. The scream brings the whole household running.",
              fx: {health:-6,cause:"a burn",wound:"burn",wil:.8},
            },
          },
          {
            t: "Toddle after the geese instead",
            r: ()=>A.pick(["The gander teaches you everything about geese in one hiss and one bite.","You chase the hens round the yard until you fall asleep in the straw."]),
            fx: {spd:.4,happy:2},
          },
          {
            t: "Sit down and stare at the flames",
            r: 'You watch the fire for an hour without a sound. "That one thinks," says your grandmother.',
            fx: {int:.4,trait:"calm"},
          },
        ],
      },
      {
        id: "ch_inf_lullaby",
        cool: 5,
        cond: (p,C)=>AA(p,C,0,3.8),
        setup: (p,ctx)=>{const s=LORE.songs&&LORE.songs.length?A.pick(LORE.songs):null;ctx.song=s&&s[0]?String(s[0]):"an old song with no name"},
        title: "A song at night",
        text: p=>`${p.race==="elf"?"Wordless elven song drifts down from the branches.":p.race==="giant"?"A deep giant chant hums through the floor of the hall.":p.race==="dwarf"?"Your mother hums a hammer song in the warm dark of the gallery.":"Your mother rocks you by the fire and sings."} It is "{song}", as it is every night.`,
        choices: [
          {
            t: "Fall asleep",
            r: "You sleep like a stone. It is the safest you will ever feel.",
            fx: {happy:3,health:2},
          },
          {
            t: "Hum along",
            r: "You get the tune wrong, but you get it. Your mother sings it again, slower.",
            fx: {skill:{music:2},rel:{who:"mother",op:3}},
          },
          {
            t: "Cry until dawn",
            r: "Nobody sleeps. In the morning they look at you the way soldiers look at a siege.",
            fx: {wil:.4,sta:.3},
          },
        ],
      },
      {
        id: "ch_inf_steps",
        once: !0,
        cond: (p,C)=>AA(p,C,0,3.4),
        title: p=>steppe(p)?"In the saddle":"First steps",
        text: p=>steppe(p)||p.race==="orc"?"Among your people children ride before they walk well. Someone sets you on the back of an old, patient mare.":`You let go of the ${A.pick(["bench","table leg","dog","doorpost"])} and stand there, swaying, with nothing to hold.`,
        choices: [
          {
            t: p=>steppe(p)||p.race==="orc"?"Grab the mane and kick":"Walk",
            check: {s:"spd",s2:"wil",d:14},
            win: {
              r: p=>steppe(p)||p.race==="orc"?"The mare ambles round the camp with you shrieking with joy on top.":"Three steps, four, five, then a triumphant fall into somebody's arms.",
              fx: p=>{steppe(p)||p.race==="orc"?A.trainSkill(p,"riding",3):A.train(p,"spd",.5),A.addOp(p,(live(p,["father"])[0]||{}).p,3)},
            },
            lose: {r:"Down you go, face first. You get up again. And again.",fx:{wil:.5}},
          },
          {
            t: "Sit down and refuse",
            r: "You will walk when you are good and ready. Everyone says you take after your grandmother.",
            fx: {trait:"stubborn"},
          },
        ],
      },
      {
        id: "ch_fam_quarrel",
        cool: 5,
        cond: (p,C)=>AA(p,C,4,14)&&hasPar(p,"father")&&hasPar(p,"mother"),
        setup: (p,ctx)=>{ctx.topic=POOR(p)?A.pick(["the rent","the seed corn","the lord's week-work","a debt to the miller","who drank the last of the ale","whether to sell the pig"]):A.pick(["money owed","your older cousin's marriage","a guest who stayed too long","something that happened in "+A.provName(p.home)+" years ago","whose family is to blame"])},
        title: "Voices through the wall",
        text: "Late at night you wake to {father} and {mother} fighting about {topic}. Things are said that cannot be unsaid. Something hits the wall.",
        choices: [
          {
            t: "Put your hands over your ears and hum",
            r: "You hum until you fall asleep. In the morning nobody mentions it.",
            fx: {wil:.6,happy:-2},
          },
          {
            t: "Walk in and stand between them",
            check: {s:"wil",s2:"int",d:22},
            win: {
              r: "They stop dead, ashamed. For a whole week the house is quiet and kind.",
              fx: fx2({wil:1,trait:"brave"},p=>{for(const x of live(p,["father","mother"]))A.addOp(p,x.p,3)}),
            },
            lose: {
              r: "You get a clout from one side and a shout from the other, and are sent back to bed.",
              fx: {wil:1.2,health:-2,happy:-3},
            },
          },
          {
            t: "Take the little ones out to the yard",
            req: p=>kidSib(p),
            r: "You sit in the cold with the younger ones and tell them a story about a fox until it is over.",
            fx: fx2({trait:"kind",wil:.5},p=>{for(const x of live(p,["sibling"]))A.addOp(p,x.p,4)}),
          },
          {
            t: "Lie still and listen to every word",
            r: "You learn more about money, pride and grown-ups in one night than in a year.",
            fx: {int:.5,skill:{intrigue:2},happy:-2},
          },
        ],
      },
      {
        id: "ch_fam_drink",
        cool: 7,
        w: .7,
        cond: (p,C)=>AA(p,C,5,15)&&hasPar(p),
        setup: (p,ctx)=>{setPar(p,ctx),ctx.grief=A.pick(["a dead child","the war","the debt","a brother who drowned","a bad harvest and a worse one after it","something nobody will name"]),ctx.gr=A.pick(["your grandmother","the neighbors",priestWord(p)]),ctx.drink=steppe(p)||p.race==="orc"?"fermented mare's milk":sunland(p)?"cheap wine":"ale"},
        title: "The jug",
        text: "Your {pw} has started drinking. {pHe} comes home late and loud, smelling of {drink}, and the house holds its breath until {phe} sleeps.",
        choices: [
          {
            t: "Pour the jug out in the midden",
            check: {s:"wil",s2:"spd",d:24},
            win: {r:"{pHe} never finds out who did it. For a while it helps.",fx:{wil:1,trait:"brave"}},
            lose: {
              r: "{pHe} catches you at it. The bruise lasts a week. The lesson lasts longer.",
              fx: {health:-4,wil:2,them:{op:-10}},
            },
          },
          {
            t: "Keep the little ones out of {phis} way",
            req: p=>kidSib(p),
            r: "You become very good at knowing when to take the others out to the well.",
            fx: {trait:"kind",wil:1,skill:{intrigue:1}},
          },
          {
            t: "Sit with {phim} and listen",
            r: "{pHe} talks about {grief}, and cries, and you hold {phis} hand. You understand a little more than a child should.",
            fx: {them:{op:10},wil:.8,int:.3},
          },
          {
            t: "Run to {gr} for help",
            r: (p,ctx)=>`${A.cap(ctx.gr||"the neighbors")} ${ctx.gr==="the neighbors"?"have":"has"} a word with your ${ctx.pw}. It is quieter for a season.`,
            fx: {them:{op:-3},skill:{diplomacy:1}},
          },
        ],
      },
      {
        id: "ch_fam_sick_parent",
        cool: 8,
        cond: (p,C)=>AA(p,C,5,15)&&hasPar(p),
        setup: (p,ctx)=>{setPar(p,ctx),ctx.ill=A.pick(["a lung fever","the shaking fever","a winter cough that will not lift","a wound gone bad","the bloody flux"])},
        title: "A sickbed",
        text: "Your {pw} is down with {ill}. {pHe} lies grey and sweating, and the grown-ups talk in low voices outside the door.",
        choices: [
          {
            t: "Nurse {phim} day and night",
            check: {s:"sta",s2:"wil",d:22},
            win: {
              r: "{pHe} pulls through, thin as a rake. {pHe} looks at you differently afterwards.",
              fx: {skill:{medicine:3},them:{op:10},wil:1},
            },
            lose: {
              r: "You catch it too. You both live, barely.",
              fx: {health:-12,cause:"a fever caught at a sickbed",wil:2,them:{op:8},skill:{medicine:2}},
            },
          },
          {
            t: "Run for the healer (4 suns)",
            req: ()=>fam()>=4,
            r: "The healer comes, frowns, sells you a bitter brew, and your {pw} mends slowly.",
            fx: {coin:-4,them:{op:4},skill:{medicine:1}},
          },
          {
            t: "Pray to {god}",
            r: "You pray until your knees ache. Your {pw} mends. You decide the prayers did it.",
            fx: {piety:5,skill:{faith:2}},
          },
        ],
      },
      {
        id: "ch_fam_baby",
        cool: 5,
        cond: (p,C)=>AA(p,C,4,15)&&live(p,["sibling"]).some(x=>A.age(x.p)<Math.max(1,GD.RACES[x.p.race].adult*.2)&&x.p.born>p.born),
        setup: (p,ctx)=>setSib(p,ctx,s=>A.age(s)<Math.max(1,GD.RACES[s.race].adult*.2)&&s.born>p.born),
        title: "The baby",
        text: "Your little {sw}, {sn}, will not stop crying. Everyone is too tired to see straight, and somehow the baby has become your job.",
        choices: [
          {
            t: "Rock {shim} and sing",
            r: "{sn} falls asleep on your shoulder. You do not move for an hour.",
            fx: {trait:"kind",them:{op:12},happy:2},
          },
          {
            t: "Teach {shim} words",
            r: "You decide {sn} will be the cleverest baby in {home}. {sHe} learns to say your name first.",
            fx: {them:{op:10},int:.4},
          },
          {
            t: "Pinch {shim} when nobody is looking",
            r: "It feels good for a moment, and then it does not.",
            fx: {trait:"cruel",them:{op:-6}},
          },
          {
            t: "Escape outside",
            r: "You spend the day in the fields. Nobody notices until supper. Then they notice.",
            fx: {happy:3,rel:{who:"mother",op:-3}},
          },
        ],
      },
      {
        id: "ch_fam_sib_fight",
        cool: 5,
        cond: (p,C)=>AA(p,C,4,15)&&live(p,["sibling"]).length>0,
        setup: (p,ctx)=>{setSib(p,ctx),ctx.thing=A.pick(["your carved horse","the last of the honey","your place by the fire","the good blanket","the knife grandfather gave you","your turn on the pony"])},
        title: "Brothers and sisters",
        text: "Your {sold} {sw}, {sn}, has taken {thing}, and is not giving it back.",
        choices: [
          {
            t: "Fight for it",
            check: {s:"str",s2:"wil",d:20},
            win: {r:"You win, and keep it. {sn} sulks for three days, then forgets.",fx:{str:.4,wil:.5,them:{op:-4}}},
            lose: {r:"{sn} sits on you until you give up.",fx:{wil:.8,them:{op:-2}}},
          },
          {
            t: "Make a deal",
            check: {s:"diplomacy",s2:"int",d:18},
            win: {
              r: "Two days each, and a share of your bread. Both of you think you won.",
              fx: {skill:{diplomacy:2,trade:1},them:{op:4}},
            },
            lose: {
              r: "{sn} takes the bread and keeps the prize. You have been robbed by family.",
              fx: {skill:{trade:1},happy:-2},
            },
          },
          {
            t: "Tell {mother}",
            req: p=>hasPar(p,"mother"),
            r: "{mother} sorts it out, and {sn} calls you a tattler for a month.",
            fx: {them:{op:-5}},
          },
          {
            t: "Let {shim} have it",
            r: "You let it go. {sn} is so surprised that {she} gives it back the next day.",
            fx: {trait:"generous",them:{op:8}},
          },
        ],
      },
      {
        id: "ch_fam_sib_fever",
        cool: 8,
        w: .9,
        cond: (p,C)=>AA(p,C,4,15)&&live(p,["sibling"]).some(x=>!A.isAdult(x.p)),
        setup: (p,ctx)=>{setSib(p,ctx,s=>!A.isAdult(s)),ctx.ill=A.pick(["the spotted fever","a lung fever","the bloody flux","the throat sickness","a fever nobody can name"])},
        title: "Fever in the house",
        text: "Your {sold} {sw}, {sn}, has {ill}. The house goes quiet. Everyone knows the numbers: two children in five never reach fifteen, and nobody in {home} has been spared.",
        choices: [
          {t:"Sit by {sn}'s bed and tell stories",fx:(p,ctx)=>sibFever(p,ctx,.7,.4,"kind")},
          {t:"Do {shis} chores so the grown-ups can nurse",fx:(p,ctx)=>sibFever(p,ctx,.72,0,null)},
          {
            t: "Pray all night",
            fx: (p,ctx)=>(A.applyFx(p,{piety:4,skill:{faith:1}},ctx),sibFever(p,ctx,.68,0,null)),
          },
          {t:"Stay away, as you were told",fx:(p,ctx)=>sibFever(p,ctx,.68,0,null)},
        ],
      },
      {
        id: "ch_fam_gran",
        cool: 4,
        cond: (p,C)=>AA(p,C,4,13),
        setup: (p,ctx)=>{ctx.who=p.race==="giant"?"The eldest of the hall":p.race==="elf"?"Your great-grandmother, who remembers the Dimming,":A.pick(["Your grandmother","Your grandfather","Old "+A.givenName(p.cult,A.pick(["M","F"]))+" next door"]);const k=A.ri(0,2);if(k===0&&LORE.creatures&&LORE.creatures.length){const near=A.beastsNear(p)||[],pool=near.length?LORE.creatures.filter(x=>near.includes(x.id)):[],c=pool.length?A.pick(pool):A.pick(LORE.creatures);ctx.kind="beast";const bl=String(c.belief||"Nobody who saw it lived to tell").replace(/"/g,"").trim();ctx.tale=`about the ${String(c.name).replace(/^the /i,"").toLowerCase()}. "${/[.!?]$/.test(bl)?bl:bl+"."}"`;const beh=String(c.behavior||"").split(/[;.]/)[0].trim();ctx.truth=`"${String(c.truth||"Nobody knows")}." ${beh?beh.charAt(0).toUpperCase()+beh.slice(1)+".":""}`.trim()}else if(k===1&&LORE.wars&&LORE.wars.length){const rs=A.realmShort(p.realm),wl=LORE.wars.filter(x=>String(x[1]).includes(rs)||String(x[4]).includes(rs)),w=A.pick(wl.length?wl:LORE.wars);ctx.kind="war",ctx.tale=`about the ${w[1]}, and the people who went and did not come back.`;const ws=String(w[4]||"it was worse than the songs").trim();ctx.truth=ws.charAt(0).toUpperCase()+ws.slice(1)+(/[.!?]$/.test(ws)?"":".")}else if(LORE.sayings&&LORE.sayings.length){const cn=A.culture(p.cult)?A.culture(p.cult).name:"",rs=A.realmShort(p.realm),sl=LORE.sayings.filter(x=>cn&&String(x[1]).includes(cn)||String(x[1]).includes(rs)),s=A.pick(sl.length?sl:LORE.sayings);ctx.kind="saying",ctx.tale=`and ends, as always, with the saying: "${String(s[0]).replace(/"/g,"")}"`,ctx.truth=String(s[2]||"it means what it means")}else ctx.kind="saying",ctx.tale="about the year the river froze.",ctx.truth="it froze, and that is the whole story"},
        title: "Stories by the fire",
        text: "{who} tells a story by the fire {tale}",
        choices: [
          {
            t: "Believe every word",
            r: "You lie awake half the night, thrilled and terrified.",
            fx: {happy:4,piety:1},
          },
          {
            t: 'Ask, "But is it true?"',
            check: {s:"int",d:18},
            win: {
              r: (p,ctx)=>ctx.kind==="saying"?`A long look. "It means this: ${ctx.truth}"`:`A long look, then the real story. ${ctx.truth}`,
              fx: {int:.8,trait:"curious"},
            },
            lose: {r:`"Of course it's true. Go to sleep."`,fx:{int:.3}},
          },
          {
            t: "Fall asleep in the warm",
            r: "You wake under a blanket, the fire down to coals. Somebody carried you.",
            fx: {health:1,happy:2},
          },
        ],
      },
      {
        id: "ch_fam_hunger",
        cool: 5,
        w: 1.1,
        cond: (p,C)=>AA(p,C,4,15)&&POOR(p)&&!["orc","elf"].includes(p.race),
        setup: (p,ctx)=>{ctx.food=food(p),ctx.bad=A.pick(["bread baked with bark and acorn meal","nettle soup","thin gruel twice a day, then once","the seed corn, which means next year will be worse","whatever the dog will not eat"])},
        title: "A hungry year",
        text: p=>`The harvest failed. By ${A.pick(["the turn of the year","Lantern Night","the spring","midwinter"])} the last of the ${food(p)} is gone, and the family eats {bad}. The youngest cry at night, and your belly aches all day.`,
        choices: [
          {
            t: "Give your share to the youngest",
            r: "You go hungry so a smaller mouth does not. Nobody thanks you. Nobody needs to.",
            fx: {trait:"kind",health:-6,cause:"hunger",wil:1.5,honor:2},
          },
          {
            t: p=>`Steal from ${lord(p)}${/s$/.test(lord(p))?"'":"'s"} stores`,
            check: {s:"stealth",s2:"spd",d:24},
            win: {
              r: "A sack of grain, out through a loose plank at night. The family eats, and asks no questions.",
              fx: {health:3,family:3,skill:{stealth:3},trait:"deceitful"},
            },
            lose: {
              r: "The steward catches you with your arms full. You are flogged in front of the whole village.",
              fx: {health:-8,cause:"a flogging",wil:2,honor:-3},
            },
          },
          {
            t: "Forage in the woods and hedges",
            check: {s:"survival",s2:"int",d:20},
            win: {
              r: "Snails, nettles, crab apples, a hedgehog. Not a feast, but enough.",
              fx: {skill:{survival:4},health:2},
            },
            lose: {
              r: "You eat the wrong mushrooms and spend two days wishing you were dead.",
              fx: {health:-10,cause:"bad mushrooms",skill:{survival:2}},
            },
          },
          {
            t: "Endure it",
            r: "You learn what hunger is. You will never waste a crust again.",
            fx: {wil:2,health:-7,cause:"hunger",sta:.3},
          },
        ],
      },
      {
        id: "ch_fam_chores",
        cool: 4,
        w: 1.8,
        cond: (p,C)=>AA(p,C,4.5,10)&&POOR(p)&&!["elf","dwarf","giant"].includes(p.race),
        setup: (p,ctx)=>{ctx.task=steppe(p)||p.cult==="CUL-12"?A.pick(["watching the lambs","gathering dung for the fire","milking the goats"]):p.cult==="CUL-06"?A.pick(["carrying water from the canal","keeping birds off the barley","watching the goats on the dyke"]):A.pick(["herding the geese","gathering firewood","carrying water","gleaning after the reapers","minding the pigs in the wood"])},
        title: "Old enough to work",
        text: "You are old enough to work now, like every child of {home}. Your job is {task}, from the dawn bell to the dusk bell.",
        choices: [
          {
            t: "Work hard and do it right",
            r: "By the end of the season you can do it half asleep. {father} nods at you once. It is enough.",
            fx: {sta:.6,skill:{husbandry:2},rel:{who:"father",op:3}},
          },
          {
            t: "Make a game of it",
            r: "You race the animals, sing to them and invent a whole kingdom in your head. The work gets done, mostly.",
            fx: {happy:4,spd:.4,skill:{music:1}},
          },
          {
            t: "Daydream",
            r: "You lose a goose to the fox. The thrashing is less memorable than the daydream.",
            fx: {int:.5,family:-2,health:-2},
          },
        ],
      },
      {
        id: "ch_play_game",
        cool: 4,
        cond: (p,C)=>AA(p,C,5,15),
        setup: (p,ctx)=>{const g=game(p);ctx.game=g[0],ctx.how=g[1],setPal(p,ctx,"friend")},
        title: "A game",
        text: "The children are playing {game}: {how}. {them} waves you over and sets out the pieces.",
        choices: [
          {
            t: "Play to win",
            check: {s:"int",s2:"tactics",d:22},
            win: {
              r: "You win three games running. {them} demands a fourth.",
              fx: {skill:{tactics:3},int:.4,them:{type:"friend",op:10}},
            },
            lose: {
              r: "You lose every game, and learn something from each one.",
              fx: {skill:{tactics:2},wil:.3,them:{type:"friend",op:5}},
            },
          },
          {
            t: "Cheat",
            check: {s:"intrigue",s2:"spd",d:22},
            win: {
              r: "Nobody sees you move the piece. You win a honey cake and a reputation.",
              fx: {skill:{intrigue:3},trait:"deceitful",happy:2},
            },
            lose: {r:"{them} catches you, and tells everyone.",fx:{honor:-3,them:{type:"rival",op:-12},happy:-3}},
          },
          {
            t: "Let {them} win",
            r: "You lose on purpose. {them} knows, and likes you for it anyway.",
            fx: {trait:"kind",them:{type:"friend",op:20}},
          },
        ],
      },
      {
        id: "ch_play_new_friend",
        cool: 5,
        cond: (p,C)=>AA(p,C,4,14),
        setup: (p,ctx)=>{setPal(p,ctx,"friend"),ctx.from=A.pick(["new in "+A.provName(p.home),"the reeve's youngest","from the next farm","the smith's child","a cousin come to stay","a fosterling from "+A.provName(p.home)])},
        title: "A new face",
        text: "There is a new {kw}, {them}, {from}. {kHe} stands alone at the edge of every game, pretending not to care.",
        choices: [
          {
            t: "Share your bread",
            r: "You split your bread without a word. By evening {them} is following you everywhere.",
            fx: {them:{type:"friend",op:30},happy:3},
          },
          {
            t: "Show {khim} your secret place",
            r: ()=>`You show ${A.pick(["the hollow oak","the cave behind the waterfall","the hole in the old wall","the loft over the stable","the den in the reeds"])}. Friends for life, sworn on spit.`,
            fx: {them:{type:"bestfriend",op:40},happy:5},
          },
          {
            t: "Challenge {khim} to a race",
            check: {s:"spd",d:20},
            win: {
              r: "You win by a length. {them} demands a rematch tomorrow, and the day after.",
              fx: {spd:.5,them:{type:"friend",op:20}},
            },
            lose: {r:"{them} leaves you in the dust and grins about it.",fx:{spd:.3,them:{type:"rival",op:5}}},
          },
          {
            t: "Leave {khim} alone",
            r: "Someone else befriends {them}. You wonder about it, sometimes.",
            fx: {trait:"shy"},
          },
        ],
      },
      {
        id: "ch_play_swim",
        cool: 4,
        cond: (p,C)=>AA(p,C,5,15)&&!C.terr(p,"desert","steppe")&&p.race!=="giant",
        setup: (p,ctx)=>{ctx.water=C_coast(p)?"the cove below the cliffs":A.pick(["the millpond","the river bend","the deep pool under the bridge","the lake"])},
        title: "Swimming",
        text: p=>`It is the hottest day of the year and every child in ${A.provName(p.home)} is in {water}.${p.race==="dwarf"?" Dwarves sink like anvils. Everyone knows it. You go anyway.":""}`,
        choices: [
          {
            t: "Swim across",
            check: {
              s: "sta",
              s2: "str",
              d: 24,
              bonus: p=>(p.race==="dwarf"?-15:0)+(A.hasBlood(p,"deeplung")||A.hasBlood(p,"seasteady")?15:0),
            },
            win: {r:"You make it, gasping, and the far bank cheers.",fx:{sta:.6,skill:{sea:2},fame:1}},
            lose: {
              r: "Halfway across your legs give out. Somebody drags you out by the hair, coughing up water.",
              fx: {health:-10,cause:"nearly drowning",wil:1.5},
            },
          },
          {
            t: "Dive for stones on the bottom",
            check: {s:"sta",s2:"wil",d:20,bonus:p=>A.hasBlood(p,"deeplung")?25:0},
            win: {
              r: "You come up with a fistful of pebbles and one bright old coin.",
              fx: {sta:.4,coin:1,skill:{sea:1}},
            },
            lose: {r:"Your ears pop and ache for a week.",fx:{health:-3}},
          },
          {
            t: "Paddle in the shallows",
            r: "You splash, float and watch the dragonflies. The best kind of day.",
            fx: {happy:5},
          },
        ],
      },
      {
        id: "ch_play_climb",
        cool: 5,
        cond: (p,C)=>AA(p,C,5,15)&&p.race!=="giant",
        setup: (p,ctx)=>{ctx.high=p.race==="elf"?"the crown of the oldest oak in the grove":p.race==="dwarf"?"the shaft of the old air-chimney":C_terr(p,"mountains","hills")?"the crag above the village":A.pick(["the old church tower","the tallest elm on the green","the roof of the tithe barn","the mast of a beached boat"])},
        title: "The climb",
        text: "Nobody has ever climbed {high}. Everyone says so. The other children stand at the bottom, looking at you.",
        choices: [
          {
            t: "Climb to the top",
            check: {s:"spd",s2:"str",d:24,bonus:p=>A.hasBlood(p,"lightfoot")||A.hasBlood(p,"balance")?20:0},
            win: {
              r: "You sit at the top with the whole world under you. They talk about it for a year.",
              fx: {spd:.5,fame:1,happy:5,trait:"brave"},
            },
            lose: {
              r: "A handhold breaks. You fall a long way and land badly.",
              fx: p=>(p.health=Math.max(1,p.health-12),p.lastHurt="a fall",A.willGrow(p,1),A.chance(.4)?"("+(A.addWound(p,A.pick(["bad_knee","scar_arm","broken_nose"]))||"bruised all over")+")":"Bruised all over, but nothing broken."),
            },
          },
          {
            t: "Climb halfway, then come down",
            r: "Halfway is higher than anyone else got. You call it a win.",
            fx: {spd:.3,wil:.3},
          },
          {
            t: "Say it is a stupid idea",
            r: "It is a stupid idea. Somebody else breaks an arm trying the next week.",
            fx: {int:.3,trait:"patient"},
          },
        ],
      },
      {
        id: "ch_play_animal",
        cool: 5,
        cond: (p,C)=>AA(p,C,4,14),
        setup: (p,ctx)=>{ctx.beast=C_terr(p,"desert")?A.pick(["a fennec kit","a lame kid goat","a young falcon with a torn wing"]):C_terr(p,"steppe")?A.pick(["a lame foal","a marmot pup","a young hawk with a broken wing"]):A.pick(["a fox cub with a hurt leg","a crow with a broken wing","a starving puppy","a hedgehog caught in a snare","an orphaned lamb"])},
        title: "A creature",
        text: "Behind the woodpile you find {beast}. It looks at you, too weak to run.",
        choices: [
          {
            t: "Nurse it back to health",
            check: {s:"husbandry",s2:"int",d:18},
            win: {
              r: "It lives, and follows you about for months. You have never been so proud.",
              fx: {skill:{husbandry:3},trait:"kind",happy:6},
            },
            lose: {
              r: "It dies in the night. You bury it with a stone on top and do not tell anyone you cried.",
              fx: {skill:{husbandry:1},wil:.6,happy:-4},
            },
          },
          {
            t: "Sell it at market",
            r: "A man pays you a few pennies. You spend them, and think about the creature anyway.",
            fx: {coin:1,trait:"greedy",skill:{trade:1}},
          },
          {t:"Leave it be",r:"When you come back, it is gone. You tell yourself it got better.",fx:{}},
        ],
      },
      {
        id: "ch_play_betrayal",
        cool: 6,
        cond: (p,C)=>AA(p,C,6,15),
        setup: (p,ctx)=>{const f=live(p,["friend","bestfriend"]).filter(x=>!A.isAdult(x.p));if(f.length){const x=A.pick(f);ctx.pid=x.p.id}setPal(p,ctx,"friend"),ctx.thing=A.pick(["the priest's window","the miller's best jug","a hole in the reeve's fence","the lord's hawk's jesses","the shrine's lamp"])},
        title: "Blamed",
        text: "Your friend {them} broke {thing}. When the grown-ups come asking, {khe} points straight at you.",
        choices: [
          {
            t: "Take the blame",
            r: "You take the beating without a word. Later, {them} brings you a honey cake and can't look you in the eye.",
            fx: {trait:"loyal",health:-3,wil:1,them:{op:15},honor:2},
          },
          {
            t: "Tell the truth",
            check: {s:"diplomacy",s2:"int",d:20},
            win: {
              r: "They believe you. {them} gets the beating, and does not speak to you for a month.",
              fx: {trait:"honest",them:{op:-15}},
            },
            lose: {
              r: "Nobody believes you, and now you are a liar as well.",
              fx: {health:-3,honor:-2,them:{type:"rival",op:-20},wil:1},
            },
          },
          {
            t: "Say nothing now, and get even later",
            r: "You smile. You wait. Three weeks later {them} finds a dead rat in {khis} boot.",
            fx: {trait:"deceitful",them:{type:"rival",op:-20},skill:{intrigue:2}},
          },
        ],
      },
      {
        id: "ch_play_storyteller",
        cool: 6,
        cond: (p,C)=>AA(p,C,5,15),
        setup: (p,ctx)=>{ctx.teller=p.cult==="CUL-02"?"A hall-singer chanting an oath-lay":steppe(p)?"A singer of the long songs of Ulagan":["CUL-08","CUL-09"].includes(p.cult)?"A praise-singer reciting the royal lines":p.cult==="CUL-04"?"A Qadiri poet reciting Hazir the Blind":p.cult==="CUL-05"?"A rider singing the night songs that keep the camels walking":p.race==="giant"?"A Mother chanting a lineage that takes all day":p.race==="dwarf"?"An old carver telling the founding of the First Hall":p.race==="elf"?"A Chronicler of the grove":"A wandering storyteller";const s=LORE.songs&&LORE.songs.length?A.pick(LORE.songs):null;ctx.song=s&&s[0]?String(s[0]):"the old tale of the Dimming"},
        title: "The storyteller",
        text: '{teller} comes to {home} and eats free in return for "{song}". The children sit in the front, mouths open.',
        choices: [
          {
            t: "Learn it by heart",
            check: {s:"int",s2:"music",d:20},
            win: {
              r: "By the next morning you can recite it all. The storyteller gives you a wink and a copper.",
              fx: {skill:{music:3},int:.5,coin:1},
            },
            lose: {r:"You get the first verse and the last, and invent the middle.",fx:{skill:{music:1}}},
          },
          {
            t: "Ask what really happened",
            r: '"Songs are rarely what happened," says the storyteller, and tells you a harder, stranger version.',
            fx: {int:.6,trait:"curious"},
          },
          {
            t: "Act it out with the other children afterwards",
            r: "You play the hero. Somebody else has to be the dragon.",
            fx: {happy:5,newRel:{type:"friend",op:20}},
          },
        ],
      },
      {
        id: "ch_bully_bread",
        cool: 5,
        cond: (p,C)=>AA(p,C,5,14),
        setup: (p,ctx)=>{setPal(p,ctx,"rival"),ctx.food=food(p)},
        title: "The bully",
        text: "{them}, a big {kw} with a mean grin, has started taking your {food} every day. The other children watch to see what you will do.",
        choices: [
          {
            t: "Fight {khim}",
            check: {s:"str",s2:"wil",d:24},
            win: {
              r: "You hit {them} so hard {khe} sits down in the mud. Nobody takes your food again.",
              fx: {trait:"brave",wil:1,str:.4,fame:1,them:{type:"rival",op:-10}},
            },
            lose: {
              r: "You get a split lip and a black eye, and you get up anyway. That counts for something.",
              fx: {health:-5,wil:1.5,them:{type:"rival",op:-5}},
            },
          },
          {
            t: "Outwit {khim}",
            check: {s:"int",s2:"intrigue",d:22},
            win: {
              r: "You fill your bread with mustard seed and pepper. {them} chokes in front of everyone, and leaves you alone.",
              fx: {int:.6,skill:{intrigue:3},them:{type:"rival",op:-10}},
            },
            lose: {r:"{them} sees through it, and takes your bread and your dignity.",fx:{happy:-4,wil:.6}},
          },
          {
            t: "Gather the other children",
            check: {s:"diplomacy",s2:"wil",d:22},
            win: {
              r: "Six of you stand together. {them} backs down, and you have friends you did not have before.",
              fx: {skill:{diplomacy:3,command:2},newRel:{type:"friend",op:25}},
            },
            lose: {r:"Nobody will stand with you. You learn who your friends are not.",fx:{wil:1,happy:-3}},
          },
          {
            t: "Hand it over",
            r: "You go hungry until {them} finds someone else to rob.",
            fx: {happy:-4,wil:.6,health:-2,trait:"craven"},
          },
        ],
      },
      {
        id: "ch_bully_mock",
        cool: 6,
        cond: (p,C)=>AA(p,C,5,15)&&p.race!=="halforc",
        setup: (p,ctx)=>{const r=[];p.race==="halfelf"&&r.push("your pointed ears","having no birth tree",'your "elf eyes"'),POOR(p)&&r.push("your patched rags","your bare feet","smelling of the byre"),p.status==="slave"&&r.push("being owned"),RICH(p)&&r.push("your soft hands","your fancy boots","talking like a priest"),p.flags.bastard&&r.push("having no father worth the name"),p.race==="dwarf"&&r.push("being short even for a dwarf"),p.race==="giant"&&r.push("being clumsy"),r.push("your red hair","your big ears","your stutter","your mother's accent","your crooked teeth"),ctx.why=A.pick(r)},
        title: "Names",
        text: "The other children have found something to mock you for: {why}. They chant it in the lane every time you pass.",
        choices: [
          {
            t: "Laugh along",
            check: {s:"diplomacy",s2:"wil",d:20},
            win: {
              r: "You laugh louder than anyone, and make up a better verse. It stops being fun for them.",
              fx: {skill:{diplomacy:2},trait:"gregarious",wil:.6},
            },
            lose: {r:"Your laugh cracks halfway. They chant louder.",fx:{happy:-4,wil:1}},
          },
          {
            t: "Fists",
            check: {s:"str",s2:"spd",d:24},
            win: {
              r: "The loudest one goes down. The chant stops, at least when you are in earshot.",
              fx: {str:.4,wil:.8,trait:"wrathful"},
            },
            lose: {r:"Three of them pile on you. You go home bloody.",fx:{health:-6,wil:1.5}},
          },
          {
            t: "A sharp answer",
            check: {s:"int",d:22},
            win: {r:"One cutting line, and the whole lane laughs at them instead.",fx:{int:.5,fame:1}},
            lose: {r:"Your answer comes to you at night, three hours too late.",fx:{int:.3,happy:-2}},
          },
          {
            t: "Walk past with your head up",
            r: "It hurts. You never let them see it hurt. That is a skill too.",
            fx: {wil:1.5,trait:"calm",happy:-3},
          },
        ],
      },
      {
        id: "ch_bully_defend",
        cool: 6,
        cond: (p,C)=>AA(p,C,6,16),
        setup: (p,ctx)=>{ctx.victim=A.pick(["the miller's simple son","a Marchfolk runaway's little girl","a three-legged dog","a boy with a stutter","the new priest's daughter","a cripple from the war",p.race==="human"?"a half-orc child":"a human child"])},
        title: "Cruelty in the lane",
        text: "A pack of bigger children have cornered {victim}. They are throwing stones and laughing.",
        choices: [
          {
            t: "Step in",
            check: {s:"wil",s2:"str",d:26},
            win: {
              r: "You stand in front of the stones until the pack loses interest. Somebody you saved will remember it.",
              fx: {trait:"brave",honor:3,wil:1,newRel:{type:"friend",op:30}},
            },
            lose: {
              r: "You take a stone to the head for your trouble, and they scatter anyway when you will not move.",
              fx: {trait:"brave",honor:2,health:-7,cause:"a stone to the head",wil:1.5},
            },
          },
          {
            t: "Run for a grown-up",
            r: "The pack scatters when the smith comes out with his hammer.",
            fx: {honor:1,int:.3},
          },
          {
            t: "Join in",
            r: "You throw a stone too. Everyone laughs. Later, alone, it does not feel so funny.",
            fx: {trait:"cruel",honor:-3,happy:1},
          },
          {t:"Walk away",r:"Not your business. You tell yourself that for a long time.",fx:{wil:.3}},
        ],
      },
      {
        id: "ch_dare_night",
        cool: 5,
        cond: (p,C)=>AA(p,C,7,16),
        setup: (p,ctx)=>{ctx.dare=p.race==="dwarf"?"go alone into the old worked-out gallery where the lamp always gutters":p.race==="elf"?"spend a night outside the Oak Line, among the human farms":steppe(p)?"ride out alone to the burial cairns and touch the horse-skull on top":A.pick(["spend Ash Night alone in the churchyard","touch the hanged man at the crossroads","sleep a night on the old barrow mound","go into the burned house where the witch was taken","knock three times on the door of the leper hut"])},
        title: "A dare",
        text: "The others dare you to {dare}. Nobody else has done it. That is the point.",
        choices: [
          {
            t: "Do it",
            check: {s:"wil",d:24},
            win: {
              r: "You do it, and nothing happens, and you come back in the grey dawn a little bit legendary.",
              fx: {wil:1,fame:1,happy:4,trait:"brave"},
            },
            lose: {
              r: ()=>A.pick(["An owl screams and you run all the way home.","A noise in the dark. You run, and fall, and run.","You last until midnight, then bolt."]),
              fx: {wil:.8,happy:-4,health:-2},
            },
          },
          {
            t: "Dare the dare-maker first",
            check: {s:"diplomacy",s2:"int",d:20},
            win: {
              r: "The dare-maker goes pale, makes excuses, and loses face. You lose nothing.",
              fx: {skill:{diplomacy:2},int:.3},
            },
            lose: {r:'"I asked you first." Everybody laughs.',fx:{happy:-2}},
          },
          {
            t: "Refuse",
            r: '"Coward," they chant. It stings for a week. You are still alive, which is more than some dare-takers.',
            fx: {happy:-3,trait:"patient"},
          },
        ],
      },
      {
        id: "ch_dare_orchard",
        cool: 5,
        cond: (p,C)=>AA(p,C,6,15)&&!["elf","dwarf","giant"].includes(p.race)&&!steppe(p),
        setup: (p,ctx)=>{ctx.owner=A.pick(["the reeve's","the priest's","the lord's","the miller's","old "+A.givenName(p.cult,"F")+"'s"]),ctx.fruit=sunland(p)||["CUL-04","CUL-07"].includes(p.cult)?A.pick(["figs","apricots","pomegranates"]):A.pick(["apples","pears","plums","cherries"])},
        title: "Forbidden fruit",
        text: "Over the wall of {owner} orchard, the {fruit} are ripe. Your friends are already halfway up the wall.",
        choices: [
          {
            t: "Over the wall",
            check: {s:"stealth",s2:"spd",d:24},
            win: {
              r: "You fill your shirt and get out as the dog starts barking. The best {fruit} you will ever eat.",
              fx: {skill:{stealth:3},happy:5,spd:.3},
            },
            lose: {
              r: "The steward catches you by the ear. You are thrashed, and your father has to pay a penny.",
              fx: {health:-5,honor:-2,coin:-1,rel:{who:"father",op:-4}},
            },
          },
          {
            t: "Keep watch",
            r: "You whistle when the steward comes. Everybody escapes, and you get a share.",
            fx: {skill:{stealth:2},ins:.4,happy:3},
          },
          {
            t: "Go home",
            r: "You go home. Your friends get caught. You feel clever and lonely at once.",
            fx: {trait:"honest"},
          },
        ],
      },
      {
        id: "ch_slave_sold",
        cool: 8,
        w: 1.8,
        cond: (p,C)=>AA(p,C,5,16)&&p.status==="slave",
        setup: (p,ctx)=>{ctx.sold=A.pick(["your friend "+A.givenName(p.cult,"F"),"your friend "+A.givenName(p.cult,"M"),"the old woman who raised half the slave children","the cook's boy you shared a pallet with"]),ctx.buyer=A.pick(["a trader from "+A.provName(p.home),"a galley master","a mine overseer","a man nobody knows"])},
        title: "Sold",
        text: "The master sells {sold} to {buyer}. There is a rope, a price, a cart. That is all it takes.",
        choices: [
          {
            t: "Run after the cart to say goodbye",
            r: "You run until your lungs burn and the cart is a speck. You will remember the face looking back.",
            fx: {wil:1.5,happy:-6,sta:.4},
          },
          {
            t: "Hide something in their bundle for the road",
            check: {s:"stealth",s2:"int",d:22},
            win: {
              r: "Bread and a knife, slipped into the bundle. It is not much. It is something.",
              fx: {trait:"kind",skill:{stealth:2},honor:2},
            },
            lose: {r:'The overseer sees you. You are whipped for "theft".',fx:{health:-7,cause:"a whipping",wil:2}},
          },
          {
            t: "Swear that one day you will be free",
            r: "You say it under your breath, there in the yard. It becomes the most important thing about you.",
            fx: {flag:"ch_vow_freedom",trait:"ambitious",wil:1.5},
          },
        ],
      },
      {
        id: "ch_slave_master_child",
        cool: 8,
        w: 1.6,
        cond: (p,C)=>AA(p,C,5,14)&&p.status==="slave",
        setup: (p,ctx)=>setPal(p,ctx,"friend"),
        title: "The master's child",
        text: "The master's child, {them}, is your age. You played together when you were small. Now {khe} has started giving you orders, and watching to see if you obey.",
        choices: [
          {
            t: "Obey",
            r: "You fetch and carry. {them} seems almost disappointed.",
            fx: {them:{type:"acquaint",op:-2},trait:"humble",wil:.5},
          },
          {
            t: "Refuse, quietly",
            check: {s:"wil",s2:"diplomacy",d:24},
            win: {
              r: '{them} stares, then laughs. "You were always stubborn." Something between you stays human.',
              fx: {them:{type:"friend",op:15},wil:1,trait:"stubborn"},
            },
            lose: {
              r: "{them} tells the overseer. You are beaten.",
              fx: {health:-7,cause:"a beating",wil:2,them:{type:"rival",op:-10}},
            },
          },
          {
            t: "Stay friends in secret",
            check: {s:"intrigue",s2:"diplomacy",d:22},
            win: {
              r: "In the loft, away from the grown-ups, you are still friends. {them} slips you leftovers and news.",
              fx: {them:{type:"friend",op:25},skill:{intrigue:2}},
            },
            lose: {r:"Someone sees. {them} is forbidden to speak to you again.",fx:{happy:-4,wil:1}},
          },
        ],
      },
      {
        id: "ch_slave_letters",
        once: !0,
        w: 1.6,
        cond: (p,C)=>AA(p,C,6,16)&&p.status==="slave"&&!p.literate,
        title: "Letters through the door",
        text: "The master's children have a tutor. You sweep the corridor outside while he drills them in letters, and the door is never quite shut.",
        choices: [
          {
            t: "Listen and learn in secret",
            check: {s:"int",s2:"wil",d:28},
            win: {
              r: "You scratch letters in the dirt at night and rub them out at dawn. One day the marks become words.",
              fx: {literate:!0,skill:{learning:4},int:.8,flag:"ch_secret_reader"},
            },
            lose: {
              r: "You learn a few letters before the tutor notices you lingering. The beating is long.",
              fx: {skill:{learning:2},health:-6,wil:1.5},
            },
          },
          {
            t: "Ask the tutor outright",
            check: {s:"diplomacy",s2:"int",d:26},
            win: {
              r: "He is an old, tired man who once was a slave himself. He teaches you on the quiet.",
              fx: {literate:!0,skill:{learning:4},newRel:{type:"mentor",op:30}},
            },
            lose: {r:"He laughs at you, then reports you.",fx:{health:-4,happy:-4,wil:1}},
          },
          {
            t: "Keep sweeping",
            r: "Letters are not for the likes of you. That is what they want you to believe.",
            fx: {},
          },
        ],
      },
      {
        id: "ch_serf_bailiff",
        cool: 10,
        w: 1.8,
        cond: (p,C)=>AA(p,C,5,15)&&p.status==="serf",
        setup: (p,ctx)=>{ctx.why=A.pick(["the heriot owed for your grandfather's death","arrears of the lord's rent","a fine for grinding corn at home instead of at the lord's mill","the tallage the lord has set this year"]),ctx.beast=steppe(p)||p.cult==="CUL-12"?"the best yak":A.pick(["the cow","the plough-ox","the cow and her calf"])},
        title: "The bailiff",
        text: p=>`The bailiff of ${lord(p)} rides into the yard with two men. He has come for {beast}: {why}. Your mother stands in the door with her arms folded and says nothing, because there is nothing to say.`,
        choices: [
          {
            t: "Hide the calf in the woods",
            check: {s:"stealth",s2:"spd",d:24},
            win: {
              r: "The bailiff counts one beast short and never thinks to look in the hazel thicket. The family keeps something.",
              fx: {family:5,skill:{stealth:3},trait:"deceitful"},
            },
            lose: {
              r: "The bailiff's man finds you and the calf in the thicket. Your father is fined as well.",
              fx: {family:-4,health:-4,wil:1.5,rel:{who:"father",op:-4}},
            },
          },
          {
            t: "Beg the bailiff",
            check: {s:"diplomacy",s2:"wil",d:26},
            win: {
              r: 'Something in your face reaches him. He takes the beast but leaves the calf. "Grow it well."',
              fx: {skill:{diplomacy:3},family:2},
            },
            lose: {r:"He does not even look at you.",fx:{wil:1,happy:-3}},
          },
          {
            t: "Throw a stone at his horse",
            check: {s:"spd",s2:"ins",d:22},
            win: {
              r: "The horse bucks, the bailiff lands in the dung, and nobody saw who did it. You will treasure this all your life.",
              fx: {happy:6,flag:"ch_hates_lord",ins:.4},
            },
            lose: {
              r: "They see you. Your father is flogged for it, not you. That is worse.",
              fx: {wil:2.5,rel:{who:"father",op:-6},flag:"ch_hates_lord",happy:-6},
            },
          },
          {
            t: "Watch, and remember his face",
            r: "You remember the face, the name, the horse. You remember everything.",
            fx: {flag:"ch_hates_lord",wil:1.5,trait:"ambitious"},
          },
        ],
      },
      {
        id: "ch_serf_weekwork",
        cool: 5,
        w: 1.6,
        cond: (p,C)=>AA(p,C,7,16)&&ST(p,"serf","slave"),
        setup: (p,ctx)=>{ctx.work=A.pick(["hoeing the lord's beans","carting the lord's hay","picking stones off the lord's field","threshing in the lord's barn","mending the lord's ditch"])},
        title: "The lord's days",
        text: "Three days a week the family works the lord's land, while your own strips wait. Today it is {work}, under the reeve's eye.",
        choices: [
          {
            t: "Work hard and keep your head down",
            r: "Your back aches and your hands harden. The reeve learns your name, which may be good or bad.",
            fx: {sta:.6,str:.4,wil:.5},
          },
          {
            t: "Glean a little for home",
            check: {s:"stealth",s2:"ins",d:22},
            win: {r:"A pocket of beans, a fistful of grain. It all adds up at home.",fx:{family:2,skill:{stealth:2}}},
            lose: {
              r: "The reeve catches you and fines your father a day's work.",
              fx: {family:-1,health:-3,rel:{who:"father",op:-3}},
            },
          },
          {
            t: "Slow down when the reeve isn't looking",
            check: {s:"ins",s2:"int",d:20},
            win: {
              r: "You learn how to look busy. It is a skill all serfs learn, and lords never notice.",
              fx: {skill:{intrigue:2},happy:2},
            },
            lose: {r:"The reeve's switch finds your back.",fx:{health:-4,wil:1}},
          },
        ],
      },
      {
        id: "ch_peas_birds",
        cool: 4,
        w: 1.8,
        cond: (p,C)=>AA(p,C,5,10)&&ST(p,"peasant","serf")&&!["elf","dwarf","giant","orc"].includes(p.race)&&!steppe(p),
        title: "Scaring crows",
        text: "The seed is in the ground, and every crow in the shire knows it. You are given a wooden clapper, a sling and the whole field, from dawn to dusk.",
        choices: [
          {
            t: "Learn the sling",
            check: {s:"ins",s2:"spd",d:18},
            win: {
              r: "By midsummer you can hit a crow at forty paces. The crows learn to fear you.",
              fx: {ins:.6,skill:{bow:1,survival:1}},
            },
            lose: {r:"You hit a sheep, a fencepost and your own foot. The crows are entertained.",fx:{ins:.3}},
          },
          {
            t: "Sing at the top of your lungs",
            r: "You sing every song you know, then make up new ones. The crows leave. So do the neighbors.",
            fx: {skill:{music:2},happy:3},
          },
          {
            t: "Nap in the hedge",
            r: "The crows feast. Your father sees the bare rows and says nothing, which is worse than a thrashing.",
            fx: {family:-2,rel:{who:"father",op:-3}},
          },
        ],
      },
      {
        id: "ch_art_workshop",
        cool: 4,
        w: 1.8,
        cond: (p,C)=>AA(p,C,6,15)&&p.status==="artisan",
        setup: (p,ctx)=>{setPar(p,ctx),ctx.trade=A.pick(["the forge","the loom","the dye vats","the cooper's bench","the potter's wheel","the tannery pits","the bakehouse ovens","the bowyer's bench"])},
        title: "In the workshop",
        text: "You spend your days around {trade}, where your {pw} works from the dawn bell to the dusk bell. The journeymen tease you. The apprentices make you fetch things.",
        choices: [
          {
            t: "Watch and learn",
            r: "You watch until you can see the work before it happens. Your hands itch to try.",
            fx: {skill:{craft:3},int:.3},
          },
          {
            t: "Try to make something yourself",
            check: {s:"craft",s2:"int",d:22},
            win: {
              r: "It is crooked, but it is real. Your {pw} keeps it on the shelf above the bench.",
              fx: {skill:{craft:4},them:{op:6},happy:4},
            },
            lose: {
              r: "You ruin good material and burn your hand. The cost comes out of the family purse.",
              fx: {skill:{craft:2},family:-3,health:-3,cause:"a burn"},
            },
          },
          {
            t: "Sweep up and listen to the journeymen",
            r: "You learn guild gossip, which masters cheat, which girls the journeymen like, and every rude word in {home}.",
            fx: {skill:{diplomacy:2,intrigue:1},happy:2},
          },
        ],
      },
      {
        id: "ch_art_townfever",
        cool: 9,
        cond: (p,C)=>AA(p,C,4,15)&&(p.status==="artisan"||C.town(p))&&!["elf","dwarf","giant"].includes(p.race),
        setup: (p,ctx)=>{ctx.ill=A.pick(["the spotted fever","the sweating sickness","a flux from the bad wells","a pox off the ships"])},
        title: "Fever in the street",
        text: "The physicians blame bad air, the priests blame sin. Doors in your street are chalked with crosses, one by one. {ill} has come to {home}.",
        choices: [
          {
            t: "Stay inside, as you are told",
            r: "You spend a month in one room, playing knucklebones against the wall. It may have saved your life.",
            fx: {wil:1,happy:-4,trait:"patient"},
          },
          {
            t: "Sneak out to see your friend",
            check: {s:"sta",d:22},
            win: {
              r: "Your friend is fine, and so are you. You were lucky, and part of you knows it.",
              fx: {happy:3,trait:"impetuous"},
            },
            lose: {
              r: "You bring the fever home in your lungs. You live. Not everyone in the street does.",
              fx: {health:-14,cause:"town fever",wil:2},
            },
          },
          {
            t: "Carry bread to the shut-in neighbors",
            check: {s:"sta",s2:"wil",d:20},
            win: {
              r: "You leave bread on doorsteps all month. The street remembers who came.",
              fx: {trait:"kind",honor:4,fame:1},
            },
            lose: {
              r: "You catch it on a doorstep. The neighbors you fed pray for you.",
              fx: {health:-12,cause:"town fever",honor:3,wil:1.5},
            },
          },
        ],
      },
      {
        id: "ch_merc_ledger",
        cool: 4,
        w: 1.8,
        cond: (p,C)=>AA(p,C,7,16)&&p.status==="merchant",
        setup: (p,ctx)=>{setPar(p,ctx),ctx.goods=A.pick(["wool bales","casks of wine","pepper","salt","furs","Qadiri paper","dyed cloth","iron bars"])},
        title: "The ledgers",
        text: "Your {pw} sits you at the counting table with the ledgers: debits on the left, credits on the right, every barrel and bale. Today it is {goods}. Somewhere in the columns, something does not add up.",
        choices: [
          {
            t: "Find the mistake and show {phim}",
            check: {s:"int",s2:"trade",d:22},
            win: {
              r: "A clerk has been skimming two in every hundred. Your {pw} looks at you with new eyes.",
              fx: {skill:{trade:4,stewardship:2},them:{op:8},int:.5},
            },
            lose: {r:'You find a "mistake" that is not one. Your {pw} explains, patiently, why.',fx:{skill:{trade:2}}},
          },
          {
            t: "Ask how a bill of exchange works",
            r: "An hour later you know how money crosses a sea without ever being on the ship.",
            fx: {skill:{trade:3},int:.4,trait:"curious"},
          },
          {
            t: "Ask for a share if you find the leak",
            check: {s:"trade",s2:"diplomacy",d:20},
            win: {
              r: `"A merchant's child," your {pw} laughs, and pays you two suns from the recovered money.`,
              fx: {coin:2,skill:{trade:3},trait:"greedy"},
            },
            lose: {r:'"Family does not bill family." You get nothing but a lecture.',fx:{skill:{trade:1}}},
          },
        ],
      },
      {
        id: "ch_gent_page",
        once: !0,
        w: 2,
        cond: (p,C)=>AA(p,C,6.5,11)&&ST(p,"gentry","noble"),
        setup: (p,ctx)=>{ctx.lordname=A.pick(["a great baron","your father's liege lord","a count of the march","your mother's cousin, a lord of "+A.provName(p.home)])},
        title: "Into service",
        text: "It is time for you to go into the household of {lordname}: to serve at table, carry messages, learn manners and arms among other children of good family.",
        choices: [
          {
            t: "Go eagerly",
            r: "You ride off without looking back. Within a month you can carve a capon and bow to a bishop.",
            fx: {skill:{diplomacy:3,riding:2},flag:"ch_page",newRel:{type:"friend",op:25}},
          },
          {
            t: "Cry, and go anyway",
            r: "You cry all the first night, quietly. Then you get up and serve at table, because that is what is done.",
            fx: {wil:1.5,skill:{diplomacy:2},flag:"ch_page"},
          },
          {
            t: "Beg to stay and learn the manor",
            check: {s:"diplomacy",s2:"int",d:22},
            win: {
              r: "Your father relents. You learn rents, tithes and drainage at his elbow instead.",
              fx: {skill:{stewardship:4},rel:{who:"father",op:4}},
            },
            lose: {
              r: "You go anyway, red-eyed and sulking. The other pages notice.",
              fx: {skill:{diplomacy:1},happy:-4,flag:"ch_page"},
            },
          },
        ],
      },
      {
        id: "ch_gent_sword",
        cool: 4,
        cond: (p,C)=>AA(p,C,8,16)&&ST(p,"gentry","noble","royal"),
        setup: (p,ctx)=>{ctx.teacher=HIGH(p)?"the master-at-arms":"your father's old sergeant"},
        title: "Wooden swords",
        text: (p,ctx)=>`${A.cap(ctx.teacher)} puts a wooden sword in your hand, twice the weight of a real one. "Again," he says. "Again. Again."`,
        choices: [
          {
            t: "Drill until your hands blister",
            r: "Your hands bleed, then harden. The cuts start to come without thinking.",
            fx: {skill:{sword:4},sta:.5,wil:.6},
          },
          {
            t: "Sneak a real blade from the armory",
            check: {s:"spd",s2:"sword",d:24},
            win: {
              r: "You practice with sharp steel behind the stables. It feels like the truth.",
              fx: {skill:{sword:4},ins:.5,trait:"impetuous"},
            },
            lose: {
              r: "The blade bites your own arm. It needs stitches, and an explanation.",
              fx: {skill:{sword:2},wound:"scar_arm",health:-6,cause:"a sword cut"},
            },
          },
          {
            t: "Ask to learn footwork first",
            r: '"Good," he grunts. "Most boys want to swing." You learn where to stand.',
            fx: {skill:{sword:2},spd:.6,trait:"patient"},
          },
        ],
      },
      {
        id: "ch_nob_tutor",
        cool: 4,
        w: 1.6,
        cond: (p,C)=>AA(p,C,6,15)&&ST(p,"noble","royal","gentry"),
        setup: (p,ctx)=>{ctx.subj=sunland(p)?"Old Solen grammar":A.pick(["letters and sums","the histories of "+A.realmShort(p.realm),"the genealogies of the great houses","the law of "+A.realmShort(p.realm),"geography and the names of every realm"]),ctx.tut=A.pick(["a dry old cleric","a nervous young scholar","a stern woman who taught your mother","a foreign master who smells of ink"])},
        title: "The tutor",
        text: "Your tutor, {tut}, drills you in {subj} every morning while the sun shines on the yard outside.",
        choices: [
          {
            t: "Work hard",
            check: {s:"learning",s2:"int",d:22},
            win: {
              r: "You surprise your tutor, and then yourself.",
              fx: fx2({skill:{learning:4},int:.6,literate:!0}, p=>sunland(p)&&!p.langs.includes("Old Solen")&&A.chance(.5)?(p.langs.push("Old Solen"),"(You learn Old Solen.)"):""),
            },
            lose: {r:"It goes in one ear and out the window.",fx:{skill:{learning:2},literate:!0}},
          },
          {
            t: "Play a prank on {tut}",
            check: {s:"intrigue",s2:"spd",d:22},
            win: {
              r: "A frog in the inkwell. The scream is heard in the kitchens. Nobody can prove it was you.",
              fx: {happy:6,skill:{intrigue:2}},
            },
            lose: {r:"Caught. The rod, and a letter to your father.",fx:{health:-3,wil:.8,happy:-3}},
          },
          {
            t: "Ask about {enemy}",
            r: "You ask why we hate {enemy}. The tutor tells you the official answer, then, quietly, the real one.",
            fx: {skill:{diplomacy:2,tactics:1},int:.4,trait:"curious"},
          },
        ],
      },
      {
        id: "ch_nob_pony",
        once: !0,
        w: 2,
        cond: (p,C)=>AA(p,C,4,10)&&ST(p,"noble","royal","gentry")&&!["giant","dwarf"].includes(p.race),
        setup: (p,ctx)=>{ctx.pony=A.pick(["a fat grey pony called Bramble","a shaggy brown pony with a wicked eye","a dun mare older than you","a white pony with one blue eye"])},
        title: "A pony",
        text: "You are given {pony}. Your very own. The grooms stand round, grinning, waiting to see what you do.",
        choices: [
          {
            t: "Climb straight on",
            check: {s:"riding",s2:"spd",d:18},
            win: {
              r: "Round the yard, out the gate, and back again with your hair full of wind. The grooms cheer.",
              fx: {skill:{riding:4},happy:6,trait:"brave"},
            },
            lose: {
              r: "The pony puts you in the water trough. Everybody laughs except you.",
              fx: {skill:{riding:2},wil:.6,health:-2},
            },
          },
          {
            t: "Groom it and feed it first",
            r: "You spend the day with brush and apples. By evening the pony follows you like a dog.",
            fx: {skill:{husbandry:3,riding:2},trait:"patient"},
          },
          {
            t: "Ask the head groom to teach you properly",
            r: "The old groom shows you seat, hands and heels. You will ride well all your life.",
            fx: {skill:{riding:4},newRel:{type:"mentor",op:25}},
          },
        ],
      },
      {
        id: "ch_nob_hawk",
        once: !0,
        w: 2,
        cond: (p,C)=>AA(p,C,9,16)&&ST(p,"noble","royal")&&p.race!=="giant",
        setup: (p,ctx)=>{ctx.bird=steppe(p)?"a young saker falcon":p.sex==="F"?"a merlin, the lady's hawk":"a merlin, small and fierce"},
        title: "Your first hawk",
        text: "The falconer brings you {bird}, hooded on a glove too big for your hand. A bird is a lord's mark. A bird you lose is a story people tell.",
        choices: [
          {
            t: "Man her slowly, night after night",
            check: {s:"husbandry",s2:"wil",d:22},
            win: {
              r: "You sit up three nights running with her on your fist. By midsummer she comes to the lure and kills cleanly.",
              fx: {skill:{husbandry:4},trait:"patient",happy:5,fame:1},
            },
            lose: {
              r: "She bates and screams and will not settle. The falconer takes her back, kindly.",
              fx: {skill:{husbandry:2},wil:.8},
            },
          },
          {
            t: "Fly her at once",
            check: {s:"husbandry",s2:"ins",d:30},
            win: {
              r: "Mad luck: she takes a lark on the first flight and comes back to you. The falconer crosses himself.",
              fx: {skill:{husbandry:3},happy:6,fame:1},
            },
            lose: {
              r: "She flies off over the woods and never comes back. Everyone at court hears about it.",
              fx: {happy:-6,fame:-1,wil:1,trait:"impetuous"},
            },
          },
          {
            t: "Leave her with the falconer, and watch him",
            r: "You learn more by watching than you would have by failing.",
            fx: {skill:{husbandry:3},int:.3},
          },
        ],
      },
      {
        id: "ch_nob_precedence",
        cool: 6,
        w: 1.5,
        cond: (p,C)=>AA(p,C,7,15)&&ST(p,"noble","royal","gentry"),
        title: "Who walks first",
        text: p=>`Precedence lessons: who walks before whom into hall, who sits above the salt, how deep to bow to a ${A.pick(["count","bishop","duke's widow","foreign envoy","royal bastard"])}. Tomorrow there is a feast, and you will seat the guests.`,
        choices: [
          {
            t: "Learn the order perfectly",
            check: {s:"diplomacy",s2:"int",d:22},
            win: {
              r: "Every guest is seated exactly right. A great lady you have never met remarks on it.",
              fx: {skill:{diplomacy:4},fame:1},
            },
            lose: {
              r: "You put a baron below a knight. He does not forget it, and nor does your mother.",
              fx: {skill:{diplomacy:2},happy:-3,wil:.6},
            },
          },
          {
            t: "Seat one guest wrong on purpose, to watch",
            r: "You watch the insulted man's face, and his friends' faces. You learn who is allied with whom in one evening.",
            fx: {skill:{intrigue:4},trait:"deceitful"},
          },
          {
            t: "Ask why any of it matters",
            r: '"Because men have killed each other over a chair," says your tutor. "Learn it."',
            fx: {int:.5,skill:{diplomacy:2},trait:"cynical"},
          },
        ],
      },
      {
        id: "ch_nob_betrothal",
        once: !0,
        w: 1.8,
        cond: (p,C)=>AA(p,C,6,15)&&ST(p,"noble","royal"),
        setup: (p,ctx)=>{const hs=Object.values(LORE.houses||{}).filter(h2=>h2&&h2.realm===p.realm&&h2.name&&h2.kind!=="royal"&&!/extinct/.test(h2.title||"")),h=hs.length?A.pick(hs):null;ctx.house=h?String(h.name):"a great house of "+A.realmShort(p.realm),ctx.match=A.givenName(p.cult,p.sex==="M"?"F":"M"),ctx.age2=String(A.ri(2,14))},
        title: "A match",
        text: "Over supper you hear your parents talk about you as if you were not there. A betrothal: {match} of {house}, aged {age2}. Land, a border, an old feud mended. Nobody has asked you.",
        choices: [
          {
            t: "Say nothing. This is how it is done",
            r: "You have always known you were a piece on the board. Now you know which square.",
            fx: {flag:"ch_betrothed",skill:{diplomacy:2},trait:"content"},
          },
          {
            t: "Ask to meet {match} first",
            check: {s:"diplomacy",s2:"wil",d:22},
            win: {
              r: "A visit is arranged. {match} is awkward and shy and makes a good joke about the dogs. It could be worse.",
              fx: {flag:"ch_betrothed",happy:4,skill:{diplomacy:2}},
            },
            lose: {
              r: '"Children do not choose," says your father, and that is that.',
              fx: {flag:"ch_betrothed",happy:-3,wil:.6},
            },
          },
          {
            t: "Refuse loudly",
            r: "You make a scene. The betrothal goes ahead anyway, but everyone now knows you have a temper.",
            fx: {flag:"ch_betrothed",trait:"stubborn",rel:{who:"father",op:-6},wil:1},
          },
        ],
      },
      {
        id: "ch_roy_hostage",
        once: !0,
        w: 1.8,
        cond: (p,C)=>AA(p,C,6,15)&&p.status==="royal",
        setup: (p,ctx)=>{const e=A.enemyRealmOf(p.realm),r=e&&A.realm(e)?A.realm(e):null;ctx.court=r?`${r.capital}, the court of ${A.realmShort(e)}`:"a foreign court"},
        title: "Hostage",
        text: "A treaty needs a pledge, and you are it. You are sent to live at {court} as a ward, which is a polite word for hostage. If your family breaks the peace, your life is the price.",
        choices: [
          {
            t: "Bear it with dignity",
            r: "You learn to smile at men who would kill you on an order, and to sleep anyway. Two years later you come home older than your years.",
            fx: {wil:2.5,skill:{diplomacy:4},flag:"ch_hostage",trait:"calm"},
          },
          {
            t: "Befriend your hosts' children",
            check: {s:"diplomacy",s2:"int",d:24},
            win: {
              r: "By the time you go home, the heir of your enemies is your friend. That may matter one day.",
              fx: {skill:{diplomacy:4},flag:"ch_hostage",newRel:{type:"friend",op:35}},
            },
            lose: {r:"They never trust you. You are lonely every day of it.",fx:{wil:2,happy:-6,flag:"ch_hostage"}},
          },
          {
            t: "Keep your eyes open and learn their secrets",
            check: {s:"intrigue",s2:"ins",d:24},
            win: {
              r: "You come home with the names of their captains, the state of their walls, and which lords hate their king.",
              fx: {skill:{intrigue:5},flag:"ch_hostage",int:.5},
            },
            lose: {
              r: "You are caught in the wrong corridor, and watched closely ever after.",
              fx: {skill:{intrigue:2},wil:1.5,flag:"ch_hostage"},
            },
          },
        ],
      },
      {
        id: "ch_roy_courtiers",
        cool: 5,
        w: 1.6,
        cond: (p,C)=>AA(p,C,6,16)&&ST(p,"royal","noble"),
        setup: (p,ctx)=>{ctx.ask=A.pick(["to mention his son to your father","to say a kind word about a disgraced lord","which of your parents' councillors is in favor","what was said at dinner last night","to pass a sealed letter to your mother"])},
        title: "Watched",
        text: "Everyone at court watches you: how you eat, who you smile at, whether you look sickly. Today a courtier with a soft voice brings you sugared almonds, and asks you {ask}.",
        choices: [
          {
            t: "Take the almonds and promise",
            r: "You promise, and he goes away happy. You realize you have something people want.",
            fx: {skill:{intrigue:2},trait:"deceitful",happy:2},
          },
          {
            t: "Tell your parent about him",
            r: "He is not seen at court again. Your parent pats your head, and looks at you thoughtfully.",
            fx: {skill:{intrigue:3},rel:{who:"father",op:5},trait:"loyal"},
          },
          {
            t: "Ask what he will give you for it",
            check: {s:"intrigue",s2:"int",d:24},
            win: {
              r: "He laughs, startled, and pays you in news instead of sugar. You start keeping a list.",
              fx: {skill:{intrigue:4,diplomacy:1},int:.5,trait:"ambitious"},
            },
            lose: {r:"He tells the story at dinner as a joke about greedy children.",fx:{fame:-1,happy:-3}},
          },
        ],
      },
      {
        id: "ch_roy_poison",
        once: !0,
        w: 1.4,
        cond: (p,C)=>AA(p,C,5,16)&&p.status==="royal",
        setup: (p,ctx)=>{ctx.taster=A.givenName(p.cult,A.pick(["M","F"])),ctx.dish=A.pick(["a dish of quince paste","your milk","a honey cake sent as a gift","the venison stew"])},
        title: "The taster",
        text: 'Your taster, {taster}, falls down retching after trying {dish}. Physicians come running. Nobody says the word "poison" in front of you, which is how you know.',
        choices: [
          {
            t: "Refuse to eat for days",
            r: "You live on bread you watch being baked. You will never again eat without thinking about it.",
            fx: {wil:2,health:-4,trait:"craven"},
          },
          {
            t: "Find out who sent it",
            check: {s:"int",s2:"intrigue",d:28},
            win: {
              r: "A kitchen boy remembers a stranger with a gift. You tell the right person. Someone disappears.",
              fx: {skill:{intrigue:5},int:.6,fame:1},
            },
            lose: {
              r: "Every trail goes cold. Somewhere in the palace, someone wants you dead and is still smiling at you.",
              fx: {skill:{intrigue:2},wil:1.5,flag:"ch_poison_enemy"},
            },
          },
          {
            t: "Visit {taster} at the sickbed",
            r: (p,ctx)=>`${ctx.taster} ${A.chance(.6)?"lives, and weeps when you come":"dies the next morning with your hand in theirs"}. Nobody else at court visited.`,
            fx: {trait:"kind",wil:1,honor:3},
          },
        ],
      },
      {
        id: "ch_learn_priest",
        once: !0,
        w: 1.8,
        cond: (p,C)=>AA(p,C,6,15)&&!p.literate&&!RICH(p)&&!["elf","dwarf","orc","giant"].includes(p.race)&&!steppe(p),
        setup: (p,ctx)=>{ctx.priest=priestWord(p)},
        title: "Letters",
        text: "In {home}, as in most places, almost nobody can read. But {priest} has noticed you, and offers to teach you your letters on winter evenings, if your family can spare you.",
        choices: [
          {
            t: "Study every evening",
            check: {s:"int",s2:"learning",d:24},
            win: {
              r: "One night the marks on the page turn into words. You read a whole psalm aloud and nearly cry.",
              fx: fx2({literate:!0,skill:{learning:4},int:.6},school),
            },
            lose: {r:"It is slow, slow work. But you keep going.",fx:fx2({skill:{learning:2},wil:.6},school)},
          },
          {
            t: "Trade chores for lessons",
            r: "You chop wood and sweep for {priest} in return. Lessons come between the work, a letter at a time.",
            fx: fx2({sta:.4,skill:{learning:2,faith:1}},school),
          },
          {
            t: "Your family needs you in the fields",
            r: "Your father says no. Letters do not fill bellies. Maybe he is right.",
            fx: {skill:{husbandry:2},happy:-2},
          },
        ],
      },
      {
        id: "ch_learn_lang",
        cool: 8,
        cond: (p,C)=>AA(p,C,6,16)&&(C.town(p)||C.coast(p)),
        setup: (p,ctx)=>{const opts=GD.LANG_LIST.filter(l=>!p.langs.includes(l)&&!["Old Solen","Corsair cant","Hall Tongue"].includes(l));ctx.lng=opts.length?A.pick(opts):"Well Speech",ctx.who=A.pick(["a sailor's child off a ship from far away","a trader's boy who sells ribbons","a foreign girl whose father is an envoy","an old soldier who served abroad","a fosterling from over the border"])},
        title: "Strange words",
        text: "You make friends with {who}, who speaks {lng} and only a little of your tongue. You point at things. They say words.",
        choices: [
          {
            t: "Learn every word you can",
            check: {s:"int",s2:"learning",d:22},
            win: {
              r: "By the end of the season you can swear, bargain and tell jokes in a new tongue.",
              fx: (p,ctx)=>A.applyFx(p,{lang:ctx.lng,int:.5},ctx),
            },
            lose: {r:'You learn enough to say "hello", "bread" and three very rude words.',fx:{int:.3,happy:2}},
          },
          {
            t: "Teach them your tongue instead",
            r: "They learn faster than you expected. You make a friend who will always owe you.",
            fx: {skill:{diplomacy:2},newRel:{type:"friend",op:25}},
          },
          {t:"Laugh at their accent",r:"They stop coming round.",fx:{trait:"proud"}},
        ],
      },
      {
        id: "ch_apprentice",
        once: !0,
        w: 3,
        cond: (p,C)=>AA(p,C,12,15)&&!p.job&&ST(p,"peasant","artisan","merchant")&&!["elf","dwarf","giant","orc"].includes(p.race),
        setup: (p,ctx)=>setMaster(p,ctx),
        title: "Bound for seven years",
        text: "At your age children are bound to a master for seven years, to live in his house and be paid in food and blows. Your family has asked around. What will you be?",
        choices: [
          {
            t: "Apprentice to {master} the smith",
            r: "You will sweat at {master}'s forge for seven years. Your arms already ache at the thought.",
            fx: {job:"smith",skill:{craft:3},str:.5,them:{type:"mentor",op:20,back:"student"}},
          },
          {
            t: "Apprentice to {master} the carpenter",
            r: "Sawdust, glue, and a master who can build a roof without a single nail.",
            fx: {job:"carpenter",skill:{craft:3},them:{type:"mentor",op:20,back:"student"}},
          },
          {
            t: "Apprentice to {master} the weaver and dyer",
            r: "Blue hands for life. The guild hall smells of urine and money.",
            fx: {job:"weaver",skill:{craft:3},int:.3,them:{type:"mentor",op:20,back:"student"}},
          },
          {
            t: "Go as pot-boy to the inn",
            r: "You will carry ale and hear every story that comes down the road.",
            fx: {job:"brewer",skill:{trade:2,diplomacy:1}},
          },
          {
            t: "Ride with a trader",
            req: (p,C)=>C.ageAdj(p)>=13&&p.status==="merchant",
            r: "You ride with {master}, the family's agent. Mules, tolls, inns and lies.",
            fx: {job:"merchant",skill:{trade:3},them:{type:"mentor",op:20,back:"student"}},
          },
          {
            t: "Stay and work the family land",
            r: "The land needs hands. It will need yours until you are old.",
            fx: {job:"farm",skill:{husbandry:3},sta:.5},
          },
        ],
      },
      {
        id: "ch_teen_crush",
        cool: 4,
        cond: (p,C)=>AA(p,C,12.5,16),
        setup: (p,ctx)=>{setPal(p,ctx,"friend",p.flags.likes||(p.sex==="M"?"F":"M")),ctx.where=A.pick(["at the well","across the temple","at the market","by the river","at the harvest dance","in the hall at supper"])},
        title: "A face",
        text: "You keep seeing {them} {where}. Your stomach does something strange every time. You have started taking the long way round just to walk past.",
        choices: [
          {
            t: "Give {khim} a small gift",
            check: {s:"diplomacy",s2:"wil",d:22,bonus:p=>p.looks/5-10},
            win: {
              r: ()=>`You give ${A.pick(["a carved bird","a ribbon from the fair","a handful of wild strawberries","a smooth river stone with a hole in it"])}. {them} smiles, and keeps it.`,
              fx: {them:{type:"friend",op:25},happy:7,flag:"ch_first_love"},
            },
            lose: {
              r: "{them} laughs, not unkindly, and walks off with friends. You want the earth to swallow you.",
              fx: {happy:-5,wil:.6,them:{type:"acquaint",op:3}},
            },
          },
          {
            t: "Ask a friend to find out how {khe} feels",
            r: ()=>A.pick(["Your friend tells everyone. Everyone. It is weeks before you can show your face.","Your friend comes back grinning: {them} has noticed you too."]),
            fx: {happy:2,them:{type:"acquaint",op:8}},
          },
          {
            t: "Write {khim} a note",
            req: p=>p.literate,
            r: "You write it eleven times. {them} cannot read, so {khe} has to ask the priest. Mortifying, and somehow it works.",
            fx: {them:{type:"friend",op:20},happy:5,skill:{learning:1}},
          },
          {
            t: "Admire {khim} from afar",
            r: "You never say a word. It is perfect that way, and it hurts a little.",
            fx: {happy:1,trait:"shy"},
          },
        ],
      },
      {
        id: "ch_teen_wage",
        once: !0,
        w: 1.8,
        cond: (p,C)=>AA(p,C,12,16)&&ST(p,"peasant","serf","artisan")&&!["elf","dwarf","giant"].includes(p.race),
        title: "A grown-up's share",
        text: "This harvest you do a full share of the work for the first time: dawn to dusk from First Loaf to Harvest Home, at a sun and a half a day and all the ale you can drink. At the end, the coins are in your hand.",
        choices: [
          {
            t: "Give it all to the family",
            r: "You put the coins on the table without a word. Your mother turns away so you will not see her face.",
            fx: {family:8,trait:"loyal",rel:{who:"mother",op:6},sta:.5},
          },
          {
            t: "Keep it",
            r: "Your first money, your own. You hide it under a loose stone.",
            fx: {coin:8,trait:"ambitious",sta:.5},
          },
          {
            t: "Spend it at the fair",
            r: "A knife, a belt, sweets, a ribbon, and a hangover. Worth it.",
            fx: {coin:2,happy:8,sta:.5},
          },
        ],
      },
      {
        id: "ch_teen_brawl",
        cool: 6,
        cond: (p,C)=>AA(p,C,13,16),
        setup: (p,ctx)=>{setPal(p,ctx,"rival"),ctx.insult=A.pick(["your mother","your family's name","the way you talk","your friend","your father's debts"])},
        title: "Behind the barn",
        text: "{them} has been saying things about {insult}. Everyone has heard. Today {khe} said it to your face, and a ring of youths is already forming.",
        choices: [
          {
            t: "Fight",
            r: "You put up your fists.",
            fx: {
              them: {type:"rival",op:-10},
              duel: {
                foe: "them",
                opts: {kind:"brawl",lethal:!1,toYield:!0,place:"behind the barn",title:"A fight behind the barn"},
              },
            },
          },
          {
            t: "Talk {khim} down",
            check: {s:"diplomacy",s2:"wil",d:26},
            win: {
              r: "You make {them} look small without throwing a punch. The ring breaks up, disappointed.",
              fx: {skill:{diplomacy:3},them:{type:"rival",op:-5},fame:1},
            },
            lose: {
              r: "Your words come out shaky. {them} shoves you over and walks off laughing.",
              fx: {happy:-4,wil:1,them:{type:"rival",op:-8}},
            },
          },
          {
            t: "Walk away",
            r: "You turn your back on {them}. It takes more nerve than they will ever understand.",
            fx: {trait:"calm",wil:1,happy:-2},
          },
        ],
      },
      {
        id: "ch_coming_of_age",
        once: !0,
        w: 4,
        cond: (p,C)=>AA(p,C,14.4,16)&&p.race!=="dwarf",
        setup: (p,ctx)=>{ctx.rite=p.race==="elf"?"Soon you will be fifty, and grown under elven law. The Keepers of your grove call you before the birth tree to ask what you have learned in half a century":p.race==="giant"?"At the next Thing you will stand with the grown giants of the halls. The eldest asks you to chant your line, every Mother of it":p.race==="orc"||p.race==="halforc"&&orcLand(p)?"This winter the clan will count you grown. The clan-mothers watch you at the fire, weighing what deed-name you will earn":p.faith==="REL-03"?"In the village hall you swear your first oath on the iron ring, before the Seven and the whole village":p.faith==="REL-07"?"This year you keep the whole Dry Month fast for the first time, like a grown man or woman":p.faith==="REL-01"?"At the dawn rite on Return Day you stand among the grown, facing east, and the dawnkeeper counts you one of the congregation":p.faith==="REL-06"?"You walk the circuit of Lake Bluespire with the grown-ups for the first time, turning every prayer wheel":p.faith==="REL-11"||p.faith==="REL-14"?"You are given your own horse and saddle, and a place at the men's and women's side of the tent":`${A.provName(p.home)} counts you grown: a full share of work, a full share of blame`},
        title: "Coming of age",
        text: "{rite}. You are not a child any longer, whatever you feel inside.",
        choices: [
          {
            t: "Make a solemn vow",
            r: "You swear it with your whole heart. You will try to keep it all your life.",
            fx: {honor:4,piety:3,wil:1,trait:"honest"},
          },
          {
            t: "Celebrate",
            r: "You eat, drink and dance until the sun comes up, and wake up grown, with a headache.",
            fx: {happy:8,trait:"gregarious",newRel:{type:"friend",op:25}},
          },
          {
            t: "Ask for something of your own",
            check: {s:"diplomacy",s2:"wil",d:24},
            win: {
              r: "A tool, a beast, a small purse: your own, to start with. Your family can just about spare it.",
              fx: {coin:10,family:-10,trait:"ambitious"},
            },
            lose: {r:'"You will get yours when we are dead," says your father, not unkindly.',fx:{happy:-2}},
          },
          {
            t: "Walk off alone to think",
            r: "You sit on a hill and look at everything that has been your whole world. It looks smaller now.",
            fx: {wil:1,int:.4,trait:"calm"},
          },
        ],
      },
      {
        id: "ch_ill_fever",
        cool: 7,
        w: 1.1,
        cond: (p,C)=>AA(p,C,3,15)&&!["elf"].includes(p.race),
        setup: (p,ctx)=>{ctx.priest=priestWord(p),ctx.ill=p.race==="dwarf"?"a lowland fever brought up from the human towns":p.race==="giant"?"a summer heat-fever":A.pick(["the spotted fever","a lung fever","the throat sickness","the bloody flux","the coughing sickness"])},
        title: "Fever",
        text: "You wake burning. It is {ill}. Through the haze you see your mother's face, and behind her the neighbors, standing at the door the way people stand at doors when a child is sick.",
        choices: [
          {
            t: "Hold on",
            check: {s:"sta",s2:"wil",d:22},
            win: {
              r: "On the seventh day you sit up and ask for bread. Your mother laughs and cries at the same time.",
              fx: {wil:1.5,health:-6},
            },
            lose: {
              r: "You live, but it takes everything. When you can stand again, you are thinner, and you look older.",
              fx: p=>{if(p.health=Math.max(1,p.health-16),p.lastHurt="a childhood fever",A.willGrow(p,2.5),A.chance(.35)){const w=A.addWound(p,A.pick(["scar_face","lungs"]));return w?"("+w+")":""}return""},
            },
          },
          {
            t: "Drink every bitter brew they give you",
            check: {s:"sta",d:20},
            win: {
              r: "The brews taste of mud and bark. It breaks on the fifth night.",
              fx: {health:-5,skill:{medicine:1}},
            },
            lose: {
              r: "The brews make you sicker before you get better.",
              fx: {health:-12,cause:"a childhood fever",wil:1.5},
            },
          },
          {
            t: "Ask for {priest}",
            r: "The prayers are a comfort, whatever else they are. You live.",
            fx: {piety:5,health:-8,cause:"a childhood fever",skill:{faith:2}},
          },
        ],
      },
      {
        id: "ch_ill_playmate",
        cool: 9,
        w: .9,
        cond: (p,C)=>AA(p,C,5,15)&&!["elf","giant"].includes(p.race),
        // [X1 baked patch events/99999-v2-content V2C-TOY-ARTICLE] The small grave ("Today there is a small grave, and
        // {npc}'s {toy} is lying in the lane") and its choice "Keep the {toy}" took a toy with its article, so the card
        // read "Edda's a wooden horse" and "Keep the a slingshot" (playtest 2, new #19). The toy is named bare; the list
        // keeps its length and order, so the pick draws the same.
        setup: (p,ctx)=>{ctx.npc=A.givenName(p.cult,A.pick(["M","F"])),ctx.how=A.pick(["the summer flux","a fever that took three days","a fall through the river ice","the coughing sickness","a kick from a horse","nobody knows what"]),ctx.toy=A.pick(["bone whistle","wooden horse","clay marble","slingshot","corn doll"])},
        title: "A small grave",
        text: "{npc}, who you played with every day, is dead of {how}. Yesterday you were racing. Today there is a small grave, and {npc}'s {toy} is lying in the lane where it was dropped.",
        choices: [
          {
            t: "Go to the burial",
            r: "You stand at the grave with the grown-ups. You do not understand it. You will carry it anyway.",
            fx: {wil:1.5,piety:2,happy:-6},
          },
          {
            t: "Keep the {toy}",
            r: "You keep it all your life. Sometimes you hold it and say the name out loud.",
            fx: {wil:1,happy:-5,flag:"ch_kept_toy"},
          },
          {
            t: "Ask the priest why",
            r: p=>`${A.cap(priestWord(p))} talks about ${A.godWord(p)} and the will of heaven. ${A.chance(.5)?"It helps a little.":"It does not help at all."}`,
            fx: p=>{A.trainSkill(p,"faith",2),A.willGrow(p,1),A.chance(.4)&&A.addTrait(p,"cynical")},
          },
          {
            t: "Run to the woods and cry where nobody can see",
            r: "You cry until you are empty, then go home and eat your supper.",
            fx: {wil:1.5,happy:-4,trait:"shy"},
          },
        ],
      },
      {
        id: "ch_ill_accident",
        cool: 7,
        cond: (p,C)=>AA(p,C,5,16),
        setup: (p,ctx)=>{ctx.acc=p.race==="dwarf"?"A rock shifts in the gallery and pins your leg":p.race==="giant"?"You slip on wet rocks at the shore and fall your own height, which for a giant is a long way":steppe(p)?"A half-broken colt throws you onto hard ground":A.pick(["A cart horse kicks you in the yard","You fall through the hayloft floor","The axe glances off a knot and into your leg","You fall off the barn roof","An ox treads on your foot and then leans"])},
        title: "An accident",
        text: "{acc}. Something is badly wrong. It hurts more than anything has ever hurt.",
        choices: [
          {
            t: "Grit your teeth while they set it",
            check: {s:"wil",d:22},
            win: {
              r: "You do not scream. The bonesetter says you have more grit than most soldiers. It heals clean.",
              fx: {wil:1.5,health:-6,cause:"an accident"},
            },
            lose: {
              r: "You scream the house down. It heals, but not quite straight.",
              fx: {wil:1,health:-8,cause:"an accident",wound:"bad_knee"},
            },
          },
          {
            t: "Hide it, so you will not be punished",
            check: {s:"sta",d:26},
            win: {
              r: "You limp for a month and nobody notices. Somehow it mends.",
              fx: {wil:1,health:-6,trait:"deceitful"},
            },
            lose: {
              r: "By the time they find out, it has gone bad. You will walk with a limp all your life.",
              fx: {health:-12,cause:"a wound gone bad",wound:"limp",wil:2},
            },
          },
          {
            t: "Scream for your mother",
            r: "She comes running. Being held helps more than anyone admits.",
            fx: {health:-7,cause:"an accident",rel:{who:"mother",op:5}},
          },
        ],
      },
      {
        id: "ch_fest_child",
        cool: 3,
        cond: (p,C)=>AA(p,C,4,13),
        setup: (p,ctx)=>{ctx.fest=faithFest(p),ctx.sight=p.race==="elf"?"lanterns in every branch of the grove":p.race==="dwarf"?"every forge in the hold relit from the First Hall's fire":steppe(p)||p.race==="orc"?"horse races, wrestling and drums that shake your ribs":p.race==="giant"?"whale fat roasting in fire-pits the size of houses":A.pick(["bonfires, music and roasting meat","garlands on every door and lamps in every window","priests in procession and a dancing bear","jugglers, sweet cakes and a puppet show"])},
        title: "Feast day",
        text: "It is {fest}! To a child it is the best day in the world: {sight}.",
        choices: [
          {
            t: "Eat until you are sick",
            r: "Honey cakes, roast fat, sugared nuts. You are sick behind the shrine, and it was worth it.",
            fx: {happy:6,health:-1},
          },
          {
            t: "Watch the rites",
            r: "You watch every gesture of the rite. Something in it holds you. {god} feels very close.",
            fx: {piety:4,skill:{faith:1}},
          },
          {
            t: "Run wild with the other children",
            r: "You run with a pack of children until midnight and make a friend you will keep for years.",
            fx: {happy:4,newRel:{type:"friend",op:25}},
          },
          {
            t: "Slip off to see what the grown-ups get up to",
            check: {s:"stealth",s2:"int",d:20},
            win: {
              r: "You see who kissed who behind the brewhouse. Knowledge is power, even at your age.",
              fx: {skill:{stealth:2,intrigue:2}},
            },
            lose: {r:"You get lost in the crowd and cry until a stranger takes you home.",fx:{happy:-3,wil:.5}},
          },
        ],
      },
      {
        id: "ch_fest_fair",
        cool: 4,
        cond: (p,C)=>AA(p,C,5,15)&&!["elf","giant"].includes(p.race),
        title: "The fair",
        text: p=>`It is ${A.pick(["May Fair","the Slaughter Feast fair","market day before Harvest Home","the spring horse fair"])} at ${A.provName(p.home)}, and someone has given you a whole penny. The stalls go on forever.`,
        choices: [
          {
            t: "A honey cake",
            r: "You eat it slowly, one crumb at a time, on the church steps. Perfect.",
            fx: {happy:5},
          },
          {
            t: "A bone whistle",
            r: "You play it until the whole family begs you to stop, and then you play it some more.",
            fx: {skill:{music:2},happy:3},
          },
          {
            t: "Bet it on the cup-and-ball man",
            check: {s:"ins",s2:"int",d:24},
            win: {
              r: "You watch his hands, not the cups, and win three pennies. He looks at you with respect and moves on.",
              fx: {coin:1,ins:.5,happy:4},
            },
            lose: {r:"The ball was never under any cup. You learn about the world.",fx:{int:.3,happy:-3}},
          },
          {
            t: "Save it",
            r: "You keep the penny in a knot in your shirt. Saving feels better than spending. Strange.",
            fx: {coin:1,trait:"patient"},
          },
        ],
      },
      {
        id: "ch_fest_slaughter",
        cool: 5,
        cond: (p,C)=>AA(p,C,6,15)&&p.race!=="elf"&&!ST(p,"noble","royal"),
        setup: (p,ctx)=>{ctx.beast=steppe(p)||p.race==="orc"?"a sheep":p.race==="giant"?"a walrus":A.pick(["the pig","the old cow","the goat"])},
        title: "Slaughter day",
        text: "Before winter the beasts that cannot be fed are killed. This year you are old enough to help with {beast}: hold the bowl for the blood, scald, scrape, cut.",
        choices: [
          {
            t: "Hold steady",
            check: {s:"wil",d:18},
            win: {
              r: "You do not flinch. By evening you know the inside of a beast as well as the outside.",
              fx: {skill:{husbandry:2,survival:1},wil:.6},
            },
            lose: {r:"You faint into the straw. Everyone teases you all winter.",fx:{happy:-2,wil:.6}},
          },
          {
            t: "Ask to make the killing stroke",
            check: {s:"str",s2:"wil",d:24},
            win: {
              r: "One clean stroke. The old men nod: it is a kindness to do it well.",
              fx: {skill:{husbandry:3},str:.3,trait:"brave"},
            },
            lose: {r:"You botch it. It takes far too long. You think about it at night.",fx:{wil:1,happy:-3}},
          },
          {
            t: "Run off before it starts",
            r: "You hear it from the woods anyway. At supper you eat the sausages.",
            fx: {happy:-1},
          },
        ],
      },
      {
        id: "ch_faith_lessons",
        cool: 5,
        cond: (p,C)=>AA(p,C,6,15),
        setup: (p,ctx)=>{ctx.clergy=priestWord(p);const r=ritual(p);ctx.rite=r.charAt(0).toLowerCase()+r.slice(1)},
        title: "Religious instruction",
        text: p=>`Every child must learn the ways of ${A.faith(p.faith)?"the "+String(A.faith(p.faith).name).replace(/^The /,""):"your faith"}. You are taught by {clergy}: today it is {rite}, and why it matters.`,
        choices: [
          {
            t: "Learn it all by heart",
            check: {s:"faith",s2:"int",d:20},
            win: {r:"You can recite every word, and you mean most of them.",fx:{skill:{faith:4},piety:4}},
            lose: {r:"You mix up the words and get a cuff, but some of it sticks.",fx:{skill:{faith:2},piety:1}},
          },
          {
            t: "Ask the hard question",
            check: {s:"int",s2:"diplomacy",d:22},
            win: {
              r: "You ask why {god} lets children die. The answer is long, careful and almost satisfying. You are noticed.",
              fx: {int:.6,trait:"curious",skill:{faith:2}},
            },
            lose: {
              r: "You ask why {god} lets children die, and are beaten for impudence. The question stays with you.",
              fx: {int:.4,trait:"cynical",health:-2},
            },
          },
          {
            t: "Daydream",
            r: "You watch a spider on the beam the whole time. You know a lot about spiders now.",
            fx: {happy:2},
          },
          {
            t: "Take it fiercely to heart",
            r: "It lights something in you. You start praying in secret, more than anyone asks.",
            fx: {piety:7,trait:"zealous",skill:{faith:2}},
          },
        ],
      },
      {
        id: "ch_elf_birthtree",
        once: !0,
        w: 2,
        cond: (p,C)=>AA(p,C,3,10)&&p.race==="elf",
        setup: (p,ctx)=>{ctx.tree=A.pick(["a young oak","a silver birch","a beech with a split trunk","an ash by the stream","a yew already older than the human kingdom of "+A.realmShort("POL-05")])},
        title: "Your birth tree",
        text: 'Your mother takes you to your birth tree, {tree}, where you were named. Your name is cut into the bark in leaf-hand, and the bark has grown round it. "It will be here when we are both long gone," she says.',
        choices: [
          {
            t: "Climb your tree",
            check: {s:"spd",d:18,bonus:p=>A.hasBlood(p,"lightfoot")?15:0},
            win: {
              r: "From the top you can see the whole grove. Your tree holds you like it knows you.",
              fx: {spd:.6,happy:5},
            },
            lose: {
              r: "You fall out of your own tree. Your mother laughs so hard she has to sit down.",
              fx: {health:-3,wil:.4},
            },
          },
          {
            t: "Lay your hand on the bark and listen",
            r: "You hear sap and wind and something you cannot name. You feel rooted for the first time.",
            fx: {piety:5,wil:1,skill:{faith:2}},
          },
          {
            t: "Ask the Grove Keeper to teach you leaf-hand",
            r: "The Keeper shows you the curved strokes. You carve your own name in a piece of fallen bark, badly.",
            fx: {skill:{learning:3},literate:!0,int:.4},
          },
        ],
      },
      {
        id: "ch_elf_lessons",
        cool: 5,
        w: 1.8,
        cond: (p,C)=>AA(p,C,4,15.5)&&p.race==="elf",
        setup: (p,ctx)=>{ctx.tutor=A.pick(["your mother","your father","an aunt three hundred years old","a Grove Keeper","a warden back from the Oak Line"]),ctx.yrs=String(A.ri(3,9))},
        title: "Fifty years of learning",
        text: "Elf children learn at home for fifty years: trees, herbs, the bow and the chants. This decade {tutor} is teaching you, and asks which you want to spend the next {yrs} years on.",
        choices: [
          {
            t: "Trees: every species, every season",
            r: "You learn to read a forest like a book, to know a dying oak a year before it falls.",
            fx: {skill:{survival:4},ins:.4},
          },
          {
            t: "Herbs: what heals and what kills",
            r: "Willow, yarrow, foxglove, hemlock. You learn the line between medicine and poison is a matter of measure.",
            fx: {skill:{medicine:4},int:.4},
          },
          {
            t: "The bow",
            check: {s:"bow",s2:"ins",d:22},
            win: {
              r: "A yew bow taller than you. By the end you can split a hazel wand at a hundred paces.",
              fx: {skill:{bow:5},ins:.5},
            },
            lose: {
              r: "The string slaps your forearm raw for years. Slowly, the arrows start to fly true.",
              fx: {skill:{bow:3},wil:.4},
            },
          },
          {
            t: "The chants",
            r: "Wordless songs older than the human kingdoms. You will sing them at funerals for four hundred years.",
            fx: {skill:{music:4,learning:1},piety:2},
          },
        ],
      },
      {
        id: "ch_elf_human_friend",
        once: !0,
        w: 1.3,
        cond: (p,C)=>AA(p,C,5,12)&&p.race==="elf",
        setup: (p,ctx)=>{ctx.hn=A.givenName("CUL-02",A.pick(["M","F"]))},
        title: "A human friend",
        text: "At the edge of the Oak Line you meet a human child, {hn}, from a farm beyond the trees. You look the same age. You are not: you are older than {hn}'s grandmother, and you will still be a child when {hn} is grown.",
        choices: [
          {
            t: "Be friends anyway",
            r: "You meet at the edge of the trees for years. Then {hn} is tall, then married, then grey. You visit the grave every spring for a century.",
            fx: {flag:"ch_short_friend",wil:2,happy:3,trait:"loyal"},
          },
          {
            t: "Teach {hn} to shoot",
            r: "In one human summer {hn} learns more than most elves in ten. Humans are frighteningly quick.",
            fx: {skill:{bow:2},int:.4,flag:"ch_short_friend"},
          },
          {
            t: "Listen to the elders and stay away",
            r: '"They wither like grass," your elders say. You obey, and wonder for a long time what you missed.',
            fx: {trait:"patient",wil:.5},
          },
        ],
      },
      {
        id: "ch_halfelf_tree",
        once: !0,
        w: 2,
        cond: (p,C)=>AA(p,C,4,13)&&p.race==="halfelf",
        title: "No tree",
        text: p=>`${p.realm==="POL-06"?"In Sylvaran every elf child is named under a birth tree.":"Your elven kin all have birth trees."} A half-elf never gets one. You will have no tree in the forest, and no grave inside the Oak Line. You only found out today, from another child.`,
        choices: [
          {
            t: "Plant a sapling of your own",
            r: "You dig up a little oak and plant it where nobody owns the ground. You carve your own name. It is crooked, and it is yours.",
            fx: {flag:"ch_own_tree",wil:1.5,trait:"stubborn",happy:3},
          },
          {
            t: "Ask your parents why",
            r: "They tell you the truth, gently. It is still a hard truth.",
            fx: {wil:1,int:.4,rel:{who:"mother",op:4}},
          },
          {
            t: "Decide you do not need their forest",
            r: "Fine. You will belong to the wide world instead. Humans, at least, ask fewer questions.",
            fx: {trait:"proud",skill:{diplomacy:2}},
          },
          {
            t: "Rage at the unfairness",
            r: "You break things. You shout. It does not change anything, but it is honest.",
            fx: {trait:"wrathful",wil:1},
          },
        ],
      },
      {
        id: "ch_dwarf_apprentice",
        once: !0,
        w: 2.5,
        cond: (p,C)=>AA(p,C,4,9)&&p.race==="dwarf"&&!p.job,
        setup: (p,ctx)=>setMaster(p,ctx),
        title: "Bound to a master",
        text: `Every dwarf child is bound to a master for twenty or thirty years, until the name-carving. Until then you will not even have your own name: you will be "{name}, {master}'s apprentice". Your clan elders have spoken to {master}, and {mhe} will take you into whichever craft you choose.`,
        choices: [
          {
            t: "The forge",
            r: "Thirty years of heat, hammer and secrets. {master} grunts, which you learn means welcome.",
            fx: fx2({job:"smith",skill:{craft:3},str:.4,them:{type:"mentor",op:20,back:"student"}}, (p,ctx)=>{p.flags.ch_master=ctx.master}),
          },
          {
            t: "The masons' guild",
            r: "You will cut stone that will outlast every human kingdom. {master} starts you on the chisel.",
            fx: fx2({job:"mason",skill:{craft:3},sta:.4,them:{type:"mentor",op:20,back:"student"}}, (p,ctx)=>{p.flags.ch_master=ctx.master}),
          },
          {
            t: "The deep mines",
            r: "Ore, bad air and darkness. {master} teaches you to listen to the rock before it speaks.",
            fx: fx2({job:"miner",skill:{craft:2,survival:2},sta:.5,them:{type:"mentor",op:20,back:"student"}}, (p,ctx)=>{p.flags.ch_master=ctx.master}),
          },
          {
            t: "The brewhouse",
            r: "Barley, yeast and patience. Dwarven beer is the best on Ardan, and {master} intends to keep it so.",
            fx: fx2({job:"brewer",skill:{trade:2,craft:1},them:{type:"mentor",op:20,back:"student"}}, (p,ctx)=>{p.flags.ch_master=ctx.master}),
          },
        ],
      },
      {
        id: "ch_dwarf_master",
        cool: 5,
        w: 1.8,
        cond: (p,C)=>AA(p,C,6,15.5)&&p.race==="dwarf",
        setup: (p,ctx)=>{ctx.master=typeof p.flags.ch_master=="string"?p.flags.ch_master:"your master",ctx.test=A.pick(["remake the same hinge seven times until it is perfect","carry ore up nine hundred steps without stopping","recite the carved law of contracts from memory","tend the furnace alone for three days and nights","find the flaw in a piece of work that looks flawless"])},
        title: "The master's test",
        text: '{master} sets you a test: {test}. "Twenty years from now," {master} says, "you will thank me."',
        choices: [
          {
            t: "Endure it",
            check: {s:"wil",s2:"sta",d:24},
            win: {
              r: "You do it. {master} says nothing at all, and gives you better work the next morning.",
              fx: {skill:{craft:4},wil:1.5,sta:.4},
            },
            lose: {
              r: "You fail, and start again, and fail, and start again. That is the real test.",
              fx: {skill:{craft:2},wil:2},
            },
          },
          {
            t: "Argue that there is a better way",
            check: {s:"int",s2:"craft",d:26},
            win: {
              r: "You prove it, on the anvil. {master} stares, then carves a mark on the wall. That is how innovations begin, every three hundred years.",
              fx: {skill:{craft:3},int:.8,trait:"stubborn",fame:1},
            },
            lose: {r:'"When your name is carved you may have opinions." Back to work.',fx:{skill:{craft:2},happy:-3}},
          },
          {
            t: "Ask an older apprentice for the trick",
            r: "There is always a trick, and there is always an older apprentice who will tell you for a share of your beer.",
            fx: {skill:{craft:2,diplomacy:2},newRel:{type:"friend",op:20}},
          },
        ],
      },
      {
        id: "ch_dwarf_namecarving",
        once: !0,
        w: 5,
        cond: (p,C)=>AA(p,C,15,16)&&p.race==="dwarf",
        setup: (p,ctx)=>{ctx.master=typeof p.flags.ch_master=="string"?p.flags.ch_master:"your master",ctx.trade=p.job&&GD.CAREERS[p.job.c]?GD.CAREERS[p.job.c].name.toLowerCase():"your craft"},
        title: "The name-carving",
        text: `After thirty years as "{name}, {master}'s apprentice", you stand before the Law-Carvers with your masterwork in {trade}. If they judge it worthy, your full name will be carved in stone, and you will be grown.`,
        choices: [
          {
            t: "Present your work with pride",
            check: {s:"craft",s2:"wil",d:30},
            win: {
              r: "The Eldest Carver turns your work in the lamplight a long time, then nods. Your name goes into the stone. It will be there in a thousand years.",
              fx: {flag:"ch_named",honor:5,fame:2,happy:8,deed:"Passed the name-carving"},
            },
            lose: {
              r: "They find a flaw. The carving goes ahead, as it must at thirty, but the flaw is noted beside your name forever.",
              fx: {flag:"ch_named",wil:2.5,honor:-2,deed:"Passed the name-carving, with a flaw noted"},
            },
          },
          {
            t: "Ask for a clan name from a deed",
            r: "You tell the carvers the hardest thing you did in thirty years. They carve it into your name.",
            fx: {flag:"ch_named",honor:3,fame:1,deed:"Took a deed-name at the name-carving"},
          },
          {
            t: "Honor {master} in your carving",
            r: "{master} has to turn away. Dwarves do not weep in public. {master} nearly does.",
            fx: {flag:"ch_named",honor:4,trait:"loyal",deed:"Honored a master at the name-carving"},
          },
        ],
      },
      {
        id: "ch_orc_ride",
        once: !0,
        w: 2,
        cond: (p,C)=>AA(p,C,2,7)&&(p.race==="orc"||p.race==="halforc"&&orcLand(p)),
        title: "Before you walk",
        text: "Orc children ride before they walk well. Your aunt ties you onto a sheep, then a pony, then a half-wild mare, and the whole camp shouts advice.",
        choices: [
          {
            t: "Kick for speed",
            check: {s:"riding",s2:"wil",d:16},
            win: {
              r: "You gallop round the camp twice, shrieking. The old riders bang their cups.",
              fx: {skill:{riding:4},trait:"brave",happy:5},
            },
            lose: {
              r: "The mare dumps you in a thorn bush. You climb back on, bleeding. The riders bang their cups anyway.",
              fx: {skill:{riding:2},wil:1,health:-3},
            },
          },
          {
            t: "Hold on and learn the horse",
            r: "You learn how a horse thinks before you learn to count.",
            fx: {skill:{riding:3,husbandry:2}},
          },
        ],
      },
      {
        id: "ch_orc_winter",
        cool: 4,
        w: 2,
        cond: (p,C)=>AA(p,C,3,14)&&(p.race==="orc"||p.race==="halforc"&&orcLand(p)),
        setup: (p,ctx)=>{ctx.when=A.pick(["the winter the lake froze to the bottom","the winter of white grass","the winter the herds died standing","the winter of the long wind"])},
        title: "An orc winter",
        text: "It is {when}, as the winter-count will call it. An orc eats twice what a human does, and the herds are thin. The clan-mothers ration every bowl. In the next tent, a baby has stopped crying.",
        choices: [
          {
            t: "Give half your share to the little ones",
            r: "You give it, and are hungry until the thaw. A clan-mother sees, and says nothing, and remembers.",
            fx: {trait:"generous",health:-7,cause:"the hunger of an orc winter",wil:2,honor:3},
          },
          {
            t: "Hunt marmots with the older youths",
            check: {s:"survival",s2:"str",d:24},
            win: {
              r: "You dig out a marmot colony and bring back enough to fill four bowls. You are counted a hunter now.",
              fx: {skill:{survival:4,bow:1},fame:1,health:2},
            },
            lose: {
              r: "The cold bites your fingers and the marmots stay asleep.",
              fx: {skill:{survival:2},health:-6,cause:"frost",wil:1.5},
            },
          },
          {
            t: "Steal from the clan-mothers' store",
            check: {s:"stealth",s2:"spd",d:26},
            win: {
              r: "Dried meat, three strips. Nobody knows. You feel stronger and smaller at once.",
              fx: {health:3,skill:{stealth:3},trait:"deceitful"},
            },
            lose: {
              r: "You are dragged to the fire and shamed before the whole clan. That is worse than hunger.",
              fx: {honor:-5,wil:2,happy:-6},
            },
          },
          {
            t: "Endure",
            r: "You learn the hunger of an orc winter. It never leaves you.",
            fx: {wil:2.5,health:-8,cause:"the hunger of an orc winter",sta:.4},
          },
        ],
      },
      {
        id: "ch_orc_clanmother",
        cool: 6,
        w: 1.8,
        cond: (p,C)=>AA(p,C,5,15)&&(p.race==="orc"||p.race==="halforc"&&orcLand(p)),
        setup: (p,ctx)=>{ctx.cm=A.givenName(p.cult,"F"),ctx.case=A.pick(["you refused a share of your food to a guest","you and a cousin both claim the same foal","you rode a horse from the hearth herd without leave","you knocked a smaller child into the fire"])},
        title: "Before the clan-mother",
        text: "The clan-mothers own the herds and the tents, and they speak the Law of the Fire. Clan-mother {cm} calls you to her fire, because {case}.",
        choices: [
          {
            t: "Tell the truth, all of it",
            r: '{cm} listens, then sets a fair penalty. "The one who lies at my fire," she says, "eats alone."',
            fx: {trait:"honest",honor:3,wil:.6},
          },
          {
            t: "Argue your case cleverly",
            check: {s:"diplomacy",s2:"int",d:24},
            win: {
              r: '{cm} laughs, a short bark. "This one will sit on a council one day." You win.',
              fx: {skill:{diplomacy:4},int:.5,fame:1},
            },
            lose: {r:"{cm} sees through every word. The penalty doubles.",fx:{skill:{diplomacy:1},honor:-2,happy:-3}},
          },
          {
            t: "Accept any judgment in silence",
            r: "{cm} respects that. Orcs value loyalty to the clan more than being right.",
            fx: {trait:"loyal",wil:1},
          },
        ],
      },
      {
        id: "ch_halforc_prejudice",
        cool: 6,
        w: 1.8,
        cond: (p,C)=>AA(p,C,5,15)&&p.race==="halforc",
        setup: (p,ctx)=>{ctx.slight=orcLand(p)?A.pick(['the orc children call you "small-tusk" and "milk-blood"',"an old orc says your human half will run in battle"]):p.realm==="POL-01"?A.pick(["the reeve reminds your family that half-orcs may not bear arms without a lord's license","a farmer will not let you near his daughters"]):A.pick(["a shopkeeper will not let you in the door","the priest makes you stand at the back","the village children say you eat babies","a mother pulls her child away from you in the street"])},
        title: "Half and half",
        text: "Today {slight}. You have tusks, small ones, and grey-green skin, and you are bigger than any child your age. It is not the first time.",
        choices: [
          {
            t: "Show them you are stronger",
            check: {s:"str",s2:"wil",d:22},
            win: {
              r: "Nobody says it to your face again. Behind your back, they say it louder.",
              fx: {str:.5,wil:1,trait:"wrathful"},
            },
            lose: {
              r: "You lose your temper, and the fight, and prove them right in their own minds.",
              fx: {health:-5,wil:1.5,honor:-2},
            },
          },
          {
            t: "Be twice as good, twice as polite",
            r: "You become the most courteous child in {home}. It is exhausting, and it works, slowly.",
            fx: {skill:{diplomacy:3},wil:1.5,trait:"patient"},
          },
          {
            t: "Find the other outsiders",
            r: "There is always someone else on the edge. You find each other.",
            fx: {newRel:{type:"bestfriend",op:40},happy:4},
          },
          {
            t: "Swallow it",
            r: "You swallow it. It sits in your belly with all the other times.",
            fx: {wil:2,happy:-5},
          },
        ],
      },
      {
        id: "ch_giant_chants",
        cool: 4,
        w: 1.6,
        cond: (p,C)=>AA(p,C,3,15.5)&&p.race==="giant",
        setup: (p,ctx)=>{ctx.mother=p.realm==="POL-23"?"the 52nd Mother of Jotunhall":"the Mother of your hall",ctx.n=String(A.ri(40,100))},
        title: "The chants",
        text: "Giant children learn the chants for twenty-five years. Tonight the eldest of the hall takes you back {n} Mothers, name by name, to the time before {mother}. The chant is felt in the chest more than heard.",
        choices: [
          {
            t: "Learn every name",
            check: {s:"int",s2:"wil",d:24},
            win: {
              r: "By morning you can chant forty generations without a stumble. The eldest nods slowly, which takes a while.",
              fx: {skill:{learning:3,music:2},int:.5,piety:2},
            },
            lose: {
              r: "You lose your place among the Mothers and have to begin again. There is time. There is always time.",
              fx: {skill:{learning:1,music:1},wil:.6},
            },
          },
          {
            t: "Ask about the halls that have gone quiet",
            r: "The eldest tells you of halls where the fire went out because no child was born. You understand, for the first time, that your people are dying.",
            fx: {wil:1.5,int:.4,happy:-4,trait:"calm"},
          },
          {
            t: "Fall asleep against a warm Mother's side",
            r: "You sleep through three centuries of ancestors. Nobody minds. Every giant child is precious.",
            fx: {happy:4,health:2},
          },
        ],
      },
      {
        id: "ch_giant_smallfolk",
        cool: 7,
        w: 1.6,
        cond: (p,C)=>AA(p,C,4,13)&&p.race==="giant",
        title: "The small folk",
        text: "The human tribute-folk live in turf huts round your hall. Their children are the size of your hand, and they want to play. A fall from your own height could kill you; a careless step could kill them.",
        choices: [
          {
            t: "Play gently",
            check: {s:"ins",s2:"wil",d:20},
            win: {
              r: "You learn to move slowly, to look before you step. The small folk adore you.",
              fx: {trait:"kind",ins:.5,newRel:{type:"friend",op:30}},
            },
            lose: {
              r: "You knock a boy flat with a careless turn. He lives, but his mother never lets him near you again.",
              fx: {wil:1,happy:-5,trait:"calm"},
            },
          },
          {
            t: "Carry them on your shoulders",
            check: {s:"sta",s2:"ins",d:22},
            win: {
              r: "Six children on your shoulders, screaming with joy, as you walk to the shore.",
              fx: {happy:6,sta:.4,fame:1},
            },
            lose: {
              r: "You slip on the shingle and fall your own height. Your hip will ache in the cold forever.",
              fx: {health:-12,cause:"a fall",wound:"back",wil:1.5},
            },
          },
          {
            t: "Stay by the hall fire",
            r: "You stay with your own kind. The small folk are quick, clever, many and fragile. Better not.",
            fx: {trait:"shy",int:.3},
          },
        ],
      },
      {
        id: "ch_wr_saddle",
        cool: 4,
        w: 2,
        cond: (p,C)=>AA(p,C,6,12)&&p.cult==="CUL-03",
        title: "From the saddle",
        text: 'Children of the Nine Winds ride before they walk well and shoot from the saddle by ten. Your uncle sets up a felt target and gallops past it, loosing three arrows. "Now you."',
        choices: [
          {
            t: "Shoot at a full gallop",
            check: {s:"bow",s2:"riding",d:24},
            win: {
              r: "Two of three in the felt. Your uncle grins with all his teeth.",
              fx: {skill:{bow:4,riding:2},fame:1},
            },
            lose: {r:"Your arrow hits a goat. The goat's owner is not amused.",fx:{skill:{bow:2,riding:1},family:-1}},
          },
          {
            t: "Learn to shoot when all four hooves are off the ground",
            r: "That is the old secret: the moment of flight, when the horse is still. You practice it a thousand times.",
            fx: {skill:{bow:3,riding:2},trait:"patient"},
          },
          {
            t: "Race the other children instead",
            check: {s:"riding",s2:"spd",d:20},
            win: {
              r: "You win by a neck. The kurultai is ten years away, but people are already saying your name.",
              fx: {skill:{riding:4},fame:1},
            },
            lose: {r:"You eat dust. Someone else is the champion of the camp.",fx:{skill:{riding:2},wil:.5}},
          },
        ],
      },
      {
        id: "ch_ashmere_butts",
        cool: 3,
        w: 2,
        cond: (p,C)=>AA(p,C,7,16)&&p.realm==="POL-05"&&C.male(p)&&p.race==="human"&&!p.flags.unfree,
        title: "The Butts Law",
        text: "Sunday afternoon. Under the Butts Law every free man of Ashmere from seven to sixty must own a bow and shoot at the village butts, or pay a fine of one ember. The old men watch, leaning on their staves.",
        choices: [
          {
            t: "Shoot your best",
            check: {s:"bow",s2:"str",d:24},
            win: {
              r: 'Three in the clout. An old bowman who fought at the border taps your shoulder. "You draw like your grandfather."',
              fx: {skill:{bow:4},str:.4,fame:1},
            },
            lose: {
              r: "Your arrows go everywhere but the mark. The old men laugh, then show you how to stand.",
              fx: {skill:{bow:2}},
            },
          },
          {
            t: "Ask the fletcher to teach you his trade",
            r: "Goose feathers, silk thread and yew. You learn why a good arrow costs more than a bad bow.",
            fx: {skill:{craft:3,bow:1}},
          },
          {
            t: "Skip it and go fishing (the family pays the ember)",
            r: "The fish do not bite. The fine still comes. Your father is furious.",
            fx: {family:-2,happy:2,rel:{who:"father",op:-4}},
          },
        ],
      },
      {
        id: "ch_greyhaven_sea",
        once: !0,
        w: 3,
        cond: (p,C)=>AA(p,C,9.5,12.5)&&p.realm==="POL-14"&&C.male(p)&&p.race==="human"&&!ST(p,"noble","royal","slave"),
        setup: (p,ctx)=>{ctx.ship=A.pick(["a cog bound for "+(A.realm(p.realm)?A.realm(p.realm).capital:"the south"),"a herring boat","a wool cog going south","a whaler out of the northern ports"])},
        title: "To sea at ten",
        text: "Greyhaven boys go to sea at ten. A berth has been found for you as ship's boy on {ship}. Your mother has packed bread, a knife and a wool cap. The tide will not wait.",
        choices: [
          {
            t: "Go eagerly",
            check: {s:"sta",s2:"wil",d:22,bonus:p=>A.hasBlood(p,"seasteady")?15:A.hasBlood(p,"balance")?-15:0},
            win: {
              r: "You are sick for two days and then never again. By the end of the season you can climb the rigging in a gale.",
              fx: {skill:{sea:5},sta:.6,flag:"ch_seaboy",coin:3},
            },
            lose: {
              r: "You are sick the whole voyage, and the cook beats you for spilling the soup. You go back anyway, next season.",
              fx: {skill:{sea:3},wil:2,flag:"ch_seaboy"},
            },
          },
          {
            t: "Cry, and go anyway",
            r: "You cry all the way out of harbor. The old sailors pretend not to see. By the second week you are one of them.",
            fx: {skill:{sea:4},wil:1.5,flag:"ch_seaboy"},
          },
          {
            t: "Beg to stay and work the land",
            check: {s:"diplomacy",d:26},
            win: {
              r: "Your father lets you stay. The other boys call you a landsman for the rest of your life.",
              fx: {skill:{husbandry:3},happy:2},
            },
            lose: {r:'"Every Greyhaven boy goes." You go.',fx:{skill:{sea:3},wil:1,flag:"ch_seaboy"}},
          },
        ],
      },
      {
        id: "ch_tidewell_ring",
        once: !0,
        w: 5,
        cond: (p,C)=>AA(p,C,6.5,8.8)&&(C.blood(p,"deeplung")||p.realm==="POL-14"&&p.status==="royal"),
        title: "The ring-dive",
        text: "At seven every Tidewell child dives for a silver ring dropped in deep water. A child who brings it up wears it on a cord for life. One who fails can never be crowned. The whole court is on the jetty.",
        choices: [
          {
            t: "Dive for the ring",
            check: {s:"sta",s2:"wil",d:26,bonus:p=>A.hasBlood(p,"deeplung")?18:0},
            win: {
              r: "Down through green, then black. Your chest burns. Your fingers close on silver. You come up into a roar of cheering.",
              fx: {flag:"ch_ring",fame:3,happy:8,wil:1,deed:"Brought up the Tidewell ring at seven"},
            },
            lose: {
              r: "You come up empty, choking. The jetty goes silent. You will never be crowned, and everyone knows it before you are dry.",
              fx: {flag:"ch_ring_failed",wil:3,happy:-10},
            },
          },
          {
            t: "Dive past the ring, to the bottom",
            check: {s:"sta",s2:"wil",d:32,bonus:p=>A.hasBlood(p,"deeplung")?18:0},
            win: {
              r: "You bring up the ring and a fistful of sand from the bottom. The old divers say nothing like it has happened in a lifetime.",
              fx: {flag:"ch_ring",fame:5,happy:8,deed:"Touched the bottom in the Tidewell ring-dive",wound:"ear"},
            },
            lose: {
              r: "Something bursts in your ear. They pull you out bleeding. No ring.",
              fx: {flag:"ch_ring_failed",wound:"ear",wil:3,health:-6,cause:"a diving injury"},
            },
          },
          {
            t: "Refuse to dive",
            r: "You stand on the jetty and will not jump. It is the bravest thing anyone has seen, or the most cowardly. The court argues about it for years.",
            fx: {flag:"ch_ring_failed",trait:"stubborn",wil:1.5,fame:1},
          },
        ],
      },
      {
        id: "ch_skyhold_gift",
        once: !0,
        w: 3,
        cond: (p,C)=>AA(p,C,5,12)&&(p.realm==="POL-27"||p.cult==="CUL-12")&&p.race==="human"&&!ST(p,"royal"),
        setup: (p,ctx)=>{setSib(p,ctx,s=>!A.isAdult(s)),ctx.mon=A.pick(["the white monastery on the cliff","the monastery above the yak pastures","the house of prayer flags by the lake"])},
        title: "One child for the sky",
        text: "Every family of Skyhold gives one child to a monastery. This year the monks come up the path to {mon}, prayer wheels turning, to take your family's child.",
        choices: [
          {
            t: "Go yourself",
            r: "You shave your head and take the red robe. Butter lamps, chant, letters, cold stone. Your family weeps and is proud.",
            fx: {flag:"ch_monastery",piety:8,literate:!0,skill:{learning:4,faith:4},wil:1.5},
          },
          {
            t: "Let {sn} go",
            req: p=>live(p,["sibling"]).some(x=>!A.isAdult(x.p)),
            r: "{sn} goes up the path with the monks and does not look back. You visit at the great festivals. {sHe} seems happy. Mostly.",
            fx: {them:{op:6},happy:-3,wil:.6},
          },
          {
            t: "Hide in the yak pens",
            r: "They find you, of course. The abbot laughs and says a child with that much spirit belongs to the sky. You go.",
            fx: {flag:"ch_monastery",piety:4,literate:!0,skill:{learning:3,faith:3},trait:"stubborn"},
          },
        ],
      },
      {
        id: "ch_abari_twins",
        once: !0,
        w: 2,
        cond: (p,C)=>AA(p,C,5,14)&&p.realm==="POL-22"&&p.status!=="royal"&&p.race==="human",
        setup: (p,ctx)=>{ctx.tw=A.givenName(p.cult,A.pick(["M","F"]))},
        title: "The younger twin",
        text: "In Abara the younger of village twins is given to the Rememberers and never marries. Today the Rememberers come for {tw}, your playmate, the younger of the twins in the next compound. The elder twin will not stop screaming.",
        choices: [
          {
            t: "Comfort the twin left behind",
            r: "You sit with the elder twin all night. Neither of you says much. You are bound together after that.",
            fx: {trait:"kind",newRel:{type:"bestfriend",op:35},wil:.8},
          },
          {
            t: "Walk with {tw} to the Rememberers",
            r: "On the road {tw} teaches you the first lines of a genealogy song. You remember them all your life.",
            fx: {skill:{music:2,learning:2},int:.4},
          },
          {
            t: "Ask why it must be so",
            r: "An old Rememberer tells you: the dead must be sung, and someone must give a life to the singing. It is an honor. It is also a loss.",
            fx: {int:.6,piety:3,trait:"curious"},
          },
        ],
      },
      {
        id: "ch_ranavir_arsenic",
        once: !0,
        w: 4,
        cond: (p,C)=>AA(p,C,4.8,9)&&(C.blood(p,"unpoisoned")||p.realm==="POL-30"&&p.status==="royal"),
        title: "A pinch of white",
        text: "Ranavir children are fed tiny doses of arsenic from the age of five. Raja Vikram survived seven poisonings, and his descendants mean to survive more. A physician holds out a spoon of milk with a few grains of white in it.",
        choices: [
          {
            t: "Swallow it without a face",
            check: {s:"wil",d:20},
            win: {
              r: "You swallow. Your stomach cramps; you do not let it show. Your grandmother nods. Every month after, a little more.",
              fx: {wil:1.5,sta:.5,flag:"ch_arsenic",honor:2},
            },
            lose: {
              r: "You vomit on the physician. It is done again tomorrow, and the day after.",
              fx: {wil:1.5,health:-4,cause:"arsenic",flag:"ch_arsenic"},
            },
          },
          {
            t: "Ask who wants to poison you",
            r: "Your mother names them, one by one: cousins, ministers, the court of another kingdom. You are five. You learn to watch every cup.",
            fx: {skill:{intrigue:4},int:.5,flag:"ch_arsenic",trait:"cynical"},
          },
          {
            t: "Spit it out and hide",
            r: "They find you in the elephant stables. The dose is doubled. You never hide again.",
            fx: {wil:2,health:-6,cause:"arsenic",flag:"ch_arsenic"},
          },
        ],
      },
      {
        id: "ch_six_fingers",
        once: !0,
        w: 2,
        cond: (p,C)=>AA(p,C,5,14)&&(C.blood(p,"sixfinger")||p.realm==="POL-31"),
        title: p=>A.hasBlood(p,"sixfinger")?"Six fingers":"The midwife's knife",
        text: p=>A.hasBlood(p,"sixfinger")?`You have six fingers on each hand, as the royal line of Tessaria does. In the north some midwives cut a newborn's sixth finger off, so that no child can ever be taken for royal blood. ${p.status==="royal"||p.status==="noble"?"Nobody dared touch yours.":"Your mother hid your hands in her shawl until the midwife had gone."} Today a stranger notices.`:"You hold the lamp while the midwife delivers your aunt's baby. The child has six fingers on one hand. Before anyone can speak, the midwife takes out a small knife.",
        choices: [
          {
            t: p=>A.hasBlood(p,"sixfinger")?"Hide your hands":"Ask why",
            r: p=>A.hasBlood(p,"sixfinger")?"You learn to keep your hands in your sleeves. In a kingdom with two claimants to the throne, a sixth finger is dangerous.":`"So nobody can ever take this child for the old king's blood," she says. "Two claimants is enough for any kingdom."`,
            fx: {int:.5,skill:{intrigue:2},wil:.6},
          },
          {
            t: p=>A.hasBlood(p,"sixfinger")?"Show them proudly":"Help the midwife",
            r: p=>A.hasBlood(p,"sixfinger")?"Your grip on a rein or a hilt is stronger than anyone's, and you want the world to know it. Not everyone is pleased.":"Your hands are steady. The midwife says you have a gift for it, and offers to teach you.",
            fx: p=>{A.hasBlood(p,"sixfinger")?(A.fame(p,1),A.addTrait(p,"proud")):(A.trainSkill(p,"medicine",4),A.willGrow(p,.6))},
          },
          {
            t: "Look away",
            r: "You look away. Some things in this world you are not ready to see.",
            fx: {happy:-2,wil:.4},
          },
        ],
      },
      {
        id: "ch_bl_quickened",
        once: !0,
        w: 3,
        cond: (p,C)=>AA(p,C,4,15)&&C.blood(p,"quickened"),
        title: "Torchlight",
        text: "At a feast the door blows open and every torch gutters at once. The light flickers, and the world jerks and goes white. You wake on the floor with your tongue bitten and a ring of faces above you.",
        choices: [
          {
            t: "Hide what happened",
            r: "You say you tripped. From now on you keep away from flickering light, and nobody knows why.",
            fx: {flag:"ch_fits_secret",wil:1.5,skill:{intrigue:2}},
          },
          {
            t: "Tell your family",
            r: 'Their faces close. "The Quickened blood," your mother says quietly. "Like Sethril. You fight by daylight, always. Promise me."',
            fx: {flag:"ch_fits_known",rel:{who:"mother",op:5},int:.5},
          },
          {
            t: "Learn your own rule",
            r: "Steady lamplight, never torches. Day, never lightning. You learn the shape of your danger and live inside it.",
            fx: {flag:"ch_fits_known",trait:"patient",ins:.6},
          },
        ],
      },
      {
        id: "ch_bl_lightfoot",
        once: !0,
        w: 3,
        cond: (p,C)=>AA(p,C,4,15)&&C.blood(p,"lightfoot"),
        title: "Light bones",
        text: "You can leap higher and land softer than any child in the grove. Today you jump from a branch you have jumped from a hundred times, land a little wrong, and hear a crack like a dry twig.",
        choices: [
          {
            t: "Lie still a whole season while it heals",
            r: "A Lightfoot learns early: a fall that bruises others breaks you. You heal, and you learn to land.",
            fx: {trait:"patient",wil:1.5,health:-6,cause:"a broken bone"},
          },
          {
            t: "Climb again the day the splint comes off",
            check: {s:"spd",d:22},
            win: {
              r: "You fly from branch to branch as if nothing happened. Your mother cannot watch.",
              fx: {spd:1,trait:"brave",health:-4},
            },
            lose: {
              r: "It breaks again, worse. It never quite sets right.",
              fx: {wound:"bad_knee",health:-10,cause:"a broken bone",wil:2},
            },
          },
          {
            t: "Ask the old ones about the Lightfoot line",
            r: "They tell you about duelists who never lost, and duelists who died of one bad fall. You listen carefully.",
            fx: {int:.5,skill:{learning:2},health:-5,cause:"a broken bone"},
          },
        ],
      },
      {
        id: "ch_bl_montaro",
        once: !0,
        w: 3,
        cond: (p,C)=>AA(p,C,4.5,7.5)&&C.blood(p,"laughing"),
        title: "The nettle test",
        text: "At five every child of Montaro blood has nettles brushed along the arm. A child who laughs instead of crying has the blood, and will be raised at Vitia under the Montaro name. Your arm is held out. The nettles come down.",
        choices: [
          {
            t: "Laugh",
            r: "It tickles. You laugh. The grown-ups exchange a look you will understand later: proud, and afraid.",
            fx: {flag:"ch_vitia",fame:1,wil:1},
          },
          {
            t: "Pretend to cry, because the others did",
            check: {s:"intrigue",s2:"int",d:22},
            win: {
              r: "You cry convincingly. They are fooled, for now. Nobody will watch you for wounds you never mention.",
              fx: {trait:"deceitful",skill:{intrigue:2}},
            },
            lose: {r:"Your crying is so bad that everyone laughs, and then they know.",fx:{flag:"ch_vitia",happy:-2}},
          },
          {
            t: "Grab the nettles and ask for more",
            r: `You rub them on your face for good measure. A great-uncle with a scar across his throat laughs until he weeps. "Watch that one," he says. "She'll ignore a spear in the belly." Or he.`,
            fx: {flag:"ch_vitia",trait:"brave",fame:1},
          },
        ],
      },
      {
        id: "ch_bl_owl",
        once: !0,
        w: 3,
        cond: (p,C)=>AA(p,C,3,13)&&(C.blood(p,"owl")||C.blood(p,"mistwalker")||C.blood(p,"deepeye")),
        title: "Owl-eyes",
        text: "At noon the summer sun is a white blade in your eyes, and you weep and hide under the eaves. At night you can walk the whole wood without a lantern and see the mice moving in the grass.",
        choices: [
          {
            t: "Wear a veil of dark gauze by day",
            r: "Your mother sews you a veil. People stare. You can see, and that is what matters.",
            fx: {flag:"ch_veil",wil:1,ins:.5},
          },
          {
            t: "Make the night your own",
            r: "You sleep through the noon and roam the dark. You learn the night like other children learn the village.",
            fx: {skill:{stealth:3,survival:2},ins:.6,trait:"shy"},
          },
          {
            t: "Force yourself into the sun",
            r: "You squint through every summer noon until your head aches. You will not be ruled by your eyes.",
            fx: {wil:2,trait:"stubborn",happy:-3},
          },
        ],
      },
      {
        id: "ch_bl_frost",
        once: !0,
        w: 3,
        cond: (p,C)=>AA(p,C,3,13)&&C.blood(p,"frost"),
        title: "Frost blood",
        text: "You fall asleep in a snowdrift chasing a hare, and wake at dawn warm, with frost in your hair. The searchers who find you are blue with cold. Your mother does not know whether to hug you or hit you.",
        choices: [
          {
            t: "Laugh about it",
            r: "You laugh. Your mother tells you about the milk watch: how a frost-blood baby must never go a day without food. You were lucky twice.",
            fx: {happy:3,sta:.5},
          },
          {
            t: "Ask what you are",
            r: "They tell you of the frost blood: sleep in snow, work bare-handed in a hard frost. And the babies who die of fits when they go hungry.",
            fx: {int:.5,wil:.8},
          },
          {
            t: "Go out the next night to try it again",
            r: "You sleep in the snow on purpose, and again. You become the child who is not afraid of winter.",
            fx: {sta:.8,trait:"brave",skill:{survival:2}},
          },
        ],
      },
      {
        id: "ch_bl_bull",
        once: !0,
        w: 3,
        cond: (p,C)=>AA(p,C,5,14)&&(C.blood(p,"bull")||C.blood(p,"bear")||C.blood(p,"hammer")||C.blood(p,"jotun")),
        setup: (p,ctx)=>setPal(p,ctx,"friend"),
        title: "Too strong",
        text: "You eat like two grown men and you are already the strongest child anyone has seen. Wrestling for fun with {them}, you hear a crack. {kHe} is screaming, holding an arm that bends where it should not.",
        choices: [
          {
            t: "Learn to hold back",
            r: "You learn the hardest lesson of your blood: strength you cannot control is a danger to everyone you love.",
            fx: {trait:"calm",wil:1.5,them:{type:"friend",op:-5}},
          },
          {
            t: "Carry {khim} to the bonesetter yourself",
            r: "You run all the way with {them} in your arms. The arm heals. {them} forgives you, mostly.",
            fx: {trait:"kind",them:{type:"friend",op:10},sta:.4},
          },
          {
            t: "Enjoy it a little",
            r: "Nobody will ever push you around. Nobody will ever wrestle you again either.",
            fx: {trait:"cruel",str:.8,them:{type:"rival",op:-20}},
          },
        ],
      },
      {
        id: "ch_bl_memory",
        once: !0,
        w: 3,
        cond: (p,C)=>AA(p,C,5,14)&&C.blood(p,"memory"),
        title: "You remember everything",
        text: "You can repeat a sermon word for word a year after you heard it. You remember every face, every insult, every page. And some days a black mood comes down on you like a lid, and you cannot get out of bed.",
        choices: [
          {
            t: "Use it",
            r: "You learn whole books by heart, and win every argument about who said what.",
            fx: {skill:{learning:4},int:.8},
          },
          {
            t: "Hide it",
            r: "People do not like being remembered so well. You learn to pretend to forget.",
            fx: {skill:{intrigue:3},trait:"shy"},
          },
          {
            t: "Find a way through the black days",
            r: "Walking, work, the company of one patient friend. You find what helps. It does not always work.",
            fx: {wil:2,newRel:{type:"friend",op:30}},
          },
        ],
      },
      {
        id: "ch_bl_fury",
        once: !0,
        w: 3,
        cond: (p,C)=>AA(p,C,6,14)&&C.blood(p,"fury"),
        title: "The red",
        text: "A wrestling match at the clan fire. Someone laughs at you, and the world goes red and slow. When you come back to yourself your opponent is down, people are pulling you off, and you fall over with grey lips, shaking.",
        choices: [
          {
            t: "Be proud of it",
            r: "The fury of the line of Gorath. The warriors look at you with hunger.",
            fx: {fame:1,trait:"wrathful",str:.5},
          },
          {
            t: "Ask the shaman about it",
            r: "The shaman tells you of hearts that burst in their thirties, and of carriers who could not stop once it started. You listen hard.",
            fx: {int:.5,wil:1,piety:2},
          },
          {
            t: "Learn to feel it coming",
            r: "A buzzing in the teeth, a heat in the neck. You learn the signs and how to walk away.",
            fx: {trait:"calm",wil:2},
          },
        ],
      },
    ]);
    function sibFever(p,ctx,base,catchRisk,trait){const t=ctx.pid?A.P(ctx.pid):null;let out="";trait&&A.addTrait(p,trait),catchRisk&&A.chance(catchRisk)&&(p.health=Math.max(1,p.health-8),p.lastHurt="a fever caught at a sickbed",out+=" You catch it too, and shake with fever for a week.");const bonus=(["elf","dwarf","giant"].includes(p.race)?.2:0)+(RICH(p)?.08:0),name=t?t.given:ctx.sn;return!t||A.chance(Math.min(.95,base+bonus))?(t&&A.addOp(p,t,12),A.willGrow(p,.8),`${name} lives. One morning ${ctx.she||"the child"} sits up and asks for bread, and the whole house breathes again.${out}`):(A.kill(t,ctx.ill||"a fever"),A.willGrow(p,3),p.happy=A.clamp(p.happy-15,0,100),`${name} dies before the week is out. They bury ${ctx.shim||"the child"} small, in the corner where the other small graves are. Nobody says it is anyone's fault. You think it anyway.${out}`)}
    function C_coast(p){const pr=A.prov(p.home);return pr?!!pr.coast:!1}
    function C_terr(p,...t){const pr=A.prov(p.home);return pr?t.includes(pr.terr):!1}
  })();
})();
