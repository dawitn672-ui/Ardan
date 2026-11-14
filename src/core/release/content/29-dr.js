// The release's event pack 29 of 30 (24 events, mostly dr_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-028). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const cl = v=>A.clamp(v,0,100),
      hurt = (p,n,why,floor)=>{p.health=Math.max(floor??6,p.health-n),p.lastHurt=why},
      bName = ctx=>A.beastShort(ctx.beast),
      unit = p=>A.myUnit?A.myUnit(p):null,
      edge = (p,k,v)=>{const d=unit(p);d&&(d.dr=d.dr||{},d.dr[k]=A.clamp((d.dr[k]||0)+v*A.drillShare(p)*4,0,1))},
      exp = (p,v)=>{const d=unit(p);d&&(d.exp=Math.min(100,d.exp+v*A.drillShare(p)*4))},
      org = (p,v)=>{const d=unit(p);d&&(d.org=A.clamp(d.org+v,0,A.divMaxOrg?A.divMaxOrg(d):60))},
      lose = (p,n)=>{const d=unit(p);d&&A.divLose&&A.divLose(d,n)},
      slotP = (p,types)=>{if(!A.staffSlots)return null;for(const t of types)for(const s of A.staffSlots(p))if(s.type===t){const h=A.staffHolder(p,s.key);if(h)return{p:h,s}}return null},
      ranker = (p,ctx,key,occ)=>{const n=A.makeAcquaintance(p,"acquaint");return n.born=A.S.year-A.ri(17,24),n.occ=occ||`a soldier in your ${GD.MIL[Math.max(0,p.mil.rank-1)].title.toLowerCase()}'s ranks`,n.milRank=0,n.npcTemp=!0,ctx[key]=n.given,ctx[key+"Id"]=n.id,n},
      sgtCtx = (p,ctx)=>{const s=slotP(p,["sgtmaj","sgt","file","lt","castellan"]);ctx.sgt=s?s.p.given:"your senior sergeant",ctx.sgtPost=s?s.s.label.toLowerCase():"sergeant",ctx.sgtId=s?s.p.id:"",ctx.sgtGood=s?(A.skill(s.p,"command")+A.skill(s.p,"melee"))/2:35},
      drillOk = p=>!!p.mil&&!p.mil.merc&&p.mil.rank>=2&&!!unit(p),
      coinCost = (p,n)=>{const c=Math.min(p.coin,n);return p.coin-=c,c},
      officerMen = p=>p.mil&&!p.mil.merc&&p.mil.rank>=3||!!p.ruler||p.noble&&p.noble.rung>=3;
    A.defEvents([
      {
        id: "bx_child",
        trigger: !0,
        setup: (p,ctx)=>{ctx.beast||(ctx.beast="CRE-21"),ctx.place||(ctx.place=(A.BEASTS[ctx.beast]||{}).where||"the wilds")},
        title: "Something in the trees",
        text: (p,ctx)=>`You are ${A.age(p)}, out past the last field, when you see it: ${bName(ctx)}. ${(LORE.creatures.find(c=>c.id===ctx.beast)||{}).size||""}. Every story the old people told you was true. It has not seen you yet.`,
        choices: [
          {
            t: "Run for the houses, screaming",
            r: "You run faster than you have ever run. Dogs bark, men come out with spears and torches, and by the time they reach the trees it is gone. Nobody laughs at you. They have all seen what made those tracks.",
            fx: p=>(A.willGrow(p,.4,"fear"),""),
          },
          {
            t: "Climb the nearest tree and wait",
            check: {s:"spd",s2:"ins",d:30},
            win: {
              r: "You are up the oak before your heart beats twice. It passes underneath, close enough to smell. You stay up there till dark.",
              fx: p=>(A.trainSkill(p,"athletics",2),A.willGrow(p,.6),""),
            },
            lose: {
              r: "A branch snaps and you drop, hard. It looks up — and goes the other way. You limp home with a split knee and a story.",
              fx: p=>(hurt(p,4,"a fall from a tree",20),""),
            },
          },
          {
            t: "Freeze. Do not breathe.",
            check: {s:"ins",s2:"wil",d:34},
            win: {
              r: "It sniffs the wind, turns, and is gone into the green. You learn something that day about being very, very still.",
              fx: p=>(A.trainSkill(p,"stealth",2),A.willGrow(p,.8),""),
            },
            lose: {
              r: "You break and run. It does not follow — but you run straight through a bramble hedge and come home bleeding from a hundred scratches.",
              fx: p=>(hurt(p,3,"brambles",20),""),
            },
          },
        ],
      },
      {
        id: "bx_titan",
        trigger: !0,
        setup: (p,ctx)=>{ctx.beast||(ctx.beast="CRE-33"),ctx.place||(ctx.place=(A.BEASTS[ctx.beast]||{}).where||"the wilds")},
        title: "Too big to fight",
        text: (p,ctx)=>`${A.cap(bName(ctx))}. ${(LORE.creatures.find(c=>c.id===ctx.beast)||{}).size||""}. You have seen big animals. This is not that. One person with a blade is nothing to it — the way a dog is nothing to a charging ox. People who kill these do it with pits, ropes, fire and twenty spears.`,
        choices: [
          {
            t: "Get away — now",
            check: {s:"spd",s2:"survival",d:36},
            win: {
              r: "You put a ridge between you and it and keep going. Behind you, trees crack. You do not look back.",
              fx: p=>(A.trainSkill(p,"survival",1.5),""),
            },
            lose: {
              r: "It comes after you. You throw yourself into a ditch and it thunders past, close enough to shake the ground under you. Bruised ribs and a twisted ankle — and alive.",
              fx: (p,ctx)=>(hurt(p,A.ri(8,16),"the "+bName(ctx).replace(/^the /,"")),""),
            },
          },
          {
            t: "Hide downwind and watch it",
            check: {s:"stealth",s2:"ins",d:44},
            win: {
              r: "You lie in the bracken for an hour and learn how it moves, where it drinks, how it sleeps. Hunters would pay to know what you know now.",
              fx: (p,ctx)=>(A.trainSkill(p,"survival",3),A.trainSkill(p,"tracking",2),p.flags.bxScout={id:ctx.beast,y:A.S.year},""),
            },
            lose: {
              r: "The wind turns. It smells you. You run, and it lets you go — this time.",
              fx: (p,ctx)=>(hurt(p,A.ri(3,8),"the "+bName(ctx).replace(/^the /,"")),""),
            },
          },
          {
            t: p=>`Raise an expedition against it${officerMen(p)?" (your own men)":" (hire twenty hunters: 90 suns)"}`,
            req: p=>officerMen(p)||p.coin>=90,
            check: {s:"command",s2:"survival",d:52,bonus:p=>(officerMen(p)?8:0)+(p.flags.bxScout?10:0)},
            win: {
              r: (p,ctx)=>`It takes nine days. Pits dug at night along its path, ropes and stakes, fire and drums to drive it. When it goes into the pit, twenty spears go in after it. ${A.cap(bName(ctx))} dies the way these things have always died: to many people working together. They will talk about this hunt for years.`,
              fx: (p,ctx)=>{officerMen(p)||coinCost(p,90);const B=A.BEASTS[ctx.beast]||{fame:10};return A.fame(p,Math.round(B.fame*.6)),p.coin+=A.ri(60,160),A.trainSkill(p,"command",3),A.trainSkill(p,"survival",2),p.deeds.push({y:A.S.year,t:`Led the hunt that killed ${bName(ctx)}`}),A.chance(.4)?" Two hunters did not come home.":" Every hunter came home. That is the real triumph."},
            },
            lose: {
              r: (p,ctx)=>`It breaks out of the pit with three spears in it and goes through your line like a cart through a hedge. Men scatter. Some do not get up. ${A.cap(bName(ctx))} vanishes into the wild, wounded and furious.`,
              fx: (p,ctx)=>(officerMen(p)||coinCost(p,90),hurt(p,A.ri(6,14),"the "+bName(ctx).replace(/^the /,"")),A.fame(p,1),A.willGrow(p,1.5)," Three hunters are dead. Their families will remember your name, and not kindly."),
            },
          },
          {
            t: "Fight it alone (this is how people die)",
            r: "You chose this.",
            fx: (p,ctx)=>(A.startDuelFront(p,{beastId:ctx.beast,mod:ctx.mod||1},{kind:"beast",place:ctx.place,title:ctx.title||"Alone",forceSolo:!0}),""),
          },
        ],
      },
      {
        id: "bx_flyer",
        trigger: !0,
        setup: (p,ctx)=>{ctx.beast||(ctx.beast="CRE-01"),ctx.place||(ctx.place=(A.BEASTS[ctx.beast]||{}).where||"the wilds")},
        title: "Out of reach",
        text: (p,ctx)=>`${A.cap(bName(ctx))} stays in the air, circling, ${(LORE.creatures.find(c=>c.id===ctx.beast)||{}).size||"huge"}. Your weapon cannot reach it. Against a flyer, a sword is a stick. You need a bow, a crossbow, a thrown spear — or you need it to come down.`,
        choices: [
          {
            t: "Get under the rocks and wait it out",
            r: "It makes three passes, screaming, then loses interest and wheels away toward the crags. You walk home slowly, watching the sky.",
            fx: {},
          },
          {
            t: "Drive it off: fire, noise, a cloak in the wind",
            check: {s:"wil",s2:"ins",d:40},
            win: {
              r: "You make yourself big and loud and burning. It decides you are more trouble than you are worth.",
              fx: {fame:1,wil:.5},
            },
            lose: {
              r: "It drops on you from above once, claws first, and is gone before you can swing. A raked shoulder and a lesson.",
              fx: (p,ctx)=>(hurt(p,A.ri(8,14),"the "+bName(ctx).replace(/^the /,"")),A.chance(.4)&&A.addWound(p,"scar_arm"),""),
            },
          },
          {
            t: "Wait for it to land to feed — then strike",
            check: {s:"stealth",s2:"ins",d:54},
            win: {
              r: "You lie in the heather until it comes down on the carcass and folds its wings. Now it is on the ground. Now it is only an animal.",
              fx: (p,ctx)=>(A.startDuelFront(p,{beastId:ctx.beast,mod:.85},{kind:"beast",place:"the kill site",title:"Grounded",grounded:!0}),""),
            },
            lose: {
              r: "It sees you first. One rake from above, and it is back in the sky.",
              fx: (p,ctx)=>(hurt(p,A.ri(8,15),"the "+bName(ctx).replace(/^the /,"")),""),
            },
          },
        ],
      },
      {
        id: "bx_legend",
        trigger: !0,
        setup: (p,ctx)=>{ctx.beast||(ctx.beast="CRE-08"),ctx.place||(ctx.place=(A.BEASTS[ctx.beast]||{}).where||"the wilds")},
        title: "Chasing a story",
        text: (p,ctx)=>{const c=LORE.creatures.find(x=>x.id===ctx.beast)||{};return`You go looking for ${c.name||"the beast of the story"}. ${c.belief?"People say: "+c.belief+".":""} You spend weeks on it.`},
        choices: [
          {
            t: "Follow it to the end",
            r: (p,ctx)=>{const c=LORE.creatures.find(x=>x.id===ctx.beast)||{};return`There is nothing there. There never was. ${c.truth?"The truth: "+c.truth+".":""} You come home thinner, wiser, and with a better story than the one you went out with.`},
            fx: p=>(A.trainSkill(p,"learning",3),A.willGrow(p,.5,"patience"),""),
          },
        ],
      },
      {
        id: "dr_slow_recruit",
        trigger: !0,
        drill: ["any"],
        cool: 3,
        title: "The slow one",
        setup: (p,ctx)=>{ranker(p,ctx,"rec"),sgtCtx(p,ctx)},
        // [X1 baked patch core/02-content-fixes EVT-SLOW-RECRUIT-SEX] dr_slow_recruit said "The others have started to
        // hate him" whatever the recruit's sex ({rec} is drawn from the ranks, and is a woman in a mixed company: "One
        // recruit, Nessa ... hate him", v2 playtest 1). It now names the slow one instead.
        text: "One recruit, {rec}, is always a step behind: last into line, wrong foot on the turn, spear point wandering. The others have started to hate the slow one for the extra drill it costs them. Tonight, {sgt} warns you, they mean to give him a blanket-beating in the barracks.",
        choices: [
          {
            t: "Stop it, and drill him yourself at dawn",
            r: "A month of dawns. He is never good, but he stops being dangerous to the men beside him, and the barracks learns that you watch.",
            fx: p=>(A.trainSkill(p,"command",2),edge(p,"formation",.01),p.mil&&(p.mil.merit+=2),""),
          },
          {
            t: "Hand him to {sgt}",
            r: (p,ctx)=>ctx.sgtGood>=45?`${ctx.sgt} takes him apart and builds him again. By spring he keeps step with the best of them.`:`${ctx.sgt} shouts at him until he cries, and nothing changes. You may have the wrong ${ctx.sgtPost}.`,
            fx: (p,ctx)=>(ctx.sgtGood>=45&&edge(p,"formation",.015),""),
          },
          {
            t: "Let the men sort it out",
            r: "They do. He is in the infirmary for a week and deserts the week after. The rest keep step out of fear. It works, in its way.",
            fx: p=>(edge(p,"formation",.012),org(p,-2),lose(p,1),p.honor=cl(p.honor-2),""),
          },
          {
            t: "Get to know him — find out what is wrong",
            r: (p,ctx)=>`${ctx.rec} cannot see well past ten paces. Nobody ever asked. You put him in the rear rank where he follows the backs in front of him, and he becomes a steady, grateful soldier.`,
            fx: (p,ctx)=>{const n=A.P(ctx.recId);return n&&(n.npcTemp=!1,A.link(p,n,"subordinate",35,"superior")),A.trainSkill(p,"persuasion",1.5)," (You know him now.)"},
          },
        ],
      },
      {
        id: "dr_spearwall",
        trigger: !0,
        drill: ["shields","formation"],
        cool: 3,
        title: "Horses at the wall",
        text: "You borrow twenty horsemen to ride at your spear wall in practice. The first time, the line breaks and scatters while the horses are still fifty paces away. Men who have never faced a charge believe horses will ride over them. Horses will not — but nobody believes that until they see it.",
        choices: [
          {
            t: "Again. And again. Until they hold.",
            r: "On the ninth charge the line holds and the horses shy away from the hedge of points, just as you promised. Something changes in the men's faces.",
            fx: p=>(edge(p,"shields",.03),edge(p,"formation",.01),exp(p,1.5),""),
          },
          {
            t: "Stand in the front rank yourself",
            check: {s:"wil",s2:"shield",d:44},
            win: {
              r: "They see you plant your feet and not move while the horses come on. The next time, nobody moves either.",
              fx: p=>(edge(p,"shields",.035),org(p,3),A.fame(p,1),p.mil&&(p.mil.merit+=4),""),
            },
            lose: {
              r: "A horse that did not get the message knocks you flat. The men laugh — then help you up. It is not nothing.",
              fx: p=>(hurt(p,6,"a practice charge"),edge(p,"shields",.015),""),
            },
          },
          {
            t: "Explain it with the old soldiers' stories",
            check: {s:"persuasion",s2:"command",d:42},
            win: {
              r: "You tell them about the Iron Fields, where a wall of farmers held against knights. They want to be those farmers.",
              fx: p=>(edge(p,"shields",.02),org(p,2),""),
            },
            lose: {r:"They listen politely and break again on the next charge.",fx:p=>(edge(p,"shields",.005),"")},
          },
        ],
      },
      {
        id: "dr_march",
        trigger: !0,
        drill: ["march"],
        cool: 3,
        title: "Thirty miles in the heat",
        setup: (p,ctx)=>ranker(p,ctx,"fallen"),
        text: "Third day of forced marching under a white sun. Men are dropping out of the column. {fallen} collapses at your feet and does not get up.",
        choices: [
          {
            t: "Push on. The enemy will not wait for the weak.",
            r: "You make the thirty miles. Six men do not; two of them never will. The rest are harder than they were.",
            fx: p=>(edge(p,"march",.03),lose(p,2),org(p,-3),p.honor=cl(p.honor-1),""),
          },
          {
            t: "Rest through the noon heat, march at night",
            r: "Slower, but nobody dies. The men notice that you counted them.",
            fx: p=>(edge(p,"march",.015),org(p,3),""),
          },
          {
            t: "Carry {fallen}'s pack yourself",
            check: {s:"sta",s2:"wil",d:48},
            win: {
              r: "You carry two packs for eleven miles. Nobody else falls out that day. They will follow you a long way after this.",
              fx: p=>(edge(p,"march",.025),org(p,4),A.fame(p,1),p.mil&&(p.mil.merit+=3),""),
            },
            lose: {
              r: "You make four miles and fall on your face. Somebody carries both packs — and you.",
              fx: p=>(hurt(p,8,"heat and exhaustion"),edge(p,"march",.01),""),
            },
          },
        ],
      },
      {
        id: "dr_old_trick",
        trigger: !0,
        drill: ["weapons","any"],
        cool: 4,
        title: "An old soldier's trick",
        setup: (p,ctx)=>{const n=ranker(p,ctx,"vet","a grey-bearded soldier with thirty years in the ranks");n.born=A.S.year-A.ri(44,52),n.skills.spear=A.ri(55,70),n.skills.melee=A.ri(50,65)},
        text: "At weapons drill you notice the grey-haired one, {vet}, who never seems to lose a bout. He has a way of turning the spear-shaft as it meets the other man's, so the point slides off and his own goes in. Thirty years of practice in one small turn of the wrists.",
        choices: [
          {
            t: "Make him an instructor",
            r: "{vet} teaches the turn to forty men a day for a month. Half of them get it. That half will live longer.",
            fx: p=>(edge(p,"weapons",.03),exp(p,1),""),
          },
          {
            t: "Learn it yourself",
            r: "He shows you, grumbling. It takes you a week to get it and a year to own it.",
            fx: p=>(A.trainSkill(p,"spear",3),A.trainSkill(p,"melee",1.5),""),
          },
          {
            t: "Get to know him",
            r: "Over a jug in the evening you learn where he got the scar, why he never took a stripe, and that he would rather die than be made a sergeant. A man worth knowing.",
            fx: (p,ctx)=>{const n=A.P(ctx.vetId);return n&&(n.npcTemp=!1,A.link(p,n,"subordinate",40,"superior"))," (You know him now.)"},
          },
        ],
      },
      {
        id: "dr_night_alarm",
        trigger: !0,
        drill: ["skirmish","any"],
        cool: 3,
        title: "The false alarm",
        text: "You sound the alarm at the second hour of the night to see how fast your men stand to. It takes them far too long. In a real attack, half of them would have died in their blankets.",
        choices: [
          {
            t: "Punish the slowest tent",
            r: "Extra watches for a month. The next alarm, they are out of their blankets before the horn stops.",
            fx: p=>(edge(p,"skirmish",.02),org(p,-1),""),
          },
          {
            t: "Praise and reward the fastest",
            r: "A cask of beer for the first tent formed. By the end of the month the tents are racing each other.",
            fx: p=>(coinCost(p,6),edge(p,"skirmish",.02),org(p,2),""),
          },
          {
            t: "Do it every night for a week",
            r: "They hate you, they are tired, and they are fast. Nobody will catch this unit asleep.",
            fx: p=>(edge(p,"skirmish",.035),org(p,-5),""),
          },
        ],
      },
      {
        id: "dr_rival_company",
        trigger: !0,
        drill: ["any"],
        cool: 4,
        title: "The challenge",
        setup: (p,ctx)=>{const s=A.makeAcquaintance(p,"acquaint");s.occ="a rival officer",s.npcTemp=!0,ctx.rival=A.fullName(s,!1),ctx.contest=A.pick(["a shooting match at two hundred paces","a wrestling tournament","a mock battle with blunt spears","a race in full kit"])},
        text: "{rival}, who commands the next unit along the line, challenges yours to {contest}. Half the army will be watching. Money will change hands.",
        choices: [
          {
            t: "Accept, and train them hard for it",
            check: {s:"command",s2:"tactics",d:48},
            win: {
              r: "Your men win, and the whole camp knows whose unit is best. They walk differently for a month.",
              fx: p=>(org(p,4),exp(p,1),p.mil&&(p.mil.merit+=6),A.fame(p,1),""),
            },
            lose: {
              r: "You lose, narrowly. The men want a rematch. That is a good sign.",
              fx: p=>(exp(p,1),edge(p,"weapons",.01),""),
            },
          },
          {
            t: "Decline — we train for war, not for show",
            r: "Some of the men think you are afraid. Others think you are right. Nobody gets hurt.",
            fx: {},
          },
        ],
      },
      {
        id: "dr_injury",
        trigger: !0,
        drill: ["any"],
        cool: 3,
        cond: p=>!!p.mil&&p.mil.drill&&p.mil.drill.hard===2,
        title: "Blood in the yard",
        setup: (p,ctx)=>ranker(p,ctx,"hurt"),
        text: "Hard drill has a cost. {hurt} takes a practice spear through the thigh — someone forgot the blunting cap. He is bleeding badly and the regiment's surgeon is a day away.",
        choices: [
          {
            t: "Pay a town surgeon from your own purse (12 suns)",
            req: p=>p.coin>=12,
            r: "He lives and keeps the leg. The men talk about the officer who paid.",
            fx: p=>(coinCost(p,12),org(p,3),""),
          },
          {
            t: "Ease the drill for a week",
            r: "The men rest. The edge you were building dulls a little.",
            fx: p=>(A.setDrill(null,1),org(p,2),""),
          },
          {
            t: "Find out who forgot the cap, and make an example",
            r: "Twenty lashes. Nobody forgets the caps again. Nobody likes you much either.",
            fx: p=>(edge(p,"weapons",.01),org(p,-2),""),
          },
        ],
      },
      {
        id: "dr_drunk_sgt",
        trigger: !0,
        drill: ["any"],
        cool: 5,
        cond: p=>!!slotP(p,["sgtmaj","sgt","file","lt"]),
        title: "Drunk on parade",
        setup: (p,ctx)=>sgtCtx(p,ctx),
        text: "Your {sgtPost}, {sgt}, comes to morning drill drunk enough that the men can smell it from the second rank. Everyone is watching to see what you do.",
        choices: [
          {
            t: "Strip the post and choose someone else",
            r: "You take the post from {sgt} in front of the whole unit. It is ugly. It is also the end of drinking on parade.",
            fx: (p,ctx)=>{for(const k in p.staff||{})p.staff[k]===ctx.sgtId&&delete p.staff[k];const o=A.P(ctx.sgtId);return o&&p.rel[o.id]&&A.addOp(p,o,-20),org(p,1)," (The post is empty: appoint someone on the War tab.)"},
          },
          {
            t: "Cover for them this once, and talk later",
            r: "You run the drill yourself. That night, {sgt} swears it will not happen again — and means it, this time.",
            fx: (p,ctx)=>{const o=A.P(ctx.sgtId);return o&&(p.rel[o.id]||A.link(p,o,"subordinate",20,"superior"),A.addOp(p,o,10)),""},
          },
          {
            t: "A day in the stocks — the same as any soldier",
            r: "Rank does not save you in your unit. The men take note. {sgt} takes note too.",
            fx: (p,ctx)=>{org(p,2);const o=A.P(ctx.sgtId);return o&&p.rel[o.id]&&A.addOp(p,o,-8),""},
          },
        ],
      },
      {
        id: "dr_new_levy",
        trigger: !0,
        drill: ["any"],
        cool: 3,
        title: "Fresh levy",
        text: "Two hundred new men arrive from the villages to fill the gaps. Half of them have never held a spear. They stand in a field in their own clothes, staring at your veterans.",
        choices: [
          {
            t: "Mix them in with the veterans, one new for two old",
            r: "Slower drill for a month, but the new men learn from the old ones what no drill can teach.",
            fx: p=>(exp(p,-1),org(p,1),edge(p,"formation",.01),""),
          },
          {
            t: "Keep them apart and drill them separately",
            r: "They learn the basics fast, and your veterans stay sharp. But they are two units now, not one.",
            fx: p=>(exp(p,-.5),edge(p,"weapons",.01),""),
          },
        ],
      },
      {
        id: "dr_siege",
        trigger: !0,
        drill: ["siege"],
        cool: 3,
        title: "Ladders at the old wall",
        text: "You march the men to a ruined keep and practice the escalade: ladders up, shields over heads, the rush along the wall-walk. The first time, three ladders fall back with men on them.",
        choices: [
          {
            t: "Teach them to foot the ladders properly",
            check: {s:"siegecraft",s2:"command",d:40},
            win: {
              r: "Two men at the foot, the angle right, the hooks set. By the end of the week they are on the wall in under a minute.",
              fx: p=>(edge(p,"siege",.03),A.trainSkill(p,"siegecraft",2),""),
            },
            lose: {
              r: "You learn as much as they do. Broken arms teach everyone.",
              fx: p=>(edge(p,"siege",.012),lose(p,1),""),
            },
          },
          {
            t: "Dig a practice mine instead",
            r: "They learn to shore a tunnel. One of the old miners in the ranks turns out to be a treasure.",
            fx: p=>(edge(p,"siege",.02),A.trainSkill(p,"siegecraft",1.5),""),
          },
        ],
      },
      {
        id: "dr_song",
        trigger: !0,
        drill: ["march","formation"],
        cool: 5,
        title: "A song for the step",
        text: "Somebody in the third rank starts a marching song with a chorus so filthy it would make a sailor blush. The whole column picks it up. Officers are supposed to stop this kind of thing.",
        choices: [
          {
            t: "Let them sing",
            r: "They march two miles further that day without noticing. The song becomes the unit's own. Other units envy it.",
            fx: p=>(edge(p,"march",.015),org(p,3),""),
          },
          {
            t: "Sing along — louder",
            check: {s:"music",s2:"persuasion",d:30},
            win: {
              r: "You know a verse they did not. From now on they call it your song.",
              fx: p=>(org(p,4),A.fame(p,1),""),
            },
            lose: {
              r: "Your voice cracks on the high note. They will never let you forget it — and they love you a little for it.",
              fx: p=>(org(p,2),""),
            },
          },
          {t:"Stop it: discipline is discipline",r:"Silence. The march feels longer.",fx:p=>(org(p,-1),"")},
        ],
      },
      {
        id: "or_invite",
        cond: (p,C)=>C.adult(p)&&!!p.mil&&!p.mil.merc&&!p.order&&A.fightWorth(p)>=56&&Object.keys(GD.ORDERS).some(id=>GD.ORDERS[id].realm===p.mil.realm&&A.orderReqs(p,id).every(x=>x.ok)),
        w: 3,
        cool: 3,
        title: "Someone was watching",
        setup: (p,ctx)=>{const id=Object.keys(GD.ORDERS).find(k=>GD.ORDERS[k].realm===p.mil.realm&&A.orderReqs(p,k).every(x=>x.ok));ctx.oid=id;const o=GD.ORDERS[id];ctx.oname=o.name,ctx.ospec=o.spec},
        text: 'After the drill a rider in a plain cloak asks for you by name. Under the cloak, the badge of {oname}. "We have been watching you fight," he says. "{ospec} If you want it, there is a place for you."',
        choices: [
          {
            t: "Kneel and take the oath",
            r: "You swear before witnesses at dawn.",
            fx: (p,ctx)=>{const r=A.orderJoin(ctx.oid);return r.ok?"":" "+(r.msg||"")},
          },
          {
            t: "Not yet — I have duties here",
            r: '"The offer will not come twice," he says. It may, though. They do not forget a name.',
            fx: {},
          },
        ],
      },
      {
        id: "or_vigil",
        cond: (p,C)=>C.adult(p)&&!!p.order&&p.order.rank===0&&A.absDay()-(p.order.since||0)>60,
        w: 4,
        cool: 50,
        title: "The vigil",
        setup: (p,ctx)=>{ctx.oname=GD.ORDERS[p.order.id].name},
        text: "Before an aspirant becomes a full brother of {oname}, there is the vigil: a night alone, kneeling, armed and armored, before the order's altar. No food, no sleep, no moving. Brothers come and go in the dark to watch.",
        choices: [
          {
            t: "Kneel until dawn, whatever it costs",
            check: {s:"wil",s2:"sta",d:50},
            win: {
              r: "At dawn they lift you to your feet — your legs have forgotten how — and call you brother.",
              fx: p=>(p.order.merit+=40,A.willGrow(p,2),A.fame(p,1),""),
            },
            lose: {
              r: "In the small hours you topple sideways in a clatter of steel. They let you try again next season. Many fail the first time.",
              fx: p=>(p.order.merit+=10,A.willGrow(p,1.5),""),
            },
          },
          {
            t: "Pray as you kneel",
            check: {s:"wil",s2:"faith",d:42},
            win: {
              r: "Somewhere near dawn the prayer carries you. The brothers see your face and say nothing.",
              fx: p=>(p.order.merit+=35,p.honor=cl(p.honor+3),""),
            },
            lose: {r:"The prayers run out before the night does. You make it, barely.",fx:p=>(p.order.merit+=20,"")},
          },
        ],
      },
      {
        id: "or_bout",
        cond: (p,C)=>C.adult(p)&&!!p.order&&!C.atWar(p),
        w: 1.5,
        cool: 3,
        title: "A brother's test",
        setup: (p,ctx)=>{ctx.oname=GD.ORDERS[p.order.id].name},
        text: "A senior brother of {oname} — scarred, unhurried, famous in the order — offers you a bout with blunted steel. It is an honor to be asked. It is not an honor to be beaten badly in front of everyone.",
        choices: [
          {
            t: "Accept the bout",
            r: "Blunt steel, full armor, the whole order watching.",
            fx: (p,ctx)=>{const f=A.makeFoe({realm:p.mil?p.mil.realm:p.realm,tier:4,troop:"HI",title:"a senior brother of "+ctx.oname});return A.startDuelFront(p,f,{kind:"spar",lethal:!1,place:"the order's yard",title:"A brother's test"}),p.order.merit+=8,""},
          },
          {
            t: "Ask to watch and learn first",
            r: "He nods. Watching him fight a younger brother teaches you more than a month of drill.",
            fx: p=>(A.trainSkill(p,"melee",2),A.trainSkill(p,"tactics",1),""),
          },
        ],
      },
      {
        id: "or_master",
        cond: (p,C)=>C.adult(p)&&!!p.order&&(()=>{const o=GD.ORDERS[p.order.id],r=A.realm(o.realm),L=r&&r.orders&&A.P(r.orders[p.order.id]);return!!L&&L.alive&&!p.rel[L.id]})(),
        w: 1.5,
        cool: 6,
        title: "The commander of the order",
        setup: (p,ctx)=>{const o=GD.ORDERS[p.order.id],r=A.realm(o.realm),L=A.P(r.orders[p.order.id]);ctx.pid=L.id,ctx.lead=o.lead},
        text: "{themFull}, {lead}, stops beside you at the horse lines and asks your name. It is the first time the commander of the order has spoken to you. You could leave it at that. Or you could make it more.",
        choices: [
          {
            t: "Ask {themHim} a real question about war",
            check: {s:"tactics",s2:"persuasion",d:50},
            win: {
              r: "{them} answers properly, then asks you one back. You talk until the horses are fed. You will be remembered.",
              fx: (p,ctx)=>{const L=A.P(ctx.pid);return A.link(p,L,"superior",30,"subordinate"),p.order.merit+=15," (You know {them} now.)"},
            },
            lose: {
              r: "Your question was the kind every new brother asks. {them} answers kindly and walks on.",
              fx: (p,ctx)=>{const L=A.P(ctx.pid);return A.link(p,L,"superior",8,"subordinate"),""},
            },
          },
          {
            t: "Give your name and rank, nothing more",
            r: "Correct, and forgettable. Some orders like that in a brother.",
            fx: {},
          },
        ],
      },
      {
        id: "or_rivals",
        cond: (p,C)=>C.adult(p)&&!!p.order&&GD.ORDERS[p.order.id].kind==="order",
        w: 1,
        cool: 5,
        title: "Two orders at one table",
        setup: (p,ctx)=>{const mine=GD.ORDERS[p.order.id],other=Object.keys(GD.ORDERS).filter(k=>k!==p.order.id&&GD.ORDERS[k].kind!=="corps"),o=GD.ORDERS[A.pick(other)];ctx.mine=mine.name,ctx.other=o.name,ctx.otherRealm=A.realmShort(o.realm)},
        text: "At a peace feast you are seated across from knights of {other} of {otherRealm}. The wine is good and the talk is not: one of them says, loudly, that {mine} charges like farmers.",
        choices: [
          {
            t: "Laugh it off and toast their order",
            check: {s:"etiquette",s2:"persuasion",d:44},
            win: {
              r: "They laugh too. By the end of the night you have traded war stories. Respect, of a kind.",
              fx: p=>(A.trainSkill(p,"etiquette",2),p.order.merit+=5,""),
            },
            lose: {r:"They take it as weakness. Your own brothers do too.",fx:p=>(p.order.merit-=3,"")},
          },
          {
            t: "Challenge him to settle it in the lists tomorrow",
            r: "Blunt lances, at dawn, before both orders.",
            fx: (p,ctx)=>{const f=A.makeFoe({realm:"unclaimed",tier:4,troop:"HC",title:"a knight of "+ctx.other});return f.skills.lance=A.ri(55,75),f.skills.riding=A.ri(55,75),f.gear.mount="destrier",f.gear.weapon="lance",A.startDuelFront(p,f,{kind:"tourney",lethal:!1,mounted:!!p.gear.mount,place:"the lists at dawn",title:"Order against order"}),p.order.merit+=6,""},
          },
          {
            t: "Say nothing. Let your order's record speak.",
            r: "Your silence is noticed. So is his rudeness.",
            fx: {honor:1},
          },
        ],
      },
      {
        id: "st_resented",
        cond: (p,C)=>C.adult(p)&&!!p.staff&&Object.keys(p.staff).some(k=>p.staff[k]&&p.staff[k]!=="deleg"&&A.P(p.staff[k])&&A.P(p.staff[k]).alive),
        w: 1,
        cool: 4,
        title: "Your choice, their grumbling",
        setup: (p,ctx)=>{const ks=Object.keys(p.staff).filter(k2=>p.staff[k2]&&p.staff[k2]!=="deleg"&&A.P(p.staff[k2])&&A.P(p.staff[k2]).alive),k=A.pick(ks);ctx.pid=p.staff[k],ctx.post=A.staffLabel(p,k).toLowerCase(),ctx.key=k},
        text: "The men do not like {themFull}, your {post}. Too hard, too new, too much your creature — the reasons change with who you ask. Two old hands come to you, very respectfully, to say so.",
        choices: [
          {
            t: "Back your choice — loudly",
            r: "You make it clear that a word against your {post} is a word against you. The grumbling goes underground. {them} will not forget it.",
            fx: (p,ctx)=>{const t=A.P(ctx.pid);return t&&(p.rel[t.id]||A.link(p,t,"subordinate",25,"superior"),A.addOp(p,t,12)),""},
          },
          {
            t: "Find out what is really wrong",
            check: {s:"persuasion",s2:"ins",d:46},
            win: {
              r: "It is one thing, and it can be fixed: {them} has been docking pay for lost kit. You sort it out between them.",
              fx: {honor:1},
            },
            lose: {r:"Nobody tells you anything useful. The grumbling goes on.",fx:{}},
          },
          {
            t: "Replace {themHim}",
            r: "You take the post away. {them} walks out without a word.",
            fx: (p,ctx)=>{p.staff&&delete p.staff[ctx.key];const t=A.P(ctx.pid);return t&&p.rel[t.id]&&A.addOp(p,t,-25)," (The post is empty: appoint someone.)"},
          },
        ],
      },
      {
        id: "st_deleg_cousin",
        cond: (p,C)=>C.adult(p)&&!!p.staff&&Object.values(p.staff).includes("deleg")&&Object.keys(p.staffD||{}).length>0,
        w: 1,
        cool: 5,
        title: "A delegate's choice",
        setup: (p,ctx)=>{const k=A.pick(Object.keys(p.staffD).filter(k2=>A.P(p.staffD[k2])));if(!k){ctx.skip=!0;return}ctx.key=k,ctx.pid=p.staffD[k],ctx.post=A.staffLabel(p,k).toLowerCase()},
        // [X1 baked patch core/02-content-fixes EVT-DELEG-COUSIN] st_deleg_cousin used {they}, which is not a token, so
        // the event was always dropped after using up its roll.
        text: "You left the choice of a {post} to your officers. They chose {themFull}. You hear afterwards that {them} is the cousin of the officer who chose — and that a better candidate was passed over.",
        choices: [
          {
            t: "Leave it — you delegated, so let them own it",
            r: "Your officers see that you trust them. They also see what they can get away with.",
            fx: {},
          },
          {
            t: "Overrule them and pick yourself",
            r: "You take the choice back. The officer who chose is stung; the better candidate is grateful.",
            fx: (p,ctx)=>(p.staff[ctx.key]=null,delete p.staffD[ctx.key],delete p.staff[ctx.key]," (Pick the new holder on the War tab.)"),
          },
        ],
      },
      {
        id: "mk_cheat",
        cond: (p,C)=>C.adult(p)&&(Object.keys(p.cargo||{}).length>0||p.job&&p.job.c==="merchant"),
        w: 1,
        cool: 3,
        title: "Too good a price",
        setup: (p,ctx)=>{ctx.good=A.pick(["fine cloth","pepper","amber","silk"]),ctx.trick={"fine cloth":"dyed wool pressed to look like broadcloth",pepper:"pepper cut with juniper berries",amber:"pine resin polished to look like amber",silk:"silk with linen woven into the middle of the bolt"}[ctx.good]},
        text: "A trader offers you {good} at two-thirds of the market price. He is friendly, in a hurry, and wants silver now.",
        choices: [
          {
            t: "Check it properly before you pay",
            check: {s:"trade",s2:"ins",d:46},
            win: {
              r: "It is {trick}. You walk away. The next man he tries it on is not so careful.",
              fx: {skill:{trade:2}},
            },
            lose: {
              r: "It looks fine to you. You find out in the next market: {trick}. Forty suns gone.",
              fx: p=>(coinCost(p,40),A.trainSkill(p,"trade",2),""),
            },
          },
          {t:"No deal is that good",r:"You walk away. Maybe it was real. Probably not.",fx:{}},
        ],
      },
      {
        id: "mk_toll",
        cond: (p,C)=>C.adult(p)&&Object.keys(p.cargo||{}).length>0,
        w: 1,
        cool: 3,
        title: "A new toll",
        text: "A lord has put a chain across the road at his bridge and armed men beside it. A new toll: one load in ten, or coin.",
        choices: [
          {t:"Pay in coin",r:"It hurts, but the goods arrive whole.",fx:p=>(coinCost(p,A.ri(8,25)),"")},
          {
            t: "Argue the old charters",
            check: {s:"persuasion",s2:"learning",d:48},
            win: {
              r: "You quote the charter of the road from memory. The sergeant does not want trouble with the crown. You pass free.",
              fx: {skill:{persuasion:1}},
            },
            lose: {
              r: "They take two loads for the insult.",
              fx: p=>{const g=Object.keys(p.cargo||{})[0];return g&&(p.cargo[g]=Math.max(0,p.cargo[g]-2)),g&&!p.cargo[g]&&delete p.cargo[g],""},
            },
          },
          {t:"Take the long way round (three days)",r:"Three days and a broken axle, but no toll.",fx:{}},
        ],
      },
    ]);
  })();
})();
