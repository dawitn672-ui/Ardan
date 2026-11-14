// The release's event pack 8 of 30 (85 events, mostly ct_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-028). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const RM = p=>p&&p.ruler?A.realm(p.ruler):null,
      LR = p=>A.realm(p&&p.noble&&p.noble.realm?p.noble.realm:p.realm),
      inc = (p,f,min)=>{const r=RM(p);return Math.max(min||300,Math.round((r&&r.income?r.income:0)*f))},
      F = n=>A.fmt(n),
      cl = v=>A.clamp(v,0,100),
      rung = p=>p.noble?p.noble.rung:p.status==="royal"||p.status==="noble"?4:p.status==="gentry"?1:0,
      NB = (p,C)=>C.adult(p)&&!C.ruler(p)&&(C.noble(p)||p.status==="gentry"||!!(p.noble&&p.noble.rung>=2)),
      BL = (p,C)=>C.adult(p)&&!C.ruler(p)&&(p.status==="royal"||p.status==="noble"||!!(p.noble&&p.noble.rung>=4)),
      RU = (p,C)=>C.ruler(p)&&!!RM(p),
      RUA = (p,C)=>C.ruler(p)&&C.adult(p)&&!!RM(p),
      sir = p=>p.sex==="F"?"Dame":"Sir",
      lordly = p=>p.sex==="F"?"My Lady":"My Lord",
      addr = p=>{const n=rung(p);return p.status==="royal"?"Your Highness":n>=8?"Your Grace":n>=4?lordly(p):n>=2?sir(p)+" "+p.given:(p.sex==="F"?"Mistress ":"Master ")+p.given},
      liege = p=>{const r=LR(p),ru=r?A.P(r.ruler):null;return ru&&ru.id!==p.id?A.rulerStyle(ru,r):"your liege"},
      houses = (rid,p)=>Object.values(A.S.houses||{}).filter(h=>h.realm===rid&&h.kind!=="royal"&&!h.extinct&&(!p||h.id!==p.house)),
      vass = p=>p.ruler?houses(p.ruler):[],
      setHouse = (ctx,p,rid,filt)=>{const id=rid||p.ruler||p.realm;let l=houses(id,p);if(filt){const f=l.filter(filt);f.length&&(l=f)}const h=l.length?A.pick(l):null;return ctx.hid=h?h.id:"",ctx.house=h?h.name:"a rival house of "+A.realmShort(id),ctx.House=A.cap(ctx.house),ctx.seat=h&&h.seat?h.seat:A.provName(p.home),h},
      hop = (ctx,d)=>{const h=ctx&&ctx.hid?A.S.houses[ctx.hid]:null;h&&(h.op=cl((h.op!=null?h.op:50)+d))},
      allOp = (p,d)=>{for(const h of vass(p))h.op=cl((h.op!=null?h.op:50)+d)},
      st = (r,d)=>{r.stability=cl(r.stability+d)},
      lg = (r,d)=>{r.legit=cl(r.legit+d)},
      rf = fn=>(p,ctx)=>{const r=RM(p);if(!r)return"";const o=fn(r,p,ctx||{});return typeof o=="string"?o:""},
      others = p=>{const own=p.ruler||p.realm;return Object.values(A.S.realms).filter(r=>r.alive&&r.id!==own&&!r.isRebel&&r.ruler)},
      other = p=>{const l=others(p);return l.length?A.pick(l):null},
      throneWar = r=>A.S.wars.some(w=>w.cb==="throne"&&(w.def.includes(r.id)||w.att.includes(r.id))),
      heirOf = r=>{const h=r&&r.heir?A.P(r.heir):null;return h&&h.alive?h:null},
      seatHolder = (r,seat)=>{const q=r&&r.council?A.P(r.council[seat]):null;return q&&q.alive?q:null},
      pay = (p,n)=>{p.coin=Math.max(0,p.coin-n)},
      cost = (p,b)=>Math.round(b*[1,1,1.5,2.5,6,10,18,28,45][Math.min(8,Math.max(0,rung(p)))]),
      npcNoble = (p,ctx,hid,sex)=>{const q=A.genNoble(p.realm,"noble",hid||null,A.ri(22,50),sex);return ctx.pid=q.id,q},
      knight = p=>!p.noble||p.noble.rung<2?(p.noble={rung:2,realm:p.realm,holding:p.noble?p.noble.holding:null},p.title=sir(p),`You are ${sir(p)} ${p.given} now.`):"",
      ownBlood = p=>A.hasBlood(p,"unpoisoned")||A.hasBlood(p,"taster"),
      nm = r=>r?/^the /i.test(r.short)?r.short:/(Winds|Clans|Isles)$/.test(r.short)?"the "+r.short:r.short:"a far realm",
      temple = p=>{const f=A.faith(p.faith);return f?f.name:"the faith"},
      CROWN = {
        "POL-01": "At the Oath Hall in Kingsmere you must swear on the iron ring before the lords, and every great lord must swear back to you on it.",
        "POL-02": "The Luminaries crown their High Luminary on the Sunday after the vote, at noon, in the Needle Court.",
        "POL-03": "No Varennese king is king until the Temple crowns him on Return Day, and the Luminary of Varenna expects his crowning gift.",
        "POL-15": "The Temple must crown the heir of Morhaven on Return Day. The Temple still remembers crowning gifts that were never paid.",
        "POL-05": "Ashmere crowns in the Temple chapel, but the villages swear on the iron ring. Both rites want to come first.",
        "POL-08": "Before the Ring of jarls and the Lawspeaker you must swear on the Oathfather's ring to keep the Free Halls.",
        "POL-14": "Only a Tidewell who dived for the harbor ring at seven may be crowned in Greyhaven. Old captains will ask you to tell the dive again.",
        "POL-18": 'Your crowning stands only if the High Flood-Priest declares the flood of your first year "fair". The river is low this spring.',
        "POL-20": "The High Rememberer must sing your whole line on the Ancestor Hill. One wrong name, and the crowd will mutter for a generation.",
        "POL-22": "Abara's twin crown changes hands at dawn on New Year's Day, and the Rememberers watch that no hand clings to it.",
        "POL-25": "You are not king until the Patriarch of Dawn anoints you at dawn in the Dawn Cathedral. Only there does he walk before you.",
        "POL-26": "The lesser Patriarch must crown you at Drevna while the Lake Council watches, and everyone remembers the clause that can set a ruler aside.",
        "POL-28": "You must carry an ingot from the First Hall to the Crown Shelf on Mount Bardun, 7,000 meters up, before the Eldest Carver cuts your name.",
        "POL-29": "At the Kindling you must lift the Anvil of Dagna, ninety kilos of iron, above your head and hold it while the hall counts to thirty.",
        "POL-30": "At your crowning the white elephant must kneel before you. Moon-Pearl is fifty-eight, slow and half blind.",
        "POL-17": "You must stand before the Well-Keepers, who weigh every sultan against the Book of Wells before they confirm him.",
        "POL-24": "The Chief Well-Keeper must confirm you before the people of Sabra, and he takes his time about it.",
        "POL-32": "The Well-Keepers must confirm you, and since 1073 every heir must also pass the Storm Watch.",
        "POL-12": "The kurultai of the nine chiefs must raise you. Five votes are enough, as in 913, but every chief wants a gift for his.",
        "POL-10": "The Council of Masters and the Law-Carvers must confirm you before Clan Deepeye.",
        "POL-06": "The Moot of Leaves must confirm you. The Moot has taken ten years over a single question before.",
        "POL-07": "The Council of the Grey Veil must confirm you before the Mistwalker kin and the ship-owners.",
        "POL-11": "The Grey Mothers must name you at the Great Ride, and the Drum Council of shamans must beat the drums for you.",
        "POL-34": "The clan-mothers gather at the Great Ride at Grakmar to confirm you before all the clans.",
        "POL-31": "Tessaria has two crowns and two churches. Whoever crowns you, half the realm will call it a mummery.",
        "POL-31A": "Tessaria has two crowns and two churches. Whoever crowns you, half the realm will call it a mummery.",
      },
      OATH = {
        "POL-01": "New Year's Day at the Oath Hall. One by one the great lords kneel and swear to you on the iron ring.",
        "POL-26": "New Year's Day. The great lords meet as the Lake Council at Drevna, and every eye is on you.",
        "POL-08": "Oathfather's Day. The jarls of the Ring gather at Wolfhaven to renew their oaths on the Oathfather's ring.",
        "POL-22": "Dawn on New Year's Day. The crown of Abara passes between the twin kings, and the court watches every hand.",
      };
    A.defEvents([
      {
        id: "ct_vigil",
        once: !0,
        w: 1.4,
        cond: (p,C)=>NB(p,C)&&!(p.noble&&p.noble.rung>=2)&&C.ageAdj(p)<30&&!C.flag(p,"ct_knighted"),
        title: "The vigil of arms",
        text: p=>`Your lord will dub you at dawn. Tonight you must keep vigil in the chapel at ${A.provName(p.home)}, alone with your sword on the altar of ${temple(p)}. ${A.pick(["The stone floor is cold as a grave.","The candles gutter. Outside, your friends are getting drunk on your behalf.","An old knight told you he fell asleep at his and never lived it down."])}`,
        choices: [
          {
            t: "Kneel without moving until dawn",
            check: {s:"wil",s2:"faith",d:42},
            win: {
              r: "At dawn your knees will not straighten, but your eyes are clear. The sword touches your shoulder.",
              fx: p=>(p.flags.ct_knighted=A.S.year,A.willGrow(p,1.5),p.piety=cl(p.piety+4),A.fame(p,3),knight(p)),
            },
            lose: {
              r: "You wake with your cheek on the altar step. The priest says nothing. Everyone knows by noon. You are dubbed anyway, to sniggers.",
              fx: p=>(p.flags.ct_knighted=A.S.year,A.willGrow(p,1),p.happy=cl(p.happy-6),knight(p)),
            },
          },
          {
            t: "Pray in earnest for the strength to deserve it",
            r: "You ask for little and mean every word. The dubbing is quiet and true.",
            fx: p=>(p.flags.ct_knighted=A.S.year,p.piety=cl(p.piety+7),p.honor=cl(p.honor+3),knight(p)),
          },
          {
            t: "Slip out to join the feast and come back before dawn",
            check: {s:"stealth",s2:"spd",d:45},
            win: {
              r: "Nobody notices. You are dubbed with wine still on your breath and a grin you cannot hide.",
              fx: p=>(p.flags.ct_knighted=A.S.year,p.happy=cl(p.happy+6),knight(p)),
            },
            lose: {
              r: "The chaplain meets you at the chapel door. The dubbing is put off for a year, and your lord is not amused.",
              fx: {favor:-10,honor:-5,happy:-5},
            },
          },
        ],
      },
      {
        id: "ct_squire",
        cool: 10,
        cond: (p,C)=>NB(p,C)&&C.ageAdj(p)<24&&!(p.noble&&p.noble.rung>=2),
        setup: (p,ctx)=>{const q=npcNoble(p,ctx,null,"M");q.noble={rung:2,realm:p.realm,holding:null},ctx.kn="Sir "+q.given},
        title: "A squire's service",
        text: p=>`You serve as squire to {kn}, a hard old knight who ${A.pick(["beats his horse less than his squires","has not lost a joust in nine years","snores like a siege engine","talks to his sword at night"])}. You carry his lance, oil his mail and ride behind him. Three campaigns or one great deed, and you may be knighted yourself.`,
        choices: [
          {
            t: "Learn everything he will teach you",
            r: "{kn} teaches by bruises. You learn fast.",
            fx: {skill:{sword:3,riding:3,lance:2},wil:.6,them:{type:"mentor",op:25,back:"friend"}},
          },
          {
            t: "Ride behind him into a skirmish",
            r: "Brigands on the road. {kn} charges; you follow.",
            fx: {
              duel: {
                tier: 2,
                title: "a brigand",
                opts: {kind:"duel",place:"a muddy lane",toYield:!0,title:"Your first real fight"},
              },
              them: {type:"mentor",op:15,back:"friend"},
            },
          },
          {
            t: "Carry his love letters to a lady at court",
            check: {s:"intrigue",s2:"int",d:38},
            win: {
              r: "You deliver every letter unread and unseen. {kn} owes you, and the lady's maid smiles at you now.",
              fx: {skill:{intrigue:3},them:{type:"friend",op:30}},
            },
            lose: {
              r: "The lady's husband intercepts a letter. You take the beating meant for your master.",
              fx: {health:-8,wil:1,them:{type:"friend",op:20}},
            },
          },
        ],
      },
      {
        id: "ct_joust",
        cool: 4,
        cond: (p,C)=>NB(p,C)&&C.ageAdj(p)<45&&p.health>40,
        setup: (p,ctx)=>{ctx.fest=A.pick(["May Fair","Return Day","Harvest Home","the Spring Equinox"]),ctx.purse=cost(p,40)},
        title: "The lists",
        text: p=>`A tournament at ${A.realm(p.realm)?A.realm(p.realm).capital:"court"} for {fest}. Heralds cry your name. Across the tilt waits ${A.pick(["a champion from "+A.realmShort(A.enemyRealmOf(p.realm)||p.realm),"a giant of a baron on a grey destrier","a young knight with a borrowed lance and something to prove","the liege's own nephew, whom nobody is meant to unhorse"])}. The purse is ${A.coin(cost(p,40))}.`,
        choices: [
          {
            t: "Ride hard and aim true",
            check: {s:"lance",s2:"riding",d:48},
            win: {
              r: "Your lance shatters on his shield and he goes over his horse's tail. The stands roar.",
              fx: (p,ctx)=>(p.coin+=ctx.purse||40,A.fame(p,3),p.happy=cl(p.happy+6),`You win ${A.coin(ctx.purse||40)}.`),
            },
            lose: {
              r: "His lance takes you under the shield. You wake in the surgeons' tent.",
              fx: {health:-14,wound:"broken_ribs",wil:1,cause:"a jousting fall"},
            },
          },
          {
            t: "Ride safe: break lances, stay mounted",
            check: {s:"riding",s2:"sta",d:38},
            win: {
              r: "Three passes, three broken lances, no falls. Respectable. A small prize for good form.",
              fx: (p,ctx)=>{p.coin+=Math.round((ctx.purse||40)/4),A.fame(p,1)},
            },
            lose: {
              r: "Your horse shies at the barrier and you are counted out. The crowd laughs.",
              fx: {happy:-5,fame:-1},
            },
          },
          {
            t: "Bet on yourself as well",
            req: p=>p.coin>=20,
            check: {s:"lance",s2:"ins",d:52},
            win: {
              r: "You unhorse him and collect from every fool who bet against you.",
              fx: (p,ctx)=>{p.coin+=(ctx.purse||40)*2,A.fame(p,3)},
            },
            lose: {
              r: "You lose the joust and the bet.",
              fx: (p,ctx)=>{pay(p,Math.round((ctx.purse||40)/2)),p.health-=8,p.lastHurt="a jousting fall"},
            },
          },
        ],
      },
      {
        id: "ct_melee",
        cool: 7,
        cond: (p,C)=>NB(p,C)&&C.ageAdj(p)<42&&p.health>50,
        title: "The grand melee",
        text: p=>`The tournament ends in the grand melee: forty knights in two teams, blunted swords, and a field of mud. ${A.pick(["Last year a man died in it.","The ladies watch from the stands with ribbons ready.","Your team captain is drunk."])} ${addr(p)}, your side needs you.`,
        choices: [
          {
            t: "Wade into the thick of it",
            r: "You pick the biggest knight on the other side.",
            fx: {
              duel: {
                tier: 3,
                title: "a knight of the other team",
                troop: "HC",
                opts: {kind:"duel",place:"the melee field",lethal:!1,toYield:!0,title:"The grand melee"},
              },
            },
          },
          {
            t: "Hang back and take prisoners for ransom",
            check: {s:"tactics",s2:"ins",d:44},
            win: {
              r: "You pick off three exhausted knights. Their ransoms pay for a year.",
              fx: p=>{const g=cost(p,30);return p.coin+=g,p.honor=cl(p.honor-1),`+${A.coin(g)} in ransoms.`},
            },
            lose: {
              r: "Two knights corner you in the mud. You pay your own ransom.",
              fx: p=>{pay(p,cost(p,12)),p.health-=6},
            },
          },
          {
            t: "Guard your team captain",
            check: {s:"shield",s2:"str",d:42},
            win: {r:"He stays on his feet because you do. He remembers it.",fx:{newRel:{type:"friend",op:35},fame:2}},
            lose: {r:"You both go down under a pile of steel.",fx:{health:-10,wound:"concussion"}},
          },
        ],
      },
      {
        id: "ct_favor_lance",
        cool: 8,
        cond: (p,C)=>NB(p,C)&&C.ageAdj(p)<40,
        setup: (p,ctx)=>{const l=A.makeLoveInterest(p);ctx.pid=l.id},
        title: "A favor on your lance",
        text: ()=>`Before the tilt, {themFull} leans over the barrier and ties a silk ribbon to your lance. The whole stand sees it. ${A.pick(["A spouse somewhere in the crowd sees it too.","Courtly love has rules: worship from afar, write poems, and keep your hands to yourself.","The heralds grin. This will be a song by nightfall."])}`,
        choices: [
          {
            t: "Ride for that ribbon and win",
            check: {s:"lance",s2:"riding",d:46},
            win: {
              r: "You win and lay the broken lance at {them}'s feet. The court sighs. Later there is a walk in the rose garden, and the rest is your business.",
              fx: {them:{type:"lover",op:40,back:"lover"},fame:2,happy:8},
            },
            lose: {
              r: "You lose, but {them} keeps the ribbon you bled on. Courtly love thrives on noble defeat.",
              fx: {them:{type:"friend",op:25},health:-6,happy:3},
            },
          },
          {
            t: "Answer with a poem in the old courtly style",
            check: {s:"music",s2:"int",d:40},
            win: {
              r: "The verses are passed around court. {them} blushes every time you enter a room.",
              fx: {them:{type:"lover",op:30,back:"lover"},skill:{music:3}},
            },
            lose: {r:'Your rhyme for "ribbon" becomes a court joke.',fx:{happy:-4,skill:{music:1}}},
          },
          {
            t: "Return the ribbon with a courteous bow",
            r: "Correct, cool and wise. {them} is stung, but your name stays clean.",
            fx: {honor:3,them:{type:"acquaint",op:-5}},
          },
        ],
      },
      {
        id: "ct_precedence",
        cool: 6,
        cond: NB,
        setup: (p,ctx)=>{setHouse(ctx,p,p.realm);const n=rung(p);ctx.lower=n>=4?"a general":n>=2?"a baron's landless cousin":"a wealthy wool-merchant"},
        title: "Precedence",
        text: p=>`At ${liege(p)}'s feast, {lower} of {house} sits down in your place, nearer the high table. By the court list, birth beats office at the top and office beats birth below it. Every eye in the hall is on you, waiting to see who gives way.`,
        choices: [
          {
            t: "Cite the precedence roll, rung by rung",
            check: {s:"learning",s2:"diplomacy",d:42},
            win: {
              r: "The steward checks the roll and moves the man two benches down. You sit, and nobody forgets it.",
              fx: {fame:2,honor:2,skill:{learning:1}},
            },
            lose: {
              r: "You get the rule backwards. The steward corrects you in front of the hall.",
              fx: {fame:-2,happy:-4},
            },
          },
          {
            t: "Give way graciously and sit lower",
            r: "You smile and take the lower bench. A few old lords nod at your good manners. A few young ones think you weak.",
            fx: {honor:2,favor:3,trait:"humble"},
          },
          {
            t: "Lift him out of the chair by his collar",
            check: {s:"str",s2:"ins",d:40},
            win: {
              r: "He lands on the rushes. You sit. The hall goes very quiet, then very loud.",
              fx: (p,ctx)=>{A.fame(p,2),hop(ctx,-10),p.honor=cl(p.honor-2)},
            },
            lose: {
              r: "He is stronger than he looks. It becomes a brawl, and you are both thrown out.",
              fx: (p,ctx)=>{hop(ctx,-8),p.health-=5,p.lastHurt="a brawl",A.applyFx(p,{favor:-8},ctx)},
            },
          },
        ],
      },
      {
        id: "ct_herald",
        cool: 10,
        cond: (p,C)=>NB(p,C)&&rung(p)>=2,
        title: "The wrong style",
        text: p=>`A new herald announces you to the court as "${p.sex==="F"?"Goodwife":"Goodman"} ${p.given}", the style of a franklin. ${A.pick(["Someone giggles behind a fan.","A rival lord makes a show of choking on his wine.","The herald goes white as he realizes."])} Your proper style is "${addr(p)}".`,
        choices: [
          {
            t: "Laugh it off with a joke at your own expense",
            check: {s:"diplomacy",s2:"int",d:35},
            win: {
              r: "The court laughs with you, not at you. The herald will be grateful for life.",
              fx: {fame:1,newRel:{type:"friend",op:30}},
            },
            lose: {r:"The joke lands badly. Now there are two embarrassments.",fx:{happy:-3}},
          },
          {
            t: "Demand the herald be dismissed",
            r: "He is dismissed. The court decides you are touchy.",
            fx: {honor:-1,fame:-1,trait:"proud"},
          },
          {
            t: "Say nothing, and find out who paid him to do it",
            check: {s:"intrigue",s2:"ins",d:48},
            win: {
              r: "A rival lord slipped him two suns. You keep the knowledge for a better day.",
              fx: {skill:{intrigue:3},newRel:{type:"rival",op:-30}},
            },
            lose: {r:"It really was just a mistake. You wasted a week sniffing for plots.",fx:{skill:{intrigue:1}}},
          },
        ],
      },
      {
        id: "ct_bailiff",
        cool: 8,
        cond: (p,C)=>NB(p,C)&&rung(p)>=2,
        setup: (p,ctx)=>{const q=A.makeAcquaintance(p,"acquaint");ctx.pid=q.id,ctx.loss=cost(p,15)},
        title: "The bailiff's rolls",
        text: p=>`Your bailiff, {themFull}, brings the manor rolls at ${A.pick(["Harvest Home","Michaelmas rent day","the spring court","the quarter day"])}. The rents are down again: "a wet year, my ${p.sex==="F"?"lady":"lord"}." But the bailiff has a new horse, and his wife wears a silver brooch.`,
        choices: [
          {
            t: "Go through every line of the rolls yourself",
            check: {s:"stewardship",s2:"int",d:44},
            win: {
              r: "Two mills recorded as broken are grinding fine. The bailiff pays back {loss} suns and begs to keep his post.",
              fx: (p,ctx)=>{p.coin+=ctx.loss||15,A.trainSkill(p,"stewardship",2),A.applyFx(p,{them:{type:"acquaint",op:-20}},ctx)},
            },
            lose: {
              r: "The figures defeat you. He has done this longer than you have been alive.",
              fx: {skill:{stewardship:2},happy:-3},
            },
          },
          {
            t: "Dismiss him and hire his honest deputy",
            r: "The new bailiff is slow, careful and poor. Rents rise next year.",
            fx: (p,ctx)=>{p.coin+=Math.round((ctx.loss||15)/2),A.applyFx(p,{them:{type:"enemy",op:-30}},ctx)},
          },
          {
            t: "Let it go. Every bailiff skims a little",
            r: "He skims a little more next year. You pretend not to notice.",
            fx: (p,ctx)=>{pay(p,Math.round((ctx.loss||15)/3))},
          },
        ],
      },
      {
        id: "ct_tenants",
        cool: 7,
        cond: (p,C)=>NB(p,C)&&rung(p)>=2,
        setup: (p,ctx)=>{ctx.rent=cost(p,20)},
        title: "Rent day",
        text: p=>`${A.pick(["Hail flattened the barley.","Murrain took half the village oxen.","Floods drowned the low fields.","The rye came in black with ergot."])} Your tenants of ${A.provName(p.home)} gather in the yard, caps in their hands. The reeve says they cannot pay the {rent} suns of the quarter rent. Their children are thin.`,
        choices: [
          {
            t: "Forgive the quarter's rent",
            r: "The village talks about you for years. Some of it is even true.",
            fx: (p,ctx)=>(p.honor=cl(p.honor+5),p.happy=cl(p.happy+3),A.fame(p,1),`You forgo ${A.coin(ctx.rent||20)}.`),
          },
          {
            t: "Take half now, half next year",
            check: {s:"stewardship",s2:"diplomacy",d:36},
            win: {
              r: "A fair bargain. Next year they pay in full, with a goose on top.",
              fx: (p,ctx)=>{p.coin+=Math.round((ctx.rent||20)/2),A.trainSkill(p,"stewardship",2)},
            },
            lose: {
              r: "Half is still too much. Two families run off by night.",
              fx: (p,ctx)=>{p.coin+=Math.round((ctx.rent||20)/3),p.honor=cl(p.honor-1)},
            },
          },
          {
            t: "The rent is the rent. Seize their goods",
            r: 'You take pots, pigs and a plough. The village says your name the way it says "murrain".',
            fx: (p,ctx)=>{p.coin+=ctx.rent||20,p.honor=cl(p.honor-6),A.addTrait(p,"greedy")},
          },
        ],
      },
      {
        id: "ct_poacher",
        cool: 7,
        cond: (p,C)=>NB(p,C)&&rung(p)>=2,
        setup: (p,ctx)=>{const q=A.makeAcquaintance(p,"acquaint");ctx.pid=q.id,ctx.what=A.pick(["a hind across his shoulders","three of your rabbits and a snare","a fat buck","a brace of your pheasants"])},
        title: "The poacher",
        text: ()=>`Your foresters drag in a poacher caught at dawn with {what}: {themFull}, {themAge}, ${A.pick(["a veteran with one ear and a hungry family","a boy who will not stop shaking","a widow's son who says he only took what the deer ate of his barley","a sullen man who has been caught twice before"])}. Forest law is harsh. The hanging tree is already chosen.`,
        choices: [
          {
            t: "Hang him. The law is the law",
            r: "The village watches in silence. No one poaches your woods again for a long time.",
            fx: {honor:-4,trait:"cruel",fame:1},
          },
          {
            t: "A fine and a flogging",
            r: "He takes the lash without a sound. Justice, of the low kind.",
            fx: {coin:5,honor:1},
          },
          {
            t: "Make him your under-forester. Who knows the woods better?",
            check: {s:"ins",s2:"diplomacy",d:38},
            win: {
              r: "He becomes the best forester you ever had, and loyal as a hound.",
              fx: {them:{type:"friend",op:40},honor:2,skill:{survival:2}},
            },
            lose: {
              r: "He runs off within the month with your best hunting bow.",
              fx: {them:{type:"enemy",op:-20},happy:-3},
            },
          },
        ],
      },
      {
        id: "ct_mill",
        cool: 8,
        cond: (p,C)=>NB(p,C)&&rung(p)>=2,
        setup: (p,ctx)=>{setHouse(ctx,p,p.realm)},
        title: "The mill",
        text: p=>`${A.pick([`The lord of {seat} for {house} has built a weir upstream, and your mill wheel at ${A.provName(p.home)} turns at half speed.`,"Your tenants are grinding their grain at home on hand-querns to dodge the mill fee. The miller says he will starve.","The abbey's new mill below yours undercuts your fee by a third."])} Mill fees are half your income from the manor.`,
        choices: [
          {
            t: "Take it before the liege's court",
            check: {s:"diplomacy",s2:"learning",d:45},
            win: {
              r: "The court rules for you, with costs. Your wheel turns again.",
              fx: (p,ctx)=>{const g=cost(p,12);p.coin+=g,hop(ctx,-4)},
            },
            lose: {
              r: "The court rules against you, and the lawyers cost more than the mill earns.",
              fx: p=>{pay(p,cost(p,8))},
            },
          },
          {
            t: "Send men at night to break the weir and the querns",
            check: {s:"stealth",s2:"command",d:44},
            win: {
              r: "By morning the water runs and the querns are smashed. No one can prove a thing.",
              fx: (p,ctx)=>{p.coin+=cost(p,8),hop(ctx,-10),p.honor=cl(p.honor-3)},
            },
            lose: {
              r: "Your men are caught. It becomes a feud.",
              fx: (p,ctx)=>{hop(ctx,-18),p.flags.ct_feud=A.S.year,p.honor=cl(p.honor-4)},
            },
          },
          {
            t: "Lower your fee and win them back fairly",
            r: "Less per sack, but more sacks. The village likes you better.",
            fx: {honor:2,skill:{stewardship:3}},
          },
        ],
      },
      {
        id: "ct_boundary",
        cool: 9,
        cond: (p,C)=>NB(p,C)&&rung(p)>=2,
        setup: (p,ctx)=>{setHouse(ctx,p,p.realm);const h=A.S.houses[ctx.hid],hd=h?A.houseHead(h.id):null;ctx.pid=hd?hd.id:npcNoble(p,ctx).id},
        title: "Moved stones",
        text: ()=>"Overnight the boundary stones between your land and the lands of {house} have walked forty paces into your best meadow. Your shepherd swears he saw riders with {themFull}'s colors. Your grandfather fought over that meadow.",
        choices: [
          {
            t: "Ride out with your men and put the stones back",
            check: {s:"command",s2:"wil",d:45},
            win: {
              r: "You face their riders across the meadow. They back down. The stones go back, and so does your pride.",
              fx: (p,ctx)=>{A.fame(p,2),hop(ctx,-8),p.flags.ct_feud=A.S.year,A.applyFx(p,{them:{type:"rival",op:-20}},ctx)},
            },
            lose: {
              r: "Their riders outnumber yours. Steel is drawn. You come home bleeding and without the meadow.",
              fx: (p,ctx)=>{p.health-=12,p.lastHurt="a feud skirmish",A.addWound(p,"deep_cut"),A.willGrow(p,1.5),p.flags.ct_feud=A.S.year,A.applyFx(p,{them:{type:"enemy",op:-30}},ctx)},
            },
          },
          {
            t: "Sue before the liege's court with the old charters",
            check: {s:"learning",s2:"diplomacy",d:42},
            win: {
              r: "Your charter is older and has the better seal. The stones are ordered back.",
              fx: (p,ctx)=>{hop(ctx,-5),A.applyFx(p,{them:{type:"rival",op:-10}},ctx)},
            },
            lose: {
              r: "Their charter has the better seal. Perhaps it is even genuine. You lose the meadow.",
              fx: p=>{pay(p,cost(p,6)),p.happy=cl(p.happy-5)},
            },
          },
          {
            t: "Let them have the meadow for the sake of peace",
            r: "Peace, at the price of a meadow and a little of your name.",
            fx: {honor:-2,happy:-3},
          },
        ],
      },
      {
        id: "ct_cattle_raid",
        cool: 6,
        cond: (p,C)=>NB(p,C)&&C.flag(p,"ct_feud"),
        setup: (p,ctx)=>{setHouse(ctx,p,p.realm)},
        title: "The feud burns",
        text: p=>`${A.cap(A.pick(["men of {house} drove off forty head of your cattle","someone fired your hay barns at night, and the tracks lead toward {seat}","your reeve was found beaten in a ditch, and {house} laughs about it in the taverns"]))}. The feud is getting worse. Your people at ${A.provName(p.home)} look to you.`,
        choices: [
          {
            t: "Raid them back, twice as hard",
            check: {s:"command",s2:"tactics",d:46},
            win: {
              r: "You burn their mill and drive off their cattle and their pride. Your people cheer.",
              fx: (p,ctx)=>{p.coin+=cost(p,10),A.fame(p,2),hop(ctx,-15),p.honor=cl(p.honor-2)},
            },
            lose: {
              r: "They were waiting. You lose good men in the dark.",
              fx: (p,ctx)=>{p.health-=15,p.lastHurt="a feud ambush",A.addWound(p,"arrow_wound"),A.willGrow(p,2),hop(ctx,-10)},
            },
          },
          {
            t: "Offer a marriage between the houses to end it",
            check: {s:"diplomacy",s2:"int",d:48},
            win: {
              r: "A cousin of yours, a cousin of theirs, a wedding feast with too much wine. The feud ends in a hangover.",
              fx: (p,ctx)=>{delete p.flags.ct_feud,hop(ctx,25),A.fame(p,1),p.honor=cl(p.honor+3)},
            },
            lose: {r:"They take the offer as weakness and send back an insult.",fx:{happy:-5,wil:1}},
          },
          {
            t: "Appeal to your liege to judge the feud",
            r: p=>`${liege(p)} fines both houses and forbids private war. The feud cools, but not the hate.`,
            fx: (p,ctx)=>{delete p.flags.ct_feud,pay(p,cost(p,8)),A.applyFx(p,{favor:3},ctx)},
          },
        ],
      },
      {
        id: "ct_peace_kiss",
        once: !0,
        cond: (p,C)=>NB(p,C)&&C.flag(p,"ct_feud")&&A.S.year-p.flags.ct_feud>=2,
        setup: (p,ctx)=>{setHouse(ctx,p,p.realm)},
        title: "The kiss of peace",
        text: ()=>`The head of {house} sends a priest with an offer: meet at the boundary chapel, exchange the kiss of peace before the altar, pay blood-price for the dead on both sides, and let the feud end. ${A.pick(["Your people are tired.","Your mother says it is a trap.","Your eldest wants revenge, not peace."])}`,
        choices: [
          {
            t: "Go, and mean it",
            r: "You kiss your enemy on both cheeks before the altar. It tastes of ashes and relief. The feud is over.",
            fx: (p,ctx)=>{delete p.flags.ct_feud,hop(ctx,30),p.honor=cl(p.honor+5),p.piety=cl(p.piety+3),p.happy=cl(p.happy+5)},
          },
          {
            t: "Go armed under your cloak, in case",
            check: {s:"ins",s2:"wil",d:40},
            win: {
              r: "No trap. Your hidden mail chafes through the whole Mass, but the peace is made.",
              fx: (p,ctx)=>{delete p.flags.ct_feud,hop(ctx,20)},
            },
            lose: {
              r: "They see the mail under your cloak. The priest declares the peace broken by you.",
              fx: (p,ctx)=>{hop(ctx,-10),p.honor=cl(p.honor-6)},
            },
          },
          {
            t: "Refuse. Blood is owed",
            r: "The priest goes home. The feud goes on.",
            fx: {honor:-1,wil:.5,trait:"wrathful"},
          },
        ],
      },
      {
        id: "ct_match",
        cool: 6,
        cond: (p,C)=>NB(p,C)&&!C.married(p)&&C.ageAdj(p)<38,
        setup: (p,ctx)=>{setHouse(ctx,p,p.realm);const q=A.genNoble(p.realm,"noble",ctx.hid||null,Math.max(16,A.age(p)+A.ri(-6,6)),p.sex==="M"?"F":"M");ctx.pid=q.id,ctx.dower=cost(p,60)},
        title: "A match is proposed",
        text: p=>`Your family has found you a match: {themFull} of {house}, {themAge}. ${A.pick(["Plain, sharp and said to keep accounts better than a Lucernan banker.","Handsome and dull as a fence post.","Shy, devout and very rich.","Clever, and rumored to have broken off two betrothals already."])} The dowry is {dower} suns and an alliance. Below the count, the lord above must give leave, and ${liege(p)} has.`,
        choices: [
          {
            t: "Accept the match",
            r: "A wedding with too many relatives and not enough chairs. You are married.",
            fx: (p,ctx)=>{const t=A.P(ctx.pid);return t&&(A.marry(p,t),hop(ctx,12)),""},
          },
          {
            t: "Ask to court {them} properly first",
            check: {s:"diplomacy",s2:"int",d:40,bonus:p=>p.looks/4-12},
            win: {
              r: "A season of walks and letters. By the wedding you actually like each other.",
              fx: (p,ctx)=>{const t=A.P(ctx.pid);return t&&(A.marry(p,t),A.addOp(p,t,25),hop(ctx,15),p.happy=cl(p.happy+5)),""},
            },
            lose: {
              r: "{them} finds you tiresome and the match falls through. Your family is furious.",
              fx: {rel:{who:"father",op:-10},happy:-4},
            },
          },
          {
            t: "Refuse. You will choose for yourself",
            r: "Your family calls you ungrateful. {house} calls you worse.",
            fx: (p,ctx)=>{hop(ctx,-12),A.applyFx(p,{rel:{who:"father",op:-15}},ctx),A.addTrait(p,"stubborn")},
          },
        ],
      },
      {
        id: "ct_scutage",
        cool: 7,
        cond: (p,C)=>NB(p,C)&&rung(p)>=2&&!C.atWar(p),
        setup: (p,ctx)=>{ctx.fee=cost(p,18)},
        title: "Shield-money",
        text: p=>`${liege(p)} needs coin, not men, this year. Writs go out to every holder of a fief: forty days of host or scutage in its place. Your share is {fee} suns. ${A.pick(["The chancery clerk who brings it looks embarrassed.","The writ is sealed in black wax.","Rumor says the money will pay for a mistress's new palace."])}`,
        choices: [
          {
            t: "Pay promptly and with good grace",
            r: "Your name goes on the roll of the willing. Such rolls are read when favors are given out.",
            fx: (p,ctx)=>{pay(p,ctx.fee||18),A.applyFx(p,{favor:8},ctx)},
          },
          {
            t: "Plead a poor harvest and ask for a reduction",
            check: {s:"diplomacy",s2:"stewardship",d:42},
            win: {
              r: "The clerk halves it. You owe him a cask of wine.",
              fx: (p,ctx)=>{pay(p,Math.round((ctx.fee||18)/2))},
            },
            lose: {
              r: "The clerk adds a fine for the trouble.",
              fx: (p,ctx)=>{pay(p,Math.round((ctx.fee||18)*1.3)),A.applyFx(p,{favor:-3},ctx)},
            },
          },
          {
            t: "Serve your forty days in person instead",
            r: "You ride to the border fort and spend forty days staring at fog. You come back harder.",
            fx: {sta:.6,skill:{command:2,riding:2},favor:4,wil:.5},
          },
          {
            t: "Refuse. It is not a war year",
            r: "The crown remembers. Refusing the summons three times can cost a title.",
            fx: {favor:-15,honor:2,flag:"ct_refused"},
          },
        ],
      },
      {
        id: "ct_aid",
        cool: 10,
        cond: (p,C)=>NB(p,C)&&rung(p)>=2,
        setup: (p,ctx)=>{ctx.why=A.pick(["the knighting of the liege's eldest son","the marriage of the liege's eldest daughter","the ransom of the liege's brother, taken in a border fight"]),ctx.fee=cost(p,12)},
        title: "The customary aid",
        text: ()=>"By old custom a vassal owes his lord aid for three things: his ransom, his eldest son's knighting and his eldest daughter's marriage. This year it is {why}. Your share: {fee} suns, or a gift of equal worth.",
        choices: [
          {
            t: "Pay in coin",
            r: "Paid. Custom honored.",
            fx: (p,ctx)=>{pay(p,ctx.fee||12),A.applyFx(p,{favor:5},ctx)},
          },
          {
            t: "Send your best horse instead, with ribbons",
            check: {s:"husbandry",s2:"diplomacy",d:38},
            win: {r:"The horse is admired at court far more than coin would be.",fx:{favor:12,fame:1}},
            lose: {r:"The horse goes lame on the road. An awkward gift.",fx:{favor:-2,happy:-3}},
          },
          {
            t: "Pay late and short",
            r: "Nobody says anything. Somebody writes it down.",
            fx: (p,ctx)=>{pay(p,Math.round((ctx.fee||12)/2)),A.applyFx(p,{favor:-6},ctx)},
          },
        ],
      },
      {
        id: "ct_factions",
        cool: 8,
        cond: NB,
        setup: (p,ctx)=>{const r=LR(p);ctx.a=A.pick(["the Old Blood, who say only the great houses should sit on the council","the queen's party, who whisper in the solar","the war party, who want the old border back"]),ctx.b=A.pick(["the New Men, clerks and bankers raised by the crown","the heir's friends, young and impatient","the peace party, who count the cost of every lance"]),ctx.rs=r?r.short:"the realm"},
        title: "Court factions",
        text: ()=>"The court of {rs} is splitting in two: {a}, against {b}. Both sides want you. Neutrality is possible, for a while, and lonely.",
        choices: [
          {
            t: "Join the first party",
            check: {s:"intrigue",s2:"diplomacy",d:44},
            win: {
              r: "You rise with them. Doors open, and some close.",
              fx: {fame:2,favor:6,newRel:{type:"friend",op:30},flag:"ct_faction"},
            },
            lose: {
              r: "Your party loses a vote and you are tarred with it.",
              fx: {favor:-8,newRel:{type:"rival",op:-25},flag:"ct_faction"},
            },
          },
          {
            t: "Join the second party",
            check: {s:"intrigue",s2:"int",d:44},
            win: {
              r: "The New Men need people of birth. They pay well for it.",
              fx: p=>{p.coin+=cost(p,15),A.fame(p,1),p.flags.ct_faction=A.S.year},
            },
            lose: {
              r: "The old houses close ranks against you.",
              fx: {favor:-5,honor:-2,newRel:{type:"enemy",op:-25},flag:"ct_faction"},
            },
          },
          {
            t: "Stay neutral and useful to both",
            check: {s:"diplomacy",s2:"wil",d:50},
            win: {
              r: "Both sides trust you a little. That is worth more than either side's love.",
              fx: {skill:{diplomacy:3,intrigue:2},favor:3},
            },
            lose: {r:"Both sides decide you are with the other.",fx:{happy:-5,favor:-3}},
          },
        ],
      },
      {
        id: "ct_envoy",
        cool: 9,
        cond: (p,C)=>NB(p,C)&&rung(p)>=2&&C.ageAdj(p)>=20,
        setup: (p,ctx)=>{const o=other(p);ctx.dest=o?nm(o):"a neighboring court",ctx.destId=o?o.id:"",ctx.cap=o?o.capital:"a far capital",ctx.task=A.pick(["renew an old treaty","propose a marriage","protest a border raid","buy back a captured lord","carry a sealed letter whose contents no one will tell you"])},
        title: "Sent as envoy",
        text: p=>`${liege(p)} sends you as envoy to {dest}, to {task}. You will ride to {cap} with a herald, two clerks and gifts worth more than your manor. At a foreign table, the envoy of a king stands before the envoy of a prince. Mind your place.`,
        choices: [
          {
            t: "Charm their court",
            check: {s:"diplomacy",s2:"int",d:48},
            win: {
              r: "You come home with what was asked and a gold chain from their sovereign.",
              fx: (p,ctx)=>{A.fame(p,3),p.coin+=cost(p,15),A.applyFx(p,{favor:12},ctx),ctx.destId&&A.addRel(p.realm,ctx.destId,6)},
            },
            lose: {
              r: "You commit a gaffe over precedence at the first banquet. The talks go nowhere.",
              fx: (p,ctx)=>{A.applyFx(p,{favor:-8},ctx),ctx.destId&&A.addRel(p.realm,ctx.destId,-4)},
            },
          },
          {
            t: "Spy while you smile",
            check: {s:"intrigue",s2:"ins",d:50},
            win: {
              r: "You come back with the treaty and a map of their muster rolls. The spymaster pours you wine.",
              fx: {skill:{intrigue:4},favor:10},
            },
            lose: {r:"Your clerk is caught copying letters. You are sent home in disgrace.",fx:{favor:-12,fame:-2}},
          },
          {
            t: "Learn their tongue and customs on the long ride",
            r: "You learn a great deal and achieve exactly what was asked. No more.",
            fx: {int:.6,skill:{diplomacy:3,learning:2},favor:4},
          },
        ],
      },
      {
        id: "ct_hostage",
        cool: 15,
        cond: (p,C)=>NB(p,C)&&rung(p)>=3,
        setup: (p,ctx)=>{const o=other(p);ctx.dest=o?nm(o):"a rival court",ctx.destId=o?o.id:"";const kids=A.relsOf(p,["child"]).filter(x=>x.p.alive&&!A.isAdult(x.p));ctx.kid=kids.length?kids[0].p.given:"",ctx.kidId=kids.length?kids[0].p.id:""},
        title: "A hostage exchange",
        text: p=>`To seal a truce, ${liege(p)} must send hostages of good blood to {dest}, and will hold theirs in return. Your name is on the list. Hostages are treated as honored guests, until the truce breaks.`,
        choices: [
          {
            t: "Go yourself",
            r: "A year among strangers. You learn their ways, their tongue and their weaknesses.",
            fx: (p,ctx)=>{A.trainSkill(p,"diplomacy",3),A.trainSkill(p,"intrigue",2),A.willGrow(p,1.5),A.applyFx(p,{favor:10},ctx),A.fame(p,1)},
          },
          {
            t: "Send your child {kid} in your place",
            req: (p,C,ctx)=>!!(ctx&&ctx.kidId),
            r: "You put {kid} on the wagon. The child does not cry until the road bends. Neither do you.",
            fx: (p,ctx)=>{const k=A.P(ctx.kidId);k&&A.addOp(p,k,-15),A.applyFx(p,{favor:8},ctx),A.willGrow(p,2),p.happy=cl(p.happy-10)},
          },
          {
            t: "Bribe the clerk to strike your name",
            check: {s:"intrigue",s2:"trade",d:40},
            win: {
              r: "Another lord's name goes on the list. He never learns why.",
              fx: p=>{pay(p,cost(p,10)),p.honor=cl(p.honor-4)},
            },
            lose: {
              r: "The clerk takes the money and keeps your name. And tells.",
              fx: p=>{pay(p,cost(p,10)),A.applyFx(p,{favor:-12},{}),A.trainSkill(p,"diplomacy",2)},
            },
          },
        ],
      },
      {
        // [X1 baked patch events/97-first-life-fixes LF-PLOT-AGE] The court plot ("An invitation") was offered to any
        // adult noble of rung 2 or more, so a duke's son of 16 was asked to join a plot against the crown, failed its hard
        // check and was hanged for treason. In the Great Continent league this cut the median noble life's peak wealth to
        // a third of its band. Conspirators now only approach a noble of 20 or more.
        id: "ct_plot_invite",
        cool: 10,
        cond: (p,C)=>NB(p,C)&&rung(p)>=2&&C.age(p)>=20,
        setup: (p,ctx)=>{setHouse(ctx,p,p.realm);const h=A.S.houses[ctx.hid],hd=h?A.houseHead(h.id):null;ctx.pid=hd?hd.id:npcNoble(p,ctx).id,ctx.target=A.pick(["the chancellor","the queen's favorite","the treasurer and his bankers","the crown itself"])},
        title: "An invitation",
        text: ()=>'After the hunt, {themFull} of {house} draws you aside under the oaks. "A few of us mean to deal with {target} before the new year. We need one more name, one more sword, one more seal. Yours." Treason has a smell. This smells of it.',
        choices: [
          {
            t: "Join the plot",
            check: {s:"intrigue",s2:"int",d:55},
            win: {
              r: "The plot succeeds. New men rise, and you rise with them.",
              fx: (p,ctx)=>{A.fame(p,3),p.coin+=cost(p,25),A.trainSkill(p,"intrigue",3),A.applyFx(p,{them:{type:"friend",op:30}},ctx)},
            },
            lose: {
              r: "Someone talks. The guards come at dawn.",
              fx: (p,ctx)=>(A.applyFx(p,{them:{type:"friend",op:10}},ctx),A.punish(p,"treason"),""),
            },
          },
          {
            t: "Refuse, and keep silent",
            r: '"I heard nothing." You hope that is enough. Neither side will fully trust you now.',
            fx: {skill:{intrigue:2},them:{type:"rival",op:-10}},
          },
          {
            t: "Report it to the crown",
            r: "Arrests follow. The crown is grateful. {house} will never forget who talked.",
            fx: (p,ctx)=>{A.applyFx(p,{favor:25,them:{type:"enemy",op:-50}},ctx),hop(ctx,-30),A.fame(p,2),p.honor=cl(p.honor-3)},
          },
        ],
      },
      {
        id: "ct_disfavor",
        cool: 8,
        cond: NB,
        setup: (p,ctx)=>{const q=npcNoble(p,ctx);return ctx.rumor=A.pick(["you mocked the liege's new beard","you corresponded with an enemy court","you called the heir a fool in your cups","you are hoarding gold while the crown begs"]),q},
        title: "Out of favor",
        text: p=>`The ushers no longer seat you near the high table. ${liege(p)} looks through you at Mass. A friend whispers why: {themFull} has been telling the court that {rumor}.`,
        choices: [
          {
            t: "Send a lavish gift and a humble letter",
            r: "The gift is accepted, the letter is not answered. A thaw, perhaps.",
            fx: p=>{pay(p,cost(p,20)),A.applyFx(p,{favor:10},{})},
          },
          {
            t: "Confront {them} before the court",
            check: {s:"diplomacy",s2:"wil",d:48},
            win: {
              r: "You make {them} repeat the slander, then prove it false. The court turns on the liar.",
              fx: {favor:12,fame:2,them:{type:"enemy",op:-40}},
            },
            lose: {
              r: "{them} smiles and lets you shout. You look exactly as guilty as the rumor said.",
              fx: {favor:-8,them:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Withdraw to your estates until it blows over",
            r: "A quiet year of hawks, rents and rain. Out of sight is out of favor, but also out of danger.",
            fx: {skill:{stewardship:3},happy:2,wil:.6},
          },
        ],
      },
      {
        id: "ct_banker",
        cool: 8,
        cond: (p,C)=>NB(p,C)&&(p.coin<cost(p,30)||C.flag(p,"ct_debt")),
        setup: (p,ctx)=>{ctx.bank=A.pick(["House Lunetti of Ostra","a Lucernan counting-house","the Hold Bank of Stonehold","a moneylender of Kesh"]),ctx.sum=cost(p,40)},
        title: "The bankers",
        text: ()=>'A clerk in a black cap from {bank} waits in your hall with a ledger. Your debts, with interest at twelve in the hundred, now come to {sum} suns. "We are patient people. But not infinitely."',
        choices: [
          {
            t: "Pay what you can, and sell the plate for the rest",
            r: "The silver goes, your mother's cups with it. The ledger is closed.",
            fx: (p,ctx)=>{pay(p,Math.round((ctx.sum||40)/2)),delete p.flags.ct_debt,p.happy=cl(p.happy-5),A.willGrow(p,1)},
          },
          {
            t: "Borrow more to cover it, against next year's rents",
            r: "They smile. A new, longer ledger is opened.",
            fx: (p,ctx)=>{p.coin+=Math.round((ctx.sum||40)/3),p.flags.ct_debt=A.S.year},
          },
          {
            t: "Mortgage your lands to them",
            check: {s:"trade",s2:"stewardship",d:46},
            win: {
              r: "You get good terms. The debt is rolled over for ten years.",
              fx: (p,ctx)=>{p.coin+=Math.round((ctx.sum||40)/2),delete p.flags.ct_debt,A.trainSkill(p,"trade",2)},
            },
            lose: {
              r: "The terms are ruinous, and you understand only after you sign.",
              fx: (p,ctx)=>{p.coin+=Math.round((ctx.sum||40)/4),p.flags.ct_debt=A.S.year,p.happy=cl(p.happy-6)},
            },
          },
          {
            t: "Throw the clerk out. Bankers do not command nobles",
            r: "He leaves. The bankers sell your debt to someone much less polite.",
            fx: {honor:-2,flag:"ct_debt",newRel:{type:"enemy",op:-30}},
          },
        ],
      },
      {
        id: "ct_younger_son",
        once: !0,
        w: 1.3,
        cond: (p,C)=>NB(p,C)&&C.ageAdj(p)<24&&A.relsOf(p,["sibling"]).some(x=>x.p.alive&&x.p.born<p.born),
        title: "A younger child's lot",
        text: p=>`Your elder sibling will have the land, the hall and the name. The eldest takes the land; the rest take what they can. Your ${p.parents.length?"father":"family"} calls you in: "The Church or the sword, ${p.given}. Choose, before we choose for you."`,
        choices: [
          {
            t: "The Church: take vows",
            r: "Tonsure or veil, a cell, books. Many a younger child has risen to a bishop's chair.",
            fx: p=>(p.job={c:"clergy",r:0,y:0,perf:55},p.piety=cl(p.piety+10),A.trainSkill(p,"learning",4),p.literate=!0,""),
          },
          {
            t: "The sword: ride to the wars",
            r: "Your family gives you a horse, a sword and a blessing. The rest is up to you.",
            fx: p=>{if(!p.mil){const r=A.enlist(p,!1);return r&&r.ok?"You enlist in the host.":""}return""},
          },
          {
            t: "Neither. Find a rich match and a better future",
            check: {s:"diplomacy",s2:"int",d:45,bonus:p=>p.looks/4-12},
            win: {
              r: "You charm a wealthy widow's family into considering you. Doors open.",
              fx: {newRel:{type:"friend",op:30},fame:1,rel:{who:"father",op:-5}},
            },
            lose: {
              r: "Your family calls you a layabout. The Church and the sword wait.",
              fx: {rel:{who:"father",op:-12},happy:-4},
            },
          },
          {
            t: "Stay, and make yourself the heir's indispensable steward",
            r: "You run the estates while your elder plays at war. One day that will matter.",
            fx: {skill:{stewardship:5},int:.4,rel:{who:"sibling",op:8}},
          },
        ],
      },
      {
        id: "ct_heir_burden",
        cool: 10,
        cond: (p,C)=>NB(p,C)&&C.ageAdj(p)<30&&C.parentsAlive(p)&&!A.relsOf(p,["sibling"]).some(x=>x.p.alive&&x.p.born<p.born),
        title: "The heir's burden",
        text: p=>`As the eldest, you will hold it all one day: the hall, the tenants, the debts and the feuds. ${A.pick(["Your father makes you sit through every manor court.","Your mother makes you learn the name of every tenant family.","The steward walks you through the ledgers until midnight."])} Your younger siblings are out hawking.`,
        choices: [
          {
            t: "Learn it all, grimly",
            r: "Rolls, rents, quarrels over pigs. Dull, and you will need every scrap of it.",
            fx: {skill:{stewardship:5,diplomacy:2},wil:.6,rel:{who:"father",op:8}},
          },
          {
            t: "Go hawking with the others",
            r: "A glorious day in the hills. Your father says nothing at supper, which is worse.",
            fx: {happy:6,skill:{riding:2,husbandry:1},rel:{who:"father",op:-8}},
          },
          {
            t: "Demand a real say in how things are run",
            check: {s:"wil",s2:"diplomacy",d:45},
            win: {
              r: "Your father gives you a manor of your own to run. Your first taste of rule.",
              fx: p=>{p.coin+=cost(p,15),A.trainSkill(p,"stewardship",4),A.addTrait(p,"ambitious")},
            },
            lose: {r:'"When I am dead," says your father. "Not before."',fx:{rel:{who:"father",op:-10},wil:1}},
          },
        ],
      },
      {
        id: "ct_hunt",
        cool: 6,
        cond: (p,C)=>NB(p,C)&&C.ageAdj(p)<55,
        setup: (p,ctx)=>{ctx.game=A.pick(["a great boar","a stag of fourteen points","a wolf that has killed a shepherd's child","an aurochs bull"])},
        title: "The liege's hunt",
        text: p=>`${liege(p)} hunts {game} in the royal forest, and you ride in the party. The hounds bay, the horns sound, and the whole court is watching to see who is at the liege's side at the kill.`,
        choices: [
          {
            t: "Ride at the front and take the beast yourself",
            check: {s:"riding",s2:"spear",d:46},
            win: {
              r: "Your spear finds its heart. The liege laughs and claps your shoulder. That laugh is worth a manor.",
              fx: {favor:12,fame:2,skill:{riding:2}},
            },
            lose: {
              r: "Your horse falls at a ditch. You hear the kill from the mud.",
              fx: {health:-10,wound:"bad_knee",favor:-2,cause:"a hunting fall"},
            },
          },
          {
            t: "Hold back and let the liege make the kill",
            check: {s:"ins",s2:"riding",d:38},
            win: {
              r: "You turn the beast toward the liege at just the right moment. Nobody sees it but the liege, who sees everything.",
              fx: {favor:15,skill:{intrigue:1}},
            },
            lose: {r:"The beast turns the wrong way and the liege misses. Someone has to be blamed.",fx:{favor:-5}},
          },
          {
            t: "Ride with the lords at the back and gossip",
            r: "You miss the kill but learn who hates whom.",
            fx: {skill:{intrigue:3,diplomacy:1}},
          },
        ],
      },
      {
        id: "ct_wardship",
        cool: 15,
        cond: (p,C)=>NB(p,C)&&rung(p)>=3&&C.ageAdj(p)>=22,
        setup: (p,ctx)=>{const q=A.genNoble(p.realm,"noble",null,A.ri(5,12));ctx.pid=q.id,ctx.rev=cost(p,25)},
        title: "A ward",
        text: p=>`A neighbor died without kin, and ${liege(p)} makes you guardian of his heir, {themFull}, {themAge} years old. The child's lands and their {rev} suns of rent are yours to manage until the child comes of age. So is the child's marriage. Wardship has made many a family rich.`,
        choices: [
          {
            t: "Manage the lands honestly and raise the child well",
            r: "You bank the rents for {them} and hire a tutor. Years from now, a grown ward will remember.",
            fx: {honor:6,them:{type:"friend",op:40,back:"mentor"},skill:{stewardship:2}},
          },
          {
            t: "Milk the lands while you have them",
            r: "Woods felled, fishponds drained, rents raised. A fine income. A bitter ward.",
            fx: (p,ctx)=>{p.coin+=ctx.rev||25,p.honor=cl(p.honor-6),A.applyFx(p,{them:{type:"enemy",op:-30}},ctx)},
          },
          {
            t: "Sell the wardship to the highest bidder",
            r: "A wool merchant who wants a noble match for his son pays well.",
            fx: (p,ctx)=>{p.coin+=Math.round((ctx.rev||25)*.7),p.honor=cl(p.honor-2)},
          },
        ],
      },
      {
        id: "ct_office",
        cool: 12,
        cond: (p,C)=>NB(p,C)&&!C.job(p)&&C.ageAdj(p)>=20,
        setup: (p,ctx)=>{ctx.post=A.pick(["warden of a castle on the border road","reeve of the crown's tolls at a river bridge","keeper of the liege's horses","a clerk of the chancery rolls"])},
        title: "An office",
        text: p=>`${liege(p)}'s chamberlain offers you a post: {post}. It pays, it brings you to court, and it is never inherited. A title says what you hold; an office says what you do.`,
        choices: [
          {
            t: "Accept the post",
            r: "You take the oath of office and a ring of keys.",
            fx: {job:"courtier",favor:6,skill:{stewardship:2}},
          },
          {
            t: "Ask for something grander",
            check: {s:"diplomacy",s2:"intrigue",d:52},
            win: {
              r: "The chamberlain finds you something better, for a consideration.",
              fx: p=>(p.job={c:"courtier",r:1,y:0,perf:60},pay(p,cost(p,10)),A.fame(p,2),""),
            },
            lose: {r:"The post goes to someone less greedy.",fx:{favor:-4}},
          },
          {
            t: "Decline. Your lands need you",
            r: "The chamberlain shrugs. There are a hundred others.",
            fx: {skill:{stewardship:2}},
          },
        ],
      },
      {
        id: "ct_manor_court",
        cool: 5,
        cond: (p,C)=>NB(p,C)&&rung(p)>=2,
        setup: (p,ctx)=>{ctx.case=A.pick(["a miller accused of short-weighting flour","two brothers who fought over a dead father's cow","a girl accused of stealing a ring from the reeve's wife","a tenant who moved a hedge onto common land","a drunk who struck a priest"])},
        title: "Your manor court",
        text: p=>`You hold the manor court at ${A.provName(p.home)}, the low justice of theft, brawling and debt. Today: {case}. The whole village crowds the hall to watch.`,
        choices: [
          {
            t: "Hear every witness and judge carefully",
            check: {s:"int",s2:"diplomacy",d:40},
            win: {
              r: "You catch a lie in the third witness. The truth comes out, and the village nods.",
              fx: {honor:3,skill:{diplomacy:2},int:.4},
            },
            lose: {
              r: "You judge wrong. Months later the truth comes out, and the village remembers.",
              fx: {honor:-2,happy:-3},
            },
          },
          {
            t: "Judge harshly, as an example",
            r: "Stocks and a heavy fine. Nobody steals for a while. Nobody likes you either.",
            fx: p=>{p.coin+=cost(p,3),p.honor=cl(p.honor-1)},
          },
          {
            t: "Judge with mercy",
            r: "A small fine and a sermon. The village loves you a little more, and cheats you a little more.",
            fx: {honor:2,happy:2},
          },
        ],
      },
      {
        id: "ct_muster",
        cool: 8,
        cond: (p,C)=>NB(p,C)&&rung(p)>=2&&!C.soldier(p),
        setup: (p,ctx)=>{ctx.n=rung(p)>=4?"two hundred levies":rung(p)>=3?"twelve lances":"your lance of four riders",ctx.c=cost(p,15)},
        title: "The muster",
        text: ()=>`The spring muster. You inspect {n}. ${A.pick(["Half the spears are rusted.","One man has brought a pitchfork and his son.","Your sergeant is drunk.","The horses are thin and the mail is moth-eaten padding."])} If the summons comes this year, these are the men who will follow you.`,
        choices: [
          {
            t: "Pay to re-equip them properly ({c} suns)",
            r: "New spears, new jacks, shoes for the horses. They stand straighter.",
            fx: (p,ctx)=>{pay(p,ctx.c||15),A.trainSkill(p,"command",3),A.applyFx(p,{favor:4},ctx)},
          },
          {
            t: "Drill them yourself all summer",
            check: {s:"command",s2:"sta",d:42},
            win: {
              r: "By autumn they can hold a line and wheel without falling over. Your liege hears of it.",
              fx: {skill:{command:4,tactics:2},favor:6,sta:.4},
            },
            lose: {r:"They learn to hate you, mostly.",fx:{skill:{command:2}}},
          },
          {t:"They will do",r:"They will not. But that is a problem for another day.",fx:{}},
        ],
      },
      {
        id: "ct_banneret",
        once: !0,
        cond: (p,C)=>NB(p,C)&&C.atWar(p)&&!!(p.noble&&p.noble.rung===2),
        title: "A banner on the field",
        text: p=>`The war goes badly. On a ridge above the ford, the line is breaking. ${liege(p)}'s captain shouts for any knight who will lead the lances in a charge. A knight who leads a charge and holds the ground may be made banneret where he stands.`,
        choices: [
          {
            t: "Lead the charge",
            check: {s:"lance",s2:"command",d:52},
            win: {
              r: "You hit them at the ford and hold it until the sun goes down. Your pennon is cut square on the field: you are a banneret.",
              fx: p=>(p.noble&&(p.noble.rung=3),A.fame(p,5),p.deeds.push({y:A.S.year,t:"Led the charge at the ford and was made banneret on the field"}),""),
            },
            lose: {
              r: "The charge breaks on their spears. You are carried off the field.",
              fx: {health:-25,wound:"scar_chest",wil:2,cause:"a failed charge"},
            },
          },
          {
            t: "Hold your place in the line",
            r: "You hold. Others charge. Someone else gets the banner.",
            fx: {honor:1,skill:{shield:2}},
          },
        ],
      },
      {
        id: "ct_forged_seal",
        cool: 12,
        cond: (p,C)=>NB(p,C)&&rung(p)>=2&&C.literate(p),
        setup: (p,ctx)=>{setHouse(ctx,p,p.realm)},
        title: "A forged seal",
        text: ()=>"A merchant arrives demanding payment on a bond you never signed. Your seal is on it, crisp and perfect. Someone has a copy of your seal matrix, and they have been busy.",
        choices: [
          {
            t: "Trace the forger",
            check: {s:"intrigue",s2:"int",d:48},
            win: {
              r: "The trail leads to a goldsmith in the pay of {house}. You have them now.",
              fx: (p,ctx)=>{hop(ctx,-10),A.trainSkill(p,"intrigue",3),A.fame(p,1)},
            },
            lose: {r:"The trail goes cold. You pay the bond to keep your name clean.",fx:p=>{pay(p,cost(p,12))}},
          },
          {
            t: "Break your seal and have a new one cut",
            r: "You smash the old matrix before witnesses and send word to every bank. Expensive, but safe.",
            fx: p=>{pay(p,cost(p,4)),A.trainSkill(p,"stewardship",2)},
          },
          {
            t: "Pay the bond. Quietly",
            r: "Paid. And more bonds will follow, now that they know you pay.",
            fx: p=>{pay(p,cost(p,12)),p.flags.ct_debt=A.S.year},
          },
        ],
      },
      {
        id: "ct_abbey",
        cool: 10,
        cond: (p,C)=>NB(p,C)&&rung(p)>=2,
        setup: (p,ctx)=>{ctx.what=A.pick(["the right to cut timber in the north wood","the tithe of your new mill","a field your great-grandfather gave them for prayers, which you want back","the fish of the river"])},
        title: "The abbey",
        text: p=>`The prior of the abbey near ${A.provName(p.home)} disputes {what}. The monks have charters, lawyers, and the ear of the bishop. You have men, and a temper.`,
        choices: [
          {
            t: "Yield graciously, for your soul's sake",
            r: "The prior blesses you from the pulpit. Your purse is lighter; your soul, he says, is not.",
            fx: {piety:6,honor:2,coin:-5},
          },
          {
            t: "Fight it in the church courts",
            check: {s:"learning",s2:"faith",d:50},
            win: {
              r: "You find a flaw in their charter: the seal is from after the abbot who signed it died. The field is yours.",
              fx: p=>{p.coin+=cost(p,10),A.trainSkill(p,"learning",2)},
            },
            lose: {r:"The church courts find for the church. Surprise.",fx:p=>{pay(p,cost(p,6))}},
          },
          {
            t: "Take it by force",
            r: "You take it. The bishop threatens to bar you from the sacraments.",
            fx: p=>{p.coin+=cost(p,8),p.piety=cl(p.piety-10),p.honor=cl(p.honor-3)},
          },
        ],
      },
      {
        id: "ct_great_council",
        cool: 8,
        cond: (p,C)=>NB(p,C)&&rung(p)>=4,
        setup: (p,ctx)=>{const r=LR(p);ctx.rs=r?r.short:"the realm",ctx.ask=A.pick(["a new hearth tax for the war","a tax on wool for the crown's debts","a tenth of every lord's rents for three years","a levy for the heir's wedding"])},
        title: "The great council",
        text: p=>`As a peer of the greater or lesser peerage you sit in the great council of {rs} by right. The crown asks for {ask}. ${liege(p)} looks along the benches, counting votes. The barons beside you mutter.`,
        choices: [
          {
            t: "Speak for the crown",
            check: {s:"diplomacy",s2:"int",d:46},
            win: {
              r: "Your speech swings the doubters. The tax passes. The crown smiles on you; the barons do not.",
              fx: {favor:18,fame:2,newRel:{type:"rival",op:-20}},
            },
            lose: {r:"You are heckled down. The tax fails anyway, and both sides blame you.",fx:{favor:-3,fame:-1}},
          },
          {
            t: "Lead the barons against it",
            check: {s:"diplomacy",s2:"wil",d:48},
            win: {
              r: "The tax fails. The barons toast you. The crown does not forget.",
              fx: {favor:-15,fame:3,honor:2,newRel:{type:"friend",op:30}},
            },
            lose: {r:"The tax passes and you stood on the losing side.",fx:{favor:-10}},
          },
          {
            t: "Abstain and sell your vote later",
            r: "Both sides court you until the vote. You dine well for a week.",
            fx: p=>{p.coin+=cost(p,6),A.trainSkill(p,"intrigue",2)},
          },
        ],
      },
      {
        id: "ct_knight_errand",
        cool: 8,
        cond: (p,C)=>NB(p,C)&&rung(p)>=2&&C.ageAdj(p)<50,
        setup: (p,ctx)=>{ctx.who=A.pick(["a widow whose son's land is being stolen by her brother-in-law","a convent whose cattle robbers took","a village plagued by a robber knight in a ruined tower","a merchant's daughter carried off for ransom"])},
        title: "A knight's errand",
        text: ()=>`A petitioner kneels in your hall: {who}. "The liege's courts are slow. They say you are a true knight." Your oath of knighthood says you must protect the weak. It does not say how.`,
        choices: [
          {
            t: "Ride out and settle it with your sword",
            r: "You find the culprit at the end of the road.",
            fx: {
              duel: {
                tier: 3,
                title: "a robber knight",
                troop: "HC",
                opts: {kind:"duel",place:"a ruined tower",title:"The robber knight"},
              },
              honor: 4,
              fame: 2,
            },
          },
          {
            t: "Settle it with words and a show of force",
            check: {s:"diplomacy",s2:"command",d:44},
            win: {
              r: "You turn up with ten riders and a smile. The thing is settled by supper.",
              fx: {honor:4,fame:2,newRel:{type:"friend",op:35}},
            },
            lose: {r:"They laugh at you from behind their walls.",fx:{fame:-1,wil:.6}},
          },
          {
            t: "Send them to the liege's court",
            r: "The petitioner leaves without a word. You feel smaller than you did this morning.",
            fx: {honor:-3},
          },
        ],
      },
      {
        id: "ct_crowning",
        once: !0,
        w: 3,
        cond: (p,C)=>RU(p,C)&&!C.flag(p,"ct_crowned"),
        setup: (p,ctx)=>{ctx.gift=F(inc(p,.04))},
        title: "The crowning",
        text: p=>{const r=RM(p);return`${CROWN[p.ruler]||`The great men of ${r?r.short:"the realm"} must see you crowned and acclaimed by the old customs before they will call you sovereign without a sneer.`} Everyone of note has come to ${r?r.capital:"the capital"}. Some of them are hoping you stumble.`},
        choices: [
          {
            t: "Lift the Anvil of Dagna",
            req: p=>p.ruler==="POL-29",
            check: {s:"str",s2:"sta",d:52},
            win: {
              r: "Twenty-eight, twenty-nine, thirty. The hall erupts. The Carvers cut your name.",
              fx: rf((r,p)=>{p.flags.ct_crowned=A.S.year,lg(r,12),st(r,5),A.fame(p,4)}),
            },
            lose: {
              r: "The anvil drops at twenty-six. You are confirmed, barely, and the hall is silent.",
              fx: rf((r,p)=>{p.flags.ct_crowned=A.S.year,lg(r,-10),A.willGrow(p,2),p.health-=8,p.lastHurt="the Anvil of Dagna"}),
            },
          },
          {
            t: "Make the climb to the Crown Shelf",
            req: p=>p.ruler==="POL-28",
            check: {s:"sta",s2:"wil",d:50,bonus:p=>A.hasBlood(p,"deepbreath")?40:0},
            win: {
              r: "You lay the ingot on the shelf in thin cold air. The Eldest Carver cuts your name.",
              fx: rf((r,p)=>{p.flags.ct_crowned=A.S.year,lg(r,12),A.fame(p,4)}),
            },
            lose: {
              r: "You collapse at the last ridge and are carried up. The name is carved, and the whispers start.",
              fx: rf((r,p)=>{p.flags.ct_crowned=A.S.year,lg(r,-10),p.health-=15,p.lastHurt="the mountain air",A.addWound(p,"frostbite"),A.willGrow(p,2)}),
            },
          },
          {
            t: "Perform every rite flawlessly",
            req: p=>p.ruler!=="POL-28"&&p.ruler!=="POL-29",
            check: {s:"diplomacy",s2:"wil",d:45},
            win: {
              r: "Not a word wrong, not a step out of place. Old men weep. Your reign begins in glory.",
              fx: rf((r,p)=>{p.flags.ct_crowned=A.S.year,lg(r,10),st(r,4),A.fame(p,3)}),
            },
            lose: {
              r: ()=>A.pick(["You trip on the hem of the robe.","You forget a line of the oath, and the priest has to prompt you.","A dove released at the climax flies straight into a candle."])+" The crowd will call it an omen.",
              fx: rf((r,p)=>{p.flags.ct_crowned=A.S.year,lg(r,-8),st(r,-3)}),
            },
          },
          {
            t: "Shower the clergy and electors with gifts first ({gift} from the treasury)",
            r: "Every hand that matters has been filled. The rite goes smoothly, at a price.",
            fx: rf((r,p)=>{p.flags.ct_crowned=A.S.year,r.treasury-=inc(p,.04),lg(r,6),p.piety=cl(p.piety+2)}),
          },
          {
            t: "Keep it short. You have a realm to run",
            r: "Plain words and a plain crown. The thrifty approve. The traditionalists sulk.",
            fx: rf((r,p)=>{p.flags.ct_crowned=A.S.year,lg(r,-4),r.treasury+=inc(p,.01)}),
          },
        ],
      },
      {
        id: "ct_oath_day",
        cool: 3,
        cond: (p,C)=>RU(p,C)&&!!OATH[p.ruler],
        setup: (p,ctx)=>{setHouse(ctx,p)},
        title: "Oath day",
        text: p=>`${OATH[p.ruler]} When it is the turn of the head of {house}, there is a pause. A long one. Then a cough, and a mumbled oath, with one hand behind the back.`,
        choices: [
          {
            t: "Make them swear again, clearly, before everyone",
            check: {s:"wil",s2:"diplomacy",d:46},
            win: {
              r: "The second oath rings across the hall. {House} is humbled and the court sees who rules.",
              fx: rf((r,p,ctx)=>{lg(r,6),st(r,2),hop(ctx,-6)}),
            },
            lose: {
              r: "They refuse. Others look at their boots. A bad omen for the year.",
              fx: rf((r,p,ctx)=>{lg(r,-6),st(r,-4),hop(ctx,-10)}),
            },
          },
          {
            t: "Let it pass, and talk to them in private later",
            check: {s:"diplomacy",s2:"int",d:42},
            win: {
              r: "Over wine you learn the grievance: an old debt of the crown. You settle it.",
              fx: rf((r,p,ctx)=>{hop(ctx,15),r.treasury-=inc(p,.01)}),
            },
            lose: {r:"They take your quiet as weakness.",fx:rf((r,p,ctx)=>{hop(ctx,-5),lg(r,-3)})},
          },
          {
            t: "Have them arrested as oath-breakers",
            r: p=>`The guards drag them out.${p.ruler==="POL-01"?" In Aldmark oath-breakers drown in the Fairrush, tied to an iron ring.":""} The other lords swear very clearly.`,
            fx: rf((r,p,ctx)=>{st(r,3),allOp(p,-4),hop(ctx,-35),p.honor=cl(p.honor-3)}),
          },
        ],
      },
      {
        id: "ct_moon_pearl",
        cool: 5,
        cond: (p,C)=>RU(p,C)&&p.ruler==="POL-30",
        title: "Moon-Pearl",
        text: "The keepers of the white elephant come to you in fear. Moon-Pearl will not eat. She is old and half blind and has no calf, and the Thousand Names teaches that the dream ends when she dies without one. The bazaar already whispers.",
        choices: [
          {
            t: "Send to every province for a white calf",
            r: "Riders go out to every forest and every temple. If a calf exists, it will be found.",
            fx: rf((r,p)=>{r.treasury-=inc(p,.03),st(r,3),p.piety=cl(p.piety+4)}),
          },
          {
            t: "Sit with her yourself through the night",
            check: {s:"husbandry",s2:"faith",d:40},
            win: {
              r: "At dawn she takes fruit from your hand. The story is in every temple by noon.",
              fx: rf((r,p)=>{lg(r,8),st(r,5),A.fame(p,2)}),
            },
            lose: {r:"She does not eat. But the people saw you there.",fx:rf((r,p)=>{st(r,1),A.willGrow(p,1)})},
          },
          {
            t: "Let the One Face preachers say the elephant is just an elephant",
            r: "The merchants nod. The temples rage.",
            fx: rf((r,p)=>{st(r,-6),r.treasury+=inc(p,.01),p.piety=cl(p.piety-6)}),
          },
        ],
      },
      {
        id: "ct_unlit",
        cool: 10,
        cond: (p,C)=>RU(p,C)&&(p.faith==="REL-01"||RM(p)&&RM(p).faith==="REL-01")&&p.ruler!=="POL-02",
        setup: (p,ctx)=>{ctx.why=A.pick(["your tax on Temple lands","your refusal to pay the crowning gift","your marriage to a cousin without dispensation","your envoy to the Dawn Church at Velgrad"]),ctx.sum=F(inc(p,.05))},
        title: "The threat of unlighting",
        text: ()=>"A Needle-Keeper arrives from Solenne with a letter from the High Luminary. Over {why}, the Temple threatens to unlight you: to put out your lamp before the Sun and free your subjects from their oaths. In 1063 the Temple unlit Prince Andros of Tessaria, and the war there has not ended since.",
        choices: [
          {
            t: "Submit and pay the Temple {sum}",
            r: "You kneel, figuratively and expensively. The lamp stays lit.",
            fx: rf((r,p)=>{r.treasury-=inc(p,.05),lg(r,3),p.piety=cl(p.piety+5)}),
          },
          {
            t: "Negotiate through your chaplain",
            check: {s:"diplomacy",s2:"faith",d:52,bonus:p=>A.councilSkill(RM(p),"chaplain")/5},
            win: {
              r: "A compromise: a chapel endowed, a face saved on both sides.",
              fx: rf((r,p)=>{r.treasury-=inc(p,.015),lg(r,2)}),
            },
            lose: {
              r: "The talks collapse. The Needle-Keeper leaves with a cold blessing.",
              fx: rf((r,p)=>{lg(r,-6),st(r,-4)}),
            },
          },
          {
            t: "Defy them. No priest rules here",
            r: "The lamp is put out. Priests close their doors and some lords feel free of their oaths.",
            fx: rf((r,p)=>{lg(r,-18),st(r,-12),allOp(p,-8),p.piety=cl(p.piety-15),A.fame(p,3)}),
          },
        ],
      },
      {
        id: "ct_patriarch",
        cool: 10,
        cond: (p,C)=>RU(p,C)&&(p.faith==="REL-02"||RM(p)&&RM(p).faith==="REL-02"),
        setup: (p,ctx)=>{ctx.ask=A.pick(["volunteers for Prince Andros's war in Tessaria","monastery lands exempt from your levy","that you expel the Temple's Needle-Keepers from your towns","gold to rebuild a burned monastery"])},
        title: "The Patriarch's letter",
        text: ()=>"A letter from the Patriarch of Dawn at Velgrad, sealed with the red dawn. He asks for {ask}. Velgrad's kings are not kings until he anoints them, and no one in the east has ever ruled uncrowned.",
        choices: [
          {
            t: "Grant it in full",
            r: "The Patriarch's blessing is read in every church at dawn.",
            fx: rf((r,p)=>{r.treasury-=inc(p,.03),lg(r,6),st(r,2),p.piety=cl(p.piety+6)}),
          },
          {
            t: "Grant half and send a fine icon",
            check: {s:"diplomacy",s2:"faith",d:45},
            win: {r:"The Patriarch is pleased enough.",fx:rf((r,p)=>{r.treasury-=inc(p,.012),lg(r,3)})},
            lose: {r:'The Patriarch calls the icon "pretty" and the half "half".',fx:rf((r,p)=>{lg(r,-3)})},
          },
          {
            t: "Refuse. The crown is not the Church's purse",
            r: "The Church remembers in its sermons.",
            fx: rf((r,p)=>{lg(r,-8),st(r,-3),p.piety=cl(p.piety-6)}),
          },
        ],
      },
      {
        id: "ct_council_quarrel",
        cool: 6,
        cond: RU,
        setup: (p,ctx)=>{const r=RM(p),m=seatHolder(r,"marshal"),t=seatHolder(r,"treasurer");ctx.m=m?A.fullName(m):"Your marshal",ctx.t=t?A.fullName(t):"Your treasurer",ctx.sum=F(inc(p,.06))},
        title: "A quarrel at the council table",
        text: ()=>"{m} slams a fist on the council table: the host needs {sum} for new horses and pay arrears. {t} goes red: there is no such money, and the banks will not lend more. Both look at you. The rest of the council finds the ceiling very interesting.",
        choices: [
          {
            t: "Back the marshal",
            r: "The host gets its horses. The treasury gets a hole.",
            fx: rf((r,p)=>{r.treasury-=inc(p,.06),r.armyQ=Math.min(1.6,r.armyQ+.04)}),
          },
          {
            t: "Back the treasurer",
            r: "The coffers stay full. The host grumbles in its barracks.",
            fx: rf((r,p)=>{r.armyQ=Math.max(.5,r.armyQ-.02),st(r,-1)}),
          },
          {
            t: "Find a middle way that shames neither",
            check: {s:"stewardship",s2:"diplomacy",d:48},
            win: {
              r: "Half now, half from the next wool tax. Both men leave thinking they won.",
              fx: rf((r,p)=>{r.treasury-=inc(p,.03),r.armyQ=Math.min(1.6,r.armyQ+.02),A.trainSkill(p,"stewardship",2)}),
            },
            lose: {r:"Both men leave thinking you are weak.",fx:rf((r,p)=>{st(r,-2),lg(r,-2)})},
          },
        ],
      },
      {
        id: "ct_corrupt",
        cool: 8,
        cond: RU,
        setup: (p,ctx)=>{const r=RM(p),seat=A.pick(Object.keys(A.COUNCIL)),q=seatHolder(r,seat);ctx.seat=A.COUNCIL[seat].name.toLowerCase(),ctx.who=q?A.fullName(q)+", your "+ctx.seat+",":"the deputy who runs your "+ctx.seat+"'s office",ctx.qid=q?q.id:"",ctx.seatKey=seat,ctx.sum=F(inc(p,.03))},
        title: "A hand in the coffers",
        text: ()=>"An anonymous letter, then a second, then a clerk with ledgers under his cloak: {who} has skimmed some {sum} from the crown over three years. The clerk wants protection. He also wants the job.",
        choices: [
          {
            t: "Arrest, try and seize their estates",
            r: "The trial is short and the estates are rich. The court learns that your eyes are open.",
            fx: rf((r,p,ctx)=>{r.treasury+=inc(p,.03),st(r,2),ctx.seatKey&&r.council&&r.council[ctx.seatKey]===ctx.qid&&delete r.council[ctx.seatKey],allOp(p,-2)}),
          },
          {
            t: "Make them pay it back quietly and keep them",
            r: "The money comes back, and you own them now.",
            fx: rf((r,p)=>{r.treasury+=inc(p,.02),A.trainSkill(p,"intrigue",2)}),
          },
          {
            t: "Check the clerk's ledgers first",
            check: {s:"stewardship",s2:"int",d:46},
            win: {
              r: "The ledgers are forged. The clerk is the thief, framing his master. Justice is swift.",
              fx: rf((r,p)=>{r.treasury+=inc(p,.01),A.trainSkill(p,"stewardship",3),A.fame(p,1)}),
            },
            lose: {
              r: "You cannot make head or tail of the numbers. The matter drags on and both men hate you.",
              fx: rf((r,p)=>{st(r,-2)}),
            },
          },
          {
            t: "Burn the letters. Everyone skims",
            r: "Everyone keeps skimming, a little more each year.",
            fx: rf((r,p)=>{r.treasury-=inc(p,.02),p.honor=cl(p.honor-2)}),
          },
        ],
      },
      {
        id: "ct_spymaster",
        cool: 9,
        cond: RU,
        setup: (p,ctx)=>{const q=seatHolder(RM(p),"spymaster");ctx.who=q?A.fullName(q):"Your master of whispers"},
        title: "Too many keys",
        text: p=>`{who} brings you copies of letters. Some are from foreign courts. Some are from your own ${p.spouse?"spouse":"chancellor"}. "I read everything, Majesty. That is the job." It is also a very good way to collect secrets about a king.`,
        choices: [
          {
            t: "Praise the zeal and read the letters",
            r: "You learn a great deal. Some of it you wish you had not.",
            fx: {skill:{intrigue:4},happy:-3},
          },
          {
            t: "Forbid spying on your household",
            check: {s:"wil",s2:"intrigue",d:44},
            win: {r:"The spymaster bows and obeys. You think.",fx:{honor:3,skill:{intrigue:1}}},
            lose: {r:"The spymaster bows and keeps doing it, more carefully.",fx:{skill:{intrigue:1}}},
          },
          {
            t: "Set a second spy to watch the first",
            r: "Who watches the watchers? Now you do. It is exhausting.",
            fx: rf((r,p)=>{r.treasury-=inc(p,.005),A.trainSkill(p,"intrigue",3)}),
          },
        ],
      },
      {
        id: "ct_vassal_demand",
        cool: 5,
        cond: (p,C)=>RU(p,C)&&vass(p).length>0,
        setup: (p,ctx)=>{setHouse(ctx,p),ctx.ask=A.pick(["a seat on the council","the wardship of a rich orphan","a royal charter for a market at "+ctx.seat,"relief from the levy for three years","the hand of your cousin for their heir","a royal castle on their border"])},
        title: "A vassal's price",
        text: ()=>"The head of {house} comes to court with a long face and a longer list. Their loyalty, they hint, has a price this year: {ask}.",
        choices: [
          {
            t: "Grant it",
            r: "{House} kisses your ring. Other houses take note, and start writing lists.",
            fx: rf((r,p,ctx)=>{hop(ctx,20),allOp(p,-2),r.treasury-=inc(p,.01)}),
          },
          {
            t: "Refuse firmly",
            r: "{House} bows stiffly and rides home early.",
            fx: rf((r,p,ctx)=>{hop(ctx,-14),lg(r,2)}),
          },
          {
            t: "Grant something smaller, with ceremony",
            check: {s:"diplomacy",s2:"int",d:44},
            win: {
              r: "A gilt cup, a title for a younger son, a seat at your right at the feast. They leave beaming.",
              fx: rf((r,p,ctx)=>{hop(ctx,12)}),
            },
            lose: {r:"They see through it and feel insulted twice over.",fx:rf((r,p,ctx)=>{hop(ctx,-10)})},
          },
        ],
      },
      {
        id: "ct_rebellion",
        cool: 6,
        cond: (p,C)=>RU(p,C)&&vass(p).some(h=>(h.op!=null?h.op:50)<30)&&!throneWar(RM(p)),
        setup: (p,ctx)=>{setHouse(ctx,p,null,h=>(h.op!=null?h.op:50)<30);const hd=ctx.hid?A.houseHead(ctx.hid):null;ctx.pid=hd?hd.id:"",ctx.leader=hd?A.fullName(hd):"their lord"},
        title: "Rebellion brewing",
        text: ()=>"{House} is gathering men at {seat}. {leader} has stopped answering your letters, has written to two other houses, and was heard to say that your crown sits on the wrong head.",
        choices: [
          {
            t: "Buy them back with land and gold",
            r: "They take your gold and lay down their spears. For now.",
            fx: rf((r,p,ctx)=>{r.treasury-=inc(p,.05),hop(ctx,30),lg(r,-3)}),
          },
          {
            t: "Demand a hostage: their heir, at your court",
            check: {s:"wil",s2:"diplomacy",d:50},
            win: {
              r: "The heir arrives at court under guard and is given a fine room. Nobody in {house} sleeps well, and nobody rebels.",
              fx: rf((r,p,ctx)=>{hop(ctx,5),st(r,3)}),
            },
            lose: {r:"They refuse and fortify {seat}.",fx:rf((r,p,ctx)=>{hop(ctx,-10),st(r,-4)})},
          },
          {
            t: "Arrest their head on a summons to court",
            check: {s:"intrigue",s2:"command",d:52},
            win: {
              r: "They come, suspecting nothing. Without a head, the rebellion dies in its cradle.",
              fx: rf((r,p,ctx)=>{st(r,4),allOp(p,-5),hop(ctx,-20),A.fame(p,2)}),
            },
            lose: {
              r: "They are warned and slip away. Now they have a grievance and a story.",
              fx: rf((r,p,ctx)=>{st(r,-6),lg(r,-4),hop(ctx,-15)}),
            },
          },
          {
            t: "Let them raise their banner, and crush them in the field",
            req: (p,C,ctx)=>!!(ctx&&ctx.pid&&A.P(ctx.pid)),
            r: "You send no letter. Let them come.",
            fx: rf((r,p,ctx)=>{const hd=A.P(ctx.pid);return!hd||!hd.alive||throneWar(r)?"They lose their nerve before they raise a banner.":(A.successionWar(r,hd),`${A.fullName(hd)} raises the banner of revolt. Civil war!`)}),
          },
        ],
      },
      {
        id: "ct_vassal_feud",
        cool: 6,
        cond: (p,C)=>RU(p,C)&&vass(p).length>=2,
        setup: (p,ctx)=>{const l=A.shuffle(vass(p));ctx.hid=l[0].id,ctx.house=l[0].name,ctx.hidB=l[1].id,ctx.houseB=l[1].name},
        title: "Two houses at war",
        text: ()=>`${A.pick(["A drowned heir","A stolen bride","A disputed mill","A hunting accident that may not have been one"])} has set {house} and {houseB} at each other's throats. Barns burn on both sides. Each wants you to judge for them.`,
        choices: [
          {
            t: "Judge for {house}",
            r: "{house} toasts your wisdom. {houseB} calls it corruption.",
            fx: rf((r,p,ctx)=>{hop(ctx,14);const h=A.S.houses[ctx.hidB];h&&(h.op=cl((h.op!=null?h.op:50)-16))}),
          },
          {
            t: "Judge for {houseB}",
            r: "{houseB} toasts your wisdom. {house} calls it corruption.",
            fx: rf((r,p,ctx)=>{hop(ctx,-16);const h=A.S.houses[ctx.hidB];h&&(h.op=cl((h.op!=null?h.op:50)+14))}),
          },
          {
            t: "Summon both and force a peace with a marriage",
            check: {s:"diplomacy",s2:"wil",d:50},
            win: {
              r: "A wedding in your own chapel. You pay for the feast. Both houses owe you now.",
              fx: rf((r,p,ctx)=>{hop(ctx,8);const h=A.S.houses[ctx.hidB];h&&(h.op=cl((h.op!=null?h.op:50)+8)),r.treasury-=inc(p,.01),st(r,3)}),
            },
            lose: {
              r: "The bride's brother draws steel at the betrothal. Worse than before.",
              fx: rf((r,p,ctx)=>{st(r,-4)}),
            },
          },
        ],
      },
      {
        id: "ct_heir_wastrel",
        cool: 7,
        cond: (p,C)=>RUA(p,C)&&!!heirOf(RM(p))&&heirOf(RM(p)).id!==p.id&&A.isAdult(heirOf(RM(p))),
        setup: (p,ctx)=>{const h=heirOf(RM(p));ctx.pid=h?h.id:"",ctx.sin=A.pick(["lost a fortune at dice to a Kesh moneylender","fled the field at a border skirmish","brawled in a tavern and killed a carter","spent the summer writing poems instead of drilling the guard","insulted a foreign envoy so badly that the envoy left"])},
        title: "The heir disappoints",
        text: ()=>"Your heir, {themFull}, has {sin}. The court is laughing behind its hands. The lords are wondering, quietly, what kind of ruler {theyHe} will make.",
        choices: [
          {
            t: "Discipline {them} harshly in private",
            check: {s:"wil",s2:"diplomacy",d:44},
            win: {
              r: "{them} takes it hard but listens. Something changes.",
              fx: (p,ctx)=>{const h=A.P(ctx.pid);h&&(A.trainSkill(h,"command",6),A.trainSkill(h,"diplomacy",4)),A.applyFx(p,{them:{op:-5}},ctx)},
            },
            lose: {r:"{them} storms out and does not speak to you for a season.",fx:{them:{op:-20}}},
          },
          {
            t: "Send {them} to the frontier to learn soldiering",
            r: "Off to the border fort with a grizzled marshal. Either it will make {them} or it will break {them}.",
            fx: (p,ctx)=>{const h=A.P(ctx.pid);h&&(A.trainSkill(h,"command",8),A.trainSkill(h,"sword",6)),A.applyFx(p,{them:{op:-8}},ctx)},
          },
          {
            t: "Laugh it off in public. Youth must be youth",
            r: "The court laughs with you. Some lords wonder if you are blind.",
            fx: rf((r,p,ctx)=>{lg(r,-3),A.applyFx(p,{them:{op:8}},ctx)}),
          },
        ],
      },
      {
        id: "ct_heir_plot",
        cool: 12,
        cond: (p,C)=>RUA(p,C)&&C.ageAdj(p)>=40&&!!heirOf(RM(p))&&heirOf(RM(p)).id!==p.id&&A.isAdult(heirOf(RM(p))),
        setup: (p,ctx)=>{const h=heirOf(RM(p));ctx.pid=h?h.id:""},
        title: "The impatient heir",
        text: p=>`Your spymaster lays a letter before you in your heir's hand. {themFull} has been courting the great lords, promising lower taxes "when the time comes", and asking a physician about the strength of certain powders. You are ${A.age(p)}. {theyHe} is tired of waiting.`,
        choices: [
          {
            t: "Confront {them} with the letter",
            check: {s:"wil",s2:"intrigue",d:48},
            win: {
              r: "{them} breaks down and begs forgiveness. You give it, and you keep the letter.",
              fx: rf((r,p,ctx)=>{A.applyFx(p,{them:{op:10}},ctx),st(r,1),A.willGrow(p,1.5)}),
            },
            lose: {
              r: "{them} denies everything, coldly, and leaves. Now you both know.",
              fx: rf((r,p,ctx)=>{A.applyFx(p,{them:{type:"rival",op:-30}},ctx),st(r,-3)}),
            },
          },
          {
            t: "Disinherit {them}",
            r: "You strike the name from the succession. The court reels. The lords who were promised low taxes are furious.",
            fx: rf((r,p,ctx)=>{const h=A.P(ctx.pid);h&&(h.flags.disinherited=A.S.year,r.heirLocked===h.id&&delete r.heirLocked),A.pickHeir(r),lg(r,-10),st(r,-4),A.applyFx(p,{them:{type:"enemy",op:-60}},ctx)}),
          },
          {
            t: "Give {them} a real share of power now",
            r: "You make your heir governor of a province. Ambition fed is ambition tamed. Usually.",
            fx: rf((r,p,ctx)=>{A.applyFx(p,{them:{op:25}},ctx),lg(r,2)}),
          },
          {
            t: "Have your food tasted and say nothing",
            r: "You eat nothing that a taster has not touched. You sleep with a dagger. You watch.",
            fx: {skill:{intrigue:3},happy:-6,wil:1},
          },
        ],
      },
      {
        id: "ct_regency",
        cool: 4,
        cond: (p,C)=>C.ruler(p)&&!C.adult(p)&&!!RM(p),
        setup: (p,ctx)=>{setHouse(ctx,p)},
        title: "The regency council",
        text: ()=>"You are too young to rule, so a regency council rules for you. Today they quarrel over you as if you were not in the room: your mother's kin, the head of {house}, and the chancellor each want to hold the seal until you come of age.",
        choices: [
          {
            t: "Side with your mother's kin",
            r: "Family first. The other lords sulk.",
            fx: rf((r,p,ctx)=>{hop(ctx,-10),st(r,-2)}),
          },
          {
            t: "Side with {house}",
            r: "{House} takes the seal, and treats it as theirs.",
            fx: rf((r,p,ctx)=>{hop(ctx,20),lg(r,-3)}),
          },
          {
            t: "Stamp your foot and tell them all to stop",
            check: {s:"wil",s2:"int",d:25},
            win: {
              r: 'The room goes silent. The old chancellor smiles. "The child has the blood, at least."',
              fx: rf((r,p)=>{lg(r,6),A.willGrow(p,1.5)}),
            },
            lose: {r:"They pat you on the head and go on arguing.",fx:{wil:1,happy:-4}},
          },
        ],
      },
      {
        id: "ct_regent_plan",
        cool: 12,
        cond: (p,C)=>RUA(p,C)&&!!heirOf(RM(p))&&!A.isAdult(heirOf(RM(p))),
        setup: (p,ctx)=>{const h=heirOf(RM(p));ctx.pid=h?h.id:"",setHouse(ctx,p)},
        title: "If you should die",
        text: p=>`Your heir, {themFull}, is only {themAge}. If you died tomorrow, a child would wear the crown of ${RM(p)?RM(p).short:"the realm"}, and child kings rule through regents. Who would you name? The court has opinions, and the head of {house} has made sure you know theirs.`,
        choices: [
          {
            t: "Name your spouse regent",
            req: (p,C)=>C.married(p),
            r: "Your spouse will hold the seal. The great houses look sour.",
            fx: rf((r,p)=>{allOp(p,-3),lg(r,3)}),
          },
          {
            t: "Name the head of {house}",
            r: "A great lord as regent: strong, and dangerous. {House} beams.",
            fx: rf((r,p,ctx)=>{hop(ctx,22),lg(r,-2)}),
          },
          {
            t: "Name a council of five, so no one rules alone",
            check: {s:"diplomacy",s2:"learning",d:46},
            win: {
              r: "A balanced council, written into law and sworn by every great house.",
              fx: rf((r,p)=>{st(r,5),lg(r,4)}),
            },
            lose: {r:"Every house wants a seat on it. The quarrel lasts a year.",fx:rf((r,p)=>{st(r,-3),allOp(p,-3)})},
          },
        ],
      },
      {
        id: "ct_succession_law",
        cool: 15,
        cond: (p,C)=>RUA(p,C)&&RM(p).gov==="hereditary"&&C.hasKids(p),
        setup: (p,ctx)=>{const r=RM(p);ctx.law={male:"sons before daughters",equal:"the eldest child, son or daughter",female:"daughters before sons"}[r.law||"male"]||"sons before daughters"},
        title: "The law of succession",
        text: p=>`Your law of succession is {law}. ${A.pick(["A learned clerk has found a charter that reads the old law another way.","The lords grumble that the law favors the wrong child.","Your eldest daughter has asked you, coldly and precisely, why she was born second in law."])} Laws of succession have started more wars in Ardan than dragons ever did.`,
        choices: [
          {
            t: "Change it: the eldest child, son or daughter",
            req: p=>RM(p)&&RM(p).law!=="equal",
            r: "The law is rewritten. Some daughters rejoice; some sons do not.",
            fx: rf((r,p)=>{r.law="equal",delete r.heirLocked,A.pickHeir(r),lg(r,-6)}),
          },
          {
            t: "Change it: sons before daughters",
            req: p=>RM(p)&&(RM(p).law||"male")!=="male",
            r: "The old way, restored. Your daughters remember.",
            fx: rf((r,p)=>{r.law="male",delete r.heirLocked,A.pickHeir(r),lg(r,-5)}),
          },
          {
            // [X1 baked patch core/02-content-fixes EVT-TEXT-DIET] The text diet (event text <= 80 words, choices <= 12) had
            // three misses: two 13-word choices, and rl_sec_calf, whose 59-word intro plus the public story it pulls from the
            // lore rendered at about 83 words.
            t: "Keep the law and swear the lords to it again",
            check: {s:"diplomacy",s2:"wil",d:44},
            win: {r:"The lords swear. The question is closed, for this reign.",fx:rf((r,p)=>{lg(r,6),st(r,2)})},
            lose: {r:"Two houses swear with obvious reluctance.",fx:rf((r,p)=>{lg(r,-2),allOp(p,-3)})},
          },
        ],
      },
      {
        id: "ct_pretender",
        cool: 15,
        cond: (p,C)=>RUA(p,C)&&!throneWar(RM(p)),
        setup: (p,ctx)=>{const r=RM(p),q=A.genNoble(r.id,"royal",r.house||null,A.ri(18,30),"M");ctx.pid=q.id,ctx.claim=A.pick(["the son of your late uncle, thought drowned as a baby","a prince smuggled out of the nursery during the last succession","the legitimate grandson of an elder line set aside long ago"])},
        title: "A pretender",
        text: ()=>`A young man calling himself {themFull} has appeared ${A.pick(["in a port town","at a foreign court","among the hill lords","in a monastery in the north"])}, claiming to be {claim}. He has the family nose. Some say he has the family seal too. Crowds gather wherever he goes.`,
        choices: [
          {
            t: "Have your spymaster expose him as a fraud",
            check: {s:"intrigue",s2:"int",d:50,bonus:p=>A.councilSkill(RM(p),"spymaster")/5},
            win: {
              r: "He is a tanner's son from a river town, and his mother says so in the square. The crowds melt.",
              fx: rf((r,p)=>{lg(r,6),st(r,2)}),
            },
            lose: {
              r: 'Your spies produce a "mother" nobody believes. The pretender grows stronger.',
              fx: rf((r,p)=>{lg(r,-8),st(r,-4)}),
            },
          },
          {
            t: "Invite him to court and give him a pension",
            r: 'He takes the gold, the room and the title of "kinsman". A gilded cage is still a cage.',
            fx: rf((r,p,ctx)=>{r.treasury-=inc(p,.01),lg(r,-2),st(r,2),A.applyFx(p,{them:{type:"acquaint",op:10}},ctx)}),
          },
          {
            t: "Have him quietly killed",
            check: {s:"intrigue",s2:"ins",d:48},
            win: {
              r: "He drowns in a river, of course. Exactly as the story began.",
              fx: rf((r,p,ctx)=>{const q=A.P(ctx.pid);q&&q.alive&&A.kill(q,"drowning"),p.honor=cl(p.honor-8)}),
            },
            lose: {
              r: "The assassin is caught, and talks. You have made the pretender a martyr-in-waiting.",
              fx: rf((r,p)=>{lg(r,-12),st(r,-6),p.honor=cl(p.honor-6)}),
            },
          },
          {
            t: "Let him raise an army, and settle it in battle",
            r: "A crown is kept by the sword. Let him try.",
            fx: rf((r,p,ctx)=>{const q=A.P(ctx.pid);return!q||!q.alive||throneWar(r)?"The pretender loses his nerve.":(A.successionWar(r,q),"The pretender raises his standard. War of succession!")}),
          },
        ],
      },
      {
        id: "ct_strange_gift",
        cool: 8,
        cond: RU,
        setup: (p,ctx)=>{const o=other(p);ctx.oid=o?o.id:"",ctx.from=o?nm(o):"a far realm",ctx.gift=A.pick(["a striped horse from the south that bites everyone","a clockwork singing bird","a dwarven lamp that burns for a month","two leopards on golden chains","a book in a script no one at your court can read","a falcon trained to take herons"])},
        title: "A strange gift",
        text: ()=>"Envoys from {from} present a gift before the whole court: {gift}. The envoys watch you very closely. At a court, how a gift is received is a message too.",
        choices: [
          {
            t: "Receive it with delight and send back a richer one",
            r: "Gifts go both ways. Friendship grows, and so does the bill.",
            fx: rf((r,p,ctx)=>{r.treasury-=inc(p,.01),ctx.oid&&A.addRel(r.id,ctx.oid,12)}),
          },
          {
            t: "Make a witty speech about it",
            check: {s:"diplomacy",s2:"int",d:42},
            win: {
              r: "The court laughs, the envoys laugh, and the story travels home with them.",
              fx: rf((r,p,ctx)=>{ctx.oid&&A.addRel(r.id,ctx.oid,8),A.fame(p,1)}),
            },
            lose: {r:"The joke translates as an insult.",fx:rf((r,p,ctx)=>{ctx.oid&&A.addRel(r.id,ctx.oid,-8)})},
          },
          {
            t: "Receive it coolly. They want something",
            r: "They do. They go home without it.",
            fx: rf((r,p,ctx)=>{ctx.oid&&A.addRel(r.id,ctx.oid,-4)}),
          },
        ],
      },
      {
        id: "ct_heir_love",
        cool: 10,
        cond: (p,C)=>RUA(p,C)&&!!heirOf(RM(p))&&heirOf(RM(p)).id!==p.id&&A.isAdult(heirOf(RM(p)))&&!heirOf(RM(p)).spouse,
        setup: (p,ctx)=>{const h=heirOf(RM(p));ctx.pid=h?h.id:"",ctx.love=A.pick(["a lady-in-waiting with no dowry","the daughter of a disgraced house","a foreign hostage at your court","a minstrel","the widow of a rebel lord"])},
        title: "The heir's heart",
        text: ()=>"Your heir, {themFull}, has fallen for {love}, and announces at supper that {theyHe} will marry no one else. Meanwhile three realms have sent offers for the heir's hand.",
        choices: [
          {
            t: "Forbid it absolutely",
            r: "{them} obeys, and never quite forgives you.",
            fx: rf((r,p,ctx)=>{A.applyFx(p,{them:{op:-25}},ctx),lg(r,2)}),
          },
          {
            t: "Allow the love match",
            r: "A wedding for love. The court is charmed; the chancery weeps over lost alliances.",
            fx: rf((r,p,ctx)=>{A.applyFx(p,{them:{op:30}},ctx),lg(r,-3),A.fame(p,1)}),
          },
          {
            t: "Send the beloved away with a pension, quietly",
            check: {s:"intrigue",s2:"diplomacy",d:46},
            win: {
              r: "The beloved takes the gold and goes. {them} believes it was a free choice.",
              fx: rf((r,p)=>{r.treasury-=inc(p,.003)}),
            },
            lose: {r:"{them} finds out. The shouting can be heard in the kitchens.",fx:{them:{op:-35}}},
          },
        ],
      },
      {
        id: "ct_war_council",
        cool: 6,
        cond: (p,C)=>RUA(p,C)&&A.atWar(p.ruler).length===0&&A.neighbors(p.ruler).length>0,
        setup: (p,ctx)=>{const r=RM(p),ns=A.neighbors(p.ruler).map(A.realm).filter(t2=>t2&&t2.alive&&!t2.isRebel&&!(r.allies||[]).includes(t2.id)&&!(r.truce&&r.truce[t2.id]>A.S.year)),t=ns.length?ns.reduce((a,b)=>A.realmPower(a)<A.realmPower(b)?a:b):null;ctx.tid=t?t.id:"",ctx.tname=t?nm(t):"your neighbor";const m=seatHolder(r,"marshal");ctx.m=m?A.fullName(m):"Your marshal"},
        title: "The war council",
        text: ()=>'{m} spreads a map on the table and taps it. "{tname}. Their levies are thin, their court is distracted, and the border forts are rotten. One summer, Majesty. One summer and the land is ours." The council waits for your word.',
        choices: [
          {
            t: "Declare war on {tname}",
            req: (p,C,ctx)=>!!(ctx&&ctx.tid),
            r: "The heralds ride. The banners go up.",
            fx: rf((r,p,ctx)=>{if(!ctx.tid||!A.realm(ctx.tid))return"The war never comes.";const w=A.startWar(p.ruler,ctx.tid,null,"conquest");return w?`${w.name} begins.`:"The war cannot be declared now."}),
          },
          {
            t: "Prepare: drill the host and fill the arsenals first",
            r: "A year of drilling, forging and waiting.",
            fx: rf((r,p)=>{r.treasury-=inc(p,.04),r.armyQ=Math.min(1.6,r.armyQ+.05)}),
          },
          {
            t: "Refuse. The realm needs peace",
            r: "The marshal rolls up his map. The war party sulks. The farmers sow.",
            fx: rf((r,p)=>{st(r,3),allOp(p,-1)}),
          },
        ],
      },
      {
        id: "ct_peace_offer",
        cool: 3,
        cond: (p,C)=>RU(p,C)&&A.atWar(p.ruler).some(w=>w.leadA===p.ruler||w.leadD===p.ruler),
        setup: (p,ctx)=>{const w=A.atWar(p.ruler).find(x=>x.leadA===p.ruler||x.leadD===p.ruler);ctx.wid=w?w.id:"",ctx.war=w?w.name:"the war";const side=w?A.warSide(w,p.ruler):"att",en=w?A.realm(side==="att"?w.leadD:w.leadA):null;ctx.en=en?nm(en):"the enemy",ctx.sum=F(inc(p,.03))},
        title: "An offer of peace",
        text: ()=>'Under a white branch, an envoy from {en} comes to your camp. {war} has cost both sides dearly. They offer a white peace: no land changes hands, prisoners go home, and a payment of {sum} "for the burned churches". The wounded in your camp are listening.',
        choices: [
          {
            t: "Accept the white peace",
            r: "The war ends. The graves stay.",
            fx: rf((r,p,ctx)=>{const w=A.S.wars.find(x=>x.id===ctx.wid);w&&A.settleWar(w,"white"),r.treasury+=inc(p,.03),st(r,4)}),
          },
          {
            t: "Demand more: land and a larger payment",
            check: {s:"diplomacy",s2:"wil",d:52},
            win: {
              r: "They swallow hard and pay double. The peace is signed.",
              fx: rf((r,p,ctx)=>{const w=A.S.wars.find(x=>x.id===ctx.wid);w&&A.settleWar(w,"white"),r.treasury+=inc(p,.06),lg(r,4),A.fame(p,2)}),
            },
            lose: {r:"The envoy leaves. The war goes on.",fx:rf((r,p)=>{st(r,-2)})},
          },
          {
            t: "Refuse. Fight on to victory",
            r: "You send the envoy back without the branch.",
            fx: rf((r,p)=>{lg(r,1),st(r,-3)}),
          },
        ],
      },
      {
        id: "ct_tribute",
        cool: 8,
        cond: (p,C)=>RUA(p,C)&&A.neighbors(p.ruler).some(id=>{const t=A.realm(id);return t&&t.alive&&!t.isRebel&&A.realmPower(t)>A.realmPower(RM(p))*1.4}),
        setup: (p,ctx)=>{const r=RM(p),ns=A.neighbors(p.ruler).map(A.realm).filter(t=>t&&t.alive&&!t.isRebel&&A.realmPower(t)>A.realmPower(r)*1.4),o=ns.length?A.pick(ns):null;ctx.oid=o?o.id:"",ctx.from=o?nm(o):"a great neighbor",ctx.sum=F(inc(p,.08))},
        title: "A demand for tribute",
        text: ()=>'An envoy of {from} reads a demand before your court: tribute of {sum} a year, "for the protection of your borders". The envoy does not say who your borders need protecting from. Everyone knows.',
        choices: [
          {
            t: "Pay. Peace is cheaper than war",
            r: "You pay. The envoy smiles. Your lords do not.",
            fx: rf((r,p,ctx)=>{r.treasury-=inc(p,.08),lg(r,-6),ctx.oid&&A.addRel(r.id,ctx.oid,10)}),
          },
          {
            t: "Refuse to their face",
            r: "The court cheers you. The envoy rides home with your answer.",
            fx: rf((r,p,ctx)=>(lg(r,5),A.fame(p,2),ctx.oid&&(A.addRel(r.id,ctx.oid,-25),A.chance(.3)&&A.startWar(ctx.oid,r.id,null,"insult"))?"They answer with war.":"")),
          },
          {
            t: "Stall with gifts and letters",
            check: {s:"diplomacy",s2:"intrigue",d:48},
            win: {
              r: "A year of polite letters. The demand is forgotten in a border quarrel somewhere else.",
              fx: rf((r,p)=>{r.treasury-=inc(p,.01)}),
            },
            lose: {
              r: "They see through it and raise the demand.",
              fx: rf((r,p,ctx)=>{ctx.oid&&A.addRel(r.id,ctx.oid,-10),lg(r,-2)}),
            },
          },
        ],
      },
      {
        id: "ct_pledge_loan",
        cool: 9,
        cond: RU,
        setup: (p,ctx)=>{ctx.bank=A.pick(["House Lunetti of Ostra","the Hold Bank of Stonehold","the High Priest's treasury","a syndicate of Lucernan council families"]),ctx.sum=F(inc(p,.25)),ctx.pledge=A.pick(["the silver mines","the salt tolls","the crown jewels","the customs of your chief port"])},
        title: "A loan on pledge",
        text: ()=>'A factor of {bank} offers you {sum} in gold, at once, on easy interest. All they ask as security is {pledge}. "A formality, Majesty. Kings always repay." Not all of them do. Not all banks survive kings who do not.',
        choices: [
          {
            t: "Take the gold",
            r: "The gold arrives in iron-bound chests. So does a factor who now sits at the mint.",
            fx: rf((r,p)=>{r.treasury+=inc(p,.25),r.debt+=inc(p,.3)}),
          },
          {
            t: "Take half, on better terms",
            check: {s:"trade",s2:"stewardship",d:48,bonus:p=>A.councilSkill(RM(p),"treasurer")/5},
            win: {
              r: "Half the gold at two points less. The factor sighs.",
              fx: rf((r,p)=>{r.treasury+=inc(p,.12),r.debt+=inc(p,.13)}),
            },
            lose: {
              r: "Half the gold, on the same terms. The factor smiles.",
              fx: rf((r,p)=>{r.treasury+=inc(p,.12),r.debt+=inc(p,.15)}),
            },
          },
          {
            t: "Refuse. You will not pawn the realm",
            r: "The factor bows and leaves. The bank is offended. Banks have long memories.",
            fx: rf((r,p)=>{lg(r,2)}),
          },
        ],
      },
      {
        id: "ct_debase",
        cool: 10,
        cond: RU,
        setup: (p,ctx)=>{const r=RM(p),lc=LORE.realms[p.ruler]&&LORE.realms[p.ruler].coin?LORE.realms[p.ruler].coin.coin:"";ctx.coinName=lc||"the crown coin",ctx.sum=F(inc(p,.08))},
        title: "Clipping the coin",
        text: ()=>`Your mintmaster proposes a quiet change: a little less silver in {coinName}, a little more copper. "No one will notice for a year, Majesty, and the mint will make {sum}." ${A.pick(["The treasurer nods.","The chancellor looks away.","A merchant once told you bad coin drives out good."])}`,
        choices: [
          {
            t: "Debase the coin",
            r: "The mint makes its profit. Within a year, prices rise and merchants weigh every coin.",
            fx: rf((r,p)=>{r.treasury+=inc(p,.08),st(r,-6),p.flags.ct_debased=A.S.year}),
          },
          {
            t: "Debase it, but only a little and only for one year",
            check: {s:"stewardship",s2:"intrigue",d:50},
            win: {
              r: "A clever, small debasement. Nobody notices. You almost feel guilty.",
              fx: rf((r,p)=>{r.treasury+=inc(p,.04)}),
            },
            lose: {
              r: "A Lucernan money-changer notices in a week. The scandal is enormous.",
              fx: rf((r,p)=>{r.treasury+=inc(p,.02),st(r,-6),lg(r,-5)}),
            },
          },
          {
            t: "Refuse. Good coin is a king's honor",
            r: "The merchants of your realm will thank you without ever knowing.",
            fx: rf((r,p)=>{st(r,2),p.honor=cl(p.honor+3)}),
          },
        ],
      },
      {
        id: "ct_grain_hoarders",
        cool: 8,
        cond: RU,
        setup: (p,ctx)=>{const r=RM(p);ctx.cap=r?r.capital:"the capital"},
        title: "The grain hoarders",
        text: ()=>"The rains came late and bread in {cap} has doubled in price. Your spies say the great grain merchants have full barns and are waiting for prices to triple. Women have started gathering outside the bakers' doors at dawn.",
        choices: [
          {
            t: "Fix the price of bread by edict",
            r: "Bread is cheap, for a week. Then it vanishes from the markets.",
            fx: rf((r,p)=>{st(r,2),r.treasury-=inc(p,.01)}),
          },
          {
            t: "Open the hoarders' barns by force",
            check: {s:"command",s2:"intrigue",d:46},
            win: {
              r: "Soldiers open the barns. The grain is sold at fair prices. The merchants are furious and powerless.",
              fx: rf((r,p)=>{st(r,7),A.fame(p,2),r.treasury-=inc(p,.005)}),
            },
            lose: {
              r: "The merchants were warned. The barns are empty. The grain is somewhere else.",
              fx: rf((r,p)=>{st(r,-5)}),
            },
          },
          {
            t: "Buy grain abroad and sell it at cost",
            r: "Expensive, slow and it works.",
            fx: rf((r,p)=>{r.treasury-=inc(p,.05),st(r,5)}),
          },
          {
            t: "Do nothing. Prices will settle",
            r: "They settle, after the bread riots.",
            fx: rf((r,p)=>{st(r,-8)}),
          },
        ],
      },
      {
        id: "ct_plague_quarter",
        cool: 10,
        cond: RU,
        setup: (p,ctx)=>{const r=RM(p);ctx.town=A.pick(A.realmProvs(p.ruler).map(x=>x.name).concat([r?r.capital:"the capital"]))},
        title: "The sick quarter",
        text: ()=>"The bloody flux has broken out in the dyers' quarter of {town}. Two hundred dead in a week. Your physicians want the quarter walled off with the living inside. The priests want processions. The dyers want to leave.",
        choices: [
          {
            t: "Wall off the quarter",
            r: "The sickness stops at the wall. So do the screams, eventually.",
            fx: rf((r,p)=>{st(r,-3),p.honor=cl(p.honor-5),A.willGrow(p,1)}),
          },
          {
            t: "Let them go, and feed the sick at the crown's cost",
            r: "The flux spreads to two more towns, but no one calls you a butcher.",
            fx: rf((r,p)=>{r.treasury-=inc(p,.03),st(r,-2);for(const pr of A.realmProvs(r.id))pr.pop=Math.round(pr.pop*.995);A.updateRealmPops(),p.honor=cl(p.honor+3)}),
          },
          {
            t: "Hire the best physicians from Tamar and Ranpur",
            check: {s:"learning",s2:"medicine",d:45},
            win: {
              r: "The foreign doctors boil the water, burn the bedding and save half the quarter. Your name is blessed.",
              fx: rf((r,p)=>{r.treasury-=inc(p,.02),st(r,4),A.fame(p,2)}),
            },
            lose: {
              r: "The doctors bleed everyone and the flux takes the rest.",
              fx: rf((r,p)=>{r.treasury-=inc(p,.02),st(r,-3)}),
            },
          },
        ],
      },
      {
        id: "ct_building",
        cool: 8,
        cond: RU,
        setup: (p,ctx)=>{const r=RM(p);ctx.thing=A.pick(["a stone bridge across the river at "+(r?r.capital:"the capital"),"a cathedral that will take sixty years to finish","a new palace with glass in every window","a great canal to the sea","a hospital for old soldiers"]),ctx.sum=F(inc(p,.12))},
        title: "The master builder",
        text: ()=>"A master builder unrolls his drawings before you: {thing}. Cost: {sum}, and his word that it will outlast your grandchildren's grandchildren. Builders always say that. Some of them are right.",
        choices: [
          {
            t: "Build it, grandly",
            r: "The first stone is laid with trumpets. Your name will be carved over the door.",
            fx: rf((r,p)=>{r.treasury-=inc(p,.12),st(r,4),lg(r,4),A.fame(p,4),p.deeds.push({y:A.S.year,t:"Raised a great building"})}),
          },
          {
            t: "Build a plainer version",
            r: "Sound, useful and forgotten in a generation.",
            fx: rf((r,p)=>{r.treasury-=inc(p,.05),st(r,2)}),
          },
          {
            t: "Refuse. The money is needed elsewhere",
            r: "The builder rolls up his drawings and goes to your rival's court.",
            fx: {},
          },
        ],
      },
      {
        id: "ct_clergy_tax",
        cool: 9,
        cond: RU,
        setup: (p,ctx)=>{const f=A.faith(RM(p).faith||p.faith);ctx.faith=f?f.name:"the faith"},
        title: "The clergy's exemption",
        text: ()=>"The high clergy of {faith} hold perhaps a sixth of the land in your realm and pay no tax on any of it. Your treasurer wants that changed. The clergy say the land belongs to the gods, and the gods do not pay taxes.",
        choices: [
          {
            t: "Tax the church lands",
            r: "The money flows in. So do sermons about greedy kings.",
            fx: rf((r,p)=>{r.treasury+=inc(p,.06),st(r,-5),lg(r,-4),p.piety=cl(p.piety-6)}),
          },
          {
            t: 'Ask for a voluntary "gift" instead',
            check: {s:"diplomacy",s2:"faith",d:48},
            win: {
              r: "The clergy give generously, and loudly, so everyone knows they gave freely.",
              fx: rf((r,p)=>{r.treasury+=inc(p,.03)}),
            },
            lose: {
              r: "They give a pittance, and preach about it anyway.",
              fx: rf((r,p)=>{r.treasury+=inc(p,.005),lg(r,-1)}),
            },
          },
          {
            t: "Leave the exemption alone",
            r: "The clergy pray for your long life. Your treasurer prays for something else.",
            fx: rf((r,p)=>{lg(r,3),p.piety=cl(p.piety+3)}),
          },
        ],
      },
      {
        id: "ct_assassin",
        cool: 10,
        cond: RUA,
        setup: (p,ctx)=>{ctx.how=A.pick(["poison","poison","blade","bolt"])},
        title: "In the dark",
        text: (p,ctx)=>ctx.how==="poison"?"At the Midwinter feast your cupbearer is sweating. Your wine has a faint smell of bitter almond, and a fainter one of garlic.":ctx.how==="blade"?"A servant you do not recognize is in the corridor outside your bedchamber at midnight, with one hand inside his tunic.":"On the palace walk, at dusk, you hear the snap of a crossbow string from the rooftops.",
        choices: [
          {
            t: "Trust your instincts",
            check: {s:"ins",s2:"spd",d:46,bonus:p=>A.hasBlood(p,"taster")?40:0},
            win: {
              r: "You move, or refuse the cup, at exactly the right moment. The assassin is taken alive.",
              fx: rf((r,p)=>{A.trainSkill(p,"intrigue",2),A.fame(p,2),st(r,2),A.willGrow(p,1)}),
            },
            lose: {
              r: "",
              fx: rf((r,p,ctx)=>ctx.how==="poison"&&ownBlood(p)?(A.willGrow(p,1),"You drink. The arsenic burns going down, and then nothing happens. Your blood has carried this gift for generations. The poisoner faints when you rise from your chair."):(p.health-=ctx.how==="poison"?35:28,p.lastHurt=ctx.how==="poison"?"poison":"an assassin",ctx.how!=="poison"&&A.addWound(p,ctx.how==="bolt"?"arrow_wound":"deep_cut"),A.willGrow(p,2),"You are struck down. The physicians fight for your life for a week, and win, barely.")),
            },
          },
          {
            t: "Call the guard at once",
            r: "The guards seize the man. He swallows something before they can question him.",
            fx: rf((r,p,ctx)=>A.chance(.25)&&!(ctx.how==="poison"&&ownBlood(p))?(p.health-=15,p.lastHurt="an assassin","Not before he wounds you."):(A.trainSkill(p,"intrigue",1),"")),
          },
          {
            t: "Let it play out to catch whoever sent him",
            check: {s:"intrigue",s2:"wil",d:54,bonus:p=>A.councilSkill(RM(p),"spymaster")/5},
            win: {
              r: "You catch the assassin, follow the coin, and find who paid. The arrests shake the court.",
              fx: rf((r,p)=>{st(r,4),allOp(p,-3),A.fame(p,3),A.trainSkill(p,"intrigue",4)}),
            },
            lose: {
              r: "You let it play out a moment too long.",
              fx: rf((r,p,ctx)=>ctx.how==="poison"&&ownBlood(p)?"The poison does nothing to you, but the trail goes cold.":(p.health-=30,p.lastHurt="an assassin",A.willGrow(p,2),"You live. The trail goes cold.")),
            },
          },
        ],
      },
      {
        id: "ct_ruler_health",
        cool: 5,
        cond: (p,C)=>RUA(p,C)&&(C.old(p)||p.health<55),
        setup: (p,ctx)=>{ctx.ill=A.pick(["your joints swell and burn","you cough blood into your napkin at the council table","your left hand will not always obey you","you faint during Mass"])},
        title: "The physicians",
        text: ()=>"For weeks, {ill}. Three physicians argue at your bedside: one wants to bleed you, one wants to purge you, and a foreign doctor wants you to stop drinking. The court is watching the door of your chamber.",
        choices: [
          {
            t: "Listen to the foreign doctor",
            check: {s:"wil",s2:"sta",d:40},
            win: {r:"Rest, water and boiled greens. You hate every day of it and recover.",fx:{health:12,happy:-3}},
            lose: {r:"You cannot stick to it. The illness lingers.",fx:{health:-4}},
          },
          {
            t: "Let them bleed you",
            r: "You feel weaker and the physicians call it progress.",
            fx: {health:-6,cause:"the physicians"},
          },
          {
            t: "Hide it from the court and rule from your bed",
            check: {s:"intrigue",s2:"wil",d:44},
            win: {r:"Nobody knows. You rule with a fever and an iron face.",fx:{wil:1.5,health:-2}},
            lose: {
              r: "The court knows within a day. The lords start counting heirs.",
              fx: rf((r,p)=>{lg(r,-5),st(r,-3),p.health-=2}),
            },
          },
        ],
      },
      {
        id: "ct_old_ruler",
        cool: 10,
        cond: (p,C)=>RUA(p,C)&&C.old(p),
        setup: (p,ctx)=>{const h=heirOf(RM(p));ctx.heir=h&&h.id!==p.id?A.fullName(h):"no clear heir"},
        title: "The long reign",
        text: p=>`You are ${A.age(p)}. Half the court was not born when you took the crown. The lords bow lower than they used to, and talk faster when you leave the room. Your heir: {heir}.`,
        choices: [
          {
            t: "Rule as you always have",
            r: "You are still the sovereign, and you remind them of it at every council.",
            fx: {wil:.6},
          },
          {
            t: "Bring the heir into every council",
            req: p=>!!heirOf(RM(p))&&heirOf(RM(p)).id!==p.id,
            r: "The heir learns. The court sees the future at your elbow and is calmer for it.",
            fx: rf((r,p)=>{st(r,4),lg(r,3);const h=heirOf(r);h&&(A.trainSkill(h,"diplomacy",5),A.trainSkill(h,"stewardship",5))}),
          },
          {
            t: "Make a pilgrimage to set your soul in order",
            r: "A season on the road, prayers and long silences. You come back calmer.",
            fx: rf((r,p)=>{p.piety=cl(p.piety+10),p.happy=cl(p.happy+5),st(r,-2)}),
          },
        ],
      },
      {
        id: "ct_chronicle",
        cool: 12,
        cond: RUA,
        setup: (p,ctx)=>{ctx.ev=A.pick(["your last battle","your coronation","the death of your predecessor","the treaty you signed under pressure"])},
        title: "The chronicle",
        text: ()=>"The court chronicler reads you his draft of your reign. The account of {ev} is, to put it kindly, generous. You know what really happened. So does he. Chronicles in Ardan lie; the Chronicle of the Ironsides says the Glenwash Fords were won fairly, and the Free Halls keep a copy that says otherwise.",
        choices: [
          {
            t: "Let the flattering lie stand",
            r: "Posterity will think well of you, unless someone finds the other copy.",
            fx: rf((r,p)=>{A.fame(p,3),lg(r,2),p.honor=cl(p.honor-3)}),
          },
          {
            t: "Order him to write the truth",
            r: "The chronicler blinks, then writes it. A plainer, better book.",
            fx: {honor:5,fame:1},
          },
          {
            t: "Have the old records quietly locked away as well",
            r: "The awkward records go into a strongroom. History is what survives.",
            fx: rf((r,p)=>{lg(r,4),p.honor=cl(p.honor-5),A.trainSkill(p,"intrigue",2)}),
          },
        ],
      },
      {
        id: "ct_unpaid_host",
        cool: 6,
        cond: (p,C)=>RU(p,C)&&RM(p).treasury<RM(p).income*.1,
        setup: (p,ctx)=>{ctx.sum=F(inc(p,.05))},
        title: "The host is unpaid",
        text: ()=>"Your soldiers have not been paid in three months. A delegation of sergeants waits in the courtyard, very politely, with their hands near their swords. They want {sum} in arrears.",
        choices: [
          {
            t: "Pay them, even if you must borrow",
            r: "You borrow from the bankers to pay the spears. The army cheers you. The ledger groans.",
            fx: rf((r,p)=>{r.debt+=inc(p,.06)}),
          },
          {
            t: "Speak to them yourself",
            check: {s:"command",s2:"diplomacy",d:48},
            win: {
              r: "You promise pay at Harvest Home and share their soup. They go back to barracks.",
              fx: rf((r,p)=>{A.fame(p,1)}),
            },
            lose: {
              r: "They are not hungry for speeches. Some desert, with their weapons.",
              fx: rf((r,p)=>{r.army=Math.round(r.army*.92),st(r,-4)}),
            },
          },
          {
            t: "Hang the ringleaders",
            r: "Order is restored. Loyalty is not.",
            fx: rf((r,p)=>{r.armyQ=Math.max(.5,r.armyQ-.05),st(r,-2),p.honor=cl(p.honor-4)}),
          },
        ],
      },
      {
        id: "ct_noble_murder",
        cool: 8,
        cond: (p,C)=>RU(p,C)&&vass(p).length>0,
        setup: (p,ctx)=>{setHouse(ctx,p)},
        title: "Blood on a lord's hands",
        text: ()=>"The heir of {house} killed a miller in a quarrel over a toll, in front of twenty witnesses. The village wants justice. {House} reminds you, gently, how many lances they bring to your host.",
        choices: [
          {
            t: "Hang him like any murderer",
            r: "The commons bless you. {House} will never forgive you.",
            fx: rf((r,p,ctx)=>{st(r,4),p.honor=cl(p.honor+5),hop(ctx,-30),allOp(p,-3)}),
          },
          {
            t: "Exile him and make his house pay blood-money",
            check: {s:"diplomacy",s2:"learning",d:44},
            win: {
              r: "A fair judgment by any law. Everyone is a little unhappy, which is how you know it was fair.",
              fx: rf((r,p,ctx)=>{st(r,2),hop(ctx,-6),p.honor=cl(p.honor+2)}),
            },
            lose: {
              r: "The village thinks it is too little; the house thinks it is too much.",
              fx: rf((r,p,ctx)=>{st(r,-2),hop(ctx,-8)}),
            },
          },
          {
            t: "Pardon him",
            r: "{House} is grateful. The commons sing an ugly song about you.",
            fx: rf((r,p,ctx)=>{hop(ctx,15),st(r,-5),p.honor=cl(p.honor-5)}),
          },
        ],
      },
      {
        id: "ct_bastard_rumor",
        cool: 15,
        cond: (p,C)=>RUA(p,C)&&RM(p).gov==="hereditary",
        title: "Whose son?",
        text: p=>`A song is going around the taverns of ${RM(p)?RM(p).capital:"the capital"}: that your mother was unfaithful, and you are not of the royal blood at all. It is clever, catchy, and the children sing it in the streets.`,
        choices: [
          {
            t: "Hunt down the songwriter",
            check: {s:"intrigue",s2:"ins",d:46},
            win: {
              r: "A minstrel paid by a rival lord. He sings a different song now, in a cell.",
              fx: rf((r,p)=>{lg(r,4)}),
            },
            lose: {
              r: "You arrest three wrong minstrels. The song grows a new verse about it.",
              fx: rf((r,p)=>{lg(r,-6)}),
            },
          },
          {
            t: "Have the Rememberers or priests proclaim your line",
            r: "Your full descent is read aloud in every temple. Dull, and effective.",
            fx: rf((r,p)=>{r.treasury-=inc(p,.005),lg(r,5)}),
          },
          {
            t: "Laugh, and sing it yourself at the feast",
            check: {s:"music",s2:"diplomacy",d:40},
            win: {
              r: "The court roars. The song is ruined forever: it is the king's song now.",
              fx: rf((r,p)=>{lg(r,3),A.fame(p,2)}),
            },
            lose: {r:"You sing badly, and the court is mortified.",fx:rf((r,p)=>{lg(r,-3)})},
          },
        ],
      },
      {
        id: "ct_foreign_spy",
        cool: 8,
        cond: RU,
        setup: (p,ctx)=>{const o=other(p);ctx.oid=o?o.id:"",ctx.from=o?nm(o):"a foreign court",ctx.From=A.cap(ctx.from)},
        title: "A spy at court",
        text: ()=>"Your guards catch a clerk of the chancery copying your letters into cipher. Under questioning he names his paymasters: {from}. Their envoy is at court this very moment, eating your figs.",
        choices: [
          {
            t: "Hang the spy and expel the envoy",
            r: "A clear message. {From} gets it.",
            fx: rf((r,p,ctx)=>{ctx.oid&&A.addRel(r.id,ctx.oid,-18),st(r,2)}),
          },
          {
            t: "Turn the spy: feed them false letters",
            check: {s:"intrigue",s2:"int",d:50},
            win: {
              r: "For a year {from} believes every lie you write.",
              fx: rf((r,p)=>{A.trainSkill(p,"intrigue",4),r.armyQ=Math.min(1.6,r.armyQ+.02)}),
            },
            lose: {
              r: "The spy warns his masters with a hidden mark. You have taught them your cipher.",
              fx: rf((r,p)=>{st(r,-2)}),
            },
          },
          {
            t: "Confront the envoy privately and demand a price for silence",
            r: "{From} pays handsomely to avoid a scandal.",
            fx: rf((r,p,ctx)=>{r.treasury+=inc(p,.015),ctx.oid&&A.addRel(r.id,ctx.oid,-5)}),
          },
        ],
      },
      {
        id: "ct_hostage_guest",
        cool: 12,
        cond: (p,C)=>RU(p,C)&&vass(p).length>0,
        setup: (p,ctx)=>{setHouse(ctx,p);const q=A.genNoble(p.ruler,"noble",ctx.hid||null,A.ri(14,18));ctx.pid=q.id},
        title: "The hostage at court",
        text: (p,ctx)=>"{themFull}, heir of {house}, has lived at your court as a hostage for their family's good conduct since childhood. "+A.cap(A.he(A.P(ctx.pid)||p))+' has grown up at your table, rides with your children and calls you by a kinder name than "Majesty". {house} has asked for {themHim} back.',
        choices: [
          {
            t: "Send {them} home with gifts and honor",
            r: "{them} goes home a friend of your house. One day that heir will rule {house}.",
            fx: rf((r,p,ctx)=>{hop(ctx,18),A.applyFx(p,{them:{type:"friend",op:40}},ctx)}),
          },
          {
            t: "Keep {them}. A hostage is a hostage",
            r: "{house} bows. And remembers.",
            fx: rf((r,p,ctx)=>{hop(ctx,-10),st(r,2)}),
          },
          {
            t: "Marry {them} into your own family",
            check: {s:"diplomacy",s2:"int",d:44},
            win: {
              r: "A wedding binds the houses. {House} is yours, root and branch.",
              fx: rf((r,p,ctx)=>{hop(ctx,30),r.treasury-=inc(p,.01)}),
            },
            lose: {r:"{house} refuses the match as an attempt to swallow them.",fx:rf((r,p,ctx)=>{hop(ctx,-12)})},
          },
        ],
      },
      {
        id: "ct_bad_omen",
        cool: 10,
        cond: RU,
        setup: (p,ctx)=>{ctx.omen=A.pick(["a two-headed calf born in the royal herd","a comet with a red tail seen for nine nights","the great bell cracking on your name day","a hailstorm on Return Day","a crow nesting on the throne-room roof"])},
        title: "An omen",
        text: ()=>"All the realm is talking about {omen}. Wandering preachers say it means the crown sits on the wrong head. Your astrologer says it means great prosperity. Your astrologer is on your payroll.",
        choices: [
          {
            t: "Order public prayers and a feast",
            r: "The temples fill, the bread is free, and the omen fades.",
            fx: rf((r,p)=>{r.treasury-=inc(p,.01),st(r,3),p.piety=cl(p.piety+3)}),
          },
          {
            t: "Mock the omen publicly",
            check: {s:"diplomacy",s2:"int",d:42},
            win: {r:"You make the court laugh at the preachers. The fear dies.",fx:rf((r,p)=>{lg(r,3)})},
            lose: {r:"The common folk think you blaspheme.",fx:rf((r,p)=>{st(r,-4),p.piety=cl(p.piety-4)})},
          },
          {t:"Arrest the preachers",r:"Silence, and resentment.",fx:rf((r,p)=>{st(r,1),lg(r,-2)})},
        ],
      },
      {
        id: "ct_two_crowns",
        cool: 6,
        cond: (p,C)=>RU(p,C)&&(p.ruler==="POL-31"||p.ruler==="POL-31A"),
        title: "The other crown",
        text: p=>`A letter arrives from across the lines, sealed with ${p.ruler==="POL-31"?"Andros's red dawn":"Livia's gold sun"}. Your rival in Tessaria proposes a truce, or a marriage, or a meeting at the Cedars, where the Truce of 1087 was signed. Neither crown admits the other exists, so the letter is addressed to "the person who holds Tessar".`,
        choices: [
          {
            t: "Agree to meet at the Cedars",
            check: {s:"diplomacy",s2:"wil",d:54},
            win: {
              r: "For the first time in years, the two halves talk. Little is agreed, but much is understood.",
              fx: rf((r,p)=>{st(r,6),A.fame(p,3)}),
            },
            lose: {
              r: "The meeting turns into a shouting match about the six-fingered hand. Nothing changes.",
              fx: rf((r,p)=>{st(r,-2)}),
            },
          },
          {
            t: "Burn the letter publicly",
            r: "Your half cheers. The war goes on.",
            fx: rf((r,p)=>{lg(r,4),st(r,-2)}),
          },
          {
            t: "Reply with an offer they must refuse",
            r: "They refuse. Now you can say you offered.",
            fx: rf((r,p)=>{lg(r,2),A.trainSkill(p,"intrigue",2)}),
          },
        ],
      },
      {
        id: "ct_dying_parent",
        cool: 20,
        cond: (p,C)=>BL(p,C)&&p.parents.some(x=>{const q=A.P(x);return q&&q.alive&&A.age(q)>50}),
        setup: (p,ctx)=>{const par=p.parents.map(A.P).find(q=>q&&q.alive&&A.age(q)>50);ctx.pid=par?par.id:"";const sib=A.relsOf(p,["sibling"]).filter(x=>x.p.alive);ctx.sib=sib.length?sib[0].p.given:"a cousin",ctx.sid=sib.length?sib[0].p.id:""},
        title: "The deathbed",
        text: ()=>'Your parent, {themFull}, lies in the great bed with the curtains drawn back, and asks for you alone. "The will is not yet sealed. The lawyers say the land should go one way. My heart says another. {sib} has been here every day. Where have you been?"',
        choices: [
          {
            t: "Kneel and ask forgiveness for your absence",
            r: 'An old hand on your head. "You were always the stubborn one." The will is sealed as the law says.',
            fx: {them:{op:25},happy:4,wil:1},
          },
          {
            t: "Argue your rights under the law",
            check: {s:"learning",s2:"diplomacy",d:45},
            win: {
              r: "The lawyers agree with you, and so, tiredly, does your parent. The inheritance is yours.",
              fx: (p,ctx)=>{p.coin+=cost(p,30),A.applyFx(p,{them:{op:-5}},ctx);const s=A.P(ctx.sid);s&&A.addOp(p,s,-15)},
            },
            lose: {
              r: "Your parent turns to the wall. The will is changed in {sib}'s favor.",
              fx: (p,ctx)=>{const s=A.P(ctx.sid);s&&A.addOp(p,s,-25),A.willGrow(p,2),p.happy=cl(p.happy-8)},
            },
          },
          {
            t: "Tell them to give {sib} the larger share",
            r: "Your parent weeps. {sib} embraces you. You are poorer, and a better person, maybe.",
            fx: (p,ctx)=>{p.honor=cl(p.honor+6);const s=A.P(ctx.sid);s&&A.addOp(p,s,30),A.applyFx(p,{them:{op:20}},ctx)},
          },
        ],
      },
      {
        id: "ct_contested_inheritance",
        cool: 15,
        cond: (p,C)=>BL(p,C)&&!C.parentsAlive(p)&&rung(p)>=2,
        setup: (p,ctx)=>{const q=npcNoble(p,ctx,p.house||null,"M");q.born=A.S.year-Math.max(A.age(p)+15,45),ctx.what=A.pick(["your manor house and its mill","the hunting forest","your mother's dower lands","the house seat itself"])},
        title: "A contested inheritance",
        text: ()=>"Your uncle, {themFull}, has ridden into the courtyard with a lawyer and twenty men. He claims {what} under an older charter, sworn when your grandfather was alive. The charter may even be real.",
        choices: [
          {
            t: "Fight it in the liege's court",
            check: {s:"learning",s2:"diplomacy",d:48},
            win: {
              r: "The court upholds your right. Your uncle rides off cursing.",
              fx: {them:{type:"enemy",op:-30},fame:1},
            },
            lose: {
              r: "The court splits the inheritance. Your uncle gets half.",
              fx: (p,ctx)=>{pay(p,cost(p,20)),A.applyFx(p,{them:{type:"rival",op:-20}},ctx)},
            },
          },
          {
            t: "Buy him off",
            r: "He takes the gold, kisses you on both cheeks and leaves with a satisfied smile.",
            fx: p=>{pay(p,cost(p,25))},
          },
          {
            t: "Meet him with steel",
            r: "Uncle or no, this is your land.",
            fx: {
              duel: {
                tier: 3,
                foe: "them",
                opts: {kind:"duel",place:"your own courtyard",toYield:!0,title:"Blood of your blood"},
              },
            },
          },
        ],
      },
      {
        id: "ct_bastard_claim",
        cool: 15,
        cond: (p,C)=>(RUA(p,C)||BL(p,C))&&C.ageAdj(p)>=30,
        setup: (p,ctx)=>{const q=A.makeAcquaintance(p,"acquaint");q.flags.bastard=!0,ctx.pid=q.id,ctx.par=A.pick(["your late father","your grandfather","your elder brother, who died young"])},
        title: "A bastard's claim",
        text: ()=>"{themFull}, {themAge}, {themOcc}, stands in your hall with a ring and a letter. {theyHe} is the child of {par} by a serving woman, and now asks for recognition, a name and a share of the inheritance. The ring is genuine.",
        choices: [
          {
            t: "Recognize {them} as kin and give a small estate",
            r: "A new cousin at the family table. Some relatives are scandalized.",
            fx: (p,ctx)=>{pay(p,cost(p,15)),A.applyFx(p,{them:{type:"sibling",op:40,back:"sibling"}},ctx),p.honor=cl(p.honor+3)},
          },
          {
            t: "Pay {them} to go away and keep quiet",
            r: "{them} takes the gold. Whether {theyHe} keeps quiet is another matter.",
            fx: (p,ctx)=>{pay(p,cost(p,8)),A.applyFx(p,{them:{type:"acquaint",op:-10}},ctx)},
          },
          {
            t: "Denounce {them} as a fraud",
            check: {s:"diplomacy",s2:"wil",d:42},
            win: {r:"The court believes you. {them} leaves in disgrace.",fx:{them:{type:"enemy",op:-40},honor:-2}},
            lose: {
              r: "Too many people remember the serving woman. You look petty and afraid.",
              fx: {them:{type:"enemy",op:-40},fame:-2,honor:-3},
            },
          },
        ],
      },
      {
        id: "ct_sibling_throne",
        cool: 12,
        cond: (p,C)=>C.adult(p)&&!C.ruler(p)&&p.status==="royal"&&!!A.realm(p.realm)&&A.realm(p.realm).gov==="hereditary"&&!!A.P(A.realm(p.realm).ruler)&&A.P(A.realm(p.realm).ruler).id!==p.id&&!throneWar(A.realm(p.realm)),
        setup: (p,ctx)=>{const r=A.realm(p.realm),ru=A.P(r.ruler);ctx.pid=ru?ru.id:"",ctx.rs=r.short,ctx.style=ru?A.rulerStyle(ru,r):"the sovereign";const h=heirOf(r);ctx.heir=h?A.fullName(h):"nobody",ctx.amHeir=h&&h.id===p.id?1:0},
        title: "Royal blood",
        text: ()=>`You are of the royal blood of {rs}, close enough to the crown to smell the gilt. {style} rules; the heir is {heir}. ${A.pick(["A great lord has hinted that he would kneel more gladly to you.","Your friends at court say the crown would sit better on your head.","The sovereign has been cold to you since the last feast."])}`,
        choices: [
          {
            t: "Serve loyally at the sovereign's side",
            r: "You swear your oath anew. The sovereign relaxes, a little.",
            fx: {favor:15,honor:4},
          },
          {
            t: "Build a party at court, quietly",
            check: {s:"intrigue",s2:"diplomacy",d:50},
            win: {
              r: "Lords who would follow you, if the day came. You have not said which day.",
              fx: {skill:{intrigue:4},fame:2,flag:"ct_party"},
            },
            lose: {r:"Word gets back to the throne. You are watched now.",fx:{favor:-20,skill:{intrigue:2}}},
          },
          {
            t: "Claim the throne by the sword",
            req: (p,C)=>C.flag(p,"ct_party")||p.fame>=50,
            r: "You ride out of the capital at night and raise your banner. There is no going back.",
            fx: p=>{const r=A.realm(p.realm);return!r||throneWar(r)?"The moment has passed.":(A.successionWar(r,p),p.honor=cl(p.honor-6),A.fame(p,5),"Civil war! Lords choose sides across the realm.")},
          },
        ],
      },
      {
        id: "ct_heir_wedding",
        cool: 10,
        cond: (p,C)=>C.adult(p)&&!C.ruler(p)&&!C.married(p)&&(p.status==="royal"||p.status==="noble"&&!A.relsOf(p,["sibling"]).some(x=>x.p.alive&&x.p.born<p.born))&&C.ageAdj(p)<35,
        setup: (p,ctx)=>{const o=other(p);ctx.from=o?nm(o):"a neighboring house";const rid=o?o.id:p.realm,q=A.genNoble(rid,p.status==="royal"?"royal":"noble",o&&o.house?o.house:null,Math.max(16,A.age(p)+A.ri(-5,5)),p.sex==="M"?"F":"M");ctx.pid=q.id,ctx.oid=o?o.id:""},
        title: "A wedding of state",
        text: ()=>"You are an heir, and heirs are married for alliances. A match is made for you with {themFull} of {from}, {themAge}. You have exchanged two letters and one miniature portrait, which may have been flattering. The wedding will be in a cathedral, before half the nobility of two realms.",
        choices: [
          {
            t: "Go through with it, gracefully",
            r: "Bells, banners and a wedding night you will not describe to anyone. You are married.",
            fx: (p,ctx)=>{const t=A.P(ctx.pid);t&&A.marry(p,t),A.fame(p,3),ctx.oid&&p.realm&&A.addRel(p.realm,ctx.oid,10)},
          },
          {
            t: "Win {them} over before the vows",
            check: {s:"diplomacy",s2:"int",d:42,bonus:p=>p.looks/4-12},
            win: {
              r: "By the time you reach the altar you are both smiling, and it is not for show.",
              fx: (p,ctx)=>{const t=A.P(ctx.pid);t&&(A.marry(p,t),A.addOp(p,t,30)),p.happy=cl(p.happy+8),A.fame(p,3)},
            },
            lose: {
              r: "The portrait was very flattering. The marriage is made anyway.",
              fx: (p,ctx)=>{const t=A.P(ctx.pid);t&&A.marry(p,t),p.happy=cl(p.happy-6)},
            },
          },
          {
            t: "Refuse at the last moment",
            r: "The scandal of the decade. Two realms are insulted at once.",
            fx: (p,ctx)=>{ctx.oid&&p.realm&&A.addRel(p.realm,ctx.oid,-20),A.applyFx(p,{favor:-20,rel:{who:"father",op:-20}},ctx),A.fame(p,2),p.honor=cl(p.honor-5)},
          },
        ],
      },
      {
        id: "ct_claim_throne",
        cool: 10,
        cond: (p,C)=>BL(p,C)&&(rung(p)>=6||p.status==="royal")&&!!A.realm(p.realm)&&A.realm(p.realm).gov==="hereditary"&&A.realm(p.realm).legit<50&&!!A.realm(p.realm).ruler&&A.realm(p.realm).ruler!==p.id&&!throneWar(A.realm(p.realm)),
        setup: (p,ctx)=>{const r=A.realm(p.realm),ru=A.P(r.ruler);ctx.style=ru?A.rulerStyle(ru,r):"the sovereign",ctx.rs=r.short},
        title: "The lords come to you",
        text: ()=>`By night, three great lords of {rs} come to your hall with their hoods up. {style} has lost the realm's trust: debts, defeats, a crown that sits loosely. "Your blood is as good as theirs. Better. Say the word and our banners are yours."`,
        choices: [
          {
            t: "Say the word",
            r: "Banners rise across the realm. You have chosen civil war.",
            fx: p=>{const r=A.realm(p.realm);return!r||throneWar(r)?"Before you can act, the moment passes.":(A.successionWar(r,p),A.fame(p,5),"The war of succession begins!")},
          },
          {
            t: "Refuse, and warn the crown",
            r: "The lords are arrested. The crown is grateful. You have three new enemies.",
            fx: {favor:25,honor:3,newRel:{type:"enemy",op:-50}},
          },
          {
            t: "Refuse, but keep their names",
            r: "You send them away with a promise of silence and a ledger of debts owed to you.",
            fx: {skill:{intrigue:4},flag:"ct_party"},
          },
        ],
      },
      {
        id: "ct_disinherit_threat",
        cool: 15,
        cond: (p,C)=>BL(p,C)&&C.parentsAlive(p)&&C.ageAdj(p)<35,
        setup: (p,ctx)=>{const par=p.parents.map(A.P).find(q=>q&&q.alive);ctx.pid=par?par.id:"",ctx.why=A.pick(["your choice of friends","your gambling debts","your refusal of a match","your quarrel with the liege's favorite","your faith, which is not quite theirs"])},
        title: "The threat",
        text: ()=>'{themFull} calls you to the solar and shuts the door. Over {why}, {theyHe} is ready to disinherit you, and the lawyer is already waiting in the next room. "Give me one reason not to."',
        choices: [
          {
            t: "Bow your head and obey",
            r: "You give way. The lawyer is sent home. Something in you hardens.",
            fx: {them:{op:15},wil:1.5,happy:-4},
          },
          {
            t: "Argue back, with fire",
            check: {s:"diplomacy",s2:"wil",d:48},
            win: {
              r: 'Your parent looks at you for a long moment, then laughs. "There is my blood after all."',
              fx: {them:{op:20},fame:1},
            },
            lose: {
              r: "The lawyer is called in. You are cut out of the inheritance.",
              fx: p=>{p.flags.disinherited=A.S.year,A.willGrow(p,2),p.happy=cl(p.happy-10)},
            },
          },
          {
            t: "Walk out. You do not need their land",
            r: "You leave the hall with a horse and your pride. The world is wide.",
            fx: p=>{p.flags.disinherited=A.S.year,A.addTrait(p,"proud"),A.willGrow(p,1.5),p.coin+=cost(p,5)},
          },
        ],
      },
      {
        id: "ct_suspicious_death",
        cool: 20,
        cond: (p,C)=>BL(p,C)&&A.relsOf(p,["sibling"]).some(x=>x.p.alive&&x.p.born<p.born),
        setup: (p,ctx)=>{const s=A.relsOf(p,["sibling"]).filter(x=>x.p.alive&&x.p.born<p.born);ctx.pid=s.length?s[0].p.id:""},
        title: "A fall from a horse",
        text: (p,ctx)=>"Your elder sibling {themFull}, heir before you, was thrown from a horse on a hunt. "+A.cap(A.he(A.P(ctx.pid)||p))+" lives, barely. But the girth strap was cut, not torn, and the court's eyes have turned to the one person who gains most: you.",
        choices: [
          {
            t: "Find the real culprit",
            check: {s:"intrigue",s2:"int",d:50},
            win: {
              r: "A groom paid by a rival house. You bring the proof to court and clear your name.",
              fx: {them:{op:25},fame:2,skill:{intrigue:3}},
            },
            lose: {r:"The trail goes cold. The suspicion stays.",fx:{them:{op:-20},favor:-10,fame:-2}},
          },
          {
            t: "Sit by {them} every day until they recover",
            r: "Whatever the court thinks, your sibling knows you.",
            fx: {them:{op:35},honor:3,happy:-2},
          },
          {
            t: "Leave court until it blows over",
            r: "Absence looks like guilt. But it is quieter.",
            fx: {favor:-6,wil:.6},
          },
        ],
      },
      {
        id: "ct_old_charter",
        once: !0,
        cond: (p,C)=>BL(p,C)&&C.literate(p),
        setup: (p,ctx)=>{const h=A.house(p.house);ctx.hn=h?h.name:"your house",ctx.what=A.pick(["a county now held by another house","a toll on the great river","a castle lost to the crown four generations ago","a seat on the great council"])},
        title: "An old charter",
        text: ()=>"In a chest in the muniment room, wrapped in oilcloth, you find a charter with a cracked royal seal. It grants {hn} {what}, forever. Nobody has pressed this claim in a hundred years. Nobody has forgotten it either.",
        choices: [
          {
            t: "Press the claim at court",
            check: {s:"learning",s2:"diplomacy",d:55},
            win: {
              r: "The chancery examines the seal and finds it good. You win a rich grant in compensation.",
              fx: p=>{p.coin+=cost(p,50),A.fame(p,3)},
            },
            lose: {
              r: "The current holders produce a later charter. You make enemies for nothing.",
              fx: {newRel:{type:"enemy",op:-40},favor:-5},
            },
          },
          {
            t: "Keep it as a bargaining chip",
            r: "Paper is patient. Some day, someone will pay well to make this go away.",
            fx: {skill:{intrigue:3},flag:"ct_charter"},
          },
          {
            t: "Sell it to the house that holds the land",
            r: "They pay very well indeed, and burn it in front of you.",
            fx: p=>{p.coin+=cost(p,30)},
          },
        ],
      },
      {
        id: "ct_house_gathering",
        cool: 10,
        cond: (p,C)=>BL(p,C)&&!!p.house,
        setup: (p,ctx)=>{const h=A.house(p.house);ctx.hn=h?h.name:"your house",ctx.fest=A.pick(GD.FESTIVALS.map(f=>f[0]))},
        title: "The family gathers",
        text: ()=>"At {fest}, every branch of {hn} gathers at the seat. Cousins you have never met, aunts who remember everything, and an old quarrel about who sits nearest the head of the house that nobody has ever settled.",
        choices: [
          {
            t: "Make peace among the branches",
            check: {s:"diplomacy",s2:"int",d:44},
            win: {
              r: "You seat everyone by age, not branch. Grudgingly, it works. The old head nods at you.",
              fx: {fame:1,honor:2,newRel:{type:"friend",op:30}},
            },
            lose: {r:"A cousin throws a goblet. The feast ends early.",fx:{happy:-4}},
          },
          {
            t: "Court the head of the house",
            r: "You pour the wine and listen to the old stories. Favor is earned at such tables.",
            fx: p=>{p.coin+=cost(p,5),A.trainSkill(p,"diplomacy",2)},
          },
          {
            t: "Find the best-informed aunt and listen",
            r: "You learn who owes whom, who married for love, and which cousin is a secret Dawn Church heretic.",
            fx: {skill:{intrigue:3},int:.3},
          },
        ],
      },
      {
        id: "ct_regency_offer",
        cool: 12,
        cond: (p,C)=>BL(p,C)&&!!A.realm(p.realm)&&!!A.P(A.realm(p.realm).ruler)&&!A.isAdult(A.P(A.realm(p.realm).ruler)),
        setup: (p,ctx)=>{const r=A.realm(p.realm),ru=A.P(r.ruler);ctx.pid=ru?ru.id:"",ctx.rs=r.short},
        title: "A child on the throne",
        text: ()=>"{themFull}, only {themAge}, sits on the throne of {rs}, legs dangling. The regency council is a nest of vipers, and one seat has fallen empty. You are offered it.",
        choices: [
          {
            t: "Take the seat and protect the child",
            r: "You guard the young sovereign like your own. One day, that child will remember.",
            fx: {them:{type:"friend",op:40},honor:5,skill:{diplomacy:3,stewardship:2}},
          },
          {
            t: "Take the seat and enrich yourself",
            r: "Regents have always grown rich. You are no exception.",
            fx: p=>{p.coin+=cost(p,40),p.honor=cl(p.honor-6)},
          },
          {
            t: "Decline. Regents rarely die in their beds",
            r: "Wise, perhaps. Someone worse takes the seat.",
            fx: {wil:.4},
          },
        ],
      },
    ]);
  })();
})();
