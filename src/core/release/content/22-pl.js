// The release's event pack 22 of 30 (52 events, mostly pl_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-028). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const NB = p=>A.neighbors(p.ruler||p.realm),
      hasNb = p=>NB(p).length>0,
      pickNb = (p,ctx,pref)=>{const n=NB(p),s=pref?n.filter(pref):[];ctx.rid=(s.length?A.pick(s):A.pick(n))||null},
      otherRealms = p=>Object.values(A.S.realms).filter(r=>r.alive&&!r.isRebel&&r.id!==(p.ruler||p.realm)),
      anyRealm = (p,ctx,pref)=>{const all=otherRealms(p),s=pref?all.filter(pref):[],r=s.length?A.pick(s):A.pick(all);ctx.rid=r?r.id:null},
      pickFac = (p,ctx,kind)=>{const fs=A.factionsOf(p.ruler||p.realm).filter(f=>!kind||f.kind===kind);ctx.fid=fs.length?A.pick(fs).id:p.faction||null},
      facPow = ctx=>{const f=(A.S.factions||[]).find(x=>x.id===ctx.fid);return f?Math.round((f.power||0)*100):0},
      myR = p=>A.realm(p.ruler||p.realm),
      allyOf = p=>{const r=myR(p);return r?r.allies.filter(x=>A.realm(x)&&A.realm(x).alive):[]},
      tribOf = p=>{const r=myR(p);return r?A.tributariesOf(r.id):[]};
    A.defEvents([
      {
        id: "pl_envoy_gifts",
        cond: (p,C)=>C.ruler(p)&&hasNb(p),
        w: 1.1,
        cool: 4,
        title: "An envoy with gifts",
        setup: (p,ctx)=>pickNb(p,ctx,o=>A.relBetween(p.ruler,o)>-30),
        text: p=>`An envoy from {otherName} kneels in your hall with ${A.pick(["a white gyrfalcon","six bolts of dyed silk","a chest of minted silver","a mail shirt of dwarf make","a stallion of the steppe"])} and a sealed letter from {otherRuler}. The letter is warm. Too warm, your chancellor whispers.`,
        choices: [
          {
            t: "Accept, and send richer gifts back",
            r: "Gifts cross the border both ways. The road between your capitals feels shorter.",
            fx: {treasury:-600,realmRel:14},
          },
          {
            t: "Ask the envoy plainly what {otherRuler} wants",
            check: {s:"diplomacy",s2:"int",d:45},
            win: {
              r: "The envoy laughs and admits it: a trade pact and a quiet border. You sign the first.",
              fx: {pact:"trade",realmRel:6,skill:{diplomacy:2}},
            },
            lose: {
              r: "The envoy smiles and says nothing useful for three days. Then goes home.",
              fx: {skill:{diplomacy:1}},
            },
          },
          {
            t: "Have your spymaster go through the envoy's baggage",
            check: {s:"intrigue",s2:"stealth",d:50},
            win: {
              r: "Letters in cipher: {other} is hiring mercenaries. You keep the copies and the smile.",
              fx: {skill:{intrigue:2},stability:2},
            },
            lose: {
              r: "The envoy catches your man in his rooms. He leaves that night, and {other} hears all about it.",
              fx: {realmRel:-18},
            },
          },
        ],
      },
      {
        id: "pl_ally_gold",
        cond: (p,C)=>C.ruler(p)&&C.allies(p)>0,
        w: 1,
        cool: 5,
        title: "An ally asks for gold",
        setup: (p,ctx)=>{ctx.rid=A.pick(allyOf(p)),ctx.amt=A.fmt(Math.round(Math.max(1500,((A.realm(ctx.rid)||{}).income||2e4)*.05)))},
        text: "{otherRuler} writes in person, in ink still smudged, which rulers never do. {other} is short of silver for its garrisons. Could your treasury spare {amt} suns, between friends?",
        choices: [
          {
            t: "Send it as a gift",
            req: p=>(A.realm(p.ruler)||{}).treasury>3e3,
            r: "The silver goes north in sealed barrels. {other} will not forget it.",
            fx: (p,ctx)=>{const r=A.realm(p.ruler),a=Math.round(Math.max(1500,((A.realm(ctx.rid)||{}).income||2e4)*.05));r.treasury-=a,A.addRel(r.id,ctx.rid,22)},
          },
          {
            t: "Lend it at a fair interest",
            req: p=>(A.realm(p.ruler)||{}).treasury>3e3,
            check: {s:"trade",s2:"diplomacy",d:40},
            win: {
              r: "They accept your terms with good grace. In five years you will be paid back, with something extra.",
              fx: (p,ctx)=>{const r=A.realm(p.ruler);r.treasury+=600,A.addRel(r.id,ctx.rid,6)},
            },
            lose: {r:"They take the loan and resent the interest. Friends should not count coins.",fx:{realmRel:-6}},
          },
          {
            t: "Refuse — your own garrisons are hungry too",
            r: "A polite letter back. A cooler letter after that.",
            fx: {realmRel:-12},
          },
        ],
      },
      {
        id: "pl_ally_troops",
        cond: (p,C)=>C.ruler(p)&&C.allies(p)>0&&A.S.wars.some(w=>allyOf(p).some(a=>w.att.includes(a)||w.def.includes(a))&&!w.att.includes(p.ruler)&&!w.def.includes(p.ruler)),
        w: 1.2,
        cool: 4,
        title: "Your ally is at war",
        setup: (p,ctx)=>{const w=A.S.wars.find(w2=>allyOf(p).some(a=>w2.att.includes(a)||w2.def.includes(a))&&!w2.att.includes(p.ruler)&&!w2.def.includes(p.ruler));ctx.rid=allyOf(p).find(a=>w.att.includes(a)||w.def.includes(a)),ctx.war=w.name},
        text: '{other} is fighting {war} and it is going badly. {otherRuler} does not ask you to declare war. Only for men. "Volunteers," the letter says, "who happen to wear your colors."',
        choices: [
          {
            t: 'Send a thousand "volunteers"',
            r: "They march without banners. Everyone knows whose they are, and everyone pretends not to.",
            fx: (p,ctx)=>{const r=A.realm(p.ruler);r.army=Math.max(0,r.army-1e3),A.addRel(r.id,ctx.rid,20);const ow=A.S.wars.find(w=>w.name===ctx.war);if(ow){const side=ow.att.includes(ctx.rid)?"att":"def";ow.score+=side==="att"?6:-6}},
          },
          {
            t: "Send silver for mercenaries instead",
            req: p=>(A.realm(p.ruler)||{}).treasury>2500,
            r: "Coin travels faster than men, and dies less.",
            fx: {treasury:-2500,realmRel:12},
          },
          {
            t: "Send prayers and regrets",
            r: "You stay out of it. {other} notes the prayers, and the regrets.",
            fx: {realmRel:-15,stability:1},
          },
        ],
      },
      {
        id: "pl_tributary_plea",
        cond: (p,C)=>C.ruler(p)&&C.overlord(p),
        w: 1,
        cool: 5,
        title: "A tributary pleads",
        setup: (p,ctx)=>{ctx.rid=A.pick(tribOf(p)).id},
        text: p=>`The envoy of {otherName} kneels with ${A.pick(["ash in his hair","bare feet","a halter around his neck, as custom demands"])}. A bad harvest: they cannot pay this year's tribute in full. They beg for mercy, or for time.`,
        choices: [
          {
            t: "Forgive this year's tribute",
            r: "Mercy, publicly given. {other} blesses your name in its temples.",
            fx: (p,ctx)=>{const r=A.realm(p.ruler);A.addRel(r.id,ctx.rid,25),r.treasury-=Math.round(((A.realm(ctx.rid)||{}).income||1e4)*.08),A.fame(p,2)},
          },
          {
            t: "Give them two years, with interest",
            check: {s:"stewardship",s2:"diplomacy",d:40},
            win: {r:"They agree gratefully, and pay on time. A firm hand, fairly used.",fx:{realmRel:5,treasury:500}},
            lose: {r:"They agree, then default. The interest is a dream.",fx:{realmRel:-5}},
          },
          {
            t: "Demand full payment — send soldiers to collect",
            r: "Your soldiers take grain from starving villages. The tribute is paid. The hatred is permanent.",
            fx: (p,ctx)=>{const r=A.realm(p.ruler);A.addRel(r.id,ctx.rid,-35),r.treasury+=Math.round(((A.realm(ctx.rid)||{}).income||1e4)*.08),r.infamy=Math.min(100,(r.infamy||0)+4)},
          },
        ],
      },
      {
        id: "pl_tributary_plot",
        cond: (p,C)=>C.ruler(p)&&C.overlord(p)&&C.prof(p,"intrigue",0),
        w: .8,
        cool: 7,
        title: "Whispers from a tributary",
        setup: (p,ctx)=>{ctx.rid=A.pick(tribOf(p)).id},
        text: 'Your spymaster lays a letter on your table, half burned. {otherRuler} has been writing to your rivals. The words "after the harvest" and "free of the yoke" survive the fire.',
        choices: [
          {
            t: "Summon {otherRuler} to your court to explain",
            check: {s:"intimidation",s2:"diplomacy",d:50},
            win: {
              r: "{otherRuler} comes, sweats, swears loyalty on the bones of the saints. And means it, now.",
              fx: {realmRel:10,legit:2},
            },
            lose: {
              r: "{otherRuler} does not come. A cold letter arrives instead: {other} will pay no more.",
              fx: (p,ctx)=>{const t=A.realm(ctx.rid);t&&(t.overlord=null),A.addRel(p.ruler,ctx.rid,-20)},
            },
          },
          {
            t: "Bribe their council to keep them loyal",
            req: p=>(A.realm(p.ruler)||{}).treasury>2e3,
            r: "Gold in the right sleeves. The letters stop.",
            fx: {treasury:-2e3,realmRel:4},
          },
          {
            t: "March on them before they move",
            r: "You strike first. Everyone will call it tyranny; some will call it wisdom.",
            fx: {warOn:"tribute",infamy:4},
          },
          {
            t: "Let them go — tribute from a traitor is poison",
            r: "You release {other} from tribute before they can rebel. Odd, but people call it noble.",
            fx: (p,ctx)=>{const t=A.realm(ctx.rid);t&&(t.overlord=null),A.addRel(p.ruler,ctx.rid,20),A.fame(p,2)},
          },
        ],
      },
      {
        id: "pl_coalition_letter",
        cond: (p,C)=>C.ruler(p)&&C.infamy(p)>=35,
        w: 1.1,
        cool: 4,
        title: "The neighbors are counting your conquests",
        setup: (p,ctx)=>pickNb(p,ctx),
        text: p=>`A copy of a letter reaches you through a bribed clerk. {otherRuler} is writing to every court around you: "${A.realm(p.ruler).short} has swallowed ${A.pick(["three","four","too many"])} provinces in a few years. Who is next?" Your infamy is ${Math.round(A.realm(p.ruler).infamy)} — at 40 coalitions form; above 60 they march.`,
        choices: [
          {
            t: "Return a province to calm them",
            req: p=>A.realmProvs(p.ruler).filter(x=>x.orig!==p.ruler).length>0,
            r: "You hand back a conquered province with a great ceremony. The letters stop, for now.",
            fx: p=>{const r=A.realm(p.ruler),pr=A.realmProvs(r.id).filter(x=>x.orig!==r.id&&A.realm(x.orig)&&A.realm(x.orig).alive)[0];pr&&A.transferProv(pr,pr.orig,!1),r.infamy=Math.max(0,r.infamy-20),A.fame(p,1)},
          },
          {
            t: "Send embassies with gifts to every court",
            req: p=>(A.realm(p.ruler)||{}).treasury>3e3,
            check: {s:"diplomacy",s2:"persuasion",d:50},
            win: {r:"Your envoys charm and reassure. The fear cools.",fx:{treasury:-3e3,infamy:-12}},
            lose: {r:"Your gifts are taken and your words ignored.",fx:{treasury:-3e3,infamy:-3}},
          },
          {
            t: "Let them talk. Build more walls.",
            r: "You spend on fortresses, not friends.",
            fx: {treasury:-1500,stability:2},
          },
        ],
      },
      {
        id: "pl_border_incident",
        cond: (p,C)=>C.ruler(p)&&hasNb(p),
        w: 1.1,
        cool: 4,
        title: "Blood on the border",
        setup: (p,ctx)=>{pickNb(p,ctx),ctx.place=A.pick(A.realmProvs(p.ruler)).name},
        text: p=>`Riders from {other} crossed into ${A.pick(["the fields","the forest","the hills"])} near {place} chasing cattle thieves. Your border wardens met them. Four men are dead, two of them yours. Both sides call the other the raiders.`,
        choices: [
          {
            t: "Demand blood-price from {otherRuler}",
            check: {s:"intimidation",s2:"diplomacy",d:50},
            win: {
              r: "{otherRuler} pays, grudgingly. Your wardens drink to you.",
              fx: {treasury:400,legit:2,realmRel:-5},
            },
            lose: {
              r: "{otherRuler} refuses and demands blood-price from YOU. Now it is a matter of honor.",
              fx: {realmRel:-15,stability:-2},
            },
          },
          {
            t: "Propose a joint inquiry and a border court",
            check: {s:"diplomacy",s2:"learning",d:40},
            win: {
              r: "The inquiry finds a bandit gang playing both sides. They hang. You both look wise.",
              fx: {realmRel:12,pact:"nap"},
            },
            lose: {r:"The inquiry collapses in shouting. Still, nobody else died.",fx:{realmRel:-3}},
          },
          {
            t: "Raid back. An eye for an eye.",
            r: "Your wardens burn three of their farms. The border learns to fear your colors.",
            fx: {realmRel:-25,infamy:2,stability:1},
          },
          {t:"Let it go",r:"You swallow it. The wardens think less of you.",fx:{stability:-2,realmRel:3}},
        ],
      },
      {
        id: "pl_captured_spy",
        cond: (p,C)=>C.ruler(p)&&hasNb(p),
        w: .9,
        cool: 6,
        title: "A spy in the cells",
        setup: (p,ctx)=>pickNb(p,ctx),
        text: p=>`Your guards caught a ${A.pick(["scullery maid","scribe in the treasury","groom in the royal stables","young knight of your own household"])} copying letters. Under questioning: paid by {other}. {otherRuler} will deny everything, of course.`,
        choices: [
          {
            t: "Hang the spy in the market square",
            r: "A short drop and a long message. {other} sends no more spies — this year.",
            fx: {stability:2,realmRel:-10,honor:-1},
          },
          {
            t: "Turn the spy: feed false letters to {other}",
            check: {s:"intrigue",s2:"deception",d:55},
            win: {
              r: "For two years {other} plans against a realm that does not exist. Lovely.",
              fx: {skill:{intrigue:3},stability:2,realmRel:0,flag:"pl_doubleagent"},
            },
            lose: {
              r: "The spy runs at the first chance and tells {other} everything, including about the turning.",
              fx: {realmRel:-8},
            },
          },
          {
            t: "Send the spy home with a polite note",
            r: '"We believe this belongs to you." {otherRuler} is embarrassed and, oddly, grateful.',
            fx: {realmRel:10,honor:2},
          },
        ],
      },
      {
        id: "pl_refugee_prince",
        cond: (p,C)=>C.ruler(p),
        w: .7,
        once: !0,
        title: "A prince at your gate",
        setup: (p,ctx)=>{anyRealm(p,ctx,r=>r.stability<50||A.atWar(r.id).length>0),ctx.prince=A.givenName((A.realm(ctx.rid)||{}).cult||"CUL-01","M")},
        text: "A young man in a torn cloak and a good ring asks for sanctuary: {prince}, a son of {otherName}, fleeing a court that wants him dead. He has nothing. He has a claim.",
        choices: [
          {
            t: "Grant sanctuary and raise him at your court",
            r: "A claimant in your pocket is a dagger you may one day need. {other} is furious.",
            fx: {realmRel:-20,claim:!0,legit:1},
          },
          {
            t: "Hand him back to {otherRuler}",
            r: "He is taken away in chains. {other} sends you warm thanks. You do not sleep well.",
            fx: {realmRel:25,honor:-6},
          },
          {
            t: "Give him a horse and a purse and let him go",
            r: "He rides south to try his luck elsewhere. Nobody can blame you, and nobody thanks you.",
            fx: {treasury:-200,honor:2},
          },
        ],
      },
      {
        id: "pl_insult_court",
        cond: (p,C)=>C.ruler(p)&&hasNb(p),
        w: .9,
        cool: 6,
        title: "An insult abroad",
        setup: (p,ctx)=>pickNb(p,ctx,o=>A.relBetween(p.ruler,o)<10),
        text: p=>`At a feast in {otherName}, a jester mocked you — ${A.pick(["your mother's birth","your weak chin","your lost battles","your faith","your coin"])} — and {otherRuler} laughed loudest. Three ambassadors saw it. All of Ardan will hear the joke by spring.`,
        choices: [
          {
            t: "Demand a public apology",
            check: {s:"diplomacy",s2:"intimidation",d:50},
            win: {r:"An apology comes, stiff and sealed. The joke dies.",fx:{legit:3,realmRel:-3}},
            lose: {r:"No apology. Now the refusal is the joke.",fx:{legit:-3,realmRel:-10}},
          },
          {
            t: "Answer with a better joke at your own court",
            check: {s:"persuasion",s2:"int",d:45},
            win: {r:"Your answer is quoted from Coreria to the Sunlands. You win the round.",fx:{fame:3}},
            lose: {r:"Your joke falls flat. Courtiers laugh politely. Ouch.",fx:{fame:-1}},
          },
          {t:"Treat it as a cause for war",r:"Insult is a casus belli as old as crowns.",fx:{warOn:"insult"}},
          {t:"Ignore it",r:"Kings who answer jesters become jesters. You let it pass.",fx:{wil:.5}},
        ],
      },
      {
        id: "pl_council_quarrel",
        cond: (p,C)=>C.ruler(p)&&Object.keys((A.realm(p.ruler)||{}).council||{}).length>=2,
        w: 1,
        cool: 5,
        title: "A quarrel on the council",
        setup: (p,ctx)=>{const c=A.realm(p.ruler).council,ks=Object.keys(c).filter(k=>A.P(c[k])&&A.P(c[k]).alive);ctx.a=ks[0]?A.COUNCIL[ks[0]].name:"Chancellor",ctx.b=ks[1]?A.COUNCIL[ks[1]].name:"Marshal",ctx.pid=ks[0]?c[ks[0]]:null},
        text: "Your {a} and your {b} have stopped speaking. Each says the other is robbing the realm. Each wants the other dismissed. The rest of the council is picking sides.",
        choices: [
          {
            t: "Back the {a}",
            r: "One side wins. The other side smiles thinly and waits.",
            fx: {them:{op:12},houseOp:-2,stability:-1},
          },
          {
            t: "Have both audited by your treasurer's clerks",
            check: {s:"stewardship",s2:"learning",d:45},
            win: {
              r: "The audit finds one honest, one thief. Justice is quiet and complete.",
              fx: {treasury:1200,stability:3},
            },
            lose: {
              r: "The audit finds both a little dirty. You keep them both, and they hate the clerks now.",
              fx: {stability:-1},
            },
          },
          {
            t: "Lock them in a room until they agree",
            check: {s:"persuasion",s2:"wil",d:40},
            win: {
              r: "They come out at dawn, hoarse, with a plan you both like. Rulership!",
              fx: {stability:3,skill:{diplomacy:2}},
            },
            lose: {r:"They come out at dawn with black eyes.",fx:{stability:-2}},
          },
        ],
      },
      {
        id: "pl_faction_audience",
        cond: (p,C)=>C.ruler(p)&&C.realmFaction(p),
        w: 1.2,
        cool: 3,
        title: "The faction asks for an audience",
        setup: (p,ctx)=>pickFac(p,ctx),
        text: (p,ctx)=>`The {faction} — led by {factionLeader}, about ${facPow(ctx)}% of the realm's swords — asks for a private audience. "Before things are said in public that cannot be unsaid," the letter reads.`,
        choices: [
          {
            t: "Hear them out and give small concessions",
            r: "Offices, a few tolls, a seat at the feast. The faction cools a little.",
            fx: {factionDisc:-20,treasury:-800,legit:-1},
          },
          {
            t: "Divide them: buy off their weakest member",
            check: {s:"intrigue",s2:"persuasion",d:50},
            win: {
              r: "One lord takes your gold and leaves. The others look at each other differently.",
              fx: {factionDisc:-30,treasury:-1200,skill:{intrigue:2}},
            },
            lose: {
              r: "The lord takes your gold and tells the others. Now they are angry AND rich.",
              fx: {factionDisc:15,treasury:-1200},
            },
          },
          {
            t: "Refuse the audience",
            r: "A ruler does not bargain with subjects. They leave muttering.",
            fx: {factionDisc:15,legit:2},
          },
        ],
      },
      {
        id: "pl_authority_lords",
        cond: (p,C)=>C.ruler(p)&&C.authority(p)>=2,
        w: .9,
        cool: 6,
        title: "The lords and the crown",
        text: p=>`Your crown's authority is ${A.AUTH[A.realm(p.ruler).laws.authority][0]}. Royal judges overrule the lords' courts; royal tax-farmers walk into their halls. Today three great lords bring you a charter of their "ancient liberties" and ask you to seal it.`,
        choices: [
          {
            t: "Seal it — lower crown authority",
            r: "The lords cheer. Your treasurers groan. The realm breathes easier.",
            fx: {authority:-1,houseOp:10,factionDisc:-20},
          },
          {
            t: "Tear it up before them",
            check: {s:"intimidation",s2:"wil",d:50},
            win: {r:"They bow, pale. The crown stands.",fx:{legit:3,houseOp:-6}},
            lose: {
              r: "They walk out of your hall together. That is how revolts start.",
              fx: {houseOp:-12,factionDisc:20},
            },
          },
          {
            t: 'Promise to "consider it" for a year',
            check: {s:"diplomacy",s2:"deception",d:40},
            win: {r:"A year is a long time. By the end of it, they have other troubles.",fx:{houseOp:2}},
            lose: {r:"They know a stall when they see one.",fx:{houseOp:-4,factionDisc:8}},
          },
        ],
      },
      {
        id: "pl_authority_push",
        cond: (p,C)=>C.ruler(p)&&C.authority(p)<=1,
        w: .8,
        cool: 7,
        title: "A chance to strengthen the crown",
        text: p=>`A great lord of ${A.realm(p.ruler).short} has died without an heir. His lands should go to his cousins by the old custom — or to the crown, by a reading of the law your clerks found in an old charter.`,
        choices: [
          {
            t: "Claim the lands for the crown",
            check: {s:"learning",s2:"intimidation",d:50},
            win: {
              r: "The lands, and the precedent, are yours. Crown authority rises.",
              fx: {authority:1,treasury:3e3,houseOp:-6},
            },
            lose: {
              r: "The cousins take up arms over it. You win the lands but lose a lot of goodwill.",
              fx: {treasury:2e3,houseOp:-12,factionDisc:15},
            },
          },
          {
            t: "Let the cousins inherit, as custom says",
            r: "Custom holds. The lords sleep sounder.",
            fx: {houseOp:5},
          },
          {
            t: "Grant the lands to a loyal knight of yours",
            r: "A new lord who owes everything to you.",
            fx: {houseOp:-3,legit:3,stability:1},
          },
        ],
      },
      {
        id: "pl_great_feud",
        cond: (p,C)=>C.ruler(p)&&A.realmHouses(p.ruler).length>=2,
        w: 1,
        cool: 5,
        title: "Two great houses at each other's throats",
        setup: (p,ctx)=>{const hs=A.shuffle(A.realmHouses(p.ruler)).slice(0,2);ctx.h1=hs[0].name,ctx.h2=hs[1].name,ctx.h1id=hs[0].id,ctx.h2id=hs[1].id},
        text: p=>`{h1} and {h2} are feuding over ${A.pick(["a mill and the river rights","a marriage that was broken off","a son killed in a tourney","a forest both claim","a debt three generations old"])}. Their men have already fought at a ford. Both come to you for judgment.`,
        choices: [
          {
            t: "Judge for {h1}",
            r: "{h1} rejoices. {h2} will remember.",
            fx: (p,ctx)=>{const a=A.S.houses[ctx.h1id],b=A.S.houses[ctx.h2id];a&&(a.op=Math.min(100,(a.op||50)+15)),b&&(b.op=Math.max(0,(b.op||50)-20))},
          },
          {
            t: "Judge for {h2}",
            r: "{h2} rejoices. {h1} will remember.",
            fx: (p,ctx)=>{const a=A.S.houses[ctx.h1id],b=A.S.houses[ctx.h2id];b&&(b.op=Math.min(100,(b.op||50)+15)),a&&(a.op=Math.max(0,(a.op||50)-20))},
          },
          {
            t: "Split it, and marry their children to seal it",
            check: {s:"diplomacy",s2:"persuasion",d:50},
            win: {
              r: "A wedding instead of a war. Both houses grumble, then dance.",
              fx: (p,ctx)=>{for(const id of[ctx.h1id,ctx.h2id]){const h=A.S.houses[id];h&&(h.op=Math.min(100,(h.op||50)+8))}A.fame(p,2)},
            },
            lose: {
              r: "Both houses hate the judgment. At least they hate it equally.",
              fx: (p,ctx)=>{for(const id of[ctx.h1id,ctx.h2id]){const h=A.S.houses[id];h&&(h.op=Math.max(0,(h.op||50)-8))}},
            },
          },
          {
            t: "Let them fight it out",
            r: "You stay out. Twenty men die at the ford. The realm watches the crown do nothing.",
            fx: {stability:-4,legit:-2},
          },
        ],
      },
      {
        id: "pl_bankers",
        cond: (p,C)=>C.ruler(p)&&(A.realm(p.ruler)||{}).debt>0,
        w: 1,
        cool: 5,
        title: "The bankers come calling",
        text: p=>`Three bankers from ${A.pick(["Ostra","Lucerna","the Hold Bank of Stonehold","Kesh"])} in black velvet ask, politely, about your debt of ${A.fmt(A.realm(p.ruler).debt)}. They would like it rolled into a new loan — at a higher rate — or secured against your salt mines.`,
        choices: [
          {
            t: "Pay what you can now",
            req: p=>(A.realm(p.ruler)||{}).treasury>2e3,
            r: "You pay a fat installment. The bankers bow lower.",
            fx: p=>{const r=A.realm(p.ruler),amt=Math.min(r.debt,Math.round(r.treasury*.5));r.debt-=amt,r.treasury-=amt},
          },
          {
            t: "Negotiate the rate down",
            check: {s:"trade",s2:"persuasion",d:55},
            win: {
              r: "You talk them down a full point. Your treasurer weeps with joy.",
              fx: p=>{const r=A.realm(p.ruler);r.debt=Math.round(r.debt*.85)},
            },
            lose: {
              r: 'They hold firm and add a "fee for the conversation".',
              fx: p=>{const r=A.realm(p.ruler);r.debt=Math.round(r.debt*1.05)},
            },
          },
          {
            t: "Repudiate the debt",
            r: "You refuse to pay. Every bank in Ardan closes its doors to you, and your merchants suffer.",
            fx: p=>{const r=A.realm(p.ruler);r.debt=0,r.stability-=8,r.legit-=6,A.fame(p,-3);for(const k in r.pacts.trade)delete r.pacts.trade[k]},
          },
        ],
      },
      {
        id: "pl_famine_relief",
        cond: (p,C)=>C.ruler(p),
        w: .8,
        cool: 7,
        title: "A hungry spring",
        setup: (p,ctx)=>{ctx.place=A.pick(A.realmProvs(p.ruler)).name},
        text: "The rains failed in {place}. The granaries are empty by March and people are eating bark bread. The lords of the province say it is a matter for them. The people say it is a matter for the crown.",
        choices: [
          {
            t: "Open the royal granaries and buy grain abroad",
            req: p=>(A.realm(p.ruler)||{}).treasury>2e3,
            r: "Grain carts roll into {place}. Children live who would have died. They will not forget whose carts.",
            fx: {treasury:-2e3,stability:4,legit:4,fame:3},
          },
          {
            t: "Order the lords to feed their own people",
            check: {s:"intimidation",s2:"stewardship",d:45},
            win: {r:"The lords open their barns, grumbling. It works.",fx:{stability:2,houseOp:-3}},
            lose: {r:"The lords drag their feet. People die. The crown is blamed.",fx:{stability:-5,legit:-3}},
          },
          {
            t: "Do nothing: the market will sort it",
            r: "Grain prices triple. Merchants get rich. Graveyards get full.",
            fx: {stability:-6,legit:-4,treasury:600},
          },
        ],
      },
      {
        id: "pl_holy_man",
        cond: (p,C)=>C.ruler(p)&&hasNb(p),
        w: .7,
        cool: 8,
        title: "A preacher demands a holy war",
        setup: (p,ctx)=>pickNb(p,ctx,o=>(A.realm(o)||{}).faith!==A.realm(p.ruler).faith),
        text: (p,ctx)=>`A barefoot preacher has drawn ten thousand to the square of ${A.realm(p.ruler).capital}. He says the gods demand war on {other}, whose people ${(A.realm(ctx.rid)||{}).faith===A.realm(p.ruler).faith?"have grown corrupt in the faith":"worship falsely"}. The crowd looks at your balcony.`,
        choices: [
          {
            t: "Bless the cause and declare the holy war",
            r: "The square roars. Your armies march with priests at their head.",
            fx: {warOn:"holy",piety:5,stability:3},
          },
          {
            t: "Bless the preacher, not the war",
            check: {s:"persuasion",s2:"faith",d:50},
            win: {
              r: "You speak of the war in the heart. The crowd goes home calmer. Somehow.",
              fx: {piety:3,stability:2},
            },
            lose: {r:"The crowd hears a coward. Stones hit the palace gate.",fx:{stability:-4,legit:-2}},
          },
          {
            t: "Have the preacher quietly removed",
            check: {s:"intrigue",s2:"stealth",d:45},
            win: {r:'He "goes on pilgrimage". The crowd forgets in a week.',fx:{stability:1,piety:-3}},
            lose: {r:"Your men are seen. Now he is a martyr.",fx:{stability:-6,piety:-5}},
          },
        ],
      },
      {
        id: "pl_pretender_abroad",
        cond: (p,C)=>C.ruler(p)&&(A.realm(p.ruler)||{}).legit<70,
        w: .6,
        cool: 10,
        title: "A pretender abroad",
        setup: (p,ctx)=>anyRealm(p,ctx,r=>A.relBetween(p.ruler,r.id)<0),
        text: 'Word comes that a man calling himself your kinsman — a "true heir" — is living at the court of {otherName}. {otherRuler} feeds him, dresses him, and lets him write letters to your lords.',
        choices: [
          {
            t: "Demand {other} hand him over",
            check: {s:"diplomacy",s2:"intimidation",d:55},
            win: {
              r: "He is delivered in chains. The letters stop. Your legitimacy steadies.",
              fx: {legit:6,realmRel:-5},
            },
            lose: {r:"{other} refuses and parades him more openly.",fx:{legit:-3,realmRel:-12}},
          },
          {
            t: "Send assassins",
            check: {s:"intrigue",s2:"deception",d:55},
            win: {r:'He dies of "bad fish". Nobody believes it. Nobody can prove it.',fx:{legit:4,honor:-6}},
            lose: {
              r: "Your killers are caught. {other} has the trial of the decade.",
              fx: {realmRel:-30,legit:-6,honor:-8,infamy:5},
            },
          },
          {
            t: "Win the lords back yourself — a royal progress",
            r: "You ride from hall to hall. Faces are what lords trust, not letters.",
            fx: {legit:4,houseOp:5,treasury:-1e3},
          },
        ],
      },
      {
        id: "pl_marriage_offer",
        cond: (p,C)=>C.ruler(p)&&p.children.some(c=>A.P(c)&&A.P(c).alive&&!A.P(c).spouse&&A.isAdult(A.P(c))),
        w: 1,
        cool: 5,
        title: "A royal match is offered",
        setup: (p,ctx)=>{anyRealm(p,ctx,r=>A.relBetween(p.ruler,r.id)>-10);const k=p.children.map(A.P).find(c=>c&&c.alive&&!c.spouse&&A.isAdult(c));ctx.pid=k.id},
        text: "{otherRuler} proposes a match: {them}, your {themAge}-year-old, to a prince or princess of {otherName}. The dowry is generous. {them} has opinions about it.",
        choices: [
          {
            t: "Accept the match",
            r: "A great wedding. Two crowns bound by blood.",
            fx: (p,ctx)=>{const k=A.P(ctx.pid),t=A.realm(ctx.rid),r=A.realm(p.ruler);if(!k||!t||!r)return;const sp=A.genNoble(t.id,"royal",t.house,A.age(k)+A.ri(-3,3),k.sex==="M"?"F":"M");return A.marry(k,sp),A.polInit(r),A.polInit(t),r.marriages[t.id]=A.S.year,t.marriages[r.id]=A.S.year,A.addRel(r.id,t.id,25),r.treasury+=1500,A.news(`A royal marriage binds ${r.short} and ${t.short}.`,"crown"),`${k.given} marries ${A.fullName(sp)}.`},
          },
          {
            t: "Let {them} decide",
            r: "{them} hugs you, then refuses the match. {other} is offended; your child adores you.",
            fx: {them:{op:25},realmRel:-8},
          },
          {
            t: "Refuse — this blood is worth more",
            r: "You hold out for a better offer. Maybe it will come.",
            fx: {realmRel:-6},
          },
        ],
      },
      {
        id: "pl_trade_smugglers",
        cond: (p,C)=>C.ruler(p)&&C.pact(p),
        w: .8,
        cool: 6,
        title: "Smugglers under a friendly flag",
        setup: (p,ctx)=>{const r=A.realm(p.ruler),ks=Object.keys(r.pacts.trade).filter(k=>r.pacts.trade[k]>A.S.year&&A.realm(k));ks.length?ctx.rid=A.pick(ks):pickNb(p,ctx)},
        text: "Since the trade pact with {other}, your customs men report that half the cargoes under its flag carry far more than the ledgers say. Your own merchants are being undersold. The guilds want the pact torn up.",
        choices: [
          {
            t: "Tighten inspections, keep the pact",
            check: {s:"stewardship",s2:"trade",d:45},
            win: {r:"The fraud stops. The customs money doubles.",fx:{treasury:1200,skill:{stewardship:2}}},
            lose: {r:"The inspectors are bribed within a month.",fx:{treasury:-200}},
          },
          {
            t: "Raise it with {otherRuler}",
            r: "{otherRuler} promises to hang a few smugglers. A few are hanged.",
            fx: {realmRel:4,stability:1},
          },
          {
            t: "Tear up the pact to please the guilds",
            r: "Your merchants cheer. {other}'s do not.",
            fx: (p,ctx)=>{const r=A.realm(p.ruler),t=A.realm(ctx.rid);r&&r.pacts&&delete r.pacts.trade[ctx.rid],t&&t.pacts&&delete t.pacts.trade[r.id],A.addRel(r.id,ctx.rid,-15),r.stability+=2,A.updateRealmPops()},
          },
        ],
      },
      {
        id: "pl_hostage",
        cond: (p,C)=>C.ruler(p)&&A.atWar(p.ruler).length>0,
        w: .8,
        cool: 6,
        title: "A noble hostage",
        setup: (p,ctx)=>{const w=A.atWar(p.ruler)[0],side=A.warSide(w,p.ruler);ctx.rid=side==="att"?w.leadD:w.leadA},
        text: p=>`Your men have captured ${A.pick(["a nephew","a niece","a cousin","the favorite bastard"])} of {otherRuler} at a river crossing. The child of a crown is worth a fortune, or a peace, or a lever.`,
        choices: [
          {
            t: "Ransom for gold",
            r: "A fortune in silver crosses the lines. War is expensive; this helps.",
            fx: {treasury:3500},
          },
          {
            t: "Trade the hostage for peace terms",
            r: "You send the hostage home with your terms pinned to the cloak.",
            fx: (p,ctx)=>{const w=A.atWar(p.ruler).find(x=>x.att.includes(ctx.rid)||x.def.includes(ctx.rid));if(w){const side=A.warSide(w,p.ruler);w.score+=side==="att"?12:-12}A.addRel(p.ruler,ctx.rid,10)},
          },
          {
            t: "Raise the hostage at your court as your ward",
            r: "Kindness now, influence later. A whole generation from now, a friend on the throne of {other}.",
            fx: {realmRel:8,honor:3,claim:!0},
          },
        ],
      },
      {
        id: "pl_peace_feelers",
        cond: (p,C)=>C.ruler(p)&&A.atWar(p.ruler).length>0,
        w: .9,
        cool: 3,
        title: "Feelers for peace",
        setup: (p,ctx)=>{const w=A.atWar(p.ruler)[0],side=A.warSide(w,p.ruler);ctx.rid=side==="att"?w.leadD:w.leadA,ctx.war=w.name,ctx.wid=w.id},
        text: "A monk walks across the lines under a white branch. {otherRuler} is tired of {war}. If you are too, there could be a white peace — no land, no tribute, everyone goes home.",
        choices: [
          {
            t: "Accept the white peace",
            r: "The war ends. Nobody wins. Everybody lives.",
            fx: (p,ctx)=>{const w=A.S.wars.find(x=>x.id===ctx.wid);w&&A.settleWar(w,"white")},
          },
          {
            t: "Demand better terms",
            check: {s:"diplomacy",s2:"intimidation",d:55},
            win: {
              r: "They bend. The peace leaves you a province richer.",
              fx: (p,ctx)=>{const w=A.S.wars.find(x=>x.id===ctx.wid);if(w){const side=A.warSide(w,p.ruler);w.score=side==="att"?Math.max(w.score,85):Math.min(w.score,-85),A.settleWar(w,side)}},
            },
            lose: {r:"The monk walks back across the lines. The war goes on.",fx:{stability:-1}},
          },
          {t:"Send the monk back with no answer",r:"Silence is an answer. The war goes on.",fx:{legit:1}},
        ],
      },
      {
        id: "pl_vassal_tax_revolt",
        cond: (p,C)=>C.ruler(p)&&((A.realm(p.ruler)||{}).laws||{}).tax>=1.2,
        w: 1,
        cool: 5,
        title: "The tax revolt",
        setup: (p,ctx)=>{ctx.place=A.pick(A.realmProvs(p.ruler)).name},
        text: "In {place} the people have beaten your tax-farmers and barricaded the market. Their leader, a blacksmith, says they will pay the old rate and not a copper more.",
        choices: [
          {
            t: "Send soldiers to break the barricades",
            r: "The barricades fall. So do people. The taxes come in. Something else goes out.",
            fx: {stability:-4,legit:-2,treasury:800,infamy:1},
          },
          {
            t: "Meet the blacksmith and lower the rate there",
            check: {s:"persuasion",s2:"diplomacy",d:40},
            win: {
              r: "You and the blacksmith shake on it in the market. The crowd cheers your name.",
              fx: {stability:3,fame:2,treasury:-400},
            },
            lose: {r:"He thinks you are weak. Other towns hear about it.",fx:{stability:-2,treasury:-400}},
          },
          {
            t: "Lower taxes across the realm",
            r: "The whole realm breathes. Your treasurer does not.",
            fx: p=>{const r=A.realm(p.ruler);r.laws.tax=1,r.stability=Math.min(100,r.stability+5),A.updateRealmPops()},
          },
        ],
      },
    ]);
    const lordly = (p,C)=>C.adult(p)&&!C.ruler(p)&&(C.noble(p)||["gentry","noble","royal"].includes(p.status)||!!p.noble||C.job(p,"courtier")||C.office(p));
    A.defEvents([
      {
        id: "pl_faction_courted",
        cond: (p,C)=>lordly(p,C)&&C.realmFaction(p)&&!C.faction(p),
        w: 1.1,
        cool: 4,
        title: "A faction comes calling",
        setup: (p,ctx)=>pickFac(p,ctx),
        text: (p,ctx)=>`A rider from {factionLeader} finds you at supper. The {faction} would welcome you. "Your voice, your sword, your name. In return, when we win, you will not be forgotten." They hold about ${facPow(ctx)}% of the realm's swords.`,
        choices: [
          {
            t: "Join them",
            r: "You put your seal beside theirs. The crown will notice.",
            fx: (p,ctx)=>{const f=(A.S.factions||[]).find(x=>x.id===ctx.fid);return f&&A.canJoinFaction(p,f)[0]?(A.joinFaction(f.id),""):"In the end they decide you are too small to matter. Fine."},
          },
          {
            t: "Refuse politely and tell no one",
            r: "You keep your head down. Both sides think you are on theirs. For now.",
            fx: {skill:{diplomacy:1}},
          },
          {
            t: "Report them to the crown",
            check: {s:"intrigue",s2:"deception",d:45},
            win: {
              r: "The crown thanks you in private. The faction never learns who talked.",
              fx: {favor:15,factionDisc:-10},
            },
            lose: {
              r: "The crown thanks you. The faction learns who talked. You will need guards.",
              fx: {favor:15,newRel:{type:"enemy",op:-50}},
            },
          },
        ],
      },
      {
        id: "pl_faction_meeting",
        cond: (p,C)=>C.adult(p)&&C.faction(p),
        w: 1.2,
        cool: 3,
        title: "The secret meeting",
        setup: (p,ctx)=>{ctx.fid=p.faction},
        text: p=>`The {faction} meets in ${A.pick(["a hunting lodge","a monastery crypt","the back room of an inn","a barge on the river"])}. {factionLeader} wants a vote: press the crown now, or wait for a better moment.`,
        choices: [
          {
            t: "Argue to press now",
            check: {s:"persuasion",s2:"wil",d:45},
            win: {
              r: "The room agrees with you. Letters go out at dawn. The crown will hear the demand within the month.",
              fx: {factionDisc:25,fame:2},
            },
            lose: {r:"They think you reckless. The vote goes the other way.",fx:{factionDisc:5}},
          },
          {
            t: "Argue to wait and gather strength",
            check: {s:"diplomacy",s2:"int",d:40},
            win: {
              r: "Patience wins the vote. Two more lords join over the winter.",
              fx: {factionDisc:-5,skill:{diplomacy:2}},
            },
            lose: {r:"They call you timid. You lose standing.",fx:{fame:-1}},
          },
          {
            t: "Listen, and quietly memorize every name",
            r: "Knowledge is a kind of armor. Or a kind of currency.",
            fx: {skill:{intrigue:3},flag:"pl_faction_names"},
          },
        ],
      },
      {
        id: "pl_faction_betray",
        cond: (p,C)=>C.adult(p)&&C.faction(p)&&C.flag(p,"pl_faction_names"),
        w: .8,
        once: !0,
        title: "A price for names",
        setup: (p,ctx)=>{ctx.fid=p.faction},
        text: p=>'A royal official meets you "by chance" in the cathedral. The crown knows the {faction} exists. It does not yet know who is in it. "A list," he says. "And your own name stays off it. Also: a barony."',
        choices: [
          {
            t: "Give the list",
            r: "Arrests at dawn. Your name is not on the list. Your conscience is.",
            fx: (p,ctx)=>{const f=(A.S.factions||[]).find(x=>x.id===ctx.fid);return f&&(A.S.factions=A.S.factions.filter(x=>x!==f)),p.faction=null,(!p.noble||p.noble.rung<4)&&(p.noble={rung:4,realm:p.realm,holding:(A.pick(A.realmProvs(p.realm))||A.prov(p.home)).id}),p.honor=Math.max(0,p.honor-15),A.fame(p,3),"You are a baron now."},
          },
          {
            t: "Refuse — and warn the faction",
            r: "You walk out. That night, the faction scatters before the guards come.",
            fx: {honor:5,factionDisc:10,favor:-15},
          },
          {t:"Refuse, and say nothing to anyone",r:"You keep both secrets. Heavy things to carry.",fx:{wil:1}},
        ],
      },
      {
        id: "pl_liege_summons",
        cond: (p,C)=>lordly(p,C)&&C.atWar(p),
        w: 1,
        cool: 4,
        title: "The liege's writ",
        text: p=>`A writ under the royal seal: every lord and knight of ${A.realm(p.realm).short} must bring their men to the muster at ${A.realm(p.realm).capital} by the feast of ${A.pick(["spring","midsummer","first harvest"])}. The writ lists how many men your house owes. It is more than last time.`,
        choices: [
          {
            t: "Answer with every man you owe, and more",
            r: "You ride in at the head of a full company. The marshal writes your name down.",
            fx: {favor:12,coin:-60,fame:3,honor:3},
          },
          {t:"Bring exactly what you owe",r:"No more, no less. Nobody can fault you.",fx:{favor:2,coin:-30}},
          {
            t: "Pay shield-money instead of coming",
            r: "You send coin instead of yourself. The crown takes it and notes it.",
            fx: {coin:-120,favor:-6},
          },
        ],
      },
      {
        id: "pl_land_dispute",
        cond: (p,C)=>lordly(p,C)&&(!!p.noble||C.family(p)),
        w: 1,
        cool: 6,
        title: "A boundary stone moved",
        setup: (p,ctx)=>{const hs=A.realmHouses(p.realm).filter(h=>h.id!==p.house);ctx.house=hs.length?A.pick(hs).name:"a neighboring house"},
        text: "Someone moved the old boundary stone between your land and that of {house} — forty paces, onto your best meadow. Their steward swears it was always there. Your shepherds swear it was not.",
        choices: [
          {
            t: "Take it to the royal court",
            check: {s:"learning",s2:"persuasion",d:45},
            win: {
              r: "An old charter proves your line. The stone goes back, and they pay costs.",
              fx: {coin:60,fame:1,skill:{learning:2}},
            },
            lose: {r:"The judge rules for them. The meadow is lost.",fx:{coin:-40,happy:-3}},
          },
          {
            t: "Move it back yourself, at night, with ten men",
            check: {s:"stealth",s2:"command",d:40},
            win: {
              r: "In the morning the stone is back. Nobody saw anything. Nobody can prove anything.",
              fx: {skill:{stealth:2}},
            },
            lose: {r:"You are seen. Now it is a feud.",fx:{newRel:{type:"enemy",op:-40},honor:-2}},
          },
          {
            t: "Meet their lord and settle it over wine",
            check: {s:"diplomacy",s2:"etiquette",d:40},
            win: {r:"You split the meadow and drink to it. Neighbors again.",fx:{newRel:{type:"friend",op:30}}},
            lose: {r:"The wine runs out before the patience does.",fx:{happy:-2}},
          },
        ],
      },
      {
        id: "pl_council_work_spy",
        cond: (p,C)=>C.adult(p)&&C.office(p,"spymaster"),
        w: 1.2,
        cool: 3,
        title: "The spymaster's desk",
        setup: (p,ctx)=>anyRealm(p,ctx,r=>A.neighbors(p.realm).includes(r.id)),
        text: "Your best agent in {otherName} sends word: {otherRuler}'s chancellor is for sale. The price is high, and the agent might be lying to pocket the money.",
        choices: [
          {
            t: "Pay the price",
            req: p=>p.coin>=150,
            check: {s:"intrigue",s2:"int",d:50},
            win: {
              r: "The chancellor is real and talks. The crown learns {other}'s plans a year ahead.",
              fx: {coin:-150,favor:15,skill:{intrigue:3},fame:2},
            },
            lose: {r:"The agent vanishes with the money. Lesson learned.",fx:{coin:-150,wil:1}},
          },
          {
            t: "Test the agent first with a small payment",
            check: {s:"intrigue",s2:"deception",d:40},
            win: {r:"The test proves the agent honest. Slower, but safe.",fx:{coin:-30,favor:6,skill:{intrigue:2}}},
            lose: {r:"The agent senses the test and goes quiet.",fx:{coin:-30}},
          },
          {t:"Burn the agent — too risky",r:"You cut the thread. Safe and blind.",fx:{favor:-3}},
        ],
      },
      {
        id: "pl_council_work_chancellor",
        cond: (p,C)=>C.adult(p)&&C.office(p,"chancellor"),
        w: 1.2,
        cool: 3,
        title: "The chancellor's table",
        setup: (p,ctx)=>anyRealm(p,ctx),
        text: "You draft a treaty with {otherName}. Every clause is a fight. Their envoy wants the fishing rights; your king wants the toll on the river; both want to look like they won.",
        choices: [
          {
            t: "Give up the fishing to win the tolls",
            check: {s:"diplomacy",s2:"trade",d:45},
            win: {
              r: "A treaty both sides can sell at home. Your king is delighted.",
              fx: {favor:12,skill:{diplomacy:3},fame:2},
            },
            lose: {r:"They take the fishing and still balk at the tolls.",fx:{favor:-5}},
          },
          {
            t: "Find a clever clause that gives both what they want",
            check: {s:"learning",s2:"int",d:55},
            win: {r:"A clause for the ages. Law students will study it.",fx:{favor:18,fame:4,int:.5}},
            lose: {r:"Too clever. Both sides smell a trick.",fx:{favor:-3}},
          },
          {
            t: "Stall until their envoy's patience breaks",
            r: "In the end he signs to go home. A small win, ungracefully gotten.",
            fx: {favor:4},
          },
        ],
      },
      {
        id: "pl_council_work_marshal",
        cond: (p,C)=>C.adult(p)&&C.office(p,"marshal"),
        w: 1.2,
        cool: 3,
        title: "The marshal's rolls",
        text: "The muster rolls are a lie. Half the lords report men who are dead, old or imaginary, and pocket the pay. Fixing it means making enemies of men with castles.",
        choices: [
          {
            t: "Count every company in person",
            check: {s:"command",s2:"logistics",d:50},
            win: {
              r: "You find three thousand ghosts. The army is smaller on paper and stronger in fact.",
              fx: {favor:15,skill:{logistics:3},houseOp:-3},
            },
            lose: {r:"The lords hide their tricks better than you find them.",fx:{favor:-2}},
          },
          {
            t: "Hang one lord's paymaster as an example",
            r: "The rolls get honest very fast. The lords hate you very fast.",
            fx: {favor:8,houseOp:-6,newRel:{type:"enemy",op:-45}},
          },
          {t:"Leave it — every army in Ardan is like this",r:"Quiet life. Hollow army.",fx:{favor:-4}},
        ],
      },
      {
        id: "pl_council_work_treasurer",
        cond: (p,C)=>C.adult(p)&&C.office(p,"treasurer"),
        w: 1.2,
        cool: 3,
        title: "The treasurer's ledgers",
        text: p=>`The ledgers do not balance by ${A.fmt(A.ri(3,12)*1e3)} suns. Your predecessor left in a hurry. The royal mint's master looks very nervous whenever you walk past.`,
        choices: [
          {
            t: "Follow the money",
            check: {s:"stewardship",s2:"learning",d:50},
            win: {
              r: "The mint master has been shaving the coins. The crown gets its silver back; you get its gratitude.",
              fx: {favor:15,treasury:2e3,skill:{stewardship:3}},
            },
            lose: {r:"The trail goes cold. The hole stays.",fx:{favor:-4}},
          },
          {
            t: "Quietly cover the hole from new taxes",
            r: "Nobody will know. Everyone will pay.",
            fx: {favor:3,stability:-1},
          },
          {
            t: "Tell the crown the truth: the hole is real",
            r: "Honesty is not always rewarded at court. This time it is, a little.",
            fx: {favor:5,honor:3},
          },
        ],
      },
      {
        id: "pl_envoy_abroad",
        cond: (p,C)=>lordly(p,C)&&(C.prof(p,"diplomacy",25)||C.job(p,"envoy")||C.office(p)),
        w: .9,
        cool: 6,
        title: "An embassy abroad",
        setup: (p,ctx)=>anyRealm(p,ctx),
        text: p=>`The crown sends you to {otherName} with a letter and a retinue of ${A.ri(12,40)}. Your task: keep {otherRuler} friendly. Their court is ${A.pick(["a maze of smiles","cold and formal","drunk every night","ruled by a favorite nobody likes"])}.`,
        choices: [
          {
            t: "Charm the court",
            check: {s:"etiquette",s2:"diplomacy",d:45},
            win: {
              r: "You leave with gifts, friends, and warmer relations for your crown.",
              fx: (p,ctx)=>{A.addRel(p.realm,ctx.rid,10),A.fame(p,3),A.trainSkill(p,"diplomacy",3),A.markSeen(p,ctx.rid);const r=A.realm(p.realm),ru=r&&A.P(r.ruler);ru&&p.rel[ru.id]&&A.addOp(ru,p,10)},
            },
            lose: {
              r: "A misstep at the first feast. You spend the rest of the visit apologizing.",
              fx: (p,ctx)=>{A.addRel(p.realm,ctx.rid,-5),A.markSeen(p,ctx.rid)},
            },
          },
          {
            t: "Spy while you are there",
            check: {s:"intrigue",s2:"etiquette",d:50},
            win: {
              r: "You come home with smiles AND secrets.",
              fx: (p,ctx)=>{A.markSeen(p,ctx.rid),A.trainSkill(p,"intrigue",3),A.fame(p,1);const r=A.realm(p.realm),ru=r&&A.P(r.ruler);ru&&p.rel[ru.id]&&A.addOp(ru,p,14)},
            },
            lose: {
              r: "Caught with a letter that is not yours. Expelled.",
              fx: (p,ctx)=>{A.addRel(p.realm,ctx.rid,-15),A.markSeen(p,ctx.rid),A.fame(p,-2)},
            },
          },
          {t:"Beg off — send a deputy",r:"Someone else goes. Someone else gets the credit.",fx:{favor:-4}},
        ],
      },
      {
        id: "pl_royal_wedding_guest",
        cond: (p,C)=>lordly(p,C),
        w: .8,
        cool: 8,
        title: "A royal wedding",
        text: p=>`${A.realm(p.realm).capital} is hung with banners for a royal wedding. Every great house is here. Every great house is watching every other great house.`,
        choices: [
          {
            t: "Shine at the feast",
            check: {s:"etiquette",s2:"music",d:40},
            win: {
              r: "You dance with the right people and toast at the right moment. Invitations follow.",
              fx: {fame:3,favor:6,newRel:{type:"friend",op:30}},
            },
            lose: {r:"You spill wine on a duchess. The story outlives the wedding.",fx:{fame:-1,happy:-3}},
          },
          {
            t: "Use the crowd to make a marriage deal of your own",
            check: {s:"persuasion",s2:"diplomacy",d:45},
            win: {r:"A betrothal is arranged for your house — or for you.",fx:{lover:!0,fame:1}},
            lose: {r:"Nobody bites. Weddings make people think of their own.",fx:{happy:-1}},
          },
          {
            t: "Enter the wedding tourney",
            req: (p,C)=>!C.old(p),
            r: "You ride into the lists.",
            fx: {
              duel: {
                tier: 3,
                title: "a tourney knight",
                opts: {kind:"duel",place:"the wedding lists",lethal:!1,toYield:!0,title:"The wedding tourney"},
              },
            },
          },
        ],
      },
      {
        id: "pl_house_feud_sides",
        cond: (p,C)=>lordly(p,C)&&A.realmHouses(p.realm).length>=2,
        w: .9,
        cool: 6,
        title: "Take a side",
        setup: (p,ctx)=>{const hs=A.shuffle(A.realmHouses(p.realm)).slice(0,2);ctx.h1=hs[0].name,ctx.h2=hs[1].name},
        text: "{h1} and {h2} are at daggers drawn. Both have sent you gifts this month. Both expect your sword when the swords come out.",
        choices: [
          {
            t: "Side with {h1}",
            r: "You send back {h2}'s gift. A friend won, an enemy made.",
            fx: {newRel:{type:"enemy",op:-30},fame:1},
          },
          {
            t: "Side with {h2}",
            r: "You send back {h1}'s gift. A friend won, an enemy made.",
            fx: {newRel:{type:"enemy",op:-30},fame:1},
          },
          {
            t: "Keep both gifts and both friendships",
            check: {s:"deception",s2:"diplomacy",d:50},
            win: {r:"You walk the rope all year without falling. Impressive.",fx:{coin:60,skill:{diplomacy:2}}},
            lose: {r:"They compare notes. Now both distrust you.",fx:{fame:-2,honor:-3}},
          },
          {
            t: "Try to make peace between them",
            check: {s:"diplomacy",s2:"wil",d:55},
            win: {r:"It takes a winter of letters. It works. Both houses owe you.",fx:{fame:4,honor:3}},
            lose: {r:"They unite only in hating the busybody.",fx:{fame:-1}},
          },
        ],
      },
      {
        id: "pl_claimant_plot",
        cond: (p,C)=>lordly(p,C)&&(C.faction(p,"claimant")||C.realmFaction(p,"claimant")&&!C.faction(p)),
        w: 1,
        cool: 6,
        title: "For the true heir",
        setup: (p,ctx)=>pickFac(p,ctx,"claimant"),
        text: "In a cellar, by one candle, {factionLeader} shows you a ring and a parchment: proof, they say, that the true heir lives and the crown sits on the wrong head. They need one more great name to move.",
        choices: [
          {
            t: "Swear to the cause",
            r: "You kiss the ring. There is no going back.",
            fx: (p,ctx)=>{const f=(A.S.factions||[]).find(x=>x.id===ctx.fid);f&&!p.faction&&A.canJoinFaction(p,f)[0]&&A.joinFaction(f.id),f&&(f.discontent=Math.min(100,(f.discontent||0)+20))},
          },
          {
            t: "Ask to see better proof",
            check: {s:"learning",s2:"int",d:50},
            win: {
              r: "The parchment is a fake — a good one. You say so. They say nothing.",
              fx: {int:.5,factionDisc:-10},
            },
            lose: {r:"It looks real enough to you.",fx:{factionDisc:5}},
          },
          {
            t: "Leave, and forget the cellar",
            r: "You walk out into the rain. Some doors are better left closed.",
            fx: {wil:.5},
          },
        ],
      },
      {
        id: "pl_honor_at_court",
        cond: (p,C)=>lordly(p,C)&&C.family(p),
        w: .9,
        cool: 6,
        title: "Your house insulted",
        text: p=>`At court a lord says, loudly, that ${A.family(p)?A.family(p).name:"your family"} ${A.pick(["bought its title","ran at the last battle","breeds horses better than sons","has more debts than ancestors"])}. The room goes quiet and turns to you.`,
        choices: [
          {
            t: "Challenge him",
            r: "Steel at dawn, in the yard behind the chapel.",
            fx: {
              duel: {
                tier: 3,
                title: "the loud-mouthed lord",
                opts: {kind:"duel",place:"the yard behind the chapel",lethal:!1,toYield:!0,title:"A point of honor"},
              },
            },
          },
          {
            t: "Answer with wit",
            check: {s:"persuasion",s2:"int",d:45},
            win: {r:"Your answer gets the laugh. He leaves early.",fx:{fame:2,honor:2}},
            lose: {r:"Your answer gets a polite cough. He wins the room.",fx:{fame:-1,honor:-1}},
          },
          {
            t: "Ignore him — he is beneath notice",
            r: "Some admire the restraint. Some call it weakness.",
            fx: {wil:.5,honor:-1},
          },
        ],
      },
    ]);
    const common=(p,C)=>C.adult(p)&&!C.ruler(p);
    A.defEvents([
      {
        id: "pl_tribute_collectors",
        cond: (p,C)=>common(p,C)&&C.tributary(p),
        w: 1.1,
        cool: 4,
        title: "The tribute carts",
        text: p=>`Carts with the colors of ${A.realmShort(A.realm(p.realm).overlord)} roll through ${A.provName(p.home)}, collecting the tribute. A share of every barn, every purse. The collectors are not local and not gentle.`,
        choices: [
          {
            t: "Pay and keep your head down",
            r: "You pay. Everyone pays. The carts roll on.",
            fx: {coinPct:-.08,happy:-2},
          },
          {
            t: "Hide your best goods",
            check: {s:"stealth",s2:"deception",d:40},
            win: {
              r: "They take the second-best. A small victory under a big boot.",
              fx: {coinPct:-.03,skill:{stealth:2}},
            },
            lose: {r:"They find the hidden stash and fine you double.",fx:{coinPct:-.16,happy:-4}},
          },
          {
            t: "Shout at the collectors in the square",
            check: {s:"intimidation",s2:"str",d:50},
            win: {
              r: "The crowd backs you. The collectors take less and leave fast. People buy you drinks.",
              fx: {fame:2,honor:2},
            },
            lose: {
              r: "They beat you in front of everyone.",
              fx: {health:-12,cause:"a beating by tribute collectors",wil:1},
            },
          },
        ],
      },
      {
        id: "pl_foreign_merchants",
        cond: (p,C)=>common(p,C)&&C.pact(p)&&C.town(p),
        w: 1,
        cool: 4,
        title: "Strangers in the market",
        setup: (p,ctx)=>{const r=A.realm(p.realm),ks=Object.keys((r.pacts||{}).trade||{}).filter(k=>r.pacts.trade[k]>A.S.year&&A.realm(k));ctx.rid=ks.length?A.pick(ks):A.pick(Object.keys(A.S.realms).filter(k=>A.S.realms[k].alive))},
        text: p=>`Since the trade pact, merchants from {other} crowd the market of ${A.provName(p.home)} with ${A.pick(["cheap cloth","spices","dried fish","good steel","wine"])}. Some locals are getting rich. Others are getting undersold.`,
        choices: [
          {
            t: "Partner with a foreign merchant",
            check: {s:"trade",s2:"persuasion",d:40},
            win: {
              r: "Your partner has goods; you know the town. You both get fat.",
              fx: {coin:80,skill:{trade:3},newRel:{type:"friend",op:25}},
            },
            lose: {r:"Your partner vanishes with the goods and your share.",fx:{coin:-40}},
          },
          {
            t: "Learn their language and work as a go-between",
            check: {s:"int",s2:"persuasion",d:40},
            win: {
              r: "Translators are paid by both sides. You learn fast.",
              fx: (p,ctx)=>{const lang=GD.LANG_LIST&&GD.LANG_LIST.length?A.pick(GD.LANG_LIST):null;return lang&&!p.langs.includes(lang)&&p.langs.push(lang),p.coin+=30,lang?`(You learn ${lang}.)`:""},
            },
            lose: {r:"You mangle the words. Nobody hires you twice.",fx:{happy:-2}},
          },
          {
            t: "Join the locals who want them gone",
            r: "Shouting, broken stalls, a fine from the watch. The foreign stalls are back next week.",
            fx: {coin:-10,fame:1,happy:1},
          },
        ],
      },
      {
        id: "pl_allied_army_town",
        cond: (p,C)=>common(p,C)&&C.allies(p)>0&&C.atWar(p),
        w: 1,
        cool: 4,
        title: "Allies in town",
        setup: (p,ctx)=>{const r=A.realm(p.realm);ctx.rid=A.pick(r.allies.filter(x=>A.realm(x)&&A.realm(x).alive))||null,ctx.rid||anyRealm(p,ctx)},
        text: p=>`An allied army from {other} camps outside ${A.provName(p.home)} on its way to the front. ${A.pick(["Their soldiers pay for everything — in their own coin, which nobody can spend.","Their soldiers sing at night in a language nobody here speaks.","Their quartermaster wants to buy every cart in town."])}`,
        choices: [
          {
            t: "Sell them supplies at war prices",
            check: {s:"trade",s2:"persuasion",d:35},
            win: {r:"A good week. A very good week.",fx:{coin:70,skill:{trade:2}}},
            lose: {r:"They pay with a promissory note from their king. Good luck.",fx:{coin:-15}},
          },
          {
            t: "Share a fire with their soldiers",
            r: "Different songs, same fears. You make a friend you will probably never see again.",
            fx: {newRel:{type:"friend",op:35},happy:3},
          },
          {
            t: "Lock up your daughters and your chickens",
            r: "Nothing happens. Maybe because you locked them up.",
            fx: {wil:.3},
          },
        ],
      },
      {
        id: "pl_coalition_rumor",
        cond: (p,C)=>common(p,C)&&C.coalition(p),
        w: 1.1,
        cool: 3,
        title: "Everyone against us",
        text: p=>`In the taverns of ${A.provName(p.home)} they say the neighbors have formed a league against ${A.realm(p.realm).short}. Prices for salt and iron are climbing. Families are burying silver in the garden.`,
        choices: [
          {
            t: "Buy salt and iron now, before prices climb more",
            req: p=>p.coin>=30,
            r: "You stock up. If the war comes, you are ready; if not, you have a lot of salt.",
            fx: {coin:-30,happy:2,flag:"pl_hoard"},
          },
          {
            t: "Volunteer for the militia early",
            r: "Better a volunteer than a conscript. You get the good spear.",
            fx: {skill:{spear:3},fame:1,sta:.5},
          },
          {
            t: "Spread calm: the crown knows what it is doing",
            check: {s:"persuasion",s2:"wil",d:40},
            win: {r:"People listen to you. The panic in your street eases.",fx:{fame:1,honor:1}},
            lose: {r:"Someone calls you a crown lackey. Others agree.",fx:{happy:-2}},
          },
        ],
      },
      {
        id: "pl_revolt_village",
        cond: (p,C)=>common(p,C)&&A.S.wars.some(w=>w.cb==="liberty"&&(w.att.includes(p.realm)||w.def.includes(p.realm))),
        w: 1.1,
        cool: 3,
        title: "The lords' revolt",
        text: p=>`Banners of the rebel lords ride through ${A.provName(p.home)}. Their captain reads a proclamation: the crown is a tyrant, the lords are your true protectors, and they need horses, grain and young men.`,
        choices: [
          {
            t: "Join the rebels",
            r: "You take a spear and a rebel badge. History will decide what you were.",
            fx: {skill:{spear:2},fame:2,flag:"pl_rebel",favor:-15},
          },
          {
            t: "Hide the horses and the young men",
            check: {s:"stealth",s2:"int",d:40},
            win: {r:"The rebels find nothing worth taking. The village thanks you.",fx:{fame:1,honor:1}},
            lose: {r:"They find the hidden horses and take yours too.",fx:{coinPct:-.1}},
          },
          {
            t: "Ride to warn the royal garrison",
            check: {s:"riding",s2:"stealth",d:45},
            win: {
              r: "The garrison catches the rebels at the bridge. The crown remembers your name.",
              fx: {favor:15,fame:2},
            },
            lose: {r:"Rebel scouts catch you on the road.",fx:{health:-15,cause:"rebel scouts",wil:1}},
          },
        ],
      },
      {
        id: "pl_wedding_procession",
        cond: (p,C)=>common(p,C)&&C.town(p)&&Object.values((A.realm(p.realm)||{}).marriages||{}).some(y=>A.S.year-y<=1),
        w: 1.2,
        once: !0,
        title: "The royal procession",
        text: p=>`A royal wedding procession passes through ${A.provName(p.home)}: gilded wagons, knights in silk, a bride or groom from a foreign crown waving from a litter. The fountains run with wine for a day.`,
        choices: [
          {
            t: "Push to the front to see",
            r: "You get close enough to catch a flower thrown from the litter. You will keep it forever.",
            fx: {happy:6},
          },
          {
            t: "Sell food and drink to the crowd",
            check: {s:"trade",s2:"sta",d:30},
            win: {r:"You sell out by noon.",fx:{coin:25}},
            lose: {r:"A bigger cart sets up next to yours.",fx:{coin:3}},
          },
          {
            t: "Work the crowd's purses",
            req: (p,C)=>C.prof(p,"stealth",25)||C.job(p,"thief"),
            check: {s:"stealth",s2:"spd",d:40},
            win: {r:"Fat purses, happy people, nobody notices.",fx:{coin:45,skill:{stealth:2}}},
            lose: {r:"A guard catches your wrist.",fx:{punish:"theft"}},
          },
        ],
      },
      {
        id: "pl_herald_treaty",
        cond: (p,C)=>common(p,C)&&(C.pact(p)||C.allies(p)>0),
        w: .8,
        cool: 6,
        title: "The herald in the square",
        text: p=>`A herald in ${A.realm(p.realm).short}'s colors stands on the well and reads a treaty: names of kings, lists of rivers, promises of eternal friendship. Most of the crowd only wants to know if taxes go up.`,
        choices: [
          {
            t: "Ask the herald loudly about taxes",
            check: {s:"persuasion",s2:"wil",d:35},
            win: {r:"The herald laughs and says no. The crowd cheers you as if you won it.",fx:{fame:1,happy:2}},
            lose: {r:"The herald ignores you. The crowd laughs at you instead.",fx:{happy:-1}},
          },
          {
            t: "Listen carefully to every clause",
            r: "Rivers, tolls, ports. You understand a little more how the world works.",
            fx: {skill:{learning:1,trade:1},int:.3},
          },
          {t:"Go back to work",r:"Kings sign treaties. Bread still needs baking.",fx:{coin:3}},
        ],
      },
      {
        id: "pl_allied_camp",
        cond: (p,C)=>C.soldier(p)&&C.allies(p)>0&&C.atWar(p),
        w: 1.1,
        cool: 3,
        title: "Allies in the camp",
        setup: (p,ctx)=>{const r=A.realm(p.mil&&p.mil.realm||p.realm);ctx.rid=r&&A.pick(r.allies.filter(x=>A.realm(x)&&A.realm(x).alive))||null,ctx.rid||anyRealm(p,ctx),ctx.pid=A.makeAcquaintance(p,"comrade").id},
        text: "A company from {other} joins your camp. Their captain, {them}, has opinions about how your army does everything: cooking, marching, fighting, praying. Your men are getting angry.",
        choices: [
          {
            t: "Challenge {them} to a friendly bout",
            r: "Wooden swords, both camps watching.",
            fx: {
              duel: {
                foe: "them",
                tier: 2,
                opts: {kind:"brawl",place:"the camp yard",lethal:!1,toYield:!0,title:"Allies at blows"},
              },
            },
          },
          {
            t: "Learn their tricks",
            check: {s:"int",s2:"tactics",d:40},
            win: {
              r: "Their way of digging in is better. You steal it. Your captain notices.",
              fx: {skill:{tactics:3},merit:4,them:{type:"friend",op:20}},
            },
            lose: {r:"Their tricks are just habits. You learn little.",fx:{them:{op:5}}},
          },
          {
            t: "Get them drunk and make friends",
            r: "By dawn you are brothers in arms and very sick.",
            fx: {them:{type:"friend",op:30},health:-3,happy:3},
          },
        ],
      },
      {
        id: "pl_heavy_levy",
        cond: (p,C)=>common(p,C)&&!C.soldier(p)&&C.male(p)&&C.age(p)<45&&((A.realm(p.realm)||{}).laws||{}).levy===2,
        w: 1.1,
        cool: 4,
        title: "The heavy levy",
        text: p=>`Under the new heavy levy law, ${A.realm(p.realm).short} takes one man in five. The levy-sergeant stands at your door with a list. Your name is on it.`,
        choices: [
          {
            t: "Go with the levy",
            r: "You march away with a spear and a sore heart.",
            fx: p=>(A.enlist&&A.enlist(p,!1),""),
          },
          {
            t: "Pay a substitute",
            req: p=>p.coin>=50,
            r: "Fifty suns buy a poorer man to take your place. Legal. Ugly.",
            fx: {coin:-50,honor:-2},
          },
          {
            t: "Run to the woods until it passes",
            check: {s:"survival",s2:"stealth",d:45},
            win: {r:"A cold month in the woods. The sergeant moves on.",fx:{skill:{survival:2},wil:1}},
            lose: {r:"They find you. Deserting a levy is a crime.",fx:{punish:"desertion"}},
          },
        ],
      },
      {
        id: "pl_secret_letter",
        cond: (p,C)=>common(p,C)&&C.realmFaction(p),
        w: .8,
        cool: 6,
        title: "A letter to carry",
        setup: (p,ctx)=>pickFac(p,ctx),
        text: p=>`A stranger with a good cloak offers you ${A.coin(25)} to carry a sealed letter to a manor two days' ride away. No questions. The seal is a house you know is part of the {faction}.`,
        choices: [
          {
            t: "Carry it, no questions",
            check: {s:"riding",s2:"stealth",d:35},
            win: {r:"Delivered. Paid. Forgotten — you hope.",fx:{coin:25,factionDisc:3}},
            lose: {
              r: "Royal riders stop you on the road. The letter is treason.",
              fx: {prison:2,why:"carrying treasonous letters"},
            },
          },
          {
            t: "Read it first",
            check: {s:"learning",s2:"stealth",d:40},
            win: {
              r: "You learn names and a date. Dangerous knowledge. Valuable knowledge.",
              fx: {coin:25,skill:{intrigue:2},flag:"pl_knows_plot"},
            },
            lose: {r:"You break the seal badly. The stranger will know.",fx:{coin:25,newRel:{type:"enemy",op:-30}}},
          },
          {
            t: "Take it to the sheriff instead",
            r: "The sheriff pays better than the stranger: the crown rewards loyalty.",
            fx: {coin:40,favor:8,factionDisc:-8},
          },
        ],
      },
      {
        id: "pl_deserters",
        cond: (p,C)=>common(p,C)&&C.atWar(p)&&!C.soldier(p),
        w: .9,
        cool: 5,
        title: "Deserters in the barn",
        text: p=>`Three men in torn ${A.realm(p.realm).short} colors are hiding in your barn. Deserters. One is a boy with a fever. They beg you not to tell. There is a bounty on deserters.`,
        choices: [
          {
            t: "Feed them and let them go",
            r: "They leave before dawn. The boy cries thanks.",
            fx: {honor:3,coin:-5,happy:2},
          },
          {
            t: "Turn them in for the bounty",
            r: "Silver in your hand. Three men in chains. The boy looks back at you.",
            fx: {coin:20,honor:-6,happy:-4},
          },
          {
            t: "Nurse the boy until he is well",
            check: {s:"medicine",s2:"learning",d:35},
            win: {
              r: "The fever breaks. The boy swears he will repay you someday.",
              fx: {honor:4,newRel:{type:"friend",op:50}},
            },
            lose: {r:"The fever does not break. You bury him behind the barn.",fx:{wil:1.5,happy:-6}},
          },
        ],
      },
      {
        id: "pl_overlord_garrison",
        cond: (p,C)=>common(p,C)&&C.tributary(p)&&C.town(p),
        w: .8,
        cool: 6,
        title: "Foreign soldiers in the streets",
        text: p=>`A garrison of ${A.realmShort(A.realm(p.realm).overlord)} soldiers now sits in ${A.provName(p.home)}, "to protect the tribute". They drink in your taverns and swagger in your streets. Tonight two of them are pushing an old man around.`,
        choices: [
          {
            t: "Step in",
            check: {s:"melee",s2:"str",d:45},
            win: {
              r: "You send them sprawling. The street cheers. The garrison captain wants your name.",
              fx: {fame:3,honor:3,newRel:{type:"enemy",op:-30}},
            },
            lose: {r:"They beat you both.",fx:{health:-18,cause:"a beating by foreign soldiers",wil:1.5}},
          },
          {
            t: "Talk them down",
            check: {s:"persuasion",s2:"etiquette",d:40},
            win: {
              r: "A joke, a coin for their drink, and they wander off. The old man kisses your hand.",
              fx: {honor:2,coin:-2},
            },
            lose: {r:"They laugh at you and keep going.",fx:{happy:-3}},
          },
          {t:"Walk past",r:"You walk past. You will remember the old man's face.",fx:{honor:-2,wil:.5}},
        ],
      },
      {
        id: "pl_smuggler_offer",
        cond: (p,C)=>common(p,C)&&C.coast(p),
        w: .8,
        cool: 6,
        title: "Goods without seals",
        text: p=>`A boatman in ${A.provName(p.home)} has crates with no customs seals and a buyer who pays double. He needs someone with a cart and a short memory.`,
        choices: [
          {
            t: "Rent him your cart and your memory",
            check: {s:"deception",s2:"stealth",d:40},
            win: {r:"Easy money. Twice as easy as honest money.",fx:{coin:50}},
            lose: {r:"The customs men were waiting.",fx:{punish:"smuggling"}},
          },
          {
            t: "Report him to the customs house",
            r: "The customs man gives you a reward and a wink. The boatman gives you a look.",
            fx: {coin:15,newRel:{type:"enemy",op:-25}},
          },
          {t:"Say no",r:"Short memories are expensive in the end.",fx:{honor:1}},
        ],
      },
      {
        id: "pl_great_lord_passes",
        cond: (p,C)=>common(p,C)&&A.realmHouses(p.realm).length>0,
        w: .8,
        cool: 6,
        title: "A great lord rides through",
        setup: (p,ctx)=>{ctx.house=A.pick(A.realmHouses(p.realm)).name},
        text: "The head of {house} rides through with forty knights, on the way to court. His horse throws a shoe outside your door.",
        choices: [
          {
            t: "Offer to fix it, and talk while you work",
            check: {s:"craft",s2:"persuasion",d:35},
            win: {
              r: "Good work and good talk. He tosses you silver and remembers your face.",
              fx: {coin:15,newRel:{type:"patron",op:25,back:"protege"}},
            },
            lose: {r:"You fix it badly. He limps off, cursing.",fx:{happy:-2}},
          },
          {
            t: "Ask him for a place in his household",
            check: {s:"persuasion",s2:"etiquette",d:50},
            win: {
              r: '"Come to the castle at Michaelmas." He means it.',
              fx: {job:"servant",newRel:{type:"patron",op:20,back:"protege"}},
            },
            lose: {r:"He laughs and rides on.",fx:{happy:-1}},
          },
          {t:"Bow and stay out of the way",r:"Great men are like weather. You wait for them to pass.",fx:{}},
        ],
      },
    ]);
  })();
})();
