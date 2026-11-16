// The release's event pack 30 of 30 (8 events, mostly gf_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-028). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const hurt = (p,n,why,floor)=>{p.health=Math.max(floor??6,p.health-n),p.lastHurt=why},
      pay = (p,n)=>{const c=Math.min(p.coin,n);return p.coin-=c,c},
      crowd = (p,n,tier)=>{const c=A.canTake(p),k=c.K/A.strengthOf(GD.CROWD[tier].w);return`There are ${n}. On a good day you could take about ${A.crowdN(k)} like them at once${c.limited?", if your wind holds":""}.`},
      squadN = p=>(p.mil&&p.mil.squad||[]).map(A.P).filter(x=>x&&x.alive).length,
      myOrder = p=>{const ids=Object.keys(GD.ORDERS).filter(k=>GD.ORDERS[k].realm===(p.mil?p.mil.realm:p.realm));return ids.length?GD.ORDERS[ids[0]]:null};
    A.defEvents([
      {
        id: "gf_road",
        cond: (p,C)=>C.adult(p)&&!p.prison&&!p.ruler,
        w: 1.1,
        cool: 4,
        title: "Trouble on the road",
        setup: (p,ctx)=>{ctx.n=A.ri(3,6),ctx.t=A.chance(.7)?1:2,ctx.who=ctx.t===1?"robbers":"deserters",ctx.toll=8+ctx.n*4},
        text: (p,ctx)=>`Where the road dips into the trees, ${ctx.n} ${ctx.who} step out with cudgels and old spears. Their leader wants ${ctx.toll} suns, or your boots, or both. ${crowd(p,ctx.n,ctx.t)}`,
        choices: [
          {
            t: "Draw steel and take them all",
            group: {n:(p,c)=>c.n,tier:(p,c)=>c.t,who:"robbers"},
            win: {r:"You go at them before they are ready.",fx:{fame:1}},
            lose: {
              r: "There were too many, and they knew it.",
              fx: p=>{const c=pay(p,20);return c?`They take ${c} suns from your purse.`:""},
            },
          },
          {
            t: "Pay them and walk on",
            r: "You count out the coins. They let you pass, laughing.",
            fx: (p,c)=>(pay(p,c.toll),A.willGrow(p,.3),""),
          },
          {
            t: "Run for it",
            check: {s:"spd",s2:"athletics",d:44},
            win: {r:"You are through the trees before the first of them moves.",fx:{}},
            lose: {
              r: "A cudgel catches you across the back as you run. You get away, barely.",
              fx: p=>(hurt(p,12,"a robber's cudgel"),""),
            },
          },
        ],
      },
      {
        id: "gf_tavern",
        cond: (p,C)=>C.adult(p)&&!p.prison&&!p.ruler&&!C.noble(p),
        w: .8,
        cool: 5,
        title: "Five against one",
        setup: (p,ctx)=>{ctx.n=A.ri(3,5)},
        text: (p,ctx)=>`A table of ${ctx.n} toughs has decided they do not like your face. One kicks your stool. Benches scrape back, and nobody else in the alehouse wants to be a witness. ${crowd(p,ctx.n,1)}`,
        choices: [
          {
            t: "Fists up. All of them.",
            group: {n:(p,c)=>c.n,tier:1,who:"toughs",lethal:!1},
            win: {r:"It is short and loud and splintery.",fx:{fame:1}},
            lose: {r:"You wake up in the gutter outside with a split lip.",fx:{}},
          },
          {
            t: "Buy the table a round",
            r: "Ale buys peace. It costs you six suns and some pride.",
            fx: p=>(pay(p,6),""),
          },
          {
            t: "Back to the wall, and talk",
            check: {s:"intimidation",s2:"persuasion",d:46},
            win: {r:"Something in your voice makes the biggest one sit back down.",fx:{skill:{intimidation:1}}},
            lose: {
              r: "Talk only makes them angrier. They throw you out into the street.",
              fx: p=>(hurt(p,8,"an alehouse brawl",20),""),
            },
          },
        ],
      },
      {
        id: "gf_bridge",
        cond: (p,C)=>C.adult(p)&&!!p.mil&&C.atWar(p)&&p.mil.rank<=4,
        w: 1.4,
        cool: 3,
        title: "The footbridge",
        setup: (p,ctx)=>{ctx.n=A.ri(8,12)},
        text: (p,ctx)=>`Your file holds a footbridge while the column crosses the ford below. Then ${ctx.n} enemy spearmen come down the far bank. The bridge is two paces wide, and you have two men with you. ${crowd(p,ctx.n,2)} On a bridge, that counts for more.`,
        choices: [
          {
            t: "Hold the bridge",
            group: {n:(p,c)=>c.n,tier:2,allies:2,ground:"bridge",who:"enemy spearmen"},
            win: {r:"They come two at a time, and two at a time they fall back.",fx:{merit:25,fame:2}},
            lose: {r:"The bridge is lost. Your own men carry you back.",fx:{merit:5}},
          },
          {
            t: "Cut the ropes and fall back",
            check: {s:"spd",s2:"craft",d:45},
            win: {r:"The bridge drops into the river. The column is safe.",fx:{merit:15}},
            lose: {
              r: "The ropes hold too long. You fall back under their spears.",
              fx: p=>(hurt(p,15,"a spear at the footbridge"),""),
            },
          },
        ],
      },
      {
        id: "gf_cutoff",
        cond: (p,C)=>C.adult(p)&&!!p.mil&&C.atWar(p),
        w: 1.1,
        cool: 4,
        title: "Cut off",
        setup: (p,ctx)=>{ctx.n=A.ri(10,16),ctx.sq=squadN(p)},
        text: (p,ctx)=>`The line moves and you do not. Suddenly you and ${ctx.sq?`your ${ctx.sq} men are`:"nobody else are"} an island, with ${ctx.n} of the enemy closing in. ${crowd(p,ctx.n,2)}`,
        choices: [
          {
            t: "Form a ring and fight",
            group: {n:(p,c)=>c.n,tier:2,allies:"squad",who:"enemy soldiers"},
            win: {r:"You hold until the line comes back for you.",fx:{merit:30,fame:2}},
            lose: {r:"The ring breaks.",fx:{}},
          },
          {
            t: "Throw down your weapon",
            r: "You are taken, and ransomed back after a hungry month.",
            fx: p=>{const c=pay(p,60);return c?`(The ransom costs you ${c} suns.)`:"(Your captain pays the ransom. He will remember it.)"},
          },
          {
            t: "Break for your own lines",
            check: {s:"athletics",s2:"wil",d:54},
            win: {r:"You go through a gap that closes behind you.",fx:{merit:5}},
            lose: {r:"A spear-butt catches you on the way through.",fx:p=>(hurt(p,22,"a spear in the rout"),"")},
          },
        ],
      },
      {
        id: "gf_champion",
        cond: (p,C)=>C.adult(p)&&!!p.mil&&C.atWar(p),
        w: .7,
        cool: 6,
        title: "One against nine",
        setup: (p,ctx)=>{const o=myOrder(p);ctx.who=o?/^the Knights of /.test(o.name)?"a "+o.name.replace(/^the Knights/,"Knight"):"one of "+o.name:"the best blade in your regiment",ctx.n=A.ri(7,10)},
        text: (p,ctx)=>`Across the field ${ctx.who} has lost his horse. ${ctx.n} levy spearmen close around him. He does not run. A fighter like that can take seven or eight men like these at once, if his wind holds. You could help.`,
        choices: [
          {
            t: "Run to his side",
            group: {n:(p,c)=>c.n,tier:1,allies:1,allyTier:4,who:"levy spearmen"},
            win: {r:"Back to back, you finish it. Afterwards he asks your name.",fx:{fame:3,merit:20}},
            lose: {r:"He goes down under the spears, and you barely get away.",fx:{}},
          },
          {
            t: "Watch, and learn how it is done",
            r: "He kills four before the rest remember business elsewhere. You learn more in that minute than in a month of drill.",
            fx: {skill:{melee:2}},
          },
        ],
      },
      {
        id: "gf_village",
        cond: (p,C)=>C.adult(p)&&!p.prison&&!p.ruler,
        w: .7,
        cool: 6,
        title: "Raiders at dawn",
        setup: (p,ctx)=>{ctx.n=A.ri(6,10),ctx.v=A.ri(4,8)},
        text: (p,ctx)=>`Raiders hit the village where you are sleeping: ${ctx.n} hard men with axes. The villagers have ${ctx.v} grown men with pitchforks and flails, and they all look at you. ${crowd(p,ctx.n,2)}`,
        choices: [
          {
            t: "Lead the villagers against them",
            group: {n:(p,c)=>c.n,tier:2,allies:(p,c)=>c.v,allyTier:1,who:"raiders"},
            win: {r:"The raiders did not expect a fight. They leave their dead and run.",fx:{fame:3,honor:3}},
            lose: {r:"The villagers break. The raiders take what they came for.",fx:{honor:1}},
          },
          {
            t: "Get the children out the back way",
            r: "You lead the children and the old to the woods. The village burns, but nobody you could reach dies.",
            fx: {honor:2},
          },
          {t:"Hide until it is over",r:"You hide. You hear everything.",fx:{honor:-4}},
        ],
      },
      {
        id: "or_tale",
        cond: (p,C)=>C.adult(p)&&!!p.order&&!!GD.ORDERS[p.order.id],
        w: 1.5,
        cool: 4,
        title: "Around the fire",
        setup: (p,ctx)=>{const o=GD.ORDERS[p.order.id];ctx.oname=o.name,ctx.tale=o.lore.name,ctx.rumor=o.lore.rumor,ctx.truth=o.lore.truth},
        text: (p,ctx)=>`By the fire, an old hand tells the story of the name. ${ctx.tale}`,
        choices: [
          {
            t: "Ask whether the stories are true",
            r: (p,ctx)=>`"People say: ${ctx.rumor}" The old one spits into the fire. "The truth is this. ${ctx.truth}"`,
            fx: p=>(p.order&&(p.order.merit+=5),""),
          },
          {t:"Just listen",r:"It is a good story, and you will tell it yourself one day.",fx:{wil:.3}},
        ],
      },
      {
        id: "or_deeds",
        cond: (p,C)=>C.adult(p)&&!!p.order&&!!GD.ORDERS[p.order.id]&&p.order.rank>=1,
        w: 1,
        cool: 6,
        title: "The roll of deeds",
        setup: (p,ctx)=>{const o=GD.ORDERS[p.order.id];ctx.oname=o.name,ctx.deed=A.pick(o.lore.deeds)},
        text: (p,ctx)=>`Once a year the deeds of ${ctx.oname} are read aloud, and every member stands to hear them. This year the reader stops at one line and looks straight at you: "${ctx.deed}"`,
        choices: [
          {
            t: "Swear to be worthy of it",
            r: "The hall answers your oath with the order's own.",
            fx: p=>(p.order&&(p.order.merit+=8),p.honor=A.clamp(p.honor+2,0,100),""),
          },
          {
            t: "Ask what was left out of the record",
            check: {s:"persuasion",s2:"learning",d:50},
            win: {
              r: "An old member tells you, quietly, what the roll does not say. You understand the order better for it.",
              fx: {skill:{learning:1},wil:.5},
            },
            lose: {r:"Nobody answers. Someone writes your name down.",fx:p=>(p.order&&(p.order.merit-=4),"")},
          },
        ],
      },
    ]);
  })();
})();
