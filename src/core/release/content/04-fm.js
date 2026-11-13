// The release's event pack 4 of 30 (85 events, mostly fm_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-028). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const C = A.C,
      live = (p,types)=>A.relsOf(p,types).filter(x=>x.p&&x.p.alive),
      relP = (p,types)=>{const l=live(p,types);return l.length?A.pick(l).p:null},
      spouseOf = p=>{const s=p&&p.spouse?A.P(p.spouse):null;return s&&s.alive?s:null},
      kidsOf = (p,lo,hi)=>(p.children||[]).map(A.P).filter(c=>c&&c.alive&&(lo==null||C.ageAdj(c)>=lo)&&(hi==null||C.ageAdj(c)<hi)),
      hasKid = (p,lo,hi)=>(p.children||[]).some(id=>{const c=A.P(id);if(!c||!c.alive)return!1;const a=C.ageAdj(c);return(lo==null||a>=lo)&&(hi==null||a<hi)}),
      oldParent = p=>(p.parents||[]).some(id=>{const x=A.P(id);return x&&x.alive&&A.stage(x)==="old"}),
      deadParent = p=>(p.parents||[]).some(id=>{const x=A.P(id);return x&&!x.alive}),
      relOp = (p,t)=>t&&p.rel[t.id]?p.rel[t.id].op:0,
      hp = (p,v)=>{p.happy=A.clamp(p.happy+v,0,100)},
      hon = (p,v)=>{p.honor=A.clamp(p.honor+v,0,100)},
      purse = p=>({slave:1,serf:1,peasant:2,artisan:3,merchant:6,gentry:12,noble:40,royal:100})[p.status]||2,
      pay = (p,n)=>{const v=Math.min(p.coin,Math.max(0,Math.round(n)));return p.coin-=v,v},
      bump = (p,t,op,type,back)=>{if(t){if(!p.rel[t.id]){A.link(p,t,type||"acquaint",op,back||type||"acquaint");return}op&&A.addOp(p,t,op),type&&(p.rel[t.id].type=type,t.rel[p.id]&&(t.rel[p.id].type=back||type))}},
      gender = (ctx,x)=>{if(!x)return;const m=x.sex==="M";ctx.sd=m?"son":"daughter",ctx.bs=m?"brother":"sister",ctx.hw=m?"husband":"wife",ctx.mf=m?"man":"woman",ctx.bg=m?"boy":"girl",ctx.mfa=m?"father":"mother"},
      setPid = (p,ctx,t)=>{const x=t||A.makeAcquaintance(p,"friend");return ctx.pid=x.id,gender(ctx,x),x},
      T = ctx=>ctx&&ctx.pid?A.P(ctx.pid):null,
      nm = (ctx,fb)=>{const t=T(ctx);return t?t.given:fb||"they"},
      loveSex = p=>p.flags.likes||(p.sex==="M"?"F":"M"),
      mk = (p,o)=>{o=o||{};const race=o.race||p.race,R2=GD.RACES[race]||GD.RACES.human,sex=o.sex||(A.chance(.5)?"M":"F"),cult=race===p.race?p.cult:A.cultureFor(race,p.realm)||p.cult,faith=race===p.race?p.faith:A.faithFor(race,p.realm)||p.faith,adj=o.ageAdj!=null?o.ageAdj:C.ageAdj(p)+A.ri(-4,4),age=Math.max(o.minAge!=null?o.minAge:1,Math.round(adj*R2.adult/16)),status=o.status||p.status,x=A.newPerson({given:A.givenName(cult,sex),sex,race,realm:p.realm,cult,faith,born:A.S.year-age,status,home:p.home}),fn=A.familyName({cult,realm:p.realm,status,home:p.home,sex});return x.sur=fn.sur,x.surMode=fn.mode,x.occ=o.occ||(A.isAdult(x)?A.pick(A.OCC[status]||A.OCC.peasant):"a child of "+A.provName(p.home)),x},
      giveSpouse = t=>{const have=spouseOf(t);if(have)return have;const sx=t.sex==="M"?"F":"M",s=A.newPerson({given:A.givenName(t.cult,sx),sex:sx,race:t.race,realm:t.realm,cult:t.cult,faith:t.faith,born:t.born+A.ri(-5,5),status:t.status,home:t.home});return s.sur=t.sur,s.surMode=t.surMode,t.spouse=s.id,s.spouse=t.id,A.link(t,s,"spouse",40,"spouse"),s},
      custom = (p,t)=>{const r=p.race,c=p.cult;return r==="dwarf"?"Both your names are poured together in metal on the marriage contract, and the contract goes up in the clan gallery.":r==="elf"?"Elves need no ceremony. You say it once, under the trees, and it is true.":r==="giant"?"The match was fixed at the Thing between the halls, and the halls feast for three days.":c==="CUL-22"||c==="CUL-23"?"The clan-mothers watch from the fire. Among orcs a husband joins his wife's clan as often as not, and nobody's deed-name changes.":["CUL-02","CUL-11","CUL-13","CUL-12"].includes(c)?"By custom the wife takes her husband's house name.":c==="CUL-03"?"The bride keeps her tribe, as Wind Rider brides always have.":["CUL-04","CUL-05","CUL-07"].includes(c)?"The wife keeps her father's house name, as the Well lands expect.":c==="CUL-06"?"The wife keeps her house, and the contract is sealed at the temple.":["CUL-08","CUL-09","CUL-10"].includes(c)?"The wife keeps her clan, and a Rememberer sings both lines so the ancestors know who has joined whom.":c==="CUL-01"?"A notary writes the marriage contract. The wife keeps her own house name.":c==="CUL-15"?"Corsairs need no rite: the captain says it, the crew cheers, and that is that.":"The neighbors drink to you until the small hours."},
      wed = (p,t)=>!t||!t.alive||spouseOf(p)||spouseOf(t)?"":(A.marry(p,t),p.sex==="F"&&t.sex==="M"&&t.sur&&["CUL-02","CUL-11","CUL-13"].includes(p.cult)&&["house","trade","clan"].includes(t.surMode)&&(p.sur=t.sur,p.surMode=t.surMode),`You and ${t.given} are married ${A.weddingRite(p)}. ${custom(p,t)}`),
      faithForbidsDivorce = p=>["REL-01","REL-02"].includes(p.faith)&&!p.ruler,
      divorce = p=>{const s=spouseOf(p);s&&(p.spouse=null,s.spouse=null,p.rel[s.id]&&(p.rel[s.id].type="ex"),s.rel[p.id]&&(s.rel[p.id].type="ex"),A.addOp(p,s,-40),p.exSpouses.push(s.id),hon(p,-5))},
      bury = (p,x,cause,grief,wil)=>{x&&x.alive&&A.kill(x,cause),hp(p,-grief),A.willGrow(p,wil,"grief")},
      addChild = (p,x,op,bastard)=>{if(!x)return;x.sur=p.sur||x.sur,bastard&&(x.flags.bastard=1),p.children.includes(x.id)||p.children.push(x.id),A.link(p,x,"child",op,p.sex==="M"?"father":"mother");const s=spouseOf(p);s&&!bastard&&(s.children.includes(x.id)||s.children.push(x.id),A.link(s,x,"child",op-10,s.sex==="M"?"father":"mother"))},
      aft = p=>{const f=A.faith(p.faith);return f&&f.afterlife?f.afterlife.split(". ")[0].replace(/\.$/,"")+".":"The dead go where the gods send them."},
      fname = p=>(A.faith(p.faith)||{}).name||"the old gods",
      mixedSpouse = p=>{const s=spouseOf(p);return s&&s.race!==p.race?s:null},
      isLover = (p,races)=>live(p,["lover","spouse"]).find(x=>races.includes(x.p.race)),
      freeLover = p=>{const l=live(p,["lover"]).filter(x=>!spouseOf(x.p));return l.length?A.pick(l).p:relP(p,["lover"])},
      kidWord = c=>c&&c.sex==="M"?"son":"daughter",
      sinceMarried = p=>{const s=spouseOf(p);return s&&p.rel[s.id]&&p.rel[s.id].since!=null?A.S.year-p.rel[s.id].since:99},
      EVENTS = [
        {
          id: "fm_fair_meet",
          cond: p=>C.adult(p)&&!C.married(p)&&C.ageAdj(p)<45,
          w: 1.2,
          cool: 4,
          title: "A face at the fair",
          setup: (p,ctx)=>{setPid(p,ctx,A.makeLoveInterest(p)),ctx.fest=A.pick(["May Fair","Harvest Home","the Slaughter Feast","Lantern Night","the Spring Equinox fair"])},
          text: (p,ctx)=>`At ${ctx.fest} in {home}, {themFull}, {themAge}, ${A.pick(["is judging the cheese with deadly seriousness","is dancing badly and laughing about it","wins the sack race and nearly falls into the pond","sells honey cakes from a tray","is arguing with a juggler about a dropped ball"])}. You catch {theirHis} eye twice. The third time, {them} smiles.`,
          choices: [
            {
              t: "Ask {them} to dance",
              check: {s:"diplomacy",s2:"spd",d:38,bonus:p=>p.looks/5-10},
              win: {
                r: "You dance until the fiddler gives up. {them} asks when you will next be in town.",
                fx: {them:{type:"lover",op:35,back:"lover"},happy:8},
              },
              lose: {
                r: "You tread on {theirHis} foot twice. {them} laughs kindly and dances the next one with someone else.",
                fx: {them:{type:"acquaint",op:5},happy:-3},
              },
            },
            {
              t: "Buy {themHim} a ribbon and a honey cake (1 sun)",
              req: p=>p.coin>=1,
              r: "Small things, but {them} ties the ribbon on at once. You agree to meet at the well on market day.",
              fx: {coin:-1,them:{type:"friend",op:25,back:"friend"},happy:4},
            },
            {
              t: "Watch from the edge, then go home",
              r: "You walk home with your heart thumping and nothing to show for it.",
              fx: {happy:-2,wil:.3},
            },
          ],
        },
        {
          id: "fm_temple_meet",
          cond: p=>C.adult(p)&&!C.married(p)&&C.ageAdj(p)<50,
          cool: 6,
          title: "Eyes across the rite",
          setup: (p,ctx)=>{setPid(p,ctx,A.makeLoveInterest(p)),ctx.fn=fname(p)},
          text: (p,ctx)=>"Every holy day at the {fn} rite, {themFull} stands two rows ahead of you. {them} sings off key and does not care. Today {them} turns and catches you staring.",
          choices: [
            {
              t: "Speak to {themHim} after the rite",
              check: {s:"diplomacy",s2:"faith",d:40},
              win: {
                r: "You talk on the steps until the priest sweeps you both out. You walk {themHim} home.",
                fx: {them:{type:"lover",op:30,back:"lover"},happy:6},
              },
              lose: {
                r: "You open your mouth and say something about the weather. {them} agrees about the weather.",
                fx: {them:{type:"acquaint",op:5}},
              },
            },
            {
              t: "Ask the priest to introduce you properly",
              r: "The priest is delighted. A proper introduction, a chaperoned walk, and a family that now thinks well of you.",
              fx: {them:{type:"friend",op:25,back:"friend"},piety:2},
            },
            {
              t: "Keep your mind on the gods",
              r: "You pray harder than you have in years. It does not help.",
              fx: {piety:3,wil:.4},
            },
          ],
        },
        {
          id: "fm_market_meet",
          cond: p=>C.adult(p)&&!C.married(p)&&C.ageAdj(p)<50&&!C.unfree(p),
          cool: 6,
          title: "A hard bargain",
          setup: (p,ctx)=>{setPid(p,ctx,A.makeLoveInterest(p)),ctx.ware=A.pick(["bolt of blue wool","good knife","basket of pears","pair of boots","copper pot"])},
          text: "In the market at {home} you and {themFull} reach for the same {ware}. Neither of you lets go. The stallholder folds his arms and waits for a winner.",
          choices: [
            {
              t: "Haggle {themHim} into the ground",
              check: {s:"trade",s2:"int",d:40},
              win: {
                r: "You win the {ware}. {them} is furious, then impressed, then asks you to supper to see what else you can do.",
                fx: {them:{type:"lover",op:25,back:"lover"},skill:{trade:1}},
              },
              lose: {
                r: "{them} wins the {ware} and walks off laughing. You will think about that laugh for a week.",
                fx: {them:{type:"rival",op:-5,back:"rival"},happy:-2},
              },
            },
            {
              t: "Let {themHim} have it, with a bow",
              r: "{them} accepts, and pays for your cider. You talk till the stalls close.",
              fx: {them:{type:"friend",op:25,back:"friend"},happy:3},
            },
            {
              t: "Offer to split it",
              r: "Splitting a {ware} turns out to be impossible, which gives you a reason to meet again.",
              fx: {them:{type:"friend",op:18,back:"friend"},happy:2},
            },
          ],
        },
        {
          id: "fm_camp_love",
          cond: p=>C.adult(p)&&C.soldier(p)&&!C.married(p),
          cool: 5,
          title: "Love in the camp",
          setup: (p,ctx)=>{setPid(p,ctx,A.makeLoveInterest(p)),ctx.trade=A.pick(["a sutler who sells bad wine at good prices","the farrier's widow","a camp cook with burned forearms","a scout who comes and goes at night"])},
          text: (p,ctx)=>`In the war camp, between the mud and the drills, there is {themFull}, ${ctx.trade}. {them} saves you the last of the stew without being asked. ${C.atWar(p)?"The army marches against {enemy} in days.":"Nobody knows how long the company will stay."}`,
          choices: [
            {
              t: "Spend your free nights with {themHim}",
              r: "Fires, stories, a borrowed cloak. You fall hard. The camp notices; the sergeant pretends not to.",
              fx: {them:{type:"lover",op:40,back:"lover"},happy:10},
            },
            {
              t: "Promise to come back for {themHim}",
              check: {s:"wil",s2:"diplomacy",d:40},
              win: {
                r: "{them} ties a strip of cloth round your wrist. A promise, kept so far.",
                fx: {them:{type:"lover",op:45,back:"lover"},happy:6,wil:.5},
              },
              lose: {
                r: '"Soldiers always say that." {them} is not wrong, and you both know it.',
                fx: {them:{type:"friend",op:15,back:"friend"},happy:-3},
              },
            },
            {
              t: "A camp is no place for love",
              r: "You keep to your squad. Safer for the heart. Duller for everything else.",
              fx: {wil:.5,happy:-2},
            },
          ],
        },
        {
          id: "fm_love_letter",
          cond: p=>C.adult(p)&&C.hasRel(p,"lover"),
          cool: 5,
          title: "A letter, sealed with wax",
          setup: (p,ctx)=>setPid(p,ctx,relP(p,["lover"])),
          text: p=>`A boy brings you a folded letter, sealed with a thumb of wax, from {them}. ${p.literate?"You can read it yourself, if your hands stop shaking.":"You cannot read. The marks swim on the page like tadpoles."}`,
          choices: [
            {
              t: "Read it yourself, alone",
              req: p=>p.literate,
              r: "It is clumsy and honest and you read it eleven times. You keep it in your shirt.",
              fx: {them:{op:15},happy:8},
            },
            {
              t: "Pay the priest to read it to you (1 sun)",
              req: p=>p.coin>=1,
              r: p=>A.chance(.4)?"The priest reads it in a flat voice, then tells his housekeeper, who tells the whole village by supper. Everyone smiles at you in the street.":"The priest reads it, coughs at one line, and promises he heard nothing. You believe him. Mostly.",
              fx: {coin:-1,them:{op:10},happy:5},
            },
            {
              t: "Ask {them} to teach you your letters",
              req: p=>!p.literate,
              check: {s:"int",s2:"wil",d:42},
              win: {
                r: "A winter of slate and chalk by the fire, {them} laughing at your crooked letters. By spring you can read the letter yourself.",
                fx: {literate:!0,them:{op:20},skill:{learning:3},happy:6},
              },
              lose: {
                r: "The letters will not stay still. {them} reads it to you instead, and that is not so bad either.",
                fx: {them:{op:10},skill:{learning:1}},
              },
            },
          ],
        },
        {
          id: "fm_lover_away",
          cond: p=>C.adult(p)&&C.hasRel(p,"lover"),
          cool: 7,
          title: "Gone for the season",
          setup: (p,ctx)=>{setPid(p,ctx,relP(p,["lover"])),ctx.why=A.pick(["to work the harvest","to nurse a sick aunt","with a merchant caravan","to serve in a lord's household"])},
          text: "{them} has gone to {town} {why}. Months, maybe longer. You miss {themHim} more than you expected.",
          choices: [
            {
              t: "Write to {themHim}",
              req: p=>p.literate,
              check: {s:"learning",s2:"int",d:32},
              win: {
                r: "Your letters are short and plain and {them} keeps every one. When {them} comes back, {them} comes straight to your door.",
                fx: {them:{op:15},happy:4},
              },
              lose: {
                r: "Your spelling makes {them} laugh so hard the whole household reads the letter. Still, it arrived.",
                fx: {them:{op:6}},
              },
            },
            {
              t: "Pay a scribe to write for you (2 suns)",
              req: p=>p.coin>=2,
              r: "The scribe makes your plain words pretty. {them} writes back, through another scribe. Love by proxy, but love.",
              fx: {coin:-2,them:{op:10}},
            },
            {
              t: "Walk to {town} to see {themHim}",
              r: "Three days on foot with blisters. {them} sees you at the gate and drops a basket of eggs.",
              fx: {sta:.5,health:-2,them:{op:22},happy:7},
            },
            {
              t: "Wait, and see if it lasts",
              r: "Absence does what absence does. When {them} comes back you are both a little more careful.",
              fx: {them:{op:-10},wil:.5},
            },
          ],
        },
        {
          id: "fm_love_rival",
          cond: p=>C.adult(p)&&C.hasRel(p,"lover"),
          cool: 8,
          title: "A rival in love",
          setup: (p,ctx)=>{setPid(p,ctx,relP(p,["lover"]));const rv=mk(p,{sex:p.sex,ageAdj:C.ageAdj(p)+A.ri(-3,5)});ctx.rvid=rv.id,ctx.rv=rv.given,ctx.rvocc=rv.occ||"a neighbor"},
          text: "{rv}, {rvocc}, has started courting {them}: flowers, songs under the window, a new belt for the fair. {them} has not said no.",
          choices: [
            {
              t: "Settle it with fists behind the alehouse",
              r: "You find {rv} behind the alehouse. Jackets come off.",
              fx: (p,ctx)=>{const rv=A.P(ctx.rvid);rv&&A.link(p,rv,"rival",-35,"rival"),A.startDuelFront(p,rv||A.makeFoe({tier:2,realm:p.realm}),{kind:"brawl",place:"behind the alehouse",lethal:!1,toYield:!0,title:"A fight over love"});const t=T(ctx);return t&&A.addOp(p,t,-4),"(Win or lose, {them} hears about it.)"},
            },
            {
              t: "Out-court {rv}",
              check: {s:"diplomacy",s2:"int",d:45,bonus:p=>p.looks/5-10},
              win: {
                r: "You are kinder, funnier and better at listening. {rv} gives up by midsummer.",
                fx: {them:{op:15},happy:6},
              },
              lose: {
                r: "{rv} sings better than you. {them} cannot decide, and makes you both wait.",
                fx: {them:{op:-5},happy:-4},
              },
            },
            {
              t: "Tell {them} to choose",
              r: (p,ctx)=>{const t=T(ctx);return t&&relOp(p,t)>40?"{them} chooses you, without a pause. {rv} leaves town.":"{them} chooses {rv}. It is over between you."},
              fx: (p,ctx)=>{const t=T(ctx);t&&(relOp(p,t)>40?(A.addOp(p,t,10),hp(p,6)):(bump(p,t,-20,"ex"),hp(p,-12),A.willGrow(p,1.2,"grief")))},
            },
          ],
        },
        {
          id: "fm_jealous_lover",
          cond: p=>C.adult(p)&&C.hasRel(p,"lover"),
          cool: 7,
          title: "Jealousy",
          setup: (p,ctx)=>{setPid(p,ctx,relP(p,["lover"]))},
          text: p=>`{them} saw you laughing with ${p.sex==="M"?"{npcF}":"{npcM}"} at the well and has not spoken to you for two days. Tonight {them} finally bursts out with it.`,
          choices: [
            {
              t: "Calm {themHim} down, gently",
              check: {s:"diplomacy",s2:"wil",d:38},
              win: {
                r: "You hold {theirHis} hands and tell the truth until {them} believes it. The storm passes.",
                fx: {them:{op:10},happy:3},
              },
              lose: {
                r: "The more you explain, the guiltier you sound. {them} slams the door.",
                fx: {them:{op:-10},happy:-4},
              },
            },
            {
              t: "Get angry: you have done nothing wrong",
              r: "Two proud people shouting in a lane. You are right, and it costs you.",
              fx: {them:{op:-14},wil:.4,happy:-3},
            },
            {
              t: "Laugh, and kiss {themHim}",
              check: {s:"int",s2:"diplomacy",d:35,bonus:p=>p.looks/6-8},
              win: {
                r: "It works. {them} laughs too, despite {themHim}self... and that is the end of the quarrel.",
                fx: {them:{op:12},happy:5},
              },
              lose: {r:"It does not work. You get a slap and a long silence.",fx:{them:{op:-12},happy:-3}},
            },
          ],
        },
        {
          id: "fm_lover_proposes",
          cond: p=>C.adult(p)&&!C.married(p)&&live(p,["lover"]).some(x=>!spouseOf(x.p)),
          cool: 5,
          w: 1.3,
          title: '"Marry me"',
          setup: (p,ctx)=>setPid(p,ctx,freeLover(p)),
          text: (p,ctx)=>{const t=T(ctx);return`{them} takes your hand on the bridge at dusk. "I am tired of meeting in barns and behind hedges. Marry me. Before the gods and everyone."${t&&t.race!==p.race?` A ${GD.RACES[t.race].adj} ${t.sex==="M"?"husband":"wife"} will set tongues wagging in {home}, and you both know it.`:""}`},
          choices: [
            {
              t: "Say yes",
              r: (p,ctx)=>"Yes. Of course yes.",
              fx: (p,ctx)=>{const t=T(ctx);return wed(p,t)||"But something stands in the way, and the wedding never happens."},
            },
            {
              t: "Ask for another year",
              r: '{them} nods slowly. "A year, then." It is not quite the answer {them} wanted.',
              fx: {them:{op:-6},flag:"fm_asked_wait"},
            },
            {
              t: "Say no, and mean it",
              r: "{them} lets go of your hand. It is over. You walk home alone in the dark.",
              fx: {them:{type:"ex",op:-30},happy:-6,wil:.6},
            },
          ],
        },
        {
          id: "fm_lover_married",
          cond: p=>C.adult(p)&&C.hasRel(p,"lover"),
          cool: 12,
          w: .6,
          title: "A ring you never saw",
          setup: (p,ctx)=>{const t=setPid(p,ctx,relP(p,["lover"])),s=giveSpouse(t);ctx.ts=s.given,ctx.tsw=s.sex==="M"?"husband":"wife"},
          text: "A woman at the well says it out loud, as if everyone knew: {them} has a {tsw} in {town}. {ts}. Married six years. {them} never said a word to you.",
          choices: [
            {
              t: "End it, today",
              r: "You say it to {theirHis} face and walk away. It hurts like a burn, and you are glad of the pain.",
              fx: {them:{type:"ex",op:-30},happy:-8,honor:2,wil:1.2},
            },
            {
              t: "Keep the secret, and keep {themHim}",
              r: "You tell yourself it changes nothing. It changes everything, quietly.",
              fx: {honor:-4,happy:2,flag:"fm_other_affair"},
            },
            {
              t: "Demand {them} leave {ts}",
              r: (p,ctx)=>ctx.left?"{them} goes to {town} and does not come back for a month. When {them} does, it is with a bundle and no ring.":"{them} weeps and will not leave. You are second, and will stay second.",
              fx: (p,ctx)=>{const t=T(ctx);if(t)if(relOp(p,t)>50&&A.chance(.5)){const s=spouseOf(t);s&&(s.spouse=null,t.spouse=null,t.rel[s.id]&&(t.rel[s.id].type="ex")),ctx.left=1,A.addOp(p,t,10),hon(p,-3)}else A.addOp(p,t,-15),hp(p,-6)},
            },
          ],
        },
        {
          id: "fm_heartbreak",
          cond: p=>C.adult(p)&&C.hasRel(p,"lover"),
          cool: 8,
          w: .8,
          title: "It is over",
          setup: (p,ctx)=>{setPid(p,ctx,relP(p,["lover"])),ctx.why=A.pick(["there is someone else","it has gone cold, that is all","family says no and {them} will not fight them","{them} is leaving for the coast and not taking anyone"])},
          text: '{them} does not meet your eyes. "{why}." Just like that, the thing you built your year around is gone.',
          choices: [
            {
              t: "Beg {themHim} to stay",
              check: {s:"diplomacy",s2:"wil",d:52},
              win: {r:"Something in what you say reaches {themHim}. {them} stays. For now.",fx:{them:{op:5},happy:-2}},
              lose: {
                r: "You beg, and it changes nothing except how you feel about yourself.",
                fx: {them:{type:"ex",op:-15},happy:-14,wil:1.5},
              },
            },
            {
              t: "Let {themHim} go with dignity",
              r: "You nod, wish {themHim} well, and walk until your legs ache. Grief makes you harder.",
              fx: {them:{type:"ex",op:0},happy:-10,wil:1.8,honor:2},
            },
            {
              t: "Drown it in ale",
              r: "A week of ale. Then a headache. Then the same grief, still waiting.",
              fx: {them:{type:"ex",op:-10},happy:-6,health:-4,cause:"drink",wil:.6},
            },
            {
              t: "Make a song of it",
              check: {s:"music",s2:"int",d:40},
              win: {
                r: "The song is good. People sing it at the alehouse without knowing it is about you.",
                fx: {them:{type:"ex",op:-5},happy:-4,fame:1,skill:{music:2},wil:1},
              },
              lose: {
                r: "The song is terrible. Writing it helped anyway.",
                fx: {them:{type:"ex",op:-5},happy:-6,skill:{music:1},wil:1},
              },
            },
          ],
        },
        {
          id: "fm_elope",
          cond: p=>C.adult(p)&&!C.married(p)&&C.parentsAlive(p)&&C.ageAdj(p)<35&&live(p,["lover"]).some(x=>!spouseOf(x.p)),
          cool: 8,
          title: "Your family says no",
          setup: (p,ctx)=>{const t=setPid(p,ctx,freeLover(p));ctx.why=t.race!==p.race?`"A ${GD.RACES[t.race].adj}? In this family?"`:t.faith!==p.faith?'"Not someone who prays to other gods."':A.pick(['"That family has nothing but debts and a bad name."','"You can do better. Much better."','"We have other plans for you."'])},
          text: (p,ctx)=>`You tell your family about {them}. Your ${C.hasRel(p,"father")?"father":"mother"} hears you out, then says no. {why} The door is closed on it.`,
          choices: [
            {
              t: "Elope tonight",
              r: "A bundle, a borrowed horse, a priest in {town} who asks no questions.",
              fx: (p,ctx)=>{const s=wed(p,T(ctx));for(const x of live(p,["father","mother"]))A.addOp(p,x.p,-25);return hp(p,8),hon(p,-3),A.addTrait(p,"impetuous"),s?s+" Your family does not come.":"It all falls apart at the crossroads."},
            },
            {
              t: "Plead with your family",
              check: {s:"diplomacy",s2:"wil",d:46},
              win: {
                r: "You talk for three nights. On the fourth, your family gives a grudging blessing.",
                fx: (p,ctx)=>{const s=wed(p,T(ctx));for(const x of live(p,["father","mother"]))A.addOp(p,x.p,5);return s},
              },
              lose: {
                r: "The answer is still no, and now there is shouting too.",
                fx: {rel:{who:"father",op:-10},them:{op:5},happy:-4},
              },
            },
            {
              t: "Obey, and give {themHim} up",
              r: "You tell {them}. You hear {themHim} weeping through the door. Your family thinks you wise. You think nothing at all for a month.",
              fx: {them:{type:"ex",op:-25},rel:{who:"mother",op:10},happy:-14,wil:1.5},
            },
          ],
        },
        {
          id: "fm_suitor",
          cond: p=>C.adult(p)&&!C.married(p)&&C.ageAdj(p)<40&&!C.hasRel(p,"betrothed"),
          cool: 7,
          title: "A proposal comes to you",
          setup: (p,ctx)=>{setPid(p,ctx,A.makeLoveInterest(p)),ctx.offer=A.pick(["a good roof and a well in the yard","three cows and a strip of the best land","a share in the family boat","a workshop with a shop on the street","a sound name and a quiet temper"])},
          text: (p,ctx)=>`{themFull}, {themAge}, {themOcc}, sends a go-between to your door with a formal offer of marriage. ${A.pick(["You have spoken twice, both times about rain.","You remember {themHim} from childhood: a serious, careful child.","Half of {home} says it is a good match."])} On the table: {offer}.`,
          choices: [
            {
              t: "Accept",
              r: "You accept, and the go-between drinks to it.",
              fx: (p,ctx)=>wed(p,T(ctx))||"The match falls through before the wedding.",
            },
            {
              t: "Meet {themHim} first, properly",
              check: {s:"diplomacy",s2:"int",d:35},
              win: {
                r: "A long walk and a longer talk. You like {themHim}. There is no hurry, but there is something there.",
                fx: {them:{type:"lover",op:30,back:"lover"},happy:4},
              },
              lose: {
                r: "The walk is awkward. You both agree to stay friends, which means strangers.",
                fx: {them:{type:"acquaint",op:0}},
              },
            },
            {
              t: "Send the go-between away",
              r: "The go-between leaves with a sniff. Your neighbors call you proud.",
              fx: {them:{type:"acquaint",op:-10},happy:1},
            },
          ],
        },
        {
          id: "fm_matchmaker",
          cond: p=>C.adult(p)&&!C.married(p)&&!C.noble(p)&&C.ageAdj(p)>=17&&C.ageAdj(p)<30&&!C.hasRel(p,"lover","betrothed"),
          cool: 5,
          title: "The matchmaker",
          setup: (p,ctx)=>{setPid(p,ctx,A.makeLoveInterest(p))},
          text: p=>`${A.pick(["Your aunt",`Old Mother ${A.givenName(p.cult,"F")}, who has married off half of {home},`,"The miller's wife, who makes matches for sport,"])} corners you after the rite. "You are not getting younger. I know just the one: {themFull}, {themOcc}. Good teeth. Decent family."`,
          choices: [
            {
              t: "Agree to a supper with {them}",
              check: {s:"diplomacy",s2:"int",d:34},
              win: {
                r: "Supper goes well. Very well. The matchmaker is unbearable about it for a year.",
                fx: {them:{type:"lover",op:30,back:"lover"},happy:6},
              },
              lose: {
                r: "You spill the stew in {theirHis} lap. {them} is gracious. There is no second supper.",
                fx: {them:{type:"acquaint",op:0},happy:-2},
              },
            },
            {
              t: "Pay for a better match (3 suns)",
              req: p=>p.coin>=3,
              r: "Three suns buys a lot of gossip. The matchmaker finds you someone sweet-tempered and handsome.",
              fx: {coin:-3,lover:!0,happy:4},
            },
            {
              t: "Tell her to mind her own business",
              r: '"Fine. Die alone." She tells everyone you are picky.',
              fx: {happy:-1},
            },
          ],
        },
        {
          id: "fm_old_flame",
          cond: p=>C.adult(p)&&C.hasRel(p,"ex"),
          cool: 10,
          title: "An old flame",
          setup: (p,ctx)=>setPid(p,ctx,relP(p,["ex"])),
          text: p=>`{themFull} is back in {home}. Older, thinner, with the same laugh. ${C.married(p)?"You are married now. That does not stop your heart doing what it does.":"You are free. So, it seems, is {them}."}`,
          choices: [
            {
              t: "Rekindle it",
              r: p=>C.married(p)?"You meet in secret by the old mill. You know exactly how foolish this is.":"It is as if no time has passed, and also as if all of it has.",
              fx: (p,ctx)=>{const t=T(ctx);bump(p,t,30,"lover"),hp(p,8),C.married(p)&&hon(p,-5)},
            },
            {
              t: "Be friends, nothing more",
              r: "You talk for hours about everyone you knew. It is warm and safe and a little sad.",
              fx: {them:{type:"friend",op:25},happy:3},
            },
            {
              t: "Keep your distance",
              r: "You cross the street. Some doors are closed for good reasons.",
              fx: {wil:.8},
            },
          ],
        },
        {
          id: "fm_widow_suitor",
          cond: p=>C.adult(p)&&!C.married(p)&&p.widowed&&A.S.year-p.widowed>=1,
          cool: 6,
          title: "A new suitor",
          setup: (p,ctx)=>setPid(p,ctx,A.makeLoveInterest(p)),
          text: p=>`{themFull}, {themOcc}, has been helping with the ${A.pick(["woodpile","roof","animals","harvest"])} since your ${p.sex==="M"?"wife":"husband"} died. Today {them} stands at your gate with {theirHis} hat in {theirHis} hands, trying to find the words.`,
          choices: [
            {
              t: "Let {themHim} court you",
              r: "It feels like betrayal for a month, then like spring. The dead would want you to live.",
              fx: {them:{type:"lover",op:30,back:"lover"},happy:8},
            },
            {
              t: "Marry for company and a second pair of hands",
              r: "Not a great love. A good one.",
              fx: (p,ctx)=>wed(p,T(ctx))||"It comes to nothing.",
            },
            {
              t: '"Not yet."',
              r: "{them} nods and goes. {them} still chops your wood.",
              fx: {them:{type:"friend",op:15,back:"friend"},wil:1,happy:-2},
            },
          ],
        },
        {
          id: "fm_arranged_match",
          cond: p=>(C.adult(p)||C.teen(p))&&["gentry","noble","royal"].includes(p.status)&&!C.married(p)&&!C.hasRel(p,"betrothed")&&C.parentsAlive(p),
          cool: 6,
          w: 1.2,
          title: "A match is made for you",
          setup: (p,ctx)=>{const t=setPid(p,ctx,mk(p,{sex:loveSex(p),status:p.status==="royal"?"noble":p.status,ageAdj:Math.max(15,C.ageAdj(p)+A.ri(-2,9))}));ctx.house=t.sur||"an old house",ctx.why=A.pick(["to end a forty-year quarrel over a mill and a river","to seal a pact against {enemy}","for a dowry that would clear the family debts","because their lands march with ours","to win a vote on the royal council"])},
          text: (p,ctx)=>`Your family has found you a match: {themFull} of ${ctx.house}, {themAge}, whom you have never met. It is ${ctx.why.replace("{enemy}",A.realmShort(A.enemyRealmOf(p.realm)||p.realm))}. The contracts are drafted. They only need your consent, and that is a courtesy.`,
          choices: [
            {
              t: "Consent, for the family",
              r: "You sign. Your family is pleased with you, perhaps for the first time. {them} sends a stiff, polite letter.",
              fx: {them:{type:"betrothed",op:10,back:"betrothed"},rel:{who:"father",op:12},honor:3,happy:-2},
            },
            {
              t: "Ask to meet {themHim} before you sign",
              check: {s:"diplomacy",s2:"int",d:40},
              win: {
                r: "A careful meeting in a cold hall. {them} is cleverer than you feared and kinder than you hoped. You sign.",
                fx: {them:{type:"betrothed",op:28,back:"betrothed"},happy:4},
              },
              lose: {
                r: "You meet. You do not like each other. The contracts are signed anyway.",
                fx: {them:{type:"betrothed",op:-10,back:"betrothed"},happy:-5},
              },
            },
            {
              t: "Refuse",
              r: "The contracts burn. So does your father's face. Somewhere a house of {house} takes the insult personally.",
              fx: {them:{type:"acquaint",op:-20},rel:{who:"father",op:-20},honor:-3,happy:3,wil:.8},
            },
          ],
        },
        {
          id: "fm_betrothed_meet",
          cond: p=>C.hasRel(p,"betrothed")&&!C.married(p)&&C.ageAdj(p)>=13,
          cool: 6,
          title: "Your betrothed visits",
          setup: (p,ctx)=>setPid(p,ctx,relP(p,["betrothed"])),
          text: "{themFull} comes to stay for a week, with a chaperone, a dog and a great deal of luggage. Everyone watches the two of you like hawks watching mice.",
          choices: [
            {
              t: "Win {themHim} over",
              check: {s:"diplomacy",s2:"int",d:40,bonus:p=>p.looks/6-8},
              win: {
                r: "By the end of the week you are sneaking out to the stables to talk without the chaperone. A good sign.",
                fx: {them:{op:20},happy:6},
              },
              lose: {
                r: "Everything you say comes out wrong. {them} spends the week with the dog.",
                fx: {them:{op:-8},happy:-3},
              },
            },
            {
              t: "Be honest: neither of you chose this",
              r: "A strange relief for both of you. You may not love each other, but you can be allies.",
              fx: {them:{op:12},wil:.5},
            },
            {
              t: "Stay cold and correct",
              r: "Perfect manners and no warmth. {them} writes home that you are a statue.",
              fx: {them:{op:-12}},
            },
          ],
        },
        {
          id: "fm_dowry",
          cond: p=>C.adult(p)&&C.hasRel(p,"betrothed")&&!C.married(p)&&!C.unfree(p),
          cool: 10,
          title: "The dowry talks",
          setup: (p,ctx)=>{setPid(p,ctx,relP(p,["betrothed"])),ctx.amt=10*purse(p)},
          text: p=>{const c=p.cult;return`The two families sit down to settle ${c==="CUL-03"?"the bride price in horses":["CUL-04","CUL-05","CUL-07"].includes(c)?"the marriage gift the Path of the Well requires":p.race==="dwarf"?"the clan contract, clause by clause":p.race==="giant"?"what each hall gives the other at the Thing":"the dowry"}. Your side wants about {amt} suns more than {them}'s side is offering. Somebody's uncle is already shouting.`},
          choices: [
            {
              t: "Haggle hard",
              check: {s:"trade",s2:"diplomacy",d:45},
              win: {
                r: "You win almost every point. Your family glows. {them} is a little cooler at the wedding table.",
                fx: (p,ctx)=>(p.coin+=ctx.amt||10,A.addOp(p,T(ctx),-6),A.trainSkill(p,"trade",1),`(+${ctx.amt||10} suns)`),
              },
              lose: {
                r: "You overreach, and the other side threatens to walk away. You settle for less, and bad feeling.",
                fx: {them:{op:-12},happy:-3},
              },
            },
            {
              t: "Be generous: waive the difference",
              r: "Your family is appalled. {them} is moved. Word gets round that you are not a grasper.",
              fx: {them:{op:15},honor:3,rel:{who:"father",op:-6}},
            },
            {
              t: "Take what is offered",
              r: "Ink, seals, a handshake, and everybody pretends to be pleased.",
              fx: (p,ctx)=>(p.coin+=Math.round((ctx.amt||10)/2),`(+${Math.round((ctx.amt||10)/2)} suns)`),
            },
          ],
        },
        {
          id: "fm_betrothed_wed",
          cond: p=>C.adult(p)&&!C.married(p)&&C.hasRel(p,"betrothed"),
          w: 1.5,
          cool: 3,
          title: "The wedding day",
          setup: (p,ctx)=>{setPid(p,ctx,relP(p,["betrothed"])),ctx.cost=15*purse(p)},
          text: p=>`The day has come to marry {themFull}. ${p.race==="giant"?"The Mothers of both halls have spoken at the Thing.":p.race==="dwarf"?"The Law-Carver has the crucible hot.":p.race==="elf"?"Your kin wonder why there is a day at all; elves need none.":"The May Fair weddings are the luckiest, and it is May."} How grand will it be?`,
          choices: [
            {
              t: "A great wedding ({cost} suns)",
              req: (p,C2,ctx)=>p.coin>=(ctx.cost||30),
              r: "Three days of feasting. Musicians, roast oxen, a fight among the cousins. They will talk about it for years.",
              fx: (p,ctx)=>{const t=T(ctx),s=wed(p,t);return s&&(pay(p,ctx.cost||30),A.fame(p,2),hp(p,6),bump(p,t,10)),s||"At the last moment it all falls apart."},
            },
            {
              t: "A plain wedding",
              r: "Bread, ale, the rite, and home before dark.",
              fx: (p,ctx)=>wed(p,T(ctx))||"At the last moment it all falls apart.",
            },
            {
              t: "Break the betrothal",
              r: "You do the unforgivable thing in front of everyone. {them} leaves white-faced. Your family will not forget.",
              fx: {them:{type:"ex",op:-40},honor:-8,rel:{who:"father",op:-15},happy:-3,wil:1},
            },
          ],
        },
        {
          id: "fm_dwarf_contract",
          cond: p=>C.race(p,"dwarf")&&C.adult(p)&&!C.married(p)&&C.age(p)>=38&&!C.hasRel(p,"betrothed"),
          cool: 10,
          title: "A clan contract",
          setup: (p,ctx)=>{setPid(p,ctx,mk(p,{sex:loveSex(p),ageAdj:C.ageAdj(p)+A.ri(-2,4)}))},
          text: "Your name is carved; you are a full dwarf now, and the clan elders have been busy. They propose {themFull}, {themOcc} of a good clan two galleries down. The contract is forty clauses long and the dowry clause alone takes a page.",
          choices: [
            {
              t: "Sign, and have the names poured",
              r: "You sign, clause by clause.",
              fx: (p,ctx)=>wed(p,T(ctx))||"A clause goes wrong and the contract is torn up.",
            },
            {
              t: "Ask for a season of courtship first",
              check: {s:"diplomacy",s2:"wil",d:40},
              win: {
                r: "The elders grumble, but agree. You and {them} spend the season walking the deep galleries. You like what you find.",
                fx: {them:{type:"betrothed",op:25,back:"betrothed"}},
              },
              lose: {
                r: '"A dwarf who wants courtship like a human." The elders are offended and the match is withdrawn.',
                fx: {them:{type:"acquaint",op:-5},honor:-2},
              },
            },
            {
              t: "Your craft comes first",
              r: "You go back to the forge. The elders note it on your name-stone, in small letters.",
              fx: {skill:{craft:2},happy:-1},
            },
          ],
        },
        {
          id: "fm_dwarf_metal",
          cond: p=>C.race(p,"dwarf")&&C.married(p)&&sinceMarried(p)<=3,
          once: !0,
          title: "Names in metal",
          setup: (p,ctx)=>setPid(p,ctx,spouseOf(p)),
          text: "The Law-Carver comes to pour your names together on the marriage plate, as the Deep Law requires: your name and {them}'s, side by side, forever. The only question is which metal.",
          choices: [
            {
              t: "Iron: honest and plain",
              r: 'Iron it is. "It will rust," says the Law-Carver. "So will we," says {them}.',
              fx: {them:{op:5},honor:1},
            },
            {
              t: "Bronze (10 suns)",
              req: p=>p.coin>=10,
              r: "Bronze, bright as a new pan. The plate hangs in the gallery where every cousin can see it.",
              fx: {coin:-10,them:{op:12},happy:3},
            },
            {
              t: "Silver (40 suns)",
              req: p=>p.coin>=40,
              r: "Silver. The whole clan comes to look. Your names shine in the lamplight like a promise.",
              fx: {coin:-40,them:{op:20},fame:1,happy:5},
            },
          ],
        },
        {
          id: "fm_orc_clan",
          cond: p=>C.race(p,"orc","halforc")&&C.cult(p,"CUL-22","CUL-23")&&C.adult(p)&&!C.married(p)&&C.ageAdj(p)<30,
          cool: 5,
          title: "The clan-mothers decide",
          setup: (p,ctx)=>{setPid(p,ctx,mk(p,{sex:loveSex(p),race:"orc",ageAdj:C.ageAdj(p)+A.ri(-2,3)})),ctx.clan=A.pick(["the Red Wolf","the Broken Tusk","the Long Drum","the Ash Hollow","the Bone Hill"])},
          text: p=>p.sex==="M"?"The clan-mothers have spoken across the fires: you are to marry {themFull} of {clan} clan. Among orcs a husband joins his wife's clan as often as not. Your mother looks at you hard, waiting to see what you will do.":"The clan-mothers have chosen you a husband: {themFull}, a strong young orc of {clan} clan. As often as not the husband joins the wife's clan, and {them}'s mother is not happy to lose a son.",
          choices: [
            {
              t: "Accept the clan-mothers' choice",
              r: "The drums go all night.",
              fx: (p,ctx)=>{const s=wed(p,T(ctx));return s&&p.sex==="M"?(p.flags.clan=ctx.clan,s+` You go to live at ${ctx.clan} fire.`):s||"The match is broken by a feud before the drums can start."},
            },
            {
              t: p=>p.sex==="M"?"Demand she joins YOUR clan":"Insist he joins your clan",
              check: {s:"diplomacy",s2:"wil",d:45},
              win: {
                r: "You argue before the Mothers and win. The match goes ahead on your terms.",
                fx: (p,ctx)=>{const s=wed(p,T(ctx));return A.fame(p,1),s},
              },
              lose: {
                r: "The clan-mothers do not like being argued with. The match is off, and your name is mud at both fires.",
                fx: {them:{type:"acquaint",op:-15},honor:-4,rel:{who:"mother",op:-10}},
              },
            },
            {
              t: "Refuse: you will choose for yourself",
              r: "A thing orcs do sometimes, and always regret in front of their mothers. You are free and in disgrace.",
              fx: {rel:{who:"mother",op:-15},honor:-2,wil:1},
            },
          ],
        },
        {
          id: "fm_elf_no_rite",
          cond: p=>C.race(p,"elf")&&C.married(p),
          once: !0,
          title: "No ceremony",
          setup: (p,ctx)=>setPid(p,ctx,spouseOf(p)),
          text: "Human neighbors keep asking when the wedding will be. You and {them} have been married for a while now: you said so under your birth trees, and that was that. The only real question elves ask is whose line name the children will carry: the mother's or the father's, by the couple's choice.",
          choices: [
            {
              t: "Your line name",
              r: "{them} agrees, with a long look. Your line will carry on.",
              fx: {them:{op:-3},honor:2,flag:"fm_my_line"},
            },
            {
              t: "{them}'s line name",
              r: "A gift that costs you nothing and means everything to {themHim}.",
              fx: {them:{op:15},happy:2},
            },
            {
              t: "Let each child choose at fifty",
              r: "The Keepers raise an eyebrow, but it is allowed. Elves can wait.",
              fx: {them:{op:6},int:.3},
            },
          ],
        },
        {
          id: "fm_giant_thing",
          cond: p=>C.race(p,"giant")&&C.adult(p)&&!C.married(p)&&C.age(p)>=28,
          cool: 6,
          title: "A match at the Thing",
          setup: (p,ctx)=>{setPid(p,ctx,mk(p,{sex:loveSex(p),race:"giant",ageAdj:C.ageAdj(p)+A.ri(-2,3)})),ctx.hall=A.pick(["Helstad","Torfell","Valdhall","Haugberg","Ulfdal"])},
          text: "At the Thing, the Mothers of the halls sit on the turf benches and settle marriages as they settle whale shares. They have named you for {themFull} of {hall}. There are not many giants left. Every match is counted.",
          choices: [
            {
              t: "Accept the Mothers' word",
              r: "The Lore-Chanters sing the two halls together.",
              fx: (p,ctx)=>wed(p,T(ctx))||"A quarrel between the halls breaks the match before the singing.",
            },
            {
              t: "Ask for a different hall",
              check: {s:"diplomacy",s2:"int",d:48},
              win: {
                r: "You make your case well. The Mothers promise to look again next Thing.",
                fx: {them:{type:"acquaint",op:0},flag:"fm_thing_wait"},
              },
              lose: {
                r: "The Mothers look at you the way the sea looks at a boat. The match stands, and they will not ask again.",
                fx: (p,ctx)=>wed(p,T(ctx))||"",
              },
            },
            {
              t: "Refuse before the whole Thing",
              r: "A giant refusing a match while the halls grow empty. The silence is louder than any shout.",
              fx: {honor:-6,wil:1.2,rel:{who:"mother",op:-12}},
            },
          ],
        },
        {
          id: "fm_house_name",
          cond: p=>C.female(p)&&C.married(p)&&C.cult(p,"CUL-02","CUL-11","CUL-13","CUL-12")&&(()=>{const s=spouseOf(p);return s&&s.sur&&s.sur!==p.sur})(),
          once: !0,
          title: "Your husband's name",
          setup: (p,ctx)=>{const s=setPid(p,ctx,spouseOf(p));ctx.hs=s.sur||"his house",ctx.ms=p.sur||"your own"},
          text: `Among the {people} a wife takes her husband's house name. The priest has written you down as "of {hs}" already. Your father still calls you by {ms}.`,
          choices: [
            {
              t: "Take {hs}",
              r: "It feels odd for a year, then natural. {them} is quietly proud.",
              fx: (p,ctx)=>{const s=T(ctx);s&&s.sur&&(p.sur=s.sur,p.surMode=s.surMode),A.addOp(p,s,10)},
            },
            {
              t: "Keep {ms} among your own kin",
              r: "At home you are what you always were. At the rite you are what the priest writes. Two names, one woman.",
              fx: {rel:{who:"father",op:8},them:{op:-4}},
            },
            {
              t: "Refuse it openly",
              r: "The neighbors talk. The priest sighs. {them} shrugs and loves you anyway.",
              fx: {honor:-2,them:{op:-6},wil:.6,trait:"stubborn"},
            },
          ],
        },
        {
          id: "fm_wind_bride",
          cond: p=>C.cult(p,"CUL-03")&&C.adult(p)&&!C.married(p)&&C.ageAdj(p)<32,
          cool: 6,
          title: "A bride of another Wind",
          setup: (p,ctx)=>{setPid(p,ctx,mk(p,{sex:loveSex(p)})),ctx.wind=A.pick(["the Red Wind","the Blue Wind","the Grey Wind","the White Wind"]),ctx.horses=A.ri(4,12)},
          text: p=>p.sex==="M"?"At the summer gathering you have been watching {themFull} of {wind} ride. Her family wants {horses} horses, and a bride keeps her tribe whatever you pay. She would bring her own felt and her own name.":"A young rider of {wind}, {themFull}, has asked your family for you. His family offers {horses} horses. You would keep your tribe, as Wind Rider brides do.",
          choices: [
            {
              t: "Agree, and pay or take the horses",
              r: "The tents go up side by side, door to the south.",
              fx: (p,ctx)=>{const s=wed(p,T(ctx));return s&&(p.sex==="M"?pay(p,(ctx.horses||6)*12):p.coin+=(ctx.horses||6)*12),s||"A feud between the Winds breaks the match."},
            },
            {
              t: "Race {themHim} for it",
              check: {s:"riding",s2:"spd",d:45},
              win: {
                r: "You win by a neck, and {them} laughs and agrees to your terms. Riders like a bride or groom who can ride.",
                fx: (p,ctx)=>{const s=wed(p,T(ctx));return A.fame(p,1),s},
              },
              lose: {
                r: "{them} wins easily, and rides off without you. The whole camp cheers.",
                fx: {them:{type:"friend",op:10,back:"friend"},happy:-3,skill:{riding:1}},
              },
            },
            {t:"Not this summer",r:"There will be other gatherings. There are always horses.",fx:{happy:-1}},
          ],
        },
        {
          id: "fm_quarrel",
          cond: p=>C.adult(p)&&C.married(p),
          w: 1.2,
          cool: 3,
          title: "A quarrel",
          setup: (p,ctx)=>{setPid(p,ctx,spouseOf(p)),ctx.topic=A.pick(["money, again","your mother","who left the gate open and lost the pig","how much you drink","the roof that still leaks","the way you look at the neighbors","the children and who spoils them"])},
          text: "It starts with {topic} and ends with plates. {them} is standing in the doorway with {theirHis} arms folded and that look you know too well.",
          choices: [
            {
              t: "Shout it out to the end",
              r: "The whole lane hears. You are both hoarse by midnight, and it is not settled.",
              fx: {them:{op:-10},happy:-4,wil:.3},
            },
            {
              t: "Apologize first",
              r: `"I was wrong." It costs you a little pride. {them}'s shoulders come down.`,
              fx: {them:{op:8},happy:2,honor:1},
            },
            {
              t: "Talk it through, calmly",
              check: {s:"diplomacy",s2:"int",d:40},
              win: {
                r: "You sit at the table until the candle gutters and actually fix it. A rare thing.",
                fx: {them:{op:12},happy:4,skill:{diplomacy:1}},
              },
              lose: {r:"Calm talk turns into a list of every wrong since the wedding.",fx:{them:{op:-6},happy:-3}},
            },
            {
              t: "Walk out to the alehouse",
              r: "You come back late and the door is barred. You sleep with the goat.",
              fx: {them:{op:-7},happy:-1},
            },
          ],
        },
        {
          id: "fm_household_debt",
          cond: p=>C.adult(p)&&C.married(p)&&!C.rich(p),
          cool: 8,
          title: "The moneylender's list",
          setup: (p,ctx)=>{setPid(p,ctx,spouseOf(p)),ctx.debt=A.ri(8,25),ctx.why=A.pick(["seed corn after the bad spring","a cure from a travelling healer that did not work","dice, in secret","a dowry for {theirHis} sister","cloth for a business that never started"])},
          text: "A moneylender's man knocks with a list. {them} has borrowed {debt} suns for {why}. Interest runs at a penny on the sun each month. {them} looks at the floor.",
          choices: [
            {
              t: "Pay it off now",
              req: (p,C2,ctx)=>p.coin>=(ctx.debt||10),
              r: "You count it out on the table. The man goes. {them} cannot meet your eyes for a week, then cannot stop thanking you.",
              fx: (p,ctx)=>{pay(p,ctx.debt||10),A.addOp(p,T(ctx),10)},
            },
            {
              t: "Work it off together",
              r: "A hard year of extra work, both of you. It binds you closer than the wedding did.",
              fx: {sta:.8,health:-4,them:{op:8},wil:1,happy:-3},
            },
            {
              t: "Rage at {themHim}",
              r: "You say things that will be remembered. The debt is still there in the morning.",
              fx: {them:{op:-18},happy:-5},
            },
            {
              t: "Talk the moneylender down",
              check: {s:"trade",s2:"intrigue",d:48},
              win: {
                r: "You find the hole in his ledger. He settles for half, and is glad to.",
                fx: (p,ctx)=>{pay(p,Math.round((ctx.debt||10)/2)),A.addOp(p,T(ctx),6)},
              },
              lose: {r:"He laughs and adds a fee for your trouble.",fx:(p,ctx)=>{pay(p,(ctx.debt||10)+3),hp(p,-4)}},
            },
          ],
        },
        {
          id: "fm_inlaws",
          cond: p=>C.adult(p)&&C.married(p),
          cool: 8,
          title: "The in-laws",
          setup: (p,ctx)=>{const s=setPid(p,ctx,spouseOf(p));ctx.ilm=A.givenName(s.cult,"F")},
          text: p=>`{them}'s mother, {ilm}, ${A.pick(['has moved in "for a few weeks", with two chests and a cat',"visits every holy day and rearranges your kitchen","tells the whole street how her child married beneath them","has opinions about how you raise the children, the pigs and yourself"])}.`,
          choices: [
            {
              t: "Grit your teeth and be gracious",
              r: "You smile until your face aches. {them} sees what it costs you and loves you for it.",
              fx: {them:{op:10},happy:-4,wil:.8},
            },
            {
              t: "Charm the old dragon",
              check: {s:"diplomacy",s2:"int",d:46},
              win: {
                r: 'Flattery, her favorite cake, and a real question about her youth. She declares you "not so bad". High praise.',
                fx: {them:{op:12},happy:4},
              },
              lose: {r:"She sees straight through you, and says so at supper.",fx:{them:{op:-4},happy:-4}},
            },
            {
              t: "Tell {them} it is them or you",
              r: "{them} is torn in two, and blames you for the tearing.",
              fx: {them:{op:-15},happy:2},
            },
          ],
        },
        {
          id: "fm_spouse_ill",
          cond: p=>C.adult(p)&&C.married(p),
          cool: 7,
          w: .9,
          title: "Fever in the house",
          setup: (p,ctx)=>{setPid(p,ctx,spouseOf(p)),ctx.ill=A.pick(["a marsh fever that comes and goes","a cough that will not leave","a swelling in the belly","the summer flux","a fever after a cut that went bad"]),ctx.cost=6*purse(p)},
          text: "{them} has {ill}. Three days now, burning and shivering in turns. The neighbors bring broth and do not say what they are thinking.",
          choices: [
            {
              t: "Fetch a proper healer ({cost} suns)",
              req: (p,C2,ctx)=>p.coin>=(ctx.cost||12),
              check: {s:"int",s2:"wil",d:25},
              win: {
                r: "The healer knows her trade. Willow bark, clean water, rest. {them} sits up on the seventh day and asks for bread.",
                fx: (p,ctx)=>{pay(p,ctx.cost||12),A.addOp(p,T(ctx),12),hp(p,4)},
              },
              lose: {
                r: "The healer does everything right.",
                fx: (p,ctx)=>{pay(p,ctx.cost||12);const t=T(ctx);return A.chance(.45)?(bury(p,t,ctx.ill||"a fever",30,3),"{them} dies anyway, at dawn, with your hand in {theirHis}."):(A.addOp(p,t,8),"It is not enough to make {themHim} strong again, but enough to keep {themHim} alive.")},
              },
            },
            {
              t: "Nurse {themHim} yourself, day and night",
              check: {s:"medicine",s2:"wil",d:40},
              win: {
                r: "You do not sleep for a week. The fever breaks on the eighth night.",
                fx: {them:{op:18},sta:.5,health:-4,skill:{medicine:2},wil:1},
              },
              lose: {
                r: "You do everything you know.",
                fx: (p,ctx)=>{const t=T(ctx);return A.trainSkill(p,"medicine",1),A.chance(.5)?(bury(p,t,ctx.ill||"a fever",30,3),"It is not enough. You wash {them} yourself and close {theirHis} eyes."):(A.addOp(p,t,10),"Slowly, so slowly, {them} pulls through, thinner and grey.")},
              },
            },
            {
              t: "Pray, and make an offering at the shrine",
              r: "You give what you can and kneel till your knees bleed.",
              fx: (p,ctx)=>{const t=T(ctx);return p.piety=A.clamp(p.piety+4,0,100),A.chance(.3)?(bury(p,t,ctx.ill||"a fever",30,3.5),"{them} dies on the third night of prayer. You do not know who to blame."):(A.addOp(p,t,6),"The fever breaks. You will thank the gods every day of your life.")},
            },
          ],
        },
        {
          id: "fm_spouse_secret",
          cond: p=>C.adult(p)&&C.married(p)&&sinceMarried(p)>=2,
          cool: 12,
          w: .8,
          title: "A secret",
          setup: (p,ctx)=>{setPid(p,ctx,spouseOf(p)),ctx.sec=A.pick(["owes the dice-men of {town} more than your house is worth","was branded a thief in another realm and changed {theirHis} name","has been sending coin to a child from before you met","still prays in secret to the gods of {theirHis} grandmother","has kept every letter from a first love, tied with a ribbon"])},
          text: "You find it by accident, under a loose board. {them}, it turns out, {sec}. {them} comes in and sees what you are holding.",
          choices: [
            {
              t: "Forgive {themHim}, and mean it",
              r: "Everyone has a loose board somewhere. You put it back. {them} weeps with relief.",
              fx: {them:{op:15},wil:.8,happy:-2},
            },
            {
              t: "Demand the whole truth",
              check: {s:"int",s2:"diplomacy",d:40},
              win: {
                r: "It all comes out, every bit. It is worse than you thought, and better for being said.",
                fx: {them:{op:5},wil:1,int:.3},
              },
              lose: {r:"{them} tells you half and lies about the rest. You both know it.",fx:{them:{op:-12},happy:-5}},
            },
            {
              t: "Say nothing, and remember it",
              r: "You put the board back and never mention it. You hold it like a knife, just in case.",
              fx: {them:{op:-6},skill:{intrigue:2},trait:"cynical"},
            },
          ],
        },
        {
          id: "fm_spouse_ambition",
          cond: p=>C.adult(p)&&C.married(p)&&!C.unfree(p),
          cool: 10,
          title: "A spouse's dream",
          setup: (p,ctx)=>{setPid(p,ctx,spouseOf(p)),ctx.dream=A.pick(["open a cookshop by the market cross","buy a share in a river barge","learn to read and keep accounts","move to {capital} where the money is","breed mules for the caravans"]),ctx.cost=8*purse(p)},
          text: "{them} has a dream and has been working up the nerve to say it: to {dream}. It needs about {cost} suns, and your blessing.",
          choices: [
            {
              t: "Back {themHim} with the money ({cost} suns)",
              req: (p,C2,ctx)=>p.coin>=(ctx.cost||16),
              r: "You hand over the purse.",
              fx: (p,ctx)=>{const c=pay(p,ctx.cost||16);return A.addOp(p,T(ctx),20),A.chance(.55)?(p.coin+=Math.round(c*2),hp(p,5),`It works. Within two years it has paid you back twice over. (+${Math.round(c*2)} suns)`):(hp(p,-3),"It fails, honestly and completely. {them} never forgets that you believed in {themHim}.")},
            },
            {
              t: "Help with your own hands instead",
              r: "No money, but your evenings and your sweat. It grows slowly, but it grows.",
              fx: {them:{op:12},sta:.4,skill:{trade:1,craft:1}},
            },
            {
              t: '"We cannot afford dreams."',
              r: "{them} goes quiet. Something closes behind {theirHis} eyes.",
              fx: {them:{op:-14},coin:0},
            },
          ],
        },
        {
          id: "fm_temptation",
          cond: p=>C.adult(p)&&C.married(p)&&!C.hasRel(p,"lover")&&C.ageAdj(p)<55,
          cool: 8,
          title: "Temptation",
          setup: (p,ctx)=>{setPid(p,ctx,A.makeLoveInterest(p)),ctx.where=A.pick(["at the mill","at the harvest dance","on the long road to market","in the lord's kitchens","on the night watch"])},
          text: "{themFull} has been finding reasons to be near you {where}. Tonight {them} stands too close and says, quietly, that {spouse} need never know.",
          choices: [
            {
              t: "Step back, and go home",
              r: "You go home and hold {spouse} a little longer than usual.",
              fx: {honor:2,wil:.8,rel:{who:"spouse",op:4}},
            },
            {
              t: "Give in",
              r: "It begins. You tell yourself it means nothing. That is the first lie.",
              fx: {them:{type:"lover",op:30,back:"lover"},honor:-5,happy:5,flag:"fm_affair"},
            },
            {
              t: "Tell {spouse} about it",
              r: "{spouse} is angry, then grateful, then very attentive.",
              fx: {rel:{who:"spouse",op:8},them:{type:"rival",op:-15},honor:2},
            },
          ],
        },
        {
          id: "fm_affair_found",
          cond: p=>C.adult(p)&&C.married(p)&&C.hasRel(p,"lover"),
          cool: 4,
          w: 1.4,
          title: "Found out",
          setup: (p,ctx)=>{setPid(p,ctx,spouseOf(p));const l=relP(p,["lover"]);ctx.lovid=l?l.id:"",ctx.lov=l?l.given:"your lover"},
          text: "{them} found the {lov} business out. A neighbor, a ribbon, a lie that did not hold. {them} is sitting at the cold hearth, waiting for you.",
          choices: [
            {
              t: "Confess, and end the affair",
              r: "You tell the truth and end it with {lov}. {them} does not forgive you, not yet. But {them} does not leave.",
              fx: (p,ctx)=>{const l=A.P(ctx.lovid);bump(p,l,-25,"ex"),A.addOp(p,T(ctx),-22),hp(p,-8),A.willGrow(p,1,"shame")},
            },
            {
              t: "Deny everything",
              check: {s:"intrigue",s2:"int",d:52},
              win: {
                r: "You lie well. {them} wants to believe you, so {them} does. For now.",
                fx: {them:{op:-6},honor:-3,skill:{intrigue:1}},
              },
              lose: {
                r: "The lie is worse than the truth. {them} throws your things into the lane.",
                fx: {them:{op:-40},honor:-6,happy:-10},
              },
            },
            {
              t: "Leave {them} for {lov}",
              r: "You choose.",
              fx: (p,ctx)=>{const l=A.P(ctx.lovid);if(faithForbidsDivorce(p))return A.addOp(p,T(ctx),-50),hon(p,-8),"But the Temple will not dissolve a marriage. You live apart from {them}, married in name, and {lov} waits for a wedding that cannot happen.";divorce(p),hp(p,-4);const s=wed(p,l);return s?"The marriage to {them} is ended. "+s:"You leave {them}, but {lov} does not take you in."},
            },
          ],
        },
        {
          id: "fm_spouse_affair",
          cond: p=>C.adult(p)&&C.married(p)&&sinceMarried(p)>=2,
          cool: 12,
          w: .6,
          title: "The other one",
          setup: (p,ctx)=>{setPid(p,ctx,spouseOf(p)),ctx.other=A.pick(["the blacksmith","a travelling cloth merchant","your own cousin","the reeve's youngest","a soldier billeted in {town}"])},
          text: "You come home early and you know at once. {them} and {other}. The excuses start before the door has closed.",
          choices: [
            {
              t: "Forgive",
              r: "It takes a year to stop picturing it. You do it anyway, for the life you built.",
              fx: {them:{op:10},happy:-12,wil:2},
            },
            {
              t: "Go and find {other}",
              check: {s:"str",s2:"unarmed",d:42},
              win: {
                r: "One punch and a promise. {other} leaves {home} within the week.",
                fx: {them:{op:-10},happy:-6,honor:1,wil:1},
              },
              lose: {
                r: "You end up in the mud with a split lip, and the whole village knows the story by noon.",
                fx: {them:{op:-14},happy:-10,health:-6,cause:"a brawl",wil:1.5},
              },
            },
            {
              t: "Set {themHim} aside",
              r: "You are done.",
              fx: p=>{if(faithForbidsDivorce(p)){const s=spouseOf(p);return A.addOp(p,s,-40),hp(p,-10),"The Temple will not end a marriage. You sleep in separate rooms for the rest of your lives."}return divorce(p),hp(p,-8),A.willGrow(p,1.5,"grief"),"You put {them} out of the house and out of your life."},
            },
            {
              t: "Repay it in kind",
              r: "You find your own comfort. Two wrongs and no rights.",
              fx: {lover:!0,honor:-4,them:{op:-10}},
            },
          ],
        },
        {
          id: "fm_reconcile",
          cond: p=>C.adult(p)&&C.married(p)&&relOp(p,spouseOf(p))<25,
          cool: 5,
          w: 1.3,
          title: "A cold house",
          setup: (p,ctx)=>setPid(p,ctx,spouseOf(p)),
          text: "You and {them} have been sleeping back to back for months. Meals are silent. The neighbors have stopped asking. Something has to change.",
          choices: [
            {
              t: "A gift and an apology (3 suns)",
              req: p=>p.coin>=3,
              r: "A good shawl and words you have rehearsed for a week. {them} cries, and holds you.",
              fx: {coin:-3,them:{op:20},happy:6},
            },
            {
              t: "Take {themHim} walking, like when you were courting",
              check: {s:"diplomacy",s2:"wil",d:38},
              win: {
                r: "Up the old path to the hill. By the top you are laughing about nothing. By the bottom you are holding hands.",
                fx: {them:{op:22},happy:8},
              },
              lose: {r:"Halfway up the old path you start the old argument.",fx:{them:{op:-5},happy:-3}},
            },
            {
              t: "Ask the priest to speak to you both",
              r: "{faith} has counsel for marriages. Most of it is: be kind, every day. It helps a little.",
              fx: {them:{op:10},piety:2},
            },
            {
              t: "Let it be",
              r: "Some houses stay cold. You find your warmth elsewhere: work, friends, ale.",
              fx: {them:{op:-5},wil:.5,happy:-3},
            },
          ],
        },
        {
          id: "fm_old_together",
          cond: p=>C.old(p)&&C.married(p),
          cool: 5,
          w: 1.2,
          title: "Growing old together",
          setup: (p,ctx)=>setPid(p,ctx,spouseOf(p)),
          text: p=>`You and {them} sit on the bench by the door in the evening sun. ${p.race==="elf"?"Centuries together.":"Grey heads, stiff knees."} {them} has dozed off with {theirHis} hand on yours. You remember the first time you saw {themHim}.`,
          choices: [
            {
              t: "Wake {themHim} and talk about the old days",
              r: "You laugh about the wedding, the leaky roof, the year of the pig. A whole life, retold in an evening.",
              fx: {them:{op:10},happy:8},
            },
            {
              t: "Dance at the next festival, stiff knees or not",
              r: "You dance one slow round, and the young ones clap. Your back pays for a week.",
              fx: {them:{op:12},happy:10,health:-2},
            },
            {
              t: "Let {themHim} sleep, and keep watch",
              r: "You sit until the stars come out, just looking. That is enough.",
              fx: {them:{op:5},happy:5,wil:.5},
            },
          ],
        },
        {
          id: "fm_widowhood",
          cond: p=>C.adult(p)&&!C.married(p)&&p.widowed&&A.S.year-p.widowed<=2,
          cool: 20,
          w: 2,
          title: "An empty bed",
          setup: (p,ctx)=>{ctx.dead=(()=>{const r=A.relsOf(p,["spouse"]).find(x=>!x.p.alive);return r?r.p.given:"your love"})()},
          text: p=>`{dead} has been gone some months. You still set two bowls. You still turn to say something and find the chair empty. ${aft(p)}`,
          choices: [
            {
              t: "Throw yourself into work",
              r: "You work until you drop, every day. The grief does not go. It just has less room.",
              fx: {wil:2.2,sta:.6,happy:-4,perf:5},
            },
            {
              t: "Lean on family and friends",
              r: "They come with food and stay for the silences. You are not alone, even now.",
              fx: {wil:1.5,happy:4,rel:{who:"child",op:8,all:!0}},
            },
            {
              t: "Visit the grave every day",
              r: "You talk to {dead} as if nothing has changed. Slowly, very slowly, you begin to say goodbye.",
              fx: {wil:2,piety:3,happy:-2},
            },
            {
              t: "Drink until it stops",
              r: "It does not stop. You stop, after a year, because {dead} would have hated it.",
              fx: {wil:1.5,health:-8,cause:"drink",happy:-5},
            },
          ],
        },
        {
          id: "fm_childless",
          cond: p=>C.adult(p)&&C.married(p)&&!(p.children||[]).length&&sinceMarried(p)>=3&&C.ageAdj(p)<46,
          cool: 6,
          title: "An empty cradle",
          setup: (p,ctx)=>setPid(p,ctx,spouseOf(p)),
          text: "Years married and no child. The neighbors count the months for you. {them}'s mother brings charms. At night {them} says it does not matter, and you both know it does.",
          choices: [
            {
              t: "Go on pilgrimage and pray for a child (3 suns)",
              req: p=>p.coin>=3,
              r: "A long road, an old shrine, a night of prayer side by side. You come home lighter, whatever happens.",
              fx: (p,ctx)=>{pay(p,3),p.piety=A.clamp(p.piety+5,0,100),p.flags.tryChild=A.S.year,delete p.flags.noChildren,A.addOp(p,T(ctx),8)},
            },
            {
              t: "Take in an orphan",
              r: "There is always a child with no one.",
              fx: (p,ctx)=>{const c=mk(p,{ageAdj:A.ri(2,7)});return addChild(p,c,50),hp(p,10),A.addOp(p,T(ctx),10),`${c.given}, ${A.age(c)}, comes home with you, all eyes and elbows. ${c.sex==="M"?"He":"She"} is yours now.`},
            },
            {
              t: "Accept it, and live for each other",
              r: "You decide not to grieve what never was. The house is quiet. It is also yours.",
              fx: {them:{op:12},wil:1.2,happy:2},
            },
          ],
        },
        {
          id: "fm_mixed_neighbors",
          cond: p=>C.adult(p)&&!!mixedSpouse(p),
          cool: 7,
          title: "Talk in the lane",
          setup: (p,ctx)=>{const s=setPid(p,ctx,mixedSpouse(p));ctx.sr=GD.RACES[s.race].adj},
          text: "Someone has chalked an insult on your door about your {themRace} {hw}. At the well, the talk stops when you come near. {them} pretends not to notice. {them} notices.",
          choices: [
            {
              t: "Find who did it and make them pay",
              check: {s:"str",s2:"ins",d:42},
              win: {
                r: "You find the chalk on a lout's hands and knock him into the trough. Nobody chalks your door again.",
                fx: {them:{op:14},honor:2,wil:.6},
              },
              lose: {
                r: "He has three brothers. You come home bloodied, and {them} washes your cuts in silence.",
                fx: {them:{op:10},health:-8,cause:"a beating",wil:1.2},
              },
            },
            {
              t: "Hold your head high and say nothing",
              r: "You walk to the well together every day, arm in arm, until the staring gets boring.",
              fx: {them:{op:10},wil:1.5,honor:2},
            },
            {
              t: "Move to {town}, where nobody knows you",
              req: p=>p.coin>=10,
              r: "A fresh start costs ten suns and an old life.",
              fx: {coin:-10,them:{op:12},happy:2},
            },
          ],
        },
        {
          id: "fm_spouse_faith",
          cond: p=>C.adult(p)&&C.married(p)&&(()=>{const s=spouseOf(p);return s&&s.faith!==p.faith})(),
          cool: 12,
          title: "Two faiths, one house",
          setup: (p,ctx)=>{const s=setPid(p,ctx,spouseOf(p));ctx.myf=fname(p),ctx.thf=(A.faith(s.faith)||{}).name||"the old gods"},
          text: "You keep {myf}; {them} keeps {thf}. It was easy when it was just the two of you. Now a priest is asking whose rite the household will follow.",
          choices: [
            {
              t: "Yours: {myf}",
              r: "{them} agrees, but keeps a small shrine of {theirHis} own in the corner. You let it be.",
              fx: {them:{op:-8},piety:3},
            },
            {
              t: "{them}'s: {thf}",
              r: "You learn new prayers and new feasts. Your own priest stops greeting you.",
              fx: {them:{op:15},piety:-3},
            },
            {
              t: "Both, and let the gods sort it out",
              r: "Twice the feasts, twice the fasts, and two priests glaring at each other at every naming.",
              fx: {them:{op:8},happy:2,piety:-1},
            },
          ],
        },
        {
          id: "fm_child_fever",
          cond: p=>C.adult(p)&&hasKid(p,0,10),
          cool: 4,
          w: 1.3,
          title: "A child's fever",
          setup: (p,ctx)=>{const c=setPid(p,ctx,A.pick(kidsOf(p,0,10)));ctx.ill=A.pick(["the summer flux","a winter cough that rattles","a spotted fever going round {home}","a burning fever with no name"]),ctx.cost=4*purse(p)},
          text: "Your {sd} {them} has {ill}. Small, hot, too quiet. Two children on your street have already been buried this season.",
          choices: [
            {
              t: "Fetch the healer ({cost} suns)",
              req: (p,C2,ctx)=>p.coin>=(ctx.cost||8),
              check: {s:"int",s2:"wil",d:22},
              win: {
                r: "The healer stays all night. Clean water, honey, a cool cloth. By the third day {them} is demanding porridge.",
                fx: (p,ctx)=>{pay(p,ctx.cost||8),A.addOp(p,T(ctx),10),hp(p,5)},
              },
              lose: {
                r: "The healer does everything she knows.",
                fx: (p,ctx)=>{pay(p,ctx.cost||8);const c=T(ctx);return A.chance(.5)?(bury(p,c,ctx.ill||"a fever",35,3.5),"On the fourth night {them} stops breathing. You hold the small body until morning."):"It is close, terribly close, but {them} lives."},
              },
            },
            {
              t: "Nurse {themHim} yourself",
              check: {s:"medicine",s2:"wil",d:35},
              win: {
                r: "Broth, cool water, no sleep. On the fifth night the fever breaks and {them} sleeps like a stone.",
                fx: {them:{op:15},skill:{medicine:2},wil:.8,happy:4},
              },
              lose: {
                r: "You do everything a parent can do.",
                fx: (p,ctx)=>{const c=T(ctx);return A.chance(.5)?(bury(p,c,ctx.ill||"a fever",35,3.5),"It is not enough. You wrap {them} in your own shirt for the burial."):(A.trainSkill(p,"medicine",1),"{them} lives, thin as a sparrow, and you do not let {themHim} out of your sight for a year.")},
              },
            },
            {
              t: "Pray and hang charms over the cradle",
              r: "Charms, prayers, a candle that burns all night.",
              fx: (p,ctx)=>{const c=T(ctx);return p.piety=A.clamp(p.piety+3,0,100),A.chance(.3)?(bury(p,c,ctx.ill||"a fever",35,3.5),"The candle burns out at dawn, and so does {them}."):(A.addOp(p,c,5),"The fever breaks. You will light that candle every year.")},
            },
          ],
        },
        {
          id: "fm_newborn_rite",
          cond: p=>C.adult(p)&&hasKid(p,0,1),
          cool: 2,
          w: 1.5,
          title: "The naming rite",
          setup: (p,ctx)=>setPid(p,ctx,A.pick(kidsOf(p,0,1))),
          text: (p,ctx)=>{const c=T(ctx),rite=p.faith==="REL-07"?"On the eighth day, a drop of well water on the tongue, as the Path of the Well requires.":p.faith==="REL-04"?c&&c.race==="halfelf"?"Elves name a child under its birth tree. A half-elf gets no tree, and the Keepers do not come.":"The name is cut into the bark of the birth tree, so the tree will keep it.":p.faith==="REL-09"?"The Rememberers must hear the name, so it can join the line.":p.faith==="REL-05"?"The child gets a milk-name now; the true name will be carved at thirty.":`The ${fname(p)} has its rite for a new child, and the family expects a feast.`;return`Your new ${kidWord(c)}, {them}. ${rite}`},
          choices: [
            {
              t: "A big feast for the whole street (6 suns)",
              req: p=>p.coin>=6,
              r: "The whole street eats and drinks to {them}. Gifts pile up: a spoon, a blanket, a wooden horse.",
              fx: {coin:-6,happy:8,honor:2,them:{op:5}},
            },
            {
              t: "A quiet rite, just family",
              r: "Just family, a prayer, a cake. {them} sleeps through all of it.",
              fx: {happy:5,piety:2},
            },
            {
              t: (p,ctx)=>p.faith==="REL-04"&&T(ctx)&&T(ctx).race==="halfelf"?"Plant a tree for {themHim} yourself":"Name {themHim} after a grandparent",
              r: (p,ctx)=>p.faith==="REL-04"&&T(ctx)&&T(ctx).race==="halfelf"?"You plant an oak sapling by the door, Keepers or no Keepers. It is {them}'s tree now.":"The old name lives again. The grandparents weep.",
              fx: {happy:6,rel:{who:"mother",op:8},wil:.3},
            },
          ],
        },
        {
          id: "fm_child_talent",
          cond: p=>C.adult(p)&&hasKid(p,6,15),
          cool: 7,
          title: "A gift in the child",
          setup: (p,ctx)=>{setPid(p,ctx,A.pick(kidsOf(p,6,15)));const t=A.pick([["sings so true the priest stops to listen","music"],["scratches letters in the dirt and copies the inn sign perfectly","learning"],["hits a crow with a sling stone at forty paces","bow"],["carves animals from firewood that look ready to run","craft"],["counts the market prices in {theirHis} head faster than the merchants","trade"],["can calm any horse in the village","riding"]]);ctx.tal=t[0],ctx.sk=t[1],ctx.cost=5*purse(p)},
          text: "Your {sd} {them} {tal}. People are starting to notice. A gift like that can lift a family, or wither for want of feeding.",
          choices: [
            {
              t: "Pay for a proper teacher ({cost} suns)",
              req: (p,C2,ctx)=>p.coin>=(ctx.cost||10),
              r: "You find the best teacher in {town}. {them} blossoms.",
              fx: (p,ctx)=>{pay(p,ctx.cost||10);const c=T(ctx);c&&(c.skills=c.skills||{},c.skills[ctx.sk]=(c.skills[ctx.sk]||0)+12,A.addOp(p,c,15)),hp(p,5)},
            },
            {
              t: "Teach {themHim} what you can yourself",
              r: "Evenings together by the fire. You learn as much as {them} does.",
              fx: (p,ctx)=>{const c=T(ctx);c&&(c.skills=c.skills||{},c.skills[ctx.sk]=(c.skills[ctx.sk]||0)+5,A.addOp(p,c,12)),A.trainSkill(p,ctx.sk||"learning",1)},
            },
            {
              t: `"Fancies don't fill bellies."`,
              r: "{them} goes back to the chores. You see {themHim} sometimes, alone, still at it.",
              fx: {them:{op:-12}},
            },
          ],
        },
        {
          id: "fm_child_lost",
          cond: p=>C.adult(p)&&hasKid(p,4,11),
          cool: 8,
          title: "Missing",
          setup: (p,ctx)=>{setPid(p,ctx,A.pick(kidsOf(p,4,11))),ctx.where=C.terr(p,"forest")?"the forest":C.coast(p)?"the shore at low tide":C.town(p)?"the market crowds":"the fields by the river"},
          text: "Your {sd} {them} went to {where} after noon and has not come back. It will be dark in an hour.",
          choices: [
            {
              t: "Search yourself, now",
              check: {s:"survival",s2:"ins",d:35},
              win: {
                r: "You find {themHim} asleep in a hollow, quite pleased with {themHim}self. You do not let go of {theirHis} hand all the way home.",
                fx: {them:{op:10},skill:{survival:1},happy:4},
              },
              lose: {
                r: "You search all night. At dawn a shepherd brings {them} home, cold and frightened but whole. You are worse off than {them} is.",
                fx: {health:-4,sta:.4,wil:1},
              },
            },
            {
              t: "Raise the whole village",
              r: "Torches, dogs, every neighbor. They find {themHim} by midnight. You owe them all a drink, and pay it gladly.",
              fx: {coin:-2,honor:2,happy:3},
            },
            {
              t: "Pray, and wait by the door",
              r: "You wait. At last {them} wanders home, muddy and singing. You have aged five years.",
              fx: {piety:2,wil:1.2,happy:-2},
            },
          ],
        },
        {
          id: "fm_child_question",
          cond: p=>C.adult(p)&&hasKid(p,5,13),
          cool: 9,
          title: "Where do the dead go?",
          setup: (p,ctx)=>{setPid(p,ctx,A.pick(kidsOf(p,5,13))),ctx.aft=aft(p)},
          text: 'An old neighbor died this week. At supper your {sd} {them} puts down {theirHis} spoon and asks: "Where did old {npcM} go? Will you go there too?"',
          choices: [
            {
              t: "Tell {themHim} what {faith} teaches",
              r: '"{aft}" {them} thinks about it for a long time, and nods.',
              fx: {them:{op:6},piety:2},
            },
            {
              t: `"I don't know. Nobody really knows."`,
              r: "Honest, and frightening. {them} sleeps in your bed that night.",
              fx: {them:{op:8},int:.3},
            },
            {
              t: "Tell a story about the old neighbor instead",
              r: "You tell how {npcM} once fell in the duck pond at a wedding. {them} laughs until {theirHis} nose runs. A good way to remember someone.",
              fx: {them:{op:10},happy:3},
            },
          ],
        },
        {
          id: "fm_rebel_teen",
          cond: p=>C.adult(p)&&hasKid(p,13,17),
          cool: 6,
          title: "A rebel in the house",
          setup: (p,ctx)=>{setPid(p,ctx,A.pick(kidsOf(p,13,17))),ctx.what=A.pick(["running with a gang of roof-runners","sneaking off to see someone you have forbidden","refusing to set foot in the temple","talking about running away to sea","calling you a coward to your face in front of the neighbors"])},
          text: "Your {sd} {them} has been {what}. Doors slam. Food is left uneaten. {them} looks at you as if you were a jailer.",
          choices: [
            {
              t: "Lay down the law",
              check: {s:"wil",s2:"command",d:45},
              win: {
                r: "{them} sulks for a season, then grows out of it. Years later {them} thanks you, grudgingly.",
                fx: {them:{op:-4},skill:{command:1}},
              },
              lose: {
                r: "{them} climbs out the window that night. Comes back a week later, thinner, and colder to you.",
                fx: {them:{op:-18},happy:-6,wil:.8},
              },
            },
            {
              t: "Listen. Really listen.",
              check: {s:"diplomacy",s2:"int",d:40},
              win: {
                r: "It comes out at last: fear, a cruel friend, a broken heart. You sit together until the fire dies.",
                fx: {them:{op:18},happy:4},
              },
              lose: {r:`"You don't understand anything!" Maybe {them} is right.`,fx:{them:{op:-5}}},
            },
            {
              t: "Let {themHim} learn the hard way",
              r: "The world teaches {them} what you could not. It is a rough school, but {them} comes back wiser.",
              fx: {them:{op:4},wil:.6,happy:-3},
            },
          ],
        },
        {
          id: "fm_apprentice",
          cond: p=>C.adult(p)&&!C.noble(p)&&hasKid(p,11,16),
          cool: 8,
          title: "An apprenticeship",
          setup: (p,ctx)=>{setPid(p,ctx,A.pick(kidsOf(p,11,16))),ctx.master=p.race==="dwarf"?"a master smith of the hold, for twenty-five years":A.pick(["a smith in {town}","a weaver with four looms","a carpenter who builds boats","a scribe at the temple","a merchant of the river trade"]),ctx.fee=6*purse(p)},
          text: p=>`Your {sd} {them} is old enough to learn a trade. {master} will take {themHim}, for a fee of {fee} suns.${p.race==="dwarf"?" Among dwarves an apprenticeship is half a human life.":" Seven years of bed, board and beatings."}`,
          choices: [
            {
              t: "Pay the fee ({fee} suns)",
              req: (p,C2,ctx)=>p.coin>=(ctx.fee||12),
              r: "{them} goes off with a bundle and a brave face. In a few years {them} will earn more than you.",
              fx: (p,ctx)=>{pay(p,ctx.fee||12);const c=T(ctx);c&&(c.occ="an apprentice",A.addOp(p,c,8)),hp(p,3)},
            },
            {
              t: "Keep {themHim} at home to work with you",
              r: "Another pair of hands at home. {them} learns your trade, for better or worse.",
              fx: {them:{op:2},coin:3},
            },
            {
              t: "Give {themHim} to the temple",
              r: "{faith} will feed and teach {themHim}, and {them} will belong to it.",
              fx: {piety:5,them:{op:-6}},
            },
          ],
        },
        {
          id: "fm_halfblood_kid",
          cond: p=>C.adult(p)&&(p.children||[]).some(id=>{const c=A.P(id);return c&&c.alive&&["halforc","halfelf"].includes(c.race)&&C.ageAdj(c)>=5&&C.ageAdj(c)<16}),
          cool: 6,
          title: "Half and half",
          setup: (p,ctx)=>{const c=setPid(p,ctx,A.pick(kidsOf(p,5,16).filter(k=>["halforc","halfelf"].includes(k.race))));ctx.jeer=c&&c.race==="halforc"?'"tusk-face" and "pig-blood"':'"tree-bastard" and "neither-nor"'},
          text: 'Your {sd} {them} comes home with a torn shirt and a split lip. The other children call {themHim} {jeer}. "What AM I?" {them} asks you, furious and crying.',
          choices: [
            {
              t: "Teach {themHim} to fight back",
              r: "You teach {themHim} how to stand, how to punch, and when not to. Nobody calls {themHim} names twice.",
              fx: {them:{op:10},skill:{unarmed:1},wil:.3},
            },
            {
              t: "Go and talk to the other parents",
              check: {s:"diplomacy",s2:"wil",d:42},
              win: {
                r: "You shame them in front of the priest. The name-calling stops, at least where adults can hear.",
                fx: {them:{op:12},honor:2},
              },
              lose: {r:"The other parents say worse things than their children did.",fx:{them:{op:5},happy:-6,wil:1}},
            },
            {
              t: 'Tell {themHim}: "Both. You are both, and that is more."',
              r: "You tell {themHim} the story of how you met {theirHis} other parent. {them} listens, and stands a little straighter.",
              fx: {them:{op:16},happy:3},
            },
          ],
        },
        {
          id: "fm_child_wedding",
          cond: p=>C.adult(p)&&(p.children||[]).some(id=>{const c=A.P(id);return c&&c.alive&&A.isAdult(c)&&!spouseOf(c)}),
          cool: 6,
          title: "A child to marry",
          setup: (p,ctx)=>{setPid(p,ctx,A.pick((p.children||[]).map(A.P).filter(c=>c&&c.alive&&A.isAdult(c)&&!spouseOf(c)))),ctx.cost=10*purse(p)},
          text: "Your {sd} {them} is grown, and {home} has opinions about it. There are offers from two families. {them} has an opinion too, and it is neither.",
          choices: [
            {
              t: "Arrange a good match, with a dowry ({cost} suns)",
              req: (p,C2,ctx)=>p.coin>=(ctx.cost||20),
              r: "A sound family, a fat dowry, a feast that empties your purse.",
              fx: (p,ctx)=>{const c=T(ctx);if(!c||spouseOf(c))return;pay(p,ctx.cost||20);const sx=c.sex==="M"?"F":"M",s2=mk(c,{sex:sx,ageAdj:C.ageAdj(c)+A.ri(-2,3),status:c.status});return c.spouse=s2.id,s2.spouse=c.id,A.link(c,s2,"spouse",30,"spouse"),A.link(p,s2,"inlaw",25,"inlaw"),A.addOp(p,c,-5),hp(p,6),A.fame(p,1),`${c.given} marries ${A.fullName(s2)}. ${c.given} is dutiful about it.`},
            },
            {
              t: "Let {themHim} choose for {themHim}self",
              r: "{them} chooses, and brings home someone you would never have picked.",
              fx: (p,ctx)=>{const c=T(ctx);if(!c||spouseOf(c))return;const sx=c.sex==="M"?"F":"M",s2=mk(c,{sex:sx,ageAdj:C.ageAdj(c)+A.ri(-3,3),status:A.pick(["peasant","artisan",c.status])});return c.spouse=s2.id,s2.spouse=c.id,A.link(c,s2,"spouse",60,"spouse"),A.link(p,s2,"inlaw",10,"inlaw"),A.addOp(p,c,18),hp(p,4),`${c.given} marries ${A.fullName(s2)}, ${s2.occ||"a nobody"}, and is radiant.`},
            },
            {
              t: "Forbid it all; {them} is needed at home",
              r: "{them} stays, and resents every year of it.",
              fx: {them:{op:-20},coin:2},
            },
          ],
        },
        {
          id: "fm_child_war",
          cond: p=>C.adult(p)&&C.atWar(p)&&hasKid(p,16,40),
          cool: 6,
          title: "A child goes to war",
          setup: (p,ctx)=>{setPid(p,ctx,A.pick(kidsOf(p,16,40)))},
          text: "The war against {enemy} has reached {home}. Your {sd} {them} has taken the levy's coin, or volunteered, it hardly matters which. {them} leaves with the company at dawn.",
          choices: [
            {
              t: "Buy {themHim} a good helmet and jack (25 suns)",
              req: p=>p.coin>=25,
              r: "You buy the best you can.",
              fx: (p,ctx)=>{pay(p,25);const c=T(ctx);return A.addOp(p,c,10),A.chance(.12)?(bury(p,c,"wounds taken against "+A.realmShort(A.enemyRealmOf(p.realm)||p.realm),30,3),"A year later a sergeant brings back the helmet, dented, and nothing else. {them} died well, he says. It does not help."):"A year later {them} walks home with a scar and a stoop and the helmet under one arm. You burn a candle for every one of {theirHis} comrades who did not."},
            },
            {
              t: "Beg {themHim} to hide in the hills",
              check: {s:"diplomacy",s2:"wil",d:50},
              win: {
                r: "{them} goes into the hills until the levy has passed. A coward's name, maybe. But alive.",
                fx: {them:{op:-5},honor:-4,happy:4},
              },
              lose: {
                r: "{them} goes anyway, and leaves angry.",
                fx: (p,ctx)=>{const c=T(ctx);return A.addOp(p,c,-10),A.chance(.22)?(bury(p,c,"the war",30,3),"You never see {themHim} again. The last thing you did was quarrel."):"Two years later {them} comes back, hard and quiet, and does not speak of the war, or of that morning."},
              },
            },
            {
              t: "Bless {themHim} and let {themHim} go",
              r: "You give {themHim} your blessing and your old knife.",
              fx: (p,ctx)=>{const c=T(ctx);return A.addOp(p,c,12),A.chance(.2)?(bury(p,c,"the war",30,3),"The knife comes back without {themHim}. You keep it on the wall for the rest of your life."):(hp(p,4),"{them} comes home with the knife and a war story for every winter of your old age.")},
            },
          ],
        },
        {
          id: "fm_child_leaves",
          cond: p=>C.adult(p)&&hasKid(p,17,30),
          cool: 9,
          title: "Leaving home",
          setup: (p,ctx)=>{setPid(p,ctx,A.pick(kidsOf(p,17,30)))},
          text: p=>`Your {sd} {them} wants to leave for ${A.pick([A.realm(p.realm)?A.realm(p.realm).capital:"the capital","the coast, to go to sea","the far side of the realm with a caravan","a lord's service in {town}"])}. {them} has packed already. {them} just wants your blessing.`,
          choices: [
            {
              t: "Give your blessing, and a purse (5 suns)",
              req: p=>p.coin>=5,
              r: "You press the purse into {theirHis} hand. {them} hugs you so hard your ribs creak, and goes.",
              fx: {coin:-5,them:{op:15},happy:-2,wil:.5},
            },
            {
              t: "Ask {themHim} to stay one more year",
              check: {s:"diplomacy",s2:"wil",d:42},
              win: {
                r: "{them} stays. It is a good year. Then {them} goes, with your blessing.",
                fx: {them:{op:6},happy:4},
              },
              lose: {r:"{them} goes the next morning without saying goodbye.",fx:{them:{op:-15},happy:-8}},
            },
            {
              t: "Say nothing at all",
              r: "You watch {themHim} walk up the road until {them} is a dot. Then you go back to work.",
              fx: {them:{op:-5},wil:1,happy:-5},
            },
          ],
        },
        {
          id: "fm_grandchild",
          cond: p=>C.adult(p)&&C.hasRel(p,"grandchild"),
          cool: 4,
          w: 1.2,
          title: "Grandchildren",
          setup: (p,ctx)=>setPid(p,ctx,relP(p,["grandchild"])),
          text: "Your grandchild {them} has come to stay for the summer. {them} follows you everywhere and asks about everything, especially the things you did when you were young and foolish.",
          choices: [
            {
              t: "Tell {themHim} the old stories",
              r: "You tell the true ones and the ones you have improved over the years. {them} believes every word.",
              fx: {them:{op:15},happy:8},
            },
            {
              t: "Teach {themHim} your trade",
              r: "Small hands, big mistakes, endless patience. You had forgotten how much you know.",
              fx: {them:{op:10},happy:5,int:.2},
            },
            {
              t: "Spoil {themHim} rotten (3 suns)",
              req: p=>p.coin>=3,
              r: "Honey cakes, a wooden sword, a ribbon. Your own children say you never did this for them. True.",
              fx: {coin:-3,them:{op:18},happy:6,rel:{who:"child",op:-2}},
            },
          ],
        },
        {
          id: "fm_parent_care",
          cond: p=>C.adult(p)&&oldParent(p),
          cool: 6,
          title: "An ageing parent",
          setup: (p,ctx)=>{setPid(p,ctx,A.pick((p.parents||[]).map(A.P).filter(x=>x&&x.alive&&A.stage(x)==="old")))},
          text: "Your {mfa} {them} is failing. {them} forgets names, falls on the step, leaves the fire unbanked. Someone has to take charge.",
          choices: [
            {
              t: "Take {themHim} into your home",
              r: "More work, less sleep, and stories you have never heard before. You would not trade the time.",
              fx: {them:{op:18},happy:-2,wil:1,coin:-3},
            },
            {
              t: "Pay a neighbor to look in daily (5 suns)",
              req: p=>p.coin>=5,
              r: "The neighbor is kind and reliable. You visit on holy days. It is enough. Almost.",
              fx: {coin:-5,them:{op:6}},
            },
            {
              t: "Leave it to your siblings",
              r: "Your siblings do not let you forget it.",
              fx: {them:{op:-10},rel:{who:"sibling",op:-12,all:!0},honor:-2},
            },
          ],
        },
        {
          id: "fm_deathbed",
          cond: p=>C.adult(p)&&oldParent(p),
          cool: 10,
          w: .8,
          title: "A deathbed confession",
          setup: (p,ctx)=>{setPid(p,ctx,A.pick((p.parents||[]).map(A.P).filter(x=>x&&x.alive&&A.stage(x)==="old")));const s=A.pick([["You have a half-brother in {town}. I never told your mother.","sib"],["There is a pot of silver under the hearthstone. I kept it for the worst day. This is it.","coin"],["I was not born in this realm. I fled, long ago, and took a dead man's name.","name"],["I sold your little sister to a family that could feed her, in the hungry year. She would be grown now.","sis"],["I was proud of you. I never said it. I am saying it.","proud"]]);ctx.conf=s[0],ctx.ck=s[1]},
          text: 'Your {mfa} {them} is dying. The priest has come and gone. {them} pulls you close with a hand like dry leaves and whispers: "{conf}"',
          choices: [
            {
              t: "Hold {theirHis} hand and forgive everything",
              r: "You hold {theirHis} hand until the end. {them} goes quietly, eased.",
              fx: (p,ctx)=>{const x=T(ctx),extra=deathbedFx(p,ctx);return bury(p,x,"old age",18,2),x&&A.inheritFrom(p,x),hon(p,1),extra},
            },
            {
              t: "Beg {themHim} to say more",
              r: "{them} tries to answer. There is not enough breath left.",
              fx: (p,ctx)=>{const x=T(ctx),extra=deathbedFx(p,ctx);return bury(p,x,"old age",20,2.2),x&&A.inheritFrom(p,x),A.train(p,"int",.3),extra},
            },
            {
              t: "Turn away in anger",
              r: "You leave the room. When you come back, it is too late to say anything at all.",
              fx: (p,ctx)=>{const x=T(ctx),extra=deathbedFx(p,ctx);return bury(p,x,"old age",24,2.8),x&&A.inheritFrom(p,x),extra},
            },
          ],
        },
        {
          id: "fm_inheritance",
          cond: p=>C.adult(p)&&C.hasRel(p,"sibling")&&deadParent(p),
          once: !0,
          title: "The inheritance",
          setup: (p,ctx)=>{setPid(p,ctx,relP(p,["sibling"])),ctx.prize=A.pick(["the family land","the house and the good bed","the workshop and its tools","the cattle","the silver cup and the family sword"]),ctx.val=12*purse(p)},
          text: 'With your parent gone, your {bs} {them} has claimed {prize}, all of it. "I stayed. I did the work. You left." There may be some truth in it. There may be about {val} suns in it, too.',
          choices: [
            {
              t: "Take it to the lord's court",
              check: {s:"diplomacy",s2:"intrigue",d:46},
              win: {
                r: "The court splits it your way. You win the share, and lose a {bs}.",
                fx: (p,ctx)=>(p.coin+=ctx.val||24,bump(p,T(ctx),-35,"rival","rival"),`(+${ctx.val||24} suns)`),
              },
              lose: {
                r: "The court sides with {them} and fines you for wasting its time.",
                fx: (p,ctx)=>{pay(p,3),bump(p,T(ctx),-30,"rival","rival"),hp(p,-5)},
              },
            },
            {
              t: "Split it fairly, face to face",
              check: {s:"diplomacy",s2:"wil",d:40},
              win: {
                r: "A long, hard night at the kitchen table. You split it down the middle and shake hands.",
                fx: (p,ctx)=>(p.coin+=Math.round((ctx.val||24)/2),A.addOp(p,T(ctx),8),`(+${Math.round((ctx.val||24)/2)} suns)`),
              },
              lose: {r:"It ends in shouting and an overturned table. Nothing is split.",fx:{them:{op:-18},happy:-4}},
            },
            {
              t: "Let {themHim} have it all",
              r: "{them} stares at you, then weeps. A {bs} kept is worth more than {prize}.",
              fx: {them:{op:25},honor:3,wil:.5},
            },
          ],
        },
        {
          id: "fm_sibling_debt",
          cond: p=>C.adult(p)&&live(p,["sibling"]).some(x=>A.isAdult(x.p)),
          cool: 8,
          title: "A sibling in debt",
          setup: (p,ctx)=>{setPid(p,ctx,A.pick(live(p,["sibling"]).filter(x=>A.isAdult(x.p))).p),ctx.debt=A.ri(8,30)},
          text: "Your {bs} {them} owes {debt} suns to a moneylender in {town}, and the moneylender has started sending large men. {them} asks you for help, not quite looking at you.",
          choices: [
            {
              t: "Pay it ({debt} suns)",
              req: (p,C2,ctx)=>p.coin>=(ctx.debt||15),
              r: "Blood is blood. {them} hugs you so hard it hurts.",
              fx: (p,ctx)=>{pay(p,ctx.debt||15),A.addOp(p,T(ctx),20)},
            },
            {
              t: "Go with {themHim} and face the moneylender",
              check: {s:"trade",s2:"wil",d:45},
              win: {
                r: "You talk the moneylender into a fair schedule. He respects a hard bargain.",
                fx: {them:{op:15},skill:{trade:1}},
              },
              lose: {
                r: "The large men are not interested in talk. You both take a beating.",
                fx: {them:{op:10},health:-10,cause:"a beating",wil:1},
              },
            },
            {t:"Refuse",r:"{them} goes away. You hear later {them} lost the house.",fx:{them:{op:-20},wil:.4}},
          ],
        },
        {
          id: "fm_sibling_law",
          cond: p=>C.adult(p)&&live(p,["sibling"]).some(x=>A.isAdult(x.p)),
          cool: 10,
          w: .8,
          title: "A sibling and the law",
          setup: (p,ctx)=>{setPid(p,ctx,A.pick(live(p,["sibling"]).filter(x=>A.isAdult(x.p))).p),ctx.crime=A.pick(["poaching the lord's deer","a knife fight in which a man was badly cut","selling short weight in the market","running untaxed salt","striking a bailiff"])},
          text: "Your {bs} {them} has been taken by the reeve for {crime}. {them} is in the lock-up, and the court sits in three days.",
          choices: [
            {
              t: "Pay the fine and the bribe (12 suns)",
              req: p=>p.coin>=12,
              r: "Money talks. {them} walks out by evening, ashamed and grateful.",
              fx: {coin:-12,them:{op:18},honor:-1},
            },
            {
              t: "Speak for {themHim} before the court",
              check: {s:"diplomacy",s2:"int",d:46},
              win: {r:"You speak well. The court lets {them} off with a warning.",fx:{them:{op:20},fame:1}},
              lose: {
                r: "The court is unmoved. {them} gets the full punishment, and you get looked at sideways.",
                fx: {them:{op:8},honor:-2},
              },
            },
            {
              t: "Help {themHim} slip away in the night",
              check: {s:"stealth",s2:"intrigue",d:52},
              win: {
                r: "A loose bar, a dark lane, a horse at the ford. {them} is gone over the border.",
                fx: {them:{op:25},skill:{stealth:1},honor:-2},
              },
              lose: {r:"You are caught at the ford with the horse.",fx:{them:{op:10},punish:"theft"}},
            },
            {
              t: "Let the law take its course",
              r: "{them} serves the sentence. When {them} comes out, {them} does not speak to you.",
              fx: {them:{op:-20},honor:2},
            },
          ],
        },
        {
          id: "fm_black_sheep",
          cond: p=>C.adult(p)&&C.hasRel(p,"sibling")&&C.ageAdj(p)>=20,
          cool: 12,
          w: .7,
          title: "The black sheep",
          setup: (p,ctx)=>{setPid(p,ctx,relP(p,["sibling"])),ctx.past=A.pick(["ran off with the family savings","joined a band of sellswords","married into a family your parents hated","went to sea with corsairs","was flogged out of the temple"])},
          text: 'Your {bs} {them}, who {past} years ago, is standing at your gate. Thinner. Older. "I have nowhere else to go."',
          choices: [
            {
              t: "Take {themHim} in",
              r: "The family is furious with you. {them} sleeps by your fire and, for once, stays out of trouble.",
              fx: {them:{op:25},rel:{who:"mother",op:-5},happy:2,coin:-2},
            },
            {
              t: "A meal and a coin, then the road",
              r: "Kindness with a door at the end of it. {them} understands.",
              fx: {them:{op:5},coin:-1},
            },
            {
              t: "Shut the gate",
              r: "You hear {themHim} walk away. You tell yourself you had no choice.",
              fx: {them:{op:-25},wil:.6,happy:-3},
            },
          ],
        },
        {
          id: "fm_reunion",
          cond: p=>C.adult(p)&&C.hasRel(p,"sibling")&&C.ageAdj(p)>=26,
          cool: 12,
          title: "After many years",
          setup: (p,ctx)=>setPid(p,ctx,relP(p,["sibling"])),
          text: "You have not seen your {bs} {them} in years: different towns, different lives, a quarrel nobody remembers properly. Now {them} is in {home} for {theirHis} own reasons, and stops at your door.",
          choices: [
            {
              t: "Open the best jug and talk all night",
              r: "You talk until dawn about your parents, your childhood, the quarrel. You laugh until you cry.",
              fx: {them:{op:25},happy:8},
            },
            {
              t: "Settle the old quarrel, once and for all",
              check: {s:"diplomacy",s2:"wil",d:38},
              win: {
                r: "You find out what really happened. It was nobody's fault. You embrace like children.",
                fx: {them:{op:30},happy:6,wil:.5},
              },
              lose: {r:"The old quarrel turns out to be very much alive.",fx:{them:{op:-10},happy:-3}},
            },
            {
              t: "Be polite, and let {themHim} go",
              r: "Strangers who share a nose and a surname. Perhaps that is all.",
              fx: {them:{op:2}},
            },
          ],
        },
        {
          id: "fm_parent_remarry",
          cond: p=>C.adult(p)&&(()=>{const ps=(p.parents||[]).map(A.P).filter(Boolean);return ps.length===2&&ps.some(x=>x.alive)&&ps.some(x=>!x.alive)})(),
          once: !0,
          title: "A parent remarries",
          setup: (p,ctx)=>{const par=(p.parents||[]).map(A.P).find(x=>x&&x.alive);setPid(p,ctx,par),ctx.np=A.givenName(par?par.cult:p.cult,par&&par.sex==="M"?"F":"M"),ctx.wid=par&&par.sex==="M"?"widow":"widower"},
          text: 'Your {mfa} {them} wants to marry again: {np}, a {wid} from {town}. "I am lonely," {them} says, and looks to you for something.',
          choices: [
            {
              t: "Give your blessing",
              r: "You dance at the wedding. {np} turns out to make excellent pies.",
              fx: {them:{op:15},happy:3},
            },
            {
              t: "Object: it is too soon",
              r: "{them} marries anyway, and does not invite you.",
              fx: {them:{op:-20},wil:.5},
            },
            {
              t: "Worry about the inheritance",
              r: "You ask about the will, out loud. {them} looks at you as if you were a stranger.",
              fx: {them:{op:-15},honor:-2,trait:"greedy"},
            },
          ],
        },
        {
          id: "fm_family_feast",
          cond: p=>C.adult(p)&&(C.hasRel(p,"sibling")||C.parentsAlive(p)),
          cool: 5,
          title: "The family feast",
          setup: (p,ctx)=>{ctx.fest=A.pick(["Harvest Home","the Midwinter Vigil","the Slaughter Feast","New Year's Day"]),ctx.old=A.pick(["who got the best bed when your grandmother died","the cow your brother sold","your marriage, or lack of one","who never visits"])},
          text: "The whole family is together for {fest}: a long table, a fat goose, too much ale. By the third jug someone brings up {old}.",
          choices: [
            {
              t: "Make peace with a toast",
              check: {s:"diplomacy",s2:"int",d:38},
              win: {
                r: "You raise your cup to the dead and the living. The table goes quiet, then everyone drinks. The best feast in years.",
                fx: {rel:{who:"sibling",op:8,all:!0},happy:6},
              },
              lose: {r:"Your toast is mocked. The goose gets cold while everyone shouts.",fx:{happy:-3}},
            },
            {
              t: "Join in the shouting",
              r: "A family tradition, in its way. You all go home hoarse and somehow closer.",
              fx: {rel:{who:"sibling",op:-4,all:!0},happy:1},
            },
            {
              t: "Slip out to the yard with the children",
              r: "You play tag in the frost with the little ones. The best part of the night.",
              fx: {happy:5,sta:.2},
            },
          ],
        },
        {
          id: "fm_father_bastard",
          cond: p=>C.adult(p)&&["gentry","noble","royal"].includes(p.status)&&!!A.P(p.parents[0]),
          once: !0,
          w: .7,
          title: "Your father's bastard",
          setup: (p,ctx)=>{const x=mk(p,{ageAdj:C.ageAdj(p)+A.ri(-6,3),status:"peasant"});x.flags.bastard=1,setPid(p,ctx,x)},
          text: "A {mf} of about {themAge} comes to the hall in a mended cloak: {them}, with your father's chin and your father's eyes. {them} has a ring your father gave {theirHis} mother, and asks for nothing but to be known.",
          choices: [
            {
              t: "Acknowledge {themHim} as kin",
              r: "You give {themHim} a seat at the low end of the table. The family is scandalized. {them} will never forget it.",
              fx: {them:{type:"sibling",op:35,back:"sibling"},honor:2,rel:{who:"mother",op:-10},fame:1},
            },
            {
              t: "Give {themHim} silver to go away (10 suns)",
              req: p=>p.coin>=10,
              r: "{them} takes the silver without a word. The ring stays in {theirHis} hand.",
              fx: {coin:-10,them:{type:"acquaint",op:-10}},
            },
            {
              t: "Call {themHim} a liar and have {themHim} thrown out",
              r: "The servants drag {themHim} out. {them} looks back once, with your father's eyes.",
              fx: {them:{type:"enemy",op:-40,back:"enemy"},honor:-3},
            },
          ],
        },
        {
          id: "fm_your_bastard",
          cond: p=>C.adult(p)&&C.male(p)&&["gentry","noble","royal","merchant"].includes(p.status)&&C.ageAdj(p)>=32,
          once: !0,
          w: .6,
          title: "A claim of blood",
          setup: (p,ctx)=>{const x=mk(p,{ageAdj:A.ri(12,18),status:"peasant"});setPid(p,ctx,x),ctx.mom=A.givenName(p.cult,"F")},
          text: `A {bg} of about {themAge}, {them}, stands in your hall. "My mother was {mom}, the miller's daughter at {town}. She said you would know her name." You do. You did not know about this.`,
          choices: [
            {
              t: "Acknowledge {themHim} as your bastard",
              r: "You give {themHim} your name, with the bar sinister. Your household mutters. {them} weeps.",
              fx: (p,ctx)=>{const x=T(ctx);addChild(p,x,45,!0),A.addOp(p,spouseOf(p),-20),hon(p,2),hp(p,3)},
            },
            {
              t: "Find {themHim} a place: a page, an apprentice (8 suns)",
              req: p=>p.coin>=8,
              r: "Not your name, but a future. {them} goes off to learn a trade, and writes to you on holy days.",
              fx: {coin:-8,them:{type:"acquaint",op:20,back:"acquaint"},honor:1},
            },
            {
              t: "Deny everything",
              r: "{them} is shown the door. You lie awake that night, counting the years.",
              fx: {them:{type:"enemy",op:-30,back:"enemy"},honor:-3,wil:.4},
            },
          ],
        },
        {
          id: "fm_legitimize",
          cond: p=>C.adult(p)&&C.flag(p,"bastard"),
          once: !0,
          title: "The bar sinister",
          setup: (p,ctx)=>{ctx.cost=10*purse(p)},
          text: p=>`You have been a bastard all your life: no share of the inheritance, no seat at the high table, a name with a stain on it. A clerk at ${A.realm(p.realm)?A.realm(p.realm).capital:"the capital"} says that for {cost} suns and a good petition, {ruler} might legitimize you.`,
          choices: [
            {
              t: "Petition the crown ({cost} suns)",
              req: (p,C2,ctx)=>p.coin>=(ctx.cost||20),
              check: {s:"diplomacy",s2:"learning",d:48},
              win: {
                r: "The seal comes back red and heavy. You are legitimate, by law if not by gossip.",
                fx: (p,ctx)=>{pay(p,ctx.cost||20),delete p.flags.bastard,hon(p,5),A.fame(p,2),hp(p,10)},
              },
              lose: {
                r: "The petition is lost in some clerk's chest, along with the fee.",
                fx: (p,ctx)=>{pay(p,ctx.cost||20),hp(p,-6),A.willGrow(p,1,"humiliation")},
              },
            },
            {
              t: "Make your own name instead",
              r: "Let them keep their seals. You will be known for what you do.",
              fx: {wil:1.5,trait:"ambitious"},
            },
            {
              t: "Accept what you are",
              r: "A bastard, then. There is a freedom in having nothing to lose.",
              fx: {happy:2,wil:.5},
            },
          ],
        },
        {
          id: "fm_new_friend",
          cond: p=>C.adult(p)&&live(p,["friend","bestfriend"]).length<2,
          cool: 4,
          w: 1.2,
          title: "A new friend?",
          setup: (p,ctx)=>{setPid(p,ctx,A.makeAcquaintance(p,"friend")),ctx.how=A.pick(["you both bet on the same losing cock at the fair","you push a cart out of the mud together","you are both thrown out of the alehouse for singing","you share a bench at the rite and both fall asleep","you both stand up to the reeve's bully at the same moment"])},
          text: "You meet {themFull}, {themOcc}, when {how}. {them} laughs at the same things you do.",
          choices: [
            {
              t: "Buy {themHim} a drink (1 sun)",
              req: p=>p.coin>=1,
              r: "One drink becomes four. By closing time you are telling each other things you have told no one.",
              fx: {coin:-1,them:{type:"friend",op:35,back:"friend"},happy:5},
            },
            {
              t: "Ask {themHim} to help with your work",
              r: "Work shared is work halved. {them} turns out to be steady and funny.",
              fx: {them:{type:"friend",op:28,back:"friend"},sta:.2},
            },
            {
              t: "Nod and go on your way",
              r: "A friendly face in the street. Maybe one day more.",
              fx: {them:{type:"acquaint",op:10}},
            },
          ],
        },
        {
          id: "fm_friend_loan",
          cond: p=>C.adult(p)&&C.hasRel(p,"friend","bestfriend"),
          cool: 7,
          title: "A friend asks for a loan",
          setup: (p,ctx)=>{setPid(p,ctx,relP(p,["friend","bestfriend"])),ctx.amt=A.ri(5,20),ctx.why=A.pick(["a new plough","a fine to the lord","a sick child's medicine","a debt that is due tomorrow","a share in a merchant's venture"])},
          text: "Your friend {them} asks, very quietly, for {amt} suns. For {why}. {them} swears to pay you back by Harvest Home.",
          choices: [
            {
              t: "Lend it ({amt} suns)",
              req: (p,C2,ctx)=>p.coin>=(ctx.amt||10),
              r: "You count it out.",
              fx: (p,ctx)=>{const v=pay(p,ctx.amt||10),t=T(ctx);return A.addOp(p,t,15),A.chance(.6)?(p.coin+=v+1,"{them} pays you back at Harvest Home, with a sun extra and a jug of something good."):(A.addOp(p,t,-5),"Harvest Home comes and goes. {them} avoids your eye. The money is gone, and so is something else.")},
            },
            {
              t: "Give it as a gift, not a loan",
              req: (p,C2,ctx)=>p.coin>=(ctx.amt||10),
              r: '"Keep it. You would do the same." {them} cannot speak.',
              fx: (p,ctx)=>{pay(p,ctx.amt||10),A.addOp(p,T(ctx),25),hon(p,2)},
            },
            {t:"Refuse, kindly",r:"{them} says {them} understands. {them} does not quite.",fx:{them:{op:-10}}},
          ],
        },
        {
          id: "fm_friend_loyalty",
          cond: p=>C.adult(p)&&C.hasRel(p,"friend","bestfriend"),
          cool: 9,
          title: "Loyalty tested",
          setup: (p,ctx)=>{setPid(p,ctx,relP(p,["friend","bestfriend"])),ctx.acc=A.pick(["stealing a silver cup from the lord's table","moving a boundary stone","starting the fire at the tithe barn","cheating at dice and drawing a knife"])},
          text: "Your friend {them} is accused of {acc}. The only one who can say where {them} was that night is you. The accuser is a powerful man. {them} looks at you across the court.",
          choices: [
            {
              t: "Speak the truth for {themHim}, whatever it costs",
              r: "You stand up and say it plain. {them} goes free. The powerful man remembers your face.",
              fx: {them:{op:25},honor:4,favor:-3,newRel:{type:"enemy",op:-25}},
            },
            {
              t: "Say you saw nothing",
              r: "{them} is found guilty. You cannot look at {themHim} as {them} is led away.",
              fx: {them:{type:"enemy",op:-50,back:"enemy"},honor:-6,wil:.5},
            },
            {
              t: "Find the real culprit",
              check: {s:"int",s2:"intrigue",d:50},
              win: {
                r: "You find the real culprit: the accuser's own steward. The court is very embarrassed. {them} will follow you anywhere.",
                fx: {them:{op:30},fame:2,honor:3},
              },
              lose: {
                r: "You find nothing in time. You speak for {them} anyway, and it is barely enough.",
                fx: {them:{op:15},honor:2,health:-2},
              },
            },
          ],
        },
        {
          id: "fm_friend_betrayal",
          cond: p=>C.adult(p)&&C.hasRel(p,"friend","bestfriend"),
          cool: 12,
          w: .7,
          title: "Betrayed",
          setup: (p,ctx)=>{setPid(p,ctx,relP(p,["friend","bestfriend"])),ctx.what=A.pick(["told the whole alehouse the secret you trusted {themHim} with","went behind your back to take the job you were promised","has been selling your ideas as {theirHis} own","informed the reeve about your little sideline"])},
          text: "You learn that your friend {them} {what}. The friend you would have trusted with your life.",
          choices: [
            {
              t: "Confront {themHim}",
              check: {s:"wil",s2:"diplomacy",d:40},
              win: {
                r: "{them} breaks down and tells you why: debt, fear, envy. You do not forgive, but you understand.",
                fx: {them:{type:"acquaint",op:-20},wil:1,int:.2},
              },
              lose: {
                r: "{them} laughs in your face and says you had it coming. It ends with a punch.",
                fx: {them:{type:"enemy",op:-40,back:"enemy"},health:-3,cause:"a brawl",wil:1.2},
              },
            },
            {
              t: "Cut {themHim} off without a word",
              r: "You never speak to {them} again. People notice the silence and ask why.",
              fx: {them:{type:"rival",op:-35,back:"rival"},wil:1.5,trait:"cynical"},
            },
            {
              t: "Forgive {themHim}",
              r: "It is harder than anything you have done. {them} weeps. Whether it was wise, only time will tell.",
              fx: {them:{op:10},honor:2,wil:1},
            },
          ],
        },
        {
          id: "fm_bestfriend",
          cond: p=>C.adult(p)&&live(p,["friend"]).some(x=>x.r.op>=30)&&!C.hasRel(p,"bestfriend"),
          cool: 6,
          title: "A true friend",
          setup: (p,ctx)=>{const l=live(p,["friend"]).filter(x=>x.r.op>=30);setPid(p,ctx,(l.length?A.pick(l):live(p,["friend"])[0]).p),ctx.when=A.pick(["the night your roof caught fire","the winter you were sick","the day the bailiff came","the week after your worst mistake"])},
          text: "Your friend {them} was there {when}. Did not ask, just came with a bucket and stayed. You realize {them} is the closest thing to a {bs} you have chosen for yourself.",
          choices: [
            {
              t: "Swear brotherhood or sisterhood, in the old way",
              r: "A cut thumb, a shared cup, an oath before {god}. {them} is your best friend now, in law and in heart.",
              // [X1 baked patch events/33-no-obvious-choices CHOICE-FM-BESTFRIEND] fm_bestfriend: the blood oath ("a cut thumb")
              // now costs a little health, so the plain words are not simply worse.
              fx: {them:{type:"bestfriend",op:25,back:"bestfriend"},happy:8,honor:2,health:-1},
            },
            {
              t: "Just tell {themHim}",
              r: 'Awkward words, a gruff hug. {them} says "I know, idiot." Best friends, then.',
              fx: {them:{type:"bestfriend",op:20,back:"bestfriend"},happy:6},
            },
            {
              t: "Repay the favor and leave it at that",
              r: "Debts squared, friendship as it was. Some people do not need words.",
              fx: {them:{op:8}},
            },
          ],
        },
        {
          id: "fm_friend_dying",
          cond: p=>C.adult(p)&&C.ageAdj(p)>=30&&C.hasRel(p,"friend","bestfriend"),
          cool: 12,
          w: .6,
          title: "A friend is dying",
          setup: (p,ctx)=>{setPid(p,ctx,relP(p,["bestfriend","friend"])),ctx.ill=A.pick(["a lung fever","a wasting sickness","a wound that turned black","a growth in the belly"])},
          text: "Your friend {them} is dying of {ill}. The healer has stopped coming. {them} sends for you.",
          choices: [
            {
              t: "Sit with {themHim} to the end",
              r: "You sit for three days. You talk about everything, then nothing. {them} dies holding your hand.",
              fx: (p,ctx)=>{bury(p,T(ctx),ctx.ill||"a fever",15,2.2),hon(p,2)},
            },
            {
              t: "Promise to look after {theirHis} family",
              r: "{them} smiles for the last time.",
              fx: (p,ctx)=>(bury(p,T(ctx),ctx.ill||"a fever",12,2),hon(p,4),p.flags.fm_promise=A.S.year,"You keep the promise. It costs you, every year."),
            },
            {
              t: "You cannot bear to watch",
              r: "You stay away. {them} dies asking for you. That stays with you a long time.",
              fx: (p,ctx)=>{bury(p,T(ctx),ctx.ill||"a fever",20,2.8),hon(p,-2)},
            },
          ],
        },
        {
          id: "fm_old_friends",
          cond: p=>C.adult(p)&&C.ageAdj(p)>=28,
          cool: 10,
          title: "An old friend",
          setup: (p,ctx)=>{const have=relP(p,["friend","bestfriend"]),x=have||A.makeAcquaintance(p,"friend");setPid(p,ctx,x),ctx.known=have?"still your friend after all these years, though you see each other once in a blue moon":"your best friend when you were children, before life took you different ways"},
          text: "At the market in {town} you run into {themFull}: {known}. {them} has lines round the eyes now. So do you.",
          choices: [
            {
              t: "Drop everything and spend the day together",
              r: "You walk the old paths, eat bad pies, and laugh like children. It is the best day of your year.",
              // [X1 baked patch events/33-no-obvious-choices CHOICE-FM-OLD-FRIENDS] fm_old_friends: dropping everything for a
              // day now costs the day's earnings.
              fx: {them:{type:"friend",op:30,back:"friend"},happy:8,coin:-10},
            },
            {
              t: "Promise to keep in touch",
              r: "You mean it. You even keep it, for a while.",
              fx: {them:{type:"friend",op:15,back:"friend"},happy:3},
            },
            {
              t: "Make your excuses",
              r: "You were busy. You are always busy. That night you wonder when you became this person.",
              fx: {them:{type:"acquaint",op:-5},happy:-2},
            },
          ],
        },
        {
          id: "fm_friend_wedding",
          cond: p=>C.adult(p)&&C.hasRel(p,"friend","bestfriend"),
          cool: 8,
          title: "A friend's wedding",
          setup: (p,ctx)=>setPid(p,ctx,relP(p,["bestfriend","friend"])),
          text: "Your friend {them} is getting married, and has asked you to stand up and speak at the feast. The whole of {home} will be there, and the ale will be free.",
          choices: [
            {
              t: "Give a speech they will never forget",
              check: {s:"diplomacy",s2:"music",d:40},
              win: {
                r: "You have the hall laughing, then crying, then laughing again. {them} hugs you so hard you lift off the floor.",
                fx: {them:{op:20},fame:1,happy:6},
              },
              lose: {
                r: "You tell the story about the goat. You should not have told the story about the goat.",
                fx: {them:{op:-8},happy:-4},
              },
            },
            {
              t: "A fine gift instead (5 suns)",
              req: p=>p.coin>=5,
              r: "A good copper pot, the envy of every bride in {home}. You mumble three words and sit down.",
              fx: {coin:-5,them:{op:12}},
            },
            {
              t: "Drink too much and dance on the table",
              r: "Not dignified. Very popular. You remember almost none of it.",
              fx: {them:{op:6},happy:7,health:-2},
            },
          ],
        },
        {
          id: "fm_elf_years",
          cond: p=>C.adult(p)&&!C.race(p,"elf")&&!!isLover(p,["elf"]),
          cool: 12,
          title: "Borrowed time",
          setup: (p,ctx)=>setPid(p,ctx,isLover(p,["elf"]).p),
          text: p=>`You found a grey hair this morning. {them} looks exactly as {them} did the day you met, and will look the same when you are ${p.race==="halfelf"?"an old half-elf":"dust"}. An elf can love for centuries. You have decades, at best.`,
          choices: [
            {
              t: "Ask {themHim} how {them} can bear it",
              r: '"Elves grieve for a generation," {them} says. "I will grieve you for longer. It will be worth it." You believe {themHim}.',
              fx: {them:{op:15},wil:1,happy:2},
            },
            {
              t: "Live every day as if it counts",
              r: "You stop counting the years and start filling them. {them} has never seen you so alive.",
              fx: {them:{op:10},happy:6},
            },
            {
              t: "Set {themHim} free to find an elf",
              r: '{them} refuses, angrily. "That is not your choice to make." But something has cracked.',
              fx: {them:{op:-10},wil:1.2,happy:-6},
            },
          ],
        },
        {
          id: "fm_orc_human",
          cond: p=>C.adult(p)&&(C.race(p,"human","halfelf")&&!!isLover(p,["orc","halforc"])||C.race(p,"orc","halforc")&&!!isLover(p,["human"])),
          cool: 10,
          title: "Tusks and prejudice",
          setup: (p,ctx)=>setPid(p,ctx,(isLover(p,C.race(p,"orc","halforc")?["human"]:["orc","halforc"])||{}).p),
          text: p=>p.race==="orc"||p.race==="halforc"?"Your {themRace} love {them} came with you to the clan fire, and the clan-mothers looked at {themHim} as if {them} were a sick calf. Humans burned your grandmothers' tents. Now you bring one home.":"Folk in {home} cross the street when you walk with {them}. A priest has said from the pulpit that orc-blood is beast-blood. Your own family has stopped inviting you.",
          choices: [
            {
              t: "Stand by {themHim} in public, every day",
              r: "You hold {theirHis} hand at the market and stare down anyone who looks. It costs you friends. It earns you {them}.",
              fx: {them:{op:20},wil:1.5,honor:2,rel:{who:"mother",op:-8}},
            },
            {
              t: "Prove them wrong: invite the neighbors to a feast",
              check: {s:"diplomacy",s2:"int",d:48},
              win: {
                r: "Half come out of curiosity. {them} tells stories, laughs loudly, carries the old widow's bench. Minds change, slowly.",
                fx: {them:{op:15},honor:3,fame:1},
              },
              lose: {
                r: "Nobody comes. You and {them} eat the whole goose yourselves, in silence.",
                fx: {them:{op:8},happy:-6,wil:1},
              },
            },
            {
              t: "Keep it hidden",
              r: "You meet in secret, at night. {them} hates it. So do you.",
              fx: {them:{op:-12},happy:-4},
            },
          ],
        },
        {
          id: "fm_halfblood_nowhere",
          cond: p=>C.adult(p)&&C.race(p,"halfelf","halforc"),
          cool: 10,
          title: "Neither one thing nor the other",
          setup: (p,ctx)=>{ctx.a=p.race==="halfelf"?"elves":"orcs",ctx.b="humans",ctx.mark=p.race==="halfelf"?"too-long ears and too-short years":"small tusks and a big laugh"},
          text: '{a} see a human in you. {b} see something else. You have {mark}, and wherever you go someone says "your kind". Tonight, at a wedding, nobody saved you a seat.',
          choices: [
            {
              t: "Find others like you",
              r: "There is a corner of every town where the half-bloods drink. You find yours, and are welcomed without questions.",
              fx: {newRel:{type:"friend",op:40},happy:6},
            },
            {
              t: "Pull up a chair anyway",
              check: {s:"wil",s2:"diplomacy",d:40},
              win: {
                r: "You sit, smile, and talk until they forget what they were whispering about. By the end you are dancing.",
                fx: {happy:6,wil:1,skill:{diplomacy:1}},
              },
              lose: {r:"The table goes cold. You finish your cup and go, head high.",fx:{happy:-5,wil:1.5}},
            },
            {
              t: "Leave, and walk home alone",
              r: "The road is long and the stars do not care what blood you have. That is a comfort, in its way.",
              fx: {happy:-4,wil:1.2},
            },
          ],
        },
        {
          id: "fm_dwarf_human_love",
          cond: p=>C.race(p,"dwarf")&&C.adult(p)&&!C.married(p),
          cool: 15,
          w: .7,
          title: "A love with no children",
          setup: (p,ctx)=>{setPid(p,ctx,mk(p,{race:"human",sex:loveSex(p),ageAdj:22}))},
          text: "{themFull}, a {themRace} {themOcc} who trades at the hold gate, has fallen for you, and you for {themHim}. But dwarves can only have children with dwarves, and {them} will be old in forty years while you are barely in your prime. The clan elders have already heard.",
          choices: [
            {
              t: "Love {themHim} anyway",
              r: "No children, no long years, no clan blessing. Just the two of you. You do not regret it.",
              fx: {them:{type:"lover",op:40,back:"lover"},happy:8,rel:{who:"father",op:-12},honor:-2},
            },
            {
              t: "Choose the clan",
              r: "You tell {them} it cannot be. You go back to the forge and hammer until your arms shake.",
              fx: {them:{type:"friend",op:10,back:"friend"},wil:1.5,happy:-8,skill:{craft:1}},
            },
            {
              t: "Remain friends, and nothing more",
              r: "A friendship with an ache in it. You will outlive {themHim} by a century, and visit the grave.",
              fx: {them:{type:"friend",op:30,back:"friend"},happy:-2},
            },
          ],
        },
        {
          id: "fm_elf_mortal_suitor",
          cond: p=>C.race(p,"elf")&&C.adult(p)&&!C.married(p),
          cool: 15,
          w: .7,
          title: "A mortal heart",
          setup: (p,ctx)=>{setPid(p,ctx,mk(p,{race:"human",sex:loveSex(p),ageAdj:22}))},
          text: "A young {themRace}, {themFull}, has fallen in love with you, with all the hurry of a creature that lives sixty years. {them} brings you flowers that will be dead in a week. You know how this ends: you will plant a sapling over {themHim} and still be young.",
          choices: [
            {
              t: "Let yourself love {themHim}",
              r: "A human love burns fast and bright. For a few decades you will be happier than most elves ever are.",
              fx: {them:{type:"lover",op:40,back:"lover"},happy:10,rel:{who:"mother",op:-8}},
            },
            {
              t: "Be gentle, and say no",
              r: "{them} weeps, then marries a nice miller and names a daughter after you. You watch from the trees.",
              fx: {them:{type:"friend",op:15,back:"friend"},wil:1,happy:-3},
            },
            {
              t: "Tell {themHim} the truth about elven grief",
              r: '"Elves mourn for a generation." {them} listens, and stays anyway. A friend, for now.',
              fx: {them:{type:"friend",op:25,back:"friend"},int:.3},
            },
          ],
        },
        {
          id: "fm_teen_crush",
          cond: p=>C.teen(p)&&!C.flag(p,"fm_crush"),
          cool: 3,
          w: 1.3,
          title: "A crush",
          setup: (p,ctx)=>{const x=A.makeAcquaintance(p,"friend",!0);x.sex=loveSex(p),x.given=A.givenName(x.cult,x.sex),setPid(p,ctx,x)},
          text: "You cannot stop thinking about {them}. The way {them} laughs. The way {them} throws a stone. You have walked past {theirHis} house nine times this week for no reason at all.",
          choices: [
            {
              t: "Talk to {themHim} at the well",
              check: {s:"wil",s2:"diplomacy",d:25},
              win: {
                r: "You say something. {them} says something back. You talk until your mother calls you. The best day of your life so far.",
                fx: {them:{type:"friend",op:30,back:"friend"},happy:10,flag:"fm_crush"},
              },
              lose: {
                r: "You open your mouth and squeak. {them} giggles. You want the earth to swallow you.",
                fx: {them:{type:"acquaint",op:5},happy:-5,wil:.5,flag:"fm_crush"},
              },
            },
            {
              t: "Leave a flower on {theirHis} doorstep",
              r: "{them} finds it, and looks around, and you are sure {them} saw you behind the hedge.",
              fx: {them:{type:"acquaint",op:15},happy:4,flag:"fm_crush"},
            },
            {
              t: "Keep it a secret forever",
              r: "You tell no one. Not even your best friend. It burns quietly all year.",
              fx: {wil:.4,happy:-1,flag:"fm_crush"},
            },
          ],
        },
        {
          id: "fm_teen_dance",
          cond: p=>C.teen(p),
          cool: 3,
          title: "The young people's dance",
          setup: (p,ctx)=>{ctx.fest=A.pick(["May Fair","Harvest Home","Lantern Night"])},
          text: "At {fest} the young people dance on the green while the old ones watch and gossip. Your mother has scrubbed your neck raw. Everyone is looking at everyone.",
          choices: [
            {
              t: "Dance with everyone who will have you",
              check: {s:"spd",s2:"diplomacy",d:25},
              win: {
                r: "You dance every dance. Your feet ache for a week and you have never been happier.",
                fx: {happy:8,newRel:{type:"friend",op:30}},
              },
              lose: {
                r: "You trip over your own feet in front of the whole village. It becomes a story they tell for years.",
                fx: {happy:-5,wil:.6},
              },
            },
            {
              t: "Hang back with your friends and mock the dancers",
              r: "You laugh at everyone and secretly wish you were dancing.",
              fx: {happy:2},
            },
            {
              t: "Ask the shy one in the corner",
              r: "The shy one says yes, and dances like a dream. You both look surprised.",
              fx: {newRel:{type:"friend",op:35},happy:6,honor:1},
            },
          ],
        },
        {
          id: "fm_teen_parent",
          cond: p=>C.teen(p)&&C.parentsAlive(p),
          cool: 4,
          title: "Your future, decided",
          setup: (p,ctx)=>{const par=A.pick((p.parents||[]).map(A.P).filter(x=>x&&x.alive));setPid(p,ctx,par),ctx.plan=A.pick(["take over the family work, as every eldest has","be betrothed to the neighbor's child","go into the temple","stay home and look after the little ones"])},
          text: "Your {mfa} has it all planned: you will {plan}. Nobody asked you. You have other ideas, and tonight they come out at supper.",
          choices: [
            {
              t: "Shout that it is your life",
              r: "Plates rattle. You spend the night in the hayloft, furious and free.",
              fx: {them:{op:-15},wil:1,trait:"stubborn"},
            },
            {
              t: "Argue your case calmly",
              check: {s:"int",s2:"diplomacy",d:28},
              win: {
                r: '{them} listens, astonished. "When did you grow up?" The plan is... reconsidered.',
                fx: {them:{op:8},int:.4,happy:5},
              },
              lose: {r:"{them} hears you out, then says no. At least you tried.",fx:{them:{op:-3},wil:.5}},
            },
            {
              t: "Bow your head and obey",
              r: 'You say "yes" and mean "not forever". {them} is pleased with you.',
              fx: {them:{op:10},happy:-4,wil:.4},
            },
          ],
        },
        {
          id: "fm_teen_sibling",
          cond: p=>C.teen(p)&&C.hasRel(p,"sibling"),
          cool: 4,
          title: "Little brother, little sister",
          setup: (p,ctx)=>setPid(p,ctx,relP(p,["sibling"])),
          text: "Your {bs} {them} broke the good jug and is blaming you. Your father is reaching for his belt. {them} looks at you, terrified.",
          choices: [
            {
              t: "Take the blame",
              r: "You take the strap without a sound. {them} brings you {theirHis} share of supper and never forgets it.",
              fx: {them:{op:25},wil:1,health:-2,honor:2},
            },
            {
              t: "Tell the truth",
              r: "{them} gets the strap. Fair is fair, but {them} sulks for a month.",
              fx: {them:{op:-12},honor:1},
            },
            {
              t: "Claim the cat did it",
              check: {s:"int",s2:"intrigue",d:25},
              win: {
                r: "Your father glares at the cat. The cat glares back. Nobody is punished. {them} thinks you are a genius.",
                fx: {them:{op:15},skill:{intrigue:1},happy:3},
              },
              lose: {r:"Nobody believes the cat did it. You both get the strap.",fx:{them:{op:8},health:-3,wil:.6}},
            },
          ],
        },
        {
          id: "fm_teen_dare",
          cond: p=>C.teen(p)&&C.hasRel(p,"friend","bestfriend"),
          cool: 4,
          title: "A dare",
          setup: (p,ctx)=>{setPid(p,ctx,relP(p,["friend","bestfriend"])),ctx.dare=A.pick(["steal a pie from the baker's sill","climb the temple roof at night","swim the millrace","ring the alarm bell and run"])},
          text: 'Your friend {them} dares you to {dare}. Everyone is watching. {them} grins: "Unless you are scared."',
          choices: [
            {
              t: "Do it",
              check: {s:"spd",s2:"wil",d:28},
              win: {
                r: "You do it, and get away clean. For a week you are a legend among the youngsters of {home}.",
                fx: {them:{op:15},happy:6,spd:.4,trait:"brave"},
              },
              lose: {
                r: "You get caught. Your parents hear about it before you get home.",
                fx: {them:{op:8},happy:-5,health:-2,rel:{who:"father",op:-8}},
              },
            },
            {
              t: '"You first."',
              r: '{them} goes pale, then laughs. "Fair." Neither of you does it, and you are better friends for it.',
              fx: {them:{op:10},int:.2},
            },
            {
              t: "Walk away",
              r: "They call you a coward all summer. You know what you are.",
              fx: {them:{op:-6},wil:.6,happy:-2},
            },
          ],
        },
        {
          id: "fm_teen_betrothal",
          cond: p=>C.teen(p)&&["gentry","noble","royal"].includes(p.status)&&!C.hasRel(p,"betrothed"),
          cool: 6,
          w: .8,
          title: "A betrothal",
          setup: (p,ctx)=>{const x=A.makeAcquaintance(p,"friend",!0);x.sex=loveSex(p),x.given=A.givenName(x.cult,x.sex),x.status=p.status==="royal"?"noble":p.status,setPid(p,ctx,x)},
          text: "Your family has promised you to {them}, of another good house. You are both too young to marry; the wedding will be when you are grown. You met once, at a feast. {them} spilled wine on you.",
          choices: [
            {
              t: "Write {themHim} a polite letter",
              req: p=>p.literate,
              r: "{them} writes back: four lines, misspelled, rather sweet. A start.",
              fx: {them:{type:"betrothed",op:15,back:"betrothed"},skill:{learning:1}},
            },
            {
              t: "Accept it with good grace",
              r: "Your family is pleased. You put it out of your mind for now.",
              fx: {them:{type:"betrothed",op:5,back:"betrothed"},rel:{who:"father",op:6}},
            },
            {
              t: "Sulk and refuse to speak of it",
              r: "Your family ignores your sulking. The contracts are signed regardless.",
              fx: {them:{type:"betrothed",op:-5,back:"betrothed"},wil:.4,happy:-3},
            },
          ],
        },
      ];
    for(const e of EVENTS){if(!e.setup)continue;const s0=e.setup;e.setup=(p,ctx)=>{s0(p,ctx);const tok=A.ctxTokens(p,ctx);for(const k in ctx)typeof ctx[k]=="string"&&ctx[k].indexOf("{")>=0&&(ctx[k]=A.T(ctx[k],tok))}}
    A.defEvents(EVENTS);
    function deathbedFx(p,ctx){switch(ctx.ck){case"sib":{const s=mk(p,{ageAdj:C.ageAdj(p)+A.ri(-6,6)});return s.flags.bastard=1,A.link(p,s,"sibling",0,"sibling"),`(You have a half-${s.sex==="M"?"brother":"sister"}: ${s.given}, living in {town}.)`}case"coin":{const v=8*purse(p);return p.coin+=v,`(Under the hearthstone: ${v} suns.)`}case"name":return A.willGrow(p,.5,"truth"),"(Your family name is a borrowed one. You keep it anyway.)";case"sis":{const s=mk(p,{sex:"F",ageAdj:Math.max(16,C.ageAdj(p)-A.ri(2,8))});return A.link(p,s,"sibling",-5,"sibling"),`(Your lost sister is ${s.given}, ${s.occ||"living somewhere"}. She does not know you.)`}default:return hp(p,6),"(Those words will warm you for the rest of your life.)"}}
  })();
})();
