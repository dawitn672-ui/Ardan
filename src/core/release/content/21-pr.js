// The release's event pack 21 of 30 (6 events, mostly pr_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-028). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    A.defEvents([
      {
        id: "pr_tourney_joust",
        trigger: !0,
        title: "The lists",
        text: p=>`Your tourney fills the meadow below ${A.provName(p.home)}: forty knights, two hundred banners, a crowd that came for blood and pastry. The marshal of the lists asks whether the host will ride.`,
        choices: [
          {
            t: "Ride in the joust yourself",
            req: (p,C)=>C.adult(p)&&!C.old(p),
            check: {s:"lance",s2:"riding",d:50,bonus:p=>p.gear&&p.gear.mount?6:-10},
            win: {
              r: "Three passes. On the third your lance takes him square and he goes over his horse's tail. The meadow roars your name.",
              fx: {fame:6,flag:"tourneyWin",skill:{lance:3,riding:2},deed:"Won the joust at their own tourney"},
            },
            lose: {
              r: "His point catches your shield high and the world turns over. You wake on the grass with a herald fanning you.",
              fx: {health:-14,cause:"a fall in the lists",wil:1,skill:{lance:2}},
            },
          },
          {
            t: "Fight in the melee on foot",
            req: (p,C)=>C.adult(p)&&!C.old(p),
            r: "You put on blunted steel and walk into the press.",
            fx: {
              duel: {
                tier: 3,
                title: "a tourney knight",
                opts: {kind:"duel",place:"the tourney melee",lethal:!1,toYield:!0,title:"The tourney melee"},
              },
              flag: "tourneyMelee",
            },
          },
          {
            t: "Preside from the stand and hand out the prizes",
            r: "You give the golden circlet to a hedge knight nobody knew this morning. Everyone will tell that story, and your name is in it.",
            fx: {fame:3,houseOp:2,skill:{etiquette:2,diplomacy:2}},
          },
        ],
      },
      {
        id: "pr_pilgrim_road",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"pilgrim")&&A.S.year-p.flags.pilgrim<=2,
        w: .8,
        once: !0,
        title: "On the holy road",
        setup: (p,ctx)=>{ctx.pid=A.makeAcquaintance(p,"friend").id},
        text: "A fellow pilgrim, {them}, has walked beside you for three days. Tonight, at the hostel fire, {theyHe} admits {theyHe} is walking to ask the gods to forgive something {theyHe} will not name.",
        choices: [
          {
            t: "Listen, and say nothing to judge",
            r: '{them} talks until the fire is ash. In the morning {theyHe} walks lighter. "I owe you," {theyHe} says.',
            fx: {piety:3,them:{type:"friend",op:20},owed:1},
          },
          {
            t: "Press {themHim} for the whole story",
            check: {s:"persuasion",s2:"int",d:45},
            win: {
              r: "It was a fire, years ago, and a barn that was not empty. You understand why {theyHe} walks.",
              fx: {them:{type:"friend",op:8},int:.5},
            },
            lose: {r:"{them} closes like a door. {theyHe} walks with another group the next day.",fx:{them:{op:-10}}},
          },
          {
            t: "Keep your distance — the road is full of liars",
            r: "You sleep with your purse under your head. Maybe that is wisdom.",
            fx: {wil:.5},
          },
        ],
      },
      {
        id: "pr_author_critic",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"author"),
        w: .7,
        cool: 8,
        title: "A critic",
        text: p=>`A master at ${A.pick(["the College","the Archive","the academy","the cathedral school"])} has written a pamphlet against your book. Copies are passing hand to hand. Its title is "${A.pick(["Errors of an Amateur","A Reply to a Fool","On Certain Mistakes Lately Printed","Against Novelty"])}".`,
        choices: [
          {
            t: "Write a reply sharper than his",
            check: {s:"learning",s2:"persuasion",d:50},
            win: {
              r: "Your reply is quoted in taverns. His students start asking him awkward questions.",
              fx: {fame:4,skill:{learning:2}},
            },
            lose: {r:"Your reply is long, angry and wrong in one place he finds at once.",fx:{fame:-2,happy:-4,wil:1}},
          },
          {
            t: "Invite him to debate in public",
            check: {s:"persuasion",s2:"wil",d:55},
            win: {
              r: "The hall is packed. You win on the last point and he shakes your hand like a man who means it.",
              fx: {fame:6,newRel:{type:"friend",op:30}},
            },
            lose: {
              r: "He is quicker on his feet than on the page. The students laugh in the wrong places.",
              fx: {fame:-3,newRel:{type:"rival",op:-30}},
            },
          },
          {
            t: "Ignore him — the book will outlive the pamphlet",
            r: "It does. Nobody reads pamphlets after a year.",
            fx: {wil:.5,happy:1},
          },
        ],
      },
      {
        id: "pr_founder_students",
        cond: (p,C)=>C.adult(p)&&(C.flag(p,"foundedSchool")||C.flag(p,"foundedAcademy")),
        w: .8,
        cool: 5,
        title: "Your students",
        setup: (p,ctx)=>{const k=A.makeAcquaintance(p,"student");k.born=A.S.year-Math.round(GD.RACES[k.race].adult*1.1),ctx.pid=k.id},
        text: "One of your new students, {them}, is either the most gifted pupil you have ever had or the most arrogant. Possibly both. {theyHe} corrected you in front of the class today. {theyHe} was right.",
        choices: [
          {
            t: "Make {themHim} your favored pupil",
            r: "{them} works twice as hard for your praise. The others notice.",
            fx: {them:{type:"student",op:30},fame:2},
          },
          {
            t: "Humble {themHim} in the yard",
            check: {s:"ins",s2:"wil",d:45},
            win: {
              r: "You put {themHim} on the ground three times, gently. {theyHe} bows lower after that.",
              fx: {them:{type:"student",op:15},skill:{melee:1}},
            },
            lose: {
              r: "{theyHe} nearly takes you. The whole school saw it.",
              fx: {them:{type:"student",op:5},fame:-1,wil:1},
            },
          },
          {
            t: "Thank {themHim} for the correction, publicly",
            r: "The room goes quiet. A master who can be taught. They will talk about that for years.",
            fx: {them:{type:"student",op:20},honor:2,int:.4},
          },
        ],
      },
      {
        id: "pr_ward_grows",
        cond: (p,C)=>C.adult(p)&&p.children.some(c=>A.P(c)&&A.P(c).alive&&A.P(c).flags.ward&&A.age(A.P(c))>=8),
        w: .7,
        once: !0,
        title: "Your ward",
        setup: (p,ctx)=>{const k=p.children.map(A.P).find(c=>c&&c.alive&&c.flags.ward&&A.age(c)>=8);ctx.pid=k.id},
        text: '{them} asks you, out of nowhere, at supper: "Why did you take me? You did not have to." The whole table goes quiet.',
        choices: [
          {
            t: '"Because you needed someone, and so did I."',
            r: "{them} looks at {theirHis} plate for a long time. Then {theyHe} eats everything on it.",
            fx: {them:{op:25},happy:4},
          },
          {
            t: '"You are mine. That is the end of it."',
            r: "A grin. A short one, but a real one.",
            fx: {them:{op:15}},
          },
          {
            t: "Tell {themHim} the truth about where {theyHe} came from",
            check: {s:"persuasion",s2:"wil",d:40},
            win: {
              r: "It is hard to hear. {theyHe} hears it, and holds your hand while {theyHe} does.",
              fx: {them:{op:20},wil:1},
            },
            lose: {r:"{theyHe} runs out. {theyHe} comes back after dark, cold and silent.",fx:{them:{op:-5}}},
          },
        ],
      },
      {
        id: "pr_order_vigil",
        cond: (p,C)=>C.adult(p)&&C.flag(p,"order"),
        w: .6,
        cool: 6,
        title: "The order's vigil",
        text: p=>`${p.flags.order} keeps its yearly vigil. Fifty knights kneel all night in armor before the altar, and at dawn the youngest asks whether the founder will lead them on a quest worthy of the oath.`,
        choices: [
          {
            t: "Send them to clear the roads of bandits",
            r: "They come back with prisoners, scars and a story the realm repeats.",
            fx: {fame:3,stability:2},
          },
          {
            t: "Lead them against a beast yourself",
            req: (p,C)=>!C.old(p),
            r: "You ride out at the head of your knights.",
            fx: {beast:{id:"CRE-25",place:"the deep woods",mod:.8,title:"The order's quest"}},
          },
          {
            t: "Tell them the true quest is keeping the oath",
            r: "Some are disappointed. The old ones nod.",
            fx: {piety:2,honor:2},
          },
        ],
      },
    ]);
  })();
})();
